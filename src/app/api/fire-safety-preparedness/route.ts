// ==============================================================================
// API: /api/fire-safety-preparedness
//
// Fire Safety Preparedness Intelligence
//
// GET  — Returns fire safety assessment with Oak House demo data
// POST — Accepts custom data and returns tailored assessment
// ==============================================================================

import { NextResponse } from "next/server";
import {
  generateFireSafetyPreparednessIntelligence,
  getDrillTypeLabel,
  getDrillOutcomeLabel,
  getEquipmentTypeLabel,
  getCheckOutcomeLabel,
  getPeepStatusLabel,
  getRatingLabel,
} from "@/lib/fire-safety-preparedness";
import type {
  FireDrillRecord,
  EquipmentCheck,
  EvacuationPlan,
  StaffFireTraining,
} from "@/lib/fire-safety-preparedness";

// -- Demo Data: Oak House -------------------------------------------------------

const DEMO_DRILLS: FireDrillRecord[] = [
  {
    id: "fd-1",
    drillDate: "2026-02-15",
    drillType: "planned",
    conductedBy: "Darren Laville",
    outcome: "successful",
    evacuationTimeSeconds: 95,
    allChildrenParticipated: true,
    allStaffParticipated: true,
    issuesIdentified: [],
    correctiveActionsTaken: false,
  },
  {
    id: "fd-2",
    drillDate: "2026-03-10",
    drillType: "unannounced",
    conductedBy: "Sarah Johnson",
    outcome: "successful",
    evacuationTimeSeconds: 110,
    allChildrenParticipated: true,
    allStaffParticipated: true,
    issuesIdentified: ["Fire door propped open in kitchen"],
    correctiveActionsTaken: true,
  },
  {
    id: "fd-3",
    drillDate: "2026-04-05",
    drillType: "night_drill",
    conductedBy: "Tom Richards",
    outcome: "successful",
    evacuationTimeSeconds: 140,
    allChildrenParticipated: true,
    allStaffParticipated: true,
    issuesIdentified: [],
    correctiveActionsTaken: false,
  },
  {
    id: "fd-4",
    drillDate: "2026-05-01",
    drillType: "partial_evacuation",
    conductedBy: "Lisa Williams",
    outcome: "successful",
    evacuationTimeSeconds: 85,
    allChildrenParticipated: true,
    allStaffParticipated: true,
    issuesIdentified: [],
    correctiveActionsTaken: false,
  },
];

const DEMO_CHECKS: EquipmentCheck[] = [
  { id: "ec-1", checkDate: "2026-04-01", checkedBy: "Tom Richards", equipmentType: "smoke_alarm", location: "Hallway Ground Floor", outcome: "pass", nextCheckDue: "2026-05-01" },
  { id: "ec-2", checkDate: "2026-04-01", checkedBy: "Tom Richards", equipmentType: "smoke_alarm", location: "Hallway First Floor", outcome: "pass", nextCheckDue: "2026-05-01" },
  { id: "ec-3", checkDate: "2026-04-01", checkedBy: "Tom Richards", equipmentType: "fire_extinguisher", location: "Kitchen", outcome: "pass", nextCheckDue: "2026-10-01" },
  { id: "ec-4", checkDate: "2026-04-01", checkedBy: "Tom Richards", equipmentType: "fire_extinguisher", location: "Staff Office", outcome: "pass", nextCheckDue: "2026-10-01" },
  { id: "ec-5", checkDate: "2026-04-01", checkedBy: "Tom Richards", equipmentType: "fire_blanket", location: "Kitchen", outcome: "pass", nextCheckDue: "2026-10-01" },
  { id: "ec-6", checkDate: "2026-04-01", checkedBy: "Tom Richards", equipmentType: "emergency_lighting", location: "All Corridors", outcome: "pass", nextCheckDue: "2026-07-01" },
  { id: "ec-7", checkDate: "2026-04-01", checkedBy: "Tom Richards", equipmentType: "fire_door", location: "Kitchen", outcome: "pass", nextCheckDue: "2026-07-01" },
  { id: "ec-8", checkDate: "2026-04-01", checkedBy: "Tom Richards", equipmentType: "fire_door", location: "Lounge", outcome: "pass", nextCheckDue: "2026-07-01" },
  { id: "ec-9", checkDate: "2026-04-01", checkedBy: "Tom Richards", equipmentType: "signage", location: "All Floors", outcome: "pass", nextCheckDue: "2026-10-01" },
  { id: "ec-10", checkDate: "2026-04-01", checkedBy: "Tom Richards", equipmentType: "break_glass_point", location: "Main Entrance", outcome: "pass", nextCheckDue: "2026-07-01" },
];

const DEMO_PLANS: EvacuationPlan[] = [
  {
    id: "ep-1",
    childId: "child-alex",
    childName: "Alex",
    peepStatus: "current",
    lastReviewDate: "2026-04-01",
    assemblyPointKnown: true,
    escapeRouteAccessible: true,
    mobilityConsiderations: [],
    nightEvacuationPlan: true,
  },
  {
    id: "ep-2",
    childId: "child-jordan",
    childName: "Jordan",
    peepStatus: "current",
    lastReviewDate: "2026-03-15",
    assemblyPointKnown: true,
    escapeRouteAccessible: true,
    mobilityConsiderations: [],
    nightEvacuationPlan: true,
  },
  {
    id: "ep-3",
    childId: "child-morgan",
    childName: "Morgan",
    peepStatus: "current",
    lastReviewDate: "2026-04-10",
    assemblyPointKnown: true,
    escapeRouteAccessible: true,
    mobilityConsiderations: ["Sensory sensitivity to alarms — staff to provide reassurance"],
    nightEvacuationPlan: true,
  },
];

const DEMO_TRAINING: StaffFireTraining[] = [
  { id: "ft-1", staffId: "staff-sarah", staffName: "Sarah Johnson", fireAwareness: true, fireMarshalTrained: true, evacuationProcedures: true, extinguisherUse: true, peepAwareness: true, nightResponseTrained: true },
  { id: "ft-2", staffId: "staff-tom", staffName: "Tom Richards", fireAwareness: true, fireMarshalTrained: true, evacuationProcedures: true, extinguisherUse: true, peepAwareness: true, nightResponseTrained: true },
  { id: "ft-3", staffId: "staff-lisa", staffName: "Lisa Williams", fireAwareness: true, fireMarshalTrained: true, evacuationProcedures: true, extinguisherUse: true, peepAwareness: true, nightResponseTrained: true },
  { id: "ft-4", staffId: "staff-darren", staffName: "Darren Laville", fireAwareness: true, fireMarshalTrained: true, evacuationProcedures: true, extinguisherUse: true, peepAwareness: true, nightResponseTrained: true },
];

// -- GET ------------------------------------------------------------------------

export async function GET() {
  const result = generateFireSafetyPreparednessIntelligence(
    DEMO_DRILLS,
    DEMO_CHECKS,
    DEMO_PLANS,
    DEMO_TRAINING,
    "oak-house",
    "2026-01-01",
    "2026-05-19",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        drillTypeLabels: Object.fromEntries(
          (["planned", "unannounced", "night_drill", "partial_evacuation", "tabletop_exercise"] as const).map(
            (t) => [t, getDrillTypeLabel(t)],
          ),
        ),
        drillOutcomeLabels: Object.fromEntries(
          (["successful", "partial_success", "failed", "abandoned"] as const).map(
            (o) => [o, getDrillOutcomeLabel(o)],
          ),
        ),
        equipmentTypeLabels: Object.fromEntries(
          (["smoke_alarm", "heat_detector", "fire_extinguisher", "fire_blanket", "emergency_lighting", "fire_door", "sprinkler", "break_glass_point", "signage"] as const).map(
            (t) => [t, getEquipmentTypeLabel(t)],
          ),
        ),
        checkOutcomeLabels: Object.fromEntries(
          (["pass", "minor_fault", "major_fault", "out_of_service"] as const).map(
            (o) => [o, getCheckOutcomeLabel(o)],
          ),
        ),
        peepStatusLabels: Object.fromEntries(
          (["current", "overdue", "not_required", "in_progress"] as const).map(
            (s) => [s, getPeepStatusLabel(s)],
          ),
        ),
        ratingLabels: Object.fromEntries(
          (["outstanding", "good", "requires_improvement", "inadequate"] as const).map(
            (r) => [r, getRatingLabel(r)],
          ),
        ),
      },
    },
  });
}

// -- POST -----------------------------------------------------------------------

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { drills, checks, plans, training, homeId, periodStart, periodEnd } = body as {
    drills?: FireDrillRecord[];
    checks?: EquipmentCheck[];
    plans?: EvacuationPlan[];
    training?: StaffFireTraining[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });
  }

  const result = generateFireSafetyPreparednessIntelligence(
    drills ?? [],
    checks ?? [],
    plans ?? [],
    training ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
