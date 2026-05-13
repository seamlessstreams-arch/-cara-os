// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — EMERGENCY PLACEMENT SERVICE TESTS
// Pure-function unit tests for emergency placement metrics computation,
// alert identification, constant validation, and CRUD fallback behaviour
// (Supabase disabled). CHR 2015 Reg 22 (arrangements when child is absent/
// goes missing), Reg 27 (fitness of premises), Reg 14 (assessment of children),
// Reg 36 (fitness of workers — emergency staffing).
//
// SCCIF: Leadership & Management — "The home responds effectively
// to emergency situations." "Emergency placements are safe."
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeAll } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => false,
  createServerClient: () => null,
}));

import {
  _testing,
  EMERGENCY_REASONS,
  PLACEMENT_DECISIONS,
  RISK_ASSESSMENT_STATUSES,
  POST_ADMISSION_REVIEWS,
  EMERGENCY_STATUSES,
  listPlacements,
  createPlacement,
  updatePlacement,
} from "../emergency-placement-service";

import type {
  EmergencyPlacement,
  EmergencyReason,
  PlacementDecision,
  RiskAssessmentStatus,
  PostAdmissionReview,
  EmergencyStatus,
} from "../emergency-placement-service";

const { computeEmergencyMetrics, identifyEmergencyAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Build a minimal EmergencyPlacement with sensible defaults. */
function makePlacement(overrides: Partial<EmergencyPlacement> = {}): EmergencyPlacement {
  return {
    id: "ep-1",
    home_id: "home-1",
    child_name: "Alice Smith",
    child_id: "child-1",
    referral_date: "2025-06-01",
    referral_time: "14:30",
    emergency_reason: "placement_breakdown",
    referring_authority: "City Council",
    social_worker_name: "Jane Doe",
    placement_decision: "admitted",
    decision_made_by: "Manager A",
    decision_date: "2025-06-01",
    admission_date: "2025-06-01",
    risk_assessment_status: "completed_pre_admission",
    existing_children_consulted: true,
    impact_assessment_completed: true,
    out_of_hours: false,
    emergency_staffing_arranged: true,
    essential_info_received: true,
    care_plan_received: true,
    post_admission_review: "completed_72h",
    emergency_status: "active",
    child_views: null,
    existing_children_views: null,
    notes: null,
    created_at: "2025-06-01T14:30:00.000Z",
    updated_at: "2025-06-01T14:30:00.000Z",
    ...overrides,
  } as EmergencyPlacement;
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

describe("EMERGENCY_REASONS", () => {
  it("has exactly 10 entries", () => {
    expect(EMERGENCY_REASONS).toHaveLength(10);
  });

  it("contains unique reason values", () => {
    const values = EMERGENCY_REASONS.map((r) => r.reason);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = EMERGENCY_REASONS.map((r) => r.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes placement_breakdown", () => {
    expect(EMERGENCY_REASONS.find((r) => r.reason === "placement_breakdown")).toBeTruthy();
  });

  it("includes safeguarding_removal", () => {
    expect(EMERGENCY_REASONS.find((r) => r.reason === "safeguarding_removal")).toBeTruthy();
  });

  it("includes parental_crisis", () => {
    expect(EMERGENCY_REASONS.find((r) => r.reason === "parental_crisis")).toBeTruthy();
  });

  it("includes police_protection", () => {
    expect(EMERGENCY_REASONS.find((r) => r.reason === "police_protection")).toBeTruthy();
  });

  it("includes court_order", () => {
    expect(EMERGENCY_REASONS.find((r) => r.reason === "court_order")).toBeTruthy();
  });

  it("includes asylum_seeker", () => {
    expect(EMERGENCY_REASONS.find((r) => r.reason === "asylum_seeker")).toBeTruthy();
  });

  it("includes hospital_discharge", () => {
    expect(EMERGENCY_REASONS.find((r) => r.reason === "hospital_discharge")).toBeTruthy();
  });

  it("includes homelessness", () => {
    expect(EMERGENCY_REASONS.find((r) => r.reason === "homelessness")).toBeTruthy();
  });

  it("includes remand", () => {
    expect(EMERGENCY_REASONS.find((r) => r.reason === "remand")).toBeTruthy();
  });

  it("includes other", () => {
    expect(EMERGENCY_REASONS.find((r) => r.reason === "other")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const r of EMERGENCY_REASONS) {
      expect(r.label.length).toBeGreaterThan(0);
    }
  });
});

describe("PLACEMENT_DECISIONS", () => {
  it("has exactly 6 entries", () => {
    expect(PLACEMENT_DECISIONS).toHaveLength(6);
  });

  it("contains unique decision values", () => {
    const values = PLACEMENT_DECISIONS.map((d) => d.decision);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = PLACEMENT_DECISIONS.map((d) => d.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes admitted", () => {
    expect(PLACEMENT_DECISIONS.find((d) => d.decision === "admitted")).toBeTruthy();
  });

  it("includes declined_capacity", () => {
    expect(PLACEMENT_DECISIONS.find((d) => d.decision === "declined_capacity")).toBeTruthy();
  });

  it("includes declined_matching", () => {
    expect(PLACEMENT_DECISIONS.find((d) => d.decision === "declined_matching")).toBeTruthy();
  });

  it("includes declined_risk", () => {
    expect(PLACEMENT_DECISIONS.find((d) => d.decision === "declined_risk")).toBeTruthy();
  });

  it("includes referred_elsewhere", () => {
    expect(PLACEMENT_DECISIONS.find((d) => d.decision === "referred_elsewhere")).toBeTruthy();
  });

  it("includes pending", () => {
    expect(PLACEMENT_DECISIONS.find((d) => d.decision === "pending")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const d of PLACEMENT_DECISIONS) {
      expect(d.label.length).toBeGreaterThan(0);
    }
  });
});

describe("RISK_ASSESSMENT_STATUSES", () => {
  it("has exactly 5 entries", () => {
    expect(RISK_ASSESSMENT_STATUSES).toHaveLength(5);
  });

  it("contains unique status values", () => {
    const values = RISK_ASSESSMENT_STATUSES.map((s) => s.status);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = RISK_ASSESSMENT_STATUSES.map((s) => s.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes completed_pre_admission", () => {
    expect(RISK_ASSESSMENT_STATUSES.find((s) => s.status === "completed_pre_admission")).toBeTruthy();
  });

  it("includes completed_on_arrival", () => {
    expect(RISK_ASSESSMENT_STATUSES.find((s) => s.status === "completed_on_arrival")).toBeTruthy();
  });

  it("includes completed_within_24h", () => {
    expect(RISK_ASSESSMENT_STATUSES.find((s) => s.status === "completed_within_24h")).toBeTruthy();
  });

  it("includes not_completed", () => {
    expect(RISK_ASSESSMENT_STATUSES.find((s) => s.status === "not_completed")).toBeTruthy();
  });

  it("includes partial", () => {
    expect(RISK_ASSESSMENT_STATUSES.find((s) => s.status === "partial")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const s of RISK_ASSESSMENT_STATUSES) {
      expect(s.label.length).toBeGreaterThan(0);
    }
  });
});

describe("POST_ADMISSION_REVIEWS", () => {
  it("has exactly 5 entries", () => {
    expect(POST_ADMISSION_REVIEWS).toHaveLength(5);
  });

  it("contains unique review values", () => {
    const values = POST_ADMISSION_REVIEWS.map((r) => r.review);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = POST_ADMISSION_REVIEWS.map((r) => r.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes completed_72h", () => {
    expect(POST_ADMISSION_REVIEWS.find((r) => r.review === "completed_72h")).toBeTruthy();
  });

  it("includes completed_7_day", () => {
    expect(POST_ADMISSION_REVIEWS.find((r) => r.review === "completed_7_day")).toBeTruthy();
  });

  it("includes overdue", () => {
    expect(POST_ADMISSION_REVIEWS.find((r) => r.review === "overdue")).toBeTruthy();
  });

  it("includes not_due", () => {
    expect(POST_ADMISSION_REVIEWS.find((r) => r.review === "not_due")).toBeTruthy();
  });

  it("includes not_applicable", () => {
    expect(POST_ADMISSION_REVIEWS.find((r) => r.review === "not_applicable")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const r of POST_ADMISSION_REVIEWS) {
      expect(r.label.length).toBeGreaterThan(0);
    }
  });
});

describe("EMERGENCY_STATUSES", () => {
  it("has exactly 5 entries", () => {
    expect(EMERGENCY_STATUSES).toHaveLength(5);
  });

  it("contains unique status values", () => {
    const values = EMERGENCY_STATUSES.map((s) => s.status);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = EMERGENCY_STATUSES.map((s) => s.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes active", () => {
    expect(EMERGENCY_STATUSES.find((s) => s.status === "active")).toBeTruthy();
  });

  it("includes resolved", () => {
    expect(EMERGENCY_STATUSES.find((s) => s.status === "resolved")).toBeTruthy();
  });

  it("includes converted_planned", () => {
    expect(EMERGENCY_STATUSES.find((s) => s.status === "converted_planned")).toBeTruthy();
  });

  it("includes ended_early", () => {
    expect(EMERGENCY_STATUSES.find((s) => s.status === "ended_early")).toBeTruthy();
  });

  it("includes ongoing_review", () => {
    expect(EMERGENCY_STATUSES.find((s) => s.status === "ongoing_review")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const s of EMERGENCY_STATUSES) {
      expect(s.label.length).toBeGreaterThan(0);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. computeEmergencyMetrics
// ═══════════════════════════════════════════════════════════════════════════

describe("computeEmergencyMetrics", () => {
  it("returns zeroed metrics for empty placements array", () => {
    const m = computeEmergencyMetrics([]);
    expect(m.total_referrals).toBe(0);
    expect(m.admitted_count).toBe(0);
    expect(m.declined_count).toBe(0);
    expect(m.pending_count).toBe(0);
    expect(m.admission_rate).toBe(0);
    expect(m.out_of_hours_count).toBe(0);
    expect(m.out_of_hours_rate).toBe(0);
    expect(m.risk_completed_pre_admission).toBe(0);
    expect(m.risk_not_completed).toBe(0);
    expect(m.existing_children_consulted_rate).toBe(0);
    expect(m.impact_assessed_rate).toBe(0);
    expect(m.essential_info_rate).toBe(0);
    expect(m.care_plan_rate).toBe(0);
    expect(m.post_review_completed_rate).toBe(0);
    expect(m.post_review_overdue).toBe(0);
    expect(m.active_emergencies).toBe(0);
    expect(m.child_views_rate).toBe(0);
    expect(Object.keys(m.by_emergency_reason)).toHaveLength(0);
    expect(Object.keys(m.by_placement_decision)).toHaveLength(0);
    expect(Object.keys(m.by_risk_status)).toHaveLength(0);
    expect(Object.keys(m.by_emergency_status)).toHaveLength(0);
  });

  // ── total_referrals ────────────────────────────────────────────────

  it("total_referrals equals the number of placements", () => {
    const placements = [
      makePlacement({ id: "ep1" }),
      makePlacement({ id: "ep2" }),
      makePlacement({ id: "ep3" }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.total_referrals).toBe(3);
  });

  it("total_referrals is 1 for single placement", () => {
    const m = computeEmergencyMetrics([makePlacement()]);
    expect(m.total_referrals).toBe(1);
  });

  // ── admitted_count ─────────────────────────────────────────────────

  it("admitted_count counts placements with decision admitted", () => {
    const placements = [
      makePlacement({ id: "ep1", placement_decision: "admitted" }),
      makePlacement({ id: "ep2", placement_decision: "admitted" }),
      makePlacement({ id: "ep3", placement_decision: "declined_capacity" }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.admitted_count).toBe(2);
  });

  it("admitted_count is 0 when no placements are admitted", () => {
    const placements = [
      makePlacement({ id: "ep1", placement_decision: "declined_risk" }),
      makePlacement({ id: "ep2", placement_decision: "pending" }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.admitted_count).toBe(0);
  });

  // ── declined_count ─────────────────────────────────────────────────

  it("declined_count counts declined_capacity placements", () => {
    const placements = [
      makePlacement({ id: "ep1", placement_decision: "declined_capacity" }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.declined_count).toBe(1);
  });

  it("declined_count counts declined_matching placements", () => {
    const placements = [
      makePlacement({ id: "ep1", placement_decision: "declined_matching" }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.declined_count).toBe(1);
  });

  it("declined_count counts declined_risk placements", () => {
    const placements = [
      makePlacement({ id: "ep1", placement_decision: "declined_risk" }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.declined_count).toBe(1);
  });

  it("declined_count sums all three declined types", () => {
    const placements = [
      makePlacement({ id: "ep1", placement_decision: "declined_capacity" }),
      makePlacement({ id: "ep2", placement_decision: "declined_matching" }),
      makePlacement({ id: "ep3", placement_decision: "declined_risk" }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.declined_count).toBe(3);
  });

  it("declined_count excludes referred_elsewhere and pending", () => {
    const placements = [
      makePlacement({ id: "ep1", placement_decision: "referred_elsewhere" }),
      makePlacement({ id: "ep2", placement_decision: "pending" }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.declined_count).toBe(0);
  });

  it("declined_count is 0 when all are admitted", () => {
    const placements = [
      makePlacement({ id: "ep1", placement_decision: "admitted" }),
      makePlacement({ id: "ep2", placement_decision: "admitted" }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.declined_count).toBe(0);
  });

  // ── pending_count ──────────────────────────────────────────────────

  it("pending_count counts pending placements", () => {
    const placements = [
      makePlacement({ id: "ep1", placement_decision: "pending" }),
      makePlacement({ id: "ep2", placement_decision: "pending" }),
      makePlacement({ id: "ep3", placement_decision: "admitted" }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.pending_count).toBe(2);
  });

  it("pending_count is 0 when no pending placements", () => {
    const placements = [
      makePlacement({ id: "ep1", placement_decision: "admitted" }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.pending_count).toBe(0);
  });

  // ── admission_rate ─────────────────────────────────────────────────

  it("admission_rate is 100 when all placements are admitted", () => {
    const placements = [
      makePlacement({ id: "ep1", placement_decision: "admitted" }),
      makePlacement({ id: "ep2", placement_decision: "admitted" }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.admission_rate).toBe(100);
  });

  it("admission_rate is 0 when no placements are admitted", () => {
    const placements = [
      makePlacement({ id: "ep1", placement_decision: "pending" }),
      makePlacement({ id: "ep2", placement_decision: "declined_risk" }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.admission_rate).toBe(0);
  });

  it("admission_rate is 50 when half are admitted", () => {
    const placements = [
      makePlacement({ id: "ep1", placement_decision: "admitted" }),
      makePlacement({ id: "ep2", placement_decision: "declined_capacity" }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.admission_rate).toBe(50);
  });

  it("admission_rate rounds to one decimal place", () => {
    const placements = [
      makePlacement({ id: "ep1", placement_decision: "admitted" }),
      makePlacement({ id: "ep2", placement_decision: "declined_capacity" }),
      makePlacement({ id: "ep3", placement_decision: "declined_risk" }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.admission_rate).toBe(33.3);
  });

  it("admission_rate is 0 for empty placements", () => {
    const m = computeEmergencyMetrics([]);
    expect(m.admission_rate).toBe(0);
  });

  // ── out_of_hours_count & out_of_hours_rate ─────────────────────────

  it("out_of_hours_count counts out-of-hours placements", () => {
    const placements = [
      makePlacement({ id: "ep1", out_of_hours: true }),
      makePlacement({ id: "ep2", out_of_hours: true }),
      makePlacement({ id: "ep3", out_of_hours: false }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.out_of_hours_count).toBe(2);
  });

  it("out_of_hours_count is 0 when none are out of hours", () => {
    const placements = [
      makePlacement({ id: "ep1", out_of_hours: false }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.out_of_hours_count).toBe(0);
  });

  it("out_of_hours_rate is 100 when all are out of hours", () => {
    const placements = [
      makePlacement({ id: "ep1", out_of_hours: true }),
      makePlacement({ id: "ep2", out_of_hours: true }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.out_of_hours_rate).toBe(100);
  });

  it("out_of_hours_rate is 0 when none are out of hours", () => {
    const placements = [
      makePlacement({ id: "ep1", out_of_hours: false }),
      makePlacement({ id: "ep2", out_of_hours: false }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.out_of_hours_rate).toBe(0);
  });

  it("out_of_hours_rate rounds to one decimal place", () => {
    const placements = [
      makePlacement({ id: "ep1", out_of_hours: true }),
      makePlacement({ id: "ep2", out_of_hours: false }),
      makePlacement({ id: "ep3", out_of_hours: false }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.out_of_hours_rate).toBe(33.3);
  });

  it("out_of_hours_rate is 0 for empty placements", () => {
    const m = computeEmergencyMetrics([]);
    expect(m.out_of_hours_rate).toBe(0);
  });

  // ── risk_completed_pre_admission ───────────────────────────────────

  it("risk_completed_pre_admission counts pre-admission risk assessments", () => {
    const placements = [
      makePlacement({ id: "ep1", risk_assessment_status: "completed_pre_admission" }),
      makePlacement({ id: "ep2", risk_assessment_status: "completed_pre_admission" }),
      makePlacement({ id: "ep3", risk_assessment_status: "completed_on_arrival" }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.risk_completed_pre_admission).toBe(2);
  });

  it("risk_completed_pre_admission is 0 when none completed pre-admission", () => {
    const placements = [
      makePlacement({ id: "ep1", risk_assessment_status: "not_completed" }),
      makePlacement({ id: "ep2", risk_assessment_status: "partial" }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.risk_completed_pre_admission).toBe(0);
  });

  // ── risk_not_completed ─────────────────────────────────────────────

  it("risk_not_completed counts placements with risk not completed", () => {
    const placements = [
      makePlacement({ id: "ep1", risk_assessment_status: "not_completed" }),
      makePlacement({ id: "ep2", risk_assessment_status: "not_completed" }),
      makePlacement({ id: "ep3", risk_assessment_status: "completed_pre_admission" }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.risk_not_completed).toBe(2);
  });

  it("risk_not_completed is 0 when all risks are completed or partial", () => {
    const placements = [
      makePlacement({ id: "ep1", risk_assessment_status: "completed_pre_admission" }),
      makePlacement({ id: "ep2", risk_assessment_status: "partial" }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.risk_not_completed).toBe(0);
  });

  // ── existing_children_consulted_rate (over admitted only) ──────────

  it("existing_children_consulted_rate is 100 when all admitted have consulted", () => {
    const placements = [
      makePlacement({ id: "ep1", placement_decision: "admitted", existing_children_consulted: true }),
      makePlacement({ id: "ep2", placement_decision: "admitted", existing_children_consulted: true }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.existing_children_consulted_rate).toBe(100);
  });

  it("existing_children_consulted_rate is 0 when no admitted have consulted", () => {
    const placements = [
      makePlacement({ id: "ep1", placement_decision: "admitted", existing_children_consulted: false }),
      makePlacement({ id: "ep2", placement_decision: "admitted", existing_children_consulted: false }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.existing_children_consulted_rate).toBe(0);
  });

  it("existing_children_consulted_rate is 50 when half of admitted have consulted", () => {
    const placements = [
      makePlacement({ id: "ep1", placement_decision: "admitted", existing_children_consulted: true }),
      makePlacement({ id: "ep2", placement_decision: "admitted", existing_children_consulted: false }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.existing_children_consulted_rate).toBe(50);
  });

  it("existing_children_consulted_rate ignores non-admitted placements", () => {
    const placements = [
      makePlacement({ id: "ep1", placement_decision: "admitted", existing_children_consulted: true }),
      makePlacement({ id: "ep2", placement_decision: "declined_capacity", existing_children_consulted: false }),
      makePlacement({ id: "ep3", placement_decision: "pending", existing_children_consulted: false }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.existing_children_consulted_rate).toBe(100);
  });

  it("existing_children_consulted_rate is 0 when no admitted placements", () => {
    const placements = [
      makePlacement({ id: "ep1", placement_decision: "pending", existing_children_consulted: true }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.existing_children_consulted_rate).toBe(0);
  });

  it("existing_children_consulted_rate rounds to one decimal place", () => {
    const placements = [
      makePlacement({ id: "ep1", placement_decision: "admitted", existing_children_consulted: true }),
      makePlacement({ id: "ep2", placement_decision: "admitted", existing_children_consulted: false }),
      makePlacement({ id: "ep3", placement_decision: "admitted", existing_children_consulted: false }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.existing_children_consulted_rate).toBe(33.3);
  });

  // ── impact_assessed_rate (over admitted only) ──────────────────────

  it("impact_assessed_rate is 100 when all admitted have impact assessed", () => {
    const placements = [
      makePlacement({ id: "ep1", placement_decision: "admitted", impact_assessment_completed: true }),
      makePlacement({ id: "ep2", placement_decision: "admitted", impact_assessment_completed: true }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.impact_assessed_rate).toBe(100);
  });

  it("impact_assessed_rate is 0 when no admitted have impact assessed", () => {
    const placements = [
      makePlacement({ id: "ep1", placement_decision: "admitted", impact_assessment_completed: false }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.impact_assessed_rate).toBe(0);
  });

  it("impact_assessed_rate ignores non-admitted placements", () => {
    const placements = [
      makePlacement({ id: "ep1", placement_decision: "admitted", impact_assessment_completed: true }),
      makePlacement({ id: "ep2", placement_decision: "declined_risk", impact_assessment_completed: false }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.impact_assessed_rate).toBe(100);
  });

  it("impact_assessed_rate is 0 when no admitted placements", () => {
    const placements = [
      makePlacement({ id: "ep1", placement_decision: "pending", impact_assessment_completed: true }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.impact_assessed_rate).toBe(0);
  });

  it("impact_assessed_rate rounds to one decimal place", () => {
    const placements = [
      makePlacement({ id: "ep1", placement_decision: "admitted", impact_assessment_completed: true }),
      makePlacement({ id: "ep2", placement_decision: "admitted", impact_assessment_completed: true }),
      makePlacement({ id: "ep3", placement_decision: "admitted", impact_assessment_completed: false }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.impact_assessed_rate).toBe(66.7);
  });

  // ── essential_info_rate (over admitted only) ───────────────────────

  it("essential_info_rate is 100 when all admitted received essential info", () => {
    const placements = [
      makePlacement({ id: "ep1", placement_decision: "admitted", essential_info_received: true }),
      makePlacement({ id: "ep2", placement_decision: "admitted", essential_info_received: true }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.essential_info_rate).toBe(100);
  });

  it("essential_info_rate is 0 when no admitted received essential info", () => {
    const placements = [
      makePlacement({ id: "ep1", placement_decision: "admitted", essential_info_received: false }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.essential_info_rate).toBe(0);
  });

  it("essential_info_rate ignores non-admitted placements", () => {
    const placements = [
      makePlacement({ id: "ep1", placement_decision: "admitted", essential_info_received: true }),
      makePlacement({ id: "ep2", placement_decision: "referred_elsewhere", essential_info_received: false }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.essential_info_rate).toBe(100);
  });

  it("essential_info_rate is 0 when no admitted placements", () => {
    const placements = [
      makePlacement({ id: "ep1", placement_decision: "declined_matching", essential_info_received: true }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.essential_info_rate).toBe(0);
  });

  it("essential_info_rate rounds to one decimal place", () => {
    const placements = [
      makePlacement({ id: "ep1", placement_decision: "admitted", essential_info_received: true }),
      makePlacement({ id: "ep2", placement_decision: "admitted", essential_info_received: false }),
      makePlacement({ id: "ep3", placement_decision: "admitted", essential_info_received: false }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.essential_info_rate).toBe(33.3);
  });

  // ── care_plan_rate (over admitted only) ────────────────────────────

  it("care_plan_rate is 100 when all admitted received care plans", () => {
    const placements = [
      makePlacement({ id: "ep1", placement_decision: "admitted", care_plan_received: true }),
      makePlacement({ id: "ep2", placement_decision: "admitted", care_plan_received: true }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.care_plan_rate).toBe(100);
  });

  it("care_plan_rate is 0 when no admitted received care plans", () => {
    const placements = [
      makePlacement({ id: "ep1", placement_decision: "admitted", care_plan_received: false }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.care_plan_rate).toBe(0);
  });

  it("care_plan_rate ignores non-admitted placements", () => {
    const placements = [
      makePlacement({ id: "ep1", placement_decision: "admitted", care_plan_received: true }),
      makePlacement({ id: "ep2", placement_decision: "pending", care_plan_received: false }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.care_plan_rate).toBe(100);
  });

  it("care_plan_rate is 0 when no admitted placements", () => {
    const placements = [
      makePlacement({ id: "ep1", placement_decision: "declined_capacity", care_plan_received: true }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.care_plan_rate).toBe(0);
  });

  it("care_plan_rate rounds to one decimal place", () => {
    const placements = [
      makePlacement({ id: "ep1", placement_decision: "admitted", care_plan_received: true }),
      makePlacement({ id: "ep2", placement_decision: "admitted", care_plan_received: true }),
      makePlacement({ id: "ep3", placement_decision: "admitted", care_plan_received: false }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.care_plan_rate).toBe(66.7);
  });

  // ── post_review_completed_rate (filters out not_applicable and not_due) ──

  it("post_review_completed_rate is 100 when all reviewable are completed", () => {
    const placements = [
      makePlacement({ id: "ep1", placement_decision: "admitted", post_admission_review: "completed_72h" }),
      makePlacement({ id: "ep2", placement_decision: "admitted", post_admission_review: "completed_7_day" }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.post_review_completed_rate).toBe(100);
  });

  it("post_review_completed_rate is 0 when all reviewable are overdue", () => {
    const placements = [
      makePlacement({ id: "ep1", placement_decision: "admitted", post_admission_review: "overdue" }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.post_review_completed_rate).toBe(0);
  });

  it("post_review_completed_rate excludes not_applicable from denominator", () => {
    const placements = [
      makePlacement({ id: "ep1", placement_decision: "admitted", post_admission_review: "completed_72h" }),
      makePlacement({ id: "ep2", placement_decision: "admitted", post_admission_review: "not_applicable" }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.post_review_completed_rate).toBe(100);
  });

  it("post_review_completed_rate excludes not_due from denominator", () => {
    const placements = [
      makePlacement({ id: "ep1", placement_decision: "admitted", post_admission_review: "completed_72h" }),
      makePlacement({ id: "ep2", placement_decision: "admitted", post_admission_review: "not_due" }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.post_review_completed_rate).toBe(100);
  });

  it("post_review_completed_rate is 0 when all are not_applicable", () => {
    const placements = [
      makePlacement({ id: "ep1", placement_decision: "admitted", post_admission_review: "not_applicable" }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.post_review_completed_rate).toBe(0);
  });

  it("post_review_completed_rate is 0 when all are not_due", () => {
    const placements = [
      makePlacement({ id: "ep1", placement_decision: "admitted", post_admission_review: "not_due" }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.post_review_completed_rate).toBe(0);
  });

  it("post_review_completed_rate rounds to one decimal place", () => {
    const placements = [
      makePlacement({ id: "ep1", placement_decision: "admitted", post_admission_review: "completed_72h" }),
      makePlacement({ id: "ep2", placement_decision: "admitted", post_admission_review: "overdue" }),
      makePlacement({ id: "ep3", placement_decision: "admitted", post_admission_review: "overdue" }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.post_review_completed_rate).toBe(33.3);
  });

  it("post_review_completed_rate counts completed_7_day as completed", () => {
    const placements = [
      makePlacement({ id: "ep1", placement_decision: "admitted", post_admission_review: "completed_7_day" }),
      makePlacement({ id: "ep2", placement_decision: "admitted", post_admission_review: "overdue" }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.post_review_completed_rate).toBe(50);
  });

  it("post_review_completed_rate only considers admitted placements", () => {
    const placements = [
      makePlacement({ id: "ep1", placement_decision: "admitted", post_admission_review: "completed_72h" }),
      makePlacement({ id: "ep2", placement_decision: "declined_capacity", post_admission_review: "overdue" }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.post_review_completed_rate).toBe(100);
  });

  // ── post_review_overdue ────────────────────────────────────────────

  it("post_review_overdue counts admitted placements with overdue review", () => {
    const placements = [
      makePlacement({ id: "ep1", placement_decision: "admitted", post_admission_review: "overdue" }),
      makePlacement({ id: "ep2", placement_decision: "admitted", post_admission_review: "overdue" }),
      makePlacement({ id: "ep3", placement_decision: "admitted", post_admission_review: "completed_72h" }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.post_review_overdue).toBe(2);
  });

  it("post_review_overdue is 0 when no reviews are overdue", () => {
    const placements = [
      makePlacement({ id: "ep1", placement_decision: "admitted", post_admission_review: "completed_72h" }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.post_review_overdue).toBe(0);
  });

  // ── active_emergencies ─────────────────────────────────────────────

  it("active_emergencies counts placements with active status", () => {
    const placements = [
      makePlacement({ id: "ep1", emergency_status: "active" }),
      makePlacement({ id: "ep2", emergency_status: "active" }),
      makePlacement({ id: "ep3", emergency_status: "resolved" }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.active_emergencies).toBe(2);
  });

  it("active_emergencies is 0 when no active emergencies", () => {
    const placements = [
      makePlacement({ id: "ep1", emergency_status: "resolved" }),
      makePlacement({ id: "ep2", emergency_status: "converted_planned" }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.active_emergencies).toBe(0);
  });

  it("active_emergencies does not count other statuses", () => {
    const placements = [
      makePlacement({ id: "ep1", emergency_status: "resolved" }),
      makePlacement({ id: "ep2", emergency_status: "converted_planned" }),
      makePlacement({ id: "ep3", emergency_status: "ended_early" }),
      makePlacement({ id: "ep4", emergency_status: "ongoing_review" }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.active_emergencies).toBe(0);
  });

  // ── child_views_rate (over all placements) ─────────────────────────

  it("child_views_rate is 100 when all placements have child views", () => {
    const placements = [
      makePlacement({ id: "ep1", child_views: "Views here" }),
      makePlacement({ id: "ep2", child_views: "More views" }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.child_views_rate).toBe(100);
  });

  it("child_views_rate is 0 when no placements have child views", () => {
    const placements = [
      makePlacement({ id: "ep1", child_views: null }),
      makePlacement({ id: "ep2", child_views: null }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.child_views_rate).toBe(0);
  });

  it("child_views_rate is 50 when half have child views", () => {
    const placements = [
      makePlacement({ id: "ep1", child_views: "Views" }),
      makePlacement({ id: "ep2", child_views: null }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.child_views_rate).toBe(50);
  });

  it("child_views_rate rounds to one decimal place", () => {
    const placements = [
      makePlacement({ id: "ep1", child_views: "Yes" }),
      makePlacement({ id: "ep2", child_views: null }),
      makePlacement({ id: "ep3", child_views: null }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.child_views_rate).toBe(33.3);
  });

  it("child_views_rate is 0 for empty placements", () => {
    const m = computeEmergencyMetrics([]);
    expect(m.child_views_rate).toBe(0);
  });

  it("child_views_rate counts non-null values including empty string", () => {
    const placements = [
      makePlacement({ id: "ep1", child_views: "" }),
      makePlacement({ id: "ep2", child_views: null }),
    ];
    const m = computeEmergencyMetrics(placements);
    // empty string is not null, so it counts
    expect(m.child_views_rate).toBe(50);
  });

  // ── by_emergency_reason ────────────────────────────────────────────

  it("by_emergency_reason groups counts by reason", () => {
    const placements = [
      makePlacement({ id: "ep1", emergency_reason: "placement_breakdown" }),
      makePlacement({ id: "ep2", emergency_reason: "placement_breakdown" }),
      makePlacement({ id: "ep3", emergency_reason: "court_order" }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.by_emergency_reason["placement_breakdown"]).toBe(2);
    expect(m.by_emergency_reason["court_order"]).toBe(1);
  });

  it("by_emergency_reason is empty for no placements", () => {
    const m = computeEmergencyMetrics([]);
    expect(Object.keys(m.by_emergency_reason)).toHaveLength(0);
  });

  it("by_emergency_reason has one entry per unique reason", () => {
    const placements = [
      makePlacement({ id: "ep1", emergency_reason: "placement_breakdown" }),
      makePlacement({ id: "ep2", emergency_reason: "court_order" }),
      makePlacement({ id: "ep3", emergency_reason: "homelessness" }),
      makePlacement({ id: "ep4", emergency_reason: "court_order" }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(Object.keys(m.by_emergency_reason)).toHaveLength(3);
  });

  it("by_emergency_reason values sum to total_referrals", () => {
    const placements = [
      makePlacement({ id: "ep1", emergency_reason: "placement_breakdown" }),
      makePlacement({ id: "ep2", emergency_reason: "safeguarding_removal" }),
      makePlacement({ id: "ep3", emergency_reason: "placement_breakdown" }),
      makePlacement({ id: "ep4", emergency_reason: "other" }),
    ];
    const m = computeEmergencyMetrics(placements);
    const sum = Object.values(m.by_emergency_reason).reduce((a, b) => a + b, 0);
    expect(sum).toBe(m.total_referrals);
  });

  it("by_emergency_reason has 10 entries when all reasons represented", () => {
    const reasons: EmergencyReason[] = [
      "placement_breakdown", "safeguarding_removal", "parental_crisis", "police_protection",
      "court_order", "asylum_seeker", "hospital_discharge", "homelessness", "remand", "other",
    ];
    const placements = reasons.map((reason, i) =>
      makePlacement({ id: `ep${i}`, emergency_reason: reason }),
    );
    const m = computeEmergencyMetrics(placements);
    expect(Object.keys(m.by_emergency_reason)).toHaveLength(10);
  });

  // ── by_placement_decision ──────────────────────────────────────────

  it("by_placement_decision groups counts by decision", () => {
    const placements = [
      makePlacement({ id: "ep1", placement_decision: "admitted" }),
      makePlacement({ id: "ep2", placement_decision: "admitted" }),
      makePlacement({ id: "ep3", placement_decision: "pending" }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.by_placement_decision["admitted"]).toBe(2);
    expect(m.by_placement_decision["pending"]).toBe(1);
  });

  it("by_placement_decision is empty for no placements", () => {
    const m = computeEmergencyMetrics([]);
    expect(Object.keys(m.by_placement_decision)).toHaveLength(0);
  });

  it("by_placement_decision values sum to total_referrals", () => {
    const placements = [
      makePlacement({ id: "ep1", placement_decision: "admitted" }),
      makePlacement({ id: "ep2", placement_decision: "declined_capacity" }),
      makePlacement({ id: "ep3", placement_decision: "pending" }),
    ];
    const m = computeEmergencyMetrics(placements);
    const sum = Object.values(m.by_placement_decision).reduce((a, b) => a + b, 0);
    expect(sum).toBe(m.total_referrals);
  });

  it("by_placement_decision has 6 entries when all decisions represented", () => {
    const decisions: PlacementDecision[] = [
      "admitted", "declined_capacity", "declined_matching", "declined_risk", "referred_elsewhere", "pending",
    ];
    const placements = decisions.map((decision, i) =>
      makePlacement({ id: `ep${i}`, placement_decision: decision }),
    );
    const m = computeEmergencyMetrics(placements);
    expect(Object.keys(m.by_placement_decision)).toHaveLength(6);
  });

  // ── by_risk_status ─────────────────────────────────────────────────

  it("by_risk_status groups counts by risk assessment status", () => {
    const placements = [
      makePlacement({ id: "ep1", risk_assessment_status: "completed_pre_admission" }),
      makePlacement({ id: "ep2", risk_assessment_status: "completed_pre_admission" }),
      makePlacement({ id: "ep3", risk_assessment_status: "not_completed" }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.by_risk_status["completed_pre_admission"]).toBe(2);
    expect(m.by_risk_status["not_completed"]).toBe(1);
  });

  it("by_risk_status is empty for no placements", () => {
    const m = computeEmergencyMetrics([]);
    expect(Object.keys(m.by_risk_status)).toHaveLength(0);
  });

  it("by_risk_status values sum to total_referrals", () => {
    const placements = [
      makePlacement({ id: "ep1", risk_assessment_status: "completed_pre_admission" }),
      makePlacement({ id: "ep2", risk_assessment_status: "partial" }),
      makePlacement({ id: "ep3", risk_assessment_status: "not_completed" }),
    ];
    const m = computeEmergencyMetrics(placements);
    const sum = Object.values(m.by_risk_status).reduce((a, b) => a + b, 0);
    expect(sum).toBe(m.total_referrals);
  });

  it("by_risk_status has 5 entries when all statuses represented", () => {
    const statuses: RiskAssessmentStatus[] = [
      "completed_pre_admission", "completed_on_arrival", "completed_within_24h", "not_completed", "partial",
    ];
    const placements = statuses.map((status, i) =>
      makePlacement({ id: `ep${i}`, risk_assessment_status: status }),
    );
    const m = computeEmergencyMetrics(placements);
    expect(Object.keys(m.by_risk_status)).toHaveLength(5);
  });

  // ── by_emergency_status ────────────────────────────────────────────

  it("by_emergency_status groups counts by emergency status", () => {
    const placements = [
      makePlacement({ id: "ep1", emergency_status: "active" }),
      makePlacement({ id: "ep2", emergency_status: "active" }),
      makePlacement({ id: "ep3", emergency_status: "resolved" }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.by_emergency_status["active"]).toBe(2);
    expect(m.by_emergency_status["resolved"]).toBe(1);
  });

  it("by_emergency_status is empty for no placements", () => {
    const m = computeEmergencyMetrics([]);
    expect(Object.keys(m.by_emergency_status)).toHaveLength(0);
  });

  it("by_emergency_status values sum to total_referrals", () => {
    const placements = [
      makePlacement({ id: "ep1", emergency_status: "active" }),
      makePlacement({ id: "ep2", emergency_status: "resolved" }),
      makePlacement({ id: "ep3", emergency_status: "ended_early" }),
    ];
    const m = computeEmergencyMetrics(placements);
    const sum = Object.values(m.by_emergency_status).reduce((a, b) => a + b, 0);
    expect(sum).toBe(m.total_referrals);
  });

  it("by_emergency_status has 5 entries when all statuses represented", () => {
    const statuses: EmergencyStatus[] = [
      "active", "resolved", "converted_planned", "ended_early", "ongoing_review",
    ];
    const placements = statuses.map((status, i) =>
      makePlacement({ id: `ep${i}`, emergency_status: status }),
    );
    const m = computeEmergencyMetrics(placements);
    expect(Object.keys(m.by_emergency_status)).toHaveLength(5);
  });

  // ── mixed multi-placement scenario ─────────────────────────────────

  it("correctly computes metrics for mixed multi-placement scenario", () => {
    const placements = [
      makePlacement({
        id: "ep1", placement_decision: "admitted", out_of_hours: true,
        risk_assessment_status: "completed_pre_admission",
        existing_children_consulted: true, impact_assessment_completed: true,
        essential_info_received: true, care_plan_received: true,
        post_admission_review: "completed_72h", emergency_status: "active",
        child_views: "Feels safe", emergency_reason: "placement_breakdown",
      }),
      makePlacement({
        id: "ep2", placement_decision: "admitted", out_of_hours: false,
        risk_assessment_status: "not_completed",
        existing_children_consulted: false, impact_assessment_completed: false,
        essential_info_received: false, care_plan_received: false,
        post_admission_review: "overdue", emergency_status: "active",
        child_views: null, emergency_reason: "safeguarding_removal",
      }),
      makePlacement({
        id: "ep3", placement_decision: "declined_capacity", out_of_hours: true,
        risk_assessment_status: "partial",
        existing_children_consulted: false, impact_assessment_completed: false,
        essential_info_received: false, care_plan_received: false,
        post_admission_review: "not_applicable", emergency_status: "resolved",
        child_views: null, emergency_reason: "court_order",
      }),
      makePlacement({
        id: "ep4", placement_decision: "pending", out_of_hours: false,
        risk_assessment_status: "completed_on_arrival",
        existing_children_consulted: false, impact_assessment_completed: false,
        essential_info_received: false, care_plan_received: false,
        post_admission_review: "not_due", emergency_status: "ongoing_review",
        child_views: "Scared", emergency_reason: "police_protection",
      }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.total_referrals).toBe(4);
    expect(m.admitted_count).toBe(2);
    expect(m.declined_count).toBe(1);
    expect(m.pending_count).toBe(1);
    expect(m.admission_rate).toBe(50);
    expect(m.out_of_hours_count).toBe(2);
    expect(m.out_of_hours_rate).toBe(50);
    expect(m.risk_completed_pre_admission).toBe(1);
    expect(m.risk_not_completed).toBe(1);
    expect(m.existing_children_consulted_rate).toBe(50);
    expect(m.impact_assessed_rate).toBe(50);
    expect(m.essential_info_rate).toBe(50);
    expect(m.care_plan_rate).toBe(50);
    expect(m.post_review_completed_rate).toBe(50);
    expect(m.post_review_overdue).toBe(1);
    expect(m.active_emergencies).toBe(2);
    expect(m.child_views_rate).toBe(50);
    expect(m.by_emergency_reason["placement_breakdown"]).toBe(1);
    expect(m.by_emergency_reason["safeguarding_removal"]).toBe(1);
    expect(m.by_emergency_reason["court_order"]).toBe(1);
    expect(m.by_emergency_reason["police_protection"]).toBe(1);
    expect(m.by_placement_decision["admitted"]).toBe(2);
    expect(m.by_placement_decision["declined_capacity"]).toBe(1);
    expect(m.by_placement_decision["pending"]).toBe(1);
  });

  // ── large dataset ──────────────────────────────────────────────────

  it("handles large placements array efficiently", () => {
    const reasons: EmergencyReason[] = [
      "placement_breakdown", "safeguarding_removal", "parental_crisis",
      "police_protection", "court_order", "asylum_seeker",
      "hospital_discharge", "homelessness", "remand", "other",
    ];
    const decisions: PlacementDecision[] = [
      "admitted", "declined_capacity", "declined_matching",
      "declined_risk", "referred_elsewhere", "pending",
    ];
    const placements: EmergencyPlacement[] = [];
    for (let i = 0; i < 100; i++) {
      placements.push(
        makePlacement({
          id: `ep-${i}`,
          emergency_reason: reasons[i % 10],
          placement_decision: decisions[i % 6],
          out_of_hours: i % 3 === 0,
          child_views: i % 2 === 0 ? "views" : null,
          emergency_status: i % 5 === 0 ? "active" : "resolved",
        }),
      );
    }
    const m = computeEmergencyMetrics(placements);
    expect(m.total_referrals).toBe(100);
    expect(m.out_of_hours_count).toBe(34);
  });

  // ── single admitted placement ──────────────────────────────────────

  it("single admitted placement with all flags true", () => {
    const placements = [
      makePlacement({
        id: "ep1",
        placement_decision: "admitted",
        existing_children_consulted: true,
        impact_assessment_completed: true,
        essential_info_received: true,
        care_plan_received: true,
        post_admission_review: "completed_72h",
      }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.existing_children_consulted_rate).toBe(100);
    expect(m.impact_assessed_rate).toBe(100);
    expect(m.essential_info_rate).toBe(100);
    expect(m.care_plan_rate).toBe(100);
    expect(m.post_review_completed_rate).toBe(100);
  });

  it("single admitted placement with all flags false", () => {
    const placements = [
      makePlacement({
        id: "ep1",
        placement_decision: "admitted",
        existing_children_consulted: false,
        impact_assessment_completed: false,
        essential_info_received: false,
        care_plan_received: false,
        post_admission_review: "overdue",
      }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.existing_children_consulted_rate).toBe(0);
    expect(m.impact_assessed_rate).toBe(0);
    expect(m.essential_info_rate).toBe(0);
    expect(m.care_plan_rate).toBe(0);
    expect(m.post_review_completed_rate).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. identifyEmergencyAlerts
// ═══════════════════════════════════════════════════════════════════════════

describe("identifyEmergencyAlerts", () => {
  // ── no alerts when clean ───────────────────────────────────────────

  it("returns empty array for empty placements", () => {
    const alerts = identifyEmergencyAlerts([]);
    expect(alerts).toEqual([]);
  });

  it("returns empty array when all data is clean", () => {
    const placements = [
      makePlacement({
        id: "ep1", placement_decision: "admitted",
        risk_assessment_status: "completed_pre_admission",
        post_admission_review: "completed_72h",
        existing_children_consulted: true,
        essential_info_received: true,
      }),
    ];
    const alerts = identifyEmergencyAlerts(placements);
    expect(alerts).toEqual([]);
  });

  it("returns empty array for non-admitted clean placements", () => {
    const placements = [
      makePlacement({
        id: "ep1", placement_decision: "declined_capacity",
        risk_assessment_status: "not_completed",
        existing_children_consulted: false,
        essential_info_received: false,
        post_admission_review: "completed_72h",
      }),
    ];
    const alerts = identifyEmergencyAlerts(placements);
    // declined_capacity: risk_not_completed only fires for admitted
    // children_not_consulted only fires for admitted
    // no_essential_info only fires for admitted
    // review_overdue needs post_admission_review === "overdue"
    // decision_pending needs placement_decision === "pending"
    expect(alerts).toEqual([]);
  });

  // ── risk_not_completed alert ───────────────────────────────────────

  it("generates risk_not_completed alert for admitted + not_completed risk", () => {
    const placements = [
      makePlacement({
        id: "ep1", child_name: "Alice", placement_decision: "admitted",
        risk_assessment_status: "not_completed",
      }),
    ];
    const alerts = identifyEmergencyAlerts(placements);
    const alert = alerts.find((a) => a.type === "risk_not_completed");
    expect(alert).toBeTruthy();
    expect(alert!.severity).toBe("critical");
    expect(alert!.id).toBe("ep1");
  });

  it("risk_not_completed alert includes child name", () => {
    const placements = [
      makePlacement({
        id: "ep1", child_name: "Bob Jones", placement_decision: "admitted",
        risk_assessment_status: "not_completed",
      }),
    ];
    const alerts = identifyEmergencyAlerts(placements);
    const alert = alerts.find((a) => a.type === "risk_not_completed");
    expect(alert!.message).toContain("Bob Jones");
  });

  it("risk_not_completed alert message mentions risk assessment", () => {
    const placements = [
      makePlacement({
        id: "ep1", child_name: "Alice", placement_decision: "admitted",
        risk_assessment_status: "not_completed",
      }),
    ];
    const alerts = identifyEmergencyAlerts(placements);
    const alert = alerts.find((a) => a.type === "risk_not_completed");
    expect(alert!.message.toLowerCase()).toContain("risk assessment");
  });

  it("no risk_not_completed alert when risk is completed_pre_admission", () => {
    const placements = [
      makePlacement({
        id: "ep1", placement_decision: "admitted",
        risk_assessment_status: "completed_pre_admission",
      }),
    ];
    const alerts = identifyEmergencyAlerts(placements);
    expect(alerts.find((a) => a.type === "risk_not_completed")).toBeUndefined();
  });

  it("no risk_not_completed alert when risk is completed_on_arrival", () => {
    const placements = [
      makePlacement({
        id: "ep1", placement_decision: "admitted",
        risk_assessment_status: "completed_on_arrival",
      }),
    ];
    const alerts = identifyEmergencyAlerts(placements);
    expect(alerts.find((a) => a.type === "risk_not_completed")).toBeUndefined();
  });

  it("no risk_not_completed alert when risk is completed_within_24h", () => {
    const placements = [
      makePlacement({
        id: "ep1", placement_decision: "admitted",
        risk_assessment_status: "completed_within_24h",
      }),
    ];
    const alerts = identifyEmergencyAlerts(placements);
    expect(alerts.find((a) => a.type === "risk_not_completed")).toBeUndefined();
  });

  it("no risk_not_completed alert when risk is partial", () => {
    const placements = [
      makePlacement({
        id: "ep1", placement_decision: "admitted",
        risk_assessment_status: "partial",
      }),
    ];
    const alerts = identifyEmergencyAlerts(placements);
    expect(alerts.find((a) => a.type === "risk_not_completed")).toBeUndefined();
  });

  it("no risk_not_completed alert when not admitted even if risk not_completed", () => {
    const placements = [
      makePlacement({
        id: "ep1", placement_decision: "declined_capacity",
        risk_assessment_status: "not_completed",
      }),
    ];
    const alerts = identifyEmergencyAlerts(placements);
    expect(alerts.find((a) => a.type === "risk_not_completed")).toBeUndefined();
  });

  it("no risk_not_completed alert for pending decision with not_completed risk", () => {
    const placements = [
      makePlacement({
        id: "ep1", placement_decision: "pending",
        risk_assessment_status: "not_completed",
      }),
    ];
    const alerts = identifyEmergencyAlerts(placements);
    expect(alerts.find((a) => a.type === "risk_not_completed")).toBeUndefined();
  });

  it("generates multiple risk_not_completed alerts for different placements", () => {
    const placements = [
      makePlacement({ id: "ep1", child_name: "Alice", placement_decision: "admitted", risk_assessment_status: "not_completed" }),
      makePlacement({ id: "ep2", child_name: "Bob", placement_decision: "admitted", risk_assessment_status: "not_completed" }),
    ];
    const alerts = identifyEmergencyAlerts(placements);
    const riskAlerts = alerts.filter((a) => a.type === "risk_not_completed");
    expect(riskAlerts).toHaveLength(2);
  });

  // ── review_overdue alert ───────────────────────────────────────────

  it("generates review_overdue alert for overdue post_admission_review", () => {
    const placements = [
      makePlacement({
        id: "ep1", child_name: "Alice", post_admission_review: "overdue",
      }),
    ];
    const alerts = identifyEmergencyAlerts(placements);
    const alert = alerts.find((a) => a.type === "review_overdue");
    expect(alert).toBeTruthy();
    expect(alert!.severity).toBe("high");
    expect(alert!.id).toBe("ep1");
  });

  it("review_overdue alert includes child name", () => {
    const placements = [
      makePlacement({
        id: "ep1", child_name: "Carol Davies", post_admission_review: "overdue",
      }),
    ];
    const alerts = identifyEmergencyAlerts(placements);
    const alert = alerts.find((a) => a.type === "review_overdue");
    expect(alert!.message).toContain("Carol Davies");
  });

  it("review_overdue alert fires regardless of placement_decision", () => {
    const placements = [
      makePlacement({
        id: "ep1", placement_decision: "declined_capacity",
        post_admission_review: "overdue",
      }),
    ];
    const alerts = identifyEmergencyAlerts(placements);
    const alert = alerts.find((a) => a.type === "review_overdue");
    expect(alert).toBeTruthy();
  });

  it("no review_overdue alert when review is completed_72h", () => {
    const placements = [
      makePlacement({ id: "ep1", post_admission_review: "completed_72h" }),
    ];
    const alerts = identifyEmergencyAlerts(placements);
    expect(alerts.find((a) => a.type === "review_overdue")).toBeUndefined();
  });

  it("no review_overdue alert when review is completed_7_day", () => {
    const placements = [
      makePlacement({ id: "ep1", post_admission_review: "completed_7_day" }),
    ];
    const alerts = identifyEmergencyAlerts(placements);
    expect(alerts.find((a) => a.type === "review_overdue")).toBeUndefined();
  });

  it("no review_overdue alert when review is not_due", () => {
    const placements = [
      makePlacement({ id: "ep1", post_admission_review: "not_due" }),
    ];
    const alerts = identifyEmergencyAlerts(placements);
    expect(alerts.find((a) => a.type === "review_overdue")).toBeUndefined();
  });

  it("no review_overdue alert when review is not_applicable", () => {
    const placements = [
      makePlacement({ id: "ep1", post_admission_review: "not_applicable" }),
    ];
    const alerts = identifyEmergencyAlerts(placements);
    expect(alerts.find((a) => a.type === "review_overdue")).toBeUndefined();
  });

  it("generates multiple review_overdue alerts for different placements", () => {
    const placements = [
      makePlacement({ id: "ep1", child_name: "Alice", post_admission_review: "overdue" }),
      makePlacement({ id: "ep2", child_name: "Bob", post_admission_review: "overdue" }),
      makePlacement({ id: "ep3", child_name: "Carol", post_admission_review: "completed_72h" }),
    ];
    const alerts = identifyEmergencyAlerts(placements);
    const reviewAlerts = alerts.filter((a) => a.type === "review_overdue");
    expect(reviewAlerts).toHaveLength(2);
  });

  // ── children_not_consulted alert ───────────────────────────────────

  it("generates children_not_consulted alert for admitted + not consulted", () => {
    const placements = [
      makePlacement({
        id: "ep1", child_name: "Alice", placement_decision: "admitted",
        existing_children_consulted: false,
      }),
    ];
    const alerts = identifyEmergencyAlerts(placements);
    const alert = alerts.find((a) => a.type === "children_not_consulted");
    expect(alert).toBeTruthy();
    expect(alert!.severity).toBe("high");
    expect(alert!.id).toBe("ep1");
  });

  it("children_not_consulted alert includes child name", () => {
    const placements = [
      makePlacement({
        id: "ep1", child_name: "Bob Jones", placement_decision: "admitted",
        existing_children_consulted: false,
      }),
    ];
    const alerts = identifyEmergencyAlerts(placements);
    const alert = alerts.find((a) => a.type === "children_not_consulted");
    expect(alert!.message).toContain("Bob Jones");
  });

  it("no children_not_consulted alert when children are consulted", () => {
    const placements = [
      makePlacement({
        id: "ep1", placement_decision: "admitted",
        existing_children_consulted: true,
      }),
    ];
    const alerts = identifyEmergencyAlerts(placements);
    expect(alerts.find((a) => a.type === "children_not_consulted")).toBeUndefined();
  });

  it("no children_not_consulted alert when not admitted even if not consulted", () => {
    const placements = [
      makePlacement({
        id: "ep1", placement_decision: "declined_risk",
        existing_children_consulted: false,
      }),
    ];
    const alerts = identifyEmergencyAlerts(placements);
    expect(alerts.find((a) => a.type === "children_not_consulted")).toBeUndefined();
  });

  it("no children_not_consulted alert for pending decision", () => {
    const placements = [
      makePlacement({
        id: "ep1", placement_decision: "pending",
        existing_children_consulted: false,
      }),
    ];
    const alerts = identifyEmergencyAlerts(placements);
    expect(alerts.find((a) => a.type === "children_not_consulted")).toBeUndefined();
  });

  it("no children_not_consulted alert for referred_elsewhere", () => {
    const placements = [
      makePlacement({
        id: "ep1", placement_decision: "referred_elsewhere",
        existing_children_consulted: false,
      }),
    ];
    const alerts = identifyEmergencyAlerts(placements);
    expect(alerts.find((a) => a.type === "children_not_consulted")).toBeUndefined();
  });

  it("generates multiple children_not_consulted alerts for different placements", () => {
    const placements = [
      makePlacement({ id: "ep1", child_name: "Alice", placement_decision: "admitted", existing_children_consulted: false }),
      makePlacement({ id: "ep2", child_name: "Bob", placement_decision: "admitted", existing_children_consulted: false }),
    ];
    const alerts = identifyEmergencyAlerts(placements);
    const consultAlerts = alerts.filter((a) => a.type === "children_not_consulted");
    expect(consultAlerts).toHaveLength(2);
  });

  // ── no_essential_info alert ────────────────────────────────────────

  it("generates no_essential_info alert for admitted + no essential info", () => {
    const placements = [
      makePlacement({
        id: "ep1", child_name: "Alice", placement_decision: "admitted",
        essential_info_received: false, referring_authority: "City Council",
      }),
    ];
    const alerts = identifyEmergencyAlerts(placements);
    const alert = alerts.find((a) => a.type === "no_essential_info");
    expect(alert).toBeTruthy();
    expect(alert!.severity).toBe("high");
    expect(alert!.id).toBe("ep1");
  });

  it("no_essential_info alert includes child name", () => {
    const placements = [
      makePlacement({
        id: "ep1", child_name: "Carol Davies", placement_decision: "admitted",
        essential_info_received: false, referring_authority: "County",
      }),
    ];
    const alerts = identifyEmergencyAlerts(placements);
    const alert = alerts.find((a) => a.type === "no_essential_info");
    expect(alert!.message).toContain("Carol Davies");
  });

  it("no_essential_info alert includes referring authority", () => {
    const placements = [
      makePlacement({
        id: "ep1", child_name: "Alice", placement_decision: "admitted",
        essential_info_received: false, referring_authority: "West Midlands",
      }),
    ];
    const alerts = identifyEmergencyAlerts(placements);
    const alert = alerts.find((a) => a.type === "no_essential_info");
    expect(alert!.message).toContain("West Midlands");
  });

  it("no no_essential_info alert when essential info received", () => {
    const placements = [
      makePlacement({
        id: "ep1", placement_decision: "admitted",
        essential_info_received: true,
      }),
    ];
    const alerts = identifyEmergencyAlerts(placements);
    expect(alerts.find((a) => a.type === "no_essential_info")).toBeUndefined();
  });

  it("no no_essential_info alert when not admitted even if no essential info", () => {
    const placements = [
      makePlacement({
        id: "ep1", placement_decision: "declined_matching",
        essential_info_received: false,
      }),
    ];
    const alerts = identifyEmergencyAlerts(placements);
    expect(alerts.find((a) => a.type === "no_essential_info")).toBeUndefined();
  });

  it("no no_essential_info alert for pending decision", () => {
    const placements = [
      makePlacement({
        id: "ep1", placement_decision: "pending",
        essential_info_received: false,
      }),
    ];
    const alerts = identifyEmergencyAlerts(placements);
    expect(alerts.find((a) => a.type === "no_essential_info")).toBeUndefined();
  });

  it("generates multiple no_essential_info alerts for different placements", () => {
    const placements = [
      makePlacement({ id: "ep1", child_name: "Alice", placement_decision: "admitted", essential_info_received: false }),
      makePlacement({ id: "ep2", child_name: "Bob", placement_decision: "admitted", essential_info_received: false }),
    ];
    const alerts = identifyEmergencyAlerts(placements);
    const infoAlerts = alerts.filter((a) => a.type === "no_essential_info");
    expect(infoAlerts).toHaveLength(2);
  });

  // ── decision_pending alert ─────────────────────────────────────────

  it("generates decision_pending alert for pending placement", () => {
    const placements = [
      makePlacement({
        id: "ep1", child_name: "Alice", placement_decision: "pending",
        referring_authority: "City Council",
      }),
    ];
    const alerts = identifyEmergencyAlerts(placements);
    const alert = alerts.find((a) => a.type === "decision_pending");
    expect(alert).toBeTruthy();
    expect(alert!.severity).toBe("medium");
    expect(alert!.id).toBe("ep1");
  });

  it("decision_pending alert includes child name", () => {
    const placements = [
      makePlacement({
        id: "ep1", child_name: "Bob Jones", placement_decision: "pending",
        referring_authority: "County",
      }),
    ];
    const alerts = identifyEmergencyAlerts(placements);
    const alert = alerts.find((a) => a.type === "decision_pending");
    expect(alert!.message).toContain("Bob Jones");
  });

  it("decision_pending alert includes referring authority", () => {
    const placements = [
      makePlacement({
        id: "ep1", child_name: "Alice", placement_decision: "pending",
        referring_authority: "Greater Manchester",
      }),
    ];
    const alerts = identifyEmergencyAlerts(placements);
    const alert = alerts.find((a) => a.type === "decision_pending");
    expect(alert!.message).toContain("Greater Manchester");
  });

  it("no decision_pending alert when decision is admitted", () => {
    const placements = [
      makePlacement({ id: "ep1", placement_decision: "admitted" }),
    ];
    const alerts = identifyEmergencyAlerts(placements);
    expect(alerts.find((a) => a.type === "decision_pending")).toBeUndefined();
  });

  it("no decision_pending alert when decision is declined_capacity", () => {
    const placements = [
      makePlacement({ id: "ep1", placement_decision: "declined_capacity" }),
    ];
    const alerts = identifyEmergencyAlerts(placements);
    expect(alerts.find((a) => a.type === "decision_pending")).toBeUndefined();
  });

  it("no decision_pending alert when decision is declined_matching", () => {
    const placements = [
      makePlacement({ id: "ep1", placement_decision: "declined_matching" }),
    ];
    const alerts = identifyEmergencyAlerts(placements);
    expect(alerts.find((a) => a.type === "decision_pending")).toBeUndefined();
  });

  it("no decision_pending alert when decision is declined_risk", () => {
    const placements = [
      makePlacement({ id: "ep1", placement_decision: "declined_risk" }),
    ];
    const alerts = identifyEmergencyAlerts(placements);
    expect(alerts.find((a) => a.type === "decision_pending")).toBeUndefined();
  });

  it("no decision_pending alert when decision is referred_elsewhere", () => {
    const placements = [
      makePlacement({ id: "ep1", placement_decision: "referred_elsewhere" }),
    ];
    const alerts = identifyEmergencyAlerts(placements);
    expect(alerts.find((a) => a.type === "decision_pending")).toBeUndefined();
  });

  it("generates multiple decision_pending alerts for different placements", () => {
    const placements = [
      makePlacement({ id: "ep1", child_name: "Alice", placement_decision: "pending" }),
      makePlacement({ id: "ep2", child_name: "Bob", placement_decision: "pending" }),
      makePlacement({ id: "ep3", child_name: "Carol", placement_decision: "admitted" }),
    ];
    const alerts = identifyEmergencyAlerts(placements);
    const pendingAlerts = alerts.filter((a) => a.type === "decision_pending");
    expect(pendingAlerts).toHaveLength(2);
  });

  // ── combined alerts ────────────────────────────────────────────────

  it("generates all five alert types together when conditions are met", () => {
    const placements = [
      makePlacement({
        id: "ep1", child_name: "Alice", placement_decision: "admitted",
        risk_assessment_status: "not_completed",
        post_admission_review: "overdue",
        existing_children_consulted: false,
        essential_info_received: false,
      }),
      makePlacement({
        id: "ep2", child_name: "Bob", placement_decision: "pending",
      }),
    ];
    const alerts = identifyEmergencyAlerts(placements);
    const types = alerts.map((a) => a.type);
    expect(types).toContain("risk_not_completed");
    expect(types).toContain("review_overdue");
    expect(types).toContain("children_not_consulted");
    expect(types).toContain("no_essential_info");
    expect(types).toContain("decision_pending");
  });

  it("alert severity values are correct types", () => {
    const placements = [
      makePlacement({
        id: "ep1", child_name: "Alice", placement_decision: "admitted",
        risk_assessment_status: "not_completed",
        post_admission_review: "overdue",
        existing_children_consulted: false,
        essential_info_received: false,
      }),
      makePlacement({
        id: "ep2", child_name: "Bob", placement_decision: "pending",
      }),
    ];
    const alerts = identifyEmergencyAlerts(placements);
    for (const alert of alerts) {
      expect(["critical", "high", "medium"]).toContain(alert.severity);
    }
  });

  it("each alert has a non-empty message", () => {
    const placements = [
      makePlacement({
        id: "ep1", child_name: "Alice", placement_decision: "admitted",
        risk_assessment_status: "not_completed",
        existing_children_consulted: false,
        essential_info_received: false,
      }),
    ];
    const alerts = identifyEmergencyAlerts(placements);
    for (const alert of alerts) {
      expect(alert.message.length).toBeGreaterThan(0);
    }
  });

  it("each alert has a non-empty id", () => {
    const placements = [
      makePlacement({
        id: "ep1", child_name: "Alice", placement_decision: "admitted",
        risk_assessment_status: "not_completed",
      }),
    ];
    const alerts = identifyEmergencyAlerts(placements);
    for (const alert of alerts) {
      expect(alert.id.length).toBeGreaterThan(0);
    }
  });

  it("each alert has a non-empty type", () => {
    const placements = [
      makePlacement({
        id: "ep1", child_name: "Alice", placement_decision: "pending",
      }),
    ];
    const alerts = identifyEmergencyAlerts(placements);
    for (const alert of alerts) {
      expect(alert.type.length).toBeGreaterThan(0);
    }
  });

  it("risk_not_completed is critical severity", () => {
    const placements = [
      makePlacement({
        id: "ep1", placement_decision: "admitted",
        risk_assessment_status: "not_completed",
      }),
    ];
    const alerts = identifyEmergencyAlerts(placements);
    const alert = alerts.find((a) => a.type === "risk_not_completed");
    expect(alert!.severity).toBe("critical");
  });

  it("review_overdue is high severity", () => {
    const placements = [
      makePlacement({ id: "ep1", post_admission_review: "overdue" }),
    ];
    const alerts = identifyEmergencyAlerts(placements);
    const alert = alerts.find((a) => a.type === "review_overdue");
    expect(alert!.severity).toBe("high");
  });

  it("children_not_consulted is high severity", () => {
    const placements = [
      makePlacement({
        id: "ep1", placement_decision: "admitted",
        existing_children_consulted: false,
      }),
    ];
    const alerts = identifyEmergencyAlerts(placements);
    const alert = alerts.find((a) => a.type === "children_not_consulted");
    expect(alert!.severity).toBe("high");
  });

  it("no_essential_info is high severity", () => {
    const placements = [
      makePlacement({
        id: "ep1", placement_decision: "admitted",
        essential_info_received: false,
      }),
    ];
    const alerts = identifyEmergencyAlerts(placements);
    const alert = alerts.find((a) => a.type === "no_essential_info");
    expect(alert!.severity).toBe("high");
  });

  it("decision_pending is medium severity", () => {
    const placements = [
      makePlacement({ id: "ep1", placement_decision: "pending" }),
    ];
    const alerts = identifyEmergencyAlerts(placements);
    const alert = alerts.find((a) => a.type === "decision_pending");
    expect(alert!.severity).toBe("medium");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. CRUD FALLBACK (Supabase disabled)
// ═══════════════════════════════════════════════════════════════════════════

describe("CRUD fallback (Supabase disabled)", () => {
  // ── listPlacements ─────────────────────────────────────────────────

  it("listPlacements returns ok: true with empty array", async () => {
    const result = await listPlacements("home-1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listPlacements returns ok: true with childId filter", async () => {
    const result = await listPlacements("home-1", { childId: "child-1" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listPlacements returns ok: true with emergencyReason filter", async () => {
    const result = await listPlacements("home-1", { emergencyReason: "placement_breakdown" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listPlacements returns ok: true with placementDecision filter", async () => {
    const result = await listPlacements("home-1", { placementDecision: "admitted" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listPlacements returns ok: true with emergencyStatus filter", async () => {
    const result = await listPlacements("home-1", { emergencyStatus: "active" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listPlacements returns ok: true with limit filter", async () => {
    const result = await listPlacements("home-1", { limit: 50 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listPlacements returns ok: true with all filters combined", async () => {
    const result = await listPlacements("home-1", {
      childId: "child-1",
      emergencyReason: "court_order",
      placementDecision: "pending",
      emergencyStatus: "active",
      limit: 10,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  // ── createPlacement ────────────────────────────────────────────────

  it("createPlacement returns ok: false with error message", async () => {
    const result = await createPlacement({
      homeId: "home-1",
      childName: "Alice Smith",
      childId: "child-1",
      referralDate: "2025-06-01",
      referralTime: "14:30",
      emergencyReason: "placement_breakdown",
      referringAuthority: "City Council",
      socialWorkerName: "Jane Doe",
      placementDecision: "admitted",
      decisionMadeBy: "Manager A",
      decisionDate: "2025-06-01",
      riskAssessmentStatus: "completed_pre_admission",
      existingChildrenConsulted: true,
      impactAssessmentCompleted: true,
      outOfHours: false,
      emergencyStaffingArranged: true,
      essentialInfoReceived: true,
      carePlanReceived: true,
      postAdmissionReview: "completed_72h",
      emergencyStatus: "active",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });

  it("createPlacement error message is a string", async () => {
    const result = await createPlacement({
      homeId: "home-1",
      childName: "Bob Jones",
      childId: "child-2",
      referralDate: "2025-06-02",
      referralTime: "03:00",
      emergencyReason: "police_protection",
      referringAuthority: "County",
      socialWorkerName: "John Smith",
      placementDecision: "pending",
      decisionMadeBy: "Manager B",
      decisionDate: "2025-06-02",
      admissionDate: "2025-06-02",
      riskAssessmentStatus: "not_completed",
      existingChildrenConsulted: false,
      impactAssessmentCompleted: false,
      outOfHours: true,
      emergencyStaffingArranged: true,
      essentialInfoReceived: false,
      carePlanReceived: false,
      postAdmissionReview: "not_due",
      emergencyStatus: "active",
      childViews: "Scared",
      existingChildrenViews: "Worried",
      notes: "Emergency situation",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(typeof result.error).toBe("string");
    }
  });

  // ── updatePlacement ────────────────────────────────────────────────

  it("updatePlacement returns ok: false with error message", async () => {
    const result = await updatePlacement("ep-1", { emergency_status: "resolved" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });

  it("updatePlacement error message is a string for partial updates", async () => {
    const result = await updatePlacement("ep-1", {
      placement_decision: "admitted",
      risk_assessment_status: "completed_on_arrival",
      notes: "Risk assessment completed",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(typeof result.error).toBe("string");
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. EDGE CASES
// ═══════════════════════════════════════════════════════════════════════════

describe("Edge cases", () => {
  it("computeEmergencyMetrics with all placements admitted", () => {
    const placements = [
      makePlacement({ id: "ep1", placement_decision: "admitted" }),
      makePlacement({ id: "ep2", placement_decision: "admitted" }),
      makePlacement({ id: "ep3", placement_decision: "admitted" }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.admitted_count).toBe(3);
    expect(m.declined_count).toBe(0);
    expect(m.pending_count).toBe(0);
    expect(m.admission_rate).toBe(100);
  });

  it("computeEmergencyMetrics with all placements declined", () => {
    const placements = [
      makePlacement({ id: "ep1", placement_decision: "declined_capacity" }),
      makePlacement({ id: "ep2", placement_decision: "declined_matching" }),
      makePlacement({ id: "ep3", placement_decision: "declined_risk" }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.admitted_count).toBe(0);
    expect(m.declined_count).toBe(3);
    expect(m.pending_count).toBe(0);
    expect(m.admission_rate).toBe(0);
  });

  it("computeEmergencyMetrics with all placements pending", () => {
    const placements = [
      makePlacement({ id: "ep1", placement_decision: "pending" }),
      makePlacement({ id: "ep2", placement_decision: "pending" }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.admitted_count).toBe(0);
    expect(m.declined_count).toBe(0);
    expect(m.pending_count).toBe(2);
    expect(m.admission_rate).toBe(0);
  });

  it("computeEmergencyMetrics with all out of hours", () => {
    const placements = [
      makePlacement({ id: "ep1", out_of_hours: true }),
      makePlacement({ id: "ep2", out_of_hours: true }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.out_of_hours_count).toBe(2);
    expect(m.out_of_hours_rate).toBe(100);
  });

  it("computeEmergencyMetrics with all risk not completed", () => {
    const placements = [
      makePlacement({ id: "ep1", risk_assessment_status: "not_completed" }),
      makePlacement({ id: "ep2", risk_assessment_status: "not_completed" }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.risk_not_completed).toBe(2);
    expect(m.risk_completed_pre_admission).toBe(0);
  });

  it("computeEmergencyMetrics with all risk completed pre-admission", () => {
    const placements = [
      makePlacement({ id: "ep1", risk_assessment_status: "completed_pre_admission" }),
      makePlacement({ id: "ep2", risk_assessment_status: "completed_pre_admission" }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.risk_completed_pre_admission).toBe(2);
    expect(m.risk_not_completed).toBe(0);
  });

  it("computeEmergencyMetrics by_placement_decision matches individual counts", () => {
    const placements = [
      makePlacement({ id: "ep1", placement_decision: "admitted" }),
      makePlacement({ id: "ep2", placement_decision: "admitted" }),
      makePlacement({ id: "ep3", placement_decision: "declined_capacity" }),
      makePlacement({ id: "ep4", placement_decision: "pending" }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.by_placement_decision["admitted"]).toBe(m.admitted_count);
    expect(m.by_placement_decision["pending"]).toBe(m.pending_count);
  });

  it("computeEmergencyMetrics post_review_completed_rate with mixed not_applicable and not_due", () => {
    const placements = [
      makePlacement({ id: "ep1", placement_decision: "admitted", post_admission_review: "completed_72h" }),
      makePlacement({ id: "ep2", placement_decision: "admitted", post_admission_review: "not_applicable" }),
      makePlacement({ id: "ep3", placement_decision: "admitted", post_admission_review: "not_due" }),
      makePlacement({ id: "ep4", placement_decision: "admitted", post_admission_review: "overdue" }),
    ];
    const m = computeEmergencyMetrics(placements);
    // reviewable: ep1 (completed_72h) and ep4 (overdue) = 2
    // reviewed: ep1 = 1
    expect(m.post_review_completed_rate).toBe(50);
  });

  it("computeEmergencyMetrics with referred_elsewhere decision", () => {
    const placements = [
      makePlacement({ id: "ep1", placement_decision: "referred_elsewhere" }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.admitted_count).toBe(0);
    expect(m.declined_count).toBe(0);
    expect(m.pending_count).toBe(0);
    expect(m.by_placement_decision["referred_elsewhere"]).toBe(1);
  });

  it("computeEmergencyMetrics admitted rates are independent of non-admitted", () => {
    const placements = [
      makePlacement({
        id: "ep1", placement_decision: "admitted",
        existing_children_consulted: true, impact_assessment_completed: true,
        essential_info_received: true, care_plan_received: true,
      }),
      makePlacement({
        id: "ep2", placement_decision: "declined_capacity",
        existing_children_consulted: false, impact_assessment_completed: false,
        essential_info_received: false, care_plan_received: false,
      }),
      makePlacement({
        id: "ep3", placement_decision: "pending",
        existing_children_consulted: false, impact_assessment_completed: false,
        essential_info_received: false, care_plan_received: false,
      }),
    ];
    const m = computeEmergencyMetrics(placements);
    // Only 1 admitted placement, and it has all true
    expect(m.existing_children_consulted_rate).toBe(100);
    expect(m.impact_assessed_rate).toBe(100);
    expect(m.essential_info_rate).toBe(100);
    expect(m.care_plan_rate).toBe(100);
  });

  it("identifyEmergencyAlerts empty placements produces no alerts", () => {
    const alerts = identifyEmergencyAlerts([]);
    expect(alerts).toHaveLength(0);
  });

  it("identifyEmergencyAlerts with all five alert types triggered simultaneously", () => {
    const placements = [
      makePlacement({
        id: "ep1", child_name: "Alice", placement_decision: "admitted",
        risk_assessment_status: "not_completed",
        post_admission_review: "overdue",
        existing_children_consulted: false,
        essential_info_received: false,
      }),
      makePlacement({
        id: "ep2", child_name: "Bob", placement_decision: "pending",
      }),
    ];
    const alerts = identifyEmergencyAlerts(placements);
    const types = new Set(alerts.map((a) => a.type));
    expect(types.has("risk_not_completed")).toBe(true);
    expect(types.has("review_overdue")).toBe(true);
    expect(types.has("children_not_consulted")).toBe(true);
    expect(types.has("no_essential_info")).toBe(true);
    expect(types.has("decision_pending")).toBe(true);
    expect(types.size).toBe(5);
  });

  it("identifyEmergencyAlerts single admitted placement can trigger 4 alerts", () => {
    const placements = [
      makePlacement({
        id: "ep1", child_name: "Alice", placement_decision: "admitted",
        risk_assessment_status: "not_completed",
        post_admission_review: "overdue",
        existing_children_consulted: false,
        essential_info_received: false,
      }),
    ];
    const alerts = identifyEmergencyAlerts(placements);
    const types = new Set(alerts.map((a) => a.type));
    expect(types.has("risk_not_completed")).toBe(true);
    expect(types.has("review_overdue")).toBe(true);
    expect(types.has("children_not_consulted")).toBe(true);
    expect(types.has("no_essential_info")).toBe(true);
    expect(types.size).toBe(4);
  });

  it("identifyEmergencyAlerts risk_not_completed only for admitted, not all decisions", () => {
    const decisions: PlacementDecision[] = [
      "admitted", "declined_capacity", "declined_matching", "declined_risk", "referred_elsewhere", "pending",
    ];
    const placements = decisions.map((decision, i) =>
      makePlacement({ id: `ep${i}`, placement_decision: decision, risk_assessment_status: "not_completed" }),
    );
    const alerts = identifyEmergencyAlerts(placements);
    const riskAlerts = alerts.filter((a) => a.type === "risk_not_completed");
    expect(riskAlerts).toHaveLength(1);
    expect(riskAlerts[0].id).toBe("ep0"); // only admitted
  });

  it("identifyEmergencyAlerts children_not_consulted only for admitted, not all decisions", () => {
    const decisions: PlacementDecision[] = [
      "admitted", "declined_capacity", "declined_matching", "declined_risk", "referred_elsewhere", "pending",
    ];
    const placements = decisions.map((decision, i) =>
      makePlacement({ id: `ep${i}`, placement_decision: decision, existing_children_consulted: false }),
    );
    const alerts = identifyEmergencyAlerts(placements);
    const consultAlerts = alerts.filter((a) => a.type === "children_not_consulted");
    expect(consultAlerts).toHaveLength(1);
    expect(consultAlerts[0].id).toBe("ep0"); // only admitted
  });

  it("identifyEmergencyAlerts no_essential_info only for admitted, not all decisions", () => {
    const decisions: PlacementDecision[] = [
      "admitted", "declined_capacity", "declined_matching", "declined_risk", "referred_elsewhere", "pending",
    ];
    const placements = decisions.map((decision, i) =>
      makePlacement({ id: `ep${i}`, placement_decision: decision, essential_info_received: false }),
    );
    const alerts = identifyEmergencyAlerts(placements);
    const infoAlerts = alerts.filter((a) => a.type === "no_essential_info");
    expect(infoAlerts).toHaveLength(1);
    expect(infoAlerts[0].id).toBe("ep0"); // only admitted
  });

  it("identifyEmergencyAlerts review_overdue fires for any placement_decision", () => {
    const placements = [
      makePlacement({ id: "ep1", placement_decision: "admitted", post_admission_review: "overdue" }),
      makePlacement({ id: "ep2", placement_decision: "declined_capacity", post_admission_review: "overdue" }),
    ];
    const alerts = identifyEmergencyAlerts(placements);
    const reviewAlerts = alerts.filter((a) => a.type === "review_overdue");
    expect(reviewAlerts).toHaveLength(2);
  });

  it("identifyEmergencyAlerts decision_pending only for pending decision", () => {
    const decisions: PlacementDecision[] = [
      "admitted", "declined_capacity", "declined_matching", "declined_risk", "referred_elsewhere", "pending",
    ];
    const placements = decisions.map((decision, i) =>
      makePlacement({ id: `ep${i}`, placement_decision: decision }),
    );
    const alerts = identifyEmergencyAlerts(placements);
    const pendingAlerts = alerts.filter((a) => a.type === "decision_pending");
    expect(pendingAlerts).toHaveLength(1);
    expect(pendingAlerts[0].id).toBe("ep5"); // only pending
  });

  it("computeEmergencyMetrics with single reason produces single entry in by_emergency_reason", () => {
    const placements = [
      makePlacement({ id: "ep1", emergency_reason: "remand" }),
      makePlacement({ id: "ep2", emergency_reason: "remand" }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(Object.keys(m.by_emergency_reason)).toHaveLength(1);
    expect(m.by_emergency_reason["remand"]).toBe(2);
  });

  it("computeEmergencyMetrics with single emergency status", () => {
    const placements = [
      makePlacement({ id: "ep1", emergency_status: "ongoing_review" }),
      makePlacement({ id: "ep2", emergency_status: "ongoing_review" }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(Object.keys(m.by_emergency_status)).toHaveLength(1);
    expect(m.by_emergency_status["ongoing_review"]).toBe(2);
    expect(m.active_emergencies).toBe(0);
  });

  it("computeEmergencyMetrics admission_rate with 2 admitted in 3 total", () => {
    const placements = [
      makePlacement({ id: "ep1", placement_decision: "admitted" }),
      makePlacement({ id: "ep2", placement_decision: "admitted" }),
      makePlacement({ id: "ep3", placement_decision: "pending" }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.admission_rate).toBe(66.7);
  });

  it("computeEmergencyMetrics child_views_rate with 2 views in 3 total", () => {
    const placements = [
      makePlacement({ id: "ep1", child_views: "A" }),
      makePlacement({ id: "ep2", child_views: "B" }),
      makePlacement({ id: "ep3", child_views: null }),
    ];
    const m = computeEmergencyMetrics(placements);
    expect(m.child_views_rate).toBe(66.7);
  });

  it("computeEmergencyMetrics with all emergency statuses", () => {
    const statuses: EmergencyStatus[] = ["active", "resolved", "converted_planned", "ended_early", "ongoing_review"];
    const placements = statuses.map((status, i) =>
      makePlacement({ id: `ep${i}`, emergency_status: status }),
    );
    const m = computeEmergencyMetrics(placements);
    expect(m.active_emergencies).toBe(1);
    expect(Object.keys(m.by_emergency_status)).toHaveLength(5);
  });

  it("computeEmergencyMetrics with all risk assessment statuses", () => {
    const statuses: RiskAssessmentStatus[] = [
      "completed_pre_admission", "completed_on_arrival", "completed_within_24h", "not_completed", "partial",
    ];
    const placements = statuses.map((status, i) =>
      makePlacement({ id: `ep${i}`, risk_assessment_status: status }),
    );
    const m = computeEmergencyMetrics(placements);
    expect(m.risk_completed_pre_admission).toBe(1);
    expect(m.risk_not_completed).toBe(1);
    expect(Object.keys(m.by_risk_status)).toHaveLength(5);
  });

  it("computeEmergencyMetrics post_review_overdue only counts admitted overdue", () => {
    const placements = [
      makePlacement({ id: "ep1", placement_decision: "admitted", post_admission_review: "overdue" }),
      makePlacement({ id: "ep2", placement_decision: "declined_capacity", post_admission_review: "overdue" }),
    ];
    const m = computeEmergencyMetrics(placements);
    // post_review_overdue counts from admittedPlacements only
    expect(m.post_review_overdue).toBe(1);
  });
});
