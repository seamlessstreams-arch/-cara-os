import { describe, it, expect } from "vitest";
import { checkWriting } from "../engine";

// ─────────────────────────────────────────────────────────────────────────────
// §9 — long-form records must not be truncated. The checker previously sliced
// input at 20,000 chars, silently dropping the later part of a multi-page record
// from the writing assistant. MAX_CHECK_LENGTH is now 100,000, so a long record
// is checked in full.
// ─────────────────────────────────────────────────────────────────────────────

describe("long-form recording — not truncated (§9)", () => {
  it("checks a long multi-page record in full, well beyond the old 20k cap", () => {
    const filler = "The young person had a calm and settled afternoon together with staff. ".repeat(700); // ~49k chars
    const text = filler + "the staff member didnt complete the behavior log afterwards.";
    const result = checkWriting({ text });

    // The spelling / UK-spelling issues sit ~49k chars in — only detectable if the
    // full record is checked. The previous 20k cap would have sliced them away.
    const lateIssue = result.issues.find((i) => i.start > 20000);
    expect(lateIssue).toBeDefined();
    // A normal result is returned (not a silent empty / error).
    expect(result.score).toBeDefined();
    expect(result.summary.length).toBeGreaterThan(0);
  });

  it("does not throw on a very long (~85k char) record", () => {
    const huge = "Staff supported the young person throughout the day. ".repeat(1600); // ~85k chars
    expect(() => checkWriting({ text: huge })).not.toThrow();
  });
});
