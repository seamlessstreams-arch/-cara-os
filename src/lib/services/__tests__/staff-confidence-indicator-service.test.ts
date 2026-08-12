// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF CONFIDENCE INDICATOR SERVICE TESTS
// Pure-function unit tests for confidence indicator metrics computation and
// alert identification.
// CHR 2015 Reg 33 (monitoring the home), Reg 34 (employment of staff),
// Reg 13 (leadership and management), Reg 35 (behaviour management).
//
// Covers: confidence tracking, practice area breakdowns, trend analysis,
// boolean compliance rates, and alert generation.
//
// SCCIF: Well-Led — "Staff are confident in their roles and supported
// to develop."
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing, type StaffConfidenceIndicatorRecord } from "../staff-confidence-indicator-service";
import { todayStr } from "@/lib/utils";

const { computeConfidenceIndicatorMetrics, identifyConfidenceIndicatorAlerts } = _testing;

const now = new Date(todayStr());

// ── Helpers ────────────────────────────────────────────────────────────────

function makeRecord(overrides?: Partial<StaffConfidenceIndicatorRecord>): StaffConfidenceIndicatorRecord {
  return {
    id: "a-1",
    home_id: "home-1",
    practice_area: "communication",
    confidence_level: "confident",
    trend_direction: "stable",
    assessment_source: "supervision_observation",
    session_date: todayStr(),
    staff_name: "Staff A",
    assessed_by: "Manager A",
    confidence_description: "Test description",
    evidence_basis: "Test evidence",
    staff_id: "staff_id" in (overrides ?? {}) ? (overrides!.staff_id ?? null) : null,
    strengths_observed: "strengths_observed" in (overrides ?? {}) ? (overrides!.strengths_observed ?? null) : null,
    development_needs: "development_needs" in (overrides ?? {}) ? (overrides!.development_needs ?? null) : null,
    support_provided: "support_provided" in (overrides ?? {}) ? (overrides!.support_provided ?? null) : null,
    training_linked: "training_linked" in (overrides ?? {}) ? (overrides!.training_linked ?? null) : null,
    staff_self_reflection: "staff_self_reflection" in (overrides ?? {}) ? (overrides!.staff_self_reflection ?? null) : null,
    manager_observation: "manager_observation" in (overrides ?? {}) ? (overrides!.manager_observation ?? null) : null,
    previous_confidence_level: "previous_confidence_level" in (overrides ?? {}) ? (overrides!.previous_confidence_level ?? null) : null,
    barriers_to_confidence: "barriers_to_confidence" in (overrides ?? {}) ? (overrides!.barriers_to_confidence ?? null) : null,
    approved_by: "approved_by" in (overrides ?? {}) ? (overrides!.approved_by ?? null) : null,
    approved_at: "approved_at" in (overrides ?? {}) ? (overrides!.approved_at ?? null) : null,
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    evidence_based: true,
    staff_self_assessed: true,
    manager_validated: true,
    strengths_discussed: true,
    development_plan_linked: true,
    training_identified: true,
    mentoring_offered: true,
    supervision_discussed: true,
    wellbeing_considered: true,
    progress_tracked: true,
    staff_agreed: true,
    recorded_promptly: true,
    issues_found: [],
    actions_taken: [],
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    ...overrides,
  };
}

// ── computeConfidenceIndicatorMetrics ──────────────────────────────────────

describe("computeConfidenceIndicatorMetrics", () => {
  it("returns zeros for empty", () => { 
    const m = computeConfidenceIndicatorMetrics([]);
    expect(m.total_indicators).toBe(0);;
    expect(m.low_confidence_count).toBe(0);
    expect(m.declining_count).toBe(0);
    expect(m.no_confidence_count).toBe(0);
    expect(m.improving_count).toBe(0);
    expect(m.evidence_based_rate).toBeNull();;
    expect(m.unique_staff).toBe(0);
  });

  it("returns empty breakdowns", () => { 
    const m = computeConfidenceIndicatorMetrics([]);
    expect(m.by_practice_area).toEqual({});
    expect(m.by_confidence_level).toEqual({});
    expect(m.by_trend_direction).toEqual({});
    expect(m.by_assessment_source).toEqual({});
  });

  it("total_indicators counts records", () => { const m = computeConfidenceIndicatorMetrics([makeRecord({ id: "a-1" }), makeRecord({ id: "a-2" })]); expect(m.total_indicators).toBe(2); });

  it("counts low_confidence", () => { const m = computeConfidenceIndicatorMetrics([makeRecord({ confidence_level: "low_confidence" })]); expect(m.low_confidence_count).toBe(1); });

  it("counts no_confidence as low_confidence", () => { const m = computeConfidenceIndicatorMetrics([makeRecord({ confidence_level: "no_confidence" })]); expect(m.low_confidence_count).toBe(1); });

  it("does not count developing as low", () => { const m = computeConfidenceIndicatorMetrics([makeRecord({ confidence_level: "developing" })]); expect(m.low_confidence_count).toBe(0); });

  it("counts declining", () => { const m = computeConfidenceIndicatorMetrics([makeRecord({ trend_direction: "declining" })]); expect(m.declining_count).toBe(1); });

  it("counts no_confidence_count", () => { const m = computeConfidenceIndicatorMetrics([makeRecord({ confidence_level: "no_confidence" })]); expect(m.no_confidence_count).toBe(1); });

  it("does not count low_confidence as no_confidence_count", () => { const m = computeConfidenceIndicatorMetrics([makeRecord({ confidence_level: "low_confidence" })]); expect(m.no_confidence_count).toBe(0); });

  it("counts improving", () => { const m = computeConfidenceIndicatorMetrics([makeRecord({ trend_direction: "improving" })]); expect(m.improving_count).toBe(1); });

  it("returns 100% boolean rates with defaults", () => { 
    const m = computeConfidenceIndicatorMetrics([makeRecord()]);
    expect(m.evidence_based_rate).toBe(100);
    expect(m.self_assessed_rate).toBe(100);
    expect(m.manager_validated_rate).toBe(100);
    expect(m.strengths_discussed_rate).toBe(100);
    expect(m.development_plan_rate).toBe(100);
    expect(m.training_identified_rate).toBe(100);
    expect(m.mentoring_offered_rate).toBe(100);
    expect(m.supervision_discussed_rate).toBe(100);
    expect(m.wellbeing_considered_rate).toBe(100);
    expect(m.progress_tracked_rate).toBe(100);
    expect(m.staff_agreed_rate).toBe(100);
    expect(m.recorded_promptly_rate).toBe(100);
  });

  it("evidence_based_rate 0 when false", () => { const m = computeConfidenceIndicatorMetrics([makeRecord({ evidence_based: false })]); expect(m.evidence_based_rate).toBe(0); });

  it("mixed boolean rate", () => { const m = computeConfidenceIndicatorMetrics([makeRecord({ id: "a-1", mentoring_offered: true }), makeRecord({ id: "a-2", mentoring_offered: true }), makeRecord({ id: "a-3", mentoring_offered: false })]); expect(m.mentoring_offered_rate).toBe(66.7); });

  it("unique_staff distinct", () => { const m = computeConfidenceIndicatorMetrics([makeRecord({ id: "a-1", staff_name: "Staff A" }), makeRecord({ id: "a-2", staff_name: "Staff B" }), makeRecord({ id: "a-3", staff_name: "Staff A" })]); expect(m.unique_staff).toBe(2); });

  it("counts all 10 practice areas", () => { const areas = ["de_escalation", "safeguarding", "medication", "recording", "care_planning", "communication", "child_engagement", "team_working", "lone_working", "professional_boundaries"] as const; const recs = areas.map((a, i) => makeRecord({ id: `a-${i}`, practice_area: a })); const m = computeConfidenceIndicatorMetrics(recs); for (const a of areas) expect(m.by_practice_area[a]).toBe(1); });

  it("counts all 5 confidence levels", () => { const levels = ["very_confident", "confident", "developing", "low_confidence", "no_confidence"] as const; const recs = levels.map((l, i) => makeRecord({ id: `a-${i}`, confidence_level: l })); const m = computeConfidenceIndicatorMetrics(recs); for (const l of levels) expect(m.by_confidence_level[l]).toBe(1); });

  it("counts all 5 trend directions", () => { const dirs = ["improving", "stable", "declining", "fluctuating", "new_assessment"] as const; const recs = dirs.map((d, i) => makeRecord({ id: `a-${i}`, trend_direction: d })); const m = computeConfidenceIndicatorMetrics(recs); for (const d of dirs) expect(m.by_trend_direction[d]).toBe(1); });

  it("counts all 10 assessment sources", () => { const sources = ["self_assessment", "supervision_observation", "peer_feedback", "manager_assessment", "training_evaluation", "incident_review", "child_feedback", "multi_source", "annual_review", "other"] as const; const recs = sources.map((s, i) => makeRecord({ id: `a-${i}`, assessment_source: s })); const m = computeConfidenceIndicatorMetrics(recs); for (const s of sources) expect(m.by_assessment_source[s]).toBe(1); });
});

// ── identifyConfidenceIndicatorAlerts ──────────────────────────────────────

describe("identifyConfidenceIndicatorAlerts", () => {
  it("returns empty for clean", () => { expect(identifyConfidenceIndicatorAlerts([makeRecord()])).toEqual([]); });

  it("returns empty for empty", () => { expect(identifyConfidenceIndicatorAlerts([])).toEqual([]); });

  it("fires no_confidence_declining", () => { 
    const alerts = identifyConfidenceIndicatorAlerts([makeRecord({ confidence_level: "no_confidence", trend_direction: "declining", staff_name: "Jo", practice_area: "safeguarding" })]);
    const a = alerts.find((x) => x.type === "no_confidence_declining");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("critical");
    expect(a!.message).toContain("Jo");
    expect(a!.message).toContain("safeguarding");
  });

  it("no critical when low_confidence + declining", () => { const alerts = identifyConfidenceIndicatorAlerts([makeRecord({ confidence_level: "low_confidence", trend_direction: "declining" })]); expect(alerts.filter((a) => a.severity === "critical")).toHaveLength(0); });

  it("no critical when no_confidence + stable", () => { const alerts = identifyConfidenceIndicatorAlerts([makeRecord({ confidence_level: "no_confidence", trend_direction: "stable" })]); expect(alerts.filter((a) => a.severity === "critical")).toHaveLength(0); });

  it("per-record", () => { const alerts = identifyConfidenceIndicatorAlerts([makeRecord({ id: "a-1", confidence_level: "no_confidence", trend_direction: "declining" }), makeRecord({ id: "a-2", confidence_level: "no_confidence", trend_direction: "declining" })]); expect(alerts.filter((a) => a.type === "no_confidence_declining")).toHaveLength(2); });

  it("fires low_confidence_no_support", () => { const alerts = identifyConfidenceIndicatorAlerts([makeRecord({ confidence_level: "low_confidence", development_plan_linked: false })]); const a = alerts.find((x) => x.type === "low_confidence_no_support"); expect(a).toBeDefined(); expect(a!.severity).toBe("high"); });

  it("fires for no_confidence + not linked", () => { const alerts = identifyConfidenceIndicatorAlerts([makeRecord({ confidence_level: "no_confidence", development_plan_linked: false })]); const a = alerts.find((x) => x.type === "low_confidence_no_support"); expect(a).toBeDefined(); expect(a!.severity).toBe("high"); });

  it("no high when low_confidence + linked", () => { const alerts = identifyConfidenceIndicatorAlerts([makeRecord({ confidence_level: "low_confidence", development_plan_linked: true })]); expect(alerts.filter((a) => a.type === "low_confidence_no_support")).toHaveLength(0); });

  it("fires no_strengths_discussed", () => { 
    const alerts = identifyConfidenceIndicatorAlerts([makeRecord({ strengths_discussed: false })]);
    const a = alerts.find((x) => x.type === "no_strengths_discussed");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("high");
    expect(a!.message).toContain("1 indicator has");
  });

  it("no_strengths_discussed plural", () => { const alerts = identifyConfidenceIndicatorAlerts([makeRecord({ id: "a-1", strengths_discussed: false }), makeRecord({ id: "a-2", strengths_discussed: false })]); const a = alerts.find((x) => x.type === "no_strengths_discussed"); expect(a!.message).toContain("2 indicators have"); });

  it("no_mentoring_offered not for 1", () => { const alerts = identifyConfidenceIndicatorAlerts([makeRecord({ mentoring_offered: false })]); expect(alerts.filter((a) => a.type === "no_mentoring_offered")).toHaveLength(0); });

  it("no_mentoring_offered fires for 2", () => { const alerts = identifyConfidenceIndicatorAlerts([makeRecord({ id: "a-1", mentoring_offered: false }), makeRecord({ id: "a-2", mentoring_offered: false })]); const a = alerts.find((x) => x.type === "no_mentoring_offered"); expect(a).toBeDefined(); expect(a!.severity).toBe("medium"); });

  it("no_wellbeing_considered not for 1", () => { const alerts = identifyConfidenceIndicatorAlerts([makeRecord({ wellbeing_considered: false })]); expect(alerts.filter((a) => a.type === "no_wellbeing_considered")).toHaveLength(0); });

  it("no_wellbeing_considered fires for 2", () => { const alerts = identifyConfidenceIndicatorAlerts([makeRecord({ id: "a-1", wellbeing_considered: false }), makeRecord({ id: "a-2", wellbeing_considered: false })]); const a = alerts.find((x) => x.type === "no_wellbeing_considered"); expect(a).toBeDefined(); expect(a!.severity).toBe("medium"); });
});
