import {
  EntityCandidateSchema,
  EntityTypeSchema,
  type EntityCandidate,
  type EntityType,
} from "@common-ground/contracts";

export const QLOO_DEFAULT_BASE = "https://hackathon.api.qloo.com";

/** Documented search query keys only — anything else is rejected before fetch. */
export const SEARCH_PARAM_ALLOWLIST = ["query", "types", "take"] as const;

/** Documented Insights place-discovery keys used by P11. */
export const DISCOVERY_PARAM_ALLOWLIST = [
  "filter.type",
  "signal.interests.entities",
  "filter.results.entities",
  "filter.location",
  "filter.location.radius",
  "take",
  "feature.explainability",
] as const;

export type QlooClientOptions = {
  apiKey?: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  /** Injected synthetic catalog for tests / no-key mode. */
  syntheticEntities?: EntityCandidate[];
  /** Force timeout path (tests). */
  forceTimeout?: boolean;
  /** Force HTTP status (tests). */
  forceStatus?: number;
};

export type SearchOutcome =
  | { status: "ok"; dataMode: "synthetic" | "live"; candidates: EntityCandidate[] }
  | { status: "no_match"; dataMode: "synthetic" | "live"; candidates: [] }
  | { status: "timeout"; dataMode: "synthetic" | "live"; candidates: [] }
  | { status: "unavailable"; dataMode: "synthetic" | "live"; candidates: []; httpStatus?: number };

export type DiscoveryOutcome =
  | {
      status: "ok";
      dataMode: "synthetic" | "live";
      entityIds: string[];
      callCount: number;
    }
  | {
      status: "no_results" | "unavailable" | "auth" | "rate_limited" | "invalid";
      dataMode: "synthetic" | "live";
      entityIds: [];
      callCount: number;
      detail?: string;
    };

const DEFAULT_SYNTHETIC: EntityCandidate[] = [
  {
    entityId: "00000000-0000-4000-8000-0000000000a1",
    name: "Synthetic Artist Alpha",
    type: "urn:entity:artist",
    context: "SYNTHETIC — indie rock band (not a real Qloo entity)",
  },
  {
    entityId: "00000000-0000-4000-8000-0000000000a2",
    name: "Synthetic Artist Alpha (Cover Band)",
    type: "urn:entity:artist",
    context: "Ambiguous name case for UI confirmation",
  },
  {
    entityId: "00000000-0000-4000-8000-0000000000b1",
    name: "Synthetic Film Mira",
    type: "urn:entity:movie",
    context: "SYNTHETIC — 2019 drama",
  },
  {
    entityId: "00000000-0000-4000-8000-0000000000b2",
    name: "Synthetic Film Mira (Remake)",
    type: "urn:entity:movie",
    context: "SYNTHETIC — 2024 remake; pick deliberately",
  },
  {
    entityId: "00000000-0000-4000-8000-0000000000c1",
    name: "Synthetic Book Kappa",
    type: "urn:entity:book",
    context: "SYNTHETIC — essay collection",
  },
  {
    entityId: "00000000-0000-4000-8000-0000000000d1",
    name: "Synthetic Place Pier",
    type: "urn:entity:place",
    context: "SYNTHETIC — East Village cafe",
  },
  {
    entityId: "00000000-0000-4000-8000-0000000000d2",
    name: "Synthetic Place Pier Brooklyn",
    type: "urn:entity:place",
    context: "SYNTHETIC — Williamsburg branch; not the Manhattan one",
  },
];

function assertAllowlist(
  params: Record<string, string>,
  allow: readonly string[],
): { ok: true } | { ok: false; bad: string } {
  for (const key of Object.keys(params)) {
    if (!allow.includes(key)) return { ok: false, bad: key };
  }
  return { ok: true };
}

function normalizeType(raw: unknown): EntityType | null {
  if (typeof raw !== "string") return null;
  const parsed = EntityTypeSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

function pickSearchCandidates(json: unknown): EntityCandidate[] {
  const root = json as {
    results?: Array<{
      entity_id?: string;
      id?: string;
      name?: string;
      types?: string[];
      type?: string;
      properties?: { short_description?: string };
    }>;
  };
  const list = Array.isArray(root.results) ? root.results : [];
  const out: EntityCandidate[] = [];
  for (const row of list) {
    const entityId = row.entity_id ?? row.id;
    const type =
      normalizeType(row.types?.[0]) ??
      normalizeType(row.type) ??
      null;
    if (!entityId || !row.name || !type) continue;
    const parsed = EntityCandidateSchema.safeParse({
      entityId,
      name: row.name,
      type,
      context: row.properties?.short_description,
    });
    if (parsed.success) out.push(parsed.data);
  }
  return out;
}

export class QlooClient {
  private readonly apiKey?: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly synthetic: EntityCandidate[];
  private readonly forceTimeout?: boolean;
  private readonly forceStatus?: number;

  constructor(opts: QlooClientOptions = {}) {
    this.apiKey = opts.apiKey?.trim() || undefined;
    this.baseUrl = (opts.baseUrl || QLOO_DEFAULT_BASE).replace(/\/$/, "");
    // Wrap global fetch — Workers throw Illegal invocation if fetch is detached from globalThis.
    this.fetchImpl = opts.fetchImpl ?? ((input, init) => fetch(input, init));
    this.synthetic = opts.syntheticEntities ?? DEFAULT_SYNTHETIC;
    this.forceTimeout = opts.forceTimeout;
    this.forceStatus = opts.forceStatus;
  }

  get hasLiveKey(): boolean {
    return !!this.apiKey;
  }

  /**
   * Entity search. Without a key, uses labeled synthetic catalog (never invents IDs from query text).
   */
  async searchEntities(input: {
    query: string;
    types?: EntityType[];
    take?: number;
  }): Promise<SearchOutcome> {
    const params: Record<string, string> = {
      query: input.query.trim(),
      take: String(Math.min(Math.max(input.take ?? 5, 1), 10)),
    };
    if (input.types?.length) {
      params.types = input.types.join(",");
    }
    const allow = assertAllowlist(params, SEARCH_PARAM_ALLOWLIST);
    if (!allow.ok) {
      throw new Error(`Unsupported search parameter: ${allow.bad}`);
    }

    if (this.forceTimeout) {
      return { status: "timeout", dataMode: this.apiKey ? "live" : "synthetic", candidates: [] };
    }

    if (!this.apiKey) {
      return this.syntheticSearch(params.query, input.types);
    }

    const qs = new URLSearchParams(params);
    const url = `${this.baseUrl}/search?${qs}`;
    // Key only in header — never in URL.
    try {
      const res = await this.fetchImpl(url, {
        method: "GET",
        headers: {
          "X-Api-Key": this.apiKey,
          Accept: "application/json",
        },
      });
      const status = this.forceStatus ?? res.status;
      if (status === 401 || status === 403) {
        return { status: "unavailable", dataMode: "live", candidates: [], httpStatus: status };
      }
      if (status === 429) {
        return { status: "unavailable", dataMode: "live", candidates: [], httpStatus: 429 };
      }
      if (status < 200 || status >= 300) {
        return { status: "unavailable", dataMode: "live", candidates: [], httpStatus: status };
      }
      const text = await res.text();
      let json: unknown;
      try {
        json = JSON.parse(text) as unknown;
      } catch {
        console.error("qloo_search_json_parse_failed", text.slice(0, 120));
        return { status: "unavailable", dataMode: "live", candidates: [], httpStatus: status };
      }
      const candidates = pickSearchCandidates(json);
      if (!candidates.length) {
        return { status: "no_match", dataMode: "live", candidates: [] };
      }
      return { status: "ok", dataMode: "live", candidates: candidates.slice(0, 10) };
    } catch (err) {
      console.error("qloo_search_fetch_failed", err instanceof Error ? err.message : "unknown");
      return { status: "unavailable", dataMode: "live", candidates: [], httpStatus: 0 };
    }
  }

  private syntheticSearch(query: string, types?: EntityType[]): SearchOutcome {
    const q = query.toLowerCase();
    let hits = this.synthetic.filter((e) => e.name.toLowerCase().includes(q));
    if (types?.length) {
      hits = hits.filter((e) => types.includes(e.type));
    }
    if (!hits.length) {
      return { status: "no_match", dataMode: "synthetic", candidates: [] };
    }
    return { status: "ok", dataMode: "synthetic", candidates: hits.slice(0, 10) };
  }

  /**
   * Place discovery for one profiled member. Intersect with catalog happens outside.
   * Validates parameter allowlist; rejects bad units / lon-lat order before fetch.
   */
  async discoverPlaces(input: {
    seedEntityIds: string[];
    catalogEntityIds: string[];
    /** WKT POINT — longitude first. */
    locationWkt?: string;
    /** Insights radius in meters. */
    radiusMeters?: number;
    take?: number;
  }): Promise<DiscoveryOutcome> {
    if (!input.seedEntityIds.length) {
      return {
        status: "invalid",
        dataMode: this.apiKey ? "live" : "synthetic",
        entityIds: [],
        callCount: 0,
        detail: "seedEntityIds required",
      };
    }
    if (input.radiusMeters != null && (!Number.isFinite(input.radiusMeters) || input.radiusMeters <= 0)) {
      return {
        status: "invalid",
        dataMode: this.apiKey ? "live" : "synthetic",
        entityIds: [],
        callCount: 0,
        detail: "radiusMeters must be positive meters",
      };
    }
    if (input.locationWkt) {
      const m = /^POINT\s*\(\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*\)$/i.exec(
        input.locationWkt.trim(),
      );
      if (!m) {
        return {
          status: "invalid",
          dataMode: this.apiKey ? "live" : "synthetic",
          entityIds: [],
          callCount: 0,
          detail: "locationWkt must be POINT(lon lat)",
        };
      }
      const lon = Number(m[1]);
      const lat = Number(m[2]);
      if (Math.abs(lon) > 180 || Math.abs(lat) > 90) {
        return {
          status: "invalid",
          dataMode: this.apiKey ? "live" : "synthetic",
          entityIds: [],
          callCount: 0,
          detail: "coordinates out of range (lon first)",
        };
      }
    }

    const params: Record<string, string> = {
      "filter.type": "urn:entity:place",
      "signal.interests.entities": input.seedEntityIds.join(","),
      take: String(Math.min(input.take ?? 30, 50)),
      "feature.explainability": "true",
    };
    if (input.catalogEntityIds.length) {
      params["filter.results.entities"] = input.catalogEntityIds.join(",");
    }
    if (input.locationWkt) params["filter.location"] = input.locationWkt;
    if (input.radiusMeters != null) {
      params["filter.location.radius"] = String(Math.round(input.radiusMeters));
    }

    const allow = assertAllowlist(params, DISCOVERY_PARAM_ALLOWLIST);
    if (!allow.ok) {
      return {
        status: "invalid",
        dataMode: this.apiKey ? "live" : "synthetic",
        entityIds: [],
        callCount: 0,
        detail: `unsupported param ${allow.bad}`,
      };
    }

    if (!this.apiKey) {
      // Synthetic: return intersection of catalog place IDs that exist in synthetic place entities.
      const places = this.synthetic
        .filter((e) => e.type === "urn:entity:place")
        .map((e) => e.entityId);
      const catalog = new Set(input.catalogEntityIds);
      const ids = places.filter((id) => catalog.has(id));
      // Also allow synthetic place IDs that appear in catalog mapping list even if not in DEFAULT places.
      const merged = [...new Set([...ids, ...input.catalogEntityIds.filter((id) => places.includes(id))])];
      if (!merged.length && input.catalogEntityIds.length) {
        // Keep independently feasible catalog options when discovery truncation would wipe the slate:
        // synthetic mode returns empty discovery IDs — caller merges with catalog fallback.
        return { status: "no_results", dataMode: "synthetic", entityIds: [], callCount: 1 };
      }
      if (!merged.length) {
        return { status: "no_results", dataMode: "synthetic", entityIds: [], callCount: 1 };
      }
      return { status: "ok", dataMode: "synthetic", entityIds: merged.slice(0, 30), callCount: 1 };
    }

    const qs = new URLSearchParams(params);
    const url = `${this.baseUrl}/v2/insights?${qs}`;
    try {
      const res = await this.fetchImpl(url, {
        method: "GET",
        headers: {
          "X-Api-Key": this.apiKey,
          Accept: "application/json",
        },
      });
      const status = this.forceStatus ?? res.status;
      if (status === 401 || status === 403) {
        return { status: "auth", dataMode: "live", entityIds: [], callCount: 1 };
      }
      if (status === 429) {
        return { status: "rate_limited", dataMode: "live", entityIds: [], callCount: 1 };
      }
      if (status < 200 || status >= 300) {
        return { status: "unavailable", dataMode: "live", entityIds: [], callCount: 1 };
      }
      const json = (await res.json()) as {
        results?: { entities?: Array<{ entity_id?: string; id?: string }> };
        entities?: Array<{ entity_id?: string; id?: string }>;
      };
      const list = json.results?.entities ?? json.entities ?? [];
      const ids = (Array.isArray(list) ? list : [])
        .map((e) => e.entity_id ?? e.id)
        .filter((x): x is string => typeof x === "string");
      if (!ids.length) {
        return { status: "no_results", dataMode: "live", entityIds: [], callCount: 1 };
      }
      return { status: "ok", dataMode: "live", entityIds: ids, callCount: 1 };
    } catch {
      return { status: "unavailable", dataMode: "live", entityIds: [], callCount: 1 };
    }
  }

  /**
   * Score one profiled member against a frozen candidate slate (≤30).
   * Same filter.results.entities must be passed for every member.
   * Missing returned IDs stay unknown — never fabricated as affinity 0.
   */
  async scoreCommonSlate(input: {
    seedEntityIds: string[];
    candidateEntityIds: string[];
  }): Promise<ScoreSlateOutcome> {
    const slate = [...new Set(input.candidateEntityIds)].slice(0, 30);
    if (!input.seedEntityIds.length || !slate.length) {
      return {
        status: "invalid",
        dataMode: this.apiKey ? "live" : "synthetic",
        affinities: {},
        returnedIds: [],
        callCount: 0,
      };
    }

    const params: Record<string, string> = {
      "filter.type": "urn:entity:place",
      "signal.interests.entities": input.seedEntityIds.join(","),
      "filter.results.entities": slate.join(","),
      take: String(Math.min(Math.max(slate.length, 1), 50)),
      "feature.explainability": "true",
    };
    const allow = assertAllowlist(params, DISCOVERY_PARAM_ALLOWLIST);
    if (!allow.ok) {
      return {
        status: "invalid",
        dataMode: this.apiKey ? "live" : "synthetic",
        affinities: {},
        returnedIds: [],
        callCount: 0,
        detail: `unsupported param ${allow.bad}`,
      };
    }

    if (!this.apiKey) {
      const affinities: Record<string, number> = {};
      for (const id of slate) {
        // Deterministic synthetic affinity in (0,1) — labeled synthetic, not live evidence.
        affinities[id] = syntheticAffinity(input.seedEntityIds.join(","), id);
      }
      return {
        status: "ok",
        dataMode: "synthetic",
        affinities,
        returnedIds: slate,
        callCount: 1,
      };
    }

    const qs = new URLSearchParams(params);
    const url = `${this.baseUrl}/v2/insights?${qs}`;
    try {
      const res = await this.fetchImpl(url, {
        method: "GET",
        headers: {
          "X-Api-Key": this.apiKey,
          Accept: "application/json",
        },
      });
      const status = this.forceStatus ?? res.status;
      if (status === 401 || status === 403) {
        return { status: "auth", dataMode: "live", affinities: {}, returnedIds: [], callCount: 1 };
      }
      if (status === 429) {
        return {
          status: "rate_limited",
          dataMode: "live",
          affinities: {},
          returnedIds: [],
          callCount: 1,
        };
      }
      if (status < 200 || status >= 300) {
        return {
          status: "unavailable",
          dataMode: "live",
          affinities: {},
          returnedIds: [],
          callCount: 1,
        };
      }
      const json = (await res.json()) as {
        results?: {
          entities?: Array<{
            entity_id?: string;
            id?: string;
            query?: { affinity?: number };
          }>;
        };
        entities?: Array<{
          entity_id?: string;
          id?: string;
          query?: { affinity?: number };
        }>;
      };
      const list = json.results?.entities ?? json.entities ?? [];
      const affinities: Record<string, number> = {};
      const returnedIds: string[] = [];
      const allowed = new Set(slate);
      for (const row of Array.isArray(list) ? list : []) {
        const id = row.entity_id ?? row.id;
        if (!id || !allowed.has(id)) continue;
        const affinity = row.query?.affinity;
        if (typeof affinity !== "number" || !Number.isFinite(affinity)) continue;
        affinities[id] = affinity;
        returnedIds.push(id);
      }
      // Do not invent zeros for missing slate members.
      if (!returnedIds.length) {
        return {
          status: "no_results",
          dataMode: "live",
          affinities: {},
          returnedIds: [],
          callCount: 1,
        };
      }
      return { status: "ok", dataMode: "live", affinities, returnedIds, callCount: 1 };
    } catch {
      return {
        status: "unavailable",
        dataMode: "live",
        affinities: {},
        returnedIds: [],
        callCount: 1,
      };
    }
  }
}

export type ScoreSlateOutcome =
  | {
      status: "ok";
      dataMode: "synthetic" | "live";
      affinities: Record<string, number>;
      returnedIds: string[];
      callCount: number;
    }
  | {
      status: "no_results" | "unavailable" | "auth" | "rate_limited" | "invalid";
      dataMode: "synthetic" | "live";
      affinities: Record<string, never> | Record<string, number>;
      returnedIds: [];
      callCount: number;
      detail?: string;
    };

function syntheticAffinity(seedKey: string, venueId: string): number {
  let h = 0;
  const s = `${seedKey}|${venueId}`;
  for (let i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) >>> 0;
  return ((h % 997) + 1) / 1000;
}

/** Reject unexpected identities: only allow IDs present in the checked catalog. */
export function intersectWithCatalog(
  discoveredIds: string[],
  catalogEntityIds: string[],
): { allowed: string[]; rejected: string[] } {
  const catalog = new Set(catalogEntityIds.filter(Boolean));
  const allowed: string[] = [];
  const rejected: string[] = [];
  for (const id of discoveredIds) {
    if (catalog.has(id)) allowed.push(id);
    else rejected.push(id);
  }
  return { allowed: [...new Set(allowed)], rejected: [...new Set(rejected)] };
}
