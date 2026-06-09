// ==============================================================================
// API: /api/water-safety-legionella
//
// Water Safety & Legionella Intelligence
//
// GET  — Returns water safety metrics with Chamberlain House demo data
// POST — Accepts custom data and returns analysis
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { generateWaterSafetyLegionellaIntelligence } from "@/lib/water-safety-legionella";
import type {
  TemperatureCheck,
  LegionellaAssessment,
  WaterSafetyPolicy,
  StaffWaterSafetyTraining,
} from "@/lib/water-safety-legionella";

// -- Demo Data -----------------------------------------------------------------

function generateDemoData() {
  const checks: TemperatureCheck[] = [
    // Kitchen hot tap — monthly checks
    {
      id: "tc-001",
      sourceType: "hot_tap",
      location: "Kitchen",
      checkDate: "2026-01-15",
      checkedBy: "Sarah Johnson",
      temperatureCelsius: 58,
      withinSafeRange: true,
      outcome: "pass",
      correctiveAction: false,
    },
    {
      id: "tc-002",
      sourceType: "hot_tap",
      location: "Kitchen",
      checkDate: "2026-02-15",
      checkedBy: "Tom Richards",
      temperatureCelsius: 57,
      withinSafeRange: true,
      outcome: "pass",
      correctiveAction: false,
    },
    {
      id: "tc-003",
      sourceType: "hot_tap",
      location: "Kitchen",
      checkDate: "2026-03-15",
      checkedBy: "Lisa Williams",
      temperatureCelsius: 59,
      withinSafeRange: true,
      outcome: "pass",
      correctiveAction: false,
    },
    {
      id: "tc-004",
      sourceType: "hot_tap",
      location: "Kitchen",
      checkDate: "2026-04-15",
      checkedBy: "Darren Laville",
      temperatureCelsius: 56,
      withinSafeRange: true,
      outcome: "pass",
      correctiveAction: false,
    },
    // Bathroom hot tap
    {
      id: "tc-005",
      sourceType: "hot_tap",
      location: "Main Bathroom",
      checkDate: "2026-01-15",
      checkedBy: "Sarah Johnson",
      temperatureCelsius: 55,
      withinSafeRange: true,
      outcome: "pass",
      correctiveAction: false,
    },
    {
      id: "tc-006",
      sourceType: "hot_tap",
      location: "Main Bathroom",
      checkDate: "2026-03-15",
      checkedBy: "Tom Richards",
      temperatureCelsius: 54,
      withinSafeRange: true,
      outcome: "pass",
      correctiveAction: false,
    },
    // Cold taps
    {
      id: "tc-007",
      sourceType: "cold_tap",
      location: "Kitchen",
      checkDate: "2026-02-15",
      checkedBy: "Lisa Williams",
      temperatureCelsius: 12,
      withinSafeRange: true,
      outcome: "pass",
      correctiveAction: false,
    },
    {
      id: "tc-008",
      sourceType: "cold_tap",
      location: "Main Bathroom",
      checkDate: "2026-02-15",
      checkedBy: "Lisa Williams",
      temperatureCelsius: 14,
      withinSafeRange: true,
      outcome: "pass",
      correctiveAction: false,
    },
    // Bath — TMV checks
    {
      id: "tc-009",
      sourceType: "bath",
      location: "Main Bathroom",
      checkDate: "2026-01-20",
      checkedBy: "Sarah Johnson",
      temperatureCelsius: 44,
      withinSafeRange: true,
      outcome: "pass",
      correctiveAction: false,
    },
    {
      id: "tc-010",
      sourceType: "bath",
      location: "Main Bathroom",
      checkDate: "2026-03-20",
      checkedBy: "Tom Richards",
      temperatureCelsius: 43,
      withinSafeRange: true,
      outcome: "pass",
      correctiveAction: false,
    },
    {
      id: "tc-011",
      sourceType: "bath",
      location: "En-suite Bathroom",
      checkDate: "2026-02-20",
      checkedBy: "Darren Laville",
      temperatureCelsius: 46,
      withinSafeRange: false,
      outcome: "minor_issue",
      correctiveAction: true,
    },
    // Shower checks
    {
      id: "tc-012",
      sourceType: "shower",
      location: "Main Bathroom",
      checkDate: "2026-01-20",
      checkedBy: "Sarah Johnson",
      temperatureCelsius: 42,
      withinSafeRange: true,
      outcome: "pass",
      correctiveAction: false,
    },
    {
      id: "tc-013",
      sourceType: "shower",
      location: "En-suite Bathroom",
      checkDate: "2026-03-20",
      checkedBy: "Lisa Williams",
      temperatureCelsius: 43,
      withinSafeRange: true,
      outcome: "pass",
      correctiveAction: false,
    },
    // Storage tank
    {
      id: "tc-014",
      sourceType: "storage_tank",
      location: "Loft",
      checkDate: "2026-01-10",
      checkedBy: "Tom Richards",
      temperatureCelsius: 62,
      withinSafeRange: true,
      outcome: "pass",
      correctiveAction: false,
    },
    {
      id: "tc-015",
      sourceType: "storage_tank",
      location: "Loft",
      checkDate: "2026-04-10",
      checkedBy: "Darren Laville",
      temperatureCelsius: 61,
      withinSafeRange: true,
      outcome: "pass",
      correctiveAction: false,
    },
    // Calorifier
    {
      id: "tc-016",
      sourceType: "calorifier",
      location: "Plant Room",
      checkDate: "2026-02-10",
      checkedBy: "Tom Richards",
      temperatureCelsius: 63,
      withinSafeRange: true,
      outcome: "pass",
      correctiveAction: false,
    },
  ];

  const assessments: LegionellaAssessment[] = [
    {
      id: "la-001",
      assessmentDate: "2026-01-10",
      assessedBy: "Water Hygiene Services Ltd",
      riskLevel: "low",
      flushingScheduleInPlace: true,
      waterTreatmentActive: true,
      deadLegsIdentified: true,
      deadLegsRemoved: true,
      nextAssessmentDue: "2027-01-10",
    },
    {
      id: "la-002",
      assessmentDate: "2026-04-15",
      assessedBy: "Water Hygiene Services Ltd",
      riskLevel: "low",
      flushingScheduleInPlace: true,
      waterTreatmentActive: true,
      deadLegsIdentified: false,
      deadLegsRemoved: false,
      nextAssessmentDue: "2027-04-15",
    },
  ];

  const policies: WaterSafetyPolicy[] = [
    {
      id: "wsp-001",
      policyReviewDate: "2026-01-05",
      policyCurrent: true,
      temperatureMonitoringSchedule: true,
      legionellaManagementPlan: true,
      scaldingPreventionMeasures: true,
      bathSupervisionProtocol: true,
      emergencyProcedures: true,
      recordKeepingSystem: true,
    },
  ];

  const training: StaffWaterSafetyTraining[] = [
    {
      id: "wst-001",
      staffId: "staff-001",
      staffName: "Sarah Johnson",
      legionellaAwareness: true,
      temperatureMonitoring: true,
      scaldingPrevention: true,
      bathSupervision: true,
      emergencyResponse: true,
      recordKeeping: true,
    },
    {
      id: "wst-002",
      staffId: "staff-002",
      staffName: "Tom Richards",
      legionellaAwareness: true,
      temperatureMonitoring: true,
      scaldingPrevention: true,
      bathSupervision: true,
      emergencyResponse: true,
      recordKeeping: true,
    },
    {
      id: "wst-003",
      staffId: "staff-003",
      staffName: "Lisa Williams",
      legionellaAwareness: true,
      temperatureMonitoring: true,
      scaldingPrevention: true,
      bathSupervision: true,
      emergencyResponse: false,
      recordKeeping: true,
    },
    {
      id: "wst-004",
      staffId: "staff-004",
      staffName: "Darren Laville",
      legionellaAwareness: true,
      temperatureMonitoring: true,
      scaldingPrevention: true,
      bathSupervision: true,
      emergencyResponse: true,
      recordKeeping: true,
    },
  ];

  return { checks, assessments, policies, training };
}

// -- GET -----------------------------------------------------------------------

export async function GET() {
  const { checks, assessments, policies, training } = generateDemoData();

  const result = generateWaterSafetyLegionellaIntelligence(
    checks,
    assessments,
    policies,
    training,
    "oak-house",
    "2026-01-01",
    "2026-05-19",
    "2026-05-19"
  );

  return NextResponse.json({ data: result });
}

// -- POST ----------------------------------------------------------------------

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    checks,
    assessments,
    policies,
    training,
    homeId,
    periodStart,
    periodEnd,
    referenceDate,
  } = body as {
    checks?: TemperatureCheck[];
    assessments?: LegionellaAssessment[];
    policies?: WaterSafetyPolicy[];
    training?: StaffWaterSafetyTraining[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
    referenceDate?: string;
  };

  if (!periodStart || !periodEnd) {
    return NextResponse.json(
      { error: "periodStart and periodEnd are required" },
      { status: 400 }
    );
  }

  const result = generateWaterSafetyLegionellaIntelligence(
    checks ?? [],
    assessments ?? [],
    policies ?? [],
    training ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
    referenceDate ?? new Date().toISOString()
  );

  return NextResponse.json({ data: result });
}
