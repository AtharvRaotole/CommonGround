import { z } from "zod";

export const FactStateSchema = z.enum([
  "confirmed",
  "unknown",
  "conflicting",
  "expired",
]);
export type FactState = z.infer<typeof FactStateSchema>;

export const HealthResponseSchema = z
  .object({
    ok: z.literal(true),
    service: z.literal("common-ground"),
    revision: z.string().min(1),
    mode: z.enum(["local", "preview", "production"]),
    time: z.string().datetime(),
  })
  .strict();
export type HealthResponse = z.infer<typeof HealthResponseSchema>;

/** Consent copy version recorded with every taste opt-in / skip. */
export const CONSENT_TASTE_VERSION = "2026-10-04-v1";

export const EntityTypeSchema = z.enum([
  "urn:entity:artist",
  "urn:entity:movie",
  "urn:entity:book",
  "urn:entity:place",
]);
export type EntityType = z.infer<typeof EntityTypeSchema>;

export const EntityIdSchema = z
  .string()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    "entityId must be a UUID",
  );

export const EntityCandidateSchema = z
  .object({
    entityId: EntityIdSchema,
    name: z.string().trim().min(1).max(200),
    type: EntityTypeSchema,
    context: z.string().trim().max(400).optional(),
  })
  .strict();
export type EntityCandidate = z.infer<typeof EntityCandidateSchema>;

export const ConfirmedSeedSchema = z
  .object({
    entityId: EntityIdSchema,
    name: z.string().trim().min(1).max(200),
    type: EntityTypeSchema,
    context: z.string().trim().max(400).optional(),
    confirmedAt: z.string().datetime(),
  })
  .strict();
export type ConfirmedSeed = z.infer<typeof ConfirmedSeedSchema>;

export const EntitySearchRequestSchema = z
  .object({
    query: z.string().trim().min(2).max(80),
    types: z.array(EntityTypeSchema).min(1).max(4).optional(),
  })
  .strict();
export type EntitySearchRequest = z.infer<typeof EntitySearchRequestSchema>;

export const EntitySearchResponseSchema = z
  .object({
    status: z.enum(["ok", "no_match", "timeout", "quota", "unavailable"]),
    dataMode: z.enum(["synthetic", "live"]),
    candidates: z.array(EntityCandidateSchema).max(10),
    budgets: z
      .object({
        memberRemaining: z.number().int().nonnegative(),
        eventRemaining: z.number().int().nonnegative(),
      })
      .strict(),
  })
  .strict();
export type EntitySearchResponse = z.infer<typeof EntitySearchResponseSchema>;

export const PreferencesPutSchema = z
  .object({
    seeds: z.array(ConfirmedSeedSchema).max(3),
    consentTaste: z.boolean(),
    skipProfiling: z.boolean().optional(),
    consentVersion: z.literal(CONSENT_TASTE_VERSION),
  })
  .strict();
export type PreferencesPut = z.infer<typeof PreferencesPutSchema>;

/** Application lookup caps (retries count). */
export const LOOKUP_CAPS = {
  perMemberDay: 20,
  perEventDay: 60,
  globalDay: 200,
} as const;

/** Qloo call ceiling for one planning run (discovery + scoring + retries). */
export const QLOO_RUN_CALL_CEILING = 24;

/** Validated discovery request — never built from unvalidated model text. */
export const DiscoverCandidatesInputSchema = z
  .object({
    eventId: z.string().min(8).max(64),
    runId: z.string().min(8).max(64),
    profiledMemberIds: z.array(z.string().min(8).max(64)).min(1).max(8),
    catalogEntityIds: z.array(EntityIdSchema).max(30),
    locationWkt: z
      .string()
      .regex(/^POINT\s*\(\s*-?\d+(?:\.\d+)?\s+-?\d+(?:\.\d+)?\s*\)$/i)
      .optional(),
    radiusMeters: z.number().positive().max(80_000).optional(),
  })
  .strict();
export type DiscoverCandidatesInput = z.infer<typeof DiscoverCandidatesInputSchema>;

export const DiscoverCandidatesOutputSchema = z
  .object({
    status: z.enum(["ok", "no_coverage", "unavailable", "quota", "invalid"]),
    dataMode: z.enum(["synthetic", "live"]),
    candidateEntityIds: z.array(EntityIdSchema),
    catalogFallbackIds: z.array(EntityIdSchema),
    rejectedUnexpectedIds: z.array(z.string()).max(50),
    missingCoverageMemberIds: z.array(z.string()),
    qlooCallsUsed: z.number().int().nonnegative(),
  })
  .strict();
export type DiscoverCandidatesOutput = z.infer<typeof DiscoverCandidatesOutputSchema>;

export type RequiredFactEval =
  | "pass"
  | "needs_confirmation"
  | "infeasible";

export function evaluateRequiredFact(input: {
  required: boolean;
  state: FactState;
  matches: boolean | null;
}): RequiredFactEval {
  if (!input.required) {
    return input.state === "unknown" ? "needs_confirmation" : "pass";
  }
  if (input.state === "unknown" || input.state === "expired" || input.state === "conflicting") {
    return "needs_confirmation";
  }
  if (input.matches === false) return "infeasible";
  if (input.matches === true) return "pass";
  return "needs_confirmation";
}

/** Coverage gates for common-slate ranking (product policy, versioned). */
export const RANK_COVERAGE_POLICY = {
  version: "2026-10-04-v1",
  minSharedFullyRanked: 8,
  minSubmittedCoverage: 0.8,
  maxSlateSize: 30,
} as const;

export const RankCellSchema = z
  .object({
    memberId: z.string().min(8).max(64),
    venueId: EntityIdSchema,
    rank: z.number().positive().nullable(),
    slateSize: z.number().int().positive().max(30),
    status: z.enum(["ranked", "missing", "opted_out"]),
    queryFingerprint: z.string().min(8).max(128),
    source: z.enum(["qloo", "explicit_preference"]),
  })
  .strict();
export type RankCell = z.infer<typeof RankCellSchema>;

export const ConstraintKindSchema = z.enum([
  "budget",
  "radius",
  "time",
  "access",
  "dietary",
  "category",
  "veto",
]);

export const ConstraintSchema = z.discriminatedUnion("kind", [
  z
    .object({
      id: z.string().min(8).max(64),
      ownerId: z.string().min(8).max(64),
      kind: z.literal("budget"),
      required: z.boolean(),
      value: z
        .object({
          maxCents: z.number().int().nonnegative(),
          currency: z.string().length(3),
          includesTaxTipDrinks: z.enum(["included", "excluded", "unknown"]),
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      id: z.string().min(8).max(64),
      ownerId: z.string().min(8).max(64),
      kind: z.literal("radius"),
      required: z.boolean(),
      value: z
        .object({
          centerLat: z.number().gte(-90).lte(90),
          centerLon: z.number().gte(-180).lte(180),
          maxMeters: z.number().positive().max(80_000),
          /** Straight-line only — never travel time. */
          distanceKind: z.literal("straight_line"),
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      id: z.string().min(8).max(64),
      ownerId: z.string().min(8).max(64),
      kind: z.literal("time"),
      required: z.boolean(),
      value: z
        .object({
          localDateTime: z.string().min(10).max(40),
          timezone: z.string().min(1).max(64),
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      id: z.string().min(8).max(64),
      ownerId: z.string().min(8).max(64),
      kind: z.literal("access"),
      required: z.boolean(),
      value: z
        .object({
          field: z.string().min(1).max(64),
          expected: z.union([z.boolean(), z.string(), z.number()]),
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      id: z.string().min(8).max(64),
      ownerId: z.string().min(8).max(64),
      kind: z.literal("dietary"),
      required: z.boolean(),
      value: z
        .object({
          tags: z.array(z.string().min(1).max(40)).max(12),
          /** Dietary tags never confirm allergy/medication safety. */
          allergySafeClaim: z.literal(false),
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      id: z.string().min(8).max(64),
      ownerId: z.string().min(8).max(64),
      kind: z.literal("category"),
      required: z.boolean(),
      value: z.object({ categories: z.array(z.string().min(1).max(40)).min(1).max(8) }).strict(),
    })
    .strict(),
  z
    .object({
      id: z.string().min(8).max(64),
      ownerId: z.string().min(8).max(64),
      kind: z.literal("veto"),
      required: z.literal(true),
      value: z.object({ venueId: z.string().min(1).max(64) }).strict(),
    })
    .strict(),
]);
export type Constraint = z.infer<typeof ConstraintSchema>;
