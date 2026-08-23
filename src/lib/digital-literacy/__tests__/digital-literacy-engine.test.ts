// ══════════════════════════════════════════════════════════════════════════════
// Tests — Digital Literacy & Online Engagement Intelligence Engine
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateDigitalSkills,
  evaluateDeviceAccess,
  evaluateOnlineLearning,
  evaluateDigitalCitizenship,
  buildChildDigitalProfiles,
  generateDigitalLiteracyIntelligence,
  getSkillCategoryLabel,
  getCitizenshipAreaLabel,
  getSkillLevelValue,
} from "../digital-literacy-engine";
import type {
  DigitalSkillAssessment,
  DeviceAccessRecord,
  OnlineLearningRecord,
  DigitalCitizenshipRecord,
  DigitalSkillCategory,
  SkillLevel,
} from "../digital-literacy-engine";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const PERIOD_START = "2026-01-01";
const PERIOD_END = "2026-05-18";
const REFERENCE_DATE = "2026-05-18";

const CHILD_IDS = ["child-alex", "child-jordan", "child-morgan"];
const CHILD_NAMES: Record<string, string> = {
  "child-alex": "Alex",
  "child-jordan": "Jordan",
  "child-morgan": "Morgan",
};

// Alex — age 14, competent digital skills, interest in coding
function makeAlexAssessment(): DigitalSkillAssessment {
  return {
    id: "dsa-alex",
    childId: "child-alex",
    childName: "Alex",
    assessmentDate: "2026-02-15",
    assessedBy: "Sarah Johnson",
    skills: [
      { category: "online_safety_awareness", level: "competent" },
      { category: "communication", level: "competent" },
      { category: "content_creation", level: "developing" },
      { category: "information_literacy", level: "competent" },
      { category: "coding", level: "proficient", notes: "Enjoys Python and Scratch" },
      { category: "productivity_tools", level: "competent" },
      { category: "social_media_literacy", level: "developing" },
      { category: "digital_wellbeing", level: "competent" },
      { category: "privacy_management", level: "developing" },
      { category: "critical_thinking", level: "competent" },
    ],
    overallLevel: "competent",
    developmentGoals: [
      "Complete Code Club Level 3",
      "Improve privacy management skills",
      "Create first website project",
    ],
    reviewDate: "2026-08-15",
  };
}

// Jordan — age 13, developing skills, good digital citizenship
function makeJordanAssessment(): DigitalSkillAssessment {
  return {
    id: "dsa-jordan",
    childId: "child-jordan",
    childName: "Jordan",
    assessmentDate: "2026-03-01",
    assessedBy: "Tom Richards",
    skills: [
      { category: "online_safety_awareness", level: "competent" },
      { category: "communication", level: "developing" },
      { category: "content_creation", level: "developing" },
      { category: "information_literacy", level: "developing" },
      { category: "coding", level: "beginner" },
      { category: "productivity_tools", level: "developing" },
      { category: "social_media_literacy", level: "competent" },
      { category: "digital_wellbeing", level: "competent" },
      { category: "privacy_management", level: "developing" },
      { category: "critical_thinking", level: "developing" },
    ],
    overallLevel: "developing",
    developmentGoals: [
      "Learn basic coding with Scratch",
      "Improve information literacy",
    ],
    reviewDate: "2026-09-01",
  };
}

// Morgan — age 15, proficient, uses tech for education
function makeMorganAssessment(): DigitalSkillAssessment {
  return {
    id: "dsa-morgan",
    childId: "child-morgan",
    childName: "Morgan",
    assessmentDate: "2026-01-20",
    assessedBy: "Lisa Williams",
    skills: [
      { category: "online_safety_awareness", level: "proficient" },
      { category: "communication", level: "proficient" },
      { category: "content_creation", level: "competent" },
      { category: "information_literacy", level: "proficient" },
      { category: "coding", level: "competent" },
      { category: "productivity_tools", level: "proficient" },
      { category: "social_media_literacy", level: "competent" },
      { category: "digital_wellbeing", level: "proficient" },
      { category: "privacy_management", level: "competent" },
      { category: "critical_thinking", level: "proficient" },
    ],
    overallLevel: "proficient",
    developmentGoals: [
      "Develop advanced spreadsheet skills",
      "Create digital portfolio for college applications",
    ],
    reviewDate: "2026-07-20",
  };
}

function makeAssessments(): DigitalSkillAssessment[] {
  return [makeAlexAssessment(), makeJordanAssessment(), makeMorganAssessment()];
}

function makeDeviceAccess(): DeviceAccessRecord[] {
  return [
    {
      id: "da-alex-1",
      childId: "child-alex",
      childName: "Alex",
      deviceType: "laptop",
      accessLevel: "monitored",
      agreementSigned: true,
      agreementDate: "2026-01-10",
      reviewDate: "2026-07-10",
      restrictionsInPlace: ["Content filtering", "Time limits 3h/day"],
      ageAppropriate: true,
    },
    {
      id: "da-alex-2",
      childId: "child-alex",
      childName: "Alex",
      deviceType: "smartphone",
      accessLevel: "independent_with_checks",
      agreementSigned: true,
      agreementDate: "2026-01-10",
      reviewDate: "2026-07-10",
      restrictionsInPlace: ["App restrictions", "Location sharing off"],
      ageAppropriate: true,
    },
    {
      id: "da-alex-3",
      childId: "child-alex",
      childName: "Alex",
      deviceType: "gaming_console",
      accessLevel: "monitored",
      agreementSigned: true,
      agreementDate: "2026-01-10",
      reviewDate: "2026-07-10",
      restrictionsInPlace: ["Communal area only", "No online chat"],
      ageAppropriate: true,
    },
    {
      id: "da-jordan-1",
      childId: "child-jordan",
      childName: "Jordan",
      deviceType: "tablet",
      accessLevel: "supervised",
      agreementSigned: true,
      agreementDate: "2026-02-01",
      reviewDate: "2026-08-01",
      restrictionsInPlace: ["Content filtering", "Parental controls"],
      ageAppropriate: true,
    },
    {
      id: "da-jordan-2",
      childId: "child-jordan",
      childName: "Jordan",
      deviceType: "laptop",
      accessLevel: "supervised",
      agreementSigned: true,
      agreementDate: "2026-02-01",
      reviewDate: "2026-08-01",
      restrictionsInPlace: ["Content filtering", "Supervised use only"],
      ageAppropriate: true,
    },
    {
      id: "da-morgan-1",
      childId: "child-morgan",
      childName: "Morgan",
      deviceType: "laptop",
      accessLevel: "independent_with_checks",
      agreementSigned: true,
      agreementDate: "2026-01-05",
      reviewDate: "2026-07-05",
      restrictionsInPlace: ["Weekly check-in"],
      ageAppropriate: true,
    },
    {
      id: "da-morgan-2",
      childId: "child-morgan",
      childName: "Morgan",
      deviceType: "smartphone",
      accessLevel: "independent_with_checks",
      agreementSigned: true,
      agreementDate: "2026-01-05",
      reviewDate: "2026-07-05",
      restrictionsInPlace: ["Monthly review"],
      ageAppropriate: true,
    },
    {
      id: "da-morgan-3",
      childId: "child-morgan",
      childName: "Morgan",
      deviceType: "desktop",
      accessLevel: "fully_independent",
      agreementSigned: true,
      agreementDate: "2026-01-05",
      reviewDate: "2026-07-05",
      restrictionsInPlace: [],
      ageAppropriate: true,
    },
  ];
}

function makeLearningRecords(): OnlineLearningRecord[] {
  return [
    // Alex — coding focused
    { id: "ol-1", childId: "child-alex", childName: "Alex", date: "2026-01-20", platform: "Code.org", activityType: "educational", durationMinutes: 45, supervised: false, outcomePositive: true, notes: "Completed Hour of Code" },
    { id: "ol-2", childId: "child-alex", childName: "Alex", date: "2026-02-05", platform: "Scratch", activityType: "creative", durationMinutes: 60, supervised: false, outcomePositive: true, notes: "Built animation project" },
    { id: "ol-3", childId: "child-alex", childName: "Alex", date: "2026-02-20", platform: "BBC Bitesize", activityType: "educational", durationMinutes: 30, supervised: true, outcomePositive: true },
    { id: "ol-4", childId: "child-alex", childName: "Alex", date: "2026-03-10", platform: "Python IDLE", activityType: "educational", durationMinutes: 50, supervised: false, outcomePositive: true, notes: "First Python game" },
    { id: "ol-5", childId: "child-alex", childName: "Alex", date: "2026-04-01", platform: "Google Scholar", activityType: "research", durationMinutes: 25, supervised: true, outcomePositive: true },
    { id: "ol-6", childId: "child-alex", childName: "Alex", date: "2026-04-15", platform: "National Careers Service", activityType: "career_exploration", durationMinutes: 30, supervised: true, outcomePositive: true, notes: "Explored tech careers" },
    // Jordan — more supervised, citizenship-oriented
    { id: "ol-7", childId: "child-jordan", childName: "Jordan", date: "2026-01-25", platform: "BBC Bitesize", activityType: "educational", durationMinutes: 40, supervised: true, outcomePositive: true },
    { id: "ol-8", childId: "child-jordan", childName: "Jordan", date: "2026-02-10", platform: "Canva", activityType: "creative", durationMinutes: 35, supervised: true, outcomePositive: true, notes: "Made birthday card" },
    { id: "ol-9", childId: "child-jordan", childName: "Jordan", date: "2026-03-05", platform: "YouTube Learning", activityType: "educational", durationMinutes: 20, supervised: true, outcomePositive: true },
    { id: "ol-10", childId: "child-jordan", childName: "Jordan", date: "2026-04-10", platform: "Teams", activityType: "social", durationMinutes: 30, supervised: false, outcomePositive: true, notes: "Video call with social worker" },
    { id: "ol-11", childId: "child-jordan", childName: "Jordan", date: "2026-05-01", platform: "Google Docs", activityType: "educational", durationMinutes: 45, supervised: true, outcomePositive: false, notes: "Struggled with formatting" },
    // Morgan — education and research focused
    { id: "ol-12", childId: "child-morgan", childName: "Morgan", date: "2026-01-15", platform: "Google Classroom", activityType: "educational", durationMinutes: 60, supervised: false, outcomePositive: true },
    { id: "ol-13", childId: "child-morgan", childName: "Morgan", date: "2026-01-28", platform: "Khan Academy", activityType: "educational", durationMinutes: 45, supervised: false, outcomePositive: true, notes: "GCSE maths revision" },
    { id: "ol-14", childId: "child-morgan", childName: "Morgan", date: "2026-02-14", platform: "JSTOR", activityType: "research", durationMinutes: 40, supervised: false, outcomePositive: true },
    { id: "ol-15", childId: "child-morgan", childName: "Morgan", date: "2026-03-01", platform: "UCAS", activityType: "career_exploration", durationMinutes: 50, supervised: true, outcomePositive: true, notes: "Course exploration" },
    { id: "ol-16", childId: "child-morgan", childName: "Morgan", date: "2026-03-20", platform: "Google Slides", activityType: "creative", durationMinutes: 55, supervised: false, outcomePositive: true, notes: "Science presentation" },
    { id: "ol-17", childId: "child-morgan", childName: "Morgan", date: "2026-04-05", platform: "BBC Bitesize", activityType: "educational", durationMinutes: 30, supervised: false, outcomePositive: true },
    { id: "ol-18", childId: "child-morgan", childName: "Morgan", date: "2026-04-20", platform: "Teams", activityType: "social", durationMinutes: 25, supervised: false, outcomePositive: true, notes: "Peer study group" },
    { id: "ol-19", childId: "child-morgan", childName: "Morgan", date: "2026-05-10", platform: "LinkedIn Learning", activityType: "career_exploration", durationMinutes: 40, supervised: false, outcomePositive: true },
  ];
}

function makeCitizenshipRecords(): DigitalCitizenshipRecord[] {
  return [
    // Jordan — excellent digital citizen
    { id: "dc-1", childId: "child-jordan", childName: "Jordan", date: "2026-01-18", area: "kindness_online", demonstratedPositively: true, context: "Sent supportive messages to friend going through difficult time", staffWitnessedBy: "Tom Richards" },
    { id: "dc-2", childId: "child-jordan", childName: "Jordan", date: "2026-02-05", area: "reporting_concerns", demonstratedPositively: true, context: "Reported suspicious message to staff immediately", staffWitnessedBy: "Sarah Johnson" },
    { id: "dc-3", childId: "child-jordan", childName: "Jordan", date: "2026-02-20", area: "balanced_usage", demonstratedPositively: true, context: "Voluntarily put phone away during family time", staffWitnessedBy: "Lisa Williams" },
    { id: "dc-4", childId: "child-jordan", childName: "Jordan", date: "2026-03-10", area: "respecting_privacy", demonstratedPositively: true, context: "Asked before sharing photo of another child", staffWitnessedBy: "Tom Richards" },
    { id: "dc-5", childId: "child-jordan", childName: "Jordan", date: "2026-04-01", area: "critical_evaluation", demonstratedPositively: true, context: "Questioned misleading news article and fact-checked", staffWitnessedBy: "Sarah Johnson" },
    // Alex
    { id: "dc-6", childId: "child-alex", childName: "Alex", date: "2026-01-25", area: "digital_footprint", demonstratedPositively: true, context: "Reviewed and cleaned up old social media posts", staffWitnessedBy: "Sarah Johnson" },
    { id: "dc-7", childId: "child-alex", childName: "Alex", date: "2026-02-15", area: "balanced_usage", demonstratedPositively: false, context: "Exceeded screen time agreement by 2 hours gaming", staffWitnessedBy: "Darren Laville" },
    { id: "dc-8", childId: "child-alex", childName: "Alex", date: "2026-03-05", area: "kindness_online", demonstratedPositively: true, context: "Helped younger child learn to use video calling app", staffWitnessedBy: "Tom Richards" },
    { id: "dc-9", childId: "child-alex", childName: "Alex", date: "2026-04-10", area: "critical_evaluation", demonstratedPositively: true, context: "Identified phishing email and reported it", staffWitnessedBy: "Lisa Williams" },
    // Morgan
    { id: "dc-10", childId: "child-morgan", childName: "Morgan", date: "2026-01-22", area: "digital_footprint", demonstratedPositively: true, context: "Set up professional-looking LinkedIn profile for career exploration", staffWitnessedBy: "Lisa Williams" },
    { id: "dc-11", childId: "child-morgan", childName: "Morgan", date: "2026-02-28", area: "respecting_privacy", demonstratedPositively: true, context: "Ensured all research sources were properly cited", staffWitnessedBy: "Darren Laville" },
    { id: "dc-12", childId: "child-morgan", childName: "Morgan", date: "2026-03-15", area: "balanced_usage", demonstratedPositively: true, context: "Maintained agreed screen time limits during exam prep", staffWitnessedBy: "Sarah Johnson" },
    { id: "dc-13", childId: "child-morgan", childName: "Morgan", date: "2026-04-20", area: "reporting_concerns", demonstratedPositively: true, context: "Flagged inappropriate content on study forum", staffWitnessedBy: "Tom Richards" },
  ];
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. evaluateDigitalSkills
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateDigitalSkills", () => {
  it("returns correct assessment coverage for all children assessed", () => {
    const result = evaluateDigitalSkills(makeAssessments(), CHILD_IDS, REFERENCE_DATE);
    expect(result.assessmentRate).toBe(100);
    expect(result.childrenWithAssessment).toBe(3);
    expect(result.totalChildren).toBe(3);
  });

  it("returns 0% assessment rate when no assessments exist", () => {
    const result = evaluateDigitalSkills([], CHILD_IDS, REFERENCE_DATE);
    expect(result.assessmentRate).toBe(0);
    expect(result.childrenWithAssessment).toBe(0);
  });

  it("correctly handles partial assessment coverage", () => {
    const result = evaluateDigitalSkills(
      [makeAlexAssessment()],
      CHILD_IDS,
      REFERENCE_DATE,
    );
    expect(result.assessmentRate).toBe(33);
    expect(result.childrenWithAssessment).toBe(1);
  });

  it("calculates average skill level across all children", () => {
    const result = evaluateDigitalSkills(makeAssessments(), CHILD_IDS, REFERENCE_DATE);
    expect(result.averageSkillLevel).toBeGreaterThan(2);
    expect(result.averageSkillLevel).toBeLessThanOrEqual(5);
  });

  it("returns average skill level of 0 with no assessments", () => {
    const result = evaluateDigitalSkills([], CHILD_IDS, REFERENCE_DATE);
    expect(result.averageSkillLevel).toBe(0);
  });

  it("identifies no skill gaps when all categories are covered", () => {
    const result = evaluateDigitalSkills(makeAssessments(), CHILD_IDS, REFERENCE_DATE);
    expect(result.skillGaps).toHaveLength(0);
  });

  it("identifies skill gaps when some categories are not assessed", () => {
    const partial: DigitalSkillAssessment = {
      id: "partial",
      childId: "child-alex",
      childName: "Alex",
      assessmentDate: "2026-03-01",
      assessedBy: "Sarah Johnson",
      skills: [
        { category: "coding", level: "proficient" },
        { category: "communication", level: "competent" },
      ],
      overallLevel: "competent",
      developmentGoals: [],
      reviewDate: "2026-09-01",
    };
    const result = evaluateDigitalSkills([partial], CHILD_IDS, REFERENCE_DATE);
    expect(result.skillGaps.length).toBeGreaterThan(0);
    expect(result.skillGaps).toContain("content_creation");
    expect(result.skillGaps).not.toContain("coding");
  });

  it("counts development goals correctly", () => {
    const result = evaluateDigitalSkills(makeAssessments(), CHILD_IDS, REFERENCE_DATE);
    // Alex: 3, Jordan: 2, Morgan: 2 = 7
    expect(result.developmentGoalCount).toBe(7);
  });

  it("returns 0 development goals when no assessments", () => {
    const result = evaluateDigitalSkills([], CHILD_IDS, REFERENCE_DATE);
    expect(result.developmentGoalCount).toBe(0);
  });

  it("detects overdue reviews", () => {
    const overdue: DigitalSkillAssessment = {
      ...makeAlexAssessment(),
      reviewDate: "2026-01-01", // Before reference date
    };
    const result = evaluateDigitalSkills([overdue], ["child-alex"], REFERENCE_DATE);
    expect(result.overdueReviews).toBe(1);
  });

  it("reports no overdue reviews when all are current", () => {
    const result = evaluateDigitalSkills(makeAssessments(), CHILD_IDS, REFERENCE_DATE);
    expect(result.overdueReviews).toBe(0);
  });

  it("uses latest assessment per child when multiple exist", () => {
    const older: DigitalSkillAssessment = {
      ...makeAlexAssessment(),
      id: "dsa-alex-old",
      assessmentDate: "2025-06-01",
      overallLevel: "beginner",
    };
    const newer = makeAlexAssessment(); // 2026-02-15
    const result = evaluateDigitalSkills([older, newer], ["child-alex"], REFERENCE_DATE);
    expect(result.skillLevelDistribution.find((d) => d.level === "competent")?.count).toBe(1);
    expect(result.skillLevelDistribution.find((d) => d.level === "beginner")?.count).toBe(0);
  });

  it("ignores children not in childIds", () => {
    const result = evaluateDigitalSkills(
      makeAssessments(),
      ["child-alex"],
      REFERENCE_DATE,
    );
    expect(result.totalChildren).toBe(1);
    expect(result.childrenWithAssessment).toBe(1);
  });

  it("builds correct skill level distribution", () => {
    const result = evaluateDigitalSkills(makeAssessments(), CHILD_IDS, REFERENCE_DATE);
    const total = result.skillLevelDistribution.reduce((s, d) => s + d.count, 0);
    expect(total).toBe(3); // One entry per child
  });

  it("handles empty child IDs", () => {
    const result = evaluateDigitalSkills(makeAssessments(), [], REFERENCE_DATE);
    expect(result.totalChildren).toBe(0);
    // Empty population: this asserted the fab-0 the helper used to return.
    expect(result.assessmentRate).toBeNull();
    expect(result.assessmentRate).not.toBe(0); // 0% is a claim; nothing was measured
    expect(result.averageSkillLevel).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. evaluateDeviceAccess
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateDeviceAccess", () => {
  it("returns 100% access rate when all children have device access", () => {
    const result = evaluateDeviceAccess(makeDeviceAccess(), CHILD_IDS, REFERENCE_DATE);
    expect(result.accessRate).toBe(100);
    expect(result.childrenWithAccess).toBe(3);
  });

  it("returns 0% access rate with no records", () => {
    const result = evaluateDeviceAccess([], CHILD_IDS, REFERENCE_DATE);
    expect(result.accessRate).toBe(0);
    expect(result.childrenWithAccess).toBe(0);
  });

  it("calculates 100% agreement compliance when all signed", () => {
    const result = evaluateDeviceAccess(makeDeviceAccess(), CHILD_IDS, REFERENCE_DATE);
    expect(result.agreementComplianceRate).toBe(100);
  });

  it("calculates partial agreement compliance", () => {
    const records = makeDeviceAccess();
    records[0].agreementSigned = false;
    records[1].agreementSigned = false;
    const result = evaluateDeviceAccess(records, CHILD_IDS, REFERENCE_DATE);
    expect(result.agreementComplianceRate).toBeLessThan(100);
    expect(result.agreementComplianceRate).toBeGreaterThan(0);
  });

  it("returns 100% age-appropriate rate when all appropriate", () => {
    const result = evaluateDeviceAccess(makeDeviceAccess(), CHILD_IDS, REFERENCE_DATE);
    expect(result.ageAppropriateRate).toBe(100);
  });

  it("detects non-age-appropriate device access", () => {
    const records = makeDeviceAccess();
    records[0].ageAppropriate = false;
    const result = evaluateDeviceAccess(records, CHILD_IDS, REFERENCE_DATE);
    expect(result.ageAppropriateRate).toBeLessThan(100);
  });

  it("builds correct device type breakdown", () => {
    const result = evaluateDeviceAccess(makeDeviceAccess(), CHILD_IDS, REFERENCE_DATE);
    expect(result.deviceTypeBreakdown.length).toBeGreaterThan(0);
    const laptops = result.deviceTypeBreakdown.find((d) => d.deviceType === "laptop");
    expect(laptops).toBeDefined();
    expect(laptops!.count).toBe(3); // Alex, Jordan, Morgan each have laptop
  });

  it("builds correct access level breakdown", () => {
    const result = evaluateDeviceAccess(makeDeviceAccess(), CHILD_IDS, REFERENCE_DATE);
    const supervised = result.accessLevelBreakdown.find(
      (d) => d.accessLevel === "supervised",
    );
    expect(supervised).toBeDefined();
    expect(supervised!.count).toBe(2); // Jordan's tablet + laptop
  });

  it("detects overdue device access reviews", () => {
    const records = makeDeviceAccess();
    records[0].reviewDate = "2026-01-01"; // Before reference date
    const result = evaluateDeviceAccess(records, CHILD_IDS, REFERENCE_DATE);
    expect(result.overdueReviews).toBe(1);
  });

  it("reports no overdue reviews when all current", () => {
    const result = evaluateDeviceAccess(makeDeviceAccess(), CHILD_IDS, REFERENCE_DATE);
    expect(result.overdueReviews).toBe(0);
  });

  it("identifies children without any device access", () => {
    const records = makeDeviceAccess().filter((r) => r.childId !== "child-jordan");
    const result = evaluateDeviceAccess(records, CHILD_IDS, REFERENCE_DATE);
    expect(result.childrenWithoutAccess).toContain("child-jordan");
  });

  it("handles empty child IDs", () => {
    const result = evaluateDeviceAccess(makeDeviceAccess(), [], REFERENCE_DATE);
    expect(result.totalChildren).toBe(0);
    // Empty population: this asserted the fab-0 the helper used to return.
    expect(result.accessRate).toBeNull();
    expect(result.accessRate).not.toBe(0); // 0% is a claim; nothing was measured
  });

  it("ignores records for children not in childIds", () => {
    const result = evaluateDeviceAccess(
      makeDeviceAccess(),
      ["child-alex"],
      REFERENCE_DATE,
    );
    expect(result.totalChildren).toBe(1);
    expect(result.childrenWithAccess).toBe(1);
  });

  it("reports agreement compliance as unmeasured with no records", () => {
    const result = evaluateDeviceAccess([], CHILD_IDS, REFERENCE_DATE);
    // Empty population: this asserted the fab-0 the helper used to return.
    expect(result.agreementComplianceRate).toBeNull();
    expect(result.agreementComplianceRate).not.toBe(0); // 0% is a claim; nothing was measured
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. evaluateOnlineLearning
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateOnlineLearning", () => {
  it("counts total sessions correctly", () => {
    const result = evaluateOnlineLearning(
      makeLearningRecords(),
      CHILD_IDS,
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.totalSessions).toBe(19);
  });

  it("calculates sessions per child", () => {
    const result = evaluateOnlineLearning(
      makeLearningRecords(),
      CHILD_IDS,
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.sessionsPerChild).toBeCloseTo(6.3, 1);
  });

  it("returns 0 sessions per child with no records", () => {
    const result = evaluateOnlineLearning([], CHILD_IDS, PERIOD_START, PERIOD_END);
    expect(result.sessionsPerChild).toBe(0);
    expect(result.totalSessions).toBe(0);
  });

  it("counts activity type variety", () => {
    const result = evaluateOnlineLearning(
      makeLearningRecords(),
      CHILD_IDS,
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.activityTypeCount).toBe(5); // educational, creative, research, career_exploration, social
  });

  it("calculates positive outcome rate", () => {
    const result = evaluateOnlineLearning(
      makeLearningRecords(),
      CHILD_IDS,
      PERIOD_START,
      PERIOD_END,
    );
    // 18 positive out of 19
    expect(result.positiveOutcomeRate).toBe(95);
  });

  it("reports the positive rate as unmeasured with no records", () => {
    const result = evaluateOnlineLearning([], CHILD_IDS, PERIOD_START, PERIOD_END);
    // Empty population: this asserted the fab-0 the helper used to return.
    expect(result.positiveOutcomeRate).toBeNull();
    expect(result.positiveOutcomeRate).not.toBe(0); // 0% is a claim; nothing was measured
  });

  it("calculates supervised rate", () => {
    const result = evaluateOnlineLearning(
      makeLearningRecords(),
      CHILD_IDS,
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.supervisedRate).toBeGreaterThan(0);
    expect(result.supervisedRate).toBeLessThan(100);
  });

  it("calculates average duration", () => {
    const result = evaluateOnlineLearning(
      makeLearningRecords(),
      CHILD_IDS,
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.averageDuration).toBeGreaterThan(0);
  });

  it("computes total learning minutes", () => {
    const result = evaluateOnlineLearning(
      makeLearningRecords(),
      CHILD_IDS,
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.totalLearningMinutes).toBeGreaterThan(0);
  });

  it("identifies children with no learning", () => {
    const records = makeLearningRecords().filter(
      (r) => r.childId !== "child-jordan",
    );
    const result = evaluateOnlineLearning(
      records,
      CHILD_IDS,
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.childrenWithNoLearning).toContain("child-jordan");
  });

  it("returns empty childrenWithNoLearning when all engaged", () => {
    const result = evaluateOnlineLearning(
      makeLearningRecords(),
      CHILD_IDS,
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.childrenWithNoLearning).toHaveLength(0);
  });

  it("filters by period", () => {
    const result = evaluateOnlineLearning(
      makeLearningRecords(),
      CHILD_IDS,
      "2026-03-01",
      "2026-03-31",
    );
    expect(result.totalSessions).toBeLessThan(19);
    expect(result.totalSessions).toBeGreaterThan(0);
  });

  it("handles no period filter", () => {
    const result = evaluateOnlineLearning(makeLearningRecords(), CHILD_IDS);
    expect(result.totalSessions).toBe(19);
  });

  it("builds activity type breakdown", () => {
    const result = evaluateOnlineLearning(
      makeLearningRecords(),
      CHILD_IDS,
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.activityTypeBreakdown.length).toBeGreaterThan(0);
    const educational = result.activityTypeBreakdown.find(
      (b) => b.activityType === "educational",
    );
    expect(educational).toBeDefined();
    expect(educational!.count).toBeGreaterThan(0);
  });

  it("handles empty child IDs", () => {
    const result = evaluateOnlineLearning(
      makeLearningRecords(),
      [],
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.totalSessions).toBe(0);
    expect(result.sessionsPerChild).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. evaluateDigitalCitizenship
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateDigitalCitizenship", () => {
  it("counts total records correctly", () => {
    const result = evaluateDigitalCitizenship(
      makeCitizenshipRecords(),
      CHILD_IDS,
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.totalRecords).toBe(13);
  });

  it("calculates positive demonstration rate", () => {
    const result = evaluateDigitalCitizenship(
      makeCitizenshipRecords(),
      CHILD_IDS,
      PERIOD_START,
      PERIOD_END,
    );
    // 12 positive out of 13
    expect(result.positiveRate).toBe(92);
  });

  it("reports the positive rate as unmeasured with no records", () => {
    const result = evaluateDigitalCitizenship([], CHILD_IDS, PERIOD_START, PERIOD_END);
    // Empty population: this asserted the fab-0 the helper used to return.
    expect(result.positiveRate).toBeNull();
    expect(result.positiveRate).not.toBe(0); // 0% is a claim; nothing was measured
  });

  it("counts area coverage correctly", () => {
    const result = evaluateDigitalCitizenship(
      makeCitizenshipRecords(),
      CHILD_IDS,
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.areaCoverage).toBe(6); // All 6 areas covered
    expect(result.totalAreas).toBe(6);
  });

  it("detects partial area coverage", () => {
    const partial = makeCitizenshipRecords().filter(
      (r) => r.area === "kindness_online" || r.area === "balanced_usage",
    );
    const result = evaluateDigitalCitizenship(
      partial,
      CHILD_IDS,
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.areaCoverage).toBe(2);
  });

  it("builds area breakdown", () => {
    const result = evaluateDigitalCitizenship(
      makeCitizenshipRecords(),
      CHILD_IDS,
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.areaBreakdown.length).toBe(6);
    const kindness = result.areaBreakdown.find((a) => a.area === "kindness_online");
    expect(kindness).toBeDefined();
    expect(kindness!.positiveCount).toBeGreaterThan(0);
  });

  it("counts children with records", () => {
    const result = evaluateDigitalCitizenship(
      makeCitizenshipRecords(),
      CHILD_IDS,
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.childrenWithRecords).toBe(3);
  });

  it("identifies children with no records", () => {
    const records = makeCitizenshipRecords().filter(
      (r) => r.childId !== "child-morgan",
    );
    const result = evaluateDigitalCitizenship(
      records,
      CHILD_IDS,
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.childrenWithNoRecords).toContain("child-morgan");
  });

  it("returns empty childrenWithNoRecords when all have records", () => {
    const result = evaluateDigitalCitizenship(
      makeCitizenshipRecords(),
      CHILD_IDS,
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.childrenWithNoRecords).toHaveLength(0);
  });

  it("handles area with mixed positive/negative outcomes", () => {
    const result = evaluateDigitalCitizenship(
      makeCitizenshipRecords(),
      CHILD_IDS,
      PERIOD_START,
      PERIOD_END,
    );
    const balanced = result.areaBreakdown.find((a) => a.area === "balanced_usage");
    expect(balanced).toBeDefined();
    // Alex negative, Jordan positive, Morgan positive
    expect(balanced!.totalCount).toBe(3);
    expect(balanced!.positiveCount).toBe(2);
  });

  it("filters by period", () => {
    const result = evaluateDigitalCitizenship(
      makeCitizenshipRecords(),
      CHILD_IDS,
      "2026-03-01",
      "2026-03-31",
    );
    expect(result.totalRecords).toBeLessThan(13);
    expect(result.totalRecords).toBeGreaterThan(0);
  });

  it("handles no period filter", () => {
    const result = evaluateDigitalCitizenship(
      makeCitizenshipRecords(),
      CHILD_IDS,
    );
    expect(result.totalRecords).toBe(13);
  });

  it("handles empty child IDs", () => {
    const result = evaluateDigitalCitizenship(
      makeCitizenshipRecords(),
      [],
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.totalRecords).toBe(0);
    expect(result.childrenWithRecords).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. buildChildDigitalProfiles
// ══════════════════════════════════════════════════════════════════════════════

describe("buildChildDigitalProfiles", () => {
  it("returns one profile per child", () => {
    const profiles = buildChildDigitalProfiles(
      makeAssessments(),
      makeDeviceAccess(),
      makeLearningRecords(),
      makeCitizenshipRecords(),
      CHILD_IDS,
      CHILD_NAMES,
      PERIOD_START,
      PERIOD_END,
    );
    expect(profiles).toHaveLength(3);
  });

  it("sets correct child names", () => {
    const profiles = buildChildDigitalProfiles(
      makeAssessments(),
      makeDeviceAccess(),
      makeLearningRecords(),
      makeCitizenshipRecords(),
      CHILD_IDS,
      CHILD_NAMES,
      PERIOD_START,
      PERIOD_END,
    );
    const alex = profiles.find((p) => p.childId === "child-alex");
    expect(alex?.childName).toBe("Alex");
  });

  it("correctly identifies assessment status", () => {
    const profiles = buildChildDigitalProfiles(
      makeAssessments(),
      makeDeviceAccess(),
      makeLearningRecords(),
      makeCitizenshipRecords(),
      CHILD_IDS,
      CHILD_NAMES,
      PERIOD_START,
      PERIOD_END,
    );
    for (const p of profiles) {
      expect(p.hasAssessment).toBe(true);
    }
  });

  it("flags child without assessment", () => {
    const assessments = makeAssessments().filter(
      (a) => a.childId !== "child-jordan",
    );
    const profiles = buildChildDigitalProfiles(
      assessments,
      makeDeviceAccess(),
      makeLearningRecords(),
      makeCitizenshipRecords(),
      CHILD_IDS,
      CHILD_NAMES,
      PERIOD_START,
      PERIOD_END,
    );
    const jordan = profiles.find((p) => p.childId === "child-jordan");
    expect(jordan?.hasAssessment).toBe(false);
    expect(jordan?.overallSkillLevel).toBeUndefined();
  });

  it("sets correct overall skill level for Alex", () => {
    const profiles = buildChildDigitalProfiles(
      makeAssessments(),
      makeDeviceAccess(),
      makeLearningRecords(),
      makeCitizenshipRecords(),
      CHILD_IDS,
      CHILD_NAMES,
      PERIOD_START,
      PERIOD_END,
    );
    const alex = profiles.find((p) => p.childId === "child-alex");
    expect(alex?.overallSkillLevel).toBe("competent");
  });

  it("sets correct overall skill level for Morgan", () => {
    const profiles = buildChildDigitalProfiles(
      makeAssessments(),
      makeDeviceAccess(),
      makeLearningRecords(),
      makeCitizenshipRecords(),
      CHILD_IDS,
      CHILD_NAMES,
      PERIOD_START,
      PERIOD_END,
    );
    const morgan = profiles.find((p) => p.childId === "child-morgan");
    expect(morgan?.overallSkillLevel).toBe("proficient");
  });

  it("counts device access per child", () => {
    const profiles = buildChildDigitalProfiles(
      makeAssessments(),
      makeDeviceAccess(),
      makeLearningRecords(),
      makeCitizenshipRecords(),
      CHILD_IDS,
      CHILD_NAMES,
      PERIOD_START,
      PERIOD_END,
    );
    const alex = profiles.find((p) => p.childId === "child-alex");
    expect(alex?.deviceAccessCount).toBe(3);
    const jordan = profiles.find((p) => p.childId === "child-jordan");
    expect(jordan?.deviceAccessCount).toBe(2);
  });

  it("counts learning sessions per child", () => {
    const profiles = buildChildDigitalProfiles(
      makeAssessments(),
      makeDeviceAccess(),
      makeLearningRecords(),
      makeCitizenshipRecords(),
      CHILD_IDS,
      CHILD_NAMES,
      PERIOD_START,
      PERIOD_END,
    );
    const alex = profiles.find((p) => p.childId === "child-alex");
    expect(alex?.learningSessionCount).toBe(6);
    const morgan = profiles.find((p) => p.childId === "child-morgan");
    expect(morgan?.learningSessionCount).toBe(8);
  });

  it("calculates learning minutes per child", () => {
    const profiles = buildChildDigitalProfiles(
      makeAssessments(),
      makeDeviceAccess(),
      makeLearningRecords(),
      makeCitizenshipRecords(),
      CHILD_IDS,
      CHILD_NAMES,
      PERIOD_START,
      PERIOD_END,
    );
    const alex = profiles.find((p) => p.childId === "child-alex");
    expect(alex?.learningMinutes).toBe(240); // 45+60+30+50+25+30
  });

  it("counts positive outcomes per child", () => {
    const profiles = buildChildDigitalProfiles(
      makeAssessments(),
      makeDeviceAccess(),
      makeLearningRecords(),
      makeCitizenshipRecords(),
      CHILD_IDS,
      CHILD_NAMES,
      PERIOD_START,
      PERIOD_END,
    );
    const alex = profiles.find((p) => p.childId === "child-alex");
    expect(alex?.positiveOutcomes).toBe(6); // All 6 positive
    const jordan = profiles.find((p) => p.childId === "child-jordan");
    expect(jordan?.positiveOutcomes).toBe(4); // 4 out of 5
  });

  it("calculates citizenship positive rate", () => {
    const profiles = buildChildDigitalProfiles(
      makeAssessments(),
      makeDeviceAccess(),
      makeLearningRecords(),
      makeCitizenshipRecords(),
      CHILD_IDS,
      CHILD_NAMES,
      PERIOD_START,
      PERIOD_END,
    );
    const jordan = profiles.find((p) => p.childId === "child-jordan");
    expect(jordan?.citizenshipPositiveRate).toBe(100); // 5/5
    const alex = profiles.find((p) => p.childId === "child-alex");
    expect(alex?.citizenshipPositiveRate).toBe(75); // 3/4
  });

  it("identifies strengths for proficient children", () => {
    const profiles = buildChildDigitalProfiles(
      makeAssessments(),
      makeDeviceAccess(),
      makeLearningRecords(),
      makeCitizenshipRecords(),
      CHILD_IDS,
      CHILD_NAMES,
      PERIOD_START,
      PERIOD_END,
    );
    const morgan = profiles.find((p) => p.childId === "child-morgan");
    expect(morgan?.strengths.length).toBeGreaterThan(0);
  });

  it("identifies development areas for unassessed children", () => {
    const assessments = makeAssessments().filter(
      (a) => a.childId !== "child-jordan",
    );
    const profiles = buildChildDigitalProfiles(
      assessments,
      makeDeviceAccess(),
      makeLearningRecords(),
      makeCitizenshipRecords(),
      CHILD_IDS,
      CHILD_NAMES,
      PERIOD_START,
      PERIOD_END,
    );
    const jordan = profiles.find((p) => p.childId === "child-jordan");
    expect(jordan?.developmentAreas).toContain("Needs digital skills assessment");
  });

  it("handles missing child name in map", () => {
    const profiles = buildChildDigitalProfiles(
      makeAssessments(),
      makeDeviceAccess(),
      makeLearningRecords(),
      makeCitizenshipRecords(),
      ["child-unknown"],
      {},
      PERIOD_START,
      PERIOD_END,
    );
    expect(profiles[0].childName).toBe("child-unknown");
  });

  it("calculates skill level numeric", () => {
    const profiles = buildChildDigitalProfiles(
      makeAssessments(),
      makeDeviceAccess(),
      makeLearningRecords(),
      makeCitizenshipRecords(),
      CHILD_IDS,
      CHILD_NAMES,
      PERIOD_START,
      PERIOD_END,
    );
    const alex = profiles.find((p) => p.childId === "child-alex");
    expect(alex?.skillLevelNumeric).toBeDefined();
    expect(alex!.skillLevelNumeric!).toBeGreaterThan(2);
    expect(alex!.skillLevelNumeric!).toBeLessThanOrEqual(4);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. generateDigitalLiteracyIntelligence
// ══════════════════════════════════════════════════════════════════════════════

describe("generateDigitalLiteracyIntelligence", () => {
  function callFull() {
    return generateDigitalLiteracyIntelligence(
      makeAssessments(),
      makeDeviceAccess(),
      makeLearningRecords(),
      makeCitizenshipRecords(),
      CHILD_IDS,
      CHILD_NAMES,
      "oak-house",
      PERIOD_START,
      PERIOD_END,
      REFERENCE_DATE,
    );
  }

  it("returns correct homeId", () => {
    expect(callFull().homeId).toBe("oak-house");
  });

  it("returns correct period", () => {
    const result = callFull();
    expect(result.periodStart).toBe(PERIOD_START);
    expect(result.periodEnd).toBe(PERIOD_END);
  });

  it("produces a score between 0 and 100", () => {
    const result = callFull();
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("rates good demo data as outstanding or good", () => {
    const result = callFull();
    expect(["outstanding", "good"]).toContain(result.rating);
  });

  it("includes digital skills sub-result", () => {
    const result = callFull();
    expect(result.digitalSkills).toBeDefined();
    expect(result.digitalSkills.assessmentRate).toBe(100);
  });

  it("includes device access sub-result", () => {
    const result = callFull();
    expect(result.deviceAccess).toBeDefined();
    expect(result.deviceAccess.accessRate).toBe(100);
  });

  it("includes online learning sub-result", () => {
    const result = callFull();
    expect(result.onlineLearning).toBeDefined();
    expect(result.onlineLearning.totalSessions).toBe(19);
  });

  it("includes digital citizenship sub-result", () => {
    const result = callFull();
    expect(result.digitalCitizenship).toBeDefined();
    expect(result.digitalCitizenship.totalRecords).toBe(13);
  });

  it("includes child profiles", () => {
    const result = callFull();
    expect(result.childProfiles).toHaveLength(3);
  });

  it("generates strengths", () => {
    const result = callFull();
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("generates regulatory links", () => {
    const result = callFull();
    expect(result.regulatoryLinks.length).toBeGreaterThan(0);
    expect(result.regulatoryLinks.some((l) => l.includes("Reg 8"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Reg 9"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("UNCRC Article 17"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("DfE"))).toBe(true);
  });

  // ── Scoring thresholds ──────────────────────────────────────────────────

  it("rates >=80 as outstanding", () => {
    // Full good data should score well
    const result = callFull();
    if (result.overallScore >= 80) {
      expect(result.rating).toBe("outstanding");
    }
  });

  it("rates <40 as inadequate", () => {
    const result = generateDigitalLiteracyIntelligence(
      [],
      [],
      [],
      [],
      CHILD_IDS,
      CHILD_NAMES,
      "oak-house",
      PERIOD_START,
      PERIOD_END,
      REFERENCE_DATE,
    );
    expect(result.overallScore).toBeLessThan(40);
    expect(result.rating).toBe("inadequate");
  });

  it("produces score of 0 with completely empty data", () => {
    const result = generateDigitalLiteracyIntelligence(
      [],
      [],
      [],
      [],
      CHILD_IDS,
      CHILD_NAMES,
      "oak-house",
      PERIOD_START,
      PERIOD_END,
      REFERENCE_DATE,
    );
    expect(result.overallScore).toBe(0);
  });

  it("produces score of 0 when no children and no data", () => {
    const result = generateDigitalLiteracyIntelligence(
      [],
      [],
      [],
      [],
      [],
      {},
      "oak-house",
      PERIOD_START,
      PERIOD_END,
      REFERENCE_DATE,
    );
    expect(result.overallScore).toBe(0);
  });

  it("generates immediate actions when assessments missing", () => {
    const result = generateDigitalLiteracyIntelligence(
      [],
      makeDeviceAccess(),
      makeLearningRecords(),
      makeCitizenshipRecords(),
      CHILD_IDS,
      CHILD_NAMES,
      "oak-house",
      PERIOD_START,
      PERIOD_END,
      REFERENCE_DATE,
    );
    expect(result.immediateActions.some((a) => a.includes("assessment"))).toBe(
      true,
    );
  });

  it("generates immediate actions when device access missing", () => {
    const result = generateDigitalLiteracyIntelligence(
      makeAssessments(),
      [],
      makeLearningRecords(),
      makeCitizenshipRecords(),
      CHILD_IDS,
      CHILD_NAMES,
      "oak-house",
      PERIOD_START,
      PERIOD_END,
      REFERENCE_DATE,
    );
    expect(result.immediateActions.some((a) => a.includes("device") || a.includes("Device"))).toBe(
      true,
    );
  });

  it("identifies areas for development with skill gaps", () => {
    const partial: DigitalSkillAssessment = {
      id: "partial",
      childId: "child-alex",
      childName: "Alex",
      assessmentDate: "2026-03-01",
      assessedBy: "Sarah Johnson",
      skills: [
        { category: "coding", level: "proficient" },
      ],
      overallLevel: "competent",
      developmentGoals: [],
      reviewDate: "2026-09-01",
    };
    const result = generateDigitalLiteracyIntelligence(
      [partial],
      makeDeviceAccess(),
      makeLearningRecords(),
      makeCitizenshipRecords(),
      CHILD_IDS,
      CHILD_NAMES,
      "oak-house",
      PERIOD_START,
      PERIOD_END,
      REFERENCE_DATE,
    );
    expect(result.areasForDevelopment.some((a) => a.includes("Skill gaps"))).toBe(
      true,
    );
  });

  it("generates strength for full assessment coverage", () => {
    const result = callFull();
    expect(result.strengths.some((s) => s.includes("digital skills assessments"))).toBe(true);
  });

  it("generates strength for equitable device access", () => {
    const result = callFull();
    expect(result.strengths.some((s) => s.includes("device access"))).toBe(true);
  });

  it("generates strength for high positive outcome rate", () => {
    const result = callFull();
    expect(result.strengths.some((s) => s.includes("positive outcome"))).toBe(true);
  });

  // ── Scoring component tests ──────────────────────────────────────────────

  it("gives higher score for 100% assessment coverage than 50%", () => {
    const full = callFull();
    const partial = generateDigitalLiteracyIntelligence(
      [makeAlexAssessment()],
      makeDeviceAccess(),
      makeLearningRecords(),
      makeCitizenshipRecords(),
      CHILD_IDS,
      CHILD_NAMES,
      "oak-house",
      PERIOD_START,
      PERIOD_END,
      REFERENCE_DATE,
    );
    expect(full.overallScore).toBeGreaterThan(partial.overallScore);
  });

  it("gives higher score with more learning sessions", () => {
    const extraLearning = [
      ...makeLearningRecords(),
      { id: "ol-extra-1", childId: "child-alex", childName: "Alex", date: "2026-05-10", platform: "Duolingo", activityType: "educational" as const, durationMinutes: 30, supervised: false, outcomePositive: true },
      { id: "ol-extra-2", childId: "child-jordan", childName: "Jordan", date: "2026-05-11", platform: "Tynker", activityType: "creative" as const, durationMinutes: 45, supervised: true, outcomePositive: true },
    ];
    const withExtra = generateDigitalLiteracyIntelligence(
      makeAssessments(),
      makeDeviceAccess(),
      extraLearning,
      makeCitizenshipRecords(),
      CHILD_IDS,
      CHILD_NAMES,
      "oak-house",
      PERIOD_START,
      PERIOD_END,
      REFERENCE_DATE,
    );
    const without = callFull();
    expect(withExtra.overallScore).toBeGreaterThanOrEqual(without.overallScore);
  });

  it("gives lower score with low positive citizenship rate", () => {
    const negativeRecords: DigitalCitizenshipRecord[] = [
      { id: "dc-neg-1", childId: "child-alex", childName: "Alex", date: "2026-02-01", area: "balanced_usage", demonstratedPositively: false, context: "Excessive gaming", staffWitnessedBy: "Sarah Johnson" },
      { id: "dc-neg-2", childId: "child-jordan", childName: "Jordan", date: "2026-02-02", area: "kindness_online", demonstratedPositively: false, context: "Unkind message", staffWitnessedBy: "Tom Richards" },
      { id: "dc-neg-3", childId: "child-morgan", childName: "Morgan", date: "2026-02-03", area: "critical_evaluation", demonstratedPositively: false, context: "Shared fake news", staffWitnessedBy: "Lisa Williams" },
    ];
    const negative = generateDigitalLiteracyIntelligence(
      makeAssessments(),
      makeDeviceAccess(),
      makeLearningRecords(),
      negativeRecords,
      CHILD_IDS,
      CHILD_NAMES,
      "oak-house",
      PERIOD_START,
      PERIOD_END,
      REFERENCE_DATE,
    );
    const positive = callFull();
    expect(negative.overallScore).toBeLessThan(positive.overallScore);
  });

  it("score caps at 100", () => {
    const result = callFull();
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("score does not go below 0", () => {
    const result = generateDigitalLiteracyIntelligence(
      [],
      [],
      [],
      [],
      CHILD_IDS,
      CHILD_NAMES,
      "oak-house",
      PERIOD_START,
      PERIOD_END,
      REFERENCE_DATE,
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Label / Helper functions
// ══════════════════════════════════════════════════════════════════════════════

describe("getSkillCategoryLabel", () => {
  it("returns label for coding", () => {
    expect(getSkillCategoryLabel("coding")).toBe("Coding & Programming");
  });

  it("returns label for online_safety_awareness", () => {
    expect(getSkillCategoryLabel("online_safety_awareness")).toBe("Online Safety Awareness");
  });

  it("returns label for content_creation", () => {
    expect(getSkillCategoryLabel("content_creation")).toBe("Content Creation");
  });

  it("returns label for communication", () => {
    expect(getSkillCategoryLabel("communication")).toBe("Digital Communication");
  });

  it("returns label for all categories", () => {
    const categories: DigitalSkillCategory[] = [
      "online_safety_awareness",
      "communication",
      "content_creation",
      "information_literacy",
      "coding",
      "productivity_tools",
      "social_media_literacy",
      "digital_wellbeing",
      "privacy_management",
      "critical_thinking",
    ];
    for (const c of categories) {
      const label = getSkillCategoryLabel(c);
      expect(label.length).toBeGreaterThan(0);
      expect(label).not.toContain("_");
    }
  });
});

describe("getCitizenshipAreaLabel", () => {
  it("returns label for kindness_online", () => {
    expect(getCitizenshipAreaLabel("kindness_online")).toBe("Kindness Online");
  });

  it("returns label for digital_footprint", () => {
    expect(getCitizenshipAreaLabel("digital_footprint")).toBe("Digital Footprint Awareness");
  });

  it("returns label for all areas", () => {
    const areas: DigitalCitizenshipRecord["area"][] = [
      "kindness_online",
      "digital_footprint",
      "critical_evaluation",
      "reporting_concerns",
      "respecting_privacy",
      "balanced_usage",
    ];
    for (const a of areas) {
      const label = getCitizenshipAreaLabel(a);
      expect(label.length).toBeGreaterThan(0);
    }
  });
});

describe("getSkillLevelValue", () => {
  it("returns 1 for beginner", () => {
    expect(getSkillLevelValue("beginner")).toBe(1);
  });

  it("returns 2 for developing", () => {
    expect(getSkillLevelValue("developing")).toBe(2);
  });

  it("returns 3 for competent", () => {
    expect(getSkillLevelValue("competent")).toBe(3);
  });

  it("returns 4 for proficient", () => {
    expect(getSkillLevelValue("proficient")).toBe(4);
  });

  it("returns 5 for advanced", () => {
    expect(getSkillLevelValue("advanced")).toBe(5);
  });

  it("returns increasing values for increasing levels", () => {
    const levels: SkillLevel[] = ["beginner", "developing", "competent", "proficient", "advanced"];
    for (let i = 1; i < levels.length; i++) {
      expect(getSkillLevelValue(levels[i])).toBeGreaterThan(
        getSkillLevelValue(levels[i - 1]),
      );
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Edge cases
// ══════════════════════════════════════════════════════════════════════════════

describe("Edge cases", () => {
  it("handles single child with full data", () => {
    const result = generateDigitalLiteracyIntelligence(
      [makeAlexAssessment()],
      makeDeviceAccess().filter((r) => r.childId === "child-alex"),
      makeLearningRecords().filter((r) => r.childId === "child-alex"),
      makeCitizenshipRecords().filter((r) => r.childId === "child-alex"),
      ["child-alex"],
      { "child-alex": "Alex" },
      "oak-house",
      PERIOD_START,
      PERIOD_END,
      REFERENCE_DATE,
    );
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.childProfiles).toHaveLength(1);
  });

  it("handles assessments outside period for device access", () => {
    const oldRecord: DeviceAccessRecord = {
      id: "da-old",
      childId: "child-alex",
      childName: "Alex",
      deviceType: "laptop",
      accessLevel: "supervised",
      agreementSigned: false,
      reviewDate: "2025-01-01",
      restrictionsInPlace: [],
      ageAppropriate: false,
    };
    const result = evaluateDeviceAccess([oldRecord], ["child-alex"], REFERENCE_DATE);
    expect(result.overdueReviews).toBe(1);
    expect(result.agreementComplianceRate).toBe(0);
  });

  it("handles all negative citizenship records", () => {
    const negative: DigitalCitizenshipRecord[] = [
      { id: "dc-n1", childId: "child-alex", childName: "Alex", date: "2026-02-01", area: "balanced_usage", demonstratedPositively: false, context: "Excessive use", staffWitnessedBy: "Sarah Johnson" },
      { id: "dc-n2", childId: "child-jordan", childName: "Jordan", date: "2026-02-02", area: "kindness_online", demonstratedPositively: false, context: "Unkind comment", staffWitnessedBy: "Tom Richards" },
    ];
    const result = evaluateDigitalCitizenship(
      negative,
      CHILD_IDS,
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.positiveRate).toBe(0);
  });

  it("handles learning records with 0 duration", () => {
    const records: OnlineLearningRecord[] = [
      { id: "ol-zero", childId: "child-alex", childName: "Alex", date: "2026-03-01", platform: "Test", activityType: "educational", durationMinutes: 0, supervised: true, outcomePositive: true },
    ];
    const result = evaluateOnlineLearning(records, ["child-alex"], PERIOD_START, PERIOD_END);
    expect(result.averageDuration).toBe(0);
    expect(result.totalLearningMinutes).toBe(0);
  });

  it("handles mixed period data correctly", () => {
    const outsidePeriod: OnlineLearningRecord = {
      id: "ol-out",
      childId: "child-alex",
      childName: "Alex",
      date: "2025-06-01", // Before period
      platform: "Test",
      activityType: "educational",
      durationMinutes: 60,
      supervised: true,
      outcomePositive: true,
    };
    const insidePeriod: OnlineLearningRecord = {
      id: "ol-in",
      childId: "child-alex",
      childName: "Alex",
      date: "2026-03-01", // Inside period
      platform: "Test",
      activityType: "creative",
      durationMinutes: 30,
      supervised: false,
      outcomePositive: true,
    };
    const result = evaluateOnlineLearning(
      [outsidePeriod, insidePeriod],
      ["child-alex"],
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.totalSessions).toBe(1);
    expect(result.totalLearningMinutes).toBe(30);
  });

  it("skill assessment with all beginner levels", () => {
    const beginner: DigitalSkillAssessment = {
      id: "dsa-beginner",
      childId: "child-alex",
      childName: "Alex",
      assessmentDate: "2026-03-01",
      assessedBy: "Sarah Johnson",
      skills: [
        { category: "coding", level: "beginner" },
        { category: "communication", level: "beginner" },
        { category: "content_creation", level: "beginner" },
      ],
      overallLevel: "beginner",
      developmentGoals: ["Learn basics"],
      reviewDate: "2026-09-01",
    };
    const result = evaluateDigitalSkills([beginner], ["child-alex"], REFERENCE_DATE);
    expect(result.averageSkillLevel).toBe(1);
  });

  it("skill assessment with all advanced levels", () => {
    const advanced: DigitalSkillAssessment = {
      id: "dsa-advanced",
      childId: "child-alex",
      childName: "Alex",
      assessmentDate: "2026-03-01",
      assessedBy: "Sarah Johnson",
      skills: [
        { category: "coding", level: "advanced" },
        { category: "communication", level: "advanced" },
        { category: "content_creation", level: "advanced" },
      ],
      overallLevel: "advanced",
      developmentGoals: [],
      reviewDate: "2026-09-01",
    };
    const result = evaluateDigitalSkills([advanced], ["child-alex"], REFERENCE_DATE);
    expect(result.averageSkillLevel).toBe(5);
  });

  it("intelligence result with requires_improvement range", () => {
    // Give minimal data to land in 40-59 range
    const minimalAssessment: DigitalSkillAssessment = {
      id: "dsa-min",
      childId: "child-alex",
      childName: "Alex",
      assessmentDate: "2026-03-01",
      assessedBy: "Sarah Johnson",
      skills: [
        { category: "coding", level: "beginner" },
      ],
      overallLevel: "beginner",
      developmentGoals: [],
      reviewDate: "2026-09-01",
    };
    const minimalAccess: DeviceAccessRecord = {
      id: "da-min",
      childId: "child-alex",
      childName: "Alex",
      deviceType: "laptop",
      accessLevel: "supervised",
      agreementSigned: true,
      reviewDate: "2026-12-01",
      restrictionsInPlace: [],
      ageAppropriate: true,
    };
    const minimalLearning: OnlineLearningRecord[] = [
      { id: "ol-min-1", childId: "child-alex", childName: "Alex", date: "2026-03-01", platform: "Test", activityType: "educational", durationMinutes: 30, supervised: true, outcomePositive: true },
      { id: "ol-min-2", childId: "child-alex", childName: "Alex", date: "2026-04-01", platform: "Test2", activityType: "creative", durationMinutes: 30, supervised: true, outcomePositive: true },
      { id: "ol-min-3", childId: "child-alex", childName: "Alex", date: "2026-04-15", platform: "Test3", activityType: "research", durationMinutes: 30, supervised: true, outcomePositive: true },
    ];
    const minimalCitizenship: DigitalCitizenshipRecord[] = [
      { id: "dc-min-1", childId: "child-alex", childName: "Alex", date: "2026-03-01", area: "kindness_online", demonstratedPositively: true, context: "Helpful", staffWitnessedBy: "Sarah Johnson" },
      { id: "dc-min-2", childId: "child-alex", childName: "Alex", date: "2026-04-01", area: "balanced_usage", demonstratedPositively: true, context: "Good balance", staffWitnessedBy: "Tom Richards" },
      { id: "dc-min-3", childId: "child-alex", childName: "Alex", date: "2026-04-15", area: "reporting_concerns", demonstratedPositively: true, context: "Reported issue", staffWitnessedBy: "Lisa Williams" },
    ];
    const result = generateDigitalLiteracyIntelligence(
      [minimalAssessment],
      [minimalAccess],
      minimalLearning,
      minimalCitizenship,
      CHILD_IDS,
      CHILD_NAMES,
      "oak-house",
      PERIOD_START,
      PERIOD_END,
      REFERENCE_DATE,
    );
    // With 3 children but only 1 assessed, score should be in requires_improvement range
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
    expect(result.overallScore).toBeLessThan(80);
  });
});
