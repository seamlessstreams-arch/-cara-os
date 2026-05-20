import { describe, it, expect } from "vitest";
import {
  evaluateParticipationQuality,
  evaluateParticipationCompliance,
  evaluateParticipationPolicy,
  evaluateStaffParticipationReadiness,
  buildChildParticipationProfiles,
  generateParticipationIntelligence,
  pct,
  getRating,
  getParticipationCategoryLabel,
  getParticipationOutcomeLabel,
  getRatingLabel,
} from "../participation-engine";
import type {
  ParticipationRecord,
  ParticipationPolicy,
  StaffParticipationTraining,
} from "../participation-engine";

// ── Fixtures ──────────────────────────────────────────────────────────────

function makeRecord(overrides: Partial<ParticipationRecord> = {}): ParticipationRecord {
  return {
    id: "pr-001",
    homeId: "home-oak",
    date: "2026-05-10",
    childId: "child-alex",
    childName: "Alex",
    category: "care_plan_voice",
    outcome: "views_acted_upon",
    childViewRecorded: true,
    viewsActedUpon: true,
    advocacyOffered: true,
    feedbackProvided: true,
    documentationComplete: true,
    timelyRecording: true,
    ...overrides,
  };
}

function makeAllCategoryRecords(): ParticipationRecord[] {
  const cats: ParticipationRecord["category"][] = [
    "care_plan_voice", "advocacy_access", "complaints_awareness", "house_meeting_input",
    "review_participation", "daily_decisions", "feedback_mechanism", "rights_education",
  ];
  return cats.map((category, i) => makeRecord({ id: `pr-${i}`, category }));
}

const ALL_TRUE_POLICY: ParticipationPolicy = {
  participationPolicy: true,
  advocacyAccessPolicy: true,
  complaintsAwarenessFramework: true,
  childVoiceInCarePlanning: true,
  feedbackMechanismPolicy: true,
  rightsEducationPolicy: true,
  independentVisitorScheme: true,
};

const ALL_FALSE_POLICY: ParticipationPolicy = {
  participationPolicy: false,
  advocacyAccessPolicy: false,
  complaintsAwarenessFramework: false,
  childVoiceInCarePlanning: false,
  feedbackMechanismPolicy: false,
  rightsEducationPolicy: false,
  independentVisitorScheme: false,
};

function makeStaff(overrides: Partial<StaffParticipationTraining> = {}): StaffParticipationTraining {
  return {
    staffId: "staff-sarah",
    childVoiceCapture: true,
    advocacyKnowledge: true,
    participationFacilitation: true,
    complaintsAwareness: true,
    rightsBasedPractice: true,
    feedbackResponsiveness: true,
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// pct helper
// ══════════════════════════════════════════════════════════════════════════════

describe("pct", () => {
  it("returns percentage", () => expect(pct(3, 4)).toBe(75));
  it("returns 0 when den is 0", () => expect(pct(5, 0)).toBe(0));
  it("returns 100 for equal values", () => expect(pct(10, 10)).toBe(100));
  it("returns 0 for zero numerator", () => expect(pct(0, 10)).toBe(0));
  it("rounds correctly", () => { expect(pct(1, 3)).toBe(33); expect(pct(2, 3)).toBe(67); });
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

describe("getParticipationCategoryLabel", () => {
  it("care_plan_voice", () => expect(getParticipationCategoryLabel("care_plan_voice")).toBe("Care Plan Voice"));
  it("advocacy_access", () => expect(getParticipationCategoryLabel("advocacy_access")).toBe("Advocacy Access"));
  it("rights_education", () => expect(getParticipationCategoryLabel("rights_education")).toBe("Rights Education"));
});

describe("getParticipationOutcomeLabel", () => {
  it("views_acted_upon", () => expect(getParticipationOutcomeLabel("views_acted_upon")).toBe("Views Acted Upon"));
  it("child_declined", () => expect(getParticipationOutcomeLabel("child_declined")).toBe("Child Declined"));
});

describe("getRatingLabel", () => {
  it("Outstanding", () => expect(getRatingLabel("outstanding")).toBe("Outstanding"));
  it("Requires Improvement", () => expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement"));
});

// ══════════════════════════════════════════════════════════════════════════════
// Quality
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateParticipationQuality", () => {
  it("returns 25 for perfect records", () => {
    const result = evaluateParticipationQuality(Array.from({ length: 10 }, (_, i) => makeRecord({ id: `pr-${i}` })));
    expect(result.overallScore).toBe(25);
    expect(result.childViewRecordedRate).toBe(100);
    expect(result.viewsActedUponRate).toBe(100);
    expect(result.advocacyOfferedRate).toBe(100);
    expect(result.feedbackProvidedRate).toBe(100);
  });

  it("returns 0 for empty", () => {
    const result = evaluateParticipationQuality([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalRecords).toBe(0);
  });

  it("returns 0 when all flags false", () => {
    const result = evaluateParticipationQuality([makeRecord({ childViewRecorded: false, viewsActedUpon: false, advocacyOffered: false, feedbackProvided: false })]);
    expect(result.overallScore).toBe(0);
  });

  it("weights childViewRecordedRate at 7", () => {
    const result = evaluateParticipationQuality([makeRecord({ viewsActedUpon: false, advocacyOffered: false, feedbackProvided: false })]);
    expect(result.overallScore).toBe(7);
  });

  it("weights viewsActedUponRate at 6", () => {
    const result = evaluateParticipationQuality([makeRecord({ childViewRecorded: false, advocacyOffered: false, feedbackProvided: false })]);
    expect(result.overallScore).toBe(6);
  });

  it("weights advocacyOfferedRate at 6", () => {
    const result = evaluateParticipationQuality([makeRecord({ childViewRecorded: false, viewsActedUpon: false, feedbackProvided: false })]);
    expect(result.overallScore).toBe(6);
  });

  it("weights feedbackProvidedRate at 6", () => {
    const result = evaluateParticipationQuality([makeRecord({ childViewRecorded: false, viewsActedUpon: false, advocacyOffered: false })]);
    expect(result.overallScore).toBe(6);
  });

  it("handles partial data", () => {
    const records = [makeRecord({ id: "pr-1" }), makeRecord({ id: "pr-2", childViewRecorded: false, viewsActedUpon: false })];
    const result = evaluateParticipationQuality(records);
    expect(result.childViewRecordedRate).toBe(50);
    expect(result.viewsActedUponRate).toBe(50);
    expect(result.advocacyOfferedRate).toBe(100);
  });

  it("caps at 25", () => {
    const result = evaluateParticipationQuality(Array.from({ length: 100 }, (_, i) => makeRecord({ id: `pr-${i}` })));
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Compliance
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateParticipationCompliance", () => {
  it("returns 25 for perfect records with all categories", () => {
    const result = evaluateParticipationCompliance(makeAllCategoryRecords());
    expect(result.overallScore).toBe(25);
    expect(result.categoryDiversityRatio).toBe(100);
  });

  it("returns 0 for empty", () => {
    const result = evaluateParticipationCompliance([]);
    expect(result.overallScore).toBe(0);
  });

  it("weights documentationRate at 8", () => {
    const result = evaluateParticipationCompliance([makeRecord({ timelyRecording: false, viewsActedUpon: false })]);
    expect(result.documentationRate).toBe(100);
  });

  it("calculates diversity for single category", () => {
    const result = evaluateParticipationCompliance([makeRecord()]);
    expect(result.categoryDiversityRatio).toBe(13);
  });

  it("handles all 8 categories", () => {
    const result = evaluateParticipationCompliance(makeAllCategoryRecords());
    expect(result.categoryDiversityRatio).toBe(100);
  });

  it("caps at 25", () => {
    const result = evaluateParticipationCompliance(makeAllCategoryRecords());
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("handles partial compliance flags", () => {
    const records = [makeRecord({ id: "pr-1" }), makeRecord({ id: "pr-2", documentationComplete: false })];
    const result = evaluateParticipationCompliance(records);
    expect(result.documentationRate).toBe(50);
    expect(result.timelyRecordingRate).toBe(100);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Policy
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateParticipationPolicy", () => {
  it("returns 25 when all true", () => expect(evaluateParticipationPolicy(ALL_TRUE_POLICY).overallScore).toBe(25));
  it("returns 0 when all false", () => expect(evaluateParticipationPolicy(ALL_FALSE_POLICY).overallScore).toBe(0));
  it("returns 0 when null", () => {
    const result = evaluateParticipationPolicy(null);
    expect(result.overallScore).toBe(0);
    expect(result.participationPolicy).toBe(false);
  });

  it("weights first 4 at 4 each", () => {
    const result = evaluateParticipationPolicy({ ...ALL_FALSE_POLICY, participationPolicy: true });
    expect(result.overallScore).toBe(4);
  });

  it("weights last 3 at 3 each", () => {
    const result = evaluateParticipationPolicy({ ...ALL_FALSE_POLICY, feedbackMechanismPolicy: true });
    expect(result.overallScore).toBe(3);
  });

  it("handles mixed booleans", () => {
    const result = evaluateParticipationPolicy({ ...ALL_FALSE_POLICY, participationPolicy: true, advocacyAccessPolicy: true, feedbackMechanismPolicy: true });
    expect(result.overallScore).toBe(11);
  });

  it("returns all flags in result", () => {
    const result = evaluateParticipationPolicy(ALL_TRUE_POLICY);
    expect(result.participationPolicy).toBe(true);
    expect(result.independentVisitorScheme).toBe(true);
  });

  it("caps at 25", () => {
    expect(evaluateParticipationPolicy(ALL_TRUE_POLICY).overallScore).toBeLessThanOrEqual(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Staff Readiness
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateStaffParticipationReadiness", () => {
  it("returns 25 when all staff have all skills", () => {
    const result = evaluateStaffParticipationReadiness([makeStaff({ staffId: "s1" }), makeStaff({ staffId: "s2" })]);
    expect(result.overallScore).toBe(25);
  });

  it("returns 0 for empty staff", () => {
    const result = evaluateStaffParticipationReadiness([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalStaff).toBe(0);
  });

  it("returns 0 when no skills", () => {
    const result = evaluateStaffParticipationReadiness([makeStaff({ childVoiceCapture: false, advocacyKnowledge: false, participationFacilitation: false, complaintsAwareness: false, rightsBasedPractice: false, feedbackResponsiveness: false })]);
    expect(result.overallScore).toBe(0);
  });

  it("weights childVoiceCapture at 6", () => {
    const result = evaluateStaffParticipationReadiness([makeStaff({ advocacyKnowledge: false, participationFacilitation: false, complaintsAwareness: false, rightsBasedPractice: false, feedbackResponsiveness: false })]);
    expect(result.overallScore).toBe(6);
  });

  it("weights feedbackResponsiveness at 2", () => {
    const result = evaluateStaffParticipationReadiness([makeStaff({ childVoiceCapture: false, advocacyKnowledge: false, participationFacilitation: false, complaintsAwareness: false, rightsBasedPractice: false })]);
    expect(result.overallScore).toBe(2);
  });

  it("calculates mixed rates", () => {
    const staff = [makeStaff({ staffId: "s1" }), makeStaff({ staffId: "s2", childVoiceCapture: false, advocacyKnowledge: false })];
    const result = evaluateStaffParticipationReadiness(staff);
    expect(result.childVoiceCaptureRate).toBe(50);
    expect(result.advocacyKnowledgeRate).toBe(50);
    expect(result.participationFacilitationRate).toBe(100);
  });

  it("caps at 25", () => {
    const result = evaluateStaffParticipationReadiness(Array.from({ length: 20 }, (_, i) => makeStaff({ staffId: `s-${i}` })));
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Child Profiles
// ══════════════════════════════════════════════════════════════════════════════

describe("buildChildParticipationProfiles", () => {
  it("groups by child", () => {
    const records = [
      makeRecord({ id: "pr-1", childId: "child-alex", childName: "Alex" }),
      makeRecord({ id: "pr-2", childId: "child-jordan", childName: "Jordan" }),
      makeRecord({ id: "pr-3", childId: "child-alex", childName: "Alex" }),
    ];
    const profiles = buildChildParticipationProfiles(records);
    expect(profiles).toHaveLength(2);
    expect(profiles.find(p => p.childId === "child-alex")!.totalRecords).toBe(2);
  });

  it("empty for no records", () => expect(buildChildParticipationProfiles([])).toHaveLength(0));

  it("scores 10 for max profile", () => {
    const cats: ParticipationRecord["category"][] = [
      "care_plan_voice", "advocacy_access", "complaints_awareness", "house_meeting_input",
      "review_participation", "daily_decisions", "feedback_mechanism", "rights_education",
      "care_plan_voice", "advocacy_access",
    ];
    const records = cats.map((category, i) => makeRecord({ id: `pr-${i}`, childId: "child-alex", childName: "Alex", category }));
    expect(buildChildParticipationProfiles(records)[0].overallScore).toBe(10);
  });

  it("scores 0 for minimal failing profile", () => {
    const records = [makeRecord({ childViewRecorded: false, viewsActedUpon: false })];
    expect(buildChildParticipationProfiles(records)[0].overallScore).toBe(0);
  });

  it("freq score 1 at 5 records", () => {
    const records = Array.from({ length: 5 }, (_, i) => makeRecord({ id: `pr-${i}`, childViewRecorded: false, viewsActedUpon: false }));
    expect(buildChildParticipationProfiles(records)[0].overallScore).toBe(1);
  });

  it("rate1 score 1 at 40%", () => {
    const records = [
      makeRecord({ id: "pr-1", childViewRecorded: true, viewsActedUpon: false }),
      makeRecord({ id: "pr-2", childViewRecorded: true, viewsActedUpon: false }),
      makeRecord({ id: "pr-3", childViewRecorded: false, viewsActedUpon: false }),
      makeRecord({ id: "pr-4", childViewRecorded: false, viewsActedUpon: false }),
      makeRecord({ id: "pr-5", childViewRecorded: false, viewsActedUpon: false }),
    ];
    const profiles = buildChildParticipationProfiles(records);
    expect(profiles[0].childViewRecordedRate).toBe(40);
    expect(profiles[0].overallScore).toBe(2);
  });

  it("diversity score 1 at 2 categories", () => {
    const records = [
      makeRecord({ id: "pr-1", category: "care_plan_voice", childViewRecorded: false, viewsActedUpon: false }),
      makeRecord({ id: "pr-2", category: "advocacy_access", childViewRecorded: false, viewsActedUpon: false }),
    ];
    expect(buildChildParticipationProfiles(records)[0].overallScore).toBe(1);
  });

  it("sorts by score descending", () => {
    const records = [
      ...Array.from({ length: 10 }, (_, i) => makeRecord({ id: `a-${i}`, childId: "child-alex", childName: "Alex" })),
      makeRecord({ id: "j-1", childId: "child-jordan", childName: "Jordan", childViewRecorded: false, viewsActedUpon: false }),
    ];
    const profiles = buildChildParticipationProfiles(records);
    expect(profiles[0].childId).toBe("child-alex");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Orchestrator
// ══════════════════════════════════════════════════════════════════════════════

describe("generateParticipationIntelligence", () => {
  const fullInput = {
    homeId: "home-oak",
    periodStart: "2026-01-01",
    periodEnd: "2026-05-20",
    records: makeAllCategoryRecords(),
    policy: ALL_TRUE_POLICY,
    staff: [makeStaff({ staffId: "s1" }), makeStaff({ staffId: "s2" }), makeStaff({ staffId: "s3" })],
  };

  it("outstanding for perfect input", () => {
    const result = generateParticipationIntelligence(fullInput);
    expect(result.overallScore).toBe(100);
    expect(result.rating).toBe("outstanding");
  });

  it("inadequate for empty", () => {
    const result = generateParticipationIntelligence({ homeId: "h", periodStart: "s", periodEnd: "e", records: [], policy: null, staff: [] });
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
  });

  it("good for decent data", () => {
    const records = [
      makeRecord({ id: "pr-1", category: "care_plan_voice" }),
      makeRecord({ id: "pr-2", category: "advocacy_access", childViewRecorded: false, feedbackProvided: false, documentationComplete: false }),
      makeRecord({ id: "pr-3", category: "complaints_awareness", viewsActedUpon: false, advocacyOffered: false, timelyRecording: false }),
      makeRecord({ id: "pr-4", category: "house_meeting_input", childViewRecorded: false, viewsActedUpon: false }),
    ];
    const result = generateParticipationIntelligence({
      ...fullInput,
      records,
      policy: { ...ALL_FALSE_POLICY, participationPolicy: true, advocacyAccessPolicy: true, complaintsAwarenessFramework: true, childVoiceInCarePlanning: true },
      staff: [makeStaff({ staffId: "s1", rightsBasedPractice: false, feedbackResponsiveness: false }), makeStaff({ staffId: "s2", childVoiceCapture: false, advocacyKnowledge: false, participationFacilitation: false, complaintsAwareness: false })],
    });
    expect(result.rating).toBe("good");
    expect(result.overallScore).toBeGreaterThanOrEqual(60);
    expect(result.overallScore).toBeLessThan(80);
  });

  it("caps at 100", () => expect(generateParticipationIntelligence(fullInput).overallScore).toBeLessThanOrEqual(100));

  it("includes child profiles", () => expect(generateParticipationIntelligence(fullInput).childProfiles.length).toBeGreaterThan(0));

  it("includes 7 regulatory links", () => {
    const result = generateParticipationIntelligence(fullInput);
    expect(result.regulatoryLinks).toHaveLength(7);
    expect(result.regulatoryLinks[0]).toContain("CHR 2015 Reg 7");
  });

  it("generates strengths for high scores", () => expect(generateParticipationIntelligence(fullInput).strengths.length).toBeGreaterThan(0));

  it("generates areas for improvement for low scores", () => {
    const result = generateParticipationIntelligence({
      ...fullInput,
      records: [makeRecord({ childViewRecorded: false, viewsActedUpon: false, advocacyOffered: false, feedbackProvided: false, documentationComplete: false, timelyRecording: false })],
      policy: null,
      staff: [makeStaff({ staffId: "s1", childVoiceCapture: false, advocacyKnowledge: false, participationFacilitation: false, complaintsAwareness: false, rightsBasedPractice: false, feedbackResponsiveness: false })],
    });
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("generates URGENT actions for empty records", () => {
    const result = generateParticipationIntelligence({ ...fullInput, records: [], policy: null, staff: [] });
    expect(result.actions.some(a => a.startsWith("URGENT"))).toBe(true);
  });

  it("all 4 evaluators contribute", () => {
    const result = generateParticipationIntelligence(fullInput);
    expect(result.participationQuality.overallScore).toBe(25);
    expect(result.participationCompliance.overallScore).toBe(25);
    expect(result.participationPolicy.overallScore).toBe(25);
    expect(result.staffReadiness.overallScore).toBe(25);
  });

  it("no actions when perfect", () => expect(generateParticipationIntelligence(fullInput).actions).toHaveLength(0));

  it("no strengths when all low", () => {
    const result = generateParticipationIntelligence({
      ...fullInput,
      records: [makeRecord({ childViewRecorded: false, viewsActedUpon: false, advocacyOffered: false, feedbackProvided: false, documentationComplete: false, timelyRecording: false })],
      policy: ALL_FALSE_POLICY,
      staff: [makeStaff({ staffId: "s1", childVoiceCapture: false, advocacyKnowledge: false, participationFacilitation: false, complaintsAwareness: false, rightsBasedPractice: false, feedbackResponsiveness: false })],
    });
    expect(result.strengths).toHaveLength(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Additional edge cases
// ══════════════════════════════════════════════════════════════════════════════

describe("edge cases", () => {
  it("quality: two flags true", () => {
    const result = evaluateParticipationQuality([makeRecord({ viewsActedUpon: false, feedbackProvided: false })]);
    expect(result.overallScore).toBe(13);
  });

  it("compliance: 4 categories = 50% diversity", () => {
    const records = [
      makeRecord({ id: "pr-1", category: "care_plan_voice" }),
      makeRecord({ id: "pr-2", category: "advocacy_access" }),
      makeRecord({ id: "pr-3", category: "complaints_awareness" }),
      makeRecord({ id: "pr-4", category: "house_meeting_input" }),
    ];
    expect(evaluateParticipationCompliance(records).categoryDiversityRatio).toBe(50);
  });

  it("policy: only weight-3 policies", () => {
    expect(evaluateParticipationPolicy({ ...ALL_FALSE_POLICY, feedbackMechanismPolicy: true, rightsEducationPolicy: true, independentVisitorScheme: true }).overallScore).toBe(9);
  });

  it("staff: half staff half skills", () => {
    const staff = [
      makeStaff({ staffId: "s1" }),
      makeStaff({ staffId: "s2", childVoiceCapture: false, advocacyKnowledge: false, participationFacilitation: false, complaintsAwareness: false, rightsBasedPractice: false, feedbackResponsiveness: false }),
    ];
    const result = evaluateStaffParticipationReadiness(staff);
    expect(result.childVoiceCaptureRate).toBe(50);
    expect(result.overallScore).toBe(13);
  });

  it("child profile: rate2 at exactly 60%", () => {
    const records = [
      makeRecord({ id: "pr-1", viewsActedUpon: true, childViewRecorded: false }),
      makeRecord({ id: "pr-2", viewsActedUpon: true, childViewRecorded: false }),
      makeRecord({ id: "pr-3", viewsActedUpon: true, childViewRecorded: false }),
      makeRecord({ id: "pr-4", viewsActedUpon: false, childViewRecorded: false }),
      makeRecord({ id: "pr-5", viewsActedUpon: false, childViewRecorded: false }),
    ];
    const profiles = buildChildParticipationProfiles(records);
    expect(profiles[0].viewsActedUponRate).toBe(60);
    expect(profiles[0].overallScore).toBe(3);
  });

  it("child profile: rate1 at exactly 80%", () => {
    const records = [
      makeRecord({ id: "pr-1", childViewRecorded: true, viewsActedUpon: false }),
      makeRecord({ id: "pr-2", childViewRecorded: true, viewsActedUpon: false }),
      makeRecord({ id: "pr-3", childViewRecorded: true, viewsActedUpon: false }),
      makeRecord({ id: "pr-4", childViewRecorded: true, viewsActedUpon: false }),
      makeRecord({ id: "pr-5", childViewRecorded: false, viewsActedUpon: false }),
    ];
    const profiles = buildChildParticipationProfiles(records);
    expect(profiles[0].childViewRecordedRate).toBe(80);
    expect(profiles[0].overallScore).toBe(4);
  });
});
