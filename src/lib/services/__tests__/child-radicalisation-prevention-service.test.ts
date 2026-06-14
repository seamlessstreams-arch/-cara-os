import { describe, it, expect } from "vitest";

import {
  VULNERABILITY_LEVELS,
  REFERRAL_OUTCOMES,
  ASSESSMENT_STATUSES,
  CONCERN_TYPES,
  _testing,
} from "../child-radicalisation-prevention-service";

import type {
  ChildRadicalisationPreventionRow,
} from "../child-radicalisation-prevention-service";

const {
  computeRadicalisationMetrics,
  computeRadicalisationAlerts,
  generateRadicalisationCaraInsights,
} = _testing;

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRow(
  overrides?: Partial<ChildRadicalisationPreventionRow>,
): ChildRadicalisationPreventionRow {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : crypto.randomUUID(),
    home_id: overrides?.home_id ?? "home-1",
    child_name: overrides?.child_name ?? "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
    assessment_date: overrides?.assessment_date ?? now.toISOString().split("T")[0],
    vulnerability_level: overrides?.vulnerability_level ?? "low",
    referral_outcome: overrides?.referral_outcome ?? "no_referral_needed",
    assessment_status: overrides?.assessment_status ?? "initial_screening",
    concern_type: overrides?.concern_type ?? "far_right",
    prevent_training_completed: overrides?.prevent_training_completed ?? true,
    online_activity_monitored: overrides?.online_activity_monitored ?? true,
    channel_referral_made: overrides?.channel_referral_made ?? true,
    multi_agency_involved: overrides?.multi_agency_involved ?? true,
    child_views_obtained: overrides?.child_views_obtained ?? true,
    family_engaged: overrides?.family_engaged ?? true,
    safety_plan_in_place: overrides?.safety_plan_in_place ?? true,
    ideology_challenged: overrides?.ideology_challenged ?? true,
    assessor_name: "assessor_name" in (overrides ?? {}) ? (overrides!.assessor_name ?? null) : null,
    vulnerability_indicators: "vulnerability_indicators" in (overrides ?? {}) ? (overrides!.vulnerability_indicators ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(),
    updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("child-radicalisation-prevention-service", () => {
  // ── Enum validation ──────────────────────────────────────────────────
  describe("Enum validation", () => {
    it("VULNERABILITY_LEVELS has 5 values", () => { expect(VULNERABILITY_LEVELS).toHaveLength(5); });
    it("VULNERABILITY_LEVELS contains no_identified_risk", () => { expect(VULNERABILITY_LEVELS).toContain("no_identified_risk"); });
    it("VULNERABILITY_LEVELS contains low", () => { expect(VULNERABILITY_LEVELS).toContain("low"); });
    it("VULNERABILITY_LEVELS contains medium", () => { expect(VULNERABILITY_LEVELS).toContain("medium"); });
    it("VULNERABILITY_LEVELS contains significant", () => { expect(VULNERABILITY_LEVELS).toContain("significant"); });
    it("VULNERABILITY_LEVELS contains high", () => { expect(VULNERABILITY_LEVELS).toContain("high"); });

    it("REFERRAL_OUTCOMES has 6 values", () => { expect(REFERRAL_OUTCOMES).toHaveLength(6); });
    it("REFERRAL_OUTCOMES contains no_referral_needed", () => { expect(REFERRAL_OUTCOMES).toContain("no_referral_needed"); });
    it("REFERRAL_OUTCOMES contains channel_referral", () => { expect(REFERRAL_OUTCOMES).toContain("channel_referral"); });
    it("REFERRAL_OUTCOMES contains police_referral", () => { expect(REFERRAL_OUTCOMES).toContain("police_referral"); });
    it("REFERRAL_OUTCOMES contains social_care_referral", () => { expect(REFERRAL_OUTCOMES).toContain("social_care_referral"); });
    it("REFERRAL_OUTCOMES contains monitoring_continued", () => { expect(REFERRAL_OUTCOMES).toContain("monitoring_continued"); });
    it("REFERRAL_OUTCOMES contains closed_no_concerns", () => { expect(REFERRAL_OUTCOMES).toContain("closed_no_concerns"); });

    it("ASSESSMENT_STATUSES has 5 values", () => { expect(ASSESSMENT_STATUSES).toHaveLength(5); });
    it("ASSESSMENT_STATUSES contains initial_screening", () => { expect(ASSESSMENT_STATUSES).toContain("initial_screening"); });
    it("ASSESSMENT_STATUSES contains assessment_ongoing", () => { expect(ASSESSMENT_STATUSES).toContain("assessment_ongoing"); });
    it("ASSESSMENT_STATUSES contains channel_active", () => { expect(ASSESSMENT_STATUSES).toContain("channel_active"); });
    it("ASSESSMENT_STATUSES contains monitoring", () => { expect(ASSESSMENT_STATUSES).toContain("monitoring"); });
    it("ASSESSMENT_STATUSES contains closed", () => { expect(ASSESSMENT_STATUSES).toContain("closed"); });

    it("CONCERN_TYPES has 8 values", () => { expect(CONCERN_TYPES).toHaveLength(8); });
    it("CONCERN_TYPES contains far_right", () => { expect(CONCERN_TYPES).toContain("far_right"); });
    it("CONCERN_TYPES contains islamist", () => { expect(CONCERN_TYPES).toContain("islamist"); });
    it("CONCERN_TYPES contains incel", () => { expect(CONCERN_TYPES).toContain("incel"); });
    it("CONCERN_TYPES contains eco_extremism", () => { expect(CONCERN_TYPES).toContain("eco_extremism"); });
    it("CONCERN_TYPES contains single_issue", () => { expect(CONCERN_TYPES).toContain("single_issue"); });
    it("CONCERN_TYPES contains online_radicalisation", () => { expect(CONCERN_TYPES).toContain("online_radicalisation"); });
    it("CONCERN_TYPES contains peer_influence", () => { expect(CONCERN_TYPES).toContain("peer_influence"); });
    it("CONCERN_TYPES contains mixed_ideology", () => { expect(CONCERN_TYPES).toContain("mixed_ideology"); });
  });

  // ── makeRow factory ─────────────────────────────────────────────────
  describe("makeRow factory", () => {
    it("produces a valid default row", () => {
      const r = makeRow();
      expect(r.id).toBeDefined();
      expect(r.home_id).toBe("home-1");
      expect(r.child_name).toBe("Child A");
    });
    it("overrides child_name", () => { expect(makeRow({ child_name: "Zara" }).child_name).toBe("Zara"); });
    it("overrides vulnerability_level", () => { expect(makeRow({ vulnerability_level: "high" }).vulnerability_level).toBe("high"); });
    it("overrides id when provided", () => { expect(makeRow({ id: "my-id" }).id).toBe("my-id"); });
    it("overrides child_id to a value", () => { expect(makeRow({ child_id: "c-1" }).child_id).toBe("c-1"); });
    it("overrides child_id to null explicitly", () => { expect(makeRow({ child_id: null }).child_id).toBeNull(); });
    it("default child_id is null", () => { expect(makeRow().child_id).toBeNull(); });
    it("overrides assessor_name", () => { expect(makeRow({ assessor_name: "Jane" }).assessor_name).toBe("Jane"); });
    it("overrides vulnerability_indicators", () => { expect(makeRow({ vulnerability_indicators: "online activity" }).vulnerability_indicators).toBe("online activity"); });
    it("overrides notes", () => { expect(makeRow({ notes: "some notes" }).notes).toBe("some notes"); });
    it("default notes is null", () => { expect(makeRow().notes).toBeNull(); });
    it("default assessor_name is null", () => { expect(makeRow().assessor_name).toBeNull(); });
    it("default vulnerability_indicators is null", () => { expect(makeRow().vulnerability_indicators).toBeNull(); });
    it("overrides booleans", () => {
      const r = makeRow({ prevent_training_completed: false, online_activity_monitored: false });
      expect(r.prevent_training_completed).toBe(false);
      expect(r.online_activity_monitored).toBe(false);
    });
  });

  // ── computeRadicalisationMetrics ──────────────────────────────────────
  describe("computeRadicalisationMetrics", () => {
    it("returns zeros for empty array", () => {
      const m = computeRadicalisationMetrics([]);
      expect(m.total_assessments).toBe(0);
      expect(m.high_risk_count).toBe(0);
      expect(m.significant_risk_count).toBe(0);
      expect(m.channel_active_count).toBe(0);
      expect(m.monitoring_count).toBe(0);
      expect(m.prevent_training_rate).toBe(0);
      expect(m.online_monitoring_rate).toBe(0);
      expect(m.channel_referral_rate).toBe(0);
      expect(m.multi_agency_rate).toBe(0);
      expect(m.child_views_rate).toBe(0);
      expect(m.family_engaged_rate).toBe(0);
      expect(m.safety_plan_rate).toBe(0);
      expect(m.ideology_challenged_rate).toBe(0);
      expect(m.unique_children).toBe(0);
    });
    it("returns empty breakdowns for empty array", () => {
      const m = computeRadicalisationMetrics([]);
      expect(m.concern_type_breakdown).toEqual({});
      expect(m.vulnerability_breakdown).toEqual({});
    });
    it("total_assessments counts rows", () => { expect(computeRadicalisationMetrics([makeRow(), makeRow(), makeRow()]).total_assessments).toBe(3); });
    it("counts high_risk_count", () => { expect(computeRadicalisationMetrics([makeRow({ vulnerability_level: "high" })]).high_risk_count).toBe(1); });
    it("does not count significant as high_risk_count", () => { expect(computeRadicalisationMetrics([makeRow({ vulnerability_level: "significant" })]).high_risk_count).toBe(0); });
    it("does not count medium as high_risk_count", () => { expect(computeRadicalisationMetrics([makeRow({ vulnerability_level: "medium" })]).high_risk_count).toBe(0); });
    it("counts significant_risk_count", () => { expect(computeRadicalisationMetrics([makeRow({ vulnerability_level: "significant" })]).significant_risk_count).toBe(1); });
    it("does not count high as significant_risk_count", () => { expect(computeRadicalisationMetrics([makeRow({ vulnerability_level: "high" })]).significant_risk_count).toBe(0); });
    it("does not count medium as significant_risk_count", () => { expect(computeRadicalisationMetrics([makeRow({ vulnerability_level: "medium" })]).significant_risk_count).toBe(0); });
    it("counts channel_active_count", () => { expect(computeRadicalisationMetrics([makeRow({ assessment_status: "channel_active" })]).channel_active_count).toBe(1); });
    it("does not count monitoring as channel_active_count", () => { expect(computeRadicalisationMetrics([makeRow({ assessment_status: "monitoring" })]).channel_active_count).toBe(0); });
    it("counts monitoring_count", () => { expect(computeRadicalisationMetrics([makeRow({ assessment_status: "monitoring" })]).monitoring_count).toBe(1); });
    it("does not count channel_active as monitoring_count", () => { expect(computeRadicalisationMetrics([makeRow({ assessment_status: "channel_active" })]).monitoring_count).toBe(0); });

    // Boolean rates — true
    it("prevent_training_rate 100 when all true", () => { expect(computeRadicalisationMetrics([makeRow({ prevent_training_completed: true })]).prevent_training_rate).toBe(100); });
    it("online_monitoring_rate 100 when all true", () => { expect(computeRadicalisationMetrics([makeRow({ online_activity_monitored: true })]).online_monitoring_rate).toBe(100); });
    it("channel_referral_rate 100 when all true", () => { expect(computeRadicalisationMetrics([makeRow({ channel_referral_made: true })]).channel_referral_rate).toBe(100); });
    it("multi_agency_rate 100 when all true", () => { expect(computeRadicalisationMetrics([makeRow({ multi_agency_involved: true })]).multi_agency_rate).toBe(100); });
    it("child_views_rate 100 when all true", () => { expect(computeRadicalisationMetrics([makeRow({ child_views_obtained: true })]).child_views_rate).toBe(100); });
    it("family_engaged_rate 100 when all true", () => { expect(computeRadicalisationMetrics([makeRow({ family_engaged: true })]).family_engaged_rate).toBe(100); });
    it("safety_plan_rate 100 when all true", () => { expect(computeRadicalisationMetrics([makeRow({ safety_plan_in_place: true })]).safety_plan_rate).toBe(100); });
    it("ideology_challenged_rate 100 when all true", () => { expect(computeRadicalisationMetrics([makeRow({ ideology_challenged: true })]).ideology_challenged_rate).toBe(100); });

    // Boolean rates — false
    it("prevent_training_rate 0 when all false", () => { expect(computeRadicalisationMetrics([makeRow({ prevent_training_completed: false })]).prevent_training_rate).toBe(0); });
    it("online_monitoring_rate 0 when all false", () => { expect(computeRadicalisationMetrics([makeRow({ online_activity_monitored: false })]).online_monitoring_rate).toBe(0); });
    it("channel_referral_rate 0 when all false", () => { expect(computeRadicalisationMetrics([makeRow({ channel_referral_made: false })]).channel_referral_rate).toBe(0); });
    it("multi_agency_rate 0 when all false", () => { expect(computeRadicalisationMetrics([makeRow({ multi_agency_involved: false })]).multi_agency_rate).toBe(0); });
    it("child_views_rate 0 when all false", () => { expect(computeRadicalisationMetrics([makeRow({ child_views_obtained: false })]).child_views_rate).toBe(0); });
    it("family_engaged_rate 0 when all false", () => { expect(computeRadicalisationMetrics([makeRow({ family_engaged: false })]).family_engaged_rate).toBe(0); });
    it("safety_plan_rate 0 when all false", () => { expect(computeRadicalisationMetrics([makeRow({ safety_plan_in_place: false })]).safety_plan_rate).toBe(0); });
    it("ideology_challenged_rate 0 when all false", () => { expect(computeRadicalisationMetrics([makeRow({ ideology_challenged: false })]).ideology_challenged_rate).toBe(0); });

    // Mixed rates
    it("mixed boolean rate calculates correctly (2 of 3)", () => {
      const m = computeRadicalisationMetrics([
        makeRow({ safety_plan_in_place: true }),
        makeRow({ safety_plan_in_place: false }),
        makeRow({ safety_plan_in_place: true }),
      ]);
      expect(m.safety_plan_rate).toBe(66.7);
    });
    it("mixed boolean rate calculates correctly (1 of 3)", () => {
      const m = computeRadicalisationMetrics([
        makeRow({ prevent_training_completed: true }),
        makeRow({ prevent_training_completed: false }),
        makeRow({ prevent_training_completed: false }),
      ]);
      expect(m.prevent_training_rate).toBe(33.3);
    });
    it("mixed boolean rate 50 for 1 of 2", () => {
      const m = computeRadicalisationMetrics([
        makeRow({ family_engaged: true }),
        makeRow({ family_engaged: false }),
      ]);
      expect(m.family_engaged_rate).toBe(50);
    });

    // Unique children
    it("unique_children counts distinct child_name values", () => {
      const m = computeRadicalisationMetrics([
        makeRow({ child_name: "Alice" }),
        makeRow({ child_name: "Bob" }),
        makeRow({ child_name: "Alice" }),
      ]);
      expect(m.unique_children).toBe(2);
    });
    it("unique_children single child", () => { expect(computeRadicalisationMetrics([makeRow()]).unique_children).toBe(1); });
    it("unique_children 0 for empty", () => { expect(computeRadicalisationMetrics([]).unique_children).toBe(0); });

    // Breakdowns
    it("vulnerability_breakdown counts all 5 levels", () => {
      const levels = ["no_identified_risk", "low", "medium", "significant", "high"] as const;
      const rows = levels.map((l) => makeRow({ vulnerability_level: l }));
      const m = computeRadicalisationMetrics(rows);
      for (const l of levels) expect(m.vulnerability_breakdown[l]).toBe(1);
    });
    it("vulnerability_breakdown accumulates duplicates", () => {
      const m = computeRadicalisationMetrics([makeRow({ vulnerability_level: "high" }), makeRow({ vulnerability_level: "high" })]);
      expect(m.vulnerability_breakdown["high"]).toBe(2);
    });
    it("concern_type_breakdown counts all 8 types", () => {
      const types = ["far_right", "islamist", "incel", "eco_extremism", "single_issue", "online_radicalisation", "peer_influence", "mixed_ideology"] as const;
      const rows = types.map((t) => makeRow({ concern_type: t }));
      const m = computeRadicalisationMetrics(rows);
      for (const t of types) expect(m.concern_type_breakdown[t]).toBe(1);
    });
    it("concern_type_breakdown accumulates duplicates", () => {
      const m = computeRadicalisationMetrics([makeRow({ concern_type: "incel" }), makeRow({ concern_type: "incel" })]);
      expect(m.concern_type_breakdown["incel"]).toBe(2);
    });

    // Multiple rows aggregate
    it("multiple rows aggregate correctly", () => {
      const m = computeRadicalisationMetrics([
        makeRow({ vulnerability_level: "high", safety_plan_in_place: true, child_name: "A", assessment_status: "channel_active" }),
        makeRow({ vulnerability_level: "significant", safety_plan_in_place: false, child_name: "B", assessment_status: "monitoring" }),
        makeRow({ vulnerability_level: "low", safety_plan_in_place: true, child_name: "A", assessment_status: "closed" }),
        makeRow({ vulnerability_level: "medium", safety_plan_in_place: false, child_name: "C", assessment_status: "initial_screening" }),
      ]);
      expect(m.total_assessments).toBe(4);
      expect(m.high_risk_count).toBe(1);
      expect(m.significant_risk_count).toBe(1);
      expect(m.channel_active_count).toBe(1);
      expect(m.monitoring_count).toBe(1);
      expect(m.safety_plan_rate).toBe(50);
      expect(m.unique_children).toBe(3);
    });
  });

  // ── computeRadicalisationAlerts ──────────────────────────────────────
  describe("computeRadicalisationAlerts", () => {
    it("returns empty for empty", () => { expect(computeRadicalisationAlerts([])).toEqual([]); });
    it("returns empty for clean rows", () => { expect(computeRadicalisationAlerts([makeRow()])).toEqual([]); });

    // Critical: high_vulnerability_no_safety_plan
    it("fires high_vulnerability_no_safety_plan for high vulnerability without safety plan", () => {
      const a = computeRadicalisationAlerts([makeRow({ vulnerability_level: "high", safety_plan_in_place: false, child_name: "Jo" })]);
      const f = a.find((x) => x.type === "high_vulnerability_no_safety_plan");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("critical");
      expect(f!.message).toContain("Jo");
      expect(f!.message).toContain("high");
      expect(f!.record_id).toBeDefined();
    });
    it("does not fire high_vulnerability_no_safety_plan for significant vulnerability", () => {
      const a = computeRadicalisationAlerts([makeRow({ vulnerability_level: "significant", safety_plan_in_place: false })]);
      expect(a.find((x) => x.type === "high_vulnerability_no_safety_plan")).toBeUndefined();
    });
    it("does not fire high_vulnerability_no_safety_plan for medium vulnerability", () => {
      const a = computeRadicalisationAlerts([makeRow({ vulnerability_level: "medium", safety_plan_in_place: false })]);
      expect(a.find((x) => x.type === "high_vulnerability_no_safety_plan")).toBeUndefined();
    });
    it("does not fire high_vulnerability_no_safety_plan when safety plan in place", () => {
      const a = computeRadicalisationAlerts([makeRow({ vulnerability_level: "high", safety_plan_in_place: true })]);
      expect(a.find((x) => x.type === "high_vulnerability_no_safety_plan")).toBeUndefined();
    });
    it("high_vulnerability_no_safety_plan fires per-record", () => {
      const a = computeRadicalisationAlerts([
        makeRow({ id: "a-1", vulnerability_level: "high", safety_plan_in_place: false }),
        makeRow({ id: "a-2", vulnerability_level: "high", safety_plan_in_place: false }),
      ]);
      expect(a.filter((x) => x.type === "high_vulnerability_no_safety_plan")).toHaveLength(2);
    });
    it("high_vulnerability_no_safety_plan includes record_id", () => {
      const a = computeRadicalisationAlerts([makeRow({ id: "rec-1", vulnerability_level: "high", safety_plan_in_place: false })]);
      expect(a.find((x) => x.type === "high_vulnerability_no_safety_plan")!.record_id).toBe("rec-1");
    });

    // Critical: high_vulnerability_no_channel_referral
    it("fires high_vulnerability_no_channel_referral for high vulnerability without channel referral", () => {
      const a = computeRadicalisationAlerts([makeRow({ vulnerability_level: "high", channel_referral_made: false, child_name: "Sam" })]);
      const f = a.find((x) => x.type === "high_vulnerability_no_channel_referral");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("critical");
      expect(f!.message).toContain("Sam");
      expect(f!.message).toContain("Channel");
      expect(f!.record_id).toBeDefined();
    });
    it("does not fire high_vulnerability_no_channel_referral when channel referral made", () => {
      const a = computeRadicalisationAlerts([makeRow({ vulnerability_level: "high", channel_referral_made: true })]);
      expect(a.find((x) => x.type === "high_vulnerability_no_channel_referral")).toBeUndefined();
    });
    it("does not fire high_vulnerability_no_channel_referral for significant vulnerability", () => {
      const a = computeRadicalisationAlerts([makeRow({ vulnerability_level: "significant", channel_referral_made: false })]);
      expect(a.find((x) => x.type === "high_vulnerability_no_channel_referral")).toBeUndefined();
    });
    it("does not fire high_vulnerability_no_channel_referral for low vulnerability", () => {
      const a = computeRadicalisationAlerts([makeRow({ vulnerability_level: "low", channel_referral_made: false })]);
      expect(a.find((x) => x.type === "high_vulnerability_no_channel_referral")).toBeUndefined();
    });
    it("high_vulnerability_no_channel_referral fires per-record", () => {
      const a = computeRadicalisationAlerts([
        makeRow({ id: "b-1", vulnerability_level: "high", channel_referral_made: false }),
        makeRow({ id: "b-2", vulnerability_level: "high", channel_referral_made: false }),
      ]);
      expect(a.filter((x) => x.type === "high_vulnerability_no_channel_referral")).toHaveLength(2);
    });

    // High: significant_no_multi_agency
    it("fires significant_no_multi_agency for significant vulnerability without multi-agency", () => {
      const a = computeRadicalisationAlerts([makeRow({ vulnerability_level: "significant", multi_agency_involved: false, child_name: "Amy" })]);
      const f = a.find((x) => x.type === "significant_no_multi_agency");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("Amy");
    });
    it("does not fire significant_no_multi_agency for high vulnerability", () => {
      const a = computeRadicalisationAlerts([makeRow({ vulnerability_level: "high", multi_agency_involved: false })]);
      expect(a.find((x) => x.type === "significant_no_multi_agency")).toBeUndefined();
    });
    it("does not fire significant_no_multi_agency for medium vulnerability", () => {
      const a = computeRadicalisationAlerts([makeRow({ vulnerability_level: "medium", multi_agency_involved: false })]);
      expect(a.find((x) => x.type === "significant_no_multi_agency")).toBeUndefined();
    });
    it("does not fire significant_no_multi_agency when multi-agency involved", () => {
      const a = computeRadicalisationAlerts([makeRow({ vulnerability_level: "significant", multi_agency_involved: true })]);
      expect(a.find((x) => x.type === "significant_no_multi_agency")).toBeUndefined();
    });
    it("significant_no_multi_agency fires per-record", () => {
      const a = computeRadicalisationAlerts([
        makeRow({ id: "c-1", vulnerability_level: "significant", multi_agency_involved: false }),
        makeRow({ id: "c-2", vulnerability_level: "significant", multi_agency_involved: false }),
      ]);
      expect(a.filter((x) => x.type === "significant_no_multi_agency")).toHaveLength(2);
    });
    it("significant_no_multi_agency includes record_id", () => {
      const a = computeRadicalisationAlerts([makeRow({ id: "rec-3", vulnerability_level: "significant", multi_agency_involved: false })]);
      expect(a.find((x) => x.type === "significant_no_multi_agency")!.record_id).toBe("rec-3");
    });

    // High: online_concern_no_monitoring
    it("fires online_concern_no_monitoring for online_radicalisation concern without monitoring", () => {
      const a = computeRadicalisationAlerts([makeRow({ concern_type: "online_radicalisation", online_activity_monitored: false, child_name: "Lee" })]);
      const f = a.find((x) => x.type === "online_concern_no_monitoring");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("Lee");
    });
    it("does not fire online_concern_no_monitoring when monitoring in place", () => {
      const a = computeRadicalisationAlerts([makeRow({ concern_type: "online_radicalisation", online_activity_monitored: true })]);
      expect(a.find((x) => x.type === "online_concern_no_monitoring")).toBeUndefined();
    });
    it("does not fire online_concern_no_monitoring for non-online concern type", () => {
      const a = computeRadicalisationAlerts([makeRow({ concern_type: "far_right", online_activity_monitored: false })]);
      expect(a.find((x) => x.type === "online_concern_no_monitoring")).toBeUndefined();
    });
    it("does not fire online_concern_no_monitoring for islamist concern type", () => {
      const a = computeRadicalisationAlerts([makeRow({ concern_type: "islamist", online_activity_monitored: false })]);
      expect(a.find((x) => x.type === "online_concern_no_monitoring")).toBeUndefined();
    });
    it("online_concern_no_monitoring fires per-record", () => {
      const a = computeRadicalisationAlerts([
        makeRow({ id: "d-1", concern_type: "online_radicalisation", online_activity_monitored: false }),
        makeRow({ id: "d-2", concern_type: "online_radicalisation", online_activity_monitored: false }),
      ]);
      expect(a.filter((x) => x.type === "online_concern_no_monitoring")).toHaveLength(2);
    });
    it("online_concern_no_monitoring includes record_id", () => {
      const a = computeRadicalisationAlerts([makeRow({ id: "rec-4", concern_type: "online_radicalisation", online_activity_monitored: false })]);
      expect(a.find((x) => x.type === "online_concern_no_monitoring")!.record_id).toBe("rec-4");
    });

    // Medium: child_views_not_obtained
    it("fires child_views_not_obtained when views not obtained", () => {
      const a = computeRadicalisationAlerts([makeRow({ child_views_obtained: false, child_name: "Kai" })]);
      const f = a.find((x) => x.type === "child_views_not_obtained");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("medium");
      expect(f!.message).toContain("Kai");
    });
    it("does not fire child_views_not_obtained when views obtained", () => {
      const a = computeRadicalisationAlerts([makeRow({ child_views_obtained: true })]);
      expect(a.find((x) => x.type === "child_views_not_obtained")).toBeUndefined();
    });
    it("child_views_not_obtained fires per-record", () => {
      const a = computeRadicalisationAlerts([
        makeRow({ id: "e-1", child_views_obtained: false }),
        makeRow({ id: "e-2", child_views_obtained: false }),
      ]);
      expect(a.filter((x) => x.type === "child_views_not_obtained")).toHaveLength(2);
    });
    it("child_views_not_obtained includes record_id", () => {
      const a = computeRadicalisationAlerts([makeRow({ id: "rec-5", child_views_obtained: false })]);
      expect(a.find((x) => x.type === "child_views_not_obtained")!.record_id).toBe("rec-5");
    });

    // Medium: prevent_training_not_completed
    it("fires prevent_training_not_completed when training not completed", () => {
      const a = computeRadicalisationAlerts([makeRow({ prevent_training_completed: false, child_name: "Mia" })]);
      const f = a.find((x) => x.type === "prevent_training_not_completed");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("medium");
      expect(f!.message).toContain("Mia");
    });
    it("does not fire prevent_training_not_completed when training completed", () => {
      const a = computeRadicalisationAlerts([makeRow({ prevent_training_completed: true })]);
      expect(a.find((x) => x.type === "prevent_training_not_completed")).toBeUndefined();
    });
    it("prevent_training_not_completed fires per-record", () => {
      const a = computeRadicalisationAlerts([
        makeRow({ id: "f-1", prevent_training_completed: false }),
        makeRow({ id: "f-2", prevent_training_completed: false }),
      ]);
      expect(a.filter((x) => x.type === "prevent_training_not_completed")).toHaveLength(2);
    });
    it("prevent_training_not_completed includes record_id", () => {
      const a = computeRadicalisationAlerts([makeRow({ id: "rec-6", prevent_training_completed: false })]);
      expect(a.find((x) => x.type === "prevent_training_not_completed")!.record_id).toBe("rec-6");
    });

    // Multiple alerts simultaneously
    it("fires multiple alert types simultaneously", () => {
      const a = computeRadicalisationAlerts([
        makeRow({
          vulnerability_level: "high",
          safety_plan_in_place: false,
          channel_referral_made: false,
          concern_type: "online_radicalisation",
          online_activity_monitored: false,
          child_views_obtained: false,
          prevent_training_completed: false,
        }),
      ]);
      const types = a.map((x) => x.type);
      expect(types).toContain("high_vulnerability_no_safety_plan");
      expect(types).toContain("high_vulnerability_no_channel_referral");
      expect(types).toContain("online_concern_no_monitoring");
      expect(types).toContain("child_views_not_obtained");
      expect(types).toContain("prevent_training_not_completed");
    });
    it("does not fire significant_no_multi_agency for high vulnerability (only checks significant)", () => {
      const a = computeRadicalisationAlerts([
        makeRow({ vulnerability_level: "high", multi_agency_involved: false }),
      ]);
      expect(a.find((x) => x.type === "significant_no_multi_agency")).toBeUndefined();
    });
    it("does not fire alerts for well-managed low-risk row", () => {
      const a = computeRadicalisationAlerts([makeRow({
        vulnerability_level: "low",
        safety_plan_in_place: true,
        channel_referral_made: true,
        multi_agency_involved: true,
        concern_type: "far_right",
        online_activity_monitored: true,
        child_views_obtained: true,
        prevent_training_completed: true,
      })]);
      expect(a).toEqual([]);
    });
    it("critical alerts have severity critical", () => {
      const a = computeRadicalisationAlerts([makeRow({ vulnerability_level: "high", safety_plan_in_place: false })]);
      const critical = a.filter((x) => x.severity === "critical");
      expect(critical.length).toBeGreaterThan(0);
    });
    it("high alerts have severity high", () => {
      const a = computeRadicalisationAlerts([makeRow({ vulnerability_level: "significant", multi_agency_involved: false })]);
      const high = a.filter((x) => x.severity === "high");
      expect(high.length).toBeGreaterThan(0);
    });
    it("medium alerts have severity medium", () => {
      const a = computeRadicalisationAlerts([makeRow({ child_views_obtained: false })]);
      const medium = a.filter((x) => x.severity === "medium");
      expect(medium.length).toBeGreaterThan(0);
    });

    // Edge: no_identified_risk with all booleans false still fires medium alerts
    it("no_identified_risk with missing training fires medium alert", () => {
      const a = computeRadicalisationAlerts([makeRow({ vulnerability_level: "no_identified_risk", prevent_training_completed: false })]);
      expect(a.find((x) => x.type === "prevent_training_not_completed")).toBeDefined();
    });
  });

  // ── generateRadicalisationCaraInsights ────────────────────────────────
  describe("generateRadicalisationCaraInsights", () => {
    it("returns 3 insights for empty data", () => {
      const insights = generateRadicalisationCaraInsights([]);
      expect(insights).toHaveLength(3);
    });
    it("returns 3 insights for populated data", () => {
      const insights = generateRadicalisationCaraInsights([makeRow(), makeRow()]);
      expect(insights).toHaveLength(3);
    });
    it("insight 1 starts with [red]", () => {
      expect(generateRadicalisationCaraInsights([])[0]).toMatch(/^\[red\]/);
    });
    it("insight 2 starts with [amber]", () => {
      expect(generateRadicalisationCaraInsights([])[1]).toMatch(/^\[amber\]/);
    });
    it("insight 3 starts with [reflect]", () => {
      expect(generateRadicalisationCaraInsights([])[2]).toMatch(/^\[reflect\]/);
    });
    it("insight 1 contains total assessments count", () => {
      const insights = generateRadicalisationCaraInsights([makeRow(), makeRow()]);
      expect(insights[0]).toContain("2 radicalisation prevention assessments");
    });
    it("insight 1 contains unique children count", () => {
      const insights = generateRadicalisationCaraInsights([makeRow({ child_name: "A" }), makeRow({ child_name: "B" })]);
      expect(insights[0]).toContain("2 children");
    });
    it("insight 1 uses singular child for 1", () => {
      const insights = generateRadicalisationCaraInsights([makeRow()]);
      expect(insights[0]).toContain("1 child");
    });
    it("insight 1 contains high risk breakdown", () => {
      const insights = generateRadicalisationCaraInsights([
        makeRow({ vulnerability_level: "significant" }),
        makeRow({ vulnerability_level: "high" }),
      ]);
      expect(insights[0]).toContain("1 significant");
      expect(insights[0]).toContain("1 high");
    });
    it("insight 1 contains channel active count", () => {
      const insights = generateRadicalisationCaraInsights([makeRow({ assessment_status: "channel_active" })]);
      expect(insights[0]).toContain("1 Channel case active");
    });
    it("insight 1 uses plural cases for multiple channel active", () => {
      const insights = generateRadicalisationCaraInsights([
        makeRow({ assessment_status: "channel_active" }),
        makeRow({ assessment_status: "channel_active" }),
      ]);
      expect(insights[0]).toContain("2 Channel cases active");
    });
    it("insight 1 contains monitoring count", () => {
      const insights = generateRadicalisationCaraInsights([makeRow({ assessment_status: "monitoring" })]);
      expect(insights[0]).toContain("1 in monitoring");
    });
    it("insight 1 contains prevent training rate", () => {
      const insights = generateRadicalisationCaraInsights([makeRow({ prevent_training_completed: true })]);
      expect(insights[0]).toContain("100%");
    });
    it("insight 2 mentions critical and high alert counts when present", () => {
      const rows = [
        makeRow({ vulnerability_level: "high", safety_plan_in_place: false, channel_referral_made: false }),
      ];
      const insights = generateRadicalisationCaraInsights(rows);
      expect(insights[1]).toContain("critical");
      expect(insights[1]).toContain("high-priority");
    });
    it("insight 2 shows no concerns when none", () => {
      const insights = generateRadicalisationCaraInsights([makeRow()]);
      expect(insights[1]).toContain("No critical or high-priority concerns");
    });
    it("insight 2 contains safety plan rate", () => {
      const insights = generateRadicalisationCaraInsights([makeRow()]);
      expect(insights[1]).toContain("Safety plan rate");
    });
    it("insight 2 contains channel referral rate", () => {
      const insights = generateRadicalisationCaraInsights([makeRow()]);
      expect(insights[1]).toContain("Channel referral rate");
    });
    it("insight 2 contains child views rate", () => {
      const insights = generateRadicalisationCaraInsights([makeRow()]);
      expect(insights[1]).toContain("Child views rate");
    });
    it("insight 3 contains reflective question about vulnerability assessments", () => {
      const insights = generateRadicalisationCaraInsights([]);
      expect(insights[2]).toContain("vulnerability assessments");
    });
    it("insight 3 mentions family engagement", () => {
      const insights = generateRadicalisationCaraInsights([]);
      expect(insights[2]).toContain("family engagement");
    });
    it("insight 3 mentions multi-agency", () => {
      const insights = generateRadicalisationCaraInsights([]);
      expect(insights[2]).toContain("multi-agency");
    });
    it("all insights are strings", () => {
      const insights = generateRadicalisationCaraInsights([makeRow()]);
      for (const i of insights) expect(typeof i).toBe("string");
    });
    it("empty array still produces meaningful content", () => {
      const insights = generateRadicalisationCaraInsights([]);
      expect(insights[0]).toContain("0 radicalisation prevention assessments");
      expect(insights[0]).toContain("0 children");
    });
    it("insight 1 for zero assessments shows 0 significant and 0 high", () => {
      const insights = generateRadicalisationCaraInsights([]);
      expect(insights[0]).toContain("0 significant");
      expect(insights[0]).toContain("0 high");
    });
    it("insight 2 with only medium alerts shows no critical or high", () => {
      const rows = [makeRow({ child_views_obtained: false, prevent_training_completed: false })];
      const insights = generateRadicalisationCaraInsights(rows);
      expect(insights[1]).toContain("No critical or high-priority concerns");
    });
    it("insight 3 mentions child voice", () => {
      const insights = generateRadicalisationCaraInsights([]);
      expect(insights[2]).toContain("voice");
    });
  });
});
