// ══════════════════════════════════════════════════════════════════════════════
// API — HOME COMMUNITY INTEGRATION & VOLUNTEERING INTELLIGENCE
// GET /api/v1/home-community-integration-volunteering-intelligence
// Maps in-memory store -> engine input -> JSON response.
// CHR 2015 Reg 5 (Engaging parents and others), Reg 11 (Positive relationships).
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeCommunityIntegrationVolunteering,
  type CommunityActivityRecordInput,
  type VolunteeringRecordInput,
  type SocialInclusionRecordInput,
  type NeighbourhoodRecordInput,
  type LocalServiceRecordInput,
} from "@/lib/engines/home-community-integration-volunteering-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    // ── Community Activity Records ───────────────────────────────────────
    const rawCommunityActivities = ((store as any).communityActivityRecords ?? []) as any[];
    const community_activity_records: CommunityActivityRecordInput[] = rawCommunityActivities.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      date: (r.date ?? today).toString().slice(0, 10),
      activity_name: r.activity_name ?? "",
      activity_type: r.activity_type ?? "other",
      venue: r.venue ?? "",
      duration_minutes: r.duration_minutes ?? 0,
      attended: r.attended ?? false,
      child_enjoyed: r.child_enjoyed ?? false,
      child_feedback: r.child_feedback ?? "",
      builds_friendships: r.builds_friendships ?? false,
      ongoing_regular: r.ongoing_regular ?? false,
      staff_supported: r.staff_supported ?? false,
      risk_assessment_completed: r.risk_assessment_completed ?? false,
      consent_obtained: r.consent_obtained ?? false,
      outcomes_documented: r.outcomes_documented ?? false,
      created_at: (r.created_at ?? today).toString(),
    }));

    // ── Volunteering Records ─────────────────────────────────────────────
    const rawVolunteering = ((store as any).volunteeringRecords ?? []) as any[];
    const volunteering_records: VolunteeringRecordInput[] = rawVolunteering.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      date: (r.date ?? today).toString().slice(0, 10),
      organisation: r.organisation ?? "",
      role_description: r.role_description ?? "",
      volunteering_type: r.volunteering_type ?? "other",
      hours: r.hours ?? 0,
      child_initiated: r.child_initiated ?? false,
      child_enjoyed: r.child_enjoyed ?? false,
      child_feedback: r.child_feedback ?? "",
      skills_developed: r.skills_developed ?? [],
      ongoing_commitment: r.ongoing_commitment ?? false,
      safeguarding_check_completed: r.safeguarding_check_completed ?? false,
      risk_assessment_completed: r.risk_assessment_completed ?? false,
      staff_supported: r.staff_supported ?? false,
      recognition_received: r.recognition_received ?? false,
      created_at: (r.created_at ?? today).toString(),
    }));

    // ── Social Inclusion Records ─────────────────────────────────────────
    const rawSocialInclusion = ((store as any).socialInclusionRecords ?? []) as any[];
    const social_inclusion_records: SocialInclusionRecordInput[] = rawSocialInclusion.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      date: (r.date ?? today).toString().slice(0, 10),
      programme_name: r.programme_name ?? "",
      programme_type: r.programme_type ?? "other",
      provider: r.provider ?? "",
      child_engaged: r.child_engaged ?? false,
      child_feedback: r.child_feedback ?? "",
      outcomes_achieved: r.outcomes_achieved ?? [],
      barriers_identified: r.barriers_identified ?? [],
      barriers_addressed: r.barriers_addressed ?? false,
      review_date: (r.review_date ?? "").toString().slice(0, 10),
      reviewed: r.reviewed ?? false,
      professional_involved: r.professional_involved ?? false,
      created_at: (r.created_at ?? today).toString(),
    }));

    // ── Neighbourhood Records ────────────────────────────────────────────
    const rawNeighbourhood = ((store as any).neighbourhoodRecords ?? []) as any[];
    const neighbourhood_records: NeighbourhoodRecordInput[] = rawNeighbourhood.map((r: any) => ({
      id: r.id ?? "",
      date: (r.date ?? today).toString().slice(0, 10),
      interaction_type: r.interaction_type ?? "other",
      description: r.description ?? "",
      positive_outcome: r.positive_outcome ?? false,
      complaint: r.complaint ?? false,
      complaint_resolved: r.complaint_resolved ?? false,
      follow_up_needed: r.follow_up_needed ?? false,
      follow_up_completed: r.follow_up_completed ?? false,
      children_involved: r.children_involved ?? [],
      community_perception_improved: r.community_perception_improved ?? false,
      staff_member: r.staff_member ?? "",
      created_at: (r.created_at ?? today).toString(),
    }));

    // ── Local Service Records ────────────────────────────────────────────
    const rawLocalService = ((store as any).localServiceRecords ?? []) as any[];
    const local_service_records: LocalServiceRecordInput[] = rawLocalService.map((r: any) => ({
      id: r.id ?? "",
      date: (r.date ?? today).toString().slice(0, 10),
      service_name: r.service_name ?? "",
      service_type: r.service_type ?? "other",
      children_accessing: r.children_accessing ?? [],
      engagement_quality: r.engagement_quality ?? "adequate",
      service_responsive: r.service_responsive ?? false,
      relationship_established: r.relationship_established ?? false,
      regular_contact: r.regular_contact ?? false,
      referral_made: r.referral_made ?? false,
      referral_outcome: r.referral_outcome ?? "",
      child_satisfaction: r.child_satisfaction ?? false,
      notes: r.notes ?? "",
      created_at: (r.created_at ?? today).toString(),
    }));

    const result = computeCommunityIntegrationVolunteering({
      today,
      total_children,
      community_activity_records,
      volunteering_records,
      social_inclusion_records,
      neighbourhood_records,
      local_service_records,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
