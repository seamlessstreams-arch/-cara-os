// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — SANCTIONS, REWARDS & CONSEQUENCE FRAMEWORK SERVICE
// Manages sanction records and reward records under CHR 2015 Reg 19 (behaviour
// management), with cross-references to Reg 20 (restraint) and Reg 35
// (behaviour management standards). Tracks proportionality, age-appropriateness,
// manager review, and prohibited sanctions. Supports SCCIF Experiences &
// Progress and Helped & Protected judgement areas.
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

export interface SanctionRecord {
  id: string;
  home_id: string;
  child_id: string;
  child_name: string;
  sanction_type:
    | "verbal_reminder"
    | "time_out"
    | "loss_of_privilege"
    | "reparation"
    | "restorative_conversation"
    | "natural_consequence"
    | "additional_chore"
    | "early_bedtime";
  reason: string;
  description: string;
  incident_date: string;
  incident_time: string;
  duration_minutes: number;
  privilege_removed?: string | null;
  proportionate: boolean;
  age_appropriate: boolean;
  consistent_with_plan: boolean;
  child_informed: boolean;
  child_response: string;
  imposed_by: string;
  witnessed_by?: string | null;
  manager_reviewed: boolean;
  manager_reviewed_by?: string | null;
  manager_review_date?: string | null;
  status: "active" | "completed" | "overturned" | "under_review";
  created_at: string;
}

export interface RewardRecord {
  id: string;
  home_id: string;
  child_id: string;
  child_name: string;
  reward_type:
    | "verbal_praise"
    | "sticker_chart"
    | "extra_privilege"
    | "special_activity"
    | "treat"
    | "certificate"
    | "pocket_money_bonus"
    | "outing";
  reason: string;
  description: string;
  award_date: string;
  awarded_by: string;
  linked_to_target: boolean;
  target_description?: string | null;
  child_response?: string | null;
  created_at: string;
}

// ── Constants ───────────────────────────────────────────────────────────────

export const SANCTION_TYPES: { type: string; label: string }[] = [
  { type: "verbal_reminder", label: "Verbal Reminder" },
  { type: "time_out", label: "Time Out" },
  { type: "loss_of_privilege", label: "Loss of Privilege" },
  { type: "reparation", label: "Reparation" },
  { type: "restorative_conversation", label: "Restorative Conversation" },
  { type: "natural_consequence", label: "Natural Consequence" },
  { type: "additional_chore", label: "Additional Chore" },
  { type: "early_bedtime", label: "Early Bedtime" },
];

export const REWARD_TYPES: { type: string; label: string }[] = [
  { type: "verbal_praise", label: "Verbal Praise" },
  { type: "sticker_chart", label: "Sticker Chart" },
  { type: "extra_privilege", label: "Extra Privilege" },
  { type: "special_activity", label: "Special Activity" },
  { type: "treat", label: "Treat" },
  { type: "certificate", label: "Certificate" },
  { type: "pocket_money_bonus", label: "Pocket Money Bonus" },
  { type: "outing", label: "Outing" },
];

export const SANCTION_STATUS: { status: string; label: string }[] = [
  { status: "active", label: "Active" },
  { status: "completed", label: "Completed" },
  { status: "overturned", label: "Overturned" },
  { status: "under_review", label: "Under Review" },
];

/**
 * Sanctions that are NEVER permitted in a children's home.
 * Referenced in training, compliance checks, and SCCIF evidence.
 * Reg 19(3) — no measure of control used which is not permitted.
 */
export const PROHIBITED_SANCTIONS: { sanction: string; label: string; regulation: string }[] = [
  { sanction: "corporal_punishment", label: "Corporal Punishment", regulation: "Reg 19(3)(a)" },
  { sanction: "food_deprivation", label: "Deprivation of Food or Drink", regulation: "Reg 19(3)(b)" },
  { sanction: "restriction_of_contact", label: "Restriction of Contact with Family/Social Worker", regulation: "Reg 19(3)(c)" },
  { sanction: "humiliation", label: "Humiliation or Degrading Treatment", regulation: "Reg 19(3)(d)" },
  { sanction: "medication_as_control", label: "Use of Medication as Control", regulation: "Reg 19(3)(e)" },
  { sanction: "financial_penalty", label: "Financial Penalty or Fine", regulation: "Reg 19(3)(f)" },
  { sanction: "group_punishment", label: "Group Punishment", regulation: "Reg 19(3)(g)" },
  { sanction: "deprivation_of_sleep", label: "Deprivation of Sleep", regulation: "Reg 19(3)(h)" },
];

// ── Pure functions (no DB) ──────────────────────────────────────────────────

/**
 * Compute summary metrics across sanctions and rewards.
 * Reward-to-sanction ratio should ideally be > 1.0 (more rewards than sanctions).
 */
export function computeSanctionRewardMetrics(
  sanctions: SanctionRecord[],
  rewards: RewardRecord[],
): {
  total_sanctions: number;
  total_rewards: number;
  reward_to_sanction_ratio: number;
  sanctions_by_type: Record<string, number>;
  rewards_by_type: Record<string, number>;
  proportionality_rate: number;
  age_appropriate_rate: number;
  consistent_with_plan_rate: number;
  manager_review_rate: number;
  children_with_highest_sanctions: { child_id: string; child_name: string; count: number }[];
  children_with_highest_rewards: { child_id: string; child_name: string; count: number }[];
  overturned_count: number;
  active_sanctions: number;
} {
  const totalSanctions = sanctions.length;
  const totalRewards = rewards.length;

  // Reward-to-sanction ratio (higher is better)
  const rewardToSanctionRatio =
    totalSanctions > 0
      ? Math.round((totalRewards / totalSanctions) * 100) / 100
      : totalRewards > 0
        ? totalRewards
        : 0;

  // Sanctions by type
  const sanctionsByType: Record<string, number> = {};
  for (const s of sanctions) {
    sanctionsByType[s.sanction_type] = (sanctionsByType[s.sanction_type] ?? 0) + 1;
  }

  // Rewards by type
  const rewardsByType: Record<string, number> = {};
  for (const r of rewards) {
    rewardsByType[r.reward_type] = (rewardsByType[r.reward_type] ?? 0) + 1;
  }

  // Proportionality rate
  let proportionateCount = 0;
  let ageAppropriateCount = 0;
  let consistentWithPlanCount = 0;
  let managerReviewedCount = 0;
  let overturnedCount = 0;
  let activeCount = 0;

  for (const s of sanctions) {
    if (s.proportionate) proportionateCount++;
    if (s.age_appropriate) ageAppropriateCount++;
    if (s.consistent_with_plan) consistentWithPlanCount++;
    if (s.manager_reviewed) managerReviewedCount++;
    if (s.status === "overturned") overturnedCount++;
    if (s.status === "active") activeCount++;
  }

  const proportionalityRate =
    totalSanctions > 0
      ? Math.round((proportionateCount / totalSanctions) * 1000) / 10
      : 0;

  const ageAppropriateRate =
    totalSanctions > 0
      ? Math.round((ageAppropriateCount / totalSanctions) * 1000) / 10
      : 0;

  const consistentWithPlanRate =
    totalSanctions > 0
      ? Math.round((consistentWithPlanCount / totalSanctions) * 1000) / 10
      : 0;

  const managerReviewRate =
    totalSanctions > 0
      ? Math.round((managerReviewedCount / totalSanctions) * 1000) / 10
      : 0;

  // Children with highest sanctions (sorted desc)
  const childSanctionCounts: Record<string, { child_name: string; count: number }> = {};
  for (const s of sanctions) {
    if (!childSanctionCounts[s.child_id]) {
      childSanctionCounts[s.child_id] = { child_name: s.child_name, count: 0 };
    }
    childSanctionCounts[s.child_id].count++;
  }
  const childrenWithHighestSanctions = Object.entries(childSanctionCounts)
    .map(([child_id, { child_name, count }]) => ({ child_id, child_name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Children with highest rewards (sorted desc)
  const childRewardCounts: Record<string, { child_name: string; count: number }> = {};
  for (const r of rewards) {
    if (!childRewardCounts[r.child_id]) {
      childRewardCounts[r.child_id] = { child_name: r.child_name, count: 0 };
    }
    childRewardCounts[r.child_id].count++;
  }
  const childrenWithHighestRewards = Object.entries(childRewardCounts)
    .map(([child_id, { child_name, count }]) => ({ child_id, child_name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    total_sanctions: totalSanctions,
    total_rewards: totalRewards,
    reward_to_sanction_ratio: rewardToSanctionRatio,
    sanctions_by_type: sanctionsByType,
    rewards_by_type: rewardsByType,
    proportionality_rate: proportionalityRate,
    age_appropriate_rate: ageAppropriateRate,
    consistent_with_plan_rate: consistentWithPlanRate,
    manager_review_rate: managerReviewRate,
    children_with_highest_sanctions: childrenWithHighestSanctions,
    children_with_highest_rewards: childrenWithHighestRewards,
    overturned_count: overturnedCount,
    active_sanctions: activeCount,
  };
}

/**
 * Identify behaviour management alerts requiring attention.
 * Returns alerts sorted by severity (critical first).
 */
export function identifyBehaviourManagementAlerts(
  sanctions: SanctionRecord[],
  rewards: RewardRecord[],
): {
  type: string;
  severity: "critical" | "high" | "medium" | "low";
  message: string;
  child_id?: string;
  sanction_id?: string;
}[] {
  const alerts: {
    type: string;
    severity: "critical" | "high" | "medium" | "low";
    message: string;
    child_id?: string;
    sanction_id?: string;
  }[] = [];

  const prohibitedTypeValues = PROHIBITED_SANCTIONS.map((p) => p.sanction);
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const now = new Date();

  // ── Unreviewed sanctions ──────────────────────────────────────────────
  for (const s of sanctions) {
    if (!s.manager_reviewed && s.status !== "overturned") {
      alerts.push({
        type: "unreviewed_sanction",
        severity: "medium",
        message: `Sanction for ${s.child_name} on ${s.incident_date} (${s.sanction_type}) has not been reviewed by a manager`,
        child_id: s.child_id,
        sanction_id: s.id,
      });
    }
  }

  // ── Disproportionate sanctions ────────────────────────────────────────
  for (const s of sanctions) {
    if (!s.proportionate) {
      alerts.push({
        type: "disproportionate_sanction",
        severity: "high",
        message: `Sanction for ${s.child_name} on ${s.incident_date} marked as NOT proportionate — requires immediate review (Reg 19)`,
        child_id: s.child_id,
        sanction_id: s.id,
      });
    }
  }

  // ── Not age-appropriate ───────────────────────────────────────────────
  for (const s of sanctions) {
    if (!s.age_appropriate) {
      alerts.push({
        type: "not_age_appropriate",
        severity: "high",
        message: `Sanction for ${s.child_name} on ${s.incident_date} marked as NOT age-appropriate — requires review`,
        child_id: s.child_id,
        sanction_id: s.id,
      });
    }
  }

  // ── Not consistent with behaviour support plan ────────────────────────
  for (const s of sanctions) {
    if (!s.consistent_with_plan) {
      alerts.push({
        type: "inconsistent_with_plan",
        severity: "high",
        message: `Sanction for ${s.child_name} on ${s.incident_date} is NOT consistent with their behaviour support plan (Reg 19/Reg 35)`,
        child_id: s.child_id,
        sanction_id: s.id,
      });
    }
  }

  // ── Child not informed ────────────────────────────────────────────────
  for (const s of sanctions) {
    if (!s.child_informed) {
      alerts.push({
        type: "child_not_informed",
        severity: "medium",
        message: `Child ${s.child_name} was not informed about sanction on ${s.incident_date} — children must understand consequences`,
        child_id: s.child_id,
        sanction_id: s.id,
      });
    }
  }

  // ── High sanction count for individual child (5+ in last 30 days) ─────
  const childIds = [...new Set(sanctions.map((s) => s.child_id))];
  for (const childId of childIds) {
    const childSanctions = sanctions.filter((s) => s.child_id === childId);
    const recentSanctions = childSanctions.filter((s) => {
      const sanctionDate = new Date(s.incident_date).getTime();
      return now.getTime() - sanctionDate <= thirtyDaysMs;
    });

    if (recentSanctions.length >= 5) {
      const childName = recentSanctions[0].child_name;
      alerts.push({
        type: "high_sanction_count",
        severity: "high",
        message: `${childName} has ${recentSanctions.length} sanctions in the last 30 days — review behaviour support plan and consider alternative approaches`,
        child_id: childId,
      });
    }
  }

  // ── Low reward-to-sanction ratio per child (< 1.0 in last 30 days) ────
  const allChildIds = [...new Set([
    ...sanctions.map((s) => s.child_id),
    ...rewards.map((r) => r.child_id),
  ])];

  for (const childId of allChildIds) {
    const recentChildSanctions = sanctions.filter((s) => {
      if (s.child_id !== childId) return false;
      const d = new Date(s.incident_date).getTime();
      return now.getTime() - d <= thirtyDaysMs;
    });
    const recentChildRewards = rewards.filter((r) => {
      if (r.child_id !== childId) return false;
      const d = new Date(r.award_date).getTime();
      return now.getTime() - d <= thirtyDaysMs;
    });

    const sanctionCount = recentChildSanctions.length;
    const rewardCount = recentChildRewards.length;

    if (sanctionCount > 0 && rewardCount < sanctionCount) {
      // Find the child name from whichever list has data
      const childName =
        recentChildSanctions[0]?.child_name ??
        recentChildRewards[0]?.child_name ??
        "Unknown";
      alerts.push({
        type: "low_reward_to_sanction_ratio",
        severity: "medium",
        message: `${childName} has ${rewardCount} rewards vs ${sanctionCount} sanctions in the last 30 days — consider increasing positive reinforcement`,
        child_id: childId,
      });
    }
  }

  // ── Prohibited sanctions detected ─────────────────────────────────────
  // Check if any sanction type text matches prohibited list (defensive check
  // against data entry errors or imports from legacy systems)
  for (const s of sanctions) {
    if (prohibitedTypeValues.includes(s.sanction_type)) {
      const matched = PROHIBITED_SANCTIONS.find((p) => p.sanction === s.sanction_type);
      alerts.push({
        type: "prohibited_sanction",
        severity: "critical",
        message: `PROHIBITED SANCTION DETECTED: "${matched?.label ?? s.sanction_type}" recorded for ${s.child_name} on ${s.incident_date} — this is NEVER permitted in a children's home (${matched?.regulation ?? "Reg 19(3)"})`,
        child_id: s.child_id,
        sanction_id: s.id,
      });
    }
  }

  // Sort by severity: critical → high → medium → low
  const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return alerts;
}

// ── CRUD — Sanction Records ────────────────────────────────────────────────

export async function listSanctions(
  homeId: string,
  filters?: {
    childId?: string;
    sanctionType?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    managerReviewed?: boolean;
    limit?: number;
  },
): Promise<ServiceResult<SanctionRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [], persisted: false } as ServiceResult<SanctionRecord[]>;

  const s = sb();
  if (!s) return { ok: true, data: [], persisted: false } as ServiceResult<SanctionRecord[]>;

  let q = (s.from("cs_sanction_records") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.sanctionType) q = q.eq("sanction_type", filters.sanctionType);
  if (filters?.status) q = q.eq("status", filters.status);
  if (filters?.dateFrom) q = q.gte("incident_date", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("incident_date", filters.dateTo);
  if (filters?.managerReviewed !== undefined) q = q.eq("manager_reviewed", filters.managerReviewed);
  q = q.order("incident_date", { ascending: false }).order("incident_time", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createSanction(
  input: Omit<SanctionRecord, "id" | "created_at">,
): Promise<ServiceResult<SanctionRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_sanction_records") as SB)
    .insert({
      home_id: input.home_id,
      child_id: input.child_id,
      child_name: input.child_name,
      sanction_type: input.sanction_type,
      reason: input.reason,
      description: input.description,
      incident_date: input.incident_date,
      incident_time: input.incident_time,
      duration_minutes: input.duration_minutes,
      privilege_removed: input.privilege_removed ?? null,
      proportionate: input.proportionate,
      age_appropriate: input.age_appropriate,
      consistent_with_plan: input.consistent_with_plan,
      child_informed: input.child_informed,
      child_response: input.child_response,
      imposed_by: input.imposed_by,
      witnessed_by: input.witnessed_by ?? null,
      manager_reviewed: input.manager_reviewed,
      manager_reviewed_by: input.manager_reviewed_by ?? null,
      manager_review_date: input.manager_review_date ?? null,
      status: input.status,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateSanction(
  id: string,
  updates: Partial<SanctionRecord>,
): Promise<ServiceResult<SanctionRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_sanction_records") as SB)
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── CRUD — Reward Records ──────────────────────────────────────────────────

export async function listRewards(
  homeId: string,
  filters?: {
    childId?: string;
    rewardType?: string;
    dateFrom?: string;
    dateTo?: string;
    linkedToTarget?: boolean;
    limit?: number;
  },
): Promise<ServiceResult<RewardRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [], persisted: false } as ServiceResult<RewardRecord[]>;

  const s = sb();
  if (!s) return { ok: true, data: [], persisted: false } as ServiceResult<RewardRecord[]>;

  let q = (s.from("cs_reward_records") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.rewardType) q = q.eq("reward_type", filters.rewardType);
  if (filters?.dateFrom) q = q.gte("award_date", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("award_date", filters.dateTo);
  if (filters?.linkedToTarget !== undefined) q = q.eq("linked_to_target", filters.linkedToTarget);
  q = q.order("award_date", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createReward(
  input: Omit<RewardRecord, "id" | "created_at">,
): Promise<ServiceResult<RewardRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_reward_records") as SB)
    .insert({
      home_id: input.home_id,
      child_id: input.child_id,
      child_name: input.child_name,
      reward_type: input.reward_type,
      reason: input.reason,
      description: input.description,
      award_date: input.award_date,
      awarded_by: input.awarded_by,
      linked_to_target: input.linked_to_target,
      target_description: input.target_description ?? null,
      child_response: input.child_response ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ─────────────────────────────────────────────────────────

export const _testing = {
  computeSanctionRewardMetrics,
  identifyBehaviourManagementAlerts,
};
