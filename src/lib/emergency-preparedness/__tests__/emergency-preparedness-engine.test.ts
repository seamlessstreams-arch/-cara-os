// ══════════════════════════════════════════════════════════════════════════════
// TESTS — Emergency Preparedness & Business Continuity Intelligence Engine
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateEmergencyPlans,
  evaluateDrillReadiness,
  evaluateBusinessContinuity,
  evaluateLoneWorking,
  evaluateIncidentResponse,
  generateEmergencyPreparednessIntelligence,
} from "../emergency-preparedness-engine";
import type {
  EmergencyPlan,
  EmergencyDrill,
  BusinessContinuityPlan,
  LoneWorkingAssessment,
  EmergencyIncident,
  EmergencyContact,
} from "../emergency-preparedness-engine";

// ── Test Fixtures ──────────────────────────────────────────────────────────

const REFERENCE_DATE = "2026-05-18";
const PERIOD_START = "2026-01-01";
const PERIOD_END = "2026-05-18";

const makeContact = (overrides: Partial<EmergencyContact> = {}): EmergencyContact => ({
  role: "On-call Manager",
  name: "Darren Laville",
  phone: "07700900001",
  available24hr: true,
  ...overrides,
});

const makePlan = (overrides: Partial<EmergencyPlan> = {}): EmergencyPlan => ({
  id: "plan-1",
  homeId: "oak-house",
  emergencyType: "fire",
  planName: "Fire Emergency Plan",
  version: "2.1",
  createdDate: "2025-01-15",
  lastReviewDate: "2026-03-01",
  nextReviewDate: "2026-09-01",
  status: "current",
  approvedBy: "Darren Laville",
  keyActions: ["Activate fire alarm", "Evacuate to assembly point", "Call 999"],
  contactList: [makeContact()],
  staffTrained: true,
  childrenBriefed: true,
  ...overrides,
});

const makeDrill = (overrides: Partial<EmergencyDrill> = {}): EmergencyDrill => ({
  id: "drill-1",
  homeId: "oak-house",
  drillType: "fire_evacuation",
  date: "2026-03-15",
  timeOfDay: "day",
  conductedBy: "Sarah Johnson",
  participantsCount: 7,
  childrenPresent: 4,
  staffPresent: 3,
  evacuationTimeMinutes: 3.5,
  outcome: "successful",
  issuesIdentified: [],
  lessonsLearned: ["Children responded calmly"],
  actionsRequired: [],
  actionsCompleted: true,
  ...overrides,
});

const makeBcPlan = (overrides: Partial<BusinessContinuityPlan> = {}): BusinessContinuityPlan => ({
  id: "bc-1",
  homeId: "oak-house",
  scenarioType: "Staffing crisis",
  lastReviewDate: "2026-02-15",
  nextReviewDate: "2026-08-15",
  status: "current",
  minimumStaffingLevel: 2,
  alternativeAccommodation: true,
  itBackupPlan: true,
  communicationPlan: true,
  supplierAlternatives: true,
  keyDecisionMaker: "Darren Laville",
  ...overrides,
});

const makeLoneWorking = (overrides: Partial<LoneWorkingAssessment> = {}): LoneWorkingAssessment => ({
  id: "lw-1",
  homeId: "oak-house",
  assessmentDate: "2026-02-01",
  assessedBy: "Darren Laville",
  loneWorkingOccurs: true,
  riskLevel: "medium",
  mitigations: ["Buddy system", "Regular check-ins", "Panic alarm"],
  checkInProtocol: true,
  emergencyProcedure: true,
  reviewDate: "2026-08-01",
  ...overrides,
});

const makeIncident = (overrides: Partial<EmergencyIncident> = {}): EmergencyIncident => ({
  id: "inc-1",
  homeId: "oak-house",
  date: "2026-04-10",
  emergencyType: "fire",
  description: "Small kitchen fire contained quickly",
  responseTimeMinutes: 3,
  planFollowed: true,
  notificationsCompleted: ["Fire service", "Ofsted", "Local authority"],
  childrenSafe: true,
  debriefCompleted: true,
  lessonsLearned: ["Kitchen fire blanket effective", "Evacuation route clear"],
  actionsTaken: ["Fire extinguished", "Kitchen isolated", "Children evacuated"],
  ...overrides,
});

// ── Demo Data: Oak House ───────────────────────────────────────────────────

const demoPlans: EmergencyPlan[] = [
  makePlan({ id: "plan-fire", emergencyType: "fire", planName: "Fire Emergency Plan", status: "current", staffTrained: true, childrenBriefed: true }),
  makePlan({ id: "plan-flood", emergencyType: "flood", planName: "Flood Emergency Plan", status: "current", staffTrained: true, childrenBriefed: true }),
  makePlan({ id: "plan-power", emergencyType: "power_failure", planName: "Power Failure Plan", status: "expired", nextReviewDate: "2026-02-01", staffTrained: true, childrenBriefed: false }),
  makePlan({ id: "plan-pandemic", emergencyType: "pandemic", planName: "Pandemic Response Plan", status: "current", staffTrained: true, childrenBriefed: true }),
  makePlan({ id: "plan-staffing", emergencyType: "staffing_crisis", planName: "Staffing Crisis Plan", status: "under_review", staffTrained: false, childrenBriefed: false }),
  makePlan({ id: "plan-security", emergencyType: "security_breach", planName: "Security Breach Plan", status: "current", staffTrained: true, childrenBriefed: true }),
  makePlan({ id: "plan-missing", emergencyType: "missing_child", planName: "Missing Child Protocol", status: "current", staffTrained: true, childrenBriefed: true, contactList: [makeContact(), makeContact({ role: "Police", name: "Local Police", phone: "999", available24hr: true })] }),
  makePlan({ id: "plan-medical", emergencyType: "medical_emergency", planName: "Medical Emergency Plan", status: "draft", staffTrained: false, childrenBriefed: false, contactList: [] }),
];

const demoDrills: EmergencyDrill[] = [
  makeDrill({ id: "drill-1", drillType: "fire_evacuation", date: "2026-01-20", timeOfDay: "day", outcome: "successful", evacuationTimeMinutes: 3.5, actionsRequired: [], actionsCompleted: true, lessonsLearned: ["Smooth evacuation"], issuesIdentified: [] }),
  makeDrill({ id: "drill-2", drillType: "fire_evacuation", date: "2026-03-15", timeOfDay: "evening", outcome: "successful", evacuationTimeMinutes: 4.2, actionsRequired: ["Replace torch batteries"], actionsCompleted: true, lessonsLearned: ["Evening lighting adequate"], issuesIdentified: ["One torch not working"] }),
  makeDrill({ id: "drill-3", drillType: "lockdown", date: "2026-02-10", timeOfDay: "day", outcome: "successful", evacuationTimeMinutes: undefined, actionsRequired: [], actionsCompleted: true, lessonsLearned: ["All rooms secured quickly"], issuesIdentified: [] }),
  makeDrill({ id: "drill-4", drillType: "missing_child", date: "2026-04-05", timeOfDay: "weekend", outcome: "partial_success", evacuationTimeMinutes: undefined, actionsRequired: ["Review search protocol", "Update call tree"], actionsCompleted: false, lessonsLearned: ["Communication delays noted"], issuesIdentified: ["Communication delays", "Unclear search zones"] }),
  makeDrill({ id: "drill-5", drillType: "medical_emergency", date: "2026-04-20", timeOfDay: "night", outcome: "successful", evacuationTimeMinutes: undefined, actionsRequired: [], actionsCompleted: true, lessonsLearned: ["First aid kit fully stocked"], issuesIdentified: [] }),
  makeDrill({ id: "drill-6", drillType: "power_failure", date: "2026-05-01", timeOfDay: "evening", outcome: "failed", evacuationTimeMinutes: undefined, actionsRequired: ["Source backup generator", "Test emergency lighting"], actionsCompleted: false, lessonsLearned: ["Emergency lighting insufficient"], issuesIdentified: ["No backup generator", "Torch locations unknown", "Emergency lighting failed"] }),
];

const demoBcPlans: BusinessContinuityPlan[] = [
  makeBcPlan({ id: "bc-1", scenarioType: "Staffing crisis", status: "current", alternativeAccommodation: true, itBackupPlan: true, communicationPlan: true, supplierAlternatives: true }),
  makeBcPlan({ id: "bc-2", scenarioType: "Premises unavailable", status: "under_review", alternativeAccommodation: true, itBackupPlan: false, communicationPlan: true, supplierAlternatives: false }),
];

const demoLoneWorking: LoneWorkingAssessment[] = [
  makeLoneWorking({ id: "lw-1", riskLevel: "medium", checkInProtocol: true, emergencyProcedure: true, reviewDate: "2026-08-01" }),
  makeLoneWorking({ id: "lw-2", assessedBy: "Sarah Johnson", riskLevel: "low", loneWorkingOccurs: true, checkInProtocol: true, emergencyProcedure: false, reviewDate: "2026-04-01" }),
];

const demoIncidents: EmergencyIncident[] = [
  makeIncident({
    id: "inc-1",
    emergencyType: "fire",
    description: "Small kitchen fire contained quickly",
    responseTimeMinutes: 3,
    planFollowed: true,
    notificationsCompleted: ["Fire service", "Ofsted", "Local authority"],
    childrenSafe: true,
    debriefCompleted: true,
    lessonsLearned: ["Kitchen fire blanket effective"],
  }),
  makeIncident({
    id: "inc-2",
    emergencyType: "power_failure",
    description: "Power outage lasting 6 hours",
    responseTimeMinutes: 15,
    planFollowed: false,
    deviations: "Expired plan was not up to date with current procedures",
    notificationsCompleted: [],
    childrenSafe: true,
    debriefCompleted: false,
    lessonsLearned: [],
    actionsTaken: ["Torches distributed", "Children reassured"],
  }),
];

// ══════════════════════════════════════════════════════════════════════════════
// 1. evaluateEmergencyPlans
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateEmergencyPlans", () => {
  it("returns empty evaluation for no plans", () => {
    const result = evaluateEmergencyPlans([], REFERENCE_DATE);
    expect(result.totalPlans).toBe(0);
    expect(result.coverageRate).toBe(0);
    expect(result.emergencyTypesUncovered).toHaveLength(12);
    expect(result.staffTrainingRate).toBe(0);
    expect(result.childrenBriefingRate).toBe(0);
    expect(result.contactListCompleteness).toBe(0);
  });

  it("calculates correct total plans count", () => {
    const result = evaluateEmergencyPlans(demoPlans, REFERENCE_DATE);
    expect(result.totalPlans).toBe(8);
  });

  it("identifies covered emergency types", () => {
    const result = evaluateEmergencyPlans(demoPlans, REFERENCE_DATE);
    expect(result.emergencyTypesCovered).toContain("fire");
    expect(result.emergencyTypesCovered).toContain("flood");
    expect(result.emergencyTypesCovered).toContain("missing_child");
    expect(result.emergencyTypesCovered).toContain("medical_emergency");
  });

  it("identifies uncovered emergency types", () => {
    const result = evaluateEmergencyPlans(demoPlans, REFERENCE_DATE);
    expect(result.emergencyTypesUncovered).toContain("gas_leak");
    expect(result.emergencyTypesUncovered).toContain("water_failure");
    expect(result.emergencyTypesUncovered).toContain("severe_weather");
    expect(result.emergencyTypesUncovered).toContain("intruder");
  });

  it("calculates coverage rate as percentage of 12 emergency types", () => {
    const result = evaluateEmergencyPlans(demoPlans, REFERENCE_DATE);
    // 8 unique types out of 12
    expect(result.coverageRate).toBe(67);
  });

  it("counts plan statuses correctly", () => {
    const result = evaluateEmergencyPlans(demoPlans, REFERENCE_DATE);
    expect(result.currentPlans).toBe(5);
    expect(result.expiredPlans).toBe(1);
    expect(result.underReviewPlans).toBe(1);
    expect(result.draftPlans).toBe(1);
  });

  it("calculates currency rate (current + under_review)", () => {
    const result = evaluateEmergencyPlans(demoPlans, REFERENCE_DATE);
    // 5 current + 1 under_review = 6 out of 8
    expect(result.currencyRate).toBe(75);
  });

  it("calculates staff training rate", () => {
    const result = evaluateEmergencyPlans(demoPlans, REFERENCE_DATE);
    // 6 out of 8 trained
    expect(result.staffTrainingRate).toBe(75);
  });

  it("calculates children briefing rate", () => {
    const result = evaluateEmergencyPlans(demoPlans, REFERENCE_DATE);
    // 5 out of 8 briefed
    expect(result.childrenBriefingRate).toBe(63);
  });

  it("calculates contact list completeness (plans with 24hr contact)", () => {
    const result = evaluateEmergencyPlans(demoPlans, REFERENCE_DATE);
    // plan-medical has empty contactList = not complete, 7 out of 8
    expect(result.contactListCompleteness).toBe(88);
  });

  it("generates expiry alerts for plans due within 30 days", () => {
    const result = evaluateEmergencyPlans(demoPlans, REFERENCE_DATE);
    // plan-power has nextReviewDate 2026-02-01 which is before 2026-05-18 (already expired)
    expect(result.expiryAlerts.length).toBeGreaterThan(0);
    const powerAlert = result.expiryAlerts.find((a) => a.planId === "plan-power");
    expect(powerAlert).toBeDefined();
    expect(powerAlert!.daysUntilExpiry).toBeLessThan(0);
  });

  it("sorts expiry alerts by days until expiry ascending", () => {
    const result = evaluateEmergencyPlans(demoPlans, REFERENCE_DATE);
    for (let i = 1; i < result.expiryAlerts.length; i++) {
      expect(result.expiryAlerts[i].daysUntilExpiry).toBeGreaterThanOrEqual(
        result.expiryAlerts[i - 1].daysUntilExpiry,
      );
    }
  });

  it("handles single plan correctly", () => {
    const result = evaluateEmergencyPlans([makePlan()], REFERENCE_DATE);
    expect(result.totalPlans).toBe(1);
    expect(result.coverageRate).toBe(8); // 1/12
    expect(result.currencyRate).toBe(100);
    expect(result.staffTrainingRate).toBe(100);
  });

  it("handles all expired plans", () => {
    const expiredPlans = [
      makePlan({ id: "exp-1", status: "expired" }),
      makePlan({ id: "exp-2", status: "expired", emergencyType: "flood" }),
    ];
    const result = evaluateEmergencyPlans(expiredPlans, REFERENCE_DATE);
    expect(result.currencyRate).toBe(0);
    expect(result.expiredPlans).toBe(2);
  });

  it("handles plans with no 24hr contacts", () => {
    const plans = [makePlan({ contactList: [makeContact({ available24hr: false })] })];
    const result = evaluateEmergencyPlans(plans, REFERENCE_DATE);
    expect(result.contactListCompleteness).toBe(0);
  });

  it("handles plans with empty contact lists", () => {
    const plans = [makePlan({ contactList: [] })];
    const result = evaluateEmergencyPlans(plans, REFERENCE_DATE);
    expect(result.contactListCompleteness).toBe(0);
  });

  it("handles duplicate emergency types correctly", () => {
    const plans = [
      makePlan({ id: "p1", emergencyType: "fire" }),
      makePlan({ id: "p2", emergencyType: "fire" }),
    ];
    const result = evaluateEmergencyPlans(plans, REFERENCE_DATE);
    expect(result.emergencyTypesCovered).toHaveLength(1);
    expect(result.coverageRate).toBe(8); // 1/12
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. evaluateDrillReadiness
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateDrillReadiness", () => {
  it("returns empty evaluation for no drills", () => {
    const result = evaluateDrillReadiness([], PERIOD_START, PERIOD_END);
    expect(result.totalDrills).toBe(0);
    expect(result.successRate).toBe(0);
    expect(result.averageEvacuationTimeMinutes).toBeNull();
    expect(result.lessonsLearnedCaptured).toBe(0);
  });

  it("counts total drills within period", () => {
    const result = evaluateDrillReadiness(demoDrills, PERIOD_START, PERIOD_END);
    expect(result.totalDrills).toBe(6);
  });

  it("groups drills by type", () => {
    const result = evaluateDrillReadiness(demoDrills, PERIOD_START, PERIOD_END);
    expect(result.drillsByType["fire_evacuation"]).toBe(2);
    expect(result.drillsByType["lockdown"]).toBe(1);
    expect(result.drillsByType["missing_child"]).toBe(1);
    expect(result.drillsByType["medical_emergency"]).toBe(1);
    expect(result.drillsByType["power_failure"]).toBe(1);
  });

  it("calculates drill frequency per type over period", () => {
    const result = evaluateDrillReadiness(demoDrills, PERIOD_START, PERIOD_END);
    // Period is about 4.6 months, fire_evacuation = 2 drills
    expect(result.drillFrequencyPerType["fire_evacuation"]).toBeGreaterThan(0);
  });

  it("calculates time of day variety", () => {
    const result = evaluateDrillReadiness(demoDrills, PERIOD_START, PERIOD_END);
    expect(result.timeOfDayVariety.day).toBe(2);
    expect(result.timeOfDayVariety.evening).toBe(2);
    expect(result.timeOfDayVariety.night).toBe(1);
    expect(result.timeOfDayVariety.weekend).toBe(1);
    expect(result.timeOfDayVarietyScore).toBe(100); // All 4 time slots covered
  });

  it("calculates success rate", () => {
    const result = evaluateDrillReadiness(demoDrills, PERIOD_START, PERIOD_END);
    // 4 successful out of 6
    expect(result.successRate).toBe(67);
  });

  it("calculates partial success rate", () => {
    const result = evaluateDrillReadiness(demoDrills, PERIOD_START, PERIOD_END);
    // 1 partial out of 6
    expect(result.partialSuccessRate).toBe(17);
  });

  it("calculates failure rate", () => {
    const result = evaluateDrillReadiness(demoDrills, PERIOD_START, PERIOD_END);
    // 1 failed out of 6
    expect(result.failureRate).toBe(17);
  });

  it("calculates average evacuation time from drills that have it", () => {
    const result = evaluateDrillReadiness(demoDrills, PERIOD_START, PERIOD_END);
    // drill-1: 3.5, drill-2: 4.2 => avg = 3.85
    expect(result.averageEvacuationTimeMinutes).toBe(3.9);
  });

  it("calculates actions completion rate", () => {
    const result = evaluateDrillReadiness(demoDrills, PERIOD_START, PERIOD_END);
    // Drills with actions: drill-2 (completed), drill-4 (not completed), drill-6 (not completed)
    // 1 out of 3
    expect(result.actionsCompletionRate).toBe(33);
  });

  it("counts lessons learned captured", () => {
    const result = evaluateDrillReadiness(demoDrills, PERIOD_START, PERIOD_END);
    expect(result.lessonsLearnedCaptured).toBe(6); // All drills have lessons
  });

  it("counts total issues identified", () => {
    const result = evaluateDrillReadiness(demoDrills, PERIOD_START, PERIOD_END);
    // drill-2: 1, drill-4: 2, drill-6: 3 = 6
    expect(result.totalIssuesIdentified).toBe(6);
  });

  it("filters drills outside the period", () => {
    const oldDrill = makeDrill({ id: "old", date: "2025-06-01" });
    const result = evaluateDrillReadiness([oldDrill], PERIOD_START, PERIOD_END);
    expect(result.totalDrills).toBe(0);
  });

  it("returns 100% actions completion when no actions required", () => {
    const drill = makeDrill({ actionsRequired: [], actionsCompleted: true });
    const result = evaluateDrillReadiness([drill], PERIOD_START, PERIOD_END);
    expect(result.actionsCompletionRate).toBe(100);
  });

  it("returns null average evacuation time when no drills have it", () => {
    const drill = makeDrill({ evacuationTimeMinutes: undefined });
    const result = evaluateDrillReadiness([drill], PERIOD_START, PERIOD_END);
    expect(result.averageEvacuationTimeMinutes).toBeNull();
  });

  it("handles single time of day correctly", () => {
    const drills = [makeDrill({ timeOfDay: "night" })];
    const result = evaluateDrillReadiness(drills, PERIOD_START, PERIOD_END);
    expect(result.timeOfDayVarietyScore).toBe(25); // 1 of 4
  });

  it("handles all drills successful", () => {
    const drills = [
      makeDrill({ id: "d1", outcome: "successful" }),
      makeDrill({ id: "d2", outcome: "successful", date: "2026-02-01" }),
    ];
    const result = evaluateDrillReadiness(drills, PERIOD_START, PERIOD_END);
    expect(result.successRate).toBe(100);
    expect(result.failureRate).toBe(0);
  });

  it("handles all drills failed", () => {
    const drills = [
      makeDrill({ id: "d1", outcome: "failed" }),
      makeDrill({ id: "d2", outcome: "failed", date: "2026-02-01" }),
    ];
    const result = evaluateDrillReadiness(drills, PERIOD_START, PERIOD_END);
    expect(result.successRate).toBe(0);
    expect(result.failureRate).toBe(100);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. evaluateBusinessContinuity
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateBusinessContinuity", () => {
  it("returns empty evaluation for no plans", () => {
    const result = evaluateBusinessContinuity([], REFERENCE_DATE);
    expect(result.totalPlans).toBe(0);
    expect(result.coverageRate).toBe(0);
    expect(result.itBackupRate).toBe(0);
  });

  it("counts total BC plans", () => {
    const result = evaluateBusinessContinuity(demoBcPlans, REFERENCE_DATE);
    expect(result.totalPlans).toBe(2);
  });

  it("counts current plans (current + under_review)", () => {
    const result = evaluateBusinessContinuity(demoBcPlans, REFERENCE_DATE);
    expect(result.currentPlans).toBe(2); // Both current and under_review count
  });

  it("calculates coverage rate", () => {
    const result = evaluateBusinessContinuity(demoBcPlans, REFERENCE_DATE);
    expect(result.coverageRate).toBe(100);
  });

  it("calculates currency rate", () => {
    const result = evaluateBusinessContinuity(demoBcPlans, REFERENCE_DATE);
    expect(result.currencyRate).toBe(100);
  });

  it("counts minimum staffing documented", () => {
    const result = evaluateBusinessContinuity(demoBcPlans, REFERENCE_DATE);
    expect(result.minimumStaffingDocumented).toBe(2);
  });

  it("counts alternative accommodation arranged", () => {
    const result = evaluateBusinessContinuity(demoBcPlans, REFERENCE_DATE);
    expect(result.alternativeAccommodationArranged).toBe(2);
  });

  it("calculates IT backup rate", () => {
    const result = evaluateBusinessContinuity(demoBcPlans, REFERENCE_DATE);
    // 1 out of 2
    expect(result.itBackupRate).toBe(50);
  });

  it("calculates communication plan rate", () => {
    const result = evaluateBusinessContinuity(demoBcPlans, REFERENCE_DATE);
    // Both have communication plans
    expect(result.communicationPlanRate).toBe(100);
  });

  it("calculates supplier alternatives rate", () => {
    const result = evaluateBusinessContinuity(demoBcPlans, REFERENCE_DATE);
    // 1 out of 2
    expect(result.supplierAlternativesRate).toBe(50);
  });

  it("handles all expired BC plans", () => {
    const plans = [
      makeBcPlan({ id: "bc-exp", status: "expired" }),
    ];
    const result = evaluateBusinessContinuity(plans, REFERENCE_DATE);
    expect(result.currentPlans).toBe(0);
    expect(result.currencyRate).toBe(0);
  });

  it("handles single fully equipped plan", () => {
    const plans = [makeBcPlan()];
    const result = evaluateBusinessContinuity(plans, REFERENCE_DATE);
    expect(result.itBackupRate).toBe(100);
    expect(result.communicationPlanRate).toBe(100);
    expect(result.supplierAlternativesRate).toBe(100);
  });

  it("handles plan with no provisions", () => {
    const plans = [makeBcPlan({
      minimumStaffingLevel: 0,
      alternativeAccommodation: false,
      itBackupPlan: false,
      communicationPlan: false,
      supplierAlternatives: false,
    })];
    const result = evaluateBusinessContinuity(plans, REFERENCE_DATE);
    expect(result.minimumStaffingDocumented).toBe(0);
    expect(result.alternativeAccommodationArranged).toBe(0);
    expect(result.itBackupRate).toBe(0);
    expect(result.communicationPlanRate).toBe(0);
    expect(result.supplierAlternativesRate).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. evaluateLoneWorking
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateLoneWorking", () => {
  it("returns empty evaluation for no assessments", () => {
    const result = evaluateLoneWorking([], REFERENCE_DATE);
    expect(result.totalAssessments).toBe(0);
    expect(result.loneWorkingOccurs).toBe(false);
    expect(result.currencyRate).toBe(0);
    expect(result.checkInProtocolRate).toBe(0);
    expect(result.emergencyProcedureRate).toBe(0);
  });

  it("counts total assessments", () => {
    const result = evaluateLoneWorking(demoLoneWorking, REFERENCE_DATE);
    expect(result.totalAssessments).toBe(2);
  });

  it("identifies current assessments by review date", () => {
    const result = evaluateLoneWorking(demoLoneWorking, REFERENCE_DATE);
    // lw-1 reviewDate 2026-08-01 >= 2026-05-18 = current
    // lw-2 reviewDate 2026-04-01 < 2026-05-18 = expired
    expect(result.currentAssessments).toBe(1);
  });

  it("calculates currency rate", () => {
    const result = evaluateLoneWorking(demoLoneWorking, REFERENCE_DATE);
    // 1 out of 2
    expect(result.currencyRate).toBe(50);
  });

  it("detects lone working occurs", () => {
    const result = evaluateLoneWorking(demoLoneWorking, REFERENCE_DATE);
    expect(result.loneWorkingOccurs).toBe(true);
  });

  it("detects lone working does not occur", () => {
    const assessments = [makeLoneWorking({ loneWorkingOccurs: false })];
    const result = evaluateLoneWorking(assessments, REFERENCE_DATE);
    expect(result.loneWorkingOccurs).toBe(false);
  });

  it("categorises risk levels", () => {
    const result = evaluateLoneWorking(demoLoneWorking, REFERENCE_DATE);
    expect(result.riskLevels.low).toBe(1);
    expect(result.riskLevels.medium).toBe(1);
    expect(result.riskLevels.high).toBe(0);
  });

  it("counts mitigations in place", () => {
    const result = evaluateLoneWorking(demoLoneWorking, REFERENCE_DATE);
    expect(result.mitigationInPlace).toBe(2); // Both have mitigations
  });

  it("calculates check-in protocol rate", () => {
    const result = evaluateLoneWorking(demoLoneWorking, REFERENCE_DATE);
    // Both have check-in protocol
    expect(result.checkInProtocolRate).toBe(100);
  });

  it("calculates emergency procedure rate", () => {
    const result = evaluateLoneWorking(demoLoneWorking, REFERENCE_DATE);
    // 1 out of 2
    expect(result.emergencyProcedureRate).toBe(50);
  });

  it("handles assessment with no mitigations", () => {
    const assessments = [makeLoneWorking({ mitigations: [] })];
    const result = evaluateLoneWorking(assessments, REFERENCE_DATE);
    expect(result.mitigationInPlace).toBe(0);
  });

  it("handles all high risk assessments", () => {
    const assessments = [
      makeLoneWorking({ id: "lw-a", riskLevel: "high" }),
      makeLoneWorking({ id: "lw-b", riskLevel: "high" }),
    ];
    const result = evaluateLoneWorking(assessments, REFERENCE_DATE);
    expect(result.riskLevels.high).toBe(2);
    expect(result.riskLevels.low).toBe(0);
  });

  it("handles all current assessments", () => {
    const assessments = [
      makeLoneWorking({ id: "lw-a", reviewDate: "2026-12-01" }),
      makeLoneWorking({ id: "lw-b", reviewDate: "2026-12-01" }),
    ];
    const result = evaluateLoneWorking(assessments, REFERENCE_DATE);
    expect(result.currencyRate).toBe(100);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. evaluateIncidentResponse
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateIncidentResponse", () => {
  it("returns empty evaluation for no incidents", () => {
    const result = evaluateIncidentResponse([]);
    expect(result.totalIncidents).toBe(0);
    expect(result.averageResponseTimeMinutes).toBeNull();
    expect(result.planAdherenceRate).toBe(0);
    expect(result.childrenSafeRate).toBe(0);
    expect(result.debriefRate).toBe(0);
    expect(result.lessonsLearnedCaptured).toBe(0);
  });

  it("counts total incidents", () => {
    const result = evaluateIncidentResponse(demoIncidents);
    expect(result.totalIncidents).toBe(2);
  });

  it("calculates average response time", () => {
    const result = evaluateIncidentResponse(demoIncidents);
    // (3 + 15) / 2 = 9
    expect(result.averageResponseTimeMinutes).toBe(9);
  });

  it("calculates plan adherence rate", () => {
    const result = evaluateIncidentResponse(demoIncidents);
    // 1 out of 2
    expect(result.planAdherenceRate).toBe(50);
  });

  it("calculates notification completeness rate", () => {
    const result = evaluateIncidentResponse(demoIncidents);
    // inc-1 has notifications, inc-2 has empty array
    // 1 out of 2
    expect(result.notificationCompletenessRate).toBe(50);
  });

  it("calculates children safe rate", () => {
    const result = evaluateIncidentResponse(demoIncidents);
    // Both incidents: children safe
    expect(result.childrenSafeRate).toBe(100);
  });

  it("calculates debrief rate", () => {
    const result = evaluateIncidentResponse(demoIncidents);
    // 1 out of 2
    expect(result.debriefRate).toBe(50);
  });

  it("counts lessons learned captured", () => {
    const result = evaluateIncidentResponse(demoIncidents);
    // inc-1 has lessons, inc-2 has none
    expect(result.lessonsLearnedCaptured).toBe(1);
  });

  it("groups incidents by type", () => {
    const result = evaluateIncidentResponse(demoIncidents);
    expect(result.incidentsByType["fire"]).toBe(1);
    expect(result.incidentsByType["power_failure"]).toBe(1);
  });

  it("handles single well-handled incident", () => {
    const result = evaluateIncidentResponse([demoIncidents[0]]);
    expect(result.planAdherenceRate).toBe(100);
    expect(result.childrenSafeRate).toBe(100);
    expect(result.debriefRate).toBe(100);
  });

  it("handles single poorly-handled incident", () => {
    const result = evaluateIncidentResponse([demoIncidents[1]]);
    expect(result.planAdherenceRate).toBe(0);
    expect(result.debriefRate).toBe(0);
    expect(result.notificationCompletenessRate).toBe(0);
  });

  it("handles incident where children not safe", () => {
    const incident = makeIncident({ childrenSafe: false });
    const result = evaluateIncidentResponse([incident]);
    expect(result.childrenSafeRate).toBe(0);
  });

  it("handles multiple incidents of same type", () => {
    const incidents = [
      makeIncident({ id: "inc-a", emergencyType: "fire" }),
      makeIncident({ id: "inc-b", emergencyType: "fire" }),
    ];
    const result = evaluateIncidentResponse(incidents);
    expect(result.incidentsByType["fire"]).toBe(2);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. generateEmergencyPreparednessIntelligence — Full Integration
// ══════════════════════════════════════════════════════════════════════════════

describe("generateEmergencyPreparednessIntelligence", () => {
  const generate = () =>
    generateEmergencyPreparednessIntelligence(
      demoPlans,
      demoDrills,
      demoBcPlans,
      demoLoneWorking,
      demoIncidents,
      "oak-house",
      PERIOD_START,
      PERIOD_END,
      REFERENCE_DATE,
    );

  it("returns correct homeId", () => {
    const result = generate();
    expect(result.homeId).toBe("oak-house");
  });

  it("returns assessedAt matching reference date", () => {
    const result = generate();
    expect(result.assessedAt).toBe(REFERENCE_DATE);
  });

  it("returns period start and end", () => {
    const result = generate();
    expect(result.periodStart).toBe(PERIOD_START);
    expect(result.periodEnd).toBe(PERIOD_END);
  });

  it("calculates overall score between 0 and 100", () => {
    const result = generate();
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("returns a valid rating", () => {
    const result = generate();
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(
      result.rating,
    );
  });

  it("includes emergency plan evaluation", () => {
    const result = generate();
    expect(result.emergencyPlans.totalPlans).toBe(8);
    expect(result.emergencyPlans.coverageRate).toBeGreaterThan(0);
  });

  it("includes drill readiness evaluation", () => {
    const result = generate();
    expect(result.drillReadiness.totalDrills).toBe(6);
    expect(result.drillReadiness.successRate).toBeGreaterThan(0);
  });

  it("includes business continuity evaluation", () => {
    const result = generate();
    expect(result.businessContinuity.totalPlans).toBe(2);
  });

  it("includes lone working evaluation", () => {
    const result = generate();
    expect(result.loneWorking.totalAssessments).toBe(2);
    expect(result.loneWorking.loneWorkingOccurs).toBe(true);
  });

  it("includes incident response evaluation", () => {
    const result = generate();
    expect(result.incidentResponse.totalIncidents).toBe(2);
  });

  it("generates strengths array", () => {
    const result = generate();
    expect(Array.isArray(result.strengths)).toBe(true);
  });

  it("generates areas for improvement array", () => {
    const result = generate();
    expect(Array.isArray(result.areasForImprovement)).toBe(true);
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("generates actions array", () => {
    const result = generate();
    expect(Array.isArray(result.actions)).toBe(true);
    expect(result.actions.length).toBeGreaterThan(0);
  });

  it("generates regulatory links", () => {
    const result = generate();
    expect(result.regulatoryLinks.length).toBeGreaterThan(0);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015, Reg 25"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015, Reg 40"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Health and Safety at Work Act 1974"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Fire Safety"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Civil Contingencies Act 2004"))).toBe(true);
  });

  it("identifies expired plan as area for improvement", () => {
    const result = generate();
    expect(result.areasForImprovement.some((a) => a.includes("expired"))).toBe(true);
  });

  it("identifies drill failure as area for improvement", () => {
    const result = generate();
    expect(result.areasForImprovement.some((a) => a.includes("failure rate") || a.includes("failed"))).toBe(true);
  });

  it("identifies uncovered emergency types as action", () => {
    const result = generate();
    expect(result.actions.some((a) => a.includes("uncovered"))).toBe(true);
  });

  it("identifies incomplete drill actions as action", () => {
    const result = generate();
    expect(result.actions.some((a) => a.includes("outstanding actions") || a.includes("drill"))).toBe(true);
  });

  // ── Scoring Boundary Tests ──────────────────────────────────────────────

  it("rates outstanding when score >= 80", () => {
    const perfectPlans = ALL_EMERGENCY_TYPES_PLANS();
    const perfectDrills = perfectDrillSet();
    const perfectBc = [makeBcPlan({ id: "bc-1" }), makeBcPlan({ id: "bc-2" })];
    const perfectLw = [makeLoneWorking({ id: "lw-1", reviewDate: "2026-12-01" }), makeLoneWorking({ id: "lw-2", reviewDate: "2026-12-01" })];
    const perfectInc = [makeIncident({ id: "inc-1", responseTimeMinutes: 3 })];

    const result = generateEmergencyPreparednessIntelligence(
      perfectPlans, perfectDrills, perfectBc, perfectLw, perfectInc,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.rating).toBe("outstanding");
  });

  it("rates inadequate when everything is empty/poor", () => {
    const result = generateEmergencyPreparednessIntelligence(
      [], [], [], [], [],
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.overallScore).toBeLessThan(40);
    expect(result.rating).toBe("inadequate");
  });

  it("score never exceeds 100", () => {
    const perfectPlans = ALL_EMERGENCY_TYPES_PLANS();
    const perfectDrills = perfectDrillSet();
    const perfectBc = [makeBcPlan(), makeBcPlan({ id: "bc-2" })];
    const perfectLw = [makeLoneWorking({ reviewDate: "2026-12-01" }), makeLoneWorking({ id: "lw-2", reviewDate: "2026-12-01" })];
    const perfectInc = [makeIncident()];

    const result = generateEmergencyPreparednessIntelligence(
      perfectPlans, perfectDrills, perfectBc, perfectLw, perfectInc,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("score never goes below 0", () => {
    const result = generateEmergencyPreparednessIntelligence(
      [], [], [], [], [],
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  // ── Edge Cases ──────────────────────────────────────────────────────────

  it("handles no incidents gracefully with neutral IR score", () => {
    const result = generateEmergencyPreparednessIntelligence(
      demoPlans, demoDrills, demoBcPlans, demoLoneWorking, [],
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    // With no incidents the IR subscore is neutral (9 points)
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.incidentResponse.totalIncidents).toBe(0);
  });

  it("handles no drills in period", () => {
    const result = generateEmergencyPreparednessIntelligence(
      demoPlans, [], demoBcPlans, demoLoneWorking, demoIncidents,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.drillReadiness.totalDrills).toBe(0);
    expect(result.areasForImprovement.some((a) => a.includes("No emergency drills"))).toBe(true);
  });

  it("handles no BC plans", () => {
    const result = generateEmergencyPreparednessIntelligence(
      demoPlans, demoDrills, [], demoLoneWorking, demoIncidents,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.businessContinuity.totalPlans).toBe(0);
    expect(result.areasForImprovement.some((a) => a.includes("No business continuity"))).toBe(true);
  });

  it("handles no lone working assessments", () => {
    const result = generateEmergencyPreparednessIntelligence(
      demoPlans, demoDrills, demoBcPlans, [], demoIncidents,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.loneWorking.totalAssessments).toBe(0);
    expect(result.areasForImprovement.some((a) => a.includes("No lone working"))).toBe(true);
  });

  it("handles only expired emergency plans", () => {
    const expiredPlans = [
      makePlan({ id: "e1", status: "expired", emergencyType: "fire" }),
      makePlan({ id: "e2", status: "expired", emergencyType: "flood" }),
    ];
    const result = generateEmergencyPreparednessIntelligence(
      expiredPlans, demoDrills, demoBcPlans, demoLoneWorking, demoIncidents,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.emergencyPlans.currencyRate).toBe(0);
  });

  it("includes children briefing gap as area for improvement when applicable", () => {
    const result = generate();
    expect(result.areasForImprovement.some((a) => a.includes("briefed"))).toBe(true);
  });

  it("includes debrief gap as area for improvement", () => {
    const result = generate();
    expect(result.areasForImprovement.some((a) => a.includes("Debrief") || a.includes("debrief"))).toBe(true);
  });

  it("includes plan adherence gap as area for improvement", () => {
    const result = generate();
    expect(result.areasForImprovement.some((a) => a.includes("not consistently followed") || a.includes("adherence"))).toBe(true);
  });

  it("children safe strength when 100%", () => {
    const result = generate();
    // Both demo incidents have childrenSafe true
    expect(result.strengths.some((s) => s.includes("safe"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Helper factories for scoring boundary tests
// ══════════════════════════════════════════════════════════════════════════════

function ALL_EMERGENCY_TYPES_PLANS(): EmergencyPlan[] {
  const types: Array<EmergencyPlan["emergencyType"]> = [
    "fire", "flood", "gas_leak", "power_failure", "water_failure",
    "pandemic", "staffing_crisis", "security_breach", "severe_weather",
    "missing_child", "intruder", "medical_emergency",
  ];
  return types.map((t, i) =>
    makePlan({
      id: `plan-${i}`,
      emergencyType: t,
      planName: `${t} Plan`,
      status: "current",
      staffTrained: true,
      childrenBriefed: true,
    }),
  );
}

function perfectDrillSet(): EmergencyDrill[] {
  return [
    makeDrill({ id: "pd-1", drillType: "fire_evacuation", date: "2026-01-10", timeOfDay: "day", outcome: "successful" }),
    makeDrill({ id: "pd-2", drillType: "lockdown", date: "2026-02-10", timeOfDay: "evening", outcome: "successful" }),
    makeDrill({ id: "pd-3", drillType: "missing_child", date: "2026-03-10", timeOfDay: "night", outcome: "successful" }),
    makeDrill({ id: "pd-4", drillType: "medical_emergency", date: "2026-04-10", timeOfDay: "weekend", outcome: "successful" }),
    makeDrill({ id: "pd-5", drillType: "fire_evacuation", date: "2026-05-01", timeOfDay: "evening", outcome: "successful" }),
    makeDrill({ id: "pd-6", drillType: "power_failure", date: "2026-05-10", timeOfDay: "night", outcome: "successful" }),
  ];
}
