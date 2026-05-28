// ==============================================================================
// CORNERSTONE -- HOME RELIGIOUS & SPIRITUAL WELLBEING INTELLIGENCE API ROUTE
// GET /api/v1/home-religious-spiritual-wellbeing-intelligence
// Cross-domain composite: faithObservanceRecords + spiritualDevelopmentRecords +
// religiousDietaryRecords + worshipAccessRecords + celebrationParticipationRecords
// ==============================================================================

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeReligiousSpiritualWellbeing,
  type FaithObservanceRecordInput,
  type SpiritualDevelopmentRecordInput,
  type ReligiousDietaryRecordInput,
  type WorshipAccessRecordInput,
  type CelebrationParticipationRecordInput,
} from "@/lib/engines/home-religious-spiritual-wellbeing-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    const rawFaithObservance = (store.faithObservanceRecords ?? []) as any[];
    const faith_observance_records: FaithObservanceRecordInput[] = rawFaithObservance.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      faith_tradition: r.faith_tradition ?? "",
      observance_type: r.observance_type ?? "other",
      date: (r.date ?? today).toString(),
      supported: !!r.supported,
      staff_facilitated: !!r.staff_facilitated,
      child_initiated: !!r.child_initiated,
      child_satisfaction: r.child_satisfaction ?? 3,
      barriers_encountered: Array.isArray(r.barriers_encountered) ? r.barriers_encountered : [],
      notes: r.notes ?? "",
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawSpiritualDevelopment = (store.spiritualDevelopmentRecords ?? []) as any[];
    const spiritual_development_records: SpiritualDevelopmentRecordInput[] = rawSpiritualDevelopment.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      plan_in_place: !!r.plan_in_place,
      plan_reviewed: !!r.plan_reviewed,
      last_review_date: r.last_review_date ?? null,
      goals_set: r.goals_set ?? 0,
      goals_progressed: r.goals_progressed ?? 0,
      mentor_assigned: !!r.mentor_assigned,
      mentor_type: r.mentor_type ?? "none",
      sessions_planned: r.sessions_planned ?? 0,
      sessions_attended: r.sessions_attended ?? 0,
      child_voice_captured: !!r.child_voice_captured,
      outcomes_documented: !!r.outcomes_documented,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawReligiousDietary = (store.religiousDietaryRecords ?? []) as any[];
    const religious_dietary_records: ReligiousDietaryRecordInput[] = rawReligiousDietary.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      dietary_requirement: r.dietary_requirement ?? "",
      requirement_documented: !!r.requirement_documented,
      accommodation_provided: !!r.accommodation_provided,
      kitchen_staff_trained: !!r.kitchen_staff_trained,
      meals_compliant: r.meals_compliant ?? 0,
      meals_total: r.meals_total ?? 0,
      child_satisfied: !!r.child_satisfied,
      last_audit_date: r.last_audit_date ?? null,
      issues_reported: r.issues_reported ?? 0,
      issues_resolved: r.issues_resolved ?? 0,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawWorshipAccess = (store.worshipAccessRecords ?? []) as any[];
    const worship_access_records: WorshipAccessRecordInput[] = rawWorshipAccess.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      worship_type: r.worship_type ?? "other",
      date: (r.date ?? today).toString(),
      access_facilitated: !!r.access_facilitated,
      transport_provided: !!r.transport_provided,
      staff_accompanied: !!r.staff_accompanied,
      child_chose_not_to_attend: !!r.child_chose_not_to_attend,
      barriers_encountered: Array.isArray(r.barriers_encountered) ? r.barriers_encountered : [],
      frequency_met: !!r.frequency_met,
      child_satisfaction: r.child_satisfaction ?? 3,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawCelebrationParticipation = (store.celebrationParticipationRecords ?? []) as any[];
    const celebration_participation_records: CelebrationParticipationRecordInput[] = rawCelebrationParticipation.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      celebration_name: r.celebration_name ?? "",
      faith_tradition: r.faith_tradition ?? "",
      date: (r.date ?? today).toString(),
      participated: !!r.participated,
      home_acknowledged: !!r.home_acknowledged,
      resources_provided: !!r.resources_provided,
      peers_involved: !!r.peers_involved,
      child_led: !!r.child_led,
      child_satisfaction: r.child_satisfaction ?? 3,
      educational_component: !!r.educational_component,
      created_at: (r.created_at ?? today).toString(),
    }));

    const result = computeReligiousSpiritualWellbeing({
      today,
      total_children,
      faith_observance_records,
      spiritual_development_records,
      religious_dietary_records,
      worship_access_records,
      celebration_participation_records,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
