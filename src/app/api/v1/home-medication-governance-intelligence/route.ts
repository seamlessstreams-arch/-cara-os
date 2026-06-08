// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME MEDICATION GOVERNANCE INTELLIGENCE API ROUTE
// GET /api/v1/home-medication-governance-intelligence
// Medication audits, error investigations, near misses, stock checks,
// storage audits, and emergency medication protocols.
// CHR 2015 Reg 12: Medication management.
// NICE guidelines on safe medication practices in children's homes.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeHomeMedicationGovernance,
  type MedAuditInput,
  type MedErrorInput,
  type NearMissInput,
  type StockCheckInput,
  type StorageAuditInput,
  type EmergencyProtocolInput,
} from "@/lib/engines/home-medication-governance-intelligence-engine";

export async function GET() {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  // ── Medication Audit Records ────────────────────────────────────────
  const audits: MedAuditInput[] = (
    (store.medicationAuditRecords ?? []) as any[]
  ).map((x: any) => ({
    id: (x.id ?? "").toString(),
    date: (x.date ?? "").toString().slice(0, 10),
    audit_type: (x.audit_type ?? "").toString(),
    // Translate the store's MedAuditResult enum to the engine's vocabulary.
    result: (x.result === "satisfactory" || x.result === "completed"
      ? "pass"
      : x.result === "discrepancy_found"
        ? "fail"
        : x.result === "action_required"
          ? "action_required"
          : (x.result ?? "pass")) as "pass" | "fail" | "action_required",
    discrepancy: typeof x.discrepancy === "number" ? x.discrepancy : 0,
    storage_correct: !!(x.storage_correct),
    temperature_ok: !!(x.temperature_ok),
    labelling_correct: !!(x.labelling_correct),
    follow_up_required: !!(x.follow_up_required),
  }));

  // ── Medication Error Investigations ─────────────────────────────────
  const errors: MedErrorInput[] = (
    (store.medicationErrorInvestigations ?? []) as any[]
  ).map((x: any) => ({
    id: (x.id ?? "").toString(),
    date_of_error: (x.date_of_error ?? "").toString().slice(0, 10),
    error_severity: (x.error_severity ?? "no_harm") as MedErrorInput["error_severity"],
    status: (x.status ?? "investigating").toString(),
    debrief_held: !!(x.debrief_held),
    root_cause_documented: !!(x.root_cause_analysis),
    systemic_changes_count: Array.isArray(x.systemic_changes) ? x.systemic_changes.length : 0,
    preventive_action_embedded: !!(x.preventive_action_embedded),
    ofsted_notification_required: !!(x.ofsted_notification_required),
  }));

  // ── Medication Near Misses ──────────────────────────────────────────
  const nearMisses: NearMissInput[] = (
    (store.medicationNearMisses ?? []) as any[]
  ).map((x: any) => ({
    id: (x.id ?? "").toString(),
    date: (x.date ?? "").toString().slice(0, 10),
    risk_grade: (x.risk_grade ?? "low") as NearMissInput["risk_grade"],
    learning_points_count: Array.isArray(x.learning_points) ? x.learning_points.length : 0,
    debrief_held: !!(x.debrief_held),
  }));

  // ── Medication Stock Checks ─────────────────────────────────────────
  const stockChecks: StockCheckInput[] = (
    (store.medicationStockChecks ?? []) as any[]
  ).map((x: any) => ({
    id: (x.id ?? "").toString(),
    date: (x.date ?? "").toString().slice(0, 10),
    check_type: (x.check_type ?? "weekly").toString(),
    status: (x.status ?? "balanced") as StockCheckInput["status"],
    items_count: Array.isArray(x.items) ? x.items.length : 0,
    discrepancy_count: Array.isArray(x.items) ? x.items.filter((i: any) => i.discrepancy).length : 0,
  }));

  // ── Medication Storage Audits ───────────────────────────────────────
  const storageAudits: StorageAuditInput[] = (
    (store.medicationStorageAudits ?? []) as any[]
  ).map((x: any) => ({
    id: (x.id ?? "").toString(),
    audit_date: (x.audit_date ?? "").toString().slice(0, 10),
    overall_verdict: (x.overall_verdict ?? "pass").toString(),
    temperature_within_range: !!(x.temperature_within_range),
    expiry_check_completed: !!(x.expiry_check_completed),
    expired_items_count: Array.isArray(x.expired_found) ? x.expired_found.length : 0,
    controlled_drugs_correct: !!(x.controlled_drugs_balance_correct),
    security_pass: !!(x.security_check_pass),
    keys_accounted: !!(x.keys_accounted_for),
    record_keeping_pass: !!(x.record_keeping_pass),
    next_audit_due: (x.next_audit_due ?? "").toString().slice(0, 10),
    open_follow_ups: Array.isArray(x.follow_up_actions)
      ? x.follow_up_actions.filter((a: any) => a.status !== "done").length
      : 0,
  }));

  // ── Emergency Medication Protocols ──────────────────────────────────
  const emergencyProtocols: EmergencyProtocolInput[] = (
    (store.emergencyMedicationProtocols ?? []) as any[]
  ).map((x: any) => ({
    id: (x.id ?? "").toString(),
    child_id: (x.child_id ?? "").toString(),
    staff_trained_count: Array.isArray(x.staff_trained_to_administer) ? x.staff_trained_to_administer.length : 0,
    child_self_administer: !!(x.child_can_self_administer),
    child_recognises_symptoms: !!(x.child_recognises_symptoms),
    last_review_date: (x.last_review_date ?? "").toString().slice(0, 10),
    next_review_due: (x.next_review_due ?? "").toString().slice(0, 10),
    signed_off_by_gp: !!(x.signed_off_by_gp),
  }));

  const result = computeHomeMedicationGovernance({
    today,
    audits,
    errors,
    nearMisses,
    stockChecks,
    storageAudits,
    emergencyProtocols,
  });

  return NextResponse.json({ data: result });
}
