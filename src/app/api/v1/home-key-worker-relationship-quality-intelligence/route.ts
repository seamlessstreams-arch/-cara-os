// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME KEY WORKER RELATIONSHIP QUALITY INTELLIGENCE API ROUTE
// GET /api/v1/home-key-worker-relationship-quality-intelligence
// Cross-domain composite: keyWorkerAllocationRecords + relationshipAssessmentRecords +
// keyWorkerSessionRecords + childSatisfactionRecords + continuityRecords
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeKeyWorkerRelationshipQuality,
  type KeyWorkerAllocationInput,
  type RelationshipAssessmentInput,
  type KeyWorkerSessionInput,
  type ChildSatisfactionInput,
  type ContinuityRecordInput,
} from "@/lib/engines/home-key-worker-relationship-quality-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    const s = store as any;

    const rawAllocations = (s.keyWorkerAllocationRecords ?? []) as any[];
    const key_worker_allocation_records: KeyWorkerAllocationInput[] = rawAllocations.map((a: any) => ({
      id: a.id ?? "",
      child_id: a.child_id ?? "",
      staff_id: a.staff_id ?? "",
      staff_name: a.staff_name ?? "",
      allocated: a.allocated !== false,
      allocation_date: (a.allocation_date ?? today).toString(),
      active: a.active !== false,
      backup_key_worker_assigned: !!a.backup_key_worker_assigned,
      allocation_reviewed: !!a.allocation_reviewed,
      last_review_date: a.last_review_date ?? null,
      child_consulted_on_allocation: !!a.child_consulted_on_allocation,
      created_at: (a.created_at ?? today).toString(),
    }));

    const rawAssessments = (s.relationshipAssessmentRecords ?? []) as any[];
    const relationship_assessment_records: RelationshipAssessmentInput[] = rawAssessments.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      staff_id: r.staff_id ?? "",
      assessment_date: (r.assessment_date ?? today).toString(),
      trust_score: r.trust_score ?? 3,
      communication_score: r.communication_score ?? 3,
      responsiveness_score: r.responsiveness_score ?? 3,
      emotional_attunement_score: r.emotional_attunement_score ?? 3,
      overall_quality_score: r.overall_quality_score ?? 3,
      assessor: r.assessor ?? "",
      child_voice_included: !!r.child_voice_included,
      areas_for_development: Array.isArray(r.areas_for_development) ? r.areas_for_development : [],
      strengths_identified: Array.isArray(r.strengths_identified) ? r.strengths_identified : [],
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawSessions = (s.keyWorkerSessionRecords ?? []) as any[];
    const key_worker_session_records: KeyWorkerSessionInput[] = rawSessions.map((s: any) => ({
      id: s.id ?? "",
      child_id: s.child_id ?? "",
      staff_id: s.staff_id ?? "",
      session_date: (s.session_date ?? today).toString(),
      session_type: s.session_type ?? "one_to_one",
      duration_minutes: s.duration_minutes ?? 0,
      session_completed: !!s.session_completed,
      session_cancelled: !!s.session_cancelled,
      cancellation_reason: s.cancellation_reason ?? null,
      child_engaged: !!s.child_engaged,
      objectives_set: !!s.objectives_set,
      objectives_met: !!s.objectives_met,
      child_voice_recorded: !!s.child_voice_recorded,
      notes_recorded: !!s.notes_recorded,
      created_at: (s.created_at ?? today).toString(),
    }));

    const rawSatisfaction = (s.childSatisfactionRecords ?? []) as any[];
    const child_satisfaction_records: ChildSatisfactionInput[] = rawSatisfaction.map((s: any) => ({
      id: s.id ?? "",
      child_id: s.child_id ?? "",
      survey_date: (s.survey_date ?? today).toString(),
      satisfaction_score: s.satisfaction_score ?? 3,
      feels_listened_to: !!s.feels_listened_to,
      feels_supported: !!s.feels_supported,
      would_recommend_key_worker: !!s.would_recommend_key_worker,
      wants_change_of_key_worker: !!s.wants_change_of_key_worker,
      feedback_text: s.feedback_text ?? null,
      feedback_method: s.feedback_method ?? "survey",
      created_at: (s.created_at ?? today).toString(),
    }));

    const rawContinuity = (s.continuityRecords ?? []) as any[];
    const continuity_records: ContinuityRecordInput[] = rawContinuity.map((c: any) => ({
      id: c.id ?? "",
      child_id: c.child_id ?? "",
      key_worker_changes: c.key_worker_changes ?? 0,
      current_key_worker_start_date: (c.current_key_worker_start_date ?? today).toString(),
      longest_relationship_days: c.longest_relationship_days ?? 0,
      change_reasons: Array.isArray(c.change_reasons) ? c.change_reasons : [],
      child_consulted_on_change: !!c.child_consulted_on_change,
      transition_supported: !!c.transition_supported,
      placement_start_date: (c.placement_start_date ?? today).toString(),
      created_at: (c.created_at ?? today).toString(),
    }));

    const result = computeKeyWorkerRelationshipQuality({
      today,
      total_children,
      key_worker_allocation_records,
      relationship_assessment_records,
      key_worker_session_records,
      child_satisfaction_records,
      continuity_records,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
