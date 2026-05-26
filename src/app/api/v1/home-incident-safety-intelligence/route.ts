// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME INCIDENT SAFETY INTELLIGENCE API ROUTE
// GET /api/v1/home-incident-safety-intelligence
// Synthesises incidents, restraints, notifiable events, and handovers to
// produce an overall home safety intelligence score.
// CHR 2015 Reg 12, 13, 35, 40. SCCIF: "Safe."
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeHomeIncidentSafety,
  type IncidentInput,
  type RestraintInput,
  type NotifiableEventInput,
  type HandoverInput,
} from "@/lib/engines/home-incident-safety-intelligence-engine";

export async function GET() {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  // ── Total Children ────────────────────────────────────────────────────
  const totalChildren = ((store.youngPeople ?? []) as any[]).length;

  // ── Incidents ─────────────────────────────────────────────────────────
  const incidents: IncidentInput[] = ((store.incidents ?? []) as any[])
    .map((i: any) => ({
      id: i.id,
      type: i.type ?? "other",
      severity: i.severity ?? "medium",
      child_id: i.child_id ?? "",
      date: (i.date ?? today).toString().slice(0, 10),
      status: i.status ?? "open",
      body_map_required: !!i.body_map_required,
      body_map_completed: !!i.body_map_completed,
      requires_oversight: !!i.requires_oversight,
      oversight_completed: !!(i.oversight_by),
      notifications_sent: Array.isArray(i.notifications) ? i.notifications.length : 0,
      has_lessons_learned: !!(i.lessons_learned),
    }));

  // ── Restraints ────────────────────────────────────────────────────────
  const restraints: RestraintInput[] = ((store.restraints ?? []) as any[])
    .map((r: any) => ({
      id: r.id,
      child_id: r.child_id ?? "",
      date: (r.date ?? today).toString().slice(0, 10),
      duration_minutes: typeof r.duration === "number" ? r.duration : (typeof r.duration_minutes === "number" ? r.duration_minutes : 0),
      has_child_debrief: !!(r.child_debrief),
      has_staff_debrief: !!(r.staff_debrief),
      body_map_completed: !!(r.body_map_completed),
      injury_count: Array.isArray(r.injuries) ? r.injuries.length : 0,
    }));

  // ── Notifiable Events ─────────────────────────────────────────────────
  const notifiable_events: NotifiableEventInput[] = ((store.notifiableEvents ?? []) as any[])
    .map((n: any) => ({
      id: n.id,
      date: (n.date ?? today).toString().slice(0, 10),
      event_type: n.event_type ?? "other",
      ofsted_status: n.ofsted_status ?? "pending",
    }));

  // ── Handovers ─────────────────────────────────────────────────────────
  const handovers: HandoverInput[] = ((store.handovers ?? []) as any[])
    .map((h: any) => ({
      id: h.id,
      shift_date: (h.shift_date ?? today).toString().slice(0, 10),
      is_completed: !!(h.completed_at),
      is_signed_off: Array.isArray(h.sign_offs) ? h.sign_offs.length > 0 : !!(h.signed_off_by),
      child_updates_count: Array.isArray(h.child_updates) ? h.child_updates.length : 0,
      flags_count: Array.isArray(h.flags) ? h.flags.length : 0,
      linked_incident_count: Array.isArray(h.linked_incident_ids) ? h.linked_incident_ids.length : 0,
    }));

  // ── Compute ───────────────────────────────────────────────────────────
  const result = computeHomeIncidentSafety({
    today,
    total_children: totalChildren,
    incidents,
    restraints,
    notifiable_events,
    handovers,
  });

  return NextResponse.json({ data: result });
}
