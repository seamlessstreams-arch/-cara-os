import { describe, it, expect } from "vitest";
import {
  generateDigitalLiteracyDevelopmentIntelligence, evaluateDigitalQuality, evaluateDigitalCompliance,
  evaluateDigitalPolicy, evaluateStaffDigitalReadiness, buildChildDigitalProfiles, getRating,
  getSessionTypeLabel, getCompetencyLevelLabel, getRatingLabel,
} from "../digital-literacy-development-engine";
import type { DigitalSession, DigitalPolicy, StaffDigitalTraining } from "../digital-literacy-development-engine";

let _id = 0;
function makeSession(overrides: Partial<DigitalSession> = {}): DigitalSession {
  _id++;
  return { id: `ds-${_id}`, childId: "child-alex", childName: "Alex", sessionDate: "2026-04-01", sessionType: "online_safety", competencyLevel: "advanced", onlineSafetyDemonstrated: true, ageAppropriateContent: true, supervisedAccess: true, documentedInPlan: true, staffSupported: true, progressRecorded: true, ...overrides };
}
function makePolicy(overrides: Partial<DigitalPolicy> = {}): DigitalPolicy {
  return { id: "dp-1", onlineSafetyPolicy: true, deviceUsageGuidelines: true, socialMediaPolicy: true, ageVerificationProtocol: true, monitoringFramework: true, incidentResponsePlan: true, regularReview: true, ...overrides };
}
let _tid = 0;
function makeTraining(overrides: Partial<StaffDigitalTraining> = {}): StaffDigitalTraining {
  _tid++;
  return { id: `dt-${_tid}`, staffId: `staff-${_tid}`, staffName: `Staff ${_tid}`, onlineSafety: true, digitalLiteracy: true, socialMediaAwareness: true, cyberbullyingResponse: true, privacyProtection: true, monitoringSkills: true, ...overrides };
}

// ── pct ──────────────────────────────────────────────────────────────────────


// ── getRating ────────────────────────────────────────────────────────────────

describe("getRating", () => {
  it("outstanding >= 80", () => { expect(getRating(80)).toBe("outstanding"); expect(getRating(100)).toBe("outstanding"); });
  it("good 60-79", () => { expect(getRating(60)).toBe("good"); expect(getRating(79)).toBe("good"); });
  it("requires_improvement 40-59", () => { expect(getRating(40)).toBe("requires_improvement"); expect(getRating(59)).toBe("requires_improvement"); });
  it("inadequate < 40", () => { expect(getRating(39)).toBe("inadequate"); expect(getRating(0)).toBe("inadequate"); });
});

// ── Label getters ────────────────────────────────────────────────────────────

describe("label getters", () => {
  it("getSessionTypeLabel", () => {
    expect(getSessionTypeLabel("online_safety")).toBe("Online Safety");
    expect(getSessionTypeLabel("coding_skills")).toBe("Coding Skills");
    expect(getSessionTypeLabel("digital_creativity")).toBe("Digital Creativity");
    expect(getSessionTypeLabel("research_skills")).toBe("Research Skills");
    expect(getSessionTypeLabel("social_media_awareness")).toBe("Social Media Awareness");
    expect(getSessionTypeLabel("cyberbullying_education")).toBe("Cyberbullying Education");
    expect(getSessionTypeLabel("privacy_management")).toBe("Privacy Management");
    expect(getSessionTypeLabel("digital_communication")).toBe("Digital Communication");
  });
  it("getCompetencyLevelLabel", () => {
    expect(getCompetencyLevelLabel("advanced")).toBe("Advanced");
    expect(getCompetencyLevelLabel("proficient")).toBe("Proficient");
    expect(getCompetencyLevelLabel("developing")).toBe("Developing");
    expect(getCompetencyLevelLabel("beginner")).toBe("Beginner");
    expect(getCompetencyLevelLabel("not_assessed")).toBe("Not Assessed");
  });
  it("getRatingLabel", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ── evaluateDigitalQuality ───────────────────────────────────────────────────

describe("evaluateDigitalQuality", () => {
  it("returns 0 for empty", () => { const r = evaluateDigitalQuality([]); expect(r.overallScore).toBe(0); expect(r.totalSessions).toBe(0); });
  it("scores 25 for perfect", () => { expect(evaluateDigitalQuality(Array.from({ length: 10 }, () => makeSession())).overallScore).toBe(25); });
  it("counts advanced+proficient as competent", () => {
    const sessions = [makeSession({ competencyLevel: "advanced" }), makeSession({ competencyLevel: "proficient" }), makeSession({ competencyLevel: "developing" }), makeSession({ competencyLevel: "beginner" }), makeSession({ competencyLevel: "not_assessed" })];
    expect(evaluateDigitalQuality(sessions).competencyRate).toBe(40);
  });
  it("calculates online safety rate", () => {
    const sessions = [makeSession({ onlineSafetyDemonstrated: true }), makeSession({ onlineSafetyDemonstrated: false })];
    expect(evaluateDigitalQuality(sessions).onlineSafetyRate).toBe(50);
  });
  it("calculates age appropriate rate", () => {
    const sessions = [makeSession({ ageAppropriateContent: true }), makeSession({ ageAppropriateContent: true }), makeSession({ ageAppropriateContent: false })];
    expect(evaluateDigitalQuality(sessions).ageAppropriateRate).toBe(67);
  });
  it("calculates supervised access rate", () => {
    const sessions = Array.from({ length: 4 }, () => makeSession({ supervisedAccess: true })).concat([makeSession({ supervisedAccess: false })]);
    expect(evaluateDigitalQuality(sessions).supervisedAccessRate).toBe(80);
  });
  it("caps at 25", () => { expect(evaluateDigitalQuality(Array.from({ length: 20 }, () => makeSession())).overallScore).toBeLessThanOrEqual(25); });
  it("scores lower with poor competency", () => {
    const good = evaluateDigitalQuality(Array.from({ length: 5 }, () => makeSession()));
    const bad = evaluateDigitalQuality(Array.from({ length: 5 }, () => makeSession({ competencyLevel: "beginner", onlineSafetyDemonstrated: false })));
    expect(good.overallScore).toBeGreaterThan(bad.overallScore);
  });
  it("returns correct totalSessions", () => {
    expect(evaluateDigitalQuality(Array.from({ length: 7 }, () => makeSession())).totalSessions).toBe(7);
  });
});

// ── evaluateDigitalCompliance ────────────────────────────────────────────────

describe("evaluateDigitalCompliance", () => {
  it("returns 0 for empty", () => { expect(evaluateDigitalCompliance([]).overallScore).toBe(0); });
  it("calculates documented rate", () => {
    const sessions = [makeSession({ documentedInPlan: true }), makeSession({ documentedInPlan: false })];
    expect(evaluateDigitalCompliance(sessions).documentedRate).toBe(50);
  });
  it("calculates staff supported rate", () => {
    const sessions = [makeSession({ staffSupported: true }), makeSession({ staffSupported: false }), makeSession({ staffSupported: true })];
    expect(evaluateDigitalCompliance(sessions).staffSupportedRate).toBe(67);
  });
  it("calculates progress recorded rate", () => {
    const sessions = Array.from({ length: 3 }, () => makeSession({ progressRecorded: true })).concat([makeSession({ progressRecorded: false })]);
    expect(evaluateDigitalCompliance(sessions).progressRecordedRate).toBe(75);
  });
  it("calculates session type diversity ratio", () => {
    const sessions = [makeSession({ sessionType: "online_safety" }), makeSession({ sessionType: "online_safety" })];
    expect(evaluateDigitalCompliance(sessions).sessionTypeDiversityRatio).toBe(13);
  });
  it("full diversity = 100", () => {
    const types: DigitalSession["sessionType"][] = ["online_safety", "coding_skills", "digital_creativity", "research_skills", "social_media_awareness", "cyberbullying_education", "privacy_management", "digital_communication"];
    const sessions = types.map((t) => makeSession({ sessionType: t }));
    expect(evaluateDigitalCompliance(sessions).sessionTypeDiversityRatio).toBe(100);
  });
  it("caps at 25", () => { expect(evaluateDigitalCompliance(Array.from({ length: 20 }, () => makeSession())).overallScore).toBeLessThanOrEqual(25); });
  it("scores 0 when all false", () => {
    const sessions = [makeSession({ documentedInPlan: false, staffSupported: false, progressRecorded: false })];
    expect(evaluateDigitalCompliance(sessions).overallScore).toBeLessThanOrEqual(5);
  });
});

// ── evaluateDigitalPolicy ────────────────────────────────────────────────────

describe("evaluateDigitalPolicy", () => {
  it("returns 0 for null", () => { const r = evaluateDigitalPolicy(null); expect(r.overallScore).toBe(0); expect(r.onlineSafetyPolicy).toBe(false); });
  it("scores 25 for full policy", () => { expect(evaluateDigitalPolicy(makePolicy()).overallScore).toBe(25); });
  it("4-point items individually", () => { expect(evaluateDigitalPolicy(makePolicy({ onlineSafetyPolicy: true, deviceUsageGuidelines: false, socialMediaPolicy: false, ageVerificationProtocol: false, monitoringFramework: false, incidentResponsePlan: false, regularReview: false })).overallScore).toBe(4); });
  it("3-point items individually", () => { expect(evaluateDigitalPolicy(makePolicy({ onlineSafetyPolicy: false, deviceUsageGuidelines: false, socialMediaPolicy: false, ageVerificationProtocol: false, monitoringFramework: true, incidentResponsePlan: false, regularReview: false })).overallScore).toBe(3); });
  it("4-point items = 16", () => { expect(evaluateDigitalPolicy(makePolicy({ monitoringFramework: false, incidentResponsePlan: false, regularReview: false })).overallScore).toBe(16); });
  it("3-point items = 9", () => { expect(evaluateDigitalPolicy(makePolicy({ onlineSafetyPolicy: false, deviceUsageGuidelines: false, socialMediaPolicy: false, ageVerificationProtocol: false })).overallScore).toBe(9); });
  it("all false = 0", () => { expect(evaluateDigitalPolicy(makePolicy({ onlineSafetyPolicy: false, deviceUsageGuidelines: false, socialMediaPolicy: false, ageVerificationProtocol: false, monitoringFramework: false, incidentResponsePlan: false, regularReview: false })).overallScore).toBe(0); });
  it("returns all boolean fields from policy", () => {
    const r = evaluateDigitalPolicy(makePolicy({ onlineSafetyPolicy: true, deviceUsageGuidelines: false }));
    expect(r.onlineSafetyPolicy).toBe(true);
    expect(r.deviceUsageGuidelines).toBe(false);
  });
  it("null returns all false booleans", () => {
    const r = evaluateDigitalPolicy(null);
    expect(r.deviceUsageGuidelines).toBe(false);
    expect(r.socialMediaPolicy).toBe(false);
    expect(r.ageVerificationProtocol).toBe(false);
    expect(r.monitoringFramework).toBe(false);
    expect(r.incidentResponsePlan).toBe(false);
    expect(r.regularReview).toBe(false);
  });
});

// ── evaluateStaffDigitalReadiness ────────────────────────────────────────────

describe("evaluateStaffDigitalReadiness", () => {
  it("returns 0 for empty", () => { const r = evaluateStaffDigitalReadiness([]); expect(r.overallScore).toBe(0); expect(r.totalStaff).toBe(0); });
  it("scores 25 for fully trained", () => { expect(evaluateStaffDigitalReadiness(Array.from({ length: 5 }, () => makeTraining())).overallScore).toBe(25); });
  it("scores 0 for untrained", () => { expect(evaluateStaffDigitalReadiness([makeTraining({ onlineSafety: false, digitalLiteracy: false, socialMediaAwareness: false, cyberbullyingResponse: false, privacyProtection: false, monitoringSkills: false })]).overallScore).toBe(0); });
  it("single fully trained = 25", () => { expect(evaluateStaffDigitalReadiness([makeTraining()]).overallScore).toBe(25); });
  it("caps at 25", () => { expect(evaluateStaffDigitalReadiness(Array.from({ length: 20 }, () => makeTraining())).overallScore).toBeLessThanOrEqual(25); });
  it("calculates individual skill rates", () => {
    const training = [makeTraining({ onlineSafety: true, digitalLiteracy: false, socialMediaAwareness: true, cyberbullyingResponse: false, privacyProtection: true, monitoringSkills: false })];
    const r = evaluateStaffDigitalReadiness(training);
    expect(r.onlineSafetyRate).toBe(100);
    expect(r.digitalLiteracyRate).toBe(0);
    expect(r.socialMediaAwarenessRate).toBe(100);
    expect(r.cyberbullyingResponseRate).toBe(0);
    expect(r.privacyProtectionRate).toBe(100);
    expect(r.monitoringSkillsRate).toBe(0);
  });
  it("returns totalStaff count", () => {
    expect(evaluateStaffDigitalReadiness(Array.from({ length: 3 }, () => makeTraining())).totalStaff).toBe(3);
  });
});

// ── buildChildDigitalProfiles ────────────────────────────────────────────────

describe("buildChildDigitalProfiles", () => {
  it("returns empty for no sessions", () => { expect(buildChildDigitalProfiles([]).length).toBe(0); });
  it("groups by child", () => {
    const sessions = [makeSession({ childId: "c1", childName: "Alex" }), makeSession({ childId: "c2", childName: "Jordan" })];
    expect(buildChildDigitalProfiles(sessions).length).toBe(2);
  });
  it("calculates competency rate", () => {
    const sessions = [makeSession({ childId: "c1", childName: "Alex", competencyLevel: "advanced" }), makeSession({ childId: "c1", childName: "Alex", competencyLevel: "beginner" })];
    expect(buildChildDigitalProfiles(sessions)[0].competencyRate).toBe(50);
  });
  it("calculates online safety rate", () => {
    const sessions = [makeSession({ childId: "c1", childName: "Alex", onlineSafetyDemonstrated: true }), makeSession({ childId: "c1", childName: "Alex", onlineSafetyDemonstrated: false })];
    expect(buildChildDigitalProfiles(sessions)[0].onlineSafetyRate).toBe(50);
  });
  it("diversity bonus for 4+ types", () => {
    const types: DigitalSession["sessionType"][] = ["online_safety", "coding_skills", "digital_creativity", "research_skills"];
    const sessions = types.map((t) => makeSession({ childId: "c1", childName: "Alex", sessionType: t }));
    expect(buildChildDigitalProfiles(sessions)[0].overallScore).toBeGreaterThanOrEqual(5);
  });
  it("diversity bonus for 2-3 types", () => {
    const types: DigitalSession["sessionType"][] = ["online_safety", "coding_skills"];
    const sessions = types.map((t) => makeSession({ childId: "c1", childName: "Alex", sessionType: t }));
    const profile = buildChildDigitalProfiles(sessions)[0];
    expect(profile.overallScore).toBeGreaterThanOrEqual(1);
  });
  it("caps at 10", () => {
    const sessions = Array.from({ length: 15 }, () => makeSession({ childId: "c1", childName: "Alex" }));
    expect(buildChildDigitalProfiles(sessions)[0].overallScore).toBeLessThanOrEqual(10);
  });
  it("frequency score for 10+ sessions", () => {
    const sessions = Array.from({ length: 10 }, () => makeSession({ childId: "c1", childName: "Alex" }));
    const profile = buildChildDigitalProfiles(sessions)[0];
    expect(profile.overallScore).toBeGreaterThanOrEqual(2);
  });
  it("frequency score for 5-9 sessions", () => {
    const sessions = Array.from({ length: 5 }, () => makeSession({ childId: "c1", childName: "Alex" }));
    const profile = buildChildDigitalProfiles(sessions)[0];
    expect(profile.overallScore).toBeGreaterThanOrEqual(1);
  });
  it("returns totalSessions per child", () => {
    const sessions = [makeSession({ childId: "c1", childName: "Alex" }), makeSession({ childId: "c1", childName: "Alex" }), makeSession({ childId: "c2", childName: "Jordan" })];
    const profiles = buildChildDigitalProfiles(sessions);
    const alex = profiles.find((p) => p.childId === "c1")!;
    const jordan = profiles.find((p) => p.childId === "c2")!;
    expect(alex.totalSessions).toBe(2);
    expect(jordan.totalSessions).toBe(1);
  });
  it("low competency and safety gives low score", () => {
    const sessions = [makeSession({ childId: "c1", childName: "Alex", competencyLevel: "beginner", onlineSafetyDemonstrated: false })];
    expect(buildChildDigitalProfiles(sessions)[0].overallScore).toBeLessThanOrEqual(3);
  });
});

// ── generateDigitalLiteracyDevelopmentIntelligence ───────────────────────────

describe("generateDigitalLiteracyDevelopmentIntelligence", () => {
  const b = { homeId: "oak-house", periodStart: "2026-01-01", periodEnd: "2026-05-19" };

  it("returns inadequate for empty", () => {
    const r = generateDigitalLiteracyDevelopmentIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.overallScore).toBe(0); expect(r.rating).toBe("inadequate");
  });
  it("returns outstanding for perfect", () => {
    const types: DigitalSession["sessionType"][] = ["online_safety", "coding_skills", "digital_creativity", "research_skills", "social_media_awareness", "cyberbullying_education", "privacy_management", "digital_communication"];
    const sessions = Array.from({ length: 10 }, (_, i) => makeSession({ sessionType: types[i % 8] }));
    const r = generateDigitalLiteracyDevelopmentIntelligence(sessions, makePolicy(), Array.from({ length: 5 }, () => makeTraining()), b.homeId, b.periodStart, b.periodEnd);
    expect(r.overallScore).toBe(100); expect(r.rating).toBe("outstanding");
  });
  it("caps at 100", () => {
    const types: DigitalSession["sessionType"][] = ["online_safety", "coding_skills", "digital_creativity", "research_skills", "social_media_awareness", "cyberbullying_education", "privacy_management", "digital_communication"];
    const r = generateDigitalLiteracyDevelopmentIntelligence(Array.from({ length: 20 }, (_, i) => makeSession({ sessionType: types[i % 8] })), makePolicy(), Array.from({ length: 10 }, () => makeTraining()), b.homeId, b.periodStart, b.periodEnd);
    expect(r.overallScore).toBeLessThanOrEqual(100);
  });
  it("includes homeId and period", () => {
    const r = generateDigitalLiteracyDevelopmentIntelligence([], null, [], "test", "2026-01-01", "2026-06-30");
    expect(r.homeId).toBe("test"); expect(r.periodStart).toBe("2026-01-01"); expect(r.periodEnd).toBe("2026-06-30");
  });
  it("generates strength for high competency", () => {
    const r = generateDigitalLiteracyDevelopmentIntelligence(Array.from({ length: 5 }, () => makeSession()), null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.strengths.some((s) => s.includes("competency"))).toBe(true);
  });
  it("generates strength for high online safety", () => {
    const r = generateDigitalLiteracyDevelopmentIntelligence(Array.from({ length: 5 }, () => makeSession()), null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.strengths.some((s) => s.includes("safety"))).toBe(true);
  });
  it("generates strength for high age appropriate", () => {
    const r = generateDigitalLiteracyDevelopmentIntelligence(Array.from({ length: 5 }, () => makeSession()), null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.strengths.some((s) => s.includes("Age-appropriate"))).toBe(true);
  });
  it("generates strength for high documentation", () => {
    const r = generateDigitalLiteracyDevelopmentIntelligence(Array.from({ length: 5 }, () => makeSession()), null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.strengths.some((s) => s.includes("documentation"))).toBe(true);
  });
  it("generates action for no sessions", () => {
    const r = generateDigitalLiteracyDevelopmentIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.actions.some((a) => a.includes("No digital literacy session records"))).toBe(true);
  });
  it("generates URGENT for no policy", () => {
    const r = generateDigitalLiteracyDevelopmentIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.actions.some((a) => a.startsWith("URGENT") && a.includes("policy"))).toBe(true);
  });
  it("generates URGENT for no training", () => {
    const r = generateDigitalLiteracyDevelopmentIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.actions.some((a) => a.startsWith("URGENT") && a.includes("training"))).toBe(true);
  });
  it("has 7 regulatory links", () => {
    const r = generateDigitalLiteracyDevelopmentIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.regulatoryLinks.length).toBe(7);
    expect(r.regulatoryLinks.some((l) => l.includes("UNCRC"))).toBe(true);
    expect(r.regulatoryLinks.some((l) => l.includes("KCSIE"))).toBe(true);
    expect(r.regulatoryLinks.some((l) => l.includes("Online Safety Act"))).toBe(true);
  });
  it("good rating for ~75", () => {
    const r = generateDigitalLiteracyDevelopmentIntelligence(Array.from({ length: 5 }, () => makeSession()), null, Array.from({ length: 5 }, () => makeTraining()), b.homeId, b.periodStart, b.periodEnd);
    expect(r.rating).toBe("good");
  });
  it("generates areas for improvement with poor competency", () => {
    const sessions = Array.from({ length: 5 }, () => makeSession({ competencyLevel: "beginner" }));
    const r = generateDigitalLiteracyDevelopmentIntelligence(sessions, makePolicy(), Array.from({ length: 3 }, () => makeTraining()), b.homeId, b.periodStart, b.periodEnd);
    expect(r.areasForImprovement.some((a) => a.includes("competency"))).toBe(true);
  });
  it("generates areas for improvement with poor safety", () => {
    const sessions = Array.from({ length: 5 }, () => makeSession({ onlineSafetyDemonstrated: false }));
    const r = generateDigitalLiteracyDevelopmentIntelligence(sessions, makePolicy(), Array.from({ length: 3 }, () => makeTraining()), b.homeId, b.periodStart, b.periodEnd);
    expect(r.areasForImprovement.some((a) => a.includes("safety"))).toBe(true);
  });
  it("includes child profiles", () => {
    const sessions = [makeSession({ childId: "c1", childName: "Alex" }), makeSession({ childId: "c2", childName: "Jordan" })];
    const r = generateDigitalLiteracyDevelopmentIntelligence(sessions, makePolicy(), [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.childProfiles.length).toBe(2);
  });
  it("does not generate improvement areas when empty", () => {
    const r = generateDigitalLiteracyDevelopmentIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.areasForImprovement.length).toBe(0);
  });
});
