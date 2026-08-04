import { describe, it, expect } from "vitest";
import {
  computeHomeStrategicRisk,
  type HomeStrategicRiskInput,
  type DailyRiskBriefingInput,
  type RiskRegisterEntryInput,
  type StrategicRiskInput,
  type RiskManagementPlanInput,
  type RiskAppetiteInput,
} from "../home-strategic-risk-intelligence-engine";

/* ── helpers ────────────────────────────────────────────────────────────────── */

const makeBriefing = (o: Partial<DailyRiskBriefingInput> = {}): DailyRiskBriefingInput => ({
  id: "b1", date: "2026-05-14", shift_type: "day",
  child_risks_count: 2, home_alerts_count: 1, staff_on_shift_count: 3, ...o,
});

const makeRegEntry = (o: Partial<RiskRegisterEntryInput> = {}): RiskRegisterEntryInput => ({
  id: "rr1", risk_level: "medium", status: "mitigated",
  mitigations_count: 3, review_date: "2026-06-01", last_reviewed: "2026-05-01", ...o,
});

const makeStrategic = (o: Partial<StrategicRiskInput> = {}): StrategicRiskInput => ({
  id: "sr1", category: "operational",
  current_likelihood: 2, current_impact: 3, residual_risk_score: 6,
  target_risk_score: 6, controls_count: 4, additional_controls_needed: 0,
  last_reviewed: "2026-05-01", next_review_date: "2026-08-01",
  board_level: false, trend: "stable", ...o,
});

const makePlan = (o: Partial<RiskManagementPlanInput> = {}): RiskManagementPlanInput => ({
  id: "rmp1", child_id: "c1", risk_category: "aggression",
  current_risk_level: "medium", strategies_count: 4, triggers_count: 3,
  protective_factors_count: 5, review_date: "2026-06-01",
  last_reviewed: "2026-05-01", status: "active", child_views_present: true, ...o,
});

const makeAppetite = (o: Partial<RiskAppetiteInput> = {}): RiskAppetiteInput => ({
  id: "ra1", name: "Safeguarding", appetite_level: "cautious",
  red_lines_count: 3, examples_count: 5, ...o,
});

function baseInput(overrides: Partial<HomeStrategicRiskInput> = {}): HomeStrategicRiskInput {
  return {
    today: "2026-05-15",
    daily_risk_briefings: [
      // 12 briefings in last 7 days → coverage 12/14 = 86%
      ...Array.from({ length: 12 }, (_, i) => makeBriefing({ id: `b${i}`, date: i < 2 ? "2026-05-15" : i < 4 ? "2026-05-14" : i < 6 ? "2026-05-13" : i < 8 ? "2026-05-12" : i < 10 ? "2026-05-11" : "2026-05-10" })),
    ],
    risk_register_entries: [
      makeRegEntry(),
      makeRegEntry({ id: "rr2", risk_level: "low", status: "closed" }),
    ],
    strategic_risks: [
      makeStrategic(),
      makeStrategic({ id: "sr2", trend: "improving" }),
    ],
    risk_management_plans: [
      makePlan(),
      makePlan({ id: "rmp2", child_id: "c2" }),
    ],
    risk_appetite_domains: [
      makeAppetite(),
      makeAppetite({ id: "ra2", name: "Behaviour" }),
      makeAppetite({ id: "ra3", name: "Staffing" }),
      makeAppetite({ id: "ra4", name: "Exploitation" }),
      makeAppetite({ id: "ra5", name: "Health" }),
    ],
    total_children: 4,
    total_staff: 8,
    ...overrides,
  };
}

/* ── tests ──────────────────────────────────────────────────────────────────── */

describe("Home Strategic Risk Intelligence Engine", () => {
  describe("insufficient data", () => {
    it("returns insufficient_data when all empty and total_children = 0", () => {
      const r = computeHomeStrategicRisk({
        today: "2026-05-15", daily_risk_briefings: [], risk_register_entries: [],
        strategic_risks: [], risk_management_plans: [], risk_appetite_domains: [],
        total_children: 0, total_staff: 0,
      });
      expect(r.strategic_risk_rating).toBe("insufficient_data");
      expect(r.strategic_risk_score).toBe(0);
    });
  });

  describe("outstanding threshold (≥80)", () => {
    it("scores outstanding with comprehensive risk governance", () => {
      const r = computeHomeStrategicRisk(baseInput());
      // mod1: coverage 86% → +5
      // mod2: 0 critical, 0 overdue (review_date 2026-06-01 > today), mitigated 100% → +4
      // mod3: 0 worsening, 0 above target → +3
      // mod4: active 100%, views 100%, overdue 0 → +4
      // mod5: 5 domains, 5 with red lines → +3
      // mod6: 0 critActive → +3
      // mod7: views 100% → +3
      // mod8: 0 overdue of 4 → 0% → +3
      // 52 + 5 + 4 + 3 + 4 + 3 + 3 + 3 + 3 = 80 → outstanding
      expect(r.strategic_risk_score).toBeGreaterThanOrEqual(80);
      expect(r.strategic_risk_rating).toBe("outstanding");
    });
  });

  describe("good threshold (65–79)", () => {
    it("scores good with some gaps in coverage", () => {
      const r = computeHomeStrategicRisk(baseInput({
        daily_risk_briefings: [
          // 8 briefings = 57% coverage
          ...Array.from({ length: 8 }, (_, i) => makeBriefing({ id: `b${i}`, date: i < 2 ? "2026-05-15" : i < 4 ? "2026-05-14" : i < 6 ? "2026-05-12" : "2026-05-10" })),
        ],
        risk_appetite_domains: [
          makeAppetite(),
          makeAppetite({ id: "ra2", name: "Behaviour" }),
          makeAppetite({ id: "ra3", name: "Staffing" }),
        ],
      }));
      // mod1: coverage 57% → +3
      // mod2: same +4
      // mod3: same +3
      // mod4: same +4
      // mod5: 3 domains → +1
      // mod6: +3
      // mod7: +3
      // mod8: +3
      // 52 + 3 + 4 + 3 + 4 + 1 + 3 + 3 + 3 = 76 → good
      expect(r.strategic_risk_score).toBe(76);
      expect(r.strategic_risk_rating).toBe("good");
    });
  });

  describe("adequate threshold (45–64)", () => {
    it("scores adequate with degraded data", () => {
      const r = computeHomeStrategicRisk(baseInput({
        daily_risk_briefings: [
          // 5 in last 7 days = 36% coverage
          ...Array.from({ length: 5 }, (_, i) => makeBriefing({ id: `b${i}`, date: i < 2 ? "2026-05-15" : i < 4 ? "2026-05-13" : "2026-05-10" })),
        ],
        risk_register_entries: [
          makeRegEntry({ risk_level: "high", status: "active", review_date: "2026-04-01" }), // overdue
          makeRegEntry({ id: "rr2", risk_level: "critical", status: "active", review_date: "2026-06-01" }),
        ],
        strategic_risks: [
          makeStrategic({ trend: "worsening", residual_risk_score: 12, target_risk_score: 6 }),
        ],
        risk_management_plans: [
          makePlan({ status: "active", child_views_present: true, review_date: "2026-04-01" }), // overdue
          makePlan({ id: "rmp2", status: "under_review", child_views_present: false, review_date: "2026-06-01" }),
        ],
        risk_appetite_domains: [],
      }));
      // mod1: coverage 36% → +1
      // mod2: 1 critical, 1 overdue → critCount<=1 & regOverdue<=2 → +2
      // mod3: 1 worsening, 1 above target → worsening<=1 & aboveTarget<=2 → +1
      // mod4: active 50%, views 50% → active<60 but >=40 → 0
      // mod5: 0 domains → neutral 0
      // mod6: critActive=1, escalated=0 → critActive<=1 but escalated<critActive → else -1
      // mod7: views 50% → >=30 but <60 → 0
      // mod8: 1+1=2 overdue of 4 → 50% → >=50 → -3
      // 52 + 1 + 2 + 1 + 0 + 0 - 1 + 0 - 3 = 52 → adequate
      expect(r.strategic_risk_score).toBe(52);
      expect(r.strategic_risk_rating).toBe("adequate");
    });
  });

  describe("inadequate threshold (<45)", () => {
    it("scores inadequate with severely degraded data", () => {
      const r = computeHomeStrategicRisk(baseInput({
        daily_risk_briefings: [], // no briefings, staff>=3 → -2
        risk_register_entries: [
          makeRegEntry({ risk_level: "critical", status: "active", review_date: "2026-03-01" }),
          makeRegEntry({ id: "rr2", risk_level: "critical", status: "active", review_date: "2026-03-01" }),
          makeRegEntry({ id: "rr3", risk_level: "critical", status: "active", review_date: "2026-03-01" }),
          makeRegEntry({ id: "rr4", risk_level: "critical", status: "active", review_date: "2026-03-01" }),
          makeRegEntry({ id: "rr5", risk_level: "high", status: "active", review_date: "2026-02-01" }),
        ],
        strategic_risks: [
          makeStrategic({ trend: "worsening", residual_risk_score: 20, target_risk_score: 5 }),
          makeStrategic({ id: "sr2", trend: "worsening", residual_risk_score: 15, target_risk_score: 5 }),
          makeStrategic({ id: "sr3", trend: "worsening", residual_risk_score: 18, target_risk_score: 6 }),
        ],
        risk_management_plans: [
          makePlan({ status: "draft", child_views_present: false, review_date: "2026-02-01" }),
          makePlan({ id: "rmp2", status: "draft", child_views_present: false, review_date: "2026-01-01" }),
        ],
        risk_appetite_domains: [],
      }));
      // mod1: no briefings, staff>=3 → -2
      // mod2: 4 critical, 5 overdue → critCount>=4 → -4
      // mod3: 3 worsening → >=3 → -3
      // mod4: active 0% → <30 → -4
      // mod5: 0 → neutral
      // mod6: critActive=4 → >=3 → -3
      // mod7: views 0% → <30 → -3
      // mod8: 5+2=7 overdue of 7 → 100% → -3
      // 52 - 2 - 4 - 3 - 4 + 0 - 3 - 3 - 3 = 30 → inadequate
      expect(r.strategic_risk_score).toBe(30);
      expect(r.strategic_risk_rating).toBe("inadequate");
    });
  });

  describe("modifier details", () => {
    it("mod1: no briefings with staff ≥3 gives -2", () => {
      const full = computeHomeStrategicRisk(baseInput());
      const noBriefings = computeHomeStrategicRisk(baseInput({ daily_risk_briefings: [] }));
      expect(noBriefings.strategic_risk_score).toBeLessThan(full.strategic_risk_score!);
    });

    it("mod3: no strategic risks is neutral", () => {
      const withRisks = computeHomeStrategicRisk(baseInput());
      const noRisks = computeHomeStrategicRisk(baseInput({ strategic_risks: [] }));
      // Removing perfect strategic risks loses +3
      expect(noRisks.strategic_risk_score).toBe(withRisks.strategic_risk_score! - 3);
    });

    it("mod5: 5+ appetite domains with red lines gives +3", () => {
      const r = computeHomeStrategicRisk(baseInput());
      expect(r.appetite.total).toBe(5);
      expect(r.strategic_risk_score).toBeGreaterThanOrEqual(80);
    });

    it("mod6: no active critical risks gives +3", () => {
      const r = computeHomeStrategicRisk(baseInput());
      expect(r.register.critical_count).toBe(0);
    });

    it("mod8: overdue reviews increase penalty", () => {
      const noOverdue = computeHomeStrategicRisk(baseInput());
      const withOverdue = computeHomeStrategicRisk(baseInput({
        risk_register_entries: [
          makeRegEntry({ review_date: "2026-03-01" }),
          makeRegEntry({ id: "rr2", review_date: "2026-03-01" }),
          makeRegEntry({ id: "rr3", review_date: "2026-03-01" }),
        ],
        risk_management_plans: [
          makePlan({ review_date: "2026-03-01" }),
          makePlan({ id: "rmp2", review_date: "2026-03-01" }),
        ],
      }));
      expect(withOverdue.strategic_risk_score).toBeLessThan(noOverdue.strategic_risk_score!);
    });
  });

  describe("summaries", () => {
    it("computes briefing summary correctly", () => {
      const r = computeHomeStrategicRisk(baseInput({
        daily_risk_briefings: [
          makeBriefing({ date: "2026-05-15", child_risks_count: 3 }),
          makeBriefing({ id: "b2", date: "2026-05-14", child_risks_count: 1 }),
          makeBriefing({ id: "b3", date: "2026-01-01", child_risks_count: 5 }), // not recent
        ],
      }));
      expect(r.briefings.total).toBe(3);
      expect(r.briefings.recent_7_days).toBe(2);
      expect(r.briefings.avg_child_risks).toBe(3);
    });

    it("computes register summary correctly", () => {
      const r = computeHomeStrategicRisk(baseInput({
        risk_register_entries: [
          makeRegEntry({ risk_level: "critical", status: "active", review_date: "2026-03-01" }),
          makeRegEntry({ id: "rr2", risk_level: "high", status: "mitigated", review_date: "2026-06-01" }),
          makeRegEntry({ id: "rr3", risk_level: "low", status: "closed", review_date: "2026-07-01" }),
        ],
      }));
      expect(r.register.total).toBe(3);
      expect(r.register.critical_count).toBe(1);
      expect(r.register.high_count).toBe(1);
      expect(r.register.overdue_reviews).toBe(1); // 2026-03-01 is past
      expect(r.register.mitigated_rate).toBe(67); // 2 of 3
    });

    it("computes plan summary correctly", () => {
      const r = computeHomeStrategicRisk(baseInput({
        risk_management_plans: [
          makePlan({ status: "active", child_views_present: true, review_date: "2026-06-01" }),
          makePlan({ id: "rmp2", status: "draft", child_views_present: false, review_date: "2026-04-01" }),
        ],
      }));
      expect(r.plans.total).toBe(2);
      expect(r.plans.active_rate).toBe(50);
      expect(r.plans.child_views_rate).toBe(50);
      expect(r.plans.overdue_reviews).toBe(1);
    });
  });

  describe("strengths", () => {
    it("generates briefing coverage strength", () => {
      const r = computeHomeStrategicRisk(baseInput());
      expect(r.strengths.some(s => s.includes("daily risk briefing"))).toBe(true);
    });

    it("generates no critical risks strength", () => {
      const r = computeHomeStrategicRisk(baseInput());
      expect(r.strengths.some(s => s.includes("No critical risks"))).toBe(true);
    });

    it("generates stable strategic risks strength", () => {
      const r = computeHomeStrategicRisk(baseInput());
      expect(r.strengths.some(s => s.includes("strategic risks stable"))).toBe(true);
    });
  });

  describe("concerns", () => {
    it("raises concern for no briefings", () => {
      const r = computeHomeStrategicRisk(baseInput({ daily_risk_briefings: [] }));
      expect(r.concerns.some(c => c.includes("No daily risk briefings"))).toBe(true);
    });

    it("raises concern for multiple critical risks", () => {
      const r = computeHomeStrategicRisk(baseInput({
        risk_register_entries: [
          makeRegEntry({ risk_level: "critical", status: "active" }),
          makeRegEntry({ id: "rr2", risk_level: "critical", status: "active" }),
          makeRegEntry({ id: "rr3", risk_level: "critical", status: "active" }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("critical risks"))).toBe(true);
    });

    it("raises concern for worsening strategic risks", () => {
      const r = computeHomeStrategicRisk(baseInput({
        strategic_risks: [
          makeStrategic({ trend: "worsening" }),
          makeStrategic({ id: "sr2", trend: "worsening" }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("worsening"))).toBe(true);
    });
  });

  describe("recommendations", () => {
    it("recommends emergency review for critical risks", () => {
      const r = computeHomeStrategicRisk(baseInput({
        risk_register_entries: [
          makeRegEntry({ risk_level: "critical", status: "active" }),
          makeRegEntry({ id: "rr2", risk_level: "critical", status: "active" }),
          makeRegEntry({ id: "rr3", risk_level: "critical", status: "active" }),
        ],
      }));
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("emergency"))).toBe(true);
    });

    it("recommends daily briefings when missing", () => {
      const r = computeHomeStrategicRisk(baseInput({ daily_risk_briefings: [] }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("daily risk briefings"))).toBe(true);
    });
  });

  describe("insights", () => {
    it("generates outstanding insight", () => {
      const r = computeHomeStrategicRisk(baseInput());
      expect(r.strategic_risk_rating).toBe("outstanding");
      expect(r.insights.some(i => i.severity === "positive")).toBe(true);
    });

    it("generates critical insight for inadequate rating", () => {
      const r = computeHomeStrategicRisk(baseInput({
        daily_risk_briefings: [],
        risk_register_entries: Array.from({ length: 5 }, (_, i) => makeRegEntry({ id: `rr${i}`, risk_level: "critical", status: "active", review_date: "2026-03-01" })),
        strategic_risks: Array.from({ length: 3 }, (_, i) => makeStrategic({ id: `sr${i}`, trend: "worsening" })),
        risk_management_plans: [makePlan({ status: "draft", child_views_present: false, review_date: "2026-01-01" })],
        risk_appetite_domains: [],
      }));
      expect(r.strategic_risk_rating).toBe("inadequate");
      expect(r.insights.some(i => i.severity === "critical")).toBe(true);
    });
  });

  describe("headline", () => {
    it("returns outstanding headline", () => {
      const r = computeHomeStrategicRisk(baseInput());
      expect(r.headline).toContain("Outstanding");
    });
  });

  describe("edge cases", () => {
    it("handles single domain data", () => {
      const r = computeHomeStrategicRisk({
        today: "2026-05-15",
        daily_risk_briefings: [makeBriefing()],
        risk_register_entries: [],
        strategic_risks: [],
        risk_management_plans: [],
        risk_appetite_domains: [],
        total_children: 1, total_staff: 2,
      });
      expect(r.strategic_risk_rating).not.toBe("insufficient_data");
    });

    it("score is clamped 0–100", () => {
      const r = computeHomeStrategicRisk(baseInput());
      expect(r.strategic_risk_score).toBeGreaterThanOrEqual(0);
      expect(r.strategic_risk_score).toBeLessThanOrEqual(100);
    });
  });
});
