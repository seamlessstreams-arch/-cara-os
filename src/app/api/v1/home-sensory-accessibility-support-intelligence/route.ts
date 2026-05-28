// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME SENSORY & ACCESSIBILITY SUPPORT INTELLIGENCE API ROUTE
// GET /api/v1/home-sensory-accessibility-support-intelligence
// Cross-domain composite: sensoryProfileRecords + accessibilityAdaptationRecords +
// sensoryRoomRecords + sensoryEquipmentRecords + sensoryInterventionRecords
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeSensoryAccessibilitySupport,
  type SensoryProfileInput,
  type AccessibilityAdaptationInput,
  type SensoryRoomInput,
  type SensoryEquipmentInput,
  type SensoryInterventionInput,
} from "@/lib/engines/home-sensory-accessibility-support-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    const rawProfiles = (store.sensoryProfileRecords ?? []) as any[];
    const sensory_profile_records: SensoryProfileInput[] = rawProfiles.map((p: any) => ({
      id: p.id ?? "",
      child_id: p.child_id ?? "",
      assessment_date: (p.assessment_date ?? today).toString(),
      assessor_name: p.assessor_name ?? "",
      profile_type: p.profile_type ?? "full",
      sensory_needs_identified: p.sensory_needs_identified ?? 0,
      adaptations_recommended: p.adaptations_recommended ?? 0,
      adaptations_implemented: p.adaptations_implemented ?? 0,
      review_date: p.review_date ?? null,
      review_overdue: !!p.review_overdue,
      child_involved_in_assessment: !!p.child_involved_in_assessment,
      parent_carer_consulted: !!p.parent_carer_consulted,
      professional_input: !!p.professional_input,
      created_at: (p.created_at ?? today).toString(),
    }));

    const rawAdaptations = (store.accessibilityAdaptationRecords ?? []) as any[];
    const accessibility_adaptation_records: AccessibilityAdaptationInput[] = rawAdaptations.map((a: any) => ({
      id: a.id ?? "",
      child_id: a.child_id ?? "",
      adaptation_type: a.adaptation_type ?? "environmental",
      description: a.description ?? "",
      date_requested: (a.date_requested ?? today).toString(),
      date_implemented: a.date_implemented ?? null,
      implemented: !!a.implemented,
      effectiveness_rating: a.effectiveness_rating ?? 3,
      child_feedback_positive: !!a.child_feedback_positive,
      review_date: a.review_date ?? null,
      review_overdue: !!a.review_overdue,
      cost_approved: a.cost_approved !== false,
      created_at: (a.created_at ?? today).toString(),
    }));

    const rawRooms = (store.sensoryRoomRecords ?? []) as any[];
    const sensory_room_records: SensoryRoomInput[] = rawRooms.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      session_date: (r.session_date ?? today).toString(),
      duration_minutes: r.duration_minutes ?? 0,
      purpose: r.purpose ?? "scheduled",
      staff_present: !!r.staff_present,
      child_engagement_rating: r.child_engagement_rating ?? 3,
      outcome_rating: r.outcome_rating ?? 3,
      child_requested: !!r.child_requested,
      goals_met: !!r.goals_met,
      notes_recorded: !!r.notes_recorded,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawEquipment = (store.sensoryEquipmentRecords ?? []) as any[];
    const sensory_equipment_records: SensoryEquipmentInput[] = rawEquipment.map((e: any) => ({
      id: e.id ?? "",
      equipment_name: e.equipment_name ?? "",
      equipment_type: e.equipment_type ?? "other",
      date_acquired: (e.date_acquired ?? today).toString(),
      last_maintenance_date: e.last_maintenance_date ?? null,
      maintenance_due_date: e.maintenance_due_date ?? null,
      maintenance_overdue: !!e.maintenance_overdue,
      condition: e.condition ?? "good",
      in_use: e.in_use !== false,
      safety_checked: !!e.safety_checked,
      assigned_child_id: e.assigned_child_id ?? null,
      created_at: (e.created_at ?? today).toString(),
    }));

    const rawInterventions = (store.sensoryInterventionRecords ?? []) as any[];
    const sensory_intervention_records: SensoryInterventionInput[] = rawInterventions.map((i: any) => ({
      id: i.id ?? "",
      child_id: i.child_id ?? "",
      intervention_type: i.intervention_type ?? "sensory_diet",
      start_date: (i.start_date ?? today).toString(),
      end_date: i.end_date ?? null,
      active: i.active !== false,
      sessions_planned: i.sessions_planned ?? 0,
      sessions_completed: i.sessions_completed ?? 0,
      baseline_score: i.baseline_score ?? 1,
      current_score: i.current_score ?? 1,
      target_score: i.target_score ?? 10,
      child_reported_improvement: !!i.child_reported_improvement,
      staff_reported_improvement: !!i.staff_reported_improvement,
      professional_involved: !!i.professional_involved,
      review_date: i.review_date ?? null,
      review_overdue: !!i.review_overdue,
      created_at: (i.created_at ?? today).toString(),
    }));

    const result = computeSensoryAccessibilitySupport({
      today,
      total_children,
      sensory_profile_records,
      accessibility_adaptation_records,
      sensory_room_records,
      sensory_equipment_records,
      sensory_intervention_records,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
