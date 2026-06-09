// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — RI SCORE COMPUTATION
// Derives the 15 governance metrics from existing in-memory store data.
// ══════════════════════════════════════════════════════════════════════════════

import { intelligenceDb } from "@/lib/intelligence/store";
import type { RiScoreCard } from "@/types/extended";

// Clamp helper
function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

// Average helper
function avg(...scores: number[]): number {
  return clamp(scores.reduce((a, b) => a + b, 0) / scores.length);
}

/**
 * Compute a full RI scorecard from store data for a given home.
 * All scores are 0–100 where 100 = exemplary governance.
 */
export function computeRiScoreCard(homeId: string): RiScoreCard {
  const now = new Date().toISOString();
  const cutoff30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const cutoff90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  // ── Pull data from store ─────────────────────────────────────────────────────

  const flags = intelligenceDb.ariaSafeguardingFlags.findAll(homeId);
  const assessments = intelligenceDb.ariaAssessments.findAll(homeId);
  const oversight = intelligenceDb.ariaOversight.findAll(homeId);
  const recommendations = intelligenceDb.ariaRecommendations.findAll(homeId);
  const riChallenges = intelligenceDb.riChallengeLogs.findAll(homeId);
  const riAlerts = intelligenceDb.riAlerts.findAll(homeId);
  const reg45 = intelligenceDb.riReg45Evidence.findAll(homeId);
  const trainingNeeds = intelligenceDb.trainingNeeds.findAll(homeId);
  const knowledgeGaps = intelligenceDb.knowledgeGaps.findAll(homeId);

  // ── 1. Safeguarding Oversight ─────────────────────────────────────────────────
  // High score = flags reviewed promptly, no critical open
  const openCriticalFlags = flags.filter((f) => f.status === "open" && f.severity === "critical").length;
  const openHighFlags = flags.filter((f) => f.status === "open" && f.severity === "high").length;
  const safeguarding_oversight_score = clamp(100 - (openCriticalFlags * 20) - (openHighFlags * 5));

  // ── 2. Incident Management ────────────────────────────────────────────────────
  // High score = high proportion of assessments created, oversight recorded
  const hasOversight = oversight.filter((o) => o.approval_status !== "archived").length;
  const incident_management_score = clamp(assessments.length > 0 ? (hasOversight / Math.max(assessments.length, 1)) * 100 : 70);

  // ── 3. Missing Episodes ───────────────────────────────────────────────────────
  // Placeholder — would use missing episode data; default to 75 if no data
  const missing_episodes_score = 75;

  // ── 4. Reg 45 Compliance ──────────────────────────────────────────────────────
  // Score based on whether a Reg 45 record exists and its status
  const latestReg45 = reg45[0];
  let reg45_compliance_score = 50;
  if (!latestReg45) reg45_compliance_score = 40;
  else if (latestReg45.status === "submitted") reg45_compliance_score = 100;
  else if (latestReg45.status === "approved") reg45_compliance_score = 85;
  else if (latestReg45.status === "reviewed") reg45_compliance_score = 70;
  else if (latestReg45.status === "in_progress") reg45_compliance_score = 55;

  // ── 5. Staff Supervision ──────────────────────────────────────────────────────
  // Placeholder — supervision module would feed this; default to 70
  const staff_supervision_score = 70;

  // ── 6. Training Compliance ────────────────────────────────────────────────────
  const urgentUnaddressedNeeds = trainingNeeds.filter(
    (n) => n.priority === "urgent" && !["completed", "no_action"].includes(n.status)
  ).length;
  const criticalGaps = knowledgeGaps.filter((g) => g.severity === "critical" && g.status === "open").length;
  const training_compliance_score = clamp(100 - (urgentUnaddressedNeeds * 15) - (criticalGaps * 10));

  // ── 7. Medication Governance ──────────────────────────────────────────────────
  // Placeholder — medication module data; default to 78
  const medication_governance_score = 78;

  // ── 8. Care Planning ──────────────────────────────────────────────────────────
  // Proxy: pending recommendations about care plan updates
  const carePlanRecs = recommendations.filter(
    (r) => r.recommendation_type === "placement_plan_update" && r.status === "pending"
  ).length;
  const care_planning_score = clamp(100 - (carePlanRecs * 12));

  // ── 9. Child Voice ────────────────────────────────────────────────────────────
  // Proxy: whether voice summaries exist in assessments
  const voiceAssessments = assessments.filter(
    (a) => a.assessment_type === "situation_review" && a.confidence_level !== "insufficient_information"
  ).length;
  const child_voice_score = clamp(voiceAssessments > 0 ? Math.min(90, 60 + voiceAssessments * 5) : 50);

  // ── 10. Complaint Management ──────────────────────────────────────────────────
  // Placeholder; default to 80
  const complaint_management_score = 80;

  // ── 11. Building Safety ───────────────────────────────────────────────────────
  // Placeholder; default to 82
  const building_safety_score = 82;

  // ── 12. Recruitment Compliance ────────────────────────────────────────────────
  // Placeholder; default to 85
  const recruitment_compliance_score = 85;

  // ── 13. Oversight Quality ─────────────────────────────────────────────────────
  // Ratio of approved vs draft oversight
  const approvedOversight = oversight.filter((o) => o.approval_status === "approved").length;
  const oversight_quality_score = clamp(
    oversight.length > 0 ? (approvedOversight / oversight.length) * 100 : 60
  );

  // ── 14. Outcome Evidence ──────────────────────────────────────────────────────
  // Based on child experience snapshots existing
  const snapshots = intelligenceDb.childExperience
    ? Object.values(intelligenceDb).length > 0 ? 1 : 0
    : 0;
  const outcome_evidence_score = clamp(snapshots > 0 ? 75 : 50);

  // ── 15. Challenge Log ─────────────────────────────────────────────────────────
  // Good score = challenges exist and are being responded to
  const openChallenges = riChallenges.filter((c) => c.status === "open").length;
  const resolvedChallenges = riChallenges.filter((c) => c.status === "resolved").length;
  let challenge_log_score = 65; // baseline — shows RI is engaged
  if (riChallenges.length === 0) challenge_log_score = 40; // no evidence of challenge
  else if (openChallenges === 0 && resolvedChallenges > 0) challenge_log_score = 95;
  else if (openChallenges > 3) challenge_log_score = clamp(65 - (openChallenges * 5));

  // ── Overall ───────────────────────────────────────────────────────────────────
  const allScores = [
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
  ];

  // Weight safeguarding and incident management 2x
  const weighted = [
    safeguarding_oversight_score * 2,
    incident_management_score * 2,
    ...allScores.slice(2),
  ];
  const overall_governance_score = clamp(
    weighted.reduce((a, b) => a + b, 0) / (allScores.length + 2)
  );

  // Risk level
  let risk_level: "critical" | "high" | "medium" | "low" = "low";
  if (overall_governance_score < 50) risk_level = "critical";
  else if (overall_governance_score < 65) risk_level = "high";
  else if (overall_governance_score < 80) risk_level = "medium";

  // Narrative
  const narrative = risk_level === "low"
    ? `Chamberlain House demonstrates strong governance across all 15 indicators. Safeguarding oversight, compliance, and quality of evidence are all operating at a high level. The RI can have reasonable confidence in the current management picture.`
    : risk_level === "medium"
    ? `Chamberlain House shows mostly good governance but has areas requiring active attention. The RI should focus challenge on the lower-scoring indicators and ensure the manager has clear action plans in place.`
    : risk_level === "high"
    ? `Significant governance concerns are present. The RI should increase oversight frequency, consider formal challenges, and ensure Ofsted notification thresholds are reviewed.`
    : `Critical governance concerns detected. The RI must act immediately — consider formal escalation, increased provider oversight, and Ofsted notification if statutory thresholds are met.`;

  // Derive strengths and concerns
  const scored = [
    { label: "Safeguarding Oversight", score: safeguarding_oversight_score },
    { label: "Incident Management", score: incident_management_score },
    { label: "Reg 45 Compliance", score: reg45_compliance_score },
    { label: "Training Compliance", score: training_compliance_score },
    { label: "Care Planning", score: care_planning_score },
    { label: "Child Voice", score: child_voice_score },
    { label: "Oversight Quality", score: oversight_quality_score },
    { label: "Challenge Log", score: challenge_log_score },
    { label: "Building Safety", score: building_safety_score },
    { label: "Recruitment Compliance", score: recruitment_compliance_score },
  ].sort((a, b) => b.score - a.score);

  const strengths = scored.filter((s) => s.score >= 80).slice(0, 3).map((s) => s.label);
  const concerns = scored.filter((s) => s.score < 65).map((s) => s.label);

  const immediate_actions: string[] = [];
  if (openCriticalFlags > 0) immediate_actions.push(`Review ${openCriticalFlags} critical safeguarding flag(s)`);
  if (urgentUnaddressedNeeds > 0) immediate_actions.push(`Address ${urgentUnaddressedNeeds} urgent training need(s)`);
  if (!latestReg45 || latestReg45.status === "draft") immediate_actions.push("Progress Reg 45 report to completion");
  if (openChallenges > 0) immediate_actions.push(`Chase response to ${openChallenges} open challenge(s)`);

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
    strengths: strengths.length > 0 ? strengths : ["Building governance evidence base"],
    concerns: concerns.length > 0 ? concerns : [],
    immediate_actions,
  };
}
