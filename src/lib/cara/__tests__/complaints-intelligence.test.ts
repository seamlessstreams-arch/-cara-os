// ══════════════════════════════════════════════════════════════════════════════
// Tests — Complaints & Representations Intelligence Engine
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  analyseComplaints,
  ComplaintsInput,
  Complaint,
  ComplaintCategory,
} from "../complaints-intelligence";

// ── Helpers ─────────────────────────────────────────────────────────────────

const FIXED_NOW = new Date("2026-05-16T12:00:00Z").getTime();

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_NOW);
});

function makeComplaint(overrides: Partial<Complaint> = {}): Complaint {
  return {
    id: `c_${Math.random().toString(36).slice(2)}`,
    date: "2026-05-01",
    category: "food",
    description: "Didn't like dinner options",
    status: "resolved",
    resolvedDate: "2026-05-03",
    resolutionDays: 2,
    childSatisfied: true,
    acknowledgedWithin24Hours: true,
    investigatedProperly: true,
    childKeptInformed: true,
    escalationLevel: "internal",
    advocateInvolved: false,
    madeBy: "child",
    ...overrides,
  };
}

function makeInput(overrides: Partial<ComplaintsInput> = {}): ComplaintsInput {
  return {
    childId: "child_1",
    childName: "Jordan",
    age: 15,
    complaints: [],
    complaintsProcessExplained: true,
    childKnowsHowToComplain: true,
    advocateAvailable: true,
    complaintsDisplayedAccessibly: true,
    independentVisitorAssigned: true,
    regulatoryBodyInfoProvided: true,
    complaintsReviewedByRM: true,
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════

describe("Complaints & Representations Intelligence Engine", () => {

  // ── Basic functionality ─────────────────────────────────────────────────

  describe("Basic functionality", () => {
    it("returns valid assessment structure", () => {
      const result = analyseComplaints(makeInput());
      expect(result).toHaveProperty("overallScore");
      expect(result).toHaveProperty("overallRating");
      expect(result).toHaveProperty("accessibilityScore");
      expect(result).toHaveProperty("responsivenessScore");
      expect(result).toHaveProperty("resolutionScore");
      expect(result).toHaveProperty("voiceScore");
      expect(result).toHaveProperty("themes");
      expect(result).toHaveProperty("concerns");
      expect(result).toHaveProperty("strengths");
      expect(result).toHaveProperty("regulatoryFlags");
      expect(result).toHaveProperty("recommendations");
      expect(result).toHaveProperty("summary");
    });

    it("uses childName", () => {
      const result = analyseComplaints(makeInput({ childName: "Sam" }));
      expect(result.childName).toBe("Sam");
      expect(result.summary).toContain("Sam");
    });

    it("handles no complaints", () => {
      const result = analyseComplaints(makeInput());
      expect(result.totalComplaints).toBe(0);
      expect(result.openComplaints).toBe(0);
      expect(result.overallRating).toBe("excellent");
    });
  });

  // ── Counting ───────────────────────────────────────────────────────────

  describe("Counting", () => {
    it("counts total, open, resolved correctly", () => {
      const result = analyseComplaints(makeInput({
        complaints: [
          makeComplaint({ status: "resolved" }),
          makeComplaint({ status: "open" }),
          makeComplaint({ status: "investigating" }),
          makeComplaint({ status: "resolved" }),
        ],
      }));
      expect(result.totalComplaints).toBe(4);
      expect(result.openComplaints).toBe(2);
      expect(result.resolvedComplaints).toBe(2);
    });

    it("counts last 30 days correctly", () => {
      const result = analyseComplaints(makeInput({
        complaints: [
          makeComplaint({ date: "2026-05-10" }),
          makeComplaint({ date: "2026-05-01" }),
          makeComplaint({ date: "2026-03-01" }),
        ],
      }));
      expect(result.complaintsLast30Days).toBe(2);
    });
  });

  // ── Resolution times ───────────────────────────────────────────────────

  describe("Resolution times", () => {
    it("calculates average resolution days", () => {
      const result = analyseComplaints(makeInput({
        complaints: [
          makeComplaint({ resolutionDays: 3 }),
          makeComplaint({ resolutionDays: 7 }),
          makeComplaint({ resolutionDays: 5 }),
        ],
      }));
      expect(result.averageResolutionDays).toBe(5);
    });

    it("zero when no resolved complaints", () => {
      const result = analyseComplaints(makeInput({
        complaints: [
          makeComplaint({ status: "open", resolutionDays: undefined }),
        ],
      }));
      expect(result.averageResolutionDays).toBe(0);
    });
  });

  // ── Satisfaction ───────────────────────────────────────────────────────

  describe("Satisfaction", () => {
    it("calculates satisfaction rate", () => {
      const result = analyseComplaints(makeInput({
        complaints: [
          makeComplaint({ childSatisfied: true }),
          makeComplaint({ childSatisfied: true }),
          makeComplaint({ childSatisfied: false }),
        ],
      }));
      expect(result.satisfactionRate).toBeCloseTo(0.67, 1);
    });

    it("1.0 when no satisfaction data", () => {
      const result = analyseComplaints(makeInput({
        complaints: [
          makeComplaint({ childSatisfied: undefined }),
        ],
      }));
      expect(result.satisfactionRate).toBe(1);
    });
  });

  // ── Theme analysis ─────────────────────────────────────────────────────

  describe("Theme analysis", () => {
    it("identifies themes with counts", () => {
      const result = analyseComplaints(makeInput({
        complaints: [
          makeComplaint({ category: "food" }),
          makeComplaint({ category: "food" }),
          makeComplaint({ category: "privacy" }),
        ],
      }));
      expect(result.themes.length).toBe(2);
      expect(result.themes[0].category).toBe("food");
      expect(result.themes[0].count).toBe(2);
      expect(result.themes[0].percentage).toBe(67);
    });

    it("empty themes for no complaints", () => {
      const result = analyseComplaints(makeInput());
      expect(result.themes).toHaveLength(0);
    });
  });

  // ── Accessibility scoring ──────────────────────────────────────────────

  describe("Accessibility scoring", () => {
    it("100 for all accessibility elements in place", () => {
      const result = analyseComplaints(makeInput());
      expect(result.accessibilityScore).toBe(100);
    });

    it("reduced when child doesn't know how to complain", () => {
      const result = analyseComplaints(makeInput({
        childKnowsHowToComplain: false,
        complaintsProcessExplained: false,
      }));
      expect(result.accessibilityScore).toBeLessThan(60);
    });
  });

  // ── Responsiveness scoring ─────────────────────────────────────────────

  describe("Responsiveness scoring", () => {
    it("100 when all acknowledged and investigated", () => {
      const result = analyseComplaints(makeInput({
        complaints: [makeComplaint(), makeComplaint()],
      }));
      expect(result.responsivenessScore).toBe(100);
    });

    it("penalises slow acknowledgement", () => {
      const result = analyseComplaints(makeInput({
        complaints: [
          makeComplaint({ acknowledgedWithin24Hours: false }),
          makeComplaint({ acknowledgedWithin24Hours: true }),
        ],
      }));
      expect(result.responsivenessScore).toBeLessThan(90);
    });

    it("penalises improper investigation", () => {
      const result = analyseComplaints(makeInput({
        complaints: [makeComplaint({ investigatedProperly: false })],
      }));
      expect(result.responsivenessScore).toBeLessThan(75);
    });
  });

  // ── Resolution scoring ─────────────────────────────────────────────────

  describe("Resolution scoring", () => {
    it("high for quick resolution + satisfaction", () => {
      const result = analyseComplaints(makeInput({
        complaints: [
          makeComplaint({ resolutionDays: 2, childSatisfied: true }),
          makeComplaint({ resolutionDays: 3, childSatisfied: true }),
        ],
      }));
      expect(result.resolutionScore).toBeGreaterThan(90);
    });

    it("lower for slow resolution", () => {
      const result = analyseComplaints(makeInput({
        complaints: [
          makeComplaint({ resolutionDays: 35, childSatisfied: true }),
        ],
      }));
      expect(result.resolutionScore).toBeLessThan(70);
    });
  });

  // ── Concerns ───────────────────────────────────────────────────────────

  describe("Concerns", () => {
    it("concern when child doesn't know how to complain", () => {
      const result = analyseComplaints(makeInput({ childKnowsHowToComplain: false }));
      const concern = result.concerns.find(c => c.category === "accessibility");
      expect(concern).toBeDefined();
      expect(concern!.severity).toBe("significant");
    });

    it("concern for slow resolution", () => {
      const result = analyseComplaints(makeInput({
        complaints: [
          makeComplaint({ resolutionDays: 30 }),
          makeComplaint({ resolutionDays: 30 }),
        ],
      }));
      const concern = result.concerns.find(c => c.category === "timeliness");
      expect(concern).toBeDefined();
    });

    it("concern for multiple open complaints", () => {
      const result = analyseComplaints(makeInput({
        complaints: [
          makeComplaint({ status: "open", resolutionDays: undefined }),
          makeComplaint({ status: "open", resolutionDays: undefined }),
          makeComplaint({ status: "investigating", resolutionDays: undefined }),
        ],
      }));
      const concern = result.concerns.find(c => c.category === "backlog");
      expect(concern).toBeDefined();
    });

    it("critical concern for safety complaints", () => {
      const result = analyseComplaints(makeInput({
        complaints: [
          makeComplaint({ category: "safety" }),
          makeComplaint({ category: "safety" }),
        ],
      }));
      const concern = result.concerns.find(c => c.category === "safeguarding");
      expect(concern).toBeDefined();
      expect(concern!.severity).toBe("critical");
    });

    it("concern for repeat staff behaviour complaints", () => {
      const result = analyseComplaints(makeInput({
        complaints: [
          makeComplaint({ category: "staff_behaviour" }),
          makeComplaint({ category: "staff_behaviour" }),
          makeComplaint({ category: "staff_behaviour" }),
        ],
      }));
      const concern = result.concerns.find(c => c.category === "staff");
      expect(concern).toBeDefined();
    });

    it("concern when Ofsted info not provided", () => {
      const result = analyseComplaints(makeInput({ regulatoryBodyInfoProvided: false }));
      const concern = result.concerns.find(c => c.description.includes("Ofsted"));
      expect(concern).toBeDefined();
    });

    it("no concerns for well-managed complaints", () => {
      const result = analyseComplaints(makeInput({
        complaints: [makeComplaint()],
      }));
      expect(result.concerns).toHaveLength(0);
    });
  });

  // ── Strengths ──────────────────────────────────────────────────────────

  describe("Strengths", () => {
    it("identifies accessible process", () => {
      const result = analyseComplaints(makeInput());
      const s = result.strengths.find(s => s.category === "accessibility");
      expect(s).toBeDefined();
    });

    it("identifies prompt resolution", () => {
      const result = analyseComplaints(makeInput({
        complaints: [
          makeComplaint({ resolutionDays: 2 }),
          makeComplaint({ resolutionDays: 3 }),
        ],
      }));
      const s = result.strengths.find(s => s.category === "timeliness");
      expect(s).toBeDefined();
    });

    it("identifies RM oversight", () => {
      const result = analyseComplaints(makeInput({ complaintsReviewedByRM: true }));
      const s = result.strengths.find(s => s.category === "oversight");
      expect(s).toBeDefined();
    });

    it("identifies child empowerment", () => {
      const result = analyseComplaints(makeInput({
        complaints: [makeComplaint({ madeBy: "child" })],
      }));
      const s = result.strengths.find(s => s.category === "empowerment");
      expect(s).toBeDefined();
    });
  });

  // ── Regulatory flags ───────────────────────────────────────────────────

  describe("Regulatory flags", () => {
    it("all met for good practice", () => {
      const result = analyseComplaints(makeInput({
        complaints: [makeComplaint()],
      }));
      const unmet = result.regulatoryFlags.filter(f => f.status !== "met");
      expect(unmet).toHaveLength(0);
    });

    it("Reg 39(3) not_met when child doesn't know process", () => {
      const result = analyseComplaints(makeInput({
        childKnowsHowToComplain: false,
        complaintsProcessExplained: false,
      }));
      const flag = result.regulatoryFlags.find(f => f.regulation === "CHR 2015 Reg 39(3)");
      expect(flag).toBeDefined();
      expect(flag!.status).toBe("not_met");
    });

    it("Reg 39 not_met for very slow resolution", () => {
      const result = analyseComplaints(makeInput({
        complaints: [
          makeComplaint({ resolutionDays: 35 }),
          makeComplaint({ resolutionDays: 40 }),
          makeComplaint({ status: "open", resolutionDays: undefined, date: "2026-04-01" }),
          makeComplaint({ status: "open", resolutionDays: undefined, date: "2026-04-05" }),
          makeComplaint({ status: "open", resolutionDays: undefined, date: "2026-04-10" }),
        ],
      }));
      const flag = result.regulatoryFlags.find(f => f.regulation === "CHR 2015 Reg 39");
      expect(flag).toBeDefined();
      expect(flag!.status).toBe("not_met");
    });

    it("SCCIF not_met when voice not supported", () => {
      const result = analyseComplaints(makeInput({
        childKnowsHowToComplain: false,
        advocateAvailable: false,
      }));
      const flag = result.regulatoryFlags.find(f => f.regulation === "SCCIF");
      expect(flag).toBeDefined();
      expect(flag!.status).toBe("not_met");
    });
  });

  // ── Recommendations ────────────────────────────────────────────────────

  describe("Recommendations", () => {
    it("recommends explaining process when child unaware", () => {
      const result = analyseComplaints(makeInput({ childKnowsHowToComplain: false }));
      expect(result.recommendations.some(r => r.includes("Explain complaints process"))).toBe(true);
    });

    it("recommends improving resolution times", () => {
      const result = analyseComplaints(makeInput({
        complaints: [makeComplaint({ resolutionDays: 20 })],
      }));
      expect(result.recommendations.some(r => r.includes("resolution times"))).toBe(true);
    });

    it("recommends addressing staff behaviour pattern", () => {
      const result = analyseComplaints(makeInput({
        complaints: [
          makeComplaint({ category: "staff_behaviour" }),
          makeComplaint({ category: "staff_behaviour" }),
        ],
      }));
      expect(result.recommendations.some(r => r.includes("staff behaviour"))).toBe(true);
    });

    it("recommends Ofsted info when not provided", () => {
      const result = analyseComplaints(makeInput({ regulatoryBodyInfoProvided: false }));
      expect(result.recommendations.some(r => r.includes("Ofsted"))).toBe(true);
    });

    it("minimal recommendations for good practice", () => {
      const result = analyseComplaints(makeInput({
        complaints: [makeComplaint()],
      }));
      expect(result.recommendations.length).toBeLessThanOrEqual(1);
    });
  });

  describe("Future-date guard (no recency inflation)", () => {
    it("excludes future-dated complaints from the last-30-day count", () => {
      // now is pinned to 2026-05-16 — a record dated after today must not count as recent.
      const result = analyseComplaints(makeInput({
        complaints: [
          makeComplaint({ date: "2026-05-10" }),
          makeComplaint({ date: "2026-05-01" }),
          makeComplaint({ date: "2026-06-10" }), // future — must not inflate
        ],
      }));
      expect(result.complaintsLast30Days).toBe(2);
    });
  });
});
