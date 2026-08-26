import { describe, it, expect } from "vitest";
import {
  generateAftercareOutcomesTrackingIntelligence,
  evaluateKeepingInTouch,
  evaluateHousingStability,
  evaluateEducationEmployment,
  evaluateWellbeingSupport,
  buildCareLeaverProfiles,
  getRating,
  getLeavingReasonLabel,
  getHousingStatusLabel,
  getEmploymentEducationStatusLabel,
  getWellbeingRatingLabel,
  getContactFrequencyLabel,
  getContactMethodLabel,
  getServiceTypeLabel,
  getRatingLabel,
} from "../aftercare-outcomes-tracking-engine";
import type {
  CareLeaverProfile,
  AftercareContact,
  OutcomeAssessment,
  SupportService,
} from "../aftercare-outcomes-tracking-engine";

// -- Test Factories -----------------------------------------------------------

function mkLeaver(overrides: Partial<CareLeaverProfile> = {}): CareLeaverProfile {
  return {
    id: "cl-1",
    childId: "child-1",
    childName: "Alex",
    dateOfBirth: "2008-03-15",
    leavingDate: "2025-11-18",
    leavingReason: "aged_out",
    currentAge: 18,
    housingStatus: "stable",
    employmentEducationStatus: "in_education",
    hasPathwayPlan: true,
    pathwayPlanReviewDate: "2026-05-01",
    personalAdviserAssigned: true,
    personalAdviserName: "Mark Thompson",
    ...overrides,
  };
}

function mkContact(overrides: Partial<AftercareContact> = {}): AftercareContact {
  return {
    id: "ac-1",
    childId: "child-1",
    childName: "Alex",
    date: "2026-04-15",
    contactMethod: "phone",
    initiatedBy: "home",
    purpose: "Wellbeing check-in",
    wellbeingRating: "stable",
    concernsRaised: false,
    followUpRequired: false,
    followUpCompleted: false,
    ...overrides,
  };
}

function mkAssessment(overrides: Partial<OutcomeAssessment> = {}): OutcomeAssessment {
  return {
    id: "oa-1",
    childId: "child-1",
    childName: "Alex",
    assessmentDate: "2026-04-01",
    housingStable: true,
    educationEmploymentEngaged: true,
    mentalHealthSupported: true,
    physicalHealthRegistered: true,
    financiallyCapable: true,
    socialNetworkPresent: true,
    overallWellbeing: "stable",
    ...overrides,
  };
}

function mkService(overrides: Partial<SupportService> = {}): SupportService {
  return {
    id: "ss-1",
    childId: "child-1",
    childName: "Alex",
    serviceType: "education",
    referralDate: "2026-01-15",
    accessedService: true,
    serviceOngoing: true,
    ...overrides,
  };
}

// -- pct ----------------------------------------------------------------------


// -- getRating ----------------------------------------------------------------

describe("getRating", () => {
  it("outstanding >= 80", () => expect(getRating(80)).toBe("outstanding"));
  it("outstanding at 100", () => expect(getRating(100)).toBe("outstanding"));
  it("good >= 60", () => expect(getRating(60)).toBe("good"));
  it("good at 79", () => expect(getRating(79)).toBe("good"));
  it("requires_improvement >= 40", () => expect(getRating(40)).toBe("requires_improvement"));
  it("requires_improvement at 59", () => expect(getRating(59)).toBe("requires_improvement"));
  it("inadequate < 40", () => expect(getRating(39)).toBe("inadequate"));
  it("inadequate at 0", () => expect(getRating(0)).toBe("inadequate"));
});

// -- Label functions ----------------------------------------------------------

describe("label functions", () => {
  it("leaving reason labels", () => {
    expect(getLeavingReasonLabel("aged_out")).toBe("Aged Out");
    expect(getLeavingReasonLabel("reunification")).toBe("Reunification");
    expect(getLeavingReasonLabel("adoption")).toBe("Adoption");
    expect(getLeavingReasonLabel("placement_move")).toBe("Placement Move");
    expect(getLeavingReasonLabel("independent_living")).toBe("Independent Living");
    expect(getLeavingReasonLabel("other")).toBe("Other");
  });

  it("housing status labels", () => {
    expect(getHousingStatusLabel("stable")).toBe("Stable");
    expect(getHousingStatusLabel("temporary")).toBe("Temporary");
    expect(getHousingStatusLabel("homeless")).toBe("Homeless");
    expect(getHousingStatusLabel("supported_housing")).toBe("Supported Housing");
    expect(getHousingStatusLabel("returned_home")).toBe("Returned Home");
    expect(getHousingStatusLabel("unknown")).toBe("Unknown");
  });

  it("employment education status labels", () => {
    expect(getEmploymentEducationStatusLabel("employed")).toBe("Employed");
    expect(getEmploymentEducationStatusLabel("in_education")).toBe("In Education");
    expect(getEmploymentEducationStatusLabel("training")).toBe("Training");
    expect(getEmploymentEducationStatusLabel("neet")).toBe("NEET");
    expect(getEmploymentEducationStatusLabel("volunteering")).toBe("Volunteering");
    expect(getEmploymentEducationStatusLabel("unknown")).toBe("Unknown");
  });

  it("wellbeing rating labels", () => {
    expect(getWellbeingRatingLabel("thriving")).toBe("Thriving");
    expect(getWellbeingRatingLabel("stable")).toBe("Stable");
    expect(getWellbeingRatingLabel("struggling")).toBe("Struggling");
    expect(getWellbeingRatingLabel("crisis")).toBe("Crisis");
    expect(getWellbeingRatingLabel("unknown")).toBe("Unknown");
  });

  it("contact frequency labels", () => {
    expect(getContactFrequencyLabel("weekly")).toBe("Weekly");
    expect(getContactFrequencyLabel("fortnightly")).toBe("Fortnightly");
    expect(getContactFrequencyLabel("monthly")).toBe("Monthly");
    expect(getContactFrequencyLabel("quarterly")).toBe("Quarterly");
    expect(getContactFrequencyLabel("none")).toBe("None");
  });

  it("contact method labels", () => {
    expect(getContactMethodLabel("visit")).toBe("Visit");
    expect(getContactMethodLabel("phone")).toBe("Phone");
    expect(getContactMethodLabel("video")).toBe("Video");
    expect(getContactMethodLabel("text")).toBe("Text");
    expect(getContactMethodLabel("email")).toBe("Email");
  });

  it("service type labels", () => {
    expect(getServiceTypeLabel("housing")).toBe("Housing");
    expect(getServiceTypeLabel("education")).toBe("Education");
    expect(getServiceTypeLabel("employment")).toBe("Employment");
    expect(getServiceTypeLabel("mental_health")).toBe("Mental Health");
    expect(getServiceTypeLabel("financial")).toBe("Financial");
    expect(getServiceTypeLabel("social")).toBe("Social");
    expect(getServiceTypeLabel("legal")).toBe("Legal");
  });

  it("rating labels", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// -- evaluateKeepingInTouch ---------------------------------------------------

describe("evaluateKeepingInTouch", () => {
  it("returns 0 for empty contacts", () => {
    const result = evaluateKeepingInTouch([], []);
    expect(result.overallScore).toBe(0);
    expect(result.totalContacts).toBe(0);
  });

  it("returns 0 for empty contacts even with leavers", () => {
    const result = evaluateKeepingInTouch([], [mkLeaver()]);
    expect(result.overallScore).toBe(0);
  });

  it("scores high for frequent contacts with good wellbeing recording", () => {
    const leavers = [mkLeaver()];
    const contacts = [
      mkContact({ id: "ac-1", date: "2026-01-15" }),
      mkContact({ id: "ac-2", date: "2026-02-15" }),
      mkContact({ id: "ac-3", date: "2026-03-15" }),
      mkContact({ id: "ac-4", date: "2026-04-15" }),
    ];
    const result = evaluateKeepingInTouch(contacts, leavers);
    expect(result.overallScore).toBeGreaterThanOrEqual(15);
    expect(result.regularContactRate).toBe(100);
    expect(result.wellbeingRecordedRate).toBe(100);
  });

  it("calculates child initiated rate", () => {
    const contacts = [
      mkContact({ id: "ac-1", initiatedBy: "child" }),
      mkContact({ id: "ac-2", initiatedBy: "home" }),
      mkContact({ id: "ac-3", initiatedBy: "child" }),
      mkContact({ id: "ac-4", initiatedBy: "adviser" }),
    ];
    const result = evaluateKeepingInTouch(contacts, [mkLeaver()]);
    expect(result.childInitiatedRate).toBe(50);
  });

  it("calculates concerns followed up rate", () => {
    const contacts = [
      mkContact({ id: "ac-1", concernsRaised: true, followUpRequired: true, followUpCompleted: true }),
      mkContact({ id: "ac-2", concernsRaised: true, followUpRequired: true, followUpCompleted: false }),
    ];
    const result = evaluateKeepingInTouch(contacts, [mkLeaver()]);
    expect(result.concernsFollowedUpRate).toBe(50);
  });

  it("gives partial credit when no concerns raised", () => {
    const contacts = [mkContact({ concernsRaised: false, followUpRequired: false })];
    const result = evaluateKeepingInTouch(contacts, [mkLeaver()]);
    expect(result.overallScore).toBeGreaterThan(0);
  });

  it("calculates wellbeing recorded rate", () => {
    const contacts = [
      mkContact({ id: "ac-1", wellbeingRating: "stable" }),
      mkContact({ id: "ac-2", wellbeingRating: "unknown" }),
      mkContact({ id: "ac-3", wellbeingRating: "thriving" }),
    ];
    const result = evaluateKeepingInTouch(contacts, [mkLeaver()]);
    expect(result.wellbeingRecordedRate).toBe(67);
  });

  it("calculates regular contact rate across multiple leavers", () => {
    const leavers = [
      mkLeaver({ childId: "child-1", childName: "Alex" }),
      mkLeaver({ id: "cl-2", childId: "child-2", childName: "Jordan" }),
    ];
    const contacts = [
      mkContact({ id: "ac-1", childId: "child-1" }),
      mkContact({ id: "ac-2", childId: "child-1" }),
      mkContact({ id: "ac-3", childId: "child-2" }),
      // child-2 only has 1 contact, so not regular
    ];
    const result = evaluateKeepingInTouch(contacts, leavers);
    expect(result.regularContactRate).toBe(50);
  });

  it("score capped at 25", () => {
    const contacts = Array.from({ length: 10 }, (_, i) =>
      mkContact({ id: `ac-${i}`, initiatedBy: "child" }),
    );
    const result = evaluateKeepingInTouch(contacts, [mkLeaver()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("counts total contacts correctly", () => {
    const contacts = [mkContact({ id: "ac-1" }), mkContact({ id: "ac-2" }), mkContact({ id: "ac-3" })];
    const result = evaluateKeepingInTouch(contacts, [mkLeaver()]);
    expect(result.totalContacts).toBe(3);
  });

  it("handles all unknown wellbeing ratings", () => {
    const contacts = [
      mkContact({ id: "ac-1", wellbeingRating: "unknown" }),
      mkContact({ id: "ac-2", wellbeingRating: "unknown" }),
    ];
    const result = evaluateKeepingInTouch(contacts, [mkLeaver()]);
    expect(result.wellbeingRecordedRate).toBe(0);
  });
});

// -- evaluateHousingStability -------------------------------------------------

describe("evaluateHousingStability", () => {
  it("returns 0 for empty leavers", () => {
    const result = evaluateHousingStability([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalLeavers).toBe(0);
  });

  it("scores high for stable housing with plans and advisers", () => {
    const leavers = [mkLeaver(), mkLeaver({ id: "cl-2", childId: "child-2", childName: "Jordan" })];
    const result = evaluateHousingStability(leavers);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
    expect(result.stableHousingRate).toBe(100);
    expect(result.pathwayPlanRate).toBe(100);
    expect(result.personalAdviserRate).toBe(100);
    expect(result.homelessnessRate).toBe(0);
  });

  it("scores low for homeless with no plans", () => {
    const leavers = [mkLeaver({
      housingStatus: "homeless",
      hasPathwayPlan: false,
      personalAdviserAssigned: false,
    })];
    const result = evaluateHousingStability(leavers);
    expect(result.overallScore).toBeLessThan(10);
    expect(result.homelessnessRate).toBe(100);
  });

  it("counts stable housing correctly (stable + returned_home + supported_housing)", () => {
    const leavers = [
      mkLeaver({ id: "cl-1", childId: "child-1", housingStatus: "stable" }),
      mkLeaver({ id: "cl-2", childId: "child-2", housingStatus: "returned_home" }),
      mkLeaver({ id: "cl-3", childId: "child-3", housingStatus: "supported_housing" }),
      mkLeaver({ id: "cl-4", childId: "child-4", housingStatus: "temporary" }),
    ];
    const result = evaluateHousingStability(leavers);
    expect(result.stableHousingRate).toBe(75);
  });

  it("calculates pathway plan rate", () => {
    const leavers = [
      mkLeaver({ id: "cl-1", childId: "child-1", hasPathwayPlan: true }),
      mkLeaver({ id: "cl-2", childId: "child-2", hasPathwayPlan: false }),
    ];
    const result = evaluateHousingStability(leavers);
    expect(result.pathwayPlanRate).toBe(50);
  });

  it("calculates personal adviser rate", () => {
    const leavers = [
      mkLeaver({ id: "cl-1", childId: "child-1", personalAdviserAssigned: true }),
      mkLeaver({ id: "cl-2", childId: "child-2", personalAdviserAssigned: false }),
      mkLeaver({ id: "cl-3", childId: "child-3", personalAdviserAssigned: false }),
    ];
    const result = evaluateHousingStability(leavers);
    expect(result.personalAdviserRate).toBe(33);
  });

  it("gives bonus for zero homelessness", () => {
    const noHomeless = evaluateHousingStability([mkLeaver({ housingStatus: "stable" })]);
    const withHomeless = evaluateHousingStability([mkLeaver({ housingStatus: "homeless" })]);
    expect(noHomeless.overallScore).toBeGreaterThan(withHomeless.overallScore);
  });

  it("gives partial bonus for low homelessness rate", () => {
    const leavers = Array.from({ length: 20 }, (_, i) =>
      mkLeaver({ id: `cl-${i}`, childId: `child-${i}`, housingStatus: i === 0 ? "homeless" : "stable" }),
    );
    const result = evaluateHousingStability(leavers);
    // 5% homelessness rate <= 10%, should get partial bonus
    expect(result.homelessnessRate).toBe(5);
  });

  it("score capped at 25", () => {
    const result = evaluateHousingStability([mkLeaver()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("counts total leavers", () => {
    const leavers = [mkLeaver(), mkLeaver({ id: "cl-2", childId: "child-2" }), mkLeaver({ id: "cl-3", childId: "child-3" })];
    const result = evaluateHousingStability(leavers);
    expect(result.totalLeavers).toBe(3);
  });

  it("handles unknown housing status", () => {
    const leavers = [mkLeaver({ housingStatus: "unknown" })];
    const result = evaluateHousingStability(leavers);
    expect(result.stableHousingRate).toBe(0);
    expect(result.homelessnessRate).toBe(0);
  });
});

// -- evaluateEducationEmployment ----------------------------------------------

describe("evaluateEducationEmployment", () => {
  it("returns 0 for empty leavers", () => {
    const result = evaluateEducationEmployment([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalLeavers).toBe(0);
  });

  it("scores high for all engaged", () => {
    const leavers = [
      mkLeaver({ id: "cl-1", childId: "child-1", employmentEducationStatus: "in_education" }),
      mkLeaver({ id: "cl-2", childId: "child-2", employmentEducationStatus: "employed" }),
    ];
    const result = evaluateEducationEmployment(leavers);
    expect(result.overallScore).toBeGreaterThanOrEqual(15);
    expect(result.engagedRate).toBe(100);
    expect(result.neetRate).toBe(0);
  });

  it("scores low for all NEET", () => {
    const leavers = [
      mkLeaver({ id: "cl-1", childId: "child-1", employmentEducationStatus: "neet" }),
      mkLeaver({ id: "cl-2", childId: "child-2", employmentEducationStatus: "neet" }),
    ];
    const result = evaluateEducationEmployment(leavers);
    expect(result.overallScore).toBeLessThan(5);
    expect(result.neetRate).toBe(100);
    expect(result.engagedRate).toBe(0);
  });

  it("counts engaged correctly (employed + in_education + training + volunteering)", () => {
    const leavers = [
      mkLeaver({ id: "cl-1", childId: "child-1", employmentEducationStatus: "employed" }),
      mkLeaver({ id: "cl-2", childId: "child-2", employmentEducationStatus: "in_education" }),
      mkLeaver({ id: "cl-3", childId: "child-3", employmentEducationStatus: "training" }),
      mkLeaver({ id: "cl-4", childId: "child-4", employmentEducationStatus: "volunteering" }),
      mkLeaver({ id: "cl-5", childId: "child-5", employmentEducationStatus: "neet" }),
    ];
    const result = evaluateEducationEmployment(leavers);
    expect(result.engagedRate).toBe(80);
  });

  it("calculates education continued rate", () => {
    const leavers = [
      mkLeaver({ id: "cl-1", childId: "child-1", employmentEducationStatus: "in_education" }),
      mkLeaver({ id: "cl-2", childId: "child-2", employmentEducationStatus: "employed" }),
    ];
    const result = evaluateEducationEmployment(leavers);
    expect(result.educationContinuedRate).toBe(50);
  });

  it("calculates training access rate", () => {
    const leavers = [
      mkLeaver({ id: "cl-1", childId: "child-1", employmentEducationStatus: "training" }),
      mkLeaver({ id: "cl-2", childId: "child-2", employmentEducationStatus: "employed" }),
      mkLeaver({ id: "cl-3", childId: "child-3", employmentEducationStatus: "training" }),
    ];
    const result = evaluateEducationEmployment(leavers);
    expect(result.trainingAccessRate).toBe(67);
  });

  it("gives bonus for zero NEET rate", () => {
    const noNeet = evaluateEducationEmployment([mkLeaver({ employmentEducationStatus: "employed" })]);
    const withNeet = evaluateEducationEmployment([mkLeaver({ employmentEducationStatus: "neet" })]);
    expect(noNeet.overallScore).toBeGreaterThan(withNeet.overallScore);
  });

  it("gives partial bonus for low NEET rate", () => {
    const leavers = Array.from({ length: 20 }, (_, i) =>
      mkLeaver({
        id: `cl-${i}`,
        childId: `child-${i}`,
        employmentEducationStatus: i === 0 ? "neet" : "employed",
      }),
    );
    const result = evaluateEducationEmployment(leavers);
    expect(result.neetRate).toBe(5);
  });

  it("score capped at 25", () => {
    const result = evaluateEducationEmployment([mkLeaver({ employmentEducationStatus: "in_education" })]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("handles unknown status", () => {
    const leavers = [mkLeaver({ employmentEducationStatus: "unknown" })];
    const result = evaluateEducationEmployment(leavers);
    expect(result.engagedRate).toBe(0);
    expect(result.neetRate).toBe(0);
  });

  it("counts total leavers", () => {
    const leavers = [mkLeaver(), mkLeaver({ id: "cl-2", childId: "child-2" })];
    const result = evaluateEducationEmployment(leavers);
    expect(result.totalLeavers).toBe(2);
  });
});

// -- evaluateWellbeingSupport -------------------------------------------------

describe("evaluateWellbeingSupport", () => {
  it("returns 0 for empty assessments and services", () => {
    const result = evaluateWellbeingSupport([], [], []);
    expect(result.overallScore).toBe(0);
    expect(result.totalAssessments).toBe(0);
  });

  it("scores high for positive assessments and accessed services", () => {
    const leavers = [mkLeaver()];
    const assessments = [mkAssessment({ overallWellbeing: "thriving" })];
    const services = [mkService({ accessedService: true })];
    const result = evaluateWellbeingSupport(assessments, services, leavers);
    expect(result.overallScore).toBeGreaterThanOrEqual(15);
    expect(result.thrivingStableRate).toBe(100);
    expect(result.supportServicesAccessedRate).toBe(100);
  });

  it("calculates assessments done rate based on leaver count", () => {
    const leavers = [
      mkLeaver({ childId: "child-1" }),
      mkLeaver({ id: "cl-2", childId: "child-2", childName: "Jordan" }),
    ];
    const assessments = [mkAssessment({ childId: "child-1" })];
    const result = evaluateWellbeingSupport(assessments, [], leavers);
    expect(result.assessmentsDoneRate).toBe(50);
  });

  it("calculates thriving/stable rate", () => {
    const assessments = [
      mkAssessment({ id: "oa-1", overallWellbeing: "thriving" }),
      mkAssessment({ id: "oa-2", overallWellbeing: "stable" }),
      mkAssessment({ id: "oa-3", overallWellbeing: "struggling" }),
    ];
    const result = evaluateWellbeingSupport(assessments, [], []);
    expect(result.thrivingStableRate).toBe(67);
  });

  it("calculates support services accessed rate", () => {
    const services = [
      mkService({ id: "ss-1", accessedService: true }),
      mkService({ id: "ss-2", accessedService: false }),
      mkService({ id: "ss-3", accessedService: true }),
    ];
    const result = evaluateWellbeingSupport([], services, []);
    expect(result.supportServicesAccessedRate).toBe(67);
  });

  it("calculates mental health supported rate", () => {
    const assessments = [
      mkAssessment({ id: "oa-1", mentalHealthSupported: true }),
      mkAssessment({ id: "oa-2", mentalHealthSupported: false }),
    ];
    const result = evaluateWellbeingSupport(assessments, [], []);
    expect(result.mentalHealthSupportedRate).toBe(50);
  });

  it("score capped at 25", () => {
    const leavers = [mkLeaver()];
    const assessments = [mkAssessment({ overallWellbeing: "thriving", mentalHealthSupported: true })];
    const services = [mkService({ accessedService: true })];
    const result = evaluateWellbeingSupport(assessments, services, leavers);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("handles services only (no assessments)", () => {
    const services = [mkService({ accessedService: true })];
    const result = evaluateWellbeingSupport([], services, [mkLeaver()]);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.supportServicesAccessedRate).toBe(100);
  });

  it("handles assessments only (no services)", () => {
    const assessments = [mkAssessment({ overallWellbeing: "thriving", mentalHealthSupported: true })];
    const result = evaluateWellbeingSupport(assessments, [], [mkLeaver()]);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.thrivingStableRate).toBe(100);
  });

  it("handles all crisis wellbeing", () => {
    const assessments = [
      mkAssessment({ id: "oa-1", overallWellbeing: "crisis" }),
      mkAssessment({ id: "oa-2", overallWellbeing: "crisis" }),
    ];
    const result = evaluateWellbeingSupport(assessments, [], []);
    expect(result.thrivingStableRate).toBe(0);
  });

  it("counts total assessments", () => {
    const assessments = [mkAssessment({ id: "oa-1" }), mkAssessment({ id: "oa-2" }), mkAssessment({ id: "oa-3" })];
    const result = evaluateWellbeingSupport(assessments, [], []);
    expect(result.totalAssessments).toBe(3);
  });
});

// -- buildCareLeaverProfiles --------------------------------------------------

describe("buildCareLeaverProfiles", () => {
  it("returns empty for no leavers", () => {
    expect(buildCareLeaverProfiles([], [], [])).toEqual([]);
  });

  it("creates one profile per leaver", () => {
    const leavers = [
      mkLeaver({ childId: "child-1", childName: "Alex" }),
      mkLeaver({ id: "cl-2", childId: "child-2", childName: "Jordan" }),
    ];
    const profiles = buildCareLeaverProfiles(leavers, [], []);
    expect(profiles).toHaveLength(2);
  });

  it("sets housing status from leaver profile", () => {
    const leavers = [mkLeaver({ housingStatus: "temporary" })];
    const profiles = buildCareLeaverProfiles(leavers, [], []);
    expect(profiles[0].housingStatus).toBe("temporary");
  });

  it("sets employment education status from leaver profile", () => {
    const leavers = [mkLeaver({ employmentEducationStatus: "neet" })];
    const profiles = buildCareLeaverProfiles(leavers, [], []);
    expect(profiles[0].employmentEducationStatus).toBe("neet");
  });

  it("gets wellbeing rating from most recent assessment", () => {
    const leavers = [mkLeaver()];
    const assessments = [
      mkAssessment({ id: "oa-1", assessmentDate: "2026-01-01", overallWellbeing: "struggling" }),
      mkAssessment({ id: "oa-2", assessmentDate: "2026-04-01", overallWellbeing: "thriving" }),
    ];
    const profiles = buildCareLeaverProfiles(leavers, [], assessments);
    expect(profiles[0].wellbeingRating).toBe("thriving");
  });

  it("falls back to contact wellbeing when no assessments", () => {
    const leavers = [mkLeaver()];
    const contacts = [
      mkContact({ id: "ac-1", date: "2026-01-01", wellbeingRating: "struggling" }),
      mkContact({ id: "ac-2", date: "2026-04-01", wellbeingRating: "stable" }),
    ];
    const profiles = buildCareLeaverProfiles(leavers, contacts, []);
    expect(profiles[0].wellbeingRating).toBe("stable");
  });

  it("defaults to unknown when no assessments or contacts", () => {
    const leavers = [mkLeaver()];
    const profiles = buildCareLeaverProfiles(leavers, [], []);
    expect(profiles[0].wellbeingRating).toBe("unknown");
  });

  it("counts contacts per leaver", () => {
    const leavers = [mkLeaver()];
    const contacts = [
      mkContact({ id: "ac-1" }),
      mkContact({ id: "ac-2" }),
      mkContact({ id: "ac-3" }),
    ];
    const profiles = buildCareLeaverProfiles(leavers, contacts, []);
    expect(profiles[0].contactCount).toBe(3);
  });

  it("scores high for stable housing + education + thriving + regular contact", () => {
    const leavers = [mkLeaver({
      housingStatus: "stable",
      employmentEducationStatus: "in_education",
    })];
    const contacts = Array.from({ length: 4 }, (_, i) => mkContact({ id: `ac-${i}` }));
    const assessments = [mkAssessment({ overallWellbeing: "thriving" })];
    const profiles = buildCareLeaverProfiles(leavers, contacts, assessments);
    expect(profiles[0].overallScore).toBeGreaterThanOrEqual(8);
  });

  it("scores low for homeless + NEET + crisis + no contact", () => {
    const leavers = [mkLeaver({
      housingStatus: "homeless",
      employmentEducationStatus: "neet",
    })];
    const assessments = [mkAssessment({ overallWellbeing: "crisis" })];
    const profiles = buildCareLeaverProfiles(leavers, [], assessments);
    expect(profiles[0].overallScore).toBeLessThanOrEqual(2);
  });

  it("score capped at 10", () => {
    const leavers = [mkLeaver({ housingStatus: "stable", employmentEducationStatus: "in_education" })];
    const contacts = Array.from({ length: 10 }, (_, i) => mkContact({ id: `ac-${i}` }));
    const assessments = [mkAssessment({ overallWellbeing: "thriving" })];
    const profiles = buildCareLeaverProfiles(leavers, contacts, assessments);
    expect(profiles[0].overallScore).toBeLessThanOrEqual(10);
  });

  it("gives partial score for supported housing", () => {
    const leavers = [mkLeaver({ housingStatus: "supported_housing", employmentEducationStatus: "neet" })];
    const profiles = buildCareLeaverProfiles(leavers, [], []);
    expect(profiles[0].overallScore).toBe(2);
  });

  it("gives partial score for temporary housing", () => {
    const leavers = [mkLeaver({ housingStatus: "temporary", employmentEducationStatus: "neet" })];
    const profiles = buildCareLeaverProfiles(leavers, [], []);
    expect(profiles[0].overallScore).toBe(1);
  });

  it("gives partial score for training", () => {
    const leavers = [mkLeaver({ housingStatus: "homeless", employmentEducationStatus: "training" })];
    const profiles = buildCareLeaverProfiles(leavers, [], []);
    expect(profiles[0].overallScore).toBe(2);
  });

  it("gives partial contact score for 2 contacts", () => {
    const leavers = [mkLeaver({ housingStatus: "homeless", employmentEducationStatus: "neet" })];
    const contacts = [mkContact({ id: "ac-1" }), mkContact({ id: "ac-2" })];
    const profiles = buildCareLeaverProfiles(leavers, contacts, []);
    expect(profiles[0].contactCount).toBe(2);
    expect(profiles[0].overallScore).toBeGreaterThanOrEqual(1);
  });
});

// -- generateAftercareOutcomesTrackingIntelligence ----------------------------

describe("generateAftercareOutcomesTrackingIntelligence", () => {
  it("assembles all four evaluator scores", () => {
    const result = generateAftercareOutcomesTrackingIntelligence(
      [mkLeaver()],
      [mkContact(), mkContact({ id: "ac-2" })],
      [mkAssessment()],
      [mkService()],
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.overallScore).toBe(
      result.keepingInTouch.overallScore +
      result.housingStability.overallScore +
      result.educationEmployment.overallScore +
      result.wellbeingSupport.overallScore,
    );
  });

  it("returns inadequate with no data", () => {
    const result = generateAftercareOutcomesTrackingIntelligence(
      [], [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
  });

  it("returns outstanding for fully compliant home", () => {
    const leavers = [
      mkLeaver({ childId: "child-1" }),
      mkLeaver({ id: "cl-2", childId: "child-2", childName: "Jordan" }),
    ];
    const contacts = Array.from({ length: 8 }, (_, i) =>
      mkContact({ id: `ac-${i}`, childId: i < 4 ? "child-1" : "child-2" }),
    );
    const assessments = [
      mkAssessment({ childId: "child-1", overallWellbeing: "thriving" }),
      mkAssessment({ id: "oa-2", childId: "child-2", childName: "Jordan", overallWellbeing: "stable" }),
    ];
    const services = [
      mkService({ childId: "child-1" }),
      mkService({ id: "ss-2", childId: "child-2", childName: "Jordan" }),
    ];
    const result = generateAftercareOutcomesTrackingIntelligence(
      leavers, contacts, assessments, services,
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.rating).toBe("outstanding");
  });

  it("score capped at 100", () => {
    const result = generateAftercareOutcomesTrackingIntelligence(
      [mkLeaver()],
      [mkContact(), mkContact({ id: "ac-2" })],
      [mkAssessment()],
      [mkService()],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("populates homeId and period", () => {
    const result = generateAftercareOutcomesTrackingIntelligence(
      [], [], [], [], "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-18");
  });

  // -- Strengths --

  it("adds strength for regular contact", () => {
    const contacts = Array.from({ length: 4 }, (_, i) => mkContact({ id: `ac-${i}` }));
    const result = generateAftercareOutcomesTrackingIntelligence(
      [mkLeaver()], contacts, [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths.some((s) => s.includes("Regular contact maintained"))).toBe(true);
  });

  it("adds strength for wellbeing recorded", () => {
    const contacts = [mkContact({ wellbeingRating: "stable" })];
    const result = generateAftercareOutcomesTrackingIntelligence(
      [mkLeaver()], contacts, [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths.some((s) => s.includes("Wellbeing recorded"))).toBe(true);
  });

  it("adds strength for stable housing", () => {
    const leavers = [mkLeaver({ housingStatus: "stable" })];
    const result = generateAftercareOutcomesTrackingIntelligence(
      leavers, [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths.some((s) => s.includes("housing stability"))).toBe(true);
  });

  it("adds strength for pathway plans", () => {
    const leavers = [mkLeaver({ hasPathwayPlan: true })];
    const result = generateAftercareOutcomesTrackingIntelligence(
      leavers, [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths.some((s) => s.includes("Pathway plans"))).toBe(true);
  });

  it("adds strength for personal advisers", () => {
    const leavers = [mkLeaver({ personalAdviserAssigned: true })];
    const result = generateAftercareOutcomesTrackingIntelligence(
      leavers, [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths.some((s) => s.includes("Personal adviser"))).toBe(true);
  });

  it("adds strength for high ETE engagement", () => {
    const leavers = [mkLeaver({ employmentEducationStatus: "in_education" })];
    const result = generateAftercareOutcomesTrackingIntelligence(
      leavers, [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths.some((s) => s.includes("ETE engagement"))).toBe(true);
  });

  it("adds strength for zero NEET", () => {
    const leavers = [mkLeaver({ employmentEducationStatus: "employed" })];
    const result = generateAftercareOutcomesTrackingIntelligence(
      leavers, [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths.some((s) => s.includes("No care leavers classified as NEET"))).toBe(true);
  });

  it("adds strength for positive wellbeing outcomes", () => {
    const assessments = [mkAssessment({ overallWellbeing: "thriving" })];
    const result = generateAftercareOutcomesTrackingIntelligence(
      [mkLeaver()], [], assessments, [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths.some((s) => s.includes("Positive wellbeing outcomes"))).toBe(true);
  });

  // -- Areas for Improvement --

  it("adds area for no leavers documented", () => {
    const result = generateAftercareOutcomesTrackingIntelligence(
      [], [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.areasForImprovement.some((a) => a.includes("No care leaver profiles documented"))).toBe(true);
  });

  it("adds area for no contacts", () => {
    const result = generateAftercareOutcomesTrackingIntelligence(
      [mkLeaver()], [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.areasForImprovement.some((a) => a.includes("No aftercare contacts recorded"))).toBe(true);
  });

  it("adds area for missing pathway plans", () => {
    const leavers = [mkLeaver({ hasPathwayPlan: false })];
    const result = generateAftercareOutcomesTrackingIntelligence(
      leavers, [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.areasForImprovement.some((a) => a.includes("Pathway plans missing"))).toBe(true);
  });

  it("adds area for missing personal advisers", () => {
    const leavers = [mkLeaver({ personalAdviserAssigned: false })];
    const result = generateAftercareOutcomesTrackingIntelligence(
      leavers, [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.areasForImprovement.some((a) => a.includes("Personal adviser not assigned"))).toBe(true);
  });

  it("adds area for high NEET rate", () => {
    const leavers = [
      mkLeaver({ id: "cl-1", childId: "child-1", employmentEducationStatus: "neet" }),
      mkLeaver({ id: "cl-2", childId: "child-2", employmentEducationStatus: "neet" }),
      mkLeaver({ id: "cl-3", childId: "child-3", employmentEducationStatus: "employed" }),
    ];
    const result = generateAftercareOutcomesTrackingIntelligence(
      leavers, [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.areasForImprovement.some((a) => a.includes("High NEET rate"))).toBe(true);
  });

  it("adds area for no assessments", () => {
    const result = generateAftercareOutcomesTrackingIntelligence(
      [mkLeaver()], [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.areasForImprovement.some((a) => a.includes("No outcome assessments completed"))).toBe(true);
  });

  it("adds area for low wellbeing", () => {
    const assessments = [
      mkAssessment({ id: "oa-1", overallWellbeing: "struggling" }),
      mkAssessment({ id: "oa-2", overallWellbeing: "crisis" }),
      mkAssessment({ id: "oa-3", overallWellbeing: "stable" }),
    ];
    const result = generateAftercareOutcomesTrackingIntelligence(
      [mkLeaver()], [], assessments, [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.areasForImprovement.some((a) => a.includes("Wellbeing concerns"))).toBe(true);
  });

  // -- Actions --

  it("adds URGENT for homeless care leavers", () => {
    const leavers = [mkLeaver({ housingStatus: "homeless" })];
    const result = generateAftercareOutcomesTrackingIntelligence(
      leavers, [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("homeless"))).toBe(true);
  });

  it("adds URGENT for crisis wellbeing", () => {
    const assessments = [mkAssessment({ overallWellbeing: "crisis" })];
    const result = generateAftercareOutcomesTrackingIntelligence(
      [mkLeaver()], [], assessments, [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("crisis"))).toBe(true);
  });

  it("adds URGENT for no personal adviser", () => {
    const leavers = [mkLeaver({ personalAdviserAssigned: false })];
    const result = generateAftercareOutcomesTrackingIntelligence(
      leavers, [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("personal adviser"))).toBe(true);
  });

  it("adds action for NEET leavers", () => {
    const leavers = [mkLeaver({ employmentEducationStatus: "neet" })];
    const result = generateAftercareOutcomesTrackingIntelligence(
      leavers, [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.actions.some((a) => a.includes("NEET"))).toBe(true);
  });

  it("adds URGENT for missing pathway plans", () => {
    const leavers = [mkLeaver({ hasPathwayPlan: false })];
    const result = generateAftercareOutcomesTrackingIntelligence(
      leavers, [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("pathway plan"))).toBe(true);
  });

  it("adds action for no contacts when leavers exist", () => {
    const result = generateAftercareOutcomesTrackingIntelligence(
      [mkLeaver()], [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.actions.some((a) => a.includes("contact schedule"))).toBe(true);
  });

  it("adds action for no assessments when leavers exist", () => {
    const result = generateAftercareOutcomesTrackingIntelligence(
      [mkLeaver()], [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.actions.some((a) => a.includes("outcome assessments"))).toBe(true);
  });

  it("adds action for unfollowed concerns", () => {
    const contacts = [mkContact({ concernsRaised: true, followUpRequired: true, followUpCompleted: false })];
    const result = generateAftercareOutcomesTrackingIntelligence(
      [mkLeaver()], contacts, [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.actions.some((a) => a.includes("outstanding concern"))).toBe(true);
  });

  // -- Regulatory links --

  it("includes all 7 regulatory links", () => {
    const result = generateAftercareOutcomesTrackingIntelligence(
      [], [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.regulatoryLinks).toHaveLength(7);
    expect(result.regulatoryLinks.some((l) => l.includes("Children Act 1989, s23C"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Children & Social Work Act 2017"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015, Reg 13"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Leaving Care Act 2000"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("UNCRC Article 20"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Care Leavers' Covenant"))).toBe(true);
  });

  // -- Integration --

  it("handles realistic mixed scenario", () => {
    const leavers = [
      mkLeaver({ childId: "child-alex", childName: "Alex", housingStatus: "stable", employmentEducationStatus: "in_education" }),
      mkLeaver({ id: "cl-2", childId: "child-jordan", childName: "Jordan", housingStatus: "temporary", employmentEducationStatus: "neet", hasPathwayPlan: false, personalAdviserAssigned: true, personalAdviserName: "Sarah Johnson" }),
    ];
    const contacts = [
      mkContact({ id: "ac-1", childId: "child-alex" }),
      mkContact({ id: "ac-2", childId: "child-alex", initiatedBy: "child" }),
      mkContact({ id: "ac-3", childId: "child-jordan", wellbeingRating: "struggling" }),
    ];
    const assessments = [
      mkAssessment({ childId: "child-alex", overallWellbeing: "stable" }),
    ];
    const services = [
      mkService({ childId: "child-alex", serviceType: "education" }),
      mkService({ id: "ss-2", childId: "child-jordan", childName: "Jordan", serviceType: "housing", accessedService: false }),
    ];
    const result = generateAftercareOutcomesTrackingIntelligence(
      leavers, contacts, assessments, services,
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.rating).toBeDefined();
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.childProfiles).toHaveLength(2);
    expect(result.regulatoryLinks).toHaveLength(7);
    // Should flag Jordan's missing pathway plan
    expect(result.actions.some((a) => a.includes("pathway plan"))).toBe(true);
    // Should flag NEET
    expect(result.actions.some((a) => a.includes("NEET"))).toBe(true);
  });

  it("no duplicate child profiles", () => {
    const leavers = [mkLeaver({ childId: "child-1" })];
    const contacts = [
      mkContact({ id: "ac-1", childId: "child-1" }),
      mkContact({ id: "ac-2", childId: "child-1" }),
    ];
    const result = generateAftercareOutcomesTrackingIntelligence(
      leavers, contacts, [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.childProfiles).toHaveLength(1);
  });

  it("child profiles have correct child names", () => {
    const leavers = [
      mkLeaver({ childId: "child-1", childName: "Alex" }),
      mkLeaver({ id: "cl-2", childId: "child-2", childName: "Jordan" }),
    ];
    const result = generateAftercareOutcomesTrackingIntelligence(
      leavers, [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.childProfiles.find((p) => p.childId === "child-1")!.childName).toBe("Alex");
    expect(result.childProfiles.find((p) => p.childId === "child-2")!.childName).toBe("Jordan");
  });
});
