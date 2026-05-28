// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME PARENTAL CONTACT & FAMILY ENGAGEMENT INTELLIGENCE API ROUTE
// GET /api/v1/home-parental-contact-family-engagement-intelligence
// Cross-domain composite: contactScheduleRecords + familyVisitRecords +
// parentalEngagementRecords + supervisedContactRecords + familySupportRecords
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeParentalContactFamilyEngagement,
  type ContactScheduleRecordInput,
  type FamilyVisitRecordInput,
  type ParentalEngagementRecordInput,
  type SupervisedContactRecordInput,
  type FamilySupportRecordInput,
} from "@/lib/engines/home-parental-contact-family-engagement-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    const rawContactSchedule = (store.contactScheduleRecords ?? []) as any[];
    const contact_schedule_records: ContactScheduleRecordInput[] = rawContactSchedule.map((c: any) => ({
      id: c.id ?? "",
      child_id: c.child_id ?? "",
      parent_id: c.parent_id ?? "",
      contact_type: c.contact_type ?? "face_to_face",
      scheduled_date: (c.scheduled_date ?? today).toString(),
      scheduled_time: c.scheduled_time ?? null,
      occurred: !!c.occurred,
      cancelled: !!c.cancelled,
      cancelled_by: c.cancelled_by ?? null,
      cancellation_reason: c.cancellation_reason ?? null,
      rescheduled: !!c.rescheduled,
      rescheduled_date: c.rescheduled_date ?? null,
      duration_minutes: c.duration_minutes ?? null,
      quality_rating: c.quality_rating ?? null,
      child_voice_captured: !!c.child_voice_captured,
      child_wanted_contact: c.child_wanted_contact !== false,
      notes_recorded: !!c.notes_recorded,
      social_worker_informed: !!c.social_worker_informed,
      created_at: (c.created_at ?? today).toString(),
    }));

    const rawFamilyVisit = (store.familyVisitRecords ?? []) as any[];
    const family_visit_records: FamilyVisitRecordInput[] = rawFamilyVisit.map((v: any) => ({
      id: v.id ?? "",
      child_id: v.child_id ?? "",
      visit_type: v.visit_type ?? "home_visit",
      visit_date: (v.visit_date ?? today).toString(),
      planned: v.planned !== false,
      occurred: !!v.occurred,
      duration_hours: v.duration_hours ?? null,
      quality_rating: v.quality_rating ?? null,
      risk_assessment_completed: !!v.risk_assessment_completed,
      child_feedback_positive: v.child_feedback_positive ?? null,
      child_voice_captured: !!v.child_voice_captured,
      safeguarding_concerns_raised: !!v.safeguarding_concerns_raised,
      safeguarding_actions_taken: !!v.safeguarding_actions_taken,
      report_completed: !!v.report_completed,
      approved_by: v.approved_by ?? null,
      created_at: (v.created_at ?? today).toString(),
    }));

    const rawParentalEngagement = (store.parentalEngagementRecords ?? []) as any[];
    const parental_engagement_records: ParentalEngagementRecordInput[] = rawParentalEngagement.map((e: any) => ({
      id: e.id ?? "",
      child_id: e.child_id ?? "",
      parent_id: e.parent_id ?? "",
      engagement_type: e.engagement_type ?? "review_attendance",
      engagement_date: (e.engagement_date ?? today).toString(),
      parent_participated: !!e.parent_participated,
      parent_invited: e.parent_invited !== false,
      invitation_method: e.invitation_method ?? null,
      parent_views_recorded: !!e.parent_views_recorded,
      parent_views_incorporated: !!e.parent_views_incorporated,
      barriers_identified: e.barriers_identified ?? null,
      support_offered: !!e.support_offered,
      quality_rating: e.quality_rating ?? null,
      created_at: (e.created_at ?? today).toString(),
    }));

    const rawSupervisedContact = (store.supervisedContactRecords ?? []) as any[];
    const supervised_contact_records: SupervisedContactRecordInput[] = rawSupervisedContact.map((s: any) => ({
      id: s.id ?? "",
      child_id: s.child_id ?? "",
      parent_id: s.parent_id ?? "",
      session_date: (s.session_date ?? today).toString(),
      session_duration_minutes: s.session_duration_minutes ?? null,
      supervisor_present: s.supervisor_present !== false,
      supervisor_name: s.supervisor_name ?? null,
      contact_plan_followed: s.contact_plan_followed !== false,
      boundaries_maintained: s.boundaries_maintained !== false,
      child_distressed: !!s.child_distressed,
      child_positive_response: !!s.child_positive_response,
      child_voice_captured: !!s.child_voice_captured,
      incident_occurred: !!s.incident_occurred,
      incident_description: s.incident_description ?? null,
      incident_reported: !!s.incident_reported,
      quality_rating: s.quality_rating ?? null,
      recommendations_made: !!s.recommendations_made,
      follow_up_actions: s.follow_up_actions ?? null,
      report_completed: !!s.report_completed,
      created_at: (s.created_at ?? today).toString(),
    }));

    const rawFamilySupport = (store.familySupportRecords ?? []) as any[];
    const family_support_records: FamilySupportRecordInput[] = rawFamilySupport.map((f: any) => ({
      id: f.id ?? "",
      child_id: f.child_id ?? "",
      support_type: f.support_type ?? "family_therapy",
      start_date: (f.start_date ?? today).toString(),
      end_date: f.end_date ?? null,
      active: f.active !== false,
      sessions_planned: f.sessions_planned ?? 0,
      sessions_attended: f.sessions_attended ?? 0,
      provider_name: f.provider_name ?? null,
      quality_rating: f.quality_rating ?? null,
      child_voice_captured: !!f.child_voice_captured,
      child_engagement_positive: !!f.child_engagement_positive,
      parent_engagement_positive: !!f.parent_engagement_positive,
      outcomes_documented: !!f.outcomes_documented,
      progress_rating: f.progress_rating ?? null,
      created_at: (f.created_at ?? today).toString(),
    }));

    const result = computeParentalContactFamilyEngagement({
      today,
      total_children,
      contact_schedule_records,
      family_visit_records,
      parental_engagement_records,
      supervised_contact_records,
      family_support_records,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
