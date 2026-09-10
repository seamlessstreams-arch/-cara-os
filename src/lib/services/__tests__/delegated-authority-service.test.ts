// ══════════════════════════════════════════════════════════════════════════════
// CARA — DELEGATED AUTHORITY SERVICE TESTS
// Pure-function unit tests for delegated authority metrics computation,
// alert identification, constant validation, and type coverage.
// CHR 2015 Reg 21 (privacy and access), Reg 14 (care planning),
// Children Act 1989 s33(3)(b) (parental responsibility delegation).
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { todayStr } from "@/lib/utils";
import {
  _testing,
  DECISION_AREAS,
  AUTHORITY_LEVELS,
  AGREEMENT_STATUSES,
} from "../delegated-authority-service";

import type {
  DelegatedAuthority,
  DecisionArea,
  AuthorityLevel,
  AgreementStatus,
} from "../delegated-authority-service";

const {
  computeDelegatedAuthorityMetrics,
  identifyDelegatedAuthorityAlerts,
} = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Date string N days ago from now. */
function daysAgo(n: number): string {
  // UTC throughout: parsing todayStr() gives UTC midnight, so the day shift
  // must stay in UTC too — a local setDate lands an hour off across a DST
  // boundary and toISOString().slice(0,10) then names the wrong day.
  const [y, m, d] = todayStr().split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d - n)).toISOString().slice(0, 10);
}

/** Date string N days in the future from now. */
function daysFromNow(n: number): string {
  // UTC throughout: parsing todayStr() gives UTC midnight, so the day shift
  // must stay in UTC too — a local setDate lands an hour off across a DST
  // boundary and toISOString().slice(0,10) then names the wrong day.
  const [y, m, d] = todayStr().split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** ISO datetime string N days ago. */
function daysAgoISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

/** Build a minimal DelegatedAuthority with sensible defaults. */
function makeRecord(
  overrides: Partial<DelegatedAuthority> = {},
): DelegatedAuthority {
  return {
    id: "da-1",
    home_id: "home-1",
    child_name: "Alice Smith",
    child_id: "child-1",
    decision_area: "sleepovers",
    authority_level: "home_staff",
    agreement_status: "agreed",
    agreed_by: "Social Worker A",
    agreed_date: daysAgo(30),
    review_date: daysFromNow(60),
    specific_conditions: null,
    child_views_sought: true,
    child_agrees: true,
    social_worker_approved: true,
    documented_in_care_plan: true,
    notes: null,
    created_at: daysAgoISO(30),
    updated_at: daysAgoISO(30),
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════

describe("DECISION_AREAS constant", () => {
  it("should contain exactly 20 items", () => {
    expect(DECISION_AREAS).toHaveLength(20);
  });

  it("should have unique area values", () => {
    const areas = DECISION_AREAS.map((d) => d.area);
    expect(new Set(areas).size).toBe(20);
  });

  it("should have non-empty labels for every area", () => {
    for (const entry of DECISION_AREAS) {
      expect(entry.label.length).toBeGreaterThan(0);
    }
  });

  it("should include all expected decision areas", () => {
    const areas = DECISION_AREAS.map((d) => d.area);
    const expected: DecisionArea[] = [
      "sleepovers", "haircuts", "medical_routine", "medical_emergency",
      "dental", "school_trips", "overnight_stays", "social_media",
      "mobile_phone", "religious_activities", "extracurricular",
      "travel_abroad", "photographs", "piercing_tattoo", "pocket_money",
      "clothing", "food_diet", "contact_arrangements", "education_decisions",
      "other",
    ];
    for (const a of expected) {
      expect(areas).toContain(a);
    }
  });

  it("should have { area, label } shape for every entry", () => {
    for (const entry of DECISION_AREAS) {
      expect(entry).toHaveProperty("area");
      expect(entry).toHaveProperty("label");
      expect(typeof entry.area).toBe("string");
      expect(typeof entry.label).toBe("string");
    }
  });
});

describe("AUTHORITY_LEVELS constant", () => {
  it("should contain exactly 8 items", () => {
    expect(AUTHORITY_LEVELS).toHaveLength(8);
  });

  it("should have unique level values", () => {
    const levels = AUTHORITY_LEVELS.map((l) => l.level);
    expect(new Set(levels).size).toBe(8);
  });

  it("should have non-empty labels for every level", () => {
    for (const entry of AUTHORITY_LEVELS) {
      expect(entry.label.length).toBeGreaterThan(0);
    }
  });

  it("should include all expected authority levels", () => {
    const levels = AUTHORITY_LEVELS.map((l) => l.level);
    const expected: AuthorityLevel[] = [
      "home_staff", "registered_manager", "social_worker",
      "parent_carer", "local_authority", "court_order",
      "joint_decision", "not_delegated",
    ];
    for (const lvl of expected) {
      expect(levels).toContain(lvl);
    }
  });

  it("should have { level, label } shape for every entry", () => {
    for (const entry of AUTHORITY_LEVELS) {
      expect(entry).toHaveProperty("level");
      expect(entry).toHaveProperty("label");
      expect(typeof entry.level).toBe("string");
      expect(typeof entry.label).toBe("string");
    }
  });
});

describe("AGREEMENT_STATUSES constant", () => {
  it("should contain exactly 6 items", () => {
    expect(AGREEMENT_STATUSES).toHaveLength(6);
  });

  it("should have unique status values", () => {
    const statuses = AGREEMENT_STATUSES.map((s) => s.status);
    expect(new Set(statuses).size).toBe(6);
  });

  it("should have non-empty labels for every status", () => {
    for (const entry of AGREEMENT_STATUSES) {
      expect(entry.label.length).toBeGreaterThan(0);
    }
  });

  it("should include all expected agreement statuses", () => {
    const statuses = AGREEMENT_STATUSES.map((s) => s.status);
    const expected: AgreementStatus[] = [
      "agreed", "pending", "disputed",
      "not_applicable", "expired", "under_review",
    ];
    for (const s of expected) {
      expect(statuses).toContain(s);
    }
  });

  it("should have { status, label } shape for every entry", () => {
    for (const entry of AGREEMENT_STATUSES) {
      expect(entry).toHaveProperty("status");
      expect(entry).toHaveProperty("label");
      expect(typeof entry.status).toBe("string");
      expect(typeof entry.label).toBe("string");
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// computeDelegatedAuthorityMetrics
// ══════════════════════════════════════════════════════════════════════════════

describe("computeDelegatedAuthorityMetrics", () => {
  // ── Empty array ──────────────────────────────────────────────────────────

  describe("with empty records array", () => {
    it("should return zero total_records", () => {
      const m = computeDelegatedAuthorityMetrics([], 5);
      expect(m.total_records).toBe(0);
    });

    it("should return zero children_covered", () => {
      const m = computeDelegatedAuthorityMetrics([], 5);
      expect(m.children_covered).toBe(0);
    });

    it("should return zero coverage_rate", () => {
      const m = computeDelegatedAuthorityMetrics([], 5);
      expect(m.coverage_rate).toBe(0);
    });

    it("should return zero agreed_count", () => {
      const m = computeDelegatedAuthorityMetrics([], 5);
      expect(m.agreed_count).toBe(0);
    });

    it("should return zero pending_count", () => {
      const m = computeDelegatedAuthorityMetrics([], 5);
      expect(m.pending_count).toBe(0);
    });

    it("should return zero disputed_count", () => {
      const m = computeDelegatedAuthorityMetrics([], 5);
      expect(m.disputed_count).toBe(0);
    });

    it("should return zero expired_count", () => {
      const m = computeDelegatedAuthorityMetrics([], 5);
      expect(m.expired_count).toBe(0);
    });

    it("should return zero not_delegated_count", () => {
      const m = computeDelegatedAuthorityMetrics([], 5);
      expect(m.not_delegated_count).toBe(0);
    });

    it("should return zero child_views_sought_rate", () => {
      const m = computeDelegatedAuthorityMetrics([], 5);
      expect(m.child_views_sought_rate).toBeNull();; });

    it("should return zero social_worker_approved_rate", () => {
      const m = computeDelegatedAuthorityMetrics([], 5);
      expect(m.social_worker_approved_rate).toBeNull();; });

    it("should return zero documented_in_care_plan_rate", () => {
      const m = computeDelegatedAuthorityMetrics([], 5);
      expect(m.documented_in_care_plan_rate).toBeNull();; });

    it("should return zero review_overdue_count", () => {
      const m = computeDelegatedAuthorityMetrics([], 5);
      expect(m.review_overdue_count).toBe(0);
    });

    it("should return zero decisions_by_home_staff", () => {
      const m = computeDelegatedAuthorityMetrics([], 5);
      expect(m.decisions_by_home_staff).toBe(0);
    });

    it("should return zero decisions_needing_escalation", () => {
      const m = computeDelegatedAuthorityMetrics([], 5);
      expect(m.decisions_needing_escalation).toBe(0);
    });

    it("should return zero average_per_child", () => {
      const m = computeDelegatedAuthorityMetrics([], 5);
      expect(m.average_per_child).toBeNull();; });

    it("should return empty by_decision_area", () => {
      const m = computeDelegatedAuthorityMetrics([], 5);
      expect(m.by_decision_area).toEqual({});
    });

    it("should return empty by_authority_level", () => {
      const m = computeDelegatedAuthorityMetrics([], 5);
      expect(m.by_authority_level).toEqual({});
    });

    it("should return empty by_agreement_status", () => {
      const m = computeDelegatedAuthorityMetrics([], 5);
      expect(m.by_agreement_status).toEqual({});
    });
  });

  // ── Single record ──────────────────────────────────────────────────────

  describe("with a single record", () => {
    const single = makeRecord();

    it("should return total_records = 1", () => {
      const m = computeDelegatedAuthorityMetrics([single], 3);
      expect(m.total_records).toBe(1);
    });

    it("should return children_covered = 1", () => {
      const m = computeDelegatedAuthorityMetrics([single], 3);
      expect(m.children_covered).toBe(1);
    });

    it("should compute coverage_rate as 33.3 for 1 of 3 children", () => {
      const m = computeDelegatedAuthorityMetrics([single], 3);
      expect(m.coverage_rate).toBe(33.3);
    });

    it("should count agreed_count = 1 for an agreed record", () => {
      const m = computeDelegatedAuthorityMetrics([single], 3);
      expect(m.agreed_count).toBe(1);
    });

    it("should count pending_count = 0 for an agreed record", () => {
      const m = computeDelegatedAuthorityMetrics([single], 3);
      expect(m.pending_count).toBe(0);
    });

    it("should return child_views_sought_rate = 100 when views sought", () => {
      const m = computeDelegatedAuthorityMetrics([single], 3);
      expect(m.child_views_sought_rate).toBe(100);
    });

    it("should return social_worker_approved_rate = 100 when approved", () => {
      const m = computeDelegatedAuthorityMetrics([single], 3);
      expect(m.social_worker_approved_rate).toBe(100);
    });

    it("should return documented_in_care_plan_rate = 100 when documented", () => {
      const m = computeDelegatedAuthorityMetrics([single], 3);
      expect(m.documented_in_care_plan_rate).toBe(100);
    });

    it("should return decisions_by_home_staff = 1 for home_staff level", () => {
      const m = computeDelegatedAuthorityMetrics([single], 3);
      expect(m.decisions_by_home_staff).toBe(1);
    });

    it("should return decisions_needing_escalation = 0 for home_staff", () => {
      const m = computeDelegatedAuthorityMetrics([single], 3);
      expect(m.decisions_needing_escalation).toBe(0);
    });

    it("should return average_per_child = 1 for single child", () => {
      const m = computeDelegatedAuthorityMetrics([single], 3);
      expect(m.average_per_child).toBe(1);
    });

    it("should populate by_decision_area with sleepovers = 1", () => {
      const m = computeDelegatedAuthorityMetrics([single], 3);
      expect(m.by_decision_area).toEqual({ sleepovers: 1 });
    });

    it("should populate by_authority_level with home_staff = 1", () => {
      const m = computeDelegatedAuthorityMetrics([single], 3);
      expect(m.by_authority_level).toEqual({ home_staff: 1 });
    });

    it("should populate by_agreement_status with agreed = 1", () => {
      const m = computeDelegatedAuthorityMetrics([single], 3);
      expect(m.by_agreement_status).toEqual({ agreed: 1 });
    });
  });

  // ── total_records ──────────────────────────────────────────────────────

  describe("total_records", () => {
    it("should count all records regardless of status", () => {
      const records = [
        makeRecord({ id: "1", agreement_status: "agreed" }),
        makeRecord({ id: "2", agreement_status: "pending" }),
        makeRecord({ id: "3", agreement_status: "expired" }),
      ];
      const m = computeDelegatedAuthorityMetrics(records, 5);
      expect(m.total_records).toBe(3);
    });
  });

  // ── children_covered ──────────────────────────────────────────────────

  describe("children_covered", () => {
    it("should count unique child_ids", () => {
      const records = [
        makeRecord({ id: "1", child_id: "c1" }),
        makeRecord({ id: "2", child_id: "c1" }),
        makeRecord({ id: "3", child_id: "c2" }),
      ];
      const m = computeDelegatedAuthorityMetrics(records, 5);
      expect(m.children_covered).toBe(2);
    });

    it("should count 1 for all records with the same child_id", () => {
      const records = [
        makeRecord({ id: "1", child_id: "c1" }),
        makeRecord({ id: "2", child_id: "c1" }),
        makeRecord({ id: "3", child_id: "c1" }),
      ];
      const m = computeDelegatedAuthorityMetrics(records, 5);
      expect(m.children_covered).toBe(1);
    });

    it("should count each unique child across many records", () => {
      const records = [
        makeRecord({ id: "1", child_id: "c1" }),
        makeRecord({ id: "2", child_id: "c2" }),
        makeRecord({ id: "3", child_id: "c3" }),
        makeRecord({ id: "4", child_id: "c4" }),
        makeRecord({ id: "5", child_id: "c4" }),
      ];
      const m = computeDelegatedAuthorityMetrics(records, 10);
      expect(m.children_covered).toBe(4);
    });
  });

  // ── coverage_rate ─────────────────────────────────────────────────────

  describe("coverage_rate", () => {
    it("should return 100 when all children are covered", () => {
      const records = [
        makeRecord({ id: "1", child_id: "c1" }),
        makeRecord({ id: "2", child_id: "c2" }),
      ];
      const m = computeDelegatedAuthorityMetrics(records, 2);
      expect(m.coverage_rate).toBe(100);
    });

    it("should return 50 when half the children are covered", () => {
      const records = [
        makeRecord({ id: "1", child_id: "c1" }),
      ];
      const m = computeDelegatedAuthorityMetrics(records, 2);
      expect(m.coverage_rate).toBe(50);
    });

    it("should return 0 when totalChildren is 0", () => {
      const m = computeDelegatedAuthorityMetrics([], 0);
      expect(m.coverage_rate).toBeNull();; });

    it("should round to one decimal place", () => {
      // 1/3 = 33.333... => 33.3
      const records = [makeRecord({ id: "1", child_id: "c1" })];
      const m = computeDelegatedAuthorityMetrics(records, 3);
      expect(m.coverage_rate).toBe(33.3);
    });

    it("should handle coverage above 100% gracefully (more unique children than totalChildren)", () => {
      const records = [
        makeRecord({ id: "1", child_id: "c1" }),
        makeRecord({ id: "2", child_id: "c2" }),
        makeRecord({ id: "3", child_id: "c3" }),
      ];
      const m = computeDelegatedAuthorityMetrics(records, 2);
      expect(m.coverage_rate).toBe(150);
    });
  });

  // ── Status counts ──────────────────────────────────────────────────────

  describe("agreed_count", () => {
    it("should count only agreed records", () => {
      const records = [
        makeRecord({ id: "1", agreement_status: "agreed" }),
        makeRecord({ id: "2", agreement_status: "agreed" }),
        makeRecord({ id: "3", agreement_status: "pending" }),
      ];
      const m = computeDelegatedAuthorityMetrics(records, 5);
      expect(m.agreed_count).toBe(2);
    });

    it("should return 0 when no records are agreed", () => {
      const records = [
        makeRecord({ id: "1", agreement_status: "pending" }),
      ];
      const m = computeDelegatedAuthorityMetrics(records, 5);
      expect(m.agreed_count).toBe(0);
    });
  });

  describe("pending_count", () => {
    it("should count only pending records", () => {
      const records = [
        makeRecord({ id: "1", agreement_status: "pending" }),
        makeRecord({ id: "2", agreement_status: "pending" }),
        makeRecord({ id: "3", agreement_status: "agreed" }),
      ];
      const m = computeDelegatedAuthorityMetrics(records, 5);
      expect(m.pending_count).toBe(2);
    });

    it("should return 0 when no records are pending", () => {
      const records = [
        makeRecord({ id: "1", agreement_status: "agreed" }),
      ];
      const m = computeDelegatedAuthorityMetrics(records, 5);
      expect(m.pending_count).toBe(0);
    });
  });

  describe("disputed_count", () => {
    it("should count only disputed records", () => {
      const records = [
        makeRecord({ id: "1", agreement_status: "disputed" }),
        makeRecord({ id: "2", agreement_status: "agreed" }),
      ];
      const m = computeDelegatedAuthorityMetrics(records, 5);
      expect(m.disputed_count).toBe(1);
    });

    it("should return 0 when no records are disputed", () => {
      const records = [
        makeRecord({ id: "1", agreement_status: "agreed" }),
      ];
      const m = computeDelegatedAuthorityMetrics(records, 5);
      expect(m.disputed_count).toBe(0);
    });
  });

  describe("expired_count", () => {
    it("should count only expired records", () => {
      const records = [
        makeRecord({ id: "1", agreement_status: "expired" }),
        makeRecord({ id: "2", agreement_status: "expired" }),
        makeRecord({ id: "3", agreement_status: "agreed" }),
      ];
      const m = computeDelegatedAuthorityMetrics(records, 5);
      expect(m.expired_count).toBe(2);
    });

    it("should return 0 when no records are expired", () => {
      const records = [
        makeRecord({ id: "1", agreement_status: "agreed" }),
      ];
      const m = computeDelegatedAuthorityMetrics(records, 5);
      expect(m.expired_count).toBe(0);
    });
  });

  describe("not_delegated_count", () => {
    it("should count records with authority_level = not_delegated", () => {
      const records = [
        makeRecord({ id: "1", authority_level: "not_delegated" }),
        makeRecord({ id: "2", authority_level: "home_staff" }),
      ];
      const m = computeDelegatedAuthorityMetrics(records, 5);
      expect(m.not_delegated_count).toBe(1);
    });

    it("should return 0 when no records have not_delegated level", () => {
      const records = [
        makeRecord({ id: "1", authority_level: "home_staff" }),
      ];
      const m = computeDelegatedAuthorityMetrics(records, 5);
      expect(m.not_delegated_count).toBe(0);
    });

    it("should count multiple not_delegated records", () => {
      const records = [
        makeRecord({ id: "1", authority_level: "not_delegated" }),
        makeRecord({ id: "2", authority_level: "not_delegated" }),
        makeRecord({ id: "3", authority_level: "not_delegated" }),
      ];
      const m = computeDelegatedAuthorityMetrics(records, 5);
      expect(m.not_delegated_count).toBe(3);
    });
  });

  // ── Rate calculations ──────────────────────────────────────────────────

  describe("child_views_sought_rate", () => {
    it("should return 100 when all records have child_views_sought", () => {
      const records = [
        makeRecord({ id: "1", child_views_sought: true }),
        makeRecord({ id: "2", child_views_sought: true }),
      ];
      const m = computeDelegatedAuthorityMetrics(records, 5);
      expect(m.child_views_sought_rate).toBe(100);
    });

    it("should return 0 when no records have child_views_sought", () => {
      const records = [
        makeRecord({ id: "1", child_views_sought: false }),
        makeRecord({ id: "2", child_views_sought: false }),
      ];
      const m = computeDelegatedAuthorityMetrics(records, 5);
      expect(m.child_views_sought_rate).toBe(0);
    });

    it("should return 50 when half have views sought", () => {
      const records = [
        makeRecord({ id: "1", child_views_sought: true }),
        makeRecord({ id: "2", child_views_sought: false }),
      ];
      const m = computeDelegatedAuthorityMetrics(records, 5);
      expect(m.child_views_sought_rate).toBe(50);
    });

    it("should round to one decimal place", () => {
      // 1/3 = 33.333... => 33.3
      const records = [
        makeRecord({ id: "1", child_views_sought: true }),
        makeRecord({ id: "2", child_views_sought: false }),
        makeRecord({ id: "3", child_views_sought: false }),
      ];
      const m = computeDelegatedAuthorityMetrics(records, 5);
      expect(m.child_views_sought_rate).toBe(33.3);
    });
  });

  describe("social_worker_approved_rate", () => {
    it("should return 100 when all records are approved", () => {
      const records = [
        makeRecord({ id: "1", social_worker_approved: true }),
        makeRecord({ id: "2", social_worker_approved: true }),
      ];
      const m = computeDelegatedAuthorityMetrics(records, 5);
      expect(m.social_worker_approved_rate).toBe(100);
    });

    it("should return 0 when no records are approved", () => {
      const records = [
        makeRecord({ id: "1", social_worker_approved: false }),
        makeRecord({ id: "2", social_worker_approved: false }),
      ];
      const m = computeDelegatedAuthorityMetrics(records, 5);
      expect(m.social_worker_approved_rate).toBe(0);
    });

    it("should calculate correct percentage for mixed approvals", () => {
      const records = [
        makeRecord({ id: "1", social_worker_approved: true }),
        makeRecord({ id: "2", social_worker_approved: true }),
        makeRecord({ id: "3", social_worker_approved: false }),
        makeRecord({ id: "4", social_worker_approved: false }),
      ];
      const m = computeDelegatedAuthorityMetrics(records, 5);
      expect(m.social_worker_approved_rate).toBe(50);
    });
  });

  describe("documented_in_care_plan_rate", () => {
    it("should return 100 when all records are documented", () => {
      const records = [
        makeRecord({ id: "1", documented_in_care_plan: true }),
        makeRecord({ id: "2", documented_in_care_plan: true }),
      ];
      const m = computeDelegatedAuthorityMetrics(records, 5);
      expect(m.documented_in_care_plan_rate).toBe(100);
    });

    it("should return 0 when no records are documented", () => {
      const records = [
        makeRecord({ id: "1", documented_in_care_plan: false }),
        makeRecord({ id: "2", documented_in_care_plan: false }),
      ];
      const m = computeDelegatedAuthorityMetrics(records, 5);
      expect(m.documented_in_care_plan_rate).toBe(0);
    });

    it("should round to one decimal place for thirds", () => {
      // 2/3 = 66.666... => 66.7
      const records = [
        makeRecord({ id: "1", documented_in_care_plan: true }),
        makeRecord({ id: "2", documented_in_care_plan: true }),
        makeRecord({ id: "3", documented_in_care_plan: false }),
      ];
      const m = computeDelegatedAuthorityMetrics(records, 5);
      expect(m.documented_in_care_plan_rate).toBe(66.7);
    });
  });

  // ── review_overdue_count ─────────────────────────────────────────────

  describe("review_overdue_count", () => {
    it("should count records with past review_date", () => {
      const records = [
        makeRecord({ id: "1", review_date: daysAgo(10), agreement_status: "agreed" }),
      ];
      const m = computeDelegatedAuthorityMetrics(records, 5);
      expect(m.review_overdue_count).toBe(1);
    });

    it("should NOT count records with future review_date", () => {
      const records = [
        makeRecord({ id: "1", review_date: daysFromNow(10), agreement_status: "agreed" }),
      ];
      const m = computeDelegatedAuthorityMetrics(records, 5);
      expect(m.review_overdue_count).toBe(0);
    });

    it("should NOT count records with null review_date", () => {
      const records = [
        makeRecord({ id: "1", review_date: null, agreement_status: "agreed" }),
      ];
      const m = computeDelegatedAuthorityMetrics(records, 5);
      expect(m.review_overdue_count).toBe(0);
    });

    it("should EXCLUDE expired records from overdue count", () => {
      const records = [
        makeRecord({ id: "1", review_date: daysAgo(10), agreement_status: "expired" }),
      ];
      const m = computeDelegatedAuthorityMetrics(records, 5);
      expect(m.review_overdue_count).toBe(0);
    });

    it("should EXCLUDE not_applicable records from overdue count", () => {
      const records = [
        makeRecord({ id: "1", review_date: daysAgo(10), agreement_status: "not_applicable" }),
      ];
      const m = computeDelegatedAuthorityMetrics(records, 5);
      expect(m.review_overdue_count).toBe(0);
    });

    it("should count overdue agreed records", () => {
      const records = [
        makeRecord({ id: "1", review_date: daysAgo(100), agreement_status: "agreed" }),
      ];
      const m = computeDelegatedAuthorityMetrics(records, 5);
      expect(m.review_overdue_count).toBe(1);
    });

    it("should count overdue pending records", () => {
      const records = [
        makeRecord({ id: "1", review_date: daysAgo(50), agreement_status: "pending" }),
      ];
      const m = computeDelegatedAuthorityMetrics(records, 5);
      expect(m.review_overdue_count).toBe(1);
    });

    it("should count overdue disputed records", () => {
      const records = [
        makeRecord({ id: "1", review_date: daysAgo(30), agreement_status: "disputed" }),
      ];
      const m = computeDelegatedAuthorityMetrics(records, 5);
      expect(m.review_overdue_count).toBe(1);
    });

    it("should count overdue under_review records", () => {
      const records = [
        makeRecord({ id: "1", review_date: daysAgo(20), agreement_status: "under_review" }),
      ];
      const m = computeDelegatedAuthorityMetrics(records, 5);
      expect(m.review_overdue_count).toBe(1);
    });

    it("should count multiple overdue records correctly", () => {
      const records = [
        makeRecord({ id: "1", review_date: daysAgo(10), agreement_status: "agreed" }),
        makeRecord({ id: "2", review_date: daysAgo(20), agreement_status: "pending" }),
        makeRecord({ id: "3", review_date: daysFromNow(30), agreement_status: "agreed" }),
        makeRecord({ id: "4", review_date: daysAgo(5), agreement_status: "expired" }),
      ];
      const m = computeDelegatedAuthorityMetrics(records, 5);
      expect(m.review_overdue_count).toBe(2);
    });

    it("should use far-past dates to guarantee overdue", () => {
      const records = [
        makeRecord({ id: "1", review_date: "2020-01-01", agreement_status: "agreed" }),
        makeRecord({ id: "2", review_date: "2019-06-15", agreement_status: "pending" }),
      ];
      const m = computeDelegatedAuthorityMetrics(records, 5);
      expect(m.review_overdue_count).toBe(2);
    });
  });

  // ── decisions_by_home_staff ──────────────────────────────────────────

  describe("decisions_by_home_staff", () => {
    it("should count records with authority_level = home_staff", () => {
      const records = [
        makeRecord({ id: "1", authority_level: "home_staff" }),
        makeRecord({ id: "2", authority_level: "home_staff" }),
        makeRecord({ id: "3", authority_level: "social_worker" }),
      ];
      const m = computeDelegatedAuthorityMetrics(records, 5);
      expect(m.decisions_by_home_staff).toBe(2);
    });

    it("should return 0 when no records have home_staff level", () => {
      const records = [
        makeRecord({ id: "1", authority_level: "registered_manager" }),
      ];
      const m = computeDelegatedAuthorityMetrics(records, 5);
      expect(m.decisions_by_home_staff).toBe(0);
    });
  });

  // ── decisions_needing_escalation ──────────────────────────────────────

  describe("decisions_needing_escalation", () => {
    it("should count local_authority records", () => {
      const records = [
        makeRecord({ id: "1", authority_level: "local_authority" }),
      ];
      const m = computeDelegatedAuthorityMetrics(records, 5);
      expect(m.decisions_needing_escalation).toBe(1);
    });

    it("should count court_order records", () => {
      const records = [
        makeRecord({ id: "1", authority_level: "court_order" }),
      ];
      const m = computeDelegatedAuthorityMetrics(records, 5);
      expect(m.decisions_needing_escalation).toBe(1);
    });

    it("should count social_worker records", () => {
      const records = [
        makeRecord({ id: "1", authority_level: "social_worker" }),
      ];
      const m = computeDelegatedAuthorityMetrics(records, 5);
      expect(m.decisions_needing_escalation).toBe(1);
    });

    it("should NOT count home_staff records as needing escalation", () => {
      const records = [
        makeRecord({ id: "1", authority_level: "home_staff" }),
      ];
      const m = computeDelegatedAuthorityMetrics(records, 5);
      expect(m.decisions_needing_escalation).toBe(0);
    });

    it("should NOT count registered_manager as needing escalation", () => {
      const records = [
        makeRecord({ id: "1", authority_level: "registered_manager" }),
      ];
      const m = computeDelegatedAuthorityMetrics(records, 5);
      expect(m.decisions_needing_escalation).toBe(0);
    });

    it("should NOT count parent_carer as needing escalation", () => {
      const records = [
        makeRecord({ id: "1", authority_level: "parent_carer" }),
      ];
      const m = computeDelegatedAuthorityMetrics(records, 5);
      expect(m.decisions_needing_escalation).toBe(0);
    });

    it("should NOT count joint_decision as needing escalation", () => {
      const records = [
        makeRecord({ id: "1", authority_level: "joint_decision" }),
      ];
      const m = computeDelegatedAuthorityMetrics(records, 5);
      expect(m.decisions_needing_escalation).toBe(0);
    });

    it("should NOT count not_delegated as needing escalation", () => {
      const records = [
        makeRecord({ id: "1", authority_level: "not_delegated" }),
      ];
      const m = computeDelegatedAuthorityMetrics(records, 5);
      expect(m.decisions_needing_escalation).toBe(0);
    });

    it("should sum all three escalation levels", () => {
      const records = [
        makeRecord({ id: "1", authority_level: "local_authority" }),
        makeRecord({ id: "2", authority_level: "court_order" }),
        makeRecord({ id: "3", authority_level: "social_worker" }),
        makeRecord({ id: "4", authority_level: "home_staff" }),
      ];
      const m = computeDelegatedAuthorityMetrics(records, 5);
      expect(m.decisions_needing_escalation).toBe(3);
    });
  });

  // ── average_per_child ─────────────────────────────────────────────────

  describe("average_per_child", () => {
    it("should return 0 when there are no records", () => {
      const m = computeDelegatedAuthorityMetrics([], 5);
      expect(m.average_per_child).toBeNull();; });

    it("should return 1 for one record and one child", () => {
      const records = [makeRecord({ id: "1", child_id: "c1" })];
      const m = computeDelegatedAuthorityMetrics(records, 5);
      expect(m.average_per_child).toBe(1);
    });

    it("should return 2 for two records same child", () => {
      const records = [
        makeRecord({ id: "1", child_id: "c1" }),
        makeRecord({ id: "2", child_id: "c1" }),
      ];
      const m = computeDelegatedAuthorityMetrics(records, 5);
      expect(m.average_per_child).toBe(2);
    });

    it("should return 1.5 for three records two children", () => {
      const records = [
        makeRecord({ id: "1", child_id: "c1" }),
        makeRecord({ id: "2", child_id: "c1" }),
        makeRecord({ id: "3", child_id: "c2" }),
      ];
      const m = computeDelegatedAuthorityMetrics(records, 5);
      expect(m.average_per_child).toBe(1.5);
    });

    it("should round to one decimal place", () => {
      // 5/3 = 1.666... => 1.7
      const records = [
        makeRecord({ id: "1", child_id: "c1" }),
        makeRecord({ id: "2", child_id: "c1" }),
        makeRecord({ id: "3", child_id: "c2" }),
        makeRecord({ id: "4", child_id: "c2" }),
        makeRecord({ id: "5", child_id: "c3" }),
      ];
      const m = computeDelegatedAuthorityMetrics(records, 5);
      expect(m.average_per_child).toBe(1.7);
    });

    it("should return 1 when each child has exactly one record", () => {
      const records = [
        makeRecord({ id: "1", child_id: "c1" }),
        makeRecord({ id: "2", child_id: "c2" }),
        makeRecord({ id: "3", child_id: "c3" }),
      ];
      const m = computeDelegatedAuthorityMetrics(records, 5);
      expect(m.average_per_child).toBe(1);
    });
  });

  // ── by_decision_area ──────────────────────────────────────────────────

  describe("by_decision_area", () => {
    it("should group records by decision_area", () => {
      const records = [
        makeRecord({ id: "1", decision_area: "sleepovers" }),
        makeRecord({ id: "2", decision_area: "sleepovers" }),
        makeRecord({ id: "3", decision_area: "haircuts" }),
        makeRecord({ id: "4", decision_area: "dental" }),
      ];
      const m = computeDelegatedAuthorityMetrics(records, 5);
      expect(m.by_decision_area).toEqual({
        sleepovers: 2,
        haircuts: 1,
        dental: 1,
      });
    });

    it("should handle single area", () => {
      const records = [
        makeRecord({ id: "1", decision_area: "medical_routine" }),
      ];
      const m = computeDelegatedAuthorityMetrics(records, 5);
      expect(m.by_decision_area).toEqual({ medical_routine: 1 });
    });

    it("should track all 20 areas when present", () => {
      const allAreas: DecisionArea[] = DECISION_AREAS.map((d) => d.area);
      const records = allAreas.map((area, i) =>
        makeRecord({ id: `da-${i}`, decision_area: area }),
      );
      const m = computeDelegatedAuthorityMetrics(records, 10);
      expect(Object.keys(m.by_decision_area)).toHaveLength(20);
      for (const area of allAreas) {
        expect(m.by_decision_area[area]).toBe(1);
      }
    });
  });

  // ── by_authority_level ─────────────────────────────────────────────────

  describe("by_authority_level", () => {
    it("should group records by authority_level", () => {
      const records = [
        makeRecord({ id: "1", authority_level: "home_staff" }),
        makeRecord({ id: "2", authority_level: "home_staff" }),
        makeRecord({ id: "3", authority_level: "social_worker" }),
      ];
      const m = computeDelegatedAuthorityMetrics(records, 5);
      expect(m.by_authority_level).toEqual({
        home_staff: 2,
        social_worker: 1,
      });
    });

    it("should track all 8 levels when present", () => {
      const allLevels: AuthorityLevel[] = AUTHORITY_LEVELS.map((l) => l.level);
      const records = allLevels.map((level, i) =>
        makeRecord({ id: `da-${i}`, authority_level: level }),
      );
      const m = computeDelegatedAuthorityMetrics(records, 10);
      expect(Object.keys(m.by_authority_level)).toHaveLength(8);
      for (const level of allLevels) {
        expect(m.by_authority_level[level]).toBe(1);
      }
    });
  });

  // ── by_agreement_status ───────────────────────────────────────────────

  describe("by_agreement_status", () => {
    it("should group records by agreement_status", () => {
      const records = [
        makeRecord({ id: "1", agreement_status: "agreed" }),
        makeRecord({ id: "2", agreement_status: "agreed" }),
        makeRecord({ id: "3", agreement_status: "pending" }),
        makeRecord({ id: "4", agreement_status: "expired" }),
      ];
      const m = computeDelegatedAuthorityMetrics(records, 5);
      expect(m.by_agreement_status).toEqual({
        agreed: 2,
        pending: 1,
        expired: 1,
      });
    });

    it("should track all 6 statuses when present", () => {
      const allStatuses: AgreementStatus[] = AGREEMENT_STATUSES.map((s) => s.status);
      const records = allStatuses.map((status, i) =>
        makeRecord({ id: `da-${i}`, agreement_status: status }),
      );
      const m = computeDelegatedAuthorityMetrics(records, 10);
      expect(Object.keys(m.by_agreement_status)).toHaveLength(6);
      for (const status of allStatuses) {
        expect(m.by_agreement_status[status]).toBe(1);
      }
    });
  });

  // ── Multiple records comprehensive ───────────────────────────────────

  describe("with multiple records (comprehensive)", () => {
    const records = [
      makeRecord({
        id: "1", child_id: "c1", decision_area: "sleepovers",
        authority_level: "home_staff", agreement_status: "agreed",
        child_views_sought: true, social_worker_approved: true,
        documented_in_care_plan: true, review_date: daysFromNow(30),
      }),
      makeRecord({
        id: "2", child_id: "c1", decision_area: "haircuts",
        authority_level: "home_staff", agreement_status: "agreed",
        child_views_sought: true, social_worker_approved: true,
        documented_in_care_plan: false, review_date: daysAgo(10),
      }),
      makeRecord({
        id: "3", child_id: "c2", decision_area: "medical_routine",
        authority_level: "social_worker", agreement_status: "pending",
        child_views_sought: false, social_worker_approved: false,
        documented_in_care_plan: false, review_date: daysFromNow(60),
      }),
      makeRecord({
        id: "4", child_id: "c3", decision_area: "travel_abroad",
        authority_level: "local_authority", agreement_status: "disputed",
        child_views_sought: false, social_worker_approved: false,
        documented_in_care_plan: false, review_date: daysAgo(5),
      }),
      makeRecord({
        id: "5", child_id: "c3", decision_area: "school_trips",
        authority_level: "court_order", agreement_status: "expired",
        child_views_sought: true, social_worker_approved: false,
        documented_in_care_plan: false, review_date: daysAgo(20),
      }),
    ];
    const totalChildren = 6;

    it("should return total_records = 5", () => {
      const m = computeDelegatedAuthorityMetrics(records, totalChildren);
      expect(m.total_records).toBe(5);
    });

    it("should return children_covered = 3", () => {
      const m = computeDelegatedAuthorityMetrics(records, totalChildren);
      expect(m.children_covered).toBe(3);
    });

    it("should return coverage_rate = 50", () => {
      const m = computeDelegatedAuthorityMetrics(records, totalChildren);
      expect(m.coverage_rate).toBe(50);
    });

    it("should return agreed_count = 2", () => {
      const m = computeDelegatedAuthorityMetrics(records, totalChildren);
      expect(m.agreed_count).toBe(2);
    });

    it("should return pending_count = 1", () => {
      const m = computeDelegatedAuthorityMetrics(records, totalChildren);
      expect(m.pending_count).toBe(1);
    });

    it("should return disputed_count = 1", () => {
      const m = computeDelegatedAuthorityMetrics(records, totalChildren);
      expect(m.disputed_count).toBe(1);
    });

    it("should return expired_count = 1", () => {
      const m = computeDelegatedAuthorityMetrics(records, totalChildren);
      expect(m.expired_count).toBe(1);
    });

    it("should return not_delegated_count = 0", () => {
      const m = computeDelegatedAuthorityMetrics(records, totalChildren);
      expect(m.not_delegated_count).toBe(0);
    });

    it("should return child_views_sought_rate = 60", () => {
      // 3 out of 5
      const m = computeDelegatedAuthorityMetrics(records, totalChildren);
      expect(m.child_views_sought_rate).toBe(60);
    });

    it("should return social_worker_approved_rate = 40", () => {
      // 2 out of 5
      const m = computeDelegatedAuthorityMetrics(records, totalChildren);
      expect(m.social_worker_approved_rate).toBe(40);
    });

    it("should return documented_in_care_plan_rate = 20", () => {
      // 1 out of 5
      const m = computeDelegatedAuthorityMetrics(records, totalChildren);
      expect(m.documented_in_care_plan_rate).toBe(20);
    });

    it("should return review_overdue_count = 2 (excludes expired)", () => {
      // record 2 (agreed, past review) and record 4 (disputed, past review)
      // record 5 is expired so excluded
      const m = computeDelegatedAuthorityMetrics(records, totalChildren);
      expect(m.review_overdue_count).toBe(2);
    });

    it("should return decisions_by_home_staff = 2", () => {
      const m = computeDelegatedAuthorityMetrics(records, totalChildren);
      expect(m.decisions_by_home_staff).toBe(2);
    });

    it("should return decisions_needing_escalation = 3", () => {
      // social_worker + local_authority + court_order
      const m = computeDelegatedAuthorityMetrics(records, totalChildren);
      expect(m.decisions_needing_escalation).toBe(3);
    });

    it("should return average_per_child = 1.7 (5/3 rounded)", () => {
      const m = computeDelegatedAuthorityMetrics(records, totalChildren);
      expect(m.average_per_child).toBe(1.7);
    });

    it("should return correct by_decision_area breakdown", () => {
      const m = computeDelegatedAuthorityMetrics(records, totalChildren);
      expect(m.by_decision_area).toEqual({
        sleepovers: 1,
        haircuts: 1,
        medical_routine: 1,
        travel_abroad: 1,
        school_trips: 1,
      });
    });

    it("should return correct by_authority_level breakdown", () => {
      const m = computeDelegatedAuthorityMetrics(records, totalChildren);
      expect(m.by_authority_level).toEqual({
        home_staff: 2,
        social_worker: 1,
        local_authority: 1,
        court_order: 1,
      });
    });

    it("should return correct by_agreement_status breakdown", () => {
      const m = computeDelegatedAuthorityMetrics(records, totalChildren);
      expect(m.by_agreement_status).toEqual({
        agreed: 2,
        pending: 1,
        disputed: 1,
        expired: 1,
      });
    });
  });

  // ── Edge cases ──────────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("should handle totalChildren = 0 with empty records", () => {
      const m = computeDelegatedAuthorityMetrics([], 0);
      expect(m.coverage_rate).toBeNull();; expect(m.total_records).toBe(0);
    });

    it("should handle totalChildren = 0 with records present", () => {
      const records = [makeRecord({ id: "1", child_id: "c1" })];
      const m = computeDelegatedAuthorityMetrics(records, 0);
      expect(m.coverage_rate).toBeNull();; expect(m.children_covered).toBe(1);
    });

    it("should handle all records having the same decision_area", () => {
      const records = [
        makeRecord({ id: "1", decision_area: "dental", child_id: "c1" }),
        makeRecord({ id: "2", decision_area: "dental", child_id: "c2" }),
        makeRecord({ id: "3", decision_area: "dental", child_id: "c3" }),
      ];
      const m = computeDelegatedAuthorityMetrics(records, 5);
      expect(m.by_decision_area).toEqual({ dental: 3 });
    });

    it("should handle all records having different statuses", () => {
      const records = [
        makeRecord({ id: "1", agreement_status: "agreed", child_id: "c1" }),
        makeRecord({ id: "2", agreement_status: "pending", child_id: "c2" }),
        makeRecord({ id: "3", agreement_status: "disputed", child_id: "c3" }),
        makeRecord({ id: "4", agreement_status: "expired", child_id: "c4" }),
        makeRecord({ id: "5", agreement_status: "not_applicable", child_id: "c5" }),
        makeRecord({ id: "6", agreement_status: "under_review", child_id: "c6" }),
      ];
      const m = computeDelegatedAuthorityMetrics(records, 10);
      expect(m.agreed_count).toBe(1);
      expect(m.pending_count).toBe(1);
      expect(m.disputed_count).toBe(1);
      expect(m.expired_count).toBe(1);
      expect(m.by_agreement_status).toEqual({
        agreed: 1, pending: 1, disputed: 1,
        expired: 1, not_applicable: 1, under_review: 1,
      });
    });

    it("should return all 18 fields", () => {
      const m = computeDelegatedAuthorityMetrics([], 0);
      const keys = Object.keys(m);
      expect(keys).toContain("total_records");
      expect(keys).toContain("children_covered");
      expect(keys).toContain("coverage_rate");
      expect(keys).toContain("agreed_count");
      expect(keys).toContain("pending_count");
      expect(keys).toContain("disputed_count");
      expect(keys).toContain("expired_count");
      expect(keys).toContain("not_delegated_count");
      expect(keys).toContain("child_views_sought_rate");
      expect(keys).toContain("social_worker_approved_rate");
      expect(keys).toContain("documented_in_care_plan_rate");
      expect(keys).toContain("review_overdue_count");
      expect(keys).toContain("decisions_by_home_staff");
      expect(keys).toContain("decisions_needing_escalation");
      expect(keys).toContain("average_per_child");
      expect(keys).toContain("by_decision_area");
      expect(keys).toContain("by_authority_level");
      expect(keys).toContain("by_agreement_status");
      expect(keys).toHaveLength(18);
    });

    it("should handle under_review status (not counted in agreed/pending/disputed/expired)", () => {
      const records = [
        makeRecord({ id: "1", agreement_status: "under_review" }),
      ];
      const m = computeDelegatedAuthorityMetrics(records, 5);
      expect(m.agreed_count).toBe(0);
      expect(m.pending_count).toBe(0);
      expect(m.disputed_count).toBe(0);
      expect(m.expired_count).toBe(0);
      expect(m.by_agreement_status).toEqual({ under_review: 1 });
    });

    it("should handle not_applicable status", () => {
      const records = [
        makeRecord({ id: "1", agreement_status: "not_applicable" }),
      ];
      const m = computeDelegatedAuthorityMetrics(records, 5);
      expect(m.agreed_count).toBe(0);
      expect(m.pending_count).toBe(0);
      expect(m.disputed_count).toBe(0);
      expect(m.expired_count).toBe(0);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// identifyDelegatedAuthorityAlerts
// ══════════════════════════════════════════════════════════════════════════════

describe("identifyDelegatedAuthorityAlerts", () => {
  // ── No alerts ──────────────────────────────────────────────────────────

  describe("when no alert conditions are met", () => {
    it("should return empty array with empty records and totalChildren = 0", () => {
      const alerts = identifyDelegatedAuthorityAlerts([], 0);
      expect(alerts).toEqual([]);
    });

    it("should return empty array when all conditions are healthy", () => {
      const records = [
        makeRecord({
          id: "1", child_id: "c1", agreement_status: "agreed",
          child_views_sought: true, documented_in_care_plan: true,
        }),
        makeRecord({
          id: "2", child_id: "c2", agreement_status: "agreed",
          child_views_sought: true, documented_in_care_plan: true,
        }),
      ];
      const alerts = identifyDelegatedAuthorityAlerts(records, 2);
      expect(alerts).toEqual([]);
    });
  });

  // ── no_delegation alert ──────────────────────────────────────────────

  describe("no_delegation alert", () => {
    it("should trigger when totalChildren > covered children", () => {
      const records = [
        makeRecord({ id: "1", child_id: "c1" }),
      ];
      const alerts = identifyDelegatedAuthorityAlerts(records, 3);
      const noDel = alerts.find((a) => a.type === "no_delegation");
      expect(noDel).toBeDefined();
    });

    it("should have severity = high", () => {
      const records = [makeRecord({ id: "1", child_id: "c1" })];
      const alerts = identifyDelegatedAuthorityAlerts(records, 3);
      const noDel = alerts.find((a) => a.type === "no_delegation")!;
      expect(noDel.severity).toBe("high");
    });

    it("should have id = delegation_gap", () => {
      const records = [makeRecord({ id: "1", child_id: "c1" })];
      const alerts = identifyDelegatedAuthorityAlerts(records, 3);
      const noDel = alerts.find((a) => a.type === "no_delegation")!;
      expect(noDel.id).toBe("delegation_gap");
    });

    it("should report the correct gap count in message (singular)", () => {
      const records = [
        makeRecord({ id: "1", child_id: "c1" }),
        makeRecord({ id: "2", child_id: "c2" }),
      ];
      const alerts = identifyDelegatedAuthorityAlerts(records, 3);
      const noDel = alerts.find((a) => a.type === "no_delegation")!;
      expect(noDel.message).toContain("1 child has");
    });

    it("should report the correct gap count in message (plural)", () => {
      const records = [makeRecord({ id: "1", child_id: "c1" })];
      const alerts = identifyDelegatedAuthorityAlerts(records, 4);
      const noDel = alerts.find((a) => a.type === "no_delegation")!;
      expect(noDel.message).toContain("3 children have");
    });

    it("should NOT trigger when all children are covered", () => {
      const records = [
        makeRecord({ id: "1", child_id: "c1" }),
        makeRecord({ id: "2", child_id: "c2" }),
      ];
      const alerts = identifyDelegatedAuthorityAlerts(records, 2);
      const noDel = alerts.find((a) => a.type === "no_delegation");
      expect(noDel).toBeUndefined();
    });

    it("should NOT trigger when totalChildren = 0", () => {
      const alerts = identifyDelegatedAuthorityAlerts([], 0);
      const noDel = alerts.find((a) => a.type === "no_delegation");
      expect(noDel).toBeUndefined();
    });

    it("should NOT trigger when more unique children than totalChildren", () => {
      const records = [
        makeRecord({ id: "1", child_id: "c1" }),
        makeRecord({ id: "2", child_id: "c2" }),
        makeRecord({ id: "3", child_id: "c3" }),
      ];
      const alerts = identifyDelegatedAuthorityAlerts(records, 2);
      const noDel = alerts.find((a) => a.type === "no_delegation");
      expect(noDel).toBeUndefined();
    });

    it("should trigger when no records at all but totalChildren > 0", () => {
      const alerts = identifyDelegatedAuthorityAlerts([], 5);
      const noDel = alerts.find((a) => a.type === "no_delegation");
      expect(noDel).toBeDefined();
      expect(noDel!.message).toContain("5 children have");
    });

    it("should handle duplicate child_ids correctly for gap calculation", () => {
      const records = [
        makeRecord({ id: "1", child_id: "c1" }),
        makeRecord({ id: "2", child_id: "c1" }),
        makeRecord({ id: "3", child_id: "c1" }),
      ];
      // Only 1 unique child covered, but totalChildren = 4
      const alerts = identifyDelegatedAuthorityAlerts(records, 4);
      const noDel = alerts.find((a) => a.type === "no_delegation")!;
      expect(noDel.message).toContain("3 children have");
    });
  });

  // ── disputed_authority alert ──────────────────────────────────────────

  describe("disputed_authority alert", () => {
    it("should trigger for each disputed record", () => {
      const records = [
        makeRecord({ id: "da-100", child_name: "Alice", agreement_status: "disputed", decision_area: "sleepovers" }),
        makeRecord({ id: "da-200", child_name: "Bob", agreement_status: "disputed", decision_area: "haircuts" }),
      ];
      const alerts = identifyDelegatedAuthorityAlerts(records, 5);
      const disputed = alerts.filter((a) => a.type === "disputed_authority");
      expect(disputed).toHaveLength(2);
    });

    it("should have severity = high", () => {
      const records = [
        makeRecord({ id: "da-100", agreement_status: "disputed" }),
      ];
      const alerts = identifyDelegatedAuthorityAlerts(records, 5);
      const disputed = alerts.find((a) => a.type === "disputed_authority")!;
      expect(disputed.severity).toBe("high");
    });

    it("should use record id as alert id", () => {
      const records = [
        makeRecord({ id: "da-xyz", agreement_status: "disputed" }),
      ];
      const alerts = identifyDelegatedAuthorityAlerts(records, 5);
      const disputed = alerts.find((a) => a.type === "disputed_authority")!;
      expect(disputed.id).toBe("da-xyz");
    });

    it("should include child_name in message", () => {
      const records = [
        makeRecord({ id: "1", child_name: "TestChild", agreement_status: "disputed" }),
      ];
      const alerts = identifyDelegatedAuthorityAlerts(records, 5);
      const disputed = alerts.find((a) => a.type === "disputed_authority")!;
      expect(disputed.message).toContain("TestChild");
    });

    it("should include decision area with underscores replaced by spaces", () => {
      const records = [
        makeRecord({
          id: "1", agreement_status: "disputed",
          decision_area: "medical_routine",
        }),
      ];
      const alerts = identifyDelegatedAuthorityAlerts(records, 5);
      const disputed = alerts.find((a) => a.type === "disputed_authority")!;
      expect(disputed.message).toContain("medical routine");
    });

    it("should NOT trigger for non-disputed records", () => {
      const records = [
        makeRecord({ id: "1", agreement_status: "agreed" }),
        makeRecord({ id: "2", agreement_status: "pending" }),
        makeRecord({ id: "3", agreement_status: "expired" }),
      ];
      const alerts = identifyDelegatedAuthorityAlerts(records, 5);
      const disputed = alerts.filter((a) => a.type === "disputed_authority");
      expect(disputed).toHaveLength(0);
    });

    it("should handle single-word decision areas without underscores", () => {
      const records = [
        makeRecord({
          id: "1", agreement_status: "disputed",
          decision_area: "sleepovers",
        }),
      ];
      const alerts = identifyDelegatedAuthorityAlerts(records, 5);
      const disputed = alerts.find((a) => a.type === "disputed_authority")!;
      expect(disputed.message).toContain("sleepovers");
    });
  });

  // ── child_views_missing alert ──────────────────────────────────────────

  describe("child_views_missing alert", () => {
    it("should trigger when >= 3 records without views sought (excluding not_applicable)", () => {
      const records = [
        makeRecord({ id: "1", child_views_sought: false, agreement_status: "agreed" }),
        makeRecord({ id: "2", child_views_sought: false, agreement_status: "agreed" }),
        makeRecord({ id: "3", child_views_sought: false, agreement_status: "pending" }),
      ];
      const alerts = identifyDelegatedAuthorityAlerts(records, 5);
      const views = alerts.find((a) => a.type === "child_views_missing");
      expect(views).toBeDefined();
    });

    it("should have severity = medium", () => {
      const records = [
        makeRecord({ id: "1", child_views_sought: false, agreement_status: "agreed" }),
        makeRecord({ id: "2", child_views_sought: false, agreement_status: "agreed" }),
        makeRecord({ id: "3", child_views_sought: false, agreement_status: "agreed" }),
      ];
      const alerts = identifyDelegatedAuthorityAlerts(records, 5);
      const views = alerts.find((a) => a.type === "child_views_missing")!;
      expect(views.severity).toBe("medium");
    });

    it("should have id = views_missing", () => {
      const records = [
        makeRecord({ id: "1", child_views_sought: false, agreement_status: "agreed" }),
        makeRecord({ id: "2", child_views_sought: false, agreement_status: "agreed" }),
        makeRecord({ id: "3", child_views_sought: false, agreement_status: "agreed" }),
      ];
      const alerts = identifyDelegatedAuthorityAlerts(records, 5);
      const views = alerts.find((a) => a.type === "child_views_missing")!;
      expect(views.id).toBe("views_missing");
    });

    it("should include count in message", () => {
      const records = [
        makeRecord({ id: "1", child_views_sought: false, agreement_status: "agreed" }),
        makeRecord({ id: "2", child_views_sought: false, agreement_status: "agreed" }),
        makeRecord({ id: "3", child_views_sought: false, agreement_status: "agreed" }),
        makeRecord({ id: "4", child_views_sought: false, agreement_status: "agreed" }),
      ];
      const alerts = identifyDelegatedAuthorityAlerts(records, 5);
      const views = alerts.find((a) => a.type === "child_views_missing")!;
      expect(views.message).toContain("4");
    });

    it("should EXCLUDE not_applicable records from the count", () => {
      const records = [
        makeRecord({ id: "1", child_views_sought: false, agreement_status: "not_applicable" }),
        makeRecord({ id: "2", child_views_sought: false, agreement_status: "not_applicable" }),
        makeRecord({ id: "3", child_views_sought: false, agreement_status: "not_applicable" }),
        makeRecord({ id: "4", child_views_sought: false, agreement_status: "not_applicable" }),
      ];
      const alerts = identifyDelegatedAuthorityAlerts(records, 5);
      const views = alerts.find((a) => a.type === "child_views_missing");
      expect(views).toBeUndefined();
    });

    it("should NOT trigger when only 2 records without views", () => {
      const records = [
        makeRecord({ id: "1", child_views_sought: false, agreement_status: "agreed" }),
        makeRecord({ id: "2", child_views_sought: false, agreement_status: "agreed" }),
      ];
      const alerts = identifyDelegatedAuthorityAlerts(records, 5);
      const views = alerts.find((a) => a.type === "child_views_missing");
      expect(views).toBeUndefined();
    });

    it("should NOT trigger when exactly at threshold with some not_applicable", () => {
      // 3 without views but 1 is not_applicable => only 2 count => below threshold
      const records = [
        makeRecord({ id: "1", child_views_sought: false, agreement_status: "agreed" }),
        makeRecord({ id: "2", child_views_sought: false, agreement_status: "agreed" }),
        makeRecord({ id: "3", child_views_sought: false, agreement_status: "not_applicable" }),
      ];
      const alerts = identifyDelegatedAuthorityAlerts(records, 5);
      const views = alerts.find((a) => a.type === "child_views_missing");
      expect(views).toBeUndefined();
    });

    it("should NOT count records where views WERE sought", () => {
      const records = [
        makeRecord({ id: "1", child_views_sought: true, agreement_status: "agreed" }),
        makeRecord({ id: "2", child_views_sought: true, agreement_status: "agreed" }),
        makeRecord({ id: "3", child_views_sought: true, agreement_status: "agreed" }),
      ];
      const alerts = identifyDelegatedAuthorityAlerts(records, 5);
      const views = alerts.find((a) => a.type === "child_views_missing");
      expect(views).toBeUndefined();
    });

    it("should trigger at exactly 3 missing views", () => {
      const records = [
        makeRecord({ id: "1", child_views_sought: false, agreement_status: "agreed" }),
        makeRecord({ id: "2", child_views_sought: false, agreement_status: "pending" }),
        makeRecord({ id: "3", child_views_sought: false, agreement_status: "disputed" }),
      ];
      const alerts = identifyDelegatedAuthorityAlerts(records, 5);
      const views = alerts.find((a) => a.type === "child_views_missing");
      expect(views).toBeDefined();
      expect(views!.message).toContain("3");
    });
  });

  // ── expired_agreements alert ──────────────────────────────────────────

  describe("expired_agreements alert", () => {
    it("should trigger when >= 2 records have expired status", () => {
      const records = [
        makeRecord({ id: "1", agreement_status: "expired" }),
        makeRecord({ id: "2", agreement_status: "expired" }),
      ];
      const alerts = identifyDelegatedAuthorityAlerts(records, 5);
      const exp = alerts.find((a) => a.type === "expired_agreements");
      expect(exp).toBeDefined();
    });

    it("should have severity = high", () => {
      const records = [
        makeRecord({ id: "1", agreement_status: "expired" }),
        makeRecord({ id: "2", agreement_status: "expired" }),
      ];
      const alerts = identifyDelegatedAuthorityAlerts(records, 5);
      const exp = alerts.find((a) => a.type === "expired_agreements")!;
      expect(exp.severity).toBe("high");
    });

    it("should have id = expired_agreements", () => {
      const records = [
        makeRecord({ id: "1", agreement_status: "expired" }),
        makeRecord({ id: "2", agreement_status: "expired" }),
      ];
      const alerts = identifyDelegatedAuthorityAlerts(records, 5);
      const exp = alerts.find((a) => a.type === "expired_agreements")!;
      expect(exp.id).toBe("expired_agreements");
    });

    it("should include count in message", () => {
      const records = [
        makeRecord({ id: "1", agreement_status: "expired" }),
        makeRecord({ id: "2", agreement_status: "expired" }),
        makeRecord({ id: "3", agreement_status: "expired" }),
      ];
      const alerts = identifyDelegatedAuthorityAlerts(records, 5);
      const exp = alerts.find((a) => a.type === "expired_agreements")!;
      expect(exp.message).toContain("3");
    });

    it("should NOT trigger when only 1 record is expired", () => {
      const records = [
        makeRecord({ id: "1", agreement_status: "expired" }),
      ];
      const alerts = identifyDelegatedAuthorityAlerts(records, 5);
      const exp = alerts.find((a) => a.type === "expired_agreements");
      expect(exp).toBeUndefined();
    });

    it("should NOT trigger when no records are expired", () => {
      const records = [
        makeRecord({ id: "1", agreement_status: "agreed" }),
        makeRecord({ id: "2", agreement_status: "pending" }),
      ];
      const alerts = identifyDelegatedAuthorityAlerts(records, 5);
      const exp = alerts.find((a) => a.type === "expired_agreements");
      expect(exp).toBeUndefined();
    });

    it("should trigger at exactly 2 expired", () => {
      const records = [
        makeRecord({ id: "1", agreement_status: "expired" }),
        makeRecord({ id: "2", agreement_status: "expired" }),
      ];
      const alerts = identifyDelegatedAuthorityAlerts(records, 5);
      const exp = alerts.find((a) => a.type === "expired_agreements");
      expect(exp).toBeDefined();
      expect(exp!.message).toContain("2");
    });
  });

  // ── not_documented alert ──────────────────────────────────────────────

  describe("not_documented alert", () => {
    it("should trigger when >= 2 agreed records are not documented", () => {
      const records = [
        makeRecord({ id: "1", agreement_status: "agreed", documented_in_care_plan: false }),
        makeRecord({ id: "2", agreement_status: "agreed", documented_in_care_plan: false }),
      ];
      const alerts = identifyDelegatedAuthorityAlerts(records, 5);
      const notDoc = alerts.find((a) => a.type === "not_documented");
      expect(notDoc).toBeDefined();
    });

    it("should have severity = medium", () => {
      const records = [
        makeRecord({ id: "1", agreement_status: "agreed", documented_in_care_plan: false }),
        makeRecord({ id: "2", agreement_status: "agreed", documented_in_care_plan: false }),
      ];
      const alerts = identifyDelegatedAuthorityAlerts(records, 5);
      const notDoc = alerts.find((a) => a.type === "not_documented")!;
      expect(notDoc.severity).toBe("medium");
    });

    it("should have id = not_documented", () => {
      const records = [
        makeRecord({ id: "1", agreement_status: "agreed", documented_in_care_plan: false }),
        makeRecord({ id: "2", agreement_status: "agreed", documented_in_care_plan: false }),
      ];
      const alerts = identifyDelegatedAuthorityAlerts(records, 5);
      const notDoc = alerts.find((a) => a.type === "not_documented")!;
      expect(notDoc.id).toBe("not_documented");
    });

    it("should include count in message", () => {
      const records = [
        makeRecord({ id: "1", agreement_status: "agreed", documented_in_care_plan: false }),
        makeRecord({ id: "2", agreement_status: "agreed", documented_in_care_plan: false }),
        makeRecord({ id: "3", agreement_status: "agreed", documented_in_care_plan: false }),
      ];
      const alerts = identifyDelegatedAuthorityAlerts(records, 5);
      const notDoc = alerts.find((a) => a.type === "not_documented")!;
      expect(notDoc.message).toContain("3");
    });

    it("should NOT count non-agreed records even if not documented", () => {
      const records = [
        makeRecord({ id: "1", agreement_status: "pending", documented_in_care_plan: false }),
        makeRecord({ id: "2", agreement_status: "pending", documented_in_care_plan: false }),
        makeRecord({ id: "3", agreement_status: "pending", documented_in_care_plan: false }),
      ];
      const alerts = identifyDelegatedAuthorityAlerts(records, 5);
      const notDoc = alerts.find((a) => a.type === "not_documented");
      expect(notDoc).toBeUndefined();
    });

    it("should NOT trigger when only 1 agreed record is not documented", () => {
      const records = [
        makeRecord({ id: "1", agreement_status: "agreed", documented_in_care_plan: false }),
      ];
      const alerts = identifyDelegatedAuthorityAlerts(records, 5);
      const notDoc = alerts.find((a) => a.type === "not_documented");
      expect(notDoc).toBeUndefined();
    });

    it("should NOT count agreed records that ARE documented", () => {
      const records = [
        makeRecord({ id: "1", agreement_status: "agreed", documented_in_care_plan: true }),
        makeRecord({ id: "2", agreement_status: "agreed", documented_in_care_plan: true }),
        makeRecord({ id: "3", agreement_status: "agreed", documented_in_care_plan: true }),
      ];
      const alerts = identifyDelegatedAuthorityAlerts(records, 5);
      const notDoc = alerts.find((a) => a.type === "not_documented");
      expect(notDoc).toBeUndefined();
    });

    it("should NOT count expired records as not documented", () => {
      const records = [
        makeRecord({ id: "1", agreement_status: "expired", documented_in_care_plan: false }),
        makeRecord({ id: "2", agreement_status: "expired", documented_in_care_plan: false }),
        makeRecord({ id: "3", agreement_status: "expired", documented_in_care_plan: false }),
      ];
      const alerts = identifyDelegatedAuthorityAlerts(records, 5);
      const notDoc = alerts.find((a) => a.type === "not_documented");
      expect(notDoc).toBeUndefined();
    });

    it("should trigger at exactly 2 agreed + not documented", () => {
      const records = [
        makeRecord({ id: "1", agreement_status: "agreed", documented_in_care_plan: false }),
        makeRecord({ id: "2", agreement_status: "agreed", documented_in_care_plan: false }),
      ];
      const alerts = identifyDelegatedAuthorityAlerts(records, 5);
      const notDoc = alerts.find((a) => a.type === "not_documented");
      expect(notDoc).toBeDefined();
    });
  });

  // ── Mixed scenarios ───────────────────────────────────────────────────

  describe("mixed scenarios", () => {
    it("should return multiple alert types simultaneously", () => {
      const records = [
        // disputed => disputed_authority alert
        makeRecord({ id: "1", child_id: "c1", agreement_status: "disputed", child_views_sought: false, decision_area: "sleepovers" }),
        // more without views
        makeRecord({ id: "2", child_id: "c1", agreement_status: "agreed", child_views_sought: false, documented_in_care_plan: false }),
        makeRecord({ id: "3", child_id: "c2", agreement_status: "agreed", child_views_sought: false, documented_in_care_plan: false }),
        // expired
        makeRecord({ id: "4", child_id: "c2", agreement_status: "expired", child_views_sought: false }),
        makeRecord({ id: "5", child_id: "c3", agreement_status: "expired", child_views_sought: false }),
      ];
      // totalChildren = 6 => gap of 3
      const alerts = identifyDelegatedAuthorityAlerts(records, 6);

      const types = alerts.map((a) => a.type);
      expect(types).toContain("no_delegation");
      expect(types).toContain("disputed_authority");
      expect(types).toContain("child_views_missing");
      expect(types).toContain("expired_agreements");
      expect(types).toContain("not_documented");
    });

    it("should produce correct alert count in complex scenario", () => {
      const records = [
        makeRecord({ id: "1", child_id: "c1", agreement_status: "disputed", child_views_sought: false }),
        makeRecord({ id: "2", child_id: "c1", agreement_status: "disputed", child_views_sought: false }),
        makeRecord({ id: "3", child_id: "c2", agreement_status: "agreed", child_views_sought: false, documented_in_care_plan: false }),
        makeRecord({ id: "4", child_id: "c2", agreement_status: "agreed", child_views_sought: true, documented_in_care_plan: false }),
        makeRecord({ id: "5", child_id: "c3", agreement_status: "expired", child_views_sought: false }),
        makeRecord({ id: "6", child_id: "c3", agreement_status: "expired", child_views_sought: false }),
      ];
      const alerts = identifyDelegatedAuthorityAlerts(records, 5);

      // no_delegation: 5 - 3 = 2 gap => triggers
      expect(alerts.filter((a) => a.type === "no_delegation")).toHaveLength(1);
      // disputed_authority: 2 disputed records => 2 alerts
      expect(alerts.filter((a) => a.type === "disputed_authority")).toHaveLength(2);
      // child_views_missing: 5 without views (excluding not_applicable) => triggers
      expect(alerts.filter((a) => a.type === "child_views_missing")).toHaveLength(1);
      // expired_agreements: 2 expired => triggers
      expect(alerts.filter((a) => a.type === "expired_agreements")).toHaveLength(1);
      // not_documented: 2 agreed + not documented => triggers
      expect(alerts.filter((a) => a.type === "not_documented")).toHaveLength(1);
    });

    it("should return zero alerts when all records are healthy", () => {
      const records = [
        makeRecord({
          id: "1", child_id: "c1", agreement_status: "agreed",
          child_views_sought: true, documented_in_care_plan: true,
        }),
        makeRecord({
          id: "2", child_id: "c2", agreement_status: "agreed",
          child_views_sought: true, documented_in_care_plan: true,
        }),
        makeRecord({
          id: "3", child_id: "c3", agreement_status: "agreed",
          child_views_sought: true, documented_in_care_plan: true,
        }),
      ];
      const alerts = identifyDelegatedAuthorityAlerts(records, 3);
      expect(alerts).toHaveLength(0);
    });

    it("should handle only no_delegation alert without other alerts", () => {
      const records = [
        makeRecord({
          id: "1", child_id: "c1", agreement_status: "agreed",
          child_views_sought: true, documented_in_care_plan: true,
        }),
      ];
      const alerts = identifyDelegatedAuthorityAlerts(records, 5);
      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe("no_delegation");
    });

    it("should handle only disputed_authority alert", () => {
      const records = [
        makeRecord({
          id: "1", child_id: "c1", agreement_status: "disputed",
          child_views_sought: true, documented_in_care_plan: true,
        }),
      ];
      const alerts = identifyDelegatedAuthorityAlerts(records, 1);
      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe("disputed_authority");
    });

    it("should handle only expired_agreements alert", () => {
      const records = [
        makeRecord({
          id: "1", child_id: "c1", agreement_status: "expired",
          child_views_sought: true,
        }),
        makeRecord({
          id: "2", child_id: "c2", agreement_status: "expired",
          child_views_sought: true,
        }),
      ];
      const alerts = identifyDelegatedAuthorityAlerts(records, 2);
      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe("expired_agreements");
    });

    it("should handle only not_documented alert", () => {
      const records = [
        makeRecord({
          id: "1", child_id: "c1", agreement_status: "agreed",
          child_views_sought: true, documented_in_care_plan: false,
        }),
        makeRecord({
          id: "2", child_id: "c2", agreement_status: "agreed",
          child_views_sought: true, documented_in_care_plan: false,
        }),
      ];
      const alerts = identifyDelegatedAuthorityAlerts(records, 2);
      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe("not_documented");
    });

    it("should handle only child_views_missing alert", () => {
      const records = [
        makeRecord({
          id: "1", child_id: "c1", agreement_status: "agreed",
          child_views_sought: false, documented_in_care_plan: true,
        }),
        makeRecord({
          id: "2", child_id: "c2", agreement_status: "agreed",
          child_views_sought: false, documented_in_care_plan: true,
        }),
        makeRecord({
          id: "3", child_id: "c3", agreement_status: "pending",
          child_views_sought: false, documented_in_care_plan: true,
        }),
      ];
      const alerts = identifyDelegatedAuthorityAlerts(records, 3);
      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe("child_views_missing");
    });
  });

  // ── Alert structure validation ────────────────────────────────────────

  describe("alert structure", () => {
    it("should always include type, severity, message, and id fields", () => {
      const records = [
        makeRecord({ id: "1", agreement_status: "disputed" }),
      ];
      const alerts = identifyDelegatedAuthorityAlerts(records, 5);
      for (const alert of alerts) {
        expect(alert).toHaveProperty("type");
        expect(alert).toHaveProperty("severity");
        expect(alert).toHaveProperty("message");
        expect(alert).toHaveProperty("id");
        expect(typeof alert.type).toBe("string");
        expect(typeof alert.message).toBe("string");
        expect(typeof alert.id).toBe("string");
        expect(["critical", "high", "medium"]).toContain(alert.severity);
      }
    });

    it("should have non-empty messages for all alerts", () => {
      const records = [
        makeRecord({ id: "1", child_id: "c1", agreement_status: "disputed", child_views_sought: false, documented_in_care_plan: false }),
        makeRecord({ id: "2", child_id: "c1", agreement_status: "agreed", child_views_sought: false, documented_in_care_plan: false }),
        makeRecord({ id: "3", child_id: "c2", agreement_status: "agreed", child_views_sought: false, documented_in_care_plan: false }),
        makeRecord({ id: "4", child_id: "c2", agreement_status: "expired" }),
        makeRecord({ id: "5", child_id: "c3", agreement_status: "expired" }),
      ];
      const alerts = identifyDelegatedAuthorityAlerts(records, 6);
      for (const alert of alerts) {
        expect(alert.message.length).toBeGreaterThan(0);
      }
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// makeRecord factory helper
// ══════════════════════════════════════════════════════════════════════════════

describe("makeRecord factory helper", () => {
  it("should produce a valid DelegatedAuthority with defaults", () => {
    const r = makeRecord();
    expect(r.id).toBe("da-1");
    expect(r.home_id).toBe("home-1");
    expect(r.child_name).toBe("Alice Smith");
    expect(r.child_id).toBe("child-1");
    expect(r.decision_area).toBe("sleepovers");
    expect(r.authority_level).toBe("home_staff");
    expect(r.agreement_status).toBe("agreed");
    expect(r.child_views_sought).toBe(true);
    expect(r.social_worker_approved).toBe(true);
    expect(r.documented_in_care_plan).toBe(true);
  });

  it("should allow overriding any field", () => {
    const r = makeRecord({
      id: "custom-id",
      child_name: "Bob Jones",
      decision_area: "dental",
      authority_level: "court_order",
      agreement_status: "disputed",
    });
    expect(r.id).toBe("custom-id");
    expect(r.child_name).toBe("Bob Jones");
    expect(r.decision_area).toBe("dental");
    expect(r.authority_level).toBe("court_order");
    expect(r.agreement_status).toBe("disputed");
  });

  it("should preserve default values for non-overridden fields", () => {
    const r = makeRecord({ id: "x" });
    expect(r.home_id).toBe("home-1");
    expect(r.child_views_sought).toBe(true);
    expect(r.social_worker_approved).toBe(true);
  });

  it("should allow setting nullable fields to null", () => {
    const r = makeRecord({ agreed_by: null, notes: null, specific_conditions: null });
    expect(r.agreed_by).toBeNull();
    expect(r.notes).toBeNull();
    expect(r.specific_conditions).toBeNull();
  });

  it("should allow setting boolean fields", () => {
    const r = makeRecord({
      child_views_sought: false,
      child_agrees: false,
      social_worker_approved: false,
      documented_in_care_plan: false,
    });
    expect(r.child_views_sought).toBe(false);
    expect(r.child_agrees).toBe(false);
    expect(r.social_worker_approved).toBe(false);
    expect(r.documented_in_care_plan).toBe(false);
  });
});
