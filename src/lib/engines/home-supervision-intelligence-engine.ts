// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME SUPERVISION INTELLIGENCE ENGINE
// Home-level: synthesises supervision, practice observation, and appraisal
// data to assess workforce development quality, frequency, and compliance.
// CHR 2015 Reg 33. SCCIF: "Well-led and managed."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface SupervisionInput {
  id: string;
  date: string;                              // YYYY-MM-DD (actual date if completed)
  staff_id: string;
  type: string;                              // formal | informal | group | reflective_practice | probation_review
  status: string;                            // completed | scheduled | cancelled | rescheduled
  duration_minutes: number;
  actions_total: number;
  actions_completed: number;
  wellbeing_score: number | null;            // 1-10 scale
  both_signatures: boolean;
}

export interface ObservationInput {
  id: string;
  date: string;
  staff_id: string;
  outcome: string;                           // outstanding | meets_standard | developing | requires_support
  domains_count: number;
  strengths_count: number;
  development_areas_count: number;
  signed_off: boolean;
}

export interface AppraisalInput {
  id: string;
  date: string;
  staff_id: string;
  status: string;                            // completed | scheduled | in_progress | overdue
  overall_rating: string | null;             // outstanding | good | requires_improvement | inadequate
  avg_competency_score: number;              // 0-5 scale
  signed: boolean;
  next_review_date: string | null;
}

export interface HomeSupervisionInput {
  today: string;
  staff_ids: string[];
  total_staff: number;
  supervisions: SupervisionInput[];
  observations: ObservationInput[];
  appraisals: AppraisalInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type SupervisionRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface SupervisionProfile {
  total_supervisions_90d: number;
  completed_count: number;
  completion_rate: number;
  formal_count: number;
  action_completion_rate: number;
  avg_wellbeing_score: number;
  signature_rate: number;
  staff_with_supervision: string[];
  staff_without_supervision: string[];
}

export interface ObservationProfile {
  total_observations_90d: number;
  outstanding_count: number;
  meets_standard_count: number;
  developing_count: number;
  requires_support_count: number;
  positive_outcome_rate: number;             // % outstanding + meets_standard
  staff_observed: string[];
  staff_not_observed: string[];
  sign_off_rate: number;
}

export interface AppraisalProfile {
  total_appraisals: number;
  completed_count: number;
  overdue_count: number;
  avg_competency_score: number;
  staff_with_appraisal: string[];
  staff_without_appraisal: string[];
}

export interface SupervisionInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface SupervisionRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface HomeSupervisionResult {
  supervision_rating: SupervisionRating;
  supervision_score: number;
  headline: string;
  supervision_profile: SupervisionProfile;
  observation_profile: ObservationProfile;
  appraisal_profile: AppraisalProfile;
  strengths: string[];
  concerns: string[];
  recommendations: SupervisionRecommendation[];
  insights: SupervisionInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): SupervisionRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

function daysBetween(a: string, b: string): number {
  return Math.abs(
    (new Date(a).getTime() - new Date(b).getTime()) / 86_400_000,
  );
}

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeHomeSupervision(
  input: HomeSupervisionInput,
): HomeSupervisionResult {
  const { today, staff_ids, total_staff, supervisions, observations, appraisals } = input;

  // ── 90-day windows ──────────────────────────────────────────────────
  const sups90d = supervisions.filter(s => daysBetween(s.date, today) <= 90);
  const obs90d = observations.filter(o => daysBetween(o.date, today) <= 90);

  // Appraisals: most recent per staff (no window — annual cycle)
  const latestAppraisalByStaff = new Map<string, AppraisalInput>();
  for (const a of appraisals) {
    const existing = latestAppraisalByStaff.get(a.staff_id);
    if (!existing || a.date > existing.date) {
      latestAppraisalByStaff.set(a.staff_id, a);
    }
  }
  const latestAppraisals = [...latestAppraisalByStaff.values()];

  // Insufficient data: nothing to analyse
  if (sups90d.length === 0 && obs90d.length === 0 && latestAppraisals.length === 0) {
    return {
      supervision_rating: "insufficient_data",
      supervision_score: 0,
      headline: "No supervision, observation, or appraisal data available.",
      supervision_profile: emptySupProfile(),
      observation_profile: emptyObsProfile(),
      appraisal_profile: emptyApprProfile(),
      strengths: [],
      concerns: ["No supervision records found — Reg 33 requires regular supervision of all staff."],
      recommendations: [{ rank: 1, recommendation: "Establish a regular supervision schedule for all staff — this is a statutory requirement under Reg 33.", urgency: "immediate", regulatory_ref: "Reg 33" }],
      insights: [{ text: "No supervision or workforce development data exists. Ofsted will view this as a serious leadership failure under 'Well-led and managed.'", severity: "critical" }],
    };
  }

  // ── Supervision Profile ─────────────────────────────────────────────
  const completedSups = sups90d.filter(s => s.status === "completed");
  const completionRate = pct(completedSups.length, sups90d.length);
  const formalCount = completedSups.filter(s => s.type === "formal").length;

  let totalActions = 0;
  let completedActions = 0;
  for (const s of completedSups) {
    totalActions += s.actions_total;
    completedActions += s.actions_completed;
  }
  const actionCompletionRate = pct(completedActions, totalActions);

  const wellbeingScores = completedSups.map(s => s.wellbeing_score).filter((w): w is number => w !== null);
  const avgWellbeing = wellbeingScores.length > 0
    ? Math.round((wellbeingScores.reduce((a, b) => a + b, 0) / wellbeingScores.length) * 10) / 10
    : 0;

  const signedSups = completedSups.filter(s => s.both_signatures).length;
  const signatureRate = pct(signedSups, completedSups.length);

  const staffWithSup = [...new Set(completedSups.map(s => s.staff_id))];
  const staffWithoutSup = staff_ids.filter(id => !staffWithSup.includes(id));
  const supCoverage = total_staff > 0 ? pct(staffWithSup.length, total_staff) : 0;

  const supProfile: SupervisionProfile = {
    total_supervisions_90d: sups90d.length,
    completed_count: completedSups.length,
    completion_rate: completionRate,
    formal_count: formalCount,
    action_completion_rate: actionCompletionRate,
    avg_wellbeing_score: avgWellbeing,
    signature_rate: signatureRate,
    staff_with_supervision: staffWithSup,
    staff_without_supervision: staffWithoutSup,
  };

  // ── Observation Profile ─────────────────────────────────────────────
  const outstandingObs = obs90d.filter(o => o.outcome === "outstanding").length;
  const meetsStdObs = obs90d.filter(o => o.outcome === "meets_standard").length;
  const developingObs = obs90d.filter(o => o.outcome === "developing").length;
  const reqSupportObs = obs90d.filter(o => o.outcome === "requires_support").length;
  const positiveOutcomeRate = pct(outstandingObs + meetsStdObs, obs90d.length);

  const staffObserved = [...new Set(obs90d.map(o => o.staff_id))];
  const staffNotObserved = staff_ids.filter(id => !staffObserved.includes(id));
  const obsCoverage = total_staff > 0 ? pct(staffObserved.length, total_staff) : 0;

  const signedObs = obs90d.filter(o => o.signed_off).length;
  const obsSignOffRate = pct(signedObs, obs90d.length);

  const obsProfile: ObservationProfile = {
    total_observations_90d: obs90d.length,
    outstanding_count: outstandingObs,
    meets_standard_count: meetsStdObs,
    developing_count: developingObs,
    requires_support_count: reqSupportObs,
    positive_outcome_rate: positiveOutcomeRate,
    staff_observed: staffObserved,
    staff_not_observed: staffNotObserved,
    sign_off_rate: obsSignOffRate,
  };

  // ── Appraisal Profile ───────────────────────────────────────────────
  const completedAppraisals = latestAppraisals.filter(a => a.status === "completed");
  const overdueAppraisals = latestAppraisals.filter(a => a.status === "overdue").length;

  const competencyScores = completedAppraisals.map(a => a.avg_competency_score).filter(s => s > 0);
  const avgCompetency = competencyScores.length > 0
    ? Math.round((competencyScores.reduce((a, b) => a + b, 0) / competencyScores.length) * 10) / 10
    : 0;

  const staffWithAppraisal = [...new Set(completedAppraisals.map(a => a.staff_id))];
  const staffWithoutAppraisal = staff_ids.filter(id => !staffWithAppraisal.includes(id));
  const apprCoverage = total_staff > 0 ? pct(staffWithAppraisal.length, total_staff) : 0;

  const apprProfile: AppraisalProfile = {
    total_appraisals: latestAppraisals.length,
    completed_count: completedAppraisals.length,
    overdue_count: overdueAppraisals,
    avg_competency_score: avgCompetency,
    staff_with_appraisal: staffWithAppraisal,
    staff_without_appraisal: staffWithoutAppraisal,
  };

  // ── Scoring ───────────────────────────────────────────────────────────
  let score = 50;

  // Supervision coverage (±6)
  if (supCoverage === 100) score += 6;
  else if (supCoverage >= 80) score += 3;
  else score -= 4;

  // Supervision completion (±4)
  if (completionRate === 100) score += 4;
  else if (completionRate >= 80) score += 2;
  else score -= 3;

  // Action completion (±3)
  if (actionCompletionRate >= 80) score += 3;
  else if (actionCompletionRate >= 60) score += 1;
  else score -= 3;

  // Observation coverage (±4)
  if (obsCoverage >= 60) score += 4;
  else if (obsCoverage >= 40) score += 2;
  else score -= 3;

  // Observation quality (±4)
  if (positiveOutcomeRate >= 80) score += 4;
  else if (positiveOutcomeRate >= 60) score += 2;
  else score -= 3;

  // Observation sign-off (±2)
  if (obs90d.length > 0 && obsSignOffRate === 100) score += 2;
  else if (obs90d.length > 0) score -= 1;

  // Appraisal coverage (±4)
  if (apprCoverage >= 80) score += 4;
  else if (apprCoverage >= 60) score += 2;
  else score -= 3;

  // Overdue appraisals (±3)
  if (overdueAppraisals === 0) score += 2;
  else score -= 3;

  // Competency scores (±3)
  if (avgCompetency >= 3.5) score += 3;
  else if (avgCompetency >= 2.5) score += 1;
  else if (competencyScores.length > 0) score -= 2;

  // Signature quality (±2)
  if (completedSups.length > 0 && signatureRate === 100) score += 2;
  else if (completedSups.length > 0 && signatureRate < 80) score -= 2;

  // Wellbeing monitoring (±2)
  if (wellbeingScores.length > 0 && avgWellbeing >= 7) score += 2;
  else if (wellbeingScores.length > 0 && avgWellbeing < 4) score -= 2;

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (supCoverage === 100) strengths.push("All staff have received supervision in the past 90 days — consistent with Reg 33 requirements.");
  if (completionRate === 100 && sups90d.length > 0) strengths.push("All scheduled supervisions completed — demonstrating strong management oversight.");
  if (actionCompletionRate >= 80 && totalActions > 0) strengths.push(`Supervision action completion rate is ${actionCompletionRate}% — staff are following through on agreed actions.`);
  if (positiveOutcomeRate >= 80 && obs90d.length > 0) strengths.push(`${positiveOutcomeRate}% of practice observations rated as meeting standard or above — workforce competence is strong.`);
  if (avgCompetency >= 3.5 && competencyScores.length > 0) strengths.push(`Average appraisal competency score is ${avgCompetency}/5 — staff are performing at or above expected levels.`);
  if (avgWellbeing >= 7 && wellbeingScores.length > 0) strengths.push(`Average staff wellbeing score is ${avgWellbeing}/10 — the home is monitoring and supporting staff welfare.`);
  if (formalCount >= 3) strengths.push(`${formalCount} formal supervisions conducted — structured professional development is embedded.`);

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (staffWithoutSup.length > 0) concerns.push(`${staffWithoutSup.length} staff member${staffWithoutSup.length > 1 ? "s have" : " has"} not received supervision in 90 days — Reg 33 requires regular supervision.`);
  if (completionRate < 80 && sups90d.length > 0) concerns.push(`Supervision completion rate is only ${completionRate}% — scheduled supervisions must be prioritised.`);
  if (actionCompletionRate < 60 && totalActions > 0) concerns.push(`Supervision action completion rate is ${actionCompletionRate}% — agreed actions are not being followed through.`);
  if (staffNotObserved.length > 0 && total_staff > 0) concerns.push(`${staffNotObserved.length} staff member${staffNotObserved.length > 1 ? "s have" : " has"} not been observed in practice — observation is essential for quality assurance.`);
  if (reqSupportObs > 0) concerns.push(`${reqSupportObs} practice observation${reqSupportObs > 1 ? "s" : ""} rated 'requires support' — targeted development needed.`);
  if (overdueAppraisals > 0) concerns.push(`${overdueAppraisals} appraisal${overdueAppraisals > 1 ? "s are" : " is"} overdue — all staff must have a current appraisal.`);
  if (avgWellbeing > 0 && avgWellbeing < 4) concerns.push(`Average staff wellbeing score is ${avgWellbeing}/10 — this indicates significant workforce stress.`);
  if (signatureRate < 80 && completedSups.length > 0) concerns.push(`Only ${signatureRate}% of supervisions are fully signed — both parties must sign to evidence the session.`);

  // ── Recommendations ───────────────────────────────────────────────────
  const recs: SupervisionRecommendation[] = [];
  let rank = 1;

  if (staffWithoutSup.length > 0) {
    recs.push({ rank: rank++, recommendation: `Schedule supervision for ${staffWithoutSup.length} staff member${staffWithoutSup.length > 1 ? "s" : ""} who have not been supervised in 90 days.`, urgency: "immediate", regulatory_ref: "Reg 33" });
  }
  if (overdueAppraisals > 0) {
    recs.push({ rank: rank++, recommendation: `Complete ${overdueAppraisals} overdue appraisal${overdueAppraisals > 1 ? "s" : ""} — annual appraisals are required for all staff.`, urgency: "immediate", regulatory_ref: "Reg 33" });
  }
  if (reqSupportObs > 0) {
    recs.push({ rank: rank++, recommendation: `Create development plans for staff with 'requires support' observation outcomes.`, urgency: "soon", regulatory_ref: "Reg 33" });
  }
  if (actionCompletionRate < 80 && totalActions > 0) {
    recs.push({ rank: rank++, recommendation: "Improve follow-through on supervision actions — track and review at each subsequent session.", urgency: "soon", regulatory_ref: "Reg 33" });
  }
  if (staffNotObserved.length > 0 && obsCoverage < 60) {
    recs.push({ rank: rank++, recommendation: `Schedule practice observations for unobserved staff to ensure quality assurance coverage.`, urgency: "planned", regulatory_ref: "Reg 33" });
  }

  // ── Insights ──────────────────────────────────────────────────────────
  const insights: SupervisionInsight[] = [];

  if (staffWithoutSup.length > 0) {
    insights.push({ text: `${staffWithoutSup.length} staff without supervision in 90 days. Ofsted expects every staff member to receive regular, recorded supervision under Reg 33.`, severity: "critical" });
  }
  if (overdueAppraisals > 0) {
    insights.push({ text: `${overdueAppraisals} overdue appraisal${overdueAppraisals > 1 ? "s" : ""}. Ofsted will check that appraisals are used to identify training needs and improve practice.`, severity: "critical" });
  }
  if (reqSupportObs > 0) {
    insights.push({ text: `${reqSupportObs} staff member${reqSupportObs > 1 ? "s" : ""} rated 'requires support' in practice observations. Ofsted will want evidence of targeted intervention and follow-up.`, severity: "warning" });
  }
  if (supCoverage === 100 && completionRate === 100 && sups90d.length > 0) {
    insights.push({ text: "All staff supervised with 100% completion. This demonstrates a well-managed supervision framework — a key Ofsted expectation for 'Well-led and managed.'", severity: "positive" });
  }
  if (positiveOutcomeRate >= 80 && obs90d.length > 0) {
    insights.push({ text: `${positiveOutcomeRate}% positive observation outcomes demonstrate strong workforce competence. Ofsted values evidence of staff skill and therapeutic practice.`, severity: "positive" });
  }
  if (avgCompetency >= 3.5 && competencyScores.length > 0) {
    insights.push({ text: `Average competency score of ${avgCompetency}/5 across appraisals shows a highly skilled workforce. This evidences investment in staff development.`, severity: "positive" });
  }

  // ── Headline ──────────────────────────────────────────────────────────
  let headline: string;
  if (rating === "outstanding") {
    headline = `Outstanding workforce development — ${completedSups.length} supervisions, ${obs90d.length} observations, and ${completedAppraisals.length} appraisals demonstrating comprehensive oversight.`;
  } else if (rating === "good") {
    headline = `Good supervision and development practice — ${supCoverage}% staff supervised with ${completionRate}% completion rate.`;
  } else if (rating === "adequate") {
    headline = "Adequate supervision practice — gaps in coverage, completion, or follow-through need addressing.";
  } else {
    headline = "Supervision practice is inadequate — significant gaps in staff oversight and development.";
  }

  return {
    supervision_rating: rating,
    supervision_score: score,
    headline,
    supervision_profile: supProfile,
    observation_profile: obsProfile,
    appraisal_profile: apprProfile,
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}

// ── Empty Profiles ─────────────────────────────────────────────────────────

function emptySupProfile(): SupervisionProfile {
  return {
    total_supervisions_90d: 0, completed_count: 0, completion_rate: 0,
    formal_count: 0, action_completion_rate: 0, avg_wellbeing_score: 0,
    signature_rate: 0, staff_with_supervision: [], staff_without_supervision: [],
  };
}

function emptyObsProfile(): ObservationProfile {
  return {
    total_observations_90d: 0, outstanding_count: 0, meets_standard_count: 0,
    developing_count: 0, requires_support_count: 0, positive_outcome_rate: 0,
    staff_observed: [], staff_not_observed: [], sign_off_rate: 0,
  };
}

function emptyApprProfile(): AppraisalProfile {
  return {
    total_appraisals: 0, completed_count: 0, overdue_count: 0,
    avg_competency_score: 0, staff_with_appraisal: [], staff_without_appraisal: [],
  };
}
