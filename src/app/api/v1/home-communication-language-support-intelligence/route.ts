export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeCommunicationLanguageSupport,
  type CommunicationAssessmentRecordInput,
  type SpeechTherapyRecordInput,
  type CommunicationAidRecordInput,
  type InclusivePracticeRecordInput,
  type StaffCommunicationTrainingRecordInput,
} from "@/lib/engines/home-communication-language-support-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    const rawAssessments = ((store as any).communicationAssessmentRecords || []) as any[];
    const communication_assessment_records: CommunicationAssessmentRecordInput[] = rawAssessments.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      assessment_date: (r.assessment_date ?? today).toString(),
      assessor: r.assessor ?? "",
      assessment_type: r.assessment_type ?? "initial",
      speech_level_assessed: r.speech_level_assessed ?? false,
      language_comprehension_assessed: r.language_comprehension_assessed ?? false,
      expressive_language_assessed: r.expressive_language_assessed ?? false,
      non_verbal_communication_assessed: r.non_verbal_communication_assessed ?? false,
      communication_needs_identified: r.communication_needs_identified ?? false,
      needs_documented: r.needs_documented ?? false,
      support_plan_created: r.support_plan_created ?? false,
      support_plan_reviewed: r.support_plan_reviewed ?? false,
      child_involved_in_assessment: r.child_involved_in_assessment ?? false,
      child_views_recorded: r.child_views_recorded ?? false,
      outcomes_shared_with_team: r.outcomes_shared_with_team ?? false,
      progress_rating: r.progress_rating ?? 3,
      next_review_date: r.next_review_date ?? null,
      notes: r.notes ?? null,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawTherapy = ((store as any).speechTherapyRecords || []) as any[];
    const speech_therapy_records: SpeechTherapyRecordInput[] = rawTherapy.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      session_date: (r.session_date ?? today).toString(),
      therapist: r.therapist ?? "",
      therapy_type: r.therapy_type ?? "individual",
      session_attended: r.session_attended ?? false,
      session_completed: r.session_completed ?? false,
      child_engaged: r.child_engaged ?? false,
      targets_set: r.targets_set ?? false,
      targets_met: r.targets_met ?? false,
      home_practice_assigned: r.home_practice_assigned ?? false,
      home_practice_completed: r.home_practice_completed ?? false,
      staff_guidance_provided: r.staff_guidance_provided ?? false,
      progress_rating: r.progress_rating ?? 3,
      next_session_date: r.next_session_date ?? null,
      discharge_planned: r.discharge_planned ?? false,
      notes: r.notes ?? null,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawAids = ((store as any).communicationAidRecords || []) as any[];
    const communication_aid_records: CommunicationAidRecordInput[] = rawAids.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      aid_type: r.aid_type ?? "other",
      provision_date: (r.provision_date ?? today).toString(),
      aid_available: r.aid_available ?? false,
      aid_in_use: r.aid_in_use ?? false,
      aid_maintained: r.aid_maintained ?? false,
      child_trained_on_aid: r.child_trained_on_aid ?? false,
      staff_trained_on_aid: r.staff_trained_on_aid ?? false,
      effectiveness_rating: r.effectiveness_rating ?? 3,
      review_date: r.review_date ?? null,
      reviewed: r.reviewed ?? false,
      child_feedback_positive: r.child_feedback_positive ?? false,
      replacement_needed: r.replacement_needed ?? false,
      replacement_actioned: r.replacement_actioned ?? false,
      notes: r.notes ?? null,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawInclusive = ((store as any).inclusivePracticeRecords || []) as any[];
    const inclusive_practice_records: InclusivePracticeRecordInput[] = rawInclusive.map((r: any) => ({
      id: r.id ?? "",
      date: (r.date ?? today).toString(),
      practice_area: r.practice_area ?? "other",
      communication_needs_considered: r.communication_needs_considered ?? false,
      adaptations_made: r.adaptations_made ?? false,
      adaptation_type: r.adaptation_type ?? null,
      all_children_included: r.all_children_included ?? false,
      child_feedback_sought: r.child_feedback_sought ?? false,
      child_feedback_positive: r.child_feedback_positive ?? false,
      staff_member: r.staff_member ?? "",
      barriers_identified: r.barriers_identified ?? null,
      barriers_addressed: r.barriers_addressed ?? false,
      notes: r.notes ?? null,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawTraining = ((store as any).staffCommunicationTrainingRecords || []) as any[];
    const staff_communication_training_records: StaffCommunicationTrainingRecordInput[] = rawTraining.map((r: any) => ({
      id: r.id ?? "",
      staff_id: r.staff_id ?? "",
      training_date: (r.training_date ?? today).toString(),
      training_type: r.training_type ?? "general",
      training_completed: r.training_completed ?? false,
      competency_assessed: r.competency_assessed ?? false,
      competency_passed: r.competency_passed ?? false,
      refresher_due_date: r.refresher_due_date ?? null,
      refresher_completed: r.refresher_completed ?? false,
      applied_in_practice: r.applied_in_practice ?? false,
      trainer: r.trainer ?? null,
      notes: r.notes ?? null,
      created_at: (r.created_at ?? today).toString(),
    }));

    const result = computeCommunicationLanguageSupport({
      today,
      total_children,
      communication_assessment_records,
      speech_therapy_records,
      communication_aid_records,
      inclusive_practice_records,
      staff_communication_training_records,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
