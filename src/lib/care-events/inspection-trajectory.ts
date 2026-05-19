// ══════════════════════════════════════════════════════════════════════════════
// Inspection Readiness Trajectory  (Milestone 45)
//
// Turns the home's persisted inspection bundles into a chronological,
// deltas-aware time series so inspectors / RIs can see whether the home
// is improving, holding or regressing across visits — without opening
// each bundle.
//
// Read-only. Pure derivation over `listPersistedInspectionBundles`.
// ══════════════════════════════════════════════════════════════════════════════

import {
  listPersistedInspectionBundles,
  type PersistedInspectionBundleRow,
} from "@/lib/care-events/inspection-bundle";
import { db } from "@/lib/db/store";
import type { TrajectoryAlertAck, TrajectoryRiEscalationAck } from "@/lib/db/store";

export interface TrajectoryPoint {
  bundle_id: string;
  generated_at: string;
  readiness_score: number;
  readiness_severity: string;
  reg44_packs_included: number;
  filing_total: number;
  reg45_evidence_items: number;
  annex_a_evidence_items: number;
  recent_exports_included: number;
  delta_readiness_score: number;       // vs previous (chronological) point; 0 if first
  severity_changed: boolean;           // vs previous point
}

export type TrajectoryDirection = "improving" | "regressing" | "holding" | "insufficient_data";

export interface TrajectorySummary {
  home_id: string;
  bundles_total: number;
  earliest_at: string | null;
  latest_at: string | null;
  earliest_score: number | null;
  latest_score: number | null;
  net_score_delta: number | null;            // latest - earliest
  direction: TrajectoryDirection;
  severity_changes: number;                  // count of points where severity flipped
  points: TrajectoryPoint[];                 // chronological (oldest → newest)
}

const HOLDING_BAND = 1; // |net delta| ≤ 1 ⇒ holding

export function loadInspectionTrajectory(homeId: string): TrajectorySummary {
  // listPersistedInspectionBundles returns newest-first; reverse for chronology
  const rows: PersistedInspectionBundleRow[] = [...listPersistedInspectionBundles(homeId)].reverse();

  if (rows.length === 0) {
    return {
      home_id: homeId,
      bundles_total: 0,
      earliest_at: null,
      latest_at: null,
      earliest_score: null,
      latest_score: null,
      net_score_delta: null,
      direction: "insufficient_data",
      severity_changes: 0,
      points: [],
    };
  }

  let severity_changes = 0;
  const points: TrajectoryPoint[] = rows.map((row, i) => {
    const prev = i > 0 ? rows[i - 1] : null;
    const delta = prev ? row.readiness_score - prev.readiness_score : 0;
    const flipped = !!prev && prev.readiness_severity !== row.readiness_severity;
    if (flipped) severity_changes += 1;
    return {
      bundle_id: row.id,
      generated_at: row.generated_at,
      readiness_score: row.readiness_score,
      readiness_severity: row.readiness_severity,
      reg44_packs_included: row.reg44_packs_included,
      filing_total: row.filing_total,
      reg45_evidence_items: row.reg45_evidence_items,
      annex_a_evidence_items: row.annex_a_evidence_items,
      recent_exports_included: row.recent_exports_included,
      delta_readiness_score: delta,
      severity_changed: flipped,
    };
  });

  const earliest = rows[0];
  const latest = rows[rows.length - 1];
  const net = latest.readiness_score - earliest.readiness_score;

  let direction: TrajectoryDirection;
  if (rows.length < 2) direction = "insufficient_data";
  else if (net > HOLDING_BAND) direction = "improving";
  else if (net < -HOLDING_BAND) direction = "regressing";
  else direction = "holding";

  return {
    home_id: homeId,
    bundles_total: rows.length,
    earliest_at: earliest.generated_at,
    latest_at: latest.generated_at,
    earliest_score: earliest.readiness_score,
    latest_score: latest.readiness_score,
    net_score_delta: net,
    direction,
    severity_changes,
    points,
  };
}

// ── Trajectory alerts (M46) ───────────────────────────────────────────────────
//
// Derives manager-facing alert flags from the trajectory so a notification
// surfaces automatically when readiness regresses, severity flips on the
// latest bundle, or a single-step drop is large. Read-only.

export type TrajectoryAlertKind =
  | "regressing"
  | "severity_flip_latest"
  | "large_step_drop"
  | "bundle_stale"
  | "bundle_overdue";

export type TrajectoryAlertSeverity = "warning" | "critical";

export interface TrajectoryAlert {
  id: string;                       // deterministic; safe for notification dedup
  home_id: string;
  kind: TrajectoryAlertKind;
  severity: TrajectoryAlertSeverity;
  message: string;
  detected_at: string;              // latest point's generated_at, or now() for no-bundle/stale alerts
  bundle_id: string | null;         // latest point's bundle id, or null when no bundle exists
}

export const LARGE_STEP_DROP_THRESHOLD = 10;
export const BUNDLE_STALE_DAYS = 14;
export const BUNDLE_OVERDUE_DAYS = 30;

export function detectTrajectoryAlerts(homeId: string): TrajectoryAlert[] {
  const t = loadInspectionTrajectory(homeId);
  const out: TrajectoryAlert[] = [];
  const nowIso = new Date().toISOString();
  const DAY = 24 * 60 * 60 * 1000;

  // No bundles yet → cadence alerts cannot fire and existing-trajectory
  // alerts have no point to attach to. Stay silent so brand-new homes aren't
  // spammed before they have data worth bundling.
  if (t.points.length === 0) return out;

  const latest = t.points[t.points.length - 1];

  // Cadence: stale (>= 14 days) or overdue (>= 30 days) since latest bundle
  const ageDays = Math.floor((Date.now() - new Date(latest.generated_at).getTime()) / DAY);
  if (ageDays >= BUNDLE_OVERDUE_DAYS) {
    out.push({
      id: `traj_overdue_${homeId}_${latest.bundle_id}`,
      home_id: homeId,
      kind: "bundle_overdue",
      severity: "critical",
      message: `Latest inspection bundle is ${ageDays} days old (overdue at ${BUNDLE_OVERDUE_DAYS}+).`,
      detected_at: nowIso,
      bundle_id: latest.bundle_id,
    });
  } else if (ageDays >= BUNDLE_STALE_DAYS) {
    out.push({
      id: `traj_stale_${homeId}_${latest.bundle_id}`,
      home_id: homeId,
      kind: "bundle_stale",
      severity: "warning",
      message: `Latest inspection bundle is ${ageDays} days old (stale at ${BUNDLE_STALE_DAYS}+).`,
      detected_at: nowIso,
      bundle_id: latest.bundle_id,
    });
  }

  if (t.direction === "regressing") {
    out.push({
      id: `traj_regressing_${homeId}_${latest.bundle_id}`,
      home_id: homeId,
      kind: "regressing",
      severity: "critical",
      message: `Readiness has regressed by ${Math.abs(t.net_score_delta ?? 0)} across ${t.bundles_total} bundles (now ${t.latest_score}).`,
      detected_at: latest.generated_at,
      bundle_id: latest.bundle_id,
    });
  }

  if (latest.severity_changed) {
    out.push({
      id: `traj_sevflip_${homeId}_${latest.bundle_id}`,
      home_id: homeId,
      kind: "severity_flip_latest",
      severity: "warning",
      message: `Latest bundle severity changed to "${latest.readiness_severity}".`,
      detected_at: latest.generated_at,
      bundle_id: latest.bundle_id,
    });
  }

  if (latest.delta_readiness_score <= -LARGE_STEP_DROP_THRESHOLD) {
    out.push({
      id: `traj_largedrop_${homeId}_${latest.bundle_id}`,
      home_id: homeId,
      kind: "large_step_drop",
      severity: "critical",
      message: `Readiness dropped by ${Math.abs(latest.delta_readiness_score)} since the previous bundle.`,
      detected_at: latest.generated_at,
      bundle_id: latest.bundle_id,
    });
  }

  // Filter out alerts that have been acknowledged by any manager. The alert
  // ids are bundle-scoped, so a fresh bundle re-raises the alert with a new
  // id and managers will see it again — acknowledgement is per-bundle.
  const ackedIds = new Set(
    db.trajectoryAlertAcks.findAll(homeId).map((a) => a.alert_id),
  );
  return out.filter((a) => !ackedIds.has(a.id));
}

// ── Acknowledgement (M48) ─────────────────────────────────────────────────────

export function recordTrajectoryAlertAck(input: {
  alert: TrajectoryAlert;
  acked_by_user: string;
  acked_by_role: string;
  note: string;
}): TrajectoryAlertAck {
  const { alert, acked_by_user, acked_by_role, note } = input;
  return db.trajectoryAlertAcks.create({
    id: `${alert.id}::${acked_by_user}`,
    alert_id: alert.id,
    home_id: alert.home_id,
    bundle_id: alert.bundle_id,
    alert_kind: alert.kind,
    acked_by_user,
    acked_by_role,
    note,
    acked_at: new Date().toISOString(),
  });
}

export function listTrajectoryAlertAcks(homeId: string): TrajectoryAlertAck[] {
  return [...db.trajectoryAlertAcks.findAll(homeId)].sort((a, b) =>
    b.acked_at.localeCompare(a.acked_at),
  );
}

// ── Ack-overdue reminders (M50) ───────────────────────────────────────────────
//
// Open trajectory alerts that have sat unacked beyond a threshold become a
// fresh reminder so management cannot quietly let signals rot. Threshold
// scales with severity: critical alerts fire at 48h, warnings at 7d.

export const ACK_OVERDUE_CRITICAL_HOURS = 48;
export const ACK_OVERDUE_WARNING_DAYS = 7;
// Escalation tier: a critical reminder still unacked this many hours past the
// reminder threshold escalates to the Responsible Individual.
export const ACK_OVERDUE_RI_ESCALATION_HOURS = 72;

export interface TrajectoryAckOverdueReminder {
  id: string;                       // deterministic; safe for notification dedup
  home_id: string;
  alert_id: string;
  alert_kind: TrajectoryAlertKind;
  severity: TrajectoryAlertSeverity;
  bundle_id: string | null;
  age_hours: number;
  message: string;
  detected_at: string;              // alert's original detected_at
}

export function detectTrajectoryAckOverdueReminders(
  homeId: string,
): TrajectoryAckOverdueReminder[] {
  const alerts = detectTrajectoryAlerts(homeId);
  const out: TrajectoryAckOverdueReminder[] = [];
  const now = Date.now();
  const HOUR = 60 * 60 * 1000;
  const criticalThreshold = ACK_OVERDUE_CRITICAL_HOURS * HOUR;
  const warningThreshold = ACK_OVERDUE_WARNING_DAYS * 24 * HOUR;

  for (const a of alerts) {
    const ageMs = now - new Date(a.detected_at).getTime();
    if (ageMs < 0) continue;
    const threshold = a.severity === "critical" ? criticalThreshold : warningThreshold;
    if (ageMs < threshold) continue;
    const age_hours = Math.floor(ageMs / HOUR);
    out.push({
      id: `traj_ack_overdue_${a.id}`,
      home_id: a.home_id,
      alert_id: a.id,
      alert_kind: a.kind,
      severity: a.severity,
      bundle_id: a.bundle_id,
      age_hours,
      message:
        a.severity === "critical"
          ? `Critical trajectory alert "${a.kind.replace(/_/g, " ")}" unacknowledged for ${age_hours}h (threshold ${ACK_OVERDUE_CRITICAL_HOURS}h).`
          : `Warning trajectory alert "${a.kind.replace(/_/g, " ")}" unacknowledged for ${Math.floor(age_hours / 24)}d (threshold ${ACK_OVERDUE_WARNING_DAYS}d).`,
      detected_at: a.detected_at,
    });
  }

  return out;
}

// ── RI escalation tier (M51) ──────────────────────────────────────────────────
//
// A critical reminder that itself sits unacked beyond
// ACK_OVERDUE_RI_ESCALATION_HOURS past the original reminder threshold becomes
// a Responsible Individual escalation so oversight isn't blind to a manager who
// has gone quiet on a critical readiness signal.

export interface TrajectoryRiEscalation {
  id: string;
  home_id: string;
  alert_id: string;
  alert_kind: TrajectoryAlertKind;
  bundle_id: string | null;
  age_hours: number;
  message: string;
  detected_at: string;
}

export function detectTrajectoryRiEscalations(
  homeId: string,
): TrajectoryRiEscalation[] {
  const reminders = detectTrajectoryAckOverdueReminders(homeId);
  const out: TrajectoryRiEscalation[] = [];
  const escalateAfterMs =
    (ACK_OVERDUE_CRITICAL_HOURS + ACK_OVERDUE_RI_ESCALATION_HOURS) * 60 * 60 * 1000;
  const now = Date.now();
  const HOUR = 60 * 60 * 1000;

  for (const r of reminders) {
    if (r.severity !== "critical") continue;
    const ageMs = now - new Date(r.detected_at).getTime();
    if (ageMs < escalateAfterMs) continue;
    const age_hours = Math.floor(ageMs / HOUR);
    out.push({
      id: `traj_ri_escalation_${r.alert_id}`,
      home_id: r.home_id,
      alert_id: r.alert_id,
      alert_kind: r.alert_kind,
      bundle_id: r.bundle_id,
      age_hours,
      message: `RI escalation: critical trajectory alert "${r.alert_kind.replace(/_/g, " ")}" unacknowledged by management for ${age_hours}h.`,
      detected_at: r.detected_at,
    });
  }

  // Filter out escalations already acknowledged by an RI.
  const ackedIds = new Set(
    db.trajectoryRiEscalationAcks.findAll(homeId).map((a) => a.escalation_id),
  );
  return out.filter((e) => !ackedIds.has(e.id));
}

// ── RI escalation acknowledgement (M52) ───────────────────────────
//
// An RI ack closes the RI-audience escalation but deliberately does NOT
// silence the underlying manager-facing alert. Management is still expected
// to record their own acknowledgement on the trajectory page.

export function recordTrajectoryRiEscalationAck(input: {
  escalation: TrajectoryRiEscalation;
  acked_by_user: string;
  acked_by_role: string;
  note: string;
}): TrajectoryRiEscalationAck {
  const { escalation, acked_by_user, acked_by_role, note } = input;
  return db.trajectoryRiEscalationAcks.create({
    id: `${escalation.id}::${acked_by_user}`,
    escalation_id: escalation.id,
    alert_id: escalation.alert_id,
    home_id: escalation.home_id,
    bundle_id: escalation.bundle_id,
    alert_kind: escalation.alert_kind,
    acked_by_user,
    acked_by_role,
    note,
    acked_at: new Date().toISOString(),
  });
}

export function listTrajectoryRiEscalationAcks(
  homeId: string,
): TrajectoryRiEscalationAck[] {
  return [...db.trajectoryRiEscalationAcks.findAll(homeId)].sort((a, b) =>
    b.acked_at.localeCompare(a.acked_at),
  );
}
