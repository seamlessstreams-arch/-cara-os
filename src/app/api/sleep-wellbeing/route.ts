// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Sleep & Wellbeing Monitoring Intelligence API Route
//
// GET  → returns Oak House demo intelligence (~15 records)
// POST → accepts custom data for any home
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { generateSleepWellbeingIntelligence } from "@/lib/sleep-wellbeing/sleep-wellbeing-engine";
import type { NightRecord, SleepPlan } from "@/lib/sleep-wellbeing/sleep-wellbeing-engine";

// ── Oak House Demo Data (simplified ~15 records) ────────────────────────────

function getDemoData(): {
  records: NightRecord[];
  sleepPlans: SleepPlan[];
} {
  const records: NightRecord[] = [
    // Alex — 5 nights (good sleeper, one anxiety episode)
    {
      id: "demo-alex-01", homeId: "oak-house", date: "2025-01-01",
      childId: "child-alex", childName: "Alex",
      bedtime: "21:30", settledTime: "21:45", wakeTime: "07:00",
      sleepQuality: "good", disturbances: [],
      staffOnNight: "Night Staff A",
      wellbeingAtBedtime: "settled", wellbeingOnWaking: "settled",
      bedtimeRoutineFollowed: true, nightCheckCompleted: true,
    },
    {
      id: "demo-alex-02", homeId: "oak-house", date: "2025-01-02",
      childId: "child-alex", childName: "Alex",
      bedtime: "21:30", settledTime: "21:50", wakeTime: "07:15",
      sleepQuality: "good", disturbances: [],
      staffOnNight: "Night Staff B",
      wellbeingAtBedtime: "settled", wellbeingOnWaking: "settled",
      bedtimeRoutineFollowed: true, nightCheckCompleted: true,
    },
    {
      id: "demo-alex-03", homeId: "oak-house", date: "2025-01-03",
      childId: "child-alex", childName: "Alex",
      bedtime: "21:30", settledTime: "22:15", wakeTime: "06:45",
      sleepQuality: "fair",
      disturbances: [{
        time: "21:45", type: "anxiety", durationMinutes: 25,
        supportProvided: ["reassurance", "warm_drink"],
        childSettledAfter: true,
        staffResponse: "Anxious about school. Warm drink and reassurance given.",
      }],
      staffOnNight: "Night Staff A",
      wellbeingAtBedtime: "unsettled", wellbeingOnWaking: "settled",
      bedtimeRoutineFollowed: true, nightCheckCompleted: true,
    },
    {
      id: "demo-alex-04", homeId: "oak-house", date: "2025-01-04",
      childId: "child-alex", childName: "Alex",
      bedtime: "21:30", settledTime: "21:40", wakeTime: "07:30",
      sleepQuality: "good", disturbances: [],
      staffOnNight: "Night Staff B",
      wellbeingAtBedtime: "settled", wellbeingOnWaking: "settled",
      bedtimeRoutineFollowed: true, nightCheckCompleted: true,
    },
    {
      id: "demo-alex-05", homeId: "oak-house", date: "2025-01-05",
      childId: "child-alex", childName: "Alex",
      bedtime: "21:30", settledTime: "21:45", wakeTime: "07:00",
      sleepQuality: "good", disturbances: [],
      staffOnNight: "Night Staff A",
      wellbeingAtBedtime: "settled", wellbeingOnWaking: "settled",
      bedtimeRoutineFollowed: true, nightCheckCompleted: true,
    },

    // Jordan — 5 nights (fair sleeper, phone use issue)
    {
      id: "demo-jordan-01", homeId: "oak-house", date: "2025-01-01",
      childId: "child-jordan", childName: "Jordan",
      bedtime: "21:00", settledTime: "21:15", wakeTime: "07:15",
      sleepQuality: "good", disturbances: [],
      staffOnNight: "Night Staff A",
      wellbeingAtBedtime: "settled", wellbeingOnWaking: "settled",
      bedtimeRoutineFollowed: true, nightCheckCompleted: true,
    },
    {
      id: "demo-jordan-02", homeId: "oak-house", date: "2025-01-02",
      childId: "child-jordan", childName: "Jordan",
      bedtime: "21:00", settledTime: "22:00", wakeTime: "07:00",
      sleepQuality: "poor",
      disturbances: [{
        time: "21:20", type: "phone_use", durationMinutes: 40,
        supportProvided: ["reassurance"],
        childSettledAfter: true,
        staffResponse: "Phone found under pillow. Collected. Spoke about sleep hygiene.",
      }],
      staffOnNight: "Night Staff B",
      wellbeingAtBedtime: "unsettled", wellbeingOnWaking: "settled",
      bedtimeRoutineFollowed: true, nightCheckCompleted: true,
    },
    {
      id: "demo-jordan-03", homeId: "oak-house", date: "2025-01-03",
      childId: "child-jordan", childName: "Jordan",
      bedtime: "21:00", settledTime: "21:20", wakeTime: "07:00",
      sleepQuality: "fair", disturbances: [],
      staffOnNight: "Night Staff A",
      wellbeingAtBedtime: "settled", wellbeingOnWaking: "settled",
      bedtimeRoutineFollowed: true, nightCheckCompleted: true,
    },
    {
      id: "demo-jordan-04", homeId: "oak-house", date: "2025-01-04",
      childId: "child-jordan", childName: "Jordan",
      bedtime: "21:00", settledTime: "21:10", wakeTime: "07:30",
      sleepQuality: "good", disturbances: [],
      staffOnNight: "Night Staff B",
      wellbeingAtBedtime: "settled", wellbeingOnWaking: "settled",
      bedtimeRoutineFollowed: true, nightCheckCompleted: true,
    },
    {
      id: "demo-jordan-05", homeId: "oak-house", date: "2025-01-05",
      childId: "child-jordan", childName: "Jordan",
      bedtime: "21:00", settledTime: "21:15", wakeTime: "07:00",
      sleepQuality: "good", disturbances: [],
      staffOnNight: "Night Staff A",
      wellbeingAtBedtime: "settled", wellbeingOnWaking: "settled",
      bedtimeRoutineFollowed: true, nightCheckCompleted: true,
    },

    // Morgan — 5 nights (poor sleeper, nightmares)
    {
      id: "demo-morgan-01", homeId: "oak-house", date: "2025-01-01",
      childId: "child-morgan", childName: "Morgan",
      bedtime: "22:00", settledTime: "22:20", wakeTime: "06:30",
      sleepQuality: "poor",
      disturbances: [{
        time: "02:00", type: "nightmare", durationMinutes: 35,
        supportProvided: ["therapeutic_technique", "stayed_with_child"],
        childSettledAfter: true,
        staffResponse: "Nightmare about past events. Grounding technique used. Stayed until calm.",
      }],
      staffOnNight: "Night Staff A",
      wellbeingAtBedtime: "unsettled", wellbeingOnWaking: "regulated_with_support",
      bedtimeRoutineFollowed: true, nightCheckCompleted: true,
    },
    {
      id: "demo-morgan-02", homeId: "oak-house", date: "2025-01-02",
      childId: "child-morgan", childName: "Morgan",
      bedtime: "22:00", settledTime: "22:15", wakeTime: "07:30",
      sleepQuality: "good", disturbances: [],
      staffOnNight: "Night Staff B",
      wellbeingAtBedtime: "settled", wellbeingOnWaking: "settled",
      bedtimeRoutineFollowed: true, nightCheckCompleted: true,
    },
    {
      id: "demo-morgan-03", homeId: "oak-house", date: "2025-01-03",
      childId: "child-morgan", childName: "Morgan",
      bedtime: "22:00", settledTime: "22:30", wakeTime: "07:00",
      sleepQuality: "fair",
      disturbances: [],
      staffOnNight: "Night Staff A",
      wellbeingAtBedtime: "settled", wellbeingOnWaking: "settled",
      bedtimeRoutineFollowed: true, nightCheckCompleted: true,
    },
    {
      id: "demo-morgan-04", homeId: "oak-house", date: "2025-01-04",
      childId: "child-morgan", childName: "Morgan",
      bedtime: "22:00", settledTime: "22:45", wakeTime: "05:30",
      sleepQuality: "very_poor",
      disturbances: [
        {
          time: "01:00", type: "nightmare", durationMinutes: 40,
          supportProvided: ["therapeutic_technique", "stayed_with_child", "sensory_support"],
          childSettledAfter: true,
          staffResponse: "Severe nightmare. Full therapeutic response. Stayed with Morgan.",
        },
        {
          time: "04:00", type: "night_terror", durationMinutes: 15,
          supportProvided: ["stayed_with_child"],
          childSettledAfter: false,
          staffResponse: "Night terror. Ensured safety. Did not fully wake.",
        },
      ],
      staffOnNight: "Night Staff B",
      wellbeingAtBedtime: "distressed", wellbeingOnWaking: "unsettled",
      bedtimeRoutineFollowed: false, nightCheckCompleted: true,
    },
    {
      id: "demo-morgan-05", homeId: "oak-house", date: "2025-01-05",
      childId: "child-morgan", childName: "Morgan",
      bedtime: "22:00", settledTime: "22:15", wakeTime: "07:15",
      sleepQuality: "fair", disturbances: [],
      staffOnNight: "Night Staff A",
      wellbeingAtBedtime: "settled", wellbeingOnWaking: "settled",
      bedtimeRoutineFollowed: true, nightCheckCompleted: true,
    },
  ];

  const sleepPlans: SleepPlan[] = [
    {
      childId: "child-alex", childName: "Alex",
      targetBedtime: "21:30", targetWakeTime: "07:00",
      knownSleepIssues: ["anxiety-related insomnia"],
      strategies: ["Consistent bedtime routine", "Warm drink before bed", "Breathing exercises"],
      lastReviewedDate: "2025-01-10", reviewDueDate: "2025-04-10",
    },
    {
      childId: "child-jordan", childName: "Jordan",
      targetBedtime: "21:00", targetWakeTime: "07:00",
      knownSleepIssues: ["phone use at night"],
      strategies: ["Phone collected at 20:30", "Quiet wind-down activities"],
      lastReviewedDate: "2025-01-05", reviewDueDate: "2025-04-05",
    },
    {
      childId: "child-morgan", childName: "Morgan",
      targetBedtime: "22:00", targetWakeTime: "07:00",
      knownSleepIssues: ["nightmares linked to past trauma", "night terrors"],
      strategies: ["Therapeutic bedtime routine", "Sensory toolkit", "Grounding exercises"],
      lastReviewedDate: "2025-01-15", reviewDueDate: "2025-02-15",
    },
  ];

  return { records, sleepPlans };
}

// ── GET Handler ──────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const { records, sleepPlans } = getDemoData();
    const result = generateSleepWellbeingIntelligence(
      records,
      sleepPlans,
      "oak-house",
      "2025-01-01",
      "2025-01-31",
      new Date().toISOString().split("T")[0],
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate sleep wellbeing intelligence", details: String(error) },
      { status: 500 },
    );
  }
}

// ── POST Handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { records, sleepPlans, homeId, periodStart, periodEnd, referenceDate } = body;

    if (!records || !sleepPlans || !homeId || !periodStart || !periodEnd || !referenceDate) {
      return NextResponse.json(
        { error: "Missing required fields: records, sleepPlans, homeId, periodStart, periodEnd, referenceDate" },
        { status: 400 },
      );
    }

    if (!Array.isArray(records) || !Array.isArray(sleepPlans)) {
      return NextResponse.json(
        { error: "records and sleepPlans must be arrays" },
        { status: 400 },
      );
    }

    const result = generateSleepWellbeingIntelligence(
      records, sleepPlans,
      homeId, periodStart, periodEnd, referenceDate,
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process sleep wellbeing data", details: String(error) },
      { status: 500 },
    );
  }
}
