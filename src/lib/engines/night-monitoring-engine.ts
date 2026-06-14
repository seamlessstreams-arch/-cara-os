// ══════════════════════════════════════════════════════════════════════════════
// CARA — NIGHT MONITORING & WELFARE INTELLIGENCE ENGINE
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
// Analyses welfare check compliance, night-time disturbances, child sleep
// patterns, security check completion, and night staffing adequacy.
//
// Regulatory: Reg 12 (Health and safety), Reg 25 (Night staffing),
// Reg 34 (Welfare of children). SCCIF: Leadership & Management.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface ChildInput {
  id: string;
  name: string;
}

export type CheckStatus = "ok" | "concern" | "asleep" | "awake" | "not_in_room" | "refused";

export interface WelfareCheckInput {
  id: string;
  child_id: string;
  staff_id: string;
  check_date: string;   // ISO date
  check_time: string;   // HH:MM
  status: CheckStatus;
  mood: string | null;
  has_concern: boolean;
  physical_marks_noted: boolean;
}

export interface WelfareRoundInput {
  id: string;
  round_date: string;
  round_time: string;   // HH:MM
  staff_id: string;
  shift_type: string;   // "sleep_in" | "waking_night"
  all_children_checked: boolean;
  building_secure: boolean;
  fire_exits_clear: boolean;
  external_doors_locked: boolean;
  checks_count: number;
  children_count: number;
}

export interface NightMonitoringInput {
  children: ChildInput[];
  welfareChecks: WelfareCheckInput[];
  welfareRounds: WelfareRoundInput[];
  today?: string; // ISO date — injectable for deterministic tests
}

// ── Output Types ────────────────────────────────────────────────────────────

export interface NightMonitoringOverview {
  total_rounds_7d: number;
  total_rounds_30d: number;
  avg_rounds_per_night: number;
  all_children_checked_rate: number; // 0-100
  building_secure_rate: number;      // 0-100
  concern_count_7d: number;
  not_in_room_count_7d: number;
  physical_marks_count_7d: number;
}

export interface ChildNightProfile {
  child_id: string;
  child_name: string;
  checks_7d: number;
  asleep_rate: number;     // 0-100
  awake_rate: number;      // 0-100
  concern_count_7d: number;
  not_in_room_count_7d: number;
  avg_settled_time: string | null; // earliest "asleep" time
  sleep_pattern: "settled" | "disrupted" | "variable";
}

export interface NightStaffingAnalysis {
  total_nights_7d: number;
  waking_night_count: number;
  sleep_in_count: number;
  unique_staff_7d: number;
  avg_checks_per_shift: number;
}

export interface SecurityCompliance {
  rounds_with_building_secure: number;
  rounds_with_exits_clear: number;
  rounds_with_doors_locked: number;
  total_rounds: number;
  overall_compliance_rate: number;  // 0-100
}

export interface NightMonitoringAlert {
  severity: "critical" | "high" | "medium" | "low";
  message: string;
}

export interface CaraNightInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface NightMonitoringResult {
  overview: NightMonitoringOverview;
  child_profiles: ChildNightProfile[];
  staffing: NightStaffingAnalysis;
  security: SecurityCompliance;
  alerts: NightMonitoringAlert[];
  insights: CaraNightInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

export function daysBetween(a: string, b: string): number {
  const msA = new Date(a).getTime();
  const msB = new Date(b).getTime();
  return Math.round(Math.abs(msB - msA) / 86_400_000);
}

export function average(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

/** Determine sleep pattern from asleep vs awake/concern check rates */
export function classifySleepPattern(
  asleepRate: number,
  concernCount: number,
): "settled" | "disrupted" | "variable" {
  if (concernCount > 0 || asleepRate < 50) return "disrupted";
  if (asleepRate >= 80) return "settled";
  return "variable";
}

/** Find the earliest "asleep" time across checks (represents when child settles) */
export function findEarliestAsleepTime(checks: WelfareCheckInput[]): string | null {
  const asleepChecks = checks.filter((c) => c.status === "asleep");
  if (asleepChecks.length === 0) return null;
  const times = asleepChecks.map((c) => c.check_time).sort();
  return times[0];
}

// ── Main Computation ────────────────────────────────────────────────────────

export function computeNightMonitoring(input: NightMonitoringInput): NightMonitoringResult {
  const today = input.today ?? new Date().toISOString().slice(0, 10);
  const { children, welfareChecks, welfareRounds } = input;

  // ── Filter by time period ──────────────────────────────────────────────
  const rounds7d = welfareRounds.filter((r) => daysBetween(r.round_date, today) <= 7);
  const rounds30d = welfareRounds.filter((r) => daysBetween(r.round_date, today) <= 30);
  const checks7d = welfareChecks.filter((c) => daysBetween(c.check_date, today) <= 7);

  // ── Overview ──────────────────────────────────────────────────────────
  const uniqueNights7d = new Set(rounds7d.map((r) => r.round_date)).size;
  const allCheckedRounds = rounds7d.filter((r) => r.all_children_checked);
  const secureRounds = rounds7d.filter((r) => r.building_secure);
  const concerns7d = checks7d.filter((c) => c.has_concern);
  const notInRoom7d = checks7d.filter((c) => c.status === "not_in_room");
  const marks7d = checks7d.filter((c) => c.physical_marks_noted);

  const overview: NightMonitoringOverview = {
    total_rounds_7d: rounds7d.length,
    total_rounds_30d: rounds30d.length,
    avg_rounds_per_night: uniqueNights7d > 0
      ? Math.round((rounds7d.length / uniqueNights7d) * 10) / 10
      : 0,
    all_children_checked_rate: rounds7d.length > 0
      ? Math.round((allCheckedRounds.length / rounds7d.length) * 100)
      : 0,
    building_secure_rate: rounds7d.length > 0
      ? Math.round((secureRounds.length / rounds7d.length) * 100)
      : 0,
    concern_count_7d: concerns7d.length,
    not_in_room_count_7d: notInRoom7d.length,
    physical_marks_count_7d: marks7d.length,
  };

  // ── Child Profiles ─────────────────────────────────────────────────────
  const child_profiles: ChildNightProfile[] = children.map((child) => {
    const childChecks7d = checks7d.filter((c) => c.child_id === child.id);
    const totalChecks = childChecks7d.length;
    const asleepChecks = childChecks7d.filter((c) => c.status === "asleep");
    const awakeChecks = childChecks7d.filter((c) => c.status === "awake" || c.status === "ok");
    const childConcerns = childChecks7d.filter((c) => c.has_concern);
    const childNotInRoom = childChecks7d.filter((c) => c.status === "not_in_room");

    const asleepRate = totalChecks > 0 ? Math.round((asleepChecks.length / totalChecks) * 100) : 0;
    const awakeRate = totalChecks > 0 ? Math.round((awakeChecks.length / totalChecks) * 100) : 0;

    return {
      child_id: child.id,
      child_name: child.name,
      checks_7d: totalChecks,
      asleep_rate: asleepRate,
      awake_rate: awakeRate,
      concern_count_7d: childConcerns.length,
      not_in_room_count_7d: childNotInRoom.length,
      avg_settled_time: findEarliestAsleepTime(childChecks7d),
      sleep_pattern: classifySleepPattern(asleepRate, childConcerns.length),
    };
  });

  // ── Staffing Analysis ─────────────────────────────────────────────────
  const wakingNights = rounds7d.filter((r) => r.shift_type === "waking_night");
  const sleepIns = rounds7d.filter((r) => r.shift_type === "sleep_in");
  const uniqueStaff = new Set(rounds7d.map((r) => r.staff_id)).size;

  // Group rounds by night (date) to calculate checks per shift
  const nightGrouped = new Map<string, number>();
  for (const r of rounds7d) {
    nightGrouped.set(r.round_date, (nightGrouped.get(r.round_date) ?? 0) + 1);
  }

  const staffing: NightStaffingAnalysis = {
    total_nights_7d: uniqueNights7d,
    waking_night_count: wakingNights.length,
    sleep_in_count: sleepIns.length,
    unique_staff_7d: uniqueStaff,
    avg_checks_per_shift: uniqueNights7d > 0
      ? Math.round((rounds7d.length / uniqueNights7d) * 10) / 10
      : 0,
  };

  // ── Security Compliance ───────────────────────────────────────────────
  const secureBuilding = rounds7d.filter((r) => r.building_secure).length;
  const exitsClear = rounds7d.filter((r) => r.fire_exits_clear).length;
  const doorsLocked = rounds7d.filter((r) => r.external_doors_locked).length;
  const totalSecItems = rounds7d.length * 3; // 3 security items per round

  const security: SecurityCompliance = {
    rounds_with_building_secure: secureBuilding,
    rounds_with_exits_clear: exitsClear,
    rounds_with_doors_locked: doorsLocked,
    total_rounds: rounds7d.length,
    overall_compliance_rate: totalSecItems > 0
      ? Math.round(((secureBuilding + exitsClear + doorsLocked) / totalSecItems) * 100)
      : 0,
  };

  // ── Alerts ─────────────────────────────────────────────────────────────
  const alerts: NightMonitoringAlert[] = [];

  // Critical: child not in room
  if (notInRoom7d.length > 0) {
    const childNames = [...new Set(notInRoom7d.map((c) => {
      const child = children.find((ch) => ch.id === c.child_id);
      return child?.name ?? "Unknown";
    }))];
    alerts.push({
      severity: "critical",
      message: `${childNames.join(", ")} not found in room during welfare check — follow missing protocol`,
    });
  }

  // Critical: physical marks noted
  if (marks7d.length > 0) {
    alerts.push({
      severity: "critical",
      message: `Physical marks noted on ${marks7d.length} welfare check${marks7d.length > 1 ? "s" : ""} — body map required`,
    });
  }

  // High: concerns raised
  if (concerns7d.length > 0) {
    alerts.push({
      severity: "high",
      message: `${concerns7d.length} concern${concerns7d.length > 1 ? "s" : ""} raised during night welfare checks this week`,
    });
  }

  // Medium: incomplete rounds (not all children checked)
  const incompleteRounds = rounds7d.filter((r) => !r.all_children_checked);
  if (incompleteRounds.length > 0) {
    alerts.push({
      severity: "medium",
      message: `${incompleteRounds.length} welfare round${incompleteRounds.length > 1 ? "s" : ""} where not all children were checked — review with night staff`,
    });
  }

  // Medium: security not maintained
  if (rounds7d.length >= 3 && security.overall_compliance_rate < 100) {
    const issues = rounds7d.length - secureBuilding;
    if (issues > 0) {
      alerts.push({
        severity: "medium",
        message: `Building security not confirmed on ${issues} round${issues > 1 ? "s" : ""} — ensure locks and alarms are verified each check`,
      });
    }
  }

  // Low: fewer than expected rounds per night (expect 4-5 checks per night)
  if (uniqueNights7d > 0 && overview.avg_rounds_per_night < 4) {
    alerts.push({
      severity: "low",
      message: `Average ${overview.avg_rounds_per_night} welfare rounds per night — best practice recommends at least 4 (every 2 hours)`,
    });
  }

  // ── Cara Insights ─────────────────────────────────────────────────────
  const insights: CaraNightInsight[] = [];

  // Critical: child missing from room
  if (notInRoom7d.length > 0) {
    insights.push({
      severity: "critical",
      text: `Child${notInRoom7d.length > 1 ? "ren" : ""} found not in room during ${notInRoom7d.length} welfare check${notInRoom7d.length > 1 ? "s" : ""}. Review missing from care protocols, ensure immediate welfare actions are triggered, and update individual risk assessments.`,
    });
  }

  // Warning: disrupted sleep patterns
  const disrupted = child_profiles.filter((c) => c.sleep_pattern === "disrupted");
  if (disrupted.length > 0) {
    const names = disrupted.map((c) => c.child_name).join(", ");
    insights.push({
      severity: "warning",
      text: `${names} ${disrupted.length > 1 ? "show" : "shows"} disrupted sleep patterns. Consider sleep hygiene review, bedtime routine adjustments, and whether anxiety or wellbeing factors are contributing.`,
    });
  }

  // Warning: low check frequency
  if (uniqueNights7d > 0 && overview.avg_rounds_per_night < 4) {
    insights.push({
      severity: "warning",
      text: `Welfare check frequency averaging ${overview.avg_rounds_per_night} rounds per night. Reg 25 requires adequate night supervision — ensure minimum 2-hourly checks (5 rounds per night) are maintained.`,
    });
  }

  // Positive: consistent routine
  if (rounds7d.length >= 10 && overview.all_children_checked_rate === 100 && security.overall_compliance_rate === 100) {
    insights.push({
      severity: "positive",
      text: `Night monitoring is exemplary: 100% welfare check completion, all children checked every round, and building security maintained throughout. Strong evidence of safe night care.`,
    });
  }

  // Positive: all children settled
  if (children.length > 0 && child_profiles.every((c) => c.sleep_pattern === "settled")) {
    insights.push({
      severity: "positive",
      text: `All ${children.length} children showing settled sleep patterns. This indicates emotional security, consistent bedtime routines, and effective night-time care.`,
    });
  }

  return {
    overview,
    child_profiles,
    staffing,
    security,
    alerts,
    insights,
  };
}
