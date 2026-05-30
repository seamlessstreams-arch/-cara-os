// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME STATEMENT OF PURPOSE & CHILDREN'S GUIDE INTELLIGENCE API ROUTE
// GET /api/v1/home-statement-purpose-children-guide-intelligence
// Cross-domain composite: statementRecords + guideRecords +
// reviewCycleRecords + involvementRecords + submissionRecords
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeStatementPurposeChildrenGuide,
  type StatementRecordInput,
  type GuideRecordInput,
  type ReviewCycleRecordInput,
  type InvolvementRecordInput,
  type SubmissionRecordInput,
} from "@/lib/engines/home-statement-purpose-children-guide-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    const rawStatements = (store.statementRecords ?? []) as any[];
    const statement_records: StatementRecordInput[] = rawStatements.map((s: any) => ({
      id: s.id ?? "",
      title: s.title ?? "",
      version: s.version ?? "1.0",
      status: s.status ?? "draft",
      effective_date: (s.effective_date ?? s.effectiveDate ?? today).toString(),
      expiry_date: (s.expiry_date ?? s.expiryDate ?? today).toString(),
      last_reviewed_date: (s.last_reviewed_date ?? s.lastReviewedDate ?? today).toString(),
      next_review_date: (s.next_review_date ?? s.nextReviewDate ?? today).toString(),
      approved_by: s.approved_by ?? s.approvedBy ?? "",
      approval_date: (s.approval_date ?? s.approvalDate ?? today).toString(),
      sections_complete: s.sections_complete ?? s.sectionsComplete ?? 0,
      sections_total: s.sections_total ?? s.sectionsTotal ?? 14,
      covers_ethos: !!s.covers_ethos ?? !!s.coversEthos,
      covers_range_of_needs: !!s.covers_range_of_needs ?? !!s.coversRangeOfNeeds,
      covers_accommodation: !!s.covers_accommodation ?? !!s.coversAccommodation,
      covers_staffing: !!s.covers_staffing ?? !!s.coversStaffing,
      covers_fire_safety: !!s.covers_fire_safety ?? !!s.coversFireSafety,
      covers_behaviour_management: !!s.covers_behaviour_management ?? !!s.coversBehaviourManagement,
      covers_education: !!s.covers_education ?? !!s.coversEducation,
      covers_health: !!s.covers_health ?? !!s.coversHealth,
      covers_contact: !!s.covers_contact ?? !!s.coversContact,
      covers_complaints: !!s.covers_complaints ?? !!s.coversComplaints,
      covers_religious_cultural: !!s.covers_religious_cultural ?? !!s.coversReligiousCultural,
      covers_emergency_placement: !!s.covers_emergency_placement ?? !!s.coversEmergencyPlacement,
      covers_registered_manager: !!s.covers_registered_manager ?? !!s.coversRegisteredManager,
      covers_responsible_individual: !!s.covers_responsible_individual ?? !!s.coversResponsibleIndividual,
      ofsted_notified: !!s.ofsted_notified ?? !!s.ofstedNotified,
      notification_date: s.notification_date ?? s.notificationDate ?? null,
      distributed_to_stakeholders: !!s.distributed_to_stakeholders ?? !!s.distributedToStakeholders,
      distribution_date: s.distribution_date ?? s.distributionDate ?? null,
      distribution_method: s.distribution_method ?? s.distributionMethod ?? null,
      notes: s.notes ?? "",
      created_at: (s.created_at ?? s.createdAt ?? today).toString(),
    }));

    const rawGuides = (store.guideRecords ?? []) as any[];
    const guide_records: GuideRecordInput[] = rawGuides.map((g: any) => ({
      id: g.id ?? "",
      title: g.title ?? "",
      version: g.version ?? "1.0",
      status: g.status ?? "draft",
      effective_date: (g.effective_date ?? g.effectiveDate ?? today).toString(),
      last_reviewed_date: (g.last_reviewed_date ?? g.lastReviewedDate ?? today).toString(),
      next_review_date: (g.next_review_date ?? g.nextReviewDate ?? today).toString(),
      age_appropriate: !!g.age_appropriate ?? !!g.ageAppropriate,
      accessible_format: !!g.accessible_format ?? !!g.accessibleFormat,
      easy_read_version: !!g.easy_read_version ?? !!g.easyReadVersion,
      translated: !!g.translated,
      translation_languages: g.translation_languages ?? g.translationLanguages ?? [],
      covers_daily_routine: !!g.covers_daily_routine ?? !!g.coversDailyRoutine,
      covers_house_rules: !!g.covers_house_rules ?? !!g.coversHouseRules,
      covers_complaints_process: !!g.covers_complaints_process ?? !!g.coversComplaintsProcess,
      covers_key_contacts: !!g.covers_key_contacts ?? !!g.coversKeyContacts,
      covers_rights: !!g.covers_rights ?? !!g.coversRights,
      covers_advocacy: !!g.covers_advocacy ?? !!g.coversAdvocacy,
      covers_leaving_care: !!g.covers_leaving_care ?? !!g.coversLeavingCare,
      covers_education: !!g.covers_education ?? !!g.coversEducation,
      given_on_admission: !!g.given_on_admission ?? !!g.givenOnAdmission,
      child_feedback_collected: !!g.child_feedback_collected ?? !!g.childFeedbackCollected,
      child_feedback_positive: !!g.child_feedback_positive ?? !!g.childFeedbackPositive,
      sections_complete: g.sections_complete ?? g.sectionsComplete ?? 0,
      sections_total: g.sections_total ?? g.sectionsTotal ?? 8,
      approved_by: g.approved_by ?? g.approvedBy ?? "",
      notes: g.notes ?? "",
      created_at: (g.created_at ?? g.createdAt ?? today).toString(),
    }));

    const rawReviewCycles = (store.reviewCycleRecords ?? []) as any[];
    const review_cycle_records: ReviewCycleRecordInput[] = rawReviewCycles.map((r: any) => ({
      id: r.id ?? "",
      document_type: r.document_type ?? r.documentType ?? "statement_of_purpose",
      document_id: r.document_id ?? r.documentId ?? "",
      review_date: (r.review_date ?? r.reviewDate ?? today).toString(),
      reviewer_name: r.reviewer_name ?? r.reviewerName ?? "",
      reviewer_role: r.reviewer_role ?? r.reviewerRole ?? "",
      outcome: r.outcome ?? "approved",
      sections_reviewed: r.sections_reviewed ?? r.sectionsReviewed ?? 0,
      sections_total: r.sections_total ?? r.sectionsTotal ?? 0,
      changes_identified: r.changes_identified ?? r.changesIdentified ?? 0,
      changes_implemented: r.changes_implemented ?? r.changesImplemented ?? 0,
      completed_on_time: !!r.completed_on_time ?? !!r.completedOnTime,
      days_overdue: r.days_overdue ?? r.daysOverdue ?? 0,
      next_review_date: (r.next_review_date ?? r.nextReviewDate ?? today).toString(),
      young_people_consulted: !!r.young_people_consulted ?? !!r.youngPeopleConsulted,
      staff_consulted: !!r.staff_consulted ?? !!r.staffConsulted,
      placing_authority_consulted: !!r.placing_authority_consulted ?? !!r.placingAuthorityConsulted,
      notes: r.notes ?? "",
      created_at: (r.created_at ?? r.createdAt ?? today).toString(),
    }));

    const rawInvolvement = (store.involvementRecords ?? []) as any[];
    const involvement_records: InvolvementRecordInput[] = rawInvolvement.map((i: any) => ({
      id: i.id ?? "",
      child_id: i.child_id ?? i.childId ?? "",
      child_name: i.child_name ?? i.childName ?? "",
      document_type: i.document_type ?? i.documentType ?? "children_guide",
      involvement_type: i.involvement_type ?? i.involvementType ?? "consultation",
      date: (i.date ?? today).toString(),
      views_sought: !!i.views_sought ?? !!i.viewsSought,
      views_recorded: !!i.views_recorded ?? !!i.viewsRecorded,
      views_actioned: !!i.views_actioned ?? !!i.viewsActioned,
      feedback_positive: !!i.feedback_positive ?? !!i.feedbackPositive,
      changes_made_from_feedback: !!i.changes_made_from_feedback ?? !!i.changesMadeFromFeedback,
      change_description: i.change_description ?? i.changeDescription ?? "",
      supported_to_participate: !!i.supported_to_participate ?? !!i.supportedToParticipate,
      accessible_format_used: !!i.accessible_format_used ?? !!i.accessibleFormatUsed,
      duration_minutes: i.duration_minutes ?? i.durationMinutes ?? 0,
      facilitator: i.facilitator ?? "",
      notes: i.notes ?? "",
      created_at: (i.created_at ?? i.createdAt ?? today).toString(),
    }));

    const rawSubmissions = (store.submissionRecords ?? []) as any[];
    const submission_records: SubmissionRecordInput[] = rawSubmissions.map((s: any) => ({
      id: s.id ?? "",
      document_type: s.document_type ?? s.documentType ?? "statement_of_purpose",
      document_id: s.document_id ?? s.documentId ?? "",
      submission_date: (s.submission_date ?? s.submissionDate ?? today).toString(),
      submission_type: s.submission_type ?? s.submissionType ?? "annual_update",
      submitted_to: s.submitted_to ?? s.submittedTo ?? "ofsted",
      submitted_by: s.submitted_by ?? s.submittedBy ?? "",
      deadline_date: (s.deadline_date ?? s.deadlineDate ?? today).toString(),
      submitted_on_time: !!s.submitted_on_time ?? !!s.submittedOnTime,
      days_before_deadline: s.days_before_deadline ?? s.daysBeforeDeadline ?? 0,
      acknowledged: !!s.acknowledged,
      acknowledgement_date: s.acknowledgement_date ?? s.acknowledgementDate ?? null,
      feedback_received: !!s.feedback_received ?? !!s.feedbackReceived,
      feedback_positive: !!s.feedback_positive ?? !!s.feedbackPositive,
      amendments_required: !!s.amendments_required ?? !!s.amendmentsRequired,
      amendments_completed: !!s.amendments_completed ?? !!s.amendmentsCompleted,
      amendments_completion_date: s.amendments_completion_date ?? s.amendmentsCompletionDate ?? null,
      notes: s.notes ?? "",
      created_at: (s.created_at ?? s.createdAt ?? today).toString(),
    }));

    const result = computeStatementPurposeChildrenGuide({
      today,
      total_children,
      statement_records,
      guide_records,
      review_cycle_records,
      involvement_records,
      submission_records,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
