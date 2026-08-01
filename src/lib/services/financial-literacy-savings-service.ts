// ══════════════════════════════════════════════════════════════════════════════
// CARA — FINANCIAL LITERACY SAVINGS SERVICE
// Tracks financial education, savings accounts, budgeting skills,
// money management, and independence preparation through finance.
// CHR 2015 Reg 8(2)(a)(vi) (preparation for independence — finances),
// Reg 5(c) (promoting independence through financial capability).
//
// Covers: topic area, understanding level, engagement quality,
// saving progress, and practical application.
//
// SCCIF: Experiences — "Children learn financial skills."
// "Independence preparation includes money management."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type TopicArea =
  | "budgeting_basics"
  | "savings_accounts"
  | "spending_tracking"
  | "shopping_comparison"
  | "bills_utilities"
  | "banking_skills"
  | "benefits_entitlements"
  | "debt_awareness"
  | "earning_income"
  | "other";

export type UnderstandingLevel =
  | "confident"
  | "good_understanding"
  | "developing"
  | "limited"
  | "not_understood";

export type EngagementQuality =
  | "highly_engaged"
  | "engaged"
  | "partially_engaged"
  | "disengaged"
  | "refused";

export type SavingProgress =
  | "exceeding_target"
  | "on_target"
  | "below_target"
  | "no_savings"
  | "in_debt";

export interface FinancialLiteracySavingsRecord {
  id: string;
  home_id: string;
  topic_area: TopicArea;
  understanding_level: UnderstandingLevel;
  engagement_quality: EngagementQuality;
  saving_progress: SavingProgress;
  session_date: string;
  child_name: string;
  child_id: string | null;
  supported_by: string;
  age_appropriate: boolean;
  practical_exercise: boolean;
  real_money_used: boolean;
  savings_account_active: boolean;
  budget_created: boolean;
  targets_set: boolean;
  care_plan_reflects: boolean;
  social_worker_informed: boolean;
  parent_informed: boolean;
  pathway_plan_updated: boolean;
  resources_provided: boolean;
  recorded_promptly: boolean;
  issues_found: string[];
  actions_taken: string[];
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const TOPIC_AREAS: { area: TopicArea; label: string }[] = [
  { area: "budgeting_basics", label: "Budgeting Basics" },
  { area: "savings_accounts", label: "Savings Accounts" },
  { area: "spending_tracking", label: "Spending Tracking" },
  { area: "shopping_comparison", label: "Shopping Comparison" },
  { area: "bills_utilities", label: "Bills & Utilities" },
  { area: "banking_skills", label: "Banking Skills" },
  { area: "benefits_entitlements", label: "Benefits & Entitlements" },
  { area: "debt_awareness", label: "Debt Awareness" },
  { area: "earning_income", label: "Earning & Income" },
  { area: "other", label: "Other" },
];

export const UNDERSTANDING_LEVELS: { level: UnderstandingLevel; label: string }[] = [
  { level: "confident", label: "Confident" },
  { level: "good_understanding", label: "Good Understanding" },
  { level: "developing", label: "Developing" },
  { level: "limited", label: "Limited" },
  { level: "not_understood", label: "Not Understood" },
];

export const ENGAGEMENT_QUALITIES: { quality: EngagementQuality; label: string }[] = [
  { quality: "highly_engaged", label: "Highly Engaged" },
  { quality: "engaged", label: "Engaged" },
  { quality: "partially_engaged", label: "Partially Engaged" },
  { quality: "disengaged", label: "Disengaged" },
  { quality: "refused", label: "Refused" },
];

export const SAVING_PROGRESSES: { progress: SavingProgress; label: string }[] = [
  { progress: "exceeding_target", label: "Exceeding Target" },
  { progress: "on_target", label: "On Target" },
  { progress: "below_target", label: "Below Target" },
  { progress: "no_savings", label: "No Savings" },
  { progress: "in_debt", label: "In Debt" },
];

// ── Pure compute ────────────────────────────────────────────────────────

export function computeFinancialLiteracyMetrics(
  records: FinancialLiteracySavingsRecord[],
): {
  total_sessions: number;
  not_understood_count: number;
  disengaged_count: number;
  no_savings_count: number;
  in_debt_count: number;
  age_appropriate_rate: number | null;
  practical_exercise_rate: number | null;
  real_money_rate: number | null;
  savings_account_rate: number | null;
  budget_created_rate: number | null;
  targets_set_rate: number | null;
  care_plan_rate: number | null;
  social_worker_rate: number | null;
  parent_informed_rate: number | null;
  pathway_plan_rate: number | null;
  resources_rate: number | null;
  recorded_promptly_rate: number | null;
  unique_children: number;
  by_topic_area: Record<string, number>;
  by_understanding_level: Record<string, number>;
  by_engagement_quality: Record<string, number>;
  by_saving_progress: Record<string, number>;
} {
  const notUnderstood = records.filter((r) => r.understanding_level === "not_understood").length;
  const disengaged = records.filter((r) => r.engagement_quality === "disengaged" || r.engagement_quality === "refused").length;
  const noSavings = records.filter((r) => r.saving_progress === "no_savings").length;
  const inDebt = records.filter((r) => r.saving_progress === "in_debt").length;

  const boolRate = (field: keyof FinancialLiteracySavingsRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : null;
  };

  const byTopic: Record<string, number> = {};
  for (const r of records) byTopic[r.topic_area] = (byTopic[r.topic_area] ?? 0) + 1;

  const byUnderstanding: Record<string, number> = {};
  for (const r of records) byUnderstanding[r.understanding_level] = (byUnderstanding[r.understanding_level] ?? 0) + 1;

  const byEngagement: Record<string, number> = {};
  for (const r of records) byEngagement[r.engagement_quality] = (byEngagement[r.engagement_quality] ?? 0) + 1;

  const bySaving: Record<string, number> = {};
  for (const r of records) bySaving[r.saving_progress] = (bySaving[r.saving_progress] ?? 0) + 1;

  return {
    total_sessions: records.length,
    not_understood_count: notUnderstood,
    disengaged_count: disengaged,
    no_savings_count: noSavings,
    in_debt_count: inDebt,
    age_appropriate_rate: boolRate("age_appropriate"),
    practical_exercise_rate: boolRate("practical_exercise"),
    real_money_rate: boolRate("real_money_used"),
    savings_account_rate: boolRate("savings_account_active"),
    budget_created_rate: boolRate("budget_created"),
    targets_set_rate: boolRate("targets_set"),
    care_plan_rate: boolRate("care_plan_reflects"),
    social_worker_rate: boolRate("social_worker_informed"),
    parent_informed_rate: boolRate("parent_informed"),
    pathway_plan_rate: boolRate("pathway_plan_updated"),
    resources_rate: boolRate("resources_provided"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    unique_children: new Set(records.map((r) => r.child_name)).size,
    by_topic_area: byTopic,
    by_understanding_level: byUnderstanding,
    by_engagement_quality: byEngagement,
    by_saving_progress: bySaving,
  };
}

export function identifyFinancialLiteracyAlerts(
  records: FinancialLiteracySavingsRecord[],
): {
  type: string;
  severity: "critical" | "high" | "medium";
  message: string;
  id: string;
}[] {
  const alerts: {
    type: string;
    severity: "critical" | "high" | "medium";
    message: string;
    id: string;
  }[] = [];

  // In debt and not understood — per-record critical
  for (const r of records) {
    if (r.saving_progress === "in_debt" && r.understanding_level === "not_understood") {
      alerts.push({
        type: "in_debt_not_understood",
        severity: "critical",
        message: `${r.child_name} in debt with no understanding of ${r.topic_area.replace(/_/g, " ")} — urgent financial support needed`,
        id: r.id,
      });
    }
  }

  // No savings account
  const noAccount = records.filter((r) => !r.savings_account_active).length;
  if (noAccount >= 1) {
    alerts.push({
      type: "no_savings_account",
      severity: "high",
      message: `${noAccount} ${noAccount === 1 ? "session has" : "sessions have"} no active savings account — all children should have savings`,
      id: "no_savings_account",
    });
  }

  // No pathway plan
  const noPathway = records.filter((r) => !r.pathway_plan_updated).length;
  if (noPathway >= 1) {
    alerts.push({
      type: "no_pathway_plan",
      severity: "high",
      message: `${noPathway} ${noPathway === 1 ? "session has" : "sessions have"} pathway plan not updated — financial skills must inform transition`,
      id: "no_pathway_plan",
    });
  }

  // No practical exercise
  const noPractical = records.filter((r) => !r.practical_exercise).length;
  if (noPractical >= 2) {
    alerts.push({
      type: "no_practical_exercise",
      severity: "medium",
      message: `${noPractical} sessions without practical exercise — hands-on learning essential`,
      id: "no_practical_exercise",
    });
  }

  // No budget created
  const noBudget = records.filter((r) => !r.budget_created).length;
  if (noBudget >= 2) {
    alerts.push({
      type: "no_budget_created",
      severity: "medium",
      message: `${noBudget} sessions without budget created — budgeting is foundational`,
      id: "no_budget_created",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    topicArea?: TopicArea;
    understandingLevel?: UnderstandingLevel;
    engagementQuality?: EngagementQuality;
    savingProgress?: SavingProgress;
    limit?: number;
  },
): Promise<ServiceResult<FinancialLiteracySavingsRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };
  const client = sb()!;
  let q = (client.from("cs_financial_literacy_savings") as SB).select("*").eq("home_id", homeId);
  if (filters?.topicArea) q = q.eq("topic_area", filters.topicArea);
  if (filters?.understandingLevel) q = q.eq("understanding_level", filters.understandingLevel);
  if (filters?.engagementQuality) q = q.eq("engagement_quality", filters.engagementQuality);
  if (filters?.savingProgress) q = q.eq("saving_progress", filters.savingProgress);
  q = q.order("session_date", { ascending: false });
  if (filters?.limit) q = q.limit(filters.limit);
  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as FinancialLiteracySavingsRecord[] };
}

export async function createRecord(payload: {
  homeId: string;
  topicArea: TopicArea;
  understandingLevel: UnderstandingLevel;
  engagementQuality: EngagementQuality;
  savingProgress: SavingProgress;
  sessionDate: string;
  childName: string;
  childId?: string | null;
  supportedBy: string;
  ageAppropriate?: boolean;
  practicalExercise?: boolean;
  realMoneyUsed?: boolean;
  savingsAccountActive?: boolean;
  budgetCreated?: boolean;
  targetsSet?: boolean;
  carePlanReflects?: boolean;
  socialWorkerInformed?: boolean;
  parentInformed?: boolean;
  pathwayPlanUpdated?: boolean;
  resourcesProvided?: boolean;
  recordedPromptly?: boolean;
  issuesFound?: string[];
  actionsTaken?: string[];
  nextReviewDate?: string | null;
  notes?: string | null;
}): Promise<ServiceResult<FinancialLiteracySavingsRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };
  const client = sb()!;
  const { data, error } = await (client.from("cs_financial_literacy_savings") as SB)
    .insert({
      home_id: payload.homeId, topic_area: payload.topicArea, understanding_level: payload.understandingLevel,
      engagement_quality: payload.engagementQuality, saving_progress: payload.savingProgress,
      session_date: payload.sessionDate, child_name: payload.childName, child_id: payload.childId ?? null,
      supported_by: payload.supportedBy, age_appropriate: payload.ageAppropriate ?? true,
      practical_exercise: payload.practicalExercise ?? true, real_money_used: payload.realMoneyUsed ?? true,
      savings_account_active: payload.savingsAccountActive ?? true, budget_created: payload.budgetCreated ?? true,
      targets_set: payload.targetsSet ?? true, care_plan_reflects: payload.carePlanReflects ?? true,
      social_worker_informed: payload.socialWorkerInformed ?? true, parent_informed: payload.parentInformed ?? true,
      pathway_plan_updated: payload.pathwayPlanUpdated ?? true, resources_provided: payload.resourcesProvided ?? true,
      recorded_promptly: payload.recordedPromptly ?? true, issues_found: payload.issuesFound ?? [],
      actions_taken: payload.actionsTaken ?? [], next_review_date: payload.nextReviewDate ?? null, notes: payload.notes ?? null,
    }).select().single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as FinancialLiteracySavingsRecord };
}

export async function updateRecord(
  id: string,
  updates: Partial<{
    topicArea: TopicArea; understandingLevel: UnderstandingLevel; engagementQuality: EngagementQuality;
    savingProgress: SavingProgress; sessionDate: string; childName: string; childId: string | null;
    supportedBy: string; ageAppropriate: boolean; practicalExercise: boolean; realMoneyUsed: boolean;
    savingsAccountActive: boolean; budgetCreated: boolean; targetsSet: boolean; carePlanReflects: boolean;
    socialWorkerInformed: boolean; parentInformed: boolean; pathwayPlanUpdated: boolean;
    resourcesProvided: boolean; recordedPromptly: boolean; issuesFound: string[]; actionsTaken: string[];
    nextReviewDate: string | null; notes: string | null;
  }>,
): Promise<ServiceResult<FinancialLiteracySavingsRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };
  const client = sb()!;
  const mapped: Record<string, unknown> = {};
  if (updates.topicArea !== undefined) mapped.topic_area = updates.topicArea;
  if (updates.understandingLevel !== undefined) mapped.understanding_level = updates.understandingLevel;
  if (updates.engagementQuality !== undefined) mapped.engagement_quality = updates.engagementQuality;
  if (updates.savingProgress !== undefined) mapped.saving_progress = updates.savingProgress;
  if (updates.sessionDate !== undefined) mapped.session_date = updates.sessionDate;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.childId !== undefined) mapped.child_id = updates.childId;
  if (updates.supportedBy !== undefined) mapped.supported_by = updates.supportedBy;
  if (updates.ageAppropriate !== undefined) mapped.age_appropriate = updates.ageAppropriate;
  if (updates.practicalExercise !== undefined) mapped.practical_exercise = updates.practicalExercise;
  if (updates.realMoneyUsed !== undefined) mapped.real_money_used = updates.realMoneyUsed;
  if (updates.savingsAccountActive !== undefined) mapped.savings_account_active = updates.savingsAccountActive;
  if (updates.budgetCreated !== undefined) mapped.budget_created = updates.budgetCreated;
  if (updates.targetsSet !== undefined) mapped.targets_set = updates.targetsSet;
  if (updates.carePlanReflects !== undefined) mapped.care_plan_reflects = updates.carePlanReflects;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.parentInformed !== undefined) mapped.parent_informed = updates.parentInformed;
  if (updates.pathwayPlanUpdated !== undefined) mapped.pathway_plan_updated = updates.pathwayPlanUpdated;
  if (updates.resourcesProvided !== undefined) mapped.resources_provided = updates.resourcesProvided;
  if (updates.recordedPromptly !== undefined) mapped.recorded_promptly = updates.recordedPromptly;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;
  mapped.updated_at = new Date().toISOString();
  const { data, error } = await (client.from("cs_financial_literacy_savings") as SB)
    .update(mapped).eq("id", id).select().single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as FinancialLiteracySavingsRecord };
}

export const _testing = { computeFinancialLiteracyMetrics, identifyFinancialLiteracyAlerts };
