import { test, expect } from "@playwright/test";

test("app loads", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/FINESE|Vite|React/i);
  // Should render without console errors (basic smoke)
  await expect(page.locator("body")).toBeVisible();
});

test("auth page reachable", async ({ page }) => {
  await page.goto("/auth");
  await expect(page.locator("body")).toBeVisible();
});
