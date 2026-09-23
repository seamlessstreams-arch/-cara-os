// ══════════════════════════════════════════════════════════════════════════════
// CARA — REGULATION 40 NOTIFICATIONS: read and write-through
//
// Reg 40 is evidenced by the record of the notification, not by the fact of it.
// Until this module existed there was no record: the eight /api/v1 readers
// resolved to the in-memory store, which live-mode empties at module load, and
// notifiable-events-service.ts queried cs_notifiable_events, which had no
// migration and answered "relation does not exist" to every call.
//
// Both now use the same two tables (20260923120000_persist_notifiable_events).
// The /api/v1 routes expect the flat three-recipient shape from
// src/types/extended.ts, so toFlatEvent() projects into it — the same approach
// cs_key_work_sessions already uses to serve two shapes from one table.
//
// Nothing in the projection invents a judgement the record does not carry. See
// ofstedStatus().
//
// Errors are READ and reported, not swallowed. supabase-js does not throw on a
// missing table or a bad column: it resolves with the failure in `error`, so a
// bare try/catch around these calls would catch nothing and hide everything.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "./server";
import { tenantHomeId } from "./tenant";
import type { RawClient } from "@/lib/supabase/loose-client";
import type {
  NotifiableEvent,
  NotifiableNotification,
  NotifiableEventType,
  NotifiableStatus,
} from "@/types/extended";

function raw(c: NonNullable<ReturnType<typeof createServerClient>>): RawClient {
  return c as unknown as RawClient;
}

export type NotificationRow = {
  id?: string;
  event_id?: string | null;
  recipient_type?: string | null;
  recipient_name?: string | null;
  body?: string | null;
  method?: string | null;
  reference_number?: string | null;
  status?: string | null;
  deadline?: string | null;
  sent_date?: string | null;
  sent_by?: string | null;
  met_deadline?: boolean | null;
};

export type EventRow = {
  id?: string;
  event_type?: string | null;
  event_date?: string | null;
  child_id?: string | null;
  summary?: string | null;
  description?: string | null;
  immediate_actions_taken?: string | null;
  reported_by?: string | null;
  follow_up?: string | null;
  lesson_learned?: string | null;
};

/** The three recipients the flat shape can express, and their stored names. */
const FLAT_RECIPIENTS = {
  ofsted: "ofsted",
  local_authority: "local_authority",
  placing: "placing_authority",
} as const;

const EMPTY_NOTIFICATION: NotifiableNotification = {
  body: "",
  notified_date: null,
  method: "",
  reference: null,
};

function toNotification(row: NotificationRow | undefined): NotifiableNotification {
  if (!row) return { ...EMPTY_NOTIFICATION };
  return {
    body: row.body ?? "",
    notified_date: row.sent_date ?? null,
    method: row.method ?? "",
    reference: row.reference_number ?? null,
  };
}

/**
 * The Ofsted leg's status, read from what the row actually records.
 *
 * met_deadline is written at the moment the notification is recorded, so a
 * sent notification always carries its verdict. The last branch exists for a
 * row that somehow has sent_date without met_deadline: that record does not
 * say whether it was timely, and "pending" is the only honest projection —
 * calling it within-24h or late would be this function inventing a compliance
 * judgement the home never made.
 */
export function ofstedStatus(row: NotificationRow | undefined): NotifiableStatus {
  if (!row) return "pending";
  if (row.status === "not_required") return "not_required";
  if (!row.sent_date) return "pending";
  if (row.met_deadline === true) return "notified_within_24h";
  if (row.met_deadline === false) return "notified_late";
  return "pending";
}

/** Project one event row plus its notification rows into the flat app shape. */
export function toFlatEvent(event: EventRow, notifications: NotificationRow[]): NotifiableEvent {
  const byRecipient = (type: string) => notifications.find((n) => n.recipient_type === type);
  return {
    id: event.id ?? "",
    date: event.event_date ?? "",
    event_type: (event.event_type ?? "serious_incident") as NotifiableEventType,
    child_id: event.child_id ?? null,
    summary: event.summary ?? "",
    detail: event.description ?? "",
    immediate_action: event.immediate_actions_taken ?? "",
    reported_by: event.reported_by ?? "",
    ofsted_status: ofstedStatus(byRecipient(FLAT_RECIPIENTS.ofsted)),
    ofsted: toNotification(byRecipient(FLAT_RECIPIENTS.ofsted)),
    local_authority: toNotification(byRecipient(FLAT_RECIPIENTS.local_authority)),
    placing: toNotification(byRecipient(FLAT_RECIPIENTS.placing)),
    follow_up: event.follow_up ?? "",
    lesson_learned: event.lesson_learned ?? "",
  };
}

/**
 * Whether a notification met its deadline — computed once, at write time.
 *
 * Returns null when the answer is not yet knowable (nothing sent, or no
 * deadline recorded), which is stored as null rather than as a default false
 * that would read as a missed deadline the home never missed.
 */
export function metDeadline(sentDate: string | null, deadline: string | null): boolean | null {
  if (!sentDate || !deadline) return null;
  return new Date(sentDate).getTime() <= new Date(deadline).getTime();
}

/** The flat shape's ofsted_status, carried back to the stored verdict. */
function statusToMet(status: NotifiableStatus): boolean | null {
  if (status === "notified_within_24h") return true;
  if (status === "notified_late") return false;
  return null;
}

/**
 * Split a flat event's three embedded recipients into notification rows.
 *
 * A recipient with nothing recorded against it gets no row at all. Writing an
 * empty row would be indistinguishable from "we considered this recipient and
 * they did not need telling", which is a claim the home has not made.
 *
 * deadline for Ofsted is the event date plus 24 hours. That bar is not one
 * this module invents — the app's own NotifiableStatus has carried
 * "notified_within_24h" since before these tables existed, so the deadline is
 * being written down rather than newly decided. Other recipients get no
 * deadline until the record carries one.
 */
export function notificationLegs(
  e: NotifiableEvent,
): Array<NotificationRow & { recipient_type: string }> {
  const legs: Array<NotificationRow & { recipient_type: string }> = [];
  const entries = Object.entries(FLAT_RECIPIENTS) as Array<
    [keyof typeof FLAT_RECIPIENTS, string]
  >;

  for (const [key, recipient] of entries) {
    const n = e[key] as NotifiableNotification | undefined;
    const notRequired = key === "ofsted" && e.ofsted_status === "not_required";
    const recorded = Boolean(n && (n.body || n.notified_date || n.method || n.reference));
    if (!recorded && !notRequired) continue;

    const deadline =
      key === "ofsted" && e.date
        ? new Date(new Date(e.date).getTime() + 24 * 60 * 60 * 1000).toISOString()
        : null;

    legs.push({
      recipient_type: recipient,
      body: n?.body || null,
      method: n?.method || null,
      reference_number: n?.reference ?? null,
      sent_date: n?.notified_date ?? null,
      deadline,
      status: notRequired ? "not_required" : n?.notified_date ? "sent" : "draft",
      met_deadline:
        key === "ofsted"
          ? statusToMet(e.ofsted_status)
          : metDeadline(n?.notified_date ?? null, null),
    });
  }
  return legs;
}

/** Every Reg 40 event for this tenant, newest first, in the flat app shape. */
export async function getNotifiableEvents(filters?: { child_id?: string }): Promise<NotifiableEvent[]> {
  if (!isSupabaseEnabled()) return [];
  const c = createServerClient();
  if (!c) return [];

  let q = raw(c).from("cs_notifiable_events").select("*").eq("home_id", tenantHomeId());
  if (filters?.child_id) q = q.eq("child_id", filters.child_id);
  const { data: events, error: eventsError } = await q.order("event_date", { ascending: false });

  if (eventsError) {
    console.error("[notifiable-events] event read failed — returning empty:", eventsError.message ?? eventsError);
    return [];
  }
  const rows = (events ?? []) as EventRow[];
  if (rows.length === 0) return [];

  const { data: notifications, error: notificationsError } = await raw(c)
    .from("cs_event_notifications")
    .select("*")
    .eq("home_id", tenantHomeId())
    .in("event_id", rows.map((e) => e.id ?? ""));

  if (notificationsError) {
    // The events are real and their notifications are unreadable. Returning the
    // events with empty notification legs would show every one of them as
    // un-notified, which is a worse lie than showing nothing.
    console.error(
      "[notifiable-events] notification read failed — refusing to report events as un-notified:",
      notificationsError.message ?? notificationsError,
    );
    return [];
  }

  const all = (notifications ?? []) as NotificationRow[];
  return rows.map((e) => toFlatEvent(e, all.filter((n) => n.event_id === e.id)));
}

/** Upsert an event and its notification legs by their application ids. */
export async function persistNotifiableEvent(
  event: EventRow & { id: string },
  notifications: Array<NotificationRow & { recipient_type: string }> = [],
): Promise<void> {
  if (!isSupabaseEnabled()) return;
  const c = createServerClient();
  if (!c) return;

  const { error: eventError } = await raw(c).from("cs_notifiable_events").upsert(
    { ...event, home_id: tenantHomeId(), updated_at: new Date().toISOString() },
    { onConflict: "id" },
  );
  if (eventError) {
    console.error("[notifiable-events] event write failed:", eventError.message ?? eventError);
    return;
  }

  if (notifications.length === 0) return;

  const rows = notifications.map((n) => ({
    ...n,
    id: n.id ?? `${event.id}_${n.recipient_type}`,
    event_id: event.id,
    home_id: tenantHomeId(),
    met_deadline: n.met_deadline ?? metDeadline(n.sent_date ?? null, n.deadline ?? null),
    updated_at: new Date().toISOString(),
  }));

  const { error: notificationError } = await raw(c)
    .from("cs_event_notifications")
    .upsert(rows, { onConflict: "id" });
  if (notificationError) {
    console.error(
      "[notifiable-events] notification write failed — the event saved without its notification record:",
      notificationError.message ?? notificationError,
    );
  }
}
