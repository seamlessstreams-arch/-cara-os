// ══════════════════════════════════════════════════════════════════════════════
// CARA WRITING ASSISTANT — engine + provider selection
//
// checkWriting() is the deterministic core (the default `rule-engine` provider):
// positioned issues + a friendly, non-shaming quality score + a summary. Provider
// selection honours env config but defaults to the privacy-safe local engine;
// external providers (LanguageTool / Cara AI) plug in via the same interface and
// are disabled by default.
// ══════════════════════════════════════════════════════════════════════════════

import {
  WRITING_ASSISTANT_VERSION,
  MIN_CHECK_LENGTH,
  MAX_CHECK_LENGTH,
  type WritingCheckInput,
  type WritingCheckResult,
  type WritingIssue,
  type WritingQualityScore,
  type WritingScoreArea,
  type WritingScoreBand,
  type WritingCheckProvider,
  type IssueType,
} from "./types";
import { runCareRules } from "./care-rules";

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
const SEVERITY_PENALTY = { high: 12, medium: 7, low: 3 } as const;

function hashText(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(16);
}

const AREA_TYPES: Record<WritingScoreArea["key"], IssueType[]> = {
  spelling_grammar: ["spelling", "grammar", "punctuation"],
  clarity: ["clarity"],
  professional_tone: ["tone", "professional-language", "policy-language"],
  objective_recording: ["safeguarding-quality", "chronology"],
  child_centred: ["writing-to-child"],
};
const AREA_LABELS: Record<WritingScoreArea["key"], string> = {
  spelling_grammar: "Spelling & grammar",
  clarity: "Clarity",
  professional_tone: "Professional tone",
  objective_recording: "Factual recording",
  child_centred: "Child-centred language",
};

export function scoreWriting(text: string, issues: WritingIssue[]): WritingQualityScore {
  // More text earns more tolerance (a few issues in a long record matters less).
  const words = Math.max(1, text.trim().split(/\s+/).filter(Boolean).length);
  const tolerance = 1 + Math.min(2, words / 120);

  const areas: WritingScoreArea[] = (Object.keys(AREA_TYPES) as WritingScoreArea["key"][]).map((key) => {
    const penalty = issues
      .filter((i) => AREA_TYPES[key].includes(i.type))
      .reduce((sum, i) => sum + SEVERITY_PENALTY[i.severity], 0);
    return { key, label: AREA_LABELS[key], score: clamp(100 - penalty / tolerance) };
  });

  // Overall reflects total issue load (not a 4-area average, which would dilute a
  // single weak area), scaled by the same length tolerance.
  const totalPenalty = issues.reduce((sum, i) => sum + SEVERITY_PENALTY[i.severity], 0);
  const overall = clamp(100 - totalPenalty / tolerance);

  let band: WritingScoreBand;
  let message: string;
  if (overall >= 90) {
    band = "strong";
    message = "Strong record.";
  } else if (overall >= 75) {
    band = "minor_improvements";
    message = "A few improvements suggested.";
  } else if (overall >= 55) {
    band = "add_detail";
    message = "Consider adding more detail.";
  } else {
    band = "needs_review";
    message = "This record may benefit from review before sign-off.";
  }

  return { overall, band, message, areas };
}

function buildSummary(issues: WritingIssue[], score: WritingQualityScore): string {
  if (issues.length === 0) return "No writing issues found. " + score.message;
  const counts = new Map<IssueType, number>();
  for (const i of issues) counts.set(i.type, (counts.get(i.type) ?? 0) + 1);
  const parts = [...counts.entries()].map(([t, n]) => `${n} ${t.replace(/-/g, " ")}`);
  return `${issues.length} suggestion${issues.length === 1 ? "" : "s"} (${parts.join(", ")}). ${score.message}`;
}

/** The deterministic core check. `today` is injected for stable output. */
export function checkWriting(input: WritingCheckInput, today = ""): WritingCheckResult {
  const raw = input.text ?? "";
  const text = raw.length > MAX_CHECK_LENGTH ? raw.slice(0, MAX_CHECK_LENGTH) : raw;

  if (text.trim().length < MIN_CHECK_LENGTH) {
    const score = scoreWriting(text, []);
    return {
      issues: [],
      score,
      summary: "Keep writing — Cara will check once there's a little more to work with.",
      textHash: hashText(raw),
      engineVersion: WRITING_ASSISTANT_VERSION,
      generatedAt: today,
    };
  }

  const issues = runCareRules(text, input.mode ?? "standard");
  const score = scoreWriting(text, issues);
  return {
    issues,
    score,
    summary: buildSummary(issues, score),
    textHash: hashText(raw),
    engineVersion: WRITING_ASSISTANT_VERSION,
    generatedAt: today,
  };
}

// ─── Providers ────────────────────────────────────────────────────────────────

export const ruleEngineProvider: WritingCheckProvider = {
  id: "rule-engine",
  checkText: (input) => checkWriting(input),
};

/** Empty-result provider for tests / local dev. */
export const mockProvider: WritingCheckProvider = {
  id: "rule-engine",
  checkText: (input) => ({
    issues: [],
    score: scoreWriting(input.text ?? "", []),
    summary: "Mock provider — no issues.",
    textHash: hashText(input.text ?? ""),
    engineVersion: WRITING_ASSISTANT_VERSION,
    generatedAt: "",
  }),
};

/**
 * Select the active provider from env. Defaults to the privacy-safe local
 * rule-engine. External providers (languagetool / cara-ai / hybrid) plug in via
 * the same interface; until they are configured + enabled they fall back to the
 * local engine, so no child data ever leaves Cara by default.
 */
export function getWritingProvider(): WritingCheckProvider {
  const provider = process.env.WRITING_ASSISTANT_PROVIDER;
  if (provider === "mock") return mockProvider;
  // languagetool / cara-ai / hybrid: not yet wired — safe local fallback.
  return ruleEngineProvider;
}

export function isWritingAssistantEnabled(): boolean {
  // Enabled by default; an explicit "false" disables it.
  return process.env.WRITING_ASSISTANT_ENABLED !== "false";
}
