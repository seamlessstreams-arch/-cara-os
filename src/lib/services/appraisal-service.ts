// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF APPRAISAL & PERFORMANCE SERVICE
// Manages annual appraisals, probation reviews, performance goals, and
// professional development objectives. Evidence base for Reg 32 (fitness
// of workers), Reg 33 (employment of staff), and SCCIF leadership &
// management judgment.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ───────────────────────────────────────────────────────────────────

export interface Appraisal {
  id: string;
  home_id: string;
  staff_id: string;
  staff_name: string;
  appraisal_type: string;
  appraisal_date: string;
  appraiser: string;
  period_from: string;
  period_to: string;
  overall_rating: string;
  strengths: string[];
  areas_for_development: string[];
  objectives: PerformanceObjective[];
  training_needs: string[];
  supervision_frequency: string;
  fitness_confirmed: boolean;
  next_appraisal_date: string;
  notes?: string | null;
  status: "scheduled" | "completed" | "overdue";
  created_at: string;
  updated_at: string;
}

export interface PerformanceObjective {
  description: string;
  target_date: string;
  status: "not_started" | "in_progress" | "achieved" | "not_achieved";
  evidence?: string;
}

export interface PerformanceGoal {
  id: string;
  home_id: string;
  staff_id: string;
  staff_name: string;
  goal_description: string;
  category: string;
  target_date: string;
  status: "active" | "achieved" | "overdue" | "cancelled";
  progress_notes: string[];
  linked_appraisal_id?: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ───────────────────────────────────────────────────────────────

export const APPRAISAL_TYPES: { type: string; label: string; frequency: string }[] = [
  { type: "annual", label: "Annual Appraisal", frequency: "Yearly" },
  { type: "probation_review", label: "Probation Review", frequency: "3/6 months" },
  { type: "mid_year", label: "Mid-Year Review", frequency: "6 months" },
  { type: "performance_improvement", label: "Performance Improvement Plan", frequency: "As needed" },
  { type: "return_to_work", label: "Return to Work Review", frequency: "As needed" },
];

export const RATING_SCALE: { rating: string; label: string; value: number }[] = [
  { rating: "outstanding", label: "Outstanding", value: 4 },
  { rating: "good", label: "Good", value: 3 },
  { rating: "requires_improvement", label: "Requires Improvement", value: 2 },
  { rating: "inadequate", label: "Inadequate", value: 1 },
];

export const GOAL_CATEGORIES: { category: string; label: string }[] = [
  { category: "care_practice", label: "Care Practice" },
  { category: "safeguarding", label: "Safeguarding" },
  { category: "leadership", label: "Leadership & Management" },
  { category: "professional_development", label: "Professional Development" },
  { category: "communication", label: "Communication" },
  { category: "regulatory_compliance", label: "Regulatory Compliance" },
  { category: "wellbeing", label: "Staff Wellbeing" },
  { category: "specialist_skills", label: "Specialist Skills" },
];

// ── Pure functions (no DB) ──────────────────────────────────────────────────

/**
 * Compute appraisal compliance metrics for the home.
 */
function computeAppraisalCompliance(
  appraisals: Appraisal[],
  totalStaff: number,
): {
  total_appraisals: number;
  completed: number;
  overdue: number;
  scheduled: number;
  compliance_rate: number | null;
  staff_without_appraisal: number;
  avg_rating: number | null;
  fitness_confirmed_rate: number | null;
  by_type: Record<string, number>;
} {
  const completed = appraisals.filter((a) => a.status === "completed");
  const overdue = appraisals.filter((a) => a.status === "overdue");
  const scheduled = appraisals.filter((a) => a.status === "scheduled");

  // Unique staff with completed appraisals
  const staffWithAppraisal = new Set(completed.map((a) => a.staff_id));
  const staffWithout = Math.max(0, totalStaff - staffWithAppraisal.size);

  // Average rating
  let ratingSum = 0;
  let ratingCount = 0;
  for (const a of completed) {
    const scale = RATING_SCALE.find((r) => r.rating === a.overall_rating);
    if (scale) {
      ratingSum += scale.value;
      ratingCount++;
    }
  }
  const avgRating = ratingCount > 0 ? Math.round((ratingSum / ratingCount) * 100) / 100 : 0;

  // Fitness confirmed
  const fitnessConfirmed = completed.filter((a) => a.fitness_confirmed).length;
  const fitnessRate = completed.length > 0
    ? Math.round((fitnessConfirmed / completed.length) * 100)
    : null;

  // By type
  const byType: Record<string, number> = {};
  for (const a of appraisals) {
    byType[a.appraisal_type] = (byType[a.appraisal_type] ?? 0) + 1;
  }

  // Compliance rate: % of staff with at least one completed appraisal
  const complianceRate = totalStaff > 0
    ? Math.round((staffWithAppraisal.size / totalStaff) * 100)
    : null;

  return {
    total_appraisals: appraisals.length,
    completed: completed.length,
    overdue: overdue.length,
    scheduled: scheduled.length,
    compliance_rate: complianceRate,
    staff_without_appraisal: staffWithout,
    avg_rating: avgRating,
    fitness_confirmed_rate: fitnessRate,
    by_type: byType,
  };
}

/**
 * Compute goal achievement metrics.
 */
function computeGoalProgress(goals: PerformanceGoal[]): {
  total: number;
  active: number;
  achieved: number;
  overdue: number;
  achievement_rate: number | null;
  by_category: Record<string, { total: number; achieved: number }>;
} {
  const active = goals.filter((g) => g.status === "active");
  const achieved = goals.filter((g) => g.status === "achieved");
  const overdue = goals.filter((g) => g.status === "overdue");

  const nonCancelled = goals.filter((g) => g.status !== "cancelled");
  const achievementRate = nonCancelled.length > 0
    ? Math.round((achieved.length / nonCancelled.length) * 100)
    : null;

  const byCategory: Record<string, { total: number; achieved: number }> = {};
  for (const g of goals) {
    if (!byCategory[g.category]) {
      byCategory[g.category] = { total: 0, achieved: 0 };
    }
    byCategory[g.category].total++;
    if (g.status === "achieved") byCategory[g.category].achieved++;
  }

  return {
    total: goals.length,
    active: active.length,
    achieved: achieved.length,
    overdue: overdue.length,
    achievement_rate: achievementRate,
    by_category: byCategory,
  };
}

/**
 * Identify appraisal-related alerts.
 */
function identifyAppraisalAlerts(
  appraisals: Appraisal[],
  goals: PerformanceGoal[],
  totalStaff: number,
): { type: string; severity: "critical" | "high" | "medium" | "low"; message: string }[] {
  const alerts: { type: string; severity: "critical" | "high" | "medium" | "low"; message: string }[] = [];
  const now = new Date();

  // Overdue appraisals
  const overdueAppraisals = appraisals.filter((a) => a.status === "overdue");
  if (overdueAppraisals.length > 0) {
    alerts.push({
      type: "overdue_appraisal",
      severity: "high",
      message: `${overdueAppraisals.length} staff appraisal${overdueAppraisals.length > 1 ? "s" : ""} overdue — Reg 33 requires regular appraisal of staff fitness and performance.`,
    });
  }

  // Staff without any appraisal
  const staffWithAppraisal = new Set(
    appraisals.filter((a) => a.status === "completed").map((a) => a.staff_id),
  );
  const staffWithout = totalStaff - staffWithAppraisal.size;
  if (staffWithout > 0 && totalStaff > 0) {
    alerts.push({
      type: "no_appraisal",
      severity: "medium",
      message: `${staffWithout} of ${totalStaff} staff have no completed appraisal on record.`,
    });
  }

  // Fitness not confirmed
  const completedWithoutFitness = appraisals.filter(
    (a) => a.status === "completed" && !a.fitness_confirmed,
  );
  if (completedWithoutFitness.length > 0) {
    alerts.push({
      type: "fitness_not_confirmed",
      severity: "high",
      message: `${completedWithoutFitness.length} completed appraisal${completedWithoutFitness.length > 1 ? "s" : ""} have not confirmed fitness to work with children (Reg 32).`,
    });
  }

  // Inadequate ratings
  const inadequate = appraisals.filter(
    (a) => a.status === "completed" && a.overall_rating === "inadequate",
  );
  if (inadequate.length > 0) {
    for (const a of inadequate) {
      alerts.push({
        type: "inadequate_rating",
        severity: "critical",
        message: `${a.staff_name} received an 'Inadequate' rating on ${a.appraisal_date}. Performance improvement plan required.`,
      });
    }
  }

  // Overdue performance goals
  const overdueGoals = goals.filter((g) => g.status === "overdue");
  if (overdueGoals.length > 0) {
    alerts.push({
      type: "overdue_goals",
      severity: "medium",
      message: `${overdueGoals.length} performance goal${overdueGoals.length > 1 ? "s" : ""} are overdue across staff team.`,
    });
  }

  // Upcoming appraisals (within 30 days)
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const upcoming = appraisals.filter((a) => {
    if (a.status !== "scheduled") return false;
    const appraisalDate = new Date(a.appraisal_date);
    return appraisalDate.getTime() - now.getTime() <= thirtyDaysMs && appraisalDate.getTime() >= now.getTime();
  });
  if (upcoming.length > 0) {
    alerts.push({
      type: "upcoming_appraisal",
      severity: "low",
      message: `${upcoming.length} appraisal${upcoming.length > 1 ? "s" : ""} scheduled in the next 30 days — prepare documentation.`,
    });
  }

  return alerts;
}

// ── CRUD ────────────────────────────────────────────────────────────────────

export async function listAppraisals(
  homeId: string,
  filters?: {
    staffId?: string;
    appraisalType?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  },
): Promise<ServiceResult<Appraisal[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [], persisted: false } as ServiceResult<Appraisal[]>;

  const s = sb();
  if (!s) return { ok: true, data: [], persisted: false } as ServiceResult<Appraisal[]>;

  let q = (s.from("cs_staff_appraisals") as SB).select("*").eq("home_id", homeId);
  if (filters?.staffId) q = q.eq("staff_id", filters.staffId);
  if (filters?.appraisalType) q = q.eq("appraisal_type", filters.appraisalType);
  if (filters?.status) q = q.eq("status", filters.status);
  if (filters?.dateFrom) q = q.gte("appraisal_date", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("appraisal_date", filters.dateTo);
  q = q.order("appraisal_date", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createAppraisal(
  input: Omit<Appraisal, "id" | "created_at" | "updated_at">,
): Promise<ServiceResult<Appraisal>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_staff_appraisals") as SB)
    .insert({
      home_id: input.home_id,
      staff_id: input.staff_id,
      staff_name: input.staff_name,
      appraisal_type: input.appraisal_type,
      appraisal_date: input.appraisal_date,
      appraiser: input.appraiser,
      period_from: input.period_from,
      period_to: input.period_to,
      overall_rating: input.overall_rating,
      strengths: input.strengths,
      areas_for_development: input.areas_for_development,
      objectives: input.objectives,
      training_needs: input.training_needs,
      supervision_frequency: input.supervision_frequency,
      fitness_confirmed: input.fitness_confirmed,
      next_appraisal_date: input.next_appraisal_date,
      notes: input.notes ?? null,
      status: input.status,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateAppraisal(
  id: string,
  updates: Partial<Appraisal>,
): Promise<ServiceResult<Appraisal>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_staff_appraisals") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function listPerformanceGoals(
  homeId: string,
  filters?: {
    staffId?: string;
    category?: string;
    status?: string;
    limit?: number;
  },
): Promise<ServiceResult<PerformanceGoal[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [], persisted: false } as ServiceResult<PerformanceGoal[]>;

  const s = sb();
  if (!s) return { ok: true, data: [], persisted: false } as ServiceResult<PerformanceGoal[]>;

  let q = (s.from("cs_performance_goals") as SB).select("*").eq("home_id", homeId);
  if (filters?.staffId) q = q.eq("staff_id", filters.staffId);
  if (filters?.category) q = q.eq("category", filters.category);
  if (filters?.status) q = q.eq("status", filters.status);
  q = q.order("target_date", { ascending: true }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createPerformanceGoal(
  input: Omit<PerformanceGoal, "id" | "created_at" | "updated_at">,
): Promise<ServiceResult<PerformanceGoal>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_performance_goals") as SB)
    .insert({
      home_id: input.home_id,
      staff_id: input.staff_id,
      staff_name: input.staff_name,
      goal_description: input.goal_description,
      category: input.category,
      target_date: input.target_date,
      status: input.status,
      progress_notes: input.progress_notes,
      linked_appraisal_id: input.linked_appraisal_id ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updatePerformanceGoal(
  id: string,
  updates: Partial<PerformanceGoal>,
): Promise<ServiceResult<PerformanceGoal>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_performance_goals") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ────────────────────────────────────────────────────────

export const _testing = {
  computeAppraisalCompliance,
  computeGoalProgress,
  identifyAppraisalAlerts,
};
