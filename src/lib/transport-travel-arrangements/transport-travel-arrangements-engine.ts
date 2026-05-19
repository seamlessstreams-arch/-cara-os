// ══════════════════════════════════════════════════════════════════════════════
// TRANSPORT & TRAVEL ARRANGEMENTS INTELLIGENCE ENGINE
//
// Pure deterministic engine for evaluating the quality and safety of transport
// and travel arrangements in children's residential care homes, covering
// journey quality, vehicle safety, travel policy, and staff travel readiness.
//
// Regulatory basis:
//   - CHR 2015, Reg 10 — The health and education standard (transport to placements)
//   - CHR 2015, Reg 13 — Leadership and management (overseeing transport arrangements)
//   - SCCIF — Social Care Common Inspection Framework (Ofsted)
//   - NMS 3 — National Minimum Standards: safeguarding (transport safety)
//   - Road Traffic Act 1988 — Driver licensing, vehicle roadworthiness, insurance
//   - Health and Safety at Work Act 1974 — General duty of care during transport
//   - Children Act 1989 — Welfare of the child (safe travel arrangements)
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type TravelType =
  | "school_run"
  | "contact_visit"
  | "medical_appointment"
  | "social_activity"
  | "education_placement"
  | "court_hearing"
  | "therapy_session"
  | "other";

export type TransportMode =
  | "staff_car"
  | "minibus"
  | "public_transport"
  | "taxi"
  | "walking"
  | "specialist_vehicle"
  | "other";

export type RiskLevel = "low" | "medium" | "high";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Label Maps & Getters ───────────────────────────────────────────────────

const travelTypeLabels: Record<TravelType, string> = {
  school_run: "School Run",
  contact_visit: "Contact Visit",
  medical_appointment: "Medical Appointment",
  social_activity: "Social Activity",
  education_placement: "Education Placement",
  court_hearing: "Court Hearing",
  therapy_session: "Therapy Session",
  other: "Other",
};

export function getTravelTypeLabel(type: TravelType): string {
  return travelTypeLabels[type] ?? type;
}

const transportModeLabels: Record<TransportMode, string> = {
  staff_car: "Staff Car",
  minibus: "Minibus",
  public_transport: "Public Transport",
  taxi: "Taxi",
  walking: "Walking",
  specialist_vehicle: "Specialist Vehicle",
  other: "Other",
};

export function getTransportModeLabel(mode: TransportMode): string {
  return transportModeLabels[mode] ?? mode;
}

const riskLevelLabels: Record<RiskLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export function getRiskLevelLabel(level: RiskLevel): string {
  return riskLevelLabels[level] ?? level;
}

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getRatingLabel(rating: Rating): string {
  return ratingLabels[rating] ?? rating;
}

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface TravelRecord {
  id: string;
  childId: string;
  childName: string;
  travelDate: string;
  travelType: TravelType;
  transportMode: TransportMode;
  driverStaffId: string;
  driverStaffName: string;
  riskAssessmentCompleted: boolean;
  seatbeltUsed: boolean;
  journeyOnTime: boolean;
  childComfortable: boolean;
  insuranceVerified: boolean;
}

export interface VehicleCheck {
  id: string;
  vehicleId: string;
  vehicleName: string;
  checkDate: string;
  checkedBy: string;
  motCurrent: boolean;
  insuranceCurrent: boolean;
  roadworthyCondition: boolean;
  firstAidKitPresent: boolean;
  childLockEnabled: boolean;
  cleanAndTidy: boolean;
}

export interface TravelPolicy {
  id: string;
  driverChecksCompleted: boolean;
  insuranceVerified: boolean;
  riskAssessmentProtocol: boolean;
  loneDrivingPolicy: boolean;
  breakdownProcedure: boolean;
  childConsentObtained: boolean;
  routePlanningRequired: boolean;
}

export interface StaffTravelTraining {
  id: string;
  staffId: string;
  staffName: string;
  drivingAssessment: boolean;
  childTransportSafety: boolean;
  firstAidTraining: boolean;
  riskAssessment: boolean;
  breakdownProcedure: boolean;
  childComfortAwareness: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface JourneyQualityEvaluation {
  totalJourneys: number;
  onTimeRate: number;
  riskAssessmentRate: number;
  seatbeltRate: number;
  childComfortableRate: number;
  journeysByType: Record<string, number>;
  journeysByMode: Record<string, number>;
  journeyQualityScore: number;
}

export interface VehicleSafetyEvaluation {
  totalChecks: number;
  motCurrentRate: number;
  insuranceCurrentRate: number;
  roadworthyRate: number;
  firstAidKitRate: number;
  childLockRate: number;
  cleanAndTidyRate: number;
  vehicleSafetyScore: number;
}

export interface TravelPolicyEvaluation {
  totalPolicies: number;
  driverChecksRate: number;
  insuranceVerifiedRate: number;
  riskAssessmentProtocolRate: number;
  loneDrivingPolicyRate: number;
  breakdownProcedureRate: number;
  childConsentRate: number;
  routePlanningRate: number;
  travelPolicyScore: number;
}

export interface StaffTravelReadinessEvaluation {
  totalStaff: number;
  drivingAssessmentRate: number;
  childTransportSafetyRate: number;
  firstAidTrainingRate: number;
  riskAssessmentRate: number;
  breakdownProcedureRate: number;
  childComfortAwarenessRate: number;
  staffTravelReadinessScore: number;
}

export interface ChildTravelProfile {
  childId: string;
  childName: string;
  totalJourneys: number;
  travelTypes: string[];
  onTimeRate: number;
  riskAssessmentRate: number;
  seatbeltRate: number;
  comfortRate: number;
  travelScore: number;
}

export interface TransportTravelArrangementsIntelligence {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  journeyQuality: JourneyQualityEvaluation;
  vehicleSafety: VehicleSafetyEvaluation;
  travelPolicy: TravelPolicyEvaluation;
  staffTravelReadiness: StaffTravelReadinessEvaluation;
  childTravelProfiles: ChildTravelProfile[];
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

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ── 1. Evaluate Journey Quality (0-25) ─────────────────────────────────────

export function evaluateJourneyQuality(
  records: TravelRecord[],
): JourneyQualityEvaluation {
  if (records.length === 0) {
    return {
      totalJourneys: 0,
      onTimeRate: 0,
      riskAssessmentRate: 0,
      seatbeltRate: 0,
      childComfortableRate: 0,
      journeysByType: {},
      journeysByMode: {},
      journeyQualityScore: 0,
    };
  }

  const total = records.length;

  // Journeys by type
  const journeysByType: Record<string, number> = {};
  for (const r of records) {
    journeysByType[r.travelType] = (journeysByType[r.travelType] ?? 0) + 1;
  }

  // Journeys by mode
  const journeysByMode: Record<string, number> = {};
  for (const r of records) {
    journeysByMode[r.transportMode] = (journeysByMode[r.transportMode] ?? 0) + 1;
  }

  // Rates
  const onTime = records.filter((r) => r.journeyOnTime).length;
  const onTimeRate = pct(onTime, total);

  const riskAssessed = records.filter((r) => r.riskAssessmentCompleted).length;
  const riskAssessmentRate = pct(riskAssessed, total);

  const seatbelt = records.filter((r) => r.seatbeltUsed).length;
  const seatbeltRate = pct(seatbelt, total);

  const comfortable = records.filter((r) => r.childComfortable).length;
  const childComfortableRate = pct(comfortable, total);

  // Scoring: on-time 0-7, risk assessment 0-6, seatbelt 0-6, child comfortable 0-6
  const onTimeScore = Math.round((onTimeRate / 100) * 7);
  const riskScore = Math.round((riskAssessmentRate / 100) * 6);
  const seatbeltScore = Math.round((seatbeltRate / 100) * 6);
  const comfortScore = Math.round((childComfortableRate / 100) * 6);

  const journeyQualityScore = clamp(
    onTimeScore + riskScore + seatbeltScore + comfortScore,
    0,
    25,
  );

  return {
    totalJourneys: total,
    onTimeRate,
    riskAssessmentRate,
    seatbeltRate,
    childComfortableRate,
    journeysByType,
    journeysByMode,
    journeyQualityScore,
  };
}

// ── 2. Evaluate Vehicle Safety (0-25) ──────────────────────────────────────

export function evaluateVehicleSafety(
  checks: VehicleCheck[],
): VehicleSafetyEvaluation {
  if (checks.length === 0) {
    return {
      totalChecks: 0,
      motCurrentRate: 0,
      insuranceCurrentRate: 0,
      roadworthyRate: 0,
      firstAidKitRate: 0,
      childLockRate: 0,
      cleanAndTidyRate: 0,
      vehicleSafetyScore: 0,
    };
  }

  const total = checks.length;

  const motCurrent = checks.filter((c) => c.motCurrent).length;
  const motCurrentRate = pct(motCurrent, total);

  const insuranceCurrent = checks.filter((c) => c.insuranceCurrent).length;
  const insuranceCurrentRate = pct(insuranceCurrent, total);

  const roadworthy = checks.filter((c) => c.roadworthyCondition).length;
  const roadworthyRate = pct(roadworthy, total);

  const firstAidKit = checks.filter((c) => c.firstAidKitPresent).length;
  const firstAidKitRate = pct(firstAidKit, total);

  const childLock = checks.filter((c) => c.childLockEnabled).length;
  const childLockRate = pct(childLock, total);

  const cleanTidy = checks.filter((c) => c.cleanAndTidy).length;
  const cleanAndTidyRate = pct(cleanTidy, total);

  // Scoring: MOT 0-7, insurance 0-6, roadworthy 0-6, combined (first aid + child lock + clean) 0-6
  const motScore = Math.round((motCurrentRate / 100) * 7);
  const insuranceScore = Math.round((insuranceCurrentRate / 100) * 6);
  const roadworthyScore = Math.round((roadworthyRate / 100) * 6);

  // Combined: first aid kit (0-2), child lock (0-2), clean and tidy (0-2)
  const firstAidScore = Math.round((firstAidKitRate / 100) * 2);
  const childLockScore = Math.round((childLockRate / 100) * 2);
  const cleanScore = Math.round((cleanAndTidyRate / 100) * 2);
  const combinedScore = firstAidScore + childLockScore + cleanScore;

  const vehicleSafetyScore = clamp(
    motScore + insuranceScore + roadworthyScore + combinedScore,
    0,
    25,
  );

  return {
    totalChecks: total,
    motCurrentRate,
    insuranceCurrentRate,
    roadworthyRate,
    firstAidKitRate,
    childLockRate,
    cleanAndTidyRate,
    vehicleSafetyScore,
  };
}

// ── 3. Evaluate Travel Policy (0-25) ───────────────────────────────────────

export function evaluateTravelPolicy(
  policies: TravelPolicy[],
): TravelPolicyEvaluation {
  if (policies.length === 0) {
    return {
      totalPolicies: 0,
      driverChecksRate: 0,
      insuranceVerifiedRate: 0,
      riskAssessmentProtocolRate: 0,
      loneDrivingPolicyRate: 0,
      breakdownProcedureRate: 0,
      childConsentRate: 0,
      routePlanningRate: 0,
      travelPolicyScore: 0,
    };
  }

  const total = policies.length;

  const driverChecks = policies.filter((p) => p.driverChecksCompleted).length;
  const driverChecksRate = pct(driverChecks, total);

  const insuranceVerified = policies.filter((p) => p.insuranceVerified).length;
  const insuranceVerifiedRate = pct(insuranceVerified, total);

  const riskProtocol = policies.filter((p) => p.riskAssessmentProtocol).length;
  const riskAssessmentProtocolRate = pct(riskProtocol, total);

  const loneDriving = policies.filter((p) => p.loneDrivingPolicy).length;
  const loneDrivingPolicyRate = pct(loneDriving, total);

  const breakdown = policies.filter((p) => p.breakdownProcedure).length;
  const breakdownProcedureRate = pct(breakdown, total);

  const childConsent = policies.filter((p) => p.childConsentObtained).length;
  const childConsentRate = pct(childConsent, total);

  const routePlanning = policies.filter((p) => p.routePlanningRequired).length;
  const routePlanningRate = pct(routePlanning, total);

  // Scoring: 7 boolean fields, roughly 3-4 points each, total 25
  // driverChecks: 0-4, insurance: 0-4, riskProtocol: 0-4, loneDriving: 0-3,
  // breakdown: 0-4, childConsent: 0-3, routePlanning: 0-3
  const s1 = Math.round((driverChecksRate / 100) * 4);
  const s2 = Math.round((insuranceVerifiedRate / 100) * 4);
  const s3 = Math.round((riskAssessmentProtocolRate / 100) * 4);
  const s4 = Math.round((loneDrivingPolicyRate / 100) * 3);
  const s5 = Math.round((breakdownProcedureRate / 100) * 4);
  const s6 = Math.round((childConsentRate / 100) * 3);
  const s7 = Math.round((routePlanningRate / 100) * 3);

  const travelPolicyScore = clamp(s1 + s2 + s3 + s4 + s5 + s6 + s7, 0, 25);

  return {
    totalPolicies: total,
    driverChecksRate,
    insuranceVerifiedRate,
    riskAssessmentProtocolRate,
    loneDrivingPolicyRate,
    breakdownProcedureRate,
    childConsentRate,
    routePlanningRate,
    travelPolicyScore,
  };
}

// ── 4. Evaluate Staff Travel Readiness (0-25) ──────────────────────────────

export function evaluateStaffTravelReadiness(
  staff: StaffTravelTraining[],
): StaffTravelReadinessEvaluation {
  if (staff.length === 0) {
    return {
      totalStaff: 0,
      drivingAssessmentRate: 0,
      childTransportSafetyRate: 0,
      firstAidTrainingRate: 0,
      riskAssessmentRate: 0,
      breakdownProcedureRate: 0,
      childComfortAwarenessRate: 0,
      staffTravelReadinessScore: 0,
    };
  }

  const total = staff.length;

  const drivingAssessment = staff.filter((s) => s.drivingAssessment).length;
  const drivingAssessmentRate = pct(drivingAssessment, total);

  const childTransportSafety = staff.filter((s) => s.childTransportSafety).length;
  const childTransportSafetyRate = pct(childTransportSafety, total);

  const firstAidTraining = staff.filter((s) => s.firstAidTraining).length;
  const firstAidTrainingRate = pct(firstAidTraining, total);

  const riskAssessment = staff.filter((s) => s.riskAssessment).length;
  const riskAssessmentRate = pct(riskAssessment, total);

  const breakdownProcedure = staff.filter((s) => s.breakdownProcedure).length;
  const breakdownProcedureRate = pct(breakdownProcedure, total);

  const childComfortAwareness = staff.filter((s) => s.childComfortAwareness).length;
  const childComfortAwarenessRate = pct(childComfortAwareness, total);

  // Weighted scoring: drivingAssessment=6, childTransportSafety=5, firstAidTraining=5,
  // riskAssessment=4, breakdownProcedure=3, childComfortAwareness=2 (total max = 25)
  const s1 = Math.round((drivingAssessmentRate / 100) * 6);
  const s2 = Math.round((childTransportSafetyRate / 100) * 5);
  const s3 = Math.round((firstAidTrainingRate / 100) * 5);
  const s4 = Math.round((riskAssessmentRate / 100) * 4);
  const s5 = Math.round((breakdownProcedureRate / 100) * 3);
  const s6 = Math.round((childComfortAwarenessRate / 100) * 2);

  const staffTravelReadinessScore = clamp(s1 + s2 + s3 + s4 + s5 + s6, 0, 25);

  return {
    totalStaff: total,
    drivingAssessmentRate,
    childTransportSafetyRate,
    firstAidTrainingRate,
    riskAssessmentRate,
    breakdownProcedureRate,
    childComfortAwarenessRate,
    staffTravelReadinessScore,
  };
}

// ── 5. Build Child Travel Profiles ─────────────────────────────────────────

export function buildChildTravelProfiles(
  records: TravelRecord[],
): ChildTravelProfile[] {
  // Group by childId
  const childMap = new Map<string, TravelRecord[]>();
  for (const r of records) {
    const existing = childMap.get(r.childId) ?? [];
    existing.push(r);
    childMap.set(r.childId, existing);
  }

  const profiles: ChildTravelProfile[] = [];

  for (const [childId, childRecords] of childMap) {
    const total = childRecords.length;
    const childName = childRecords[0].childName;

    const travelTypes = Array.from(new Set(childRecords.map((r) => r.travelType)));

    const onTime = childRecords.filter((r) => r.journeyOnTime).length;
    const onTimeRate = pct(onTime, total);

    const riskAssessed = childRecords.filter((r) => r.riskAssessmentCompleted).length;
    const riskAssessmentRate = pct(riskAssessed, total);

    const seatbelt = childRecords.filter((r) => r.seatbeltUsed).length;
    const seatbeltRate = pct(seatbelt, total);

    const comfortable = childRecords.filter((r) => r.childComfortable).length;
    const comfortRate = pct(comfortable, total);

    // Score 0-10: on-time (0-3), risk assessment (0-3), seatbelt (0-2), comfort (0-2)
    let travelScore = 0;
    travelScore += Math.round((onTimeRate / 100) * 3);
    travelScore += Math.round((riskAssessmentRate / 100) * 3);
    travelScore += Math.round((seatbeltRate / 100) * 2);
    travelScore += Math.round((comfortRate / 100) * 2);
    travelScore = clamp(travelScore, 0, 10);

    profiles.push({
      childId,
      childName,
      totalJourneys: total,
      travelTypes,
      onTimeRate,
      riskAssessmentRate,
      seatbeltRate,
      comfortRate,
      travelScore,
    });
  }

  return profiles;
}

// ── 6. Generate Full Intelligence ──────────────────────────────────────────

export function generateTransportTravelArrangementsIntelligence(
  records: TravelRecord[],
  vehicleChecks: VehicleCheck[],
  policies: TravelPolicy[],
  staffTraining: StaffTravelTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): TransportTravelArrangementsIntelligence {
  const journeyEval = evaluateJourneyQuality(records);
  const vehicleEval = evaluateVehicleSafety(vehicleChecks);
  const policyEval = evaluateTravelPolicy(policies);
  const staffEval = evaluateStaffTravelReadiness(staffTraining);
  const childProfiles = buildChildTravelProfiles(records);

  // ── Overall Score (100 points) ──────────────────────────────────────────
  const overallScore = clamp(
    journeyEval.journeyQualityScore +
      vehicleEval.vehicleSafetyScore +
      policyEval.travelPolicyScore +
      staffEval.staffTravelReadinessScore,
    0,
    100,
  );

  const rating = getRating(overallScore);

  // ── Strengths ──────────────────────────────────────────────────────────
  const strengths: string[] = [];

  if (journeyEval.onTimeRate === 100 && journeyEval.totalJourneys > 0)
    strengths.push("All journeys completed on time — excellent punctuality supporting children's routines");
  if (journeyEval.riskAssessmentRate === 100 && journeyEval.totalJourneys > 0)
    strengths.push("Risk assessments completed for every journey — strong safeguarding practice");
  if (journeyEval.seatbeltRate === 100 && journeyEval.totalJourneys > 0)
    strengths.push("Seatbelt use confirmed on all journeys — excellent safety compliance");
  if (journeyEval.childComfortableRate === 100 && journeyEval.totalJourneys > 0)
    strengths.push("All children reported as comfortable during travel — child-centred approach");
  if (vehicleEval.motCurrentRate === 100 && vehicleEval.totalChecks > 0)
    strengths.push("All vehicles have current MOT certificates — legal compliance maintained");
  if (vehicleEval.insuranceCurrentRate === 100 && vehicleEval.totalChecks > 0)
    strengths.push("All vehicle insurance is current and verified");
  if (vehicleEval.roadworthyRate === 100 && vehicleEval.totalChecks > 0)
    strengths.push("All vehicles confirmed roadworthy — safe transport for children");
  if (policyEval.travelPolicyScore >= 22 && policyEval.totalPolicies > 0)
    strengths.push("Travel policies are comprehensive and well-documented");
  if (staffEval.drivingAssessmentRate === 100 && staffEval.totalStaff > 0)
    strengths.push("All staff have completed driving assessments — competent drivers");
  if (staffEval.childTransportSafetyRate === 100 && staffEval.totalStaff > 0)
    strengths.push("All staff trained in child transport safety — safeguarding embedded");
  if (staffEval.firstAidTrainingRate === 100 && staffEval.totalStaff > 0)
    strengths.push("All transport staff are first aid trained — prepared for emergencies");
  if (staffEval.staffTravelReadinessScore >= 22 && staffEval.totalStaff > 0)
    strengths.push("Staff travel readiness is at an excellent level across all competencies");

  // ── Areas for Improvement ──────────────────────────────────────────────
  const areasForImprovement: string[] = [];

  if (journeyEval.totalJourneys === 0)
    areasForImprovement.push("No travel records found — all journeys must be documented");
  if (journeyEval.onTimeRate < 100 && journeyEval.totalJourneys > 0)
    areasForImprovement.push("Not all journeys completed on time — punctuality affects children's schedules and wellbeing");
  if (journeyEval.riskAssessmentRate < 100 && journeyEval.totalJourneys > 0)
    areasForImprovement.push("Risk assessments not completed for all journeys — this is a safeguarding concern");
  if (journeyEval.seatbeltRate < 100 && journeyEval.totalJourneys > 0)
    areasForImprovement.push("Seatbelt use not confirmed on all journeys — safety compliance must improve");
  if (journeyEval.childComfortableRate < 100 && journeyEval.totalJourneys > 0)
    areasForImprovement.push("Not all children reported as comfortable during travel — review transport arrangements");
  if (vehicleEval.totalChecks === 0)
    areasForImprovement.push("No vehicle checks recorded — regular vehicle inspections are required");
  if (vehicleEval.motCurrentRate < 100 && vehicleEval.totalChecks > 0)
    areasForImprovement.push("Not all vehicles have current MOT — legal compliance issue");
  if (vehicleEval.insuranceCurrentRate < 100 && vehicleEval.totalChecks > 0)
    areasForImprovement.push("Not all vehicles have current insurance — must be resolved immediately");
  if (vehicleEval.roadworthyRate < 100 && vehicleEval.totalChecks > 0)
    areasForImprovement.push("Not all vehicles confirmed roadworthy — unsafe vehicles must not transport children");
  if (policyEval.totalPolicies === 0)
    areasForImprovement.push("No travel policies on record — comprehensive transport policy required");
  if (policyEval.childConsentRate < 100 && policyEval.totalPolicies > 0)
    areasForImprovement.push("Child consent not obtained for all travel arrangements — children's views must be sought");
  if (policyEval.riskAssessmentProtocolRate < 100 && policyEval.totalPolicies > 0)
    areasForImprovement.push("Risk assessment protocol not fully implemented across all policies");
  if (staffEval.totalStaff === 0)
    areasForImprovement.push("No staff travel training records — all transport staff must have documented training");
  if (staffEval.drivingAssessmentRate < 100 && staffEval.totalStaff > 0)
    areasForImprovement.push("Not all staff have completed driving assessments — untrained staff must not drive children");
  if (staffEval.childTransportSafetyRate < 100 && staffEval.totalStaff > 0)
    areasForImprovement.push("Not all staff trained in child transport safety");
  if (staffEval.firstAidTrainingRate < 100 && staffEval.totalStaff > 0)
    areasForImprovement.push("Not all transport staff are first aid trained");

  // ── Actions ────────────────────────────────────────────────────────────
  const actions: string[] = [];

  if (journeyEval.riskAssessmentRate < 100 && journeyEval.totalJourneys > 0)
    actions.push("Ensure risk assessments are completed before every journey without exception");
  if (journeyEval.seatbeltRate < 100 && journeyEval.totalJourneys > 0)
    actions.push("Implement mandatory seatbelt checks for all journeys and record compliance");
  if (journeyEval.onTimeRate < 80 && journeyEval.totalJourneys > 0)
    actions.push("Review journey planning and scheduling to improve punctuality");
  if (journeyEval.childComfortableRate < 100 && journeyEval.totalJourneys > 0)
    actions.push("Consult with children about their travel comfort and make adjustments");
  if (vehicleEval.motCurrentRate < 100 && vehicleEval.totalChecks > 0)
    actions.push("Arrange MOT tests for vehicles with expired certificates immediately");
  if (vehicleEval.insuranceCurrentRate < 100 && vehicleEval.totalChecks > 0)
    actions.push("Renew expired vehicle insurance — uninsured vehicles must not be used");
  if (vehicleEval.roadworthyRate < 100 && vehicleEval.totalChecks > 0)
    actions.push("Remove non-roadworthy vehicles from service and arrange repairs");
  if (policyEval.totalPolicies === 0)
    actions.push("Develop and implement a comprehensive transport and travel policy");
  if (policyEval.childConsentRate < 100 && policyEval.totalPolicies > 0)
    actions.push("Obtain child consent for all travel arrangements as part of care planning");
  if (staffEval.drivingAssessmentRate < 100 && staffEval.totalStaff > 0)
    actions.push("Schedule driving assessments for all staff who transport children");
  if (staffEval.childTransportSafetyRate < 100 && staffEval.totalStaff > 0)
    actions.push("Arrange child transport safety training for untrained staff");
  if (staffEval.firstAidTrainingRate < 100 && staffEval.totalStaff > 0)
    actions.push("Arrange first aid training for transport staff who have not completed it");
  if (vehicleEval.totalChecks === 0)
    actions.push("Establish a vehicle inspection schedule and record all checks");
  if (staffEval.totalStaff === 0)
    actions.push("Create training records for all staff involved in transporting children");
  if (journeyEval.totalJourneys === 0)
    actions.push("Implement a journey logging system for all transport activities");

  // ── Regulatory Links ──────────────────────────────────────────────────
  const regulatoryLinks: string[] = [
    "CHR 2015, Reg 10 — The health and education standard: transport must support children's access to health services and education placements",
    "CHR 2015, Reg 13 — Leadership and management: the registered person must ensure safe and effective transport arrangements",
    "SCCIF — Social Care Common Inspection Framework: Ofsted evaluates transport arrangements as part of overall quality of care",
    "NMS 3 — National Minimum Standards: safeguarding children includes safe transport and travel planning",
    "Road Traffic Act 1988 — All drivers must hold valid licences and vehicles must be roadworthy and insured",
    "Health and Safety at Work Act 1974 — General duty of care extends to all transport of children in care",
    "Children Act 1989 — The welfare of the child is paramount, including during travel and transport",
  ];

  return {
    homeId,
    assessedAt: new Date().toISOString(),
    periodStart,
    periodEnd,
    overallScore,
    rating,
    journeyQuality: journeyEval,
    vehicleSafety: vehicleEval,
    travelPolicy: policyEval,
    staffTravelReadiness: staffEval,
    childTravelProfiles: childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
