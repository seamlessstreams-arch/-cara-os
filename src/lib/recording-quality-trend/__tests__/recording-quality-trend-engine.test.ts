import { describe, it, expect } from "vitest";
import { computeRecordingQualityTrend } from "../recording-quality-trend-engine";
import type { ScoredRecord } from "@/lib/recording-quality/recording-quality-engine";

const TODAY = "2026-06-02";
function addDays(date: string, n: number): string {
  const d = new Date(date); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10);
}
const at = (n: number) => addDays(TODAY, -n);

function sr(id: string, daysAgo: number, overall: number, childVoice: number): ScoredRecord {
  return {
    id, type: "daily_log", date: at(daysAgo), overall, band: "good",
    score: { completeness: 90, clarity: 90, professionalLanguage: 90, factuality: 90, childCentredness: childVoice, riskRelevance: 90, missingFields: [], caraSuggestions: [] },
  };
}
const run = (records: ScoredRecord[]) => computeRecordingQualityTrend({ records, today: TODAY, weeks: 8 });

// ══════════════════════════════════════════════════════════════════════════════
describe("weekly bucketing", () => {
  const r = run([sr("1", 2, 80, 80), sr("2", 9, 70, 60), sr("3", 16, 60, 50)]);
  it("produces a chronological 8-week series, oldest first", () => {
    expect(r.series).toHaveLength(8);
    for (let i = 1; i < r.series.length; i++) {
      expect(r.series[i - 1].week_start <= r.series[i].week_start).toBe(true);
    }
  });
  it("places records in the right weekly buckets", () => {
    expect(r.overview.populated_weeks).toBe(3);
    // newest populated week is 'this week' (the ago-2 record)
    const populated = r.series.filter((p) => p.count > 0);
    expect(populated[populated.length - 1].avg_overall).toBe(80);
  });
});

describe("improving trajectory", () => {
  const r = run([
    sr("old1", 28, 50, 45), sr("old2", 27, 52, 47),
    sr("new1", 5, 82, 80), sr("new2", 2, 80, 82),
  ]);
  it("detects improving overall and child's-voice trends", () => {
    expect(r.overview.overall_trend).toBe("improving");
    expect(r.overview.overall_change).toBeGreaterThan(0);
    expect(r.overview.childvoice_trend).toBe("improving");
    expect(r.overview.current_avg).toBe(81);
    expect(r.overview.childvoice_current).toBe(81);
  });
  it("emits a positive 'coaching is landing' insight", () => {
    expect(r.insights.some((i) => i.severity === "positive" && /coaching is landing/i.test(i.text))).toBe(true);
  });
});

describe("declining trajectory", () => {
  const r = run([sr("old", 28, 88, 85), sr("new", 2, 55, 50)]);
  it("detects decline and raises an alert", () => {
    expect(r.overview.overall_trend).toBe("declining");
    expect(r.alerts.some((a) => a.severity === "high" && /declining/i.test(a.message))).toBe(true);
  });
});

describe("persistent weak child's voice", () => {
  it("flags a stable-but-low child's voice as a persistent gap", () => {
    const r = run([sr("a", 28, 78, 52), sr("b", 14, 80, 54), sr("c", 2, 79, 53)]);
    expect(r.overview.childvoice_trend).toBe("stable");
    expect(r.insights.some((i) => /persistent gap/i.test(i.text))).toBe(true);
  });
});

describe("insufficient history", () => {
  it("reports insufficient_data with a single populated week", () => {
    const r = run([sr("1", 2, 80, 80)]);
    expect(r.overview.overall_trend).toBe("insufficient_data");
    expect(r.insights.some((i) => /Not enough history/i.test(i.text))).toBe(true);
  });
});

describe("determinism", () => {
  it("returns identical output for identical input", () => {
    const recs = [sr("1", 20, 70, 60), sr("2", 3, 82, 80)];
    expect(JSON.stringify(run(recs))).toBe(JSON.stringify(run(recs)));
  });
});
