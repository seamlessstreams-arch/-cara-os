// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — LAC REVIEW & PERMANENCE ENGINE TESTS
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeLACReviewIntelligence,
  daysBetween,
  daysUntil,
  didParticipate,
  computeComplianceStatus,
  type ChildInput,
  type LACReviewInput,
  type ReviewType,
  type ReviewOutcome,
  type ChildParticipation,
  type PlacementStability,
  type ReviewActionInput,
} from "../lac-review-engine";

// ── Factories ───────────────────────────────────────────────────────────────

const TODAY = "2026-05-24";

function makeChild(id: string, name: string, placementStart = "2025-06-01"): ChildInput {
  return { id, name, placement_start_date: placementStart };
}

function makeAction(overrides: Partial<ReviewActionInput> = {}): ReviewActionInput {
  return {
    action: "Test action",
    owner: "Key worker",
    due_date: "2026-06-01",
    completed: false,
    ...overrides,
  };
}

function makeReview(overrides: Partial<LACReviewInput> = {}): LACReviewInput {
  return {
    id: "lac_test",
    child_id: "yp_1",
    date: "2026-04-24",
    review_type: "subsequent" as ReviewType,
    iro: "Sarah Mitchell",
    child_participation: "attended" as ChildParticipation,
    has_child_views: true,
    outcome: "placement_continues" as ReviewOutcome,
    actions_agreed: [makeAction()],
    next_review_date: "2026-10-24",
    placement_stability: "stable" as PlacementStability,
    care_plan_updated: true,
    ...overrides,
  };
}

function daysFromToday(n: number): string {
  const d = new Date("2026-05-24");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

// ── Unit Tests: Helpers ─────────────────────────────────────────────────────

describe("daysBetween", () => {
  it("returns 0 for same date", () => {
    expect(daysBetween("2026-05-24", "2026-05-24")).toBe(0);
  });
  it("returns correct positive difference", () => {
    expect(daysBetween("2026-05-01", "2026-05-24")).toBe(23);
  });
  it("is order-independent (absolute)", () => {
    expect(daysBetween("2026-05-24", "2026-05-01")).toBe(23);
  });
});

describe("daysUntil", () => {
  it("returns positive when target is in future", () => {
    expect(daysUntil("2026-05-24", "2026-06-24")).toBe(31);
  });
  it("returns negative when target is in past", () => {
    expect(daysUntil("2026-05-24", "2026-05-20")).toBe(-4);
  });
  it("returns 0 for same date", () => {
    expect(daysUntil("2026-05-24", "2026-05-24")).toBe(0);
  });
});

describe("didParticipate", () => {
  it("returns true for attended", () => {
    expect(didParticipate("attended")).toBe(true);
  });
  it("returns true for views_submitted", () => {
    expect(didParticipate("views_submitted")).toBe(true);
  });
  it("returns true for advocate_attended", () => {
    expect(didParticipate("advocate_attended")).toBe(true);
  });
  it("returns false for did_not_participate", () => {
    expect(didParticipate("did_not_participate")).toBe(false);
  });
});

describe("computeComplianceStatus", () => {
  it("returns compliant when review is >14 days away", () => {
    expect(computeComplianceStatus("2026-06-15", TODAY)).toBe("compliant");
  });
  it("returns due_soon when review is within 14 days", () => {
    expect(computeComplianceStatus("2026-06-01", TODAY)).toBe("due_soon");
  });
  it("returns overdue when review date has passed", () => {
    expect(computeComplianceStatus("2026-05-20", TODAY)).toBe("overdue");
  });
  it("returns overdue when null", () => {
    expect(computeComplianceStatus(null, TODAY)).toBe("overdue");
  });
});

// ── Integration Tests ───────────────────────────────────────────────────────

describe("computeLACReviewIntelligence", () => {
  describe("empty state", () => {
    it("returns safe defaults with no data", () => {
      const result = computeLACReviewIntelligence({
        children: [],
        reviews: [],
        today: TODAY,
      });
      expect(result.overview.total_reviews).toBe(0);
      expect(result.overview.timeliness_rate).toBe(100);
      expect(result.child_profiles).toHaveLength(0);
      expect(result.alerts).toHaveLength(0);
      expect(result.insights).toHaveLength(0);
    });
  });

  describe("overview", () => {
    it("calculates timeliness rate correctly", () => {
      const result = computeLACReviewIntelligence({
        children: [makeChild("yp_1", "Alex"), makeChild("yp_2", "Jordan")],
        reviews: [
          makeReview({ id: "r1", child_id: "yp_1", next_review_date: daysFromToday(90) }), // compliant
          makeReview({ id: "r2", child_id: "yp_2", next_review_date: daysFromToday(-10) }), // overdue
        ],
        today: TODAY,
      });
      // 1 out of 2 children are compliant = 50%
      expect(result.overview.timeliness_rate).toBe(50);
      expect(result.overview.children_with_overdue_review).toBe(1);
    });

    it("calculates child participation rate", () => {
      const result = computeLACReviewIntelligence({
        children: [makeChild("yp_1", "Alex")],
        reviews: [
          makeReview({ id: "r1", child_participation: "attended" }),
          makeReview({ id: "r2", child_participation: "views_submitted" }),
          makeReview({ id: "r3", child_participation: "did_not_participate" }),
        ],
        today: TODAY,
      });
      // 2/3 participated = 67%
      expect(result.overview.child_participation_rate).toBe(67);
    });

    it("calculates care plan update rate", () => {
      const result = computeLACReviewIntelligence({
        children: [makeChild("yp_1", "Alex")],
        reviews: [
          makeReview({ id: "r1", care_plan_updated: true }),
          makeReview({ id: "r2", care_plan_updated: true }),
          makeReview({ id: "r3", care_plan_updated: false }),
        ],
        today: TODAY,
      });
      // 2/3 = 67%
      expect(result.overview.care_plan_update_rate).toBe(67);
    });
  });

  describe("child profiles", () => {
    it("calculates per-child review stats", () => {
      const result = computeLACReviewIntelligence({
        children: [makeChild("yp_1", "Alex")],
        reviews: [
          makeReview({
            id: "r1",
            child_id: "yp_1",
            date: daysFromToday(-30),
            next_review_date: daysFromToday(150),
            placement_stability: "stable",
            child_participation: "attended",
            actions_agreed: [
              makeAction({ completed: true, due_date: daysFromToday(-10) }),
              makeAction({ completed: false, due_date: daysFromToday(-5) }), // overdue
              makeAction({ completed: false, due_date: daysFromToday(20) }), // outstanding
            ],
          }),
        ],
        today: TODAY,
      });

      const alex = result.child_profiles[0];
      expect(alex.total_reviews).toBe(1);
      expect(alex.last_review_days_ago).toBe(30);
      expect(alex.next_review_in_days).toBe(150);
      expect(alex.placement_stability).toBe("stable");
      expect(alex.actions_total).toBe(3);
      expect(alex.actions_completed).toBe(1);
      expect(alex.actions_overdue).toBe(1);
      expect(alex.compliance_status).toBe("compliant");
    });

    it("marks child as overdue when next_review_date has passed", () => {
      const result = computeLACReviewIntelligence({
        children: [makeChild("yp_1", "Alex")],
        reviews: [
          makeReview({ id: "r1", child_id: "yp_1", next_review_date: daysFromToday(-10) }),
        ],
        today: TODAY,
      });
      expect(result.child_profiles[0].compliance_status).toBe("overdue");
      expect(result.child_profiles[0].next_review_in_days).toBe(-10);
    });

    it("marks child as due_soon when review within 14 days", () => {
      const result = computeLACReviewIntelligence({
        children: [makeChild("yp_1", "Alex")],
        reviews: [
          makeReview({ id: "r1", child_id: "yp_1", next_review_date: daysFromToday(10) }),
        ],
        today: TODAY,
      });
      expect(result.child_profiles[0].compliance_status).toBe("due_soon");
    });

    it("uses most recent review for profile data", () => {
      const result = computeLACReviewIntelligence({
        children: [makeChild("yp_1", "Alex")],
        reviews: [
          makeReview({ id: "r1", child_id: "yp_1", date: daysFromToday(-60), review_type: "first_review", next_review_date: daysFromToday(-10) }),
          makeReview({ id: "r2", child_id: "yp_1", date: daysFromToday(-10), review_type: "subsequent", next_review_date: daysFromToday(170) }),
        ],
        today: TODAY,
      });
      expect(result.child_profiles[0].review_type_last).toBe("subsequent");
      expect(result.child_profiles[0].compliance_status).toBe("compliant");
    });
  });

  describe("action compliance", () => {
    it("aggregates actions across all reviews", () => {
      const result = computeLACReviewIntelligence({
        children: [makeChild("yp_1", "Alex")],
        reviews: [
          makeReview({
            id: "r1",
            actions_agreed: [
              makeAction({ completed: true, due_date: daysFromToday(-20) }),
              makeAction({ completed: false, due_date: daysFromToday(-5) }),
            ],
          }),
          makeReview({
            id: "r2",
            actions_agreed: [
              makeAction({ completed: true, due_date: daysFromToday(-10) }),
              makeAction({ completed: false, due_date: daysFromToday(10) }),
            ],
          }),
        ],
        today: TODAY,
      });
      expect(result.action_compliance.total_actions).toBe(4);
      expect(result.action_compliance.completed).toBe(2);
      expect(result.action_compliance.outstanding).toBe(2);
      expect(result.action_compliance.overdue).toBe(1); // only r1's second action
      expect(result.action_compliance.completion_rate).toBe(50);
    });
  });

  describe("participation analysis", () => {
    it("counts participation types correctly", () => {
      const result = computeLACReviewIntelligence({
        children: [makeChild("yp_1", "Alex"), makeChild("yp_2", "Jordan")],
        reviews: [
          makeReview({ id: "r1", child_participation: "attended" }),
          makeReview({ id: "r2", child_participation: "views_submitted" }),
          makeReview({ id: "r3", child_participation: "advocate_attended" }),
          makeReview({ id: "r4", child_participation: "did_not_participate" }),
        ],
        today: TODAY,
      });
      expect(result.participation.attended).toBe(1);
      expect(result.participation.views_submitted).toBe(1);
      expect(result.participation.advocate_attended).toBe(1);
      expect(result.participation.did_not_participate).toBe(1);
      expect(result.participation.participation_rate).toBe(75); // 3/4
    });
  });

  describe("stability overview", () => {
    it("counts placement stability from latest reviews", () => {
      const result = computeLACReviewIntelligence({
        children: [makeChild("yp_1", "Alex"), makeChild("yp_2", "Jordan"), makeChild("yp_3", "Casey")],
        reviews: [
          makeReview({ id: "r1", child_id: "yp_1", placement_stability: "stable" }),
          makeReview({ id: "r2", child_id: "yp_2", placement_stability: "some_concerns" }),
          makeReview({ id: "r3", child_id: "yp_3", placement_stability: "at_risk" }),
        ],
        today: TODAY,
      });
      expect(result.stability.stable_count).toBe(1);
      expect(result.stability.some_concerns_count).toBe(1);
      expect(result.stability.at_risk_count).toBe(1);
    });
  });

  describe("alerts", () => {
    it("generates critical alert for overdue reviews", () => {
      const result = computeLACReviewIntelligence({
        children: [makeChild("yp_1", "Alex")],
        reviews: [
          makeReview({ id: "r1", child_id: "yp_1", next_review_date: daysFromToday(-15) }),
        ],
        today: TODAY,
      });
      const critical = result.alerts.filter((a) => a.severity === "critical");
      expect(critical.length).toBe(1);
      expect(critical[0].message).toContain("Alex");
      expect(critical[0].message).toContain("15 days overdue");
    });

    it("generates high alert for placement at risk", () => {
      const result = computeLACReviewIntelligence({
        children: [makeChild("yp_1", "Alex")],
        reviews: [
          makeReview({ id: "r1", child_id: "yp_1", placement_stability: "at_risk" }),
        ],
        today: TODAY,
      });
      const high = result.alerts.filter((a) => a.severity === "high");
      expect(high.length).toBe(1);
      expect(high[0].message).toContain("at risk");
    });

    it("generates medium alert for overdue actions", () => {
      const result = computeLACReviewIntelligence({
        children: [makeChild("yp_1", "Alex")],
        reviews: [
          makeReview({
            id: "r1",
            actions_agreed: [
              makeAction({ completed: false, due_date: daysFromToday(-5) }),
              makeAction({ completed: false, due_date: daysFromToday(-10) }),
            ],
          }),
        ],
        today: TODAY,
      });
      const medium = result.alerts.filter((a) => a.severity === "medium" && a.message.includes("action"));
      expect(medium.length).toBe(1);
      expect(medium[0].message).toContain("2");
    });

    it("generates medium alert for reviews due soon", () => {
      const result = computeLACReviewIntelligence({
        children: [makeChild("yp_1", "Alex")],
        reviews: [
          makeReview({ id: "r1", child_id: "yp_1", next_review_date: daysFromToday(7) }),
        ],
        today: TODAY,
      });
      const dueSoon = result.alerts.filter((a) => a.message.includes("due within"));
      expect(dueSoon.length).toBe(1);
    });

    it("generates low alert for child non-participation", () => {
      const result = computeLACReviewIntelligence({
        children: [makeChild("yp_1", "Alex")],
        reviews: [
          makeReview({ id: "r1", child_participation: "attended" }),
          makeReview({ id: "r2", child_participation: "did_not_participate" }),
        ],
        today: TODAY,
      });
      const low = result.alerts.filter((a) => a.severity === "low");
      expect(low.length).toBe(1);
      expect(low[0].message).toContain("did not participate");
    });
  });

  describe("ARIA insights", () => {
    it("generates critical insight for overdue reviews", () => {
      const result = computeLACReviewIntelligence({
        children: [makeChild("yp_1", "Alex")],
        reviews: [
          makeReview({ id: "r1", child_id: "yp_1", next_review_date: daysFromToday(-10) }),
        ],
        today: TODAY,
      });
      const critical = result.insights.filter((i) => i.severity === "critical");
      expect(critical.length).toBe(1);
      expect(critical[0].text).toContain("statutory breach");
    });

    it("generates warning for low action completion", () => {
      const result = computeLACReviewIntelligence({
        children: [makeChild("yp_1", "Alex")],
        reviews: [
          makeReview({
            id: "r1",
            actions_agreed: [
              makeAction({ completed: false, due_date: daysFromToday(-5) }),
              makeAction({ completed: false, due_date: daysFromToday(-10) }),
              makeAction({ completed: true, due_date: daysFromToday(-15) }),
            ],
          }),
        ],
        today: TODAY,
      });
      const warning = result.insights.filter((i) => i.text.includes("action completion"));
      expect(warning.length).toBe(1);
    });

    it("generates warning for placement concerns", () => {
      const result = computeLACReviewIntelligence({
        children: [makeChild("yp_1", "Alex")],
        reviews: [
          makeReview({ id: "r1", child_id: "yp_1", placement_stability: "some_concerns" }),
        ],
        today: TODAY,
      });
      const warning = result.insights.filter((i) => i.text.includes("stability concerns"));
      expect(warning.length).toBe(1);
    });

    it("generates positive insight when all reviews current", () => {
      const result = computeLACReviewIntelligence({
        children: [makeChild("yp_1", "Alex"), makeChild("yp_2", "Jordan")],
        reviews: [
          makeReview({ id: "r1", child_id: "yp_1", next_review_date: daysFromToday(90) }),
          makeReview({ id: "r2", child_id: "yp_2", next_review_date: daysFromToday(120) }),
        ],
        today: TODAY,
      });
      const positive = result.insights.filter((i) => i.severity === "positive" && i.text.includes("current"));
      expect(positive.length).toBe(1);
    });

    it("generates positive insight for full participation", () => {
      const result = computeLACReviewIntelligence({
        children: [makeChild("yp_1", "Alex")],
        reviews: [
          makeReview({ id: "r1", child_participation: "attended" }),
          makeReview({ id: "r2", child_participation: "views_submitted" }),
        ],
        today: TODAY,
      });
      const participation = result.insights.filter((i) => i.text.includes("100% child participation"));
      expect(participation.length).toBe(1);
    });

    it("generates positive insight for care plan updates", () => {
      const result = computeLACReviewIntelligence({
        children: [makeChild("yp_1", "Alex")],
        reviews: [
          makeReview({ id: "r1", care_plan_updated: true }),
          makeReview({ id: "r2", care_plan_updated: true }),
        ],
        today: TODAY,
      });
      const carePlan = result.insights.filter((i) => i.text.includes("Care plans updated at every review"));
      expect(carePlan.length).toBe(1);
    });
  });

  describe("full Chamberlain House integration", () => {
    it("produces comprehensive output for 3 children with 3 reviews", () => {
      const children: ChildInput[] = [
        makeChild("yp_alex", "Alex", "2025-03-01"),
        makeChild("yp_jordan", "Jordan", "2024-09-01"),
        makeChild("yp_casey", "Casey", "2025-11-01"),
      ];

      const reviews: LACReviewInput[] = [
        makeReview({
          id: "lac_001", child_id: "yp_alex", date: daysFromToday(-30), review_type: "subsequent",
          child_participation: "attended", outcome: "placement_continues",
          placement_stability: "stable", care_plan_updated: true,
          next_review_date: daysFromToday(150),
          actions_agreed: [
            makeAction({ action: "Support college application", completed: false, due_date: daysFromToday(30) }),
            makeAction({ action: "Arrange PA meeting", completed: true, due_date: daysFromToday(14) }),
            makeAction({ action: "Update pathway plan", completed: false, due_date: daysFromToday(21) }),
          ],
        }),
        makeReview({
          id: "lac_002", child_id: "yp_jordan", date: daysFromToday(-45), review_type: "subsequent",
          child_participation: "views_submitted", outcome: "care_plan_amended",
          placement_stability: "some_concerns", care_plan_updated: true,
          next_review_date: daysFromToday(135),
          actions_agreed: [
            makeAction({ action: "Increase supervised contact", completed: true, due_date: daysFromToday(-30) }),
            makeAction({ action: "Visit accommodation", completed: false, due_date: daysFromToday(7) }),
            makeAction({ action: "Complete leaving care assessment", completed: false, due_date: daysFromToday(30) }),
          ],
        }),
        makeReview({
          id: "lac_003", child_id: "yp_casey", date: daysFromToday(-60), review_type: "first_review",
          child_participation: "attended", outcome: "placement_continues",
          placement_stability: "stable", care_plan_updated: true,
          next_review_date: daysFromToday(120),
          actions_agreed: [
            makeAction({ action: "Fast-track CAMHS referral", completed: true, due_date: daysFromToday(-45) }),
            makeAction({ action: "Source identity resources", completed: true, due_date: daysFromToday(-30) }),
            makeAction({ action: "Begin life story work", completed: false, due_date: daysFromToday(14) }),
          ],
        }),
      ];

      const result = computeLACReviewIntelligence({ children, reviews, today: TODAY });

      // Overview
      expect(result.overview.total_reviews).toBe(3);
      expect(result.overview.timeliness_rate).toBe(100); // all current
      expect(result.overview.children_with_overdue_review).toBe(0);
      expect(result.overview.child_participation_rate).toBe(100); // all participated
      expect(result.overview.care_plan_update_rate).toBe(100);

      // Child profiles
      expect(result.child_profiles).toHaveLength(3);
      const alex = result.child_profiles.find((c) => c.child_id === "yp_alex")!;
      expect(alex.compliance_status).toBe("compliant");
      expect(alex.placement_stability).toBe("stable");
      expect(alex.actions_completed).toBe(1);

      const jordan = result.child_profiles.find((c) => c.child_id === "yp_jordan")!;
      expect(jordan.placement_stability).toBe("some_concerns");

      // Action compliance
      expect(result.action_compliance.total_actions).toBe(9);
      expect(result.action_compliance.completed).toBe(4);

      // Participation
      expect(result.participation.attended).toBe(2);
      expect(result.participation.views_submitted).toBe(1);
      expect(result.participation.participation_rate).toBe(100);

      // Stability
      expect(result.stability.stable_count).toBe(2);
      expect(result.stability.some_concerns_count).toBe(1);
      expect(result.stability.at_risk_count).toBe(0);

      // Positive insights (all current + full participation + care plan)
      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.length).toBeGreaterThanOrEqual(2);

      // Warning insight for Jordan's concerns
      const warning = result.insights.filter((i) => i.severity === "warning");
      expect(warning.length).toBeGreaterThanOrEqual(1);
    });
  });
});
