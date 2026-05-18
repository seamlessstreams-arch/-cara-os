// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Physical Health Monitoring Intelligence — Engine Tests
//
// Covers all 7 core functions, scoring logic, and edge cases.
// Demo data: Oak House — Alex (14), Jordan (13), Morgan (15)
// Staff: Sarah Johnson (RM), Tom Richards (RSW), Lisa Williams (Senior RSW),
//        Darren Laville (RM)
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateAppointments,
  evaluateAssessments,
  evaluateHealthNeeds,
  evaluateHealthPromotion,
  evaluateImmunisations,
  buildChildHealthProfiles,
  generatePhysicalHealthIntelligence,
  getAppointmentTypeLabel,
  getHealthNeedCategoryLabel,
  getHealthPromotionTopicLabel,
} from "../physical-health-monitoring-engine";
import type {
  HealthAppointment,
  HealthAssessment,
  HealthNeed,
  HealthPromotion,
  ImmunisationRecord,
} from "../physical-health-monitoring-engine";

// ── Constants ──────────────────────────────────────────────────────────────

const PERIOD_START = "2025-01-01";
const PERIOD_END = "2025-06-30";
const REFERENCE_DATE = "2025-06-01";
const HOME_ID = "oak-house";
const CHILD_IDS = ["child-alex", "child-jordan", "child-morgan"];

// ── Factories ──────────────────────────────────────────────────────────────

let _id = 0;
function nextId(prefix = "rec"): string { return `${prefix}-${++_id}`; }

function makeAppointment(overrides: Partial<HealthAppointment> = {}): HealthAppointment {
  return {
    id: nextId("appt"),
    homeId: HOME_ID,
    childId: "child-alex",
    childName: "Alex",
    appointmentDate: "2025-03-15",
    appointmentType: "gp_consultation",
    provider: "Oak Hill Surgery",
    status: "attended",
    accompaniedBy: "Sarah Johnson",
    consentStatus: "gillick_competent",
    outcome: "Routine check, all clear",
    followUpRequired: false,
    healthActionPlanUpdated: true,
    ...overrides,
  };
}

function makeAssessment(overrides: Partial<HealthAssessment> = {}): HealthAssessment {
  return {
    id: nextId("ha"),
    homeId: HOME_ID,
    childId: "child-alex",
    childName: "Alex",
    assessmentType: "review",
    assessmentDate: "2025-03-01",
    assessor: "Dr Smith",
    dueDate: "2025-03-15",
    completedOnTime: true,
    healthNeedsIdentified: ["Asthma management"],
    actionPlanCreated: true,
    childParticipated: true,
    sharedWithCarers: true,
    nextDueDate: "2025-09-01",
    ...overrides,
  };
}

function makeHealthNeed(overrides: Partial<HealthNeed> = {}): HealthNeed {
  return {
    id: nextId("hn"),
    homeId: HOME_ID,
    childId: "child-alex",
    childName: "Alex",
    category: "chronic_condition",
    description: "Mild asthma",
    identifiedDate: "2024-06-01",
    managementPlan: true,
    managementPlanReviewDate: "2025-06-01",
    currentlyManaged: true,
    medicationRequired: true,
    specialistInvolved: true,
    specialistName: "Respiratory Nurse",
    lastReviewDate: "2025-03-01",
    status: "active",
    ...overrides,
  };
}

function makePromotion(overrides: Partial<HealthPromotion> = {}): HealthPromotion {
  return {
    id: nextId("hp"),
    homeId: HOME_ID,
    childId: "child-alex",
    childName: "Alex",
    date: "2025-04-01",
    topic: "healthy_eating",
    deliveredBy: "Sarah Johnson",
    format: "one_to_one",
    childEngagement: 7,
    followUpPlanned: true,
    ...overrides,
  };
}

function makeImmunisation(overrides: Partial<ImmunisationRecord> = {}): ImmunisationRecord {
  return {
    id: nextId("imm"),
    homeId: HOME_ID,
    childId: "child-alex",
    childName: "Alex",
    immunisationType: "Td/IPV Booster",
    dueDate: "2025-01-15",
    administeredDate: "2025-01-20",
    status: "up_to_date",
    consentObtained: true,
    ...overrides,
  };
}

// ── Demo Data ──────────────────────────────────────────────────────────────

function demoAppointments(): HealthAppointment[] {
  return [
    // Alex — GP, dental, optician, specialist
    makeAppointment({ childId: "child-alex", childName: "Alex", appointmentDate: "2025-01-10", appointmentType: "gp_registration", status: "attended", followUpRequired: false, healthActionPlanUpdated: false }),
    makeAppointment({ childId: "child-alex", childName: "Alex", appointmentDate: "2025-02-15", appointmentType: "dental_check", status: "attended", followUpRequired: false, healthActionPlanUpdated: true }),
    makeAppointment({ childId: "child-alex", childName: "Alex", appointmentDate: "2025-03-01", appointmentType: "specialist_referral", provider: "Respiratory Clinic", status: "attended", followUpRequired: true, followUpBooked: true, healthActionPlanUpdated: true }),
    makeAppointment({ childId: "child-alex", childName: "Alex", appointmentDate: "2025-04-10", appointmentType: "gp_consultation", status: "attended", followUpRequired: false, healthActionPlanUpdated: true }),
    makeAppointment({ childId: "child-alex", childName: "Alex", appointmentDate: "2025-05-01", appointmentType: "optician", status: "attended", followUpRequired: false, healthActionPlanUpdated: false }),
    // Jordan — excellent attendance
    makeAppointment({ childId: "child-jordan", childName: "Jordan", appointmentDate: "2025-01-15", appointmentType: "gp_consultation", status: "attended", followUpRequired: false, healthActionPlanUpdated: true }),
    makeAppointment({ childId: "child-jordan", childName: "Jordan", appointmentDate: "2025-02-20", appointmentType: "dental_check", status: "attended", followUpRequired: false, healthActionPlanUpdated: true }),
    makeAppointment({ childId: "child-jordan", childName: "Jordan", appointmentDate: "2025-04-15", appointmentType: "optician", status: "attended", followUpRequired: false, healthActionPlanUpdated: true }),
    // Morgan — some missed/refused
    makeAppointment({ childId: "child-morgan", childName: "Morgan", appointmentDate: "2025-01-20", appointmentType: "gp_consultation", status: "attended", followUpRequired: true, followUpBooked: true, healthActionPlanUpdated: true }),
    makeAppointment({ childId: "child-morgan", childName: "Morgan", appointmentDate: "2025-02-25", appointmentType: "dental_check", status: "child_refused", followUpRequired: false, healthActionPlanUpdated: false }),
    makeAppointment({ childId: "child-morgan", childName: "Morgan", appointmentDate: "2025-03-15", appointmentType: "specialist_referral", provider: "CAMHS", status: "attended", followUpRequired: true, followUpBooked: true, healthActionPlanUpdated: true }),
    makeAppointment({ childId: "child-morgan", childName: "Morgan", appointmentDate: "2025-04-20", appointmentType: "optician", status: "missed", followUpRequired: false, healthActionPlanUpdated: false }),
  ];
}

function demoAssessments(): HealthAssessment[] {
  return [
    makeAssessment({ childId: "child-alex", childName: "Alex", assessmentType: "initial", assessmentDate: "2024-09-15", dueDate: "2024-10-01", completedOnTime: true, childParticipated: true, sharedWithCarers: true }),
    makeAssessment({ childId: "child-alex", childName: "Alex", assessmentType: "review", assessmentDate: "2025-03-15", dueDate: "2025-03-31", completedOnTime: true, childParticipated: true, sharedWithCarers: true }),
    makeAssessment({ childId: "child-jordan", childName: "Jordan", assessmentType: "initial", assessmentDate: "2024-10-01", dueDate: "2024-10-15", completedOnTime: true, childParticipated: true, sharedWithCarers: true }),
    makeAssessment({ childId: "child-jordan", childName: "Jordan", assessmentType: "review", assessmentDate: "2025-04-01", dueDate: "2025-04-15", completedOnTime: true, childParticipated: true, sharedWithCarers: true }),
    makeAssessment({ childId: "child-morgan", childName: "Morgan", assessmentType: "initial", assessmentDate: "2024-11-01", dueDate: "2024-11-15", completedOnTime: true, childParticipated: false, sharedWithCarers: true }),
    makeAssessment({ childId: "child-morgan", childName: "Morgan", assessmentType: "review", assessmentDate: "2025-05-01", dueDate: "2025-04-15", completedOnTime: false, childParticipated: true, sharedWithCarers: true }),
  ];
}

function demoHealthNeeds(): HealthNeed[] {
  return [
    makeHealthNeed({ childId: "child-alex", childName: "Alex", category: "chronic_condition", description: "Mild asthma", status: "active", managementPlan: true, currentlyManaged: true, specialistInvolved: true }),
    makeHealthNeed({ childId: "child-alex", childName: "Alex", category: "allergy", description: "Nut allergy", status: "active", managementPlan: true, currentlyManaged: true, specialistInvolved: false }),
    makeHealthNeed({ childId: "child-morgan", childName: "Morgan", category: "dental", description: "Requires dental treatment", status: "active", managementPlan: false, currentlyManaged: false, specialistInvolved: false }),
    makeHealthNeed({ childId: "child-morgan", childName: "Morgan", category: "vision", description: "Short-sighted", status: "active", managementPlan: true, currentlyManaged: true, specialistInvolved: true, specialistName: "Optometrist" }),
    makeHealthNeed({ childId: "child-jordan", childName: "Jordan", category: "acute_illness", description: "Previous ear infection", status: "resolved", managementPlan: false, currentlyManaged: false, specialistInvolved: false }),
  ];
}

function demoPromotion(): HealthPromotion[] {
  return [
    makePromotion({ childId: "child-alex", childName: "Alex", topic: "healthy_eating", childEngagement: 7 }),
    makePromotion({ childId: "child-alex", childName: "Alex", topic: "exercise", date: "2025-04-15", childEngagement: 8 }),
    makePromotion({ childId: "child-alex", childName: "Alex", topic: "substance_awareness", date: "2025-05-01", childEngagement: 6 }),
    makePromotion({ childId: "child-jordan", childName: "Jordan", topic: "healthy_eating", childEngagement: 8 }),
    makePromotion({ childId: "child-jordan", childName: "Jordan", topic: "exercise", date: "2025-04-15", childEngagement: 9 }),
    makePromotion({ childId: "child-jordan", childName: "Jordan", topic: "dental_hygiene", date: "2025-05-10", childEngagement: 7 }),
    makePromotion({ childId: "child-jordan", childName: "Jordan", topic: "personal_hygiene", date: "2025-05-20", childEngagement: 8 }),
    makePromotion({ childId: "child-morgan", childName: "Morgan", topic: "healthy_eating", childEngagement: 5 }),
    makePromotion({ childId: "child-morgan", childName: "Morgan", topic: "sleep_hygiene", date: "2025-04-20", childEngagement: 6 }),
    makePromotion({ childId: "child-morgan", childName: "Morgan", topic: "mental_health_awareness", date: "2025-05-15", childEngagement: 7 }),
  ];
}

function demoImmunisations(): ImmunisationRecord[] {
  return [
    makeImmunisation({ childId: "child-alex", childName: "Alex", immunisationType: "Td/IPV Booster", status: "up_to_date", administeredDate: "2025-01-20" }),
    makeImmunisation({ childId: "child-alex", childName: "Alex", immunisationType: "MenACWY", status: "up_to_date", administeredDate: "2025-01-20" }),
    makeImmunisation({ childId: "child-jordan", childName: "Jordan", immunisationType: "HPV Dose 1", status: "up_to_date", administeredDate: "2025-02-10" }),
    makeImmunisation({ childId: "child-jordan", childName: "Jordan", immunisationType: "HPV Dose 2", status: "pending", dueDate: "2025-08-10" }),
    makeImmunisation({ childId: "child-morgan", childName: "Morgan", immunisationType: "Td/IPV Booster", status: "overdue", dueDate: "2025-01-15" }),
    makeImmunisation({ childId: "child-morgan", childName: "Morgan", immunisationType: "MenACWY", status: "up_to_date", administeredDate: "2025-02-01" }),
  ];
}

// ══════════════════════════════════════════════════════════════════════════════
// Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateAppointments", () => {
  it("counts total appointments", () => {
    const result = evaluateAppointments(demoAppointments());
    expect(result.totalAppointments).toBe(12);
  });

  it("calculates attendance rate", () => {
    const result = evaluateAppointments(demoAppointments());
    // 10 attended out of 12
    expect(result.attendanceRate).toBeCloseTo(83.3, 0);
  });

  it("calculates missed rate", () => {
    const result = evaluateAppointments(demoAppointments());
    // 1 missed out of 12
    expect(result.missedRate).toBeCloseTo(8.3, 0);
  });

  it("calculates child refused rate", () => {
    const result = evaluateAppointments(demoAppointments());
    // 1 refused out of 12
    expect(result.childRefusedRate).toBeCloseTo(8.3, 0);
  });

  it("calculates follow-up booked rate", () => {
    const result = evaluateAppointments(demoAppointments());
    // 3 need follow-up, all 3 booked
    expect(result.followUpBookedRate).toBe(100);
  });

  it("calculates health plan updated rate", () => {
    const result = evaluateAppointments(demoAppointments());
    // Of 10 attended: 8 updated
    expect(result.healthPlanUpdatedRate).toBe(80);
  });

  it("tracks type breakdown", () => {
    const result = evaluateAppointments(demoAppointments());
    expect(result.typeBreakdown["gp_consultation"]).toBe(3);
    expect(result.typeBreakdown["dental_check"]).toBe(3);
  });

  it("tracks status breakdown", () => {
    const result = evaluateAppointments(demoAppointments());
    expect(result.statusBreakdown["attended"]).toBe(10);
    expect(result.statusBreakdown["missed"]).toBe(1);
    expect(result.statusBreakdown["child_refused"]).toBe(1);
  });

  it("produces positive score", () => {
    const result = evaluateAppointments(demoAppointments());
    expect(result.overallScore).toBeGreaterThan(50);
  });

  it("returns zero with empty data", () => {
    const result = evaluateAppointments([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalAppointments).toBe(0);
  });

  it("gives 100% follow-up when none needed", () => {
    const noFollowUp = [makeAppointment({ followUpRequired: false })];
    const result = evaluateAppointments(noFollowUp);
    expect(result.followUpBookedRate).toBe(100);
  });

  it("handles all missed appointments", () => {
    const allMissed = [makeAppointment({ status: "missed" }), makeAppointment({ status: "missed" })];
    const result = evaluateAppointments(allMissed);
    expect(result.attendanceRate).toBe(0);
    expect(result.missedRate).toBe(100);
  });
});

describe("evaluateAssessments", () => {
  it("counts assessments by type", () => {
    const result = evaluateAssessments(demoAssessments(), CHILD_IDS, REFERENCE_DATE);
    expect(result.totalAssessments).toBe(6);
    expect(result.initialCompleted).toBe(3);
    expect(result.reviewCompleted).toBe(3);
  });

  it("calculates completed on time rate", () => {
    const result = evaluateAssessments(demoAssessments(), CHILD_IDS, REFERENCE_DATE);
    // 5 out of 6 on time
    expect(result.completedOnTimeRate).toBeCloseTo(83.3, 0);
  });

  it("calculates action plan rate", () => {
    const result = evaluateAssessments(demoAssessments(), CHILD_IDS, REFERENCE_DATE);
    expect(result.actionPlanRate).toBe(100);
  });

  it("calculates child participation rate", () => {
    const result = evaluateAssessments(demoAssessments(), CHILD_IDS, REFERENCE_DATE);
    // 5 out of 6 participated
    expect(result.childParticipationRate).toBeCloseTo(83.3, 0);
  });

  it("calculates shared with carers rate", () => {
    const result = evaluateAssessments(demoAssessments(), CHILD_IDS, REFERENCE_DATE);
    expect(result.sharedWithCarersRate).toBe(100);
  });

  it("calculates coverage rate", () => {
    const result = evaluateAssessments(demoAssessments(), CHILD_IDS, REFERENCE_DATE);
    // All 3 children have assessments within 12 months
    expect(result.assessmentCoverageRate).toBe(100);
  });

  it("detects expired assessments", () => {
    const old = [makeAssessment({ assessmentDate: "2023-01-01" })];
    const result = evaluateAssessments(old, CHILD_IDS, REFERENCE_DATE);
    // 1 child assessed but expired, 3 total children
    expect(result.childrenWithCurrentAssessment).toBe(0);
  });

  it("produces positive score", () => {
    const result = evaluateAssessments(demoAssessments(), CHILD_IDS, REFERENCE_DATE);
    expect(result.overallScore).toBeGreaterThan(70);
  });

  it("returns zero with empty data", () => {
    const result = evaluateAssessments([], CHILD_IDS, REFERENCE_DATE);
    expect(result.overallScore).toBe(0);
  });
});

describe("evaluateHealthNeeds", () => {
  it("counts total and active needs", () => {
    const result = evaluateHealthNeeds(demoHealthNeeds());
    expect(result.totalNeeds).toBe(5);
    expect(result.activeNeeds).toBe(4);
  });

  it("calculates management plan rate for active needs", () => {
    const result = evaluateHealthNeeds(demoHealthNeeds());
    // 3 of 4 active have plans
    expect(result.managementPlanRate).toBe(75);
  });

  it("calculates currently managed rate", () => {
    const result = evaluateHealthNeeds(demoHealthNeeds());
    // 3 of 4 active are managed
    expect(result.currentlyManagedRate).toBe(75);
  });

  it("calculates specialist involvement rate", () => {
    const result = evaluateHealthNeeds(demoHealthNeeds());
    // 2 of 5 total have specialist
    expect(result.specialistInvolvedRate).toBe(40);
  });

  it("tracks category breakdown", () => {
    const result = evaluateHealthNeeds(demoHealthNeeds());
    expect(result.categoryBreakdown["chronic_condition"]).toBe(1);
    expect(result.categoryBreakdown["allergy"]).toBe(1);
    expect(result.categoryBreakdown["dental"]).toBe(1);
  });

  it("produces positive score", () => {
    const result = evaluateHealthNeeds(demoHealthNeeds());
    expect(result.overallScore).toBeGreaterThan(40);
  });

  it("returns zero with empty data", () => {
    const result = evaluateHealthNeeds([]);
    expect(result.overallScore).toBe(0);
  });

  it("gives 100% management when no active needs", () => {
    const resolved = [makeHealthNeed({ status: "resolved" })];
    const result = evaluateHealthNeeds(resolved);
    expect(result.managementPlanRate).toBe(100);
    expect(result.currentlyManagedRate).toBe(100);
  });
});

describe("evaluateHealthPromotion", () => {
  it("counts total activities", () => {
    const result = evaluateHealthPromotion(demoPromotion(), CHILD_IDS);
    expect(result.totalActivities).toBe(10);
  });

  it("counts children engaged", () => {
    const result = evaluateHealthPromotion(demoPromotion(), CHILD_IDS);
    expect(result.childrenEngaged).toBe(3);
  });

  it("calculates average engagement", () => {
    const result = evaluateHealthPromotion(demoPromotion(), CHILD_IDS);
    // (7+8+6+8+9+7+8+5+6+7) / 10 = 7.1
    expect(result.averageEngagement).toBe(7.1);
  });

  it("calculates topic coverage", () => {
    const result = evaluateHealthPromotion(demoPromotion(), CHILD_IDS);
    // 7 unique topics out of 9 = 77.8%
    expect(result.topicCoverage).toBeCloseTo(77.8, 0);
  });

  it("tracks topic breakdown", () => {
    const result = evaluateHealthPromotion(demoPromotion(), CHILD_IDS);
    expect(result.topicBreakdown["healthy_eating"]).toBe(3);
    expect(result.topicBreakdown["exercise"]).toBe(2);
  });

  it("produces positive score", () => {
    const result = evaluateHealthPromotion(demoPromotion(), CHILD_IDS);
    expect(result.overallScore).toBeGreaterThan(50);
  });

  it("returns zero with empty data", () => {
    const result = evaluateHealthPromotion([], CHILD_IDS);
    expect(result.overallScore).toBe(0);
  });
});

describe("evaluateImmunisations", () => {
  it("counts total records", () => {
    const result = evaluateImmunisations(demoImmunisations(), CHILD_IDS);
    expect(result.totalRecords).toBe(6);
  });

  it("calculates up to date rate", () => {
    const result = evaluateImmunisations(demoImmunisations(), CHILD_IDS);
    // 4 up to date out of 6
    expect(result.upToDateRate).toBeCloseTo(66.7, 0);
  });

  it("counts overdue immunisations", () => {
    const result = evaluateImmunisations(demoImmunisations(), CHILD_IDS);
    expect(result.overdueCount).toBe(1);
  });

  it("counts declined immunisations", () => {
    const result = evaluateImmunisations(demoImmunisations(), CHILD_IDS);
    expect(result.declinedCount).toBe(0);
  });

  it("score reflects up to date rate", () => {
    const result = evaluateImmunisations(demoImmunisations(), CHILD_IDS);
    expect(result.overallScore).toBeCloseTo(67, 0);
  });

  it("returns zero with empty data", () => {
    const result = evaluateImmunisations([], CHILD_IDS);
    expect(result.overallScore).toBe(0);
  });

  it("gives 100 when all up to date", () => {
    const allUpToDate = [
      makeImmunisation({ status: "up_to_date" }),
      makeImmunisation({ status: "up_to_date" }),
    ];
    const result = evaluateImmunisations(allUpToDate, CHILD_IDS);
    expect(result.overallScore).toBe(100);
  });
});

describe("buildChildHealthProfiles", () => {
  const profiles = buildChildHealthProfiles(
    demoAppointments(), demoAssessments(), demoHealthNeeds(),
    demoPromotion(), demoImmunisations(), CHILD_IDS, REFERENCE_DATE,
  );

  it("creates profile for each child", () => {
    expect(profiles.length).toBe(3);
    expect(profiles.map(p => p.childId)).toEqual(CHILD_IDS);
  });

  it("detects GP registration", () => {
    const alex = profiles.find(p => p.childId === "child-alex")!;
    expect(alex.gpRegistered).toBe(true);
  });

  it("detects current dental check", () => {
    const alex = profiles.find(p => p.childId === "child-alex")!;
    expect(alex.dentalCheckCurrent).toBe(true);
    const morgan = profiles.find(p => p.childId === "child-morgan")!;
    // Morgan refused dental
    expect(morgan.dentalCheckCurrent).toBe(false);
  });

  it("detects current optician check", () => {
    const alex = profiles.find(p => p.childId === "child-alex")!;
    expect(alex.opticiansCheckCurrent).toBe(true);
  });

  it("detects current health assessment", () => {
    const alex = profiles.find(p => p.childId === "child-alex")!;
    expect(alex.healthAssessmentCurrent).toBe(true);
  });

  it("tracks active health needs", () => {
    const alex = profiles.find(p => p.childId === "child-alex")!;
    expect(alex.activeHealthNeeds).toBe(2);
    expect(alex.managedHealthNeeds).toBe(2);
  });

  it("flags immunisation status", () => {
    const alex = profiles.find(p => p.childId === "child-alex")!;
    expect(alex.immunisationsUpToDate).toBe(true);
    const morgan = profiles.find(p => p.childId === "child-morgan")!;
    expect(morgan.immunisationsUpToDate).toBe(false);
  });

  it("generates concerns for Morgan", () => {
    const morgan = profiles.find(p => p.childId === "child-morgan")!;
    expect(morgan.concerns.length).toBeGreaterThan(0);
    expect(morgan.concerns.some(c => c.includes("Dental"))).toBe(true);
  });

  it("generates positives for Alex", () => {
    const alex = profiles.find(p => p.childId === "child-alex")!;
    expect(alex.positives.length).toBeGreaterThan(0);
    expect(alex.positives.some(p => p.includes("GP"))).toBe(true);
  });

  it("calculates overall health score", () => {
    const jordan = profiles.find(p => p.childId === "child-jordan")!;
    expect(jordan.overallHealthScore).toBeGreaterThan(0);
  });

  it("handles child with no data", () => {
    const empty = buildChildHealthProfiles([], [], [], [], [], ["child-unknown"], REFERENCE_DATE);
    expect(empty[0].gpRegistered).toBe(false);
    expect(empty[0].activeHealthNeeds).toBe(0);
  });
});

describe("generatePhysicalHealthIntelligence", () => {
  const result = generatePhysicalHealthIntelligence(
    demoAppointments(), demoAssessments(), demoHealthNeeds(),
    demoPromotion(), demoImmunisations(), CHILD_IDS,
    HOME_ID, PERIOD_START, PERIOD_END, REFERENCE_DATE,
  );

  it("returns correct homeId and period", () => {
    expect(result.homeId).toBe(HOME_ID);
    expect(result.periodStart).toBe(PERIOD_START);
    expect(result.periodEnd).toBe(PERIOD_END);
  });

  it("calculates overall score", () => {
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("assigns valid rating", () => {
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);
  });

  it("includes all sub-results", () => {
    expect(result.appointments.totalAppointments).toBe(12);
    expect(result.assessments.totalAssessments).toBe(6);
    expect(result.healthNeeds.totalNeeds).toBe(5);
    expect(result.healthPromotion.totalActivities).toBe(10);
    expect(result.immunisations.totalRecords).toBe(6);
  });

  it("includes child profiles", () => {
    expect(result.childProfiles.length).toBe(3);
  });

  it("generates strengths", () => {
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("generates areas for improvement", () => {
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("generates actions for overdue immunisations", () => {
    expect(result.actions.some(a => a.toLowerCase().includes("immunis"))).toBe(true);
  });

  it("includes regulatory links", () => {
    expect(result.regulatoryLinks.length).toBeGreaterThan(0);
    expect(result.regulatoryLinks.some(l => l.includes("Reg 10"))).toBe(true);
    expect(result.regulatoryLinks.some(l => l.includes("UNCRC"))).toBe(true);
  });

  it("demo data produces reasonable rating", () => {
    expect(["outstanding", "good", "requires_improvement"]).toContain(result.rating);
  });
});

describe("scoring thresholds", () => {
  it("maps score to correct rating", () => {
    const result = generatePhysicalHealthIntelligence(
      demoAppointments(), demoAssessments(), demoHealthNeeds(),
      demoPromotion(), demoImmunisations(), CHILD_IDS,
      HOME_ID, PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    if (result.overallScore >= 80) expect(result.rating).toBe("outstanding");
    else if (result.overallScore >= 60) expect(result.rating).toBe("good");
    else if (result.overallScore >= 40) expect(result.rating).toBe("requires_improvement");
    else expect(result.rating).toBe("inadequate");
  });

  it("inadequate with empty data", () => {
    const result = generatePhysicalHealthIntelligence(
      [], [], [], [], [], CHILD_IDS,
      HOME_ID, PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
  });
});

describe("label functions", () => {
  it("getAppointmentTypeLabel returns correct labels", () => {
    expect(getAppointmentTypeLabel("gp_consultation")).toBe("GP Consultation");
    expect(getAppointmentTypeLabel("dental_check")).toBe("Dental Check");
    expect(getAppointmentTypeLabel("specialist_referral")).toBe("Specialist Referral");
    expect(getAppointmentTypeLabel("immunisation")).toBe("Immunisation");
  });

  it("getHealthNeedCategoryLabel returns correct labels", () => {
    expect(getHealthNeedCategoryLabel("chronic_condition")).toBe("Chronic Condition");
    expect(getHealthNeedCategoryLabel("dental")).toBe("Dental");
    expect(getHealthNeedCategoryLabel("allergy")).toBe("Allergy");
  });

  it("getHealthPromotionTopicLabel returns correct labels", () => {
    expect(getHealthPromotionTopicLabel("healthy_eating")).toBe("Healthy Eating");
    expect(getHealthPromotionTopicLabel("exercise")).toBe("Exercise");
    expect(getHealthPromotionTopicLabel("substance_awareness")).toBe("Substance Awareness");
  });
});
