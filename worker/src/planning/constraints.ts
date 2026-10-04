import {
  ConstraintSchema,
  evaluateRequiredFact,
  type Constraint,
  type FactState,
} from "@common-ground/contracts";
import {
  effectiveFactState,
  type VenueFactRecord,
  type VenueRecord,
} from "../venues/facts";

export type ConstraintEval = {
  venueId: string;
  status: "eligible" | "needs_confirmation" | "infeasible";
  reasons: string[];
};

export type SlateFeasibility = {
  readiness: "ready" | "needs_confirmation" | "infeasible";
  eligibleVenueIds: string[];
  needsConfirmationVenueIds: string[];
  infeasibleVenueIds: string[];
  confirmationRequests: string[];
  /** True when every candidate is infeasible — valid explicit state, no fabricated backup. */
  noFeasibleResult: boolean;
};

export function parseConstraint(raw: unknown): Constraint | null {
  const parsed = ConstraintSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export function parseConstraints(raw: unknown[]): Constraint[] {
  const out: Constraint[] = [];
  for (const row of raw) {
    const c = parseConstraint(row);
    if (c) out.push(c);
  }
  return out;
}

/** Model/tool callers cannot waive required constraints — only structured owner edits. */
export function assertModelCannotWaive(_proposal: {
  waiveConstraintIds?: string[];
  rewrite?: unknown;
}): void {
  if (_proposal.waiveConstraintIds?.length || _proposal.rewrite != null) {
    throw new Error("Hard requirements cannot be waived or rewritten by the model");
  }
}

function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

function factFor(venue: VenueRecord, field: string): VenueFactRecord | undefined {
  return venue.facts.find((f) => f.field === field);
}

function evalFactMatch(
  fact: VenueFactRecord | undefined,
  required: boolean,
  matches: boolean | null,
  now: Date,
): ReturnType<typeof evaluateRequiredFact> {
  if (!fact) {
    return evaluateRequiredFact({ required, state: "unknown", matches: null });
  }
  const state: FactState = effectiveFactState(fact, now);
  return evaluateRequiredFact({ required, state, matches: state === "confirmed" ? matches : null });
}

/**
 * Evaluate one venue against participant-owned constraints.
 * Hard requirements run before taste ranking. Unknown ≠ passed.
 */
export function evaluateVenueConstraints(input: {
  venue: VenueRecord;
  constraints: Constraint[];
  now?: Date;
}): ConstraintEval {
  const now = input.now ?? new Date();
  const reasons: string[] = [];
  let needs = false;
  let infeasible = false;

  for (const c of input.constraints) {
    if (c.kind === "veto") {
      if (c.value.venueId === input.venue.id || c.value.venueId === input.venue.qlooEntityId) {
        infeasible = true;
        reasons.push(`veto:${c.id}`);
      }
      continue;
    }

    if (c.kind === "budget") {
      if (c.value.includesTaxTipDrinks === "unknown" && c.required) {
        needs = true;
        reasons.push("budget:all_in_unknown");
      }
      const priceFact = factFor(input.venue, "price_band") ?? factFor(input.venue, "price_cents");
      if (c.value.includesTaxTipDrinks !== "unknown") {
        // Coarse price_band cannot prove exact cost; exact cents can.
        if (priceFact?.field === "price_cents" && typeof priceFact.value === "number") {
          const match = priceFact.value <= c.value.maxCents;
          const result = evalFactMatch(priceFact, c.required, match, now);
          if (result === "infeasible") {
            infeasible = true;
            reasons.push("budget:over_max");
          } else if (result === "needs_confirmation") {
            needs = true;
            reasons.push("budget:needs_confirmation");
          }
        } else if (c.required) {
          // price_band alone is not exact cost proof
          needs = true;
          reasons.push("budget:price_level_not_exact");
        }
      }
      continue;
    }

    if (c.kind === "radius") {
      const latFact = factFor(input.venue, "lat");
      const lonFact = factFor(input.venue, "lon");
      if (
        !latFact ||
        !lonFact ||
        typeof latFact.value !== "number" ||
        typeof lonFact.value !== "number"
      ) {
        if (c.required) {
          needs = true;
          reasons.push("radius:missing_coordinates");
        }
        continue;
      }
      const meters = haversineMeters(
        c.value.centerLat,
        c.value.centerLon,
        latFact.value,
        lonFact.value,
      );
      const match = meters <= c.value.maxMeters;
      const result = evalFactMatch(latFact, c.required, match, now);
      if (result === "infeasible") {
        infeasible = true;
        reasons.push("radius:outside_straight_line");
      } else if (result === "needs_confirmation") {
        needs = true;
        reasons.push("radius:needs_confirmation");
      }
      continue;
    }

    if (c.kind === "time") {
      const hours = factFor(input.venue, "hours");
      const state = hours ? effectiveFactState(hours, now) : ("unknown" as FactState);
      if (state === "expired" && c.required) {
        needs = true;
        reasons.push("time:hours_expired");
        continue;
      }
      const result = evalFactMatch(hours, c.required, hours ? true : null, now);
      if (result === "infeasible") {
        infeasible = true;
        reasons.push("time:infeasible");
      } else if (result === "needs_confirmation") {
        needs = true;
        reasons.push("time:needs_confirmation");
      }
      continue;
    }

    if (c.kind === "access") {
      const fact = factFor(input.venue, c.value.field);
      const match =
        fact && fact.state === "confirmed" ? fact.value === c.value.expected : null;
      const result = evalFactMatch(fact, c.required, match, now);
      if (result === "infeasible") {
        infeasible = true;
        reasons.push(`access:${c.value.field}`);
      } else if (result === "needs_confirmation") {
        needs = true;
        reasons.push(`access:${c.value.field}:needs_confirmation`);
      }
      continue;
    }

    if (c.kind === "dietary") {
      // FACT-02: tags never confirm allergy suitability.
      if (c.value.allergySafeClaim !== false) {
        infeasible = true;
        reasons.push("dietary:illegal_allergy_claim");
        continue;
      }
      if (c.required) {
        needs = true;
        reasons.push("dietary:requires_host_confirmation");
      }
      continue;
    }

    if (c.kind === "category") {
      const cat = (input.venue.category || "").toLowerCase();
      const ok = c.value.categories.some((x) => cat.includes(x.toLowerCase()));
      if (!ok && c.required) {
        if (!input.venue.category) {
          needs = true;
          reasons.push("category:unknown");
        } else {
          infeasible = true;
          reasons.push("category:mismatch");
        }
      }
    }
  }

  if (infeasible) {
    return { venueId: input.venue.id, status: "infeasible", reasons };
  }
  if (needs) {
    return { venueId: input.venue.id, status: "needs_confirmation", reasons };
  }
  return { venueId: input.venue.id, status: "eligible", reasons };
}

/**
 * Apply strictest participant-owned hard constraints before taste ranking.
 * RANK-01: vetoed venues never enter a valid slate.
 */
export function filterSlateByHardConstraints(input: {
  venues: VenueRecord[];
  constraints: Constraint[];
  now?: Date;
}): Omit<SlateFeasibility, "readiness" | "noFeasibleResult" | "confirmationRequests"> & {
  evaluations: ConstraintEval[];
} {
  const evaluations = input.venues.map((venue) =>
    evaluateVenueConstraints({ venue, constraints: input.constraints, now: input.now }),
  );
  return {
    evaluations,
    eligibleVenueIds: evaluations.filter((e) => e.status === "eligible").map((e) => e.venueId),
    needsConfirmationVenueIds: evaluations
      .filter((e) => e.status === "needs_confirmation")
      .map((e) => e.venueId),
    infeasibleVenueIds: evaluations.filter((e) => e.status === "infeasible").map((e) => e.venueId),
  };
}

export function assessSlateReadiness(input: {
  venues: VenueRecord[];
  constraints: Constraint[];
  now?: Date;
}): SlateFeasibility {
  const filtered = filterSlateByHardConstraints(input);
  const confirmationRequests = [
    ...new Set(
      filtered.evaluations
        .filter((e) => e.status === "needs_confirmation")
        .flatMap((e) => e.reasons),
    ),
  ];

  const noFeasibleResult =
    input.venues.length > 0 &&
    filtered.eligibleVenueIds.length === 0 &&
    filtered.needsConfirmationVenueIds.length === 0;

  let readiness: SlateFeasibility["readiness"] = "ready";
  if (noFeasibleResult || filtered.infeasibleVenueIds.length === input.venues.length) {
    readiness = "infeasible";
  } else if (
    filtered.needsConfirmationVenueIds.length > 0 ||
    filtered.eligibleVenueIds.length === 0
  ) {
    readiness = "needs_confirmation";
  }

  return {
    readiness,
    eligibleVenueIds: filtered.eligibleVenueIds,
    needsConfirmationVenueIds: filtered.needsConfirmationVenueIds,
    infeasibleVenueIds: filtered.infeasibleVenueIds,
    confirmationRequests,
    noFeasibleResult: readiness === "infeasible",
  };
}
