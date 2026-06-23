import { describe, it, expect } from "vitest";
import { diffWords, hasChanges, changeCount, type DiffSegment } from "../text-diff";

const before = (segs: DiffSegment[]) => segs.filter((s) => s.type !== "added").map((s) => s.text).join("");
const after = (segs: DiffSegment[]) => segs.filter((s) => s.type !== "removed").map((s) => s.text).join("");

describe("diffWords", () => {
  it("reports no changes for identical text", () => {
    const segs = diffWords("Jordan had a good day.", "Jordan had a good day.");
    expect(hasChanges(segs)).toBe(false);
    expect(segs.every((s) => s.type === "same")).toBe(true);
  });

  it("is lossless — segments reconstruct both the original and the rewrite", () => {
    const cases: Array<[string, string]> = [
      ["the child didnt talk", "The child didn't talk"],
      ["Jordan was non-compliant today", "Jordan was finding it hard to meet this expectation today"],
      ["Staff utilised the vehicle", "Staff used the vehicle"],
      ["", "Some new text"],
      ["Old text removed entirely", ""],
      ["a b c d e", "a x c y e"],
    ];
    for (const [b, a] of cases) {
      const segs = diffWords(b, a);
      expect(before(segs)).toBe(b);
      expect(after(segs)).toBe(a);
    }
  });

  it("marks a substituted word as removed + added", () => {
    const segs = diffWords("Jordan was non-compliant", "Jordan was finding it hard");
    expect(segs.some((s) => s.type === "removed" && s.text.includes("non-compliant"))).toBe(true);
    expect(segs.some((s) => s.type === "added" && s.text.includes("finding it hard"))).toBe(true);
    // The unchanged opening is preserved as a single same-segment.
    expect(segs[0]).toEqual({ type: "same", text: "Jordan was " });
  });

  it("counts the number of changed runs", () => {
    const segs = diffWords("a b c d e", "a x c y e");
    // b→x and d→y => 4 change runs (two removed + two added)
    expect(changeCount(segs)).toBe(4);
    expect(hasChanges(segs)).toBe(true);
  });

  it("preserves UK-spelling fixes as discrete changes", () => {
    const segs = diffWords("staff noted the behavior", "staff noted the behaviour");
    expect(before(segs)).toBe("staff noted the behavior");
    expect(after(segs)).toBe("staff noted the behaviour");
    expect(hasChanges(segs)).toBe(true);
  });
});
