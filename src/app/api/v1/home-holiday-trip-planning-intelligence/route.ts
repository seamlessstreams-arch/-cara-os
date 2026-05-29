export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeHolidayTripPlanning,
  type HolidayPlanRecordInput,
  type TripRiskAssessmentRecordInput,
  type ConsentManagementRecordInput,
  type ExperienceRecordInput,
  type ChildParticipationRecordInput,
} from "@/lib/engines/home-holiday-trip-planning-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    const rawHolidayPlans = (store.holidayPlanRecords ?? []) as any[];
    const holiday_plan_records: HolidayPlanRecordInput[] = rawHolidayPlans.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      holiday_name: r.holiday_name ?? "",
      destination: r.destination ?? "",
      start_date: (r.start_date ?? today).toString(),
      end_date: (r.end_date ?? today).toString(),
      planning_completed: r.planning_completed ?? false,
      itinerary_documented: r.itinerary_documented ?? false,
      budget_approved: r.budget_approved ?? false,
      staffing_confirmed: r.staffing_confirmed ?? false,
      transport_arranged: r.transport_arranged ?? false,
      accommodation_confirmed: r.accommodation_confirmed ?? false,
      activities_planned: r.activities_planned ?? false,
      dietary_needs_addressed: r.dietary_needs_addressed ?? false,
      medical_needs_addressed: r.medical_needs_addressed ?? false,
      emergency_plan_in_place: r.emergency_plan_in_place ?? false,
      child_briefed: r.child_briefed ?? false,
      social_worker_notified: r.social_worker_notified ?? false,
      status: r.status ?? "planned",
      holiday_type: r.holiday_type ?? "day_trip",
      staff_member: r.staff_member ?? "",
      notes: r.notes ?? null,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawRiskAssessments = (store.tripRiskAssessmentRecords ?? []) as any[];
    const trip_risk_assessment_records: TripRiskAssessmentRecordInput[] = rawRiskAssessments.map((r: any) => ({
      id: r.id ?? "",
      holiday_plan_id: r.holiday_plan_id ?? "",
      child_id: r.child_id ?? "",
      assessment_date: (r.assessment_date ?? today).toString(),
      risk_type: r.risk_type ?? "activity",
      risk_identified: r.risk_identified ?? "",
      likelihood: r.likelihood ?? "low",
      impact: r.impact ?? "low",
      mitigation_measures: r.mitigation_measures ?? "",
      mitigation_in_place: r.mitigation_in_place ?? false,
      assessor: r.assessor ?? "",
      reviewed: r.reviewed ?? false,
      review_date: r.review_date ?? null,
      approved: r.approved ?? false,
      approved_by: r.approved_by ?? null,
      dynamic_risk_assessment_planned: r.dynamic_risk_assessment_planned ?? false,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawConsent = (store.consentManagementRecords ?? []) as any[];
    const consent_management_records: ConsentManagementRecordInput[] = rawConsent.map((r: any) => ({
      id: r.id ?? "",
      holiday_plan_id: r.holiday_plan_id ?? "",
      child_id: r.child_id ?? "",
      consent_type: r.consent_type ?? "parent_guardian",
      consent_requested_date: (r.consent_requested_date ?? today).toString(),
      consent_received: r.consent_received ?? false,
      consent_received_date: r.consent_received_date ?? null,
      consent_method: r.consent_method ?? "written",
      consent_documented: r.consent_documented ?? false,
      chased_count: r.chased_count ?? 0,
      refused: r.refused ?? false,
      refusal_reason: r.refusal_reason ?? null,
      expiry_date: r.expiry_date ?? null,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawExperiences = (store.experienceRecords ?? []) as any[];
    const experience_records: ExperienceRecordInput[] = rawExperiences.map((r: any) => ({
      id: r.id ?? "",
      holiday_plan_id: r.holiday_plan_id ?? "",
      child_id: r.child_id ?? "",
      experience_date: (r.experience_date ?? today).toString(),
      activity_description: r.activity_description ?? "",
      experience_type: r.experience_type ?? "other",
      child_enjoyment_rating: r.child_enjoyment_rating ?? 3,
      child_feedback: r.child_feedback ?? null,
      child_feedback_positive: r.child_feedback_positive ?? false,
      memorable_moment_captured: r.memorable_moment_captured ?? false,
      photos_taken: r.photos_taken ?? false,
      new_skill_learned: r.new_skill_learned ?? false,
      social_interaction_positive: r.social_interaction_positive ?? false,
      staff_observation: r.staff_observation ?? null,
      staff_member: r.staff_member ?? "",
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawParticipation = (store.childParticipationRecords ?? []) as any[];
    const child_participation_records: ChildParticipationRecordInput[] = rawParticipation.map((r: any) => ({
      id: r.id ?? "",
      holiday_plan_id: r.holiday_plan_id ?? "",
      child_id: r.child_id ?? "",
      participation_date: (r.participation_date ?? today).toString(),
      participation_type: r.participation_type ?? "activity_selection",
      child_involved: r.child_involved ?? false,
      child_views_recorded: r.child_views_recorded ?? false,
      child_views_acted_upon: r.child_views_acted_upon ?? false,
      child_enthusiasm_rating: r.child_enthusiasm_rating ?? 3,
      barriers_to_participation: r.barriers_to_participation ?? null,
      barriers_addressed: r.barriers_addressed ?? false,
      staff_member: r.staff_member ?? "",
      notes: r.notes ?? null,
      created_at: (r.created_at ?? today).toString(),
    }));

    const result = computeHolidayTripPlanning({
      today,
      total_children,
      holiday_plan_records,
      trip_risk_assessment_records,
      consent_management_records,
      experience_records,
      child_participation_records,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
