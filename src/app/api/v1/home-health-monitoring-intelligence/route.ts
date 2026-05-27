// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME HEALTH MONITORING INTELLIGENCE API ROUTE
// GET /api/v1/home-health-monitoring-intelligence
// Synthesises annual health assessments, immunisation records, dental records,
// and health passports across all children to produce health monitoring intelligence.
// CHR 2015 Reg 10/15. SCCIF: "Health & Wellbeing."
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeHomeHealthMonitoring,
  type AnnualHealthAssessmentInput,
  type HealthPassportInput,
  type ImmunisationInput,
  type DentalInput,
} from "@/lib/engines/home-health-monitoring-intelligence-engine";

export async function GET() {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  // ── Children ──────────────────────────────────────────────────────────
  const youngPeople = (store.youngPeople ?? []) as any[];
  const totalChildren = youngPeople.length;

  // ── Annual Health Assessments ─────────────────────────────────────────
  const annual_health_assessments: AnnualHealthAssessmentInput[] = ((store.annualHealthAssessments ?? []) as any[])
    .map((r: any) => ({
      id: r.id,
      child_id: r.child_id ?? "",
      assessment_date: (r.assessment_date ?? today).toString().slice(0, 10),
      due_date: (r.assessment_due_date ?? today).toString().slice(0, 10),
      completed_within_deadline: !!r.completed_within_deadline,
      immunisations_up_to_date: !!r.immunisations_up_to_date,
      dental_up_to_date: !!r.dental_check_up_to_date,
      optical_up_to_date: !!r.optical_check_up_to_date,
      recommendations_count: Array.isArray(r.recommendations) ? r.recommendations.length : 0,
      next_assessment_date: (r.next_assessment_date ?? "").toString().slice(0, 10),
      signed_off_by_la: !!r.signed_off_by_la,
      report_shared: !!r.report_shared,
    }));

  // ── Health Passports ──────────────────────────────────────────────────
  const health_passports: HealthPassportInput[] = ((store.healthPassports ?? []) as any[])
    .map((p: any) => ({
      id: p.id,
      child_id: p.child_id ?? "",
      last_updated: (p.last_updated ?? today).toString().slice(0, 10),
      medications_count: Array.isArray(p.medications) ? p.medications.length : 0,
      conditions_count: Array.isArray(p.conditions) ? p.conditions.length : 0,
      immunisations_up_to_date: !!p.immunisations_up_to_date,
      consent_status: p.consent_status ?? "",
    }));

  // ── Immunisation Records ──────────────────────────────────────────────
  const immunisations: ImmunisationInput[] = ((store.immunisationRecords ?? []) as any[])
    .map((i: any) => ({
      id: i.id,
      child_id: i.child_id ?? "",
      gp_registered: !!(i.gp_registration),
      missed_count: Array.isArray(i.missed_at_age) ? i.missed_at_age.length : 0,
      caught_up_count: Array.isArray(i.caught_up_during_placement) ? i.caught_up_during_placement.length : 0,
      upcoming_due_count: Array.isArray(i.upcoming_due_within_90_days) ? i.upcoming_due_within_90_days.length : 0,
      child_consent: !!i.child_informed_and_consent,
      gp_reviewed: !!i.gp_reviewed_schedule,
    }));

  // ── Dental Records ────────────────────────────────────────────────────
  const dental_records: DentalInput[] = ((store.dentalRecords ?? []) as any[])
    .map((d: any) => ({
      id: d.id,
      child_id: d.child_id ?? "",
      registration_status: d.registration_status ?? "not_registered",
      last_check_up_date: (d.last_check_up_date ?? "").toString().slice(0, 10),
      next_check_up_due: (d.next_check_up_due ?? "").toString().slice(0, 10),
      has_anxiety: !!(d.anxiety_around_dentistry),
      adjustments_count: Array.isArray(d.reasonable_adjustments) ? d.reasonable_adjustments.length : 0,
    }));

  // ── Compute ───────────────────────────────────────────────────────────
  const result = computeHomeHealthMonitoring({
    today,
    total_children: totalChildren,
    annual_health_assessments,
    health_passports,
    immunisations,
    dental_records,
  });

  return NextResponse.json({ data: result });
}
