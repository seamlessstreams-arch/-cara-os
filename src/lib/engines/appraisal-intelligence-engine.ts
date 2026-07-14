// ══════════════════════════════════════════════════════════════════════════════
// CARA — APPRAISAL INTELLIGENCE ENGINE
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
// Analyses staff appraisal compliance: completion rates, competency scores,
// performance ratings, fitness confirmation, goal tracking, and workforce
// development readiness.
//
// Regulatory: Reg 32 — the registered person must ensure workers are of
// good character, have qualifications/skills/experience, and are fit.
// Reg 33 — the registered person must carry out regular appraisal of
// each worker. SCCIF: "Are staff competent, confident, and suitably
// trained?" Quality Standards: workforce development and fitness tracking.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export type AppraisalType = "probation_review" | "annual_appraisal" | "mid_year" | "pip";
export type AppraisalStatus = "scheduled" | "in_progress" | "completed" | "overdue";
export type AppraisalRating = "outstanding" | "good" | "requires_improvement" | "inadequate";
export type CompetencyLevel = 0 | 1 | 2 | 3 | 4 | 5;

export type CompetencyDomain =
  | "safeguarding_and_child_protection"
  | "therapeutic_relationships"
  | "trauma_informed_practice"
  | "risk_management"
  | "statutory_compliance"
  | "communication_and_recording"
  | "leadership_and_supervision"
  | "self_care_and_resilience"
  | "learning_and_professional_development"
  | "equality_diversity_inclusion";

export interface AppraisalInput {
  id: string;
  staff_id: string;
  appraisal_type: AppraisalType;
  appraisal_date: string;           // ISO date YYYY-MM-DD
  appraiser_id: string;
  status: AppraisalStatus;
  overall_rating: AppraisalRating | null;
  competency_scores: Partial<Record<CompetencyDomain, CompetencyLevel>>;
  signed_by_staff: boolean;
  next_review_date: string | null;  // ISO date
  objectives_next_period: string | null;
  created_at: string;
}

export interface StaffRef {
  id: string;
  name: string;
  is_active: boolean;
}

export interface AppraisalIntelligenceInput {
  appraisals: AppraisalInput[];
  staff: StaffRef[];
  today?: string;
}

// ── Output Types ────────────────────────────────────────────────────────────

export interface AppraisalOverview {
  total_appraisals: number;
  completed: number;
  overdue: number;
  scheduled: number;
  in_progress: number;
  completion_rate: number;             // pct of non-scheduled that are completed
  compliance_rate: number;             // pct of active staff with ≥1 completed appraisal
  staff_with_appraisal: number;
  staff_without_appraisal: number;
  avg_competency_score: number;        // avg across all domains of completed appraisals
  fitness_confirmed_rate: number;      // pct of completed that are signed by staff
  overdue_count: number;
}

export interface RatingBreakdown {
  rating: AppraisalRating;
  count: number;
  percentage: number;
}

export interface CompetencyAnalysis {
  domain: CompetencyDomain;
  domain_label: string;
  avg_score: number;
  staff_assessed: number;
  lowest_score: number;
  highest_score: number;
}

export interface StaffAppraisalProfile {
  staff_id: string;
  staff_name: string;
  latest_appraisal_id: string | null;
  latest_appraisal_date: string | null;
  latest_status: AppraisalStatus | null;
  latest_rating: AppraisalRating | null;
  is_signed: boolean;
  next_review_date: string | null;
  next_review_in_days: number;         // negative = overdue
  has_objectives: boolean;
  appraisal_count: number;
  risk_flags: string[];
}

export interface AppraisalAlert {
  severity: "critical" | "high" | "medium" | "low";
  message: string;
}

export interface CaraAppraisalInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface AppraisalIntelligenceResult {
  overview: AppraisalOverview;
  rating_breakdown: RatingBreakdown[];
  competency_analysis: CompetencyAnalysis[];
  staff_profiles: StaffAppraisalProfile[];
  alerts: AppraisalAlert[];
  insights: CaraAppraisalInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

export function average(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T00:00:00Z");
  const db = new Date(b + "T00:00:00Z");
  return Math.round((db.getTime() - da.getTime()) / 86_400_000);
}

const DOMAIN_LABELS: Record<CompetencyDomain, string> = {
  safeguarding_and_child_protection:    "Safeguarding & Child Protection",
  therapeutic_relationships:             "Therapeutic Relationships",
  trauma_informed_practice:              "Trauma-Informed Practice",
  risk_management:                       "Risk Management",
  statutory_compliance:                  "Statutory Compliance",
  communication_and_recording:           "Communication & Recording",
  leadership_and_supervision:            "Leadership & Supervision",
  self_care_and_resilience:              "Self-Care & Resilience",
  learning_and_professional_development: "Learning & Professional Development",
  equality_diversity_inclusion:          "Equality, Diversity & Inclusion",
};

const ALL_DOMAINS: CompetencyDomain[] = [
  "safeguarding_and_child_protection",
  "therapeutic_relationships",
  "trauma_informed_practice",
  "risk_management",
  "statutory_compliance",
  "communication_and_recording",
  "leadership_and_supervision",
  "self_care_and_resilience",
  "learning_and_professional_development",
  "equality_diversity_inclusion",
];

const RATING_ORDER: AppraisalRating[] = [
  "outstanding", "good", "requires_improvement", "inadequate",
];

// ── Main Computation ────────────────────────────────────────────────────────

export function computeAppraisalIntelligence(
  input: AppraisalIntelligenceInput,
): AppraisalIntelligenceResult {
  const today = input.today ?? new Date().toISOString().slice(0, 10);
  const { appraisals, staff } = input;

  const activeStaff = staff.filter((s) => s.is_active);
  const staffMap = new Map(staff.map((s) => [s.id, s.name]));

  // ── Status counts ──────────────────────────────────────────────────────
  const completed = appraisals.filter((a) => a.status === "completed");
  const overdue = appraisals.filter((a) => a.status === "overdue");
  const scheduled = appraisals.filter((a) => a.status === "scheduled");
  const inProgress = appraisals.filter((a) => a.status === "in_progress");

  // completion_rate = completed / (total - scheduled) — only actionable items
  const actionable = appraisals.filter((a) => a.status !== "scheduled");
  const completionRate = actionable.length > 0
    ? Math.round((completed.length / actionable.length) * 100)
    : 100;

  // ── Staff coverage ─────────────────────────────────────────────────────
  const staffWithCompleted = new Set(completed.map((a) => a.staff_id));
  const staffWithAppraisal = activeStaff.filter((s) => staffWithCompleted.has(s.id)).length;
  const staffWithoutAppraisal = activeStaff.length - staffWithAppraisal;
  const complianceRate = activeStaff.length > 0
    ? Math.round((staffWithAppraisal / activeStaff.length) * 100)
    : 100;

  // ── Competency scores ──────────────────────────────────────────────────
  const allScores: number[] = [];
  for (const a of completed) {
    const scores = Object.values(a.competency_scores).filter((v) => typeof v === "number" && v > 0);
    allScores.push(...scores);
  }
  const avgCompetencyScore = allScores.length > 0 ? round1(average(allScores)) : 0;

  // ── Fitness confirmed (signed by staff) ────────────────────────────────
  const signedCount = completed.filter((a) => a.signed_by_staff).length;
  const fitnessConfirmedRate = completed.length > 0
    ? Math.round((signedCount / completed.length) * 100)
    : 100;

  const overview: AppraisalOverview = {
    total_appraisals: appraisals.length,
    completed: completed.length,
    overdue: overdue.length,
    scheduled: scheduled.length,
    in_progress: inProgress.length,
    completion_rate: completionRate,
    compliance_rate: complianceRate,
    staff_with_appraisal: staffWithAppraisal,
    staff_without_appraisal: staffWithoutAppraisal,
    avg_competency_score: avgCompetencyScore,
    fitness_confirmed_rate: fitnessConfirmedRate,
    overdue_count: overdue.length,
  };

  // ── Rating Breakdown ───────────────────────────────────────────────────
  const ratingCounts = new Map<AppraisalRating, number>();
  for (const r of RATING_ORDER) ratingCounts.set(r, 0);
  for (const a of completed) {
    if (a.overall_rating) {
      ratingCounts.set(a.overall_rating, (ratingCounts.get(a.overall_rating) ?? 0) + 1);
    }
  }
  const rating_breakdown: RatingBreakdown[] = RATING_ORDER.map((r) => {
    const count = ratingCounts.get(r) ?? 0;
    return {
      rating: r,
      count,
      percentage: completed.length > 0 ? Math.round((count / completed.length) * 100) : 0,
    };
  });

  // ── Competency Analysis ────────────────────────────────────────────────
  const competency_analysis: CompetencyAnalysis[] = ALL_DOMAINS.map((domain) => {
    const scores: number[] = [];
    for (const a of completed) {
      const score = a.competency_scores[domain];
      if (typeof score === "number" && score > 0) {
        scores.push(score);
      }
    }
    return {
      domain,
      domain_label: DOMAIN_LABELS[domain],
      avg_score: scores.length > 0 ? round1(average(scores)) : 0,
      staff_assessed: scores.length,
      lowest_score: scores.length > 0 ? Math.min(...scores) : 0,
      highest_score: scores.length > 0 ? Math.max(...scores) : 0,
    };
  }).filter((c) => c.staff_assessed > 0)
    .sort((a, b) => a.avg_score - b.avg_score); // lowest-scoring domains first

  // ── Staff Profiles ─────────────────────────────────────────────────────
  const staffAppraisalMap = new Map<string, AppraisalInput[]>();
  for (const a of appraisals) {
    const arr = staffAppraisalMap.get(a.staff_id) ?? [];
    arr.push(a);
    staffAppraisalMap.set(a.staff_id, arr);
  }

  const staff_profiles: StaffAppraisalProfile[] = activeStaff.map((s) => {
    const staffAppraisals = staffAppraisalMap.get(s.id) ?? [];
    // Sort by date, latest first
    const sorted = [...staffAppraisals].sort(
      (a, b) => b.appraisal_date.localeCompare(a.appraisal_date),
    );
    const latest = sorted[0] ?? null;

    // Next review: use latest's next_review_date, or null
    const nextReviewDate = latest?.next_review_date ?? null;
    const nextReviewInDays = nextReviewDate
      ? daysBetween(today, nextReviewDate)
      : -999;

    const riskFlags: string[] = [];
    if (staffAppraisals.length === 0) riskFlags.push("no_appraisal");
    if (latest?.status === "overdue") riskFlags.push("overdue");
    if (latest && latest.status === "completed" && !latest.signed_by_staff)
      riskFlags.push("not_signed");
    if (latest?.overall_rating === "requires_improvement")
      riskFlags.push("requires_improvement");
    if (latest?.overall_rating === "inadequate")
      riskFlags.push("inadequate");
    if (nextReviewDate && nextReviewInDays < 0 && latest?.status !== "overdue")
      riskFlags.push("review_overdue");

    return {
      staff_id: s.id,
      staff_name: s.name,
      latest_appraisal_id: latest?.id ?? null,
      latest_appraisal_date: latest?.appraisal_date ?? null,
      latest_status: latest?.status ?? null,
      latest_rating: latest?.overall_rating ?? null,
      is_signed: latest?.signed_by_staff ?? false,
      next_review_date: nextReviewDate,
      next_review_in_days: nextReviewInDays,
      has_objectives: !!(latest?.objectives_next_period),
      appraisal_count: staffAppraisals.length,
      risk_flags: riskFlags,
    };
  }).sort((a, b) => {
    // Sort: overdue first, then by most flags, then alphabetical
    const aOverdue = a.risk_flags.includes("overdue") || a.risk_flags.includes("no_appraisal") ? 0 : 1;
    const bOverdue = b.risk_flags.includes("overdue") || b.risk_flags.includes("no_appraisal") ? 0 : 1;
    if (aOverdue !== bOverdue) return aOverdue - bOverdue;
    if (b.risk_flags.length !== a.risk_flags.length) return b.risk_flags.length - a.risk_flags.length;
    return a.staff_name.localeCompare(b.staff_name);
  });

  // ── Alerts ────────────────────────────────────────────────────────────
  const alerts: AppraisalAlert[] = [];

  // Critical: overdue appraisals
  if (overdue.length > 0) {
    const names = overdue.map((a) => staffMap.get(a.staff_id) ?? a.staff_id).join(", ");
    alerts.push({
      severity: "critical",
      message: `${overdue.length} appraisal(s) overdue (${names}). Reg 33 requires the registered person to carry out regular appraisal of staff performance and fitness.`,
    });
  }

  // High: staff without any completed appraisal
  if (staffWithoutAppraisal > 0) {
    const missing = activeStaff.filter((s) => !staffWithCompleted.has(s.id));
    const names = missing.map((s) => s.name).join(", ");
    alerts.push({
      severity: "high",
      message: `${staffWithoutAppraisal} active staff member(s) without a completed appraisal (${names}). All staff must have documented evidence of fitness under Reg 32.`,
    });
  }

  // High: unsigned completed appraisals (fitness not confirmed)
  const unsigned = completed.filter((a) => !a.signed_by_staff);
  if (unsigned.length > 0) {
    alerts.push({
      severity: "high",
      message: `${unsigned.length} completed appraisal(s) not signed by staff. Staff sign-off confirms mutual agreement on performance assessment and fitness to practice.`,
    });
  }

  // High: inadequate ratings
  const inadequateAppraisals = completed.filter((a) => a.overall_rating === "inadequate");
  if (inadequateAppraisals.length > 0) {
    const names = inadequateAppraisals.map((a) => staffMap.get(a.staff_id) ?? a.staff_id).join(", ");
    alerts.push({
      severity: "high",
      message: `${inadequateAppraisals.length} staff rated "inadequate" (${names}). Immediate PIP or capability process may be required under Reg 33.`,
    });
  }

  // Medium: requires_improvement ratings
  const riAppraisals = completed.filter((a) => a.overall_rating === "requires_improvement");
  if (riAppraisals.length > 0) {
    alerts.push({
      severity: "medium",
      message: `${riAppraisals.length} staff rated "requires improvement". Targeted development support and closer supervision recommended.`,
    });
  }

  // Medium: low competency scores (avg < 3 = below "competent")
  const lowDomains = competency_analysis.filter((c) => c.avg_score > 0 && c.avg_score < 3);
  if (lowDomains.length > 0) {
    const names = lowDomains.map((d) => d.domain_label).join(", ");
    alerts.push({
      severity: "medium",
      message: `${lowDomains.length} competency domain(s) below "competent" threshold: ${names}. Targeted training or coaching may be required.`,
    });
  }

  // Low: scheduled appraisals upcoming
  if (scheduled.length > 0) {
    alerts.push({
      severity: "low",
      message: `${scheduled.length} appraisal(s) scheduled. Ensure appraiser preparation and staff self-assessment are completed prior to meeting.`,
    });
  }

  // ── Cara Insights ─────────────────────────────────────────────────────
  const insights: CaraAppraisalInsight[] = [];

  // Critical: overdue
  if (overdue.length > 0) {
    insights.push({
      severity: "critical",
      text: `${overdue.length} appraisal(s) are overdue. Inspectors will examine whether regular appraisal is embedded as standard practice — overdue appraisals are a direct Reg 33 shortfall.`,
    });
  }

  // Warning: staff without appraisal
  if (staffWithoutAppraisal > 0) {
    insights.push({
      severity: "warning",
      text: `${staffWithoutAppraisal} active staff member(s) have no completed appraisal on record. Under Reg 32, the registered person must be satisfied that workers remain fit and demonstrate competence.`,
    });
  }

  // Warning: low competency areas
  if (lowDomains.length > 0) {
    insights.push({
      severity: "warning",
      text: `${lowDomains.length} competency domain(s) show average scores below "competent" level (3/5). Workforce development plans should address these gaps — inspectors assess whether training translates into practice improvement.`,
    });
  }

  // Warning: unsigned appraisals
  if (unsigned.length > 0) {
    insights.push({
      severity: "warning",
      text: `${unsigned.length} completed appraisal(s) lack staff sign-off. Signed appraisals demonstrate transparency and mutual accountability — a governance indicator for inspection.`,
    });
  }

  // Positive: all appraisals completed
  if (overdue.length === 0 && appraisals.length > 0 && actionable.length > 0 && completed.length === actionable.length) {
    insights.push({
      severity: "positive",
      text: `All actionable appraisals are completed. Consistent appraisal completion is strong evidence of Reg 33 compliance and effective workforce management.`,
    });
  }

  // Positive: 100% compliance rate
  if (complianceRate === 100 && activeStaff.length > 0) {
    insights.push({
      severity: "positive",
      text: `All ${activeStaff.length} active staff have at least one completed appraisal. Full coverage demonstrates the registered person takes workforce fitness seriously — a strong SCCIF indicator.`,
    });
  }

  // Positive: high average competency
  if (avgCompetencyScore >= 4 && allScores.length > 0) {
    insights.push({
      severity: "positive",
      text: `Average competency score is ${avgCompetencyScore}/5 ("proficient" level). High workforce competency indicates effective recruitment, training, and professional development aligned with the home's Statement of Purpose.`,
    });
  }

  // Positive: 100% fitness confirmed
  if (fitnessConfirmedRate === 100 && completed.length > 0) {
    insights.push({
      severity: "positive",
      text: `All completed appraisals are signed by staff. 100% sign-off rate demonstrates transparent performance management and fitness confirmation under Reg 32.`,
    });
  }

  // Positive: outstanding ratings exist
  const outstandingCount = rating_breakdown.find((r) => r.rating === "outstanding")?.count ?? 0;
  if (outstandingCount > 0) {
    insights.push({
      severity: "positive",
      text: `${outstandingCount} staff member(s) rated "outstanding". Exceptional practice should be recognised and shared with the wider team as part of continuous improvement.`,
    });
  }

  // Positive: diverse appraisal types
  const uniqueTypes = new Set(appraisals.map((a) => a.appraisal_type));
  if (uniqueTypes.size >= 3) {
    insights.push({
      severity: "positive",
      text: `Appraisal programme includes ${uniqueTypes.size} different appraisal types. A diverse approach (annual, mid-year, probation, PIP) demonstrates a robust and responsive workforce management framework.`,
    });
  }

  return {
    overview,
    rating_breakdown,
    competency_analysis,
    staff_profiles,
    alerts,
    insights,
  };
}
