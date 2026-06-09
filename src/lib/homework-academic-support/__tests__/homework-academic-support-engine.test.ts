// ==============================================================================
// TESTS -- Homework & Academic Support Intelligence Engine
//
// Demo: Chamberlain House, 3 children (Alex 14, Jordan 13, Morgan 15),
// Staff: Sarah Johnson (Senior RSW), Tom Richards (RSW),
//        Lisa Williams (Senior RSW), Darren Laville (RM/DSL)
// ==============================================================================

import { describe, it, expect } from "vitest";
import {
  evaluateHomeworkCompletion,
  evaluateAcademicInterventions,
  evaluateResourceProvision,
  evaluateStaffEducationReadiness,
  buildChildAcademicProfiles,
  generateHomeworkAcademicSupportIntelligence,
  getRating,
  getSubjectLabel,
  getCompletionLabel,
  getSupportLabel,
  getProgressLabel,
  getRatingLabel,
  getResourceLabel,
  getInterventionTypeLabel,
} from "../homework-academic-support-engine";
import type {
  HomeworkRecord,
  AcademicIntervention,
  EducationalResource,
  StaffEducationTraining,
} from "../homework-academic-support-engine";

// -- Test Fixtures: Chamberlain House Demo Data ---------------------------------------

const makeRecord = (overrides: Partial<HomeworkRecord> = {}): HomeworkRecord => ({
  id: "hw-001",
  childId: "child-alex",
  childName: "Alex",
  date: "2026-05-05",
  subject: "english",
  completionStatus: "completed",
  supportProvided: ["staff_help"],
  timeSpentMinutes: 45,
  staffSupporter: "Sarah Johnson",
  difficultyEncountered: false,
  schoolFeedbackPositive: true,
  ...overrides,
});

const makeIntervention = (overrides: Partial<AcademicIntervention> = {}): AcademicIntervention => ({
  id: "int-001",
  childId: "child-jordan",
  childName: "Jordan",
  interventionType: "tutoring",
  startDate: "2026-04-15",
  provider: "Bright Futures Tutoring",
  sessionsPlanned: 8,
  sessionsAttended: 7,
  progressMade: "at_expected",
  pepLinked: true,
  ...overrides,
});

const makeResource = (overrides: Partial<EducationalResource> = {}): EducationalResource => ({
  id: "res-001",
  resourceType: "quiet_study_area",
  available: true,
  lastChecked: "2026-05-01",
  adequateForNeeds: true,
  ...overrides,
});

const makeTraining = (overrides: Partial<StaffEducationTraining> = {}): StaffEducationTraining => ({
  id: "set-001",
  staffId: "staff-sarah",
  staffName: "Sarah Johnson",
  homeworkSupportTrained: true,
  pepAwareness: true,
  senAwareness: true,
  educationAdvocacy: true,
  examSupportTrained: true,
  attachmentAwareEducation: true,
  ...overrides,
});

// Chamberlain House demo data
const OAK_HOUSE_RECORDS: HomeworkRecord[] = [
  makeRecord({ id: "hw-001", childId: "child-alex", childName: "Alex", date: "2026-05-05", subject: "english", completionStatus: "completed", supportProvided: ["staff_help", "quiet_space"], timeSpentMinutes: 45, schoolFeedbackPositive: true }),
  makeRecord({ id: "hw-002", childId: "child-alex", childName: "Alex", date: "2026-05-07", subject: "maths", completionStatus: "completed", supportProvided: ["staff_help"], timeSpentMinutes: 60, difficultyEncountered: true, schoolFeedbackPositive: true }),
  makeRecord({ id: "hw-003", childId: "child-alex", childName: "Alex", date: "2026-05-12", subject: "science", completionStatus: "completed", supportProvided: ["online_resource"], timeSpentMinutes: 40, schoolFeedbackPositive: true }),
  makeRecord({ id: "hw-004", childId: "child-jordan", childName: "Jordan", date: "2026-05-05", subject: "maths", completionStatus: "partially_completed", supportProvided: ["staff_help", "additional_time"], timeSpentMinutes: 50, difficultyEncountered: true, schoolFeedbackPositive: false }),
  makeRecord({ id: "hw-005", childId: "child-jordan", childName: "Jordan", date: "2026-05-08", subject: "english", completionStatus: "completed", supportProvided: ["staff_help"], timeSpentMinutes: 35, schoolFeedbackPositive: true }),
  makeRecord({ id: "hw-006", childId: "child-jordan", childName: "Jordan", date: "2026-05-10", subject: "humanities", completionStatus: "completed", supportProvided: ["peer_support"], timeSpentMinutes: 30, schoolFeedbackPositive: true }),
  makeRecord({ id: "hw-007", childId: "child-morgan", childName: "Morgan", date: "2026-05-06", subject: "science", completionStatus: "completed", supportProvided: ["tutor"], timeSpentMinutes: 55, schoolFeedbackPositive: true }),
  makeRecord({ id: "hw-008", childId: "child-morgan", childName: "Morgan", date: "2026-05-09", subject: "languages", completionStatus: "not_completed", supportProvided: ["none"], timeSpentMinutes: 10, difficultyEncountered: true, schoolFeedbackPositive: false }),
  makeRecord({ id: "hw-009", childId: "child-morgan", childName: "Morgan", date: "2026-05-13", subject: "technology", completionStatus: "completed", supportProvided: ["staff_help", "online_resource"], timeSpentMinutes: 40, schoolFeedbackPositive: true }),
  makeRecord({ id: "hw-010", childId: "child-alex", childName: "Alex", date: "2026-05-14", subject: "creative_arts", completionStatus: "completed", supportProvided: ["quiet_space"], timeSpentMinutes: 30, schoolFeedbackPositive: true }),
];

const OAK_HOUSE_INTERVENTIONS: AcademicIntervention[] = [
  makeIntervention({ id: "int-001", childId: "child-jordan", childName: "Jordan", interventionType: "tutoring", startDate: "2026-04-15", sessionsPlanned: 8, sessionsAttended: 7, progressMade: "at_expected", pepLinked: true }),
  makeIntervention({ id: "int-002", childId: "child-morgan", childName: "Morgan", interventionType: "reading_programme", startDate: "2026-04-20", provider: "In-house reading support", sessionsPlanned: 10, sessionsAttended: 8, progressMade: "above_expected", pepLinked: true }),
];

const OAK_HOUSE_RESOURCES: EducationalResource[] = [
  makeResource({ id: "res-001", resourceType: "quiet_study_area", available: true, adequateForNeeds: true }),
  makeResource({ id: "res-002", resourceType: "computer_access", available: true, adequateForNeeds: true }),
  makeResource({ id: "res-003", resourceType: "books_library", available: true, adequateForNeeds: true }),
  makeResource({ id: "res-004", resourceType: "stationery", available: true, adequateForNeeds: true }),
  makeResource({ id: "res-005", resourceType: "internet_access", available: true, adequateForNeeds: true }),
  makeResource({ id: "res-006", resourceType: "specialist_software", available: false, adequateForNeeds: false }),
  makeResource({ id: "res-007", resourceType: "tutor_access", available: true, adequateForNeeds: true }),
];

const OAK_HOUSE_TRAINING: StaffEducationTraining[] = [
  makeTraining({ id: "set-001", staffId: "staff-sarah", staffName: "Sarah Johnson" }),
  makeTraining({ id: "set-002", staffId: "staff-tom", staffName: "Tom Richards" }),
  makeTraining({ id: "set-003", staffId: "staff-lisa", staffName: "Lisa Williams", examSupportTrained: false }),
  makeTraining({ id: "set-004", staffId: "staff-darren", staffName: "Darren Laville" }),
];

// ==============================================================================
// 1. evaluateHomeworkCompletion
// ==============================================================================

describe("evaluateHomeworkCompletion", () => {
  it("returns score 0 for empty records", () => {
    const result = evaluateHomeworkCompletion([]);
    expect(result.score).toBe(0);
    expect(result.totalRecords).toBe(0);
  });

  it("returns concern message for empty records", () => {
    const result = evaluateHomeworkCompletion([]);
    expect(result.concerns.some((c) => c.includes("No homework records available"))).toBe(true);
    expect(result.strengths).toHaveLength(0);
  });

  it("calculates completion rate correctly", () => {
    const records = [
      makeRecord({ id: "1", completionStatus: "completed" }),
      makeRecord({ id: "2", completionStatus: "not_completed" }),
      makeRecord({ id: "3", completionStatus: "completed" }),
    ];
    const result = evaluateHomeworkCompletion(records);
    expect(result.completionRate).toBe(67);
    expect(result.completedCount).toBe(2);
  });

  it("calculates 100% completion rate when all completed", () => {
    const records = [
      makeRecord({ id: "1", completionStatus: "completed" }),
      makeRecord({ id: "2", completionStatus: "completed" }),
    ];
    const result = evaluateHomeworkCompletion(records);
    expect(result.completionRate).toBe(100);
  });

  it("calculates support provided rate correctly", () => {
    const records = [
      makeRecord({ id: "1", supportProvided: ["staff_help"] }),
      makeRecord({ id: "2", supportProvided: ["none"] }),
      makeRecord({ id: "3", supportProvided: ["tutor", "quiet_space"] }),
    ];
    const result = evaluateHomeworkCompletion(records);
    expect(result.supportProvidedRate).toBe(67);
    expect(result.supportProvidedCount).toBe(2);
  });

  it("treats empty supportProvided array as no support", () => {
    const records = [
      makeRecord({ id: "1", supportProvided: [] }),
    ];
    const result = evaluateHomeworkCompletion(records);
    expect(result.supportProvidedRate).toBe(0);
  });

  it("calculates school feedback rate correctly", () => {
    const records = [
      makeRecord({ id: "1", schoolFeedbackPositive: true }),
      makeRecord({ id: "2", schoolFeedbackPositive: false }),
      makeRecord({ id: "3", schoolFeedbackPositive: true }),
    ];
    const result = evaluateHomeworkCompletion(records);
    expect(result.schoolFeedbackRate).toBe(67);
    expect(result.schoolFeedbackPositiveCount).toBe(2);
  });

  it("excludes undefined feedback from rate calculation", () => {
    const records = [
      makeRecord({ id: "1", schoolFeedbackPositive: true }),
      makeRecord({ id: "2", schoolFeedbackPositive: undefined }),
    ];
    const result = evaluateHomeworkCompletion(records);
    expect(result.schoolFeedbackRate).toBe(100);
    expect(result.schoolFeedbackPositiveCount).toBe(1);
  });

  it("calculates subject coverage correctly", () => {
    const records = [
      makeRecord({ id: "1", subject: "english" }),
      makeRecord({ id: "2", subject: "maths" }),
      makeRecord({ id: "3", subject: "english" }),
    ];
    const result = evaluateHomeworkCompletion(records);
    expect(result.subjectsCovered).toBe(2);
  });

  it("builds subject breakdown correctly", () => {
    const records = [
      makeRecord({ id: "1", subject: "english" }),
      makeRecord({ id: "2", subject: "english" }),
      makeRecord({ id: "3", subject: "maths" }),
    ];
    const result = evaluateHomeworkCompletion(records);
    expect(result.subjectBreakdown.english).toBe(2);
    expect(result.subjectBreakdown.maths).toBe(1);
    expect(result.subjectBreakdown.science).toBe(0);
  });

  it("builds completion breakdown correctly", () => {
    const records = [
      makeRecord({ id: "1", completionStatus: "completed" }),
      makeRecord({ id: "2", completionStatus: "partially_completed" }),
      makeRecord({ id: "3", completionStatus: "not_completed" }),
    ];
    const result = evaluateHomeworkCompletion(records);
    expect(result.completionBreakdown.completed).toBe(1);
    expect(result.completionBreakdown.partially_completed).toBe(1);
    expect(result.completionBreakdown.not_completed).toBe(1);
    expect(result.completionBreakdown.excused).toBe(0);
  });

  it("calculates average time correctly", () => {
    const records = [
      makeRecord({ id: "1", timeSpentMinutes: 30 }),
      makeRecord({ id: "2", timeSpentMinutes: 60 }),
    ];
    const result = evaluateHomeworkCompletion(records);
    expect(result.averageTimeMinutes).toBe(45);
  });

  it("calculates difficulty rate correctly", () => {
    const records = [
      makeRecord({ id: "1", difficultyEncountered: true }),
      makeRecord({ id: "2", difficultyEncountered: false }),
      makeRecord({ id: "3", difficultyEncountered: true }),
    ];
    const result = evaluateHomeworkCompletion(records);
    expect(result.difficultyRate).toBe(67);
    expect(result.difficultyEncounteredCount).toBe(2);
  });

  it("generates strength for high completion rate", () => {
    const records = [
      makeRecord({ id: "1", completionStatus: "completed" }),
      makeRecord({ id: "2", completionStatus: "completed" }),
    ];
    const result = evaluateHomeworkCompletion(records);
    expect(result.strengths.some((s) => s.includes("Excellent homework completion rate"))).toBe(true);
  });

  it("generates concern for low completion rate", () => {
    const records = [
      makeRecord({ id: "1", completionStatus: "not_completed" }),
      makeRecord({ id: "2", completionStatus: "not_completed" }),
      makeRecord({ id: "3", completionStatus: "completed" }),
    ];
    const result = evaluateHomeworkCompletion(records);
    expect(result.concerns.some((c) => c.includes("Homework completion rate"))).toBe(true);
  });

  it("generates concern for high difficulty rate", () => {
    const records = [
      makeRecord({ id: "1", difficultyEncountered: true }),
      makeRecord({ id: "2", difficultyEncountered: true }),
      makeRecord({ id: "3", difficultyEncountered: false }),
    ];
    const result = evaluateHomeworkCompletion(records);
    expect(result.concerns.some((c) => c.includes("Difficulty encountered"))).toBe(true);
  });

  it("generates strength for good subject coverage", () => {
    const records = [
      makeRecord({ id: "1", subject: "english" }),
      makeRecord({ id: "2", subject: "maths" }),
      makeRecord({ id: "3", subject: "science" }),
      makeRecord({ id: "4", subject: "humanities" }),
      makeRecord({ id: "5", subject: "languages" }),
      makeRecord({ id: "6", subject: "creative_arts" }),
    ];
    const result = evaluateHomeworkCompletion(records);
    expect(result.strengths.some((s) => s.includes("Good subject coverage"))).toBe(true);
  });

  it("generates concern for low subject coverage", () => {
    const records = [
      makeRecord({ id: "1", subject: "english" }),
    ];
    const result = evaluateHomeworkCompletion(records);
    expect(result.concerns.some((c) => c.includes("subject(s) covered"))).toBe(true);
  });

  it("score is clamped between 0 and 25", () => {
    const result = evaluateHomeworkCompletion(OAK_HOUSE_RECORDS);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("Chamberlain House demo has 10 total records", () => {
    const result = evaluateHomeworkCompletion(OAK_HOUSE_RECORDS);
    expect(result.totalRecords).toBe(10);
  });

  it("Chamberlain House demo has 80% completion rate", () => {
    const result = evaluateHomeworkCompletion(OAK_HOUSE_RECORDS);
    expect(result.completionRate).toBe(80);
  });

  it("Chamberlain House demo covers 7 subjects", () => {
    const result = evaluateHomeworkCompletion(OAK_HOUSE_RECORDS);
    expect(result.subjectsCovered).toBe(7);
  });
});

// ==============================================================================
// 2. evaluateAcademicInterventions
// ==============================================================================

describe("evaluateAcademicInterventions", () => {
  it("returns score 0 for empty interventions", () => {
    const result = evaluateAcademicInterventions([]);
    expect(result.score).toBe(0);
    expect(result.totalInterventions).toBe(0);
  });

  it("returns concern for empty interventions", () => {
    const result = evaluateAcademicInterventions([]);
    expect(result.concerns.some((c) => c.includes("No academic interventions recorded"))).toBe(true);
  });

  it("calculates attendance rate correctly", () => {
    const interventions = [
      makeIntervention({ id: "1", sessionsPlanned: 10, sessionsAttended: 8 }),
      makeIntervention({ id: "2", sessionsPlanned: 10, sessionsAttended: 10 }),
    ];
    const result = evaluateAcademicInterventions(interventions);
    expect(result.averageAttendanceRate).toBe(90); // 18/20
  });

  it("calculates progress rate correctly", () => {
    const interventions = [
      makeIntervention({ id: "1", progressMade: "above_expected" }),
      makeIntervention({ id: "2", progressMade: "at_expected" }),
      makeIntervention({ id: "3", progressMade: "below_expected" }),
    ];
    const result = evaluateAcademicInterventions(interventions);
    expect(result.progressRate).toBe(67);
    expect(result.progressiveCount).toBe(2);
  });

  it("calculates PEP linked rate correctly", () => {
    const interventions = [
      makeIntervention({ id: "1", pepLinked: true }),
      makeIntervention({ id: "2", pepLinked: false }),
      makeIntervention({ id: "3", pepLinked: true }),
    ];
    const result = evaluateAcademicInterventions(interventions);
    expect(result.pepLinkedRate).toBe(67);
    expect(result.pepLinkedCount).toBe(2);
  });

  it("calculates intervention variety correctly", () => {
    const interventions = [
      makeIntervention({ id: "1", interventionType: "tutoring" }),
      makeIntervention({ id: "2", interventionType: "reading_programme" }),
      makeIntervention({ id: "3", interventionType: "tutoring" }),
    ];
    const result = evaluateAcademicInterventions(interventions);
    expect(result.interventionTypesUsed).toBe(2);
  });

  it("builds progress breakdown correctly", () => {
    const interventions = [
      makeIntervention({ id: "1", progressMade: "above_expected" }),
      makeIntervention({ id: "2", progressMade: "below_expected" }),
      makeIntervention({ id: "3", progressMade: "below_expected" }),
    ];
    const result = evaluateAcademicInterventions(interventions);
    expect(result.progressBreakdown.above_expected).toBe(1);
    expect(result.progressBreakdown.below_expected).toBe(2);
    expect(result.progressBreakdown.at_expected).toBe(0);
  });

  it("builds type breakdown correctly", () => {
    const interventions = [
      makeIntervention({ id: "1", interventionType: "tutoring" }),
      makeIntervention({ id: "2", interventionType: "sen_support" }),
      makeIntervention({ id: "3", interventionType: "tutoring" }),
    ];
    const result = evaluateAcademicInterventions(interventions);
    expect(result.typeBreakdown.tutoring).toBe(2);
    expect(result.typeBreakdown.sen_support).toBe(1);
  });

  it("builds attendance breakdown correctly", () => {
    const interventions = [
      makeIntervention({ id: "1", sessionsPlanned: 10, sessionsAttended: 7 }),
      makeIntervention({ id: "2", sessionsPlanned: 5, sessionsAttended: 5 }),
    ];
    const result = evaluateAcademicInterventions(interventions);
    expect(result.attendanceBreakdown.planned).toBe(15);
    expect(result.attendanceBreakdown.attended).toBe(12);
  });

  it("generates strength for high attendance", () => {
    const interventions = [
      makeIntervention({ id: "1", sessionsPlanned: 10, sessionsAttended: 10 }),
    ];
    const result = evaluateAcademicInterventions(interventions);
    expect(result.strengths.some((s) => s.includes("Excellent intervention attendance"))).toBe(true);
  });

  it("generates concern for low attendance", () => {
    const interventions = [
      makeIntervention({ id: "1", sessionsPlanned: 10, sessionsAttended: 3 }),
    ];
    const result = evaluateAcademicInterventions(interventions);
    expect(result.concerns.some((c) => c.includes("Intervention attendance"))).toBe(true);
  });

  it("generates concern for low PEP linkage", () => {
    const interventions = [
      makeIntervention({ id: "1", pepLinked: false }),
      makeIntervention({ id: "2", pepLinked: false }),
      makeIntervention({ id: "3", pepLinked: true }),
    ];
    const result = evaluateAcademicInterventions(interventions);
    expect(result.concerns.some((c) => c.includes("PEP linkage"))).toBe(true);
  });

  it("generates concern for significantly below progress", () => {
    const interventions = [
      makeIntervention({ id: "1", progressMade: "significantly_below" }),
    ];
    const result = evaluateAcademicInterventions(interventions);
    expect(result.concerns.some((c) => c.includes("significantly below expected progress"))).toBe(true);
  });

  it("generates strength for diverse intervention types", () => {
    const interventions = [
      makeIntervention({ id: "1", interventionType: "tutoring" }),
      makeIntervention({ id: "2", interventionType: "mentoring" }),
      makeIntervention({ id: "3", interventionType: "sen_support" }),
      makeIntervention({ id: "4", interventionType: "reading_programme" }),
    ];
    const result = evaluateAcademicInterventions(interventions);
    expect(result.strengths.some((s) => s.includes("Diverse intervention approaches"))).toBe(true);
  });

  it("score is clamped between 0 and 25", () => {
    const result = evaluateAcademicInterventions(OAK_HOUSE_INTERVENTIONS);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("Chamberlain House demo has 2 interventions", () => {
    const result = evaluateAcademicInterventions(OAK_HOUSE_INTERVENTIONS);
    expect(result.totalInterventions).toBe(2);
  });

  it("Chamberlain House demo has 100% PEP linkage", () => {
    const result = evaluateAcademicInterventions(OAK_HOUSE_INTERVENTIONS);
    expect(result.pepLinkedRate).toBe(100);
  });

  it("Chamberlain House demo has 100% progress rate", () => {
    const result = evaluateAcademicInterventions(OAK_HOUSE_INTERVENTIONS);
    expect(result.progressRate).toBe(100);
  });
});

// ==============================================================================
// 3. evaluateResourceProvision
// ==============================================================================

describe("evaluateResourceProvision", () => {
  it("returns score 0 for empty resources", () => {
    const result = evaluateResourceProvision([]);
    expect(result.score).toBe(0);
    expect(result.totalResources).toBe(0);
  });

  it("returns concern for empty resources", () => {
    const result = evaluateResourceProvision([]);
    expect(result.concerns.some((c) => c.includes("No educational resources recorded"))).toBe(true);
  });

  it("calculates availability rate correctly", () => {
    const resources = [
      makeResource({ id: "1", available: true }),
      makeResource({ id: "2", available: false }),
      makeResource({ id: "3", available: true }),
    ];
    const result = evaluateResourceProvision(resources);
    expect(result.availabilityRate).toBe(67);
    expect(result.availableCount).toBe(2);
  });

  it("calculates adequacy rate correctly", () => {
    const resources = [
      makeResource({ id: "1", adequateForNeeds: true }),
      makeResource({ id: "2", adequateForNeeds: true }),
      makeResource({ id: "3", adequateForNeeds: false }),
    ];
    const result = evaluateResourceProvision(resources);
    expect(result.adequacyRate).toBe(67);
    expect(result.adequateCount).toBe(2);
  });

  it("calculates resource variety correctly", () => {
    const resources = [
      makeResource({ id: "1", resourceType: "quiet_study_area" }),
      makeResource({ id: "2", resourceType: "computer_access" }),
      makeResource({ id: "3", resourceType: "quiet_study_area" }), // duplicate type
    ];
    const result = evaluateResourceProvision(resources);
    expect(result.resourceTypesPresent).toBe(2);
  });

  it("builds resource breakdown correctly", () => {
    const resources = [
      makeResource({ id: "1", resourceType: "quiet_study_area", available: true, adequateForNeeds: true }),
      makeResource({ id: "2", resourceType: "computer_access", available: false, adequateForNeeds: false }),
    ];
    const result = evaluateResourceProvision(resources);
    expect(result.resourceBreakdown.quiet_study_area.available).toBe(true);
    expect(result.resourceBreakdown.quiet_study_area.adequate).toBe(true);
    expect(result.resourceBreakdown.computer_access.available).toBe(false);
  });

  it("generates strength for high availability", () => {
    const resources = [
      makeResource({ id: "1", available: true }),
      makeResource({ id: "2", available: true }),
    ];
    const result = evaluateResourceProvision(resources);
    expect(result.strengths.some((s) => s.includes("Excellent resource availability"))).toBe(true);
  });

  it("generates concern for low availability", () => {
    const resources = [
      makeResource({ id: "1", available: false }),
      makeResource({ id: "2", available: false }),
      makeResource({ id: "3", available: true }),
    ];
    const result = evaluateResourceProvision(resources);
    expect(result.concerns.some((c) => c.includes("Resource availability"))).toBe(true);
  });

  it("generates concern for missing critical resources", () => {
    const resources = [
      makeResource({ id: "1", resourceType: "stationery", available: true }),
    ];
    const result = evaluateResourceProvision(resources);
    expect(result.concerns.some((c) => c.includes("Computer Access"))).toBe(true);
    expect(result.concerns.some((c) => c.includes("Internet Access"))).toBe(true);
  });

  it("generates strength for comprehensive resource types", () => {
    const resources = [
      makeResource({ id: "1", resourceType: "quiet_study_area" }),
      makeResource({ id: "2", resourceType: "computer_access" }),
      makeResource({ id: "3", resourceType: "books_library" }),
      makeResource({ id: "4", resourceType: "stationery" }),
      makeResource({ id: "5", resourceType: "internet_access" }),
      makeResource({ id: "6", resourceType: "specialist_software" }),
    ];
    const result = evaluateResourceProvision(resources);
    expect(result.strengths.some((s) => s.includes("Comprehensive resource provision"))).toBe(true);
  });

  it("generates concern for low resource variety", () => {
    const resources = [
      makeResource({ id: "1", resourceType: "stationery" }),
    ];
    const result = evaluateResourceProvision(resources);
    expect(result.concerns.some((c) => c.includes("resource type(s) available"))).toBe(true);
  });

  it("score is clamped between 0 and 25", () => {
    const result = evaluateResourceProvision(OAK_HOUSE_RESOURCES);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("Chamberlain House demo has 7 resources", () => {
    const result = evaluateResourceProvision(OAK_HOUSE_RESOURCES);
    expect(result.totalResources).toBe(7);
  });

  it("Chamberlain House demo has 6 available out of 7", () => {
    const result = evaluateResourceProvision(OAK_HOUSE_RESOURCES);
    expect(result.availableCount).toBe(6);
    expect(result.availabilityRate).toBe(86);
  });

  it("Chamberlain House demo has 7 resource types present", () => {
    const result = evaluateResourceProvision(OAK_HOUSE_RESOURCES);
    expect(result.resourceTypesPresent).toBe(7);
  });
});

// ==============================================================================
// 4. evaluateStaffEducationReadiness
// ==============================================================================

describe("evaluateStaffEducationReadiness", () => {
  it("returns score 0 for empty training", () => {
    const result = evaluateStaffEducationReadiness([]);
    expect(result.score).toBe(0);
    expect(result.totalStaff).toBe(0);
  });

  it("returns concern for empty training", () => {
    const result = evaluateStaffEducationReadiness([]);
    expect(result.concerns.some((c) => c.includes("No staff education training records"))).toBe(true);
  });

  it("calculates homework support rate correctly", () => {
    const training = [
      makeTraining({ id: "1", staffId: "s1", homeworkSupportTrained: true }),
      makeTraining({ id: "2", staffId: "s2", homeworkSupportTrained: false }),
    ];
    const result = evaluateStaffEducationReadiness(training);
    expect(result.homeworkSupportRate).toBe(50);
    expect(result.homeworkSupportCount).toBe(1);
  });

  it("calculates PEP awareness rate correctly", () => {
    const training = [
      makeTraining({ id: "1", staffId: "s1", pepAwareness: true }),
      makeTraining({ id: "2", staffId: "s2", pepAwareness: true }),
      makeTraining({ id: "3", staffId: "s3", pepAwareness: false }),
    ];
    const result = evaluateStaffEducationReadiness(training);
    expect(result.pepAwarenessRate).toBe(67);
  });

  it("calculates SEN awareness rate correctly", () => {
    const training = [
      makeTraining({ id: "1", staffId: "s1", senAwareness: true }),
      makeTraining({ id: "2", staffId: "s2", senAwareness: false }),
    ];
    const result = evaluateStaffEducationReadiness(training);
    expect(result.senAwarenessRate).toBe(50);
  });

  it("calculates education advocacy rate correctly", () => {
    const training = [
      makeTraining({ id: "1", staffId: "s1", educationAdvocacy: true }),
      makeTraining({ id: "2", staffId: "s2", educationAdvocacy: true }),
    ];
    const result = evaluateStaffEducationReadiness(training);
    expect(result.educationAdvocacyRate).toBe(100);
  });

  it("calculates exam support rate correctly", () => {
    const training = [
      makeTraining({ id: "1", staffId: "s1", examSupportTrained: true }),
      makeTraining({ id: "2", staffId: "s2", examSupportTrained: false }),
      makeTraining({ id: "3", staffId: "s3", examSupportTrained: true }),
    ];
    const result = evaluateStaffEducationReadiness(training);
    expect(result.examSupportRate).toBe(67);
    expect(result.examSupportCount).toBe(2);
  });

  it("calculates attachment-aware rate correctly", () => {
    const training = [
      makeTraining({ id: "1", staffId: "s1", attachmentAwareEducation: true }),
      makeTraining({ id: "2", staffId: "s2", attachmentAwareEducation: false }),
    ];
    const result = evaluateStaffEducationReadiness(training);
    expect(result.attachmentAwareRate).toBe(50);
    expect(result.attachmentAwareCount).toBe(1);
  });

  it("calculates fully trained rate (all 6 competencies)", () => {
    const training = [
      makeTraining({ id: "1", staffId: "s1" }), // all true
      makeTraining({ id: "2", staffId: "s2", examSupportTrained: false }),
    ];
    const result = evaluateStaffEducationReadiness(training);
    expect(result.fullyTrainedRate).toBe(50);
    expect(result.fullyTrainedCount).toBe(1);
  });

  it("generates strength for 100% fully trained", () => {
    const training = [
      makeTraining({ id: "1", staffId: "s1" }),
    ];
    const result = evaluateStaffEducationReadiness(training);
    expect(result.strengths.some((s) => s.includes("100% of staff fully trained"))).toBe(true);
  });

  it("generates concern for low homework support training", () => {
    const training = [
      makeTraining({ id: "1", staffId: "s1", homeworkSupportTrained: false }),
      makeTraining({ id: "2", staffId: "s2", homeworkSupportTrained: false }),
      makeTraining({ id: "3", staffId: "s3", homeworkSupportTrained: true }),
    ];
    const result = evaluateStaffEducationReadiness(training);
    expect(result.concerns.some((c) => c.includes("Homework support training"))).toBe(true);
  });

  it("generates concern for low PEP awareness", () => {
    const training = [
      makeTraining({ id: "1", staffId: "s1", pepAwareness: false }),
      makeTraining({ id: "2", staffId: "s2", pepAwareness: false }),
      makeTraining({ id: "3", staffId: "s3", pepAwareness: true }),
    ];
    const result = evaluateStaffEducationReadiness(training);
    expect(result.concerns.some((c) => c.includes("PEP awareness"))).toBe(true);
  });

  it("generates concern for low SEN awareness", () => {
    const training = [
      makeTraining({ id: "1", staffId: "s1", senAwareness: false }),
      makeTraining({ id: "2", staffId: "s2", senAwareness: false }),
      makeTraining({ id: "3", staffId: "s3", senAwareness: true }),
    ];
    const result = evaluateStaffEducationReadiness(training);
    expect(result.concerns.some((c) => c.includes("SEN awareness"))).toBe(true);
  });

  it("generates concern for low attachment-aware training", () => {
    const training = [
      makeTraining({ id: "1", staffId: "s1", attachmentAwareEducation: false }),
      makeTraining({ id: "2", staffId: "s2", attachmentAwareEducation: false }),
      makeTraining({ id: "3", staffId: "s3", attachmentAwareEducation: true }),
    ];
    const result = evaluateStaffEducationReadiness(training);
    expect(result.concerns.some((c) => c.includes("Attachment-aware education"))).toBe(true);
  });

  it("score is clamped between 0 and 25", () => {
    const result = evaluateStaffEducationReadiness(OAK_HOUSE_TRAINING);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("Chamberlain House demo has 4 staff", () => {
    const result = evaluateStaffEducationReadiness(OAK_HOUSE_TRAINING);
    expect(result.totalStaff).toBe(4);
  });

  it("Chamberlain House demo has 100% homework support training", () => {
    const result = evaluateStaffEducationReadiness(OAK_HOUSE_TRAINING);
    expect(result.homeworkSupportRate).toBe(100);
  });

  it("Chamberlain House demo has 75% exam support training (3 of 4)", () => {
    const result = evaluateStaffEducationReadiness(OAK_HOUSE_TRAINING);
    expect(result.examSupportRate).toBe(75);
  });

  it("Chamberlain House demo has 75% fully trained (3 of 4)", () => {
    const result = evaluateStaffEducationReadiness(OAK_HOUSE_TRAINING);
    expect(result.fullyTrainedRate).toBe(75);
  });
});

// ==============================================================================
// 5. buildChildAcademicProfiles
// ==============================================================================

describe("buildChildAcademicProfiles", () => {
  it("returns empty array for no records and no interventions", () => {
    const result = buildChildAcademicProfiles([], []);
    expect(result).toHaveLength(0);
  });

  it("creates profiles from homework records", () => {
    const result = buildChildAcademicProfiles(OAK_HOUSE_RECORDS, []);
    expect(result.length).toBeGreaterThanOrEqual(3);
  });

  it("creates profiles from interventions even without records", () => {
    const result = buildChildAcademicProfiles([], OAK_HOUSE_INTERVENTIONS);
    expect(result).toHaveLength(2);
  });

  it("calculates completion rate per child", () => {
    const records = [
      makeRecord({ id: "1", childId: "child-a", childName: "A", completionStatus: "completed" }),
      makeRecord({ id: "2", childId: "child-a", childName: "A", completionStatus: "not_completed" }),
    ];
    const result = buildChildAcademicProfiles(records, []);
    const childA = result.find((p) => p.childId === "child-a");
    expect(childA!.completionRate).toBe(50);
    expect(childA!.homeworkRecords).toBe(2);
  });

  it("detects support received", () => {
    const records = [
      makeRecord({ id: "1", childId: "child-a", childName: "A", supportProvided: ["staff_help"] }),
    ];
    const result = buildChildAcademicProfiles(records, []);
    const childA = result.find((p) => p.childId === "child-a");
    expect(childA!.supportReceived).toBe(true);
  });

  it("detects no support received when only none", () => {
    const records = [
      makeRecord({ id: "1", childId: "child-a", childName: "A", supportProvided: ["none"] }),
    ];
    const result = buildChildAcademicProfiles(records, []);
    const childA = result.find((p) => p.childId === "child-a");
    expect(childA!.supportReceived).toBe(false);
  });

  it("calculates difficulty rate per child", () => {
    const records = [
      makeRecord({ id: "1", childId: "child-a", childName: "A", difficultyEncountered: true }),
      makeRecord({ id: "2", childId: "child-a", childName: "A", difficultyEncountered: false }),
    ];
    const result = buildChildAcademicProfiles(records, []);
    const childA = result.find((p) => p.childId === "child-a");
    expect(childA!.difficultyRate).toBe(50);
  });

  it("counts interventions per child", () => {
    const result = buildChildAcademicProfiles([], OAK_HOUSE_INTERVENTIONS);
    const jordan = result.find((p) => p.childId === "child-jordan");
    expect(jordan!.interventionCount).toBe(1);
  });

  it("finds best progress across interventions", () => {
    const interventions = [
      makeIntervention({ id: "1", childId: "child-a", childName: "A", progressMade: "below_expected" }),
      makeIntervention({ id: "2", childId: "child-a", childName: "A", progressMade: "above_expected" }),
    ];
    const result = buildChildAcademicProfiles([], interventions);
    const childA = result.find((p) => p.childId === "child-a");
    expect(childA!.bestProgress).toBe("above_expected");
  });

  it("returns null bestProgress when no interventions", () => {
    const records = [makeRecord({ id: "1", childId: "child-a", childName: "A" })];
    const result = buildChildAcademicProfiles(records, []);
    const childA = result.find((p) => p.childId === "child-a");
    expect(childA!.bestProgress).toBeNull();
  });

  it("education score boosts for high completion", () => {
    const records = [
      makeRecord({ id: "1", childId: "child-a", childName: "A", completionStatus: "completed" }),
      makeRecord({ id: "2", childId: "child-a", childName: "A", completionStatus: "completed" }),
    ];
    const result = buildChildAcademicProfiles(records, []);
    const childA = result.find((p) => p.childId === "child-a");
    expect(childA!.educationScore).toBeGreaterThan(5);
  });

  it("education score deducts for low completion", () => {
    const records = [
      makeRecord({ id: "1", childId: "child-a", childName: "A", completionStatus: "not_completed" }),
      makeRecord({ id: "2", childId: "child-a", childName: "A", completionStatus: "not_completed" }),
      makeRecord({ id: "3", childId: "child-a", childName: "A", completionStatus: "completed" }),
    ];
    const result = buildChildAcademicProfiles(records, []);
    const childA = result.find((p) => p.childId === "child-a");
    expect(childA!.educationScore).toBeLessThan(5);
  });

  it("education score boosts for above expected progress", () => {
    const interventions = [
      makeIntervention({ id: "1", childId: "child-a", childName: "A", progressMade: "above_expected" }),
    ];
    const result = buildChildAcademicProfiles([], interventions);
    const childA = result.find((p) => p.childId === "child-a");
    expect(childA!.educationScore).toBeGreaterThan(5);
  });

  it("education score deducts for significantly below progress", () => {
    const interventions = [
      makeIntervention({ id: "1", childId: "child-a", childName: "A", progressMade: "significantly_below" }),
    ];
    const result = buildChildAcademicProfiles([], interventions);
    const childA = result.find((p) => p.childId === "child-a");
    expect(childA!.educationScore).toBeLessThan(5);
  });

  it("education score is clamped to 0-10", () => {
    const records = [
      makeRecord({ id: "1", childId: "child-worst", childName: "Worst", completionStatus: "not_completed", difficultyEncountered: true }),
      makeRecord({ id: "2", childId: "child-worst", childName: "Worst", completionStatus: "not_completed", difficultyEncountered: true }),
      makeRecord({ id: "3", childId: "child-worst", childName: "Worst", completionStatus: "not_completed", difficultyEncountered: true }),
    ];
    const interventions = [
      makeIntervention({ id: "1", childId: "child-worst", childName: "Worst", progressMade: "significantly_below" }),
    ];
    const result = buildChildAcademicProfiles(records, interventions);
    const worst = result.find((p) => p.childId === "child-worst");
    expect(worst!.educationScore).toBeGreaterThanOrEqual(0);
    expect(worst!.educationScore).toBeLessThanOrEqual(10);
  });

  it("deduplicates children appearing in both records and interventions", () => {
    const records = [makeRecord({ id: "1", childId: "child-jordan", childName: "Jordan" })];
    const interventions = [makeIntervention({ id: "1", childId: "child-jordan", childName: "Jordan" })];
    const result = buildChildAcademicProfiles(records, interventions);
    const jordanProfiles = result.filter((p) => p.childId === "child-jordan");
    expect(jordanProfiles).toHaveLength(1);
    expect(jordanProfiles[0].homeworkRecords).toBe(1);
    expect(jordanProfiles[0].interventionCount).toBe(1);
  });
});

// ==============================================================================
// 6. generateHomeworkAcademicSupportIntelligence
// ==============================================================================

describe("generateHomeworkAcademicSupportIntelligence", () => {
  it("produces overall score 0-100", () => {
    const result = generateHomeworkAcademicSupportIntelligence(
      OAK_HOUSE_RECORDS, OAK_HOUSE_INTERVENTIONS, OAK_HOUSE_RESOURCES,
      OAK_HOUSE_TRAINING, "oak-house", "2026-04-01", "2026-05-19",
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("produces a valid rating", () => {
    const result = generateHomeworkAcademicSupportIntelligence(
      OAK_HOUSE_RECORDS, OAK_HOUSE_INTERVENTIONS, OAK_HOUSE_RESOURCES,
      OAK_HOUSE_TRAINING, "oak-house", "2026-04-01", "2026-05-19",
    );
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);
  });

  it("includes all 4 evaluator results", () => {
    const result = generateHomeworkAcademicSupportIntelligence(
      OAK_HOUSE_RECORDS, OAK_HOUSE_INTERVENTIONS, OAK_HOUSE_RESOURCES,
      OAK_HOUSE_TRAINING, "oak-house", "2026-04-01", "2026-05-19",
    );
    expect(result.homeworkCompletion).toBeDefined();
    expect(result.academicInterventions).toBeDefined();
    expect(result.resourceProvision).toBeDefined();
    expect(result.staffEducationReadiness).toBeDefined();
  });

  it("overall score equals sum of 4 evaluator scores", () => {
    const result = generateHomeworkAcademicSupportIntelligence(
      OAK_HOUSE_RECORDS, OAK_HOUSE_INTERVENTIONS, OAK_HOUSE_RESOURCES,
      OAK_HOUSE_TRAINING, "oak-house", "2026-04-01", "2026-05-19",
    );
    const expectedSum = Math.round(
      result.homeworkCompletion.score +
      result.academicInterventions.score +
      result.resourceProvision.score +
      result.staffEducationReadiness.score,
    );
    expect(result.overallScore).toBe(Math.max(0, Math.min(100, expectedSum)));
  });

  it("includes child profiles", () => {
    const result = generateHomeworkAcademicSupportIntelligence(
      OAK_HOUSE_RECORDS, OAK_HOUSE_INTERVENTIONS, OAK_HOUSE_RESOURCES,
      OAK_HOUSE_TRAINING, "oak-house", "2026-04-01", "2026-05-19",
    );
    expect(result.childProfiles.length).toBeGreaterThan(0);
  });

  it("includes regulatory links", () => {
    const result = generateHomeworkAcademicSupportIntelligence(
      OAK_HOUSE_RECORDS, OAK_HOUSE_INTERVENTIONS, OAK_HOUSE_RESOURCES,
      OAK_HOUSE_TRAINING, "oak-house", "2026-04-01", "2026-05-19",
    );
    expect(result.regulatoryLinks.length).toBe(7);
  });

  it("includes CHR 2015 Reg 8 in regulatory links", () => {
    const result = generateHomeworkAcademicSupportIntelligence(
      OAK_HOUSE_RECORDS, OAK_HOUSE_INTERVENTIONS, OAK_HOUSE_RESOURCES,
      OAK_HOUSE_TRAINING, "oak-house", "2026-04-01", "2026-05-19",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015, Reg 8"))).toBe(true);
  });

  it("includes CHR 2015 Reg 10 in regulatory links", () => {
    const result = generateHomeworkAcademicSupportIntelligence(
      OAK_HOUSE_RECORDS, OAK_HOUSE_INTERVENTIONS, OAK_HOUSE_RESOURCES,
      OAK_HOUSE_TRAINING, "oak-house", "2026-04-01", "2026-05-19",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015, Reg 10"))).toBe(true);
  });

  it("includes SCCIF in regulatory links", () => {
    const result = generateHomeworkAcademicSupportIntelligence(
      OAK_HOUSE_RECORDS, OAK_HOUSE_INTERVENTIONS, OAK_HOUSE_RESOURCES,
      OAK_HOUSE_TRAINING, "oak-house", "2026-04-01", "2026-05-19",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
  });

  it("includes SEN Code of Practice 2015 in regulatory links", () => {
    const result = generateHomeworkAcademicSupportIntelligence(
      OAK_HOUSE_RECORDS, OAK_HOUSE_INTERVENTIONS, OAK_HOUSE_RESOURCES,
      OAK_HOUSE_TRAINING, "oak-house", "2026-04-01", "2026-05-19",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("SEN Code of Practice 2015"))).toBe(true);
  });

  it("includes UNCRC Article 28 in regulatory links", () => {
    const result = generateHomeworkAcademicSupportIntelligence(
      OAK_HOUSE_RECORDS, OAK_HOUSE_INTERVENTIONS, OAK_HOUSE_RESOURCES,
      OAK_HOUSE_TRAINING, "oak-house", "2026-04-01", "2026-05-19",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("UNCRC Article 28"))).toBe(true);
  });

  it("includes UNCRC Article 29 in regulatory links", () => {
    const result = generateHomeworkAcademicSupportIntelligence(
      OAK_HOUSE_RECORDS, OAK_HOUSE_INTERVENTIONS, OAK_HOUSE_RESOURCES,
      OAK_HOUSE_TRAINING, "oak-house", "2026-04-01", "2026-05-19",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("UNCRC Article 29"))).toBe(true);
  });

  it("includes Children Act 1989 in regulatory links", () => {
    const result = generateHomeworkAcademicSupportIntelligence(
      OAK_HOUSE_RECORDS, OAK_HOUSE_INTERVENTIONS, OAK_HOUSE_RESOURCES,
      OAK_HOUSE_TRAINING, "oak-house", "2026-04-01", "2026-05-19",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("Children Act 1989"))).toBe(true);
  });

  it("sets homeId correctly", () => {
    const result = generateHomeworkAcademicSupportIntelligence(
      [], [], [], [], "oak-house", "2026-04-01", "2026-05-19",
    );
    expect(result.homeId).toBe("oak-house");
  });

  it("sets period dates correctly", () => {
    const result = generateHomeworkAcademicSupportIntelligence(
      [], [], [], [], "oak-house", "2026-04-01", "2026-05-19",
    );
    expect(result.periodStart).toBe("2026-04-01");
    expect(result.periodEnd).toBe("2026-05-19");
  });

  it("filters records by period", () => {
    const records = [
      makeRecord({ id: "1", date: "2026-05-05" }),
      makeRecord({ id: "2", date: "2026-03-01" }), // outside period
    ];
    const result = generateHomeworkAcademicSupportIntelligence(
      records, [], [], [], "oak-house", "2026-04-01", "2026-05-19",
    );
    expect(result.homeworkCompletion.totalRecords).toBe(1);
  });

  it("filters interventions by period", () => {
    const interventions = [
      makeIntervention({ id: "1", startDate: "2026-04-15" }),
      makeIntervention({ id: "2", startDate: "2026-03-01" }), // outside period
    ];
    const result = generateHomeworkAcademicSupportIntelligence(
      [], interventions, [], [], "oak-house", "2026-04-01", "2026-05-19",
    );
    expect(result.academicInterventions.totalInterventions).toBe(1);
  });

  it("rating is outstanding for score >= 80", () => {
    const records = [
      makeRecord({ id: "1", completionStatus: "completed", supportProvided: ["staff_help"], schoolFeedbackPositive: true, subject: "english" }),
      makeRecord({ id: "2", completionStatus: "completed", supportProvided: ["tutor"], schoolFeedbackPositive: true, subject: "maths" }),
      makeRecord({ id: "3", completionStatus: "completed", supportProvided: ["staff_help"], schoolFeedbackPositive: true, subject: "science" }),
      makeRecord({ id: "4", completionStatus: "completed", supportProvided: ["staff_help"], schoolFeedbackPositive: true, subject: "humanities" }),
      makeRecord({ id: "5", completionStatus: "completed", supportProvided: ["staff_help"], schoolFeedbackPositive: true, subject: "languages" }),
      makeRecord({ id: "6", completionStatus: "completed", supportProvided: ["staff_help"], schoolFeedbackPositive: true, subject: "creative_arts" }),
    ];
    const interventions = [
      makeIntervention({ id: "1", sessionsPlanned: 10, sessionsAttended: 10, progressMade: "above_expected", pepLinked: true }),
      makeIntervention({ id: "2", interventionType: "mentoring", sessionsPlanned: 5, sessionsAttended: 5, progressMade: "at_expected", pepLinked: true }),
    ];
    const resources = OAK_HOUSE_RESOURCES.map((r) => ({ ...r, available: true, adequateForNeeds: true }));
    const training = [
      makeTraining({ id: "1", staffId: "s1" }),
      makeTraining({ id: "2", staffId: "s2" }),
    ];
    const result = generateHomeworkAcademicSupportIntelligence(
      records, interventions, resources, training, "test", "2026-04-01", "2026-05-19",
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.rating).toBe("outstanding");
  });

  it("rating is inadequate for score < 40", () => {
    const result = generateHomeworkAcademicSupportIntelligence(
      [makeRecord({ id: "1", date: "2026-05-05", completionStatus: "not_completed", supportProvided: ["none"], schoolFeedbackPositive: false, difficultyEncountered: true })],
      [], [], [], "test", "2026-04-01", "2026-05-19",
    );
    expect(result.overallScore).toBeLessThan(40);
    expect(result.rating).toBe("inadequate");
  });

  it("generates URGENT action for children with low education scores", () => {
    const records = [
      makeRecord({ id: "1", date: "2026-05-05", childId: "child-at-risk", childName: "AtRisk", completionStatus: "not_completed", supportProvided: ["none"], difficultyEncountered: true }),
      makeRecord({ id: "2", date: "2026-05-06", childId: "child-at-risk", childName: "AtRisk", completionStatus: "not_completed", supportProvided: ["none"], difficultyEncountered: true }),
      makeRecord({ id: "3", date: "2026-05-07", childId: "child-at-risk", childName: "AtRisk", completionStatus: "not_completed", supportProvided: ["none"], difficultyEncountered: true }),
    ];
    const interventions = [
      makeIntervention({ id: "1", childId: "child-at-risk", childName: "AtRisk", startDate: "2026-05-01", progressMade: "significantly_below" }),
    ];
    const result = generateHomeworkAcademicSupportIntelligence(
      records, interventions, [], [], "oak-house", "2026-04-01", "2026-05-19",
    );
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("low education scores"))).toBe(true);
  });

  it("generates no-action message when all is well", () => {
    const records = [
      makeRecord({ id: "1", completionStatus: "completed", supportProvided: ["staff_help"], schoolFeedbackPositive: true }),
    ];
    const interventions = [
      makeIntervention({ id: "1", sessionsPlanned: 10, sessionsAttended: 10, progressMade: "at_expected", pepLinked: true }),
    ];
    const resources = OAK_HOUSE_RESOURCES.map((r) => ({ ...r, available: true, adequateForNeeds: true }));
    const training = [makeTraining({ id: "1", staffId: "s1" })];
    const result = generateHomeworkAcademicSupportIntelligence(
      records, interventions, resources, training, "oak-house", "2026-04-01", "2026-05-19",
    );
    expect(result.actions.some((a) => a.includes("No immediate actions required"))).toBe(true);
  });

  it("includes assessedAt timestamp", () => {
    const result = generateHomeworkAcademicSupportIntelligence(
      [], [], [], [], "oak-house", "2026-04-01", "2026-05-19",
    );
    expect(result.assessedAt).toBeDefined();
    expect(result.assessedAt.length).toBeGreaterThan(0);
  });

  it("generates action for low PEP linkage", () => {
    const interventions = [
      makeIntervention({ id: "1", startDate: "2026-05-01", pepLinked: false }),
      makeIntervention({ id: "2", startDate: "2026-05-02", pepLinked: false }),
    ];
    const result = generateHomeworkAcademicSupportIntelligence(
      [], interventions, [], [], "oak-house", "2026-04-01", "2026-05-19",
    );
    expect(result.actions.some((a) => a.includes("PEP linkage"))).toBe(true);
  });

  it("generates action for low resource availability", () => {
    const resources = [
      makeResource({ id: "1", available: false }),
      makeResource({ id: "2", available: false }),
      makeResource({ id: "3", available: true }),
    ];
    const result = generateHomeworkAcademicSupportIntelligence(
      [], [], resources, [], "oak-house", "2026-04-01", "2026-05-19",
    );
    expect(result.actions.some((a) => a.includes("Resource availability"))).toBe(true);
  });
});

// ==============================================================================
// 7. getRating
// ==============================================================================

describe("getRating", () => {
  it("returns outstanding for score >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
  });

  it("returns good for score 60-79", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
  });

  it("returns requires_improvement for score 40-59", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
  });

  it("returns inadequate for score < 40", () => {
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(39)).toBe("inadequate");
  });
});

// ==============================================================================
// 8. Label utilities
// ==============================================================================

describe("getSubjectLabel", () => {
  it("returns English for english", () => {
    expect(getSubjectLabel("english")).toBe("English");
  });
  it("returns Maths for maths", () => {
    expect(getSubjectLabel("maths")).toBe("Maths");
  });
  it("returns Science for science", () => {
    expect(getSubjectLabel("science")).toBe("Science");
  });
  it("returns Creative Arts for creative_arts", () => {
    expect(getSubjectLabel("creative_arts")).toBe("Creative Arts");
  });
  it("returns PE for pe", () => {
    expect(getSubjectLabel("pe")).toBe("PE");
  });
});

describe("getCompletionLabel", () => {
  it("returns Completed for completed", () => {
    expect(getCompletionLabel("completed")).toBe("Completed");
  });
  it("returns Not Completed for not_completed", () => {
    expect(getCompletionLabel("not_completed")).toBe("Not Completed");
  });
  it("returns Excused for excused", () => {
    expect(getCompletionLabel("excused")).toBe("Excused");
  });
});

describe("getSupportLabel", () => {
  it("returns Staff Help for staff_help", () => {
    expect(getSupportLabel("staff_help")).toBe("Staff Help");
  });
  it("returns Tutor for tutor", () => {
    expect(getSupportLabel("tutor")).toBe("Tutor");
  });
  it("returns None for none", () => {
    expect(getSupportLabel("none")).toBe("None");
  });
});

describe("getProgressLabel", () => {
  it("returns Above Expected for above_expected", () => {
    expect(getProgressLabel("above_expected")).toBe("Above Expected");
  });
  it("returns At Expected for at_expected", () => {
    expect(getProgressLabel("at_expected")).toBe("At Expected");
  });
  it("returns Significantly Below for significantly_below", () => {
    expect(getProgressLabel("significantly_below")).toBe("Significantly Below");
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

describe("getResourceLabel", () => {
  it("returns Quiet Study Area for quiet_study_area", () => {
    expect(getResourceLabel("quiet_study_area")).toBe("Quiet Study Area");
  });
  it("returns Computer Access for computer_access", () => {
    expect(getResourceLabel("computer_access")).toBe("Computer Access");
  });
  it("returns input for unknown types", () => {
    expect(getResourceLabel("unknown_type")).toBe("unknown_type");
  });
});

describe("getInterventionTypeLabel", () => {
  it("returns Tutoring for tutoring", () => {
    expect(getInterventionTypeLabel("tutoring")).toBe("Tutoring");
  });
  it("returns SEN Support for sen_support", () => {
    expect(getInterventionTypeLabel("sen_support")).toBe("SEN Support");
  });
  it("returns Exam Preparation for exam_preparation", () => {
    expect(getInterventionTypeLabel("exam_preparation")).toBe("Exam Preparation");
  });
  it("returns input for unknown types", () => {
    expect(getInterventionTypeLabel("unknown")).toBe("unknown");
  });
});

// ==============================================================================
// 9. pct helper edge cases (tested indirectly)
// ==============================================================================

describe("pct helper edge cases (via evaluators)", () => {
  it("handles zero denominator in homework completion", () => {
    const result = evaluateHomeworkCompletion([]);
    expect(result.completionRate).toBe(0);
    expect(result.supportProvidedRate).toBe(0);
    expect(result.difficultyRate).toBe(0);
  });

  it("handles zero denominator in academic interventions", () => {
    const result = evaluateAcademicInterventions([]);
    expect(result.averageAttendanceRate).toBe(0);
    expect(result.progressRate).toBe(0);
    expect(result.pepLinkedRate).toBe(0);
  });

  it("handles zero denominator in resource provision", () => {
    const result = evaluateResourceProvision([]);
    expect(result.availabilityRate).toBe(0);
    expect(result.adequacyRate).toBe(0);
  });

  it("handles zero denominator in staff readiness", () => {
    const result = evaluateStaffEducationReadiness([]);
    expect(result.homeworkSupportRate).toBe(0);
    expect(result.pepAwarenessRate).toBe(0);
    expect(result.fullyTrainedRate).toBe(0);
  });

  it("rounds percentages correctly", () => {
    const records = [
      makeRecord({ id: "1", completionStatus: "completed" }),
      makeRecord({ id: "2", completionStatus: "completed" }),
      makeRecord({ id: "3", completionStatus: "not_completed" }),
    ];
    const result = evaluateHomeworkCompletion(records);
    // 2/3 = 66.66... rounds to 67
    expect(result.completionRate).toBe(67);
  });
});
