// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME VISITOR MANAGEMENT & SECURITY INTELLIGENCE API ROUTE
// GET /api/v1/home-visitor-management-security-intelligence
// Cross-domain composite: visitorRegistrationRecords + dbsCheckRecords +
// idVerificationRecords + safeguardingProtocolRecords + visitorLogRecords
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeVisitorManagementSecurity,
  type VisitorRegistrationRecordInput,
  type DbsCheckRecordInput,
  type IdVerificationRecordInput,
  type SafeguardingProtocolRecordInput,
  type VisitorLogRecordInput,
} from "@/lib/engines/home-visitor-management-security-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    const rawRegistrations = (store.visitorRegistrationRecords ?? []) as any[];
    const visitor_registration_records: VisitorRegistrationRecordInput[] = rawRegistrations.map((r: any) => ({
      id: r.id ?? "",
      visitor_name: r.visitor_name ?? "",
      visitor_type: r.visitor_type ?? "other",
      visit_date: (r.visit_date ?? today).toString(),
      pre_registered: !!r.pre_registered,
      registration_complete: !!r.registration_complete,
      purpose_recorded: !!r.purpose_recorded,
      host_staff_assigned: !!r.host_staff_assigned,
      host_staff_name: r.host_staff_name ?? null,
      approved_by: r.approved_by ?? null,
      approval_date: r.approval_date ?? null,
      visit_duration_minutes: r.visit_duration_minutes ?? null,
      child_ids_involved: Array.isArray(r.child_ids_involved) ? r.child_ids_involved : [],
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawDbsChecks = (store.dbsCheckRecords ?? []) as any[];
    const dbs_check_records: DbsCheckRecordInput[] = rawDbsChecks.map((d: any) => ({
      id: d.id ?? "",
      visitor_name: d.visitor_name ?? "",
      visitor_type: d.visitor_type ?? "other",
      dbs_required: !!d.dbs_required,
      dbs_verified: !!d.dbs_verified,
      dbs_certificate_number: d.dbs_certificate_number ?? null,
      dbs_level: d.dbs_level ?? null,
      dbs_check_date: d.dbs_check_date ?? null,
      dbs_expiry_date: d.dbs_expiry_date ?? null,
      dbs_expired: !!d.dbs_expired,
      verified_by: d.verified_by ?? null,
      verified_date: d.verified_date ?? null,
      exemption_reason: d.exemption_reason ?? null,
      created_at: (d.created_at ?? today).toString(),
    }));

    const rawIdVerifications = (store.idVerificationRecords ?? []) as any[];
    const id_verification_records: IdVerificationRecordInput[] = rawIdVerifications.map((v: any) => ({
      id: v.id ?? "",
      visitor_name: v.visitor_name ?? "",
      visit_date: (v.visit_date ?? today).toString(),
      id_requested: !!v.id_requested,
      id_provided: !!v.id_provided,
      id_type: v.id_type ?? null,
      id_verified: !!v.id_verified,
      verified_by: v.verified_by ?? null,
      photo_match_confirmed: !!v.photo_match_confirmed,
      refusal_action_taken: v.refusal_action_taken ?? null,
      created_at: (v.created_at ?? today).toString(),
    }));

    const rawSafeguarding = (store.safeguardingProtocolRecords ?? []) as any[];
    const safeguarding_protocol_records: SafeguardingProtocolRecordInput[] = rawSafeguarding.map((s: any) => ({
      id: s.id ?? "",
      visit_date: (s.visit_date ?? today).toString(),
      visitor_name: s.visitor_name ?? "",
      visitor_type: s.visitor_type ?? "other",
      safeguarding_briefing_given: !!s.safeguarding_briefing_given,
      emergency_procedures_shared: !!s.emergency_procedures_shared,
      confidentiality_agreement_signed: !!s.confidentiality_agreement_signed,
      prohibited_areas_communicated: !!s.prohibited_areas_communicated,
      child_protection_policy_acknowledged: !!s.child_protection_policy_acknowledged,
      lone_access_permitted: !!s.lone_access_permitted,
      lone_access_risk_assessed: !!s.lone_access_risk_assessed,
      escort_required: !!s.escort_required,
      escort_provided: !!s.escort_provided,
      escort_staff_name: s.escort_staff_name ?? null,
      incident_during_visit: !!s.incident_during_visit,
      incident_details: s.incident_details ?? null,
      created_at: (s.created_at ?? today).toString(),
    }));

    const rawVisitorLogs = (store.visitorLogRecords ?? []) as any[];
    const visitor_log_records: VisitorLogRecordInput[] = rawVisitorLogs.map((l: any) => ({
      id: l.id ?? "",
      visitor_name: l.visitor_name ?? "",
      visit_date: (l.visit_date ?? today).toString(),
      sign_in_time: l.sign_in_time ?? null,
      sign_out_time: l.sign_out_time ?? null,
      sign_in_recorded: !!l.sign_in_recorded,
      sign_out_recorded: !!l.sign_out_recorded,
      badge_issued: !!l.badge_issued,
      badge_returned: !!l.badge_returned,
      vehicle_registration_recorded: !!l.vehicle_registration_recorded,
      belongings_checked: !!l.belongings_checked,
      departure_confirmed: !!l.departure_confirmed,
      log_reviewed_by: l.log_reviewed_by ?? null,
      log_review_date: l.log_review_date ?? null,
      created_at: (l.created_at ?? today).toString(),
    }));

    const result = computeVisitorManagementSecurity({
      today,
      total_children,
      visitor_registration_records,
      dbs_check_records,
      id_verification_records,
      safeguarding_protocol_records,
      visitor_log_records,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
