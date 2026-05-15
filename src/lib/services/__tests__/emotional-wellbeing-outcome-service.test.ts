import { describe, it, expect } from "vitest";
import { _testing, type EmotionalWellbeingOutcomeRow } from "../emotional-wellbeing-outcome-service";

const { computeEmotionalWellbeingMetrics, computeEmotionalWellbeingAlerts, generateEmotionalWellbeingAriaInsights } = _testing;

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRow(overrides?: Partial<EmotionalWellbeingOutcomeRow>): EmotionalWellbeingOutcomeRow {
  return {
    id: overrides?.id ?? "a-1", home_id: overrides?.home_id ?? "home-1",
    child_name: overrides?.child_name ?? "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
    assessment_date: overrides?.assessment_date ?? now.toISOString().split("T")[0],
    outcome_measure: overrides?.outcome_measure ?? "sdq_total",
    raw_score: overrides?.raw_score ?? 12,
    clinical_band: overrides?.clinical_band ?? "normal",
    trend_direction: overrides?.trend_direction ?? "stable",
    assessment_context: overrides?.assessment_context ?? "routine_review",
    previous_score: "previous_score" in (overrides ?? {}) ? (overrides!.previous_score ?? null) : null,
    clinician_name: "clinician_name" in (overrides ?? {}) ? (overrides!.clinician_name ?? null) : null,
    child_self_reported: overrides?.child_self_reported ?? false,
    discussed_with_child: overrides?.discussed_with_child ?? true,
    informed_care_plan: overrides?.informed_care_plan ?? true,
    referral_made: overrides?.referral_made ?? false,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(), updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("emotional-wellbeing-outcome-service", () => {
  describe("computeEmotionalWellbeingMetrics", () => {
    it("returns zeros for empty", () => { const m = computeEmotionalWellbeingMetrics([]); expect(m.total_assessments).toBe(0); expect(m.clinical_count).toBe(0); expect(m.crisis_count).toBe(0); expect(m.declining_count).toBe(0); expect(m.improving_count).toBe(0); expect(m.child_self_reported_rate).toBe(0); expect(m.discussed_with_child_rate).toBe(0); expect(m.informed_care_plan_rate).toBe(0); expect(m.referral_made_rate).toBe(0); expect(m.unique_children).toBe(0); });
    it("returns empty breakdowns for empty", () => { const m = computeEmotionalWellbeingMetrics([]); expect(m.clinical_band_breakdown).toEqual({}); expect(m.measure_breakdown).toEqual({}); });
    it("total_assessments counts rows", () => { expect(computeEmotionalWellbeingMetrics([makeRow(), makeRow(), makeRow()]).total_assessments).toBe(3); });
    it("counts clinical band as clinical_count", () => { expect(computeEmotionalWellbeingMetrics([makeRow({ clinical_band: "clinical" })]).clinical_count).toBe(1); });
    it("counts high_clinical as clinical_count", () => { expect(computeEmotionalWellbeingMetrics([makeRow({ clinical_band: "high_clinical" })]).clinical_count).toBe(1); });
    it("counts crisis as clinical_count", () => { expect(computeEmotionalWellbeingMetrics([makeRow({ clinical_band: "crisis" })]).clinical_count).toBe(1); });
    it("does not count normal as clinical_count", () => { expect(computeEmotionalWellbeingMetrics([makeRow({ clinical_band: "normal" })]).clinical_count).toBe(0); });
    it("does not count borderline as clinical_count", () => { expect(computeEmotionalWellbeingMetrics([makeRow({ clinical_band: "borderline" })]).clinical_count).toBe(0); });
    it("counts crisis_count", () => { expect(computeEmotionalWellbeingMetrics([makeRow({ clinical_band: "crisis" })]).crisis_count).toBe(1); });
    it("does not count clinical as crisis_count", () => { expect(computeEmotionalWellbeingMetrics([makeRow({ clinical_band: "clinical" })]).crisis_count).toBe(0); });
    it("counts declining_count", () => { expect(computeEmotionalWellbeingMetrics([makeRow({ trend_direction: "declining" })]).declining_count).toBe(1); });
    it("counts improving_count", () => { expect(computeEmotionalWellbeingMetrics([makeRow({ trend_direction: "improving" })]).improving_count).toBe(1); });
    it("child_self_reported_rate 0 when false", () => { expect(computeEmotionalWellbeingMetrics([makeRow({ child_self_reported: false })]).child_self_reported_rate).toBe(0); });
    it("child_self_reported_rate 100 when true", () => { expect(computeEmotionalWellbeingMetrics([makeRow({ child_self_reported: true })]).child_self_reported_rate).toBe(100); });
    it("discussed_with_child_rate 100 with default", () => { expect(computeEmotionalWellbeingMetrics([makeRow()]).discussed_with_child_rate).toBe(100); });
    it("discussed_with_child_rate 0 when false", () => { expect(computeEmotionalWellbeingMetrics([makeRow({ discussed_with_child: false })]).discussed_with_child_rate).toBe(0); });
    it("informed_care_plan_rate 100 with default", () => { expect(computeEmotionalWellbeingMetrics([makeRow()]).informed_care_plan_rate).toBe(100); });
    it("referral_made_rate 0 with default", () => { expect(computeEmotionalWellbeingMetrics([makeRow()]).referral_made_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeEmotionalWellbeingMetrics([makeRow({ child_self_reported: true }), makeRow({ child_self_reported: false }), makeRow({ child_self_reported: true })]); expect(m.child_self_reported_rate).toBe(66.7); });
    it("unique_children distinct", () => { const m = computeEmotionalWellbeingMetrics([makeRow({ child_name: "A" }), makeRow({ child_name: "B" }), makeRow({ child_name: "A" })]); expect(m.unique_children).toBe(2); });
    it("unique_children single", () => { expect(computeEmotionalWellbeingMetrics([makeRow()]).unique_children).toBe(1); });
    it("clinical_band_breakdown counts all 5 bands", () => { const bands = ["normal","borderline","clinical","high_clinical","crisis"] as const; const rows = bands.map(b => makeRow({ clinical_band: b })); const m = computeEmotionalWellbeingMetrics(rows); for (const b of bands) expect(m.clinical_band_breakdown[b]).toBe(1); });
    it("measure_breakdown counts all 10 measures", () => { const measures = ["sdq_total","sdq_emotional","sdq_conduct","sdq_hyperactivity","sdq_peer_problems","sdq_prosocial","rcads_anxiety","rcads_depression","wellbeing_scale","self_report"] as const; const rows = measures.map(m => makeRow({ outcome_measure: m })); const met = computeEmotionalWellbeingMetrics(rows); for (const m of measures) expect(met.measure_breakdown[m]).toBe(1); });
    it("measure_breakdown accumulates duplicates", () => { const m = computeEmotionalWellbeingMetrics([makeRow({ outcome_measure: "sdq_total" }), makeRow({ outcome_measure: "sdq_total" })]); expect(m.measure_breakdown["sdq_total"]).toBe(2); });
  });

  describe("computeEmotionalWellbeingAlerts", () => {
    it("returns empty for empty", () => { expect(computeEmotionalWellbeingAlerts([])).toEqual([]); });
    it("returns empty for clean rows", () => { expect(computeEmotionalWellbeingAlerts([makeRow()])).toEqual([]); });
    it("fires crisis_no_referral", () => { const a = computeEmotionalWellbeingAlerts([makeRow({ clinical_band: "crisis", referral_made: false, child_name: "Jo", outcome_measure: "sdq_total" })]); expect(a[0].type).toBe("crisis_no_referral"); expect(a[0].severity).toBe("critical"); expect(a[0].message).toContain("Jo"); expect(a[0].message).toContain("sdq total"); expect(a[0].record_id).toBe("a-1"); });
    it("crisis_no_referral per-record", () => { const a = computeEmotionalWellbeingAlerts([makeRow({ id: "a-1", clinical_band: "crisis", referral_made: false }), makeRow({ id: "a-2", clinical_band: "crisis", referral_made: false })]); expect(a.filter(x => x.type === "crisis_no_referral")).toHaveLength(2); });
    it("no crisis alert if referral made", () => { expect(computeEmotionalWellbeingAlerts([makeRow({ clinical_band: "crisis", referral_made: true })]).filter(x => x.type === "crisis_no_referral")).toHaveLength(0); });
    it("no crisis alert for clinical band without crisis", () => { expect(computeEmotionalWellbeingAlerts([makeRow({ clinical_band: "clinical", referral_made: false })]).filter(x => x.type === "crisis_no_referral")).toHaveLength(0); });
    it("fires clinical_declining singular", () => { const a = computeEmotionalWellbeingAlerts([makeRow({ clinical_band: "clinical", trend_direction: "declining" })]); const f = a.find(x => x.type === "clinical_declining"); expect(f).toBeDefined(); expect(f!.severity).toBe("high"); expect(f!.message).toContain("1 assessment shows"); });
    it("fires clinical_declining for high_clinical", () => { const a = computeEmotionalWellbeingAlerts([makeRow({ clinical_band: "high_clinical", trend_direction: "declining" })]); expect(a.find(x => x.type === "clinical_declining")).toBeDefined(); });
    it("clinical_declining plural", () => { const a = computeEmotionalWellbeingAlerts([makeRow({ clinical_band: "clinical", trend_direction: "declining" }), makeRow({ clinical_band: "high_clinical", trend_direction: "declining" })]); const f = a.find(x => x.type === "clinical_declining"); expect(f!.message).toContain("2 assessments show"); });
    it("no clinical_declining for stable trend", () => { expect(computeEmotionalWellbeingAlerts([makeRow({ clinical_band: "clinical", trend_direction: "stable" })]).find(x => x.type === "clinical_declining")).toBeUndefined(); });
    it("no clinical_declining for normal band declining", () => { expect(computeEmotionalWellbeingAlerts([makeRow({ clinical_band: "normal", trend_direction: "declining" })]).find(x => x.type === "clinical_declining")).toBeUndefined(); });
    it("child_views_not_discussed not for 1", () => { expect(computeEmotionalWellbeingAlerts([makeRow({ discussed_with_child: false })]).find(x => x.type === "child_views_not_discussed")).toBeUndefined(); });
    it("child_views_not_discussed fires for 2", () => { const a = computeEmotionalWellbeingAlerts([makeRow({ discussed_with_child: false }), makeRow({ discussed_with_child: false })]); const f = a.find(x => x.type === "child_views_not_discussed"); expect(f).toBeDefined(); expect(f!.severity).toBe("high"); expect(f!.message).toContain("2 assessments"); });
    it("care_plan_not_informed not for 1", () => { expect(computeEmotionalWellbeingAlerts([makeRow({ informed_care_plan: false })]).find(x => x.type === "care_plan_not_informed")).toBeUndefined(); });
    it("care_plan_not_informed fires for 2", () => { const a = computeEmotionalWellbeingAlerts([makeRow({ informed_care_plan: false }), makeRow({ informed_care_plan: false })]); const f = a.find(x => x.type === "care_plan_not_informed"); expect(f).toBeDefined(); expect(f!.severity).toBe("medium"); expect(f!.message).toContain("2 assessments"); });
    it("fires all applicable alerts", () => { const a = computeEmotionalWellbeingAlerts([makeRow({ clinical_band: "crisis", referral_made: false, trend_direction: "declining", discussed_with_child: false, informed_care_plan: false }), makeRow({ clinical_band: "clinical", trend_direction: "declining", discussed_with_child: false, informed_care_plan: false })]); const types = a.map(x => x.type); expect(types).toContain("crisis_no_referral"); expect(types).toContain("clinical_declining"); expect(types).toContain("child_views_not_discussed"); expect(types).toContain("care_plan_not_informed"); });
  });

  describe("generateEmotionalWellbeingAriaInsights", () => {
    it("returns 3 insights for empty data", () => { const m = computeEmotionalWellbeingMetrics([]); const a = computeEmotionalWellbeingAlerts([]); const insights = generateEmotionalWellbeingAriaInsights(m, a); expect(insights).toHaveLength(3); });
    it("insight 1 starts with [pink]", () => { const m = computeEmotionalWellbeingMetrics([]); const a = computeEmotionalWellbeingAlerts([]); expect(generateEmotionalWellbeingAriaInsights(m, a)[0]).toMatch(/^\[pink\]/); });
    it("insight 2 starts with [amber]", () => { const m = computeEmotionalWellbeingMetrics([]); const a = computeEmotionalWellbeingAlerts([]); expect(generateEmotionalWellbeingAriaInsights(m, a)[1]).toMatch(/^\[amber\]/); });
    it("insight 3 starts with [reflect]", () => { const m = computeEmotionalWellbeingMetrics([]); const a = computeEmotionalWellbeingAlerts([]); expect(generateEmotionalWellbeingAriaInsights(m, a)[2]).toMatch(/^\[reflect\]/); });
    it("insight 1 contains total assessments count", () => { const m = computeEmotionalWellbeingMetrics([makeRow(), makeRow()]); const a = computeEmotionalWellbeingAlerts([makeRow(), makeRow()]); expect(generateEmotionalWellbeingAriaInsights(m, a)[0]).toContain("2 emotional wellbeing assessments"); });
    it("insight 1 contains unique children count", () => { const m = computeEmotionalWellbeingMetrics([makeRow({ child_name: "A" }), makeRow({ child_name: "B" })]); const a = computeEmotionalWellbeingAlerts([]); expect(generateEmotionalWellbeingAriaInsights(m, a)[0]).toContain("2 children"); });
    it("insight 1 uses singular child for 1", () => { const m = computeEmotionalWellbeingMetrics([makeRow()]); const a = computeEmotionalWellbeingAlerts([]); expect(generateEmotionalWellbeingAriaInsights(m, a)[0]).toContain("1 child"); });
    it("insight 1 contains clinical count", () => { const m = computeEmotionalWellbeingMetrics([makeRow({ clinical_band: "clinical" })]); const a = computeEmotionalWellbeingAlerts([]); expect(generateEmotionalWellbeingAriaInsights(m, a)[0]).toContain("1 (100%)"); });
    it("insight 1 contains improving and declining counts", () => { const m = computeEmotionalWellbeingMetrics([makeRow({ trend_direction: "improving" }), makeRow({ trend_direction: "declining" })]); const a = computeEmotionalWellbeingAlerts([]); const i = generateEmotionalWellbeingAriaInsights(m, a)[0]; expect(i).toContain("1 improving"); expect(i).toContain("1 declining"); });
    it("insight 1 contains child self-reported rate", () => { const m = computeEmotionalWellbeingMetrics([makeRow({ child_self_reported: true })]); const a = computeEmotionalWellbeingAlerts([]); expect(generateEmotionalWellbeingAriaInsights(m, a)[0]).toContain("100%"); });
    it("insight 2 mentions critical and high alert counts", () => { const rows = [makeRow({ clinical_band: "crisis", referral_made: false }), makeRow({ clinical_band: "clinical", trend_direction: "declining" })]; const m = computeEmotionalWellbeingMetrics(rows); const a = computeEmotionalWellbeingAlerts(rows); const i = generateEmotionalWellbeingAriaInsights(m, a)[1]; expect(i).toContain("1 critical"); expect(i).toContain("1 high-priority"); });
    it("insight 2 shows no concerns when none", () => { const m = computeEmotionalWellbeingMetrics([makeRow()]); const a = computeEmotionalWellbeingAlerts([makeRow()]); expect(generateEmotionalWellbeingAriaInsights(m, a)[1]).toContain("No critical or high-priority concerns"); });
    it("insight 2 contains discussed-with-child rate", () => { const m = computeEmotionalWellbeingMetrics([makeRow()]); const a = computeEmotionalWellbeingAlerts([]); expect(generateEmotionalWellbeingAriaInsights(m, a)[1]).toContain("Discussed-with-child rate"); });
    it("insight 3 contains reflective question", () => { const m = computeEmotionalWellbeingMetrics([]); const a = computeEmotionalWellbeingAlerts([]); const i = generateEmotionalWellbeingAriaInsights(m, a)[2]; expect(i).toContain("outcome measures"); expect(i).toContain("child"); });
  });
});
