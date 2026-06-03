// Integration: REAL store → recording-quality scores → weekly quality trend.
import { describe, it, expect } from "vitest";
import { getStore } from "@/lib/db/store";
import { computeRecordingQuality } from "@/lib/recording-quality/recording-quality-engine";
import { mapStoreToRecords } from "@/lib/recording-quality/store-records";
import { computeRecordingQualityTrend } from "../recording-quality-trend-engine";

describe("recording-quality-trend integration (quality → weekly trend)", () => {
  const quality = computeRecordingQuality({ records: mapStoreToRecords(getStore()) });
  const result = computeRecordingQualityTrend({ records: quality.records, weeks: 8 });

  it("builds an 8-week series from real records", () => {
    expect(result.series).toHaveLength(8);
    expect(result.overview.weeks_covered).toBe(8);
    expect(result.overview.populated_weeks).toBeGreaterThan(0);
  });

  it("every weekly point has valid averages", () => {
    for (const p of result.series) {
      expect(p.avg_overall).toBeGreaterThanOrEqual(0);
      expect(p.avg_overall).toBeLessThanOrEqual(100);
      expect(p.child_voice).toBeGreaterThanOrEqual(0);
      expect(p.child_voice).toBeLessThanOrEqual(100);
    }
  });

  it("derives a trend direction and a current average", () => {
    expect(["improving", "declining", "stable", "insufficient_data"]).toContain(result.overview.overall_trend);
    expect(result.overview.current_avg).toBeGreaterThan(0);
  });
});
