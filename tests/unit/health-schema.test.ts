import { describe, expect, it } from "vitest";
import { HealthResponseSchema } from "../../packages/contracts/src/index";

describe("health response contract", () => {
  it("accepts a well-formed health payload", () => {
    const parsed = HealthResponseSchema.parse({
      ok: true,
      service: "common-ground",
      revision: "abc123def456",
      mode: "local",
      time: new Date().toISOString(),
    });
    expect(parsed.ok).toBe(true);
  });

  it("rejects unknown fields (strict contract)", () => {
    expect(() =>
      HealthResponseSchema.parse({
        ok: true,
        service: "common-ground",
        revision: "abc",
        mode: "local",
        time: new Date().toISOString(),
        unexpected: true,
      }),
    ).toThrow();
  });
});
