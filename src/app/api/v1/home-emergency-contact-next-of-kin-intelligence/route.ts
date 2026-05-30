export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeEmergencyContactNextOfKin,
  type ContactInformationRecordInput,
  type AccessibilityRecordInput,
  type UpdateFrequencyRecordInput,
  type MultiContactRecordInput,
  type OutOfHoursRecordInput,
} from "@/lib/engines/home-emergency-contact-next-of-kin-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    const rawContacts = (store.contactInformationRecords ?? []) as any[];
    const contact_information_records: ContactInformationRecordInput[] = rawContacts.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      contact_name: r.contact_name ?? "",
      relationship: r.relationship ?? "",
      contact_type: r.contact_type ?? "emergency_contact",
      phone_primary: r.phone_primary ?? "",
      phone_secondary: r.phone_secondary ?? null,
      email: r.email ?? null,
      address_on_file: r.address_on_file ?? false,
      last_verified_date: r.last_verified_date ?? null,
      is_current: r.is_current ?? false,
      consent_to_contact: r.consent_to_contact ?? false,
      priority_order: r.priority_order ?? 1,
      notes: r.notes ?? null,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawAccessibility = (store.accessibilityRecords ?? []) as any[];
    const accessibility_records: AccessibilityRecordInput[] = rawAccessibility.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      contact_id: r.contact_id ?? "",
      test_date: (r.test_date ?? today).toString(),
      phone_reachable: r.phone_reachable ?? false,
      answered_within_3_rings: r.answered_within_3_rings ?? false,
      voicemail_available: r.voicemail_available ?? false,
      alternative_method_tested: r.alternative_method_tested ?? false,
      alternative_method_successful: r.alternative_method_successful ?? false,
      response_time_minutes: r.response_time_minutes ?? null,
      tested_by: r.tested_by ?? "",
      test_type: r.test_type ?? "routine_check",
      notes: r.notes ?? null,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawUpdates = (store.updateFrequencyRecords ?? []) as any[];
    const update_frequency_records: UpdateFrequencyRecordInput[] = rawUpdates.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      contact_id: r.contact_id ?? "",
      update_date: (r.update_date ?? today).toString(),
      update_type: r.update_type ?? "scheduled_review",
      fields_updated: r.fields_updated ?? [],
      verified_accurate: r.verified_accurate ?? false,
      updated_by: r.updated_by ?? "",
      next_review_due: r.next_review_due ?? null,
      review_overdue: r.review_overdue ?? false,
      notes: r.notes ?? null,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawMultiContact = (store.multiContactRecords ?? []) as any[];
    const multi_contact_records: MultiContactRecordInput[] = rawMultiContact.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      total_contacts_on_file: r.total_contacts_on_file ?? 0,
      emergency_contacts_count: r.emergency_contacts_count ?? 0,
      next_of_kin_designated: r.next_of_kin_designated ?? false,
      social_worker_contact_on_file: r.social_worker_contact_on_file ?? false,
      placing_authority_contact_on_file: r.placing_authority_contact_on_file ?? false,
      out_of_area_contact_available: r.out_of_area_contact_available ?? false,
      diverse_relationship_types: r.diverse_relationship_types ?? false,
      last_reviewed_date: (r.last_reviewed_date ?? today).toString(),
      gaps_identified: r.gaps_identified ?? [],
      gaps_addressed: r.gaps_addressed ?? false,
      reviewed_by: r.reviewed_by ?? "",
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawOOH = (store.outOfHoursRecords ?? []) as any[];
    const out_of_hours_records: OutOfHoursRecordInput[] = rawOOH.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      out_of_hours_contact_designated: r.out_of_hours_contact_designated ?? false,
      edt_number_on_file: r.edt_number_on_file ?? false,
      on_call_manager_accessible: r.on_call_manager_accessible ?? false,
      nhs_111_accessible: r.nhs_111_accessible ?? false,
      local_hospital_number_on_file: r.local_hospital_number_on_file ?? false,
      police_non_emergency_on_file: r.police_non_emergency_on_file ?? false,
      placing_authority_ooh_on_file: r.placing_authority_ooh_on_file ?? false,
      last_tested_date: r.last_tested_date ?? null,
      test_successful: r.test_successful ?? false,
      backup_contact_available: r.backup_contact_available ?? false,
      escalation_procedure_documented: r.escalation_procedure_documented ?? false,
      staff_aware_of_procedure: r.staff_aware_of_procedure ?? false,
      reviewed_by: r.reviewed_by ?? "",
      created_at: (r.created_at ?? today).toString(),
    }));

    const result = computeEmergencyContactNextOfKin({
      today,
      total_children,
      contact_information_records,
      accessibility_records,
      update_frequency_records,
      multi_contact_records,
      out_of_hours_records,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
