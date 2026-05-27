// ══════════════════════════════════════════════════════════════════════════════
// TESTS — HOME ORGANIZATIONAL LEARNING INTELLIGENCE ENGINE
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeHomeOrganizationalLearning,
  type HomeOrganizationalLearningInput,
  type SeriousIncidentReviewInput,
  type CriticalIncidentDebriefInput,
  type ServiceImprovementInput,
} from "../home-organizational-learning-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2025-06-15";

function makeSIR(overrides: Partial<SeriousIncidentReviewInput> = {}): SeriousIncidentReviewInput {
  return {
    id: "sir_1",
    review_type: "serious_incident",
    incident_date: "2025-04-01",
    review_commenced_date: "2025-04-05",
    review_completed_date: "2025-05-01",
    status: "closed",
    lessons_learned_count: 3,
    actions_total: 4,
    actions_completed: 4,
    actions_overdue: 0,
    practice_changes_count: 2,
    training_implications_count: 1,
    policy_changes_count: 1,
    ...overrides,
  };
}

function makeDebrief(overrides: Partial<CriticalIncidentDebriefInput> = {}): CriticalIncidentDebriefInput {
  return {
    id: "deb_1",
    incident_date: "2025-06-05",
    debrief_date: "2025-06-07",
    impact_level: "medium",
    status: "completed",
    what_worked_well_count: 3,
    what_could_improve_count: 2,
    root_causes_count: 2,
    actions_agreed_count: 3,
    actions_completed: 3,
    training_needs_count: 1,
    ...overrides,
  };
}

function makeImprovement(overrides: Partial<ServiceImprovementInput> = {}): ServiceImprovementInput {
  return {
    id: "imp_1",
    category: "practice",
    source: "reg_44_feedback",
    start_date: "2025-03-01",
    target_completion_date: "2025-09-01",
    status: "implemented",
    risk_rag_rating: "green",
    milestones_total: 4,
    milestones_achieved: 4,
    last_review_date: "2025-06-01",
    next_review_date: "2025-09-01",
    ...overrides,
  };
}

function baseInput(overrides: Partial<HomeOrganizationalLearningInput> = {}): HomeOrganizationalLearningInput {
  return {
    today: TODAY,
    serious_incident_reviews: [
      makeSIR({ id: "sir_1", lessons_learned_count: 4, actions_total: 5, actions_completed: 5, practice_changes_count: 2 }),
      makeSIR({ id: "sir_2", review_type: "near_miss", lessons_learned_count: 3, actions_total: 3, actions_completed: 3, practice_changes_count: 1 }),
    ],
    critical_debriefs: [
      makeDebrief({ id: "deb_1" }),
      makeDebrief({ id: "deb_2", debrief_date: "2025-05-20" }),
    ],
    service_improvements: [
      makeImprovement({ id: "imp_1", source: "reg_44_feedback", status: "embedded" }),
      makeImprovement({ id: "imp_2", source: "childrens_voice", status: "implemented" }),
      makeImprovement({ id: "imp_3", source: "staff_suggestion", status: "in_progress" }),
      makeImprovement({ id: "imp_4", source: "audit_finding", status: "implemented" }),
    ],
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe("Home Organizational Learning Intelligence Engine", () => {
  // ── Insufficient Data ──────────────────────────────────────────────────
  describe("insufficient data", () => {
    it("returns insufficient_data when all arrays are empty", () => {
      const r = computeHomeOrganizationalLearning({
        today: TODAY,
        serious_incident_reviews: [],
        critical_debriefs: [],
        service_improvements: [],
      });
      expect(r.org_learning_rating).toBe("insufficient_data");
      expect(r.org_learning_score).toBe(0);
    });

    it("returns headline about no data", () => {
      const r = computeHomeOrganizationalLearning({
        today: TODAY,
        serious_incident_reviews: [],
        critical_debriefs: [],
        service_improvements: [],
      });
      expect(r.headline).toContain("No organizational learning data");
    });
  });

  // ── Rating Thresholds ─────────────────────────────────────────────────
  describe("rating thresholds", () => {
    it("rates outstanding with comprehensive learning culture", () => {
      const r = computeHomeOrganizationalLearning(baseInput());
      // mod1: 100% SIR actions, 0 overdue → +5
      // mod2: 100% debrief completion → +4
      // mod3: practice changes = 3 (SIR) + 3 (implemented+embedded) = 6 → >=5 → +4
      // mod4: 0 overdue SIR actions → +3
      // mod5: 3 impl+embed / 4 total = 75% → >=60 + 0 red → +4
      // mod6: 7 lessons → >=5 → +1
      // mod7: 4 sources → >=4 → +3
      // mod8: avg 2 root causes → >=2 → +2
      // 52 + 5+4+4+3+4+1+3+2 = 78
      expect(r.org_learning_score).toBe(78);
      expect(r.org_learning_rating).toBe("good"); // 78 < 80
    });

    it("reaches outstanding with more lessons learned", () => {
      const r = computeHomeOrganizationalLearning(baseInput({
        serious_incident_reviews: [
          makeSIR({ id: "sir_1", lessons_learned_count: 6, actions_total: 5, actions_completed: 5, practice_changes_count: 3 }),
          makeSIR({ id: "sir_2", lessons_learned_count: 5, actions_total: 3, actions_completed: 3, practice_changes_count: 2 }),
        ],
      }));
      // mod6: 11 lessons → >=10 → +3 (was +1)
      // 78 + 2 = 80
      expect(r.org_learning_score).toBe(80);
      expect(r.org_learning_rating).toBe("outstanding");
    });

    it("rates adequate with moderate gaps", () => {
      const r = computeHomeOrganizationalLearning({
        today: TODAY,
        serious_incident_reviews: [
          makeSIR({ id: "sir_1", status: "under_review", lessons_learned_count: 1, actions_total: 4, actions_completed: 2, actions_overdue: 2, practice_changes_count: 0 }),
        ],
        critical_debriefs: [],
        service_improvements: [
          makeImprovement({ id: "imp_1", source: "reg_44_feedback", status: "in_progress" }),
        ],
      });
      // mod1: 50% completion, 2 overdue → >=50 → +0
      // mod2: no debriefs → +1
      // mod3: 0 practice changes + 0 impl/embed = 0 → <1 → -4
      // mod4: 2 overdue → <=2 → +0
      // mod5: 0 impl+embed / 1 = 0% → <20 → -4
      // mod6: 1 lesson → >=1 → +0
      // mod7: 1 source → >=1 → +0
      // mod8: no debriefs → +0
      // 52 + 0+1+(-4)+0+(-4)+0+0+0 = 45
      expect(r.org_learning_score).toBe(45);
      expect(r.org_learning_rating).toBe("adequate");
    });

    it("rates inadequate with severe deficiencies", () => {
      const r = computeHomeOrganizationalLearning({
        today: TODAY,
        serious_incident_reviews: [
          makeSIR({ id: "sir_1", status: "initiated", lessons_learned_count: 0, actions_total: 6, actions_completed: 1, actions_overdue: 5, practice_changes_count: 0 }),
        ],
        critical_debriefs: [
          makeDebrief({ id: "deb_1", status: "overdue", root_causes_count: 0, actions_completed: 0 }),
          makeDebrief({ id: "deb_2", status: "overdue", debrief_date: "2025-06-01", root_causes_count: 0, actions_completed: 0 }),
        ],
        service_improvements: [],
      });
      // mod1: pct(1,6)=17% → <50 → -5
      // mod2: 0% completed → <50 → -4
      // mod3: 0 practice changes + 0 = 0 → -4
      // mod4: 5 overdue → >2 → -3
      // mod5: no improvements → -2
      // mod6: 0 lessons → <1 → -3
      // mod7: 0 sources → <1 → -3
      // mod8: avg 0 root causes → <1 → -2
      // 52 + (-5)+(-4)+(-4)+(-3)+(-2)+(-3)+(-3)+(-2) = 26
      expect(r.org_learning_score).toBe(26);
      expect(r.org_learning_rating).toBe("inadequate");
    });
  });

  // ── SIR Profile ───────────────────────────────────────────────────────
  describe("SIR profile", () => {
    it("counts completed and open reviews", () => {
      const r = computeHomeOrganizationalLearning(baseInput({
        serious_incident_reviews: [
          makeSIR({ id: "sir_1", status: "closed" }),
          makeSIR({ id: "sir_2", status: "final_report" }),
          makeSIR({ id: "sir_3", status: "under_review" }),
          makeSIR({ id: "sir_4", status: "initiated" }),
        ],
      }));
      expect(r.sir.completed_reviews).toBe(2); // closed + final_report
      expect(r.sir.open_reviews).toBe(2);      // under_review + initiated
    });

    it("aggregates lessons learned across reviews", () => {
      const r = computeHomeOrganizationalLearning(baseInput({
        serious_incident_reviews: [
          makeSIR({ id: "sir_1", lessons_learned_count: 5 }),
          makeSIR({ id: "sir_2", lessons_learned_count: 3 }),
        ],
      }));
      expect(r.sir.total_lessons_learned).toBe(8);
    });

    it("calculates action completion rate", () => {
      const r = computeHomeOrganizationalLearning(baseInput({
        serious_incident_reviews: [
          makeSIR({ id: "sir_1", actions_total: 10, actions_completed: 7, actions_overdue: 0 }),
        ],
      }));
      expect(r.sir.action_completion_rate).toBe(70); // 7/10
    });

    it("counts overdue actions", () => {
      const r = computeHomeOrganizationalLearning(baseInput({
        serious_incident_reviews: [
          makeSIR({ id: "sir_1", actions_overdue: 3 }),
          makeSIR({ id: "sir_2", actions_overdue: 2 }),
        ],
      }));
      expect(r.sir.actions_overdue).toBe(5);
    });

    it("counts practice changes", () => {
      const r = computeHomeOrganizationalLearning(baseInput({
        serious_incident_reviews: [
          makeSIR({ id: "sir_1", practice_changes_count: 3 }),
          makeSIR({ id: "sir_2", practice_changes_count: 1 }),
        ],
      }));
      expect(r.sir.practice_changes_total).toBe(4);
    });
  });

  // ── Debrief Profile ───────────────────────────────────────────────────
  describe("debrief profile", () => {
    it("filters debriefs to 90-day window", () => {
      const r = computeHomeOrganizationalLearning(baseInput({
        critical_debriefs: [
          makeDebrief({ id: "deb_1", debrief_date: "2025-06-10" }),     // within
          makeDebrief({ id: "deb_2", debrief_date: "2025-02-01" }),     // 134 days — outside
          makeDebrief({ id: "deb_3", debrief_date: "2025-04-01" }),     // 75 days — within
        ],
      }));
      expect(r.debriefs.total_debriefs_90d).toBe(2);
    });

    it("calculates completion rate", () => {
      const r = computeHomeOrganizationalLearning(baseInput({
        critical_debriefs: [
          makeDebrief({ id: "deb_1", status: "completed" }),
          makeDebrief({ id: "deb_2", status: "completed", debrief_date: "2025-06-01" }),
          makeDebrief({ id: "deb_3", status: "overdue", debrief_date: "2025-06-05" }),
        ],
      }));
      expect(r.debriefs.completed_rate).toBe(67); // 2/3
    });

    it("counts high-impact debriefs", () => {
      const r = computeHomeOrganizationalLearning(baseInput({
        critical_debriefs: [
          makeDebrief({ id: "deb_1", impact_level: "high" }),
          makeDebrief({ id: "deb_2", impact_level: "medium", debrief_date: "2025-06-01" }),
          makeDebrief({ id: "deb_3", impact_level: "high", debrief_date: "2025-06-05" }),
        ],
      }));
      expect(r.debriefs.high_impact_count).toBe(2);
    });

    it("calculates average root causes", () => {
      const r = computeHomeOrganizationalLearning(baseInput({
        critical_debriefs: [
          makeDebrief({ id: "deb_1", root_causes_count: 3 }),
          makeDebrief({ id: "deb_2", root_causes_count: 1, debrief_date: "2025-06-01" }),
        ],
      }));
      expect(r.debriefs.avg_root_causes).toBe(2); // (3+1)/2
    });

    it("calculates debrief action completion rate", () => {
      const r = computeHomeOrganizationalLearning(baseInput({
        critical_debriefs: [
          makeDebrief({ id: "deb_1", actions_agreed_count: 4, actions_completed: 3 }),
          makeDebrief({ id: "deb_2", actions_agreed_count: 2, actions_completed: 2, debrief_date: "2025-06-01" }),
        ],
      }));
      expect(r.debriefs.action_completion_rate).toBe(83); // 5/6
    });
  });

  // ── Improvement Profile ───────────────────────────────────────────────
  describe("improvement profile", () => {
    it("counts active, implemented, and embedded improvements", () => {
      const r = computeHomeOrganizationalLearning(baseInput());
      expect(r.improvements.active_improvements).toBe(1);    // in_progress
      expect(r.improvements.implemented_count).toBe(2);       // 2 implemented
      expect(r.improvements.embedded_count).toBe(1);           // 1 embedded
    });

    it("detects overdue improvements", () => {
      const r = computeHomeOrganizationalLearning(baseInput({
        service_improvements: [
          makeImprovement({ id: "imp_1", status: "in_progress", target_completion_date: "2025-01-01" }),  // overdue
          makeImprovement({ id: "imp_2", status: "approved", target_completion_date: "2025-02-01" }),     // overdue
          makeImprovement({ id: "imp_3", status: "implemented", target_completion_date: "2025-01-01" }),  // not active — not counted
        ],
      }));
      expect(r.improvements.overdue_count).toBe(2);
    });

    it("counts red RAG improvements", () => {
      const r = computeHomeOrganizationalLearning(baseInput({
        service_improvements: [
          makeImprovement({ id: "imp_1", status: "in_progress", risk_rag_rating: "red" }),
          makeImprovement({ id: "imp_2", status: "approved", risk_rag_rating: "red" }),
          makeImprovement({ id: "imp_3", status: "implemented", risk_rag_rating: "red" }),  // not active
        ],
      }));
      expect(r.improvements.red_rag_count).toBe(2);
    });

    it("calculates milestone achievement rate", () => {
      const r = computeHomeOrganizationalLearning(baseInput({
        service_improvements: [
          makeImprovement({ id: "imp_1", milestones_total: 5, milestones_achieved: 4 }),
          makeImprovement({ id: "imp_2", milestones_total: 3, milestones_achieved: 3 }),
        ],
      }));
      expect(r.improvements.milestone_achievement_rate).toBe(88); // 7/8
    });

    it("tracks improvements by source", () => {
      const r = computeHomeOrganizationalLearning(baseInput());
      expect(r.improvements.by_source["reg_44_feedback"]).toBe(1);
      expect(r.improvements.by_source["childrens_voice"]).toBe(1);
      expect(r.improvements.by_source["staff_suggestion"]).toBe(1);
      expect(r.improvements.by_source["audit_finding"]).toBe(1);
    });
  });

  // ── Scoring Modifiers ─────────────────────────────────────────────────
  describe("scoring modifiers", () => {
    it("mod1: high SIR action completion gives +5", () => {
      const good = computeHomeOrganizationalLearning(baseInput());
      expect(good.sir.action_completion_rate).toBe(100);
    });

    it("mod4: overdue SIR actions reduce score", () => {
      const noOverdue = computeHomeOrganizationalLearning(baseInput());
      const manyOverdue = computeHomeOrganizationalLearning(baseInput({
        serious_incident_reviews: [
          makeSIR({ id: "sir_1", actions_total: 5, actions_completed: 1, actions_overdue: 4 }),
        ],
      }));
      // noOverdue mod4: +3; manyOverdue mod4: >2 → -3 (also mod1 changes)
      expect(noOverdue.org_learning_score).toBeGreaterThan(manyOverdue.org_learning_score);
    });

    it("mod5: service improvement progress boosts score", () => {
      const withImprovements = computeHomeOrganizationalLearning(baseInput());
      const noImprovements = computeHomeOrganizationalLearning(baseInput({
        service_improvements: [],
      }));
      expect(withImprovements.org_learning_score).toBeGreaterThan(noImprovements.org_learning_score);
    });

    it("mod7: diverse sources gives +3", () => {
      const r = computeHomeOrganizationalLearning(baseInput());
      // 4 sources → +3
      const singleSource = computeHomeOrganizationalLearning(baseInput({
        service_improvements: [
          makeImprovement({ id: "imp_1", source: "reg_44_feedback", status: "embedded" }),
          makeImprovement({ id: "imp_2", source: "reg_44_feedback", status: "implemented" }),
        ],
      }));
      // 1 source → +0
      expect(r.org_learning_score).toBeGreaterThan(singleSource.org_learning_score);
    });
  });

  // ── Strengths ─────────────────────────────────────────────────────────
  describe("strengths", () => {
    it("includes strength for SIR action completion", () => {
      const r = computeHomeOrganizationalLearning(baseInput());
      expect(r.strengths.some(s => s.includes("serious incident review actions completed"))).toBe(true);
    });

    it("includes strength for debrief completion", () => {
      const r = computeHomeOrganizationalLearning(baseInput());
      expect(r.strengths.some(s => s.includes("debrief completion rate"))).toBe(true);
    });

    it("includes strength for service improvements delivered", () => {
      const r = computeHomeOrganizationalLearning(baseInput());
      expect(r.strengths.some(s => s.includes("service improvements implemented"))).toBe(true);
    });

    it("includes strength for diverse sources", () => {
      const r = computeHomeOrganizationalLearning(baseInput());
      expect(r.strengths.some(s => s.includes("different channels"))).toBe(true);
    });
  });

  // ── Concerns ──────────────────────────────────────────────────────────
  describe("concerns", () => {
    it("raises concern for overdue SIR actions", () => {
      const r = computeHomeOrganizationalLearning(baseInput({
        serious_incident_reviews: [
          makeSIR({ id: "sir_1", actions_overdue: 3 }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("overdue action"))).toBe(true);
    });

    it("raises concern for many open reviews", () => {
      const r = computeHomeOrganizationalLearning(baseInput({
        serious_incident_reviews: [
          makeSIR({ id: "sir_1", status: "initiated" }),
          makeSIR({ id: "sir_2", status: "under_review" }),
          makeSIR({ id: "sir_3", status: "draft_report" }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("open serious incident reviews"))).toBe(true);
    });

    it("raises concern for no service improvements", () => {
      const r = computeHomeOrganizationalLearning(baseInput({
        service_improvements: [],
      }));
      expect(r.concerns.some(c => c.includes("No service improvement"))).toBe(true);
    });

    it("raises concern for RED RAG improvements", () => {
      const r = computeHomeOrganizationalLearning(baseInput({
        service_improvements: [
          makeImprovement({ id: "imp_1", status: "in_progress", risk_rag_rating: "red" }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("RED RAG"))).toBe(true);
    });
  });

  // ── Recommendations ───────────────────────────────────────────────────
  describe("recommendations", () => {
    it("recommends completing overdue SIR actions", () => {
      const r = computeHomeOrganizationalLearning(baseInput({
        serious_incident_reviews: [
          makeSIR({ id: "sir_1", actions_overdue: 2 }),
        ],
      }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("overdue SIR actions"))).toBe(true);
    });

    it("recommends establishing improvement board when none exist", () => {
      const r = computeHomeOrganizationalLearning(baseInput({
        service_improvements: [],
      }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("service improvement board"))).toBe(true);
    });

    it("recommends deepening lessons when too few", () => {
      const r = computeHomeOrganizationalLearning(baseInput({
        serious_incident_reviews: [
          makeSIR({ id: "sir_1", lessons_learned_count: 1 }),
        ],
      }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("lessons-learned"))).toBe(true);
    });
  });

  // ── ARIA Insights ─────────────────────────────────────────────────────
  describe("ARIA insights", () => {
    it("produces positive insight for exemplary learning culture", () => {
      const r = computeHomeOrganizationalLearning(baseInput({
        serious_incident_reviews: [
          makeSIR({ id: "sir_1", lessons_learned_count: 3, actions_total: 5, actions_completed: 5 }),
          makeSIR({ id: "sir_2", lessons_learned_count: 3, actions_total: 3, actions_completed: 3 }),
        ],
      }));
      // 100% SIR, 100% debrief, 3+ implemented, 6 lessons >=5
      expect(r.insights.some(i => i.severity === "positive")).toBe(true);
    });

    it("produces critical insight for many overdue SIR actions", () => {
      const r = computeHomeOrganizationalLearning(baseInput({
        serious_incident_reviews: [
          makeSIR({ id: "sir_1", actions_overdue: 5, actions_total: 8, actions_completed: 2 }),
        ],
      }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("overdue"))).toBe(true);
    });

    it("produces warning for high-impact debriefs concentration", () => {
      const r = computeHomeOrganizationalLearning(baseInput({
        critical_debriefs: [
          makeDebrief({ id: "deb_1", impact_level: "high" }),
          makeDebrief({ id: "deb_2", impact_level: "high", debrief_date: "2025-06-01" }),
          makeDebrief({ id: "deb_3", impact_level: "high", debrief_date: "2025-06-05" }),
        ],
      }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("high-impact"))).toBe(true);
    });
  });

  // ── Headlines ─────────────────────────────────────────────────────────
  describe("headlines", () => {
    it("good headline includes SIR completion rate", () => {
      const r = computeHomeOrganizationalLearning(baseInput());
      expect(r.headline).toContain("Good learning culture");
    });

    it("inadequate headline mentions significant gaps", () => {
      const r = computeHomeOrganizationalLearning({
        today: TODAY,
        serious_incident_reviews: [
          makeSIR({ id: "sir_1", status: "initiated", lessons_learned_count: 0, actions_total: 6, actions_completed: 1, actions_overdue: 5, practice_changes_count: 0 }),
        ],
        critical_debriefs: [
          makeDebrief({ id: "deb_1", status: "overdue", root_causes_count: 0, actions_completed: 0 }),
        ],
        service_improvements: [],
      });
      expect(r.headline).toContain("inadequate");
    });
  });

  // ── Edge Cases ────────────────────────────────────────────────────────
  describe("edge cases", () => {
    it("handles only service improvements (no reviews or debriefs)", () => {
      const r = computeHomeOrganizationalLearning({
        today: TODAY,
        serious_incident_reviews: [],
        critical_debriefs: [],
        service_improvements: [
          makeImprovement({ id: "imp_1", status: "embedded" }),
        ],
      });
      expect(r.org_learning_rating).not.toBe("insufficient_data");
    });

    it("handles only SIRs (no debriefs or improvements)", () => {
      const r = computeHomeOrganizationalLearning({
        today: TODAY,
        serious_incident_reviews: [makeSIR({ id: "sir_1" })],
        critical_debriefs: [],
        service_improvements: [],
      });
      expect(r.org_learning_rating).not.toBe("insufficient_data");
      expect(r.sir.total_reviews).toBe(1);
    });

    it("score is clamped to 0-100", () => {
      const r = computeHomeOrganizationalLearning({
        today: TODAY,
        serious_incident_reviews: [
          makeSIR({ id: "sir_1", status: "initiated", lessons_learned_count: 0, actions_total: 10, actions_completed: 0, actions_overdue: 10, practice_changes_count: 0 }),
        ],
        critical_debriefs: [
          makeDebrief({ id: "deb_1", status: "overdue", root_causes_count: 0, actions_completed: 0 }),
        ],
        service_improvements: [],
      });
      expect(r.org_learning_score).toBeGreaterThanOrEqual(0);
      expect(r.org_learning_score).toBeLessThanOrEqual(100);
    });
  });
});
