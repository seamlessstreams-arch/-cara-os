// ==============================================================================
// Cornerstone -- Night Care Intelligence API Route
//
// GET  -> returns Oak House demo night care intelligence
// POST -> accepts custom data for any home
// ==============================================================================

import { NextResponse } from "next/server";
import { generateNightCareIntelligence } from "@/lib/night-care/night-care-engine";
import type {
  NightCheck,
  NightIncident,
  NightStaffing,
  SleepEnvironment,
} from "@/lib/night-care/night-care-engine";

// -- Oak House Demo Data -----------------------------------------------------

function getDemoData() {
  const checks: NightCheck[] = [
    // Night 1 -- Alex checks (4 checks)
    {
      id: "nc-a1-1", childId: "child-alex", childName: "Alex",
      date: "2025-03-10", time: "22:00", checkType: "visual_check",
      outcome: "child_awake_settled", staffId: "staff-lisa",
      notes: "Alex reading in bed, settled and relaxed.", doorOpenCheck: true, temperatureChecked: true,
    },
    {
      id: "nc-a1-2", childId: "child-alex", childName: "Alex",
      date: "2025-03-10", time: "23:30", checkType: "listening_check",
      outcome: "child_sleeping", staffId: "staff-lisa",
      notes: "Quiet, no movement heard.", doorOpenCheck: true, temperatureChecked: false,
    },
    {
      id: "nc-a1-3", childId: "child-alex", childName: "Alex",
      date: "2025-03-10", time: "02:00", checkType: "visual_check",
      outcome: "child_sleeping", staffId: "staff-lisa",
      notes: "Sleeping soundly.", doorOpenCheck: true, temperatureChecked: true,
    },
    {
      id: "nc-a1-4", childId: "child-alex", childName: "Alex",
      date: "2025-03-10", time: "05:00", checkType: "welfare_check",
      outcome: "child_sleeping", staffId: "staff-lisa",
      notes: "Sleeping, room temperature comfortable.", doorOpenCheck: true, temperatureChecked: true,
    },
    // Night 1 -- Jordan checks (5 checks, including post-disturbance follow-up)
    {
      id: "nc-j1-1", childId: "child-jordan", childName: "Jordan",
      date: "2025-03-10", time: "21:30", checkType: "visual_check",
      outcome: "child_awake_settled", staffId: "staff-lisa",
      notes: "Jordan listening to music quietly before sleep.", doorOpenCheck: true, temperatureChecked: true,
    },
    {
      id: "nc-j1-2", childId: "child-jordan", childName: "Jordan",
      date: "2025-03-10", time: "23:00", checkType: "listening_check",
      outcome: "child_sleeping", staffId: "staff-lisa",
      notes: "Settled and sleeping.", doorOpenCheck: true, temperatureChecked: false,
    },
    {
      id: "nc-j1-3", childId: "child-jordan", childName: "Jordan",
      date: "2025-03-10", time: "01:30", checkType: "visual_check",
      outcome: "child_awake_unsettled", staffId: "staff-lisa",
      notes: "Jordan awake and unsettled after a bad dream. Offered reassurance and warm drink.",
      doorOpenCheck: true, temperatureChecked: false,
    },
    {
      id: "nc-j1-4", childId: "child-jordan", childName: "Jordan",
      date: "2025-03-10", time: "02:30", checkType: "welfare_check",
      outcome: "child_sleeping", staffId: "staff-lisa",
      notes: "Settled back to sleep after support. Monitoring closely.", doorOpenCheck: true, temperatureChecked: true,
    },
    {
      id: "nc-j1-5", childId: "child-jordan", childName: "Jordan",
      date: "2025-03-10", time: "05:00", checkType: "visual_check",
      outcome: "child_sleeping", staffId: "staff-lisa",
      notes: "Sleeping peacefully.", doorOpenCheck: true, temperatureChecked: false,
    },
    // Night 1 -- Morgan checks (4 checks)
    {
      id: "nc-m1-1", childId: "child-morgan", childName: "Morgan",
      date: "2025-03-10", time: "22:00", checkType: "visual_check",
      outcome: "child_sleeping", staffId: "staff-lisa",
      notes: "Morgan already asleep, early night.", doorOpenCheck: true, temperatureChecked: true,
    },
    {
      id: "nc-m1-2", childId: "child-morgan", childName: "Morgan",
      date: "2025-03-10", time: "00:00", checkType: "listening_check",
      outcome: "child_sleeping", staffId: "staff-lisa",
      notes: "No sounds, sleeping well.", doorOpenCheck: true, temperatureChecked: false,
    },
    {
      id: "nc-m1-3", childId: "child-morgan", childName: "Morgan",
      date: "2025-03-10", time: "03:00", checkType: "welfare_check",
      outcome: "child_sleeping", staffId: "staff-lisa",
      notes: "Sleeping, blanket adjusted.", doorOpenCheck: true, temperatureChecked: true,
    },
    {
      id: "nc-m1-4", childId: "child-morgan", childName: "Morgan",
      date: "2025-03-10", time: "05:30", checkType: "security_check",
      outcome: "child_sleeping", staffId: "staff-lisa",
      notes: "All secure, Morgan sleeping.", doorOpenCheck: true, temperatureChecked: false,
    },
  ];

  const incidents: NightIncident[] = [
    // Jordan -- minor sleep disturbance
    {
      id: "ni-j1", childId: "child-jordan",
      date: "2025-03-10", time: "01:30",
      incidentType: "sleep_disturbance", severity: "low",
      managedEffectively: true, supportProvided: true,
      managerNotified: false, recordedTimely: true,
      deEscalationUsed: true,
    },
  ];

  const staffing: NightStaffing[] = [
    {
      id: "ns-1", date: "2025-03-10",
      plannedStaff: 2, actualStaff: 2,
      staffingLevel: "adequate",
      wakingNightStaff: 1, sleepingInStaff: 1,
      agencyStaffUsed: false,
      handoverCompleted: true, handoverQuality: "thorough",
    },
    {
      id: "ns-2", date: "2025-03-11",
      plannedStaff: 2, actualStaff: 2,
      staffingLevel: "adequate",
      wakingNightStaff: 1, sleepingInStaff: 1,
      agencyStaffUsed: false,
      handoverCompleted: true, handoverQuality: "adequate",
    },
    {
      id: "ns-3", date: "2025-03-12",
      plannedStaff: 2, actualStaff: 2,
      staffingLevel: "adequate",
      wakingNightStaff: 1, sleepingInStaff: 1,
      agencyStaffUsed: false,
      handoverCompleted: true, handoverQuality: "thorough",
    },
  ];

  const environments: SleepEnvironment[] = [
    {
      id: "se-alex", childId: "child-alex",
      roomTemperatureAppropriate: true, beddingClean: true,
      noiseLevel: "quiet", lightingAppropriate: true,
      personalBelongingsAccessible: true, safetyChecked: true,
    },
    {
      id: "se-jordan", childId: "child-jordan",
      roomTemperatureAppropriate: true, beddingClean: true,
      noiseLevel: "quiet", lightingAppropriate: true,
      personalBelongingsAccessible: true, safetyChecked: true,
    },
    {
      id: "se-morgan", childId: "child-morgan",
      roomTemperatureAppropriate: true, beddingClean: true,
      noiseLevel: "acceptable", lightingAppropriate: true,
      personalBelongingsAccessible: true, safetyChecked: true,
    },
  ];

  return { checks, incidents, staffing, environments };
}

// -- GET Handler -------------------------------------------------------------

export async function GET() {
  try {
    const { checks, incidents, staffing, environments } = getDemoData();
    const result = generateNightCareIntelligence(
      checks, incidents, staffing, environments,
      3, // totalChildren
      "oak-house", "2025-03-01", "2025-03-31",
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate night care intelligence", details: String(error) },
      { status: 500 },
    );
  }
}

// -- POST Handler ------------------------------------------------------------

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { checks, incidents, staffing, environments, totalChildren, homeId, periodStart, periodEnd } = body;

    if (!homeId || !periodStart || !periodEnd || totalChildren === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: homeId, periodStart, periodEnd, totalChildren" },
        { status: 400 },
      );
    }

    if (
      !Array.isArray(checks) ||
      !Array.isArray(incidents) ||
      !Array.isArray(staffing) ||
      !Array.isArray(environments)
    ) {
      return NextResponse.json(
        { error: "checks, incidents, staffing, and environments must be arrays" },
        { status: 400 },
      );
    }

    const result = generateNightCareIntelligence(
      checks, incidents, staffing, environments,
      totalChildren, homeId, periodStart, periodEnd,
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process night care data", details: String(error) },
      { status: 500 },
    );
  }
}
