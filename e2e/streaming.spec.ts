import { test, expect } from "./fixtures";

test("streaming + artifact render smoke", async ({ page }) => {
  await page.goto("/chat");
  await expect(page.locator("body")).toBeVisible();
  // Placeholder: with a logged-in session and a mocked SSE stream,
  // assert that streaming chunks appear and artifacts render.
});
