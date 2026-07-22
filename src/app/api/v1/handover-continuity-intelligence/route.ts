// ══════════════════════════════════════════════════════════════════════════════
// CARA — HANDOVER CONTINUITY INTELLIGENCE API ROUTE
// GET /api/v1/handover-continuity-intelligence
// Returns handover completion analysis, sign-off compliance, child mood
// trends, escalation tracking, and Cara shift continuity insights.
// Reg 34(1)(b), SCCIF shift communication, Quality Standards continuity.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dal } from "@/lib/db/dal";
import {
  computeHandoverContinuityIntelligence,
  type HandoverInput,
  type StaffRef,
  type ChildRef,
} from "@/lib/engines/handover-continuity-intelligence-engine";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function safeList(p: Promise<any[]>): Promise<any[]> {
  try {
    const r = await p;
    return Array.isArray(r) ? r : [];
  } catch {
    return [];
  }
}

export async function GET() {
  const [handoverRecords, staffList, youngPeople] = await Promise.all([
    safeList(dal.handovers.findAll()),
    safeList(dal.staff.findAll()),
    safeList(dal.youngPeople.findAll()),
  ]);

  // ── Map handovers ─────────────────────────────────────────────────────
  const handovers: HandoverInput[] = handoverRecords.map((h: any) => ({
    id: h.id,
    shift_date: h.shift_date,
    shift_from: h.shift_from,
    shift_to: h.shift_to,
    handover_time: h.handover_time,
    completed_at: h.completed_at ?? null,
    outgoing_staff: h.outgoing_staff ?? [],
    incoming_staff: h.incoming_staff ?? [],
    created_by: h.created_by,
    signed_off_by: h.signed_off_by ?? null,
    sign_offs: (h.sign_offs ?? []).map((s: any) => ({
      staff_id: s.staff_id,
      acknowledged_at: s.acknowledged_at,
      notes: s.notes ?? null,
    })),
    child_updates: (h.child_updates ?? []).map((u: any) => ({
      child_id: u.child_id,
      mood_score: u.mood_score ?? null,
      key_notes: u.key_notes ?? "",
      alerts: u.alerts ?? [],
    })),
    general_notes: h.general_notes ?? "",
    flags: h.flags ?? [],
    linked_incident_ids: h.linked_incident_ids ?? [],
    created_at: h.created_at,
  }));

  // ── Map active staff ──────────────────────────────────────────────────
  const staff: StaffRef[] = staffList
    .filter((s: any) => s.is_active)
    .map((s: any) => ({
      id: s.id,
      name: s.full_name ?? `${s.first_name} ${s.last_name}`,
    }));

  // ── Map young people ──────────────────────────────────────────────────
  const children: ChildRef[] = youngPeople.map((yp: any) => ({
    id: yp.id,
    name: yp.preferred_name ?? `${yp.first_name} ${yp.last_name}`,
  }));

  // ── Run engine ────────────────────────────────────────────────────────
  const result = computeHandoverContinuityIntelligence({
    handovers,
    staff,
    children,
  });

  return NextResponse.json({ data: result });
}
