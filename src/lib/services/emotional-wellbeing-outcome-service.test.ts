import { describe, it, expect } from "vitest";
import {
  computeEmotionalWellbeingMetrics,
  computeEmotionalWellbeingAlerts,
  generateEmotionalWellbeingCaraInsights,
  type EmotionalWellbeingOutcomeRow,
} from "./emotional-wellbeing-outcome-service";

function makeRow(overrides: Partial<EmotionalWellbeingOutcomeRow> = {}): EmotionalWellbeingOutcomeRow {
  return {
    id: "ew-1",
    home_id: "home-1",
    child_name: "Child A",
    child_id: "child-1",
    assessment_date: "2026-05-01",
    outcome_measure: "sdq_total",
    raw_score: 15,
    clinical_band: "normal",
    trend_direction: "stable",
    assessment_context: "routine_review",
    previous_score: null,
    clinician_name: "Dr Jones",
    child_self_reported: true,
    discussed_with_child: true,
    informed_care_plan: true,
    referral_made: false,
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

describe("emotional-wellbeing-outcome-service", () => {
  // ── computeEmotionalWellbeingMetrics ──────────────────────────────

  describe("computeEmotionalWellbeingMetrics", () => {
    it("returns zeroes for empty data", () => {
      const m = computeEmotionalWellbeingMetrics([]);
      expect(m.total_assessments).toBe(0);
      expect(m.clinical_count).toBe(0);
      expect(m.crisis_count).toBe(0);
      expect(m.declining_count).toBe(0);
      expect(m.improving_count).toBe(0);
      expect(m.child_self_reported_rate).toBe(0);
      expect(m.unique_children).toBe(0);
    });

    it("counts clinical bands correctly (clinical, high_clinical, crisis all count)", () => {
      const rows = [
        makeRow({ id: "1", clinical_band: "clinical" }),
        makeRow({ id: "2", clinical_band: "high_clinical" }),
        makeRow({ id: "3", clinical_band: "crisis" }),
        makeRow({ id: "4", clinical_band: "normal" }),
        makeRow({ id: "5", clinical_band: "borderline" }),
      ];
      const m = computeEmotionalWellbeingMetrics(rows);
      expect(m.clinical_count).toBe(3);
      expect(m.crisis_count).toBe(1);
    });

    it("counts trends correctly", () => {
      const rows = [
        makeRow({ id: "1", trend_direction: "improving" }),
        makeRow({ id: "2", trend_direction: "declining" }),
        makeRow({ id: "3", trend_direction: "stable" }),
      ];
      const m = computeEmotionalWellbeingMetrics(rows);
      expect(m.improving_count).toBe(1);
      expect(m.declining_count).toBe(1);
    });

    it("computes boolean rates correctly", () => {
      const rows = [
        makeRow({ id: "1", child_self_reported: true, discussed_with_child: true, informed_care_plan: true, referral_made: true }),
        makeRow({ id: "2", child_self_reported: false, discussed_with_child: false, informed_care_plan: false, referral_made: false }),
      ];
      const m = computeEmotionalWellbeingMetrics(rows);
      expect(m.child_self_reported_rate).toBe(50);
      expect(m.discussed_with_child_rate).toBe(50);
      expect(m.informed_care_plan_rate).toBe(50);
      expect(m.referral_made_rate).toBe(50);
    });

    it("builds clinical_band_breakdown and measure_breakdown", () => {
      const rows = [
        makeRow({ id: "1", clinical_band: "normal", outcome_measure: "sdq_total" }),
        makeRow({ id: "2", clinical_band: "normal", outcome_measure: "rcads_anxiety" }),
        makeRow({ id: "3", clinical_band: "clinical", outcome_measure: "sdq_total" }),
      ];
      const m = computeEmotionalWellbeingMetrics(rows);
      expect(m.clinical_band_breakdown["normal"]).toBe(2);
      expect(m.clinical_band_breakdown["clinical"]).toBe(1);
      expect(m.measure_breakdown["sdq_total"]).toBe(2);
      expect(m.measure_breakdown["rcads_anxiety"]).toBe(1);
    });
  });

  // ── computeEmotionalWellbeingAlerts ───────────────────────────────

  describe("computeEmotionalWellbeingAlerts", () => {
    it("returns empty alerts for empty data", () => {
      expect(computeEmotionalWellbeingAlerts([])).toHaveLength(0);
    });

    it("fires crisis_no_referral (critical) per-record", () => {
      const row = makeRow({
        id: "cr-1",
        clinical_band: "crisis",
        referral_made: false,
      });
      const alerts = computeEmotionalWellbeingAlerts([row]);
      const found = alerts.filter((a) => a.type === "crisis_no_referral");
      expect(found).toHaveLength(1);
      expect(found[0].severity).toBe("critical");
      expect(found[0].record_id).toBe("cr-1");
    });

    it("fires clinical_declining (high) when >= 1 clinical/high_clinical declining", () => {
      const row = makeRow({
        id: "cd-1",
        clinical_band: "clinical",
        trend_direction: "declining",
      });
      const alerts = computeEmotionalWellbeingAlerts([row]);
      const found = alerts.filter((a) => a.type === "clinical_declining");
      expect(found).toHaveLength(1);
      expect(found[0].severity).toBe("high");
    });

    it("fires child_views_not_discussed (high) when >= 2 not discussed", () => {
      const rows = [
        makeRow({ id: "d1", discussed_with_child: false }),
        makeRow({ id: "d2", discussed_with_child: false }),
      ];
      const alerts = computeEmotionalWellbeingAlerts(rows);
      const found = alerts.filter((a) => a.type === "child_views_not_discussed");
      expect(found).toHaveLength(1);
      expect(found[0].severity).toBe("high");
    });

    it("fires care_plan_not_informed (medium) when >= 2 not informed", () => {
      const rows = [
        makeRow({ id: "c1", informed_care_plan: false }),
        makeRow({ id: "c2", informed_care_plan: false }),
      ];
      const alerts = computeEmotionalWellbeingAlerts(rows);
      const found = alerts.filter((a) => a.type === "care_plan_not_informed");
      expect(found).toHaveLength(1);
      expect(found[0].severity).toBe("medium");
    });

    it("does not fire child_views_not_discussed with only 1 record", () => {
      const rows = [makeRow({ id: "d1", discussed_with_child: false })];
      const alerts = computeEmotionalWellbeingAlerts(rows);
      const found = alerts.filter((a) => a.type === "child_views_not_discussed");
      expect(found).toHaveLength(0);
    });
  });

  // ── generateEmotionalWellbeingCaraInsights ────────────────────────

  describe("generateEmotionalWellbeingCaraInsights", () => {
    it("returns 3 insights", () => {
      const rows = [makeRow()];
      const metrics = computeEmotionalWellbeingMetrics(rows);
      const alerts = computeEmotionalWellbeingAlerts(rows);
      const insights = generateEmotionalWellbeingCaraInsights(metrics, alerts);
      expect(insights).toHaveLength(3);
      expect(insights[0]).toContain("[pink]");
      expect(insights[1]).toContain("[amber]");
      expect(insights[2]).toContain("[reflect]");
    });
  });
});
