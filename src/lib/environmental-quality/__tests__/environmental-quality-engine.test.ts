// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Environmental Quality Intelligence Engine — Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateInspectionQuality,
  evaluateMaintenanceResponsiveness,
  evaluatePersonalisation,
  evaluateChildSatisfaction,
  generateEnvironmentalQualityIntelligence,
  getRoomTypeLabel,
  getInspectionAreaLabel,
  getMaintenanceStatusLabel,
  getMaintenancePriorityLabel,
} from "../environmental-quality-engine";
import type {
  EnvironmentalInspection,
  MaintenanceRequest,
  PersonalisationRecord,
  ChildEnvironmentView,
  RoomType,
  InspectionArea,
  MaintenanceStatus,
  MaintenancePriority,
} from "../environmental-quality-engine";

// ── Test Constants ───────────────────────────────────────────────────────────

const PERIOD_START = "2026-01-01";
const PERIOD_END = "2026-01-31";
const REFERENCE_DATE = "2026-02-01";
const HOME_ID = "oak-house";

// ── Chamberlain House Demo Data ──────────────────────────────────────────────────────
// Alex (14), Jordan (13), Morgan (15)

const DEMO_INSPECTIONS: EnvironmentalInspection[] = [
  { id: "insp-01", homeId: HOME_ID, date: "2026-01-05", inspectedBy: "Darren Laville", area: "cleanliness", roomType: "kitchen", score: 8, issues: [], photographic: true },
  { id: "insp-02", homeId: HOME_ID, date: "2026-01-05", inspectedBy: "Darren Laville", area: "safety", roomType: "kitchen", score: 9, issues: [], photographic: true },
  { id: "insp-03", homeId: HOME_ID, date: "2026-01-05", inspectedBy: "Darren Laville", area: "maintenance", roomType: "kitchen", score: 7, issues: ["Extractor fan rattling"], photographic: true },
  { id: "insp-04", homeId: HOME_ID, date: "2026-01-06", inspectedBy: "Sarah Johnson", area: "cleanliness", roomType: "bedroom", score: 9, issues: [], photographic: true },
  { id: "insp-05", homeId: HOME_ID, date: "2026-01-06", inspectedBy: "Sarah Johnson", area: "personalisation", roomType: "bedroom", score: 9, issues: [], photographic: true },
  { id: "insp-06", homeId: HOME_ID, date: "2026-01-06", inspectedBy: "Sarah Johnson", area: "furniture_condition", roomType: "bedroom", score: 8, issues: [], photographic: true },
  { id: "insp-07", homeId: HOME_ID, date: "2026-01-07", inspectedBy: "Lisa Williams", area: "lighting", roomType: "lounge", score: 8, issues: [], photographic: false },
  { id: "insp-08", homeId: HOME_ID, date: "2026-01-07", inspectedBy: "Lisa Williams", area: "temperature", roomType: "lounge", score: 7, issues: ["Radiator thermostat not responding"], photographic: false },
  { id: "insp-09", homeId: HOME_ID, date: "2026-01-08", inspectedBy: "Tom Richards", area: "outdoor_space", roomType: "garden", score: 7, issues: ["Fence panel needs replacing"], photographic: true },
  { id: "insp-10", homeId: HOME_ID, date: "2026-01-08", inspectedBy: "Tom Richards", area: "safety", roomType: "garden", score: 8, issues: [], photographic: true },
  { id: "insp-11", homeId: HOME_ID, date: "2026-01-10", inspectedBy: "Darren Laville", area: "cleanliness", roomType: "bathroom", score: 9, issues: [], photographic: true },
  { id: "insp-12", homeId: HOME_ID, date: "2026-01-10", inspectedBy: "Darren Laville", area: "ventilation", roomType: "bathroom", score: 8, issues: [], photographic: true },
  { id: "insp-13", homeId: HOME_ID, date: "2026-01-12", inspectedBy: "Sarah Johnson", area: "decoration", roomType: "lounge", score: 8, issues: [], photographic: true },
  { id: "insp-14", homeId: HOME_ID, date: "2026-01-12", inspectedBy: "Sarah Johnson", area: "storage", roomType: "bedroom", score: 7, issues: ["Additional shelving needed"], photographic: false },
  { id: "insp-15", homeId: HOME_ID, date: "2026-01-14", inspectedBy: "Lisa Williams", area: "accessibility", roomType: "hallway", score: 9, issues: [], photographic: true },
  { id: "insp-16", homeId: HOME_ID, date: "2026-01-15", inspectedBy: "Tom Richards", area: "maintenance", roomType: "utility", score: 7, issues: ["Washing machine door seal degraded"], photographic: true },
];

const DEMO_MAINTENANCE: MaintenanceRequest[] = [
  { id: "maint-01", homeId: HOME_ID, reportedDate: "2026-01-03", reportedBy: "Sarah Johnson", roomType: "kitchen", description: "Extractor fan rattling", priority: "routine", status: "completed", completedDate: "2026-01-06", daysToResolve: 3 },
  { id: "maint-02", homeId: HOME_ID, reportedDate: "2026-01-05", reportedBy: "Lisa Williams", roomType: "bathroom", description: "Shower head leaking", priority: "routine", status: "completed", completedDate: "2026-01-07", daysToResolve: 2 },
  { id: "maint-03", homeId: HOME_ID, reportedDate: "2026-01-08", reportedBy: "Tom Richards", roomType: "garden", description: "Fence panel damaged", priority: "urgent", status: "completed", completedDate: "2026-01-10", daysToResolve: 2 },
  { id: "maint-04", homeId: HOME_ID, reportedDate: "2026-01-10", reportedBy: "Darren Laville", roomType: "lounge", description: "Radiator thermostat not responding", priority: "routine", status: "completed", completedDate: "2026-01-14", daysToResolve: 4 },
  { id: "maint-05", homeId: HOME_ID, reportedDate: "2026-01-12", reportedBy: "Sarah Johnson", roomType: "bedroom", description: "Wardrobe door hinge loose", priority: "routine", status: "completed", completedDate: "2026-01-13", daysToResolve: 1 },
  { id: "maint-06", homeId: HOME_ID, reportedDate: "2026-01-15", reportedBy: "Tom Richards", roomType: "utility", description: "Washing machine door seal degraded", priority: "urgent", status: "completed", completedDate: "2026-01-17", daysToResolve: 2 },
  { id: "maint-07", homeId: HOME_ID, reportedDate: "2026-01-18", reportedBy: "Lisa Williams", roomType: "hallway", description: "Light bulb blown upstairs", priority: "routine", status: "completed", completedDate: "2026-01-18", daysToResolve: 0 },
  { id: "maint-08", homeId: HOME_ID, reportedDate: "2026-01-20", reportedBy: "Darren Laville", roomType: "bedroom", description: "Shelving unit requested for Room 2", priority: "planned_improvement", status: "scheduled" },
  { id: "maint-09", homeId: HOME_ID, reportedDate: "2026-01-22", reportedBy: "Sarah Johnson", roomType: "dining_room", description: "Chair leg wobbly", priority: "routine", status: "completed", completedDate: "2026-01-23", daysToResolve: 1 },
  { id: "maint-10", homeId: HOME_ID, reportedDate: "2026-01-25", reportedBy: "Tom Richards", roomType: "garden", description: "Gate latch stiff", priority: "routine", status: "overdue" },
  { id: "maint-11", homeId: HOME_ID, reportedDate: "2026-01-28", reportedBy: "Lisa Williams", roomType: "hallway", description: "Noticeboard frame cracked", priority: "planned_improvement", status: "scheduled" },
];

const DEMO_PERSONALISATION: PersonalisationRecord[] = [
  { childId: "child-alex", childName: "Alex", bedroomPersonalised: true, choiceInDecor: true, personalItems: true, culturalConsiderations: true, lastReviewDate: "2026-01-10" },
  { childId: "child-jordan", childName: "Jordan", bedroomPersonalised: true, choiceInDecor: true, personalItems: true, culturalConsiderations: true, lastReviewDate: "2026-01-12" },
  { childId: "child-morgan", childName: "Morgan", bedroomPersonalised: true, choiceInDecor: true, personalItems: true, culturalConsiderations: true, lastReviewDate: "2025-12-20" },
];

const DEMO_CHILD_VIEWS: ChildEnvironmentView[] = [
  { childId: "child-alex", childName: "Alex", date: "2026-01-15", overallSatisfaction: 8, feelsHomely: true, feelsPrivate: true, feelsSafe: true, suggestionsForImprovement: ["Would like a bigger desk"] },
  { childId: "child-jordan", childName: "Jordan", date: "2026-01-15", overallSatisfaction: 9, feelsHomely: true, feelsPrivate: true, feelsSafe: true, suggestionsForImprovement: [] },
  { childId: "child-morgan", childName: "Morgan", date: "2026-01-15", overallSatisfaction: 8, feelsHomely: true, feelsPrivate: true, feelsSafe: true, suggestionsForImprovement: ["More fairy lights in the lounge"] },
];

// ══════════════════════════════════════════════════════════════════════════════
// 1. Label Functions
// ══════════════════════════════════════════════════════════════════════════════

describe("getRoomTypeLabel", () => {
  it("returns correct label for bedroom", () => {
    expect(getRoomTypeLabel("bedroom")).toBe("Bedroom");
  });

  it("returns correct label for bathroom", () => {
    expect(getRoomTypeLabel("bathroom")).toBe("Bathroom");
  });

  it("returns correct label for kitchen", () => {
    expect(getRoomTypeLabel("kitchen")).toBe("Kitchen");
  });

  it("returns correct label for lounge", () => {
    expect(getRoomTypeLabel("lounge")).toBe("Lounge");
  });

  it("returns correct label for dining_room", () => {
    expect(getRoomTypeLabel("dining_room")).toBe("Dining Room");
  });

  it("returns correct label for garden", () => {
    expect(getRoomTypeLabel("garden")).toBe("Garden");
  });

  it("returns correct label for hallway", () => {
    expect(getRoomTypeLabel("hallway")).toBe("Hallway");
  });

  it("returns correct label for office", () => {
    expect(getRoomTypeLabel("office")).toBe("Office");
  });

  it("returns correct label for utility", () => {
    expect(getRoomTypeLabel("utility")).toBe("Utility");
  });

  it("returns correct label for quiet_room", () => {
    expect(getRoomTypeLabel("quiet_room")).toBe("Quiet Room");
  });

  it("returns correct label for activity_room", () => {
    expect(getRoomTypeLabel("activity_room")).toBe("Activity Room");
  });

  it("returns correct label for laundry", () => {
    expect(getRoomTypeLabel("laundry")).toBe("Laundry");
  });

  it("returns correct label for other", () => {
    expect(getRoomTypeLabel("other")).toBe("Other");
  });
});

describe("getInspectionAreaLabel", () => {
  it("returns correct label for cleanliness", () => {
    expect(getInspectionAreaLabel("cleanliness")).toBe("Cleanliness");
  });

  it("returns correct label for safety", () => {
    expect(getInspectionAreaLabel("safety")).toBe("Safety");
  });

  it("returns correct label for personalisation", () => {
    expect(getInspectionAreaLabel("personalisation")).toBe("Personalisation");
  });

  it("returns correct label for furniture_condition", () => {
    expect(getInspectionAreaLabel("furniture_condition")).toBe("Furniture Condition");
  });

  it("returns correct label for outdoor_space", () => {
    expect(getInspectionAreaLabel("outdoor_space")).toBe("Outdoor Space");
  });

  it("returns correct labels for all 12 areas", () => {
    const areas: InspectionArea[] = [
      "cleanliness", "safety", "maintenance", "decoration", "personalisation",
      "furniture_condition", "lighting", "temperature", "ventilation",
      "accessibility", "storage", "outdoor_space",
    ];
    for (const area of areas) {
      expect(getInspectionAreaLabel(area)).toBeTruthy();
      expect(getInspectionAreaLabel(area).length).toBeGreaterThan(0);
    }
  });
});

describe("getMaintenanceStatusLabel", () => {
  it("returns correct label for completed", () => {
    expect(getMaintenanceStatusLabel("completed")).toBe("Completed");
  });

  it("returns correct label for overdue", () => {
    expect(getMaintenanceStatusLabel("overdue")).toBe("Overdue");
  });

  it("returns correct label for emergency", () => {
    expect(getMaintenanceStatusLabel("emergency")).toBe("Emergency");
  });

  it("returns correct label for scheduled", () => {
    expect(getMaintenanceStatusLabel("scheduled")).toBe("Scheduled");
  });

  it("returns correct label for cancelled", () => {
    expect(getMaintenanceStatusLabel("cancelled")).toBe("Cancelled");
  });
});

describe("getMaintenancePriorityLabel", () => {
  it("returns correct label for emergency", () => {
    expect(getMaintenancePriorityLabel("emergency")).toBe("Emergency");
  });

  it("returns correct label for urgent", () => {
    expect(getMaintenancePriorityLabel("urgent")).toBe("Urgent");
  });

  it("returns correct label for routine", () => {
    expect(getMaintenancePriorityLabel("routine")).toBe("Routine");
  });

  it("returns correct label for planned_improvement", () => {
    expect(getMaintenancePriorityLabel("planned_improvement")).toBe("Planned Improvement");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. evaluateInspectionQuality
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateInspectionQuality", () => {
  it("returns zeroed result for empty inspections", () => {
    const result = evaluateInspectionQuality([], PERIOD_START, PERIOD_END);
    expect(result.averageScore).toBe(0);
    expect(result.inspectionCount).toBe(0);
    expect(result.photographicRate).toBe(0);
    expect(result.issueCount).toBe(0);
    expect(result.areasCovered).toBe(0);
    expect(result.areaCoverageRate).toBe(0);
    expect(result.roomsCovered).toBe(0);
    expect(result.lowestScoringArea).toBe("N/A");
    expect(result.highestScoringArea).toBe("N/A");
  });

  it("counts only in-period inspections", () => {
    const outOfPeriod: EnvironmentalInspection = {
      id: "x", homeId: HOME_ID, date: "2025-12-01", inspectedBy: "Test",
      area: "cleanliness", roomType: "bedroom", score: 5, issues: [], photographic: false,
    };
    const result = evaluateInspectionQuality([outOfPeriod], PERIOD_START, PERIOD_END);
    expect(result.inspectionCount).toBe(0);
  });

  it("calculates correct count for Chamberlain House demo", () => {
    const result = evaluateInspectionQuality(DEMO_INSPECTIONS, PERIOD_START, PERIOD_END);
    expect(result.inspectionCount).toBe(16);
  });

  it("calculates correct average score", () => {
    const result = evaluateInspectionQuality(DEMO_INSPECTIONS, PERIOD_START, PERIOD_END);
    // Sum: 8+9+7+9+9+8+8+7+7+8+9+8+8+7+9+7 = 128, /16 = 8.0
    expect(result.averageScore).toBe(8);
  });

  it("calculates correct photographic rate", () => {
    const result = evaluateInspectionQuality(DEMO_INSPECTIONS, PERIOD_START, PERIOD_END);
    // 13 with photos out of 16 = 81%
    expect(result.photographicRate).toBe(81);
  });

  it("counts total issues correctly", () => {
    const result = evaluateInspectionQuality(DEMO_INSPECTIONS, PERIOD_START, PERIOD_END);
    // Issues: insp-03(1), insp-08(1), insp-09(1), insp-14(1), insp-16(1) = 5
    expect(result.issueCount).toBe(5);
  });

  it("counts areas covered correctly", () => {
    const result = evaluateInspectionQuality(DEMO_INSPECTIONS, PERIOD_START, PERIOD_END);
    // cleanliness, safety, maintenance, personalisation, furniture_condition, lighting, temperature, outdoor_space, ventilation, decoration, storage, accessibility = 12
    expect(result.areasCovered).toBe(12);
    expect(result.areaCoverageRate).toBe(100);
  });

  it("counts rooms covered correctly", () => {
    const result = evaluateInspectionQuality(DEMO_INSPECTIONS, PERIOD_START, PERIOD_END);
    // kitchen, bedroom, lounge, garden, bathroom, hallway, utility = 7
    expect(result.roomsCovered).toBe(7);
  });

  it("identifies highest scoring area", () => {
    const result = evaluateInspectionQuality(DEMO_INSPECTIONS, PERIOD_START, PERIOD_END);
    expect(result.highestScoringAreaScore).toBeGreaterThanOrEqual(result.lowestScoringAreaScore);
  });

  it("identifies lowest scoring area", () => {
    const result = evaluateInspectionQuality(DEMO_INSPECTIONS, PERIOD_START, PERIOD_END);
    expect(result.lowestScoringArea).not.toBe("N/A");
  });

  it("handles single inspection correctly", () => {
    const single: EnvironmentalInspection = {
      id: "s1", homeId: HOME_ID, date: "2026-01-15", inspectedBy: "Tester",
      area: "safety", roomType: "bedroom", score: 10, issues: [], photographic: true,
    };
    const result = evaluateInspectionQuality([single], PERIOD_START, PERIOD_END);
    expect(result.inspectionCount).toBe(1);
    expect(result.averageScore).toBe(10);
    expect(result.photographicRate).toBe(100);
    expect(result.areasCovered).toBe(1);
    expect(result.roomsCovered).toBe(1);
    expect(result.highestScoringArea).toBe("safety");
    expect(result.lowestScoringArea).toBe("safety");
  });

  it("handles minimum score of 1", () => {
    const low: EnvironmentalInspection = {
      id: "l1", homeId: HOME_ID, date: "2026-01-15", inspectedBy: "Tester",
      area: "cleanliness", roomType: "kitchen", score: 1, issues: ["Major issues"], photographic: false,
    };
    const result = evaluateInspectionQuality([low], PERIOD_START, PERIOD_END);
    expect(result.averageScore).toBe(1);
    expect(result.issueCount).toBe(1);
  });

  it("handles inspections on period boundaries", () => {
    const startBoundary: EnvironmentalInspection = {
      id: "b1", homeId: HOME_ID, date: "2026-01-01", inspectedBy: "Tester",
      area: "safety", roomType: "bedroom", score: 8, issues: [], photographic: true,
    };
    const endBoundary: EnvironmentalInspection = {
      id: "b2", homeId: HOME_ID, date: "2026-01-31", inspectedBy: "Tester",
      area: "lighting", roomType: "lounge", score: 7, issues: [], photographic: true,
    };
    const result = evaluateInspectionQuality([startBoundary, endBoundary], PERIOD_START, PERIOD_END);
    expect(result.inspectionCount).toBe(2);
  });

  it("totalAreas is always 12", () => {
    const result = evaluateInspectionQuality([], PERIOD_START, PERIOD_END);
    expect(result.totalAreas).toBe(12);
  });

  it("handles multiple issues per inspection", () => {
    const multi: EnvironmentalInspection = {
      id: "m1", homeId: HOME_ID, date: "2026-01-10", inspectedBy: "Tester",
      area: "maintenance", roomType: "kitchen", score: 3,
      issues: ["Broken handle", "Loose tile", "Damaged cupboard"], photographic: true,
    };
    const result = evaluateInspectionQuality([multi], PERIOD_START, PERIOD_END);
    expect(result.issueCount).toBe(3);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. evaluateMaintenanceResponsiveness
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateMaintenanceResponsiveness", () => {
  it("returns zeroed result for empty requests", () => {
    const result = evaluateMaintenanceResponsiveness([], PERIOD_START, PERIOD_END);
    expect(result.totalRequests).toBe(0);
    expect(result.completionRate).toBe(0);
    expect(result.overdueCount).toBe(0);
    expect(result.emergencyCount).toBe(0);
    expect(result.averageDaysToResolve).toBe(0);
    expect(result.scheduledCount).toBe(0);
    expect(result.cancelledCount).toBe(0);
    expect(result.completedCount).toBe(0);
    expect(result.overdueRate).toBe(0);
  });

  it("counts only in-period requests", () => {
    const outOfPeriod: MaintenanceRequest = {
      id: "x", homeId: HOME_ID, reportedDate: "2025-11-01", reportedBy: "Test",
      roomType: "bedroom", description: "Test", priority: "routine", status: "completed",
      completedDate: "2025-11-02", daysToResolve: 1,
    };
    const result = evaluateMaintenanceResponsiveness([outOfPeriod], PERIOD_START, PERIOD_END);
    expect(result.totalRequests).toBe(0);
  });

  it("calculates correct totals for Chamberlain House demo", () => {
    const result = evaluateMaintenanceResponsiveness(DEMO_MAINTENANCE, PERIOD_START, PERIOD_END);
    expect(result.totalRequests).toBe(11);
    expect(result.completedCount).toBe(8);
    expect(result.scheduledCount).toBe(2);
    expect(result.overdueCount).toBe(1);
    expect(result.emergencyCount).toBe(0);
    expect(result.cancelledCount).toBe(0);
  });

  it("calculates correct completion rate", () => {
    const result = evaluateMaintenanceResponsiveness(DEMO_MAINTENANCE, PERIOD_START, PERIOD_END);
    // 8 completed / 11 total = 73%
    expect(result.completionRate).toBe(73);
  });

  it("calculates correct overdue rate", () => {
    const result = evaluateMaintenanceResponsiveness(DEMO_MAINTENANCE, PERIOD_START, PERIOD_END);
    // 1 overdue / 11 total = 9%
    expect(result.overdueRate).toBe(9);
  });

  it("calculates correct average days to resolve", () => {
    const result = evaluateMaintenanceResponsiveness(DEMO_MAINTENANCE, PERIOD_START, PERIOD_END);
    // 3+2+2+4+1+2+0+1 = 15, /8 = 1.875 -> 1.9
    expect(result.averageDaysToResolve).toBe(1.9);
  });

  it("handles all-completed requests", () => {
    const all: MaintenanceRequest[] = [
      { id: "a1", homeId: HOME_ID, reportedDate: "2026-01-05", reportedBy: "Test", roomType: "bedroom", description: "Test 1", priority: "routine", status: "completed", completedDate: "2026-01-06", daysToResolve: 1 },
      { id: "a2", homeId: HOME_ID, reportedDate: "2026-01-10", reportedBy: "Test", roomType: "kitchen", description: "Test 2", priority: "routine", status: "completed", completedDate: "2026-01-11", daysToResolve: 1 },
    ];
    const result = evaluateMaintenanceResponsiveness(all, PERIOD_START, PERIOD_END);
    expect(result.completionRate).toBe(100);
    expect(result.overdueCount).toBe(0);
    expect(result.overdueRate).toBe(0);
  });

  it("handles all-overdue requests", () => {
    const all: MaintenanceRequest[] = [
      { id: "o1", homeId: HOME_ID, reportedDate: "2026-01-05", reportedBy: "Test", roomType: "bedroom", description: "Test", priority: "urgent", status: "overdue" },
      { id: "o2", homeId: HOME_ID, reportedDate: "2026-01-10", reportedBy: "Test", roomType: "kitchen", description: "Test", priority: "emergency", status: "overdue" },
    ];
    const result = evaluateMaintenanceResponsiveness(all, PERIOD_START, PERIOD_END);
    expect(result.completionRate).toBe(0);
    expect(result.overdueRate).toBe(100);
    expect(result.overdueCount).toBe(2);
  });

  it("handles emergency requests", () => {
    const emrg: MaintenanceRequest = {
      id: "e1", homeId: HOME_ID, reportedDate: "2026-01-15", reportedBy: "Test",
      roomType: "kitchen", description: "Burst pipe", priority: "emergency", status: "emergency",
    };
    const result = evaluateMaintenanceResponsiveness([emrg], PERIOD_START, PERIOD_END);
    expect(result.emergencyCount).toBe(1);
  });

  it("handles cancelled requests", () => {
    const canc: MaintenanceRequest = {
      id: "c1", homeId: HOME_ID, reportedDate: "2026-01-15", reportedBy: "Test",
      roomType: "kitchen", description: "Duplicate request", priority: "routine", status: "cancelled",
    };
    const result = evaluateMaintenanceResponsiveness([canc], PERIOD_START, PERIOD_END);
    expect(result.cancelledCount).toBe(1);
    expect(result.completedCount).toBe(0);
  });

  it("handles zero-day resolution", () => {
    const quick: MaintenanceRequest = {
      id: "q1", homeId: HOME_ID, reportedDate: "2026-01-15", reportedBy: "Test",
      roomType: "hallway", description: "Light bulb", priority: "routine", status: "completed",
      completedDate: "2026-01-15", daysToResolve: 0,
    };
    const result = evaluateMaintenanceResponsiveness([quick], PERIOD_START, PERIOD_END);
    expect(result.averageDaysToResolve).toBe(0);
  });

  it("handles completed without daysToResolve", () => {
    const noDays: MaintenanceRequest = {
      id: "nd1", homeId: HOME_ID, reportedDate: "2026-01-15", reportedBy: "Test",
      roomType: "hallway", description: "Test", priority: "routine", status: "completed",
      completedDate: "2026-01-16",
    };
    const result = evaluateMaintenanceResponsiveness([noDays], PERIOD_START, PERIOD_END);
    expect(result.completedCount).toBe(1);
    expect(result.averageDaysToResolve).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. evaluatePersonalisation
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluatePersonalisation", () => {
  it("returns zeroed result for empty records", () => {
    const result = evaluatePersonalisation([], REFERENCE_DATE);
    expect(result.totalChildren).toBe(0);
    expect(result.bedroomPersonalisedRate).toBe(0);
    expect(result.choiceInDecorRate).toBe(0);
    expect(result.personalItemsRate).toBe(0);
    expect(result.culturalConsiderationsRate).toBe(0);
    expect(result.overallPersonalisationRate).toBe(0);
    expect(result.fullyPersonalisedCount).toBe(0);
    expect(result.reviewCurrency).toBe(0);
  });

  it("calculates 100% rates when all are true", () => {
    const result = evaluatePersonalisation(DEMO_PERSONALISATION, REFERENCE_DATE);
    expect(result.bedroomPersonalisedRate).toBe(100);
    expect(result.choiceInDecorRate).toBe(100);
    expect(result.personalItemsRate).toBe(100);
    expect(result.culturalConsiderationsRate).toBe(100);
    expect(result.overallPersonalisationRate).toBe(100);
  });

  it("counts fully personalised children correctly", () => {
    const result = evaluatePersonalisation(DEMO_PERSONALISATION, REFERENCE_DATE);
    expect(result.fullyPersonalisedCount).toBe(3);
    expect(result.totalChildren).toBe(3);
  });

  it("handles partial personalisation", () => {
    const partial: PersonalisationRecord[] = [
      { childId: "c1", childName: "A", bedroomPersonalised: true, choiceInDecor: false, personalItems: true, culturalConsiderations: false, lastReviewDate: "2026-01-01" },
      { childId: "c2", childName: "B", bedroomPersonalised: false, choiceInDecor: true, personalItems: false, culturalConsiderations: true, lastReviewDate: "2026-01-01" },
    ];
    const result = evaluatePersonalisation(partial, REFERENCE_DATE);
    expect(result.bedroomPersonalisedRate).toBe(50);
    expect(result.choiceInDecorRate).toBe(50);
    expect(result.personalItemsRate).toBe(50);
    expect(result.culturalConsiderationsRate).toBe(50);
    expect(result.overallPersonalisationRate).toBe(50);
    expect(result.fullyPersonalisedCount).toBe(0);
  });

  it("handles no personalisation at all", () => {
    const none: PersonalisationRecord[] = [
      { childId: "c1", childName: "A", bedroomPersonalised: false, choiceInDecor: false, personalItems: false, culturalConsiderations: false, lastReviewDate: "2025-01-01" },
    ];
    const result = evaluatePersonalisation(none, REFERENCE_DATE);
    expect(result.bedroomPersonalisedRate).toBe(0);
    expect(result.overallPersonalisationRate).toBe(0);
    expect(result.fullyPersonalisedCount).toBe(0);
  });

  it("calculates review currency correctly for recent reviews", () => {
    const result = evaluatePersonalisation(DEMO_PERSONALISATION, REFERENCE_DATE);
    // All three have reviews within 6 months of 2026-02-01
    expect(result.reviewCurrency).toBe(100);
  });

  it("identifies stale reviews beyond six months", () => {
    const stale: PersonalisationRecord[] = [
      { childId: "c1", childName: "A", bedroomPersonalised: true, choiceInDecor: true, personalItems: true, culturalConsiderations: true, lastReviewDate: "2025-01-01" },
    ];
    const result = evaluatePersonalisation(stale, "2026-02-01");
    // 2025-01-01 is more than 6 months before 2026-02-01
    expect(result.reviewCurrency).toBe(0);
  });

  it("handles mixed review currency", () => {
    const mixed: PersonalisationRecord[] = [
      { childId: "c1", childName: "A", bedroomPersonalised: true, choiceInDecor: true, personalItems: true, culturalConsiderations: true, lastReviewDate: "2026-01-15" },
      { childId: "c2", childName: "B", bedroomPersonalised: true, choiceInDecor: true, personalItems: true, culturalConsiderations: true, lastReviewDate: "2024-06-01" },
    ];
    const result = evaluatePersonalisation(mixed, "2026-02-01");
    expect(result.reviewCurrency).toBe(50);
  });

  it("handles single child", () => {
    const single: PersonalisationRecord[] = [
      { childId: "c1", childName: "A", bedroomPersonalised: true, choiceInDecor: true, personalItems: true, culturalConsiderations: true, lastReviewDate: "2026-01-01" },
    ];
    const result = evaluatePersonalisation(single, "2026-02-01");
    expect(result.totalChildren).toBe(1);
    expect(result.fullyPersonalisedCount).toBe(1);
    expect(result.overallPersonalisationRate).toBe(100);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. evaluateChildSatisfaction
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateChildSatisfaction", () => {
  it("returns zeroed result for empty views", () => {
    const result = evaluateChildSatisfaction([], PERIOD_START, PERIOD_END);
    expect(result.averageSatisfaction).toBe(0);
    expect(result.feelsHomelyRate).toBe(0);
    expect(result.feelsPrivateRate).toBe(0);
    expect(result.feelsSafeRate).toBe(0);
    expect(result.totalViews).toBe(0);
    expect(result.childrenWithViews).toBe(0);
    expect(result.suggestionCount).toBe(0);
    expect(result.childrenWithSuggestions).toBe(0);
  });

  it("counts only in-period views", () => {
    const outOfPeriod: ChildEnvironmentView = {
      childId: "c1", childName: "A", date: "2025-12-01", overallSatisfaction: 5,
      feelsHomely: true, feelsPrivate: true, feelsSafe: true, suggestionsForImprovement: [],
    };
    const result = evaluateChildSatisfaction([outOfPeriod], PERIOD_START, PERIOD_END);
    expect(result.totalViews).toBe(0);
  });

  it("calculates correct averages for Chamberlain House demo", () => {
    const result = evaluateChildSatisfaction(DEMO_CHILD_VIEWS, PERIOD_START, PERIOD_END);
    // (8+9+8)/3 = 8.333... -> 8.3
    expect(result.averageSatisfaction).toBe(8.3);
  });

  it("calculates 100% safety for all-safe views", () => {
    const result = evaluateChildSatisfaction(DEMO_CHILD_VIEWS, PERIOD_START, PERIOD_END);
    expect(result.feelsSafeRate).toBe(100);
  });

  it("calculates correct homely rate", () => {
    const result = evaluateChildSatisfaction(DEMO_CHILD_VIEWS, PERIOD_START, PERIOD_END);
    expect(result.feelsHomelyRate).toBe(100);
  });

  it("calculates correct privacy rate", () => {
    const result = evaluateChildSatisfaction(DEMO_CHILD_VIEWS, PERIOD_START, PERIOD_END);
    expect(result.feelsPrivateRate).toBe(100);
  });

  it("counts children with views correctly", () => {
    const result = evaluateChildSatisfaction(DEMO_CHILD_VIEWS, PERIOD_START, PERIOD_END);
    expect(result.childrenWithViews).toBe(3);
    expect(result.totalViews).toBe(3);
  });

  it("counts suggestions correctly", () => {
    const result = evaluateChildSatisfaction(DEMO_CHILD_VIEWS, PERIOD_START, PERIOD_END);
    // Alex: 1, Jordan: 0, Morgan: 1 = 2 total
    expect(result.suggestionCount).toBe(2);
    expect(result.childrenWithSuggestions).toBe(2);
  });

  it("handles mixed safety feelings", () => {
    const mixed: ChildEnvironmentView[] = [
      { childId: "c1", childName: "A", date: "2026-01-15", overallSatisfaction: 8, feelsHomely: true, feelsPrivate: true, feelsSafe: true, suggestionsForImprovement: [] },
      { childId: "c2", childName: "B", date: "2026-01-15", overallSatisfaction: 4, feelsHomely: false, feelsPrivate: false, feelsSafe: false, suggestionsForImprovement: ["Feels unsafe near the stairs"] },
    ];
    const result = evaluateChildSatisfaction(mixed, PERIOD_START, PERIOD_END);
    expect(result.feelsSafeRate).toBe(50);
    expect(result.feelsHomelyRate).toBe(50);
    expect(result.feelsPrivateRate).toBe(50);
  });

  it("handles very low satisfaction", () => {
    const low: ChildEnvironmentView[] = [
      { childId: "c1", childName: "A", date: "2026-01-15", overallSatisfaction: 1, feelsHomely: false, feelsPrivate: false, feelsSafe: false, suggestionsForImprovement: ["Everything"] },
    ];
    const result = evaluateChildSatisfaction(low, PERIOD_START, PERIOD_END);
    expect(result.averageSatisfaction).toBe(1);
    expect(result.feelsSafeRate).toBe(0);
    expect(result.feelsHomelyRate).toBe(0);
    expect(result.feelsPrivateRate).toBe(0);
  });

  it("handles perfect satisfaction", () => {
    const perfect: ChildEnvironmentView[] = [
      { childId: "c1", childName: "A", date: "2026-01-15", overallSatisfaction: 10, feelsHomely: true, feelsPrivate: true, feelsSafe: true, suggestionsForImprovement: [] },
    ];
    const result = evaluateChildSatisfaction(perfect, PERIOD_START, PERIOD_END);
    expect(result.averageSatisfaction).toBe(10);
    expect(result.feelsSafeRate).toBe(100);
  });

  it("handles multiple views per child", () => {
    const multi: ChildEnvironmentView[] = [
      { childId: "c1", childName: "A", date: "2026-01-10", overallSatisfaction: 7, feelsHomely: true, feelsPrivate: true, feelsSafe: true, suggestionsForImprovement: ["More books"] },
      { childId: "c1", childName: "A", date: "2026-01-25", overallSatisfaction: 9, feelsHomely: true, feelsPrivate: true, feelsSafe: true, suggestionsForImprovement: [] },
    ];
    const result = evaluateChildSatisfaction(multi, PERIOD_START, PERIOD_END);
    expect(result.totalViews).toBe(2);
    expect(result.childrenWithViews).toBe(1);
    expect(result.averageSatisfaction).toBe(8);
  });

  it("correctly counts children with and without suggestions", () => {
    const views: ChildEnvironmentView[] = [
      { childId: "c1", childName: "A", date: "2026-01-10", overallSatisfaction: 8, feelsHomely: true, feelsPrivate: true, feelsSafe: true, suggestionsForImprovement: ["New curtains", "Better Wi-Fi"] },
      { childId: "c2", childName: "B", date: "2026-01-10", overallSatisfaction: 7, feelsHomely: true, feelsPrivate: true, feelsSafe: true, suggestionsForImprovement: [] },
      { childId: "c3", childName: "C", date: "2026-01-10", overallSatisfaction: 9, feelsHomely: true, feelsPrivate: true, feelsSafe: true, suggestionsForImprovement: ["Trampoline"] },
    ];
    const result = evaluateChildSatisfaction(views, PERIOD_START, PERIOD_END);
    expect(result.suggestionCount).toBe(3);
    expect(result.childrenWithSuggestions).toBe(2);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. generateEnvironmentalQualityIntelligence — Chamberlain House Integration
// ══════════════════════════════════════════════════════════════════════════════

describe("generateEnvironmentalQualityIntelligence", () => {
  function generate() {
    return generateEnvironmentalQualityIntelligence(
      DEMO_INSPECTIONS,
      DEMO_MAINTENANCE,
      DEMO_PERSONALISATION,
      DEMO_CHILD_VIEWS,
      HOME_ID,
      PERIOD_START,
      PERIOD_END,
      REFERENCE_DATE,
    );
  }

  it("returns correct homeId", () => {
    expect(generate().homeId).toBe("oak-house");
  });

  it("returns correct period dates", () => {
    const result = generate();
    expect(result.periodStart).toBe(PERIOD_START);
    expect(result.periodEnd).toBe(PERIOD_END);
    expect(result.referenceDate).toBe(REFERENCE_DATE);
  });

  it("returns overallScore between 0 and 100", () => {
    const result = generate();
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("Chamberlain House demo gets a good or outstanding rating", () => {
    const result = generate();
    expect(["outstanding", "good"]).toContain(result.rating);
  });

  it("includes populated inspectionQuality section", () => {
    const result = generate();
    expect(result.inspectionQuality.inspectionCount).toBe(16);
    expect(result.inspectionQuality.averageScore).toBeGreaterThan(0);
  });

  it("includes populated maintenanceResponsiveness section", () => {
    const result = generate();
    expect(result.maintenanceResponsiveness.totalRequests).toBe(11);
    expect(result.maintenanceResponsiveness.completedCount).toBe(8);
  });

  it("includes populated personalisation section", () => {
    const result = generate();
    expect(result.personalisation.totalChildren).toBe(3);
    expect(result.personalisation.bedroomPersonalisedRate).toBe(100);
  });

  it("includes populated childSatisfaction section", () => {
    const result = generate();
    expect(result.childSatisfaction.totalViews).toBe(3);
    expect(result.childSatisfaction.feelsSafeRate).toBe(100);
  });

  it("generates at least one strength for Chamberlain House", () => {
    const result = generate();
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("generates at least one action for Chamberlain House", () => {
    const result = generate();
    // Chamberlain House has 1 overdue repair and suggestions, so there should be actions
    expect(result.actions.length).toBeGreaterThan(0);
  });

  it("includes regulatory links", () => {
    const result = generate();
    expect(result.regulatoryLinks.length).toBe(5);
  });

  it("regulatory links reference CHR 2015 Reg 27", () => {
    const result = generate();
    expect(result.regulatoryLinks.some((l) => l.includes("Reg 27"))).toBe(true);
  });

  it("regulatory links reference CHR 2015 Reg 6", () => {
    const result = generate();
    expect(result.regulatoryLinks.some((l) => l.includes("Reg 6"))).toBe(true);
  });

  it("regulatory links reference SCCIF", () => {
    const result = generate();
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
  });

  it("regulatory links reference NMS", () => {
    const result = generate();
    expect(result.regulatoryLinks.some((l) => l.includes("NMS"))).toBe(true);
  });

  it("includes overdue maintenance action when overdue count > 0", () => {
    const result = generate();
    expect(result.actions.some((a) => a.toLowerCase().includes("overdue"))).toBe(true);
  });

  it("includes suggestion response action when suggestions exist", () => {
    const result = generate();
    expect(result.actions.some((a) => a.toLowerCase().includes("suggestion"))).toBe(true);
  });

  // ── Rating Threshold Tests ───────────────────────────────────────────────

  it("rates outstanding when score >= 80", () => {
    // Perfect data scenario
    const perfInsp: EnvironmentalInspection[] = Array.from({ length: 12 }, (_, i) => ({
      id: `pi-${i}`, homeId: HOME_ID, date: "2026-01-15", inspectedBy: "Test",
      area: (["cleanliness", "safety", "maintenance", "decoration", "personalisation", "furniture_condition", "lighting", "temperature", "ventilation", "accessibility", "storage", "outdoor_space"] as InspectionArea[])[i],
      roomType: "bedroom" as RoomType, score: 10, issues: [], photographic: true,
    }));
    const perfMaint: MaintenanceRequest[] = [
      { id: "pm1", homeId: HOME_ID, reportedDate: "2026-01-05", reportedBy: "Test", roomType: "bedroom", description: "Test", priority: "routine", status: "completed", completedDate: "2026-01-06", daysToResolve: 1 },
    ];
    const perfPers: PersonalisationRecord[] = [
      { childId: "c1", childName: "A", bedroomPersonalised: true, choiceInDecor: true, personalItems: true, culturalConsiderations: true, lastReviewDate: "2026-01-01" },
    ];
    const perfViews: ChildEnvironmentView[] = [
      { childId: "c1", childName: "A", date: "2026-01-15", overallSatisfaction: 10, feelsHomely: true, feelsPrivate: true, feelsSafe: true, suggestionsForImprovement: [] },
    ];

    const result = generateEnvironmentalQualityIntelligence(perfInsp, perfMaint, perfPers, perfViews, HOME_ID, PERIOD_START, PERIOD_END, REFERENCE_DATE);
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.rating).toBe("outstanding");
  });

  it("rates inadequate when score < 40", () => {
    const badInsp: EnvironmentalInspection[] = [
      { id: "bi1", homeId: HOME_ID, date: "2026-01-15", inspectedBy: "Test", area: "cleanliness", roomType: "bedroom", score: 1, issues: ["Dirty", "Unsafe", "Broken"], photographic: false },
    ];
    const badMaint: MaintenanceRequest[] = [
      { id: "bm1", homeId: HOME_ID, reportedDate: "2026-01-05", reportedBy: "Test", roomType: "bedroom", description: "Major repair", priority: "emergency", status: "overdue" },
      { id: "bm2", homeId: HOME_ID, reportedDate: "2026-01-10", reportedBy: "Test", roomType: "kitchen", description: "Critical", priority: "emergency", status: "overdue" },
    ];
    const badPers: PersonalisationRecord[] = [
      { childId: "c1", childName: "A", bedroomPersonalised: false, choiceInDecor: false, personalItems: false, culturalConsiderations: false, lastReviewDate: "2024-01-01" },
    ];
    const badViews: ChildEnvironmentView[] = [
      { childId: "c1", childName: "A", date: "2026-01-15", overallSatisfaction: 1, feelsHomely: false, feelsPrivate: false, feelsSafe: false, suggestionsForImprovement: ["Everything is awful"] },
    ];

    const result = generateEnvironmentalQualityIntelligence(badInsp, badMaint, badPers, badViews, HOME_ID, PERIOD_START, PERIOD_END, REFERENCE_DATE);
    expect(result.overallScore).toBeLessThan(40);
    expect(result.rating).toBe("inadequate");
  });

  // ── Edge Cases ───────────────────────────────────────────────────────────

  it("handles completely empty data", () => {
    const result = generateEnvironmentalQualityIntelligence(
      [], [], [], [], HOME_ID, PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.inspectionQuality.inspectionCount).toBe(0);
    expect(result.maintenanceResponsiveness.totalRequests).toBe(0);
    expect(result.personalisation.totalChildren).toBe(0);
    expect(result.childSatisfaction.totalViews).toBe(0);
  });

  it("handles data only outside the period", () => {
    const outInsp: EnvironmentalInspection[] = [
      { id: "o1", homeId: HOME_ID, date: "2025-06-01", inspectedBy: "Test", area: "safety", roomType: "bedroom", score: 10, issues: [], photographic: true },
    ];
    const outMaint: MaintenanceRequest[] = [
      { id: "om1", homeId: HOME_ID, reportedDate: "2025-06-01", reportedBy: "Test", roomType: "bedroom", description: "Test", priority: "routine", status: "completed", completedDate: "2025-06-02", daysToResolve: 1 },
    ];
    const result = generateEnvironmentalQualityIntelligence(
      outInsp, outMaint, DEMO_PERSONALISATION, [], HOME_ID, PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.inspectionQuality.inspectionCount).toBe(0);
    expect(result.maintenanceResponsiveness.totalRequests).toBe(0);
  });

  it("score never exceeds 100", () => {
    const maxInsp: EnvironmentalInspection[] = Array.from({ length: 24 }, (_, i) => ({
      id: `mx-${i}`, homeId: HOME_ID, date: "2026-01-15", inspectedBy: "Test",
      area: (["cleanliness", "safety", "maintenance", "decoration", "personalisation", "furniture_condition", "lighting", "temperature", "ventilation", "accessibility", "storage", "outdoor_space"] as InspectionArea[])[i % 12],
      roomType: "bedroom" as RoomType, score: 10, issues: [], photographic: true,
    }));
    const maxViews: ChildEnvironmentView[] = Array.from({ length: 5 }, (_, i) => ({
      childId: `c-${i}`, childName: `Child ${i}`, date: "2026-01-15",
      overallSatisfaction: 10, feelsHomely: true, feelsPrivate: true, feelsSafe: true, suggestionsForImprovement: [],
    }));
    const maxPers: PersonalisationRecord[] = Array.from({ length: 5 }, (_, i) => ({
      childId: `c-${i}`, childName: `Child ${i}`, bedroomPersonalised: true,
      choiceInDecor: true, personalItems: true, culturalConsiderations: true, lastReviewDate: "2026-01-15",
    }));
    const maxMaint: MaintenanceRequest[] = Array.from({ length: 5 }, (_, i) => ({
      id: `mm-${i}`, homeId: HOME_ID, reportedDate: "2026-01-05", reportedBy: "Test",
      roomType: "bedroom" as RoomType, description: "Test", priority: "routine" as MaintenancePriority,
      status: "completed" as MaintenanceStatus, completedDate: "2026-01-06", daysToResolve: 1,
    }));

    const result = generateEnvironmentalQualityIntelligence(
      maxInsp, maxMaint, maxPers, maxViews, HOME_ID, PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("score never goes below 0", () => {
    const result = generateEnvironmentalQualityIntelligence(
      [], [], [], [], HOME_ID, PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  // ── Strength & Area Detection ────────────────────────────────────────────

  it("detects bedroom personalisation strength when 100%", () => {
    const result = generate();
    expect(result.strengths.some((s) => s.toLowerCase().includes("personalised"))).toBe(true);
  });

  it("detects all-safe strength when all children feel safe", () => {
    const result = generate();
    expect(result.strengths.some((s) => s.toLowerCase().includes("safe"))).toBe(true);
  });

  it("detects overdue maintenance as area for improvement", () => {
    const result = generate();
    expect(result.areasForImprovement.some((a) => a.toLowerCase().includes("overdue"))).toBe(true);
  });

  it("does not flag safety concern when all feel safe", () => {
    const result = generate();
    const safetyIssue = result.areasForImprovement.some((a) => a.toLowerCase().includes("not all children feel safe"));
    expect(safetyIssue).toBe(false);
  });

  it("generates safety area for improvement when not all feel safe", () => {
    const unsafeViews: ChildEnvironmentView[] = [
      { childId: "c1", childName: "A", date: "2026-01-15", overallSatisfaction: 3, feelsHomely: false, feelsPrivate: false, feelsSafe: false, suggestionsForImprovement: [] },
      { childId: "c2", childName: "B", date: "2026-01-15", overallSatisfaction: 8, feelsHomely: true, feelsPrivate: true, feelsSafe: true, suggestionsForImprovement: [] },
    ];
    const result = generateEnvironmentalQualityIntelligence(
      DEMO_INSPECTIONS, DEMO_MAINTENANCE, DEMO_PERSONALISATION, unsafeViews,
      HOME_ID, PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.areasForImprovement.some((a) => a.toLowerCase().includes("safe"))).toBe(true);
    expect(result.actions.some((a) => a.toLowerCase().includes("safe"))).toBe(true);
  });

  // ── Scoring Component Tests ──────────────────────────────────────────────

  it("inspection quality contributes max 25 to overall score", () => {
    const perfInsp: EnvironmentalInspection[] = Array.from({ length: 12 }, (_, i) => ({
      id: `sc-${i}`, homeId: HOME_ID, date: "2026-01-15", inspectedBy: "Test",
      area: (["cleanliness", "safety", "maintenance", "decoration", "personalisation", "furniture_condition", "lighting", "temperature", "ventilation", "accessibility", "storage", "outdoor_space"] as InspectionArea[])[i],
      roomType: "bedroom" as RoomType, score: 10, issues: [], photographic: true,
    }));
    const result = generateEnvironmentalQualityIntelligence(
      perfInsp, [], [], [], HOME_ID, PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("maintenance contributes to score when data present", () => {
    const maintOnly: MaintenanceRequest[] = [
      { id: "mo1", homeId: HOME_ID, reportedDate: "2026-01-05", reportedBy: "Test", roomType: "bedroom", description: "Test", priority: "routine", status: "completed", completedDate: "2026-01-06", daysToResolve: 1 },
    ];
    const withMaint = generateEnvironmentalQualityIntelligence(
      [], maintOnly, [], [], HOME_ID, PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    const without = generateEnvironmentalQualityIntelligence(
      [], [], [], [], HOME_ID, PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(withMaint.overallScore).toBeGreaterThan(without.overallScore);
  });

  it("personalisation contributes to score when data present", () => {
    const withPers = generateEnvironmentalQualityIntelligence(
      [], [], DEMO_PERSONALISATION, [], HOME_ID, PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    const without = generateEnvironmentalQualityIntelligence(
      [], [], [], [], HOME_ID, PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(withPers.overallScore).toBeGreaterThan(without.overallScore);
  });

  it("child satisfaction contributes to score when data present", () => {
    const withViews = generateEnvironmentalQualityIntelligence(
      [], [], [], DEMO_CHILD_VIEWS, HOME_ID, PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    const without = generateEnvironmentalQualityIntelligence(
      [], [], [], [], HOME_ID, PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(withViews.overallScore).toBeGreaterThan(without.overallScore);
  });

  // ── Additional edge: Strengths for maintenance ───────────────────────────

  it("detects strong maintenance completion as a strength", () => {
    const allCompleted: MaintenanceRequest[] = Array.from({ length: 5 }, (_, i) => ({
      id: `ac-${i}`, homeId: HOME_ID, reportedDate: "2026-01-05", reportedBy: "Test",
      roomType: "bedroom" as RoomType, description: "Test", priority: "routine" as MaintenancePriority,
      status: "completed" as MaintenanceStatus, completedDate: "2026-01-06", daysToResolve: 1,
    }));
    const result = generateEnvironmentalQualityIntelligence(
      [], allCompleted, DEMO_PERSONALISATION, DEMO_CHILD_VIEWS,
      HOME_ID, PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.strengths.some((s) => s.toLowerCase().includes("maintenance completion"))).toBe(true);
  });

  it("detects no overdue maintenance as a strength", () => {
    const noOverdue: MaintenanceRequest[] = [
      { id: "no1", homeId: HOME_ID, reportedDate: "2026-01-05", reportedBy: "Test", roomType: "bedroom", description: "Test", priority: "routine", status: "completed", completedDate: "2026-01-06", daysToResolve: 1 },
    ];
    const result = generateEnvironmentalQualityIntelligence(
      [], noOverdue, [], [], HOME_ID, PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.strengths.some((s) => s.toLowerCase().includes("no maintenance requests are overdue"))).toBe(true);
  });

  it("does not flag low inspection coverage when there are no inspections", () => {
    const result = generateEnvironmentalQualityIntelligence(
      [], [], [], [], HOME_ID, PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    const coverageIssue = result.areasForImprovement.some((a) =>
      a.includes("inspection areas covered"),
    );
    expect(coverageIssue).toBe(false);
  });
});
