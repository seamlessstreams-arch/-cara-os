// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — REG 44 INDEPENDENT VISITOR INTELLIGENCE ENGINE — TEST SUITE
// Reg 44 — independent person visits, monthly frequency, report to Ofsted
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeReg44Intelligence,
  daysBetween,
  daysUntil,
  average,
  type VisitInput,
  type RecommendationInput,
  type Reg44IntelligenceInput,
} from "../reg44-intelligence-engine";

// ── Factories ─────────────────────────────────────────────────────────────────

const TODAY = "2026-05-25";

function makeRecommendation(overrides: Partial<RecommendationInput> = {}): RecommendationInput {
  return {
    id: "rec_1",
    recommendation: "Implement nightly checklist",
    priority: "medium",
    status: "completed",
    rm_response: "Accepted and implemented.",
    completed_at: "2026-05-10",
    ...overrides,
  };
}

function makeVisit(overrides: Partial<VisitInput> = {}): VisitInput {
  return {
    id: "v44_1",
    visit_date: "2026-05-18",
    visitor: "Margaret Thompson",
    duration_hours: 4,
    children_spoken_count: 3,
    children_total: 3,
    staff_spoken: 4,
    records_reviewed: ["daily logs", "medication", "incidents"],
    overall_judgement: "Good — no immediate concerns.",
    strengths_count: 3,
    areas_for_development_count: 2,
    recommendations: [makeRecommendation()],
    report_sent_to_ofsted: true,
    report_sent_date: "2026-05-23",
    ...overrides,
  };
}

// ── Unit Tests: Helpers ───────────────────────────────────────────────────────

describe("daysBetween", () => {
  it("returns 0 for same day", () => {
    expect(daysBetween("2026-05-25", "2026-05-25")).toBe(0);
  });

  it("returns correct days", () => {
    expect(daysBetween("2026-05-18", "2026-05-25")).toBe(7);
  });
});

describe("daysUntil", () => {
  it("returns positive for future", () => {
    expect(daysUntil("2026-05-25", "2026-06-01")).toBe(7);
  });

  it("returns negative for past", () => {
    expect(daysUntil("2026-05-25", "2026-05-18")).toBe(-7);
  });
});

describe("average", () => {
  it("returns 0 for empty", () => {
    expect(average([])).toBe(0);
  });

  it("computes correctly", () => {
    expect(average([28, 30, 32])).toBe(30);
  });
});

// ── Integration Tests ─────────────────────────────────────────────────────────

describe("computeReg44Intelligence", () => {
  describe("empty state", () => {
    it("handles no visits gracefully", () => {
      const result = computeReg44Intelligence({ visits: [], today: TODAY });

      expect(result.overview.total_visits_12m).toBe(0);
      expect(result.overview.visits_on_schedule).toBe(false); // 999 days since last
      expect(result.overview.completion_rate).toBe(100);
      expect(result.overview.ofsted_reporting_compliance).toBe(100);
      expect(result.visit_profiles).toHaveLength(0);
      expect(result.alerts.some((a) => a.severity === "critical")).toBe(true); // overdue
    });
  });

  describe("overview", () => {
    it("counts visits within 12 months", () => {
      const visits = [
        makeVisit({ id: "v1", visit_date: "2026-05-18" }),
        makeVisit({ id: "v2", visit_date: "2026-04-18" }),
        makeVisit({ id: "v3", visit_date: "2025-04-01" }), // over 12 months ago
      ];

      const result = computeReg44Intelligence({ visits, today: TODAY });
      expect(result.overview.total_visits_12m).toBe(2);
    });

    it("computes average days between visits", () => {
      const visits = [
        makeVisit({ id: "v1", visit_date: "2026-04-18" }),
        makeVisit({ id: "v2", visit_date: "2026-05-18" }), // 30 days
      ];

      const result = computeReg44Intelligence({ visits, today: TODAY });
      expect(result.overview.avg_days_between_visits).toBe(30);
    });

    it("computes children participation rate", () => {
      const visits = [
        makeVisit({ id: "v1", visit_date: "2026-05-18", children_spoken_count: 3, children_total: 3 }),
        makeVisit({ id: "v2", visit_date: "2026-04-18", children_spoken_count: 2, children_total: 3 }),
      ];

      const result = computeReg44Intelligence({ visits, today: TODAY });
      // (100 + 67) / 2 = 84 (rounded)
      expect(result.overview.children_participation_rate).toBe(84);
    });

    it("computes recommendation completion rate", () => {
      const visits = [
        makeVisit({
          id: "v1",
          visit_date: "2026-05-18",
          recommendations: [
            makeRecommendation({ id: "r1", status: "completed" }),
            makeRecommendation({ id: "r2", status: "in_progress" }),
            makeRecommendation({ id: "r3", status: "pending" }),
          ],
        }),
      ];

      const result = computeReg44Intelligence({ visits, today: TODAY });
      expect(result.overview.total_recommendations).toBe(3);
      expect(result.overview.recommendations_completed).toBe(1);
      expect(result.overview.recommendations_in_progress).toBe(1);
      expect(result.overview.recommendations_pending).toBe(1);
      expect(result.overview.completion_rate).toBe(33);
    });

    it("computes Ofsted reporting compliance", () => {
      const visits = [
        makeVisit({ id: "v1", visit_date: "2026-05-18", report_sent_to_ofsted: true, report_sent_date: "2026-05-23" }), // 5 days — timely
        makeVisit({ id: "v2", visit_date: "2026-04-18", report_sent_to_ofsted: true, report_sent_date: "2026-04-28" }), // 10 days — late
      ];

      const result = computeReg44Intelligence({ visits, today: TODAY });
      expect(result.overview.ofsted_reporting_compliance).toBe(50);
    });

    it("marks visits_on_schedule true when all within 35 days", () => {
      const visits = [
        makeVisit({ id: "v1", visit_date: "2026-04-20" }),
        makeVisit({ id: "v2", visit_date: "2026-05-18" }), // 28 days gap
      ];

      const result = computeReg44Intelligence({ visits, today: TODAY });
      expect(result.overview.visits_on_schedule).toBe(true);
    });

    it("marks visits_on_schedule false when gap > 35 days", () => {
      const visits = [
        makeVisit({ id: "v1", visit_date: "2026-03-15" }),
        makeVisit({ id: "v2", visit_date: "2026-05-01" }), // 47 days gap
      ];

      const result = computeReg44Intelligence({ visits, today: TODAY });
      expect(result.overview.visits_on_schedule).toBe(false);
    });
  });

  describe("visit profiles", () => {
    it("calculates days_since_previous correctly", () => {
      const visits = [
        makeVisit({ id: "v1", visit_date: "2026-04-18" }),
        makeVisit({ id: "v2", visit_date: "2026-05-18" }),
      ];

      const result = computeReg44Intelligence({ visits, today: TODAY });
      expect(result.visit_profiles[0].days_since_previous).toBeNull();
      expect(result.visit_profiles[1].days_since_previous).toBe(30);
    });

    it("marks report_sent_timely correctly", () => {
      const visits = [
        makeVisit({ id: "v1", visit_date: "2026-05-18", report_sent_to_ofsted: true, report_sent_date: "2026-05-20" }), // 2 days
        makeVisit({ id: "v2", visit_date: "2026-04-18", report_sent_to_ofsted: true, report_sent_date: "2026-04-30" }), // 12 days
        makeVisit({ id: "v3", visit_date: "2026-03-18", report_sent_to_ofsted: false, report_sent_date: null }),
      ];

      const result = computeReg44Intelligence({ visits, today: TODAY });
      expect(result.visit_profiles[2].report_sent_timely).toBe(true);  // v1 (sorted last)
      expect(result.visit_profiles[1].report_sent_timely).toBe(false); // v2
      expect(result.visit_profiles[0].report_sent_timely).toBe(false); // v3
    });
  });

  describe("recommendation analysis", () => {
    it("groups by priority correctly", () => {
      const visits = [
        makeVisit({
          id: "v1",
          visit_date: "2026-05-01",
          recommendations: [
            makeRecommendation({ id: "r1", priority: "high", status: "completed" }),
            makeRecommendation({ id: "r2", priority: "high", status: "pending" }),
            makeRecommendation({ id: "r3", priority: "medium", status: "completed" }),
            makeRecommendation({ id: "r4", priority: "low", status: "in_progress" }),
          ],
        }),
      ];

      const result = computeReg44Intelligence({ visits, today: TODAY });
      const high = result.recommendation_analysis.by_priority.find((p) => p.priority === "high")!;
      expect(high.count).toBe(2);
      expect(high.completed).toBe(1);
    });

    it("counts overdue recommendations (30+ days)", () => {
      const visits = [
        makeVisit({
          id: "v1",
          visit_date: "2026-04-10", // 45 days ago
          recommendations: [
            makeRecommendation({ id: "r1", status: "pending" }),
            makeRecommendation({ id: "r2", status: "in_progress" }),
          ],
        }),
      ];

      const result = computeReg44Intelligence({ visits, today: TODAY });
      expect(result.recommendation_analysis.overdue).toBe(2);
    });

    it("counts high priority incomplete", () => {
      const visits = [
        makeVisit({
          id: "v1",
          visit_date: "2026-05-18",
          recommendations: [
            makeRecommendation({ id: "r1", priority: "high", status: "in_progress" }),
            makeRecommendation({ id: "r2", priority: "high", status: "completed" }),
          ],
        }),
      ];

      const result = computeReg44Intelligence({ visits, today: TODAY });
      expect(result.recommendation_analysis.high_priority_incomplete).toBe(1);
    });
  });

  describe("alerts", () => {
    it("generates critical alert when visit overdue (>35 days)", () => {
      const visits = [
        makeVisit({ id: "v1", visit_date: "2026-04-10" }), // 45 days ago
      ];

      const result = computeReg44Intelligence({ visits, today: TODAY });
      const critical = result.alerts.filter((a) => a.severity === "critical");
      expect(critical.some((a) => a.message.includes("overdue") && a.message.includes("45 days"))).toBe(true);
    });

    it("generates high alert for high priority incomplete recs", () => {
      const visits = [
        makeVisit({
          id: "v1",
          visit_date: "2026-05-18",
          recommendations: [
            makeRecommendation({ id: "r1", priority: "high", status: "pending" }),
          ],
        }),
      ];

      const result = computeReg44Intelligence({ visits, today: TODAY });
      const high = result.alerts.filter((a) => a.severity === "high");
      expect(high.some((a) => a.message.includes("high-priority"))).toBe(true);
    });

    it("generates medium alert for unreported visits", () => {
      const visits = [
        makeVisit({ id: "v1", visit_date: "2026-05-18", report_sent_to_ofsted: false }),
      ];

      const result = computeReg44Intelligence({ visits, today: TODAY });
      const medium = result.alerts.filter((a) => a.severity === "medium");
      expect(medium.some((a) => a.message.includes("not yet sent to Ofsted"))).toBe(true);
    });

    it("generates low alert when children not all spoken to", () => {
      const visits = [
        makeVisit({ id: "v1", visit_date: "2026-05-18", children_spoken_count: 2, children_total: 3 }),
      ];

      const result = computeReg44Intelligence({ visits, today: TODAY });
      const low = result.alerts.filter((a) => a.severity === "low");
      expect(low.some((a) => a.message.includes("not all children"))).toBe(true);
    });

    it("generates no alerts when fully compliant", () => {
      const visits = [
        makeVisit({
          id: "v1",
          visit_date: "2026-05-18",
          report_sent_to_ofsted: true,
          report_sent_date: "2026-05-20",
          recommendations: [
            makeRecommendation({ id: "r1", priority: "medium", status: "completed" }),
          ],
        }),
      ];

      const result = computeReg44Intelligence({ visits, today: TODAY });
      const critical = result.alerts.filter((a) => a.severity === "critical");
      const high = result.alerts.filter((a) => a.severity === "high");
      expect(critical).toHaveLength(0);
      expect(high).toHaveLength(0);
    });
  });

  describe("ARIA insights", () => {
    it("generates critical insight for overdue visit", () => {
      const visits = [
        makeVisit({ id: "v1", visit_date: "2026-04-10" }), // 45 days
      ];

      const result = computeReg44Intelligence({ visits, today: TODAY });
      const critical = result.insights.filter((i) => i.severity === "critical");
      expect(critical.some((c) => c.text.includes("45 days overdue"))).toBe(true);
    });

    it("generates warning for low completion rate", () => {
      const visits = [
        makeVisit({
          id: "v1",
          visit_date: "2026-05-18",
          recommendations: [
            makeRecommendation({ id: "r1", status: "pending" }),
            makeRecommendation({ id: "r2", status: "pending" }),
            makeRecommendation({ id: "r3", status: "completed" }),
          ],
        }),
      ];

      const result = computeReg44Intelligence({ visits, today: TODAY });
      const warnings = result.insights.filter((i) => i.severity === "warning");
      expect(warnings.some((w) => w.text.includes("33%"))).toBe(true);
    });

    it("generates positive insight when all on schedule", () => {
      const visits = [
        makeVisit({ id: "v1", visit_date: "2026-03-25" }),
        makeVisit({ id: "v2", visit_date: "2026-04-22" }),  // 28 days
        makeVisit({ id: "v3", visit_date: "2026-05-18" }),  // 26 days
      ];

      const result = computeReg44Intelligence({ visits, today: TODAY });
      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.some((p) => p.text.includes("All 3 Reg 44 visits completed on schedule"))).toBe(true);
    });

    it("generates positive insight for high completion rate", () => {
      const visits = [
        makeVisit({
          id: "v1",
          visit_date: "2026-05-18",
          recommendations: [
            makeRecommendation({ id: "r1", status: "completed" }),
            makeRecommendation({ id: "r2", status: "completed" }),
            makeRecommendation({ id: "r3", status: "completed" }),
            makeRecommendation({ id: "r4", status: "completed" }),
            makeRecommendation({ id: "r5", status: "in_progress" }),
          ],
        }),
      ];

      const result = computeReg44Intelligence({ visits, today: TODAY });
      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.some((p) => p.text.includes("80%") && p.text.includes("follow-through"))).toBe(true);
    });

    it("generates positive insight for 100% children participation", () => {
      const visits = [
        makeVisit({ id: "v1", visit_date: "2026-05-18", children_spoken_count: 3, children_total: 3 }),
        makeVisit({ id: "v2", visit_date: "2026-04-18", children_spoken_count: 3, children_total: 3 }),
      ];

      const result = computeReg44Intelligence({ visits, today: TODAY });
      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.some((p) => p.text.includes("100% of children spoken to"))).toBe(true);
    });
  });

  describe("full Chamberlain House integration", () => {
    it("processes realistic multi-visit data", () => {
      const visits: VisitInput[] = [
        {
          id: "v44_3", visit_date: "2026-03-19", visitor: "Margaret Thompson",
          duration_hours: 4, children_spoken_count: 3, children_total: 3,
          staff_spoken: 4, records_reviewed: ["key working", "behaviour logs", "TCI records"],
          overall_judgement: "Good with notable practice.",
          strengths_count: 3, areas_for_development_count: 1,
          recommendations: [
            { id: "rec_3a", recommendation: "Replace garden furniture", priority: "medium", status: "completed", rm_response: "Done.", completed_at: "2026-04-01" },
          ],
          report_sent_to_ofsted: true, report_sent_date: "2026-03-24",
        },
        {
          id: "v44_2", visit_date: "2026-04-18", visitor: "Margaret Thompson",
          duration_hours: 3.5, children_spoken_count: 2, children_total: 3,
          staff_spoken: 3, records_reviewed: ["daily logs", "supervision records"],
          overall_judgement: "Good.",
          strengths_count: 3, areas_for_development_count: 1,
          recommendations: [
            { id: "rec_2a", recommendation: "Review supervision scheduling", priority: "medium", status: "completed", rm_response: "Implemented.", completed_at: "2026-04-25" },
            { id: "rec_2b", recommendation: "Ensure Casey spoken to at next visit", priority: "medium", status: "completed", rm_response: "Arranged.", completed_at: "2026-05-15" },
          ],
          report_sent_to_ofsted: true, report_sent_date: "2026-04-23",
        },
        {
          id: "v44_1", visit_date: "2026-05-18", visitor: "Margaret Thompson",
          duration_hours: 4, children_spoken_count: 3, children_total: 3,
          staff_spoken: 4, records_reviewed: ["daily logs", "medication", "incidents"],
          overall_judgement: "Good — no immediate concerns.",
          strengths_count: 3, areas_for_development_count: 2,
          recommendations: [
            { id: "rec_1a", recommendation: "Implement nightly checklist", priority: "medium", status: "in_progress", rm_response: "Accepted.", completed_at: null },
            { id: "rec_1b", recommendation: "Conduct fire drill", priority: "high", status: "completed", rm_response: "Done.", completed_at: "2026-05-20" },
            { id: "rec_1c", recommendation: "Update house rules display", priority: "low", status: "in_progress", rm_response: "Agreed.", completed_at: null },
          ],
          report_sent_to_ofsted: true, report_sent_date: "2026-05-23",
        },
      ];

      const result = computeReg44Intelligence({ visits, today: TODAY });

      // Overview
      expect(result.overview.total_visits_12m).toBe(3);
      expect(result.overview.visits_on_schedule).toBe(true); // 30, 30 day gaps, last 7 days ago
      expect(result.overview.avg_days_between_visits).toBe(30);
      expect(result.overview.total_recommendations).toBe(6);
      expect(result.overview.recommendations_completed).toBe(4);
      expect(result.overview.completion_rate).toBe(67); // 4/6
      expect(result.overview.ofsted_reporting_compliance).toBe(100); // all within 7 days

      // Visit profiles sorted chronologically
      expect(result.visit_profiles).toHaveLength(3);
      expect(result.visit_profiles[0].visit_date).toBe("2026-03-19");
      expect(result.visit_profiles[1].days_since_previous).toBe(30);
      expect(result.visit_profiles[2].days_since_previous).toBe(30);

      // Children participation
      expect(result.overview.children_participation_rate).toBe(89); // (100+67+100)/3

      // No critical/high alerts (all on schedule, fire drill done)
      // But high alert for any remaining high priority incomplete: none here (rec_1b completed)
      const critical = result.alerts.filter((a) => a.severity === "critical");
      expect(critical).toHaveLength(0);

      // Low alert: 1 visit with <100% children
      const low = result.alerts.filter((a) => a.severity === "low");
      expect(low.some((a) => a.message.includes("not all children"))).toBe(true);

      // Positive insight for on-schedule visits
      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.some((p) => p.text.includes("All 3 Reg 44 visits"))).toBe(true);
    });
  });
});
