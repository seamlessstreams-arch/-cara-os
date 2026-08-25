// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME RISK LANDSCAPE INTELLIGENCE ENGINE — TESTS
// Comprehensive coverage: insufficient data, rating classifications,
// distribution profile, trend profile, mitigation profile, currency profile,
// coverage profile, scoring modifiers, strengths, concerns, recommendations,
// insights, headlines, edge cases.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeHomeRiskLandscape,
  type HomeRiskLandscapeInput,
  type RiskAssessmentInput,
  type RiskMitigationInput,
} from "../home-risk-landscape-intelligence-engine";

const TODAY = "2026-05-26";

// ── Test Helpers ────────────────────────────────────────────────────────────

function makeMitigation(overrides: Partial<RiskMitigationInput> = {}): RiskMitigationInput {
  return {
    strategy: "De-escalation protocol",
    effectiveness: "effective",
    ...overrides,
  };
}

function makeAssessment(overrides: Partial<RiskAssessmentInput> = {}): RiskAssessmentInput {
  return {
    id: "ra_1",
    child_id: "c1",
    domain: "aggression",
    current_level: "medium",
    previous_level: "high",
    trend: "decreasing",
    status: "current",
    assessed_date: "2026-05-10",
    review_date: "2026-06-20",    // future — not overdue
    mitigations: [makeMitigation(), makeMitigation({ strategy: "Structured routine" })],
    has_child_views: true,
    has_contingency: true,
    linked_incident_count: 0,
    ...overrides,
  };
}

function baseInput(overrides: Partial<HomeRiskLandscapeInput> = {}): HomeRiskLandscapeInput {
  return {
    today: TODAY,
    assessments: [],
    total_children: 4,
    ...overrides,
  };
}

/**
 * Outstanding scenario: 4 children × 2 assessments each = 8 assessments
 * across 6 domains, mostly decreasing, all with effective mitigations,
 * child views, and contingency plans.
 */
function outstandingAssessments(): RiskAssessmentInput[] {
  const domains = ["aggression", "absconding", "self_harm", "exploitation", "online_safety", "emotional_harm"];
  const assessments: RiskAssessmentInput[] = [];
  for (let c = 1; c <= 4; c++) {
    for (let d = 0; d < 2; d++) {
      const domIdx = ((c - 1) * 2 + d) % 6;
      assessments.push(makeAssessment({
        id: `ra_c${c}_${d}`,
        child_id: `c${c}`,
        domain: domains[domIdx],
        current_level: d === 0 ? "low" : "medium",
        previous_level: d === 0 ? "medium" : "high",
        trend: "decreasing",
        assessed_date: "2026-05-10",
        review_date: "2026-06-20",
        mitigations: [
          makeMitigation(),
          makeMitigation({ strategy: "Alternative strategy" }),
          makeMitigation({ strategy: "Third strategy" }),
        ],
        has_child_views: true,
        has_contingency: true,
      }));
    }
  }
  return assessments;
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("computeHomeRiskLandscape", () => {

  // ─── Insufficient Data ──────────────────────────────────────

  describe("insufficient data", () => {
    it("returns insufficient_data when no assessments provided", () => {
      const r = computeHomeRiskLandscape(baseInput());
      expect(r.risk_rating).toBe("insufficient_data");
      expect(r.risk_score).toBe(0);
    });

    it("returns empty profiles on insufficient data", () => {
      const r = computeHomeRiskLandscape(baseInput());
      expect(r.distribution_profile.total_assessments).toBe(0);
      expect(r.trend_profile.decreasing_count).toBe(0);
      expect(r.mitigation_profile.total_mitigations).toBe(0);
      expect(r.coverage_profile.children_with_assessments).toBe(0);
    });

    it("returns concern, recommendation and critical insight on insufficient data", () => {
      const r = computeHomeRiskLandscape(baseInput());
      expect(r.concerns.length).toBeGreaterThan(0);
      expect(r.recommendations.length).toBeGreaterThan(0);
      expect(r.insights.some(i => i.severity === "critical")).toBe(true);
    });

    it("excludes non-current assessments", () => {
      const assessments = [
        makeAssessment({ status: "superseded" }),
        makeAssessment({ id: "ra_2", status: "draft" }),
      ];
      const r = computeHomeRiskLandscape(baseInput({ assessments }));
      expect(r.risk_rating).toBe("insufficient_data");
    });
  });

  // ─── Rating Classifications ─────────────────────────────────

  describe("rating classifications", () => {
    it("rates outstanding with excellent risk management — score 80", () => {
      // Score: 52 + trend(100% dec, 0 inc → +5) + mitigation(100% eff → +4)
      //        + currency(0% overdue → +3) + childVoice(100% → +4)
      //        + contingency(100% → +3) + coverage(100% → +3)
      //        + highRisk(0 → +3) + depth(3.0 avg → +3) = 52+28 = 80
      const assessments = outstandingAssessments();
      const r = computeHomeRiskLandscape(baseInput({ assessments }));
      expect(r.risk_rating).toBe("outstanding");
      expect(r.risk_score).toBe(80);
    });

    it("rates good with decent risk management — score ~70", () => {
      // 4 assessments, 2 decreasing, 2 stable, mitigations 60% effective,
      // 0% overdue, 75% child voice, 100% contingency, 100% coverage
      const assessments = [
        makeAssessment({ id: "r1", child_id: "c1", trend: "decreasing", mitigations: [makeMitigation(), makeMitigation({ effectiveness: "partially_effective" })] }),
        makeAssessment({ id: "r2", child_id: "c2", trend: "decreasing", mitigations: [makeMitigation(), makeMitigation({ effectiveness: "partially_effective" })] }),
        makeAssessment({ id: "r3", child_id: "c3", trend: "stable", mitigations: [makeMitigation(), makeMitigation({ effectiveness: "partially_effective" })] }),
        makeAssessment({ id: "r4", child_id: "c4", trend: "stable", has_child_views: false, mitigations: [makeMitigation(), makeMitigation({ effectiveness: "partially_effective" })] }),
      ];
      // trend: 50% dec, 0 inc → +5
      // mitigation: 4/8=50% eff → ≥50 → +2
      // currency: 0% overdue → +3
      // child voice: 75% → ≥70 → +2
      // contingency: 100% → +3
      // coverage: 100% → +3
      // high risk: 0 → +3
      // depth: 2.0 → ≥2.0 → +1
      // Total: 52+5+2+3+2+3+3+3+1 = 74
      const r = computeHomeRiskLandscape(baseInput({ assessments }));
      expect(r.risk_rating).toBe("good");
      expect(r.risk_score).toBe(74);
    });

    it("rates adequate with mixed risk profile — score ~52", () => {
      // 2 assessments: 1 increasing, 1 stable, 50% child voice,
      // 50% overdue, mixed mitigations
      const assessments = [
        makeAssessment({
          id: "r1", child_id: "c1", trend: "increasing",
          current_level: "high", previous_level: "medium",
          review_date: "2026-04-01", // overdue
          has_child_views: true,
          mitigations: [makeMitigation({ effectiveness: "partially_effective" })],
        }),
        makeAssessment({
          id: "r2", child_id: "c2", trend: "stable",
          review_date: "2026-06-20",
          has_child_views: false,
          mitigations: [makeMitigation({ effectiveness: "effective" })],
        }),
      ];
      // trend: 0% dec, 50% inc (1 of 2) → ≤25 is false (50%) → -4
      // mitigation: 1/2=50% eff → +2
      // currency: 50% overdue → ≤50 → +0
      // child voice: 50% → ≥50 → +0
      // contingency: 100% → +3
      // coverage: 50% → ≥50 → +0
      // high risk: 1/2=50% → ≤50 → +0
      // depth: 1.0 → ≥1.0 → +0
      // Total: 52-4+2+0+0+3+0+0+0 = 53
      const r = computeHomeRiskLandscape(baseInput({ assessments }));
      expect(r.risk_rating).toBe("adequate");
      expect(r.risk_score).toBe(53);
    });

    it("rates inadequate with poor risk management — score ~32", () => {
      // 1 assessment: increasing, high risk, overdue, no child views,
      // no contingency, no effective mitigations, 25% coverage
      const assessments = [
        makeAssessment({
          id: "r1", child_id: "c1", trend: "increasing",
          current_level: "very_high", previous_level: "high",
          review_date: "2026-03-01", // well overdue
          has_child_views: false,
          has_contingency: false,
          mitigations: [makeMitigation({ effectiveness: "not_effective" })],
        }),
      ];
      // trend: 0% dec, 100% inc → -4
      // mitigation: 0/1 eff = 0% → -3
      // currency: 100% overdue → -2
      // child voice: 0% → -3
      // contingency: 0% → -2
      // coverage: 25% → -2
      // high risk: 100% → -2
      // depth: 1.0 → +0
      // Total: 52-4-3-2-3-2-2-2+0 = 34
      const r = computeHomeRiskLandscape(baseInput({ assessments }));
      expect(r.risk_rating).toBe("inadequate");
      expect(r.risk_score).toBe(34);
    });
  });

  // ─── Distribution Profile ───────────────────────────────────

  describe("distribution profile", () => {
    it("counts risk levels correctly", () => {
      const assessments = [
        makeAssessment({ id: "r1", current_level: "very_high" }),
        makeAssessment({ id: "r2", current_level: "high" }),
        makeAssessment({ id: "r3", current_level: "medium" }),
        makeAssessment({ id: "r4", current_level: "low" }),
      ];
      const r = computeHomeRiskLandscape(baseInput({ assessments }));
      expect(r.distribution_profile.high_or_very_high_count).toBe(2);
      expect(r.distribution_profile.medium_count).toBe(1);
      expect(r.distribution_profile.low_count).toBe(1);
    });

    it("tracks unique domains covered", () => {
      const assessments = [
        makeAssessment({ id: "r1", domain: "aggression" }),
        makeAssessment({ id: "r2", domain: "self_harm" }),
        makeAssessment({ id: "r3", domain: "aggression" }), // duplicate
      ];
      const r = computeHomeRiskLandscape(baseInput({ assessments }));
      expect(r.distribution_profile.unique_domains).toBe(2);
      expect(r.distribution_profile.domains_covered).toContain("aggression");
      expect(r.distribution_profile.domains_covered).toContain("self_harm");
    });
  });

  // ─── Trend Profile ──────────────────────────────────────────

  describe("trend profile", () => {
    it("counts trend directions", () => {
      const assessments = [
        makeAssessment({ id: "r1", trend: "decreasing" }),
        makeAssessment({ id: "r2", trend: "decreasing" }),
        makeAssessment({ id: "r3", trend: "stable" }),
        makeAssessment({ id: "r4", trend: "increasing" }),
      ];
      const r = computeHomeRiskLandscape(baseInput({ assessments }));
      expect(r.trend_profile.decreasing_count).toBe(2);
      expect(r.trend_profile.stable_count).toBe(1);
      expect(r.trend_profile.increasing_count).toBe(1);
    });

    it("calculates trend rates", () => {
      const assessments = [
        makeAssessment({ id: "r1", trend: "decreasing" }),
        makeAssessment({ id: "r2", trend: "stable" }),
        makeAssessment({ id: "r3", trend: "increasing" }),
        makeAssessment({ id: "r4", trend: "increasing" }),
      ];
      const r = computeHomeRiskLandscape(baseInput({ assessments }));
      expect(r.trend_profile.decreasing_rate).toBe(25);
      expect(r.trend_profile.increasing_rate).toBe(50);
    });
  });

  // ─── Mitigation Profile ─────────────────────────────────────

  describe("mitigation profile", () => {
    it("counts effectiveness categories", () => {
      const assessments = [
        makeAssessment({
          id: "r1",
          mitigations: [
            makeMitigation({ effectiveness: "effective" }),
            makeMitigation({ effectiveness: "effective" }),
            makeMitigation({ effectiveness: "partially_effective" }),
          ],
        }),
        makeAssessment({
          id: "r2",
          mitigations: [
            makeMitigation({ effectiveness: "not_effective" }),
          ],
        }),
      ];
      const r = computeHomeRiskLandscape(baseInput({ assessments }));
      expect(r.mitigation_profile.effective_count).toBe(2);
      expect(r.mitigation_profile.partially_effective_count).toBe(1);
      expect(r.mitigation_profile.not_effective_count).toBe(1);
      expect(r.mitigation_profile.total_mitigations).toBe(4);
    });

    it("calculates effectiveness rate", () => {
      const assessments = [
        makeAssessment({
          id: "r1",
          mitigations: [
            makeMitigation({ effectiveness: "effective" }),
            makeMitigation({ effectiveness: "effective" }),
            makeMitigation({ effectiveness: "not_effective" }),
          ],
        }),
      ];
      const r = computeHomeRiskLandscape(baseInput({ assessments }));
      expect(r.mitigation_profile.effectiveness_rate).toBe(67); // 2/3
    });

    it("calculates average mitigations per assessment", () => {
      const assessments = [
        makeAssessment({ id: "r1", mitigations: [makeMitigation(), makeMitigation(), makeMitigation()] }),
        makeAssessment({ id: "r2", mitigations: [makeMitigation()] }),
      ];
      const r = computeHomeRiskLandscape(baseInput({ assessments }));
      expect(r.mitigation_profile.avg_mitigations_per_assessment).toBe(2); // 4/2
    });
  });

  // ─── Currency Profile ───────────────────────────────────────

  describe("currency profile", () => {
    it("calculates overdue reviews", () => {
      const assessments = [
        makeAssessment({ id: "r1", review_date: "2026-04-01" }), // overdue
        makeAssessment({ id: "r2", review_date: "2026-05-25" }), // overdue (yesterday)
        makeAssessment({ id: "r3", review_date: "2026-06-20" }), // not overdue
      ];
      const r = computeHomeRiskLandscape(baseInput({ assessments }));
      expect(r.currency_profile.overdue_reviews).toBe(2);
      expect(r.currency_profile.overdue_rate).toBe(67); // 2/3
    });

    it("counts upcoming reviews in 7 days", () => {
      const assessments = [
        makeAssessment({ id: "r1", review_date: "2026-05-27" }), // tomorrow — within 7d
        makeAssessment({ id: "r2", review_date: "2026-06-01" }), // 6 days — within 7d
        makeAssessment({ id: "r3", review_date: "2026-06-15" }), // outside 7d
      ];
      const r = computeHomeRiskLandscape(baseInput({ assessments }));
      expect(r.currency_profile.upcoming_reviews_7d).toBe(2);
    });

    it("calculates average days since assessment", () => {
      const assessments = [
        makeAssessment({ id: "r1", assessed_date: "2026-05-16" }), // 10 days
        makeAssessment({ id: "r2", assessed_date: "2026-05-06" }), // 20 days
      ];
      const r = computeHomeRiskLandscape(baseInput({ assessments }));
      expect(r.currency_profile.avg_days_since_assessment).toBe(15);
    });
  });

  // ─── Coverage Profile ───────────────────────────────────────

  describe("coverage profile", () => {
    it("counts children with and without assessments", () => {
      const assessments = [
        makeAssessment({ id: "r1", child_id: "c1" }),
        makeAssessment({ id: "r2", child_id: "c2" }),
      ];
      const r = computeHomeRiskLandscape(baseInput({ assessments, total_children: 4 }));
      expect(r.coverage_profile.children_with_assessments).toBe(2);
      expect(r.coverage_profile.children_without_assessments).toBe(2);
      expect(r.coverage_profile.child_coverage_rate).toBe(50);
    });

    it("calculates child voice and contingency rates", () => {
      const assessments = [
        makeAssessment({ id: "r1", has_child_views: true, has_contingency: true }),
        makeAssessment({ id: "r2", has_child_views: true, has_contingency: false }),
        makeAssessment({ id: "r3", has_child_views: false, has_contingency: true }),
      ];
      const r = computeHomeRiskLandscape(baseInput({ assessments }));
      expect(r.coverage_profile.child_voice_rate).toBe(67); // 2/3
      expect(r.coverage_profile.contingency_rate).toBe(67); // 2/3
    });

    it("handles total_children = 0 with assessments present", () => {
      const assessments = [makeAssessment()];
      const r = computeHomeRiskLandscape(baseInput({ assessments, total_children: 0 }));
      expect(r.coverage_profile.child_coverage_rate).toBe(100);
    });
  });

  // ─── Scoring Modifiers ──────────────────────────────────────

  describe("scoring modifiers", () => {
    it("modifier 1: 50%+ decreasing + 0 increasing gives +5", () => {
      const dec = [
        makeAssessment({ id: "r1", trend: "decreasing" }),
        makeAssessment({ id: "r2", trend: "decreasing" }),
      ];
      const inc = [
        makeAssessment({ id: "r1", trend: "increasing" }),
        makeAssessment({ id: "r2", trend: "increasing" }),
      ];
      const rD = computeHomeRiskLandscape(baseInput({ assessments: dec }));
      const rI = computeHomeRiskLandscape(baseInput({ assessments: inc }));
      // dec: +5, inc (100% >25): -4 → diff 9
      expect(rD.risk_score! - rI.risk_score!).toBe(9);
    });

    it("modifier 2: 70%+ mitigation effectiveness gives +4", () => {
      const eff = [makeAssessment({ mitigations: [makeMitigation()] })]; // 100% eff
      const noEff = [makeAssessment({ mitigations: [makeMitigation({ effectiveness: "not_effective" })] })];
      const rE = computeHomeRiskLandscape(baseInput({ assessments: eff }));
      const rN = computeHomeRiskLandscape(baseInput({ assessments: noEff }));
      // 100% eff → +4, 0% eff → -3 → diff 7
      expect(rE.risk_score! - rN.risk_score!).toBe(7);
    });

    it("modifier 3: 0% overdue gives +3", () => {
      const notOverdue = [makeAssessment({ review_date: "2026-06-20" })];
      const allOverdue = [makeAssessment({ review_date: "2026-03-01" })];
      const rN = computeHomeRiskLandscape(baseInput({ assessments: notOverdue }));
      const rO = computeHomeRiskLandscape(baseInput({ assessments: allOverdue }));
      expect(rN.risk_score! - rO.risk_score!).toBe(5); // +3 vs -2
    });

    it("modifier 4: 90%+ child voice gives +4", () => {
      const withVoice = [makeAssessment({ has_child_views: true })];
      const noVoice = [makeAssessment({ has_child_views: false })];
      const rV = computeHomeRiskLandscape(baseInput({ assessments: withVoice }));
      const rN = computeHomeRiskLandscape(baseInput({ assessments: noVoice }));
      expect(rV.risk_score! - rN.risk_score!).toBe(7); // +4 vs -3
    });

    it("modifier 5: 90%+ contingency gives +3", () => {
      const withCont = [makeAssessment({ has_contingency: true })];
      const noCont = [makeAssessment({ has_contingency: false })];
      const rC = computeHomeRiskLandscape(baseInput({ assessments: withCont }));
      const rN = computeHomeRiskLandscape(baseInput({ assessments: noCont }));
      expect(rC.risk_score! - rN.risk_score!).toBe(5); // +3 vs -2
    });

    it("modifier 7: 0 high/very_high gives +3", () => {
      const lowRisk = [makeAssessment({ current_level: "low" })];
      const highRisk = [makeAssessment({ current_level: "very_high" })];
      const rL = computeHomeRiskLandscape(baseInput({ assessments: lowRisk }));
      const rH = computeHomeRiskLandscape(baseInput({ assessments: highRisk }));
      expect(rL.risk_score! - rH.risk_score!).toBe(5); // +3 vs -2
    });

    it("modifier 8: avg 2.5+ mitigations gives +3", () => {
      const deep = [makeAssessment({ mitigations: [makeMitigation(), makeMitigation(), makeMitigation()] })];
      const shallow = [makeAssessment({ mitigations: [] })];
      const rD = computeHomeRiskLandscape(baseInput({ assessments: deep }));
      const rS = computeHomeRiskLandscape(baseInput({ assessments: shallow }));
      // deep: 3.0 → +3, shallow: 0 mitigations → mitigation eff also changes
      // shallow has 0 mitigations → effectivenessRate 0 → modifier 2 becomes -3 (no mitigations)
      // deep has 100% eff → +4
      // So diff includes both mod 2 (+4 vs -3) = 7 and mod 8 (+3 vs -2) = 5
      // Total diff = 12
      expect(rD.risk_score! - rS.risk_score!).toBe(12);
    });
  });

  // ─── Strengths ──────────────────────────────────────────────

  describe("strengths", () => {
    it("includes decreasing trend strength when ≥50%", () => {
      const assessments = outstandingAssessments();
      const r = computeHomeRiskLandscape(baseInput({ assessments }));
      expect(r.strengths.some(s => s.includes("decreasing"))).toBe(true);
    });

    it("includes mitigation effectiveness strength when ≥70%", () => {
      const assessments = outstandingAssessments();
      const r = computeHomeRiskLandscape(baseInput({ assessments }));
      expect(r.strengths.some(s => s.includes("effective"))).toBe(true);
    });

    it("includes child voice strength when ≥90%", () => {
      const assessments = outstandingAssessments();
      const r = computeHomeRiskLandscape(baseInput({ assessments }));
      expect(r.strengths.some(s => s.includes("child views") || s.includes("voice"))).toBe(true);
    });

    it("includes no increasing risk strength", () => {
      const assessments = outstandingAssessments();
      const r = computeHomeRiskLandscape(baseInput({ assessments }));
      expect(r.strengths.some(s => s.includes("increasing") && s.includes("No"))).toBe(true);
    });
  });

  // ─── Concerns ───────────────────────────────────────────────

  describe("concerns", () => {
    it("flags increasing trends as a concern", () => {
      const assessments = [makeAssessment({ trend: "increasing", current_level: "high" })];
      const r = computeHomeRiskLandscape(baseInput({ assessments }));
      expect(r.concerns.some(c => c.includes("increasing"))).toBe(true);
    });

    it("flags high overdue rate as a concern", () => {
      const assessments = [
        makeAssessment({ id: "r1", review_date: "2026-03-01" }),
        makeAssessment({ id: "r2", review_date: "2026-04-01" }),
      ];
      const r = computeHomeRiskLandscape(baseInput({ assessments }));
      expect(r.concerns.some(c => c.includes("overdue"))).toBe(true);
    });

    it("flags low child voice as a concern", () => {
      const assessments = [
        makeAssessment({ id: "r1", has_child_views: false }),
        makeAssessment({ id: "r2", has_child_views: false }),
      ];
      const r = computeHomeRiskLandscape(baseInput({ assessments }));
      expect(r.concerns.some(c => c.includes("voice") || c.includes("views"))).toBe(true);
    });

    it("flags not effective mitigations as a concern", () => {
      const assessments = [
        makeAssessment({ mitigations: [makeMitigation({ effectiveness: "not_effective" })] }),
      ];
      const r = computeHomeRiskLandscape(baseInput({ assessments }));
      expect(r.concerns.some(c => c.includes("not effective"))).toBe(true);
    });
  });

  // ─── Recommendations ────────────────────────────────────────

  describe("recommendations", () => {
    it("recommends review for increasing risks", () => {
      const assessments = [makeAssessment({ trend: "increasing" })];
      const r = computeHomeRiskLandscape(baseInput({ assessments }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("increasing"))).toBe(true);
      expect(r.recommendations.some(rec => rec.urgency === "immediate")).toBe(true);
    });

    it("recommends overdue review scheduling", () => {
      const assessments = [
        makeAssessment({ id: "r1", review_date: "2026-03-01" }),
        makeAssessment({ id: "r2", review_date: "2026-04-01" }),
      ];
      const r = computeHomeRiskLandscape(baseInput({ assessments }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("overdue"))).toBe(true);
    });

    it("recommends assessments for uncovered children", () => {
      const assessments = [makeAssessment({ child_id: "c1" })];
      const r = computeHomeRiskLandscape(baseInput({ assessments, total_children: 4 }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("no risk assessment"))).toBe(true);
    });
  });

  // ─── Insights ───────────────────────────────────────────────

  describe("insights", () => {
    it("generates positive insight for outstanding rating", () => {
      const assessments = outstandingAssessments();
      const r = computeHomeRiskLandscape(baseInput({ assessments }));
      expect(r.insights.some(i => i.severity === "positive")).toBe(true);
    });

    it("generates warning/critical insight for increasing trends", () => {
      const assessments = [makeAssessment({ trend: "increasing" })];
      const r = computeHomeRiskLandscape(baseInput({ assessments }));
      expect(r.insights.some(i => (i.severity === "critical" || i.severity === "warning") && i.text.includes("increasing"))).toBe(true);
    });

    it("generates critical insight for overdue reviews > 50%", () => {
      const assessments = [
        makeAssessment({ id: "r1", review_date: "2026-03-01" }),
        makeAssessment({ id: "r2", review_date: "2026-04-01" }),
      ];
      const r = computeHomeRiskLandscape(baseInput({ assessments }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("overdue"))).toBe(true);
    });

    it("generates critical insight for uncovered children", () => {
      const assessments = [makeAssessment({ child_id: "c1" })];
      const r = computeHomeRiskLandscape(baseInput({ assessments, total_children: 3 }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("no current risk assessment"))).toBe(true);
    });
  });

  // ─── Headlines ──────────────────────────────────────────────

  describe("headlines", () => {
    it("outstanding headline includes assessment count", () => {
      const assessments = outstandingAssessments();
      const r = computeHomeRiskLandscape(baseInput({ assessments }));
      expect(r.headline).toContain("Outstanding");
      expect(r.headline).toContain("8");
    });

    it("good headline", () => {
      const assessments = [
        makeAssessment({ id: "r1", child_id: "c1", trend: "decreasing", mitigations: [makeMitigation(), makeMitigation({ effectiveness: "partially_effective" })] }),
        makeAssessment({ id: "r2", child_id: "c2", trend: "decreasing", mitigations: [makeMitigation(), makeMitigation({ effectiveness: "partially_effective" })] }),
        makeAssessment({ id: "r3", child_id: "c3", trend: "stable", mitigations: [makeMitigation(), makeMitigation({ effectiveness: "partially_effective" })] }),
        makeAssessment({ id: "r4", child_id: "c4", trend: "stable", has_child_views: false, mitigations: [makeMitigation(), makeMitigation({ effectiveness: "partially_effective" })] }),
      ];
      const r = computeHomeRiskLandscape(baseInput({ assessments }));
      expect(r.headline).toContain("Good");
    });

    it("inadequate headline reflects urgency", () => {
      const assessments = [
        makeAssessment({
          trend: "increasing", current_level: "very_high",
          has_child_views: false, has_contingency: false,
          review_date: "2026-03-01",
          mitigations: [makeMitigation({ effectiveness: "not_effective" })],
        }),
      ];
      const r = computeHomeRiskLandscape(baseInput({ assessments }));
      expect(r.headline.toLowerCase()).toContain("inadequate");
    });

    it("insufficient data headline", () => {
      const r = computeHomeRiskLandscape(baseInput());
      expect(r.headline).toContain("No current risk assessments");
    });
  });

  // ─── Edge Cases ─────────────────────────────────────────────

  describe("edge cases", () => {
    it("handles single assessment correctly", () => {
      const assessments = [makeAssessment()];
      const r = computeHomeRiskLandscape(baseInput({ assessments, total_children: 1 }));
      expect(r.coverage_profile.children_with_assessments).toBe(1);
      expect(r.risk_score).toBeGreaterThan(0);
    });

    it("score stays within 0-100 bounds", () => {
      const assessments = outstandingAssessments();
      const r = computeHomeRiskLandscape(baseInput({ assessments }));
      expect(r.risk_score).toBeGreaterThanOrEqual(0);
      expect(r.risk_score).toBeLessThanOrEqual(100);
    });

    it("handles zero mitigations", () => {
      const assessments = [makeAssessment({ mitigations: [] })];
      const r = computeHomeRiskLandscape(baseInput({ assessments }));
      expect(r.mitigation_profile.total_mitigations).toBe(0);
      expect(r.mitigation_profile.effectiveness_rate).toBeNull();
      expect(r.mitigation_profile.avg_mitigations_per_assessment).toBe(0);
    });

    it("handles future assessed_date gracefully", () => {
      const assessments = [makeAssessment({ assessed_date: "2026-06-01" })];
      const r = computeHomeRiskLandscape(baseInput({ assessments }));
      // daysBetween clamps to 0
      expect(r.currency_profile.avg_days_since_assessment).toBe(0);
    });
  });
});
