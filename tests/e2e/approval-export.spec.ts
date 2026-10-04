import { test, expect } from "@playwright/test";

test.describe("P18 export teaching copy", () => {
  test("EXPORT-03: example states approval is not a reservation", async ({ page }) => {
    await page.goto("/example");
    await expect(page.getByText(/does not reserve a table/i)).toBeVisible();
  });
});
