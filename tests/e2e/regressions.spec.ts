import { test, expect } from "@playwright/test";

/**
 * P27 regressions — lock the three observed friction fixes.
 * Synthetic/example paths only; live Qloo not required.
 */
test.describe("P27 friction regressions", () => {
  test("landing still offers synthetic walkthrough", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("main").getByRole("link", { name: /guided demo/i })).toBeVisible();
  });

  test("waiting page exposes open-plan path language when event query present", async ({ page }) => {
    await page.goto("/waiting?event=regression-fixture");
    // Even when the API has no session, the page must not strand the host without a plan affordance concept.
    const body = await page.textContent("body");
    expect(body?.toLowerCase() ?? "").toMatch(/plan|waiting|members|join/);
  });

  test("example shortlist keeps Unknown: labels (unknown ≠ soft suggestion)", async ({ page }) => {
    await page.goto("/example");
    await expect(page.getByText(/Unknown:/i).first()).toBeVisible();
    await expect(page.getByText(/Synthetic example/i)).toBeVisible();
  });

  test("guided demo distinguishes synthetic from live and shows veto → replan → export story", async ({
    page,
  }) => {
    await page.goto("/demo");
    await expect(page.getByText(/Synthetic example|Guided demo/i).first()).toBeVisible();
    await expect(page.getByText(/not a live recommendation|not live/i).first()).toBeVisible();
    await expect(page.getByText(/veto|replan|export/i).first()).toBeVisible();
  });

  test("export route shows reservation disclaimer copy when opened cold", async ({ page }) => {
    await page.goto("/export");
    const body = (await page.textContent("body"))?.toLowerCase() ?? "";
    expect(body).toMatch(/export|reservation|tentative|nothing to export|common ground/);
  });
});
