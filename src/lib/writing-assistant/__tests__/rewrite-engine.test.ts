import { describe, it, expect } from "vitest";
import { applyAutoFixes, countAutoFixes } from "../rewrite-engine";
import type { WritingIssue } from "../types";

const makeFix = (id: string, start: number, end: number, original: string, replacement: string, requiresHumanJudgement = false): WritingIssue => ({
  id,
  type: "spelling",
  severity: "medium",
  start,
  end,
  originalText: original,
  message: "Test",
  explanation: "Test",
  suggestions: [{ id: `${id}-s`, replacementText: replacement, label: "Fix", rationale: "", preservesMeaning: true }],
  source: "rule-engine",
  confidence: 0.9,
  requiresHumanJudgement,
});

const makeGuidance = (id: string, start: number, end: number, original: string): WritingIssue => ({
  id,
  type: "safeguarding-quality",
  severity: "high",
  start,
  end,
  originalText: original,
  message: "Test",
  explanation: "Test",
  suggestions: [],
  source: "rule-engine",
  confidence: 0.9,
  requiresHumanJudgement: true,
});

describe("applyAutoFixes", () => {
  it("returns unchanged text when there are no auto-fixable issues", () => {
    const text = "Child kicked off at bedtime.";
    const { text: result, applied } = applyAutoFixes(text, [makeGuidance("g1", 6, 16, "kicked off")]);
    expect(result).toBe(text);
    expect(applied).toHaveLength(0);
  });

  it("applies a single spelling fix", () => {
    const text = "Their behavior was calm.";
    const { text: result, applied } = applyAutoFixes(text, [makeFix("i1", 6, 14, "behavior", "behaviour")]);
    expect(result).toBe("Their behaviour was calm.");
    expect(applied).toHaveLength(1);
  });

  it("applies multiple fixes back-to-front preserving offsets", () => {
    const text = "Their behavior and color were noted.";
    const issues = [
      makeFix("i1", 6, 14, "behavior", "behaviour"),
      makeFix("i2", 19, 24, "color", "colour"),
    ];
    const { text: result, applied } = applyAutoFixes(text, issues);
    expect(result).toBe("Their behaviour and colour were noted.");
    expect(applied).toHaveLength(2);
  });

  it("skips a fix when the text has drifted from originalText", () => {
    const text = "Word is fine here.";
    const issue = makeFix("i1", 0, 4, "Xord", "Word");
    const { text: result, applied } = applyAutoFixes(text, [issue]);
    expect(result).toBe(text);
    expect(applied).toHaveLength(0);
  });

  it("never applies a requiresHumanJudgement issue even if it has a replacement", () => {
    const text = "The child kicked off.";
    const issue: WritingIssue = {
      ...makeFix("i1", 10, 20, "kicked off", "became dysregulated"),
      requiresHumanJudgement: true,
    };
    const { text: result, applied } = applyAutoFixes(text, [issue]);
    expect(result).toBe(text);
    expect(applied).toHaveLength(0);
  });

  it("never applies an issue with no replacementText", () => {
    const text = "Child was challenging.";
    const issue: WritingIssue = {
      id: "i1",
      type: "safeguarding-quality",
      severity: "medium",
      start: 9,
      end: 20,
      originalText: "challenging",
      message: "Vague",
      explanation: "...",
      suggestions: [{ id: "s1", replacementText: "", label: "Add detail", rationale: "", preservesMeaning: false }],
      source: "rule-engine",
      confidence: 0.8,
      requiresHumanJudgement: true,
    };
    const { text: result, applied } = applyAutoFixes(text, [issue]);
    expect(result).toBe(text);
    expect(applied).toHaveLength(0);
  });
});

describe("countAutoFixes", () => {
  it("returns 0 for an empty issue list", () => {
    expect(countAutoFixes([])).toBe(0);
  });

  it("counts only auto-fixable issues", () => {
    const issues = [
      makeFix("i1", 0, 4, "word", "Word"),
      makeFix("i2", 10, 18, "behavior", "behaviour"),
      makeGuidance("g1", 20, 30, "kicked off"),
    ];
    expect(countAutoFixes(issues)).toBe(2);
  });

  it("returns 0 when all issues require human judgement", () => {
    const issues = [makeGuidance("g1", 0, 10, "kicked off"), makeGuidance("g2", 15, 25, "acted up")];
    expect(countAutoFixes(issues)).toBe(0);
  });
});
