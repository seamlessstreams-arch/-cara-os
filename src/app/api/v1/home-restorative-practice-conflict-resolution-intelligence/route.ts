// ==============================================================================
// CORNERSTONE -- HOME RESTORATIVE PRACTICE & CONFLICT RESOLUTION INTELLIGENCE API ROUTE
// GET /api/v1/home-restorative-practice-conflict-resolution-intelligence
// Cross-domain composite: restorativeConferenceRecords + conflictResolutionRecords +
// relationshipRepairRecords + mediationRecords + childVoiceRecords
// ==============================================================================

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeRestorativePracticeConflictResolution,
  type RestorativeConferenceRecordInput,
  type ConflictResolutionRecordInput,
  type RelationshipRepairRecordInput,
  type MediationRecordInput,
  type ChildVoiceRecordInput,
} from "@/lib/engines/home-restorative-practice-conflict-resolution-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    const rawRestorativeConferences = (store.restorativeConferenceRecords ?? []) as any[];
    const restorative_conference_records: RestorativeConferenceRecordInput[] = rawRestorativeConferences.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      date: (r.date ?? today).toString(),
      conference_type: r.conference_type ?? "other",
      incident_id: r.incident_id ?? "",
      incident_type: r.incident_type ?? "other",
      facilitator_id: r.facilitator_id ?? "",
      facilitator_trained: !!r.facilitator_trained,
      participants_invited: r.participants_invited ?? 0,
      participants_attended: r.participants_attended ?? 0,
      child_participated: !!r.child_participated,
      child_prepared_beforehand: !!r.child_prepared_beforehand,
      harmed_party_present: !!r.harmed_party_present,
      harmed_party_views_captured: !!r.harmed_party_views_captured,
      agreement_reached: !!r.agreement_reached,
      agreement_documented: !!r.agreement_documented,
      agreement_actions: r.agreement_actions ?? 0,
      agreement_actions_completed: r.agreement_actions_completed ?? 0,
      follow_up_scheduled: !!r.follow_up_scheduled,
      follow_up_completed: !!r.follow_up_completed,
      child_satisfaction: r.child_satisfaction ?? 3,
      completed: !!r.completed,
      duration_minutes: r.duration_minutes ?? 0,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawConflictResolutions = (store.conflictResolutionRecords ?? []) as any[];
    const conflict_resolution_records: ConflictResolutionRecordInput[] = rawConflictResolutions.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      date: (r.date ?? today).toString(),
      conflict_type: r.conflict_type ?? "other",
      severity: r.severity ?? "medium",
      resolution_method: r.resolution_method ?? "other",
      resolved: !!r.resolved,
      resolution_time_hours: r.resolution_time_hours ?? 0,
      both_parties_satisfied: !!r.both_parties_satisfied,
      underlying_cause_identified: !!r.underlying_cause_identified,
      underlying_cause_addressed: !!r.underlying_cause_addressed,
      recurrence_within_30_days: !!r.recurrence_within_30_days,
      sanctions_used: !!r.sanctions_used,
      restorative_approach_used: !!r.restorative_approach_used,
      staff_id: r.staff_id ?? "",
      staff_trained_in_restorative: !!r.staff_trained_in_restorative,
      child_voice_captured: !!r.child_voice_captured,
      follow_up_completed: !!r.follow_up_completed,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawRelationshipRepairs = (store.relationshipRepairRecords ?? []) as any[];
    const relationship_repair_records: RelationshipRepairRecordInput[] = rawRelationshipRepairs.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      date: (r.date ?? today).toString(),
      relationship_type: r.relationship_type ?? "other",
      other_party_id: r.other_party_id ?? "",
      initial_damage_level: r.initial_damage_level ?? "moderate",
      repair_approach: r.repair_approach ?? "other",
      repair_initiated_by: r.repair_initiated_by ?? "staff",
      sessions_planned: r.sessions_planned ?? 0,
      sessions_completed: r.sessions_completed ?? 0,
      progress_rating: r.progress_rating ?? 3,
      child_feels_heard: !!r.child_feels_heard,
      other_party_feels_heard: !!r.other_party_feels_heard,
      ongoing_support_in_place: !!r.ongoing_support_in_place,
      relationship_restored: !!r.relationship_restored,
      child_satisfaction: r.child_satisfaction ?? 3,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawMediations = (store.mediationRecords ?? []) as any[];
    const mediation_records: MediationRecordInput[] = rawMediations.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      date: (r.date ?? today).toString(),
      mediation_type: r.mediation_type ?? "other",
      mediator_id: r.mediator_id ?? "",
      mediator_trained: !!r.mediator_trained,
      mediator_type: r.mediator_type ?? "other",
      parties_involved: r.parties_involved ?? 0,
      all_parties_consented: !!r.all_parties_consented,
      child_prepared: !!r.child_prepared,
      ground_rules_established: !!r.ground_rules_established,
      each_party_heard: !!r.each_party_heard,
      agreement_reached: !!r.agreement_reached,
      agreement_documented: !!r.agreement_documented,
      agreement_fair_to_all: !!r.agreement_fair_to_all,
      follow_up_date: r.follow_up_date ?? null,
      follow_up_completed: !!r.follow_up_completed,
      child_satisfaction: r.child_satisfaction ?? 3,
      mediation_quality_score: r.mediation_quality_score ?? 3,
      duration_minutes: r.duration_minutes ?? 0,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawChildVoice = (store.childVoiceRecords ?? []) as any[];
    const child_voice_records: ChildVoiceRecordInput[] = rawChildVoice.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      date: (r.date ?? today).toString(),
      context: r.context ?? "other",
      voice_captured: !!r.voice_captured,
      capture_method: r.capture_method ?? "other",
      child_felt_listened_to: !!r.child_felt_listened_to,
      child_views_influenced_outcome: !!r.child_views_influenced_outcome,
      child_understood_process: !!r.child_understood_process,
      child_felt_safe_to_speak: !!r.child_felt_safe_to_speak,
      follow_up_feedback_given: !!r.follow_up_feedback_given,
      child_satisfaction: r.child_satisfaction ?? 3,
      barriers_to_participation: Array.isArray(r.barriers_to_participation) ? r.barriers_to_participation : [],
      additional_support_needed: !!r.additional_support_needed,
      additional_support_provided: !!r.additional_support_provided,
      created_at: (r.created_at ?? today).toString(),
    }));

    const result = computeRestorativePracticeConflictResolution({
      today,
      total_children,
      restorative_conference_records,
      conflict_resolution_records,
      relationship_repair_records,
      mediation_records,
      child_voice_records,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
