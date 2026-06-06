// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Environmental Quality Intelligence Engine
//
// Deterministic engine for evaluating the quality, comfort, and suitability of
// the physical environment in a children's home — personalisation, maintenance
// responsiveness, inspection quality, and child satisfaction.
//
// Aligned to:
//   - CHR 2015 Reg 27 — Accommodation and maintenance
//   - CHR 2015 Reg 6  — Quality and purpose of care
//   - SCCIF           — Quality of care / experiences and progress of children
//   - NMS             — National Minimum Standards for children's homes
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type RoomType =
  | "bedroom"
  | "bathroom"
  | "kitchen"
  | "lounge"
  | "dining_room"
  | "garden"
  | "hallway"
  | "office"
  | "utility"
  | "quiet_room"
  | "activity_room"
  | "laundry"
  | "other";

export type InspectionArea =
  | "cleanliness"
  | "safety"
  | "maintenance"
  | "decoration"
  | "personalisation"
  | "furniture_condition"
  | "lighting"
  | "temperature"
  | "ventilation"
  | "accessibility"
  | "storage"
  | "outdoor_space";

export type MaintenanceStatus =
  | "completed"
  | "scheduled"
  | "overdue"
  | "emergency"
  | "cancelled";

export type MaintenancePriority =
  | "emergency"
  | "urgent"
  | "routine"
  | "planned_improvement";

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface EnvironmentalInspection {
  id: string;
  homeId: string;
  date: string;
  inspectedBy: string;
  area: InspectionArea;
  roomType: RoomType;
  score: number; // 1-10
  issues: string[];
  photographic: boolean;
}

export interface MaintenanceRequest {
  id: string;
  homeId: string;
  reportedDate: string;
  reportedBy: string;
  roomType: RoomType;
  description: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  completedDate?: string;
  daysToResolve?: number;
}

export interface PersonalisationRecord {
  childId: string;
  childName: string;
  bedroomPersonalised: boolean;
  choiceInDecor: boolean;
  personalItems: boolean;
  culturalConsiderations: boolean;
  lastReviewDate: string;
}

export interface ChildEnvironmentView {
  childId: string;
  childName: string;
  date: string;
  overallSatisfaction: number; // 1-10
  feelsHomely: boolean;
  feelsPrivate: boolean;
  feelsSafe: boolean;
  suggestionsForImprovement: string[];
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface InspectionQualityResult {
  averageScore: number;
  inspectionCount: number;
  photographicRate: number;
  issueCount: number;
  areasCovered: number;
  totalAreas: number;
  areaCoverageRate: number;
  roomsCovered: number;
  lowestScoringArea: string;
  lowestScoringAreaScore: number;
  highestScoringArea: string;
  highestScoringAreaScore: number;
}

export interface MaintenanceResponsivenessResult {
  totalRequests: number;
  completionRate: number;
  overdueCount: number;
  emergencyCount: number;
  averageDaysToResolve: number;
  scheduledCount: number;
  cancelledCount: number;
  completedCount: number;
  overdueRate: number;
}

export interface PersonalisationResult {
  totalChildren: number;
  bedroomPersonalisedRate: number;
  choiceInDecorRate: number;
  personalItemsRate: number;
  culturalConsiderationsRate: number;
  overallPersonalisationRate: number;
  fullyPersonalisedCount: number;
  reviewCurrency: number;
}

export interface ChildSatisfactionResult {
  averageSatisfaction: number;
  feelsHomelyRate: number;
  feelsPrivateRate: number;
  feelsSafeRate: number;
  totalViews: number;
  childrenWithViews: number;
  suggestionCount: number;
  childrenWithSuggestions: number;
}

export interface EnvironmentalQualityIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  referenceDate: string;
  overallScore: number;
  rating: "outstanding" | "good" | "requires_improvement" | "inadequate";
  inspectionQuality: InspectionQualityResult;
  maintenanceResponsiveness: MaintenanceResponsivenessResult;
  personalisation: PersonalisationResult;
  childSatisfaction: ChildSatisfactionResult;
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function inPeriod(date: string, start: string, end: string): boolean {
  return date.slice(0, 10) >= start.slice(0, 10) && date.slice(0, 10) <= end.slice(0, 10);
}

function daysBetween(earlier: string, later: string): number {
  const diff = new Date(later).getTime() - new Date(earlier).getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

// ── Label Maps ─────────────────────────────────────────────────────────────

const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  bedroom: "Bedroom",
  bathroom: "Bathroom",
  kitchen: "Kitchen",
  lounge: "Lounge",
  dining_room: "Dining Room",
  garden: "Garden",
  hallway: "Hallway",
  office: "Office",
  utility: "Utility",
  quiet_room: "Quiet Room",
  activity_room: "Activity Room",
  laundry: "Laundry",
  other: "Other",
};

const INSPECTION_AREA_LABELS: Record<InspectionArea, string> = {
  cleanliness: "Cleanliness",
  safety: "Safety",
  maintenance: "Maintenance",
  decoration: "Decoration",
  personalisation: "Personalisation",
  furniture_condition: "Furniture Condition",
  lighting: "Lighting",
  temperature: "Temperature",
  ventilation: "Ventilation",
  accessibility: "Accessibility",
  storage: "Storage",
  outdoor_space: "Outdoor Space",
};

const MAINTENANCE_STATUS_LABELS: Record<MaintenanceStatus, string> = {
  completed: "Completed",
  scheduled: "Scheduled",
  overdue: "Overdue",
  emergency: "Emergency",
  cancelled: "Cancelled",
};

const MAINTENANCE_PRIORITY_LABELS: Record<MaintenancePriority, string> = {
  emergency: "Emergency",
  urgent: "Urgent",
  routine: "Routine",
  planned_improvement: "Planned Improvement",
};

// ── Label Functions ────────────────────────────────────────────────────────

export function getRoomTypeLabel(roomType: RoomType): string {
  return ROOM_TYPE_LABELS[roomType] ?? roomType.replace(/_/g, " ");
}

export function getInspectionAreaLabel(area: InspectionArea): string {
  return INSPECTION_AREA_LABELS[area] ?? area.replace(/_/g, " ");
}

export function getMaintenanceStatusLabel(status: MaintenanceStatus): string {
  return MAINTENANCE_STATUS_LABELS[status] ?? status.replace(/_/g, " ");
}

export function getMaintenancePriorityLabel(priority: MaintenancePriority): string {
  return MAINTENANCE_PRIORITY_LABELS[priority] ?? priority.replace(/_/g, " ");
}

// ── All valid values for each type ─────────────────────────────────────────

const ALL_INSPECTION_AREAS: InspectionArea[] = [
  "cleanliness", "safety", "maintenance", "decoration", "personalisation",
  "furniture_condition", "lighting", "temperature", "ventilation",
  "accessibility", "storage", "outdoor_space",
];

// ── Function 1: Evaluate Inspection Quality ────────────────────────────────

export function evaluateInspectionQuality(
  inspections: EnvironmentalInspection[],
  periodStart: string,
  periodEnd: string,
): InspectionQualityResult {
  const periodInspections = inspections.filter((i) =>
    inPeriod(i.date, periodStart, periodEnd),
  );

  const total = periodInspections.length;
  if (total === 0) {
    return {
      averageScore: 0,
      inspectionCount: 0,
      photographicRate: 0,
      issueCount: 0,
      areasCovered: 0,
      totalAreas: ALL_INSPECTION_AREAS.length,
      areaCoverageRate: 0,
      roomsCovered: 0,
      lowestScoringArea: "N/A",
      lowestScoringAreaScore: 0,
      highestScoringArea: "N/A",
      highestScoringAreaScore: 0,
    };
  }

  const averageScore =
    Math.round(
      (periodInspections.reduce((sum, i) => sum + i.score, 0) / total) * 10,
    ) / 10;

  const withPhotos = periodInspections.filter((i) => i.photographic).length;
  const photographicRate = pct(withPhotos, total);

  const issueCount = periodInspections.reduce(
    (sum, i) => sum + i.issues.length,
    0,
  );

  const uniqueAreas = new Set(periodInspections.map((i) => i.area));
  const areasCovered = uniqueAreas.size;
  const areaCoverageRate = pct(areasCovered, ALL_INSPECTION_AREAS.length);

  const uniqueRooms = new Set(periodInspections.map((i) => i.roomType));
  const roomsCovered = uniqueRooms.size;

  // Calculate average score per area
  const areaScores = new Map<string, { total: number; count: number }>();
  for (const insp of periodInspections) {
    const existing = areaScores.get(insp.area);
    if (existing) {
      existing.total += insp.score;
      existing.count += 1;
    } else {
      areaScores.set(insp.area, { total: insp.score, count: 1 });
    }
  }

  let lowestArea = "N/A";
  let lowestScore = Infinity;
  let highestArea = "N/A";
  let highestScore = -Infinity;

  for (const [area, data] of areaScores.entries()) {
    const avg = data.total / data.count;
    if (avg < lowestScore) {
      lowestScore = avg;
      lowestArea = area;
    }
    if (avg > highestScore) {
      highestScore = avg;
      highestArea = area;
    }
  }

  return {
    averageScore,
    inspectionCount: total,
    photographicRate,
    issueCount,
    areasCovered,
    totalAreas: ALL_INSPECTION_AREAS.length,
    areaCoverageRate,
    roomsCovered,
    lowestScoringArea: lowestArea,
    lowestScoringAreaScore: lowestScore === Infinity ? 0 : Math.round(lowestScore * 10) / 10,
    highestScoringArea: highestArea,
    highestScoringAreaScore: highestScore === -Infinity ? 0 : Math.round(highestScore * 10) / 10,
  };
}

// ── Function 2: Evaluate Maintenance Responsiveness ────────────────────────

export function evaluateMaintenanceResponsiveness(
  requests: MaintenanceRequest[],
  periodStart: string,
  periodEnd: string,
): MaintenanceResponsivenessResult {
  const periodRequests = requests.filter((r) =>
    inPeriod(r.reportedDate, periodStart, periodEnd),
  );

  const total = periodRequests.length;
  if (total === 0) {
    return {
      totalRequests: 0,
      completionRate: 0,
      overdueCount: 0,
      emergencyCount: 0,
      averageDaysToResolve: 0,
      scheduledCount: 0,
      cancelledCount: 0,
      completedCount: 0,
      overdueRate: 0,
    };
  }

  const completed = periodRequests.filter((r) => r.status === "completed");
  const overdue = periodRequests.filter((r) => r.status === "overdue");
  const emergency = periodRequests.filter((r) => r.status === "emergency");
  const scheduled = periodRequests.filter((r) => r.status === "scheduled");
  const cancelled = periodRequests.filter((r) => r.status === "cancelled");

  const completionRate = pct(completed.length, total);
  const overdueRate = pct(overdue.length, total);

  // Average days to resolve for completed requests
  const completedWithDays = completed.filter(
    (r) => r.daysToResolve !== undefined && r.daysToResolve !== null,
  );
  const averageDaysToResolve =
    completedWithDays.length > 0
      ? Math.round(
          (completedWithDays.reduce((sum, r) => sum + (r.daysToResolve ?? 0), 0) /
            completedWithDays.length) *
            10,
        ) / 10
      : 0;

  return {
    totalRequests: total,
    completionRate,
    overdueCount: overdue.length,
    emergencyCount: emergency.length,
    averageDaysToResolve,
    scheduledCount: scheduled.length,
    cancelledCount: cancelled.length,
    completedCount: completed.length,
    overdueRate,
  };
}

// ── Function 3: Evaluate Personalisation ───────────────────────────────────

export function evaluatePersonalisation(
  records: PersonalisationRecord[],
  referenceDate: string,
): PersonalisationResult {
  const total = records.length;
  if (total === 0) {
    return {
      totalChildren: 0,
      bedroomPersonalisedRate: 0,
      choiceInDecorRate: 0,
      personalItemsRate: 0,
      culturalConsiderationsRate: 0,
      overallPersonalisationRate: 0,
      fullyPersonalisedCount: 0,
      reviewCurrency: 0,
    };
  }

  const bedroomPersonalised = records.filter((r) => r.bedroomPersonalised).length;
  const choiceInDecor = records.filter((r) => r.choiceInDecor).length;
  const personalItems = records.filter((r) => r.personalItems).length;
  const culturalConsiderations = records.filter((r) => r.culturalConsiderations).length;

  const bedroomPersonalisedRate = pct(bedroomPersonalised, total);
  const choiceInDecorRate = pct(choiceInDecor, total);
  const personalItemsRate = pct(personalItems, total);
  const culturalConsiderationsRate = pct(culturalConsiderations, total);

  // Overall personalisation: average of the four rates
  const overallPersonalisationRate = Math.round(
    (bedroomPersonalisedRate + choiceInDecorRate + personalItemsRate + culturalConsiderationsRate) / 4,
  );

  // Fully personalised: all four criteria met
  const fullyPersonalised = records.filter(
    (r) => r.bedroomPersonalised && r.choiceInDecor && r.personalItems && r.culturalConsiderations,
  );

  // Review currency: reviewed within the last 6 months relative to referenceDate
  const sixMonthsAgo = new Date(referenceDate);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const sixMonthsAgoStr = sixMonthsAgo.toISOString().slice(0, 10);

  const currentReviews = records.filter((r) => r.lastReviewDate >= sixMonthsAgoStr);
  const reviewCurrency = pct(currentReviews.length, total);

  return {
    totalChildren: total,
    bedroomPersonalisedRate,
    choiceInDecorRate,
    personalItemsRate,
    culturalConsiderationsRate,
    overallPersonalisationRate,
    fullyPersonalisedCount: fullyPersonalised.length,
    reviewCurrency,
  };
}

// ── Function 4: Evaluate Child Satisfaction ────────────────────────────────

export function evaluateChildSatisfaction(
  views: ChildEnvironmentView[],
  periodStart: string,
  periodEnd: string,
): ChildSatisfactionResult {
  const periodViews = views.filter((v) =>
    inPeriod(v.date, periodStart, periodEnd),
  );

  const total = periodViews.length;
  if (total === 0) {
    return {
      averageSatisfaction: 0,
      feelsHomelyRate: 0,
      feelsPrivateRate: 0,
      feelsSafeRate: 0,
      totalViews: 0,
      childrenWithViews: 0,
      suggestionCount: 0,
      childrenWithSuggestions: 0,
    };
  }

  const averageSatisfaction =
    Math.round(
      (periodViews.reduce((sum, v) => sum + v.overallSatisfaction, 0) / total) *
        10,
    ) / 10;

  const homely = periodViews.filter((v) => v.feelsHomely).length;
  const privateViews = periodViews.filter((v) => v.feelsPrivate).length;
  const safe = periodViews.filter((v) => v.feelsSafe).length;

  const uniqueChildren = new Set(periodViews.map((v) => v.childId));
  const childrenWithSuggestions = new Set(
    periodViews
      .filter((v) => v.suggestionsForImprovement.length > 0)
      .map((v) => v.childId),
  );

  const suggestionCount = periodViews.reduce(
    (sum, v) => sum + v.suggestionsForImprovement.length,
    0,
  );

  return {
    averageSatisfaction,
    feelsHomelyRate: pct(homely, total),
    feelsPrivateRate: pct(privateViews, total),
    feelsSafeRate: pct(safe, total),
    totalViews: total,
    childrenWithViews: uniqueChildren.size,
    suggestionCount,
    childrenWithSuggestions: childrenWithSuggestions.size,
  };
}

// ── Function 5: Generate Full Intelligence ─────────────────────────────────

export function generateEnvironmentalQualityIntelligence(
  inspections: EnvironmentalInspection[],
  maintenanceRequests: MaintenanceRequest[],
  personalisationRecords: PersonalisationRecord[],
  childViews: ChildEnvironmentView[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
  referenceDate: string,
): EnvironmentalQualityIntelligence {
  // Run all evaluations
  const inspectionQuality = evaluateInspectionQuality(inspections, periodStart, periodEnd);
  const maintenanceResponsiveness = evaluateMaintenanceResponsiveness(
    maintenanceRequests,
    periodStart,
    periodEnd,
  );
  const personalisation = evaluatePersonalisation(personalisationRecords, referenceDate);
  const childSatisfaction = evaluateChildSatisfaction(childViews, periodStart, periodEnd);

  // ── Scoring (100 points total) ───────────────────────────────────────────
  // 1. Inspection Quality (25 pts)
  //    - Average score normalised from 1-10 to 0-15 pts
  //    - Area coverage (5 pts)
  //    - Photographic evidence (5 pts)
  const inspScoreNorm = inspectionQuality.inspectionCount > 0
    ? ((inspectionQuality.averageScore - 1) / 9) * 15
    : 0;
  const areaCovPts = (inspectionQuality.areaCoverageRate / 100) * 5;
  const photoPts = (inspectionQuality.photographicRate / 100) * 5;
  const inspScore = Math.min(25, Math.round(inspScoreNorm + areaCovPts + photoPts));

  // 2. Maintenance Responsiveness (25 pts)
  //    - Completion rate (10 pts)
  //    - No overdue items bonus (5 pts — inversely proportional to overdue rate)
  //    - Average resolution speed (5 pts — max at <=3 days)
  //    - Emergency handling (5 pts — emergency count == 0 is full marks)
  const completionPts = (maintenanceResponsiveness.completionRate / 100) * 10;
  const noOverduePts = maintenanceResponsiveness.totalRequests > 0
    ? ((100 - maintenanceResponsiveness.overdueRate) / 100) * 5
    : 0;
  const speedPts = maintenanceResponsiveness.completedCount > 0
    ? Math.min(5, Math.max(0, 5 - (maintenanceResponsiveness.averageDaysToResolve - 3) * 0.5))
    : 0;
  const emergencyPts = maintenanceResponsiveness.totalRequests > 0
    ? (maintenanceResponsiveness.emergencyCount === 0 ? 5 : Math.max(0, 5 - maintenanceResponsiveness.emergencyCount))
    : 0;
  const maintScore = Math.min(25, Math.round(completionPts + noOverduePts + speedPts + emergencyPts));

  // 3. Personalisation (25 pts)
  //    - Overall personalisation rate (10 pts)
  //    - Bedroom personalised rate (5 pts)
  //    - Cultural considerations rate (5 pts)
  //    - Review currency (5 pts)
  const persOverallPts = (personalisation.overallPersonalisationRate / 100) * 10;
  const bedroomPts = (personalisation.bedroomPersonalisedRate / 100) * 5;
  const culturalPts = (personalisation.culturalConsiderationsRate / 100) * 5;
  const persReviewPts = (personalisation.reviewCurrency / 100) * 5;
  const persScore = Math.min(25, Math.round(persOverallPts + bedroomPts + culturalPts + persReviewPts));

  // 4. Child Satisfaction (25 pts)
  //    - Average satisfaction normalised from 1-10 to 0-10 pts
  //    - Feels homely (5 pts)
  //    - Feels safe (5 pts)
  //    - Feels private (5 pts)
  const satNorm = childSatisfaction.totalViews > 0
    ? ((childSatisfaction.averageSatisfaction - 1) / 9) * 10
    : 0;
  const homelyPts = (childSatisfaction.feelsHomelyRate / 100) * 5;
  const safePts = (childSatisfaction.feelsSafeRate / 100) * 5;
  const privatePts = (childSatisfaction.feelsPrivateRate / 100) * 5;
  const satScore = Math.min(25, Math.round(satNorm + homelyPts + safePts + privatePts));

  // Overall
  const overallScore = Math.min(
    100,
    Math.max(0, inspScore + maintScore + persScore + satScore),
  );
  const rating: EnvironmentalQualityIntelligence["rating"] =
    overallScore >= 80
      ? "outstanding"
      : overallScore >= 60
        ? "good"
        : overallScore >= 40
          ? "requires_improvement"
          : "inadequate";

  // ── Strengths ────────────────────────────────────────────────────────────
  const strengths: string[] = [];

  if (inspectionQuality.averageScore >= 8) {
    strengths.push(
      "Inspection scores are consistently high, indicating a well-maintained and high-quality environment across the home.",
    );
  }
  if (inspectionQuality.areaCoverageRate === 100) {
    strengths.push(
      "All inspection areas are covered, demonstrating thorough environmental oversight.",
    );
  }
  if (inspectionQuality.photographicRate >= 80) {
    strengths.push(
      "Photographic evidence is captured in the majority of inspections, providing a robust audit trail.",
    );
  }
  if (maintenanceResponsiveness.completionRate >= 80) {
    strengths.push(
      "Maintenance completion rate is strong, reflecting prompt attention to reported issues.",
    );
  }
  if (maintenanceResponsiveness.overdueCount === 0 && maintenanceResponsiveness.totalRequests > 0) {
    strengths.push(
      "No maintenance requests are overdue, demonstrating excellent responsiveness to the physical environment.",
    );
  }
  if (maintenanceResponsiveness.averageDaysToResolve <= 3 && maintenanceResponsiveness.completedCount > 0) {
    strengths.push(
      "Average maintenance resolution time is three days or fewer, ensuring minimal disruption to children.",
    );
  }
  if (personalisation.bedroomPersonalisedRate === 100) {
    strengths.push(
      "All children's bedrooms are personalised, creating individual spaces that feel like their own.",
    );
  }
  if (personalisation.overallPersonalisationRate >= 80) {
    strengths.push(
      "Personalisation standards are high across the home, supporting a homely and child-centred environment.",
    );
  }
  if (personalisation.culturalConsiderationsRate === 100) {
    strengths.push(
      "Cultural considerations are addressed for every child, reflecting inclusive and respectful care practice.",
    );
  }
  if (childSatisfaction.averageSatisfaction >= 8) {
    strengths.push(
      "Children report high overall satisfaction with their environment, indicating the home meets their needs well.",
    );
  }
  if (childSatisfaction.feelsSafeRate === 100) {
    strengths.push(
      "All children report feeling safe in their home, a fundamental requirement for quality residential care.",
    );
  }
  if (childSatisfaction.feelsHomelyRate >= 80) {
    strengths.push(
      "The majority of children feel the home is homely, reflecting successful efforts to create a warm and welcoming environment.",
    );
  }
  if (childSatisfaction.feelsPrivateRate >= 80) {
    strengths.push(
      "Children feel they have adequate privacy, supporting their dignity and personal development.",
    );
  }

  // ── Areas for Improvement ────────────────────────────────────────────────
  const areasForImprovement: string[] = [];

  if (inspectionQuality.averageScore > 0 && inspectionQuality.averageScore < 6) {
    areasForImprovement.push(
      "Average inspection scores are below 6/10 — the physical environment requires significant improvement to meet expected standards.",
    );
  }
  if (inspectionQuality.areaCoverageRate < 100 && inspectionQuality.inspectionCount > 0) {
    areasForImprovement.push(
      `Only ${inspectionQuality.areasCovered} of ${inspectionQuality.totalAreas} inspection areas covered — expand inspections to include all areas for comprehensive oversight.`,
    );
  }
  if (inspectionQuality.photographicRate < 50 && inspectionQuality.inspectionCount > 0) {
    areasForImprovement.push(
      "Less than half of inspections include photographic evidence — increase photo documentation to strengthen the audit trail.",
    );
  }
  if (inspectionQuality.issueCount > 5) {
    areasForImprovement.push(
      `${inspectionQuality.issueCount} issues identified across inspections — develop a prioritised action plan to address these systematically.`,
    );
  }
  if (maintenanceResponsiveness.overdueCount > 0) {
    areasForImprovement.push(
      `${maintenanceResponsiveness.overdueCount} maintenance request(s) are overdue — prioritise completing overdue repairs to maintain a safe and comfortable environment.`,
    );
  }
  if (maintenanceResponsiveness.completionRate < 70 && maintenanceResponsiveness.totalRequests > 0) {
    areasForImprovement.push(
      "Maintenance completion rate is below 70% — review the maintenance workflow to identify and remove bottlenecks.",
    );
  }
  if (maintenanceResponsiveness.averageDaysToResolve > 7 && maintenanceResponsiveness.completedCount > 0) {
    areasForImprovement.push(
      "Average maintenance resolution time exceeds one week — improve response times to minimise impact on children's daily experience.",
    );
  }
  if (personalisation.bedroomPersonalisedRate < 100) {
    areasForImprovement.push(
      "Not all children's bedrooms are personalised — every child should have the opportunity to make their bedroom their own space.",
    );
  }
  if (personalisation.culturalConsiderationsRate < 100) {
    areasForImprovement.push(
      "Cultural considerations are not recorded for all children — review and ensure each child's cultural needs are reflected in their environment.",
    );
  }
  if (personalisation.reviewCurrency < 80) {
    areasForImprovement.push(
      "Personalisation reviews are not up to date for all children — ensure reviews are completed within the six-month cycle.",
    );
  }
  if (childSatisfaction.averageSatisfaction > 0 && childSatisfaction.averageSatisfaction < 6) {
    areasForImprovement.push(
      "Average child satisfaction is below 6/10 — engage directly with children to understand and address their concerns about the environment.",
    );
  }
  if (childSatisfaction.feelsSafeRate < 100 && childSatisfaction.totalViews > 0) {
    areasForImprovement.push(
      "Not all children feel safe in their home — this must be treated as an urgent priority to identify and resolve safety concerns.",
    );
  }
  if (childSatisfaction.feelsHomelyRate < 70 && childSatisfaction.totalViews > 0) {
    areasForImprovement.push(
      "Fewer than 70% of children feel the home is homely — involve children in decisions about shared spaces and decoration.",
    );
  }
  if (childSatisfaction.feelsPrivateRate < 70 && childSatisfaction.totalViews > 0) {
    areasForImprovement.push(
      "Fewer than 70% of children feel they have adequate privacy — review bedroom access, shared spaces, and personal boundaries.",
    );
  }

  // ── Actions ──────────────────────────────────────────────────────────────
  const actions: string[] = [];

  if (maintenanceResponsiveness.overdueCount > 0) {
    actions.push(
      "Complete all overdue maintenance requests within the next two weeks, prioritising any that affect children's bedrooms or bathrooms.",
    );
  }
  if (maintenanceResponsiveness.emergencyCount > 0) {
    actions.push(
      "Review the emergency maintenance log to ensure all emergency items have been fully resolved and any root causes addressed.",
    );
  }
  if (inspectionQuality.areaCoverageRate < 100 && inspectionQuality.inspectionCount > 0) {
    actions.push(
      "Schedule inspections for all uncovered areas to ensure full environmental oversight by the end of the next reporting period.",
    );
  }
  if (inspectionQuality.photographicRate < 70 && inspectionQuality.inspectionCount > 0) {
    actions.push(
      "Require photographic evidence for all future inspections to build a consistent visual record of the environment.",
    );
  }
  if (personalisation.bedroomPersonalisedRate < 100) {
    actions.push(
      "Work with each child who does not yet have a personalised bedroom to choose colours, furnishings, and personal items.",
    );
  }
  if (personalisation.culturalConsiderationsRate < 100) {
    actions.push(
      "Complete cultural considerations reviews for all children, consulting with families and social workers where appropriate.",
    );
  }
  if (personalisation.reviewCurrency < 80) {
    actions.push(
      "Schedule personalisation reviews for all children whose reviews are overdue within the next month.",
    );
  }
  if (childSatisfaction.feelsSafeRate < 100 && childSatisfaction.totalViews > 0) {
    actions.push(
      "Conduct individual conversations with any child who does not feel safe to identify specific concerns and take immediate protective action.",
    );
  }
  if (childSatisfaction.feelsHomelyRate < 80 && childSatisfaction.totalViews > 0) {
    actions.push(
      "Hold a children's meeting to discuss how communal spaces can be improved to feel more homely and welcoming.",
    );
  }
  if (childSatisfaction.suggestionCount > 0) {
    actions.push(
      "Review and respond to all children's suggestions for environmental improvement, providing feedback on which will be actioned.",
    );
  }
  if (inspectionQuality.issueCount > 0) {
    actions.push(
      "Create a remediation plan for all issues identified in environmental inspections, with target completion dates.",
    );
  }
  if (maintenanceResponsiveness.averageDaysToResolve > 5 && maintenanceResponsiveness.completedCount > 0) {
    actions.push(
      "Review the maintenance reporting and completion workflow to reduce average resolution time.",
    );
  }

  // ── Regulatory Links ─────────────────────────────────────────────────────
  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 27 — Accommodation and maintenance: the premises are of a suitable standard, well-maintained, and kept in good repair.",
    "CHR 2015 Reg 6 — Quality and purpose of care: the home provides a comfortable, safe, and homely environment that meets each child's individual needs.",
    "SCCIF Quality of Care — Children live in a home that is well-maintained, homely, and personalised to reflect their identities and preferences.",
    "SCCIF Experiences and Progress — Children's views about their living environment are sought, recorded, and acted upon.",
    "NMS 10 — Providing a suitable physical environment: bedrooms are personalised, shared spaces are welcoming, and the home is maintained to a high standard.",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    referenceDate,
    overallScore,
    rating,
    inspectionQuality,
    maintenanceResponsiveness,
    personalisation,
    childSatisfaction,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
