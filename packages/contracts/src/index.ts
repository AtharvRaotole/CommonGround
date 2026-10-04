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
