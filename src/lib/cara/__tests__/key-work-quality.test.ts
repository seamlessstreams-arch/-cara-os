import { describe, it, expect } from "vitest";
import {
  analyseKeyWork,
  type KeyWorkSession,
  type KeyWorkConfig,
} from "../key-work-quality";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeDate(daysAgo: number): string {
  return new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10);
}

function makeSession(overrides: Partial<KeyWorkSession> = {}): KeyWorkSession {
  return {
    id: `kw_${Math.random().toString(36).slice(2, 8)}`,
    childId: "child_1",
    childName: "Jordan P",
    date: makeDate(3),
    staffId: "staff_sarah",
    staffName: "Sarah T",
    durationMinutes: 30,
    topics: ["school", "feelings"],
    linkedObjectiveIds: ["obj_1"],
    hasChildVoice: true,
    childEngagement: "high",
    actionsSet: 2,
    actionsCompleted: 1,
    previousActionsTotal: 2,
    ...overrides,
  };
}

function makeConfig(overrides: Partial<KeyWorkConfig> = {}): KeyWorkConfig {
  return {
    childId: "child_1",
    childName: "Jordan P",
    keyWorker: "staff_sarah",
    keyWorkerName: "Sarah T",
    frequencyDays: 7,
    carePlanObjectiveIds: ["obj_1", "obj_2", "obj_3"],
    carePlanObjectiveTitles: ["School attendance", "Emotional regulation", "Independence"],
    ...overrides,
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Key Work Quality Analyser", () => {
  describe("basic structure", () => {
    it("returns correct structure with no data", () => {
      const result = analyseKeyWork([], [], "home_oak", 28);
      expect(result.homeId).toBe("home_oak");
      expect(result.windowDays).toBe(28);
      expect(result.totalSessions).toBe(0);
      expect(result.childrenCovered).toBe(0);
      expect(result.childrenTotal).toBe(0);
      expect(result.overallCompliancePercent).toBeNull();
      expect(result.regulatoryStatus.compliant).toBe(false);
    });

    it("counts total sessions", () => {
      const sessions = [makeSession(), makeSession(), makeSession()];
      const result = analyseKeyWork(sessions, [makeConfig()], "home_oak", 28);
      expect(result.totalSessions).toBe(3);
    });
  });

  // ── Per-child analysis ────────────────────────────────────────────────────

  describe("child analysis", () => {
    it("tracks last session date", () => {
      const sessions = [
        makeSession({ date: makeDate(2) }),
        makeSession({ date: makeDate(9) }),
      ];
      const result = analyseKeyWork(sessions, [makeConfig()], "home_oak", 28);
      expect(result.childAnalyses[0].lastSessionDate).toBe(makeDate(2));
      expect(result.childAnalyses[0].daysSinceLastSession).toBe(2);
    });

    it("marks overdue when exceeds frequency", () => {
      const sessions = [makeSession({ date: makeDate(10) })]; // 10 days ago, expected every 7
      const result = analyseKeyWork(sessions, [makeConfig({ frequencyDays: 7 })], "home_oak", 28);
      expect(result.childAnalyses[0].isOverdue).toBe(true);
    });

    it("not overdue when within frequency", () => {
      const sessions = [makeSession({ date: makeDate(5) })]; // 5 days ago, expected every 7
      const result = analyseKeyWork(sessions, [makeConfig({ frequencyDays: 7 })], "home_oak", 28);
      expect(result.childAnalyses[0].isOverdue).toBe(false);
    });

    it("calculates average duration", () => {
      const sessions = [
        makeSession({ durationMinutes: 20 }),
        makeSession({ durationMinutes: 40 }),
      ];
      const result = analyseKeyWork(sessions, [makeConfig()], "home_oak", 28);
      expect(result.childAnalyses[0].averageDuration).toBe(30);
    });

    it("calculates child voice rate", () => {
      const sessions = [
        makeSession({ hasChildVoice: true }),
        makeSession({ hasChildVoice: true }),
        makeSession({ hasChildVoice: false }),
      ];
      const result = analyseKeyWork(sessions, [makeConfig()], "home_oak", 28);
      expect(result.childAnalyses[0].childVoiceRate).toBe(67);
    });

    it("tracks engagement profile", () => {
      const sessions = [
        makeSession({ childEngagement: "high" }),
        makeSession({ childEngagement: "high" }),
        makeSession({ childEngagement: "low" }),
        makeSession({ childEngagement: "refused" }),
      ];
      const result = analyseKeyWork(sessions, [makeConfig()], "home_oak", 28);
      expect(result.childAnalyses[0].engagementProfile.high).toBe(2);
      expect(result.childAnalyses[0].engagementProfile.low).toBe(1);
      expect(result.childAnalyses[0].engagementProfile.refused).toBe(1);
    });

    it("calculates objective coverage", () => {
      const sessions = [
        makeSession({ linkedObjectiveIds: ["obj_1"] }),
        makeSession({ linkedObjectiveIds: ["obj_2"] }),
      ];
      const config = makeConfig({ carePlanObjectiveIds: ["obj_1", "obj_2", "obj_3"], carePlanObjectiveTitles: ["A", "B", "C"] });
      const result = analyseKeyWork(sessions, [config], "home_oak", 28);
      expect(result.childAnalyses[0].objectiveCoveragePercent).toBe(67); // 2/3
      expect(result.childAnalyses[0].objectivesNotCovered).toContain("C");
    });

    it("calculates action completion rate", () => {
      const sessions = [
        makeSession({ actionsCompleted: 2, previousActionsTotal: 3 }),
        makeSession({ actionsCompleted: 1, previousActionsTotal: 2 }),
      ];
      const result = analyseKeyWork(sessions, [makeConfig()], "home_oak", 28);
      expect(result.childAnalyses[0].actionCompletionRate).toBe(60); // 3/5
    });

    it("calculates primary key worker percentage", () => {
      const sessions = [
        makeSession({ staffId: "staff_sarah" }),
        makeSession({ staffId: "staff_sarah" }),
        makeSession({ staffId: "staff_mike" }),
      ];
      const config = makeConfig({ keyWorker: "staff_sarah" });
      const result = analyseKeyWork(sessions, [config], "home_oak", 28);
      expect(result.childAnalyses[0].primaryKeyWorkerPercent).toBe(67);
    });
  });

  // ── Frequency compliance ──────────────────────────────────────────────────

  describe("frequency compliance", () => {
    it("compliant when enough sessions in window", () => {
      // 28 days, expected every 7 = 4 sessions expected
      const sessions = Array.from({ length: 4 }, (_, i) => makeSession({ date: makeDate(i * 7) }));
      const result = analyseKeyWork(sessions, [makeConfig({ frequencyDays: 7 })], "home_oak", 28);
      expect(result.childAnalyses[0].frequencyCompliant).toBe(true);
    });

    it("non-compliant when insufficient sessions", () => {
      // 28 days, expected every 7 = 4 expected, only 2 delivered
      const sessions = [makeSession({ date: makeDate(3) }), makeSession({ date: makeDate(14) })];
      const result = analyseKeyWork(sessions, [makeConfig({ frequencyDays: 7 })], "home_oak", 28);
      expect(result.childAnalyses[0].frequencyCompliant).toBe(false);
    });

    it("overall compliance reflects all children", () => {
      const sessions = [
        makeSession({ childId: "c1", date: makeDate(3) }),
        makeSession({ childId: "c1", date: makeDate(10) }),
        makeSession({ childId: "c1", date: makeDate(17) }),
        makeSession({ childId: "c1", date: makeDate(24) }),
        // c2 has no sessions
      ];
      const configs = [
        makeConfig({ childId: "c1", childName: "Jordan" }),
        makeConfig({ childId: "c2", childName: "Sam" }),
      ];
      const result = analyseKeyWork(sessions, configs, "home_oak", 28);
      expect(result.overallCompliancePercent).toBe(50); // 1/2 compliant
    });
  });

  // ── Alerts ────────────────────────────────────────────────────────────────

  describe("alerts", () => {
    it("critical alert for children with no sessions", () => {
      const configs = [makeConfig({ childId: "c1", childName: "Jordan" })];
      const result = analyseKeyWork([], configs, "home_oak", 28);
      const critical = result.alerts.find((a) => a.severity === "critical");
      expect(critical).toBeDefined();
      expect(critical!.regulation).toContain("Reg 14");
    });

    it("high alert for significantly overdue (>2x frequency)", () => {
      const sessions = [makeSession({ date: makeDate(20) })]; // 20 days ago, expected every 7
      const config = makeConfig({ frequencyDays: 7 });
      const result = analyseKeyWork(sessions, [config], "home_oak", 28);
      const high = result.alerts.find((a) => a.severity === "high" && a.category === "frequency");
      expect(high).toBeDefined();
    });

    it("medium alert for low child voice (<50%)", () => {
      const sessions = [
        makeSession({ hasChildVoice: false }),
        makeSession({ hasChildVoice: false }),
        makeSession({ hasChildVoice: true }),
      ];
      const result = analyseKeyWork(sessions, [makeConfig()], "home_oak", 28);
      const voiceAlert = result.alerts.find((a) => a.category === "voice");
      expect(voiceAlert).toBeDefined();
      expect(voiceAlert!.regulation).toContain("Reg 7");
    });

    it("medium alert for low objective coverage (<60%)", () => {
      const sessions = [
        makeSession({ linkedObjectiveIds: ["obj_1"] }),
        makeSession({ linkedObjectiveIds: ["obj_1"] }),
      ];
      const config = makeConfig({
        carePlanObjectiveIds: ["obj_1", "obj_2", "obj_3", "obj_4"],
        carePlanObjectiveTitles: ["A", "B", "C", "D"],
      });
      const result = analyseKeyWork(sessions, [config], "home_oak", 28);
      const covAlert = result.alerts.find((a) => a.category === "coverage");
      expect(covAlert).toBeDefined();
    });

    it("medium alert for low engagement", () => {
      const sessions = [
        makeSession({ childEngagement: "low" }),
        makeSession({ childEngagement: "low" }),
        makeSession({ childEngagement: "low" }),
        makeSession({ childEngagement: "moderate" }),
      ];
      const result = analyseKeyWork(sessions, [makeConfig()], "home_oak", 28);
      const engAlert = result.alerts.find((a) => a.category === "engagement");
      expect(engAlert).toBeDefined();
    });

    it("no voice alert when rate is good", () => {
      const sessions = [
        makeSession({ hasChildVoice: true }),
        makeSession({ hasChildVoice: true }),
      ];
      const result = analyseKeyWork(sessions, [makeConfig()], "home_oak", 28);
      const voiceAlert = result.alerts.find((a) => a.category === "voice");
      expect(voiceAlert).toBeUndefined();
    });
  });

  // ── Team metrics ──────────────────────────────────────────────────────────

  describe("team metrics", () => {
    it("calculates average session duration across team", () => {
      const sessions = [
        makeSession({ childId: "c1", durationMinutes: 25 }),
        makeSession({ childId: "c2", durationMinutes: 35 }),
      ];
      const configs = [makeConfig({ childId: "c1" }), makeConfig({ childId: "c2" })];
      const result = analyseKeyWork(sessions, configs, "home_oak", 28);
      expect(result.teamMetrics.averageSessionDuration).toBe(30);
    });

    it("calculates team-wide child voice rate", () => {
      const sessions = [
        makeSession({ hasChildVoice: true }),
        makeSession({ hasChildVoice: true }),
        makeSession({ hasChildVoice: false }),
        makeSession({ hasChildVoice: true }),
      ];
      const result = analyseKeyWork(sessions, [makeConfig()], "home_oak", 28);
      expect(result.teamMetrics.childVoiceRate).toBe(75);
    });

    it("calculates team action completion rate", () => {
      const sessions = [
        makeSession({ actionsCompleted: 2, previousActionsTotal: 3 }),
        makeSession({ actionsCompleted: 3, previousActionsTotal: 3 }),
      ];
      const result = analyseKeyWork(sessions, [makeConfig()], "home_oak", 28);
      expect(result.teamMetrics.actionCompletionRate).toBe(83); // 5/6
    });
  });

  // ── Regulatory status ─────────────────────────────────────────────────────

  describe("regulatory status", () => {
    it("compliant when all children covered adequately", () => {
      const sessions = Array.from({ length: 4 }, (_, i) =>
        makeSession({ date: makeDate(i * 7), linkedObjectiveIds: ["obj_1", "obj_2", "obj_3"] })
      );
      const result = analyseKeyWork(sessions, [makeConfig()], "home_oak", 28);
      expect(result.regulatoryStatus.compliant).toBe(true);
    });

    it("non-compliant when overdue", () => {
      const sessions = [makeSession({ date: makeDate(20) })];
      const result = analyseKeyWork(sessions, [makeConfig({ frequencyDays: 7 })], "home_oak", 28);
      expect(result.regulatoryStatus.compliant).toBe(false);
    });

    it("records strengths", () => {
      const sessions = Array.from({ length: 4 }, (_, i) =>
        makeSession({ date: makeDate(i * 7), hasChildVoice: true, linkedObjectiveIds: ["obj_1", "obj_2", "obj_3"] })
      );
      const result = analyseKeyWork(sessions, [makeConfig()], "home_oak", 28);
      expect(result.regulatoryStatus.strengths.length).toBeGreaterThan(0);
    });
  });
});
