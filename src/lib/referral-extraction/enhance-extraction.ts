// ══════════════════════════════════════════════════════════════════════════════
// CARA — REFERRAL EXTRACTION · GOVERNED AI ENHANCE (Phase 6 · Module 3)
//
// The deterministic extractor (M1) is the FLOOR — it always runs, needs no
// credit, and owns every identifier it finds. ON TOP, when a model is available,
// this fills the GAPS the regex missed (referral source, presenting needs, risk
// factors) — through the governed invokeAiGateway chokepoint (redaction,
// sensitivity gate, injection guard, response scan, metering, hashed audit).
//
// GRACEFUL BY CONSTRUCTION (mirrors cpie/enhance-report.ts): if the model is
// unavailable (exhausted credits / no key), refused (safeguarding-sensitive
// referral content), or errors, this returns the DETERMINISTIC extraction
// unchanged — never a dead end. In today's prod (no credits) it always falls
// back, which is exactly the behaviour that was browser-verified for M2.
//
// SAFETY: the gateway REDACTS PII before the prompt reaches a model, so the model
// only ever sees pseudonymised text. Therefore the AI is trusted to fill ONLY the
// non-identifying fields below — child name / DOB / referred-by / local authority
// stay deterministic-only (source-grounded), never AI-guessed.
// ══════════════════════════════════════════════════════════════════════════════

import { invokeAiGateway } from "@/lib/cara/ai-gateway";
import type { AiGatewayRequest, AiGatewayResult } from "@/lib/cara/ai-gateway";
import type { ReferralExtraction, ExtractedReferralFields, ReferralSource } from "./referral-extraction-engine";

const VALID_SOURCES: ReferralSource[] = ["local_authority", "agency", "emergency", "internal_transfer", "court_directed"];
/** The only fields the model is allowed to fill — non-identifying, gap-fillable. */
const AI_FILLABLE = ["referral_source", "presenting_needs", "risk_factors"] as const;

const CORE_FIELDS = [
  "child_name", "date_of_birth", "referral_source", "local_authority", "referral_date", "presenting_needs", "risk_factors",
] as const;

const ENHANCE_RULES =
  "You are helping a registered manager in a children's home extract fields from a referral document that has ALREADY been parsed deterministically. Fill ONLY the gaps that were missed. The text may be pseudonymised — do not try to recover names or dates.\n\n" +
  "Return ONLY a JSON object (no prose, no code fences) with these optional keys:\n" +
  '- "referral_source": one of "local_authority" | "agency" | "emergency" | "internal_transfer" | "court_directed", or null if not stated.\n' +
  '- "presenting_needs": string[] — the child\'s presenting/support needs, each a short phrase.\n' +
  '- "risk_factors": string[] — known risks/vulnerabilities, each a short phrase.\n\n' +
  "STRICT: Never invent. If a field is not clearly in the text, use null / []. Do not add clinical labels or judgements. No preamble.";

function cleanList(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of v) {
    if (typeof item !== "string") continue;
    const s = item.replace(/^[-*•·\s]+/, "").replace(/\s+/g, " ").trim();
    const key = s.toLowerCase();
    if (s.length >= 3 && s.length <= 200 && !seen.has(key)) {
      seen.add(key);
      out.push(s);
    }
    if (out.length >= 12) break;
  }
  return out;
}

/** Parse the model's JSON, tolerating ```json fences. Returns null on failure. */
export function parseAiFields(output: string): Partial<ExtractedReferralFields> | null {
  const cleaned = output.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    const obj = JSON.parse(cleaned);
    return obj && typeof obj === "object" ? (obj as Partial<ExtractedReferralFields>) : null;
  } catch {
    return null;
  }
}

/**
 * Merge AI-inferred fields onto the deterministic extraction. PURE. Deterministic
 * ALWAYS wins — the model may only fill an AI_FILLABLE field that the deterministic
 * pass left empty, and only with a value that passes validation. Recomputes
 * found/missing/confidence and reports which fields the AI filled.
 */
export function mergeExtraction(
  deterministic: ReferralExtraction,
  ai: Partial<ExtractedReferralFields> | null,
): { extraction: ReferralExtraction; ai_filled: string[] } {
  if (!ai) return { extraction: deterministic, ai_filled: [] };
  const out: ExtractedReferralFields = { ...deterministic.fields };
  const filled: string[] = [];

  if (!out.referral_source && typeof ai.referral_source === "string" && VALID_SOURCES.includes(ai.referral_source as ReferralSource)) {
    out.referral_source = ai.referral_source as ReferralSource;
    filled.push("referral_source");
  }
  if (out.presenting_needs.length === 0) {
    const list = cleanList(ai.presenting_needs);
    if (list.length) { out.presenting_needs = list; filled.push("presenting_needs"); }
  }
  if (out.risk_factors.length === 0) {
    const list = cleanList(ai.risk_factors);
    if (list.length) { out.risk_factors = list; filled.push("risk_factors"); }
  }

  const isPresent = (k: (typeof CORE_FIELDS)[number]): boolean => {
    const v = out[k];
    return Array.isArray(v) ? v.length > 0 : v != null;
  };
  const found = CORE_FIELDS.filter(isPresent);
  const missing = CORE_FIELDS.filter((k) => !isPresent(k));

  return {
    extraction: {
      fields: out,
      found: [...found],
      missing: [...missing],
      confidence: Math.round((found.length / CORE_FIELDS.length) * 100) / 100,
      note: deterministic.note,
    },
    ai_filled: filled,
  };
}

export interface EnhanceResult {
  extraction: ReferralExtraction;
  /** True only when the model actually filled a gap; false = deterministic floor. */
  ai_used: boolean;
  /** "ai" | "skipped:complete" | "fallback:refused" | "fallback:<method>" | "fallback:error". */
  method: string;
  ai_filled: string[];
}

/**
 * Enhance a deterministic extraction through the governed gateway. Falls back to
 * the deterministic result on skip / refusal / unavailability / error.
 * `deps.invoke` is injectable for testing the fallback branches.
 */
export async function enhanceReferralExtraction(
  deterministic: ReferralExtraction,
  rawText: string,
  deps: { invoke?: (req: AiGatewayRequest) => Promise<AiGatewayResult> } = {},
): Promise<EnhanceResult> {
  const invoke = deps.invoke ?? invokeAiGateway;

  // Only spend a model call if there is a gap the AI is actually allowed to fill.
  const fillableGaps = deterministic.missing.filter((m) => (AI_FILLABLE as readonly string[]).includes(m));
  if (fillableGaps.length === 0) {
    return { extraction: deterministic, ai_used: false, method: "skipped:complete", ai_filled: [] };
  }

  try {
    const result = await invoke({
      purpose: "referral_extraction_enhance",
      feature: "admissions",
      systemPrompt: ENHANCE_RULES,
      userPrompt: `Referral text:\n${rawText.slice(0, 8000)}\n\nReturn ONLY the JSON object.`,
      redact: true, // pseudonymise PII before send; AI fills non-PII gaps only
      expectJson: true,
      maxOutputTokens: 512,
    });

    if (result.llmUsed && result.method === "ai" && result.output?.trim()) {
      const merged = mergeExtraction(deterministic, parseAiFields(result.output));
      return {
        extraction: merged.extraction,
        ai_used: merged.ai_filled.length > 0,
        method: "ai",
        ai_filled: merged.ai_filled,
      };
    }
    return {
      extraction: deterministic,
      ai_used: false,
      method: result.refusedReason ? "fallback:refused" : `fallback:${result.method}`,
      ai_filled: [],
    };
  } catch {
    return { extraction: deterministic, ai_used: false, method: "fallback:error", ai_filled: [] };
  }
}
