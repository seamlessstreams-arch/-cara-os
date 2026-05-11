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

export type NotificationSeverity = "info" | "warning" | "critical";
export type NotificationAudience = "manager" | "staff";
export type NotificationSource =
  | "returned_record"
  | "sensitive_amendment"
  | "reg40_triage_pending"
  | "manager_review_required"
  | "routing_failure";

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
}

export interface NotificationStream {
  home_id: string;
  generated_at: string;
  total: number;
  for_managers: number;
  for_staff: number;
  by_severity: Record<NotificationSeverity, number>;
  items: NotificationItem[];      // newest first
}

const SEVERITY_ORDER: Record<NotificationSeverity, number> = {
  critical: 0, warning: 1, info: 2,
};

export function loadNotifications(homeId: string): NotificationStream {
  const items: NotificationItem[] = [];

  // ── Returned records: notify the original staff author ────────────────────
  const returned = loadReturnedRecordsQueue(homeId);
  for (const r of returned.rows) {
    items.push({
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
    items.push({
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
    items.push({
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
    items.push({
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
    items.push({
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

  // Sort: severity asc, then newest first
  items.sort((a, b) => {
    const s = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    if (s !== 0) return s;
    return b.created_at.localeCompare(a.created_at);
  });

  const by_severity: Record<NotificationSeverity, number> =
    { critical: 0, warning: 0, info: 0 };
  let for_managers = 0, for_staff = 0;
  for (const i of items) {
    by_severity[i.severity] += 1;
    if (i.audience === "manager") for_managers += 1;
    else for_staff += 1;
  }

  return {
    home_id: homeId,
    generated_at: new Date().toISOString(),
    total: items.length,
    for_managers,
    for_staff,
    by_severity,
    items,
  };
}

export function notificationCount(homeId: string): number {
  return loadNotifications(homeId).total;
}
