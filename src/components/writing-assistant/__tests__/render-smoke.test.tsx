import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { InlineSuggestions } from "../inline-suggestions";
import { CaraWritingField } from "../cara-writing-field";
import { WritingAssistantInline } from "../writing-assistant-inline";
import { HighlightedTextarea, _testing } from "../highlighted-textarea";
import { checkWriting } from "@/lib/writing-assistant/engine";
import type { WritingIssue } from "@/lib/writing-assistant/types";

const { buildSegments } = _testing;
const r = (el: React.ReactElement) => renderToStaticMarkup(el);

// ── buildSegments unit tests ────────────────────────────────────────────────

const makeIssue = (id: string, start: number, end: number): WritingIssue => ({
  id,
  type: "spelling",
  severity: "medium",
  start,
  end,
  originalText: "word",
  message: "Test",
  explanation: "Test",
  suggestions: [],
  source: "rule-engine",
  confidence: 0.9,
  requiresHumanJudgement: false,
});

describe("buildSegments", () => {
  it("returns a single plain segment when there are no issues", () => {
    const segs = buildSegments("hello world", []);
    expect(segs).toHaveLength(1);
    expect(segs[0].text).toBe("hello world");
    expect(segs[0].issue).toBeUndefined();
  });

  it("splits text into three segments around a single issue", () => {
    const segs = buildSegments("hello world today", [makeIssue("i1", 6, 11)]);
    expect(segs).toHaveLength(3);
    expect(segs[0].text).toBe("hello ");
    expect(segs[0].issue).toBeUndefined();
    expect(segs[1].text).toBe("world");
    expect(segs[1].issue?.id).toBe("i1");
    expect(segs[2].text).toBe(" today");
    expect(segs[2].issue).toBeUndefined();
  });

  it("handles issue at the start of the text", () => {
    const segs = buildSegments("hello world", [makeIssue("i1", 0, 5)]);
    expect(segs).toHaveLength(2);
    expect(segs[0].issue?.id).toBe("i1");
    expect(segs[1].text).toBe(" world");
  });

  it("handles issue at the end of the text", () => {
    const segs = buildSegments("hello world", [makeIssue("i1", 6, 11)]);
    expect(segs[segs.length - 1].issue?.id).toBe("i1");
  });

  it("handles two non-overlapping issues", () => {
    const segs = buildSegments("abc def ghi", [makeIssue("i1", 0, 3), makeIssue("i2", 8, 11)]);
    const issueSegs = segs.filter((s) => s.issue);
    expect(issueSegs).toHaveLength(2);
    expect(issueSegs[0].issue?.id).toBe("i1");
    expect(issueSegs[1].issue?.id).toBe("i2");
  });

  it("collapses overlapping issues — keeps first-starting, drops the overlapping one", () => {
    const segs = buildSegments("abcdef", [makeIssue("i1", 0, 4), makeIssue("i2", 2, 6)]);
    const issueSegs = segs.filter((s) => s.issue);
    expect(issueSegs).toHaveLength(1);
    expect(issueSegs[0].issue?.id).toBe("i1");
  });

  it("reconstructs the original text when segments are concatenated", () => {
    const text = "Staff refused to settle. Their behavior was challenging behaviour.";
    const issues = [makeIssue("i1", 6, 13), makeIssue("i2", 25, 34)];
    const segs = buildSegments(text, issues);
    expect(segs.map((s) => s.text).join("")).toBe(text);
  });

  it("returns a single segment for empty text", () => {
    const segs = buildSegments("", []);
    expect(segs).toHaveLength(1);
    expect(segs[0].text).toBe("");
  });
});

// ── Component render smoke tests ─────────────────────────────────────────────

describe("writing-assistant UI render smoke", () => {
  it("InlineSuggestions renders real engine issues without throwing", () => {
    const result = checkWriting({ text: "Child kicked off and didnt settle. Their behavior was challenging." }, "x");
    expect(() =>
      r(React.createElement(InlineSuggestions, { issues: result.issues, score: result.score, onApply: () => {}, onIgnore: () => {} })),
    ).not.toThrow();
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it("InlineSuggestions renders nothing when there are no issues", () => {
    const html = r(React.createElement(InlineSuggestions, { issues: [], onApply: () => {}, onIgnore: () => {} }));
    expect(html).toBe("");
  });

  it("InlineSuggestions renders settings gear when onToggleCategory is provided", () => {
    const result = checkWriting({ text: "Child kicked off and didnt settle. Their behavior was challenging." }, "x");
    const html = r(
      React.createElement(InlineSuggestions, {
        issues: result.issues,
        score: result.score,
        onApply: () => {},
        onIgnore: () => {},
        onToggleCategory: () => {},
      }),
    );
    // Settings gear button is present
    expect(html).toContain("aria-label=\"Writing assistant settings\"");
  });

  it("CaraWritingField mounts (textarea only until a check returns) without throwing", () => {
    expect(() =>
      r(React.createElement(CaraWritingField, { value: "Some record text here.", onChange: () => {}, fieldName: "notes" })),
    ).not.toThrow();
  });

  it("WritingAssistantInline mounts (renders nothing until a check returns) without throwing", () => {
    expect(() =>
      r(React.createElement(WritingAssistantInline, { value: "Some record text here.", onApplyText: () => {}, recordType: "daily_log", fieldName: "content" })),
    ).not.toThrow();
  });

  it("InlineSuggestions renders Apply all button when 2+ auto-fixable issues are present", () => {
    const fix = (id: string, start: number, end: number, original: string, replacement: string): WritingIssue => ({
      id,
      type: "spelling" as const,
      severity: "medium" as const,
      start,
      end,
      originalText: original,
      message: "US spelling",
      explanation: "Use UK spelling",
      suggestions: [{ id: `${id}-s`, replacementText: replacement, label: "Fix", rationale: "", preservesMeaning: true }],
      source: "rule-engine" as const,
      confidence: 1,
      requiresHumanJudgement: false,
    });
    const issues = [fix("i1", 0, 8, "behavior", "behaviour"), fix("i2", 9, 14, "color", "colour")];
    const html = r(React.createElement(InlineSuggestions, { issues, onApply: () => {}, onIgnore: () => {}, onApplyAll: () => {} }));
    expect(html).toContain("Apply all");
    expect(html).toContain("aria-label=\"Apply all 2 safe fixes\"");
  });

  it("HighlightedTextarea renders without throwing", () => {
    expect(() =>
      r(
        React.createElement(HighlightedTextarea, {
          value: "Staff refused to cooperate with the plan.",
          onChange: () => {},
          issues: [makeIssue("i1", 6, 13)],
        }),
      ),
    ).not.toThrow();
  });

  it("HighlightedTextarea renders a mark element for each issue", () => {
    const html = r(
      React.createElement(HighlightedTextarea, {
        value: "Staff refused to settle today.",
        onChange: () => {},
        issues: [makeIssue("i1", 6, 13), makeIssue("i2", 18, 24)],
      }),
    );
    // Two <mark> elements for two issues
    expect((html.match(/<mark/g) ?? []).length).toBe(2);
  });
});
