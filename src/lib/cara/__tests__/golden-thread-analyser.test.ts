import { describe, it, expect } from "vitest";
import { analyseGoldenThread, type GoldenThreadInput, type ThreadRecord, type CarePlanObjective, type ChildView } from "../golden-thread-analyser";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeRecord(overrides: Partial<ThreadRecord> = {}): ThreadRecord {
  return {
    id: `rec_${Math.random().toString(36).slice(2, 8)}`,
    date: "2026-05-10",
    content: "Test record content",
    hasChildVoice: false,
    linksToCarePlan: false,
    ...overrides,
  };
}

function makeObjective(overrides: Partial<CarePlanObjective> = {}): CarePlanObjective {
  return {
    id: `obj_${Math.random().toString(36).slice(2, 8)}`,
    title: "Test objective",
    category: "emotional",
    basedOnChildView: false,
    status: "active",
    evidenceCount: 0,
    ...overrides,
  };
}

function makeView(overrides: Partial<ChildView> = {}): ChildView {
  return {
    id: `view_${Math.random().toString(36).slice(2, 8)}`,
    date: "2026-05-10",
    content: "I want to do more cooking",
    category: "wishes",
    capturedIn: "key_work",
    linkedToCarePlan: false,
    ...overrides,
  };
}

function makeInput(overrides: Partial<GoldenThreadInput> = {}): GoldenThreadInput {
  return {
    childId: "child_test",
    childName: "Test Child",
    dailyLogs: [],
    keyWorkSessions: [],
    carePlanObjectives: [],
    reviewRecords: [],
    incidentRecords: [],
    childViews: [],
    analysisWindowDays: 28,
    ...overrides,
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Golden Thread Analyser", () => {
  describe("analyseGoldenThread", () => {
    it("returns correct structure with empty input", () => {
      const result = analyseGoldenThread(makeInput());
      expect(result.childId).toBe("child_test");
      expect(result.childName).toBe("Test Child");
      expect(result.windowDays).toBe(28);
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(result.dimensions).toHaveLength(4);
      expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.grade);
    });

    it("scores high when all threads are strong", () => {
      const objectives = [
        makeObjective({ id: "obj_1", basedOnChildView: true, evidenceCount: 5 }),
        makeObjective({ id: "obj_2", basedOnChildView: true, evidenceCount: 3 }),
      ];

      const views = [
        makeView({ linkedToCarePlan: true, linkedObjectiveId: "obj_1" }),
        makeView({ linkedToCarePlan: true, linkedObjectiveId: "obj_2" }),
      ];

      const dailyLogs = Array.from({ length: 10 }, () =>
        makeRecord({ hasChildVoice: true, linksToCarePlan: true })
      );

      const keyWorkSessions = Array.from({ length: 4 }, () =>
        makeRecord({ hasChildVoice: true, linksToCarePlan: true })
      );

      const reviewRecords = [
        makeRecord({ hasChildVoice: true, linksToCarePlan: true }),
      ];

      const result = analyseGoldenThread(makeInput({
        dailyLogs,
        keyWorkSessions,
        carePlanObjectives: objectives,
        childViews: views,
        reviewRecords,
      }));

      expect(result.overallScore).toBeGreaterThanOrEqual(75);
      expect(["outstanding", "good"]).toContain(result.grade);
    });

    it("scores low when threads are weak", () => {
      const dailyLogs = Array.from({ length: 10 }, () =>
        makeRecord({ hasChildVoice: false, linksToCarePlan: false })
      );

      const objectives = [
        makeObjective({ basedOnChildView: false, evidenceCount: 0 }),
        makeObjective({ basedOnChildView: false, evidenceCount: 0 }),
      ];

      const result = analyseGoldenThread(makeInput({
        dailyLogs,
        carePlanObjectives: objectives,
      }));

      expect(result.overallScore).toBeLessThan(50);
      expect(result.gaps.length).toBeGreaterThan(0);
    });
  });

  // ── Child voice dimension ─────────────────────────────────────────────────

  describe("child voice capture", () => {
    it("scores high when majority of records have voice", () => {
      const logs = Array.from({ length: 10 }, () => makeRecord({ hasChildVoice: true }));
      const result = analyseGoldenThread(makeInput({ dailyLogs: logs }));
      const voiceDim = result.dimensions.find((d) => d.name === "Child Voice Capture");
      expect(voiceDim!.score).toBeGreaterThanOrEqual(75);
    });

    it("flags gap when voice capture is low", () => {
      const logs = Array.from({ length: 10 }, () => makeRecord({ hasChildVoice: false }));
      const result = analyseGoldenThread(makeInput({ dailyLogs: logs }));
      const gap = result.gaps.find((g) => g.type === "voice_missing");
      expect(gap).toBeDefined();
      expect(gap!.severity).toBe("high");
    });

    it("reports child voice percentage in stats", () => {
      const logs = [
        makeRecord({ hasChildVoice: true }),
        makeRecord({ hasChildVoice: true }),
        makeRecord({ hasChildVoice: false }),
        makeRecord({ hasChildVoice: false }),
      ];
      const result = analyseGoldenThread(makeInput({ dailyLogs: logs }));
      expect(result.stats.childVoicePercent).toBe(50);
      expect(result.stats.recordsWithChildVoice).toBe(2);
    });
  });

  // ── Voice to care plan ────────────────────────────────────────────────────

  describe("voice → care plan link", () => {
    it("scores high when views are linked to objectives", () => {
      const views = [
        makeView({ linkedToCarePlan: true, linkedObjectiveId: "obj_1" }),
        makeView({ linkedToCarePlan: true, linkedObjectiveId: "obj_2" }),
      ];
      const objectives = [
        makeObjective({ id: "obj_1", basedOnChildView: true }),
        makeObjective({ id: "obj_2", basedOnChildView: true }),
      ];
      const result = analyseGoldenThread(makeInput({ childViews: views, carePlanObjectives: objectives }));
      const dim = result.dimensions.find((d) => d.name === "Voice → Care Plan");
      expect(dim!.score).toBeGreaterThanOrEqual(75);
    });

    it("creates thread connections for linked views", () => {
      const views = [makeView({ linkedToCarePlan: true, linkedObjectiveId: "obj_1" })];
      const objectives = [makeObjective({ id: "obj_1", title: "Support cooking skills" })];
      const result = analyseGoldenThread(makeInput({ childViews: views, carePlanObjectives: objectives }));
      expect(result.threadConnections.length).toBe(1);
      expect(result.threadConnections[0].toSummary).toContain("cooking");
    });

    it("flags gap when objectives not based on views", () => {
      const objectives = [
        makeObjective({ basedOnChildView: false }),
        makeObjective({ basedOnChildView: false }),
      ];
      const result = analyseGoldenThread(makeInput({ carePlanObjectives: objectives }));
      const gap = result.gaps.find((g) => g.type === "plan_unlinked");
      expect(gap).toBeDefined();
    });
  });

  // ── Care plan to practice ─────────────────────────────────────────────────

  describe("care plan → practice", () => {
    it("scores high when objectives are well-evidenced", () => {
      const objectives = [
        makeObjective({ evidenceCount: 5 }),
        makeObjective({ evidenceCount: 3 }),
      ];
      const logs = Array.from({ length: 8 }, () => makeRecord({ linksToCarePlan: true }));
      const result = analyseGoldenThread(makeInput({ carePlanObjectives: objectives, dailyLogs: logs }));
      const dim = result.dimensions.find((d) => d.name === "Care Plan → Practice");
      expect(dim!.score).toBeGreaterThanOrEqual(60);
    });

    it("flags practice drift when objectives have no evidence", () => {
      const objectives = [
        makeObjective({ evidenceCount: 0 }),
        makeObjective({ evidenceCount: 0 }),
      ];
      const logs = Array.from({ length: 5 }, () => makeRecord({ linksToCarePlan: false }));
      const result = analyseGoldenThread(makeInput({ carePlanObjectives: objectives, dailyLogs: logs }));
      const gap = result.gaps.find((g) => g.type === "practice_drift");
      expect(gap).toBeDefined();
      expect(gap!.severity).toBe("high");
    });

    it("reports care plan coverage in stats", () => {
      const objectives = [
        makeObjective({ evidenceCount: 3 }),
        makeObjective({ evidenceCount: 0 }),
        makeObjective({ evidenceCount: 1 }),
      ];
      const result = analyseGoldenThread(makeInput({ carePlanObjectives: objectives }));
      expect(result.stats.carePlanCoverage).toBe(67); // 2/3
    });
  });

  // ── Review integration ────────────────────────────────────────────────────

  describe("review integration", () => {
    it("scores high when reviews have voice and plan links", () => {
      const reviews = [
        makeRecord({ hasChildVoice: true, linksToCarePlan: true }),
      ];
      const result = analyseGoldenThread(makeInput({ reviewRecords: reviews }));
      const dim = result.dimensions.find((d) => d.name === "Review Integration");
      expect(dim!.score).toBeGreaterThanOrEqual(80);
    });

    it("flags gap when no reviews present", () => {
      const result = analyseGoldenThread(makeInput({ reviewRecords: [] }));
      const gap = result.gaps.find((g) => g.type === "review_gap");
      expect(gap).toBeDefined();
    });
  });

  // ── Grading ───────────────────────────────────────────────────────────────

  describe("grading", () => {
    it("outstanding for 80+", () => {
      const result = analyseGoldenThread(makeInput({
        dailyLogs: Array.from({ length: 10 }, () => makeRecord({ hasChildVoice: true, linksToCarePlan: true })),
        keyWorkSessions: Array.from({ length: 4 }, () => makeRecord({ hasChildVoice: true, linksToCarePlan: true })),
        carePlanObjectives: [makeObjective({ basedOnChildView: true, evidenceCount: 5 })],
        childViews: [makeView({ linkedToCarePlan: true, linkedObjectiveId: undefined })],
        reviewRecords: [makeRecord({ hasChildVoice: true, linksToCarePlan: true })],
      }));
      if (result.overallScore >= 80) expect(result.grade).toBe("outstanding");
    });

    it("inadequate for under 40", () => {
      const result = analyseGoldenThread(makeInput({
        dailyLogs: Array.from({ length: 10 }, () => makeRecord()),
        carePlanObjectives: [makeObjective(), makeObjective()],
      }));
      if (result.overallScore < 40) expect(result.grade).toBe("inadequate");
    });
  });

  // ── Strengths and recommendations ─────────────────────────────────────────

  describe("strengths and recommendations", () => {
    it("identifies strengths when thread is strong", () => {
      const result = analyseGoldenThread(makeInput({
        keyWorkSessions: Array.from({ length: 5 }, () => makeRecord({ hasChildVoice: true })),
        dailyLogs: Array.from({ length: 5 }, () => makeRecord({ hasChildVoice: true })),
      }));
      expect(result.strengths.length).toBeGreaterThan(0);
    });

    it("capped at 4 recommendations", () => {
      const result = analyseGoldenThread(makeInput({
        dailyLogs: Array.from({ length: 10 }, () => makeRecord()),
        carePlanObjectives: [makeObjective(), makeObjective()],
      }));
      expect(result.recommendations.length).toBeLessThanOrEqual(4);
    });
  });
});
