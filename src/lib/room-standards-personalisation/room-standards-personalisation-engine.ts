// ══════════════════════════════════════════════════════════════════════════════
// ROOM STANDARDS & PERSONALISATION INTELLIGENCE ENGINE
//
// Pure deterministic engine for evaluating bedroom standards, personalisation,
// condition, young person involvement in room decoration, environmental quality,
// and regular inspections. Children's rooms should feel like their own space,
// not institutional.
//
// Regulatory basis:
//   - CHR 2015, Reg 25 — Premises: accommodation standards and conditions
//   - CHR 2015, Reg 27 — Welfare of children: personalised living spaces
//   - SCCIF — Quality of care: children's living environment
//   - NMS 10 — Premises: rooms, furnishing, and personalisation
//   - UNCRC Article 16 — Right to privacy in the home
//   - Children Act 1989 — Duty of care and welfare of children
//   - Health and Safety at Work Act 1974 — Safe premises
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type RoomCondition = "excellent" | "good" | "fair" | "poor" | "needs_repair";

export type PersonalisationLevel =
  | "highly_personalised"
  | "personalised"
  | "some_personalisation"
  | "minimal"
  | "none";

export type InspectionOutcome = "passed" | "minor_issues" | "major_issues" | "failed";

export type FurnitureCondition = "new" | "good" | "fair" | "poor" | "replacement_needed";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface RoomRecord {
  id: string;
  childId: string;
  childName: string;
  lastInspectionDate: string;
  roomCondition: RoomCondition;
  personalisationLevel: PersonalisationLevel;
  childChosenDecor: boolean;
  adequateFurniture: boolean;
  furnitureCondition: FurnitureCondition;
  lockableStorage: boolean;
  adequateLighting: boolean;
  heatingAdequate: boolean;
  windowsSecure: boolean;
  privacyMeasures: boolean;
}

export interface RoomInspection {
  id: string;
  roomId: string;
  inspectionDate: string;
  inspectedBy: string;
  outcome: InspectionOutcome;
  issuesFound: string[];
  repairsScheduled: boolean;
  repairsCompleted: boolean;
}

export interface RoomPolicy {
  id: string;
  policyReviewDate: string;
  policyCurrent: boolean;
  minimumStandards: boolean;
  personalisationBudget: boolean;
  regularInspections: boolean;
  childInputRequired: boolean;
  repairTimescalesSet: boolean;
  safetyChecksIncluded: boolean;
}

export interface StaffRoomTraining {
  id: string;
  staffId: string;
  staffName: string;
  roomStandards: boolean;
  personalisationImportance: boolean;
  privacyAwareness: boolean;
  maintenanceReporting: boolean;
  safetyChecks: boolean;
  childParticipation: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface RoomConditionsResult {
  totalRooms: number;
  roomConditionGoodPlusRate: number;
  furnitureGoodPlusRate: number;
  essentialAmenitiesRate: number;
  privacyWindowsRate: number;
  score: number; // 0-25
  strengths: string[];
  concerns: string[];
}

export interface PersonalisationResult {
  totalRooms: number;
  personalisationGoodPlusRate: number;
  childChosenDecorRate: number;
  highPersonalisationRate: number;
  allPersonalisedRate: number;
  score: number; // 0-25
  strengths: string[];
  concerns: string[];
}

export interface InspectionComplianceResult {
  totalInspections: number;
  passRate: number;
  issuesScheduledRate: number;
  repairsCompletedRate: number;
  inspectionFrequency: number;
  score: number; // 0-25
  strengths: string[];
  concerns: string[];
}

export interface StaffRoomReadinessResult {
  totalStaff: number;
  roomStandardsRate: number;
  personalisationImportanceRate: number;
  privacyAwarenessRate: number;
  maintenanceReportingRate: number;
  safetyChecksRate: number;
  childParticipationRate: number;
  score: number; // 0-25
  strengths: string[];
  concerns: string[];
}

export interface ChildRoomProfile {
  childId: string;
  childName: string;
  roomCondition: RoomCondition;
  personalisationLevel: PersonalisationLevel;
  childChosenDecor: boolean;
  inspectionCount: number;
  lastInspectionOutcome: InspectionOutcome | null;
  roomScore: number; // 0-10
}

export interface RoomStandardsPersonalisationIntelligence {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;

  overallScore: number; // 0-100
  rating: Rating;

  roomConditions: RoomConditionsResult;
  personalisation: PersonalisationResult;
  inspectionCompliance: InspectionComplianceResult;
  staffRoomReadiness: StaffRoomReadinessResult;

  childRoomProfiles: ChildRoomProfile[];

  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

export function pct(num: number, den: number): number {
  if (den === 0) return 0;
  return Math.round((num / den) * 100);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Label Maps ─────────────────────────────────────────────────────────────

const roomConditionLabels: Record<RoomCondition, string> = {
  excellent: "Excellent",
  good: "Good",
  fair: "Fair",
  poor: "Poor",
  needs_repair: "Needs Repair",
};

const personalisationLevelLabels: Record<PersonalisationLevel, string> = {
  highly_personalised: "Highly Personalised",
  personalised: "Personalised",
  some_personalisation: "Some Personalisation",
  minimal: "Minimal",
  none: "None",
};

const inspectionOutcomeLabels: Record<InspectionOutcome, string> = {
  passed: "Passed",
  minor_issues: "Minor Issues",
  major_issues: "Major Issues",
  failed: "Failed",
};

const furnitureConditionLabels: Record<FurnitureCondition, string> = {
  new: "New",
  good: "Good",
  fair: "Fair",
  poor: "Poor",
  replacement_needed: "Replacement Needed",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

// ── Label Getters ──────────────────────────────────────────────────────────

export function getRoomConditionLabel(condition: RoomCondition): string {
  return roomConditionLabels[condition];
}

export function getPersonalisationLevelLabel(level: PersonalisationLevel): string {
  return personalisationLevelLabels[level];
}

export function getInspectionOutcomeLabel(outcome: InspectionOutcome): string {
  return inspectionOutcomeLabels[outcome];
}

export function getFurnitureConditionLabel(condition: FurnitureCondition): string {
  return furnitureConditionLabels[condition];
}

export function getRatingLabel(rating: Rating): string {
  return ratingLabels[rating];
}

// ── Core Function 1: Evaluate Room Conditions (0-25) ───────────────────────

export function evaluateRoomConditions(rooms: RoomRecord[]): RoomConditionsResult {
  const totalRooms = rooms.length;

  if (totalRooms === 0) {
    return {
      totalRooms: 0,
      roomConditionGoodPlusRate: 0,
      furnitureGoodPlusRate: 0,
      essentialAmenitiesRate: 0,
      privacyWindowsRate: 0,
      score: 0,
      strengths: [],
      concerns: ["No room records available — room conditions cannot be assessed"],
    };
  }

  // Room condition good+ (excellent, good)
  const roomConditionGoodPlus = rooms.filter(
    (r) => r.roomCondition === "excellent" || r.roomCondition === "good",
  ).length;
  const roomConditionGoodPlusRate = pct(roomConditionGoodPlus, totalRooms);

  // Furniture good+ (new, good)
  const furnitureGoodPlus = rooms.filter(
    (r) => r.furnitureCondition === "new" || r.furnitureCondition === "good",
  ).length;
  const furnitureGoodPlusRate = pct(furnitureGoodPlus, totalRooms);

  // Essential amenities (lockable storage + adequate lighting + heating adequate)
  const essentialAmenitiesCount = rooms.filter(
    (r) => r.lockableStorage && r.adequateLighting && r.heatingAdequate,
  ).length;
  const essentialAmenitiesRate = pct(essentialAmenitiesCount, totalRooms);

  // Privacy + windows
  const privacyWindowsCount = rooms.filter(
    (r) => r.privacyMeasures && r.windowsSecure,
  ).length;
  const privacyWindowsRate = pct(privacyWindowsCount, totalRooms);

  // Score (out of 25)
  let score = 0;
  // Room condition good+ rate: max 7
  score += (roomConditionGoodPlusRate / 100) * 7;
  // Furniture good+ rate: max 6
  score += (furnitureGoodPlusRate / 100) * 6;
  // Essential amenities rate: max 6
  score += (essentialAmenitiesRate / 100) * 6;
  // Privacy + windows rate: max 6
  score += (privacyWindowsRate / 100) * 6;

  score = clamp(Math.round(score * 10) / 10, 0, 25);

  // Insights
  const strengths: string[] = [];
  const concerns: string[] = [];

  if (roomConditionGoodPlusRate >= 90) {
    strengths.push("Excellent room conditions: " + roomConditionGoodPlusRate + "% of rooms in good or excellent condition");
  } else if (roomConditionGoodPlusRate < 70) {
    concerns.push("Room condition at " + roomConditionGoodPlusRate + "% good or better — maintenance review needed");
  }

  if (furnitureGoodPlusRate >= 90) {
    strengths.push("Furniture in good condition: " + furnitureGoodPlusRate + "% of rooms have good or new furniture");
  } else if (furnitureGoodPlusRate < 70) {
    concerns.push("Furniture condition at " + furnitureGoodPlusRate + "% good or better — replacement programme may be needed");
  }

  if (essentialAmenitiesRate >= 90) {
    strengths.push("Essential amenities provided in " + essentialAmenitiesRate + "% of rooms (lockable storage, lighting, heating)");
  } else if (essentialAmenitiesRate < 70) {
    concerns.push("Essential amenities at " + essentialAmenitiesRate + "% — lockable storage, lighting, or heating gaps identified");
  }

  if (privacyWindowsRate >= 90) {
    strengths.push("Privacy and window security maintained in " + privacyWindowsRate + "% of rooms");
  } else if (privacyWindowsRate < 70) {
    concerns.push("Privacy and window security at " + privacyWindowsRate + "% — UNCRC Article 16 requires children's privacy");
  }

  return {
    totalRooms,
    roomConditionGoodPlusRate,
    furnitureGoodPlusRate,
    essentialAmenitiesRate,
    privacyWindowsRate,
    score,
    strengths,
    concerns,
  };
}

// ── Core Function 2: Evaluate Personalisation (0-25) ───────────────────────

export function evaluatePersonalisation(rooms: RoomRecord[]): PersonalisationResult {
  const totalRooms = rooms.length;

  if (totalRooms === 0) {
    return {
      totalRooms: 0,
      personalisationGoodPlusRate: 0,
      childChosenDecorRate: 0,
      highPersonalisationRate: 0,
      allPersonalisedRate: 0,
      score: 0,
      strengths: [],
      concerns: ["No room records available — personalisation cannot be assessed"],
    };
  }

  // Personalisation level good+ (highly_personalised, personalised)
  const personalisationGoodPlus = rooms.filter(
    (r) => r.personalisationLevel === "highly_personalised" || r.personalisationLevel === "personalised",
  ).length;
  const personalisationGoodPlusRate = pct(personalisationGoodPlus, totalRooms);

  // Child chosen decor
  const childChosenDecorCount = rooms.filter((r) => r.childChosenDecor).length;
  const childChosenDecorRate = pct(childChosenDecorCount, totalRooms);

  // High personalisation rate (highly_personalised only)
  const highPersonalisationCount = rooms.filter(
    (r) => r.personalisationLevel === "highly_personalised",
  ).length;
  const highPersonalisationRate = pct(highPersonalisationCount, totalRooms);

  // All personalised rate (any level above "none")
  const allPersonalisedCount = rooms.filter(
    (r) => r.personalisationLevel !== "none",
  ).length;
  const allPersonalisedRate = pct(allPersonalisedCount, totalRooms);

  // Score (out of 25)
  let score = 0;
  // Personalisation good+ rate: max 7
  score += (personalisationGoodPlusRate / 100) * 7;
  // Child chosen decor rate: max 6
  score += (childChosenDecorRate / 100) * 6;
  // High personalisation rate: max 6
  score += (highPersonalisationRate / 100) * 6;
  // All personalised rate: max 6
  score += (allPersonalisedRate / 100) * 6;

  score = clamp(Math.round(score * 10) / 10, 0, 25);

  // Insights
  const strengths: string[] = [];
  const concerns: string[] = [];

  if (personalisationGoodPlusRate >= 90) {
    strengths.push("Strong personalisation: " + personalisationGoodPlusRate + "% of rooms personalised or highly personalised");
  } else if (personalisationGoodPlusRate < 70) {
    concerns.push("Personalisation at " + personalisationGoodPlusRate + "% good or better — rooms may feel institutional");
  }

  if (childChosenDecorRate >= 90) {
    strengths.push("Children actively involved: " + childChosenDecorRate + "% of rooms have child-chosen decor");
  } else if (childChosenDecorRate < 70) {
    concerns.push("Child-chosen decor at " + childChosenDecorRate + "% — children should be empowered to personalise their space");
  }

  if (highPersonalisationRate >= 50) {
    strengths.push(highPersonalisationRate + "% of rooms are highly personalised — children feel at home");
  } else if (highPersonalisationRate < 20) {
    concerns.push("Only " + highPersonalisationRate + "% of rooms highly personalised — consider increasing personalisation budget");
  }

  if (allPersonalisedRate === 100) {
    strengths.push("All rooms have some level of personalisation — no child living in an unpersonalised room");
  } else if (allPersonalisedRate < 100) {
    const unpersonalisedCount = totalRooms - allPersonalisedCount;
    concerns.push(unpersonalisedCount + " room(s) with no personalisation — every child's room should reflect their identity");
  }

  return {
    totalRooms,
    personalisationGoodPlusRate,
    childChosenDecorRate,
    highPersonalisationRate,
    allPersonalisedRate,
    score,
    strengths,
    concerns,
  };
}

// ── Core Function 3: Evaluate Inspection Compliance (0-25) ─────────────────

export function evaluateInspectionCompliance(
  inspections: RoomInspection[],
): InspectionComplianceResult {
  const totalInspections = inspections.length;

  if (totalInspections === 0) {
    return {
      totalInspections: 0,
      passRate: 0,
      issuesScheduledRate: 0,
      repairsCompletedRate: 0,
      inspectionFrequency: 0,
      score: 0,
      strengths: [],
      concerns: ["No room inspections recorded — regular inspections are required under CHR 2015 Reg 25"],
    };
  }

  // Pass rate (passed)
  const passedCount = inspections.filter((i) => i.outcome === "passed").length;
  const passRate = pct(passedCount, totalInspections);

  // Issues found but scheduled for repair
  const inspectionsWithIssues = inspections.filter(
    (i) => i.issuesFound.length > 0,
  );
  const issuesScheduledCount = inspectionsWithIssues.filter(
    (i) => i.repairsScheduled,
  ).length;
  const issuesScheduledRate = pct(issuesScheduledCount, inspectionsWithIssues.length);

  // Repairs completed
  const repairsScheduledInspections = inspections.filter(
    (i) => i.repairsScheduled,
  );
  const repairsCompletedCount = repairsScheduledInspections.filter(
    (i) => i.repairsCompleted,
  ).length;
  const repairsCompletedRate = pct(repairsCompletedCount, repairsScheduledInspections.length);

  // Inspection frequency (proxy via total count — higher = better, max 6 at 6+)
  const inspectionFrequency = Math.min(totalInspections, 6);

  // Score (out of 25)
  let score = 0;
  // Pass rate: max 7
  score += (passRate / 100) * 7;
  // Issues scheduled rate: max 6 (no issues = full marks)
  if (inspectionsWithIssues.length === 0) {
    score += 6;
  } else {
    score += (issuesScheduledRate / 100) * 6;
  }
  // Repairs completed rate: max 6 (no repairs needed = full marks)
  if (repairsScheduledInspections.length === 0) {
    score += 6;
  } else {
    score += (repairsCompletedRate / 100) * 6;
  }
  // Inspection frequency: max 6
  score += (inspectionFrequency / 6) * 6;

  score = clamp(Math.round(score * 10) / 10, 0, 25);

  // Insights
  const strengths: string[] = [];
  const concerns: string[] = [];

  if (passRate >= 90) {
    strengths.push("Excellent inspection pass rate: " + passRate + "% of inspections passed");
  } else if (passRate < 70) {
    concerns.push("Inspection pass rate at " + passRate + "% — room standards need attention");
  }

  if (issuesScheduledRate >= 90) {
    strengths.push("Issues promptly scheduled: " + issuesScheduledRate + "% of identified issues have repairs scheduled");
  } else if (issuesScheduledRate < 70 && inspectionsWithIssues.length > 0) {
    concerns.push("Only " + issuesScheduledRate + "% of issues have repairs scheduled — repair tracking needs improvement");
  }

  if (repairsCompletedRate >= 90) {
    strengths.push("Repairs completed effectively: " + repairsCompletedRate + "% of scheduled repairs finished");
  } else if (repairsCompletedRate < 70 && repairsScheduledInspections.length > 0) {
    concerns.push("Repair completion at " + repairsCompletedRate + "% — outstanding repairs need escalation");
  }

  if (totalInspections >= 6) {
    strengths.push("Regular inspections maintained: " + totalInspections + " inspections in period");
  } else if (totalInspections < 3) {
    concerns.push("Only " + totalInspections + " inspection(s) in period — inspection frequency below recommended levels");
  }

  return {
    totalInspections,
    passRate,
    issuesScheduledRate,
    repairsCompletedRate,
    inspectionFrequency,
    score,
    strengths,
    concerns,
  };
}

// ── Core Function 4: Evaluate Staff Room Readiness (0-25) ──────────────────

export function evaluateStaffRoomReadiness(
  training: StaffRoomTraining[],
): StaffRoomReadinessResult {
  const totalStaff = training.length;

  if (totalStaff === 0) {
    return {
      totalStaff: 0,
      roomStandardsRate: 0,
      personalisationImportanceRate: 0,
      privacyAwarenessRate: 0,
      maintenanceReportingRate: 0,
      safetyChecksRate: 0,
      childParticipationRate: 0,
      score: 0,
      strengths: [],
      concerns: ["No staff room training records — staff readiness cannot be assessed"],
    };
  }

  // Rate per field
  const roomStandardsCount = training.filter((t) => t.roomStandards).length;
  const roomStandardsRate = pct(roomStandardsCount, totalStaff);

  const personalisationImportanceCount = training.filter((t) => t.personalisationImportance).length;
  const personalisationImportanceRate = pct(personalisationImportanceCount, totalStaff);

  const privacyAwarenessCount = training.filter((t) => t.privacyAwareness).length;
  const privacyAwarenessRate = pct(privacyAwarenessCount, totalStaff);

  const maintenanceReportingCount = training.filter((t) => t.maintenanceReporting).length;
  const maintenanceReportingRate = pct(maintenanceReportingCount, totalStaff);

  const safetyChecksCount = training.filter((t) => t.safetyChecks).length;
  const safetyChecksRate = pct(safetyChecksCount, totalStaff);

  const childParticipationCount = training.filter((t) => t.childParticipation).length;
  const childParticipationRate = pct(childParticipationCount, totalStaff);

  // Score (out of 25): roomStandards=6, personalisationImportance=5, privacyAwareness=4, maintenanceReporting=4, safetyChecks=3, childParticipation=3
  let score = 0;
  score += (roomStandardsRate / 100) * 6;
  score += (personalisationImportanceRate / 100) * 5;
  score += (privacyAwarenessRate / 100) * 4;
  score += (maintenanceReportingRate / 100) * 4;
  score += (safetyChecksRate / 100) * 3;
  score += (childParticipationRate / 100) * 3;

  score = clamp(Math.round(score * 10) / 10, 0, 25);

  // Insights
  const strengths: string[] = [];
  const concerns: string[] = [];

  if (roomStandardsRate >= 90) {
    strengths.push("Room standards training excellent: " + roomStandardsRate + "% of staff trained");
  } else if (roomStandardsRate < 70) {
    concerns.push("Room standards training at " + roomStandardsRate + "% — core competency gap for CHR 2015 Reg 25");
  }

  if (personalisationImportanceRate >= 90) {
    strengths.push("Staff understand personalisation importance: " + personalisationImportanceRate + "% trained");
  } else if (personalisationImportanceRate < 70) {
    concerns.push("Personalisation importance training at " + personalisationImportanceRate + "% — staff may not prioritise child's space");
  }

  if (privacyAwarenessRate >= 90) {
    strengths.push("Privacy awareness strong: " + privacyAwarenessRate + "% of staff trained");
  } else if (privacyAwarenessRate < 70) {
    concerns.push("Privacy awareness at " + privacyAwarenessRate + "% — children's right to privacy may be compromised");
  }

  if (maintenanceReportingRate >= 90) {
    strengths.push("Maintenance reporting skills excellent: " + maintenanceReportingRate + "% of staff trained");
  } else if (maintenanceReportingRate < 70) {
    concerns.push("Maintenance reporting training at " + maintenanceReportingRate + "% — issues may go unreported");
  }

  if (safetyChecksRate >= 90) {
    strengths.push("Safety checks training strong: " + safetyChecksRate + "% of staff trained");
  } else if (safetyChecksRate < 70) {
    concerns.push("Safety checks training at " + safetyChecksRate + "% — Health and Safety compliance at risk");
  }

  if (childParticipationRate >= 90) {
    strengths.push("Child participation training excellent: " + childParticipationRate + "% of staff trained");
  } else if (childParticipationRate < 70) {
    concerns.push("Child participation training at " + childParticipationRate + "% — staff may not involve children in room decisions");
  }

  return {
    totalStaff,
    roomStandardsRate,
    personalisationImportanceRate,
    privacyAwarenessRate,
    maintenanceReportingRate,
    safetyChecksRate,
    childParticipationRate,
    score,
    strengths,
    concerns,
  };
}

// ── Build Child Room Profiles ──────────────────────────────────────────────

export function buildChildRoomProfiles(
  rooms: RoomRecord[],
  inspections: RoomInspection[],
): ChildRoomProfile[] {
  return rooms.map((room) => {
    const roomInspections = inspections
      .filter((i) => i.roomId === room.id)
      .sort((a, b) => b.inspectionDate.localeCompare(a.inspectionDate));

    const lastInspectionOutcome = roomInspections.length > 0
      ? roomInspections[0].outcome
      : null;

    // Room score 0-10
    let roomScore = 0;

    // Room condition: excellent=3, good=2, fair=1, poor/needs_repair=0
    if (room.roomCondition === "excellent") roomScore += 3;
    else if (room.roomCondition === "good") roomScore += 2;
    else if (room.roomCondition === "fair") roomScore += 1;

    // Personalisation: highly_personalised=2, personalised=1.5, some=1, minimal=0.5, none=0
    if (room.personalisationLevel === "highly_personalised") roomScore += 2;
    else if (room.personalisationLevel === "personalised") roomScore += 1.5;
    else if (room.personalisationLevel === "some_personalisation") roomScore += 1;
    else if (room.personalisationLevel === "minimal") roomScore += 0.5;

    // Child chosen decor: +1
    if (room.childChosenDecor) roomScore += 1;

    // Essential amenities: +1 each (lockable storage, lighting, heating) = max 2
    let amenityPoints = 0;
    if (room.lockableStorage) amenityPoints++;
    if (room.adequateLighting) amenityPoints++;
    if (room.heatingAdequate) amenityPoints++;
    roomScore += Math.min(2, Math.round((amenityPoints / 3) * 2 * 10) / 10);

    // Privacy + windows: max 1
    if (room.privacyMeasures && room.windowsSecure) roomScore += 1;
    else if (room.privacyMeasures || room.windowsSecure) roomScore += 0.5;

    // Furniture condition: new/good=1, fair=0.5, poor/replacement=0
    if (room.furnitureCondition === "new" || room.furnitureCondition === "good") roomScore += 1;
    else if (room.furnitureCondition === "fair") roomScore += 0.5;

    roomScore = clamp(Math.round(roomScore * 10) / 10, 0, 10);

    return {
      childId: room.childId,
      childName: room.childName,
      roomCondition: room.roomCondition,
      personalisationLevel: room.personalisationLevel,
      childChosenDecor: room.childChosenDecor,
      inspectionCount: roomInspections.length,
      lastInspectionOutcome,
      roomScore,
    };
  });
}

// ── Generate Room Standards Personalisation Intelligence ───────────────────

export function generateRoomStandardsPersonalisationIntelligence(
  rooms: RoomRecord[],
  inspections: RoomInspection[],
  policy: RoomPolicy | null,
  training: StaffRoomTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): RoomStandardsPersonalisationIntelligence {
  const assessedAt = new Date().toISOString();

  // Evaluate each layer
  const roomConditions = evaluateRoomConditions(rooms);
  const personalisation = evaluatePersonalisation(rooms);
  const inspectionCompliance = evaluateInspectionCompliance(inspections);
  const staffRoomReadiness = evaluateStaffRoomReadiness(training);

  // Build child profiles
  const childRoomProfiles = buildChildRoomProfiles(rooms, inspections);

  // Overall score (100 points)
  const overallScore = clamp(
    Math.round(
      roomConditions.score +
      personalisation.score +
      inspectionCompliance.score +
      staffRoomReadiness.score,
    ),
    0,
    100,
  );

  const rating = getRating(overallScore);

  // Aggregate insights
  const strengths = aggregateStrengths(
    roomConditions, personalisation, inspectionCompliance, staffRoomReadiness, overallScore,
  );
  const areasForImprovement = aggregateAreasForImprovement(
    roomConditions, personalisation, inspectionCompliance, staffRoomReadiness, overallScore,
  );
  const actions = generateActions(
    roomConditions, personalisation, inspectionCompliance, staffRoomReadiness,
    childRoomProfiles, rooms, policy,
  );
  const regulatoryLinks = generateRegulatoryLinks();

  return {
    homeId,
    assessedAt,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    roomConditions,
    personalisation,
    inspectionCompliance,
    staffRoomReadiness,
    childRoomProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}

// ── Aggregate Strengths ────────────────────────────────────────────────────

function aggregateStrengths(
  conditions: RoomConditionsResult,
  personalisation: PersonalisationResult,
  inspections: InspectionComplianceResult,
  staff: StaffRoomReadinessResult,
  overallScore: number,
): string[] {
  const strengths: string[] = [];

  if (overallScore >= 80) {
    strengths.push("Overall room standards and personalisation rated Outstanding (" + overallScore + "/100)");
  } else if (overallScore >= 60) {
    strengths.push("Overall room standards and personalisation rated Good (" + overallScore + "/100)");
  }

  strengths.push(...conditions.strengths.slice(0, 2));
  strengths.push(...personalisation.strengths.slice(0, 2));
  strengths.push(...inspections.strengths.slice(0, 2));
  strengths.push(...staff.strengths.slice(0, 2));

  return strengths;
}

// ── Aggregate Areas for Improvement ────────────────────────────────────────

function aggregateAreasForImprovement(
  conditions: RoomConditionsResult,
  personalisation: PersonalisationResult,
  inspections: InspectionComplianceResult,
  staff: StaffRoomReadinessResult,
  overallScore: number,
): string[] {
  const areas: string[] = [];

  if (overallScore < 40) {
    areas.push("Overall room standards and personalisation rated Inadequate (" + overallScore + "/100) — urgent review required");
  } else if (overallScore < 60) {
    areas.push("Overall room standards and personalisation Requires Improvement (" + overallScore + "/100)");
  }

  areas.push(...conditions.concerns);
  areas.push(...personalisation.concerns);
  areas.push(...inspections.concerns);
  areas.push(...staff.concerns);

  return areas;
}

// ── Generate Actions ──────────────────────────────────────────────────────

function generateActions(
  conditions: RoomConditionsResult,
  personalisation: PersonalisationResult,
  inspections: InspectionComplianceResult,
  staff: StaffRoomReadinessResult,
  childProfiles: ChildRoomProfile[],
  rooms: RoomRecord[],
  policy: RoomPolicy | null,
): string[] {
  const actions: string[] = [];

  // Rooms needing repair
  const needsRepairCount = rooms.filter(
    (r) => r.roomCondition === "needs_repair" || r.roomCondition === "poor",
  ).length;
  if (needsRepairCount > 0) {
    actions.push("URGENT: " + needsRepairCount + " room(s) in poor condition or needing repair — schedule maintenance immediately");
  }

  // Furniture replacement
  const furnitureReplacementCount = rooms.filter(
    (r) => r.furnitureCondition === "replacement_needed" || r.furnitureCondition === "poor",
  ).length;
  if (furnitureReplacementCount > 0) {
    actions.push("URGENT: " + furnitureReplacementCount + " room(s) require furniture replacement or repair");
  }

  // Unpersonalised rooms
  const unpersonalisedCount = rooms.filter(
    (r) => r.personalisationLevel === "none",
  ).length;
  if (unpersonalisedCount > 0) {
    actions.push("URGENT: " + unpersonalisedCount + " room(s) with no personalisation — every child deserves a personalised space");
  }

  // No lockable storage
  const noLockableStorage = rooms.filter((r) => !r.lockableStorage).length;
  if (noLockableStorage > 0) {
    actions.push("HIGH: " + noLockableStorage + " room(s) without lockable storage — install secure storage per NMS 10");
  }

  // Low child chosen decor
  if (personalisation.childChosenDecorRate < 70 && personalisation.totalRooms > 0) {
    actions.push("HIGH: Only " + personalisation.childChosenDecorRate + "% of rooms have child-chosen decor — involve children in room decisions");
  }

  // Low inspection frequency
  if (inspections.totalInspections < 3) {
    actions.push("HIGH: Only " + inspections.totalInspections + " inspection(s) recorded — establish regular inspection schedule");
  }

  // Repairs not completed (only flag if there are actually issues requiring repair)
  if (inspections.repairsCompletedRate < 70 && inspections.totalInspections > 0 && inspections.passRate < 100) {
    actions.push("MEDIUM: Repair completion at " + inspections.repairsCompletedRate + "% — follow up on outstanding repairs");
  }

  // Staff training gaps
  if (staff.roomStandardsRate < 70 && staff.totalStaff > 0) {
    actions.push("MEDIUM: Room standards training at " + staff.roomStandardsRate + "% — schedule staff training");
  }

  // Privacy concerns
  const noPrivacy = rooms.filter((r) => !r.privacyMeasures).length;
  if (noPrivacy > 0) {
    actions.push("MEDIUM: " + noPrivacy + " room(s) without privacy measures — review UNCRC Article 16 compliance");
  }

  // Policy review
  if (!policy || !policy.policyCurrent) {
    actions.push("MEDIUM: Room standards policy needs review — ensure policy is current and compliant");
  }

  // Low room scores
  const lowScoreChildren = childProfiles.filter((p) => p.roomScore <= 4);
  if (lowScoreChildren.length > 0) {
    actions.push("HIGH: " + lowScoreChildren.length + " child(ren) with low room scores — prioritise room improvements");
  }

  if (actions.length === 0) {
    actions.push("No immediate actions required. Room standards and personalisation operating within expected standards.");
  }

  return actions;
}

// ── Regulatory Links ──────────────────────────────────────────────────────

function generateRegulatoryLinks(): string[] {
  return [
    "CHR 2015, Reg 25 — Premises: accommodation standards and conditions",
    "CHR 2015, Reg 27 — Welfare of children: personalised living spaces",
    "SCCIF — Quality of care: children's living environment",
    "NMS 10 — Premises: rooms, furnishing, and personalisation",
    "UNCRC Article 16 — Right to privacy in the home",
    "Children Act 1989 — Duty of care and welfare of children",
    "Health and Safety at Work Act 1974 — Safe premises",
  ];
}
