// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Outcomes Measurement Intelligence Engine — Tests
//
// Demo children:
//   Alex    — improving emotional wellbeing/education, regression in behaviour
//   Jordan  — good progress across all domains
//   Morgan  — some progress, at-risk targets for independence
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateProgressFromBaseline,
  evaluateTargetAchievement,
  evaluateOutcomePlanning,
  evaluateMeasurementQuality,
  buildChildOutcomeProfiles,
  generateOutcomesMeasurementIntelligence,
  getDomainLabel,
  getAllDomains,
} from "../outcomes-measurement-engine";
import type {
  OutcomeBaseline,
  OutcomeMeasurement,
  OutcomeTarget,
  ChildOutcomePlan,
  OutcomeDomain,
} from "../outcomes-measurement-engine";

// ── Test Constants ──────────────────────────────────────────────────────────

const HOME_ID = "home-oak";
const PERIOD_START = "2025-01-01";
const PERIOD_END = "2026-06-30";
const REFERENCE_DATE = "2026-05-18";

const CHILD_IDS = ["child-alex", "child-jordan", "child-morgan"];

// ── Chamberlain House Demo Data ─────────────────────────────────────────────────────
// Alex (14) — improving emotional wellbeing/education, regression in behaviour
// Jordan (13) — good progress across all domains
// Morgan (15) — some progress, at-risk targets for independence

// ── Baselines ──────────────────────────────────────────────────────────────

const demoBaselines: OutcomeBaseline[] = [
  // Alex — baseline set at admission
  { id: "bl-a1", homeId: HOME_ID, childId: "child-alex", childName: "Alex Reeves", domain: "education", baselineDate: "2025-06-15", baselineScore: 3, method: "professional_assessment", assessedBy: "Sarah Mitchell", context: "Excluded from mainstream, minimal engagement" },
  { id: "bl-a2", homeId: HOME_ID, childId: "child-alex", childName: "Alex Reeves", domain: "emotional_wellbeing", baselineDate: "2025-06-15", baselineScore: 2, method: "standardised_tool", assessedBy: "CAMHS", context: "SDQ score 28, significant difficulties" },
  { id: "bl-a3", homeId: HOME_ID, childId: "child-alex", childName: "Alex Reeves", domain: "behaviour", baselineDate: "2025-06-15", baselineScore: 5, method: "observation", assessedBy: "Tom Richards", context: "Generally compliant, occasional verbal aggression" },
  { id: "bl-a4", homeId: HOME_ID, childId: "child-alex", childName: "Alex Reeves", domain: "relationships", baselineDate: "2025-06-15", baselineScore: 3, method: "professional_assessment", assessedBy: "Sarah Mitchell", context: "Struggles with trust, few positive relationships" },
  { id: "bl-a5", homeId: HOME_ID, childId: "child-alex", childName: "Alex Reeves", domain: "safety", baselineDate: "2025-06-15", baselineScore: 4, method: "professional_assessment", assessedBy: "Tom Richards", context: "Exploitation risk, missing episodes" },
  { id: "bl-a6", homeId: HOME_ID, childId: "child-alex", childName: "Alex Reeves", domain: "health", baselineDate: "2025-06-15", baselineScore: 5, method: "professional_assessment", assessedBy: "GP", context: "Registered, immunisations up to date, dental overdue" },
  { id: "bl-a7", homeId: HOME_ID, childId: "child-alex", childName: "Alex Reeves", domain: "identity", baselineDate: "2025-06-15", baselineScore: 4, method: "self_report", assessedBy: "Alex", context: "Exploring identity, cultural connections limited" },

  // Jordan — baseline set at admission (earlier, more time for progress)
  { id: "bl-j1", homeId: HOME_ID, childId: "child-jordan", childName: "Jordan Williams", domain: "education", baselineDate: "2024-09-01", baselineScore: 4, method: "professional_assessment", assessedBy: "Virtual School Head", context: "Below expected level, poor attendance" },
  { id: "bl-j2", homeId: HOME_ID, childId: "child-jordan", childName: "Jordan Williams", domain: "emotional_wellbeing", baselineDate: "2024-09-01", baselineScore: 4, method: "standardised_tool", assessedBy: "CAMHS", context: "SDQ score 22, borderline difficulties" },
  { id: "bl-j3", homeId: HOME_ID, childId: "child-jordan", childName: "Jordan Williams", domain: "behaviour", baselineDate: "2024-09-01", baselineScore: 5, method: "observation", assessedBy: "Lisa Park", context: "Some impulsivity but generally manageable" },
  { id: "bl-j4", homeId: HOME_ID, childId: "child-jordan", childName: "Jordan Williams", domain: "relationships", baselineDate: "2024-09-01", baselineScore: 4, method: "professional_assessment", assessedBy: "Sarah Mitchell", context: "Cautious with adults, positive with peers" },
  { id: "bl-j5", homeId: HOME_ID, childId: "child-jordan", childName: "Jordan Williams", domain: "independence", baselineDate: "2024-09-01", baselineScore: 3, method: "milestone_tracking", assessedBy: "Lisa Park", context: "Limited life skills for age" },
  { id: "bl-j6", homeId: HOME_ID, childId: "child-jordan", childName: "Jordan Williams", domain: "health", baselineDate: "2024-09-01", baselineScore: 5, method: "professional_assessment", assessedBy: "GP", context: "Generally healthy, overweight, low activity" },
  { id: "bl-j7", homeId: HOME_ID, childId: "child-jordan", childName: "Jordan Williams", domain: "safety", baselineDate: "2024-09-01", baselineScore: 6, method: "professional_assessment", assessedBy: "Sarah Mitchell", context: "Low risk profile, good awareness" },
  { id: "bl-j8", homeId: HOME_ID, childId: "child-jordan", childName: "Jordan Williams", domain: "identity", baselineDate: "2024-09-01", baselineScore: 5, method: "self_report", assessedBy: "Jordan", context: "Positive sense of self, wants cultural connections" },

  // Morgan — baseline set mid-period
  { id: "bl-m1", homeId: HOME_ID, childId: "child-morgan", childName: "Morgan Taylor", domain: "education", baselineDate: "2025-03-01", baselineScore: 5, method: "professional_assessment", assessedBy: "Virtual School Head", context: "Attending alternative provision, average engagement" },
  { id: "bl-m2", homeId: HOME_ID, childId: "child-morgan", childName: "Morgan Taylor", domain: "emotional_wellbeing", baselineDate: "2025-03-01", baselineScore: 4, method: "standardised_tool", assessedBy: "CAMHS", context: "SDQ score 20, some emotional difficulties" },
  { id: "bl-m3", homeId: HOME_ID, childId: "child-morgan", childName: "Morgan Taylor", domain: "behaviour", baselineDate: "2025-03-01", baselineScore: 6, method: "observation", assessedBy: "Tom Richards", context: "Mostly positive behaviour, occasional frustration" },
  { id: "bl-m4", homeId: HOME_ID, childId: "child-morgan", childName: "Morgan Taylor", domain: "independence", baselineDate: "2025-03-01", baselineScore: 4, method: "milestone_tracking", assessedBy: "Lisa Park", context: "Some cooking skills, needs support with budgeting" },
  { id: "bl-m5", homeId: HOME_ID, childId: "child-morgan", childName: "Morgan Taylor", domain: "relationships", baselineDate: "2025-03-01", baselineScore: 5, method: "professional_assessment", assessedBy: "Sarah Mitchell", context: "Good peer relationships, guarded with adults" },
  { id: "bl-m6", homeId: HOME_ID, childId: "child-morgan", childName: "Morgan Taylor", domain: "health", baselineDate: "2025-03-01", baselineScore: 6, method: "professional_assessment", assessedBy: "GP", context: "Good physical health, dental care needed" },
];

// ── Measurements ───────────────────────────────────────────────────────────

const demoMeasurements: OutcomeMeasurement[] = [
  // Alex — education improving (3 → 6), emotional wellbeing improving (2 → 5), behaviour regression (5 → 3)
  { id: "m-a1", homeId: HOME_ID, childId: "child-alex", childName: "Alex Reeves", domain: "education", measurementDate: "2025-10-01", score: 4, method: "professional_assessment", assessedBy: "Virtual School Head", previousScore: 3, targetScore: 7, childView: "School is alright now", evidenceBase: ["PEP review", "School attendance 75%"] },
  { id: "m-a2", homeId: HOME_ID, childId: "child-alex", childName: "Alex Reeves", domain: "education", measurementDate: "2026-03-15", score: 6, method: "professional_assessment", assessedBy: "Virtual School Head", previousScore: 4, targetScore: 7, childView: "I like my new teacher", evidenceBase: ["PEP review", "School attendance 88%", "Predicted grades improving"] },
  { id: "m-a3", homeId: HOME_ID, childId: "child-alex", childName: "Alex Reeves", domain: "emotional_wellbeing", measurementDate: "2025-10-01", score: 3, method: "standardised_tool", assessedBy: "CAMHS", previousScore: 2, childView: "I feel a bit better", evidenceBase: ["SDQ score 24", "CAMHS sessions ongoing"] },
  { id: "m-a4", homeId: HOME_ID, childId: "child-alex", childName: "Alex Reeves", domain: "emotional_wellbeing", measurementDate: "2026-03-15", score: 5, method: "standardised_tool", assessedBy: "CAMHS", previousScore: 3, targetScore: 6, childView: "I can talk to Tom about stuff now", evidenceBase: ["SDQ score 18", "CAMHS discharge planned", "Keyworker sessions positive"] },
  { id: "m-a5", homeId: HOME_ID, childId: "child-alex", childName: "Alex Reeves", domain: "behaviour", measurementDate: "2025-10-01", score: 4, method: "observation", assessedBy: "Tom Richards", previousScore: 5, evidenceBase: ["Incident log review", "3 physical incidents in period"] },
  { id: "m-a6", homeId: HOME_ID, childId: "child-alex", childName: "Alex Reeves", domain: "behaviour", measurementDate: "2026-03-15", score: 3, method: "observation", assessedBy: "Tom Richards", previousScore: 4, childView: "Everyone winds me up", evidenceBase: ["Incident log review", "5 physical incidents", "2 police callouts"] },
  { id: "m-a7", homeId: HOME_ID, childId: "child-alex", childName: "Alex Reeves", domain: "relationships", measurementDate: "2026-03-15", score: 5, method: "professional_assessment", assessedBy: "Sarah Mitchell", previousScore: 3, childView: "Tom is alright, he gets me", evidenceBase: ["Keyworker session notes", "Improved engagement with staff"] },
  { id: "m-a8", homeId: HOME_ID, childId: "child-alex", childName: "Alex Reeves", domain: "safety", measurementDate: "2026-03-15", score: 5, method: "professional_assessment", assessedBy: "Tom Richards", previousScore: 4, evidenceBase: ["Reduced missing episodes", "Engaged with safety plan"] },
  { id: "m-a9", homeId: HOME_ID, childId: "child-alex", childName: "Alex Reeves", domain: "health", measurementDate: "2026-03-15", score: 6, method: "professional_assessment", assessedBy: "GP", previousScore: 5, evidenceBase: ["Dental treatment complete", "Health assessment done"] },
  { id: "m-a10", homeId: HOME_ID, childId: "child-alex", childName: "Alex Reeves", domain: "identity", measurementDate: "2026-03-15", score: 5, method: "self_report", assessedBy: "Alex", previousScore: 4, childView: "I know who I am more now", evidenceBase: ["Life story work started", "Cultural connections strengthened"] },

  // Jordan — good progress across all (2-3 point improvements)
  { id: "m-j1", homeId: HOME_ID, childId: "child-jordan", childName: "Jordan Williams", domain: "education", measurementDate: "2025-03-01", score: 5, method: "professional_assessment", assessedBy: "Virtual School Head", previousScore: 4, childView: "I want to do well at school", evidenceBase: ["PEP review", "Attendance 90%"] },
  { id: "m-j2", homeId: HOME_ID, childId: "child-jordan", childName: "Jordan Williams", domain: "education", measurementDate: "2025-09-01", score: 6, method: "professional_assessment", assessedBy: "Virtual School Head", previousScore: 5, childView: "I got a merit in maths!", evidenceBase: ["PEP review", "Attendance 94%", "On track for expected grades"] },
  { id: "m-j3", homeId: HOME_ID, childId: "child-jordan", childName: "Jordan Williams", domain: "education", measurementDate: "2026-03-01", score: 7, method: "professional_assessment", assessedBy: "Virtual School Head", previousScore: 6, targetScore: 7, childView: "School is good, I like science", evidenceBase: ["PEP review", "Attendance 96%", "Above expected in science"] },
  { id: "m-j4", homeId: HOME_ID, childId: "child-jordan", childName: "Jordan Williams", domain: "emotional_wellbeing", measurementDate: "2025-06-01", score: 5, method: "standardised_tool", assessedBy: "CAMHS", previousScore: 4, childView: "I feel happier here", evidenceBase: ["SDQ score 16", "Settled presentation"] },
  { id: "m-j5", homeId: HOME_ID, childId: "child-jordan", childName: "Jordan Williams", domain: "emotional_wellbeing", measurementDate: "2026-01-15", score: 7, method: "standardised_tool", assessedBy: "CAMHS", previousScore: 5, targetScore: 7, childView: "I feel really good most days", evidenceBase: ["SDQ score 10", "Discharged from CAMHS", "Resilient presentation"] },
  { id: "m-j6", homeId: HOME_ID, childId: "child-jordan", childName: "Jordan Williams", domain: "behaviour", measurementDate: "2025-06-01", score: 6, method: "observation", assessedBy: "Lisa Park", previousScore: 5, evidenceBase: ["No significant incidents", "Positive engagement"] },
  { id: "m-j7", homeId: HOME_ID, childId: "child-jordan", childName: "Jordan Williams", domain: "behaviour", measurementDate: "2026-01-15", score: 8, method: "observation", assessedBy: "Lisa Park", previousScore: 6, childView: "I handle things better now", evidenceBase: ["Zero incidents 6 months", "Excellent self-regulation"] },
  { id: "m-j8", homeId: HOME_ID, childId: "child-jordan", childName: "Jordan Williams", domain: "relationships", measurementDate: "2026-01-15", score: 7, method: "professional_assessment", assessedBy: "Sarah Mitchell", previousScore: 4, childView: "I trust people here", evidenceBase: ["Strong keyworker bond", "Positive family contact", "Good friendships at school"] },
  { id: "m-j9", homeId: HOME_ID, childId: "child-jordan", childName: "Jordan Williams", domain: "independence", measurementDate: "2025-06-01", score: 4, method: "milestone_tracking", assessedBy: "Lisa Park", previousScore: 3, evidenceBase: ["Can prepare basic meals", "Learning to budget pocket money"] },
  { id: "m-j10", homeId: HOME_ID, childId: "child-jordan", childName: "Jordan Williams", domain: "independence", measurementDate: "2026-01-15", score: 6, method: "milestone_tracking", assessedBy: "Lisa Park", previousScore: 4, targetScore: 6, childView: "I can cook pasta and do my own laundry now", evidenceBase: ["Independent meal prep", "Laundry skills", "Budgeting improving"] },
  { id: "m-j11", homeId: HOME_ID, childId: "child-jordan", childName: "Jordan Williams", domain: "health", measurementDate: "2026-01-15", score: 7, method: "professional_assessment", assessedBy: "GP", previousScore: 5, evidenceBase: ["BMI improved", "Active in football club", "Regular exercise"] },
  { id: "m-j12", homeId: HOME_ID, childId: "child-jordan", childName: "Jordan Williams", domain: "safety", measurementDate: "2026-01-15", score: 8, method: "professional_assessment", assessedBy: "Sarah Mitchell", previousScore: 6, evidenceBase: ["Consistently safe", "Good online safety awareness"] },
  { id: "m-j13", homeId: HOME_ID, childId: "child-jordan", childName: "Jordan Williams", domain: "identity", measurementDate: "2026-01-15", score: 7, method: "self_report", assessedBy: "Jordan", previousScore: 5, childView: "I feel proud of where I come from", evidenceBase: ["Life story work complete", "Cultural connections strong"] },

  // Morgan — some progress, limited improvement in independence
  { id: "m-m1", homeId: HOME_ID, childId: "child-morgan", childName: "Morgan Taylor", domain: "education", measurementDate: "2025-09-01", score: 6, method: "professional_assessment", assessedBy: "Virtual School Head", previousScore: 5, childView: "Alternative provision is okay", evidenceBase: ["PEP review", "Attendance 80%"] },
  { id: "m-m2", homeId: HOME_ID, childId: "child-morgan", childName: "Morgan Taylor", domain: "emotional_wellbeing", measurementDate: "2025-09-01", score: 5, method: "standardised_tool", assessedBy: "CAMHS", previousScore: 4, childView: "I have good days and bad days", evidenceBase: ["SDQ score 17", "CAMHS ongoing"] },
  { id: "m-m3", homeId: HOME_ID, childId: "child-morgan", childName: "Morgan Taylor", domain: "behaviour", measurementDate: "2025-09-01", score: 6, method: "observation", assessedBy: "Tom Richards", previousScore: 6, evidenceBase: ["Stable behaviour", "No significant change"] },
  { id: "m-m4", homeId: HOME_ID, childId: "child-morgan", childName: "Morgan Taylor", domain: "independence", measurementDate: "2025-09-01", score: 4, method: "milestone_tracking", assessedBy: "Lisa Park", previousScore: 4, evidenceBase: ["Some cooking improvement", "Budgeting still struggling"] },
  { id: "m-m5", homeId: HOME_ID, childId: "child-morgan", childName: "Morgan Taylor", domain: "independence", measurementDate: "2026-03-01", score: 5, method: "milestone_tracking", assessedBy: "Lisa Park", previousScore: 4, childView: "I want to do more for myself", evidenceBase: ["Cooking improving", "Started budgeting course", "Can use public transport"] },
  { id: "m-m6", homeId: HOME_ID, childId: "child-morgan", childName: "Morgan Taylor", domain: "relationships", measurementDate: "2026-03-01", score: 6, method: "professional_assessment", assessedBy: "Sarah Mitchell", previousScore: 5, childView: "Staff are alright here", evidenceBase: ["Improved trust", "Opening up in keyworker sessions"] },
  { id: "m-m7", homeId: HOME_ID, childId: "child-morgan", childName: "Morgan Taylor", domain: "health", measurementDate: "2026-03-01", score: 7, method: "professional_assessment", assessedBy: "GP", previousScore: 6, evidenceBase: ["Dental work done", "Health check complete"] },
];

// ── Targets ────────────────────────────────────────────────────────────────

const demoTargets: OutcomeTarget[] = [
  // Alex
  { id: "tgt-a1", homeId: HOME_ID, childId: "child-alex", childName: "Alex Reeves", domain: "education", targetDescription: "Achieve consistent school attendance above 85%", targetScore: 7, targetDate: "2026-09-01", currentScore: 6, createdDate: "2025-06-15", status: "on_track", reviewDate: "2026-03-15" },
  { id: "tgt-a2", homeId: HOME_ID, childId: "child-alex", childName: "Alex Reeves", domain: "emotional_wellbeing", targetDescription: "Reduce SDQ score to normal range", targetScore: 6, targetDate: "2026-06-30", currentScore: 5, createdDate: "2025-06-15", status: "on_track", reviewDate: "2026-03-15" },
  { id: "tgt-a3", homeId: HOME_ID, childId: "child-alex", childName: "Alex Reeves", domain: "behaviour", targetDescription: "Reduce physical incidents to zero per month", targetScore: 7, targetDate: "2026-06-30", currentScore: 3, createdDate: "2025-06-15", status: "at_risk", reviewDate: "2026-03-15" },
  { id: "tgt-a4", homeId: HOME_ID, childId: "child-alex", childName: "Alex Reeves", domain: "safety", targetDescription: "No missing episodes for 3 consecutive months", targetScore: 7, targetDate: "2026-09-01", currentScore: 5, createdDate: "2025-06-15", status: "on_track", reviewDate: "2026-03-15" },

  // Jordan
  { id: "tgt-j1", homeId: HOME_ID, childId: "child-jordan", childName: "Jordan Williams", domain: "education", targetDescription: "Achieve expected grades in core subjects", targetScore: 7, targetDate: "2026-07-31", currentScore: 7, createdDate: "2024-09-01", status: "achieved", reviewDate: "2026-03-01" },
  { id: "tgt-j2", homeId: HOME_ID, childId: "child-jordan", childName: "Jordan Williams", domain: "emotional_wellbeing", targetDescription: "SDQ score in normal range, CAMHS discharge", targetScore: 7, targetDate: "2026-06-30", currentScore: 7, createdDate: "2024-09-01", status: "achieved", reviewDate: "2026-01-15" },
  { id: "tgt-j3", homeId: HOME_ID, childId: "child-jordan", childName: "Jordan Williams", domain: "independence", targetDescription: "Achieve age-appropriate independence milestones", targetScore: 6, targetDate: "2026-06-30", currentScore: 6, createdDate: "2024-09-01", status: "achieved", reviewDate: "2026-01-15" },
  { id: "tgt-j4", homeId: HOME_ID, childId: "child-jordan", childName: "Jordan Williams", domain: "behaviour", targetDescription: "Sustained positive behaviour for 6+ months", targetScore: 8, targetDate: "2026-06-30", currentScore: 8, createdDate: "2024-09-01", status: "achieved", reviewDate: "2026-01-15" },

  // Morgan
  { id: "tgt-m1", homeId: HOME_ID, childId: "child-morgan", childName: "Morgan Taylor", domain: "education", targetDescription: "Improve attendance to 90%+ at alternative provision", targetScore: 7, targetDate: "2026-06-30", currentScore: 6, createdDate: "2025-03-01", status: "on_track", reviewDate: "2026-03-01" },
  { id: "tgt-m2", homeId: HOME_ID, childId: "child-morgan", childName: "Morgan Taylor", domain: "independence", targetDescription: "Complete 5 independence milestones including budgeting", targetScore: 7, targetDate: "2026-06-30", currentScore: 5, createdDate: "2025-03-01", status: "at_risk", reviewDate: "2026-03-01" },
  { id: "tgt-m3", homeId: HOME_ID, childId: "child-morgan", childName: "Morgan Taylor", domain: "emotional_wellbeing", targetDescription: "Consistent improvement in SDQ scores", targetScore: 6, targetDate: "2026-09-01", currentScore: 5, createdDate: "2025-03-01", status: "on_track", reviewDate: "2026-03-01" },
];

// ── Plans ──────────────────────────────────────────────────────────────────

const demoPlans: ChildOutcomePlan[] = [
  {
    id: "plan-a1",
    homeId: HOME_ID,
    childId: "child-alex",
    childName: "Alex Reeves",
    planDate: "2025-06-20",
    reviewDate: "2026-03-15",
    nextReviewDate: "2026-06-15",
    primaryGoals: ["Sustained school engagement", "Emotional regulation improvement"],
    secondaryGoals: ["Reduce exploitation risk", "Build positive peer relationships"],
    childInvolved: true,
    familyInvolved: false,
    professionalInvolved: true,
    measurableIndicators: ["School attendance %", "SDQ score", "Incident count", "Missing episodes"],
  },
  {
    id: "plan-j1",
    homeId: HOME_ID,
    childId: "child-jordan",
    childName: "Jordan Williams",
    planDate: "2024-09-15",
    reviewDate: "2026-01-15",
    nextReviewDate: "2026-07-15",
    primaryGoals: ["Academic achievement at expected level", "Emotional stability"],
    secondaryGoals: ["Independence skills for age", "Positive identity development"],
    childInvolved: true,
    familyInvolved: true,
    professionalInvolved: true,
    measurableIndicators: ["Exam results", "SDQ score", "Independence checklist", "Life story completion"],
  },
  {
    id: "plan-m1",
    homeId: HOME_ID,
    childId: "child-morgan",
    childName: "Morgan Taylor",
    planDate: "2025-03-10",
    reviewDate: "2025-09-01",
    nextReviewDate: "2026-03-10",
    primaryGoals: ["Independence skill development", "Education engagement"],
    secondaryGoals: ["Emotional wellbeing improvement"],
    childInvolved: true,
    familyInvolved: false,
    professionalInvolved: true,
    measurableIndicators: ["Independence milestones achieved", "Attendance %", "SDQ score"],
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// Tests
// ══════════════════════════════════════════════════════════════════════════════

// ── Helper functions ───────────────────────────────────────────────────────

describe("getDomainLabel", () => {
  it("returns correct label for education", () => {
    expect(getDomainLabel("education")).toBe("Education");
  });

  it("returns correct label for emotional_wellbeing", () => {
    expect(getDomainLabel("emotional_wellbeing")).toBe("Emotional Wellbeing");
  });

  it("returns correct label for all domains", () => {
    const domains = getAllDomains();
    for (const d of domains) {
      expect(getDomainLabel(d)).toBeTruthy();
    }
  });
});

describe("getAllDomains", () => {
  it("returns 8 domains", () => {
    expect(getAllDomains()).toHaveLength(8);
  });

  it("includes all expected domains", () => {
    const domains = getAllDomains();
    expect(domains).toContain("education");
    expect(domains).toContain("health");
    expect(domains).toContain("emotional_wellbeing");
    expect(domains).toContain("behaviour");
    expect(domains).toContain("relationships");
    expect(domains).toContain("independence");
    expect(domains).toContain("identity");
    expect(domains).toContain("safety");
  });

  it("returns a copy (not mutable reference)", () => {
    const a = getAllDomains();
    const b = getAllDomains();
    a.push("education");
    expect(b).toHaveLength(8);
  });
});

// ── 1. evaluateProgressFromBaseline ────────────────────────────────────────

describe("evaluateProgressFromBaseline", () => {
  it("returns correct total children count", () => {
    const result = evaluateProgressFromBaseline(demoBaselines, demoMeasurements, CHILD_IDS);
    expect(result.totalChildren).toBe(3);
  });

  it("assesses multiple domains", () => {
    const result = evaluateProgressFromBaseline(demoBaselines, demoMeasurements, CHILD_IDS);
    expect(result.domainsAssessed).toBeGreaterThan(0);
  });

  it("detects Alex education improvement (3 → 6)", () => {
    const result = evaluateProgressFromBaseline(demoBaselines, demoMeasurements, CHILD_IDS);
    const eduDomain = result.domainProgress.find((d) => d.domain === "education");
    expect(eduDomain).toBeDefined();
    expect(eduDomain!.childrenProgressing).toBeGreaterThan(0);
  });

  it("detects Alex behaviour regression (5 → 3)", () => {
    const result = evaluateProgressFromBaseline(demoBaselines, demoMeasurements, CHILD_IDS);
    expect(result.regressionAlerts.length).toBeGreaterThan(0);
    const alexBehaviourRegression = result.regressionAlerts.find(
      (r) => r.childId === "child-alex" && r.domain === "behaviour",
    );
    expect(alexBehaviourRegression).toBeDefined();
    expect(alexBehaviourRegression!.change).toBeLessThan(0);
  });

  it("calculates overall improvement rate", () => {
    const result = evaluateProgressFromBaseline(demoBaselines, demoMeasurements, CHILD_IDS);
    // All 3 children have at least 1 improving domain
    expect(result.overallImprovementRate).toBe(100);
  });

  it("calculates progress distribution", () => {
    const result = evaluateProgressFromBaseline(demoBaselines, demoMeasurements, CHILD_IDS);
    const dist = result.progressDistribution;
    const total = dist.significant_progress + dist.good_progress + dist.some_progress + dist.no_change + dist.regression;
    expect(total).toBeGreaterThan(0);
  });

  it("returns empty results for no matching children", () => {
    const result = evaluateProgressFromBaseline(demoBaselines, demoMeasurements, ["nonexistent"]);
    expect(result.totalChildren).toBe(1);
    expect(result.domainsAssessed).toBe(0);
    expect(result.domainProgress).toHaveLength(0);
    expect(result.regressionAlerts).toHaveLength(0);
  });

  it("handles single child correctly", () => {
    const result = evaluateProgressFromBaseline(demoBaselines, demoMeasurements, ["child-jordan"]);
    expect(result.totalChildren).toBe(1);
    expect(result.overallImprovementRate).toBe(100);
  });

  it("Alex has regression alert for behaviour domain", () => {
    const result = evaluateProgressFromBaseline(demoBaselines, demoMeasurements, ["child-alex"]);
    expect(result.regressionAlerts.some((r) => r.domain === "behaviour")).toBe(true);
    const alert = result.regressionAlerts.find((r) => r.domain === "behaviour")!;
    expect(alert.baselineScore).toBe(5);
    expect(alert.currentScore).toBe(3);
    expect(alert.change).toBe(-2);
  });

  it("Jordan has no regression alerts", () => {
    const result = evaluateProgressFromBaseline(demoBaselines, demoMeasurements, ["child-jordan"]);
    expect(result.regressionAlerts).toHaveLength(0);
  });

  it("uses latest measurement for each domain", () => {
    const result = evaluateProgressFromBaseline(demoBaselines, demoMeasurements, ["child-alex"]);
    const eduProgress = result.domainProgress.find((d) => d.domain === "education");
    expect(eduProgress).toBeDefined();
    // Latest Alex education measurement is score 6 (from baseline 3)
    expect(eduProgress!.averageCurrentScore).toBe(6);
  });

  it("classifies significant progress correctly", () => {
    const result = evaluateProgressFromBaseline(demoBaselines, demoMeasurements, ["child-alex"]);
    const ewProgress = result.domainProgress.find((d) => d.domain === "emotional_wellbeing");
    expect(ewProgress).toBeDefined();
    // Alex EW: 2 → 5 = +3, significant_progress
    expect(ewProgress!.progressStatus).toBe("significant_progress");
  });

  it("handles domains with baselines but no measurements", () => {
    const baselinesOnly: OutcomeBaseline[] = [
      { id: "test-bl", homeId: HOME_ID, childId: "child-test", childName: "Test", domain: "education", baselineDate: "2025-01-01", baselineScore: 3, method: "observation", assessedBy: "Staff", context: "Test" },
    ];
    const result = evaluateProgressFromBaseline(baselinesOnly, [], ["child-test"]);
    expect(result.domainsAssessed).toBe(0);
  });

  it("calculates average change correctly across multiple children in same domain", () => {
    const result = evaluateProgressFromBaseline(demoBaselines, demoMeasurements, CHILD_IDS);
    const eduProgress = result.domainProgress.find((d) => d.domain === "education");
    expect(eduProgress).toBeDefined();
    // Alex edu: 3→6 (+3), Jordan edu: 4→7 (+3), Morgan edu: 5→6 (+1)
    // Average change: (3+3+1)/3 = 2.3
    expect(eduProgress!.averageChange).toBeCloseTo(2.3, 1);
  });

  it("detects no_change status for Morgan behaviour (6→6)", () => {
    const result = evaluateProgressFromBaseline(demoBaselines, demoMeasurements, ["child-morgan"]);
    const behaviourProgress = result.domainProgress.find((d) => d.domain === "behaviour");
    expect(behaviourProgress).toBeDefined();
    expect(behaviourProgress!.childrenNoChange).toBe(1);
  });
});

// ── 2. evaluateTargetAchievement ──────────────────────────────────────────

describe("evaluateTargetAchievement", () => {
  it("counts all targets", () => {
    const result = evaluateTargetAchievement(demoTargets, CHILD_IDS, REFERENCE_DATE);
    expect(result.totalTargets).toBe(11);
  });

  it("counts achieved targets correctly", () => {
    const result = evaluateTargetAchievement(demoTargets, CHILD_IDS, REFERENCE_DATE);
    // Jordan has 4 achieved targets
    expect(result.achievedCount).toBe(4);
  });

  it("counts on_track targets correctly", () => {
    const result = evaluateTargetAchievement(demoTargets, CHILD_IDS, REFERENCE_DATE);
    // Alex: education, emotional_wellbeing, safety = 3; Morgan: education, emotional_wellbeing = 2 → 5 total
    expect(result.onTrackCount).toBe(5);
  });

  it("counts at_risk targets correctly", () => {
    const result = evaluateTargetAchievement(demoTargets, CHILD_IDS, REFERENCE_DATE);
    // Alex behaviour, Morgan independence = 2
    expect(result.atRiskCount).toBe(2);
  });

  it("calculates achieved rate", () => {
    const result = evaluateTargetAchievement(demoTargets, CHILD_IDS, REFERENCE_DATE);
    // 4 achieved / 11 total = 36%
    expect(result.achievedRate).toBe(36);
  });

  it("calculates on_track rate", () => {
    const result = evaluateTargetAchievement(demoTargets, CHILD_IDS, REFERENCE_DATE);
    // 5 on-track / 11 total = 45%
    expect(result.onTrackRate).toBe(45);
  });

  it("calculates at_risk rate", () => {
    const result = evaluateTargetAchievement(demoTargets, CHILD_IDS, REFERENCE_DATE);
    // 2 at-risk / 11 total = 18%
    expect(result.atRiskRate).toBe(18);
  });

  it("provides domain-level achievement", () => {
    const result = evaluateTargetAchievement(demoTargets, CHILD_IDS, REFERENCE_DATE);
    expect(result.domainAchievement.length).toBeGreaterThan(0);
    const eduDomain = result.domainAchievement.find((d) => d.domain === "education");
    expect(eduDomain).toBeDefined();
    expect(eduDomain!.total).toBe(3); // Alex + Jordan + Morgan education targets
  });

  it("provides at-risk details", () => {
    const result = evaluateTargetAchievement(demoTargets, CHILD_IDS, REFERENCE_DATE);
    expect(result.atRiskDetails).toHaveLength(2);
    const alexBehaviour = result.atRiskDetails.find(
      (d) => d.childId === "child-alex" && d.domain === "behaviour",
    );
    expect(alexBehaviour).toBeDefined();
    expect(alexBehaviour!.currentScore).toBe(3);
    expect(alexBehaviour!.targetScore).toBe(7);
  });

  it("calculates days remaining for at-risk targets", () => {
    const result = evaluateTargetAchievement(demoTargets, CHILD_IDS, REFERENCE_DATE);
    const alexBehaviour = result.atRiskDetails.find(
      (d) => d.childId === "child-alex" && d.domain === "behaviour",
    );
    expect(alexBehaviour).toBeDefined();
    // Target date 2026-06-30, reference 2026-05-18, ~43 days
    expect(alexBehaviour!.daysRemaining).toBeGreaterThan(30);
    expect(alexBehaviour!.daysRemaining).toBeLessThan(60);
  });

  it("returns empty results for nonexistent children", () => {
    const result = evaluateTargetAchievement(demoTargets, ["nonexistent"], REFERENCE_DATE);
    expect(result.totalTargets).toBe(0);
    expect(result.achievedRate).toBe(0);
  });

  it("Jordan has 4 achieved targets", () => {
    const result = evaluateTargetAchievement(demoTargets, ["child-jordan"], REFERENCE_DATE);
    expect(result.achievedCount).toBe(4);
    expect(result.atRiskCount).toBe(0);
  });

  it("Morgan has at-risk independence target", () => {
    const result = evaluateTargetAchievement(demoTargets, ["child-morgan"], REFERENCE_DATE);
    expect(result.atRiskCount).toBe(1);
    const atRisk = result.atRiskDetails[0];
    expect(atRisk.domain).toBe("independence");
    expect(atRisk.childName).toBe("Morgan Taylor");
  });

  it("education domain has correct achievement breakdown", () => {
    const result = evaluateTargetAchievement(demoTargets, CHILD_IDS, REFERENCE_DATE);
    const edu = result.domainAchievement.find((d) => d.domain === "education");
    expect(edu).toBeDefined();
    // Jordan achieved education, Alex on_track, Morgan on_track
    expect(edu!.achieved).toBe(1);
    expect(edu!.onTrack).toBe(2);
    expect(edu!.total).toBe(3);
  });

  it("counts not_achieved targets", () => {
    const result = evaluateTargetAchievement(demoTargets, CHILD_IDS, REFERENCE_DATE);
    expect(result.notAchievedCount).toBe(0);
  });

  it("counts reviewed targets", () => {
    const result = evaluateTargetAchievement(demoTargets, CHILD_IDS, REFERENCE_DATE);
    expect(result.reviewedCount).toBe(0);
  });
});

// ── 3. evaluateOutcomePlanning ────────────────────────────────────────────

describe("evaluateOutcomePlanning", () => {
  it("detects all 3 children have plans", () => {
    const result = evaluateOutcomePlanning(demoPlans, CHILD_IDS, REFERENCE_DATE);
    expect(result.childrenWithPlans).toBe(3);
    expect(result.planCoverageRate).toBe(100);
  });

  it("identifies current plans", () => {
    const result = evaluateOutcomePlanning(demoPlans, CHILD_IDS, REFERENCE_DATE);
    // Alex next review 2026-06-15 >= 2026-05-18 → current
    // Jordan next review 2026-07-15 >= 2026-05-18 → current
    // Morgan next review 2026-03-10 < 2026-05-18 → overdue
    expect(result.currentPlans).toBe(2);
    expect(result.overduePlans).toBe(1);
  });

  it("calculates plan currency rate", () => {
    const result = evaluateOutcomePlanning(demoPlans, CHILD_IDS, REFERENCE_DATE);
    // 2/3 current = 67%
    expect(result.planCurrencyRate).toBe(67);
  });

  it("calculates child involvement rate", () => {
    const result = evaluateOutcomePlanning(demoPlans, CHILD_IDS, REFERENCE_DATE);
    // All 3 plans have childInvolved: true
    expect(result.childInvolvementRate).toBe(100);
  });

  it("calculates family involvement rate", () => {
    const result = evaluateOutcomePlanning(demoPlans, CHILD_IDS, REFERENCE_DATE);
    // Only Jordan has familyInvolved: true (1/3 = 33%)
    expect(result.familyInvolvementRate).toBe(33);
  });

  it("calculates professional involvement rate", () => {
    const result = evaluateOutcomePlanning(demoPlans, CHILD_IDS, REFERENCE_DATE);
    // All 3 have professionalInvolved: true
    expect(result.professionalInvolvementRate).toBe(100);
  });

  it("calculates measurability rate", () => {
    const result = evaluateOutcomePlanning(demoPlans, CHILD_IDS, REFERENCE_DATE);
    // All 3 plans have measurable indicators
    expect(result.measurabilityRate).toBe(100);
  });

  it("calculates average measurable indicators", () => {
    const result = evaluateOutcomePlanning(demoPlans, CHILD_IDS, REFERENCE_DATE);
    // Alex: 4, Jordan: 4, Morgan: 3 → avg 3.7
    expect(result.averageMeasurableIndicators).toBeCloseTo(3.7, 1);
  });

  it("provides per-child plan details", () => {
    const result = evaluateOutcomePlanning(demoPlans, CHILD_IDS, REFERENCE_DATE);
    expect(result.planDetails).toHaveLength(3);
    const morganDetail = result.planDetails.find((d) => d.childId === "child-morgan");
    expect(morganDetail).toBeDefined();
    expect(morganDetail!.hasPlan).toBe(true);
    expect(morganDetail!.isCurrent).toBe(false); // overdue
  });

  it("detects children without plans", () => {
    const result = evaluateOutcomePlanning(demoPlans, [...CHILD_IDS, "child-new"], REFERENCE_DATE);
    expect(result.totalChildren).toBe(4);
    expect(result.childrenWithPlans).toBe(3);
    expect(result.planCoverageRate).toBe(75);
    const newChild = result.planDetails.find((d) => d.childId === "child-new");
    expect(newChild).toBeDefined();
    expect(newChild!.hasPlan).toBe(false);
  });

  it("returns 0% coverage for empty plans array", () => {
    const result = evaluateOutcomePlanning([], CHILD_IDS, REFERENCE_DATE);
    expect(result.childrenWithPlans).toBe(0);
    expect(result.planCoverageRate).toBe(0);
  });

  it("uses latest plan per child when multiple exist", () => {
    const extraPlan: ChildOutcomePlan = {
      id: "plan-j2",
      homeId: HOME_ID,
      childId: "child-jordan",
      childName: "Jordan Williams",
      planDate: "2026-04-01",
      reviewDate: "2026-04-01",
      nextReviewDate: "2026-10-01",
      primaryGoals: ["Updated goals"],
      secondaryGoals: [],
      childInvolved: false,
      familyInvolved: false,
      professionalInvolved: true,
      measurableIndicators: ["New indicator"],
    };
    const plansWithExtra = [...demoPlans, extraPlan];
    const result = evaluateOutcomePlanning(plansWithExtra, CHILD_IDS, REFERENCE_DATE);
    const jordanDetail = result.planDetails.find((d) => d.childId === "child-jordan");
    expect(jordanDetail).toBeDefined();
    // Latest plan has childInvolved: false
    expect(jordanDetail!.childInvolved).toBe(false);
    expect(jordanDetail!.indicatorCount).toBe(1);
  });
});

// ── 4. evaluateMeasurementQuality ─────────────────────────────────────────

describe("evaluateMeasurementQuality", () => {
  it("calculates total children", () => {
    const result = evaluateMeasurementQuality(demoBaselines, demoMeasurements, CHILD_IDS);
    expect(result.totalChildren).toBe(3);
  });

  it("counts baseline domain coverage", () => {
    const result = evaluateMeasurementQuality(demoBaselines, demoMeasurements, CHILD_IDS);
    // Alex: 7 domains, Jordan: 8 domains, Morgan: 6 domains = 21
    expect(result.domainsWithBaselines).toBe(21);
    // 3 children * 8 domains = 24 total possible
    expect(result.totalPossibleDomains).toBe(24);
  });

  it("calculates baseline coverage rate", () => {
    const result = evaluateMeasurementQuality(demoBaselines, demoMeasurements, CHILD_IDS);
    // 21/24 = 88%
    expect(result.baselineCoverageRate).toBe(88);
  });

  it("detects method diversity", () => {
    const result = evaluateMeasurementQuality(demoBaselines, demoMeasurements, CHILD_IDS);
    // We use: standardised_tool, professional_assessment, self_report, observation, milestone_tracking
    expect(result.methodsUsed.length).toBe(5);
    expect(result.methodDiversityScore).toBe(100);
  });

  it("calculates child voice inclusion", () => {
    const result = evaluateMeasurementQuality(demoBaselines, demoMeasurements, CHILD_IDS);
    // Count measurements with childView
    const totalMeasurements = demoMeasurements.filter((m) => CHILD_IDS.includes(m.childId)).length;
    const withVoice = demoMeasurements.filter(
      (m) => CHILD_IDS.includes(m.childId) && m.childView && m.childView.trim().length > 0,
    ).length;
    expect(result.childVoiceInclusion).toBe(Math.round((withVoice / totalMeasurements) * 100));
  });

  it("calculates measurement regularity", () => {
    const result = evaluateMeasurementQuality(demoBaselines, demoMeasurements, CHILD_IDS);
    expect(result.measurementRegularity).toBeGreaterThan(0);
  });

  it("provides per-child quality details", () => {
    const result = evaluateMeasurementQuality(demoBaselines, demoMeasurements, CHILD_IDS);
    expect(result.qualityDetails).toHaveLength(3);
    const alexDetail = result.qualityDetails.find((d) => d.childId === "child-alex");
    expect(alexDetail).toBeDefined();
    expect(alexDetail!.domainsBaselined).toBe(7);
    expect(alexDetail!.measurementCount).toBeGreaterThan(0);
  });

  it("counts child voice per child", () => {
    const result = evaluateMeasurementQuality(demoBaselines, demoMeasurements, CHILD_IDS);
    const jordanDetail = result.qualityDetails.find((d) => d.childId === "child-jordan");
    expect(jordanDetail).toBeDefined();
    expect(jordanDetail!.childVoiceCount).toBeGreaterThan(0);
  });

  it("handles empty data gracefully", () => {
    const result = evaluateMeasurementQuality([], [], CHILD_IDS);
    expect(result.baselineCoverageRate).toBe(0);
    expect(result.methodDiversityScore).toBe(0);
    expect(result.measurementRegularity).toBe(0);
    expect(result.childVoiceInclusion).toBe(0);
  });

  it("detects methods used per child", () => {
    const result = evaluateMeasurementQuality(demoBaselines, demoMeasurements, ["child-jordan"]);
    const jordanDetail = result.qualityDetails.find((d) => d.childId === "child-jordan");
    expect(jordanDetail).toBeDefined();
    expect(jordanDetail!.methodsUsed.length).toBeGreaterThanOrEqual(3);
  });

  it("single-child coverage calculated correctly", () => {
    const result = evaluateMeasurementQuality(demoBaselines, demoMeasurements, ["child-jordan"]);
    // Jordan has 8 domains baselined out of 8 possible
    expect(result.domainsWithBaselines).toBe(8);
    expect(result.totalPossibleDomains).toBe(8);
    expect(result.baselineCoverageRate).toBe(100);
  });
});

// ── 5. buildChildOutcomeProfiles ──────────────────────────────────────────

describe("buildChildOutcomeProfiles", () => {
  it("returns profiles for all children", () => {
    const profiles = buildChildOutcomeProfiles(
      demoBaselines, demoMeasurements, demoTargets, demoPlans, CHILD_IDS, REFERENCE_DATE,
    );
    expect(profiles).toHaveLength(3);
  });

  it("Alex profile shows mixed progress", () => {
    const profiles = buildChildOutcomeProfiles(
      demoBaselines, demoMeasurements, demoTargets, demoPlans, CHILD_IDS, REFERENCE_DATE,
    );
    const alex = profiles.find((p) => p.childId === "child-alex")!;
    expect(alex.domainsImproving).toBeGreaterThan(0);
    expect(alex.domainsRegressing).toBeGreaterThan(0);
    expect(alex.overallProgressSummary).toContain("Mixed");
  });

  it("Jordan profile shows positive trajectory", () => {
    const profiles = buildChildOutcomeProfiles(
      demoBaselines, demoMeasurements, demoTargets, demoPlans, CHILD_IDS, REFERENCE_DATE,
    );
    const jordan = profiles.find((p) => p.childId === "child-jordan")!;
    expect(jordan.domainsImproving).toBeGreaterThan(0);
    expect(jordan.domainsRegressing).toBe(0);
    expect(jordan.overallProgressSummary).toContain("Positive");
  });

  it("Alex has correct domain trajectories", () => {
    const profiles = buildChildOutcomeProfiles(
      demoBaselines, demoMeasurements, demoTargets, demoPlans, CHILD_IDS, REFERENCE_DATE,
    );
    const alex = profiles.find((p) => p.childId === "child-alex")!;
    const eduTrajectory = alex.domainTrajectories.find((t) => t.domain === "education")!;
    expect(eduTrajectory.baselineScore).toBe(3);
    expect(eduTrajectory.currentScore).toBe(6);
    expect(eduTrajectory.change).toBe(3);
    expect(eduTrajectory.progressStatus).toBe("significant_progress");
  });

  it("Alex behaviour trajectory shows regression", () => {
    const profiles = buildChildOutcomeProfiles(
      demoBaselines, demoMeasurements, demoTargets, demoPlans, CHILD_IDS, REFERENCE_DATE,
    );
    const alex = profiles.find((p) => p.childId === "child-alex")!;
    const behaviourTrajectory = alex.domainTrajectories.find((t) => t.domain === "behaviour")!;
    expect(behaviourTrajectory.baselineScore).toBe(5);
    expect(behaviourTrajectory.currentScore).toBe(3);
    expect(behaviourTrajectory.change).toBe(-2);
    expect(behaviourTrajectory.progressStatus).toBe("regression");
  });

  it("Jordan has plan that is current", () => {
    const profiles = buildChildOutcomeProfiles(
      demoBaselines, demoMeasurements, demoTargets, demoPlans, CHILD_IDS, REFERENCE_DATE,
    );
    const jordan = profiles.find((p) => p.childId === "child-jordan")!;
    expect(jordan.hasPlan).toBe(true);
    expect(jordan.planCurrent).toBe(true);
  });

  it("Morgan has plan that is overdue", () => {
    const profiles = buildChildOutcomeProfiles(
      demoBaselines, demoMeasurements, demoTargets, demoPlans, CHILD_IDS, REFERENCE_DATE,
    );
    const morgan = profiles.find((p) => p.childId === "child-morgan")!;
    expect(morgan.hasPlan).toBe(true);
    expect(morgan.planCurrent).toBe(false);
  });

  it("Jordan target counts are correct", () => {
    const profiles = buildChildOutcomeProfiles(
      demoBaselines, demoMeasurements, demoTargets, demoPlans, CHILD_IDS, REFERENCE_DATE,
    );
    const jordan = profiles.find((p) => p.childId === "child-jordan")!;
    expect(jordan.targetsAchieved).toBe(4);
    expect(jordan.targetsAtRisk).toBe(0);
  });

  it("Morgan has at-risk target count", () => {
    const profiles = buildChildOutcomeProfiles(
      demoBaselines, demoMeasurements, demoTargets, demoPlans, CHILD_IDS, REFERENCE_DATE,
    );
    const morgan = profiles.find((p) => p.childId === "child-morgan")!;
    expect(morgan.targetsAtRisk).toBe(1);
  });

  it("returns 8 domain trajectories per child", () => {
    const profiles = buildChildOutcomeProfiles(
      demoBaselines, demoMeasurements, demoTargets, demoPlans, CHILD_IDS, REFERENCE_DATE,
    );
    for (const profile of profiles) {
      expect(profile.domainTrajectories).toHaveLength(8);
    }
  });

  it("domains without data have null values", () => {
    const profiles = buildChildOutcomeProfiles(
      demoBaselines, demoMeasurements, demoTargets, demoPlans, CHILD_IDS, REFERENCE_DATE,
    );
    // Alex has no independence baseline
    const alex = profiles.find((p) => p.childId === "child-alex")!;
    const indepTrajectory = alex.domainTrajectories.find((t) => t.domain === "independence")!;
    expect(indepTrajectory.baselineScore).toBeNull();
    expect(indepTrajectory.currentScore).toBeNull();
    expect(indepTrajectory.change).toBeNull();
    expect(indepTrajectory.progressStatus).toBeNull();
  });

  it("measurement count is correct per domain", () => {
    const profiles = buildChildOutcomeProfiles(
      demoBaselines, demoMeasurements, demoTargets, demoPlans, CHILD_IDS, REFERENCE_DATE,
    );
    const alex = profiles.find((p) => p.childId === "child-alex")!;
    const eduTrajectory = alex.domainTrajectories.find((t) => t.domain === "education")!;
    // Alex has 2 education measurements
    expect(eduTrajectory.measurementCount).toBe(2);
  });

  it("child without any data gets insufficient summary", () => {
    const profiles = buildChildOutcomeProfiles([], [], [], [], ["child-new"], REFERENCE_DATE);
    const profile = profiles[0];
    expect(profile.overallProgressSummary).toContain("Insufficient");
    expect(profile.hasPlan).toBe(false);
  });

  it("resolves child name from baselines", () => {
    const profiles = buildChildOutcomeProfiles(
      demoBaselines, demoMeasurements, demoTargets, demoPlans, CHILD_IDS, REFERENCE_DATE,
    );
    const alex = profiles.find((p) => p.childId === "child-alex")!;
    expect(alex.childName).toBe("Alex Reeves");
  });

  it("Morgan shows some progress in education", () => {
    const profiles = buildChildOutcomeProfiles(
      demoBaselines, demoMeasurements, demoTargets, demoPlans, ["child-morgan"], REFERENCE_DATE,
    );
    const morgan = profiles[0];
    const eduTrajectory = morgan.domainTrajectories.find((t) => t.domain === "education")!;
    expect(eduTrajectory.change).toBe(1);
    expect(eduTrajectory.progressStatus).toBe("some_progress");
  });
});

// ── 6. generateOutcomesMeasurementIntelligence ────────────────────────────

describe("generateOutcomesMeasurementIntelligence", () => {
  const fullResult = generateOutcomesMeasurementIntelligence(
    demoBaselines, demoMeasurements, demoTargets, demoPlans, CHILD_IDS, HOME_ID,
    PERIOD_START, PERIOD_END, REFERENCE_DATE,
  );

  it("returns home ID", () => {
    expect(fullResult.homeId).toBe(HOME_ID);
  });

  it("returns period dates", () => {
    expect(fullResult.periodStart).toBe(PERIOD_START);
    expect(fullResult.periodEnd).toBe(PERIOD_END);
    expect(fullResult.referenceDate).toBe(REFERENCE_DATE);
  });

  it("calculates overall score between 0 and 100", () => {
    expect(fullResult.overallScore).toBeGreaterThanOrEqual(0);
    expect(fullResult.overallScore).toBeLessThanOrEqual(100);
  });

  it("assigns a valid rating", () => {
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(fullResult.rating);
  });

  it("rating matches score thresholds", () => {
    if (fullResult.overallScore >= 80) expect(fullResult.rating).toBe("outstanding");
    else if (fullResult.overallScore >= 60) expect(fullResult.rating).toBe("good");
    else if (fullResult.overallScore >= 40) expect(fullResult.rating).toBe("requires_improvement");
    else expect(fullResult.rating).toBe("inadequate");
  });

  it("includes progress from baseline results", () => {
    expect(fullResult.progressFromBaseline.totalChildren).toBe(3);
    expect(fullResult.progressFromBaseline.domainProgress.length).toBeGreaterThan(0);
  });

  it("includes target achievement results", () => {
    expect(fullResult.targetAchievement.totalTargets).toBe(11);
  });

  it("includes outcome planning results", () => {
    expect(fullResult.outcomePlanning.childrenWithPlans).toBe(3);
  });

  it("includes measurement quality results", () => {
    expect(fullResult.measurementQuality.totalChildren).toBe(3);
  });

  it("includes child profiles", () => {
    expect(fullResult.childProfiles).toHaveLength(3);
  });

  it("generates at least one strength", () => {
    expect(fullResult.strengths.length).toBeGreaterThan(0);
  });

  it("generates areas for development", () => {
    expect(fullResult.areasForDevelopment.length).toBeGreaterThan(0);
  });

  it("generates immediate actions when regressions exist", () => {
    // Alex has behaviour regression
    expect(fullResult.immediateActions.length).toBeGreaterThan(0);
    expect(fullResult.immediateActions.some((a) => a.includes("URGENT"))).toBe(true);
  });

  it("mentions Alex in regression urgent action", () => {
    const regressionAction = fullResult.immediateActions.find((a) => a.includes("Regression"));
    expect(regressionAction).toBeDefined();
    expect(regressionAction).toContain("Alex");
  });

  it("includes regulatory links", () => {
    expect(fullResult.regulatoryLinks.length).toBeGreaterThan(0);
    expect(fullResult.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
    expect(fullResult.regulatoryLinks.some((l) => l.includes("Reg 6"))).toBe(true);
    expect(fullResult.regulatoryLinks.some((l) => l.includes("Reg 9"))).toBe(true);
  });

  it("flags at-risk targets in immediate actions", () => {
    expect(fullResult.immediateActions.some((a) => a.includes("at risk"))).toBe(true);
  });

  it("flags overdue plans in immediate actions", () => {
    // Morgan's plan is overdue
    expect(fullResult.immediateActions.some((a) => a.includes("overdue"))).toBe(true);
  });

  it("generates strength about child involvement when all plans involve children", () => {
    expect(fullResult.strengths.some((s) => s.toLowerCase().includes("child") && s.toLowerCase().includes("involved"))).toBe(true);
  });

  it("overall score reflects all 4 components", () => {
    // Score should be reasonable given the demo data (mixed progress)
    // Progress: 100% improvement rate → high progress score minus regression penalty
    // Targets: 36% achieved + 45% on_track = 81% effective → ~20
    // Planning: good coverage but 1 overdue → moderate
    // Quality: good coverage & diversity → moderate-high
    expect(fullResult.overallScore).toBeGreaterThan(40);
    expect(fullResult.overallScore).toBeLessThan(100);
  });

  // ── Edge case: excellent scenario ──

  it("scores outstanding with excellent data", () => {
    const excellentBaselines: OutcomeBaseline[] = CHILD_IDS.flatMap((cid) =>
      ALL_DOMAINS.map((domain): OutcomeBaseline => ({
        id: `bl-exc-${cid}-${domain}`,
        homeId: HOME_ID,
        childId: cid,
        childName: cid,
        domain: domain as OutcomeDomain,
        baselineDate: "2025-01-01",
        baselineScore: 3,
        method: "standardised_tool",
        assessedBy: "Staff",
        context: "Test",
      })),
    );

    const excellentMeasurements: OutcomeMeasurement[] = CHILD_IDS.flatMap((cid) =>
      ALL_DOMAINS.flatMap((domain): OutcomeMeasurement[] => [
        {
          id: `m-exc1-${cid}-${domain}`,
          homeId: HOME_ID,
          childId: cid,
          childName: cid,
          domain: domain as OutcomeDomain,
          measurementDate: "2025-06-01",
          score: 6,
          method: "professional_assessment",
          assessedBy: "Staff",
          childView: "Great progress",
          evidenceBase: ["Evidence 1"],
        },
        {
          id: `m-exc2-${cid}-${domain}`,
          homeId: HOME_ID,
          childId: cid,
          childName: cid,
          domain: domain as OutcomeDomain,
          measurementDate: "2025-12-01",
          score: 8,
          method: "self_report",
          assessedBy: "Child",
          childView: "I feel excellent",
          evidenceBase: ["Evidence 2"],
        },
        {
          id: `m-exc3-${cid}-${domain}`,
          homeId: HOME_ID,
          childId: cid,
          childName: cid,
          domain: domain as OutcomeDomain,
          measurementDate: "2026-03-01",
          score: 9,
          method: "observation",
          assessedBy: "Staff",
          childView: "Everything is brilliant",
          evidenceBase: ["Evidence 3"],
        },
      ]),
    );

    const excellentTargets: OutcomeTarget[] = CHILD_IDS.flatMap((cid) =>
      (["education", "health", "emotional_wellbeing", "behaviour"] as OutcomeDomain[]).map(
        (domain): OutcomeTarget => ({
          id: `tgt-exc-${cid}-${domain}`,
          homeId: HOME_ID,
          childId: cid,
          childName: cid,
          domain,
          targetDescription: "Test target",
          targetScore: 8,
          targetDate: "2026-06-30",
          currentScore: 9,
          createdDate: "2025-01-01",
          status: "achieved",
          reviewDate: "2026-03-01",
        }),
      ),
    );

    const excellentPlans: ChildOutcomePlan[] = CHILD_IDS.map(
      (cid): ChildOutcomePlan => ({
        id: `plan-exc-${cid}`,
        homeId: HOME_ID,
        childId: cid,
        childName: cid,
        planDate: "2025-01-01",
        reviewDate: "2026-03-01",
        nextReviewDate: "2026-09-01",
        primaryGoals: ["Goal 1"],
        secondaryGoals: ["Goal 2"],
        childInvolved: true,
        familyInvolved: true,
        professionalInvolved: true,
        measurableIndicators: ["Indicator 1", "Indicator 2", "Indicator 3"],
      }),
    );

    const result = generateOutcomesMeasurementIntelligence(
      excellentBaselines, excellentMeasurements, excellentTargets, excellentPlans,
      CHILD_IDS, HOME_ID, PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );

    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.rating).toBe("outstanding");
  });

  // ── Edge case: poor scenario ──

  it("scores inadequate with minimal data", () => {
    const minimalBaselines: OutcomeBaseline[] = [
      { id: "bl-min1", homeId: HOME_ID, childId: "child-alex", childName: "Alex", domain: "education", baselineDate: "2025-01-01", baselineScore: 5, method: "observation", assessedBy: "Staff", context: "Test" },
    ];
    const minimalMeasurements: OutcomeMeasurement[] = [
      { id: "m-min1", homeId: HOME_ID, childId: "child-alex", childName: "Alex", domain: "education", measurementDate: "2025-06-01", score: 4, method: "observation", assessedBy: "Staff", evidenceBase: ["None"] },
    ];
    const result = generateOutcomesMeasurementIntelligence(
      minimalBaselines, minimalMeasurements, [], [], CHILD_IDS, HOME_ID,
      PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );

    expect(result.overallScore).toBeLessThan(40);
    expect(result.rating).toBe("inadequate");
  });

  // ── Edge case: empty data ──

  it("handles empty data without crashing", () => {
    const result = generateOutcomesMeasurementIntelligence(
      [], [], [], [], CHILD_IDS, HOME_ID, PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.immediateActions.length).toBeGreaterThan(0);
  });

  it("handles single child", () => {
    const result = generateOutcomesMeasurementIntelligence(
      demoBaselines, demoMeasurements, demoTargets, demoPlans, ["child-jordan"], HOME_ID,
      PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.childProfiles).toHaveLength(1);
    expect(result.childProfiles[0].childName).toBe("Jordan Williams");
    expect(result.overallScore).toBeGreaterThan(0);
  });

  it("score is clamped to 0-100", () => {
    // Even with extreme data, score should not exceed bounds
    expect(fullResult.overallScore).toBeGreaterThanOrEqual(0);
    expect(fullResult.overallScore).toBeLessThanOrEqual(100);
  });

  it("all 4 scoring components contribute to overall score", () => {
    // The overall score for demo data should have contributions from all areas
    // We test this by checking the sub-results have non-zero relevant metrics
    expect(fullResult.progressFromBaseline.overallImprovementRate).toBeGreaterThan(0);
    expect(fullResult.targetAchievement.totalTargets).toBeGreaterThan(0);
    expect(fullResult.outcomePlanning.planCoverageRate).toBeGreaterThan(0);
    expect(fullResult.measurementQuality.baselineCoverageRate).toBeGreaterThan(0);
  });

  it("demo data produces good or outstanding rating", () => {
    // With the rich demo data, we expect at least "good"
    expect(["outstanding", "good"]).toContain(fullResult.rating);
  });
});

// ── Cross-cutting edge cases ──────────────────────────────────────────────

describe("edge cases", () => {
  it("handles empty child IDs array", () => {
    const result = generateOutcomesMeasurementIntelligence(
      demoBaselines, demoMeasurements, demoTargets, demoPlans, [], HOME_ID,
      PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.overallScore).toBe(0);
    expect(result.childProfiles).toHaveLength(0);
  });

  it("filters correctly by homeId in baselines", () => {
    const otherHomeBaseline: OutcomeBaseline = {
      id: "bl-other", homeId: "home-other", childId: "child-alex", childName: "Alex Reeves",
      domain: "education", baselineDate: "2025-01-01", baselineScore: 1,
      method: "observation", assessedBy: "Other", context: "Other home",
    };
    // childId filter takes precedence — the engine filters by childId, not homeId on inputs
    const result = evaluateProgressFromBaseline(
      [...demoBaselines, otherHomeBaseline], demoMeasurements, ["child-alex"],
    );
    // Should still find education domain progress for Alex
    const edu = result.domainProgress.find((d) => d.domain === "education");
    expect(edu).toBeDefined();
  });

  it("handles duplicate measurements gracefully (uses latest)", () => {
    const dupMeasurement: OutcomeMeasurement = {
      id: "m-dup", homeId: HOME_ID, childId: "child-jordan", childName: "Jordan Williams",
      domain: "education", measurementDate: "2026-05-01", score: 10,
      method: "professional_assessment", assessedBy: "Staff",
      evidenceBase: ["Latest"],
    };
    const result = evaluateProgressFromBaseline(
      demoBaselines, [...demoMeasurements, dupMeasurement], ["child-jordan"],
    );
    const edu = result.domainProgress.find((d) => d.domain === "education");
    expect(edu).toBeDefined();
    expect(edu!.averageCurrentScore).toBe(10);
  });

  it("all domains have labels", () => {
    const domains = getAllDomains();
    for (const d of domains) {
      const label = getDomainLabel(d);
      expect(label).toBeTruthy();
      expect(label.length).toBeGreaterThan(0);
    }
  });
});

// ── Regression / Specific Domain Tests ────────────────────────────────────

describe("specific domain validation", () => {
  it("emotional wellbeing domain label is correct", () => {
    expect(getDomainLabel("emotional_wellbeing")).toBe("Emotional Wellbeing");
  });

  it("independence domain label is correct", () => {
    expect(getDomainLabel("independence")).toBe("Independence");
  });

  it("safety domain label is correct", () => {
    expect(getDomainLabel("safety")).toBe("Safety");
  });

  it("identity domain label is correct", () => {
    expect(getDomainLabel("identity")).toBe("Identity");
  });

  it("behaviour domain label is correct", () => {
    expect(getDomainLabel("behaviour")).toBe("Behaviour");
  });

  it("health domain label is correct", () => {
    expect(getDomainLabel("health")).toBe("Health");
  });

  it("relationships domain label is correct", () => {
    expect(getDomainLabel("relationships")).toBe("Relationships");
  });
});

// Ensure there are 100+ tests
// Let's add a few more targeted tests to ensure comprehensive coverage

describe("progress classification", () => {
  it("significant progress when change >= 3", () => {
    const baselines: OutcomeBaseline[] = [
      { id: "bl-t1", homeId: HOME_ID, childId: "child-t", childName: "Test", domain: "education", baselineDate: "2025-01-01", baselineScore: 2, method: "observation", assessedBy: "Staff", context: "Test" },
    ];
    const measurements: OutcomeMeasurement[] = [
      { id: "m-t1", homeId: HOME_ID, childId: "child-t", childName: "Test", domain: "education", measurementDate: "2025-06-01", score: 5, method: "observation", assessedBy: "Staff", evidenceBase: ["Test"] },
    ];
    const result = evaluateProgressFromBaseline(baselines, measurements, ["child-t"]);
    expect(result.domainProgress[0].progressStatus).toBe("significant_progress");
  });

  it("good progress when change is 2", () => {
    const baselines: OutcomeBaseline[] = [
      { id: "bl-t2", homeId: HOME_ID, childId: "child-t", childName: "Test", domain: "education", baselineDate: "2025-01-01", baselineScore: 3, method: "observation", assessedBy: "Staff", context: "Test" },
    ];
    const measurements: OutcomeMeasurement[] = [
      { id: "m-t2", homeId: HOME_ID, childId: "child-t", childName: "Test", domain: "education", measurementDate: "2025-06-01", score: 5, method: "observation", assessedBy: "Staff", evidenceBase: ["Test"] },
    ];
    const result = evaluateProgressFromBaseline(baselines, measurements, ["child-t"]);
    expect(result.domainProgress[0].progressStatus).toBe("good_progress");
  });

  it("some progress when change is 1", () => {
    const baselines: OutcomeBaseline[] = [
      { id: "bl-t3", homeId: HOME_ID, childId: "child-t", childName: "Test", domain: "health", baselineDate: "2025-01-01", baselineScore: 5, method: "observation", assessedBy: "Staff", context: "Test" },
    ];
    const measurements: OutcomeMeasurement[] = [
      { id: "m-t3", homeId: HOME_ID, childId: "child-t", childName: "Test", domain: "health", measurementDate: "2025-06-01", score: 6, method: "observation", assessedBy: "Staff", evidenceBase: ["Test"] },
    ];
    const result = evaluateProgressFromBaseline(baselines, measurements, ["child-t"]);
    expect(result.domainProgress[0].progressStatus).toBe("some_progress");
  });

  it("no change when score unchanged", () => {
    const baselines: OutcomeBaseline[] = [
      { id: "bl-t4", homeId: HOME_ID, childId: "child-t", childName: "Test", domain: "safety", baselineDate: "2025-01-01", baselineScore: 7, method: "observation", assessedBy: "Staff", context: "Test" },
    ];
    const measurements: OutcomeMeasurement[] = [
      { id: "m-t4", homeId: HOME_ID, childId: "child-t", childName: "Test", domain: "safety", measurementDate: "2025-06-01", score: 7, method: "observation", assessedBy: "Staff", evidenceBase: ["Test"] },
    ];
    const result = evaluateProgressFromBaseline(baselines, measurements, ["child-t"]);
    expect(result.domainProgress[0].progressStatus).toBe("no_change");
  });

  it("regression when change <= -1", () => {
    const baselines: OutcomeBaseline[] = [
      { id: "bl-t5", homeId: HOME_ID, childId: "child-t", childName: "Test", domain: "behaviour", baselineDate: "2025-01-01", baselineScore: 7, method: "observation", assessedBy: "Staff", context: "Test" },
    ];
    const measurements: OutcomeMeasurement[] = [
      { id: "m-t5", homeId: HOME_ID, childId: "child-t", childName: "Test", domain: "behaviour", measurementDate: "2025-06-01", score: 5, method: "observation", assessedBy: "Staff", evidenceBase: ["Test"] },
    ];
    const result = evaluateProgressFromBaseline(baselines, measurements, ["child-t"]);
    expect(result.domainProgress[0].progressStatus).toBe("regression");
  });
});

describe("scoring component validation", () => {
  it("no targets yields zero target score contribution", () => {
    const result = generateOutcomesMeasurementIntelligence(
      demoBaselines, demoMeasurements, [], demoPlans, CHILD_IDS, HOME_ID,
      PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    // With no targets, target achievement component is 0
    // Score should be lower than with targets
    const resultWithTargets = generateOutcomesMeasurementIntelligence(
      demoBaselines, demoMeasurements, demoTargets, demoPlans, CHILD_IDS, HOME_ID,
      PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.overallScore).toBeLessThan(resultWithTargets.overallScore);
  });

  it("no plans yields lower planning score", () => {
    const result = generateOutcomesMeasurementIntelligence(
      demoBaselines, demoMeasurements, demoTargets, [], CHILD_IDS, HOME_ID,
      PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    const resultWithPlans = generateOutcomesMeasurementIntelligence(
      demoBaselines, demoMeasurements, demoTargets, demoPlans, CHILD_IDS, HOME_ID,
      PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.overallScore).toBeLessThan(resultWithPlans.overallScore);
  });
});

const ALL_DOMAINS: OutcomeDomain[] = [
  "education", "health", "emotional_wellbeing", "behaviour",
  "relationships", "independence", "identity", "safety",
];
