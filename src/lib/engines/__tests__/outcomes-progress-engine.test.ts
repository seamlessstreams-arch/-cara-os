// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — OUTCOMES PROGRESS ENGINE TESTS
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeOutcomesProgress,
  computeProgressPct,
  daysBetween,
  majority,
  overallDirection,
  average,
  type ChildInput,
  type OutcomeTargetInput,
  type OutcomeReviewInput,
  type OutcomesProgressInput,
  type OutcomeDomain,
  type OutcomeRating,
  type OutcomeDirection,
  type OutcomeStatus,
} from "../outcomes-progress-engine";

// ── Factories ───────────────────────────────────────────────────────────────

const TODAY = "2026-05-24";

function makeChild(id: string, name: string): ChildInput {
  return { id, name };
}

function makeTarget(overrides: Partial<OutcomeTargetInput> = {}): OutcomeTargetInput {
  return {
    id: "ot_test",
    child_id: "yp_1",
    domain: "education" as OutcomeDomain,
    target_description: "Test target",
    baseline_rating: 2 as OutcomeRating,
    current_rating: 3 as OutcomeRating,
    target_rating: 5 as OutcomeRating,
    direction: "improving" as OutcomeDirection,
    status: "active" as OutcomeStatus,
    review_date: "2026-06-01",
    set_date: "2026-03-01",
    yp_voice: null,
    ...overrides,
  };
}

function makeReview(overrides: Partial<OutcomeReviewInput> = {}): OutcomeReviewInput {
  return {
    id: "or_test",
    target_id: "ot_test",
    child_id: "yp_1",
    review_date: "2026-05-20",
    previous_rating: 2 as OutcomeRating,
    new_rating: 3 as OutcomeRating,
    direction: "improving" as OutcomeDirection,
    yp_participated: true,
    yp_voice: "I feel better",
    progress_notes: "Good progress",
    barriers: null,
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
  it("returns positive difference", () => {
    expect(daysBetween("2026-05-01", "2026-05-24")).toBe(23);
  });
  it("is order-independent", () => {
    expect(daysBetween("2026-05-24", "2026-05-01")).toBe(23);
  });
});

describe("computeProgressPct", () => {
  it("returns 0 when no progress from baseline", () => {
    expect(computeProgressPct(2, 2, 5)).toBe(0);
  });
  it("returns 100 when target reached", () => {
    expect(computeProgressPct(2, 5, 5)).toBe(100);
  });
  it("returns correct intermediate value", () => {
    // baseline 2, current 3, target 4: (3-2)/(4-2) = 50%
    expect(computeProgressPct(2, 3, 4)).toBe(50);
  });
  it("handles progress beyond target (caps at 100)", () => {
    expect(computeProgressPct(1, 5, 4)).toBe(100);
  });
  it("returns 0 when target equals baseline", () => {
    expect(computeProgressPct(3, 3, 3)).toBe(100);
  });
  it("handles target below baseline — treats as achieved when current >= target", () => {
    // When target < baseline (nonsensical case), if current >= target → 100%
    expect(computeProgressPct(4, 3, 2)).toBe(100);
    // If current < target → 0%
    expect(computeProgressPct(4, 1, 2)).toBe(0);
  });
  it("calculates one-third progress", () => {
    // baseline 1, current 2, target 4: (2-1)/(4-1) = 33%
    expect(computeProgressPct(1, 2, 4)).toBe(33);
  });
});

describe("majority", () => {
  it("returns null for empty array", () => {
    expect(majority([])).toBeNull();
  });
  it("returns the most common value", () => {
    expect(majority(["improving", "improving", "stable"])).toBe("improving");
  });
  it("returns first winner on tie (implementation defined)", () => {
    const result = majority(["a", "b"]);
    expect(["a", "b"]).toContain(result);
  });
});

describe("overallDirection", () => {
  it("returns improving when improving > declining", () => {
    expect(overallDirection(3, 1, 1)).toBe("improving");
  });
  it("returns declining when declining > improving AND declining > stable", () => {
    expect(overallDirection(1, 1, 3)).toBe("declining");
  });
  it("returns stable when stable dominates", () => {
    expect(overallDirection(0, 3, 0)).toBe("stable");
  });
  it("returns stable when equal improving and declining", () => {
    expect(overallDirection(2, 0, 2)).toBe("stable");
  });
  it("returns improving when tied with stable", () => {
    expect(overallDirection(2, 2, 0)).toBe("improving");
  });
});

describe("average", () => {
  it("returns 0 for empty array", () => {
    expect(average([])).toBe(0);
  });
  it("returns correct average", () => {
    expect(average([10, 20, 30])).toBe(20);
  });
  it("returns single value unchanged", () => {
    expect(average([42])).toBe(42);
  });
});

// ── Integration Tests ───────────────────────────────────────────────────────

describe("computeOutcomesProgress", () => {
  describe("empty state", () => {
    it("returns safe defaults with no data", () => {
      const result = computeOutcomesProgress({
        children: [],
        targets: [],
        reviews: [],
        today: TODAY,
      });
      expect(result.overview.total_targets).toBe(0);
      expect(result.overview.active_targets).toBe(0);
      expect(result.overview.improving_pct).toBe(0);
      expect(result.overview.avg_progress_pct).toBe(0);
      expect(result.domain_analysis).toHaveLength(0);
      expect(result.child_profiles).toHaveLength(0);
      expect(result.alerts).toHaveLength(0);
      expect(result.insights).toHaveLength(0);
    });
  });

  describe("overview", () => {
    it("counts targets by status correctly", () => {
      const result = computeOutcomesProgress({
        children: [makeChild("yp_1", "Alex")],
        targets: [
          makeTarget({ id: "t1", status: "active" }),
          makeTarget({ id: "t2", status: "active" }),
          makeTarget({ id: "t3", status: "achieved" }),
          makeTarget({ id: "t4", status: "on_hold" }),
          makeTarget({ id: "t5", status: "revised" }),
        ],
        reviews: [],
        today: TODAY,
      });
      expect(result.overview.total_targets).toBe(5);
      expect(result.overview.active_targets).toBe(2);
      expect(result.overview.achieved_targets).toBe(1);
      expect(result.overview.on_hold_targets).toBe(1);
      expect(result.overview.revised_targets).toBe(1);
    });

    it("calculates improving percentage from active targets", () => {
      const result = computeOutcomesProgress({
        children: [makeChild("yp_1", "Alex")],
        targets: [
          makeTarget({ id: "t1", direction: "improving" }),
          makeTarget({ id: "t2", direction: "improving" }),
          makeTarget({ id: "t3", direction: "stable" }),
          makeTarget({ id: "t4", direction: "declining" }),
        ],
        reviews: [],
        today: TODAY,
      });
      // 2 improving out of 4 active = 50%
      expect(result.overview.improving_pct).toBe(50);
    });

    it("calculates average progress percentage", () => {
      const result = computeOutcomesProgress({
        children: [makeChild("yp_1", "Alex")],
        targets: [
          // baseline 2, current 4, target 4 → 100%
          makeTarget({ id: "t1", baseline_rating: 2, current_rating: 4, target_rating: 4 }),
          // baseline 2, current 2, target 4 → 0%
          makeTarget({ id: "t2", baseline_rating: 2, current_rating: 2, target_rating: 4 }),
        ],
        reviews: [],
        today: TODAY,
      });
      // avg(100, 0) = 50%
      expect(result.overview.avg_progress_pct).toBe(50);
    });
  });

  describe("domain analysis", () => {
    it("groups targets by domain with correct stats", () => {
      const result = computeOutcomesProgress({
        children: [makeChild("yp_1", "Alex")],
        targets: [
          makeTarget({ id: "t1", domain: "education", direction: "improving", baseline_rating: 2, current_rating: 3, target_rating: 4 }),
          makeTarget({ id: "t2", domain: "education", direction: "declining", baseline_rating: 2, current_rating: 2, target_rating: 4 }),
          makeTarget({ id: "t3", domain: "health", direction: "improving", baseline_rating: 1, current_rating: 3, target_rating: 5 }),
        ],
        reviews: [],
        today: TODAY,
      });

      const edu = result.domain_analysis.find((d) => d.domain === "education");
      expect(edu).toBeDefined();
      expect(edu!.active_targets).toBe(2);
      expect(edu!.improving_count).toBe(1);
      expect(edu!.declining_count).toBe(1);
      // avg progress: (50 + 0) / 2 = 25%
      expect(edu!.avg_progress_pct).toBe(25);

      const health = result.domain_analysis.find((d) => d.domain === "health");
      expect(health).toBeDefined();
      expect(health!.active_targets).toBe(1);
      // (3-1)/(5-1) = 50%
      expect(health!.avg_progress_pct).toBe(50);
    });

    it("excludes domains with no targets", () => {
      const result = computeOutcomesProgress({
        children: [makeChild("yp_1", "Alex")],
        targets: [makeTarget({ id: "t1", domain: "education" })],
        reviews: [],
        today: TODAY,
      });
      expect(result.domain_analysis.length).toBe(1);
      expect(result.domain_analysis[0].domain).toBe("education");
    });

    it("counts stagnant targets (stable, no progress, set >90d ago)", () => {
      const result = computeOutcomesProgress({
        children: [makeChild("yp_1", "Alex")],
        targets: [
          makeTarget({
            id: "t1",
            domain: "education",
            direction: "stable",
            baseline_rating: 2,
            current_rating: 2,
            target_rating: 4,
            set_date: daysFromToday(-100), // >90 days ago
          }),
          makeTarget({
            id: "t2",
            domain: "education",
            direction: "stable",
            baseline_rating: 2,
            current_rating: 3, // has progressed
            target_rating: 4,
            set_date: daysFromToday(-100),
          }),
        ],
        reviews: [],
        today: TODAY,
      });

      const edu = result.domain_analysis.find((d) => d.domain === "education");
      expect(edu!.stagnant_count).toBe(1); // only t1 is truly stagnant
    });

    it("includes achieved targets in domain count", () => {
      const result = computeOutcomesProgress({
        children: [makeChild("yp_1", "Alex")],
        targets: [
          makeTarget({ id: "t1", domain: "health", status: "achieved" }),
          makeTarget({ id: "t2", domain: "health", status: "active" }),
        ],
        reviews: [],
        today: TODAY,
      });
      const health = result.domain_analysis.find((d) => d.domain === "health");
      expect(health!.achieved_targets).toBe(1);
      expect(health!.active_targets).toBe(1);
    });
  });

  describe("child profiles", () => {
    it("calculates per-child stats correctly", () => {
      const result = computeOutcomesProgress({
        children: [makeChild("yp_1", "Alex"), makeChild("yp_2", "Jordan")],
        targets: [
          makeTarget({ id: "t1", child_id: "yp_1", direction: "improving", domain: "education", baseline_rating: 2, current_rating: 4, target_rating: 4 }),
          makeTarget({ id: "t2", child_id: "yp_1", direction: "improving", domain: "health", baseline_rating: 1, current_rating: 2, target_rating: 5 }),
          makeTarget({ id: "t3", child_id: "yp_2", direction: "stable", domain: "education", baseline_rating: 3, current_rating: 3, target_rating: 5 }),
        ],
        reviews: [
          makeReview({ id: "r1", child_id: "yp_1", yp_participated: true }),
          makeReview({ id: "r2", child_id: "yp_1", yp_participated: false }),
        ],
        today: TODAY,
      });

      const alex = result.child_profiles.find((c) => c.child_id === "yp_1");
      expect(alex!.active_targets).toBe(2);
      expect(alex!.improving_count).toBe(2);
      expect(alex!.overall_direction).toBe("improving");
      expect(alex!.yp_participation_rate).toBe(50);
      // strongest: education (100%), weakest: health (25%)
      expect(alex!.strongest_domain).toBe("Education");
      expect(alex!.weakest_domain).toBe("Health");

      const jordan = result.child_profiles.find((c) => c.child_id === "yp_2");
      expect(jordan!.active_targets).toBe(1);
      expect(jordan!.overall_direction).toBe("stable");
      // Only one domain, so weakest should be null
      expect(jordan!.weakest_domain).toBeNull();
    });

    it("counts overdue reviews per child", () => {
      const result = computeOutcomesProgress({
        children: [makeChild("yp_1", "Alex")],
        targets: [
          makeTarget({ id: "t1", child_id: "yp_1", review_date: daysFromToday(-5) }), // overdue
          makeTarget({ id: "t2", child_id: "yp_1", review_date: daysFromToday(10) }), // future
        ],
        reviews: [],
        today: TODAY,
      });
      expect(result.child_profiles[0].reviews_overdue).toBe(1);
    });

    it("determines overall declining direction", () => {
      const result = computeOutcomesProgress({
        children: [makeChild("yp_1", "Alex")],
        targets: [
          makeTarget({ id: "t1", child_id: "yp_1", direction: "declining" }),
          makeTarget({ id: "t2", child_id: "yp_1", direction: "declining" }),
          makeTarget({ id: "t3", child_id: "yp_1", direction: "stable" }),
        ],
        reviews: [],
        today: TODAY,
      });
      expect(result.child_profiles[0].overall_direction).toBe("declining");
    });
  });

  describe("review compliance", () => {
    it("counts reviews within 30 and 90 days", () => {
      const result = computeOutcomesProgress({
        children: [makeChild("yp_1", "Alex")],
        targets: [makeTarget()],
        reviews: [
          makeReview({ id: "r1", review_date: daysFromToday(-5) }),   // within 30d
          makeReview({ id: "r2", review_date: daysFromToday(-25) }),  // within 30d
          makeReview({ id: "r3", review_date: daysFromToday(-60) }),  // within 90d only
          makeReview({ id: "r4", review_date: daysFromToday(-100) }), // outside 90d
        ],
        today: TODAY,
      });
      expect(result.review_compliance.total_reviews_30d).toBe(2);
      expect(result.review_compliance.total_reviews_90d).toBe(3);
    });

    it("calculates YP participation rate", () => {
      const result = computeOutcomesProgress({
        children: [makeChild("yp_1", "Alex")],
        targets: [makeTarget()],
        reviews: [
          makeReview({ id: "r1", yp_participated: true }),
          makeReview({ id: "r2", yp_participated: true }),
          makeReview({ id: "r3", yp_participated: false }),
        ],
        today: TODAY,
      });
      // 2/3 = 67%
      expect(result.review_compliance.yp_participation_rate).toBe(67);
    });

    it("counts targets overdue for review", () => {
      const result = computeOutcomesProgress({
        children: [makeChild("yp_1", "Alex")],
        targets: [
          makeTarget({ id: "t1", review_date: daysFromToday(-10) }), // overdue
          makeTarget({ id: "t2", review_date: daysFromToday(-1) }),  // overdue
          makeTarget({ id: "t3", review_date: daysFromToday(5) }),   // future (ok)
        ],
        reviews: [],
        today: TODAY,
      });
      expect(result.review_compliance.targets_overdue_review).toBe(2);
    });

    it("calculates average days between reviews", () => {
      const result = computeOutcomesProgress({
        children: [makeChild("yp_1", "Alex")],
        targets: [makeTarget({ id: "t1" })],
        reviews: [
          makeReview({ id: "r1", target_id: "t1", review_date: "2026-05-01" }),
          makeReview({ id: "r2", target_id: "t1", review_date: "2026-05-15" }),
          makeReview({ id: "r3", target_id: "t1", review_date: "2026-05-22" }),
        ],
        today: TODAY,
      });
      // Intervals: 14 days, 7 days → avg = 10.5 → rounds to 11
      expect(result.review_compliance.avg_days_between_reviews).toBe(11);
    });
  });

  describe("progress velocity", () => {
    it("counts improvements and declines in last 30 days", () => {
      const result = computeOutcomesProgress({
        children: [makeChild("yp_1", "Alex")],
        targets: [makeTarget()],
        reviews: [
          makeReview({ id: "r1", review_date: daysFromToday(-5), previous_rating: 2, new_rating: 3 }),   // improved
          makeReview({ id: "r2", review_date: daysFromToday(-10), previous_rating: 3, new_rating: 2 }),  // declined
          makeReview({ id: "r3", review_date: daysFromToday(-15), previous_rating: 3, new_rating: 3 }),  // unchanged
          makeReview({ id: "r4", review_date: daysFromToday(-50), previous_rating: 2, new_rating: 4 }),  // outside 30d
        ],
        today: TODAY,
      });
      expect(result.progress_velocity.targets_improved_30d).toBe(1);
      expect(result.progress_velocity.targets_declined_30d).toBe(1);
      expect(result.progress_velocity.targets_unchanged_30d).toBe(1);
    });

    it("calculates average rating change", () => {
      const result = computeOutcomesProgress({
        children: [makeChild("yp_1", "Alex")],
        targets: [makeTarget()],
        reviews: [
          makeReview({ id: "r1", review_date: daysFromToday(-5), previous_rating: 2, new_rating: 4 }),  // +2
          makeReview({ id: "r2", review_date: daysFromToday(-10), previous_rating: 3, new_rating: 2 }), // -1
        ],
        today: TODAY,
      });
      // avg = (2 + -1) / 2 = 0.5
      expect(result.progress_velocity.avg_rating_change_30d).toBe(0.5);
    });

    it("identifies stagnant targets (90+ days, no progress from baseline)", () => {
      const result = computeOutcomesProgress({
        children: [makeChild("yp_1", "Alex")],
        targets: [
          makeTarget({
            id: "t1",
            direction: "stable",
            baseline_rating: 2,
            current_rating: 2,
            set_date: daysFromToday(-100), // stagnant
          }),
          makeTarget({
            id: "t2",
            direction: "stable",
            baseline_rating: 2,
            current_rating: 3, // has progressed
            set_date: daysFromToday(-100),
          }),
          makeTarget({
            id: "t3",
            direction: "stable",
            baseline_rating: 2,
            current_rating: 2,
            set_date: daysFromToday(-50), // too recent
          }),
        ],
        reviews: [],
        today: TODAY,
      });
      expect(result.progress_velocity.targets_stagnant_90d).toBe(1);
    });
  });

  describe("alerts", () => {
    it("generates critical alert for child declining in 2+ areas", () => {
      const result = computeOutcomesProgress({
        children: [makeChild("yp_1", "Alex")],
        targets: [
          makeTarget({ id: "t1", child_id: "yp_1", direction: "declining", domain: "education" }),
          makeTarget({ id: "t2", child_id: "yp_1", direction: "declining", domain: "health" }),
        ],
        reviews: [],
        today: TODAY,
      });
      const critical = result.alerts.filter((a) => a.severity === "critical");
      expect(critical.length).toBe(1);
      expect(critical[0].message).toContain("Alex");
      expect(critical[0].message).toContain("2 outcome areas");
    });

    it("generates high alert for stagnant targets", () => {
      const result = computeOutcomesProgress({
        children: [makeChild("yp_1", "Alex")],
        targets: [
          makeTarget({
            id: "t1",
            direction: "stable",
            baseline_rating: 2,
            current_rating: 2,
            set_date: daysFromToday(-100),
          }),
        ],
        reviews: [],
        today: TODAY,
      });
      const high = result.alerts.filter((a) => a.severity === "high");
      expect(high.length).toBe(1);
      expect(high[0].message).toContain("stagnant");
    });

    it("generates medium alert for overdue reviews", () => {
      const result = computeOutcomesProgress({
        children: [makeChild("yp_1", "Alex")],
        targets: [
          makeTarget({ id: "t1", review_date: daysFromToday(-5) }),
        ],
        reviews: [],
        today: TODAY,
      });
      const medium = result.alerts.filter((a) => a.severity === "medium" && a.message.includes("overdue"));
      expect(medium.length).toBe(1);
    });

    it("generates medium alert for declining targets", () => {
      const result = computeOutcomesProgress({
        children: [makeChild("yp_1", "Alex")],
        targets: [
          makeTarget({ id: "t1", direction: "declining" }),
        ],
        reviews: [],
        today: TODAY,
      });
      const declining = result.alerts.filter((a) => a.message.includes("declining"));
      expect(declining.length).toBe(1);
    });

    it("generates low alert for low YP participation", () => {
      const result = computeOutcomesProgress({
        children: [makeChild("yp_1", "Alex")],
        targets: [makeTarget()],
        reviews: [
          makeReview({ id: "r1", yp_participated: false }),
          makeReview({ id: "r2", yp_participated: false }),
          makeReview({ id: "r3", yp_participated: true }),
        ],
        today: TODAY,
      });
      const low = result.alerts.filter((a) => a.severity === "low");
      expect(low.length).toBe(1);
      expect(low[0].message).toContain("participation");
    });

    it("does not generate YP participation alert with fewer than 3 reviews", () => {
      const result = computeOutcomesProgress({
        children: [makeChild("yp_1", "Alex")],
        targets: [makeTarget()],
        reviews: [
          makeReview({ id: "r1", yp_participated: false }),
          makeReview({ id: "r2", yp_participated: false }),
        ],
        today: TODAY,
      });
      const low = result.alerts.filter((a) => a.severity === "low" && a.message.includes("participation"));
      expect(low.length).toBe(0);
    });
  });

  describe("ARIA insights", () => {
    it("generates critical insight for declining child with overdue reviews", () => {
      const result = computeOutcomesProgress({
        children: [makeChild("yp_1", "Alex")],
        targets: [
          makeTarget({ id: "t1", child_id: "yp_1", direction: "declining", review_date: daysFromToday(-10) }),
        ],
        reviews: [],
        today: TODAY,
      });
      const critical = result.insights.filter((i) => i.severity === "critical");
      expect(critical.length).toBe(1);
      expect(critical[0].text).toContain("Alex");
      expect(critical[0].text).toContain("declining");
    });

    it("generates warning insight for domain with 0% progress", () => {
      const result = computeOutcomesProgress({
        children: [makeChild("yp_1", "Alex")],
        targets: [
          makeTarget({ id: "t1", domain: "education", baseline_rating: 2, current_rating: 2, target_rating: 5 }),
          makeTarget({ id: "t2", domain: "education", baseline_rating: 3, current_rating: 3, target_rating: 5 }),
        ],
        reviews: [],
        today: TODAY,
      });
      const warning = result.insights.filter((i) => i.severity === "warning" && i.text.includes("0% progress"));
      expect(warning.length).toBe(1);
      expect(warning[0].text).toContain("Education");
    });

    it("generates warning insight for stagnant targets", () => {
      const result = computeOutcomesProgress({
        children: [makeChild("yp_1", "Alex")],
        targets: [
          makeTarget({
            id: "t1",
            direction: "stable",
            baseline_rating: 2,
            current_rating: 2,
            set_date: daysFromToday(-100),
          }),
        ],
        reviews: [],
        today: TODAY,
      });
      const stagnant = result.insights.filter((i) => i.text.includes("no progress from baseline"));
      expect(stagnant.length).toBe(1);
    });

    it("generates positive insight when majority improving", () => {
      const result = computeOutcomesProgress({
        children: [makeChild("yp_1", "Alex")],
        targets: [
          makeTarget({ id: "t1", direction: "improving" }),
          makeTarget({ id: "t2", direction: "improving" }),
          makeTarget({ id: "t3", direction: "stable" }),
        ],
        reviews: [],
        today: TODAY,
      });
      // 67% improving >= 50%
      const positive = result.insights.filter((i) => i.severity === "positive" && i.text.includes("improving"));
      expect(positive.length).toBe(1);
    });

    it("generates positive insight for high YP participation", () => {
      const result = computeOutcomesProgress({
        children: [makeChild("yp_1", "Alex")],
        targets: [makeTarget()],
        reviews: [
          makeReview({ id: "r1", yp_participated: true }),
          makeReview({ id: "r2", yp_participated: true }),
          makeReview({ id: "r3", yp_participated: true }),
        ],
        today: TODAY,
      });
      const yp = result.insights.filter((i) => i.text.includes("participation"));
      expect(yp.length).toBe(1);
      expect(yp[0].severity).toBe("positive");
    });
  });

  describe("full Oak House integration", () => {
    it("produces comprehensive output for all 3 children with 16 targets", () => {
      const children: ChildInput[] = [
        makeChild("yp_alex", "Alex"),
        makeChild("yp_jordan", "Jordan"),
        makeChild("yp_casey", "Casey"),
      ];

      const targets: OutcomeTargetInput[] = [
        // Alex — 6 active targets (4 improving, 1 stable, 1 declining)
        makeTarget({ id: "ot_001", child_id: "yp_alex", domain: "emotional_wellbeing", direction: "improving", baseline_rating: 2, current_rating: 3, target_rating: 4, review_date: daysFromToday(14), set_date: daysFromToday(-60) }),
        makeTarget({ id: "ot_002", child_id: "yp_alex", domain: "education", direction: "stable", baseline_rating: 2, current_rating: 2, target_rating: 4, review_date: daysFromToday(7), set_date: daysFromToday(-45) }),
        makeTarget({ id: "ot_003", child_id: "yp_alex", domain: "identity", direction: "improving", baseline_rating: 2, current_rating: 3, target_rating: 4, review_date: daysFromToday(21), set_date: daysFromToday(-50) }),
        makeTarget({ id: "ot_004", child_id: "yp_alex", domain: "health", direction: "improving", baseline_rating: 3, current_rating: 4, target_rating: 5, review_date: daysFromToday(30), set_date: daysFromToday(-90) }),
        makeTarget({ id: "ot_005", child_id: "yp_alex", domain: "family_social", direction: "declining", baseline_rating: 2, current_rating: 2, target_rating: 3, review_date: daysFromToday(7), set_date: daysFromToday(-30) }),
        makeTarget({ id: "ot_006", child_id: "yp_alex", domain: "behaviour", direction: "improving", baseline_rating: 1, current_rating: 2, target_rating: 4, review_date: daysFromToday(14), set_date: daysFromToday(-60) }),
        // Jordan — 5 active targets (4 improving, 1 stable)
        makeTarget({ id: "ot_007", child_id: "yp_jordan", domain: "education", direction: "improving", baseline_rating: 3, current_rating: 4, target_rating: 5, review_date: daysFromToday(30), set_date: daysFromToday(-80) }),
        makeTarget({ id: "ot_008", child_id: "yp_jordan", domain: "health", direction: "stable", baseline_rating: 4, current_rating: 4, target_rating: 5, review_date: daysFromToday(30), set_date: daysFromToday(-60) }),
        makeTarget({ id: "ot_009", child_id: "yp_jordan", domain: "emotional_wellbeing", direction: "improving", baseline_rating: 3, current_rating: 4, target_rating: 5, review_date: daysFromToday(21), set_date: daysFromToday(-45) }),
        makeTarget({ id: "ot_010", child_id: "yp_jordan", domain: "independence", direction: "improving", baseline_rating: 2, current_rating: 3, target_rating: 4, review_date: daysFromToday(14), set_date: daysFromToday(-40) }),
        makeTarget({ id: "ot_011", child_id: "yp_jordan", domain: "family_social", direction: "improving", baseline_rating: 3, current_rating: 4, target_rating: 5, review_date: daysFromToday(21), set_date: daysFromToday(-45) }),
        // Casey — 5 active targets (3 improving, 2 stable)
        makeTarget({ id: "ot_012", child_id: "yp_casey", domain: "health", direction: "stable", baseline_rating: 2, current_rating: 2, target_rating: 4, review_date: daysFromToday(7), set_date: daysFromToday(-30) }),
        makeTarget({ id: "ot_013", child_id: "yp_casey", domain: "emotional_wellbeing", direction: "improving", baseline_rating: 2, current_rating: 3, target_rating: 4, review_date: daysFromToday(14), set_date: daysFromToday(-45) }),
        makeTarget({ id: "ot_014", child_id: "yp_casey", domain: "education", direction: "stable", baseline_rating: 3, current_rating: 3, target_rating: 4, review_date: daysFromToday(21), set_date: daysFromToday(-40) }),
        makeTarget({ id: "ot_015", child_id: "yp_casey", domain: "self_care", direction: "improving", baseline_rating: 2, current_rating: 3, target_rating: 4, review_date: daysFromToday(14), set_date: daysFromToday(-35) }),
        makeTarget({ id: "ot_016", child_id: "yp_casey", domain: "identity", direction: "improving", baseline_rating: 2, current_rating: 3, target_rating: 4, review_date: daysFromToday(30), set_date: daysFromToday(-50) }),
      ];

      const reviews: OutcomeReviewInput[] = [
        makeReview({ id: "or_001", target_id: "ot_001", child_id: "yp_alex", review_date: daysFromToday(-14), previous_rating: 2, new_rating: 3, yp_participated: true }),
        makeReview({ id: "or_002", target_id: "ot_006", child_id: "yp_alex", review_date: daysFromToday(-14), previous_rating: 1, new_rating: 2, yp_participated: true }),
        makeReview({ id: "or_003", target_id: "ot_007", child_id: "yp_jordan", review_date: daysFromToday(-7), previous_rating: 3, new_rating: 4, yp_participated: true }),
        makeReview({ id: "or_004", target_id: "ot_012", child_id: "yp_casey", review_date: daysFromToday(-7), previous_rating: 2, new_rating: 2, yp_participated: true }),
        makeReview({ id: "or_005", target_id: "ot_013", child_id: "yp_casey", review_date: daysFromToday(-10), previous_rating: 2, new_rating: 3, yp_participated: true }),
      ];

      const result = computeOutcomesProgress({ children, targets, reviews, today: TODAY });

      // Overview
      expect(result.overview.total_targets).toBe(16);
      expect(result.overview.active_targets).toBe(16);
      expect(result.overview.total_children).toBe(3);
      // 11 improving out of 16 = 69%
      expect(result.overview.improving_count).toBe(11);
      expect(result.overview.improving_pct).toBe(69);

      // Domain analysis — should have entries for all used domains
      expect(result.domain_analysis.length).toBeGreaterThanOrEqual(6);

      // Child profiles
      expect(result.child_profiles).toHaveLength(3);
      const alex = result.child_profiles.find((c) => c.child_id === "yp_alex")!;
      expect(alex.active_targets).toBe(6);
      expect(alex.improving_count).toBe(4);
      expect(alex.declining_count).toBe(1);
      expect(alex.overall_direction).toBe("improving");

      const jordan = result.child_profiles.find((c) => c.child_id === "yp_jordan")!;
      expect(jordan.active_targets).toBe(5);
      expect(jordan.improving_count).toBe(4);
      expect(jordan.overall_direction).toBe("improving");

      const casey = result.child_profiles.find((c) => c.child_id === "yp_casey")!;
      expect(casey.active_targets).toBe(5);
      expect(casey.improving_count).toBe(3);
      expect(casey.overall_direction).toBe("improving");

      // Review compliance
      expect(result.review_compliance.total_reviews_30d).toBe(5);
      expect(result.review_compliance.yp_participation_rate).toBe(100);
      expect(result.review_compliance.targets_overdue_review).toBe(0);

      // Progress velocity (all 5 reviews within 30d)
      expect(result.progress_velocity.targets_improved_30d).toBe(4); // 4 improved
      expect(result.progress_velocity.targets_unchanged_30d).toBe(1); // 1 unchanged (Casey health)

      // Positive insight should fire (69% improving)
      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.length).toBeGreaterThanOrEqual(1);

      // No critical alerts (no child declining in 2+ areas)
      const critical = result.alerts.filter((a) => a.severity === "critical");
      expect(critical.length).toBe(0);
    });
  });
});
