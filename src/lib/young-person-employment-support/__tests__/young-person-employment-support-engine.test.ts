import { describe, it, expect } from "vitest";
import {
  generateYoungPersonEmploymentSupportIntelligence,
  evaluateCareersPlanQuality,
  evaluateSkillDevelopment,
  evaluatePartnershipAccess,
  evaluateStaffReadiness,
  buildChildEmploymentProfiles,
  pct,
  getRating,
  getSupportTypeLabel,
  getEngagementLevelLabel,
  getOutcomeStatusLabel,
  getCareersPlanStatusLabel,
  getRatingLabel,
} from "../young-person-employment-support-engine";
import type {
  ChildEmploymentProfile,
  EmploymentSupportSession,
  PartnershipRecord,
  StaffEmploymentTraining,
} from "../young-person-employment-support-engine";

// -- Helpers ------------------------------------------------------------------

function mkProfile(overrides: Partial<ChildEmploymentProfile> = {}): ChildEmploymentProfile {
  return {
    id: "cep-1",
    childId: "child-1",
    childName: "Alex",
    age: 15,
    careersPlanExists: true,
    careersPlanStatus: "current",
    careerAspirations: ["Chef"],
    workExperienceCompleted: true,
    cvPrepared: true,
    interviewPracticed: true,
    financialLiteracyAssessed: true,
    personalAdviserEngaged: true,
    ...overrides,
  };
}

function mkSession(overrides: Partial<EmploymentSupportSession> = {}): EmploymentSupportSession {
  return {
    id: "ess-1",
    childId: "child-1",
    childName: "Alex",
    date: "2026-04-15",
    supportType: "careers_guidance",
    facilitatedBy: "Sarah Johnson",
    duration: 60,
    childEngaged: "engaged",
    outcomeStatus: "achieved",
    skillsDeveloped: ["Career research"],
    nextSteps: "Follow up next month",
    ...overrides,
  };
}

function mkPartnership(overrides: Partial<PartnershipRecord> = {}): PartnershipRecord {
  return {
    id: "pr-1",
    partnerId: "partner-1",
    partnerName: "Local Cafe",
    partnerType: "employer",
    activeEngagement: true,
    opportunitiesProvided: 3,
    childrenSupported: ["child-1"],
    ...overrides,
  };
}

function mkTraining(overrides: Partial<StaffEmploymentTraining> = {}): StaffEmploymentTraining {
  return {
    id: "set-1",
    staffId: "staff-1",
    staffName: "Staff A",
    careersGuidanceTrained: true,
    cvInterviewSupport: true,
    financialLiteracyTrained: true,
    apprenticeshipAwareness: true,
    localLabourMarket: true,
    motivationalInterviewing: true,
    ...overrides,
  };
}

// -- pct ----------------------------------------------------------------------

describe("pct", () => {
  it("returns 0 for 0/0", () => expect(pct(0, 0)).toBe(0));
  it("calculates correctly", () => expect(pct(3, 4)).toBe(75));
  it("rounds", () => expect(pct(1, 3)).toBe(33));
  it("full", () => expect(pct(5, 5)).toBe(100));
  it("returns 0 for 0/5", () => expect(pct(0, 5)).toBe(0));
});

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
  it("support type labels", () => {
    expect(getSupportTypeLabel("work_experience")).toBe("Work Experience");
    expect(getSupportTypeLabel("cv_writing")).toBe("CV Writing");
    expect(getSupportTypeLabel("interview_skills")).toBe("Interview Skills");
    expect(getSupportTypeLabel("careers_guidance")).toBe("Careers Guidance");
    expect(getSupportTypeLabel("financial_literacy")).toBe("Financial Literacy");
    expect(getSupportTypeLabel("apprenticeship_search")).toBe("Apprenticeship Search");
    expect(getSupportTypeLabel("college_application")).toBe("College Application");
    expect(getSupportTypeLabel("volunteering")).toBe("Volunteering");
  });
  it("engagement level labels", () => {
    expect(getEngagementLevelLabel("highly_engaged")).toBe("Highly Engaged");
    expect(getEngagementLevelLabel("disengaged")).toBe("Disengaged");
  });
  it("outcome status labels", () => {
    expect(getOutcomeStatusLabel("achieved")).toBe("Achieved");
    expect(getOutcomeStatusLabel("not_applicable")).toBe("Not Applicable");
  });
  it("careers plan status labels", () => {
    expect(getCareersPlanStatusLabel("current")).toBe("Current");
    expect(getCareersPlanStatusLabel("overdue")).toBe("Overdue");
    expect(getCareersPlanStatusLabel("not_in_place")).toBe("Not in Place");
  });
  it("rating labels", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// -- evaluateCareersPlanQuality -----------------------------------------------

describe("evaluateCareersPlanQuality", () => {
  it("returns 0 for empty profiles", () => {
    const result = evaluateCareersPlanQuality([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalProfiles).toBe(0);
    expect(result.planExistsRate).toBe(0);
    expect(result.planCurrentRate).toBe(0);
    expect(result.aspirationsRecordedRate).toBe(0);
    expect(result.adviserEngagedRate).toBe(0);
  });

  it("scores high for all plans in place and current", () => {
    const profiles = [mkProfile(), mkProfile({ id: "cep-2", childId: "child-2", childName: "Morgan" })];
    const result = evaluateCareersPlanQuality(profiles);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
    expect(result.planExistsRate).toBe(100);
    expect(result.planCurrentRate).toBe(100);
  });

  it("scores low when no plans exist", () => {
    const profiles = [mkProfile({ careersPlanExists: false, careersPlanStatus: "not_in_place", careerAspirations: [], personalAdviserEngaged: false })];
    const result = evaluateCareersPlanQuality(profiles);
    expect(result.overallScore).toBe(0);
    expect(result.planExistsRate).toBe(0);
  });

  it("scores partially for overdue plans", () => {
    const profiles = [mkProfile({ careersPlanStatus: "overdue" })];
    const result = evaluateCareersPlanQuality(profiles);
    expect(result.planCurrentRate).toBe(0);
    expect(result.planExistsRate).toBe(100);
  });

  it("counts aspirations recorded", () => {
    const profiles = [
      mkProfile({ id: "cep-1", childId: "c1", careerAspirations: ["Chef"] }),
      mkProfile({ id: "cep-2", childId: "c2", careerAspirations: [] }),
    ];
    const result = evaluateCareersPlanQuality(profiles);
    expect(result.aspirationsRecordedRate).toBe(50);
  });

  it("counts adviser engaged", () => {
    const profiles = [
      mkProfile({ id: "cep-1", childId: "c1", personalAdviserEngaged: true }),
      mkProfile({ id: "cep-2", childId: "c2", personalAdviserEngaged: false }),
    ];
    const result = evaluateCareersPlanQuality(profiles);
    expect(result.adviserEngagedRate).toBe(50);
  });

  it("score capped at 25", () => {
    const result = evaluateCareersPlanQuality([mkProfile()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("returns correct totalProfiles", () => {
    const profiles = [mkProfile(), mkProfile({ id: "cep-2", childId: "c2" }), mkProfile({ id: "cep-3", childId: "c3" })];
    const result = evaluateCareersPlanQuality(profiles);
    expect(result.totalProfiles).toBe(3);
  });
});

// -- evaluateSkillDevelopment -------------------------------------------------

describe("evaluateSkillDevelopment", () => {
  it("returns 0 for empty sessions", () => {
    const result = evaluateSkillDevelopment([], 0);
    expect(result.overallScore).toBe(0);
    expect(result.totalSessions).toBe(0);
    expect(result.engagedRate).toBe(0);
    expect(result.achievedRate).toBe(0);
    expect(result.supportTypeVariety).toBe(0);
    expect(result.averageSessionsPerChild).toBe(0);
  });

  it("scores high for engaged achieved sessions", () => {
    const sessions = [
      mkSession({ id: "ess-1", supportType: "careers_guidance" }),
      mkSession({ id: "ess-2", supportType: "cv_writing" }),
      mkSession({ id: "ess-3", supportType: "interview_skills" }),
    ];
    const result = evaluateSkillDevelopment(sessions, 1);
    expect(result.overallScore).toBeGreaterThanOrEqual(15);
    expect(result.engagedRate).toBe(100);
    expect(result.achievedRate).toBe(100);
  });

  it("scores low for disengaged not-started sessions", () => {
    const sessions = [mkSession({ childEngaged: "disengaged", outcomeStatus: "not_started" })];
    const result = evaluateSkillDevelopment(sessions, 1);
    expect(result.engagedRate).toBe(0);
    expect(result.achievedRate).toBe(0);
  });

  it("counts support type variety", () => {
    const sessions = [
      mkSession({ id: "ess-1", supportType: "careers_guidance" }),
      mkSession({ id: "ess-2", supportType: "cv_writing" }),
      mkSession({ id: "ess-3", supportType: "financial_literacy" }),
      mkSession({ id: "ess-4", supportType: "work_experience" }),
    ];
    const result = evaluateSkillDevelopment(sessions, 1);
    expect(result.supportTypeVariety).toBe(4);
  });

  it("calculates average sessions per child", () => {
    const sessions = [
      mkSession({ id: "ess-1", childId: "child-1" }),
      mkSession({ id: "ess-2", childId: "child-1" }),
      mkSession({ id: "ess-3", childId: "child-2" }),
      mkSession({ id: "ess-4", childId: "child-2" }),
    ];
    const result = evaluateSkillDevelopment(sessions, 2);
    expect(result.averageSessionsPerChild).toBe(2);
  });

  it("counts highly_engaged as engaged", () => {
    const sessions = [mkSession({ childEngaged: "highly_engaged" })];
    const result = evaluateSkillDevelopment(sessions, 1);
    expect(result.engagedRate).toBe(100);
  });

  it("partially_engaged not counted as engaged", () => {
    const sessions = [mkSession({ childEngaged: "partially_engaged" })];
    const result = evaluateSkillDevelopment(sessions, 1);
    expect(result.engagedRate).toBe(0);
  });

  it("gives higher score for more sessions per child", () => {
    const oneSess = evaluateSkillDevelopment([mkSession()], 1);
    const threeSess = evaluateSkillDevelopment(
      [mkSession({ id: "e1" }), mkSession({ id: "e2" }), mkSession({ id: "e3" })],
      1,
    );
    expect(threeSess.overallScore).toBeGreaterThanOrEqual(oneSess.overallScore);
  });

  it("score capped at 25", () => {
    const sessions = Array.from({ length: 10 }, (_, i) =>
      mkSession({ id: `ess-${i}`, supportType: (["careers_guidance", "cv_writing", "interview_skills", "financial_literacy", "work_experience", "apprenticeship_search", "college_application", "volunteering"] as const)[i % 8] }),
    );
    const result = evaluateSkillDevelopment(sessions, 1);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("uses profileCount for regularity when provided", () => {
    const sessions = [mkSession({ id: "e1" }), mkSession({ id: "e2" })];
    const result = evaluateSkillDevelopment(sessions, 4);
    // 2 sessions / 4 profiles = 0.5 per child, low regularity
    expect(result.overallScore).toBeLessThan(25);
  });
});

// -- evaluatePartnershipAccess ------------------------------------------------

describe("evaluatePartnershipAccess", () => {
  it("returns 0 for empty partnerships", () => {
    const result = evaluatePartnershipAccess([], 0);
    expect(result.overallScore).toBe(0);
    expect(result.totalPartnerships).toBe(0);
    expect(result.activeRate).toBe(0);
    expect(result.totalOpportunities).toBe(0);
    expect(result.employerEngagementCount).toBe(0);
    expect(result.childrenAccessingRate).toBe(0);
  });

  it("scores high for active employer partnerships", () => {
    const partnerships = [
      mkPartnership({ id: "pr-1", partnerType: "employer", activeEngagement: true, opportunitiesProvided: 3 }),
      mkPartnership({ id: "pr-2", partnerId: "p2", partnerName: "College", partnerType: "college", activeEngagement: true, opportunitiesProvided: 2 }),
    ];
    const result = evaluatePartnershipAccess(partnerships, 1);
    expect(result.overallScore).toBeGreaterThanOrEqual(15);
    expect(result.activeRate).toBe(100);
  });

  it("scores low for inactive partnerships", () => {
    const partnerships = [mkPartnership({ activeEngagement: false, opportunitiesProvided: 0, childrenSupported: [] })];
    const result = evaluatePartnershipAccess(partnerships, 3);
    expect(result.activeRate).toBe(0);
    expect(result.overallScore).toBeLessThan(15);
  });

  it("counts employer partnerships", () => {
    const partnerships = [
      mkPartnership({ id: "pr-1", partnerType: "employer" }),
      mkPartnership({ id: "pr-2", partnerId: "p2", partnerType: "college" }),
      mkPartnership({ id: "pr-3", partnerId: "p3", partnerType: "employer" }),
    ];
    const result = evaluatePartnershipAccess(partnerships, 2);
    expect(result.employerEngagementCount).toBe(2);
  });

  it("calculates total opportunities", () => {
    const partnerships = [
      mkPartnership({ id: "pr-1", opportunitiesProvided: 3 }),
      mkPartnership({ id: "pr-2", partnerId: "p2", opportunitiesProvided: 5 }),
    ];
    const result = evaluatePartnershipAccess(partnerships, 2);
    expect(result.totalOpportunities).toBe(8);
  });

  it("calculates children accessing rate", () => {
    const partnerships = [
      mkPartnership({ id: "pr-1", childrenSupported: ["child-1", "child-2"] }),
      mkPartnership({ id: "pr-2", partnerId: "p2", childrenSupported: ["child-2", "child-3"] }),
    ];
    const result = evaluatePartnershipAccess(partnerships, 4);
    // 3 unique children out of 4
    expect(result.childrenAccessingRate).toBe(75);
  });

  it("deduplicates children across partnerships", () => {
    const partnerships = [
      mkPartnership({ id: "pr-1", childrenSupported: ["child-1"] }),
      mkPartnership({ id: "pr-2", partnerId: "p2", childrenSupported: ["child-1"] }),
    ];
    const result = evaluatePartnershipAccess(partnerships, 2);
    expect(result.childrenAccessingRate).toBe(50);
  });

  it("score capped at 25", () => {
    const partnerships = [
      mkPartnership({ id: "pr-1", partnerType: "employer", opportunitiesProvided: 10, childrenSupported: ["c1", "c2", "c3"] }),
      mkPartnership({ id: "pr-2", partnerId: "p2", partnerType: "employer", opportunitiesProvided: 10, childrenSupported: ["c1", "c2", "c3"] }),
      mkPartnership({ id: "pr-3", partnerId: "p3", partnerType: "employer", opportunitiesProvided: 10, childrenSupported: ["c1", "c2", "c3"] }),
    ];
    const result = evaluatePartnershipAccess(partnerships, 3);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("gives higher score for more employer partnerships", () => {
    const oneEmployer = evaluatePartnershipAccess([mkPartnership({ partnerType: "employer" })], 1);
    const threeEmployers = evaluatePartnershipAccess([
      mkPartnership({ id: "p1", partnerType: "employer" }),
      mkPartnership({ id: "p2", partnerId: "p2", partnerType: "employer" }),
      mkPartnership({ id: "p3", partnerId: "p3", partnerType: "employer" }),
    ], 1);
    expect(threeEmployers.overallScore).toBeGreaterThanOrEqual(oneEmployer.overallScore);
  });

  it("gives higher score for more opportunities", () => {
    const few = evaluatePartnershipAccess([mkPartnership({ opportunitiesProvided: 1 })], 1);
    const many = evaluatePartnershipAccess([mkPartnership({ opportunitiesProvided: 10 })], 1);
    expect(many.overallScore).toBeGreaterThanOrEqual(few.overallScore);
  });
});

// -- evaluateStaffReadiness ---------------------------------------------------

describe("evaluateStaffReadiness", () => {
  it("returns 0 for empty training", () => {
    const result = evaluateStaffReadiness([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalStaff).toBe(0);
    expect(result.careersGuidanceRate).toBe(0);
    expect(result.cvInterviewRate).toBe(0);
    expect(result.financialLiteracyRate).toBe(0);
    expect(result.apprenticeshipRate).toBe(0);
    expect(result.labourMarketRate).toBe(0);
    expect(result.motivationalInterviewingRate).toBe(0);
  });

  it("scores high for fully trained staff", () => {
    const training = [mkTraining(), mkTraining({ id: "set-2", staffId: "s2" })];
    const result = evaluateStaffReadiness(training);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
    expect(result.careersGuidanceRate).toBe(100);
    expect(result.cvInterviewRate).toBe(100);
  });

  it("scores 0 for completely untrained staff", () => {
    const training = [mkTraining({
      careersGuidanceTrained: false,
      cvInterviewSupport: false,
      financialLiteracyTrained: false,
      apprenticeshipAwareness: false,
      localLabourMarket: false,
      motivationalInterviewing: false,
    })];
    const result = evaluateStaffReadiness(training);
    expect(result.overallScore).toBe(0);
  });

  it("calculates partial rates", () => {
    const training = [
      mkTraining({ id: "set-1", staffId: "s1" }),
      mkTraining({ id: "set-2", staffId: "s2", careersGuidanceTrained: false, financialLiteracyTrained: false }),
    ];
    const result = evaluateStaffReadiness(training);
    expect(result.careersGuidanceRate).toBe(50);
    expect(result.financialLiteracyRate).toBe(50);
    expect(result.cvInterviewRate).toBe(100);
  });

  it("score capped at 25", () => {
    const result = evaluateStaffReadiness([mkTraining()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("returns correct totalStaff", () => {
    const training = [
      mkTraining({ id: "set-1", staffId: "s1" }),
      mkTraining({ id: "set-2", staffId: "s2" }),
      mkTraining({ id: "set-3", staffId: "s3" }),
    ];
    const result = evaluateStaffReadiness(training);
    expect(result.totalStaff).toBe(3);
  });

  it("higher weight on careers guidance than motivational interviewing", () => {
    const careersOnly = evaluateStaffReadiness([mkTraining({
      careersGuidanceTrained: true,
      cvInterviewSupport: false,
      financialLiteracyTrained: false,
      apprenticeshipAwareness: false,
      localLabourMarket: false,
      motivationalInterviewing: false,
    })]);
    const motivationalOnly = evaluateStaffReadiness([mkTraining({
      careersGuidanceTrained: false,
      cvInterviewSupport: false,
      financialLiteracyTrained: false,
      apprenticeshipAwareness: false,
      localLabourMarket: false,
      motivationalInterviewing: true,
    })]);
    expect(careersOnly.overallScore).toBeGreaterThan(motivationalOnly.overallScore);
  });
});

// -- buildChildEmploymentProfiles ---------------------------------------------

describe("buildChildEmploymentProfiles", () => {
  it("returns empty for no profiles", () => {
    expect(buildChildEmploymentProfiles([], [])).toEqual([]);
  });

  it("builds profile for each child", () => {
    const profiles = [
      mkProfile({ id: "cep-1", childId: "child-1", childName: "Alex" }),
      mkProfile({ id: "cep-2", childId: "child-2", childName: "Morgan" }),
    ];
    const result = buildChildEmploymentProfiles(profiles, []);
    expect(result).toHaveLength(2);
    expect(result[0].childId).toBe("child-1");
    expect(result[1].childId).toBe("child-2");
  });

  it("counts sessions in period", () => {
    const profiles = [mkProfile()];
    const sessions = [
      mkSession({ id: "ess-1", childId: "child-1" }),
      mkSession({ id: "ess-2", childId: "child-1" }),
    ];
    const result = buildChildEmploymentProfiles(profiles, sessions);
    expect(result[0].sessionsInPeriod).toBe(2);
  });

  it("counts skills achieved", () => {
    const profiles = [mkProfile()];
    const sessions = [
      mkSession({ id: "ess-1", childId: "child-1", outcomeStatus: "achieved" }),
      mkSession({ id: "ess-2", childId: "child-1", outcomeStatus: "in_progress" }),
      mkSession({ id: "ess-3", childId: "child-1", outcomeStatus: "achieved" }),
    ];
    const result = buildChildEmploymentProfiles(profiles, sessions);
    expect(result[0].skillsAchieved).toBe(2);
  });

  it("calculates engagement score", () => {
    const profiles = [mkProfile()];
    const sessions = [
      mkSession({ id: "ess-1", childId: "child-1", childEngaged: "highly_engaged" }),
      mkSession({ id: "ess-2", childId: "child-1", childEngaged: "disengaged" }),
    ];
    const result = buildChildEmploymentProfiles(profiles, sessions);
    expect(result[0].engagementScore).toBe(5); // 1/2 = 50% -> round(0.5 * 10) = 5
  });

  it("engagement score is 0 with no sessions", () => {
    const profiles = [mkProfile()];
    const result = buildChildEmploymentProfiles(profiles, []);
    expect(result[0].engagementScore).toBe(0);
  });

  it("tracks hasPlan and planCurrent", () => {
    const profiles = [
      mkProfile({ id: "cep-1", childId: "c1", careersPlanExists: true, careersPlanStatus: "current" }),
      mkProfile({ id: "cep-2", childId: "c2", careersPlanExists: true, careersPlanStatus: "overdue" }),
      mkProfile({ id: "cep-3", childId: "c3", careersPlanExists: false, careersPlanStatus: "not_in_place" }),
    ];
    const result = buildChildEmploymentProfiles(profiles, []);
    expect(result[0].hasPlan).toBe(true);
    expect(result[0].planCurrent).toBe(true);
    expect(result[1].hasPlan).toBe(true);
    expect(result[1].planCurrent).toBe(false);
    expect(result[2].hasPlan).toBe(false);
    expect(result[2].planCurrent).toBe(false);
  });

  it("preserves age", () => {
    const profiles = [mkProfile({ age: 16 })];
    const result = buildChildEmploymentProfiles(profiles, []);
    expect(result[0].age).toBe(16);
  });

  it("scores high for fully prepared child", () => {
    const profiles = [mkProfile()];
    const sessions = [
      mkSession({ id: "ess-1", childId: "child-1" }),
      mkSession({ id: "ess-2", childId: "child-1" }),
    ];
    const result = buildChildEmploymentProfiles(profiles, sessions);
    expect(result[0].overallScore).toBeGreaterThanOrEqual(8);
  });

  it("scores low for child with nothing in place", () => {
    const profiles = [mkProfile({
      careersPlanExists: false,
      careersPlanStatus: "not_in_place",
      careerAspirations: [],
      workExperienceCompleted: false,
      cvPrepared: false,
      interviewPracticed: false,
      financialLiteracyAssessed: false,
      personalAdviserEngaged: false,
    })];
    const result = buildChildEmploymentProfiles(profiles, []);
    expect(result[0].overallScore).toBe(0);
  });

  it("score capped at 10", () => {
    const profiles = [mkProfile()];
    const sessions = Array.from({ length: 10 }, (_, i) => mkSession({ id: `ess-${i}`, childId: "child-1" }));
    const result = buildChildEmploymentProfiles(profiles, sessions);
    expect(result[0].overallScore).toBeLessThanOrEqual(10);
  });

  it("does not count sessions from other children", () => {
    const profiles = [mkProfile({ childId: "child-1" })];
    const sessions = [
      mkSession({ id: "ess-1", childId: "child-2" }),
      mkSession({ id: "ess-2", childId: "child-2" }),
    ];
    const result = buildChildEmploymentProfiles(profiles, sessions);
    expect(result[0].sessionsInPeriod).toBe(0);
  });
});

// -- generateYoungPersonEmploymentSupportIntelligence -------------------------

describe("generateYoungPersonEmploymentSupportIntelligence", () => {
  it("assembles all four evaluator scores", () => {
    const result = generateYoungPersonEmploymentSupportIntelligence(
      [mkProfile()], [mkSession()], [mkPartnership()], [mkTraining()],
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.overallScore).toBe(
      result.careersPlanQuality.overallScore +
      result.skillDevelopment.overallScore +
      result.partnershipAccess.overallScore +
      result.staffReadiness.overallScore,
    );
  });

  it("returns inadequate with no data", () => {
    const result = generateYoungPersonEmploymentSupportIntelligence(
      [], [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
  });

  it("returns outstanding for fully compliant home", () => {
    const profiles = [mkProfile(), mkProfile({ id: "cep-2", childId: "child-2", childName: "Morgan" })];
    const sessions = Array.from({ length: 8 }, (_, i) => mkSession({
      id: `ess-${i}`,
      supportType: (["careers_guidance", "cv_writing", "interview_skills", "financial_literacy", "work_experience", "apprenticeship_search", "college_application", "volunteering"] as const)[i % 8],
    }));
    const partnerships = [
      mkPartnership({ id: "pr-1", partnerType: "employer", opportunitiesProvided: 3, childrenSupported: ["child-1", "child-2"] }),
      mkPartnership({ id: "pr-2", partnerId: "p2", partnerType: "college", opportunitiesProvided: 2, childrenSupported: ["child-1", "child-2"] }),
      mkPartnership({ id: "pr-3", partnerId: "p3", partnerType: "employer", opportunitiesProvided: 3, childrenSupported: ["child-1"] }),
    ];
    const training = [mkTraining(), mkTraining({ id: "set-2", staffId: "s2" })];
    const result = generateYoungPersonEmploymentSupportIntelligence(
      profiles, sessions, partnerships, training,
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.rating).toBe("outstanding");
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
  });

  it("score capped at 100", () => {
    const result = generateYoungPersonEmploymentSupportIntelligence(
      [mkProfile()], [mkSession()], [mkPartnership()], [mkTraining()],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("populates homeId and period", () => {
    const result = generateYoungPersonEmploymentSupportIntelligence(
      [], [], [], [], "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-18");
  });

  it("includes child profiles", () => {
    const result = generateYoungPersonEmploymentSupportIntelligence(
      [mkProfile({ childId: "c1" }), mkProfile({ id: "cep-2", childId: "c2" })],
      [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.childProfiles).toHaveLength(2);
  });

  // -- Strengths --

  it("adds strength for all plans in place", () => {
    const profiles = [mkProfile()];
    const result = generateYoungPersonEmploymentSupportIntelligence(profiles, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("Careers plans in place"))).toBe(true);
  });

  it("adds strength for all plans current", () => {
    const profiles = [mkProfile()];
    const result = generateYoungPersonEmploymentSupportIntelligence(profiles, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("up to date and current"))).toBe(true);
  });

  it("adds strength for aspirations recorded", () => {
    const profiles = [mkProfile()];
    const result = generateYoungPersonEmploymentSupportIntelligence(profiles, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("aspirations recorded"))).toBe(true);
  });

  it("adds strength for high engagement", () => {
    const sessions = Array.from({ length: 4 }, (_, i) => mkSession({ id: `ess-${i}`, childEngaged: "highly_engaged" }));
    const result = generateYoungPersonEmploymentSupportIntelligence([], sessions, [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("High engagement"))).toBe(true);
  });

  it("adds strength for all partnerships active", () => {
    const partnerships = [mkPartnership({ activeEngagement: true })];
    const result = generateYoungPersonEmploymentSupportIntelligence([], [], partnerships, [], "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("All external partnerships actively engaged"))).toBe(true);
  });

  it("adds strength for all staff trained in careers guidance", () => {
    const training = [mkTraining()];
    const result = generateYoungPersonEmploymentSupportIntelligence([], [], [], training, "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("All staff trained in careers guidance"))).toBe(true);
  });

  it("adds strength for employer partnerships", () => {
    const partnerships = [
      mkPartnership({ id: "p1", partnerType: "employer" }),
      mkPartnership({ id: "p2", partnerId: "p2", partnerType: "employer" }),
    ];
    const result = generateYoungPersonEmploymentSupportIntelligence([], [], partnerships, [], "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("employer partnerships"))).toBe(true);
  });

  it("no strengths for no plans in place", () => {
    const profiles = [mkProfile({ careersPlanExists: false, careersPlanStatus: "not_in_place" })];
    const result = generateYoungPersonEmploymentSupportIntelligence(profiles, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("Careers plans in place"))).toBe(false);
  });

  // -- Areas for Improvement --

  it("adds area for no profiles documented", () => {
    const result = generateYoungPersonEmploymentSupportIntelligence([], [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.areasForImprovement.some((a) => a.includes("No employment profiles documented"))).toBe(true);
  });

  it("adds area for missing plans", () => {
    const profiles = [
      mkProfile({ id: "cep-1", childId: "c1" }),
      mkProfile({ id: "cep-2", childId: "c2", careersPlanExists: false }),
    ];
    const result = generateYoungPersonEmploymentSupportIntelligence(profiles, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.areasForImprovement.some((a) => a.includes("Careers plans missing"))).toBe(true);
  });

  it("adds area for overdue plans", () => {
    const profiles = [mkProfile({ careersPlanStatus: "overdue" })];
    const result = generateYoungPersonEmploymentSupportIntelligence(profiles, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.areasForImprovement.some((a) => a.includes("overdue"))).toBe(true);
  });

  it("adds area for no sessions", () => {
    const profiles = [mkProfile()];
    const result = generateYoungPersonEmploymentSupportIntelligence(profiles, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.areasForImprovement.some((a) => a.includes("No employment support sessions"))).toBe(true);
  });

  it("adds area for no partnerships", () => {
    const result = generateYoungPersonEmploymentSupportIntelligence([], [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.areasForImprovement.some((a) => a.includes("No external partnerships"))).toBe(true);
  });

  it("adds area for no training records", () => {
    const result = generateYoungPersonEmploymentSupportIntelligence([], [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.areasForImprovement.some((a) => a.includes("No staff training records"))).toBe(true);
  });

  it("adds area for no employer partnerships", () => {
    const partnerships = [mkPartnership({ partnerType: "college" })];
    const result = generateYoungPersonEmploymentSupportIntelligence([], [], partnerships, [], "test", "2026-01-01", "2026-06-01");
    expect(result.areasForImprovement.some((a) => a.includes("No employer partnerships"))).toBe(true);
  });

  it("adds area for low careers guidance training", () => {
    const training = [
      mkTraining({ id: "s1", staffId: "s1", careersGuidanceTrained: true }),
      mkTraining({ id: "s2", staffId: "s2", careersGuidanceTrained: false }),
      mkTraining({ id: "s3", staffId: "s3", careersGuidanceTrained: false }),
      mkTraining({ id: "s4", staffId: "s4", careersGuidanceTrained: false }),
    ];
    const result = generateYoungPersonEmploymentSupportIntelligence([], [], [], training, "test", "2026-01-01", "2026-06-01");
    expect(result.areasForImprovement.some((a) => a.includes("careers guidance"))).toBe(true);
  });

  // -- Actions --

  it("adds URGENT for children without careers plan", () => {
    const profiles = [mkProfile({ careersPlanExists: false, age: 15 })];
    const result = generateYoungPersonEmploymentSupportIntelligence(profiles, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("without a careers plan"))).toBe(true);
  });

  it("adds URGENT for overdue plans", () => {
    const profiles = [mkProfile({ careersPlanStatus: "overdue" })];
    const result = generateYoungPersonEmploymentSupportIntelligence(profiles, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("overdue"))).toBe(true);
  });

  it("adds URGENT for 16+ without personal adviser", () => {
    const profiles = [mkProfile({ age: 16, personalAdviserEngaged: false })];
    const result = generateYoungPersonEmploymentSupportIntelligence(profiles, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("personal adviser"))).toBe(true);
  });

  it("does not add adviser URGENT for under 16", () => {
    const profiles = [mkProfile({ age: 14, personalAdviserEngaged: false })];
    const result = generateYoungPersonEmploymentSupportIntelligence(profiles, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.actions.some((a) => a.includes("personal adviser"))).toBe(false);
  });

  it("adds action for no sessions", () => {
    const profiles = [mkProfile()];
    const result = generateYoungPersonEmploymentSupportIntelligence(profiles, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.actions.some((a) => a.includes("Schedule employment support sessions"))).toBe(true);
  });

  it("adds action for work experience", () => {
    const profiles = [mkProfile({ workExperienceCompleted: false, age: 15 })];
    const result = generateYoungPersonEmploymentSupportIntelligence(profiles, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.actions.some((a) => a.includes("work experience"))).toBe(true);
  });

  it("adds action for CV preparation", () => {
    const profiles = [mkProfile({ cvPrepared: false, age: 15 })];
    const result = generateYoungPersonEmploymentSupportIntelligence(profiles, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.actions.some((a) => a.includes("CV"))).toBe(true);
  });

  it("does not add work experience action for under 15", () => {
    const profiles = [mkProfile({ workExperienceCompleted: false, age: 14 })];
    const result = generateYoungPersonEmploymentSupportIntelligence(profiles, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.actions.some((a) => a.includes("work experience placements"))).toBe(false);
  });

  it("adds action to develop partnerships when none exist", () => {
    const profiles = [mkProfile()];
    const result = generateYoungPersonEmploymentSupportIntelligence(profiles, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.actions.some((a) => a.includes("Develop external partnerships"))).toBe(true);
  });

  it("adds action for establishing employer partnership", () => {
    const partnerships = [mkPartnership({ partnerType: "college" })];
    const result = generateYoungPersonEmploymentSupportIntelligence([mkProfile()], [], partnerships, [], "test", "2026-01-01", "2026-06-01");
    expect(result.actions.some((a) => a.includes("Establish at least one employer partnership"))).toBe(true);
  });

  // -- Regulatory links --

  it("includes all 7 regulatory links", () => {
    const result = generateYoungPersonEmploymentSupportIntelligence([], [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.regulatoryLinks).toHaveLength(7);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015, Reg 8"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015, Reg 9"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("NMS 8"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Careers Strategy 2017"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("UNCRC Article 28"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("UNCRC Article 32"))).toBe(true);
  });

  // -- Integration --

  it("handles realistic Chamberlain House scenario", () => {
    const profiles = [
      mkProfile({ id: "cep-alex", childId: "child-alex", childName: "Alex", age: 14, careersPlanExists: true, careersPlanStatus: "current", careerAspirations: ["Chef"], workExperienceCompleted: true, cvPrepared: true, interviewPracticed: false, financialLiteracyAssessed: false, personalAdviserEngaged: false }),
      mkProfile({ id: "cep-jordan", childId: "child-jordan", childName: "Jordan", age: 13, careersPlanExists: false, careersPlanStatus: "not_in_place", careerAspirations: ["Artist"], workExperienceCompleted: false, cvPrepared: false, interviewPracticed: false, financialLiteracyAssessed: false, personalAdviserEngaged: false }),
      mkProfile({ id: "cep-morgan", childId: "child-morgan", childName: "Morgan", age: 15, careersPlanExists: true, careersPlanStatus: "current", careerAspirations: ["IT Technician", "Game Developer"], workExperienceCompleted: true, cvPrepared: true, interviewPracticed: true, financialLiteracyAssessed: true, personalAdviserEngaged: true }),
    ];
    const sessions = [
      mkSession({ id: "ess-1", childId: "child-alex", supportType: "cv_writing", childEngaged: "partially_engaged", outcomeStatus: "achieved" }),
      mkSession({ id: "ess-2", childId: "child-alex", supportType: "work_experience", childEngaged: "engaged", outcomeStatus: "achieved" }),
      mkSession({ id: "ess-3", childId: "child-morgan", supportType: "careers_guidance", childEngaged: "highly_engaged", outcomeStatus: "achieved" }),
      mkSession({ id: "ess-4", childId: "child-morgan", supportType: "interview_skills", childEngaged: "highly_engaged", outcomeStatus: "achieved" }),
      mkSession({ id: "ess-5", childId: "child-morgan", supportType: "financial_literacy", childEngaged: "engaged", outcomeStatus: "achieved" }),
      mkSession({ id: "ess-6", childId: "child-jordan", supportType: "careers_guidance", childEngaged: "engaged", outcomeStatus: "in_progress" }),
    ];
    const partnerships = [
      mkPartnership({ id: "pr-1", partnerId: "partner-cafe", partnerName: "Local Cafe", partnerType: "employer", activeEngagement: true, opportunitiesProvided: 2, childrenSupported: ["child-alex", "child-morgan"] }),
      mkPartnership({ id: "pr-2", partnerId: "partner-college", partnerName: "City College", partnerType: "college", activeEngagement: true, opportunitiesProvided: 3, childrenSupported: ["child-morgan"] }),
      mkPartnership({ id: "pr-3", partnerId: "partner-volunteer", partnerName: "Community Hub", partnerType: "volunteer_org", activeEngagement: true, opportunitiesProvided: 1, childrenSupported: ["child-alex"] }),
    ];
    const training = [
      mkTraining({ id: "set-1", staffId: "staff-sarah", staffName: "Sarah Johnson", careersGuidanceTrained: true, cvInterviewSupport: true, financialLiteracyTrained: true, apprenticeshipAwareness: true, localLabourMarket: true, motivationalInterviewing: true }),
      mkTraining({ id: "set-2", staffId: "staff-tom", staffName: "Tom Richards", careersGuidanceTrained: true, cvInterviewSupport: true, financialLiteracyTrained: false, apprenticeshipAwareness: true, localLabourMarket: false, motivationalInterviewing: false }),
      mkTraining({ id: "set-3", staffId: "staff-lisa", staffName: "Lisa Williams", careersGuidanceTrained: true, cvInterviewSupport: true, financialLiteracyTrained: true, apprenticeshipAwareness: true, localLabourMarket: true, motivationalInterviewing: true }),
      mkTraining({ id: "set-4", staffId: "staff-darren", staffName: "Darren Laville", careersGuidanceTrained: true, cvInterviewSupport: true, financialLiteracyTrained: true, apprenticeshipAwareness: true, localLabourMarket: true, motivationalInterviewing: true }),
    ];

    const result = generateYoungPersonEmploymentSupportIntelligence(
      profiles, sessions, partnerships, training,
      "oak-house", "2026-01-01", "2026-05-18",
    );

    expect(result.rating).toBeDefined();
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.childProfiles).toHaveLength(3);
    expect(result.regulatoryLinks).toHaveLength(7);
    expect(result.homeId).toBe("oak-house");

    // Morgan should have the highest child profile score
    const morgan = result.childProfiles.find((p) => p.childId === "child-morgan");
    const alex = result.childProfiles.find((p) => p.childId === "child-alex");
    expect(morgan!.overallScore).toBeGreaterThan(alex!.overallScore);
  });

  it("rating aligns with score", () => {
    const resultHigh = generateYoungPersonEmploymentSupportIntelligence(
      [mkProfile(), mkProfile({ id: "cep-2", childId: "c2" })],
      Array.from({ length: 8 }, (_, i) => mkSession({ id: `e${i}`, supportType: (["careers_guidance", "cv_writing", "interview_skills", "financial_literacy", "work_experience", "apprenticeship_search", "college_application", "volunteering"] as const)[i % 8] })),
      [mkPartnership({ opportunitiesProvided: 5 }), mkPartnership({ id: "p2", partnerId: "p2", partnerType: "employer", opportunitiesProvided: 5, childrenSupported: ["child-1", "c2"] })],
      [mkTraining(), mkTraining({ id: "set-2", staffId: "s2" })],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(resultHigh.rating).toBe(getRating(resultHigh.overallScore));

    const resultLow = generateYoungPersonEmploymentSupportIntelligence(
      [], [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(resultLow.rating).toBe(getRating(resultLow.overallScore));
  });

  it("strength count increases with better data", () => {
    const poor = generateYoungPersonEmploymentSupportIntelligence([], [], [], [], "test", "2026-01-01", "2026-06-01");
    const good = generateYoungPersonEmploymentSupportIntelligence(
      [mkProfile()],
      [mkSession()],
      [mkPartnership()],
      [mkTraining()],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(good.strengths.length).toBeGreaterThan(poor.strengths.length);
  });

  it("areas for improvement decrease with better data", () => {
    const poor = generateYoungPersonEmploymentSupportIntelligence([], [], [], [], "test", "2026-01-01", "2026-06-01");
    const good = generateYoungPersonEmploymentSupportIntelligence(
      [mkProfile()],
      [mkSession()],
      [mkPartnership()],
      [mkTraining()],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(good.areasForImprovement.length).toBeLessThan(poor.areasForImprovement.length);
  });
});
