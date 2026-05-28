// ==============================================================================
// CORNERSTONE -- HOME PRIVACY & DIGNITY INTELLIGENCE API ROUTE
// GET /api/v1/home-privacy-dignity-intelligence
// Cross-domain composite: privacyAuditRecords + knockEntryRecords +
// boundaryRespectRecords + confidentialityRecords + dignityCareRecords
// ==============================================================================

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computePrivacyDignity,
  type PrivacyAuditRecordInput,
  type KnockEntryRecordInput,
  type BoundaryRespectRecordInput,
  type ConfidentialityRecordInput,
  type DignityCareRecordInput,
} from "@/lib/engines/home-privacy-dignity-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    const rawPrivacyAudit = (store.privacyAuditRecords ?? []) as any[];
    const privacy_audit_records: PrivacyAuditRecordInput[] = rawPrivacyAudit.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      date: (r.date ?? today).toString(),
      private_space_available: !!r.private_space_available,
      private_space_adequate: !!r.private_space_adequate,
      lock_on_bedroom_door: !!r.lock_on_bedroom_door,
      lock_functional: !!r.lock_functional,
      personal_storage_provided: !!r.personal_storage_provided,
      personal_storage_lockable: !!r.personal_storage_lockable,
      bathroom_privacy_adequate: !!r.bathroom_privacy_adequate,
      phone_call_privacy: !!r.phone_call_privacy,
      correspondence_privacy: !!r.correspondence_privacy,
      private_meeting_space_available: !!r.private_meeting_space_available,
      child_satisfaction: r.child_satisfaction ?? 3,
      issues_identified: Array.isArray(r.issues_identified) ? r.issues_identified : [],
      issues_resolved: r.issues_resolved ?? 0,
      auditor: r.auditor ?? "",
      notes: r.notes ?? "",
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawKnockEntry = (store.knockEntryRecords ?? []) as any[];
    const knock_entry_records: KnockEntryRecordInput[] = rawKnockEntry.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      date: (r.date ?? today).toString(),
      staff_member: r.staff_member ?? "",
      knocked_before_entry: !!r.knocked_before_entry,
      waited_for_response: !!r.waited_for_response,
      child_consent_obtained: !!r.child_consent_obtained,
      reason_for_entry: r.reason_for_entry ?? "other",
      time_of_day: r.time_of_day ?? "morning",
      child_complaint_raised: !!r.child_complaint_raised,
      complaint_resolved: !!r.complaint_resolved,
      override_justified: !!r.override_justified,
      notes: r.notes ?? "",
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawBoundaryRespect = (store.boundaryRespectRecords ?? []) as any[];
    const boundary_respect_records: BoundaryRespectRecordInput[] = rawBoundaryRespect.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      date: (r.date ?? today).toString(),
      boundary_type: r.boundary_type ?? "physical",
      boundary_respected: !!r.boundary_respected,
      boundary_documented_in_plan: !!r.boundary_documented_in_plan,
      staff_aware_of_boundary: !!r.staff_aware_of_boundary,
      child_communicated_boundary: !!r.child_communicated_boundary,
      staff_member: r.staff_member ?? "",
      breach_occurred: !!r.breach_occurred,
      breach_severity: r.breach_severity ?? "none",
      breach_addressed: !!r.breach_addressed,
      child_satisfaction: r.child_satisfaction ?? 3,
      restorative_action_taken: !!r.restorative_action_taken,
      notes: r.notes ?? "",
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawConfidentiality = (store.confidentialityRecords ?? []) as any[];
    const confidentiality_records: ConfidentialityRecordInput[] = rawConfidentiality.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      date: (r.date ?? today).toString(),
      record_type: r.record_type ?? "other",
      stored_securely: !!r.stored_securely,
      access_controlled: !!r.access_controlled,
      shared_appropriately: !!r.shared_appropriately,
      consent_for_sharing_obtained: !!r.consent_for_sharing_obtained,
      child_informed_of_sharing: !!r.child_informed_of_sharing,
      breach_occurred: !!r.breach_occurred,
      breach_severity: r.breach_severity ?? "none",
      breach_reported: !!r.breach_reported,
      breach_resolved: !!r.breach_resolved,
      data_minimisation_applied: !!r.data_minimisation_applied,
      child_has_access_to_own_records: !!r.child_has_access_to_own_records,
      notes: r.notes ?? "",
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawDignityCare = (store.dignityCareRecords ?? []) as any[];
    const dignity_care_records: DignityCareRecordInput[] = rawDignityCare.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      date: (r.date ?? today).toString(),
      care_type: r.care_type ?? "other",
      dignity_maintained: !!r.dignity_maintained,
      child_choice_offered: !!r.child_choice_offered,
      child_preference_followed: !!r.child_preference_followed,
      age_appropriate_approach: !!r.age_appropriate_approach,
      cultural_sensitivity_shown: !!r.cultural_sensitivity_shown,
      same_gender_carer_requested: !!r.same_gender_carer_requested,
      same_gender_carer_provided: !!r.same_gender_carer_provided,
      child_consent_obtained: !!r.child_consent_obtained,
      child_satisfaction: r.child_satisfaction ?? 3,
      staff_member: r.staff_member ?? "",
      complaint_raised: !!r.complaint_raised,
      complaint_resolved: !!r.complaint_resolved,
      notes: r.notes ?? "",
      created_at: (r.created_at ?? today).toString(),
    }));

    const result = computePrivacyDignity({
      today,
      total_children,
      privacy_audit_records,
      knock_entry_records,
      boundary_respect_records,
      confidentiality_records,
      dignity_care_records,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
