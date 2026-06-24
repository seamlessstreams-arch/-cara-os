// ══════════════════════════════════════════════════════════════════════════════
// CARA — CARA HEART RESIDENTIAL PRACTICE ENGINE (pure / deterministic)
//
// Master orchestrator for the Cara Heart practice intelligence layer.
// Receives a single CaraPracticeRecord and returns a CaraPracticeIntelligenceOutput
// containing a Heart Card plus outputs from all 11 sub-engines.
//
// Architecture:
//   1. SafeguardingOverrideEngine   — runs first, always
//   2. CaraHeartEngine              — dignity, child voice, blame language
//   3. AntiCriminalisationEngine    — police decision support
//   4. LifeSpaceEngine              — other twenty-three hours classification
//   5. ResidentialInterventionEngine — placement as purposeful care
//   6. SocialPedagogyEngine         — Head / Heart / Hands reflection
//   7. CareForCarersEngine          — staff wellbeing signals
//   8. RestorativeRepairEngine      — repair plans
//   9. ChildVoiceRightsEngine       — rights and voice review
//  10. LLM gate                     — decides whether AI enhancement is needed
//
// All engines are pure + deterministic. No API calls are made here.
// Professional accountability: Cara advises. Professionals decide. Managers review.
// ══════════════════════════════════════════════════════════════════════════════

import type {
  CaraPracticeRecord,
  CaraPracticeIntelligenceOutput,
  CaraHeartCard,
  HeartTone,
  IntelligenceAuditEntry,
  IntelligenceMode,
  ManagerPatternInsight,
} from "./types";

import { runSafeguardingOverride } from "./engines/safeguarding-override-engine";
import { runCaraHeartEngine } from "./engines/cara-heart-engine";
import { runAntiCriminalisationEngine } from "./engines/anti-criminalisation-engine";
import { runLifeSpaceEngine } from "./engines/life-space-engine";
import { runResidentialInterventionEngine } from "./engines/residential-intervention-engine";
import { runSocialPedagogyEngine } from "./engines/social-pedagogy-engine";
import { runCareForCarersEngine } from "./engines/care-for-carers-engine";
import { runRepairEngine } from "./engines/repair-engine";
import { runChildVoiceRightsEngine } from "./engines/child-voice-rights-engine";

export const CARA_HEART_DISCLAIMER =
  "Cara supports professional reflection and recording. Staff and managers remain fully accountable for safeguarding decisions, statutory notifications, professional judgement, and any immediate protective action required.";

const PROFESSIONAL_REMINDER =
  "Cara supports professional reflection. Staff and managers remain accountable for safeguarding and decision-making.";

// ── LLM gate ─────────────────────────────────────────────────────────────────

interface LlmGateResult {
  required: boolean;
  reason?: string;
  mode: IntelligenceMode;
}

function assessLlmNeed(
  record: CaraPracticeRecord,
  deterministicPrompts: string[],
): LlmGateResult {
  const severity = record.severity ?? 1;
  const lower = [record.description, record.staffResponse ?? ""].join(" ").toLowerCase();

  // LLM NOT needed: deterministic checks are sufficient for common cases
  if (severity <= 2 && deterministicPrompts.length <= 2) {
    return { required: false, mode: "deterministic_only" };
  }

  // LLM recommended: complex narrative, multi-dimensional, senior review
  if (
    severity >= 4 ||
    record.restraintUsed ||
    record.sexualHarmConcern ||
    record.exploitationConcern ||
    (lower.includes("complex") && lower.includes("pattern"))
  ) {
    return {
      required: true,
      reason:
        "This record involves complex or high-severity content where an AI-assisted reflective summary may add value. This remains optional — deterministic prompts are complete without it.",
      mode: "llm_required",
    };
  }

  if (severity >= 3 || record.policeCalled || record.missingFromCare) {
    return {
      required: false,
      reason:
        "AI-enhanced narrative could deepen this reflection, but the deterministic prompts are sufficient.",
      mode: "hybrid",
    };
  }

  return { required: false, mode: "deterministic_only" };
}

// ── Heart Card builder ────────────────────────────────────────────────────────

function buildHeartCard(
  record: CaraPracticeRecord,
  allPrompts: string[],
  allMissingInfo: string[],
  allSuggestedActions: string[],
  escalationRequired: boolean,
  override: { triggered: boolean; urgency: "standard" | "same_day" | "immediate" },
): CaraHeartCard {
  let tone: HeartTone = "reflective";
  let summary = "";

  if (override.triggered && override.urgency === "immediate") {
    tone = "urgent";
    summary =
      "Immediate safeguarding action may be required. Address immediate safety first. Reflective recording should follow once everyone is safe.";
  } else if (override.triggered && override.urgency === "same_day") {
    tone = "managerial";
    summary =
      "This record requires same-day manager attention. Key actions are outstanding. Please review the safeguarding prompts below.";
  } else if (escalationRequired) {
    tone = "managerial";
    summary =
      "This record contains indicators that require manager oversight. The prompts below will support a thorough review.";
  } else if (allMissingInfo.length >= 3) {
    tone = "reflective";
    summary =
      "This record captures the essential facts, but would benefit from deeper reflection. The prompts below support a more complete professional record.";
  } else if (allMissingInfo.length === 0 && allPrompts.length <= 1) {
    tone = "supportive";
    summary =
      "This record is well structured. The prompts below offer further opportunities for professional reflection and learning.";
  } else {
    tone = "reflective";
    summary =
      "This record captures the event, and the prompts below invite deeper reflection on the child's experience, staff response, and next steps.";
  }

  return {
    title: "Cara Heart Reflection",
    tone,
    summary,
    prompts: allPrompts.slice(0, 8),
    missingInformation: allMissingInfo,
    suggestedActions: allSuggestedActions.slice(0, 6),
    escalationRequired,
    professionalReminder: PROFESSIONAL_REMINDER,
  };
}

// ── Manager pattern insights (from record signals) ────────────────────────────

function deriveManagerPatternInsights(record: CaraPracticeRecord, now: string): ManagerPatternInsight[] {
  const insights: ManagerPatternInsight[] = [];
  const today = now.slice(0, 10);

  if (record.type === "incident" || record.type === "behaviour_record") {
    insights.push({
      patternType: "incident_frequency",
      childId: record.childId,
      dateRange: { from: today, to: today },
      evidence: ["Single incident recorded — review in context of recent history"],
      riskLevel: (record.severity ?? 1) >= 4 ? "high" : (record.severity ?? 1) >= 3 ? "medium" : "low",
      recommendedManagerActions: [
        "Review this incident alongside the child's recent record to identify any patterns.",
        "Consider whether the care plan or behaviour support plan needs to be updated.",
      ],
      supervisionPrompts: [
        "Is this child's behaviour changing over time? In what direction?",
        "Are staff responses to this child consistent and plan-led?",
      ],
      planReviewNeeded: (record.severity ?? 1) >= 4,
    });
  }

  if (record.policeCalled) {
    insights.push({
      patternType: "police_contact",
      childId: record.childId,
      dateRange: { from: today, to: today },
      evidence: ["Police contact recorded — review in context of recent history"],
      riskLevel: "medium",
      recommendedManagerActions: [
        "Review recent police contact to understand whether this is a pattern.",
        "Consider whether anti-criminalisation strategy needs to be embedded in the placement plan.",
      ],
      supervisionPrompts: [
        "Is police involvement becoming normalised for this child?",
        "Is the team using the minimum necessary response to keep everyone safe?",
      ],
      planReviewNeeded: true,
    });
  }

  if (record.missingFromCare) {
    insights.push({
      patternType: "missing_episode",
      childId: record.childId,
      dateRange: { from: today, to: today },
      evidence: ["Missing from care episode recorded — review in context of recent history"],
      riskLevel: record.immediateRisk === "high" || record.immediateRisk === "critical" ? "high" : "medium",
      recommendedManagerActions: [
        "Review recent missing episodes to identify patterns, triggers, and protective factors.",
        "Ensure the missing from care plan is current and known to all staff.",
      ],
      supervisionPrompts: [
        "What is driving this child's missing episodes?",
        "Is the home a place the child feels safe to return to?",
      ],
      planReviewNeeded: true,
    });
  }

  if (!record.staffDebriefRecorded && (record.severity ?? 1) >= 3) {
    insights.push({
      patternType: "staff_stress",
      childId: record.childId,
      staffIds: record.staffIds,
      dateRange: { from: today, to: today },
      evidence: ["High-severity record without staff debrief recorded"],
      riskLevel: "low",
      recommendedManagerActions: [
        "Review whether staff debriefs are being completed after high-intensity incidents.",
        "Consider whether the team needs a reflective discussion about this child's presentation.",
      ],
      supervisionPrompts: [
        "Are staff receiving adequate support and debriefing after difficult incidents?",
        "Is compassion fatigue or burnout risk visible in the team?",
      ],
      planReviewNeeded: false,
    });
  }

  return insights;
}

// ── Main orchestrator function ────────────────────────────────────────────────

export function runCaraHeartResidentialPracticeEngine(
  record: CaraPracticeRecord,
  opts?: { now?: string },
): CaraPracticeIntelligenceOutput {
  const now = opts?.now ?? new Date().toISOString();
  const allAudit: IntelligenceAuditEntry[] = [];
  const deterministicPrompts: string[] = [];
  const missingInformation: string[] = [];
  const suggestedActions: string[] = [];

  // ── 1. Safeguarding override (always runs first) ──────────────────────────
  const { override, audit: sgAudit } = runSafeguardingOverride(record, now);
  allAudit.push(...sgAudit);

  if (override.triggered) {
    deterministicPrompts.unshift(
      "IMMEDIATE SAFEGUARDING ACTION MAY BE REQUIRED. Follow the home's safeguarding procedures and emergency protocols. Reflective recording should follow once immediate safety has been addressed.",
    );
    // Surface ALL required safeguarding actions — slice(0, 2) silently dropped a
    // distinct emergency instruction (e.g. staff-injury medical attention) when 3+
    // immediate flags fired together.
    suggestedActions.unshift(...override.requiredAction);
  }

  // ── 2. Cara Heart check ───────────────────────────────────────────────────
  const { heartCheck, recordingQuality, audit: heartAudit } = runCaraHeartEngine(record, now);
  allAudit.push(...heartAudit);
  deterministicPrompts.push(...heartCheck.suggestedPrompts);
  missingInformation.push(...heartCheck.missingInformation);

  if (recordingQuality.flaggedLanguage.length > 0) {
    suggestedActions.push(
      `Review the recording quality prompts: ${recordingQuality.flaggedLanguage.length} phrase(s) may benefit from more curious, child-centred language.`,
    );
  }

  // ── 3. Child voice & rights ───────────────────────────────────────────────
  const { review: cvr, audit: cvrAudit } = runChildVoiceRightsEngine(record, now);
  allAudit.push(...cvrAudit);

  if (!cvr.childVoicePresent) {
    if (!missingInformation.includes("The child's voice")) {
      missingInformation.push("The child's voice");
    }
  }

  if (cvr.advocacyNeeded) {
    suggestedActions.push("Consider whether the child would benefit from an independent advocate.");
  }

  // ── 4. Anti-criminalisation ───────────────────────────────────────────────
  const { review: acr, audit: acrAudit } = runAntiCriminalisationEngine(record, now);
  allAudit.push(...acrAudit);

  if (acr.antiCriminalisationWarning) {
    deterministicPrompts.push(acr.antiCriminalisationWarning);
    suggestedActions.push("Record the rationale for the police contact decision.");
  }

  if (acr.managerConsultationRequired && !record.managerConsulted) {
    suggestedActions.push("Ensure manager consultation is recorded for this record.");
  }

  // ── 5. Repair ─────────────────────────────────────────────────────────────
  const { plan: repairPlan, audit: repairAudit } = runRepairEngine(record, now);
  allAudit.push(...repairAudit);

  if (repairPlan && !record.repairRecorded) {
    deterministicPrompts.push(
      "Plan a restorative repair conversation with the child when they are regulated and it is safe to do so.",
    );
    suggestedActions.push("Schedule a repair conversation and record the outcome.");
  }

  // ── 6. Staff support ──────────────────────────────────────────────────────
  const { signals: staffSignals, audit: ccAudit } = runCareForCarersEngine(record, now);
  allAudit.push(...ccAudit);

  if (staffSignals.length > 0 && staffSignals[0].supportNeed !== "none") {
    deterministicPrompts.push(staffSignals[0].recommendedAction[0] ?? "Offer staff support after this record.");
    suggestedActions.push(`Staff support: ${staffSignals[0].supportNeed.replace(/_/g, " ")}`);
  }

  // ── 7. Life space ─────────────────────────────────────────────────────────
  const { moments, audit: lsAudit } = runLifeSpaceEngine(record, now);
  allAudit.push(...lsAudit);

  if (moments.length > 0) {
    deterministicPrompts.push(moments[0].recordingPrompt);
  }

  // ── 8. Residential intervention ──────────────────────────────────────────
  const { insight: riInsight, audit: riAudit } = runResidentialInterventionEngine(record, now);
  allAudit.push(...riAudit);

  if (riInsight.riskOfReactiveCare === "high") {
    // Select the reactive-care warning by IDENTITY, not position — a later prompt
    // ("Behind every challenging behaviour…") is pushed after it for incident /
    // behaviour records, so [length - 1] dropped the warning in exactly those cases.
    const reactiveWarning = riInsight.staffPracticePrompts.find((p) =>
      p.includes("responding reactively rather than therapeutically"),
    );
    if (reactiveWarning) deterministicPrompts.push(reactiveWarning);
  }

  // ── 9. Social pedagogy ────────────────────────────────────────────────────
  const { reflection: spReflection, audit: spAudit } = runSocialPedagogyEngine(record, now);
  allAudit.push(...spAudit);

  // ── 10. LLM gate ──────────────────────────────────────────────────────────
  const llmGate = assessLlmNeed(record, deterministicPrompts);

  // ── 11. Manager pattern insights ──────────────────────────────────────────
  const patternInsights = deriveManagerPatternInsights(record, now);

  // ── Escalation determination ──────────────────────────────────────────────
  const escalationRequired =
    override.triggered ||
    heartCheck.managerOversightNeeded ||
    (acr.managerConsultationRequired && !record.managerConsulted) ||
    (record.statutoryNotificationRequired === true && !record.statutoryNotificationCompleted);

  // ── Heart Card ────────────────────────────────────────────────────────────
  const heartCard = buildHeartCard(
    record,
    deterministicPrompts,
    missingInformation,
    suggestedActions,
    escalationRequired,
    override,
  );

  return {
    recordId: record.id,
    childId: record.childId,
    heartCard,
    heartCheck,
    safeguardingOverride: override,
    residentialInterventionInsight: riInsight,
    lifeSpaceMoments: moments,
    antiCriminalisationReview: (record.policeCalled || record.policeConsidered) ? acr : undefined,
    socialPedagogyReflection: spReflection,
    staffSupportSignals: staffSignals.length > 0 ? staffSignals : undefined,
    repairPlan: repairPlan ?? undefined,
    childVoiceRightsReview: cvr,
    recordingQualityReview: recordingQuality,
    managerPatternInsights: patternInsights.length > 0 ? patternInsights : undefined,
    deterministicPrompts,
    llmRequired: llmGate.required,
    llmReason: llmGate.reason,
    mode: llmGate.mode,
    auditTrail: allAudit,
  };
}
