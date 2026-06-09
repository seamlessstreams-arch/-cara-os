// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Property Damage Assessment Intelligence API Route
//
// GET  → returns Chamberlain House demo property damage assessment intelligence
// POST → accepts custom data for any home
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { generatePropertyDamageAssessmentIntelligence } from "@/lib/property-damage-assessment/property-damage-assessment-engine";
import type {
  DamageIncident,
  PropertyInspection,
  RepairRecord,
  DamagePreventionMeasure,
} from "@/lib/property-damage-assessment/property-damage-assessment-engine";

// ── Chamberlain House Demo Data ─────────────────────────────────────────────────────

function getDemoData() {
  const incidents: DamageIncident[] = [
    // Jordan — frustrated expression, broke chair
    {
      id: "dmg-j1",
      date: "2025-03-12",
      damageType: "furniture",
      severity: "moderate",
      context: "frustration_expression",
      location: "Living Room",
      childInvolved: true,
      childId: "child-jordan",
      childName: "Jordan",
      description: "Jordan threw a dining chair during a frustration episode after a difficult phone call with family. Chair leg snapped.",
      estimatedCost: 120,
      costBand: "50_to_200",
      repairStatus: "completed",
      repairCompletedDate: "2025-03-18",
      insuranceClaimed: false,
      therapeuticResponseProvided: true,
    },
    // Accidental — kitchen tile crack
    {
      id: "dmg-a1",
      date: "2025-04-05",
      damageType: "fixtures",
      severity: "minor",
      context: "accidental",
      location: "Kitchen",
      childInvolved: false,
      childId: null,
      childName: null,
      description: "Kitchen floor tile cracked when heavy pan was dropped during cooking activity. Normal wear and tear accelerated by impact.",
      estimatedCost: 80,
      costBand: "50_to_200",
      repairStatus: "completed",
      repairCompletedDate: "2025-04-12",
      insuranceClaimed: false,
      therapeuticResponseProvided: false,
    },
    // Alex — peer conflict, broke window
    {
      id: "dmg-ax1",
      date: "2025-05-01",
      damageType: "structural",
      severity: "significant",
      context: "peer_conflict",
      location: "Hallway",
      childInvolved: true,
      childId: "child-alex",
      childName: "Alex",
      description: "Alex punched hallway window during an argument with another young person. Window cracked but did not shatter (safety glass). Minor cut to hand treated by first aider.",
      estimatedCost: 350,
      costBand: "200_to_500",
      repairStatus: "completed",
      repairCompletedDate: "2025-05-05",
      insuranceClaimed: true,
      therapeuticResponseProvided: true,
    },
  ];

  const inspections: PropertyInspection[] = [
    {
      id: "insp-1",
      inspectionDate: "2025-02-15",
      inspector: "Darren Laville",
      areasChecked: 12,
      issuesFound: 3,
      issuesResolved: 3,
      maintenanceScheduleFollowed: true,
      overallCondition: "good",
    },
    {
      id: "insp-2",
      inspectionDate: "2025-05-10",
      inspector: "Darren Laville",
      areasChecked: 12,
      issuesFound: 2,
      issuesResolved: 1,
      maintenanceScheduleFollowed: true,
      overallCondition: "good",
    },
  ];

  const repairs: RepairRecord[] = [
    {
      id: "rep-1",
      damageIncidentId: "dmg-j1",
      repairDate: "2025-03-18",
      repairedBy: "Tom Richards",
      costActual: 95,
      timeliness: "within_week",
      qualityRating: "good",
      safetyRestored: true,
    },
    {
      id: "rep-2",
      damageIncidentId: "dmg-a1",
      repairDate: "2025-04-12",
      repairedBy: "External Contractor",
      costActual: 75,
      timeliness: "within_week",
      qualityRating: "excellent",
      safetyRestored: true,
    },
    {
      id: "rep-3",
      damageIncidentId: "dmg-ax1",
      repairDate: "2025-05-05",
      repairedBy: "External Contractor",
      costActual: 320,
      timeliness: "within_week",
      qualityRating: "good",
      safetyRestored: true,
    },
  ];

  const preventionMeasures: DamagePreventionMeasure[] = [
    {
      id: "prev-1",
      measureType: "sensory_provision",
      implementedDate: "2025-01-20",
      targetChildId: "child-jordan",
      effectiveness: "effective",
      reviewDate: "2025-04-20",
      active: true,
    },
    {
      id: "prev-2",
      measureType: "de_escalation_training",
      implementedDate: "2025-02-10",
      targetChildId: "child-alex",
      effectiveness: "partially_effective",
      reviewDate: "2025-05-10",
      active: true,
    },
  ];

  return { incidents, inspections, repairs, preventionMeasures };
}

// ── GET Handler ─────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const { incidents, inspections, repairs, preventionMeasures } = getDemoData();
    const result = generatePropertyDamageAssessmentIntelligence(
      incidents, inspections, repairs, preventionMeasures,
      "oak-house", "2025-01-01", "2025-06-30",
      new Date().toISOString().split("T")[0],
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate property damage assessment intelligence", details: String(error) },
      { status: 500 },
    );
  }
}

// ── POST Handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      incidents, inspections, repairs, preventionMeasures,
      homeId, periodStart, periodEnd, referenceDate,
    } = body;

    if (!homeId || !periodStart || !periodEnd || !referenceDate) {
      return NextResponse.json(
        { error: "Missing required fields: homeId, periodStart, periodEnd, referenceDate" },
        { status: 400 },
      );
    }

    if (
      !Array.isArray(incidents) || !Array.isArray(inspections) ||
      !Array.isArray(repairs) || !Array.isArray(preventionMeasures)
    ) {
      return NextResponse.json(
        { error: "incidents, inspections, repairs, and preventionMeasures must be arrays" },
        { status: 400 },
      );
    }

    const result = generatePropertyDamageAssessmentIntelligence(
      incidents, inspections, repairs, preventionMeasures,
      homeId, periodStart, periodEnd, referenceDate,
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process property damage assessment data", details: String(error) },
      { status: 500 },
    );
  }
}
