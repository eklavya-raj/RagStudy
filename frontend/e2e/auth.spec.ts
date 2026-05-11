import { test, expect } from "@playwright/test";

test.describe("Auth protection", () => {
  test("/chat redirects unauthenticated users to home page", async ({ page }) => {
    await page.goto("/chat");
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { name: /Chat with your/i })).toBeVisible();
  });

  test("/dashboard renders without redirecting (client-side auth handling)", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL("/dashboard");
    await expect(page.getByRole("heading", { name: "Documents" })).toBeVisible();
  });
});
