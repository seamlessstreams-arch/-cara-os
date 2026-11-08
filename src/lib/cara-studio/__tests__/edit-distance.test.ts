import { describe, it, expect } from "vitest";
import { wordChangeScore, splitSections, sectionEditScores } from "../edit-distance";

describe("wordChangeScore", () => {
  it("is 0 for identical text (and for two empties)", () => {
    expect(wordChangeScore("the cat sat on the mat", "the cat sat on the mat")).toBe(0);
    expect(wordChangeScore("", "")).toBe(0);
    expect(wordChangeScore("Hello, World!", "hello world")).toBe(0); // case/punctuation-insensitive
  });
  it("rises with edits and is symmetric", () => {
    const s = wordChangeScore("the cat sat", "the dog ran");
    expect(s).toBeGreaterThan(50); // 4 of 6 words differ
    expect(wordChangeScore("the dog ran", "the cat sat")).toBe(s);
  });
  it("scores a full rewrite at or near 100", () => {
    expect(wordChangeScore("alpha beta", "gamma delta epsilon")).toBe(100);
  });
  it("scores a small edit low", () => {
    const s = wordChangeScore("the quick brown fox jumps", "the quick brown fox leaps");
    expect(s).toBeGreaterThan(0);
    expect(s).toBeLessThan(30);
  });
});

describe("splitSections", () => {
  it("splits on markdown headings", () => {
    const secs = splitSections("# Summary\nAll well.\n## Risks\nNone noted.");
    expect(secs.map((s) => s.key)).toEqual(["summary", "risks"]);
    expect(secs[0].body).toBe("All well.");
    expect(secs[1].body).toBe("None noted.");
  });
  it("splits on bold labels", () => {
    const secs = splitSections("**Voice of the child**\nI felt listened to.");
    expect(secs[0].key).toBe("voice of the child");
  });
  it("treats heading-less text as one body section", () => {
    const secs = splitSections("just a paragraph with no headings");
    expect(secs).toHaveLength(1);
    expect(secs[0].key).toBe("body");
  });
});

describe("sectionEditScores", () => {
  it("scores only the edited section, leaving the untouched one at 0", () => {
    const draft = "# Intro\nhello world\n# Plan\nstep one then step two";
    const committed = "# Intro\nhello world\n# Plan\nstep one then step three and four";
    const scores = sectionEditScores(draft, committed);
    const intro = scores.find((s) => s.section_key === "intro")!;
    const plan = scores.find((s) => s.section_key === "plan")!;
    expect(intro.change_score).toBe(0);
    expect(plan.change_score).toBeGreaterThan(0);
    expect(plan.committed_len).toBeGreaterThan(plan.ai_len);
  });
  it("scores a section present on only one side at 100", () => {
    const scores = sectionEditScores("# A\nkept", "# A\nkept\n# B\nbrand new section");
    const b = scores.find((s) => s.section_key === "b")!;
    expect(b.change_score).toBe(100);
    expect(b.ai_len).toBe(0);
  });
  it("returns an identical-document as all-zero", () => {
    const doc = "# One\nalpha\n# Two\nbeta";
    expect(sectionEditScores(doc, doc).every((s) => s.change_score === 0)).toBe(true);
  });
});
