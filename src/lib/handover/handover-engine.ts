// ==============================================================================
// Cornerstone -- Handover Intelligence Engine
//
// Pure deterministic engine. No AI, no external calls, no side-effects.
//
// "Effective communication between shifts is a key indicator of quality care.
//  Inspectors look for evidence that critical information is reliably transferred
//  and that continuity of care is maintained across shift changes."
// -- SCCIF quality of care guidance
//
// Regulatory framework:
//   CHR 2015 Reg 13         -- Leadership and management (effective systems)
//   CHR 2015 Reg 12         -- Protection of children (information sharing)
//   SCCIF                   -- Quality of care: communication between shifts
//   CHR 2015 Reg 5(c)       -- Quality and purpose of care: continuity
//   Working Together 2023    -- Information sharing to safeguard children
//
// Key requirements:
//   1. Every shift change has a structured handover
//   2. Critical safeguarding information is transferred and acknowledged
//   3. Medication updates are communicated at every handover
//   4. Incident information is briefed to incoming staff
//   5. Children's emotional presentations are noted and shared
//   6. Plan changes are highlighted and understood
//   7. Staff continuity supports relationship-based practice
//   8. Follow-up actions from handovers are completed
//   9. Handover records are maintained for audit and inspection
//  10. Missed handovers are escalated and investigated
//
// Scoring breakdown (0-100):
//   Completeness:            25  -- Handovers completed vs expected
//   Quality:                 30  -- Content quality indicators
//   Information transfer:    25  -- Critical info acknowledged & followed up
//   Continuity:              20  -- Staff overlap and consistency
// ==============================================================================

// -- Types --------------------------------------------------------------------

export type ShiftType = "morning" | "afternoon" | "evening" | "waking_night" | "sleep_in";

export type HandoverStatus = "completed" | "partial" | "missed" | "late";

export type InformationPriority = "critical" | "important" | "routine";

export type ContinuityRating = "excellent" | "good" | "adequate" | "poor";

export type ItemCategory =
  | "risk"
  | "medication"
  | "behaviour"
  | "emotional"
  | "contact"
  | "appointment"
  | "incident"
  | "plan_change"
  | "general";

// -- Data Models --------------------------------------------------------------

export interface HandoverItem {
  id: string;
  childId?: string;
  childName?: string;
  priority: InformationPriority;
  category: ItemCategory;
  summary: string;
  acknowledged: boolean;
  followUpRequired: boolean;
  followUpCompletedAt?: string;
}

export interface HandoverRecord {
  id: string;
  homeId: string;
  date: string; // ISO date
  outgoingShift: ShiftType;
  incomingShift: ShiftType;
  outgoingStaffIds: string[];
  incomingStaffIds: string[];
  status: HandoverStatus;
  startedAt?: string; // ISO datetime
  completedAt?: string;
  durationMinutes?: number;
  // Content quality
  childUpdatesIncluded: boolean;
  riskUpdatesIncluded: boolean;
  medicationUpdatesIncluded: boolean;
  incidentsBriefed: boolean;
  emotionalPresentationNoted: boolean;
  planChangesHighlighted: boolean;
  // Items
  criticalItems: HandoverItem[];
  importantItems: HandoverItem[];
  routineItems: HandoverItem[];
}

export interface HandoverExpectation {
  date: string;
  outgoingShift: ShiftType;
  incomingShift: ShiftType;
}

// -- Result Types -------------------------------------------------------------

export interface CompletenessResult {
  totalExpected: number;
  completed: number;
  partial: number;
  missed: number;
  late: number;
  completionRate: number;
}

export interface QualityResult {
  avgDurationMinutes: number;
  childUpdatesRate: number;
  riskUpdatesRate: number;
  medicationUpdatesRate: number;
  incidentBriefingRate: number;
  emotionalPresentationRate: number;
  planChangesRate: number;
  overallQualityScore: number; // 0-100
}

export interface InformationTransferResult {
  totalCriticalItems: number;
  criticalAcknowledgedRate: number;
  totalImportantItems: number;
  importantAcknowledgedRate: number;
  followUpRequiredCount: number;
  followUpCompletedRate: number;
  unacknowledgedCriticalItems: HandoverItem[];
}

export interface ContinuityResult {
  avgStaffOverlap: number;
  consistentStaffRate: number;
  shiftCoverageByType: Record<ShiftType, number>;
  continuityRating: ContinuityRating;
}

export interface ShiftProfile {
  shiftType: ShiftType;
  totalHandovers: number;
  completionRate: number;
  avgQualityScore: number;
  avgDuration: number;
  criticalItemsMissed: number;
}

export interface HandoverIntelligenceResult {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: "outstanding" | "good" | "requires_improvement" | "inadequate";
  completeness: CompletenessResult;
  quality: QualityResult;
  informationTransfer: InformationTransferResult;
  continuity: ContinuityResult;
  shiftProfiles: ShiftProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// -- Constants ----------------------------------------------------------------

const SHIFT_LABELS: Record<ShiftType, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
  waking_night: "Waking Night",
  sleep_in: "Sleep-in",
};

const CATEGORY_LABELS: Record<ItemCategory, string> = {
  risk: "Risk",
  medication: "Medication",
  behaviour: "Behaviour",
  emotional: "Emotional",
  contact: "Contact",
  appointment: "Appointment",
  incident: "Incident",
  plan_change: "Plan Change",
  general: "General",
};

export function getShiftLabel(s: ShiftType): string {
  return SHIFT_LABELS[s] ?? s.replace(/_/g, " ");
}

export function getItemCategoryLabel(c: ItemCategory): string {
  return CATEGORY_LABELS[c] ?? c.replace(/_/g, " ");
}

// -- Helpers ------------------------------------------------------------------

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function inPeriod(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}

function filterRecordsByPeriod(
  records: HandoverRecord[],
  periodStart: string,
  periodEnd: string,
): HandoverRecord[] {
  return records.filter((r) => inPeriod(r.date, periodStart, periodEnd));
}

function filterExpectationsByPeriod(
  expectations: HandoverExpectation[],
  periodStart: string,
  periodEnd: string,
): HandoverExpectation[] {
  return expectations.filter((e) => inPeriod(e.date, periodStart, periodEnd));
}

// -- Core Functions -----------------------------------------------------------

export function evaluateHandoverCompleteness(
  records: HandoverRecord[],
  expectations: HandoverExpectation[],
  periodStart: string,
  periodEnd: string,
): CompletenessResult {
  const periodExpectations = filterExpectationsByPeriod(expectations, periodStart, periodEnd);
  const periodRecords = filterRecordsByPeriod(records, periodStart, periodEnd);

  const totalExpected = periodExpectations.length;
  const completed = periodRecords.filter((r) => r.status === "completed").length;
  const partial = periodRecords.filter((r) => r.status === "partial").length;
  const missed = periodRecords.filter((r) => r.status === "missed").length;
  const late = periodRecords.filter((r) => r.status === "late").length;

  // completionRate: completed + late count as "done" (late is still done)
  const doneCount = completed + late;
  const completionRate = pct(doneCount, totalExpected);

  return {
    totalExpected,
    completed,
    partial,
    missed,
    late,
    completionRate,
  };
}

export function evaluateHandoverQuality(
  records: HandoverRecord[],
  periodStart: string,
  periodEnd: string,
): QualityResult {
  const periodRecords = filterRecordsByPeriod(records, periodStart, periodEnd);
  // Only assess quality on completed/late handovers (not missed/partial)
  const qualityRecords = periodRecords.filter(
    (r) => r.status === "completed" || r.status === "late",
  );
  const count = qualityRecords.length;

  if (count === 0) {
    return {
      avgDurationMinutes: 0,
      childUpdatesRate: 0,
      riskUpdatesRate: 0,
      medicationUpdatesRate: 0,
      incidentBriefingRate: 0,
      emotionalPresentationRate: 0,
      planChangesRate: 0,
      overallQualityScore: 0,
    };
  }

  const totalDuration = qualityRecords.reduce(
    (sum, r) => sum + (r.durationMinutes ?? 0),
    0,
  );
  const avgDurationMinutes = Math.round((totalDuration / count) * 10) / 10;

  const childUpdatesRate = pct(
    qualityRecords.filter((r) => r.childUpdatesIncluded).length,
    count,
  );
  const riskUpdatesRate = pct(
    qualityRecords.filter((r) => r.riskUpdatesIncluded).length,
    count,
  );
  const medicationUpdatesRate = pct(
    qualityRecords.filter((r) => r.medicationUpdatesIncluded).length,
    count,
  );
  const incidentBriefingRate = pct(
    qualityRecords.filter((r) => r.incidentsBriefed).length,
    count,
  );
  const emotionalPresentationRate = pct(
    qualityRecords.filter((r) => r.emotionalPresentationNoted).length,
    count,
  );
  const planChangesRate = pct(
    qualityRecords.filter((r) => r.planChangesHighlighted).length,
    count,
  );

  // Overall quality score: average of all 6 indicators
  const indicators = [
    childUpdatesRate,
    riskUpdatesRate,
    medicationUpdatesRate,
    incidentBriefingRate,
    emotionalPresentationRate,
    planChangesRate,
  ];
  const overallQualityScore = Math.round(
    indicators.reduce((sum, v) => sum + v, 0) / indicators.length,
  );

  return {
    avgDurationMinutes,
    childUpdatesRate,
    riskUpdatesRate,
    medicationUpdatesRate,
    incidentBriefingRate,
    emotionalPresentationRate,
    planChangesRate,
    overallQualityScore,
  };
}

export function evaluateInformationTransfer(
  records: HandoverRecord[],
  periodStart: string,
  periodEnd: string,
): InformationTransferResult {
  const periodRecords = filterRecordsByPeriod(records, periodStart, periodEnd);

  const allCritical: HandoverItem[] = [];
  const allImportant: HandoverItem[] = [];
  let followUpRequired = 0;
  let followUpCompleted = 0;

  for (const r of periodRecords) {
    allCritical.push(...r.criticalItems);
    allImportant.push(...r.importantItems);

    const allItems = [...r.criticalItems, ...r.importantItems, ...r.routineItems];
    for (const item of allItems) {
      if (item.followUpRequired) {
        followUpRequired++;
        if (item.followUpCompletedAt) {
          followUpCompleted++;
        }
      }
    }
  }

  const totalCriticalItems = allCritical.length;
  const criticalAcknowledged = allCritical.filter((i) => i.acknowledged).length;
  const criticalAcknowledgedRate = pct(criticalAcknowledged, totalCriticalItems);

  const totalImportantItems = allImportant.length;
  const importantAcknowledged = allImportant.filter((i) => i.acknowledged).length;
  const importantAcknowledgedRate = pct(importantAcknowledged, totalImportantItems);

  const followUpCompletedRate = pct(followUpCompleted, followUpRequired);

  const unacknowledgedCriticalItems = allCritical.filter((i) => !i.acknowledged);

  return {
    totalCriticalItems,
    criticalAcknowledgedRate,
    totalImportantItems,
    importantAcknowledgedRate,
    followUpRequiredCount: followUpRequired,
    followUpCompletedRate,
    unacknowledgedCriticalItems,
  };
}

export function evaluateContinuityOfCare(
  records: HandoverRecord[],
  periodStart: string,
  periodEnd: string,
): ContinuityResult {
  const periodRecords = filterRecordsByPeriod(records, periodStart, periodEnd);

  if (periodRecords.length === 0) {
    return {
      avgStaffOverlap: 0,
      consistentStaffRate: 0,
      shiftCoverageByType: {
        morning: 0,
        afternoon: 0,
        evening: 0,
        waking_night: 0,
        sleep_in: 0,
      },
      continuityRating: "poor",
    };
  }

  // Staff overlap: count how many outgoing staff also appeared in the previous
  // handover's incoming staff (i.e. they stayed from one shift to handover with next)
  let totalOverlap = 0;
  let overlapCount = 0;
  for (const r of periodRecords) {
    if (r.outgoingStaffIds.length > 0 && r.incomingStaffIds.length > 0) {
      const overlap = r.outgoingStaffIds.filter((id) =>
        r.incomingStaffIds.includes(id),
      ).length;
      // We're interested in whether any staff carry over, so overlap > 0 is good
      totalOverlap += overlap > 0 ? 1 : 0;
      overlapCount++;
    }
  }
  const avgStaffOverlap = overlapCount > 0
    ? Math.round((totalOverlap / overlapCount) * 100) / 100
    : 0;

  // Consistent staff rate: how many handovers had at least 2 outgoing staff
  // (indicating proper staffing levels for a structured handover)
  const consistentCount = periodRecords.filter(
    (r) => r.outgoingStaffIds.length >= 2 || r.incomingStaffIds.length >= 2,
  ).length;
  const consistentStaffRate = pct(consistentCount, periodRecords.length);

  // Shift coverage by type
  const shiftTypes: ShiftType[] = ["morning", "afternoon", "evening", "waking_night", "sleep_in"];
  const shiftCoverageByType: Record<ShiftType, number> = {
    morning: 0,
    afternoon: 0,
    evening: 0,
    waking_night: 0,
    sleep_in: 0,
  };
  for (const st of shiftTypes) {
    const shiftRecords = periodRecords.filter(
      (r) => r.outgoingShift === st || r.incomingShift === st,
    );
    const completedShift = shiftRecords.filter(
      (r) => r.status === "completed" || r.status === "late",
    ).length;
    shiftCoverageByType[st] = pct(completedShift, shiftRecords.length);
  }

  // Continuity rating
  const completedRecords = periodRecords.filter(
    (r) => r.status === "completed" || r.status === "late",
  );
  const completionRate = pct(completedRecords.length, periodRecords.length);

  let continuityRating: ContinuityRating;
  if (completionRate >= 95 && consistentStaffRate >= 80) {
    continuityRating = "excellent";
  } else if (completionRate >= 85 && consistentStaffRate >= 60) {
    continuityRating = "good";
  } else if (completionRate >= 70 && consistentStaffRate >= 40) {
    continuityRating = "adequate";
  } else {
    continuityRating = "poor";
  }

  return {
    avgStaffOverlap,
    consistentStaffRate,
    shiftCoverageByType,
    continuityRating,
  };
}

export function buildShiftProfiles(
  records: HandoverRecord[],
  periodStart: string,
  periodEnd: string,
): ShiftProfile[] {
  const periodRecords = filterRecordsByPeriod(records, periodStart, periodEnd);
  const shiftTypes: ShiftType[] = ["morning", "afternoon", "evening", "waking_night", "sleep_in"];

  return shiftTypes
    .map((shiftType) => {
      // Records where this shift type was involved (outgoing or incoming)
      const shiftRecords = periodRecords.filter(
        (r) => r.outgoingShift === shiftType || r.incomingShift === shiftType,
      );
      const totalHandovers = shiftRecords.length;

      if (totalHandovers === 0) {
        return {
          shiftType,
          totalHandovers: 0,
          completionRate: 0,
          avgQualityScore: 0,
          avgDuration: 0,
          criticalItemsMissed: 0,
        };
      }

      const completedOrLate = shiftRecords.filter(
        (r) => r.status === "completed" || r.status === "late",
      );
      const completionRate = pct(completedOrLate.length, totalHandovers);

      // Quality score for completed/late handovers
      let qualitySum = 0;
      for (const r of completedOrLate) {
        let indicators = 0;
        let total = 0;
        if (r.childUpdatesIncluded) indicators++;
        total++;
        if (r.riskUpdatesIncluded) indicators++;
        total++;
        if (r.medicationUpdatesIncluded) indicators++;
        total++;
        if (r.incidentsBriefed) indicators++;
        total++;
        if (r.emotionalPresentationNoted) indicators++;
        total++;
        if (r.planChangesHighlighted) indicators++;
        total++;
        qualitySum += pct(indicators, total);
      }
      const avgQualityScore = completedOrLate.length > 0
        ? Math.round(qualitySum / completedOrLate.length)
        : 0;

      // Average duration
      const durationsPresent = completedOrLate.filter((r) => r.durationMinutes !== undefined);
      const avgDuration = durationsPresent.length > 0
        ? Math.round(
            (durationsPresent.reduce((sum, r) => sum + (r.durationMinutes ?? 0), 0) /
              durationsPresent.length) *
              10,
          ) / 10
        : 0;

      // Critical items missed (unacknowledged)
      let criticalItemsMissed = 0;
      for (const r of shiftRecords) {
        criticalItemsMissed += r.criticalItems.filter((i) => !i.acknowledged).length;
      }

      return {
        shiftType,
        totalHandovers,
        completionRate,
        avgQualityScore,
        avgDuration,
        criticalItemsMissed,
      };
    })
    .filter((p) => p.totalHandovers > 0);
}

// -- Main Intelligence Function -----------------------------------------------

export function generateHandoverIntelligence(
  records: HandoverRecord[],
  expectations: HandoverExpectation[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): HandoverIntelligenceResult {
  const completeness = evaluateHandoverCompleteness(records, expectations, periodStart, periodEnd);
  const quality = evaluateHandoverQuality(records, periodStart, periodEnd);
  const informationTransfer = evaluateInformationTransfer(records, periodStart, periodEnd);
  const continuity = evaluateContinuityOfCare(records, periodStart, periodEnd);
  const shiftProfiles = buildShiftProfiles(records, periodStart, periodEnd);

  // -- Scoring ----------------------------------------------------------------

  // 1. Completeness (25 points): based on completionRate
  let completenessScore = 0;
  if (completeness.completionRate > 95) completenessScore = 25;
  else if (completeness.completionRate > 85) completenessScore = 20;
  else if (completeness.completionRate > 70) completenessScore = 12;
  else completenessScore = 5;

  // 2. Quality (30 points): based on overallQualityScore
  // Each quality indicator above 90% adds points
  let qualityScore = 0;
  const qualityIndicators = [
    quality.childUpdatesRate,
    quality.riskUpdatesRate,
    quality.medicationUpdatesRate,
    quality.incidentBriefingRate,
    quality.emotionalPresentationRate,
    quality.planChangesRate,
  ];
  const indicatorsAbove90 = qualityIndicators.filter((v) => v > 90).length;
  if (quality.overallQualityScore > 90) qualityScore = 30;
  else if (quality.overallQualityScore > 80) qualityScore = 24;
  else if (quality.overallQualityScore > 70) qualityScore = 18;
  else if (quality.overallQualityScore > 50) qualityScore = 10;
  else qualityScore = 3;
  // Bonus for individual indicators above 90%
  qualityScore = Math.min(30, qualityScore + Math.floor(indicatorsAbove90 / 2));

  // 3. Information transfer (25 points): criticalAcknowledgedRate and followUpCompletedRate
  let transferScore = 0;
  const periodRecords = records.filter((r) => r.date >= periodStart && r.date <= periodEnd);
  if (periodRecords.length === 0) {
    // No records at all = no evidence of information transfer
    transferScore = 0;
  } else {
    const critWeight = 0.6;
    const followWeight = 0.4;
    const critComponent = informationTransfer.totalCriticalItems > 0
      ? informationTransfer.criticalAcknowledgedRate
      : 100; // No critical items = perfect
    const followComponent = informationTransfer.followUpRequiredCount > 0
      ? informationTransfer.followUpCompletedRate
      : 100;
    const transferPct = Math.round(critComponent * critWeight + followComponent * followWeight);
    if (transferPct > 95) transferScore = 25;
    else if (transferPct > 85) transferScore = 20;
    else if (transferPct > 70) transferScore = 12;
    else transferScore = 5;
  }

  // 4. Continuity (20 points): based on continuityRating and staffOverlap
  let continuityScore = 0;
  if (continuity.continuityRating === "excellent") continuityScore = 20;
  else if (continuity.continuityRating === "good") continuityScore = 15;
  else if (continuity.continuityRating === "adequate") continuityScore = 8;
  else continuityScore = 3;

  const overallScore = Math.min(
    100,
    Math.max(0, completenessScore + qualityScore + transferScore + continuityScore),
  );

  const rating: HandoverIntelligenceResult["rating"] =
    overallScore >= 80
      ? "outstanding"
      : overallScore >= 60
        ? "good"
        : overallScore >= 40
          ? "requires_improvement"
          : "inadequate";

  // -- Strengths / Areas / Actions --------------------------------------------

  const strengths: string[] = [];
  const areasForImprovement: string[] = [];
  const actions: string[] = [];

  // Strengths
  if (completeness.completionRate >= 95) {
    strengths.push(
      `Excellent handover completion rate at ${completeness.completionRate}% -- shifts are reliably handed over`,
    );
  }
  if (quality.overallQualityScore >= 90) {
    strengths.push(
      "High quality handovers with comprehensive information sharing across all indicators",
    );
  }
  if (
    informationTransfer.totalCriticalItems > 0 &&
    informationTransfer.criticalAcknowledgedRate >= 100
  ) {
    strengths.push(
      "All critical information items acknowledged by incoming staff -- strong safeguarding communication",
    );
  }
  if (
    informationTransfer.followUpRequiredCount > 0 &&
    informationTransfer.followUpCompletedRate >= 90
  ) {
    strengths.push("Handover follow-up actions are consistently completed");
  }
  if (continuity.continuityRating === "excellent") {
    strengths.push(
      "Excellent continuity of care -- consistent staffing supports relationship-based practice",
    );
  }
  if (completeness.missed === 0 && completeness.totalExpected > 0) {
    strengths.push("No missed handovers in the period -- all shift changes were managed");
  }
  if (quality.medicationUpdatesRate >= 100) {
    strengths.push("Medication updates included in every handover -- strong medication safety");
  }
  if (strengths.length === 0) {
    strengths.push(
      "No significant strengths identified -- handover processes require attention",
    );
  }

  // Areas for improvement
  if (completeness.completionRate < 85) {
    areasForImprovement.push(
      `Handover completion rate at ${completeness.completionRate}% -- target 95% or above`,
    );
  }
  if (completeness.missed > 0) {
    areasForImprovement.push(
      `${completeness.missed} missed handover${completeness.missed !== 1 ? "s" : ""} in the period -- every shift change must have a structured handover`,
    );
  }
  if (quality.overallQualityScore < 70 && quality.overallQualityScore > 0) {
    areasForImprovement.push(
      `Handover quality score at ${quality.overallQualityScore}% -- review handover template and staff practice`,
    );
  }
  if (quality.riskUpdatesRate < 90 && quality.riskUpdatesRate > 0) {
    areasForImprovement.push(
      `Risk updates only included in ${quality.riskUpdatesRate}% of handovers -- must be included every time`,
    );
  }
  if (quality.emotionalPresentationRate < 80 && quality.emotionalPresentationRate > 0) {
    areasForImprovement.push(
      `Emotional presentations noted in only ${quality.emotionalPresentationRate}% of handovers -- important for trauma-informed care`,
    );
  }
  if (
    informationTransfer.totalCriticalItems > 0 &&
    informationTransfer.criticalAcknowledgedRate < 100
  ) {
    areasForImprovement.push(
      `Critical information acknowledged rate at ${informationTransfer.criticalAcknowledgedRate}% -- all critical items must be acknowledged`,
    );
  }
  if (continuity.continuityRating === "poor" || continuity.continuityRating === "adequate") {
    areasForImprovement.push(
      "Staff continuity needs improvement -- consider rota adjustments to support relationship-based practice",
    );
  }
  if (areasForImprovement.length === 0) {
    areasForImprovement.push("No significant areas for improvement identified");
  }

  // Immediate actions
  if (informationTransfer.unacknowledgedCriticalItems.length > 0) {
    actions.push(
      `URGENT: ${informationTransfer.unacknowledgedCriticalItems.length} unacknowledged critical item${informationTransfer.unacknowledgedCriticalItems.length !== 1 ? "s" : ""} -- review immediately to ensure safeguarding information has been received`,
    );
  }
  if (completeness.missed > 2) {
    actions.push(
      `HIGH: ${completeness.missed} missed handovers detected -- investigate root cause and implement corrective measures`,
    );
  }
  if (quality.medicationUpdatesRate < 100 && quality.medicationUpdatesRate > 0) {
    actions.push(
      `HIGH: Medication updates missing in ${100 - quality.medicationUpdatesRate}% of handovers -- medication errors risk`,
    );
  }
  if (
    informationTransfer.followUpRequiredCount > 0 &&
    informationTransfer.followUpCompletedRate < 70
  ) {
    actions.push(
      `MEDIUM: Only ${informationTransfer.followUpCompletedRate}% of follow-up actions completed -- implement tracking system`,
    );
  }
  const lowQualityShifts = shiftProfiles.filter(
    (p) => p.avgQualityScore < 60 && p.totalHandovers > 0,
  );
  if (lowQualityShifts.length > 0) {
    const shiftNames = lowQualityShifts.map((p) => getShiftLabel(p.shiftType)).join(", ");
    actions.push(
      `MEDIUM: Low quality handovers on ${shiftNames} shift${lowQualityShifts.length !== 1 ? "s" : ""} -- targeted improvement needed`,
    );
  }
  if (actions.length === 0) {
    actions.push(
      "No immediate actions required -- handover processes are well maintained",
    );
  }

  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 13 -- Leadership and management (effective communication systems)",
    "CHR 2015 Reg 12 -- Protection of children (information sharing at handovers)",
    "SCCIF -- Quality of care: effective communication between shifts",
    "CHR 2015 Reg 5(c) -- Quality and purpose of care: continuity",
    "Working Together 2023 -- Information sharing to safeguard children",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    completeness,
    quality,
    informationTransfer,
    continuity,
    shiftProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
