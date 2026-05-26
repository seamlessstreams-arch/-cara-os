import {
  computeHomeSupervision,
  type HomeSupervisionInput,
  type SupervisionInput,
  type ObservationInput,
  type AppraisalInput,
} from "../home-supervision-intelligence-engine";

// ── Helpers ────────────────────────────────────────────────────────────────

const TODAY = "2025-03-15";
const STAFF_IDS = ["S1", "S2", "S3", "S4", "S5"];

function makeSup(overrides: Partial<SupervisionInput> = {}): SupervisionInput {
  return {
    id: `sup-${Math.random().toString(36).slice(2, 8)}`,
    date: "2025-03-01",
    staff_id: "S1",
    type: "formal",
    status: "completed",
    duration_minutes: 60,
    actions_total: 3,
    actions_completed: 3,
    wellbeing_score: 8,
    both_signatures: true,
    ...overrides,
  };
}

function makeObs(overrides: Partial<ObservationInput> = {}): ObservationInput {
  return {
    id: `obs-${Math.random().toString(36).slice(2, 8)}`,
    date: "2025-03-05",
    staff_id: "S1",
    outcome: "meets_standard",
    domains_count: 3,
    strengths_count: 3,
    development_areas_count: 1,
    signed_off: true,
    ...overrides,
  };
}

function makeAppr(overrides: Partial<AppraisalInput> = {}): AppraisalInput {
  return {
    id: `appr-${Math.random().toString(36).slice(2, 8)}`,
    date: "2025-02-15",
    staff_id: "S1",
    status: "completed",
    overall_rating: "good",
    avg_competency_score: 4.0,
    signed: true,
    next_review_date: "2026-02-15",
    ...overrides,
  };
}

function baseInput(overrides: Partial<HomeSupervisionInput> = {}): HomeSupervisionInput {
  return {
    today: TODAY,
    staff_ids: STAFF_IDS,
    total_staff: 5,
    supervisions: [
      makeSup({ id: "sup1", staff_id: "S1" }),
      makeSup({ id: "sup2", staff_id: "S2" }),
      makeSup({ id: "sup3", staff_id: "S3" }),
      makeSup({ id: "sup4", staff_id: "S4" }),
      makeSup({ id: "sup5", staff_id: "S5" }),
    ],
    observations: [
      makeObs({ id: "obs1", staff_id: "S1" }),
      makeObs({ id: "obs2", staff_id: "S2" }),
      makeObs({ id: "obs3", staff_id: "S3" }),
      makeObs({ id: "obs4", staff_id: "S4" }),
      makeObs({ id: "obs5", staff_id: "S5" }),
    ],
    appraisals: [
      makeAppr({ id: "a1", staff_id: "S1" }),
      makeAppr({ id: "a2", staff_id: "S2" }),
      makeAppr({ id: "a3", staff_id: "S3" }),
      makeAppr({ id: "a4", staff_id: "S4" }),
      makeAppr({ id: "a5", staff_id: "S5" }),
    ],
    ...overrides,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// RATING TIER TESTS
// ════════════════════════════════════════════════════════════════════════════

describe("Home Supervision Intelligence Engine", () => {

  // ── Insufficient data ──────────────────────────────────────────────────

  describe("insufficient data", () => {
    const result = computeHomeSupervision(baseInput({
      supervisions: [],
      observations: [],
      appraisals: [],
    }));

    it("rates insufficient_data", () => expect(result.supervision_rating).toBe("insufficient_data"));
    it("scores 0", () => expect(result.supervision_score).toBe(0));
    it("has critical insight", () => expect(result.insights.some(i => i.severity === "critical")).toBe(true));
    it("has immediate recommendation", () => expect(result.recommendations.some(r => r.urgency === "immediate")).toBe(true));
    it("has concern about no records", () => expect(result.concerns.length).toBeGreaterThan(0));
  });

  // ── Outstanding ────────────────────────────────────────────────────────
  // All 5 staff: supervised, observed, appraised, everything perfect
  // Score: 50+6+4+3+4+4+2+4+2+3+2+2 = 86

  describe("outstanding rating", () => {
    const result = computeHomeSupervision(baseInput());

    it("rates outstanding", () => expect(result.supervision_rating).toBe("outstanding"));
    it("scores 86", () => expect(result.supervision_score).toBe(86));
    it("headline mentions outstanding", () => expect(result.headline).toContain("Outstanding"));
    it("has strengths", () => expect(result.strengths.length).toBeGreaterThan(0));
    it("has no concerns", () => expect(result.concerns).toHaveLength(0));
  });

  // ── Good ───────────────────────────────────────────────────────────────
  // 4/5 staff supervised, 3/5 observed, 1 overdue appraisal, competency 3.0
  // Score: 50+3+4+3+4+4+2+2-3+1+2+2 = 74

  describe("good rating", () => {
    const result = computeHomeSupervision(baseInput({
      supervisions: [
        makeSup({ id: "sup1", staff_id: "S1" }),
        makeSup({ id: "sup2", staff_id: "S2" }),
        makeSup({ id: "sup3", staff_id: "S3" }),
        makeSup({ id: "sup4", staff_id: "S4" }),
        // S5 not supervised
      ],
      observations: [
        makeObs({ id: "obs1", staff_id: "S1" }),
        makeObs({ id: "obs2", staff_id: "S2" }),
        makeObs({ id: "obs3", staff_id: "S3" }),
        // S4, S5 not observed
      ],
      appraisals: [
        makeAppr({ id: "a1", staff_id: "S1", avg_competency_score: 3.0 }),
        makeAppr({ id: "a2", staff_id: "S2", avg_competency_score: 3.0 }),
        makeAppr({ id: "a3", staff_id: "S3", avg_competency_score: 3.0 }),
        makeAppr({ id: "a4", staff_id: "S4", status: "overdue", avg_competency_score: 0 }),
        // S5 no appraisal
      ],
    }));

    it("rates good", () => expect(result.supervision_rating).toBe("good"));
    it("scores 74", () => expect(result.supervision_score).toBe(74));
    it("headline mentions good", () => expect(result.headline).toContain("Good"));
    it("has concerns about gaps", () => expect(result.concerns.length).toBeGreaterThan(0));
  });

  // ── Adequate ───────────────────────────────────────────────────────────
  // 4/5 supervised (80%), 2/5 observed (40%), 1 overdue, low actions, poor sigs
  // Score: 50+3+2-3+2-3-1+2-3+1-2+0 = 48

  describe("adequate rating", () => {
    const result = computeHomeSupervision(baseInput({
      supervisions: [
        makeSup({ id: "sup1", staff_id: "S1", actions_total: 2, actions_completed: 1, both_signatures: false, wellbeing_score: 5 }),
        makeSup({ id: "sup2", staff_id: "S2", actions_total: 2, actions_completed: 1, both_signatures: false, wellbeing_score: 5 }),
        makeSup({ id: "sup3", staff_id: "S3", actions_total: 2, actions_completed: 1, both_signatures: true, wellbeing_score: 5 }),
        makeSup({ id: "sup4", staff_id: "S4", actions_total: 2, actions_completed: 1, both_signatures: true, wellbeing_score: 5 }),
        makeSup({ id: "sup5", staff_id: "S5", status: "cancelled" }),
        // 4/5 completed = 80%; coverage = 4/5 = 80%; actions = 4/8 = 50%; sigs = 2/4 = 50%
      ],
      observations: [
        makeObs({ id: "obs1", staff_id: "S1", outcome: "meets_standard", signed_off: true }),
        makeObs({ id: "obs2", staff_id: "S2", outcome: "developing", signed_off: false }),
        // 2/5 observed = 40%; positive = 1/2 = 50%; signOff = 1/2 = 50%
      ],
      appraisals: [
        makeAppr({ id: "a1", staff_id: "S1", avg_competency_score: 2.5 }),
        makeAppr({ id: "a2", staff_id: "S2", avg_competency_score: 2.5 }),
        makeAppr({ id: "a3", staff_id: "S3", avg_competency_score: 2.5 }),
        makeAppr({ id: "a4", staff_id: "S4", status: "overdue", avg_competency_score: 0 }),
        // completed = 3/5 = 60%; overdue = 1; avgComp = 2.5
      ],
    }));

    it("rates adequate", () => expect(result.supervision_rating).toBe("adequate"));
    it("scores 48", () => expect(result.supervision_score).toBe(48));
    it("headline mentions adequate", () => expect(result.headline).toContain("Adequate"));
    it("has concerns", () => expect(result.concerns.length).toBeGreaterThan(0));
    it("has recommendations", () => expect(result.recommendations.length).toBeGreaterThan(0));
  });

  // ── Inadequate ─────────────────────────────────────────────────────────
  // 1/5 supervised, 0 observed, 2 overdue appraisals
  // Score: 50-4-3-3-3-3+0-3-3-2-2-2 = 22

  describe("inadequate rating", () => {
    const result = computeHomeSupervision(baseInput({
      supervisions: [
        makeSup({ id: "sup1", staff_id: "S1", actions_total: 3, actions_completed: 1, both_signatures: false, wellbeing_score: 3 }),
        makeSup({ id: "sup2", staff_id: "S2", status: "cancelled" }),
        // 1 completed / 2 total = 50%; coverage = 1/5 = 20%
      ],
      observations: [],
      appraisals: [
        makeAppr({ id: "a1", staff_id: "S1", avg_competency_score: 1.5 }),
        makeAppr({ id: "a2", staff_id: "S2", avg_competency_score: 1.5 }),
        makeAppr({ id: "a3", staff_id: "S3", status: "overdue", avg_competency_score: 0 }),
        makeAppr({ id: "a4", staff_id: "S4", status: "overdue", avg_competency_score: 0 }),
        // completed = 2/5 = 40%; overdue = 2; avgCompetency = 1.5
      ],
    }));

    it("rates inadequate", () => expect(result.supervision_rating).toBe("inadequate"));
    it("scores below 45", () => expect(result.supervision_score).toBeLessThan(45));
    it("headline mentions inadequate", () => expect(result.headline).toContain("inadequate"));
    it("has critical insights", () => expect(result.insights.some(i => i.severity === "critical")).toBe(true));
    it("has immediate recommendations", () => expect(result.recommendations.some(r => r.urgency === "immediate")).toBe(true));
    it("has multiple concerns", () => expect(result.concerns.length).toBeGreaterThanOrEqual(3));
  });

  // ════════════════════════════════════════════════════════════════════════
  // PROFILE CALCULATION TESTS
  // ════════════════════════════════════════════════════════════════════════

  describe("supervision profile", () => {
    const sups = [
      makeSup({ id: "s1", staff_id: "S1", type: "formal", actions_total: 3, actions_completed: 2, wellbeing_score: 7, both_signatures: true }),
      makeSup({ id: "s2", staff_id: "S2", type: "informal", actions_total: 2, actions_completed: 2, wellbeing_score: 8, both_signatures: true }),
      makeSup({ id: "s3", staff_id: "S3", type: "formal", status: "cancelled", actions_total: 0, actions_completed: 0, wellbeing_score: null, both_signatures: false }),
    ];
    const result = computeHomeSupervision(baseInput({ supervisions: sups }));
    const p = result.supervision_profile;

    it("total_supervisions_90d", () => expect(p.total_supervisions_90d).toBe(3));
    it("completed_count", () => expect(p.completed_count).toBe(2));
    it("completion_rate", () => expect(p.completion_rate).toBe(67));
    it("formal_count", () => expect(p.formal_count).toBe(1)); // only completed formals
    it("action_completion_rate", () => expect(p.action_completion_rate).toBe(80)); // 4/5
    it("avg_wellbeing_score", () => expect(p.avg_wellbeing_score).toBe(7.5));
    it("signature_rate", () => expect(p.signature_rate).toBe(100)); // 2/2 completed
    it("staff_with_supervision includes S1, S2", () => expect(p.staff_with_supervision.sort()).toEqual(["S1", "S2"]));
    it("staff_without_supervision", () => expect(p.staff_without_supervision.sort()).toEqual(["S3", "S4", "S5"]));
  });

  describe("observation profile", () => {
    const obs = [
      makeObs({ id: "o1", staff_id: "S1", outcome: "outstanding", signed_off: true }),
      makeObs({ id: "o2", staff_id: "S2", outcome: "meets_standard", signed_off: true }),
      makeObs({ id: "o3", staff_id: "S3", outcome: "developing", signed_off: false }),
      makeObs({ id: "o4", staff_id: "S4", outcome: "requires_support", signed_off: false }),
    ];
    const result = computeHomeSupervision(baseInput({ observations: obs }));
    const p = result.observation_profile;

    it("total_observations_90d", () => expect(p.total_observations_90d).toBe(4));
    it("outstanding_count", () => expect(p.outstanding_count).toBe(1));
    it("meets_standard_count", () => expect(p.meets_standard_count).toBe(1));
    it("developing_count", () => expect(p.developing_count).toBe(1));
    it("requires_support_count", () => expect(p.requires_support_count).toBe(1));
    it("positive_outcome_rate", () => expect(p.positive_outcome_rate).toBe(50)); // 2/4
    it("staff_observed", () => expect(p.staff_observed.sort()).toEqual(["S1", "S2", "S3", "S4"]));
    it("staff_not_observed", () => expect(p.staff_not_observed).toEqual(["S5"]));
    it("sign_off_rate", () => expect(p.sign_off_rate).toBe(50)); // 2/4
  });

  describe("appraisal profile", () => {
    const apprs = [
      makeAppr({ id: "a1", staff_id: "S1", status: "completed", avg_competency_score: 4.0 }),
      makeAppr({ id: "a2", staff_id: "S2", status: "completed", avg_competency_score: 3.0 }),
      makeAppr({ id: "a3", staff_id: "S3", status: "overdue", avg_competency_score: 0 }),
    ];
    const result = computeHomeSupervision(baseInput({ appraisals: apprs }));
    const p = result.appraisal_profile;

    it("total_appraisals", () => expect(p.total_appraisals).toBe(3));
    it("completed_count", () => expect(p.completed_count).toBe(2));
    it("overdue_count", () => expect(p.overdue_count).toBe(1));
    it("avg_competency_score", () => expect(p.avg_competency_score).toBe(3.5)); // (4+3)/2
    it("staff_with_appraisal", () => expect(p.staff_with_appraisal.sort()).toEqual(["S1", "S2"]));
    it("staff_without_appraisal", () => expect(p.staff_without_appraisal.sort()).toEqual(["S3", "S4", "S5"]));
  });

  // ════════════════════════════════════════════════════════════════════════
  // SCORING MODIFIER TESTS
  // ════════════════════════════════════════════════════════════════════════

  describe("scoring — supervision coverage", () => {
    it("100% coverage gives +6", () => {
      const r = computeHomeSupervision(baseInput());
      // base has all 5 staff supervised
      expect(r.supervision_profile.staff_without_supervision).toHaveLength(0);
    });

    it("<80% coverage gives -4", () => {
      const r = computeHomeSupervision(baseInput({
        supervisions: [makeSup({ id: "s1", staff_id: "S1" })],
        // 1/5 = 20% coverage
      }));
      expect(r.supervision_profile.staff_without_supervision).toHaveLength(4);
    });
  });

  describe("scoring — action completion", () => {
    it(">=80% actions gives +3", () => {
      const r = computeHomeSupervision(baseInput());
      expect(r.supervision_profile.action_completion_rate).toBe(100);
    });

    it("<60% actions gives -3", () => {
      const r = computeHomeSupervision(baseInput({
        supervisions: STAFF_IDS.map((id, i) =>
          makeSup({ id: `s${i}`, staff_id: id, actions_total: 4, actions_completed: 1 })
        ),
      }));
      expect(r.supervision_profile.action_completion_rate).toBe(25);
    });
  });

  describe("scoring — observation quality", () => {
    it(">=80% positive outcomes gives +4", () => {
      const r = computeHomeSupervision(baseInput());
      expect(r.observation_profile.positive_outcome_rate).toBe(100);
    });

    it("<60% positive outcomes gives -3", () => {
      const r = computeHomeSupervision(baseInput({
        observations: [
          makeObs({ id: "o1", staff_id: "S1", outcome: "developing" }),
          makeObs({ id: "o2", staff_id: "S2", outcome: "requires_support" }),
          makeObs({ id: "o3", staff_id: "S3", outcome: "meets_standard" }),
        ],
      }));
      // 1/3 = 33% positive
      expect(r.observation_profile.positive_outcome_rate).toBe(33);
    });
  });

  describe("scoring — appraisal overdue", () => {
    it("0 overdue gives +2", () => {
      const r = computeHomeSupervision(baseInput());
      expect(r.appraisal_profile.overdue_count).toBe(0);
    });

    it("overdue appraisals gives -3", () => {
      const r = computeHomeSupervision(baseInput({
        appraisals: [
          makeAppr({ id: "a1", staff_id: "S1" }),
          makeAppr({ id: "a2", staff_id: "S2", status: "overdue" }),
        ],
      }));
      expect(r.appraisal_profile.overdue_count).toBe(1);
    });
  });

  describe("scoring — wellbeing", () => {
    it("avg wellbeing >=7 gives +2", () => {
      const r = computeHomeSupervision(baseInput());
      expect(r.supervision_profile.avg_wellbeing_score).toBe(8);
    });

    it("avg wellbeing <4 gives -2", () => {
      const r = computeHomeSupervision(baseInput({
        supervisions: STAFF_IDS.map((id, i) =>
          makeSup({ id: `s${i}`, staff_id: id, wellbeing_score: 3 })
        ),
      }));
      expect(r.supervision_profile.avg_wellbeing_score).toBe(3);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 90-DAY WINDOW
  // ════════════════════════════════════════════════════════════════════════

  describe("90-day window", () => {
    it("excludes supervisions older than 90 days", () => {
      const r = computeHomeSupervision(baseInput({
        supervisions: [makeSup({ id: "s1", staff_id: "S1", date: "2024-12-01" })],
      }));
      expect(r.supervision_profile.total_supervisions_90d).toBe(0);
    });

    it("excludes observations older than 90 days", () => {
      const r = computeHomeSupervision(baseInput({
        observations: [makeObs({ id: "o1", staff_id: "S1", date: "2024-12-01" })],
      }));
      expect(r.observation_profile.total_observations_90d).toBe(0);
    });

    it("appraisals have no window — latest per staff used", () => {
      const r = computeHomeSupervision(baseInput({
        appraisals: [
          makeAppr({ id: "a1", staff_id: "S1", date: "2024-01-01", avg_competency_score: 2.0 }),
          makeAppr({ id: "a2", staff_id: "S1", date: "2025-01-01", avg_competency_score: 4.0 }),
        ],
      }));
      // Should use the later one (4.0)
      expect(r.appraisal_profile.avg_competency_score).toBe(4);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // STRENGTHS
  // ════════════════════════════════════════════════════════════════════════

  describe("strengths", () => {
    const result = computeHomeSupervision(baseInput());

    it("all staff supervised strength", () => expect(result.strengths.some(s => s.includes("All staff"))).toBe(true));
    it("completion rate strength", () => expect(result.strengths.some(s => s.includes("completed"))).toBe(true));
    it("action completion strength", () => expect(result.strengths.some(s => s.includes("action completion"))).toBe(true));
    it("observation quality strength", () => expect(result.strengths.some(s => s.includes("observation"))).toBe(true));
    it("competency strength", () => expect(result.strengths.some(s => s.includes("competency"))).toBe(true));
    it("wellbeing strength", () => expect(result.strengths.some(s => s.includes("wellbeing"))).toBe(true));
  });

  // ════════════════════════════════════════════════════════════════════════
  // CONCERNS
  // ════════════════════════════════════════════════════════════════════════

  describe("concerns", () => {
    it("staff without supervision concern", () => {
      const r = computeHomeSupervision(baseInput({
        supervisions: [makeSup({ id: "s1", staff_id: "S1" })],
      }));
      expect(r.concerns.some(c => c.includes("not received supervision"))).toBe(true);
    });

    it("overdue appraisal concern", () => {
      const r = computeHomeSupervision(baseInput({
        appraisals: [
          makeAppr({ id: "a1", staff_id: "S1" }),
          makeAppr({ id: "a2", staff_id: "S2", status: "overdue" }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("overdue"))).toBe(true);
    });

    it("requires support concern", () => {
      const r = computeHomeSupervision(baseInput({
        observations: [
          makeObs({ id: "o1", staff_id: "S1", outcome: "requires_support" }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("requires support"))).toBe(true);
    });

    it("low signature rate concern", () => {
      const r = computeHomeSupervision(baseInput({
        supervisions: STAFF_IDS.map((id, i) =>
          makeSup({ id: `s${i}`, staff_id: id, both_signatures: false })
        ),
      }));
      expect(r.concerns.some(c => c.includes("signed"))).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // RECOMMENDATIONS
  // ════════════════════════════════════════════════════════════════════════

  describe("recommendations", () => {
    it("unsupervised staff → immediate", () => {
      const r = computeHomeSupervision(baseInput({
        supervisions: [makeSup({ id: "s1", staff_id: "S1" })],
      }));
      const rec = r.recommendations.find(x => x.recommendation.includes("supervision"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
      expect(rec!.regulatory_ref).toBe("Reg 33");
    });

    it("overdue appraisals → immediate", () => {
      const r = computeHomeSupervision(baseInput({
        appraisals: [makeAppr({ id: "a1", staff_id: "S1", status: "overdue" })],
      }));
      const rec = r.recommendations.find(x => x.recommendation.includes("overdue"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("requires support → soon", () => {
      const r = computeHomeSupervision(baseInput({
        observations: [makeObs({ id: "o1", staff_id: "S1", outcome: "requires_support" })],
      }));
      const rec = r.recommendations.find(x => x.recommendation.includes("development"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("recommendations are ranked sequentially", () => {
      const r = computeHomeSupervision(baseInput({
        supervisions: [makeSup({ id: "s1", staff_id: "S1", actions_total: 5, actions_completed: 1 })],
        observations: [makeObs({ id: "o1", staff_id: "S1", outcome: "requires_support" })],
        appraisals: [makeAppr({ id: "a1", staff_id: "S1", status: "overdue" })],
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
    it("unsupervised staff → critical", () => {
      const r = computeHomeSupervision(baseInput({
        supervisions: [makeSup({ id: "s1", staff_id: "S1" })],
      }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("without supervision"))).toBe(true);
    });

    it("overdue appraisals → critical", () => {
      const r = computeHomeSupervision(baseInput({
        appraisals: [makeAppr({ id: "a1", staff_id: "S1", status: "overdue" })],
      }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("overdue"))).toBe(true);
    });

    it("requires support → warning", () => {
      const r = computeHomeSupervision(baseInput({
        observations: [makeObs({ id: "o1", staff_id: "S1", outcome: "requires_support" })],
      }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("requires support"))).toBe(true);
    });

    it("full coverage + completion → positive", () => {
      const r = computeHomeSupervision(baseInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("All staff supervised"))).toBe(true);
    });

    it("high observation quality → positive", () => {
      const r = computeHomeSupervision(baseInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("positive observation"))).toBe(true);
    });

    it("high competency → positive", () => {
      const r = computeHomeSupervision(baseInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("competency"))).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // EDGE CASES
  // ════════════════════════════════════════════════════════════════════════

  describe("edge cases", () => {
    it("cancelled supervisions don't count as completed", () => {
      const r = computeHomeSupervision(baseInput({
        supervisions: [
          makeSup({ id: "s1", staff_id: "S1", status: "cancelled" }),
          makeSup({ id: "s2", staff_id: "S2", status: "completed" }),
        ],
      }));
      expect(r.supervision_profile.completed_count).toBe(1);
      expect(r.supervision_profile.completion_rate).toBe(50);
    });

    it("null wellbeing scores are excluded from average", () => {
      const r = computeHomeSupervision(baseInput({
        supervisions: [
          makeSup({ id: "s1", staff_id: "S1", wellbeing_score: 6 }),
          makeSup({ id: "s2", staff_id: "S2", wellbeing_score: null }),
        ],
      }));
      expect(r.supervision_profile.avg_wellbeing_score).toBe(6);
    });

    it("multiple appraisals for same staff uses latest", () => {
      const r = computeHomeSupervision(baseInput({
        appraisals: [
          makeAppr({ id: "a1", staff_id: "S1", date: "2024-06-01", avg_competency_score: 2.0, overall_rating: "requires_improvement" }),
          makeAppr({ id: "a2", staff_id: "S1", date: "2025-02-01", avg_competency_score: 4.0, overall_rating: "good" }),
        ],
      }));
      expect(r.appraisal_profile.avg_competency_score).toBe(4);
      expect(r.appraisal_profile.total_appraisals).toBe(1); // deduplicated per staff
    });

    it("score is clamped to 0-100", () => {
      const r = computeHomeSupervision(baseInput());
      expect(r.supervision_score).toBeGreaterThanOrEqual(0);
      expect(r.supervision_score).toBeLessThanOrEqual(100);
    });
  });
});
