// ══════════════════════════════════════════════════════════════════════════════
// TESTS — Transport & Travel Arrangements Intelligence Engine
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  getTravelTypeLabel,
  getTransportModeLabel,
  getRiskLevelLabel,
  getRatingLabel,
  pct,
  getRating,
  evaluateJourneyQuality,
  evaluateVehicleSafety,
  evaluateTravelPolicy,
  evaluateStaffTravelReadiness,
  buildChildTravelProfiles,
  generateTransportTravelArrangementsIntelligence,
} from "../transport-travel-arrangements-engine";
import type {
  TravelRecord,
  VehicleCheck,
  TravelPolicy,
  StaffTravelTraining,
} from "../transport-travel-arrangements-engine";

// ── Test Fixtures ──────────────────────────────────────────────────────────

const makeTravelRecord = (overrides: Partial<TravelRecord> = {}): TravelRecord => ({
  id: "tr-001",
  childId: "child-alex",
  childName: "Alex",
  travelDate: "2026-03-15",
  travelType: "school_run",
  transportMode: "staff_car",
  driverStaffId: "staff-sarah",
  driverStaffName: "Sarah Johnson",
  riskAssessmentCompleted: true,
  seatbeltUsed: true,
  journeyOnTime: true,
  childComfortable: true,
  insuranceVerified: true,
  ...overrides,
});

const makeVehicleCheck = (overrides: Partial<VehicleCheck> = {}): VehicleCheck => ({
  id: "vc-001",
  vehicleId: "veh-001",
  vehicleName: "Oak House Minibus",
  checkDate: "2026-03-01",
  checkedBy: "Sarah Johnson",
  motCurrent: true,
  insuranceCurrent: true,
  roadworthyCondition: true,
  firstAidKitPresent: true,
  childLockEnabled: true,
  cleanAndTidy: true,
  ...overrides,
});

const makeTravelPolicy = (overrides: Partial<TravelPolicy> = {}): TravelPolicy => ({
  id: "tp-001",
  driverChecksCompleted: true,
  insuranceVerified: true,
  riskAssessmentProtocol: true,
  loneDrivingPolicy: true,
  breakdownProcedure: true,
  childConsentObtained: true,
  routePlanningRequired: true,
  ...overrides,
});

const makeStaffTraining = (overrides: Partial<StaffTravelTraining> = {}): StaffTravelTraining => ({
  id: "st-001",
  staffId: "staff-sarah",
  staffName: "Sarah Johnson",
  drivingAssessment: true,
  childTransportSafety: true,
  firstAidTraining: true,
  riskAssessment: true,
  breakdownProcedure: true,
  childComfortAwareness: true,
  ...overrides,
});

// ══════════════════════════════════════════════════════════════════════════════
// Label Getters
// ══════════════════════════════════════════════════════════════════════════════

describe("getTravelTypeLabel", () => {
  it("returns correct label for school_run", () => {
    expect(getTravelTypeLabel("school_run")).toBe("School Run");
  });

  it("returns correct label for contact_visit", () => {
    expect(getTravelTypeLabel("contact_visit")).toBe("Contact Visit");
  });

  it("returns correct label for medical_appointment", () => {
    expect(getTravelTypeLabel("medical_appointment")).toBe("Medical Appointment");
  });

  it("returns correct label for social_activity", () => {
    expect(getTravelTypeLabel("social_activity")).toBe("Social Activity");
  });

  it("returns correct label for education_placement", () => {
    expect(getTravelTypeLabel("education_placement")).toBe("Education Placement");
  });

  it("returns correct label for court_hearing", () => {
    expect(getTravelTypeLabel("court_hearing")).toBe("Court Hearing");
  });

  it("returns correct label for therapy_session", () => {
    expect(getTravelTypeLabel("therapy_session")).toBe("Therapy Session");
  });

  it("returns correct label for other", () => {
    expect(getTravelTypeLabel("other")).toBe("Other");
  });
});

describe("getTransportModeLabel", () => {
  it("returns correct label for staff_car", () => {
    expect(getTransportModeLabel("staff_car")).toBe("Staff Car");
  });

  it("returns correct label for minibus", () => {
    expect(getTransportModeLabel("minibus")).toBe("Minibus");
  });

  it("returns correct label for public_transport", () => {
    expect(getTransportModeLabel("public_transport")).toBe("Public Transport");
  });

  it("returns correct label for taxi", () => {
    expect(getTransportModeLabel("taxi")).toBe("Taxi");
  });

  it("returns correct label for walking", () => {
    expect(getTransportModeLabel("walking")).toBe("Walking");
  });

  it("returns correct label for specialist_vehicle", () => {
    expect(getTransportModeLabel("specialist_vehicle")).toBe("Specialist Vehicle");
  });

  it("returns correct label for other", () => {
    expect(getTransportModeLabel("other")).toBe("Other");
  });
});

describe("getRiskLevelLabel", () => {
  it("returns Low for low", () => {
    expect(getRiskLevelLabel("low")).toBe("Low");
  });

  it("returns Medium for medium", () => {
    expect(getRiskLevelLabel("medium")).toBe("Medium");
  });

  it("returns High for high", () => {
    expect(getRiskLevelLabel("high")).toBe("High");
  });
});

describe("getRatingLabel", () => {
  it("returns Outstanding for outstanding", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
  });

  it("returns Good for good", () => {
    expect(getRatingLabel("good")).toBe("Good");
  });

  it("returns Requires Improvement for requires_improvement", () => {
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
  });

  it("returns Inadequate for inadequate", () => {
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Helpers
// ══════════════════════════════════════════════════════════════════════════════

describe("pct", () => {
  it("returns 0 when denominator is 0", () => {
    expect(pct(5, 0)).toBe(0);
  });

  it("returns 100 for equal numerator and denominator", () => {
    expect(pct(10, 10)).toBe(100);
  });

  it("returns 50 for half", () => {
    expect(pct(5, 10)).toBe(50);
  });

  it("rounds to nearest integer", () => {
    expect(pct(1, 3)).toBe(33);
  });

  it("returns 0 for 0 numerator", () => {
    expect(pct(0, 10)).toBe(0);
  });
});

describe("getRating", () => {
  it("returns outstanding for score >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
    expect(getRating(95)).toBe("outstanding");
  });

  it("returns good for score 60-79", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
    expect(getRating(70)).toBe("good");
  });

  it("returns requires_improvement for score 40-59", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
    expect(getRating(50)).toBe("requires_improvement");
  });

  it("returns inadequate for score < 40", () => {
    expect(getRating(39)).toBe("inadequate");
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(20)).toBe("inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateJourneyQuality
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateJourneyQuality", () => {
  it("returns zero scores for empty records", () => {
    const result = evaluateJourneyQuality([]);
    expect(result.totalJourneys).toBe(0);
    expect(result.onTimeRate).toBe(0);
    expect(result.riskAssessmentRate).toBe(0);
    expect(result.seatbeltRate).toBe(0);
    expect(result.childComfortableRate).toBe(0);
    expect(result.journeyQualityScore).toBe(0);
    expect(result.journeysByType).toEqual({});
    expect(result.journeysByMode).toEqual({});
  });

  it("returns max score for all-perfect records", () => {
    const records = [
      makeTravelRecord({ id: "tr-001" }),
      makeTravelRecord({ id: "tr-002", childId: "child-jordan", childName: "Jordan" }),
      makeTravelRecord({ id: "tr-003", childId: "child-morgan", childName: "Morgan" }),
    ];
    const result = evaluateJourneyQuality(records);
    expect(result.totalJourneys).toBe(3);
    expect(result.onTimeRate).toBe(100);
    expect(result.riskAssessmentRate).toBe(100);
    expect(result.seatbeltRate).toBe(100);
    expect(result.childComfortableRate).toBe(100);
    expect(result.journeyQualityScore).toBe(25);
  });

  it("scores partially when some journeys have issues", () => {
    const records = [
      makeTravelRecord({ id: "tr-001", journeyOnTime: false }),
      makeTravelRecord({ id: "tr-002", riskAssessmentCompleted: false }),
      makeTravelRecord({ id: "tr-003" }),
      makeTravelRecord({ id: "tr-004" }),
    ];
    const result = evaluateJourneyQuality(records);
    expect(result.onTimeRate).toBe(75);
    expect(result.riskAssessmentRate).toBe(75);
    expect(result.seatbeltRate).toBe(100);
    expect(result.childComfortableRate).toBe(100);
    expect(result.journeyQualityScore).toBeGreaterThan(0);
    expect(result.journeyQualityScore).toBeLessThanOrEqual(25);
  });

  it("tracks journeys by type correctly", () => {
    const records = [
      makeTravelRecord({ id: "tr-001", travelType: "school_run" }),
      makeTravelRecord({ id: "tr-002", travelType: "school_run" }),
      makeTravelRecord({ id: "tr-003", travelType: "medical_appointment" }),
    ];
    const result = evaluateJourneyQuality(records);
    expect(result.journeysByType).toEqual({
      school_run: 2,
      medical_appointment: 1,
    });
  });

  it("tracks journeys by mode correctly", () => {
    const records = [
      makeTravelRecord({ id: "tr-001", transportMode: "staff_car" }),
      makeTravelRecord({ id: "tr-002", transportMode: "minibus" }),
      makeTravelRecord({ id: "tr-003", transportMode: "staff_car" }),
    ];
    const result = evaluateJourneyQuality(records);
    expect(result.journeysByMode).toEqual({
      staff_car: 2,
      minibus: 1,
    });
  });

  it("handles single record", () => {
    const result = evaluateJourneyQuality([makeTravelRecord()]);
    expect(result.totalJourneys).toBe(1);
    expect(result.journeyQualityScore).toBe(25);
  });

  it("returns zero score when all flags are false", () => {
    const records = [
      makeTravelRecord({
        journeyOnTime: false,
        riskAssessmentCompleted: false,
        seatbeltUsed: false,
        childComfortable: false,
      }),
    ];
    const result = evaluateJourneyQuality(records);
    expect(result.onTimeRate).toBe(0);
    expect(result.riskAssessmentRate).toBe(0);
    expect(result.seatbeltRate).toBe(0);
    expect(result.childComfortableRate).toBe(0);
    expect(result.journeyQualityScore).toBe(0);
  });

  it("score never exceeds 25", () => {
    const records = Array.from({ length: 50 }, (_, i) =>
      makeTravelRecord({ id: `tr-${i}` }),
    );
    const result = evaluateJourneyQuality(records);
    expect(result.journeyQualityScore).toBeLessThanOrEqual(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateVehicleSafety
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateVehicleSafety", () => {
  it("returns zero scores for empty checks", () => {
    const result = evaluateVehicleSafety([]);
    expect(result.totalChecks).toBe(0);
    expect(result.motCurrentRate).toBe(0);
    expect(result.insuranceCurrentRate).toBe(0);
    expect(result.roadworthyRate).toBe(0);
    expect(result.firstAidKitRate).toBe(0);
    expect(result.childLockRate).toBe(0);
    expect(result.cleanAndTidyRate).toBe(0);
    expect(result.vehicleSafetyScore).toBe(0);
  });

  it("returns max score for all-perfect checks", () => {
    const checks = [
      makeVehicleCheck({ id: "vc-001" }),
      makeVehicleCheck({ id: "vc-002", vehicleId: "veh-002" }),
    ];
    const result = evaluateVehicleSafety(checks);
    expect(result.totalChecks).toBe(2);
    expect(result.motCurrentRate).toBe(100);
    expect(result.insuranceCurrentRate).toBe(100);
    expect(result.roadworthyRate).toBe(100);
    expect(result.vehicleSafetyScore).toBe(25);
  });

  it("handles partial compliance", () => {
    const checks = [
      makeVehicleCheck({ id: "vc-001" }),
      makeVehicleCheck({ id: "vc-002", motCurrent: false, insuranceCurrent: false }),
    ];
    const result = evaluateVehicleSafety(checks);
    expect(result.motCurrentRate).toBe(50);
    expect(result.insuranceCurrentRate).toBe(50);
    expect(result.roadworthyRate).toBe(100);
    expect(result.vehicleSafetyScore).toBeGreaterThan(0);
    expect(result.vehicleSafetyScore).toBeLessThan(25);
  });

  it("scores combined extras correctly when all are false", () => {
    const checks = [
      makeVehicleCheck({
        firstAidKitPresent: false,
        childLockEnabled: false,
        cleanAndTidy: false,
      }),
    ];
    const result = evaluateVehicleSafety(checks);
    expect(result.firstAidKitRate).toBe(0);
    expect(result.childLockRate).toBe(0);
    expect(result.cleanAndTidyRate).toBe(0);
    // MOT (7) + insurance (6) + roadworthy (6) = 19, combined extras = 0
    expect(result.vehicleSafetyScore).toBe(19);
  });

  it("returns zero when all flags are false", () => {
    const checks = [
      makeVehicleCheck({
        motCurrent: false,
        insuranceCurrent: false,
        roadworthyCondition: false,
        firstAidKitPresent: false,
        childLockEnabled: false,
        cleanAndTidy: false,
      }),
    ];
    const result = evaluateVehicleSafety(checks);
    expect(result.vehicleSafetyScore).toBe(0);
  });

  it("score never exceeds 25", () => {
    const checks = Array.from({ length: 20 }, (_, i) =>
      makeVehicleCheck({ id: `vc-${i}` }),
    );
    const result = evaluateVehicleSafety(checks);
    expect(result.vehicleSafetyScore).toBeLessThanOrEqual(25);
  });

  it("handles single check", () => {
    const result = evaluateVehicleSafety([makeVehicleCheck()]);
    expect(result.totalChecks).toBe(1);
    expect(result.vehicleSafetyScore).toBe(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateTravelPolicy
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateTravelPolicy", () => {
  it("returns zero scores for empty policies", () => {
    const result = evaluateTravelPolicy([]);
    expect(result.totalPolicies).toBe(0);
    expect(result.driverChecksRate).toBe(0);
    expect(result.insuranceVerifiedRate).toBe(0);
    expect(result.riskAssessmentProtocolRate).toBe(0);
    expect(result.loneDrivingPolicyRate).toBe(0);
    expect(result.breakdownProcedureRate).toBe(0);
    expect(result.childConsentRate).toBe(0);
    expect(result.routePlanningRate).toBe(0);
    expect(result.travelPolicyScore).toBe(0);
  });

  it("returns max score for all-complete policies", () => {
    const policies = [makeTravelPolicy()];
    const result = evaluateTravelPolicy(policies);
    expect(result.totalPolicies).toBe(1);
    expect(result.driverChecksRate).toBe(100);
    expect(result.insuranceVerifiedRate).toBe(100);
    expect(result.travelPolicyScore).toBe(25);
  });

  it("handles partial compliance", () => {
    const policies = [
      makeTravelPolicy({ driverChecksCompleted: false, insuranceVerified: false }),
    ];
    const result = evaluateTravelPolicy(policies);
    expect(result.driverChecksRate).toBe(0);
    expect(result.insuranceVerifiedRate).toBe(0);
    expect(result.travelPolicyScore).toBeGreaterThan(0);
    expect(result.travelPolicyScore).toBeLessThan(25);
  });

  it("returns zero score when all flags are false", () => {
    const policies = [
      makeTravelPolicy({
        driverChecksCompleted: false,
        insuranceVerified: false,
        riskAssessmentProtocol: false,
        loneDrivingPolicy: false,
        breakdownProcedure: false,
        childConsentObtained: false,
        routePlanningRequired: false,
      }),
    ];
    const result = evaluateTravelPolicy(policies);
    expect(result.travelPolicyScore).toBe(0);
  });

  it("handles multiple policies with mixed compliance", () => {
    const policies = [
      makeTravelPolicy({ id: "tp-001" }),
      makeTravelPolicy({
        id: "tp-002",
        driverChecksCompleted: false,
        loneDrivingPolicy: false,
      }),
    ];
    const result = evaluateTravelPolicy(policies);
    expect(result.totalPolicies).toBe(2);
    expect(result.driverChecksRate).toBe(50);
    expect(result.loneDrivingPolicyRate).toBe(50);
    expect(result.insuranceVerifiedRate).toBe(100);
  });

  it("score never exceeds 25", () => {
    const policies = Array.from({ length: 10 }, (_, i) =>
      makeTravelPolicy({ id: `tp-${i}` }),
    );
    const result = evaluateTravelPolicy(policies);
    expect(result.travelPolicyScore).toBeLessThanOrEqual(25);
  });

  it("scores individual policy fields independently", () => {
    const policies = [
      makeTravelPolicy({
        driverChecksCompleted: true,
        insuranceVerified: false,
        riskAssessmentProtocol: false,
        loneDrivingPolicy: false,
        breakdownProcedure: false,
        childConsentObtained: false,
        routePlanningRequired: false,
      }),
    ];
    const result = evaluateTravelPolicy(policies);
    expect(result.driverChecksRate).toBe(100);
    expect(result.insuranceVerifiedRate).toBe(0);
    // Only driverChecks contributes: 4 points
    expect(result.travelPolicyScore).toBe(4);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateStaffTravelReadiness
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateStaffTravelReadiness", () => {
  it("returns zero scores for empty staff", () => {
    const result = evaluateStaffTravelReadiness([]);
    expect(result.totalStaff).toBe(0);
    expect(result.drivingAssessmentRate).toBe(0);
    expect(result.childTransportSafetyRate).toBe(0);
    expect(result.firstAidTrainingRate).toBe(0);
    expect(result.riskAssessmentRate).toBe(0);
    expect(result.breakdownProcedureRate).toBe(0);
    expect(result.childComfortAwarenessRate).toBe(0);
    expect(result.staffTravelReadinessScore).toBe(0);
  });

  it("returns max score for fully trained staff", () => {
    const staff = [makeStaffTraining()];
    const result = evaluateStaffTravelReadiness(staff);
    expect(result.totalStaff).toBe(1);
    expect(result.drivingAssessmentRate).toBe(100);
    expect(result.staffTravelReadinessScore).toBe(25);
  });

  it("returns zero score when all training is false", () => {
    const staff = [
      makeStaffTraining({
        drivingAssessment: false,
        childTransportSafety: false,
        firstAidTraining: false,
        riskAssessment: false,
        breakdownProcedure: false,
        childComfortAwareness: false,
      }),
    ];
    const result = evaluateStaffTravelReadiness(staff);
    expect(result.staffTravelReadinessScore).toBe(0);
  });

  it("weights driving assessment highest (6 points)", () => {
    const staff = [
      makeStaffTraining({
        drivingAssessment: true,
        childTransportSafety: false,
        firstAidTraining: false,
        riskAssessment: false,
        breakdownProcedure: false,
        childComfortAwareness: false,
      }),
    ];
    const result = evaluateStaffTravelReadiness(staff);
    expect(result.staffTravelReadinessScore).toBe(6);
  });

  it("weights child transport safety at 5 points", () => {
    const staff = [
      makeStaffTraining({
        drivingAssessment: false,
        childTransportSafety: true,
        firstAidTraining: false,
        riskAssessment: false,
        breakdownProcedure: false,
        childComfortAwareness: false,
      }),
    ];
    const result = evaluateStaffTravelReadiness(staff);
    expect(result.staffTravelReadinessScore).toBe(5);
  });

  it("weights first aid training at 5 points", () => {
    const staff = [
      makeStaffTraining({
        drivingAssessment: false,
        childTransportSafety: false,
        firstAidTraining: true,
        riskAssessment: false,
        breakdownProcedure: false,
        childComfortAwareness: false,
      }),
    ];
    const result = evaluateStaffTravelReadiness(staff);
    expect(result.staffTravelReadinessScore).toBe(5);
  });

  it("weights risk assessment at 4 points", () => {
    const staff = [
      makeStaffTraining({
        drivingAssessment: false,
        childTransportSafety: false,
        firstAidTraining: false,
        riskAssessment: true,
        breakdownProcedure: false,
        childComfortAwareness: false,
      }),
    ];
    const result = evaluateStaffTravelReadiness(staff);
    expect(result.staffTravelReadinessScore).toBe(4);
  });

  it("weights breakdown procedure at 3 points", () => {
    const staff = [
      makeStaffTraining({
        drivingAssessment: false,
        childTransportSafety: false,
        firstAidTraining: false,
        riskAssessment: false,
        breakdownProcedure: true,
        childComfortAwareness: false,
      }),
    ];
    const result = evaluateStaffTravelReadiness(staff);
    expect(result.staffTravelReadinessScore).toBe(3);
  });

  it("weights child comfort awareness at 2 points", () => {
    const staff = [
      makeStaffTraining({
        drivingAssessment: false,
        childTransportSafety: false,
        firstAidTraining: false,
        riskAssessment: false,
        breakdownProcedure: false,
        childComfortAwareness: true,
      }),
    ];
    const result = evaluateStaffTravelReadiness(staff);
    expect(result.staffTravelReadinessScore).toBe(2);
  });

  it("handles multiple staff with mixed readiness", () => {
    const staff = [
      makeStaffTraining({ id: "st-001" }),
      makeStaffTraining({
        id: "st-002",
        staffId: "staff-tom",
        staffName: "Tom Richards",
        drivingAssessment: false,
        firstAidTraining: false,
      }),
    ];
    const result = evaluateStaffTravelReadiness(staff);
    expect(result.totalStaff).toBe(2);
    expect(result.drivingAssessmentRate).toBe(50);
    expect(result.firstAidTrainingRate).toBe(50);
    expect(result.childTransportSafetyRate).toBe(100);
  });

  it("score never exceeds 25", () => {
    const staff = Array.from({ length: 20 }, (_, i) =>
      makeStaffTraining({ id: `st-${i}`, staffId: `staff-${i}` }),
    );
    const result = evaluateStaffTravelReadiness(staff);
    expect(result.staffTravelReadinessScore).toBeLessThanOrEqual(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// buildChildTravelProfiles
// ══════════════════════════════════════════════════════════════════════════════

describe("buildChildTravelProfiles", () => {
  it("returns empty array for no records", () => {
    const profiles = buildChildTravelProfiles([]);
    expect(profiles).toEqual([]);
  });

  it("builds profile for single child", () => {
    const records = [
      makeTravelRecord({ id: "tr-001", childId: "child-alex", childName: "Alex" }),
      makeTravelRecord({
        id: "tr-002",
        childId: "child-alex",
        childName: "Alex",
        travelType: "medical_appointment",
      }),
    ];
    const profiles = buildChildTravelProfiles(records);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].childId).toBe("child-alex");
    expect(profiles[0].childName).toBe("Alex");
    expect(profiles[0].totalJourneys).toBe(2);
    expect(profiles[0].travelTypes).toContain("school_run");
    expect(profiles[0].travelTypes).toContain("medical_appointment");
    expect(profiles[0].travelScore).toBe(10);
  });

  it("builds separate profiles for multiple children", () => {
    const records = [
      makeTravelRecord({ id: "tr-001", childId: "child-alex", childName: "Alex" }),
      makeTravelRecord({ id: "tr-002", childId: "child-jordan", childName: "Jordan" }),
      makeTravelRecord({ id: "tr-003", childId: "child-morgan", childName: "Morgan" }),
    ];
    const profiles = buildChildTravelProfiles(records);
    expect(profiles).toHaveLength(3);
    const names = profiles.map((p) => p.childName);
    expect(names).toContain("Alex");
    expect(names).toContain("Jordan");
    expect(names).toContain("Morgan");
  });

  it("calculates correct rates for child with mixed records", () => {
    const records = [
      makeTravelRecord({ id: "tr-001", childId: "child-alex", childName: "Alex" }),
      makeTravelRecord({
        id: "tr-002",
        childId: "child-alex",
        childName: "Alex",
        journeyOnTime: false,
        childComfortable: false,
      }),
    ];
    const profiles = buildChildTravelProfiles(records);
    expect(profiles[0].onTimeRate).toBe(50);
    expect(profiles[0].comfortRate).toBe(50);
    expect(profiles[0].riskAssessmentRate).toBe(100);
    expect(profiles[0].seatbeltRate).toBe(100);
  });

  it("returns max travel score for perfect records", () => {
    const records = [makeTravelRecord()];
    const profiles = buildChildTravelProfiles(records);
    expect(profiles[0].travelScore).toBe(10);
  });

  it("returns zero travel score for all-false records", () => {
    const records = [
      makeTravelRecord({
        journeyOnTime: false,
        riskAssessmentCompleted: false,
        seatbeltUsed: false,
        childComfortable: false,
      }),
    ];
    const profiles = buildChildTravelProfiles(records);
    expect(profiles[0].travelScore).toBe(0);
  });

  it("clamps travel score to 0-10", () => {
    const records = Array.from({ length: 100 }, (_, i) =>
      makeTravelRecord({ id: `tr-${i}`, childId: "child-alex", childName: "Alex" }),
    );
    const profiles = buildChildTravelProfiles(records);
    expect(profiles[0].travelScore).toBeLessThanOrEqual(10);
    expect(profiles[0].travelScore).toBeGreaterThanOrEqual(0);
  });

  it("deduplicates travel types", () => {
    const records = [
      makeTravelRecord({ id: "tr-001", travelType: "school_run" }),
      makeTravelRecord({ id: "tr-002", travelType: "school_run" }),
      makeTravelRecord({ id: "tr-003", travelType: "school_run" }),
    ];
    const profiles = buildChildTravelProfiles(records);
    expect(profiles[0].travelTypes).toEqual(["school_run"]);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// generateTransportTravelArrangementsIntelligence
// ══════════════════════════════════════════════════════════════════════════════

describe("generateTransportTravelArrangementsIntelligence", () => {
  it("generates intelligence with all empty inputs", () => {
    const result = generateTransportTravelArrangementsIntelligence(
      [], [], [], [],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-19");
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.childTravelProfiles).toEqual([]);
    expect(result.regulatoryLinks.length).toBeGreaterThan(0);
  });

  it("generates outstanding rating for perfect data", () => {
    const records = [
      makeTravelRecord({ id: "tr-001" }),
      makeTravelRecord({ id: "tr-002", childId: "child-jordan", childName: "Jordan" }),
    ];
    const checks = [makeVehicleCheck()];
    const policies = [makeTravelPolicy()];
    const staff = [makeStaffTraining()];

    const result = generateTransportTravelArrangementsIntelligence(
      records, checks, policies, staff,
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.overallScore).toBe(100);
    expect(result.rating).toBe("outstanding");
  });

  it("sums all four evaluator scores into overallScore", () => {
    const records = [makeTravelRecord()];
    const checks = [makeVehicleCheck()];
    const policies = [makeTravelPolicy()];
    const staff = [makeStaffTraining()];

    const result = generateTransportTravelArrangementsIntelligence(
      records, checks, policies, staff,
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    const expected =
      result.journeyQuality.journeyQualityScore +
      result.vehicleSafety.vehicleSafetyScore +
      result.travelPolicy.travelPolicyScore +
      result.staffTravelReadiness.staffTravelReadinessScore;
    expect(result.overallScore).toBe(expected);
  });

  it("includes strengths for perfect journey quality", () => {
    const records = [makeTravelRecord()];
    const result = generateTransportTravelArrangementsIntelligence(
      records, [], [], [],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.strengths.some((s) => s.includes("on time"))).toBe(true);
    expect(result.strengths.some((s) => s.includes("Risk assessments"))).toBe(true);
    expect(result.strengths.some((s) => s.includes("Seatbelt"))).toBe(true);
    expect(result.strengths.some((s) => s.includes("comfortable"))).toBe(true);
  });

  it("includes areas for improvement when data is missing", () => {
    const result = generateTransportTravelArrangementsIntelligence(
      [], [], [], [],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.areasForImprovement.some((a) => a.includes("No travel records"))).toBe(true);
    expect(result.areasForImprovement.some((a) => a.includes("No vehicle checks"))).toBe(true);
    expect(result.areasForImprovement.some((a) => a.includes("No travel policies"))).toBe(true);
    expect(result.areasForImprovement.some((a) => a.includes("No staff travel training"))).toBe(true);
  });

  it("includes actions when data is missing", () => {
    const result = generateTransportTravelArrangementsIntelligence(
      [], [], [], [],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.actions.length).toBeGreaterThan(0);
  });

  it("includes correct regulatory links", () => {
    const result = generateTransportTravelArrangementsIntelligence(
      [], [], [], [],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.regulatoryLinks.some((r) => r.includes("CHR 2015, Reg 10"))).toBe(true);
    expect(result.regulatoryLinks.some((r) => r.includes("CHR 2015, Reg 13"))).toBe(true);
    expect(result.regulatoryLinks.some((r) => r.includes("SCCIF"))).toBe(true);
    expect(result.regulatoryLinks.some((r) => r.includes("NMS 3"))).toBe(true);
    expect(result.regulatoryLinks.some((r) => r.includes("Road Traffic Act 1988"))).toBe(true);
    expect(result.regulatoryLinks.some((r) => r.includes("Health and Safety at Work Act 1974"))).toBe(true);
    expect(result.regulatoryLinks.some((r) => r.includes("Children Act 1989"))).toBe(true);
  });

  it("includes 7 regulatory links", () => {
    const result = generateTransportTravelArrangementsIntelligence(
      [], [], [], [],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.regulatoryLinks).toHaveLength(7);
  });

  it("builds child travel profiles from records", () => {
    const records = [
      makeTravelRecord({ id: "tr-001", childId: "child-alex", childName: "Alex" }),
      makeTravelRecord({ id: "tr-002", childId: "child-jordan", childName: "Jordan" }),
    ];
    const result = generateTransportTravelArrangementsIntelligence(
      records, [], [], [],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.childTravelProfiles).toHaveLength(2);
  });

  it("overall score is clamped to 0-100", () => {
    const records = Array.from({ length: 10 }, (_, i) => makeTravelRecord({ id: `tr-${i}` }));
    const checks = Array.from({ length: 10 }, (_, i) => makeVehicleCheck({ id: `vc-${i}` }));
    const policies = Array.from({ length: 10 }, (_, i) => makeTravelPolicy({ id: `tp-${i}` }));
    const staff = Array.from({ length: 10 }, (_, i) =>
      makeStaffTraining({ id: `st-${i}`, staffId: `staff-${i}` }),
    );
    const result = generateTransportTravelArrangementsIntelligence(
      records, checks, policies, staff,
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("generates actions for partial journey compliance", () => {
    const records = [
      makeTravelRecord({ id: "tr-001", riskAssessmentCompleted: false, seatbeltUsed: false }),
    ];
    const result = generateTransportTravelArrangementsIntelligence(
      records, [], [], [],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.actions.some((a) => a.includes("risk assessments"))).toBe(true);
    expect(result.actions.some((a) => a.includes("seatbelt"))).toBe(true);
  });

  it("generates actions for vehicle issues", () => {
    const checks = [
      makeVehicleCheck({ motCurrent: false, insuranceCurrent: false, roadworthyCondition: false }),
    ];
    const result = generateTransportTravelArrangementsIntelligence(
      [], checks, [], [],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.actions.some((a) => a.includes("MOT"))).toBe(true);
    expect(result.actions.some((a) => a.includes("insurance"))).toBe(true);
    expect(result.actions.some((a) => a.includes("roadworthy") || a.includes("non-roadworthy"))).toBe(true);
  });

  it("generates actions for staff training gaps", () => {
    const staff = [
      makeStaffTraining({
        drivingAssessment: false,
        childTransportSafety: false,
        firstAidTraining: false,
      }),
    ];
    const result = generateTransportTravelArrangementsIntelligence(
      [], [], [], staff,
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.actions.some((a) => a.includes("driving assessments"))).toBe(true);
    expect(result.actions.some((a) => a.includes("child transport safety"))).toBe(true);
    expect(result.actions.some((a) => a.includes("first aid"))).toBe(true);
  });

  it("includes assessedAt timestamp", () => {
    const result = generateTransportTravelArrangementsIntelligence(
      [], [], [], [],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.assessedAt).toBeDefined();
    expect(typeof result.assessedAt).toBe("string");
    expect(result.assessedAt.length).toBeGreaterThan(0);
  });

  it("generates improvement areas for low journey punctuality", () => {
    const records = [
      makeTravelRecord({ id: "tr-001", journeyOnTime: false }),
      makeTravelRecord({ id: "tr-002", journeyOnTime: false }),
      makeTravelRecord({ id: "tr-003", journeyOnTime: false }),
      makeTravelRecord({ id: "tr-004", journeyOnTime: false }),
      makeTravelRecord({ id: "tr-005", journeyOnTime: true }),
    ];
    const result = generateTransportTravelArrangementsIntelligence(
      records, [], [], [],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.areasForImprovement.some((a) => a.includes("on time"))).toBe(true);
    expect(result.actions.some((a) => a.includes("punctuality"))).toBe(true);
  });

  it("generates improvement area for child consent gaps", () => {
    const policies = [makeTravelPolicy({ childConsentObtained: false })];
    const result = generateTransportTravelArrangementsIntelligence(
      [], [], policies, [],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.areasForImprovement.some((a) => a.includes("consent"))).toBe(true);
    expect(result.actions.some((a) => a.includes("consent"))).toBe(true);
  });

  it("produces no strengths when all data is empty", () => {
    const result = generateTransportTravelArrangementsIntelligence(
      [], [], [], [],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.strengths).toEqual([]);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Oak House Demo Integration
// ══════════════════════════════════════════════════════════════════════════════

describe("Oak House Demo Integration", () => {
  const demoRecords: TravelRecord[] = [
    makeTravelRecord({ id: "tr-001", childId: "child-alex", childName: "Alex", travelType: "school_run", transportMode: "staff_car", driverStaffId: "staff-sarah", driverStaffName: "Sarah Johnson" }),
    makeTravelRecord({ id: "tr-002", childId: "child-jordan", childName: "Jordan", travelType: "contact_visit", transportMode: "minibus", driverStaffId: "staff-tom", driverStaffName: "Tom Richards" }),
    makeTravelRecord({ id: "tr-003", childId: "child-morgan", childName: "Morgan", travelType: "medical_appointment", transportMode: "staff_car", driverStaffId: "staff-lisa", driverStaffName: "Lisa Williams" }),
    makeTravelRecord({ id: "tr-004", childId: "child-alex", childName: "Alex", travelType: "therapy_session", transportMode: "taxi", driverStaffId: "staff-darren", driverStaffName: "Darren Laville" }),
    makeTravelRecord({ id: "tr-005", childId: "child-jordan", childName: "Jordan", travelType: "social_activity", transportMode: "minibus", driverStaffId: "staff-sarah", driverStaffName: "Sarah Johnson" }),
    makeTravelRecord({ id: "tr-006", childId: "child-morgan", childName: "Morgan", travelType: "education_placement", transportMode: "staff_car", driverStaffId: "staff-tom", driverStaffName: "Tom Richards" }),
    makeTravelRecord({ id: "tr-007", childId: "child-alex", childName: "Alex", travelType: "court_hearing", transportMode: "staff_car", driverStaffId: "staff-darren", driverStaffName: "Darren Laville" }),
    makeTravelRecord({ id: "tr-008", childId: "child-jordan", childName: "Jordan", travelType: "school_run", transportMode: "staff_car", driverStaffId: "staff-lisa", driverStaffName: "Lisa Williams" }),
  ];

  const demoChecks: VehicleCheck[] = [
    makeVehicleCheck({ id: "vc-001", vehicleId: "veh-001", vehicleName: "Oak House Minibus" }),
    makeVehicleCheck({ id: "vc-002", vehicleId: "veh-002", vehicleName: "Staff Car — Sarah" }),
    makeVehicleCheck({ id: "vc-003", vehicleId: "veh-003", vehicleName: "Staff Car — Tom" }),
  ];

  const demoPolicies: TravelPolicy[] = [
    makeTravelPolicy({ id: "tp-001" }),
  ];

  const demoStaff: StaffTravelTraining[] = [
    makeStaffTraining({ id: "st-001", staffId: "staff-sarah", staffName: "Sarah Johnson" }),
    makeStaffTraining({ id: "st-002", staffId: "staff-tom", staffName: "Tom Richards" }),
    makeStaffTraining({ id: "st-003", staffId: "staff-lisa", staffName: "Lisa Williams" }),
    makeStaffTraining({ id: "st-004", staffId: "staff-darren", staffName: "Darren Laville" }),
  ];

  it("produces outstanding rating for Oak House demo data", () => {
    const result = generateTransportTravelArrangementsIntelligence(
      demoRecords, demoChecks, demoPolicies, demoStaff,
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.rating).toBe("outstanding");
    expect(result.overallScore).toBe(100);
  });

  it("builds 3 child profiles for Oak House demo", () => {
    const result = generateTransportTravelArrangementsIntelligence(
      demoRecords, demoChecks, demoPolicies, demoStaff,
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.childTravelProfiles).toHaveLength(3);
    const childNames = result.childTravelProfiles.map((p) => p.childName);
    expect(childNames).toContain("Alex");
    expect(childNames).toContain("Jordan");
    expect(childNames).toContain("Morgan");
  });

  it("Oak House demo has no areas for improvement", () => {
    const result = generateTransportTravelArrangementsIntelligence(
      demoRecords, demoChecks, demoPolicies, demoStaff,
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.areasForImprovement).toEqual([]);
  });

  it("Oak House demo has no actions", () => {
    const result = generateTransportTravelArrangementsIntelligence(
      demoRecords, demoChecks, demoPolicies, demoStaff,
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.actions).toEqual([]);
  });

  it("Oak House demo has multiple strengths", () => {
    const result = generateTransportTravelArrangementsIntelligence(
      demoRecords, demoChecks, demoPolicies, demoStaff,
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.strengths.length).toBeGreaterThan(5);
  });
});
