// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME STAFF TRAINING & CPD COMPLIANCE INTELLIGENCE API ROUTE
// GET /api/v1/home-staff-training-cpd-compliance-intelligence
// Synthesises mandatory training, CPD, training needs, qualifications, and
// development plan records to produce an overall training compliance score.
// CHR 2015 Reg 32, 33. SCCIF: "Leadership and management."
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeStaffTrainingCpdCompliance,
  type MandatoryTrainingRecordInput,
  type CpdRecordInput,
  type TrainingNeedsRecordInput,
  type QualificationRecordInput,
  type DevelopmentPlanRecordInput,
} from "@/lib/engines/home-staff-training-cpd-compliance-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    // ── Staff count (STAFF-focused engine — uses store.staff) ─────────
    const staff = (store.staff ?? []) as any[];
    const total_staff = staff.length;

    // ── Mandatory Training Records ────────────────────────────────────
    const rawMandatory = (store.mandatoryTrainingRecords ?? []) as any[];
    const mandatory_training_records: MandatoryTrainingRecordInput[] = rawMandatory.map((r: any) => ({
      id: r.id ?? "",
      staff_id: r.staff_id ?? "",
      course_name: r.course_name ?? r.name ?? "",
      status: r.status ?? "not_started",
      completed_date: r.completed_date ?? r.completion_date ?? null,
      expiry_date: r.expiry_date ?? null,
      is_valid: r.is_valid !== false,
      is_mandatory: r.is_mandatory !== false,
      assessment_passed: !!r.assessment_passed,
      training_hours: r.training_hours ?? r.hours ?? 0,
      delivery_method: r.delivery_method ?? "classroom",
      provider_quality_rating: r.provider_quality_rating ?? 0,
      certificate_issued: !!r.certificate_issued,
    }));

    // ── CPD Records ───────────────────────────────────────────────────
    const rawCpd = (store.cpdRecords ?? []) as any[];
    const cpd_records: CpdRecordInput[] = rawCpd.map((c: any) => ({
      id: c.id ?? "",
      staff_id: c.staff_id ?? "",
      status: c.status ?? "planned",
      activity_type: c.activity_type ?? c.type ?? "other",
      cpd_hours: c.cpd_hours ?? c.hours ?? 0,
      reflection_recorded: !!c.reflection_recorded,
      evidence_obtained: !!(c.evidence_obtained ?? c.certificate_obtained),
      learning_applied: !!c.learning_applied,
      linked_to_development_need: !!c.linked_to_development_need,
      quality_rating: c.quality_rating ?? 0,
      activity_date: (c.activity_date ?? c.date ?? today).toString(),
      shared_with_team: !!c.shared_with_team,
    }));

    // ── Training Needs Records ────────────────────────────────────────
    const rawNeeds = (store.trainingNeedsRecords ?? []) as any[];
    const training_needs_records: TrainingNeedsRecordInput[] = rawNeeds.map((n: any) => ({
      id: n.id ?? "",
      staff_id: n.staff_id ?? "",
      assessment_date: (n.assessment_date ?? n.date ?? today).toString(),
      needs_identified: n.needs_identified ?? 0,
      needs_addressed: n.needs_addressed ?? 0,
      staff_involved: !!n.staff_involved,
      linked_to_supervision: !!n.linked_to_supervision,
      plan_created: !!n.plan_created,
      priority: n.priority ?? "medium",
      is_current: n.is_current !== false,
      specialist_needs_identified: !!n.specialist_needs_identified,
      specialist_needs_addressed: n.specialist_needs_addressed ?? 0,
    }));

    // ── Qualification Records ─────────────────────────────────────────
    const rawQuals = (store.qualificationRecords ?? []) as any[];
    const qualification_records: QualificationRecordInput[] = rawQuals.map((q: any) => ({
      id: q.id ?? "",
      staff_id: q.staff_id ?? "",
      qualification_name: q.qualification_name ?? q.name ?? "",
      status: q.status ?? "not_started",
      role_relevant: q.role_relevant !== false,
      level: q.level ?? 0,
      registration_current: q.registration_current !== false,
      achieved_date: q.achieved_date ?? null,
      expiry_date: q.expiry_date ?? null,
      cpd_requirements_met: q.cpd_requirements_met !== false,
      is_required: !!q.is_required,
      evidence_on_file: !!q.evidence_on_file,
    }));

    // ── Development Plan Records ──────────────────────────────────────
    const rawPlans = (store.developmentPlanRecords ?? []) as any[];
    const development_plan_records: DevelopmentPlanRecordInput[] = rawPlans.map((p: any) => ({
      id: p.id ?? "",
      staff_id: p.staff_id ?? "",
      plan_exists: p.plan_exists !== false,
      is_current: p.is_current !== false,
      last_reviewed_date: p.last_reviewed_date ?? null,
      objectives_set: p.objectives_set ?? 0,
      objectives_achieved: p.objectives_achieved ?? 0,
      objectives_in_progress: p.objectives_in_progress ?? 0,
      staff_involved: !!p.staff_involved,
      linked_to_home_priorities: !!p.linked_to_home_priorities,
      measurable_outcomes: !!p.measurable_outcomes,
      linked_to_supervision: !!p.linked_to_supervision,
      career_pathway_documented: !!p.career_pathway_documented,
      quality_rating: p.quality_rating ?? 0,
    }));

    const result = computeStaffTrainingCpdCompliance({
      today,
      total_staff,
      mandatory_training_records,
      cpd_records,
      training_needs_records,
      qualification_records,
      development_plan_records,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
