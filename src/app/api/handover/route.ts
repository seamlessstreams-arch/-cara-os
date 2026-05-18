// ==============================================================================
// Cornerstone -- Handover Intelligence API Route
//
// GET  -> returns Oak House demo intelligence
// POST -> accepts custom data for any home
// ==============================================================================

import { NextResponse } from "next/server";
import { generateHandoverIntelligence } from "@/lib/handover/handover-engine";
import type {
  HandoverRecord,
  HandoverExpectation,
  HandoverItem,
} from "@/lib/handover/handover-engine";

// -- Oak House Demo Data ------------------------------------------------------

function makeItem(
  id: string,
  priority: "critical" | "important" | "routine",
  category: HandoverItem["category"],
  summary: string,
  opts: {
    childId?: string;
    childName?: string;
    acknowledged?: boolean;
    followUpRequired?: boolean;
    followUpCompletedAt?: string;
  } = {},
): HandoverItem {
  return {
    id,
    childId: opts.childId,
    childName: opts.childName,
    priority,
    category,
    summary,
    acknowledged: opts.acknowledged ?? true,
    followUpRequired: opts.followUpRequired ?? false,
    followUpCompletedAt: opts.followUpCompletedAt,
  };
}

function getDemoData(): {
  records: HandoverRecord[];
  expectations: HandoverExpectation[];
} {
  const records: HandoverRecord[] = [];
  const expectations: HandoverExpectation[] = [];
  let idCounter = 1;

  for (let day = 1; day <= 20; day++) {
    const date = `2025-01-${String(day).padStart(2, "0")}`;

    // Expectations: morning->afternoon and afternoon->evening each day
    expectations.push({ date, outgoingShift: "morning", incomingShift: "afternoon" });
    expectations.push({ date, outgoingShift: "afternoon", incomingShift: "evening" });
    if (day <= 18) {
      expectations.push({ date, outgoingShift: "evening", incomingShift: "waking_night" });
    }

    // Morning -> Afternoon
    if (day === 5 || day === 12) {
      // 2 missed
      records.push({
        id: `ho-${idCounter++}`,
        homeId: "oak-house",
        date,
        outgoingShift: "morning",
        incomingShift: "afternoon",
        outgoingStaffIds: ["staff-sarah", "staff-tom"],
        incomingStaffIds: ["staff-lisa"],
        status: "missed",
        childUpdatesIncluded: false,
        riskUpdatesIncluded: false,
        medicationUpdatesIncluded: false,
        incidentsBriefed: false,
        emotionalPresentationNoted: false,
        planChangesHighlighted: false,
        criticalItems: [],
        importantItems: [],
        routineItems: [],
      });
    } else if (day === 7) {
      // 1 partial
      records.push({
        id: `ho-${idCounter++}`,
        homeId: "oak-house",
        date,
        outgoingShift: "morning",
        incomingShift: "afternoon",
        outgoingStaffIds: ["staff-tom"],
        incomingStaffIds: ["staff-lisa", "staff-darren"],
        status: "partial",
        startedAt: `${date}T14:00:00Z`,
        durationMinutes: 5,
        childUpdatesIncluded: true,
        riskUpdatesIncluded: false,
        medicationUpdatesIncluded: false,
        incidentsBriefed: false,
        emotionalPresentationNoted: false,
        planChangesHighlighted: false,
        criticalItems: [],
        importantItems: [],
        routineItems: [],
      });
    } else if (day === 10) {
      // 1 late
      records.push({
        id: `ho-${idCounter++}`,
        homeId: "oak-house",
        date,
        outgoingShift: "morning",
        incomingShift: "afternoon",
        outgoingStaffIds: ["staff-sarah", "staff-tom"],
        incomingStaffIds: ["staff-lisa", "staff-darren"],
        status: "late",
        startedAt: `${date}T15:30:00Z`,
        completedAt: `${date}T15:50:00Z`,
        durationMinutes: 20,
        childUpdatesIncluded: true,
        riskUpdatesIncluded: true,
        medicationUpdatesIncluded: true,
        incidentsBriefed: true,
        emotionalPresentationNoted: true,
        planChangesHighlighted: true,
        criticalItems: [],
        importantItems: [],
        routineItems: [],
      });
    } else {
      // Completed
      const criticalItems: HandoverItem[] = [];
      if (day === 3 || day === 15) {
        criticalItems.push(
          makeItem(`item-${idCounter++}`, "critical", "risk", "Alex - increased self-harm risk observed", {
            childId: "child-alex",
            childName: "Alex",
            acknowledged: day !== 15,
            followUpRequired: true,
            followUpCompletedAt: day === 3 ? "2025-01-03T16:00:00Z" : undefined,
          }),
        );
      }

      records.push({
        id: `ho-${idCounter++}`,
        homeId: "oak-house",
        date,
        outgoingShift: "morning",
        incomingShift: "afternoon",
        outgoingStaffIds: ["staff-sarah", "staff-tom"],
        incomingStaffIds: ["staff-lisa", "staff-darren"],
        status: "completed",
        startedAt: `${date}T14:00:00Z`,
        completedAt: `${date}T14:20:00Z`,
        durationMinutes: 20,
        childUpdatesIncluded: true,
        riskUpdatesIncluded: day % 4 !== 0,
        medicationUpdatesIncluded: true,
        incidentsBriefed: day % 5 !== 0,
        emotionalPresentationNoted: day % 3 !== 0,
        planChangesHighlighted: true,
        criticalItems,
        importantItems: day % 6 === 0
          ? [makeItem(`item-${idCounter++}`, "important", "medication", "Morgan medication change", {
              childId: "child-morgan",
              childName: "Morgan",
              acknowledged: true,
            })]
          : [],
        routineItems: [
          makeItem(`item-${idCounter++}`, "routine", "general", "All children settled"),
        ],
      });
    }

    // Afternoon -> Evening (all completed)
    records.push({
      id: `ho-${idCounter++}`,
      homeId: "oak-house",
      date,
      outgoingShift: "afternoon",
      incomingShift: "evening",
      outgoingStaffIds: ["staff-lisa", "staff-darren"],
      incomingStaffIds: ["staff-tom", "staff-sarah"],
      status: "completed",
      startedAt: `${date}T18:00:00Z`,
      completedAt: `${date}T18:15:00Z`,
      durationMinutes: 15,
      childUpdatesIncluded: true,
      riskUpdatesIncluded: true,
      medicationUpdatesIncluded: true,
      incidentsBriefed: true,
      emotionalPresentationNoted: true,
      planChangesHighlighted: day % 7 !== 0,
      criticalItems: [],
      importantItems: [],
      routineItems: [
        makeItem(`item-${idCounter++}`, "routine", "general", "Afternoon session completed"),
      ],
    });

    // Evening -> Waking Night (days 1-18)
    if (day <= 18) {
      records.push({
        id: `ho-${idCounter++}`,
        homeId: "oak-house",
        date,
        outgoingShift: "evening",
        incomingShift: "waking_night",
        outgoingStaffIds: ["staff-tom", "staff-sarah"],
        incomingStaffIds: ["staff-lisa"],
        status: "completed",
        startedAt: `${date}T22:00:00Z`,
        completedAt: `${date}T22:15:00Z`,
        durationMinutes: 15,
        childUpdatesIncluded: true,
        riskUpdatesIncluded: true,
        medicationUpdatesIncluded: true,
        incidentsBriefed: true,
        emotionalPresentationNoted: day % 4 !== 0,
        planChangesHighlighted: true,
        criticalItems: [],
        importantItems: [],
        routineItems: [
          makeItem(`item-${idCounter++}`, "routine", "general", "Children settled for the night"),
        ],
      });
    }
  }

  return { records, expectations };
}

// -- GET Handler --------------------------------------------------------------

export async function GET() {
  try {
    const { records, expectations } = getDemoData();
    const result = generateHandoverIntelligence(
      records,
      expectations,
      "oak-house",
      "2025-01-01",
      "2025-01-20",
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate handover intelligence", details: String(error) },
      { status: 500 },
    );
  }
}

// -- POST Handler -------------------------------------------------------------

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { records, expectations, homeId, periodStart, periodEnd } = body;

    if (!records || !expectations || !homeId || !periodStart || !periodEnd) {
      return NextResponse.json(
        { error: "Missing required fields: records, expectations, homeId, periodStart, periodEnd" },
        { status: 400 },
      );
    }

    if (!Array.isArray(records) || !Array.isArray(expectations)) {
      return NextResponse.json(
        { error: "records and expectations must be arrays" },
        { status: 400 },
      );
    }

    const result = generateHandoverIntelligence(
      records,
      expectations,
      homeId,
      periodStart,
      periodEnd,
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process handover data", details: String(error) },
      { status: 500 },
    );
  }
}
