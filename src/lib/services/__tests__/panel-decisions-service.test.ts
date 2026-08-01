// ══════════════════════════════════════════════════════════════════════════════
// CARA — PANEL DECISIONS SERVICE TESTS
// Pure-function unit tests for panel metrics computation,
// alert identification, constant validation, and CRUD fallback behaviour
// (Supabase disabled). CHR 2015 Reg 13 (leadership and management),
// Reg 14 (care planning — placement decisions),
// Reg 36 (fitness of premises — capacity decisions).
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  _testing,
  PANEL_TYPES,
  PANEL_DECISIONS,
  PANEL_QUORUMS,
  FOLLOW_UP_STATUSES,
  listRecords,
  createRecord,
  updateRecord,
} from "../panel-decisions-service";

import type { PanelDecisionRecord } from "../panel-decisions-service";

const { computePanelMetrics, identifyPanelAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Build a minimal PanelDecisionRecord with sensible defaults. */
function makeRecord(
  overrides: Partial<PanelDecisionRecord> = {},
): PanelDecisionRecord {
  return {
    id: "pd-1",
    home_id: "home-1",
    panel_type: "admission_panel",
    panel_date: "2026-04-01",
    panel_decision: "approved",
    panel_quorum: "full_quorum",
    follow_up_status: "all_completed",
    child_name: null,
    child_id: null,
    panel_chair: "Chair A",
    panel_members: ["Member A"],
    child_views_considered: true,
    risk_assessment_reviewed: true,
    matching_criteria_assessed: true,
    impact_on_group_assessed: true,
    safeguarding_discussed: true,
    minutes_recorded: true,
    actions_agreed: [],
    conditions: [],
    follow_up_date: null,
    issues_found: [],
    actions_taken: [],
    notes: null,
    created_at: "2026-04-01T00:00:00.000Z",
    updated_at: "2026-04-01T00:00:00.000Z",
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

describe("PANEL_TYPES", () => {
  it("has exactly 10 panel types", () => {
    expect(PANEL_TYPES).toHaveLength(10);
  });

  it("contains unique type values", () => {
    const types = PANEL_TYPES.map((t) => t.type);
    expect(new Set(types).size).toBe(types.length);
  });

  it("contains unique label values", () => {
    const labels = PANEL_TYPES.map((t) => t.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes admission_panel", () => {
    expect(PANEL_TYPES.find((t) => t.type === "admission_panel")).toBeDefined();
  });

  it("includes matching_panel", () => {
    expect(PANEL_TYPES.find((t) => t.type === "matching_panel")).toBeDefined();
  });

  it("includes disruption_meeting", () => {
    expect(PANEL_TYPES.find((t) => t.type === "disruption_meeting")).toBeDefined();
  });

  it("includes discharge_panel", () => {
    expect(PANEL_TYPES.find((t) => t.type === "discharge_panel")).toBeDefined();
  });

  it("includes capacity_review", () => {
    expect(PANEL_TYPES.find((t) => t.type === "capacity_review")).toBeDefined();
  });

  it("includes quality_panel", () => {
    expect(PANEL_TYPES.find((t) => t.type === "quality_panel")).toBeDefined();
  });

  it("includes safeguarding_panel", () => {
    expect(PANEL_TYPES.find((t) => t.type === "safeguarding_panel")).toBeDefined();
  });

  it("includes risk_panel", () => {
    expect(PANEL_TYPES.find((t) => t.type === "risk_panel")).toBeDefined();
  });

  it("includes placement_review", () => {
    expect(PANEL_TYPES.find((t) => t.type === "placement_review")).toBeDefined();
  });

  it("includes other", () => {
    expect(PANEL_TYPES.find((t) => t.type === "other")).toBeDefined();
  });

  it("every entry has both type and label", () => {
    for (const entry of PANEL_TYPES) {
      expect(entry.type).toBeTruthy();
      expect(entry.label).toBeTruthy();
    }
  });
});

describe("PANEL_DECISIONS", () => {
  it("has exactly 6 decisions", () => {
    expect(PANEL_DECISIONS).toHaveLength(6);
  });

  it("contains unique decision values", () => {
    const decisions = PANEL_DECISIONS.map((d) => d.decision);
    expect(new Set(decisions).size).toBe(decisions.length);
  });

  it("contains unique label values", () => {
    const labels = PANEL_DECISIONS.map((d) => d.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes approved", () => {
    expect(PANEL_DECISIONS.find((d) => d.decision === "approved")).toBeDefined();
  });

  it("includes approved_with_conditions", () => {
    expect(PANEL_DECISIONS.find((d) => d.decision === "approved_with_conditions")).toBeDefined();
  });

  it("includes deferred", () => {
    expect(PANEL_DECISIONS.find((d) => d.decision === "deferred")).toBeDefined();
  });

  it("includes declined", () => {
    expect(PANEL_DECISIONS.find((d) => d.decision === "declined")).toBeDefined();
  });

  it("includes further_info_required", () => {
    expect(PANEL_DECISIONS.find((d) => d.decision === "further_info_required")).toBeDefined();
  });

  it("includes not_applicable", () => {
    expect(PANEL_DECISIONS.find((d) => d.decision === "not_applicable")).toBeDefined();
  });

  it("every entry has both decision and label", () => {
    for (const entry of PANEL_DECISIONS) {
      expect(entry.decision).toBeTruthy();
      expect(entry.label).toBeTruthy();
    }
  });
});

describe("PANEL_QUORUMS", () => {
  it("has exactly 4 quorums", () => {
    expect(PANEL_QUORUMS).toHaveLength(4);
  });

  it("contains unique quorum values", () => {
    const quorums = PANEL_QUORUMS.map((q) => q.quorum);
    expect(new Set(quorums).size).toBe(quorums.length);
  });

  it("contains unique label values", () => {
    const labels = PANEL_QUORUMS.map((q) => q.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes full_quorum", () => {
    expect(PANEL_QUORUMS.find((q) => q.quorum === "full_quorum")).toBeDefined();
  });

  it("includes quorum_met", () => {
    expect(PANEL_QUORUMS.find((q) => q.quorum === "quorum_met")).toBeDefined();
  });

  it("includes quorum_not_met", () => {
    expect(PANEL_QUORUMS.find((q) => q.quorum === "quorum_not_met")).toBeDefined();
  });

  it("includes not_applicable", () => {
    expect(PANEL_QUORUMS.find((q) => q.quorum === "not_applicable")).toBeDefined();
  });

  it("every entry has both quorum and label", () => {
    for (const entry of PANEL_QUORUMS) {
      expect(entry.quorum).toBeTruthy();
      expect(entry.label).toBeTruthy();
    }
  });
});

describe("FOLLOW_UP_STATUSES", () => {
  it("has exactly 5 statuses", () => {
    expect(FOLLOW_UP_STATUSES).toHaveLength(5);
  });

  it("contains unique status values", () => {
    const statuses = FOLLOW_UP_STATUSES.map((s) => s.status);
    expect(new Set(statuses).size).toBe(statuses.length);
  });

  it("contains unique label values", () => {
    const labels = FOLLOW_UP_STATUSES.map((s) => s.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes all_completed", () => {
    expect(FOLLOW_UP_STATUSES.find((s) => s.status === "all_completed")).toBeDefined();
  });

  it("includes in_progress", () => {
    expect(FOLLOW_UP_STATUSES.find((s) => s.status === "in_progress")).toBeDefined();
  });

  it("includes not_started", () => {
    expect(FOLLOW_UP_STATUSES.find((s) => s.status === "not_started")).toBeDefined();
  });

  it("includes overdue", () => {
    expect(FOLLOW_UP_STATUSES.find((s) => s.status === "overdue")).toBeDefined();
  });

  it("includes not_required", () => {
    expect(FOLLOW_UP_STATUSES.find((s) => s.status === "not_required")).toBeDefined();
  });

  it("every entry has both status and label", () => {
    for (const entry of FOLLOW_UP_STATUSES) {
      expect(entry.status).toBeTruthy();
      expect(entry.label).toBeTruthy();
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// computePanelMetrics
// ═══════════════════════════════════════════════════════════════════════════

describe("computePanelMetrics", () => {
  // ── Empty input ──────────────────────────────────────────────────────

  it("returns zeroed metrics for empty array", () => {
    const m = computePanelMetrics([]);
    expect(m.total_panels).toBe(0);
    expect(m.admission_panel_count).toBe(0);
    expect(m.matching_panel_count).toBe(0);
    expect(m.disruption_meeting_count).toBe(0);
    expect(m.discharge_panel_count).toBe(0);
    expect(m.approved_rate).toBeNull();;
    expect(m.approved_with_conditions_count).toBe(0);
    expect(m.declined_count).toBe(0);
    expect(m.deferred_count).toBe(0);
    expect(m.full_quorum_rate).toBeNull();;
    expect(m.quorum_not_met_count).toBe(0);
    expect(m.child_views_considered_rate).toBeNull();;
    expect(m.risk_assessment_reviewed_rate).toBeNull();;
    expect(m.matching_criteria_rate).toBeNull();;
    expect(m.impact_assessed_rate).toBeNull();;
    expect(m.safeguarding_discussed_rate).toBeNull();;
    expect(m.minutes_recorded_rate).toBeNull();;
    expect(m.all_follow_up_completed_rate).toBeNull();;
    expect(m.follow_up_overdue_count).toBe(0);
    expect(m.follow_up_not_started_count).toBe(0);
    expect(m.unique_children).toBe(0);
    expect(m.by_panel_type).toEqual({});
    expect(m.by_panel_decision).toEqual({});
    expect(m.by_panel_quorum).toEqual({});
    expect(m.by_follow_up_status).toEqual({});
  });

  // ── total_panels ─────────────────────────────────────────────────────

  it("counts total panels for single record", () => {
    const m = computePanelMetrics([makeRecord()]);
    expect(m.total_panels).toBe(1);
  });

  it("counts total panels for multiple records", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1" }),
      makeRecord({ id: "pd-2" }),
      makeRecord({ id: "pd-3" }),
    ]);
    expect(m.total_panels).toBe(3);
  });

  // ── Panel type counts ────────────────────────────────────────────────

  it("counts admission_panel_count", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", panel_type: "admission_panel" }),
      makeRecord({ id: "pd-2", panel_type: "admission_panel" }),
      makeRecord({ id: "pd-3", panel_type: "matching_panel" }),
    ]);
    expect(m.admission_panel_count).toBe(2);
  });

  it("returns 0 admission_panel_count when none present", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", panel_type: "matching_panel" }),
    ]);
    expect(m.admission_panel_count).toBe(0);
  });

  it("counts matching_panel_count", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", panel_type: "matching_panel" }),
      makeRecord({ id: "pd-2", panel_type: "matching_panel" }),
      makeRecord({ id: "pd-3", panel_type: "matching_panel" }),
    ]);
    expect(m.matching_panel_count).toBe(3);
  });

  it("returns 0 matching_panel_count when none present", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", panel_type: "admission_panel" }),
    ]);
    expect(m.matching_panel_count).toBe(0);
  });

  it("counts disruption_meeting_count", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", panel_type: "disruption_meeting" }),
    ]);
    expect(m.disruption_meeting_count).toBe(1);
  });

  it("returns 0 disruption_meeting_count when none present", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", panel_type: "admission_panel" }),
    ]);
    expect(m.disruption_meeting_count).toBe(0);
  });

  it("counts discharge_panel_count", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", panel_type: "discharge_panel" }),
      makeRecord({ id: "pd-2", panel_type: "discharge_panel" }),
    ]);
    expect(m.discharge_panel_count).toBe(2);
  });

  it("returns 0 discharge_panel_count when none present", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", panel_type: "quality_panel" }),
    ]);
    expect(m.discharge_panel_count).toBe(0);
  });

  // ── approved_rate ────────────────────────────────────────────────────

  it("computes 100% approved_rate when all approved", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", panel_decision: "approved" }),
      makeRecord({ id: "pd-2", panel_decision: "approved" }),
    ]);
    expect(m.approved_rate).toBe(100);
  });

  it("computes 0% approved_rate when none approved", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", panel_decision: "declined" }),
      makeRecord({ id: "pd-2", panel_decision: "deferred" }),
    ]);
    expect(m.approved_rate).toBe(0);
  });

  it("computes 50% approved_rate for half approved", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", panel_decision: "approved" }),
      makeRecord({ id: "pd-2", panel_decision: "declined" }),
    ]);
    expect(m.approved_rate).toBe(50);
  });

  it("rounds approved_rate to one decimal place", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", panel_decision: "approved" }),
      makeRecord({ id: "pd-2", panel_decision: "declined" }),
      makeRecord({ id: "pd-3", panel_decision: "declined" }),
    ]);
    // 1/3 = 33.333... -> 33.3
    expect(m.approved_rate).toBe(33.3);
  });

  it("rounds approved_rate for 2/3", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", panel_decision: "approved" }),
      makeRecord({ id: "pd-2", panel_decision: "approved" }),
      makeRecord({ id: "pd-3", panel_decision: "declined" }),
    ]);
    // 2/3 = 66.666... -> 66.7
    expect(m.approved_rate).toBe(66.7);
  });

  it("returns 0 approved_rate for empty records", () => {
    const m = computePanelMetrics([]);
    expect(m.approved_rate).toBeNull();;
  });

  // ── approved_with_conditions_count ───────────────────────────────────

  it("counts approved_with_conditions_count", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", panel_decision: "approved_with_conditions" }),
      makeRecord({ id: "pd-2", panel_decision: "approved_with_conditions" }),
      makeRecord({ id: "pd-3", panel_decision: "approved" }),
    ]);
    expect(m.approved_with_conditions_count).toBe(2);
  });

  it("returns 0 approved_with_conditions_count when none present", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", panel_decision: "approved" }),
    ]);
    expect(m.approved_with_conditions_count).toBe(0);
  });

  // ── declined_count ──────────────────────────────────────────────────

  it("counts declined_count", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", panel_decision: "declined" }),
      makeRecord({ id: "pd-2", panel_decision: "declined" }),
      makeRecord({ id: "pd-3", panel_decision: "declined" }),
    ]);
    expect(m.declined_count).toBe(3);
  });

  it("returns 0 declined_count when none present", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", panel_decision: "approved" }),
    ]);
    expect(m.declined_count).toBe(0);
  });

  // ── deferred_count ──────────────────────────────────────────────────

  it("counts deferred_count", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", panel_decision: "deferred" }),
    ]);
    expect(m.deferred_count).toBe(1);
  });

  it("returns 0 deferred_count when none present", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", panel_decision: "approved" }),
    ]);
    expect(m.deferred_count).toBe(0);
  });

  // ── full_quorum_rate ────────────────────────────────────────────────

  it("computes 100% full_quorum_rate when all full_quorum", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", panel_quorum: "full_quorum" }),
      makeRecord({ id: "pd-2", panel_quorum: "full_quorum" }),
    ]);
    expect(m.full_quorum_rate).toBe(100);
  });

  it("computes 0% full_quorum_rate when none full_quorum", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", panel_quorum: "quorum_met" }),
      makeRecord({ id: "pd-2", panel_quorum: "quorum_not_met" }),
    ]);
    expect(m.full_quorum_rate).toBe(0);
  });

  it("computes 50% full_quorum_rate for mixed quorum", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", panel_quorum: "full_quorum" }),
      makeRecord({ id: "pd-2", panel_quorum: "quorum_met" }),
    ]);
    expect(m.full_quorum_rate).toBe(50);
  });

  it("rounds full_quorum_rate to one decimal place", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", panel_quorum: "full_quorum" }),
      makeRecord({ id: "pd-2", panel_quorum: "quorum_met" }),
      makeRecord({ id: "pd-3", panel_quorum: "quorum_not_met" }),
    ]);
    // 1/3 = 33.333... -> 33.3
    expect(m.full_quorum_rate).toBe(33.3);
  });

  it("returns 0 full_quorum_rate for empty records", () => {
    const m = computePanelMetrics([]);
    expect(m.full_quorum_rate).toBeNull();;
  });

  // ── quorum_not_met_count ────────────────────────────────────────────

  it("counts quorum_not_met_count", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", panel_quorum: "quorum_not_met" }),
      makeRecord({ id: "pd-2", panel_quorum: "quorum_not_met" }),
      makeRecord({ id: "pd-3", panel_quorum: "full_quorum" }),
    ]);
    expect(m.quorum_not_met_count).toBe(2);
  });

  it("returns 0 quorum_not_met_count when none present", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", panel_quorum: "full_quorum" }),
    ]);
    expect(m.quorum_not_met_count).toBe(0);
  });

  // ── child_views_considered_rate ─────────────────────────────────────

  it("computes 100% child_views_considered_rate when all true", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", child_views_considered: true }),
      makeRecord({ id: "pd-2", child_views_considered: true }),
    ]);
    expect(m.child_views_considered_rate).toBe(100);
  });

  it("computes 0% child_views_considered_rate when all false", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", child_views_considered: false }),
      makeRecord({ id: "pd-2", child_views_considered: false }),
    ]);
    expect(m.child_views_considered_rate).toBe(0);
  });

  it("computes 50% child_views_considered_rate for mixed", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", child_views_considered: true }),
      makeRecord({ id: "pd-2", child_views_considered: false }),
    ]);
    expect(m.child_views_considered_rate).toBe(50);
  });

  it("rounds child_views_considered_rate to one decimal place", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", child_views_considered: true }),
      makeRecord({ id: "pd-2", child_views_considered: false }),
      makeRecord({ id: "pd-3", child_views_considered: false }),
    ]);
    expect(m.child_views_considered_rate).toBe(33.3);
  });

  it("returns 0 child_views_considered_rate for empty records", () => {
    const m = computePanelMetrics([]);
    expect(m.child_views_considered_rate).toBeNull();;
  });

  // ── risk_assessment_reviewed_rate ───────────────────────────────────

  it("computes 100% risk_assessment_reviewed_rate when all true", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", risk_assessment_reviewed: true }),
      makeRecord({ id: "pd-2", risk_assessment_reviewed: true }),
    ]);
    expect(m.risk_assessment_reviewed_rate).toBe(100);
  });

  it("computes 0% risk_assessment_reviewed_rate when all false", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", risk_assessment_reviewed: false }),
      makeRecord({ id: "pd-2", risk_assessment_reviewed: false }),
    ]);
    expect(m.risk_assessment_reviewed_rate).toBe(0);
  });

  it("rounds risk_assessment_reviewed_rate to one decimal place", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", risk_assessment_reviewed: true }),
      makeRecord({ id: "pd-2", risk_assessment_reviewed: true }),
      makeRecord({ id: "pd-3", risk_assessment_reviewed: false }),
    ]);
    // 2/3 = 66.666... -> 66.7
    expect(m.risk_assessment_reviewed_rate).toBe(66.7);
  });

  it("returns 0 risk_assessment_reviewed_rate for empty records", () => {
    const m = computePanelMetrics([]);
    expect(m.risk_assessment_reviewed_rate).toBeNull();;
  });

  // ── matching_criteria_rate ──────────────────────────────────────────

  it("computes 100% matching_criteria_rate when all true", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", matching_criteria_assessed: true }),
      makeRecord({ id: "pd-2", matching_criteria_assessed: true }),
    ]);
    expect(m.matching_criteria_rate).toBe(100);
  });

  it("computes 0% matching_criteria_rate when all false", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", matching_criteria_assessed: false }),
      makeRecord({ id: "pd-2", matching_criteria_assessed: false }),
    ]);
    expect(m.matching_criteria_rate).toBe(0);
  });

  it("rounds matching_criteria_rate to one decimal place", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", matching_criteria_assessed: true }),
      makeRecord({ id: "pd-2", matching_criteria_assessed: false }),
      makeRecord({ id: "pd-3", matching_criteria_assessed: false }),
    ]);
    expect(m.matching_criteria_rate).toBe(33.3);
  });

  it("returns 0 matching_criteria_rate for empty records", () => {
    const m = computePanelMetrics([]);
    expect(m.matching_criteria_rate).toBeNull();;
  });

  // ── impact_assessed_rate ────────────────────────────────────────────

  it("computes 100% impact_assessed_rate when all true", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", impact_on_group_assessed: true }),
      makeRecord({ id: "pd-2", impact_on_group_assessed: true }),
    ]);
    expect(m.impact_assessed_rate).toBe(100);
  });

  it("computes 0% impact_assessed_rate when all false", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", impact_on_group_assessed: false }),
      makeRecord({ id: "pd-2", impact_on_group_assessed: false }),
    ]);
    expect(m.impact_assessed_rate).toBe(0);
  });

  it("rounds impact_assessed_rate to one decimal place", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", impact_on_group_assessed: true }),
      makeRecord({ id: "pd-2", impact_on_group_assessed: true }),
      makeRecord({ id: "pd-3", impact_on_group_assessed: false }),
    ]);
    expect(m.impact_assessed_rate).toBe(66.7);
  });

  it("returns 0 impact_assessed_rate for empty records", () => {
    const m = computePanelMetrics([]);
    expect(m.impact_assessed_rate).toBeNull();;
  });

  // ── safeguarding_discussed_rate ─────────────────────────────────────

  it("computes 100% safeguarding_discussed_rate when all true", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", safeguarding_discussed: true }),
      makeRecord({ id: "pd-2", safeguarding_discussed: true }),
    ]);
    expect(m.safeguarding_discussed_rate).toBe(100);
  });

  it("computes 0% safeguarding_discussed_rate when all false", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", safeguarding_discussed: false }),
      makeRecord({ id: "pd-2", safeguarding_discussed: false }),
    ]);
    expect(m.safeguarding_discussed_rate).toBe(0);
  });

  it("rounds safeguarding_discussed_rate to one decimal place", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", safeguarding_discussed: true }),
      makeRecord({ id: "pd-2", safeguarding_discussed: false }),
      makeRecord({ id: "pd-3", safeguarding_discussed: false }),
    ]);
    expect(m.safeguarding_discussed_rate).toBe(33.3);
  });

  it("returns 0 safeguarding_discussed_rate for empty records", () => {
    const m = computePanelMetrics([]);
    expect(m.safeguarding_discussed_rate).toBeNull();;
  });

  // ── minutes_recorded_rate ───────────────────────────────────────────

  it("computes 100% minutes_recorded_rate when all true", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", minutes_recorded: true }),
      makeRecord({ id: "pd-2", minutes_recorded: true }),
    ]);
    expect(m.minutes_recorded_rate).toBe(100);
  });

  it("computes 0% minutes_recorded_rate when all false", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", minutes_recorded: false }),
      makeRecord({ id: "pd-2", minutes_recorded: false }),
    ]);
    expect(m.minutes_recorded_rate).toBe(0);
  });

  it("rounds minutes_recorded_rate to one decimal place", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", minutes_recorded: true }),
      makeRecord({ id: "pd-2", minutes_recorded: true }),
      makeRecord({ id: "pd-3", minutes_recorded: false }),
    ]);
    expect(m.minutes_recorded_rate).toBe(66.7);
  });

  it("returns 0 minutes_recorded_rate for empty records", () => {
    const m = computePanelMetrics([]);
    expect(m.minutes_recorded_rate).toBeNull();;
  });

  // ── all_follow_up_completed_rate ────────────────────────────────────

  it("computes 100% all_follow_up_completed_rate when all completed", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", follow_up_status: "all_completed" }),
      makeRecord({ id: "pd-2", follow_up_status: "all_completed" }),
    ]);
    expect(m.all_follow_up_completed_rate).toBe(100);
  });

  it("computes 0% all_follow_up_completed_rate when none completed", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", follow_up_status: "overdue" }),
      makeRecord({ id: "pd-2", follow_up_status: "not_started" }),
    ]);
    expect(m.all_follow_up_completed_rate).toBe(0);
  });

  it("computes 50% all_follow_up_completed_rate for mixed", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", follow_up_status: "all_completed" }),
      makeRecord({ id: "pd-2", follow_up_status: "in_progress" }),
    ]);
    expect(m.all_follow_up_completed_rate).toBe(50);
  });

  it("rounds all_follow_up_completed_rate to one decimal place", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", follow_up_status: "all_completed" }),
      makeRecord({ id: "pd-2", follow_up_status: "overdue" }),
      makeRecord({ id: "pd-3", follow_up_status: "not_started" }),
    ]);
    // 1/3 = 33.333... -> 33.3
    expect(m.all_follow_up_completed_rate).toBe(33.3);
  });

  it("returns 0 all_follow_up_completed_rate for empty records", () => {
    const m = computePanelMetrics([]);
    expect(m.all_follow_up_completed_rate).toBeNull();;
  });

  // ── follow_up_overdue_count ─────────────────────────────────────────

  it("counts follow_up_overdue_count", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", follow_up_status: "overdue" }),
      makeRecord({ id: "pd-2", follow_up_status: "overdue" }),
      makeRecord({ id: "pd-3", follow_up_status: "all_completed" }),
    ]);
    expect(m.follow_up_overdue_count).toBe(2);
  });

  it("returns 0 follow_up_overdue_count when none overdue", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", follow_up_status: "all_completed" }),
    ]);
    expect(m.follow_up_overdue_count).toBe(0);
  });

  // ── follow_up_not_started_count ─────────────────────────────────────

  it("counts follow_up_not_started_count", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", follow_up_status: "not_started" }),
      makeRecord({ id: "pd-2", follow_up_status: "not_started" }),
      makeRecord({ id: "pd-3", follow_up_status: "not_started" }),
    ]);
    expect(m.follow_up_not_started_count).toBe(3);
  });

  it("returns 0 follow_up_not_started_count when none not_started", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", follow_up_status: "all_completed" }),
    ]);
    expect(m.follow_up_not_started_count).toBe(0);
  });

  // ── unique_children ─────────────────────────────────────────────────

  it("counts unique children by child_name", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", child_name: "Alice" }),
      makeRecord({ id: "pd-2", child_name: "Bob" }),
      makeRecord({ id: "pd-3", child_name: "Charlie" }),
    ]);
    expect(m.unique_children).toBe(3);
  });

  it("deduplicates children with same name", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", child_name: "Alice" }),
      makeRecord({ id: "pd-2", child_name: "Alice" }),
      makeRecord({ id: "pd-3", child_name: "Bob" }),
    ]);
    expect(m.unique_children).toBe(2);
  });

  it("excludes null child_name from unique_children", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", child_name: null }),
      makeRecord({ id: "pd-2", child_name: null }),
    ]);
    expect(m.unique_children).toBe(0);
  });

  it("counts unique_children from mix of null and named", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", child_name: "Alice" }),
      makeRecord({ id: "pd-2", child_name: null }),
      makeRecord({ id: "pd-3", child_name: "Bob" }),
      makeRecord({ id: "pd-4", child_name: null }),
    ]);
    expect(m.unique_children).toBe(2);
  });

  it("returns 0 unique_children for empty records", () => {
    const m = computePanelMetrics([]);
    expect(m.unique_children).toBe(0);
  });

  // ── by_panel_type ───────────────────────────────────────────────────

  it("groups records by panel type", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", panel_type: "admission_panel" }),
      makeRecord({ id: "pd-2", panel_type: "admission_panel" }),
      makeRecord({ id: "pd-3", panel_type: "matching_panel" }),
      makeRecord({ id: "pd-4", panel_type: "quality_panel" }),
    ]);
    expect(m.by_panel_type).toEqual({
      admission_panel: 2,
      matching_panel: 1,
      quality_panel: 1,
    });
  });

  it("returns empty by_panel_type for no records", () => {
    const m = computePanelMetrics([]);
    expect(m.by_panel_type).toEqual({});
  });

  it("handles single panel type across all records", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", panel_type: "capacity_review" }),
      makeRecord({ id: "pd-2", panel_type: "capacity_review" }),
    ]);
    expect(m.by_panel_type).toEqual({ capacity_review: 2 });
  });

  // ── by_panel_decision ───────────────────────────────────────────────

  it("groups records by panel decision", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", panel_decision: "approved" }),
      makeRecord({ id: "pd-2", panel_decision: "approved" }),
      makeRecord({ id: "pd-3", panel_decision: "declined" }),
      makeRecord({ id: "pd-4", panel_decision: "deferred" }),
    ]);
    expect(m.by_panel_decision).toEqual({
      approved: 2,
      declined: 1,
      deferred: 1,
    });
  });

  it("returns empty by_panel_decision for no records", () => {
    const m = computePanelMetrics([]);
    expect(m.by_panel_decision).toEqual({});
  });

  // ── by_panel_quorum ─────────────────────────────────────────────────

  it("groups records by panel quorum", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", panel_quorum: "full_quorum" }),
      makeRecord({ id: "pd-2", panel_quorum: "full_quorum" }),
      makeRecord({ id: "pd-3", panel_quorum: "quorum_met" }),
      makeRecord({ id: "pd-4", panel_quorum: "quorum_not_met" }),
    ]);
    expect(m.by_panel_quorum).toEqual({
      full_quorum: 2,
      quorum_met: 1,
      quorum_not_met: 1,
    });
  });

  it("returns empty by_panel_quorum for no records", () => {
    const m = computePanelMetrics([]);
    expect(m.by_panel_quorum).toEqual({});
  });

  // ── by_follow_up_status ─────────────────────────────────────────────

  it("groups records by follow-up status", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", follow_up_status: "all_completed" }),
      makeRecord({ id: "pd-2", follow_up_status: "all_completed" }),
      makeRecord({ id: "pd-3", follow_up_status: "overdue" }),
      makeRecord({ id: "pd-4", follow_up_status: "not_started" }),
      makeRecord({ id: "pd-5", follow_up_status: "in_progress" }),
    ]);
    expect(m.by_follow_up_status).toEqual({
      all_completed: 2,
      overdue: 1,
      not_started: 1,
      in_progress: 1,
    });
  });

  it("returns empty by_follow_up_status for no records", () => {
    const m = computePanelMetrics([]);
    expect(m.by_follow_up_status).toEqual({});
  });

  // ── Combined / complex scenarios ────────────────────────────────────

  it("handles mixed realistic dataset", () => {
    const m = computePanelMetrics([
      makeRecord({
        id: "pd-1",
        panel_type: "admission_panel",
        panel_decision: "approved",
        panel_quorum: "full_quorum",
        follow_up_status: "all_completed",
        child_name: "Alice",
        child_views_considered: true,
        risk_assessment_reviewed: true,
        matching_criteria_assessed: true,
        impact_on_group_assessed: true,
        safeguarding_discussed: true,
        minutes_recorded: true,
      }),
      makeRecord({
        id: "pd-2",
        panel_type: "matching_panel",
        panel_decision: "approved_with_conditions",
        panel_quorum: "quorum_met",
        follow_up_status: "in_progress",
        child_name: "Bob",
        child_views_considered: false,
        risk_assessment_reviewed: true,
        matching_criteria_assessed: false,
        impact_on_group_assessed: true,
        safeguarding_discussed: false,
        minutes_recorded: true,
      }),
      makeRecord({
        id: "pd-3",
        panel_type: "disruption_meeting",
        panel_decision: "declined",
        panel_quorum: "quorum_not_met",
        follow_up_status: "overdue",
        child_name: "Alice",
        child_views_considered: true,
        risk_assessment_reviewed: false,
        matching_criteria_assessed: true,
        impact_on_group_assessed: false,
        safeguarding_discussed: true,
        minutes_recorded: false,
      }),
    ]);
    expect(m.total_panels).toBe(3);
    expect(m.admission_panel_count).toBe(1);
    expect(m.matching_panel_count).toBe(1);
    expect(m.disruption_meeting_count).toBe(1);
    expect(m.discharge_panel_count).toBe(0);
    expect(m.approved_rate).toBe(33.3);
    expect(m.approved_with_conditions_count).toBe(1);
    expect(m.declined_count).toBe(1);
    expect(m.deferred_count).toBe(0);
    expect(m.full_quorum_rate).toBe(33.3);
    expect(m.quorum_not_met_count).toBe(1);
    expect(m.child_views_considered_rate).toBe(66.7);
    expect(m.risk_assessment_reviewed_rate).toBe(66.7);
    expect(m.matching_criteria_rate).toBe(66.7);
    expect(m.impact_assessed_rate).toBe(66.7);
    expect(m.safeguarding_discussed_rate).toBe(66.7);
    expect(m.minutes_recorded_rate).toBe(66.7);
    expect(m.all_follow_up_completed_rate).toBe(33.3);
    expect(m.follow_up_overdue_count).toBe(1);
    expect(m.follow_up_not_started_count).toBe(0);
    expect(m.unique_children).toBe(2);
  });

  it("handles all booleans false", () => {
    const m = computePanelMetrics([
      makeRecord({
        id: "pd-1",
        child_views_considered: false,
        risk_assessment_reviewed: false,
        matching_criteria_assessed: false,
        impact_on_group_assessed: false,
        safeguarding_discussed: false,
        minutes_recorded: false,
      }),
    ]);
    expect(m.child_views_considered_rate).toBe(0);
    expect(m.risk_assessment_reviewed_rate).toBe(0);
    expect(m.matching_criteria_rate).toBe(0);
    expect(m.impact_assessed_rate).toBe(0);
    expect(m.safeguarding_discussed_rate).toBe(0);
    expect(m.minutes_recorded_rate).toBe(0);
  });

  it("handles all booleans true", () => {
    const m = computePanelMetrics([
      makeRecord({
        id: "pd-1",
        child_views_considered: true,
        risk_assessment_reviewed: true,
        matching_criteria_assessed: true,
        impact_on_group_assessed: true,
        safeguarding_discussed: true,
        minutes_recorded: true,
      }),
    ]);
    expect(m.child_views_considered_rate).toBe(100);
    expect(m.risk_assessment_reviewed_rate).toBe(100);
    expect(m.matching_criteria_rate).toBe(100);
    expect(m.impact_assessed_rate).toBe(100);
    expect(m.safeguarding_discussed_rate).toBe(100);
    expect(m.minutes_recorded_rate).toBe(100);
  });

  it("does not count approved_with_conditions towards approved_rate", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", panel_decision: "approved_with_conditions" }),
    ]);
    expect(m.approved_rate).toBe(0);
    expect(m.approved_with_conditions_count).toBe(1);
  });

  it("does not count further_info_required as declined or deferred", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", panel_decision: "further_info_required" }),
    ]);
    expect(m.declined_count).toBe(0);
    expect(m.deferred_count).toBe(0);
    expect(m.approved_rate).toBe(0);
  });

  it("does not count not_applicable decision as approved, declined, or deferred", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", panel_decision: "not_applicable" }),
    ]);
    expect(m.approved_rate).toBe(0);
    expect(m.declined_count).toBe(0);
    expect(m.deferred_count).toBe(0);
    expect(m.approved_with_conditions_count).toBe(0);
  });

  it("does not count quorum_met towards full_quorum_rate", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", panel_quorum: "quorum_met" }),
    ]);
    expect(m.full_quorum_rate).toBe(0);
  });

  it("does not count not_required follow-up as all_completed", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", follow_up_status: "not_required" }),
    ]);
    expect(m.all_follow_up_completed_rate).toBe(0);
    expect(m.follow_up_overdue_count).toBe(0);
    expect(m.follow_up_not_started_count).toBe(0);
  });

  it("counts panel types not tracked individually in by_panel_type", () => {
    const m = computePanelMetrics([
      makeRecord({ id: "pd-1", panel_type: "safeguarding_panel" }),
      makeRecord({ id: "pd-2", panel_type: "risk_panel" }),
      makeRecord({ id: "pd-3", panel_type: "placement_review" }),
      makeRecord({ id: "pd-4", panel_type: "other" }),
    ]);
    expect(m.by_panel_type).toEqual({
      safeguarding_panel: 1,
      risk_panel: 1,
      placement_review: 1,
      other: 1,
    });
    // These types are not tracked as individual counts
    expect(m.admission_panel_count).toBe(0);
    expect(m.matching_panel_count).toBe(0);
    expect(m.disruption_meeting_count).toBe(0);
    expect(m.discharge_panel_count).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// identifyPanelAlerts
// ═══════════════════════════════════════════════════════════════════════════

describe("identifyPanelAlerts", () => {
  it("returns empty array for empty records", () => {
    const alerts = identifyPanelAlerts([]);
    expect(alerts).toHaveLength(0);
  });

  it("returns empty array for healthy records", () => {
    const alerts = identifyPanelAlerts([
      makeRecord({
        id: "pd-1",
        panel_quorum: "full_quorum",
        follow_up_status: "all_completed",
        child_views_considered: true,
        minutes_recorded: true,
      }),
    ]);
    expect(alerts).toHaveLength(0);
  });

  // ── quorum_not_met alerts ───────────────────────────────────────────

  describe("quorum_not_met alerts", () => {
    it("generates critical alert for quorum_not_met record", () => {
      const alerts = identifyPanelAlerts([
        makeRecord({ id: "pd-1", panel_quorum: "quorum_not_met" }),
      ]);
      const qAlerts = alerts.filter((a) => a.type === "quorum_not_met");
      expect(qAlerts).toHaveLength(1);
      expect(qAlerts[0].severity).toBe("critical");
    });

    it("sets id to the record id for quorum_not_met", () => {
      const alerts = identifyPanelAlerts([
        makeRecord({ id: "pd-42", panel_quorum: "quorum_not_met" }),
      ]);
      const qAlerts = alerts.filter((a) => a.type === "quorum_not_met");
      expect(qAlerts[0].id).toBe("pd-42");
    });

    it("includes panel type with underscores replaced in quorum message", () => {
      const alerts = identifyPanelAlerts([
        makeRecord({ id: "pd-1", panel_type: "admission_panel", panel_quorum: "quorum_not_met" }),
      ]);
      const qAlerts = alerts.filter((a) => a.type === "quorum_not_met");
      expect(qAlerts[0].message).toContain("admission panel");
    });

    it("replaces underscores in matching_panel type", () => {
      const alerts = identifyPanelAlerts([
        makeRecord({ id: "pd-1", panel_type: "matching_panel", panel_quorum: "quorum_not_met" }),
      ]);
      const qAlerts = alerts.filter((a) => a.type === "quorum_not_met");
      expect(qAlerts[0].message).toContain("matching panel");
    });

    it("replaces underscores in disruption_meeting type", () => {
      const alerts = identifyPanelAlerts([
        makeRecord({ id: "pd-1", panel_type: "disruption_meeting", panel_quorum: "quorum_not_met" }),
      ]);
      const qAlerts = alerts.filter((a) => a.type === "quorum_not_met");
      expect(qAlerts[0].message).toContain("disruption meeting");
    });

    it("replaces underscores in capacity_review type", () => {
      const alerts = identifyPanelAlerts([
        makeRecord({ id: "pd-1", panel_type: "capacity_review", panel_quorum: "quorum_not_met" }),
      ]);
      const qAlerts = alerts.filter((a) => a.type === "quorum_not_met");
      expect(qAlerts[0].message).toContain("capacity review");
    });

    it("includes panel_date in quorum message", () => {
      const alerts = identifyPanelAlerts([
        makeRecord({ id: "pd-1", panel_date: "2026-03-15", panel_quorum: "quorum_not_met" }),
      ]);
      const qAlerts = alerts.filter((a) => a.type === "quorum_not_met");
      expect(qAlerts[0].message).toContain("2026-03-15");
    });

    it("includes validity warning in quorum message", () => {
      const alerts = identifyPanelAlerts([
        makeRecord({ id: "pd-1", panel_quorum: "quorum_not_met" }),
      ]);
      const qAlerts = alerts.filter((a) => a.type === "quorum_not_met");
      expect(qAlerts[0].message).toContain("decision may not be valid");
    });

    it("generates one alert per quorum_not_met record", () => {
      const alerts = identifyPanelAlerts([
        makeRecord({ id: "pd-1", panel_quorum: "quorum_not_met", panel_date: "2026-01-01" }),
        makeRecord({ id: "pd-2", panel_quorum: "quorum_not_met", panel_date: "2026-02-01" }),
        makeRecord({ id: "pd-3", panel_quorum: "quorum_not_met", panel_date: "2026-03-01" }),
      ]);
      const qAlerts = alerts.filter((a) => a.type === "quorum_not_met");
      expect(qAlerts).toHaveLength(3);
    });

    it("does not generate alert for full_quorum", () => {
      const alerts = identifyPanelAlerts([
        makeRecord({ id: "pd-1", panel_quorum: "full_quorum" }),
      ]);
      const qAlerts = alerts.filter((a) => a.type === "quorum_not_met");
      expect(qAlerts).toHaveLength(0);
    });

    it("does not generate alert for quorum_met", () => {
      const alerts = identifyPanelAlerts([
        makeRecord({ id: "pd-1", panel_quorum: "quorum_met" }),
      ]);
      const qAlerts = alerts.filter((a) => a.type === "quorum_not_met");
      expect(qAlerts).toHaveLength(0);
    });

    it("does not generate alert for not_applicable quorum", () => {
      const alerts = identifyPanelAlerts([
        makeRecord({ id: "pd-1", panel_quorum: "not_applicable" }),
      ]);
      const qAlerts = alerts.filter((a) => a.type === "quorum_not_met");
      expect(qAlerts).toHaveLength(0);
    });

    it("each quorum alert has unique record id", () => {
      const alerts = identifyPanelAlerts([
        makeRecord({ id: "pd-1", panel_quorum: "quorum_not_met" }),
        makeRecord({ id: "pd-2", panel_quorum: "quorum_not_met" }),
      ]);
      const qAlerts = alerts.filter((a) => a.type === "quorum_not_met");
      const ids = qAlerts.map((a) => a.id);
      expect(new Set(ids).size).toBe(2);
    });
  });

  // ── follow_up_overdue alerts ────────────────────────────────────────

  describe("follow_up_overdue alerts", () => {
    it("generates high alert for 1 overdue follow-up", () => {
      const alerts = identifyPanelAlerts([
        makeRecord({ id: "pd-1", follow_up_status: "overdue" }),
      ]);
      const fAlerts = alerts.filter((a) => a.type === "follow_up_overdue");
      expect(fAlerts).toHaveLength(1);
      expect(fAlerts[0].severity).toBe("high");
    });

    it("sets id to follow_up_overdue for aggregated alert", () => {
      const alerts = identifyPanelAlerts([
        makeRecord({ id: "pd-1", follow_up_status: "overdue" }),
      ]);
      const fAlerts = alerts.filter((a) => a.type === "follow_up_overdue");
      expect(fAlerts[0].id).toBe("follow_up_overdue");
    });

    it("uses singular 'follow-up is' for 1 overdue", () => {
      const alerts = identifyPanelAlerts([
        makeRecord({ id: "pd-1", follow_up_status: "overdue" }),
      ]);
      const fAlerts = alerts.filter((a) => a.type === "follow_up_overdue");
      expect(fAlerts[0].message).toContain("follow-up is");
    });

    it("uses plural 'follow-ups are' for 2 overdue", () => {
      const alerts = identifyPanelAlerts([
        makeRecord({ id: "pd-1", follow_up_status: "overdue" }),
        makeRecord({ id: "pd-2", follow_up_status: "overdue" }),
      ]);
      const fAlerts = alerts.filter((a) => a.type === "follow_up_overdue");
      expect(fAlerts[0].message).toContain("follow-ups are");
    });

    it("uses plural 'follow-ups are' for 5 overdue", () => {
      const records = Array.from({ length: 5 }, (_, i) =>
        makeRecord({ id: `pd-${i}`, follow_up_status: "overdue" }),
      );
      const alerts = identifyPanelAlerts(records);
      const fAlerts = alerts.filter((a) => a.type === "follow_up_overdue");
      expect(fAlerts[0].message).toContain("5 panel follow-ups are");
    });

    it("includes count in overdue follow-up message", () => {
      const alerts = identifyPanelAlerts([
        makeRecord({ id: "pd-1", follow_up_status: "overdue" }),
        makeRecord({ id: "pd-2", follow_up_status: "overdue" }),
        makeRecord({ id: "pd-3", follow_up_status: "overdue" }),
      ]);
      const fAlerts = alerts.filter((a) => a.type === "follow_up_overdue");
      expect(fAlerts[0].message).toContain("3");
    });

    it("includes prompt action guidance in overdue message", () => {
      const alerts = identifyPanelAlerts([
        makeRecord({ id: "pd-1", follow_up_status: "overdue" }),
      ]);
      const fAlerts = alerts.filter((a) => a.type === "follow_up_overdue");
      expect(fAlerts[0].message).toContain("complete actions promptly");
    });

    it("does not generate alert when no overdue follow-ups", () => {
      const alerts = identifyPanelAlerts([
        makeRecord({ id: "pd-1", follow_up_status: "all_completed" }),
        makeRecord({ id: "pd-2", follow_up_status: "in_progress" }),
        makeRecord({ id: "pd-3", follow_up_status: "not_started" }),
      ]);
      const fAlerts = alerts.filter((a) => a.type === "follow_up_overdue");
      expect(fAlerts).toHaveLength(0);
    });

    it("produces exactly one aggregated alert regardless of overdue count", () => {
      const records = Array.from({ length: 10 }, (_, i) =>
        makeRecord({ id: `pd-${i}`, follow_up_status: "overdue" }),
      );
      const alerts = identifyPanelAlerts(records);
      const fAlerts = alerts.filter((a) => a.type === "follow_up_overdue");
      expect(fAlerts).toHaveLength(1);
    });
  });

  // ── child_views_not_considered alerts ───────────────────────────────

  describe("child_views_not_considered alerts", () => {
    it("generates high alert for 1 panel where views not considered with child_name", () => {
      const alerts = identifyPanelAlerts([
        makeRecord({ id: "pd-1", child_views_considered: false, child_name: "Alice" }),
      ]);
      const cAlerts = alerts.filter((a) => a.type === "child_views_not_considered");
      expect(cAlerts).toHaveLength(1);
      expect(cAlerts[0].severity).toBe("high");
    });

    it("sets id to child_views_not_considered for aggregated alert", () => {
      const alerts = identifyPanelAlerts([
        makeRecord({ id: "pd-1", child_views_considered: false, child_name: "Alice" }),
      ]);
      const cAlerts = alerts.filter((a) => a.type === "child_views_not_considered");
      expect(cAlerts[0].id).toBe("child_views_not_considered");
    });

    it("uses singular 'panel' for 1 record", () => {
      const alerts = identifyPanelAlerts([
        makeRecord({ id: "pd-1", child_views_considered: false, child_name: "Alice" }),
      ]);
      const cAlerts = alerts.filter((a) => a.type === "child_views_not_considered");
      expect(cAlerts[0].message).toContain("1 panel");
      expect(cAlerts[0].message).not.toContain("panels");
    });

    it("uses plural 'panels' for 2 records", () => {
      const alerts = identifyPanelAlerts([
        makeRecord({ id: "pd-1", child_views_considered: false, child_name: "Alice" }),
        makeRecord({ id: "pd-2", child_views_considered: false, child_name: "Bob" }),
      ]);
      const cAlerts = alerts.filter((a) => a.type === "child_views_not_considered");
      expect(cAlerts[0].message).toContain("2 panels");
    });

    it("uses plural 'panels' for 3 records", () => {
      const alerts = identifyPanelAlerts([
        makeRecord({ id: "pd-1", child_views_considered: false, child_name: "Alice" }),
        makeRecord({ id: "pd-2", child_views_considered: false, child_name: "Bob" }),
        makeRecord({ id: "pd-3", child_views_considered: false, child_name: "Charlie" }),
      ]);
      const cAlerts = alerts.filter((a) => a.type === "child_views_not_considered");
      expect(cAlerts[0].message).toContain("3 panels");
    });

    it("includes participation guidance in child views message", () => {
      const alerts = identifyPanelAlerts([
        makeRecord({ id: "pd-1", child_views_considered: false, child_name: "Alice" }),
      ]);
      const cAlerts = alerts.filter((a) => a.type === "child_views_not_considered");
      expect(cAlerts[0].message).toContain("ensure participation");
    });

    it("does not count records where child_name is null", () => {
      const alerts = identifyPanelAlerts([
        makeRecord({ id: "pd-1", child_views_considered: false, child_name: null }),
      ]);
      const cAlerts = alerts.filter((a) => a.type === "child_views_not_considered");
      expect(cAlerts).toHaveLength(0);
    });

    it("only counts records with non-null child_name", () => {
      const alerts = identifyPanelAlerts([
        makeRecord({ id: "pd-1", child_views_considered: false, child_name: "Alice" }),
        makeRecord({ id: "pd-2", child_views_considered: false, child_name: null }),
        makeRecord({ id: "pd-3", child_views_considered: false, child_name: "Bob" }),
      ]);
      const cAlerts = alerts.filter((a) => a.type === "child_views_not_considered");
      expect(cAlerts).toHaveLength(1);
      expect(cAlerts[0].message).toContain("2 panels");
    });

    it("does not generate alert when all views considered", () => {
      const alerts = identifyPanelAlerts([
        makeRecord({ id: "pd-1", child_views_considered: true, child_name: "Alice" }),
        makeRecord({ id: "pd-2", child_views_considered: true, child_name: "Bob" }),
      ]);
      const cAlerts = alerts.filter((a) => a.type === "child_views_not_considered");
      expect(cAlerts).toHaveLength(0);
    });

    it("produces exactly one aggregated alert", () => {
      const records = Array.from({ length: 5 }, (_, i) =>
        makeRecord({ id: `pd-${i}`, child_views_considered: false, child_name: `Child ${i}` }),
      );
      const alerts = identifyPanelAlerts(records);
      const cAlerts = alerts.filter((a) => a.type === "child_views_not_considered");
      expect(cAlerts).toHaveLength(1);
    });
  });

  // ── minutes_not_recorded alerts ─────────────────────────────────────

  describe("minutes_not_recorded alerts", () => {
    it("generates medium alert for 1 panel without minutes", () => {
      const alerts = identifyPanelAlerts([
        makeRecord({ id: "pd-1", minutes_recorded: false }),
      ]);
      const mAlerts = alerts.filter((a) => a.type === "minutes_not_recorded");
      expect(mAlerts).toHaveLength(1);
      expect(mAlerts[0].severity).toBe("medium");
    });

    it("sets id to minutes_not_recorded for aggregated alert", () => {
      const alerts = identifyPanelAlerts([
        makeRecord({ id: "pd-1", minutes_recorded: false }),
      ]);
      const mAlerts = alerts.filter((a) => a.type === "minutes_not_recorded");
      expect(mAlerts[0].id).toBe("minutes_not_recorded");
    });

    it("uses singular 'panel' for 1 record", () => {
      const alerts = identifyPanelAlerts([
        makeRecord({ id: "pd-1", minutes_recorded: false }),
      ]);
      const mAlerts = alerts.filter((a) => a.type === "minutes_not_recorded");
      expect(mAlerts[0].message).toContain("1 panel");
      expect(mAlerts[0].message).not.toContain("panels");
    });

    it("uses plural 'panels' for 2 records", () => {
      const alerts = identifyPanelAlerts([
        makeRecord({ id: "pd-1", minutes_recorded: false }),
        makeRecord({ id: "pd-2", minutes_recorded: false }),
      ]);
      const mAlerts = alerts.filter((a) => a.type === "minutes_not_recorded");
      expect(mAlerts[0].message).toContain("2 panels");
    });

    it("uses plural 'panels' for 4 records", () => {
      const records = Array.from({ length: 4 }, (_, i) =>
        makeRecord({ id: `pd-${i}`, minutes_recorded: false }),
      );
      const alerts = identifyPanelAlerts(records);
      const mAlerts = alerts.filter((a) => a.type === "minutes_not_recorded");
      expect(mAlerts[0].message).toContain("4 panels");
    });

    it("includes documentation guidance in minutes message", () => {
      const alerts = identifyPanelAlerts([
        makeRecord({ id: "pd-1", minutes_recorded: false }),
      ]);
      const mAlerts = alerts.filter((a) => a.type === "minutes_not_recorded");
      expect(mAlerts[0].message).toContain("document decisions");
    });

    it("does not generate alert when all minutes recorded", () => {
      const alerts = identifyPanelAlerts([
        makeRecord({ id: "pd-1", minutes_recorded: true }),
        makeRecord({ id: "pd-2", minutes_recorded: true }),
      ]);
      const mAlerts = alerts.filter((a) => a.type === "minutes_not_recorded");
      expect(mAlerts).toHaveLength(0);
    });

    it("produces exactly one aggregated alert", () => {
      const records = Array.from({ length: 8 }, (_, i) =>
        makeRecord({ id: `pd-${i}`, minutes_recorded: false }),
      );
      const alerts = identifyPanelAlerts(records);
      const mAlerts = alerts.filter((a) => a.type === "minutes_not_recorded");
      expect(mAlerts).toHaveLength(1);
    });
  });

  // ── follow_up_not_started alerts ────────────────────────────────────

  describe("follow_up_not_started alerts", () => {
    it("does not generate alert for 1 not_started follow-up", () => {
      const alerts = identifyPanelAlerts([
        makeRecord({ id: "pd-1", follow_up_status: "not_started" }),
      ]);
      const nsAlerts = alerts.filter((a) => a.type === "follow_up_not_started");
      expect(nsAlerts).toHaveLength(0);
    });

    it("generates medium alert for 2 not_started follow-ups", () => {
      const alerts = identifyPanelAlerts([
        makeRecord({ id: "pd-1", follow_up_status: "not_started" }),
        makeRecord({ id: "pd-2", follow_up_status: "not_started" }),
      ]);
      const nsAlerts = alerts.filter((a) => a.type === "follow_up_not_started");
      expect(nsAlerts).toHaveLength(1);
      expect(nsAlerts[0].severity).toBe("medium");
    });

    it("generates medium alert for 3 not_started follow-ups", () => {
      const alerts = identifyPanelAlerts([
        makeRecord({ id: "pd-1", follow_up_status: "not_started" }),
        makeRecord({ id: "pd-2", follow_up_status: "not_started" }),
        makeRecord({ id: "pd-3", follow_up_status: "not_started" }),
      ]);
      const nsAlerts = alerts.filter((a) => a.type === "follow_up_not_started");
      expect(nsAlerts).toHaveLength(1);
    });

    it("sets id to follow_up_not_started for aggregated alert", () => {
      const alerts = identifyPanelAlerts([
        makeRecord({ id: "pd-1", follow_up_status: "not_started" }),
        makeRecord({ id: "pd-2", follow_up_status: "not_started" }),
      ]);
      const nsAlerts = alerts.filter((a) => a.type === "follow_up_not_started");
      expect(nsAlerts[0].id).toBe("follow_up_not_started");
    });

    it("includes count in not_started message", () => {
      const alerts = identifyPanelAlerts([
        makeRecord({ id: "pd-1", follow_up_status: "not_started" }),
        makeRecord({ id: "pd-2", follow_up_status: "not_started" }),
        makeRecord({ id: "pd-3", follow_up_status: "not_started" }),
        makeRecord({ id: "pd-4", follow_up_status: "not_started" }),
      ]);
      const nsAlerts = alerts.filter((a) => a.type === "follow_up_not_started");
      expect(nsAlerts[0].message).toContain("4");
    });

    it("includes prompt action guidance in not_started message", () => {
      const alerts = identifyPanelAlerts([
        makeRecord({ id: "pd-1", follow_up_status: "not_started" }),
        makeRecord({ id: "pd-2", follow_up_status: "not_started" }),
      ]);
      const nsAlerts = alerts.filter((a) => a.type === "follow_up_not_started");
      expect(nsAlerts[0].message).toContain("begin actions promptly");
    });

    it("does not generate alert when no not_started follow-ups", () => {
      const alerts = identifyPanelAlerts([
        makeRecord({ id: "pd-1", follow_up_status: "all_completed" }),
        makeRecord({ id: "pd-2", follow_up_status: "in_progress" }),
      ]);
      const nsAlerts = alerts.filter((a) => a.type === "follow_up_not_started");
      expect(nsAlerts).toHaveLength(0);
    });

    it("produces exactly one aggregated alert for many not_started", () => {
      const records = Array.from({ length: 10 }, (_, i) =>
        makeRecord({ id: `pd-${i}`, follow_up_status: "not_started" }),
      );
      const alerts = identifyPanelAlerts(records);
      const nsAlerts = alerts.filter((a) => a.type === "follow_up_not_started");
      expect(nsAlerts).toHaveLength(1);
    });
  });

  // ── Combined / complex scenarios ────────────────────────────────────

  describe("combined alert scenarios", () => {
    it("generates all alert types simultaneously", () => {
      const alerts = identifyPanelAlerts([
        makeRecord({ id: "pd-1", panel_quorum: "quorum_not_met" }),
        makeRecord({ id: "pd-2", follow_up_status: "overdue" }),
        makeRecord({ id: "pd-3", child_views_considered: false, child_name: "Alice" }),
        makeRecord({ id: "pd-4", minutes_recorded: false }),
        makeRecord({ id: "pd-5", follow_up_status: "not_started" }),
        makeRecord({ id: "pd-6", follow_up_status: "not_started" }),
      ]);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("quorum_not_met");
      expect(types).toContain("follow_up_overdue");
      expect(types).toContain("child_views_not_considered");
      expect(types).toContain("minutes_not_recorded");
      expect(types).toContain("follow_up_not_started");
    });

    it("critical alerts appear in results", () => {
      const alerts = identifyPanelAlerts([
        makeRecord({ id: "pd-1", panel_quorum: "quorum_not_met" }),
        makeRecord({ id: "pd-2", follow_up_status: "overdue" }),
      ]);
      const critical = alerts.filter((a) => a.severity === "critical");
      expect(critical.length).toBeGreaterThanOrEqual(1);
    });

    it("high alerts appear in results", () => {
      const alerts = identifyPanelAlerts([
        makeRecord({ id: "pd-1", follow_up_status: "overdue" }),
        makeRecord({ id: "pd-2", child_views_considered: false, child_name: "Alice" }),
      ]);
      const high = alerts.filter((a) => a.severity === "high");
      expect(high.length).toBeGreaterThanOrEqual(1);
    });

    it("medium alerts appear in results", () => {
      const alerts = identifyPanelAlerts([
        makeRecord({ id: "pd-1", minutes_recorded: false }),
        makeRecord({ id: "pd-2", follow_up_status: "not_started" }),
        makeRecord({ id: "pd-3", follow_up_status: "not_started" }),
      ]);
      const medium = alerts.filter((a) => a.severity === "medium");
      expect(medium.length).toBeGreaterThanOrEqual(1);
    });

    it("all alerts have required fields: type, severity, message, id", () => {
      const alerts = identifyPanelAlerts([
        makeRecord({ id: "pd-1", panel_quorum: "quorum_not_met" }),
        makeRecord({ id: "pd-2", follow_up_status: "overdue" }),
        makeRecord({ id: "pd-3", child_views_considered: false, child_name: "Alice" }),
        makeRecord({ id: "pd-4", minutes_recorded: false }),
        makeRecord({ id: "pd-5", follow_up_status: "not_started" }),
        makeRecord({ id: "pd-6", follow_up_status: "not_started" }),
      ]);
      for (const alert of alerts) {
        expect(alert.type).toBeTruthy();
        expect(alert.severity).toBeTruthy();
        expect(alert.message).toBeTruthy();
        expect(alert.id).toBeTruthy();
      }
    });

    it("all alert severities are valid values", () => {
      const alerts = identifyPanelAlerts([
        makeRecord({ id: "pd-1", panel_quorum: "quorum_not_met" }),
        makeRecord({ id: "pd-2", follow_up_status: "overdue" }),
        makeRecord({ id: "pd-3", minutes_recorded: false }),
      ]);
      const validSeverities = ["critical", "high", "medium"];
      for (const alert of alerts) {
        expect(validSeverities).toContain(alert.severity);
      }
    });

    it("a single record can trigger multiple alert types", () => {
      const alerts = identifyPanelAlerts([
        makeRecord({
          id: "pd-1",
          panel_quorum: "quorum_not_met",
          follow_up_status: "overdue",
          child_views_considered: false,
          child_name: "Alice",
          minutes_recorded: false,
        }),
      ]);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("quorum_not_met");
      expect(types).toContain("follow_up_overdue");
      expect(types).toContain("child_views_not_considered");
      expect(types).toContain("minutes_not_recorded");
    });

    it("does not generate follow_up_not_started with only 1 not_started among other alerts", () => {
      const alerts = identifyPanelAlerts([
        makeRecord({ id: "pd-1", panel_quorum: "quorum_not_met", follow_up_status: "not_started" }),
      ]);
      const nsAlerts = alerts.filter((a) => a.type === "follow_up_not_started");
      expect(nsAlerts).toHaveLength(0);
    });

    it("handles large dataset without errors", () => {
      const records = Array.from({ length: 100 }, (_, i) =>
        makeRecord({
          id: `pd-${i}`,
          panel_quorum: i % 10 === 0 ? "quorum_not_met" : "full_quorum",
          follow_up_status: i % 15 === 0 ? "overdue" : "all_completed",
          minutes_recorded: i % 20 !== 0,
          child_views_considered: i % 25 !== 0,
          child_name: i % 5 === 0 ? `Child ${i}` : null,
        }),
      );
      const alerts = identifyPanelAlerts(records);
      expect(Array.isArray(alerts)).toBe(true);
      expect(alerts.length).toBeGreaterThan(0);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CRUD — Panel Decisions (Supabase disabled)
// ═══════════════════════════════════════════════════════════════════════════

describe("listRecords", () => {
  it("returns ok: true with empty data array when Supabase is disabled", async () => {
    const result = await listRecords("home-1");
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of panelType filter", async () => {
    const result = await listRecords("home-1", { panelType: "admission_panel" });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of panelDecision filter", async () => {
    const result = await listRecords("home-1", { panelDecision: "approved" });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of panelQuorum filter", async () => {
    const result = await listRecords("home-1", { panelQuorum: "full_quorum" });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of limit filter", async () => {
    const result = await listRecords("home-1", { limit: 50 });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of combined filters", async () => {
    const result = await listRecords("home-1", {
      panelType: "matching_panel",
      panelDecision: "declined",
      panelQuorum: "quorum_not_met",
      limit: 25,
    });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });
});

describe("createRecord", () => {
  it("returns ok: false with Supabase not configured error", async () => {
    const result = await createRecord({
      homeId: "home-1",
      panelType: "admission_panel",
      panelDate: "2026-04-01",
      panelDecision: "approved",
      panelQuorum: "full_quorum",
      followUpStatus: "all_completed",
      panelChair: "Chair A",
      panelMembers: ["Member A"],
      childViewsConsidered: true,
      riskAssessmentReviewed: true,
      matchingCriteriaAssessed: true,
      impactOnGroupAssessed: true,
      safeguardingDiscussed: true,
      minutesRecorded: true,
      actionsAgreed: [],
      conditions: [],
      issuesFound: [],
      actionsTaken: [],
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });

  it("returns ok: false with Supabase not configured error with all optional fields", async () => {
    const result = await createRecord({
      homeId: "home-1",
      panelType: "matching_panel",
      panelDate: "2026-05-01",
      panelDecision: "approved_with_conditions",
      panelQuorum: "quorum_met",
      followUpStatus: "in_progress",
      childName: "Alice Smith",
      childId: "child-1",
      panelChair: "Chair B",
      panelMembers: ["Member A", "Member B"],
      childViewsConsidered: true,
      riskAssessmentReviewed: true,
      matchingCriteriaAssessed: true,
      impactOnGroupAssessed: true,
      safeguardingDiscussed: true,
      minutesRecorded: true,
      actionsAgreed: ["Action 1"],
      conditions: ["Condition 1"],
      followUpDate: "2026-06-01",
      issuesFound: ["Issue 1"],
      actionsTaken: ["Taken 1"],
      notes: "Test notes",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });
});

describe("updateRecord", () => {
  it("returns ok: false with Supabase not configured error", async () => {
    const result = await updateRecord("pd-1", { panel_decision: "declined" });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });

  it("returns ok: false with Supabase not configured error with multiple updates", async () => {
    const result = await updateRecord("pd-1", {
      panel_decision: "approved_with_conditions",
      follow_up_status: "overdue",
      minutes_recorded: false,
      notes: "Updated notes",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });
});
