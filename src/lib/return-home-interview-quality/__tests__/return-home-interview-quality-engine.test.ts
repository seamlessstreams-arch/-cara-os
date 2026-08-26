// ══════════════════════════════════════════════════════════════════════════════
// Cara — Return Home Interview Quality Intelligence Engine Tests
// 100+ tests covering all functions, scoring, labels, edge cases
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateInterviewCompliance,
  evaluateInterviewDepth,
  evaluateStrategyResponse,
  evaluatePreventionEffectiveness,
  buildChildMissingProfiles,
  generateReturnHomeInterviewQualityIntelligence,
  getRating,
  getMissingEpisodeCategoryLabel,
  getRHITimelinessLabel,
  getInterviewQualityLabel,
  getPushPullFactorLabel,
  getSafetyPlanStatusLabel,
  getRatingLabel,
} from "../return-home-interview-quality-engine";
import type {
  MissingEpisode,
  ReturnHomeInterview,
  StrategyMeeting,
  PreventionMeasure,
} from "../return-home-interview-quality-engine";

// ── Helpers ────────────────────────────────────────────────────────────────

const CHILD_IDS = ["jordan", "alex"];
const CHILD_NAMES: Record<string, string> = {
  jordan: "Jordan",
  alex: "Alex",
};

function makeEpisode(overrides: Partial<MissingEpisode> = {}): MissingEpisode {
  return {
    id: "ep-01",
    childId: "jordan",
    childName: "Jordan",
    category: "missing",
    dateReported: "2025-03-01",
    dateReturned: "2025-03-01",
    duration: 6,
    policeNotified: true,
    riskAssessmentUpdated: true,
    socialWorkerNotified: true,
    ...overrides,
  };
}

function makeInterview(overrides: Partial<ReturnHomeInterview> = {}): ReturnHomeInterview {
  return {
    id: "rhi-01",
    episodeId: "ep-01",
    childId: "jordan",
    childName: "Jordan",
    interviewDate: "2025-03-02",
    interviewedBy: "Sarah Independent",
    timeliness: "within_72h",
    quality: "thorough",
    childViewsSought: true,
    pushFactorsIdentified: ["placement_unhappy"],
    pullFactorsIdentified: ["peer_influence"],
    safetyPlanStatus: "created",
    referralsMade: 1,
    informationSharedWithPolice: true,
    independentInterviewer: true,
    ...overrides,
  };
}

function makeMeeting(overrides: Partial<StrategyMeeting> = {}): StrategyMeeting {
  return {
    id: "sm-01",
    childId: "jordan",
    childName: "Jordan",
    meetingDate: "2025-03-03",
    attendees: 5,
    multiAgencyAttendance: true,
    actionPlanCreated: true,
    actionPlanReviewed: true,
    triggerPatternDiscussed: true,
    ...overrides,
  };
}

function makeMeasure(overrides: Partial<PreventionMeasure> = {}): PreventionMeasure {
  return {
    id: "pm-01",
    childId: "jordan",
    childName: "Jordan",
    measureDate: "2025-03-05",
    measureDescription: "Increased keyworker sessions",
    implementedBy: "Keyworker Team",
    effective: true,
    reviewedDate: "2025-04-01",
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// pct helper
// ══════════════════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════════════════
// getRating
// ══════════════════════════════════════════════════════════════════════════════

describe("getRating", () => {
  it("returns outstanding for score >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
  });

  it("returns good for score 60-79", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
  });

  it("returns requires_improvement for score 40-59", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
  });

  it("returns inadequate for score < 40", () => {
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(39)).toBe("inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Label functions
// ══════════════════════════════════════════════════════════════════════════════

describe("getMissingEpisodeCategoryLabel", () => {
  it("returns correct label for absent_without_permission", () => {
    expect(getMissingEpisodeCategoryLabel("absent_without_permission")).toBe("Absent Without Permission");
  });
  it("returns correct label for missing", () => {
    expect(getMissingEpisodeCategoryLabel("missing")).toBe("Missing");
  });
  it("returns correct label for runaway", () => {
    expect(getMissingEpisodeCategoryLabel("runaway")).toBe("Runaway");
  });
  it("returns correct label for absconder", () => {
    expect(getMissingEpisodeCategoryLabel("absconder")).toBe("Absconder");
  });
  it("returns correct label for failed_to_return", () => {
    expect(getMissingEpisodeCategoryLabel("failed_to_return")).toBe("Failed to Return");
  });
});

describe("getRHITimelinessLabel", () => {
  it("returns correct label for within_72h", () => {
    expect(getRHITimelinessLabel("within_72h")).toBe("Within 72 Hours");
  });
  it("returns correct label for late", () => {
    expect(getRHITimelinessLabel("late")).toBe("Late");
  });
  it("returns correct label for not_completed", () => {
    expect(getRHITimelinessLabel("not_completed")).toBe("Not Completed");
  });
  it("returns correct label for declined", () => {
    expect(getRHITimelinessLabel("declined")).toBe("Declined");
  });
});

describe("getInterviewQualityLabel", () => {
  it("returns correct label for thorough", () => {
    expect(getInterviewQualityLabel("thorough")).toBe("Thorough");
  });
  it("returns correct label for adequate", () => {
    expect(getInterviewQualityLabel("adequate")).toBe("Adequate");
  });
  it("returns correct label for superficial", () => {
    expect(getInterviewQualityLabel("superficial")).toBe("Superficial");
  });
  it("returns correct label for not_completed", () => {
    expect(getInterviewQualityLabel("not_completed")).toBe("Not Completed");
  });
});

describe("getPushPullFactorLabel", () => {
  it("returns correct label for peer_influence", () => {
    expect(getPushPullFactorLabel("peer_influence")).toBe("Peer Influence");
  });
  it("returns correct label for family_contact", () => {
    expect(getPushPullFactorLabel("family_contact")).toBe("Family Contact");
  });
  it("returns correct label for exploitation_concern", () => {
    expect(getPushPullFactorLabel("exploitation_concern")).toBe("Exploitation Concern");
  });
  it("returns correct label for substance_misuse", () => {
    expect(getPushPullFactorLabel("substance_misuse")).toBe("Substance Misuse");
  });
  it("returns correct label for placement_unhappy", () => {
    expect(getPushPullFactorLabel("placement_unhappy")).toBe("Unhappy with Placement");
  });
  it("returns correct label for mental_health", () => {
    expect(getPushPullFactorLabel("mental_health")).toBe("Mental Health");
  });
  it("returns correct label for relationship_conflict", () => {
    expect(getPushPullFactorLabel("relationship_conflict")).toBe("Relationship Conflict");
  });
  it("returns correct label for thrill_seeking", () => {
    expect(getPushPullFactorLabel("thrill_seeking")).toBe("Thrill Seeking");
  });
  it("returns correct label for unknown", () => {
    expect(getPushPullFactorLabel("unknown")).toBe("Unknown");
  });
});

describe("getSafetyPlanStatusLabel", () => {
  it("returns correct label for created", () => {
    expect(getSafetyPlanStatusLabel("created")).toBe("Created");
  });
  it("returns correct label for updated", () => {
    expect(getSafetyPlanStatusLabel("updated")).toBe("Updated");
  });
  it("returns correct label for existing_adequate", () => {
    expect(getSafetyPlanStatusLabel("existing_adequate")).toBe("Existing Adequate");
  });
  it("returns correct label for not_created", () => {
    expect(getSafetyPlanStatusLabel("not_created")).toBe("Not Created");
  });
});

describe("getRatingLabel", () => {
  it("returns correct label for outstanding", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
  });
  it("returns correct label for good", () => {
    expect(getRatingLabel("good")).toBe("Good");
  });
  it("returns correct label for requires_improvement", () => {
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
  });
  it("returns correct label for inadequate", () => {
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateInterviewCompliance
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateInterviewCompliance", () => {
  it("returns score 25 for empty episodes", () => {
    const result = evaluateInterviewCompliance([], []);
    expect(result.overallScore).toBe(25);
    expect(result.totalEpisodes).toBe(0);
    expect(result.rhiCompletedRate).toBeNull();
    expect(result.within72hRate).toBeNull();
    expect(result.declinedCount).toBe(0);
    expect(result.independentRate).toBeNull();
  });

  it("scores a single perfectly handled episode highly", () => {
    const episodes = [makeEpisode()];
    const interviews = [makeInterview()];
    const result = evaluateInterviewCompliance(episodes, interviews);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
    expect(result.totalEpisodes).toBe(1);
    expect(result.rhiCompletedRate).toBe(100);
    expect(result.within72hRate).toBe(100);
    expect(result.independentRate).toBe(100);
  });

  it("calculates RHI completed rate correctly", () => {
    const episodes = [
      makeEpisode({ id: "ep-01" }),
      makeEpisode({ id: "ep-02" }),
    ];
    const interviews = [
      makeInterview({ id: "rhi-01", episodeId: "ep-01", timeliness: "within_72h" }),
      makeInterview({ id: "rhi-02", episodeId: "ep-02", timeliness: "not_completed" }),
    ];
    const result = evaluateInterviewCompliance(episodes, interviews);
    expect(result.rhiCompletedRate).toBe(50);
  });

  it("calculates within 72h rate correctly", () => {
    const episodes = [
      makeEpisode({ id: "ep-01" }),
      makeEpisode({ id: "ep-02" }),
      makeEpisode({ id: "ep-03" }),
    ];
    const interviews = [
      makeInterview({ id: "rhi-01", episodeId: "ep-01", timeliness: "within_72h" }),
      makeInterview({ id: "rhi-02", episodeId: "ep-02", timeliness: "late" }),
      makeInterview({ id: "rhi-03", episodeId: "ep-03", timeliness: "within_72h" }),
    ];
    const result = evaluateInterviewCompliance(episodes, interviews);
    expect(result.within72hRate).toBe(67);
  });

  it("counts declined interviews correctly", () => {
    const episodes = [makeEpisode({ id: "ep-01" }), makeEpisode({ id: "ep-02" })];
    const interviews = [
      makeInterview({ id: "rhi-01", episodeId: "ep-01", timeliness: "declined" }),
      makeInterview({ id: "rhi-02", episodeId: "ep-02", timeliness: "within_72h" }),
    ];
    const result = evaluateInterviewCompliance(episodes, interviews);
    expect(result.declinedCount).toBe(1);
  });

  it("calculates independent rate correctly", () => {
    const episodes = [
      makeEpisode({ id: "ep-01" }),
      makeEpisode({ id: "ep-02" }),
    ];
    const interviews = [
      makeInterview({ id: "rhi-01", episodeId: "ep-01", independentInterviewer: true }),
      makeInterview({ id: "rhi-02", episodeId: "ep-02", independentInterviewer: false }),
    ];
    const result = evaluateInterviewCompliance(episodes, interviews);
    expect(result.independentRate).toBe(50);
  });

  it("builds quality distribution correctly", () => {
    const episodes = [
      makeEpisode({ id: "ep-01" }),
      makeEpisode({ id: "ep-02" }),
      makeEpisode({ id: "ep-03" }),
    ];
    const interviews = [
      makeInterview({ id: "rhi-01", episodeId: "ep-01", quality: "thorough" }),
      makeInterview({ id: "rhi-02", episodeId: "ep-02", quality: "adequate" }),
      makeInterview({ id: "rhi-03", episodeId: "ep-03", quality: "superficial" }),
    ];
    const result = evaluateInterviewCompliance(episodes, interviews);
    expect(result.qualityDistribution.thorough).toBe(1);
    expect(result.qualityDistribution.adequate).toBe(1);
    expect(result.qualityDistribution.superficial).toBe(1);
    expect(result.qualityDistribution.not_completed).toBe(0);
  });

  it("gives lower score for poor quality interviews", () => {
    const episodes = [makeEpisode({ id: "ep-01" })];
    const goodInterviews = [
      makeInterview({ id: "rhi-01", episodeId: "ep-01", quality: "thorough" }),
    ];
    const poorInterviews = [
      makeInterview({ id: "rhi-01", episodeId: "ep-01", quality: "superficial" }),
    ];
    const goodResult = evaluateInterviewCompliance(episodes, goodInterviews);
    const poorResult = evaluateInterviewCompliance(episodes, poorInterviews);
    expect(goodResult.overallScore).toBeGreaterThan(poorResult.overallScore);
  });

  it("filters interviews to only relevant episodes", () => {
    const episodes = [makeEpisode({ id: "ep-01" })];
    const interviews = [
      makeInterview({ id: "rhi-01", episodeId: "ep-01" }),
      makeInterview({ id: "rhi-02", episodeId: "ep-unrelated" }),
    ];
    const result = evaluateInterviewCompliance(episodes, interviews);
    // Only ep-01's interview should count
    expect(result.totalEpisodes).toBe(1);
    expect(result.rhiCompletedRate).toBe(100);
  });

  it("score stays between 0 and 25", () => {
    const episodes = [makeEpisode()];
    const interviews = [makeInterview({ timeliness: "not_completed", quality: "not_completed", independentInterviewer: false })];
    const result = evaluateInterviewCompliance(episodes, interviews);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("score capped at 25", () => {
    const result = evaluateInterviewCompliance([], []);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("handles episodes with no matching interviews", () => {
    const episodes = [makeEpisode({ id: "ep-01" })];
    const result = evaluateInterviewCompliance(episodes, []);
    expect(result.rhiCompletedRate).toBe(0);
    expect(result.within72hRate).toBe(0);
    expect(result.overallScore).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateInterviewDepth
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateInterviewDepth", () => {
  it("returns 25 when no interviews and no episodes", () => {
    const result = evaluateInterviewDepth([], false);
    expect(result.overallScore).toBe(25);
    expect(result.totalInterviews).toBe(0);
  });

  it("returns 0 when no interviews but episodes exist", () => {
    const result = evaluateInterviewDepth([], true);
    expect(result.overallScore).toBe(0);
    expect(result.totalInterviews).toBe(0);
  });

  it("scores perfect interview highly", () => {
    const interviews = [makeInterview()];
    const result = evaluateInterviewDepth(interviews, true);
    expect(result.overallScore).toBeGreaterThanOrEqual(18);
    expect(result.childViewsRate).toBe(100);
    expect(result.pushFactorsRate).toBe(100);
    expect(result.pullFactorsRate).toBe(100);
    expect(result.safetyPlanCreatedRate).toBe(100);
    expect(result.policeInfoSharedRate).toBe(100);
  });

  it("calculates child views rate correctly", () => {
    const interviews = [
      makeInterview({ id: "rhi-01", childViewsSought: true }),
      makeInterview({ id: "rhi-02", childViewsSought: false }),
    ];
    const result = evaluateInterviewDepth(interviews, true);
    expect(result.childViewsRate).toBe(50);
  });

  it("calculates push factors rate correctly", () => {
    const interviews = [
      makeInterview({ id: "rhi-01", pushFactorsIdentified: ["placement_unhappy"] }),
      makeInterview({ id: "rhi-02", pushFactorsIdentified: [] }),
      makeInterview({ id: "rhi-03", pushFactorsIdentified: [] }),
    ];
    const result = evaluateInterviewDepth(interviews, true);
    expect(result.pushFactorsRate).toBe(33);
  });

  it("calculates pull factors rate correctly", () => {
    const interviews = [
      makeInterview({ id: "rhi-01", pullFactorsIdentified: ["peer_influence"] }),
      makeInterview({ id: "rhi-02", pullFactorsIdentified: ["family_contact"] }),
      makeInterview({ id: "rhi-03", pullFactorsIdentified: [] }),
    ];
    const result = evaluateInterviewDepth(interviews, true);
    expect(result.pullFactorsRate).toBe(67);
  });

  it("calculates safety plan created rate correctly", () => {
    const interviews = [
      makeInterview({ id: "rhi-01", safetyPlanStatus: "created" }),
      makeInterview({ id: "rhi-02", safetyPlanStatus: "updated" }),
      makeInterview({ id: "rhi-03", safetyPlanStatus: "not_created" }),
    ];
    const result = evaluateInterviewDepth(interviews, true);
    expect(result.safetyPlanCreatedRate).toBe(67);
  });

  it("counts existing_adequate as having a safety plan", () => {
    const interviews = [
      makeInterview({ id: "rhi-01", safetyPlanStatus: "existing_adequate" }),
    ];
    const result = evaluateInterviewDepth(interviews, true);
    expect(result.safetyPlanCreatedRate).toBe(100);
  });

  it("calculates referrals made count correctly", () => {
    const interviews = [
      makeInterview({ id: "rhi-01", referralsMade: 2 }),
      makeInterview({ id: "rhi-02", referralsMade: 1 }),
    ];
    const result = evaluateInterviewDepth(interviews, true);
    expect(result.referralsMadeCount).toBe(3);
  });

  it("calculates police info shared rate correctly", () => {
    const interviews = [
      makeInterview({ id: "rhi-01", informationSharedWithPolice: true }),
      makeInterview({ id: "rhi-02", informationSharedWithPolice: false }),
    ];
    const result = evaluateInterviewDepth(interviews, true);
    expect(result.policeInfoSharedRate).toBe(50);
  });

  it("gives low score for minimal depth interviews", () => {
    const interviews = [
      makeInterview({
        childViewsSought: false,
        pushFactorsIdentified: [],
        pullFactorsIdentified: [],
        safetyPlanStatus: "not_created",
        referralsMade: 0,
        informationSharedWithPolice: false,
      }),
    ];
    const result = evaluateInterviewDepth(interviews, true);
    expect(result.overallScore).toBeLessThanOrEqual(5);
  });

  it("score stays between 0 and 25", () => {
    const interviews = [makeInterview()];
    const result = evaluateInterviewDepth(interviews, true);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateStrategyResponse
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateStrategyResponse", () => {
  it("returns score 25 for empty meetings", () => {
    const result = evaluateStrategyResponse([]);
    expect(result.overallScore).toBe(25);
    expect(result.totalMeetings).toBe(0);
    expect(result.multiAgencyRate).toBeNull();
    expect(result.actionPlanRate).toBeNull();
    expect(result.actionReviewedRate).toBeNull();
    expect(result.triggerPatternRate).toBeNull();
    expect(result.averageAttendees).toBe(0);
  });

  it("scores perfect meeting highly", () => {
    const meetings = [makeMeeting()];
    const result = evaluateStrategyResponse(meetings);
    expect(result.overallScore).toBe(25);
    expect(result.multiAgencyRate).toBe(100);
    expect(result.actionPlanRate).toBe(100);
    expect(result.triggerPatternRate).toBe(100);
  });

  it("calculates multi-agency rate correctly", () => {
    const meetings = [
      makeMeeting({ id: "sm-01", multiAgencyAttendance: true }),
      makeMeeting({ id: "sm-02", multiAgencyAttendance: false }),
    ];
    const result = evaluateStrategyResponse(meetings);
    expect(result.multiAgencyRate).toBe(50);
  });

  it("calculates action plan rate correctly", () => {
    const meetings = [
      makeMeeting({ id: "sm-01", actionPlanCreated: true }),
      makeMeeting({ id: "sm-02", actionPlanCreated: false }),
      makeMeeting({ id: "sm-03", actionPlanCreated: true }),
    ];
    const result = evaluateStrategyResponse(meetings);
    expect(result.actionPlanRate).toBe(67);
  });

  it("calculates action reviewed rate from reviewable meetings only", () => {
    const meetings = [
      makeMeeting({ id: "sm-01", actionPlanReviewed: true }),
      makeMeeting({ id: "sm-02", actionPlanReviewed: false }),
      makeMeeting({ id: "sm-03", actionPlanReviewed: null }), // not reviewable
    ];
    const result = evaluateStrategyResponse(meetings);
    // 1 out of 2 reviewable
    expect(result.actionReviewedRate).toBe(50);
  });

  it("calculates trigger pattern rate correctly", () => {
    const meetings = [
      makeMeeting({ id: "sm-01", triggerPatternDiscussed: true }),
      makeMeeting({ id: "sm-02", triggerPatternDiscussed: false }),
    ];
    const result = evaluateStrategyResponse(meetings);
    expect(result.triggerPatternRate).toBe(50);
  });

  it("calculates average attendees correctly", () => {
    const meetings = [
      makeMeeting({ id: "sm-01", attendees: 4 }),
      makeMeeting({ id: "sm-02", attendees: 6 }),
    ];
    const result = evaluateStrategyResponse(meetings);
    expect(result.averageAttendees).toBe(5);
  });

  it("gives attendees bonus for high attendance", () => {
    const highAttendance = [makeMeeting({ attendees: 6 })];
    const lowAttendance = [makeMeeting({ attendees: 1 })];
    const highResult = evaluateStrategyResponse(highAttendance);
    const lowResult = evaluateStrategyResponse(lowAttendance);
    expect(highResult.overallScore).toBeGreaterThan(lowResult.overallScore);
  });

  it("score stays between 0 and 25", () => {
    const meetings = [
      makeMeeting({
        multiAgencyAttendance: false,
        actionPlanCreated: false,
        actionPlanReviewed: false,
        triggerPatternDiscussed: false,
        attendees: 1,
      }),
    ];
    const result = evaluateStrategyResponse(meetings);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("handles all null actionPlanReviewed", () => {
    const meetings = [
      makeMeeting({ id: "sm-01", actionPlanReviewed: null }),
      makeMeeting({ id: "sm-02", actionPlanReviewed: null }),
    ];
    const result = evaluateStrategyResponse(meetings);
    expect(result.actionReviewedRate).toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluatePreventionEffectiveness
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluatePreventionEffectiveness", () => {
  it("returns 25 when no measures and no episodes", () => {
    const result = evaluatePreventionEffectiveness([], false);
    expect(result.overallScore).toBe(25);
    expect(result.totalMeasures).toBe(0);
  });

  it("returns 0 when no measures but episodes exist", () => {
    const result = evaluatePreventionEffectiveness([], true);
    expect(result.overallScore).toBe(0);
    expect(result.totalMeasures).toBe(0);
  });

  it("scores effective reviewed measures highly", () => {
    const measures = [
      makeMeasure({ id: "pm-01" }),
      makeMeasure({ id: "pm-02" }),
    ];
    const result = evaluatePreventionEffectiveness(measures, true);
    expect(result.overallScore).toBeGreaterThanOrEqual(15);
    expect(result.effectiveRate).toBe(100);
    expect(result.reviewedRate).toBe(100);
  });

  it("calculates effective rate correctly", () => {
    const measures = [
      makeMeasure({ id: "pm-01", effective: true }),
      makeMeasure({ id: "pm-02", effective: false }),
      makeMeasure({ id: "pm-03", effective: null }), // not assessed
    ];
    const result = evaluatePreventionEffectiveness(measures, true);
    // 1 effective out of 2 assessed (null excluded)
    expect(result.effectiveRate).toBe(50);
  });

  it("calculates reviewed rate correctly", () => {
    const measures = [
      makeMeasure({ id: "pm-01", reviewedDate: "2025-04-01" }),
      makeMeasure({ id: "pm-02", reviewedDate: null }),
    ];
    const result = evaluatePreventionEffectiveness(measures, true);
    expect(result.reviewedRate).toBe(50);
  });

  it("counts unique children correctly", () => {
    const measures = [
      makeMeasure({ id: "pm-01", childId: "jordan" }),
      makeMeasure({ id: "pm-02", childId: "jordan" }),
      makeMeasure({ id: "pm-03", childId: "alex" }),
    ];
    const result = evaluatePreventionEffectiveness(measures, true);
    expect(result.uniqueChildren).toBe(2);
  });

  it("gives low score for unreviewed ineffective measures", () => {
    const measures = [
      makeMeasure({ id: "pm-01", effective: false, reviewedDate: null }),
    ];
    const result = evaluatePreventionEffectiveness(measures, true);
    expect(result.overallScore).toBeLessThan(15);
  });

  it("score stays between 0 and 25", () => {
    const measures = [makeMeasure()];
    const result = evaluatePreventionEffectiveness(measures, true);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("gives frequency bonus for multiple measures", () => {
    const fewMeasures = [makeMeasure({ id: "pm-01" })];
    const manyMeasures = [
      makeMeasure({ id: "pm-01" }),
      makeMeasure({ id: "pm-02" }),
      makeMeasure({ id: "pm-03" }),
      makeMeasure({ id: "pm-04" }),
    ];
    const fewResult = evaluatePreventionEffectiveness(fewMeasures, true);
    const manyResult = evaluatePreventionEffectiveness(manyMeasures, true);
    expect(manyResult.overallScore).toBeGreaterThanOrEqual(fewResult.overallScore);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// buildChildMissingProfiles
// ══════════════════════════════════════════════════════════════════════════════

describe("buildChildMissingProfiles", () => {
  it("builds profiles for all children", () => {
    const profiles = buildChildMissingProfiles([], [], CHILD_IDS, CHILD_NAMES);
    expect(profiles).toHaveLength(2);
    expect(profiles[0].childId).toBe("jordan");
    expect(profiles[0].childName).toBe("Jordan");
    expect(profiles[1].childId).toBe("alex");
    expect(profiles[1].childName).toBe("Alex");
  });

  it("counts episodes per child correctly", () => {
    const episodes = [
      makeEpisode({ id: "ep-01", childId: "jordan" }),
      makeEpisode({ id: "ep-02", childId: "jordan" }),
      makeEpisode({ id: "ep-03", childId: "alex" }),
    ];
    const profiles = buildChildMissingProfiles(episodes, [], CHILD_IDS, CHILD_NAMES);
    expect(profiles[0].episodeCount).toBe(2); // jordan
    expect(profiles[1].episodeCount).toBe(1); // alex
  });

  it("calculates RHI completed rate per child", () => {
    const episodes = [
      makeEpisode({ id: "ep-01", childId: "jordan" }),
      makeEpisode({ id: "ep-02", childId: "jordan" }),
    ];
    const interviews = [
      makeInterview({ id: "rhi-01", episodeId: "ep-01", childId: "jordan", timeliness: "within_72h" }),
      makeInterview({ id: "rhi-02", episodeId: "ep-02", childId: "jordan", timeliness: "not_completed" }),
    ];
    const profiles = buildChildMissingProfiles(episodes, interviews, CHILD_IDS, CHILD_NAMES);
    expect(profiles[0].rhiCompletedRate).toBe(50);
  });

  it("calculates average duration correctly", () => {
    const episodes = [
      makeEpisode({ id: "ep-01", childId: "jordan", duration: 4 }),
      makeEpisode({ id: "ep-02", childId: "jordan", duration: 8 }),
    ];
    const profiles = buildChildMissingProfiles(episodes, [], CHILD_IDS, CHILD_NAMES);
    expect(profiles[0].averageDuration).toBe(6);
  });

  it("returns null duration when no durations available", () => {
    const episodes = [
      makeEpisode({ id: "ep-01", childId: "jordan", duration: null }),
    ];
    const profiles = buildChildMissingProfiles(episodes, [], CHILD_IDS, CHILD_NAMES);
    expect(profiles[0].averageDuration).toBeNull();
  });

  it("identifies common factors across interviews", () => {
    const interviews = [
      makeInterview({
        id: "rhi-01",
        childId: "jordan",
        pushFactorsIdentified: ["placement_unhappy", "mental_health"],
        pullFactorsIdentified: ["peer_influence"],
      }),
      makeInterview({
        id: "rhi-02",
        childId: "jordan",
        pushFactorsIdentified: ["placement_unhappy"],
        pullFactorsIdentified: ["peer_influence"],
      }),
    ];
    const profiles = buildChildMissingProfiles([], interviews, CHILD_IDS, CHILD_NAMES);
    // placement_unhappy (2) and peer_influence (2) should be most common
    expect(profiles[0].commonFactors).toContain("placement_unhappy");
    expect(profiles[0].commonFactors).toContain("peer_influence");
  });

  it("detects safety plan status correctly", () => {
    const interviews = [
      makeInterview({ id: "rhi-01", childId: "jordan", safetyPlanStatus: "created" }),
    ];
    const profiles = buildChildMissingProfiles([], interviews, CHILD_IDS, CHILD_NAMES);
    expect(profiles[0].hasSafetyPlan).toBe(true);
  });

  it("hasSafetyPlan false when not_created", () => {
    const interviews = [
      makeInterview({ id: "rhi-01", childId: "jordan", safetyPlanStatus: "not_created" }),
    ];
    const profiles = buildChildMissingProfiles([], interviews, CHILD_IDS, CHILD_NAMES);
    expect(profiles[0].hasSafetyPlan).toBe(false);
  });

  it("child with no episodes has default score of 5", () => {
    const profiles = buildChildMissingProfiles([], [], CHILD_IDS, CHILD_NAMES);
    expect(profiles[0].overallScore).toBe(5);
  });

  it("child with episodes and good RHIs scores higher", () => {
    const episodes = [makeEpisode({ id: "ep-01", childId: "jordan" })];
    const interviews = [
      makeInterview({
        id: "rhi-01",
        episodeId: "ep-01",
        childId: "jordan",
        safetyPlanStatus: "created",
        pushFactorsIdentified: ["placement_unhappy"],
        pullFactorsIdentified: ["peer_influence"],
      }),
    ];
    const profiles = buildChildMissingProfiles(episodes, interviews, CHILD_IDS, CHILD_NAMES);
    expect(profiles[0].overallScore).toBeGreaterThanOrEqual(7);
  });

  it("score capped at 10", () => {
    const episodes = [makeEpisode({ id: "ep-01", childId: "jordan" })];
    const interviews = [makeInterview({ id: "rhi-01", episodeId: "ep-01", childId: "jordan" })];
    const profiles = buildChildMissingProfiles(episodes, interviews, CHILD_IDS, CHILD_NAMES);
    expect(profiles[0].overallScore).toBeLessThanOrEqual(10);
  });

  it("score cannot go below 0", () => {
    const episodes = [makeEpisode({ id: "ep-01", childId: "jordan" })];
    const profiles = buildChildMissingProfiles(episodes, [], CHILD_IDS, CHILD_NAMES);
    expect(profiles[0].overallScore).toBeGreaterThanOrEqual(0);
  });

  it("uses childId as name when not in childNames", () => {
    const profiles = buildChildMissingProfiles([], [], ["unknown-child"], {});
    expect(profiles[0].childName).toBe("unknown-child");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// generateReturnHomeInterviewQualityIntelligence — main function
// ══════════════════════════════════════════════════════════════════════════════

describe("generateReturnHomeInterviewQualityIntelligence", () => {
  it("returns a complete result with all required fields", () => {
    const result = generateReturnHomeInterviewQualityIntelligence(
      [], [], [], [], CHILD_IDS, CHILD_NAMES,
      "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2025-01-01");
    expect(result.periodEnd).toBe("2025-06-30");
    expect(typeof result.overallScore).toBe("number");
    expect(typeof result.rating).toBe("string");
    expect(result.interviewCompliance).toBeDefined();
    expect(result.interviewDepth).toBeDefined();
    expect(result.strategyResponse).toBeDefined();
    expect(result.preventionEffectiveness).toBeDefined();
    expect(result.childProfiles).toBeDefined();
    expect(result.strengths).toBeDefined();
    expect(result.areasForImprovement).toBeDefined();
    expect(result.actions).toBeDefined();
    expect(result.regulatoryLinks).toBeDefined();
  });

  it("overall score is sum of 4 evaluator scores", () => {
    const episodes = [makeEpisode()];
    const interviews = [makeInterview()];
    const meetings = [makeMeeting()];
    const measures = [makeMeasure()];
    const result = generateReturnHomeInterviewQualityIntelligence(
      episodes, interviews, meetings, measures, CHILD_IDS, CHILD_NAMES,
      "oak-house", "2025-01-01", "2025-06-30",
    );
    const expectedSum =
      result.interviewCompliance.overallScore +
      result.interviewDepth.overallScore +
      result.strategyResponse.overallScore +
      result.preventionEffectiveness.overallScore;
    expect(result.overallScore).toBe(expectedSum);
  });

  it("rating maps correctly from overall score — outstanding", () => {
    // No episodes = 25+25+25+25 = 100
    const result = generateReturnHomeInterviewQualityIntelligence(
      [], [], [], [], CHILD_IDS, CHILD_NAMES,
      "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.overallScore).toBe(100);
    expect(result.rating).toBe("outstanding");
  });

  it("clamped between 0 and 100", () => {
    const result = generateReturnHomeInterviewQualityIntelligence(
      [], [], [], [], [], {},
      "test", "2025-01-01", "2025-06-30",
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("builds child profiles for all provided childIds", () => {
    const result = generateReturnHomeInterviewQualityIntelligence(
      [], [], [], [], CHILD_IDS, CHILD_NAMES,
      "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.childProfiles).toHaveLength(2);
  });

  it("includes regulatory links", () => {
    const result = generateReturnHomeInterviewQualityIntelligence(
      [], [], [], [], [], {},
      "test", "2025-01-01", "2025-06-30",
    );
    expect(result.regulatoryLinks.length).toBe(7);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015 Reg 12"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015 Reg 34"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("NMS 5"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Working Together 2023"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("UNCRC Article 19"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Statutory guidance on children who go missing"))).toBe(true);
  });

  // ── Strengths ──

  it("generates strength for no missing episodes", () => {
    const result = generateReturnHomeInterviewQualityIntelligence(
      [], [], [], [], CHILD_IDS, CHILD_NAMES,
      "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.strengths.some((s) => s.includes("No missing episodes"))).toBe(true);
  });

  it("generates strength for 100% RHI completion", () => {
    const episodes = [makeEpisode()];
    const interviews = [makeInterview()];
    const result = generateReturnHomeInterviewQualityIntelligence(
      episodes, interviews, [makeMeeting()], [makeMeasure()], CHILD_IDS, CHILD_NAMES,
      "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.strengths.some((s) => s.includes("All missing episodes have had RHIs completed"))).toBe(true);
  });

  it("generates strength for 100% within 72h", () => {
    const episodes = [makeEpisode()];
    const interviews = [makeInterview({ timeliness: "within_72h" })];
    const result = generateReturnHomeInterviewQualityIntelligence(
      episodes, interviews, [makeMeeting()], [makeMeasure()], CHILD_IDS, CHILD_NAMES,
      "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.strengths.some((s) => s.includes("72-hour timeframe"))).toBe(true);
  });

  it("generates strength for 100% independent interviewers", () => {
    const episodes = [makeEpisode()];
    const interviews = [makeInterview({ independentInterviewer: true })];
    const result = generateReturnHomeInterviewQualityIntelligence(
      episodes, interviews, [makeMeeting()], [makeMeasure()], CHILD_IDS, CHILD_NAMES,
      "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.strengths.some((s) => s.includes("independent interviewers"))).toBe(true);
  });

  it("generates strength for 100% child views sought", () => {
    const episodes = [makeEpisode()];
    const interviews = [makeInterview({ childViewsSought: true })];
    const result = generateReturnHomeInterviewQualityIntelligence(
      episodes, interviews, [makeMeeting()], [makeMeasure()], CHILD_IDS, CHILD_NAMES,
      "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.strengths.some((s) => s.includes("Children's views are consistently sought"))).toBe(true);
  });

  // ── Areas for Improvement ──

  it("flags low RHI completion rate", () => {
    const episodes = [makeEpisode({ id: "ep-01" }), makeEpisode({ id: "ep-02" })];
    const interviews = [
      makeInterview({ id: "rhi-01", episodeId: "ep-01" }),
      // ep-02 has no interview
    ];
    const result = generateReturnHomeInterviewQualityIntelligence(
      episodes, interviews, [], [], CHILD_IDS, CHILD_NAMES,
      "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.areasForImprovement.some((a) => a.includes("completed RHIs"))).toBe(true);
  });

  it("flags low within 72h rate", () => {
    const episodes = [makeEpisode({ id: "ep-01" })];
    const interviews = [makeInterview({ episodeId: "ep-01", timeliness: "late" })];
    const result = generateReturnHomeInterviewQualityIntelligence(
      episodes, interviews, [], [], CHILD_IDS, CHILD_NAMES,
      "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.areasForImprovement.some((a) => a.includes("72 hours"))).toBe(true);
  });

  it("flags no prevention measures when episodes exist", () => {
    const episodes = [makeEpisode()];
    const interviews = [makeInterview()];
    const result = generateReturnHomeInterviewQualityIntelligence(
      episodes, interviews, [], [], CHILD_IDS, CHILD_NAMES,
      "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.areasForImprovement.some((a) => a.includes("No prevention measures"))).toBe(true);
  });

  it("flags declined RHIs", () => {
    const episodes = [makeEpisode({ id: "ep-01" })];
    const interviews = [makeInterview({ episodeId: "ep-01", timeliness: "declined" })];
    const result = generateReturnHomeInterviewQualityIntelligence(
      episodes, interviews, [], [], CHILD_IDS, CHILD_NAMES,
      "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.areasForImprovement.some((a) => a.includes("declined"))).toBe(true);
  });

  it("flags low independent interviewer rate", () => {
    const episodes = [makeEpisode({ id: "ep-01" })];
    const interviews = [makeInterview({ episodeId: "ep-01", independentInterviewer: false })];
    const result = generateReturnHomeInterviewQualityIntelligence(
      episodes, interviews, [], [], CHILD_IDS, CHILD_NAMES,
      "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.areasForImprovement.some((a) => a.includes("independent interviewers"))).toBe(true);
  });

  // ── Actions ──

  it("generates action for incomplete RHIs", () => {
    const episodes = [makeEpisode({ id: "ep-01" }), makeEpisode({ id: "ep-02" })];
    const interviews = [makeInterview({ id: "rhi-01", episodeId: "ep-01" })];
    const result = generateReturnHomeInterviewQualityIntelligence(
      episodes, interviews, [], [], CHILD_IDS, CHILD_NAMES,
      "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.actions.some((a) => a.includes("return home interview"))).toBe(true);
  });

  it("generates action for safety plans", () => {
    const episodes = [makeEpisode({ id: "ep-01" })];
    const interviews = [
      makeInterview({ episodeId: "ep-01", safetyPlanStatus: "not_created" }),
    ];
    const result = generateReturnHomeInterviewQualityIntelligence(
      episodes, interviews, [], [], CHILD_IDS, CHILD_NAMES,
      "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.actions.some((a) => a.includes("safety plan"))).toBe(true);
  });

  it("generates action for no prevention measures", () => {
    const episodes = [makeEpisode()];
    const result = generateReturnHomeInterviewQualityIntelligence(
      episodes, [makeInterview()], [], [], CHILD_IDS, CHILD_NAMES,
      "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.actions.some((a) => a.includes("prevention measures"))).toBe(true);
  });

  it("generates action for declined RHIs", () => {
    const episodes = [makeEpisode({ id: "ep-01" })];
    const interviews = [makeInterview({ episodeId: "ep-01", timeliness: "declined" })];
    const result = generateReturnHomeInterviewQualityIntelligence(
      episodes, interviews, [], [], CHILD_IDS, CHILD_NAMES,
      "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.actions.some((a) => a.includes("creative engagement"))).toBe(true);
  });

  it("generates action for non-independent interviewers", () => {
    const episodes = [makeEpisode({ id: "ep-01" })];
    const interviews = [makeInterview({ episodeId: "ep-01", independentInterviewer: false })];
    const result = generateReturnHomeInterviewQualityIntelligence(
      episodes, interviews, [], [], CHILD_IDS, CHILD_NAMES,
      "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.actions.some((a) => a.includes("independent interviewer"))).toBe(true);
  });

  // ── Edge cases ──

  it("handles empty inputs gracefully", () => {
    const result = generateReturnHomeInterviewQualityIntelligence(
      [], [], [], [], [], {},
      "empty-home", "2025-01-01", "2025-06-30",
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.childProfiles).toHaveLength(0);
    expect(result.rating).toBeDefined();
  });

  it("handles realistic mixed scenario", () => {
    // Jordan: 2 missing episodes, 2 RHIs (1 thorough, 1 adequate)
    // Alex: 1 absent-without-permission episode, 1 RHI
    const episodes: MissingEpisode[] = [
      makeEpisode({
        id: "ep-01", childId: "jordan", childName: "Jordan",
        category: "missing", duration: 8, dateReported: "2025-02-10", dateReturned: "2025-02-10",
      }),
      makeEpisode({
        id: "ep-02", childId: "jordan", childName: "Jordan",
        category: "runaway", duration: 14, dateReported: "2025-03-20", dateReturned: "2025-03-21",
      }),
      makeEpisode({
        id: "ep-03", childId: "alex", childName: "Alex",
        category: "absent_without_permission", duration: 3, dateReported: "2025-04-01", dateReturned: "2025-04-01",
      }),
    ];

    const interviews: ReturnHomeInterview[] = [
      makeInterview({
        id: "rhi-01", episodeId: "ep-01", childId: "jordan", childName: "Jordan",
        timeliness: "within_72h", quality: "thorough",
        childViewsSought: true,
        pushFactorsIdentified: ["placement_unhappy"],
        pullFactorsIdentified: ["peer_influence"],
        safetyPlanStatus: "created",
        referralsMade: 1, informationSharedWithPolice: true, independentInterviewer: true,
      }),
      makeInterview({
        id: "rhi-02", episodeId: "ep-02", childId: "jordan", childName: "Jordan",
        timeliness: "within_72h", quality: "adequate",
        childViewsSought: true,
        pushFactorsIdentified: ["mental_health", "placement_unhappy"],
        pullFactorsIdentified: ["peer_influence"],
        safetyPlanStatus: "updated",
        referralsMade: 2, informationSharedWithPolice: true, independentInterviewer: true,
      }),
      makeInterview({
        id: "rhi-03", episodeId: "ep-03", childId: "alex", childName: "Alex",
        timeliness: "within_72h", quality: "adequate",
        childViewsSought: true,
        pushFactorsIdentified: [],
        pullFactorsIdentified: ["family_contact"],
        safetyPlanStatus: "existing_adequate",
        referralsMade: 0, informationSharedWithPolice: false, independentInterviewer: true,
      }),
    ];

    const meetings: StrategyMeeting[] = [
      makeMeeting({
        id: "sm-01", childId: "jordan", childName: "Jordan",
        meetingDate: "2025-02-11", attendees: 5,
        multiAgencyAttendance: true, actionPlanCreated: true,
        actionPlanReviewed: true, triggerPatternDiscussed: true,
      }),
      makeMeeting({
        id: "sm-02", childId: "jordan", childName: "Jordan",
        meetingDate: "2025-03-22", attendees: 4,
        multiAgencyAttendance: true, actionPlanCreated: true,
        actionPlanReviewed: null, triggerPatternDiscussed: true,
      }),
    ];

    const measures: PreventionMeasure[] = [
      makeMeasure({
        id: "pm-01", childId: "jordan", childName: "Jordan",
        measureDescription: "Increased keyworker sessions",
        effective: true, reviewedDate: "2025-04-01",
      }),
      makeMeasure({
        id: "pm-02", childId: "jordan", childName: "Jordan",
        measureDescription: "Peer mentoring programme",
        effective: null, reviewedDate: null,
      }),
      makeMeasure({
        id: "pm-03", childId: "alex", childName: "Alex",
        measureDescription: "Family contact schedule review",
        effective: true, reviewedDate: "2025-04-15",
      }),
    ];

    const result = generateReturnHomeInterviewQualityIntelligence(
      episodes, interviews, meetings, measures, CHILD_IDS, CHILD_NAMES,
      "oak-house", "2025-01-01", "2025-06-30",
    );

    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.childProfiles).toHaveLength(2);
    expect(result.regulatoryLinks.length).toBe(7);
    expect(result.interviewCompliance.totalEpisodes).toBe(3);
    expect(result.interviewCompliance.rhiCompletedRate).toBe(100);
    expect(result.interviewCompliance.within72hRate).toBe(100);
    expect(result.interviewDepth.totalInterviews).toBe(3);
    expect(result.strategyResponse.totalMeetings).toBe(2);
    expect(result.preventionEffectiveness.totalMeasures).toBe(3);
  });
});
