import { expect, test } from "@playwright/test";

test.describe("authenticated smoke", () => {
  test("team dashboard loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).not.toHaveURL(/sign-in/);
    await expect(page.locator("body")).toBeVisible();
  });

  test("roster route is reachable from nav when present", async ({ page }) => {
    await page.goto("/");
    const rosterLink = page.getByRole("link", { name: /roster/i }).first();
    if (await rosterLink.isVisible().catch(() => false)) {
      await rosterLink.click();
      await expect(page).toHaveURL(/roster/);
    } else {
      await expect(page.locator("body")).toBeVisible();
    }
  });

  test("calendar and meets links resolve when present", async ({ page }) => {
    await page.goto("/");
    for (const name of [/calendar/i, /meets/i]) {
      const link = page.getByRole("link", { name }).first();
      if (await link.isVisible().catch(() => false)) {
        await link.click();
        await expect(page.locator("body")).toBeVisible();
        await page.goBack();
      }
    }
  });
});
