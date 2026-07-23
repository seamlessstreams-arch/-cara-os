// ══════════════════════════════════════════════════════════════════════════════
// CARA — RI SCORE COMPUTATION
// Derives the 15 governance metrics from existing in-memory store data.
//
// A metric with no evidence behind it is null — never a default. Six of the
// fifteen indicators have no data source wired at all; reporting an invented
// figure for them would put un-evidenced "strengths" in front of an inspector.
// ══════════════════════════════════════════════════════════════════════════════

import { intelligenceDb } from "@/lib/intelligence/store";
import { below, meets, rate, weightedMeanOf } from "@/lib/metrics/rate";
import type { RiScoreCard } from "@/types/extended";

/**
 * The scorecard as it is actually computable today: an indicator with nothing
 * behind it reports null rather than a fabricated number, and the risk level
 * says so instead of defaulting to "low".
 */
export type RiScoreCardComputed = Omit<
  RiScoreCard,
  | "safeguarding_oversight_score"
  | "incident_management_score"
  | "missing_episodes_score"
  | "reg45_compliance_score"
  | "staff_supervision_score"
  | "training_compliance_score"
  | "medication_governance_score"
  | "care_planning_score"
  | "child_voice_score"
  | "complaint_management_score"
  | "building_safety_score"
  | "recruitment_compliance_score"
  | "oversight_quality_score"
  | "outcome_evidence_score"
  | "challenge_log_score"
  | "overall_governance_score"
  | "risk_level"
> & {
  safeguarding_oversight_score: number | null;
  incident_management_score: number | null;
  missing_episodes_score: number | null;
  reg45_compliance_score: number | null;
  staff_supervision_score: number | null;
  training_compliance_score: number | null;
  medication_governance_score: number | null;
  care_planning_score: number | null;
  child_voice_score: number | null;
  complaint_management_score: number | null;
  building_safety_score: number | null;
  recruitment_compliance_score: number | null;
  oversight_quality_score: number | null;
  outcome_evidence_score: number | null;
  challenge_log_score: number | null;
  overall_governance_score: number | null;
  risk_level: "critical" | "high" | "medium" | "low" | "unmeasured";
  /** Indicators with no evidence behind them, so nothing could be scored. */
  unmeasured: string[];
};

// Clamp helper
function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

/**
 * Compute a full RI scorecard from store data for a given home.
 * All scores are 0–100 where 100 = exemplary governance, or null when the
 * indicator has no evidence behind it.
 */
export function computeRiScoreCard(homeId: string): RiScoreCardComputed {
  const now = new Date().toISOString();

  // ── Pull data from store ─────────────────────────────────────────────────────

  const flags = intelligenceDb.caraSafeguardingFlags.findAll(homeId);
  const assessments = intelligenceDb.caraAssessments.findAll(homeId);
  const oversight = intelligenceDb.caraOversight.findAll(homeId);
  const recommendations = intelligenceDb.caraRecommendations.findAll(homeId);
  const riChallenges = intelligenceDb.riChallengeLogs.findAll(homeId);
  const reg45 = intelligenceDb.riReg45Evidence.findAll(homeId);
  const trainingNeeds = intelligenceDb.trainingNeeds.findAll(homeId);
  const knowledgeGaps = intelligenceDb.knowledgeGaps.findAll(homeId);

  // ── 1. Safeguarding Oversight ─────────────────────────────────────────────────
  // High score = flags reviewed promptly, no critical open
  const openCriticalFlags = flags.filter((f) => f.status === "open" && f.severity === "critical").length;
  const openHighFlags = flags.filter((f) => f.status === "open" && f.severity === "high").length;
  const safeguarding_oversight_score = flags.length > 0
    ? clamp(100 - (openCriticalFlags * 20) - (openHighFlags * 5))
    : null; // no flag has ever been raised — nothing recorded, not a clean record

  // ── 2. Incident Management ────────────────────────────────────────────────────
  // High score = high proportion of assessments created, oversight recorded
  const hasOversight = oversight.filter((o) => o.approval_status !== "archived").length;
  const incident_management_score = rate(hasOversight, assessments.length);

  // ── 3. Missing Episodes ───────────────────────────────────────────────────────
  // No missing-episode source is wired into this scorecard yet.
  const missing_episodes_score = null;

  // ── 4. Reg 45 Compliance ──────────────────────────────────────────────────────
  // Score based on whether a Reg 45 record exists and its status. An absent
  // report is a real finding (the register is the evidence), not an unknown.
  const latestReg45 = reg45[0];
  let reg45_compliance_score = 50;
  if (!latestReg45) reg45_compliance_score = 40;
  else if (latestReg45.status === "submitted") reg45_compliance_score = 100;
  else if (latestReg45.status === "approved") reg45_compliance_score = 85;
  else if (latestReg45.status === "reviewed") reg45_compliance_score = 70;
  else if (latestReg45.status === "in_progress") reg45_compliance_score = 55;

  // ── 5. Staff Supervision ──────────────────────────────────────────────────────
  // No supervision source is wired into this scorecard yet.
  const staff_supervision_score = null;

  // ── 6. Training Compliance ────────────────────────────────────────────────────
  const urgentUnaddressedNeeds = trainingNeeds.filter(
    (n) => n.priority === "urgent" && !["completed", "no_action"].includes(n.status)
  ).length;
  const criticalGaps = knowledgeGaps.filter((g) => g.severity === "critical" && g.status === "open").length;
  const training_compliance_score = trainingNeeds.length > 0 || knowledgeGaps.length > 0
    ? clamp(100 - (urgentUnaddressedNeeds * 15) - (criticalGaps * 10))
    : null; // no training need or knowledge gap has been logged at all

  // ── 7. Medication Governance ──────────────────────────────────────────────────
  // No medication source is wired into this scorecard yet.
  const medication_governance_score = null;

  // ── 8. Care Planning ──────────────────────────────────────────────────────────
  // Proxy: pending recommendations about care plan updates
  const carePlanRecs = recommendations.filter(
    (r) => r.recommendation_type === "placement_plan_update" && r.status === "pending"
  ).length;
  const care_planning_score = recommendations.length > 0
    ? clamp(100 - (carePlanRecs * 12))
    : null;

  // ── 9. Child Voice ────────────────────────────────────────────────────────────
  // Proxy: whether voice summaries exist in assessments
  const voiceAssessments = assessments.filter(
    (a) => a.assessment_type === "situation_review" && a.confidence_level !== "insufficient_information"
  ).length;
  const child_voice_score = assessments.length === 0
    ? null // no assessment recorded — nothing to read the child's voice from
    : clamp(voiceAssessments > 0 ? Math.min(90, 60 + voiceAssessments * 5) : 50);

  // ── 10. Complaint Management ──────────────────────────────────────────────────
  // No complaints source is wired into this scorecard yet.
  const complaint_management_score = null;

  // ── 11. Building Safety ───────────────────────────────────────────────────────
  // No premises/safety source is wired into this scorecard yet.
  const building_safety_score = null;

  // ── 12. Recruitment Compliance ────────────────────────────────────────────────
  // No recruitment source is wired into this scorecard yet.
  const recruitment_compliance_score = null;

  // ── 13. Oversight Quality ─────────────────────────────────────────────────────
  // Ratio of approved vs draft oversight
  const approvedOversight = oversight.filter((o) => o.approval_status === "approved").length;
  const oversight_quality_score = rate(approvedOversight, oversight.length);

  // ── 14. Outcome Evidence ──────────────────────────────────────────────────────
  // No child-experience snapshot source is wired into this scorecard yet.
  const outcome_evidence_score = null;

  // ── 15. Challenge Log ─────────────────────────────────────────────────────────
  // Good score = challenges exist and are being responded to. An empty log is a
  // real finding — it is evidence the RI is not challenging.
  const openChallenges = riChallenges.filter((c) => c.status === "open").length;
  const resolvedChallenges = riChallenges.filter((c) => c.status === "resolved").length;
  let challenge_log_score = 65; // baseline — shows RI is engaged
  if (riChallenges.length === 0) challenge_log_score = 40; // no evidence of challenge
  else if (openChallenges === 0 && resolvedChallenges > 0) challenge_log_score = 95;
  else if (openChallenges > 3) challenge_log_score = clamp(65 - (openChallenges * 5));

  // ── Overall ───────────────────────────────────────────────────────────────────
  // Safeguarding and incident management carry 2x weight; unmeasured indicators
  // are dropped from both the numerator and the weight total, never counted.
  const scored = [
    { label: "Safeguarding Oversight", score: safeguarding_oversight_score, weight: 2 },
    { label: "Incident Management", score: incident_management_score, weight: 2 },
    { label: "Missing Episodes", score: missing_episodes_score, weight: 1 },
    { label: "Reg 45 Compliance", score: reg45_compliance_score, weight: 1 },
    { label: "Staff Supervision", score: staff_supervision_score, weight: 1 },
    { label: "Training Compliance", score: training_compliance_score, weight: 1 },
    { label: "Medication Governance", score: medication_governance_score, weight: 1 },
    { label: "Care Planning", score: care_planning_score, weight: 1 },
    { label: "Child Voice", score: child_voice_score, weight: 1 },
    { label: "Complaint Management", score: complaint_management_score, weight: 1 },
    { label: "Building Safety", score: building_safety_score, weight: 1 },
    { label: "Recruitment Compliance", score: recruitment_compliance_score, weight: 1 },
    { label: "Oversight Quality", score: oversight_quality_score, weight: 1 },
    { label: "Outcome Evidence", score: outcome_evidence_score, weight: 1 },
    { label: "Challenge Log", score: challenge_log_score, weight: 1 },
  ];

  const overall_governance_score = weightedMeanOf(scored);

  // Risk level
  let risk_level: RiScoreCardComputed["risk_level"] = "unmeasured";
  if (below(overall_governance_score, 50)) risk_level = "critical";
  else if (below(overall_governance_score, 65)) risk_level = "high";
  else if (below(overall_governance_score, 80)) risk_level = "medium";
  else if (meets(overall_governance_score, 80)) risk_level = "low";

  const unmeasured = scored.filter((s) => s.score === null).map((s) => s.label);

  // Narrative
  const narrative = risk_level === "unmeasured"
    ? `There is not yet enough evidence in the system to form a governance picture for this home. Nothing has been scored, which is itself the finding — the RI should establish the evidence base before drawing any conclusion.`
    : risk_level === "low"
    ? `Chamberlain House demonstrates strong governance across the indicators that could be evidenced. Safeguarding oversight, compliance, and quality of evidence are all operating at a high level. The RI can have reasonable confidence in the current management picture.`
    : risk_level === "medium"
    ? `Chamberlain House shows mostly good governance but has areas requiring active attention. The RI should focus challenge on the lower-scoring indicators and ensure the manager has clear action plans in place.`
    : risk_level === "high"
    ? `Significant governance concerns are present. The RI should increase oversight frequency, consider formal challenges, and ensure Ofsted notification thresholds are reviewed.`
    : `Critical governance concerns detected. The RI must act immediately — consider formal escalation, increased provider oversight, and Ofsted notification if statutory thresholds are met.`;

  // Derive strengths and concerns from measured indicators only — an indicator
  // with no evidence behind it can be neither a strength nor a concern.
  const ranked = scored
    .filter((s): s is { label: string; score: number; weight: number } => s.score !== null)
    .sort((a, b) => b.score - a.score);

  const strengths = ranked.filter((s) => meets(s.score, 80)).slice(0, 3).map((s) => s.label);
  const concerns = ranked.filter((s) => below(s.score, 65)).map((s) => s.label);

  const immediate_actions: string[] = [];
  if (openCriticalFlags > 0) immediate_actions.push(`Review ${openCriticalFlags} critical safeguarding flag(s)`);
  if (urgentUnaddressedNeeds > 0) immediate_actions.push(`Address ${urgentUnaddressedNeeds} urgent training need(s)`);
  if (!latestReg45 || latestReg45.status === "draft") immediate_actions.push("Progress Reg 45 report to completion");
  if (openChallenges > 0) immediate_actions.push(`Chase response to ${openChallenges} open challenge(s)`);
  if (unmeasured.length > 0) {
    immediate_actions.push(`Establish an evidence base for ${unmeasured.length} unmeasured indicator(s): ${unmeasured.join(", ")}`);
  }

  return {
    home_id: homeId,
    computed_at: now,
    safeguarding_oversight_score,
    incident_management_score,
    missing_episodes_score,
    reg45_compliance_score,
    staff_supervision_score,
    training_compliance_score,
    medication_governance_score,
    care_planning_score,
    child_voice_score,
    complaint_management_score,
    building_safety_score,
    recruitment_compliance_score,
    oversight_quality_score,
    outcome_evidence_score,
    challenge_log_score,
    overall_governance_score,
    risk_level,
    narrative,
    strengths,
    concerns,
    immediate_actions,
    unmeasured,
  };
}
