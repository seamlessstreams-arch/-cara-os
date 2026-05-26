import {
  computeHomeRestrictivePractice,
  type HomeRestrictivePracticeInput,
  type RestraintInput,
} from "../home-restrictive-practice-intelligence-engine";

// ── Helpers ────────────────────────────────────────────────────────────────

const TODAY = "2025-03-15";

function makeRestraint(overrides: Partial<RestraintInput> = {}): RestraintInput {
  return {
    id: `r-${Math.random().toString(36).slice(2, 8)}`,
    date: "2025-03-10",
    child_id: "C1",
    duration_minutes: 3,
    staff_count: 2,
    all_team_teach_trained: true,
    reason: "imminent_harm_to_others",
    de_escalation_count: 3,
    has_justification: true,
    child_debriefed: true,
    staff_debriefed: true,
    review_status: "reviewed",
    has_injuries: false,
    body_map_completed: true,
    medical_check_required: false,
    medical_check_completed: false,
    ...overrides,
  };
}

function baseInput(overrides: Partial<HomeRestrictivePracticeInput> = {}): HomeRestrictivePracticeInput {
  return {
    today: TODAY,
    total_children: 3,
    child_ids: ["C1", "C2", "C3"],
    restraints: [
      makeRestraint({ id: "r1", child_id: "C1" }),
      makeRestraint({ id: "r2", child_id: "C2" }),
    ],
    ...overrides,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// RATING TIER TESTS
// ════════════════════════════════════════════════════════════════════════════

describe("Home Restrictive Practice Intelligence Engine", () => {

  // ── Zero restraints ────────────────────────────────────────────────────

  describe("zero restraints — outstanding", () => {
    const result = computeHomeRestrictivePractice(baseInput({ restraints: [] }));

    it("rates outstanding", () => expect(result.restrictive_rating).toBe("outstanding"));
    it("scores 90", () => expect(result.restrictive_score).toBe(90));
    it("headline mentions zero restraints", () => expect(result.headline).toContain("No restraints"));
    it("profile total_restraints_90d is 0", () => expect(result.restraint_profile.total_restraints_90d).toBe(0));
    it("has positive strength", () => expect(result.strengths.length).toBeGreaterThan(0));
    it("has no concerns", () => expect(result.concerns).toHaveLength(0));
    it("has no recommendations", () => expect(result.recommendations).toHaveLength(0));
    it("has positive insight", () => expect(result.insights.some(i => i.severity === "positive")).toBe(true));
  });

  // ── Outstanding with data ──────────────────────────────────────────────
  // 2 restraints, different children, all perfect
  // Score: 55+5+5+4+3+4+3+3+2+2+0 = 86

  describe("outstanding with data", () => {
    const result = computeHomeRestrictivePractice(baseInput());

    it("rates outstanding", () => expect(result.restrictive_rating).toBe("outstanding"));
    it("scores 86", () => expect(result.restrictive_score).toBe(86));
    it("headline mentions outstanding", () => expect(result.headline).toContain("Outstanding"));
    it("has strengths", () => expect(result.strengths.length).toBeGreaterThan(0));
    it("has no concerns", () => expect(result.concerns).toHaveLength(0));
  });

  // ── Good ───────────────────────────────────────────────────────────────
  // 2 restraints, same child (repeat), 1 body map missing
  // Score: 55+5+5+4+3+4-2+3+2+2-2 = 79

  describe("good rating", () => {
    const result = computeHomeRestrictivePractice(baseInput({
      restraints: [
        makeRestraint({ id: "r1", child_id: "C1" }),
        makeRestraint({ id: "r2", child_id: "C1", body_map_completed: false }),
      ],
    }));

    it("rates good", () => expect(result.restrictive_rating).toBe("good"));
    it("scores 79", () => expect(result.restrictive_score).toBe(79));
    it("headline mentions good", () => expect(result.headline).toContain("Good"));
    it("has repeat child concern", () => expect(result.concerns.some(c => c.includes("multiple times"))).toBe(true));
  });

  // ── Adequate ───────────────────────────────────────────────────────────
  // 3 restraints, 1 pending review, 1 child not debriefed, 1 body map missing, repeat child
  // Score: 55+0+5-4+3-4-2+3+2+2-2 = 58

  describe("adequate rating", () => {
    const result = computeHomeRestrictivePractice(baseInput({
      restraints: [
        makeRestraint({ id: "r1", child_id: "C1" }),
        makeRestraint({ id: "r2", child_id: "C1", child_debriefed: false, review_status: "pending", body_map_completed: false }),
        makeRestraint({ id: "r3", child_id: "C2" }),
      ],
    }));

    it("rates adequate", () => expect(result.restrictive_rating).toBe("adequate"));
    it("scores 58", () => expect(result.restrictive_score).toBe(58));
    it("headline mentions adequate", () => expect(result.headline).toContain("Adequate"));
    it("has concerns", () => expect(result.concerns.length).toBeGreaterThan(0));
    it("has recommendations", () => expect(result.recommendations.length).toBeGreaterThan(0));
  });

  // ── Inadequate ─────────────────────────────────────────────────────────
  // 6 restraints, multiple failures across all dimensions

  describe("inadequate rating", () => {
    const result = computeHomeRestrictivePractice(baseInput({
      restraints: [
        makeRestraint({ id: "r1", child_id: "C1", duration_minutes: 15, de_escalation_count: 0, child_debriefed: false, staff_debriefed: false, review_status: "pending", body_map_completed: false, all_team_teach_trained: false, has_injuries: true }),
        makeRestraint({ id: "r2", child_id: "C1", duration_minutes: 12, de_escalation_count: 1, child_debriefed: false, staff_debriefed: false, review_status: "pending", body_map_completed: false, all_team_teach_trained: false, has_injuries: true }),
        makeRestraint({ id: "r3", child_id: "C1", duration_minutes: 10, de_escalation_count: 2, child_debriefed: true, staff_debriefed: true, review_status: "reviewed", body_map_completed: true, all_team_teach_trained: true }),
        makeRestraint({ id: "r4", child_id: "C2", duration_minutes: 8, de_escalation_count: 0, child_debriefed: false, staff_debriefed: false, review_status: "pending", body_map_completed: false, all_team_teach_trained: false }),
        makeRestraint({ id: "r5", child_id: "C2", duration_minutes: 10, de_escalation_count: 2, child_debriefed: true, staff_debriefed: true, review_status: "reviewed", body_map_completed: true, all_team_teach_trained: true }),
        makeRestraint({ id: "r6", child_id: "C3", duration_minutes: 15, de_escalation_count: 0, child_debriefed: false, staff_debriefed: true, review_status: "pending", body_map_completed: true, all_team_teach_trained: false }),
      ],
    }));

    it("rates inadequate", () => expect(result.restrictive_rating).toBe("inadequate"));
    it("scores below 45", () => expect(result.restrictive_score).toBeLessThan(45));
    it("headline mentions inadequate", () => expect(result.headline).toContain("inadequate"));
    it("has multiple concerns", () => expect(result.concerns.length).toBeGreaterThanOrEqual(3));
    it("has immediate recommendations", () => expect(result.recommendations.some(r => r.urgency === "immediate")).toBe(true));
    it("has critical insights", () => expect(result.insights.some(i => i.severity === "critical")).toBe(true));
  });

  // ════════════════════════════════════════════════════════════════════════
  // PROFILE CALCULATION TESTS
  // ════════════════════════════════════════════════════════════════════════

  describe("restraint profile", () => {
    const restraints = [
      makeRestraint({ id: "r1", child_id: "C1", duration_minutes: 4, de_escalation_count: 3, child_debriefed: true, staff_debriefed: true, review_status: "reviewed", body_map_completed: true, all_team_teach_trained: true, has_injuries: false }),
      makeRestraint({ id: "r2", child_id: "C1", duration_minutes: 6, de_escalation_count: 1, child_debriefed: false, staff_debriefed: false, review_status: "pending", body_map_completed: false, all_team_teach_trained: false, has_injuries: true }),
      makeRestraint({ id: "r3", child_id: "C2", duration_minutes: 2, de_escalation_count: 2, child_debriefed: true, staff_debriefed: true, review_status: "reviewed", body_map_completed: true, all_team_teach_trained: true, has_injuries: false }),
    ];
    const result = computeHomeRestrictivePractice(baseInput({ restraints }));
    const p = result.restraint_profile;

    it("total_restraints_90d", () => expect(p.total_restraints_90d).toBe(3));
    it("avg_duration", () => expect(p.avg_duration).toBe(4)); // (4+6+2)/3 = 4
    it("max_duration", () => expect(p.max_duration).toBe(6));
    it("child_debrief_rate", () => expect(p.child_debrief_rate).toBe(67)); // 2/3
    it("staff_debrief_rate", () => expect(p.staff_debrief_rate).toBe(67)); // 2/3
    it("review_completion_rate", () => expect(p.review_completion_rate).toBe(67)); // 2/3
    it("pending_reviews", () => expect(p.pending_reviews).toBe(1));
    it("body_map_rate", () => expect(p.body_map_rate).toBe(67)); // 2/3
    it("de_escalation_rate", () => expect(p.de_escalation_rate).toBe(67)); // 2/3 (>=2 attempts)
    it("training_compliance_rate", () => expect(p.training_compliance_rate).toBe(67)); // 2/3
    it("injury_count", () => expect(p.injury_count).toBe(1));
    it("children_restrained", () => expect(p.children_restrained.sort()).toEqual(["C1", "C2"]));
    it("repeat_children", () => expect(p.repeat_children).toEqual(["C1"]));
  });

  // ════════════════════════════════════════════════════════════════════════
  // SCORING MODIFIER TESTS
  // ════════════════════════════════════════════════════════════════════════

  describe("scoring — volume", () => {
    it("<=2 restraints gives +5", () => {
      const r = computeHomeRestrictivePractice(baseInput({
        restraints: [makeRestraint({ id: "r1", child_id: "C1" })],
      }));
      // 1 restraint, all perfect: 55+5+5+4+3+4+3+3+2+2+0 = 86
      expect(r.restrictive_score).toBe(86);
    });

    it(">5 restraints gives -5", () => {
      const r = computeHomeRestrictivePractice(baseInput({
        restraints: Array.from({ length: 6 }, (_, i) =>
          makeRestraint({ id: `r${i}`, child_id: `C${i}` })
        ),
      }));
      // 6 restraints, all perfect, no repeat: 55-5+5+4+3+4+3+3+2+2+0 = 76
      expect(r.restrictive_score).toBe(76);
    });
  });

  describe("scoring — de-escalation", () => {
    it("100% de-escalation gives +5", () => {
      const r = computeHomeRestrictivePractice(baseInput());
      expect(r.restrictive_score).toBe(86); // includes +5 for deEsc
    });

    it("<80% de-escalation gives -5", () => {
      const r = computeHomeRestrictivePractice(baseInput({
        restraints: [
          makeRestraint({ id: "r1", child_id: "C1", de_escalation_count: 3 }),
          makeRestraint({ id: "r2", child_id: "C2", de_escalation_count: 0 }),
          makeRestraint({ id: "r3", child_id: "C3", de_escalation_count: 0 }),
        ],
      }));
      // deEscRate = 33% → -5 vs base +5 = delta -10
      // 55+0-5+4+3+4+3+3+2+2+0 = 71
      expect(r.restrictive_score).toBe(71);
    });
  });

  describe("scoring — child debrief", () => {
    it("100% child debrief gives +4", () => {
      const r = computeHomeRestrictivePractice(baseInput());
      expect(r.restraint_profile.child_debrief_rate).toBe(100);
    });

    it("<80% child debrief gives -4", () => {
      const r = computeHomeRestrictivePractice(baseInput({
        restraints: [
          makeRestraint({ id: "r1", child_id: "C1", child_debriefed: true }),
          makeRestraint({ id: "r2", child_id: "C2", child_debriefed: false }),
          makeRestraint({ id: "r3", child_id: "C3", child_debriefed: false }),
        ],
      }));
      // childDebriefRate = 33% → -4 vs base +4 = delta -8
      // 55+0+5-4+3+4+3+3+2+2+0 = 73
      expect(r.restrictive_score).toBe(73);
    });
  });

  describe("scoring — staff debrief", () => {
    it("<80% staff debrief gives -2", () => {
      const r = computeHomeRestrictivePractice(baseInput({
        restraints: [
          makeRestraint({ id: "r1", child_id: "C1", staff_debriefed: true }),
          makeRestraint({ id: "r2", child_id: "C2", staff_debriefed: false }),
          makeRestraint({ id: "r3", child_id: "C3", staff_debriefed: false }),
        ],
      }));
      // staffDebriefRate = 33% → -2 vs base +3 = delta -5
      // 55+0+5+4-2+4+3+3+2+2+0 = 76
      expect(r.restrictive_score).toBe(76);
    });
  });

  describe("scoring — review", () => {
    it("100% reviewed gives +4", () => {
      const r = computeHomeRestrictivePractice(baseInput());
      expect(r.restraint_profile.review_completion_rate).toBe(100);
    });

    it("pending reviews gives -4", () => {
      const r = computeHomeRestrictivePractice(baseInput({
        restraints: [
          makeRestraint({ id: "r1", child_id: "C1" }),
          makeRestraint({ id: "r2", child_id: "C2", review_status: "pending" }),
        ],
      }));
      // reviewRate = 50%, pending 1 → -4 vs base +4 = delta -8
      // 55+5+5+4+3-4+3+3+2+2+0 = 78
      expect(r.restrictive_score).toBe(78);
    });
  });

  describe("scoring — body map", () => {
    it("incomplete body maps gives -2", () => {
      const r = computeHomeRestrictivePractice(baseInput({
        restraints: [
          makeRestraint({ id: "r1", child_id: "C1" }),
          makeRestraint({ id: "r2", child_id: "C2", body_map_completed: false }),
        ],
      }));
      // bodyMapRate = 50% → -2 vs base +3 = delta -5
      // 55+5+5+4+3+4-2+3+2+2+0 = 81
      expect(r.restrictive_score).toBe(81);
    });
  });

  describe("scoring — training", () => {
    it("incomplete training gives -3", () => {
      const r = computeHomeRestrictivePractice(baseInput({
        restraints: [
          makeRestraint({ id: "r1", child_id: "C1" }),
          makeRestraint({ id: "r2", child_id: "C2", all_team_teach_trained: false }),
        ],
      }));
      // trainingRate = 50% → -3 vs base +3 = delta -6
      // 55+5+5+4+3+4+3-3+2+2+0 = 80
      expect(r.restrictive_score).toBe(80);
    });
  });

  describe("scoring — duration", () => {
    it("avg duration <=3 gives +2", () => {
      const r = computeHomeRestrictivePractice(baseInput());
      expect(r.restraint_profile.avg_duration).toBe(3);
    });

    it("avg duration >10 gives -3", () => {
      const r = computeHomeRestrictivePractice(baseInput({
        restraints: [
          makeRestraint({ id: "r1", child_id: "C1", duration_minutes: 12 }),
          makeRestraint({ id: "r2", child_id: "C2", duration_minutes: 14 }),
        ],
      }));
      // avgDuration = 13 → -3 vs base +2 = delta -5
      // 55+5+5+4+3+4+3+3-3+2+0 = 81
      expect(r.restrictive_score).toBe(81);
    });
  });

  describe("scoring — injuries", () => {
    it("0 injuries gives +2", () => {
      const r = computeHomeRestrictivePractice(baseInput());
      expect(r.restraint_profile.injury_count).toBe(0);
    });

    it("injuries give -3", () => {
      const r = computeHomeRestrictivePractice(baseInput({
        restraints: [
          makeRestraint({ id: "r1", child_id: "C1", has_injuries: true }),
          makeRestraint({ id: "r2", child_id: "C2" }),
        ],
      }));
      // injuryCount = 1 → -3 vs base +2 = delta -5
      // 55+5+5+4+3+4+3+3+2-3+0 = 81
      expect(r.restrictive_score).toBe(81);
    });
  });

  describe("scoring — repeat children", () => {
    it("repeat children gives -2", () => {
      const r = computeHomeRestrictivePractice(baseInput({
        restraints: [
          makeRestraint({ id: "r1", child_id: "C1" }),
          makeRestraint({ id: "r2", child_id: "C1" }),
        ],
      }));
      // repeat → -2
      // 55+5+5+4+3+4+3+3+2+2-2 = 84
      expect(r.restrictive_score).toBe(84);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 90-DAY WINDOW
  // ════════════════════════════════════════════════════════════════════════

  describe("90-day window", () => {
    it("excludes restraints older than 90 days", () => {
      const r = computeHomeRestrictivePractice(baseInput({
        restraints: [
          makeRestraint({ id: "r1", date: "2024-12-01", child_id: "C1" }), // >90d from 2025-03-15
        ],
      }));
      expect(r.restrictive_rating).toBe("outstanding");
      expect(r.restrictive_score).toBe(90);
    });

    it("includes restraints within 90 days", () => {
      const r = computeHomeRestrictivePractice(baseInput({
        restraints: [
          makeRestraint({ id: "r1", date: "2025-01-15", child_id: "C1" }), // ~59 days
        ],
      }));
      expect(r.restraint_profile.total_restraints_90d).toBe(1);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // STRENGTHS
  // ════════════════════════════════════════════════════════════════════════

  describe("strengths", () => {
    it("low restraint count strength", () => {
      const r = computeHomeRestrictivePractice(baseInput({
        restraints: [makeRestraint({ id: "r1", child_id: "C1" })],
      }));
      expect(r.strengths.some(s => s.includes("low use"))).toBe(true);
    });

    it("de-escalation strength when 100%", () => {
      const r = computeHomeRestrictivePractice(baseInput());
      expect(r.strengths.some(s => s.includes("De-escalation"))).toBe(true);
    });

    it("child debrief strength when 100%", () => {
      const r = computeHomeRestrictivePractice(baseInput());
      expect(r.strengths.some(s => s.includes("children debriefed"))).toBe(true);
    });

    it("training strength when 100%", () => {
      const r = computeHomeRestrictivePractice(baseInput());
      expect(r.strengths.some(s => s.includes("Team Teach"))).toBe(true);
    });

    it("body map strength when 100%", () => {
      const r = computeHomeRestrictivePractice(baseInput());
      expect(r.strengths.some(s => s.includes("Body maps"))).toBe(true);
    });

    it("no injuries strength", () => {
      const r = computeHomeRestrictivePractice(baseInput());
      expect(r.strengths.some(s => s.includes("No injuries"))).toBe(true);
    });

    it("short duration strength", () => {
      const r = computeHomeRestrictivePractice(baseInput());
      expect(r.strengths.some(s => s.includes("brief and proportionate"))).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // CONCERNS
  // ════════════════════════════════════════════════════════════════════════

  describe("concerns", () => {
    it("pending reviews concern", () => {
      const r = computeHomeRestrictivePractice(baseInput({
        restraints: [makeRestraint({ id: "r1", child_id: "C1", review_status: "pending" })],
      }));
      expect(r.concerns.some(c => c.includes("pending review"))).toBe(true);
    });

    it("low child debrief concern", () => {
      const r = computeHomeRestrictivePractice(baseInput({
        restraints: [
          makeRestraint({ id: "r1", child_id: "C1", child_debriefed: false }),
          makeRestraint({ id: "r2", child_id: "C2", child_debriefed: false }),
          makeRestraint({ id: "r3", child_id: "C3", child_debriefed: true }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("Child debrief rate"))).toBe(true);
    });

    it("low de-escalation concern", () => {
      const r = computeHomeRestrictivePractice(baseInput({
        restraints: [
          makeRestraint({ id: "r1", child_id: "C1", de_escalation_count: 0 }),
          makeRestraint({ id: "r2", child_id: "C2", de_escalation_count: 0 }),
          makeRestraint({ id: "r3", child_id: "C3", de_escalation_count: 3 }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("De-escalation"))).toBe(true);
    });

    it("injuries concern", () => {
      const r = computeHomeRestrictivePractice(baseInput({
        restraints: [makeRestraint({ id: "r1", child_id: "C1", has_injuries: true })],
      }));
      expect(r.concerns.some(c => c.includes("injuries"))).toBe(true);
    });

    it("repeat children concern", () => {
      const r = computeHomeRestrictivePractice(baseInput({
        restraints: [
          makeRestraint({ id: "r1", child_id: "C1" }),
          makeRestraint({ id: "r2", child_id: "C1" }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("multiple times"))).toBe(true);
    });

    it("long duration concern", () => {
      const r = computeHomeRestrictivePractice(baseInput({
        restraints: [makeRestraint({ id: "r1", child_id: "C1", duration_minutes: 15 })],
      }));
      expect(r.concerns.some(c => c.includes("15 minutes"))).toBe(true);
    });

    it("low training concern", () => {
      const r = computeHomeRestrictivePractice(baseInput({
        restraints: [makeRestraint({ id: "r1", child_id: "C1", all_team_teach_trained: false })],
      }));
      expect(r.concerns.some(c => c.includes("trained staff"))).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // RECOMMENDATIONS
  // ════════════════════════════════════════════════════════════════════════

  describe("recommendations", () => {
    it("pending review → immediate urgency", () => {
      const r = computeHomeRestrictivePractice(baseInput({
        restraints: [makeRestraint({ id: "r1", child_id: "C1", review_status: "pending" })],
      }));
      const rec = r.recommendations.find(x => x.recommendation.includes("pending"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
      expect(rec!.regulatory_ref).toBe("Reg 20");
    });

    it("child debrief < 100% → immediate", () => {
      const r = computeHomeRestrictivePractice(baseInput({
        restraints: [
          makeRestraint({ id: "r1", child_id: "C1", child_debriefed: false }),
          makeRestraint({ id: "r2", child_id: "C2" }),
        ],
      }));
      const rec = r.recommendations.find(x => x.recommendation.includes("debriefed"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("de-escalation < 100% → soon", () => {
      const r = computeHomeRestrictivePractice(baseInput({
        restraints: [
          makeRestraint({ id: "r1", child_id: "C1", de_escalation_count: 1 }),
          makeRestraint({ id: "r2", child_id: "C2" }),
        ],
      }));
      const rec = r.recommendations.find(x => x.recommendation.includes("de-escalation"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("repeat children → soon", () => {
      const r = computeHomeRestrictivePractice(baseInput({
        restraints: [
          makeRestraint({ id: "r1", child_id: "C1" }),
          makeRestraint({ id: "r2", child_id: "C1" }),
        ],
      }));
      const rec = r.recommendations.find(x => x.recommendation.includes("BSPs"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("training < 100% → soon", () => {
      const r = computeHomeRestrictivePractice(baseInput({
        restraints: [
          makeRestraint({ id: "r1", child_id: "C1", all_team_teach_trained: false }),
          makeRestraint({ id: "r2", child_id: "C2" }),
        ],
      }));
      const rec = r.recommendations.find(x => x.recommendation.includes("Team Teach"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("recommendations are ranked sequentially", () => {
      const r = computeHomeRestrictivePractice(baseInput({
        restraints: [
          makeRestraint({ id: "r1", child_id: "C1", review_status: "pending", child_debriefed: false, de_escalation_count: 0, all_team_teach_trained: false }),
          makeRestraint({ id: "r2", child_id: "C1" }),
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
    it("injuries → critical insight", () => {
      const r = computeHomeRestrictivePractice(baseInput({
        restraints: [makeRestraint({ id: "r1", child_id: "C1", has_injuries: true })],
      }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("injuries"))).toBe(true);
    });

    it("pending reviews → critical insight", () => {
      const r = computeHomeRestrictivePractice(baseInput({
        restraints: [makeRestraint({ id: "r1", child_id: "C1", review_status: "pending" })],
      }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("not yet reviewed"))).toBe(true);
    });

    it("repeat children → warning insight", () => {
      const r = computeHomeRestrictivePractice(baseInput({
        restraints: [
          makeRestraint({ id: "r1", child_id: "C1" }),
          makeRestraint({ id: "r2", child_id: "C1" }),
        ],
      }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("multiple times"))).toBe(true);
    });

    it("100% de-escalation → positive insight", () => {
      const r = computeHomeRestrictivePractice(baseInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("De-escalation"))).toBe(true);
    });

    it("100% child debrief → positive insight", () => {
      const r = computeHomeRestrictivePractice(baseInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("children debriefed"))).toBe(true);
    });

    it("100% training → positive insight", () => {
      const r = computeHomeRestrictivePractice(baseInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("trained staff"))).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // EDGE CASES
  // ════════════════════════════════════════════════════════════════════════

  describe("edge cases", () => {
    it("single restraint with all perfect gives outstanding", () => {
      const r = computeHomeRestrictivePractice(baseInput({
        restraints: [makeRestraint({ id: "r1", child_id: "C1" })],
      }));
      expect(r.restrictive_rating).toBe("outstanding");
      expect(r.restrictive_score).toBe(86);
    });

    it("score is clamped to 0-100", () => {
      // Even with extreme penalties, score doesn't go below 0
      const r = computeHomeRestrictivePractice(baseInput({
        restraints: Array.from({ length: 10 }, (_, i) =>
          makeRestraint({
            id: `r${i}`, child_id: "C1", duration_minutes: 20,
            de_escalation_count: 0, child_debriefed: false, staff_debriefed: false,
            review_status: "pending", body_map_completed: false,
            all_team_teach_trained: false, has_injuries: true,
          })
        ),
      }));
      expect(r.restrictive_score).toBeGreaterThanOrEqual(0);
      expect(r.restrictive_score).toBeLessThanOrEqual(100);
    });

    it("empty profile has 100% rates", () => {
      const r = computeHomeRestrictivePractice(baseInput({ restraints: [] }));
      const p = r.restraint_profile;
      expect(p.child_debrief_rate).toBe(100);
      expect(p.staff_debrief_rate).toBe(100);
      expect(p.review_completion_rate).toBe(100);
      expect(p.de_escalation_rate).toBe(100);
      expect(p.training_compliance_rate).toBe(100);
      expect(p.body_map_rate).toBe(100);
    });
  });
});
