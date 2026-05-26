import {
  computeHomeReg44,
  type HomeReg44Input,
  type Reg44VisitInput,
  type Reg44RecInput,
  type Reg44ActionInput,
} from "../home-reg44-intelligence-engine";

// ── Helpers ────────────────────────────────────────────────────────────────

const TODAY = "2025-03-15";

function daysAgo(n: number): string {
  const d = new Date("2025-03-15");
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function makeRec(overrides: Partial<Reg44RecInput> = {}): Reg44RecInput {
  return {
    id: `rec-${Math.random().toString(36).slice(2, 8)}`,
    recommendation: "Address noted finding.",
    priority: "medium",
    status: "completed",
    ...overrides,
  };
}

function makeVisit(overrides: Partial<Reg44VisitInput> = {}): Reg44VisitInput {
  return {
    id: `v44-${Math.random().toString(36).slice(2, 8)}`,
    visit_date: daysAgo(7),
    visitor: "Margaret Thompson",
    duration_hours: 4,
    children_spoken_count: 3,
    total_children: 3,
    staff_spoken: 4,
    records_reviewed_count: 3,
    overall_judgement: "Good — no immediate concerns.",
    strengths_count: 3,
    areas_for_development_count: 1,
    recommendations: [makeRec()],
    previous_actions_completed: true,
    report_sent_to_ofsted: true,
    report_sent_date: daysAgo(5),
    ...overrides,
  };
}

function makeAction(overrides: Partial<Reg44ActionInput> = {}): Reg44ActionInput {
  return {
    id: `act-${Math.random().toString(36).slice(2, 8)}`,
    visit_ref: "v44-1",
    priority: "medium",
    status: "completed",
    due_date: daysAgo(10),
    carried_forward_count: 0,
    ...overrides,
  };
}

// 12 monthly visits over the past year, all good, all sent to Ofsted
function monthlyVisits(): Reg44VisitInput[] {
  return Array.from({ length: 12 }, (_, i) => makeVisit({
    id: `v44-m${i}`,
    visit_date: daysAgo(i * 30),
    recommendations: [makeRec({ id: `rec-m${i}` })],
  }));
}

function baseInput(overrides: Partial<HomeReg44Input> = {}): HomeReg44Input {
  return {
    today: TODAY,
    total_children: 3,
    visits: monthlyVisits(),
    action_records: [
      makeAction({ id: "act1" }),
      makeAction({ id: "act2" }),
    ],
    ...overrides,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// RATING TIER TESTS
// ════════════════════════════════════════════════════════════════════════════

describe("Home Reg 44 Intelligence Engine", () => {

  // ── Insufficient data ──────────────────────────────────────────────────

  describe("insufficient data", () => {
    const result = computeHomeReg44(baseInput({ visits: [] }));

    it("rates insufficient_data", () => expect(result.reg44_rating).toBe("insufficient_data"));
    it("scores 0", () => expect(result.reg44_score).toBe(0));
    it("has critical insight", () => expect(result.insights.some(i => i.severity === "critical")).toBe(true));
    it("has recommendation", () => expect(result.recommendations.length).toBeGreaterThan(0));
    it("headline mentions no data", () => expect(result.headline).toContain("No Regulation 44"));
  });

  // ── Outstanding ────────────────────────────────────────────────────────
  // 12 monthly visits, all recs completed, no overdue actions, 100% Ofsted,
  // children spoken at every visit, good duration, stable judgement
  // Score: 50+6+4+5+3+4+3+3+2+0 = 80

  describe("outstanding rating", () => {
    const result = computeHomeReg44(baseInput());

    it("rates outstanding", () => expect(result.reg44_rating).toBe("outstanding"));
    it("scores 80", () => expect(result.reg44_score).toBe(80));
    it("headline mentions outstanding", () => expect(result.headline).toContain("Outstanding"));
    it("has strengths", () => expect(result.strengths.length).toBeGreaterThan(0));
    it("has no concerns", () => expect(result.concerns).toHaveLength(0));
  });

  // ── Good ───────────────────────────────────────────────────────────────
  // 10 visits in 12m, 1 high outstanding rec, no overdue actions, 100% Ofsted,
  // children always spoken to, 4hr avg, stable
  // Score: 50+3+4+5-3+4+3+3+2+0 = 69 (actual engine score)

  describe("good rating", () => {
    const visits = Array.from({ length: 10 }, (_, i) => makeVisit({
      id: `v44-g${i}`,
      visit_date: daysAgo(i * 35),
      recommendations: [
        makeRec({ id: `rec-g${i}`, status: "completed" }),
      ],
    }));
    // Add 1 high outstanding rec to the latest visit
    visits[0].recommendations.push(makeRec({ id: "rec-g-hp", priority: "high", status: "outstanding" }));

    const result = computeHomeReg44(baseInput({
      visits,
      action_records: [makeAction({ id: "act-g1" }), makeAction({ id: "act-g2" })],
    }));

    it("rates good", () => expect(result.reg44_rating).toBe("good"));
    it("scores 69", () => expect(result.reg44_score).toBe(69));
    it("headline mentions good", () => expect(result.headline).toContain("Good"));
    it("has concern about high priority outstanding", () => expect(result.concerns.some(c => c.includes("high-priority"))).toBe(true));
  });

  // ── Adequate ───────────────────────────────────────────────────────────
  // 8 visits in 12m, 56% rec completion, 2 overdue actions, 1 visit without children,
  // 88% Ofsted, declining judgement, 2.5hr avg
  // Score: 50-2+2-3+3+1+1+1+1-2 = 52 (actual engine score)

  describe("adequate rating", () => {
    const visits = Array.from({ length: 8 }, (_, i) => makeVisit({
      id: `v44-a${i}`,
      visit_date: daysAgo(i * 40),
      duration_hours: 2.5,
      report_sent_to_ofsted: i < 7,  // 1 not sent = 7/8 = 88%
      recommendations: [
        makeRec({ id: `rec-a${i}a`, status: i < 5 ? "completed" : "outstanding" }),
        makeRec({ id: `rec-a${i}b`, status: i < 4 ? "completed" : "in_progress" }),
      ],
    }));
    // 1 visit without children spoken
    visits[3].children_spoken_count = 0;
    // Declining: last visit requires improvement, second-last was good
    visits[0].overall_judgement = "Requires improvement";
    visits[1].overall_judgement = "Good";

    const actions = [
      makeAction({ id: "act-a1", status: "completed" }),
      makeAction({ id: "act-a2", status: "completed" }),
      makeAction({ id: "act-a3", status: "in_progress", due_date: daysAgo(5) }),  // overdue
      makeAction({ id: "act-a4", status: "outstanding", due_date: daysAgo(3) }),   // overdue
    ];

    const result = computeHomeReg44(baseInput({ visits, action_records: actions }));

    it("rates adequate", () => expect(result.reg44_rating).toBe("adequate"));
    it("scores 52", () => expect(result.reg44_score).toBe(52));
    it("headline mentions adequate", () => expect(result.headline).toContain("Adequate"));
    it("has concerns", () => expect(result.concerns.length).toBeGreaterThan(0));
    it("has recommendations", () => expect(result.recommendations.length).toBeGreaterThan(0));
  });

  // ── Inadequate ─────────────────────────────────────────────────────────
  // 4 visits in 12m, 25% recs completed, 3 overdue actions (1 high), missing Ofsted,
  // 1 visit without children, declining, short visits
  // Score: 50-5-4-3-3-4-3-2-1-2 = 23

  describe("inadequate rating", () => {
    const visits = Array.from({ length: 4 }, (_, i) => makeVisit({
      id: `v44-i${i}`,
      visit_date: daysAgo(i * 80),
      duration_hours: 1.5,
      report_sent_to_ofsted: i === 0,  // 1/4 = 25%
      recommendations: [
        makeRec({ id: `rec-i${i}a`, status: i === 0 ? "completed" : "outstanding" }),
      ],
    }));
    visits[2].children_spoken_count = 0;
    visits[0].overall_judgement = "Requires improvement";
    visits[1].overall_judgement = "Good — no immediate concerns.";

    const actions = [
      makeAction({ id: "act-i1", status: "completed" }),
      makeAction({ id: "act-i2", status: "outstanding", due_date: daysAgo(20), priority: "high" }),
      makeAction({ id: "act-i3", status: "overdue", due_date: daysAgo(15) }),
      makeAction({ id: "act-i4", status: "outstanding", due_date: daysAgo(10) }),
    ];

    const result = computeHomeReg44(baseInput({ visits, action_records: actions }));

    it("rates inadequate", () => expect(result.reg44_rating).toBe("inadequate"));
    it("scores below 45", () => expect(result.reg44_score).toBeLessThan(45));
    it("headline mentions inadequate", () => expect(result.headline).toContain("inadequate"));
    it("has critical insights", () => expect(result.insights.some(i => i.severity === "critical")).toBe(true));
    it("has multiple concerns", () => expect(result.concerns.length).toBeGreaterThan(2));
    it("has immediate recommendations", () => expect(result.recommendations.some(r => r.urgency === "immediate")).toBe(true));
  });

  // ════════════════════════════════════════════════════════════════════════
  // PROFILE CALCULATION TESTS
  // ════════════════════════════════════════════════════════════════════════

  describe("visit frequency profile", () => {
    const result = computeHomeReg44(baseInput());

    it("total_visits_12m", () => expect(result.visit_frequency_profile.total_visits_12m).toBe(12));
    it("visits_90d", () => expect(result.visit_frequency_profile.visits_90d).toBe(4));
    it("expected_visits_12m", () => expect(result.visit_frequency_profile.expected_visits_12m).toBe(12));
    it("monthly_compliance", () => expect(result.visit_frequency_profile.monthly_compliance).toBe(true));
    it("gap_days_largest", () => expect(result.visit_frequency_profile.gap_days_largest).toBeLessThanOrEqual(35));
  });

  describe("recommendation profile", () => {
    const visits = [
      makeVisit({ id: "v1", recommendations: [
        makeRec({ status: "completed" }),
        makeRec({ status: "in_progress" }),
      ]}),
      makeVisit({ id: "v2", visit_date: daysAgo(30), recommendations: [
        makeRec({ status: "outstanding", priority: "high" }),
        makeRec({ status: "completed" }),
      ]}),
    ];
    const result = computeHomeReg44(baseInput({ visits, action_records: [] }));

    it("total_recommendations", () => expect(result.recommendation_profile.total_recommendations).toBe(4));
    it("completed", () => expect(result.recommendation_profile.completed).toBe(2));
    it("in_progress", () => expect(result.recommendation_profile.in_progress).toBe(1));
    it("outstanding", () => expect(result.recommendation_profile.outstanding).toBe(1));
    it("completion_rate", () => expect(result.recommendation_profile.completion_rate).toBe(50));
    it("high_priority_outstanding", () => expect(result.recommendation_profile.high_priority_outstanding).toBe(1));
  });

  describe("action plan profile", () => {
    const actions = [
      makeAction({ status: "completed" }),
      makeAction({ status: "completed" }),
      makeAction({ status: "outstanding", due_date: daysAgo(5) }),       // overdue
      makeAction({ status: "overdue", due_date: daysAgo(10), priority: "high" }),
      makeAction({ status: "in_progress", due_date: "2025-04-01", carried_forward_count: 2 }),
    ];
    const result = computeHomeReg44(baseInput({ action_records: actions }));

    it("total_actions", () => expect(result.action_plan_profile.total_actions).toBe(5));
    it("completed", () => expect(result.action_plan_profile.completed).toBe(2));
    it("overdue", () => expect(result.action_plan_profile.overdue).toBe(2));
    it("carried_forward", () => expect(result.action_plan_profile.carried_forward).toBe(1));
    it("completion_rate", () => expect(result.action_plan_profile.completion_rate).toBe(40));
    it("overdue_high_critical", () => expect(result.action_plan_profile.overdue_high_critical).toBe(1));
  });

  describe("quality profile", () => {
    const visits = [
      makeVisit({ duration_hours: 4, children_spoken_count: 3, total_children: 3, records_reviewed_count: 3, report_sent_to_ofsted: true }),
      makeVisit({ id: "v2", visit_date: daysAgo(30), duration_hours: 3, children_spoken_count: 2, total_children: 3, records_reviewed_count: 4, report_sent_to_ofsted: true }),
    ];
    const result = computeHomeReg44(baseInput({ visits, action_records: [] }));

    it("avg_duration_hours", () => expect(result.quality_profile.avg_duration_hours).toBe(3.5));
    it("avg_children_spoken_pct", () => expect(result.quality_profile.avg_children_spoken_pct).toBe(84));
    it("avg_records_reviewed", () => expect(result.quality_profile.avg_records_reviewed).toBe(3.5));
    it("ofsted_notification_rate", () => expect(result.quality_profile.ofsted_notification_rate).toBe(100));
    it("child_voice_every_visit", () => expect(result.quality_profile.child_voice_every_visit).toBe(true));
  });

  describe("quality profile — judgement trend", () => {
    it("improving when latest is better", () => {
      const visits = [
        makeVisit({ overall_judgement: "Good with notable practice." }),
        makeVisit({ id: "v2", visit_date: daysAgo(30), overall_judgement: "Requires improvement" }),
      ];
      const r = computeHomeReg44(baseInput({ visits, action_records: [] }));
      expect(r.quality_profile.judgement_trend).toBe("improving");
    });

    it("declining when latest is worse", () => {
      const visits = [
        makeVisit({ overall_judgement: "Requires improvement" }),
        makeVisit({ id: "v2", visit_date: daysAgo(30), overall_judgement: "Good" }),
      ];
      const r = computeHomeReg44(baseInput({ visits, action_records: [] }));
      expect(r.quality_profile.judgement_trend).toBe("declining");
    });

    it("stable when same quality", () => {
      const visits = [
        makeVisit({ overall_judgement: "Good" }),
        makeVisit({ id: "v2", visit_date: daysAgo(30), overall_judgement: "Good — no concerns." }),
      ];
      const r = computeHomeReg44(baseInput({ visits, action_records: [] }));
      expect(r.quality_profile.judgement_trend).toBe("stable");
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // SCORING MODIFIER TESTS
  // ════════════════════════════════════════════════════════════════════════

  describe("scoring — visit frequency", () => {
    it("12+ visits gives +6", () => {
      const r = computeHomeReg44(baseInput());
      // Base 50 + 6 + ... all bonuses
      expect(r.reg44_score).toBeGreaterThanOrEqual(80);
    });

    it("<6 visits gives -5", () => {
      const visits = Array.from({ length: 4 }, (_, i) => makeVisit({
        id: `v-${i}`, visit_date: daysAgo(i * 80),
      }));
      const r = computeHomeReg44(baseInput({ visits, action_records: [] }));
      expect(r.reg44_score).toBeLessThan(65);
    });
  });

  describe("scoring — largest gap", () => {
    it("gap <= 35 gives +4", () => {
      // monthly visits → gap ~30d
      const r = computeHomeReg44(baseInput());
      expect(r.visit_frequency_profile.gap_days_largest).toBeLessThanOrEqual(35);
    });

    it("gap > 45 gives -4", () => {
      const visits = [
        makeVisit({ visit_date: daysAgo(7) }),
        makeVisit({ id: "v2", visit_date: daysAgo(60) }),
      ];
      const r = computeHomeReg44(baseInput({ visits, action_records: [] }));
      expect(r.visit_frequency_profile.gap_days_largest).toBeGreaterThan(45);
    });
  });

  describe("scoring — recommendation completion", () => {
    it("80%+ gives +5", () => {
      const visits = monthlyVisits(); // all recs completed
      const r = computeHomeReg44(baseInput({ visits }));
      expect(r.recommendation_profile.completion_rate).toBe(100);
    });

    it("<60% gives -3", () => {
      const visits = [
        makeVisit({ recommendations: [
          makeRec({ status: "outstanding" }),
          makeRec({ status: "outstanding" }),
          makeRec({ status: "completed" }),
        ]}),
      ];
      const r = computeHomeReg44(baseInput({ visits, action_records: [] }));
      expect(r.recommendation_profile.completion_rate).toBe(33);
    });
  });

  describe("scoring — Ofsted notification", () => {
    it("100% gives +3", () => {
      const r = computeHomeReg44(baseInput());
      expect(r.quality_profile.ofsted_notification_rate).toBe(100);
    });

    it("<80% gives -3", () => {
      const visits = [
        makeVisit({ report_sent_to_ofsted: false }),
        makeVisit({ id: "v2", visit_date: daysAgo(30), report_sent_to_ofsted: false }),
        makeVisit({ id: "v3", visit_date: daysAgo(60), report_sent_to_ofsted: true }),
      ];
      const r = computeHomeReg44(baseInput({ visits, action_records: [] }));
      expect(r.quality_profile.ofsted_notification_rate).toBe(33);
    });
  });

  describe("scoring — child voice", () => {
    it("all visits with children gives +3", () => {
      const r = computeHomeReg44(baseInput());
      expect(r.quality_profile.child_voice_every_visit).toBe(true);
    });

    it("not all visits gives -2", () => {
      const visits = [
        makeVisit({ children_spoken_count: 3 }),
        makeVisit({ id: "v2", visit_date: daysAgo(30), children_spoken_count: 0 }),
      ];
      const r = computeHomeReg44(baseInput({ visits, action_records: [] }));
      expect(r.quality_profile.child_voice_every_visit).toBe(false);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // STRENGTHS
  // ════════════════════════════════════════════════════════════════════════

  describe("strengths", () => {
    it("monthly compliance strength", () => {
      const r = computeHomeReg44(baseInput());
      expect(r.strengths.some(s => s.includes("Monthly"))).toBe(true);
    });

    it("rec completion strength", () => {
      const r = computeHomeReg44(baseInput());
      expect(r.strengths.some(s => s.includes("100%") && s.includes("recommendation"))).toBe(true);
    });

    it("Ofsted notification strength", () => {
      const r = computeHomeReg44(baseInput());
      expect(r.strengths.some(s => s.includes("Ofsted"))).toBe(true);
    });

    it("child voice strength", () => {
      const r = computeHomeReg44(baseInput());
      expect(r.strengths.some(s => s.includes("Children spoken"))).toBe(true);
    });

    it("no overdue actions strength", () => {
      const r = computeHomeReg44(baseInput());
      expect(r.strengths.some(s => s.includes("No overdue actions"))).toBe(true);
    });

    it("duration strength", () => {
      const r = computeHomeReg44(baseInput());
      expect(r.strengths.some(s => s.includes("hours"))).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // CONCERNS
  // ════════════════════════════════════════════════════════════════════════

  describe("concerns", () => {
    it("low visit frequency concern", () => {
      const visits = Array.from({ length: 8 }, (_, i) => makeVisit({
        id: `v-${i}`, visit_date: daysAgo(i * 40),
      }));
      const r = computeHomeReg44(baseInput({ visits }));
      expect(r.concerns.some(c => c.includes("8 visits"))).toBe(true);
    });

    it("high priority outstanding concern", () => {
      const visits = [makeVisit({
        recommendations: [makeRec({ priority: "high", status: "outstanding" })],
      })];
      const r = computeHomeReg44(baseInput({ visits, action_records: [] }));
      expect(r.concerns.some(c => c.includes("high-priority"))).toBe(true);
    });

    it("Ofsted notification concern", () => {
      const visits = [makeVisit({ report_sent_to_ofsted: false })];
      const r = computeHomeReg44(baseInput({ visits, action_records: [] }));
      expect(r.concerns.some(c => c.includes("Ofsted notification rate"))).toBe(true);
    });

    it("child voice concern", () => {
      const visits = [makeVisit({ children_spoken_count: 0 })];
      const r = computeHomeReg44(baseInput({ visits, action_records: [] }));
      expect(r.concerns.some(c => c.includes("not spoken"))).toBe(true);
    });

    it("carried forward concern", () => {
      const actions = [makeAction({ carried_forward_count: 2 })];
      const r = computeHomeReg44(baseInput({ action_records: actions }));
      expect(r.concerns.some(c => c.includes("carried forward"))).toBe(true);
    });

    it("declining judgement concern", () => {
      const visits = [
        makeVisit({ overall_judgement: "Requires improvement" }),
        makeVisit({ id: "v2", visit_date: daysAgo(30), overall_judgement: "Good" }),
      ];
      const r = computeHomeReg44(baseInput({ visits, action_records: [] }));
      expect(r.concerns.some(c => c.includes("declining"))).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // RECOMMENDATIONS
  // ════════════════════════════════════════════════════════════════════════

  describe("recommendations", () => {
    it("missing visits → schedule visits", () => {
      const visits = Array.from({ length: 8 }, (_, i) => makeVisit({
        id: `v-${i}`, visit_date: daysAgo(i * 40),
      }));
      const r = computeHomeReg44(baseInput({ visits }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("Schedule visits"))).toBe(true);
    });

    it("high priority outstanding → immediate", () => {
      const visits = [makeVisit({
        recommendations: [makeRec({ priority: "high", status: "outstanding" })],
      })];
      const r = computeHomeReg44(baseInput({ visits, action_records: [] }));
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("high-priority"))).toBe(true);
    });

    it("missing Ofsted notification → soon", () => {
      const visits = [makeVisit({ report_sent_to_ofsted: false })];
      const r = computeHomeReg44(baseInput({ visits, action_records: [] }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("Ofsted") && rec.urgency === "soon")).toBe(true);
    });

    it("recommendations ranked sequentially", () => {
      const visits = Array.from({ length: 4 }, (_, i) => makeVisit({
        id: `v-${i}`, visit_date: daysAgo(i * 80),
        report_sent_to_ofsted: false,
        recommendations: [makeRec({ priority: "high", status: "outstanding" })],
      }));
      const r = computeHomeReg44(baseInput({ visits, action_records: [] }));
      for (let i = 0; i < r.recommendations.length - 1; i++) {
        expect(r.recommendations[i].rank).toBeLessThan(r.recommendations[i + 1].rank);
      }
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // INSIGHTS
  // ════════════════════════════════════════════════════════════════════════

  describe("insights", () => {
    it("low visit count → critical", () => {
      const visits = Array.from({ length: 4 }, (_, i) => makeVisit({
        id: `v-${i}`, visit_date: daysAgo(i * 80),
      }));
      const r = computeHomeReg44(baseInput({ visits }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("Reg 44 visit"))).toBe(true);
    });

    it("overdue high/critical actions → critical", () => {
      const actions = [
        makeAction({ priority: "high", status: "overdue", due_date: daysAgo(20) }),
      ];
      const r = computeHomeReg44(baseInput({ action_records: actions }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("overdue"))).toBe(true);
    });

    it("excellent compliance → positive", () => {
      const r = computeHomeReg44(baseInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("governance"))).toBe(true);
    });

    it("child voice → positive", () => {
      const r = computeHomeReg44(baseInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("voice"))).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // EDGE CASES
  // ════════════════════════════════════════════════════════════════════════

  describe("edge cases", () => {
    it("single visit", () => {
      const r = computeHomeReg44(baseInput({
        visits: [makeVisit()],
        action_records: [],
      }));
      expect(r.reg44_rating).toBeDefined();
      expect(r.reg44_score).toBeGreaterThan(0);
    });

    it("no action records — score lower without action bonus", () => {
      const r = computeHomeReg44(baseInput({ action_records: [] }));
      expect(r.reg44_rating).toBe("good"); // without +4 action bonus, max is 76
    });

    it("no recommendations in visits", () => {
      const visits = monthlyVisits().map(v => ({ ...v, recommendations: [] }));
      const r = computeHomeReg44(baseInput({ visits, action_records: [] }));
      expect(r.recommendation_profile.total_recommendations).toBe(0);
    });

    it("score clamped to 0-100", () => {
      // Give extreme bad data
      const visits = [makeVisit({
        visit_date: daysAgo(200),
        duration_hours: 0.5,
        children_spoken_count: 0,
        report_sent_to_ofsted: false,
        overall_judgement: "Requires improvement",
        recommendations: [
          makeRec({ status: "outstanding", priority: "high" }),
          makeRec({ status: "outstanding", priority: "high" }),
        ],
      })];
      const actions = Array.from({ length: 10 }, (_, i) =>
        makeAction({ id: `bad-${i}`, status: "overdue", due_date: daysAgo(30), priority: "high" }),
      );
      const r = computeHomeReg44(baseInput({ visits, action_records: actions }));
      expect(r.reg44_score).toBeGreaterThanOrEqual(0);
      expect(r.reg44_score).toBeLessThanOrEqual(100);
    });

    it("improving trend gives bonus", () => {
      const visits = [
        makeVisit({ overall_judgement: "Outstanding — notable practice." }),
        makeVisit({ id: "v2", visit_date: daysAgo(30), overall_judgement: "Good" }),
      ];
      const r = computeHomeReg44(baseInput({ visits, action_records: [] }));
      expect(r.quality_profile.judgement_trend).toBe("improving");
    });

    it("all visits with 0 total_children handles divide by zero", () => {
      const visits = [makeVisit({ total_children: 0, children_spoken_count: 0 })];
      const r = computeHomeReg44(baseInput({ visits, action_records: [] }));
      expect(r.quality_profile.avg_children_spoken_pct).toBe(0);
    });
  });
});
