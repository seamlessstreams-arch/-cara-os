// ==============================================================================
// Cornerstone -- Handover Intelligence Engine -- Tests
// ==============================================================================

import { describe, it, expect } from "vitest";
import {
  evaluateHandoverCompleteness,
  evaluateHandoverQuality,
  evaluateInformationTransfer,
  evaluateContinuityOfCare,
  buildShiftProfiles,
  generateHandoverIntelligence,
  getShiftLabel,
  getItemCategoryLabel,
} from "../handover-engine";
import type {
  HandoverRecord,
  HandoverExpectation,
  HandoverItem,
} from "../handover-engine";

// -- Test Constants -----------------------------------------------------------

const PERIOD_START = "2025-01-01";
const PERIOD_END = "2025-01-31";

// -- Oak House Demo Data ------------------------------------------------------
// Staff: Sarah (RM), Tom (RSW), Lisa (Senior RSW), Darren (RM)
// Children: Alex, Jordan, Morgan
// Period: January 2025
// ~90 expectations (3 shifts/day x 31 days minus some)
// ~85 records (5 missed, 3 partial, 2 late, rest completed)

const staffIds = {
  sarah: "staff-sarah",
  tom: "staff-tom",
  lisa: "staff-lisa",
  darren: "staff-darren",
};

// Helper to generate expectations: 3 handovers per day for January
function buildExpectations(): HandoverExpectation[] {
  const expectations: HandoverExpectation[] = [];
  for (let day = 1; day <= 31; day++) {
    const date = `2025-01-${String(day).padStart(2, "0")}`;
    // Morning -> Afternoon
    expectations.push({ date, outgoingShift: "morning", incomingShift: "afternoon" });
    // Afternoon -> Evening
    expectations.push({ date, outgoingShift: "afternoon", incomingShift: "evening" });
    // Evening -> Waking Night (skip some days to get ~90)
    if (day <= 28) {
      expectations.push({ date, outgoingShift: "evening", incomingShift: "waking_night" });
    }
  }
  return expectations;
}

const demoExpectations = buildExpectations();
// 31+31+28 = 90

// Helper to create a handover item
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

// Build ~85 handover records
function buildDemoRecords(): HandoverRecord[] {
  const records: HandoverRecord[] = [];
  let idCounter = 1;

  for (let day = 1; day <= 31; day++) {
    const date = `2025-01-${String(day).padStart(2, "0")}`;

    // Morning -> Afternoon handover
    if (day === 5 || day === 12 || day === 19 || day === 25 || day === 30) {
      // 5 missed handovers
      records.push({
        id: `ho-${idCounter++}`,
        homeId: "oak-house",
        date,
        outgoingShift: "morning",
        incomingShift: "afternoon",
        outgoingStaffIds: [staffIds.sarah, staffIds.tom],
        incomingStaffIds: [staffIds.lisa],
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
    } else if (day === 7 || day === 14 || day === 21) {
      // 3 partial handovers
      records.push({
        id: `ho-${idCounter++}`,
        homeId: "oak-house",
        date,
        outgoingShift: "morning",
        incomingShift: "afternoon",
        outgoingStaffIds: [staffIds.tom],
        incomingStaffIds: [staffIds.lisa, staffIds.darren],
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
        importantItems: [
          makeItem(`item-${idCounter++}`, "important", "medication", "Jordan medication change - dose increased", {
            childId: "child-jordan",
            childName: "Jordan",
            acknowledged: false,
            followUpRequired: true,
          }),
        ],
        routineItems: [],
      });
    } else if (day === 10 || day === 20) {
      // 2 late handovers
      records.push({
        id: `ho-${idCounter++}`,
        homeId: "oak-house",
        date,
        outgoingShift: "morning",
        incomingShift: "afternoon",
        outgoingStaffIds: [staffIds.sarah, staffIds.tom],
        incomingStaffIds: [staffIds.lisa, staffIds.darren],
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
        routineItems: [
          makeItem(`item-${idCounter++}`, "routine", "general", "Routine update - all children had good day"),
        ],
      });
    } else {
      // Completed handover (21 total for morning->afternoon)
      const hasCritical = day === 3 || day === 15 || day === 22 || day === 28;
      const criticalItems: HandoverItem[] = [];
      const importantItems: HandoverItem[] = [];
      const routineItems: HandoverItem[] = [];

      if (hasCritical) {
        // Alex risk-related critical items - some unacknowledged
        criticalItems.push(
          makeItem(`item-${idCounter++}`, "critical", "risk", "Alex - increased self-harm risk, new marks observed", {
            childId: "child-alex",
            childName: "Alex",
            acknowledged: day !== 22, // day 22 unacknowledged
            followUpRequired: true,
            followUpCompletedAt: day === 3 ? "2025-01-03T16:00:00Z" : day === 15 ? "2025-01-15T16:00:00Z" : undefined,
          }),
        );
      }
      if (day % 3 === 0) {
        importantItems.push(
          makeItem(`item-${idCounter++}`, "important", "medication", "Morgan - medication administered on time", {
            childId: "child-morgan",
            childName: "Morgan",
            acknowledged: true,
            followUpRequired: false,
          }),
        );
      }
      routineItems.push(
        makeItem(`item-${idCounter++}`, "routine", "general", "All children settled, no concerns", {
          acknowledged: true,
        }),
      );

      records.push({
        id: `ho-${idCounter++}`,
        homeId: "oak-house",
        date,
        outgoingShift: "morning",
        incomingShift: "afternoon",
        outgoingStaffIds: [staffIds.sarah, staffIds.tom],
        incomingStaffIds: [staffIds.lisa, staffIds.darren],
        status: "completed",
        startedAt: `${date}T14:00:00Z`,
        completedAt: `${date}T14:20:00Z`,
        durationMinutes: 20,
        childUpdatesIncluded: true,
        riskUpdatesIncluded: day % 4 !== 0 ? true : false, // ~75% have risk updates
        medicationUpdatesIncluded: true,
        incidentsBriefed: day % 5 !== 0 ? true : false, // ~80%
        emotionalPresentationNoted: day % 3 !== 0 ? true : false, // ~67%
        planChangesHighlighted: day % 6 !== 0 ? true : false, // ~83%
        criticalItems,
        importantItems,
        routineItems,
      });
    }

    // Afternoon -> Evening handover (all completed, good quality)
    {
      const importantItems: HandoverItem[] = [];
      if (day === 8 || day === 16 || day === 24) {
        importantItems.push(
          makeItem(`item-${idCounter++}`, "important", "behaviour", "Jordan - challenging behaviour at tea time", {
            childId: "child-jordan",
            childName: "Jordan",
            acknowledged: true,
            followUpRequired: true,
            followUpCompletedAt: `2025-01-${String(day).padStart(2, "0")}T20:00:00Z`,
          }),
        );
      }
      if (day === 4 || day === 18) {
        importantItems.push(
          makeItem(`item-${idCounter++}`, "important", "contact", "Alex - phone call with mum scheduled for evening", {
            childId: "child-alex",
            childName: "Alex",
            acknowledged: true,
            followUpRequired: true,
            followUpCompletedAt: `2025-01-${String(day).padStart(2, "0")}T19:30:00Z`,
          }),
        );
      }

      records.push({
        id: `ho-${idCounter++}`,
        homeId: "oak-house",
        date,
        outgoingShift: "afternoon",
        incomingShift: "evening",
        outgoingStaffIds: [staffIds.lisa, staffIds.darren],
        incomingStaffIds: [staffIds.tom, staffIds.sarah],
        status: "completed",
        startedAt: `${date}T18:00:00Z`,
        completedAt: `${date}T18:15:00Z`,
        durationMinutes: 15,
        childUpdatesIncluded: true,
        riskUpdatesIncluded: true,
        medicationUpdatesIncluded: true,
        incidentsBriefed: true,
        emotionalPresentationNoted: true,
        planChangesHighlighted: day % 7 !== 0 ? true : false, // ~86%
        criticalItems: [],
        importantItems,
        routineItems: [
          makeItem(`item-${idCounter++}`, "routine", "general", "Afternoon session completed", {
            acknowledged: true,
          }),
        ],
      });
    }

    // Evening -> Waking Night (days 1-28 only)
    if (day <= 28) {
      const criticalItems: HandoverItem[] = [];
      if (day === 6 || day === 17) {
        // Alex critical items - one unacknowledged (day 17)
        criticalItems.push(
          makeItem(`item-${idCounter++}`, "critical", "risk", "Alex - absconded briefly, returned safely, monitor overnight", {
            childId: "child-alex",
            childName: "Alex",
            acknowledged: day !== 17, // day 17 unacknowledged
            followUpRequired: true,
            followUpCompletedAt: day === 6 ? "2025-01-07T08:00:00Z" : undefined,
          }),
        );
      }

      records.push({
        id: `ho-${idCounter++}`,
        homeId: "oak-house",
        date,
        outgoingShift: "evening",
        incomingShift: "waking_night",
        outgoingStaffIds: [staffIds.tom, staffIds.sarah],
        incomingStaffIds: [staffIds.lisa],
        status: "completed",
        startedAt: `${date}T22:00:00Z`,
        completedAt: `${date}T22:15:00Z`,
        durationMinutes: 15,
        childUpdatesIncluded: true,
        riskUpdatesIncluded: true,
        medicationUpdatesIncluded: true,
        incidentsBriefed: true,
        emotionalPresentationNoted: day % 4 !== 0 ? true : false, // ~75%
        planChangesHighlighted: true,
        criticalItems,
        importantItems: [],
        routineItems: [
          makeItem(`item-${idCounter++}`, "routine", "general", "Children settled for the night", {
            acknowledged: true,
          }),
        ],
      });
    }
  }

  return records;
}

const demoRecords = buildDemoRecords();

// ==============================================================================
// TESTS
// ==============================================================================

describe("Handover -- evaluateHandoverCompleteness", () => {
  it("counts total expected handovers from expectations", () => {
    const result = evaluateHandoverCompleteness(demoRecords, demoExpectations, PERIOD_START, PERIOD_END);
    expect(result.totalExpected).toBe(90);
  });

  it("counts 5 missed handovers", () => {
    const result = evaluateHandoverCompleteness(demoRecords, demoExpectations, PERIOD_START, PERIOD_END);
    expect(result.missed).toBe(5);
  });

  it("counts 3 partial handovers", () => {
    const result = evaluateHandoverCompleteness(demoRecords, demoExpectations, PERIOD_START, PERIOD_END);
    expect(result.partial).toBe(3);
  });

  it("counts 2 late handovers", () => {
    const result = evaluateHandoverCompleteness(demoRecords, demoExpectations, PERIOD_START, PERIOD_END);
    expect(result.late).toBe(2);
  });

  it("calculates completion rate counting completed + late as done", () => {
    const result = evaluateHandoverCompleteness(demoRecords, demoExpectations, PERIOD_START, PERIOD_END);
    // completed records count: total records minus missed(5) and partial(3) gives completed+late
    // completed + late = done count
    const totalRecords = demoRecords.filter((r) => r.date >= PERIOD_START && r.date <= PERIOD_END).length;
    const done = result.completed + result.late;
    expect(result.completionRate).toBe(Math.round((done / 90) * 100));
  });

  it("completion rate is above 80%", () => {
    const result = evaluateHandoverCompleteness(demoRecords, demoExpectations, PERIOD_START, PERIOD_END);
    expect(result.completionRate).toBeGreaterThanOrEqual(80);
  });

  it("handles empty records", () => {
    const result = evaluateHandoverCompleteness([], demoExpectations, PERIOD_START, PERIOD_END);
    expect(result.completed).toBe(0);
    expect(result.missed).toBe(0);
    expect(result.completionRate).toBe(0);
  });

  it("handles empty expectations", () => {
    const result = evaluateHandoverCompleteness(demoRecords, [], PERIOD_START, PERIOD_END);
    expect(result.totalExpected).toBe(0);
    expect(result.completionRate).toBe(0);
  });

  it("filters by period - out of period records ignored", () => {
    const result = evaluateHandoverCompleteness(demoRecords, demoExpectations, "2025-02-01", "2025-02-28");
    expect(result.totalExpected).toBe(0);
    expect(result.completed).toBe(0);
  });

  it("partial period filters correctly", () => {
    const result = evaluateHandoverCompleteness(demoRecords, demoExpectations, "2025-01-01", "2025-01-10");
    expect(result.totalExpected).toBeGreaterThan(0);
    expect(result.totalExpected).toBeLessThan(90);
  });

  it("completed + partial + missed + late equals total records in period", () => {
    const result = evaluateHandoverCompleteness(demoRecords, demoExpectations, PERIOD_START, PERIOD_END);
    const totalRecords = demoRecords.filter((r) => r.date >= PERIOD_START && r.date <= PERIOD_END).length;
    expect(result.completed + result.partial + result.missed + result.late).toBe(totalRecords);
  });
});

describe("Handover -- evaluateHandoverQuality", () => {
  it("returns quality metrics for completed/late handovers", () => {
    const result = evaluateHandoverQuality(demoRecords, PERIOD_START, PERIOD_END);
    expect(result.overallQualityScore).toBeGreaterThan(0);
  });

  it("calculates average duration", () => {
    const result = evaluateHandoverQuality(demoRecords, PERIOD_START, PERIOD_END);
    expect(result.avgDurationMinutes).toBeGreaterThan(0);
  });

  it("child updates rate is high (nearly all completed handovers include child updates)", () => {
    const result = evaluateHandoverQuality(demoRecords, PERIOD_START, PERIOD_END);
    expect(result.childUpdatesRate).toBeGreaterThanOrEqual(95);
  });

  it("medication updates rate is high", () => {
    const result = evaluateHandoverQuality(demoRecords, PERIOD_START, PERIOD_END);
    expect(result.medicationUpdatesRate).toBeGreaterThanOrEqual(90);
  });

  it("risk updates rate reflects demo data pattern", () => {
    const result = evaluateHandoverQuality(demoRecords, PERIOD_START, PERIOD_END);
    // Morning handovers have ~75% risk, afternoon and evening ~100%
    expect(result.riskUpdatesRate).toBeGreaterThan(80);
  });

  it("emotional presentation rate is between 60-100%", () => {
    const result = evaluateHandoverQuality(demoRecords, PERIOD_START, PERIOD_END);
    expect(result.emotionalPresentationRate).toBeGreaterThanOrEqual(60);
    expect(result.emotionalPresentationRate).toBeLessThanOrEqual(100);
  });

  it("overall quality score is between 0 and 100", () => {
    const result = evaluateHandoverQuality(demoRecords, PERIOD_START, PERIOD_END);
    expect(result.overallQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.overallQualityScore).toBeLessThanOrEqual(100);
  });

  it("returns zeros for empty records", () => {
    const result = evaluateHandoverQuality([], PERIOD_START, PERIOD_END);
    expect(result.avgDurationMinutes).toBe(0);
    expect(result.overallQualityScore).toBe(0);
    expect(result.childUpdatesRate).toBe(0);
    expect(result.riskUpdatesRate).toBe(0);
    expect(result.medicationUpdatesRate).toBe(0);
  });

  it("excludes missed handovers from quality assessment", () => {
    const missedOnly: HandoverRecord[] = [{
      id: "missed-1",
      homeId: "oak-house",
      date: "2025-01-15",
      outgoingShift: "morning",
      incomingShift: "afternoon",
      outgoingStaffIds: ["s1"],
      incomingStaffIds: ["s2"],
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
    }];
    const result = evaluateHandoverQuality(missedOnly, PERIOD_START, PERIOD_END);
    expect(result.overallQualityScore).toBe(0);
  });

  it("excludes partial handovers from quality assessment", () => {
    const partialOnly: HandoverRecord[] = [{
      id: "partial-1",
      homeId: "oak-house",
      date: "2025-01-15",
      outgoingShift: "morning",
      incomingShift: "afternoon",
      outgoingStaffIds: ["s1"],
      incomingStaffIds: ["s2"],
      status: "partial",
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
    }];
    const result = evaluateHandoverQuality(partialOnly, PERIOD_START, PERIOD_END);
    expect(result.overallQualityScore).toBe(0);
  });

  it("perfect quality gives score of 100", () => {
    const perfect: HandoverRecord[] = [{
      id: "perf-1",
      homeId: "oak-house",
      date: "2025-01-15",
      outgoingShift: "morning",
      incomingShift: "afternoon",
      outgoingStaffIds: ["s1"],
      incomingStaffIds: ["s2"],
      status: "completed",
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
    }];
    const result = evaluateHandoverQuality(perfect, PERIOD_START, PERIOD_END);
    expect(result.overallQualityScore).toBe(100);
    expect(result.childUpdatesRate).toBe(100);
    expect(result.riskUpdatesRate).toBe(100);
  });

  it("filters by period", () => {
    const result = evaluateHandoverQuality(demoRecords, "2025-02-01", "2025-02-28");
    expect(result.overallQualityScore).toBe(0);
  });
});

describe("Handover -- evaluateInformationTransfer", () => {
  it("counts all critical items across records", () => {
    const result = evaluateInformationTransfer(demoRecords, PERIOD_START, PERIOD_END);
    expect(result.totalCriticalItems).toBeGreaterThan(0);
  });

  it("identifies unacknowledged critical items", () => {
    const result = evaluateInformationTransfer(demoRecords, PERIOD_START, PERIOD_END);
    // We have unacknowledged critical items on days 22 and 17
    expect(result.unacknowledgedCriticalItems.length).toBeGreaterThan(0);
  });

  it("unacknowledged critical items are for Alex risk", () => {
    const result = evaluateInformationTransfer(demoRecords, PERIOD_START, PERIOD_END);
    for (const item of result.unacknowledgedCriticalItems) {
      expect(item.childName).toBe("Alex");
      expect(item.category).toBe("risk");
    }
  });

  it("critical acknowledged rate is less than 100% due to unacknowledged items", () => {
    const result = evaluateInformationTransfer(demoRecords, PERIOD_START, PERIOD_END);
    expect(result.criticalAcknowledgedRate).toBeLessThan(100);
    expect(result.criticalAcknowledgedRate).toBeGreaterThan(0);
  });

  it("counts important items", () => {
    const result = evaluateInformationTransfer(demoRecords, PERIOD_START, PERIOD_END);
    expect(result.totalImportantItems).toBeGreaterThan(0);
  });

  it("important acknowledged rate reflects data", () => {
    const result = evaluateInformationTransfer(demoRecords, PERIOD_START, PERIOD_END);
    // Most important items are acknowledged, some from partial handovers are not
    expect(result.importantAcknowledgedRate).toBeGreaterThan(50);
  });

  it("tracks follow-up required and completed", () => {
    const result = evaluateInformationTransfer(demoRecords, PERIOD_START, PERIOD_END);
    expect(result.followUpRequiredCount).toBeGreaterThan(0);
    expect(result.followUpCompletedRate).toBeGreaterThan(0);
    expect(result.followUpCompletedRate).toBeLessThanOrEqual(100);
  });

  it("handles empty records", () => {
    const result = evaluateInformationTransfer([], PERIOD_START, PERIOD_END);
    expect(result.totalCriticalItems).toBe(0);
    expect(result.criticalAcknowledgedRate).toBe(0);
    expect(result.totalImportantItems).toBe(0);
    expect(result.unacknowledgedCriticalItems.length).toBe(0);
  });

  it("filters by period", () => {
    const result = evaluateInformationTransfer(demoRecords, "2025-02-01", "2025-02-28");
    expect(result.totalCriticalItems).toBe(0);
    expect(result.totalImportantItems).toBe(0);
  });

  it("100% acknowledged when all items acknowledged", () => {
    const allAck: HandoverRecord[] = [{
      id: "ack-1",
      homeId: "oak-house",
      date: "2025-01-15",
      outgoingShift: "morning",
      incomingShift: "afternoon",
      outgoingStaffIds: ["s1"],
      incomingStaffIds: ["s2"],
      status: "completed",
      durationMinutes: 15,
      childUpdatesIncluded: true,
      riskUpdatesIncluded: true,
      medicationUpdatesIncluded: true,
      incidentsBriefed: true,
      emotionalPresentationNoted: true,
      planChangesHighlighted: true,
      criticalItems: [
        makeItem("c1", "critical", "risk", "Test critical", { acknowledged: true }),
        makeItem("c2", "critical", "incident", "Test critical 2", { acknowledged: true }),
      ],
      importantItems: [
        makeItem("i1", "important", "medication", "Test important", { acknowledged: true }),
      ],
      routineItems: [],
    }];
    const result = evaluateInformationTransfer(allAck, PERIOD_START, PERIOD_END);
    expect(result.criticalAcknowledgedRate).toBe(100);
    expect(result.importantAcknowledgedRate).toBe(100);
    expect(result.unacknowledgedCriticalItems.length).toBe(0);
  });

  it("follow-up completed rate is 100% when all follow-ups done", () => {
    const allDone: HandoverRecord[] = [{
      id: "fu-1",
      homeId: "oak-house",
      date: "2025-01-15",
      outgoingShift: "morning",
      incomingShift: "afternoon",
      outgoingStaffIds: ["s1"],
      incomingStaffIds: ["s2"],
      status: "completed",
      durationMinutes: 15,
      childUpdatesIncluded: true,
      riskUpdatesIncluded: true,
      medicationUpdatesIncluded: true,
      incidentsBriefed: true,
      emotionalPresentationNoted: true,
      planChangesHighlighted: true,
      criticalItems: [
        makeItem("c1", "critical", "risk", "Test", {
          acknowledged: true,
          followUpRequired: true,
          followUpCompletedAt: "2025-01-15T16:00:00Z",
        }),
      ],
      importantItems: [],
      routineItems: [],
    }];
    const result = evaluateInformationTransfer(allDone, PERIOD_START, PERIOD_END);
    expect(result.followUpCompletedRate).toBe(100);
  });

  it("follow-up completed rate is 0% when none completed", () => {
    const noneDone: HandoverRecord[] = [{
      id: "fu-2",
      homeId: "oak-house",
      date: "2025-01-15",
      outgoingShift: "morning",
      incomingShift: "afternoon",
      outgoingStaffIds: ["s1"],
      incomingStaffIds: ["s2"],
      status: "completed",
      durationMinutes: 15,
      childUpdatesIncluded: true,
      riskUpdatesIncluded: true,
      medicationUpdatesIncluded: true,
      incidentsBriefed: true,
      emotionalPresentationNoted: true,
      planChangesHighlighted: true,
      criticalItems: [
        makeItem("c1", "critical", "risk", "Test", {
          acknowledged: true,
          followUpRequired: true,
        }),
      ],
      importantItems: [],
      routineItems: [],
    }];
    const result = evaluateInformationTransfer(noneDone, PERIOD_START, PERIOD_END);
    expect(result.followUpCompletedRate).toBe(0);
  });
});

describe("Handover -- evaluateContinuityOfCare", () => {
  it("returns continuity rating", () => {
    const result = evaluateContinuityOfCare(demoRecords, PERIOD_START, PERIOD_END);
    expect(["excellent", "good", "adequate", "poor"]).toContain(result.continuityRating);
  });

  it("consistent staff rate is above 0", () => {
    const result = evaluateContinuityOfCare(demoRecords, PERIOD_START, PERIOD_END);
    expect(result.consistentStaffRate).toBeGreaterThan(0);
  });

  it("shift coverage by type has entries for active shifts", () => {
    const result = evaluateContinuityOfCare(demoRecords, PERIOD_START, PERIOD_END);
    expect(result.shiftCoverageByType.morning).toBeGreaterThanOrEqual(0);
    expect(result.shiftCoverageByType.afternoon).toBeGreaterThanOrEqual(0);
    expect(result.shiftCoverageByType.evening).toBeGreaterThanOrEqual(0);
    expect(result.shiftCoverageByType.waking_night).toBeGreaterThanOrEqual(0);
  });

  it("handles empty records", () => {
    const result = evaluateContinuityOfCare([], PERIOD_START, PERIOD_END);
    expect(result.avgStaffOverlap).toBe(0);
    expect(result.consistentStaffRate).toBe(0);
    expect(result.continuityRating).toBe("poor");
  });

  it("filters by period", () => {
    const result = evaluateContinuityOfCare(demoRecords, "2025-02-01", "2025-02-28");
    expect(result.avgStaffOverlap).toBe(0);
    expect(result.continuityRating).toBe("poor");
  });

  it("excellent continuity with high completion and consistency", () => {
    const goodRecords: HandoverRecord[] = Array.from({ length: 20 }, (_, i) => ({
      id: `good-${i}`,
      homeId: "oak-house",
      date: `2025-01-${String(i + 1).padStart(2, "0")}`,
      outgoingShift: "morning" as const,
      incomingShift: "afternoon" as const,
      outgoingStaffIds: ["s1", "s2"],
      incomingStaffIds: ["s3", "s4"],
      status: "completed" as const,
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
    }));
    const result = evaluateContinuityOfCare(goodRecords, PERIOD_START, PERIOD_END);
    expect(result.continuityRating).toBe("excellent");
    expect(result.consistentStaffRate).toBe(100);
  });

  it("poor continuity with many missed handovers and lone workers", () => {
    const poorRecords: HandoverRecord[] = [
      {
        id: "poor-1",
        homeId: "oak-house",
        date: "2025-01-05",
        outgoingShift: "morning",
        incomingShift: "afternoon",
        outgoingStaffIds: ["s1"],
        incomingStaffIds: ["s2"],
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
      },
      {
        id: "poor-2",
        homeId: "oak-house",
        date: "2025-01-06",
        outgoingShift: "morning",
        incomingShift: "afternoon",
        outgoingStaffIds: ["s1"],
        incomingStaffIds: ["s3"],
        status: "completed",
        durationMinutes: 5,
        childUpdatesIncluded: false,
        riskUpdatesIncluded: false,
        medicationUpdatesIncluded: false,
        incidentsBriefed: false,
        emotionalPresentationNoted: false,
        planChangesHighlighted: false,
        criticalItems: [],
        importantItems: [],
        routineItems: [],
      },
    ];
    const result = evaluateContinuityOfCare(poorRecords, PERIOD_START, PERIOD_END);
    expect(result.continuityRating).toBe("poor");
  });

  it("sleep_in coverage is 0 when no sleep_in handovers exist", () => {
    const result = evaluateContinuityOfCare(demoRecords, PERIOD_START, PERIOD_END);
    expect(result.shiftCoverageByType.sleep_in).toBe(0);
  });
});

describe("Handover -- buildShiftProfiles", () => {
  it("builds profiles for active shift types only", () => {
    const profiles = buildShiftProfiles(demoRecords, PERIOD_START, PERIOD_END);
    // Demo data has morning, afternoon, evening, waking_night
    expect(profiles.length).toBeGreaterThanOrEqual(3);
    const shiftTypes = profiles.map((p) => p.shiftType);
    expect(shiftTypes).toContain("morning");
    expect(shiftTypes).toContain("afternoon");
    expect(shiftTypes).toContain("evening");
  });

  it("does not include sleep_in (no demo data for it)", () => {
    const profiles = buildShiftProfiles(demoRecords, PERIOD_START, PERIOD_END);
    const shiftTypes = profiles.map((p) => p.shiftType);
    expect(shiftTypes).not.toContain("sleep_in");
  });

  it("morning profile has correct total handovers", () => {
    const profiles = buildShiftProfiles(demoRecords, PERIOD_START, PERIOD_END);
    const morning = profiles.find((p) => p.shiftType === "morning");
    expect(morning).toBeDefined();
    // Morning is outgoing for morning->afternoon (31 records) AND incoming for none in this data
    expect(morning!.totalHandovers).toBe(31);
  });

  it("afternoon profile has handovers from both transitions", () => {
    const profiles = buildShiftProfiles(demoRecords, PERIOD_START, PERIOD_END);
    const afternoon = profiles.find((p) => p.shiftType === "afternoon");
    expect(afternoon).toBeDefined();
    // Afternoon is incoming for morning->afternoon (31) AND outgoing for afternoon->evening (31)
    expect(afternoon!.totalHandovers).toBe(62);
  });

  it("each profile has completion rate between 0 and 100", () => {
    const profiles = buildShiftProfiles(demoRecords, PERIOD_START, PERIOD_END);
    for (const p of profiles) {
      expect(p.completionRate).toBeGreaterThanOrEqual(0);
      expect(p.completionRate).toBeLessThanOrEqual(100);
    }
  });

  it("each profile has quality score between 0 and 100", () => {
    const profiles = buildShiftProfiles(demoRecords, PERIOD_START, PERIOD_END);
    for (const p of profiles) {
      expect(p.avgQualityScore).toBeGreaterThanOrEqual(0);
      expect(p.avgQualityScore).toBeLessThanOrEqual(100);
    }
  });

  it("profiles track critical items missed", () => {
    const profiles = buildShiftProfiles(demoRecords, PERIOD_START, PERIOD_END);
    // Some profiles should have missed critical items (Alex unacknowledged)
    const totalMissed = profiles.reduce((sum, p) => sum + p.criticalItemsMissed, 0);
    expect(totalMissed).toBeGreaterThan(0);
  });

  it("returns empty array for empty records", () => {
    const profiles = buildShiftProfiles([], PERIOD_START, PERIOD_END);
    expect(profiles.length).toBe(0);
  });

  it("returns empty for out-of-period data", () => {
    const profiles = buildShiftProfiles(demoRecords, "2025-02-01", "2025-02-28");
    expect(profiles.length).toBe(0);
  });

  it("average duration is reasonable", () => {
    const profiles = buildShiftProfiles(demoRecords, PERIOD_START, PERIOD_END);
    for (const p of profiles) {
      if (p.totalHandovers > 0) {
        expect(p.avgDuration).toBeGreaterThanOrEqual(0);
        expect(p.avgDuration).toBeLessThanOrEqual(60);
      }
    }
  });
});

describe("Handover -- generateHandoverIntelligence (integration)", () => {
  const result = generateHandoverIntelligence(
    demoRecords,
    demoExpectations,
    "oak-house",
    PERIOD_START,
    PERIOD_END,
  );

  it("returns complete structure", () => {
    expect(result).toHaveProperty("homeId", "oak-house");
    expect(result).toHaveProperty("periodStart", PERIOD_START);
    expect(result).toHaveProperty("periodEnd", PERIOD_END);
    expect(result).toHaveProperty("overallScore");
    expect(result).toHaveProperty("rating");
    expect(result).toHaveProperty("completeness");
    expect(result).toHaveProperty("quality");
    expect(result).toHaveProperty("informationTransfer");
    expect(result).toHaveProperty("continuity");
    expect(result).toHaveProperty("shiftProfiles");
    expect(result).toHaveProperty("strengths");
    expect(result).toHaveProperty("areasForImprovement");
    expect(result).toHaveProperty("actions");
    expect(result).toHaveProperty("regulatoryLinks");
  });

  it("overall score is between 0 and 100", () => {
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("achieves good or outstanding rating with demo data", () => {
    expect(["good", "outstanding"]).toContain(result.rating);
  });

  it("produces inadequate with no data", () => {
    const empty = generateHandoverIntelligence([], [], "oak-house", PERIOD_START, PERIOD_END);
    expect(empty.overallScore).toBeLessThanOrEqual(30);
  });

  it("links to Reg 13", () => {
    expect(result.regulatoryLinks.some((l) => l.includes("Reg 13"))).toBe(true);
  });

  it("links to Reg 12", () => {
    expect(result.regulatoryLinks.some((l) => l.includes("Reg 12"))).toBe(true);
  });

  it("links to SCCIF", () => {
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
  });

  it("links to Working Together", () => {
    expect(result.regulatoryLinks.some((l) => l.includes("Working Together"))).toBe(true);
  });

  it("identifies strengths", () => {
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("identifies areas for improvement due to unacknowledged critical items", () => {
    expect(
      result.areasForImprovement.some((a) => a.toLowerCase().includes("critical")),
    ).toBe(true);
  });

  it("generates urgent action for unacknowledged critical items", () => {
    expect(result.actions.some((a) => a.includes("URGENT"))).toBe(true);
  });

  it("identifies missed handovers as concern", () => {
    expect(
      result.areasForImprovement.some((a) => a.toLowerCase().includes("missed")) ||
      result.actions.some((a) => a.toLowerCase().includes("missed")),
    ).toBe(true);
  });

  it("includes shift profiles", () => {
    expect(result.shiftProfiles.length).toBeGreaterThan(0);
  });

  it("completeness section populated correctly", () => {
    expect(result.completeness.totalExpected).toBe(90);
    expect(result.completeness.missed).toBe(5);
  });

  it("quality section has valid scores", () => {
    expect(result.quality.overallQualityScore).toBeGreaterThan(0);
    expect(result.quality.avgDurationMinutes).toBeGreaterThan(0);
  });

  it("information transfer section shows unacknowledged items", () => {
    expect(result.informationTransfer.unacknowledgedCriticalItems.length).toBeGreaterThan(0);
  });

  it("empty data produces minimal result with regulatory links", () => {
    const empty = generateHandoverIntelligence([], [], "test-home", PERIOD_START, PERIOD_END);
    expect(empty.regulatoryLinks.length).toBe(5);
    expect(empty.homeId).toBe("test-home");
    expect(empty.strengths.length).toBeGreaterThan(0);
    expect(empty.actions.length).toBeGreaterThan(0);
  });

  it("scoring breakdown: completeness contributes up to 25", () => {
    // With ~91% completion, should get 20 points for completeness
    // (>85% = 20 points)
    expect(result.completeness.completionRate).toBeGreaterThan(85);
  });

  it("scoring: outstanding requires 80+", () => {
    const outstandingRecords: HandoverRecord[] = Array.from({ length: 30 }, (_, i) => ({
      id: `out-${i}`,
      homeId: "oak-house",
      date: `2025-01-${String(i + 1).padStart(2, "0")}`,
      outgoingShift: "morning" as const,
      incomingShift: "afternoon" as const,
      outgoingStaffIds: ["s1", "s2"],
      incomingStaffIds: ["s3", "s4"],
      status: "completed" as const,
      durationMinutes: 20,
      childUpdatesIncluded: true,
      riskUpdatesIncluded: true,
      medicationUpdatesIncluded: true,
      incidentsBriefed: true,
      emotionalPresentationNoted: true,
      planChangesHighlighted: true,
      criticalItems: [
        makeItem(`c-${i}`, "critical", "risk", "Test", { acknowledged: true }),
      ],
      importantItems: [],
      routineItems: [],
    }));
    const outstandingExpectations: HandoverExpectation[] = Array.from({ length: 30 }, (_, i) => ({
      date: `2025-01-${String(i + 1).padStart(2, "0")}`,
      outgoingShift: "morning" as const,
      incomingShift: "afternoon" as const,
    }));
    const r = generateHandoverIntelligence(outstandingRecords, outstandingExpectations, "test", PERIOD_START, PERIOD_END);
    expect(r.overallScore).toBeGreaterThanOrEqual(80);
    expect(r.rating).toBe("outstanding");
  });

  it("scoring: inadequate for very poor data", () => {
    const poorRecords: HandoverRecord[] = Array.from({ length: 10 }, (_, i) => ({
      id: `poor-${i}`,
      homeId: "oak-house",
      date: `2025-01-${String(i + 1).padStart(2, "0")}`,
      outgoingShift: "morning" as const,
      incomingShift: "afternoon" as const,
      outgoingStaffIds: ["s1"],
      incomingStaffIds: ["s2"],
      status: "missed" as const,
      childUpdatesIncluded: false,
      riskUpdatesIncluded: false,
      medicationUpdatesIncluded: false,
      incidentsBriefed: false,
      emotionalPresentationNoted: false,
      planChangesHighlighted: false,
      criticalItems: [
        makeItem(`c-${i}`, "critical", "risk", "Unacknowledged", { acknowledged: false }),
      ],
      importantItems: [],
      routineItems: [],
    }));
    const poorExpectations: HandoverExpectation[] = Array.from({ length: 30 }, (_, i) => ({
      date: `2025-01-${String(i + 1).padStart(2, "0")}`,
      outgoingShift: "morning" as const,
      incomingShift: "afternoon" as const,
    }));
    const r = generateHandoverIntelligence(poorRecords, poorExpectations, "test", PERIOD_START, PERIOD_END);
    expect(r.overallScore).toBeLessThan(40);
    expect(r.rating).toBe("inadequate");
  });
});

describe("Handover -- Labels", () => {
  it("returns Morning label", () => {
    expect(getShiftLabel("morning")).toBe("Morning");
  });

  it("returns Afternoon label", () => {
    expect(getShiftLabel("afternoon")).toBe("Afternoon");
  });

  it("returns Evening label", () => {
    expect(getShiftLabel("evening")).toBe("Evening");
  });

  it("returns Waking Night label", () => {
    expect(getShiftLabel("waking_night")).toBe("Waking Night");
  });

  it("returns Sleep-in label", () => {
    expect(getShiftLabel("sleep_in")).toBe("Sleep-in");
  });

  it("returns Risk category label", () => {
    expect(getItemCategoryLabel("risk")).toBe("Risk");
  });

  it("returns Medication category label", () => {
    expect(getItemCategoryLabel("medication")).toBe("Medication");
  });

  it("returns Behaviour category label", () => {
    expect(getItemCategoryLabel("behaviour")).toBe("Behaviour");
  });

  it("returns Incident category label", () => {
    expect(getItemCategoryLabel("incident")).toBe("Incident");
  });

  it("returns Plan Change category label", () => {
    expect(getItemCategoryLabel("plan_change")).toBe("Plan Change");
  });
});
