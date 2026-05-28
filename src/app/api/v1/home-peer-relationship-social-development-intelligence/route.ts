// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME PEER RELATIONSHIP & SOCIAL DEVELOPMENT INTELLIGENCE API ROUTE
// GET /api/v1/home-peer-relationship-social-development-intelligence
// Cross-domain composite: peerAssessmentRecords + socialSkillsProgrammes +
// bullyingIncidentRecords + friendshipSupportPlans + socialActivityRecords
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computePeerRelationshipSocialDevelopment,
  type PeerAssessmentInput,
  type SocialSkillsProgrammeInput,
  type BullyingIncidentInput,
  type FriendshipSupportPlanInput,
  type SocialActivityRecordInput,
} from "@/lib/engines/home-peer-relationship-social-development-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    const rawPeerAssessments = (store.peerAssessmentRecords ?? []) as any[];
    const peer_assessments: PeerAssessmentInput[] = rawPeerAssessments.map((a: any) => ({
      id: a.id ?? "",
      child_id: a.child_id ?? "",
      assessment_date: (a.assessment_date ?? today).toString(),
      assessor_role: a.assessor_role ?? "keyworker",
      relationship_quality_score: a.relationship_quality_score ?? 3,
      social_confidence_score: a.social_confidence_score ?? 3,
      conflict_resolution_score: a.conflict_resolution_score ?? 3,
      empathy_score: a.empathy_score ?? 3,
      cooperation_score: a.cooperation_score ?? 3,
      peer_acceptance_score: a.peer_acceptance_score ?? 3,
      areas_of_strength: Array.isArray(a.areas_of_strength) ? a.areas_of_strength : [],
      areas_of_concern: Array.isArray(a.areas_of_concern) ? a.areas_of_concern : [],
      recommended_interventions: Array.isArray(a.recommended_interventions) ? a.recommended_interventions : [],
      child_voice_captured: !!a.child_voice_captured,
      follow_up_date: a.follow_up_date ?? null,
      follow_up_completed: !!a.follow_up_completed,
      created_at: (a.created_at ?? today).toString(),
    }));

    const rawSocialSkillsProgrammes = (store.socialSkillsProgrammes ?? []) as any[];
    const social_skills_programmes: SocialSkillsProgrammeInput[] = rawSocialSkillsProgrammes.map((p: any) => ({
      id: p.id ?? "",
      child_id: p.child_id ?? "",
      programme_name: p.programme_name ?? "",
      programme_type: p.programme_type ?? "group",
      start_date: (p.start_date ?? today).toString(),
      end_date: p.end_date ?? null,
      active: p.active !== false,
      sessions_planned: p.sessions_planned ?? 0,
      sessions_attended: p.sessions_attended ?? 0,
      progress_rating: p.progress_rating ?? 3,
      skills_targeted: Array.isArray(p.skills_targeted) ? p.skills_targeted : [],
      measurable_improvement: !!p.measurable_improvement,
      child_engaged: !!p.child_engaged,
      facilitator_name: p.facilitator_name ?? "",
      review_date: p.review_date ?? null,
      review_completed: !!p.review_completed,
      created_at: (p.created_at ?? today).toString(),
    }));

    const rawBullyingIncidents = (store.bullyingIncidentRecords ?? []) as any[];
    const bullying_incidents: BullyingIncidentInput[] = rawBullyingIncidents.map((b: any) => ({
      id: b.id ?? "",
      child_id: b.child_id ?? "",
      incident_date: (b.incident_date ?? today).toString(),
      reported_date: (b.reported_date ?? today).toString(),
      incident_type: b.incident_type ?? "verbal",
      severity: b.severity ?? "medium",
      child_role: b.child_role ?? "victim",
      reported_by: b.reported_by ?? "",
      investigated: !!b.investigated,
      investigation_date: b.investigation_date ?? null,
      resolution_type: b.resolution_type ?? "pending",
      resolved: !!b.resolved,
      resolution_date: b.resolution_date ?? null,
      resolution_description: b.resolution_description ?? null,
      safety_plan_created: !!b.safety_plan_created,
      follow_up_completed: !!b.follow_up_completed,
      follow_up_date: b.follow_up_date ?? null,
      child_satisfied_with_outcome: !!b.child_satisfied_with_outcome,
      days_to_investigate: b.days_to_investigate ?? null,
      days_to_resolve: b.days_to_resolve ?? null,
      parent_carer_informed: !!b.parent_carer_informed,
      social_worker_informed: !!b.social_worker_informed,
      lessons_learned: b.lessons_learned ?? null,
      created_at: (b.created_at ?? today).toString(),
    }));

    const rawFriendshipPlans = (store.friendshipSupportPlans ?? []) as any[];
    const friendship_support_plans: FriendshipSupportPlanInput[] = rawFriendshipPlans.map((f: any) => ({
      id: f.id ?? "",
      child_id: f.child_id ?? "",
      plan_date: (f.plan_date ?? today).toString(),
      plan_type: f.plan_type ?? "formal",
      identified_needs: Array.isArray(f.identified_needs) ? f.identified_needs : [],
      goals_set: f.goals_set ?? 0,
      goals_achieved: f.goals_achieved ?? 0,
      activities_planned: f.activities_planned ?? 0,
      activities_completed: f.activities_completed ?? 0,
      external_friendships_supported: !!f.external_friendships_supported,
      family_contact_supported: !!f.family_contact_supported,
      peer_matching_attempted: !!f.peer_matching_attempted,
      peer_matching_successful: !!f.peer_matching_successful,
      child_voice_in_plan: !!f.child_voice_in_plan,
      review_date: f.review_date ?? null,
      review_completed: !!f.review_completed,
      active: f.active !== false,
      progress_notes: f.progress_notes ?? "",
      created_at: (f.created_at ?? today).toString(),
    }));

    const rawSocialActivities = (store.socialActivityRecords ?? []) as any[];
    const social_activity_records: SocialActivityRecordInput[] = rawSocialActivities.map((a: any) => ({
      id: a.id ?? "",
      child_id: a.child_id ?? "",
      activity_date: (a.activity_date ?? today).toString(),
      activity_type: a.activity_type ?? "social_outing",
      activity_name: a.activity_name ?? "",
      group_activity: !!a.group_activity,
      external_activity: !!a.external_activity,
      peer_interaction_quality: a.peer_interaction_quality ?? 3,
      child_enjoyed: !!a.child_enjoyed,
      child_initiated: !!a.child_initiated,
      new_connections_made: !!a.new_connections_made,
      staff_supported: !!a.staff_supported,
      duration_hours: a.duration_hours ?? 1,
      attendance_status: a.attendance_status ?? "attended",
      barriers_identified: Array.isArray(a.barriers_identified) ? a.barriers_identified : [],
      created_at: (a.created_at ?? today).toString(),
    }));

    const result = computePeerRelationshipSocialDevelopment({
      today,
      total_children,
      peer_assessments,
      social_skills_programmes,
      bullying_incidents,
      friendship_support_plans,
      social_activity_records,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
