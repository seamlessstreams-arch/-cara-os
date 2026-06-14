// ══════════════════════════════════════════════════════════════════════════════
// CARA — BEHAVIOUR SUPPORT INTELLIGENCE ENGINE
//
// Pure deterministic engine that aggregates behaviour entries, incidents,
// physical interventions, sanctions/rewards, and restraint records to produce:
// - Behaviour profile summary (totals, positive %, de-escalation success)
// - Category breakdown (positive, concerning, escalating, aggression, etc.)
// - Physical intervention analysis (frequency, duration, debrief compliance)
// - Rewards vs sanctions balance (proportionality indicator)
// - Time-of-day pattern analysis (when behaviours cluster)
// - Per-child behaviour trajectories
// - Auto-generated Cara intelligence insights (deterministic, no LLM)
//
// Key regulatory requirements:
//   Reg 19 — Behaviour management (positive strategies)
//   Reg 20 — Restraint (proportionality, recording, review)
//   Reg 35 — Behaviour support plans
//   Children's Homes Regulations 2015
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ───────────────────────────────────────────────────────────────────

export type BehaviourCategory =
  | "positive"
  | "concerning"
  | "escalating"
  | "verbal_aggression"
  | "aggression"
  | "property_damage"
  | "self_harm"
  | "absconding";

export type BehaviourSeverity = "positive" | "low" | "medium" | "high" | "critical";

export interface BehaviourEntryInput {
  id: string;
  child_id: string;
  date: string;
  time: string;
  direction: "positive" | "concerning" | "neutral";
  intensity: "low" | "medium" | "high" | "severe";
  title: string;
  antecedent: string;
  behaviour: string;
  consequence: string;
  trigger: string;
  strategy_used: string;
  outcome: string;
  recorded_by: string;
}

export interface IncidentInput {
  id: string;
  child_id: string;
  date: string;
  time: string;
  type: string;
  severity: string;
  description: string;
  immediate_action: string;
  status: string;
  body_map_completed?: boolean;
  reported_by: string;
}

export interface RestraintInput {
  id: string;
  child_id: string;
  date: string;
  start_time: string;
  end_time: string;
  duration: number; // minutes
  reason: string;
  restraint_type: string;
  antecedent: string;
  de_escalation_attempts: string[];
  child_debriefed: boolean;
  staff_debriefed: boolean;
  injuries: { person: string; description: string }[];
  review_status: string;
  recorded_by: string;
}

export interface SanctionRewardInput {
  id: string;
  child_id: string;
  date: string;
  direction: "reward" | "sanction";
  title: string;
  description: string;
  context: string;
  child_response: string;
  outcome: string;
  proportionate: boolean;
  recorded_by: string;
}

export interface BehaviourProfile {
  total_entries: number;
  positive_count: number;
  concerning_count: number;
  positive_percentage: number;
  pi_count: number;
  pi_injury_rate: number; // percentage
  pi_debrief_completion_rate: number; // percentage
  pi_avg_duration_minutes: number;
  de_escalation_success_rate: number; // percentage
  children_with_entries: number;
  children_with_repeat_escalation: string[]; // child IDs with 3+ concerning in 14 days
}

export interface CategoryBreakdown {
  category: BehaviourCategory;
  count: number;
  percentage: number;
}

export interface PIEntry {
  id: string;
  child_id: string;
  child_name: string;
  date: string;
  technique: string;
  duration_minutes: number;
  debriefed: boolean;
  injury: boolean;
  de_escalation_attempted: boolean;
}

export interface RewardsSanctionsBalance {
  total_rewards: number;
  total_sanctions: number;
  ratio: number; // rewards / (rewards + sanctions) * 100
  reward_to_sanction: string; // e.g. "3.7:1"
  disproportionate_children: string[]; // children with ratio < 50%
}

export interface TimePattern {
  hour_block: string; // e.g. "06:00-09:00"
  label: string; // e.g. "Early Morning"
  count: number;
  positive_count: number;
  concerning_count: number;
}

export interface ChildTrajectory {
  child_id: string;
  child_name: string;
  recent_entries: number; // last 14 days
  positive_recent: number;
  concerning_recent: number;
  pi_count: number;
  trend: "improving" | "stable" | "declining" | "insufficient_data";
  severity: BehaviourSeverity;
}

export interface BehaviourAlert {
  type: string;
  severity: "critical" | "high" | "medium" | "low";
  message: string;
}

export interface CaraInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface BehaviourIntelligenceResult {
  profile: BehaviourProfile;
  categories: CategoryBreakdown[];
  pi_entries: PIEntry[];
  rewards_sanctions: RewardsSanctionsBalance;
  time_patterns: TimePattern[];
  child_trajectories: ChildTrajectory[];
  alerts: BehaviourAlert[];
  insights: CaraInsight[];
}

export interface BehaviourEngineInput {
  behaviourEntries: BehaviourEntryInput[];
  incidents: IncidentInput[];
  restraints: RestraintInput[];
  sanctionRewards: SanctionRewardInput[];
  childNameLookup?: (id: string) => string;
  today?: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b + "T00:00:00Z").getTime() - new Date(a + "T00:00:00Z").getTime()) / 86_400_000
  );
}

/** Classify a behaviour entry into categories */
export function classifyBehaviourCategory(entry: BehaviourEntryInput): BehaviourCategory {
  if (entry.direction === "positive") return "positive";

  const text = (entry.behaviour + " " + entry.title + " " + entry.antecedent).toLowerCase();

  if (text.includes("self-harm") || text.includes("self harm") || text.includes("cut") || text.includes("scratch")) {
    return "self_harm";
  }
  if (text.includes("abscond") || text.includes("ran away") || text.includes("left without")) {
    return "absconding";
  }
  if (text.includes("hit") || text.includes("kick") || text.includes("punch") || text.includes("assault") || text.includes("attack") || text.includes("violent")) {
    return "aggression";
  }
  if (text.includes("property") || text.includes("smash") || text.includes("broke") || text.includes("damage") || text.includes("threw") || text.includes("throw")) {
    return "property_damage";
  }
  if (text.includes("shout") || text.includes("swear") || text.includes("verbal") || text.includes("threat") || text.includes("abuse")) {
    return "verbal_aggression";
  }
  if (entry.intensity === "high" || entry.intensity === "severe") {
    return "escalating";
  }
  return "concerning";
}

/** Classify incident into behaviour category for aggregation */
export function classifyIncidentAsBehaviour(incident: IncidentInput): BehaviourCategory | null {
  const t = incident.type.toLowerCase();
  if (t === "physical_intervention") return "aggression";
  if (t === "self_harm") return "self_harm";
  if (t === "property_damage") return "property_damage";
  if (t === "absconding" || t === "missing_from_care") return "absconding";
  if (t === "verbal_aggression") return "verbal_aggression";
  // Non-behaviour incidents (medication_error, complaint, safeguarding_concern) — don't count
  return null;
}

/** Get hour from time string "HH:MM" */
function getHour(time: string): number {
  const parts = time.split(":");
  return parseInt(parts[0], 10);
}

/** Map hour to time block */
export function getTimeBlock(hour: number): { block: string; label: string } {
  if (hour < 6) return { block: "00:00-06:00", label: "Night" };
  if (hour < 9) return { block: "06:00-09:00", label: "Early Morning" };
  if (hour < 12) return { block: "09:00-12:00", label: "Morning" };
  if (hour < 15) return { block: "12:00-15:00", label: "Afternoon" };
  if (hour < 18) return { block: "15:00-18:00", label: "Late Afternoon" };
  if (hour < 21) return { block: "18:00-21:00", label: "Evening" };
  return { block: "21:00-00:00", label: "Late Evening" };
}

/** Determine if de-escalation was successful (no PI followed) */
export function wasDeEscalationSuccessful(entry: BehaviourEntryInput): boolean {
  const outcome = entry.outcome.toLowerCase();
  const strategy = entry.strategy_used.toLowerCase();

  // If a strategy was used and the outcome was positive/resolved
  if (strategy.length > 0 && strategy !== "none" && strategy !== "n/a") {
    if (
      outcome.includes("settled") ||
      outcome.includes("calm") ||
      outcome.includes("resolved") ||
      outcome.includes("de-escalat") ||
      outcome.includes("regulated") ||
      outcome.includes("redirected") ||
      outcome.includes("engaged") ||
      outcome.includes("cooperat")
    ) {
      return true;
    }
  }
  return false;
}

/** Compute child behaviour trend based on comparing recent vs older period */
export function computeChildTrend(
  recentPositive: number,
  recentConcerning: number,
  olderPositive: number,
  olderConcerning: number,
): "improving" | "stable" | "declining" | "insufficient_data" {
  const totalRecent = recentPositive + recentConcerning;
  const totalOlder = olderPositive + olderConcerning;

  if (totalRecent < 2 && totalOlder < 2) return "insufficient_data";
  if (totalOlder === 0) return totalRecent > 0 ? "stable" : "insufficient_data";

  const recentRatio = totalRecent > 0 ? recentPositive / totalRecent : 0.5;
  const olderRatio = totalOlder > 0 ? olderPositive / totalOlder : 0.5;

  const diff = recentRatio - olderRatio;
  if (diff > 0.15) return "improving";
  if (diff < -0.15) return "declining";
  return "stable";
}

/** Compute severity for a child based on their entries */
export function computeChildSeverity(
  piCount: number,
  concerningRecent: number,
  trend: string,
): BehaviourSeverity {
  if (piCount >= 3 || (concerningRecent >= 5 && trend === "declining")) return "critical";
  if (piCount >= 2 || concerningRecent >= 4) return "high";
  if (piCount >= 1 || concerningRecent >= 2) return "medium";
  if (concerningRecent >= 1) return "low";
  return "positive";
}

// ── Main Engine ─────────────────────────────────────────────────────────────

export function computeBehaviourIntelligence(input: BehaviourEngineInput): BehaviourIntelligenceResult {
  const today = input.today ?? todayStr();
  const childName = input.childNameLookup ?? ((id: string) =>
    id.replace("yp_", "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );

  const { behaviourEntries, incidents, restraints, sanctionRewards } = input;

  // ── Build unified behaviour event list ─────────────────────────────────
  // Count behaviour entries + behaviour-relevant incidents
  const positiveEntries = behaviourEntries.filter((e) => e.direction === "positive");
  const concerningEntries = behaviourEntries.filter((e) => e.direction !== "positive");

  // PI incidents
  const piIncidents = incidents.filter((i) => i.type === "physical_intervention");

  // Total behaviour-relevant entries
  const totalBehaviourEntries = behaviourEntries.length;

  // ── Category breakdown ─────────────────────────────────────────────────
  const categoryCounts = new Map<BehaviourCategory, number>();

  for (const entry of behaviourEntries) {
    const cat = classifyBehaviourCategory(entry);
    categoryCounts.set(cat, (categoryCounts.get(cat) ?? 0) + 1);
  }

  // Add behaviour-relevant incidents to categories
  for (const inc of incidents) {
    const cat = classifyIncidentAsBehaviour(inc);
    if (cat) {
      categoryCounts.set(cat, (categoryCounts.get(cat) ?? 0) + 1);
    }
  }

  const categoryOrder: BehaviourCategory[] = [
    "positive", "concerning", "escalating", "verbal_aggression",
    "aggression", "property_damage", "self_harm", "absconding",
  ];

  const totalWithIncidents = totalBehaviourEntries +
    incidents.filter((i) => classifyIncidentAsBehaviour(i) !== null).length;

  const categories: CategoryBreakdown[] = categoryOrder
    .filter((cat) => (categoryCounts.get(cat) ?? 0) > 0)
    .map((cat) => ({
      category: cat,
      count: categoryCounts.get(cat) ?? 0,
      percentage: totalWithIncidents > 0
        ? Math.round(((categoryCounts.get(cat) ?? 0) / totalWithIncidents) * 100)
        : 0,
    }));

  // ── PI Analysis ────────────────────────────────────────────────────────
  const piEntries: PIEntry[] = [];

  // From restraints collection (primary source for PI records)
  for (const r of restraints) {
    piEntries.push({
      id: r.id,
      child_id: r.child_id,
      child_name: childName(r.child_id),
      date: r.date,
      technique: r.restraint_type.replace(/_/g, " "),
      duration_minutes: r.duration,
      debriefed: r.child_debriefed,
      injury: r.injuries.length > 0,
      de_escalation_attempted: r.de_escalation_attempts.length > 0,
    });
  }

  // From PI incidents if not already captured in restraints
  const restraintDates = new Set(restraints.map((r) => `${r.child_id}_${r.date}`));
  for (const inc of piIncidents) {
    const key = `${inc.child_id}_${inc.date}`;
    if (!restraintDates.has(key)) {
      // Extract technique from description
      const desc = inc.description.toLowerCase();
      let technique = "Physical intervention";
      if (desc.includes("guide away")) technique = "Guide away";
      else if (desc.includes("single elbow")) technique = "Single elbow";
      else if (desc.includes("wrap hold")) technique = "Wrap hold";
      else if (desc.includes("holding")) technique = "Planned holding";
      else if (desc.includes("team teach")) technique = "Team Teach hold";

      // Extract duration from description
      let duration = 0;
      const durationMatch = inc.description.match(/(\d+)\s*minute/);
      if (durationMatch) duration = parseInt(durationMatch[1], 10);

      piEntries.push({
        id: inc.id,
        child_id: inc.child_id,
        child_name: childName(inc.child_id),
        date: inc.date,
        technique,
        duration_minutes: duration,
        debriefed: inc.description.toLowerCase().includes("debrief"),
        injury: inc.body_map_completed === true,
        de_escalation_attempted: inc.description.toLowerCase().includes("de-escalat") ||
          inc.description.toLowerCase().includes("attempted") ||
          inc.immediate_action.toLowerCase().includes("de-escalat"),
      });
    }
  }

  // Sort PI entries by date desc
  piEntries.sort((a, b) => b.date.localeCompare(a.date));

  // PI stats
  const piCount = piEntries.length;
  const piWithInjury = piEntries.filter((p) => p.injury).length;
  const piInjuryRate = piCount > 0 ? Math.round((piWithInjury / piCount) * 100) : 0;
  const piDebriefed = piEntries.filter((p) => p.debriefed).length;
  const piDebriefRate = piCount > 0 ? Math.round((piDebriefed / piCount) * 100) : 100;
  const piDurations = piEntries.filter((p) => p.duration_minutes > 0).map((p) => p.duration_minutes);
  const piAvgDuration = piDurations.length > 0
    ? Math.round(piDurations.reduce((a, b) => a + b, 0) / piDurations.length)
    : 0;

  // ── De-escalation success rate ─────────────────────────────────────────
  const entriesWithStrategy = concerningEntries.filter(
    (e) => e.strategy_used && e.strategy_used.length > 0 && e.strategy_used.toLowerCase() !== "none"
  );
  const successfulDeEscalations = entriesWithStrategy.filter(wasDeEscalationSuccessful).length;
  const deEscalationRate = entriesWithStrategy.length > 0
    ? Math.round((successfulDeEscalations / entriesWithStrategy.length) * 100)
    : piCount === 0 ? 100 : 0; // no concerning entries + no PI = 100%

  // ── Rewards vs Sanctions ───────────────────────────────────────────────
  const rewards = sanctionRewards.filter((sr) => sr.direction === "reward");
  const sanctions = sanctionRewards.filter((sr) => sr.direction === "sanction");

  const totalRewards = rewards.length;
  const totalSanctions = sanctions.length;
  const rewardRatio = (totalRewards + totalSanctions) > 0
    ? Math.round((totalRewards / (totalRewards + totalSanctions)) * 100)
    : 100; // no entries = perfect
  const rewardToSanction = totalSanctions > 0
    ? `${(totalRewards / totalSanctions).toFixed(1)}:1`
    : totalRewards > 0 ? `${totalRewards}:0` : "N/A";

  // Find children with disproportionate sanctions
  const childSRCounts = new Map<string, { rewards: number; sanctions: number }>();
  for (const sr of sanctionRewards) {
    const current = childSRCounts.get(sr.child_id) ?? { rewards: 0, sanctions: 0 };
    if (sr.direction === "reward") current.rewards++;
    else current.sanctions++;
    childSRCounts.set(sr.child_id, current);
  }
  const disproportionateChildren = [...childSRCounts.entries()]
    .filter(([, counts]) => {
      const total = counts.rewards + counts.sanctions;
      return total >= 3 && (counts.rewards / total) < 0.5;
    })
    .map(([id]) => id);

  const rewardsSanctions: RewardsSanctionsBalance = {
    total_rewards: totalRewards,
    total_sanctions: totalSanctions,
    ratio: rewardRatio,
    reward_to_sanction: rewardToSanction,
    disproportionate_children: disproportionateChildren,
  };

  // ── Time patterns ──────────────────────────────────────────────────────
  const timeBlockCounts = new Map<string, { label: string; count: number; positive: number; concerning: number }>();

  // Initialize all blocks
  const blocks = [
    { block: "00:00-06:00", label: "Night" },
    { block: "06:00-09:00", label: "Early Morning" },
    { block: "09:00-12:00", label: "Morning" },
    { block: "12:00-15:00", label: "Afternoon" },
    { block: "15:00-18:00", label: "Late Afternoon" },
    { block: "18:00-21:00", label: "Evening" },
    { block: "21:00-00:00", label: "Late Evening" },
  ];
  for (const b of blocks) {
    timeBlockCounts.set(b.block, { label: b.label, count: 0, positive: 0, concerning: 0 });
  }

  // Count behaviour entries by time
  for (const entry of behaviourEntries) {
    const hour = getHour(entry.time);
    const { block } = getTimeBlock(hour);
    const data = timeBlockCounts.get(block)!;
    data.count++;
    if (entry.direction === "positive") data.positive++;
    else data.concerning++;
  }

  // Count PI incidents by time
  for (const inc of piIncidents) {
    const hour = getHour(inc.time);
    const { block } = getTimeBlock(hour);
    const data = timeBlockCounts.get(block)!;
    data.count++;
    data.concerning++;
  }

  const timePatterns: TimePattern[] = blocks.map((b) => {
    const data = timeBlockCounts.get(b.block)!;
    return {
      hour_block: b.block,
      label: data.label,
      count: data.count,
      positive_count: data.positive,
      concerning_count: data.concerning,
    };
  });

  // ── Child trajectories ─────────────────────────────────────────────────
  const childIds = new Set<string>();
  for (const e of behaviourEntries) childIds.add(e.child_id);
  for (const i of piIncidents) childIds.add(i.child_id);
  for (const r of restraints) childIds.add(r.child_id);

  const fourteenDaysAgo = (() => {
    const d = new Date(today + "T00:00:00Z");
    d.setDate(d.getDate() - 14);
    return d.toISOString().slice(0, 10);
  })();

  const twentyEightDaysAgo = (() => {
    const d = new Date(today + "T00:00:00Z");
    d.setDate(d.getDate() - 28);
    return d.toISOString().slice(0, 10);
  })();

  const childTrajectories: ChildTrajectory[] = [];
  const repeatEscalationChildren: string[] = [];

  for (const childId of childIds) {
    const childBehaviours = behaviourEntries.filter((e) => e.child_id === childId);
    const childPIs = piEntries.filter((p) => p.child_id === childId);

    // Recent (last 14 days)
    const recentBehaviours = childBehaviours.filter((e) => e.date >= fourteenDaysAgo);
    const recentPositive = recentBehaviours.filter((e) => e.direction === "positive").length;
    const recentConcerning = recentBehaviours.filter((e) => e.direction !== "positive").length;

    // Older (14-28 days ago)
    const olderBehaviours = childBehaviours.filter((e) => e.date >= twentyEightDaysAgo && e.date < fourteenDaysAgo);
    const olderPositive = olderBehaviours.filter((e) => e.direction === "positive").length;
    const olderConcerning = olderBehaviours.filter((e) => e.direction !== "positive").length;

    const trend = computeChildTrend(recentPositive, recentConcerning, olderPositive, olderConcerning);
    const severity = computeChildSeverity(childPIs.length, recentConcerning, trend);

    childTrajectories.push({
      child_id: childId,
      child_name: childName(childId),
      recent_entries: recentBehaviours.length,
      positive_recent: recentPositive,
      concerning_recent: recentConcerning,
      pi_count: childPIs.length,
      trend,
      severity,
    });

    // Track children with 3+ concerning in 14 days
    if (recentConcerning >= 3) {
      repeatEscalationChildren.push(childId);
    }
  }

  // Sort by severity (critical first)
  const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, positive: 4 };
  childTrajectories.sort((a, b) => (severityOrder[a.severity] ?? 5) - (severityOrder[b.severity] ?? 5));

  // ── Profile ────────────────────────────────────────────────────────────
  const profile: BehaviourProfile = {
    total_entries: totalWithIncidents,
    positive_count: positiveEntries.length,
    concerning_count: concerningEntries.length + incidents.filter((i) => classifyIncidentAsBehaviour(i) !== null).length,
    positive_percentage: totalWithIncidents > 0
      ? Math.round((positiveEntries.length / totalWithIncidents) * 100)
      : 100,
    pi_count: piCount,
    pi_injury_rate: piInjuryRate,
    pi_debrief_completion_rate: piDebriefRate,
    pi_avg_duration_minutes: piAvgDuration,
    de_escalation_success_rate: deEscalationRate,
    children_with_entries: childIds.size,
    children_with_repeat_escalation: repeatEscalationChildren,
  };

  // ── Alerts ─────────────────────────────────────────────────────────────
  const alerts: BehaviourAlert[] = [];

  // PI without debrief (Reg 20 requirement)
  for (const pi of piEntries) {
    if (!pi.debriefed) {
      alerts.push({
        type: "pi_without_debrief",
        severity: "high",
        message: `${pi.child_name} — PI on ${pi.date} has no debrief recorded. Complete debrief within 24 hours of incident.`,
      });
    }
  }

  // Escalating behaviour pattern
  for (const child of childTrajectories) {
    if (child.concerning_recent >= 3 && child.trend === "declining") {
      alerts.push({
        type: "escalating_behaviour",
        severity: "high",
        message: `${child.child_name} has had ${child.concerning_recent} concerning/escalating entries in the last 14 days with a declining trend. Review behaviour support plan urgently.`,
      });
    } else if (child.concerning_recent >= 3) {
      alerts.push({
        type: "repeat_concerning",
        severity: "medium",
        message: `${child.child_name} has had ${child.concerning_recent} concerning entries in the last 14 days. Review behaviour support plan.`,
      });
    }
  }

  // Disproportionate sanctions
  for (const childId of disproportionateChildren) {
    const name = childName(childId);
    const counts = childSRCounts.get(childId)!;
    alerts.push({
      type: "disproportionate_sanctions",
      severity: "medium",
      message: `${name} receives more sanctions (${counts.sanctions}) than rewards (${counts.rewards}). Review whether BSP rewards are aligned with their interests.`,
    });
  }

  // ── Cara Intelligence Insights (deterministic) ─────────────────────────
  const insights: CaraInsight[] = [];

  // No data at all
  if (totalWithIncidents === 0 && piCount === 0 && sanctionRewards.length === 0) {
    insights.push({
      severity: "positive",
      text: "No behaviour entries recorded this period. Once behaviour logging is active, Cara will generate pattern intelligence automatically.",
    });
    return {
      profile,
      categories,
      pi_entries: piEntries,
      rewards_sanctions: rewardsSanctions,
      time_patterns: timePatterns,
      child_trajectories: childTrajectories,
      alerts,
      insights,
    };
  }

  // De-escalation insight
  if (entriesWithStrategy.length > 0) {
    const topStrategies = new Map<string, number>();
    for (const e of entriesWithStrategy.filter(wasDeEscalationSuccessful)) {
      const s = e.strategy_used.toLowerCase();
      topStrategies.set(s, (topStrategies.get(s) ?? 0) + 1);
    }
    const sortedStrategies = [...topStrategies.entries()].sort((a, b) => b[1] - a[1]);
    const topTwo = sortedStrategies.slice(0, 2).map(([s]) => s).join(" and ");

    if (deEscalationRate >= 75) {
      insights.push({
        severity: "positive",
        text: `De-escalation success rate at ${deEscalationRate}%${topTwo ? ` — ${topTwo} are the most effective techniques for this cohort` : ""}. Continue embedding positive behaviour strategies.`,
      });
    } else {
      insights.push({
        severity: "warning",
        text: `De-escalation success rate at ${deEscalationRate}% (target: 75%+)${topTwo ? `. ${topTwo} show most promise` : ""}. Consider additional training on de-escalation and grounding techniques.`,
      });
    }
  }

  // Reward/sanction ratio insight
  if (sanctionRewards.length >= 3) {
    if (rewardRatio >= 75) {
      insights.push({
        severity: "positive",
        text: `Reward-to-sanction ratio is ${rewardToSanction} — positive behaviour reinforcement is well embedded. ${disproportionateChildren.length > 0 ? `Note: ${disproportionateChildren.map(childName).join(", ")} receive${disproportionateChildren.length === 1 ? "s" : ""} more sanctions proportionally.` : "All children receiving balanced approach."}`,
      });
    } else {
      insights.push({
        severity: "warning",
        text: `Reward-to-sanction ratio is ${rewardToSanction} (target: 4:1 or better). Sanctions outnumber rewards for some children. Review BSP reward strategies and ensure they align with individual interests.`,
      });
    }
  }

  // PI safety insight
  if (piCount > 0) {
    const parts: string[] = [];
    if (piInjuryRate === 0) parts.push("zero injuries from physical interventions this period");
    if (piDebriefRate === 100) parts.push("all debriefs completed within timeframe");
    if (piAvgDuration > 0 && piAvgDuration <= 5) parts.push(`average PI duration ${piAvgDuration} minutes (proportionate)`);

    if (parts.length >= 2) {
      insights.push({
        severity: "positive",
        text: `Positive: ${parts.join(". ")}. Reg 20 restraint standards well evidenced.`,
      });
    } else if (piInjuryRate > 0 || piDebriefRate < 100) {
      const concerns: string[] = [];
      if (piInjuryRate > 0) concerns.push(`${piInjuryRate}% of PIs resulted in injury`);
      if (piDebriefRate < 100) concerns.push(`debrief completion at ${piDebriefRate}%`);
      insights.push({
        severity: "warning",
        text: `Physical intervention concerns: ${concerns.join("; ")}. Review Reg 20 compliance and ensure all debriefs are completed within 24 hours.`,
      });
    }
  }

  // Positive percentage insight
  if (totalWithIncidents >= 5) {
    const posPct = profile.positive_percentage;
    if (posPct >= 50) {
      insights.push({
        severity: "positive",
        text: `${posPct}% of all behaviour entries are positive, indicating a strength-based approach. Reg 19 behaviour management standards well evidenced.`,
      });
    } else {
      insights.push({
        severity: "warning",
        text: `Only ${posPct}% of behaviour entries are positive (target: 50%+). Ensure staff are actively recording positive behaviours to evidence Reg 19 strength-based practice.`,
      });
    }
  }

  // Time pattern insight
  const peakConcerning = timePatterns
    .filter((t) => t.concerning_count > 0)
    .sort((a, b) => b.concerning_count - a.concerning_count)[0];

  if (peakConcerning && peakConcerning.concerning_count >= 3) {
    insights.push({
      severity: "warning",
      text: `Concerning behaviours cluster during ${peakConcerning.label.toLowerCase()} (${peakConcerning.hour_block}). Consider staffing levels, transition support, and activity planning during this window.`,
    });
  }

  // Ensure at least one insight
  if (insights.length === 0) {
    insights.push({
      severity: "positive",
      text: `${totalWithIncidents} behaviour entries on record. Continue recording positive and concerning behaviours to build intelligence patterns.`,
    });
  }

  return {
    profile,
    categories,
    pi_entries: piEntries,
    rewards_sanctions: rewardsSanctions,
    time_patterns: timePatterns,
    child_trajectories: childTrajectories,
    alerts,
    insights,
  };
}
