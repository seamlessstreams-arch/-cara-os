// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME STAFF INDUCTION & ONBOARDING INTELLIGENCE API ROUTE
// GET /api/v1/home-staff-induction-onboarding-intelligence
// Cross-domain composite: staffInductionRecords + agencyInductions +
// staffShadowingRecords + staffHandbookAcknowledgementRecords
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeStaffInductionOnboarding,
  type StaffInductionInput,
  type AgencyInductionInput,
  type ShadowingRecordInput,
  type HandbookAcknowledgementInput,
} from "@/lib/engines/home-staff-induction-onboarding-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const staff = (store.staff ?? []) as any[];
    const total_staff = staff.filter((s: any) => s.is_active !== false).length;

    const rawInductions = (store.staffInductionRecords ?? []) as any[];
    const staff_inductions: StaffInductionInput[] = rawInductions.map((r: any) => ({
      id: r.id ?? "",
      staff_id: r.staff_id ?? "",
      start_date: (r.start_date ?? today).toString(),
      completion_date: r.completion_date ?? null,
      status: r.status ?? "not_started",
      modules_total: r.modules_total ?? 0,
      modules_completed: r.modules_completed ?? 0,
      safeguarding_covered: !!r.safeguarding_covered,
      medication_covered: !!r.medication_covered,
      fire_safety_covered: !!r.fire_safety_covered,
      children_intro_completed: !!r.children_intro_completed,
      policy_review_completed: !!r.policy_review_completed,
      signed_off_by: r.signed_off_by ?? null,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawAgency = (store.agencyInductions ?? []) as any[];
    const agency_inductions: AgencyInductionInput[] = rawAgency.map((a: any) => ({
      id: a.id ?? "",
      staff_name: a.staff_name ?? a.name ?? "",
      agency_name: a.agency_name ?? "",
      induction_date: (a.induction_date ?? a.date ?? today).toString(),
      completed: a.completed !== false,
      safeguarding_briefed: !!a.safeguarding_briefed,
      medication_briefed: !!a.medication_briefed,
      fire_procedures_briefed: !!a.fire_procedures_briefed,
      children_needs_briefed: !!a.children_needs_briefed,
      house_rules_briefed: !!a.house_rules_briefed,
      emergency_contacts_given: !!a.emergency_contacts_given,
      conducted_by: a.conducted_by ?? "",
      created_at: (a.created_at ?? today).toString(),
    }));

    const rawShadowing = (store.staffShadowingRecords ?? []) as any[];
    const shadowing_records: ShadowingRecordInput[] = rawShadowing.map((s: any) => ({
      id: s.id ?? "",
      staff_id: s.staff_id ?? "",
      shadow_date: (s.shadow_date ?? s.date ?? today).toString(),
      shift_type: s.shift_type ?? "day",
      hours: s.hours ?? 0,
      mentor_id: s.mentor_id ?? "",
      competency_confirmed: !!s.competency_confirmed,
      areas_of_strength: Array.isArray(s.areas_of_strength) ? s.areas_of_strength : [],
      areas_for_development: Array.isArray(s.areas_for_development) ? s.areas_for_development : [],
      ready_for_lone_working: !!s.ready_for_lone_working,
      created_at: (s.created_at ?? today).toString(),
    }));

    const rawHandbook = (store.staffHandbookAcknowledgementRecords ?? []) as any[];
    const handbook_acknowledgements: HandbookAcknowledgementInput[] = rawHandbook.map((h: any) => ({
      id: h.id ?? "",
      staff_id: h.staff_id ?? "",
      acknowledged_date: (h.acknowledged_date ?? h.date ?? today).toString(),
      version: h.version ?? "1.0",
      key_policies_read: !!h.key_policies_read,
      safeguarding_policy_read: !!h.safeguarding_policy_read,
      behaviour_management_read: !!h.behaviour_management_read,
      whistleblowing_policy_read: !!h.whistleblowing_policy_read,
      signed: !!h.signed,
      created_at: (h.created_at ?? today).toString(),
    }));

    const result = computeStaffInductionOnboarding({
      today,
      total_staff,
      staff_inductions,
      agency_inductions,
      shadowing_records,
      handbook_acknowledgements,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
