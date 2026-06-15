import { describe, it, expect } from "vitest";
import { runCareRules } from "../care-rules";
import { checkWriting, scoreWriting } from "../engine";
import { redact, rehydrate, hasUnresolvedPlaceholders } from "../redaction";
import type { WritingIssue } from "../types";

const types = (issues: WritingIssue[]) => issues.map((i) => i.type);
const find = (issues: WritingIssue[], pred: (i: WritingIssue) => boolean) => issues.find(pred);

describe("care rules — positioned detectors", () => {
  it("flags vague language with observable-detail guidance (needs human judgement)", () => {
    const text = "Child kicked off at bedtime.";
    const issues = runCareRules(text);
    const v = find(issues, (i) => i.originalText.toLowerCase() === "kicked off");
    expect(v?.type).toBe("safeguarding-quality");
    expect(v?.requiresHumanJudgement).toBe(true);
    expect(text.slice(v!.start, v!.end)).toBe("kicked off"); // offset accuracy
  });

  it("reframes blaming language as communication", () => {
    const issues = runCareRules("Staff felt the child was manipulative today.");
    const b = find(issues, (i) => i.type === "tone");
    expect(b?.originalText.toLowerCase()).toBe("manipulative");
    expect(b?.suggestions[0].replacementText).toMatch(/unmet need/);
    expect(b?.suggestions[0].preservesMeaning).toBe(false);
  });

  it("fixes US spelling with a safe like-for-like replacement", () => {
    const issues = runCareRules("The child's behavior in the centre was calm.");
    const s = find(issues, (i) => i.type === "spelling");
    expect(s?.suggestions[0].replacementText).toBe("behaviour");
    expect(s?.suggestions[0].preservesMeaning).toBe(true);
  });

  it("flags missing-apostrophe contractions", () => {
    const issues = runCareRules("The child didnt want to talk and wouldnt come downstairs.");
    expect(issues.some((i) => i.type === "punctuation" && i.suggestions[0].replacementText === "didn't")).toBe(true);
  });

  it("flags informal slang", () => {
    const issues = runCareRules("Staff said they were gonna sort it out after tea time.");
    const sl = find(issues, (i) => i.type === "professional-language");
    expect(sl?.suggestions[0].replacementText).toBe("going to");
  });

  it("flags repeated words and redundant openers", () => {
    const issues = runCareRules("It is important to note that the the child slept well overnight.");
    expect(issues.some((i) => i.type === "grammar")).toBe(true); // "the the"
    expect(issues.some((i) => i.type === "clarity")).toBe(true); // redundant opener
  });

  it("flags an over-long sentence as a clarity prompt", () => {
    const long =
      "At bedtime the child became distressed and shouted at staff when asked to turn off the television and then walked to the kitchen and the lounge and the hallway repeatedly while staff offered support and a drink and reassurance and time and space and a calm voice and a familiar adult nearby throughout.";
    const issues = runCareRules(long);
    expect(issues.some((i) => i.type === "clarity" && i.requiresHumanJudgement)).toBe(true);
  });

  it("returns issues ordered by position", () => {
    const issues = runCareRules("behavior was fine but the child didnt settle.");
    const starts = issues.map((i) => i.start);
    expect(starts).toEqual([...starts].sort((a, b) => a - b));
  });
});

describe("writing-to-child mode", () => {
  it("flags child-facing wording only in writing-to-child mode", () => {
    const text = "The restraint was recorded and the incident logged on the system.";
    expect(runCareRules(text, "standard").some((i) => i.type === "writing-to-child")).toBe(false);
    expect(runCareRules(text, "writing-to-child").some((i) => i.type === "writing-to-child")).toBe(true);
  });
});

describe("scoring (friendly, non-shaming)", () => {
  it("rates a clean record strongly", () => {
    const s = scoreWriting("The young person ate a full breakfast and engaged well with their key worker this morning.", []);
    expect(s.band).toBe("strong");
    expect(s.message).toBe("Strong record.");
  });
  it("lowers the band when there are many issues", () => {
    const text = "Child kicked off, was naughty, was aggressive, played up and had a meltdown. Nothing to report.";
    const s = scoreWriting(text, runCareRules(text));
    expect(["add_detail", "needs_review", "minor_improvements"]).toContain(s.band);
    expect(s.overall).toBeLessThan(90);
  });
});

describe("checkWriting", () => {
  it("does not check very short text", () => {
    const r = checkWriting({ text: "Slept ok." }, "2026-06-15");
    expect(r.issues).toEqual([]);
    expect(r.summary).toMatch(/Keep writing/);
  });
  it("returns issues + score + summary + textHash for a real record", () => {
    const r = checkWriting({ text: "The child kicked off and didnt settle at bedtime tonight." }, "2026-06-15");
    expect(r.issues.length).toBeGreaterThan(0);
    expect(r.score.overall).toBeGreaterThanOrEqual(0);
    expect(r.summary).toBeTruthy();
    expect(r.textHash).toBeTruthy();
  });
  it("is deterministic", () => {
    const input = { text: "The child kicked off and didnt settle at bedtime tonight." };
    expect(checkWriting(input, "2026-06-15")).toEqual(checkWriting(input, "2026-06-15"));
  });
  it("changes textHash when text changes", () => {
    const a = checkWriting({ text: "The child settled well overnight without difficulty." }, "x");
    const b = checkWriting({ text: "The child settled poorly overnight with difficulty." }, "x");
    expect(a.textHash).not.toBe(b.textHash);
  });
});

describe("redaction (privacy before any external call)", () => {
  it("redacts emails, phones, postcodes, dates and known names, and rehydrates exactly", () => {
    const original = "Contact Karen on 07700900123 or karen@oak.org about Alex, DOB 01/02/2012, at SW1A 1AA.";
    const { redacted, map } = redact(original, { names: ["Karen", "Alex"] });
    expect(redacted).not.toContain("07700900123");
    expect(redacted).not.toContain("karen@oak.org");
    expect(redacted).not.toContain("SW1A 1AA");
    expect(redacted).not.toContain("01/02/2012");
    expect(redacted).not.toMatch(/\bAlex\b/);
    expect(hasUnresolvedPlaceholders(redacted)).toBe(true);
    expect(rehydrate(redacted, map)).toBe(original); // lossless round-trip
  });
  it("redacts names whole-word only", () => {
    const { redacted } = redact("Alexander is not Alex.", { names: ["Alex"] });
    expect(redacted).toMatch(/Alexander/); // not partially redacted
    expect(redacted).not.toMatch(/\bAlex\b/);
  });
});
