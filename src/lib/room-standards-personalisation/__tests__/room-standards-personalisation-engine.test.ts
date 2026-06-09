// ══════════════════════════════════════════════════════════════════════════════
// TESTS — Room Standards & Personalisation Intelligence Engine
//
// Demo: Chamberlain House, 3 children (Alex 14, Jordan 13, Morgan 15),
// Staff: Sarah Johnson, Tom Richards, Lisa Williams, Darren Laville
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  pct,
  getRating,
  getRoomConditionLabel,
  getPersonalisationLevelLabel,
  getInspectionOutcomeLabel,
  getFurnitureConditionLabel,
  getRatingLabel,
  evaluateRoomConditions,
  evaluatePersonalisation,
  evaluateInspectionCompliance,
  evaluateStaffRoomReadiness,
  buildChildRoomProfiles,
  generateRoomStandardsPersonalisationIntelligence,
} from "../room-standards-personalisation-engine";
import type {
  RoomRecord,
  RoomInspection,
  RoomPolicy,
  StaffRoomTraining,
} from "../room-standards-personalisation-engine";

// ── Factory Helpers ────────────────────────────────────────────────────────

const makeRoom = (overrides: Partial<RoomRecord> = {}): RoomRecord => ({
  id: "room-001",
  childId: "child-alex",
  childName: "Alex",
  lastInspectionDate: "2026-05-10",
  roomCondition: "good",
  personalisationLevel: "personalised",
  childChosenDecor: true,
  adequateFurniture: true,
  furnitureCondition: "good",
  lockableStorage: true,
  adequateLighting: true,
  heatingAdequate: true,
  windowsSecure: true,
  privacyMeasures: true,
  ...overrides,
});

const makeInspection = (overrides: Partial<RoomInspection> = {}): RoomInspection => ({
  id: "insp-001",
  roomId: "room-001",
  inspectionDate: "2026-05-10",
  inspectedBy: "Darren Laville",
  outcome: "passed",
  issuesFound: [],
  repairsScheduled: false,
  repairsCompleted: false,
  ...overrides,
});

const makePolicy = (overrides: Partial<RoomPolicy> = {}): RoomPolicy => ({
  id: "rp-001",
  policyReviewDate: "2026-03-01",
  policyCurrent: true,
  minimumStandards: true,
  personalisationBudget: true,
  regularInspections: true,
  childInputRequired: true,
  repairTimescalesSet: true,
  safetyChecksIncluded: true,
  ...overrides,
});

const makeTraining = (overrides: Partial<StaffRoomTraining> = {}): StaffRoomTraining => ({
  id: "srt-001",
  staffId: "staff-sarah",
  staffName: "Sarah Johnson",
  roomStandards: true,
  personalisationImportance: true,
  privacyAwareness: true,
  maintenanceReporting: true,
  safetyChecks: true,
  childParticipation: true,
  ...overrides,
});

// ── Chamberlain House Demo Data ────────────────────────────────────────────────────

const OAK_HOUSE_ROOMS: RoomRecord[] = [
  makeRoom({
    id: "room-001",
    childId: "child-alex",
    childName: "Alex",
    roomCondition: "good",
    personalisationLevel: "highly_personalised",
    childChosenDecor: true,
    furnitureCondition: "good",
  }),
  makeRoom({
    id: "room-002",
    childId: "child-jordan",
    childName: "Jordan",
    roomCondition: "excellent",
    personalisationLevel: "personalised",
    childChosenDecor: true,
    furnitureCondition: "new",
  }),
  makeRoom({
    id: "room-003",
    childId: "child-morgan",
    childName: "Morgan",
    roomCondition: "good",
    personalisationLevel: "personalised",
    childChosenDecor: true,
    furnitureCondition: "good",
  }),
];

const OAK_HOUSE_INSPECTIONS: RoomInspection[] = [
  makeInspection({ id: "insp-001", roomId: "room-001", inspectionDate: "2026-05-10", outcome: "passed" }),
  makeInspection({ id: "insp-002", roomId: "room-002", inspectionDate: "2026-05-10", outcome: "passed" }),
  makeInspection({
    id: "insp-003",
    roomId: "room-003",
    inspectionDate: "2026-04-28",
    inspectedBy: "Sarah Johnson",
    outcome: "minor_issues",
    issuesFound: ["Small mark on wall near door"],
    repairsScheduled: true,
    repairsCompleted: true,
  }),
  makeInspection({ id: "insp-004", roomId: "room-001", inspectionDate: "2026-03-15", inspectedBy: "Sarah Johnson", outcome: "passed" }),
  makeInspection({ id: "insp-005", roomId: "room-002", inspectionDate: "2026-03-15", inspectedBy: "Tom Richards", outcome: "passed" }),
  makeInspection({ id: "insp-006", roomId: "room-003", inspectionDate: "2026-03-15", inspectedBy: "Tom Richards", outcome: "passed" }),
];

const OAK_HOUSE_TRAINING: StaffRoomTraining[] = [
  makeTraining({ id: "srt-001", staffId: "staff-sarah", staffName: "Sarah Johnson" }),
  makeTraining({ id: "srt-002", staffId: "staff-tom", staffName: "Tom Richards" }),
  makeTraining({ id: "srt-003", staffId: "staff-lisa", staffName: "Lisa Williams", childParticipation: false }),
  makeTraining({ id: "srt-004", staffId: "staff-darren", staffName: "Darren Laville" }),
];

const OAK_HOUSE_POLICY: RoomPolicy = makePolicy();

// ══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════════════════

describe("pct", () => {
  it("returns 0 when denominator is 0", () => {
    expect(pct(5, 0)).toBe(0);
  });

  it("returns 0 when numerator is 0", () => {
    expect(pct(0, 10)).toBe(0);
  });

  it("returns 100 when num equals den", () => {
    expect(pct(10, 10)).toBe(100);
  });

  it("returns 50 for half", () => {
    expect(pct(5, 10)).toBe(50);
  });

  it("rounds to nearest integer", () => {
    expect(pct(1, 3)).toBe(33);
    expect(pct(2, 3)).toBe(67);
  });
});

describe("getRating", () => {
  it("returns outstanding for score >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
    expect(getRating(95)).toBe("outstanding");
  });

  it("returns good for score >= 60 and < 80", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
  });

  it("returns requires_improvement for score >= 40 and < 60", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
  });

  it("returns inadequate for score < 40", () => {
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(39)).toBe("inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// LABEL GETTERS
// ══════════════════════════════════════════════════════════════════════════════

describe("getRoomConditionLabel", () => {
  it("returns Excellent for excellent", () => {
    expect(getRoomConditionLabel("excellent")).toBe("Excellent");
  });
  it("returns Good for good", () => {
    expect(getRoomConditionLabel("good")).toBe("Good");
  });
  it("returns Fair for fair", () => {
    expect(getRoomConditionLabel("fair")).toBe("Fair");
  });
  it("returns Poor for poor", () => {
    expect(getRoomConditionLabel("poor")).toBe("Poor");
  });
  it("returns Needs Repair for needs_repair", () => {
    expect(getRoomConditionLabel("needs_repair")).toBe("Needs Repair");
  });
});

describe("getPersonalisationLevelLabel", () => {
  it("returns Highly Personalised", () => {
    expect(getPersonalisationLevelLabel("highly_personalised")).toBe("Highly Personalised");
  });
  it("returns Personalised", () => {
    expect(getPersonalisationLevelLabel("personalised")).toBe("Personalised");
  });
  it("returns Some Personalisation", () => {
    expect(getPersonalisationLevelLabel("some_personalisation")).toBe("Some Personalisation");
  });
  it("returns Minimal", () => {
    expect(getPersonalisationLevelLabel("minimal")).toBe("Minimal");
  });
  it("returns None", () => {
    expect(getPersonalisationLevelLabel("none")).toBe("None");
  });
});

describe("getInspectionOutcomeLabel", () => {
  it("returns Passed", () => {
    expect(getInspectionOutcomeLabel("passed")).toBe("Passed");
  });
  it("returns Minor Issues", () => {
    expect(getInspectionOutcomeLabel("minor_issues")).toBe("Minor Issues");
  });
  it("returns Major Issues", () => {
    expect(getInspectionOutcomeLabel("major_issues")).toBe("Major Issues");
  });
  it("returns Failed", () => {
    expect(getInspectionOutcomeLabel("failed")).toBe("Failed");
  });
});

describe("getFurnitureConditionLabel", () => {
  it("returns New", () => {
    expect(getFurnitureConditionLabel("new")).toBe("New");
  });
  it("returns Good", () => {
    expect(getFurnitureConditionLabel("good")).toBe("Good");
  });
  it("returns Fair", () => {
    expect(getFurnitureConditionLabel("fair")).toBe("Fair");
  });
  it("returns Poor", () => {
    expect(getFurnitureConditionLabel("poor")).toBe("Poor");
  });
  it("returns Replacement Needed", () => {
    expect(getFurnitureConditionLabel("replacement_needed")).toBe("Replacement Needed");
  });
});

describe("getRatingLabel", () => {
  it("returns Outstanding", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
  });
  it("returns Good", () => {
    expect(getRatingLabel("good")).toBe("Good");
  });
  it("returns Requires Improvement", () => {
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
  });
  it("returns Inadequate", () => {
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// EVALUATOR 1: evaluateRoomConditions
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateRoomConditions", () => {
  it("returns 0 for empty rooms", () => {
    const result = evaluateRoomConditions([]);
    expect(result.score).toBe(0);
    expect(result.totalRooms).toBe(0);
    expect(result.concerns.length).toBeGreaterThan(0);
  });

  it("returns max 25 for perfect rooms", () => {
    const rooms = [
      makeRoom({ roomCondition: "excellent", furnitureCondition: "new" }),
      makeRoom({ id: "room-002", childId: "child-jordan", childName: "Jordan", roomCondition: "good", furnitureCondition: "good" }),
    ];
    const result = evaluateRoomConditions(rooms);
    expect(result.score).toBe(25);
    expect(result.roomConditionGoodPlusRate).toBe(100);
    expect(result.furnitureGoodPlusRate).toBe(100);
    expect(result.essentialAmenitiesRate).toBe(100);
    expect(result.privacyWindowsRate).toBe(100);
  });

  it("scores room condition good+ correctly", () => {
    const rooms = [
      makeRoom({ roomCondition: "excellent" }),
      makeRoom({ id: "room-002", childId: "child-jordan", roomCondition: "good" }),
      makeRoom({ id: "room-003", childId: "child-morgan", roomCondition: "fair" }),
    ];
    const result = evaluateRoomConditions(rooms);
    expect(result.roomConditionGoodPlusRate).toBe(67);
  });

  it("scores furniture condition good+ correctly", () => {
    const rooms = [
      makeRoom({ furnitureCondition: "new" }),
      makeRoom({ id: "room-002", childId: "child-jordan", furnitureCondition: "fair" }),
    ];
    const result = evaluateRoomConditions(rooms);
    expect(result.furnitureGoodPlusRate).toBe(50);
  });

  it("scores essential amenities correctly", () => {
    const rooms = [
      makeRoom({ lockableStorage: true, adequateLighting: true, heatingAdequate: true }),
      makeRoom({ id: "room-002", childId: "child-jordan", lockableStorage: false, adequateLighting: true, heatingAdequate: false }),
    ];
    const result = evaluateRoomConditions(rooms);
    expect(result.essentialAmenitiesRate).toBe(50);
  });

  it("scores privacy and windows correctly", () => {
    const rooms = [
      makeRoom({ privacyMeasures: true, windowsSecure: true }),
      makeRoom({ id: "room-002", childId: "child-jordan", privacyMeasures: false, windowsSecure: true }),
    ];
    const result = evaluateRoomConditions(rooms);
    expect(result.privacyWindowsRate).toBe(50);
  });

  it("never exceeds 25", () => {
    const rooms = Array.from({ length: 20 }, (_, i) =>
      makeRoom({ id: `room-${i}`, childId: `child-${i}`, roomCondition: "excellent", furnitureCondition: "new" }),
    );
    const result = evaluateRoomConditions(rooms);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("generates strength for high room condition rate", () => {
    const rooms = [
      makeRoom({ roomCondition: "excellent" }),
      makeRoom({ id: "room-002", childId: "child-jordan", roomCondition: "good" }),
    ];
    const result = evaluateRoomConditions(rooms);
    expect(result.strengths.some((s) => s.includes("room conditions"))).toBe(true);
  });

  it("generates concern for low room condition rate", () => {
    const rooms = [
      makeRoom({ roomCondition: "poor" }),
      makeRoom({ id: "room-002", childId: "child-jordan", roomCondition: "needs_repair" }),
      makeRoom({ id: "room-003", childId: "child-morgan", roomCondition: "fair" }),
    ];
    const result = evaluateRoomConditions(rooms);
    expect(result.concerns.some((c) => c.includes("maintenance review"))).toBe(true);
  });

  it("generates concern for low essential amenities rate", () => {
    const rooms = [
      makeRoom({ lockableStorage: false, adequateLighting: false, heatingAdequate: false }),
      makeRoom({ id: "room-002", childId: "child-jordan", lockableStorage: false, adequateLighting: false, heatingAdequate: false }),
    ];
    const result = evaluateRoomConditions(rooms);
    expect(result.concerns.some((c) => c.includes("lockable storage"))).toBe(true);
  });

  it("generates concern for low privacy rate", () => {
    const rooms = [
      makeRoom({ privacyMeasures: false, windowsSecure: false }),
      makeRoom({ id: "room-002", childId: "child-jordan", privacyMeasures: false, windowsSecure: false }),
    ];
    const result = evaluateRoomConditions(rooms);
    expect(result.concerns.some((c) => c.includes("UNCRC Article 16"))).toBe(true);
  });

  it("handles Chamberlain House demo rooms", () => {
    const result = evaluateRoomConditions(OAK_HOUSE_ROOMS);
    expect(result.totalRooms).toBe(3);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// EVALUATOR 2: evaluatePersonalisation
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluatePersonalisation", () => {
  it("returns 0 for empty rooms", () => {
    const result = evaluatePersonalisation([]);
    expect(result.score).toBe(0);
    expect(result.totalRooms).toBe(0);
    expect(result.concerns.length).toBeGreaterThan(0);
  });

  it("returns max 25 for perfectly personalised rooms", () => {
    const rooms = [
      makeRoom({ personalisationLevel: "highly_personalised", childChosenDecor: true }),
      makeRoom({ id: "room-002", childId: "child-jordan", personalisationLevel: "highly_personalised", childChosenDecor: true }),
    ];
    const result = evaluatePersonalisation(rooms);
    expect(result.score).toBe(25);
    expect(result.personalisationGoodPlusRate).toBe(100);
    expect(result.childChosenDecorRate).toBe(100);
    expect(result.highPersonalisationRate).toBe(100);
    expect(result.allPersonalisedRate).toBe(100);
  });

  it("scores personalisation good+ correctly", () => {
    const rooms = [
      makeRoom({ personalisationLevel: "highly_personalised" }),
      makeRoom({ id: "room-002", childId: "child-jordan", personalisationLevel: "personalised" }),
      makeRoom({ id: "room-003", childId: "child-morgan", personalisationLevel: "minimal" }),
    ];
    const result = evaluatePersonalisation(rooms);
    expect(result.personalisationGoodPlusRate).toBe(67);
  });

  it("scores child chosen decor correctly", () => {
    const rooms = [
      makeRoom({ childChosenDecor: true }),
      makeRoom({ id: "room-002", childId: "child-jordan", childChosenDecor: false }),
    ];
    const result = evaluatePersonalisation(rooms);
    expect(result.childChosenDecorRate).toBe(50);
  });

  it("scores high personalisation rate correctly", () => {
    const rooms = [
      makeRoom({ personalisationLevel: "highly_personalised" }),
      makeRoom({ id: "room-002", childId: "child-jordan", personalisationLevel: "personalised" }),
    ];
    const result = evaluatePersonalisation(rooms);
    expect(result.highPersonalisationRate).toBe(50);
  });

  it("scores all personalised rate correctly", () => {
    const rooms = [
      makeRoom({ personalisationLevel: "minimal" }),
      makeRoom({ id: "room-002", childId: "child-jordan", personalisationLevel: "none" }),
    ];
    const result = evaluatePersonalisation(rooms);
    expect(result.allPersonalisedRate).toBe(50);
  });

  it("never exceeds 25", () => {
    const rooms = Array.from({ length: 20 }, (_, i) =>
      makeRoom({ id: `room-${i}`, childId: `child-${i}`, personalisationLevel: "highly_personalised", childChosenDecor: true }),
    );
    const result = evaluatePersonalisation(rooms);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("generates strength for high personalisation rate", () => {
    const rooms = [
      makeRoom({ personalisationLevel: "highly_personalised" }),
      makeRoom({ id: "room-002", childId: "child-jordan", personalisationLevel: "personalised" }),
    ];
    const result = evaluatePersonalisation(rooms);
    expect(result.strengths.some((s) => s.includes("personalisation"))).toBe(true);
  });

  it("generates concern for low personalisation", () => {
    const rooms = [
      makeRoom({ personalisationLevel: "minimal" }),
      makeRoom({ id: "room-002", childId: "child-jordan", personalisationLevel: "none" }),
      makeRoom({ id: "room-003", childId: "child-morgan", personalisationLevel: "none" }),
    ];
    const result = evaluatePersonalisation(rooms);
    expect(result.concerns.some((c) => c.includes("institutional"))).toBe(true);
  });

  it("generates concern for unpersonalised rooms", () => {
    const rooms = [
      makeRoom({ personalisationLevel: "none" }),
    ];
    const result = evaluatePersonalisation(rooms);
    expect(result.concerns.some((c) => c.includes("no personalisation"))).toBe(true);
  });

  it("generates strength when all rooms personalised", () => {
    const rooms = [
      makeRoom({ personalisationLevel: "highly_personalised" }),
      makeRoom({ id: "room-002", childId: "child-jordan", personalisationLevel: "personalised" }),
    ];
    const result = evaluatePersonalisation(rooms);
    expect(result.strengths.some((s) => s.includes("All rooms"))).toBe(true);
  });

  it("generates concern for low child chosen decor", () => {
    const rooms = [
      makeRoom({ childChosenDecor: false }),
      makeRoom({ id: "room-002", childId: "child-jordan", childChosenDecor: false }),
      makeRoom({ id: "room-003", childId: "child-morgan", childChosenDecor: false }),
    ];
    const result = evaluatePersonalisation(rooms);
    expect(result.concerns.some((c) => c.includes("Child-chosen decor"))).toBe(true);
  });

  it("handles Chamberlain House demo rooms", () => {
    const result = evaluatePersonalisation(OAK_HOUSE_ROOMS);
    expect(result.totalRooms).toBe(3);
    expect(result.score).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// EVALUATOR 3: evaluateInspectionCompliance
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateInspectionCompliance", () => {
  it("returns 0 for empty inspections", () => {
    const result = evaluateInspectionCompliance([]);
    expect(result.score).toBe(0);
    expect(result.totalInspections).toBe(0);
    expect(result.concerns.length).toBeGreaterThan(0);
  });

  it("returns max 25 for perfect inspections", () => {
    const inspections = Array.from({ length: 6 }, (_, i) =>
      makeInspection({ id: `insp-${i}`, roomId: `room-${i}`, outcome: "passed" }),
    );
    const result = evaluateInspectionCompliance(inspections);
    expect(result.score).toBe(25);
    expect(result.passRate).toBe(100);
  });

  it("scores pass rate correctly", () => {
    const inspections = [
      makeInspection({ outcome: "passed" }),
      makeInspection({ id: "insp-002", outcome: "minor_issues", issuesFound: ["test"], repairsScheduled: true }),
      makeInspection({ id: "insp-003", outcome: "failed", issuesFound: ["big issue"], repairsScheduled: true }),
    ];
    const result = evaluateInspectionCompliance(inspections);
    expect(result.passRate).toBe(33);
  });

  it("scores issues scheduled rate correctly", () => {
    const inspections = [
      makeInspection({ outcome: "minor_issues", issuesFound: ["issue1"], repairsScheduled: true }),
      makeInspection({ id: "insp-002", outcome: "major_issues", issuesFound: ["issue2"], repairsScheduled: false }),
    ];
    const result = evaluateInspectionCompliance(inspections);
    expect(result.issuesScheduledRate).toBe(50);
  });

  it("scores repairs completed rate correctly", () => {
    const inspections = [
      makeInspection({ outcome: "minor_issues", issuesFound: ["issue1"], repairsScheduled: true, repairsCompleted: true }),
      makeInspection({ id: "insp-002", outcome: "minor_issues", issuesFound: ["issue2"], repairsScheduled: true, repairsCompleted: false }),
    ];
    const result = evaluateInspectionCompliance(inspections);
    expect(result.repairsCompletedRate).toBe(50);
  });

  it("caps inspection frequency at 6", () => {
    const inspections = Array.from({ length: 10 }, (_, i) =>
      makeInspection({ id: `insp-${i}`, outcome: "passed" }),
    );
    const result = evaluateInspectionCompliance(inspections);
    expect(result.inspectionFrequency).toBe(6);
  });

  it("never exceeds 25", () => {
    const inspections = Array.from({ length: 20 }, (_, i) =>
      makeInspection({ id: `insp-${i}`, outcome: "passed" }),
    );
    const result = evaluateInspectionCompliance(inspections);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("generates strength for high pass rate", () => {
    const inspections = Array.from({ length: 6 }, (_, i) =>
      makeInspection({ id: `insp-${i}`, outcome: "passed" }),
    );
    const result = evaluateInspectionCompliance(inspections);
    expect(result.strengths.some((s) => s.includes("pass rate"))).toBe(true);
  });

  it("generates concern for low pass rate", () => {
    const inspections = [
      makeInspection({ outcome: "failed", issuesFound: ["bad"] }),
      makeInspection({ id: "insp-002", outcome: "failed", issuesFound: ["bad2"] }),
      makeInspection({ id: "insp-003", outcome: "major_issues", issuesFound: ["bad3"] }),
    ];
    const result = evaluateInspectionCompliance(inspections);
    expect(result.concerns.some((c) => c.includes("pass rate"))).toBe(true);
  });

  it("generates concern for low inspection frequency", () => {
    const inspections = [
      makeInspection({ outcome: "passed" }),
    ];
    const result = evaluateInspectionCompliance(inspections);
    expect(result.concerns.some((c) => c.includes("inspection frequency"))).toBe(true);
  });

  it("generates strength for regular inspections", () => {
    const inspections = Array.from({ length: 6 }, (_, i) =>
      makeInspection({ id: `insp-${i}`, outcome: "passed" }),
    );
    const result = evaluateInspectionCompliance(inspections);
    expect(result.strengths.some((s) => s.includes("Regular inspections"))).toBe(true);
  });

  it("handles issues scheduled when no issues found", () => {
    const inspections = [
      makeInspection({ outcome: "passed", issuesFound: [] }),
    ];
    const result = evaluateInspectionCompliance(inspections);
    // No issues = issuesScheduledRate should be 0 (0/0 = 0 via pct)
    expect(result.issuesScheduledRate).toBe(0);
  });

  it("handles repairs completed when none scheduled", () => {
    const inspections = [
      makeInspection({ outcome: "passed", repairsScheduled: false }),
    ];
    const result = evaluateInspectionCompliance(inspections);
    expect(result.repairsCompletedRate).toBe(0);
  });

  it("handles Chamberlain House demo inspections", () => {
    const result = evaluateInspectionCompliance(OAK_HOUSE_INSPECTIONS);
    expect(result.totalInspections).toBe(6);
    expect(result.score).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// EVALUATOR 4: evaluateStaffRoomReadiness
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateStaffRoomReadiness", () => {
  it("returns 0 for empty training", () => {
    const result = evaluateStaffRoomReadiness([]);
    expect(result.score).toBe(0);
    expect(result.totalStaff).toBe(0);
    expect(result.concerns.length).toBeGreaterThan(0);
  });

  it("returns max 25 for perfectly trained staff", () => {
    const training = [
      makeTraining(),
      makeTraining({ id: "srt-002", staffId: "staff-tom", staffName: "Tom Richards" }),
    ];
    const result = evaluateStaffRoomReadiness(training);
    expect(result.score).toBe(25);
    expect(result.roomStandardsRate).toBe(100);
    expect(result.personalisationImportanceRate).toBe(100);
    expect(result.privacyAwarenessRate).toBe(100);
    expect(result.maintenanceReportingRate).toBe(100);
    expect(result.safetyChecksRate).toBe(100);
    expect(result.childParticipationRate).toBe(100);
  });

  it("scores room standards rate correctly", () => {
    const training = [
      makeTraining({ roomStandards: true }),
      makeTraining({ id: "srt-002", staffId: "staff-tom", roomStandards: false }),
    ];
    const result = evaluateStaffRoomReadiness(training);
    expect(result.roomStandardsRate).toBe(50);
  });

  it("scores personalisation importance rate correctly", () => {
    const training = [
      makeTraining({ personalisationImportance: true }),
      makeTraining({ id: "srt-002", staffId: "staff-tom", personalisationImportance: false }),
    ];
    const result = evaluateStaffRoomReadiness(training);
    expect(result.personalisationImportanceRate).toBe(50);
  });

  it("scores privacy awareness rate correctly", () => {
    const training = [
      makeTraining({ privacyAwareness: true }),
      makeTraining({ id: "srt-002", staffId: "staff-tom", privacyAwareness: false }),
    ];
    const result = evaluateStaffRoomReadiness(training);
    expect(result.privacyAwarenessRate).toBe(50);
  });

  it("scores maintenance reporting rate correctly", () => {
    const training = [
      makeTraining({ maintenanceReporting: true }),
      makeTraining({ id: "srt-002", staffId: "staff-tom", maintenanceReporting: false }),
    ];
    const result = evaluateStaffRoomReadiness(training);
    expect(result.maintenanceReportingRate).toBe(50);
  });

  it("scores safety checks rate correctly", () => {
    const training = [
      makeTraining({ safetyChecks: true }),
      makeTraining({ id: "srt-002", staffId: "staff-tom", safetyChecks: false }),
    ];
    const result = evaluateStaffRoomReadiness(training);
    expect(result.safetyChecksRate).toBe(50);
  });

  it("scores child participation rate correctly", () => {
    const training = [
      makeTraining({ childParticipation: true }),
      makeTraining({ id: "srt-002", staffId: "staff-tom", childParticipation: false }),
    ];
    const result = evaluateStaffRoomReadiness(training);
    expect(result.childParticipationRate).toBe(50);
  });

  it("applies correct weight: roomStandards=6", () => {
    const training = [
      makeTraining({
        roomStandards: true,
        personalisationImportance: false,
        privacyAwareness: false,
        maintenanceReporting: false,
        safetyChecks: false,
        childParticipation: false,
      }),
    ];
    const result = evaluateStaffRoomReadiness(training);
    expect(result.score).toBe(6);
  });

  it("applies correct weight: personalisationImportance=5", () => {
    const training = [
      makeTraining({
        roomStandards: false,
        personalisationImportance: true,
        privacyAwareness: false,
        maintenanceReporting: false,
        safetyChecks: false,
        childParticipation: false,
      }),
    ];
    const result = evaluateStaffRoomReadiness(training);
    expect(result.score).toBe(5);
  });

  it("applies correct weight: privacyAwareness=4", () => {
    const training = [
      makeTraining({
        roomStandards: false,
        personalisationImportance: false,
        privacyAwareness: true,
        maintenanceReporting: false,
        safetyChecks: false,
        childParticipation: false,
      }),
    ];
    const result = evaluateStaffRoomReadiness(training);
    expect(result.score).toBe(4);
  });

  it("applies correct weight: maintenanceReporting=4", () => {
    const training = [
      makeTraining({
        roomStandards: false,
        personalisationImportance: false,
        privacyAwareness: false,
        maintenanceReporting: true,
        safetyChecks: false,
        childParticipation: false,
      }),
    ];
    const result = evaluateStaffRoomReadiness(training);
    expect(result.score).toBe(4);
  });

  it("applies correct weight: safetyChecks=3", () => {
    const training = [
      makeTraining({
        roomStandards: false,
        personalisationImportance: false,
        privacyAwareness: false,
        maintenanceReporting: false,
        safetyChecks: true,
        childParticipation: false,
      }),
    ];
    const result = evaluateStaffRoomReadiness(training);
    expect(result.score).toBe(3);
  });

  it("applies correct weight: childParticipation=3", () => {
    const training = [
      makeTraining({
        roomStandards: false,
        personalisationImportance: false,
        privacyAwareness: false,
        maintenanceReporting: false,
        safetyChecks: false,
        childParticipation: true,
      }),
    ];
    const result = evaluateStaffRoomReadiness(training);
    expect(result.score).toBe(3);
  });

  it("never exceeds 25", () => {
    const training = Array.from({ length: 20 }, (_, i) =>
      makeTraining({ id: `srt-${i}`, staffId: `staff-${i}` }),
    );
    const result = evaluateStaffRoomReadiness(training);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("generates strength for high room standards rate", () => {
    const training = [makeTraining(), makeTraining({ id: "srt-002", staffId: "staff-tom" })];
    const result = evaluateStaffRoomReadiness(training);
    expect(result.strengths.some((s) => s.includes("Room standards training"))).toBe(true);
  });

  it("generates concern for low room standards rate", () => {
    const training = [
      makeTraining({ roomStandards: false }),
      makeTraining({ id: "srt-002", staffId: "staff-tom", roomStandards: false }),
    ];
    const result = evaluateStaffRoomReadiness(training);
    expect(result.concerns.some((c) => c.includes("Room standards training"))).toBe(true);
  });

  it("generates concern for low privacy awareness", () => {
    const training = [
      makeTraining({ privacyAwareness: false }),
      makeTraining({ id: "srt-002", staffId: "staff-tom", privacyAwareness: false }),
    ];
    const result = evaluateStaffRoomReadiness(training);
    expect(result.concerns.some((c) => c.includes("Privacy awareness"))).toBe(true);
  });

  it("handles Chamberlain House demo training", () => {
    const result = evaluateStaffRoomReadiness(OAK_HOUSE_TRAINING);
    expect(result.totalStaff).toBe(4);
    expect(result.score).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// buildChildRoomProfiles
// ══════════════════════════════════════════════════════════════════════════════

describe("buildChildRoomProfiles", () => {
  it("returns empty array for empty rooms", () => {
    const result = buildChildRoomProfiles([], []);
    expect(result).toEqual([]);
  });

  it("creates one profile per room", () => {
    const result = buildChildRoomProfiles(OAK_HOUSE_ROOMS, OAK_HOUSE_INSPECTIONS);
    expect(result.length).toBe(3);
  });

  it("includes child details from room", () => {
    const result = buildChildRoomProfiles([makeRoom()], []);
    expect(result[0].childId).toBe("child-alex");
    expect(result[0].childName).toBe("Alex");
    expect(result[0].roomCondition).toBe("good");
    expect(result[0].personalisationLevel).toBe("personalised");
    expect(result[0].childChosenDecor).toBe(true);
  });

  it("counts inspections for the room", () => {
    const rooms = [makeRoom({ id: "room-001" })];
    const inspections = [
      makeInspection({ roomId: "room-001" }),
      makeInspection({ id: "insp-002", roomId: "room-001" }),
      makeInspection({ id: "insp-003", roomId: "room-999" }), // Different room
    ];
    const result = buildChildRoomProfiles(rooms, inspections);
    expect(result[0].inspectionCount).toBe(2);
  });

  it("gets last inspection outcome sorted by date", () => {
    const rooms = [makeRoom({ id: "room-001" })];
    const inspections = [
      makeInspection({ roomId: "room-001", inspectionDate: "2026-03-01", outcome: "failed" }),
      makeInspection({ id: "insp-002", roomId: "room-001", inspectionDate: "2026-05-01", outcome: "passed" }),
    ];
    const result = buildChildRoomProfiles(rooms, inspections);
    expect(result[0].lastInspectionOutcome).toBe("passed");
  });

  it("returns null lastInspectionOutcome when no inspections", () => {
    const result = buildChildRoomProfiles([makeRoom()], []);
    expect(result[0].lastInspectionOutcome).toBeNull();
  });

  it("calculates max room score for perfect room", () => {
    const room = makeRoom({
      roomCondition: "excellent",
      personalisationLevel: "highly_personalised",
      childChosenDecor: true,
      lockableStorage: true,
      adequateLighting: true,
      heatingAdequate: true,
      privacyMeasures: true,
      windowsSecure: true,
      furnitureCondition: "new",
    });
    const result = buildChildRoomProfiles([room], []);
    expect(result[0].roomScore).toBe(10);
  });

  it("calculates low room score for poor room", () => {
    const room = makeRoom({
      roomCondition: "poor",
      personalisationLevel: "none",
      childChosenDecor: false,
      lockableStorage: false,
      adequateLighting: false,
      heatingAdequate: false,
      privacyMeasures: false,
      windowsSecure: false,
      furnitureCondition: "replacement_needed",
    });
    const result = buildChildRoomProfiles([room], []);
    expect(result[0].roomScore).toBe(0);
  });

  it("scores room condition excellent as 3", () => {
    const room = makeRoom({
      roomCondition: "excellent",
      personalisationLevel: "none",
      childChosenDecor: false,
      lockableStorage: false,
      adequateLighting: false,
      heatingAdequate: false,
      privacyMeasures: false,
      windowsSecure: false,
      furnitureCondition: "replacement_needed",
    });
    const result = buildChildRoomProfiles([room], []);
    expect(result[0].roomScore).toBe(3);
  });

  it("scores room condition good as 2", () => {
    const room = makeRoom({
      roomCondition: "good",
      personalisationLevel: "none",
      childChosenDecor: false,
      lockableStorage: false,
      adequateLighting: false,
      heatingAdequate: false,
      privacyMeasures: false,
      windowsSecure: false,
      furnitureCondition: "replacement_needed",
    });
    const result = buildChildRoomProfiles([room], []);
    expect(result[0].roomScore).toBe(2);
  });

  it("scores room condition fair as 1", () => {
    const room = makeRoom({
      roomCondition: "fair",
      personalisationLevel: "none",
      childChosenDecor: false,
      lockableStorage: false,
      adequateLighting: false,
      heatingAdequate: false,
      privacyMeasures: false,
      windowsSecure: false,
      furnitureCondition: "replacement_needed",
    });
    const result = buildChildRoomProfiles([room], []);
    expect(result[0].roomScore).toBe(1);
  });

  it("clamps room score between 0 and 10", () => {
    const room = makeRoom({
      roomCondition: "poor",
      personalisationLevel: "none",
      childChosenDecor: false,
      lockableStorage: false,
      adequateLighting: false,
      heatingAdequate: false,
      privacyMeasures: false,
      windowsSecure: false,
      furnitureCondition: "replacement_needed",
    });
    const result = buildChildRoomProfiles([room], []);
    expect(result[0].roomScore).toBeGreaterThanOrEqual(0);
    expect(result[0].roomScore).toBeLessThanOrEqual(10);
  });

  it("handles Chamberlain House profiles", () => {
    const result = buildChildRoomProfiles(OAK_HOUSE_ROOMS, OAK_HOUSE_INSPECTIONS);
    expect(result.length).toBe(3);
    result.forEach((p) => {
      expect(p.roomScore).toBeGreaterThanOrEqual(0);
      expect(p.roomScore).toBeLessThanOrEqual(10);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// generateRoomStandardsPersonalisationIntelligence
// ══════════════════════════════════════════════════════════════════════════════

describe("generateRoomStandardsPersonalisationIntelligence", () => {
  it("returns complete intelligence object", () => {
    const result = generateRoomStandardsPersonalisationIntelligence(
      OAK_HOUSE_ROOMS,
      OAK_HOUSE_INSPECTIONS,
      OAK_HOUSE_POLICY,
      OAK_HOUSE_TRAINING,
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-19");
    expect(result.assessedAt).toBeTruthy();
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.rating).toBeTruthy();
    expect(result.roomConditions).toBeTruthy();
    expect(result.personalisation).toBeTruthy();
    expect(result.inspectionCompliance).toBeTruthy();
    expect(result.staffRoomReadiness).toBeTruthy();
    expect(result.childRoomProfiles).toBeTruthy();
    expect(result.strengths).toBeTruthy();
    expect(result.areasForImprovement).toBeTruthy();
    expect(result.actions).toBeTruthy();
    expect(result.regulatoryLinks).toBeTruthy();
  });

  it("overall score is sum of 4 evaluators", () => {
    const result = generateRoomStandardsPersonalisationIntelligence(
      OAK_HOUSE_ROOMS,
      OAK_HOUSE_INSPECTIONS,
      OAK_HOUSE_POLICY,
      OAK_HOUSE_TRAINING,
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    const expected = Math.round(
      result.roomConditions.score +
      result.personalisation.score +
      result.inspectionCompliance.score +
      result.staffRoomReadiness.score,
    );
    expect(result.overallScore).toBe(expected);
  });

  it("overall score caps at 100", () => {
    const result = generateRoomStandardsPersonalisationIntelligence(
      OAK_HOUSE_ROOMS,
      OAK_HOUSE_INSPECTIONS,
      OAK_HOUSE_POLICY,
      OAK_HOUSE_TRAINING,
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("returns outstanding rating for high scores", () => {
    const rooms = [
      makeRoom({ roomCondition: "excellent", personalisationLevel: "highly_personalised", furnitureCondition: "new" }),
      makeRoom({ id: "room-002", childId: "child-jordan", roomCondition: "excellent", personalisationLevel: "highly_personalised", furnitureCondition: "new" }),
    ];
    const inspections = Array.from({ length: 6 }, (_, i) =>
      makeInspection({ id: `insp-${i}`, outcome: "passed" }),
    );
    const training = [makeTraining(), makeTraining({ id: "srt-002", staffId: "staff-tom" })];

    const result = generateRoomStandardsPersonalisationIntelligence(
      rooms, inspections, makePolicy(), training, "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.rating).toBe("outstanding");
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
  });

  it("returns inadequate rating for low scores", () => {
    const result = generateRoomStandardsPersonalisationIntelligence(
      [], [], null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.rating).toBe("inadequate");
    expect(result.overallScore).toBe(0);
  });

  it("returns good rating for moderate scores", () => {
    // Need rooms but few inspections and some training gaps
    const rooms = [
      makeRoom({ roomCondition: "good", personalisationLevel: "personalised" }),
      makeRoom({ id: "room-002", childId: "child-jordan", roomCondition: "good", personalisationLevel: "personalised" }),
    ];
    const inspections = Array.from({ length: 4 }, (_, i) =>
      makeInspection({ id: `insp-${i}`, outcome: "passed" }),
    );
    const training = [
      makeTraining(),
      makeTraining({ id: "srt-002", staffId: "staff-tom", childParticipation: false, safetyChecks: false }),
    ];
    const result = generateRoomStandardsPersonalisationIntelligence(
      rooms, inspections, makePolicy(), training, "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(60);
    expect(result.overallScore).toBeLessThan(100);
  });

  it("includes all 7 regulatory links", () => {
    const result = generateRoomStandardsPersonalisationIntelligence(
      OAK_HOUSE_ROOMS, OAK_HOUSE_INSPECTIONS, OAK_HOUSE_POLICY, OAK_HOUSE_TRAINING,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.regulatoryLinks.length).toBe(7);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015, Reg 25"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015, Reg 27"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("NMS 10"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("UNCRC Article 16"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Children Act 1989"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Health and Safety at Work Act 1974"))).toBe(true);
  });

  it("generates strengths for high-scoring homes", () => {
    const rooms = [
      makeRoom({ roomCondition: "excellent", personalisationLevel: "highly_personalised", furnitureCondition: "new" }),
      makeRoom({ id: "room-002", childId: "child-jordan", roomCondition: "excellent", personalisationLevel: "highly_personalised", furnitureCondition: "new" }),
    ];
    const inspections = Array.from({ length: 6 }, (_, i) =>
      makeInspection({ id: `insp-${i}`, outcome: "passed" }),
    );
    const training = [makeTraining(), makeTraining({ id: "srt-002", staffId: "staff-tom" })];

    const result = generateRoomStandardsPersonalisationIntelligence(
      rooms, inspections, makePolicy(), training, "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.strengths.some((s) => s.includes("Outstanding"))).toBe(true);
  });

  it("generates areas for improvement for low-scoring homes", () => {
    const result = generateRoomStandardsPersonalisationIntelligence(
      [], [], null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
    expect(result.areasForImprovement.some((a) => a.includes("Inadequate"))).toBe(true);
  });

  it("generates areas for improvement for requires_improvement score", () => {
    // Need score between 40-59: rooms give some points, inspections give some, training gives some
    const rooms = [
      makeRoom({ roomCondition: "good", personalisationLevel: "some_personalisation", furnitureCondition: "fair", childChosenDecor: false }),
      makeRoom({ id: "room-002", childId: "child-jordan", roomCondition: "fair", personalisationLevel: "minimal", furnitureCondition: "fair", childChosenDecor: false }),
    ];
    const inspections = [
      makeInspection({ outcome: "passed" }),
      makeInspection({ id: "insp-002", outcome: "minor_issues", issuesFound: ["issue"], repairsScheduled: true, repairsCompleted: false }),
    ];
    const training = [
      makeTraining({ roomStandards: true, personalisationImportance: false, privacyAwareness: false, maintenanceReporting: true, safetyChecks: false, childParticipation: false }),
    ];
    const result = generateRoomStandardsPersonalisationIntelligence(
      rooms, inspections, makePolicy({ policyCurrent: true }), training, "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(40);
    expect(result.overallScore).toBeLessThan(60);
    expect(result.areasForImprovement.some((a) => a.includes("Requires Improvement"))).toBe(true);
  });

  it("generates urgent actions for rooms needing repair", () => {
    const rooms = [makeRoom({ roomCondition: "needs_repair" })];
    const result = generateRoomStandardsPersonalisationIntelligence(
      rooms, [], makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.actions.some((a) => a.includes("URGENT") && a.includes("repair"))).toBe(true);
  });

  it("generates urgent actions for unpersonalised rooms", () => {
    const rooms = [makeRoom({ personalisationLevel: "none" })];
    const result = generateRoomStandardsPersonalisationIntelligence(
      rooms, [], makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.actions.some((a) => a.includes("URGENT") && a.includes("no personalisation"))).toBe(true);
  });

  it("generates actions for furniture replacement", () => {
    const rooms = [makeRoom({ furnitureCondition: "replacement_needed" })];
    const result = generateRoomStandardsPersonalisationIntelligence(
      rooms, [], makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.actions.some((a) => a.includes("furniture replacement"))).toBe(true);
  });

  it("generates actions for missing lockable storage", () => {
    const rooms = [makeRoom({ lockableStorage: false })];
    const result = generateRoomStandardsPersonalisationIntelligence(
      rooms, [], makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.actions.some((a) => a.includes("lockable storage"))).toBe(true);
  });

  it("generates actions for low inspection count", () => {
    const result = generateRoomStandardsPersonalisationIntelligence(
      OAK_HOUSE_ROOMS, [makeInspection()], makePolicy(), OAK_HOUSE_TRAINING,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.actions.some((a) => a.includes("inspection"))).toBe(true);
  });

  it("generates actions for missing privacy measures", () => {
    const rooms = [makeRoom({ privacyMeasures: false })];
    const result = generateRoomStandardsPersonalisationIntelligence(
      rooms, [], makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.actions.some((a) => a.includes("privacy measures"))).toBe(true);
  });

  it("generates actions for policy not current", () => {
    const result = generateRoomStandardsPersonalisationIntelligence(
      OAK_HOUSE_ROOMS, OAK_HOUSE_INSPECTIONS, null, OAK_HOUSE_TRAINING,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.actions.some((a) => a.includes("policy"))).toBe(true);
  });

  it("generates no immediate actions message when everything is good", () => {
    const rooms = [
      makeRoom({ roomCondition: "excellent", personalisationLevel: "highly_personalised", furnitureCondition: "new" }),
      makeRoom({ id: "room-002", childId: "child-jordan", roomCondition: "excellent", personalisationLevel: "highly_personalised", furnitureCondition: "new" }),
    ];
    const inspections = Array.from({ length: 6 }, (_, i) =>
      makeInspection({ id: `insp-${i}`, outcome: "passed" }),
    );
    const training = [makeTraining(), makeTraining({ id: "srt-002", staffId: "staff-tom" })];

    const result = generateRoomStandardsPersonalisationIntelligence(
      rooms, inspections, makePolicy(), training, "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.actions.some((a) => a.includes("No immediate actions"))).toBe(true);
  });

  it("generates actions for low child chosen decor rate", () => {
    const rooms = [
      makeRoom({ childChosenDecor: false }),
      makeRoom({ id: "room-002", childId: "child-jordan", childChosenDecor: false }),
      makeRoom({ id: "room-003", childId: "child-morgan", childChosenDecor: false }),
    ];
    const inspections = Array.from({ length: 6 }, (_, i) =>
      makeInspection({ id: `insp-${i}`, outcome: "passed" }),
    );
    const result = generateRoomStandardsPersonalisationIntelligence(
      rooms, inspections, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.actions.some((a) => a.includes("child-chosen decor") || a.includes("involve children"))).toBe(true);
  });

  it("generates actions for children with low room scores", () => {
    const rooms = [makeRoom({
      roomCondition: "poor",
      personalisationLevel: "none",
      childChosenDecor: false,
      lockableStorage: false,
      adequateLighting: false,
      heatingAdequate: false,
      privacyMeasures: false,
      windowsSecure: false,
      furnitureCondition: "replacement_needed",
    })];
    const result = generateRoomStandardsPersonalisationIntelligence(
      rooms, [], makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.actions.some((a) => a.includes("low room scores"))).toBe(true);
  });

  it("builds correct number of child profiles", () => {
    const result = generateRoomStandardsPersonalisationIntelligence(
      OAK_HOUSE_ROOMS, OAK_HOUSE_INSPECTIONS, OAK_HOUSE_POLICY, OAK_HOUSE_TRAINING,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.childRoomProfiles.length).toBe(3);
  });

  it("each evaluator score caps at 25", () => {
    const result = generateRoomStandardsPersonalisationIntelligence(
      OAK_HOUSE_ROOMS, OAK_HOUSE_INSPECTIONS, OAK_HOUSE_POLICY, OAK_HOUSE_TRAINING,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.roomConditions.score).toBeLessThanOrEqual(25);
    expect(result.personalisation.score).toBeLessThanOrEqual(25);
    expect(result.inspectionCompliance.score).toBeLessThanOrEqual(25);
    expect(result.staffRoomReadiness.score).toBeLessThanOrEqual(25);
  });

  it("handles all empty inputs gracefully", () => {
    const result = generateRoomStandardsPersonalisationIntelligence(
      [], [], null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.childRoomProfiles.length).toBe(0);
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("generates actions for staff training gaps", () => {
    const training = [
      makeTraining({ roomStandards: false }),
      makeTraining({ id: "srt-002", staffId: "staff-tom", roomStandards: false }),
    ];
    const result = generateRoomStandardsPersonalisationIntelligence(
      OAK_HOUSE_ROOMS, OAK_HOUSE_INSPECTIONS, makePolicy(), training,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.actions.some((a) => a.includes("staff training") || a.includes("Room standards training"))).toBe(true);
  });
});
