// ══════════════════════════════════════════════════════════════════════════════
// Tests — Missing Episodes Intelligence Engine
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  analyseMissingEpisodes,
  MissingInput,
  MissingEpisode,
  EpisodeCategory,
} from "../missing-episodes-intelligence";

// ── Helpers ─────────────────────────────────────────────────────────────────

const FIXED_NOW = new Date("2026-05-16T12:00:00Z").getTime();

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_NOW);
});

function makeEpisode(overrides: Partial<MissingEpisode> = {}): MissingEpisode {
  return {
    id: `ep_${Math.random().toString(36).slice(2)}`,
    date: "2026-05-01",
    startTime: "18:00",
    endTime: "21:00",
    category: "absent",
    durationMinutes: 180,
    outcome: "returned_self",
    policeNotified: false,
    socialWorkerNotified: true,
    returnHomeInterview: {
      offered: true,
      completed: true,
      within72Hours: true,
    },
    ...overrides,
  };
}

function makeMissingEpisode(overrides: Partial<MissingEpisode> = {}): MissingEpisode {
  return makeEpisode({
    category: "missing",
    policeNotified: true,
    durationMinutes: 360,
    ...overrides,
  });
}

function makeInput(overrides: Partial<MissingInput> = {}): MissingInput {
  return {
    childId: "child_1",
    childName: "Jordan",
    age: 15,
    episodes: [],
    hasRiskAssessment: true,
    riskAssessmentUpToDate: true,
    hasMissingProtocol: true,
    knownCSERisk: false,
    knownCCERisk: false,
    knownGangAssociation: false,
    placementType: "residential",
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════

describe("Missing Episodes Intelligence Engine", () => {

  // ── Basic functionality ─────────────────────────────────────────────────

  describe("Basic functionality", () => {
    it("returns valid assessment structure", () => {
      const result = analyseMissingEpisodes(makeInput());
      expect(result).toHaveProperty("overallScore");
      expect(result).toHaveProperty("overallRating");
      expect(result).toHaveProperty("frequencyScore");
      expect(result).toHaveProperty("responseScore");
      expect(result).toHaveProperty("riskScore");
      expect(result).toHaveProperty("complianceScore");
      expect(result).toHaveProperty("totalEpisodes");
      expect(result).toHaveProperty("trend");
      expect(result).toHaveProperty("riskLevel");
      expect(result).toHaveProperty("rhi");
      expect(result).toHaveProperty("patterns");
      expect(result).toHaveProperty("concerns");
      expect(result).toHaveProperty("regulatoryFlags");
      expect(result).toHaveProperty("recommendations");
      expect(result).toHaveProperty("summary");
    });

    it("uses childName", () => {
      const result = analyseMissingEpisodes(makeInput({ childName: "Sam" }));
      expect(result.childName).toBe("Sam");
      expect(result.summary).toContain("Sam");
    });

    it("handles zero episodes — excellent rating", () => {
      const result = analyseMissingEpisodes(makeInput({ episodes: [] }));
      expect(result.overallScore).toBe(100);
      expect(result.overallRating).toBe("excellent");
      expect(result.totalEpisodes).toBe(0);
      expect(result.riskLevel).toBe("low");
      expect(result.concerns).toHaveLength(0);
    });
  });

  // ── Episode counting ────────────────────────────────────────────────────

  describe("Episode counting", () => {
    it("counts missing vs absent correctly", () => {
      const result = analyseMissingEpisodes(makeInput({
        episodes: [
          makeMissingEpisode({ date: "2026-05-01" }),
          makeEpisode({ date: "2026-05-02", category: "absent" }),
          makeMissingEpisode({ date: "2026-05-03" }),
          makeEpisode({ date: "2026-05-04", category: "away_without_permission" }),
        ],
      }));
      expect(result.totalEpisodes).toBe(4);
      expect(result.missingEpisodes).toBe(2);
      expect(result.absentEpisodes).toBe(2);
    });

    it("counts last 30 days correctly", () => {
      const result = analyseMissingEpisodes(makeInput({
        episodes: [
          makeEpisode({ date: "2026-05-10" }),
          makeEpisode({ date: "2026-05-01" }),
          makeEpisode({ date: "2026-03-01" }), // >30 days ago
        ],
      }));
      expect(result.episodesLast30Days).toBe(2);
    });

    it("counts last 90 days correctly", () => {
      const result = analyseMissingEpisodes(makeInput({
        episodes: [
          makeEpisode({ date: "2026-05-10" }),
          makeEpisode({ date: "2026-04-01" }),
          makeEpisode({ date: "2026-01-01" }), // >90 days ago
        ],
      }));
      expect(result.episodesLast90Days).toBe(2);
    });
  });

  // ── Duration analysis ──────────────────────────────────────────────────

  describe("Duration analysis", () => {
    it("calculates average duration", () => {
      const result = analyseMissingEpisodes(makeInput({
        episodes: [
          makeEpisode({ durationMinutes: 120 }),
          makeEpisode({ durationMinutes: 180 }),
          makeEpisode({ durationMinutes: 60 }),
        ],
      }));
      expect(result.averageDurationMinutes).toBe(120);
    });

    it("finds longest episode", () => {
      const result = analyseMissingEpisodes(makeInput({
        episodes: [
          makeEpisode({ durationMinutes: 120 }),
          makeEpisode({ durationMinutes: 480 }),
          makeEpisode({ durationMinutes: 60 }),
        ],
      }));
      expect(result.longestEpisodeMinutes).toBe(480);
    });
  });

  // ── Trend analysis ─────────────────────────────────────────────────────

  describe("Trend analysis", () => {
    it("detects escalating trend", () => {
      // More episodes in recent 30 days than previous periods
      const result = analyseMissingEpisodes(makeInput({
        episodes: [
          makeEpisode({ date: "2026-03-10" }),
          makeEpisode({ date: "2026-05-01" }),
          makeEpisode({ date: "2026-05-05" }),
          makeEpisode({ date: "2026-05-10" }),
          makeEpisode({ date: "2026-05-14" }),
        ],
      }));
      expect(result.trend).toBe("escalating");
    });

    it("detects improving trend", () => {
      // Episodes in past but none recent
      const result = analyseMissingEpisodes(makeInput({
        episodes: [
          makeEpisode({ date: "2026-03-01" }),
          makeEpisode({ date: "2026-03-10" }),
          makeEpisode({ date: "2026-03-15" }),
          makeEpisode({ date: "2026-03-20" }),
        ],
      }));
      expect(result.trend).toBe("improving");
    });

    it("stable with fewer than 4 episodes", () => {
      const result = analyseMissingEpisodes(makeInput({
        episodes: [makeEpisode({ date: "2026-05-01" })],
      }));
      expect(result.trend).toBe("stable");
    });
  });

  // ── Risk level ─────────────────────────────────────────────────────────

  describe("Risk level", () => {
    it("low risk for single non-recent episode", () => {
      const result = analyseMissingEpisodes(makeInput({
        episodes: [makeEpisode({ date: "2026-03-01", durationMinutes: 60 })],
      }));
      expect(result.riskLevel).toBe("low");
    });

    it("high risk with CSE flag and multiple recent episodes", () => {
      const result = analyseMissingEpisodes(makeInput({
        knownCSERisk: true,
        episodes: [
          makeMissingEpisode({ date: "2026-05-01", durationMinutes: 600 }),
          makeMissingEpisode({ date: "2026-05-05", durationMinutes: 600 }),
          makeMissingEpisode({ date: "2026-05-10", durationMinutes: 600 }),
        ],
      }));
      expect(["high", "very_high"]).toContain(result.riskLevel);
    });

    it("very high risk with multiple recent missing + exploitation flags", () => {
      const result = analyseMissingEpisodes(makeInput({
        knownCSERisk: true,
        knownCCERisk: true,
        episodes: [
          makeMissingEpisode({ date: "2026-05-01", durationMinutes: 1500 }),
          makeMissingEpisode({ date: "2026-05-05", durationMinutes: 1200 }),
          makeMissingEpisode({ date: "2026-05-10", durationMinutes: 960 }),
          makeMissingEpisode({ date: "2026-05-14", durationMinutes: 600 }),
        ],
      }));
      expect(result.riskLevel).toBe("very_high");
    });

    it("elevated risk for still-missing child", () => {
      const result = analyseMissingEpisodes(makeInput({
        episodes: [
          makeMissingEpisode({ date: "2026-05-15", outcome: "still_missing", endTime: undefined, durationMinutes: 0 }),
        ],
      }));
      // still_missing adds 4 points + 1 for recent = 5 → medium or higher
      expect(["medium", "high", "very_high"]).toContain(result.riskLevel);
      // Key assertion: risk is elevated above low
      expect(result.riskLevel).not.toBe("low");
    });
  });

  // ── RHI Compliance ─────────────────────────────────────────────────────

  describe("RHI Compliance", () => {
    it("100% when all offered, completed, within 72h", () => {
      const result = analyseMissingEpisodes(makeInput({
        episodes: [
          makeMissingEpisode({
            returnHomeInterview: { offered: true, completed: true, within72Hours: true },
          }),
          makeMissingEpisode({
            returnHomeInterview: { offered: true, completed: true, within72Hours: true },
          }),
        ],
      }));
      expect(result.rhi.offerRate).toBe(1);
      expect(result.rhi.completionRate).toBe(1);
      expect(result.rhi.timelinessRate).toBe(1);
    });

    it("low rates when not offered", () => {
      const result = analyseMissingEpisodes(makeInput({
        episodes: [
          makeMissingEpisode({
            returnHomeInterview: { offered: false, completed: false },
          }),
          makeMissingEpisode({
            returnHomeInterview: { offered: true, completed: true, within72Hours: true },
          }),
        ],
      }));
      expect(result.rhi.offerRate).toBe(0.5);
    });

    it("tracks completion separately from offer", () => {
      const result = analyseMissingEpisodes(makeInput({
        episodes: [
          makeMissingEpisode({
            returnHomeInterview: { offered: true, completed: false },
          }),
          makeMissingEpisode({
            returnHomeInterview: { offered: true, completed: true, within72Hours: true },
          }),
        ],
      }));
      expect(result.rhi.offerRate).toBe(1);
      expect(result.rhi.completionRate).toBe(0.5);
    });
  });

  // ── Patterns ───────────────────────────────────────────────────────────

  describe("Pattern detection", () => {
    it("detects post-contact pattern", () => {
      const result = analyseMissingEpisodes(makeInput({
        episodes: [
          makeEpisode({ date: "2026-05-01", triggers: ["family contact"] }),
          makeEpisode({ date: "2026-05-05", triggers: ["after contact visit"] }),
          makeEpisode({ date: "2026-05-10", triggers: ["other"] }),
        ],
      }));
      const postContact = result.patterns.find(p => p.type === "post_contact");
      expect(postContact).toBeDefined();
      expect(postContact!.significance).toBe("high");
    });

    it("detects repeat location pattern", () => {
      const result = analyseMissingEpisodes(makeInput({
        episodes: [
          makeEpisode({ date: "2026-05-01", locationIfKnown: "City Centre" }),
          makeEpisode({ date: "2026-05-05", locationIfKnown: "City Centre" }),
          makeEpisode({ date: "2026-05-10", locationIfKnown: "City Centre" }),
        ],
      }));
      const locPattern = result.patterns.find(p => p.type === "repeat_location");
      expect(locPattern).toBeDefined();
    });

    it("detects repeat associate pattern", () => {
      const result = analyseMissingEpisodes(makeInput({
        episodes: [
          makeEpisode({ date: "2026-05-01", withWhom: "Tyler" }),
          makeEpisode({ date: "2026-05-05", withWhom: "Tyler" }),
          makeEpisode({ date: "2026-05-10" }),
        ],
      }));
      const assocPattern = result.patterns.find(p => p.type === "repeat_associate");
      expect(assocPattern).toBeDefined();
    });

    it("no patterns from single episode", () => {
      const result = analyseMissingEpisodes(makeInput({
        episodes: [makeEpisode()],
      }));
      expect(result.patterns).toHaveLength(0);
    });
  });

  // ── Concerns ───────────────────────────────────────────────────────────

  describe("Concerns", () => {
    it("critical concern for escalating episodes", () => {
      const result = analyseMissingEpisodes(makeInput({
        episodes: [
          makeEpisode({ date: "2026-03-10" }),
          makeEpisode({ date: "2026-05-01" }),
          makeEpisode({ date: "2026-05-05" }),
          makeEpisode({ date: "2026-05-10" }),
          makeEpisode({ date: "2026-05-14" }),
        ],
      }));
      const escalation = result.concerns.find(c => c.category === "escalation");
      expect(escalation).toBeDefined();
      expect(escalation!.severity).toBe("critical");
    });

    it("critical concern for CSE risk", () => {
      const result = analyseMissingEpisodes(makeInput({
        knownCSERisk: true,
        episodes: [makeEpisode({ date: "2026-05-01" })],
      }));
      const cse = result.concerns.find(c => c.category === "exploitation" && c.description.includes("CSE"));
      expect(cse).toBeDefined();
      expect(cse!.severity).toBe("critical");
    });

    it("concern for police not notified on missing episode", () => {
      const result = analyseMissingEpisodes(makeInput({
        episodes: [
          makeMissingEpisode({ policeNotified: false }),
        ],
      }));
      const police = result.concerns.find(c => c.category === "notification");
      expect(police).toBeDefined();
      expect(police!.severity).toBe("critical");
    });

    it("concern for low RHI offer rate", () => {
      const result = analyseMissingEpisodes(makeInput({
        episodes: [
          makeMissingEpisode({ returnHomeInterview: { offered: false, completed: false } }),
          makeMissingEpisode({ returnHomeInterview: { offered: false, completed: false } }),
          makeMissingEpisode({ returnHomeInterview: { offered: true, completed: true, within72Hours: true } }),
        ],
      }));
      const rhi = result.concerns.find(c => c.category === "rhi_compliance");
      expect(rhi).toBeDefined();
    });

    it("concern for no risk assessment with repeat episodes", () => {
      const result = analyseMissingEpisodes(makeInput({
        hasRiskAssessment: false,
        episodes: [
          makeEpisode({ date: "2026-05-01" }),
          makeEpisode({ date: "2026-05-10" }),
        ],
      }));
      const risk = result.concerns.find(c => c.category === "risk_management");
      expect(risk).toBeDefined();
    });

    it("critical concern for still-missing child", () => {
      const result = analyseMissingEpisodes(makeInput({
        episodes: [
          makeMissingEpisode({ outcome: "still_missing", endTime: undefined, durationMinutes: 0 }),
        ],
      }));
      const current = result.concerns.find(c => c.category === "current_status");
      expect(current).toBeDefined();
      expect(current!.severity).toBe("critical");
    });

    it("no concerns for zero episodes", () => {
      const result = analyseMissingEpisodes(makeInput({ episodes: [] }));
      expect(result.concerns).toHaveLength(0);
    });
  });

  // ── Strengths ──────────────────────────────────────────────────────────

  describe("Strengths", () => {
    it("identifies improving trend", () => {
      const result = analyseMissingEpisodes(makeInput({
        episodes: [
          makeEpisode({ date: "2026-03-01" }),
          makeEpisode({ date: "2026-03-10" }),
          makeEpisode({ date: "2026-03-15" }),
          makeEpisode({ date: "2026-03-20" }),
        ],
      }));
      const trend = result.strengths.find(s => s.category === "trend");
      expect(trend).toBeDefined();
    });

    it("identifies good RHI completion", () => {
      const result = analyseMissingEpisodes(makeInput({
        episodes: [
          makeMissingEpisode({ returnHomeInterview: { offered: true, completed: true, within72Hours: true } }),
          makeMissingEpisode({ returnHomeInterview: { offered: true, completed: true, within72Hours: true } }),
        ],
      }));
      const rhi = result.strengths.find(s => s.category === "rhi");
      expect(rhi).toBeDefined();
    });

    it("identifies protocol in place", () => {
      const result = analyseMissingEpisodes(makeInput({
        hasMissingProtocol: true,
        episodes: [makeEpisode()],
      }));
      const protocol = result.strengths.find(s => s.category === "protocol");
      expect(protocol).toBeDefined();
    });

    it("no missing episodes is a strength", () => {
      const result = analyseMissingEpisodes(makeInput({ episodes: [] }));
      const safety = result.strengths.find(s => s.category === "safety");
      expect(safety).toBeDefined();
    });
  });

  // ── Regulatory flags ───────────────────────────────────────────────────

  describe("Regulatory flags", () => {
    it("all met for zero episodes", () => {
      const result = analyseMissingEpisodes(makeInput({ episodes: [] }));
      expect(result.regulatoryFlags.every(f => f.status === "met")).toBe(true);
    });

    it("Reg 34(1) not_met without protocol and repeated episodes", () => {
      const result = analyseMissingEpisodes(makeInput({
        hasMissingProtocol: false,
        episodes: [
          makeEpisode({ date: "2026-05-01" }),
          makeEpisode({ date: "2026-05-10" }),
        ],
      }));
      const reg34 = result.regulatoryFlags.find(f => f.regulation === "CHR 2015 Reg 34(1)");
      expect(reg34).toBeDefined();
      expect(reg34!.status).toBe("not_met");
    });

    it("Missing Children Guidance not_met for poor RHI", () => {
      const result = analyseMissingEpisodes(makeInput({
        episodes: [
          makeMissingEpisode({ returnHomeInterview: { offered: false, completed: false } }),
          makeMissingEpisode({ returnHomeInterview: { offered: false, completed: false } }),
        ],
      }));
      const guidance = result.regulatoryFlags.find(f => f.regulation === "Missing Children Guidance");
      expect(guidance).toBeDefined();
      expect(guidance!.status).toBe("not_met");
    });

    it("SCCIF safety not_met for very high risk", () => {
      const result = analyseMissingEpisodes(makeInput({
        knownCSERisk: true,
        knownCCERisk: true,
        episodes: [
          makeMissingEpisode({ date: "2026-05-01", durationMinutes: 1500 }),
          makeMissingEpisode({ date: "2026-05-05", durationMinutes: 1200 }),
          makeMissingEpisode({ date: "2026-05-10", durationMinutes: 960 }),
          makeMissingEpisode({ date: "2026-05-14", durationMinutes: 600 }),
        ],
      }));
      const sccif = result.regulatoryFlags.find(f => f.regulation === "SCCIF");
      expect(sccif).toBeDefined();
      expect(sccif!.status).toBe("not_met");
    });
  });

  // ── Recommendations ────────────────────────────────────────────────────

  describe("Recommendations", () => {
    it("recommends strategy meeting for escalating", () => {
      const result = analyseMissingEpisodes(makeInput({
        episodes: [
          makeEpisode({ date: "2026-03-10" }),
          makeEpisode({ date: "2026-05-01" }),
          makeEpisode({ date: "2026-05-05" }),
          makeEpisode({ date: "2026-05-10" }),
          makeEpisode({ date: "2026-05-14" }),
        ],
      }));
      expect(result.recommendations.some(r => r.includes("strategy meeting"))).toBe(true);
    });

    it("recommends protocol when missing", () => {
      const result = analyseMissingEpisodes(makeInput({
        hasMissingProtocol: false,
        episodes: [makeEpisode(), makeEpisode()],
      }));
      expect(result.recommendations.some(r => r.includes("protocol"))).toBe(true);
    });

    it("recommends RHI improvement when low", () => {
      const result = analyseMissingEpisodes(makeInput({
        episodes: [
          makeMissingEpisode({ returnHomeInterview: { offered: false, completed: false } }),
          makeMissingEpisode({ returnHomeInterview: { offered: false, completed: false } }),
          makeMissingEpisode({ returnHomeInterview: { offered: true, completed: true, within72Hours: true } }),
        ],
      }));
      expect(result.recommendations.some(r => r.includes("Return Home Interview"))).toBe(true);
    });

    it("recommends exploitation review for CSE/CCE", () => {
      const result = analyseMissingEpisodes(makeInput({
        knownCSERisk: true,
        episodes: [makeMissingEpisode()],
      }));
      expect(result.recommendations.some(r => r.includes("exploitation"))).toBe(true);
    });

    it("no recommendations for zero episodes", () => {
      const result = analyseMissingEpisodes(makeInput({ episodes: [] }));
      expect(result.recommendations).toHaveLength(0);
    });
  });

  // ── Scoring ────────────────────────────────────────────────────────────

  describe("Scoring", () => {
    it("overall score is weighted average", () => {
      const result = analyseMissingEpisodes(makeInput({
        episodes: [makeEpisode({ date: "2026-05-01" })],
      }));
      const expected = Math.round(
        result.frequencyScore * 0.30 +
        result.responseScore! * 0.25 +
        result.riskScore * 0.20 +
        result.complianceScore * 0.25
      );
      expect(result.overallScore).toBe(expected);
    });

    it("higher frequency = lower frequency score", () => {
      const fewResult = analyseMissingEpisodes(makeInput({
        episodes: [makeEpisode({ date: "2026-04-01" })],
      }));
      const manyResult = analyseMissingEpisodes(makeInput({
        episodes: Array.from({ length: 5 }, (_, i) =>
          makeEpisode({ date: `2026-05-${String(i + 1).padStart(2, "0")}` })
        ),
      }));
      expect(fewResult.frequencyScore).toBeGreaterThan(manyResult.frequencyScore);
    });

    it("response score penalises missing notifications", () => {
      const goodResult = analyseMissingEpisodes(makeInput({
        episodes: [makeMissingEpisode({
          policeNotified: true,
          socialWorkerNotified: true,
          returnHomeInterview: { offered: true, completed: true, within72Hours: true },
        })],
      }));
      const badResult = analyseMissingEpisodes(makeInput({
        episodes: [makeMissingEpisode({
          policeNotified: false,
          socialWorkerNotified: false,
          returnHomeInterview: { offered: false, completed: false },
        })],
      }));
      expect(goodResult.responseScore!).toBeGreaterThan(badResult.responseScore!);
    });
  });

  describe("Future-date guard (no recency inflation)", () => {
    it("excludes future-dated episodes from the last-30-day count", () => {
      // now is pinned to 2026-05-16 — a record dated after today must not count as recent.
      const result = analyseMissingEpisodes(makeInput({
        episodes: [
          makeEpisode({ date: "2026-05-10" }),
          makeEpisode({ date: "2026-05-01" }),
          makeEpisode({ date: "2026-06-10" }), // future — must not inflate
        ],
      }));
      expect(result.episodesLast30Days).toBe(2);
    });
  });
});
