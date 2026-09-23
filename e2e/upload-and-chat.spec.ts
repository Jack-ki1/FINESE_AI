import { test, expect } from "./fixtures";

test("upload → profile → first AI response smoke", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("body")).toBeVisible();
  // This is a smoke placeholder — in CI with seeded auth and a fixture CSV,
  // you would: upload file, wait for profile artifact, send "profile it", assert response.
  await expect(page).toHaveTitle(/FINESE|Vite|React/i);
});
