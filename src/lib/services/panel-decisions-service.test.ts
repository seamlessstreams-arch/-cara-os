import { describe, it, expect } from "vitest";
import {
  computePanelMetrics,
  identifyPanelAlerts,
} from "./panel-decisions-service";
import type { PanelDecisionRecord } from "./panel-decisions-service";

// -- Factory ------------------------------------------------------------------

function makeRecord(overrides: Partial<PanelDecisionRecord> = {}): PanelDecisionRecord {
  return {
    id: "pd-1",
    home_id: "home-1",
    panel_type: "admission_panel",
    panel_date: "2026-05-10",
    panel_decision: "approved",
    panel_quorum: "full_quorum",
    follow_up_status: "all_completed",
    child_name: "Alex",
    child_id: "child-1",
    panel_chair: "Chair A",
    panel_members: ["Member A", "Member B"],
    child_views_considered: true,
    risk_assessment_reviewed: true,
    matching_criteria_assessed: true,
    impact_on_group_assessed: true,
    safeguarding_discussed: true,
    minutes_recorded: true,
    actions_agreed: ["Action 1"],
    conditions: [],
    follow_up_date: null,
    issues_found: [],
    actions_taken: [],
    notes: null,
    created_at: "2026-05-10T00:00:00Z",
    updated_at: "2026-05-10T00:00:00Z",
    ...overrides,
  };
}

// -- computePanelMetrics ------------------------------------------------------

describe("computePanelMetrics", () => {
  it("returns zeroes for empty records", () => {
    const m = computePanelMetrics([]);
    expect(m.total_panels).toBe(0);
    expect(m.admission_panel_count).toBe(0);
    expect(m.approved_rate).toBeNull();;
    expect(m.full_quorum_rate).toBeNull();;
    expect(m.child_views_considered_rate).toBeNull();;
    expect(m.follow_up_overdue_count).toBe(0);
    expect(m.unique_children).toBe(0);
  });

  it("counts panel types correctly", () => {
    const records = [
      makeRecord({ id: "1", panel_type: "admission_panel" }),
      makeRecord({ id: "2", panel_type: "matching_panel" }),
      makeRecord({ id: "3", panel_type: "disruption_meeting" }),
      makeRecord({ id: "4", panel_type: "discharge_panel" }),
      makeRecord({ id: "5", panel_type: "admission_panel" }),
    ];
    const m = computePanelMetrics(records);
    expect(m.admission_panel_count).toBe(2);
    expect(m.matching_panel_count).toBe(1);
    expect(m.disruption_meeting_count).toBe(1);
    expect(m.discharge_panel_count).toBe(1);
  });

  it("calculates approved rate", () => {
    const records = [
      makeRecord({ id: "1", panel_decision: "approved" }),
      makeRecord({ id: "2", panel_decision: "declined" }),
    ];
    const m = computePanelMetrics(records);
    expect(m.approved_rate).toBe(50);
  });

  it("counts follow-up overdue and not started", () => {
    const records = [
      makeRecord({ id: "1", follow_up_status: "overdue" }),
      makeRecord({ id: "2", follow_up_status: "overdue" }),
      makeRecord({ id: "3", follow_up_status: "not_started" }),
      makeRecord({ id: "4", follow_up_status: "all_completed" }),
    ];
    const m = computePanelMetrics(records);
    expect(m.follow_up_overdue_count).toBe(2);
    expect(m.follow_up_not_started_count).toBe(1);
  });

  it("calculates boolean rates correctly", () => {
    const records = [
      makeRecord({ id: "1", child_views_considered: true, minutes_recorded: true }),
      makeRecord({ id: "2", child_views_considered: false, minutes_recorded: false }),
    ];
    const m = computePanelMetrics(records);
    expect(m.child_views_considered_rate).toBe(50);
    expect(m.minutes_recorded_rate).toBe(50);
  });

  it("counts unique children excluding null child_name", () => {
    const records = [
      makeRecord({ id: "1", child_name: "Alex" }),
      makeRecord({ id: "2", child_name: "Alex" }),
      makeRecord({ id: "3", child_name: "Beth" }),
      makeRecord({ id: "4", child_name: null }),
    ];
    const m = computePanelMetrics(records);
    expect(m.unique_children).toBe(2);
  });
});

// -- identifyPanelAlerts ------------------------------------------------------

describe("identifyPanelAlerts", () => {
  it("returns empty array when no issues", () => {
    const alerts = identifyPanelAlerts([makeRecord()]);
    expect(alerts).toEqual([]);
  });

  it("flags critical quorum_not_met", () => {
    const records = [makeRecord({ panel_quorum: "quorum_not_met" })];
    const alerts = identifyPanelAlerts(records);
    const q = alerts.filter((a) => a.type === "quorum_not_met");
    expect(q.length).toBe(1);
    expect(q[0].severity).toBe("critical");
  });

  it("flags high follow_up_overdue when >= 1", () => {
    const records = [makeRecord({ follow_up_status: "overdue" })];
    const alerts = identifyPanelAlerts(records);
    const f = alerts.filter((a) => a.type === "follow_up_overdue");
    expect(f.length).toBe(1);
    expect(f[0].severity).toBe("high");
  });

  it("flags high child_views_not_considered when child_name present", () => {
    const records = [makeRecord({ child_views_considered: false, child_name: "Alex" })];
    const alerts = identifyPanelAlerts(records);
    const cv = alerts.filter((a) => a.type === "child_views_not_considered");
    expect(cv.length).toBe(1);
    expect(cv[0].severity).toBe("high");
  });

  it("does not flag child_views_not_considered when child_name is null", () => {
    const records = [makeRecord({ child_views_considered: false, child_name: null })];
    const alerts = identifyPanelAlerts(records);
    const cv = alerts.filter((a) => a.type === "child_views_not_considered");
    expect(cv.length).toBe(0);
  });

  it("flags medium minutes_not_recorded when >= 1", () => {
    const records = [makeRecord({ minutes_recorded: false })];
    const alerts = identifyPanelAlerts(records);
    const mn = alerts.filter((a) => a.type === "minutes_not_recorded");
    expect(mn.length).toBe(1);
    expect(mn[0].severity).toBe("medium");
  });

  it("flags medium follow_up_not_started when >= 2", () => {
    const records = [
      makeRecord({ id: "1", follow_up_status: "not_started" }),
      makeRecord({ id: "2", follow_up_status: "not_started" }),
    ];
    const alerts = identifyPanelAlerts(records);
    const ns = alerts.filter((a) => a.type === "follow_up_not_started");
    expect(ns.length).toBe(1);
    expect(ns[0].severity).toBe("medium");
  });

  it("does not flag follow_up_not_started when only 1", () => {
    const records = [makeRecord({ follow_up_status: "not_started" })];
    const alerts = identifyPanelAlerts(records);
    const ns = alerts.filter((a) => a.type === "follow_up_not_started");
    expect(ns.length).toBe(0);
  });
});
