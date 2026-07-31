// ══════════════════════════════════════════════════════════════════════════════
// CARA — BEHAVIOUR SUPPORT SERVICE
// Manages behaviour recording (CHR 2015 Reg 19), physical intervention tracking
// (Reg 20), de-escalation analysis, rewards/sanctions, and ABC pattern analysis.
// Powers Cara's behaviour intelligence and regulatory compliance.
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

export interface BehaviourEntry {
  id: string;
  home_id: string;
  child_id: string;
  date: string;
  time: string;
  category: string;
  description: string;
  antecedent?: string | null;
  behaviour: string;
  consequence?: string | null;
  de_escalation_used: string[];
  de_escalation_effective: boolean;
  physical_intervention: boolean;
  pi_technique?: string | null;
  pi_duration_minutes?: number | null;
  pi_staff_involved: string[];
  pi_injuries_child: boolean;
  pi_injuries_staff: boolean;
  pi_debrief_completed: boolean;
  pi_debrief_date?: string | null;
  outcome?: string | null;
  recorded_by: string;
  created_at: string;
  updated_at: string;
}

export interface RewardSanction {
  id: string;
  home_id: string;
  child_id: string;
  type: "reward" | "sanction";
  subtype: string;
  reason: string;
  date: string;
  given_by: string;
  child_response?: string | null;
  created_at: string;
}

// ── Constants ───────────────────────────────────────────────────────────────

export const BEHAVIOUR_CATEGORIES: { category: string; label: string }[] = [
  { category: "positive", label: "Positive Behaviour" },
  { category: "concerning", label: "Concerning Behaviour" },
  { category: "escalating", label: "Escalating Behaviour" },
  { category: "crisis", label: "Crisis Behaviour" },
  { category: "self_harm", label: "Self-Harm/Self-Injurious" },
  { category: "aggression", label: "Aggression" },
  { category: "absconding", label: "Absconding" },
  { category: "property_damage", label: "Property Damage" },
  { category: "verbal_aggression", label: "Verbal Aggression" },
  { category: "substance_use", label: "Substance Use" },
];

export const DE_ESCALATION_TECHNIQUES: string[] = [
  "verbal_reassurance", "distraction", "change_of_environment", "offering_space",
  "active_listening", "choices_offered", "grounding_techniques", "sensory_regulation",
  "planned_ignoring", "humour", "physical_comfort_offered",
];

export const PI_TECHNIQUES: { technique: string; level: "low" | "medium" | "high"; description: string }[] = [
  { technique: "guide_away", level: "low", description: "Guiding away from situation" },
  { technique: "single_elbow", level: "low", description: "Single elbow hold" },
  { technique: "double_elbow", level: "medium", description: "Double elbow hold" },
  { technique: "wrap", level: "medium", description: "Wrap/figure of four" },
  { technique: "ground_hold", level: "high", description: "Ground-based hold" },
  { technique: "seated_hold", level: "medium", description: "Seated hold" },
  { technique: "standing_hold", level: "medium", description: "Standing hold" },
  { technique: "escort", level: "low", description: "Physical escort" },
];

export const REWARD_TYPES: string[] = [
  "verbal_praise", "activity_reward", "token_earned", "privilege_earned",
  "special_outing", "extra_screen_time", "cooking_choice", "stay_up_late",
];

export const SANCTION_TYPES: string[] = [
  "verbal_warning", "loss_of_privilege", "reduced_screen_time", "earlier_bedtime",
  "repair_damage", "apology_letter", "community_task",
];

// ── Pure functions (no DB) ──────────────────────────────────────────────────

/**
 * Compute summary statistics from a set of behaviour entries.
 */
export function computeBehaviourSummary(entries: BehaviourEntry[]): {
  total_entries: number;
  by_category: Record<string, number>;
  positive_count: number;
  concerning_count: number;
  pi_count: number;
  // fab-0: null when the source population is empty (no attempts / no PIs / no PI durations).
  de_escalation_success_rate: number | null;
  pi_injury_rate: number | null;
  pi_debrief_completion_rate: number | null;
  avg_pi_duration: number | null;
  top_de_escalation: { technique: string; count: number }[];
} {
  const byCategory: Record<string, number> = {};
  let positiveCount = 0;
  let piCount = 0;
  let deEscalationAttempted = 0;
  let deEscalationEffective = 0;
  let piInjuryCount = 0;
  let piDebriefCompleted = 0;
  let piDurationTotal = 0;
  let piDurationCount = 0;

  const techniqueCounts: Record<string, number> = {};

  for (const e of entries) {
    // Count by category
    byCategory[e.category] = (byCategory[e.category] ?? 0) + 1;

    // Positive count
    if (e.category === "positive") {
      positiveCount++;
    }

    // PI stats
    if (e.physical_intervention) {
      piCount++;
      if (e.pi_injuries_child || e.pi_injuries_staff) {
        piInjuryCount++;
      }
      if (e.pi_debrief_completed) {
        piDebriefCompleted++;
      }
      if (e.pi_duration_minutes != null) {
        piDurationTotal += e.pi_duration_minutes;
        piDurationCount++;
      }
    }

    // De-escalation stats
    if (e.de_escalation_used.length > 0) {
      deEscalationAttempted++;
      if (e.de_escalation_effective) {
        deEscalationEffective++;
      }
    }

    // Technique counts
    for (const t of e.de_escalation_used) {
      techniqueCounts[t] = (techniqueCounts[t] ?? 0) + 1;
    }
  }

  const total = entries.length;
  const concerningCount = total - positiveCount;

  const deEscalationSuccessRate: number | null =
    deEscalationAttempted > 0
      ? Math.round((deEscalationEffective / deEscalationAttempted) * 1000) / 10
      : null;

  const piInjuryRate: number | null =
    piCount > 0
      ? Math.round((piInjuryCount / piCount) * 1000) / 10
      : null;

  const piDebriefCompletionRate: number | null =
    piCount > 0
      ? Math.round((piDebriefCompleted / piCount) * 1000) / 10
      : null;

  const avgPiDuration: number | null =
    piDurationCount > 0
      ? Math.round(piDurationTotal / piDurationCount)
      : null;

  // Top 5 de-escalation techniques
  const topDeEscalation = Object.entries(techniqueCounts)
    .map(([technique, count]) => ({ technique, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    total_entries: total,
    by_category: byCategory,
    positive_count: positiveCount,
    concerning_count: concerningCount,
    pi_count: piCount,
    de_escalation_success_rate: deEscalationSuccessRate,
    pi_injury_rate: piInjuryRate,
    pi_debrief_completion_rate: piDebriefCompletionRate,
    avg_pi_duration: avgPiDuration,
    top_de_escalation: topDeEscalation,
  };
}

/**
 * Compute a behaviour profile for a specific child, including trends.
 */
export function computeChildBehaviourProfile(
  childId: string,
  entries: BehaviourEntry[],
  rewards: RewardSanction[],
): {
  child_id: string;
  total_entries: number;
  // fab-0: null when the child has no entries / no rewards+sanctions.
  positive_ratio: number | null;
  pi_count: number;
  common_antecedents: string[];
  common_categories: { category: string; count: number }[];
  trend: "improving" | "stable" | "declining";
  rewards_count: number;
  sanctions_count: number;
  reward_sanction_ratio: number | null;
  last_pi_date: string | null;
} {
  const childEntries = entries.filter((e) => e.child_id === childId);
  const childRewards = rewards.filter((r) => r.child_id === childId);

  const total = childEntries.length;
  const positiveEntries = childEntries.filter((e) => e.category === "positive");
  const positiveRatio: number | null = total > 0 ? Math.round((positiveEntries.length / total) * 1000) / 10 : null;

  // PI count and last PI date
  const piEntries = childEntries.filter((e) => e.physical_intervention);
  const piCount = piEntries.length;
  let lastPiDate: string | null = null;
  if (piEntries.length > 0) {
    const sorted = [...piEntries].sort((a, b) => b.date.localeCompare(a.date));
    lastPiDate = sorted[0].date;
  }

  // Common antecedents (top 3 non-null)
  const antecedentCounts: Record<string, number> = {};
  for (const e of childEntries) {
    if (e.antecedent && e.antecedent.trim().length > 0) {
      const key = e.antecedent.trim();
      antecedentCounts[key] = (antecedentCounts[key] ?? 0) + 1;
    }
  }
  const commonAntecedents = Object.entries(antecedentCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([antecedent]) => antecedent);

  // Common categories sorted desc
  const categoryCounts: Record<string, number> = {};
  for (const e of childEntries) {
    categoryCounts[e.category] = (categoryCounts[e.category] ?? 0) + 1;
  }
  const commonCategories = Object.entries(categoryCounts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  // Trend: compare positive_ratio of first half vs second half
  let trend: "improving" | "stable" | "declining" = "stable";
  if (total >= 2) {
    const sorted = [...childEntries].sort((a, b) => a.date.localeCompare(b.date));
    const midpoint = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, midpoint);
    const secondHalf = sorted.slice(midpoint);

    const firstPositiveRatio =
      firstHalf.length > 0
        ? firstHalf.filter((e) => e.category === "positive").length / firstHalf.length
        : 0;
    const secondPositiveRatio =
      secondHalf.length > 0
        ? secondHalf.filter((e) => e.category === "positive").length / secondHalf.length
        : 0;

    if (secondPositiveRatio > firstPositiveRatio + 0.05) {
      trend = "improving";
    } else if (secondPositiveRatio < firstPositiveRatio - 0.05) {
      trend = "declining";
    }
  }

  // Rewards and sanctions
  const rewardsCount = childRewards.filter((r) => r.type === "reward").length;
  const sanctionsCount = childRewards.filter((r) => r.type === "sanction").length;
  const rsTotal = rewardsCount + sanctionsCount;
  const rewardSanctionRatio: number | null =
    rsTotal > 0
      ? Math.round((rewardsCount / rsTotal) * 1000) / 10
      : null;

  return {
    child_id: childId,
    total_entries: total,
    positive_ratio: positiveRatio,
    pi_count: piCount,
    common_antecedents: commonAntecedents,
    common_categories: commonCategories,
    trend,
    rewards_count: rewardsCount,
    sanctions_count: sanctionsCount,
    reward_sanction_ratio: rewardSanctionRatio,
    last_pi_date: lastPiDate,
  };
}

/**
 * Analyse physical intervention patterns across entries.
 */
export function computePIAnalysis(entries: BehaviourEntry[]): {
  total_pi: number;
  by_technique: Record<string, number>;
  by_level: { low: number; medium: number; high: number };
  avg_duration: number;
  injury_incidents: number;
  // fab-0: null when there are no PIs to compute over.
  debrief_rate: number | null;
  repeat_children: { child_id: string; count: number }[];
  staff_involved: { staff_id: string; count: number }[];
  time_pattern: Record<string, number>;
} {
  const piEntries = entries.filter((e) => e.physical_intervention);
  const totalPi = piEntries.length;

  // By technique
  const byTechnique: Record<string, number> = {};
  for (const e of piEntries) {
    if (e.pi_technique) {
      byTechnique[e.pi_technique] = (byTechnique[e.pi_technique] ?? 0) + 1;
    }
  }

  // By level — look up each technique's level
  const byLevel = { low: 0, medium: 0, high: 0 };
  for (const e of piEntries) {
    if (e.pi_technique) {
      const config = PI_TECHNIQUES.find((t) => t.technique === e.pi_technique);
      if (config) {
        byLevel[config.level]++;
      }
    }
  }

  // Average duration
  let durationTotal = 0;
  let durationCount = 0;
  for (const e of piEntries) {
    if (e.pi_duration_minutes != null) {
      durationTotal += e.pi_duration_minutes;
      durationCount++;
    }
  }
  const avgDuration = durationCount > 0 ? Math.round(durationTotal / durationCount) : 0;

  // Injury incidents
  let injuryIncidents = 0;
  for (const e of piEntries) {
    if (e.pi_injuries_child || e.pi_injuries_staff) {
      injuryIncidents++;
    }
  }

  // Debrief rate
  let debriefCompleted = 0;
  for (const e of piEntries) {
    if (e.pi_debrief_completed) {
      debriefCompleted++;
    }
  }
  const debriefRate: number | null =
    totalPi > 0
      ? Math.round((debriefCompleted / totalPi) * 1000) / 10
      : null;

  // Repeat children (2+ PIs, sorted desc)
  const childPiCounts: Record<string, number> = {};
  for (const e of piEntries) {
    childPiCounts[e.child_id] = (childPiCounts[e.child_id] ?? 0) + 1;
  }
  const repeatChildren = Object.entries(childPiCounts)
    .filter(([, count]) => count >= 2)
    .map(([child_id, count]) => ({ child_id, count }))
    .sort((a, b) => b.count - a.count);

  // Top 5 staff by PI involvement
  const staffCounts: Record<string, number> = {};
  for (const e of piEntries) {
    for (const staffId of e.pi_staff_involved) {
      staffCounts[staffId] = (staffCounts[staffId] ?? 0) + 1;
    }
  }
  const staffInvolved = Object.entries(staffCounts)
    .map(([staff_id, count]) => ({ staff_id, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Time pattern: group by hour bucket
  const timePattern: Record<string, number> = {
    morning: 0,
    afternoon: 0,
    evening: 0,
    night: 0,
  };
  for (const e of piEntries) {
    const hour = parseInt(e.time.split(":")[0], 10);
    if (hour >= 6 && hour < 12) {
      timePattern.morning++;
    } else if (hour >= 12 && hour < 18) {
      timePattern.afternoon++;
    } else if (hour >= 18 && hour < 22) {
      timePattern.evening++;
    } else {
      timePattern.night++;
    }
  }

  return {
    total_pi: totalPi,
    by_technique: byTechnique,
    by_level: byLevel,
    avg_duration: avgDuration,
    injury_incidents: injuryIncidents,
    debrief_rate: debriefRate,
    repeat_children: repeatChildren,
    staff_involved: staffInvolved,
    time_pattern: timePattern,
  };
}

/**
 * Identify behaviour alerts requiring attention.
 */
export function identifyBehaviourAlerts(
  entries: BehaviourEntry[],
  rewards: RewardSanction[],
): { type: string; severity: "critical" | "high" | "medium" | "low"; message: string; child_id: string }[] {
  const alerts: { type: string; severity: "critical" | "high" | "medium" | "low"; message: string; child_id: string }[] = [];
  const now = new Date();
  const twentyFourHoursMs = 24 * 60 * 60 * 1000;
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  // ── PI without debrief (> 24 hours old) ────────────────────────────────
  for (const e of entries) {
    if (e.physical_intervention && !e.pi_debrief_completed) {
      const entryDate = new Date(`${e.date}T${e.time}`).getTime();
      if (now.getTime() - entryDate > twentyFourHoursMs) {
        alerts.push({
          type: "pi_without_debrief",
          severity: "high",
          message: `Physical intervention on ${e.date} has not been debriefed — debrief required within 24 hours`,
          child_id: e.child_id,
        });
      }
    }
  }

  // ── PI with injury ────────────────────────────────────────────────────
  for (const e of entries) {
    if (e.physical_intervention && (e.pi_injuries_child || e.pi_injuries_staff)) {
      const injuryTarget = e.pi_injuries_child && e.pi_injuries_staff
        ? "child and staff"
        : e.pi_injuries_child
          ? "child"
          : "staff";
      alerts.push({
        type: "pi_injury",
        severity: "critical",
        message: `Injury to ${injuryTarget} during physical intervention on ${e.date}`,
        child_id: e.child_id,
      });
    }
  }

  // ── Per-child alerts ──────────────────────────────────────────────────
  const childIds = [...new Set(entries.map((e) => e.child_id))];

  for (const childId of childIds) {
    const childEntries = entries.filter((e) => e.child_id === childId);

    // Escalating behaviour: 3+ concerning/crisis/aggression in last 7 days
    const escalatingCategories = ["concerning", "crisis", "aggression"];
    const recentEscalating = childEntries.filter((e) => {
      if (!escalatingCategories.includes(e.category)) return false;
      const entryDate = new Date(e.date).getTime();
      return now.getTime() - entryDate <= sevenDaysMs;
    });
    if (recentEscalating.length >= 3) {
      alerts.push({
        type: "escalating_behaviour",
        severity: "high",
        message: `${recentEscalating.length} concerning/crisis/aggression entries in the last 7 days — review behaviour support plan`,
        child_id: childId,
      });
    }

    // High PI frequency: 3+ PIs in last 30 days
    const recentPIs = childEntries.filter((e) => {
      if (!e.physical_intervention) return false;
      const entryDate = new Date(e.date).getTime();
      return now.getTime() - entryDate <= thirtyDaysMs;
    });
    if (recentPIs.length >= 3) {
      alerts.push({
        type: "high_pi_frequency",
        severity: "high",
        message: `${recentPIs.length} physical interventions in the last 30 days — urgent review required`,
        child_id: childId,
      });
    }

    // Low positive ratio: < 30% positive in last 30 days
    const recentEntries = childEntries.filter((e) => {
      const entryDate = new Date(e.date).getTime();
      return now.getTime() - entryDate <= thirtyDaysMs;
    });
    if (recentEntries.length > 0) {
      const positiveCount = recentEntries.filter((e) => e.category === "positive").length;
      const positiveRatio = (positiveCount / recentEntries.length) * 100;
      if (positiveRatio < 30) {
        alerts.push({
          type: "low_positive_ratio",
          severity: "medium",
          message: `Only ${Math.round(positiveRatio)}% positive entries in the last 30 days — consider increasing positive reinforcement`,
          child_id: childId,
        });
      }
    }

    // Sanction heavy: more sanctions than rewards in last 30 days
    const childRewards = rewards.filter((r) => r.child_id === childId);
    const recentRewards = childRewards.filter((r) => {
      if (r.type !== "reward") return false;
      const rDate = new Date(r.date).getTime();
      return now.getTime() - rDate <= thirtyDaysMs;
    });
    const recentSanctions = childRewards.filter((r) => {
      if (r.type !== "sanction") return false;
      const rDate = new Date(r.date).getTime();
      return now.getTime() - rDate <= thirtyDaysMs;
    });
    if (recentSanctions.length > 0 && recentSanctions.length > recentRewards.length) {
      alerts.push({
        type: "sanction_heavy",
        severity: "medium",
        message: `${recentSanctions.length} sanctions vs ${recentRewards.length} rewards in the last 30 days — rebalance approach`,
        child_id: childId,
      });
    }
  }

  return alerts;
}

// ── CRUD — Behaviour Entries ────────────────────────────────────────────────

export async function listBehaviourEntries(
  homeId: string,
  filters?: {
    childId?: string;
    category?: string;
    physicalIntervention?: boolean;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  },
): Promise<ServiceResult<BehaviourEntry[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_behaviour_entries") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.category) q = q.eq("category", filters.category);
  if (filters?.physicalIntervention !== undefined) q = q.eq("physical_intervention", filters.physicalIntervention);
  if (filters?.dateFrom) q = q.gte("date", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("date", filters.dateTo);
  q = q.order("date", { ascending: false }).order("time", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getBehaviourEntry(
  id: string,
): Promise<ServiceResult<BehaviourEntry>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_behaviour_entries") as SB)
    .select("*")
    .eq("id", id)
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function createBehaviourEntry(
  input: Omit<BehaviourEntry, "id" | "created_at" | "updated_at">,
): Promise<ServiceResult<BehaviourEntry>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_behaviour_entries") as SB)
    .insert({
      home_id: input.home_id,
      child_id: input.child_id,
      date: input.date,
      time: input.time,
      category: input.category,
      description: input.description,
      antecedent: input.antecedent ?? null,
      behaviour: input.behaviour,
      consequence: input.consequence ?? null,
      de_escalation_used: input.de_escalation_used ?? [],
      de_escalation_effective: input.de_escalation_effective,
      physical_intervention: input.physical_intervention,
      pi_technique: input.pi_technique ?? null,
      pi_duration_minutes: input.pi_duration_minutes ?? null,
      pi_staff_involved: input.pi_staff_involved ?? [],
      pi_injuries_child: input.pi_injuries_child,
      pi_injuries_staff: input.pi_injuries_staff,
      pi_debrief_completed: input.pi_debrief_completed,
      pi_debrief_date: input.pi_debrief_date ?? null,
      outcome: input.outcome ?? null,
      recorded_by: input.recorded_by,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateBehaviourEntry(
  id: string,
  updates: Partial<BehaviourEntry>,
): Promise<ServiceResult<BehaviourEntry>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_behaviour_entries") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── CRUD — Rewards & Sanctions ──────────────────────────────────────────────

export async function listRewardsSanctions(
  homeId: string,
  filters?: {
    childId?: string;
    type?: "reward" | "sanction";
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  },
): Promise<ServiceResult<RewardSanction[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_rewards_sanctions") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.type) q = q.eq("type", filters.type);
  if (filters?.dateFrom) q = q.gte("date", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("date", filters.dateTo);
  q = q.order("date", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRewardSanction(
  input: Omit<RewardSanction, "id" | "created_at">,
): Promise<ServiceResult<RewardSanction>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_rewards_sanctions") as SB)
    .insert({
      home_id: input.home_id,
      child_id: input.child_id,
      type: input.type,
      subtype: input.subtype,
      reason: input.reason,
      date: input.date,
      given_by: input.given_by,
      child_response: input.child_response ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ─────────────────────────────────────────────────────────

export const _testing = {
  computeBehaviourSummary,
  computeChildBehaviourProfile,
  computePIAnalysis,
  identifyBehaviourAlerts,
};
