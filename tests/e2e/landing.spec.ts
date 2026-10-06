import { expect, test } from "@playwright/test";

test("landing shows brand and teaching copy", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /Common Ground/i }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: /Agree on the place/i })).toBeVisible();
  await expect(page.getByText(/not a reservation/i)).toBeVisible();
  await page.getByRole("main").getByRole("link", { name: /guided demo/i }).click();
  await expect(page.getByText(/Demo data only|not a live recommendation/i).first()).toBeVisible();
  await expect(page.getByRole("region", { name: /Product story film/i })).toBeVisible();
});
