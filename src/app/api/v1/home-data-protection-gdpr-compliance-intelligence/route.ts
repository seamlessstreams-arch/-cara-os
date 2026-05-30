// ==============================================================================
// CORNERSTONE -- HOME DATA PROTECTION & GDPR COMPLIANCE INTELLIGENCE API ROUTE
// GET /api/v1/home-data-protection-gdpr-compliance-intelligence
// Cross-domain composite: dataProtectionPolicyRecords + subjectAccessRequestRecords +
// dataBreachRecords + privacyNoticeRecords + gdprTrainingRecords
// ==============================================================================

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeDataProtectionGdprCompliance,
  type DataProtectionPolicyRecordInput,
  type SubjectAccessRequestRecordInput,
  type DataBreachRecordInput,
  type PrivacyNoticeRecordInput,
  type GdprTrainingRecordInput,
} from "@/lib/engines/home-data-protection-gdpr-compliance-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    const staffList = (store.staff ?? []) as any[];
    const total_staff = staffList.filter((s: any) => s.status === "active" || s.status === "current").length || staffList.length;

    const rawPolicies = (store.dataProtectionPolicyRecords ?? []) as any[];
    const policy_compliance_records: DataProtectionPolicyRecordInput[] = rawPolicies.map((r: any) => ({
      id: r.id ?? "",
      policy_name: r.policy_name ?? "",
      policy_type: r.policy_type ?? "other",
      version: r.version ?? "1.0",
      last_reviewed_date: r.last_reviewed_date ?? null,
      next_review_date: r.next_review_date ?? null,
      approved_by: r.approved_by ?? "",
      approved_date: r.approved_date ?? null,
      compliant_with_gdpr: !!r.compliant_with_gdpr,
      compliant_with_chr2015: !!r.compliant_with_chr2015,
      staff_acknowledged: r.staff_acknowledged ?? 0,
      staff_total: r.staff_total ?? 0,
      gaps_identified: r.gaps_identified ?? 0,
      gaps_resolved: r.gaps_resolved ?? 0,
      dpo_signed_off: !!r.dpo_signed_off,
      accessible_to_staff: !!r.accessible_to_staff,
      notes: r.notes ?? "",
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawSars = (store.subjectAccessRequestRecords ?? []) as any[];
    const sar_records: SubjectAccessRequestRecordInput[] = rawSars.map((r: any) => ({
      id: r.id ?? "",
      requester_type: r.requester_type ?? "other",
      date_received: (r.date_received ?? today).toString(),
      date_acknowledged: r.date_acknowledged ?? null,
      date_completed: r.date_completed ?? null,
      deadline_date: (r.deadline_date ?? today).toString(),
      completed_within_deadline: !!r.completed_within_deadline,
      redaction_applied: !!r.redaction_applied,
      third_party_data_identified: !!r.third_party_data_identified,
      third_party_consulted: !!r.third_party_consulted,
      exemptions_applied: Array.isArray(r.exemptions_applied) ? r.exemptions_applied : [],
      outcome: r.outcome ?? "pending",
      quality_checked: !!r.quality_checked,
      dpo_involved: !!r.dpo_involved,
      complainant_satisfied: !!r.complainant_satisfied,
      notes: r.notes ?? "",
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawBreaches = (store.dataBreachRecords ?? []) as any[];
    const breach_records: DataBreachRecordInput[] = rawBreaches.map((r: any) => ({
      id: r.id ?? "",
      breach_date: (r.breach_date ?? today).toString(),
      detected_date: (r.detected_date ?? today).toString(),
      reported_to_ico: !!r.reported_to_ico,
      reported_to_ico_within_72h: !!r.reported_to_ico_within_72h,
      individuals_notified: !!r.individuals_notified,
      severity: r.severity ?? "low",
      breach_type: r.breach_type ?? "other",
      records_affected: r.records_affected ?? 0,
      children_data_involved: !!r.children_data_involved,
      root_cause_identified: !!r.root_cause_identified,
      corrective_actions_taken: !!r.corrective_actions_taken,
      corrective_actions_completed: !!r.corrective_actions_completed,
      lessons_learned_documented: !!r.lessons_learned_documented,
      recurrence_prevented: !!r.recurrence_prevented,
      dpo_notified: !!r.dpo_notified,
      risk_assessment_completed: !!r.risk_assessment_completed,
      notes: r.notes ?? "",
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawNotices = (store.privacyNoticeRecords ?? []) as any[];
    const privacy_notice_records: PrivacyNoticeRecordInput[] = rawNotices.map((r: any) => ({
      id: r.id ?? "",
      notice_type: r.notice_type ?? "general",
      audience: r.audience ?? "",
      last_updated_date: r.last_updated_date ?? null,
      review_due_date: r.review_due_date ?? null,
      compliant_with_gdpr: !!r.compliant_with_gdpr,
      plain_language: !!r.plain_language,
      age_appropriate: !!r.age_appropriate,
      covers_all_processing: !!r.covers_all_processing,
      lawful_basis_stated: !!r.lawful_basis_stated,
      data_rights_explained: !!r.data_rights_explained,
      retention_periods_stated: !!r.retention_periods_stated,
      contact_details_included: !!r.contact_details_included,
      accessible_format: !!r.accessible_format,
      published: !!r.published,
      acknowledged_count: r.acknowledged_count ?? 0,
      target_audience_count: r.target_audience_count ?? 0,
      notes: r.notes ?? "",
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawTraining = (store.gdprTrainingRecords ?? []) as any[];
    const training_records: GdprTrainingRecordInput[] = rawTraining.map((r: any) => ({
      id: r.id ?? "",
      staff_id: r.staff_id ?? "",
      staff_name: r.staff_name ?? "",
      training_type: r.training_type ?? "other",
      training_date: (r.training_date ?? today).toString(),
      training_provider: r.training_provider ?? "",
      passed: !!r.passed,
      score: r.score ?? null,
      certificate_held: !!r.certificate_held,
      expiry_date: r.expiry_date ?? null,
      refresher_due_date: r.refresher_due_date ?? null,
      refresher_completed: !!r.refresher_completed,
      topics_covered: Array.isArray(r.topics_covered) ? r.topics_covered : [],
      notes: r.notes ?? "",
      created_at: (r.created_at ?? today).toString(),
    }));

    const result = computeDataProtectionGdprCompliance({
      today,
      total_children,
      total_staff,
      policy_compliance_records,
      sar_records,
      breach_records,
      privacy_notice_records,
      training_records,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
