import { describe, it, expect } from "vitest";
import {
  generateTransitionPathwayPlanningIntelligence,
  evaluatePathwayPlanning,
  evaluateIndependenceSkills,
  evaluateTransitionMeetings,
  evaluateStaffTransitionReadiness,
  buildChildTransitionProfiles,
  pct,
  getRating,
  getTransitionTypeLabel,
  getPathwayStatusLabel,
  getSkillAreaLabel,
  getSkillLevelLabel,
  getRatingLabel,
} from "../transition-pathway-planning-engine";
import type {
  PathwayPlan,
  IndependenceSkillAssessment,
  TransitionMeeting,
  StaffTransitionTraining,
} from "../transition-pathway-planning-engine";

// -- Test Factories -----------------------------------------------------------

function mkPlan(overrides: Partial<PathwayPlan> = {}): PathwayPlan {
  return {
    id: "pp-1",
    childId: "child-1",
    childName: "Alex",
    planDate: "2026-01-15",
    transitionType: "leaving_care",
    pathwayStatus: "on_track",
    personalAdviserAssigned: true,
    planReviewedRegularly: true,
    childViewsIncluded: true,
    accommodationIdentified: true,
    financialPlanInPlace: true,
    healthPassportCompleted: true,
    ...overrides,
  };
}

function mkSkill(overrides: Partial<IndependenceSkillAssessment> = {}): IndependenceSkillAssessment {
  return {
    id: "isa-1",
    childId: "child-1",
    childName: "Alex",
    assessmentDate: "2026-03-01",
    assessedBy: "Sarah Johnson",
    skillArea: "budgeting",
    currentLevel: "competent",
    supportInPlace: true,
    progressRecorded: true,
    ...overrides,
  };
}

function mkMeeting(overrides: Partial<TransitionMeeting> = {}): TransitionMeeting {
  return {
    id: "tm-1",
    childId: "child-1",
    childName: "Alex",
    meetingDate: "2026-02-15",
    attendees: ["Sarah Johnson", "Alex", "Social Worker"],
    minutesRecorded: true,
    actionsAgreed: true,
    childAttended: true,
    socialWorkerPresent: true,
    nextMeetingScheduled: true,
    ...overrides,
  };
}

function mkTraining(overrides: Partial<StaffTransitionTraining> = {}): StaffTransitionTraining {
  return {
    id: "stt-1",
    staffId: "staff-1",
    staffName: "Sarah Johnson",
    leavingCarePolicy: true,
    pathwayPlanning: true,
    independenceSkills: true,
    housingOptions: true,
    financialCapability: true,
    emotionalSupport: true,
    ...overrides,
  };
}

// -- pct ----------------------------------------------------------------------

describe("pct", () => {
  it("returns 0 for 0/0", () => expect(pct(0, 0)).toBe(0));
  it("calculates correctly", () => expect(pct(3, 4)).toBe(75));
  it("rounds", () => expect(pct(1, 3)).toBe(33));
  it("full", () => expect(pct(5, 5)).toBe(100));
  it("handles large numerator", () => expect(pct(99, 100)).toBe(99));
  it("handles 1/1", () => expect(pct(1, 1)).toBe(100));
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
  it("getTransitionTypeLabel — leaving_care", () => expect(getTransitionTypeLabel("leaving_care")).toBe("Leaving Care"));
  it("getTransitionTypeLabel — step_down", () => expect(getTransitionTypeLabel("step_down")).toBe("Step Down"));
  it("getTransitionTypeLabel — foster_care", () => expect(getTransitionTypeLabel("foster_care")).toBe("Foster Care"));
  it("getTransitionTypeLabel — semi_independence", () => expect(getTransitionTypeLabel("semi_independence")).toBe("Semi-Independence"));
  it("getTransitionTypeLabel — supported_living", () => expect(getTransitionTypeLabel("supported_living")).toBe("Supported Living"));
  it("getTransitionTypeLabel — return_home", () => expect(getTransitionTypeLabel("return_home")).toBe("Return Home"));
  it("getTransitionTypeLabel — adoption", () => expect(getTransitionTypeLabel("adoption")).toBe("Adoption"));
  it("getTransitionTypeLabel — other", () => expect(getTransitionTypeLabel("other")).toBe("Other"));

  it("getPathwayStatusLabel — not_started", () => expect(getPathwayStatusLabel("not_started")).toBe("Not Started"));
  it("getPathwayStatusLabel — in_progress", () => expect(getPathwayStatusLabel("in_progress")).toBe("In Progress"));
  it("getPathwayStatusLabel — on_track", () => expect(getPathwayStatusLabel("on_track")).toBe("On Track"));
  it("getPathwayStatusLabel — at_risk", () => expect(getPathwayStatusLabel("at_risk")).toBe("At Risk"));
  it("getPathwayStatusLabel — completed", () => expect(getPathwayStatusLabel("completed")).toBe("Completed"));

  it("getSkillAreaLabel — budgeting", () => expect(getSkillAreaLabel("budgeting")).toBe("Budgeting"));
  it("getSkillAreaLabel — cooking", () => expect(getSkillAreaLabel("cooking")).toBe("Cooking"));
  it("getSkillAreaLabel — cleaning", () => expect(getSkillAreaLabel("cleaning")).toBe("Cleaning"));
  it("getSkillAreaLabel — laundry", () => expect(getSkillAreaLabel("laundry")).toBe("Laundry"));
  it("getSkillAreaLabel — shopping", () => expect(getSkillAreaLabel("shopping")).toBe("Shopping"));
  it("getSkillAreaLabel — travel", () => expect(getSkillAreaLabel("travel")).toBe("Travel"));
  it("getSkillAreaLabel — health_management", () => expect(getSkillAreaLabel("health_management")).toBe("Health Management"));
  it("getSkillAreaLabel — tenancy_management", () => expect(getSkillAreaLabel("tenancy_management")).toBe("Tenancy Management"));
  it("getSkillAreaLabel — employment_readiness", () => expect(getSkillAreaLabel("employment_readiness")).toBe("Employment Readiness"));
  it("getSkillAreaLabel — education_continuation", () => expect(getSkillAreaLabel("education_continuation")).toBe("Education Continuation"));
  it("getSkillAreaLabel — emotional_resilience", () => expect(getSkillAreaLabel("emotional_resilience")).toBe("Emotional Resilience"));
  it("getSkillAreaLabel — social_skills", () => expect(getSkillAreaLabel("social_skills")).toBe("Social Skills"));

  it("getSkillLevelLabel — not_started", () => expect(getSkillLevelLabel("not_started")).toBe("Not Started"));
  it("getSkillLevelLabel — developing", () => expect(getSkillLevelLabel("developing")).toBe("Developing"));
  it("getSkillLevelLabel — competent", () => expect(getSkillLevelLabel("competent")).toBe("Competent"));
  it("getSkillLevelLabel — independent", () => expect(getSkillLevelLabel("independent")).toBe("Independent"));

  it("getRatingLabel — outstanding", () => expect(getRatingLabel("outstanding")).toBe("Outstanding"));
  it("getRatingLabel — good", () => expect(getRatingLabel("good")).toBe("Good"));
  it("getRatingLabel — requires_improvement", () => expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement"));
  it("getRatingLabel — inadequate", () => expect(getRatingLabel("inadequate")).toBe("Inadequate"));
});

// -- evaluatePathwayPlanning --------------------------------------------------

describe("evaluatePathwayPlanning", () => {
  it("returns 0 for empty plans", () => {
    const result = evaluatePathwayPlanning([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalPlans).toBe(0);
    expect(result.personalAdviserRate).toBe(0);
    expect(result.planReviewedRate).toBe(0);
    expect(result.childViewsRate).toBe(0);
    expect(result.accommodationRate).toBe(0);
    expect(result.financialPlanRate).toBe(0);
    expect(result.healthPassportRate).toBe(0);
  });

  it("scores max for fully compliant plans", () => {
    const result = evaluatePathwayPlanning([mkPlan(), mkPlan({ id: "pp-2", childId: "child-2", childName: "Jordan" })]);
    expect(result.overallScore).toBe(25);
    expect(result.personalAdviserRate).toBe(100);
    expect(result.planReviewedRate).toBe(100);
    expect(result.childViewsRate).toBe(100);
    expect(result.accommodationRate).toBe(100);
    expect(result.financialPlanRate).toBe(100);
    expect(result.healthPassportRate).toBe(100);
  });

  it("returns total plans count", () => {
    const result = evaluatePathwayPlanning([mkPlan(), mkPlan({ id: "pp-2" }), mkPlan({ id: "pp-3" })]);
    expect(result.totalPlans).toBe(3);
  });

  it("scores 0 when all flags are false", () => {
    const plan = mkPlan({
      personalAdviserAssigned: false,
      planReviewedRegularly: false,
      childViewsIncluded: false,
      accommodationIdentified: false,
      financialPlanInPlace: false,
      healthPassportCompleted: false,
    });
    const result = evaluatePathwayPlanning([plan]);
    expect(result.overallScore).toBe(0);
  });

  it("scales personal adviser rate correctly for partial compliance", () => {
    const plans = [
      mkPlan({ personalAdviserAssigned: true }),
      mkPlan({ id: "pp-2", personalAdviserAssigned: false }),
    ];
    const result = evaluatePathwayPlanning(plans);
    expect(result.personalAdviserRate).toBe(50);
  });

  it("scales plan reviewed rate correctly", () => {
    const plans = [
      mkPlan({ planReviewedRegularly: true }),
      mkPlan({ id: "pp-2", planReviewedRegularly: false }),
      mkPlan({ id: "pp-3", planReviewedRegularly: false }),
    ];
    const result = evaluatePathwayPlanning(plans);
    expect(result.planReviewedRate).toBe(33);
  });

  it("calculates child views rate", () => {
    const plans = [
      mkPlan({ childViewsIncluded: true }),
      mkPlan({ id: "pp-2", childViewsIncluded: true }),
      mkPlan({ id: "pp-3", childViewsIncluded: false }),
    ];
    const result = evaluatePathwayPlanning(plans);
    expect(result.childViewsRate).toBe(67);
  });

  it("cap at 25", () => {
    const result = evaluatePathwayPlanning([mkPlan()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("calculates accommodation rate", () => {
    const plans = [
      mkPlan({ accommodationIdentified: false }),
      mkPlan({ id: "pp-2", accommodationIdentified: true }),
    ];
    const result = evaluatePathwayPlanning(plans);
    expect(result.accommodationRate).toBe(50);
  });

  it("calculates financial plan rate", () => {
    const plans = [
      mkPlan({ financialPlanInPlace: true }),
      mkPlan({ id: "pp-2", financialPlanInPlace: false }),
    ];
    const result = evaluatePathwayPlanning(plans);
    expect(result.financialPlanRate).toBe(50);
  });

  it("calculates health passport rate", () => {
    const plans = [
      mkPlan({ healthPassportCompleted: false }),
      mkPlan({ id: "pp-2", healthPassportCompleted: true }),
      mkPlan({ id: "pp-3", healthPassportCompleted: true }),
    ];
    const result = evaluatePathwayPlanning(plans);
    expect(result.healthPassportRate).toBe(67);
  });
});

// -- evaluateIndependenceSkills -----------------------------------------------

describe("evaluateIndependenceSkills", () => {
  it("returns 0 for empty assessments", () => {
    const result = evaluateIndependenceSkills([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalAssessments).toBe(0);
    expect(result.competentPlusRate).toBe(0);
    expect(result.supportInPlaceRate).toBe(0);
    expect(result.progressRecordedRate).toBe(0);
    expect(result.skillBreadthScore).toBe(0);
  });

  it("scores well for competent assessments with support and progress", () => {
    const assessments = [
      mkSkill({ skillArea: "budgeting" }),
      mkSkill({ id: "isa-2", skillArea: "cooking" }),
      mkSkill({ id: "isa-3", skillArea: "cleaning" }),
    ];
    const result = evaluateIndependenceSkills(assessments);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.competentPlusRate).toBe(100);
    expect(result.supportInPlaceRate).toBe(100);
    expect(result.progressRecordedRate).toBe(100);
  });

  it("returns total assessments count", () => {
    const assessments = [mkSkill(), mkSkill({ id: "isa-2" }), mkSkill({ id: "isa-3" })];
    const result = evaluateIndependenceSkills(assessments);
    expect(result.totalAssessments).toBe(3);
  });

  it("correctly counts competent+ levels", () => {
    const assessments = [
      mkSkill({ currentLevel: "competent" }),
      mkSkill({ id: "isa-2", currentLevel: "independent" }),
      mkSkill({ id: "isa-3", currentLevel: "developing" }),
      mkSkill({ id: "isa-4", currentLevel: "not_started" }),
    ];
    const result = evaluateIndependenceSkills(assessments);
    expect(result.competentPlusRate).toBe(50);
  });

  it("caps at 25", () => {
    const allSkills: IndependenceSkillAssessment[] = [
      "budgeting", "cooking", "cleaning", "laundry", "shopping", "travel",
      "health_management", "tenancy_management", "employment_readiness",
      "education_continuation", "emotional_resilience", "social_skills",
    ].map((skill, i) => mkSkill({ id: `isa-${i}`, skillArea: skill as IndependenceSkillAssessment["skillArea"] }));
    const result = evaluateIndependenceSkills(allSkills);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("calculates skill breadth for all 12 skill areas", () => {
    const allSkills: IndependenceSkillAssessment[] = [
      "budgeting", "cooking", "cleaning", "laundry", "shopping", "travel",
      "health_management", "tenancy_management", "employment_readiness",
      "education_continuation", "emotional_resilience", "social_skills",
    ].map((skill, i) => mkSkill({ id: `isa-${i}`, skillArea: skill as IndependenceSkillAssessment["skillArea"] }));
    const result = evaluateIndependenceSkills(allSkills);
    expect(result.skillBreadthScore).toBe(6);
  });

  it("calculates skill breadth for partial coverage", () => {
    const assessments = [
      mkSkill({ skillArea: "budgeting" }),
      mkSkill({ id: "isa-2", skillArea: "cooking" }),
      mkSkill({ id: "isa-3", skillArea: "cleaning" }),
    ];
    const result = evaluateIndependenceSkills(assessments);
    // 3/12 = 0.25 -> Math.round(0.25 * 6) = 2 but min(6, 2) = 2
    expect(result.skillBreadthScore).toBe(2);
  });

  it("handles all not_started levels", () => {
    const assessments = [
      mkSkill({ currentLevel: "not_started" }),
      mkSkill({ id: "isa-2", currentLevel: "not_started" }),
    ];
    const result = evaluateIndependenceSkills(assessments);
    expect(result.competentPlusRate).toBe(0);
  });

  it("handles all developing levels", () => {
    const assessments = [
      mkSkill({ currentLevel: "developing" }),
      mkSkill({ id: "isa-2", currentLevel: "developing" }),
    ];
    const result = evaluateIndependenceSkills(assessments);
    expect(result.competentPlusRate).toBe(0);
  });

  it("counts independent as competent+", () => {
    const assessments = [mkSkill({ currentLevel: "independent" })];
    const result = evaluateIndependenceSkills(assessments);
    expect(result.competentPlusRate).toBe(100);
  });

  it("calculates support in place rate correctly", () => {
    const assessments = [
      mkSkill({ supportInPlace: true }),
      mkSkill({ id: "isa-2", supportInPlace: false }),
      mkSkill({ id: "isa-3", supportInPlace: true }),
    ];
    const result = evaluateIndependenceSkills(assessments);
    expect(result.supportInPlaceRate).toBe(67);
  });

  it("calculates progress recorded rate correctly", () => {
    const assessments = [
      mkSkill({ progressRecorded: false }),
      mkSkill({ id: "isa-2", progressRecorded: false }),
      mkSkill({ id: "isa-3", progressRecorded: true }),
    ];
    const result = evaluateIndependenceSkills(assessments);
    expect(result.progressRecordedRate).toBe(33);
  });

  it("duplicate skill areas count once for breadth", () => {
    const assessments = [
      mkSkill({ skillArea: "budgeting" }),
      mkSkill({ id: "isa-2", skillArea: "budgeting" }),
      mkSkill({ id: "isa-3", skillArea: "budgeting" }),
    ];
    const result = evaluateIndependenceSkills(assessments);
    // 1/12 = 0.083 -> Math.round(0.083 * 6) = 1 but min(6, 1) = 1
    expect(result.skillBreadthScore).toBe(1);
  });
});

// -- evaluateTransitionMeetings -----------------------------------------------

describe("evaluateTransitionMeetings", () => {
  it("returns 0 for empty meetings", () => {
    const result = evaluateTransitionMeetings([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalMeetings).toBe(0);
    expect(result.childAttendedRate).toBe(0);
    expect(result.minutesRecordedRate).toBe(0);
    expect(result.actionsAgreedRate).toBe(0);
    expect(result.socialWorkerPresentRate).toBe(0);
    expect(result.nextMeetingScheduledRate).toBe(0);
  });

  it("scores max for fully compliant meetings", () => {
    const meetings = [mkMeeting(), mkMeeting({ id: "tm-2" })];
    const result = evaluateTransitionMeetings(meetings);
    expect(result.overallScore).toBe(25);
    expect(result.childAttendedRate).toBe(100);
    expect(result.minutesRecordedRate).toBe(100);
    expect(result.actionsAgreedRate).toBe(100);
    expect(result.socialWorkerPresentRate).toBe(100);
    expect(result.nextMeetingScheduledRate).toBe(100);
  });

  it("returns total meetings count", () => {
    const meetings = [mkMeeting(), mkMeeting({ id: "tm-2" }), mkMeeting({ id: "tm-3" })];
    const result = evaluateTransitionMeetings(meetings);
    expect(result.totalMeetings).toBe(3);
  });

  it("scores 0 when all flags are false", () => {
    const meeting = mkMeeting({
      minutesRecorded: false,
      actionsAgreed: false,
      childAttended: false,
      socialWorkerPresent: false,
      nextMeetingScheduled: false,
    });
    const result = evaluateTransitionMeetings([meeting]);
    expect(result.overallScore).toBe(0);
  });

  it("calculates child attended rate for partial compliance", () => {
    const meetings = [
      mkMeeting({ childAttended: true }),
      mkMeeting({ id: "tm-2", childAttended: false }),
      mkMeeting({ id: "tm-3", childAttended: true }),
    ];
    const result = evaluateTransitionMeetings(meetings);
    expect(result.childAttendedRate).toBe(67);
  });

  it("calculates minutes recorded rate", () => {
    const meetings = [
      mkMeeting({ minutesRecorded: true }),
      mkMeeting({ id: "tm-2", minutesRecorded: false }),
    ];
    const result = evaluateTransitionMeetings(meetings);
    expect(result.minutesRecordedRate).toBe(50);
  });

  it("calculates actions agreed rate", () => {
    const meetings = [
      mkMeeting({ actionsAgreed: false }),
      mkMeeting({ id: "tm-2", actionsAgreed: false }),
      mkMeeting({ id: "tm-3", actionsAgreed: true }),
    ];
    const result = evaluateTransitionMeetings(meetings);
    expect(result.actionsAgreedRate).toBe(33);
  });

  it("calculates social worker present rate", () => {
    const meetings = [
      mkMeeting({ socialWorkerPresent: true }),
      mkMeeting({ id: "tm-2", socialWorkerPresent: false }),
    ];
    const result = evaluateTransitionMeetings(meetings);
    expect(result.socialWorkerPresentRate).toBe(50);
  });

  it("calculates next meeting scheduled rate", () => {
    const meetings = [
      mkMeeting({ nextMeetingScheduled: true }),
      mkMeeting({ id: "tm-2", nextMeetingScheduled: true }),
      mkMeeting({ id: "tm-3", nextMeetingScheduled: false }),
    ];
    const result = evaluateTransitionMeetings(meetings);
    expect(result.nextMeetingScheduledRate).toBe(67);
  });

  it("cap at 25", () => {
    const result = evaluateTransitionMeetings([mkMeeting()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("combined SW + next meeting rate contributes to score", () => {
    // SW present=100%, next meeting=0% -> combined=50% -> Math.round(0.5*6)=3
    const meetings = [mkMeeting({ socialWorkerPresent: true, nextMeetingScheduled: false })];
    const result = evaluateTransitionMeetings(meetings);
    expect(result.socialWorkerPresentRate).toBe(100);
    expect(result.nextMeetingScheduledRate).toBe(0);
    // Verify score is less than max
    expect(result.overallScore).toBeLessThan(25);
  });
});

// -- evaluateStaffTransitionReadiness -----------------------------------------

describe("evaluateStaffTransitionReadiness", () => {
  it("returns 0 for empty training", () => {
    const result = evaluateStaffTransitionReadiness([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalStaff).toBe(0);
    expect(result.leavingCarePolicyRate).toBe(0);
    expect(result.pathwayPlanningRate).toBe(0);
    expect(result.independenceSkillsRate).toBe(0);
    expect(result.housingOptionsRate).toBe(0);
    expect(result.financialCapabilityRate).toBe(0);
    expect(result.emotionalSupportRate).toBe(0);
  });

  it("scores max for fully trained staff", () => {
    const training = [mkTraining(), mkTraining({ id: "stt-2", staffId: "staff-2", staffName: "Tom Richards" })];
    const result = evaluateStaffTransitionReadiness(training);
    expect(result.overallScore).toBe(25);
  });

  it("returns total staff count", () => {
    const training = [mkTraining(), mkTraining({ id: "stt-2" }), mkTraining({ id: "stt-3" })];
    const result = evaluateStaffTransitionReadiness(training);
    expect(result.totalStaff).toBe(3);
  });

  it("scores 0 when all flags are false", () => {
    const staff = mkTraining({
      leavingCarePolicy: false,
      pathwayPlanning: false,
      independenceSkills: false,
      housingOptions: false,
      financialCapability: false,
      emotionalSupport: false,
    });
    const result = evaluateStaffTransitionReadiness([staff]);
    expect(result.overallScore).toBe(0);
  });

  it("weights leaving care policy highest (6)", () => {
    const staff = mkTraining({
      leavingCarePolicy: true,
      pathwayPlanning: false,
      independenceSkills: false,
      housingOptions: false,
      financialCapability: false,
      emotionalSupport: false,
    });
    const result = evaluateStaffTransitionReadiness([staff]);
    expect(result.overallScore).toBe(6);
  });

  it("weights pathway planning at 5", () => {
    const staff = mkTraining({
      leavingCarePolicy: false,
      pathwayPlanning: true,
      independenceSkills: false,
      housingOptions: false,
      financialCapability: false,
      emotionalSupport: false,
    });
    const result = evaluateStaffTransitionReadiness([staff]);
    expect(result.overallScore).toBe(5);
  });

  it("weights independence skills at 5", () => {
    const staff = mkTraining({
      leavingCarePolicy: false,
      pathwayPlanning: false,
      independenceSkills: true,
      housingOptions: false,
      financialCapability: false,
      emotionalSupport: false,
    });
    const result = evaluateStaffTransitionReadiness([staff]);
    expect(result.overallScore).toBe(5);
  });

  it("weights housing options at 4", () => {
    const staff = mkTraining({
      leavingCarePolicy: false,
      pathwayPlanning: false,
      independenceSkills: false,
      housingOptions: true,
      financialCapability: false,
      emotionalSupport: false,
    });
    const result = evaluateStaffTransitionReadiness([staff]);
    expect(result.overallScore).toBe(4);
  });

  it("weights financial capability at 3", () => {
    const staff = mkTraining({
      leavingCarePolicy: false,
      pathwayPlanning: false,
      independenceSkills: false,
      housingOptions: false,
      financialCapability: true,
      emotionalSupport: false,
    });
    const result = evaluateStaffTransitionReadiness([staff]);
    expect(result.overallScore).toBe(3);
  });

  it("weights emotional support at 2", () => {
    const staff = mkTraining({
      leavingCarePolicy: false,
      pathwayPlanning: false,
      independenceSkills: false,
      housingOptions: false,
      financialCapability: false,
      emotionalSupport: true,
    });
    const result = evaluateStaffTransitionReadiness([staff]);
    expect(result.overallScore).toBe(2);
  });

  it("calculates rates for partial staff compliance", () => {
    const training = [
      mkTraining({ leavingCarePolicy: true, pathwayPlanning: true, independenceSkills: false, housingOptions: false, financialCapability: false, emotionalSupport: false }),
      mkTraining({ id: "stt-2", staffId: "staff-2", leavingCarePolicy: false, pathwayPlanning: false, independenceSkills: true, housingOptions: true, financialCapability: false, emotionalSupport: false }),
    ];
    const result = evaluateStaffTransitionReadiness(training);
    expect(result.leavingCarePolicyRate).toBe(50);
    expect(result.pathwayPlanningRate).toBe(50);
    expect(result.independenceSkillsRate).toBe(50);
    expect(result.housingOptionsRate).toBe(50);
    expect(result.financialCapabilityRate).toBe(0);
    expect(result.emotionalSupportRate).toBe(0);
  });

  it("cap at 25", () => {
    const result = evaluateStaffTransitionReadiness([mkTraining()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// -- buildChildTransitionProfiles ---------------------------------------------

describe("buildChildTransitionProfiles", () => {
  it("returns empty array for no plans", () => {
    const result = buildChildTransitionProfiles([], [], []);
    expect(result).toEqual([]);
  });

  it("builds profiles from plans", () => {
    const plans = [mkPlan()];
    const result = buildChildTransitionProfiles(plans, [], []);
    expect(result).toHaveLength(1);
    expect(result[0].childId).toBe("child-1");
    expect(result[0].childName).toBe("Alex");
    expect(result[0].transitionType).toBe("leaving_care");
    expect(result[0].pathwayStatus).toBe("on_track");
  });

  it("counts skill assessments per child", () => {
    const plans = [mkPlan()];
    const assessments = [
      mkSkill({ childId: "child-1" }),
      mkSkill({ id: "isa-2", childId: "child-1", skillArea: "cooking" }),
    ];
    const result = buildChildTransitionProfiles(plans, assessments, []);
    expect(result[0].skillAssessmentCount).toBe(2);
  });

  it("counts meetings per child", () => {
    const plans = [mkPlan()];
    const meetings = [
      mkMeeting({ childId: "child-1" }),
      mkMeeting({ id: "tm-2", childId: "child-1" }),
      mkMeeting({ id: "tm-3", childId: "child-1" }),
    ];
    const result = buildChildTransitionProfiles(plans, [], meetings);
    expect(result[0].meetingCount).toBe(3);
  });

  it("scores pathway plan quality factors", () => {
    const plan = mkPlan({
      personalAdviserAssigned: true,
      planReviewedRegularly: true,
      childViewsIncluded: true,
      accommodationIdentified: true,
    });
    const result = buildChildTransitionProfiles([plan], [], []);
    // 4 points from pathway factors
    expect(result[0].overallScore).toBe(4);
  });

  it("scores 0 when pathway plan has all false flags", () => {
    const plan = mkPlan({
      personalAdviserAssigned: false,
      planReviewedRegularly: false,
      childViewsIncluded: false,
      accommodationIdentified: false,
    });
    const result = buildChildTransitionProfiles([plan], [], []);
    expect(result[0].overallScore).toBe(0);
  });

  it("scores independence skill level high for 80%+ competent", () => {
    const plans = [mkPlan()];
    const assessments = [
      mkSkill({ childId: "child-1", currentLevel: "competent" }),
      mkSkill({ id: "isa-2", childId: "child-1", currentLevel: "independent" }),
      mkSkill({ id: "isa-3", childId: "child-1", currentLevel: "competent" }),
      mkSkill({ id: "isa-4", childId: "child-1", currentLevel: "competent" }),
      mkSkill({ id: "isa-5", childId: "child-1", currentLevel: "competent" }),
    ];
    const result = buildChildTransitionProfiles(plans, assessments, []);
    // 4 from plan + 3 from skills (100% competent+)
    expect(result[0].overallScore).toBe(7);
  });

  it("scores independence skill level medium for 50-79% competent", () => {
    const plans = [mkPlan()];
    const assessments = [
      mkSkill({ childId: "child-1", currentLevel: "competent" }),
      mkSkill({ id: "isa-2", childId: "child-1", currentLevel: "developing" }),
    ];
    const result = buildChildTransitionProfiles(plans, assessments, []);
    // 4 from plan + 2 from skills (50% competent+)
    expect(result[0].overallScore).toBe(6);
  });

  it("scores independence skill level low for <50% competent", () => {
    const plans = [mkPlan()];
    const assessments = [
      mkSkill({ childId: "child-1", currentLevel: "developing" }),
      mkSkill({ id: "isa-2", childId: "child-1", currentLevel: "developing" }),
      mkSkill({ id: "isa-3", childId: "child-1", currentLevel: "competent" }),
    ];
    const result = buildChildTransitionProfiles(plans, assessments, []);
    // 4 from plan + 1 from skills (33% competent+, but >0)
    expect(result[0].overallScore).toBe(5);
  });

  it("scores meeting engagement for high attendance + enough meetings", () => {
    const plans = [mkPlan()];
    const meetings = [
      mkMeeting({ childId: "child-1", childAttended: true }),
      mkMeeting({ id: "tm-2", childId: "child-1", childAttended: true }),
    ];
    const result = buildChildTransitionProfiles(plans, [], meetings);
    // 4 from plan + 2 attend (100%) + 1 for >=2 meetings = 7
    expect(result[0].overallScore).toBe(7);
  });

  it("builds multiple child profiles", () => {
    const plans = [
      mkPlan({ childId: "child-1", childName: "Alex" }),
      mkPlan({ id: "pp-2", childId: "child-2", childName: "Jordan", transitionType: "step_down" }),
    ];
    const result = buildChildTransitionProfiles(plans, [], []);
    expect(result).toHaveLength(2);
    expect(result[0].childName).toBe("Alex");
    expect(result[1].childName).toBe("Jordan");
    expect(result[1].transitionType).toBe("step_down");
  });

  it("caps child score at 10", () => {
    const plans = [mkPlan()];
    const assessments = [
      mkSkill({ childId: "child-1", currentLevel: "independent" }),
      mkSkill({ id: "isa-2", childId: "child-1", currentLevel: "independent", skillArea: "cooking" }),
      mkSkill({ id: "isa-3", childId: "child-1", currentLevel: "independent", skillArea: "cleaning" }),
      mkSkill({ id: "isa-4", childId: "child-1", currentLevel: "independent", skillArea: "laundry" }),
      mkSkill({ id: "isa-5", childId: "child-1", currentLevel: "independent", skillArea: "shopping" }),
    ];
    const meetings = [
      mkMeeting({ childId: "child-1" }),
      mkMeeting({ id: "tm-2", childId: "child-1" }),
      mkMeeting({ id: "tm-3", childId: "child-1" }),
    ];
    const result = buildChildTransitionProfiles(plans, assessments, meetings);
    expect(result[0].overallScore).toBeLessThanOrEqual(10);
  });

  it("ignores assessments and meetings for children without plans", () => {
    const plans = [mkPlan({ childId: "child-1" })];
    const assessments = [mkSkill({ childId: "child-99" })];
    const meetings = [mkMeeting({ childId: "child-99" })];
    const result = buildChildTransitionProfiles(plans, assessments, meetings);
    expect(result).toHaveLength(1);
    expect(result[0].skillAssessmentCount).toBe(0);
    expect(result[0].meetingCount).toBe(0);
  });
});

// -- generateTransitionPathwayPlanningIntelligence ----------------------------

describe("generateTransitionPathwayPlanningIntelligence", () => {
  it("returns valid structure with all empty arrays", () => {
    const result = generateTransitionPathwayPlanningIntelligence([], [], [], [], "oak-house", "2026-01-01", "2026-05-19");
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-19");
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.pathwayPlanning.overallScore).toBe(0);
    expect(result.independenceSkills.overallScore).toBe(0);
    expect(result.transitionMeetings.overallScore).toBe(0);
    expect(result.staffTransitionReadiness.overallScore).toBe(0);
    expect(result.childProfiles).toEqual([]);
    expect(result.regulatoryLinks.length).toBe(7);
  });

  it("score is sum of four evaluators, capped at 100", () => {
    const plans = [mkPlan()];
    const assessments = [
      "budgeting", "cooking", "cleaning", "laundry", "shopping", "travel",
      "health_management", "tenancy_management", "employment_readiness",
      "education_continuation", "emotional_resilience", "social_skills",
    ].map((skill, i) => mkSkill({ id: `isa-${i}`, skillArea: skill as IndependenceSkillAssessment["skillArea"] }));
    const meetings = [mkMeeting(), mkMeeting({ id: "tm-2" })];
    const training = [mkTraining()];
    const result = generateTransitionPathwayPlanningIntelligence(plans, assessments, meetings, training, "oak-house", "2026-01-01", "2026-05-19");
    expect(result.overallScore).toBe(
      result.pathwayPlanning.overallScore +
      result.independenceSkills.overallScore +
      result.transitionMeetings.overallScore +
      result.staffTransitionReadiness.overallScore,
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("rating is outstanding for high score", () => {
    const plans = [mkPlan(), mkPlan({ id: "pp-2", childId: "child-2", childName: "Jordan" })];
    const assessments = [
      "budgeting", "cooking", "cleaning", "laundry", "shopping", "travel",
      "health_management", "tenancy_management", "employment_readiness",
      "education_continuation", "emotional_resilience", "social_skills",
    ].map((skill, i) => mkSkill({ id: `isa-${i}`, skillArea: skill as IndependenceSkillAssessment["skillArea"] }));
    const meetings = [mkMeeting(), mkMeeting({ id: "tm-2" })];
    const training = [mkTraining(), mkTraining({ id: "stt-2", staffId: "staff-2" })];
    const result = generateTransitionPathwayPlanningIntelligence(plans, assessments, meetings, training, "oak-house", "2026-01-01", "2026-05-19");
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.rating).toBe("outstanding");
  });

  it("generates strengths for personal adviser 100%", () => {
    const plans = [mkPlan({ personalAdviserAssigned: true })];
    const result = generateTransitionPathwayPlanningIntelligence(plans, [], [], [], "oak-house", "2026-01-01", "2026-05-19");
    expect(result.strengths.some((s) => s.includes("Personal adviser assigned"))).toBe(true);
  });

  it("generates strengths for plan reviewed 100%", () => {
    const plans = [mkPlan({ planReviewedRegularly: true })];
    const result = generateTransitionPathwayPlanningIntelligence(plans, [], [], [], "oak-house", "2026-01-01", "2026-05-19");
    expect(result.strengths.some((s) => s.includes("pathway plans reviewed regularly"))).toBe(true);
  });

  it("generates strengths for child views 100%", () => {
    const plans = [mkPlan({ childViewsIncluded: true })];
    const result = generateTransitionPathwayPlanningIntelligence(plans, [], [], [], "oak-house", "2026-01-01", "2026-05-19");
    expect(result.strengths.some((s) => s.includes("Child views included"))).toBe(true);
  });

  it("generates area for improvement when no plans", () => {
    const result = generateTransitionPathwayPlanningIntelligence([], [], [], [], "oak-house", "2026-01-01", "2026-05-19");
    expect(result.areasForImprovement.some((a) => a.includes("No pathway plans documented"))).toBe(true);
  });

  it("generates area for improvement for missing advisers", () => {
    const plans = [
      mkPlan({ personalAdviserAssigned: false }),
      mkPlan({ id: "pp-2", personalAdviserAssigned: true }),
    ];
    const result = generateTransitionPathwayPlanningIntelligence(plans, [], [], [], "oak-house", "2026-01-01", "2026-05-19");
    expect(result.areasForImprovement.some((a) => a.includes("Personal adviser not assigned"))).toBe(true);
  });

  it("generates area for improvement for health passports", () => {
    const plans = [mkPlan({ healthPassportCompleted: false })];
    const result = generateTransitionPathwayPlanningIntelligence(plans, [], [], [], "oak-house", "2026-01-01", "2026-05-19");
    expect(result.areasForImprovement.some((a) => a.includes("Health passports"))).toBe(true);
  });

  it("generates urgent action for at-risk plans", () => {
    const plans = [mkPlan({ pathwayStatus: "at_risk" })];
    const result = generateTransitionPathwayPlanningIntelligence(plans, [], [], [], "oak-house", "2026-01-01", "2026-05-19");
    expect(result.actions.some((a) => a.includes("URGENT") && a.includes("at risk"))).toBe(true);
  });

  it("generates urgent action for missing advisers", () => {
    const plans = [mkPlan({ personalAdviserAssigned: false })];
    const result = generateTransitionPathwayPlanningIntelligence(plans, [], [], [], "oak-house", "2026-01-01", "2026-05-19");
    expect(result.actions.some((a) => a.includes("URGENT") && a.includes("personal advisers"))).toBe(true);
  });

  it("generates urgent action for not-started plans", () => {
    const plans = [mkPlan({ pathwayStatus: "not_started" })];
    const result = generateTransitionPathwayPlanningIntelligence(plans, [], [], [], "oak-house", "2026-01-01", "2026-05-19");
    expect(result.actions.some((a) => a.includes("URGENT") && a.includes("not started"))).toBe(true);
  });

  it("generates action for missing accommodation", () => {
    const plans = [mkPlan({ accommodationIdentified: false })];
    const result = generateTransitionPathwayPlanningIntelligence(plans, [], [], [], "oak-house", "2026-01-01", "2026-05-19");
    expect(result.actions.some((a) => a.includes("accommodation"))).toBe(true);
  });

  it("generates action for missing financial plans", () => {
    const plans = [mkPlan({ financialPlanInPlace: false })];
    const result = generateTransitionPathwayPlanningIntelligence(plans, [], [], [], "oak-house", "2026-01-01", "2026-05-19");
    expect(result.actions.some((a) => a.includes("financial plans"))).toBe(true);
  });

  it("generates action for missing health passports", () => {
    const plans = [mkPlan({ healthPassportCompleted: false })];
    const result = generateTransitionPathwayPlanningIntelligence(plans, [], [], [], "oak-house", "2026-01-01", "2026-05-19");
    expect(result.actions.some((a) => a.includes("health passports"))).toBe(true);
  });

  it("generates action for no assessments when plans exist", () => {
    const plans = [mkPlan()];
    const result = generateTransitionPathwayPlanningIntelligence(plans, [], [], [], "oak-house", "2026-01-01", "2026-05-19");
    expect(result.actions.some((a) => a.includes("independence skill assessments"))).toBe(true);
  });

  it("generates action for no meetings when plans exist", () => {
    const plans = [mkPlan()];
    const result = generateTransitionPathwayPlanningIntelligence(plans, [], [], [], "oak-house", "2026-01-01", "2026-05-19");
    expect(result.actions.some((a) => a.includes("transition meetings"))).toBe(true);
  });

  it("generates action for no staff training", () => {
    const result = generateTransitionPathwayPlanningIntelligence([], [], [], [], "oak-house", "2026-01-01", "2026-05-19");
    expect(result.actions.some((a) => a.includes("staff transition training"))).toBe(true);
  });

  it("includes all 7 regulatory links", () => {
    const result = generateTransitionPathwayPlanningIntelligence([], [], [], [], "oak-house", "2026-01-01", "2026-05-19");
    expect(result.regulatoryLinks).toHaveLength(7);
    expect(result.regulatoryLinks.some((r) => r.includes("Children Act 1989"))).toBe(true);
    expect(result.regulatoryLinks.some((r) => r.includes("Leaving Care") && r.includes("2000"))).toBe(true);
    expect(result.regulatoryLinks.some((r) => r.includes("CHR 2015") && r.includes("Reg 14"))).toBe(true);
    expect(result.regulatoryLinks.some((r) => r.includes("SCCIF"))).toBe(true);
    expect(result.regulatoryLinks.some((r) => r.includes("NMS 13"))).toBe(true);
    expect(result.regulatoryLinks.some((r) => r.includes("Care Leavers Covenant"))).toBe(true);
    expect(result.regulatoryLinks.some((r) => r.includes("NICE QS31"))).toBe(true);
  });

  it("overall score never exceeds 100", () => {
    const plans = [mkPlan(), mkPlan({ id: "pp-2", childId: "child-2", childName: "Jordan" })];
    const assessments = [
      "budgeting", "cooking", "cleaning", "laundry", "shopping", "travel",
      "health_management", "tenancy_management", "employment_readiness",
      "education_continuation", "emotional_resilience", "social_skills",
    ].map((skill, i) => mkSkill({ id: `isa-${i}`, skillArea: skill as IndependenceSkillAssessment["skillArea"] }));
    const meetings = [mkMeeting(), mkMeeting({ id: "tm-2" }), mkMeeting({ id: "tm-3" })];
    const training = [mkTraining(), mkTraining({ id: "stt-2", staffId: "staff-2" })];
    const result = generateTransitionPathwayPlanningIntelligence(plans, assessments, meetings, training, "oak-house", "2026-01-01", "2026-05-19");
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("overall score never below 0", () => {
    const result = generateTransitionPathwayPlanningIntelligence([], [], [], [], "oak-house", "2026-01-01", "2026-05-19");
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("generates strength for accommodation rate >= 80%", () => {
    const plans = [
      mkPlan({ accommodationIdentified: true }),
      mkPlan({ id: "pp-2", childId: "child-2", accommodationIdentified: true }),
    ];
    const result = generateTransitionPathwayPlanningIntelligence(plans, [], [], [], "oak-house", "2026-01-01", "2026-05-19");
    expect(result.strengths.some((s) => s.includes("Accommodation identified"))).toBe(true);
  });

  it("generates strength for competent+ rate >= 70%", () => {
    const assessments = [
      mkSkill({ currentLevel: "competent" }),
      mkSkill({ id: "isa-2", currentLevel: "independent" }),
      mkSkill({ id: "isa-3", currentLevel: "competent" }),
    ];
    const result = generateTransitionPathwayPlanningIntelligence([], assessments, [], [], "oak-house", "2026-01-01", "2026-05-19");
    expect(result.strengths.some((s) => s.includes("independence skill development"))).toBe(true);
  });

  it("generates area for improvement for no assessments with plans", () => {
    const plans = [mkPlan()];
    const result = generateTransitionPathwayPlanningIntelligence(plans, [], [], [], "oak-house", "2026-01-01", "2026-05-19");
    expect(result.areasForImprovement.some((a) => a.includes("No independence skill assessments"))).toBe(true);
  });

  it("generates area for improvement for no meetings with plans", () => {
    const plans = [mkPlan()];
    const result = generateTransitionPathwayPlanningIntelligence(plans, [], [], [], "oak-house", "2026-01-01", "2026-05-19");
    expect(result.areasForImprovement.some((a) => a.includes("No transition meetings recorded"))).toBe(true);
  });

  it("generates area for improvement for no staff training", () => {
    const result = generateTransitionPathwayPlanningIntelligence([], [], [], [], "oak-house", "2026-01-01", "2026-05-19");
    expect(result.areasForImprovement.some((a) => a.includes("No staff transition training"))).toBe(true);
  });

  it("generates strength for child attendance >= 90%", () => {
    const meetings = [mkMeeting({ childAttended: true })];
    const result = generateTransitionPathwayPlanningIntelligence([], [], meetings, [], "oak-house", "2026-01-01", "2026-05-19");
    expect(result.strengths.some((s) => s.includes("child participation"))).toBe(true);
  });

  it("generates strength for minutes recorded 100%", () => {
    const meetings = [mkMeeting({ minutesRecorded: true })];
    const result = generateTransitionPathwayPlanningIntelligence([], [], meetings, [], "oak-house", "2026-01-01", "2026-05-19");
    expect(result.strengths.some((s) => s.includes("Minutes recorded"))).toBe(true);
  });

  it("generates strength for all staff trained on leaving care policy", () => {
    const training = [mkTraining({ leavingCarePolicy: true })];
    const result = generateTransitionPathwayPlanningIntelligence([], [], [], training, "oak-house", "2026-01-01", "2026-05-19");
    expect(result.strengths.some((s) => s.includes("staff trained in leaving care policy"))).toBe(true);
  });

  it("generates action for low staff readiness", () => {
    const training = [mkTraining({
      leavingCarePolicy: true,
      pathwayPlanning: false,
      independenceSkills: false,
      housingOptions: false,
      financialCapability: false,
      emotionalSupport: false,
    })];
    const result = generateTransitionPathwayPlanningIntelligence([], [], [], training, "oak-house", "2026-01-01", "2026-05-19");
    expect(result.actions.some((a) => a.includes("Enhance staff training"))).toBe(true);
  });
});
