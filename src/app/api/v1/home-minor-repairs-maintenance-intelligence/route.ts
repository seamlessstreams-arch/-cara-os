// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME MINOR REPAIRS & MAINTENANCE INTELLIGENCE API ROUTE
// GET /api/v1/home-minor-repairs-maintenance-intelligence
// Cross-domain composite: maintenanceRequestRecords + repairCompletionRecords +
// safetyCheckRecords + conditionAuditRecords + preventativeMaintenanceRecords
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeMinorRepairsMaintenance,
  type MaintenanceRequestRecordInput,
  type RepairCompletionRecordInput,
  type SafetyCheckRecordInput,
  type ConditionAuditRecordInput,
  type PreventativeMaintenanceRecordInput,
} from "@/lib/engines/home-minor-repairs-maintenance-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    const rawMaintenanceRequests = (store.maintenanceRequestRecords ?? []) as any[];
    const maintenance_request_records: MaintenanceRequestRecordInput[] = rawMaintenanceRequests.map((r: any) => ({
      id: r.id ?? "",
      date_reported: (r.date_reported ?? today).toString(),
      reported_by: r.reported_by ?? "",
      category: r.category ?? "other",
      priority: r.priority ?? "routine",
      description: r.description ?? "",
      location: r.location ?? "",
      acknowledged: !!r.acknowledged,
      acknowledged_within_target: !!r.acknowledged_within_target,
      assigned_to: r.assigned_to ?? "",
      status: r.status ?? "open",
      child_reported: !!r.child_reported,
      child_id: r.child_id ?? null,
      affects_safety: !!r.affects_safety,
      affects_child_area: !!r.affects_child_area,
      date_resolved: r.date_resolved ?? null,
      resolution_notes: r.resolution_notes ?? "",
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawRepairCompletions = (store.repairCompletionRecords ?? []) as any[];
    const repair_completion_records: RepairCompletionRecordInput[] = rawRepairCompletions.map((r: any) => ({
      id: r.id ?? "",
      request_id: r.request_id ?? "",
      date_started: (r.date_started ?? today).toString(),
      date_completed: (r.date_completed ?? today).toString(),
      completed_within_target: !!r.completed_within_target,
      target_days: r.target_days ?? 0,
      actual_days: r.actual_days ?? 0,
      repair_quality: r.repair_quality ?? "acceptable",
      contractor_used: !!r.contractor_used,
      contractor_name: r.contractor_name ?? "",
      cost_gbp: r.cost_gbp ?? 0,
      sign_off_by: r.sign_off_by ?? "",
      sign_off_date: r.sign_off_date ?? null,
      follow_up_required: !!r.follow_up_required,
      follow_up_completed: !!r.follow_up_completed,
      child_area_restored: !!r.child_area_restored,
      photographic_evidence: !!r.photographic_evidence,
      notes: r.notes ?? "",
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawSafetyChecks = (store.safetyCheckRecords ?? []) as any[];
    const safety_check_records: SafetyCheckRecordInput[] = rawSafetyChecks.map((c: any) => ({
      id: c.id ?? "",
      check_type: c.check_type ?? "general_hs",
      date_completed: (c.date_completed ?? today).toString(),
      next_due_date: (c.next_due_date ?? today).toString(),
      compliant: !!c.compliant,
      certificate_obtained: !!c.certificate_obtained,
      actions_required: c.actions_required ?? 0,
      actions_completed: c.actions_completed ?? 0,
      inspector: c.inspector ?? "",
      regulatory_requirement: !!c.regulatory_requirement,
      overdue: !!c.overdue,
      risk_level: c.risk_level ?? "low",
      notes: c.notes ?? "",
      created_at: (c.created_at ?? today).toString(),
    }));

    const rawConditionAudits = (store.conditionAuditRecords ?? []) as any[];
    const condition_audit_records: ConditionAuditRecordInput[] = rawConditionAudits.map((a: any) => ({
      id: a.id ?? "",
      date: (a.date ?? today).toString(),
      area_inspected: a.area_inspected ?? "",
      auditor: a.auditor ?? "",
      overall_condition: a.overall_condition ?? "fair",
      cleanliness_score: a.cleanliness_score ?? 3,
      decoration_score: a.decoration_score ?? 3,
      structural_score: a.structural_score ?? 3,
      safety_score: a.safety_score ?? 3,
      child_friendly: !!a.child_friendly,
      issues_found: a.issues_found ?? 0,
      issues_resolved: a.issues_resolved ?? 0,
      follow_up_required: !!a.follow_up_required,
      follow_up_completed: !!a.follow_up_completed,
      photographic_evidence: !!a.photographic_evidence,
      child_feedback_sought: !!a.child_feedback_sought,
      child_feedback_positive: !!a.child_feedback_positive,
      notes: a.notes ?? "",
      created_at: (a.created_at ?? today).toString(),
    }));

    const rawPreventativeMaintenance = (store.preventativeMaintenanceRecords ?? []) as any[];
    const preventative_maintenance_records: PreventativeMaintenanceRecordInput[] = rawPreventativeMaintenance.map((p: any) => ({
      id: p.id ?? "",
      task_name: p.task_name ?? "",
      category: p.category ?? "general",
      frequency: p.frequency ?? "monthly",
      last_completed: (p.last_completed ?? today).toString(),
      next_due: (p.next_due ?? today).toString(),
      completed_on_schedule: !!p.completed_on_schedule,
      overdue: !!p.overdue,
      contractor_required: !!p.contractor_required,
      contractor_booked: !!p.contractor_booked,
      cost_gbp: p.cost_gbp ?? 0,
      documented: !!p.documented,
      risk_if_missed: p.risk_if_missed ?? "low",
      affects_child_environment: !!p.affects_child_environment,
      notes: p.notes ?? "",
      created_at: (p.created_at ?? today).toString(),
    }));

    const result = computeMinorRepairsMaintenance({
      today,
      total_children,
      maintenance_request_records,
      repair_completion_records,
      safety_check_records,
      condition_audit_records,
      preventative_maintenance_records,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
