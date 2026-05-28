// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME MEDICATION SAFETY & COMPLIANCE INTELLIGENCE API ROUTE
// GET /api/v1/home-medication-safety-compliance-intelligence
// Cross-domain composite: medicationAdministrations + medicationErrors +
// medicationAuditRecords + medicationStorageAudits + emergencyMedicationProtocols
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeMedicationSafetyCompliance,
  type MedicationAdministrationInput,
  type MedicationErrorInput,
  type MedicationAuditInput,
  type MedicationStorageAuditInput,
  type EmergencyMedicationProtocolInput,
} from "@/lib/engines/home-medication-safety-compliance-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    const rawAdministrations = (store.medicationAdministrations ?? []) as any[];
    const medication_administrations: MedicationAdministrationInput[] = rawAdministrations.map((a: any) => ({
      id: a.id ?? "",
      child_id: a.child_id ?? "",
      date: (a.date ?? today).toString(),
      medication_name: a.medication_name ?? "",
      dose: a.dose ?? "",
      administered_by: a.administered_by ?? "",
      witnessed_by: a.witnessed_by ?? null,
      on_time: !!a.on_time,
      refused: !!a.refused,
      reason_refused: a.reason_refused ?? null,
      is_prn: !!a.is_prn,
      prn_reason_documented: !!a.prn_reason_documented,
      is_controlled_drug: !!a.is_controlled_drug,
      created_at: (a.created_at ?? today).toString(),
    }));

    const rawErrors = (store.medicationErrors ?? []) as any[];
    const medication_errors: MedicationErrorInput[] = rawErrors.map((e: any) => ({
      id: e.id ?? "",
      child_id: e.child_id ?? "",
      date: (e.date ?? today).toString(),
      error_type: e.error_type ?? "other",
      severity: e.severity ?? "minor",
      investigation_completed: !!e.investigation_completed,
      actions_taken: e.actions_taken ?? "",
      created_at: (e.created_at ?? today).toString(),
    }));

    const rawAudits = (store.medicationAuditRecords ?? []) as any[];
    const medication_audit_records: MedicationAuditInput[] = rawAudits.map((a: any) => ({
      id: a.id ?? "",
      audit_date: (a.audit_date ?? today).toString(),
      auditor: a.auditor ?? "",
      all_records_accurate: !!a.all_records_accurate,
      discrepancies_found: a.discrepancies_found ?? 0,
      discrepancies_resolved: a.discrepancies_resolved ?? 0,
      controlled_drugs_checked: !!a.controlled_drugs_checked,
      mar_charts_correct: !!a.mar_charts_correct,
      created_at: (a.created_at ?? today).toString(),
    }));

    const rawStorageAudits = (store.medicationStorageAudits ?? []) as any[];
    const medication_storage_audits: MedicationStorageAuditInput[] = rawStorageAudits.map((s: any) => ({
      id: s.id ?? "",
      audit_date: (s.audit_date ?? today).toString(),
      temperature_in_range: !!s.temperature_in_range,
      locked_storage_verified: !!s.locked_storage_verified,
      expiry_dates_checked: !!s.expiry_dates_checked,
      stock_levels_adequate: !!s.stock_levels_adequate,
      created_at: (s.created_at ?? today).toString(),
    }));

    const rawProtocols = (store.emergencyMedicationProtocols ?? []) as any[];
    const emergency_medication_protocols: EmergencyMedicationProtocolInput[] = rawProtocols.map((p: any) => ({
      id: p.id ?? "",
      child_id: p.child_id ?? "",
      medication_name: p.medication_name ?? "",
      protocol_current: !!p.protocol_current,
      last_reviewed: (p.last_reviewed ?? today).toString(),
      next_review_date: (p.next_review_date ?? today).toString(),
      staff_trained_count: p.staff_trained_count ?? 0,
      created_at: (p.created_at ?? today).toString(),
    }));

    const result = computeMedicationSafetyCompliance({
      today,
      total_children,
      medication_administrations,
      medication_errors,
      medication_audit_records,
      medication_storage_audits,
      emergency_medication_protocols,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
