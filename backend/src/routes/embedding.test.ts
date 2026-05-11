import { describe, it, expect } from "vitest";
import { chunkText } from "./embedding";

describe("chunkText", () => {
  it("returns a single chunk for short text", () => {
    const text = "Hello world";
    const chunks = chunkText(text);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toBe("Hello world");
  });

  it("returns empty array for empty string", () => {
    expect(chunkText("")).toHaveLength(0);
  });

  it("returns empty array for whitespace-only string", () => {
    expect(chunkText("   \n\t  ")).toHaveLength(0);
  });

  it("collapses internal whitespace", () => {
    const text = "foo   bar\n\nbaz";
    const chunks = chunkText(text);
    expect(chunks[0]).toBe("foo bar baz");
  });

  it("splits text that exceeds chunkSize", () => {
    const word = "word ";
    const text = word.repeat(400);
    const chunks = chunkText(text, 1500, 150);
    expect(chunks.length).toBeGreaterThan(1);
  });

  it("each chunk does not exceed chunkSize + word boundary slack", () => {
    const text = "hello world ".repeat(300);
    const chunkSize = 500;
    const chunks = chunkText(text, chunkSize, 50);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(chunkSize + 20);
    }
  });

  it("overlapping chunks share content near boundaries", () => {
    const words = Array.from({ length: 600 }, (_, i) => `word${i}`);
    const text = words.join(" ");
    const overlap = 150;
    const chunks = chunkText(text, 1500, overlap);
    if (chunks.length >= 2) {
      const firstEnd = chunks[0].slice(-overlap);
      expect(chunks[1]).toContain(firstEnd.split(" ").slice(-3).join(" "));
    }
  });

  it("handles text exactly equal to chunkSize", () => {
    const text = "a".repeat(1500);
    const chunks = chunkText(text, 1500, 150);
    expect(chunks).toHaveLength(1);
  });
});
