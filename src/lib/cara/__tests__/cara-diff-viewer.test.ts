import { describe, it, expect } from "vitest";
import { _testing } from "@/components/cara/cara-diff-viewer";

const { computeWordDiff, countChanges } = _testing;

// ── computeWordDiff ─────────────────────────────────────────────────────────

describe("computeWordDiff", () => {
  it("returns all same for identical text", () => {
    const diff = computeWordDiff("hello world", "hello world");
    const nonWhitespace = diff.filter((d) => d.text.trim());
    expect(nonWhitespace.every((d) => d.type === "same")).toBe(true);
  });

  it("detects added words", () => {
    const diff = computeWordDiff("hello world", "hello beautiful world");
    const added = diff.filter((d) => d.type === "added" && d.text.trim());
    expect(added.length).toBeGreaterThan(0);
    expect(added.some((d) => d.text === "beautiful")).toBe(true);
  });

  it("detects removed words", () => {
    const diff = computeWordDiff("hello beautiful world", "hello world");
    const removed = diff.filter((d) => d.type === "removed" && d.text.trim());
    expect(removed.length).toBeGreaterThan(0);
    expect(removed.some((d) => d.text === "beautiful")).toBe(true);
  });

  it("handles completely different text", () => {
    const diff = computeWordDiff("foo bar", "baz qux");
    const changes = diff.filter(
      (d) => d.type !== "same" && d.text.trim(),
    );
    expect(changes.length).toBeGreaterThan(0);
  });

  it("handles empty original", () => {
    const diff = computeWordDiff("", "hello world");
    const added = diff.filter((d) => d.type === "added");
    expect(added.length).toBeGreaterThan(0);
  });

  it("handles empty generated", () => {
    const diff = computeWordDiff("hello world", "");
    const removed = diff.filter((d) => d.type === "removed");
    expect(removed.length).toBeGreaterThan(0);
  });

  it("handles both empty", () => {
    const diff = computeWordDiff("", "");
    expect(diff).toHaveLength(1); // single empty string match
  });
});

// ── countChanges ────────────────────────────────────────────────────────────

describe("countChanges", () => {
  it("returns zero for identical text diff", () => {
    const diff = computeWordDiff("hello world", "hello world");
    const { added, removed } = countChanges(diff);
    expect(added).toBe(0);
    expect(removed).toBe(0);
  });

  it("counts additions", () => {
    const diff = computeWordDiff("hello world", "hello beautiful world");
    const { added } = countChanges(diff);
    expect(added).toBeGreaterThan(0);
  });

  it("counts removals", () => {
    const diff = computeWordDiff("hello beautiful world", "hello world");
    const { removed } = countChanges(diff);
    expect(removed).toBeGreaterThan(0);
  });

  it("ignores whitespace-only changes", () => {
    const { added, removed } = countChanges([
      { type: "same", text: "hello" },
      { type: "added", text: " " },
      { type: "same", text: "world" },
    ]);
    expect(added).toBe(0);
    expect(removed).toBe(0);
  });
});
