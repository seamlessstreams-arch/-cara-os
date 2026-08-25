// ══════════════════════════════════════════════════════════════════════════════
// TRANSPORT SAFETY COMPLIANCE INTELLIGENCE ENGINE
//
// Pure deterministic engine for evaluating transport safety compliance in
// children's residential care homes, covering vehicle safety, journey
// compliance, driver competence, and incident response.
//
// Regulatory basis:
//   - CHR 2015, Reg 19 — Transport arrangements for looked-after children
//   - CHR 2015, Reg 12 — Health and safety (general duty for safe transport)
//   - SCCIF — Social Care Common Inspection Framework (Ofsted)
//   - NMS 7 — National Minimum Standards: leisure activities and transport
//   - Road Traffic Act 1988 — Driver licensing, vehicle roadworthiness
//   - Health and Safety at Work Act 1974 — General duty of care
//   - UNCRC Article 3 — Best interests of the child
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

import { withinPeriod } from "@/lib/date-period";
import { above, below, rate } from "@/lib/metrics/rate";

// ── Types ──────────────────────────────────────────────────────────────────

export type VehicleType =
  | "home_vehicle"
  | "staff_vehicle"
  | "taxi"
  | "public_transport"
  | "minibus"
  | "school_transport";

export type JourneyPurpose =
  | "school_run"
  | "medical_appointment"
  | "family_contact"
  | "activity"
  | "court_hearing"
  | "social_worker_visit"
  | "emergency"
  | "general";

export type RiskLevel = "low" | "medium" | "high" | "very_high";

export type VehicleCheckStatus = "passed" | "minor_issues" | "failed" | "overdue";

export type DriverStatus =
  | "fully_qualified"
  | "provisional"
  | "expired"
  | "not_checked";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface VehicleRecord {
  id: string;
  vehicleType: VehicleType;
  registration: string;
  lastServiceDate: string;
  nextServiceDue: string;
  motExpiryDate: string;
  insuranceExpiryDate: string;
  lastCheckDate: string;
  checkStatus: VehicleCheckStatus;
  seatingCapacity: number;
}

export interface JourneyRecord {
  id: string;
  date: string;
  vehicleId: string;
  driverId: string;
  driverName: string;
  childIds: string[];
  journeyPurpose: JourneyPurpose;
  riskAssessmentCompleted: boolean;
  seatbeltChecked: boolean;
  journeyLogCompleted: boolean;
  incidentOccurred: boolean;
  duration: number;
}

export interface DriverRecord {
  id: string;
  staffId: string;
  staffName: string;
  licenceValid: boolean;
  dbsChecked: boolean;
  driverTrainingCompleted: boolean;
  firstAidTrained: boolean;
  licenceExpiryDate: string;
  lastAssessmentDate: string;
}

export interface TransportIncident {
  id: string;
  journeyId: string;
  date: string;
  description: string;
  severity: "minor" | "moderate" | "serious";
  childrenInvolved: string[];
  reportedTimely: boolean;
  investigationCompleted: boolean;
  preventiveMeasures: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface VehicleSafetyEvaluation {
  totalVehicles: number;
  /** null when the population is empty — nothing measured, not 0%. */
  checkPassedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  serviceCurrentRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  motValidRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  insuranceValidRate: number | null;
  failedCount: number;
  overdueCount: number;
  vehicleSafetyScore: number;
}

export interface JourneyComplianceEvaluation {
  totalJourneys: number;
  /** null when the population is empty — nothing measured, not 0%. */
  riskAssessmentRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  seatbeltCheckRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  journeyLogRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  incidentRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  completionRate: number | null;
  journeysByPurpose: Record<string, number>;
  journeyComplianceScore: number;
}

export interface DriverCompetenceEvaluation {
  totalDrivers: number;
  /** null when the population is empty — nothing measured, not 0%. */
  licenceValidRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  dbsCheckedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  trainingCompletedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  firstAidRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  assessmentCurrentRate: number | null;
  driverCompetenceScore: number;
}

export interface IncidentResponseEvaluation {
  totalIncidents: number;
  /** null when the population is empty — nothing measured, not 0%. */
  reportedTimelyRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  investigationCompletedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  preventiveMeasuresRate: number | null;
  seriousIncidentCount: number;
  bySeverity: Record<string, number>;
  incidentResponseScore: number;
}

export interface ChildTransportProfile {
  childId: string;
  totalJourneys: number;
  journeyPurposes: string[];
  incidentsInvolved: number;
  riskAssessmentsCompleted: number;
  seatbeltChecks: number;
  safetyScore: number;
}

export interface TransportSafetyComplianceIntelligence {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  vehicleSafety: VehicleSafetyEvaluation;
  journeyCompliance: JourneyComplianceEvaluation;
  driverCompetence: DriverCompetenceEvaluation;
  incidentResponse: IncidentResponseEvaluation;
  childTransportProfiles: ChildTransportProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ── 1. Evaluate Vehicle Safety (25 points) ─────────────────────────────────

export function evaluateVehicleSafety(
  vehicles: VehicleRecord[],
  referenceDate: string,
): VehicleSafetyEvaluation {
  if (vehicles.length === 0) {
    return {
      totalVehicles: 0,
      checkPassedRate: null,
      serviceCurrentRate: null,
      motValidRate: null,
      insuranceValidRate: null,
      failedCount: 0,
      overdueCount: 0,
      vehicleSafetyScore: 0,
    };
  }

  const total = vehicles.length;

  // Check passed rate
  const passed = vehicles.filter((v) => v.checkStatus === "passed").length;
  const checkPassedRate = rate(passed, total);

  // Service current: nextServiceDue is on or after referenceDate
  const serviceCurrent = vehicles.filter((v) => v.nextServiceDue >= referenceDate).length;
  const serviceCurrentRate = rate(serviceCurrent, total);

  // MOT valid: motExpiryDate is on or after referenceDate
  const motValid = vehicles.filter((v) => v.motExpiryDate >= referenceDate).length;
  const motValidRate = rate(motValid, total);

  // Insurance valid: insuranceExpiryDate is on or after referenceDate
  const insuranceValid = vehicles.filter((v) => v.insuranceExpiryDate >= referenceDate).length;
  const insuranceValidRate = rate(insuranceValid, total);

  // Failed and overdue counts
  const failedCount = vehicles.filter((v) => v.checkStatus === "failed").length;
  const overdueCount = vehicles.filter((v) => v.checkStatus === "overdue").length;

  // Scoring: 25 points
  // Check passed rate: 0-7 points
  const checkScore = Math.round(((checkPassedRate ?? 0) / 100) * 7);

  // Service current: 0-6 points
  const serviceScore = Math.round(((serviceCurrentRate ?? 0) / 100) * 6);

  // MOT valid: 0-5 points
  const motScore = Math.round(((motValidRate ?? 0) / 100) * 5);

  // Insurance valid: 0-4 points
  const insuranceScore = Math.round(((insuranceValidRate ?? 0) / 100) * 4);

  // No failed vehicles bonus: 0-3 points
  const noFailedBonus = failedCount === 0 ? 3 : 0;

  const vehicleSafetyScore = clamp(
    checkScore + serviceScore + motScore + insuranceScore + noFailedBonus,
    0,
    25,
  );

  return {
    totalVehicles: total,
    checkPassedRate,
    serviceCurrentRate,
    motValidRate,
    insuranceValidRate,
    failedCount,
    overdueCount,
    vehicleSafetyScore,
  };
}

// ── 2. Evaluate Journey Compliance (25 points) ─────────────────────────────

export function evaluateJourneyCompliance(
  journeys: JourneyRecord[],
  periodStart: string,
  periodEnd: string,
): JourneyComplianceEvaluation {
  if (journeys.length === 0) {
    return {
      totalJourneys: 0,
      riskAssessmentRate: null,
      seatbeltCheckRate: null,
      journeyLogRate: null,
      incidentRate: null,
      completionRate: null,
      journeysByPurpose: {},
      journeyComplianceScore: 0,
    };
  }

  // Filter to period
  const periodJourneys = journeys.filter(
    (j) => withinPeriod(j.date, periodStart, periodEnd),
  );
  const total = periodJourneys.length;

  if (total === 0) {
    return {
      totalJourneys: 0,
      riskAssessmentRate: null,
      seatbeltCheckRate: null,
      journeyLogRate: null,
      incidentRate: null,
      completionRate: null,
      journeysByPurpose: {},
      journeyComplianceScore: 0,
    };
  }

  // Journeys by purpose
  const journeysByPurpose: Record<string, number> = {};
  for (const j of periodJourneys) {
    journeysByPurpose[j.journeyPurpose] = (journeysByPurpose[j.journeyPurpose] ?? 0) + 1;
  }

  // Rates
  const riskAssessed = periodJourneys.filter((j) => j.riskAssessmentCompleted).length;
  const riskAssessmentRate = rate(riskAssessed, total);

  const seatbeltChecked = periodJourneys.filter((j) => j.seatbeltChecked).length;
  const seatbeltCheckRate = rate(seatbeltChecked, total);

  const journeyLogged = periodJourneys.filter((j) => j.journeyLogCompleted).length;
  const journeyLogRate = rate(journeyLogged, total);

  const incidents = periodJourneys.filter((j) => j.incidentOccurred).length;
  const incidentRate = rate(incidents, total);

  // Completion rate: all three checks done (risk assessment + seatbelt + journey log)
  const fullyCompliant = periodJourneys.filter(
    (j) => j.riskAssessmentCompleted && j.seatbeltChecked && j.journeyLogCompleted,
  ).length;
  const completionRate = rate(fullyCompliant, total);

  // Scoring: 25 points
  // Risk assessment rate: 0-7 points
  const riskScore = Math.round(((riskAssessmentRate ?? 0) / 100) * 7);

  // Seatbelt checked: 0-6 points
  const seatbeltScore = Math.round(((seatbeltCheckRate ?? 0) / 100) * 6);

  // Journey log: 0-5 points
  const logScore = Math.round(((journeyLogRate ?? 0) / 100) * 5);

  // Low incident rate bonus: 0-4 points (0% incidents = 4, <10% = 2, else 0)
  // unmeasured (no journeys) earns no incident bonus
  const incidentBonus =
    incidentRate === null ? 0
      : incidentRate === 0 ? 4
        : incidentRate <= 10 ? 2
          : 0;

  // Completion rate: 0-3 points
  const completionScore = Math.round(((completionRate ?? 0) / 100) * 3);

  const journeyComplianceScore = clamp(
    riskScore + seatbeltScore + logScore + incidentBonus + completionScore,
    0,
    25,
  );

  return {
    totalJourneys: total,
    riskAssessmentRate,
    seatbeltCheckRate,
    journeyLogRate,
    incidentRate,
    completionRate,
    journeysByPurpose,
    journeyComplianceScore,
  };
}

// ── 3. Evaluate Driver Competence (25 points) ──────────────────────────────

export function evaluateDriverCompetence(
  drivers: DriverRecord[],
  referenceDate: string,
): DriverCompetenceEvaluation {
  if (drivers.length === 0) {
    return {
      totalDrivers: 0,
      licenceValidRate: null,
      dbsCheckedRate: null,
      trainingCompletedRate: null,
      firstAidRate: null,
      assessmentCurrentRate: null,
      driverCompetenceScore: 0,
    };
  }

  const total = drivers.length;

  // Licence valid
  const licenceValid = drivers.filter((d) => d.licenceValid && d.licenceExpiryDate >= referenceDate).length;
  const licenceValidRate = rate(licenceValid, total);

  // DBS checked
  const dbsChecked = drivers.filter((d) => d.dbsChecked).length;
  const dbsCheckedRate = rate(dbsChecked, total);

  // Training completed
  const trainingCompleted = drivers.filter((d) => d.driverTrainingCompleted).length;
  const trainingCompletedRate = rate(trainingCompleted, total);

  // First aid trained
  const firstAidTrained = drivers.filter((d) => d.firstAidTrained).length;
  const firstAidRate = rate(firstAidTrained, total);

  // Assessment current: lastAssessmentDate within 12 months of referenceDate
  const assessmentThresholdMs = 365 * 24 * 60 * 60 * 1000;
  const refTime = new Date(referenceDate).getTime();
  const assessmentCurrent = drivers.filter((d) => {
    const assessTime = new Date(d.lastAssessmentDate).getTime();
    return refTime - assessTime <= assessmentThresholdMs;
  }).length;
  const assessmentCurrentRate = rate(assessmentCurrent, total);

  // Scoring: 25 points
  // Licence valid: 0-7 points
  const licenceScore = Math.round(((licenceValidRate ?? 0) / 100) * 7);

  // DBS checked: 0-6 points
  const dbsScore = Math.round(((dbsCheckedRate ?? 0) / 100) * 6);

  // Training completed: 0-5 points
  const trainingScore = Math.round(((trainingCompletedRate ?? 0) / 100) * 5);

  // First aid: 0-4 points
  const firstAidScore = Math.round(((firstAidRate ?? 0) / 100) * 4);

  // Assessment current: 0-3 points
  const assessmentScore = Math.round(((assessmentCurrentRate ?? 0) / 100) * 3);

  const driverCompetenceScore = clamp(
    licenceScore + dbsScore + trainingScore + firstAidScore + assessmentScore,
    0,
    25,
  );

  return {
    totalDrivers: total,
    licenceValidRate,
    dbsCheckedRate,
    trainingCompletedRate,
    firstAidRate,
    assessmentCurrentRate,
    driverCompetenceScore,
  };
}

// ── 4. Evaluate Incident Response (25 points) ──────────────────────────────

export function evaluateIncidentResponse(
  incidents: TransportIncident[],
): IncidentResponseEvaluation {
  if (incidents.length === 0) {
    return {
      totalIncidents: 0,
      reportedTimelyRate: null,
      investigationCompletedRate: null,
      preventiveMeasuresRate: null,
      seriousIncidentCount: 0,
      bySeverity: {},
      incidentResponseScore: 25,
    };
  }

  const total = incidents.length;

  // By severity
  const bySeverity: Record<string, number> = {};
  for (const inc of incidents) {
    bySeverity[inc.severity] = (bySeverity[inc.severity] ?? 0) + 1;
  }

  // Rates
  const reportedTimely = incidents.filter((i) => i.reportedTimely).length;
  const reportedTimelyRate = rate(reportedTimely, total);

  const investigationCompleted = incidents.filter((i) => i.investigationCompleted).length;
  const investigationCompletedRate = rate(investigationCompleted, total);

  const preventiveMeasures = incidents.filter((i) => i.preventiveMeasures).length;
  const preventiveMeasuresRate = rate(preventiveMeasures, total);

  const seriousIncidentCount = incidents.filter((i) => i.severity === "serious").length;

  // Scoring: 25 points
  // Reported timely: 0-8 points
  const timelyScore = Math.round(((reportedTimelyRate ?? 0) / 100) * 8);

  // Investigation completed: 0-7 points
  const investigationScore = Math.round(((investigationCompletedRate ?? 0) / 100) * 7);

  // Preventive measures: 0-5 points
  const preventiveScore = Math.round(((preventiveMeasuresRate ?? 0) / 100) * 5);

  // No serious incidents bonus: 0-5 points
  const seriousBonus = seriousIncidentCount === 0 ? 5 : 0;

  const incidentResponseScore = clamp(
    timelyScore + investigationScore + preventiveScore + seriousBonus,
    0,
    25,
  );

  return {
    totalIncidents: total,
    reportedTimelyRate,
    investigationCompletedRate,
    preventiveMeasuresRate,
    seriousIncidentCount,
    bySeverity,
    incidentResponseScore,
  };
}

// ── 5. Build Child Transport Profiles ──────────────────────────────────────

export function buildChildTransportProfiles(
  childIds: string[],
  journeys: JourneyRecord[],
  incidents: TransportIncident[],
): ChildTransportProfile[] {
  return childIds.map((childId) => {
    const childJourneys = journeys.filter((j) => j.childIds.includes(childId));
    const totalJourneys = childJourneys.length;

    const journeyPurposes = Array.from(new Set(childJourneys.map((j) => j.journeyPurpose)));

    const incidentsInvolved = incidents.filter((i) =>
      i.childrenInvolved.includes(childId),
    ).length;

    const riskAssessmentsCompleted = childJourneys.filter(
      (j) => j.riskAssessmentCompleted,
    ).length;

    const seatbeltChecks = childJourneys.filter((j) => j.seatbeltChecked).length;

    // Safety score: 0-10
    // Based on: risk assessments done (0-3), seatbelt checks (0-3), no incidents bonus (0-2), journey logs (0-2)
    let safetyScore = 0;
    if (totalJourneys > 0) {
      const raRate = rate(riskAssessmentsCompleted, totalJourneys);
      const sbRate = rate(seatbeltChecks, totalJourneys);
      const logCompleted = childJourneys.filter((j) => j.journeyLogCompleted).length;
      const logRate = rate(logCompleted, totalJourneys);

      safetyScore += Math.round(((raRate ?? 0) / 100) * 3);
      safetyScore += Math.round(((sbRate ?? 0) / 100) * 3);
      safetyScore += incidentsInvolved === 0 ? 2 : 0;
      safetyScore += Math.round(((logRate ?? 0) / 100) * 2);
    }

    safetyScore = clamp(safetyScore, 0, 10);

    return {
      childId,
      totalJourneys,
      journeyPurposes,
      incidentsInvolved,
      riskAssessmentsCompleted,
      seatbeltChecks,
      safetyScore,
    };
  });
}

// ── 6. Generate Full Intelligence ──────────────────────────────────────────

export function generateTransportSafetyComplianceIntelligence(
  vehicles: VehicleRecord[],
  journeys: JourneyRecord[],
  drivers: DriverRecord[],
  incidents: TransportIncident[],
  childIds: string[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
  referenceDate: string,
): TransportSafetyComplianceIntelligence {
  const vehicleEval = evaluateVehicleSafety(vehicles, referenceDate);
  const journeyEval = evaluateJourneyCompliance(journeys, periodStart, periodEnd);
  const driverEval = evaluateDriverCompetence(drivers, referenceDate);
  const incidentEval = evaluateIncidentResponse(incidents);
  const childProfiles = buildChildTransportProfiles(childIds, journeys, incidents);

  // ── Scoring (100 points) ──────────────────────────────────────────────
  const overallScore = clamp(
    vehicleEval.vehicleSafetyScore +
      journeyEval.journeyComplianceScore +
      driverEval.driverCompetenceScore +
      incidentEval.incidentResponseScore,
    0,
    100,
  );

  const rating: Rating =
    overallScore >= 80
      ? "outstanding"
      : overallScore >= 60
        ? "good"
        : overallScore >= 40
          ? "requires_improvement"
          : "inadequate";

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];

  if (vehicleEval.checkPassedRate === 100 && vehicleEval.totalVehicles > 0)
    strengths.push("All vehicle checks passed — vehicles are maintained to a high standard");
  if (vehicleEval.serviceCurrentRate === 100 && vehicleEval.totalVehicles > 0)
    strengths.push("All vehicles are within their service schedule");
  if (vehicleEval.motValidRate === 100 && vehicleEval.totalVehicles > 0)
    strengths.push("All vehicles have valid MOT certificates");
  if (vehicleEval.insuranceValidRate === 100 && vehicleEval.totalVehicles > 0)
    strengths.push("All vehicle insurance is current and valid");
  if (vehicleEval.failedCount === 0 && vehicleEval.totalVehicles > 0)
    strengths.push("No vehicles have failed their safety checks");
  if (journeyEval.riskAssessmentRate === 100 && journeyEval.totalJourneys > 0)
    strengths.push("Risk assessments completed for all journeys — strong safeguarding practice");
  if (journeyEval.seatbeltCheckRate === 100 && journeyEval.totalJourneys > 0)
    strengths.push("Seatbelt checks completed on every journey — excellent safety compliance");
  if (journeyEval.journeyLogRate === 100 && journeyEval.totalJourneys > 0)
    strengths.push("Journey logs completed for all trips — good record-keeping practice");
  if (journeyEval.incidentRate === 0 && journeyEval.totalJourneys > 0)
    strengths.push("No transport incidents during the review period");
  if (journeyEval.completionRate === 100 && journeyEval.totalJourneys > 0)
    strengths.push("Full compliance achieved on all journey documentation requirements");
  if (driverEval.licenceValidRate === 100 && driverEval.totalDrivers > 0)
    strengths.push("All drivers hold valid driving licences");
  if (driverEval.dbsCheckedRate === 100 && driverEval.totalDrivers > 0)
    strengths.push("DBS checks completed for all drivers");
  if (driverEval.trainingCompletedRate === 100 && driverEval.totalDrivers > 0)
    strengths.push("All drivers have completed transport safety training");
  if (driverEval.firstAidRate === 100 && driverEval.totalDrivers > 0)
    strengths.push("All drivers are first aid trained — supporting child safety during transport");
  if (driverEval.assessmentCurrentRate === 100 && driverEval.totalDrivers > 0)
    strengths.push("All driver assessments are current and within review period");
  if (incidentEval.totalIncidents === 0)
    strengths.push("No transport incidents recorded — reflecting effective safety practices");
  if (incidentEval.totalIncidents > 0 && incidentEval.reportedTimelyRate === 100)
    strengths.push("All transport incidents were reported in a timely manner");
  if (incidentEval.totalIncidents > 0 && incidentEval.investigationCompletedRate === 100)
    strengths.push("All transport incidents have been fully investigated");
  if (incidentEval.totalIncidents > 0 && incidentEval.preventiveMeasuresRate === 100)
    strengths.push("Preventive measures implemented for all incidents — good learning culture");

  // ── Areas for Improvement ─────────────────────────────────────────────
  const areasForImprovement: string[] = [];

  if (vehicleEval.totalVehicles === 0)
    areasForImprovement.push("No vehicle records on file — transport arrangements must be documented");
  if (vehicleEval.failedCount > 0)
    areasForImprovement.push(`${vehicleEval.failedCount} vehicle(s) have failed safety checks — immediate action required`);
  if (vehicleEval.overdueCount > 0)
    areasForImprovement.push(`${vehicleEval.overdueCount} vehicle check(s) are overdue`);
  if (below(vehicleEval.serviceCurrentRate, 100) && vehicleEval.totalVehicles > 0)
    areasForImprovement.push("Not all vehicles are within their service schedule");
  if (below(vehicleEval.motValidRate, 100) && vehicleEval.totalVehicles > 0)
    areasForImprovement.push("Not all vehicles have valid MOT certificates — potential legal compliance issue");
  if (below(vehicleEval.insuranceValidRate, 100) && vehicleEval.totalVehicles > 0)
    areasForImprovement.push("Not all vehicles have current insurance — this must be resolved immediately");
  if (journeyEval.totalJourneys === 0)
    areasForImprovement.push("No journey records found — transport activities must be logged");
  if (below(journeyEval.riskAssessmentRate, 100) && journeyEval.totalJourneys > 0)
    areasForImprovement.push("Risk assessments not completed for all journeys — this is a safeguarding concern");
  if (below(journeyEval.seatbeltCheckRate, 100) && journeyEval.totalJourneys > 0)
    areasForImprovement.push("Seatbelt checks not recorded for all journeys");
  if (below(journeyEval.journeyLogRate, 100) && journeyEval.totalJourneys > 0)
    areasForImprovement.push("Journey logs not completed for all trips — record-keeping must improve");
  if (above(journeyEval.incidentRate, 10) && journeyEval.totalJourneys > 0)
    areasForImprovement.push("Transport incident rate is above acceptable threshold — review safety procedures");
  if (driverEval.totalDrivers === 0)
    areasForImprovement.push("No driver records on file — all staff who drive must have documented records");
  if (below(driverEval.licenceValidRate, 100) && driverEval.totalDrivers > 0)
    areasForImprovement.push("Not all drivers have valid licences — drivers without valid licences must not transport children");
  if (below(driverEval.dbsCheckedRate, 100) && driverEval.totalDrivers > 0)
    areasForImprovement.push("DBS checks not completed for all drivers — this is a safeguarding requirement");
  if (below(driverEval.trainingCompletedRate, 100) && driverEval.totalDrivers > 0)
    areasForImprovement.push("Not all drivers have completed transport safety training");
  if (below(driverEval.firstAidRate, 100) && driverEval.totalDrivers > 0)
    areasForImprovement.push("Not all drivers are first aid trained");
  if (below(driverEval.assessmentCurrentRate, 100) && driverEval.totalDrivers > 0)
    areasForImprovement.push("Not all driver assessments are current — reviews must be conducted annually");
  if (incidentEval.totalIncidents > 0 && below(incidentEval.reportedTimelyRate, 100))
    areasForImprovement.push("Not all transport incidents were reported in a timely manner");
  if (incidentEval.totalIncidents > 0 && below(incidentEval.investigationCompletedRate, 100))
    areasForImprovement.push("Not all transport incidents have been fully investigated");
  if (incidentEval.totalIncidents > 0 && below(incidentEval.preventiveMeasuresRate, 100))
    areasForImprovement.push("Preventive measures not implemented for all transport incidents");
  if (incidentEval.seriousIncidentCount > 0)
    areasForImprovement.push(`${incidentEval.seriousIncidentCount} serious transport incident(s) recorded — urgent review required`);

  // ── Actions ───────────────────────────────────────────────────────────
  const actions: string[] = [];

  if (vehicleEval.failedCount > 0)
    actions.push("Remove failed vehicles from service and arrange immediate repair or replacement");
  if (vehicleEval.overdueCount > 0)
    actions.push("Complete overdue vehicle safety checks immediately");
  if (below(vehicleEval.serviceCurrentRate, 100) && vehicleEval.totalVehicles > 0)
    actions.push("Schedule overdue vehicle services without delay");
  if (below(vehicleEval.motValidRate, 100) && vehicleEval.totalVehicles > 0)
    actions.push("Arrange MOT tests for vehicles with expired certificates");
  if (below(vehicleEval.insuranceValidRate, 100) && vehicleEval.totalVehicles > 0)
    actions.push("Renew expired vehicle insurance immediately — vehicles without insurance must not be used");
  if (below(journeyEval.riskAssessmentRate, 100) && journeyEval.totalJourneys > 0)
    actions.push("Ensure risk assessments are completed before every journey");
  if (below(journeyEval.seatbeltCheckRate, 100) && journeyEval.totalJourneys > 0)
    actions.push("Implement mandatory seatbelt checks for all journeys");
  if (below(journeyEval.journeyLogRate, 100) && journeyEval.totalJourneys > 0)
    actions.push("Ensure journey logs are completed for every trip");
  if (below(driverEval.licenceValidRate, 100) && driverEval.totalDrivers > 0)
    actions.push("Verify and renew expired driving licences for all staff drivers");
  if (below(driverEval.dbsCheckedRate, 100) && driverEval.totalDrivers > 0)
    actions.push("Complete DBS checks for all drivers without delay");
  if (below(driverEval.trainingCompletedRate, 100) && driverEval.totalDrivers > 0)
    actions.push("Arrange transport safety training for untrained drivers");
  if (below(driverEval.firstAidRate, 100) && driverEval.totalDrivers > 0)
    actions.push("Arrange first aid training for drivers who have not completed it");
  if (below(driverEval.assessmentCurrentRate, 100) && driverEval.totalDrivers > 0)
    actions.push("Schedule driver assessments for staff whose reviews are overdue");
  if (incidentEval.totalIncidents > 0 && below(incidentEval.investigationCompletedRate, 100))
    actions.push("Complete outstanding transport incident investigations");
  if (incidentEval.totalIncidents > 0 && below(incidentEval.preventiveMeasuresRate, 100))
    actions.push("Implement preventive measures for all transport incidents");
  if (incidentEval.seriousIncidentCount > 0)
    actions.push("Conduct urgent review of serious transport incidents and report to relevant authorities");
  if (vehicleEval.totalVehicles === 0)
    actions.push("Establish vehicle records for all transport used by the home");
  if (driverEval.totalDrivers === 0)
    actions.push("Create driver records for all staff who transport children");

  // ── Regulatory Links ──────────────────────────────────────────────────
  const regulatoryLinks: string[] = [
    "CHR 2015, Reg 19 — Transport arrangements: children must be transported safely with appropriate risk assessment",
    "CHR 2015, Reg 12 — Health and safety: the registered person must ensure safe transport arrangements",
    "SCCIF — Social Care Common Inspection Framework: Ofsted evaluates transport safety as part of overall care quality",
    "NMS 7 — National Minimum Standards: transport must support children's access to activities and services",
    "Road Traffic Act 1988 — All drivers must hold valid licences and vehicles must be roadworthy and insured",
    "Health and Safety at Work Act 1974 — General duty of care extends to transport of children",
    "UNCRC Article 3 — Best interests of the child must be a primary consideration in all transport decisions",
  ];

  return {
    homeId,
    assessedAt: referenceDate,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    vehicleSafety: vehicleEval,
    journeyCompliance: journeyEval,
    driverCompetence: driverEval,
    incidentResponse: incidentEval,
    childTransportProfiles: childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
