import { test, expect } from "@playwright/test";

test.describe("P22 outage-facing copy", () => {
  test("OPS-02: synthetic example stays labeled and available", async ({ page }) => {
    await page.goto("/example");
    await expect(page.getByText(/Synthetic example/i)).toBeVisible();
    await expect(page.getByText(/not a live recommendation/i)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Shortlist" })).toBeVisible();
  });
});
