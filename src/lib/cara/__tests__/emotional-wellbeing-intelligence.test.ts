// ══════════════════════════════════════════════════════════════════════════════
// Tests — Emotional Wellbeing Intelligence Engine
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  analyseEmotionalWellbeing,
  EmotionalWellbeingInput,
  SDQScore,
  TherapeuticInput,
  SelfHarmIncident,
  MoodRecord,
} from "../emotional-wellbeing-intelligence";

// ── Helpers ─────────────────────────────────────────────────────────────────

const FIXED_NOW = new Date("2026-05-16T12:00:00Z").getTime();

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_NOW);
});

function makeSDQ(overrides: Partial<SDQScore> = {}): SDQScore {
  return {
    date: "2026-04-01",
    totalDifficulties: 10,
    band: "normal",
    emotionalSymptoms: 2,
    conductProblems: 2,
    hyperactivity: 3,
    peerProblems: 2,
    prosocial: 8,
    ...overrides,
  };
}

function makeTherapy(overrides: Partial<TherapeuticInput> = {}): TherapeuticInput {
  return {
    type: "counselling",
    provider: "Local CAMHS",
    frequency: "weekly",
    sessionsAttended: 8,
    sessionsMissed: 1,
    startDate: "2026-02-01",
    active: true,
    childEngaged: true,
    ...overrides,
  };
}

function makeInput(overrides: Partial<EmotionalWellbeingInput> = {}): EmotionalWellbeingInput {
  return {
    childId: "child_1",
    childName: "Jordan",
    age: 15,
    sdqScores: [makeSDQ()],
    therapeuticInputs: [],
    selfHarmIncidents: [],
    moodRecords: [
      { date: "2026-05-01", level: 4 },
      { date: "2026-05-03", level: 4 },
      { date: "2026-05-05", level: 3 },
      { date: "2026-05-07", level: 4 },
      { date: "2026-05-09", level: 4 },
      { date: "2026-05-11", level: 4 },
      { date: "2026-05-13", level: 3 },
    ],
    mentalHealthReferralMade: false,
    waitingForService: false,
    hasSafetyPlan: false,
    safetyPlanReviewed: false,
    regulatorySDQCompleted: true,
    emotionalHealthDiscussedInKeywork: true,
    staffTrainedInMentalHealth: true,
    childKnowsHowToGetHelp: true,
    positiveRelationshipsPresent: true,
    protectiveFactors: ["positive staff relationships", "engaged in education", "attends football"],
    riskFactors: [],
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════

describe("Emotional Wellbeing Intelligence Engine", () => {

  // ── Basic functionality ─────────────────────────────────────────────────

  describe("Basic functionality", () => {
    it("returns valid assessment structure", () => {
      const result = analyseEmotionalWellbeing(makeInput());
      expect(result).toHaveProperty("overallScore");
      expect(result).toHaveProperty("overallRating");
      expect(result).toHaveProperty("sdqScore");
      expect(result).toHaveProperty("therapeuticScore");
      expect(result).toHaveProperty("safetyScore");
      expect(result).toHaveProperty("supportScore");
      expect(result).toHaveProperty("sdqTrend");
      expect(result).toHaveProperty("moodTrend");
      expect(result).toHaveProperty("selfHarmRiskLevel");
      expect(result).toHaveProperty("concerns");
      expect(result).toHaveProperty("strengths");
      expect(result).toHaveProperty("regulatoryFlags");
      expect(result).toHaveProperty("recommendations");
      expect(result).toHaveProperty("summary");
    });

    it("uses childName", () => {
      const result = analyseEmotionalWellbeing(makeInput({ childName: "Sam" }));
      expect(result.childName).toBe("Sam");
      expect(result.summary).toContain("Sam");
    });
  });

  // ── SDQ analysis ──────────────────────────────────────────────────────

  describe("SDQ analysis", () => {
    it("returns latest SDQ", () => {
      const result = analyseEmotionalWellbeing(makeInput({
        sdqScores: [
          makeSDQ({ date: "2025-10-01", totalDifficulties: 15 }),
          makeSDQ({ date: "2026-04-01", totalDifficulties: 10 }),
        ],
      }));
      expect(result.latestSDQ!.totalDifficulties).toBe(10);
    });

    it("improving trend when score decreases by 3+", () => {
      const result = analyseEmotionalWellbeing(makeInput({
        sdqScores: [
          makeSDQ({ date: "2025-10-01", totalDifficulties: 18 }),
          makeSDQ({ date: "2026-04-01", totalDifficulties: 12 }),
        ],
      }));
      expect(result.sdqTrend).toBe("improving");
    });

    it("worsening trend when score increases by 3+", () => {
      const result = analyseEmotionalWellbeing(makeInput({
        sdqScores: [
          makeSDQ({ date: "2025-10-01", totalDifficulties: 12 }),
          makeSDQ({ date: "2026-04-01", totalDifficulties: 18, band: "borderline" }),
        ],
      }));
      expect(result.sdqTrend).toBe("worsening");
    });

    it("stable trend for small changes", () => {
      const result = analyseEmotionalWellbeing(makeInput({
        sdqScores: [
          makeSDQ({ date: "2025-10-01", totalDifficulties: 12 }),
          makeSDQ({ date: "2026-04-01", totalDifficulties: 13 }),
        ],
      }));
      expect(result.sdqTrend).toBe("stable");
    });

    it("insufficient data for single SDQ", () => {
      const result = analyseEmotionalWellbeing(makeInput({
        sdqScores: [makeSDQ()],
      }));
      expect(result.sdqTrend).toBe("insufficient_data");
    });
  });

  // ── Mood analysis ─────────────────────────────────────────────────────

  describe("Mood analysis", () => {
    it("calculates average mood", () => {
      const result = analyseEmotionalWellbeing(makeInput({
        moodRecords: [
          { date: "2026-05-01", level: 3 },
          { date: "2026-05-02", level: 4 },
          { date: "2026-05-03", level: 5 },
          { date: "2026-05-04", level: 4 },
          { date: "2026-05-05", level: 4 },
        ],
      }));
      expect(result.averageMood).toBe(4);
    });

    it("improving mood trend", () => {
      const result = analyseEmotionalWellbeing(makeInput({
        moodRecords: [
          { date: "2026-04-01", level: 2 },
          { date: "2026-04-05", level: 2 },
          { date: "2026-04-10", level: 3 },
          { date: "2026-04-15", level: 3 },
          { date: "2026-04-20", level: 4 },
          { date: "2026-04-25", level: 4 },
        ],
      }));
      expect(result.moodTrend).toBe("improving");
    });

    it("worsening mood trend", () => {
      const result = analyseEmotionalWellbeing(makeInput({
        moodRecords: [
          { date: "2026-04-01", level: 4 },
          { date: "2026-04-05", level: 4 },
          { date: "2026-04-10", level: 4 },
          { date: "2026-04-15", level: 3 },
          { date: "2026-04-20", level: 2 },
          { date: "2026-04-25", level: 2 },
        ],
      }));
      expect(result.moodTrend).toBe("worsening");
    });
  });

  // ── Self-harm risk ────────────────────────────────────────────────────

  describe("Self-harm risk", () => {
    it("none when no incidents", () => {
      const result = analyseEmotionalWellbeing(makeInput());
      expect(result.selfHarmRiskLevel).toBe("none");
    });

    it("low for single minor incident", () => {
      const result = analyseEmotionalWellbeing(makeInput({
        selfHarmIncidents: [
          { date: "2026-05-01", severity: "minor", supportProvided: true, safetyPlanUpdated: true },
        ],
      }));
      expect(result.selfHarmRiskLevel).toBe("low");
    });

    it("medium for multiple or serious", () => {
      const result = analyseEmotionalWellbeing(makeInput({
        selfHarmIncidents: [
          { date: "2026-04-15", severity: "minor", supportProvided: true, safetyPlanUpdated: true },
          { date: "2026-05-01", severity: "moderate", supportProvided: true, safetyPlanUpdated: true },
        ],
      }));
      expect(result.selfHarmRiskLevel).toBe("medium");
    });

    it("high for frequent with serious recent", () => {
      const result = analyseEmotionalWellbeing(makeInput({
        selfHarmIncidents: [
          { date: "2026-04-01", severity: "minor", supportProvided: true, safetyPlanUpdated: true },
          { date: "2026-04-15", severity: "moderate", supportProvided: true, safetyPlanUpdated: true },
          { date: "2026-05-01", severity: "serious", supportProvided: true, safetyPlanUpdated: true },
        ],
      }));
      expect(result.selfHarmRiskLevel).toBe("high");
    });
  });

  // ── Therapy metrics ───────────────────────────────────────────────────

  describe("Therapy metrics", () => {
    it("active therapy detected", () => {
      const result = analyseEmotionalWellbeing(makeInput({
        therapeuticInputs: [makeTherapy({ active: true })],
      }));
      expect(result.activeTherapy).toBe(true);
    });

    it("therapy attendance rate calculated", () => {
      const result = analyseEmotionalWellbeing(makeInput({
        therapeuticInputs: [makeTherapy({ sessionsAttended: 8, sessionsMissed: 2 })],
      }));
      expect(result.therapyAttendanceRate).toBe(0.8);
    });

    it("defaults to 1 when no active therapy", () => {
      const result = analyseEmotionalWellbeing(makeInput());
      expect(result.therapyAttendanceRate).toBe(1);
    });
  });

  // ── Concerns ──────────────────────────────────────────────────────────

  describe("Concerns", () => {
    it("critical for high self-harm risk", () => {
      const result = analyseEmotionalWellbeing(makeInput({
        selfHarmIncidents: [
          { date: "2026-04-01", severity: "minor", supportProvided: true, safetyPlanUpdated: true },
          { date: "2026-04-15", severity: "moderate", supportProvided: true, safetyPlanUpdated: true },
          { date: "2026-05-01", severity: "serious", supportProvided: true, safetyPlanUpdated: true },
        ],
        hasSafetyPlan: true,
      }));
      const c = result.concerns.find(c => c.category === "self_harm");
      expect(c).toBeDefined();
      expect(c!.severity).toBe("critical");
    });

    it("critical for abnormal SDQ worsening", () => {
      const result = analyseEmotionalWellbeing(makeInput({
        sdqScores: [
          makeSDQ({ date: "2025-10-01", totalDifficulties: 20, band: "abnormal" }),
          makeSDQ({ date: "2026-04-01", totalDifficulties: 25, band: "abnormal" }),
        ],
      }));
      const c = result.concerns.find(c => c.category === "sdq");
      expect(c).toBeDefined();
      expect(c!.severity).toBe("critical");
    });

    it("significant for low mood", () => {
      const result = analyseEmotionalWellbeing(makeInput({
        moodRecords: [
          { date: "2026-05-01", level: 2 },
          { date: "2026-05-03", level: 1 },
          { date: "2026-05-05", level: 2 },
          { date: "2026-05-07", level: 2 },
          { date: "2026-05-09", level: 1 },
        ],
      }));
      const c = result.concerns.find(c => c.category === "mood");
      expect(c).toBeDefined();
      expect(c!.severity).toBe("significant");
    });

    it("significant for long wait", () => {
      const result = analyseEmotionalWellbeing(makeInput({
        waitingForService: true,
        waitDays: 120,
        mentalHealthReferralMade: true,
      }));
      const c = result.concerns.find(c => c.category === "access");
      expect(c).toBeDefined();
      expect(c!.severity).toBe("significant");
    });

    it("critical for self-harm without safety plan", () => {
      const result = analyseEmotionalWellbeing(makeInput({
        selfHarmIncidents: [
          { date: "2026-05-01", severity: "minor", supportProvided: true, safetyPlanUpdated: false },
        ],
        hasSafetyPlan: false,
      }));
      const c = result.concerns.find(c => c.category === "safety");
      expect(c).toBeDefined();
      expect(c!.severity).toBe("critical");
    });

    it("moderate for no SDQ", () => {
      const result = analyseEmotionalWellbeing(makeInput({
        regulatorySDQCompleted: false,
      }));
      const c = result.concerns.find(c => c.category === "assessment");
      expect(c).toBeDefined();
    });

    it("no concerns for well-supported child", () => {
      const result = analyseEmotionalWellbeing(makeInput());
      expect(result.concerns).toHaveLength(0);
    });
  });

  // ── Strengths ─────────────────────────────────────────────────────────

  describe("Strengths", () => {
    it("identifies normal SDQ", () => {
      const result = analyseEmotionalWellbeing(makeInput());
      const s = result.strengths.find(s => s.category === "sdq");
      expect(s).toBeDefined();
    });

    it("identifies improving SDQ", () => {
      const result = analyseEmotionalWellbeing(makeInput({
        sdqScores: [
          makeSDQ({ date: "2025-10-01", totalDifficulties: 18 }),
          makeSDQ({ date: "2026-04-01", totalDifficulties: 10 }),
        ],
      }));
      const s = result.strengths.find(s => s.category === "progress");
      expect(s).toBeDefined();
    });

    it("identifies positive mood", () => {
      const result = analyseEmotionalWellbeing(makeInput({
        moodRecords: [
          { date: "2026-05-01", level: 4 },
          { date: "2026-05-03", level: 5 },
          { date: "2026-05-05", level: 4 },
          { date: "2026-05-07", level: 4 },
          { date: "2026-05-09", level: 5 },
        ],
      }));
      const s = result.strengths.find(s => s.category === "mood");
      expect(s).toBeDefined();
    });

    it("identifies protective factors", () => {
      const result = analyseEmotionalWellbeing(makeInput());
      const s = result.strengths.find(s => s.category === "protective");
      expect(s).toBeDefined();
    });

    it("identifies engaged therapy", () => {
      const result = analyseEmotionalWellbeing(makeInput({
        therapeuticInputs: [makeTherapy({ active: true, childEngaged: true })],
        mentalHealthReferralMade: true,
      }));
      const s = result.strengths.find(s => s.category === "therapy");
      expect(s).toBeDefined();
    });
  });

  // ── Regulatory flags ──────────────────────────────────────────────────

  describe("Regulatory flags", () => {
    it("CHR 2015 Reg 6 met for well-supported child", () => {
      const result = analyseEmotionalWellbeing(makeInput());
      const flag = result.regulatoryFlags.find(f => f.regulation === "CHR 2015 Reg 6(2)(b)(i)");
      expect(flag).toBeDefined();
      expect(flag!.status).toBe("met");
    });

    it("Promoting Health of LAC met with SDQ", () => {
      const result = analyseEmotionalWellbeing(makeInput());
      const flag = result.regulatoryFlags.find(f => f.regulation === "Promoting Health of LAC");
      expect(flag).toBeDefined();
      expect(flag!.status).toBe("met");
    });

    it("Promoting Health of LAC not_met without SDQ", () => {
      const result = analyseEmotionalWellbeing(makeInput({ regulatorySDQCompleted: false }));
      const flag = result.regulatoryFlags.find(f => f.regulation === "Promoting Health of LAC");
      expect(flag).toBeDefined();
      expect(flag!.status).toBe("not_met");
    });

    it("SCCIF met for good outcomes", () => {
      const result = analyseEmotionalWellbeing(makeInput());
      const flag = result.regulatoryFlags.find(f => f.regulation === "SCCIF");
      expect(flag).toBeDefined();
      expect(flag!.status).toBe("met");
    });

    it("SCCIF not_met for high self-harm risk", () => {
      const result = analyseEmotionalWellbeing(makeInput({
        selfHarmIncidents: [
          { date: "2026-04-01", severity: "minor", supportProvided: true, safetyPlanUpdated: true },
          { date: "2026-04-15", severity: "moderate", supportProvided: true, safetyPlanUpdated: true },
          { date: "2026-05-01", severity: "serious", supportProvided: true, safetyPlanUpdated: true },
        ],
      }));
      const flag = result.regulatoryFlags.find(f => f.regulation === "SCCIF");
      expect(flag).toBeDefined();
      expect(flag!.status).toBe("not_met");
    });
  });

  // ── Recommendations ───────────────────────────────────────────────────

  describe("Recommendations", () => {
    it("urgent safety plan for high risk", () => {
      const result = analyseEmotionalWellbeing(makeInput({
        selfHarmIncidents: [
          { date: "2026-04-01", severity: "minor", supportProvided: true, safetyPlanUpdated: true },
          { date: "2026-04-15", severity: "moderate", supportProvided: true, safetyPlanUpdated: true },
          { date: "2026-05-01", severity: "serious", supportProvided: true, safetyPlanUpdated: true },
        ],
        hasSafetyPlan: false,
      }));
      expect(result.recommendations.some(r => r.includes("URGENT"))).toBe(true);
    });

    it("recommends therapy for abnormal SDQ", () => {
      const result = analyseEmotionalWellbeing(makeInput({
        sdqScores: [makeSDQ({ band: "abnormal", totalDifficulties: 22 })],
      }));
      expect(result.recommendations.some(r => r.includes("therapeutic"))).toBe(true);
    });

    it("recommends SDQ when not completed", () => {
      const result = analyseEmotionalWellbeing(makeInput({ regulatorySDQCompleted: false }));
      expect(result.recommendations.some(r => r.includes("SDQ"))).toBe(true);
    });

    it("recommends escalation for long wait", () => {
      const result = analyseEmotionalWellbeing(makeInput({
        waitingForService: true,
        waitDays: 120,
        mentalHealthReferralMade: true,
      }));
      expect(result.recommendations.some(r => r.includes("Escalate"))).toBe(true);
    });

    it("minimal for well child", () => {
      const result = analyseEmotionalWellbeing(makeInput());
      expect(result.recommendations.length).toBeLessThanOrEqual(1);
    });
  });

  // ── Summary ───────────────────────────────────────────────────────────

  describe("Summary", () => {
    it("includes child name", () => {
      const result = analyseEmotionalWellbeing(makeInput({ childName: "Jordan" }));
      expect(result.summary).toContain("Jordan");
    });

    it("includes SDQ band", () => {
      const result = analyseEmotionalWellbeing(makeInput());
      expect(result.summary).toContain("normal");
    });

    it("includes self-harm risk when present", () => {
      const result = analyseEmotionalWellbeing(makeInput({
        selfHarmIncidents: [
          { date: "2026-05-01", severity: "minor", supportProvided: true, safetyPlanUpdated: true },
        ],
      }));
      expect(result.summary).toContain("self-harm");
    });
  });
});
