// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME MULTI-AGENCY COLLABORATION INTELLIGENCE API ROUTE
// GET /api/v1/home-multi-agency-collaboration-intelligence
// Cross-domain composite: lacReviewRecords + socialWorkerVisitRecords +
// therapeuticServiceRecords + educationLiaisonRecords + informationSharingRecords
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeMultiAgencyCollaboration,
  type LacReviewRecordInput,
  type SocialWorkerVisitRecordInput,
  type TherapeuticServiceRecordInput,
  type EducationLiaisonRecordInput,
  type InformationSharingRecordInput,
} from "@/lib/engines/home-multi-agency-collaboration-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    const rawLacReviews = ((store as any).lacReviewRecords ?? []) as any[];
    const lac_review_records: LacReviewRecordInput[] = rawLacReviews.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      review_date: (r.review_date ?? today).toString(),
      review_type: r.review_type ?? "subsequent",
      on_time: !!r.on_time,
      attended_by_child: !!r.attended_by_child,
      attended_by_social_worker: !!r.attended_by_social_worker,
      attended_by_carer: !!r.attended_by_carer,
      attended_by_iro: !!r.attended_by_iro,
      attended_by_education: !!r.attended_by_education,
      attended_by_health: !!r.attended_by_health,
      child_views_recorded: !!r.child_views_recorded,
      actions_set: r.actions_set ?? 0,
      actions_completed: r.actions_completed ?? 0,
      minutes_circulated_within_target: !!r.minutes_circulated_within_target,
      next_review_date: r.next_review_date ?? null,
      outcome_quality: r.outcome_quality ?? "adequate",
      notes: r.notes ?? "",
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawSWVisits = ((store as any).socialWorkerVisitRecords ?? []) as any[];
    const social_worker_visit_records: SocialWorkerVisitRecordInput[] = rawSWVisits.map((v: any) => ({
      id: v.id ?? "",
      child_id: v.child_id ?? "",
      visit_date: (v.visit_date ?? today).toString(),
      visit_type: v.visit_type ?? "statutory",
      within_statutory_timescale: !!v.within_statutory_timescale,
      child_seen_alone: !!v.child_seen_alone,
      child_views_sought: !!v.child_views_sought,
      visit_recorded_promptly: !!v.visit_recorded_promptly,
      social_worker_name: v.social_worker_name ?? "",
      social_worker_consistent: !!v.social_worker_consistent,
      placement_plan_reviewed: !!v.placement_plan_reviewed,
      actions_arising: v.actions_arising ?? 0,
      actions_followed_up: !!v.actions_followed_up,
      quality_rating: v.quality_rating ?? "adequate",
      notes: v.notes ?? "",
      created_at: (v.created_at ?? today).toString(),
    }));

    const rawTherapeutic = ((store as any).therapeuticServiceRecords ?? []) as any[];
    const therapeutic_service_records: TherapeuticServiceRecordInput[] = rawTherapeutic.map((t: any) => ({
      id: t.id ?? "",
      child_id: t.child_id ?? "",
      service_type: t.service_type ?? "camhs",
      referral_date: (t.referral_date ?? today).toString(),
      first_appointment_date: t.first_appointment_date ?? null,
      service_active: !!t.service_active,
      sessions_offered: t.sessions_offered ?? 0,
      sessions_attended: t.sessions_attended ?? 0,
      child_engaged: !!t.child_engaged,
      progress_reported: !!t.progress_reported,
      waiting_list: !!t.waiting_list,
      waiting_days: t.waiting_days ?? 0,
      professional_name: t.professional_name ?? "",
      home_liaison_quality: t.home_liaison_quality ?? "adequate",
      information_shared_with_home: !!t.information_shared_with_home,
      notes: t.notes ?? "",
      created_at: (t.created_at ?? today).toString(),
    }));

    const rawEducationLiaison = ((store as any).educationLiaisonRecords ?? []) as any[];
    const education_liaison_records: EducationLiaisonRecordInput[] = rawEducationLiaison.map((e: any) => ({
      id: e.id ?? "",
      child_id: e.child_id ?? "",
      liaison_date: (e.liaison_date ?? today).toString(),
      liaison_type: e.liaison_type ?? "phone_call",
      school_name: e.school_name ?? "",
      attended_by_home: !!e.attended_by_home,
      attended_by_social_worker: !!e.attended_by_social_worker,
      pep_up_to_date: !!e.pep_up_to_date,
      educational_progress_discussed: !!e.educational_progress_discussed,
      actions_agreed: e.actions_agreed ?? 0,
      actions_completed: e.actions_completed ?? 0,
      pupil_premium_discussed: !!e.pupil_premium_discussed,
      designated_teacher_involved: !!e.designated_teacher_involved,
      ehcp_relevant: !!e.ehcp_relevant,
      ehcp_reviewed: !!e.ehcp_reviewed,
      quality_rating: e.quality_rating ?? "adequate",
      notes: e.notes ?? "",
      created_at: (e.created_at ?? today).toString(),
    }));

    const rawInfoSharing = ((store as any).informationSharingRecords ?? []) as any[];
    const information_sharing_records: InformationSharingRecordInput[] = rawInfoSharing.map((i: any) => ({
      id: i.id ?? "",
      date: (i.date ?? today).toString(),
      sharing_type: i.sharing_type ?? "email_update",
      agencies_involved: Array.isArray(i.agencies_involved) ? i.agencies_involved : [],
      initiated_by_home: !!i.initiated_by_home,
      timely: !!i.timely,
      information_complete: !!i.information_complete,
      consent_obtained: !!i.consent_obtained,
      gdpr_compliant: !!i.gdpr_compliant,
      outcome_recorded: !!i.outcome_recorded,
      follow_up_required: !!i.follow_up_required,
      follow_up_completed: !!i.follow_up_completed,
      child_id: i.child_id ?? null,
      is_multi_agency_meeting: !!i.is_multi_agency_meeting,
      notes: i.notes ?? "",
      created_at: (i.created_at ?? today).toString(),
    }));

    const result = computeMultiAgencyCollaboration({
      today,
      total_children,
      lac_review_records,
      social_worker_visit_records,
      therapeutic_service_records,
      education_liaison_records,
      information_sharing_records,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
