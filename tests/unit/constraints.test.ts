import { describe, expect, it } from "vitest";
import {
  ConstraintSchema,
  evaluateRequiredFact,
} from "../../packages/contracts/src/index";
import {
  assertModelCannotWaive,
  assessSlateReadiness,
  evaluateVenueConstraints,
  parseConstraint,
} from "../../worker/src/planning/constraints";
import type { VenueRecord } from "../../worker/src/venues/facts";

function venue(partial: Partial<VenueRecord> & { id: string }): VenueRecord {
  return {
    name: partial.name ?? partial.id,
    neighborhood: null,
    borough: null,
    address: null,
    category: partial.category ?? "restaurant",
    priceBand: partial.priceBand ?? "$$",
    officialUrl: null,
    qlooEntityId: partial.qlooEntityId ?? null,
    qlooMappingStatus: partial.qlooMappingStatus ?? "unknown",
    facts: partial.facts ?? [],
    ...partial,
  };
}

describe("required venue facts (contracts)", () => {
  it("FACT-01: does not pass an unknown accessibility requirement", () => {
    expect(
      evaluateRequiredFact({ required: true, state: "unknown", matches: null }),
    ).toEqual("needs_confirmation");
  });

  it("rejects a known mismatch", () => {
    expect(
      evaluateRequiredFact({ required: true, state: "confirmed", matches: false }),
    ).toEqual("infeasible");
  });

  it("passes a confirmed match", () => {
    expect(
      evaluateRequiredFact({ required: true, state: "confirmed", matches: true }),
    ).toEqual("pass");
  });
});

describe("P13 hard constraints", () => {
  it("FACT-01/AC01: required unknown access blocks ready", () => {
    const c = parseConstraint({
      id: "constraint-access-1",
      ownerId: "member-aaaaaaa1",
      kind: "access",
      required: true,
      value: { field: "step_free", expected: true },
    });
    expect(c).toBeTruthy();
    const evalResult = evaluateVenueConstraints({
      venue: venue({
        id: "V01",
        facts: [
          {
            id: "f1",
            venueId: "V01",
            field: "step_free",
            value: null,
            state: "unknown",
            sourceUrl: null,
            sourceKind: "official_site",
            observedAt: "2026-10-04T12:00:00.000Z",
            expiresAt: null,
            note: null,
          },
        ],
      }),
      constraints: [c!],
    });
    expect(evalResult.status).toBe("needs_confirmation");
  });

  it("FACT-02: dietary tags never confirm allergy safety", () => {
    expect(
      ConstraintSchema.safeParse({
        id: "constraint-diet-1",
        ownerId: "member-aaaaaaa1",
        kind: "dietary",
        required: true,
        value: { tags: ["vegetarian"], allergySafeClaim: true },
      }).success,
    ).toBe(false);

    const ok = parseConstraint({
      id: "constraint-diet-1",
      ownerId: "member-aaaaaaa1",
      kind: "dietary",
      required: true,
      value: { tags: ["vegetarian"], allergySafeClaim: false },
    });
    const evalResult = evaluateVenueConstraints({
      venue: venue({ id: "V02" }),
      constraints: [ok!],
    });
    expect(evalResult.status).toBe("needs_confirmation");
    expect(evalResult.reasons).toContain("dietary:requires_host_confirmation");
  });

  it("FACT-03: radius uses validated coordinates and straight-line distance", () => {
    const c = parseConstraint({
      id: "constraint-radius-1",
      ownerId: "member-aaaaaaa1",
      kind: "radius",
      required: true,
      value: {
        centerLat: 40.73,
        centerLon: -73.99,
        maxMeters: 2000,
        distanceKind: "straight_line",
      },
    });
    const far = evaluateVenueConstraints({
      venue: venue({
        id: "V03",
        facts: [
          {
            id: "lat",
            venueId: "V03",
            field: "lat",
            value: 40.8,
            state: "confirmed",
            sourceUrl: "https://example.invalid",
            sourceKind: "official_site",
            observedAt: "2026-10-04T12:00:00.000Z",
            expiresAt: null,
            note: null,
          },
          {
            id: "lon",
            venueId: "V03",
            field: "lon",
            value: -73.95,
            state: "confirmed",
            sourceUrl: "https://example.invalid",
            sourceKind: "official_site",
            observedAt: "2026-10-04T12:00:00.000Z",
            expiresAt: null,
            note: null,
          },
        ],
      }),
      constraints: [c!],
    });
    expect(far.status).toBe("infeasible");
  });

  it("budget: price level is not exact cost; unknown all-in needs confirmation", () => {
    const c = parseConstraint({
      id: "constraint-budget-1",
      ownerId: "member-aaaaaaa1",
      kind: "budget",
      required: true,
      value: {
        maxCents: 5000,
        currency: "USD",
        includesTaxTipDrinks: "unknown",
      },
    });
    const evalResult = evaluateVenueConstraints({
      venue: venue({ id: "V04", priceBand: "$$" }),
      constraints: [c!],
    });
    expect(evalResult.status).toBe("needs_confirmation");
    expect(evalResult.reasons).toContain("budget:all_in_unknown");
  });

  it("RANK-01/veto: hard-vetoed venue never eligible", () => {
    const c = parseConstraint({
      id: "constraint-veto-1",
      ownerId: "member-aaaaaaa1",
      kind: "veto",
      required: true,
      value: { venueId: "V05" },
    });
    const evalResult = evaluateVenueConstraints({
      venue: venue({ id: "V05" }),
      constraints: [c!],
    });
    expect(evalResult.status).toBe("infeasible");
  });

  it("AC02: model cannot waive or rewrite hard requirements", () => {
    expect(() => assertModelCannotWaive({ waiveConstraintIds: ["x"] })).toThrow(/cannot be waived/);
    expect(() => assertModelCannotWaive({ rewrite: { kind: "budget" } })).toThrow(/cannot be waived/);
  });

  it("AC03: all-candidate infeasible is explicit; no fabricated backup venue", () => {
    const veto = parseConstraint({
      id: "constraint-veto-2",
      ownerId: "member-aaaaaaa1",
      kind: "veto",
      required: true,
      value: { venueId: "V06" },
    })!;
    const veto2 = parseConstraint({
      id: "constraint-veto-3",
      ownerId: "member-aaaaaaa2",
      kind: "veto",
      required: true,
      value: { venueId: "V07" },
    })!;
    const readiness = assessSlateReadiness({
      venues: [venue({ id: "V06" }), venue({ id: "V07" })],
      constraints: [veto, veto2],
    });
    expect(readiness.readiness).toBe("infeasible");
    expect(readiness.noFeasibleResult).toBe(true);
    expect(readiness.eligibleVenueIds).toEqual([]);
  });

  it("expired hours need confirmation before ready", () => {
    const c = parseConstraint({
      id: "constraint-time-1",
      ownerId: "member-aaaaaaa1",
      kind: "time",
      required: true,
      value: {
        localDateTime: "2026-10-10T19:00",
        timezone: "America/New_York",
      },
    });
    const evalResult = evaluateVenueConstraints({
      venue: venue({
        id: "V08",
        facts: [
          {
            id: "hours",
            venueId: "V08",
            field: "hours",
            value: "11-22",
            state: "confirmed",
            sourceUrl: "https://example.invalid",
            sourceKind: "official_site",
            observedAt: "2025-01-01T00:00:00.000Z",
            expiresAt: "2025-06-01T00:00:00.000Z",
            note: null,
          },
        ],
      }),
      constraints: [c!],
      now: new Date("2026-10-04T12:00:00.000Z"),
    });
    expect(evalResult.status).toBe("needs_confirmation");
  });
});
