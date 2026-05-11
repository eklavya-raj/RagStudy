import { describe, it, expect } from "vitest";
import { isTheme, THEMES, THEME_COOKIE_NAME, THEME_STORAGE_KEY } from "./theme";

describe("isTheme", () => {
  it("returns true for valid themes", () => {
    expect(isTheme("light")).toBe(true);
    expect(isTheme("dark")).toBe(true);
    expect(isTheme("system")).toBe(true);
  });

  it("returns false for invalid strings", () => {
    expect(isTheme("auto")).toBe(false);
    expect(isTheme("")).toBe(false);
    expect(isTheme("DARK")).toBe(false);
    expect(isTheme("Light")).toBe(false);
  });

  it("returns false for null", () => {
    expect(isTheme(null)).toBe(false);
  });

  it("THEMES array contains exactly light, dark, system", () => {
    expect(THEMES).toHaveLength(3);
    expect(THEMES).toContain("light");
    expect(THEMES).toContain("dark");
    expect(THEMES).toContain("system");
  });
});

describe("theme constants", () => {
  it("THEME_COOKIE_NAME and THEME_STORAGE_KEY are non-empty strings", () => {
    expect(typeof THEME_COOKIE_NAME).toBe("string");
    expect(THEME_COOKIE_NAME.length).toBeGreaterThan(0);
    expect(typeof THEME_STORAGE_KEY).toBe("string");
    expect(THEME_STORAGE_KEY.length).toBeGreaterThan(0);
  });
});
