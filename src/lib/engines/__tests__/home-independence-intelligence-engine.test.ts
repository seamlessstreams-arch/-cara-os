// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME INDEPENDENCE & TRANSITION INTELLIGENCE ENGINE TESTS
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeHomeIndependence,
  type HomeIndependenceInput,
  type IndependencePathwayInput,
} from "../home-independence-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makePathway(overrides: Partial<IndependencePathwayInput> = {}): IndependencePathwayInput {
  return {
    id: "ip_1",
    child_id: "yp_alex",
    assessment_date: "2026-05-12",
    review_date: "2026-07-12",
    overall_readiness: 70,
    status: "on_track",
    pathway_plan_linked: true,
    domain_count: 8,
    domain_avg_score: 6.5,
    lowest_domain_score: 4,
    highest_domain_score: 8,
    low_scoring_domains: 0,
    has_evidence: true,
    has_next_steps: true,
    ...overrides,
  };
}

function baseInput(overrides: Partial<HomeIndependenceInput> = {}): HomeIndependenceInput {
  return {
    today: "2026-05-26",
    total_children: 3,
    child_ids: ["yp_alex", "yp_jordan", "yp_casey"],
    pathways: [
      makePathway({ id: "p1", child_id: "yp_alex", overall_readiness: 75, domain_avg_score: 6.5, status: "on_track" }),
      makePathway({ id: "p2", child_id: "yp_jordan", overall_readiness: 72, domain_avg_score: 6.0, status: "on_track" }),
      makePathway({ id: "p3", child_id: "yp_casey", overall_readiness: 68, domain_avg_score: 5.8, status: "on_track" }),
    ],
    ...overrides,
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Home Independence Intelligence Engine", () => {

  // ── Structure ─────────────────────────────────────────────────────────────

  it("returns a well-shaped result", () => {
    const r = computeHomeIndependence(baseInput());
    expect(r).toHaveProperty("independence_rating");
    expect(r).toHaveProperty("independence_score");
    expect(r).toHaveProperty("headline");
    expect(r).toHaveProperty("independence_profile");
    expect(r).toHaveProperty("domain_analysis");
    expect(r).toHaveProperty("strengths");
    expect(r).toHaveProperty("concerns");
    expect(r).toHaveProperty("recommendations");
    expect(r).toHaveProperty("insights");
  });

  it("assigns a valid rating", () => {
    const r = computeHomeIndependence(baseInput());
    expect(["outstanding", "good", "adequate", "inadequate", "insufficient_data"]).toContain(r.independence_rating);
  });

  it("scores between 0 and 100", () => {
    const r = computeHomeIndependence(baseInput());
    expect(r.independence_score).toBeGreaterThanOrEqual(0);
    expect(r.independence_score).toBeLessThanOrEqual(100);
  });

  // ── Insufficient Data ─────────────────────────────────────────────────────

  it("returns insufficient_data with no pathways", () => {
    const r = computeHomeIndependence(baseInput({ pathways: [] }));
    expect(r.independence_rating).toBe("insufficient_data");
    expect(r.independence_score).toBe(0);
  });

  it("has concerns and recommendations when no data", () => {
    const r = computeHomeIndependence(baseInput({ pathways: [] }));
    expect(r.concerns.length).toBeGreaterThan(0);
    expect(r.recommendations.length).toBeGreaterThan(0);
    expect(r.insights.length).toBeGreaterThan(0);
  });

  // ── Independence Profile ──────────────────────────────────────────────────

  it("counts total assessments", () => {
    const r = computeHomeIndependence(baseInput());
    expect(r.independence_profile.total_assessments).toBe(3);
  });

  it("identifies children with assessments", () => {
    const r = computeHomeIndependence(baseInput());
    expect(r.independence_profile.children_with_assessments).toEqual(
      expect.arrayContaining(["yp_alex", "yp_jordan", "yp_casey"]),
    );
  });

  it("identifies children without assessments", () => {
    const r = computeHomeIndependence(baseInput({
      pathways: [makePathway({ id: "p1", child_id: "yp_alex" })],
    }));
    expect(r.independence_profile.children_without_assessments).toEqual(
      expect.arrayContaining(["yp_jordan", "yp_casey"]),
    );
  });

  it("calculates average readiness", () => {
    const r = computeHomeIndependence(baseInput());
    // (75 + 72 + 68) / 3 = 71.67 → 72
    expect(r.independence_profile.avg_readiness).toBe(72);
  });

  it("counts on_track pathways", () => {
    const r = computeHomeIndependence(baseInput());
    expect(r.independence_profile.on_track_count).toBe(3);
  });

  it("counts attention_needed pathways", () => {
    const r = computeHomeIndependence(baseInput({
      pathways: [
        makePathway({ id: "p1", child_id: "yp_alex", status: "attention_needed" }),
        makePathway({ id: "p2", child_id: "yp_jordan", status: "on_track" }),
      ],
    }));
    expect(r.independence_profile.attention_needed_count).toBe(1);
  });

  it("calculates pathway plan linkage rate", () => {
    const r = computeHomeIndependence(baseInput({
      pathways: [
        makePathway({ id: "p1", child_id: "yp_alex", pathway_plan_linked: true }),
        makePathway({ id: "p2", child_id: "yp_jordan", pathway_plan_linked: false }),
      ],
    }));
    expect(r.independence_profile.pathway_plan_linkage_rate).toBe(50);
  });

  it("detects overdue reviews", () => {
    const r = computeHomeIndependence(baseInput({
      pathways: [
        makePathway({ id: "p1", child_id: "yp_alex", review_date: "2026-05-01" }),
        makePathway({ id: "p2", child_id: "yp_jordan", review_date: "2026-07-01" }),
      ],
    }));
    expect(r.independence_profile.overdue_reviews).toBe(1);
  });

  it("calculates evidence rate", () => {
    const r = computeHomeIndependence(baseInput({
      pathways: [
        makePathway({ id: "p1", child_id: "yp_alex", has_evidence: true }),
        makePathway({ id: "p2", child_id: "yp_jordan", has_evidence: false }),
      ],
    }));
    expect(r.independence_profile.evidence_rate).toBe(50);
  });

  it("calculates next steps rate", () => {
    const r = computeHomeIndependence(baseInput({
      pathways: [
        makePathway({ id: "p1", child_id: "yp_alex", has_next_steps: true }),
        makePathway({ id: "p2", child_id: "yp_jordan", has_next_steps: false }),
      ],
    }));
    expect(r.independence_profile.next_steps_rate).toBe(50);
  });

  // ── Domain Analysis ───────────────────────────────────────────────────────

  it("calculates average domain score", () => {
    const r = computeHomeIndependence(baseInput());
    // (6.5 + 6.0 + 5.8) / 3 = 6.1
    expect(r.domain_analysis.avg_domain_score).toBe(6.1);
  });

  it("counts total low-scoring domains", () => {
    const r = computeHomeIndependence(baseInput({
      pathways: [
        makePathway({ id: "p1", child_id: "yp_alex", low_scoring_domains: 1 }),
        makePathway({ id: "p2", child_id: "yp_jordan", low_scoring_domains: 2 }),
      ],
    }));
    expect(r.domain_analysis.low_scoring_total).toBe(3);
  });

  it("calculates pathway avg range", () => {
    const r = computeHomeIndependence(baseInput());
    expect(r.domain_analysis.lowest_pathway_avg).toBe(5.8);
    expect(r.domain_analysis.highest_pathway_avg).toBe(6.5);
  });

  it("calculates readiness gap", () => {
    const r = computeHomeIndependence(baseInput({
      pathways: [
        makePathway({ id: "p1", child_id: "yp_alex", overall_readiness: 80 }),
        makePathway({ id: "p2", child_id: "yp_jordan", overall_readiness: 40 }),
      ],
    }));
    expect(r.domain_analysis.readiness_gap).toBe(40);
  });

  // ── Rating Boundaries ─────────────────────────────────────────────────────

  it("rates outstanding (score >= 80)", () => {
    const r = computeHomeIndependence(baseInput());
    expect(r.independence_score).toBeGreaterThanOrEqual(80);
    expect(r.independence_rating).toBe("outstanding");
  });

  it("rates good (65 <= score < 80)", () => {
    // All covered, but mixed status and missing linkage
    const r = computeHomeIndependence(baseInput({
      pathways: [
        makePathway({ id: "p1", child_id: "yp_alex", overall_readiness: 60, domain_avg_score: 5.5, status: "on_track", pathway_plan_linked: false }),
        makePathway({ id: "p2", child_id: "yp_jordan", overall_readiness: 55, domain_avg_score: 5.0, status: "attention_needed", pathway_plan_linked: true }),
        makePathway({ id: "p3", child_id: "yp_casey", overall_readiness: 52, domain_avg_score: 5.0, status: "on_track", pathway_plan_linked: true }),
      ],
    }));
    expect(r.independence_score).toBeGreaterThanOrEqual(65);
    expect(r.independence_score).toBeLessThan(80);
    expect(r.independence_rating).toBe("good");
  });

  it("rates adequate (45 <= score < 65)", () => {
    // One missing child, moderate readiness, overdue review, no linkage
    const r = computeHomeIndependence(baseInput({
      pathways: [
        makePathway({ id: "p1", child_id: "yp_alex", overall_readiness: 52, domain_avg_score: 5.0, status: "on_track", pathway_plan_linked: false, review_date: "2026-05-01" }),
        makePathway({ id: "p2", child_id: "yp_jordan", overall_readiness: 48, domain_avg_score: 4.5, status: "attention_needed", pathway_plan_linked: false }),
      ],
    }));
    expect(r.independence_score).toBeGreaterThanOrEqual(45);
    expect(r.independence_score).toBeLessThan(65);
    expect(r.independence_rating).toBe("adequate");
  });

  it("rates inadequate (score < 45)", () => {
    // Missing children, very low readiness, no linkage, overdue
    const r = computeHomeIndependence(baseInput({
      pathways: [
        makePathway({
          id: "p1", child_id: "yp_alex", overall_readiness: 20, domain_avg_score: 2.5,
          status: "attention_needed", pathway_plan_linked: false,
          review_date: "2026-04-01", has_evidence: false, has_next_steps: false,
          low_scoring_domains: 4,
        }),
      ],
    }));
    expect(r.independence_score).toBeLessThan(45);
    expect(r.independence_rating).toBe("inadequate");
  });

  // ── Scoring Modifiers ─────────────────────────────────────────────────────

  it("penalises low readiness", () => {
    const high = computeHomeIndependence(baseInput({
      pathways: [makePathway({ id: "p1", child_id: "yp_alex", overall_readiness: 75 })],
    }));
    const low = computeHomeIndependence(baseInput({
      pathways: [makePathway({ id: "p1", child_id: "yp_alex", overall_readiness: 25 })],
    }));
    expect(low.independence_score).toBeLessThan(high.independence_score!);
  });

  it("rewards all pathways on track", () => {
    const allOnTrack = computeHomeIndependence(baseInput({
      pathways: [
        makePathway({ id: "p1", child_id: "yp_alex", status: "on_track" }),
        makePathway({ id: "p2", child_id: "yp_jordan", status: "on_track" }),
      ],
    }));
    const mixed = computeHomeIndependence(baseInput({
      pathways: [
        makePathway({ id: "p1", child_id: "yp_alex", status: "on_track" }),
        makePathway({ id: "p2", child_id: "yp_jordan", status: "attention_needed" }),
      ],
    }));
    expect(allOnTrack.independence_score).toBeGreaterThan(mixed.independence_score!);
  });

  it("penalises missing pathway plan linkage", () => {
    const linked = computeHomeIndependence(baseInput({
      pathways: [makePathway({ id: "p1", child_id: "yp_alex", pathway_plan_linked: true })],
    }));
    const notLinked = computeHomeIndependence(baseInput({
      pathways: [makePathway({ id: "p1", child_id: "yp_alex", pathway_plan_linked: false })],
    }));
    expect(notLinked.independence_score).toBeLessThan(linked.independence_score!);
  });

  it("penalises overdue reviews", () => {
    const current = computeHomeIndependence(baseInput({
      pathways: [makePathway({ id: "p1", child_id: "yp_alex", review_date: "2026-07-01" })],
    }));
    const overdue = computeHomeIndependence(baseInput({
      pathways: [makePathway({ id: "p1", child_id: "yp_alex", review_date: "2026-04-01" })],
    }));
    expect(overdue.independence_score).toBeLessThan(current.independence_score!);
  });

  it("rewards strong domain scores", () => {
    const strong = computeHomeIndependence(baseInput({
      pathways: [makePathway({ id: "p1", child_id: "yp_alex", domain_avg_score: 7.5 })],
    }));
    const weak = computeHomeIndependence(baseInput({
      pathways: [makePathway({ id: "p1", child_id: "yp_alex", domain_avg_score: 2.5 })],
    }));
    expect(strong.independence_score).toBeGreaterThan(weak.independence_score!);
  });

  it("penalises many low-scoring domains", () => {
    const none = computeHomeIndependence(baseInput({
      pathways: [makePathway({ id: "p1", child_id: "yp_alex", low_scoring_domains: 0 })],
    }));
    const many = computeHomeIndependence(baseInput({
      pathways: [makePathway({ id: "p1", child_id: "yp_alex", low_scoring_domains: 5 })],
    }));
    expect(many.independence_score).toBeLessThan(none.independence_score!);
  });

  it("rewards complete evidence and next steps", () => {
    const complete = computeHomeIndependence(baseInput({
      pathways: [makePathway({ id: "p1", child_id: "yp_alex", has_evidence: true, has_next_steps: true })],
    }));
    const incomplete = computeHomeIndependence(baseInput({
      pathways: [makePathway({ id: "p1", child_id: "yp_alex", has_evidence: false, has_next_steps: false })],
    }));
    expect(complete.independence_score).toBeGreaterThan(incomplete.independence_score!);
  });

  // ── Strengths ─────────────────────────────────────────────────────────────

  it("notes strength for all children covered", () => {
    const r = computeHomeIndependence(baseInput());
    expect(r.strengths.some(s => s.toLowerCase().includes("all children"))).toBe(true);
  });

  it("notes strength for good readiness", () => {
    const r = computeHomeIndependence(baseInput());
    expect(r.strengths.some(s => s.toLowerCase().includes("readiness"))).toBe(true);
  });

  it("notes strength for all on track", () => {
    const r = computeHomeIndependence(baseInput());
    expect(r.strengths.some(s => s.toLowerCase().includes("on track"))).toBe(true);
  });

  it("notes strength for pathway linkage", () => {
    const r = computeHomeIndependence(baseInput());
    expect(r.strengths.some(s => s.toLowerCase().includes("linked"))).toBe(true);
  });

  it("notes strength for up-to-date reviews", () => {
    const r = computeHomeIndependence(baseInput());
    expect(r.strengths.some(s => s.toLowerCase().includes("up to date"))).toBe(true);
  });

  // ── Concerns ──────────────────────────────────────────────────────────────

  it("raises concern for children without assessments", () => {
    const r = computeHomeIndependence(baseInput({
      pathways: [makePathway({ id: "p1", child_id: "yp_alex" })],
    }));
    expect(r.concerns.some(c => c.toLowerCase().includes("without"))).toBe(true);
  });

  it("raises concern for low readiness", () => {
    const r = computeHomeIndependence(baseInput({
      pathways: [
        makePathway({ id: "p1", child_id: "yp_alex", overall_readiness: 30 }),
        makePathway({ id: "p2", child_id: "yp_jordan", overall_readiness: 25 }),
        makePathway({ id: "p3", child_id: "yp_casey", overall_readiness: 35 }),
      ],
    }));
    expect(r.concerns.some(c => c.toLowerCase().includes("readiness"))).toBe(true);
  });

  it("raises concern for attention needed pathways", () => {
    const r = computeHomeIndependence(baseInput({
      pathways: [
        makePathway({ id: "p1", child_id: "yp_alex", status: "attention_needed" }),
      ],
    }));
    expect(r.concerns.some(c => c.toLowerCase().includes("attention"))).toBe(true);
  });

  it("raises concern for overdue reviews", () => {
    const r = computeHomeIndependence(baseInput({
      pathways: [
        makePathway({ id: "p1", child_id: "yp_alex", review_date: "2026-04-01" }),
      ],
    }));
    expect(r.concerns.some(c => c.toLowerCase().includes("overdue"))).toBe(true);
  });

  it("raises concern for large readiness gap", () => {
    const r = computeHomeIndependence(baseInput({
      pathways: [
        makePathway({ id: "p1", child_id: "yp_alex", overall_readiness: 85 }),
        makePathway({ id: "p2", child_id: "yp_jordan", overall_readiness: 40 }),
      ],
    }));
    expect(r.concerns.some(c => c.toLowerCase().includes("gap"))).toBe(true);
  });

  // ── Recommendations ───────────────────────────────────────────────────────

  it("recommends assessments for uncovered children", () => {
    const r = computeHomeIndependence(baseInput({
      pathways: [makePathway({ id: "p1", child_id: "yp_alex" })],
    }));
    expect(r.recommendations.some(rec => rec.recommendation.toLowerCase().includes("complete") && rec.urgency === "immediate")).toBe(true);
  });

  it("recommends pathway plan linkage", () => {
    const r = computeHomeIndependence(baseInput({
      pathways: [
        makePathway({ id: "p1", child_id: "yp_alex", pathway_plan_linked: false }),
      ],
    }));
    expect(r.recommendations.some(rec => rec.recommendation.toLowerCase().includes("link"))).toBe(true);
  });

  it("recommendations have ranked order", () => {
    const r = computeHomeIndependence(baseInput({
      pathways: [
        makePathway({ id: "p1", child_id: "yp_alex", pathway_plan_linked: false, review_date: "2026-04-01" }),
      ],
    }));
    const ranks = r.recommendations.map(rec => rec.rank);
    for (let i = 1; i < ranks.length; i++) {
      expect(ranks[i]).toBeGreaterThan(ranks[i - 1]);
    }
  });

  // ── Insights ──────────────────────────────────────────────────────────────

  it("generates critical insight for missing assessments", () => {
    const r = computeHomeIndependence(baseInput({
      pathways: [makePathway({ id: "p1", child_id: "yp_alex" })],
    }));
    expect(r.insights.some(i => i.severity === "critical" && i.text.toLowerCase().includes("without"))).toBe(true);
  });

  it("generates positive insight for good readiness", () => {
    const r = computeHomeIndependence(baseInput());
    expect(r.insights.some(i => i.severity === "positive" && i.text.toLowerCase().includes("readiness"))).toBe(true);
  });

  it("generates positive insight for no low-scoring domains", () => {
    const r = computeHomeIndependence(baseInput());
    expect(r.insights.some(i => i.severity === "positive" && i.text.toLowerCase().includes("low-scoring"))).toBe(true);
  });

  it("generates positive insight for pathway linkage", () => {
    const r = computeHomeIndependence(baseInput());
    expect(r.insights.some(i => i.severity === "positive" && i.text.toLowerCase().includes("linked"))).toBe(true);
  });

  it("generates warning insight for readiness gap", () => {
    const r = computeHomeIndependence(baseInput({
      pathways: [
        makePathway({ id: "p1", child_id: "yp_alex", overall_readiness: 85 }),
        makePathway({ id: "p2", child_id: "yp_jordan", overall_readiness: 40 }),
      ],
    }));
    expect(r.insights.some(i => i.severity === "warning" && i.text.toLowerCase().includes("gap"))).toBe(true);
  });

  // ── Headlines ─────────────────────────────────────────────────────────────

  it("outstanding headline mentions outstanding", () => {
    const r = computeHomeIndependence(baseInput());
    expect(r.headline.toLowerCase()).toContain("outstanding");
  });

  it("inadequate headline mentions inadequate", () => {
    const r = computeHomeIndependence(baseInput({
      pathways: [
        makePathway({
          id: "p1", child_id: "yp_alex", overall_readiness: 20, domain_avg_score: 2.5,
          status: "attention_needed", pathway_plan_linked: false,
          review_date: "2026-04-01", has_evidence: false, has_next_steps: false,
          low_scoring_domains: 4,
        }),
      ],
    }));
    expect(r.headline.toLowerCase()).toContain("inadequate");
  });

  // ── Edge Cases ────────────────────────────────────────────────────────────

  it("clamps score to minimum 0", () => {
    const r = computeHomeIndependence(baseInput({
      total_children: 10,
      child_ids: Array.from({ length: 10 }, (_, i) => `yp_${i}`),
      pathways: [
        makePathway({
          id: "p1", child_id: "yp_0", overall_readiness: 10, domain_avg_score: 1.5,
          status: "attention_needed", pathway_plan_linked: false,
          review_date: "2026-04-01", has_evidence: false, has_next_steps: false,
          low_scoring_domains: 6,
        }),
      ],
    }));
    expect(r.independence_score).toBeGreaterThanOrEqual(0);
  });

  it("clamps score to maximum 100", () => {
    const r = computeHomeIndependence(baseInput({
      pathways: [
        makePathway({ id: "p1", child_id: "yp_alex", overall_readiness: 95, domain_avg_score: 9.0 }),
        makePathway({ id: "p2", child_id: "yp_jordan", overall_readiness: 92, domain_avg_score: 8.5 }),
        makePathway({ id: "p3", child_id: "yp_casey", overall_readiness: 90, domain_avg_score: 8.0 }),
      ],
    }));
    expect(r.independence_score).toBeLessThanOrEqual(100);
  });

  it("handles zero children gracefully", () => {
    const r = computeHomeIndependence(baseInput({
      total_children: 0,
      child_ids: [],
      pathways: [],
    }));
    expect(r.independence_rating).toBe("insufficient_data");
  });

  it("completed status counts as on track", () => {
    const r = computeHomeIndependence(baseInput({
      pathways: [
        makePathway({ id: "p1", child_id: "yp_alex", status: "completed" }),
      ],
    }));
    expect(r.independence_profile.on_track_count).toBe(1);
  });
});
