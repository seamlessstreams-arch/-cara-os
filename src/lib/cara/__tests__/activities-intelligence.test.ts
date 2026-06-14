// ══════════════════════════════════════════════════════════════════════════════
// Tests — Activities & Enrichment Intelligence Engine
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  analyseActivities,
  ActivityInput,
  Activity,
  ActivityCategory,
} from "../activities-intelligence";

// ── Helpers ─────────────────────────────────────────────────────────────────

const FIXED_NOW = new Date("2026-05-16T12:00:00Z").getTime();

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_NOW);
});

function makeActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: `act_${Math.random().toString(36).slice(2)}`,
    date: "2026-05-01",
    name: "Football training",
    category: "sport",
    duration: 60,
    childChose: true,
    childEngagement: "high",
    communityBased: true,
    peerInteraction: true,
    recurring: true,
    supervisedOnly: false,
    ...overrides,
  };
}

function makeInput(overrides: Partial<ActivityInput> = {}): ActivityInput {
  return {
    childId: "child_1",
    childName: "Jordan",
    age: 15,
    activities: [],
    hobbiesIdentified: true,
    interestsExplored: true,
    activityBudgetAvailable: true,
    memberOfClubOrGroup: true,
    attendsCommunityActivities: true,
    hasAchievementsRecorded: true,
    pocketMoneyForActivities: true,
    restrictedFromActivities: false,
    ...overrides,
  };
}

function makeVariedActivities(count: number): Activity[] {
  const categories: ActivityCategory[] = ["sport", "creative_arts", "music", "outdoor", "social"];
  return Array.from({ length: count }, (_, i) =>
    makeActivity({
      category: categories[i % categories.length],
      name: `Activity ${i + 1}`,
      communityBased: i % 2 === 0,
      peerInteraction: i % 3 !== 2,
      childChose: true,
    })
  );
}

// ═══════════════════════════════════════════════════════════════════════════════

describe("Activities & Enrichment Intelligence Engine", () => {

  // ── Basic functionality ─────────────────────────────────────────────────

  describe("Basic functionality", () => {
    it("returns valid assessment structure", () => {
      const result = analyseActivities(makeInput());
      expect(result).toHaveProperty("overallScore");
      expect(result).toHaveProperty("overallRating");
      expect(result).toHaveProperty("participationScore");
      expect(result).toHaveProperty("varietyScore");
      expect(result).toHaveProperty("engagementScore");
      expect(result).toHaveProperty("integrationScore");
      expect(result).toHaveProperty("categoryBreakdown");
      expect(result).toHaveProperty("concerns");
      expect(result).toHaveProperty("strengths");
      expect(result).toHaveProperty("regulatoryFlags");
      expect(result).toHaveProperty("recommendations");
      expect(result).toHaveProperty("summary");
    });

    it("uses childName", () => {
      const result = analyseActivities(makeInput({ childName: "Sam" }));
      expect(result.childName).toBe("Sam");
      expect(result.summary).toContain("Sam");
    });

    it("handles no activities", () => {
      const result = analyseActivities(makeInput());
      expect(result.totalActivities).toBe(0);
      expect(result.activitiesPerWeek).toBe(0);
    });
  });

  // ── Metrics ───────────────────────────────────────────────────────────

  describe("Metrics", () => {
    it("calculates activities per week", () => {
      const activities = Array.from({ length: 36 }, () => makeActivity());
      const result = analyseActivities(makeInput({ activities }));
      expect(result.activitiesPerWeek).toBe(3); // 36/12 = 3
    });

    it("counts categories covered", () => {
      const result = analyseActivities(makeInput({
        activities: [
          makeActivity({ category: "sport" }),
          makeActivity({ category: "creative_arts" }),
          makeActivity({ category: "sport" }),
          makeActivity({ category: "music" }),
        ],
      }));
      expect(result.categoriesCovered).toBe(3);
    });

    it("calculates community rate", () => {
      const result = analyseActivities(makeInput({
        activities: [
          makeActivity({ communityBased: true }),
          makeActivity({ communityBased: true }),
          makeActivity({ communityBased: false }),
          makeActivity({ communityBased: false }),
        ],
      }));
      expect(result.communityRate).toBe(0.5);
    });

    it("calculates peer rate", () => {
      const result = analyseActivities(makeInput({
        activities: [
          makeActivity({ peerInteraction: true }),
          makeActivity({ peerInteraction: true }),
          makeActivity({ peerInteraction: true }),
          makeActivity({ peerInteraction: false }),
        ],
      }));
      expect(result.peerRate).toBe(0.75);
    });

    it("calculates child choice rate", () => {
      const result = analyseActivities(makeInput({
        activities: [
          makeActivity({ childChose: true }),
          makeActivity({ childChose: false }),
          makeActivity({ childChose: true }),
        ],
      }));
      expect(result.childChoiceRate).toBeCloseTo(0.67, 1);
    });

    it("collects achievements", () => {
      const result = analyseActivities(makeInput({
        activities: [
          makeActivity({ achievementNoted: "Scored first goal" }),
          makeActivity({ achievementNoted: undefined }),
          makeActivity({ achievementNoted: "Grade 3 piano" }),
        ],
      }));
      expect(result.achievements).toHaveLength(2);
      expect(result.achievements).toContain("Scored first goal");
    });
  });

  // ── Category breakdown ────────────────────────────────────────────────

  describe("Category breakdown", () => {
    it("groups by category with percentages", () => {
      const result = analyseActivities(makeInput({
        activities: [
          makeActivity({ category: "sport" }),
          makeActivity({ category: "sport" }),
          makeActivity({ category: "creative_arts" }),
          makeActivity({ category: "music" }),
        ],
      }));
      const sport = result.categoryBreakdown.find(c => c.category === "sport");
      expect(sport!.count).toBe(2);
      expect(sport!.percentage).toBe(50);
    });

    it("sorted by count descending", () => {
      const result = analyseActivities(makeInput({
        activities: [
          makeActivity({ category: "music" }),
          makeActivity({ category: "sport" }),
          makeActivity({ category: "sport" }),
          makeActivity({ category: "sport" }),
        ],
      }));
      expect(result.categoryBreakdown[0].category).toBe("sport");
    });
  });

  // ── Participation scoring ─────────────────────────────────────────────

  describe("Participation scoring", () => {
    it("100 for 4+ per week", () => {
      const activities = Array.from({ length: 48 }, () => makeActivity());
      const result = analyseActivities(makeInput({ activities }));
      expect(result.participationScore).toBe(100);
    });

    it("low for very few activities", () => {
      const result = analyseActivities(makeInput({
        activities: [makeActivity(), makeActivity()],
      }));
      expect(result.participationScore).toBeLessThan(40);
    });

    it("very low for no activities", () => {
      const result = analyseActivities(makeInput());
      expect(result.participationScore).toBe(10);
    });
  });

  // ── Variety scoring ───────────────────────────────────────────────────

  describe("Variety scoring", () => {
    it("high for 5+ categories", () => {
      const result = analyseActivities(makeInput({
        activities: makeVariedActivities(10),
      }));
      expect(result.varietyScore).toBe(100);
    });

    it("low for single category", () => {
      const result = analyseActivities(makeInput({
        activities: [
          makeActivity({ category: "sport" }),
          makeActivity({ category: "sport" }),
          makeActivity({ category: "sport" }),
        ],
      }));
      expect(result.varietyScore).toBeLessThan(30);
    });

    it("penalises heavy concentration", () => {
      // 4 categories but one dominates at > 60%
      const result = analyseActivities(makeInput({
        activities: [
          makeActivity({ category: "sport" }),
          makeActivity({ category: "sport" }),
          makeActivity({ category: "sport" }),
          makeActivity({ category: "sport" }),
          makeActivity({ category: "creative_arts" }),
          makeActivity({ category: "music" }),
          makeActivity({ category: "outdoor" }),
        ],
      }));
      // sport = 57% (4/7), technically just under 60%
      // Let's use 5/7 = 71%
      const result2 = analyseActivities(makeInput({
        activities: [
          makeActivity({ category: "sport" }),
          makeActivity({ category: "sport" }),
          makeActivity({ category: "sport" }),
          makeActivity({ category: "sport" }),
          makeActivity({ category: "sport" }),
          makeActivity({ category: "creative_arts" }),
          makeActivity({ category: "music" }),
        ],
      }));
      // 3 categories * 20 = 60, minus 15 for concentration = 45
      expect(result2.varietyScore).toBeLessThan(55);
    });
  });

  // ── Engagement scoring ────────────────────────────────────────────────

  describe("Engagement scoring", () => {
    it("high for enthusiastic child-chosen activities", () => {
      const activities = Array.from({ length: 6 }, () => makeActivity({
        childEngagement: "high", childChose: true, recurring: true,
      }));
      const result = analyseActivities(makeInput({ activities }));
      expect(result.engagementScore).toBe(100);
    });

    it("low for refused/staff-chosen activities", () => {
      const result = analyseActivities(makeInput({
        activities: [
          makeActivity({ childEngagement: "refused", childChose: false, recurring: false }),
          makeActivity({ childEngagement: "low", childChose: false, recurring: false }),
          makeActivity({ childEngagement: "refused", childChose: false, recurring: false }),
        ],
      }));
      expect(result.engagementScore).toBeLessThan(30);
    });
  });

  // ── Integration scoring ───────────────────────────────────────────────

  describe("Integration scoring", () => {
    it("high for community and peer activities", () => {
      const result = analyseActivities(makeInput({
        activities: [
          makeActivity({ communityBased: true, peerInteraction: true }),
          makeActivity({ communityBased: true, peerInteraction: true }),
          makeActivity({ communityBased: true, peerInteraction: true }),
        ],
        memberOfClubOrGroup: true,
        attendsCommunityActivities: true,
      }));
      expect(result.integrationScore).toBe(100);
    });

    it("low for in-home staff-only activities", () => {
      const result = analyseActivities(makeInput({
        activities: [
          makeActivity({ communityBased: false, peerInteraction: false }),
          makeActivity({ communityBased: false, peerInteraction: false }),
        ],
        memberOfClubOrGroup: false,
        attendsCommunityActivities: false,
      }));
      expect(result.integrationScore).toBe(0);
    });
  });

  // ── Concerns ──────────────────────────────────────────────────────────

  describe("Concerns", () => {
    it("critical concern for restriction from activities", () => {
      const result = analyseActivities(makeInput({
        activities: [makeActivity()],
        restrictedFromActivities: true,
        restrictionReason: "behaviour sanction",
      }));
      const c = result.concerns.find(c => c.category === "restriction");
      expect(c).toBeDefined();
      expect(c!.severity).toBe("critical");
      expect(c!.description).toContain("behaviour sanction");
    });

    it("critical concern for no activities", () => {
      const result = analyseActivities(makeInput());
      const c = result.concerns.find(c => c.category === "participation");
      expect(c).toBeDefined();
      expect(c!.severity).toBe("critical");
    });

    it("significant concern for no community activities", () => {
      const result = analyseActivities(makeInput({
        activities: [
          makeActivity({ communityBased: false }),
          makeActivity({ communityBased: false }),
          makeActivity({ communityBased: false }),
        ],
      }));
      const c = result.concerns.find(c => c.category === "integration");
      expect(c).toBeDefined();
      expect(c!.severity).toBe("significant");
    });

    it("significant concern for no peer interaction", () => {
      const result = analyseActivities(makeInput({
        activities: [
          makeActivity({ peerInteraction: false }),
          makeActivity({ peerInteraction: false }),
          makeActivity({ peerInteraction: false }),
        ],
      }));
      const c = result.concerns.find(c => c.category === "socialisation");
      expect(c).toBeDefined();
    });

    it("moderate concern for low choice", () => {
      const result = analyseActivities(makeInput({
        activities: [
          makeActivity({ childChose: false }),
          makeActivity({ childChose: false }),
          makeActivity({ childChose: false }),
          makeActivity({ childChose: true }),
        ],
      }));
      const c = result.concerns.find(c => c.category === "choice");
      expect(c).toBeDefined();
    });

    it("moderate concern for hobbies not identified", () => {
      const result = analyseActivities(makeInput({ hobbiesIdentified: false }));
      const c = result.concerns.find(c => c.category === "interests");
      expect(c).toBeDefined();
    });

    it("no concerns for active engaged child", () => {
      const result = analyseActivities(makeInput({
        activities: makeVariedActivities(12),
      }));
      expect(result.concerns).toHaveLength(0);
    });
  });

  // ── Strengths ─────────────────────────────────────────────────────────

  describe("Strengths", () => {
    it("identifies high participation", () => {
      const activities = Array.from({ length: 36 }, () => makeActivity());
      const result = analyseActivities(makeInput({ activities }));
      const s = result.strengths.find(s => s.category === "participation");
      expect(s).toBeDefined();
    });

    it("identifies good variety", () => {
      const result = analyseActivities(makeInput({
        activities: makeVariedActivities(8),
      }));
      const s = result.strengths.find(s => s.category === "variety");
      expect(s).toBeDefined();
    });

    it("identifies community integration", () => {
      const result = analyseActivities(makeInput({
        activities: [
          makeActivity({ communityBased: true }),
          makeActivity({ communityBased: true }),
          makeActivity({ communityBased: true }),
          makeActivity({ communityBased: false }),
        ],
      }));
      const s = result.strengths.find(s => s.category === "integration");
      expect(s).toBeDefined();
    });

    it("identifies achievements", () => {
      const result = analyseActivities(makeInput({
        activities: [
          makeActivity({ achievementNoted: "Won medal" }),
          makeActivity({ achievementNoted: "Grade 2 guitar" }),
        ],
      }));
      const s = result.strengths.find(s => s.category === "achievement");
      expect(s).toBeDefined();
    });

    it("identifies club membership", () => {
      const result = analyseActivities(makeInput({ memberOfClubOrGroup: true }));
      const s = result.strengths.find(s => s.category === "commitment");
      expect(s).toBeDefined();
    });
  });

  // ── Regulatory flags ──────────────────────────────────────────────────

  describe("Regulatory flags", () => {
    it("CHR 2015 Reg 9 met for active child", () => {
      const activities = Array.from({ length: 24 }, (_, i) =>
        makeActivity({ category: i % 2 === 0 ? "sport" : "creative_arts" })
      );
      const result = analyseActivities(makeInput({ activities }));
      const flag = result.regulatoryFlags.find(f => f.regulation === "CHR 2015 Reg 9");
      expect(flag).toBeDefined();
      expect(flag!.status).toBe("met");
    });

    it("CHR 2015 Reg 9 not_met for no activities", () => {
      const result = analyseActivities(makeInput());
      const flag = result.regulatoryFlags.find(f => f.regulation === "CHR 2015 Reg 9");
      expect(flag).toBeDefined();
      expect(flag!.status).toBe("not_met");
    });

    it("CHR 2015 Reg 7 not_met when restricted", () => {
      const result = analyseActivities(makeInput({
        activities: [makeActivity()],
        restrictedFromActivities: true,
      }));
      const flag = result.regulatoryFlags.find(f => f.regulation === "CHR 2015 Reg 7");
      expect(flag).toBeDefined();
      expect(flag!.status).toBe("not_met");
    });

    it("SCCIF met for broad community experiences", () => {
      const result = analyseActivities(makeInput({
        activities: [
          makeActivity({ category: "sport", communityBased: true }),
          makeActivity({ category: "creative_arts", communityBased: true }),
          makeActivity({ category: "social", communityBased: true }),
        ],
      }));
      const flag = result.regulatoryFlags.find(f => f.regulation === "SCCIF");
      expect(flag).toBeDefined();
      expect(flag!.status).toBe("met");
    });
  });

  // ── Recommendations ───────────────────────────────────────────────────

  describe("Recommendations", () => {
    it("urgent when restricted", () => {
      const result = analyseActivities(makeInput({
        activities: [makeActivity()],
        restrictedFromActivities: true,
      }));
      expect(result.recommendations.some(r => r.includes("URGENT"))).toBe(true);
    });

    it("recommends increasing frequency", () => {
      const result = analyseActivities(makeInput({
        activities: [makeActivity(), makeActivity()],
      }));
      expect(result.recommendations.some(r => r.includes("frequency") || r.includes("3 activities"))).toBe(true);
    });

    it("recommends broadening variety", () => {
      const result = analyseActivities(makeInput({
        activities: [
          makeActivity({ category: "sport" }),
          makeActivity({ category: "sport" }),
          makeActivity({ category: "sport" }),
        ],
      }));
      expect(result.recommendations.some(r => r.includes("Broaden") || r.includes("creative"))).toBe(true);
    });

    it("recommends community activities", () => {
      const result = analyseActivities(makeInput({
        activities: [
          makeActivity({ communityBased: false }),
          makeActivity({ communityBased: false }),
          makeActivity({ communityBased: false }),
        ],
      }));
      expect(result.recommendations.some(r => r.includes("community"))).toBe(true);
    });

    it("recommends identifying hobbies", () => {
      const result = analyseActivities(makeInput({ hobbiesIdentified: false }));
      expect(result.recommendations.some(r => r.includes("hobbies"))).toBe(true);
    });

    it("minimal for well-enriched child", () => {
      const result = analyseActivities(makeInput({
        activities: makeVariedActivities(36),
      }));
      expect(result.recommendations.length).toBeLessThanOrEqual(1);
    });
  });

  // ── Summary ───────────────────────────────────────────────────────────

  describe("Summary", () => {
    it("includes child name", () => {
      const result = analyseActivities(makeInput({ childName: "Jordan" }));
      expect(result.summary).toContain("Jordan");
    });

    it("mentions no activities when empty", () => {
      const result = analyseActivities(makeInput());
      expect(result.summary).toContain("No activities");
    });

    it("includes per-week and categories", () => {
      const result = analyseActivities(makeInput({
        activities: makeVariedActivities(12),
      }));
      expect(result.summary).toContain("/wk");
      expect(result.summary).toContain("categories");
    });
  });
});
