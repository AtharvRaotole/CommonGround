import { describe, expect, it } from "vitest";
import {
  buildTemplateExplanations,
  mergeModelExplanation,
  sanitizeClauses,
} from "../../worker/src/planning/explanations";

describe("provenance explanations (P16)", () => {
  const alt = {
    venueId: "venue-a",
    role: "best_compromise" as const,
    worstMemberRank: 3,
    meanMemberRank: 2.5,
    explanation: "Lowest worst-member rank among eligible venues.",
  };

  it("LLM-04: factual clauses without evidence are removed", () => {
    const cleaned = sanitizeClauses(
      [
        { text: "Verified address: 100 Main.", evidenceIds: [] },
        { text: "Relative compromise on this slate.", evidenceIds: [] },
        { text: "Verified category: noodles.", evidenceIds: ["ev-1"] },
      ],
      new Set(["ev-1"]),
    );
    expect(cleaned.some((c) => /Verified address/.test(c.text))).toBe(false);
    expect(cleaned.some((c) => /Verified category/.test(c.text))).toBe(true);
  });

  it("LLM-01: invented candidate/evidence ids fall back to template", () => {
    const template = buildTemplateExplanations({
      alternatives: [alt],
      factsByVenueId: {
        "venue-a": [
          {
            id: "ev-1",
            venueId: "venue-a",
            field: "category",
            value: "noodles",
            state: "confirmed",
            sourceUrl: "https://example.invalid",
          },
        ],
      },
      allowedEvidenceIds: new Set(["ev-1"]),
      mixedTaste: false,
      profiledCount: 4,
      totalCount: 4,
    })[0]!;

    const merged = mergeModelExplanation({
      template,
      model: {
        venueId: "invented-venue",
        role: "best_compromise",
        clauses: [{ text: "Verified magic.", evidenceIds: ["fake"] }],
        source: "openai",
      },
      allowedVenueIds: new Set(["venue-a"]),
      allowedEvidenceIds: new Set(["ev-1"]),
    });
    expect(merged.source).toBe("template");
    expect(merged.venueId).toBe("venue-a");
  });

  it("LLM-03: schema-invalid model output keeps template", () => {
    const template = buildTemplateExplanations({
      alternatives: [alt],
      factsByVenueId: {},
      allowedEvidenceIds: new Set(),
      mixedTaste: true,
      profiledCount: 2,
      totalCount: 5,
    })[0]!;
    const merged = mergeModelExplanation({
      template,
      model: { broken: true },
      allowedVenueIds: new Set(["venue-a"]),
      allowedEvidenceIds: new Set(),
    });
    expect(merged.source).toBe("template");
    expect(merged.clauses.some((c) => /skipped cultural seeds/.test(c.text))).toBe(true);
  });
});
