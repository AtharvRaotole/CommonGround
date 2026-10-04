import { describe, expect, it } from "vitest";
import { evaluateRequiredFact } from "../../packages/contracts/src/index";

describe("required venue facts", () => {
  it("does not pass an unknown accessibility requirement", () => {
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
