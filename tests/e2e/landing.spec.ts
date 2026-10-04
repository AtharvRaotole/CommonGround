import { expect, test } from "@playwright/test";

test("landing shows brand and teaching copy", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Common Ground" })).toBeVisible();
  await expect(page.getByText(/not a reservation/i)).toBeVisible();
  await page.getByRole("link", { name: "See a synthetic plan" }).click();
  await expect(page.getByText(/Synthetic example/i)).toBeVisible();
  await expect(page.getByText(/not a percentage chance/i)).toBeVisible();
});
