// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME MEDICATION MANAGEMENT INTELLIGENCE API ROUTE
// GET /api/v1/home-medication-management-intelligence
// Medication administration, errors, witnessing, stock, compliance.
// CHR 2015 Reg 23: "Health needs — including medication."
// SCCIF: "Children's medication is managed safely."
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeHomeMedicationManagement,
  type MedicationInput,
  type MedicationAdminInput,
  type MedicationErrorInput,
} from "@/lib/engines/home-medication-management-intelligence-engine";

export async function GET() {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  // ── Medications ──────────────────────────────────────────────────────
  const medications: MedicationInput[] = (
    (store.medications ?? []) as any[]
  ).map((m: any) => ({
    id: (m.id ?? "").toString(),
    child_id: (m.child_id ?? "").toString(),
    name: (m.name ?? "").toString(),
    type: (m.type ?? "regular").toString(),
    dosage: (m.dosage ?? "").toString(),
    frequency: (m.frequency ?? "").toString(),
    is_active: !!(m.is_active),
    stock_count: typeof m.stock_count === "number" ? m.stock_count : null,
    stock_last_checked: m.stock_last_checked ? (m.stock_last_checked).toString().slice(0, 10) : null,
    prescriber: (m.prescriber ?? "").toString(),
    start_date: (m.start_date ?? "").toString().slice(0, 10),
    end_date: m.end_date ? (m.end_date).toString().slice(0, 10) : null,
    special_instructions: (m.special_instructions ?? "").toString(),
  }));

  // ── Administrations ──────────────────────────────────────────────────
  const administrations: MedicationAdminInput[] = (
    (store.medicationAdministrations ?? []) as any[]
  ).map((a: any) => ({
    id: (a.id ?? "").toString(),
    medication_id: (a.medication_id ?? "").toString(),
    child_id: (a.child_id ?? "").toString(),
    scheduled_time: (a.scheduled_time ?? "").toString(),
    actual_time: a.actual_time ? (a.actual_time).toString() : null,
    status: (a.status ?? "scheduled").toString(),
    administered_by: a.administered_by ? (a.administered_by).toString() : null,
    witnessed_by: a.witnessed_by ? (a.witnessed_by).toString() : null,
    dose_given: a.dose_given ? (a.dose_given).toString() : null,
    reason_not_given: a.reason_not_given ? (a.reason_not_given).toString() : null,
    notes: a.notes ? (a.notes).toString() : null,
    prn_reason: a.prn_reason ? (a.prn_reason).toString() : null,
    prn_effectiveness: a.prn_effectiveness ? (a.prn_effectiveness).toString() : null,
  }));

  // ── Medication errors ────────────────────────────────────────────────
  const errors: MedicationErrorInput[] = (
    (store.medicationErrors ?? []) as any[]
  ).map((e: any) => ({
    id: (e.id ?? "").toString(),
    child_id: (e.child_id ?? "").toString(),
    date_occurred: (e.date_occurred ?? "").toString().slice(0, 10),
    error_type: (e.error_type ?? "").toString(),
    severity: (e.severity ?? "minor").toString(),
    status: (e.status ?? "open").toString(),
    root_cause: (e.root_cause ?? "").toString(),
    remedial_actions_count: Array.isArray(e.remedial_actions) ? e.remedial_actions.length : (typeof e.remedial_actions_count === "number" ? e.remedial_actions_count : 0),
  }));

  // ── Total children ───────────────────────────────────────────────────
  const totalChildren = (store.youngPeople ?? []).filter(
    (yp: any) => yp.status === "current",
  ).length;

  const result = computeHomeMedicationManagement({
    today,
    medications,
    administrations,
    errors,
    total_children: totalChildren,
  });

  return NextResponse.json({ data: result });
}
