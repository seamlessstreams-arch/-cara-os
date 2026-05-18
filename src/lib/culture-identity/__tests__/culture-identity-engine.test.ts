// ══════════════════════════════════════════════════════════════════════════════
// Tests — Culture, Identity & Diversity Intelligence Engine
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  generateCultureIdentityIntelligence,
  evaluateIdentitySupport,
  evaluateActivityProvision,
  analyseDiversityIncidents,
  evaluateStaffCompetence,
  buildChildIdentityProfiles,
  getIdentityDimensionLabel,
  getActivityTypeLabel,
  getIncidentTypeLabel,
  getTrainingTypeLabel,
} from "../culture-identity-engine";
import type {
  CultureChild,
  IdentityNeedsAssessment,
  IdentityNeed,
  IdentityActivity,
  DiversityIncident,
  StaffDiversityTraining,
} from "../culture-identity-engine";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const PERIOD_START = "2026-01-01";
const PERIOD_END = "2026-05-18";
const CURRENT_DATE = "2026-05-18";

function makeChildren(overrides: Partial<CultureChild>[] = []): CultureChild[] {
  const defaults: CultureChild[] = [
    {
      id: "child-1",
      name: "Alex",
      dateOfBirth: "2012-03-15",
      ethnicHeritage: "White British / Jamaican",
      religion: "None specified",
      firstLanguage: "English",
      genderIdentity: "Male",
      pronouns: "he/him",
      culturalTraditions: ["Caribbean cooking", "Carnival"],
      dietaryRequirements: ["No pork"],
      currentPlacement: true,
    },
    {
      id: "child-2",
      name: "Jordan",
      dateOfBirth: "2013-07-22",
      ethnicHeritage: "White British",
      religion: "Christian",
      firstLanguage: "English",
      genderIdentity: "Non-binary",
      pronouns: "they/them",
      currentPlacement: true,
    },
    {
      id: "child-3",
      name: "Morgan",
      dateOfBirth: "2010-12-01",
      ethnicHeritage: "Pakistani British",
      religion: "Islam",
      firstLanguage: "Urdu",
      additionalLanguages: ["English"],
      genderIdentity: "Female",
      pronouns: "she/her",
      culturalTraditions: ["Eid celebrations", "Ramadan"],
      dietaryRequirements: ["Halal"],
      currentPlacement: true,
    },
  ];
  return defaults.map((d, i) =>
    overrides[i] ? { ...d, ...overrides[i] } : d,
  );
}

function makeAssessments(
  overrides: Partial<IdentityNeedsAssessment>[] = [],
): IdentityNeedsAssessment[] {
  const defaults: IdentityNeedsAssessment[] = [
    {
      childId: "child-1",
      assessmentDate: "2026-01-15",
      dimensionsAssessed: [
        "ethnic_heritage",
        "religious_belief",
        "language",
        "cultural_traditions",
      ],
      needsIdentified: [
        {
          dimension: "ethnic_heritage",
          description: "Connection to Jamaican heritage",
          priority: "high",
          status: "met",
          supportPlan: "Monthly Caribbean cooking with key worker",
        },
        {
          dimension: "cultural_traditions",
          description: "Carnival participation",
          priority: "medium",
          status: "met",
          supportPlan: "Notting Hill Carnival outing planned",
        },
        {
          dimension: "religious_belief",
          description: "No specific religious needs identified",
          priority: "low",
          status: "met",
        },
      ],
      reviewDueDate: "2026-07-15",
      assessedBy: "Sarah Johnson",
    },
    {
      childId: "child-2",
      assessmentDate: "2026-02-01",
      dimensionsAssessed: [
        "ethnic_heritage",
        "religious_belief",
        "gender_identity",
        "language",
      ],
      needsIdentified: [
        {
          dimension: "gender_identity",
          description: "Non-binary identity — uses they/them pronouns",
          priority: "high",
          status: "met",
          supportPlan: "All staff briefed; pronouns on all records",
        },
        {
          dimension: "religious_belief",
          description: "Attends local church youth group",
          priority: "medium",
          status: "met",
          supportPlan: "Transport arranged weekly",
        },
      ],
      reviewDueDate: "2026-08-01",
      assessedBy: "Tom Richards",
    },
    {
      childId: "child-3",
      assessmentDate: "2026-01-20",
      dimensionsAssessed: [
        "ethnic_heritage",
        "religious_belief",
        "language",
        "cultural_traditions",
      ],
      needsIdentified: [
        {
          dimension: "religious_belief",
          description: "Practising Muslim — prayer times, Ramadan, halal food",
          priority: "high",
          status: "met",
          supportPlan:
            "Prayer space provided; halal menu; Ramadan plan agreed",
        },
        {
          dimension: "language",
          description: "Urdu as first language — some English vocabulary gaps",
          priority: "high",
          status: "partially_met",
          supportPlan: "Urdu-speaking mentor arranged; bilingual books provided",
        },
        {
          dimension: "cultural_traditions",
          description: "Eid celebrations and cultural dress",
          priority: "medium",
          status: "met",
          supportPlan: "Eid celebrations planned; cultural clothing budget",
        },
        {
          dimension: "ethnic_heritage",
          description: "Links with Pakistani community",
          priority: "medium",
          status: "unmet",
        },
      ],
      reviewDueDate: "2026-07-20",
      assessedBy: "Lisa Williams",
    },
  ];
  return defaults.map((d, i) =>
    overrides[i] ? { ...d, ...overrides[i] } : d,
  );
}

function makeActivities(
  overrides: Partial<IdentityActivity>[] = [],
): IdentityActivity[] {
  const defaults: IdentityActivity[] = [
    // Alex activities
    {
      id: "act-1",
      childId: "child-1",
      date: "2026-02-01",
      activityType: "cultural_food_provided",
      dimension: "ethnic_heritage",
      description: "Caribbean cooking session with key worker — jerk chicken",
      childEngaged: true,
      childInitiated: true,
      outcome: "Alex really enjoyed teaching the recipe to staff",
    },
    {
      id: "act-2",
      childId: "child-1",
      date: "2026-03-15",
      activityType: "heritage_activity",
      dimension: "ethnic_heritage",
      description: "Visit to Black History Month exhibition at local museum",
      childEngaged: true,
      childInitiated: false,
    },
    {
      id: "act-3",
      childId: "child-1",
      date: "2026-04-01",
      activityType: "life_story_identity",
      dimension: "ethnic_heritage",
      description: "Life story work — exploring mixed heritage identity",
      childEngaged: true,
      childInitiated: false,
    },
    {
      id: "act-4",
      childId: "child-1",
      date: "2026-04-20",
      activityType: "community_link",
      dimension: "cultural_traditions",
      description: "Connected with local Caribbean community group",
      childEngaged: true,
      childInitiated: true,
    },
    // Jordan activities
    {
      id: "act-5",
      childId: "child-2",
      date: "2026-01-15",
      activityType: "identity_exploration",
      dimension: "gender_identity",
      description: "Session with gender identity support worker from GIDS",
      childEngaged: true,
      childInitiated: true,
      outcome: "Jordan felt validated and supported",
    },
    {
      id: "act-6",
      childId: "child-2",
      date: "2026-02-10",
      activityType: "community_link",
      dimension: "gender_identity",
      description: "Attended local LGBTQ+ youth group",
      childEngaged: true,
      childInitiated: true,
    },
    {
      id: "act-7",
      childId: "child-2",
      date: "2026-03-01",
      activityType: "worship_facilitated",
      dimension: "religious_belief",
      description: "Transport to church youth group as usual",
      childEngaged: true,
      childInitiated: false,
    },
    {
      id: "act-8",
      childId: "child-2",
      date: "2026-04-10",
      activityType: "resource_provision",
      dimension: "gender_identity",
      description: "Books on non-binary identity purchased for room",
      childEngaged: true,
      childInitiated: false,
    },
    // Morgan activities
    {
      id: "act-9",
      childId: "child-3",
      date: "2026-01-25",
      activityType: "worship_facilitated",
      dimension: "religious_belief",
      description: "Prayer space set up; Friday prayer time protected",
      childEngaged: true,
      childInitiated: false,
    },
    {
      id: "act-10",
      childId: "child-3",
      date: "2026-02-20",
      activityType: "language_support",
      dimension: "language",
      description: "Urdu-speaking mentor session — homework support",
      childEngaged: true,
      childInitiated: false,
    },
    {
      id: "act-11",
      childId: "child-3",
      date: "2026-03-10",
      activityType: "celebration_observed",
      dimension: "cultural_traditions",
      description: "Ramadan start — adjusted meal times, supported fasting",
      childEngaged: true,
      childInitiated: true,
    },
    {
      id: "act-12",
      childId: "child-3",
      date: "2026-04-10",
      activityType: "celebration_observed",
      dimension: "cultural_traditions",
      description: "Eid al-Fitr celebration — gifts, new clothes, special meal",
      childEngaged: true,
      childInitiated: true,
    },
    {
      id: "act-13",
      childId: "child-3",
      date: "2026-04-25",
      activityType: "cultural_food_provided",
      dimension: "ethnic_heritage",
      description: "Halal menu expanded — Morgan helped plan weekly menu",
      childEngaged: true,
      childInitiated: true,
    },
  ];
  return defaults.map((d, i) =>
    overrides[i] ? { ...d, ...overrides[i] } : d,
  );
}

function makeIncidents(
  overrides: Partial<DiversityIncident>[] = [],
): DiversityIncident[] {
  const defaults: DiversityIncident[] = [
    {
      id: "inc-1",
      date: "2026-03-05",
      incidentType: "racism",
      perpetrator: "external",
      victimChildIds: ["child-1"],
      reported: true,
      reportedDate: "2026-03-05",
      investigated: true,
      investigationOutcome: "Racial slur from member of public on outing",
      resolved: true,
      resolvedDate: "2026-03-12",
      actionsTaken: [
        "Immediate support provided",
        "Discussed with Alex",
        "Recorded in daily log",
      ],
      lessonLearned:
        "Staff to pre-plan outings considering diversity of group; carry incident reporting cards",
    },
    {
      id: "inc-2",
      date: "2026-04-15",
      incidentType: "transphobia",
      perpetrator: "child",
      victimChildIds: ["child-2"],
      reported: true,
      reportedDate: "2026-04-15",
      investigated: true,
      investigationOutcome:
        "Alex used incorrect pronouns deliberately; spoke to in key-work session",
      resolved: true,
      resolvedDate: "2026-04-20",
      actionsTaken: [
        "Key work session with Alex on respectful language",
        "Group house meeting on pronouns",
        "Support session for Jordan",
      ],
      lessonLearned:
        "Reinforce pronoun respect through regular house meeting agenda item",
    },
  ];
  return defaults.map((d, i) =>
    overrides[i] ? { ...d, ...overrides[i] } : d,
  );
}

function makeTraining(
  overrides: Partial<StaffDiversityTraining>[] = [],
): StaffDiversityTraining[] {
  const defaults: StaffDiversityTraining[] = [
    {
      staffId: "staff-sarah",
      staffName: "Sarah Johnson",
      trainingType: "equality_diversity",
      completionDate: "2025-09-15",
      expiryDate: "2027-09-15",
      certificateHeld: true,
    },
    {
      staffId: "staff-sarah",
      staffName: "Sarah Johnson",
      trainingType: "cultural_competence",
      completionDate: "2025-11-01",
      certificateHeld: true,
    },
    {
      staffId: "staff-tom",
      staffName: "Tom Richards",
      trainingType: "equality_diversity",
      completionDate: "2025-08-20",
      expiryDate: "2027-08-20",
      certificateHeld: true,
    },
    {
      staffId: "staff-tom",
      staffName: "Tom Richards",
      trainingType: "lgbtq_awareness",
      completionDate: "2026-01-10",
      certificateHeld: true,
    },
    {
      staffId: "staff-lisa",
      staffName: "Lisa Williams",
      trainingType: "equality_diversity",
      completionDate: "2025-10-01",
      expiryDate: "2027-10-01",
      certificateHeld: true,
    },
    {
      staffId: "staff-lisa",
      staffName: "Lisa Williams",
      trainingType: "religious_literacy",
      completionDate: "2025-12-15",
      certificateHeld: true,
    },
    {
      staffId: "staff-darren",
      staffName: "Darren Laville",
      trainingType: "equality_diversity",
      completionDate: "2025-07-01",
      expiryDate: "2027-07-01",
      certificateHeld: true,
    },
    {
      staffId: "staff-darren",
      staffName: "Darren Laville",
      trainingType: "anti_racism",
      completionDate: "2025-11-20",
      certificateHeld: true,
    },
    {
      staffId: "staff-darren",
      staffName: "Darren Laville",
      trainingType: "unconscious_bias",
      completionDate: "2026-01-05",
      certificateHeld: true,
    },
  ];
  return defaults.map((d, i) =>
    overrides[i] ? { ...d, ...overrides[i] } : d,
  );
}

const STAFF_IDS = ["staff-sarah", "staff-tom", "staff-lisa", "staff-darren"];

// ══════════════════════════════════════════════════════════════════════════════
// IDENTITY SUPPORT EVALUATION
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateIdentitySupport", () => {
  it("calculates assessment rate correctly when all children assessed", () => {
    const result = evaluateIdentitySupport(
      makeChildren(),
      makeAssessments(),
      CURRENT_DATE,
    );
    expect(result.totalChildren).toBe(3);
    expect(result.childrenWithAssessment).toBe(3);
    expect(result.assessmentRate).toBe(100);
  });

  it("reports correct needs breakdown", () => {
    const result = evaluateIdentitySupport(
      makeChildren(),
      makeAssessments(),
      CURRENT_DATE,
    );
    // 3 + 2 + 4 = 9 needs across all children
    expect(result.totalNeedsIdentified).toBe(9);
    // met: Alex 3 + Jordan 2 + Morgan 2(religion+eid) = 7
    expect(result.needsMet).toBe(7);
    // partially: Morgan language = 1
    expect(result.needsPartiallyMet).toBe(1);
    // unmet: Morgan community links = 1
    expect(result.needsUnmet).toBe(1);
  });

  it("calculates needs met rate over assessed needs only", () => {
    const result = evaluateIdentitySupport(
      makeChildren(),
      makeAssessments(),
      CURRENT_DATE,
    );
    // All 9 needs have a status != not_assessed, 7 are met
    expect(result.needsMetRate).toBe(78); // 7/9 = 77.7 → 78
  });

  it("handles children with no assessments", () => {
    const result = evaluateIdentitySupport(
      makeChildren(),
      [], // no assessments
      CURRENT_DATE,
    );
    expect(result.childrenWithAssessment).toBe(0);
    expect(result.assessmentRate).toBe(0);
    expect(result.totalNeedsIdentified).toBe(0);
    expect(result.needsMetRate).toBe(0);
  });

  it("tracks dimension coverage counts", () => {
    const result = evaluateIdentitySupport(
      makeChildren(),
      makeAssessments(),
      CURRENT_DATE,
    );
    // ethnic_heritage: child-1, child-2, child-3 = 3
    expect(result.dimensionCoverage.ethnic_heritage).toBe(3);
    // gender_identity: child-2 only = 1
    expect(result.dimensionCoverage.gender_identity).toBe(1);
    // disability: none = 0
    expect(result.dimensionCoverage.disability).toBe(0);
  });

  it("excludes non-placed children", () => {
    const children = makeChildren([
      {},
      {},
      { currentPlacement: false },
    ]);
    const result = evaluateIdentitySupport(
      children,
      makeAssessments(),
      CURRENT_DATE,
    );
    expect(result.totalChildren).toBe(2);
    expect(result.childrenWithAssessment).toBe(2);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// ACTIVITY PROVISION EVALUATION
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateActivityProvision", () => {
  it("counts total activities in period", () => {
    const result = evaluateActivityProvision(
      makeChildren(),
      makeActivities(),
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.totalActivities).toBe(13);
  });

  it("calculates activities per child correctly", () => {
    const result = evaluateActivityProvision(
      makeChildren(),
      makeActivities(),
      PERIOD_START,
      PERIOD_END,
    );
    // 13 / 3 = 4.3
    expect(result.activitiesPerChild).toBe(4.3);
  });

  it("reports child engagement rate", () => {
    const result = evaluateActivityProvision(
      makeChildren(),
      makeActivities(),
      PERIOD_START,
      PERIOD_END,
    );
    // All 13 activities have childEngaged: true
    expect(result.childEngagementRate).toBe(100);
  });

  it("reports child-initiated rate", () => {
    const result = evaluateActivityProvision(
      makeChildren(),
      makeActivities(),
      PERIOD_START,
      PERIOD_END,
    );
    // child-initiated: act-1, act-4, act-5, act-6, act-11, act-12, act-13 = 7
    expect(result.childInitiatedRate).toBe(54); // 7/13 = 53.8 → 54
  });

  it("identifies children with no activities", () => {
    // Only keep child-1 activities
    const activities = makeActivities().filter(
      (a) => a.childId === "child-1",
    );
    const result = evaluateActivityProvision(
      makeChildren(),
      activities,
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.childrenWithNoActivities).toContain("Jordan");
    expect(result.childrenWithNoActivities).toContain("Morgan");
    expect(result.childrenWithNoActivities).not.toContain("Alex");
  });

  it("returns activity type breakdown sorted by count", () => {
    const result = evaluateActivityProvision(
      makeChildren(),
      makeActivities(),
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.activityTypeBreakdown.length).toBeGreaterThan(0);
    // Most common should be first
    for (let i = 1; i < result.activityTypeBreakdown.length; i++) {
      expect(result.activityTypeBreakdown[i].count).toBeLessThanOrEqual(
        result.activityTypeBreakdown[i - 1].count,
      );
    }
  });

  it("returns dimension breakdown", () => {
    const result = evaluateActivityProvision(
      makeChildren(),
      makeActivities(),
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.dimensionBreakdown.length).toBeGreaterThan(0);
    const totalFromBreakdown = result.dimensionBreakdown.reduce(
      (sum, d) => sum + d.count,
      0,
    );
    expect(totalFromBreakdown).toBe(result.totalActivities);
  });

  it("excludes activities outside period", () => {
    const activities = makeActivities();
    activities.push({
      id: "act-outside",
      childId: "child-1",
      date: "2025-06-01",
      activityType: "heritage_activity",
      dimension: "ethnic_heritage",
      description: "Outside period",
      childEngaged: true,
      childInitiated: false,
    });
    const result = evaluateActivityProvision(
      makeChildren(),
      activities,
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.totalActivities).toBe(13); // Still 13
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// DIVERSITY INCIDENT ANALYSIS
// ══════════════════════════════════════════════════════════════════════════════

describe("analyseDiversityIncidents", () => {
  it("counts total incidents in period", () => {
    const result = analyseDiversityIncidents(
      makeIncidents(),
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.totalIncidents).toBe(2);
  });

  it("reports 100% reporting rate when all reported", () => {
    const result = analyseDiversityIncidents(
      makeIncidents(),
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.reportedRate).toBe(100);
    expect(result.investigatedRate).toBe(100);
    expect(result.resolvedRate).toBe(100);
  });

  it("calculates average resolution days", () => {
    const result = analyseDiversityIncidents(
      makeIncidents(),
      PERIOD_START,
      PERIOD_END,
    );
    // inc-1: 2026-03-05 to 2026-03-12 = 7 days
    // inc-2: 2026-04-15 to 2026-04-20 = 5 days
    // Average: 6 days
    expect(result.averageResolutionDays).toBe(6);
  });

  it("detects unreported incidents", () => {
    const incidents = makeIncidents();
    incidents.push({
      id: "inc-unreported",
      date: "2026-04-20",
      incidentType: "cultural_insensitivity",
      perpetrator: "staff",
      victimChildIds: ["child-3"],
      reported: false,
      investigated: false,
      resolved: false,
      actionsTaken: [],
    });
    const result = analyseDiversityIncidents(
      incidents,
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.reportedRate).toBe(67); // 2/3
    expect(result.staffIncidents).toBe(1);
  });

  it("provides type breakdown", () => {
    const result = analyseDiversityIncidents(
      makeIncidents(),
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.typeBreakdown).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ incidentType: "racism", count: 1 }),
        expect.objectContaining({ incidentType: "transphobia", count: 1 }),
      ]),
    );
  });

  it("provides perpetrator breakdown", () => {
    const result = analyseDiversityIncidents(
      makeIncidents(),
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.perpetratorBreakdown).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ perpetrator: "external", count: 1 }),
        expect.objectContaining({ perpetrator: "child", count: 1 }),
      ]),
    );
  });

  it("counts lessons recorded", () => {
    const result = analyseDiversityIncidents(
      makeIncidents(),
      PERIOD_START,
      PERIOD_END,
    );
    // Both incidents have lessonLearned
    expect(result.lessonsRecorded).toBe(2);
  });

  it("handles zero incidents", () => {
    const result = analyseDiversityIncidents([], PERIOD_START, PERIOD_END);
    expect(result.totalIncidents).toBe(0);
    expect(result.reportedRate).toBe(0);
    expect(result.averageResolutionDays).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// STAFF COMPETENCE EVALUATION
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateStaffCompetence", () => {
  it("reports all staff trained when all have records", () => {
    const result = evaluateStaffCompetence(
      makeTraining(),
      STAFF_IDS,
      CURRENT_DATE,
    );
    expect(result.totalStaff).toBe(4);
    expect(result.staffWithTraining).toBe(4);
    expect(result.trainingRate).toBe(100);
  });

  it("detects staff missing training", () => {
    const extraStaff = [...STAFF_IDS, "staff-new"];
    const result = evaluateStaffCompetence(
      makeTraining(),
      extraStaff,
      CURRENT_DATE,
    );
    expect(result.staffWithTraining).toBe(4);
    expect(result.trainingRate).toBe(80); // 4/5
    expect(result.staffMissingTraining).toContain("staff-new");
  });

  it("detects expired training", () => {
    const training = makeTraining();
    training.push({
      staffId: "staff-expired",
      staffName: "Expired Person",
      trainingType: "equality_diversity",
      completionDate: "2024-01-01",
      expiryDate: "2025-01-01", // Before current date
      certificateHeld: true,
    });
    const result = evaluateStaffCompetence(
      training,
      [...STAFF_IDS, "staff-expired"],
      CURRENT_DATE,
    );
    expect(result.expiredTraining).toBe(1);
  });

  it("provides training type breakdown", () => {
    const result = evaluateStaffCompetence(
      makeTraining(),
      STAFF_IDS,
      CURRENT_DATE,
    );
    expect(result.trainingTypeBreakdown.length).toBeGreaterThan(0);
    // equality_diversity is most common (4 records)
    expect(result.trainingTypeBreakdown[0].trainingType).toBe(
      "equality_diversity",
    );
    expect(result.trainingTypeBreakdown[0].count).toBe(4);
  });

  it("handles no training records", () => {
    const result = evaluateStaffCompetence([], STAFF_IDS, CURRENT_DATE);
    expect(result.staffWithTraining).toBe(0);
    expect(result.trainingRate).toBe(0);
    expect(result.staffMissingTraining).toEqual(STAFF_IDS);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// CHILD IDENTITY PROFILES
// ══════════════════════════════════════════════════════════════════════════════

describe("buildChildIdentityProfiles", () => {
  it("builds profile for each placed child", () => {
    const profiles = buildChildIdentityProfiles(
      makeChildren(),
      makeAssessments(),
      makeActivities(),
      makeIncidents(),
      PERIOD_START,
      PERIOD_END,
      CURRENT_DATE,
    );
    expect(profiles).toHaveLength(3);
    expect(profiles.map((p) => p.childName)).toEqual([
      "Alex",
      "Jordan",
      "Morgan",
    ]);
  });

  it("reports assessment status correctly", () => {
    const profiles = buildChildIdentityProfiles(
      makeChildren(),
      makeAssessments(),
      makeActivities(),
      makeIncidents(),
      PERIOD_START,
      PERIOD_END,
      CURRENT_DATE,
    );
    // All have assessments, none overdue (review dates in July/August)
    expect(profiles.every((p) => p.hasAssessment)).toBe(true);
    expect(profiles.every((p) => !p.assessmentOverdue)).toBe(true);
  });

  it("detects overdue assessments", () => {
    const assessments = makeAssessments([
      { reviewDueDate: "2026-03-01" }, // Overdue
    ]);
    const profiles = buildChildIdentityProfiles(
      makeChildren(),
      assessments,
      makeActivities(),
      makeIncidents(),
      PERIOD_START,
      PERIOD_END,
      CURRENT_DATE,
    );
    expect(profiles[0].assessmentOverdue).toBe(true);
    expect(profiles[0].primaryConcern).toBe(
      "Identity needs assessment overdue for review",
    );
  });

  it("tracks activities per child", () => {
    const profiles = buildChildIdentityProfiles(
      makeChildren(),
      makeAssessments(),
      makeActivities(),
      makeIncidents(),
      PERIOD_START,
      PERIOD_END,
      CURRENT_DATE,
    );
    // Alex: 4 activities
    expect(profiles[0].activitiesCount).toBe(4);
    // Jordan: 4 activities
    expect(profiles[1].activitiesCount).toBe(4);
    // Morgan: 5 activities
    expect(profiles[2].activitiesCount).toBe(5);
  });

  it("tracks child-initiated activities", () => {
    const profiles = buildChildIdentityProfiles(
      makeChildren(),
      makeAssessments(),
      makeActivities(),
      makeIncidents(),
      PERIOD_START,
      PERIOD_END,
      CURRENT_DATE,
    );
    // Alex: act-1, act-4 = 2 initiated
    expect(profiles[0].childInitiatedCount).toBe(2);
    // Jordan: act-5, act-6 = 2 initiated
    expect(profiles[1].childInitiatedCount).toBe(2);
    // Morgan: act-11, act-12, act-13 = 3 initiated
    expect(profiles[2].childInitiatedCount).toBe(3);
  });

  it("tracks incidents as victim", () => {
    const profiles = buildChildIdentityProfiles(
      makeChildren(),
      makeAssessments(),
      makeActivities(),
      makeIncidents(),
      PERIOD_START,
      PERIOD_END,
      CURRENT_DATE,
    );
    // Alex: 1 incident (racism from external)
    expect(profiles[0].incidentsAsVictim).toBe(1);
    // Jordan: 1 incident (transphobia from child)
    expect(profiles[1].incidentsAsVictim).toBe(1);
    // Morgan: 0 incidents
    expect(profiles[2].incidentsAsVictim).toBe(0);
  });

  it("identifies dimension gaps", () => {
    const profiles = buildChildIdentityProfiles(
      makeChildren(),
      makeAssessments(),
      makeActivities(),
      makeIncidents(),
      PERIOD_START,
      PERIOD_END,
      CURRENT_DATE,
    );
    // Alex assessment covers ethnic_heritage, religious_belief, language, cultural_traditions
    // Plus activities in ethnic_heritage, cultural_traditions
    // Gaps: gender_identity, sexual_orientation, disability
    expect(profiles[0].dimensionGaps).toContain("gender_identity");
    expect(profiles[0].dimensionGaps).toContain("sexual_orientation");
    expect(profiles[0].dimensionGaps).toContain("disability");
  });

  it("flags primary concern for children missing assessment", () => {
    const profiles = buildChildIdentityProfiles(
      makeChildren(),
      [], // No assessments
      makeActivities(),
      makeIncidents(),
      PERIOD_START,
      PERIOD_END,
      CURRENT_DATE,
    );
    expect(profiles[0].primaryConcern).toBe(
      "No identity needs assessment on record",
    );
  });

  it("flags primary concern for children with multiple incidents", () => {
    const incidents = makeIncidents();
    // Add another incident targeting child-1
    incidents.push({
      id: "inc-extra",
      date: "2026-04-01",
      incidentType: "racism",
      perpetrator: "child",
      victimChildIds: ["child-1"],
      reported: true,
      reportedDate: "2026-04-01",
      investigated: true,
      resolved: true,
      resolvedDate: "2026-04-05",
      actionsTaken: ["Support provided"],
    });
    const profiles = buildChildIdentityProfiles(
      makeChildren(),
      makeAssessments(),
      makeActivities(),
      incidents,
      PERIOD_START,
      PERIOD_END,
      CURRENT_DATE,
    );
    expect(profiles[0].incidentsAsVictim).toBe(2);
    expect(profiles[0].primaryConcern).toBe(
      "2 discriminatory incidents as victim",
    );
  });

  it("flags primary concern for children with no activities", () => {
    const profiles = buildChildIdentityProfiles(
      makeChildren(),
      makeAssessments(),
      [], // No activities
      makeIncidents(),
      PERIOD_START,
      PERIOD_END,
      CURRENT_DATE,
    );
    expect(profiles[0].primaryConcern).toBe(
      "No identity-supporting activities in period",
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// INTEGRATION: generateCultureIdentityIntelligence
// ══════════════════════════════════════════════════════════════════════════════

describe("generateCultureIdentityIntelligence", () => {
  it("returns complete result structure", () => {
    const result = generateCultureIdentityIntelligence(
      makeChildren(),
      makeAssessments(),
      makeActivities(),
      makeIncidents(),
      makeTraining(),
      STAFF_IDS,
      "oak-house",
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe(PERIOD_START);
    expect(result.periodEnd).toBe(PERIOD_END);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(
      result.rating,
    );
    expect(result.identitySupport).toBeDefined();
    expect(result.activityProvision).toBeDefined();
    expect(result.incidentAnalysis).toBeDefined();
    expect(result.staffCompetence).toBeDefined();
    expect(result.childProfiles).toHaveLength(3);
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.areasForDevelopment.length).toBeGreaterThan(0);
    expect(result.immediateActions.length).toBeGreaterThan(0);
    expect(result.regulatoryLinks.length).toBeGreaterThan(0);
  });

  it("scores well for comprehensive setup", () => {
    const result = generateCultureIdentityIntelligence(
      makeChildren(),
      makeAssessments(),
      makeActivities(),
      makeIncidents(),
      makeTraining(),
      STAFF_IDS,
      "oak-house",
      PERIOD_START,
      PERIOD_END,
    );
    // Good setup: all assessed, activities, training, incidents resolved
    expect(result.overallScore).toBeGreaterThanOrEqual(65);
    expect(["outstanding", "good"]).toContain(result.rating);
  });

  it("scores lower when assessments missing", () => {
    const goodResult = generateCultureIdentityIntelligence(
      makeChildren(),
      makeAssessments(),
      makeActivities(),
      makeIncidents(),
      makeTraining(),
      STAFF_IDS,
      "oak-house",
      PERIOD_START,
      PERIOD_END,
    );
    const poorResult = generateCultureIdentityIntelligence(
      makeChildren(),
      [], // No assessments
      makeActivities(),
      makeIncidents(),
      makeTraining(),
      STAFF_IDS,
      "oak-house",
      PERIOD_START,
      PERIOD_END,
    );
    expect(poorResult.overallScore).toBeLessThan(goodResult.overallScore);
  });

  it("scores lower when no activities provided", () => {
    const goodResult = generateCultureIdentityIntelligence(
      makeChildren(),
      makeAssessments(),
      makeActivities(),
      makeIncidents(),
      makeTraining(),
      STAFF_IDS,
      "oak-house",
      PERIOD_START,
      PERIOD_END,
    );
    const poorResult = generateCultureIdentityIntelligence(
      makeChildren(),
      makeAssessments(),
      [], // No activities
      makeIncidents(),
      makeTraining(),
      STAFF_IDS,
      "oak-house",
      PERIOD_START,
      PERIOD_END,
    );
    expect(poorResult.overallScore).toBeLessThan(goodResult.overallScore);
  });

  it("scores lower when training incomplete", () => {
    const goodResult = generateCultureIdentityIntelligence(
      makeChildren(),
      makeAssessments(),
      makeActivities(),
      makeIncidents(),
      makeTraining(),
      STAFF_IDS,
      "oak-house",
      PERIOD_START,
      PERIOD_END,
    );
    const poorResult = generateCultureIdentityIntelligence(
      makeChildren(),
      makeAssessments(),
      makeActivities(),
      makeIncidents(),
      [], // No training
      STAFF_IDS,
      "oak-house",
      PERIOD_START,
      PERIOD_END,
    );
    expect(poorResult.overallScore).toBeLessThan(goodResult.overallScore);
  });

  it("penalises staff-perpetrated incidents", () => {
    const cleanIncidents = makeIncidents();
    const staffIncidents: DiversityIncident[] = [
      ...cleanIncidents,
      {
        id: "inc-staff",
        date: "2026-04-01",
        incidentType: "cultural_insensitivity",
        perpetrator: "staff",
        victimChildIds: ["child-3"],
        reported: true,
        reportedDate: "2026-04-01",
        investigated: true,
        resolved: true,
        resolvedDate: "2026-04-10",
        actionsTaken: ["Supervision session"],
      },
    ];
    const cleanResult = generateCultureIdentityIntelligence(
      makeChildren(),
      makeAssessments(),
      makeActivities(),
      cleanIncidents,
      makeTraining(),
      STAFF_IDS,
      "oak-house",
      PERIOD_START,
      PERIOD_END,
    );
    const staffResult = generateCultureIdentityIntelligence(
      makeChildren(),
      makeAssessments(),
      makeActivities(),
      staffIncidents,
      makeTraining(),
      STAFF_IDS,
      "oak-house",
      PERIOD_START,
      PERIOD_END,
    );
    expect(staffResult.overallScore).toBeLessThan(cleanResult.overallScore);
  });

  it("includes regulatory links", () => {
    const result = generateCultureIdentityIntelligence(
      makeChildren(),
      makeAssessments(),
      makeActivities(),
      makeIncidents(),
      makeTraining(),
      STAFF_IDS,
      "oak-house",
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.regulatoryLinks.some((l) => l.includes("Reg 11"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Equality Act"))).toBe(
      true,
    );
    expect(result.regulatoryLinks.some((l) => l.includes("UNCRC"))).toBe(true);
  });

  it("generates strengths for good practice", () => {
    const result = generateCultureIdentityIntelligence(
      makeChildren(),
      makeAssessments(),
      makeActivities(),
      makeIncidents(),
      makeTraining(),
      STAFF_IDS,
      "oak-house",
      PERIOD_START,
      PERIOD_END,
    );
    // All assessed, good engagement, good training
    expect(
      result.strengths.some((s) => s.includes("identity needs assessments")),
    ).toBe(true);
    expect(
      result.strengths.some((s) => s.includes("training")),
    ).toBe(true);
  });

  it("generates immediate actions for missing assessments", () => {
    const children = makeChildren();
    // Only assess child-1
    const assessments = [makeAssessments()[0]];
    const result = generateCultureIdentityIntelligence(
      children,
      assessments,
      makeActivities(),
      makeIncidents(),
      makeTraining(),
      STAFF_IDS,
      "oak-house",
      PERIOD_START,
      PERIOD_END,
    );
    expect(
      result.immediateActions.some((a) => a.includes("URGENT")),
    ).toBe(true);
    expect(
      result.immediateActions.some((a) => a.includes("Jordan")),
    ).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// LABELS
// ══════════════════════════════════════════════════════════════════════════════

describe("labels", () => {
  it("returns correct dimension label", () => {
    expect(getIdentityDimensionLabel("ethnic_heritage")).toBe(
      "Ethnic Heritage",
    );
    expect(getIdentityDimensionLabel("gender_identity")).toBe(
      "Gender Identity",
    );
  });

  it("returns correct activity type label", () => {
    expect(getActivityTypeLabel("worship_facilitated")).toBe(
      "Worship Facilitated",
    );
    expect(getActivityTypeLabel("life_story_identity")).toBe(
      "Life Story / Identity Work",
    );
  });

  it("returns correct incident type label", () => {
    expect(getIncidentTypeLabel("racism")).toBe("Racism");
    expect(getIncidentTypeLabel("transphobia")).toBe("Transphobia");
  });

  it("returns correct training type label", () => {
    expect(getTrainingTypeLabel("equality_diversity")).toBe(
      "Equality & Diversity",
    );
    expect(getTrainingTypeLabel("unconscious_bias")).toBe("Unconscious Bias");
  });
});
