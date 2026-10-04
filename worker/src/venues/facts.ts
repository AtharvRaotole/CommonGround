import { evaluateRequiredFact, type FactState } from "@common-ground/contracts";

export type VenueFactRecord = {
  id: string;
  venueId: string;
  field: string;
  value: string | number | boolean | null;
  state: FactState;
  sourceUrl: string | null;
  sourceKind: "official_site" | "host_confirmation" | "qloo" | "synthetic";
  observedAt: string;
  expiresAt: string | null;
  note: string | null;
};

export type VenueRecord = {
  id: string;
  name: string;
  neighborhood: string | null;
  borough: string | null;
  address: string | null;
  category: string | null;
  priceBand: string | null;
  officialUrl: string | null;
  qlooEntityId: string | null;
  qlooMappingStatus: "unknown" | "confirmed" | "rejected";
  facts: VenueFactRecord[];
};

export function isFresh(fact: VenueFactRecord, now = new Date()): boolean {
  if (!fact.expiresAt) return true;
  return Date.parse(fact.expiresAt) > now.getTime();
}

export function effectiveFactState(fact: VenueFactRecord, now = new Date()): FactState {
  if (fact.state === "confirmed" && !isFresh(fact, now)) return "expired";
  return fact.state;
}

/** Required facts that are unknown/expired/conflicting block ready status. */
export function readinessFromRequiredFacts(
  facts: VenueFactRecord[],
  requiredFields: string[],
  now = new Date(),
): "ready" | "needs_confirmation" | "infeasible" {
  let needs = false;
  for (const field of requiredFields) {
    const fact = facts.find((f) => f.field === field);
    if (!fact) {
      needs = true;
      continue;
    }
    const state = effectiveFactState(fact, now);
    const result = evaluateRequiredFact({
      required: true,
      state,
      matches: state === "confirmed" ? true : null,
    });
    if (result === "infeasible") return "infeasible";
    if (result === "needs_confirmation") needs = true;
  }
  return needs ? "needs_confirmation" : "ready";
}

/** Unknown Qloo mappings cannot enter a live slate. */
export function filterLiveQlooCandidates(venues: VenueRecord[]): VenueRecord[] {
  return venues.filter((v) => v.qlooMappingStatus === "confirmed" && !!v.qlooEntityId);
}

export function assertNoUnsupportedClaims(facts: VenueFactRecord[]): string[] {
  const banned = [/allerg/i, /reserv(?:ed|ation) confirmed/i, /guaranteed available/i];
  const violations: string[] = [];
  for (const fact of facts) {
    if (fact.state !== "confirmed") continue;
    const hay = `${fact.field} ${fact.value ?? ""} ${fact.note ?? ""}`;
    for (const re of banned) {
      if (re.test(hay)) violations.push(fact.id);
    }
  }
  return violations;
}
