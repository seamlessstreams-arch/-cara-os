// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — STAFF DEVELOPMENT INTELLIGENCE ENGINE
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
// Analyses appraisals, competency profiles, development plans, qualifications,
// and induction progress to surface workforce development patterns.
//
// Regulatory: Reg 32 (fitness of workers), Reg 33 (employment of staff),
// Reg 29 (registered person qualifications), SCCIF: "Does the home invest
// in developing its workforce?" and "Are staff competent and well supported?"
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export type AppraisalType =
  | "annual_appraisal"
  | "mid_year"
  | "probation_review"
  | "performance_improvement";

export type AppraisalStatus =
  | "completed"
  | "scheduled"
  | "overdue"
  | "cancelled";

export type OverallRating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate"
  | undefined;

export type QualificationStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "expired";

export type InductionStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "overdue";

export type DevelopmentPlanStatus =
  | "active"
  | "completed"
  | "paused"
  | "cancelled";

export interface StaffInput {
  id: string;
  name: string;
  role: string;
  is_active: boolean;
  start_date: string;
}

export interface AppraisalInput {
  id: string;
  staff_id: string;
  appraisal_type: AppraisalType;
  appraisal_date: string;
  status: AppraisalStatus;
  overall_rating: OverallRating;
  competency_scores: Record<string, number>; // domain → 1-5
  signed_by_staff: boolean;
  next_review_date: string | undefined;
}

export interface CompetencyProfileInput {
  id: string;
  staff_id: string;
  current_stage: string;
  target_stage: string | undefined;
  overall_readiness_score: number; // 0-100
  strengths: string[];
  development_areas: string[];
  next_review_date: string | undefined;
}

export interface QualificationInput {
  id: string;
  staff_id: string;
  qualification_name: string;
  level: string | undefined;
  mandatory: boolean;
  status: QualificationStatus;
  started_at: string | undefined;
  completed_at: string | undefined;
  expiry_date: string | undefined;
}

export interface InductionInput {
  id: string;
  staff_id: string;
  start_date: string;
  target_completion_date: string;
  overall_status: InductionStatus;
  total_items: number;
  completed_items: number;
  overdue_items: number;
  probation_passed: boolean;
}

export interface DevelopmentPlanInput {
  id: string;
  staff_id: string;
  title: string;
  from_stage: string;
  to_stage: string;
  status: DevelopmentPlanStatus;
  total_actions: number;
  completed_actions: number;
}

export interface StaffDevelopmentIntelligenceInput {
  staff: StaffInput[];
  appraisals: AppraisalInput[];
  competency_profiles: CompetencyProfileInput[];
  qualifications: QualificationInput[];
  inductions: InductionInput[];
  development_plans: DevelopmentPlanInput[];
  today?: string;
}

// ── Output Types ────────────────────────────────────────────────────────────

export interface DevelopmentOverview {
  total_staff: number;
  active_staff: number;
  appraisals_completed: number;
  appraisals_overdue: number;
  appraisals_scheduled: number;
  appraisal_completion_rate: number; // pct of active staff with a completed appraisal
  avg_competency_readiness: number; // avg across all profiles
  qualifications_in_progress: number;
  qualifications_not_started: number;
  qualifications_expiring_soon: number; // within 90 days
  mandatory_qual_compliance_rate: number;
  inductions_in_progress: number;
  inductions_complete: number;
  development_plans_active: number;
  development_plan_progress_rate: number; // avg % completion across active plans
}

export interface StaffDevelopmentProfile {
  staff_id: string;
  staff_name: string;
  role: string;
  tenure_days: number;
  latest_appraisal_rating: OverallRating;
  latest_appraisal_date: string | undefined;
  appraisal_overdue: boolean;
  avg_competency_score: number; // avg of all competency scores from latest appraisal
  readiness_score: number; // from competency profile
  current_stage: string;
  target_stage: string | undefined;
  mandatory_quals_total: number;
  mandatory_quals_completed: number;
  mandatory_qual_compliant: boolean;
  has_active_development_plan: boolean;
  development_plan_progress: number; // pct
  induction_status: InductionStatus | "not_applicable";
  risk_flags: string[];
}

export interface CompetencyDomainAnalysis {
  domain: string;
  avg_score: number;
  min_score: number;
  max_score: number;
  staff_count: number; // how many staff have a score in this domain
}

export interface DevelopmentAlert {
  severity: "critical" | "high" | "medium" | "low";
  message: string;
}

export interface AriaDevelopmentInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface StaffDevelopmentIntelligenceResult {
  overview: DevelopmentOverview;
  staff_profiles: StaffDevelopmentProfile[];
  competency_analysis: CompetencyDomainAnalysis[];
  alerts: DevelopmentAlert[];
  insights: AriaDevelopmentInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

export function daysBetween(a: string, b: string): number {
  const msA = new Date(a).getTime();
  const msB = new Date(b).getTime();
  return Math.round(Math.abs(msB - msA) / 86_400_000);
}

export function daysUntil(from: string, to: string): number {
  return Math.round(
    (new Date(to).getTime() - new Date(from).getTime()) / 86_400_000,
  );
}

export function average(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

// ── Main Computation ────────────────────────────────────────────────────────

export function computeStaffDevelopmentIntelligence(
  input: StaffDevelopmentIntelligenceInput,
): StaffDevelopmentIntelligenceResult {
  const today = input.today ?? new Date().toISOString().slice(0, 10);
  const { staff, appraisals, competency_profiles, qualifications, inductions, development_plans } = input;

  const activeStaff = staff.filter((s) => s.is_active);

  // ── Index maps ─────────────────────────────────────────────────────────
  const appraisalsByStaff = new Map<string, AppraisalInput[]>();
  for (const a of appraisals) {
    const arr = appraisalsByStaff.get(a.staff_id) ?? [];
    arr.push(a);
    appraisalsByStaff.set(a.staff_id, arr);
  }

  const profileByStaff = new Map<string, CompetencyProfileInput>();
  for (const p of competency_profiles) {
    profileByStaff.set(p.staff_id, p);
  }

  const qualsByStaff = new Map<string, QualificationInput[]>();
  for (const q of qualifications) {
    const arr = qualsByStaff.get(q.staff_id) ?? [];
    arr.push(q);
    qualsByStaff.set(q.staff_id, arr);
  }

  const inductionByStaff = new Map<string, InductionInput>();
  for (const i of inductions) {
    inductionByStaff.set(i.staff_id, i);
  }

  const plansByStaff = new Map<string, DevelopmentPlanInput[]>();
  for (const dp of development_plans) {
    const arr = plansByStaff.get(dp.staff_id) ?? [];
    arr.push(dp);
    plansByStaff.set(dp.staff_id, arr);
  }

  // ── Overview calculations ──────────────────────────────────────────────
  const completedAppraisals = appraisals.filter((a) => a.status === "completed");
  const overdueAppraisals = appraisals.filter((a) => a.status === "overdue");
  const scheduledAppraisals = appraisals.filter((a) => a.status === "scheduled");

  // Staff with at least one completed appraisal
  const staffWithCompleted = new Set(completedAppraisals.map((a) => a.staff_id));
  const appraisalCompletionRate =
    activeStaff.length > 0
      ? Math.round((activeStaff.filter((s) => staffWithCompleted.has(s.id)).length / activeStaff.length) * 100)
      : 100;

  const readinessScores = competency_profiles.map((p) => p.overall_readiness_score);
  const avgReadiness = Math.round(average(readinessScores));

  // Qualifications
  const mandatoryQuals = qualifications.filter((q) => q.mandatory);
  const mandatoryCompleted = mandatoryQuals.filter((q) => q.status === "completed");
  const mandatoryComplianceRate =
    mandatoryQuals.length > 0
      ? Math.round((mandatoryCompleted.length / mandatoryQuals.length) * 100)
      : 100;

  const qualsInProgress = qualifications.filter((q) => q.status === "in_progress").length;
  const qualsNotStarted = qualifications.filter((q) => q.status === "not_started" && q.mandatory).length;
  const qualsExpiringSoon = qualifications.filter((q) => {
    if (!q.expiry_date || q.status !== "completed") return false;
    const daysLeft = daysUntil(today, q.expiry_date);
    return daysLeft >= 0 && daysLeft <= 90;
  }).length;

  // Inductions
  const inductionsInProgress = inductions.filter((i) => i.overall_status === "in_progress").length;
  const inductionsComplete = inductions.filter((i) => i.overall_status === "completed").length;

  // Development plans
  const activePlans = development_plans.filter((dp) => dp.status === "active");
  const planProgressRates = activePlans.map((dp) =>
    dp.total_actions > 0
      ? Math.round((dp.completed_actions / dp.total_actions) * 100)
      : 0,
  );
  const avgPlanProgress = Math.round(average(planProgressRates));

  const overview: DevelopmentOverview = {
    total_staff: staff.length,
    active_staff: activeStaff.length,
    appraisals_completed: completedAppraisals.length,
    appraisals_overdue: overdueAppraisals.length,
    appraisals_scheduled: scheduledAppraisals.length,
    appraisal_completion_rate: appraisalCompletionRate,
    avg_competency_readiness: avgReadiness,
    qualifications_in_progress: qualsInProgress,
    qualifications_not_started: qualsNotStarted,
    qualifications_expiring_soon: qualsExpiringSoon,
    mandatory_qual_compliance_rate: mandatoryComplianceRate,
    inductions_in_progress: inductionsInProgress,
    inductions_complete: inductionsComplete,
    development_plans_active: activePlans.length,
    development_plan_progress_rate: avgPlanProgress,
  };

  // ── Staff Profiles ─────────────────────────────────────────────────────
  const staff_profiles: StaffDevelopmentProfile[] = activeStaff.map((s) => {
    const staffAppraisals = appraisalsByStaff.get(s.id) ?? [];
    const completed = staffAppraisals
      .filter((a) => a.status === "completed")
      .sort((a, b) => b.appraisal_date.localeCompare(a.appraisal_date));
    const latest = completed[0];

    const hasOverdue = staffAppraisals.some((a) => a.status === "overdue");

    // Avg competency from latest appraisal
    const scores = latest ? Object.values(latest.competency_scores) : [];
    const avgCompetency = scores.length > 0
      ? Math.round(average(scores) * 10) / 10
      : 0;

    // Competency profile
    const profile = profileByStaff.get(s.id);
    const readinessScore = profile?.overall_readiness_score ?? 0;
    const currentStage = profile?.current_stage ?? s.role;
    const targetStage = profile?.target_stage;

    // Qualifications
    const staffQuals = qualsByStaff.get(s.id) ?? [];
    const mandatoryStaffQuals = staffQuals.filter((q) => q.mandatory);
    const mandatoryStaffCompleted = mandatoryStaffQuals.filter((q) => q.status === "completed").length;
    const mandatoryQualCompliant =
      mandatoryStaffQuals.length === 0 || mandatoryStaffCompleted === mandatoryStaffQuals.length;

    // Development plans
    const staffPlans = plansByStaff.get(s.id) ?? [];
    const activePlan = staffPlans.find((dp) => dp.status === "active");
    const planProgress = activePlan
      ? (activePlan.total_actions > 0
          ? Math.round((activePlan.completed_actions / activePlan.total_actions) * 100)
          : 0)
      : 0;

    // Induction
    const induction = inductionByStaff.get(s.id);
    const inductionStatus: InductionStatus | "not_applicable" = induction
      ? induction.overall_status
      : "not_applicable";

    // Tenure
    const tenureDays = daysBetween(s.start_date, today);

    // Risk flags
    const riskFlags: string[] = [];
    if (hasOverdue) riskFlags.push("Appraisal overdue");
    if (!mandatoryQualCompliant) riskFlags.push("Mandatory qualification gap");
    if (
      staffQuals.some(
        (q) =>
          q.expiry_date &&
          q.status === "completed" &&
          daysUntil(today, q.expiry_date) < 0,
      )
    ) {
      riskFlags.push("Expired qualification");
    }
    if (induction && induction.overall_status === "in_progress" && induction.overdue_items > 0) {
      riskFlags.push("Overdue induction items");
    }
    if (
      latest &&
      latest.overall_rating === "requires_improvement"
    ) {
      riskFlags.push("Requires improvement rating");
    }
    if (
      latest &&
      latest.overall_rating === "inadequate"
    ) {
      riskFlags.push("Inadequate rating");
    }
    if (!latest && tenureDays > 180) {
      riskFlags.push("No completed appraisal (6+ months employed)");
    }

    return {
      staff_id: s.id,
      staff_name: s.name,
      role: s.role,
      tenure_days: tenureDays,
      latest_appraisal_rating: latest?.overall_rating,
      latest_appraisal_date: latest?.appraisal_date,
      appraisal_overdue: hasOverdue,
      avg_competency_score: avgCompetency,
      readiness_score: readinessScore,
      current_stage: currentStage,
      target_stage: targetStage,
      mandatory_quals_total: mandatoryStaffQuals.length,
      mandatory_quals_completed: mandatoryStaffCompleted,
      mandatory_qual_compliant: mandatoryQualCompliant,
      has_active_development_plan: Boolean(activePlan),
      development_plan_progress: planProgress,
      induction_status: inductionStatus,
      risk_flags: riskFlags,
    };
  });

  // ── Competency Domain Analysis ─────────────────────────────────────────
  const domainScoreMap = new Map<string, number[]>();
  for (const a of completedAppraisals) {
    for (const [domain, score] of Object.entries(a.competency_scores)) {
      const arr = domainScoreMap.get(domain) ?? [];
      arr.push(score);
      domainScoreMap.set(domain, arr);
    }
  }

  const competency_analysis: CompetencyDomainAnalysis[] = [...domainScoreMap.entries()]
    .map(([domain, scores]) => ({
      domain,
      avg_score: Math.round(average(scores) * 10) / 10,
      min_score: Math.min(...scores),
      max_score: Math.max(...scores),
      staff_count: scores.length,
    }))
    .sort((a, b) => a.avg_score - b.avg_score); // weakest domains first

  // ── Alerts ────────────────────────────────────────────────────────────
  const alerts: DevelopmentAlert[] = [];

  // Critical: overdue appraisals
  if (overdueAppraisals.length > 0) {
    const names = overdueAppraisals
      .map((a) => staff.find((s) => s.id === a.staff_id)?.name ?? "Unknown")
      .join(", ");
    alerts.push({
      severity: "critical",
      message: `${overdueAppraisals.length} overdue appraisal(s): ${names}. Reg 33 requires staff to receive regular supervision and appraisal. Overdue appraisals indicate a gap in workforce oversight.`,
    });
  }

  // Critical: mandatory qualifications not started for staff past 6 months
  const qualGapStaff = staff_profiles.filter(
    (p) => !p.mandatory_qual_compliant && p.tenure_days > 180,
  );
  if (qualGapStaff.length > 0) {
    const names = qualGapStaff.map((p) => p.staff_name).join(", ");
    alerts.push({
      severity: "critical",
      message: `${qualGapStaff.length} staff member(s) with mandatory qualification gaps after 6+ months: ${names}. Reg 32 requires staff to hold or be actively working towards required qualifications.`,
    });
  }

  // High: expired qualifications
  const expiredQuals = qualifications.filter(
    (q) =>
      q.expiry_date &&
      q.status === "completed" &&
      daysUntil(today, q.expiry_date) < 0,
  );
  if (expiredQuals.length > 0) {
    alerts.push({
      severity: "high",
      message: `${expiredQuals.length} qualification(s) have expired. Expired qualifications may affect the validity of the SCR and operational competency evidence.`,
    });
  }

  // High: staff with no appraisal and 6+ months tenure
  const noAppraisalLong = staff_profiles.filter(
    (p) => p.risk_flags.includes("No completed appraisal (6+ months employed)"),
  );
  if (noAppraisalLong.length > 0) {
    const names = noAppraisalLong.map((p) => p.staff_name).join(", ");
    alerts.push({
      severity: "high",
      message: `${noAppraisalLong.length} staff member(s) employed for 6+ months without a completed appraisal: ${names}. Ofsted expects regular performance assessment as part of workforce development.`,
    });
  }

  // Medium: qualifications expiring within 90 days
  if (qualsExpiringSoon > 0) {
    alerts.push({
      severity: "medium",
      message: `${qualsExpiringSoon} qualification(s) expiring within 90 days. Initiate renewals now to avoid compliance gaps.`,
    });
  }

  // Medium: inductions with overdue items
  const inductionsWithOverdue = inductions.filter(
    (i) => i.overall_status === "in_progress" && i.overdue_items > 0,
  );
  if (inductionsWithOverdue.length > 0) {
    alerts.push({
      severity: "medium",
      message: `${inductionsWithOverdue.length} induction(s) with overdue items. Induction completeness is a key Reg 33 indicator and ensures new staff are safe and competent.`,
    });
  }

  // Low: development plans with low progress
  const slowPlans = activePlans.filter(
    (dp) =>
      dp.total_actions > 0 &&
      Math.round((dp.completed_actions / dp.total_actions) * 100) < 25,
  );
  if (slowPlans.length > 0) {
    alerts.push({
      severity: "low",
      message: `${slowPlans.length} active development plan(s) with less than 25% progress. Review whether targets are realistic and support is adequate.`,
    });
  }

  // ── ARIA Insights ─────────────────────────────────────────────────────
  const insights: AriaDevelopmentInsight[] = [];

  // Critical: overdue appraisals
  if (overdueAppraisals.length > 0 && activeStaff.length > 0) {
    insights.push({
      severity: "critical",
      text: `${overdueAppraisals.length} appraisal(s) overdue. Ofsted inspectors will check that every staff member has a current appraisal. Overdue appraisals directly affect the "workforce development" judgement in SCCIF.`,
    });
  }

  // Warning: low appraisal completion rate
  if (appraisalCompletionRate < 80 && activeStaff.length > 0) {
    insights.push({
      severity: "warning",
      text: `Only ${appraisalCompletionRate}% of active staff have a completed appraisal. A strong home demonstrates that performance is regularly assessed and development is purposeful. Aim for 100% coverage.`,
    });
  }

  // Warning: low mandatory qualification compliance
  if (mandatoryComplianceRate < 80 && mandatoryQuals.length > 0) {
    insights.push({
      severity: "warning",
      text: `Mandatory qualification compliance is at ${mandatoryComplianceRate}%. Reg 32 requires all staff to be fit for purpose — mandatory qualifications are the foundation. Prioritise enrolments and completions.`,
    });
  }

  // Warning: competency domain with avg below 3
  const weakDomains = competency_analysis.filter((d) => d.avg_score < 3);
  if (weakDomains.length > 0) {
    const names = weakDomains.map((d) => d.domain.replace(/_/g, " ")).join(", ");
    insights.push({
      severity: "warning",
      text: `Team-wide weakness identified in: ${names} (avg score below 3/5). Consider targeted group training or practice development sessions in these areas.`,
    });
  }

  // Positive: 100% appraisal completion
  if (appraisalCompletionRate === 100 && activeStaff.length > 0) {
    insights.push({
      severity: "positive",
      text: `All ${activeStaff.length} active staff have a completed appraisal. This demonstrates strong workforce oversight and commitment to individual development — a key strength under SCCIF.`,
    });
  }

  // Positive: high average readiness
  if (avgReadiness >= 70 && competency_profiles.length > 0) {
    insights.push({
      severity: "positive",
      text: `Average competency readiness score is ${avgReadiness}%. The workforce has a strong overall capability profile. Continue investing in targeted development to maintain this standard.`,
    });
  }

  // Positive: active development plans
  if (activePlans.length >= 2) {
    insights.push({
      severity: "positive",
      text: `${activePlans.length} active development plans in place. Structured career progression planning demonstrates investment in staff retention and capability building — an inspector would note this positively.`,
    });
  }

  // Positive: all mandatory quals compliant
  if (mandatoryComplianceRate === 100 && mandatoryQuals.length > 0) {
    insights.push({
      severity: "positive",
      text: `100% mandatory qualification compliance across ${mandatoryQuals.length} requirements. Every staff member meets or exceeds the regulatory qualification standard.`,
    });
  }

  // Positive: succession pipeline visible
  const withTarget = competency_profiles.filter((p) => p.target_stage);
  if (withTarget.length >= 2) {
    insights.push({
      severity: "positive",
      text: `${withTarget.length} staff members have identified progression targets. A visible succession pipeline is a sign of strategic workforce planning — Ofsted looks favourably on homes that develop future leaders.`,
    });
  }

  return {
    overview,
    staff_profiles,
    competency_analysis,
    alerts,
    insights,
  };
}
