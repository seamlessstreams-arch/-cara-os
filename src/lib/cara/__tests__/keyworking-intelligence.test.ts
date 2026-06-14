// ══════════════════════════════════════════════════════════════════════════════
// Tests — Key Working Intelligence Engine
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  analyseKeyworking,
  KeyworkingInput,
  KeyworkSession,
  SessionTopic,
} from "../keyworking-intelligence";

// ── Helpers ─────────────────────────────────────────────────────────────────

const FIXED_NOW = new Date("2026-05-16T12:00:00Z").getTime();

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_NOW);
});

function makeSession(overrides: Partial<KeyworkSession> = {}): KeyworkSession {
  return {
    id: `ks_${Math.random().toString(36).slice(2)}`,
    date: "2026-05-01",
    keyworkerName: "Sarah",
    plannedDuration: 45,
    actualDuration: 40,
    occurred: true,
    topicsCovered: ["wellbeing", "education"],
    childLed: true,
    wishesAndFeelingsRecorded: true,
    actionsAgreed: 2,
    actionsCompleted: 2,
    childEngagement: "high",
    childFeedback: "positive",
    privateTime: true,
    location: "in_home",
    ...overrides,
  };
}

function makeInput(overrides: Partial<KeyworkingInput> = {}): KeyworkingInput {
  return {
    childId: "child_1",
    childName: "Jordan",
    age: 15,
    sessions: [],
    expectedFrequency: "weekly",
    expectedFrequencyPerMonth: 4,
    currentKeyworkerName: "Sarah",
    keyworkerChangesLast12Months: 0,
    keyworkerRelationshipMonths: 8,
    childCanChooseTopics: true,
    childKnowsKeyworker: true,
    keyworkPolicyInPlace: true,
    reg44VisitorMeetsChild: true,
    reg44VisitsCurrent: true,
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════

describe("Key Working Intelligence Engine", () => {

  // ── Basic functionality ─────────────────────────────────────────────────

  describe("Basic functionality", () => {
    it("returns valid assessment structure", () => {
      const result = analyseKeyworking(makeInput());
      expect(result).toHaveProperty("overallScore");
      expect(result).toHaveProperty("overallRating");
      expect(result).toHaveProperty("frequencyScore");
      expect(result).toHaveProperty("qualityScore");
      expect(result).toHaveProperty("relationshipScore");
      expect(result).toHaveProperty("voiceScore");
      expect(result).toHaveProperty("topicCoverage");
      expect(result).toHaveProperty("concerns");
      expect(result).toHaveProperty("strengths");
      expect(result).toHaveProperty("regulatoryFlags");
      expect(result).toHaveProperty("recommendations");
      expect(result).toHaveProperty("summary");
    });

    it("uses childName", () => {
      const result = analyseKeyworking(makeInput({ childName: "Sam" }));
      expect(result.childName).toBe("Sam");
      expect(result.summary).toContain("Sam");
    });

    it("handles no sessions", () => {
      const result = analyseKeyworking(makeInput());
      expect(result.totalSessions).toBe(0);
      expect(result.complianceRate).toBe(0);
    });
  });

  // ── Counting ──────────────────────────────────────────────────────────

  describe("Counting", () => {
    it("counts total, occurred, missed", () => {
      const result = analyseKeyworking(makeInput({
        sessions: [
          makeSession({ occurred: true }),
          makeSession({ occurred: true }),
          makeSession({ occurred: false, actualDuration: 0, cancelledBy: "staff" }),
        ],
      }));
      expect(result.totalSessions).toBe(3);
      expect(result.occurredSessions).toBe(2);
      expect(result.missedSessions).toBe(1);
    });

    it("calculates compliance rate", () => {
      // 4 per month * 3 months = 12 expected, 8 occurred
      const sessions = Array.from({ length: 8 }, () => makeSession());
      const result = analyseKeyworking(makeInput({
        sessions,
        expectedFrequencyPerMonth: 4,
      }));
      expect(result.complianceRate).toBeCloseTo(0.67, 1);
    });
  });

  // ── Quality metrics ───────────────────────────────────────────────────

  describe("Quality metrics", () => {
    it("calculates average duration", () => {
      const result = analyseKeyworking(makeInput({
        sessions: [
          makeSession({ actualDuration: 30 }),
          makeSession({ actualDuration: 50 }),
          makeSession({ actualDuration: 40 }),
        ],
      }));
      expect(result.avgDuration).toBe(40);
    });

    it("calculates child-led rate", () => {
      const result = analyseKeyworking(makeInput({
        sessions: [
          makeSession({ childLed: true }),
          makeSession({ childLed: true }),
          makeSession({ childLed: false }),
        ],
      }));
      expect(result.childLedRate).toBeCloseTo(0.67, 1);
    });

    it("calculates wishes rate", () => {
      const result = analyseKeyworking(makeInput({
        sessions: [
          makeSession({ wishesAndFeelingsRecorded: true }),
          makeSession({ wishesAndFeelingsRecorded: false }),
          makeSession({ wishesAndFeelingsRecorded: true }),
        ],
      }));
      expect(result.wishesRate).toBeCloseTo(0.67, 1);
    });

    it("calculates action completion rate", () => {
      const result = analyseKeyworking(makeInput({
        sessions: [
          makeSession({ actionsAgreed: 3, actionsCompleted: 2 }),
          makeSession({ actionsAgreed: 2, actionsCompleted: 2 }),
        ],
      }));
      expect(result.actionCompletionRate).toBe(0.8); // 4/5
    });
  });

  // ── Topic coverage ────────────────────────────────────────────────────

  describe("Topic coverage", () => {
    it("counts topics across sessions", () => {
      const result = analyseKeyworking(makeInput({
        sessions: [
          makeSession({ topicsCovered: ["wellbeing", "education"] }),
          makeSession({ topicsCovered: ["wellbeing", "health"] }),
          makeSession({ topicsCovered: ["education", "goals"] }),
        ],
      }));
      expect(result.topicCoverage.find(t => t.topic === "wellbeing")?.count).toBe(2);
      expect(result.topicCoverage.find(t => t.topic === "education")?.count).toBe(2);
      expect(result.topicCoverage.find(t => t.topic === "health")?.count).toBe(1);
    });

    it("calculates percentage", () => {
      const result = analyseKeyworking(makeInput({
        sessions: [
          makeSession({ topicsCovered: ["wellbeing"] }),
          makeSession({ topicsCovered: ["wellbeing"] }),
          makeSession({ topicsCovered: ["education"] }),
          makeSession({ topicsCovered: ["education"] }),
        ],
      }));
      const wb = result.topicCoverage.find(t => t.topic === "wellbeing");
      expect(wb!.percentage).toBe(50); // 2/4 sessions
    });
  });

  // ── Frequency scoring ─────────────────────────────────────────────────

  describe("Frequency scoring", () => {
    it("100 for full compliance", () => {
      const sessions = Array.from({ length: 12 }, () => makeSession());
      const result = analyseKeyworking(makeInput({
        sessions,
        expectedFrequencyPerMonth: 4,
      }));
      expect(result.frequencyScore).toBe(100);
    });

    it("low for no sessions", () => {
      const result = analyseKeyworking(makeInput({
        sessions: [],
        expectedFrequencyPerMonth: 4,
      }));
      expect(result.frequencyScore).toBe(20);
    });

    it("proportional for partial compliance", () => {
      const sessions = Array.from({ length: 6 }, () => makeSession());
      const result = analyseKeyworking(makeInput({
        sessions,
        expectedFrequencyPerMonth: 4,
      }));
      expect(result.frequencyScore).toBe(50); // 6/12 = 0.5 → 50
    });
  });

  // ── Relationship scoring ──────────────────────────────────────────────

  describe("Relationship scoring", () => {
    it("high for stable long-term relationship", () => {
      const result = analyseKeyworking(makeInput({
        keyworkerRelationshipMonths: 12,
        keyworkerChangesLast12Months: 0,
        childKnowsKeyworker: true,
        keyworkPolicyInPlace: true,
      }));
      expect(result.relationshipScore).toBe(100);
    });

    it("low for high turnover and new KW", () => {
      const result = analyseKeyworking(makeInput({
        keyworkerRelationshipMonths: 1,
        keyworkerChangesLast12Months: 3,
        childKnowsKeyworker: false,
        keyworkPolicyInPlace: false,
      }));
      expect(result.relationshipScore).toBeLessThan(20);
    });
  });

  // ── Voice scoring ─────────────────────────────────────────────────────

  describe("Voice scoring", () => {
    it("high for child-led with wishes recorded", () => {
      const result = analyseKeyworking(makeInput({
        sessions: [
          makeSession({ childLed: true, wishesAndFeelingsRecorded: true, childFeedback: "positive" }),
          makeSession({ childLed: true, wishesAndFeelingsRecorded: true, childFeedback: "positive" }),
        ],
        childCanChooseTopics: true,
      }));
      expect(result.voiceScore).toBe(100);
    });

    it("low for staff-directed with no wishes", () => {
      const result = analyseKeyworking(makeInput({
        sessions: [
          makeSession({ childLed: false, wishesAndFeelingsRecorded: false, childFeedback: "negative" }),
          makeSession({ childLed: false, wishesAndFeelingsRecorded: false, childFeedback: "negative" }),
        ],
        childCanChooseTopics: false,
      }));
      expect(result.voiceScore).toBeLessThan(10);
    });
  });

  // ── Concerns ──────────────────────────────────────────────────────────

  describe("Concerns", () => {
    it("critical for very low compliance", () => {
      const sessions = Array.from({ length: 3 }, () => makeSession());
      const result = analyseKeyworking(makeInput({
        sessions,
        expectedFrequencyPerMonth: 4, // 12 expected, 3 occurred = 25%
      }));
      const c = result.concerns.find(c => c.category === "frequency");
      expect(c).toBeDefined();
      expect(c!.severity).toBe("critical");
    });

    it("critical for high turnover", () => {
      const result = analyseKeyworking(makeInput({
        keyworkerChangesLast12Months: 3,
      }));
      const c = result.concerns.find(c => c.category === "stability");
      expect(c).toBeDefined();
      expect(c!.severity).toBe("critical");
    });

    it("significant for child refusing sessions", () => {
      const result = analyseKeyworking(makeInput({
        sessions: [
          makeSession({ childEngagement: "refused" }),
          makeSession({ childEngagement: "refused" }),
          makeSession({ childEngagement: "refused" }),
        ],
      }));
      const c = result.concerns.find(c => c.category === "engagement");
      expect(c).toBeDefined();
      expect(c!.severity).toBe("significant");
    });

    it("significant for no wishes recorded", () => {
      const result = analyseKeyworking(makeInput({
        sessions: [
          makeSession({ wishesAndFeelingsRecorded: false }),
          makeSession({ wishesAndFeelingsRecorded: false }),
          makeSession({ wishesAndFeelingsRecorded: false }),
          makeSession({ wishesAndFeelingsRecorded: false }),
        ],
      }));
      const c = result.concerns.find(c => c.category === "wishes_feelings");
      expect(c).toBeDefined();
    });

    it("significant for staff cancelling", () => {
      const result = analyseKeyworking(makeInput({
        sessions: [
          makeSession({ occurred: false, actualDuration: 0, cancelledBy: "staff" }),
          makeSession({ occurred: false, actualDuration: 0, cancelledBy: "staff" }),
          makeSession({ occurred: false, actualDuration: 0, cancelledBy: "staff" }),
        ],
      }));
      const c = result.concerns.find(c => c.category === "commitment");
      expect(c).toBeDefined();
    });

    it("significant for Reg 44 not current", () => {
      const result = analyseKeyworking(makeInput({ reg44VisitsCurrent: false }));
      const c = result.concerns.find(c => c.category === "oversight");
      expect(c).toBeDefined();
    });

    it("no concerns for good practice", () => {
      const sessions = Array.from({ length: 12 }, () => makeSession());
      const result = analyseKeyworking(makeInput({ sessions }));
      expect(result.concerns).toHaveLength(0);
    });
  });

  // ── Strengths ─────────────────────────────────────────────────────────

  describe("Strengths", () => {
    it("identifies consistent delivery", () => {
      const sessions = Array.from({ length: 12 }, () => makeSession());
      const result = analyseKeyworking(makeInput({ sessions }));
      const s = result.strengths.find(s => s.category === "frequency");
      expect(s).toBeDefined();
    });

    it("identifies stable relationship", () => {
      const result = analyseKeyworking(makeInput({
        keyworkerRelationshipMonths: 8,
        keyworkerChangesLast12Months: 0,
      }));
      const s = result.strengths.find(s => s.category === "stability");
      expect(s).toBeDefined();
    });

    it("identifies child-led sessions", () => {
      const sessions = Array.from({ length: 4 }, () => makeSession({ childLed: true }));
      const result = analyseKeyworking(makeInput({ sessions }));
      const s = result.strengths.find(s => s.category === "voice");
      expect(s).toBeDefined();
    });

    it("identifies wishes consistently recorded", () => {
      const sessions = Array.from({ length: 4 }, () => makeSession({ wishesAndFeelingsRecorded: true }));
      const result = analyseKeyworking(makeInput({ sessions }));
      const s = result.strengths.find(s => s.category === "wishes_feelings");
      expect(s).toBeDefined();
    });

    it("identifies Reg 44 oversight", () => {
      const result = analyseKeyworking(makeInput({
        reg44VisitsCurrent: true,
        reg44VisitorMeetsChild: true,
      }));
      const s = result.strengths.find(s => s.category === "oversight");
      expect(s).toBeDefined();
    });
  });

  // ── Regulatory flags ──────────────────────────────────────────────────

  describe("Regulatory flags", () => {
    it("CHR 2015 Reg 5(a) met for good relationship", () => {
      const sessions = Array.from({ length: 8 }, () => makeSession());
      const result = analyseKeyworking(makeInput({ sessions }));
      const flag = result.regulatoryFlags.find(f => f.regulation === "CHR 2015 Reg 5(a)");
      expect(flag).toBeDefined();
      expect(flag!.status).toBe("met");
    });

    it("CHR 2015 Reg 5(a) not_met for very poor compliance", () => {
      const sessions = [makeSession()];
      const result = analyseKeyworking(makeInput({
        sessions,
        expectedFrequencyPerMonth: 4, // 1/12 = 8%
        keyworkerRelationshipMonths: 1,
        childKnowsKeyworker: false,
      }));
      const flag = result.regulatoryFlags.find(f => f.regulation === "CHR 2015 Reg 5(a)");
      expect(flag).toBeDefined();
      expect(flag!.status).toBe("not_met");
    });

    it("SCCIF met for good voice practice", () => {
      const sessions = Array.from({ length: 4 }, () => makeSession({ wishesAndFeelingsRecorded: true }));
      const result = analyseKeyworking(makeInput({
        sessions,
        childCanChooseTopics: true,
      }));
      const flag = result.regulatoryFlags.find(f => f.regulation === "SCCIF");
      expect(flag).toBeDefined();
      expect(flag!.status).toBe("met");
    });

    it("Reg 44 met when current", () => {
      const result = analyseKeyworking(makeInput({ reg44VisitsCurrent: true }));
      const flag = result.regulatoryFlags.find(f => f.regulation === "Reg 44");
      expect(flag).toBeDefined();
      expect(flag!.status).toBe("met");
    });

    it("Reg 44 not_met when not current", () => {
      const result = analyseKeyworking(makeInput({ reg44VisitsCurrent: false }));
      const flag = result.regulatoryFlags.find(f => f.regulation === "Reg 44");
      expect(flag).toBeDefined();
      expect(flag!.status).toBe("not_met");
    });

    it("CHR 2015 Reg 10 met when wellbeing covered", () => {
      const result = analyseKeyworking(makeInput({
        sessions: [makeSession({ topicsCovered: ["wellbeing", "education"] })],
      }));
      const flag = result.regulatoryFlags.find(f => f.regulation === "CHR 2015 Reg 10");
      expect(flag).toBeDefined();
      expect(flag!.status).toBe("met");
    });
  });

  // ── Recommendations ───────────────────────────────────────────────────

  describe("Recommendations", () => {
    it("recommends increasing frequency", () => {
      const sessions = Array.from({ length: 6 }, () => makeSession());
      const result = analyseKeyworking(makeInput({
        sessions,
        expectedFrequencyPerMonth: 4, // 6/12 = 50%
      }));
      expect(result.recommendations.some(r => r.includes("frequency"))).toBe(true);
    });

    it("recommends child-led sessions", () => {
      const sessions = Array.from({ length: 4 }, () => makeSession({ childLed: false }));
      const result = analyseKeyworking(makeInput({ sessions }));
      expect(result.recommendations.some(r => r.includes("child to lead"))).toBe(true);
    });

    it("recommends wishes recording", () => {
      const sessions = Array.from({ length: 4 }, () => makeSession({ wishesAndFeelingsRecorded: false }));
      const result = analyseKeyworking(makeInput({ sessions }));
      expect(result.recommendations.some(r => r.includes("wishes and feelings"))).toBe(true);
    });

    it("recommends stability when high turnover", () => {
      const result = analyseKeyworking(makeInput({ keyworkerChangesLast12Months: 3 }));
      expect(result.recommendations.some(r => r.includes("stability"))).toBe(true);
    });

    it("recommends Reg 44 when not current", () => {
      const result = analyseKeyworking(makeInput({ reg44VisitsCurrent: false }));
      expect(result.recommendations.some(r => r.includes("Regulation 44"))).toBe(true);
    });

    it("minimal recommendations for good practice", () => {
      const sessions = Array.from({ length: 12 }, () => makeSession());
      const result = analyseKeyworking(makeInput({ sessions }));
      expect(result.recommendations.length).toBeLessThanOrEqual(1);
    });
  });

  // ── Summary ───────────────────────────────────────────────────────────

  describe("Summary", () => {
    it("includes child name", () => {
      const result = analyseKeyworking(makeInput({ childName: "Jordan" }));
      expect(result.summary).toContain("Jordan");
    });

    it("mentions compliance status", () => {
      const sessions = Array.from({ length: 12 }, () => makeSession());
      const result = analyseKeyworking(makeInput({ sessions }));
      expect(result.summary).toContain("consistently delivered");
    });

    it("mentions child-led when applicable", () => {
      const sessions = Array.from({ length: 4 }, () => makeSession({ childLed: true }));
      const result = analyseKeyworking(makeInput({ sessions }));
      expect(result.summary).toContain("child-led");
    });
  });
});
