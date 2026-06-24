// ══════════════════════════════════════════════════════════════════════════════
// CARA HEART — CaraHeartEngine (pure / deterministic)
//
// The ethical and relational centre of the Cara practice intelligence system.
// Reviews significant records and asks whether the record:
//   - Protects the child's dignity
//   - Includes the child's voice
//   - Explains what adults did to help
//   - Considers trauma and context
//   - Avoids blame-based language
//   - Identifies whether repair was considered
//   - Identifies whether staff or manager support is needed
//
// All outputs are supportive and non-shaming. Cara never says "you failed to…"
// ══════════════════════════════════════════════════════════════════════════════

import type {
  CaraPracticeRecord,
  CaraHeartCheck,
  RecordingQualityReview,
  IntelligenceAuditEntry,
} from "../types";
import { scanForBlameLanguage } from "./language-flags";

const ENGINE = "CaraHeartEngine";

const SIGNIFICANT_TYPES = new Set([
  "incident",
  "physical_intervention",
  "police_contact",
  "missing_episode",
  "behaviour_record",
]);

/** Returns true when the description contains genuine reflection on adult action. */
function hasAdultReflection(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes("staff") ||
    lower.includes("worker") ||
    lower.includes("adult") ||
    lower.includes("we ") ||
    lower.includes("i ") ||
    lower.includes("deescalat") ||
    lower.includes("de-escalat") ||
    lower.includes("offered") ||
    lower.includes("supported") ||
    lower.includes("reduced") ||
    lower.includes("intervened") ||
    lower.includes("prompted")
  );
}

/** Returns true when trauma/context language is present. */
function hasTraumaContext(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes("trigger") ||
    lower.includes("trauma") ||
    lower.includes("anxiety") ||
    lower.includes("pattern") ||
    lower.includes("history") ||
    lower.includes("background") ||
    lower.includes("sensory") ||
    lower.includes("regulation") ||
    lower.includes("overwhelm") ||
    lower.includes("known") ||
    lower.includes("placement plan") ||
    lower.includes("care plan")
  );
}

/** Returns true when proportionality language is present. */
function hasProportionalityContext(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes("proportionat") ||
    lower.includes("least restrict") ||
    lower.includes("rationale") ||
    lower.includes("alternative") ||
    lower.includes("considered") ||
    lower.includes("necessary") ||
    lower.includes("dignity")
  );
}

export interface CaraHeartEngineResult {
  heartCheck: CaraHeartCheck;
  recordingQuality: RecordingQualityReview;
  audit: IntelligenceAuditEntry[];
}

export function runCaraHeartEngine(
  record: CaraPracticeRecord,
  now: string = new Date().toISOString(),
): CaraHeartEngineResult {
  const audit: IntelligenceAuditEntry[] = [];
  const missingInfo: string[] = [];
  const suggestedPrompts: string[] = [];

  const combinedText = [
    record.description,
    record.staffResponse ?? "",
    record.childVoice ?? "",
    record.childPresentation ?? "",
  ].join(" ");

  // ── Blame language scan ───────────────────────────────────────────────────
  const flaggedLanguage = scanForBlameLanguage(combinedText);
  const hasBlameLang = flaggedLanguage.length > 0;

  audit.push({
    ruleId: "CH_BLAME_LANGUAGE",
    engine: ENGINE,
    triggered: hasBlameLang,
    reason: hasBlameLang
      ? `${flaggedLanguage.length} blame/imprecise phrase(s) detected.`
      : "No blame language detected.",
    severity: hasBlameLang ? "warning" : "info",
    timestamp: now,
  });

  if (hasBlameLang) {
    suggestedPrompts.push(
      "Some of the language in this record may benefit from a more curious, child-centred approach. See the recording quality review for specific prompts.",
    );
  }

  // ── Child voice ───────────────────────────────────────────────────────────
  const severity = record.severity ?? 1;
  const isSignificant = SIGNIFICANT_TYPES.has(record.type) || severity >= 3;
  const childVoicePresent = !!record.childVoice && record.childVoice.trim().length > 5;

  audit.push({
    ruleId: "CH_CHILD_VOICE",
    engine: ENGINE,
    triggered: isSignificant && !childVoicePresent,
    reason: childVoicePresent
      ? "Child voice is present in the record."
      : isSignificant
        ? "Significant record without child voice captured."
        : "Record is low severity — child voice not required.",
    severity: isSignificant && !childVoicePresent ? "warning" : "info",
    timestamp: now,
  });

  if (isSignificant && !childVoicePresent) {
    missingInfo.push("The child's voice");
    suggestedPrompts.push(
      "The child's voice is not yet visible in this record. Add what the child said, how they presented, whether they declined to speak, or when this will be revisited.",
    );
  }

  // ── Adult reflection ──────────────────────────────────────────────────────
  const adultReflection = hasAdultReflection(combinedText);
  audit.push({
    ruleId: "CH_ADULT_REFLECTION",
    engine: ENGINE,
    triggered: !adultReflection,
    reason: adultReflection
      ? "Adult actions are reflected in the record."
      : "Adult response is not clearly described.",
    severity: !adultReflection ? "prompt" : "info",
    timestamp: now,
  });

  if (!adultReflection) {
    missingInfo.push("Detail of what staff did to help");
    suggestedPrompts.push(
      "This record would benefit from more detail about what staff did to reduce pressure, support the child, and preserve dignity.",
    );
  }

  // ── Trauma context ────────────────────────────────────────────────────────
  const traumaContext = isSignificant ? hasTraumaContext(combinedText) : true;
  audit.push({
    ruleId: "CH_TRAUMA_CONTEXT",
    engine: ENGINE,
    triggered: isSignificant && !traumaContext,
    reason: traumaContext
      ? "Trauma or trigger context is referenced."
      : "No reference to possible triggers, trauma context or known patterns.",
    severity: isSignificant && !traumaContext ? "prompt" : "info",
    timestamp: now,
  });

  if (isSignificant && !traumaContext) {
    suggestedPrompts.push(
      "Consider whether known triggers, trauma history, sensory needs, or patterns from the care plan may have contributed to what happened.",
    );
  }

  // ── Repair ────────────────────────────────────────────────────────────────
  const repairTypes = new Set([
    "incident",
    "physical_intervention",
    "police_contact",
    "behaviour_record",
    "missing_episode",
  ]);
  const repairNeeded = repairTypes.has(record.type);
  const repairMissing = repairNeeded && !record.repairRecorded;

  audit.push({
    ruleId: "CH_REPAIR",
    engine: ENGINE,
    triggered: repairMissing,
    reason: repairMissing
      ? "Relational repair not yet recorded for this record type."
      : "Repair recorded or not required for this record type.",
    severity: repairMissing ? "prompt" : "info",
    timestamp: now,
  });

  if (repairMissing) {
    missingInfo.push("A repair plan or restorative conversation");
    suggestedPrompts.push(
      "Repair is not yet recorded. Add whether a restorative conversation happened, or when one will be attempted.",
    );
  }

  // ── Rights language ───────────────────────────────────────────────────────
  const lower = combinedText.toLowerCase();
  const rightsConsidered =
    lower.includes("right") ||
    lower.includes("choice") ||
    lower.includes("voice") ||
    lower.includes("advocate") ||
    lower.includes("dignity") ||
    lower.includes("privacy");

  audit.push({
    ruleId: "CH_RIGHTS",
    engine: ENGINE,
    triggered: isSignificant && !rightsConsidered,
    reason: rightsConsidered
      ? "Rights or dignity language is present."
      : "No explicit reference to rights, dignity or child choice.",
    severity: "info",
    timestamp: now,
  });

  // ── Staff support ─────────────────────────────────────────────────────────
  const staffSupportConsidered =
    !!record.staffDebriefRecorded ||
    lower.includes("debrief") ||
    lower.includes("staff support") ||
    lower.includes("supervision") ||
    lower.includes("wellbeing check") ||
    lower.includes("welfare check");

  audit.push({
    ruleId: "CH_STAFF_SUPPORT",
    engine: ENGINE,
    triggered: severity >= 4 && !staffSupportConsidered,
    reason:
      severity >= 4 && !staffSupportConsidered
        ? "High-severity record without reference to staff support or debrief."
        : "Staff support considered or not required at this severity.",
    severity: severity >= 4 && !staffSupportConsidered ? "warning" : "info",
    timestamp: now,
  });

  if (severity >= 4 && !staffSupportConsidered) {
    missingInfo.push("A staff debrief or support plan");
    suggestedPrompts.push(
      "This was a high-intensity record. Consider whether staff have had an opportunity to debrief, reflect, and receive support before their next shift.",
    );
  }

  // ── Manager oversight ─────────────────────────────────────────────────────
  // Explicit safeguarding concerns must drive oversight/escalation regardless of
  // severity — otherwise an exploitation or self-harm concern at low severity read
  // as "no escalation needed" while the SafeguardingOverrideEngine fired an override.
  const managerOversightNeeded =
    severity >= 4 ||
    record.immediateRisk === "high" ||
    record.immediateRisk === "critical" ||
    !!record.restraintUsed ||
    !!record.policeCalled ||
    !!record.missingFromCare ||
    !!record.weaponConcern ||
    !!record.sexualHarmConcern ||
    !!record.exploitationConcern ||
    !!record.fireSettingConcern ||
    !!record.selfHarmConcern;

  audit.push({
    ruleId: "CH_MANAGER_OVERSIGHT",
    engine: ENGINE,
    triggered: managerOversightNeeded && !record.managerConsulted,
    reason: managerOversightNeeded
      ? record.managerConsulted
        ? "Manager consultation recorded."
        : "Manager oversight needed but not yet recorded."
      : "Manager oversight not required for this record.",
    severity: managerOversightNeeded && !record.managerConsulted ? "warning" : "info",
    timestamp: now,
  });

  if (managerOversightNeeded && !record.managerConsulted) {
    missingInfo.push("Manager consultation");
    suggestedPrompts.push(
      "This record suggests manager oversight is needed. Ensure the manager has been consulted and that their response is recorded.",
    );
  }

  // ── Proportionality ───────────────────────────────────────────────────────
  const proportionalityContext =
    !record.restraintUsed && !record.policeCalled
      ? true
      : hasProportionalityContext(combinedText);

  audit.push({
    ruleId: "CH_PROPORTIONALITY",
    engine: ENGINE,
    triggered: !proportionalityContext,
    reason: proportionalityContext
      ? "Proportionality or rationale is referenced."
      : "No proportionality rationale recorded for restraint or police contact.",
    severity: !proportionalityContext ? "warning" : "info",
    timestamp: now,
  });

  if (!proportionalityContext) {
    suggestedPrompts.push(
      "Record the rationale for the intervention used. Was the least restrictive option considered? Was dignity maintained throughout?",
    );
  }

  // ── Dignity ───────────────────────────────────────────────────────────────
  const dignityMentioned =
    lower.includes("dignity") ||
    lower.includes("respectful") ||
    lower.includes("private") ||
    lower.includes("calm") ||
    lower.includes("comforting");
  // Dignity is considered protected if nothing in the record explicitly conflicts
  const dignityProtected = !hasBlameLang;

  // ── Recording quality scores (0–100) ─────────────────────────────────────
  const factualClarityScore = record.description.length > 50 ? 70 : 30;
  const childCentredScore = hasBlameLang
    ? Math.max(10, 60 - flaggedLanguage.length * 10)
    : childVoicePresent
      ? 90
      : 55;
  const analysisScore = traumaContext && adultReflection ? 80 : traumaContext || adultReflection ? 50 : 25;
  const staffActionScore = adultReflection ? 75 : 30;
  const childVoiceScore = childVoicePresent ? 90 : isSignificant ? 20 : 60;
  const followUpScore = record.repairRecorded || !repairNeeded ? 80 : 30;
  const riskClarityScore = record.immediateRisk && record.immediateRisk !== "none" ? 75 : 50;

  return {
    heartCheck: {
      childDignityProtected: dignityProtected,
      childVoiceIncluded: childVoicePresent,
      adultReflectionIncluded: adultReflection,
      traumaContextConsidered: traumaContext,
      relationalRepairConsidered: !!record.repairRecorded || !repairNeeded,
      rightsConsidered,
      antiCriminalisationConsidered:
        !record.policeCalled && !record.policeConsidered ? true : proportionalityContext,
      proportionalityConsidered: proportionalityContext,
      staffSupportConsidered: staffSupportConsidered || severity < 4,
      managerOversightNeeded,
      safeguardingEscalationNeeded: managerOversightNeeded,
      missingInformation: missingInfo,
      suggestedPrompts,
    },
    recordingQuality: {
      factualClarityScore,
      childCentredLanguageScore: childCentredScore,
      analysisScore,
      staffActionScore,
      childVoiceScore,
      followUpScore,
      riskClarityScore,
      flaggedLanguage,
      missingElements: missingInfo,
      suggestedRewritePrompts: suggestedPrompts,
    },
    audit,
  };
}
