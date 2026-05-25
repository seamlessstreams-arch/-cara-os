// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — NOTIFIABLE EVENTS INTELLIGENCE API ROUTE
// GET /api/v1/notifiable-events-intelligence
// Returns Reg 40 notifiable events analysis: notification compliance,
// event distribution, per-child frequency, and ARIA intelligence.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeNotifiableEventsIntelligence,
  type NotifiableEventInput,
  type ChildRef,
  type StaffRef,
} from "@/lib/engines/notifiable-events-intelligence-engine";

export async function GET() {
  const store = getStore();

  const events: NotifiableEventInput[] = (store.notifiableEvents ?? []).map((e: any) => ({
    id: e.id,
    date: typeof e.date === "string" ? e.date.slice(0, 10) : e.date,
    event_type: e.event_type,
    child_id: e.child_id,
    summary: e.summary,
    reported_by: e.reported_by,
    ofsted_status: e.ofsted_status,
    ofsted_notified_date: e.ofsted?.notified_date ?? null,
    la_notified_date: e.local_authority?.notified_date ?? null,
    placing_notified_date: e.placing?.notified_date ?? null,
    follow_up: e.follow_up ?? "",
    lesson_learned: e.lesson_learned ?? "",
  }));

  const children: ChildRef[] = (store.youngPeople ?? []).map((yp: any) => ({
    id: yp.id,
    name: yp.preferred_name ?? `${yp.first_name} ${yp.last_name}`,
  }));

  const staff: StaffRef[] = (store.staff ?? [])
    .filter((s: any) => s.is_active)
    .map((s: any) => ({
      id: s.id,
      name: s.full_name ?? `${s.first_name} ${s.last_name}`,
    }));

  const result = computeNotifiableEventsIntelligence({ events, children, staff });

  return NextResponse.json({ data: result });
}
