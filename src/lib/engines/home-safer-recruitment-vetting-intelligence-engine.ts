// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME SAFER RECRUITMENT VETTING INTELLIGENCE ENGINE
// Home-level: assesses quality and compliance of safer recruitment practices —
// DBS clearance, reference verification, employment history gaps, interview
// panel composition, and recruitment audit trails.
// CHR 2015 Reg 32 (Fitness of Workers) / Schedule 2 (Information about
// Registered Provider). SCCIF: "Well-Led."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface RecruitmentRecordInput {
  id: string;
  candidate_name: string;
  status: string; // "applying" | "interviewing" | "references" | "dbs_pending" | "pre_employment_checks" | "cleared" | "rejected"
  checklist_complete_rate: number; // 0-100, percentage of checklist items completed
  references_received: number;
  references_required: number; // typically 2
  dbs_result: string; // "clear" | "disclosure_reviewed" | "pending"
  has_red_flags: boolean;
  interview_panel_size: number;
  panel_safer_recruitment_trained: boolean; // at least one member trained
}

export interface EmploymentHistoryInput {
  id: string;
  candidate_id: string;
  verified: boolean;
}

export interface GapExplanationInput {
  id: string;
  candidate_id: string;
  explained: boolean; // gap has been satisfactorily explained
}

export interface InterviewInput {
  id: string;
  candidate_id: string;
  completed: boolean;
  panel_size: number;
  safer_recruitment_trained_on_panel: boolean;
  recommendation: string; // "appoint" | "not_appoint" | "reserve" | "pending"
}

export interface SaferRecruitmentInput {
  today: string;
  total_staff: number;
  recruitment_records: RecruitmentRecordInput[];
  employment_histories: EmploymentHistoryInput[];
  gap_explanations: GapExplanationInput[];
  interviews: InterviewInput[];
}

import { below, formatRate, meanOf, meets, rateOf } from "@/lib/metrics/rate";

// ── Output Types ────────────────────────────────────────────────────────────

export type SaferRecruitmentRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface SaferRecruitmentResult {
  recruitment_rating: SaferRecruitmentRating;
  recruitment_score: number;
  headline: string;
  total_candidates: number;
  // Each is null when nothing of that kind has been recorded
  dbs_clearance_rate: number | null;
  reference_completion_rate: number | null;
  history_verification_rate: number | null;
  interview_compliance_rate: number | null;
  gap_explanation_rate: number | null;
  strengths: string[];
  concerns: string[];
  recommendations: {
    rank: number;
    recommendation: string;
    urgency: string;
    regulatory_ref: string | null;
  }[];
  insights: { text: string; severity: string }[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): SaferRecruitmentRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeSaferRecruitmentVetting(
  input: SaferRecruitmentInput,
): SaferRecruitmentResult {
  const {
    total_staff,
    recruitment_records,
    employment_histories,
    gap_explanations,
    interviews,
  } = input;

  // ── Insufficient data: no staff ──────────────────────────────────
  if (total_staff === 0) {
    return {
      recruitment_rating: "insufficient_data",
      recruitment_score: 0,
      headline:
        "No staff recorded — safer recruitment vetting cannot be assessed.",
      total_candidates: 0,
      dbs_clearance_rate: null,
      reference_completion_rate: null,
      history_verification_rate: null,
      interview_compliance_rate: null,
      gap_explanation_rate: null,
      strengths: [],
      concerns: [
        "No staff recorded — Ofsted expects evidence that every person working with children has been safely recruited.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Record all staff and ensure each has a complete safer recruitment file with DBS, references, employment history, and interview records.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 32",
        },
      ],
      insights: [
        {
          text: "No staff data found. Without evidence of safer recruitment vetting, the home cannot demonstrate compliance with Regulation 32 (fitness of workers). Ofsted will treat this as a critical leadership failure.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Metric Calculations ──────────────────────────────────────────

  // Mod 1: DBS clearance rate — candidates with clear or disclosure_reviewed
  // over candidates who are cleared or still dbs_pending
  const dbsRelevant = recruitment_records.filter(
    (r) =>
      r.dbs_result === "clear" ||
      r.dbs_result === "disclosure_reviewed" ||
      r.dbs_result === "pending",
  );
  const dbsCleared = dbsRelevant.filter(
    (r) =>
      r.dbs_result === "clear" || r.dbs_result === "disclosure_reviewed",
  );
  const dbsClearanceRate = rateOf(dbsCleared, dbsRelevant);

  // Mod 2: Reference completion — candidates with refs received >= required
  const refsComplete = recruitment_records.filter(
    (r) => r.references_received >= r.references_required,
  );
  const referenceCompletionRate = rateOf(refsComplete, recruitment_records);

  // Mod 3: Employment history verification
  const verifiedHistories = employment_histories.filter((h) => h.verified);
  const historyVerificationRate = rateOf(verifiedHistories, employment_histories);

  // Mod 4: Interview compliance — panel >= 2 AND safer recruitment trained
  const compliantInterviews = interviews.filter(
    (i) => i.panel_size >= 2 && i.safer_recruitment_trained_on_panel,
  );
  const interviewComplianceRate = rateOf(compliantInterviews, interviews);

  // Mod 5: Gap explanation rate
  const explainedGaps = gap_explanations.filter((g) => g.explained);
  const gapExplanationRate = rateOf(explainedGaps, gap_explanations);

  // Mod 6: Checklist completion — average checklist_complete_rate
  const avgChecklist = meanOf(
    recruitment_records.map((r) => r.checklist_complete_rate),
  );

  // ── Scoring ──────────────────────────────────────────────────────
  let score = 52;

  // Mod 1: DBS clearance rate
  if (dbsClearanceRate !== null) {
    if (meets(dbsClearanceRate, 95)) score += 6;
    else if (meets(dbsClearanceRate, 80)) score += 3;
    else if (meets(dbsClearanceRate, 60)) score += 0;
    else score -= 6;
  }

  // Mod 2: Reference completion
  if (referenceCompletionRate !== null) {
    if (meets(referenceCompletionRate, 90)) score += 5;
    else if (meets(referenceCompletionRate, 70)) score += 2;
    else if (meets(referenceCompletionRate, 50)) score += 0;
    else score -= 5;
  }

  // Mod 3: History verification
  if (employment_histories.length > 0) {
    if (meets(historyVerificationRate, 90)) score += 5;
    else if (meets(historyVerificationRate, 70)) score += 2;
    else if (meets(historyVerificationRate, 50)) score += 0;
    else score -= 5;
  } else {
    // No histories to verify — treat as neutral but flag concern
    score += 0;
  }

  // Mod 4: Interview compliance
  if (interviews.length > 0) {
    if (meets(interviewComplianceRate, 90)) score += 5;
    else if (meets(interviewComplianceRate, 70)) score += 2;
    else if (meets(interviewComplianceRate, 50)) score += 0;
    else score -= 5;
  } else {
    score += 0;
  }

  // Mod 5: Gap explanation rate. No gap records against real candidates means
  // no gaps to explain; no candidates at all means nothing has been checked.
  if (gap_explanations.length === 0) {
    if (recruitment_records.length > 0) score += 4;
  } else {
    if (meets(gapExplanationRate, 95)) score += 4;
    else if (meets(gapExplanationRate, 80)) score += 1;
    else if (meets(gapExplanationRate, 60)) score += 0;
    else score -= 4;
  }

  // Mod 6: Checklist completion
  if (recruitment_records.length > 0) {
    if (meets(avgChecklist, 95)) score += 5;
    else if (meets(avgChecklist, 80)) score += 2;
    else if (meets(avgChecklist, 60)) score += 0;
    else score -= 5;
  } else {
    score += 0;
  }

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Strengths ────────────────────────────────────────────────────
  const strengths: string[] = [];

  if (meets(dbsClearanceRate, 95)) {
    strengths.push(
      `${formatRate(dbsClearanceRate)} DBS clearance rate — robust pre-employment vetting ensures children are protected.`,
    );
  }
  if (meets(referenceCompletionRate, 90)) {
    strengths.push(
      `${formatRate(referenceCompletionRate)} reference completion — thorough reference checking for all candidates.`,
    );
  }
  if (meets(historyVerificationRate, 90)) {
    strengths.push(
      `${formatRate(historyVerificationRate)} employment history verification — full account of each candidate's work history.`,
    );
  }
  if (meets(interviewComplianceRate, 90)) {
    strengths.push(
      `${formatRate(interviewComplianceRate)} interview compliance — panels meet safer recruitment standards with trained members.`,
    );
  }
  if (gap_explanations.length === 0 && recruitment_records.length > 0) {
    strengths.push(
      "No employment gaps identified — continuous employment histories for all candidates.",
    );
  } else if (meets(gapExplanationRate, 95)) {
    strengths.push(
      `${formatRate(gapExplanationRate)} of employment gaps satisfactorily explained and documented.`,
    );
  }
  if (meets(avgChecklist, 95)) {
    strengths.push(
      `${formatRate(avgChecklist)} average checklist completion — recruitment files are thorough and audit-ready.`,
    );
  }
  const redFlagCandidates = recruitment_records.filter(
    (r) => r.has_red_flags,
  );
  if (redFlagCandidates.length === 0 && recruitment_records.length > 0) {
    strengths.push(
      "No red flags across any candidate — clean recruitment pipeline.",
    );
  }

  // ── Concerns ─────────────────────────────────────────────────────
  const concerns: string[] = [];

  const pendingDbs = recruitment_records.filter(
    (r) => r.dbs_result === "pending",
  );
  if (pendingDbs.length > 0) {
    concerns.push(
      `${pendingDbs.length} candidate${pendingDbs.length > 1 ? "s" : ""} with DBS check still pending — no candidate should start work until DBS is resolved.`,
    );
  }

  const incompleteRefs = recruitment_records.filter(
    (r) => r.references_received < r.references_required,
  );
  if (incompleteRefs.length > 0) {
    concerns.push(
      `${incompleteRefs.length} candidate${incompleteRefs.length > 1 ? "s" : ""} with incomplete references — all required references must be received and verified.`,
    );
  }

  const unverifiedHistories = employment_histories.filter(
    (h) => !h.verified,
  );
  if (unverifiedHistories.length > 0) {
    concerns.push(
      `${unverifiedHistories.length} employment history entr${unverifiedHistories.length > 1 ? "ies" : "y"} unverified — gaps in background verification.`,
    );
  }

  const unexplainedGaps = gap_explanations.filter((g) => !g.explained);
  if (unexplainedGaps.length > 0) {
    concerns.push(
      `${unexplainedGaps.length} employment gap${unexplainedGaps.length > 1 ? "s" : ""} without satisfactory explanation — all gaps must be explored and documented.`,
    );
  }

  if (redFlagCandidates.length > 0) {
    concerns.push(
      `${redFlagCandidates.length} candidate${redFlagCandidates.length > 1 ? "s" : ""} flagged with red flags — enhanced scrutiny and senior management review required.`,
    );
  }

  const nonCompliantInterviews = interviews.filter(
    (i) => i.panel_size < 2 || !i.safer_recruitment_trained_on_panel,
  );
  if (nonCompliantInterviews.length > 0) {
    concerns.push(
      `${nonCompliantInterviews.length} interview${nonCompliantInterviews.length > 1 ? "s" : ""} did not meet safer recruitment panel standards — panel must have at least 2 members with one trained in safer recruitment.`,
    );
  }

  if (below(avgChecklist, 60)) {
    concerns.push(
      `Average checklist completion is only ${formatRate(avgChecklist)} — recruitment files are incomplete and not audit-ready.`,
    );
  }

  // ── Recommendations ──────────────────────────────────────────────
  const recs: {
    rank: number;
    recommendation: string;
    urgency: string;
    regulatory_ref: string | null;
  }[] = [];
  let rank = 1;

  if (pendingDbs.length > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Resolve ${pendingDbs.length} pending DBS check${pendingDbs.length > 1 ? "s" : ""} immediately — no person may work with children until enhanced DBS clearance is confirmed.`,
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 32",
    });
  }

  if (redFlagCandidates.length > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Investigate ${redFlagCandidates.length} candidate${redFlagCandidates.length > 1 ? "s" : ""} with red flags — conduct enhanced risk assessment before any appointment decision.`,
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 32",
    });
  }

  if (incompleteRefs.length > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Obtain outstanding references for ${incompleteRefs.length} candidate${incompleteRefs.length > 1 ? "s" : ""} — Schedule 2 requires a minimum of two satisfactory references.`,
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Sch 2",
    });
  }

  if (unexplainedGaps.length > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Document explanations for ${unexplainedGaps.length} employment gap${unexplainedGaps.length > 1 ? "s" : ""} — all periods of non-employment must be explored and recorded.`,
      urgency: "soon",
      regulatory_ref: "CHR 2015 Sch 2",
    });
  }

  if (unverifiedHistories.length > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Verify ${unverifiedHistories.length} outstanding employment history entr${unverifiedHistories.length > 1 ? "ies" : "y"} — full employment history must be checked and confirmed.`,
      urgency: "soon",
      regulatory_ref: "CHR 2015 Sch 2",
    });
  }

  if (nonCompliantInterviews.length > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Review interview panel composition — ${nonCompliantInterviews.length} interview${nonCompliantInterviews.length > 1 ? "s" : ""} lacked a compliant panel. Ensure all future panels have at least 2 members with one safer recruitment trained.`,
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 32",
    });
  }

  if (below(avgChecklist, 80)) {
    recs.push({
      rank: rank++,
      recommendation: `Improve recruitment checklist completion (currently ${formatRate(avgChecklist)}) — aim for 95%+ to ensure audit-ready files.`,
      urgency: "planned",
      regulatory_ref: null,
    });
  }

  // ── Insights ─────────────────────────────────────────────────────
  const insights: { text: string; severity: string }[] = [];

  if (
    meets(dbsClearanceRate, 95) &&
    meets(referenceCompletionRate, 90) &&
    meets(historyVerificationRate, 90) &&
    meets(interviewComplianceRate, 90)
  ) {
    insights.push({
      text: `Safer recruitment vetting is exemplary — ${formatRate(dbsClearanceRate)} DBS clearance, ${formatRate(referenceCompletionRate)} references complete, ${formatRate(historyVerificationRate)} histories verified, and ${formatRate(interviewComplianceRate)} interview compliance. Ofsted will see a home that takes workforce safety seriously, with a systematic approach to ensuring every person working with children has been thoroughly vetted under Regulation 32.`,
      severity: "positive",
    });
  }

  if (pendingDbs.length > 0) {
    insights.push({
      text: `${pendingDbs.length} DBS check${pendingDbs.length > 1 ? "s" : ""} pending. Under Regulation 32, no person may work at the home until enhanced DBS clearance is confirmed. Ofsted will treat pending DBS checks as a serious safeguarding concern that puts children at risk.`,
      severity: "critical",
    });
  }

  if (redFlagCandidates.length > 0) {
    insights.push({
      text: `${redFlagCandidates.length} candidate${redFlagCandidates.length > 1 ? "s" : ""} flagged with red flags. These require immediate investigation — additional references, face-to-face verification, and senior management sign-off before any conditional offer. Ofsted will check that concerning information was properly handled and risk-assessed.`,
      severity: "critical",
    });
  }

  if (unexplainedGaps.length > 0) {
    insights.push({
      text: `${unexplainedGaps.length} employment gap${unexplainedGaps.length > 1 ? "s" : ""} without satisfactory explanation. Schedule 2 requires that all gaps in employment history are explored and a reasonable explanation documented. Unexplained gaps are a common finding in Ofsted inspections and may indicate concealment of relevant information.`,
      severity: "warning",
    });
  }

  if (nonCompliantInterviews.length > 0) {
    insights.push({
      text: `${nonCompliantInterviews.length} interview${nonCompliantInterviews.length > 1 ? "s" : ""} did not meet safer recruitment panel standards. Best practice requires at least two panel members with at least one trained in safer recruitment. Non-compliant panels undermine the robustness of appointment decisions.`,
      severity: "warning",
    });
  }

  if (
    employment_histories.length === 0 &&
    recruitment_records.length > 0
  ) {
    insights.push({
      text: "No employment history records found for any candidate. Schedule 2 requires a full employment history, and Ofsted will expect to see verified records for every staff member.",
      severity: "warning",
    });
  }

  if (below(avgChecklist, 60)) {
    insights.push({
      text: `Average checklist completion is only ${formatRate(avgChecklist)}. Recruitment files are incomplete and will not withstand Ofsted scrutiny. A robust checklist ensures no pre-employment step is missed.`,
      severity: "critical",
    });
  }

  // ── Headline ─────────────────────────────────────────────────────
  let headline: string;
  if (rating === "outstanding") {
    headline = `Outstanding safer recruitment vetting — ${formatRate(dbsClearanceRate)} DBS clearance, ${formatRate(referenceCompletionRate)} references complete, ${recruitment_records.length} candidates tracked.`;
  } else if (rating === "good") {
    headline =
      "Good recruitment vetting — most pre-employment checks are in place with minor gaps to address.";
  } else if (rating === "adequate") {
    headline =
      "Adequate recruitment vetting — compliance gaps in DBS, references, or employment history need attention.";
  } else {
    headline =
      "Recruitment vetting is inadequate — significant gaps in pre-employment checks risk children's safety.";
  }

  return {
    recruitment_rating: rating,
    recruitment_score: score,
    headline,
    total_candidates: recruitment_records.length,
    dbs_clearance_rate: dbsClearanceRate,
    reference_completion_rate: referenceCompletionRate,
    history_verification_rate: historyVerificationRate,
    interview_compliance_rate: interviewComplianceRate,
    gap_explanation_rate: gapExplanationRate,
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}
