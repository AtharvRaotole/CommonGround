import { test, expect } from "@playwright/test";

test.describe("P17 veto copy", () => {
  test("shortlist example exposes private veto affordance language", async ({ page }) => {
    await page.goto("/example");
    await expect(page.getByText(/Synthetic example/i)).toBeVisible();
    await expect(page.getByText(/ordinal compromise/i)).toBeVisible();
  });
});
