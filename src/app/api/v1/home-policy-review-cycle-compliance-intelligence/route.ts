export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computePolicyReviewCycleCompliance,
  type PolicyReviewScheduleRecordInput,
  type PolicyVersionControlRecordInput,
  type PolicyAcknowledgementRecordInput,
  type PolicyAlignmentRecordInput,
  type PolicyAccessibilityRecordInput,
} from "@/lib/engines/home-policy-review-cycle-compliance-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const staff = (store.staff ?? []) as any[];
    const total_staff = staff.filter((s: any) => s.status === "current" || s.status === "active").length;

    const policies = (store.policies ?? store.policyRecords ?? []) as any[];
    const total_policies = policies.length;

    const rawReviewSchedule = (store.policyReviewScheduleRecords ?? []) as any[];
    const review_schedule_records: PolicyReviewScheduleRecordInput[] = rawReviewSchedule.map((r: any) => ({
      id: r.id ?? "",
      policy_id: r.policy_id ?? "",
      policy_name: r.policy_name ?? "",
      category: r.category ?? "other",
      last_review_date: (r.last_review_date ?? today).toString(),
      next_review_due: (r.next_review_due ?? today).toString(),
      review_completed: r.review_completed ?? false,
      review_completed_date: r.review_completed_date ?? null,
      reviewer: r.reviewer ?? "",
      review_outcome: r.review_outcome ?? null,
      days_overdue: r.days_overdue ?? 0,
      review_frequency_months: r.review_frequency_months ?? 12,
      responsible_person: r.responsible_person ?? "",
      consultation_undertaken: r.consultation_undertaken ?? false,
      young_people_consulted: r.young_people_consulted ?? false,
      notes: r.notes ?? null,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawVersionControl = (store.policyVersionControlRecords ?? []) as any[];
    const version_control_records: PolicyVersionControlRecordInput[] = rawVersionControl.map((r: any) => ({
      id: r.id ?? "",
      policy_id: r.policy_id ?? "",
      policy_name: r.policy_name ?? "",
      version_number: r.version_number ?? "1.0",
      previous_version: r.previous_version ?? null,
      change_date: (r.change_date ?? today).toString(),
      change_type: r.change_type ?? "scheduled_review",
      change_summary: r.change_summary ?? "",
      approved_by: r.approved_by ?? "",
      approval_date: r.approval_date ?? null,
      superseded_version_archived: r.superseded_version_archived ?? false,
      change_log_maintained: r.change_log_maintained ?? false,
      rationale_documented: r.rationale_documented ?? false,
      effective_date: (r.effective_date ?? today).toString(),
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawAcknowledgement = (store.policyAcknowledgementRecords ?? []) as any[];
    const acknowledgement_records: PolicyAcknowledgementRecordInput[] = rawAcknowledgement.map((r: any) => ({
      id: r.id ?? "",
      policy_id: r.policy_id ?? "",
      policy_name: r.policy_name ?? "",
      staff_id: r.staff_id ?? "",
      staff_name: r.staff_name ?? "",
      acknowledgement_required_date: (r.acknowledgement_required_date ?? today).toString(),
      acknowledged: r.acknowledged ?? false,
      acknowledgement_date: r.acknowledgement_date ?? null,
      comprehension_confirmed: r.comprehension_confirmed ?? false,
      assessment_passed: r.assessment_passed ?? null,
      days_to_acknowledge: r.days_to_acknowledge ?? 0,
      reminder_sent: r.reminder_sent ?? false,
      version_acknowledged: r.version_acknowledged ?? "1.0",
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawAlignment = (store.policyAlignmentRecords ?? []) as any[];
    const alignment_records: PolicyAlignmentRecordInput[] = rawAlignment.map((r: any) => ({
      id: r.id ?? "",
      policy_id: r.policy_id ?? "",
      policy_name: r.policy_name ?? "",
      regulation_reference: r.regulation_reference ?? "",
      regulation_description: r.regulation_description ?? "",
      alignment_status: r.alignment_status ?? "under_review",
      last_alignment_check_date: (r.last_alignment_check_date ?? today).toString(),
      gaps_identified: r.gaps_identified ?? [],
      remediation_actions: r.remediation_actions ?? [],
      remediation_completed: r.remediation_completed ?? false,
      legislative_change_tracked: r.legislative_change_tracked ?? false,
      ofsted_recommendation_addressed: r.ofsted_recommendation_addressed ?? false,
      next_alignment_review_due: (r.next_alignment_review_due ?? today).toString(),
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawAccessibility = (store.policyAccessibilityRecords ?? []) as any[];
    const accessibility_records: PolicyAccessibilityRecordInput[] = rawAccessibility.map((r: any) => ({
      id: r.id ?? "",
      policy_id: r.policy_id ?? "",
      policy_name: r.policy_name ?? "",
      digital_copy_available: r.digital_copy_available ?? false,
      physical_copy_available: r.physical_copy_available ?? false,
      staff_accessible: r.staff_accessible ?? false,
      young_people_version_available: r.young_people_version_available ?? false,
      easy_read_version_available: r.easy_read_version_available ?? false,
      translated_versions_available: r.translated_versions_available ?? false,
      location_documented: r.location_documented ?? false,
      last_accessibility_check_date: (r.last_accessibility_check_date ?? today).toString(),
      accessibility_issues: r.accessibility_issues ?? [],
      issues_resolved: r.issues_resolved ?? false,
      created_at: (r.created_at ?? today).toString(),
    }));

    const result = computePolicyReviewCycleCompliance({
      today,
      total_staff,
      total_policies,
      review_schedule_records,
      version_control_records,
      acknowledgement_records,
      alignment_records,
      accessibility_records,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
