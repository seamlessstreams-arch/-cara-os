// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILD MEDICATION INTELLIGENCE API ROUTE
// GET /api/v1/child-medication-intelligence?childId=yp_casey
// Per-child engine analysing medication safety: adherence, witnessing,
// timeliness, PRN usage, stock, errors.
// CHR 2015 Reg 23 (Health), Reg 12 (Safe administration). SCCIF: "Health."
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse, type NextRequest } from "next/server";
import { getRequestIdentity, assertChildHomeAccess } from "@/lib/auth-guard";
import { getStore } from "@/lib/db/store";
import {
  computeChildMedication,
  type MedicationInput,
  type AdministrationInput,
  type MedErrorInput,
} from "@/lib/engines/child-medication-intelligence-engine";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const childId = searchParams.get("childId");

  const identity = await getRequestIdentity(request);
  if (identity instanceof NextResponse) return identity;
  const denied = assertChildHomeAccess(identity, childId);
  if (denied) return denied;
  if (!childId) {
    return NextResponse.json({ error: "childId is required" }, { status: 400 });
  }

  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  // ── Child info ─────────────────────────────────────────────────────────
  const child = (store.youngPeople ?? []).find((yp: any) => yp.id === childId) as any;
  if (!child) {
    return NextResponse.json({ error: "Child not found" }, { status: 404 });
  }
  const childName = (child.name ?? `${child.first_name ?? ""} ${child.last_name ?? ""}`.trim()) || childId;

  // ── Medications ────────────────────────────────────────────────────────
  const medications: MedicationInput[] = ((store.medications ?? []) as any[])
    .filter((m: any) => m.child_id === childId)
    .map((m: any) => ({
      id: m.id,
      name: m.name ?? "Unknown",
      type: m.type ?? "regular",
      dosage: m.dosage ?? "",
      frequency: m.frequency ?? "",
      is_active: !!m.is_active,
      stock_count: typeof m.stock_count === "number" ? m.stock_count : null,
      stock_last_checked: m.stock_last_checked ?? null,
      start_date: (m.start_date ?? today).toString().slice(0, 10),
      end_date: m.end_date ? m.end_date.toString().slice(0, 10) : null,
    }));

  // ── Administrations ────────────────────────────────────────────────────
  const administrations: AdministrationInput[] = ((store.medicationAdministrations ?? []) as any[])
    .filter((a: any) => a.child_id === childId)
    .map((a: any) => ({
      id: a.id,
      medication_id: a.medication_id ?? "",
      scheduled_time: a.scheduled_time ?? "",
      actual_time: a.actual_time ?? null,
      status: a.status ?? "scheduled",
      administered_by: a.administered_by ?? null,
      witnessed_by: a.witnessed_by ?? null,
      dose_given: a.dose_given ?? null,
      reason_not_given: a.reason_not_given ?? null,
      prn_reason: a.prn_reason ?? null,
      prn_effectiveness: a.prn_effectiveness ?? null,
    }));

  // ── Medication Errors ──────────────────────────────────────────────────
  const errors: MedErrorInput[] = ((store.medicationErrors ?? []) as any[])
    .filter((e: any) => e.child_id === childId)
    .map((e: any) => ({
      id: e.id,
      date_occurred: (e.date_occurred ?? today).toString().slice(0, 10),
      error_type: e.error_type ?? "documentation_error",
      severity: e.severity ?? "no_harm",
      status: e.status ?? "reported",
      has_remedial_actions: Array.isArray(e.remedial_actions) && e.remedial_actions.length > 0,
      remedial_actions_completed: Array.isArray(e.remedial_actions) ? e.remedial_actions.filter((a: any) => a.status === "completed").length : 0,
      remedial_actions_total: Array.isArray(e.remedial_actions) ? e.remedial_actions.length : 0,
    }));

  // ── Compute ────────────────────────────────────────────────────────────
  const result = computeChildMedication({
    today,
    child_id: childId,
    child_name: childName,
    medications,
    administrations,
    errors,
  });

  return NextResponse.json({ data: result });
}
