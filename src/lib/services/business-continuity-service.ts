// ══════════════════════════════════════════════════════════════════════════════
// CARA — BUSINESS CONTINUITY SERVICE
// Manages business continuity planning, emergency preparedness, disaster
// recovery, plan testing, and resilience metrics.
// CHR 2015 Reg 29 (business continuity), Reg 12 (protection from harm
// during disruptions). SCCIF Leadership & Management.
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

export type PlanType =
  | "full_bcp"
  | "fire_evacuation"
  | "flood"
  | "power_outage"
  | "staff_shortage"
  | "pandemic"
  | "it_failure"
  | "building_damage"
  | "supply_chain"
  | "safeguarding_crisis";

export type PlanStatus = "draft" | "active" | "under_review" | "archived" | "expired";

export type TestType =
  | "tabletop_exercise"
  | "full_drill"
  | "partial_drill"
  | "walkthrough"
  | "notification_test";

export type TestOutcome = "passed" | "partial_pass" | "failed" | "cancelled";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface BusinessContinuityPlan {
  id: string;
  home_id: string;
  plan_type: PlanType;
  title: string;
  description: string;
  version: number;
  risk_level: RiskLevel;
  owner: string;
  approved_by: string | null;
  approval_date: string | null;
  effective_date: string;
  review_date: string;
  last_reviewed_date: string | null;
  status: PlanStatus;
  key_contacts: Record<string, unknown>[];
  critical_functions: Record<string, unknown>[];
  recovery_time_objective_hours: number | null;
  recovery_procedures: string;
  communication_plan: string | null;
  resource_requirements: string | null;
  dependencies: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BusinessContinuityTest {
  id: string;
  home_id: string;
  plan_id: string;
  test_date: string;
  test_type: TestType;
  conducted_by: string;
  participants: string[];
  scenario: string;
  outcome: TestOutcome;
  findings: string;
  actions_required: { action: string; assigned_to: string; due_date: string; completed: boolean }[];
  lessons_learned: string | null;
  next_test_date: string | null;
  notes: string | null;
  created_at: string;
}

// ── Constants ───────────────────────────────────────────────────────────────

export const PLAN_TYPES: { key: string; label: string }[] = [
  { key: "full_bcp", label: "Full Business Continuity Plan" },
  { key: "fire_evacuation", label: "Fire & Evacuation" },
  { key: "flood", label: "Flood / Water Damage" },
  { key: "power_outage", label: "Power Outage" },
  { key: "staff_shortage", label: "Staff Shortage / Staffing Crisis" },
  { key: "pandemic", label: "Pandemic / Infectious Disease" },
  { key: "it_failure", label: "IT Failure / Data Loss" },
  { key: "building_damage", label: "Building Damage / Structural" },
  { key: "supply_chain", label: "Supply Chain Disruption" },
  { key: "safeguarding_crisis", label: "Safeguarding Crisis" },
];

export const PLAN_STATUSES: { key: string; label: string }[] = [
  { key: "draft", label: "Draft" },
  { key: "active", label: "Active" },
  { key: "under_review", label: "Under Review" },
  { key: "archived", label: "Archived" },
  { key: "expired", label: "Expired" },
];

export const TEST_TYPES: { key: string; label: string }[] = [
  { key: "tabletop_exercise", label: "Tabletop Exercise" },
  { key: "full_drill", label: "Full Drill" },
  { key: "partial_drill", label: "Partial Drill" },
  { key: "walkthrough", label: "Walkthrough" },
  { key: "notification_test", label: "Notification Test" },
];

export const TEST_OUTCOMES: { key: string; label: string }[] = [
  { key: "passed", label: "Passed" },
  { key: "partial_pass", label: "Partial Pass" },
  { key: "failed", label: "Failed" },
  { key: "cancelled", label: "Cancelled" },
];

export const RISK_LEVELS: { key: string; label: string }[] = [
  { key: "low", label: "Low" },
  { key: "medium", label: "Medium" },
  { key: "high", label: "High" },
  { key: "critical", label: "Critical" },
];

// ── Pure functions (no DB) ──────────────────────────────────────────────────

/**
 * Compute business continuity metrics from plans and tests.
 */
function computeBusinessContinuityMetrics(
  plans: BusinessContinuityPlan[],
  tests: BusinessContinuityTest[],
): {
  active_plans: number;
  expired_plans: number;
  plans_due_review: number;
  tests_this_year: number;
  by_plan_type: Record<string, number>;
  by_test_outcome: Record<string, number>;
  avg_recovery_time_hours: number | null;
  plans_without_test: number;
  critical_plans_count: number;
} {
  const now = new Date();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const yearStart = new Date(now.getFullYear(), 0, 1).toISOString();

  // Active / expired plans
  const activePlans = plans.filter((p) => p.status === "active").length;
  const expiredPlans = plans.filter(
    (p) => p.status === "active" && new Date(p.review_date).getTime() < now.getTime(),
  ).length;

  // Plans due for review within 30 days
  const plansDueReview = plans.filter(
    (p) =>
      p.status === "active" &&
      new Date(p.review_date).getTime() >= now.getTime() &&
      new Date(p.review_date).getTime() - now.getTime() <= thirtyDaysMs,
  ).length;

  // Tests this year
  const testsThisYear = tests.filter((t) => t.test_date >= yearStart).length;

  // By plan type
  const byPlanType: Record<string, number> = {};
  for (const p of plans) {
    byPlanType[p.plan_type] = (byPlanType[p.plan_type] ?? 0) + 1;
  }

  // By test outcome
  const byTestOutcome: Record<string, number> = {};
  for (const t of tests) {
    byTestOutcome[t.outcome] = (byTestOutcome[t.outcome] ?? 0) + 1;
  }

  // Average recovery time (of plans that have an RTO)
  const plansWithRto = plans.filter((p) => p.recovery_time_objective_hours != null);
  let totalRto = 0;
  for (const p of plansWithRto) totalRto += p.recovery_time_objective_hours!;
  const avgRecoveryTime = plansWithRto.length > 0 ? Math.round(totalRto / plansWithRto.length) : null;

  // Plans without any test
  const testedPlanIds = new Set(tests.map((t) => t.plan_id));
  const plansWithoutTest = plans.filter(
    (p) => p.status === "active" && !testedPlanIds.has(p.id),
  ).length;

  // Critical plans count
  const criticalPlansCount = plans.filter((p) => p.risk_level === "critical").length;

  return {
    active_plans: activePlans,
    expired_plans: expiredPlans,
    plans_due_review: plansDueReview,
    tests_this_year: testsThisYear,
    by_plan_type: byPlanType,
    by_test_outcome: byTestOutcome,
    avg_recovery_time_hours: avgRecoveryTime,
    plans_without_test: plansWithoutTest,
    critical_plans_count: criticalPlansCount,
  };
}

/**
 * Identify business continuity alerts.
 */
function identifyBusinessContinuityAlerts(
  plans: BusinessContinuityPlan[],
  tests: BusinessContinuityTest[],
): { type: string; severity: "critical" | "high" | "medium" | "low"; message: string }[] {
  const alerts: { type: string; severity: "critical" | "high" | "medium" | "low"; message: string }[] = [];
  const now = new Date();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const sixtyDaysMs = 60 * 24 * 60 * 60 * 1000;
  const twelveMonthsMs = 365 * 24 * 60 * 60 * 1000;

  for (const plan of plans) {
    // plan_expired: status=active but review_date past
    if (plan.status === "active" && new Date(plan.review_date).getTime() < now.getTime()) {
      alerts.push({
        type: "plan_expired",
        severity: "critical",
        message: `Plan "${plan.title}" has passed its review date (${plan.review_date}). Immediate review required under Reg 29.`,
      });
    }

    // plan_due_review: active, review_date within 30 days
    if (
      plan.status === "active" &&
      new Date(plan.review_date).getTime() >= now.getTime() &&
      new Date(plan.review_date).getTime() - now.getTime() <= thirtyDaysMs
    ) {
      alerts.push({
        type: "plan_due_review",
        severity: "high",
        message: `Plan "${plan.title}" is due for review within 30 days (${plan.review_date}).`,
      });
    }

    // no_test_conducted: active plan with no test in past 12 months
    if (plan.status === "active") {
      const planTests = tests.filter((t) => t.plan_id === plan.id);
      const recentTest = planTests.find(
        (t) => now.getTime() - new Date(t.test_date).getTime() <= twelveMonthsMs,
      );
      if (!recentTest) {
        alerts.push({
          type: "no_test_conducted",
          severity: "high",
          message: `Plan "${plan.title}" has not been tested in the past 12 months. Regular testing is required.`,
        });
      }
    }

    // test_failed: most recent test for plan = failed
    if (plan.status === "active") {
      const planTests = tests
        .filter((t) => t.plan_id === plan.id)
        .sort((a, b) => new Date(b.test_date).getTime() - new Date(a.test_date).getTime());
      if (planTests.length > 0 && planTests[0].outcome === "failed") {
        alerts.push({
          type: "test_failed",
          severity: "high",
          message: `Most recent test for "${plan.title}" failed on ${planTests[0].test_date}. Remedial action required.`,
        });
      }
    }

    // critical_plan_no_approval: risk_level=critical && no approved_by
    if (plan.risk_level === "critical" && !plan.approved_by) {
      alerts.push({
        type: "critical_plan_no_approval",
        severity: "critical",
        message: `Critical plan "${plan.title}" has not been approved. All critical plans must have formal approval.`,
      });
    }

    // draft_plan_stale: draft status for over 60 days
    if (
      plan.status === "draft" &&
      now.getTime() - new Date(plan.created_at).getTime() > sixtyDaysMs
    ) {
      alerts.push({
        type: "draft_plan_stale",
        severity: "medium",
        message: `Plan "${plan.title}" has been in draft for over 60 days. Review and progress or archive.`,
      });
    }

    // no_communication_plan: active plan without communication_plan
    if (plan.status === "active" && !plan.communication_plan) {
      alerts.push({
        type: "no_communication_plan",
        severity: "medium",
        message: `Active plan "${plan.title}" has no communication plan. This is needed for effective emergency response.`,
      });
    }

    // plan_not_tested_after_update: plan updated_at > latest test date
    if (plan.status === "active") {
      const planTests = tests
        .filter((t) => t.plan_id === plan.id)
        .sort((a, b) => new Date(b.test_date).getTime() - new Date(a.test_date).getTime());
      if (
        planTests.length > 0 &&
        new Date(plan.updated_at).getTime() > new Date(planTests[0].test_date).getTime()
      ) {
        alerts.push({
          type: "plan_not_tested_after_update",
          severity: "medium",
          message: `Plan "${plan.title}" was updated after its last test. Re-test recommended to validate changes.`,
        });
      }
    }
  }

  return alerts;
}

// ── CRUD — Business Continuity Plans ────────────────────────────────────────

export async function listPlans(
  homeId: string,
  filters?: {
    status?: string;
    planType?: string;
    riskLevel?: string;
    limit?: number;
  },
): Promise<ServiceResult<BusinessContinuityPlan[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_business_continuity_plans") as SB).select("*").eq("home_id", homeId);
  if (filters?.status) q = q.eq("status", filters.status as never);
  if (filters?.planType) q = q.eq("plan_type", filters.planType as never);
  if (filters?.riskLevel) q = q.eq("risk_level", filters.riskLevel as never);
  q = q.order("review_date", { ascending: true }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createPlan(
  input: {
    homeId: string;
    planType: PlanType;
    title: string;
    description: string;
    version?: number;
    riskLevel: RiskLevel;
    owner: string;
    approvedBy?: string | null;
    approvalDate?: string | null;
    effectiveDate: string;
    reviewDate: string;
    lastReviewedDate?: string | null;
    status?: PlanStatus;
    keyContacts?: Record<string, unknown>[];
    criticalFunctions?: Record<string, unknown>[];
    recoveryTimeObjectiveHours?: number | null;
    recoveryProcedures: string;
    communicationPlan?: string | null;
    resourceRequirements?: string | null;
    dependencies?: string | null;
    notes?: string | null;
  },
): Promise<ServiceResult<BusinessContinuityPlan>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_business_continuity_plans") as SB)
    .insert({
      home_id: input.homeId,
      plan_type: input.planType,
      title: input.title,
      description: input.description,
      version: input.version ?? 1,
      risk_level: input.riskLevel,
      owner: input.owner,
      approved_by: input.approvedBy ?? null,
      approval_date: input.approvalDate ?? null,
      effective_date: input.effectiveDate,
      review_date: input.reviewDate,
      last_reviewed_date: input.lastReviewedDate ?? null,
      status: input.status ?? "draft",
      key_contacts: input.keyContacts ?? [],
      critical_functions: input.criticalFunctions ?? [],
      recovery_time_objective_hours: input.recoveryTimeObjectiveHours ?? null,
      recovery_procedures: input.recoveryProcedures,
      communication_plan: input.communicationPlan ?? null,
      resource_requirements: input.resourceRequirements ?? null,
      dependencies: input.dependencies ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updatePlan(
  id: string,
  updates: Partial<BusinessContinuityPlan>,
): Promise<ServiceResult<BusinessContinuityPlan>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_business_continuity_plans") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── CRUD — Business Continuity Tests ────────────────────────────────────────

export async function listTests(
  homeId: string,
  filters?: {
    planId?: string;
    testType?: string;
    outcome?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  },
): Promise<ServiceResult<BusinessContinuityTest[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_business_continuity_tests") as SB).select("*").eq("home_id", homeId);
  if (filters?.planId) q = q.eq("plan_id", filters.planId as never);
  if (filters?.testType) q = q.eq("test_type", filters.testType as never);
  if (filters?.outcome) q = q.eq("outcome", filters.outcome as never);
  if (filters?.dateFrom) q = q.gte("test_date", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("test_date", filters.dateTo);
  q = q.order("test_date", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createTest(
  input: {
    homeId: string;
    planId: string;
    testDate: string;
    testType: TestType;
    conductedBy: string;
    participants?: string[];
    scenario: string;
    outcome: TestOutcome;
    findings: string;
    actionsRequired?: { action: string; assigned_to: string; due_date: string; completed: boolean }[];
    lessonsLearned?: string | null;
    nextTestDate?: string | null;
    notes?: string | null;
  },
): Promise<ServiceResult<BusinessContinuityTest>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_business_continuity_tests") as SB)
    .insert({
      home_id: input.homeId,
      plan_id: input.planId,
      test_date: input.testDate,
      test_type: input.testType,
      conducted_by: input.conductedBy,
      participants: input.participants ?? [],
      scenario: input.scenario,
      outcome: input.outcome,
      findings: input.findings,
      actions_required: input.actionsRequired ?? [],
      lessons_learned: input.lessonsLearned ?? null,
      next_test_date: input.nextTestDate ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ────────────────────────────────────────────────────────

export const _testing = {
  computeBusinessContinuityMetrics,
  identifyBusinessContinuityAlerts,
};
