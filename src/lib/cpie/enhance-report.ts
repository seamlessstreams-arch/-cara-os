// ══════════════════════════════════════════════════════════════════════════════
// CARA — CPIE · Weekly report LLM ENHANCEMENT (server-only, governed)
//
// The master-prompt discipline: the deterministic object + narrator is the FLOOR
// (always works, no credit). ON TOP of that, when an LLM is available, it can
// rephrase the already-drafted report to read even more naturally and individually
// — WITHOUT changing a single fact. Every model call goes through the governed
// `invokeAiGateway` chokepoint (redaction policy, sensitivity gate, injection
// guard, response scanner, metering, hashed audit, fail-closed).
//
// GRACEFUL BY CONSTRUCTION: if the model is unavailable (exhausted credits, no
// key), refused (sensitive content), or errors, this returns the DETERMINISTIC
// text unchanged — never a dead end. This module lives in cpie/, NOT ask-cara/,
// so Ask CARA stays 100% deterministic (its import-guard test forbids AI imports).
// ══════════════════════════════════════════════════════════════════════════════

import { invokeAiGateway } from "@/lib/cara/ai-gateway";
import type { WeeklyReport } from "./weekly-report";
import type { WeeklyNarrative } from "./weekly-narrative";

const ENHANCE_RULES =
  "You are helping a registered manager in a children's home polish a child's weekly report that has ALREADY been drafted, deterministically, from the child's own records. Make it read more naturally, warmly and individually — as a thoughtful, experienced practitioner would — WITHOUT changing what it says.\n\n" +
  "STRICT RULES:\n" +
  "- Preserve every fact. NEVER add an event, feeling, quote, name, date or detail that is not already in the draft. If it is not in the draft, it did not happen — do not invent it.\n" +
  "- Do not remove or soften a recorded concern; keep the honesty of the draft.\n" +
  "- Keep it strengths-first and compassionate — see the CHILD, not the behaviour.\n" +
  "- Keep the draft's voice: second person (\"you\", written TO the child) for the child-facing sections; third person for the Manager Summary.\n" +
  "- Keep EVERY section heading exactly as written, in the same order.\n" +
  "- Keep it professional, child-appropriate and jargon-free. Add no clinical labels, diagnoses or safeguarding judgements.\n" +
  "- No preamble, no sign-off. Return ONLY the rewritten report.";

export interface EnhancedReport {
  /** The enhanced text, or the deterministic text if the model wasn't used. */
  text: string;
  /** True only when the LLM actually rephrased it; false = deterministic floor. */
  enhanced: boolean;
  /** How it resolved: "ai" | "fallback:refused" | "fallback:<method>" | "fallback:error". */
  method: string;
}

/** Flatten a structured report to plain text for the model. */
export function reportToText(r: WeeklyReport): string {
  return [r.title, "", ...r.sections.map((s) => `${s.heading}\n${s.body}`)].join("\n\n");
}

async function enhance(deterministic: string, childName: string): Promise<EnhancedReport> {
  const trimmed = (deterministic || "").trim();
  if (!trimmed) return { text: deterministic, enhanced: false, method: "empty" };
  try {
    const result = await invokeAiGateway({
      purpose: "weekly_report_enhance",
      feature: "weekly_report",
      systemPrompt: ENHANCE_RULES,
      userPrompt: `Child (first name only): ${childName}\n\n=== DRAFT REPORT ===\n${trimmed}`,
      // The report must keep names to read as a report; the gateway's sensitivity
      // gate still governs whether it may reach the model (and refuses if not).
      redact: false,
      maxOutputTokens: 2048,
    });
    if (result.llmUsed && result.method === "ai" && result.output?.trim()) {
      return { text: result.output.trim(), enhanced: true, method: "ai" };
    }
    return { text: deterministic, enhanced: false, method: result.refusedReason ? "fallback:refused" : `fallback:${result.method}` };
  } catch {
    return { text: deterministic, enhanced: false, method: "fallback:error" };
  }
}

/** Rephrase the full sectioned weekly report (falls back to the deterministic text). */
export function enhanceWeeklyReport(report: WeeklyReport): Promise<EnhancedReport> {
  return enhance(reportToText(report), report.childName);
}

/** Rephrase the third-person Manager-Summary narrative (falls back to deterministic). */
export function enhanceWeeklyNarrative(narrative: WeeklyNarrative, childName: string): Promise<EnhancedReport> {
  return enhance(narrative.body, childName);
}
