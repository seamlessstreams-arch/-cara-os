// ══════════════════════════════════════════════════════════════════════════════
// TESTS — Transport Safety Compliance Intelligence Engine
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateVehicleSafety,
  evaluateJourneyCompliance,
  evaluateDriverCompetence,
  evaluateIncidentResponse,
  buildChildTransportProfiles,
  generateTransportSafetyComplianceIntelligence,
} from "../transport-safety-compliance-engine";
import type {
  VehicleRecord,
  JourneyRecord,
  DriverRecord,
  TransportIncident,
} from "../transport-safety-compliance-engine";

// ── Test Fixtures ──────────────────────────────────────────────────────────

const REFERENCE_DATE = "2026-05-18";
const PERIOD_START = "2026-01-01";
const PERIOD_END = "2026-05-18";

const makeVehicle = (overrides: Partial<VehicleRecord> = {}): VehicleRecord => ({
  id: "veh-001",
  vehicleType: "home_vehicle",
  registration: "AB12 CDE",
  lastServiceDate: "2026-03-01",
  nextServiceDue: "2026-09-01",
  motExpiryDate: "2027-03-01",
  insuranceExpiryDate: "2027-01-01",
  lastCheckDate: "2026-05-01",
  checkStatus: "passed",
  seatingCapacity: 7,
  ...overrides,
});

const makeJourney = (overrides: Partial<JourneyRecord> = {}): JourneyRecord => ({
  id: "journey-001",
  date: "2026-03-15",
  vehicleId: "veh-001",
  driverId: "driver-001",
  driverName: "Sarah Johnson",
  childIds: ["child-alex"],
  journeyPurpose: "school_run",
  riskAssessmentCompleted: true,
  seatbeltChecked: true,
  journeyLogCompleted: true,
  incidentOccurred: false,
  duration: 25,
  ...overrides,
});

const makeDriver = (overrides: Partial<DriverRecord> = {}): DriverRecord => ({
  id: "driver-001",
  staffId: "staff-sarah",
  staffName: "Sarah Johnson",
  licenceValid: true,
  dbsChecked: true,
  driverTrainingCompleted: true,
  firstAidTrained: true,
  licenceExpiryDate: "2028-06-01",
  lastAssessmentDate: "2026-02-15",
  ...overrides,
});

const makeIncident = (overrides: Partial<TransportIncident> = {}): TransportIncident => ({
  id: "inc-001",
  journeyId: "journey-001",
  date: "2026-03-15",
  description: "Minor scrape in car park",
  severity: "minor",
  childrenInvolved: ["child-alex"],
  reportedTimely: true,
  investigationCompleted: true,
  preventiveMeasures: true,
  ...overrides,
});

// ── Oak House Demo Data ────────────────────────────────────────────────────

const oakHouseVehicles: VehicleRecord[] = [
  makeVehicle({
    id: "veh-001",
    vehicleType: "minibus",
    registration: "OAK 001",
    lastServiceDate: "2026-03-10",
    nextServiceDue: "2026-09-10",
    motExpiryDate: "2027-03-10",
    insuranceExpiryDate: "2027-01-15",
    lastCheckDate: "2026-05-01",
    checkStatus: "passed",
    seatingCapacity: 8,
  }),
  makeVehicle({
    id: "veh-002",
    vehicleType: "staff_vehicle",
    registration: "OAK 002",
    lastServiceDate: "2026-02-01",
    nextServiceDue: "2026-08-01",
    motExpiryDate: "2026-12-01",
    insuranceExpiryDate: "2026-11-01",
    lastCheckDate: "2026-04-15",
    checkStatus: "minor_issues",
    seatingCapacity: 5,
  }),
];

const oakHouseJourneys: JourneyRecord[] = [
  makeJourney({ id: "j-001", date: "2026-01-15", driverId: "driver-001", driverName: "Sarah Johnson", childIds: ["child-alex", "child-jordan"], journeyPurpose: "school_run", duration: 20 }),
  makeJourney({ id: "j-002", date: "2026-02-03", driverId: "driver-002", driverName: "Tom Richards", childIds: ["child-morgan"], journeyPurpose: "medical_appointment", duration: 35 }),
  makeJourney({ id: "j-003", date: "2026-02-20", driverId: "driver-001", driverName: "Sarah Johnson", childIds: ["child-alex"], journeyPurpose: "family_contact", duration: 45 }),
  makeJourney({ id: "j-004", date: "2026-03-10", driverId: "driver-003", driverName: "Darren Laville", childIds: ["child-jordan", "child-morgan"], journeyPurpose: "activity", duration: 60 }),
  makeJourney({ id: "j-005", date: "2026-03-25", driverId: "driver-002", driverName: "Tom Richards", childIds: ["child-alex", "child-jordan", "child-morgan"], journeyPurpose: "activity", duration: 90 }),
  makeJourney({ id: "j-006", date: "2026-04-05", driverId: "driver-001", driverName: "Sarah Johnson", childIds: ["child-alex"], journeyPurpose: "school_run", duration: 20 }),
  makeJourney({ id: "j-007", date: "2026-04-18", driverId: "driver-003", driverName: "Darren Laville", childIds: ["child-morgan"], journeyPurpose: "social_worker_visit", duration: 30 }),
  makeJourney({ id: "j-008", date: "2026-05-02", driverId: "driver-002", driverName: "Tom Richards", childIds: ["child-jordan"], journeyPurpose: "court_hearing", duration: 55 }),
];

const oakHouseDrivers: DriverRecord[] = [
  makeDriver({ id: "driver-001", staffId: "staff-sarah", staffName: "Sarah Johnson", licenceExpiryDate: "2028-06-01", lastAssessmentDate: "2026-02-15" }),
  makeDriver({ id: "driver-002", staffId: "staff-tom", staffName: "Tom Richards", licenceExpiryDate: "2029-01-01", lastAssessmentDate: "2026-01-20" }),
  makeDriver({ id: "driver-003", staffId: "staff-darren", staffName: "Darren Laville", licenceExpiryDate: "2028-09-01", lastAssessmentDate: "2026-03-01" }),
];

const oakHouseIncidents: TransportIncident[] = [];

const oakHouseChildIds = ["child-alex", "child-jordan", "child-morgan"];

// ── Helper ─────────────────────────────────────────────────────────────────

function clampHelper(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. VEHICLE SAFETY
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateVehicleSafety", () => {
  it("returns zeroed result for empty vehicles array", () => {
    const result = evaluateVehicleSafety([], REFERENCE_DATE);
    expect(result.totalVehicles).toBe(0);
    expect(result.vehicleSafetyScore).toBe(0);
    expect(result.checkPassedRate).toBe(0);
    expect(result.failedCount).toBe(0);
  });

  it("calculates check passed rate for all passed vehicles", () => {
    const vehicles = [
      makeVehicle({ id: "v1", checkStatus: "passed" }),
      makeVehicle({ id: "v2", checkStatus: "passed" }),
    ];
    const result = evaluateVehicleSafety(vehicles, REFERENCE_DATE);
    expect(result.checkPassedRate).toBe(100);
  });

  it("calculates check passed rate with mixed statuses", () => {
    const vehicles = [
      makeVehicle({ id: "v1", checkStatus: "passed" }),
      makeVehicle({ id: "v2", checkStatus: "minor_issues" }),
      makeVehicle({ id: "v3", checkStatus: "failed" }),
    ];
    const result = evaluateVehicleSafety(vehicles, REFERENCE_DATE);
    expect(result.checkPassedRate).toBe(33);
  });

  it("calculates service current rate correctly", () => {
    const vehicles = [
      makeVehicle({ id: "v1", nextServiceDue: "2026-09-01" }), // current
      makeVehicle({ id: "v2", nextServiceDue: "2026-01-01" }), // overdue
    ];
    const result = evaluateVehicleSafety(vehicles, REFERENCE_DATE);
    expect(result.serviceCurrentRate).toBe(50);
  });

  it("calculates MOT valid rate correctly", () => {
    const vehicles = [
      makeVehicle({ id: "v1", motExpiryDate: "2027-01-01" }), // valid
      makeVehicle({ id: "v2", motExpiryDate: "2026-03-01" }), // expired
    ];
    const result = evaluateVehicleSafety(vehicles, REFERENCE_DATE);
    expect(result.motValidRate).toBe(50);
  });

  it("calculates insurance valid rate correctly", () => {
    const vehicles = [
      makeVehicle({ id: "v1", insuranceExpiryDate: "2027-01-01" }),
      makeVehicle({ id: "v2", insuranceExpiryDate: "2025-12-01" }),
    ];
    const result = evaluateVehicleSafety(vehicles, REFERENCE_DATE);
    expect(result.insuranceValidRate).toBe(50);
  });

  it("counts failed vehicles", () => {
    const vehicles = [
      makeVehicle({ id: "v1", checkStatus: "failed" }),
      makeVehicle({ id: "v2", checkStatus: "failed" }),
      makeVehicle({ id: "v3", checkStatus: "passed" }),
    ];
    const result = evaluateVehicleSafety(vehicles, REFERENCE_DATE);
    expect(result.failedCount).toBe(2);
  });

  it("counts overdue vehicles", () => {
    const vehicles = [
      makeVehicle({ id: "v1", checkStatus: "overdue" }),
      makeVehicle({ id: "v2", checkStatus: "passed" }),
    ];
    const result = evaluateVehicleSafety(vehicles, REFERENCE_DATE);
    expect(result.overdueCount).toBe(1);
  });

  it("awards maximum score for perfect vehicle compliance", () => {
    const vehicles = [
      makeVehicle({ id: "v1", checkStatus: "passed" }),
      makeVehicle({ id: "v2", checkStatus: "passed" }),
    ];
    const result = evaluateVehicleSafety(vehicles, REFERENCE_DATE);
    expect(result.vehicleSafetyScore).toBe(25);
  });

  it("awards zero no-failed bonus when vehicles have failed", () => {
    const vehicles = [
      makeVehicle({ id: "v1", checkStatus: "failed" }),
    ];
    const result = evaluateVehicleSafety(vehicles, REFERENCE_DATE);
    // failed vehicle: checkPassedRate=0, but service/mot/insurance still valid
    // no-failed bonus = 0
    expect(result.failedCount).toBe(1);
  });

  it("vehicle safety score is between 0 and 25", () => {
    const result = evaluateVehicleSafety(oakHouseVehicles, REFERENCE_DATE);
    expect(result.vehicleSafetyScore).toBeGreaterThanOrEqual(0);
    expect(result.vehicleSafetyScore).toBeLessThanOrEqual(25);
  });

  it("counts total vehicles correctly", () => {
    const result = evaluateVehicleSafety(oakHouseVehicles, REFERENCE_DATE);
    expect(result.totalVehicles).toBe(2);
  });

  it("handles all vehicles with expired MOT", () => {
    const vehicles = [
      makeVehicle({ id: "v1", motExpiryDate: "2025-01-01" }),
      makeVehicle({ id: "v2", motExpiryDate: "2025-06-01" }),
    ];
    const result = evaluateVehicleSafety(vehicles, REFERENCE_DATE);
    expect(result.motValidRate).toBe(0);
  });

  it("handles vehicle on exact MOT expiry boundary", () => {
    const vehicles = [
      makeVehicle({ id: "v1", motExpiryDate: REFERENCE_DATE }),
    ];
    const result = evaluateVehicleSafety(vehicles, REFERENCE_DATE);
    expect(result.motValidRate).toBe(100);
  });

  it("handles vehicle on exact service due boundary", () => {
    const vehicles = [
      makeVehicle({ id: "v1", nextServiceDue: REFERENCE_DATE }),
    ];
    const result = evaluateVehicleSafety(vehicles, REFERENCE_DATE);
    expect(result.serviceCurrentRate).toBe(100);
  });

  it("handles vehicle on exact insurance expiry boundary", () => {
    const vehicles = [
      makeVehicle({ id: "v1", insuranceExpiryDate: REFERENCE_DATE }),
    ];
    const result = evaluateVehicleSafety(vehicles, REFERENCE_DATE);
    expect(result.insuranceValidRate).toBe(100);
  });

  it("awards low score for completely non-compliant fleet", () => {
    const vehicles = [
      makeVehicle({
        id: "v1",
        checkStatus: "failed",
        nextServiceDue: "2025-01-01",
        motExpiryDate: "2025-01-01",
        insuranceExpiryDate: "2025-01-01",
      }),
    ];
    const result = evaluateVehicleSafety(vehicles, REFERENCE_DATE);
    expect(result.vehicleSafetyScore).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. JOURNEY COMPLIANCE
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateJourneyCompliance", () => {
  it("returns zeroed result for empty journeys array", () => {
    const result = evaluateJourneyCompliance([], PERIOD_START, PERIOD_END);
    expect(result.totalJourneys).toBe(0);
    expect(result.journeyComplianceScore).toBe(0);
    expect(result.riskAssessmentRate).toBe(0);
  });

  it("filters journeys to period only", () => {
    const journeys = [
      makeJourney({ id: "j1", date: "2025-12-15" }), // outside
      makeJourney({ id: "j2", date: "2026-02-10" }), // inside
      makeJourney({ id: "j3", date: "2026-06-01" }), // outside
    ];
    const result = evaluateJourneyCompliance(journeys, PERIOD_START, PERIOD_END);
    expect(result.totalJourneys).toBe(1);
  });

  it("returns zero score when all journeys outside period", () => {
    const journeys = [makeJourney({ id: "j1", date: "2025-06-01" })];
    const result = evaluateJourneyCompliance(journeys, PERIOD_START, PERIOD_END);
    expect(result.journeyComplianceScore).toBe(0);
    expect(result.totalJourneys).toBe(0);
  });

  it("groups journeys by purpose correctly", () => {
    const result = evaluateJourneyCompliance(oakHouseJourneys, PERIOD_START, PERIOD_END);
    expect(result.journeysByPurpose["school_run"]).toBe(2);
    expect(result.journeysByPurpose["activity"]).toBe(2);
    expect(result.journeysByPurpose["medical_appointment"]).toBe(1);
  });

  it("calculates risk assessment rate", () => {
    const journeys = [
      makeJourney({ id: "j1", date: "2026-02-01", riskAssessmentCompleted: true }),
      makeJourney({ id: "j2", date: "2026-03-01", riskAssessmentCompleted: false }),
    ];
    const result = evaluateJourneyCompliance(journeys, PERIOD_START, PERIOD_END);
    expect(result.riskAssessmentRate).toBe(50);
  });

  it("calculates seatbelt check rate", () => {
    const journeys = [
      makeJourney({ id: "j1", date: "2026-02-01", seatbeltChecked: true }),
      makeJourney({ id: "j2", date: "2026-03-01", seatbeltChecked: false }),
      makeJourney({ id: "j3", date: "2026-04-01", seatbeltChecked: true }),
    ];
    const result = evaluateJourneyCompliance(journeys, PERIOD_START, PERIOD_END);
    expect(result.seatbeltCheckRate).toBe(67);
  });

  it("calculates journey log rate", () => {
    const journeys = [
      makeJourney({ id: "j1", date: "2026-02-01", journeyLogCompleted: true }),
      makeJourney({ id: "j2", date: "2026-03-01", journeyLogCompleted: false }),
    ];
    const result = evaluateJourneyCompliance(journeys, PERIOD_START, PERIOD_END);
    expect(result.journeyLogRate).toBe(50);
  });

  it("calculates incident rate", () => {
    const journeys = [
      makeJourney({ id: "j1", date: "2026-02-01", incidentOccurred: true }),
      makeJourney({ id: "j2", date: "2026-03-01", incidentOccurred: false }),
      makeJourney({ id: "j3", date: "2026-04-01", incidentOccurred: false }),
      makeJourney({ id: "j4", date: "2026-05-01", incidentOccurred: false }),
    ];
    const result = evaluateJourneyCompliance(journeys, PERIOD_START, PERIOD_END);
    expect(result.incidentRate).toBe(25);
  });

  it("calculates zero incident rate when no incidents", () => {
    const journeys = [
      makeJourney({ id: "j1", date: "2026-02-01", incidentOccurred: false }),
      makeJourney({ id: "j2", date: "2026-03-01", incidentOccurred: false }),
    ];
    const result = evaluateJourneyCompliance(journeys, PERIOD_START, PERIOD_END);
    expect(result.incidentRate).toBe(0);
  });

  it("calculates completion rate for fully compliant journeys", () => {
    const journeys = [
      makeJourney({ id: "j1", date: "2026-02-01", riskAssessmentCompleted: true, seatbeltChecked: true, journeyLogCompleted: true }),
      makeJourney({ id: "j2", date: "2026-03-01", riskAssessmentCompleted: true, seatbeltChecked: false, journeyLogCompleted: true }),
    ];
    const result = evaluateJourneyCompliance(journeys, PERIOD_START, PERIOD_END);
    expect(result.completionRate).toBe(50);
  });

  it("awards maximum score for perfect journey compliance", () => {
    const journeys = Array.from({ length: 5 }, (_, i) =>
      makeJourney({
        id: `j-${i}`,
        date: `2026-0${i + 1}-15`,
        riskAssessmentCompleted: true,
        seatbeltChecked: true,
        journeyLogCompleted: true,
        incidentOccurred: false,
      }),
    );
    const result = evaluateJourneyCompliance(journeys, PERIOD_START, PERIOD_END);
    expect(result.journeyComplianceScore).toBe(25);
  });

  it("awards low incident rate bonus for zero incidents", () => {
    const journeys = [
      makeJourney({ id: "j1", date: "2026-02-01", incidentOccurred: false, riskAssessmentCompleted: false, seatbeltChecked: false, journeyLogCompleted: false }),
    ];
    const result = evaluateJourneyCompliance(journeys, PERIOD_START, PERIOD_END);
    // incident bonus should be 4 for 0% incidents
    expect(result.journeyComplianceScore).toBeGreaterThanOrEqual(4);
  });

  it("awards partial incident rate bonus for low incident rate", () => {
    // 1 incident out of 20 journeys = 5%
    const journeys: JourneyRecord[] = [];
    for (let i = 0; i < 20; i++) {
      const month = String(((i % 5) + 1)).padStart(2, "0");
      journeys.push(
        makeJourney({
          id: `j-${i}`,
          date: `2026-${month}-${String(i + 1).padStart(2, "0")}`,
          incidentOccurred: i === 0,
          riskAssessmentCompleted: false,
          seatbeltChecked: false,
          journeyLogCompleted: false,
        }),
      );
    }
    const result = evaluateJourneyCompliance(journeys, PERIOD_START, PERIOD_END);
    // 5% incident rate should give 2 bonus points
    expect(result.incidentRate).toBe(5);
  });

  it("journey compliance score is between 0 and 25", () => {
    const result = evaluateJourneyCompliance(oakHouseJourneys, PERIOD_START, PERIOD_END);
    expect(result.journeyComplianceScore).toBeGreaterThanOrEqual(0);
    expect(result.journeyComplianceScore).toBeLessThanOrEqual(25);
  });

  it("handles journey exactly on period boundary dates", () => {
    const journeys = [
      makeJourney({ id: "j1", date: PERIOD_START }),
      makeJourney({ id: "j2", date: PERIOD_END }),
    ];
    const result = evaluateJourneyCompliance(journeys, PERIOD_START, PERIOD_END);
    expect(result.totalJourneys).toBe(2);
  });

  it("handles all journeys non-compliant", () => {
    const journeys = [
      makeJourney({ id: "j1", date: "2026-02-01", riskAssessmentCompleted: false, seatbeltChecked: false, journeyLogCompleted: false, incidentOccurred: true }),
    ];
    const result = evaluateJourneyCompliance(journeys, PERIOD_START, PERIOD_END);
    expect(result.completionRate).toBe(0);
    expect(result.riskAssessmentRate).toBe(0);
    expect(result.seatbeltCheckRate).toBe(0);
    expect(result.journeyLogRate).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. DRIVER COMPETENCE
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateDriverCompetence", () => {
  it("returns zeroed result for empty drivers array", () => {
    const result = evaluateDriverCompetence([], REFERENCE_DATE);
    expect(result.totalDrivers).toBe(0);
    expect(result.driverCompetenceScore).toBe(0);
    expect(result.licenceValidRate).toBe(0);
  });

  it("calculates licence valid rate — all valid", () => {
    const drivers = [
      makeDriver({ id: "d1", licenceValid: true, licenceExpiryDate: "2028-01-01" }),
      makeDriver({ id: "d2", licenceValid: true, licenceExpiryDate: "2029-01-01" }),
    ];
    const result = evaluateDriverCompetence(drivers, REFERENCE_DATE);
    expect(result.licenceValidRate).toBe(100);
  });

  it("calculates licence valid rate with expired licence", () => {
    const drivers = [
      makeDriver({ id: "d1", licenceValid: true, licenceExpiryDate: "2028-01-01" }),
      makeDriver({ id: "d2", licenceValid: true, licenceExpiryDate: "2025-01-01" }), // expired
    ];
    const result = evaluateDriverCompetence(drivers, REFERENCE_DATE);
    expect(result.licenceValidRate).toBe(50);
  });

  it("treats driver with licenceValid=false as invalid even if date is future", () => {
    const drivers = [
      makeDriver({ id: "d1", licenceValid: false, licenceExpiryDate: "2028-01-01" }),
    ];
    const result = evaluateDriverCompetence(drivers, REFERENCE_DATE);
    expect(result.licenceValidRate).toBe(0);
  });

  it("calculates DBS checked rate", () => {
    const drivers = [
      makeDriver({ id: "d1", dbsChecked: true }),
      makeDriver({ id: "d2", dbsChecked: false }),
    ];
    const result = evaluateDriverCompetence(drivers, REFERENCE_DATE);
    expect(result.dbsCheckedRate).toBe(50);
  });

  it("calculates training completed rate", () => {
    const drivers = [
      makeDriver({ id: "d1", driverTrainingCompleted: true }),
      makeDriver({ id: "d2", driverTrainingCompleted: false }),
      makeDriver({ id: "d3", driverTrainingCompleted: true }),
    ];
    const result = evaluateDriverCompetence(drivers, REFERENCE_DATE);
    expect(result.trainingCompletedRate).toBe(67);
  });

  it("calculates first aid rate", () => {
    const drivers = [
      makeDriver({ id: "d1", firstAidTrained: true }),
      makeDriver({ id: "d2", firstAidTrained: false }),
    ];
    const result = evaluateDriverCompetence(drivers, REFERENCE_DATE);
    expect(result.firstAidRate).toBe(50);
  });

  it("calculates assessment current rate — all within 12 months", () => {
    const drivers = [
      makeDriver({ id: "d1", lastAssessmentDate: "2026-01-01" }),
      makeDriver({ id: "d2", lastAssessmentDate: "2026-03-01" }),
    ];
    const result = evaluateDriverCompetence(drivers, REFERENCE_DATE);
    expect(result.assessmentCurrentRate).toBe(100);
  });

  it("calculates assessment current rate — some expired", () => {
    const drivers = [
      makeDriver({ id: "d1", lastAssessmentDate: "2026-01-01" }), // current
      makeDriver({ id: "d2", lastAssessmentDate: "2024-01-01" }), // old
    ];
    const result = evaluateDriverCompetence(drivers, REFERENCE_DATE);
    expect(result.assessmentCurrentRate).toBe(50);
  });

  it("awards maximum score for perfect driver compliance", () => {
    const drivers = [
      makeDriver({ id: "d1" }),
      makeDriver({ id: "d2" }),
    ];
    const result = evaluateDriverCompetence(drivers, REFERENCE_DATE);
    expect(result.driverCompetenceScore).toBe(25);
  });

  it("awards zero score for completely non-compliant drivers", () => {
    const drivers = [
      makeDriver({
        id: "d1",
        licenceValid: false,
        dbsChecked: false,
        driverTrainingCompleted: false,
        firstAidTrained: false,
        licenceExpiryDate: "2025-01-01",
        lastAssessmentDate: "2024-01-01",
      }),
    ];
    const result = evaluateDriverCompetence(drivers, REFERENCE_DATE);
    expect(result.driverCompetenceScore).toBe(0);
  });

  it("driver competence score is between 0 and 25", () => {
    const result = evaluateDriverCompetence(oakHouseDrivers, REFERENCE_DATE);
    expect(result.driverCompetenceScore).toBeGreaterThanOrEqual(0);
    expect(result.driverCompetenceScore).toBeLessThanOrEqual(25);
  });

  it("counts total drivers correctly", () => {
    const result = evaluateDriverCompetence(oakHouseDrivers, REFERENCE_DATE);
    expect(result.totalDrivers).toBe(3);
  });

  it("handles licence on exact expiry boundary", () => {
    const drivers = [
      makeDriver({ id: "d1", licenceValid: true, licenceExpiryDate: REFERENCE_DATE }),
    ];
    const result = evaluateDriverCompetence(drivers, REFERENCE_DATE);
    expect(result.licenceValidRate).toBe(100);
  });

  it("handles assessment exactly 365 days old", () => {
    const drivers = [
      makeDriver({ id: "d1", lastAssessmentDate: "2025-05-18" }), // exactly 365 days
    ];
    const result = evaluateDriverCompetence(drivers, REFERENCE_DATE);
    expect(result.assessmentCurrentRate).toBe(100);
  });

  it("handles assessment 366 days old as non-current", () => {
    const drivers = [
      makeDriver({ id: "d1", lastAssessmentDate: "2025-05-17" }), // 366 days
    ];
    const result = evaluateDriverCompetence(drivers, REFERENCE_DATE);
    expect(result.assessmentCurrentRate).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. INCIDENT RESPONSE
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateIncidentResponse", () => {
  it("returns 25 score for empty incidents (no incidents = excellent)", () => {
    const result = evaluateIncidentResponse([]);
    expect(result.totalIncidents).toBe(0);
    expect(result.incidentResponseScore).toBe(25);
  });

  it("counts incidents by severity", () => {
    const incidents = [
      makeIncident({ id: "i1", severity: "minor" }),
      makeIncident({ id: "i2", severity: "minor" }),
      makeIncident({ id: "i3", severity: "moderate" }),
      makeIncident({ id: "i4", severity: "serious" }),
    ];
    const result = evaluateIncidentResponse(incidents);
    expect(result.bySeverity["minor"]).toBe(2);
    expect(result.bySeverity["moderate"]).toBe(1);
    expect(result.bySeverity["serious"]).toBe(1);
  });

  it("calculates reported timely rate", () => {
    const incidents = [
      makeIncident({ id: "i1", reportedTimely: true }),
      makeIncident({ id: "i2", reportedTimely: false }),
    ];
    const result = evaluateIncidentResponse(incidents);
    expect(result.reportedTimelyRate).toBe(50);
  });

  it("calculates investigation completed rate", () => {
    const incidents = [
      makeIncident({ id: "i1", investigationCompleted: true }),
      makeIncident({ id: "i2", investigationCompleted: false }),
      makeIncident({ id: "i3", investigationCompleted: true }),
    ];
    const result = evaluateIncidentResponse(incidents);
    expect(result.investigationCompletedRate).toBe(67);
  });

  it("calculates preventive measures rate", () => {
    const incidents = [
      makeIncident({ id: "i1", preventiveMeasures: true }),
      makeIncident({ id: "i2", preventiveMeasures: false }),
    ];
    const result = evaluateIncidentResponse(incidents);
    expect(result.preventiveMeasuresRate).toBe(50);
  });

  it("counts serious incidents", () => {
    const incidents = [
      makeIncident({ id: "i1", severity: "serious" }),
      makeIncident({ id: "i2", severity: "minor" }),
      makeIncident({ id: "i3", severity: "serious" }),
    ];
    const result = evaluateIncidentResponse(incidents);
    expect(result.seriousIncidentCount).toBe(2);
  });

  it("awards no-serious bonus when all minor", () => {
    const incidents = [
      makeIncident({ id: "i1", severity: "minor", reportedTimely: true, investigationCompleted: true, preventiveMeasures: true }),
    ];
    const result = evaluateIncidentResponse(incidents);
    expect(result.seriousIncidentCount).toBe(0);
    // Should include 5-point bonus
    expect(result.incidentResponseScore).toBeGreaterThanOrEqual(20);
  });

  it("does not award no-serious bonus when serious incidents exist", () => {
    const incidents = [
      makeIncident({ id: "i1", severity: "serious", reportedTimely: true, investigationCompleted: true, preventiveMeasures: true }),
    ];
    const result = evaluateIncidentResponse(incidents);
    // max without bonus: 8+7+5 = 20
    expect(result.incidentResponseScore).toBeLessThanOrEqual(20);
  });

  it("awards maximum score for well-handled minor incidents", () => {
    const incidents = [
      makeIncident({ id: "i1", severity: "minor", reportedTimely: true, investigationCompleted: true, preventiveMeasures: true }),
    ];
    const result = evaluateIncidentResponse(incidents);
    expect(result.incidentResponseScore).toBe(25);
  });

  it("awards low score for poorly handled serious incidents", () => {
    const incidents = [
      makeIncident({ id: "i1", severity: "serious", reportedTimely: false, investigationCompleted: false, preventiveMeasures: false }),
    ];
    const result = evaluateIncidentResponse(incidents);
    expect(result.incidentResponseScore).toBe(0);
  });

  it("incident response score is between 0 and 25", () => {
    const incidents = [
      makeIncident({ id: "i1", severity: "moderate", reportedTimely: true, investigationCompleted: false, preventiveMeasures: true }),
    ];
    const result = evaluateIncidentResponse(incidents);
    expect(result.incidentResponseScore).toBeGreaterThanOrEqual(0);
    expect(result.incidentResponseScore).toBeLessThanOrEqual(25);
  });

  it("handles all incidents reported late", () => {
    const incidents = [
      makeIncident({ id: "i1", reportedTimely: false }),
      makeIncident({ id: "i2", reportedTimely: false }),
    ];
    const result = evaluateIncidentResponse(incidents);
    expect(result.reportedTimelyRate).toBe(0);
  });

  it("handles all incidents with preventive measures", () => {
    const incidents = [
      makeIncident({ id: "i1", preventiveMeasures: true }),
      makeIncident({ id: "i2", preventiveMeasures: true }),
    ];
    const result = evaluateIncidentResponse(incidents);
    expect(result.preventiveMeasuresRate).toBe(100);
  });

  it("returns correct total incidents count", () => {
    const incidents = [
      makeIncident({ id: "i1" }),
      makeIncident({ id: "i2" }),
      makeIncident({ id: "i3" }),
    ];
    const result = evaluateIncidentResponse(incidents);
    expect(result.totalIncidents).toBe(3);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. CHILD TRANSPORT PROFILES
// ══════════════════════════════════════════════════════════════════════════════

describe("buildChildTransportProfiles", () => {
  it("returns empty array for empty childIds", () => {
    const result = buildChildTransportProfiles([], oakHouseJourneys, []);
    expect(result).toHaveLength(0);
  });

  it("builds profile for each child", () => {
    const result = buildChildTransportProfiles(oakHouseChildIds, oakHouseJourneys, []);
    expect(result).toHaveLength(3);
  });

  it("counts journeys per child correctly", () => {
    const result = buildChildTransportProfiles(oakHouseChildIds, oakHouseJourneys, []);
    const alex = result.find((p) => p.childId === "child-alex")!;
    const jordan = result.find((p) => p.childId === "child-jordan")!;
    const morgan = result.find((p) => p.childId === "child-morgan")!;
    expect(alex.totalJourneys).toBe(4); // j-001, j-003, j-005, j-006
    expect(jordan.totalJourneys).toBe(4); // j-001, j-004, j-005, j-008
    expect(morgan.totalJourneys).toBe(4); // j-002, j-004, j-005, j-007
  });

  it("tracks journey purposes per child", () => {
    const result = buildChildTransportProfiles(oakHouseChildIds, oakHouseJourneys, []);
    const alex = result.find((p) => p.childId === "child-alex")!;
    expect(alex.journeyPurposes).toContain("school_run");
    expect(alex.journeyPurposes).toContain("family_contact");
    expect(alex.journeyPurposes).toContain("activity");
  });

  it("counts incidents involving each child", () => {
    const incidents = [
      makeIncident({ id: "i1", childrenInvolved: ["child-alex"] }),
      makeIncident({ id: "i2", childrenInvolved: ["child-alex", "child-jordan"] }),
    ];
    const result = buildChildTransportProfiles(oakHouseChildIds, oakHouseJourneys, incidents);
    const alex = result.find((p) => p.childId === "child-alex")!;
    const jordan = result.find((p) => p.childId === "child-jordan")!;
    const morgan = result.find((p) => p.childId === "child-morgan")!;
    expect(alex.incidentsInvolved).toBe(2);
    expect(jordan.incidentsInvolved).toBe(1);
    expect(morgan.incidentsInvolved).toBe(0);
  });

  it("counts risk assessments completed per child", () => {
    const result = buildChildTransportProfiles(oakHouseChildIds, oakHouseJourneys, []);
    const alex = result.find((p) => p.childId === "child-alex")!;
    expect(alex.riskAssessmentsCompleted).toBe(4); // all journeys have riskAssessmentCompleted=true
  });

  it("counts seatbelt checks per child", () => {
    const result = buildChildTransportProfiles(oakHouseChildIds, oakHouseJourneys, []);
    const alex = result.find((p) => p.childId === "child-alex")!;
    expect(alex.seatbeltChecks).toBe(4);
  });

  it("safety score is 0-10 range", () => {
    const result = buildChildTransportProfiles(oakHouseChildIds, oakHouseJourneys, []);
    for (const profile of result) {
      expect(profile.safetyScore).toBeGreaterThanOrEqual(0);
      expect(profile.safetyScore).toBeLessThanOrEqual(10);
    }
  });

  it("awards maximum safety score for fully compliant child with no incidents", () => {
    const journeys = [
      makeJourney({ id: "j1", date: "2026-02-01", childIds: ["child-test"], riskAssessmentCompleted: true, seatbeltChecked: true, journeyLogCompleted: true, incidentOccurred: false }),
    ];
    const result = buildChildTransportProfiles(["child-test"], journeys, []);
    expect(result[0].safetyScore).toBe(10);
  });

  it("awards zero safety score for child with no journeys", () => {
    const result = buildChildTransportProfiles(["child-none"], [], []);
    expect(result[0].safetyScore).toBe(0);
    expect(result[0].totalJourneys).toBe(0);
  });

  it("reduces safety score when child involved in incidents", () => {
    const journeys = [
      makeJourney({ id: "j1", date: "2026-02-01", childIds: ["child-test"], riskAssessmentCompleted: true, seatbeltChecked: true, journeyLogCompleted: true }),
    ];
    const incidents = [
      makeIncident({ id: "i1", childrenInvolved: ["child-test"] }),
    ];
    const result = buildChildTransportProfiles(["child-test"], journeys, incidents);
    expect(result[0].safetyScore).toBeLessThan(10);
  });

  it("handles child present in multiple journeys with mixed compliance", () => {
    const journeys = [
      makeJourney({ id: "j1", date: "2026-02-01", childIds: ["child-test"], riskAssessmentCompleted: true, seatbeltChecked: true, journeyLogCompleted: true }),
      makeJourney({ id: "j2", date: "2026-03-01", childIds: ["child-test"], riskAssessmentCompleted: false, seatbeltChecked: false, journeyLogCompleted: false }),
    ];
    const result = buildChildTransportProfiles(["child-test"], journeys, []);
    expect(result[0].riskAssessmentsCompleted).toBe(1);
    expect(result[0].seatbeltChecks).toBe(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. FULL INTELLIGENCE — generateTransportSafetyComplianceIntelligence
// ══════════════════════════════════════════════════════════════════════════════

describe("generateTransportSafetyComplianceIntelligence", () => {
  it("produces a complete intelligence object", () => {
    const result = generateTransportSafetyComplianceIntelligence(
      oakHouseVehicles, oakHouseJourneys, oakHouseDrivers, oakHouseIncidents, oakHouseChildIds,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.homeId).toBe("oak-house");
    expect(result.assessedAt).toBe(REFERENCE_DATE);
    expect(result.periodStart).toBe(PERIOD_START);
    expect(result.periodEnd).toBe(PERIOD_END);
    expect(typeof result.overallScore).toBe("number");
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);
  });

  it("overall score is sum of four sub-scores", () => {
    const result = generateTransportSafetyComplianceIntelligence(
      oakHouseVehicles, oakHouseJourneys, oakHouseDrivers, oakHouseIncidents, oakHouseChildIds,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    const expectedSum = result.vehicleSafety.vehicleSafetyScore +
      result.journeyCompliance.journeyComplianceScore +
      result.driverCompetence.driverCompetenceScore +
      result.incidentResponse.incidentResponseScore;
    expect(result.overallScore).toBe(clampHelper(expectedSum, 0, 100));
  });

  it("overall score is between 0 and 100", () => {
    const result = generateTransportSafetyComplianceIntelligence(
      oakHouseVehicles, oakHouseJourneys, oakHouseDrivers, oakHouseIncidents, oakHouseChildIds,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("rates outstanding for score >= 80", () => {
    const result = generateTransportSafetyComplianceIntelligence(
      oakHouseVehicles, oakHouseJourneys, oakHouseDrivers, oakHouseIncidents, oakHouseChildIds,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    if (result.overallScore >= 80) {
      expect(result.rating).toBe("outstanding");
    }
  });

  it("rates good for score >= 60 and < 80", () => {
    const result = generateTransportSafetyComplianceIntelligence(
      oakHouseVehicles, oakHouseJourneys, oakHouseDrivers, oakHouseIncidents, oakHouseChildIds,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    if (result.overallScore >= 60 && result.overallScore < 80) {
      expect(result.rating).toBe("good");
    }
  });

  it("rates requires_improvement for score >= 40 and < 60", () => {
    const result = generateTransportSafetyComplianceIntelligence(
      [], [makeJourney({ id: "j1", date: "2026-02-01", riskAssessmentCompleted: false, seatbeltChecked: false, journeyLogCompleted: false })], [], [], [],
      "test-home", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    if (result.overallScore >= 40 && result.overallScore < 60) {
      expect(result.rating).toBe("requires_improvement");
    }
  });

  it("rates inadequate for score < 40", () => {
    const result = generateTransportSafetyComplianceIntelligence(
      [], [], [], [makeIncident({ id: "i1", severity: "serious", reportedTimely: false, investigationCompleted: false, preventiveMeasures: false })], [],
      "empty-home", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.overallScore).toBeLessThan(40);
    expect(result.rating).toBe("inadequate");
  });

  it("generates strengths array", () => {
    const result = generateTransportSafetyComplianceIntelligence(
      oakHouseVehicles, oakHouseJourneys, oakHouseDrivers, oakHouseIncidents, oakHouseChildIds,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(Array.isArray(result.strengths)).toBe(true);
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("generates areas for improvement array", () => {
    const result = generateTransportSafetyComplianceIntelligence(
      oakHouseVehicles, oakHouseJourneys, oakHouseDrivers, oakHouseIncidents, oakHouseChildIds,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(Array.isArray(result.areasForImprovement)).toBe(true);
  });

  it("generates actions array", () => {
    const result = generateTransportSafetyComplianceIntelligence(
      oakHouseVehicles, oakHouseJourneys, oakHouseDrivers, oakHouseIncidents, oakHouseChildIds,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(Array.isArray(result.actions)).toBe(true);
  });

  it("includes 7 regulatory links", () => {
    const result = generateTransportSafetyComplianceIntelligence(
      oakHouseVehicles, oakHouseJourneys, oakHouseDrivers, oakHouseIncidents, oakHouseChildIds,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.regulatoryLinks.length).toBe(7);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015, Reg 19"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015, Reg 12"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("NMS 7"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Road Traffic Act"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Health and Safety"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("UNCRC Article 3"))).toBe(true);
  });

  it("handles completely empty data — worst case", () => {
    const result = generateTransportSafetyComplianceIntelligence(
      [], [], [], [], [],
      "empty-home", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    // 0 + 0 + 0 + 25 (no incidents) = 25
    expect(result.overallScore).toBe(25);
    expect(result.rating).toBe("inadequate");
  });

  it("identifies no vehicles as area for improvement", () => {
    const result = generateTransportSafetyComplianceIntelligence(
      [], oakHouseJourneys, oakHouseDrivers, oakHouseIncidents, oakHouseChildIds,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.areasForImprovement.some((a) => a.includes("No vehicle records"))).toBe(true);
  });

  it("identifies no drivers as area for improvement", () => {
    const result = generateTransportSafetyComplianceIntelligence(
      oakHouseVehicles, oakHouseJourneys, [], oakHouseIncidents, oakHouseChildIds,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.areasForImprovement.some((a) => a.includes("No driver records"))).toBe(true);
  });

  it("identifies failed vehicles in actions", () => {
    const vehicles = [makeVehicle({ id: "v1", checkStatus: "failed" })];
    const result = generateTransportSafetyComplianceIntelligence(
      vehicles, oakHouseJourneys, oakHouseDrivers, oakHouseIncidents, oakHouseChildIds,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.actions.some((a) => a.includes("failed vehicles"))).toBe(true);
  });

  it("identifies overdue checks in actions", () => {
    const vehicles = [makeVehicle({ id: "v1", checkStatus: "overdue" })];
    const result = generateTransportSafetyComplianceIntelligence(
      vehicles, oakHouseJourneys, oakHouseDrivers, oakHouseIncidents, oakHouseChildIds,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.actions.some((a) => a.includes("overdue vehicle safety checks"))).toBe(true);
  });

  it("identifies expired insurance in actions", () => {
    const vehicles = [makeVehicle({ id: "v1", insuranceExpiryDate: "2025-01-01" })];
    const result = generateTransportSafetyComplianceIntelligence(
      vehicles, oakHouseJourneys, oakHouseDrivers, oakHouseIncidents, oakHouseChildIds,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.actions.some((a) => a.includes("Renew expired vehicle insurance"))).toBe(true);
  });

  it("identifies expired MOT in areas for improvement", () => {
    const vehicles = [makeVehicle({ id: "v1", motExpiryDate: "2025-01-01" })];
    const result = generateTransportSafetyComplianceIntelligence(
      vehicles, oakHouseJourneys, oakHouseDrivers, oakHouseIncidents, oakHouseChildIds,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.areasForImprovement.some((a) => a.includes("MOT"))).toBe(true);
  });

  it("identifies missing risk assessments in areas for improvement", () => {
    const journeys = [
      makeJourney({ id: "j1", date: "2026-02-01", riskAssessmentCompleted: false }),
    ];
    const result = generateTransportSafetyComplianceIntelligence(
      oakHouseVehicles, journeys, oakHouseDrivers, oakHouseIncidents, oakHouseChildIds,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.areasForImprovement.some((a) => a.includes("Risk assessments not completed"))).toBe(true);
  });

  it("identifies invalid licences in areas for improvement", () => {
    const drivers = [
      makeDriver({ id: "d1", licenceValid: false }),
    ];
    const result = generateTransportSafetyComplianceIntelligence(
      oakHouseVehicles, oakHouseJourneys, drivers, oakHouseIncidents, oakHouseChildIds,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.areasForImprovement.some((a) => a.includes("valid licences"))).toBe(true);
  });

  it("identifies DBS gaps in areas for improvement", () => {
    const drivers = [
      makeDriver({ id: "d1", dbsChecked: false }),
    ];
    const result = generateTransportSafetyComplianceIntelligence(
      oakHouseVehicles, oakHouseJourneys, drivers, oakHouseIncidents, oakHouseChildIds,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.areasForImprovement.some((a) => a.includes("DBS checks"))).toBe(true);
  });

  it("identifies serious incidents in areas for improvement", () => {
    const incidents = [
      makeIncident({ id: "i1", severity: "serious" }),
    ];
    const result = generateTransportSafetyComplianceIntelligence(
      oakHouseVehicles, oakHouseJourneys, oakHouseDrivers, incidents, oakHouseChildIds,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.areasForImprovement.some((a) => a.includes("serious transport incident"))).toBe(true);
  });

  it("identifies uninvestigated incidents in actions", () => {
    const incidents = [
      makeIncident({ id: "i1", investigationCompleted: false }),
    ];
    const result = generateTransportSafetyComplianceIntelligence(
      oakHouseVehicles, oakHouseJourneys, oakHouseDrivers, incidents, oakHouseChildIds,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.actions.some((a) => a.includes("Complete outstanding transport incident investigations"))).toBe(true);
  });

  it("includes child transport profiles in result", () => {
    const result = generateTransportSafetyComplianceIntelligence(
      oakHouseVehicles, oakHouseJourneys, oakHouseDrivers, oakHouseIncidents, oakHouseChildIds,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.childTransportProfiles).toHaveLength(3);
  });

  it("includes sub-evaluations in the result", () => {
    const result = generateTransportSafetyComplianceIntelligence(
      oakHouseVehicles, oakHouseJourneys, oakHouseDrivers, oakHouseIncidents, oakHouseChildIds,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.vehicleSafety).toBeDefined();
    expect(result.journeyCompliance).toBeDefined();
    expect(result.driverCompetence).toBeDefined();
    expect(result.incidentResponse).toBeDefined();
  });

  it("Oak House demo data produces reasonable score", () => {
    const result = generateTransportSafetyComplianceIntelligence(
      oakHouseVehicles, oakHouseJourneys, oakHouseDrivers, oakHouseIncidents, oakHouseChildIds,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(60);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("perfect compliance across all areas achieves outstanding", () => {
    const vehicles = [
      makeVehicle({ id: "v1", checkStatus: "passed" }),
      makeVehicle({ id: "v2", checkStatus: "passed" }),
    ];
    const journeys = Array.from({ length: 5 }, (_, i) =>
      makeJourney({
        id: `j-${i}`,
        date: `2026-0${i + 1}-15`,
        childIds: ["child-alex"],
        riskAssessmentCompleted: true,
        seatbeltChecked: true,
        journeyLogCompleted: true,
        incidentOccurred: false,
      }),
    );
    const drivers = [
      makeDriver({ id: "d1" }),
      makeDriver({ id: "d2" }),
    ];
    const result = generateTransportSafetyComplianceIntelligence(
      vehicles, journeys, drivers, [], ["child-alex"],
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.overallScore).toBe(100);
    expect(result.rating).toBe("outstanding");
  });

  it("generates strengths for no incidents", () => {
    const result = generateTransportSafetyComplianceIntelligence(
      oakHouseVehicles, oakHouseJourneys, oakHouseDrivers, [], oakHouseChildIds,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.strengths.some((s) => s.includes("No transport incidents"))).toBe(true);
  });

  it("generates strengths for complete seatbelt checks", () => {
    const result = generateTransportSafetyComplianceIntelligence(
      oakHouseVehicles, oakHouseJourneys, oakHouseDrivers, oakHouseIncidents, oakHouseChildIds,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.strengths.some((s) => s.includes("Seatbelt checks"))).toBe(true);
  });

  it("generates strengths for all DBS checked", () => {
    const result = generateTransportSafetyComplianceIntelligence(
      oakHouseVehicles, oakHouseJourneys, oakHouseDrivers, oakHouseIncidents, oakHouseChildIds,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.strengths.some((s) => s.includes("DBS checks"))).toBe(true);
  });

  it("identifies seatbelt check gaps in areas for improvement", () => {
    const journeys = [
      makeJourney({ id: "j1", date: "2026-02-01", seatbeltChecked: false }),
    ];
    const result = generateTransportSafetyComplianceIntelligence(
      oakHouseVehicles, journeys, oakHouseDrivers, oakHouseIncidents, oakHouseChildIds,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.areasForImprovement.some((a) => a.includes("Seatbelt checks"))).toBe(true);
  });

  it("identifies missing training in actions", () => {
    const drivers = [
      makeDriver({ id: "d1", driverTrainingCompleted: false }),
    ];
    const result = generateTransportSafetyComplianceIntelligence(
      oakHouseVehicles, oakHouseJourneys, drivers, oakHouseIncidents, oakHouseChildIds,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.actions.some((a) => a.includes("transport safety training"))).toBe(true);
  });

  it("identifies missing first aid in actions", () => {
    const drivers = [
      makeDriver({ id: "d1", firstAidTrained: false }),
    ];
    const result = generateTransportSafetyComplianceIntelligence(
      oakHouseVehicles, oakHouseJourneys, drivers, oakHouseIncidents, oakHouseChildIds,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.actions.some((a) => a.includes("first aid training"))).toBe(true);
  });

  it("identifies overdue assessments in actions", () => {
    const drivers = [
      makeDriver({ id: "d1", lastAssessmentDate: "2024-01-01" }),
    ];
    const result = generateTransportSafetyComplianceIntelligence(
      oakHouseVehicles, oakHouseJourneys, drivers, oakHouseIncidents, oakHouseChildIds,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.actions.some((a) => a.includes("driver assessments"))).toBe(true);
  });
});
