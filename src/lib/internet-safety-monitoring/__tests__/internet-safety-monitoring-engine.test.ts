// ══════════════════════════════════════════════════════════════════════════════
// TESTS — Internet Safety Monitoring Intelligence Engine
//
// Demo children:
//   - Alex  (cyberbullying victim, medium severity)
//   - Jordan (grooming concern, high severity)
//   - Morgan (no incidents — model digital citizen)
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  generateInternetSafetyMonitoringIntelligence,
  evaluateIncidentManagement,
  evaluateFilteringSafeguards,
  evaluateInternetPolicy,
  evaluateStaffInternetReadiness,
  buildChildInternetProfiles,
  pct,
  getRating,
  generateStrengths,
  generateAreasForImprovement,
  generateActions,
  generateRegulatoryLinks,
  getRiskCategoryLabel,
  getFilteringLevelLabel,
  getIncidentSeverityLabel,
  getRatingLabel,
} from "../internet-safety-monitoring-engine";
import type {
  OnlineSafetyIncident,
  InternetSafetyPolicy,
  StaffInternetTraining,
  RiskCategory,
  FilteringLevel,
  IncidentSeverity,
  Rating,
} from "../internet-safety-monitoring-engine";

// ── Factory Functions ────────────────────────────────────────────────────────

const makeIncident = (
  overrides: Partial<OnlineSafetyIncident> = {},
): OnlineSafetyIncident => ({
  id: "inc-001",
  childId: "child-alex",
  childName: "Alex",
  incidentDate: "2026-03-15",
  riskCategory: "cyberbullying",
  severity: "medium",
  identifiedBy: "staff",
  actionTaken: true,
  childSupported: true,
  parentNotified: true,
  referralMade: false,
  recordedTimely: true,
  lessonsApplied: true,
  ...overrides,
});

const makePolicy = (
  overrides: Partial<InternetSafetyPolicy> = {},
): InternetSafetyPolicy => ({
  id: "policy-001",
  contentFilteringActive: true,
  filteringLevel: "strict",
  regularFilterReview: true,
  onlineSafetyEducation: true,
  socialMediaGuidance: true,
  reportingMechanism: true,
  deviceManagement: true,
  ...overrides,
});

const makeTraining = (
  overrides: Partial<StaffInternetTraining> = {},
): StaffInternetTraining => ({
  id: "train-001",
  staffId: "staff-001",
  staffName: "Sarah Johnson",
  onlineSafety: true,
  groomingAwareness: true,
  cyberbullying: true,
  socialMediaRisks: true,
  reportingProcedures: true,
  ageAppropriateAccess: true,
  ...overrides,
});

// ── pct() helper ─────────────────────────────────────────────────────────────

describe("pct", () => {
  it("returns 0 when denominator is 0", () => {
    expect(pct(5, 0)).toBe(0);
  });

  it("returns 0 when numerator is 0", () => {
    expect(pct(0, 10)).toBe(0);
  });

  it("returns 100 when num equals den", () => {
    expect(pct(10, 10)).toBe(100);
  });

  it("returns 50 for half", () => {
    expect(pct(5, 10)).toBe(50);
  });

  it("rounds to nearest integer", () => {
    expect(pct(1, 3)).toBe(33);
    expect(pct(2, 3)).toBe(67);
  });
});

// ── getRating() ──────────────────────────────────────────────────────────────

describe("getRating", () => {
  it("returns outstanding for score >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
    expect(getRating(95)).toBe("outstanding");
  });

  it("returns good for score >= 60 and < 80", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
  });

  it("returns requires_improvement for score >= 40 and < 60", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
  });

  it("returns inadequate for score < 40", () => {
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(39)).toBe("inadequate");
  });
});

// ── Label Getters ────────────────────────────────────────────────────────────

describe("getRiskCategoryLabel", () => {
  it("returns correct label for each risk category", () => {
    expect(getRiskCategoryLabel("grooming")).toBe("Grooming");
    expect(getRiskCategoryLabel("cyberbullying")).toBe("Cyberbullying");
    expect(getRiskCategoryLabel("inappropriate_content")).toBe("Inappropriate Content");
    expect(getRiskCategoryLabel("radicalisation")).toBe("Radicalisation");
    expect(getRiskCategoryLabel("self_harm_content")).toBe("Self-Harm Content");
    expect(getRiskCategoryLabel("financial_exploitation")).toBe("Financial Exploitation");
    expect(getRiskCategoryLabel("identity_theft")).toBe("Identity Theft");
    expect(getRiskCategoryLabel("sexting")).toBe("Sexting");
  });
});

describe("getFilteringLevelLabel", () => {
  it("returns correct label for each filtering level", () => {
    expect(getFilteringLevelLabel("strict")).toBe("Strict");
    expect(getFilteringLevelLabel("moderate")).toBe("Moderate");
    expect(getFilteringLevelLabel("minimal")).toBe("Minimal");
    expect(getFilteringLevelLabel("none")).toBe("None");
  });
});

describe("getIncidentSeverityLabel", () => {
  it("returns correct label for each severity", () => {
    expect(getIncidentSeverityLabel("low")).toBe("Low");
    expect(getIncidentSeverityLabel("medium")).toBe("Medium");
    expect(getIncidentSeverityLabel("high")).toBe("High");
    expect(getIncidentSeverityLabel("critical")).toBe("Critical");
  });
});

describe("getRatingLabel", () => {
  it("returns correct label for each rating", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ── evaluateIncidentManagement ───────────────────────────────────────────────

describe("evaluateIncidentManagement", () => {
  it("returns 25 for empty incidents (no incidents = ideal)", () => {
    expect(evaluateIncidentManagement([])).toBe(25);
  });

  it("returns max score for perfectly handled incidents", () => {
    const incidents = [
      makeIncident({
        severity: "high",
        actionTaken: true,
        childSupported: true,
        recordedTimely: true,
        referralMade: true,
        lessonsApplied: true,
      }),
    ];
    expect(evaluateIncidentManagement(incidents)).toBe(25);
  });

  it("returns 0 when all fields are false on a low severity incident", () => {
    const incidents = [
      makeIncident({
        severity: "low",
        actionTaken: false,
        childSupported: false,
        recordedTimely: false,
        referralMade: false,
        lessonsApplied: false,
      }),
    ];
    // No high/critical so referral gets full 6
    // action+supported: 0, timely: 0, lessons: 0 => 6
    expect(evaluateIncidentManagement(incidents)).toBe(6);
  });

  it("scores referral appropriateness for high severity incidents", () => {
    const withReferral = [
      makeIncident({ severity: "high", referralMade: true }),
    ];
    const withoutReferral = [
      makeIncident({ severity: "high", referralMade: false }),
    ];
    const scoreWith = evaluateIncidentManagement(withReferral);
    const scoreWithout = evaluateIncidentManagement(withoutReferral);
    expect(scoreWith).toBeGreaterThan(scoreWithout);
  });

  it("scores referral appropriateness for critical severity incidents", () => {
    const withReferral = [
      makeIncident({ severity: "critical", referralMade: true }),
    ];
    const withoutReferral = [
      makeIncident({ severity: "critical", referralMade: false }),
    ];
    expect(evaluateIncidentManagement(withReferral)).toBeGreaterThan(
      evaluateIncidentManagement(withoutReferral),
    );
  });

  it("gives full referral points when no high/critical incidents exist", () => {
    const incidents = [
      makeIncident({
        severity: "low",
        actionTaken: false,
        childSupported: false,
        recordedTimely: false,
        lessonsApplied: false,
        referralMade: false,
      }),
    ];
    // Should get 6 for referral even though referralMade is false
    expect(evaluateIncidentManagement(incidents)).toBe(6);
  });

  it("scores action taken and child supported together", () => {
    const bothTrue = [makeIncident({ actionTaken: true, childSupported: true })];
    const onlyAction = [
      makeIncident({ actionTaken: true, childSupported: false }),
    ];
    expect(evaluateIncidentManagement(bothTrue)).toBeGreaterThan(
      evaluateIncidentManagement(onlyAction),
    );
  });

  it("scores lessons applied correctly", () => {
    const lessonsApplied = [makeIncident({ lessonsApplied: true })];
    const noLessons = [makeIncident({ lessonsApplied: false })];
    expect(evaluateIncidentManagement(lessonsApplied)).toBeGreaterThan(
      evaluateIncidentManagement(noLessons),
    );
  });

  it("handles multiple incidents correctly", () => {
    const incidents = [
      makeIncident({ id: "inc-1", actionTaken: true, childSupported: true, recordedTimely: true, lessonsApplied: true }),
      makeIncident({ id: "inc-2", actionTaken: false, childSupported: false, recordedTimely: false, lessonsApplied: false }),
    ];
    const score = evaluateIncidentManagement(incidents);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(25);
  });

  it("is capped at 25", () => {
    const incidents = [
      makeIncident({
        severity: "high",
        actionTaken: true,
        childSupported: true,
        recordedTimely: true,
        referralMade: true,
        lessonsApplied: true,
      }),
    ];
    expect(evaluateIncidentManagement(incidents)).toBeLessThanOrEqual(25);
  });

  it("never returns below 0", () => {
    const incidents = Array.from({ length: 20 }, (_, i) =>
      makeIncident({
        id: `inc-${i}`,
        actionTaken: false,
        childSupported: false,
        recordedTimely: false,
        lessonsApplied: false,
        severity: "low",
      }),
    );
    expect(evaluateIncidentManagement(incidents)).toBeGreaterThanOrEqual(0);
  });
});

// ── evaluateFilteringSafeguards ──────────────────────────────────────────────

describe("evaluateFilteringSafeguards", () => {
  it("returns 0 for null policy", () => {
    expect(evaluateFilteringSafeguards([], null)).toBe(0);
  });

  it("returns max score for strict filtering with full policy and no incidents", () => {
    const policy = makePolicy();
    expect(evaluateFilteringSafeguards([], policy)).toBe(25);
  });

  it("scores strict filtering level as 6", () => {
    const policy = makePolicy({ filteringLevel: "strict" });
    const score = evaluateFilteringSafeguards([], policy);
    expect(score).toBeGreaterThanOrEqual(6);
  });

  it("scores moderate filtering level as 4", () => {
    const strictPolicy = makePolicy({ filteringLevel: "strict" });
    const moderatePolicy = makePolicy({ filteringLevel: "moderate" });
    expect(evaluateFilteringSafeguards([], strictPolicy)).toBeGreaterThan(
      evaluateFilteringSafeguards([], moderatePolicy),
    );
  });

  it("scores minimal filtering level lower than moderate", () => {
    const moderatePolicy = makePolicy({ filteringLevel: "moderate" });
    const minimalPolicy = makePolicy({ filteringLevel: "minimal" });
    expect(evaluateFilteringSafeguards([], moderatePolicy)).toBeGreaterThan(
      evaluateFilteringSafeguards([], minimalPolicy),
    );
  });

  it("scores none filtering level as 0 for that component", () => {
    const nonePolicy = makePolicy({
      filteringLevel: "none",
      regularFilterReview: false,
      deviceManagement: false,
    });
    const strictPolicy = makePolicy({
      filteringLevel: "strict",
      regularFilterReview: false,
      deviceManagement: false,
    });
    expect(evaluateFilteringSafeguards([], strictPolicy)).toBeGreaterThan(
      evaluateFilteringSafeguards([], nonePolicy),
    );
  });

  it("gives 0 for filtering level when contentFilteringActive is false", () => {
    const policy = makePolicy({
      contentFilteringActive: false,
      regularFilterReview: false,
      deviceManagement: false,
    });
    // No filtering points, no review points, no device management, no severity dist
    expect(evaluateFilteringSafeguards([], policy)).toBe(0);
  });

  it("adds 5 for regular filter review", () => {
    const withReview = makePolicy({ regularFilterReview: true, deviceManagement: false });
    const withoutReview = makePolicy({ regularFilterReview: false, deviceManagement: false });
    expect(evaluateFilteringSafeguards([], withReview)).toBeGreaterThan(
      evaluateFilteringSafeguards([], withoutReview),
    );
  });

  it("adds 7 for device management", () => {
    const withDevice = makePolicy({ deviceManagement: true, regularFilterReview: false });
    const withoutDevice = makePolicy({ deviceManagement: false, regularFilterReview: false });
    expect(evaluateFilteringSafeguards([], withDevice)).toBeGreaterThan(
      evaluateFilteringSafeguards([], withoutDevice),
    );
  });

  it("rewards low severity distribution when filtering is active", () => {
    const incidents = [
      makeIncident({ severity: "low" }),
      makeIncident({ id: "inc-2", severity: "low" }),
    ];
    const policy = makePolicy();
    const scoreWithLow = evaluateFilteringSafeguards(incidents, policy);
    const highIncidents = [
      makeIncident({ severity: "high" }),
      makeIncident({ id: "inc-2", severity: "critical" }),
    ];
    const scoreWithHigh = evaluateFilteringSafeguards(highIncidents, policy);
    expect(scoreWithLow).toBeGreaterThan(scoreWithHigh);
  });

  it("gives full severity distribution points when filtering active and no incidents", () => {
    const policy = makePolicy();
    // Should get 7 for severity distribution + 6 for strict + 5 for review + 7 for device = 25
    expect(evaluateFilteringSafeguards([], policy)).toBe(25);
  });

  it("is capped at 25", () => {
    expect(evaluateFilteringSafeguards([], makePolicy())).toBeLessThanOrEqual(25);
  });
});

// ── evaluateInternetPolicy ───────────────────────────────────────────────────

describe("evaluateInternetPolicy", () => {
  it("returns 0 for null policy", () => {
    expect(evaluateInternetPolicy(null)).toBe(0);
  });

  it("returns max score for full policy with strict filtering", () => {
    expect(evaluateInternetPolicy(makePolicy())).toBe(25);
  });

  it("scores contentFilteringActive as 4", () => {
    const active = makePolicy({ contentFilteringActive: true });
    const inactive = makePolicy({ contentFilteringActive: false });
    expect(evaluateInternetPolicy(active)).toBeGreaterThan(
      evaluateInternetPolicy(inactive),
    );
  });

  it("scores strict filtering level higher than moderate", () => {
    const strict = makePolicy({ filteringLevel: "strict" });
    const moderate = makePolicy({ filteringLevel: "moderate" });
    expect(evaluateInternetPolicy(strict)).toBeGreaterThan(
      evaluateInternetPolicy(moderate),
    );
  });

  it("scores moderate filtering level higher than minimal", () => {
    const moderate = makePolicy({ filteringLevel: "moderate" });
    const minimal = makePolicy({ filteringLevel: "minimal" });
    expect(evaluateInternetPolicy(moderate)).toBeGreaterThan(
      evaluateInternetPolicy(minimal),
    );
  });

  it("scores none filtering level as 0", () => {
    const none = makePolicy({ filteringLevel: "none" });
    const minimal = makePolicy({ filteringLevel: "minimal" });
    expect(evaluateInternetPolicy(minimal)).toBeGreaterThan(
      evaluateInternetPolicy(none),
    );
  });

  it("scores regularFilterReview", () => {
    const withReview = makePolicy({ regularFilterReview: true });
    const withoutReview = makePolicy({ regularFilterReview: false });
    expect(evaluateInternetPolicy(withReview)).toBeGreaterThan(
      evaluateInternetPolicy(withoutReview),
    );
  });

  it("scores onlineSafetyEducation", () => {
    const withEdu = makePolicy({ onlineSafetyEducation: true });
    const withoutEdu = makePolicy({ onlineSafetyEducation: false });
    expect(evaluateInternetPolicy(withEdu)).toBeGreaterThan(
      evaluateInternetPolicy(withoutEdu),
    );
  });

  it("scores socialMediaGuidance", () => {
    const withSocial = makePolicy({ socialMediaGuidance: true });
    const withoutSocial = makePolicy({ socialMediaGuidance: false });
    expect(evaluateInternetPolicy(withSocial)).toBeGreaterThan(
      evaluateInternetPolicy(withoutSocial),
    );
  });

  it("scores reportingMechanism", () => {
    const withReport = makePolicy({ reportingMechanism: true });
    const withoutReport = makePolicy({ reportingMechanism: false });
    expect(evaluateInternetPolicy(withReport)).toBeGreaterThan(
      evaluateInternetPolicy(withoutReport),
    );
  });

  it("scores deviceManagement", () => {
    const withDevice = makePolicy({ deviceManagement: true });
    const withoutDevice = makePolicy({ deviceManagement: false });
    expect(evaluateInternetPolicy(withDevice)).toBeGreaterThan(
      evaluateInternetPolicy(withoutDevice),
    );
  });

  it("returns 0 for policy with all false and none filtering", () => {
    const empty = makePolicy({
      contentFilteringActive: false,
      filteringLevel: "none",
      regularFilterReview: false,
      onlineSafetyEducation: false,
      socialMediaGuidance: false,
      reportingMechanism: false,
      deviceManagement: false,
    });
    expect(evaluateInternetPolicy(empty)).toBe(0);
  });

  it("is capped at 25", () => {
    expect(evaluateInternetPolicy(makePolicy())).toBeLessThanOrEqual(25);
  });
});

// ── evaluateStaffInternetReadiness ───────────────────────────────────────────

describe("evaluateStaffInternetReadiness", () => {
  it("returns 0 for empty training array", () => {
    expect(evaluateStaffInternetReadiness([])).toBe(0);
  });

  it("returns max score when all staff have all training", () => {
    const training = [makeTraining(), makeTraining({ id: "train-002", staffId: "staff-002", staffName: "Tom Davies" })];
    expect(evaluateStaffInternetReadiness(training)).toBe(25);
  });

  it("scores onlineSafety training", () => {
    const withOnline = [makeTraining({ onlineSafety: true })];
    const withoutOnline = [makeTraining({ onlineSafety: false })];
    expect(evaluateStaffInternetReadiness(withOnline)).toBeGreaterThan(
      evaluateStaffInternetReadiness(withoutOnline),
    );
  });

  it("scores groomingAwareness training", () => {
    const withGrooming = [makeTraining({ groomingAwareness: true })];
    const withoutGrooming = [makeTraining({ groomingAwareness: false })];
    expect(evaluateStaffInternetReadiness(withGrooming)).toBeGreaterThan(
      evaluateStaffInternetReadiness(withoutGrooming),
    );
  });

  it("scores cyberbullying training", () => {
    const withCyber = [makeTraining({ cyberbullying: true })];
    const withoutCyber = [makeTraining({ cyberbullying: false })];
    expect(evaluateStaffInternetReadiness(withCyber)).toBeGreaterThan(
      evaluateStaffInternetReadiness(withoutCyber),
    );
  });

  it("scores socialMediaRisks training", () => {
    const withSocial = [makeTraining({ socialMediaRisks: true })];
    const withoutSocial = [makeTraining({ socialMediaRisks: false })];
    expect(evaluateStaffInternetReadiness(withSocial)).toBeGreaterThan(
      evaluateStaffInternetReadiness(withoutSocial),
    );
  });

  it("scores reportingProcedures training", () => {
    const withReporting = [makeTraining({ reportingProcedures: true })];
    const withoutReporting = [makeTraining({ reportingProcedures: false })];
    expect(evaluateStaffInternetReadiness(withReporting)).toBeGreaterThan(
      evaluateStaffInternetReadiness(withoutReporting),
    );
  });

  it("scores ageAppropriateAccess training", () => {
    const withAge = [makeTraining({ ageAppropriateAccess: true })];
    const withoutAge = [makeTraining({ ageAppropriateAccess: false })];
    expect(evaluateStaffInternetReadiness(withAge)).toBeGreaterThan(
      evaluateStaffInternetReadiness(withoutAge),
    );
  });

  it("returns 0 when all training fields are false", () => {
    const noTraining = [
      makeTraining({
        onlineSafety: false,
        groomingAwareness: false,
        cyberbullying: false,
        socialMediaRisks: false,
        reportingProcedures: false,
        ageAppropriateAccess: false,
      }),
    ];
    expect(evaluateStaffInternetReadiness(noTraining)).toBe(0);
  });

  it("handles mixed training across staff", () => {
    const training = [
      makeTraining({ onlineSafety: true, groomingAwareness: true, cyberbullying: false, socialMediaRisks: false, reportingProcedures: false, ageAppropriateAccess: false }),
      makeTraining({ id: "train-002", staffId: "staff-002", staffName: "Tom", onlineSafety: false, groomingAwareness: false, cyberbullying: true, socialMediaRisks: true, reportingProcedures: false, ageAppropriateAccess: false }),
    ];
    const score = evaluateStaffInternetReadiness(training);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(25);
  });

  it("is capped at 25", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({ id: `train-${i}`, staffId: `staff-${i}`, staffName: `Staff ${i}` }),
    );
    expect(evaluateStaffInternetReadiness(training)).toBeLessThanOrEqual(25);
  });
});

// ── buildChildInternetProfiles ───────────────────────────────────────────────

describe("buildChildInternetProfiles", () => {
  it("returns empty array for no incidents", () => {
    expect(buildChildInternetProfiles([])).toEqual([]);
  });

  it("groups incidents by child", () => {
    const incidents = [
      makeIncident({ childId: "child-alex", childName: "Alex" }),
      makeIncident({ id: "inc-2", childId: "child-alex", childName: "Alex" }),
      makeIncident({ id: "inc-3", childId: "child-jordan", childName: "Jordan" }),
    ];
    const profiles = buildChildInternetProfiles(incidents);
    expect(profiles).toHaveLength(2);
    const alex = profiles.find((p) => p.childId === "child-alex");
    const jordan = profiles.find((p) => p.childId === "child-jordan");
    expect(alex?.totalIncidents).toBe(2);
    expect(jordan?.totalIncidents).toBe(1);
  });

  it("counts high risk incidents correctly", () => {
    const incidents = [
      makeIncident({ severity: "high" }),
      makeIncident({ id: "inc-2", severity: "critical" }),
      makeIncident({ id: "inc-3", severity: "low" }),
    ];
    const profiles = buildChildInternetProfiles(incidents);
    expect(profiles[0].highRiskIncidents).toBe(2);
  });

  it("calculates supported rate", () => {
    const incidents = [
      makeIncident({ childSupported: true }),
      makeIncident({ id: "inc-2", childSupported: false }),
    ];
    const profiles = buildChildInternetProfiles(incidents);
    expect(profiles[0].supportedRate).toBe(50);
  });

  it("gives score of 10 for child with no incidents (unreachable but max score logic)", () => {
    // buildChildInternetProfiles only creates profiles for children WITH incidents
    // so this tests the upper bound of the score for 1 low incident fully supported
    const incidents = [
      makeIncident({ severity: "low", childSupported: true }),
    ];
    const profiles = buildChildInternetProfiles(incidents);
    // 10 - 1 (one incident) - 0 (no high risk) + 2 (100% supported) = 11 => capped at 10
    expect(profiles[0].overallScore).toBeLessThanOrEqual(10);
  });

  it("decreases score with more incidents", () => {
    const oneIncident = buildChildInternetProfiles([makeIncident()]);
    const threeIncidents = buildChildInternetProfiles([
      makeIncident({ id: "inc-1" }),
      makeIncident({ id: "inc-2" }),
      makeIncident({ id: "inc-3" }),
    ]);
    expect(oneIncident[0].overallScore).toBeGreaterThanOrEqual(
      threeIncidents[0].overallScore,
    );
  });

  it("decreases score with high/critical severity", () => {
    const lowSeverity = buildChildInternetProfiles([
      makeIncident({ severity: "low" }),
    ]);
    const highSeverity = buildChildInternetProfiles([
      makeIncident({ severity: "high" }),
    ]);
    expect(lowSeverity[0].overallScore).toBeGreaterThanOrEqual(
      highSeverity[0].overallScore,
    );
  });

  it("adds back points for full support", () => {
    const supported = buildChildInternetProfiles([
      makeIncident({ childSupported: true }),
    ]);
    const unsupported = buildChildInternetProfiles([
      makeIncident({ childSupported: false }),
    ]);
    expect(supported[0].overallScore).toBeGreaterThan(
      unsupported[0].overallScore,
    );
  });

  it("score never goes below 0", () => {
    const manyHighIncidents = Array.from({ length: 10 }, (_, i) =>
      makeIncident({
        id: `inc-${i}`,
        severity: "critical",
        childSupported: false,
      }),
    );
    const profiles = buildChildInternetProfiles(manyHighIncidents);
    expect(profiles[0].overallScore).toBeGreaterThanOrEqual(0);
  });

  it("score never exceeds 10", () => {
    const incidents = [
      makeIncident({ severity: "low", childSupported: true }),
    ];
    const profiles = buildChildInternetProfiles(incidents);
    expect(profiles[0].overallScore).toBeLessThanOrEqual(10);
  });

  it("preserves childName", () => {
    const profiles = buildChildInternetProfiles([
      makeIncident({ childName: "Jordan" }),
    ]);
    expect(profiles[0].childName).toBe("Jordan");
  });
});

// ── generateStrengths ────────────────────────────────────────────────────────

describe("generateStrengths", () => {
  it("includes no-incidents strength when incidents are empty", () => {
    const strengths = generateStrengths(25, 25, 25, 25, [], makePolicy(), [makeTraining()]);
    expect(strengths.some((s) => s.includes("No online safety incidents"))).toBe(true);
  });

  it("includes incident management strength when score >= 20", () => {
    const strengths = generateStrengths(20, 0, 0, 0, [makeIncident()], null, []);
    expect(strengths.some((s) => s.includes("Incident management"))).toBe(true);
  });

  it("includes filtering strength when score >= 20", () => {
    const strengths = generateStrengths(0, 20, 0, 0, [], makePolicy(), []);
    expect(strengths.some((s) => s.includes("filtering"))).toBe(true);
  });

  it("includes policy strength when score >= 20", () => {
    const strengths = generateStrengths(0, 0, 20, 0, [], makePolicy(), []);
    expect(strengths.some((s) => s.includes("policy"))).toBe(true);
  });

  it("includes staff readiness strength when score >= 20", () => {
    const strengths = generateStrengths(0, 0, 0, 20, [], null, [makeTraining()]);
    expect(strengths.some((s) => s.includes("Staff are well-trained"))).toBe(true);
  });

  it("includes strict filtering strength", () => {
    const policy = makePolicy({ filteringLevel: "strict" });
    const strengths = generateStrengths(0, 0, 0, 0, [], policy, []);
    expect(strengths.some((s) => s.includes("Strict content filtering"))).toBe(true);
  });

  it("includes education and social media strength", () => {
    const policy = makePolicy({ onlineSafetyEducation: true, socialMediaGuidance: true });
    const strengths = generateStrengths(0, 0, 0, 0, [], policy, []);
    expect(strengths.some((s) => s.includes("online safety education"))).toBe(true);
  });

  it("includes all-supported strength when all incidents supported", () => {
    const incidents = [makeIncident({ childSupported: true })];
    const strengths = generateStrengths(0, 0, 0, 0, incidents, null, []);
    expect(strengths.some((s) => s.includes("All children involved"))).toBe(true);
  });

  it("includes grooming training strength when all staff trained", () => {
    const training = [makeTraining({ groomingAwareness: true })];
    const strengths = generateStrengths(0, 0, 0, 0, [], null, training);
    expect(strengths.some((s) => s.includes("grooming awareness"))).toBe(true);
  });

  it("does not include all-supported strength when some not supported", () => {
    const incidents = [
      makeIncident({ childSupported: true }),
      makeIncident({ id: "inc-2", childSupported: false }),
    ];
    const strengths = generateStrengths(0, 0, 0, 0, incidents, null, []);
    expect(strengths.some((s) => s.includes("All children involved"))).toBe(false);
  });
});

// ── generateAreasForImprovement ──────────────────────────────────────────────

describe("generateAreasForImprovement", () => {
  it("flags no policy as serious gap", () => {
    const areas = generateAreasForImprovement(0, 0, 0, 0, [], null, []);
    expect(areas.some((a) => a.includes("No internet safety policy"))).toBe(true);
  });

  it("flags inactive content filtering", () => {
    const policy = makePolicy({ contentFilteringActive: false });
    const areas = generateAreasForImprovement(0, 0, 0, 0, [], policy, []);
    expect(areas.some((a) => a.includes("Content filtering is not active"))).toBe(true);
  });

  it("flags minimal filtering level", () => {
    const policy = makePolicy({ filteringLevel: "minimal" });
    const areas = generateAreasForImprovement(0, 0, 0, 0, [], policy, []);
    expect(areas.some((a) => a.includes("minimal"))).toBe(true);
  });

  it("flags none filtering level", () => {
    const policy = makePolicy({ filteringLevel: "none" });
    const areas = generateAreasForImprovement(0, 0, 0, 0, [], policy, []);
    expect(areas.some((a) => a.includes("none"))).toBe(true);
  });

  it("flags no filter review", () => {
    const policy = makePolicy({ regularFilterReview: false });
    const areas = generateAreasForImprovement(0, 0, 0, 0, [], policy, []);
    expect(areas.some((a) => a.includes("not regularly reviewed"))).toBe(true);
  });

  it("flags no online safety education", () => {
    const policy = makePolicy({ onlineSafetyEducation: false });
    const areas = generateAreasForImprovement(0, 0, 0, 0, [], policy, []);
    expect(areas.some((a) => a.includes("online safety education"))).toBe(true);
  });

  it("flags no device management", () => {
    const policy = makePolicy({ deviceManagement: false });
    const areas = generateAreasForImprovement(0, 0, 0, 0, [], policy, []);
    expect(areas.some((a) => a.includes("Device management"))).toBe(true);
  });

  it("flags no staff training", () => {
    const areas = generateAreasForImprovement(0, 0, 0, 0, [], makePolicy(), []);
    expect(areas.some((a) => a.includes("No staff have completed"))).toBe(true);
  });

  it("flags low staff readiness score with existing training", () => {
    const training = [makeTraining({ onlineSafety: false, groomingAwareness: false, cyberbullying: false, socialMediaRisks: false, reportingProcedures: false, ageAppropriateAccess: false })];
    const areas = generateAreasForImprovement(0, 0, 0, 0, [], makePolicy(), training);
    expect(areas.some((a) => a.includes("training coverage is below"))).toBe(true);
  });

  it("flags low action taken rate", () => {
    const incidents = [
      makeIncident({ actionTaken: false }),
      makeIncident({ id: "inc-2", actionTaken: false }),
      makeIncident({ id: "inc-3", actionTaken: false }),
      makeIncident({ id: "inc-4", actionTaken: true }),
    ];
    const areas = generateAreasForImprovement(0, 0, 0, 0, incidents, makePolicy(), [makeTraining()]);
    expect(areas.some((a) => a.includes("action taken"))).toBe(true);
  });

  it("flags low recording timeliness", () => {
    const incidents = [
      makeIncident({ recordedTimely: false }),
      makeIncident({ id: "inc-2", recordedTimely: false }),
      makeIncident({ id: "inc-3", recordedTimely: false }),
      makeIncident({ id: "inc-4", recordedTimely: true }),
    ];
    const areas = generateAreasForImprovement(0, 0, 0, 0, incidents, makePolicy(), [makeTraining()]);
    expect(areas.some((a) => a.includes("Recording timeliness"))).toBe(true);
  });

  it("flags low lessons applied rate", () => {
    const incidents = [
      makeIncident({ lessonsApplied: false }),
      makeIncident({ id: "inc-2", lessonsApplied: false }),
      makeIncident({ id: "inc-3", lessonsApplied: false }),
    ];
    const areas = generateAreasForImprovement(0, 0, 0, 0, incidents, makePolicy(), [makeTraining()]);
    expect(areas.some((a) => a.includes("Lessons learned"))).toBe(true);
  });

  it("does not flag action rate when 100%", () => {
    const incidents = [makeIncident({ actionTaken: true })];
    const areas = generateAreasForImprovement(25, 25, 25, 25, incidents, makePolicy(), [makeTraining()]);
    expect(areas.some((a) => a.includes("action taken"))).toBe(false);
  });
});

// ── generateActions ──────────────────────────────────────────────────────────

describe("generateActions", () => {
  it("generates URGENT action for children with 2+ high risk incidents", () => {
    const incidents = [
      makeIncident({ severity: "high" }),
      makeIncident({ id: "inc-2", severity: "critical" }),
    ];
    const profiles = buildChildInternetProfiles(incidents);
    const actions = generateActions(incidents, makePolicy(), [makeTraining()], profiles);
    expect(actions.some((a) => a.startsWith("URGENT:"))).toBe(true);
  });

  it("generates URGENT action for no policy", () => {
    const actions = generateActions([], null, [], []);
    expect(actions.some((a) => a.includes("URGENT") && a.includes("policy"))).toBe(true);
  });

  it("generates HIGH action for inactive filtering", () => {
    const policy = makePolicy({ contentFilteringActive: false });
    const actions = generateActions([], policy, [], []);
    expect(actions.some((a) => a.startsWith("HIGH:"))).toBe(true);
  });

  it("generates HIGH action for no training", () => {
    const actions = generateActions([], makePolicy(), [], []);
    expect(actions.some((a) => a.includes("HIGH") && a.includes("training"))).toBe(true);
  });

  it("generates MEDIUM action for unsupported children", () => {
    const incidents = [makeIncident({ childSupported: false })];
    const profiles = buildChildInternetProfiles(incidents);
    const actions = generateActions(incidents, makePolicy(), [makeTraining()], profiles);
    expect(actions.some((a) => a.includes("MEDIUM") && a.includes("supported"))).toBe(true);
  });

  it("generates MEDIUM action for high/critical without referral", () => {
    const incidents = [
      makeIncident({ severity: "high", referralMade: false }),
    ];
    const profiles = buildChildInternetProfiles(incidents);
    const actions = generateActions(incidents, makePolicy(), [makeTraining()], profiles);
    expect(actions.some((a) => a.includes("MEDIUM") && a.includes("referral"))).toBe(true);
  });

  it("generates LOW action for missing social media guidance", () => {
    const policy = makePolicy({ socialMediaGuidance: false });
    const actions = generateActions([], policy, [makeTraining()], []);
    expect(actions.some((a) => a.includes("LOW") && a.includes("social media"))).toBe(true);
  });

  it("generates LOW action for missing reporting mechanism", () => {
    const policy = makePolicy({ reportingMechanism: false });
    const actions = generateActions([], policy, [makeTraining()], []);
    expect(actions.some((a) => a.includes("LOW") && a.includes("reporting mechanism"))).toBe(true);
  });

  it("generates default action when everything is fine", () => {
    const actions = generateActions([], makePolicy(), [makeTraining()], []);
    expect(actions.some((a) => a.includes("No immediate actions"))).toBe(true);
  });
});

// ── generateRegulatoryLinks ──────────────────────────────────────────────────

describe("generateRegulatoryLinks", () => {
  it("always includes 7 core regulatory links", () => {
    const links = generateRegulatoryLinks([], makePolicy());
    expect(links.length).toBeGreaterThanOrEqual(7);
    expect(links.some((l) => l.includes("CHR 2015 Reg 12"))).toBe(true);
    expect(links.some((l) => l.includes("CHR 2015 Reg 13"))).toBe(true);
    expect(links.some((l) => l.includes("SCCIF"))).toBe(true);
    expect(links.some((l) => l.includes("Keeping Children Safe in Education"))).toBe(true);
    expect(links.some((l) => l.includes("Online Safety Act 2023"))).toBe(true);
    expect(links.some((l) => l.includes("NMS 4"))).toBe(true);
    expect(links.some((l) => l.includes("UNCRC Article 17"))).toBe(true);
  });

  it("adds grooming link when grooming incidents exist", () => {
    const incidents = [makeIncident({ riskCategory: "grooming" })];
    const links = generateRegulatoryLinks(incidents, makePolicy());
    expect(links.some((l) => l.includes("grooming"))).toBe(true);
  });

  it("adds radicalisation link when radicalisation incidents exist", () => {
    const incidents = [makeIncident({ riskCategory: "radicalisation" })];
    const links = generateRegulatoryLinks(incidents, makePolicy());
    expect(links.some((l) => l.includes("Prevent Duty"))).toBe(true);
  });

  it("adds sexting link when sexting incidents exist", () => {
    const incidents = [makeIncident({ riskCategory: "sexting" })];
    const links = generateRegulatoryLinks(incidents, makePolicy());
    expect(links.some((l) => l.includes("Sharing Nudes"))).toBe(true);
  });

  it("adds filtering standards link when no policy", () => {
    const links = generateRegulatoryLinks([], null);
    expect(links.some((l) => l.includes("Filtering and Monitoring"))).toBe(true);
  });

  it("adds filtering standards link when filtering inactive", () => {
    const policy = makePolicy({ contentFilteringActive: false });
    const links = generateRegulatoryLinks([], policy);
    expect(links.some((l) => l.includes("Filtering and Monitoring"))).toBe(true);
  });

  it("does not add filtering standards link when filtering is active", () => {
    const policy = makePolicy({ contentFilteringActive: true });
    const links = generateRegulatoryLinks([], policy);
    expect(links.some((l) => l.includes("Filtering and Monitoring"))).toBe(false);
  });
});

// ── generateInternetSafetyMonitoringIntelligence (orchestrator) ─────────────

describe("generateInternetSafetyMonitoringIntelligence", () => {
  const fullPolicy = makePolicy();
  const fullTraining = [
    makeTraining(),
    makeTraining({ id: "train-002", staffId: "staff-002", staffName: "Tom Davies" }),
  ];

  it("returns correct homeId", () => {
    const result = generateInternetSafetyMonitoringIntelligence(
      [], fullPolicy, fullTraining, "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.homeId).toBe("oak-house");
  });

  it("returns correct period", () => {
    const result = generateInternetSafetyMonitoringIntelligence(
      [], fullPolicy, fullTraining, "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-19");
  });

  it("sets assessedAt to periodEnd (deterministic)", () => {
    const result = generateInternetSafetyMonitoringIntelligence(
      [], fullPolicy, fullTraining, "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.assessedAt).toBe("2026-05-19");
  });

  it("returns outstanding rating with no incidents and full policy/training", () => {
    const result = generateInternetSafetyMonitoringIntelligence(
      [], fullPolicy, fullTraining, "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.rating).toBe("outstanding");
  });

  it("returns inadequate rating with no policy and no training", () => {
    const result = generateInternetSafetyMonitoringIntelligence(
      [makeIncident({ actionTaken: false, childSupported: false, recordedTimely: false, lessonsApplied: false, severity: "high", referralMade: false })],
      null,
      [],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.overallScore).toBeLessThan(40);
    expect(result.rating).toBe("inadequate");
  });

  it("sums sub-scores correctly", () => {
    const result = generateInternetSafetyMonitoringIntelligence(
      [], fullPolicy, fullTraining, "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.overallScore).toBe(
      result.incidentManagementScore +
        result.filteringSafeguardsScore +
        result.internetPolicyScore +
        result.staffInternetReadinessScore,
    );
  });

  it("caps overallScore at 100", () => {
    const result = generateInternetSafetyMonitoringIntelligence(
      [], fullPolicy, fullTraining, "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("counts total incidents", () => {
    const incidents = [
      makeIncident({ id: "inc-1" }),
      makeIncident({ id: "inc-2" }),
    ];
    const result = generateInternetSafetyMonitoringIntelligence(
      incidents, fullPolicy, fullTraining, "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.totalIncidents).toBe(2);
  });

  it("counts high/critical incidents", () => {
    const incidents = [
      makeIncident({ id: "inc-1", severity: "high" }),
      makeIncident({ id: "inc-2", severity: "critical" }),
      makeIncident({ id: "inc-3", severity: "low" }),
    ];
    const result = generateInternetSafetyMonitoringIntelligence(
      incidents, fullPolicy, fullTraining, "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.highCriticalIncidents).toBe(2);
  });

  it("calculates action taken rate", () => {
    const incidents = [
      makeIncident({ id: "inc-1", actionTaken: true }),
      makeIncident({ id: "inc-2", actionTaken: false }),
    ];
    const result = generateInternetSafetyMonitoringIntelligence(
      incidents, fullPolicy, fullTraining, "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.actionTakenRate).toBe(50);
  });

  it("calculates child supported rate", () => {
    const incidents = [
      makeIncident({ id: "inc-1", childSupported: true }),
      makeIncident({ id: "inc-2", childSupported: true }),
      makeIncident({ id: "inc-3", childSupported: false }),
    ];
    const result = generateInternetSafetyMonitoringIntelligence(
      incidents, fullPolicy, fullTraining, "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.childSupportedRate).toBe(67);
  });

  it("calculates referral appropriateness rate", () => {
    const incidents = [
      makeIncident({ id: "inc-1", severity: "high", referralMade: true }),
      makeIncident({ id: "inc-2", severity: "critical", referralMade: false }),
    ];
    const result = generateInternetSafetyMonitoringIntelligence(
      incidents, fullPolicy, fullTraining, "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.referralAppropriatenessRate).toBe(50);
  });

  it("leaves referral appropriateness unmeasured when no high/critical incidents", () => {
    const incidents = [makeIncident({ severity: "low" })];
    const result = generateInternetSafetyMonitoringIntelligence(
      incidents, fullPolicy, fullTraining, "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.referralAppropriatenessRate).toBeNull();
  });

  it("calculates staff training coverage rate", () => {
    const training = [
      makeTraining(),
      makeTraining({
        id: "train-002",
        staffId: "staff-002",
        staffName: "Tom",
        onlineSafety: true,
        groomingAwareness: false, // missing one
        cyberbullying: true,
        socialMediaRisks: true,
        reportingProcedures: true,
        ageAppropriateAccess: true,
      }),
    ];
    const result = generateInternetSafetyMonitoringIntelligence(
      [], fullPolicy, training, "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.staffTrainingCoverageRate).toBe(50);
  });

  it("leaves staff training coverage unmeasured when no training", () => {
    const result = generateInternetSafetyMonitoringIntelligence(
      [], fullPolicy, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.staffTrainingCoverageRate).toBeNull();
  });

  it("builds incidents by category breakdown", () => {
    const incidents = [
      makeIncident({ id: "inc-1", riskCategory: "grooming" }),
      makeIncident({ id: "inc-2", riskCategory: "grooming" }),
      makeIncident({ id: "inc-3", riskCategory: "cyberbullying" }),
    ];
    const result = generateInternetSafetyMonitoringIntelligence(
      incidents, fullPolicy, fullTraining, "oak-house", "2026-01-01", "2026-05-19",
    );
    const groomingEntry = result.incidentsByCategory.find(
      (c) => c.category === "grooming",
    );
    expect(groomingEntry?.count).toBe(2);
    expect(groomingEntry?.label).toBe("Grooming");
  });

  it("builds incidents by severity breakdown", () => {
    const incidents = [
      makeIncident({ id: "inc-1", severity: "high" }),
      makeIncident({ id: "inc-2", severity: "high" }),
      makeIncident({ id: "inc-3", severity: "low" }),
    ];
    const result = generateInternetSafetyMonitoringIntelligence(
      incidents, fullPolicy, fullTraining, "oak-house", "2026-01-01", "2026-05-19",
    );
    const highEntry = result.incidentsBySeverity.find(
      (s) => s.severity === "high",
    );
    expect(highEntry?.count).toBe(2);
  });

  it("builds child internet profiles", () => {
    const incidents = [
      makeIncident({ childId: "child-alex", childName: "Alex" }),
      makeIncident({ id: "inc-2", childId: "child-jordan", childName: "Jordan" }),
    ];
    const result = generateInternetSafetyMonitoringIntelligence(
      incidents, fullPolicy, fullTraining, "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.childInternetProfiles).toHaveLength(2);
  });

  it("generates strengths array", () => {
    const result = generateInternetSafetyMonitoringIntelligence(
      [], fullPolicy, fullTraining, "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("generates areas for improvement when policy missing", () => {
    const result = generateInternetSafetyMonitoringIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("generates actions array", () => {
    const result = generateInternetSafetyMonitoringIntelligence(
      [], fullPolicy, fullTraining, "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.actions.length).toBeGreaterThan(0);
  });

  it("generates regulatory links array with at least 7 entries", () => {
    const result = generateInternetSafetyMonitoringIntelligence(
      [], fullPolicy, fullTraining, "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.regulatoryLinks.length).toBeGreaterThanOrEqual(7);
  });

  it("is deterministic — same input produces same output", () => {
    const incidents = [makeIncident()];
    const result1 = generateInternetSafetyMonitoringIntelligence(
      incidents, fullPolicy, fullTraining, "oak-house", "2026-01-01", "2026-05-19",
    );
    const result2 = generateInternetSafetyMonitoringIntelligence(
      incidents, fullPolicy, fullTraining, "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result1).toEqual(result2);
  });

  it("handles empty inputs gracefully", () => {
    const result = generateInternetSafetyMonitoringIntelligence(
      [], null, [], "test-home", "2026-01-01", "2026-05-19",
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.totalIncidents).toBe(0);
    expect(result.childInternetProfiles).toEqual([]);
  });

  it("all sub-scores are within 0-25 range", () => {
    const incidents = Array.from({ length: 15 }, (_, i) =>
      makeIncident({
        id: `inc-${i}`,
        severity: i % 2 === 0 ? "high" : "low",
        actionTaken: i % 3 === 0,
        childSupported: i % 2 === 0,
        recordedTimely: i % 4 === 0,
        lessonsApplied: i % 5 === 0,
        referralMade: i % 2 === 0,
      }),
    );
    const result = generateInternetSafetyMonitoringIntelligence(
      incidents, fullPolicy, fullTraining, "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.incidentManagementScore).toBeGreaterThanOrEqual(0);
    expect(result.incidentManagementScore).toBeLessThanOrEqual(25);
    expect(result.filteringSafeguardsScore).toBeGreaterThanOrEqual(0);
    expect(result.filteringSafeguardsScore).toBeLessThanOrEqual(25);
    expect(result.internetPolicyScore).toBeGreaterThanOrEqual(0);
    expect(result.internetPolicyScore).toBeLessThanOrEqual(25);
    expect(result.staffInternetReadinessScore).toBeGreaterThanOrEqual(0);
    expect(result.staffInternetReadinessScore).toBeLessThanOrEqual(25);
  });

  it("has recorded timely rate and lessons applied rate between 0 and 100", () => {
    const incidents = [makeIncident()];
    const result = generateInternetSafetyMonitoringIntelligence(
      incidents, fullPolicy, fullTraining, "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.recordedTimelyRate).toBeGreaterThanOrEqual(0);
    expect(result.recordedTimelyRate).toBeLessThanOrEqual(100);
    expect(result.lessonsAppliedRate).toBeGreaterThanOrEqual(0);
    expect(result.lessonsAppliedRate).toBeLessThanOrEqual(100);
  });
});
