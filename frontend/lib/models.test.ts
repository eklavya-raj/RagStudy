import { describe, it, expect } from "vitest";
import { MODELS, DEFAULT_MODEL, isFreeModel } from "./models";

describe("MODELS", () => {
  it("is a non-empty array", () => {
    expect(MODELS.length).toBeGreaterThan(0);
  });

  it("every entry has a non-empty value and label", () => {
    for (const model of MODELS) {
      expect(typeof model.value).toBe("string");
      expect(model.value.length).toBeGreaterThan(0);
      expect(typeof model.label).toBe("string");
      expect(model.label.length).toBeGreaterThan(0);
    }
  });

  it("all values are unique", () => {
    const values = MODELS.map((m) => m.value);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });
});

describe("DEFAULT_MODEL", () => {
  it("is a string", () => {
    expect(typeof DEFAULT_MODEL).toBe("string");
  });

  it("exists in MODELS list", () => {
    expect(MODELS.some((m) => m.value === DEFAULT_MODEL)).toBe(true);
  });
});

describe("isFreeModel", () => {
  it("returns true for :free suffixed models", () => {
    expect(isFreeModel("openai/gpt-oss-120b:free")).toBe(true);
    expect(isFreeModel("google/gemma-4-31b-it:free")).toBe(true);
  });

  it("returns false for paid models", () => {
    expect(isFreeModel("openai/gpt-4o")).toBe(false);
    expect(isFreeModel("openai/gpt-4o-mini")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isFreeModel("")).toBe(false);
  });

  it("is consistent with MODELS entries", () => {
    const freeModels = MODELS.filter((m) => isFreeModel(m.value));
    expect(freeModels.every((m) => m.value.endsWith(":free"))).toBe(true);
  });
});
