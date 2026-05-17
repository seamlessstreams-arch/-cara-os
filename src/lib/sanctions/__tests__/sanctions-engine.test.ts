// ══════════════════════════════════════════════════════════════════════════════
// Sanctions & Rewards Engine — Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateChildSanctionCompliance,
  calculateHomeSanctionsMetrics,
  getSanctionTypeLabel,
  getRewardTypeLabel,
  getProhibitedPunishmentLabel,
} from "../sanctions-engine";
import type {
  ChildBehaviourProfile,
  SanctionRecord,
  RewardRecord,
} from "../sanctions-engine";

// ── Fixtures ──────────────────────────────────────────────────────────────

const NOW = "2026-05-17T12:00:00Z";

function makeSanction(overrides: Partial<SanctionRecord> = {}): SanctionRecord {
  return {
    id: "sanc-001",
    homeId: "home-oak",
    childId: "child-alex",
    childName: "Alex",
    date: "2026-05-10T14:00:00Z",
    type: "loss_of_privilege",
    description: "No gaming for evening",
    reason: "Aggressive behaviour towards Casey",
    behaviour: "aggression",
    duration: "remainder of evening",
    status: "completed",
    childInformed: true,
    childView: "I think its unfair but I understand why",
    childAgreed: false,
    deEscalationAttempted: true,
    deEscalationMethods: ["verbal redirection", "cool down time offered"],
    proportionality: "proportionate",
    linkedToBehaviour: true,
    recordedBy: "staff-jb-01",
    reviewedByManager: true,
    managerNotes: "Appropriate response, well handled",
    isProhibited: false,
    timeOfDay: "evening",
    witnesses: ["staff-kl-02"],
    parentCarerInformed: false,
    socialWorkerInformed: false,
    ...overrides,
  };
}

function makeReward(overrides: Partial<RewardRecord> = {}): RewardRecord {
  return {
    id: "rew-001",
    homeId: "home-oak",
    childId: "child-alex",
    childName: "Alex",
    date: "2026-05-12T10:00:00Z",
    type: "verbal_praise",
    description: "Well done for helping Casey with homework",
    reason: "Kindness and helpfulness",
    awardedBy: "staff-jb-01",
    ...overrides,
  };
}

function makeProfile(overrides: Partial<ChildBehaviourProfile> = {}): ChildBehaviourProfile {
  return {
    childId: "child-alex",
    childName: "Alex",
    homeId: "home-oak",
    sanctions: [
      makeSanction({ id: "sanc-001", date: "2026-05-10T14:00:00Z" }),
      makeSanction({ id: "sanc-002", date: "2026-05-05T16:00:00Z", type: "reduced_screen_time", behaviour: "defiance" }),
    ],
    rewards: [
      makeReward({ id: "rew-001", date: "2026-05-12T10:00:00Z" }),
      makeReward({ id: "rew-002", date: "2026-05-11T09:00:00Z", type: "activity_reward" }),
      makeReward({ id: "rew-003", date: "2026-05-09T08:00:00Z", type: "points_token" }),
      makeReward({ id: "rew-004", date: "2026-05-07T10:00:00Z", type: "verbal_praise" }),
      makeReward({ id: "rew-005", date: "2026-05-03T14:00:00Z", type: "extra_privilege" }),
    ],
    behaviourPlanInPlace: true,
    behaviourPlanReviewDate: "2026-07-01T00:00:00Z",
    positiveHandlingPlanExists: true,
    keyBehaviourTargets: ["Manage anger without aggression", "Use words to express frustration"],
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// Child Sanction Compliance Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateChildSanctionCompliance", () => {
  it("marks compliant child with good practice", () => {
    const result = evaluateChildSanctionCompliance(makeProfile(), NOW);
    expect(result.isCompliant).toBe(true);
    expect(result.issues).toHaveLength(0);
    expect(result.totalSanctions30Days).toBe(2);
    expect(result.totalRewards30Days).toBe(5);
    expect(result.rewardToSanctionRatio).toBe(2.5);
    expect(result.childViewRecordedRate).toBe(100);
    expect(result.deEscalationAttemptRate).toBe(100);
    expect(result.proportionalityRate).toBe(100);
  });

  it("detects prohibited punishments", () => {
    const profile = makeProfile({
      sanctions: [
        makeSanction({ isProhibited: true, prohibitedType: "deprivation_of_food" }),
      ],
    });
    const result = evaluateChildSanctionCompliance(profile, NOW);
    expect(result.isCompliant).toBe(false);
    expect(result.prohibitedPunishmentsDetected).toBe(1);
    expect(result.issues.some(i => i.includes("prohibited punishment"))).toBe(true);
  });

  it("flags missing child view", () => {
    const profile = makeProfile({
      sanctions: [
        makeSanction({ childView: undefined }),
        makeSanction({ id: "sanc-002", childView: "" }),
      ],
    });
    const result = evaluateChildSanctionCompliance(profile, NOW);
    expect(result.childViewRecordedRate).toBe(0);
    expect(result.issues.some(i => i.includes("Child's view not recorded"))).toBe(true);
  });

  it("warns about low reward-to-sanction ratio", () => {
    const profile = makeProfile({
      sanctions: [
        makeSanction({ id: "s1", date: "2026-05-10T14:00:00Z" }),
        makeSanction({ id: "s2", date: "2026-05-09T14:00:00Z" }),
        makeSanction({ id: "s3", date: "2026-05-08T14:00:00Z" }),
      ],
      rewards: [
        makeReward({ id: "r1", date: "2026-05-11T10:00:00Z" }),
      ],
    });
    const result = evaluateChildSanctionCompliance(profile, NOW);
    expect(result.rewardToSanctionRatio).toBeLessThan(2);
    expect(result.warnings.some(w => w.includes("Reward-to-sanction ratio"))).toBe(true);
  });

  it("warns when de-escalation not attempted", () => {
    const profile = makeProfile({
      sanctions: [
        makeSanction({ deEscalationAttempted: false }),
      ],
    });
    const result = evaluateChildSanctionCompliance(profile, NOW);
    expect(result.deEscalationAttemptRate).toBe(0);
    expect(result.warnings.some(w => w.includes("De-escalation not attempted"))).toBe(true);
  });

  it("flags disproportionate sanctions", () => {
    const profile = makeProfile({
      sanctions: [
        makeSanction({ proportionality: "disproportionate" }),
      ],
    });
    const result = evaluateChildSanctionCompliance(profile, NOW);
    expect(result.proportionalityRate).toBe(0);
    expect(result.issues.some(i => i.includes("disproportionate"))).toBe(true);
  });

  it("warns about unreviewed sanctions", () => {
    const profile = makeProfile({
      sanctions: [
        makeSanction({ reviewedByManager: false }),
      ],
    });
    const result = evaluateChildSanctionCompliance(profile, NOW);
    expect(result.managerReviewRate).toBe(0);
    expect(result.warnings.some(w => w.includes("not yet reviewed by manager"))).toBe(true);
  });

  it("detects escalating pattern", () => {
    const profile = makeProfile({
      sanctions: [
        makeSanction({ id: "s1", date: "2026-05-16T14:00:00Z" }),
        makeSanction({ id: "s2", date: "2026-05-15T14:00:00Z" }),
        makeSanction({ id: "s3", date: "2026-05-14T14:00:00Z" }),
      ],
    });
    const result = evaluateChildSanctionCompliance(profile, NOW);
    expect(result.escalatingPattern).toBe(true);
    expect(result.warnings.some(w => w.includes("Escalating pattern"))).toBe(true);
  });

  it("flags missing behaviour plan when many sanctions", () => {
    const profile = makeProfile({
      behaviourPlanInPlace: false,
      sanctions: [
        makeSanction({ id: "s1", date: "2026-05-16T14:00:00Z" }),
        makeSanction({ id: "s2", date: "2026-05-14T14:00:00Z" }),
        makeSanction({ id: "s3", date: "2026-05-12T14:00:00Z" }),
      ],
    });
    const result = evaluateChildSanctionCompliance(profile, NOW);
    expect(result.issues.some(i => i.includes("No behaviour plan"))).toBe(true);
  });

  it("warns about overdue behaviour plan review", () => {
    const profile = makeProfile({
      behaviourPlanInPlace: true,
      behaviourPlanReviewDate: "2026-04-01T00:00:00Z", // past NOW
    });
    const result = evaluateChildSanctionCompliance(profile, NOW);
    expect(result.behaviourPlanOverdue).toBe(true);
    expect(result.warnings.some(w => w.includes("plan review is overdue"))).toBe(true);
  });

  it("identifies most common sanction type and behaviour", () => {
    const profile = makeProfile({
      sanctions: [
        makeSanction({ id: "s1", date: "2026-05-16T14:00:00Z", type: "loss_of_privilege", behaviour: "aggression" }),
        makeSanction({ id: "s2", date: "2026-05-14T14:00:00Z", type: "loss_of_privilege", behaviour: "aggression" }),
        makeSanction({ id: "s3", date: "2026-05-12T14:00:00Z", type: "reduced_screen_time", behaviour: "defiance" }),
      ],
    });
    const result = evaluateChildSanctionCompliance(profile, NOW);
    expect(result.mostCommonSanctionType).toBe("loss_of_privilege");
    expect(result.mostCommonBehaviour).toBe("aggression");
  });

  it("tracks sanctions by time of day", () => {
    const profile = makeProfile({
      sanctions: [
        makeSanction({ id: "s1", date: "2026-05-16T14:00:00Z", timeOfDay: "evening" }),
        makeSanction({ id: "s2", date: "2026-05-14T14:00:00Z", timeOfDay: "evening" }),
        makeSanction({ id: "s3", date: "2026-05-12T14:00:00Z", timeOfDay: "morning" }),
      ],
    });
    const result = evaluateChildSanctionCompliance(profile, NOW);
    expect(result.sanctionsByTimeOfDay["evening"]).toBe(2);
    expect(result.sanctionsByTimeOfDay["morning"]).toBe(1);
  });

  it("handles child with no sanctions or rewards", () => {
    const profile = makeProfile({
      sanctions: [],
      rewards: [],
      behaviourPlanInPlace: false,
    });
    const result = evaluateChildSanctionCompliance(profile, NOW);
    expect(result.isCompliant).toBe(true);
    expect(result.totalSanctions30Days).toBe(0);
    expect(result.totalRewards30Days).toBe(0);
    expect(result.rewardToSanctionRatio).toBe(0);
  });

  it("warns about sanctions not linked to behaviour", () => {
    const profile = makeProfile({
      sanctions: [
        makeSanction({ linkedToBehaviour: false }),
      ],
    });
    const result = evaluateChildSanctionCompliance(profile, NOW);
    expect(result.linkedToBehaviourRate).toBe(0);
    expect(result.warnings.some(w => w.includes("not clearly linked"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Home Sanctions Metrics Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("calculateHomeSanctionsMetrics", () => {
  it("calculates metrics for home", () => {
    const profiles = [
      makeProfile({ childId: "child-alex", childName: "Alex" }),
      makeProfile({
        childId: "child-jordan",
        childName: "Jordan",
        sanctions: [
          makeSanction({ id: "s-j1", childId: "child-jordan", childName: "Jordan", date: "2026-05-08T14:00:00Z" }),
        ],
        rewards: [
          makeReward({ id: "r-j1", childId: "child-jordan", childName: "Jordan", date: "2026-05-10T10:00:00Z" }),
          makeReward({ id: "r-j2", childId: "child-jordan", childName: "Jordan", date: "2026-05-09T10:00:00Z" }),
          makeReward({ id: "r-j3", childId: "child-jordan", childName: "Jordan", date: "2026-05-07T10:00:00Z" }),
        ],
      }),
    ];
    const result = calculateHomeSanctionsMetrics(profiles, "home-oak", NOW);
    expect(result.totalSanctions30Days).toBe(3); // 2 from Alex + 1 from Jordan
    expect(result.totalRewards30Days).toBe(8);   // 5 from Alex + 3 from Jordan
    expect(result.overallComplianceRate).toBe(100);
    expect(result.prohibitedPunishmentCount).toBe(0);
  });

  it("aggregates sanctions by child", () => {
    const profiles = [
      makeProfile({ childId: "child-alex", childName: "Alex" }),
      makeProfile({
        childId: "child-jordan",
        childName: "Jordan",
        sanctions: [
          makeSanction({ id: "s-j1", childId: "child-jordan", childName: "Jordan", date: "2026-05-08T14:00:00Z" }),
        ],
        rewards: [],
      }),
    ];
    const result = calculateHomeSanctionsMetrics(profiles, "home-oak", NOW);
    expect(result.sanctionsByChild[0].childName).toBe("Alex"); // 2 sanctions
    expect(result.sanctionsByChild[0].count).toBe(2);
    expect(result.sanctionsByChild[1].childName).toBe("Jordan"); // 1 sanction
  });

  it("calculates reward-to-sanction ratio", () => {
    const profiles = [
      makeProfile({
        sanctions: [makeSanction({ date: "2026-05-10T14:00:00Z" })],
        rewards: [
          makeReward({ id: "r1", date: "2026-05-12T10:00:00Z" }),
          makeReward({ id: "r2", date: "2026-05-11T10:00:00Z" }),
          makeReward({ id: "r3", date: "2026-05-09T10:00:00Z" }),
          makeReward({ id: "r4", date: "2026-05-08T10:00:00Z" }),
        ],
      }),
    ];
    const result = calculateHomeSanctionsMetrics(profiles, "home-oak", NOW);
    expect(result.rewardToSanctionRatio).toBe(4);
  });

  it("detects trend direction", () => {
    // More sanctions in last 30 days than first month of 90-day window
    const profiles = [
      makeProfile({
        sanctions: [
          makeSanction({ id: "s1", date: "2026-05-16T14:00:00Z" }),
          makeSanction({ id: "s2", date: "2026-05-14T14:00:00Z" }),
          makeSanction({ id: "s3", date: "2026-05-10T14:00:00Z" }),
          makeSanction({ id: "s4", date: "2026-05-05T14:00:00Z" }),
          // One old sanction in first month of 90 days (60-90 days ago)
          makeSanction({ id: "s5", date: "2026-03-01T14:00:00Z" }),
        ],
        rewards: [],
        behaviourPlanInPlace: true,
      }),
    ];
    const result = calculateHomeSanctionsMetrics(profiles, "home-oak", NOW);
    expect(result.trendDirection).toBe("increasing");
  });

  it("counts overdue plan reviews", () => {
    const profiles = [
      makeProfile({
        behaviourPlanInPlace: true,
        behaviourPlanReviewDate: "2026-04-01T00:00:00Z", // overdue
      }),
      makeProfile({
        childId: "child-jordan",
        childName: "Jordan",
        behaviourPlanInPlace: true,
        behaviourPlanReviewDate: "2026-07-01T00:00:00Z", // not overdue
        sanctions: [],
        rewards: [],
      }),
    ];
    const result = calculateHomeSanctionsMetrics(profiles, "home-oak", NOW);
    expect(result.overduePlanReviews).toBe(1);
    expect(result.childrenWithBehaviourPlan).toBe(2);
  });

  it("handles empty profiles", () => {
    const result = calculateHomeSanctionsMetrics([], "home-oak", NOW);
    expect(result.totalSanctions30Days).toBe(0);
    expect(result.totalRewards30Days).toBe(0);
    expect(result.overallComplianceRate).toBe(100);
    expect(result.rewardToSanctionRatio).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Helper Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("Label helpers", () => {
  it("getSanctionTypeLabel returns readable labels", () => {
    expect(getSanctionTypeLabel("loss_of_privilege")).toBe("Loss of Privilege");
    expect(getSanctionTypeLabel("restorative_conversation")).toBe("Restorative Conversation");
  });

  it("getRewardTypeLabel returns readable labels", () => {
    expect(getRewardTypeLabel("verbal_praise")).toBe("Verbal Praise");
    expect(getRewardTypeLabel("points_token")).toBe("Points/Token");
  });

  it("getProhibitedPunishmentLabel returns readable labels", () => {
    expect(getProhibitedPunishmentLabel("corporal")).toBe("Corporal Punishment");
    expect(getProhibitedPunishmentLabel("collective_punishment")).toBe("Collective Punishment");
  });
});
