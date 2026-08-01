// ══════════════════════════════════════════════════════════════════════════════
// CARA — EMERGENCY ADMISSIONS SERVICE TESTS
// Pure-function unit tests for admission metrics computation, alert
// identification, and constant validation.
// CHR 2015 Reg 35 (admissions — emergency placements),
// Reg 14 (care planning — placement matching),
// Reg 12 (protection — impact on existing children).
//
// Covers: emergency admissions, matching assessments, impact on
// existing children, referral sources, and placement stability.
//
// SCCIF: Helped & Protected — "Emergency placements are managed
// safely." "Impact on existing children is considered."
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi } from "vitest";
import crypto from "crypto";

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => false,
  createServerClient: () => null,
}));

import {
  _testing,
  ADMISSION_TYPES,
  REFERRAL_SOURCES,
  MATCHING_OUTCOMES,
  IMPACT_ASSESSMENTS,
} from "../emergency-admissions-service";

import type { EmergencyAdmission } from "../emergency-admissions-service";

const { computeAdmissionMetrics, identifyAdmissionAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Build a minimal EmergencyAdmission with sensible defaults. */
function makeAdmission(
  overrides: Partial<EmergencyAdmission> = {},
): EmergencyAdmission {
  return {
    id: crypto.randomUUID(),
    home_id: "home-1",
    child_name: "Alice Smith",
    child_id: "child-1",
    admission_date: "2024-06-01",
    admission_type: "emergency",
    referral_source: "local_authority",
    matching_outcome: "good_match",
    impact_on_existing_children: "no_impact",
    risk_assessment_completed: true,
    placement_plan_within_24h: true,
    social_worker_contacted: true,
    ofsted_notified: true,
    existing_children_consulted: true,
    staff_briefed: true,
    child_needs_identified: true,
    child_views_captured: true,
    disruption_to_placement: false,
    admission_approved_by: "Manager",
    review_date:
      "review_date" in (overrides ?? {})
        ? (overrides!.review_date ?? null)
        : "2024-06-15",
    notes:
      "notes" in (overrides ?? {})
        ? (overrides!.notes ?? null)
        : null,
    created_at: "2024-06-01T10:00:00.000Z",
    updated_at: "2024-06-01T10:00:00.000Z",
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

describe("ADMISSION_TYPES", () => {
  it("has exactly 7 entries", () => {
    expect(ADMISSION_TYPES).toHaveLength(7);
  });

  it("contains unique type values", () => {
    const values = ADMISSION_TYPES.map((t) => t.type);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = ADMISSION_TYPES.map((t) => t.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("each entry has a non-empty label", () => {
    for (const t of ADMISSION_TYPES) {
      expect(t.label.length).toBeGreaterThan(0);
    }
  });

  it("includes planned", () => {
    expect(ADMISSION_TYPES.find((t) => t.type === "planned")).toBeTruthy();
  });

  it("includes emergency", () => {
    expect(ADMISSION_TYPES.find((t) => t.type === "emergency")).toBeTruthy();
  });

  it("includes crisis", () => {
    expect(ADMISSION_TYPES.find((t) => t.type === "crisis")).toBeTruthy();
  });

  it("includes respite", () => {
    expect(ADMISSION_TYPES.find((t) => t.type === "respite")).toBeTruthy();
  });

  it("includes step_down", () => {
    expect(ADMISSION_TYPES.find((t) => t.type === "step_down")).toBeTruthy();
  });

  it("includes transfer", () => {
    expect(ADMISSION_TYPES.find((t) => t.type === "transfer")).toBeTruthy();
  });

  it("includes other", () => {
    expect(ADMISSION_TYPES.find((t) => t.type === "other")).toBeTruthy();
  });
});

describe("REFERRAL_SOURCES", () => {
  it("has exactly 8 entries", () => {
    expect(REFERRAL_SOURCES).toHaveLength(8);
  });

  it("contains unique source values", () => {
    const values = REFERRAL_SOURCES.map((s) => s.source);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = REFERRAL_SOURCES.map((s) => s.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("each entry has a non-empty label", () => {
    for (const s of REFERRAL_SOURCES) {
      expect(s.label.length).toBeGreaterThan(0);
    }
  });

  it("includes local_authority", () => {
    expect(REFERRAL_SOURCES.find((s) => s.source === "local_authority")).toBeTruthy();
  });

  it("includes police", () => {
    expect(REFERRAL_SOURCES.find((s) => s.source === "police")).toBeTruthy();
  });

  it("includes hospital", () => {
    expect(REFERRAL_SOURCES.find((s) => s.source === "hospital")).toBeTruthy();
  });

  it("includes court", () => {
    expect(REFERRAL_SOURCES.find((s) => s.source === "court")).toBeTruthy();
  });

  it("includes another_home", () => {
    expect(REFERRAL_SOURCES.find((s) => s.source === "another_home")).toBeTruthy();
  });

  it("includes foster_carer", () => {
    expect(REFERRAL_SOURCES.find((s) => s.source === "foster_carer")).toBeTruthy();
  });

  it("includes family", () => {
    expect(REFERRAL_SOURCES.find((s) => s.source === "family")).toBeTruthy();
  });

  it("includes other", () => {
    expect(REFERRAL_SOURCES.find((s) => s.source === "other")).toBeTruthy();
  });
});

describe("MATCHING_OUTCOMES", () => {
  it("has exactly 5 entries", () => {
    expect(MATCHING_OUTCOMES).toHaveLength(5);
  });

  it("contains unique outcome values", () => {
    const values = MATCHING_OUTCOMES.map((o) => o.outcome);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = MATCHING_OUTCOMES.map((o) => o.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("each entry has a non-empty label", () => {
    for (const o of MATCHING_OUTCOMES) {
      expect(o.label.length).toBeGreaterThan(0);
    }
  });

  it("includes good_match", () => {
    expect(MATCHING_OUTCOMES.find((o) => o.outcome === "good_match")).toBeTruthy();
  });

  it("includes acceptable_match", () => {
    expect(MATCHING_OUTCOMES.find((o) => o.outcome === "acceptable_match")).toBeTruthy();
  });

  it("includes poor_match", () => {
    expect(MATCHING_OUTCOMES.find((o) => o.outcome === "poor_match")).toBeTruthy();
  });

  it("includes not_assessed", () => {
    expect(MATCHING_OUTCOMES.find((o) => o.outcome === "not_assessed")).toBeTruthy();
  });

  it("includes overridden_by_la", () => {
    expect(MATCHING_OUTCOMES.find((o) => o.outcome === "overridden_by_la")).toBeTruthy();
  });
});

describe("IMPACT_ASSESSMENTS", () => {
  it("has exactly 5 entries", () => {
    expect(IMPACT_ASSESSMENTS).toHaveLength(5);
  });

  it("contains unique assessment values", () => {
    const values = IMPACT_ASSESSMENTS.map((a) => a.assessment);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = IMPACT_ASSESSMENTS.map((a) => a.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("each entry has a non-empty label", () => {
    for (const a of IMPACT_ASSESSMENTS) {
      expect(a.label.length).toBeGreaterThan(0);
    }
  });

  it("includes no_impact", () => {
    expect(IMPACT_ASSESSMENTS.find((a) => a.assessment === "no_impact")).toBeTruthy();
  });

  it("includes minimal_impact", () => {
    expect(IMPACT_ASSESSMENTS.find((a) => a.assessment === "minimal_impact")).toBeTruthy();
  });

  it("includes moderate_impact", () => {
    expect(IMPACT_ASSESSMENTS.find((a) => a.assessment === "moderate_impact")).toBeTruthy();
  });

  it("includes significant_impact", () => {
    expect(IMPACT_ASSESSMENTS.find((a) => a.assessment === "significant_impact")).toBeTruthy();
  });

  it("includes not_assessed", () => {
    expect(IMPACT_ASSESSMENTS.find((a) => a.assessment === "not_assessed")).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. computeAdmissionMetrics
// ═══════════════════════════════════════════════════════════════════════════

describe("computeAdmissionMetrics", () => {
  // ── Empty array ──────────────────────────────────────────────────────
  describe("empty admissions", () => {
    it("returns zero total_admissions", () => {
      expect(computeAdmissionMetrics([]).total_admissions).toBe(0);
    });

    it("returns zero emergency_count", () => {
      expect(computeAdmissionMetrics([]).emergency_count).toBe(0);
    });

    it("returns zero crisis_count", () => {
      expect(computeAdmissionMetrics([]).crisis_count).toBe(0);
    });

    it("returns zero planned_count", () => {
      expect(computeAdmissionMetrics([]).planned_count).toBe(0);
    });

    it("returns zero risk_assessment_rate", () => {
      expect(computeAdmissionMetrics([]).risk_assessment_rate).toBeNull();;
    });

    it("returns zero placement_plan_rate", () => {
      expect(computeAdmissionMetrics([]).placement_plan_rate).toBeNull();;
    });

    it("returns zero social_worker_contacted_rate", () => {
      expect(computeAdmissionMetrics([]).social_worker_contacted_rate).toBeNull();;
    });

    it("returns zero ofsted_notified_rate", () => {
      expect(computeAdmissionMetrics([]).ofsted_notified_rate).toBeNull();;
    });

    it("returns zero existing_children_consulted_rate", () => {
      expect(computeAdmissionMetrics([]).existing_children_consulted_rate).toBeNull();;
    });

    it("returns zero staff_briefed_rate", () => {
      expect(computeAdmissionMetrics([]).staff_briefed_rate).toBeNull();;
    });

    it("returns zero child_views_captured_rate", () => {
      expect(computeAdmissionMetrics([]).child_views_captured_rate).toBeNull();;
    });

    it("returns zero good_match_rate", () => {
      expect(computeAdmissionMetrics([]).good_match_rate).toBeNull();;
    });

    it("returns zero poor_match_count", () => {
      expect(computeAdmissionMetrics([]).poor_match_count).toBe(0);
    });

    it("returns zero significant_impact_count", () => {
      expect(computeAdmissionMetrics([]).significant_impact_count).toBe(0);
    });

    it("returns zero disruption_count", () => {
      expect(computeAdmissionMetrics([]).disruption_count).toBe(0);
    });

    it("returns empty by_admission_type", () => {
      expect(computeAdmissionMetrics([]).by_admission_type).toEqual({});
    });

    it("returns empty by_referral_source", () => {
      expect(computeAdmissionMetrics([]).by_referral_source).toEqual({});
    });

    it("returns empty by_matching_outcome", () => {
      expect(computeAdmissionMetrics([]).by_matching_outcome).toEqual({});
    });

    it("returns empty by_impact_assessment", () => {
      expect(computeAdmissionMetrics([]).by_impact_assessment).toEqual({});
    });
  });

  // ── Single record ──────────────────────────────────────────────────
  describe("single admission", () => {
    const single = [makeAdmission()];

    it("total_admissions is 1", () => {
      expect(computeAdmissionMetrics(single).total_admissions).toBe(1);
    });

    it("emergency_count is 1 for emergency admission", () => {
      expect(computeAdmissionMetrics(single).emergency_count).toBe(1);
    });

    it("crisis_count is 0 for emergency admission", () => {
      expect(computeAdmissionMetrics(single).crisis_count).toBe(0);
    });

    it("planned_count is 0 for emergency admission", () => {
      expect(computeAdmissionMetrics(single).planned_count).toBe(0);
    });

    it("risk_assessment_rate is 100 when completed", () => {
      expect(computeAdmissionMetrics(single).risk_assessment_rate).toBe(100);
    });

    it("placement_plan_rate is 100 when completed", () => {
      expect(computeAdmissionMetrics(single).placement_plan_rate).toBe(100);
    });

    it("social_worker_contacted_rate is 100 when contacted", () => {
      expect(computeAdmissionMetrics(single).social_worker_contacted_rate).toBe(100);
    });

    it("ofsted_notified_rate is 100 when notified", () => {
      expect(computeAdmissionMetrics(single).ofsted_notified_rate).toBe(100);
    });

    it("existing_children_consulted_rate is 100 when consulted", () => {
      expect(computeAdmissionMetrics(single).existing_children_consulted_rate).toBe(100);
    });

    it("staff_briefed_rate is 100 when briefed", () => {
      expect(computeAdmissionMetrics(single).staff_briefed_rate).toBe(100);
    });

    it("child_views_captured_rate is 100 when captured", () => {
      expect(computeAdmissionMetrics(single).child_views_captured_rate).toBe(100);
    });

    it("good_match_rate is 100 for good_match outcome", () => {
      expect(computeAdmissionMetrics(single).good_match_rate).toBe(100);
    });

    it("poor_match_count is 0 for good_match outcome", () => {
      expect(computeAdmissionMetrics(single).poor_match_count).toBe(0);
    });

    it("significant_impact_count is 0 for no_impact", () => {
      expect(computeAdmissionMetrics(single).significant_impact_count).toBe(0);
    });

    it("disruption_count is 0 when no disruption", () => {
      expect(computeAdmissionMetrics(single).disruption_count).toBe(0);
    });

    it("by_admission_type groups single record correctly", () => {
      expect(computeAdmissionMetrics(single).by_admission_type).toEqual({ emergency: 1 });
    });

    it("by_referral_source groups single record correctly", () => {
      expect(computeAdmissionMetrics(single).by_referral_source).toEqual({ local_authority: 1 });
    });

    it("by_matching_outcome groups single record correctly", () => {
      expect(computeAdmissionMetrics(single).by_matching_outcome).toEqual({ good_match: 1 });
    });

    it("by_impact_assessment groups single record correctly", () => {
      expect(computeAdmissionMetrics(single).by_impact_assessment).toEqual({ no_impact: 1 });
    });
  });

  // ── Multiple records ─────────────────────────────────────────────────
  describe("multiple admissions", () => {
    const records = [
      makeAdmission({
        id: "a-1",
        admission_type: "emergency",
        referral_source: "local_authority",
        matching_outcome: "good_match",
        impact_on_existing_children: "no_impact",
        risk_assessment_completed: true,
        placement_plan_within_24h: true,
        social_worker_contacted: true,
        ofsted_notified: true,
        existing_children_consulted: true,
        staff_briefed: true,
        child_views_captured: true,
        disruption_to_placement: false,
      }),
      makeAdmission({
        id: "a-2",
        admission_type: "crisis",
        referral_source: "police",
        matching_outcome: "poor_match",
        impact_on_existing_children: "significant_impact",
        risk_assessment_completed: false,
        placement_plan_within_24h: false,
        social_worker_contacted: false,
        ofsted_notified: false,
        existing_children_consulted: false,
        staff_briefed: false,
        child_views_captured: false,
        disruption_to_placement: true,
      }),
      makeAdmission({
        id: "a-3",
        admission_type: "planned",
        referral_source: "hospital",
        matching_outcome: "acceptable_match",
        impact_on_existing_children: "minimal_impact",
        risk_assessment_completed: true,
        placement_plan_within_24h: true,
        social_worker_contacted: true,
        ofsted_notified: true,
        existing_children_consulted: true,
        staff_briefed: true,
        child_views_captured: true,
        disruption_to_placement: false,
      }),
    ];

    it("total_admissions is 3", () => {
      expect(computeAdmissionMetrics(records).total_admissions).toBe(3);
    });

    it("emergency_count is 1", () => {
      expect(computeAdmissionMetrics(records).emergency_count).toBe(1);
    });

    it("crisis_count is 1", () => {
      expect(computeAdmissionMetrics(records).crisis_count).toBe(1);
    });

    it("planned_count is 1", () => {
      expect(computeAdmissionMetrics(records).planned_count).toBe(1);
    });

    it("risk_assessment_rate is 66.7 (2 of 3)", () => {
      expect(computeAdmissionMetrics(records).risk_assessment_rate).toBe(66.7);
    });

    it("placement_plan_rate is 66.7 (2 of 3)", () => {
      expect(computeAdmissionMetrics(records).placement_plan_rate).toBe(66.7);
    });

    it("social_worker_contacted_rate is 66.7 (2 of 3)", () => {
      expect(computeAdmissionMetrics(records).social_worker_contacted_rate).toBe(66.7);
    });

    it("ofsted_notified_rate is 66.7 (2 of 3)", () => {
      expect(computeAdmissionMetrics(records).ofsted_notified_rate).toBe(66.7);
    });

    it("existing_children_consulted_rate is 66.7 (2 of 3)", () => {
      expect(computeAdmissionMetrics(records).existing_children_consulted_rate).toBe(66.7);
    });

    it("staff_briefed_rate is 66.7 (2 of 3)", () => {
      expect(computeAdmissionMetrics(records).staff_briefed_rate).toBe(66.7);
    });

    it("child_views_captured_rate is 66.7 (2 of 3)", () => {
      expect(computeAdmissionMetrics(records).child_views_captured_rate).toBe(66.7);
    });

    it("good_match_rate is 33.3 (1 good of 3 assessed)", () => {
      // all 3 are assessed (none are not_assessed), 1 is good_match
      expect(computeAdmissionMetrics(records).good_match_rate).toBe(33.3);
    });

    it("poor_match_count is 1", () => {
      expect(computeAdmissionMetrics(records).poor_match_count).toBe(1);
    });

    it("significant_impact_count is 1", () => {
      expect(computeAdmissionMetrics(records).significant_impact_count).toBe(1);
    });

    it("disruption_count is 1", () => {
      expect(computeAdmissionMetrics(records).disruption_count).toBe(1);
    });

    it("by_admission_type groups correctly", () => {
      expect(computeAdmissionMetrics(records).by_admission_type).toEqual({
        emergency: 1,
        crisis: 1,
        planned: 1,
      });
    });

    it("by_referral_source groups correctly", () => {
      expect(computeAdmissionMetrics(records).by_referral_source).toEqual({
        local_authority: 1,
        police: 1,
        hospital: 1,
      });
    });

    it("by_matching_outcome groups correctly", () => {
      expect(computeAdmissionMetrics(records).by_matching_outcome).toEqual({
        good_match: 1,
        poor_match: 1,
        acceptable_match: 1,
      });
    });

    it("by_impact_assessment groups correctly", () => {
      expect(computeAdmissionMetrics(records).by_impact_assessment).toEqual({
        no_impact: 1,
        significant_impact: 1,
        minimal_impact: 1,
      });
    });
  });

  // ── Admission type counts ──────────────────────────────────────────
  describe("admission type counts", () => {
    it("counts only emergency admissions", () => {
      const records = [
        makeAdmission({ id: "1", admission_type: "emergency" }),
        makeAdmission({ id: "2", admission_type: "emergency" }),
        makeAdmission({ id: "3", admission_type: "crisis" }),
      ];
      expect(computeAdmissionMetrics(records).emergency_count).toBe(2);
    });

    it("counts only crisis admissions", () => {
      const records = [
        makeAdmission({ id: "1", admission_type: "crisis" }),
        makeAdmission({ id: "2", admission_type: "crisis" }),
        makeAdmission({ id: "3", admission_type: "emergency" }),
      ];
      expect(computeAdmissionMetrics(records).crisis_count).toBe(2);
    });

    it("counts only planned admissions", () => {
      const records = [
        makeAdmission({ id: "1", admission_type: "planned" }),
        makeAdmission({ id: "2", admission_type: "planned" }),
        makeAdmission({ id: "3", admission_type: "emergency" }),
      ];
      expect(computeAdmissionMetrics(records).planned_count).toBe(2);
    });

    it("returns zero for absent admission types", () => {
      const records = [
        makeAdmission({ id: "1", admission_type: "respite" }),
        makeAdmission({ id: "2", admission_type: "transfer" }),
      ];
      const m = computeAdmissionMetrics(records);
      expect(m.emergency_count).toBe(0);
      expect(m.crisis_count).toBe(0);
      expect(m.planned_count).toBe(0);
    });
  });

  // ── risk_assessment_rate ──────────────────────────────────────────
  describe("risk_assessment_rate", () => {
    it("is 100 when all completed", () => {
      const records = [
        makeAdmission({ id: "1", risk_assessment_completed: true }),
        makeAdmission({ id: "2", risk_assessment_completed: true }),
      ];
      expect(computeAdmissionMetrics(records).risk_assessment_rate).toBe(100);
    });

    it("is 0 when none completed", () => {
      const records = [
        makeAdmission({ id: "1", risk_assessment_completed: false }),
        makeAdmission({ id: "2", risk_assessment_completed: false }),
      ];
      expect(computeAdmissionMetrics(records).risk_assessment_rate).toBe(0);
    });

    it("is 50 for 1 of 2", () => {
      const records = [
        makeAdmission({ id: "1", risk_assessment_completed: true }),
        makeAdmission({ id: "2", risk_assessment_completed: false }),
      ];
      expect(computeAdmissionMetrics(records).risk_assessment_rate).toBe(50);
    });

    it("rounds correctly for 1 of 3 (33.3)", () => {
      const records = [
        makeAdmission({ id: "1", risk_assessment_completed: true }),
        makeAdmission({ id: "2", risk_assessment_completed: false }),
        makeAdmission({ id: "3", risk_assessment_completed: false }),
      ];
      expect(computeAdmissionMetrics(records).risk_assessment_rate).toBe(33.3);
    });

    it("rounds correctly for 2 of 3 (66.7)", () => {
      const records = [
        makeAdmission({ id: "1", risk_assessment_completed: true }),
        makeAdmission({ id: "2", risk_assessment_completed: true }),
        makeAdmission({ id: "3", risk_assessment_completed: false }),
      ];
      expect(computeAdmissionMetrics(records).risk_assessment_rate).toBe(66.7);
    });
  });

  // ── placement_plan_rate ───────────────────────────────────────────
  describe("placement_plan_rate", () => {
    it("is 100 when all have plans", () => {
      const records = [
        makeAdmission({ id: "1", placement_plan_within_24h: true }),
        makeAdmission({ id: "2", placement_plan_within_24h: true }),
      ];
      expect(computeAdmissionMetrics(records).placement_plan_rate).toBe(100);
    });

    it("is 0 when none have plans", () => {
      const records = [
        makeAdmission({ id: "1", placement_plan_within_24h: false }),
        makeAdmission({ id: "2", placement_plan_within_24h: false }),
      ];
      expect(computeAdmissionMetrics(records).placement_plan_rate).toBe(0);
    });

    it("rounds correctly for 1 of 3 (33.3)", () => {
      const records = [
        makeAdmission({ id: "1", placement_plan_within_24h: true }),
        makeAdmission({ id: "2", placement_plan_within_24h: false }),
        makeAdmission({ id: "3", placement_plan_within_24h: false }),
      ];
      expect(computeAdmissionMetrics(records).placement_plan_rate).toBe(33.3);
    });
  });

  // ── social_worker_contacted_rate ──────────────────────────────────
  describe("social_worker_contacted_rate", () => {
    it("is 100 when all contacted", () => {
      const records = [
        makeAdmission({ id: "1", social_worker_contacted: true }),
        makeAdmission({ id: "2", social_worker_contacted: true }),
      ];
      expect(computeAdmissionMetrics(records).social_worker_contacted_rate).toBe(100);
    });

    it("is 0 when none contacted", () => {
      const records = [
        makeAdmission({ id: "1", social_worker_contacted: false }),
        makeAdmission({ id: "2", social_worker_contacted: false }),
      ];
      expect(computeAdmissionMetrics(records).social_worker_contacted_rate).toBe(0);
    });

    it("rounds correctly for 1 of 3 (33.3)", () => {
      const records = [
        makeAdmission({ id: "1", social_worker_contacted: true }),
        makeAdmission({ id: "2", social_worker_contacted: false }),
        makeAdmission({ id: "3", social_worker_contacted: false }),
      ];
      expect(computeAdmissionMetrics(records).social_worker_contacted_rate).toBe(33.3);
    });
  });

  // ── ofsted_notified_rate ──────────────────────────────────────────
  describe("ofsted_notified_rate", () => {
    it("is 100 when all notified", () => {
      const records = [
        makeAdmission({ id: "1", ofsted_notified: true }),
        makeAdmission({ id: "2", ofsted_notified: true }),
      ];
      expect(computeAdmissionMetrics(records).ofsted_notified_rate).toBe(100);
    });

    it("is 0 when none notified", () => {
      const records = [
        makeAdmission({ id: "1", ofsted_notified: false }),
        makeAdmission({ id: "2", ofsted_notified: false }),
      ];
      expect(computeAdmissionMetrics(records).ofsted_notified_rate).toBe(0);
    });

    it("rounds correctly for 2 of 3 (66.7)", () => {
      const records = [
        makeAdmission({ id: "1", ofsted_notified: true }),
        makeAdmission({ id: "2", ofsted_notified: true }),
        makeAdmission({ id: "3", ofsted_notified: false }),
      ];
      expect(computeAdmissionMetrics(records).ofsted_notified_rate).toBe(66.7);
    });
  });

  // ── existing_children_consulted_rate ──────────────────────────────
  describe("existing_children_consulted_rate", () => {
    it("is 100 when all consulted", () => {
      const records = [
        makeAdmission({ id: "1", existing_children_consulted: true }),
        makeAdmission({ id: "2", existing_children_consulted: true }),
      ];
      expect(computeAdmissionMetrics(records).existing_children_consulted_rate).toBe(100);
    });

    it("is 0 when none consulted", () => {
      const records = [
        makeAdmission({ id: "1", existing_children_consulted: false }),
        makeAdmission({ id: "2", existing_children_consulted: false }),
      ];
      expect(computeAdmissionMetrics(records).existing_children_consulted_rate).toBe(0);
    });

    it("rounds correctly for 1 of 3 (33.3)", () => {
      const records = [
        makeAdmission({ id: "1", existing_children_consulted: true }),
        makeAdmission({ id: "2", existing_children_consulted: false }),
        makeAdmission({ id: "3", existing_children_consulted: false }),
      ];
      expect(computeAdmissionMetrics(records).existing_children_consulted_rate).toBe(33.3);
    });
  });

  // ── staff_briefed_rate ────────────────────────────────────────────
  describe("staff_briefed_rate", () => {
    it("is 100 when all briefed", () => {
      const records = [
        makeAdmission({ id: "1", staff_briefed: true }),
        makeAdmission({ id: "2", staff_briefed: true }),
      ];
      expect(computeAdmissionMetrics(records).staff_briefed_rate).toBe(100);
    });

    it("is 0 when none briefed", () => {
      const records = [
        makeAdmission({ id: "1", staff_briefed: false }),
        makeAdmission({ id: "2", staff_briefed: false }),
      ];
      expect(computeAdmissionMetrics(records).staff_briefed_rate).toBe(0);
    });

    it("rounds correctly for 2 of 3 (66.7)", () => {
      const records = [
        makeAdmission({ id: "1", staff_briefed: true }),
        makeAdmission({ id: "2", staff_briefed: true }),
        makeAdmission({ id: "3", staff_briefed: false }),
      ];
      expect(computeAdmissionMetrics(records).staff_briefed_rate).toBe(66.7);
    });
  });

  // ── child_views_captured_rate ─────────────────────────────────────
  describe("child_views_captured_rate", () => {
    it("is 100 when all captured", () => {
      const records = [
        makeAdmission({ id: "1", child_views_captured: true }),
        makeAdmission({ id: "2", child_views_captured: true }),
      ];
      expect(computeAdmissionMetrics(records).child_views_captured_rate).toBe(100);
    });

    it("is 0 when none captured", () => {
      const records = [
        makeAdmission({ id: "1", child_views_captured: false }),
        makeAdmission({ id: "2", child_views_captured: false }),
      ];
      expect(computeAdmissionMetrics(records).child_views_captured_rate).toBe(0);
    });

    it("rounds correctly for 1 of 3 (33.3)", () => {
      const records = [
        makeAdmission({ id: "1", child_views_captured: true }),
        makeAdmission({ id: "2", child_views_captured: false }),
        makeAdmission({ id: "3", child_views_captured: false }),
      ];
      expect(computeAdmissionMetrics(records).child_views_captured_rate).toBe(33.3);
    });
  });

  // ── good_match_rate (denominator excludes not_assessed) ───────────
  describe("good_match_rate", () => {
    it("is 100 when all assessed are good_match", () => {
      const records = [
        makeAdmission({ id: "1", matching_outcome: "good_match" }),
        makeAdmission({ id: "2", matching_outcome: "good_match" }),
      ];
      expect(computeAdmissionMetrics(records).good_match_rate).toBe(100);
    });

    it("is 0 when none are good_match", () => {
      const records = [
        makeAdmission({ id: "1", matching_outcome: "poor_match" }),
        makeAdmission({ id: "2", matching_outcome: "acceptable_match" }),
      ];
      expect(computeAdmissionMetrics(records).good_match_rate).toBe(0);
    });

    it("is 0 when all are not_assessed", () => {
      const records = [
        makeAdmission({ id: "1", matching_outcome: "not_assessed" }),
        makeAdmission({ id: "2", matching_outcome: "not_assessed" }),
      ];
      expect(computeAdmissionMetrics(records).good_match_rate).toBeNull();;
    });

    it("excludes not_assessed from denominator", () => {
      const records = [
        makeAdmission({ id: "1", matching_outcome: "good_match" }),
        makeAdmission({ id: "2", matching_outcome: "not_assessed" }),
        makeAdmission({ id: "3", matching_outcome: "not_assessed" }),
      ];
      // 1 good_match / 1 assessed = 100
      expect(computeAdmissionMetrics(records).good_match_rate).toBe(100);
    });

    it("is 50 for 1 good of 2 assessed", () => {
      const records = [
        makeAdmission({ id: "1", matching_outcome: "good_match" }),
        makeAdmission({ id: "2", matching_outcome: "poor_match" }),
      ];
      expect(computeAdmissionMetrics(records).good_match_rate).toBe(50);
    });

    it("rounds correctly for 1 of 3 assessed (33.3)", () => {
      const records = [
        makeAdmission({ id: "1", matching_outcome: "good_match" }),
        makeAdmission({ id: "2", matching_outcome: "poor_match" }),
        makeAdmission({ id: "3", matching_outcome: "acceptable_match" }),
      ];
      expect(computeAdmissionMetrics(records).good_match_rate).toBe(33.3);
    });

    it("rounds correctly for 2 of 3 assessed (66.7)", () => {
      const records = [
        makeAdmission({ id: "1", matching_outcome: "good_match" }),
        makeAdmission({ id: "2", matching_outcome: "good_match" }),
        makeAdmission({ id: "3", matching_outcome: "acceptable_match" }),
      ];
      expect(computeAdmissionMetrics(records).good_match_rate).toBe(66.7);
    });

    it("mixed assessed and not_assessed calculates correctly", () => {
      const records = [
        makeAdmission({ id: "1", matching_outcome: "good_match" }),
        makeAdmission({ id: "2", matching_outcome: "acceptable_match" }),
        makeAdmission({ id: "3", matching_outcome: "not_assessed" }),
        makeAdmission({ id: "4", matching_outcome: "not_assessed" }),
      ];
      // 1 good_match / 2 assessed = 50
      expect(computeAdmissionMetrics(records).good_match_rate).toBe(50);
    });
  });

  // ── poor_match_count ──────────────────────────────────────────────
  describe("poor_match_count", () => {
    it("counts only poor_match outcomes", () => {
      const records = [
        makeAdmission({ id: "1", matching_outcome: "poor_match" }),
        makeAdmission({ id: "2", matching_outcome: "poor_match" }),
        makeAdmission({ id: "3", matching_outcome: "good_match" }),
      ];
      expect(computeAdmissionMetrics(records).poor_match_count).toBe(2);
    });

    it("returns 0 when no poor matches", () => {
      const records = [
        makeAdmission({ id: "1", matching_outcome: "good_match" }),
        makeAdmission({ id: "2", matching_outcome: "acceptable_match" }),
      ];
      expect(computeAdmissionMetrics(records).poor_match_count).toBe(0);
    });
  });

  // ── significant_impact_count ──────────────────────────────────────
  describe("significant_impact_count", () => {
    it("counts only significant_impact", () => {
      const records = [
        makeAdmission({ id: "1", impact_on_existing_children: "significant_impact" }),
        makeAdmission({ id: "2", impact_on_existing_children: "significant_impact" }),
        makeAdmission({ id: "3", impact_on_existing_children: "no_impact" }),
      ];
      expect(computeAdmissionMetrics(records).significant_impact_count).toBe(2);
    });

    it("returns 0 when no significant impacts", () => {
      const records = [
        makeAdmission({ id: "1", impact_on_existing_children: "no_impact" }),
        makeAdmission({ id: "2", impact_on_existing_children: "minimal_impact" }),
      ];
      expect(computeAdmissionMetrics(records).significant_impact_count).toBe(0);
    });
  });

  // ── disruption_count ──────────────────────────────────────────────
  describe("disruption_count", () => {
    it("counts disruptions correctly", () => {
      const records = [
        makeAdmission({ id: "1", disruption_to_placement: true }),
        makeAdmission({ id: "2", disruption_to_placement: true }),
        makeAdmission({ id: "3", disruption_to_placement: false }),
      ];
      expect(computeAdmissionMetrics(records).disruption_count).toBe(2);
    });

    it("returns 0 when no disruptions", () => {
      const records = [
        makeAdmission({ id: "1", disruption_to_placement: false }),
        makeAdmission({ id: "2", disruption_to_placement: false }),
      ];
      expect(computeAdmissionMetrics(records).disruption_count).toBe(0);
    });
  });

  // ── by_ breakdown maps ────────────────────────────────────────────
  describe("by_ breakdown maps", () => {
    it("by_admission_type handles multiple types", () => {
      const records = [
        makeAdmission({ id: "1", admission_type: "emergency" }),
        makeAdmission({ id: "2", admission_type: "emergency" }),
        makeAdmission({ id: "3", admission_type: "crisis" }),
        makeAdmission({ id: "4", admission_type: "respite" }),
      ];
      expect(computeAdmissionMetrics(records).by_admission_type).toEqual({
        emergency: 2,
        crisis: 1,
        respite: 1,
      });
    });

    it("by_referral_source handles multiple sources", () => {
      const records = [
        makeAdmission({ id: "1", referral_source: "local_authority" }),
        makeAdmission({ id: "2", referral_source: "local_authority" }),
        makeAdmission({ id: "3", referral_source: "police" }),
        makeAdmission({ id: "4", referral_source: "court" }),
      ];
      expect(computeAdmissionMetrics(records).by_referral_source).toEqual({
        local_authority: 2,
        police: 1,
        court: 1,
      });
    });

    it("by_matching_outcome handles all outcomes present", () => {
      const records = [
        makeAdmission({ id: "1", matching_outcome: "good_match" }),
        makeAdmission({ id: "2", matching_outcome: "acceptable_match" }),
        makeAdmission({ id: "3", matching_outcome: "poor_match" }),
        makeAdmission({ id: "4", matching_outcome: "not_assessed" }),
        makeAdmission({ id: "5", matching_outcome: "overridden_by_la" }),
      ];
      expect(computeAdmissionMetrics(records).by_matching_outcome).toEqual({
        good_match: 1,
        acceptable_match: 1,
        poor_match: 1,
        not_assessed: 1,
        overridden_by_la: 1,
      });
    });

    it("by_impact_assessment handles all assessments present", () => {
      const records = [
        makeAdmission({ id: "1", impact_on_existing_children: "no_impact" }),
        makeAdmission({ id: "2", impact_on_existing_children: "minimal_impact" }),
        makeAdmission({ id: "3", impact_on_existing_children: "moderate_impact" }),
        makeAdmission({ id: "4", impact_on_existing_children: "significant_impact" }),
        makeAdmission({ id: "5", impact_on_existing_children: "not_assessed" }),
      ];
      expect(computeAdmissionMetrics(records).by_impact_assessment).toEqual({
        no_impact: 1,
        minimal_impact: 1,
        moderate_impact: 1,
        significant_impact: 1,
        not_assessed: 1,
      });
    });

    it("by_admission_type handles single type", () => {
      const records = [
        makeAdmission({ id: "1", admission_type: "transfer" }),
        makeAdmission({ id: "2", admission_type: "transfer" }),
        makeAdmission({ id: "3", admission_type: "transfer" }),
      ];
      expect(computeAdmissionMetrics(records).by_admission_type).toEqual({
        transfer: 3,
      });
    });

    it("by_referral_source handles single source", () => {
      const records = [
        makeAdmission({ id: "1", referral_source: "family" }),
        makeAdmission({ id: "2", referral_source: "family" }),
      ];
      expect(computeAdmissionMetrics(records).by_referral_source).toEqual({
        family: 2,
      });
    });
  });

  // ── Rate rounding consistency ──────────────────────────────────────
  describe("rate rounding consistency", () => {
    it("all rates use Math.round(value * 1000) / 10 formula", () => {
      const records = [
        makeAdmission({
          id: "1",
          risk_assessment_completed: true,
          placement_plan_within_24h: true,
          social_worker_contacted: true,
          ofsted_notified: true,
          existing_children_consulted: true,
          staff_briefed: true,
          child_views_captured: true,
        }),
        makeAdmission({
          id: "2",
          risk_assessment_completed: true,
          placement_plan_within_24h: false,
          social_worker_contacted: false,
          ofsted_notified: true,
          existing_children_consulted: false,
          staff_briefed: true,
          child_views_captured: false,
        }),
        makeAdmission({
          id: "3",
          risk_assessment_completed: false,
          placement_plan_within_24h: false,
          social_worker_contacted: false,
          ofsted_notified: false,
          existing_children_consulted: false,
          staff_briefed: false,
          child_views_captured: false,
        }),
      ];
      const m = computeAdmissionMetrics(records);
      // 2/3 = 66.7
      expect(m.risk_assessment_rate).toBe(66.7);
      // 1/3 = 33.3
      expect(m.placement_plan_rate).toBe(33.3);
      // 1/3 = 33.3
      expect(m.social_worker_contacted_rate).toBe(33.3);
      // 2/3 = 66.7
      expect(m.ofsted_notified_rate).toBe(66.7);
      // 1/3 = 33.3
      expect(m.existing_children_consulted_rate).toBe(33.3);
      // 2/3 = 66.7
      expect(m.staff_briefed_rate).toBe(66.7);
      // 1/3 = 33.3
      expect(m.child_views_captured_rate).toBe(33.3);
    });

    it("rates are 0 for empty array", () => {
      const m = computeAdmissionMetrics([]);
      expect(m.risk_assessment_rate).toBeNull();;
      expect(m.placement_plan_rate).toBeNull();;
      expect(m.social_worker_contacted_rate).toBeNull();;
      expect(m.ofsted_notified_rate).toBeNull();;
      expect(m.existing_children_consulted_rate).toBeNull();;
      expect(m.staff_briefed_rate).toBeNull();;
      expect(m.child_views_captured_rate).toBeNull();;
      expect(m.good_match_rate).toBeNull();;
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. identifyAdmissionAlerts
// ═══════════════════════════════════════════════════════════════════════════

describe("identifyAdmissionAlerts", () => {
  // ── No alerts ──────────────────────────────────────────────────────
  describe("no alerts scenario", () => {
    it("returns empty array for empty admissions", () => {
      expect(identifyAdmissionAlerts([])).toEqual([]);
    });

    it("returns empty array when everything is well-managed", () => {
      const records = [
        makeAdmission({
          id: "a-1",
          admission_type: "planned",
          impact_on_existing_children: "no_impact",
          risk_assessment_completed: true,
          matching_outcome: "good_match",
          existing_children_consulted: true,
          placement_plan_within_24h: true,
        }),
      ];
      expect(identifyAdmissionAlerts(records)).toEqual([]);
    });

    it("returns empty when emergency has risk assessment completed", () => {
      const records = [
        makeAdmission({
          id: "a-1",
          admission_type: "emergency",
          risk_assessment_completed: true,
          matching_outcome: "good_match",
          impact_on_existing_children: "no_impact",
          existing_children_consulted: true,
          placement_plan_within_24h: true,
        }),
      ];
      expect(identifyAdmissionAlerts(records)).toEqual([]);
    });

    it("returns empty when crisis has risk assessment completed", () => {
      const records = [
        makeAdmission({
          id: "a-1",
          admission_type: "crisis",
          risk_assessment_completed: true,
          matching_outcome: "acceptable_match",
          impact_on_existing_children: "no_impact",
          existing_children_consulted: true,
          placement_plan_within_24h: true,
        }),
      ];
      expect(identifyAdmissionAlerts(records)).toEqual([]);
    });
  });

  // ── significant_impact alert (critical) ───────────────────────────
  describe("significant_impact alert", () => {
    it("fires when impact_on_existing_children is significant_impact", () => {
      const records = [
        makeAdmission({
          id: "a-1",
          impact_on_existing_children: "significant_impact",
          child_name: "Alice Smith",
          existing_children_consulted: true,
          placement_plan_within_24h: true,
        }),
      ];
      const alerts = identifyAdmissionAlerts(records);
      const si = alerts.find((a) => a.type === "significant_impact");
      expect(si).toBeTruthy();
    });

    it("has critical severity", () => {
      const records = [
        makeAdmission({
          id: "a-1",
          impact_on_existing_children: "significant_impact",
          existing_children_consulted: true,
          placement_plan_within_24h: true,
        }),
      ];
      const alerts = identifyAdmissionAlerts(records);
      const si = alerts.find((a) => a.type === "significant_impact")!;
      expect(si.severity).toBe("critical");
    });

    it("uses the record id as alert id", () => {
      const records = [
        makeAdmission({
          id: "a-42",
          impact_on_existing_children: "significant_impact",
          existing_children_consulted: true,
          placement_plan_within_24h: true,
        }),
      ];
      const alerts = identifyAdmissionAlerts(records);
      const si = alerts.find((a) => a.type === "significant_impact")!;
      expect(si.id).toBe("a-42");
    });

    it("message contains child_name", () => {
      const records = [
        makeAdmission({
          id: "a-1",
          impact_on_existing_children: "significant_impact",
          child_name: "Bobby Brown",
          existing_children_consulted: true,
          placement_plan_within_24h: true,
        }),
      ];
      const alerts = identifyAdmissionAlerts(records);
      const si = alerts.find((a) => a.type === "significant_impact")!;
      expect(si.message).toContain("Bobby Brown");
    });

    it("does NOT fire for no_impact", () => {
      const records = [
        makeAdmission({
          id: "a-1",
          impact_on_existing_children: "no_impact",
          existing_children_consulted: true,
          placement_plan_within_24h: true,
        }),
      ];
      const alerts = identifyAdmissionAlerts(records);
      expect(alerts.find((a) => a.type === "significant_impact")).toBeUndefined();
    });

    it("does NOT fire for minimal_impact", () => {
      const records = [
        makeAdmission({
          id: "a-1",
          impact_on_existing_children: "minimal_impact",
          existing_children_consulted: true,
          placement_plan_within_24h: true,
        }),
      ];
      const alerts = identifyAdmissionAlerts(records);
      expect(alerts.find((a) => a.type === "significant_impact")).toBeUndefined();
    });

    it("does NOT fire for moderate_impact", () => {
      const records = [
        makeAdmission({
          id: "a-1",
          impact_on_existing_children: "moderate_impact",
          existing_children_consulted: true,
          placement_plan_within_24h: true,
        }),
      ];
      const alerts = identifyAdmissionAlerts(records);
      expect(alerts.find((a) => a.type === "significant_impact")).toBeUndefined();
    });

    it("does NOT fire for not_assessed impact", () => {
      const records = [
        makeAdmission({
          id: "a-1",
          impact_on_existing_children: "not_assessed",
          existing_children_consulted: true,
          placement_plan_within_24h: true,
        }),
      ];
      const alerts = identifyAdmissionAlerts(records);
      expect(alerts.find((a) => a.type === "significant_impact")).toBeUndefined();
    });

    it("fires per record for multiple significant impacts", () => {
      const records = [
        makeAdmission({
          id: "a-1",
          impact_on_existing_children: "significant_impact",
          child_name: "Alice",
          existing_children_consulted: true,
          placement_plan_within_24h: true,
        }),
        makeAdmission({
          id: "a-2",
          impact_on_existing_children: "significant_impact",
          child_name: "Bob",
          existing_children_consulted: true,
          placement_plan_within_24h: true,
        }),
      ];
      const alerts = identifyAdmissionAlerts(records);
      const si = alerts.filter((a) => a.type === "significant_impact");
      expect(si).toHaveLength(2);
    });

    it("fires only for qualifying records among mixed set", () => {
      const records = [
        makeAdmission({
          id: "a-1",
          impact_on_existing_children: "significant_impact",
          existing_children_consulted: true,
          placement_plan_within_24h: true,
        }),
        makeAdmission({
          id: "a-2",
          impact_on_existing_children: "no_impact",
          existing_children_consulted: true,
          placement_plan_within_24h: true,
        }),
        makeAdmission({
          id: "a-3",
          impact_on_existing_children: "moderate_impact",
          existing_children_consulted: true,
          placement_plan_within_24h: true,
        }),
      ];
      const alerts = identifyAdmissionAlerts(records);
      const si = alerts.filter((a) => a.type === "significant_impact");
      expect(si).toHaveLength(1);
      expect(si[0].id).toBe("a-1");
    });
  });

  // ── no_risk_assessment alert (high) ───────────────────────────────
  describe("no_risk_assessment alert", () => {
    it("fires for emergency admission without risk assessment", () => {
      const records = [
        makeAdmission({
          id: "a-1",
          admission_type: "emergency",
          risk_assessment_completed: false,
          child_name: "Alice Smith",
          existing_children_consulted: true,
          placement_plan_within_24h: true,
        }),
      ];
      const alerts = identifyAdmissionAlerts(records);
      const nra = alerts.find((a) => a.type === "no_risk_assessment");
      expect(nra).toBeTruthy();
    });

    it("fires for crisis admission without risk assessment", () => {
      const records = [
        makeAdmission({
          id: "a-1",
          admission_type: "crisis",
          risk_assessment_completed: false,
          child_name: "Alice Smith",
          existing_children_consulted: true,
          placement_plan_within_24h: true,
        }),
      ];
      const alerts = identifyAdmissionAlerts(records);
      const nra = alerts.find((a) => a.type === "no_risk_assessment");
      expect(nra).toBeTruthy();
    });

    it("has high severity", () => {
      const records = [
        makeAdmission({
          id: "a-1",
          admission_type: "emergency",
          risk_assessment_completed: false,
          existing_children_consulted: true,
          placement_plan_within_24h: true,
        }),
      ];
      const alerts = identifyAdmissionAlerts(records);
      const nra = alerts.find((a) => a.type === "no_risk_assessment")!;
      expect(nra.severity).toBe("high");
    });

    it("uses the record id as alert id", () => {
      const records = [
        makeAdmission({
          id: "a-77",
          admission_type: "emergency",
          risk_assessment_completed: false,
          existing_children_consulted: true,
          placement_plan_within_24h: true,
        }),
      ];
      const alerts = identifyAdmissionAlerts(records);
      const nra = alerts.find((a) => a.type === "no_risk_assessment")!;
      expect(nra.id).toBe("a-77");
    });

    it("message contains child_name", () => {
      const records = [
        makeAdmission({
          id: "a-1",
          admission_type: "emergency",
          risk_assessment_completed: false,
          child_name: "Emma White",
          existing_children_consulted: true,
          placement_plan_within_24h: true,
        }),
      ];
      const alerts = identifyAdmissionAlerts(records);
      const nra = alerts.find((a) => a.type === "no_risk_assessment")!;
      expect(nra.message).toContain("Emma White");
    });

    it("message contains admission_type with underscore replaced by space for emergency", () => {
      const records = [
        makeAdmission({
          id: "a-1",
          admission_type: "emergency",
          risk_assessment_completed: false,
          existing_children_consulted: true,
          placement_plan_within_24h: true,
        }),
      ];
      const alerts = identifyAdmissionAlerts(records);
      const nra = alerts.find((a) => a.type === "no_risk_assessment")!;
      expect(nra.message).toContain("emergency");
    });

    it("message contains admission_type with underscore replaced by space for crisis", () => {
      const records = [
        makeAdmission({
          id: "a-1",
          admission_type: "crisis",
          risk_assessment_completed: false,
          existing_children_consulted: true,
          placement_plan_within_24h: true,
        }),
      ];
      const alerts = identifyAdmissionAlerts(records);
      const nra = alerts.find((a) => a.type === "no_risk_assessment")!;
      expect(nra.message).toContain("crisis");
    });

    it("does NOT fire for planned admission without risk assessment", () => {
      const records = [
        makeAdmission({
          id: "a-1",
          admission_type: "planned",
          risk_assessment_completed: false,
          existing_children_consulted: true,
          placement_plan_within_24h: true,
        }),
      ];
      const alerts = identifyAdmissionAlerts(records);
      expect(alerts.find((a) => a.type === "no_risk_assessment")).toBeUndefined();
    });

    it("does NOT fire for respite admission without risk assessment", () => {
      const records = [
        makeAdmission({
          id: "a-1",
          admission_type: "respite",
          risk_assessment_completed: false,
          existing_children_consulted: true,
          placement_plan_within_24h: true,
        }),
      ];
      const alerts = identifyAdmissionAlerts(records);
      expect(alerts.find((a) => a.type === "no_risk_assessment")).toBeUndefined();
    });

    it("does NOT fire for transfer admission without risk assessment", () => {
      const records = [
        makeAdmission({
          id: "a-1",
          admission_type: "transfer",
          risk_assessment_completed: false,
          existing_children_consulted: true,
          placement_plan_within_24h: true,
        }),
      ];
      const alerts = identifyAdmissionAlerts(records);
      expect(alerts.find((a) => a.type === "no_risk_assessment")).toBeUndefined();
    });

    it("does NOT fire for step_down admission without risk assessment", () => {
      const records = [
        makeAdmission({
          id: "a-1",
          admission_type: "step_down",
          risk_assessment_completed: false,
          existing_children_consulted: true,
          placement_plan_within_24h: true,
        }),
      ];
      const alerts = identifyAdmissionAlerts(records);
      expect(alerts.find((a) => a.type === "no_risk_assessment")).toBeUndefined();
    });

    it("does NOT fire for other admission without risk assessment", () => {
      const records = [
        makeAdmission({
          id: "a-1",
          admission_type: "other",
          risk_assessment_completed: false,
          existing_children_consulted: true,
          placement_plan_within_24h: true,
        }),
      ];
      const alerts = identifyAdmissionAlerts(records);
      expect(alerts.find((a) => a.type === "no_risk_assessment")).toBeUndefined();
    });

    it("does NOT fire when risk assessment is completed", () => {
      const records = [
        makeAdmission({
          id: "a-1",
          admission_type: "emergency",
          risk_assessment_completed: true,
          existing_children_consulted: true,
          placement_plan_within_24h: true,
        }),
      ];
      const alerts = identifyAdmissionAlerts(records);
      expect(alerts.find((a) => a.type === "no_risk_assessment")).toBeUndefined();
    });

    it("fires per record for multiple qualifying admissions", () => {
      const records = [
        makeAdmission({
          id: "a-1",
          admission_type: "emergency",
          risk_assessment_completed: false,
          existing_children_consulted: true,
          placement_plan_within_24h: true,
        }),
        makeAdmission({
          id: "a-2",
          admission_type: "crisis",
          risk_assessment_completed: false,
          existing_children_consulted: true,
          placement_plan_within_24h: true,
        }),
      ];
      const alerts = identifyAdmissionAlerts(records);
      const nra = alerts.filter((a) => a.type === "no_risk_assessment");
      expect(nra).toHaveLength(2);
    });

    it("fires only for qualifying records among mixed set", () => {
      const records = [
        makeAdmission({
          id: "a-1",
          admission_type: "emergency",
          risk_assessment_completed: false,
          existing_children_consulted: true,
          placement_plan_within_24h: true,
        }),
        makeAdmission({
          id: "a-2",
          admission_type: "emergency",
          risk_assessment_completed: true,
          existing_children_consulted: true,
          placement_plan_within_24h: true,
        }),
        makeAdmission({
          id: "a-3",
          admission_type: "planned",
          risk_assessment_completed: false,
          existing_children_consulted: true,
          placement_plan_within_24h: true,
        }),
      ];
      const alerts = identifyAdmissionAlerts(records);
      const nra = alerts.filter((a) => a.type === "no_risk_assessment");
      expect(nra).toHaveLength(1);
      expect(nra[0].id).toBe("a-1");
    });
  });

  // ── poor_match alert (high) ───────────────────────────────────────
  describe("poor_match alert", () => {
    it("fires when matching_outcome is poor_match", () => {
      const records = [
        makeAdmission({
          id: "a-1",
          matching_outcome: "poor_match",
          child_name: "Alice Smith",
          existing_children_consulted: true,
          placement_plan_within_24h: true,
        }),
      ];
      const alerts = identifyAdmissionAlerts(records);
      const pm = alerts.find((a) => a.type === "poor_match");
      expect(pm).toBeTruthy();
    });

    it("has high severity", () => {
      const records = [
        makeAdmission({
          id: "a-1",
          matching_outcome: "poor_match",
          existing_children_consulted: true,
          placement_plan_within_24h: true,
        }),
      ];
      const alerts = identifyAdmissionAlerts(records);
      const pm = alerts.find((a) => a.type === "poor_match")!;
      expect(pm.severity).toBe("high");
    });

    it("uses the record id as alert id", () => {
      const records = [
        makeAdmission({
          id: "a-55",
          matching_outcome: "poor_match",
          existing_children_consulted: true,
          placement_plan_within_24h: true,
        }),
      ];
      const alerts = identifyAdmissionAlerts(records);
      const pm = alerts.find((a) => a.type === "poor_match")!;
      expect(pm.id).toBe("a-55");
    });

    it("message contains child_name", () => {
      const records = [
        makeAdmission({
          id: "a-1",
          matching_outcome: "poor_match",
          child_name: "Charlie Doe",
          existing_children_consulted: true,
          placement_plan_within_24h: true,
        }),
      ];
      const alerts = identifyAdmissionAlerts(records);
      const pm = alerts.find((a) => a.type === "poor_match")!;
      expect(pm.message).toContain("Charlie Doe");
    });

    it("does NOT fire for good_match", () => {
      const records = [
        makeAdmission({
          id: "a-1",
          matching_outcome: "good_match",
          existing_children_consulted: true,
          placement_plan_within_24h: true,
        }),
      ];
      const alerts = identifyAdmissionAlerts(records);
      expect(alerts.find((a) => a.type === "poor_match")).toBeUndefined();
    });

    it("does NOT fire for acceptable_match", () => {
      const records = [
        makeAdmission({
          id: "a-1",
          matching_outcome: "acceptable_match",
          existing_children_consulted: true,
          placement_plan_within_24h: true,
        }),
      ];
      const alerts = identifyAdmissionAlerts(records);
      expect(alerts.find((a) => a.type === "poor_match")).toBeUndefined();
    });

    it("does NOT fire for not_assessed", () => {
      const records = [
        makeAdmission({
          id: "a-1",
          matching_outcome: "not_assessed",
          existing_children_consulted: true,
          placement_plan_within_24h: true,
        }),
      ];
      const alerts = identifyAdmissionAlerts(records);
      expect(alerts.find((a) => a.type === "poor_match")).toBeUndefined();
    });

    it("does NOT fire for overridden_by_la", () => {
      const records = [
        makeAdmission({
          id: "a-1",
          matching_outcome: "overridden_by_la",
          existing_children_consulted: true,
          placement_plan_within_24h: true,
        }),
      ];
      const alerts = identifyAdmissionAlerts(records);
      expect(alerts.find((a) => a.type === "poor_match")).toBeUndefined();
    });

    it("fires per record for multiple poor matches", () => {
      const records = [
        makeAdmission({
          id: "a-1",
          matching_outcome: "poor_match",
          child_name: "Alice",
          existing_children_consulted: true,
          placement_plan_within_24h: true,
        }),
        makeAdmission({
          id: "a-2",
          matching_outcome: "poor_match",
          child_name: "Bob",
          existing_children_consulted: true,
          placement_plan_within_24h: true,
        }),
      ];
      const alerts = identifyAdmissionAlerts(records);
      const pm = alerts.filter((a) => a.type === "poor_match");
      expect(pm).toHaveLength(2);
    });

    it("fires only for poor_match among mixed outcomes", () => {
      const records = [
        makeAdmission({
          id: "a-1",
          matching_outcome: "poor_match",
          existing_children_consulted: true,
          placement_plan_within_24h: true,
        }),
        makeAdmission({
          id: "a-2",
          matching_outcome: "good_match",
          existing_children_consulted: true,
          placement_plan_within_24h: true,
        }),
        makeAdmission({
          id: "a-3",
          matching_outcome: "acceptable_match",
          existing_children_consulted: true,
          placement_plan_within_24h: true,
        }),
      ];
      const alerts = identifyAdmissionAlerts(records);
      const pm = alerts.filter((a) => a.type === "poor_match");
      expect(pm).toHaveLength(1);
      expect(pm[0].id).toBe("a-1");
    });
  });

  // ── children_not_consulted alert (medium) ─────────────────────────
  describe("children_not_consulted alert", () => {
    it("fires when 1 non-planned admission has existing_children_consulted=false", () => {
      const records = [
        makeAdmission({
          id: "a-1",
          admission_type: "emergency",
          existing_children_consulted: false,
          placement_plan_within_24h: true,
        }),
      ];
      const alerts = identifyAdmissionAlerts(records);
      const cnc = alerts.find((a) => a.type === "children_not_consulted");
      expect(cnc).toBeTruthy();
    });

    it("has medium severity", () => {
      const records = [
        makeAdmission({
          id: "a-1",
          admission_type: "emergency",
          existing_children_consulted: false,
          placement_plan_within_24h: true,
        }),
      ];
      const alerts = identifyAdmissionAlerts(records);
      const cnc = alerts.find((a) => a.type === "children_not_consulted")!;
      expect(cnc.severity).toBe("medium");
    });

    it("has id children_not_consulted", () => {
      const records = [
        makeAdmission({
          id: "a-1",
          admission_type: "emergency",
          existing_children_consulted: false,
          placement_plan_within_24h: true,
        }),
      ];
      const alerts = identifyAdmissionAlerts(records);
      const cnc = alerts.find((a) => a.type === "children_not_consulted")!;
      expect(cnc.id).toBe("children_not_consulted");
    });

    it("message uses singular 'admission was' for 1", () => {
      const records = [
        makeAdmission({
          id: "a-1",
          admission_type: "emergency",
          existing_children_consulted: false,
          placement_plan_within_24h: true,
        }),
      ];
      const alerts = identifyAdmissionAlerts(records);
      const cnc = alerts.find((a) => a.type === "children_not_consulted")!;
      expect(cnc.message).toContain("admission was");
    });

    it("message uses plural 'admissions were' for 2", () => {
      const records = [
        makeAdmission({
          id: "a-1",
          admission_type: "emergency",
          existing_children_consulted: false,
          placement_plan_within_24h: true,
        }),
        makeAdmission({
          id: "a-2",
          admission_type: "crisis",
          existing_children_consulted: false,
          placement_plan_within_24h: true,
        }),
      ];
      const alerts = identifyAdmissionAlerts(records);
      const cnc = alerts.find((a) => a.type === "children_not_consulted")!;
      expect(cnc.message).toContain("admissions were");
    });

    it("message contains count of not-consulted admissions", () => {
      const records = [
        makeAdmission({ id: "a-1", admission_type: "emergency", existing_children_consulted: false, placement_plan_within_24h: true }),
        makeAdmission({ id: "a-2", admission_type: "crisis", existing_children_consulted: false, placement_plan_within_24h: true }),
        makeAdmission({ id: "a-3", admission_type: "respite", existing_children_consulted: false, placement_plan_within_24h: true }),
      ];
      const alerts = identifyAdmissionAlerts(records);
      const cnc = alerts.find((a) => a.type === "children_not_consulted")!;
      expect(cnc.message).toContain("3");
    });

    it("excludes planned admissions from count", () => {
      const records = [
        makeAdmission({
          id: "a-1",
          admission_type: "planned",
          existing_children_consulted: false,
          placement_plan_within_24h: true,
        }),
      ];
      const alerts = identifyAdmissionAlerts(records);
      expect(alerts.find((a) => a.type === "children_not_consulted")).toBeUndefined();
    });

    it("does NOT fire when all non-planned have consulted=true", () => {
      const records = [
        makeAdmission({
          id: "a-1",
          admission_type: "emergency",
          existing_children_consulted: true,
          placement_plan_within_24h: true,
        }),
        makeAdmission({
          id: "a-2",
          admission_type: "crisis",
          existing_children_consulted: true,
          placement_plan_within_24h: true,
        }),
      ];
      const alerts = identifyAdmissionAlerts(records);
      expect(alerts.find((a) => a.type === "children_not_consulted")).toBeUndefined();
    });

    it("counts crisis admissions with consulted=false", () => {
      const records = [
        makeAdmission({
          id: "a-1",
          admission_type: "crisis",
          existing_children_consulted: false,
          placement_plan_within_24h: true,
        }),
      ];
      const alerts = identifyAdmissionAlerts(records);
      const cnc = alerts.find((a) => a.type === "children_not_consulted");
      expect(cnc).toBeTruthy();
    });

    it("counts respite admissions with consulted=false", () => {
      const records = [
        makeAdmission({
          id: "a-1",
          admission_type: "respite",
          existing_children_consulted: false,
          placement_plan_within_24h: true,
        }),
      ];
      const alerts = identifyAdmissionAlerts(records);
      const cnc = alerts.find((a) => a.type === "children_not_consulted");
      expect(cnc).toBeTruthy();
    });

    it("counts transfer admissions with consulted=false", () => {
      const records = [
        makeAdmission({
          id: "a-1",
          admission_type: "transfer",
          existing_children_consulted: false,
          placement_plan_within_24h: true,
        }),
      ];
      const alerts = identifyAdmissionAlerts(records);
      const cnc = alerts.find((a) => a.type === "children_not_consulted");
      expect(cnc).toBeTruthy();
    });

    it("mixed planned and non-planned counts only non-planned", () => {
      const records = [
        makeAdmission({ id: "a-1", admission_type: "planned", existing_children_consulted: false, placement_plan_within_24h: true }),
        makeAdmission({ id: "a-2", admission_type: "emergency", existing_children_consulted: false, placement_plan_within_24h: true }),
        makeAdmission({ id: "a-3", admission_type: "crisis", existing_children_consulted: false, placement_plan_within_24h: true }),
      ];
      const alerts = identifyAdmissionAlerts(records);
      const cnc = alerts.find((a) => a.type === "children_not_consulted")!;
      expect(cnc.message).toContain("2");
      expect(cnc.message).toContain("admissions were");
    });

    it("produces exactly one aggregate alert regardless of count", () => {
      const records = [
        makeAdmission({ id: "a-1", admission_type: "emergency", existing_children_consulted: false, placement_plan_within_24h: true }),
        makeAdmission({ id: "a-2", admission_type: "crisis", existing_children_consulted: false, placement_plan_within_24h: true }),
        makeAdmission({ id: "a-3", admission_type: "respite", existing_children_consulted: false, placement_plan_within_24h: true }),
      ];
      const alerts = identifyAdmissionAlerts(records);
      const cnc = alerts.filter((a) => a.type === "children_not_consulted");
      expect(cnc).toHaveLength(1);
    });
  });

  // ── no_placement_plan alert (medium) ──────────────────────────────
  describe("no_placement_plan alert", () => {
    it("fires when 1 admission has placement_plan_within_24h=false", () => {
      const records = [
        makeAdmission({
          id: "a-1",
          placement_plan_within_24h: false,
          existing_children_consulted: true,
        }),
      ];
      const alerts = identifyAdmissionAlerts(records);
      const np = alerts.find((a) => a.type === "no_placement_plan");
      expect(np).toBeTruthy();
    });

    it("has medium severity", () => {
      const records = [
        makeAdmission({
          id: "a-1",
          placement_plan_within_24h: false,
          existing_children_consulted: true,
        }),
      ];
      const alerts = identifyAdmissionAlerts(records);
      const np = alerts.find((a) => a.type === "no_placement_plan")!;
      expect(np.severity).toBe("medium");
    });

    it("has id no_placement_plan", () => {
      const records = [
        makeAdmission({
          id: "a-1",
          placement_plan_within_24h: false,
          existing_children_consulted: true,
        }),
      ];
      const alerts = identifyAdmissionAlerts(records);
      const np = alerts.find((a) => a.type === "no_placement_plan")!;
      expect(np.id).toBe("no_placement_plan");
    });

    it("message uses singular 'admission' for 1", () => {
      const records = [
        makeAdmission({
          id: "a-1",
          placement_plan_within_24h: false,
          existing_children_consulted: true,
        }),
      ];
      const alerts = identifyAdmissionAlerts(records);
      const np = alerts.find((a) => a.type === "no_placement_plan")!;
      expect(np.message).toContain("1 admission");
      expect(np.message).not.toContain("admissions");
    });

    it("message uses plural 'admissions' for 2", () => {
      const records = [
        makeAdmission({
          id: "a-1",
          placement_plan_within_24h: false,
          existing_children_consulted: true,
        }),
        makeAdmission({
          id: "a-2",
          placement_plan_within_24h: false,
          existing_children_consulted: true,
        }),
      ];
      const alerts = identifyAdmissionAlerts(records);
      const np = alerts.find((a) => a.type === "no_placement_plan")!;
      expect(np.message).toContain("2 admissions");
    });

    it("message contains count of admissions without plans", () => {
      const records = [
        makeAdmission({ id: "a-1", placement_plan_within_24h: false, existing_children_consulted: true }),
        makeAdmission({ id: "a-2", placement_plan_within_24h: false, existing_children_consulted: true }),
        makeAdmission({ id: "a-3", placement_plan_within_24h: false, existing_children_consulted: true }),
      ];
      const alerts = identifyAdmissionAlerts(records);
      const np = alerts.find((a) => a.type === "no_placement_plan")!;
      expect(np.message).toContain("3");
    });

    it("does NOT fire when all have placement plans", () => {
      const records = [
        makeAdmission({ id: "a-1", placement_plan_within_24h: true, existing_children_consulted: true }),
        makeAdmission({ id: "a-2", placement_plan_within_24h: true, existing_children_consulted: true }),
      ];
      const alerts = identifyAdmissionAlerts(records);
      expect(alerts.find((a) => a.type === "no_placement_plan")).toBeUndefined();
    });

    it("produces exactly one aggregate alert regardless of count", () => {
      const records = [
        makeAdmission({ id: "a-1", placement_plan_within_24h: false, existing_children_consulted: true }),
        makeAdmission({ id: "a-2", placement_plan_within_24h: false, existing_children_consulted: true }),
        makeAdmission({ id: "a-3", placement_plan_within_24h: false, existing_children_consulted: true }),
      ];
      const alerts = identifyAdmissionAlerts(records);
      const np = alerts.filter((a) => a.type === "no_placement_plan");
      expect(np).toHaveLength(1);
    });

    it("counts only admissions without plans in mixed set", () => {
      const records = [
        makeAdmission({ id: "a-1", placement_plan_within_24h: false, existing_children_consulted: true }),
        makeAdmission({ id: "a-2", placement_plan_within_24h: true, existing_children_consulted: true }),
        makeAdmission({ id: "a-3", placement_plan_within_24h: false, existing_children_consulted: true }),
      ];
      const alerts = identifyAdmissionAlerts(records);
      const np = alerts.find((a) => a.type === "no_placement_plan")!;
      expect(np.message).toContain("2");
    });
  });

  // ── Combined alert scenarios ──────────────────────────────────────
  describe("combined alert scenarios", () => {
    it("can fire all five alert types simultaneously", () => {
      const records = [
        // significant_impact + no_risk_assessment + poor_match + children_not_consulted + no_placement_plan
        makeAdmission({
          id: "a-1",
          admission_type: "emergency",
          impact_on_existing_children: "significant_impact",
          risk_assessment_completed: false,
          matching_outcome: "poor_match",
          existing_children_consulted: false,
          placement_plan_within_24h: false,
          child_name: "Test Child",
        }),
      ];
      const alerts = identifyAdmissionAlerts(records);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("significant_impact");
      expect(types).toContain("no_risk_assessment");
      expect(types).toContain("poor_match");
      expect(types).toContain("children_not_consulted");
      expect(types).toContain("no_placement_plan");
    });

    it("returns no alerts for a clean set of admissions", () => {
      const records = [
        makeAdmission({
          id: "a-1",
          admission_type: "planned",
          impact_on_existing_children: "no_impact",
          risk_assessment_completed: true,
          matching_outcome: "good_match",
          existing_children_consulted: true,
          placement_plan_within_24h: true,
        }),
        makeAdmission({
          id: "a-2",
          admission_type: "emergency",
          impact_on_existing_children: "minimal_impact",
          risk_assessment_completed: true,
          matching_outcome: "acceptable_match",
          existing_children_consulted: true,
          placement_plan_within_24h: true,
        }),
        makeAdmission({
          id: "a-3",
          admission_type: "crisis",
          impact_on_existing_children: "no_impact",
          risk_assessment_completed: true,
          matching_outcome: "good_match",
          existing_children_consulted: true,
          placement_plan_within_24h: true,
        }),
      ];
      const alerts = identifyAdmissionAlerts(records);
      expect(alerts).toEqual([]);
    });

    it("generates multiple alerts of same type for different records", () => {
      const records = [
        makeAdmission({
          id: "a-1",
          impact_on_existing_children: "significant_impact",
          child_name: "Alice",
          existing_children_consulted: true,
          placement_plan_within_24h: true,
        }),
        makeAdmission({
          id: "a-2",
          impact_on_existing_children: "significant_impact",
          child_name: "Bob",
          existing_children_consulted: true,
          placement_plan_within_24h: true,
        }),
      ];
      const alerts = identifyAdmissionAlerts(records);
      const si = alerts.filter((a) => a.type === "significant_impact");
      expect(si).toHaveLength(2);
      expect(si[0].message).toContain("Alice");
      expect(si[1].message).toContain("Bob");
    });

    it("alert order: significant_impact before no_risk_assessment before poor_match before children_not_consulted before no_placement_plan", () => {
      const records = [
        makeAdmission({
          id: "a-1",
          admission_type: "emergency",
          impact_on_existing_children: "significant_impact",
          risk_assessment_completed: false,
          matching_outcome: "poor_match",
          existing_children_consulted: false,
          placement_plan_within_24h: false,
          child_name: "Test Child",
        }),
      ];
      const alerts = identifyAdmissionAlerts(records);
      const types = alerts.map((a) => a.type);

      const siIdx = types.indexOf("significant_impact");
      const nraIdx = types.indexOf("no_risk_assessment");
      const pmIdx = types.indexOf("poor_match");
      const cncIdx = types.indexOf("children_not_consulted");
      const npIdx = types.indexOf("no_placement_plan");

      expect(siIdx).toBeLessThan(nraIdx);
      expect(nraIdx).toBeLessThan(pmIdx);
      expect(pmIdx).toBeLessThan(cncIdx);
      expect(cncIdx).toBeLessThan(npIdx);
    });

    it("per-record alerts use record id, aggregate alerts use fixed ids", () => {
      const records = [
        makeAdmission({
          id: "a-99",
          admission_type: "emergency",
          impact_on_existing_children: "significant_impact",
          risk_assessment_completed: false,
          matching_outcome: "poor_match",
          existing_children_consulted: false,
          placement_plan_within_24h: false,
        }),
      ];
      const alerts = identifyAdmissionAlerts(records);
      const si = alerts.find((a) => a.type === "significant_impact")!;
      const nra = alerts.find((a) => a.type === "no_risk_assessment")!;
      const pm = alerts.find((a) => a.type === "poor_match")!;
      const cnc = alerts.find((a) => a.type === "children_not_consulted")!;
      const np = alerts.find((a) => a.type === "no_placement_plan")!;

      expect(si.id).toBe("a-99");
      expect(nra.id).toBe("a-99");
      expect(pm.id).toBe("a-99");
      expect(cnc.id).toBe("children_not_consulted");
      expect(np.id).toBe("no_placement_plan");
    });
  });
});
