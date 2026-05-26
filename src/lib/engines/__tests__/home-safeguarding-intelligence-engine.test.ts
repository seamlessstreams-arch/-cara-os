import {
  computeHomeSafeguarding,
  type HomeSafeguardingInput,
  type ContextualRiskInput,
  type ExploitationScreeningInput,
  type OnlineSafetyInput,
} from "../home-safeguarding-intelligence-engine";

// ── Helpers ────────────────────────────────────────────────────────────────

const TODAY = "2025-03-15";

function makeCtxRisk(overrides: Partial<ContextualRiskInput> = {}): ContextualRiskInput {
  return {
    id: `ctx-${Math.random().toString(36).slice(2, 8)}`,
    date_identified: "2025-02-01",
    risk_level: "medium",
    status: "monitoring",
    children_affected_count: 2,
    has_protective_actions: true,
    has_multi_agency_actions: true,
    review_date: "2025-04-01",
    last_reviewed: "2025-03-01",
    ...overrides,
  };
}

function makeScreen(overrides: Partial<ExploitationScreeningInput> = {}): ExploitationScreeningInput {
  return {
    id: `exp-${Math.random().toString(36).slice(2, 8)}`,
    date: "2025-02-20",
    child_id: "C1",
    risk_level: "low",
    previous_risk_level: null,
    status: "monitoring",
    has_safety_plan: true,
    multi_agency_count: 2,
    nrm_referral: false,
    social_worker_notified: true,
    review_date: "2025-05-20",
    ...overrides,
  };
}

function makeOnline(overrides: Partial<OnlineSafetyInput> = {}): OnlineSafetyInput {
  return {
    id: `onl-${Math.random().toString(36).slice(2, 8)}`,
    date: "2025-03-01",
    child_id: "C1",
    severity: "low",
    status: "resolved",
    has_safeguarding_referral: false,
    has_child_discussion: true,
    has_follow_up: true,
    parent_notified: true,
    ...overrides,
  };
}

function baseInput(overrides: Partial<HomeSafeguardingInput> = {}): HomeSafeguardingInput {
  return {
    today: TODAY,
    total_children: 3,
    child_ids: ["C1", "C2", "C3"],
    contextual_risks: [
      makeCtxRisk({ id: "ctx1" }),
      makeCtxRisk({ id: "ctx2" }),
    ],
    exploitation_screenings: [
      makeScreen({ id: "exp1", child_id: "C1" }),
      makeScreen({ id: "exp2", child_id: "C2" }),
      makeScreen({ id: "exp3", child_id: "C3" }),
    ],
    online_safety_incidents: [
      makeOnline({ id: "onl1", child_id: "C1" }),
      makeOnline({ id: "onl2", child_id: "C2" }),
    ],
    ...overrides,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// RATING TIER TESTS
// ════════════════════════════════════════════════════════════════════════════

describe("Home Safeguarding Intelligence Engine", () => {

  // ── Insufficient data ──────────────────────────────────────────────────

  describe("insufficient data", () => {
    const result = computeHomeSafeguarding(baseInput({
      contextual_risks: [],
      exploitation_screenings: [],
      online_safety_incidents: [],
    }));

    it("rates insufficient_data", () => expect(result.safeguarding_rating).toBe("insufficient_data"));
    it("scores 0", () => expect(result.safeguarding_score).toBe(0));
    it("has critical insight", () => expect(result.insights.some(i => i.severity === "critical")).toBe(true));
    it("has recommendation", () => expect(result.recommendations.length).toBeGreaterThan(0));
  });

  // ── Outstanding ────────────────────────────────────────────────────────
  // No high risks, no overdue, 100% multi-agency, 100% screening, no high-risk,
  // 100% SW, 0 unresolved online, 100% discussion+followup
  // Protective actions skipped (no active risks — both are "monitoring")
  // Score: 50+5+4+4+5+4+3+3+3 = 81

  describe("outstanding rating", () => {
    const result = computeHomeSafeguarding(baseInput());

    it("rates outstanding", () => expect(result.safeguarding_rating).toBe("outstanding"));
    it("scores 81", () => expect(result.safeguarding_score).toBe(81));
    it("headline mentions outstanding", () => expect(result.headline).toContain("Outstanding"));
    it("has strengths", () => expect(result.strengths.length).toBeGreaterThan(0));
    it("has no concerns", () => expect(result.concerns).toHaveLength(0));
  });

  // ── Good ───────────────────────────────────────────────────────────────
  // ≤2 active high, 1 overdue, 80% MA, 67% screening, all safety plans,
  // 100% SW, no online, 80% protective
  // Score: 50+2+1+4+3+4+3+0+0+3 = 70

  describe("good rating", () => {
    const result = computeHomeSafeguarding(baseInput({
      contextual_risks: [
        makeCtxRisk({ id: "ctx1", risk_level: "high", status: "active", review_date: "2025-04-01" }),
        makeCtxRisk({ id: "ctx2", status: "active", review_date: "2025-03-10" }), // overdue
        makeCtxRisk({ id: "ctx3" }),
        makeCtxRisk({ id: "ctx4" }),
        makeCtxRisk({ id: "ctx5" }),
        // 5 total, 5/5 = 100% multi-agency (all default true) → but 2 active
        // 1 high + 1 active = 2 active high? No, ctx2 is medium (default), only ctx1 is high
        // highVeryHigh = [ctx1] → 1 → ≤2 → +2
        // activeRisks = [ctx1, ctx2] → 2 active
        // overdue: ctx2 review_date "2025-03-10" < today "2025-03-15" → 1 overdue
        // protectiveRate = 2/2 active have protective = 100% → ≥80% → +3
      ],
      exploitation_screenings: [
        makeScreen({ id: "exp1", child_id: "C1" }),
        makeScreen({ id: "exp2", child_id: "C2" }),
        // C3 not screened → 2/3 = 67% → ≥60% → +3
      ],
      online_safety_incidents: [],
    }));

    it("rates good", () => expect(result.safeguarding_rating).toBe("good"));
    it("scores 70", () => expect(result.safeguarding_score).toBe(70));
    it("headline mentions good", () => expect(result.headline).toContain("Good"));
  });

  // ── Adequate ───────────────────────────────────────────────────────────
  // ≤2 high, 1 overdue, 60% MA, 67% screening, all safety plans,
  // <80% SW, 1 unresolved online, poor discussion, <80% protective
  // Score: 50+2+1+2+3+4-2-3-2-2 = 53

  describe("adequate rating", () => {
    const result = computeHomeSafeguarding(baseInput({
      contextual_risks: [
        makeCtxRisk({ id: "ctx1", risk_level: "high", status: "active", review_date: "2025-03-10", has_protective_actions: false }),
        makeCtxRisk({ id: "ctx2", status: "active", review_date: "2025-04-01" }),
        makeCtxRisk({ id: "ctx3", has_multi_agency_actions: false }),
        makeCtxRisk({ id: "ctx4", has_multi_agency_actions: false }),
        makeCtxRisk({ id: "ctx5" }),
        // 5 total: 3/5 multi-agency = 60% → +2
        // active: ctx1, ctx2 → 2 active
        // highVH: ctx1 (high, active) → 1 → ≤2 → +2
        // overdue: ctx1 review 2025-03-10 < today → 1 → ≤2 → +1
        // protective: ctx1 false, ctx2 true → 1/2 = 50% → <80% → -2
      ],
      exploitation_screenings: [
        makeScreen({ id: "exp1", child_id: "C1", social_worker_notified: false }),
        makeScreen({ id: "exp2", child_id: "C2", social_worker_notified: true }),
        // 2/3 children = 67% → +3
        // SW: 1/2 = 50% → <80% → -2
        // no high risk → safety plan = +4
      ],
      online_safety_incidents: [
        makeOnline({ id: "onl1", severity: "high", status: "open", has_child_discussion: false, has_follow_up: false }),
        makeOnline({ id: "onl2", severity: "low", status: "resolved", has_child_discussion: false, has_follow_up: false }),
        // unresolved HC: 1 → -3
        // discussion: 0/2 = 0% → both <60% → -2
      ],
    }));

    it("rates adequate", () => expect(result.safeguarding_rating).toBe("adequate"));
    it("scores 53", () => expect(result.safeguarding_score).toBe(53));
    it("headline mentions adequate", () => expect(result.headline).toContain("Adequate"));
    it("has concerns", () => expect(result.concerns.length).toBeGreaterThan(0));
    it("has recommendations", () => expect(result.recommendations.length).toBeGreaterThan(0));
  });

  // ── Inadequate ─────────────────────────────────────────────────────────

  describe("inadequate rating", () => {
    const result = computeHomeSafeguarding(baseInput({
      contextual_risks: [
        makeCtxRisk({ id: "ctx1", risk_level: "very_high", status: "active", review_date: "2025-02-01", has_protective_actions: false, has_multi_agency_actions: false }),
        makeCtxRisk({ id: "ctx2", risk_level: "high", status: "active", review_date: "2025-02-01", has_protective_actions: false, has_multi_agency_actions: false }),
        makeCtxRisk({ id: "ctx3", risk_level: "high", status: "escalated", review_date: "2025-02-01", has_protective_actions: false, has_multi_agency_actions: false }),
        // 3 high/very_high → -4; 3 overdue → -4; 0% MA → -3; 0% protective → -2
      ],
      exploitation_screenings: [
        makeScreen({ id: "exp1", child_id: "C1", risk_level: "high", has_safety_plan: false, social_worker_notified: false, multi_agency_count: 0 }),
        // 1/3 = 33% coverage → <60% → -3
        // high risk without safety plan → -3
        // SW: 0% → -2
      ],
      online_safety_incidents: [
        makeOnline({ id: "onl1", severity: "critical", status: "open", has_child_discussion: false, has_follow_up: false, parent_notified: false }),
        makeOnline({ id: "onl2", severity: "high", status: "escalated", has_child_discussion: false, has_follow_up: false, parent_notified: false }),
        // unresolved HC: 2 → -3; discussion 0% → -2
      ],
    }));

    it("rates inadequate", () => expect(result.safeguarding_rating).toBe("inadequate"));
    it("scores below 45", () => expect(result.safeguarding_score).toBeLessThan(45));
    it("headline mentions inadequate", () => expect(result.headline).toContain("inadequate"));
    it("has critical insights", () => expect(result.insights.some(i => i.severity === "critical")).toBe(true));
    it("has multiple concerns", () => expect(result.concerns.length).toBeGreaterThanOrEqual(3));
    it("has immediate recommendations", () => expect(result.recommendations.some(r => r.urgency === "immediate")).toBe(true));
  });

  // ════════════════════════════════════════════════════════════════════════
  // PROFILE CALCULATION TESTS
  // ════════════════════════════════════════════════════════════════════════

  describe("contextual risk profile", () => {
    const risks = [
      makeCtxRisk({ id: "c1", risk_level: "high", status: "active", review_date: "2025-03-10", has_multi_agency_actions: true, has_protective_actions: true }),
      makeCtxRisk({ id: "c2", risk_level: "low", status: "monitoring", has_multi_agency_actions: false }),
      makeCtxRisk({ id: "c3", risk_level: "very_high", status: "escalated", review_date: "2025-04-01", has_multi_agency_actions: true, has_protective_actions: false }),
    ];
    const result = computeHomeSafeguarding(baseInput({ contextual_risks: risks }));
    const p = result.contextual_risk_profile;

    it("total_risks", () => expect(p.total_risks).toBe(3));
    it("active_count", () => expect(p.active_count).toBe(2)); // active + escalated
    it("escalated_count", () => expect(p.escalated_count).toBe(1));
    it("high_very_high_count", () => expect(p.high_very_high_count).toBe(2));
    it("overdue_reviews", () => expect(p.overdue_reviews).toBe(1)); // c1 overdue
    it("multi_agency_rate", () => expect(p.multi_agency_rate).toBe(67)); // 2/3
    it("protective_action_rate", () => expect(p.protective_action_rate).toBe(50)); // 1/2 active
  });

  describe("exploitation profile", () => {
    const screens = [
      makeScreen({ id: "e1", child_id: "C1", risk_level: "high", has_safety_plan: true, social_worker_notified: true, multi_agency_count: 3 }),
      makeScreen({ id: "e2", child_id: "C2", risk_level: "low", social_worker_notified: false, multi_agency_count: 1 }),
    ];
    const result = computeHomeSafeguarding(baseInput({ exploitation_screenings: screens }));
    const p = result.exploitation_profile;

    it("total_screenings", () => expect(p.total_screenings).toBe(2));
    it("screening_coverage", () => expect(p.screening_coverage).toBe(67)); // 2/3
    it("high_risk_count", () => expect(p.high_risk_count).toBe(1));
    it("safety_plan_rate", () => expect(p.safety_plan_rate).toBe(100)); // 1/1 high-risk
    it("social_worker_notification_rate", () => expect(p.social_worker_notification_rate).toBe(50));
    it("children_not_screened", () => expect(p.children_not_screened).toEqual(["C3"]));
    it("avg_multi_agency", () => expect(p.avg_multi_agency).toBe(2)); // (3+1)/2
  });

  describe("online safety profile", () => {
    const incidents = [
      makeOnline({ id: "o1", severity: "high", status: "resolved", has_child_discussion: true, has_follow_up: true }),
      makeOnline({ id: "o2", severity: "critical", status: "open", has_child_discussion: false, has_follow_up: false }),
      makeOnline({ id: "o3", severity: "low", status: "resolved", has_child_discussion: true, has_follow_up: true }),
    ];
    const result = computeHomeSafeguarding(baseInput({ online_safety_incidents: incidents }));
    const p = result.online_safety_profile;

    it("total_incidents_90d", () => expect(p.total_incidents_90d).toBe(3));
    it("high_critical_count", () => expect(p.high_critical_count).toBe(2));
    it("unresolved_high_critical", () => expect(p.unresolved_high_critical).toBe(1));
    it("child_discussion_rate", () => expect(p.child_discussion_rate).toBe(67)); // 2/3
    it("follow_up_rate", () => expect(p.follow_up_rate).toBe(67)); // 2/3
  });

  // ════════════════════════════════════════════════════════════════════════
  // SCORING MODIFIER TESTS
  // ════════════════════════════════════════════════════════════════════════

  describe("scoring — high/very_high risks", () => {
    it("0 high risks gives +5", () => {
      const r = computeHomeSafeguarding(baseInput());
      expect(r.contextual_risk_profile.high_very_high_count).toBe(0);
    });

    it(">2 high risks gives -4", () => {
      const r = computeHomeSafeguarding(baseInput({
        contextual_risks: [
          makeCtxRisk({ id: "c1", risk_level: "high", status: "active" }),
          makeCtxRisk({ id: "c2", risk_level: "very_high", status: "active" }),
          makeCtxRisk({ id: "c3", risk_level: "high", status: "escalated" }),
        ],
      }));
      expect(r.contextual_risk_profile.high_very_high_count).toBe(3);
    });
  });

  describe("scoring — screening coverage", () => {
    it("100% gives +5", () => {
      const r = computeHomeSafeguarding(baseInput());
      expect(r.exploitation_profile.screening_coverage).toBe(100);
    });
  });

  describe("scoring — unresolved online incidents", () => {
    it("0 unresolved gives +3", () => {
      const r = computeHomeSafeguarding(baseInput());
      expect(r.online_safety_profile.unresolved_high_critical).toBe(0);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 90-DAY WINDOW
  // ════════════════════════════════════════════════════════════════════════

  describe("90-day window", () => {
    it("excludes online incidents older than 90 days", () => {
      const r = computeHomeSafeguarding(baseInput({
        online_safety_incidents: [makeOnline({ date: "2024-12-01" })],
      }));
      expect(r.online_safety_profile.total_incidents_90d).toBe(0);
    });

    it("exploitation screenings use latest per child (no window)", () => {
      const r = computeHomeSafeguarding(baseInput({
        exploitation_screenings: [
          makeScreen({ id: "e1", child_id: "C1", date: "2024-01-01", risk_level: "high" }),
          makeScreen({ id: "e2", child_id: "C1", date: "2025-02-01", risk_level: "low" }),
        ],
      }));
      // Latest for C1 is "low"
      expect(r.exploitation_profile.high_risk_count).toBe(0);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // STRENGTHS
  // ════════════════════════════════════════════════════════════════════════

  describe("strengths", () => {
    const result = computeHomeSafeguarding(baseInput());

    it("no high risks strength", () => expect(result.strengths.some(s => s.includes("No active high"))).toBe(true));
    it("screening coverage strength", () => expect(result.strengths.some(s => s.includes("screening coverage"))).toBe(true));
    it("multi-agency strength", () => expect(result.strengths.some(s => s.includes("Multi-agency"))).toBe(true));
    it("online resolved strength", () => expect(result.strengths.some(s => s.includes("resolved"))).toBe(true));
    it("discussion strength", () => expect(result.strengths.some(s => s.includes("Child discussions"))).toBe(true));
  });

  // ════════════════════════════════════════════════════════════════════════
  // CONCERNS
  // ════════════════════════════════════════════════════════════════════════

  describe("concerns", () => {
    it("high risks concern", () => {
      const r = computeHomeSafeguarding(baseInput({
        contextual_risks: [makeCtxRisk({ risk_level: "high", status: "active" })],
      }));
      expect(r.concerns.some(c => c.includes("high/very high"))).toBe(true);
    });

    it("overdue reviews concern", () => {
      const r = computeHomeSafeguarding(baseInput({
        contextual_risks: [makeCtxRisk({ status: "active", review_date: "2025-03-01" })],
      }));
      expect(r.concerns.some(c => c.includes("overdue"))).toBe(true);
    });

    it("unscreened children concern", () => {
      const r = computeHomeSafeguarding(baseInput({
        exploitation_screenings: [makeScreen({ child_id: "C1" })],
      }));
      expect(r.concerns.some(c => c.includes("not screened"))).toBe(true);
    });

    it("unresolved online concern", () => {
      const r = computeHomeSafeguarding(baseInput({
        online_safety_incidents: [makeOnline({ severity: "high", status: "open" })],
      }));
      expect(r.concerns.some(c => c.includes("unresolved"))).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // RECOMMENDATIONS
  // ════════════════════════════════════════════════════════════════════════

  describe("recommendations", () => {
    it("missing safety plan → immediate", () => {
      const r = computeHomeSafeguarding(baseInput({
        exploitation_screenings: [makeScreen({ child_id: "C1", risk_level: "high", has_safety_plan: false })],
      }));
      const rec = r.recommendations.find(x => x.recommendation.includes("safety plan"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("overdue reviews → immediate", () => {
      const r = computeHomeSafeguarding(baseInput({
        contextual_risks: [makeCtxRisk({ status: "active", review_date: "2025-03-01" })],
      }));
      const rec = r.recommendations.find(x => x.recommendation.includes("overdue"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("unscreened children → soon", () => {
      const r = computeHomeSafeguarding(baseInput({
        exploitation_screenings: [makeScreen({ child_id: "C1" })],
      }));
      const rec = r.recommendations.find(x => x.recommendation.includes("screening"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("recommendations are ranked sequentially", () => {
      const r = computeHomeSafeguarding(baseInput({
        contextual_risks: [
          makeCtxRisk({ risk_level: "high", status: "active", review_date: "2025-02-01" }),
          makeCtxRisk({ risk_level: "high", status: "active", review_date: "2025-02-01" }),
          makeCtxRisk({ risk_level: "high", status: "escalated", review_date: "2025-02-01" }),
        ],
        exploitation_screenings: [
          makeScreen({ child_id: "C1", risk_level: "high", has_safety_plan: false }),
        ],
      }));
      for (let i = 0; i < r.recommendations.length; i++) {
        expect(r.recommendations[i].rank).toBe(i + 1);
      }
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // INSIGHTS
  // ════════════════════════════════════════════════════════════════════════

  describe("insights", () => {
    it("high risks → critical", () => {
      const r = computeHomeSafeguarding(baseInput({
        contextual_risks: [makeCtxRisk({ risk_level: "high", status: "active" })],
      }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("high/very high"))).toBe(true);
    });

    it("screening coverage → positive", () => {
      const r = computeHomeSafeguarding(baseInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("screening coverage"))).toBe(true);
    });

    it("multi-agency → positive", () => {
      const r = computeHomeSafeguarding(baseInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("Multi-agency"))).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // EDGE CASES
  // ════════════════════════════════════════════════════════════════════════

  describe("edge cases", () => {
    it("only contextual risks (no screenings or online)", () => {
      const r = computeHomeSafeguarding(baseInput({
        exploitation_screenings: [],
        online_safety_incidents: [],
      }));
      expect(r.safeguarding_rating).not.toBe("insufficient_data");
    });

    it("only exploitation screenings", () => {
      const r = computeHomeSafeguarding(baseInput({
        contextual_risks: [],
        online_safety_incidents: [],
      }));
      expect(r.safeguarding_rating).not.toBe("insufficient_data");
    });

    it("multiple screenings for same child uses latest", () => {
      const r = computeHomeSafeguarding(baseInput({
        exploitation_screenings: [
          makeScreen({ id: "e1", child_id: "C1", date: "2024-06-01", risk_level: "high" }),
          makeScreen({ id: "e2", child_id: "C1", date: "2025-02-01", risk_level: "low" }),
        ],
      }));
      expect(r.exploitation_profile.high_risk_count).toBe(0);
      expect(r.exploitation_profile.total_screenings).toBe(1); // deduplicated
    });

    it("score clamped to 0-100", () => {
      const r = computeHomeSafeguarding(baseInput());
      expect(r.safeguarding_score).toBeGreaterThanOrEqual(0);
      expect(r.safeguarding_score).toBeLessThanOrEqual(100);
    });

    it("no high-risk screenings gets +4 for safety plans", () => {
      // all low risk = no safety plan needed = +4
      const r = computeHomeSafeguarding(baseInput());
      expect(r.exploitation_profile.high_risk_count).toBe(0);
    });
  });
});
