import { describe, expect, it } from "vitest";
import {
  assertNoUnsupportedClaims,
  effectiveFactState,
  filterLiveQlooCandidates,
  readinessFromRequiredFacts,
  type VenueFactRecord,
  type VenueRecord,
} from "../../worker/src/venues/facts";

const baseFact = (
  overrides: Partial<VenueFactRecord> & Pick<VenueFactRecord, "id" | "field" | "state">,
): VenueFactRecord => ({
  venueId: "V01",
  value: null,
  sourceUrl: null,
  sourceKind: "official_site",
  observedAt: "2026-10-04T00:00:00.000Z",
  expiresAt: null,
  note: null,
  ...overrides,
});

describe("venue facts ledger", () => {
  it("FACT-01: unknown required accessibility blocks ready", () => {
    const facts = [
      baseFact({ id: "f1", field: "step_free", state: "unknown" }),
    ];
    expect(readinessFromRequiredFacts(facts, ["step_free"])).toBe("needs_confirmation");
  });

  it("FACT-03: expired required fact blocks ready", () => {
    const facts = [
      baseFact({
        id: "f2",
        field: "hours",
        state: "confirmed",
        value: "open",
        expiresAt: "2020-01-01T00:00:00.000Z",
      }),
    ];
    expect(effectiveFactState(facts[0]!)).toBe("expired");
    expect(readinessFromRequiredFacts(facts, ["hours"])).toBe("needs_confirmation");
  });

  it("AC02: unknown Qloo mappings cannot enter live slate", () => {
    const venues: VenueRecord[] = [
      {
        id: "V01",
        name: "A",
        neighborhood: null,
        borough: null,
        address: null,
        category: null,
        priceBand: null,
        officialUrl: null,
        qlooEntityId: null,
        qlooMappingStatus: "unknown",
        facts: [],
      },
      {
        id: "V02",
        name: "B",
        neighborhood: null,
        borough: null,
        address: null,
        category: null,
        priceBand: null,
        officialUrl: null,
        qlooEntityId: "11111111-1111-4111-8111-111111111111",
        qlooMappingStatus: "confirmed",
        facts: [],
      },
    ];
    expect(filterLiveQlooCandidates(venues).map((v) => v.id)).toEqual(["V02"]);
  });

  it("AC01: unsupported allergy/booking claims are flagged", () => {
    const facts = [
      baseFact({
        id: "bad",
        field: "allergy_safe",
        state: "confirmed",
        value: "safe for all allergies",
        note: "guaranteed available",
      }),
    ];
    expect(assertNoUnsupportedClaims(facts).length).toBeGreaterThan(0);
  });
});
