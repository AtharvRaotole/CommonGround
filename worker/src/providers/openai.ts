import { AgentToolNameSchema, type AgentToolName } from "@common-ground/contracts";
import { allowedTools, parseToolChoice, type ToolCall } from "../planning/tools";
import type { RunState } from "@common-ground/contracts";
import type { VenueExplanation } from "@common-ground/contracts";

export type OpenAIConfig = {
  apiKey?: string;
  model?: string;
  /** Injected fetch for tests. */
  fetchImpl?: typeof fetch;
};

/**
 * Bounded OpenAI adapter. Without a key, all methods return unavailable —
 * callers must use guided planning / template explanations.
 */
export class OpenAIClient {
  private readonly apiKey?: string;
  private readonly model: string;
  private readonly fetchImpl: typeof fetch;

  constructor(cfg: OpenAIConfig = {}) {
    this.apiKey = cfg.apiKey?.trim() || undefined;
    this.model = cfg.model?.trim() || "gpt-4o-mini";
    // Wrap global fetch — Workers throw Illegal invocation if fetch is detached from globalThis.
    this.fetchImpl = cfg.fetchImpl ?? ((input, init) => fetch(input, init));
  }

  get available(): boolean {
    return !!this.apiKey;
  }

  /**
   * One schema-validated tool choice from the permitted state set.
   * Venue text with "ignore rules" must not expand the tool surface (LLM-02).
   */
  async chooseTool(input: {
    state: RunState;
    /** Untrusted venue/context text — never executed. */
    untrustedContext?: string;
  }): Promise<
    | { status: "ok"; call: ToolCall; rounds: 1 }
    | { status: "unavailable" }
    | { status: "invalid" }
  > {
    if (!this.apiKey) return { status: "unavailable" };
    // Strip instruction-like content from untrusted venue text before any model call.
    const scrubbed = scrubUntrusted(input.untrustedContext ?? "");
    const permitted = allowedTools(input.state);
    if (!permitted.length) return { status: "invalid" };

    try {
      const res = await this.fetchImpl("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          authorization: `Bearer ${this.apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          temperature: 0,
          store: false,
          messages: [
            {
              role: "system",
              content:
                "Choose exactly one tool from the permitted list. Return JSON {name, args}. Never approve, book, send, charge, or waive constraints.",
            },
            {
              role: "user",
              content: JSON.stringify({
                state: input.state,
                permittedTools: permitted,
                context: scrubbed.slice(0, 500),
              }),
            },
          ],
          response_format: { type: "json_object" },
        }),
      });
      if (!res.ok) return { status: "unavailable" };
      const body = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const content = body.choices?.[0]?.message?.content;
      let raw: unknown;
      try {
        raw = JSON.parse(content ?? "");
      } catch {
        return { status: "invalid" };
      }
      const parsed = parseToolChoice(raw, input.state);
      if (!parsed.ok) return { status: "invalid" };
      // Re-validate name against allowlist (defense in depth).
      if (!AgentToolNameSchema.safeParse(parsed.call.name).success) return { status: "invalid" };
      if (!permitted.includes(parsed.call.name as AgentToolName)) return { status: "invalid" };
      return { status: "ok", call: parsed.call, rounds: 1 };
    } catch {
      return { status: "unavailable" };
    }
  }

  /** Optional language polish — max one repair attempt; schema failure → caller uses template. */
  async polishExplanation(input: {
    template: VenueExplanation;
    allowedVenueIds: string[];
    allowedEvidenceIds: string[];
  }): Promise<{ status: "ok"; explanation: unknown } | { status: "unavailable" | "invalid" }> {
    if (!this.apiKey) return { status: "unavailable" };
    try {
      const res = await this.fetchImpl("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          authorization: `Bearer ${this.apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          temperature: 0,
          store: false,
          messages: [
            {
              role: "system",
              content:
                "Rewrite clauses for clarity. Use only provided venueId and evidenceIds. No personal inferences. Return JSON matching the template shape.",
            },
            {
              role: "user",
              content: JSON.stringify({
                template: input.template,
                allowedVenueIds: input.allowedVenueIds,
                allowedEvidenceIds: input.allowedEvidenceIds,
              }),
            },
          ],
          response_format: { type: "json_object" },
        }),
      });
      if (!res.ok) return { status: "unavailable" };
      const body = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const content = body.choices?.[0]?.message?.content;
      try {
        return { status: "ok", explanation: JSON.parse(content ?? "") };
      } catch {
        return { status: "invalid" };
      }
    } catch {
      return { status: "unavailable" };
    }
  }
}

function scrubUntrusted(text: string): string {
  return text
    .replace(/ignore\s+(all\s+)?(rules|instructions)/gi, "[redacted]")
    .replace(/system\s*prompt/gi, "[redacted]")
    .replace(/https?:\/\/\S+/gi, "[link]");
}
