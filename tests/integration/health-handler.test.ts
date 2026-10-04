import { describe, expect, it } from "vitest";
import worker from "../../worker/src/index";

describe("worker health route", () => {
  it("returns intended revision without secrets", async () => {
    const response = await worker.fetch(
      new Request("https://example.test/api/health"),
      { ENVIRONMENT: "preview", GIT_SHA: "deadbeefcafebabe01234567" },
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as Record<string, unknown>;
    expect(body).toMatchObject({
      ok: true,
      service: "common-ground",
      mode: "preview",
      revision: "deadbeefcafe",
    });
    expect(JSON.stringify(body).toLowerCase()).not.toContain("api");
    expect(JSON.stringify(body)).not.toMatch(/sk-|qloo_api_key/i);
  });
});
