// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME EMERGENCY PREPAREDNESS INTELLIGENCE API ROUTE
// GET /api/v1/home-emergency-preparedness-intelligence
// Synthesises home policies, protocol drills, and emergency plans to assess
// policy compliance, drill readiness, and emergency plan coverage.
// CHR 2015 Reg 25, 22. SCCIF: "Safe", "Well-led and managed."
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeHomeEmergencyPreparedness,
  type PolicyInput,
  type DrillInput,
  type EmergencyPlanInput,
} from "@/lib/engines/home-emergency-preparedness-intelligence-engine";

export async function GET() {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  // ── Staff count ───────────────────────────────────────────────────────
  const staff = (store.staff ?? []) as any[];
  const totalStaff = staff.filter((s: any) => s.is_active !== false).length;

  // ── Policies ──────────────────────────────────────────────────────────
  const policies: PolicyInput[] = ((store.homePolicies ?? []) as any[])
    .map((p: any) => ({
      id: p.id ?? "",
      title: p.title ?? "",
      status: p.status ?? "draft",
      next_review_date: (p.next_review_date ?? "").toString().slice(0, 10),
      read_acknowledgement_count: Array.isArray(p.read_acknowledgements)
        ? p.read_acknowledgements.filter((a: any) => a.acknowledged).length
        : 0,
      total_staff_required: typeof p.total_staff_required === "number" ? p.total_staff_required : 0,
      has_statutory_basis: !!(p.statutory_basis),
    }));

  // ── Drills ────────────────────────────────────────────────────────────
  const drills: DrillInput[] = ((store.protocolDrills ?? []) as any[])
    .map((d: any) => ({
      id: d.id ?? "",
      date: (d.date ?? today).toString().slice(0, 10),
      scenario_type: d.scenario_type ?? "other",
      outcome: d.outcome ?? "not_completed",
      protocol_followed: !!(d.protocol_followed),
      has_actions_required: Array.isArray(d.actions_required) ? d.actions_required.length > 0 : false,
      response_time_minutes: typeof d.response_time_minutes === "number" ? d.response_time_minutes : 0,
      participant_count: Array.isArray(d.participants) ? d.participants.length : 0,
      next_drill_due: (d.next_drill_due ?? "").toString().slice(0, 10),
    }));

  // ── Emergency Plans ───────────────────────────────────────────────────
  const emergencyPlans: EmergencyPlanInput[] = ((store.emergencyPlans ?? []) as any[])
    .map((p: any) => ({
      id: p.id ?? "",
      title: p.title ?? "",
      status: p.status ?? "draft",
      last_tested: (p.last_tested ?? "").toString().slice(0, 10),
      next_test: (p.next_test ?? "").toString().slice(0, 10),
      has_child_considerations: Array.isArray(p.child_considerations) ? p.child_considerations.length > 0 : false,
      has_staff_roles: Array.isArray(p.staff_roles) ? p.staff_roles.length > 0 : false,
      has_contact_sequence: Array.isArray(p.contact_sequence) ? p.contact_sequence.length > 0 : false,
    }));

  // ── Compute ───────────────────────────────────────────────────────────
  const result = computeHomeEmergencyPreparedness({
    today,
    total_staff: totalStaff,
    policies,
    drills,
    emergency_plans: emergencyPlans,
  });

  return NextResponse.json({ data: result });
}
