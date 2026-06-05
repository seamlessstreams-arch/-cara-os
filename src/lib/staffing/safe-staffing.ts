// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — Real-time Safe Staffing (Phase 7)
//
// Assesses whether the home is SAFELY STAFFED RIGHT NOW, from who is actually
// clocked in (Phase 3's live sign-in data) — distinct from the rota-service, which
// analyses the PLANNED rota. Pure + deterministic (period derived from injected now)
// so it's fully unit-tested; the service layer reads the store.
// ══════════════════════════════════════════════════════════════════════════════

export type StaffingPeriod = "day" | "night";

export interface StaffOnShiftLite {
  staff_id: string;
  name: string;
  shift_type: string;
  role?: string;
}

export interface StaffingConfig {
  /** Minimum staff on shift during the day. */
  day: number;
  /** Minimum staff on shift overnight. */
  night: number;
  /** Whether waking-night cover is required overnight. */
  waking_night_required: boolean;
}

/** Sensible default minimum staffing for a small children's home. */
export const DEFAULT_STAFFING_CONFIG: StaffingConfig = {
  day: 2,
  night: 1,
  waking_night_required: true,
};

// Per-home overrides (extend as needed).
const HOME_STAFFING: Record<string, StaffingConfig> = {};

export function getStaffingConfig(homeId: string): StaffingConfig {
  return HOME_STAFFING[homeId] ?? DEFAULT_STAFFING_CONFIG;
}

/** Night runs 22:00–06:59 (local-ish, from the injected ISO hour). */
export function currentPeriod(nowIso: string): StaffingPeriod {
  const hour = new Date(Date.parse(nowIso)).getUTCHours();
  return hour >= 22 || hour < 7 ? "night" : "day";
}

export type StaffingAlertType = "no_cover" | "understaffed" | "lone_working" | "no_night_cover";
export type StaffingSeverity = "ok" | "high" | "critical";

export interface SafeStaffingAlert {
  type: StaffingAlertType;
  severity: Exclude<StaffingSeverity, "ok">;
  message: string;
}

export interface SafeStaffingAssessment {
  period: StaffingPeriod;
  on_shift_count: number;
  minimum_required: number;
  shortfall: number;
  is_understaffed: boolean;
  is_lone_working: boolean;
  has_waking_night: boolean;
  no_night_cover: boolean;
  severity: StaffingSeverity;
  alerts: SafeStaffingAlert[];
}

/** Pure assessment of safe staffing for a moment in time. */
export function assessStaffing(
  onShift: StaffOnShiftLite[],
  period: StaffingPeriod,
  config: StaffingConfig,
): SafeStaffingAssessment {
  const count = onShift.length;
  const min = period === "night" ? config.night : config.day;
  const hasWakingNight = onShift.some((s) => s.shift_type === "waking_night");
  const understaffed = count < min;
  const loneWorking = count === 1;
  const noNightCover = period === "night" && config.waking_night_required && !hasWakingNight;

  const alerts: SafeStaffingAlert[] = [];
  if (count === 0) {
    alerts.push({ type: "no_cover", severity: "critical", message: "No staff are currently clocked in." });
  } else {
    if (understaffed) {
      alerts.push({
        type: "understaffed",
        severity: "critical",
        message: `Only ${count} on shift now — minimum ${min} required for the ${period}.`,
      });
    }
    if (loneWorking) {
      alerts.push({ type: "lone_working", severity: "high", message: "Lone working — only one staff member is on shift." });
    }
    if (noNightCover) {
      alerts.push({ type: "no_night_cover", severity: "critical", message: "No waking-night cover is on shift." });
    }
  }

  const severity: StaffingSeverity = alerts.some((a) => a.severity === "critical")
    ? "critical"
    : alerts.length > 0
      ? "high"
      : "ok";

  return {
    period,
    on_shift_count: count,
    minimum_required: min,
    shortfall: Math.max(0, min - count),
    is_understaffed: understaffed,
    is_lone_working: loneWorking,
    has_waking_night: hasWakingNight,
    no_night_cover: noNightCover,
    severity,
    alerts,
  };
}
