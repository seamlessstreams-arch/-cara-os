// ══════════════════════════════════════════════════════════════════════════════
// API: /api/fire-safety
//
// Fire Safety Intelligence
//
// GET  — Returns fire safety metrics with Oak House demo data
// POST — Accepts custom data and returns analysis
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { generateFireSafetyIntelligence } from "@/lib/fire-safety";
import type {
  FireDrill,
  FireEquipment,
  FireRiskAssessment,
  FireSafetyTraining,
  EvacuationPlan,
} from "@/lib/fire-safety";

// ── Demo Data ──────────────────────────────────────────────────────────────

function generateDemoData() {
  const drills: FireDrill[] = [
    {
      id: "drill-001",
      homeId: "oak-house",
      date: "2026-01-20",
      drillType: "full_evacuation",
      timeOfDay: "day",
      childrenPresent: 4,
      childrenEvacuated: 4,
      evacuationTimeSeconds: 145,
      targetTimeSeconds: 180,
      allAccountedFor: true,
      issuesIdentified: [],
      staffLed: "Sarah Johnson",
      debriefCompleted: true,
    },
    {
      id: "drill-002",
      homeId: "oak-house",
      date: "2026-02-18",
      drillType: "full_evacuation",
      timeOfDay: "evening",
      childrenPresent: 4,
      childrenEvacuated: 4,
      evacuationTimeSeconds: 160,
      targetTimeSeconds: 180,
      allAccountedFor: true,
      issuesIdentified: ["One child initially reluctant to leave bedroom"],
      staffLed: "Tom Richards",
      debriefCompleted: true,
    },
    {
      id: "drill-003",
      homeId: "oak-house",
      date: "2026-03-10",
      drillType: "night_drill",
      timeOfDay: "night",
      childrenPresent: 3,
      childrenEvacuated: 3,
      evacuationTimeSeconds: 200,
      targetTimeSeconds: 240,
      allAccountedFor: true,
      issuesIdentified: ["Emergency lighting in corridor B was dim"],
      staffLed: "Lisa Williams",
      debriefCompleted: true,
    },
    {
      id: "drill-004",
      homeId: "oak-house",
      date: "2026-04-05",
      drillType: "partial_evacuation",
      timeOfDay: "day",
      childrenPresent: 4,
      childrenEvacuated: 4,
      evacuationTimeSeconds: 90,
      targetTimeSeconds: 120,
      allAccountedFor: true,
      issuesIdentified: [],
      staffLed: "Darren Laville",
      debriefCompleted: true,
    },
    {
      id: "drill-005",
      homeId: "oak-house",
      date: "2026-05-01",
      drillType: "tabletop_exercise",
      timeOfDay: "day",
      childrenPresent: 0,
      childrenEvacuated: 0,
      evacuationTimeSeconds: 0,
      targetTimeSeconds: 0,
      allAccountedFor: true,
      issuesIdentified: ["Staff unsure about call point locations on first floor"],
      staffLed: "Darren Laville",
      debriefCompleted: true,
    },
  ];

  const equipment: FireEquipment[] = [
    {
      id: "equip-001",
      homeId: "oak-house",
      equipmentType: "fire_extinguisher",
      location: "Ground floor hallway",
      lastInspectionDate: "2026-03-01",
      nextInspectionDate: "2026-09-01",
      status: "operational",
      notes: "CO2 type, last serviced by FireGuard Ltd",
    },
    {
      id: "equip-002",
      homeId: "oak-house",
      equipmentType: "fire_extinguisher",
      location: "First floor landing",
      lastInspectionDate: "2026-03-01",
      nextInspectionDate: "2026-09-01",
      status: "operational",
      notes: "Foam type",
    },
    {
      id: "equip-003",
      homeId: "oak-house",
      equipmentType: "smoke_detector",
      location: "Kitchen",
      lastInspectionDate: "2026-04-15",
      nextInspectionDate: "2026-10-15",
      status: "operational",
      notes: "Heat detector fitted due to kitchen environment",
    },
    {
      id: "equip-004",
      homeId: "oak-house",
      equipmentType: "smoke_detector",
      location: "Lounge",
      lastInspectionDate: "2026-04-15",
      nextInspectionDate: "2026-10-15",
      status: "operational",
      notes: "",
    },
    {
      id: "equip-005",
      homeId: "oak-house",
      equipmentType: "smoke_detector",
      location: "Each bedroom (x4)",
      lastInspectionDate: "2026-04-15",
      nextInspectionDate: "2026-10-15",
      status: "operational",
      notes: "Interconnected system",
    },
    {
      id: "equip-006",
      homeId: "oak-house",
      equipmentType: "fire_blanket",
      location: "Kitchen",
      lastInspectionDate: "2026-03-01",
      nextInspectionDate: "2026-09-01",
      status: "operational",
      notes: "",
    },
    {
      id: "equip-007",
      homeId: "oak-house",
      equipmentType: "emergency_lighting",
      location: "Corridors and stairwell",
      lastInspectionDate: "2026-02-01",
      nextInspectionDate: "2026-08-01",
      status: "operational",
      notes: "Monthly flash test completed",
    },
    {
      id: "equip-008",
      homeId: "oak-house",
      equipmentType: "fire_door",
      location: "Kitchen fire door",
      lastInspectionDate: "2026-01-15",
      nextInspectionDate: "2026-07-15",
      status: "needs_repair",
      notes: "Self-closer not engaging fully — repair requested",
    },
    {
      id: "equip-009",
      homeId: "oak-house",
      equipmentType: "alarm_panel",
      location: "Front entrance hall",
      lastInspectionDate: "2026-03-01",
      nextInspectionDate: "2026-09-01",
      status: "operational",
      notes: "Addressable panel, 12 zones",
    },
    {
      id: "equip-010",
      homeId: "oak-house",
      equipmentType: "call_point",
      location: "Ground floor by front door",
      lastInspectionDate: "2026-03-01",
      nextInspectionDate: "2026-09-01",
      status: "operational",
      notes: "",
    },
    {
      id: "equip-011",
      homeId: "oak-house",
      equipmentType: "call_point",
      location: "First floor landing",
      lastInspectionDate: "2026-03-01",
      nextInspectionDate: "2026-09-01",
      status: "operational",
      notes: "",
    },
  ];

  const assessments: FireRiskAssessment[] = [
    {
      id: "assess-001",
      homeId: "oak-house",
      assessmentDate: "2026-01-15",
      assessedBy: "Fire Safety Consultants Ltd",
      nextDueDate: "2027-01-15",
      riskLevel: "low",
      findingsCount: 5,
      actionsRequired: 4,
      actionsCompleted: 3,
      sharedWithStaff: true,
    },
  ];

  const training: FireSafetyTraining[] = [
    {
      staffId: "staff-001",
      staffName: "Darren Laville",
      trainingDate: "2026-02-01",
      expiryDate: "2027-02-01",
      trainingType: "fire_marshal",
      passed: true,
    },
    {
      staffId: "staff-002",
      staffName: "Lisa Williams",
      trainingDate: "2026-01-15",
      expiryDate: "2027-01-15",
      trainingType: "advanced",
      passed: true,
    },
    {
      staffId: "staff-003",
      staffName: "Tom Richards",
      trainingDate: "2026-03-01",
      expiryDate: "2027-03-01",
      trainingType: "basic",
      passed: true,
    },
    {
      staffId: "staff-004",
      staffName: "Sarah Johnson",
      trainingDate: "2025-08-01",
      expiryDate: "2026-08-01",
      trainingType: "basic",
      passed: true,
    },
    {
      staffId: "staff-005",
      staffName: "James Cooper",
      trainingDate: "2025-04-01",
      expiryDate: "2026-04-01",
      trainingType: "basic",
      passed: true,
    },
  ];

  const evacuationPlan: EvacuationPlan = {
    id: "evac-001",
    homeId: "oak-house",
    lastReviewed: "2026-03-01",
    assemblyPoint: "Front car park, by the oak tree",
    specialConsiderations: [
      "Child A uses wheelchair — ground floor room assigned, wide exit route confirmed",
      "Child B has anxiety around loud alarms — pre-warning protocol in PEEP",
    ],
    peepPlans: 2,
    childrenRequiringPeep: 2,
  };

  return { drills, equipment, assessments, training, evacuationPlan };
}

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET() {
  const { drills, equipment, assessments, training, evacuationPlan } = generateDemoData();

  const result = generateFireSafetyIntelligence(
    drills,
    equipment,
    assessments,
    training,
    evacuationPlan,
    "oak-house",
    "2026-01-01",
    "2026-05-18",
    "2026-05-18",
  );

  return NextResponse.json({ data: result });
}

// ── POST ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    drills,
    equipment,
    assessments,
    training,
    evacuationPlan,
    homeId,
    periodStart,
    periodEnd,
    referenceDate,
  } = body as {
    drills?: FireDrill[];
    equipment?: FireEquipment[];
    assessments?: FireRiskAssessment[];
    training?: FireSafetyTraining[];
    evacuationPlan?: EvacuationPlan | null;
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
    referenceDate?: string;
  };

  if (!periodStart || !periodEnd) {
    return NextResponse.json(
      { error: "periodStart and periodEnd are required" },
      { status: 400 },
    );
  }

  const result = generateFireSafetyIntelligence(
    drills ?? [],
    equipment ?? [],
    assessments ?? [],
    training ?? [],
    evacuationPlan ?? null,
    homeId ?? "unknown",
    periodStart,
    periodEnd,
    referenceDate ?? new Date().toISOString(),
  );

  return NextResponse.json({ data: result });
}
