import { describe, it, expect } from "vitest";
import { trackOutcomes, type OutcomeObjective, type EvidenceEntry, type ProgressIndicator } from "../outcome-tracker";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeDate(daysAgo: number): string {
  return new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10);
}

function futureDate(daysAhead: number): string {
  return new Date(Date.now() + daysAhead * 86400000).toISOString().slice(0, 10);
}

function makeIndicator(overrides: Partial<ProgressIndicator> = {}): ProgressIndicator {
  return {
    id: `ind_${Math.random().toString(36).slice(2, 8)}`,
    description: "Test indicator",
    measureType: "frequency",
    target: 10,
    current: 5,
    trend: "stable",
    lastUpdated: makeDate(3),
    ...overrides,
  };
}

function makeObjective(overrides: Partial<OutcomeObjective> = {}): OutcomeObjective {
  return {
    id: `obj_${Math.random().toString(36).slice(2, 8)}`,
    title: "Test objective",
    category: "education",
    targetDescription: "Target description",
    startDate: makeDate(60),
    indicators: [makeIndicator()],
    currentStatus: "on_track",
    ...overrides,
  };
}

function makeEvidence(overrides: Partial<EvidenceEntry> = {}): EvidenceEntry {
  return {
    id: `ev_${Math.random().toString(36).slice(2, 8)}`,
    date: makeDate(3),
    objectiveId: "obj_1",
    type: "positive",
    content: "Test evidence",
    source: "daily_log",
    ...overrides,
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Outcome Tracker", () => {
  describe("trackOutcomes", () => {
    it("returns correct structure with no objectives", () => {
      const result = trackOutcomes("child_1", "Test Child", [], []);
      expect(result.childId).toBe("child_1");
      expect(result.childName).toBe("Test Child");
      expect(result.totalObjectives).toBe(0);
      expect(result.overallProgress).toBe(0);
      expect(result.progressGrade).toBe("insufficient_data");
    });

    it("calculates overall progress from objectives", () => {
      const objectives = [
        makeObjective({ id: "obj_1", indicators: [makeIndicator({ target: 10, current: 8 })] }),
        makeObjective({ id: "obj_2", indicators: [makeIndicator({ target: 10, current: 4 })] }),
      ];
      const result = trackOutcomes("c1", "Child", objectives, []);
      // obj_1: 80%, obj_2: 40% → average 60%
      expect(result.overallProgress).toBe(60);
    });

    it("grades excellent for 80%+", () => {
      const objectives = [
        makeObjective({ indicators: [makeIndicator({ target: 10, current: 9 })] }),
      ];
      const result = trackOutcomes("c1", "Child", objectives, []);
      expect(result.progressGrade).toBe("excellent");
    });

    it("grades concerning for under 40%", () => {
      const objectives = [
        makeObjective({ indicators: [makeIndicator({ target: 10, current: 2 })] }),
      ];
      const result = trackOutcomes("c1", "Child", objectives, []);
      expect(result.progressGrade).toBe("concerning");
    });
  });

  // ── Objective analysis ────────────────────────────────────────────────────

  describe("objective analysis", () => {
    it("calculates progress from indicators", () => {
      const obj = makeObjective({
        id: "obj_1",
        indicators: [
          makeIndicator({ target: 10, current: 7 }),
          makeIndicator({ target: 5, current: 5 }),
        ],
      });
      const result = trackOutcomes("c1", "Child", [obj], []);
      // Indicator 1: 70%, Indicator 2: 100% → average 85%
      expect(result.objectives[0].progressPercent).toBe(85);
    });

    it("counts evidence for each objective", () => {
      const obj = makeObjective({ id: "obj_1" });
      const evidence = [
        makeEvidence({ objectiveId: "obj_1" }),
        makeEvidence({ objectiveId: "obj_1" }),
        makeEvidence({ objectiveId: "other" }),
      ];
      const result = trackOutcomes("c1", "Child", [obj], evidence);
      expect(result.objectives[0].evidenceCount).toBe(2);
    });

    it("counts recent positive and negative evidence", () => {
      const obj = makeObjective({ id: "obj_1" });
      const evidence = [
        makeEvidence({ objectiveId: "obj_1", date: makeDate(3), type: "positive" }),
        makeEvidence({ objectiveId: "obj_1", date: makeDate(5), type: "positive" }),
        makeEvidence({ objectiveId: "obj_1", date: makeDate(10), type: "negative" }),
        makeEvidence({ objectiveId: "obj_1", date: makeDate(20), type: "positive" }), // older than 14 days
      ];
      const result = trackOutcomes("c1", "Child", [obj], evidence);
      expect(result.objectives[0].recentPositive).toBe(2);
      expect(result.objectives[0].recentNegative).toBe(1);
    });

    it("calculates days to target", () => {
      const obj = makeObjective({ id: "obj_1", targetDate: futureDate(21) });
      const result = trackOutcomes("c1", "Child", [obj], []);
      expect(result.objectives[0].daysToTarget).toBeCloseTo(21, 0);
    });

    it("marks achieved objectives as 100%", () => {
      const obj = makeObjective({ id: "obj_1", currentStatus: "achieved", indicators: [] });
      const result = trackOutcomes("c1", "Child", [obj], []);
      expect(result.objectives[0].progressPercent).toBe(100);
    });
  });

  // ── Category scores ───────────────────────────────────────────────────────

  describe("category scores", () => {
    it("groups objectives by category", () => {
      const objectives = [
        makeObjective({ category: "education", indicators: [makeIndicator({ target: 10, current: 8 })] }),
        makeObjective({ category: "education", indicators: [makeIndicator({ target: 10, current: 6 })] }),
        makeObjective({ category: "emotional_wellbeing", indicators: [makeIndicator({ target: 10, current: 9 })] }),
      ];
      const result = trackOutcomes("c1", "Child", objectives, []);
      expect(result.categoryScores.length).toBe(2);
      const edu = result.categoryScores.find((c) => c.category === "education");
      expect(edu).toBeDefined();
      expect(edu!.objectiveCount).toBe(2);
    });

    it("calculates category score as average of objective progress", () => {
      const objectives = [
        makeObjective({ category: "education", indicators: [makeIndicator({ target: 10, current: 10 })] }),
        makeObjective({ category: "education", indicators: [makeIndicator({ target: 10, current: 6 })] }),
      ];
      const result = trackOutcomes("c1", "Child", objectives, []);
      const edu = result.categoryScores.find((c) => c.category === "education");
      expect(edu!.score).toBe(80); // (100 + 60) / 2
    });
  });

  // ── Alerts ────────────────────────────────────────────────────────────────

  describe("alerts", () => {
    it("alerts when objective is off track", () => {
      const obj = makeObjective({ id: "obj_1", title: "School goal", currentStatus: "off_track", indicators: [makeIndicator({ target: 10, current: 2 })] });
      const result = trackOutcomes("c1", "Child", [obj], []);
      expect(result.alerts.length).toBeGreaterThan(0);
      expect(result.alerts[0].severity).toBe("high");
      expect(result.alerts[0].objectiveTitle).toBe("School goal");
    });

    it("alerts when target date approaching with low progress", () => {
      const obj = makeObjective({
        id: "obj_1",
        title: "Target approaching",
        targetDate: futureDate(10),
        currentStatus: "at_risk",
        indicators: [makeIndicator({ target: 10, current: 3 })],
      });
      const result = trackOutcomes("c1", "Child", [obj], []);
      const highAlert = result.alerts.find((a) => a.severity === "high");
      expect(highAlert).toBeDefined();
    });

    it("alerts at medium for at-risk objectives", () => {
      const obj = makeObjective({ currentStatus: "at_risk", indicators: [makeIndicator({ target: 10, current: 5 })] });
      const result = trackOutcomes("c1", "Child", [obj], []);
      const medAlert = result.alerts.find((a) => a.severity === "medium");
      expect(medAlert).toBeDefined();
    });
  });

  // ── Celebrations ──────────────────────────────────────────────────────────

  describe("celebrations", () => {
    it("celebrates achieved objectives", () => {
      const obj = makeObjective({ title: "DofE Bronze", currentStatus: "achieved", indicators: [] });
      const result = trackOutcomes("c1", "Child", [obj], []);
      expect(result.celebrations.some((c) => c.includes("DofE Bronze"))).toBe(true);
    });

    it("celebrates near-complete objectives", () => {
      const obj = makeObjective({ title: "Reading goal", indicators: [makeIndicator({ target: 10, current: 9 })] });
      const result = trackOutcomes("c1", "Child", [obj], []);
      expect(result.celebrations.some((c) => c.includes("Reading goal"))).toBe(true);
    });

    it("caps celebrations at 3", () => {
      const objectives = Array.from({ length: 5 }, (_, i) =>
        makeObjective({ title: `Goal ${i}`, currentStatus: "achieved", indicators: [] })
      );
      const result = trackOutcomes("c1", "Child", objectives, []);
      expect(result.celebrations.length).toBeLessThanOrEqual(3);
    });
  });

  // ── Recommendations ───────────────────────────────────────────────────────

  describe("recommendations", () => {
    it("recommends review for off-track objectives", () => {
      const obj = makeObjective({ currentStatus: "off_track", indicators: [makeIndicator({ target: 10, current: 1 })] });
      const result = trackOutcomes("c1", "Child", [obj], []);
      expect(result.recommendations.some((r) => r.includes("review"))).toBe(true);
    });

    it("recommends recording for objectives without evidence", () => {
      const obj = makeObjective({ id: "obj_1" });
      const result = trackOutcomes("c1", "Child", [obj], []); // No evidence
      expect(result.recommendations.some((r) => r.includes("evidence"))).toBe(true);
    });
  });

  // ── Recent evidence ───────────────────────────────────────────────────────

  describe("recent evidence", () => {
    it("returns recent evidence sorted by date", () => {
      const evidence = [
        makeEvidence({ date: makeDate(1), objectiveId: "obj_1" }),
        makeEvidence({ date: makeDate(5), objectiveId: "obj_1" }),
        makeEvidence({ date: makeDate(3), objectiveId: "obj_1" }),
        makeEvidence({ date: makeDate(10), objectiveId: "obj_1" }), // older but still in 7 days... depends
      ];
      const obj = makeObjective({ id: "obj_1" });
      const result = trackOutcomes("c1", "Child", [obj], evidence);
      expect(result.recentEvidence.length).toBeGreaterThan(0);
      // Sorted newest first
      if (result.recentEvidence.length >= 2) {
        expect(result.recentEvidence[0].date >= result.recentEvidence[1].date).toBe(true);
      }
    });

    it("caps recent evidence at 10", () => {
      const evidence = Array.from({ length: 15 }, (_, i) =>
        makeEvidence({ date: makeDate(i % 5), objectiveId: "obj_1" })
      );
      const obj = makeObjective({ id: "obj_1" });
      const result = trackOutcomes("c1", "Child", [obj], evidence);
      expect(result.recentEvidence.length).toBeLessThanOrEqual(10);
    });
  });
});
