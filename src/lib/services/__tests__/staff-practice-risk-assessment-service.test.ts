import { describe, it, expect } from "vitest";
import { _testing, type StaffPracticeRiskAssessmentRecord } from "../staff-practice-risk-assessment-service";
import { todayStr } from "@/lib/utils";

const { computePracticeRiskMetrics, identifyPracticeRiskAlerts } = _testing;

const now = new Date(todayStr());

function makeRecord(overrides?: Partial<StaffPracticeRiskAssessmentRecord>): StaffPracticeRiskAssessmentRecord {
  return {
    id: overrides?.id ?? "a-1",
    home_id: overrides?.home_id ?? "home-1",
    risk_area: overrides?.risk_area ?? "boundaries",
    likelihood: overrides?.likelihood ?? "possible",
    impact_severity: overrides?.impact_severity ?? "moderate",
    assessment_status: overrides?.assessment_status ?? "active",
    session_date: overrides?.session_date ?? todayStr(),
    staff_name: overrides?.staff_name ?? "Staff A",
    assessed_by: overrides?.assessed_by ?? "Manager A",
    identified_concern: overrides?.identified_concern ?? "Test concern",
    evidence_summary: overrides?.evidence_summary ?? "Test evidence",
    staff_id: "staff_id" in (overrides ?? {}) ? (overrides!.staff_id ?? null) : null,
    children_affected: "children_affected" in (overrides ?? {}) ? (overrides!.children_affected ?? null) : null,
    protective_factors: "protective_factors" in (overrides ?? {}) ? (overrides!.protective_factors ?? null) : null,
    support_controls: "support_controls" in (overrides ?? {}) ? (overrides!.support_controls ?? null) : null,
    management_controls: "management_controls" in (overrides ?? {}) ? (overrides!.management_controls ?? null) : null,
    restrictions: "restrictions" in (overrides ?? {}) ? (overrides!.restrictions ?? null) : null,
    decision_rationale: "decision_rationale" in (overrides ?? {}) ? (overrides!.decision_rationale ?? null) : null,
    staff_comment: "staff_comment" in (overrides ?? {}) ? (overrides!.staff_comment ?? null) : null,
    approved_by: "approved_by" in (overrides ?? {}) ? (overrides!.approved_by ?? null) : null,
    approved_at: "approved_at" in (overrides ?? {}) ? (overrides!.approved_at ?? null) : null,
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    evidence_verified: overrides?.evidence_verified ?? true,
    staff_notified: overrides?.staff_notified ?? true,
    staff_commented: overrides?.staff_commented ?? true,
    protective_factors_identified: overrides?.protective_factors_identified ?? true,
    support_controls_set: overrides?.support_controls_set ?? true,
    management_controls_set: overrides?.management_controls_set ?? true,
    review_date_set: overrides?.review_date_set ?? true,
    approved_by_senior: overrides?.approved_by_senior ?? true,
    children_safeguarded: overrides?.children_safeguarded ?? true,
    alternative_explanations_considered: overrides?.alternative_explanations_considered ?? true,
    proportionate_response: overrides?.proportionate_response ?? true,
    recorded_promptly: overrides?.recorded_promptly ?? true,
    issues_found: overrides?.issues_found ?? [],
    actions_taken: overrides?.actions_taken ?? [],
    created_at: overrides?.created_at ?? now.toISOString(),
    updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

// ── computePracticeRiskMetrics ────────────────────────────────────────

describe("computePracticeRiskMetrics", () => {
  it("returns zeros for empty", () => {
    const m = computePracticeRiskMetrics([]);
    expect(m.total_assessments).toBe(0);
    expect(m.high_risk_count).toBe(0);
    expect(m.severe_impact_count).toBe(0);
    expect(m.active_count).toBe(0);
    expect(m.unapproved_count).toBe(0);
    expect(m.evidence_verified_rate).toBeNull();;
    expect(m.unique_staff).toBe(0);
  });

  it("returns empty breakdowns", () => {
    const m = computePracticeRiskMetrics([]);
    expect(m.by_risk_area).toEqual({});
    expect(m.by_likelihood).toEqual({});
    expect(m.by_impact_severity).toEqual({});
    expect(m.by_assessment_status).toEqual({});
  });

  it("total_assessments counts records", () => { expect(computePracticeRiskMetrics([makeRecord(), makeRecord({ id: "a-2" })]).total_assessments).toBe(2); });

  it("counts likely as high_risk", () => { expect(computePracticeRiskMetrics([makeRecord({ likelihood: "likely" })]).high_risk_count).toBe(1); });

  it("counts very_likely as high_risk", () => { expect(computePracticeRiskMetrics([makeRecord({ likelihood: "very_likely" })]).high_risk_count).toBe(1); });

  it("does not count possible as high_risk", () => { expect(computePracticeRiskMetrics([makeRecord({ likelihood: "possible" })]).high_risk_count).toBe(0); });

  it("counts major as severe_impact", () => { expect(computePracticeRiskMetrics([makeRecord({ impact_severity: "major" })]).severe_impact_count).toBe(1); });

  it("counts severe as severe_impact", () => { expect(computePracticeRiskMetrics([makeRecord({ impact_severity: "severe" })]).severe_impact_count).toBe(1); });

  it("does not count moderate as severe_impact", () => { expect(computePracticeRiskMetrics([makeRecord({ impact_severity: "moderate" })]).severe_impact_count).toBe(0); });

  it("counts active", () => { expect(computePracticeRiskMetrics([makeRecord({ assessment_status: "active" })]).active_count).toBe(1); });

  it("counts unapproved (approved_by_senior false)", () => { expect(computePracticeRiskMetrics([makeRecord({ approved_by_senior: false })]).unapproved_count).toBe(1); });

  it("returns 100% boolean rates with defaults", () => {
    const m = computePracticeRiskMetrics([makeRecord()]);
    expect(m.evidence_verified_rate).toBe(100);
    expect(m.staff_notified_rate).toBe(100);
    expect(m.staff_commented_rate).toBe(100);
    expect(m.protective_factors_rate).toBe(100);
    expect(m.support_controls_rate).toBe(100);
    expect(m.management_controls_rate).toBe(100);
    expect(m.review_date_rate).toBe(100);
    expect(m.approved_rate).toBe(100);
    expect(m.children_safeguarded_rate).toBe(100);
    expect(m.alternatives_considered_rate).toBe(100);
    expect(m.proportionate_rate).toBe(100);
    expect(m.recorded_promptly_rate).toBe(100);
  });

  it("evidence_verified_rate 0 when false", () => { expect(computePracticeRiskMetrics([makeRecord({ evidence_verified: false })]).evidence_verified_rate).toBe(0); });

  it("mixed boolean rate", () => { expect(computePracticeRiskMetrics([makeRecord({ id: "a-1" }), makeRecord({ id: "a-2" }), makeRecord({ id: "a-3", proportionate_response: false })]).proportionate_rate).toBe(66.7); });

  it("unique_staff distinct", () => { expect(computePracticeRiskMetrics([makeRecord({ staff_name: "A" }), makeRecord({ id: "a-2", staff_name: "B" }), makeRecord({ id: "a-3", staff_name: "A" })]).unique_staff).toBe(2); });

  it("counts all 10 risk areas", () => {
    const areas = ["lone_working", "medication", "driving", "allegations", "boundaries", "child_conflict", "repeated_errors", "emotional_resilience", "unsafe_practice", "stress_sickness"] as const;
    const recs = areas.map((a, i) => makeRecord({ id: `a-${i}`, risk_area: a }));
    const m = computePracticeRiskMetrics(recs);
    for (const a of areas) expect(m.by_risk_area[a]).toBe(1);
  });

  it("counts all 5 likelihoods", () => {
    const vals = ["very_unlikely", "unlikely", "possible", "likely", "very_likely"] as const;
    const recs = vals.map((v, i) => makeRecord({ id: `a-${i}`, likelihood: v }));
    const m = computePracticeRiskMetrics(recs);
    for (const v of vals) expect(m.by_likelihood[v]).toBe(1);
  });

  it("counts all 5 impact severities", () => {
    const vals = ["minimal", "minor", "moderate", "major", "severe"] as const;
    const recs = vals.map((v, i) => makeRecord({ id: `a-${i}`, impact_severity: v }));
    const m = computePracticeRiskMetrics(recs);
    for (const v of vals) expect(m.by_impact_severity[v]).toBe(1);
  });

  it("counts all 5 assessment statuses", () => {
    const vals = ["draft", "active", "under_review", "closed", "superseded"] as const;
    const recs = vals.map((v, i) => makeRecord({ id: `a-${i}`, assessment_status: v }));
    const m = computePracticeRiskMetrics(recs);
    for (const v of vals) expect(m.by_assessment_status[v]).toBe(1);
  });
});

// ── identifyPracticeRiskAlerts ────────────────────────────────────────

describe("identifyPracticeRiskAlerts", () => {
  it("returns empty for clean", () => { expect(identifyPracticeRiskAlerts([makeRecord()])).toEqual([]); });

  it("returns empty for empty", () => { expect(identifyPracticeRiskAlerts([])).toEqual([]); });

  it("fires high_risk_severe_impact for likely + major", () => {
    const alerts = identifyPracticeRiskAlerts([makeRecord({ likelihood: "likely", impact_severity: "major", staff_name: "Jo" })]);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].type).toBe("high_risk_severe_impact");
    expect(alerts[0].severity).toBe("critical");
    expect(alerts[0].message).toContain("Jo");
  });

  it("fires for very_likely + severe", () => {
    const alerts = identifyPracticeRiskAlerts([makeRecord({ likelihood: "very_likely", impact_severity: "severe" })]);
    expect(alerts[0].severity).toBe("critical");
  });

  it("high_risk_severe_impact per-record", () => {
    const alerts = identifyPracticeRiskAlerts([makeRecord({ id: "a-1", likelihood: "likely", impact_severity: "major" }), makeRecord({ id: "a-2", likelihood: "very_likely", impact_severity: "severe" })]);
    const critical = alerts.filter((a) => a.type === "high_risk_severe_impact");
    expect(critical).toHaveLength(2);
  });

  it("no critical when possible + major", () => {
    const alerts = identifyPracticeRiskAlerts([makeRecord({ likelihood: "possible", impact_severity: "major" })]);
    expect(alerts.filter((a) => a.type === "high_risk_severe_impact")).toHaveLength(0);
  });

  it("no critical when likely + moderate", () => {
    const alerts = identifyPracticeRiskAlerts([makeRecord({ likelihood: "likely", impact_severity: "moderate" })]);
    expect(alerts.filter((a) => a.type === "high_risk_severe_impact")).toHaveLength(0);
  });

  it("fires staff_not_notified singular", () => {
    const alerts = identifyPracticeRiskAlerts([makeRecord({ staff_notified: false })]);
    const a = alerts.find((x) => x.type === "staff_not_notified")!;
    expect(a.severity).toBe("high");
    expect(a.message).toContain("1 assessment has");
  });

  it("staff_not_notified plural", () => {
    const alerts = identifyPracticeRiskAlerts([makeRecord({ id: "a-1", staff_notified: false }), makeRecord({ id: "a-2", staff_notified: false })]);
    const a = alerts.find((x) => x.type === "staff_not_notified")!;
    expect(a.message).toContain("2 assessments have");
  });

  it("fires children_not_safeguarded singular", () => {
    const alerts = identifyPracticeRiskAlerts([makeRecord({ children_safeguarded: false })]);
    const a = alerts.find((x) => x.type === "children_not_safeguarded")!;
    expect(a.severity).toBe("high");
    expect(a.message).toContain("1 assessment has");
  });

  it("no_protective_factors not for 1", () => {
    const alerts = identifyPracticeRiskAlerts([makeRecord({ protective_factors_identified: false })]);
    expect(alerts.filter((a) => a.type === "no_protective_factors")).toHaveLength(0);
  });

  it("no_protective_factors fires for 2", () => {
    const alerts = identifyPracticeRiskAlerts([makeRecord({ id: "a-1", protective_factors_identified: false }), makeRecord({ id: "a-2", protective_factors_identified: false })]);
    expect(alerts.find((a) => a.type === "no_protective_factors")!.severity).toBe("medium");
  });

  it("not_proportionate not for 1", () => {
    const alerts = identifyPracticeRiskAlerts([makeRecord({ proportionate_response: false })]);
    expect(alerts.filter((a) => a.type === "not_proportionate")).toHaveLength(0);
  });

  it("not_proportionate fires for 2", () => {
    const alerts = identifyPracticeRiskAlerts([makeRecord({ id: "a-1", proportionate_response: false }), makeRecord({ id: "a-2", proportionate_response: false })]);
    expect(alerts.find((a) => a.type === "not_proportionate")!.severity).toBe("medium");
  });

  it("fires all applicable", () => {
    const shared = { staff_notified: false, children_safeguarded: false, protective_factors_identified: false, proportionate_response: false } as const;
    const alerts = identifyPracticeRiskAlerts([makeRecord({ id: "a-1", likelihood: "likely", impact_severity: "major", ...shared }), makeRecord({ id: "a-2", ...shared })]);
    const types = alerts.map((a) => a.type);
    expect(types).toContain("high_risk_severe_impact");
    expect(types).toContain("staff_not_notified");
    expect(types).toContain("children_not_safeguarded");
    expect(types).toContain("no_protective_factors");
    expect(types).toContain("not_proportionate");
  });
});
