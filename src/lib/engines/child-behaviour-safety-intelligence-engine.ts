// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CHILD BEHAVIOUR & SAFETY INTELLIGENCE ENGINE
//
// Per-child behaviour analysis: behaviour patterns, incidents, restraints,
// missing episodes, sanctions/rewards balance, sleep quality, de-escalation
// effectiveness, and behaviour support plan compliance.
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
// Injectable `today` parameter for deterministic testing.
//
// Regulatory: CHR 2015 Reg 12 (behaviour management), Reg 19 (positive
// behaviour support), Reg 20 (use of restraint), Reg 35 (BSP requirements).
// SCCIF: "Experiences and progress of children" + "Safety" domains.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export type BehaviourDirection = "positive" | "concerning";
export type BehaviourIntensity = "low" | "medium" | "high" | "severe";

export interface BehaviourEntryInput {
  id: string;
  date: string;
  time: string;                    // HH:mm
  direction: BehaviourDirection;
  intensity: BehaviourIntensity;
  title: string;
  trigger: string;
  strategy_used: string;
  outcome: string;
}

export interface IncidentInput {
  id: string;
  date: string;
  type: string;           // aggression, self_harm, absconding, property_damage, etc.
  severity: string;       // low, medium, high, critical
  description: string;
  de_escalation_attempted: boolean;
  physical_intervention: boolean;
  oversight_completed: boolean;
}

export interface RestraintInput {
  id: string;
  date: string;
  duration_minutes: number;
  reason: string;
  type: string;           // planned_hold, standing_hold, seated_hold, ground_hold, etc.
  de_escalation_attempted: boolean;
  debrief_completed: boolean;
  injuries: number;       // count of injuries sustained
  reviewed: boolean;
}

export interface MissingEpisodeInput {
  id: string;
  date: string;
  duration_hours: number;
  category: string;       // missing, absent, away_from_placement
  risk_level: string;     // low, medium, high, cs_risk
  return_interview_completed: boolean;
}

export interface SanctionRewardInput {
  id: string;
  date: string;
  direction: "reward" | "sanction";
  title: string;
  proportionate: boolean;
  child_response: string;
}

export interface SleepEntryInput {
  id: string;
  date: string;
  bedtime: string;
  wake_time: string;
  quality: number;        // 1-5
  disturbances: number;
  notes: string;
}

export interface BehaviourSupportPlanInput {
  id: string;
  status: string;         // active, review_due, expired
  last_reviewed: string;
  strategies: string[];
  triggers: string[];
  positive_approaches: string[];
}

export interface ChildBehaviourSafetyInput {
  today: string;
  child_id: string;
  child_name: string;
  behaviour_entries: BehaviourEntryInput[];
  incidents: IncidentInput[];
  restraints: RestraintInput[];
  missing_episodes: MissingEpisodeInput[];
  sanctions_rewards: SanctionRewardInput[];
  sleep_entries: SleepEntryInput[];
  behaviour_support_plan: BehaviourSupportPlanInput | null;
}

// ── Output Types ────────────────────────────────────────────────────────────

export type SafetyStatus = "stable" | "improving" | "monitoring" | "concern" | "critical";

export interface BehaviourProfile {
  total_entries_30d: number;
  positive_count_30d: number;
  concerning_count_30d: number;
  positive_ratio: number;         // 0-100
  high_severe_count_30d: number;
  trend: "improving" | "stable" | "declining" | "insufficient_data";
  top_triggers: string[];
  effective_strategies: string[];
  time_patterns: { period: string; count: number }[];
}

export interface IncidentProfile {
  total_30d: number;
  total_90d: number;
  by_type: { type: string; count: number }[];
  severity_breakdown: { severity: string; count: number }[];
  de_escalation_rate: number;     // 0-100
  trend: "increasing" | "stable" | "decreasing" | "insufficient_data";
  open_count: number;
}

export interface RestraintProfile {
  total_30d: number;
  total_90d: number;
  avg_duration_minutes: number;
  de_escalation_rate: number;     // 0-100
  debrief_rate: number;           // 0-100
  injury_count: number;
  unreviewed_count: number;
  trend: "increasing" | "stable" | "decreasing" | "insufficient_data";
}

export interface MissingProfile {
  total_30d: number;
  total_90d: number;
  avg_duration_hours: number;
  return_interview_rate: number;  // 0-100
  high_risk_count: number;
  repeat_missing: boolean;
}

export interface SanctionRewardBalance {
  rewards_30d: number;
  sanctions_30d: number;
  ratio: number;                  // rewards:sanctions (e.g., 3.0 means 3 rewards per sanction)
  proportionate_rate: number;     // 0-100
  balance_rating: "positive" | "balanced" | "sanctions_heavy" | "insufficient_data";
}

export interface SleepProfile {
  entries_14d: number;
  avg_quality: number;            // 1-5
  avg_disturbances: number;
  trend: "improving" | "stable" | "declining" | "insufficient_data";
}

export interface BspCompliance {
  has_plan: boolean;
  plan_current: boolean;
  strategies_count: number;
  triggers_documented: number;
  last_reviewed: string | null;
}

export type RecommendationUrgency = "immediate" | "soon" | "planned";

export interface SafetyRecommendation {
  rank: number;
  recommendation: string;
  urgency: RecommendationUrgency;
  domain: string;
  regulatory_ref: string;
}

export interface SafetyInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface ChildBehaviourSafetyResult {
  generated_at: string;
  child_id: string;
  child_name: string;
  safety_status: SafetyStatus;
  safety_score: number;           // 0-100
  headline: string;
  behaviour_profile: BehaviourProfile;
  incident_profile: IncidentProfile;
  restraint_profile: RestraintProfile;
  missing_profile: MissingProfile;
  sanction_reward_balance: SanctionRewardBalance;
  sleep_profile: SleepProfile;
  bsp_compliance: BspCompliance;
  strengths: string[];
  concerns: string[];
  recommendations: SafetyRecommendation[];
  insights: SafetyInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function daysAgo(today: string, date: string): number {
  return Math.round(
    (new Date(today).getTime() - new Date(date).getTime()) / 86_400_000,
  );
}

function isWithin(today: string, date: string, days: number): boolean {
  const da = daysAgo(today, date);
  return da >= 0 && da <= days;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function pct(n: number, d: number): number {
  return d > 0 ? Math.round((n / d) * 100) : 100;
}

function avg(arr: number[]): number {
  return arr.length > 0 ? Math.round((arr.reduce((s, v) => s + v, 0) / arr.length) * 10) / 10 : 0;
}

function timeToSlot(time: string): string {
  const h = parseInt(time.split(":")[0] ?? "12", 10);
  if (h < 6) return "night";
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  if (h < 21) return "evening";
  return "night";
}

// ── Main Computation ────────────────────────────────────────────────────────

export function computeChildBehaviourSafety(
  input: ChildBehaviourSafetyInput,
): ChildBehaviourSafetyResult {
  const { today, child_id, child_name, behaviour_entries, incidents, restraints, missing_episodes, sanctions_rewards, sleep_entries, behaviour_support_plan } = input;

  // ── Behaviour Profile ────────────────────────────────────────────────
  const beh30d = behaviour_entries.filter((b) => isWithin(today, b.date, 30));
  const beh60d = behaviour_entries.filter((b) => isWithin(today, b.date, 60) && !isWithin(today, b.date, 30));
  const pos30d = beh30d.filter((b) => b.direction === "positive");
  const con30d = beh30d.filter((b) => b.direction === "concerning");
  const highSevere30d = con30d.filter((b) => b.intensity === "high" || b.intensity === "severe");

  // Trend: compare concerning ratio
  const pos60d = beh60d.filter((b) => b.direction === "positive");
  const con60d = beh60d.filter((b) => b.direction === "concerning");
  const recentPosRatio = beh30d.length > 0 ? pos30d.length / beh30d.length : 0.5;
  const olderPosRatio = beh60d.length > 0 ? pos60d.length / beh60d.length : 0.5;

  const behaviourTrend: "improving" | "stable" | "declining" | "insufficient_data" =
    behaviour_entries.length < 4 ? "insufficient_data" :
    recentPosRatio > olderPosRatio + 0.1 ? "improving" :
    recentPosRatio < olderPosRatio - 0.1 ? "declining" :
    "stable";

  // Top triggers from concerning entries
  const triggerCounts: Record<string, number> = {};
  con30d.forEach((b) => {
    if (b.trigger) {
      triggerCounts[b.trigger] = (triggerCounts[b.trigger] ?? 0) + 1;
    }
  });
  const topTriggers = Object.entries(triggerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([t]) => t);

  // Effective strategies from positive outcomes
  const strategyCounts: Record<string, number> = {};
  pos30d.forEach((b) => {
    if (b.strategy_used) {
      strategyCounts[b.strategy_used] = (strategyCounts[b.strategy_used] ?? 0) + 1;
    }
  });
  const effectiveStrategies = Object.entries(strategyCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([s]) => s);

  // Time-of-day patterns for concerning behaviours
  const slotCounts: Record<string, number> = {};
  con30d.forEach((b) => {
    const slot = timeToSlot(b.time);
    slotCounts[slot] = (slotCounts[slot] ?? 0) + 1;
  });
  const timePatterns = Object.entries(slotCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([period, count]) => ({ period, count }));

  const behaviour_profile: BehaviourProfile = {
    total_entries_30d: beh30d.length,
    positive_count_30d: pos30d.length,
    concerning_count_30d: con30d.length,
    positive_ratio: pct(pos30d.length, beh30d.length),
    high_severe_count_30d: highSevere30d.length,
    trend: behaviourTrend,
    top_triggers: topTriggers,
    effective_strategies: effectiveStrategies,
    time_patterns: timePatterns,
  };

  // ── Incident Profile ─────────────────────────────────────────────────
  const inc30d = incidents.filter((i) => isWithin(today, i.date, 30));
  const inc60d = incidents.filter((i) => isWithin(today, i.date, 60) && !isWithin(today, i.date, 30));
  const inc90d = incidents.filter((i) => isWithin(today, i.date, 90));

  const typeCounts: Record<string, number> = {};
  inc90d.forEach((i) => {
    typeCounts[i.type] = (typeCounts[i.type] ?? 0) + 1;
  });
  const byType = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({ type, count }));

  const sevCounts: Record<string, number> = {};
  inc90d.forEach((i) => {
    sevCounts[i.severity] = (sevCounts[i.severity] ?? 0) + 1;
  });
  const severityBreakdown = Object.entries(sevCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([severity, count]) => ({ severity, count }));

  const deEscAttempted = inc90d.filter((i) => i.de_escalation_attempted).length;
  const openIncidents = incidents.filter((i) => !i.oversight_completed).length;

  const incidentTrend: "increasing" | "stable" | "decreasing" | "insufficient_data" =
    incidents.length < 3 ? "insufficient_data" :
    inc30d.length > inc60d.length + 1 ? "increasing" :
    inc30d.length < inc60d.length - 1 ? "decreasing" :
    "stable";

  const incident_profile: IncidentProfile = {
    total_30d: inc30d.length,
    total_90d: inc90d.length,
    by_type: byType,
    severity_breakdown: severityBreakdown,
    de_escalation_rate: pct(deEscAttempted, inc90d.length),
    trend: incidentTrend,
    open_count: openIncidents,
  };

  // ── Restraint Profile ────────────────────────────────────────────────
  const rst30d = restraints.filter((r) => isWithin(today, r.date, 30));
  const rst60d = restraints.filter((r) => isWithin(today, r.date, 60) && !isWithin(today, r.date, 30));
  const rst90d = restraints.filter((r) => isWithin(today, r.date, 90));

  const rstDurations = rst90d.map((r) => r.duration_minutes);
  const rstDebriefed = rst90d.filter((r) => r.debrief_completed).length;
  const rstDeEsc = rst90d.filter((r) => r.de_escalation_attempted).length;
  const rstInjuries = rst90d.reduce((s, r) => s + r.injuries, 0);
  const rstUnreviewed = restraints.filter((r) => !r.reviewed).length;

  const restraintTrend: "increasing" | "stable" | "decreasing" | "insufficient_data" =
    restraints.length < 2 ? "insufficient_data" :
    rst30d.length > rst60d.length + 1 ? "increasing" :
    rst30d.length < rst60d.length - 1 ? "decreasing" :
    "stable";

  const restraint_profile: RestraintProfile = {
    total_30d: rst30d.length,
    total_90d: rst90d.length,
    avg_duration_minutes: avg(rstDurations),
    de_escalation_rate: pct(rstDeEsc, rst90d.length),
    debrief_rate: pct(rstDebriefed, rst90d.length),
    injury_count: rstInjuries,
    unreviewed_count: rstUnreviewed,
    trend: restraintTrend,
  };

  // ── Missing Profile ──────────────────────────────────────────────────
  const miss30d = missing_episodes.filter((m) => isWithin(today, m.date, 30));
  const miss90d = missing_episodes.filter((m) => isWithin(today, m.date, 90));
  const missDurations = miss90d.map((m) => m.duration_hours);
  const missRI = miss90d.filter((m) => m.return_interview_completed).length;
  const highRisk = miss90d.filter((m) => m.risk_level === "high" || m.risk_level === "cs_risk").length;
  const repeatMissing = miss90d.length >= 3;

  const missing_profile: MissingProfile = {
    total_30d: miss30d.length,
    total_90d: miss90d.length,
    avg_duration_hours: avg(missDurations),
    return_interview_rate: pct(missRI, miss90d.length),
    high_risk_count: highRisk,
    repeat_missing: repeatMissing,
  };

  // ── Sanction / Reward Balance ────────────────────────────────────────
  const sr30d = sanctions_rewards.filter((sr) => isWithin(today, sr.date, 30));
  const rewards30d = sr30d.filter((sr) => sr.direction === "reward");
  const sanctions30d = sr30d.filter((sr) => sr.direction === "sanction");
  const proportionateCount = sr30d.filter((sr) => sr.proportionate).length;

  const ratio = sanctions30d.length > 0 ? Math.round((rewards30d.length / sanctions30d.length) * 10) / 10 : rewards30d.length > 0 ? rewards30d.length : 0;

  const balanceRating: "positive" | "balanced" | "sanctions_heavy" | "insufficient_data" =
    sr30d.length < 2 ? "insufficient_data" :
    ratio >= 3 ? "positive" :
    ratio >= 1 ? "balanced" :
    "sanctions_heavy";

  const sanction_reward_balance: SanctionRewardBalance = {
    rewards_30d: rewards30d.length,
    sanctions_30d: sanctions30d.length,
    ratio,
    proportionate_rate: pct(proportionateCount, sr30d.length),
    balance_rating: balanceRating,
  };

  // ── Sleep Profile ────────────────────────────────────────────────────
  const sleep14d = sleep_entries.filter((s) => isWithin(today, s.date, 14));
  const sleep14dOlder = sleep_entries.filter((s) => isWithin(today, s.date, 28) && !isWithin(today, s.date, 14));
  const recentSleepAvg = avg(sleep14d.map((s) => s.quality));
  const olderSleepAvg = avg(sleep14dOlder.map((s) => s.quality));

  const sleepTrend: "improving" | "stable" | "declining" | "insufficient_data" =
    sleep_entries.length < 4 ? "insufficient_data" :
    recentSleepAvg > olderSleepAvg + 0.3 ? "improving" :
    recentSleepAvg < olderSleepAvg - 0.3 ? "declining" :
    "stable";

  const sleep_profile: SleepProfile = {
    entries_14d: sleep14d.length,
    avg_quality: avg(sleep14d.map((s) => s.quality)),
    avg_disturbances: avg(sleep14d.map((s) => s.disturbances)),
    trend: sleepTrend,
  };

  // ── BSP Compliance ───────────────────────────────────────────────────
  const bsp = behaviour_support_plan;
  const bspCurrent = bsp ? (bsp.status === "active" || (bsp.last_reviewed && daysAgo(today, bsp.last_reviewed) <= 90)) : false;

  const bsp_compliance: BspCompliance = {
    has_plan: !!bsp,
    plan_current: bspCurrent,
    strategies_count: bsp?.strategies.length ?? 0,
    triggers_documented: bsp?.triggers.length ?? 0,
    last_reviewed: bsp?.last_reviewed?.slice(0, 10) ?? null,
  };

  // ── Safety Score (0-100) ──────────────────────────────────────────────
  let score = 50;

  // Behaviour balance
  if (behaviour_profile.positive_ratio >= 70) score += 10;
  else if (behaviour_profile.positive_ratio >= 50) score += 3;
  else if (behaviour_profile.positive_ratio < 30 && beh30d.length >= 3) score -= 10;

  if (behaviourTrend === "improving") score += 5;
  else if (behaviourTrend === "declining") score -= 5;

  if (highSevere30d.length >= 3) score -= 8;
  else if (highSevere30d.length === 0 && con30d.length > 0) score += 3;

  // Incidents
  if (inc30d.length === 0) score += 5;
  else if (inc30d.length >= 3) score -= 5;
  if (inc30d.some((i) => i.severity === "critical")) score -= 8;
  if (incidentTrend === "decreasing") score += 3;
  else if (incidentTrend === "increasing") score -= 5;
  if (incident_profile.de_escalation_rate === 100 && inc90d.length > 0) score += 3;

  // Restraints
  if (rst30d.length === 0) score += 5;
  else if (rst30d.length >= 2) score -= 5;
  if (rstInjuries > 0) score -= 5;
  if (restraint_profile.debrief_rate === 100 && rst90d.length > 0) score += 3;
  else if (restraint_profile.debrief_rate < 80 && rst90d.length > 0) score -= 3;
  if (rstUnreviewed > 0) score -= 3;

  // Missing
  if (miss30d.length === 0) score += 3;
  else if (miss30d.length >= 2) score -= 5;
  if (highRisk > 0) score -= 5;
  if (repeatMissing) score -= 3;
  if (missing_profile.return_interview_rate === 100 && miss90d.length > 0) score += 2;

  // Sanctions / Rewards
  if (balanceRating === "positive") score += 3;
  else if (balanceRating === "sanctions_heavy") score -= 5;

  // Sleep
  if (sleep_profile.avg_quality >= 4) score += 3;
  else if (sleep_profile.avg_quality > 0 && sleep_profile.avg_quality < 2.5) score -= 5;

  // BSP
  if (bsp_compliance.has_plan && bspCurrent) score += 3;
  else if (con30d.length >= 3 && !bsp_compliance.has_plan) score -= 5;

  score = clamp(Math.round(score), 0, 100);

  const safety_status: SafetyStatus =
    score >= 75 ? (behaviourTrend === "improving" ? "improving" : "stable") :
    score >= 60 ? "monitoring" :
    score >= 40 ? "concern" :
    "critical";

  // ── Headline ──────────────────────────────────────────────────────────
  const parts: string[] = [];
  parts.push(`${child_name}'s behaviour safety status is ${safety_status}`);
  if (beh30d.length > 0) {
    parts.push(`${behaviour_profile.positive_ratio}% positive behaviours recorded`);
  }
  if (inc30d.length > 0) parts.push(`${inc30d.length} incident${inc30d.length !== 1 ? "s" : ""} in 30d`);
  if (rst30d.length > 0) parts.push(`${rst30d.length} restraint${rst30d.length !== 1 ? "s" : ""} in 30d`);
  if (miss30d.length > 0) parts.push(`${miss30d.length} missing episode${miss30d.length !== 1 ? "s" : ""} in 30d`);
  const headline = parts.join(". ") + ".";

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];

  if (behaviour_profile.positive_ratio >= 70 && beh30d.length >= 5) {
    strengths.push(`${behaviour_profile.positive_ratio}% of recorded behaviours are positive — evidencing a strengths-based approach (Reg 12).`);
  }

  if (behaviourTrend === "improving") {
    strengths.push(`${child_name}'s behaviour trajectory is improving — positive behaviours are increasing relative to the previous period.`);
  }

  if (inc30d.length === 0 && incidents.length > 0) {
    strengths.push("No incidents recorded in the last 30 days — a sustained period of safety.");
  }

  if (rst30d.length === 0 && restraints.length > 0) {
    strengths.push("No physical interventions required in the last 30 days — de-escalation approaches are working effectively.");
  }

  if (restraint_profile.debrief_rate === 100 && rst90d.length > 0) {
    strengths.push(`All ${rst90d.length} restraints debriefed — meeting best practice for post-incident support (Reg 20).`);
  }

  if (incident_profile.de_escalation_rate === 100 && inc90d.length > 0) {
    strengths.push("De-escalation attempted in 100% of incidents — demonstrating commitment to positive behaviour support.");
  }

  if (balanceRating === "positive" && sr30d.length >= 3) {
    strengths.push(`Reward-to-sanction ratio of ${ratio}:1 — positive reinforcement is the dominant approach (Reg 19).`);
  }

  if (missing_profile.return_interview_rate === 100 && miss90d.length > 0) {
    strengths.push("100% return interviews completed — meeting statutory requirement for all missing episodes.");
  }

  if (bsp_compliance.has_plan && bspCurrent) {
    strengths.push("Behaviour support plan is current with documented strategies and triggers — proactive care planning.");
  }

  if (sleep_profile.avg_quality >= 4 && sleep14d.length >= 3) {
    strengths.push(`Good sleep quality (avg ${sleep_profile.avg_quality}/5) — supporting ${child_name}'s emotional regulation and wellbeing.`);
  }

  if (effectiveStrategies.length >= 2) {
    strengths.push(`Multiple effective strategies identified: ${effectiveStrategies.join(", ")}.`);
  }

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];

  if (behaviour_profile.positive_ratio < 30 && beh30d.length >= 5) {
    concerns.push(`Only ${behaviour_profile.positive_ratio}% of behaviours are positive — the recording is heavily weighted toward concerning entries. Review whether positive behaviours are being systematically captured (Reg 12).`);
  }

  if (highSevere30d.length >= 3) {
    concerns.push(`${highSevere30d.length} high/severe concerning behaviours in 30 days — consider whether current strategies are adequate and whether additional therapeutic input is needed.`);
  }

  if (behaviourTrend === "declining") {
    concerns.push(`${child_name}'s behaviour pattern is declining — more concerning behaviours relative to the previous period. Review triggers and consider BSP update.`);
  }

  if (inc30d.some((i) => i.severity === "critical")) {
    concerns.push(`Critical severity incident(s) recorded in the past 30 days — these require immediate review, senior oversight, and may need notification to Ofsted/LADO.`);
  }

  if (incidentTrend === "increasing") {
    concerns.push("Incident frequency is increasing — review environmental factors, staffing consistency, and potential underlying triggers.");
  }

  if (openIncidents > 0) {
    concerns.push(`${openIncidents} incident${openIncidents !== 1 ? "s" : ""} awaiting oversight — all incidents must be reviewed by a manager (Reg 40).`);
  }

  if (rst30d.length >= 2) {
    concerns.push(`${rst30d.length} physical interventions in 30 days — review whether restraint reduction strategies are effective and BSP is being followed (Reg 20).`);
  }

  if (rstInjuries > 0) {
    concerns.push(`${rstInjuries} injury/ies recorded during restraints — each must be documented, medically assessed, and reported to the Registered Manager (Reg 20).`);
  }

  if (restraint_profile.debrief_rate < 80 && rst90d.length >= 2) {
    concerns.push(`Restraint debrief rate at ${restraint_profile.debrief_rate}% — debriefs must occur after every physical intervention to support the child and review necessity (Reg 20).`);
  }

  if (rstUnreviewed > 0) {
    concerns.push(`${rstUnreviewed} unreviewed restraint${rstUnreviewed !== 1 ? "s" : ""} — all restraints require managerial review (Reg 20).`);
  }

  if (miss30d.length >= 2) {
    concerns.push(`${miss30d.length} missing episodes in 30 days — review risk assessment, triggers for absconding, and whether missing protocol is being followed.`);
  }

  if (highRisk > 0) {
    concerns.push(`${highRisk} high-risk/CS-risk missing episode${highRisk !== 1 ? "s" : ""} in 90 days — escalation to placing authority and police is mandatory.`);
  }

  if (missing_profile.return_interview_rate < 100 && miss90d.length > 0) {
    concerns.push(`Return interview completion rate at ${missing_profile.return_interview_rate}% — all children returning from missing must receive an independent return interview.`);
  }

  if (balanceRating === "sanctions_heavy") {
    concerns.push("Sanctions outweigh rewards — the approach may feel punitive to the child. Review whether positive behaviours are being recognised and rewarded (Reg 19).");
  }

  if (sleep_profile.avg_quality > 0 && sleep_profile.avg_quality < 2.5 && sleep14d.length >= 3) {
    concerns.push(`Poor sleep quality (avg ${sleep_profile.avg_quality}/5) — disrupted sleep can escalate challenging behaviours. Review bedtime routine and environmental factors.`);
  }

  if (con30d.length >= 3 && !bsp_compliance.has_plan) {
    concerns.push(`${con30d.length} concerning behaviours recorded but no behaviour support plan in place — a BSP should be developed with the child's input (Reg 35).`);
  }

  // ── Recommendations ───────────────────────────────────────────────────
  const recommendations: SafetyRecommendation[] = [];
  let rank = 0;

  if (inc30d.some((i) => i.severity === "critical")) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Conduct immediate review of critical incident(s). Ensure Ofsted/LADO notification completed. Convene professionals meeting within 48 hours.",
      urgency: "immediate",
      domain: "incidents",
      regulatory_ref: "Reg 40",
    });
  }

  if (rst30d.length >= 2 && restraint_profile.debrief_rate < 100) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Complete outstanding restraint debriefs. Review restraint reduction strategy with team. Consider whether additional de-escalation training is needed.",
      urgency: "immediate",
      domain: "restraints",
      regulatory_ref: "Reg 20",
    });
  }

  if (highRisk > 0 && missing_profile.return_interview_rate < 100) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Arrange independent return interviews for all outstanding missing episodes. Update missing risk assessment and share with placing authority.",
      urgency: "immediate",
      domain: "missing",
      regulatory_ref: "Reg 34",
    });
  }

  if (con30d.length >= 3 && !bsp_compliance.has_plan) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Develop a behaviour support plan for ${child_name} — include identified triggers (${topTriggers.join(", ") || "unknown"}), de-escalation strategies, and positive approaches. Involve the child in development.`,
      urgency: "soon",
      domain: "bsp",
      regulatory_ref: "Reg 35",
    });
  }

  if (balanceRating === "sanctions_heavy") {
    recommendations.push({
      rank: ++rank,
      recommendation: "Rebalance approach to emphasise rewards and positive recognition. Team to actively document positive behaviours and use reward systems aligned to child's interests.",
      urgency: "soon",
      domain: "sanctions_rewards",
      regulatory_ref: "Reg 19",
    });
  }

  if (behaviourTrend === "declining") {
    recommendations.push({
      rank: ++rank,
      recommendation: `Review ${child_name}'s behaviour trajectory with key worker and therapist. Consider whether recent changes (placement, contact, school) are contributing. Update BSP if needed.`,
      urgency: "soon",
      domain: "behaviour",
      regulatory_ref: "Reg 12",
    });
  }

  if (openIncidents > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Complete oversight for ${openIncidents} outstanding incident${openIncidents !== 1 ? "s" : ""}. Manager review ensures learning and consistency.`,
      urgency: "soon",
      domain: "incidents",
      regulatory_ref: "Reg 40",
    });
  }

  if (sleep_profile.avg_quality > 0 && sleep_profile.avg_quality < 2.5 && sleep14d.length >= 3) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Review sleep hygiene routine. Consider environmental factors (noise, temperature, light), screen time boundaries, and whether anxiety is disrupting sleep.",
      urgency: "planned",
      domain: "sleep",
      regulatory_ref: "Reg 7",
    });
  }

  if (rstUnreviewed > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Complete managerial review of all outstanding restraints. Document learning and share with team.",
      urgency: "planned",
      domain: "restraints",
      regulatory_ref: "Reg 20",
    });
  }

  // ── ARIA Insights ─────────────────────────────────────────────────────
  const insights: SafetyInsight[] = [];

  if (safety_status === "critical") {
    insights.push({
      severity: "critical",
      text: `${child_name}'s behaviour and safety status is critical. Multiple risk indicators are present — high incident frequency, restraint concerns, or declining behaviour patterns require urgent multi-agency review. Ofsted inspectors will scrutinise the home's response to these patterns under Reg 12 and Reg 20.`,
    });
  }

  if (highSevere30d.length >= 3 && rst30d.length >= 2) {
    insights.push({
      severity: "critical",
      text: `Pattern detected: ${highSevere30d.length} high/severe behaviours combined with ${rst30d.length} restraints in 30 days suggests current strategies are not preventing escalation. An urgent review of ${child_name}'s behaviour support plan, therapeutic input, and environmental factors is needed.`,
    });
  }

  if (repeatMissing && highRisk > 0) {
    insights.push({
      severity: "critical",
      text: `${child_name} has repeat missing episodes including high-risk events. This pattern indicates exploitation vulnerability or placement instability. A multi-agency strategy meeting should be convened — police, social worker, and missing coordinator must be involved.`,
    });
  }

  if (timePatterns.length > 0 && timePatterns[0].count >= 3) {
    insights.push({
      severity: "warning",
      text: `Behaviour pattern: concerning behaviours cluster in the ${timePatterns[0].period} (${timePatterns[0].count} incidents in 30d). Consider adjusting staffing, routine, or activities during this period to provide additional support.`,
    });
  }

  if (topTriggers.length > 0 && con30d.length >= 3) {
    insights.push({
      severity: "warning",
      text: `Top identified triggers: ${topTriggers.join(", ")}. Proactively addressing these triggers through environmental adaptation and pre-emptive support could reduce escalation patterns.`,
    });
  }

  if (safety_status === "stable" || safety_status === "improving") {
    insights.push({
      severity: "positive",
      text: `${child_name}'s behaviour and safety status is ${safety_status}. ${safety_status === "improving" ? "Positive behaviours are increasing and risk indicators are reducing — the current approach is working." : "Current strategies are maintaining stability — continue consistent approaches."}`,
    });
  }

  if (behaviourTrend === "improving" && behaviour_profile.positive_ratio >= 60) {
    insights.push({
      severity: "positive",
      text: `${child_name} shows an improving behaviour trajectory with ${behaviour_profile.positive_ratio}% positive entries. This pattern demonstrates the effectiveness of current positive behaviour support strategies — ensure the team maintains consistency.`,
    });
  }

  if (rst30d.length === 0 && restraints.length > 0 && inc30d.length === 0) {
    insights.push({
      severity: "positive",
      text: `Zero restraints and zero incidents in the past 30 days for ${child_name}. This sustained period of safety demonstrates effective de-escalation and proactive support — exactly what Ofsted looks for under Reg 20.`,
    });
  }

  return {
    generated_at: today,
    child_id,
    child_name,
    safety_status,
    safety_score: score,
    headline,
    behaviour_profile,
    incident_profile,
    restraint_profile,
    missing_profile,
    sanction_reward_balance,
    sleep_profile,
    bsp_compliance,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
