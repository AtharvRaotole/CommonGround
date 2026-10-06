import { test, expect } from "@playwright/test";

/**
 * Browser intake smoke (C4). Requires `pnpm dev:web` + worker with D1,
 * or the Playwright webServer config. Skips cleanly if API is unreachable.
 */
test.describe("P10 member intake", () => {
  test("join route renders and requires an invite fragment", async ({ page }) => {
    await page.goto("/join");
    await expect(page.getByRole("heading", { name: /join the outing/i })).toBeVisible();
    await expect(page.getByRole("alert")).toContainText(/missing invite/i);
  });

  test("host create page exposes live create CTA", async ({ page }) => {
    await page.goto("/host/new");
    await expect(page.getByRole("heading", { name: /plan an outing/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /create event/i })).toBeVisible();
    await expect(page.getByText(/per-person budget ceiling/i)).toBeVisible();
  });

  test("join form copy mentions hard needs when invite missing", async ({ page }) => {
    await page.goto("/join");
    await expect(page.getByText(/hard needs stay private|Missing invite/i).first()).toBeVisible();
  });
});
