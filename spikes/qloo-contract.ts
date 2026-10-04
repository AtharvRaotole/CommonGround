/**
 * P03 Qloo contract spike.
 *
 * Live mode (requires env QLOO_API_KEY; never log the key or raw proprietary dumps to git):
 *   QLOO_API_KEY=... npx --yes tsx spikes/qloo-contract.ts --live
 *
 * Synthetic parse/CPU rehearsal (default):
 *   npx --yes tsx spikes/qloo-contract.ts
 *
 * Docs: https://docs.qloo.com/reference/qloo-llm-hackathon-developer-guide
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { performance } from "node:perf_hooks";

const BASE = "https://hackathon.api.qloo.com";
const ROOT = resolve(import.meta.dirname ?? ".", "..");
const FIXTURE = resolve(ROOT, "fixtures/synthetic/qloo-contract.json");
const OUT_DIR = resolve(ROOT, "docs/verification/p03-private");

type Json = unknown;

function redactId(id: string): string {
  if (id.length < 12) return "[redacted]";
  return `${id.slice(0, 8)}…${id.slice(-4)}`;
}

function assertNeverSecretInText(text: string, key: string | undefined) {
  if (key && text.includes(key)) {
    throw new Error("Refusing to write output that contains the API key");
  }
}

async function getJson(
  pathWithQuery: string,
  key: string,
): Promise<{ status: number; ms: number; bytes: number; json: Json }> {
  const url = `${BASE}${pathWithQuery}`;
  const t0 = performance.now();
  const res = await fetch(url, {
    method: "GET",
    headers: { "X-Api-Key": key, Accept: "application/json" },
  });
  const buf = await res.arrayBuffer();
  const ms = performance.now() - t0;
  const text = new TextDecoder().decode(buf);
  let json: Json = null;
  try {
    json = JSON.parse(text) as Json;
  } catch {
    json = { parse_error: true, preview: text.slice(0, 200) };
  }
  return { status: res.status, ms, bytes: buf.byteLength, json };
}

function pickEntityIds(json: Json): string[] {
  const root = json as {
    results?: Array<{ entity_id?: string; id?: string }>;
    entities?: Array<{ entity_id?: string; id?: string }>;
  };
  const list = root.results ?? root.entities ?? [];
  if (!Array.isArray(list)) return [];
  return list
    .map((e) => e.entity_id ?? e.id)
    .filter((x): x is string => typeof x === "string");
}

function pickInsightEntities(json: Json): Array<{ id: string; affinity?: number }> {
  const root = json as {
    results?: { entities?: Array<{ entity_id?: string; id?: string; query?: { affinity?: number } }> };
    entities?: Array<{ entity_id?: string; id?: string; query?: { affinity?: number } }>;
  };
  const list = root.results?.entities ?? root.entities ?? [];
  if (!Array.isArray(list)) return [];
  return list
    .map((e) => ({
      id: (e.entity_id ?? e.id) as string,
      affinity: e.query?.affinity,
    }))
    .filter((e) => typeof e.id === "string");
}

async function runLive(key: string) {
  mkdirSync(OUT_DIR, { recursive: true });
  const report: Record<string, unknown> = {
    data_mode: "live_provider",
    base: BASE,
    started: new Date().toISOString(),
    key_present: true,
    key_fingerprint: `sha256-prefix-not-computed;len=${key.length}`,
    steps: [] as unknown[],
  };

  // 1) Search disambiguation — artist
  const searchArtist = await getJson(
    `/search?${new URLSearchParams({ query: "Radiohead", types: "urn:entity:artist", take: "5" })}`,
    key,
  );
  const artistIds = pickEntityIds(searchArtist.json);
  (report.steps as unknown[]).push({
    step: "search_artist",
    status: searchArtist.status,
    ms: Math.round(searchArtist.ms),
    bytes: searchArtist.bytes,
    result_count: artistIds.length,
    ids_redacted: artistIds.slice(0, 5).map(redactId),
  });

  // 2) Search places in NYC catchment (names only — confirm IDs live)
  const venueQueries = [
    "Joe's Pizza New York",
    "Katz's Delicatessen",
    "Peter Luger Steak House",
  ];
  const venueIds: string[] = [];
  for (const q of venueQueries) {
    const r = await getJson(
      `/search?${new URLSearchParams({ query: q, types: "urn:entity:place", take: "3" })}`,
      key,
    );
    const ids = pickEntityIds(r.json);
    if (ids[0]) venueIds.push(ids[0]);
    (report.steps as unknown[]).push({
      step: "search_place",
      query: q,
      status: r.status,
      ms: Math.round(r.ms),
      bytes: r.bytes,
      top_id_redacted: ids[0] ? redactId(ids[0]) : null,
    });
  }

  // 3) Candidate-restricted insights for two synthetic "members"
  const seedA = artistIds[0];
  const movieSearch = await getJson(
    `/search?${new URLSearchParams({ query: "Spirited Away", types: "urn:entity:movie", take: "3" })}`,
    key,
  );
  const seedB = pickEntityIds(movieSearch.json)[0];
  (report.steps as unknown[]).push({
    step: "search_movie",
    status: movieSearch.status,
    ms: Math.round(movieSearch.ms),
    bytes: movieSearch.bytes,
    top_id_redacted: seedB ? redactId(seedB) : null,
  });

  if (seedA && venueIds.length >= 2) {
    const slate = venueIds.slice(0, 8).join(",");
    for (const [label, seed] of [
      ["member_a", seedA],
      ["member_b", seedB ?? seedA],
    ] as const) {
      const params = new URLSearchParams({
        "filter.type": "urn:entity:place",
        "signal.interests.entities": seed,
        "filter.results.entities": slate,
        take: "30",
        "feature.explainability": "true",
      });
      const r = await getJson(`/v2/insights?${params}`, key);
      const returned = pickInsightEntities(r.json);
      const requested = new Set(slate.split(","));
      const returnedIds = new Set(returned.map((x) => x.id));
      const missing = [...requested].filter((id) => !returnedIds.has(id));
      const extra = [...returnedIds].filter((id) => !requested.has(id));
      (report.steps as unknown[]).push({
        step: `insights_candidate_restricted_${label}`,
        status: r.status,
        ms: Math.round(r.ms),
        bytes: r.bytes,
        requested: requested.size,
        returned: returned.length,
        missing_count: missing.length,
        extra_count: extra.length,
        missing_redacted: missing.map(redactId),
        extra_redacted: extra.map(redactId),
        affinities_sample: returned.slice(0, 5).map((x) => ({
          id: redactId(x.id),
          affinity: x.affinity ?? null,
        })),
      });
    }

    // 4) Contradictory filter probe — nonsense tag/filter; detect silent ignore vs empty
    const bad = new URLSearchParams({
      "filter.type": "urn:entity:place",
      "signal.interests.entities": seedA,
      "filter.results.entities": slate,
      "filter.tags": "this-is-not-a-valid-qloo-tag-id",
      take: "5",
    });
    const badR = await getJson(`/v2/insights?${bad}`, key);
    (report.steps as unknown[]).push({
      step: "contradictory_filter_probe",
      status: badR.status,
      ms: Math.round(badR.ms),
      bytes: badR.bytes,
      note: "Compare to baseline; silent ignore is a known guide warning",
      returned: pickInsightEntities(badR.json).length,
    });
  } else {
    (report.steps as unknown[]).push({
      step: "insights_skipped",
      reason: "Missing seed or venue IDs from search",
    });
  }

  const path = resolve(OUT_DIR, "live-contract-redacted.json");
  const text = JSON.stringify(report, null, 2);
  assertNeverSecretInText(text, key);
  writeFileSync(path, text);
  console.log(`Wrote redacted live report: ${path}`);
  console.log(JSON.stringify({ ok: true, steps: (report.steps as unknown[]).length }, null, 2));
}

function runSyntheticParseProbe() {
  const fixture = JSON.parse(readFileSync(FIXTURE, "utf8")) as {
    oversized_parse_probe: { entity_count: number; padding_chars_per_entity: number };
  };
  const n = fixture.oversized_parse_probe.entity_count;
  const pad = "x".repeat(fixture.oversized_parse_probe.padding_chars_per_entity);
  const entities = Array.from({ length: n }, (_, i) => ({
    entity_id: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
    name: `Synthetic Venue ${i}`,
    type: "urn:entity:place",
    properties: { blob: pad, address: "SYNTHETIC", city: "New York" },
    query: { affinity: 1 - i / n, rank: i + 1 },
  }));
  const payload = JSON.stringify({ success: true, results: { entities } });
  const bytes = Buffer.byteLength(payload, "utf8");

  const t0 = performance.now();
  const parsed = JSON.parse(payload) as {
    results: { entities: Array<{ entity_id: string; query: { affinity: number } }> };
  };
  // Trim like a Worker would — drop padding fields
  const trimmed = parsed.results.entities.map((e) => ({
    entity_id: e.entity_id,
    affinity: e.query.affinity,
  }));
  const rank = [...trimmed].sort((a, b) => b.affinity - a.affinity);
  const cpuMs = performance.now() - t0;

  const workersFreeCpuBudgetMs = 10; // documented Free CPU/request target from plan research
  const result = {
    data_mode: "synthetic",
    bytes,
    entity_count: n,
    parse_and_trim_cpu_ms: Number(cpuMs.toFixed(3)),
    workers_free_cpu_budget_ms: workersFreeCpuBudgetMs,
    within_budget_on_this_machine: cpuMs < workersFreeCpuBudgetMs,
    note: "Local Node CPU ≠ Cloudflare isolate; deploy C7 probe still required after key+wrangler.",
    top3: rank.slice(0, 3).map((e) => ({ id: e.entity_id, affinity: e.affinity })),
  };
  console.log(JSON.stringify(result, null, 2));
  mkdirSync(resolve(ROOT, "docs/verification"), { recursive: true });
  writeFileSync(
    resolve(ROOT, "docs/verification/p03-synthetic-parse.json"),
    JSON.stringify(result, null, 2),
  );
}

async function main() {
  const live = process.argv.includes("--live");
  const key = process.env.QLOO_API_KEY?.trim();

  if (live) {
    if (!key) {
      console.error(
        JSON.stringify({
          ok: false,
          error: "QLOO_API_KEY missing",
          action:
            "Submit https://forms.gle/zz12orkLHTAneLGz6 then: QLOO_API_KEY=... npx tsx spikes/qloo-contract.ts --live",
        }),
      );
      process.exit(2);
    }
    await runLive(key);
    return;
  }
  runSyntheticParseProbe();
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
