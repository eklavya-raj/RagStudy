export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "ragstudy-theme";
export const THEME_COOKIE_NAME = "ragstudy-theme";
export const THEMES: Theme[] = ["light", "dark", "system"];

export function isTheme(value: string | null): value is Theme {
  return value !== null && THEMES.includes(value as Theme);
}
