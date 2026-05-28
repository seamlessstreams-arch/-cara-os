// ==============================================================================
// CORNERSTONE -- HOME HOMEWORK & ACADEMIC SUPPORT INTELLIGENCE API ROUTE
// GET /api/v1/home-homework-academic-support-intelligence
// Cross-domain composite: homeworkSupportRecords + studyEnvironmentRecords +
// tutoringRecords + educationalResourceRecords + schoolLiaisonRecords
// ==============================================================================

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeHomeworkAcademicSupport,
  type HomeworkSupportRecordInput,
  type StudyEnvironmentRecordInput,
  type TutoringRecordInput,
  type EducationalResourceRecordInput,
  type SchoolLiaisonRecordInput,
} from "@/lib/engines/home-homework-academic-support-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    const rawHomeworkSupport = ((store as any).homeworkSupportRecords || []) as any[];
    const homework_support_records: HomeworkSupportRecordInput[] = rawHomeworkSupport.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      date: (r.date ?? today).toString(),
      subject: r.subject ?? "",
      homework_set: !!r.homework_set,
      homework_completed: !!r.homework_completed,
      staff_supported: !!r.staff_supported,
      support_quality: r.support_quality ?? "adequate",
      time_allocated_minutes: r.time_allocated_minutes ?? 0,
      quiet_space_available: !!r.quiet_space_available,
      child_engaged: !!r.child_engaged,
      child_asked_for_help: !!r.child_asked_for_help,
      barriers_encountered: Array.isArray(r.barriers_encountered) ? r.barriers_encountered : [],
      outcome: r.outcome ?? "not_applicable",
      notes: r.notes ?? "",
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawStudyEnvironment = ((store as any).studyEnvironmentRecords || []) as any[];
    const study_environment_records: StudyEnvironmentRecordInput[] = rawStudyEnvironment.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      date: (r.date ?? today).toString(),
      assessment_type: r.assessment_type ?? "staff_observation",
      quiet_space_available: !!r.quiet_space_available,
      desk_provided: !!r.desk_provided,
      lighting_adequate: !!r.lighting_adequate,
      free_from_distractions: !!r.free_from_distractions,
      study_materials_available: !!r.study_materials_available,
      internet_access_available: !!r.internet_access_available,
      time_protected: !!r.time_protected,
      child_satisfaction: r.child_satisfaction ?? 3,
      improvements_needed: Array.isArray(r.improvements_needed) ? r.improvements_needed : [],
      overall_quality: r.overall_quality ?? "adequate",
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawTutoring = ((store as any).tutoringRecords || []) as any[];
    const tutoring_records: TutoringRecordInput[] = rawTutoring.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      subject: r.subject ?? "",
      tutor_type: r.tutor_type ?? "staff",
      date: (r.date ?? today).toString(),
      session_planned: !!r.session_planned,
      session_attended: !!r.session_attended,
      session_duration_minutes: r.session_duration_minutes ?? 0,
      child_engaged: !!r.child_engaged,
      progress_noted: !!r.progress_noted,
      child_satisfaction: r.child_satisfaction ?? 3,
      tutor_feedback_provided: !!r.tutor_feedback_provided,
      linked_to_school_curriculum: !!r.linked_to_school_curriculum,
      outcome_documented: !!r.outcome_documented,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawResources = ((store as any).educationalResourceRecords || []) as any[];
    const educational_resource_records: EducationalResourceRecordInput[] = rawResources.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      resource_type: r.resource_type ?? "other",
      date: (r.date ?? today).toString(),
      requested: !!r.requested,
      provided: !!r.provided,
      age_appropriate: !!r.age_appropriate,
      curriculum_aligned: !!r.curriculum_aligned,
      condition: r.condition ?? "good",
      child_using_resource: !!r.child_using_resource,
      budget_allocated: !!r.budget_allocated,
      notes: r.notes ?? "",
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawSchoolLiaison = ((store as any).schoolLiaisonRecords || []) as any[];
    const school_liaison_records: SchoolLiaisonRecordInput[] = rawSchoolLiaison.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      date: (r.date ?? today).toString(),
      liaison_type: r.liaison_type ?? "other",
      staff_attended: !!r.staff_attended,
      school_engaged: !!r.school_engaged,
      actions_agreed: r.actions_agreed ?? 0,
      actions_completed: r.actions_completed ?? 0,
      academic_progress_discussed: !!r.academic_progress_discussed,
      attendance_discussed: !!r.attendance_discussed,
      behaviour_discussed: !!r.behaviour_discussed,
      additional_support_identified: !!r.additional_support_identified,
      follow_up_date: r.follow_up_date ?? null,
      follow_up_completed: !!r.follow_up_completed,
      child_voice_included: !!r.child_voice_included,
      pep_up_to_date: !!r.pep_up_to_date,
      notes: r.notes ?? "",
      created_at: (r.created_at ?? today).toString(),
    }));

    const result = computeHomeworkAcademicSupport({
      today,
      total_children,
      homework_support_records,
      study_environment_records,
      tutoring_records,
      educational_resource_records,
      school_liaison_records,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
