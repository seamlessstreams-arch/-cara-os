// ══════════════════════════════════════════════════════════════════════════════
// Cara Missing From Care — Episode Engine Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateEpisodeCompliance,
  analyzePattern,
  calculateHomeMetrics,
  getRiskGradingLabel,
  getEpisodeStatusLabel,
} from "../episode-engine";
import type {
  MissingEpisode,
  ReturnInterview,
  EpisodeStatus,
  RiskGrading,
  PushFactor,
  PullFactor,
} from "../episode-engine";

// ── Constants ──────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-05-16T12:00:00Z";

// ── Factories ──────────────────────────────────────────────────────────────

function makeReturnInterview(overrides: Partial<ReturnInterview> = {}): ReturnInterview {
  return {
    status: "completed",
    interviewerId: "ind-001",
    interviewerName: "Maria Lopez (Independent)",
    interviewDate: "2026-05-11T14:00:00Z",
    isIndependent: true,
    childAccount: "I went to see my friend. I was bored and felt trapped.",
    pushFactorsIdentified: ["boredom", "placement_unhappy"],
    pullFactorsIdentified: ["peer_group"],
    safeguardingConcerns: [],
    actionsTaken: ["Updated safety plan", "Keyworker session scheduled"],
    referralsMade: [],
    childAgreesToSafetyPlan: true,
    ...overrides,
  };
}

function makeEpisode(overrides: Partial<MissingEpisode> = {}): MissingEpisode {
  return {
    id: "ep-001",
    childId: "child-jordan",
    childName: "Jordan Williams",
    homeId: "home-oak",
    status: "found_safe",
    riskGrading: "medium",

    reportedMissingAt: "2026-05-10T19:30:00Z",
    lastSeenAt: "2026-05-10T18:45:00Z",
    lastSeenLocation: "Home garden area",
    returnedAt: "2026-05-11T08:00:00Z",
    durationMinutes: 750, // ~12.5h

    policeNotifiedAt: "2026-05-10T20:00:00Z", // 30 min — within protocol
    policeRef: "POL-2026-4421",
    socialWorkerNotifiedAt: "2026-05-10T20:10:00Z",
    ofstedNotified: true,
    parentCarerNotified: true,

    triggerDescription: "Left home after argument with peer at dinner. Didn't return for bedtime.",
    pushFactors: ["peer_influence", "placement_unhappy"],
    pullFactors: ["peer_group"],
    associatesInvolved: true,
    exploitationConcern: false,

    returnInterview: makeReturnInterview(),
    riskAssessmentUpdated: true,

    loggedBy: "staff-001",
    loggedAt: "2026-05-10T19:35:00Z",
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// evaluateEpisodeCompliance
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateEpisodeCompliance", () => {
  it("returns fully compliant for well-managed episode", () => {
    const episode = makeEpisode();
    const result = evaluateEpisodeCompliance(episode);
    expect(result.isCompliant).toBe(true);
    expect(result.issues).toHaveLength(0);
    expect(result.policeNotifiedWithinProtocol).toBe(true);
    expect(result.returnInterviewWithin72h).toBe(true);
    expect(result.riskAssessmentUpdated).toBe(true);
    expect(result.ofstedNotified).toBe(true);
  });

  it("flags late police notification (>60 min)", () => {
    const episode = makeEpisode({
      reportedMissingAt: "2026-05-10T19:30:00Z",
      policeNotifiedAt: "2026-05-10T21:00:00Z", // 90 min
    });
    const result = evaluateEpisodeCompliance(episode);
    expect(result.policeNotifiedWithinProtocol).toBe(false);
    expect(result.isCompliant).toBe(false);
    expect(result.issues.some(i => i.includes("90 minutes"))).toBe(true);
  });

  it("flags missing police notification for non-absent episodes", () => {
    const episode = makeEpisode({
      policeNotifiedAt: undefined,
      riskGrading: "medium",
    });
    const result = evaluateEpisodeCompliance(episode);
    expect(result.policeNotifiedWithinProtocol).toBe(false);
    expect(result.issues.some(i => i.includes("Police not notified"))).toBe(true);
  });

  it("does not require police for absent grading", () => {
    const episode = makeEpisode({
      policeNotifiedAt: undefined,
      riskGrading: "absent",
      ofstedNotified: true, // absent doesn't require ofsted either
    });
    // Absent doesn't require police or ofsted
    const result = evaluateEpisodeCompliance(episode);
    expect(result.issues.filter(i => i.includes("Police"))).toHaveLength(0);
  });

  it("flags return interview completed late (>72h)", () => {
    const episode = makeEpisode({
      returnedAt: "2026-05-11T08:00:00Z",
      returnInterview: makeReturnInterview({
        status: "completed_late",
        interviewDate: "2026-05-15T10:00:00Z", // 98h later
      }),
    });
    const result = evaluateEpisodeCompliance(episode);
    expect(result.returnInterviewWithin72h).toBe(false);
    expect(result.issues.some(i => i.includes("late"))).toBe(true);
  });

  it("accepts refused interview as compliant", () => {
    const episode = makeEpisode({
      returnInterview: makeReturnInterview({ status: "refused" }),
    });
    const result = evaluateEpisodeCompliance(episode);
    expect(result.returnInterviewWithin72h).toBe(true);
  });

  it("flags not_conducted interview", () => {
    const episode = makeEpisode({
      returnInterview: makeReturnInterview({ status: "not_conducted" }),
    });
    const result = evaluateEpisodeCompliance(episode);
    expect(result.returnInterviewWithin72h).toBe(false);
    expect(result.issues.some(i => i.includes("not conducted"))).toBe(true);
  });

  it("flags missing return interview when child returned", () => {
    const episode = makeEpisode({
      returnedAt: "2026-05-11T08:00:00Z",
      returnInterview: undefined,
    });
    const result = evaluateEpisodeCompliance(episode);
    expect(result.returnInterviewWithin72h).toBe(false);
    expect(result.issues.some(i => i.includes("not recorded"))).toBe(true);
  });

  it("flags risk assessment not updated", () => {
    const episode = makeEpisode({ riskAssessmentUpdated: false });
    const result = evaluateEpisodeCompliance(episode);
    expect(result.isCompliant).toBe(false);
    expect(result.issues.some(i => i.includes("Risk assessment"))).toBe(true);
  });

  it("flags Ofsted not notified for missing episodes", () => {
    const episode = makeEpisode({ ofstedNotified: false });
    const result = evaluateEpisodeCompliance(episode);
    expect(result.isCompliant).toBe(false);
    expect(result.issues.some(i => i.includes("Ofsted"))).toBe(true);
  });

  it("does not require Ofsted for cancelled episodes", () => {
    const episode = makeEpisode({
      status: "cancelled",
      ofstedNotified: false,
      riskAssessmentUpdated: false,
    });
    const result = evaluateEpisodeCompliance(episode);
    // cancelled doesn't require ofsted or risk assessment update
    expect(result.issues.filter(i => i.includes("Ofsted"))).toHaveLength(0);
  });

  it("validates compliant interview within exactly 72h", () => {
    const episode = makeEpisode({
      returnedAt: "2026-05-11T08:00:00Z",
      returnInterview: makeReturnInterview({
        status: "completed",
        interviewDate: "2026-05-14T08:00:00Z", // exactly 72h
      }),
    });
    const result = evaluateEpisodeCompliance(episode);
    expect(result.returnInterviewWithin72h).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// analyzePattern
// ══════════════════════════════════════════════════════════════════════════════

describe("analyzePattern", () => {
  function makeEpisodes(count: number, overrides: Partial<MissingEpisode>[] = []): MissingEpisode[] {
    return Array.from({ length: count }, (_, i) => {
      const dayOffset = i * 15; // every 15 days
      const date = new Date(new Date(FIXED_NOW).getTime() - dayOffset * 24 * 60 * 60 * 1000);
      return makeEpisode({
        id: `ep-${String(i + 1).padStart(3, "0")}`,
        reportedMissingAt: date.toISOString(),
        durationMinutes: 120 + i * 60,
        ...(overrides[i] ?? {}),
      });
    });
  }

  it("counts total episodes for child (excludes cancelled)", () => {
    const episodes = [
      ...makeEpisodes(3),
      makeEpisode({ id: "ep-cancelled", status: "cancelled" }),
    ];
    const result = analyzePattern(episodes, "child-jordan", "Jordan Williams", FIXED_NOW);
    expect(result.totalEpisodes).toBe(3);
  });

  it("counts episodes in last 90 days", () => {
    const episodes = [
      ...makeEpisodes(2), // within 90 days
      makeEpisode({
        id: "ep-old",
        reportedMissingAt: "2026-01-01T12:00:00Z", // >90 days ago
      }),
    ];
    const result = analyzePattern(episodes, "child-jordan", "Jordan Williams", FIXED_NOW);
    expect(result.episodesInLast90Days).toBe(2);
    expect(result.totalEpisodes).toBe(3);
  });

  it("calculates average duration", () => {
    const episodes = [
      makeEpisode({ id: "ep-1", durationMinutes: 120 }),
      makeEpisode({ id: "ep-2", durationMinutes: 180 }),
      makeEpisode({ id: "ep-3", durationMinutes: 240 }),
    ];
    const result = analyzePattern(episodes, "child-jordan", "Jordan Williams", FIXED_NOW);
    expect(result.averageDurationMinutes).toBe(180);
  });

  it("detects evening as most common time", () => {
    const episodes = [
      makeEpisode({ id: "ep-1", reportedMissingAt: "2026-05-10T18:00:00Z" }),
      makeEpisode({ id: "ep-2", reportedMissingAt: "2026-05-08T19:30:00Z" }),
      makeEpisode({ id: "ep-3", reportedMissingAt: "2026-05-05T20:00:00Z" }),
      makeEpisode({ id: "ep-4", reportedMissingAt: "2026-05-01T10:00:00Z" }), // school
    ];
    const result = analyzePattern(episodes, "child-jordan", "Jordan Williams", FIXED_NOW);
    expect(result.mostCommonTime).toBe("evening");
  });

  it("detects night as most common time", () => {
    const episodes = [
      makeEpisode({ id: "ep-1", reportedMissingAt: "2026-05-10T23:00:00Z" }),
      makeEpisode({ id: "ep-2", reportedMissingAt: "2026-05-08T02:00:00Z" }),
      makeEpisode({ id: "ep-3", reportedMissingAt: "2026-05-05T01:30:00Z" }),
    ];
    const result = analyzePattern(episodes, "child-jordan", "Jordan Williams", FIXED_NOW);
    expect(result.mostCommonTime).toBe("night");
  });

  it("aggregates push factor frequency", () => {
    const episodes = [
      makeEpisode({ id: "ep-1", pushFactors: ["peer_influence", "boredom"] }),
      makeEpisode({ id: "ep-2", pushFactors: ["peer_influence", "mental_health"] }),
      makeEpisode({ id: "ep-3", pushFactors: ["peer_influence"] }),
    ];
    const result = analyzePattern(episodes, "child-jordan", "Jordan Williams", FIXED_NOW);
    expect(result.pushFactorFrequency[0].factor).toBe("peer_influence");
    expect(result.pushFactorFrequency[0].count).toBe(3);
  });

  it("aggregates pull factor frequency", () => {
    const episodes = [
      makeEpisode({ id: "ep-1", pullFactors: ["peer_group", "exploitation"] }),
      makeEpisode({ id: "ep-2", pullFactors: ["exploitation"] }),
      makeEpisode({ id: "ep-3", pullFactors: ["exploitation", "family"] }),
    ];
    const result = analyzePattern(episodes, "child-jordan", "Jordan Williams", FIXED_NOW);
    expect(result.pullFactorFrequency[0].factor).toBe("exploitation");
    expect(result.pullFactorFrequency[0].count).toBe(3);
  });

  it("detects escalating pattern (frequency increase)", () => {
    // 3 episodes in last 90 days vs 1 older
    const episodes = [
      makeEpisode({ id: "ep-1", reportedMissingAt: "2026-05-10T19:00:00Z" }),
      makeEpisode({ id: "ep-2", reportedMissingAt: "2026-04-20T19:00:00Z" }),
      makeEpisode({ id: "ep-3", reportedMissingAt: "2026-03-15T19:00:00Z" }),
      makeEpisode({ id: "ep-4", reportedMissingAt: "2025-12-01T19:00:00Z" }),
    ];
    const result = analyzePattern(episodes, "child-jordan", "Jordan Williams", FIXED_NOW);
    expect(result.escalating).toBe(true);
  });

  it("detects escalating pattern (high risk recent episode)", () => {
    const episodes = [
      makeEpisode({ id: "ep-1", reportedMissingAt: "2026-05-10T19:00:00Z", riskGrading: "high" }),
    ];
    const result = analyzePattern(episodes, "child-jordan", "Jordan Williams", FIXED_NOW);
    expect(result.escalating).toBe(true);
  });

  it("counts exploitation indicators", () => {
    const episodes = [
      makeEpisode({ id: "ep-1", exploitationConcern: true }),
      makeEpisode({ id: "ep-2", exploitationConcern: true }),
      makeEpisode({ id: "ep-3", exploitationConcern: false }),
    ];
    const result = analyzePattern(episodes, "child-jordan", "Jordan Williams", FIXED_NOW);
    expect(result.exploitationIndicators).toBe(2);
  });

  it("assigns very_high risk with 2+ exploitation indicators", () => {
    const episodes = [
      makeEpisode({ id: "ep-1", exploitationConcern: true, reportedMissingAt: "2026-05-10T19:00:00Z" }),
      makeEpisode({ id: "ep-2", exploitationConcern: true, reportedMissingAt: "2026-04-20T19:00:00Z" }),
    ];
    const result = analyzePattern(episodes, "child-jordan", "Jordan Williams", FIXED_NOW);
    expect(result.riskLevel).toBe("very_high");
  });

  it("assigns very_high risk with 5+ recent episodes", () => {
    const episodes = makeEpisodes(5); // all within 75 days (15-day interval)
    const result = analyzePattern(episodes, "child-jordan", "Jordan Williams", FIXED_NOW);
    expect(result.riskLevel).toBe("very_high");
  });

  it("assigns high risk with 3+ recent episodes", () => {
    const episodes = makeEpisodes(3);
    const result = analyzePattern(episodes, "child-jordan", "Jordan Williams", FIXED_NOW);
    expect(result.riskLevel).toBe("high");
  });

  it("assigns medium risk with 2 recent episodes (non-escalating)", () => {
    // Need more older episodes than recent to avoid escalation flag
    const episodes = [
      makeEpisode({ id: "ep-1", reportedMissingAt: "2026-05-10T19:00:00Z", riskGrading: "low" }),
      makeEpisode({ id: "ep-2", reportedMissingAt: "2026-04-10T19:00:00Z", riskGrading: "low" }),
      // 3 older episodes to ensure recentEpisodes <= olderEpisodes
      makeEpisode({ id: "ep-3", reportedMissingAt: "2026-01-10T19:00:00Z", riskGrading: "low" }),
      makeEpisode({ id: "ep-4", reportedMissingAt: "2025-12-10T19:00:00Z", riskGrading: "low" }),
      makeEpisode({ id: "ep-5", reportedMissingAt: "2025-11-10T19:00:00Z", riskGrading: "low" }),
    ];
    const result = analyzePattern(episodes, "child-jordan", "Jordan Williams", FIXED_NOW);
    expect(result.riskLevel).toBe("medium");
  });

  it("assigns low risk with 1 recent episode (non-escalating)", () => {
    // Need at least as many older episodes to avoid escalation flag
    const episodes = [
      makeEpisode({ id: "ep-1", reportedMissingAt: "2026-05-10T19:00:00Z", riskGrading: "low" }),
      makeEpisode({ id: "ep-2", reportedMissingAt: "2026-01-01T19:00:00Z", riskGrading: "low" }),
    ];
    const result = analyzePattern(episodes, "child-jordan", "Jordan Williams", FIXED_NOW);
    expect(result.riskLevel).toBe("low");
  });

  it("generates exploitation recommendation for high indicators", () => {
    const episodes = [
      makeEpisode({ id: "ep-1", exploitationConcern: true, reportedMissingAt: "2026-05-10T19:00:00Z" }),
      makeEpisode({ id: "ep-2", exploitationConcern: true, reportedMissingAt: "2026-04-20T19:00:00Z" }),
    ];
    const result = analyzePattern(episodes, "child-jordan", "Jordan Williams", FIXED_NOW);
    expect(result.preventionRecommendations.some(r => r.includes("MACE"))).toBe(true);
  });

  it("generates escalation recommendation", () => {
    const episodes = [
      makeEpisode({ id: "ep-1", riskGrading: "high", reportedMissingAt: "2026-05-10T19:00:00Z" }),
      makeEpisode({ id: "ep-2", reportedMissingAt: "2026-04-20T19:00:00Z" }),
    ];
    const result = analyzePattern(episodes, "child-jordan", "Jordan Williams", FIXED_NOW);
    expect(result.preventionRecommendations.some(r => r.includes("Escalating"))).toBe(true);
  });

  it("handles zero episodes gracefully", () => {
    const result = analyzePattern([], "child-jordan", "Jordan Williams", FIXED_NOW);
    expect(result.totalEpisodes).toBe(0);
    expect(result.episodesInLast90Days).toBe(0);
    expect(result.averageDurationMinutes).toBe(0);
    expect(result.riskLevel).toBe("low");
  });

  it("filters to correct child only", () => {
    const episodes = [
      makeEpisode({ id: "ep-1", childId: "child-jordan" }),
      makeEpisode({ id: "ep-2", childId: "child-alex" }),
      makeEpisode({ id: "ep-3", childId: "child-jordan" }),
    ];
    const result = analyzePattern(episodes, "child-jordan", "Jordan Williams", FIXED_NOW);
    expect(result.totalEpisodes).toBe(2);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// calculateHomeMetrics
// ══════════════════════════════════════════════════════════════════════════════

describe("calculateHomeMetrics", () => {
  it("counts total non-cancelled episodes for home", () => {
    const episodes = [
      makeEpisode({ id: "ep-1" }),
      makeEpisode({ id: "ep-2" }),
      makeEpisode({ id: "ep-3", status: "cancelled" }),
    ];
    const result = calculateHomeMetrics(episodes, "home-oak", FIXED_NOW);
    expect(result.totalEpisodes).toBe(2);
  });

  it("counts active episodes", () => {
    const episodes = [
      makeEpisode({ id: "ep-1", status: "active" }),
      makeEpisode({ id: "ep-2", status: "active" }),
      makeEpisode({ id: "ep-3", status: "found_safe" }),
    ];
    const result = calculateHomeMetrics(episodes, "home-oak", FIXED_NOW);
    expect(result.activeEpisodes).toBe(2);
  });

  it("counts episodes this month", () => {
    const episodes = [
      makeEpisode({ id: "ep-1", reportedMissingAt: "2026-05-10T19:00:00Z" }),
      makeEpisode({ id: "ep-2", reportedMissingAt: "2026-05-02T19:00:00Z" }),
      makeEpisode({ id: "ep-3", reportedMissingAt: "2026-04-15T19:00:00Z" }),
    ];
    const result = calculateHomeMetrics(episodes, "home-oak", FIXED_NOW);
    expect(result.episodesThisMonth).toBe(2);
  });

  it("counts episodes this quarter", () => {
    const episodes = [
      makeEpisode({ id: "ep-1", reportedMissingAt: "2026-05-10T19:00:00Z" }),
      makeEpisode({ id: "ep-2", reportedMissingAt: "2026-04-15T19:00:00Z" }),
      makeEpisode({ id: "ep-3", reportedMissingAt: "2026-04-01T19:00:00Z" }),
      makeEpisode({ id: "ep-4", reportedMissingAt: "2026-02-01T19:00:00Z" }), // Q1
    ];
    const result = calculateHomeMetrics(episodes, "home-oak", FIXED_NOW);
    expect(result.episodesThisQuarter).toBe(3); // Apr + May are Q2
  });

  it("calculates return interview compliance rate", () => {
    const episodes = [
      makeEpisode({ id: "ep-1", returnedAt: "2026-05-11T08:00:00Z", returnInterview: makeReturnInterview({ status: "completed" }) }),
      makeEpisode({ id: "ep-2", returnedAt: "2026-05-12T08:00:00Z", returnInterview: makeReturnInterview({ status: "refused" }) }),
      makeEpisode({ id: "ep-3", returnedAt: "2026-05-13T08:00:00Z", returnInterview: makeReturnInterview({ status: "not_conducted" }) }),
    ];
    const result = calculateHomeMetrics(episodes, "home-oak", FIXED_NOW);
    expect(result.returnInterviewCompliance).toBe(67); // 2/3
  });

  it("calculates average police response time", () => {
    const episodes = [
      makeEpisode({
        id: "ep-1",
        reportedMissingAt: "2026-05-10T19:00:00Z",
        policeNotifiedAt: "2026-05-10T19:30:00Z", // 30 min
      }),
      makeEpisode({
        id: "ep-2",
        reportedMissingAt: "2026-05-08T20:00:00Z",
        policeNotifiedAt: "2026-05-08T20:45:00Z", // 45 min
      }),
    ];
    const result = calculateHomeMetrics(episodes, "home-oak", FIXED_NOW);
    expect(result.averageResponseMinutes).toBe(38); // (30+45)/2 rounded
  });

  it("counts unique children with episodes", () => {
    const episodes = [
      makeEpisode({ id: "ep-1", childId: "child-jordan" }),
      makeEpisode({ id: "ep-2", childId: "child-jordan" }),
      makeEpisode({ id: "ep-3", childId: "child-alex" }),
    ];
    const result = calculateHomeMetrics(episodes, "home-oak", FIXED_NOW);
    expect(result.childrenWithEpisodes).toBe(2);
  });

  it("identifies repeat missers (3+ episodes)", () => {
    const episodes = [
      makeEpisode({ id: "ep-1", childId: "child-jordan" }),
      makeEpisode({ id: "ep-2", childId: "child-jordan" }),
      makeEpisode({ id: "ep-3", childId: "child-jordan" }), // 3 = repeat
      makeEpisode({ id: "ep-4", childId: "child-alex" }),
      makeEpisode({ id: "ep-5", childId: "child-alex" }),   // 2 = not repeat
    ];
    const result = calculateHomeMetrics(episodes, "home-oak", FIXED_NOW);
    expect(result.repeatMissers).toBe(1);
  });

  it("counts exploitation concerns", () => {
    const episodes = [
      makeEpisode({ id: "ep-1", exploitationConcern: true }),
      makeEpisode({ id: "ep-2", exploitationConcern: true }),
      makeEpisode({ id: "ep-3", exploitationConcern: false }),
    ];
    const result = calculateHomeMetrics(episodes, "home-oak", FIXED_NOW);
    expect(result.exploitationConcerns).toBe(2);
  });

  it("calculates overall compliance rate", () => {
    const episodes = [
      makeEpisode({ id: "ep-1" }), // fully compliant
      makeEpisode({ id: "ep-2", riskAssessmentUpdated: false }), // non-compliant
    ];
    const result = calculateHomeMetrics(episodes, "home-oak", FIXED_NOW);
    expect(result.complianceRate).toBe(50);
  });

  it("reports nothing measured when there are no episodes", () => {
    const result = calculateHomeMetrics([], "home-oak", FIXED_NOW);
    expect(result.complianceRate).toBeNull();
    expect(result.returnInterviewCompliance).toBeNull();
    expect(result.averageResponseMinutes).toBeNull();
    expect(result.totalEpisodes).toBe(0);
  });

  it("filters to correct home only", () => {
    const episodes = [
      makeEpisode({ id: "ep-1", homeId: "home-oak" }),
      makeEpisode({ id: "ep-2", homeId: "home-elm" }),
      makeEpisode({ id: "ep-3", homeId: "home-oak" }),
    ];
    const result = calculateHomeMetrics(episodes, "home-oak", FIXED_NOW);
    expect(result.totalEpisodes).toBe(2);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Helper functions
// ══════════════════════════════════════════════════════════════════════════════

describe("helper functions", () => {
  it("getRiskGradingLabel returns labels for all gradings", () => {
    expect(getRiskGradingLabel("absent")).toBe("Absent (Unauthorised)");
    expect(getRiskGradingLabel("low")).toBe("Missing — Low Risk");
    expect(getRiskGradingLabel("medium")).toBe("Missing — Medium Risk");
    expect(getRiskGradingLabel("high")).toBe("Missing — High Risk");
    expect(getRiskGradingLabel("critical")).toBe("Missing — Critical (Immediate Danger)");
  });

  it("getEpisodeStatusLabel returns labels for all statuses", () => {
    expect(getEpisodeStatusLabel("active")).toBe("Currently Missing");
    expect(getEpisodeStatusLabel("found_safe")).toBe("Found Safe");
    expect(getEpisodeStatusLabel("found_harmed")).toBe("Found — Harm Identified");
    expect(getEpisodeStatusLabel("returned_self")).toBe("Returned (Self)");
    expect(getEpisodeStatusLabel("returned_police")).toBe("Returned by Police");
    expect(getEpisodeStatusLabel("returned_other")).toBe("Returned (Other)");
    expect(getEpisodeStatusLabel("cancelled")).toBe("Cancelled");
  });
});
