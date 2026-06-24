import { describe, it, expect } from "vitest";
import { deterministicRewrite } from "../deterministic-rewrite";

// ─────────────────────────────────────────────────────────────────────────────
// Edge-case fixes from the correctness review:
//   1. tidy() must not capitalise the word after an abbreviation/decimal/acronym.
//   2. simplify must not turn a split question into a false declarative.
// ─────────────────────────────────────────────────────────────────────────────

describe("rewrite tidy() — no over-capitalisation after abbreviations/decimals", () => {
  it.each([
    ["She lives in the U.K. now and she didnt mind.", /U\.K\. now/],
    ["Dr. Patel called at 9.30. mum was already there.", /9\.30\. mum/],
    ["The plan was i.e. the agreed review and it went well.", /i\.e\. the/],
  ])("leaves the following word lowercase: %s", (input, expected) => {
    const r = deterministicRewrite("improve_writing", input as string);
    expect(r.text).toMatch(expected as RegExp);
  });

  it("still capitalises a genuine new sentence after a real word", () => {
    const r = deterministicRewrite("improve_writing", "the child didnt want to talk. she said it was hard.");
    expect(r.text.startsWith("The")).toBe(true);
    expect(r.text).toContain(". She said");
  });
});

describe("rewrite simplify — questions are never turned into declaratives", () => {
  it("preserves a long question and does not split it at ', and'", () => {
    const q =
      "Did the young person understand why the staff team were worried about him earlier today, and did he agree to talk it all through with his key worker tomorrow morning?";
    const r = deterministicRewrite("simplify_language", q);
    expect(r.text.trim().endsWith("?")).toBe(true);
    expect(r.text).not.toMatch(/today\.\s+Did/);
  });

  it("still splits a long declarative sentence at ', and'", () => {
    const long =
      "Jordan came home from school in a low mood and did not want any dinner or to speak to staff about his day, and later that evening he went straight to his bedroom to listen to music.";
    const r = deterministicRewrite("simplify_language", long);
    expect(r.text).toContain("his day. Later that evening");
  });
});
