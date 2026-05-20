import { describe, it, expect } from "vitest";
import {
  evaluateHouseMeetingQuality,
  evaluateHouseMeetingCompliance,
  evaluateHouseMeetingPolicy,
  evaluateStaffHouseMeetingReadiness,
  buildChildHouseMeetingProfiles,
  generateHouseMeetingsIntelligence,
  pct,
  getRating,
  getHouseMeetingCategoryLabel,
  getHouseMeetingOutcomeLabel,
  getRatingLabel,
} from "../house-meetings-engine";
import type {
  HouseMeetingRecord,
  HouseMeetingPolicy,
  StaffHouseMeetingTraining,
} from "../house-meetings-engine";

// ── Fixtures ──────────────────────────────────────────────────────────────

function makeRecord(overrides: Partial<HouseMeetingRecord> = {}): HouseMeetingRecord {
  return {
    id: "hm-001",
    homeId: "home-oak",
    date: "2026-05-10",
    childId: "child-alex",
    childName: "Alex",
    category: "house_meeting",
    outcome: "fully_completed",
    childContributedToAgenda: true,
    minutesRecorded: true,
    childAttended: true,
    actionsReviewed: true,
    documentationComplete: true,
    timelyRecording: true,
    ...overrides,
  };
}

function makeAllCategoryRecords(): HouseMeetingRecord[] {
  const cats: HouseMeetingRecord["category"][] = [
    "house_meeting", "childrens_council", "menu_planning", "activity_planning",
    "rules_review", "agenda_setting", "action_review", "special_topic",
  ];
  return cats.map((category, i) => makeRecord({ id: `hm-${i}`, category }));
}

const ALL_TRUE_POLICY: HouseMeetingPolicy = {
  houseMeetingPolicy: true,
  meetingFrequencyGuidance: true,
  childParticipationFramework: true,
  minutesAccessibilityPolicy: true,
  actionTrackingProcedure: true,
  suggestionBoxPolicy: true,
  councilGovernanceFramework: true,
};

const ALL_FALSE_POLICY: HouseMeetingPolicy = {
  houseMeetingPolicy: false,
  meetingFrequencyGuidance: false,
  childParticipationFramework: false,
  minutesAccessibilityPolicy: false,
  actionTrackingProcedure: false,
  suggestionBoxPolicy: false,
  councilGovernanceFramework: false,
};

function makeStaff(overrides: Partial<StaffHouseMeetingTraining> = {}): StaffHouseMeetingTraining {
  return {
    staffId: "staff-sarah",
    meetingFacilitation: true,
    childParticipation: true,
    minutesTaking: true,
    actionTracking: true,
    conflictResolution: true,
    inclusivePractice: true,
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// pct helper
// ══════════════════════════════════════════════════════════════════════════════

describe("pct", () => {
  it("returns percentage", () => {
    expect(pct(3, 4)).toBe(75);
  });
  it("returns 0 when denominator is 0", () => {
    expect(pct(5, 0)).toBe(0);
  });
  it("returns 100 for equal values", () => {
    expect(pct(10, 10)).toBe(100);
  });
  it("returns 0 for zero numerator", () => {
    expect(pct(0, 10)).toBe(0);
  });
  it("rounds to nearest integer", () => {
    expect(pct(1, 3)).toBe(33);
    expect(pct(2, 3)).toBe(67);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// getRating
// ══════════════════════════════════════════════════════════════════════════════

describe("getRating", () => {
  it("outstanding at 80", () => expect(getRating(80)).toBe("outstanding"));
  it("outstanding at 100", () => expect(getRating(100)).toBe("outstanding"));
  it("good at 60", () => expect(getRating(60)).toBe("good"));
  it("good at 79", () => expect(getRating(79)).toBe("good"));
  it("requires_improvement at 40", () => expect(getRating(40)).toBe("requires_improvement"));
  it("requires_improvement at 59", () => expect(getRating(59)).toBe("requires_improvement"));
  it("inadequate at 39", () => expect(getRating(39)).toBe("inadequate"));
  it("inadequate at 0", () => expect(getRating(0)).toBe("inadequate"));
});

// ══════════════════════════════════════════════════════════════════════════════
// Label helpers
// ══════════════════════════════════════════════════════════════════════════════

describe("getHouseMeetingCategoryLabel", () => {
  it("returns label for house_meeting", () => expect(getHouseMeetingCategoryLabel("house_meeting")).toBe("House Meeting"));
  it("returns label for childrens_council", () => expect(getHouseMeetingCategoryLabel("childrens_council")).toBe("Children's Council"));
  it("returns label for menu_planning", () => expect(getHouseMeetingCategoryLabel("menu_planning")).toBe("Menu Planning"));
  it("returns label for special_topic", () => expect(getHouseMeetingCategoryLabel("special_topic")).toBe("Special Topic"));
});

describe("getHouseMeetingOutcomeLabel", () => {
  it("returns label for fully_completed", () => expect(getHouseMeetingOutcomeLabel("fully_completed")).toBe("Fully Completed"));
  it("returns label for child_led", () => expect(getHouseMeetingOutcomeLabel("child_led")).toBe("Child Led"));
  it("returns label for cancelled", () => expect(getHouseMeetingOutcomeLabel("cancelled")).toBe("Cancelled"));
});

describe("getRatingLabel", () => {
  it("returns Outstanding", () => expect(getRatingLabel("outstanding")).toBe("Outstanding"));
  it("returns Requires Improvement", () => expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement"));
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 1: Quality
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateHouseMeetingQuality", () => {
  it("returns 25 for perfect records", () => {
    const records = Array.from({ length: 10 }, (_, i) => makeRecord({ id: `hm-${i}` }));
    const result = evaluateHouseMeetingQuality(records);
    expect(result.overallScore).toBe(25);
    expect(result.childAgendaContributionRate).toBe(100);
    expect(result.minutesRecordedRate).toBe(100);
    expect(result.childAttendanceRate).toBe(100);
    expect(result.actionsReviewedRate).toBe(100);
    expect(result.totalMeetings).toBe(10);
  });

  it("returns 0 for empty records", () => {
    const result = evaluateHouseMeetingQuality([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalMeetings).toBe(0);
    expect(result.childAgendaContributionRate).toBe(0);
  });

  it("returns 0 when all flags are false", () => {
    const records = [makeRecord({
      childContributedToAgenda: false,
      minutesRecorded: false,
      childAttended: false,
      actionsReviewed: false,
    })];
    const result = evaluateHouseMeetingQuality(records);
    expect(result.overallScore).toBe(0);
  });

  it("weights childAgendaContributionRate at 7", () => {
    const records = [makeRecord({
      childContributedToAgenda: true,
      minutesRecorded: false,
      childAttended: false,
      actionsReviewed: false,
    })];
    const result = evaluateHouseMeetingQuality(records);
    expect(result.overallScore).toBe(7);
  });

  it("weights minutesRecordedRate at 6", () => {
    const records = [makeRecord({
      childContributedToAgenda: false,
      minutesRecorded: true,
      childAttended: false,
      actionsReviewed: false,
    })];
    const result = evaluateHouseMeetingQuality(records);
    expect(result.overallScore).toBe(6);
  });

  it("weights childAttendanceRate at 6", () => {
    const records = [makeRecord({
      childContributedToAgenda: false,
      minutesRecorded: false,
      childAttended: true,
      actionsReviewed: false,
    })];
    const result = evaluateHouseMeetingQuality(records);
    expect(result.overallScore).toBe(6);
  });

  it("weights actionsReviewedRate at 6", () => {
    const records = [makeRecord({
      childContributedToAgenda: false,
      minutesRecorded: false,
      childAttended: false,
      actionsReviewed: true,
    })];
    const result = evaluateHouseMeetingQuality(records);
    expect(result.overallScore).toBe(6);
  });

  it("handles partial data correctly", () => {
    const records = [
      makeRecord({ id: "hm-1" }),
      makeRecord({ id: "hm-2", childContributedToAgenda: false, minutesRecorded: false }),
    ];
    const result = evaluateHouseMeetingQuality(records);
    expect(result.childAgendaContributionRate).toBe(50);
    expect(result.minutesRecordedRate).toBe(50);
    expect(result.childAttendanceRate).toBe(100);
    expect(result.actionsReviewedRate).toBe(100);
  });

  it("caps at 25", () => {
    const records = Array.from({ length: 100 }, (_, i) => makeRecord({ id: `hm-${i}` }));
    const result = evaluateHouseMeetingQuality(records);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("handles single record", () => {
    const result = evaluateHouseMeetingQuality([makeRecord()]);
    expect(result.overallScore).toBe(25);
    expect(result.totalMeetings).toBe(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 2: Compliance
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateHouseMeetingCompliance", () => {
  it("returns 25 for perfect records with all categories", () => {
    const records = makeAllCategoryRecords();
    const result = evaluateHouseMeetingCompliance(records);
    expect(result.overallScore).toBe(25);
    expect(result.documentationRate).toBe(100);
    expect(result.timelyRecordingRate).toBe(100);
    expect(result.childAttendanceRate).toBe(100);
    expect(result.categoryDiversityRatio).toBe(100);
  });

  it("returns 0 for empty records", () => {
    const result = evaluateHouseMeetingCompliance([]);
    expect(result.overallScore).toBe(0);
  });

  it("returns 0 when all flags false and single category", () => {
    const records = [makeRecord({
      documentationComplete: false,
      timelyRecording: false,
      childAttended: false,
    })];
    const result = evaluateHouseMeetingCompliance(records);
    // categoryDiversityRatio = pct(1, 8) = 13
    // raw = 0 + 0 + 0 + (13/100)*5 = 0.65 → rounds to 1
    expect(result.overallScore).toBe(1);
  });

  it("weights documentationRate at 8", () => {
    const records = [makeRecord({
      timelyRecording: false,
      childAttended: false,
    })];
    const result = evaluateHouseMeetingCompliance(records);
    // doc=100→8, timely=0→0, attend=0→0, catDiv=pct(1,8)=13→0.65
    expect(result.documentationRate).toBe(100);
  });

  it("handles all 8 categories for max diversity", () => {
    const records = makeAllCategoryRecords();
    const result = evaluateHouseMeetingCompliance(records);
    expect(result.categoryDiversityRatio).toBe(100);
  });

  it("calculates diversity for single category", () => {
    const records = [makeRecord(), makeRecord({ id: "hm-2" })];
    const result = evaluateHouseMeetingCompliance(records);
    expect(result.categoryDiversityRatio).toBe(13); // pct(1, 8) = 13
  });

  it("handles partial compliance flags", () => {
    const records = [
      makeRecord({ id: "hm-1" }),
      makeRecord({ id: "hm-2", documentationComplete: false }),
    ];
    const result = evaluateHouseMeetingCompliance(records);
    expect(result.documentationRate).toBe(50);
    expect(result.timelyRecordingRate).toBe(100);
  });

  it("caps at 25", () => {
    const records = makeAllCategoryRecords();
    const result = evaluateHouseMeetingCompliance(records);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 3: Policy
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateHouseMeetingPolicy", () => {
  it("returns 25 when all true", () => {
    const result = evaluateHouseMeetingPolicy(ALL_TRUE_POLICY);
    expect(result.overallScore).toBe(25);
  });

  it("returns 0 when all false", () => {
    const result = evaluateHouseMeetingPolicy(ALL_FALSE_POLICY);
    expect(result.overallScore).toBe(0);
  });

  it("returns 0 when null", () => {
    const result = evaluateHouseMeetingPolicy(null);
    expect(result.overallScore).toBe(0);
    expect(result.houseMeetingPolicy).toBe(false);
    expect(result.meetingFrequencyGuidance).toBe(false);
  });

  it("weights first 4 booleans at 4 each", () => {
    const result = evaluateHouseMeetingPolicy({
      ...ALL_FALSE_POLICY,
      houseMeetingPolicy: true,
    });
    expect(result.overallScore).toBe(4);
  });

  it("weights last 3 booleans at 3 each", () => {
    const result = evaluateHouseMeetingPolicy({
      ...ALL_FALSE_POLICY,
      actionTrackingProcedure: true,
    });
    expect(result.overallScore).toBe(3);
  });

  it("handles mixed booleans correctly", () => {
    const result = evaluateHouseMeetingPolicy({
      houseMeetingPolicy: true,        // 4
      meetingFrequencyGuidance: true,   // 4
      childParticipationFramework: false,
      minutesAccessibilityPolicy: false,
      actionTrackingProcedure: true,    // 3
      suggestionBoxPolicy: false,
      councilGovernanceFramework: false,
    });
    expect(result.overallScore).toBe(11);
  });

  it("returns all policy flags in result", () => {
    const result = evaluateHouseMeetingPolicy(ALL_TRUE_POLICY);
    expect(result.houseMeetingPolicy).toBe(true);
    expect(result.meetingFrequencyGuidance).toBe(true);
    expect(result.childParticipationFramework).toBe(true);
    expect(result.minutesAccessibilityPolicy).toBe(true);
    expect(result.actionTrackingProcedure).toBe(true);
    expect(result.suggestionBoxPolicy).toBe(true);
    expect(result.councilGovernanceFramework).toBe(true);
  });

  it("caps at 25", () => {
    const result = evaluateHouseMeetingPolicy(ALL_TRUE_POLICY);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 4: Staff Readiness
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateStaffHouseMeetingReadiness", () => {
  it("returns 25 when all staff have all skills", () => {
    const staff = [makeStaff({ staffId: "s1" }), makeStaff({ staffId: "s2" }), makeStaff({ staffId: "s3" })];
    const result = evaluateStaffHouseMeetingReadiness(staff);
    expect(result.overallScore).toBe(25);
    expect(result.totalStaff).toBe(3);
  });

  it("returns 0 for empty staff", () => {
    const result = evaluateStaffHouseMeetingReadiness([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalStaff).toBe(0);
  });

  it("returns 0 when no skills", () => {
    const staff = [makeStaff({
      meetingFacilitation: false,
      childParticipation: false,
      minutesTaking: false,
      actionTracking: false,
      conflictResolution: false,
      inclusivePractice: false,
    })];
    const result = evaluateStaffHouseMeetingReadiness(staff);
    expect(result.overallScore).toBe(0);
  });

  it("weights meetingFacilitation at 6", () => {
    const staff = [makeStaff({
      meetingFacilitation: true,
      childParticipation: false,
      minutesTaking: false,
      actionTracking: false,
      conflictResolution: false,
      inclusivePractice: false,
    })];
    const result = evaluateStaffHouseMeetingReadiness(staff);
    expect(result.overallScore).toBe(6);
  });

  it("weights inclusivePractice at 2", () => {
    const staff = [makeStaff({
      meetingFacilitation: false,
      childParticipation: false,
      minutesTaking: false,
      actionTracking: false,
      conflictResolution: false,
      inclusivePractice: true,
    })];
    const result = evaluateStaffHouseMeetingReadiness(staff);
    expect(result.overallScore).toBe(2);
  });

  it("calculates rates for mixed skills", () => {
    const staff = [
      makeStaff({ staffId: "s1" }),
      makeStaff({ staffId: "s2", meetingFacilitation: false, childParticipation: false }),
    ];
    const result = evaluateStaffHouseMeetingReadiness(staff);
    expect(result.meetingFacilitationRate).toBe(50);
    expect(result.childParticipationRate).toBe(50);
    expect(result.minutesTakingRate).toBe(100);
  });

  it("handles single staff member", () => {
    const result = evaluateStaffHouseMeetingReadiness([makeStaff()]);
    expect(result.overallScore).toBe(25);
    expect(result.totalStaff).toBe(1);
  });

  it("caps at 25", () => {
    const staff = Array.from({ length: 20 }, (_, i) => makeStaff({ staffId: `s-${i}` }));
    const result = evaluateStaffHouseMeetingReadiness(staff);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Child Meeting Profiles
// ══════════════════════════════════════════════════════════════════════════════

describe("buildChildHouseMeetingProfiles", () => {
  it("builds profiles grouped by child", () => {
    const records = [
      makeRecord({ id: "hm-1", childId: "child-alex", childName: "Alex" }),
      makeRecord({ id: "hm-2", childId: "child-jordan", childName: "Jordan" }),
      makeRecord({ id: "hm-3", childId: "child-alex", childName: "Alex" }),
    ];
    const profiles = buildChildHouseMeetingProfiles(records);
    expect(profiles).toHaveLength(2);
    const alex = profiles.find(p => p.childId === "child-alex")!;
    expect(alex.totalRecords).toBe(2);
    expect(alex.childName).toBe("Alex");
  });

  it("returns empty for no records", () => {
    expect(buildChildHouseMeetingProfiles([])).toHaveLength(0);
  });

  it("scores 10 for maximum profile", () => {
    // freq >=10 → 2, rate1 100% → 3, rate2 100% → 3, diversity >=4 → 2 = 10
    const cats: HouseMeetingRecord["category"][] = [
      "house_meeting", "childrens_council", "menu_planning", "activity_planning",
      "rules_review", "agenda_setting", "action_review", "special_topic",
      "house_meeting", "childrens_council",
    ];
    const records = cats.map((category, i) => makeRecord({
      id: `hm-${i}`,
      childId: "child-alex",
      childName: "Alex",
      category,
    }));
    const profiles = buildChildHouseMeetingProfiles(records);
    expect(profiles[0].overallScore).toBe(10);
  });

  it("scores 0 for minimal failing profile", () => {
    // 1 record, all false, single category
    const records = [makeRecord({
      childContributedToAgenda: false,
      childAttended: false,
    })];
    const profiles = buildChildHouseMeetingProfiles(records);
    // freq <5 → 0, rate1 0% → 0, rate2 0% → 0, diversity 1 → 0
    expect(profiles[0].overallScore).toBe(0);
  });

  it("awards freq score 1 at 5 records", () => {
    const records = Array.from({ length: 5 }, (_, i) => makeRecord({
      id: `hm-${i}`,
      childId: "child-alex",
      childName: "Alex",
      childContributedToAgenda: false,
      childAttended: false,
    }));
    const profiles = buildChildHouseMeetingProfiles(records);
    // freq=5 → 1, rate1=0→0, rate2=0→0, div=1→0
    expect(profiles[0].overallScore).toBe(1);
  });

  it("awards rate1 score 1 at 40%", () => {
    const records = [
      makeRecord({ id: "hm-1", childContributedToAgenda: true, childAttended: false }),
      makeRecord({ id: "hm-2", childContributedToAgenda: true, childAttended: false }),
      makeRecord({ id: "hm-3", childContributedToAgenda: false, childAttended: false }),
      makeRecord({ id: "hm-4", childContributedToAgenda: false, childAttended: false }),
      makeRecord({ id: "hm-5", childContributedToAgenda: false, childAttended: false }),
    ];
    const profiles = buildChildHouseMeetingProfiles(records);
    expect(profiles[0].childAgendaContributionRate).toBe(40);
    // freq=5→1, rate1=40→1, rate2=0→0, div=1→0 = 2
    expect(profiles[0].overallScore).toBe(2);
  });

  it("awards diversity score 1 at 2 categories", () => {
    const records = [
      makeRecord({ id: "hm-1", category: "house_meeting", childContributedToAgenda: false, childAttended: false }),
      makeRecord({ id: "hm-2", category: "childrens_council", childContributedToAgenda: false, childAttended: false }),
    ];
    const profiles = buildChildHouseMeetingProfiles(records);
    // freq <5→0, rate1=0→0, rate2=0→0, div=2→1
    expect(profiles[0].overallScore).toBe(1);
  });

  it("sorts profiles by overall score descending", () => {
    const records = [
      ...Array.from({ length: 10 }, (_, i) => makeRecord({ id: `a-${i}`, childId: "child-alex", childName: "Alex" })),
      makeRecord({ id: "j-1", childId: "child-jordan", childName: "Jordan", childContributedToAgenda: false, childAttended: false }),
    ];
    const profiles = buildChildHouseMeetingProfiles(records);
    expect(profiles[0].childId).toBe("child-alex");
    expect(profiles[0].overallScore).toBeGreaterThan(profiles[1].overallScore);
  });

  it("lists categories covered", () => {
    const records = [
      makeRecord({ id: "hm-1", category: "house_meeting" }),
      makeRecord({ id: "hm-2", category: "menu_planning" }),
      makeRecord({ id: "hm-3", category: "house_meeting" }), // duplicate
    ];
    const profiles = buildChildHouseMeetingProfiles(records);
    expect(profiles[0].categoriesCovered).toContain("house_meeting");
    expect(profiles[0].categoriesCovered).toContain("menu_planning");
    expect(profiles[0].categoriesCovered).toHaveLength(2);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Orchestrator
// ══════════════════════════════════════════════════════════════════════════════

describe("generateHouseMeetingsIntelligence", () => {
  const fullInput = {
    homeId: "home-oak",
    periodStart: "2026-01-01",
    periodEnd: "2026-05-20",
    records: makeAllCategoryRecords(),
    policy: ALL_TRUE_POLICY,
    staff: [makeStaff({ staffId: "s1" }), makeStaff({ staffId: "s2" }), makeStaff({ staffId: "s3" })],
  };

  it("returns outstanding for perfect input", () => {
    const result = generateHouseMeetingsIntelligence(fullInput);
    expect(result.overallScore).toBe(100);
    expect(result.rating).toBe("outstanding");
    expect(result.homeId).toBe("home-oak");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-20");
  });

  it("returns inadequate for empty records with null policy and no staff", () => {
    const result = generateHouseMeetingsIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records: [],
      policy: null,
      staff: [],
    });
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
  });

  it("returns good for decent but not perfect data", () => {
    const records = [
      makeRecord({ id: "hm-1", category: "house_meeting" }),
      makeRecord({ id: "hm-2", category: "childrens_council", childContributedToAgenda: false, actionsReviewed: false }),
      makeRecord({ id: "hm-3", category: "menu_planning", childContributedToAgenda: false, minutesRecorded: false, documentationComplete: false }),
      makeRecord({ id: "hm-4", category: "activity_planning", minutesRecorded: false, childAttended: false, timelyRecording: false }),
    ];
    const result = generateHouseMeetingsIntelligence({
      ...fullInput,
      records,
      policy: { ...ALL_FALSE_POLICY, houseMeetingPolicy: true, meetingFrequencyGuidance: true, childParticipationFramework: true, minutesAccessibilityPolicy: true },
      staff: [makeStaff({ staffId: "s1", conflictResolution: false, inclusivePractice: false }), makeStaff({ staffId: "s2", meetingFacilitation: false, childParticipation: false, minutesTaking: false, actionTracking: false })],
    });
    expect(result.rating).toBe("good");
    expect(result.overallScore).toBeGreaterThanOrEqual(60);
    expect(result.overallScore).toBeLessThan(80);
  });

  it("returns requires_improvement for weak data", () => {
    const records = [
      makeRecord({ id: "hm-1", childContributedToAgenda: false, actionsReviewed: false }),
      makeRecord({ id: "hm-2", minutesRecorded: false, childAttended: false, documentationComplete: false }),
    ];
    const result = generateHouseMeetingsIntelligence({
      ...fullInput,
      records,
      policy: { ...ALL_FALSE_POLICY, houseMeetingPolicy: true, meetingFrequencyGuidance: true },
      staff: [makeStaff({ staffId: "s1", meetingFacilitation: false, childParticipation: false, minutesTaking: false })],
    });
    expect(result.rating).toBe("requires_improvement");
  });

  it("caps overallScore at 100", () => {
    const result = generateHouseMeetingsIntelligence(fullInput);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("includes child profiles", () => {
    const result = generateHouseMeetingsIntelligence(fullInput);
    expect(result.childProfiles.length).toBeGreaterThan(0);
  });

  it("includes regulatory links", () => {
    const result = generateHouseMeetingsIntelligence(fullInput);
    expect(result.regulatoryLinks).toHaveLength(7);
    expect(result.regulatoryLinks[0]).toContain("CHR 2015 Reg 7");
  });

  it("generates strengths for high scores", () => {
    const result = generateHouseMeetingsIntelligence(fullInput);
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("generates areas for improvement for low scores", () => {
    const records = [makeRecord({
      childContributedToAgenda: false,
      minutesRecorded: false,
      childAttended: false,
      actionsReviewed: false,
      documentationComplete: false,
      timelyRecording: false,
    })];
    const result = generateHouseMeetingsIntelligence({
      ...fullInput,
      records,
      policy: null,
      staff: [makeStaff({ staffId: "s1", meetingFacilitation: false, childParticipation: false, minutesTaking: false, actionTracking: false, conflictResolution: false, inclusivePractice: false })],
    });
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("generates urgent actions for critical failures", () => {
    const result = generateHouseMeetingsIntelligence({
      ...fullInput,
      records: [],
      policy: null,
      staff: [],
    });
    expect(result.actions.some(a => a.startsWith("URGENT"))).toBe(true);
  });

  it("all four evaluators contribute to overall score", () => {
    const result = generateHouseMeetingsIntelligence(fullInput);
    expect(result.houseMeetingQuality.overallScore).toBe(25);
    expect(result.houseMeetingCompliance.overallScore).toBe(25);
    expect(result.houseMeetingPolicy.overallScore).toBe(25);
    expect(result.staffReadiness.overallScore).toBe(25);
  });

  it("handles records with multiple children", () => {
    const records = [
      makeRecord({ id: "hm-1", childId: "child-alex", childName: "Alex" }),
      makeRecord({ id: "hm-2", childId: "child-jordan", childName: "Jordan" }),
      makeRecord({ id: "hm-3", childId: "child-morgan", childName: "Morgan" }),
    ];
    const result = generateHouseMeetingsIntelligence({ ...fullInput, records });
    expect(result.childProfiles).toHaveLength(3);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Additional edge cases
// ══════════════════════════════════════════════════════════════════════════════

describe("edge cases", () => {
  it("quality: two out of four flags true", () => {
    const records = [makeRecord({
      childContributedToAgenda: true,   // 7
      minutesRecorded: false,
      childAttended: true,              // 6
      actionsReviewed: false,
    })];
    const result = evaluateHouseMeetingQuality(records);
    expect(result.overallScore).toBe(13); // 7 + 6
  });

  it("compliance: 4 categories out of 8", () => {
    const records = [
      makeRecord({ id: "hm-1", category: "house_meeting" }),
      makeRecord({ id: "hm-2", category: "childrens_council" }),
      makeRecord({ id: "hm-3", category: "menu_planning" }),
      makeRecord({ id: "hm-4", category: "activity_planning" }),
    ];
    const result = evaluateHouseMeetingCompliance(records);
    expect(result.categoryDiversityRatio).toBe(50);
  });

  it("policy: only weight-3 policies true", () => {
    const result = evaluateHouseMeetingPolicy({
      ...ALL_FALSE_POLICY,
      actionTrackingProcedure: true,
      suggestionBoxPolicy: true,
      councilGovernanceFramework: true,
    });
    expect(result.overallScore).toBe(9);
  });

  it("staff: half staff half skills", () => {
    const staff = [
      makeStaff({ staffId: "s1" }),
      makeStaff({ staffId: "s2", meetingFacilitation: false, childParticipation: false, minutesTaking: false, actionTracking: false, conflictResolution: false, inclusivePractice: false }),
    ];
    const result = evaluateStaffHouseMeetingReadiness(staff);
    expect(result.meetingFacilitationRate).toBe(50);
    // raw = 3 + 2.5 + 2.5 + 2 + 1.5 + 1 = 12.5 → 13
    expect(result.overallScore).toBe(13);
  });

  it("child profile: rate2 at exactly 60%", () => {
    // 3 out of 5 = 60%
    const records = [
      makeRecord({ id: "hm-1", childAttended: true, childContributedToAgenda: false }),
      makeRecord({ id: "hm-2", childAttended: true, childContributedToAgenda: false }),
      makeRecord({ id: "hm-3", childAttended: true, childContributedToAgenda: false }),
      makeRecord({ id: "hm-4", childAttended: false, childContributedToAgenda: false }),
      makeRecord({ id: "hm-5", childAttended: false, childContributedToAgenda: false }),
    ];
    const profiles = buildChildHouseMeetingProfiles(records);
    expect(profiles[0].childAttendanceRate).toBe(60);
    // freq=5→1, rate1=0→0, rate2=60→2, div=1→0 = 3
    expect(profiles[0].overallScore).toBe(3);
  });

  it("child profile: rate1 at exactly 80%", () => {
    // 4 out of 5 = 80%
    const records = [
      makeRecord({ id: "hm-1", childContributedToAgenda: true, childAttended: false }),
      makeRecord({ id: "hm-2", childContributedToAgenda: true, childAttended: false }),
      makeRecord({ id: "hm-3", childContributedToAgenda: true, childAttended: false }),
      makeRecord({ id: "hm-4", childContributedToAgenda: true, childAttended: false }),
      makeRecord({ id: "hm-5", childContributedToAgenda: false, childAttended: false }),
    ];
    const profiles = buildChildHouseMeetingProfiles(records);
    expect(profiles[0].childAgendaContributionRate).toBe(80);
    // freq=5→1, rate1=80→3, rate2=0→0, div=1→0 = 4
    expect(profiles[0].overallScore).toBe(4);
  });

  it("orchestrator: strengths empty when scores low", () => {
    const result = generateHouseMeetingsIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records: [makeRecord({ childContributedToAgenda: false, minutesRecorded: false, childAttended: false, actionsReviewed: false, documentationComplete: false, timelyRecording: false })],
      policy: ALL_FALSE_POLICY,
      staff: [makeStaff({ staffId: "s1", meetingFacilitation: false, childParticipation: false, minutesTaking: false, actionTracking: false, conflictResolution: false, inclusivePractice: false })],
    });
    expect(result.strengths).toHaveLength(0);
  });

  it("orchestrator: no actions when everything perfect", () => {
    const result = generateHouseMeetingsIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records: makeAllCategoryRecords(),
      policy: ALL_TRUE_POLICY,
      staff: [makeStaff({ staffId: "s1" }), makeStaff({ staffId: "s2" })],
    });
    expect(result.actions).toHaveLength(0);
  });
});
