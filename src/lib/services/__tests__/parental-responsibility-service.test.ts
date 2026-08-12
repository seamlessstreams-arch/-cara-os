// ══════════════════════════════════════════════════════════════════════════════
// CARA — PARENTAL RESPONSIBILITY SERVICE TESTS
// Pure-function unit tests for PR metrics computation, alert identification,
// constant validation. CHR 2015 Reg 14 (care planning — PR arrangements),
// Reg 21 (privacy and access — parental involvement),
// Children Act 1989 s33 (effect of care order on PR),
// s2/s4 (acquisition of parental responsibility).
//
// SCCIF: Overall Experiences — "The home understands who holds
// parental responsibility and how decisions should be made."
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi } from "vitest";
import { todayStr } from "@/lib/utils";

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => false,
  createServerClient: () => null,
}));

import {
  _testing,
  CARE_ORDER_TYPES,
  PR_HOLDERS,
  PR_STATUSES,
  CONSENT_ARRANGEMENTS,
} from "../parental-responsibility-service";

import type {
  ParentalResponsibilityRecord,
  CareOrderType,
  PrHolder,
  PrStatus,
  ConsentArrangement,
} from "../parental-responsibility-service";

const { computePrMetrics, identifyPrAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

const now = new Date(todayStr());

/** Build a minimal ParentalResponsibilityRecord with sensible defaults. */
function makeRecord(
  overrides: Partial<ParentalResponsibilityRecord> = {},
): ParentalResponsibilityRecord {
  return {
    id: "pr-1",
    home_id: "home-1",
    child_name: "Alice Smith",
    child_id: "child-1",
    care_order_type: "full_care_order",
    care_order_date: "2024-01-15",
    care_order_expiry: null,
    pr_holder: "birth_mother",
    pr_holder_name: "Jane Smith",
    pr_status: "active",
    consent_arrangement: "la_consent_required",
    contact_with_pr_holder: true,
    pr_holder_involved_in_decisions: true,
    pr_holder_informed_of_placement: true,
    conflict_between_pr_holders: false,
    conflict_details: null,
    legal_representation: false,
    social_worker_name: "Sarah SW",
    review_date: null,
    notes: null,
    created_at: "2024-01-15T10:00:00.000Z",
    updated_at: "2024-01-15T10:00:00.000Z",
    ...overrides,
  };
}

/** Returns an ISO date string offset from `now` by the given number of days. */
function daysFromNow(days: number): string {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

describe("CARE_ORDER_TYPES", () => {
  it("has exactly 10 entries", () => {
    expect(CARE_ORDER_TYPES).toHaveLength(10);
  });

  it("contains unique type values", () => {
    const values = CARE_ORDER_TYPES.map((t) => t.type);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = CARE_ORDER_TYPES.map((t) => t.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes section_20", () => {
    expect(CARE_ORDER_TYPES.find((t) => t.type === "section_20")).toBeTruthy();
  });

  it("includes interim_care_order", () => {
    expect(CARE_ORDER_TYPES.find((t) => t.type === "interim_care_order")).toBeTruthy();
  });

  it("includes full_care_order", () => {
    expect(CARE_ORDER_TYPES.find((t) => t.type === "full_care_order")).toBeTruthy();
  });

  it("includes special_guardianship", () => {
    expect(CARE_ORDER_TYPES.find((t) => t.type === "special_guardianship")).toBeTruthy();
  });

  it("includes child_arrangement_order", () => {
    expect(CARE_ORDER_TYPES.find((t) => t.type === "child_arrangement_order")).toBeTruthy();
  });

  it("includes placement_order", () => {
    expect(CARE_ORDER_TYPES.find((t) => t.type === "placement_order")).toBeTruthy();
  });

  it("includes emergency_protection_order", () => {
    expect(CARE_ORDER_TYPES.find((t) => t.type === "emergency_protection_order")).toBeTruthy();
  });

  it("includes police_protection", () => {
    expect(CARE_ORDER_TYPES.find((t) => t.type === "police_protection")).toBeTruthy();
  });

  it("includes secure_order", () => {
    expect(CARE_ORDER_TYPES.find((t) => t.type === "secure_order")).toBeTruthy();
  });

  it("includes other", () => {
    expect(CARE_ORDER_TYPES.find((t) => t.type === "other")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const t of CARE_ORDER_TYPES) {
      expect(t.label.length).toBeGreaterThan(0);
    }
  });
});

describe("PR_HOLDERS", () => {
  it("has exactly 7 entries", () => {
    expect(PR_HOLDERS).toHaveLength(7);
  });

  it("contains unique holder values", () => {
    const values = PR_HOLDERS.map((h) => h.holder);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = PR_HOLDERS.map((h) => h.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes birth_mother", () => {
    expect(PR_HOLDERS.find((h) => h.holder === "birth_mother")).toBeTruthy();
  });

  it("includes birth_father", () => {
    expect(PR_HOLDERS.find((h) => h.holder === "birth_father")).toBeTruthy();
  });

  it("includes step_parent", () => {
    expect(PR_HOLDERS.find((h) => h.holder === "step_parent")).toBeTruthy();
  });

  it("includes local_authority", () => {
    expect(PR_HOLDERS.find((h) => h.holder === "local_authority")).toBeTruthy();
  });

  it("includes special_guardian", () => {
    expect(PR_HOLDERS.find((h) => h.holder === "special_guardian")).toBeTruthy();
  });

  it("includes adoptive_parent", () => {
    expect(PR_HOLDERS.find((h) => h.holder === "adoptive_parent")).toBeTruthy();
  });

  it("includes other", () => {
    expect(PR_HOLDERS.find((h) => h.holder === "other")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const h of PR_HOLDERS) {
      expect(h.label.length).toBeGreaterThan(0);
    }
  });
});

describe("PR_STATUSES", () => {
  it("has exactly 6 entries", () => {
    expect(PR_STATUSES).toHaveLength(6);
  });

  it("contains unique status values", () => {
    const values = PR_STATUSES.map((s) => s.status);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = PR_STATUSES.map((s) => s.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes active", () => {
    expect(PR_STATUSES.find((s) => s.status === "active")).toBeTruthy();
  });

  it("includes shared", () => {
    expect(PR_STATUSES.find((s) => s.status === "shared")).toBeTruthy();
  });

  it("includes restricted", () => {
    expect(PR_STATUSES.find((s) => s.status === "restricted")).toBeTruthy();
  });

  it("includes suspended", () => {
    expect(PR_STATUSES.find((s) => s.status === "suspended")).toBeTruthy();
  });

  it("includes terminated", () => {
    expect(PR_STATUSES.find((s) => s.status === "terminated")).toBeTruthy();
  });

  it("includes under_review", () => {
    expect(PR_STATUSES.find((s) => s.status === "under_review")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const s of PR_STATUSES) {
      expect(s.label.length).toBeGreaterThan(0);
    }
  });
});

describe("CONSENT_ARRANGEMENTS", () => {
  it("has exactly 6 entries", () => {
    expect(CONSENT_ARRANGEMENTS).toHaveLength(6);
  });

  it("contains unique arrangement values", () => {
    const values = CONSENT_ARRANGEMENTS.map((a) => a.arrangement);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = CONSENT_ARRANGEMENTS.map((a) => a.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes la_consent_required", () => {
    expect(CONSENT_ARRANGEMENTS.find((a) => a.arrangement === "la_consent_required")).toBeTruthy();
  });

  it("includes parent_consent_required", () => {
    expect(CONSENT_ARRANGEMENTS.find((a) => a.arrangement === "parent_consent_required")).toBeTruthy();
  });

  it("includes joint_consent", () => {
    expect(CONSENT_ARRANGEMENTS.find((a) => a.arrangement === "joint_consent")).toBeTruthy();
  });

  it("includes delegated_to_home", () => {
    expect(CONSENT_ARRANGEMENTS.find((a) => a.arrangement === "delegated_to_home")).toBeTruthy();
  });

  it("includes court_directed", () => {
    expect(CONSENT_ARRANGEMENTS.find((a) => a.arrangement === "court_directed")).toBeTruthy();
  });

  it("includes not_applicable", () => {
    expect(CONSENT_ARRANGEMENTS.find((a) => a.arrangement === "not_applicable")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const a of CONSENT_ARRANGEMENTS) {
      expect(a.label.length).toBeGreaterThan(0);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. computePrMetrics
// ═══════════════════════════════════════════════════════════════════════════

describe("computePrMetrics", () => {
  // ── Empty array ──────────────────────────────────────────────────────
  describe("empty records", () => {
    it("returns zero total_records", () => {
      const m = computePrMetrics([], 0);
      expect(m.total_records).toBe(0);
    });

    it("returns zero children_covered", () => {
      const m = computePrMetrics([], 0);
      expect(m.children_covered).toBe(0);
    });

    it("returns zero coverage_rate when totalChildren is 0", () => {
      const m = computePrMetrics([], 0);
      expect(m.coverage_rate).toBeNull();;
    });

    it("returns zero coverage_rate when totalChildren > 0 but no records", () => {
      const m = computePrMetrics([], 5);
      expect(m.coverage_rate).toBe(0);
    });

    it("returns zero active_pr_count", () => {
      expect(computePrMetrics([], 0).active_pr_count).toBe(0);
    });

    it("returns zero shared_pr_count", () => {
      expect(computePrMetrics([], 0).shared_pr_count).toBe(0);
    });

    it("returns zero restricted_pr_count", () => {
      expect(computePrMetrics([], 0).restricted_pr_count).toBe(0);
    });

    it("returns zero suspended_pr_count", () => {
      expect(computePrMetrics([], 0).suspended_pr_count).toBe(0);
    });

    it("returns zero section_20_count", () => {
      expect(computePrMetrics([], 0).section_20_count).toBe(0);
    });

    it("returns zero full_care_order_count", () => {
      expect(computePrMetrics([], 0).full_care_order_count).toBe(0);
    });

    it("returns zero interim_care_order_count", () => {
      expect(computePrMetrics([], 0).interim_care_order_count).toBe(0);
    });

    it("returns zero contact_with_pr_holder_rate", () => {
      expect(computePrMetrics([], 0).contact_with_pr_holder_rate).toBeNull();;
    });

    it("returns zero pr_holder_involved_rate", () => {
      expect(computePrMetrics([], 0).pr_holder_involved_rate).toBeNull();;
    });

    it("returns zero pr_holder_informed_rate", () => {
      expect(computePrMetrics([], 0).pr_holder_informed_rate).toBeNull();;
    });

    it("returns zero conflict_count", () => {
      expect(computePrMetrics([], 0).conflict_count).toBe(0);
    });

    it("returns zero review_overdue_count", () => {
      expect(computePrMetrics([], 0).review_overdue_count).toBe(0);
    });

    it("returns empty by_care_order_type", () => {
      expect(computePrMetrics([], 0).by_care_order_type).toEqual({});
    });

    it("returns empty by_pr_holder", () => {
      expect(computePrMetrics([], 0).by_pr_holder).toEqual({});
    });

    it("returns empty by_pr_status", () => {
      expect(computePrMetrics([], 0).by_pr_status).toEqual({});
    });

    it("returns empty by_consent_arrangement", () => {
      expect(computePrMetrics([], 0).by_consent_arrangement).toEqual({});
    });
  });

  // ── Single record ──────────────────────────────────────────────────
  describe("single record", () => {
    const single = [makeRecord()];

    it("total_records is 1", () => {
      expect(computePrMetrics(single, 1).total_records).toBe(1);
    });

    it("children_covered is 1", () => {
      expect(computePrMetrics(single, 1).children_covered).toBe(1);
    });

    it("coverage_rate is 100 when totalChildren matches", () => {
      expect(computePrMetrics(single, 1).coverage_rate).toBe(100);
    });

    it("coverage_rate is 50 when totalChildren is 2", () => {
      expect(computePrMetrics(single, 2).coverage_rate).toBe(50);
    });

    it("active_pr_count is 1 for active record", () => {
      expect(computePrMetrics(single, 1).active_pr_count).toBe(1);
    });

    it("contact_with_pr_holder_rate is 100 when contact is true", () => {
      expect(computePrMetrics(single, 1).contact_with_pr_holder_rate).toBe(100);
    });

    it("pr_holder_involved_rate is 100 when involved is true", () => {
      expect(computePrMetrics(single, 1).pr_holder_involved_rate).toBe(100);
    });

    it("pr_holder_informed_rate is 100 when informed is true", () => {
      expect(computePrMetrics(single, 1).pr_holder_informed_rate).toBe(100);
    });

    it("conflict_count is 0 when no conflict", () => {
      expect(computePrMetrics(single, 1).conflict_count).toBe(0);
    });

    it("by_care_order_type groups single record correctly", () => {
      expect(computePrMetrics(single, 1).by_care_order_type).toEqual({
        full_care_order: 1,
      });
    });

    it("by_pr_holder groups single record correctly", () => {
      expect(computePrMetrics(single, 1).by_pr_holder).toEqual({
        birth_mother: 1,
      });
    });

    it("by_pr_status groups single record correctly", () => {
      expect(computePrMetrics(single, 1).by_pr_status).toEqual({
        active: 1,
      });
    });

    it("by_consent_arrangement groups single record correctly", () => {
      expect(computePrMetrics(single, 1).by_consent_arrangement).toEqual({
        la_consent_required: 1,
      });
    });
  });

  // ── Multiple records ─────────────────────────────────────────────────
  describe("multiple records", () => {
    const records = [
      makeRecord({ id: "pr-1", child_id: "child-1", pr_status: "active", care_order_type: "full_care_order", pr_holder: "birth_mother", consent_arrangement: "la_consent_required", contact_with_pr_holder: true, pr_holder_involved_in_decisions: true, pr_holder_informed_of_placement: true, conflict_between_pr_holders: false }),
      makeRecord({ id: "pr-2", child_id: "child-1", pr_status: "shared", care_order_type: "full_care_order", pr_holder: "birth_father", consent_arrangement: "joint_consent", contact_with_pr_holder: false, pr_holder_involved_in_decisions: false, pr_holder_informed_of_placement: true, conflict_between_pr_holders: true, conflict_details: "Disagreement about education" }),
      makeRecord({ id: "pr-3", child_id: "child-2", pr_status: "restricted", care_order_type: "section_20", pr_holder: "birth_mother", consent_arrangement: "parent_consent_required", contact_with_pr_holder: true, pr_holder_involved_in_decisions: true, pr_holder_informed_of_placement: false, conflict_between_pr_holders: false }),
      makeRecord({ id: "pr-4", child_id: "child-3", pr_status: "suspended", care_order_type: "interim_care_order", pr_holder: "local_authority", consent_arrangement: "la_consent_required", contact_with_pr_holder: false, pr_holder_involved_in_decisions: false, pr_holder_informed_of_placement: false, conflict_between_pr_holders: false }),
      makeRecord({ id: "pr-5", child_id: "child-4", pr_status: "active", care_order_type: "section_20", pr_holder: "step_parent", consent_arrangement: "delegated_to_home", contact_with_pr_holder: true, pr_holder_involved_in_decisions: false, pr_holder_informed_of_placement: true, conflict_between_pr_holders: false }),
    ];

    it("total_records is 5", () => {
      expect(computePrMetrics(records, 6).total_records).toBe(5);
    });

    it("children_covered counts unique child_ids (4)", () => {
      expect(computePrMetrics(records, 6).children_covered).toBe(4);
    });

    it("coverage_rate is 66.7 for 4 of 6 children", () => {
      expect(computePrMetrics(records, 6).coverage_rate).toBe(66.7);
    });

    it("active_pr_count is 2", () => {
      expect(computePrMetrics(records, 6).active_pr_count).toBe(2);
    });

    it("shared_pr_count is 1", () => {
      expect(computePrMetrics(records, 6).shared_pr_count).toBe(1);
    });

    it("restricted_pr_count is 1", () => {
      expect(computePrMetrics(records, 6).restricted_pr_count).toBe(1);
    });

    it("suspended_pr_count is 1", () => {
      expect(computePrMetrics(records, 6).suspended_pr_count).toBe(1);
    });

    it("section_20_count is 2", () => {
      expect(computePrMetrics(records, 6).section_20_count).toBe(2);
    });

    it("full_care_order_count is 2", () => {
      expect(computePrMetrics(records, 6).full_care_order_count).toBe(2);
    });

    it("interim_care_order_count is 1", () => {
      expect(computePrMetrics(records, 6).interim_care_order_count).toBe(1);
    });

    it("contact_with_pr_holder_rate is 60 (3 of 5)", () => {
      expect(computePrMetrics(records, 6).contact_with_pr_holder_rate).toBe(60);
    });

    it("pr_holder_involved_rate is 40 (2 of 5)", () => {
      expect(computePrMetrics(records, 6).pr_holder_involved_rate).toBe(40);
    });

    it("pr_holder_informed_rate is 60 (3 of 5)", () => {
      expect(computePrMetrics(records, 6).pr_holder_informed_rate).toBe(60);
    });

    it("conflict_count is 1", () => {
      expect(computePrMetrics(records, 6).conflict_count).toBe(1);
    });

    it("by_care_order_type groups correctly", () => {
      expect(computePrMetrics(records, 6).by_care_order_type).toEqual({
        full_care_order: 2,
        section_20: 2,
        interim_care_order: 1,
      });
    });

    it("by_pr_holder groups correctly", () => {
      expect(computePrMetrics(records, 6).by_pr_holder).toEqual({
        birth_mother: 2,
        birth_father: 1,
        local_authority: 1,
        step_parent: 1,
      });
    });

    it("by_pr_status groups correctly", () => {
      expect(computePrMetrics(records, 6).by_pr_status).toEqual({
        active: 2,
        shared: 1,
        restricted: 1,
        suspended: 1,
      });
    });

    it("by_consent_arrangement groups correctly", () => {
      expect(computePrMetrics(records, 6).by_consent_arrangement).toEqual({
        la_consent_required: 2,
        joint_consent: 1,
        parent_consent_required: 1,
        delegated_to_home: 1,
      });
    });
  });

  // ── coverage_rate edge cases ─────────────────────────────────────────
  describe("coverage_rate edge cases", () => {
    it("returns 0 when totalChildren is 0 and there are records", () => {
      const m = computePrMetrics([makeRecord()], 0);
      expect(m.coverage_rate).toBeNull();;
    });

    it("returns 100 when all children covered", () => {
      const records = [
        makeRecord({ child_id: "c1" }),
        makeRecord({ child_id: "c2" }),
      ];
      expect(computePrMetrics(records, 2).coverage_rate).toBe(100);
    });

    it("deduplicates children for coverage", () => {
      const records = [
        makeRecord({ id: "pr-1", child_id: "c1" }),
        makeRecord({ id: "pr-2", child_id: "c1" }),
        makeRecord({ id: "pr-3", child_id: "c1" }),
      ];
      expect(computePrMetrics(records, 3).children_covered).toBe(1);
      expect(computePrMetrics(records, 3).coverage_rate).toBe(33.3);
    });

    it("rounds coverage_rate to one decimal place", () => {
      const records = [makeRecord({ child_id: "c1" })];
      // 1/3 = 33.333...  => 33.3
      expect(computePrMetrics(records, 3).coverage_rate).toBe(33.3);
    });
  });

  // ── PR status counts ──────────────────────────────────────────────
  describe("pr_status counts", () => {
    it("counts only active records", () => {
      const records = [
        makeRecord({ id: "1", pr_status: "active" }),
        makeRecord({ id: "2", pr_status: "terminated" }),
        makeRecord({ id: "3", pr_status: "active" }),
      ];
      expect(computePrMetrics(records, 3).active_pr_count).toBe(2);
    });

    it("counts only shared records", () => {
      const records = [
        makeRecord({ id: "1", pr_status: "shared" }),
        makeRecord({ id: "2", pr_status: "shared" }),
        makeRecord({ id: "3", pr_status: "active" }),
      ];
      expect(computePrMetrics(records, 3).shared_pr_count).toBe(2);
    });

    it("counts only restricted records", () => {
      const records = [
        makeRecord({ id: "1", pr_status: "restricted" }),
        makeRecord({ id: "2", pr_status: "active" }),
      ];
      expect(computePrMetrics(records, 2).restricted_pr_count).toBe(1);
    });

    it("counts only suspended records", () => {
      const records = [
        makeRecord({ id: "1", pr_status: "suspended" }),
        makeRecord({ id: "2", pr_status: "suspended" }),
        makeRecord({ id: "3", pr_status: "suspended" }),
      ];
      expect(computePrMetrics(records, 3).suspended_pr_count).toBe(3);
    });

    it("does not count terminated or under_review in status counts", () => {
      const records = [
        makeRecord({ id: "1", pr_status: "terminated" }),
        makeRecord({ id: "2", pr_status: "under_review" }),
      ];
      const m = computePrMetrics(records, 2);
      expect(m.active_pr_count).toBe(0);
      expect(m.shared_pr_count).toBe(0);
      expect(m.restricted_pr_count).toBe(0);
      expect(m.suspended_pr_count).toBe(0);
    });
  });

  // ── Care order type counts ────────────────────────────────────────
  describe("care order type counts", () => {
    it("counts section_20 records", () => {
      const records = [
        makeRecord({ id: "1", care_order_type: "section_20" }),
        makeRecord({ id: "2", care_order_type: "section_20" }),
        makeRecord({ id: "3", care_order_type: "full_care_order" }),
      ];
      expect(computePrMetrics(records, 3).section_20_count).toBe(2);
    });

    it("counts full_care_order records", () => {
      const records = [
        makeRecord({ id: "1", care_order_type: "full_care_order" }),
        makeRecord({ id: "2", care_order_type: "full_care_order" }),
        makeRecord({ id: "3", care_order_type: "full_care_order" }),
      ];
      expect(computePrMetrics(records, 3).full_care_order_count).toBe(3);
    });

    it("counts interim_care_order records", () => {
      const records = [
        makeRecord({ id: "1", care_order_type: "interim_care_order" }),
        makeRecord({ id: "2", care_order_type: "section_20" }),
      ];
      expect(computePrMetrics(records, 2).interim_care_order_count).toBe(1);
    });

    it("zero for types not present", () => {
      const records = [
        makeRecord({ id: "1", care_order_type: "special_guardianship" }),
      ];
      const m = computePrMetrics(records, 1);
      expect(m.section_20_count).toBe(0);
      expect(m.full_care_order_count).toBe(0);
      expect(m.interim_care_order_count).toBe(0);
    });
  });

  // ── Boolean rates ──────────────────────────────────────────────────
  describe("boolean rates", () => {
    it("contact_with_pr_holder_rate is 0 when all false", () => {
      const records = [
        makeRecord({ id: "1", contact_with_pr_holder: false }),
        makeRecord({ id: "2", contact_with_pr_holder: false }),
      ];
      expect(computePrMetrics(records, 2).contact_with_pr_holder_rate).toBe(0);
    });

    it("contact_with_pr_holder_rate is 100 when all true", () => {
      const records = [
        makeRecord({ id: "1", contact_with_pr_holder: true }),
        makeRecord({ id: "2", contact_with_pr_holder: true }),
      ];
      expect(computePrMetrics(records, 2).contact_with_pr_holder_rate).toBe(100);
    });

    it("pr_holder_involved_rate is 0 when all false", () => {
      const records = [
        makeRecord({ id: "1", pr_holder_involved_in_decisions: false }),
        makeRecord({ id: "2", pr_holder_involved_in_decisions: false }),
      ];
      expect(computePrMetrics(records, 2).pr_holder_involved_rate).toBe(0);
    });

    it("pr_holder_involved_rate is 50 for 1 of 2", () => {
      const records = [
        makeRecord({ id: "1", pr_holder_involved_in_decisions: true }),
        makeRecord({ id: "2", pr_holder_involved_in_decisions: false }),
      ];
      expect(computePrMetrics(records, 2).pr_holder_involved_rate).toBe(50);
    });

    it("pr_holder_informed_rate is 0 when all false", () => {
      const records = [
        makeRecord({ id: "1", pr_holder_informed_of_placement: false }),
        makeRecord({ id: "2", pr_holder_informed_of_placement: false }),
      ];
      expect(computePrMetrics(records, 2).pr_holder_informed_rate).toBe(0);
    });

    it("pr_holder_informed_rate rounds correctly for 1 of 3", () => {
      const records = [
        makeRecord({ id: "1", pr_holder_informed_of_placement: true }),
        makeRecord({ id: "2", pr_holder_informed_of_placement: false }),
        makeRecord({ id: "3", pr_holder_informed_of_placement: false }),
      ];
      expect(computePrMetrics(records, 3).pr_holder_informed_rate).toBe(33.3);
    });

    it("rates round to one decimal place for 2 of 3 (66.7)", () => {
      const records = [
        makeRecord({ id: "1", contact_with_pr_holder: true }),
        makeRecord({ id: "2", contact_with_pr_holder: true }),
        makeRecord({ id: "3", contact_with_pr_holder: false }),
      ];
      expect(computePrMetrics(records, 3).contact_with_pr_holder_rate).toBe(66.7);
    });
  });

  // ── Conflict count ─────────────────────────────────────────────────
  describe("conflict_count", () => {
    it("counts records with conflict_between_pr_holders true", () => {
      const records = [
        makeRecord({ id: "1", conflict_between_pr_holders: true }),
        makeRecord({ id: "2", conflict_between_pr_holders: false }),
        makeRecord({ id: "3", conflict_between_pr_holders: true }),
      ];
      expect(computePrMetrics(records, 3).conflict_count).toBe(2);
    });

    it("returns 0 when no conflicts", () => {
      const records = [
        makeRecord({ id: "1", conflict_between_pr_holders: false }),
        makeRecord({ id: "2", conflict_between_pr_holders: false }),
      ];
      expect(computePrMetrics(records, 2).conflict_count).toBe(0);
    });
  });

  // ── review_overdue_count ───────────────────────────────────────────
  describe("review_overdue_count", () => {
    it("counts records with past review_date", () => {
      const records = [
        makeRecord({ id: "1", review_date: "2020-01-01", pr_status: "active" }),
        makeRecord({ id: "2", review_date: "2020-06-01", pr_status: "shared" }),
      ];
      expect(computePrMetrics(records, 2).review_overdue_count).toBe(2);
    });

    it("does not count records with null review_date", () => {
      const records = [
        makeRecord({ id: "1", review_date: null }),
        makeRecord({ id: "2", review_date: "2020-01-01", pr_status: "active" }),
      ];
      expect(computePrMetrics(records, 2).review_overdue_count).toBe(1);
    });

    it("does not count records with future review_date", () => {
      const records = [
        makeRecord({ id: "1", review_date: daysFromNow(90), pr_status: "active" }),
      ];
      expect(computePrMetrics(records, 1).review_overdue_count).toBe(0);
    });

    it("excludes terminated records from overdue count", () => {
      const records = [
        makeRecord({ id: "1", review_date: "2020-01-01", pr_status: "terminated" }),
      ];
      expect(computePrMetrics(records, 1).review_overdue_count).toBe(0);
    });

    it("counts overdue under_review records", () => {
      const records = [
        makeRecord({ id: "1", review_date: "2020-01-01", pr_status: "under_review" }),
      ];
      expect(computePrMetrics(records, 1).review_overdue_count).toBe(1);
    });

    it("counts overdue suspended records", () => {
      const records = [
        makeRecord({ id: "1", review_date: "2020-01-01", pr_status: "suspended" }),
      ];
      expect(computePrMetrics(records, 1).review_overdue_count).toBe(1);
    });
  });

  // ── by_ breakdown maps ────────────────────────────────────────────
  describe("by_ breakdown maps", () => {
    it("by_care_order_type handles all types present", () => {
      const records = [
        makeRecord({ id: "1", care_order_type: "section_20" }),
        makeRecord({ id: "2", care_order_type: "section_20" }),
        makeRecord({ id: "3", care_order_type: "placement_order" }),
        makeRecord({ id: "4", care_order_type: "other" }),
      ];
      expect(computePrMetrics(records, 4).by_care_order_type).toEqual({
        section_20: 2,
        placement_order: 1,
        other: 1,
      });
    });

    it("by_pr_holder handles multiple holders", () => {
      const records = [
        makeRecord({ id: "1", pr_holder: "birth_mother" }),
        makeRecord({ id: "2", pr_holder: "birth_father" }),
        makeRecord({ id: "3", pr_holder: "birth_mother" }),
        makeRecord({ id: "4", pr_holder: "special_guardian" }),
      ];
      expect(computePrMetrics(records, 4).by_pr_holder).toEqual({
        birth_mother: 2,
        birth_father: 1,
        special_guardian: 1,
      });
    });

    it("by_pr_status handles all statuses", () => {
      const records = [
        makeRecord({ id: "1", pr_status: "active" }),
        makeRecord({ id: "2", pr_status: "active" }),
        makeRecord({ id: "3", pr_status: "terminated" }),
        makeRecord({ id: "4", pr_status: "under_review" }),
      ];
      expect(computePrMetrics(records, 4).by_pr_status).toEqual({
        active: 2,
        terminated: 1,
        under_review: 1,
      });
    });

    it("by_consent_arrangement handles multiple arrangements", () => {
      const records = [
        makeRecord({ id: "1", consent_arrangement: "court_directed" }),
        makeRecord({ id: "2", consent_arrangement: "court_directed" }),
        makeRecord({ id: "3", consent_arrangement: "not_applicable" }),
      ];
      expect(computePrMetrics(records, 3).by_consent_arrangement).toEqual({
        court_directed: 2,
        not_applicable: 1,
      });
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. identifyPrAlerts
// ═══════════════════════════════════════════════════════════════════════════

describe("identifyPrAlerts", () => {
  // ── No alerts ──────────────────────────────────────────────────────
  describe("no alerts scenario", () => {
    it("returns empty array when everything is fine and all children covered", () => {
      const records = [
        makeRecord({
          id: "pr-1",
          child_id: "c1",
          pr_holder_informed_of_placement: true,
          conflict_between_pr_holders: false,
          care_order_expiry: null,
          care_order_type: "full_care_order",
          pr_status: "active",
        }),
      ];
      expect(identifyPrAlerts(records, 1)).toEqual([]);
    });

    it("returns empty array for empty records and 0 children", () => {
      expect(identifyPrAlerts([], 0)).toEqual([]);
    });
  });

  // ── no_pr_record alert (critical) ──────────────────────────────────
  describe("no_pr_record alert", () => {
    it("fires when totalChildren exceeds covered children", () => {
      const records = [makeRecord({ child_id: "c1" })];
      const alerts = identifyPrAlerts(records, 3);
      const prGap = alerts.find((a) => a.type === "no_pr_record");
      expect(prGap).toBeTruthy();
    });

    it("has critical severity", () => {
      const alerts = identifyPrAlerts([makeRecord({ child_id: "c1" })], 5);
      const prGap = alerts.find((a) => a.type === "no_pr_record")!;
      expect(prGap.severity).toBe("critical");
    });

    it("has id pr_gap", () => {
      const alerts = identifyPrAlerts([makeRecord({ child_id: "c1" })], 3);
      const prGap = alerts.find((a) => a.type === "no_pr_record")!;
      expect(prGap.id).toBe("pr_gap");
    });

    it("message uses singular when 1 child missing", () => {
      const records = [makeRecord({ child_id: "c1" })];
      const alerts = identifyPrAlerts(records, 2);
      const prGap = alerts.find((a) => a.type === "no_pr_record")!;
      expect(prGap.message).toContain("1 child has");
    });

    it("message uses plural when multiple children missing", () => {
      const records = [makeRecord({ child_id: "c1" })];
      const alerts = identifyPrAlerts(records, 4);
      const prGap = alerts.find((a) => a.type === "no_pr_record")!;
      expect(prGap.message).toContain("3 children have");
    });

    it("does not fire when all children are covered", () => {
      const records = [
        makeRecord({ id: "pr-1", child_id: "c1" }),
        makeRecord({ id: "pr-2", child_id: "c2" }),
      ];
      const alerts = identifyPrAlerts(records, 2);
      expect(alerts.find((a) => a.type === "no_pr_record")).toBeUndefined();
    });

    it("does not fire when totalChildren is 0", () => {
      const alerts = identifyPrAlerts([], 0);
      expect(alerts.find((a) => a.type === "no_pr_record")).toBeUndefined();
    });

    it("deduplicates children with multiple PR records", () => {
      const records = [
        makeRecord({ id: "pr-1", child_id: "c1" }),
        makeRecord({ id: "pr-2", child_id: "c1" }),
        makeRecord({ id: "pr-3", child_id: "c1" }),
      ];
      // 3 records but only 1 unique child, totalChildren = 2 => gap of 1
      const alerts = identifyPrAlerts(records, 2);
      const prGap = alerts.find((a) => a.type === "no_pr_record")!;
      expect(prGap).toBeTruthy();
      expect(prGap.message).toContain("1 child has");
    });

    it("does not fire when more records than children but all covered", () => {
      const records = [
        makeRecord({ id: "pr-1", child_id: "c1" }),
        makeRecord({ id: "pr-2", child_id: "c1" }),
        makeRecord({ id: "pr-3", child_id: "c2" }),
      ];
      const alerts = identifyPrAlerts(records, 2);
      expect(alerts.find((a) => a.type === "no_pr_record")).toBeUndefined();
    });

    it("fires with correct gap when no records at all", () => {
      const alerts = identifyPrAlerts([], 5);
      const prGap = alerts.find((a) => a.type === "no_pr_record")!;
      expect(prGap.message).toContain("5 children have");
    });
  });

  // ── pr_holder_not_informed alert (high) ────────────────────────────
  describe("pr_holder_not_informed alert", () => {
    it("fires when pr_holder_informed_of_placement is false and not terminated/suspended", () => {
      const records = [
        makeRecord({
          id: "pr-1",
          pr_holder_informed_of_placement: false,
          pr_status: "active",
          care_order_type: "full_care_order",
        }),
      ];
      const alerts = identifyPrAlerts(records, 1);
      const uninformed = alerts.find((a) => a.type === "pr_holder_not_informed");
      expect(uninformed).toBeTruthy();
    });

    it("has high severity", () => {
      const records = [
        makeRecord({
          id: "pr-1",
          pr_holder_informed_of_placement: false,
          pr_status: "active",
          care_order_type: "full_care_order",
        }),
      ];
      const alerts = identifyPrAlerts(records, 1);
      const uninformed = alerts.find((a) => a.type === "pr_holder_not_informed")!;
      expect(uninformed.severity).toBe("high");
    });

    it("uses the record id as alert id", () => {
      const records = [
        makeRecord({
          id: "pr-42",
          pr_holder_informed_of_placement: false,
          pr_status: "active",
          care_order_type: "full_care_order",
        }),
      ];
      const alerts = identifyPrAlerts(records, 1);
      const uninformed = alerts.find((a) => a.type === "pr_holder_not_informed")!;
      expect(uninformed.id).toBe("pr-42");
    });

    it("message contains pr_holder_name", () => {
      const records = [
        makeRecord({
          id: "pr-1",
          pr_holder_name: "Margaret Jones",
          pr_holder_informed_of_placement: false,
          pr_status: "active",
          care_order_type: "full_care_order",
        }),
      ];
      const alerts = identifyPrAlerts(records, 1);
      const uninformed = alerts.find((a) => a.type === "pr_holder_not_informed")!;
      expect(uninformed.message).toContain("Margaret Jones");
    });

    it("message contains child_name", () => {
      const records = [
        makeRecord({
          id: "pr-1",
          child_name: "Bobby Brown",
          pr_holder_informed_of_placement: false,
          pr_status: "active",
          care_order_type: "full_care_order",
        }),
      ];
      const alerts = identifyPrAlerts(records, 1);
      const uninformed = alerts.find((a) => a.type === "pr_holder_not_informed")!;
      expect(uninformed.message).toContain("Bobby Brown");
    });

    it("does NOT fire when pr_holder_informed_of_placement is true", () => {
      const records = [
        makeRecord({
          id: "pr-1",
          pr_holder_informed_of_placement: true,
          pr_status: "active",
          care_order_type: "full_care_order",
        }),
      ];
      const alerts = identifyPrAlerts(records, 1);
      expect(alerts.find((a) => a.type === "pr_holder_not_informed")).toBeUndefined();
    });

    it("does NOT fire when pr_status is terminated", () => {
      const records = [
        makeRecord({
          id: "pr-1",
          pr_holder_informed_of_placement: false,
          pr_status: "terminated",
          care_order_type: "full_care_order",
        }),
      ];
      const alerts = identifyPrAlerts(records, 1);
      expect(alerts.find((a) => a.type === "pr_holder_not_informed")).toBeUndefined();
    });

    it("does NOT fire when pr_status is suspended", () => {
      const records = [
        makeRecord({
          id: "pr-1",
          pr_holder_informed_of_placement: false,
          pr_status: "suspended",
          care_order_type: "full_care_order",
        }),
      ];
      const alerts = identifyPrAlerts(records, 1);
      expect(alerts.find((a) => a.type === "pr_holder_not_informed")).toBeUndefined();
    });

    it("fires for shared status when not informed", () => {
      const records = [
        makeRecord({
          id: "pr-1",
          pr_holder_informed_of_placement: false,
          pr_status: "shared",
          care_order_type: "full_care_order",
        }),
      ];
      const alerts = identifyPrAlerts(records, 1);
      expect(alerts.find((a) => a.type === "pr_holder_not_informed")).toBeTruthy();
    });

    it("fires for restricted status when not informed", () => {
      const records = [
        makeRecord({
          id: "pr-1",
          pr_holder_informed_of_placement: false,
          pr_status: "restricted",
          care_order_type: "full_care_order",
        }),
      ];
      const alerts = identifyPrAlerts(records, 1);
      expect(alerts.find((a) => a.type === "pr_holder_not_informed")).toBeTruthy();
    });

    it("fires for under_review status when not informed", () => {
      const records = [
        makeRecord({
          id: "pr-1",
          pr_holder_informed_of_placement: false,
          pr_status: "under_review",
          care_order_type: "full_care_order",
        }),
      ];
      const alerts = identifyPrAlerts(records, 1);
      expect(alerts.find((a) => a.type === "pr_holder_not_informed")).toBeTruthy();
    });

    it("fires once per uninformed record (multiple records)", () => {
      const records = [
        makeRecord({ id: "pr-1", pr_holder_informed_of_placement: false, pr_status: "active", care_order_type: "full_care_order" }),
        makeRecord({ id: "pr-2", pr_holder_informed_of_placement: false, pr_status: "shared", care_order_type: "full_care_order" }),
        makeRecord({ id: "pr-3", pr_holder_informed_of_placement: true, pr_status: "active", care_order_type: "full_care_order" }),
      ];
      const alerts = identifyPrAlerts(records, 3);
      const uninformed = alerts.filter((a) => a.type === "pr_holder_not_informed");
      expect(uninformed).toHaveLength(2);
    });
  });

  // ── pr_conflict alert (high) ───────────────────────────────────────
  describe("pr_conflict alert", () => {
    it("fires when conflict_between_pr_holders is true", () => {
      const records = [
        makeRecord({
          id: "pr-1",
          conflict_between_pr_holders: true,
          conflict_details: "Disagreement about schooling",
          care_order_type: "full_care_order",
        }),
      ];
      const alerts = identifyPrAlerts(records, 1);
      const conflict = alerts.find((a) => a.type === "pr_conflict");
      expect(conflict).toBeTruthy();
    });

    it("has high severity", () => {
      const records = [
        makeRecord({
          id: "pr-1",
          conflict_between_pr_holders: true,
          care_order_type: "full_care_order",
        }),
      ];
      const alerts = identifyPrAlerts(records, 1);
      const conflict = alerts.find((a) => a.type === "pr_conflict")!;
      expect(conflict.severity).toBe("high");
    });

    it("uses the record id as alert id", () => {
      const records = [
        makeRecord({
          id: "pr-99",
          conflict_between_pr_holders: true,
          care_order_type: "full_care_order",
        }),
      ];
      const alerts = identifyPrAlerts(records, 1);
      const conflict = alerts.find((a) => a.type === "pr_conflict")!;
      expect(conflict.id).toBe("pr-99");
    });

    it("message contains conflict_details when provided", () => {
      const records = [
        makeRecord({
          id: "pr-1",
          conflict_between_pr_holders: true,
          conflict_details: "Religious upbringing dispute",
          care_order_type: "full_care_order",
        }),
      ];
      const alerts = identifyPrAlerts(records, 1);
      const conflict = alerts.find((a) => a.type === "pr_conflict")!;
      expect(conflict.message).toContain("Religious upbringing dispute");
    });

    it("message uses fallback when conflict_details is null", () => {
      const records = [
        makeRecord({
          id: "pr-1",
          conflict_between_pr_holders: true,
          conflict_details: null,
          care_order_type: "full_care_order",
        }),
      ];
      const alerts = identifyPrAlerts(records, 1);
      const conflict = alerts.find((a) => a.type === "pr_conflict")!;
      expect(conflict.message).toContain("resolve with social worker");
    });

    it("message contains child_name", () => {
      const records = [
        makeRecord({
          id: "pr-1",
          child_name: "Tommy Green",
          conflict_between_pr_holders: true,
          care_order_type: "full_care_order",
        }),
      ];
      const alerts = identifyPrAlerts(records, 1);
      const conflict = alerts.find((a) => a.type === "pr_conflict")!;
      expect(conflict.message).toContain("Tommy Green");
    });

    it("does NOT fire when conflict is false", () => {
      const records = [
        makeRecord({
          id: "pr-1",
          conflict_between_pr_holders: false,
          care_order_type: "full_care_order",
        }),
      ];
      const alerts = identifyPrAlerts(records, 1);
      expect(alerts.find((a) => a.type === "pr_conflict")).toBeUndefined();
    });

    it("fires multiple times for multiple conflicting records", () => {
      const records = [
        makeRecord({ id: "pr-1", conflict_between_pr_holders: true, care_order_type: "full_care_order" }),
        makeRecord({ id: "pr-2", conflict_between_pr_holders: true, care_order_type: "full_care_order" }),
        makeRecord({ id: "pr-3", conflict_between_pr_holders: false, care_order_type: "full_care_order" }),
      ];
      const alerts = identifyPrAlerts(records, 3);
      const conflicts = alerts.filter((a) => a.type === "pr_conflict");
      expect(conflicts).toHaveLength(2);
    });
  });

  // ── care_order_expiring alert (high) ───────────────────────────────
  describe("care_order_expiring alert", () => {
    it("fires when care_order_expiry is within 30 days from now", () => {
      const records = [
        makeRecord({
          id: "pr-1",
          care_order_expiry: daysFromNow(15),
          care_order_type: "full_care_order",
        }),
      ];
      const alerts = identifyPrAlerts(records, 1);
      const expiring = alerts.find((a) => a.type === "care_order_expiring");
      expect(expiring).toBeTruthy();
    });

    it("has high severity", () => {
      const records = [
        makeRecord({
          id: "pr-1",
          care_order_expiry: daysFromNow(20),
          care_order_type: "interim_care_order",
        }),
      ];
      const alerts = identifyPrAlerts(records, 1);
      const expiring = alerts.find((a) => a.type === "care_order_expiring")!;
      expect(expiring.severity).toBe("high");
    });

    it("uses the record id as alert id", () => {
      const records = [
        makeRecord({
          id: "pr-77",
          care_order_expiry: daysFromNow(18),
          care_order_type: "full_care_order",
        }),
      ];
      const alerts = identifyPrAlerts(records, 1);
      const expiring = alerts.find((a) => a.type === "care_order_expiring")!;
      expect(expiring.id).toBe("pr-77");
    });

    it("message contains child_name", () => {
      const records = [
        makeRecord({
          id: "pr-1",
          child_name: "Emma White",
          care_order_expiry: daysFromNow(15),
          care_order_type: "full_care_order",
        }),
      ];
      const alerts = identifyPrAlerts(records, 1);
      const expiring = alerts.find((a) => a.type === "care_order_expiring")!;
      expect(expiring.message).toContain("Emma White");
    });

    it("message contains care order type (spaces instead of underscores)", () => {
      const records = [
        makeRecord({
          id: "pr-1",
          care_order_expiry: daysFromNow(15),
          care_order_type: "interim_care_order",
        }),
      ];
      const alerts = identifyPrAlerts(records, 1);
      const expiring = alerts.find((a) => a.type === "care_order_expiring")!;
      expect(expiring.message).toContain("interim care order");
    });

    it("fires at exactly 1 day from now", () => {
      const records = [
        makeRecord({
          id: "pr-1",
          care_order_expiry: daysFromNow(1),
          care_order_type: "full_care_order",
        }),
      ];
      const alerts = identifyPrAlerts(records, 1);
      expect(alerts.find((a) => a.type === "care_order_expiring")).toBeTruthy();
    });

    it("fires at exactly 29 days from now", () => {
      const records = [
        makeRecord({
          id: "pr-1",
          care_order_expiry: daysFromNow(29),
          care_order_type: "full_care_order",
        }),
      ];
      const alerts = identifyPrAlerts(records, 1);
      expect(alerts.find((a) => a.type === "care_order_expiring")).toBeTruthy();
    });

    it("does NOT fire when care_order_expiry is more than 30 days away", () => {
      const records = [
        makeRecord({
          id: "pr-1",
          care_order_expiry: daysFromNow(60),
          care_order_type: "full_care_order",
        }),
      ];
      const alerts = identifyPrAlerts(records, 1);
      expect(alerts.find((a) => a.type === "care_order_expiring")).toBeUndefined();
    });

    it("does NOT fire when care_order_expiry is in the past", () => {
      const records = [
        makeRecord({
          id: "pr-1",
          care_order_expiry: "2020-01-01",
          care_order_type: "full_care_order",
        }),
      ];
      const alerts = identifyPrAlerts(records, 1);
      expect(alerts.find((a) => a.type === "care_order_expiring")).toBeUndefined();
    });

    it("does NOT fire when care_order_expiry is null", () => {
      const records = [
        makeRecord({
          id: "pr-1",
          care_order_expiry: null,
          care_order_type: "full_care_order",
        }),
      ];
      const alerts = identifyPrAlerts(records, 1);
      expect(alerts.find((a) => a.type === "care_order_expiring")).toBeUndefined();
    });

    it("fires for multiple records with upcoming expiry", () => {
      const records = [
        makeRecord({ id: "pr-1", care_order_expiry: daysFromNow(10), care_order_type: "full_care_order" }),
        makeRecord({ id: "pr-2", care_order_expiry: daysFromNow(20), care_order_type: "interim_care_order" }),
        makeRecord({ id: "pr-3", care_order_expiry: daysFromNow(60), care_order_type: "section_20" }),
      ];
      const alerts = identifyPrAlerts(records, 3);
      const expiring = alerts.filter((a) => a.type === "care_order_expiring");
      expect(expiring).toHaveLength(2);
    });
  });

  // ── section_20_notice alert (medium) ────────────────────────────────
  describe("section_20_notice alert", () => {
    it("fires when there are section_20 records that are not terminated", () => {
      const records = [
        makeRecord({
          id: "pr-1",
          care_order_type: "section_20",
          pr_status: "active",
        }),
      ];
      const alerts = identifyPrAlerts(records, 1);
      const s20 = alerts.find((a) => a.type === "section_20_notice");
      expect(s20).toBeTruthy();
    });

    it("has medium severity", () => {
      const records = [
        makeRecord({
          id: "pr-1",
          care_order_type: "section_20",
          pr_status: "active",
        }),
      ];
      const alerts = identifyPrAlerts(records, 1);
      const s20 = alerts.find((a) => a.type === "section_20_notice")!;
      expect(s20.severity).toBe("medium");
    });

    it("has id section_20", () => {
      const records = [
        makeRecord({
          id: "pr-1",
          care_order_type: "section_20",
          pr_status: "active",
        }),
      ];
      const alerts = identifyPrAlerts(records, 1);
      const s20 = alerts.find((a) => a.type === "section_20_notice")!;
      expect(s20.id).toBe("section_20");
    });

    it("message uses singular for 1 child", () => {
      const records = [
        makeRecord({
          id: "pr-1",
          care_order_type: "section_20",
          pr_status: "active",
        }),
      ];
      const alerts = identifyPrAlerts(records, 1);
      const s20 = alerts.find((a) => a.type === "section_20_notice")!;
      expect(s20.message).toContain("1 child is");
    });

    it("message uses plural for multiple children", () => {
      const records = [
        makeRecord({ id: "pr-1", care_order_type: "section_20", pr_status: "active" }),
        makeRecord({ id: "pr-2", care_order_type: "section_20", pr_status: "shared" }),
        makeRecord({ id: "pr-3", care_order_type: "section_20", pr_status: "restricted" }),
      ];
      const alerts = identifyPrAlerts(records, 3);
      const s20 = alerts.find((a) => a.type === "section_20_notice")!;
      expect(s20.message).toContain("3 children are");
    });

    it("message mentions parents can withdraw consent", () => {
      const records = [
        makeRecord({
          id: "pr-1",
          care_order_type: "section_20",
          pr_status: "active",
        }),
      ];
      const alerts = identifyPrAlerts(records, 1);
      const s20 = alerts.find((a) => a.type === "section_20_notice")!;
      expect(s20.message).toContain("withdraw consent");
    });

    it("excludes terminated section_20 records from count", () => {
      const records = [
        makeRecord({ id: "pr-1", care_order_type: "section_20", pr_status: "terminated" }),
        makeRecord({ id: "pr-2", care_order_type: "section_20", pr_status: "active" }),
      ];
      const alerts = identifyPrAlerts(records, 2);
      const s20 = alerts.find((a) => a.type === "section_20_notice")!;
      expect(s20.message).toContain("1 child is");
    });

    it("does NOT fire when all section_20 records are terminated", () => {
      const records = [
        makeRecord({ id: "pr-1", care_order_type: "section_20", pr_status: "terminated" }),
      ];
      const alerts = identifyPrAlerts(records, 1);
      expect(alerts.find((a) => a.type === "section_20_notice")).toBeUndefined();
    });

    it("does NOT fire when no section_20 records exist", () => {
      const records = [
        makeRecord({ id: "pr-1", care_order_type: "full_care_order", pr_status: "active" }),
      ];
      const alerts = identifyPrAlerts(records, 1);
      expect(alerts.find((a) => a.type === "section_20_notice")).toBeUndefined();
    });

    it("only produces one section_20_notice alert regardless of count", () => {
      const records = [
        makeRecord({ id: "pr-1", care_order_type: "section_20", pr_status: "active" }),
        makeRecord({ id: "pr-2", care_order_type: "section_20", pr_status: "active" }),
        makeRecord({ id: "pr-3", care_order_type: "section_20", pr_status: "shared" }),
      ];
      const alerts = identifyPrAlerts(records, 3);
      const s20Alerts = alerts.filter((a) => a.type === "section_20_notice");
      expect(s20Alerts).toHaveLength(1);
    });

    it("includes suspended section_20 records in count", () => {
      const records = [
        makeRecord({ id: "pr-1", care_order_type: "section_20", pr_status: "suspended" }),
      ];
      const alerts = identifyPrAlerts(records, 1);
      const s20 = alerts.find((a) => a.type === "section_20_notice");
      expect(s20).toBeTruthy();
    });
  });

  // ── Combined alerts ────────────────────────────────────────────────
  describe("combined alert scenarios", () => {
    it("can fire all five alert types simultaneously", () => {
      const records = [
        // section_20 + not informed => pr_holder_not_informed + section_20_notice
        makeRecord({
          id: "pr-1",
          child_id: "c1",
          care_order_type: "section_20",
          pr_status: "active",
          pr_holder_informed_of_placement: false,
          conflict_between_pr_holders: false,
          care_order_expiry: null,
        }),
        // conflict
        makeRecord({
          id: "pr-2",
          child_id: "c2",
          care_order_type: "full_care_order",
          pr_status: "active",
          pr_holder_informed_of_placement: true,
          conflict_between_pr_holders: true,
          conflict_details: "Custody dispute",
          care_order_expiry: null,
        }),
        // care order expiring soon
        makeRecord({
          id: "pr-3",
          child_id: "c3",
          care_order_type: "interim_care_order",
          pr_status: "active",
          pr_holder_informed_of_placement: true,
          conflict_between_pr_holders: false,
          care_order_expiry: daysFromNow(15),
        }),
      ];
      // totalChildren=5, covered=3 => no_pr_record alert
      const alerts = identifyPrAlerts(records, 5);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("no_pr_record");
      expect(types).toContain("pr_holder_not_informed");
      expect(types).toContain("pr_conflict");
      expect(types).toContain("care_order_expiring");
      expect(types).toContain("section_20_notice");
    });

    it("returns alerts in correct order: gap, then per-record, then section_20", () => {
      const records = [
        makeRecord({
          id: "pr-1",
          child_id: "c1",
          care_order_type: "section_20",
          pr_status: "active",
          pr_holder_informed_of_placement: false,
          conflict_between_pr_holders: true,
          care_order_expiry: daysFromNow(15),
        }),
      ];
      const alerts = identifyPrAlerts(records, 3);
      // Order: no_pr_record, pr_holder_not_informed, pr_conflict, care_order_expiring, section_20_notice
      const types = alerts.map((a) => a.type);
      const gapIdx = types.indexOf("no_pr_record");
      const uninformedIdx = types.indexOf("pr_holder_not_informed");
      const conflictIdx = types.indexOf("pr_conflict");
      const expiringIdx = types.indexOf("care_order_expiring");
      const s20Idx = types.indexOf("section_20_notice");

      expect(gapIdx).toBeLessThan(uninformedIdx);
      expect(uninformedIdx).toBeLessThan(conflictIdx);
      expect(conflictIdx).toBeLessThan(expiringIdx);
      expect(expiringIdx).toBeLessThan(s20Idx);
    });

    it("returns no alerts for well-managed records", () => {
      const records = [
        makeRecord({
          id: "pr-1",
          child_id: "c1",
          care_order_type: "full_care_order",
          pr_status: "active",
          pr_holder_informed_of_placement: true,
          conflict_between_pr_holders: false,
          care_order_expiry: null,
        }),
        makeRecord({
          id: "pr-2",
          child_id: "c2",
          care_order_type: "interim_care_order",
          pr_status: "shared",
          pr_holder_informed_of_placement: true,
          conflict_between_pr_holders: false,
          care_order_expiry: daysFromNow(90),
        }),
      ];
      const alerts = identifyPrAlerts(records, 2);
      expect(alerts).toEqual([]);
    });
  });
});
