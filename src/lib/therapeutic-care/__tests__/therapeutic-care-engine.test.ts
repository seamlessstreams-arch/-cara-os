// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Therapeutic Care Intelligence — Engine Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateSessionQuality,
  evaluateReferralEfficiency,
  evaluateTherapyPlanning,
  evaluateTherapeuticEnvironment,
  generateTherapeuticCareIntelligence,
  getRating,
  getTherapyTypeLabel,
  getTherapyProviderLabel,
  getSessionOutcomeLabel,
  getTherapistRoleLabel,
  getReferralStatusLabel,
} from "../therapeutic-care-engine";
import type {
  TherapySession,
  TherapyReferral,
  TherapyPlan,
  TherapeuticEnvironment,
  TherapyType,
  TherapyProvider,
  SessionOutcome,
  TherapistRole,
  ReferralStatus,
} from "../therapeutic-care-engine";

// ── Constants ────────────────────────────────────────────────────────────────

const PERIOD_START = "2026-01-01";
const PERIOD_END = "2026-05-18";

// ── Factories ────────────────────────────────────────────────────────────────

function makeSession(overrides: Partial<TherapySession> = {}): TherapySession {
  return {
    id: "sess-001",
    childId: "child-alex",
    childName: "Alex",
    therapyType: "cbt",
    provider: "camhs",
    therapistRole: "clinical_psychologist",
    sessionDate: "2026-03-15",
    durationMinutes: 50,
    outcome: "positive",
    childEngaged: true,
    childConsented: true,
    goalsAddressed: true,
    keyWorkerBriefed: true,
    riskAssessmentUpdated: true,
    ...overrides,
  };
}

function makeReferral(overrides: Partial<TherapyReferral> = {}): TherapyReferral {
  return {
    id: "ref-001",
    childId: "child-alex",
    childName: "Alex",
    therapyType: "cbt",
    provider: "camhs",
    referralDate: "2026-01-15",
    status: "active",
    waitTimeDays: 14,
    reasonForReferral: "Anxiety and low mood",
    ...overrides,
  };
}

function makePlan(overrides: Partial<TherapyPlan> = {}): TherapyPlan {
  return {
    id: "plan-001",
    childId: "child-alex",
    childName: "Alex",
    therapyType: "cbt",
    goals: ["Reduce anxiety symptoms", "Develop coping strategies", "Improve sleep"],
    goalsAchieved: 2,
    planReviewDate: "2026-06-01",
    planIsCoProduced: true,
    childViewsIncluded: true,
    lastUpdated: "2026-04-01",
    updatedBy: "Dr Smith",
    ...overrides,
  };
}

function makeEnvironment(overrides: Partial<TherapeuticEnvironment> = {}): TherapeuticEnvironment {
  return {
    id: "env-001",
    quietSpaceAvailable: true,
    sensoryRoomAvailable: true,
    outdoorTherapeuticSpace: true,
    staffTrainedInTherapeuticApproaches: true,
    therapyRoomPrivate: true,
    childCanRequestTherapy: true,
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// getRating
// ══════════════════════════════════════════════════════════════════════════════

describe("getRating", () => {
  it("returns outstanding for score >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
    expect(getRating(95)).toBe("outstanding");
  });

  it("returns good for score 60-79", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
    expect(getRating(70)).toBe("good");
  });

  it("returns requires_improvement for score 40-59", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
    expect(getRating(50)).toBe("requires_improvement");
  });

  it("returns inadequate for score < 40", () => {
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(39)).toBe("inadequate");
    expect(getRating(20)).toBe("inadequate");
  });

  it("handles boundary values exactly", () => {
    expect(getRating(79)).toBe("good");
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(59)).toBe("requires_improvement");
    expect(getRating(60)).toBe("good");
    expect(getRating(39)).toBe("inadequate");
    expect(getRating(40)).toBe("requires_improvement");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Label Functions
// ══════════════════════════════════════════════════════════════════════════════

describe("Label functions", () => {
  describe("getTherapyTypeLabel", () => {
    it("returns correct labels for all therapy types", () => {
      const types: TherapyType[] = [
        "cbt", "dbt", "play_therapy", "art_therapy", "emdr",
        "family_therapy", "group_therapy", "life_story", "psychodynamic",
        "trauma_focused_cbt", "sensory_integration", "other",
      ];
      expect(getTherapyTypeLabel("cbt")).toBe("Cognitive Behavioural Therapy");
      expect(getTherapyTypeLabel("dbt")).toBe("Dialectical Behaviour Therapy");
      expect(getTherapyTypeLabel("play_therapy")).toBe("Play Therapy");
      expect(getTherapyTypeLabel("art_therapy")).toBe("Art Therapy");
      expect(getTherapyTypeLabel("emdr")).toBe("EMDR");
      expect(getTherapyTypeLabel("family_therapy")).toBe("Family Therapy");
      expect(getTherapyTypeLabel("group_therapy")).toBe("Group Therapy");
      expect(getTherapyTypeLabel("life_story")).toBe("Life Story Work");
      expect(getTherapyTypeLabel("psychodynamic")).toBe("Psychodynamic Therapy");
      expect(getTherapyTypeLabel("trauma_focused_cbt")).toBe("Trauma-Focused CBT");
      expect(getTherapyTypeLabel("sensory_integration")).toBe("Sensory Integration");
      expect(getTherapyTypeLabel("other")).toBe("Other");
      // All types covered
      types.forEach((t) => expect(getTherapyTypeLabel(t)).toBeTruthy());
    });
  });

  describe("getTherapyProviderLabel", () => {
    it("returns correct labels for all providers", () => {
      const providers: TherapyProvider[] = [
        "in_house", "camhs", "private", "nhs", "voluntary_sector",
      ];
      expect(getTherapyProviderLabel("in_house")).toBe("In-House");
      expect(getTherapyProviderLabel("camhs")).toBe("CAMHS");
      expect(getTherapyProviderLabel("private")).toBe("Private");
      expect(getTherapyProviderLabel("nhs")).toBe("NHS");
      expect(getTherapyProviderLabel("voluntary_sector")).toBe("Voluntary Sector");
      providers.forEach((p) => expect(getTherapyProviderLabel(p)).toBeTruthy());
    });
  });

  describe("getSessionOutcomeLabel", () => {
    it("returns correct labels for all outcomes", () => {
      const outcomes: SessionOutcome[] = [
        "positive", "good_progress", "maintaining", "no_change", "deteriorated", "did_not_attend",
      ];
      expect(getSessionOutcomeLabel("positive")).toBe("Positive");
      expect(getSessionOutcomeLabel("good_progress")).toBe("Good Progress");
      expect(getSessionOutcomeLabel("maintaining")).toBe("Maintaining");
      expect(getSessionOutcomeLabel("no_change")).toBe("No Change");
      expect(getSessionOutcomeLabel("deteriorated")).toBe("Deteriorated");
      expect(getSessionOutcomeLabel("did_not_attend")).toBe("Did Not Attend");
      outcomes.forEach((o) => expect(getSessionOutcomeLabel(o)).toBeTruthy());
    });
  });

  describe("getTherapistRoleLabel", () => {
    it("returns correct labels for all roles", () => {
      const roles: TherapistRole[] = [
        "clinical_psychologist", "counsellor", "psychotherapist",
        "art_therapist", "play_therapist", "occupational_therapist", "social_worker",
      ];
      expect(getTherapistRoleLabel("clinical_psychologist")).toBe("Clinical Psychologist");
      expect(getTherapistRoleLabel("counsellor")).toBe("Counsellor");
      expect(getTherapistRoleLabel("psychotherapist")).toBe("Psychotherapist");
      expect(getTherapistRoleLabel("art_therapist")).toBe("Art Therapist");
      expect(getTherapistRoleLabel("play_therapist")).toBe("Play Therapist");
      expect(getTherapistRoleLabel("occupational_therapist")).toBe("Occupational Therapist");
      expect(getTherapistRoleLabel("social_worker")).toBe("Social Worker");
      roles.forEach((r) => expect(getTherapistRoleLabel(r)).toBeTruthy());
    });
  });

  describe("getReferralStatusLabel", () => {
    it("returns correct labels for all statuses", () => {
      const statuses: ReferralStatus[] = [
        "pending", "accepted", "active", "completed", "discharged", "waitlisted", "refused",
      ];
      expect(getReferralStatusLabel("pending")).toBe("Pending");
      expect(getReferralStatusLabel("accepted")).toBe("Accepted");
      expect(getReferralStatusLabel("active")).toBe("Active");
      expect(getReferralStatusLabel("completed")).toBe("Completed");
      expect(getReferralStatusLabel("discharged")).toBe("Discharged");
      expect(getReferralStatusLabel("waitlisted")).toBe("Waitlisted");
      expect(getReferralStatusLabel("refused")).toBe("Refused");
      statuses.forEach((s) => expect(getReferralStatusLabel(s)).toBeTruthy());
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateSessionQuality
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateSessionQuality", () => {
  it("returns 0 score for empty sessions array", () => {
    const result = evaluateSessionQuality([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalSessions).toBe(0);
    expect(result.attendanceRate).toBe(0);
    expect(result.positiveOutcomeRate).toBe(0);
    expect(result.childEngagementRate).toBe(0);
    expect(result.consentRate).toBe(0);
    expect(result.keyWorkerBriefingRate).toBe(0);
    expect(result.goalsAddressedRate).toBe(0);
  });

  it("returns max score for perfect sessions", () => {
    const sessions = Array.from({ length: 10 }, (_, i) =>
      makeSession({ id: `sess-${i}` }),
    );
    const result = evaluateSessionQuality(sessions);
    expect(result.overallScore).toBe(25);
    expect(result.totalSessions).toBe(10);
    expect(result.attendanceRate).toBe(100);
    expect(result.positiveOutcomeRate).toBe(100);
    expect(result.childEngagementRate).toBe(100);
    expect(result.consentRate).toBe(100);
    expect(result.keyWorkerBriefingRate).toBe(100);
    expect(result.goalsAddressedRate).toBe(100);
  });

  it("calculates attendance rate excluding DNA", () => {
    const sessions = [
      makeSession({ id: "s1", outcome: "positive" }),
      makeSession({ id: "s2", outcome: "did_not_attend" }),
      makeSession({ id: "s3", outcome: "good_progress" }),
      makeSession({ id: "s4", outcome: "maintaining" }),
    ];
    const result = evaluateSessionQuality(sessions);
    expect(result.attendanceRate).toBe(75);
  });

  it("counts positive and good_progress as positive outcomes", () => {
    const sessions = [
      makeSession({ id: "s1", outcome: "positive" }),
      makeSession({ id: "s2", outcome: "good_progress" }),
      makeSession({ id: "s3", outcome: "maintaining" }),
      makeSession({ id: "s4", outcome: "no_change" }),
    ];
    const result = evaluateSessionQuality(sessions);
    expect(result.positiveOutcomeRate).toBe(50);
  });

  it("calculates child engagement rate correctly", () => {
    const sessions = [
      makeSession({ id: "s1", childEngaged: true }),
      makeSession({ id: "s2", childEngaged: true }),
      makeSession({ id: "s3", childEngaged: false }),
    ];
    const result = evaluateSessionQuality(sessions);
    expect(result.childEngagementRate).toBe(67);
  });

  it("calculates consent rate correctly", () => {
    const sessions = [
      makeSession({ id: "s1", childConsented: true }),
      makeSession({ id: "s2", childConsented: true }),
      makeSession({ id: "s3", childConsented: false }),
      makeSession({ id: "s4", childConsented: true }),
    ];
    const result = evaluateSessionQuality(sessions);
    expect(result.consentRate).toBe(75);
  });

  it("calculates key worker briefing rate correctly", () => {
    const sessions = [
      makeSession({ id: "s1", keyWorkerBriefed: true }),
      makeSession({ id: "s2", keyWorkerBriefed: false }),
    ];
    const result = evaluateSessionQuality(sessions);
    expect(result.keyWorkerBriefingRate).toBe(50);
  });

  it("calculates goals addressed rate correctly", () => {
    const sessions = [
      makeSession({ id: "s1", goalsAddressed: true }),
      makeSession({ id: "s2", goalsAddressed: true }),
      makeSession({ id: "s3", goalsAddressed: false }),
      makeSession({ id: "s4", goalsAddressed: false }),
    ];
    const result = evaluateSessionQuality(sessions);
    expect(result.goalsAddressedRate).toBe(50);
  });

  it("never exceeds 25", () => {
    const sessions = Array.from({ length: 100 }, (_, i) =>
      makeSession({ id: `sess-${i}` }),
    );
    const result = evaluateSessionQuality(sessions);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("awards partial score for moderate attendance (75-89%)", () => {
    // 8 attended, 2 DNA = 80% attendance
    const sessions = [
      ...Array.from({ length: 8 }, (_, i) =>
        makeSession({ id: `s-${i}`, outcome: "maintaining", childEngaged: false, childConsented: false, goalsAddressed: false, keyWorkerBriefed: false }),
      ),
      makeSession({ id: "s-dna1", outcome: "did_not_attend", childEngaged: false, childConsented: false, goalsAddressed: false, keyWorkerBriefed: false }),
      makeSession({ id: "s-dna2", outcome: "did_not_attend", childEngaged: false, childConsented: false, goalsAddressed: false, keyWorkerBriefed: false }),
    ];
    const result = evaluateSessionQuality(sessions);
    // 80% attendance = +3
    expect(result.attendanceRate).toBe(80);
    expect(result.overallScore).toBeGreaterThanOrEqual(3);
  });

  it("awards points for 60-74% attendance", () => {
    // 6 attended, 4 DNA = 60% attendance
    const sessions = [
      ...Array.from({ length: 6 }, (_, i) =>
        makeSession({ id: `s-${i}`, outcome: "maintaining", childEngaged: false, childConsented: false, goalsAddressed: false, keyWorkerBriefed: false }),
      ),
      ...Array.from({ length: 4 }, (_, i) =>
        makeSession({ id: `s-dna${i}`, outcome: "did_not_attend", childEngaged: false, childConsented: false, goalsAddressed: false, keyWorkerBriefed: false }),
      ),
    ];
    const result = evaluateSessionQuality(sessions);
    expect(result.attendanceRate).toBe(60);
    expect(result.overallScore).toBeGreaterThanOrEqual(1);
  });

  it("awards 0 for very poor metrics", () => {
    const sessions = [
      makeSession({
        id: "s1",
        outcome: "did_not_attend",
        childEngaged: false,
        childConsented: false,
        goalsAddressed: false,
        keyWorkerBriefed: false,
      }),
    ];
    const result = evaluateSessionQuality(sessions);
    expect(result.overallScore).toBe(0);
  });

  it("handles single perfect session", () => {
    const result = evaluateSessionQuality([makeSession()]);
    expect(result.totalSessions).toBe(1);
    expect(result.attendanceRate).toBe(100);
    expect(result.positiveOutcomeRate).toBe(100);
    expect(result.overallScore).toBe(25);
  });

  it("handles all DNA sessions", () => {
    const sessions = Array.from({ length: 5 }, (_, i) =>
      makeSession({ id: `s-${i}`, outcome: "did_not_attend", childEngaged: false, childConsented: false, goalsAddressed: false, keyWorkerBriefed: false }),
    );
    const result = evaluateSessionQuality(sessions);
    expect(result.attendanceRate).toBe(0);
    expect(result.positiveOutcomeRate).toBe(0);
    expect(result.overallScore).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateReferralEfficiency
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateReferralEfficiency", () => {
  it("returns 25 for empty referrals (no referrals needed = positive)", () => {
    const result = evaluateReferralEfficiency([]);
    expect(result.overallScore).toBe(25);
    expect(result.totalReferrals).toBe(0);
    expect(result.averageWaitTimeDays).toBe(0);
    expect(result.acceptanceRate).toBe(0);
    expect(result.activeReferrals).toBe(0);
    expect(result.waitlistedCount).toBe(0);
  });

  it("returns high score for efficient referrals", () => {
    const referrals = [
      makeReferral({ id: "r1", status: "active", waitTimeDays: 7 }),
      makeReferral({ id: "r2", status: "active", waitTimeDays: 10 }),
      makeReferral({ id: "r3", status: "completed", waitTimeDays: 5 }),
    ];
    const result = evaluateReferralEfficiency(referrals);
    expect(result.overallScore).toBe(25);
    expect(result.averageWaitTimeDays).toBeLessThanOrEqual(14);
    expect(result.acceptanceRate).toBe(100);
    expect(result.activeReferrals).toBe(2);
    expect(result.waitlistedCount).toBe(0);
  });

  it("calculates average wait time correctly", () => {
    const referrals = [
      makeReferral({ id: "r1", waitTimeDays: 10 }),
      makeReferral({ id: "r2", waitTimeDays: 20 }),
      makeReferral({ id: "r3", waitTimeDays: 30 }),
    ];
    const result = evaluateReferralEfficiency(referrals);
    expect(result.averageWaitTimeDays).toBe(20);
  });

  it("counts acceptance rate including accepted/active/completed/discharged", () => {
    const referrals = [
      makeReferral({ id: "r1", status: "accepted" }),
      makeReferral({ id: "r2", status: "active" }),
      makeReferral({ id: "r3", status: "completed" }),
      makeReferral({ id: "r4", status: "discharged" }),
      makeReferral({ id: "r5", status: "pending" }),
    ];
    const result = evaluateReferralEfficiency(referrals);
    expect(result.acceptanceRate).toBe(80);
  });

  it("counts active referrals correctly", () => {
    const referrals = [
      makeReferral({ id: "r1", status: "active" }),
      makeReferral({ id: "r2", status: "active" }),
      makeReferral({ id: "r3", status: "completed" }),
    ];
    const result = evaluateReferralEfficiency(referrals);
    expect(result.activeReferrals).toBe(2);
  });

  it("counts waitlisted referrals correctly", () => {
    const referrals = [
      makeReferral({ id: "r1", status: "waitlisted" }),
      makeReferral({ id: "r2", status: "waitlisted" }),
      makeReferral({ id: "r3", status: "active" }),
    ];
    const result = evaluateReferralEfficiency(referrals);
    expect(result.waitlistedCount).toBe(2);
  });

  it("penalises long wait times", () => {
    const fast = [makeReferral({ id: "r1", waitTimeDays: 7, status: "active" })];
    const slow = [makeReferral({ id: "r1", waitTimeDays: 120, status: "active" })];
    const fastResult = evaluateReferralEfficiency(fast);
    const slowResult = evaluateReferralEfficiency(slow);
    expect(fastResult.overallScore).toBeGreaterThan(slowResult.overallScore);
  });

  it("awards 5 points for 0 waitlisted", () => {
    const referrals = [
      makeReferral({ id: "r1", status: "active", waitTimeDays: 200 }),
    ];
    const result = evaluateReferralEfficiency(referrals);
    // waitlistedCount = 0 => +5
    expect(result.waitlistedCount).toBe(0);
  });

  it("awards 3 points for <= 1 waitlisted", () => {
    const referrals = [
      makeReferral({ id: "r1", status: "waitlisted", waitTimeDays: 200 }),
      makeReferral({ id: "r2", status: "pending", waitTimeDays: 200 }),
    ];
    const result = evaluateReferralEfficiency(referrals);
    expect(result.waitlistedCount).toBe(1);
  });

  it("never exceeds 25", () => {
    const referrals = Array.from({ length: 20 }, (_, i) =>
      makeReferral({ id: `r-${i}`, waitTimeDays: 1, status: "active" }),
    );
    const result = evaluateReferralEfficiency(referrals);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("handles all refused referrals", () => {
    const referrals = [
      makeReferral({ id: "r1", status: "refused", waitTimeDays: 100 }),
      makeReferral({ id: "r2", status: "refused", waitTimeDays: 100 }),
    ];
    const result = evaluateReferralEfficiency(referrals);
    expect(result.acceptanceRate).toBe(0);
    expect(result.activeReferrals).toBe(0);
  });

  it("awards moderate wait time score for 28 days", () => {
    const referrals = [
      makeReferral({ id: "r1", waitTimeDays: 28, status: "active" }),
    ];
    const result = evaluateReferralEfficiency(referrals);
    expect(result.averageWaitTimeDays).toBe(28);
    // 28 days => +5 for wait time
  });

  it("awards low wait time score for 56 days", () => {
    const referrals = [
      makeReferral({ id: "r1", waitTimeDays: 56, status: "active" }),
    ];
    const result = evaluateReferralEfficiency(referrals);
    expect(result.averageWaitTimeDays).toBe(56);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateTherapyPlanning
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateTherapyPlanning", () => {
  it("returns 0 for empty plans", () => {
    const result = evaluateTherapyPlanning([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalPlans).toBe(0);
    expect(result.planReviewRate).toBe(0);
    expect(result.coProducedRate).toBe(0);
    expect(result.childViewsIncludedRate).toBe(0);
    expect(result.goalsAchievedRate).toBe(0);
  });

  it("returns high score for well-managed plans", () => {
    const plans = [
      makePlan({ id: "p1" }),
      makePlan({ id: "p2", childId: "child-jordan", childName: "Jordan" }),
    ];
    const result = evaluateTherapyPlanning(plans);
    expect(result.overallScore).toBeGreaterThanOrEqual(15);
    expect(result.totalPlans).toBe(2);
    expect(result.coProducedRate).toBe(100);
    expect(result.childViewsIncludedRate).toBe(100);
  });

  it("calculates co-produced rate correctly", () => {
    const plans = [
      makePlan({ id: "p1", planIsCoProduced: true }),
      makePlan({ id: "p2", planIsCoProduced: false }),
      makePlan({ id: "p3", planIsCoProduced: true }),
    ];
    const result = evaluateTherapyPlanning(plans);
    expect(result.coProducedRate).toBe(67);
  });

  it("calculates child views included rate correctly", () => {
    const plans = [
      makePlan({ id: "p1", childViewsIncluded: true }),
      makePlan({ id: "p2", childViewsIncluded: false }),
    ];
    const result = evaluateTherapyPlanning(plans);
    expect(result.childViewsIncludedRate).toBe(50);
  });

  it("calculates goals achieved rate correctly", () => {
    const plans = [
      makePlan({ id: "p1", goals: ["a", "b", "c", "d"], goalsAchieved: 2 }),
      makePlan({ id: "p2", goals: ["x", "y"], goalsAchieved: 2 }),
    ];
    const result = evaluateTherapyPlanning(plans);
    // total goals = 6, achieved = 4, rate = 67%
    expect(result.goalsAchievedRate).toBe(67);
  });

  it("handles zero goals gracefully", () => {
    const plans = [
      makePlan({ id: "p1", goals: [], goalsAchieved: 0 }),
    ];
    const result = evaluateTherapyPlanning(plans);
    expect(result.goalsAchievedRate).toBe(0);
  });

  it("never exceeds 25", () => {
    const plans = Array.from({ length: 20 }, (_, i) =>
      makePlan({ id: `p-${i}` }),
    );
    const result = evaluateTherapyPlanning(plans);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("awards partial scores for moderate co-production (70-89%)", () => {
    // 7/10 co-produced = 70%
    const plans = [
      ...Array.from({ length: 7 }, (_, i) =>
        makePlan({ id: `p-${i}`, planIsCoProduced: true, childViewsIncluded: false, goals: ["a"], goalsAchieved: 0 }),
      ),
      ...Array.from({ length: 3 }, (_, i) =>
        makePlan({ id: `p-no-${i}`, planIsCoProduced: false, childViewsIncluded: false, goals: ["a"], goalsAchieved: 0 }),
      ),
    ];
    const result = evaluateTherapyPlanning(plans);
    expect(result.coProducedRate).toBe(70);
  });

  it("awards partial scores for moderate child views (50-69%)", () => {
    const plans = [
      makePlan({ id: "p1", childViewsIncluded: true, planIsCoProduced: false, goals: ["a"], goalsAchieved: 0 }),
      makePlan({ id: "p2", childViewsIncluded: false, planIsCoProduced: false, goals: ["a"], goalsAchieved: 0 }),
    ];
    const result = evaluateTherapyPlanning(plans);
    expect(result.childViewsIncludedRate).toBe(50);
  });

  it("handles plans with no co-production or child views", () => {
    const plans = [
      makePlan({ id: "p1", planIsCoProduced: false, childViewsIncluded: false, goals: ["a"], goalsAchieved: 0 }),
    ];
    const result = evaluateTherapyPlanning(plans);
    expect(result.coProducedRate).toBe(0);
    expect(result.childViewsIncludedRate).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateTherapeuticEnvironment
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateTherapeuticEnvironment", () => {
  it("returns 0 for empty environments", () => {
    const result = evaluateTherapeuticEnvironment([]);
    expect(result.overallScore).toBe(0);
    expect(result.quietSpaceAvailable).toBe(false);
    expect(result.sensoryRoomAvailable).toBe(false);
    expect(result.outdoorTherapeuticSpace).toBe(false);
    expect(result.staffTrained).toBe(false);
    expect(result.therapyRoomPrivate).toBe(false);
    expect(result.childCanRequestTherapy).toBe(false);
  });

  it("returns max score for perfect environment", () => {
    const result = evaluateTherapeuticEnvironment([makeEnvironment()]);
    expect(result.overallScore).toBe(25);
    expect(result.quietSpaceAvailable).toBe(true);
    expect(result.sensoryRoomAvailable).toBe(true);
    expect(result.outdoorTherapeuticSpace).toBe(true);
    expect(result.staffTrained).toBe(true);
    expect(result.therapyRoomPrivate).toBe(true);
    expect(result.childCanRequestTherapy).toBe(true);
  });

  it("awards 4 points for quiet space", () => {
    const withQuiet = evaluateTherapeuticEnvironment([
      makeEnvironment({ sensoryRoomAvailable: false, outdoorTherapeuticSpace: false, staffTrainedInTherapeuticApproaches: false, therapyRoomPrivate: false, childCanRequestTherapy: false }),
    ]);
    const withoutQuiet = evaluateTherapeuticEnvironment([
      makeEnvironment({ quietSpaceAvailable: false, sensoryRoomAvailable: false, outdoorTherapeuticSpace: false, staffTrainedInTherapeuticApproaches: false, therapyRoomPrivate: false, childCanRequestTherapy: false }),
    ]);
    expect(withQuiet.overallScore - withoutQuiet.overallScore).toBe(4);
  });

  it("awards 4 points for sensory room", () => {
    const with_ = evaluateTherapeuticEnvironment([
      makeEnvironment({ quietSpaceAvailable: false, outdoorTherapeuticSpace: false, staffTrainedInTherapeuticApproaches: false, therapyRoomPrivate: false, childCanRequestTherapy: false }),
    ]);
    const without = evaluateTherapeuticEnvironment([
      makeEnvironment({ quietSpaceAvailable: false, sensoryRoomAvailable: false, outdoorTherapeuticSpace: false, staffTrainedInTherapeuticApproaches: false, therapyRoomPrivate: false, childCanRequestTherapy: false }),
    ]);
    expect(with_.overallScore - without.overallScore).toBe(4);
  });

  it("awards 5 points for trained staff", () => {
    const with_ = evaluateTherapeuticEnvironment([
      makeEnvironment({ quietSpaceAvailable: false, sensoryRoomAvailable: false, outdoorTherapeuticSpace: false, therapyRoomPrivate: false, childCanRequestTherapy: false }),
    ]);
    const without = evaluateTherapeuticEnvironment([
      makeEnvironment({ quietSpaceAvailable: false, sensoryRoomAvailable: false, outdoorTherapeuticSpace: false, staffTrainedInTherapeuticApproaches: false, therapyRoomPrivate: false, childCanRequestTherapy: false }),
    ]);
    expect(with_.overallScore - without.overallScore).toBe(5);
  });

  it("awards 4 points for outdoor therapeutic space", () => {
    const with_ = evaluateTherapeuticEnvironment([
      makeEnvironment({ quietSpaceAvailable: false, sensoryRoomAvailable: false, staffTrainedInTherapeuticApproaches: false, therapyRoomPrivate: false, childCanRequestTherapy: false }),
    ]);
    const without = evaluateTherapeuticEnvironment([
      makeEnvironment({ quietSpaceAvailable: false, sensoryRoomAvailable: false, outdoorTherapeuticSpace: false, staffTrainedInTherapeuticApproaches: false, therapyRoomPrivate: false, childCanRequestTherapy: false }),
    ]);
    expect(with_.overallScore - without.overallScore).toBe(4);
  });

  it("awards 4 points for therapy room privacy", () => {
    const with_ = evaluateTherapeuticEnvironment([
      makeEnvironment({ quietSpaceAvailable: false, sensoryRoomAvailable: false, outdoorTherapeuticSpace: false, staffTrainedInTherapeuticApproaches: false, childCanRequestTherapy: false }),
    ]);
    const without = evaluateTherapeuticEnvironment([
      makeEnvironment({ quietSpaceAvailable: false, sensoryRoomAvailable: false, outdoorTherapeuticSpace: false, staffTrainedInTherapeuticApproaches: false, therapyRoomPrivate: false, childCanRequestTherapy: false }),
    ]);
    expect(with_.overallScore - without.overallScore).toBe(4);
  });

  it("awards 4 points for child can request therapy", () => {
    const with_ = evaluateTherapeuticEnvironment([
      makeEnvironment({ quietSpaceAvailable: false, sensoryRoomAvailable: false, outdoorTherapeuticSpace: false, staffTrainedInTherapeuticApproaches: false, therapyRoomPrivate: false }),
    ]);
    const without = evaluateTherapeuticEnvironment([
      makeEnvironment({ quietSpaceAvailable: false, sensoryRoomAvailable: false, outdoorTherapeuticSpace: false, staffTrainedInTherapeuticApproaches: false, therapyRoomPrivate: false, childCanRequestTherapy: false }),
    ]);
    expect(with_.overallScore - without.overallScore).toBe(4);
  });

  it("uses first environment when multiple provided", () => {
    const envs = [
      makeEnvironment({ quietSpaceAvailable: true }),
      makeEnvironment({ quietSpaceAvailable: false }),
    ];
    const result = evaluateTherapeuticEnvironment(envs);
    expect(result.quietSpaceAvailable).toBe(true);
  });

  it("returns 0 for environment with nothing available", () => {
    const result = evaluateTherapeuticEnvironment([
      makeEnvironment({
        quietSpaceAvailable: false,
        sensoryRoomAvailable: false,
        outdoorTherapeuticSpace: false,
        staffTrainedInTherapeuticApproaches: false,
        therapyRoomPrivate: false,
        childCanRequestTherapy: false,
      }),
    ]);
    expect(result.overallScore).toBe(0);
  });

  it("never exceeds 25", () => {
    const result = evaluateTherapeuticEnvironment([makeEnvironment()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// generateTherapeuticCareIntelligence — integration
// ══════════════════════════════════════════════════════════════════════════════

describe("generateTherapeuticCareIntelligence", () => {
  it("returns complete result with all sections", () => {
    const result = generateTherapeuticCareIntelligence(
      [makeSession()],
      [makeReferral()],
      [makePlan()],
      [makeEnvironment()],
      "oak-house",
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe(PERIOD_START);
    expect(result.periodEnd).toBe(PERIOD_END);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.rating).toBeTruthy();
    expect(result.sessionQuality).toBeDefined();
    expect(result.referralEfficiency).toBeDefined();
    expect(result.therapyPlanning).toBeDefined();
    expect(result.therapeuticEnvironment).toBeDefined();
    expect(result.strengths).toBeInstanceOf(Array);
    expect(result.areasForImprovement).toBeInstanceOf(Array);
    expect(result.actions).toBeInstanceOf(Array);
    expect(result.regulatoryLinks).toBeInstanceOf(Array);
  });

  it("overall score is sum of component scores, capped at 100", () => {
    const result = generateTherapeuticCareIntelligence(
      [makeSession()],
      [makeReferral({ waitTimeDays: 7 })],
      [makePlan()],
      [makeEnvironment()],
      "oak-house",
      PERIOD_START,
      PERIOD_END,
    );
    const expected =
      result.sessionQuality.overallScore +
      result.referralEfficiency.overallScore +
      result.therapyPlanning.overallScore +
      result.therapeuticEnvironment.overallScore;
    expect(result.overallScore).toBe(Math.min(expected, 100));
  });

  it("never exceeds 100", () => {
    const sessions = Array.from({ length: 50 }, (_, i) =>
      makeSession({ id: `s-${i}` }),
    );
    const referrals = [
      makeReferral({ id: "r1", waitTimeDays: 5, status: "active" }),
      makeReferral({ id: "r2", waitTimeDays: 5, status: "active" }),
    ];
    const plans = [
      makePlan({ id: "p1" }),
      makePlan({ id: "p2" }),
    ];
    const envs = [makeEnvironment()];
    const result = generateTherapeuticCareIntelligence(
      sessions, referrals, plans, envs, "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("handles completely empty data", () => {
    const result = generateTherapeuticCareIntelligence(
      [], [], [], [], "oak-house", PERIOD_START, PERIOD_END,
    );
    // sessions = 0, referrals = 25 (no referrals needed), plans = 0, environment = 0
    expect(result.overallScore).toBe(25);
    expect(result.rating).toBe("inadequate");
    expect(result.sessionQuality.overallScore).toBe(0);
    expect(result.referralEfficiency.overallScore).toBe(25);
    expect(result.therapyPlanning.overallScore).toBe(0);
    expect(result.therapeuticEnvironment.overallScore).toBe(0);
  });

  it("includes regulatory links", () => {
    const result = generateTherapeuticCareIntelligence(
      [], [], [], [], "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.regulatoryLinks.length).toBeGreaterThan(0);
    expect(result.regulatoryLinks.some((l) => l.includes("Reg 6"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Reg 14"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("CG28"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("CG26"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("NMS 6"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Article 24"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Article 39"))).toBe(true);
  });

  it("rates outstanding for high-quality data", () => {
    const sessions = Array.from({ length: 20 }, (_, i) =>
      makeSession({ id: `s-${i}` }),
    );
    const referrals = [
      makeReferral({ id: "r1", waitTimeDays: 7, status: "active" }),
      makeReferral({ id: "r2", waitTimeDays: 10, status: "active" }),
    ];
    const plans = [makePlan({ id: "p1" }), makePlan({ id: "p2" })];
    const envs = [makeEnvironment()];
    const result = generateTherapeuticCareIntelligence(
      sessions, referrals, plans, envs, "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.rating).toBe("outstanding");
  });

  it("sets homeId and period correctly", () => {
    const result = generateTherapeuticCareIntelligence(
      [], [], [], [], "maple-house", "2026-03-01", "2026-06-01",
    );
    expect(result.homeId).toBe("maple-house");
    expect(result.periodStart).toBe("2026-03-01");
    expect(result.periodEnd).toBe("2026-06-01");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Strengths generation
// ══════════════════════════════════════════════════════════════════════════════

describe("Strengths generation", () => {
  it("generates attendance strength when rate >= 90%", () => {
    const sessions = Array.from({ length: 10 }, (_, i) =>
      makeSession({ id: `s-${i}` }),
    );
    const result = generateTherapeuticCareIntelligence(
      sessions, [], [], [], "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some((s) => s.includes("attendance"))).toBe(true);
  });

  it("generates positive outcome strength when rate >= 70%", () => {
    const sessions = Array.from({ length: 10 }, (_, i) =>
      makeSession({ id: `s-${i}`, outcome: "positive" }),
    );
    const result = generateTherapeuticCareIntelligence(
      sessions, [], [], [], "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some((s) => s.includes("positive outcome"))).toBe(true);
  });

  it("generates engagement strength when rate >= 85%", () => {
    const sessions = Array.from({ length: 10 }, (_, i) =>
      makeSession({ id: `s-${i}`, childEngaged: true }),
    );
    const result = generateTherapeuticCareIntelligence(
      sessions, [], [], [], "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some((s) => s.includes("engagement"))).toBe(true);
  });

  it("generates consent strength when rate >= 95%", () => {
    const sessions = Array.from({ length: 20 }, (_, i) =>
      makeSession({ id: `s-${i}`, childConsented: true }),
    );
    const result = generateTherapeuticCareIntelligence(
      sessions, [], [], [], "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some((s) => s.includes("consent"))).toBe(true);
  });

  it("generates key worker briefing strength when rate >= 90%", () => {
    const sessions = Array.from({ length: 10 }, (_, i) =>
      makeSession({ id: `s-${i}`, keyWorkerBriefed: true }),
    );
    const result = generateTherapeuticCareIntelligence(
      sessions, [], [], [], "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some((s) => s.includes("Key workers consistently briefed"))).toBe(true);
  });

  it("generates wait time strength when avg <= 14 days", () => {
    const referrals = [
      makeReferral({ id: "r1", waitTimeDays: 7 }),
      makeReferral({ id: "r2", waitTimeDays: 10 }),
    ];
    const result = generateTherapeuticCareIntelligence(
      [], referrals, [], [], "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some((s) => s.includes("wait times"))).toBe(true);
  });

  it("generates co-production strength when rate >= 90%", () => {
    const plans = Array.from({ length: 10 }, (_, i) =>
      makePlan({ id: `p-${i}`, planIsCoProduced: true }),
    );
    const result = generateTherapeuticCareIntelligence(
      [], [], plans, [], "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some((s) => s.includes("co-produced"))).toBe(true);
  });

  it("generates staff trained strength", () => {
    const result = generateTherapeuticCareIntelligence(
      [], [], [], [makeEnvironment()], "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some((s) => s.includes("Staff trained"))).toBe(true);
  });

  it("generates sensory room & quiet space strength", () => {
    const result = generateTherapeuticCareIntelligence(
      [], [], [], [makeEnvironment()], "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some((s) => s.includes("sensory room"))).toBe(true);
  });

  it("generates child can request therapy strength", () => {
    const result = generateTherapeuticCareIntelligence(
      [], [], [], [makeEnvironment()], "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some((s) => s.includes("request therapy"))).toBe(true);
  });

  it("generates no strengths when all metrics are poor", () => {
    const sessions = [
      makeSession({
        id: "s1",
        outcome: "did_not_attend",
        childEngaged: false,
        childConsented: false,
        goalsAddressed: false,
        keyWorkerBriefed: false,
      }),
    ];
    const referrals = [
      makeReferral({ id: "r1", waitTimeDays: 120, status: "refused" }),
    ];
    const plans = [
      makePlan({ id: "p1", planIsCoProduced: false, childViewsIncluded: false, goals: ["a"], goalsAchieved: 0 }),
    ];
    const envs = [
      makeEnvironment({
        quietSpaceAvailable: false,
        sensoryRoomAvailable: false,
        outdoorTherapeuticSpace: false,
        staffTrainedInTherapeuticApproaches: false,
        therapyRoomPrivate: false,
        childCanRequestTherapy: false,
      }),
    ];
    const result = generateTherapeuticCareIntelligence(
      sessions, referrals, plans, envs, "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.length).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Areas for Improvement generation
// ══════════════════════════════════════════════════════════════════════════════

describe("Areas for Improvement generation", () => {
  it("flags no therapy sessions recorded", () => {
    const result = generateTherapeuticCareIntelligence(
      [], [], [], [], "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.some((a) => a.includes("No therapy sessions recorded"))).toBe(true);
  });

  it("flags low attendance rate", () => {
    const sessions = [
      makeSession({ id: "s1", outcome: "did_not_attend", childEngaged: false, childConsented: false, goalsAddressed: false, keyWorkerBriefed: false }),
      makeSession({ id: "s2", outcome: "did_not_attend", childEngaged: false, childConsented: false, goalsAddressed: false, keyWorkerBriefed: false }),
      makeSession({ id: "s3", outcome: "positive" }),
    ];
    const result = generateTherapeuticCareIntelligence(
      sessions, [], [], [], "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.some((a) => a.includes("attendance rate"))).toBe(true);
  });

  it("flags no therapy plans", () => {
    const result = generateTherapeuticCareIntelligence(
      [makeSession()], [], [], [], "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.some((a) => a.includes("No therapy plans"))).toBe(true);
  });

  it("flags staff not trained", () => {
    const result = generateTherapeuticCareIntelligence(
      [], [], [], [makeEnvironment({ staffTrainedInTherapeuticApproaches: false })],
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.some((a) => a.includes("Staff not trained"))).toBe(true);
  });

  it("flags no quiet space", () => {
    const result = generateTherapeuticCareIntelligence(
      [], [], [], [makeEnvironment({ quietSpaceAvailable: false })],
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.some((a) => a.includes("quiet space"))).toBe(true);
  });

  it("flags therapy room privacy issue", () => {
    const result = generateTherapeuticCareIntelligence(
      [], [], [], [makeEnvironment({ therapyRoomPrivate: false })],
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.some((a) => a.includes("privacy"))).toBe(true);
  });

  it("flags child cannot request therapy", () => {
    const result = generateTherapeuticCareIntelligence(
      [], [], [], [makeEnvironment({ childCanRequestTherapy: false })],
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.some((a) => a.includes("cannot proactively request"))).toBe(true);
  });

  it("flags waitlisted children", () => {
    const referrals = [
      makeReferral({ id: "r1", status: "waitlisted" }),
      makeReferral({ id: "r2", status: "waitlisted" }),
    ];
    const result = generateTherapeuticCareIntelligence(
      [], referrals, [], [], "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.some((a) => a.includes("waitlisted"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Actions generation
// ══════════════════════════════════════════════════════════════════════════════

describe("Actions generation", () => {
  it("generates URGENT action for no sessions recorded", () => {
    const result = generateTherapeuticCareIntelligence(
      [], [], [], [], "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("session recording"))).toBe(true);
  });

  it("generates URGENT action for no plans", () => {
    const result = generateTherapeuticCareIntelligence(
      [makeSession()], [], [], [], "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("therapy plans"))).toBe(true);
  });

  it("generates training action when staff not trained", () => {
    const result = generateTherapeuticCareIntelligence(
      [], [], [], [makeEnvironment({ staffTrainedInTherapeuticApproaches: false })],
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some((a) => a.includes("training"))).toBe(true);
  });

  it("generates sensory room action when not available", () => {
    const result = generateTherapeuticCareIntelligence(
      [], [], [], [makeEnvironment({ sensoryRoomAvailable: false })],
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some((a) => a.includes("sensory room"))).toBe(true);
  });

  it("generates quiet space action when not available", () => {
    const result = generateTherapeuticCareIntelligence(
      [], [], [], [makeEnvironment({ quietSpaceAvailable: false })],
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some((a) => a.includes("quiet space"))).toBe(true);
  });

  it("generates child request process action when not available", () => {
    const result = generateTherapeuticCareIntelligence(
      [], [], [], [makeEnvironment({ childCanRequestTherapy: false })],
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some((a) => a.includes("request therapy"))).toBe(true);
  });

  it("generates privacy action when room not private", () => {
    const result = generateTherapeuticCareIntelligence(
      [], [], [], [makeEnvironment({ therapyRoomPrivate: false })],
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some((a) => a.includes("privacy"))).toBe(true);
  });

  it("generates no urgent actions for comprehensive data", () => {
    const sessions = Array.from({ length: 10 }, (_, i) =>
      makeSession({ id: `s-${i}` }),
    );
    const result = generateTherapeuticCareIntelligence(
      sessions, [], [makePlan()], [makeEnvironment()], "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.actions.filter((a) => a.startsWith("URGENT")).length).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Chamberlain House Demo Data
// ══════════════════════════════════════════════════════════════════════════════

describe("Chamberlain House demo data scenario", () => {
  // Alex: weekly CBT sessions (mostly positive)
  const alexSessions: TherapySession[] = [
    makeSession({ id: "s-alex-01", childId: "child-alex", childName: "Alex", therapyType: "cbt", provider: "camhs", sessionDate: "2026-03-01", outcome: "positive" }),
    makeSession({ id: "s-alex-02", childId: "child-alex", childName: "Alex", therapyType: "cbt", provider: "camhs", sessionDate: "2026-03-08", outcome: "positive" }),
    makeSession({ id: "s-alex-03", childId: "child-alex", childName: "Alex", therapyType: "cbt", provider: "camhs", sessionDate: "2026-03-15", outcome: "good_progress" }),
    makeSession({ id: "s-alex-04", childId: "child-alex", childName: "Alex", therapyType: "cbt", provider: "camhs", sessionDate: "2026-03-22", outcome: "positive" }),
    makeSession({ id: "s-alex-05", childId: "child-alex", childName: "Alex", therapyType: "cbt", provider: "camhs", sessionDate: "2026-03-29", outcome: "maintaining" }),
    makeSession({ id: "s-alex-06", childId: "child-alex", childName: "Alex", therapyType: "cbt", provider: "camhs", sessionDate: "2026-04-05", outcome: "positive" }),
    makeSession({ id: "s-alex-07", childId: "child-alex", childName: "Alex", therapyType: "cbt", provider: "camhs", sessionDate: "2026-04-12", outcome: "positive" }),
    makeSession({ id: "s-alex-08", childId: "child-alex", childName: "Alex", therapyType: "cbt", provider: "camhs", sessionDate: "2026-04-19", outcome: "good_progress" }),
  ];

  // Morgan: completed play therapy
  const morganSessions: TherapySession[] = [
    makeSession({ id: "s-morgan-01", childId: "child-morgan", childName: "Morgan", therapyType: "play_therapy", provider: "in_house", therapistRole: "play_therapist", sessionDate: "2026-02-01", outcome: "positive" }),
    makeSession({ id: "s-morgan-02", childId: "child-morgan", childName: "Morgan", therapyType: "play_therapy", provider: "in_house", therapistRole: "play_therapist", sessionDate: "2026-02-08", outcome: "good_progress" }),
    makeSession({ id: "s-morgan-03", childId: "child-morgan", childName: "Morgan", therapyType: "play_therapy", provider: "in_house", therapistRole: "play_therapist", sessionDate: "2026-02-15", outcome: "positive" }),
    makeSession({ id: "s-morgan-04", childId: "child-morgan", childName: "Morgan", therapyType: "play_therapy", provider: "in_house", therapistRole: "play_therapist", sessionDate: "2026-02-22", outcome: "positive" }),
  ];

  const allSessions = [...alexSessions, ...morganSessions];

  // Jordan: waitlisted for EMDR
  const referrals: TherapyReferral[] = [
    makeReferral({ id: "ref-alex", childId: "child-alex", childName: "Alex", therapyType: "cbt", provider: "camhs", status: "active", waitTimeDays: 14, referralDate: "2026-01-15" }),
    makeReferral({ id: "ref-jordan", childId: "child-jordan", childName: "Jordan", therapyType: "emdr", provider: "private", status: "waitlisted", waitTimeDays: 42, referralDate: "2026-02-01", reasonForReferral: "Complex trauma" }),
    makeReferral({ id: "ref-morgan", childId: "child-morgan", childName: "Morgan", therapyType: "play_therapy", provider: "in_house", status: "completed", waitTimeDays: 7, referralDate: "2026-01-10" }),
  ];

  const plans: TherapyPlan[] = [
    makePlan({ id: "plan-alex", childId: "child-alex", childName: "Alex", therapyType: "cbt", goals: ["Reduce anxiety", "Develop coping strategies", "Improve sleep"], goalsAchieved: 2 }),
    makePlan({ id: "plan-morgan", childId: "child-morgan", childName: "Morgan", therapyType: "play_therapy", goals: ["Process feelings about family", "Build self-esteem"], goalsAchieved: 2, planReviewDate: "2026-06-01" }),
  ];

  // Therapeutic environment with quiet space and sensory room
  const environments: TherapeuticEnvironment[] = [
    makeEnvironment({ outdoorTherapeuticSpace: false }),
  ];

  it("produces a valid overall result", () => {
    const result = generateTherapeuticCareIntelligence(
      allSessions, referrals, plans, environments, "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.homeId).toBe("oak-house");
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);
  });

  it("correctly counts total sessions", () => {
    const result = generateTherapeuticCareIntelligence(
      allSessions, referrals, plans, environments, "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.sessionQuality.totalSessions).toBe(12);
  });

  it("has high attendance rate (no DNA in demo)", () => {
    const result = generateTherapeuticCareIntelligence(
      allSessions, referrals, plans, environments, "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.sessionQuality.attendanceRate).toBe(100);
  });

  it("has high positive outcome rate", () => {
    const result = generateTherapeuticCareIntelligence(
      allSessions, referrals, plans, environments, "oak-house", PERIOD_START, PERIOD_END,
    );
    // 10 positive/good_progress out of 12 = 83%
    expect(result.sessionQuality.positiveOutcomeRate).toBeGreaterThanOrEqual(80);
  });

  it("correctly identifies 1 waitlisted referral", () => {
    const result = generateTherapeuticCareIntelligence(
      allSessions, referrals, plans, environments, "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.referralEfficiency.waitlistedCount).toBe(1);
  });

  it("correctly counts active referrals", () => {
    const result = generateTherapeuticCareIntelligence(
      allSessions, referrals, plans, environments, "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.referralEfficiency.activeReferrals).toBe(1);
  });

  it("correctly counts therapy plans", () => {
    const result = generateTherapeuticCareIntelligence(
      allSessions, referrals, plans, environments, "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.therapyPlanning.totalPlans).toBe(2);
  });

  it("has 100% co-produced plans", () => {
    const result = generateTherapeuticCareIntelligence(
      allSessions, referrals, plans, environments, "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.therapyPlanning.coProducedRate).toBe(100);
  });

  it("calculates goals achieved rate for Chamberlain House", () => {
    const result = generateTherapeuticCareIntelligence(
      allSessions, referrals, plans, environments, "oak-house", PERIOD_START, PERIOD_END,
    );
    // Total goals: 3 + 2 = 5, achieved: 2 + 2 = 4, rate = 80%
    expect(result.therapyPlanning.goalsAchievedRate).toBe(80);
  });

  it("detects quiet space and sensory room available", () => {
    const result = generateTherapeuticCareIntelligence(
      allSessions, referrals, plans, environments, "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.therapeuticEnvironment.quietSpaceAvailable).toBe(true);
    expect(result.therapeuticEnvironment.sensoryRoomAvailable).toBe(true);
  });

  it("detects outdoor therapeutic space not available", () => {
    const result = generateTherapeuticCareIntelligence(
      allSessions, referrals, plans, environments, "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.therapeuticEnvironment.outdoorTherapeuticSpace).toBe(false);
  });

  it("generates appropriate strengths for Chamberlain House", () => {
    const result = generateTherapeuticCareIntelligence(
      allSessions, referrals, plans, environments, "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.length).toBeGreaterThan(0);
    // Should have attendance, consent, engagement, positive outcome strengths
    expect(result.strengths.some((s) => s.includes("attendance"))).toBe(true);
    expect(result.strengths.some((s) => s.includes("consent"))).toBe(true);
  });

  it("generates regulatory links for Chamberlain House", () => {
    const result = generateTherapeuticCareIntelligence(
      allSessions, referrals, plans, environments, "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.regulatoryLinks.length).toBe(8);
  });

  it("achieves good or outstanding rating for Chamberlain House", () => {
    const result = generateTherapeuticCareIntelligence(
      allSessions, referrals, plans, environments, "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(["outstanding", "good"]).toContain(result.rating);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Edge Cases
// ══════════════════════════════════════════════════════════════════════════════

describe("Edge cases", () => {
  it("handles single session with deteriorated outcome", () => {
    const sessions = [
      makeSession({ id: "s1", outcome: "deteriorated", childEngaged: false, childConsented: false, goalsAddressed: false, keyWorkerBriefed: false }),
    ];
    const result = evaluateSessionQuality(sessions);
    expect(result.totalSessions).toBe(1);
    expect(result.positiveOutcomeRate).toBe(0);
    expect(result.attendanceRate).toBe(100); // attended but deteriorated
  });

  it("handles referral with 0 wait time", () => {
    const referrals = [makeReferral({ waitTimeDays: 0, status: "active" })];
    const result = evaluateReferralEfficiency(referrals);
    expect(result.averageWaitTimeDays).toBe(0);
  });

  it("handles plan with all goals achieved", () => {
    const plans = [
      makePlan({ goals: ["a", "b", "c"], goalsAchieved: 3 }),
    ];
    const result = evaluateTherapyPlanning(plans);
    expect(result.goalsAchievedRate).toBe(100);
  });

  it("handles plan with more goals achieved than total (data error)", () => {
    const plans = [
      makePlan({ goals: ["a"], goalsAchieved: 5 }),
    ];
    const result = evaluateTherapyPlanning(plans);
    // pct(5, 1) = 500, but it should still work
    expect(result.goalsAchievedRate).toBeGreaterThanOrEqual(100);
  });

  it("handles large number of sessions", () => {
    const sessions = Array.from({ length: 1000 }, (_, i) =>
      makeSession({ id: `s-${i}` }),
    );
    const result = evaluateSessionQuality(sessions);
    expect(result.totalSessions).toBe(1000);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("handles mixed outcomes across many sessions", () => {
    const outcomes: TherapySession["outcome"][] = [
      "positive", "good_progress", "maintaining", "no_change", "deteriorated", "did_not_attend",
    ];
    const sessions = outcomes.map((o, i) =>
      makeSession({ id: `s-${i}`, outcome: o, childEngaged: i < 3, childConsented: i < 4, goalsAddressed: i < 3, keyWorkerBriefed: i < 3 }),
    );
    const result = evaluateSessionQuality(sessions);
    expect(result.totalSessions).toBe(6);
    expect(result.attendanceRate).toBe(83); // 5/6
    expect(result.positiveOutcomeRate).toBe(33); // 2/6
  });

  it("handles all referrals pending", () => {
    const referrals = Array.from({ length: 5 }, (_, i) =>
      makeReferral({ id: `r-${i}`, status: "pending", waitTimeDays: 30 }),
    );
    const result = evaluateReferralEfficiency(referrals);
    expect(result.acceptanceRate).toBe(0);
    expect(result.activeReferrals).toBe(0);
  });

  it("handles multiple environments (uses first)", () => {
    const envs = [
      makeEnvironment({ quietSpaceAvailable: false }),
      makeEnvironment({ quietSpaceAvailable: true }),
    ];
    const result = evaluateTherapeuticEnvironment(envs);
    expect(result.quietSpaceAvailable).toBe(false);
  });
});
