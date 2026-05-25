// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — EMERGENCY PREPAREDNESS INTELLIGENCE API ROUTE
// GET /api/v1/emergency-intelligence
// Returns drill analysis, emergency plan coverage, preparedness alerts,
// and ARIA emergency insights.
// Reg 22, Reg 25, Reg 40, SCCIF "Helped & Protected", "Leadership & Management".
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeEmergencyIntelligence,
  type ProtocolDrillInput,
  type EmergencyPlanInput,
  type StaffRef,
} from "@/lib/engines/emergency-intelligence-engine";

export async function GET() {
  const store = getStore();

  // ── Map protocol drills ─────────────────────────────────────────────────
  const drills: ProtocolDrillInput[] = (store.protocolDrills ?? []).map((d: any) => ({
    id: d.id,
    date: d.date,
    scenario_type: d.scenario_type,
    lead_by: d.lead_by,
    participants: d.participants ?? [],
    response_time_minutes: d.response_time_minutes ?? 0,
    protocol_followed: Boolean(d.protocol_followed),
    outcome: d.outcome ?? "satisfactory",
    next_drill_due: d.next_drill_due,
    actions_required: d.actions_required ?? [],
    learning_points: d.learning_points ?? [],
  }));

  // ── Map emergency plans ─────────────────────────────────────────────────
  const plans: EmergencyPlanInput[] = (store.emergencyPlans ?? []).map((p: any) => ({
    id: p.id,
    title: p.title,
    plan_type: p.plan_type,
    status: p.status ?? "draft",
    last_tested: p.last_tested,
    next_test: p.next_test,
    evacuation_required: Boolean(p.evacuation_required),
  }));

  // ── Map staff ───────────────────────────────────────────────────────────
  const staff: StaffRef[] = (store.staff ?? []).map((s: any) => ({
    id: s.id,
    name: s.name ?? `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim(),
  }));

  // ── Run engine ──────────────────────────────────────────────────────────
  const result = computeEmergencyIntelligence({
    drills,
    plans,
    staff,
  });

  return NextResponse.json({ data: result });
}
