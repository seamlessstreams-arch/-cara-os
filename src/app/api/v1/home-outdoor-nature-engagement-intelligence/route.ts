// ==============================================================================
// CORNERSTONE -- HOME OUTDOOR & NATURE ENGAGEMENT INTELLIGENCE API ROUTE
// GET /api/v1/home-outdoor-nature-engagement-intelligence
// Cross-domain composite: outdoorActivityRecords + natureLearningRecords +
// gardenProjectRecords + explorationRecords + outdoorSafetyRecords
// ==============================================================================

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeOutdoorNatureEngagement,
  type OutdoorActivityRecordInput,
  type NatureLearningRecordInput,
  type GardenProjectRecordInput,
  type ExplorationRecordInput,
  type OutdoorSafetyRecordInput,
} from "@/lib/engines/home-outdoor-nature-engagement-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    const rawOutdoorActivity = (store.outdoorActivityRecords ?? []) as any[];
    const outdoor_activity_records: OutdoorActivityRecordInput[] = rawOutdoorActivity.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      activity_type: r.activity_type ?? "other",
      date: (r.date ?? today).toString(),
      duration_minutes: r.duration_minutes ?? 0,
      staff_led: !!r.staff_led,
      child_initiated: !!r.child_initiated,
      location: r.location ?? "other",
      child_enjoyment: r.child_enjoyment ?? 3,
      weather_appropriate_clothing: !!r.weather_appropriate_clothing,
      risk_assessment_completed: !!r.risk_assessment_completed,
      participation_willing: !!r.participation_willing,
      skills_developed: Array.isArray(r.skills_developed) ? r.skills_developed : [],
      notes: r.notes ?? "",
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawNatureLearning = (store.natureLearningRecords ?? []) as any[];
    const nature_learning_records: NatureLearningRecordInput[] = rawNatureLearning.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      topic: r.topic ?? "",
      learning_type: r.learning_type ?? "other",
      date: (r.date ?? today).toString(),
      duration_minutes: r.duration_minutes ?? 0,
      learning_objectives_set: !!r.learning_objectives_set,
      learning_objectives_met: !!r.learning_objectives_met,
      child_engagement: r.child_engagement ?? 3,
      child_voice_captured: !!r.child_voice_captured,
      linked_to_education: !!r.linked_to_education,
      resources_provided: !!r.resources_provided,
      outcome_documented: !!r.outcome_documented,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawGardenProject = (store.gardenProjectRecords ?? []) as any[];
    const garden_project_records: GardenProjectRecordInput[] = rawGardenProject.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      project_name: r.project_name ?? "",
      project_type: r.project_type ?? "other",
      date: (r.date ?? today).toString(),
      active: !!r.active,
      child_led: !!r.child_led,
      child_participation: !!r.child_participation,
      responsibility_assigned: !!r.responsibility_assigned,
      progress_documented: !!r.progress_documented,
      therapeutic_benefit_noted: !!r.therapeutic_benefit_noted,
      harvest_used: !!r.harvest_used,
      skills_gained: Array.isArray(r.skills_gained) ? r.skills_gained : [],
      child_satisfaction: r.child_satisfaction ?? 3,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawExploration = (store.explorationRecords ?? []) as any[];
    const exploration_records: ExplorationRecordInput[] = rawExploration.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      exploration_type: r.exploration_type ?? "other",
      date: (r.date ?? today).toString(),
      duration_minutes: r.duration_minutes ?? 0,
      new_environment: !!r.new_environment,
      child_choice: !!r.child_choice,
      sensory_engagement: !!r.sensory_engagement,
      discovery_documented: !!r.discovery_documented,
      child_enjoyment: r.child_enjoyment ?? 3,
      staff_accompanied: !!r.staff_accompanied,
      educational_value: !!r.educational_value,
      repeat_requested: !!r.repeat_requested,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawOutdoorSafety = (store.outdoorSafetyRecords ?? []) as any[];
    const outdoor_safety_records: OutdoorSafetyRecordInput[] = rawOutdoorSafety.map((r: any) => ({
      id: r.id ?? "",
      date: (r.date ?? today).toString(),
      safety_type: r.safety_type ?? "other",
      completed: !!r.completed,
      compliant: !!r.compliant,
      issues_found: r.issues_found ?? 0,
      issues_resolved: r.issues_resolved ?? 0,
      staff_trained: !!r.staff_trained,
      linked_activity_id: r.linked_activity_id ?? "",
      review_date: r.review_date ?? null,
      notes: r.notes ?? "",
      created_at: (r.created_at ?? today).toString(),
    }));

    const result = computeOutdoorNatureEngagement({
      today,
      total_children,
      outdoor_activity_records,
      nature_learning_records,
      garden_project_records,
      exploration_records,
      outdoor_safety_records,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
