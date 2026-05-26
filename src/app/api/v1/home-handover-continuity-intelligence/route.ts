// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME HANDOVER CONTINUITY INTELLIGENCE API ROUTE
// GET /api/v1/home-handover-continuity-intelligence
// Synthesises handover completion, sign-off, child coverage, and continuity
// indicators to assess the quality of shift-to-shift communication.
// CHR 2015 Reg 13 (Leadership & Management). SCCIF: "Well-Led."
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeHomeHandoverContinuity,
  type HandoverInput,
} from "@/lib/engines/home-handover-continuity-intelligence-engine";

export async function GET() {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  const youngPeople = (store.youngPeople ?? []) as any[];
  const totalChildren = youngPeople.filter((yp: any) => yp.status === "current").length;

  const handovers: HandoverInput[] = ((store.handovers ?? []) as any[])
    .map((h: any) => {
      const childUpdates = Array.isArray(h.child_updates) ? h.child_updates : [];
      const signOffs = Array.isArray(h.sign_offs) ? h.sign_offs : [];
      const outgoingStaff = Array.isArray(h.outgoing_staff) ? h.outgoing_staff : [];
      const incomingStaff = Array.isArray(h.incoming_staff) ? h.incoming_staff : [];
      const flags = Array.isArray(h.flags) ? h.flags : [];
      const linkedIncidents = Array.isArray(h.linked_incident_ids) ? h.linked_incident_ids : [];

      return {
        id: h.id ?? "",
        shift_date: (h.shift_date ?? "").toString().slice(0, 10),
        shift_from: h.shift_from ?? "",
        shift_to: h.shift_to ?? "",
        handover_time: h.handover_time ?? "",
        completed_at: h.completed_at ?? null,
        outgoing_staff_count: outgoingStaff.length,
        incoming_staff_count: incomingStaff.length,
        signed_off_by: h.signed_off_by ?? null,
        sign_off_count: signOffs.length,
        child_update_count: childUpdates.length,
        child_updates_with_mood: childUpdates.filter((cu: any) => cu.mood_score != null).length,
        child_updates_with_alerts: childUpdates.filter((cu: any) =>
          Array.isArray(cu.alerts) && cu.alerts.length > 0
        ).length,
        total_children: totalChildren,
        flag_count: flags.length,
        linked_incident_count: linkedIncidents.length,
        has_general_notes: !!(h.general_notes),
      };
    });

  const result = computeHomeHandoverContinuity({
    today,
    handovers,
  });

  return NextResponse.json({ data: result });
}
