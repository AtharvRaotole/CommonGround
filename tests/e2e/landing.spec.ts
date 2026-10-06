import { expect, test } from "@playwright/test";

test("landing shows brand and teaching copy", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Common Ground" })).toBeVisible();
  await expect(page.getByText(/not a reservation/i)).toBeVisible();
  await page.getByRole("main").getByRole("link", { name: /guided demo/i }).click();
  await expect(page.getByText(/Synthetic example|Guided demo/i).first()).toBeVisible();
  await expect(page.getByText(/not a live recommendation|ordinal compromise|not a percent/i).first()).toBeVisible();
});
