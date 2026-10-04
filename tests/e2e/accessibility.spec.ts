import { test, expect } from "@playwright/test";

test.describe("P20 accessibility smoke", () => {
  test("UI-01/02: landing and example shortlist are keyboard reachable at mobile width", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Common Ground" })).toBeVisible();
    await page.keyboard.press("Tab");
    const focused = page.locator(":focus");
    await expect(focused).toBeVisible();

    await page.goto("/example");
    await expect(page.getByRole("heading", { name: "Shortlist" })).toBeVisible();
    await expect(page.getByText(/ordinal compromise/i)).toBeVisible();
    await expect(page.getByText(/percent likelihood/i)).toBeVisible();
    // No key action should require hover-only affordance.
    await page.getByRole("link", { name: /Common Ground/i }).focus();
    await expect(page.getByRole("link", { name: /Common Ground/i })).toBeFocused();
  });

  test("UI-03: status/error regions announce without private taste matrices", async ({ page }) => {
    await page.goto("/example");
    const body = await page.locator("body").innerText();
    expect(body).not.toMatch(/rank matrix|affinity score|member-[a-f0-9]{8} likes/i);
    expect(body).toMatch(/does not reserve a table/i);
  });
});
