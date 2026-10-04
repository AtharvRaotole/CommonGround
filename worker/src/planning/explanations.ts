import {
  VenueExplanationSchema,
  type VenueExplanation,
} from "@common-ground/contracts";
import type { CompromiseAlternative } from "./compromise";

export type EvidenceFact = {
  id: string;
  venueId: string;
  field: string;
  value: string | number | boolean | null;
  state: "confirmed" | "unknown" | "conflicting" | "expired";
  sourceUrl: string | null;
};

const ROLE_LABEL: Record<CompromiseAlternative["role"], string> = {
  best_compromise: "Best relative compromise on this slate",
  mean_rank_alternative: "Mean-rank alternative on the same slate",
  familiar_fallback: "Familiar fallback from an explicit prior visit",
};

/**
 * Template explanations — every factual clause must cite an allowlisted evidence id.
 * LLM-04: clauses without provenance are dropped.
 */
export function buildTemplateExplanations(input: {
  alternatives: CompromiseAlternative[];
  factsByVenueId: Record<string, EvidenceFact[]>;
  allowedEvidenceIds: Set<string>;
  mixedTaste: boolean;
  profiledCount: number;
  totalCount: number;
}): VenueExplanation[] {
  const out: VenueExplanation[] = [];
  for (const alt of input.alternatives) {
    const facts = input.factsByVenueId[alt.venueId] ?? [];
    const clauses: VenueExplanation["clauses"] = [
      {
        text: `${ROLE_LABEL[alt.role]}. ${alt.explanation}`,
        evidenceIds: [],
      },
    ];
    for (const fact of facts) {
      if (fact.state !== "confirmed" || !input.allowedEvidenceIds.has(fact.id)) continue;
      const value =
        fact.value === null || fact.value === undefined ? "recorded" : String(fact.value);
      clauses.push({
        text: `Verified ${fact.field.replace(/_/g, " ")}: ${value}.`,
        evidenceIds: [fact.id],
      });
    }
    const unknown = facts.filter((f) => f.state === "unknown" || f.state === "expired");
    for (const fact of unknown.slice(0, 2)) {
      clauses.push({
        text: `We don't have a dated source for ${fact.field.replace(/_/g, " ")}. Treat this as unverified — not as a yes.`,
        evidenceIds: [],
      });
    }
    if (input.mixedTaste) {
      clauses.push({
        text: `Some members skipped cultural seeds (${input.profiledCount}/${input.totalCount}). We won't claim full-group cultural fit.`,
        evidenceIds: [],
      });
    }
    const parsed = VenueExplanationSchema.safeParse({
      venueId: alt.venueId,
      role: alt.role,
      clauses: sanitizeClauses(clauses, input.allowedEvidenceIds),
      source: "template",
    });
    if (parsed.success) out.push(parsed.data);
  }
  return out;
}

/** Drop factual-looking clauses that cite unknown evidence ids (LLM-01/04). */
export function sanitizeClauses(
  clauses: VenueExplanation["clauses"],
  allowedEvidenceIds: Set<string>,
): VenueExplanation["clauses"] {
  return clauses
    .map((c) => ({
      ...c,
      evidenceIds: c.evidenceIds.filter((id) => allowedEvidenceIds.has(id)),
    }))
    .filter((c) => {
      // Non-factual relative/unknown copy may have empty evidence.
      const looksFactual = /verified|confirmed|source|official/i.test(c.text);
      if (looksFactual && c.evidenceIds.length === 0) return false;
      return c.text.trim().length > 0;
    })
    .slice(0, 6);
}

/**
 * Merge optional model language over template backbone.
 * Invented venue/evidence ids → reject model clauses, keep template (LLM-01/03).
 */
export function mergeModelExplanation(input: {
  template: VenueExplanation;
  model: unknown;
  allowedVenueIds: Set<string>;
  allowedEvidenceIds: Set<string>;
}): VenueExplanation {
  const parsed = VenueExplanationSchema.safeParse(input.model);
  if (!parsed.success) return input.template;
  if (!input.allowedVenueIds.has(parsed.data.venueId)) return input.template;
  if (parsed.data.venueId !== input.template.venueId) return input.template;
  const clauses = sanitizeClauses(parsed.data.clauses, input.allowedEvidenceIds);
  if (!clauses.length) return input.template;
  return {
    venueId: input.template.venueId,
    role: input.template.role,
    clauses,
    source: "openai",
  };
}
