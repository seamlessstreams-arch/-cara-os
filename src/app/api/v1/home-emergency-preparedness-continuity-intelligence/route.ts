// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME EMERGENCY PREPAREDNESS & BUSINESS CONTINUITY API ROUTE
// GET /api/v1/home-emergency-preparedness-continuity-intelligence
// Cross-domain composite: fireDrillRecords + evacuationPlans +
// emergencyContacts + businessContinuityPlans + firstAidRecords
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeEmergencyPreparednessContinuity,
  type FireDrillRecordInput,
  type EvacuationPlanInput,
  type EmergencyContactInput,
  type BusinessContinuityPlanInput,
  type FirstAidRecordInput,
} from "@/lib/engines/home-emergency-preparedness-continuity-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    const rawFireDrills = (store.fireDrillRecords ?? []) as any[];
    const fire_drill_records: FireDrillRecordInput[] = rawFireDrills.map((d: any) => ({
      id: d.id ?? "",
      drill_date: (d.drill_date ?? today).toString(),
      drill_type: d.drill_type ?? "day",
      all_children_participated: !!d.all_children_participated,
      all_staff_participated: !!d.all_staff_participated,
      evacuation_time_seconds: d.evacuation_time_seconds ?? 0,
      target_evacuation_time_seconds: d.target_evacuation_time_seconds ?? 180,
      issues_identified: Array.isArray(d.issues_identified) ? d.issues_identified : [],
      issues_resolved: !!d.issues_resolved,
      debrief_completed: !!d.debrief_completed,
      debrief_notes: d.debrief_notes ?? null,
      next_drill_due: d.next_drill_due ?? null,
      conducted_by: d.conducted_by ?? "",
      created_at: (d.created_at ?? today).toString(),
    }));

    const rawEvacPlans = (store.evacuationPlans ?? []) as any[];
    const evacuation_plans: EvacuationPlanInput[] = rawEvacPlans.map((p: any) => ({
      id: p.id ?? "",
      plan_name: p.plan_name ?? "",
      plan_type: p.plan_type ?? "general",
      last_reviewed: (p.last_reviewed ?? today).toString(),
      review_due: (p.review_due ?? today).toString(),
      approved_by: p.approved_by ?? null,
      is_current: p.is_current !== false,
      covers_all_exits: !!p.covers_all_exits,
      includes_assembly_point: !!p.includes_assembly_point,
      includes_roll_call_procedure: !!p.includes_roll_call_procedure,
      includes_vulnerable_children_provisions: !!p.includes_vulnerable_children_provisions,
      displayed_in_home: !!p.displayed_in_home,
      staff_trained_on_plan: !!p.staff_trained_on_plan,
      children_briefed: !!p.children_briefed,
      created_at: (p.created_at ?? today).toString(),
    }));

    const rawContacts = (store.emergencyContacts ?? []) as any[];
    const emergency_contacts: EmergencyContactInput[] = rawContacts.map((c: any) => ({
      id: c.id ?? "",
      contact_type: c.contact_type ?? "other",
      contact_name: c.contact_name ?? "",
      phone_number: c.phone_number ?? "",
      email: c.email ?? null,
      verified: !!c.verified,
      last_verified_date: c.last_verified_date ?? null,
      verification_due: c.verification_due ?? null,
      is_current: c.is_current !== false,
      notes: c.notes ?? null,
      created_at: (c.created_at ?? today).toString(),
    }));

    const rawContinuityPlans = (store.businessContinuityPlans ?? []) as any[];
    const business_continuity_plans: BusinessContinuityPlanInput[] = rawContinuityPlans.map((p: any) => ({
      id: p.id ?? "",
      plan_name: p.plan_name ?? "",
      scenario: p.scenario ?? "other",
      last_reviewed: (p.last_reviewed ?? today).toString(),
      review_due: (p.review_due ?? today).toString(),
      approved_by: p.approved_by ?? null,
      is_current: p.is_current !== false,
      tested: !!p.tested,
      last_tested_date: p.last_tested_date ?? null,
      includes_communication_plan: !!p.includes_communication_plan,
      includes_alternative_accommodation: !!p.includes_alternative_accommodation,
      includes_data_backup: !!p.includes_data_backup,
      includes_staffing_contingency: !!p.includes_staffing_contingency,
      staff_aware: !!p.staff_aware,
      created_at: (p.created_at ?? today).toString(),
    }));

    const rawFirstAid = (store.firstAidRecords ?? []) as any[];
    const first_aid_records: FirstAidRecordInput[] = rawFirstAid.map((r: any) => ({
      id: r.id ?? "",
      record_type: r.record_type ?? "certificate",
      staff_id: r.staff_id ?? null,
      staff_name: r.staff_name ?? null,
      certificate_type: r.certificate_type ?? null,
      certificate_expiry: r.certificate_expiry ?? null,
      is_current: r.is_current !== false,
      equipment_name: r.equipment_name ?? null,
      equipment_location: r.equipment_location ?? null,
      equipment_checked: !!r.equipment_checked,
      equipment_check_date: r.equipment_check_date ?? null,
      equipment_next_check_due: r.equipment_next_check_due ?? null,
      equipment_in_date: !!r.equipment_in_date,
      items_replaced: Array.isArray(r.items_replaced) ? r.items_replaced : [],
      training_date: r.training_date ?? null,
      training_provider: r.training_provider ?? null,
      created_at: (r.created_at ?? today).toString(),
    }));

    const result = computeEmergencyPreparednessContinuity({
      today,
      total_children,
      fire_drill_records,
      evacuation_plans,
      emergency_contacts,
      business_continuity_plans,
      first_aid_records,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
