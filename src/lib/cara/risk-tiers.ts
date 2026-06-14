// ══════════════════════════════════════════════════════════════════════════════
// Cara — RISK TIER CLASSIFICATION SYSTEM
// Classifies every agent action into a risk tier and derives the governance
// controls that must be satisfied before the action output is committed.
//
// HIGH-RISK actions require:
//   - Manager approval (with recorded approval/rejection reason)
//   - Explicit source evidence linked to every claim
//   - Full audit log entry
//   - Confidence score on every output
//   - Human review note before commit
// ══════════════════════════════════════════════════════════════════════════════

import type { RiskTier } from "@/types/cara-reports";

// ── Risk Classification Result ──────────────────────────────────────────────

export interface RiskClassification {
  tier: RiskTier;
  requiresApproval: boolean;
  requiresEvidence: boolean;
  requiresAudit: boolean;
  requiresConfidenceScore: boolean;
  requiresHumanReviewNote: boolean;
}

// ── Action Lists by Risk Tier ───────────────────────────────────────────────

export const LOW_RISK_ACTIONS: string[] = [
  // Therapeutic practice agent
  "review_language_quality",
  "suggest_therapeutic_framing",
  "generate_reflective_prompts",
  "identify_keywork_themes",
  "check_dignity_language",
  "suggest_practice_bank_entries",
  "review_behaviour_descriptions",
  "identify_attachment_themes",
  // Filing agent
  "classify_document",
  "suggest_filing_location",
  "extract_key_information",
  "suggest_record_links",
  "tag_document_metadata",
  "detect_duplicate_documents",
  "generate_document_summary",
  "suggest_follow_up_actions",
  // General read-only
  "compare_period_quality",
  "compare_monthly_trends",
  "compare_risk_over_time",
];

export const MEDIUM_RISK_ACTIONS: string[] = [
  // Oversight agent
  "scan_recording_quality",
  "identify_oversight_gaps",
  "flag_missing_child_voice",
  "detect_care_plan_drift",
  "generate_oversight_summary",
  "suggest_manager_actions",
  "highlight_evidence_gaps",
  // Report generator agent
  "retrieve_evidence",
  "generate_report_sections",
  "calculate_confidence_scores",
  "link_evidence_to_sections",
  "detect_evidence_gaps",
  "suggest_report_actions",
  "generate_executive_summary",
  "adapt_tone_for_audience",
  "version_report",
  // Regulation 45 evidence agent
  "scan_monthly_evidence",
  "categorise_evidence_items",
  "score_evidence_quality",
  "identify_weak_evidence_areas",
  "map_evidence_to_quality_standards",
  "suggest_evidence_for_inclusion",
  "generate_reg45_summary",
  // Workforce agent
  "analyse_staffing_patterns",
  "check_supervision_compliance",
  "identify_training_gaps",
  "assess_team_stability",
  "correlate_staffing_and_incidents",
  "flag_workforce_risks",
  "generate_workforce_summary",
  "suggest_staffing_actions",
];

export const HIGH_RISK_ACTIONS: string[] = [
  // Safeguarding agent
  "analyse_incident_patterns",
  "detect_exploitation_indicators",
  "flag_escalating_concerns",
  "check_notification_thresholds",
  "cross_reference_missing_episodes",
  "identify_peer_on_peer_risks",
  "summarise_safeguarding_timeline",
  "suggest_safeguarding_actions",
  // Risk assessment agent
  "analyse_risk_history",
  "detect_risk_escalation",
  "flag_overdue_risk_assessments",
  "cross_reference_incidents_and_risk",
  "generate_risk_summary",
  "suggest_risk_mitigation_actions",
  "identify_emerging_risks",
  // Any action that produces an externally-facing output
  "generate_social_worker_report",
  "generate_ofsted_report",
  "generate_regulation45_report",
  "generate_placement_stability_report",
  "generate_end_of_placement_report",
];

// ── Pre-built lookup set for O(1) classification ────────────────────────────

const LOW_SET = new Set(LOW_RISK_ACTIONS);
const MEDIUM_SET = new Set(MEDIUM_RISK_ACTIONS);
const HIGH_SET = new Set(HIGH_RISK_ACTIONS);

// ── Classification Definitions ──────────────────────────────────────────────

const LOW_CLASSIFICATION: RiskClassification = {
  tier: "low",
  requiresApproval: false,
  requiresEvidence: false,
  requiresAudit: true,
  requiresConfidenceScore: false,
  requiresHumanReviewNote: false,
};

const MEDIUM_CLASSIFICATION: RiskClassification = {
  tier: "medium",
  requiresApproval: false,
  requiresEvidence: true,
  requiresAudit: true,
  requiresConfidenceScore: true,
  requiresHumanReviewNote: false,
};

const HIGH_CLASSIFICATION: RiskClassification = {
  tier: "high",
  requiresApproval: true,
  requiresEvidence: true,
  requiresAudit: true,
  requiresConfidenceScore: true,
  requiresHumanReviewNote: true,
};

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Classifies an action type into a risk tier and returns the full set of
 * governance controls that apply.
 *
 * Unknown actions default to HIGH risk — fail-safe by design.
 */
export function classifyRisk(actionType: string): RiskClassification {
  if (HIGH_SET.has(actionType)) return HIGH_CLASSIFICATION;
  if (MEDIUM_SET.has(actionType)) return MEDIUM_CLASSIFICATION;
  if (LOW_SET.has(actionType)) return LOW_CLASSIFICATION;

  // Unknown actions are treated as high risk — never fail open.
  return HIGH_CLASSIFICATION;
}

/**
 * Returns true if the action type is classified as high risk.
 * Unknown actions are treated as high risk.
 */
export function isHighRisk(actionType: string): boolean {
  return classifyRisk(actionType).tier === "high";
}

/**
 * Returns true if the action type requires manager approval before its
 * output can be committed. This is true for all high-risk actions and
 * false for medium/low risk actions.
 */
export function requiresManagerApproval(actionType: string): boolean {
  return classifyRisk(actionType).requiresApproval;
}
