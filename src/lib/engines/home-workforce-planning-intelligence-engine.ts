// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME WORKFORCE PLANNING INTELLIGENCE ENGINE
// Home-level: analyses staff composition, succession readiness, vacancy
// coverage, induction completion, and workforce stability.
// CHR 2015 Reg 33 (Employment of Staff) + Reg 32. SCCIF: "Well-Led."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface StaffInput {
  id: string;
  role: string;
  employment_type: string;       // permanent | fixed_term | agency | bank
  is_active: boolean;
  start_date: string;
  end_date: string | null;
  probation_end_date: string | null;
  dbs_update_service: boolean;
  contracted_hours: number;
}

export interface SuccessionPlanInput {
  id: string;
  role_title: string;
  urgency: string;                // immediate | six_months | twelve_months | twenty_four_months
  review_date: string;
  candidates: SuccessionCandidateInput[];
}

export interface SuccessionCandidateInput {
  staff_id: string;
  readiness_score: number | null;         // 0-100
  ready_now: boolean;
  estimated_ready_date: string | null;
}

export interface VacancyInput {
  id: string;
  status: string;                  // open | closed | on_hold
}

export interface InductionInput {
  id: string;
  staff_id: string;
  overall_status: string;          // completed | in_progress | not_started
  target_completion_date: string;
  probation_passed: boolean;
  total_items: number;
  completed_items: number;
}

export interface HomeWorkforcePlanningInput {
  today: string;
  staff: StaffInput[];
  succession_plans: SuccessionPlanInput[];
  vacancies: VacancyInput[];
  inductions: InductionInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type WorkforcePlanningRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface StaffCompositionProfile {
  total_active: number;
  permanent_count: number;
  fixed_term_count: number;
  agency_count: number;
  bank_count: number;
  permanent_rate: number | null;
  avg_contracted_hours: number | null;
  dbs_update_service_rate: number | null;
  new_staff_count: number;            // started within last 6 months
  long_serving_count: number;         // > 2 years
}

export interface SuccessionProfile {
  total_plans: number;
  roles_covered: number;
  total_candidates: number;
  avg_readiness_score: number | null;
  ready_now_count: number;
  overdue_review_count: number;       // review_date < today
  urgent_plans_count: number;         // immediate | six_months
}

export interface VacancyCoverageProfile {
  total_vacancies: number;
  open_count: number;
  on_hold_count: number;
  closed_count: number;
  vacancy_rate: number | null;               // open / (total_active + open)
}

export interface InductionProfile {
  total_inductions: number;
  completed_count: number;
  in_progress_count: number;
  overdue_count: number;              // in_progress + target_completion_date < today
  completion_rate: number | null;
  probation_passed_rate: number | null;
  avg_item_completion_rate: number | null;
}

export interface WorkforceInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface WorkforceRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface HomeWorkforcePlanningResult {
  workforce_rating: WorkforcePlanningRating;
  workforce_score: number | null;
  headline: string;
  staff_composition: StaffCompositionProfile;
  succession_profile: SuccessionProfile;
  vacancy_coverage: VacancyCoverageProfile;
  induction_profile: InductionProfile;
  strengths: string[];
  concerns: string[];
  recommendations: WorkforceRecommendation[];
  insights: WorkforceInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): WorkforcePlanningRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeHomeWorkforcePlanning(
  input: HomeWorkforcePlanningInput,
): HomeWorkforcePlanningResult {
  const { today, staff, succession_plans, vacancies, inductions } = input;

  const activeStaff = staff.filter(s => s.is_active);

  // Insufficient data: no active staff
  if (activeStaff.length === 0) {
    return {
      workforce_rating: "insufficient_data",
      workforce_score: 0,
      headline: "No active staff data found — workforce planning cannot be assessed.",
      staff_composition: emptyStaffComposition(),
      succession_profile: emptySuccession(),
      vacancy_coverage: emptyVacancy(),
      induction_profile: emptyInduction(),
      strengths: [],
      concerns: ["No active staff records — Ofsted expects evidence of an appropriately staffed home."],
      recommendations: [{ rank: 1, recommendation: "Ensure all staff records are maintained with accurate employment data.", urgency: "immediate", regulatory_ref: "Reg 33" }],
      insights: [{ text: "No active staff records found. A children's home must maintain sufficient staff with the right qualifications and experience. Ofsted will treat an absence of workforce data as a serious leadership gap.", severity: "critical" }],
    };
  }

  // ── Staff Composition ──────────────────────────────────────────────
  const sixMonthsAgo = new Date(today);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const sixMonthsAgoStr = sixMonthsAgo.toISOString().slice(0, 10);

  const twoYearsAgo = new Date(today);
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
  const twoYearsAgoStr = twoYearsAgo.toISOString().slice(0, 10);

  const permanent = activeStaff.filter(s => s.employment_type === "permanent");
  const fixedTerm = activeStaff.filter(s => s.employment_type === "fixed_term");
  const agency = activeStaff.filter(s => s.employment_type === "agency");
  const bank = activeStaff.filter(s => s.employment_type === "bank");
  const newStaff = activeStaff.filter(s => s.start_date >= sixMonthsAgoStr);
  const longServing = activeStaff.filter(s => s.start_date <= twoYearsAgoStr);
  const dbsUpdateCount = activeStaff.filter(s => s.dbs_update_service).length;

  const totalHours = activeStaff.reduce((sum, s) => sum + s.contracted_hours, 0);
  const avgHours = activeStaff.length > 0 ? Math.round(totalHours / activeStaff.length) : null;

  const staffComposition: StaffCompositionProfile = {
    total_active: activeStaff.length,
    permanent_count: permanent.length,
    fixed_term_count: fixedTerm.length,
    agency_count: agency.length,
    bank_count: bank.length,
    permanent_rate: pct(permanent.length, activeStaff.length),
    avg_contracted_hours: avgHours,
    dbs_update_service_rate: pct(dbsUpdateCount, activeStaff.length),
    new_staff_count: newStaff.length,
    long_serving_count: longServing.length,
  };

  // ── Succession Profile ─────────────────────────────────────────────
  const allSuccCandidates = succession_plans.flatMap(p => p.candidates);
  const readyNow = allSuccCandidates.filter(c => c.ready_now);
  const avgReadiness = allSuccCandidates.length > 0
    ? Math.round(allSuccCandidates.reduce((s, c) => s + (c.readiness_score ?? 0), 0) / allSuccCandidates.length)
    : null;
  const overdueReviews = succession_plans.filter(p => p.review_date < today);
  const urgentPlans = succession_plans.filter(p =>
    p.urgency === "immediate" || p.urgency === "six_months"
  );

  const successionProfile: SuccessionProfile = {
    total_plans: succession_plans.length,
    roles_covered: succession_plans.length,
    total_candidates: allSuccCandidates.length,
    avg_readiness_score: avgReadiness,
    ready_now_count: readyNow.length,
    overdue_review_count: overdueReviews.length,
    urgent_plans_count: urgentPlans.length,
  };

  // ── Vacancy Coverage ───────────────────────────────────────────────
  const openVacancies = vacancies.filter(v => v.status === "open");
  const onHold = vacancies.filter(v => v.status === "on_hold");
  const closed = vacancies.filter(v => v.status === "closed");
  const vacancyRate = pct(openVacancies.length, activeStaff.length + openVacancies.length);

  const vacancyCoverage: VacancyCoverageProfile = {
    total_vacancies: vacancies.length,
    open_count: openVacancies.length,
    on_hold_count: onHold.length,
    closed_count: closed.length,
    vacancy_rate: vacancyRate,
  };

  // ── Induction Profile ──────────────────────────────────────────────
  const completedInductions = inductions.filter(i => i.overall_status === "completed");
  const inProgressInductions = inductions.filter(i => i.overall_status === "in_progress");
  const overdueInductions = inProgressInductions.filter(i => i.target_completion_date < today);
  const probationPassed = inductions.filter(i => i.probation_passed);
  const avgItemRate = inductions.length > 0
    ? Math.round(inductions.reduce((s, i) => s + pct(i.completed_items, i.total_items), 0) / inductions.length)
    : null;

  const inductionProfile: InductionProfile = {
    total_inductions: inductions.length,
    completed_count: completedInductions.length,
    in_progress_count: inProgressInductions.length,
    overdue_count: overdueInductions.length,
    completion_rate: pct(completedInductions.length, inductions.length),
    probation_passed_rate: pct(probationPassed.length, inductions.length),
    avg_item_completion_rate: avgItemRate,
  };

  // ── Scoring ───────────────────────────────────────────────────────
  // Base 52, max bonuses = 28, 52+28 = 80
  let score = 52;

  // 1. Permanent staff rate (±5)
  if ((staffComposition.permanent_rate ?? 0) >= 80) score += 5;
  else if ((staffComposition.permanent_rate ?? 0) >= 60) score += 2;
  else if ((staffComposition.permanent_rate ?? 0) >= 40) score -= 1;
  else score -= 4;

  // 2. Succession planning (±4)
  if (succession_plans.length > 0) {
    if ((avgReadiness ?? 0) >= 70 && readyNow.length > 0) score += 4;
    else if ((avgReadiness ?? 0) >= 50) score += 2;
    else if ((avgReadiness ?? 0) >= 30) score += 0;
    else score -= 3;
  } else {
    score -= 2; // No succession planning = risk
  }

  // 3. Vacancy coverage (±3)
  if (vacancyRate === 0) score += 3;
  else if (vacancyRate <= 10) score += 1;
  else if (vacancyRate <= 20) score -= 1;
  else score -= 3;

  // 4. Induction completion (±4)
  if (inductions.length > 0) {
    if ((inductionProfile.completion_rate ?? 0) >= 80 && overdueInductions.length === 0) score += 4;
    else if ((inductionProfile.completion_rate ?? 0) >= 50) score += 1;
    else score -= 2;
  } else {
    score += 1; // No inductions needed
  }

  // 5. DBS update service (±3)
  if ((staffComposition.dbs_update_service_rate ?? 0) >= 80) score += 3;
  else if ((staffComposition.dbs_update_service_rate ?? 0) >= 50) score += 1;
  else score -= 2;

  // 6. Workforce stability (±3) — balance of new vs long-serving
  if (longServing.length > 0 && newStaff.length <= activeStaff.length * 0.4) score += 3;
  else if (longServing.length > 0) score += 1;
  else score -= 2;

  // 7. Agency reliance (±3)
  if (agency.length === 0) score += 3;
  else if (pct(agency.length, activeStaff.length) <= 20) score += 1;
  else score -= 2;

  // 8. Succession review currency (±3)
  if (succession_plans.length > 0) {
    if (overdueReviews.length === 0) score += 3;
    else if (overdueReviews.length === 1) score += 1;
    else score -= 2;
  } else {
    score += 0;
  }

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────
  const strengths: string[] = [];
  if ((staffComposition.permanent_rate ?? 0) >= 80) strengths.push(`${(staffComposition.permanent_rate ?? 0)}% permanent staff rate — a stable, committed workforce.`);
  if (agency.length === 0) strengths.push("No agency staff reliance — all care is delivered by the home's own team.");
  if (succession_plans.length > 0 && (avgReadiness ?? 0) >= 70) strengths.push(`Succession planning in place with ${(avgReadiness ?? 0)}% average readiness — strong leadership continuity.`);
  if (succession_plans.length > 0 && readyNow.length > 0) strengths.push(`${readyNow.length} succession candidate${readyNow.length > 1 ? "s" : ""} ready now — immediate cover available for key roles.`);
  if (vacancyRate === 0) strengths.push("No open vacancies — the home is fully staffed.");
  if ((inductionProfile.completion_rate ?? 0) >= 80 && inductions.length > 0) strengths.push(`${(inductionProfile.completion_rate ?? 0)}% induction completion rate — new staff are properly supported.`);
  if ((staffComposition.dbs_update_service_rate ?? 0) >= 80) strengths.push(`${(staffComposition.dbs_update_service_rate ?? 0)}% DBS update service registration — proactive safeguarding compliance.`);
  if (longServing.length > 0) strengths.push(`${longServing.length} long-serving staff (2+ years) — experienced team providing continuity for children.`);

  // ── Concerns ──────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (agency.length > 0) concerns.push(`${agency.length} agency staff in use — over-reliance on agency workers impacts consistency for children.`);
  if (succession_plans.length === 0) concerns.push("No succession plans in place — the home has no documented leadership continuity plan.");
  if (overdueReviews.length > 0) concerns.push(`${overdueReviews.length} succession plan review${overdueReviews.length > 1 ? "s" : ""} overdue — plans must be kept current.`);
  if (openVacancies.length > 0) concerns.push(`${openVacancies.length} open vacanc${openVacancies.length > 1 ? "ies" : "y"} — unfilled positions may create staffing pressure.`);
  if (overdueInductions.length > 0) concerns.push(`${overdueInductions.length} induction${overdueInductions.length > 1 ? "s" : ""} overdue — new staff may be working without full preparation.`);
  if ((staffComposition.permanent_rate ?? 0) < 60) concerns.push(`Only ${(staffComposition.permanent_rate ?? 0)}% permanent staff — a high proportion of temporary workers affects stability.`);
  if ((staffComposition.dbs_update_service_rate ?? 0) < 50) concerns.push(`Only ${(staffComposition.dbs_update_service_rate ?? 0)}% of staff on DBS update service — annual re-checks require manual processing.`);

  // ── Recommendations ───────────────────────────────────────────────
  const recs: WorkforceRecommendation[] = [];
  let rank = 1;

  if (succession_plans.length === 0) {
    recs.push({ rank: rank++, recommendation: "Develop succession plans for all key leadership roles — RM, Deputy, and senior staff positions.", urgency: "soon", regulatory_ref: "Reg 33" });
  }
  if (overdueReviews.length > 0) {
    recs.push({ rank: rank++, recommendation: `Complete ${overdueReviews.length} overdue succession plan review${overdueReviews.length > 1 ? "s" : ""} — ensure readiness scores and development milestones are current.`, urgency: "soon", regulatory_ref: "Reg 33" });
  }
  if (overdueInductions.length > 0) {
    recs.push({ rank: rank++, recommendation: `Address ${overdueInductions.length} overdue induction${overdueInductions.length > 1 ? "s" : ""} — every new staff member must complete induction before unsupervised practice.`, urgency: "immediate", regulatory_ref: "Reg 33" });
  }
  if (agency.length > 0) {
    recs.push({ rank: rank++, recommendation: `Develop a strategy to reduce agency reliance — ${agency.length} agency worker${agency.length > 1 ? "s" : ""} currently in use.`, urgency: "planned", regulatory_ref: "Reg 33" });
  }
  if (openVacancies.length > 2) {
    recs.push({ rank: rank++, recommendation: `Prioritise recruitment for ${openVacancies.length} open vacancies — extended gaps risk staffing adequacy.`, urgency: "soon", regulatory_ref: "Reg 33" });
  }

  // ── Insights ──────────────────────────────────────────────────────
  const insights: WorkforceInsight[] = [];

  if ((staffComposition.permanent_rate ?? 0) >= 80 && agency.length === 0 && succession_plans.length > 0 && (avgReadiness ?? 0) >= 70) {
    insights.push({ text: `Workforce planning is exemplary — ${staffComposition.permanent_rate}% permanent staff, no agency reliance, and active succession planning with ${avgReadiness}% average readiness. Ofsted will recognise a home that invests in its people and plans for continuity, providing children with a stable, familiar team.`, severity: "positive" });
  }
  if (agency.length > 0 && pct(agency.length, activeStaff.length) > 20) {
    insights.push({ text: `${pct(agency.length, activeStaff.length)}% of the workforce are agency staff. High agency reliance means children experience unfamiliar adults, weakening therapeutic relationships and consistency of care. Ofsted will question whether the home can provide the stability children need.`, severity: "critical" });
  }
  if (succession_plans.length === 0) {
    insights.push({ text: "No succession plans are in place. If the Registered Manager or key senior staff were to leave, there is no documented plan for leadership continuity. Ofsted expects homes to plan proactively for workforce changes — the absence of succession planning is a leadership and management gap.", severity: "warning" });
  }
  if (overdueInductions.length > 0) {
    insights.push({ text: `${overdueInductions.length} induction${overdueInductions.length > 1 ? "s are" : " is"} overdue. Staff without completed inductions may not have the knowledge and skills to keep children safe. Regulation 33 requires that staff are suitably trained before undertaking responsibilities.`, severity: "critical" });
  }
  if (urgentPlans.length > 0 && readyNow.length === 0) {
    insights.push({ text: `${urgentPlans.length} succession plan${urgentPlans.length > 1 ? "s require" : " requires"} cover within 6 months, but no candidates are ready now. If a key role becomes vacant unexpectedly, the home would be reliant on external recruitment. Cara recommends accelerating development plans for the most promising candidates.`, severity: "warning" });
  }

  // ── Headline ──────────────────────────────────────────────────────
  let headline: string;
  if (rating === "outstanding") {
    headline = `Outstanding workforce planning — ${staffComposition.permanent_rate}% permanent staff, ${succession_plans.length} succession plan${succession_plans.length !== 1 ? "s" : ""} active, ${activeStaff.length} staff team.`;
  } else if (rating === "good") {
    headline = `Good workforce stability — mostly permanent staff with minor planning gaps.`;
  } else if (rating === "adequate") {
    headline = "Adequate workforce planning — succession gaps or staffing pressures need attention.";
  } else {
    headline = "Workforce planning is inadequate — critical gaps in succession, staffing, or induction.";
  }

  return {
    workforce_rating: rating,
    workforce_score: score,
    headline,
    staff_composition: staffComposition,
    succession_profile: successionProfile,
    vacancy_coverage: vacancyCoverage,
    induction_profile: inductionProfile,
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}

// ── Empty Profiles ──────────────────────────────────────────────────────────

function emptyStaffComposition(): StaffCompositionProfile {
  return { total_active: 0, permanent_count: 0, fixed_term_count: 0, agency_count: 0, bank_count: 0, permanent_rate: 0, avg_contracted_hours: 0, dbs_update_service_rate: 0, new_staff_count: 0, long_serving_count: 0 };
}

function emptySuccession(): SuccessionProfile {
  return { total_plans: 0, roles_covered: 0, total_candidates: 0, avg_readiness_score: 0, ready_now_count: 0, overdue_review_count: 0, urgent_plans_count: 0 };
}

function emptyVacancy(): VacancyCoverageProfile {
  return { total_vacancies: 0, open_count: 0, on_hold_count: 0, closed_count: 0, vacancy_rate: 0 };
}

function emptyInduction(): InductionProfile {
  return { total_inductions: 0, completed_count: 0, in_progress_count: 0, overdue_count: 0, completion_rate: 0, probation_passed_rate: 0, avg_item_completion_rate: 0 };
}
