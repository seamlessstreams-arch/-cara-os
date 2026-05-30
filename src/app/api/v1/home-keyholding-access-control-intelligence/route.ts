// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME KEYHOLDING & ACCESS CONTROL INTELLIGENCE API ROUTE
// GET /api/v1/home-keyholding-access-control-intelligence
// Cross-domain composite: keyRegisterRecords + accessControlRecords +
// keyTrackingRecords + securityAuditRecords + childSafeRecords
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeKeyholdingAccessControl,
  type KeyRegisterRecordInput,
  type AccessControlRecordInput,
  type KeyTrackingRecordInput,
  type SecurityAuditRecordInput,
  type ChildSafeRecordInput,
} from "@/lib/engines/home-keyholding-access-control-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    const staffList = (store.staff ?? []) as any[];
    const total_staff = staffList.filter((s: any) => s.status === "active" || s.status === "current").length;

    const rawKeyRegister = (store.keyRegisterRecords ?? []) as any[];
    const key_register_records: KeyRegisterRecordInput[] = rawKeyRegister.map((k: any) => ({
      id: k.id ?? "",
      date: (k.date ?? today).toString(),
      key_id: k.key_id ?? "",
      key_label: k.key_label ?? "",
      key_type: k.key_type ?? "other",
      location_correct: !!k.location_correct,
      holder_recorded: !!k.holder_recorded,
      holder_authorised: !!k.holder_authorised,
      register_entry_complete: !!k.register_entry_complete,
      register_entry_accurate: !!k.register_entry_accurate,
      last_audit_date: k.last_audit_date ?? null,
      audit_passed: !!k.audit_passed,
      duplicate_exists: !!k.duplicate_exists,
      spare_key_secured: !!k.spare_key_secured,
      notes: k.notes ?? "",
      created_at: (k.created_at ?? today).toString(),
    }));

    const rawAccessControl = (store.accessControlRecords ?? []) as any[];
    const access_control_records: AccessControlRecordInput[] = rawAccessControl.map((a: any) => ({
      id: a.id ?? "",
      date: (a.date ?? today).toString(),
      area_name: a.area_name ?? "",
      area_type: a.area_type ?? "other",
      access_method: a.access_method ?? "key",
      access_control_active: !!a.access_control_active,
      access_logged: !!a.access_logged,
      unauthorised_access_attempt: !!a.unauthorised_access_attempt,
      visitor_protocol_followed: !!a.visitor_protocol_followed,
      child_safe_lock_fitted: !!a.child_safe_lock_fitted,
      emergency_override_tested: !!a.emergency_override_tested,
      compliant: !!a.compliant,
      staff_id: a.staff_id ?? null,
      notes: a.notes ?? "",
      created_at: (a.created_at ?? today).toString(),
    }));

    const rawKeyTracking = (store.keyTrackingRecords ?? []) as any[];
    const key_tracking_records: KeyTrackingRecordInput[] = rawKeyTracking.map((t: any) => ({
      id: t.id ?? "",
      date: (t.date ?? today).toString(),
      key_id: t.key_id ?? "",
      key_label: t.key_label ?? "",
      action: t.action ?? "issued",
      staff_id: t.staff_id ?? "",
      staff_name: t.staff_name ?? "",
      issued_at: t.issued_at ?? null,
      returned_at: t.returned_at ?? null,
      returned_on_time: !!t.returned_on_time,
      handover_witnessed: !!t.handover_witnessed,
      signed_for: !!t.signed_for,
      reason: t.reason ?? "",
      shift_end_return_compliant: !!t.shift_end_return_compliant,
      notes: t.notes ?? "",
      created_at: (t.created_at ?? today).toString(),
    }));

    const rawSecurityAudit = (store.securityAuditRecords ?? []) as any[];
    const security_audit_records: SecurityAuditRecordInput[] = rawSecurityAudit.map((a: any) => ({
      id: a.id ?? "",
      date: (a.date ?? today).toString(),
      audit_type: a.audit_type ?? "comprehensive",
      auditor: a.auditor ?? "",
      findings_count: a.findings_count ?? 0,
      critical_findings: a.critical_findings ?? 0,
      actions_raised: a.actions_raised ?? 0,
      actions_completed: a.actions_completed ?? 0,
      passed: !!a.passed,
      next_audit_due: a.next_audit_due ?? null,
      overdue: !!a.overdue,
      recommendations: a.recommendations ?? "",
      notes: a.notes ?? "",
      created_at: (a.created_at ?? today).toString(),
    }));

    const rawChildSafe = (store.childSafeRecords ?? []) as any[];
    const child_safe_records: ChildSafeRecordInput[] = rawChildSafe.map((c: any) => ({
      id: c.id ?? "",
      date: (c.date ?? today).toString(),
      area_name: c.area_name ?? "",
      area_type: c.area_type ?? "other",
      child_safe_measures_in_place: !!c.child_safe_measures_in_place,
      lock_type_appropriate: !!c.lock_type_appropriate,
      child_can_exit_safely: !!c.child_can_exit_safely,
      restricted_items_secured: !!c.restricted_items_secured,
      window_restrictor_fitted: !!c.window_restrictor_fitted,
      hazard_free: !!c.hazard_free,
      compliant: !!c.compliant,
      inspection_by: c.inspection_by ?? "",
      actions_required: c.actions_required ?? 0,
      actions_completed: c.actions_completed ?? 0,
      notes: c.notes ?? "",
      created_at: (c.created_at ?? today).toString(),
    }));

    const result = computeKeyholdingAccessControl({
      today,
      total_children,
      total_staff,
      key_register_records,
      access_control_records,
      key_tracking_records,
      security_audit_records,
      child_safe_records,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
