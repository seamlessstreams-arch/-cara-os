// ══════════════════════════════════════════════════════════════════════════════
// CARA — NOTIFIABLE EVENTS SERVICE
// Manages notifiable events and statutory notifications under CHR 2015
// Regulation 40.  Tracks events, required notifications to Ofsted / placing
// authorities / police, deadline compliance, and pattern analysis.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface NotifiableEvent {
  id: string;
  home_id: string;
  event_type: string;
  event_date: string;
  event_time?: string | null;
  child_id?: string | null;
  child_name?: string | null;
  staff_involved?: string[] | null;
  description: string;
  immediate_actions_taken: string;
  outcome?: string | null;
  reported_by: string;
  created_at: string;
  updated_at: string;
}

export interface EventNotification {
  id: string;
  home_id: string;
  event_id: string;
  recipient_type: "ofsted" | "placing_authority" | "police" | "lado" | "parent";
  recipient_name?: string | null;
  sent_date?: string | null;
  sent_by?: string | null;
  method: "phone" | "email" | "online_portal" | "in_person";
  reference_number?: string | null;
  status: string;
  deadline: string;
  acknowledged_date?: string | null;
  acknowledged_by?: string | null;
  created_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const NOTIFIABLE_EVENT_TYPES: {
  type: string;
  label: string;
  deadline_hours: number;
  notify_ofsted: boolean;
  notify_placing_authority: boolean;
  notify_police: boolean;
}[] = [
  { type: "death", label: "Death of a child", deadline_hours: 24, notify_ofsted: true, notify_placing_authority: true, notify_police: true },
  { type: "serious_injury", label: "Serious injury", deadline_hours: 24, notify_ofsted: true, notify_placing_authority: true, notify_police: false },
  { type: "serious_illness", label: "Serious illness", deadline_hours: 24, notify_ofsted: true, notify_placing_authority: true, notify_police: false },
  { type: "child_protection", label: "Child protection enquiry", deadline_hours: 24, notify_ofsted: true, notify_placing_authority: true, notify_police: false },
  { type: "missing", label: "Child missing from home", deadline_hours: 24, notify_ofsted: true, notify_placing_authority: true, notify_police: true },
  { type: "absconding", label: "Child absconding", deadline_hours: 24, notify_ofsted: true, notify_placing_authority: true, notify_police: true },
  { type: "allegation_against_staff", label: "Allegation against staff member", deadline_hours: 24, notify_ofsted: true, notify_placing_authority: true, notify_police: false },
  { type: "physical_intervention", label: "Use of physical intervention", deadline_hours: 72, notify_ofsted: false, notify_placing_authority: true, notify_police: false },
  { type: "police_involvement", label: "Police involvement/arrest", deadline_hours: 24, notify_ofsted: true, notify_placing_authority: true, notify_police: false },
  { type: "substance_misuse", label: "Substance misuse incident", deadline_hours: 72, notify_ofsted: false, notify_placing_authority: true, notify_police: false },
  { type: "placement_breakdown", label: "Unplanned placement ending", deadline_hours: 24, notify_ofsted: true, notify_placing_authority: true, notify_police: false },
  { type: "fire", label: "Fire or safety incident", deadline_hours: 24, notify_ofsted: true, notify_placing_authority: true, notify_police: false },
  { type: "cse_cce", label: "CSE/CCE concern", deadline_hours: 24, notify_ofsted: true, notify_placing_authority: true, notify_police: true },
  { type: "serious_complaint", label: "Serious complaint", deadline_hours: 24, notify_ofsted: true, notify_placing_authority: true, notify_police: false },
  { type: "medication_error", label: "Significant medication error", deadline_hours: 72, notify_ofsted: false, notify_placing_authority: true, notify_police: false },
  { type: "other", label: "Other significant event", deadline_hours: 72, notify_ofsted: false, notify_placing_authority: true, notify_police: false },
];

export const NOTIFICATION_STATUS: string[] = [
  "draft", "pending_approval", "sent", "acknowledged", "overdue",
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

/**
 * Count required notifications for a given event type based on the constant
 * table (ofsted + placing_authority + police where true).
 */
function requiredNotificationsForType(eventType: string): number {
  const cfg = NOTIFIABLE_EVENT_TYPES.find((t) => t.type === eventType);
  if (!cfg) return 1; // fallback: at least placing authority
  let count = 0;
  if (cfg.notify_ofsted) count++;
  if (cfg.notify_placing_authority) count++;
  if (cfg.notify_police) count++;
  return count;
}

/**
 * Compute notification compliance metrics across events and their
 * notifications.
 */
export function computeNotificationCompliance(
  events: NotifiableEvent[],
  notifications: EventNotification[],
): {
  total_events: number;
  total_notifications_required: number;
  total_notifications_sent: number;
  compliance_rate: number | null;
  overdue: EventNotification[];
  by_event_type: Record<string, { count: number; notified: number }>;
  avg_response_hours: number | null;
} {
  const now = new Date();

  // ── required / sent counts ──────────────────────────────────────────
  let totalRequired = 0;
  let totalSent = 0;
  const byEventType: Record<string, { count: number; notified: number }> = {};

  for (const ev of events) {
    const req = requiredNotificationsForType(ev.event_type);
    totalRequired += req;

    if (!byEventType[ev.event_type]) {
      byEventType[ev.event_type] = { count: 0, notified: 0 };
    }
    byEventType[ev.event_type].count++;
  }

  // Count sent notifications per event & overall
  const sentByEvent: Record<string, number> = {};
  for (const n of notifications) {
    if (n.status === "sent" || n.status === "acknowledged") {
      totalSent++;
      sentByEvent[n.event_id] = (sentByEvent[n.event_id] ?? 0) + 1;
    }
  }

  // Map sent counts back to event types
  for (const ev of events) {
    if (sentByEvent[ev.id]) {
      byEventType[ev.event_type].notified += sentByEvent[ev.id];
    }
  }

  // ── overdue ─────────────────────────────────────────────────────────
  const overdue: EventNotification[] = notifications.filter((n) => {
    if (n.status === "sent" || n.status === "acknowledged") return false;
    const deadline = new Date(n.deadline);
    return now > deadline;
  });

  // ── average response hours ──────────────────────────────────────────
  // For each event, find the earliest sent notification date and compute
  // hours from event created_at to that date.
  const eventMap = new Map(events.map((e) => [e.id, e]));
  const earliestSent: Record<string, number> = {};

  for (const n of notifications) {
    if ((n.status === "sent" || n.status === "acknowledged") && n.sent_date) {
      const sentMs = new Date(n.sent_date).getTime();
      if (!earliestSent[n.event_id] || sentMs < earliestSent[n.event_id]) {
        earliestSent[n.event_id] = sentMs;
      }
    }
  }

  let totalHours = 0;
  let hourCount = 0;
  for (const [eventId, sentMs] of Object.entries(earliestSent)) {
    const ev = eventMap.get(eventId);
    if (ev) {
      const createdMs = new Date(ev.created_at).getTime();
      const hours = (sentMs - createdMs) / (1000 * 60 * 60);
      totalHours += hours;
      hourCount++;
    }
  }

  const avgResponseHours =
    hourCount > 0
      ? Math.round((totalHours / hourCount) * 10) / 10
      : null;

  // ── compliance rate ─────────────────────────────────────────────────
  const complianceRate =
    totalRequired > 0
      ? Math.round((totalSent / totalRequired) * 1000) / 10
      : 100;

  return {
    total_events: events.length,
    total_notifications_required: totalRequired,
    total_notifications_sent: totalSent,
    compliance_rate: complianceRate,
    overdue,
    by_event_type: byEventType,
    avg_response_hours: avgResponseHours,
  };
}

/**
 * Compute analytical breakdown of notifiable events.
 */
export function computeEventAnalysis(events: NotifiableEvent[]): {
  total_events: number;
  by_type: Record<string, number>;
  by_month: Record<string, number>;
  children_involved: { child_id: string; child_name: string; count: number }[];
  staff_involved: { name: string; count: number }[];
  trend: "increasing" | "stable" | "decreasing";
} {
  const byType: Record<string, number> = {};
  const byMonth: Record<string, number> = {};
  const childCounts: Record<string, { child_name: string; count: number }> = {};
  const staffCounts: Record<string, number> = {};

  const now = new Date();

  let last30 = 0;
  let prev30 = 0;
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  for (const ev of events) {
    // by type
    byType[ev.event_type] = (byType[ev.event_type] ?? 0) + 1;

    // by month
    const d = new Date(ev.event_date);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    byMonth[monthKey] = (byMonth[monthKey] ?? 0) + 1;

    // children involved
    if (ev.child_id) {
      if (!childCounts[ev.child_id]) {
        childCounts[ev.child_id] = { child_name: ev.child_name ?? "Unknown", count: 0 };
      }
      childCounts[ev.child_id].count++;
    }

    // staff involved
    if (ev.staff_involved) {
      for (const name of ev.staff_involved) {
        staffCounts[name] = (staffCounts[name] ?? 0) + 1;
      }
    }

    // trend buckets
    const eventMs = d.getTime();
    const diffMs = now.getTime() - eventMs;
    if (diffMs <= thirtyDaysMs) {
      last30++;
    } else if (diffMs <= thirtyDaysMs * 2) {
      prev30++;
    }
  }

  // Determine trend
  let trend: "increasing" | "stable" | "decreasing";
  if (last30 > prev30 * 1.25) {
    trend = "increasing";
  } else if (last30 < prev30 * 0.75) {
    trend = "decreasing";
  } else {
    trend = "stable";
  }

  const childrenInvolved = Object.entries(childCounts)
    .map(([child_id, v]) => ({ child_id, child_name: v.child_name, count: v.count }))
    .sort((a, b) => b.count - a.count);

  const staffInvolved = Object.entries(staffCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return {
    total_events: events.length,
    by_type: byType,
    by_month: byMonth,
    children_involved: childrenInvolved,
    staff_involved: staffInvolved,
    trend,
  };
}

/**
 * Identify alerts and risks from events and their notifications.
 */
export function identifyNotificationAlerts(
  events: NotifiableEvent[],
  notifications: EventNotification[],
  now: Date = new Date(),
): { type: string; severity: "critical" | "high" | "medium"; message: string }[] {
  const alerts: { type: string; severity: "critical" | "high" | "medium"; message: string }[] = [];

  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const fortyEightHoursMs = 48 * 60 * 60 * 1000;

  // Index notifications by event_id
  const notificationsByEvent: Record<string, EventNotification[]> = {};
  for (const n of notifications) {
    if (!notificationsByEvent[n.event_id]) {
      notificationsByEvent[n.event_id] = [];
    }
    notificationsByEvent[n.event_id].push(n);
  }

  // ── Per-notification alerts ─────────────────────────────────────────
  for (const n of notifications) {
    // overdue_notification: past deadline and not sent/acknowledged
    if (n.status !== "sent" && n.status !== "acknowledged") {
      const deadline = new Date(n.deadline);
      if (now > deadline) {
        alerts.push({
          type: "overdue_notification",
          severity: "critical",
          message: `Notification to ${n.recipient_type} for event ${n.event_id} is overdue — deadline was ${n.deadline}`,
        });
      }
    }

    // pending_acknowledgement: sent but not acknowledged after 48h
    if (n.status === "sent" && n.sent_date) {
      const sentMs = new Date(n.sent_date).getTime();
      if (now.getTime() - sentMs > fortyEightHoursMs) {
        alerts.push({
          type: "pending_acknowledgement",
          severity: "medium",
          message: `Notification to ${n.recipient_type} for event ${n.event_id} was sent but not acknowledged after 48 hours`,
        });
      }
    }
  }

  // ── Per-event alerts ────────────────────────────────────────────────
  for (const ev of events) {
    // missing_notification: event with no notifications created at all
    const evNotifications = notificationsByEvent[ev.id];
    if (!evNotifications || evNotifications.length === 0) {
      alerts.push({
        type: "missing_notification",
        severity: "high",
        message: `Event "${ev.event_type}" on ${ev.event_date} has no notifications created — requires notification to relevant bodies`,
      });
    }
  }

  // ── Pattern alerts ──────────────────────────────────────────────────

  // high_frequency: 3+ events in 7 days
  const recentEvents = events.filter(
    (e) => now.getTime() - new Date(e.event_date).getTime() <= sevenDaysMs,
  );
  if (recentEvents.length >= 3) {
    alerts.push({
      type: "high_frequency",
      severity: "high",
      message: `${recentEvents.length} notifiable events in the last 7 days — review required`,
    });
  }

  // repeat_child: same child in 3+ events in 30 days
  const childEventsRecent: Record<string, { name: string; count: number }> = {};
  for (const ev of events) {
    if (!ev.child_id) continue;
    const eventMs = new Date(ev.event_date).getTime();
    if (now.getTime() - eventMs > thirtyDaysMs) continue;
    if (!childEventsRecent[ev.child_id]) {
      childEventsRecent[ev.child_id] = { name: ev.child_name ?? "Unknown", count: 0 };
    }
    childEventsRecent[ev.child_id].count++;
  }
  for (const [, v] of Object.entries(childEventsRecent)) {
    if (v.count >= 3) {
      alerts.push({
        type: "repeat_child",
        severity: "medium",
        message: `Child "${v.name}" has been involved in ${v.count} notifiable events in the last 30 days`,
      });
    }
  }

  return alerts;
}

// ── CRUD — Notifiable Events ────────────────────────────────────────────

export async function listNotifiableEvents(
  homeId: string,
  filters?: {
    eventType?: string;
    childId?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  },
): Promise<ServiceResult<NotifiableEvent[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [], persisted: false } as ServiceResult<NotifiableEvent[]>;

  let q = (s.from("cs_notifiable_events") as SB).select("*").eq("home_id", homeId);
  if (filters?.eventType) q = q.eq("event_type", filters.eventType);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.dateFrom) q = q.gte("event_date", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("event_date", filters.dateTo);
  q = q.order("created_at", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createNotifiableEvent(
  input: Omit<NotifiableEvent, "id" | "created_at" | "updated_at">,
): Promise<ServiceResult<NotifiableEvent>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_notifiable_events") as SB)
    .insert({
      home_id: input.home_id,
      event_type: input.event_type,
      event_date: input.event_date,
      event_time: input.event_time ?? null,
      child_id: input.child_id ?? null,
      child_name: input.child_name ?? null,
      staff_involved: input.staff_involved ?? null,
      description: input.description,
      immediate_actions_taken: input.immediate_actions_taken,
      outcome: input.outcome ?? null,
      reported_by: input.reported_by,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateNotifiableEvent(
  id: string,
  updates: Partial<NotifiableEvent>,
): Promise<ServiceResult<NotifiableEvent>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_notifiable_events") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── CRUD — Event Notifications ──────────────────────────────────────────

export async function listEventNotifications(
  homeId: string,
  filters?: {
    eventId?: string;
    status?: string;
    recipientType?: string;
    limit?: number;
  },
): Promise<ServiceResult<EventNotification[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [], persisted: false } as ServiceResult<EventNotification[]>;

  let q = (s.from("cs_event_notifications") as SB).select("*").eq("home_id", homeId);
  if (filters?.eventId) q = q.eq("event_id", filters.eventId);
  if (filters?.status) q = q.eq("status", filters.status);
  if (filters?.recipientType) q = q.eq("recipient_type", filters.recipientType);
  q = q.order("created_at", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createEventNotification(
  input: Omit<EventNotification, "id" | "created_at">,
): Promise<ServiceResult<EventNotification>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_event_notifications") as SB)
    .insert({
      home_id: input.home_id,
      event_id: input.event_id,
      recipient_type: input.recipient_type,
      recipient_name: input.recipient_name ?? null,
      sent_date: input.sent_date ?? null,
      sent_by: input.sent_by ?? null,
      method: input.method,
      reference_number: input.reference_number ?? null,
      status: input.status,
      deadline: input.deadline,
      acknowledged_date: input.acknowledged_date ?? null,
      acknowledged_by: input.acknowledged_by ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateEventNotification(
  id: string,
  updates: Partial<EventNotification>,
): Promise<ServiceResult<EventNotification>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_event_notifications") as SB)
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function acknowledgeNotification(
  id: string,
  acknowledgedBy: string,
): Promise<ServiceResult<EventNotification>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_event_notifications") as SB)
    .update({
      status: "acknowledged",
      acknowledged_date: new Date().toISOString(),
      acknowledged_by: acknowledgedBy,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeNotificationCompliance,
  computeEventAnalysis,
  identifyNotificationAlerts,
  requiredNotificationsForType,
};
