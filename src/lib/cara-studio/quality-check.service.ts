// ══════════════════════════════════════════════════════════════════════════════
// Cara STUDIO — QUALITY CHECK SERVICE
// Runs dignity, evidence, safeguarding, and writing quality checks.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient } from "@/lib/supabase/server";
import type { CaraStudioQualityCheck } from "@/types/cara-studio";

const AI_FILLER_PHRASES = [
  "it is important to note",
  "it's worth mentioning",
  "in conclusion",
  "delve into",
  "navigate the complexities",
  "robust framework",
  "holistic approach",
  "going forward",
  "at the end of the day",
  "thinking outside the box",
  "paradigm shift",
  "synergy",
  "best practice dictates",
  "needless to say",
  "it goes without saying",
  "as previously mentioned",
  "in terms of",
  "with regards to",
  "facilitate the process",
  "leverage the opportunity",
];

const DIGNITY_VIOLATIONS = [
  { pattern: /\bmanipulat(ive|ing)\b/i, suggestion: "seeking control or reassurance" },
  { pattern: /\battention[- ]seeking\b/i, suggestion: "communicating a need for connection" },
  { pattern: /\bchallenging behaviour\b/i, suggestion: "behaviour that communicates distress" },
  { pattern: /\bdisruptive\b/i, suggestion: "unsettled" },
  { pattern: /\bkicked off\b/i, suggestion: "became distressed" },
  { pattern: /\babsconded\b/i, suggestion: "went missing" },
  { pattern: /\brefus(ed|ing) to comply\b/i, suggestion: "found it difficult to follow" },
  { pattern: /\bnon-?complian(t|ce)\b/i, suggestion: "found it difficult to engage" },
  { pattern: /\baggress(ive|ion)\b/i, suggestion: "showed signs of distress through physical behaviour" },
  { pattern: /\bacting out\b/i, suggestion: "expressing distress through behaviour" },
  { pattern: /\bdefiant\b/i, suggestion: "struggled to accept the boundary" },
];

export async function runQualityCheck(
  artifactId: string,
  content: string,
): Promise<CaraStudioQualityCheck> {
  const lower = content.toLowerCase();
  const issues: string[] = [];

  // Evidence cited check
  const evidenceCited = lower.includes("evidence") || lower.includes("daily log") ||
    lower.includes("incident") || lower.includes("record") || lower.includes("observation");

  // Child voice check
  const childVoiceConsidered = lower.includes("child voice") || lower.includes("child's voice") ||
    lower.includes("child's view") || lower.includes("wishes and feelings") ||
    lower.includes("young person said") || lower.includes("child said") ||
    lower.includes("voice of the child");
  if (!childVoiceConsidered) issues.push("Child voice not explicitly considered. Capture wishes and feelings before approval.");

  // Risk check
  const riskConsidered = lower.includes("risk") || lower.includes("safeguard");
  if (!riskConsidered) issues.push("Risk not explicitly addressed in this output.");

  // Safeguarding check
  const safeguardingConsidered = lower.includes("safeguarding") || lower.includes("safety") ||
    lower.includes("welfare") || lower.includes("protection");

  // Regulation check
  const regulationConsidered = lower.includes("reg ") || lower.includes("regulation") ||
    lower.includes("quality standard") || lower.includes("children's home");

  // Actions clear
  const actionsClear = lower.includes("action") || lower.includes("next step") ||
    lower.includes("follow-up") || lower.includes("follow up");

  // Human approval check
  const humanApprovalComplete = false; // Always false until explicitly approved

  // AI filler check
  let noAiStyleFiller = true;
  for (const phrase of AI_FILLER_PHRASES) {
    if (lower.includes(phrase)) {
      noAiStyleFiller = false;
      issues.push(`AI filler detected: "${phrase}". Remove or rephrase.`);
      break;
    }
  }

  // Dignity language check
  let dignityPassed = true;
  for (const { pattern, suggestion } of DIGNITY_VIOLATIONS) {
    if (pattern.test(content)) {
      dignityPassed = false;
      issues.push(`Consider replacing "${content.match(pattern)?.[0]}" with "${suggestion}".`);
    }
  }

  // Unsupported claims check
  const noUnsupportedClaims = !lower.includes("definitely") && !lower.includes("certainly") &&
    !lower.includes("without doubt") && !lower.includes("clearly shows") &&
    !lower.includes("proves that") && !lower.includes("undeniably");
  if (!noUnsupportedClaims) issues.push("Possible unsupported claim detected. Soften language to 'the evidence suggests' or 'may indicate'.");

  const overallPassed = evidenceCited && childVoiceConsidered && riskConsidered &&
    noAiStyleFiller && dignityPassed && noUnsupportedClaims;

  const check: CaraStudioQualityCheck = {
    id: crypto.randomUUID(),
    artifact_id: artifactId,
    evidence_cited: evidenceCited,
    child_voice_considered: childVoiceConsidered,
    risk_considered: riskConsidered,
    safeguarding_considered: safeguardingConsidered,
    regulation_considered: regulationConsidered,
    actions_clear: actionsClear,
    owner_assigned: lower.includes("owner") || lower.includes("assigned to") || lower.includes("responsible"),
    review_date_set: lower.includes("review date") || lower.includes("review within"),
    human_approval_complete: humanApprovalComplete,
    sensitive_language_reviewed: dignityPassed,
    no_unsupported_claims: noUnsupportedClaims,
    no_ai_style_filler: noAiStyleFiller,
    dignity_language_passed: dignityPassed,
    overall_passed: overallPassed,
    issues,
    created_at: new Date().toISOString(),
  };

  // Persist if Supabase available
  const sb = createServerClient();
  if (sb) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (sb.from("aria_studio_quality_checks") as any).insert({
        artifact_id: artifactId,
        evidence_cited: check.evidence_cited,
        child_voice_considered: check.child_voice_considered,
        risk_considered: check.risk_considered,
        safeguarding_considered: check.safeguarding_considered,
        regulation_considered: check.regulation_considered,
        actions_clear: check.actions_clear,
        owner_assigned: check.owner_assigned,
        review_date_set: check.review_date_set,
        human_approval_complete: check.human_approval_complete,
        sensitive_language_reviewed: check.sensitive_language_reviewed,
        no_unsupported_claims: check.no_unsupported_claims,
        no_ai_style_filler: check.no_ai_style_filler,
        dignity_language_passed: check.dignity_language_passed,
        overall_passed: check.overall_passed,
        issues: check.issues,
      });
    } catch {
      // Quality check persistence failure should not break the flow
    }
  }

  return check;
}
