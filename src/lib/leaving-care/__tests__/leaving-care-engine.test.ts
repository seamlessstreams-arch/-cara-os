// ══════════════════════════════════════════════════════════════════════════════
// LEAVING CARE PREPARATION INTELLIGENCE — COMPREHENSIVE TEST SUITE
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluatePathwayPlanning,
  evaluateIndependenceSkills,
  evaluateAccommodationPlanning,
  evaluateSupportNetwork,
  buildChildLeavingProfiles,
  generateLeavingCareIntelligence,
  getRating,
  getReadinessLabel,
  getSkillCategoryLabel,
  getSkillLevelLabel,
  getPathwayPlanStatusLabel,
  getAccommodationTypeLabel,
  getAccommodationStatusLabel,
  getSupportTypeLabel,
  getSupportStatusLabel,
} from "../leaving-care-engine";
import type {
  LeavingCareChild,
  PathwayPlan,
  IndependenceSkillAssessment,
  AccommodationPlan,
  SupportArrangement,
  SkillCategory,
  SkillLevel,
} from "../leaving-care-engine";

// ── Test Fixtures ──────────────────────────────────────────────────────────

function makeOakHouseChildren(): LeavingCareChild[] {
  return [
    {
      id: "child-alex",
      name: "Alex",
      dateOfBirth: "2012-03-15",
      age: 14,
      placementStartDate: "2025-10-01",
      currentPlacement: true,
      isEligibleChild: false,
      isRelevantChild: false,
      hasPathwayPlan: false,
      keyWorkerId: "staff-sarah",
      keyWorkerName: "Sarah Johnson",
    },
    {
      id: "child-jordan",
      name: "Jordan",
      dateOfBirth: "2013-07-22",
      age: 13,
      placementStartDate: "2025-11-01",
      currentPlacement: true,
      isEligibleChild: false,
      isRelevantChild: false,
      hasPathwayPlan: false,
      keyWorkerId: "staff-tom",
      keyWorkerName: "Tom Richards",
    },
    {
      id: "child-morgan",
      name: "Morgan",
      dateOfBirth: "2010-12-01",
      age: 15,
      placementStartDate: "2026-01-10",
      currentPlacement: true,
      isEligibleChild: true,
      isRelevantChild: false,
      hasPathwayPlan: true,
      keyWorkerId: "staff-lisa",
      keyWorkerName: "Lisa Williams",
    },
  ];
}

function makeChild(overrides: Partial<LeavingCareChild> = {}): LeavingCareChild {
  return {
    id: "child-test",
    name: "Test Child",
    dateOfBirth: "2010-06-01",
    age: 16,
    placementStartDate: "2025-01-01",
    currentPlacement: true,
    isEligibleChild: true,
    isRelevantChild: false,
    hasPathwayPlan: true,
    keyWorkerId: "staff-01",
    keyWorkerName: "Staff One",
    ...overrides,
  };
}

function makePlan(overrides: Partial<PathwayPlan> = {}): PathwayPlan {
  return {
    id: "plan-01",
    childId: "child-test",
    status: "current",
    createdDate: "2025-09-01",
    lastReviewedDate: "2026-03-01",
    nextReviewDue: "2026-09-01",
    youngPersonInvolved: true,
    youngPersonViewsRecorded: true,
    personalAdviserAssigned: true,
    goalsSet: 6,
    goalsAchieved: 4,
    educationPlanIncluded: true,
    healthPlanIncluded: true,
    financePlanIncluded: true,
    accommodationPlanIncluded: true,
    ...overrides,
  };
}

function makeSkillAssessment(
  overrides: Partial<IndependenceSkillAssessment> = {},
): IndependenceSkillAssessment {
  return {
    id: "skill-01",
    childId: "child-test",
    skill: "cooking",
    currentLevel: "developing",
    assessedDate: "2026-04-01",
    assessedBy: "Sarah Johnson",
    targetLevel: "competent",
    ...overrides,
  };
}

function makeAccommodationPlan(
  overrides: Partial<AccommodationPlan> = {},
): AccommodationPlan {
  return {
    id: "accom-01",
    childId: "child-test",
    preferredType: "semi_independent",
    identifiedOption: "semi_independent",
    status: "in_progress",
    targetMoveDate: "2027-06-01",
    stayingPutAvailable: false,
    stayingCloseAvailable: true,
    transitionPlanInPlace: true,
    trialStayCompleted: false,
    ...overrides,
  };
}

function makeSupport(
  overrides: Partial<SupportArrangement> = {},
): SupportArrangement {
  return {
    id: "sup-01",
    childId: "child-test",
    supportType: "personal_adviser",
    status: "active",
    providerName: "Jane Carter",
    startDate: "2025-09-01",
    frequency: "fortnightly",
    lastContactDate: "2026-05-10",
    ...overrides,
  };
}

// Full Chamberlain House demo data for integration tests
function makeOakHousePathwayPlans(): PathwayPlan[] {
  return [
    {
      id: "plan-morgan",
      childId: "child-morgan",
      status: "current",
      createdDate: "2026-01-15",
      lastReviewedDate: "2026-04-15",
      nextReviewDue: "2026-10-15",
      youngPersonInvolved: true,
      youngPersonViewsRecorded: true,
      personalAdviserAssigned: true,
      goalsSet: 8,
      goalsAchieved: 5,
      educationPlanIncluded: true,
      healthPlanIncluded: true,
      financePlanIncluded: true,
      accommodationPlanIncluded: true,
    },
  ];
}

function makeOakHouseAssessments(): IndependenceSkillAssessment[] {
  // Morgan — most developed as oldest and eligible
  const morganSkills: IndependenceSkillAssessment[] = [
    { id: "sk-m01", childId: "child-morgan", skill: "cooking", currentLevel: "competent", previousLevel: "developing", assessedDate: "2026-04-01", assessedBy: "Lisa Williams", targetLevel: "independent" },
    { id: "sk-m02", childId: "child-morgan", skill: "budgeting", currentLevel: "developing", previousLevel: "emerging", assessedDate: "2026-04-01", assessedBy: "Lisa Williams", targetLevel: "competent" },
    { id: "sk-m03", childId: "child-morgan", skill: "cleaning", currentLevel: "competent", previousLevel: "developing", assessedDate: "2026-04-01", assessedBy: "Lisa Williams", targetLevel: "independent" },
    { id: "sk-m04", childId: "child-morgan", skill: "laundry", currentLevel: "independent", previousLevel: "competent", assessedDate: "2026-04-01", assessedBy: "Lisa Williams", targetLevel: "independent" },
    { id: "sk-m05", childId: "child-morgan", skill: "shopping", currentLevel: "competent", previousLevel: "developing", assessedDate: "2026-04-01", assessedBy: "Lisa Williams", targetLevel: "independent" },
    { id: "sk-m06", childId: "child-morgan", skill: "personal_hygiene", currentLevel: "independent", previousLevel: "competent", assessedDate: "2026-04-01", assessedBy: "Lisa Williams", targetLevel: "independent" },
    { id: "sk-m07", childId: "child-morgan", skill: "using_public_transport", currentLevel: "developing", previousLevel: "emerging", assessedDate: "2026-04-01", assessedBy: "Lisa Williams", targetLevel: "competent" },
    { id: "sk-m08", childId: "child-morgan", skill: "managing_appointments", currentLevel: "developing", previousLevel: "emerging", assessedDate: "2026-04-01", assessedBy: "Lisa Williams", targetLevel: "competent" },
    { id: "sk-m09", childId: "child-morgan", skill: "basic_first_aid", currentLevel: "emerging", assessedDate: "2026-04-01", assessedBy: "Lisa Williams", targetLevel: "competent" },
    { id: "sk-m10", childId: "child-morgan", skill: "understanding_tenancy", currentLevel: "emerging", assessedDate: "2026-04-01", assessedBy: "Lisa Williams", targetLevel: "developing" },
  ];
  // Alex — younger, fewer assessments
  const alexSkills: IndependenceSkillAssessment[] = [
    { id: "sk-a01", childId: "child-alex", skill: "cooking", currentLevel: "emerging", assessedDate: "2026-03-15", assessedBy: "Sarah Johnson", targetLevel: "developing" },
    { id: "sk-a02", childId: "child-alex", skill: "cleaning", currentLevel: "developing", previousLevel: "emerging", assessedDate: "2026-03-15", assessedBy: "Sarah Johnson", targetLevel: "competent" },
    { id: "sk-a03", childId: "child-alex", skill: "personal_hygiene", currentLevel: "competent", assessedDate: "2026-03-15", assessedBy: "Sarah Johnson", targetLevel: "independent" },
    { id: "sk-a04", childId: "child-alex", skill: "laundry", currentLevel: "emerging", assessedDate: "2026-03-15", assessedBy: "Sarah Johnson", targetLevel: "developing" },
  ];
  // Jordan — youngest, fewest
  const jordanSkills: IndependenceSkillAssessment[] = [
    { id: "sk-j01", childId: "child-jordan", skill: "cooking", currentLevel: "emerging", assessedDate: "2026-03-20", assessedBy: "Tom Richards", targetLevel: "developing" },
    { id: "sk-j02", childId: "child-jordan", skill: "personal_hygiene", currentLevel: "developing", previousLevel: "emerging", assessedDate: "2026-03-20", assessedBy: "Tom Richards", targetLevel: "competent" },
    { id: "sk-j03", childId: "child-jordan", skill: "cleaning", currentLevel: "emerging", assessedDate: "2026-03-20", assessedBy: "Tom Richards", targetLevel: "developing" },
  ];
  return [...morganSkills, ...alexSkills, ...jordanSkills];
}

function makeOakHouseAccommodationPlans(): AccommodationPlan[] {
  return [
    {
      id: "accom-morgan",
      childId: "child-morgan",
      preferredType: "staying_close",
      identifiedOption: "staying_close",
      status: "exploring",
      targetMoveDate: "2027-12-01",
      stayingPutAvailable: false,
      stayingCloseAvailable: true,
      transitionPlanInPlace: false,
      trialStayCompleted: false,
      localAreaPreference: "Within 5 miles of Chamberlain House",
    },
  ];
}

function makeOakHouseSupportArrangements(): SupportArrangement[] {
  return [
    { id: "sup-m01", childId: "child-morgan", supportType: "personal_adviser", status: "active", providerName: "Jane Carter", startDate: "2026-01-20", frequency: "fortnightly", lastContactDate: "2026-05-10" },
    { id: "sup-m02", childId: "child-morgan", supportType: "mentor", status: "active", providerName: "David Park — Volunteer Mentor", startDate: "2026-02-01", frequency: "weekly", lastContactDate: "2026-05-12" },
    { id: "sup-m03", childId: "child-morgan", supportType: "education_support", status: "active", providerName: "Northfield College SENCO", startDate: "2026-01-10", frequency: "monthly" },
    { id: "sup-m04", childId: "child-morgan", supportType: "social_worker", status: "active", providerName: "David Williams SW", startDate: "2025-06-01", frequency: "monthly", lastContactDate: "2026-05-01" },
  ];
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. getRating
// ══════════════════════════════════════════════════════════════════════════════

describe("getRating", () => {
  it("returns outstanding for score >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
    expect(getRating(95)).toBe("outstanding");
  });

  it("returns good for score >= 60 and < 80", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
    expect(getRating(70)).toBe("good");
  });

  it("returns requires_improvement for score >= 40 and < 60", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
    expect(getRating(50)).toBe("requires_improvement");
  });

  it("returns inadequate for score < 40", () => {
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(39)).toBe("inadequate");
    expect(getRating(20)).toBe("inadequate");
  });

  it("handles boundary values exactly", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(79)).toBe("good");
    expect(getRating(60)).toBe("good");
    expect(getRating(59)).toBe("requires_improvement");
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(39)).toBe("inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. getReadinessLabel
// ══════════════════════════════════════════════════════════════════════════════

describe("getReadinessLabel", () => {
  it("returns Well Prepared for >= 80", () => {
    expect(getReadinessLabel(80)).toBe("Well Prepared");
    expect(getReadinessLabel(100)).toBe("Well Prepared");
  });

  it("returns On Track for >= 60 and < 80", () => {
    expect(getReadinessLabel(60)).toBe("On Track");
    expect(getReadinessLabel(79)).toBe("On Track");
  });

  it("returns Developing for >= 40 and < 60", () => {
    expect(getReadinessLabel(40)).toBe("Developing");
    expect(getReadinessLabel(59)).toBe("Developing");
  });

  it("returns Early Stages for >= 20 and < 40", () => {
    expect(getReadinessLabel(20)).toBe("Early Stages");
    expect(getReadinessLabel(39)).toBe("Early Stages");
  });

  it("returns Not Started for < 20", () => {
    expect(getReadinessLabel(0)).toBe("Not Started");
    expect(getReadinessLabel(19)).toBe("Not Started");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. Label Functions
// ══════════════════════════════════════════════════════════════════════════════

describe("Label functions", () => {
  describe("getSkillCategoryLabel", () => {
    it("returns readable labels for all skill categories", () => {
      expect(getSkillCategoryLabel("cooking")).toBe("Cooking & Meal Preparation");
      expect(getSkillCategoryLabel("budgeting")).toBe("Budgeting & Money Management");
      expect(getSkillCategoryLabel("cleaning")).toBe("Cleaning & Home Maintenance");
      expect(getSkillCategoryLabel("laundry")).toBe("Laundry");
      expect(getSkillCategoryLabel("shopping")).toBe("Shopping & Groceries");
      expect(getSkillCategoryLabel("personal_hygiene")).toBe("Personal Hygiene");
      expect(getSkillCategoryLabel("using_public_transport")).toBe("Using Public Transport");
      expect(getSkillCategoryLabel("managing_appointments")).toBe("Managing Appointments");
      expect(getSkillCategoryLabel("basic_first_aid")).toBe("Basic First Aid");
      expect(getSkillCategoryLabel("understanding_tenancy")).toBe("Understanding Tenancy");
    });
  });

  describe("getSkillLevelLabel", () => {
    it("returns readable labels for all skill levels", () => {
      expect(getSkillLevelLabel("not_assessed")).toBe("Not Assessed");
      expect(getSkillLevelLabel("emerging")).toBe("Emerging");
      expect(getSkillLevelLabel("developing")).toBe("Developing");
      expect(getSkillLevelLabel("competent")).toBe("Competent");
      expect(getSkillLevelLabel("independent")).toBe("Independent");
    });
  });

  describe("getPathwayPlanStatusLabel", () => {
    it("returns readable labels for all pathway plan statuses", () => {
      expect(getPathwayPlanStatusLabel("current")).toBe("Current");
      expect(getPathwayPlanStatusLabel("due_for_review")).toBe("Due for Review");
      expect(getPathwayPlanStatusLabel("overdue")).toBe("Overdue");
      expect(getPathwayPlanStatusLabel("not_started")).toBe("Not Started");
      expect(getPathwayPlanStatusLabel("draft")).toBe("Draft");
    });
  });

  describe("getAccommodationTypeLabel", () => {
    it("returns readable labels for all accommodation types", () => {
      expect(getAccommodationTypeLabel("staying_put")).toBe("Staying Put");
      expect(getAccommodationTypeLabel("staying_close")).toBe("Staying Close");
      expect(getAccommodationTypeLabel("supported_lodgings")).toBe("Supported Lodgings");
      expect(getAccommodationTypeLabel("semi_independent")).toBe("Semi-Independent");
      expect(getAccommodationTypeLabel("independent_tenancy")).toBe("Independent Tenancy");
      expect(getAccommodationTypeLabel("shared_housing")).toBe("Shared Housing");
      expect(getAccommodationTypeLabel("foyer_scheme")).toBe("Foyer Scheme");
      expect(getAccommodationTypeLabel("university_accommodation")).toBe("University Accommodation");
      expect(getAccommodationTypeLabel("not_identified")).toBe("Not Identified");
    });
  });

  describe("getAccommodationStatusLabel", () => {
    it("returns readable labels for all accommodation statuses", () => {
      expect(getAccommodationStatusLabel("confirmed")).toBe("Confirmed");
      expect(getAccommodationStatusLabel("in_progress")).toBe("In Progress");
      expect(getAccommodationStatusLabel("identified")).toBe("Identified");
      expect(getAccommodationStatusLabel("exploring")).toBe("Exploring");
      expect(getAccommodationStatusLabel("not_started")).toBe("Not Started");
    });
  });

  describe("getSupportTypeLabel", () => {
    it("returns readable labels for all support types", () => {
      expect(getSupportTypeLabel("personal_adviser")).toBe("Personal Adviser");
      expect(getSupportTypeLabel("mentor")).toBe("Mentor");
      expect(getSupportTypeLabel("independent_visitor")).toBe("Independent Visitor");
      expect(getSupportTypeLabel("social_worker")).toBe("Social Worker");
      expect(getSupportTypeLabel("family_contact")).toBe("Family Contact");
      expect(getSupportTypeLabel("peer_support")).toBe("Peer Support");
      expect(getSupportTypeLabel("community_group")).toBe("Community Group");
      expect(getSupportTypeLabel("education_support")).toBe("Education Support");
      expect(getSupportTypeLabel("employment_support")).toBe("Employment Support");
      expect(getSupportTypeLabel("health_support")).toBe("Health Support");
    });
  });

  describe("getSupportStatusLabel", () => {
    it("returns readable labels for all support statuses", () => {
      expect(getSupportStatusLabel("active")).toBe("Active");
      expect(getSupportStatusLabel("planned")).toBe("Planned");
      expect(getSupportStatusLabel("referred")).toBe("Referred");
      expect(getSupportStatusLabel("ended")).toBe("Ended");
      expect(getSupportStatusLabel("declined")).toBe("Declined");
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. evaluatePathwayPlanning
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluatePathwayPlanning", () => {
  it("returns full score 30 when no eligible children", () => {
    const children = [makeChild({ isEligibleChild: false })];
    const result = evaluatePathwayPlanning(children, []);
    expect(result.score).toBe(30);
    expect(result.maxScore).toBe(30);
    expect(result.totalPlansRequired).toBe(0);
  });

  it("returns full marks for perfect pathway planning", () => {
    const children = [makeChild()];
    const plans = [makePlan({ childId: "child-test" })];
    const result = evaluatePathwayPlanning(children, plans);
    expect(result.score).toBeGreaterThanOrEqual(29);
    expect(result.plansInPlace).toBe(1);
    expect(result.plansCurrent).toBe(1);
    expect(result.plansOverdue).toBe(0);
    expect(result.plansNotStarted).toBe(0);
    expect(result.youngPersonInvolvementRate).toBe(100);
    expect(result.planCompletenessRate).toBe(100);
  });

  it("counts plans by status correctly", () => {
    const children = [
      makeChild({ id: "c1" }),
      makeChild({ id: "c2" }),
      makeChild({ id: "c3" }),
    ];
    const plans = [
      makePlan({ id: "p1", childId: "c1", status: "current" }),
      makePlan({ id: "p2", childId: "c2", status: "overdue" }),
      makePlan({ id: "p3", childId: "c3", status: "draft" }),
    ];
    const result = evaluatePathwayPlanning(children, plans);
    expect(result.plansCurrent).toBe(1);
    expect(result.plansOverdue).toBe(1);
    expect(result.plansDraft).toBe(1);
    expect(result.plansInPlace).toBe(1); // only current counts
    expect(result.totalPlansRequired).toBe(3);
  });

  it("calculates plansNotStarted correctly", () => {
    const children = [makeChild({ id: "c1" }), makeChild({ id: "c2" })];
    const plans = [makePlan({ id: "p1", childId: "c1" })]; // c2 has no plan
    const result = evaluatePathwayPlanning(children, plans);
    expect(result.plansNotStarted).toBe(1);
  });

  it("calculates young person involvement rate", () => {
    const children = [makeChild({ id: "c1" }), makeChild({ id: "c2" })];
    const plans = [
      makePlan({ id: "p1", childId: "c1", youngPersonInvolved: true }),
      makePlan({ id: "p2", childId: "c2", youngPersonInvolved: false }),
    ];
    const result = evaluatePathwayPlanning(children, plans);
    expect(result.youngPersonInvolvementRate).toBe(50);
  });

  it("calculates goal achievement rate", () => {
    const children = [makeChild({ id: "c1" }), makeChild({ id: "c2" })];
    const plans = [
      makePlan({ id: "p1", childId: "c1", goalsSet: 10, goalsAchieved: 8 }),
      makePlan({ id: "p2", childId: "c2", goalsSet: 4, goalsAchieved: 2 }),
    ];
    const result = evaluatePathwayPlanning(children, plans);
    // (80 + 50) / 2 = 65
    expect(result.averageGoalAchievementRate).toBe(65);
  });

  it("calculates plan completeness rate", () => {
    const children = [makeChild({ id: "c1" }), makeChild({ id: "c2" })];
    const plans = [
      makePlan({ id: "p1", childId: "c1" }), // all sections included
      makePlan({ id: "p2", childId: "c2", financePlanIncluded: false }), // missing finance
    ];
    const result = evaluatePathwayPlanning(children, plans);
    expect(result.planCompletenessRate).toBe(50);
  });

  it("penalises overdue plans", () => {
    const children = [makeChild()];
    const plansGood = [makePlan({ status: "current" })];
    const plansOverdue = [makePlan({ status: "overdue" })];
    const good = evaluatePathwayPlanning(children, plansGood);
    const overdue = evaluatePathwayPlanning(children, plansOverdue);
    expect(good.score).toBeGreaterThan(overdue.score);
  });

  it("ignores plans for non-eligible children", () => {
    const children = [makeChild({ isEligibleChild: false })];
    const plans = [makePlan()];
    const result = evaluatePathwayPlanning(children, plans);
    expect(result.totalPlansRequired).toBe(0);
    expect(result.score).toBe(30);
  });

  it("ignores plans for children not in current placement", () => {
    const children = [makeChild({ currentPlacement: false })];
    const plans = [makePlan()];
    const result = evaluatePathwayPlanning(children, plans);
    expect(result.totalPlansRequired).toBe(0);
  });

  it("handles zero goals set", () => {
    const children = [makeChild()];
    const plans = [makePlan({ goalsSet: 0, goalsAchieved: 0 })];
    const result = evaluatePathwayPlanning(children, plans);
    expect(result.averageGoalAchievementRate).toBe(0);
  });

  it("includes due_for_review in plansInPlace count", () => {
    const children = [makeChild()];
    const plans = [makePlan({ status: "due_for_review" })];
    const result = evaluatePathwayPlanning(children, plans);
    expect(result.plansInPlace).toBe(1);
  });

  it("score never exceeds 30", () => {
    const children = [makeChild()];
    const plans = [makePlan()];
    const result = evaluatePathwayPlanning(children, plans);
    expect(result.score).toBeLessThanOrEqual(30);
  });

  it("score never goes below 0", () => {
    const children = [
      makeChild({ id: "c1" }),
      makeChild({ id: "c2" }),
      makeChild({ id: "c3" }),
    ];
    // All overdue, no involvement, no goals, no completeness
    const plans = [
      makePlan({ id: "p1", childId: "c1", status: "overdue", youngPersonInvolved: false, goalsSet: 0, goalsAchieved: 0, educationPlanIncluded: false, healthPlanIncluded: false, financePlanIncluded: false, accommodationPlanIncluded: false }),
      makePlan({ id: "p2", childId: "c2", status: "overdue", youngPersonInvolved: false, goalsSet: 0, goalsAchieved: 0, educationPlanIncluded: false, healthPlanIncluded: false, financePlanIncluded: false, accommodationPlanIncluded: false }),
      makePlan({ id: "p3", childId: "c3", status: "overdue", youngPersonInvolved: false, goalsSet: 0, goalsAchieved: 0, educationPlanIncluded: false, healthPlanIncluded: false, financePlanIncluded: false, accommodationPlanIncluded: false }),
    ];
    const result = evaluatePathwayPlanning(children, plans);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. evaluateIndependenceSkills
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateIndependenceSkills", () => {
  it("returns full score 25 when no active children", () => {
    const children = [makeChild({ currentPlacement: false })];
    const result = evaluateIndependenceSkills(children, []);
    expect(result.score).toBe(25);
    expect(result.maxScore).toBe(25);
    expect(result.totalAssessments).toBe(0);
  });

  it("calculates coverage rate correctly", () => {
    const children = [makeChild()];
    // 3 out of 10 skills assessed
    const assessments = [
      makeSkillAssessment({ id: "s1", skill: "cooking", currentLevel: "developing" }),
      makeSkillAssessment({ id: "s2", skill: "budgeting", currentLevel: "emerging" }),
      makeSkillAssessment({ id: "s3", skill: "cleaning", currentLevel: "competent" }),
    ];
    const result = evaluateIndependenceSkills(children, assessments);
    expect(result.coverageRate).toBe(30); // 3/10
  });

  it("calculates average skill level correctly", () => {
    const children = [makeChild()];
    const assessments = [
      makeSkillAssessment({ id: "s1", skill: "cooking", currentLevel: "competent" }), // 3
      makeSkillAssessment({ id: "s2", skill: "budgeting", currentLevel: "emerging" }), // 1
    ];
    const result = evaluateIndependenceSkills(children, assessments);
    expect(result.averageSkillLevel).toBe(2); // (3+1)/2
  });

  it("counts competent or above correctly", () => {
    const children = [makeChild()];
    const assessments = [
      makeSkillAssessment({ id: "s1", skill: "cooking", currentLevel: "competent" }),
      makeSkillAssessment({ id: "s2", skill: "budgeting", currentLevel: "independent" }),
      makeSkillAssessment({ id: "s3", skill: "cleaning", currentLevel: "developing" }),
    ];
    const result = evaluateIndependenceSkills(children, assessments);
    expect(result.skillsAtCompetentOrAbove).toBe(2);
  });

  it("counts improving skills", () => {
    const children = [makeChild()];
    const assessments = [
      makeSkillAssessment({ id: "s1", skill: "cooking", currentLevel: "competent", previousLevel: "developing" }),
      makeSkillAssessment({ id: "s2", skill: "budgeting", currentLevel: "developing", previousLevel: "developing" }),
    ];
    const result = evaluateIndependenceSkills(children, assessments);
    expect(result.skillsImproving).toBe(1);
  });

  it("counts stagnant skills", () => {
    const children = [makeChild()];
    const assessments = [
      makeSkillAssessment({ id: "s1", skill: "cooking", currentLevel: "developing", previousLevel: "developing" }),
      makeSkillAssessment({ id: "s2", skill: "budgeting", currentLevel: "emerging", previousLevel: "emerging" }),
    ];
    const result = evaluateIndependenceSkills(children, assessments);
    expect(result.skillsStagnant).toBe(2);
  });

  it("does not count competent/independent as stagnant even without improvement", () => {
    const children = [makeChild()];
    const assessments = [
      makeSkillAssessment({ id: "s1", skill: "cooking", currentLevel: "competent", previousLevel: "competent" }),
    ];
    const result = evaluateIndependenceSkills(children, assessments);
    expect(result.skillsStagnant).toBe(0);
  });

  it("counts not_assessed correctly", () => {
    const children = [makeChild()];
    const assessments = [
      makeSkillAssessment({ id: "s1", skill: "cooking", currentLevel: "not_assessed" }),
      makeSkillAssessment({ id: "s2", skill: "budgeting", currentLevel: "developing" }),
    ];
    const result = evaluateIndependenceSkills(children, assessments);
    expect(result.skillsNotAssessed).toBe(1);
  });

  it("calculates progress rate", () => {
    const children = [makeChild()];
    const assessments = [
      makeSkillAssessment({ id: "s1", skill: "cooking", currentLevel: "competent", previousLevel: "developing" }),
      makeSkillAssessment({ id: "s2", skill: "budgeting", currentLevel: "emerging", previousLevel: "emerging" }),
    ];
    const result = evaluateIndependenceSkills(children, assessments);
    expect(result.progressRate).toBe(50); // 1 of 2 with previous
  });

  it("generates category breakdown for all 10 categories", () => {
    const children = [makeChild()];
    const assessments = [
      makeSkillAssessment({ id: "s1", skill: "cooking", currentLevel: "competent" }),
    ];
    const result = evaluateIndependenceSkills(children, assessments);
    expect(result.categoryBreakdown).toHaveLength(10);
    const cookingBd = result.categoryBreakdown.find((c) => c.skill === "cooking");
    expect(cookingBd).toBeDefined();
    expect(cookingBd!.childCount).toBe(1);
    expect(cookingBd!.competentCount).toBe(1);
  });

  it("excludes not_assessed from average level", () => {
    const children = [makeChild()];
    const assessments = [
      makeSkillAssessment({ id: "s1", skill: "cooking", currentLevel: "not_assessed" }),
      makeSkillAssessment({ id: "s2", skill: "budgeting", currentLevel: "competent" }), // 3
    ];
    const result = evaluateIndependenceSkills(children, assessments);
    expect(result.averageSkillLevel).toBe(3); // only competent counts
  });

  it("handles empty assessments", () => {
    const children = [makeChild()];
    const result = evaluateIndependenceSkills(children, []);
    expect(result.totalAssessments).toBe(0);
    expect(result.coverageRate).toBe(0);
    expect(result.averageSkillLevel).toBe(0);
    expect(result.score).toBe(0);
  });

  it("handles multiple children coverage calculation", () => {
    const children = [makeChild({ id: "c1" }), makeChild({ id: "c2" })];
    const assessments = [
      makeSkillAssessment({ id: "s1", childId: "c1", skill: "cooking", currentLevel: "developing" }),
      makeSkillAssessment({ id: "s2", childId: "c2", skill: "cooking", currentLevel: "competent" }),
    ];
    const result = evaluateIndependenceSkills(children, assessments);
    // 2 unique child-skill pairs out of 20 possible (2 children * 10 skills)
    expect(result.coverageRate).toBe(10);
  });

  it("score never exceeds 25", () => {
    const children = [makeChild()];
    const assessments: IndependenceSkillAssessment[] = [];
    const skills: SkillCategory[] = [
      "cooking", "budgeting", "cleaning", "laundry", "shopping",
      "personal_hygiene", "using_public_transport", "managing_appointments",
      "basic_first_aid", "understanding_tenancy",
    ];
    skills.forEach((skill, i) => {
      assessments.push(
        makeSkillAssessment({
          id: `s${i}`,
          skill,
          currentLevel: "independent",
          previousLevel: "competent",
        }),
      );
    });
    const result = evaluateIndependenceSkills(children, assessments);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("score never goes below 0", () => {
    const children = [makeChild()];
    const assessments = [
      makeSkillAssessment({ id: "s1", skill: "cooking", currentLevel: "not_assessed" }),
    ];
    const result = evaluateIndependenceSkills(children, assessments);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. evaluateAccommodationPlanning
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateAccommodationPlanning", () => {
  it("returns full score 25 when no eligible children", () => {
    const children = [makeChild({ isEligibleChild: false })];
    const result = evaluateAccommodationPlanning(children, []);
    expect(result.score).toBe(25);
    expect(result.maxScore).toBe(25);
    expect(result.totalChildrenRequiringPlan).toBe(0);
  });

  it("counts options identified correctly", () => {
    const children = [makeChild({ id: "c1" }), makeChild({ id: "c2" })];
    const plans = [
      makeAccommodationPlan({ id: "a1", childId: "c1", identifiedOption: "semi_independent" }),
      makeAccommodationPlan({ id: "a2", childId: "c2", identifiedOption: "not_identified" }),
    ];
    const result = evaluateAccommodationPlanning(children, plans);
    expect(result.optionsIdentified).toBe(1);
  });

  it("counts transition plans in place", () => {
    const children = [makeChild()];
    const plans = [makeAccommodationPlan({ transitionPlanInPlace: true })];
    const result = evaluateAccommodationPlanning(children, plans);
    expect(result.transitionPlansInPlace).toBe(1);
  });

  it("counts trial stays completed", () => {
    const children = [makeChild()];
    const plans = [makeAccommodationPlan({ trialStayCompleted: true })];
    const result = evaluateAccommodationPlanning(children, plans);
    expect(result.trialStaysCompleted).toBe(1);
  });

  it("counts staying put and staying close availability", () => {
    const children = [makeChild({ id: "c1" }), makeChild({ id: "c2" })];
    const plans = [
      makeAccommodationPlan({ id: "a1", childId: "c1", stayingPutAvailable: true, stayingCloseAvailable: false }),
      makeAccommodationPlan({ id: "a2", childId: "c2", stayingPutAvailable: false, stayingCloseAvailable: true }),
    ];
    const result = evaluateAccommodationPlanning(children, plans);
    expect(result.stayingPutAvailable).toBe(1);
    expect(result.stayingCloseAvailable).toBe(1);
  });

  it("counts not started correctly", () => {
    const children = [makeChild()];
    const plans = [makeAccommodationPlan({ status: "not_started" })];
    const result = evaluateAccommodationPlanning(children, plans);
    expect(result.notStartedCount).toBe(1);
  });

  it("calculates confirmation rate", () => {
    const children = [makeChild({ id: "c1" }), makeChild({ id: "c2" })];
    const plans = [
      makeAccommodationPlan({ id: "a1", childId: "c1", status: "confirmed" }),
      makeAccommodationPlan({ id: "a2", childId: "c2", status: "in_progress" }),
    ];
    const result = evaluateAccommodationPlanning(children, plans);
    expect(result.confirmationRate).toBe(50);
  });

  it("penalises not started plans", () => {
    const children = [makeChild()];
    const started = evaluateAccommodationPlanning(children, [
      makeAccommodationPlan({ status: "in_progress" }),
    ]);
    const notStarted = evaluateAccommodationPlanning(children, [
      makeAccommodationPlan({ status: "not_started", identifiedOption: undefined }),
    ]);
    expect(started.score).toBeGreaterThan(notStarted.score);
  });

  it("gives higher score for confirmed arrangements", () => {
    const children = [makeChild()];
    const confirmed = evaluateAccommodationPlanning(children, [
      makeAccommodationPlan({ status: "confirmed", identifiedOption: "semi_independent", transitionPlanInPlace: true, trialStayCompleted: true, stayingCloseAvailable: true }),
    ]);
    const exploring = evaluateAccommodationPlanning(children, [
      makeAccommodationPlan({ status: "exploring", identifiedOption: undefined }),
    ]);
    expect(confirmed.score).toBeGreaterThan(exploring.score);
  });

  it("score never exceeds 25", () => {
    const children = [makeChild()];
    const plans = [
      makeAccommodationPlan({
        status: "confirmed",
        identifiedOption: "staying_close",
        transitionPlanInPlace: true,
        trialStayCompleted: true,
        stayingPutAvailable: true,
        stayingCloseAvailable: true,
      }),
    ];
    const result = evaluateAccommodationPlanning(children, plans);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("score never goes below 0", () => {
    const children = [makeChild()];
    const plans = [
      makeAccommodationPlan({ status: "not_started", identifiedOption: undefined, transitionPlanInPlace: false, trialStayCompleted: false, stayingPutAvailable: false, stayingCloseAvailable: false }),
    ];
    const result = evaluateAccommodationPlanning(children, plans);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it("handles no accommodation plans for eligible children", () => {
    const children = [makeChild()];
    const result = evaluateAccommodationPlanning(children, []);
    expect(result.optionsIdentified).toBe(0);
    expect(result.notStartedCount).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. evaluateSupportNetwork
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateSupportNetwork", () => {
  it("returns full score 20 when no eligible children", () => {
    const children = [makeChild({ isEligibleChild: false })];
    const result = evaluateSupportNetwork(children, []);
    expect(result.score).toBe(20);
    expect(result.maxScore).toBe(20);
    expect(result.totalArrangements).toBe(0);
  });

  it("counts active arrangements", () => {
    const children = [makeChild()];
    const support = [
      makeSupport({ id: "s1", status: "active" }),
      makeSupport({ id: "s2", status: "ended" }),
      makeSupport({ id: "s3", status: "planned" }),
    ];
    const result = evaluateSupportNetwork(children, support);
    expect(result.totalArrangements).toBe(3);
    expect(result.activeArrangements).toBe(1);
  });

  it("counts personal advisers assigned", () => {
    const children = [makeChild({ id: "c1" }), makeChild({ id: "c2" })];
    const support = [
      makeSupport({ id: "s1", childId: "c1", supportType: "personal_adviser", status: "active" }),
      makeSupport({ id: "s2", childId: "c2", supportType: "mentor", status: "active" }),
    ];
    const result = evaluateSupportNetwork(children, support);
    expect(result.personalAdvisersAssigned).toBe(1);
  });

  it("counts mentors active", () => {
    const children = [makeChild()];
    const support = [
      makeSupport({ id: "s1", supportType: "mentor", status: "active" }),
      makeSupport({ id: "s2", supportType: "mentor", status: "ended" }),
    ];
    const result = evaluateSupportNetwork(children, support);
    expect(result.mentorsActive).toBe(1);
  });

  it("counts community connections", () => {
    const children = [makeChild()];
    const support = [
      makeSupport({ id: "s1", supportType: "community_group", status: "active" }),
      makeSupport({ id: "s2", supportType: "peer_support", status: "active" }),
      makeSupport({ id: "s3", supportType: "mentor", status: "active" }),
    ];
    const result = evaluateSupportNetwork(children, support);
    expect(result.communityConnections).toBe(2);
  });

  it("calculates support type coverage", () => {
    const children = [makeChild()];
    const support = [
      makeSupport({ id: "s1", supportType: "personal_adviser", status: "active" }),
      makeSupport({ id: "s2", supportType: "mentor", status: "active" }),
      makeSupport({ id: "s3", supportType: "social_worker", status: "active" }),
    ];
    const result = evaluateSupportNetwork(children, support);
    // 3 out of 10 types
    expect(result.supportTypeCoverage).toBe(30);
  });

  it("calculates average support per child", () => {
    const children = [makeChild({ id: "c1" }), makeChild({ id: "c2" })];
    const support = [
      makeSupport({ id: "s1", childId: "c1", supportType: "personal_adviser", status: "active" }),
      makeSupport({ id: "s2", childId: "c1", supportType: "mentor", status: "active" }),
      makeSupport({ id: "s3", childId: "c2", supportType: "social_worker", status: "active" }),
    ];
    const result = evaluateSupportNetwork(children, support);
    expect(result.averageSupportPerChild).toBe(1.5);
  });

  it("identifies children with no support", () => {
    const children = [makeChild({ id: "c1" }), makeChild({ id: "c2" })];
    const support = [
      makeSupport({ id: "s1", childId: "c1", supportType: "personal_adviser", status: "active" }),
    ];
    const result = evaluateSupportNetwork(children, support);
    expect(result.childrenWithNoSupport).toBe(1);
  });

  it("gives higher score when all children have support", () => {
    const children = [makeChild({ id: "c1" }), makeChild({ id: "c2" })];
    const allSupported = evaluateSupportNetwork(children, [
      makeSupport({ id: "s1", childId: "c1", supportType: "personal_adviser", status: "active" }),
      makeSupport({ id: "s2", childId: "c2", supportType: "personal_adviser", status: "active" }),
    ]);
    const oneUnsupported = evaluateSupportNetwork(children, [
      makeSupport({ id: "s1", childId: "c1", supportType: "personal_adviser", status: "active" }),
    ]);
    expect(allSupported.score).toBeGreaterThan(oneUnsupported.score);
  });

  it("handles empty support arrangements", () => {
    const children = [makeChild()];
    const result = evaluateSupportNetwork(children, []);
    expect(result.totalArrangements).toBe(0);
    expect(result.activeArrangements).toBe(0);
    expect(result.childrenWithNoSupport).toBe(1);
  });

  it("score never exceeds 20", () => {
    const children = [makeChild()];
    const support: SupportArrangement[] = [
      makeSupport({ id: "s1", supportType: "personal_adviser", status: "active" }),
      makeSupport({ id: "s2", supportType: "mentor", status: "active" }),
      makeSupport({ id: "s3", supportType: "social_worker", status: "active" }),
      makeSupport({ id: "s4", supportType: "family_contact", status: "active" }),
      makeSupport({ id: "s5", supportType: "community_group", status: "active" }),
      makeSupport({ id: "s6", supportType: "education_support", status: "active" }),
      makeSupport({ id: "s7", supportType: "health_support", status: "active" }),
      makeSupport({ id: "s8", supportType: "employment_support", status: "active" }),
      makeSupport({ id: "s9", supportType: "peer_support", status: "active" }),
      makeSupport({ id: "s10", supportType: "independent_visitor", status: "active" }),
    ];
    const result = evaluateSupportNetwork(children, support);
    expect(result.score).toBeLessThanOrEqual(20);
  });

  it("score never goes below 0", () => {
    const children = [makeChild()];
    const result = evaluateSupportNetwork(children, []);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. buildChildLeavingProfiles
// ══════════════════════════════════════════════════════════════════════════════

describe("buildChildLeavingProfiles", () => {
  it("only includes children with current placement", () => {
    const children = [
      makeChild({ id: "c1", currentPlacement: true }),
      makeChild({ id: "c2", currentPlacement: false }),
    ];
    const profiles = buildChildLeavingProfiles(children, [], [], [], []);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].childId).toBe("c1");
  });

  it("calculates goal achievement rate from pathway plan", () => {
    const children = [makeChild()];
    const plans = [makePlan({ goalsSet: 10, goalsAchieved: 7 })];
    const profiles = buildChildLeavingProfiles(children, plans, [], [], []);
    expect(profiles[0].goalAchievementRate).toBe(70);
  });

  it("returns 0 goal rate when no plan", () => {
    const children = [makeChild()];
    const profiles = buildChildLeavingProfiles(children, [], [], [], []);
    expect(profiles[0].goalAchievementRate).toBe(0);
  });

  it("returns 0 goal rate when goalsSet is 0", () => {
    const children = [makeChild()];
    const plans = [makePlan({ goalsSet: 0, goalsAchieved: 0 })];
    const profiles = buildChildLeavingProfiles(children, plans, [], [], []);
    expect(profiles[0].goalAchievementRate).toBe(0);
  });

  it("calculates independence skill level from assessments", () => {
    const children = [makeChild()];
    const assessments = [
      makeSkillAssessment({ id: "s1", skill: "cooking", currentLevel: "competent" }), // 3
      makeSkillAssessment({ id: "s2", skill: "cleaning", currentLevel: "independent" }), // 4
    ];
    const profiles = buildChildLeavingProfiles(children, [], assessments, [], []);
    // avg = (3+4)/2 = 3.5, normalized to 100: round(3.5/4 * 100) = 88
    expect(profiles[0].independenceSkillLevel).toBe(88);
  });

  it("excludes not_assessed from skill level", () => {
    const children = [makeChild()];
    const assessments = [
      makeSkillAssessment({ id: "s1", skill: "cooking", currentLevel: "not_assessed" }),
      makeSkillAssessment({ id: "s2", skill: "cleaning", currentLevel: "competent" }),
    ];
    const profiles = buildChildLeavingProfiles(children, [], assessments, [], []);
    expect(profiles[0].skillsAssessed).toBe(1);
    expect(profiles[0].independenceSkillLevel).toBe(75); // 3/4 * 100
  });

  it("counts competent skills", () => {
    const children = [makeChild()];
    const assessments = [
      makeSkillAssessment({ id: "s1", skill: "cooking", currentLevel: "competent" }),
      makeSkillAssessment({ id: "s2", skill: "cleaning", currentLevel: "independent" }),
      makeSkillAssessment({ id: "s3", skill: "budgeting", currentLevel: "developing" }),
    ];
    const profiles = buildChildLeavingProfiles(children, [], assessments, [], []);
    expect(profiles[0].skillsCompetent).toBe(2);
  });

  it("picks up accommodation status and type", () => {
    const children = [makeChild()];
    const accomPlans = [makeAccommodationPlan({ status: "in_progress", identifiedOption: "staying_close" })];
    const profiles = buildChildLeavingProfiles(children, [], [], accomPlans, []);
    expect(profiles[0].accommodationStatus).toBe("in_progress");
    expect(profiles[0].accommodationType).toBe("staying_close");
  });

  it("falls back to preferredType when no identifiedOption", () => {
    const children = [makeChild()];
    const accomPlans = [makeAccommodationPlan({ identifiedOption: undefined, preferredType: "foyer_scheme" })];
    const profiles = buildChildLeavingProfiles(children, [], [], accomPlans, []);
    expect(profiles[0].accommodationType).toBe("foyer_scheme");
  });

  it("counts active support", () => {
    const children = [makeChild()];
    const support = [
      makeSupport({ id: "s1", status: "active" }),
      makeSupport({ id: "s2", status: "active" }),
      makeSupport({ id: "s3", status: "ended" }),
    ];
    const profiles = buildChildLeavingProfiles(children, [], [], [], support);
    expect(profiles[0].activeSupportCount).toBe(2);
  });

  it("detects personal adviser", () => {
    const children = [makeChild()];
    const support = [makeSupport({ supportType: "personal_adviser", status: "active" })];
    const profiles = buildChildLeavingProfiles(children, [], [], [], support);
    expect(profiles[0].hasPersonalAdviser).toBe(true);
  });

  it("calculates readiness for eligible child", () => {
    const children = [makeChild()];
    const plans = [makePlan({ status: "current" })];
    const assessments = [
      makeSkillAssessment({ id: "s1", skill: "cooking", currentLevel: "competent" }),
    ];
    const accomPlans = [makeAccommodationPlan({ status: "confirmed" })];
    const support = [
      makeSupport({ id: "s1", supportType: "personal_adviser", status: "active" }),
      makeSupport({ id: "s2", supportType: "mentor", status: "active" }),
      makeSupport({ id: "s3", supportType: "social_worker", status: "active" }),
    ];
    const profiles = buildChildLeavingProfiles(children, plans, assessments, accomPlans, support);
    expect(profiles[0].overallReadiness).toBeGreaterThanOrEqual(80);
    expect(profiles[0].readinessLabel).toBe("Well Prepared");
  });

  it("calculates readiness for non-eligible child", () => {
    const children = [makeChild({ isEligibleChild: false })];
    const profiles = buildChildLeavingProfiles(children, [], [], [], []);
    expect(profiles[0].overallReadiness).toBe(0);
    expect(profiles[0].readinessLabel).toBe("Not Started");
  });

  it("sets primary concern for eligible child without plan", () => {
    const children = [makeChild()];
    const profiles = buildChildLeavingProfiles(children, [], [], [], []);
    expect(profiles[0].primaryConcern).toContain("No pathway plan");
  });

  it("sets primary concern for overdue pathway plan", () => {
    const children = [makeChild()];
    const plans = [makePlan({ status: "overdue" })];
    const profiles = buildChildLeavingProfiles(children, plans, [], [], []);
    expect(profiles[0].primaryConcern).toContain("Pathway plan overdue");
  });

  it("sets primary concern for missing personal adviser", () => {
    const children = [makeChild()];
    const plans = [makePlan({ status: "current" })];
    const profiles = buildChildLeavingProfiles(children, plans, [], [], []);
    expect(profiles[0].primaryConcern).toContain("No personal adviser");
  });

  it("sets primary concern for not started accommodation", () => {
    const children = [makeChild()];
    const plans = [makePlan({ status: "current" })];
    const support = [makeSupport({ supportType: "personal_adviser", status: "active" })];
    const accomPlans = [makeAccommodationPlan({ status: "not_started" })];
    const profiles = buildChildLeavingProfiles(children, plans, [], accomPlans, support);
    expect(profiles[0].primaryConcern).toContain("Accommodation planning not started");
  });

  it("sets primary concern for no assessed skills on eligible child", () => {
    const children = [makeChild()];
    const plans = [makePlan({ status: "current" })];
    const support = [makeSupport({ supportType: "personal_adviser", status: "active" })];
    const accomPlans = [makeAccommodationPlan({ status: "exploring" })];
    const profiles = buildChildLeavingProfiles(children, plans, [], accomPlans, support);
    expect(profiles[0].primaryConcern).toContain("No independence skills assessed");
  });

  it("no primary concern when everything is in order", () => {
    const children = [makeChild()];
    const plans = [makePlan({ status: "current" })];
    const assessments = [makeSkillAssessment({ currentLevel: "developing" })];
    const accomPlans = [makeAccommodationPlan({ status: "in_progress" })];
    const support = [makeSupport({ supportType: "personal_adviser", status: "active" })];
    const profiles = buildChildLeavingProfiles(children, plans, assessments, accomPlans, support);
    expect(profiles[0].primaryConcern).toBeUndefined();
  });

  it("readiness capped at 100", () => {
    const children = [makeChild()];
    const plans = [makePlan({ status: "current" })];
    const assessments: IndependenceSkillAssessment[] = [];
    const skills: SkillCategory[] = [
      "cooking", "budgeting", "cleaning", "laundry", "shopping",
      "personal_hygiene", "using_public_transport", "managing_appointments",
      "basic_first_aid", "understanding_tenancy",
    ];
    skills.forEach((skill, i) => {
      assessments.push(makeSkillAssessment({ id: `s${i}`, skill, currentLevel: "independent" }));
    });
    const accomPlans = [makeAccommodationPlan({ status: "confirmed" })];
    const support = [
      makeSupport({ id: "s1", supportType: "personal_adviser", status: "active" }),
      makeSupport({ id: "s2", supportType: "mentor", status: "active" }),
      makeSupport({ id: "s3", supportType: "social_worker", status: "active" }),
      makeSupport({ id: "s4", supportType: "community_group", status: "active" }),
      makeSupport({ id: "s5", supportType: "family_contact", status: "active" }),
    ];
    const profiles = buildChildLeavingProfiles(children, plans, assessments, accomPlans, support);
    expect(profiles[0].overallReadiness).toBeLessThanOrEqual(100);
  });

  it("readiness at minimum 0", () => {
    const children = [makeChild({ isEligibleChild: true })];
    const profiles = buildChildLeavingProfiles(children, [], [], [], []);
    expect(profiles[0].overallReadiness).toBeGreaterThanOrEqual(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 9. generateLeavingCareIntelligence
// ══════════════════════════════════════════════════════════════════════════════

describe("generateLeavingCareIntelligence", () => {
  it("returns correct structure", () => {
    const result = generateLeavingCareIntelligence(
      [makeChild()], [makePlan()], [], [], [],
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-18");
    expect(result.assessedAt).toBeDefined();
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.rating).toBeDefined();
    expect(result.pathwayPlanning).toBeDefined();
    expect(result.independenceSkills).toBeDefined();
    expect(result.accommodationPlanning).toBeDefined();
    expect(result.supportNetwork).toBeDefined();
    expect(result.childProfiles).toBeDefined();
    expect(result.strengths).toBeDefined();
    expect(result.areasForImprovement).toBeDefined();
    expect(result.actions).toBeDefined();
    expect(result.regulatoryLinks).toBeDefined();
  });

  it("sums domain scores for overall score", () => {
    const children = [makeChild()];
    const plans = [makePlan({ status: "current" })];
    const result = generateLeavingCareIntelligence(
      children, plans, [], [], [],
      "oak-house", "2026-01-01", "2026-05-18",
    );
    const domainSum =
      result.pathwayPlanning.score +
      result.independenceSkills.score +
      result.accommodationPlanning.score +
      result.supportNetwork.score;
    expect(result.overallScore).toBe(Math.max(0, Math.min(100, domainSum)));
  });

  it("overall score capped at 100", () => {
    const children: LeavingCareChild[] = []; // no children = all domains get max
    const result = generateLeavingCareIntelligence(
      children, [], [], [], [],
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("overall score minimum 0", () => {
    const result = generateLeavingCareIntelligence(
      [makeChild()], [], [], [], [],
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("assigns correct rating based on overall score", () => {
    // No eligible children → all max → outstanding
    const result = generateLeavingCareIntelligence(
      [], [], [], [], [],
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.overallScore).toBe(100);
    expect(result.rating).toBe("outstanding");
  });

  it("generates strengths for strong performance", () => {
    const children = [makeChild()];
    const plans = [makePlan({ status: "current", goalsSet: 10, goalsAchieved: 9 })];
    const allSkills: IndependenceSkillAssessment[] = [];
    const skills: SkillCategory[] = [
      "cooking", "budgeting", "cleaning", "laundry", "shopping",
      "personal_hygiene", "using_public_transport", "managing_appointments",
      "basic_first_aid", "understanding_tenancy",
    ];
    skills.forEach((skill, i) => {
      allSkills.push(makeSkillAssessment({ id: `s${i}`, skill, currentLevel: "competent", previousLevel: "developing" }));
    });
    const accomPlans = [makeAccommodationPlan({ status: "confirmed", identifiedOption: "staying_close", stayingCloseAvailable: true, transitionPlanInPlace: true, trialStayCompleted: true })];
    const support = [
      makeSupport({ id: "s1", supportType: "personal_adviser", status: "active" }),
      makeSupport({ id: "s2", supportType: "mentor", status: "active" }),
      makeSupport({ id: "s3", supportType: "social_worker", status: "active" }),
    ];
    const result = generateLeavingCareIntelligence(
      children, plans, allSkills, accomPlans, support,
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("generates areas for improvement for weak performance", () => {
    const children = [makeChild({ id: "c1" }), makeChild({ id: "c2" })];
    // c2 has no plan
    const plans = [makePlan({ id: "p1", childId: "c1", status: "overdue", youngPersonInvolved: false })];
    const result = generateLeavingCareIntelligence(
      children, plans, [], [], [],
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("generates actions for critical issues", () => {
    const children = [makeChild()];
    // No plan = needs urgent action
    const result = generateLeavingCareIntelligence(
      children, [], [], [], [],
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.actions.some((a) => a.includes("URGENT"))).toBe(true);
  });

  it("generates regulatory links", () => {
    const children = [makeChild()];
    const result = generateLeavingCareIntelligence(
      children, [], [], [], [],
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015, Reg 14"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
  });

  it("includes CA 1989 s23C and s24 for eligible children", () => {
    const children = [makeChild()];
    const result = generateLeavingCareIntelligence(
      children, [], [], [], [],
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("s23C"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("s24"))).toBe(true);
  });

  it("includes Leaving Care Act 2000 for eligible children", () => {
    const children = [makeChild()];
    const result = generateLeavingCareIntelligence(
      children, [], [], [], [],
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("Children (Leaving Care) Act 2000"))).toBe(true);
  });

  it("includes Reg 7 when plans are overdue", () => {
    const children = [makeChild()];
    const plans = [makePlan({ status: "overdue" })];
    const result = generateLeavingCareIntelligence(
      children, plans, [], [], [],
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("Reg 7"))).toBe(true);
  });

  it("includes s23C(4) when accommodation planning required", () => {
    const children = [makeChild()];
    const accomPlans = [makeAccommodationPlan()];
    const result = generateLeavingCareIntelligence(
      children, [makePlan()], [], accomPlans, [],
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("s23C(4)"))).toBe(true);
  });

  it("includes PA duty when children have no support", () => {
    const children = [makeChild()];
    const result = generateLeavingCareIntelligence(
      children, [makePlan()], [], [], [],
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("Personal adviser duty"))).toBe(true);
  });

  it("generates no-action message when all is well", () => {
    // no eligible children → nothing to action
    const result = generateLeavingCareIntelligence(
      [], [], [], [], [],
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.actions.some((a) => a.includes("No immediate actions"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 10. Chamberlain House Integration Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("Chamberlain House demo scenario", () => {
  const children = makeOakHouseChildren();
  const plans = makeOakHousePathwayPlans();
  const assessments = makeOakHouseAssessments();
  const accomPlans = makeOakHouseAccommodationPlans();
  const support = makeOakHouseSupportArrangements();

  it("produces correct child count", () => {
    const result = generateLeavingCareIntelligence(
      children, plans, assessments, accomPlans, support,
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.childProfiles).toHaveLength(3);
  });

  it("Morgan has the most developed pathway plan (oldest, eligible)", () => {
    const result = generateLeavingCareIntelligence(
      children, plans, assessments, accomPlans, support,
      "oak-house", "2026-01-01", "2026-05-18",
    );
    const morgan = result.childProfiles.find((p) => p.childId === "child-morgan");
    const alex = result.childProfiles.find((p) => p.childId === "child-alex");
    const jordan = result.childProfiles.find((p) => p.childId === "child-jordan");

    expect(morgan).toBeDefined();
    expect(morgan!.hasPathwayPlan).toBe(true);
    expect(morgan!.pathwayPlanStatus).toBe("current");
    expect(alex!.hasPathwayPlan).toBe(false);
    expect(jordan!.hasPathwayPlan).toBe(false);
  });

  it("Morgan has more skills assessed than Alex and Jordan", () => {
    const result = generateLeavingCareIntelligence(
      children, plans, assessments, accomPlans, support,
      "oak-house", "2026-01-01", "2026-05-18",
    );
    const morgan = result.childProfiles.find((p) => p.childId === "child-morgan")!;
    const alex = result.childProfiles.find((p) => p.childId === "child-alex")!;
    const jordan = result.childProfiles.find((p) => p.childId === "child-jordan")!;

    expect(morgan.skillsAssessed).toBeGreaterThan(alex.skillsAssessed);
    expect(morgan.skillsAssessed).toBeGreaterThan(jordan.skillsAssessed);
  });

  it("Morgan has higher skill level than Alex and Jordan", () => {
    const result = generateLeavingCareIntelligence(
      children, plans, assessments, accomPlans, support,
      "oak-house", "2026-01-01", "2026-05-18",
    );
    const morgan = result.childProfiles.find((p) => p.childId === "child-morgan")!;
    const alex = result.childProfiles.find((p) => p.childId === "child-alex")!;
    const jordan = result.childProfiles.find((p) => p.childId === "child-jordan")!;

    expect(morgan.independenceSkillLevel).toBeGreaterThan(alex.independenceSkillLevel);
    expect(morgan.independenceSkillLevel).toBeGreaterThan(jordan.independenceSkillLevel);
  });

  it("Morgan has higher readiness than younger non-eligible children", () => {
    const result = generateLeavingCareIntelligence(
      children, plans, assessments, accomPlans, support,
      "oak-house", "2026-01-01", "2026-05-18",
    );
    const morgan = result.childProfiles.find((p) => p.childId === "child-morgan")!;
    const alex = result.childProfiles.find((p) => p.childId === "child-alex")!;
    const jordan = result.childProfiles.find((p) => p.childId === "child-jordan")!;

    expect(morgan.overallReadiness).toBeGreaterThan(alex.overallReadiness);
    expect(morgan.overallReadiness).toBeGreaterThan(jordan.overallReadiness);
  });

  it("Morgan has a personal adviser", () => {
    const result = generateLeavingCareIntelligence(
      children, plans, assessments, accomPlans, support,
      "oak-house", "2026-01-01", "2026-05-18",
    );
    const morgan = result.childProfiles.find((p) => p.childId === "child-morgan")!;
    expect(morgan.hasPersonalAdviser).toBe(true);
    expect(morgan.activeSupportCount).toBe(4);
  });

  it("Alex and Jordan are not eligible children", () => {
    const result = generateLeavingCareIntelligence(
      children, plans, assessments, accomPlans, support,
      "oak-house", "2026-01-01", "2026-05-18",
    );
    const alex = result.childProfiles.find((p) => p.childId === "child-alex")!;
    const jordan = result.childProfiles.find((p) => p.childId === "child-jordan")!;
    // Non-eligible children don't get pathway plan concern
    expect(alex.primaryConcern).toBeUndefined();
    expect(jordan.primaryConcern).toBeUndefined();
  });

  it("pathway planning evaluates correctly for Morgan only", () => {
    const result = generateLeavingCareIntelligence(
      children, plans, assessments, accomPlans, support,
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.pathwayPlanning.totalPlansRequired).toBe(1); // only Morgan is eligible
    expect(result.pathwayPlanning.plansInPlace).toBe(1);
    expect(result.pathwayPlanning.plansCurrent).toBe(1);
    expect(result.pathwayPlanning.plansOverdue).toBe(0);
  });

  it("independence skills assessed across all children", () => {
    const result = generateLeavingCareIntelligence(
      children, plans, assessments, accomPlans, support,
      "oak-house", "2026-01-01", "2026-05-18",
    );
    // Morgan has 10, Alex has 4, Jordan has 3 = 17 total
    expect(result.independenceSkills.totalAssessments).toBe(17);
  });

  it("accommodation planning only for Morgan (eligible)", () => {
    const result = generateLeavingCareIntelligence(
      children, plans, assessments, accomPlans, support,
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.accommodationPlanning.totalChildrenRequiringPlan).toBe(1);
  });

  it("support network tracks Morgan's arrangements", () => {
    const result = generateLeavingCareIntelligence(
      children, plans, assessments, accomPlans, support,
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.supportNetwork.personalAdvisersAssigned).toBe(1);
    expect(result.supportNetwork.mentorsActive).toBe(1);
    expect(result.supportNetwork.activeArrangements).toBe(4);
  });

  it("overall score is within valid range", () => {
    const result = generateLeavingCareIntelligence(
      children, plans, assessments, accomPlans, support,
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("generates meaningful strengths for Chamberlain House", () => {
    const result = generateLeavingCareIntelligence(
      children, plans, assessments, accomPlans, support,
      "oak-house", "2026-01-01", "2026-05-18",
    );
    // Morgan's plan is current, involved, with PA and mentor
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("generates regulatory links including leaving care legislation", () => {
    const result = generateLeavingCareIntelligence(
      children, plans, assessments, accomPlans, support,
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015, Reg 14"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Children Act 1989, s23C"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Children (Leaving Care) Act 2000"))).toBe(true);
  });

  it("category breakdown includes all 10 skill categories", () => {
    const result = generateLeavingCareIntelligence(
      children, plans, assessments, accomPlans, support,
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.independenceSkills.categoryBreakdown).toHaveLength(10);
  });

  it("cooking has the most assessments across children", () => {
    const result = generateLeavingCareIntelligence(
      children, plans, assessments, accomPlans, support,
      "oak-house", "2026-01-01", "2026-05-18",
    );
    const cooking = result.independenceSkills.categoryBreakdown.find(
      (c) => c.skill === "cooking",
    )!;
    expect(cooking.childCount).toBe(3); // all three children have cooking assessed
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 11. Edge Cases
// ══════════════════════════════════════════════════════════════════════════════

describe("Edge cases", () => {
  it("handles completely empty data", () => {
    const result = generateLeavingCareIntelligence(
      [], [], [], [], [],
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.overallScore).toBe(100); // all domains default to max
    expect(result.rating).toBe("outstanding");
    expect(result.childProfiles).toHaveLength(0);
  });

  it("handles child with all data but non-eligible", () => {
    const children = [makeChild({ isEligibleChild: false })];
    const result = generateLeavingCareIntelligence(
      children, [makePlan()], [], [], [],
      "oak-house", "2026-01-01", "2026-05-18",
    );
    // Pathway, accommodation, support all get max as no eligible children
    expect(result.pathwayPlanning.score).toBe(30);
    expect(result.accommodationPlanning.score).toBe(25);
    expect(result.supportNetwork.score).toBe(20);
  });

  it("handles many children with many assessments", () => {
    const children = Array.from({ length: 10 }, (_, i) =>
      makeChild({ id: `c${i}`, name: `Child ${i}`, isEligibleChild: i >= 5 }),
    );
    const plans = children
      .filter((c) => c.isEligibleChild)
      .map((c, i) => makePlan({ id: `p${i}`, childId: c.id }));
    const assessments = children.flatMap((c) =>
      (["cooking", "budgeting", "cleaning"] as SkillCategory[]).map((skill, i) =>
        makeSkillAssessment({
          id: `sa-${c.id}-${i}`,
          childId: c.id,
          skill,
          currentLevel: "developing",
        }),
      ),
    );
    const result = generateLeavingCareIntelligence(
      children, plans, assessments, [], [],
      "test-home", "2026-01-01", "2026-12-31",
    );
    expect(result.childProfiles).toHaveLength(10);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("handles duplicate skill assessments for same child-skill", () => {
    const children = [makeChild()];
    const assessments = [
      makeSkillAssessment({ id: "s1", skill: "cooking", currentLevel: "developing" }),
      makeSkillAssessment({ id: "s2", skill: "cooking", currentLevel: "competent" }),
    ];
    const result = evaluateIndependenceSkills(children, assessments);
    // Both count as assessments but only 1 unique pair for coverage
    expect(result.totalAssessments).toBe(2);
    expect(result.coverageRate).toBe(10); // 1 unique pair / 10 categories
  });

  it("handles support arrangements with mixed statuses", () => {
    const children = [makeChild()];
    const support = [
      makeSupport({ id: "s1", supportType: "personal_adviser", status: "active" }),
      makeSupport({ id: "s2", supportType: "personal_adviser", status: "ended" }),
      makeSupport({ id: "s3", supportType: "mentor", status: "planned" }),
      makeSupport({ id: "s4", supportType: "social_worker", status: "declined" }),
      makeSupport({ id: "s5", supportType: "community_group", status: "referred" }),
    ];
    const result = evaluateSupportNetwork(children, support);
    expect(result.activeArrangements).toBe(1);
    expect(result.totalArrangements).toBe(5);
  });

  it("handles child with all skills at independent level", () => {
    const children = [makeChild()];
    const skills: SkillCategory[] = [
      "cooking", "budgeting", "cleaning", "laundry", "shopping",
      "personal_hygiene", "using_public_transport", "managing_appointments",
      "basic_first_aid", "understanding_tenancy",
    ];
    const assessments = skills.map((skill, i) =>
      makeSkillAssessment({ id: `s${i}`, skill, currentLevel: "independent" }),
    );
    const result = evaluateIndependenceSkills(children, assessments);
    expect(result.coverageRate).toBe(100);
    expect(result.averageSkillLevel).toBe(4);
    expect(result.skillsAtCompetentOrAbove).toBe(10);
  });

  it("handles all plans as draft status", () => {
    const children = [makeChild({ id: "c1" }), makeChild({ id: "c2" })];
    const plans = [
      makePlan({ id: "p1", childId: "c1", status: "draft" }),
      makePlan({ id: "p2", childId: "c2", status: "draft" }),
    ];
    const result = evaluatePathwayPlanning(children, plans);
    expect(result.plansDraft).toBe(2);
    expect(result.plansInPlace).toBe(0);
    expect(result.plansCurrent).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 12. Actions generation
// ══════════════════════════════════════════════════════════════════════════════

describe("Actions generation detail", () => {
  it("generates URGENT action for plans not started", () => {
    const children = [makeChild({ id: "c1" }), makeChild({ id: "c2" })];
    // c2 has no plan
    const plans = [makePlan({ id: "p1", childId: "c1", status: "current" })];
    const result = generateLeavingCareIntelligence(
      children, plans, [], [], [],
      "test", "2026-01-01", "2026-12-31",
    );
    expect(result.actions.some((a) => a.includes("URGENT") && a.includes("pathway plan"))).toBe(true);
  });

  it("generates URGENT action for overdue plans", () => {
    const children = [makeChild()];
    const plans = [makePlan({ status: "overdue" })];
    const result = generateLeavingCareIntelligence(
      children, plans, [], [], [],
      "test", "2026-01-01", "2026-12-31",
    );
    expect(result.actions.some((a) => a.includes("URGENT") && a.includes("overdue"))).toBe(true);
  });

  it("generates HIGH action for children with no support", () => {
    const children = [makeChild()];
    const plans = [makePlan()];
    const result = generateLeavingCareIntelligence(
      children, plans, [], [], [],
      "test", "2026-01-01", "2026-12-31",
    );
    expect(result.actions.some((a) => a.includes("HIGH") && a.includes("no active support"))).toBe(true);
  });

  it("generates HIGH action for not-started accommodation", () => {
    const children = [makeChild()];
    const plans = [makePlan()];
    const accomPlans = [makeAccommodationPlan({ status: "not_started" })];
    const result = generateLeavingCareIntelligence(
      children, plans, [], accomPlans, [],
      "test", "2026-01-01", "2026-12-31",
    );
    expect(result.actions.some((a) => a.includes("HIGH") && a.includes("accommodation"))).toBe(true);
  });

  it("generates MEDIUM action for low skill coverage", () => {
    const children = [makeChild()];
    const plans = [makePlan()];
    const support = [
      makeSupport({ supportType: "personal_adviser", status: "active" }),
    ];
    // No assessments → coverage = 0%
    const result = generateLeavingCareIntelligence(
      children, plans, [], [], support,
      "test", "2026-01-01", "2026-12-31",
    );
    expect(result.actions.some((a) => a.includes("MEDIUM") && a.includes("skills coverage"))).toBe(true);
  });

  it("generates MEDIUM action for no transition plans", () => {
    const children = [makeChild()];
    const plans = [makePlan()];
    const accomPlans = [makeAccommodationPlan({ transitionPlanInPlace: false })];
    const support = [makeSupport({ supportType: "personal_adviser", status: "active" })];
    const result = generateLeavingCareIntelligence(
      children, plans, [], accomPlans, support,
      "test", "2026-01-01", "2026-12-31",
    );
    expect(result.actions.some((a) => a.includes("MEDIUM") && a.includes("transition plans"))).toBe(true);
  });
});
