import { describe, it, expect } from "vitest";
import {
  pct,
  getRating,
  getEscalationThresholdCategoryLabel,
  getEscalationThresholdOutcomeLabel,
  getRatingLabel,
  evaluateEscalationThresholdQuality,
  evaluateEscalationThresholdCompliance,
  evaluateEscalationThresholdPolicy,
  evaluateStaffEscalationThresholdReadiness,
  buildChildEscalationThresholdProfiles,
  generateEscalationThresholdIntelligence,
} from "../escalation-threshold-intelligence-engine";
import type {
  EscalationThresholdRecord,
  EscalationThresholdPolicy,
  StaffEscalationThresholdTraining,
} from "../escalation-threshold-intelligence-engine";

/* ── helpers ─────────────────────────────────────────────────── */

function makeRecord(overrides: Partial<EscalationThresholdRecord> = {}): EscalationThresholdRecord {
  return {
    id: "et-001", homeId: "home-oak", date: "2026-03-01", childId: "child-alex", childName: "Alex",
    category: "safeguarding_escalation", outcome: "appropriately_escalated",
    thresholdCorrectlyIdentified: true, escalationTimelyCompleted: true,
    appropriateRecipientNotified: true, outcomeRecorded: true,
    documentationComplete: true, timelyRecording: true,
    ...overrides,
  };
}

function allTruePolicy(): EscalationThresholdPolicy {
  return { escalationPolicy: true, thresholdFramework: true, safeguardingEscalationProcedure: true, multiAgencyReferralPolicy: true, professionalDisagreementPolicy: true, ofstedNotificationProcedure: true, emergencyResponseProtocol: true };
}

function allFalsePolicy(): EscalationThresholdPolicy {
  return { escalationPolicy: false, thresholdFramework: false, safeguardingEscalationProcedure: false, multiAgencyReferralPolicy: false, professionalDisagreementPolicy: false, ofstedNotificationProcedure: false, emergencyResponseProtocol: false };
}

function fullStaff(): StaffEscalationThresholdTraining {
  return { staffId: "staff-sarah", escalationProcedureKnowledge: true, thresholdAssessmentSkills: true, safeguardingEscalationSkills: true, multiAgencyReferralSkills: true, professionalDisagreementResolution: true, emergencyResponseSkills: true };
}

const ALL_CATEGORIES: EscalationThresholdRecord["category"][] = [
  "safeguarding_escalation", "threshold_assessment", "multi_agency_referral", "concern_escalation",
  "professional_disagreement", "management_escalation", "ofsted_notification", "emergency_response",
];

/* ── pct() ───────────────────────────────────────────────────── */

describe("pct()", () => {
  it("returns 0 when denominator is 0", () => { expect(pct(0, 0)).toBe(0); expect(pct(5, 0)).toBe(0); });
  it("calculates percentage correctly", () => { expect(pct(1, 2)).toBe(50); expect(pct(3, 4)).toBe(75); expect(pct(10, 10)).toBe(100); });
  it("rounds to nearest integer", () => { expect(pct(1, 3)).toBe(33); expect(pct(2, 3)).toBe(67); });
});

/* ── getRating() ─────────────────────────────────────────────── */

describe("getRating()", () => {
  it("returns outstanding for >= 80", () => { expect(getRating(80)).toBe("outstanding"); expect(getRating(100)).toBe("outstanding"); });
  it("returns good for >= 60", () => { expect(getRating(60)).toBe("good"); expect(getRating(79)).toBe("good"); });
  it("returns requires_improvement for >= 40", () => { expect(getRating(40)).toBe("requires_improvement"); expect(getRating(59)).toBe("requires_improvement"); });
  it("returns inadequate for < 40", () => { expect(getRating(0)).toBe("inadequate"); expect(getRating(39)).toBe("inadequate"); });
});

/* ── Label functions ─────────────────────────────────────────── */

describe("label functions", () => {
  it("getEscalationThresholdCategoryLabel returns string for all categories", () => {
    for (const c of ALL_CATEGORIES) { expect(typeof getEscalationThresholdCategoryLabel(c)).toBe("string"); expect(getEscalationThresholdCategoryLabel(c).length).toBeGreaterThan(0); }
  });
  it("getEscalationThresholdOutcomeLabel returns string for all outcomes", () => {
    const outcomes = ["appropriately_escalated", "partially_escalated", "delayed_escalation", "not_escalated", "not_applicable"] as const;
    for (const o of outcomes) { expect(typeof getEscalationThresholdOutcomeLabel(o)).toBe("string"); }
  });
  it("getRatingLabel returns string for all ratings", () => {
    for (const r of ["outstanding", "good", "requires_improvement", "inadequate"] as const) { expect(typeof getRatingLabel(r)).toBe("string"); }
  });
});

/* ── evaluateEscalationThresholdQuality() ────────────────────── */

describe("evaluateEscalationThresholdQuality()", () => {
  it("returns 0 for empty records", () => {
    const r = evaluateEscalationThresholdQuality([]);
    expect(r.overallScore).toBe(0); expect(r.totalRecords).toBe(0);
    expect(r.thresholdCorrectlyIdentifiedRate).toBe(0); expect(r.escalationTimelyCompletedRate).toBe(0);
  });
  it("returns 25 for all-true records", () => {
    const r = evaluateEscalationThresholdQuality([makeRecord(), makeRecord({ id: "et-002" })]);
    expect(r.overallScore).toBe(25); expect(r.totalRecords).toBe(2);
  });
  it("calculates mixed records", () => {
    const r = evaluateEscalationThresholdQuality([
      makeRecord(),
      makeRecord({ id: "et-002", thresholdCorrectlyIdentified: false, escalationTimelyCompleted: false }),
    ]);
    expect(r.thresholdCorrectlyIdentifiedRate).toBe(50);
    expect(r.escalationTimelyCompletedRate).toBe(50);
    expect(r.overallScore).toBe(18.5); // (50/100)*7 + (50/100)*6 + 6 + 6 = 3.5+3+6+6
  });
  it("scores 0 when all booleans false", () => {
    const r = evaluateEscalationThresholdQuality([makeRecord({
      thresholdCorrectlyIdentified: false, escalationTimelyCompleted: false,
      appropriateRecipientNotified: false, outcomeRecorded: false,
    })]);
    expect(r.overallScore).toBe(0);
  });
  it("caps at 25", () => {
    expect(evaluateEscalationThresholdQuality([makeRecord()]).overallScore).toBeLessThanOrEqual(25);
  });
});

/* ── evaluateEscalationThresholdCompliance() ─────────────────── */

describe("evaluateEscalationThresholdCompliance()", () => {
  it("returns 0 for empty records", () => {
    const r = evaluateEscalationThresholdCompliance([]);
    expect(r.overallScore).toBe(0); expect(r.totalRecords).toBe(0);
    expect(r.categoryDiversityRatio).toBe(0); expect(r.uniqueCategories).toBe(0);
  });
  it("returns 25 for full compliance with all 8 categories", () => {
    const records = ALL_CATEGORIES.map((c, i) => makeRecord({ id: `et-${i}`, category: c }));
    const r = evaluateEscalationThresholdCompliance(records);
    expect(r.overallScore).toBe(25); expect(r.uniqueCategories).toBe(8); expect(r.categoryDiversityRatio).toBe(1);
  });
  it("calculates partial compliance", () => {
    const r = evaluateEscalationThresholdCompliance([
      makeRecord({ timelyRecording: false }),
      makeRecord({ id: "et-002", documentationComplete: false }),
    ]);
    expect(r.documentationCompleteRate).toBe(50); expect(r.timelyRecordingRate).toBe(50);
  });
  it("calculates diversity ratio", () => {
    const r = evaluateEscalationThresholdCompliance([
      makeRecord({ category: "safeguarding_escalation" }),
      makeRecord({ id: "et-002", category: "threshold_assessment" }),
    ]);
    expect(r.uniqueCategories).toBe(2); expect(r.categoryDiversityRatio).toBe(0.25);
  });
});

/* ── evaluateEscalationThresholdPolicy() ─────────────────────── */

describe("evaluateEscalationThresholdPolicy()", () => {
  it("returns 0 for null", () => {
    const r = evaluateEscalationThresholdPolicy(null);
    expect(r.overallScore).toBe(0); expect(r.escalationPolicy).toBe(false);
  });
  it("returns 25 for all true", () => { expect(evaluateEscalationThresholdPolicy(allTruePolicy()).overallScore).toBe(25); });
  it("returns 0 for all false", () => { expect(evaluateEscalationThresholdPolicy(allFalsePolicy()).overallScore).toBe(0); });
  it("weights first 4 at 4 points", () => {
    expect(evaluateEscalationThresholdPolicy({ ...allFalsePolicy(), escalationPolicy: true }).overallScore).toBe(4);
    expect(evaluateEscalationThresholdPolicy({ ...allFalsePolicy(), thresholdFramework: true }).overallScore).toBe(4);
    expect(evaluateEscalationThresholdPolicy({ ...allFalsePolicy(), safeguardingEscalationProcedure: true }).overallScore).toBe(4);
    expect(evaluateEscalationThresholdPolicy({ ...allFalsePolicy(), multiAgencyReferralPolicy: true }).overallScore).toBe(4);
  });
  it("weights last 3 at 3 points", () => {
    expect(evaluateEscalationThresholdPolicy({ ...allFalsePolicy(), professionalDisagreementPolicy: true }).overallScore).toBe(3);
    expect(evaluateEscalationThresholdPolicy({ ...allFalsePolicy(), ofstedNotificationProcedure: true }).overallScore).toBe(3);
    expect(evaluateEscalationThresholdPolicy({ ...allFalsePolicy(), emergencyResponseProtocol: true }).overallScore).toBe(3);
  });
  it("partial policy scored correctly", () => {
    const r = evaluateEscalationThresholdPolicy({ ...allFalsePolicy(), escalationPolicy: true, thresholdFramework: true });
    expect(r.overallScore).toBe(8);
  });
});

/* ── evaluateStaffEscalationThresholdReadiness() ─────────────── */

describe("evaluateStaffEscalationThresholdReadiness()", () => {
  it("returns 0 for empty staff", () => {
    const r = evaluateStaffEscalationThresholdReadiness([]);
    expect(r.overallScore).toBe(0); expect(r.totalStaff).toBe(0);
  });
  it("returns 25 for fully trained", () => {
    const r = evaluateStaffEscalationThresholdReadiness([fullStaff()]);
    expect(r.overallScore).toBe(25); expect(r.totalStaff).toBe(1);
  });
  it("calculates partial training", () => {
    const r = evaluateStaffEscalationThresholdReadiness([
      fullStaff(),
      { ...fullStaff(), staffId: "staff-tom", escalationProcedureKnowledge: false, emergencyResponseSkills: false },
    ]);
    expect(r.escalationProcedureKnowledgeRate).toBe(50); expect(r.emergencyResponseSkillsRate).toBe(50);
  });
  it("scores 0 when all skills false", () => {
    const r = evaluateStaffEscalationThresholdReadiness([{
      staffId: "staff-none", escalationProcedureKnowledge: false, thresholdAssessmentSkills: false,
      safeguardingEscalationSkills: false, multiAgencyReferralSkills: false,
      professionalDisagreementResolution: false, emergencyResponseSkills: false,
    }]);
    expect(r.overallScore).toBe(0);
  });
});

/* ── buildChildEscalationThresholdProfiles() ─────────────────── */

describe("buildChildEscalationThresholdProfiles()", () => {
  it("returns empty for empty records", () => { expect(buildChildEscalationThresholdProfiles([])).toEqual([]); });
  it("builds single child profile", () => {
    const profiles = buildChildEscalationThresholdProfiles([
      makeRecord({ category: "safeguarding_escalation" }),
      makeRecord({ id: "et-002", category: "threshold_assessment" }),
    ]);
    expect(profiles).toHaveLength(1); expect(profiles[0].totalRecords).toBe(2); expect(profiles[0].categoriesCovered).toHaveLength(2);
  });
  it("builds multiple child profiles", () => {
    const profiles = buildChildEscalationThresholdProfiles([
      makeRecord({ childId: "child-alex", childName: "Alex" }),
      makeRecord({ id: "et-002", childId: "child-jordan", childName: "Jordan" }),
    ]);
    expect(profiles).toHaveLength(2);
  });
  it("freq < 5 = 0", () => {
    const profiles = buildChildEscalationThresholdProfiles([
      makeRecord({ category: "safeguarding_escalation" }),
      makeRecord({ id: "et-002", category: "threshold_assessment" }),
      makeRecord({ id: "et-003", category: "multi_agency_referral" }),
      makeRecord({ id: "et-004", category: "concern_escalation" }),
    ]);
    // freq=0, rate1=3(100%), rate2=3(100%), diversity=2(4 cats) = 8
    expect(profiles[0].overallScore).toBe(8);
  });
  it("freq >= 5 = 1", () => {
    const records = Array.from({ length: 5 }, (_, i) => makeRecord({ id: `et-${i}` }));
    const profiles = buildChildEscalationThresholdProfiles(records);
    // freq=1, rate1=3, rate2=3, diversity=0(1 cat) = 7
    expect(profiles[0].overallScore).toBe(7);
  });
  it("freq >= 10 = 2", () => {
    const records = Array.from({ length: 10 }, (_, i) => makeRecord({ id: `et-${i}` }));
    const profiles = buildChildEscalationThresholdProfiles(records);
    // freq=2, rate1=3, rate2=3, diversity=0(1 cat) = 8
    expect(profiles[0].overallScore).toBe(8);
  });
  it("rate1 bands: 75% → 2", () => {
    const profiles = buildChildEscalationThresholdProfiles([
      makeRecord({ category: "safeguarding_escalation" }),
      makeRecord({ id: "et-002", category: "threshold_assessment" }),
      makeRecord({ id: "et-003", category: "multi_agency_referral" }),
      makeRecord({ id: "et-004", category: "concern_escalation", thresholdCorrectlyIdentified: false }),
    ]);
    // freq=0, rate1=2(75%), rate2=3(100%), diversity=2(4 cats) = 7
    expect(profiles[0].overallScore).toBe(7);
  });
  it("diversity 1 cat = 0", () => {
    const profiles = buildChildEscalationThresholdProfiles([makeRecord()]);
    // freq=0, rate1=3, rate2=3, diversity=0 = 6
    expect(profiles[0].overallScore).toBe(6);
  });
  it("diversity 2 cats = 1", () => {
    const profiles = buildChildEscalationThresholdProfiles([
      makeRecord({ category: "safeguarding_escalation" }),
      makeRecord({ id: "et-002", category: "threshold_assessment" }),
    ]);
    // freq=0, rate1=3, rate2=3, diversity=1 = 7
    expect(profiles[0].overallScore).toBe(7);
  });
  it("diversity >= 4 cats = 2", () => {
    const profiles = buildChildEscalationThresholdProfiles([
      makeRecord({ category: "safeguarding_escalation" }),
      makeRecord({ id: "et-002", category: "threshold_assessment" }),
      makeRecord({ id: "et-003", category: "multi_agency_referral" }),
      makeRecord({ id: "et-004", category: "concern_escalation" }),
    ]);
    // freq=0, rate1=3, rate2=3, diversity=2 = 8
    expect(profiles[0].overallScore).toBe(8);
  });
  it("caps at 10", () => {
    const records = Array.from({ length: 12 }, (_, i) =>
      makeRecord({ id: `et-${i}`, category: ALL_CATEGORIES[i % 4] })
    );
    const profiles = buildChildEscalationThresholdProfiles(records);
    // freq=2(12), rate1=3(100%), rate2=3(100%), diversity=2(4 cats) = 10
    expect(profiles[0].overallScore).toBe(10);
  });
});

/* ── generateEscalationThresholdIntelligence() ───────────────── */

describe("generateEscalationThresholdIntelligence()", () => {
  it("full orchestration", () => {
    const records = ALL_CATEGORIES.map((c, i) => makeRecord({ id: `et-${i}`, category: c }));
    const result = generateEscalationThresholdIntelligence({
      homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31",
      records, policy: allTruePolicy(), staff: [fullStaff()],
    });
    expect(result.homeId).toBe("home-oak");
    expect(result.overallScore).toBe(100);
    expect(result.rating).toBe("outstanding");
    expect(result.regulatoryLinks.length).toBe(7);
  });
  it("returns inadequate for empty data", () => {
    const result = generateEscalationThresholdIntelligence({
      homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31",
      records: [], policy: null, staff: [],
    });
    expect(result.overallScore).toBe(0); expect(result.rating).toBe("inadequate");
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
  });
  it("handles null policy", () => {
    const result = generateEscalationThresholdIntelligence({
      homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31",
      records: [makeRecord()], policy: null, staff: [fullStaff()],
    });
    expect(result.escalationThresholdPolicy.overallScore).toBe(0);
    expect(result.areasForImprovement.some((a) => a.includes("No escalation policy"))).toBe(true);
  });
  it("filters by date range", () => {
    const result = generateEscalationThresholdIntelligence({
      homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31",
      records: [
        makeRecord({ date: "2025-12-31" }),
        makeRecord({ id: "et-002", date: "2026-06-01" }),
        makeRecord({ id: "et-003", date: "2027-01-01" }),
      ],
      policy: allTruePolicy(), staff: [fullStaff()],
    });
    expect(result.escalationThresholdQuality.totalRecords).toBe(1);
  });
  it("caps score at 100", () => {
    const records = ALL_CATEGORIES.map((c, i) => makeRecord({ id: `et-${i}`, category: c }));
    const result = generateEscalationThresholdIntelligence({
      homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31",
      records, policy: allTruePolicy(), staff: [fullStaff()],
    });
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });
  it("generates strengths for high scores", () => {
    const records = ALL_CATEGORIES.map((c, i) => makeRecord({ id: `et-${i}`, category: c }));
    const result = generateEscalationThresholdIntelligence({
      homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31",
      records, policy: allTruePolicy(), staff: [fullStaff()],
    });
    expect(result.strengths.some((s) => s.includes("Outstanding"))).toBe(true);
  });
  it("generates actions for low scores", () => {
    const result = generateEscalationThresholdIntelligence({
      homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31",
      records: [makeRecord({ thresholdCorrectlyIdentified: false, escalationTimelyCompleted: false, documentationComplete: false, timelyRecording: false })],
      policy: null, staff: [],
    });
    expect(result.actions.some((a) => a.includes("URGENT"))).toBe(true);
  });
  it("generates default action when no issues", () => {
    const records = ALL_CATEGORIES.map((c, i) => makeRecord({ id: `et-${i}`, category: c }));
    const result = generateEscalationThresholdIntelligence({
      homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31",
      records, policy: allTruePolicy(), staff: [fullStaff()],
    });
    expect(result.actions).toContain("No immediate actions required. Escalation management systems operating within expected standards.");
  });
});
