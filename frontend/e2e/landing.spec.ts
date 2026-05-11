import { test, expect } from "@playwright/test";

test.describe("Landing page (unauthenticated)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("has correct page title", async ({ page }) => {
    await expect(page).toHaveTitle(/RAGStudy/);
  });

  test("renders hero heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /Chat with your/i })
    ).toBeVisible();
  });

  test("renders all four feature cards", async ({ page }) => {
    const featureTitles = ["Any format", "Instant embeddings", "Streaming chat", "Private by default"];
    for (const title of featureTitles) {
      await expect(page.getByRole("heading", { name: title })).toBeVisible();
    }
  });

  test("shows Get started and Sign in buttons when not logged in", async ({ page }) => {
    const header = page.getByRole("banner");
    const main = page.getByRole("main");
    await expect(header.getByRole("button", { name: "Get started", exact: true })).toBeVisible();
    await expect(header.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
    await expect(main.getByRole("button", { name: "Get started free", exact: true })).toBeVisible();
    await expect(main.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
  });

  test("header shows RAGStudy logo", async ({ page }) => {
    await expect(page.getByText("RAGStudy")).toBeVisible();
  });

  test("header logo links to home page", async ({ page }) => {
    const logo = page.getByRole("link", { name: /RAGStudy/i }).first();
    await expect(logo).toHaveAttribute("href", "/");
  });

  test("hero description is visible", async ({ page }) => {
    await expect(
      page.getByText(/Upload your PDFs, notes, and textbooks/i)
    ).toBeVisible();
  });
});
