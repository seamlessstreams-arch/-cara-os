import { describe, it, expect } from "vitest";
import { deterministicRewrite, type RewriteMode } from "../deterministic-rewrite";

// ─────────────────────────────────────────────────────────────────────────────
// §5 Transparency — every deterministic rewrite explains which rules it applied,
// in plain English, so it is never presented as opaque AI output.
// ─────────────────────────────────────────────────────────────────────────────

describe("rewrite explainability (applied-rule notes)", () => {
  it("improve_writing reports the corrections it made", () => {
    const r = deterministicRewrite("improve_writing", "the child didnt settle and behavior was hard.");
    expect(r.notes.length).toBeGreaterThan(0);
    expect(r.notes.some((n) => /correct/i.test(n))).toBe(true);
  });

  it("professionalise_record reports the blame reframe and flags vague wording", () => {
    const r = deterministicRewrite("professionalise_record", "Jordan was non-compliant and kicked off at dinner.");
    expect(r.notes.some((n) => /reframed/i.test(n) && /non-compliant/i.test(n))).toBe(true);
    expect(r.notes.some((n) => /kicked off/i.test(n))).toBe(true);
  });

  it("simplify_language reports jargon simplification", () => {
    const r = deterministicRewrite("simplify_language", "Staff utilised the vehicle to facilitate the appointment.");
    expect(r.notes.some((n) => /jargon simplified/i.test(n))).toBe(true);
  });

  it("write_to_child reports the child-friendly transformation and safeguarding preservation", () => {
    const r = deterministicRewrite("write_to_child", "The young person presented as dysregulated.", {
      recordType: "daily_log",
    });
    expect(r.notes.some((n) => /child-friendly/i.test(n) && /safeguarding/i.test(n))).toBe(true);
  });

  it("every rewrite mode returns at least one explanation when it changes the text", () => {
    const cases: Array<[RewriteMode, string]> = [
      ["improve_writing", "the child didnt settle and behavior was hard."],
      ["professionalise_record", "Jordan was non-compliant and gonna kick off."],
      ["simplify_language", "Staff utilised the vehicle to facilitate the appointment."],
      ["write_to_child", "The young person absconded from the placement."],
    ];
    for (const [mode, text] of cases) {
      const r = deterministicRewrite(mode, text);
      expect(r.notes.length, `${mode} should explain what it did`).toBeGreaterThan(0);
    }
  });
});
