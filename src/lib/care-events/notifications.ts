// ══════════════════════════════════════════════════════════════════════════════
// Notifications Center  (Milestone 27)
//
// CLAUDE.md spec: "Notify relevant staff in-app" for returned records, plus
// surface alerts for sensitive amendments, manager review backlog, failed
// routing, and pending Reg 40 triages.
//
// This engine produces a unified, derived notifications stream from existing
// live data sources. It is read-only and stateless (no per-user read flags
// yet — that requires a writable user_notifications table, out of scope for
// this milestone). Each notification carries:
//   - audience: who needs to act ("manager" | "staff")
//   - severity: info | warning | critical
//   - link to the screen where the action is taken
//
// Sources:
//   - returned_record   (M23) → audience: staff (the original author)
//   - sensitive_amendment (M19) → audience: manager
//   - reg40_triage_pending (M22 source) → audience: manager
//   - manager_review_required (existing) → audience: manager
//   - routing_failure (M16) → audience: manager
// ══════════════════════════════════════════════════════════════════════════════

import { db } from "@/lib/db/store";
import { loadReturnedRecordsQueue } from "@/lib/care-events/returned-records";
import { loadAmendmentReviewQueue } from "@/lib/care-events/amendment-review";
import { loadRoutingHealth } from "@/lib/care-events/routing-health";
import { detectExportAbuse } from "@/lib/care-events/export-abuse";
import { detectTrajectoryAlerts, detectTrajectoryAckOverdueReminders, detectTrajectoryRiEscalations } from "@/lib/care-events/inspection-trajectory";

export type NotificationSeverity = "info" | "warning" | "critical";
export type NotificationAudience = "manager" | "staff" | "responsible_individual";
export type NotificationSource =
  | "returned_record"
  | "sensitive_amendment"
  | "reg40_triage_pending"
  | "manager_review_required"
  | "routing_failure"
  | "sensitive_export"
  | "export_abuse"
  | "trajectory_alert"
  | "trajectory_ack_overdue"
  | "trajectory_ack_overdue_ri";

export interface NotificationItem {
  id: string;                     // source:source_id
  source: NotificationSource;
  source_id: string;
  home_id: string;
  child_id: string | null;
  audience: NotificationAudience;
  // Targeting: when audience is "staff" we know which staff member to notify.
  // When audience is "manager" this is null and the alert applies to any
  // manager of the home.
  target_staff_id: string | null;
  severity: NotificationSeverity;
  title: string;
  body: string;
  created_at: string;             // for ordering
  link_href: string;
  // Per-user envelope (M34). Populated by `loadNotificationsForUser`; the
  // base `loadNotifications` leaves these as null for backward compatibility.
  read_at: string | null;
  dismissed_at: string | null;
}

export interface NotificationStream {
  home_id: string;
  generated_at: string;
  total: number;
  for_managers: number;
  for_staff: number;
  for_responsible_individual: number;
  by_severity: Record<NotificationSeverity, number>;
  items: NotificationItem[];      // newest first
  // Per-user counters (M34). Populated by `loadNotificationsForUser`; the
  // base `loadNotifications` leaves these as null.
  viewer_user_id: string | null;
  unread: number | null;
  dismissed: number | null;
}

const SEVERITY_ORDER: Record<NotificationSeverity, number> = {
  critical: 0, warning: 1, info: 2,
};

export function loadNotifications(homeId: string): NotificationStream {
  type Builder = Omit<NotificationItem, "read_at" | "dismissed_at">;
  const built: Builder[] = [];

  // ── Returned records: notify the original staff author ────────────────────
  const returned = loadReturnedRecordsQueue(homeId);
  for (const r of returned.rows) {
    built.push({
      id: `returned_record:${r.care_event_id}`,
      source: "returned_record",
      source_id: r.care_event_id,
      home_id: r.home_id,
      child_id: r.child_id,
      audience: "staff",
      target_staff_id: r.staff_id,
      severity: r.is_safeguarding_sensitive ? "critical"
              : r.age_band === "over_7_days" ? "critical"
              : r.age_band === "4_7_days" ? "warning"
              : "info",
      title: `Record returned: ${r.title}`,
      body: r.return_reason
        ? `Manager note: ${r.return_reason.slice(0, 160)}`
        : "Manager has returned this record for amendment.",
      created_at: r.returned_at ?? new Date().toISOString(),
      link_href: `/care-events/${r.care_event_id}`,
    });
  }

  // ── Sensitive amendments awaiting manager re-verification ─────────────────
  for (const a of loadAmendmentReviewQueue(homeId).rows) {
    built.push({
      id: `sensitive_amendment:${a.care_event_id}`,
      source: "sensitive_amendment",
      source_id: a.care_event_id,
      home_id: a.home_id,
      child_id: a.child_id,
      audience: "manager",
      target_staff_id: null,
      severity: a.sensitive_flags.includes("safeguarding") ? "critical" : "warning",
      title: `Sensitive amendment to verify: ${a.title}`,
      body: `v${a.version} · ${a.sensitive_flags.join(", ") || "sensitive"}`,
      created_at: a.amended_at ?? new Date().toISOString(),
      link_href: `/intelligence/care-events/amendment-review`,
    });
  }

  // ── Reg 40 triages pending ────────────────────────────────────────────────
  for (const t of db.ariaReg40Triages.findAll(homeId)) {
    if (t.status !== "pending") continue;
    built.push({
      id: `reg40_triage_pending:${t.id}`,
      source: "reg40_triage_pending",
      source_id: t.id,
      home_id: t.home_id,
      child_id: t.child_id ?? null,
      audience: "manager",
      target_staff_id: null,
      severity: "critical",
      title: `Reg 40 triage pending: ${t.suggested_category.replace(/_/g, " ")}`,
      body: t.reasoning?.slice(0, 160) ?? "Awaiting manager decision.",
      created_at: t.created_at,
      link_href: `/aria-studio/reg40-triage`,
    });
  }

  // ── Manager review required ───────────────────────────────────────────────
  for (const e of db.careEvents.findCurrent()) {
    if (e.home_id !== homeId) continue;
    if (e.status !== "manager_review_required") continue;
    const sensitive = Boolean(
      e.is_safeguarding ||
        e.requires_reg40_triage ||
        e.contributes_to_reg45 ||
        e.contributes_to_annex_a,
    );
    built.push({
      id: `manager_review_required:${e.id}`,
      source: "manager_review_required",
      source_id: e.id,
      home_id: e.home_id,
      child_id: e.child_id,
      audience: "manager",
      target_staff_id: null,
      severity: e.is_safeguarding ? "critical" : sensitive ? "warning" : "info",
      title: `Manager review needed: ${e.title}`,
      body: `${e.category.replace(/_/g, " ")} · event ${e.event_date}`,
      created_at: e.updated_at ?? e.created_at,
      link_href: `/care-events/${e.id}`,
    });
  }

  // ── Routing failures ──────────────────────────────────────────────────────
  const routing = loadRoutingHealth(homeId);
  for (const ce of routing.rows) {
    const sensitive =
      ce.care_event_category === "safeguarding" ||
      ce.care_event_category === "missing_episode" ||
      ce.care_event_category === "physical_intervention" ||
      ce.care_event_category === "restraint";
    built.push({
      id: `routing_failure:${ce.care_event_id}`,
      source: "routing_failure",
      source_id: ce.care_event_id,
      home_id: homeId,
      child_id: ce.child_id,
      audience: "manager",
      target_staff_id: null,
      severity: sensitive ? "critical" : "warning",
      title: `Routing failed: ${ce.care_event_title}`,
      body: `${ce.failed_routes.length} route${ce.failed_routes.length === 1 ? "" : "s"} and ` +
            `${ce.failed_jobs.length} job${ce.failed_jobs.length === 1 ? "" : "s"} need attention.`,
      created_at: ce.care_event_date,
      link_href: `/intelligence/care-events/routing-health`,
    });
  }

  // ── Sensitive exports (last 7 days) ─────────────────────────────────────────
  //
  // M39: every safeguarding-sensitive export of a persisted artifact (Reg 44
  // pack, safeguarding-category filing index, etc.) lands in managers'
  // notification stream so they see at a glance that sensitive content has
  // left the home, who took it and why.
  const exportCutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  for (const ex of db.exportHistory.findAll(homeId)) {
    if (!ex.is_safeguarding_sensitive) continue;
    if (new Date(ex.exported_at).getTime() < exportCutoff) continue;
    const kindLabel = ex.kind === "reg44_pack"
      ? "Reg 44 pack"
      : ex.kind === "inspection_snapshot"
        ? "Inspection snapshot"
        : ex.kind === "inspection_bundle"
          ? "Inspection bundle"
          : "Filing cabinet";
    built.push({
      id: `sensitive_export:${ex.id}`,
      source: "sensitive_export",
      source_id: ex.id,
      home_id: ex.home_id,
      child_id: null,
      audience: "manager",
      target_staff_id: null,
      severity: "critical",
      title: `Sensitive export: ${kindLabel}`,
      body: `Exported by ${ex.exported_by} (${ex.exported_by_role}) · ${ex.byte_size.toLocaleString()} bytes${ex.reason ? ` · ${ex.reason.slice(0, 120)}` : ""}`,
      created_at: ex.exported_at,
      link_href: `/intelligence/care-events/exports`,
    });
  }

  // ── Export abuse flags (M41) ────────────────────────────────────────────────
  //
  // Promotes derived export-abuse signals (high volume, sensitive bursts,
  // off-hours sensitive, unreasoned sensitive) into managers' notification
  // stream so a manager sees suspicious export patterns at a glance, not
  // only when they remember to visit the Export Risk page.
  const abuse = detectExportAbuse(homeId);
  for (const flag of abuse.flags) {
    built.push({
      id: `export_abuse:${flag.id}`,
      source: "export_abuse",
      source_id: flag.id,
      home_id: homeId,
      child_id: null,
      audience: "manager",
      target_staff_id: null,
      severity: flag.severity,
      title: `Export risk: ${flag.kind.replace(/_/g, " ")}`,
      body: flag.message,
      created_at: flag.detected_at,
      link_href: `/intelligence/care-events/export-risk`,
    });
  }

  // ── Trajectory alerts (M46) ───────────────────────────────────────
  //
  // Promotes regressing trajectory, latest-bundle severity flips, and large
  // single-step drops in readiness into managers' notification stream so
  // trajectory signals reach the queue without managers having to open the
  // Readiness Trajectory page.
  for (const alert of detectTrajectoryAlerts(homeId)) {
    built.push({
      id: `trajectory_alert:${alert.id}`,
      source: "trajectory_alert",
      source_id: alert.id,
      home_id: alert.home_id,
      child_id: null,
      audience: "manager",
      target_staff_id: null,
      severity: alert.severity,
      title: `Readiness trajectory: ${alert.kind.replace(/_/g, " ")}`,
      body: alert.message,
      created_at: alert.detected_at,
      link_href: `/intelligence/care-events/inspection-bundle/trajectory`,
    });
  }

  // ── Trajectory ack-overdue reminders (M50) ────────────────────────
  //
  // Open alerts that have sat unacked beyond the per-severity threshold are
  // re-promoted as a distinct reminder so management cannot silently let a
  // signal age. Acknowledging the underlying alert removes both the original
  // alert and this reminder on the next refresh.
  for (const r of detectTrajectoryAckOverdueReminders(homeId)) {
    built.push({
      id: `trajectory_ack_overdue:${r.id}`,
      source: "trajectory_ack_overdue",
      source_id: r.id,
      home_id: r.home_id,
      child_id: null,
      audience: "manager",
      target_staff_id: null,
      severity: r.severity,
      title: `Trajectory alert unacknowledged: ${r.alert_kind.replace(/_/g, " ")}`,
      body: r.message,
      created_at: r.detected_at,
      link_href: `/intelligence/care-events/inspection-bundle/trajectory`,
    });
  }

  // ── Trajectory RI escalations (M51) ─────────────────────────────────
  //
  // Critical reminders left unacked past the escalation threshold are
  // re-promoted into the Responsible Individual audience so external
  // oversight sees signals management has not actioned. Audience-routed
  // separately so the manager queue does not double-count escalations.
  for (const e of detectTrajectoryRiEscalations(homeId)) {
    built.push({
      id: `trajectory_ack_overdue_ri:${e.id}`,
      source: "trajectory_ack_overdue_ri",
      source_id: e.id,
      home_id: e.home_id,
      child_id: null,
      audience: "responsible_individual",
      target_staff_id: null,
      severity: "critical",
      title: `RI escalation: ${e.alert_kind.replace(/_/g, " ")}`,
      body: e.message,
      created_at: e.detected_at,
      link_href: `/intelligence/care-events/inspection-bundle/trajectory`,
    });
  }

  // Sort: severity asc, then newest first
  built.sort((a, b) => {
    const s = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    if (s !== 0) return s;
    return b.created_at.localeCompare(a.created_at);
  });

  // Decorate with empty per-user state — base loader is viewer-agnostic.
  const items: NotificationItem[] = built.map((b) => ({
    ...b,
    read_at: null,
    dismissed_at: null,
  }));

  const by_severity: Record<NotificationSeverity, number> =
    { critical: 0, warning: 0, info: 0 };
  let for_managers = 0, for_staff = 0, for_responsible_individual = 0;
  for (const i of items) {
    by_severity[i.severity] += 1;
    if (i.audience === "manager") for_managers += 1;
    else if (i.audience === "responsible_individual") for_responsible_individual += 1;
    else for_staff += 1;
  }

  return {
    home_id: homeId,
    generated_at: new Date().toISOString(),
    total: items.length,
    for_managers,
    for_staff,
    for_responsible_individual,
    by_severity,
    items,
    viewer_user_id: null,
    unread: null,
    dismissed: null,
  };
}

// ── Per-user variant (M34) ────────────────────────────────────────────────────
//
// Wraps `loadNotifications` and merges per-user read/dismiss state from
// `db.userNotificationStates`. Notification ids are deterministic so the
// envelope survives across reloads even though the stream is re-derived.
//
// Options:
//   - includeDismissed (default false): hide dismissed entries unless asked.
export interface LoadNotificationsForUserOptions {
  includeDismissed?: boolean;
}

export function loadNotificationsForUser(
  homeId: string,
  userId: string,
  opts: LoadNotificationsForUserOptions = {},
): NotificationStream {
  const { includeDismissed = false } = opts;
  const base = loadNotifications(homeId);
  const states = db.userNotificationStates.findForUser(userId, homeId);
  const byId = new Map(states.map((s) => [s.notification_id, s]));

  const merged: NotificationItem[] = [];
  for (const i of base.items) {
    const s = byId.get(i.id);
    const read_at = s?.read_at ?? null;
    const dismissed_at = s?.dismissed_at ?? null;
    if (dismissed_at && !includeDismissed) continue;
    merged.push({ ...i, read_at, dismissed_at });
  }

  const by_severity: Record<NotificationSeverity, number> =
    { critical: 0, warning: 0, info: 0 };
  let for_managers = 0, for_staff = 0, for_responsible_individual = 0, unread = 0, dismissed = 0;
  for (const i of merged) {
    by_severity[i.severity] += 1;
    if (i.audience === "manager") for_managers += 1;
    else if (i.audience === "responsible_individual") for_responsible_individual += 1;
    else for_staff += 1;
    if (!i.read_at && !i.dismissed_at) unread += 1;
    if (i.dismissed_at) dismissed += 1;
  }

  return {
    home_id: homeId,
    generated_at: base.generated_at,
    total: merged.length,
    for_managers,
    for_staff,
    for_responsible_individual,
    by_severity,
    items: merged,
    viewer_user_id: userId,
    unread,
    dismissed,
  };
}

export function notificationCount(homeId: string): number {
  return loadNotifications(homeId).total;
}
