// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME SAFER RECRUITMENT INTELLIGENCE ENGINE
// Home-level: analyses vacancy management, candidate pipeline, pre-employment
// checks, reference verification, and DBS compliance to assess recruitment.
// CHR 2015 Reg 32 (Fitness of Workers). SCCIF: "Well-Led."
// ══════════════════════════════════════════════════════════════════════════════

import { above, below, formatRate, meets, rate } from "@/lib/metrics/rate";

// ── Input Types ─────────────────────────────────────────────────────────────

export interface VacancyInput {
  id: string;
  status: string;                    // open | closed | on_hold
}

export interface CandidateInput {
  id: string;
  vacancy_id: string;
  current_stage: string;
  compliance_status: string;         // compliant | in_progress | non_compliant
  risk_level: string;                // low | medium | high
  shortlisted: boolean;
  appointed: boolean;
}

export interface CheckInput {
  candidate_id: string;
  check_type: string;                // enhanced_dbs | right_to_work | identity | references
  status: string;                    // not_started | in_progress | verified | rejected
  required: boolean;
  due_date: string;
  concern_flag: boolean;
  override_used: boolean;
}

export interface ReferenceInput {
  candidate_id: string;
  status: string;                    // requested | received | verified | declined
  is_satisfactory: boolean | null;
  is_safeguarding_reference: boolean;
  gap_in_employment: boolean;
}

export interface HomeSaferRecruitmentInput {
  today: string;
  vacancies: VacancyInput[];
  candidates: CandidateInput[];
  checks: CheckInput[];
  references: ReferenceInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type RecruitmentRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface VacancyProfile {
  total_vacancies: number;
  open_count: number;
  total_candidates: number;
  shortlisted_count: number;
  appointed_count: number;
}

export interface ChecksProfile {
  total_checks: number;
  verified_count: number;
  in_progress_count: number;
  not_started_count: number;
  overdue_count: number;
  /** null when the population is empty — nothing measured, not 0%. */
  verification_rate: number | null;
  concern_count: number;
  override_count: number;
  /** null when the population is empty — nothing measured, not 0%. */
  dbs_verified_rate: number | null;
}

export interface ReferenceProfile {
  total_references: number;
  verified_count: number;
  satisfactory_count: number;
  safeguarding_ref_count: number;
  gap_flag_count: number;
  /** null when the population is empty — nothing measured, not 0%. */
  verification_rate: number | null;
}

export interface ComplianceProfile {
  compliant_candidates: number;
  in_progress_candidates: number;
  non_compliant_candidates: number;
  /** null when the population is empty — nothing measured, not 0%. */
  compliance_rate: number | null;
  high_risk_count: number;
}

export interface RecruitmentInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface RecruitmentRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface HomeSaferRecruitmentResult {
  recruitment_rating: RecruitmentRating;
  recruitment_score: number;
  headline: string;
  vacancy_profile: VacancyProfile;
  checks_profile: ChecksProfile;
  reference_profile: ReferenceProfile;
  compliance_profile: ComplianceProfile;
  strengths: string[];
  concerns: string[];
  recommendations: RecruitmentRecommendation[];
  insights: RecruitmentInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): RecruitmentRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeHomeSaferRecruitment(
  input: HomeSaferRecruitmentInput,
): HomeSaferRecruitmentResult {
  const { today, vacancies, candidates, checks, references } = input;

  // Insufficient data: no vacancies AND no candidates
  if (vacancies.length === 0 && candidates.length === 0) {
    return {
      recruitment_rating: "insufficient_data",
      recruitment_score: 0,
      headline: "No recruitment data found — vacancy and candidate records not available.",
      vacancy_profile: emptyVacancyProfile(),
      checks_profile: emptyChecksProfile(),
      reference_profile: emptyReferenceProfile(),
      compliance_profile: emptyComplianceProfile(),
      strengths: [],
      concerns: ["No recruitment records — Ofsted expects evidence of a robust safer recruitment process."],
      recommendations: [{ rank: 1, recommendation: "Establish a safer recruitment system with tracked vacancies, pre-employment checks, and reference verification.", urgency: "immediate", regulatory_ref: "Reg 32" }],
      insights: [{ text: "No recruitment data found. Without evidence of safer recruitment processes, the home cannot demonstrate that all staff have been safely recruited with appropriate pre-employment checks. Ofsted will treat this as a serious leadership gap.", severity: "critical" }],
    };
  }

  // ── Vacancy Profile ───────────────────────────────────────────────
  const openVacancies = vacancies.filter(v => v.status === "open");
  const shortlisted = candidates.filter(c => c.shortlisted);
  const appointed = candidates.filter(c => c.appointed);

  const vacancyProfile: VacancyProfile = {
    total_vacancies: vacancies.length,
    open_count: openVacancies.length,
    total_candidates: candidates.length,
    shortlisted_count: shortlisted.length,
    appointed_count: appointed.length,
  };

  // ── Checks Profile ────────────────────────────────────────────────
  const requiredChecks = checks.filter(c => c.required);
  const verifiedChecks = requiredChecks.filter(c => c.status === "verified");
  const inProgressChecks = requiredChecks.filter(c => c.status === "in_progress");
  const notStartedChecks = requiredChecks.filter(c => c.status === "not_started");
  const overdueChecks = requiredChecks.filter(c =>
    c.due_date < today && c.status !== "verified" && c.status !== "rejected"
  );
  const concernChecks = checks.filter(c => c.concern_flag);
  const overrideChecks = checks.filter(c => c.override_used);

  const verificationRate = rate(verifiedChecks.length, requiredChecks.length);

  // DBS-specific verification
  const dbsChecks = requiredChecks.filter(c => c.check_type === "enhanced_dbs");
  const dbsVerified = dbsChecks.filter(c => c.status === "verified");
  const dbsVerifiedRate = rate(dbsVerified.length, dbsChecks.length);

  const checksProfile: ChecksProfile = {
    total_checks: requiredChecks.length,
    verified_count: verifiedChecks.length,
    in_progress_count: inProgressChecks.length,
    not_started_count: notStartedChecks.length,
    overdue_count: overdueChecks.length,
    verification_rate: verificationRate,
    concern_count: concernChecks.length,
    override_count: overrideChecks.length,
    dbs_verified_rate: dbsVerifiedRate,
  };

  // ── Reference Profile ─────────────────────────────────────────────
  const verifiedRefs = references.filter(r => r.status === "verified");
  const satisfactoryRefs = references.filter(r => r.is_satisfactory === true);
  const safeguardingRefs = references.filter(r => r.is_safeguarding_reference);
  const gapFlagged = references.filter(r => r.gap_in_employment);
  const refVerificationRate = rate(verifiedRefs.length, references.length);

  const referenceProfile: ReferenceProfile = {
    total_references: references.length,
    verified_count: verifiedRefs.length,
    satisfactory_count: satisfactoryRefs.length,
    safeguarding_ref_count: safeguardingRefs.length,
    gap_flag_count: gapFlagged.length,
    verification_rate: refVerificationRate,
  };

  // ── Compliance Profile ────────────────────────────────────────────
  const compliantCandidates = candidates.filter(c => c.compliance_status === "compliant");
  const inProgressCompliance = candidates.filter(c => c.compliance_status === "in_progress");
  const nonCompliant = candidates.filter(c => c.compliance_status === "non_compliant");
  const highRisk = candidates.filter(c => c.risk_level === "high");
  const complianceRate = rate(compliantCandidates.length, candidates.length);

  const complianceProfile: ComplianceProfile = {
    compliant_candidates: compliantCandidates.length,
    in_progress_candidates: inProgressCompliance.length,
    non_compliant_candidates: nonCompliant.length,
    compliance_rate: complianceRate,
    high_risk_count: highRisk.length,
  };

  // ── Scoring ───────────────────────────────────────────────────────
  // Base 52, max bonuses = 28, 52+28 = 80
  let score = 52;

  // 1. Check verification rate (±5)
  if (requiredChecks.length > 0) {
    if (meets(verificationRate, 80)) score += 5;
    else if (meets(verificationRate, 50)) score += 2;
    else if (meets(verificationRate, 30)) score -= 1;
    else score -= 4;
  } else {
    score += 1; // No checks needed = no risk
  }

  // 2. Overdue checks (±4)
  if (requiredChecks.length > 0) {
    if (overdueChecks.length === 0) score += 4;
    else if (overdueChecks.length <= 2) score += 1;
    else score -= 3;
  } else {
    score += 1;
  }

  // 3. DBS verification (±3)
  if (dbsChecks.length > 0) {
    if (dbsVerifiedRate === 100) score += 3;
    else if (meets(dbsVerifiedRate, 50)) score += 1;
    else score -= 2;
  }

  // 4. Reference verification (±4)
  if (references.length > 0) {
    if (meets(refVerificationRate, 80)) score += 4;
    else if (meets(refVerificationRate, 50)) score += 1;
    else score -= 2;
  }

  // 5. Compliance rate (±3)
  if (candidates.length > 0) {
    if (meets(complianceRate, 80)) score += 3;
    else if (meets(complianceRate, 50)) score += 1;
    else score -= 2;
  }

  // 6. Concern flags (±3)
  if (requiredChecks.length > 0) {
    if (concernChecks.length === 0) score += 3;
    else if (concernChecks.length === 1) score += 1;
    else score -= 2;
  } else {
    score += 1;
  }

  // 7. Override usage (±3)
  if (requiredChecks.length > 0) {
    if (overrideChecks.length === 0) score += 3;
    else score -= 2;
  } else {
    score += 1;
  }

  // 8. High-risk candidates (±3)
  if (candidates.length > 0) {
    if (highRisk.length === 0) score += 3;
    else if (highRisk.length === 1) score += 1;
    else score -= 2;
  }

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (meets(verificationRate, 80) && requiredChecks.length > 0) strengths.push(`${formatRate(verificationRate)} pre-employment check verification — robust safer recruitment compliance.`);
  if (overdueChecks.length === 0 && requiredChecks.length > 0) strengths.push("No overdue pre-employment checks — all checks progressing within timescales.");
  if (dbsVerifiedRate === 100 && dbsChecks.length > 0) strengths.push("All DBS checks verified — enhanced DBS compliance is complete.");
  if (meets(refVerificationRate, 80) && references.length > 0) strengths.push(`${formatRate(refVerificationRate)} reference verification — thorough reference checking.`);
  if (concernChecks.length === 0 && requiredChecks.length > 0) strengths.push("No concern flags on pre-employment checks — clean recruitment pipeline.");
  if (overrideChecks.length === 0 && requiredChecks.length > 0) strengths.push("No check overrides used — recruitment process followed without shortcuts.");
  if (highRisk.length === 0 && candidates.length > 0) strengths.push("No high-risk candidates — recruitment pipeline presents low safeguarding risk.");

  // ── Concerns ──────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (overdueChecks.length > 0) concerns.push(`${overdueChecks.length} pre-employment check${overdueChecks.length > 1 ? "s" : ""} overdue — checks not completed within required timescales.`);
  if (notStartedChecks.length > 0) concerns.push(`${notStartedChecks.length} required check${notStartedChecks.length > 1 ? "s" : ""} not yet started — delays in initiating safer recruitment process.`);
  if (concernChecks.length > 0) concerns.push(`${concernChecks.length} check${concernChecks.length > 1 ? "s" : ""} flagged with concerns — requires investigation before appointment.`);
  if (overrideChecks.length > 0) concerns.push(`${overrideChecks.length} check override${overrideChecks.length > 1 ? "s" : ""} used — deviations from standard process require robust justification.`);
  if (highRisk.length > 0) concerns.push(`${highRisk.length} high-risk candidate${highRisk.length > 1 ? "s" : ""} in pipeline — enhanced scrutiny required.`);
  if (nonCompliant.length > 0) concerns.push(`${nonCompliant.length} candidate${nonCompliant.length > 1 ? "s" : ""} non-compliant — must not start until all required checks are verified.`);
  if (below(verificationRate, 50) && requiredChecks.length > 0) concerns.push(`Only ${formatRate(verificationRate)} of required checks verified — significant recruitment compliance gap.`);

  // ── Recommendations ───────────────────────────────────────────────
  const recs: RecruitmentRecommendation[] = [];
  let rank = 1;

  if (overdueChecks.length > 0) {
    recs.push({ rank: rank++, recommendation: `Complete ${overdueChecks.length} overdue pre-employment check${overdueChecks.length > 1 ? "s" : ""} immediately — no candidate should start work with outstanding checks.`, urgency: "immediate", regulatory_ref: "Reg 32" });
  }
  if (concernChecks.length > 0) {
    recs.push({ rank: rank++, recommendation: `Investigate ${concernChecks.length} flagged concern${concernChecks.length > 1 ? "s" : ""} — risk-assess before any appointment decision.`, urgency: "immediate", regulatory_ref: "Reg 32" });
  }
  if (notStartedChecks.length > 3) {
    recs.push({ rank: rank++, recommendation: `Initiate ${notStartedChecks.length} outstanding checks — establish a weekly recruitment progress review.`, urgency: "soon", regulatory_ref: "Reg 32" });
  }
  if (overrideChecks.length > 0) {
    recs.push({ rank: rank++, recommendation: `Review ${overrideChecks.length} check override${overrideChecks.length > 1 ? "s" : ""} — ensure documented risk assessment and RM authorisation for each.`, urgency: "soon", regulatory_ref: "Reg 32" });
  }
  if (gapFlagged.length > 0) {
    recs.push({ rank: rank++, recommendation: `Follow up on ${gapFlagged.length} employment gap${gapFlagged.length > 1 ? "s" : ""} flagged in references — document explanations.`, urgency: "planned", regulatory_ref: "Reg 32" });
  }

  // ── Insights ──────────────────────────────────────────────────────
  const insights: RecruitmentInsight[] = [];

  if (meets(verificationRate, 80) && overdueChecks.length === 0 && concernChecks.length === 0) {
    insights.push({ text: `Safer recruitment practice is exemplary — ${formatRate(verificationRate)} verification, no overdue checks, and no concerns flagged. Ofsted will see a home that takes workforce safety seriously, with a systematic approach to ensuring every person working with children has been thoroughly vetted.`, severity: "positive" });
  }
  if (overdueChecks.length > 0) {
    insights.push({ text: `${overdueChecks.length} pre-employment check${overdueChecks.length > 1 ? "s are" : " is"} overdue. Under Regulation 32, no person may work at the home until all required checks are satisfactorily completed. Ofsted will treat overdue checks as a serious leadership failure.`, severity: "critical" });
  }
  if (overrideChecks.length > 0) {
    insights.push({ text: `${overrideChecks.length} check override${overrideChecks.length > 1 ? "s" : ""} used. While risk-assessed overrides can be justified in exceptional circumstances, Ofsted will scrutinise each one. Ensure documented RM authorisation and risk assessment for every override.`, severity: "warning" });
  }
  if (highRisk.length > 0) {
    insights.push({ text: `${highRisk.length} candidate${highRisk.length > 1 ? "s" : ""} flagged as high-risk. High-risk candidates require enhanced scrutiny — additional references, face-to-face verification meetings, and senior management sign-off before any conditional offer.`, severity: "warning" });
  }
  if (concernChecks.length > 0) {
    insights.push({ text: `${concernChecks.length} pre-employment check${concernChecks.length > 1 ? "s" : ""} flagged with concerns. These must be fully investigated and resolved before any appointment. Ofsted will check that concerning information was properly handled, risk-assessed, and documented.`, severity: "critical" });
  }

  // ── Headline ──────────────────────────────────────────────────────
  let headline: string;
  if (rating === "outstanding") {
    headline = `Outstanding safer recruitment — ${formatRate(verificationRate)} check verification, no overdue checks, ${candidates.length} candidates tracked.`;
  } else if (rating === "good") {
    headline = `Good recruitment compliance — most checks verified with minor gaps in the pipeline.`;
  } else if (rating === "adequate") {
    headline = "Adequate recruitment practice — overdue checks or compliance gaps need addressing.";
  } else {
    headline = "Recruitment compliance is inadequate — overdue checks, concerns, or gaps risk children's safety.";
  }

  return {
    recruitment_rating: rating,
    recruitment_score: score,
    headline,
    vacancy_profile: vacancyProfile,
    checks_profile: checksProfile,
    reference_profile: referenceProfile,
    compliance_profile: complianceProfile,
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}

// ── Empty Profiles ──────────────────────────────────────────────────────────

function emptyVacancyProfile(): VacancyProfile {
  return { total_vacancies: 0, open_count: 0, total_candidates: 0, shortlisted_count: 0, appointed_count: 0 };
}

function emptyChecksProfile(): ChecksProfile {
  return { total_checks: 0, verified_count: 0, in_progress_count: 0, not_started_count: 0, overdue_count: 0, verification_rate: 0, concern_count: 0, override_count: 0, dbs_verified_rate: 0 };
}

function emptyReferenceProfile(): ReferenceProfile {
  return { total_references: 0, verified_count: 0, satisfactory_count: 0, safeguarding_ref_count: 0, gap_flag_count: 0, verification_rate: 0 };
}

function emptyComplianceProfile(): ComplianceProfile {
  return { compliant_candidates: 0, in_progress_candidates: 0, non_compliant_candidates: 0, compliance_rate: 0, high_risk_count: 0 };
}
