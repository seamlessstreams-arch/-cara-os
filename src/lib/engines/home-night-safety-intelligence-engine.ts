// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME NIGHT SAFETY INTELLIGENCE ENGINE
// Home-level engine aggregating overnight safety: welfare check completion
// rates, night disturbances, overnight incidents, security compliance,
// staffing coverage, and children's sleep quality patterns.
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
// Injectable `today` parameter for deterministic testing.
//
// Regulatory: CHR 2015 Reg 12 (health & safety), Reg 34 (welfare of children),
// Reg 25 (notification of significant events). SCCIF: "Safety of children."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface ChildRef {
  id: string;
  name: string;
}

export interface WelfareCheckInput {
  child_id: string;
  date: string;
  time: string;
  status: string;       // asleep, awake_settled, awake_unsettled, not_in_room, etc.
  mood?: string;
}

export interface NightCheckInput {
  child_id: string;
  date: string;
  time: string;
  status: string;       // asleep, awake_settled, awake_unsettled, not_in_room, refused_entry
}

export interface NightIncidentInput {
  date: string;
  child_id: string | null;
  incident_type: string;
  escalated: boolean;
}

export interface NightLogSummary {
  date: string;
  has_waking_night: boolean;
  has_sleep_in: boolean;
  check_count: number;
  incident_count: number;
  security_issues: number;
  has_concerns: boolean;
}

export interface SleepDisturbanceInput {
  child_id: string;
  date: string;
  duration_minutes: number;
}

export interface HomeNightSafetyInput {
  today: string;
  children: ChildRef[];
  welfare_checks: WelfareCheckInput[];       // Night-time welfare checks
  night_checks: NightCheckInput[];           // From night log entries
  night_incidents: NightIncidentInput[];     // Night-time incidents
  night_logs: NightLogSummary[];             // Summarised night log data
  sleep_disturbances: SleepDisturbanceInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type NightSafetyRating = "outstanding" | "good" | "adequate" | "inadequate" | "insufficient_data";

export interface CheckComplianceOverview {
  nights_with_checks_30d: number;
  total_nights_30d: number;
  compliance_rate: number;            // % of nights with checks completed
  // fab-0: null when no checks in the 30-day window.
  children_checked_per_night_avg: number | null;
  all_children_checked_rate: number;  // % of nights where all children were checked
}

export interface DisturbanceOverview {
  total_disturbances_7d: number;
  total_disturbances_30d: number;
  children_with_disturbances: string[];
  // fab-0: null when no nights with disturbances in the 30-day window.
  avg_per_night_30d: number | null;
}

export interface NightIncidentOverview {
  total_incidents_7d: number;
  total_incidents_30d: number;
  escalated_count_30d: number;
  incident_types: Array<{ type: string; count: number }>;
}

export interface ChildNightProfile {
  child_id: string;
  child_name: string;
  checks_received_30d: number;
  nights_unsettled_30d: number;
  nights_not_in_room_30d: number;
  disturbances_30d: number;
  incidents_30d: number;
  night_safety_score: number;   // 0-100
  flags: string[];
}

export interface NightSafetyRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  domain: string;
  regulatory_ref: string;
}

export interface NightSafetyInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface HomeNightSafetyResult {
  generated_at: string;
  night_safety_rating: NightSafetyRating;
  night_safety_score: number;          // 0-100
  headline: string;
  check_compliance: CheckComplianceOverview;
  disturbances: DisturbanceOverview;
  night_incidents: NightIncidentOverview;
  child_profiles: ChildNightProfile[];
  children_of_concern: string[];
  strengths: string[];
  concerns: string[];
  recommendations: NightSafetyRecommendation[];
  insights: NightSafetyInsight[];
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

// Call sites guarantee d > 0 (fixed literals or Math.max(x, 1)), so no
// fab-0 fallback needed. Adding one would fabricate 0% on empty inputs.
function pct(n: number, d: number): number {
  return Math.round((n / d) * 100);
}

// Call sites guarantee values.length > 0 (see avgChildScore gate at L304),
// so no fab-0 fallback needed. Adding one would fabricate 0 on empty inputs.
function avg(values: number[]): number {
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

function isUnsettled(status: string): boolean {
  return status === "awake_unsettled" || status === "not_in_room" || status === "refused_entry";
}

// ── Main Computation ────────────────────────────────────────────────────────

export function computeHomeNightSafety(
  input: HomeNightSafetyInput,
): HomeNightSafetyResult {
  const { today, children, welfare_checks, night_checks, night_incidents, night_logs, sleep_disturbances } = input;

  // Combine welfare checks + night checks for a unified view
  const allChecks30d = [
    ...welfare_checks.filter((c) => isWithin(today, c.date, 30)),
    ...night_checks.filter((c) => isWithin(today, c.date, 30)),
  ];
  const allChecks7d = [
    ...welfare_checks.filter((c) => isWithin(today, c.date, 7)),
    ...night_checks.filter((c) => isWithin(today, c.date, 7)),
  ];

  const incidents30d = night_incidents.filter((i) => isWithin(today, i.date, 30));
  const incidents7d = night_incidents.filter((i) => isWithin(today, i.date, 7));
  const disturb30d = sleep_disturbances.filter((d) => isWithin(today, d.date, 30));
  const disturb7d = sleep_disturbances.filter((d) => isWithin(today, d.date, 7));
  const logs30d = night_logs.filter((l) => isWithin(today, l.date, 30));

  // ── Per-Child Night Profiles ─────────────────────────────────────────
  const child_profiles: ChildNightProfile[] = children.map((c) => {
    const myChecks = allChecks30d.filter((ch) => ch.child_id === c.id);
    const unsettled = myChecks.filter((ch) => isUnsettled(ch.status));
    const notInRoom = myChecks.filter((ch) => ch.status === "not_in_room");
    const myDisturb = disturb30d.filter((d) => d.child_id === c.id);
    const myIncidents = incidents30d.filter((i) => i.child_id === c.id);

    let score = 70; // Start higher — night safety is a positive baseline
    if (myChecks.length >= 15) score += 5; // Good check coverage
    else if (myChecks.length < 5 && children.length > 0) score -= 10;

    if (unsettled.length === 0) score += 5;
    if (unsettled.length >= 5) score -= 15;
    else if (unsettled.length >= 2) score -= 5;

    if (notInRoom.length > 0) score -= notInRoom.length * 5;
    if (myDisturb.length === 0) score += 5;
    if (myDisturb.length >= 5) score -= 10;
    else if (myDisturb.length >= 2) score -= 3;

    if (myIncidents.length === 0) score += 5;
    if (myIncidents.length >= 3) score -= 10;
    if (myIncidents.some((i) => i.escalated)) score -= 5;

    score = clamp(score, 0, 100);

    const flags: string[] = [];
    if (unsettled.length >= 3) flags.push(`Unsettled ${unsettled.length} nights`);
    if (notInRoom.length > 0) flags.push(`Not in room ${notInRoom.length} time${notInRoom.length !== 1 ? "s" : ""}`);
    if (myDisturb.length >= 3) flags.push(`${myDisturb.length} disturbances`);
    if (myIncidents.length >= 2) flags.push(`${myIncidents.length} night incidents`);
    if (myChecks.length < 5) flags.push("Few overnight checks");

    return {
      child_id: c.id,
      child_name: c.name,
      checks_received_30d: myChecks.length,
      nights_unsettled_30d: unsettled.length,
      nights_not_in_room_30d: notInRoom.length,
      disturbances_30d: myDisturb.length,
      incidents_30d: myIncidents.length,
      night_safety_score: score,
      flags,
    };
  }).sort((a, b) => a.night_safety_score - b.night_safety_score);

  // ── Check Compliance ─────────────────────────────────────────────────
  const nightDates30d = new Set<string>();
  for (let i = 0; i <= 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    nightDates30d.add(d.toISOString().slice(0, 10));
  }

  const datesWithChecks = new Set([
    ...allChecks30d.map((c) => c.date),
    ...logs30d.map((l) => l.date),
  ]);

  const nightsWithChecks = [...nightDates30d].filter((d) => datesWithChecks.has(d)).length;

  // All children checked rate — for nights that have checks
  const checkDates = [...new Set(allChecks30d.map((c) => c.date))];
  const allChildrenCheckedNights = checkDates.filter((date) => {
    const checksThisNight = allChecks30d.filter((c) => c.date === date);
    const childrenChecked = new Set(checksThisNight.map((c) => c.child_id));
    return children.every((c) => childrenChecked.has(c.id));
  });

  // fab-0: null when no check dates in window.
  const avgChildrenPerNight: number | null = checkDates.length > 0
    ? Math.round((allChecks30d.length / checkDates.length) * 10) / 10
    : null;

  const check_compliance: CheckComplianceOverview = {
    nights_with_checks_30d: nightsWithChecks,
    total_nights_30d: 31,
    compliance_rate: pct(nightsWithChecks, 31),
    children_checked_per_night_avg: avgChildrenPerNight,
    all_children_checked_rate: pct(allChildrenCheckedNights.length, Math.max(checkDates.length, 1)),
  };

  // ── Disturbances ─────────────────────────────────────────────────────
  const childrenWithDisturb = [...new Set(disturb30d.map((d) => d.child_id))];
  const disturbChildNames = childrenWithDisturb
    .map((id) => children.find((c) => c.id === id)?.name ?? id);
  const nightsWithDisturb = [...new Set(disturb30d.map((d) => d.date))].length;

  const disturbances: DisturbanceOverview = {
    total_disturbances_7d: disturb7d.length,
    total_disturbances_30d: disturb30d.length,
    children_with_disturbances: disturbChildNames,
    // fab-0: null when no disturbance nights.
    avg_per_night_30d: nightsWithDisturb > 0 ? Math.round((disturb30d.length / nightsWithDisturb) * 10) / 10 : null,
  };

  // ── Night Incidents ──────────────────────────────────────────────────
  const incTypeCounts = new Map<string, number>();
  for (const inc of incidents30d) {
    incTypeCounts.set(inc.incident_type, (incTypeCounts.get(inc.incident_type) ?? 0) + 1);
  }

  const night_incidents_overview: NightIncidentOverview = {
    total_incidents_7d: incidents7d.length,
    total_incidents_30d: incidents30d.length,
    escalated_count_30d: incidents30d.filter((i) => i.escalated).length,
    incident_types: [...incTypeCounts.entries()]
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count),
  };

  // ── Children of Concern ──────────────────────────────────────────────
  const children_of_concern = child_profiles
    .filter((p) => p.night_safety_score < 50 || p.flags.length >= 2)
    .map((p) => p.child_name);

  // ── Composite Night Safety Score ─────────────────────────────────────
  const avgChildScore = child_profiles.length > 0
    ? avg(child_profiles.map((p) => p.night_safety_score))
    : 50;

  let score = Math.round(avgChildScore);

  // Home-wide adjustments
  if (check_compliance.compliance_rate >= 90) score += 5;
  else if (check_compliance.compliance_rate < 50) score -= 10;

  if (check_compliance.all_children_checked_rate >= 90) score += 3;
  else if (check_compliance.all_children_checked_rate < 50 && checkDates.length > 0) score -= 5;

  if (incidents30d.length === 0) score += 3;
  if (incidents30d.length >= 5) score -= 5;
  if (incidents30d.filter((i) => i.escalated).length >= 2) score -= 5;

  if (children_of_concern.length > 0) score -= children_of_concern.length * 2;
  if (children_of_concern.length === 0 && children.length > 0) score += 3;

  score = clamp(score, 0, 100);

  const hasData = allChecks30d.length > 0 || logs30d.length > 0 || incidents30d.length > 0;

  const night_safety_rating: NightSafetyRating =
    !hasData && children.length > 0 ? "insufficient_data" :
    children.length === 0 ? "insufficient_data" :
    score >= 80 ? "outstanding" :
    score >= 65 ? "good" :
    score >= 45 ? "adequate" :
    "inadequate";

  // ── Headline ──────────────────────────────────────────────────────────
  const parts: string[] = [];
  parts.push(`Night safety: ${night_safety_rating}`);
  if (check_compliance.compliance_rate > 0) parts.push(`${check_compliance.compliance_rate}% check compliance`);
  if (incidents30d.length > 0) parts.push(`${incidents30d.length} night incident${incidents30d.length !== 1 ? "s" : ""} (30d)`);
  if (children_of_concern.length > 0) parts.push(`${children_of_concern.length} child${children_of_concern.length !== 1 ? "ren" : ""} of concern`);
  if (disturb30d.length > 0) parts.push(`${disturb30d.length} disturbance${disturb30d.length !== 1 ? "s" : ""}`);
  const headline = parts.join(". ") + ".";

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];

  if (night_safety_rating === "outstanding" || night_safety_rating === "good") {
    strengths.push(`Night safety rated ${night_safety_rating} (${score}%). Overnight care is well-managed with consistent welfare checks, minimal disturbances, and effective incident response.`);
  }

  if (check_compliance.compliance_rate >= 90 && nightsWithChecks >= 5) {
    strengths.push(`${check_compliance.compliance_rate}% overnight welfare check compliance. Consistent night-time monitoring demonstrates robust safeguarding practice and duty of care.`);
  }

  if (check_compliance.all_children_checked_rate >= 90 && checkDates.length >= 3) {
    strengths.push(`All children checked on ${check_compliance.all_children_checked_rate}% of nights. Every child is accounted for during overnight hours — this is fundamental safeguarding practice.`);
  }

  if (incidents30d.length === 0 && allChecks30d.length >= 5) {
    strengths.push("Zero night-time incidents in the last 30 days. A calm, safe overnight environment supports children's sleep, wellbeing, and emotional regulation.");
  }

  if (children_of_concern.length === 0 && children.length >= 2 && allChecks30d.length >= 5) {
    strengths.push("No children flagged as night-time concerns. All children appear to be sleeping well and settled during overnight hours.");
  }

  const settledChildren = child_profiles.filter((p) => p.nights_unsettled_30d === 0 && p.disturbances_30d === 0 && p.incidents_30d === 0);
  if (settledChildren.length >= 2) {
    strengths.push(`${settledChildren.length} of ${children.length} children have had zero disturbances, incidents, or unsettled nights. The home provides a calm night-time environment.`);
  }

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];

  if (!hasData && children.length > 0) {
    concerns.push("No overnight monitoring data recorded in 30 days. Night-time welfare checks must be documented to evidence safeguarding compliance. This is a regulatory requirement under Reg 34.");
  }

  if (check_compliance.compliance_rate < 50 && check_compliance.total_nights_30d > 0 && hasData) {
    concerns.push(`Only ${check_compliance.compliance_rate}% of nights have documented welfare checks. Overnight checks should happen every night — gaps in monitoring create safeguarding risks.`);
  }

  if (check_compliance.all_children_checked_rate < 70 && checkDates.length >= 3) {
    concerns.push(`All children were checked on only ${check_compliance.all_children_checked_rate}% of monitored nights. Every child must be checked during overnight rounds — missing children creates unacceptable risk.`);
  }

  if (children_of_concern.length > 0) {
    concerns.push(`${children_of_concern.length} child${children_of_concern.length !== 1 ? "ren" : ""} flagged with night-time concerns: ${children_of_concern.join(", ")}. Individual overnight care plans should be reviewed.`);
  }

  if (incidents30d.filter((i) => i.escalated).length >= 2) {
    concerns.push(`${incidents30d.filter((i) => i.escalated).length} escalated night incidents in 30 days. Repeated escalation overnight may indicate systemic issues — review staffing levels, de-escalation strategies, and environmental factors.`);
  }

  const unsettledChildren = child_profiles.filter((p) => p.nights_unsettled_30d >= 3);
  if (unsettledChildren.length >= 2) {
    concerns.push(`${unsettledChildren.length} children have been unsettled 3+ nights. When multiple children are unsettled overnight, consider environmental factors (noise, temperature, routine) alongside individual needs.`);
  }

  // ── Recommendations ───────────────────────────────────────────────────
  const recommendations: NightSafetyRecommendation[] = [];
  let rank = 0;

  if (!hasData && children.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Implement nightly welfare check documentation immediately. Use the night log system to record every check, noting each child's status, mood, and any concerns.",
      urgency: "immediate",
      domain: "compliance",
      regulatory_ref: "Reg 34",
    });
  }

  if (check_compliance.compliance_rate < 70 && hasData) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Improve overnight check consistency. Set reminders for waking night staff and ensure sleep-in staff complete at least two rounds. Target 100% nightly compliance.",
      urgency: "soon",
      domain: "monitoring",
      regulatory_ref: "Reg 34",
    });
  }

  if (children_of_concern.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Review overnight care plans for ${children_of_concern.join(", ")}. Consider individual wind-down routines, sleep assessments, and whether additional support is needed.`,
      urgency: "soon",
      domain: "individual_care",
      regulatory_ref: "Reg 12",
    });
  }

  if (incidents30d.length >= 3) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Analyse patterns in night-time incidents. Are they happening at similar times? Involving the same children? Consider adjusting night-time routines, staffing, or environmental factors.",
      urgency: "soon",
      domain: "incident_reduction",
      regulatory_ref: "Reg 12",
    });
  }

  if (unsettledChildren.length >= 2) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Conduct a night-time environment audit. Check noise levels, lighting, temperature, and bedroom comfort. Review wind-down routines and screen time before bed.",
      urgency: "planned",
      domain: "environment",
      regulatory_ref: "Reg 34",
    });
  }

  // ── Cara Insights ─────────────────────────────────────────────────────
  const insights: NightSafetyInsight[] = [];

  if (night_safety_rating === "inadequate") {
    insights.push({
      severity: "critical",
      text: `Night safety rated inadequate (${score}%). Overnight care is a critical safeguarding area — Ofsted will examine welfare check records, night staffing, and incident responses. Immediate action is needed to bring night-time monitoring to an acceptable standard.`,
    });
  }

  if (!hasData && children.length > 0) {
    insights.push({
      severity: "critical",
      text: "No overnight monitoring data exists for the last 30 days. This is a serious regulatory gap. Night-time welfare checks are a fundamental safeguarding requirement — without documentation, there is no evidence that children are being checked and kept safe overnight.",
    });
  }

  if (night_safety_rating === "outstanding") {
    insights.push({
      severity: "positive",
      text: `Night safety is outstanding (${score}%). Consistent welfare checks, minimal disturbances, and effective overnight care demonstrate that children are safe, settled, and well-cared-for during the night. This is strong evidence for Reg 12 and Reg 34 compliance.`,
    });
  }

  if (check_compliance.compliance_rate >= 90 && incidents30d.length === 0 && children_of_concern.length === 0 && allChecks30d.length >= 10) {
    insights.push({
      severity: "positive",
      text: "The overnight care regime is exemplary: high check compliance, zero incidents, and no children of concern. This demonstrates a home where children feel safe and secure at night — a foundational element of therapeutic care.",
    });
  }

  if (child_profiles.every((p) => p.night_safety_score >= 60) && children.length >= 2 && allChecks30d.length >= 5) {
    insights.push({
      severity: "positive",
      text: `All ${children.length} children have night safety scores of 60%+. While individual areas may need attention, the overall overnight environment is supportive and safe for every child.`,
    });
  }

  return {
    generated_at: today,
    night_safety_rating,
    night_safety_score: score,
    headline,
    check_compliance,
    disturbances,
    night_incidents: night_incidents_overview,
    child_profiles,
    children_of_concern,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
