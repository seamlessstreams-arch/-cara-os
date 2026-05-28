export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeInfectionPreventionControl,
  type HygieneAuditRecordInput,
  type IllnessOutbreakRecordInput,
  type HandHygieneRecordInput,
  type CleaningScheduleRecordInput,
  type ImmunisationRecordInput,
} from "@/lib/engines/home-infection-prevention-control-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    const rawAudits = (store.hygieneAuditRecords ?? []) as any[];
    const hygiene_audit_records: HygieneAuditRecordInput[] = rawAudits.map((r: any) => ({
      id: r.id ?? "",
      audit_date: (r.audit_date ?? today).toString(),
      auditor: r.auditor ?? "",
      area_audited: r.area_audited ?? "",
      hand_wash_stations_adequate: r.hand_wash_stations_adequate ?? false,
      soap_dispensers_stocked: r.soap_dispensers_stocked ?? false,
      sanitiser_available: r.sanitiser_available ?? false,
      waste_disposal_compliant: r.waste_disposal_compliant ?? false,
      laundry_procedures_followed: r.laundry_procedures_followed ?? false,
      food_hygiene_compliant: r.food_hygiene_compliant ?? false,
      personal_protective_equipment_available: r.personal_protective_equipment_available ?? false,
      infection_control_signage_displayed: r.infection_control_signage_displayed ?? false,
      overall_compliance_score: r.overall_compliance_score ?? 3,
      issues_identified: Array.isArray(r.issues_identified) ? r.issues_identified : [],
      issues_resolved: r.issues_resolved ?? false,
      resolution_date: r.resolution_date ?? null,
      corrective_actions: r.corrective_actions ?? null,
      next_audit_date: r.next_audit_date ?? null,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawOutbreaks = (store.illnessOutbreakRecords ?? []) as any[];
    const illness_outbreak_records: IllnessOutbreakRecordInput[] = rawOutbreaks.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      illness_type: r.illness_type ?? "other",
      onset_date: (r.onset_date ?? today).toString(),
      reported_date: (r.reported_date ?? today).toString(),
      isolation_measures_implemented: r.isolation_measures_implemented ?? false,
      gp_consulted: r.gp_consulted ?? false,
      public_health_notified: r.public_health_notified ?? false,
      children_affected_count: r.children_affected_count ?? 1,
      staff_affected_count: r.staff_affected_count ?? 0,
      containment_actions_taken: r.containment_actions_taken ?? null,
      containment_effective: r.containment_effective ?? false,
      duration_days: r.duration_days ?? null,
      resolution_date: r.resolution_date ?? null,
      return_to_normal_date: r.return_to_normal_date ?? null,
      lessons_learned_documented: r.lessons_learned_documented ?? false,
      staff_member: r.staff_member ?? "",
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawHandHygiene = (store.handHygieneRecords ?? []) as any[];
    const hand_hygiene_records: HandHygieneRecordInput[] = rawHandHygiene.map((r: any) => ({
      id: r.id ?? "",
      observation_date: (r.observation_date ?? today).toString(),
      observer: r.observer ?? "",
      staff_id: r.staff_id ?? "",
      staff_name: r.staff_name ?? "",
      opportunity_type: r.opportunity_type ?? "general_hand_wash",
      hand_hygiene_performed: r.hand_hygiene_performed ?? false,
      technique_correct: r.technique_correct ?? false,
      soap_or_sanitiser_used: r.soap_or_sanitiser_used ?? false,
      duration_adequate: r.duration_adequate ?? false,
      gloves_used_when_required: r.gloves_used_when_required ?? false,
      training_completed: r.training_completed ?? false,
      training_date: r.training_date ?? null,
      notes: r.notes ?? null,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawCleaning = (store.cleaningScheduleRecords ?? []) as any[];
    const cleaning_schedule_records: CleaningScheduleRecordInput[] = rawCleaning.map((r: any) => ({
      id: r.id ?? "",
      scheduled_date: (r.scheduled_date ?? today).toString(),
      area: r.area ?? "",
      cleaning_type: r.cleaning_type ?? "daily_routine",
      completed: r.completed ?? false,
      completed_by: r.completed_by ?? null,
      completion_time: r.completion_time ?? null,
      products_used_correctly: r.products_used_correctly ?? false,
      checked_by: r.checked_by ?? null,
      check_passed: r.check_passed ?? false,
      issues_found: r.issues_found ?? null,
      issues_addressed: r.issues_addressed ?? false,
      frequency: r.frequency ?? "daily",
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawImmunisations = (store.immunisationRecords ?? []) as any[];
    const immunisation_records: ImmunisationRecordInput[] = rawImmunisations.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      vaccine_name: r.vaccine_name ?? "",
      due_date: (r.due_date ?? today).toString(),
      administered: r.administered ?? false,
      administered_date: r.administered_date ?? null,
      declined: r.declined ?? false,
      decline_reason: r.decline_reason ?? null,
      consent_obtained: r.consent_obtained ?? false,
      consent_from: r.consent_from ?? null,
      gp_confirmed: r.gp_confirmed ?? false,
      catch_up_plan_in_place: r.catch_up_plan_in_place ?? false,
      next_due_date: r.next_due_date ?? null,
      staff_member: r.staff_member ?? "",
      created_at: (r.created_at ?? today).toString(),
    }));

    const result = computeInfectionPreventionControl({
      today,
      total_children,
      hygiene_audit_records,
      illness_outbreak_records,
      hand_hygiene_records,
      cleaning_schedule_records,
      immunisation_records,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
