// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME ORGANIZATIONAL LEARNING INTELLIGENCE API ROUTE
// GET /api/v1/home-organizational-learning-intelligence
// SIRs, critical debriefs, service improvements, lessons learned.
// CHR 2015 Reg 45: "Review of quality of care."
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeHomeOrganizationalLearning,
  type SeriousIncidentReviewInput,
  type CriticalIncidentDebriefInput,
  type ServiceImprovementInput,
} from "@/lib/engines/home-organizational-learning-intelligence-engine";

export async function GET() {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  // ── Serious Incident Reviews ────────────────────────────────────────
  const serious_incident_reviews: SeriousIncidentReviewInput[] = (
    (store.seriousIncidentReviewRecords ?? []) as any[]
  ).map((r: any) => ({
    id: (r.id ?? "").toString(),
    review_type: (r.review_type ?? "serious_incident").toString(),
    incident_date: (r.incident_date ?? "").toString().slice(0, 10),
    review_commenced_date: (r.review_commenced_date ?? "").toString().slice(0, 10),
    review_completed_date: r.review_completed_date ? (r.review_completed_date).toString().slice(0, 10) : null,
    status: (r.status ?? "initiated").toString(),
    lessons_learned_count: Array.isArray(r.lessons_learned) ? r.lessons_learned.length : 0,
    actions_total: Array.isArray(r.actions) ? r.actions.length : 0,
    actions_completed: Array.isArray(r.actions) ? (r.actions as any[]).filter((a: any) => a.status === "completed").length : 0,
    actions_overdue: Array.isArray(r.actions) ? (r.actions as any[]).filter((a: any) => a.status === "overdue").length : 0,
    practice_changes_count: Array.isArray(r.practice_changes) ? r.practice_changes.length : 0,
    training_implications_count: Array.isArray(r.training_implications) ? r.training_implications.length : 0,
    policy_changes_count: Array.isArray(r.policy_changes) ? r.policy_changes.length : 0,
  }));

  // ── Critical Incident Debriefs ──────────────────────────────────────
  const critical_debriefs: CriticalIncidentDebriefInput[] = (
    (store.criticalIncidentDebriefRecords ?? []) as any[]
  ).map((d: any) => ({
    id: (d.id ?? "").toString(),
    incident_date: (d.incident_date ?? "").toString().slice(0, 10),
    debrief_date: (d.debrief_date ?? "").toString().slice(0, 10),
    impact_level: (d.impact_level ?? "medium").toString(),
    status: (d.status ?? "completed").toString(),
    what_worked_well_count: Array.isArray(d.what_worked_well) ? d.what_worked_well.length : 0,
    what_could_improve_count: Array.isArray(d.what_could_improve) ? d.what_could_improve.length : 0,
    root_causes_count: Array.isArray(d.root_causes) ? d.root_causes.length : 0,
    actions_agreed_count: Array.isArray(d.actions_agreed) ? d.actions_agreed.length : 0,
    actions_completed: typeof d.actions_completed === "number" ? d.actions_completed : 0,
    training_needs_count: Array.isArray(d.training_needs) ? d.training_needs.length : 0,
  }));

  // ── Service Improvements ────────────────────────────────────────────
  const service_improvements: ServiceImprovementInput[] = (
    (store.serviceImprovementRecords ?? []) as any[]
  ).map((s: any) => ({
    id: (s.id ?? "").toString(),
    category: (s.category ?? "practice").toString(),
    source: (s.source ?? "staff_suggestion").toString(),
    start_date: (s.start_date ?? "").toString().slice(0, 10),
    target_completion_date: (s.target_completion_date ?? "").toString().slice(0, 10),
    status: (s.status ?? "proposed").toString(),
    risk_rag_rating: (s.risk_rag_rating ?? "green").toString(),
    milestones_total: Array.isArray(s.key_milestones) ? s.key_milestones.length : 0,
    milestones_achieved: Array.isArray(s.key_milestones) ? (s.key_milestones as any[]).filter((m: any) => m.achieved).length : 0,
    last_review_date: (s.last_review_date ?? "").toString().slice(0, 10),
    next_review_date: (s.next_review_date ?? "").toString().slice(0, 10),
  }));

  const result = computeHomeOrganizationalLearning({
    today,
    serious_incident_reviews,
    critical_debriefs,
    service_improvements,
  });

  return NextResponse.json({ data: result });
}
