// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME STATUTORY NOTIFICATION COMPLIANCE INTELLIGENCE API ROUTE
// GET /api/v1/home-statutory-notification-compliance-intelligence
// Synthesises notification log entries and notifiable events to assess
// timeliness, completeness, documentation, follow-up, and regulatory accuracy.
// CHR 2015 Reg 40, 41. SCCIF: "Safe", "Well-led and managed."
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeStatutoryNotificationCompliance,
  type NotificationRecordInput,
  type NotifiableEventRecordInput,
} from "@/lib/engines/home-statutory-notification-compliance-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const youngPeople = (store.youngPeople ?? []) as any[];
    const total_children = youngPeople.length;

    // Notification log entries
    const rawNotifications = (store.notificationLogEntries ?? []) as any[];
    const notifications: NotificationRecordInput[] = rawNotifications.map((n: any) => ({
      id: n.id ?? "",
      date: (n.date ?? today).toString().slice(0, 10),
      notified_to: n.notified_to ?? "",
      notification_type: n.notification_type ?? "",
      regulation: n.regulation ?? "",
      within_timeframe: n.within_timeframe ?? false,
      acknowledgement_received: n.acknowledgement_received ?? false,
      has_event_summary: !!(n.event_summary && n.event_summary.trim().length > 0),
      has_linked_event: !!(n.linked_event && n.linked_event.trim().length > 0),
    }));

    // Notifiable events
    const rawEvents = (store.notifiableEvents ?? []) as any[];
    const notifiable_events: NotifiableEventRecordInput[] = rawEvents.map((e: any) => ({
      id: e.id ?? "",
      date: (e.date ?? today).toString().slice(0, 10),
      event_type: e.event_type ?? "",
      severity: e.severity ?? "moderate",
      notification_required: e.notification_required ?? false,
      notification_sent: e.notification_sent ?? false,
      follow_up_required: e.follow_up_required ?? false,
      follow_up_completed: e.follow_up_completed ?? false,
    }));

    const result = computeStatutoryNotificationCompliance({
      today, total_children, notifications, notifiable_events,
    });
    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
