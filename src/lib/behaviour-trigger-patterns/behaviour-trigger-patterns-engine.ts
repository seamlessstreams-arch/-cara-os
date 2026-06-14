// ══════════════════════════════════════════════════════════════════════════════
// CARA — BEHAVIOUR TRIGGER & ESCALATION PATTERN INTELLIGENCE ENGINE
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
//
// Distinct from the behaviour-MANAGEMENT engines (which score recording quality —
// is an antecedent/strategy written down?). This engine analyses the PATTERNS in
// a child's behaviour log to support functional understanding and care planning:
//   • What are this child's recurring triggers?
//   • Is concerning behaviour escalating in intensity?
//   • Is there a recorded de-escalation strategy — especially for high-intensity
//     incidents?
//   • Is positive behaviour being reinforced (positive : concerning balance)?
//
// Knowing a child's triggers and whether behaviour is escalating is the
// foundation of a good behaviour support plan and of keeping the child and
// others safe.
//
// Regulatory: CHR 2015 Reg 11 (behaviour management — positive relationships,
// understanding behaviour), Reg 6, Reg 12. SCCIF: behaviour is understood and
// supported, restraint is a last resort.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ───────────────────────────────────────────────────────────────

export interface BehaviourChildRef {
  id: string;
  name: string;
}

export interface BehaviourEntryInput {
  child_id: string;
  date: string;            // ISO date
  direction: string;       // "positive" | "concern"/"concerning" (normalised)
  intensity: string;       // low | moderate/medium | high | critical (normalised)
  trigger: string;
  antecedent: string;
  strategy_used: string;
}

export interface BehaviourPatternInput {
  children: BehaviourChildRef[];
  entries: BehaviourEntryInput[];
  today?: string;          // ISO date — injectable for deterministic tests
}

// ── Output Types ──────────────────────────────────────────────────────────────

export type ConcernLevel = "low" | "moderate" | "high" | "critical";
export type IntensityTrajectory = "escalating" | "stable" | "improving" | "insufficient_data";

export interface TriggerCount {
  trigger: string;
  count: number;
}

export interface RecommendedAction {
  priority: "urgent" | "high" | "routine";
  action: string;
  regulatory_link: string;
}

export interface ChildBehaviourPattern {
  child_id: string;
  child_name: string;
  concerning_90d: number;
  positive_90d: number;
  reinforcement_ratio: number;          // positive per concerning (1 d.p.)
  avg_intensity: number;                // 1-4 over concerning entries (1 d.p.)
  intensity_trajectory: IntensityTrajectory;
  top_triggers: TriggerCount[];
  strategy_coverage_pct: number;        // % of concerning entries with a strategy recorded
  high_intensity_unsupported: number;   // high/critical concerning entries with no strategy
  concern_score: number;                // 0-100
  concern_level: ConcernLevel;
  flags: string[];
  recommended_actions: RecommendedAction[];
}

export interface BehaviourPatternOverview {
  children_analysed: number;
  total_concerning_90d: number;
  escalating_count: number;
  high_concern_count: number;
  avg_reinforcement_ratio: number;
  top_home_triggers: TriggerCount[];
  highest_concern_child: string | null;
}

export interface BehaviourPatternAlert {
  severity: "critical" | "high" | "medium" | "low";
  message: string;
  child_id?: string;
}

export interface CaraBehaviourInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface BehaviourTriggerPatternsResult {
  overview: BehaviourPatternOverview;
  children: ChildBehaviourPattern[];
  alerts: BehaviourPatternAlert[];
  insights: CaraBehaviourInsight[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

export const ANALYSIS_WINDOW_DAYS = 90;
export const RECENT_WINDOW_DAYS = 30;

export const INTENSITY_RANK: Record<string, number> = {
  low: 1, moderate: 2, medium: 2, high: 3, critical: 4,
};

// ── Helpers ─────────────────────────────────────────────────────────────────

export function daysAgo(date: string, today: string): number {
  return Math.floor((new Date(today).getTime() - new Date(date).getTime()) / 86_400_000);
}
function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
export function isConcern(direction: string): boolean {
  return /concern/i.test(direction ?? "");
}
export function intensityRank(intensity: string): number {
  return INTENSITY_RANK[(intensity ?? "").toLowerCase()] ?? 1;
}
export function normaliseTrigger(t: string): string {
  return (t ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function average(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function concernLevel(score: number): ConcernLevel {
  if (score >= 70) return "critical";
  if (score >= 45) return "high";
  if (score >= 20) return "moderate";
  return "low";
}

// ── Main Computation ────────────────────────────────────────────────────────

export function computeBehaviourTriggerPatterns(input: BehaviourPatternInput): BehaviourTriggerPatternsResult {
  const today = input.today ?? new Date().toISOString().slice(0, 10);
  const nameById = new Map(input.children.map((c) => [c.id, c.name]));

  const childIds = new Set<string>(input.children.map((c) => c.id));
  for (const e of input.entries) {
    const d = daysAgo(e.date, today);
    if (d >= 0 && d < ANALYSIS_WINDOW_DAYS) childIds.add(e.child_id);
  }

  const homeTriggerCounts = new Map<string, { display: string; count: number }>();

  const children: ChildBehaviourPattern[] = [];

  for (const childId of childIds) {
    if (!childId) continue;
    const all = input.entries
      .filter((e) => e.child_id === childId)
      .filter((e) => {
        const d = daysAgo(e.date, today);
        return d >= 0 && d < ANALYSIS_WINDOW_DAYS;
      });
    if (all.length === 0) continue;

    const concerning = all.filter((e) => isConcern(e.direction));
    const positive = all.filter((e) => !isConcern(e.direction));

    const concerning_90d = concerning.length;
    const positive_90d = positive.length;
    const reinforcement_ratio = concerning_90d > 0 ? round1(positive_90d / concerning_90d) : positive_90d > 0 ? positive_90d : 0;

    const intensities = concerning.map((e) => intensityRank(e.intensity));
    const avg_intensity = round1(average(intensities));

    // Intensity trajectory: recent vs prior average intensity of concerning entries.
    const recentInts = concerning.filter((e) => daysAgo(e.date, today) < RECENT_WINDOW_DAYS).map((e) => intensityRank(e.intensity));
    const priorInts = concerning.filter((e) => {
      const d = daysAgo(e.date, today);
      return d >= RECENT_WINDOW_DAYS && d < RECENT_WINDOW_DAYS * 2;
    }).map((e) => intensityRank(e.intensity));
    let intensity_trajectory: IntensityTrajectory = "insufficient_data";
    if (recentInts.length > 0 && priorInts.length > 0) {
      const diff = average(recentInts) - average(priorInts);
      intensity_trajectory = diff > 0.3 ? "escalating" : diff < -0.3 ? "improving" : "stable";
    }

    // Top triggers (among concerning entries).
    const triggerCounts = new Map<string, { display: string; count: number }>();
    for (const e of concerning) {
      const key = normaliseTrigger(e.trigger);
      if (!key) continue;
      const cur = triggerCounts.get(key) ?? { display: e.trigger.trim(), count: 0 };
      cur.count += 1;
      triggerCounts.set(key, cur);
      const home = homeTriggerCounts.get(key) ?? { display: e.trigger.trim(), count: 0 };
      home.count += 1;
      homeTriggerCounts.set(key, home);
    }
    const top_triggers: TriggerCount[] = [...triggerCounts.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((t) => ({ trigger: t.display, count: t.count }));

    // Strategy coverage.
    const withStrategy = concerning.filter((e) => (e.strategy_used ?? "").trim().length > 0).length;
    const strategy_coverage_pct = concerning_90d > 0 ? Math.round((withStrategy / concerning_90d) * 100) : 100;
    const high_intensity_unsupported = concerning.filter(
      (e) => intensityRank(e.intensity) >= 3 && (e.strategy_used ?? "").trim().length === 0,
    ).length;

    // Concern score.
    const weightedLoad = concerning.reduce((s, e) => s + intensityRank(e.intensity), 0);
    const concern_score = Math.round(clamp(
      weightedLoad * 4 +
      (intensity_trajectory === "escalating" ? 15 : 0) +
      (high_intensity_unsupported > 0 ? 10 : 0) +
      (concerning_90d > 0 && strategy_coverage_pct < 50 ? 8 : 0),
      0, 100,
    ));
    const concern_level = concernLevel(concern_score);

    // Flags.
    const flags: string[] = [];
    if (intensity_trajectory === "escalating") flags.push("Concerning behaviour is escalating in intensity");
    if (high_intensity_unsupported > 0) flags.push(`${high_intensity_unsupported} high-intensity incident${high_intensity_unsupported === 1 ? "" : "s"} with no recorded de-escalation strategy`);
    if (concerning_90d >= 3 && strategy_coverage_pct < 50) flags.push(`De-escalation strategy recorded for only ${strategy_coverage_pct}% of incidents`);
    if (concerning_90d > 0 && positive_90d === 0) flags.push("No positive behaviour recorded — reinforcement may be imbalanced");
    if (top_triggers[0] && top_triggers[0].count >= 2) flags.push(`Recurring trigger: "${top_triggers[0].trigger}" (${top_triggers[0].count}×)`);

    children.push({
      child_id: childId,
      child_name: nameById.get(childId) ?? childId,
      concerning_90d,
      positive_90d,
      reinforcement_ratio,
      avg_intensity,
      intensity_trajectory,
      top_triggers,
      strategy_coverage_pct,
      high_intensity_unsupported,
      concern_score,
      concern_level,
      flags,
      recommended_actions: buildActions(concern_level, intensity_trajectory, high_intensity_unsupported, top_triggers, positive_90d, concerning_90d),
    });
  }

  children.sort((a, b) => b.concern_score - a.concern_score);

  const top_home_triggers: TriggerCount[] = [...homeTriggerCounts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((t) => ({ trigger: t.display, count: t.count }));

  const overview = buildOverview(children, top_home_triggers);
  const alerts = buildAlerts(children);
  const insights = buildInsights(children, overview);

  return { overview, children, alerts, insights };
}

// ── Action builder ────────────────────────────────────────────────────────

function buildActions(
  level: ConcernLevel,
  trajectory: IntensityTrajectory,
  unsupported: number,
  triggers: TriggerCount[],
  positive: number,
  concerning: number,
): RecommendedAction[] {
  const actions: RecommendedAction[] = [];

  if (level === "critical" || trajectory === "escalating") {
    actions.push({
      priority: level === "critical" ? "urgent" : "high",
      action: "Review and update the behaviour support plan with the child — concerning behaviour is significant or escalating; consider therapeutic / CAMHS input",
      regulatory_link: "Reg 11 — behaviour management & positive relationships",
    });
  }
  if (unsupported > 0) {
    actions.push({
      priority: "high",
      action: "Ensure every high-intensity incident records the de-escalation strategy used, so what works can be repeated and what doesn't can be changed",
      regulatory_link: "Reg 11 / Reg 35 — behaviour management & restraint",
    });
  }
  if (triggers[0] && triggers[0].count >= 2) {
    actions.push({
      priority: "routine",
      action: `Build the recurring trigger ("${triggers[0].trigger}") into the behaviour support plan with a proactive, agreed response`,
      regulatory_link: "Reg 11 — understanding and supporting behaviour",
    });
  }
  if (concerning > 0 && positive === 0) {
    actions.push({
      priority: "routine",
      action: "Record and reinforce positive behaviour, not only incidents — a positive-to-concerning balance supports change",
      regulatory_link: "Reg 11 — positive relationships",
    });
  }
  if (actions.length === 0) {
    actions.push({
      priority: "routine",
      action: "Behaviour is well understood and supported — maintain the current approach and keep recording triggers and strategies",
      regulatory_link: "Reg 11 — behaviour management",
    });
  }
  return actions;
}

// ── Overview builder ────────────────────────────────────────────────────────

function buildOverview(children: ChildBehaviourPattern[], topHomeTriggers: TriggerCount[]): BehaviourPatternOverview {
  const top = children[0] ?? null;
  return {
    children_analysed: children.length,
    total_concerning_90d: children.reduce((s, c) => s + c.concerning_90d, 0),
    escalating_count: children.filter((c) => c.intensity_trajectory === "escalating").length,
    high_concern_count: children.filter((c) => c.concern_level === "high" || c.concern_level === "critical").length,
    avg_reinforcement_ratio: children.length > 0
      ? round1(average(children.map((c) => c.reinforcement_ratio)))
      : 0,
    top_home_triggers: topHomeTriggers,
    highest_concern_child: top && top.concern_score > 0 ? top.child_name : null,
  };
}

// ── Alerts builder ────────────────────────────────────────────────────────

function buildAlerts(children: ChildBehaviourPattern[]): BehaviourPatternAlert[] {
  const alerts: BehaviourPatternAlert[] = [];
  for (const c of children) {
    if (c.concern_level === "critical") {
      alerts.push({ severity: "critical", child_id: c.child_id, message: `${c.child_name}'s behaviour concern is critical (${c.concern_score}/100${c.intensity_trajectory === "escalating" ? ", escalating" : ""}) — review the behaviour support plan` });
    } else if (c.intensity_trajectory === "escalating") {
      alerts.push({ severity: "high", child_id: c.child_id, message: `${c.child_name}'s concerning behaviour is escalating in intensity — act before it peaks` });
    }
  }
  for (const c of children) {
    if (c.high_intensity_unsupported > 0) {
      alerts.push({ severity: "medium", child_id: c.child_id, message: `${c.child_name}: ${c.high_intensity_unsupported} high-intensity incident${c.high_intensity_unsupported === 1 ? "" : "s"} with no recorded de-escalation strategy` });
    }
  }
  return alerts;
}

// ── Cara insights builder ───────────────────────────────────────────────────

function buildInsights(children: ChildBehaviourPattern[], overview: BehaviourPatternOverview): CaraBehaviourInsight[] {
  const insights: CaraBehaviourInsight[] = [];

  const escalating = children.filter((c) => c.intensity_trajectory === "escalating");
  if (escalating.length > 0) {
    const names = escalating.slice(0, 3).map((c) => c.child_name).join(", ");
    insights.push({
      severity: "critical",
      text: `${escalating.length} child${escalating.length === 1 ? "'s" : "ren's"} concerning behaviour is escalating in intensity (${names}). Rising intensity is an early warning — review the behaviour support plan and triggers now, before behaviour peaks or restraint becomes more likely.`,
    });
  }

  if (overview.top_home_triggers.length > 0 && overview.top_home_triggers[0].count >= 3) {
    insights.push({
      severity: "warning",
      text: `The most common trigger across the home is "${overview.top_home_triggers[0].trigger}" (${overview.top_home_triggers[0].count} incidents). A shared, proactive house-wide response to this trigger could prevent a cluster of incidents.`,
    });
  }

  const unsupported = children.filter((c) => c.high_intensity_unsupported > 0);
  if (unsupported.length > 0) {
    insights.push({
      severity: "warning",
      text: `${unsupported.length} child${unsupported.length === 1 ? "" : "ren"} had high-intensity incidents with no recorded de-escalation strategy. Recording what was tried — and whether it worked — is how the team learns what helps each child and reduces restraint.`,
    });
  }

  if (children.length > 0 && escalating.length === 0 && overview.high_concern_count === 0) {
    insights.push({
      severity: "positive",
      text: `Behaviour across the home is stable or improving with strategies recorded and positive behaviour reinforced (average ${overview.avg_reinforcement_ratio} positive entries per concern). Understanding and supporting behaviour well is a core strength.`,
    });
  }

  return insights;
}
