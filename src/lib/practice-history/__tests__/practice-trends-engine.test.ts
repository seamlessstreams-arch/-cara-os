import { describe, expect, it } from "vitest";
import { buildTrendSeries, summarisePracticeTrends } from "../practice-trends-engine";
import type { PaceAnalysisRecord, WritingReviewRecord } from "../types";

const TODAY = "2026-06-14T12:00:00.000Z";
const DAY = 864e5;
function daysAgoIso(d: number): string { return new Date(Date.parse(TODAY) - d * DAY).toISOString(); }

describe("practice-trends-engine — buildTrendSeries", () => {
  it("buckets scores into weekly windows oldest-first with an 8-length sparkline", () => {
    const rows = [
      { at: daysAgoIso(1), score: 80 },   // week 0
      { at: daysAgoIso(2), score: 70 },   // week 0
      { at: daysAgoIso(10), score: 50 },  // week 1
      { at: daysAgoIso(40), score: 30 },  // week 5
    ];
    const s = buildTrendSeries(rows, TODAY, 8, "Test");
    expect(s.series).toHaveLength(8);
    expect(s.sparkline).toHaveLength(8);
    expect(s.total).toBe(4);
    // newest week (last element) averages 75
    expect(s.series[s.series.length - 1]).toMatchObject({ weeksAgo: 0, avgScore: 75, count: 2 });
  });

  it("reports improving when the last 4 weeks beat the prior 4", () => {
    const rows = [
      ...[1, 3, 8, 15].map((d) => ({ at: daysAgoIso(d), score: 85 })), // recent 4w high
      ...[30, 35, 45, 52].map((d) => ({ at: daysAgoIso(d), score: 50 })), // prior 4w low
    ];
    const s = buildTrendSeries(rows, TODAY, 8, "Test");
    expect(s.direction).toBe("improving");
    expect(s.recent4wAvg).toBeGreaterThan(s.prior4wAvg!);
  });

  it("reports worsening when recent dips below prior", () => {
    const rows = [
      ...[1, 8].map((d) => ({ at: daysAgoIso(d), score: 45 })),
      ...[30, 45].map((d) => ({ at: daysAgoIso(d), score: 80 })),
    ];
    expect(buildTrendSeries(rows, TODAY, 8, "Test").direction).toBe("worsening");
  });

  it("flags insufficient_data with fewer than 3 analyses", () => {
    const s = buildTrendSeries([{ at: daysAgoIso(2), score: 70 }], TODAY, 8, "Test");
    expect(s.direction).toBe("insufficient_data");
    expect(s.headline.toLowerCase()).toContain("not enough");
  });
});

describe("practice-trends-engine — summarisePracticeTrends", () => {
  it("returns pace + writing series over the window", () => {
    const pace: PaceAnalysisRecord[] = [1, 3, 9, 30].map((d, i) => ({
      id: `p${i}`, at: daysAgoIso(d), home_id: "home_oak", child_id: null, staff_id: null,
      context: "INCIDENT", score: 60 + i * 5, band: "developing", flag_count: 0, manager_review_required: false,
    }));
    const writing: WritingReviewRecord[] = [2, 5, 12].map((d, i) => ({
      id: `w${i}`, at: daysAgoIso(d), home_id: "home_oak", staff_id: null,
      record_type: "incident", overall_score: 55 + i * 4, flag_count: 1,
    }));
    const r = summarisePracticeTrends({ paceAnalyses: pace, writingReviews: writing, today: TODAY });
    expect(r.weeks).toBe(8);
    expect(r.pace.total).toBe(4);
    expect(r.writing.total).toBe(3);
    expect(r.pace.series).toHaveLength(8);
  });
});
