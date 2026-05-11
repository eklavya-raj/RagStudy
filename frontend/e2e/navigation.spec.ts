import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("clicking RAGStudy logo from landing page stays on /", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /RAGStudy/i }).first().click();
    await expect(page).toHaveURL("/");
  });

  test("Sign in button in header opens Clerk sign-in", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("banner").getByRole("button", { name: "Sign in", exact: true }).click();
    await page.waitForURL(
      (url) => url.hostname.includes("clerk") || url.pathname.includes("sign-in"),
      { timeout: 15_000, waitUntil: "commit" }
    );
    expect(
      page.url().includes("clerk") || page.url().includes("sign-in")
    ).toBe(true);
  });

  test("Get started button opens Clerk sign-up", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Get started free", exact: true }).click();
    await page.waitForURL(
      (url) => url.hostname.includes("clerk") || url.pathname.includes("sign-up"),
      { timeout: 15_000, waitUntil: "commit" }
    );
    expect(
      page.url().includes("clerk") || page.url().includes("sign-up")
    ).toBe(true);
  });

  test("page has no horizontal scroll on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1);
  });
});
