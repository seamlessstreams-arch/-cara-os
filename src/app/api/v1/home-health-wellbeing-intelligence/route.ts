// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME HEALTH & WELLBEING INTELLIGENCE API ROUTE
// GET /api/v1/home-health-wellbeing-intelligence
// Synthesises health records and medication data across all children to produce
// an overall health monitoring and wellbeing intelligence score.
// CHR 2015 Reg 10. SCCIF: "Health", "Experiences and progress."
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeHomeHealthWellbeing,
  type HealthRecordInput,
  type HomeMedicationInput,
  type MedicationAdminInput,
} from "@/lib/engines/home-health-wellbeing-intelligence-engine";

export async function GET() {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  // ── Children ──────────────────────────────────────────────────────────
  const youngPeople = (store.youngPeople ?? []) as any[];
  const totalChildren = youngPeople.length;
  const childIds = youngPeople.map((yp: any) => yp.id as string);

  // ── Health Records ────────────────────────────────────────────────────
  const health_records: HealthRecordInput[] = ((store.healthRecordEntries ?? []) as any[])
    .map((r: any) => {
      const followUpDate = r.follow_up_date ? r.follow_up_date.toString().slice(0, 10) : null;
      return {
        id: r.id,
        child_id: r.child_id ?? "",
        date: (r.date ?? today).toString().slice(0, 10),
        record_type: r.record_type ?? "health_assessment",
        status: r.status ?? "current",
        has_outcome: !!(r.outcome),
        has_follow_up: !!followUpDate,
        follow_up_overdue: followUpDate ? followUpDate < today : false,
      };
    });

  // ── Medications ───────────────────────────────────────────────────────
  const medications: HomeMedicationInput[] = ((store.medications ?? []) as any[])
    .map((m: any) => ({
      id: m.id,
      child_id: m.child_id ?? "",
      is_active: !!m.is_active,
    }));

  // ── Medication Administrations ────────────────────────────────────────
  const medication_administrations: MedicationAdminInput[] = ((store.medicationAdministrations ?? []) as any[])
    .map((a: any) => ({
      id: a.id,
      child_id: a.child_id ?? "",
      date: (a.date ?? a.scheduled_time ?? today).toString().slice(0, 10),
      status: a.status ?? "scheduled",
    }));

  // ── Compute ───────────────────────────────────────────────────────────
  const result = computeHomeHealthWellbeing({
    today,
    total_children: totalChildren,
    child_ids: childIds,
    health_records,
    medications,
    medication_administrations,
  });

  return NextResponse.json({ data: result });
}
