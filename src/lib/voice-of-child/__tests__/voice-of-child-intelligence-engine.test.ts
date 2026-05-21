import { describe, it, expect } from "vitest";
import {
  evaluateVoiceOfChildQuality,
  evaluateVoiceOfChildCompliance,
  evaluateVoiceOfChildPolicy,
  evaluateStaffVoiceOfChildReadiness,
  buildChildVoiceOfChildProfiles,
  generateVoiceOfChildIntelligenceReport,
  pct,
  getRating,
  getVoiceOfChildCategoryLabel,
  getVoiceOfChildOutcomeLabel,
  getRatingLabel,
  type VoiceOfChildRecord,
  type VoiceOfChildPolicy,
  type StaffVoiceOfChildTraining,
  type VoiceOfChildCategory,
} from "../voice-of-child-intelligence-engine";

// ── Helpers ──────────────────────────────────────────────────────────────────

function rec(overrides: Partial<VoiceOfChildRecord> = {}): VoiceOfChildRecord {
  return {
    id: "rec-1",
    homeId: "home-oak-house",
    date: "2025-06-15",
    childId: "child-alex",
    childName: "Alex",
    category: "wishes_feelings_capture",
    outcome: "voice_influenced_decision",
    wishesFeelingsRecorded: true,
    childDirectlyConsulted: true,
    voiceInfluencedOutcome: true,
    ageAppropriateMethod: true,
    documentationComplete: true,
    timelyRecording: true,
    ...overrides,
  };
}

function fullPolicy(): VoiceOfChildPolicy {
  return {
    wishesFeelingsPolicy: true,
    advocacyAccessPolicy: true,
    complaintVoicePolicy: true,
    participationFramework: true,
    ageAppropriateMethodsPolicy: true,
    independentAdvocacyArrangement: true,
    childFeedbackMechanism: true,
  };
}

function staff(overrides: Partial<StaffVoiceOfChildTraining> = {}): StaffVoiceOfChildTraining {
  return {
    staffId: "staff-sarah",
    wishesFeelingsCapture: true,
    activeListeningSkills: true,
    ageAppropriateEngagement: true,
    advocacyAwareness: true,
    participationFacilitation: true,
    nonVerbalCommunication: true,
    ...overrides,
  };
}

const ALL_CATEGORIES: VoiceOfChildCategory[] = [
  "wishes_feelings_capture", "key_decision_participation", "advocacy_access", "complaint_voice",
  "care_plan_voice", "lac_review_participation", "house_meeting_voice", "daily_life_choice",
];

// ── pct ─────────────────────────────────────────────────────────────────────

describe("pct", () => {
  it("computes correct percentage", () => { expect(pct(3, 4)).toBe(75); });
  it("returns 0 when den is 0", () => { expect(pct(5, 0)).toBe(0); });
  it("rounds to nearest integer", () => { expect(pct(1, 3)).toBe(33); expect(pct(2, 3)).toBe(67); });
  it("handles 100%", () => { expect(pct(10, 10)).toBe(100); });
  it("handles 0 numerator", () => { expect(pct(0, 10)).toBe(0); });
});

// ── getRating ───────────────────────────────────────────────────────────────

describe("getRating", () => {
  it("returns outstanding for >= 80", () => { expect(getRating(80)).toBe("outstanding"); expect(getRating(100)).toBe("outstanding"); });
  it("returns good for >= 60 and < 80", () => { expect(getRating(60)).toBe("good"); expect(getRating(79)).toBe("good"); });
  it("returns requires_improvement for >= 40 and < 60", () => { expect(getRating(40)).toBe("requires_improvement"); expect(getRating(59)).toBe("requires_improvement"); });
  it("returns inadequate for < 40", () => { expect(getRating(0)).toBe("inadequate"); expect(getRating(39)).toBe("inadequate"); });
});

// ── Label functions ─────────────────────────────────────────────────────────

describe("getVoiceOfChildCategoryLabel", () => {
  it("returns correct label for wishes_feelings_capture", () => { expect(getVoiceOfChildCategoryLabel("wishes_feelings_capture")).toBe("Wishes & Feelings Capture"); });
  it("returns correct label for key_decision_participation", () => { expect(getVoiceOfChildCategoryLabel("key_decision_participation")).toBe("Key Decision Participation"); });
  it("returns correct label for advocacy_access", () => { expect(getVoiceOfChildCategoryLabel("advocacy_access")).toBe("Advocacy Access"); });
  it("returns correct label for complaint_voice", () => { expect(getVoiceOfChildCategoryLabel("complaint_voice")).toBe("Complaint Voice"); });
  it("returns correct label for care_plan_voice", () => { expect(getVoiceOfChildCategoryLabel("care_plan_voice")).toBe("Care Plan Voice"); });
  it("returns correct label for lac_review_participation", () => { expect(getVoiceOfChildCategoryLabel("lac_review_participation")).toBe("LAC Review Participation"); });
  it("returns correct label for house_meeting_voice", () => { expect(getVoiceOfChildCategoryLabel("house_meeting_voice")).toBe("House Meeting Voice"); });
  it("returns correct label for daily_life_choice", () => { expect(getVoiceOfChildCategoryLabel("daily_life_choice")).toBe("Daily Life Choice"); });
});

describe("getVoiceOfChildOutcomeLabel", () => {
  it("returns correct label for voice_influenced_decision", () => { expect(getVoiceOfChildOutcomeLabel("voice_influenced_decision")).toBe("Voice Influenced Decision"); });
  it("returns correct label for voice_acknowledged", () => { expect(getVoiceOfChildOutcomeLabel("voice_acknowledged")).toBe("Voice Acknowledged"); });
  it("returns correct label for voice_partially_captured", () => { expect(getVoiceOfChildOutcomeLabel("voice_partially_captured")).toBe("Voice Partially Captured"); });
  it("returns correct label for voice_not_captured", () => { expect(getVoiceOfChildOutcomeLabel("voice_not_captured")).toBe("Voice Not Captured"); });
  it("returns correct label for not_applicable", () => { expect(getVoiceOfChildOutcomeLabel("not_applicable")).toBe("Not Applicable"); });
});

describe("getRatingLabel", () => {
  it("returns correct labels", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ── Evaluator 1: Quality ────────────────────────────────────────────────────

describe("evaluateVoiceOfChildQuality", () => {
  it("returns all zeros for empty records", () => {
    const result = evaluateVoiceOfChildQuality([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalRecords).toBe(0);
    expect(result.wishesFeelingsRecordedRate).toBe(0);
    expect(result.childDirectlyConsultedRate).toBe(0);
    expect(result.voiceInfluencedOutcomeRate).toBe(0);
    expect(result.ageAppropriateMethodRate).toBe(0);
  });

  it("scores max for all-true records", () => {
    const records = [rec(), rec({ id: "rec-2" }), rec({ id: "rec-3" })];
    const result = evaluateVoiceOfChildQuality(records);
    expect(result.overallScore).toBe(25);
    expect(result.wishesFeelingsRecordedRate).toBe(100);
    expect(result.childDirectlyConsultedRate).toBe(100);
  });

  it("scores 0 for all-false records", () => {
    const records = [rec({ wishesFeelingsRecorded: false, childDirectlyConsulted: false, voiceInfluencedOutcome: false, ageAppropriateMethod: false })];
    const result = evaluateVoiceOfChildQuality(records);
    expect(result.overallScore).toBe(0);
    expect(result.totalRecords).toBe(1);
  });

  it("applies correct weights", () => {
    // Only wishesFeelingsRecorded true → 7 points
    const r1 = [rec({ childDirectlyConsulted: false, voiceInfluencedOutcome: false, ageAppropriateMethod: false })];
    expect(evaluateVoiceOfChildQuality(r1).overallScore).toBe(7);

    // Only childDirectlyConsulted true → 6 points
    const r2 = [rec({ wishesFeelingsRecorded: false, voiceInfluencedOutcome: false, ageAppropriateMethod: false })];
    expect(evaluateVoiceOfChildQuality(r2).overallScore).toBe(6);
  });

  it("computes mixed rates correctly", () => {
    const records = [
      rec({ wishesFeelingsRecorded: true, childDirectlyConsulted: true, voiceInfluencedOutcome: false, ageAppropriateMethod: false }),
      rec({ id: "r2", wishesFeelingsRecorded: false, childDirectlyConsulted: false, voiceInfluencedOutcome: true, ageAppropriateMethod: true }),
    ];
    const result = evaluateVoiceOfChildQuality(records);
    expect(result.wishesFeelingsRecordedRate).toBe(50);
    expect(result.childDirectlyConsultedRate).toBe(50);
    expect(result.voiceInfluencedOutcomeRate).toBe(50);
    expect(result.ageAppropriateMethodRate).toBe(50);
  });

  it("caps at 25", () => {
    const result = evaluateVoiceOfChildQuality([rec()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ── Evaluator 2: Compliance ─────────────────────────────────────────────────

describe("evaluateVoiceOfChildCompliance", () => {
  it("returns all zeros for empty records", () => {
    const result = evaluateVoiceOfChildCompliance([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalRecords).toBe(0);
    expect(result.documentationCompleteRate).toBe(0);
    expect(result.timelyRecordingRate).toBe(0);
    expect(result.wishesFeelingsRecordedRate).toBe(0);
    expect(result.categoryDiversityRatio).toBe(0);
    expect(result.uniqueCategories).toBe(0);
  });

  it("scores high for all-true records with full diversity", () => {
    const records = ALL_CATEGORIES.map((cat, i) => rec({ id: `r-${i}`, category: cat }));
    const result = evaluateVoiceOfChildCompliance(records);
    expect(result.overallScore).toBe(25);
    expect(result.categoryDiversityRatio).toBe(1);
    expect(result.uniqueCategories).toBe(8);
  });

  it("computes categoryDiversityRatio correctly", () => {
    const records = [
      rec({ id: "r1", category: "wishes_feelings_capture" }),
      rec({ id: "r2", category: "advocacy_access" }),
      rec({ id: "r3", category: "complaint_voice" }),
    ];
    const result = evaluateVoiceOfChildCompliance(records);
    expect(result.uniqueCategories).toBe(3);
    expect(result.categoryDiversityRatio).toBe(Math.round((3 / 8) * 100) / 100);
  });

  it("applies weight 8 for documentationCompleteRate", () => {
    const records = [rec({ timelyRecording: false, wishesFeelingsRecorded: false })];
    const result = evaluateVoiceOfChildCompliance(records);
    // doc: 100% * 8 = 8, timely: 0, wf: 0, diversity: 1/8 * 5 = 0.625
    expect(result.overallScore).toBeGreaterThanOrEqual(8);
  });

  it("handles all-false compliance booleans", () => {
    const records = [rec({ documentationComplete: false, timelyRecording: false, wishesFeelingsRecorded: false })];
    const result = evaluateVoiceOfChildCompliance(records);
    // Only diversity contributes: (1/8)*5 = 0.625 → round → 0.6
    expect(result.overallScore).toBeLessThan(1);
  });
});

// ── Evaluator 3: Policy ─────────────────────────────────────────────────────

describe("evaluateVoiceOfChildPolicy", () => {
  it("returns 0 with all false for null", () => {
    const result = evaluateVoiceOfChildPolicy(null);
    expect(result.overallScore).toBe(0);
    expect(result.wishesFeelingsPolicy).toBe(false);
    expect(result.advocacyAccessPolicy).toBe(false);
    expect(result.complaintVoicePolicy).toBe(false);
    expect(result.participationFramework).toBe(false);
    expect(result.ageAppropriateMethodsPolicy).toBe(false);
    expect(result.independentAdvocacyArrangement).toBe(false);
    expect(result.childFeedbackMechanism).toBe(false);
  });

  it("scores max for full policy", () => {
    const result = evaluateVoiceOfChildPolicy(fullPolicy());
    expect(result.overallScore).toBe(25);
  });

  it("applies correct weight 4 for wishesFeelingsPolicy", () => {
    const result = evaluateVoiceOfChildPolicy({ ...fullPolicy(), advocacyAccessPolicy: false, complaintVoicePolicy: false, participationFramework: false, ageAppropriateMethodsPolicy: false, independentAdvocacyArrangement: false, childFeedbackMechanism: false });
    expect(result.overallScore).toBe(4);
  });

  it("applies correct weight 4 for advocacyAccessPolicy", () => {
    const result = evaluateVoiceOfChildPolicy({ ...fullPolicy(), wishesFeelingsPolicy: false, complaintVoicePolicy: false, participationFramework: false, ageAppropriateMethodsPolicy: false, independentAdvocacyArrangement: false, childFeedbackMechanism: false });
    expect(result.overallScore).toBe(4);
  });

  it("applies correct weight 3 for ageAppropriateMethodsPolicy", () => {
    const result = evaluateVoiceOfChildPolicy({ ...fullPolicy(), wishesFeelingsPolicy: false, advocacyAccessPolicy: false, complaintVoicePolicy: false, participationFramework: false, independentAdvocacyArrangement: false, childFeedbackMechanism: false });
    expect(result.overallScore).toBe(3);
  });

  it("sums weights correctly: 4+4+4+4+3+3+3 = 25", () => {
    const p = fullPolicy();
    expect(evaluateVoiceOfChildPolicy(p).overallScore).toBe(25);
  });

  it("scores 0 for all-false policy", () => {
    const result = evaluateVoiceOfChildPolicy({ wishesFeelingsPolicy: false, advocacyAccessPolicy: false, complaintVoicePolicy: false, participationFramework: false, ageAppropriateMethodsPolicy: false, independentAdvocacyArrangement: false, childFeedbackMechanism: false });
    expect(result.overallScore).toBe(0);
  });

  it("reflects boolean values in result", () => {
    const p = { ...fullPolicy(), childFeedbackMechanism: false };
    const result = evaluateVoiceOfChildPolicy(p);
    expect(result.childFeedbackMechanism).toBe(false);
    expect(result.wishesFeelingsPolicy).toBe(true);
  });
});

// ── Evaluator 4: Staff Readiness ────────────────────────────────────────────

describe("evaluateStaffVoiceOfChildReadiness", () => {
  it("returns all zeros for empty staff", () => {
    const result = evaluateStaffVoiceOfChildReadiness([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalStaff).toBe(0);
    expect(result.wishesFeelingsCaptureRate).toBe(0);
    expect(result.activeListeningSkillsRate).toBe(0);
    expect(result.ageAppropriateEngagementRate).toBe(0);
    expect(result.advocacyAwarenessRate).toBe(0);
    expect(result.participationFacilitationRate).toBe(0);
    expect(result.nonVerbalCommunicationRate).toBe(0);
  });

  it("scores max for all-skilled staff", () => {
    const s = [staff(), staff({ staffId: "s2" }), staff({ staffId: "s3" })];
    const result = evaluateStaffVoiceOfChildReadiness(s);
    expect(result.overallScore).toBe(25);
    expect(result.totalStaff).toBe(3);
  });

  it("scores 0 for all-unskilled staff", () => {
    const s = [staff({ wishesFeelingsCapture: false, activeListeningSkills: false, ageAppropriateEngagement: false, advocacyAwareness: false, participationFacilitation: false, nonVerbalCommunication: false })];
    const result = evaluateStaffVoiceOfChildReadiness(s);
    expect(result.overallScore).toBe(0);
  });

  it("applies correct weight 6 for wishesFeelingsCapture", () => {
    const s = [staff({ activeListeningSkills: false, ageAppropriateEngagement: false, advocacyAwareness: false, participationFacilitation: false, nonVerbalCommunication: false })];
    const result = evaluateStaffVoiceOfChildReadiness(s);
    expect(result.overallScore).toBe(6);
  });

  it("applies correct weight 5 for activeListeningSkills", () => {
    const s = [staff({ wishesFeelingsCapture: false, ageAppropriateEngagement: false, advocacyAwareness: false, participationFacilitation: false, nonVerbalCommunication: false })];
    const result = evaluateStaffVoiceOfChildReadiness(s);
    expect(result.overallScore).toBe(5);
  });

  it("applies correct weight 2 for nonVerbalCommunication", () => {
    const s = [staff({ wishesFeelingsCapture: false, activeListeningSkills: false, ageAppropriateEngagement: false, advocacyAwareness: false, participationFacilitation: false })];
    const result = evaluateStaffVoiceOfChildReadiness(s);
    expect(result.overallScore).toBe(2);
  });

  it("computes mixed rates correctly", () => {
    const s = [
      staff({ nonVerbalCommunication: false }),
      staff({ staffId: "s2", wishesFeelingsCapture: false, nonVerbalCommunication: false }),
    ];
    const result = evaluateStaffVoiceOfChildReadiness(s);
    expect(result.wishesFeelingsCaptureRate).toBe(50);
    expect(result.nonVerbalCommunicationRate).toBe(0);
  });
});

// ── Child Profiles ──────────────────────────────────────────────────────────

describe("buildChildVoiceOfChildProfiles", () => {
  it("returns empty for no records", () => {
    expect(buildChildVoiceOfChildProfiles([])).toEqual([]);
  });

  it("groups by childId", () => {
    const records = [
      rec({ childId: "child-alex", childName: "Alex" }),
      rec({ id: "r2", childId: "child-jordan", childName: "Jordan" }),
      rec({ id: "r3", childId: "child-alex", childName: "Alex" }),
    ];
    const profiles = buildChildVoiceOfChildProfiles(records);
    expect(profiles).toHaveLength(2);
    expect(profiles.find((p) => p.childId === "child-alex")?.totalRecords).toBe(2);
    expect(profiles.find((p) => p.childId === "child-jordan")?.totalRecords).toBe(1);
  });

  it("scores frequency: >= 10 → 2", () => {
    const records = Array.from({ length: 10 }, (_, i) => rec({ id: `r-${i}` }));
    const profiles = buildChildVoiceOfChildProfiles(records);
    // freq=2, rate1=3(100%), rate2=3(100%), diversity=0(1 cat) → 2+3+3+0=8
    expect(profiles[0].overallScore).toBe(8);
  });

  it("scores frequency: >= 5 and < 10 → 1", () => {
    const records = Array.from({ length: 5 }, (_, i) => rec({ id: `r-${i}` }));
    const profiles = buildChildVoiceOfChildProfiles(records);
    // freq=1, rate1=3, rate2=3, div=0 → 7
    expect(profiles[0].overallScore).toBe(7);
  });

  it("scores frequency: < 5 → 0", () => {
    const records = [rec()];
    const profiles = buildChildVoiceOfChildProfiles(records);
    // freq=0, rate1=3, rate2=3, div=0 → 6
    expect(profiles[0].overallScore).toBe(6);
  });

  it("scores rate1 tiers correctly", () => {
    // 80% → 3
    const r80 = Array.from({ length: 5 }, (_, i) => rec({ id: `r-${i}`, wishesFeelingsRecorded: i < 4 }));
    expect(buildChildVoiceOfChildProfiles(r80)[0].wishesFeelingsRecordedRate).toBe(80);

    // 60% → 2
    const r60 = Array.from({ length: 5 }, (_, i) => rec({ id: `r-${i}`, wishesFeelingsRecorded: i < 3 }));
    expect(buildChildVoiceOfChildProfiles(r60)[0].wishesFeelingsRecordedRate).toBe(60);
  });

  it("scores diversity: >= 4 → 2", () => {
    const records = [
      rec({ id: "r1", category: "wishes_feelings_capture" }),
      rec({ id: "r2", category: "advocacy_access" }),
      rec({ id: "r3", category: "complaint_voice" }),
      rec({ id: "r4", category: "care_plan_voice" }),
    ];
    const profiles = buildChildVoiceOfChildProfiles(records);
    expect(profiles[0].categoriesCovered).toHaveLength(4);
  });

  it("scores diversity: >= 2 and < 4 → 1", () => {
    const records = [
      rec({ id: "r1", category: "wishes_feelings_capture" }),
      rec({ id: "r2", category: "advocacy_access" }),
    ];
    const profiles = buildChildVoiceOfChildProfiles(records);
    expect(profiles[0].categoriesCovered).toHaveLength(2);
  });

  it("caps at 10", () => {
    const records = Array.from({ length: 12 }, (_, i) =>
      rec({ id: `r-${i}`, category: ALL_CATEGORIES[i % 8] }),
    );
    const profiles = buildChildVoiceOfChildProfiles(records);
    expect(profiles[0].overallScore).toBeLessThanOrEqual(10);
  });

  it("scores 0 for all-false record", () => {
    const records = [rec({ wishesFeelingsRecorded: false, childDirectlyConsulted: false })];
    const profiles = buildChildVoiceOfChildProfiles(records);
    // freq=0, rate1=0(0%), rate2=0(0%), div=0(1) → 0
    expect(profiles[0].overallScore).toBe(0);
  });
});

// ── Orchestrator ────────────────────────────────────────────────────────────

describe("generateVoiceOfChildIntelligenceReport", () => {
  const baseInput = {
    homeId: "home-oak-house",
    periodStart: "2025-01-01",
    periodEnd: "2025-12-31",
  };

  it("produces complete report for full data", () => {
    const records = ALL_CATEGORIES.map((cat, i) =>
      rec({ id: `r-${i}`, category: cat, childId: i < 4 ? "child-alex" : "child-jordan", childName: i < 4 ? "Alex" : "Jordan" }),
    );
    const result = generateVoiceOfChildIntelligenceReport({
      ...baseInput,
      records,
      policy: fullPolicy(),
      staff: [staff(), staff({ staffId: "s2" }), staff({ staffId: "s3" }), staff({ staffId: "s4" })],
    });

    expect(result.homeId).toBe("home-oak-house");
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);
    expect(result.childProfiles).toHaveLength(2);
    expect(result.regulatoryLinks.length).toBeGreaterThan(0);
  });

  it("handles empty data", () => {
    const result = generateVoiceOfChildIntelligenceReport({
      ...baseInput,
      records: [],
      policy: null,
      staff: [],
    });
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.areasForImprovement.some((a) => a.includes("No voice of child records"))).toBe(true);
    expect(result.areasForImprovement.some((a) => a.includes("No voice of child policy"))).toBe(true);
    expect(result.areasForImprovement.some((a) => a.includes("No staff voice training"))).toBe(true);
    expect(result.actions.some((a) => a.includes("URGENT"))).toBe(true);
  });

  it("filters records by period", () => {
    const records = [
      rec({ id: "r1", date: "2025-06-15" }), // in period
      rec({ id: "r2", date: "2024-06-15" }), // before period
      rec({ id: "r3", date: "2026-06-15" }), // after period
    ];
    const result = generateVoiceOfChildIntelligenceReport({
      ...baseInput,
      records,
      policy: fullPolicy(),
      staff: [staff()],
    });
    expect(result.voiceOfChildQuality.totalRecords).toBe(1);
  });

  it("overall score is sum of 4 evaluators capped at 100", () => {
    const records = ALL_CATEGORIES.map((cat, i) => rec({ id: `r-${i}`, category: cat }));
    const result = generateVoiceOfChildIntelligenceReport({
      ...baseInput,
      records,
      policy: fullPolicy(),
      staff: [staff(), staff({ staffId: "s2" })],
    });
    const expected = Math.min(100, Math.round(
      result.voiceOfChildQuality.overallScore +
      result.voiceOfChildCompliance.overallScore +
      result.voiceOfChildPolicy.overallScore +
      result.staffReadiness.overallScore,
    ));
    expect(result.overallScore).toBe(expected);
  });

  it("rating matches score thresholds", () => {
    const records = ALL_CATEGORIES.map((cat, i) => rec({ id: `r-${i}`, category: cat }));
    const result = generateVoiceOfChildIntelligenceReport({
      ...baseInput,
      records,
      policy: fullPolicy(),
      staff: [staff()],
    });
    expect(result.rating).toBe(getRating(result.overallScore));
  });

  it("generates outstanding strengths", () => {
    const records = ALL_CATEGORIES.map((cat, i) => rec({ id: `r-${i}`, category: cat }));
    const result = generateVoiceOfChildIntelligenceReport({
      ...baseInput,
      records,
      policy: fullPolicy(),
      staff: [staff(), staff({ staffId: "s2" }), staff({ staffId: "s3" })],
    });
    expect(result.overallScore).toBe(100);
    expect(result.strengths.some((s) => s.includes("Outstanding"))).toBe(true);
  });

  it("generates actions for low wishes capture", () => {
    const records = [rec({ wishesFeelingsRecorded: false, childDirectlyConsulted: false })];
    const result = generateVoiceOfChildIntelligenceReport({
      ...baseInput,
      records,
      policy: fullPolicy(),
      staff: [staff()],
    });
    expect(result.actions.some((a) => a.includes("Wishes and feelings recorded at 0%"))).toBe(true);
  });

  it("generates actions for low documentation", () => {
    const records = [rec({ documentationComplete: false })];
    const result = generateVoiceOfChildIntelligenceReport({
      ...baseInput,
      records,
      policy: fullPolicy(),
      staff: [staff()],
    });
    expect(result.actions.some((a) => a.includes("Documentation rate at 0%"))).toBe(true);
  });

  it("generates no-actions message when all is well", () => {
    const records = ALL_CATEGORIES.map((cat, i) => rec({ id: `r-${i}`, category: cat }));
    const result = generateVoiceOfChildIntelligenceReport({
      ...baseInput,
      records,
      policy: fullPolicy(),
      staff: [staff(), staff({ staffId: "s2" })],
    });
    expect(result.actions).toContain("No immediate actions required. Voice of child systems operating within expected standards.");
  });

  it("always includes regulatory links", () => {
    const result = generateVoiceOfChildIntelligenceReport({
      ...baseInput,
      records: [],
      policy: null,
      staff: [],
    });
    expect(result.regulatoryLinks.some((r) => r.includes("CHR 2015 Reg 7"))).toBe(true);
    expect(result.regulatoryLinks.some((r) => r.includes("UNCRC Article 12"))).toBe(true);
  });

  it("includes low score children in actions", () => {
    const records = [rec({ wishesFeelingsRecorded: false, childDirectlyConsulted: false })];
    const result = generateVoiceOfChildIntelligenceReport({
      ...baseInput,
      records,
      policy: fullPolicy(),
      staff: [staff()],
    });
    // Child score is 0 (all false, 1 record, 1 category) → low
    expect(result.actions.some((a) => a.includes("child(ren) with low voice participation"))).toBe(true);
  });
});
