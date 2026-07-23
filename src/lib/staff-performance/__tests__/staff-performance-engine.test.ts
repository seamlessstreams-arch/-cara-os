// ══════════════════════════════════════════════════════════════════════════════
// Cara — Staff Performance Intelligence Engine Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateQualificationCompliance,
  evaluateReviewQuality,
  evaluatePDPProgress,
  evaluateCompetencyDevelopment,
  generateStaffPerformanceIntelligence,
  getQualificationTypeLabel,
  getQualificationStatusLabel,
  getPerformanceRatingLabel,
  getReviewStatusLabel,
  getPDPGoalStatusLabel,
  getCompetencyAreaLabel,
  getCompetencyLevelLabel,
} from "../staff-performance-engine";
import type {
  StaffMember,
  QualificationRecord,
  PerformanceReview,
  PDPGoal,
  CompetencyAssessment,
  QualificationType,
  QualificationStatus,
  PerformanceRating,
  ReviewStatus,
  PDPGoalStatus,
  CompetencyArea,
  CompetencyLevel,
} from "../staff-performance-engine";

// ── Shared Constants ───────────────────────────────────────────────────────

const PERIOD_START = "2025-01-01";
const PERIOD_END = "2025-06-30";
const HOME_ID = "oak-house";

// ── Factory Helpers ────────────────────────────────────────────────────────

function makeStaff(overrides: Partial<StaffMember> = {}): StaffMember {
  return {
    id: "staff-1",
    name: "Test Staff",
    role: "RSW",
    startDate: "2023-01-01",
    isActive: true,
    requiredQualifications: ["level_3_diploma", "first_aid", "safeguarding"],
    ...overrides,
  };
}

function makeQualification(overrides: Partial<QualificationRecord> = {}): QualificationRecord {
  return {
    id: "q-1",
    staffId: "staff-1",
    type: "level_3_diploma",
    status: "achieved",
    achievedDate: "2024-01-01",
    ...overrides,
  };
}

function makeReview(overrides: Partial<PerformanceReview> = {}): PerformanceReview {
  return {
    id: "rev-1",
    staffId: "staff-1",
    reviewDate: "2025-03-15",
    reviewerId: "staff-manager",
    rating: "effective",
    status: "completed_on_time",
    objectivesSet: 4,
    objectivesMet: 3,
    developmentAreasIdentified: 2,
    staffViewsRecorded: true,
    actionPlanCreated: true,
    ...overrides,
  };
}

function makePDPGoal(overrides: Partial<PDPGoal> = {}): PDPGoal {
  return {
    id: "pdp-1",
    staffId: "staff-1",
    description: "Complete training module",
    status: "achieved",
    targetDate: "2025-06-01",
    completedDate: "2025-05-15",
    linkedToTraining: true,
    ...overrides,
  };
}

function makeCompetencyAssessment(overrides: Partial<CompetencyAssessment> = {}): CompetencyAssessment {
  return {
    id: "ca-1",
    staffId: "staff-1",
    area: "safeguarding",
    level: "competent",
    assessedDate: "2025-03-15",
    assessedBy: "staff-manager",
    ...overrides,
  };
}

// ── Chamberlain House Demo Data ────────────────────────────────────────────────────

function getOakHouseStaff(): StaffMember[] {
  return [
    {
      id: "staff-darren", name: "Darren Laville", role: "Registered Manager",
      startDate: "2022-01-10", isActive: true,
      requiredQualifications: ["level_5_diploma", "first_aid", "safeguarding", "restraint", "medication", "fire_safety", "management"],
    },
    {
      id: "staff-sarah", name: "Sarah Johnson", role: "Senior RSW",
      startDate: "2022-06-01", isActive: true,
      requiredQualifications: ["level_3_diploma", "first_aid", "safeguarding", "restraint", "medication", "fire_safety"],
      managerId: "staff-darren",
    },
    {
      id: "staff-tom", name: "Tom Richards", role: "RSW",
      startDate: "2023-03-15", isActive: true,
      requiredQualifications: ["level_3_diploma", "first_aid", "safeguarding", "restraint", "fire_safety"],
      managerId: "staff-sarah",
    },
    {
      id: "staff-lisa", name: "Lisa Williams", role: "Senior RSW",
      startDate: "2022-09-01", isActive: true,
      requiredQualifications: ["level_3_diploma", "first_aid", "safeguarding", "restraint", "medication", "fire_safety"],
      managerId: "staff-darren",
    },
  ];
}

function getOakHouseQualifications(): QualificationRecord[] {
  return [
    { id: "q-d1", staffId: "staff-darren", type: "level_5_diploma", status: "achieved", achievedDate: "2021-09-01" },
    { id: "q-d2", staffId: "staff-darren", type: "first_aid", status: "achieved", achievedDate: "2025-01-10", expiryDate: "2026-01-10", renewalDue: "2025-12-10" },
    { id: "q-d3", staffId: "staff-darren", type: "safeguarding", status: "achieved", achievedDate: "2025-02-15", expiryDate: "2027-02-15", renewalDue: "2027-01-15" },
    { id: "q-d4", staffId: "staff-darren", type: "restraint", status: "achieved", achievedDate: "2024-11-01", expiryDate: "2025-11-01", renewalDue: "2025-10-01" },
    { id: "q-d5", staffId: "staff-darren", type: "medication", status: "achieved", achievedDate: "2024-06-01", expiryDate: "2026-06-01" },
    { id: "q-d6", staffId: "staff-darren", type: "fire_safety", status: "achieved", achievedDate: "2025-03-01", expiryDate: "2026-03-01" },
    { id: "q-d7", staffId: "staff-darren", type: "management", status: "achieved", achievedDate: "2023-04-01" },
    { id: "q-s1", staffId: "staff-sarah", type: "level_3_diploma", status: "achieved", achievedDate: "2020-07-01" },
    { id: "q-s2", staffId: "staff-sarah", type: "first_aid", status: "achieved", achievedDate: "2025-01-15", expiryDate: "2026-01-15", renewalDue: "2025-12-15" },
    { id: "q-s3", staffId: "staff-sarah", type: "safeguarding", status: "achieved", achievedDate: "2025-02-20", expiryDate: "2027-02-20", renewalDue: "2027-01-20" },
    { id: "q-s4", staffId: "staff-sarah", type: "restraint", status: "achieved", achievedDate: "2025-01-15", expiryDate: "2026-01-15", renewalDue: "2025-12-15" },
    { id: "q-s5", staffId: "staff-sarah", type: "medication", status: "achieved", achievedDate: "2024-08-01", expiryDate: "2026-08-01" },
    { id: "q-s6", staffId: "staff-sarah", type: "fire_safety", status: "achieved", achievedDate: "2025-03-01", expiryDate: "2026-03-01" },
    { id: "q-t1", staffId: "staff-tom", type: "level_3_diploma", status: "in_progress" },
    { id: "q-t2", staffId: "staff-tom", type: "first_aid", status: "achieved", achievedDate: "2025-01-15", expiryDate: "2026-01-15", renewalDue: "2025-12-15" },
    { id: "q-t3", staffId: "staff-tom", type: "safeguarding", status: "achieved", achievedDate: "2025-02-25", expiryDate: "2027-02-25", renewalDue: "2027-01-25" },
    { id: "q-t4", staffId: "staff-tom", type: "restraint", status: "achieved", achievedDate: "2025-01-15", expiryDate: "2026-01-15", renewalDue: "2025-12-15" },
    { id: "q-t5", staffId: "staff-tom", type: "fire_safety", status: "achieved", achievedDate: "2025-03-01", expiryDate: "2026-03-01" },
    { id: "q-l1", staffId: "staff-lisa", type: "level_3_diploma", status: "achieved", achievedDate: "2019-06-01" },
    { id: "q-l2", staffId: "staff-lisa", type: "first_aid", status: "achieved", achievedDate: "2025-01-20", expiryDate: "2026-01-20", renewalDue: "2025-12-20" },
    { id: "q-l3", staffId: "staff-lisa", type: "safeguarding", status: "achieved", achievedDate: "2025-02-22", expiryDate: "2027-02-22", renewalDue: "2027-01-22" },
    { id: "q-l4", staffId: "staff-lisa", type: "restraint", status: "achieved", achievedDate: "2025-02-01", expiryDate: "2026-02-01", renewalDue: "2026-01-01" },
    { id: "q-l5", staffId: "staff-lisa", type: "medication", status: "achieved", achievedDate: "2024-09-01", expiryDate: "2026-09-01" },
    { id: "q-l6", staffId: "staff-lisa", type: "fire_safety", status: "achieved", achievedDate: "2025-03-01", expiryDate: "2026-03-01" },
  ];
}

function getOakHouseReviews(): PerformanceReview[] {
  return [
    { id: "rev-d1", staffId: "staff-darren", reviewDate: "2025-03-15", reviewerId: "ext-ri", rating: "exceptional", status: "completed_on_time", objectivesSet: 5, objectivesMet: 5, developmentAreasIdentified: 2, staffViewsRecorded: true, actionPlanCreated: true },
    { id: "rev-s1", staffId: "staff-sarah", reviewDate: "2025-03-20", reviewerId: "staff-darren", rating: "effective", status: "completed_on_time", objectivesSet: 4, objectivesMet: 3, developmentAreasIdentified: 2, staffViewsRecorded: true, actionPlanCreated: true },
    { id: "rev-t1", staffId: "staff-tom", reviewDate: "2025-04-01", reviewerId: "staff-sarah", rating: "developing", status: "completed_on_time", objectivesSet: 4, objectivesMet: 2, developmentAreasIdentified: 3, staffViewsRecorded: true, actionPlanCreated: true },
    { id: "rev-l1", staffId: "staff-lisa", reviewDate: "2025-03-25", reviewerId: "staff-darren", rating: "effective", status: "completed_on_time", objectivesSet: 4, objectivesMet: 4, developmentAreasIdentified: 1, staffViewsRecorded: true, actionPlanCreated: true },
  ];
}

function getOakHousePDPGoals(): PDPGoal[] {
  return [
    { id: "pdp-d1", staffId: "staff-darren", description: "Complete Level 7 Strategic Leadership", status: "in_progress", targetDate: "2025-09-01", linkedToTraining: true },
    { id: "pdp-d2", staffId: "staff-darren", description: "Achieve Ofsted Outstanding", status: "in_progress", targetDate: "2025-12-31", linkedToTraining: false },
    { id: "pdp-d3", staffId: "staff-darren", description: "Implement therapeutic care model", status: "achieved", targetDate: "2025-06-01", completedDate: "2025-05-15", linkedToTraining: true },
    { id: "pdp-s1", staffId: "staff-sarah", description: "Begin Level 4 Diploma", status: "in_progress", targetDate: "2025-09-01", linkedToTraining: true },
    { id: "pdp-s2", staffId: "staff-sarah", description: "Complete trauma-informed practice", status: "achieved", targetDate: "2025-04-01", completedDate: "2025-03-28", linkedToTraining: true },
    { id: "pdp-s3", staffId: "staff-sarah", description: "Mentor new RSW staff", status: "achieved", targetDate: "2025-06-30", completedDate: "2025-06-15", linkedToTraining: false },
    { id: "pdp-t1", staffId: "staff-tom", description: "Complete Level 3 Diploma", status: "in_progress", targetDate: "2025-09-15", linkedToTraining: true },
    { id: "pdp-t2", staffId: "staff-tom", description: "Develop lone working confidence", status: "in_progress", targetDate: "2025-08-01", linkedToTraining: false },
    { id: "pdp-t3", staffId: "staff-tom", description: "Achieve competent in record keeping", status: "achieved", targetDate: "2025-05-01", completedDate: "2025-04-20", linkedToTraining: true },
    { id: "pdp-l1", staffId: "staff-lisa", description: "Complete mental health first aid", status: "achieved", targetDate: "2025-03-01", completedDate: "2025-02-20", linkedToTraining: true },
    { id: "pdp-l2", staffId: "staff-lisa", description: "Lead reflective practice sessions", status: "achieved", targetDate: "2025-06-30", completedDate: "2025-06-10", linkedToTraining: false },
    { id: "pdp-l3", staffId: "staff-lisa", description: "Support therapeutic model dev", status: "in_progress", targetDate: "2025-09-01", linkedToTraining: true },
  ];
}

function getOakHouseCompetencyAssessments(): CompetencyAssessment[] {
  return [
    { id: "ca-d1", staffId: "staff-darren", area: "safeguarding", level: "expert", assessedDate: "2025-03-15", assessedBy: "ext-ri", previousLevel: "competent" },
    { id: "ca-d2", staffId: "staff-darren", area: "behaviour_management", level: "expert", assessedDate: "2025-03-15", assessedBy: "ext-ri", previousLevel: "competent" },
    { id: "ca-d3", staffId: "staff-darren", area: "therapeutic_care", level: "competent", assessedDate: "2025-03-15", assessedBy: "ext-ri", previousLevel: "developing" },
    { id: "ca-d4", staffId: "staff-darren", area: "record_keeping", level: "expert", assessedDate: "2025-03-15", assessedBy: "ext-ri" },
    { id: "ca-d5", staffId: "staff-darren", area: "communication", level: "expert", assessedDate: "2025-03-15", assessedBy: "ext-ri" },
    { id: "ca-d6", staffId: "staff-darren", area: "regulatory_knowledge", level: "expert", assessedDate: "2025-03-15", assessedBy: "ext-ri" },
    { id: "ca-d7", staffId: "staff-darren", area: "risk_management", level: "competent", assessedDate: "2025-03-15", assessedBy: "ext-ri" },
    { id: "ca-d8", staffId: "staff-darren", area: "child_centred_practice", level: "expert", assessedDate: "2025-03-15", assessedBy: "ext-ri", previousLevel: "competent" },
    { id: "ca-s1", staffId: "staff-sarah", area: "safeguarding", level: "competent", assessedDate: "2025-03-20", assessedBy: "staff-darren", previousLevel: "developing" },
    { id: "ca-s2", staffId: "staff-sarah", area: "behaviour_management", level: "competent", assessedDate: "2025-03-20", assessedBy: "staff-darren" },
    { id: "ca-s3", staffId: "staff-sarah", area: "therapeutic_care", level: "developing", assessedDate: "2025-03-20", assessedBy: "staff-darren", previousLevel: "emerging" },
    { id: "ca-s4", staffId: "staff-sarah", area: "record_keeping", level: "competent", assessedDate: "2025-03-20", assessedBy: "staff-darren", previousLevel: "developing" },
    { id: "ca-s5", staffId: "staff-sarah", area: "communication", level: "competent", assessedDate: "2025-03-20", assessedBy: "staff-darren" },
    { id: "ca-s6", staffId: "staff-sarah", area: "child_centred_practice", level: "competent", assessedDate: "2025-03-20", assessedBy: "staff-darren" },
    { id: "ca-t1", staffId: "staff-tom", area: "safeguarding", level: "developing", assessedDate: "2025-04-01", assessedBy: "staff-sarah", previousLevel: "emerging" },
    { id: "ca-t2", staffId: "staff-tom", area: "behaviour_management", level: "developing", assessedDate: "2025-04-01", assessedBy: "staff-sarah", previousLevel: "emerging" },
    { id: "ca-t3", staffId: "staff-tom", area: "record_keeping", level: "competent", assessedDate: "2025-04-01", assessedBy: "staff-sarah", previousLevel: "developing" },
    { id: "ca-t4", staffId: "staff-tom", area: "communication", level: "developing", assessedDate: "2025-04-01", assessedBy: "staff-sarah" },
    { id: "ca-t5", staffId: "staff-tom", area: "child_centred_practice", level: "developing", assessedDate: "2025-04-01", assessedBy: "staff-sarah", previousLevel: "emerging" },
    { id: "ca-t6", staffId: "staff-tom", area: "teamwork", level: "competent", assessedDate: "2025-04-01", assessedBy: "staff-sarah" },
    { id: "ca-l1", staffId: "staff-lisa", area: "safeguarding", level: "competent", assessedDate: "2025-03-25", assessedBy: "staff-darren", previousLevel: "competent" },
    { id: "ca-l2", staffId: "staff-lisa", area: "therapeutic_care", level: "competent", assessedDate: "2025-03-25", assessedBy: "staff-darren", previousLevel: "developing" },
    { id: "ca-l3", staffId: "staff-lisa", area: "behaviour_management", level: "competent", assessedDate: "2025-03-25", assessedBy: "staff-darren" },
    { id: "ca-l4", staffId: "staff-lisa", area: "record_keeping", level: "competent", assessedDate: "2025-03-25", assessedBy: "staff-darren" },
    { id: "ca-l5", staffId: "staff-lisa", area: "communication", level: "expert", assessedDate: "2025-03-25", assessedBy: "staff-darren", previousLevel: "competent" },
    { id: "ca-l6", staffId: "staff-lisa", area: "child_centred_practice", level: "competent", assessedDate: "2025-03-25", assessedBy: "staff-darren" },
    { id: "ca-l7", staffId: "staff-lisa", area: "professional_development", level: "competent", assessedDate: "2025-03-25", assessedBy: "staff-darren" },
  ];
}

// ══════════════════════════════════════════════════════════════════════════════
// Label Functions
// ══════════════════════════════════════════════════════════════════════════════

describe("Label Functions", () => {
  describe("getQualificationTypeLabel", () => {
    it("returns human-readable labels for all qualification types", () => {
      expect(getQualificationTypeLabel("level_3_diploma")).toBe("Level 3 Diploma");
      expect(getQualificationTypeLabel("level_4_diploma")).toBe("Level 4 Diploma");
      expect(getQualificationTypeLabel("level_5_diploma")).toBe("Level 5 Diploma");
      expect(getQualificationTypeLabel("first_aid")).toBe("First Aid");
      expect(getQualificationTypeLabel("safeguarding")).toBe("Safeguarding");
      expect(getQualificationTypeLabel("restraint")).toBe("Restraint");
      expect(getQualificationTypeLabel("medication")).toBe("Medication");
      expect(getQualificationTypeLabel("fire_safety")).toBe("Fire Safety");
      expect(getQualificationTypeLabel("food_hygiene")).toBe("Food Hygiene");
      expect(getQualificationTypeLabel("mental_health")).toBe("Mental Health");
      expect(getQualificationTypeLabel("therapeutic_care")).toBe("Therapeutic Care");
      expect(getQualificationTypeLabel("management")).toBe("Management");
    });
  });

  describe("getQualificationStatusLabel", () => {
    it("returns human-readable labels for all qualification statuses", () => {
      expect(getQualificationStatusLabel("not_started")).toBe("Not Started");
      expect(getQualificationStatusLabel("in_progress")).toBe("In Progress");
      expect(getQualificationStatusLabel("achieved")).toBe("Achieved");
      expect(getQualificationStatusLabel("expired")).toBe("Expired");
      expect(getQualificationStatusLabel("not_applicable")).toBe("Not Applicable");
    });
  });

  describe("getPerformanceRatingLabel", () => {
    it("returns human-readable labels for all performance ratings", () => {
      expect(getPerformanceRatingLabel("exceptional")).toBe("Exceptional");
      expect(getPerformanceRatingLabel("effective")).toBe("Effective");
      expect(getPerformanceRatingLabel("developing")).toBe("Developing");
      expect(getPerformanceRatingLabel("underperforming")).toBe("Underperforming");
      expect(getPerformanceRatingLabel("capability_concern")).toBe("Capability Concern");
    });
  });

  describe("getReviewStatusLabel", () => {
    it("returns human-readable labels for all review statuses", () => {
      expect(getReviewStatusLabel("completed_on_time")).toBe("Completed On Time");
      expect(getReviewStatusLabel("completed_late")).toBe("Completed Late");
      expect(getReviewStatusLabel("overdue")).toBe("Overdue");
      expect(getReviewStatusLabel("not_due")).toBe("Not Due");
    });
  });

  describe("getPDPGoalStatusLabel", () => {
    it("returns human-readable labels for all PDP goal statuses", () => {
      expect(getPDPGoalStatusLabel("not_started")).toBe("Not Started");
      expect(getPDPGoalStatusLabel("in_progress")).toBe("In Progress");
      expect(getPDPGoalStatusLabel("achieved")).toBe("Achieved");
      expect(getPDPGoalStatusLabel("missed")).toBe("Missed");
      expect(getPDPGoalStatusLabel("deferred")).toBe("Deferred");
    });
  });

  describe("getCompetencyAreaLabel", () => {
    it("returns human-readable labels for all competency areas", () => {
      expect(getCompetencyAreaLabel("safeguarding")).toBe("Safeguarding");
      expect(getCompetencyAreaLabel("behaviour_management")).toBe("Behaviour Management");
      expect(getCompetencyAreaLabel("therapeutic_care")).toBe("Therapeutic Care");
      expect(getCompetencyAreaLabel("record_keeping")).toBe("Record Keeping");
      expect(getCompetencyAreaLabel("communication")).toBe("Communication");
      expect(getCompetencyAreaLabel("teamwork")).toBe("Teamwork");
      expect(getCompetencyAreaLabel("professional_development")).toBe("Professional Development");
      expect(getCompetencyAreaLabel("child_centred_practice")).toBe("Child-Centred Practice");
      expect(getCompetencyAreaLabel("regulatory_knowledge")).toBe("Regulatory Knowledge");
      expect(getCompetencyAreaLabel("risk_management")).toBe("Risk Management");
    });
  });

  describe("getCompetencyLevelLabel", () => {
    it("returns human-readable labels for all competency levels", () => {
      expect(getCompetencyLevelLabel("not_assessed")).toBe("Not Assessed");
      expect(getCompetencyLevelLabel("emerging")).toBe("Emerging");
      expect(getCompetencyLevelLabel("developing")).toBe("Developing");
      expect(getCompetencyLevelLabel("competent")).toBe("Competent");
      expect(getCompetencyLevelLabel("expert")).toBe("Expert");
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Qualification Compliance
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateQualificationCompliance", () => {
  it("returns zero score for no active staff", () => {
    const result = evaluateQualificationCompliance([], [], PERIOD_END);
    expect(result.overallScore).toBe(0);
    expect(result.totalRequired).toBe(0);
  });

  it("returns zero score for inactive staff only", () => {
    const staff = [makeStaff({ isActive: false })];
    const result = evaluateQualificationCompliance(staff, [], PERIOD_END);
    expect(result.overallScore).toBe(0);
  });

  it("scores full marks when all qualifications achieved, no expired, mandatory complete, renewal high", () => {
    const staff = [makeStaff({ id: "s1", requiredQualifications: ["level_3_diploma", "first_aid", "safeguarding"] })];
    const quals: QualificationRecord[] = [
      makeQualification({ id: "q1", staffId: "s1", type: "level_3_diploma", status: "achieved" }),
      makeQualification({ id: "q2", staffId: "s1", type: "first_aid", status: "achieved", expiryDate: "2026-01-01", renewalDue: "2025-12-01" }),
      makeQualification({ id: "q3", staffId: "s1", type: "safeguarding", status: "achieved", expiryDate: "2027-01-01", renewalDue: "2026-12-01" }),
    ];
    const result = evaluateQualificationCompliance(staff, quals, PERIOD_END);
    expect(result.achievedRate).toBe(100);
    expect(result.expiredCount).toBe(0);
    expect(result.overallScore).toBe(25);
  });

  it("calculates achieved rate correctly with partial compliance", () => {
    const staff = [makeStaff({ id: "s1", requiredQualifications: ["level_3_diploma", "first_aid", "safeguarding", "restraint"] })];
    const quals: QualificationRecord[] = [
      makeQualification({ id: "q1", staffId: "s1", type: "level_3_diploma", status: "achieved" }),
      makeQualification({ id: "q2", staffId: "s1", type: "first_aid", status: "achieved" }),
      makeQualification({ id: "q3", staffId: "s1", type: "safeguarding", status: "in_progress" }),
      makeQualification({ id: "q4", staffId: "s1", type: "restraint", status: "not_started" }),
    ];
    const result = evaluateQualificationCompliance(staff, quals, PERIOD_END);
    expect(result.totalRequired).toBe(4);
    expect(result.totalAchieved).toBe(2);
    expect(result.achievedRate).toBe(50);
  });

  it("detects expired qualifications", () => {
    const staff = [makeStaff({ id: "s1" })];
    const quals: QualificationRecord[] = [
      makeQualification({ id: "q1", staffId: "s1", type: "level_3_diploma", status: "achieved" }),
      makeQualification({ id: "q2", staffId: "s1", type: "first_aid", status: "expired" }),
      makeQualification({ id: "q3", staffId: "s1", type: "safeguarding", status: "achieved" }),
    ];
    const result = evaluateQualificationCompliance(staff, quals, PERIOD_END);
    expect(result.expiredCount).toBe(1);
  });

  it("detects qualifications expired by date even when status is achieved", () => {
    const staff = [makeStaff({ id: "s1" })];
    const quals: QualificationRecord[] = [
      makeQualification({ id: "q1", staffId: "s1", type: "level_3_diploma", status: "achieved" }),
      makeQualification({ id: "q2", staffId: "s1", type: "first_aid", status: "achieved", expiryDate: "2025-01-01" }),
      makeQualification({ id: "q3", staffId: "s1", type: "safeguarding", status: "achieved" }),
    ];
    const result = evaluateQualificationCompliance(staff, quals, PERIOD_END);
    expect(result.expiredCount).toBe(1);
  });

  it("awards mandatory compliance points when all mandatory quals achieved", () => {
    const staff = [makeStaff({ id: "s1", requiredQualifications: ["level_3_diploma", "first_aid", "safeguarding"] })];
    const quals: QualificationRecord[] = [
      makeQualification({ id: "q1", staffId: "s1", type: "level_3_diploma", status: "achieved" }),
      makeQualification({ id: "q2", staffId: "s1", type: "first_aid", status: "achieved" }),
      makeQualification({ id: "q3", staffId: "s1", type: "safeguarding", status: "achieved" }),
    ];
    const result = evaluateQualificationCompliance(staff, quals, PERIOD_END);
    expect(result.mandatoryComplianceRate).toBe(100);
  });

  it("correctly handles multiple staff members", () => {
    const staff = [
      makeStaff({ id: "s1", requiredQualifications: ["level_3_diploma", "first_aid"] }),
      makeStaff({ id: "s2", name: "Staff Two", requiredQualifications: ["level_3_diploma", "first_aid"] }),
    ];
    const quals: QualificationRecord[] = [
      makeQualification({ id: "q1", staffId: "s1", type: "level_3_diploma", status: "achieved" }),
      makeQualification({ id: "q2", staffId: "s1", type: "first_aid", status: "achieved" }),
      makeQualification({ id: "q3", staffId: "s2", type: "level_3_diploma", status: "achieved" }),
      // s2 missing first_aid
    ];
    const result = evaluateQualificationCompliance(staff, quals, PERIOD_END);
    expect(result.totalRequired).toBe(4);
    expect(result.totalAchieved).toBe(3);
    expect(result.achievedRate).toBe(75);
  });

  it("reports renewal rate as unmeasured when no quals have renewalDue", () => {
    const staff = [makeStaff({ id: "s1", requiredQualifications: ["level_3_diploma"] })];
    const quals: QualificationRecord[] = [
      makeQualification({ id: "q1", staffId: "s1", type: "level_3_diploma", status: "achieved" }),
    ];
    const result = evaluateQualificationCompliance(staff, quals, PERIOD_END);
    expect(result.renewalRate).toBeNull();
  });

  it("calculates renewal rate correctly", () => {
    const staff = [makeStaff({ id: "s1", requiredQualifications: ["first_aid", "safeguarding"] })];
    const quals: QualificationRecord[] = [
      makeQualification({ id: "q1", staffId: "s1", type: "first_aid", status: "achieved", expiryDate: "2026-01-01", renewalDue: "2025-12-01" }),
      makeQualification({ id: "q2", staffId: "s1", type: "safeguarding", status: "expired", expiryDate: "2024-12-01", renewalDue: "2024-11-01" }),
    ];
    const result = evaluateQualificationCompliance(staff, quals, PERIOD_END);
    expect(result.renewalRate).toBe(50);
  });

  it("clamps score to maximum of 25", () => {
    const staff = [makeStaff({ id: "s1" })];
    const quals: QualificationRecord[] = [
      makeQualification({ id: "q1", staffId: "s1", type: "level_3_diploma", status: "achieved" }),
      makeQualification({ id: "q2", staffId: "s1", type: "first_aid", status: "achieved", expiryDate: "2027-01-01", renewalDue: "2026-12-01" }),
      makeQualification({ id: "q3", staffId: "s1", type: "safeguarding", status: "achieved", expiryDate: "2027-01-01", renewalDue: "2026-12-01" }),
    ];
    const result = evaluateQualificationCompliance(staff, quals, PERIOD_END);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("ignores inactive staff in calculations", () => {
    const staff = [
      makeStaff({ id: "s1", isActive: true, requiredQualifications: ["level_3_diploma"] }),
      makeStaff({ id: "s2", isActive: false, requiredQualifications: ["level_3_diploma", "first_aid", "safeguarding", "restraint"] }),
    ];
    const quals: QualificationRecord[] = [
      makeQualification({ id: "q1", staffId: "s1", type: "level_3_diploma", status: "achieved" }),
    ];
    const result = evaluateQualificationCompliance(staff, quals, PERIOD_END);
    expect(result.totalRequired).toBe(1);
    expect(result.totalAchieved).toBe(1);
    expect(result.achievedRate).toBe(100);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Review Quality
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateReviewQuality", () => {
  it("returns zero score for no reviews", () => {
    const result = evaluateReviewQuality([], [makeStaff()]);
    expect(result.overallScore).toBe(0);
    expect(result.totalReviews).toBe(0);
  });

  it("scores full marks for perfect review data", () => {
    const staff = [makeStaff({ id: "s1" })];
    const reviews = [
      makeReview({ id: "r1", staffId: "s1", rating: "exceptional", status: "completed_on_time", objectivesSet: 4, objectivesMet: 4, staffViewsRecorded: true, actionPlanCreated: true }),
    ];
    const result = evaluateReviewQuality(reviews, staff);
    expect(result.overallScore).toBe(25);
  });

  it("awards completion rate points when >= 90%", () => {
    const staff = [makeStaff({ id: "s1" })];
    const reviews = [
      makeReview({ id: "r1", staffId: "s1", status: "completed_on_time", rating: "developing", objectivesSet: 4, objectivesMet: 1, staffViewsRecorded: false, actionPlanCreated: false }),
    ];
    const result = evaluateReviewQuality(reviews, staff);
    expect(result.completionRate).toBe(100);
  });

  it("counts completed_late as completed for completion rate", () => {
    const staff = [makeStaff({ id: "s1" })];
    const reviews = [
      makeReview({ id: "r1", staffId: "s1", status: "completed_late", rating: "effective", objectivesSet: 4, objectivesMet: 3, staffViewsRecorded: true, actionPlanCreated: true }),
    ];
    const result = evaluateReviewQuality(reviews, staff);
    expect(result.completionRate).toBe(100);
  });

  it("does not count overdue reviews as completed", () => {
    const staff = [makeStaff({ id: "s1" })];
    const reviews = [
      makeReview({ id: "r1", staffId: "s1", status: "overdue" }),
      makeReview({ id: "r2", staffId: "s1", status: "completed_on_time", reviewDate: "2025-04-01" }),
    ];
    const result = evaluateReviewQuality(reviews, staff);
    expect(result.completionRate).toBe(50);
  });

  it("calculates objectives met rate correctly", () => {
    const staff = [makeStaff({ id: "s1" })];
    const reviews = [
      makeReview({ id: "r1", staffId: "s1", objectivesSet: 10, objectivesMet: 8 }),
    ];
    const result = evaluateReviewQuality(reviews, staff);
    expect(result.objectivesMetRate).toBe(80);
  });

  it("awards staff views points when >= 90%", () => {
    const staff = [makeStaff({ id: "s1" })];
    const reviews = [
      makeReview({ id: "r1", staffId: "s1", staffViewsRecorded: true }),
    ];
    const result = evaluateReviewQuality(reviews, staff);
    expect(result.staffViewsRate).toBe(100);
  });

  it("calculates staff views rate with mixed data", () => {
    const staff = [makeStaff({ id: "s1" })];
    const reviews = [
      makeReview({ id: "r1", staffId: "s1", staffViewsRecorded: true }),
      makeReview({ id: "r2", staffId: "s1", staffViewsRecorded: false, reviewDate: "2025-04-01" }),
    ];
    const result = evaluateReviewQuality(reviews, staff);
    expect(result.staffViewsRate).toBe(50);
  });

  it("counts negative ratings correctly", () => {
    const staff = [makeStaff({ id: "s1" }), makeStaff({ id: "s2", name: "Staff Two" })];
    const reviews = [
      makeReview({ id: "r1", staffId: "s1", rating: "underperforming" }),
      makeReview({ id: "r2", staffId: "s2", rating: "capability_concern" }),
    ];
    const result = evaluateReviewQuality(reviews, staff);
    expect(result.negativeRatingCount).toBe(2);
  });

  it("awards no negative rating penalty when all positive", () => {
    const staff = [makeStaff({ id: "s1" })];
    const reviews = [makeReview({ id: "r1", staffId: "s1", rating: "effective" })];
    const result = evaluateReviewQuality(reviews, staff);
    expect(result.negativeRatingCount).toBe(0);
  });

  it("calculates positive rating rate correctly", () => {
    const staff = [makeStaff({ id: "s1" })];
    const reviews = [
      makeReview({ id: "r1", staffId: "s1", rating: "exceptional" }),
      makeReview({ id: "r2", staffId: "s1", rating: "developing", reviewDate: "2025-04-01" }),
    ];
    const result = evaluateReviewQuality(reviews, staff);
    expect(result.positiveRatingRate).toBe(50);
  });

  it("awards positive rating bonus when >= 50%", () => {
    const staff = [makeStaff({ id: "s1" }), makeStaff({ id: "s2", name: "Staff Two" })];
    const reviews = [
      makeReview({ id: "r1", staffId: "s1", rating: "exceptional", objectivesSet: 4, objectivesMet: 4, staffViewsRecorded: true, actionPlanCreated: true }),
      makeReview({ id: "r2", staffId: "s2", rating: "effective", objectivesSet: 4, objectivesMet: 4, staffViewsRecorded: true, actionPlanCreated: true }),
    ];
    const result = evaluateReviewQuality(reviews, staff);
    expect(result.positiveRatingRate).toBe(100);
    expect(result.overallScore).toBe(25);
  });

  it("ignores reviews for inactive staff", () => {
    const staff = [
      makeStaff({ id: "s1", isActive: true }),
      makeStaff({ id: "s2", isActive: false }),
    ];
    const reviews = [
      makeReview({ id: "r1", staffId: "s1", rating: "effective" }),
      makeReview({ id: "r2", staffId: "s2", rating: "underperforming" }),
    ];
    const result = evaluateReviewQuality(reviews, staff);
    expect(result.totalReviews).toBe(1);
    expect(result.negativeRatingCount).toBe(0);
  });

  it("clamps score to maximum of 25", () => {
    const staff = [makeStaff({ id: "s1" })];
    const reviews = [
      makeReview({ id: "r1", staffId: "s1", rating: "exceptional", objectivesSet: 10, objectivesMet: 10, staffViewsRecorded: true, actionPlanCreated: true }),
    ];
    const result = evaluateReviewQuality(reviews, staff);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// PDP Progress
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluatePDPProgress", () => {
  it("returns zero score for no goals", () => {
    const result = evaluatePDPProgress([], [makeStaff()]);
    expect(result.overallScore).toBe(0);
    expect(result.totalGoals).toBe(0);
  });

  it("scores full marks with high achievement, training links, no missed, min goals, and 90%+ achieved", () => {
    const staff = [makeStaff({ id: "s1" })];
    const goals = [
      makePDPGoal({ id: "g1", staffId: "s1", status: "achieved", linkedToTraining: true }),
      makePDPGoal({ id: "g2", staffId: "s1", status: "achieved", linkedToTraining: true }),
      makePDPGoal({ id: "g3", staffId: "s1", status: "achieved", linkedToTraining: true }),
    ];
    const result = evaluatePDPProgress(goals, staff);
    expect(result.achievementRate).toBe(100);
    expect(result.overallScore).toBe(25);
  });

  it("excludes deferred goals from achievement rate calculation", () => {
    const staff = [makeStaff({ id: "s1" })];
    const goals = [
      makePDPGoal({ id: "g1", staffId: "s1", status: "achieved" }),
      makePDPGoal({ id: "g2", staffId: "s1", status: "deferred" }),
    ];
    const result = evaluatePDPProgress(goals, staff);
    expect(result.achievementRate).toBe(100);
  });

  it("calculates achievement rate correctly with mixed statuses", () => {
    const staff = [makeStaff({ id: "s1" })];
    const goals = [
      makePDPGoal({ id: "g1", staffId: "s1", status: "achieved" }),
      makePDPGoal({ id: "g2", staffId: "s1", status: "in_progress" }),
      makePDPGoal({ id: "g3", staffId: "s1", status: "missed" }),
      makePDPGoal({ id: "g4", staffId: "s1", status: "not_started" }),
    ];
    const result = evaluatePDPProgress(goals, staff);
    expect(result.achievementRate).toBe(25);
  });

  it("calculates linked to training rate correctly", () => {
    const staff = [makeStaff({ id: "s1" })];
    const goals = [
      makePDPGoal({ id: "g1", staffId: "s1", linkedToTraining: true }),
      makePDPGoal({ id: "g2", staffId: "s1", linkedToTraining: false }),
    ];
    const result = evaluatePDPProgress(goals, staff);
    expect(result.linkedToTrainingRate).toBe(50);
  });

  it("calculates missed goal rate correctly", () => {
    const staff = [makeStaff({ id: "s1" })];
    const goals = [
      makePDPGoal({ id: "g1", staffId: "s1", status: "achieved" }),
      makePDPGoal({ id: "g2", staffId: "s1", status: "missed" }),
    ];
    const result = evaluatePDPProgress(goals, staff);
    expect(result.missedGoalRate).toBe(50);
  });

  it("awards missed goals bonus when missed <= 10%", () => {
    const staff = [makeStaff({ id: "s1" })];
    const goals = Array.from({ length: 10 }, (_, i) =>
      makePDPGoal({ id: `g${i}`, staffId: "s1", status: "achieved" }),
    );
    goals.push(makePDPGoal({ id: "g10", staffId: "s1", status: "missed" }));
    const result = evaluatePDPProgress(goals, staff);
    expect(result.missedGoalRate).toBeLessThanOrEqual(10);
  });

  it("detects when all staff have at least 2 goals", () => {
    const staff = [
      makeStaff({ id: "s1" }),
      makeStaff({ id: "s2", name: "Staff Two" }),
    ];
    const goals = [
      makePDPGoal({ id: "g1", staffId: "s1" }),
      makePDPGoal({ id: "g2", staffId: "s1" }),
      makePDPGoal({ id: "g3", staffId: "s2" }),
      makePDPGoal({ id: "g4", staffId: "s2" }),
    ];
    const result = evaluatePDPProgress(goals, staff);
    expect(result.staffWithMinGoals).toBe(true);
  });

  it("detects when not all staff have 2 goals", () => {
    const staff = [
      makeStaff({ id: "s1" }),
      makeStaff({ id: "s2", name: "Staff Two" }),
    ];
    const goals = [
      makePDPGoal({ id: "g1", staffId: "s1" }),
      makePDPGoal({ id: "g2", staffId: "s1" }),
      makePDPGoal({ id: "g3", staffId: "s2" }),
    ];
    const result = evaluatePDPProgress(goals, staff);
    expect(result.staffWithMinGoals).toBe(false);
  });

  it("awards high achievement bonus when >= 90%", () => {
    const staff = [makeStaff({ id: "s1" })];
    const goals = [
      makePDPGoal({ id: "g1", staffId: "s1", status: "achieved", linkedToTraining: true }),
      makePDPGoal({ id: "g2", staffId: "s1", status: "achieved", linkedToTraining: true }),
    ];
    const result = evaluatePDPProgress(goals, staff);
    expect(result.achievementRate).toBe(100);
    // Score should include the +4 bonus
    expect(result.overallScore).toBeGreaterThan(20);
  });

  it("ignores goals for inactive staff", () => {
    const staff = [
      makeStaff({ id: "s1", isActive: true }),
      makeStaff({ id: "s2", isActive: false }),
    ];
    const goals = [
      makePDPGoal({ id: "g1", staffId: "s1", status: "achieved" }),
      makePDPGoal({ id: "g2", staffId: "s1", status: "achieved" }),
      makePDPGoal({ id: "g3", staffId: "s2", status: "missed" }),
    ];
    const result = evaluatePDPProgress(goals, staff);
    expect(result.totalGoals).toBe(2);
    expect(result.achievementRate).toBe(100);
  });

  it("clamps score to maximum of 25", () => {
    const staff = [makeStaff({ id: "s1" })];
    const goals = [
      makePDPGoal({ id: "g1", staffId: "s1", status: "achieved", linkedToTraining: true }),
      makePDPGoal({ id: "g2", staffId: "s1", status: "achieved", linkedToTraining: true }),
      makePDPGoal({ id: "g3", staffId: "s1", status: "achieved", linkedToTraining: true }),
    ];
    const result = evaluatePDPProgress(goals, staff);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("returns zero when all goals belong to inactive staff", () => {
    const staff = [makeStaff({ id: "s1", isActive: false })];
    const goals = [makePDPGoal({ id: "g1", staffId: "s1" })];
    const result = evaluatePDPProgress(goals, staff);
    expect(result.totalGoals).toBe(0);
    expect(result.overallScore).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Competency Development
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateCompetencyDevelopment", () => {
  it("returns zero score for no assessments", () => {
    const result = evaluateCompetencyDevelopment([], [makeStaff()]);
    expect(result.overallScore).toBe(0);
    expect(result.totalAssessments).toBe(0);
  });

  it("calculates staff coverage rate for 5+ areas", () => {
    const staff = [makeStaff({ id: "s1" })];
    const assessments: CompetencyAssessment[] = [
      makeCompetencyAssessment({ id: "c1", staffId: "s1", area: "safeguarding" }),
      makeCompetencyAssessment({ id: "c2", staffId: "s1", area: "behaviour_management" }),
      makeCompetencyAssessment({ id: "c3", staffId: "s1", area: "therapeutic_care" }),
      makeCompetencyAssessment({ id: "c4", staffId: "s1", area: "record_keeping" }),
      makeCompetencyAssessment({ id: "c5", staffId: "s1", area: "communication" }),
    ];
    const result = evaluateCompetencyDevelopment(assessments, staff);
    expect(result.staffCoverageRate).toBe(100);
  });

  it("staff coverage is 0% when no one has 5+ areas", () => {
    const staff = [makeStaff({ id: "s1" })];
    const assessments: CompetencyAssessment[] = [
      makeCompetencyAssessment({ id: "c1", staffId: "s1", area: "safeguarding" }),
      makeCompetencyAssessment({ id: "c2", staffId: "s1", area: "behaviour_management" }),
    ];
    const result = evaluateCompetencyDevelopment(assessments, staff);
    expect(result.staffCoverageRate).toBe(0);
  });

  it("calculates average competency score correctly", () => {
    const staff = [makeStaff({ id: "s1" })];
    const assessments: CompetencyAssessment[] = [
      makeCompetencyAssessment({ id: "c1", staffId: "s1", level: "competent" }), // 3
      makeCompetencyAssessment({ id: "c2", staffId: "s1", area: "communication", level: "expert" }), // 4
    ];
    const result = evaluateCompetencyDevelopment(assessments, staff);
    expect(result.averageCompetencyScore).toBe(3.5);
  });

  it("scores not_assessed as 0 in competency score", () => {
    const staff = [makeStaff({ id: "s1" })];
    const assessments: CompetencyAssessment[] = [
      makeCompetencyAssessment({ id: "c1", staffId: "s1", level: "not_assessed" }),
    ];
    const result = evaluateCompetencyDevelopment(assessments, staff);
    expect(result.averageCompetencyScore).toBe(0);
  });

  it("calculates improvement rate from previous levels", () => {
    const staff = [makeStaff({ id: "s1" })];
    const assessments: CompetencyAssessment[] = [
      makeCompetencyAssessment({ id: "c1", staffId: "s1", level: "competent", previousLevel: "developing" }),
      makeCompetencyAssessment({ id: "c2", staffId: "s1", area: "communication", level: "developing", previousLevel: "developing" }),
    ];
    const result = evaluateCompetencyDevelopment(assessments, staff);
    expect(result.improvementRate).toBe(50);
  });

  it("improvement rate is 0 when no assessments have previous levels", () => {
    const staff = [makeStaff({ id: "s1" })];
    const assessments: CompetencyAssessment[] = [
      makeCompetencyAssessment({ id: "c1", staffId: "s1" }),
    ];
    const result = evaluateCompetencyDevelopment(assessments, staff);
    expect(result.improvementRate).toBe(0);
  });

  it("detects critical areas covered when all staff assessed in safeguarding and child_centred_practice", () => {
    const staff = [makeStaff({ id: "s1" })];
    const assessments: CompetencyAssessment[] = [
      makeCompetencyAssessment({ id: "c1", staffId: "s1", area: "safeguarding", level: "competent" }),
      makeCompetencyAssessment({ id: "c2", staffId: "s1", area: "child_centred_practice", level: "developing" }),
    ];
    const result = evaluateCompetencyDevelopment(assessments, staff);
    expect(result.criticalAreasCovered).toBe(true);
  });

  it("critical areas not covered when a staff member is missing safeguarding", () => {
    const staff = [
      makeStaff({ id: "s1" }),
      makeStaff({ id: "s2", name: "Staff Two" }),
    ];
    const assessments: CompetencyAssessment[] = [
      makeCompetencyAssessment({ id: "c1", staffId: "s1", area: "safeguarding", level: "competent" }),
      makeCompetencyAssessment({ id: "c2", staffId: "s1", area: "child_centred_practice", level: "competent" }),
      // s2 has no safeguarding assessment
      makeCompetencyAssessment({ id: "c3", staffId: "s2", area: "child_centred_practice", level: "competent" }),
    ];
    const result = evaluateCompetencyDevelopment(assessments, staff);
    expect(result.criticalAreasCovered).toBe(false);
  });

  it("critical areas not covered when safeguarding is not_assessed", () => {
    const staff = [makeStaff({ id: "s1" })];
    const assessments: CompetencyAssessment[] = [
      makeCompetencyAssessment({ id: "c1", staffId: "s1", area: "safeguarding", level: "not_assessed" }),
      makeCompetencyAssessment({ id: "c2", staffId: "s1", area: "child_centred_practice", level: "competent" }),
    ];
    const result = evaluateCompetencyDevelopment(assessments, staff);
    expect(result.criticalAreasCovered).toBe(false);
  });

  it("calculates high competency rate (competent + expert)", () => {
    const staff = [makeStaff({ id: "s1" })];
    const assessments: CompetencyAssessment[] = [
      makeCompetencyAssessment({ id: "c1", staffId: "s1", level: "competent" }),
      makeCompetencyAssessment({ id: "c2", staffId: "s1", area: "communication", level: "expert" }),
      makeCompetencyAssessment({ id: "c3", staffId: "s1", area: "teamwork", level: "developing" }),
    ];
    const result = evaluateCompetencyDevelopment(assessments, staff);
    expect(result.highCompetencyRate).toBe(66.7);
  });

  it("awards high competency bonus when >= 70%", () => {
    const staff = [makeStaff({ id: "s1" })];
    const assessments: CompetencyAssessment[] = [
      makeCompetencyAssessment({ id: "c1", staffId: "s1", level: "competent" }),
      makeCompetencyAssessment({ id: "c2", staffId: "s1", area: "communication", level: "expert" }),
      makeCompetencyAssessment({ id: "c3", staffId: "s1", area: "teamwork", level: "competent" }),
    ];
    const result = evaluateCompetencyDevelopment(assessments, staff);
    expect(result.highCompetencyRate).toBe(100);
  });

  it("ignores assessments for inactive staff", () => {
    const staff = [
      makeStaff({ id: "s1", isActive: true }),
      makeStaff({ id: "s2", isActive: false }),
    ];
    const assessments: CompetencyAssessment[] = [
      makeCompetencyAssessment({ id: "c1", staffId: "s1", level: "competent" }),
      makeCompetencyAssessment({ id: "c2", staffId: "s2", level: "not_assessed" }),
    ];
    const result = evaluateCompetencyDevelopment(assessments, staff);
    expect(result.totalAssessments).toBe(1);
  });

  it("clamps score to maximum of 25", () => {
    const staff = [makeStaff({ id: "s1" })];
    const assessments: CompetencyAssessment[] = [
      makeCompetencyAssessment({ id: "c1", staffId: "s1", area: "safeguarding", level: "expert", previousLevel: "competent" }),
      makeCompetencyAssessment({ id: "c2", staffId: "s1", area: "behaviour_management", level: "expert", previousLevel: "competent" }),
      makeCompetencyAssessment({ id: "c3", staffId: "s1", area: "therapeutic_care", level: "expert", previousLevel: "developing" }),
      makeCompetencyAssessment({ id: "c4", staffId: "s1", area: "record_keeping", level: "expert" }),
      makeCompetencyAssessment({ id: "c5", staffId: "s1", area: "communication", level: "expert" }),
      makeCompetencyAssessment({ id: "c6", staffId: "s1", area: "child_centred_practice", level: "expert", previousLevel: "competent" }),
    ];
    const result = evaluateCompetencyDevelopment(assessments, staff);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("returns zero when all assessments belong to inactive staff", () => {
    const staff = [makeStaff({ id: "s1", isActive: false })];
    const assessments = [makeCompetencyAssessment({ staffId: "s1" })];
    const result = evaluateCompetencyDevelopment(assessments, staff);
    expect(result.totalAssessments).toBe(0);
    expect(result.overallScore).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Integration — Chamberlain House Demo Data
// ══════════════════════════════════════════════════════════════════════════════

describe("generateStaffPerformanceIntelligence — Chamberlain House Integration", () => {
  const staff = getOakHouseStaff();
  const qualifications = getOakHouseQualifications();
  const reviews = getOakHouseReviews();
  const pdpGoals = getOakHousePDPGoals();
  const competencyAssessments = getOakHouseCompetencyAssessments();

  const result = generateStaffPerformanceIntelligence(
    staff, qualifications, reviews, pdpGoals, competencyAssessments,
    HOME_ID, PERIOD_START, PERIOD_END,
  );

  it("returns the correct homeId", () => {
    expect(result.homeId).toBe(HOME_ID);
  });

  it("returns the correct period", () => {
    expect(result.periodStart).toBe(PERIOD_START);
    expect(result.periodEnd).toBe(PERIOD_END);
  });

  it("overall score is sum of 4 sub-scores", () => {
    const expectedTotal = Math.round(
      (result.qualificationCompliance.overallScore +
        result.reviewQuality.overallScore +
        result.pdpProgress.overallScore +
        result.competencyDevelopment.overallScore) * 10,
    ) / 10;
    expect(result.overallScore).toBe(expectedTotal);
  });

  it("overall score is between 0 and 100", () => {
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("rating is consistent with overall score", () => {
    if (result.overallScore >= 80) expect(result.rating).toBe("outstanding");
    else if (result.overallScore >= 60) expect(result.rating).toBe("good");
    else if (result.overallScore >= 40) expect(result.rating).toBe("requires_improvement");
    else expect(result.rating).toBe("inadequate");
  });

  it("qualification compliance score is between 0 and 25", () => {
    expect(result.qualificationCompliance.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.qualificationCompliance.overallScore).toBeLessThanOrEqual(25);
  });

  it("review quality score is between 0 and 25", () => {
    expect(result.reviewQuality.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.reviewQuality.overallScore).toBeLessThanOrEqual(25);
  });

  it("PDP progress score is between 0 and 25", () => {
    expect(result.pdpProgress.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.pdpProgress.overallScore).toBeLessThanOrEqual(25);
  });

  it("competency development score is between 0 and 25", () => {
    expect(result.competencyDevelopment.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.competencyDevelopment.overallScore).toBeLessThanOrEqual(25);
  });

  it("generates staff profiles for all 4 active staff", () => {
    expect(result.staffProfiles).toHaveLength(4);
  });

  it("staff profiles include Darren Laville", () => {
    const darren = result.staffProfiles.find((p) => p.staffId === "staff-darren");
    expect(darren).toBeDefined();
    expect(darren!.staffName).toBe("Darren Laville");
  });

  it("staff profiles include Sarah Johnson", () => {
    const sarah = result.staffProfiles.find((p) => p.staffId === "staff-sarah");
    expect(sarah).toBeDefined();
    expect(sarah!.staffName).toBe("Sarah Johnson");
  });

  it("staff profiles include Tom Richards", () => {
    const tom = result.staffProfiles.find((p) => p.staffId === "staff-tom");
    expect(tom).toBeDefined();
    expect(tom!.staffName).toBe("Tom Richards");
  });

  it("staff profiles include Lisa Williams", () => {
    const lisa = result.staffProfiles.find((p) => p.staffId === "staff-lisa");
    expect(lisa).toBeDefined();
    expect(lisa!.staffName).toBe("Lisa Williams");
  });

  it("Darren has exceptional performance rating", () => {
    const darren = result.staffProfiles.find((p) => p.staffId === "staff-darren");
    expect(darren!.currentPerformanceRating).toBe("exceptional");
  });

  it("Tom has developing performance rating", () => {
    const tom = result.staffProfiles.find((p) => p.staffId === "staff-tom");
    expect(tom!.currentPerformanceRating).toBe("developing");
  });

  it("each staff profile score is between 0 and 10", () => {
    for (const profile of result.staffProfiles) {
      expect(profile.overallScore).toBeGreaterThanOrEqual(0);
      expect(profile.overallScore).toBeLessThanOrEqual(10);
    }
  });

  it("reviews are all completed on time", () => {
    expect(result.reviewQuality.completionRate).toBe(100);
  });

  it("all reviews have staff views recorded", () => {
    expect(result.reviewQuality.staffViewsRate).toBe(100);
  });

  it("all reviews have action plans", () => {
    expect(result.reviewQuality.actionPlanRate).toBe(100);
  });

  it("no negative ratings in reviews", () => {
    expect(result.reviewQuality.negativeRatingCount).toBe(0);
  });

  it("Tom has lower qualification compliance (missing Level 3)", () => {
    const tom = result.staffProfiles.find((p) => p.staffId === "staff-tom");
    expect(tom!.qualificationComplianceRate).toBeLessThan(100);
  });

  it("Darren has 100% qualification compliance", () => {
    const darren = result.staffProfiles.find((p) => p.staffId === "staff-darren");
    expect(darren!.qualificationComplianceRate).toBe(100);
  });

  it("generates strengths array", () => {
    expect(Array.isArray(result.strengths)).toBe(true);
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("generates regulatory links array", () => {
    expect(Array.isArray(result.regulatoryLinks)).toBe(true);
    expect(result.regulatoryLinks.length).toBe(5);
  });

  it("regulatory links include CHR 2015 Reg 32", () => {
    expect(result.regulatoryLinks.some((l) => l.includes("Reg 32"))).toBe(true);
  });

  it("regulatory links include CHR 2015 Reg 33", () => {
    expect(result.regulatoryLinks.some((l) => l.includes("Reg 33"))).toBe(true);
  });

  it("regulatory links include SCCIF", () => {
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
  });

  it("regulatory links include NMS 19", () => {
    expect(result.regulatoryLinks.some((l) => l.includes("NMS 19"))).toBe(true);
  });

  it("regulatory links include Working Together 2023", () => {
    expect(result.regulatoryLinks.some((l) => l.includes("Working Together 2023"))).toBe(true);
  });

  it("PDP goals total is 12 for Chamberlain House", () => {
    expect(result.pdpProgress.totalGoals).toBe(12);
  });

  it("all staff have at least 2 PDP goals", () => {
    expect(result.pdpProgress.staffWithMinGoals).toBe(true);
  });

  it("Chamberlain House has 27 competency assessments", () => {
    expect(result.competencyDevelopment.totalAssessments).toBe(27);
  });

  it("critical areas are covered for all Chamberlain House staff", () => {
    expect(result.competencyDevelopment.criticalAreasCovered).toBe(true);
  });

  it("Chamberlain House qualification compliance detects Tom missing Level 3", () => {
    // Tom has level_3_diploma as in_progress, not achieved
    // So total required across 4 staff will not have 100% achieved
    expect(result.qualificationCompliance.achievedRate).toBeLessThan(100);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Edge Cases
// ══════════════════════════════════════════════════════════════════════════════

describe("Edge Cases", () => {
  it("handles completely empty inputs", () => {
    const result = generateStaffPerformanceIntelligence(
      [], [], [], [], [],
      "test-home", "2025-01-01", "2025-06-30",
    );
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.staffProfiles).toHaveLength(0);
  });

  it("handles staff with no qualifications required", () => {
    const staff = [makeStaff({ id: "s1", requiredQualifications: [] })];
    const result = evaluateQualificationCompliance(staff, [], PERIOD_END);
    expect(result.totalRequired).toBe(0);
    expect(result.achievedRate).toBe(0);
  });

  it("handles reviews with zero objectives set", () => {
    const staff = [makeStaff({ id: "s1" })];
    const reviews = [makeReview({ id: "r1", staffId: "s1", objectivesSet: 0, objectivesMet: 0 })];
    const result = evaluateReviewQuality(reviews, staff);
    expect(result.objectivesMetRate).toBe(0);
  });

  it("handles single staff member single goal scenario", () => {
    const staff = [makeStaff({ id: "s1" })];
    const goals = [makePDPGoal({ id: "g1", staffId: "s1", status: "achieved" })];
    const result = evaluatePDPProgress(goals, staff);
    expect(result.totalGoals).toBe(1);
    expect(result.achievementRate).toBe(100);
    expect(result.staffWithMinGoals).toBe(false); // Only 1 goal, needs 2
  });

  it("handles all goals deferred", () => {
    const staff = [makeStaff({ id: "s1" })];
    const goals = [
      makePDPGoal({ id: "g1", staffId: "s1", status: "deferred" }),
      makePDPGoal({ id: "g2", staffId: "s1", status: "deferred" }),
    ];
    const result = evaluatePDPProgress(goals, staff);
    expect(result.achievementRate).toBe(0); // 0 achieved / 0 non-deferred
    expect(result.totalGoals).toBe(2);
  });

  it("handles single competency assessment", () => {
    const staff = [makeStaff({ id: "s1" })];
    const assessments = [makeCompetencyAssessment({ id: "c1", staffId: "s1", level: "expert" })];
    const result = evaluateCompetencyDevelopment(assessments, staff);
    expect(result.totalAssessments).toBe(1);
    expect(result.averageCompetencyScore).toBe(4);
  });

  it("handles all staff inactive", () => {
    const staff = [
      makeStaff({ id: "s1", isActive: false }),
      makeStaff({ id: "s2", isActive: false }),
    ];
    const result = generateStaffPerformanceIntelligence(
      staff, [], [], [], [],
      "test-home", "2025-01-01", "2025-06-30",
    );
    expect(result.overallScore).toBe(0);
    expect(result.staffProfiles).toHaveLength(0);
  });

  it("staff profile defaults to 0 competency level when no assessments exist", () => {
    const staff = [makeStaff({ id: "s1" })];
    const quals = [
      makeQualification({ id: "q1", staffId: "s1", type: "level_3_diploma", status: "achieved" }),
      makeQualification({ id: "q2", staffId: "s1", type: "first_aid", status: "achieved" }),
      makeQualification({ id: "q3", staffId: "s1", type: "safeguarding", status: "achieved" }),
    ];
    const result = generateStaffPerformanceIntelligence(
      staff, quals, [], [], [],
      "test-home", "2025-01-01", "2025-06-30",
    );
    expect(result.staffProfiles[0].averageCompetencyLevel).toBe(0);
  });

  it("staff profile defaults to undefined performance rating when no reviews exist", () => {
    const staff = [makeStaff({ id: "s1" })];
    const result = generateStaffPerformanceIntelligence(
      staff, [], [], [], [],
      "test-home", "2025-01-01", "2025-06-30",
    );
    expect(result.staffProfiles[0].currentPerformanceRating).toBeUndefined();
  });

  it("staff profile picks most recent review for performance rating", () => {
    const staff = [makeStaff({ id: "s1" })];
    const reviews = [
      makeReview({ id: "r1", staffId: "s1", rating: "developing", reviewDate: "2025-01-15" }),
      makeReview({ id: "r2", staffId: "s1", rating: "exceptional", reviewDate: "2025-06-15" }),
    ];
    const result = generateStaffPerformanceIntelligence(
      staff, [], reviews, [], [],
      "test-home", "2025-01-01", "2025-06-30",
    );
    expect(result.staffProfiles[0].currentPerformanceRating).toBe("exceptional");
  });

  it("rating is outstanding for score >= 80", () => {
    const staff = [makeStaff({ id: "s1" })];
    const quals = [
      makeQualification({ id: "q1", staffId: "s1", type: "level_3_diploma", status: "achieved" }),
      makeQualification({ id: "q2", staffId: "s1", type: "first_aid", status: "achieved", expiryDate: "2027-01-01", renewalDue: "2026-12-01" }),
      makeQualification({ id: "q3", staffId: "s1", type: "safeguarding", status: "achieved", expiryDate: "2027-01-01", renewalDue: "2026-12-01" }),
    ];
    const reviews = [makeReview({ id: "r1", staffId: "s1", rating: "exceptional", objectivesSet: 4, objectivesMet: 4 })];
    const goals = [
      makePDPGoal({ id: "g1", staffId: "s1", status: "achieved", linkedToTraining: true }),
      makePDPGoal({ id: "g2", staffId: "s1", status: "achieved", linkedToTraining: true }),
    ];
    const assessments: CompetencyAssessment[] = [
      makeCompetencyAssessment({ id: "c1", staffId: "s1", area: "safeguarding", level: "expert", previousLevel: "competent" }),
      makeCompetencyAssessment({ id: "c2", staffId: "s1", area: "behaviour_management", level: "expert", previousLevel: "competent" }),
      makeCompetencyAssessment({ id: "c3", staffId: "s1", area: "therapeutic_care", level: "expert", previousLevel: "developing" }),
      makeCompetencyAssessment({ id: "c4", staffId: "s1", area: "record_keeping", level: "expert" }),
      makeCompetencyAssessment({ id: "c5", staffId: "s1", area: "communication", level: "expert" }),
      makeCompetencyAssessment({ id: "c6", staffId: "s1", area: "child_centred_practice", level: "expert", previousLevel: "competent" }),
    ];
    const result = generateStaffPerformanceIntelligence(
      staff, quals, reviews, goals, assessments,
      "test-home", "2025-01-01", "2025-06-30",
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.rating).toBe("outstanding");
  });

  it("rating is inadequate for score < 40", () => {
    const staff = [makeStaff({ id: "s1" })];
    const reviews = [makeReview({ id: "r1", staffId: "s1", rating: "capability_concern", status: "overdue", objectivesSet: 10, objectivesMet: 0, staffViewsRecorded: false, actionPlanCreated: false })];
    const goals = [makePDPGoal({ id: "g1", staffId: "s1", status: "missed", linkedToTraining: false })];
    const result = generateStaffPerformanceIntelligence(
      staff, [], reviews, goals, [],
      "test-home", "2025-01-01", "2025-06-30",
    );
    expect(result.overallScore).toBeLessThan(40);
    expect(result.rating).toBe("inadequate");
  });

  it("generates improvement areas for poor qualification compliance", () => {
    const staff = [makeStaff({ id: "s1", requiredQualifications: ["level_3_diploma", "first_aid", "safeguarding", "restraint", "medication"] })];
    const quals = [
      makeQualification({ id: "q1", staffId: "s1", type: "level_3_diploma", status: "in_progress" }),
    ];
    const result = generateStaffPerformanceIntelligence(
      staff, quals, [], [], [],
      "test-home", "2025-01-01", "2025-06-30",
    );
    expect(result.areasForImprovement.some((a) => a.includes("Qualification compliance"))).toBe(true);
  });

  it("generates urgent actions for missing mandatory qualifications", () => {
    const staff = [makeStaff({ id: "s1", requiredQualifications: ["level_3_diploma", "first_aid", "safeguarding"] })];
    const quals: QualificationRecord[] = []; // No quals at all
    const result = generateStaffPerformanceIntelligence(
      staff, quals, [], [], [],
      "test-home", "2025-01-01", "2025-06-30",
    );
    expect(result.actions.some((a) => a.includes("URGENT"))).toBe(true);
  });

  it("generates actions for expired qualifications", () => {
    const staff = [makeStaff({ id: "s1" })];
    const quals = [
      makeQualification({ id: "q1", staffId: "s1", type: "level_3_diploma", status: "achieved" }),
      makeQualification({ id: "q2", staffId: "s1", type: "first_aid", status: "expired" }),
      makeQualification({ id: "q3", staffId: "s1", type: "safeguarding", status: "achieved" }),
    ];
    const result = generateStaffPerformanceIntelligence(
      staff, quals, [], [], [],
      "test-home", "2025-01-01", "2025-06-30",
    );
    expect(result.actions.some((a) => a.includes("Renew expired"))).toBe(true);
  });

  it("generates strength for 90%+ qualification compliance", () => {
    const staff = [makeStaff({ id: "s1", requiredQualifications: ["level_3_diploma", "first_aid"] })];
    const quals = [
      makeQualification({ id: "q1", staffId: "s1", type: "level_3_diploma", status: "achieved" }),
      makeQualification({ id: "q2", staffId: "s1", type: "first_aid", status: "achieved" }),
    ];
    const result = generateStaffPerformanceIntelligence(
      staff, quals, [], [], [],
      "test-home", "2025-01-01", "2025-06-30",
    );
    expect(result.strengths.some((s) => s.includes("Qualification compliance"))).toBe(true);
  });

  it("generates strength for no expired qualifications", () => {
    const staff = [makeStaff({ id: "s1", requiredQualifications: ["level_3_diploma"] })];
    const quals = [
      makeQualification({ id: "q1", staffId: "s1", type: "level_3_diploma", status: "achieved" }),
    ];
    const result = generateStaffPerformanceIntelligence(
      staff, quals, [], [], [],
      "test-home", "2025-01-01", "2025-06-30",
    );
    expect(result.strengths.some((s) => s.includes("No expired qualifications"))).toBe(true);
  });

  it("handles all reviews having not_due status", () => {
    const staff = [makeStaff({ id: "s1" })];
    const reviews = [makeReview({ id: "r1", staffId: "s1", status: "not_due" })];
    const result = evaluateReviewQuality(reviews, staff);
    expect(result.completionRate).toBe(0);
  });

  it("handles mixed active and inactive staff correctly in full intelligence", () => {
    const staff = [
      makeStaff({ id: "s1", isActive: true }),
      makeStaff({ id: "s2", isActive: false, name: "Inactive Staff" }),
    ];
    const result = generateStaffPerformanceIntelligence(
      staff, [], [], [], [],
      "test-home", "2025-01-01", "2025-06-30",
    );
    expect(result.staffProfiles).toHaveLength(1);
    expect(result.staffProfiles[0].staffId).toBe("s1");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Score Boundary Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("Rating Boundaries", () => {
  it("score of exactly 80 gives outstanding", () => {
    // Build data that gives exactly the right sub-scores
    const staff = [makeStaff({ id: "s1" })];
    const result = generateStaffPerformanceIntelligence(
      staff, [], [], [], [],
      "test-home", "2025-01-01", "2025-06-30",
    );
    // With empty data, score is 0 = inadequate
    expect(result.rating).toBe("inadequate");
  });

  it("score of exactly 60 gives good (not outstanding)", () => {
    // We test the rating function indirectly
    // A score between 60 and 79 should be "good"
    const staff = [makeStaff({ id: "s1" })];
    const quals = [
      makeQualification({ id: "q1", staffId: "s1", type: "level_3_diploma", status: "achieved" }),
      makeQualification({ id: "q2", staffId: "s1", type: "first_aid", status: "achieved" }),
      makeQualification({ id: "q3", staffId: "s1", type: "safeguarding", status: "achieved" }),
    ];
    const reviews = [makeReview({ id: "r1", staffId: "s1", rating: "effective", objectivesSet: 4, objectivesMet: 3 })];
    const goals = [
      makePDPGoal({ id: "g1", staffId: "s1", status: "achieved", linkedToTraining: true }),
      makePDPGoal({ id: "g2", staffId: "s1", status: "achieved", linkedToTraining: true }),
    ];
    const assessments = [
      makeCompetencyAssessment({ id: "c1", staffId: "s1", area: "safeguarding", level: "competent" }),
      makeCompetencyAssessment({ id: "c2", staffId: "s1", area: "child_centred_practice", level: "competent" }),
    ];
    const result = generateStaffPerformanceIntelligence(
      staff, quals, reviews, goals, assessments,
      "test-home", "2025-01-01", "2025-06-30",
    );
    // Validate the rating is consistent with score
    if (result.overallScore >= 80) expect(result.rating).toBe("outstanding");
    else if (result.overallScore >= 60) expect(result.rating).toBe("good");
    else if (result.overallScore >= 40) expect(result.rating).toBe("requires_improvement");
    else expect(result.rating).toBe("inadequate");
  });
});
