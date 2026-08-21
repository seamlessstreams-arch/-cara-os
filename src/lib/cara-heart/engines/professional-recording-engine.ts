// ══════════════════════════════════════════════════════════════════════════════
// CARA HEART — ProfessionalRecordingIntelligenceEngine (pure / deterministic)
//
// Assesses the professional quality of care records beyond blame-language
// detection. Checks for:
//   - Chronological sequence
//   - Links to the care plan or agreed strategy
//   - Unsafe speculation (conclusive generalisations without evidence)
//   - Follow-up actions or next steps
//   - Completeness and factual clarity
//
// Returns a RecordingQualityReview with 7 quality scores, flagged language,
// missing elements, and targeted rewrite prompts.
//
// British English throughout. Cara advises. Professionals decide.
// ══════════════════════════════════════════════════════════════════════════════

import type {
  CaraPracticeRecord,
  RecordingQualityReview,
  IntelligenceAuditEntry,
} from "../types";
import { scanForBlameLanguage } from "./language-flags";

const ENGINE = "ProfessionalRecordingIntelligenceEngine";

const SIGNIFICANT_TYPES = new Set([
  "incident",
  "physical_intervention",
  "police_contact",
  "missing_episode",
  "behaviour_record",
]);

// ── Text helpers ──────────────────────────────────────────────────────────────

function hasChronology(text: string): boolean {
  return (
    /\bat\s+\d{1,2}[:.]\d{2}/i.test(text) ||
    /\b(before|after|then|during|initially|following|subsequently|earlier|later|first|next|finally)\b/i.test(text)
  );
}

function hasPlanReference(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes("care plan") ||
    lower.includes("placement plan") ||
    lower.includes("behaviour support") ||
    lower.includes("risk assessment") ||
    lower.includes("support plan") ||
    lower.includes("ehcp") ||
    lower.includes("key work") ||
    lower.includes("agreed strategy") ||
    lower.includes("plan says") ||
    lower.includes("plan states") ||
    lower.includes("individual plan")
  );
}

function hasUnsafeSpeculation(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes("for no reason") ||
    lower.includes("without reason") ||
    lower.includes("without any reason") ||
    lower.includes("there was no reason") ||
    /\b(always does this|never listens|always kicks off|never cooperates)\b/.test(lower) ||
    lower.includes("they just wanted") ||
    lower.includes("the child was just trying to")
  );
}

function hasAdultAction(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes("staff") ||
    lower.includes("worker") ||
    lower.includes("de-escalat") ||
    lower.includes("deescalat") ||
    lower.includes("offered") ||
    lower.includes("supported") ||
    lower.includes("reduced") ||
    lower.includes("intervened") ||
    lower.includes("we ") ||
    lower.includes("i ") ||
    lower.includes("prompted")
  );
}

function hasFollowUp(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes("follow") ||
    lower.includes("next step") ||
    lower.includes("review") ||
    lower.includes("plan to") ||
    lower.includes("will be") ||
    lower.includes("arranged") ||
    lower.includes("scheduled") ||
    lower.includes("booked") ||
    /\baction\b/.test(lower)
  );
}

// ── Engine export ─────────────────────────────────────────────────────────────

export interface ProfessionalRecordingEngineResult {
  review: RecordingQualityReview;
  audit: IntelligenceAuditEntry[];
}

export function runProfessionalRecordingEngine(
  record: CaraPracticeRecord,
  now: string = new Date().toISOString(),
): ProfessionalRecordingEngineResult {
  const audit: IntelligenceAuditEntry[] = [];
  const missingElements: string[] = [];
  const suggestedRewritePrompts: string[] = [];

  const combinedText = [
    record.description,
    record.staffResponse ?? "",
    record.childVoice ?? "",
    record.childPresentation ?? "",
  ].join(" ");

  const severity = record.severity ?? 1;
  const isSignificant = SIGNIFICANT_TYPES.has(record.type) || severity >= 3;
  const childVoicePresent = !!record.childVoice && record.childVoice.trim().length > 5;

  // ── Blame language scan ───────────────────────────────────────────────────
  const flaggedLanguage = scanForBlameLanguage(combinedText);
  const hasBlameLang = flaggedLanguage.length > 0;

  audit.push({
    ruleId: "PRI_BLAME_LANGUAGE",
    engine: ENGINE,
    triggered: hasBlameLang,
    reason: hasBlameLang
      ? `${flaggedLanguage.length} blame or imprecise phrase(s) detected.`
      : "No blame language detected.",
    severity: hasBlameLang ? "warning" : "info",
    timestamp: now,
  });

  if (hasBlameLang) {
    suggestedRewritePrompts.push(
      "Before rewriting, reflect on what the child may have been communicating. Replace blame-based language with descriptions of behaviour and context.",
    );
  }

  // ── Chronology ────────────────────────────────────────────────────────────
  const chronologyPresent = isSignificant ? hasChronology(combinedText) : true;

  audit.push({
    ruleId: "PRI_CHRONOLOGY",
    engine: ENGINE,
    triggered: isSignificant && !chronologyPresent,
    reason: chronologyPresent
      ? "Temporal sequence or timeline language is present."
      : "No clear chronological sequence detected in the description.",
    severity: isSignificant && !chronologyPresent ? "prompt" : "info",
    timestamp: now,
  });

  if (isSignificant && !chronologyPresent) {
    missingElements.push("A clear chronological sequence of events");
    suggestedRewritePrompts.push(
      "Add a clear chronological sequence: what happened before, during, and after. Include approximate times where relevant.",
    );
  }

  // ── Plan reference ────────────────────────────────────────────────────────
  const planReferenced = hasPlanReference(combinedText);

  audit.push({
    ruleId: "PRI_PLAN_REFERENCE",
    engine: ENGINE,
    triggered: isSignificant && !planReferenced,
    reason: planReferenced
      ? "Reference to care plan, risk assessment or agreed strategy is present."
      : "No reference to care plan, behaviour support plan or agreed strategy.",
    severity: "info",
    timestamp: now,
  });

  if (isSignificant && !planReferenced) {
    missingElements.push("Reference to the child's plan or agreed strategy");
    suggestedRewritePrompts.push(
      "Consider linking this record to what the care plan, risk assessment or behaviour support plan says about this type of situation.",
    );
  }

  // ── Unsafe speculation ────────────────────────────────────────────────────
  const unsafeSpeculation = hasUnsafeSpeculation(combinedText);

  audit.push({
    ruleId: "PRI_UNSAFE_SPECULATION",
    engine: ENGINE,
    triggered: unsafeSpeculation,
    reason: unsafeSpeculation
      ? "Language that may constitute unsafe speculation or unhelpful generalisation detected."
      : "No unsafe speculation detected.",
    severity: unsafeSpeculation ? "warning" : "info",
    timestamp: now,
  });

  if (unsafeSpeculation) {
    suggestedRewritePrompts.push(
      "Be curious rather than conclusive. Describe what was observed and what may have been happening for the child, using words like 'appeared', 'seemed', or 'may have'.",
    );
  }

  // ── Adult action visible ──────────────────────────────────────────────────
  const adultActionPresent = hasAdultAction(combinedText);

  audit.push({
    ruleId: "PRI_ADULT_ACTION",
    engine: ENGINE,
    triggered: !adultActionPresent,
    reason: adultActionPresent
      ? "Adult actions and responses are described."
      : "Adult response is not clearly visible in the record.",
    severity: !adultActionPresent ? "prompt" : "info",
    timestamp: now,
  });

  if (!adultActionPresent) {
    missingElements.push("Description of what staff did to help");
    suggestedRewritePrompts.push(
      "Add what staff did to reduce pressure, support the child, and preserve dignity — not just what the child did.",
    );
  }

  // ── Follow-up actions ─────────────────────────────────────────────────────
  const followUpPresent = hasFollowUp(combinedText) || !!record.repairRecorded;

  audit.push({
    ruleId: "PRI_FOLLOW_UP",
    engine: ENGINE,
    triggered: isSignificant && !followUpPresent,
    reason: followUpPresent
      ? "Follow-up actions or next steps are referenced."
      : "No follow-up actions or next steps recorded.",
    severity: isSignificant && !followUpPresent ? "prompt" : "info",
    timestamp: now,
  });

  if (isSignificant && !followUpPresent) {
    missingElements.push("Follow-up actions or next steps");
    suggestedRewritePrompts.push(
      "Add what happens next: repair conversation, follow-up key work, notification, plan review, or manager oversight.",
    );
  }

  // ── Quality scores (0–100) ────────────────────────────────────────────────
  const descLength = record.description.length;

  const factualClarityScore = Math.min(100,
    30 +
    (descLength > 50 ? 15 : 0) +
    (descLength > 150 ? 15 : 0) +
    (descLength > 300 ? 10 : 0) +
    (chronologyPresent ? 15 : 0) +
    (!unsafeSpeculation ? 15 : 0),
  );

  const childCentredLanguageScore = Math.min(100, Math.max(10,
    70 -
    flaggedLanguage.length * 15 +
    (childVoicePresent ? 10 : 0) +
    (planReferenced ? 5 : 0) +
    (!unsafeSpeculation ? 10 : 0) +
    (!hasBlameLang ? 5 : 0),
  ));

  const analysisScore = Math.min(100,
    20 +
    (planReferenced ? 30 : 0) +
    (chronologyPresent ? 20 : 0) +
    (!!record.staffResponse && record.staffResponse.length > 20 ? 30 : 0),
  );

  const staffActionScore = Math.min(100,
    20 +
    (adultActionPresent ? 30 : 0) +
    (!!record.staffResponse && record.staffResponse.length > 50 ? 30 : 0) +
    (combinedText.toLowerCase().includes("de-escalat") || combinedText.toLowerCase().includes("deescalat") ? 20 : 0),
  );

  const childVoiceScore = childVoicePresent
    ? (record.childVoice!.trim().length > 20 ? 95 : 70)
    : isSignificant ? 20 : 60;

  const followUpScore = Math.min(100,
    20 +
    (followUpPresent ? 50 : 0) +
    (!!record.repairRecorded ? 30 : 0),
  );

  const riskClarityScore = record.immediateRisk && record.immediateRisk !== "none" ? 80 : 50;

  return {
    review: {
      factualClarityScore,
      childCentredLanguageScore,
      analysisScore,
      staffActionScore,
      childVoiceScore,
      followUpScore,
      riskClarityScore,
      flaggedLanguage,
      missingElements,
      suggestedRewritePrompts,
    },
    audit,
  };
}
