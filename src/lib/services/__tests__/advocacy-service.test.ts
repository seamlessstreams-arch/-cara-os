// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ADVOCACY & CHILDREN'S RIGHTS SERVICE TESTS
// Pure-function unit tests for advocacy metrics computation,
// alert identification, constant validation, and CRUD fallback behaviour
// (Supabase disabled). CHR 2015 Reg 7 (quality of care),
// Reg 14 (care planning), Reg 45 (review of quality),
// Children Act 1989 s26 (advocacy).
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  _testing,
  REFERRAL_REASONS,
  REFERRAL_STATUSES,
  ADVOCATE_SERVICES,
  CHILDRENS_RIGHTS,
  listReferrals,
  createReferral,
  updateReferral,
  listRightsRecords,
  createRightsRecord,
  updateRightsRecord,
} from "../advocacy-service";

import type {
  AdvocacyReferral,
  ChildrensRightsRecord,
} from "../advocacy-service";

const {
  computeAdvocacyMetrics,
  identifyAdvocacyAlerts,
} = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Date string N days ago from now. */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

/** Date string N days in the future from now. */
function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

/** ISO datetime string N days ago. */
function daysAgoISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

/** Build a minimal AdvocacyReferral with sensible defaults. */
function makeReferral(
  overrides: Partial<AdvocacyReferral> = {},
): AdvocacyReferral {
  return {
    id: "ref-1",
    home_id: "home-1",
    child_id: "child-1",
    child_name: "Alice Smith",
    referral_date: daysAgo(5),
    referral_reason: "child_request",
    advocate_service: "nyas",
    advocate_name: null,
    advocate_contact: null,
    status: "referred",
    allocated_date: null,
    first_visit_date: null,
    last_contact_date: null,
    outcome: null,
    outcome_date: null,
    child_satisfied: null,
    notes: null,
    created_at: daysAgoISO(5),
    updated_at: daysAgoISO(5),
    ...overrides,
  };
}

/** Build a minimal ChildrensRightsRecord with sensible defaults. */
function makeRightsRecord(
  overrides: Partial<ChildrensRightsRecord> = {},
): ChildrensRightsRecord {
  return {
    id: "rr-1",
    home_id: "home-1",
    child_id: "child-1",
    child_name: "Alice Smith",
    record_date: daysAgo(10),
    recorded_by: "staff-1",
    right_type: "complaint_process",
    child_informed: true,
    child_understands: true,
    child_exercised: false,
    support_provided: null,
    barriers_identified: null,
    actions_taken: null,
    review_date: null,
    notes: null,
    created_at: daysAgoISO(10),
    updated_at: daysAgoISO(10),
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

describe("REFERRAL_REASONS", () => {
  it("has exactly 9 reasons", () => {
    expect(REFERRAL_REASONS).toHaveLength(9);
  });

  it("contains unique reason values", () => {
    const reasons = REFERRAL_REASONS.map((r) => r.reason);
    expect(new Set(reasons).size).toBe(reasons.length);
  });

  it("contains unique label values", () => {
    const labels = REFERRAL_REASONS.map((r) => r.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes lac_review", () => {
    expect(REFERRAL_REASONS.find((r) => r.reason === "lac_review")).toBeDefined();
  });

  it("includes complaint", () => {
    expect(REFERRAL_REASONS.find((r) => r.reason === "complaint")).toBeDefined();
  });

  it("includes care_plan_disagreement", () => {
    expect(REFERRAL_REASONS.find((r) => r.reason === "care_plan_disagreement")).toBeDefined();
  });

  it("includes placement_change", () => {
    expect(REFERRAL_REASONS.find((r) => r.reason === "placement_change")).toBeDefined();
  });

  it("includes child_request", () => {
    expect(REFERRAL_REASONS.find((r) => r.reason === "child_request")).toBeDefined();
  });

  it("includes safeguarding", () => {
    expect(REFERRAL_REASONS.find((r) => r.reason === "safeguarding")).toBeDefined();
  });

  it("includes restraint_incident", () => {
    expect(REFERRAL_REASONS.find((r) => r.reason === "restraint_incident")).toBeDefined();
  });

  it("includes rights_concern", () => {
    expect(REFERRAL_REASONS.find((r) => r.reason === "rights_concern")).toBeDefined();
  });

  it("includes other", () => {
    expect(REFERRAL_REASONS.find((r) => r.reason === "other")).toBeDefined();
  });

  it("every entry has both reason and label", () => {
    for (const entry of REFERRAL_REASONS) {
      expect(entry.reason).toBeTruthy();
      expect(entry.label).toBeTruthy();
    }
  });
});

describe("REFERRAL_STATUSES", () => {
  it("has exactly 6 statuses", () => {
    expect(REFERRAL_STATUSES).toHaveLength(6);
  });

  it("contains unique status values", () => {
    const statuses = REFERRAL_STATUSES.map((s) => s.status);
    expect(new Set(statuses).size).toBe(statuses.length);
  });

  it("contains unique label values", () => {
    const labels = REFERRAL_STATUSES.map((s) => s.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes referred", () => {
    expect(REFERRAL_STATUSES.find((s) => s.status === "referred")).toBeDefined();
  });

  it("includes allocated", () => {
    expect(REFERRAL_STATUSES.find((s) => s.status === "allocated")).toBeDefined();
  });

  it("includes active", () => {
    expect(REFERRAL_STATUSES.find((s) => s.status === "active")).toBeDefined();
  });

  it("includes completed", () => {
    expect(REFERRAL_STATUSES.find((s) => s.status === "completed")).toBeDefined();
  });

  it("includes declined", () => {
    expect(REFERRAL_STATUSES.find((s) => s.status === "declined")).toBeDefined();
  });

  it("includes withdrawn", () => {
    expect(REFERRAL_STATUSES.find((s) => s.status === "withdrawn")).toBeDefined();
  });

  it("every entry has both status and label", () => {
    for (const entry of REFERRAL_STATUSES) {
      expect(entry.status).toBeTruthy();
      expect(entry.label).toBeTruthy();
    }
  });
});

describe("ADVOCATE_SERVICES", () => {
  it("has exactly 6 services", () => {
    expect(ADVOCATE_SERVICES).toHaveLength(6);
  });

  it("contains unique service values", () => {
    const services = ADVOCATE_SERVICES.map((s) => s.service);
    expect(new Set(services).size).toBe(services.length);
  });

  it("contains unique label values", () => {
    const labels = ADVOCATE_SERVICES.map((s) => s.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes nyas", () => {
    expect(ADVOCATE_SERVICES.find((s) => s.service === "nyas")).toBeDefined();
  });

  it("includes coram_voice", () => {
    expect(ADVOCATE_SERVICES.find((s) => s.service === "coram_voice")).toBeDefined();
  });

  it("includes barnardos", () => {
    expect(ADVOCATE_SERVICES.find((s) => s.service === "barnardos")).toBeDefined();
  });

  it("includes the_childrens_society", () => {
    expect(ADVOCATE_SERVICES.find((s) => s.service === "the_childrens_society")).toBeDefined();
  });

  it("includes local_authority_advocacy", () => {
    expect(ADVOCATE_SERVICES.find((s) => s.service === "local_authority_advocacy")).toBeDefined();
  });

  it("includes other", () => {
    expect(ADVOCATE_SERVICES.find((s) => s.service === "other")).toBeDefined();
  });

  it("every entry has both service and label", () => {
    for (const entry of ADVOCATE_SERVICES) {
      expect(entry.service).toBeTruthy();
      expect(entry.label).toBeTruthy();
    }
  });
});

describe("CHILDRENS_RIGHTS", () => {
  it("has exactly 14 rights", () => {
    expect(CHILDRENS_RIGHTS).toHaveLength(14);
  });

  it("contains unique right values", () => {
    const rights = CHILDRENS_RIGHTS.map((r) => r.right);
    expect(new Set(rights).size).toBe(rights.length);
  });

  it("contains unique label values", () => {
    const labels = CHILDRENS_RIGHTS.map((r) => r.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes complaint_process", () => {
    expect(CHILDRENS_RIGHTS.find((r) => r.right === "complaint_process")).toBeDefined();
  });

  it("includes advocacy_access", () => {
    expect(CHILDRENS_RIGHTS.find((r) => r.right === "advocacy_access")).toBeDefined();
  });

  it("includes lac_review_participation", () => {
    expect(CHILDRENS_RIGHTS.find((r) => r.right === "lac_review_participation")).toBeDefined();
  });

  it("includes care_plan_input", () => {
    expect(CHILDRENS_RIGHTS.find((r) => r.right === "care_plan_input")).toBeDefined();
  });

  it("includes contact_arrangements", () => {
    expect(CHILDRENS_RIGHTS.find((r) => r.right === "contact_arrangements")).toBeDefined();
  });

  it("includes privacy", () => {
    expect(CHILDRENS_RIGHTS.find((r) => r.right === "privacy")).toBeDefined();
  });

  it("includes cultural_identity", () => {
    expect(CHILDRENS_RIGHTS.find((r) => r.right === "cultural_identity")).toBeDefined();
  });

  it("includes education_choice", () => {
    expect(CHILDRENS_RIGHTS.find((r) => r.right === "education_choice")).toBeDefined();
  });

  it("includes health_decisions", () => {
    expect(CHILDRENS_RIGHTS.find((r) => r.right === "health_decisions")).toBeDefined();
  });

  it("includes recreation", () => {
    expect(CHILDRENS_RIGHTS.find((r) => r.right === "recreation")).toBeDefined();
  });

  it("includes religious_practice", () => {
    expect(CHILDRENS_RIGHTS.find((r) => r.right === "religious_practice")).toBeDefined();
  });

  it("includes independent_visitor", () => {
    expect(CHILDRENS_RIGHTS.find((r) => r.right === "independent_visitor")).toBeDefined();
  });

  it("includes irp_access", () => {
    expect(CHILDRENS_RIGHTS.find((r) => r.right === "irp_access")).toBeDefined();
  });

  it("includes ofsted_contact", () => {
    expect(CHILDRENS_RIGHTS.find((r) => r.right === "ofsted_contact")).toBeDefined();
  });

  it("every entry has both right and label", () => {
    for (const entry of CHILDRENS_RIGHTS) {
      expect(entry.right).toBeTruthy();
      expect(entry.label).toBeTruthy();
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// computeAdvocacyMetrics
// ═══════════════════════════════════════════════════════════════════════════

describe("computeAdvocacyMetrics", () => {
  it("returns zeroed metrics for empty inputs", () => {
    const result = computeAdvocacyMetrics([], []);
    expect(result.total_referrals).toBe(0);
    expect(result.active_referrals).toBe(0);
    expect(result.avg_days_to_allocation).toBe(0);
    expect(result.children_with_advocates).toBe(0);
    expect(result.by_reason).toEqual({});
    expect(result.by_status).toEqual({});
    expect(result.rights_awareness_rate).toBe(0);
    expect(result.rights_exercise_rate).toBe(0);
    expect(result.children_with_rights_records).toBe(0);
  });

  it("counts total referrals correctly", () => {
    const referrals = [
      makeReferral({ id: "r1" }),
      makeReferral({ id: "r2" }),
      makeReferral({ id: "r3" }),
    ];
    const result = computeAdvocacyMetrics(referrals, []);
    expect(result.total_referrals).toBe(3);
  });

  it("counts single referral correctly", () => {
    const referrals = [makeReferral({ id: "r1" })];
    const result = computeAdvocacyMetrics(referrals, []);
    expect(result.total_referrals).toBe(1);
  });

  // ── Active referrals ──────────────────────────────────────────────────

  it("counts referred status as active", () => {
    const referrals = [makeReferral({ id: "r1", status: "referred" })];
    const result = computeAdvocacyMetrics(referrals, []);
    expect(result.active_referrals).toBe(1);
  });

  it("counts allocated status as active", () => {
    const referrals = [makeReferral({ id: "r1", status: "allocated" })];
    const result = computeAdvocacyMetrics(referrals, []);
    expect(result.active_referrals).toBe(1);
  });

  it("counts active status as active", () => {
    const referrals = [makeReferral({ id: "r1", status: "active" })];
    const result = computeAdvocacyMetrics(referrals, []);
    expect(result.active_referrals).toBe(1);
  });

  it("does not count completed status as active", () => {
    const referrals = [makeReferral({ id: "r1", status: "completed" })];
    const result = computeAdvocacyMetrics(referrals, []);
    expect(result.active_referrals).toBe(0);
  });

  it("does not count declined status as active", () => {
    const referrals = [makeReferral({ id: "r1", status: "declined" })];
    const result = computeAdvocacyMetrics(referrals, []);
    expect(result.active_referrals).toBe(0);
  });

  it("does not count withdrawn status as active", () => {
    const referrals = [makeReferral({ id: "r1", status: "withdrawn" })];
    const result = computeAdvocacyMetrics(referrals, []);
    expect(result.active_referrals).toBe(0);
  });

  it("counts multiple active referrals across different active statuses", () => {
    const referrals = [
      makeReferral({ id: "r1", status: "referred" }),
      makeReferral({ id: "r2", status: "allocated" }),
      makeReferral({ id: "r3", status: "active" }),
      makeReferral({ id: "r4", status: "completed" }),
      makeReferral({ id: "r5", status: "declined" }),
      makeReferral({ id: "r6", status: "withdrawn" }),
    ];
    const result = computeAdvocacyMetrics(referrals, []);
    expect(result.active_referrals).toBe(3);
  });

  // ── Children with advocates ───────────────────────────────────────────

  it("counts children with allocated referrals as having advocates", () => {
    const referrals = [makeReferral({ id: "r1", child_id: "c1", status: "allocated" })];
    const result = computeAdvocacyMetrics(referrals, []);
    expect(result.children_with_advocates).toBe(1);
  });

  it("counts children with active referrals as having advocates", () => {
    const referrals = [makeReferral({ id: "r1", child_id: "c1", status: "active" })];
    const result = computeAdvocacyMetrics(referrals, []);
    expect(result.children_with_advocates).toBe(1);
  });

  it("does not count children with only referred status as having advocates", () => {
    const referrals = [makeReferral({ id: "r1", child_id: "c1", status: "referred" })];
    const result = computeAdvocacyMetrics(referrals, []);
    expect(result.children_with_advocates).toBe(0);
  });

  it("does not count children with completed status as having advocates", () => {
    const referrals = [makeReferral({ id: "r1", child_id: "c1", status: "completed" })];
    const result = computeAdvocacyMetrics(referrals, []);
    expect(result.children_with_advocates).toBe(0);
  });

  it("deduplicates children with multiple active referrals", () => {
    const referrals = [
      makeReferral({ id: "r1", child_id: "c1", status: "allocated" }),
      makeReferral({ id: "r2", child_id: "c1", status: "active" }),
    ];
    const result = computeAdvocacyMetrics(referrals, []);
    expect(result.children_with_advocates).toBe(1);
  });

  it("counts distinct children with advocates", () => {
    const referrals = [
      makeReferral({ id: "r1", child_id: "c1", status: "allocated" }),
      makeReferral({ id: "r2", child_id: "c2", status: "active" }),
      makeReferral({ id: "r3", child_id: "c3", status: "completed" }),
    ];
    const result = computeAdvocacyMetrics(referrals, []);
    expect(result.children_with_advocates).toBe(2);
  });

  // ── By reason ─────────────────────────────────────────────────────────

  it("groups referrals by reason", () => {
    const referrals = [
      makeReferral({ id: "r1", referral_reason: "child_request" }),
      makeReferral({ id: "r2", referral_reason: "child_request" }),
      makeReferral({ id: "r3", referral_reason: "complaint" }),
      makeReferral({ id: "r4", referral_reason: "safeguarding" }),
    ];
    const result = computeAdvocacyMetrics(referrals, []);
    expect(result.by_reason).toEqual({
      child_request: 2,
      complaint: 1,
      safeguarding: 1,
    });
  });

  it("returns empty by_reason for no referrals", () => {
    const result = computeAdvocacyMetrics([], []);
    expect(result.by_reason).toEqual({});
  });

  it("handles single reason across all referrals", () => {
    const referrals = [
      makeReferral({ id: "r1", referral_reason: "lac_review" }),
      makeReferral({ id: "r2", referral_reason: "lac_review" }),
    ];
    const result = computeAdvocacyMetrics(referrals, []);
    expect(result.by_reason).toEqual({ lac_review: 2 });
  });

  // ── By status ─────────────────────────────────────────────────────────

  it("groups referrals by status", () => {
    const referrals = [
      makeReferral({ id: "r1", status: "referred" }),
      makeReferral({ id: "r2", status: "referred" }),
      makeReferral({ id: "r3", status: "active" }),
      makeReferral({ id: "r4", status: "completed" }),
      makeReferral({ id: "r5", status: "declined" }),
    ];
    const result = computeAdvocacyMetrics(referrals, []);
    expect(result.by_status).toEqual({
      referred: 2,
      active: 1,
      completed: 1,
      declined: 1,
    });
  });

  it("returns empty by_status for no referrals", () => {
    const result = computeAdvocacyMetrics([], []);
    expect(result.by_status).toEqual({});
  });

  // ── Average days to allocation ────────────────────────────────────────

  it("computes avg_days_to_allocation for referral with allocated_date", () => {
    const referrals = [
      makeReferral({
        id: "r1",
        referral_date: "2026-01-01",
        allocated_date: "2026-01-04",
      }),
    ];
    const result = computeAdvocacyMetrics(referrals, []);
    expect(result.avg_days_to_allocation).toBe(3);
  });

  it("averages allocation days across multiple referrals", () => {
    const referrals = [
      makeReferral({
        id: "r1",
        referral_date: "2026-01-01",
        allocated_date: "2026-01-03",
      }),
      makeReferral({
        id: "r2",
        referral_date: "2026-02-01",
        allocated_date: "2026-02-08",
      }),
    ];
    const result = computeAdvocacyMetrics(referrals, []);
    // (2 + 7) / 2 = 4.5
    expect(result.avg_days_to_allocation).toBe(4.5);
  });

  it("returns 0 avg_days_to_allocation when no referrals have allocated_date", () => {
    const referrals = [
      makeReferral({ id: "r1", allocated_date: null }),
      makeReferral({ id: "r2", allocated_date: null }),
    ];
    const result = computeAdvocacyMetrics(referrals, []);
    expect(result.avg_days_to_allocation).toBe(0);
  });

  it("ignores referrals without allocated_date in average calculation", () => {
    const referrals = [
      makeReferral({
        id: "r1",
        referral_date: "2026-01-01",
        allocated_date: "2026-01-11",
      }),
      makeReferral({ id: "r2", allocated_date: null }),
    ];
    const result = computeAdvocacyMetrics(referrals, []);
    expect(result.avg_days_to_allocation).toBe(10);
  });

  it("rounds avg_days_to_allocation to one decimal place", () => {
    const referrals = [
      makeReferral({
        id: "r1",
        referral_date: "2026-01-01",
        allocated_date: "2026-01-04",
      }),
      makeReferral({
        id: "r2",
        referral_date: "2026-02-01",
        allocated_date: "2026-02-05",
      }),
    ];
    const result = computeAdvocacyMetrics(referrals, []);
    // (3 + 4) / 2 = 3.5
    expect(result.avg_days_to_allocation).toBe(3.5);
  });

  it("returns 0 avg_days_to_allocation for empty referrals", () => {
    const result = computeAdvocacyMetrics([], []);
    expect(result.avg_days_to_allocation).toBe(0);
  });

  // ── Rights awareness rate ─────────────────────────────────────────────

  it("computes 100% rights awareness rate when all children informed", () => {
    const records = [
      makeRightsRecord({ id: "rr-1", child_informed: true }),
      makeRightsRecord({ id: "rr-2", child_informed: true }),
    ];
    const result = computeAdvocacyMetrics([], records);
    expect(result.rights_awareness_rate).toBe(100);
  });

  it("computes 0% rights awareness rate when no children informed", () => {
    const records = [
      makeRightsRecord({ id: "rr-1", child_informed: false }),
      makeRightsRecord({ id: "rr-2", child_informed: false }),
    ];
    const result = computeAdvocacyMetrics([], records);
    expect(result.rights_awareness_rate).toBe(0);
  });

  it("computes 50% rights awareness rate for mixed informed status", () => {
    const records = [
      makeRightsRecord({ id: "rr-1", child_informed: true }),
      makeRightsRecord({ id: "rr-2", child_informed: false }),
    ];
    const result = computeAdvocacyMetrics([], records);
    expect(result.rights_awareness_rate).toBe(50);
  });

  it("returns 0 rights awareness rate with no records", () => {
    const result = computeAdvocacyMetrics([], []);
    expect(result.rights_awareness_rate).toBe(0);
  });

  it("rounds rights awareness rate to one decimal place", () => {
    const records = [
      makeRightsRecord({ id: "rr-1", child_informed: true }),
      makeRightsRecord({ id: "rr-2", child_informed: true }),
      makeRightsRecord({ id: "rr-3", child_informed: false }),
    ];
    const result = computeAdvocacyMetrics([], records);
    // 2/3 = 66.666... -> 66.7
    expect(result.rights_awareness_rate).toBe(66.7);
  });

  // ── Rights exercise rate ──────────────────────────────────────────────

  it("computes 100% rights exercise rate when all children exercised", () => {
    const records = [
      makeRightsRecord({ id: "rr-1", child_exercised: true }),
      makeRightsRecord({ id: "rr-2", child_exercised: true }),
    ];
    const result = computeAdvocacyMetrics([], records);
    expect(result.rights_exercise_rate).toBe(100);
  });

  it("computes 0% rights exercise rate when no children exercised", () => {
    const records = [
      makeRightsRecord({ id: "rr-1", child_exercised: false }),
      makeRightsRecord({ id: "rr-2", child_exercised: false }),
    ];
    const result = computeAdvocacyMetrics([], records);
    expect(result.rights_exercise_rate).toBe(0);
  });

  it("computes correct exercise rate for mixed status", () => {
    const records = [
      makeRightsRecord({ id: "rr-1", child_exercised: true }),
      makeRightsRecord({ id: "rr-2", child_exercised: false }),
      makeRightsRecord({ id: "rr-3", child_exercised: false }),
    ];
    const result = computeAdvocacyMetrics([], records);
    // 1/3 = 33.333... -> 33.3
    expect(result.rights_exercise_rate).toBe(33.3);
  });

  it("returns 0 rights exercise rate with no records", () => {
    const result = computeAdvocacyMetrics([], []);
    expect(result.rights_exercise_rate).toBe(0);
  });

  // ── Children with rights records ──────────────────────────────────────

  it("counts distinct children with rights records", () => {
    const records = [
      makeRightsRecord({ id: "rr-1", child_id: "c1" }),
      makeRightsRecord({ id: "rr-2", child_id: "c2" }),
      makeRightsRecord({ id: "rr-3", child_id: "c3" }),
    ];
    const result = computeAdvocacyMetrics([], records);
    expect(result.children_with_rights_records).toBe(3);
  });

  it("deduplicates children with multiple rights records", () => {
    const records = [
      makeRightsRecord({ id: "rr-1", child_id: "c1", right_type: "complaint_process" }),
      makeRightsRecord({ id: "rr-2", child_id: "c1", right_type: "advocacy_access" }),
      makeRightsRecord({ id: "rr-3", child_id: "c2", right_type: "privacy" }),
    ];
    const result = computeAdvocacyMetrics([], records);
    expect(result.children_with_rights_records).toBe(2);
  });

  it("returns 0 children with rights records when no records", () => {
    const result = computeAdvocacyMetrics([], []);
    expect(result.children_with_rights_records).toBe(0);
  });

  // ── Combined scenarios ────────────────────────────────────────────────

  it("handles mixed referrals and rights records together", () => {
    const referrals = [
      makeReferral({ id: "r1", child_id: "c1", status: "active", referral_reason: "complaint", referral_date: "2026-01-01", allocated_date: "2026-01-06" }),
      makeReferral({ id: "r2", child_id: "c2", status: "referred", referral_reason: "child_request" }),
      makeReferral({ id: "r3", child_id: "c3", status: "completed", referral_reason: "complaint" }),
    ];
    const records = [
      makeRightsRecord({ id: "rr-1", child_id: "c1", child_informed: true, child_exercised: true }),
      makeRightsRecord({ id: "rr-2", child_id: "c2", child_informed: true, child_exercised: false }),
      makeRightsRecord({ id: "rr-3", child_id: "c3", child_informed: false, child_exercised: false }),
    ];
    const result = computeAdvocacyMetrics(referrals, records);
    expect(result.total_referrals).toBe(3);
    expect(result.active_referrals).toBe(2);
    expect(result.children_with_advocates).toBe(1);
    expect(result.by_reason).toEqual({ complaint: 2, child_request: 1 });
    expect(result.by_status).toEqual({ active: 1, referred: 1, completed: 1 });
    expect(result.avg_days_to_allocation).toBe(5);
    expect(result.rights_awareness_rate).toBe(66.7);
    expect(result.rights_exercise_rate).toBe(33.3);
    expect(result.children_with_rights_records).toBe(3);
  });

  it("handles referrals with zero-day allocation", () => {
    const referrals = [
      makeReferral({
        id: "r1",
        referral_date: "2026-03-01",
        allocated_date: "2026-03-01",
      }),
    ];
    const result = computeAdvocacyMetrics(referrals, []);
    expect(result.avg_days_to_allocation).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// identifyAdvocacyAlerts
// ═══════════════════════════════════════════════════════════════════════════

describe("identifyAdvocacyAlerts", () => {
  it("returns empty array for empty inputs", () => {
    const alerts = identifyAdvocacyAlerts([], []);
    expect(alerts).toHaveLength(0);
  });

  // ── Unallocated referral alerts ───────────────────────────────────────

  describe("unallocated referral alerts", () => {
    it("generates high alert for referral unallocated > 5 days", () => {
      const now = new Date();
      const referrals = [
        makeReferral({ id: "r1", status: "referred", allocated_date: null, referral_date: daysAgo(7) }),
      ];
      const alerts = identifyAdvocacyAlerts(referrals, [], now);
      const unalloc = alerts.filter((a) => a.category === "unallocated_referral");
      expect(unalloc).toHaveLength(1);
      expect(unalloc[0].severity).toBe("high");
      expect(unalloc[0].related_id).toBe("r1");
      expect(unalloc[0].related_type).toBe("referral");
    });

    it("does not flag referral unallocated <= 5 days", () => {
      const now = new Date();
      const referrals = [
        makeReferral({ id: "r1", status: "referred", allocated_date: null, referral_date: daysAgo(3) }),
      ];
      const alerts = identifyAdvocacyAlerts(referrals, [], now);
      const unalloc = alerts.filter((a) => a.category === "unallocated_referral");
      expect(unalloc).toHaveLength(0);
    });

    it("does not flag referral with allocated_date", () => {
      const now = new Date();
      const referrals = [
        makeReferral({ id: "r1", status: "referred", allocated_date: daysAgo(1), referral_date: daysAgo(10) }),
      ];
      const alerts = identifyAdvocacyAlerts(referrals, [], now);
      const unalloc = alerts.filter((a) => a.category === "unallocated_referral");
      expect(unalloc).toHaveLength(0);
    });

    it("does not flag non-referred status even if unallocated", () => {
      const now = new Date();
      const referrals = [
        makeReferral({ id: "r1", status: "allocated", allocated_date: null, referral_date: daysAgo(10) }),
      ];
      const alerts = identifyAdvocacyAlerts(referrals, [], now);
      const unalloc = alerts.filter((a) => a.category === "unallocated_referral");
      expect(unalloc).toHaveLength(0);
    });

    it("includes days elapsed in unallocated message", () => {
      const now = new Date();
      const referrals = [
        makeReferral({ id: "r1", status: "referred", allocated_date: null, referral_date: daysAgo(10) }),
      ];
      const alerts = identifyAdvocacyAlerts(referrals, [], now);
      const unalloc = alerts.find((a) => a.category === "unallocated_referral");
      expect(unalloc?.message).toContain("10 days");
    });

    it("includes child name in unallocated message", () => {
      const now = new Date();
      const referrals = [
        makeReferral({ id: "r1", status: "referred", allocated_date: null, referral_date: daysAgo(10), child_name: "Bob Jones" }),
      ];
      const alerts = identifyAdvocacyAlerts(referrals, [], now);
      const unalloc = alerts.find((a) => a.category === "unallocated_referral");
      expect(unalloc?.message).toContain("Bob Jones");
    });

    it("flags multiple unallocated referrals", () => {
      const now = new Date();
      const referrals = [
        makeReferral({ id: "r1", status: "referred", allocated_date: null, referral_date: daysAgo(8) }),
        makeReferral({ id: "r2", status: "referred", allocated_date: null, referral_date: daysAgo(12) }),
      ];
      const alerts = identifyAdvocacyAlerts(referrals, [], now);
      const unalloc = alerts.filter((a) => a.category === "unallocated_referral");
      expect(unalloc).toHaveLength(2);
    });
  });

  // ── No recent contact alerts ──────────────────────────────────────────

  describe("no recent contact alerts", () => {
    it("generates medium alert for active referral with no contact in 30+ days", () => {
      const now = new Date();
      const referrals = [
        makeReferral({ id: "r1", status: "active", last_contact_date: daysAgo(35), referral_date: daysAgo(60) }),
      ];
      const alerts = identifyAdvocacyAlerts(referrals, [], now);
      const noContact = alerts.filter((a) => a.category === "no_recent_contact");
      expect(noContact).toHaveLength(1);
      expect(noContact[0].severity).toBe("medium");
      expect(noContact[0].related_id).toBe("r1");
      expect(noContact[0].related_type).toBe("referral");
    });

    it("generates medium alert for allocated referral with no contact in 30+ days", () => {
      const now = new Date();
      const referrals = [
        makeReferral({ id: "r1", status: "allocated", last_contact_date: daysAgo(40), referral_date: daysAgo(60) }),
      ];
      const alerts = identifyAdvocacyAlerts(referrals, [], now);
      const noContact = alerts.filter((a) => a.category === "no_recent_contact");
      expect(noContact).toHaveLength(1);
      expect(noContact[0].severity).toBe("medium");
    });

    it("uses referral_date as fallback when last_contact_date is null", () => {
      const now = new Date();
      const referrals = [
        makeReferral({ id: "r1", status: "active", last_contact_date: null, referral_date: daysAgo(35) }),
      ];
      const alerts = identifyAdvocacyAlerts(referrals, [], now);
      const noContact = alerts.filter((a) => a.category === "no_recent_contact");
      expect(noContact).toHaveLength(1);
    });

    it("does not flag active referral with recent contact", () => {
      const now = new Date();
      const referrals = [
        makeReferral({ id: "r1", status: "active", last_contact_date: daysAgo(10) }),
      ];
      const alerts = identifyAdvocacyAlerts(referrals, [], now);
      const noContact = alerts.filter((a) => a.category === "no_recent_contact");
      expect(noContact).toHaveLength(0);
    });

    it("does not flag completed referral with no contact in 30+ days", () => {
      const now = new Date();
      const referrals = [
        makeReferral({ id: "r1", status: "completed", last_contact_date: daysAgo(40) }),
      ];
      const alerts = identifyAdvocacyAlerts(referrals, [], now);
      const noContact = alerts.filter((a) => a.category === "no_recent_contact");
      expect(noContact).toHaveLength(0);
    });

    it("does not flag referred status for no contact alert", () => {
      const now = new Date();
      const referrals = [
        makeReferral({ id: "r1", status: "referred", last_contact_date: daysAgo(40) }),
      ];
      const alerts = identifyAdvocacyAlerts(referrals, [], now);
      const noContact = alerts.filter((a) => a.category === "no_recent_contact");
      expect(noContact).toHaveLength(0);
    });

    it("includes child name in no contact message", () => {
      const now = new Date();
      const referrals = [
        makeReferral({ id: "r1", status: "active", last_contact_date: daysAgo(35), child_name: "Charlie Brown", referral_date: daysAgo(60) }),
      ];
      const alerts = identifyAdvocacyAlerts(referrals, [], now);
      const noContact = alerts.find((a) => a.category === "no_recent_contact");
      expect(noContact?.message).toContain("Charlie Brown");
    });

    it("includes days elapsed in no contact message", () => {
      const now = new Date();
      const referrals = [
        makeReferral({ id: "r1", status: "active", last_contact_date: daysAgo(45), referral_date: daysAgo(60) }),
      ];
      const alerts = identifyAdvocacyAlerts(referrals, [], now);
      const noContact = alerts.find((a) => a.category === "no_recent_contact");
      expect(noContact?.message).toContain("45 days");
    });
  });

  // ── Child dissatisfied alerts ─────────────────────────────────────────

  describe("child dissatisfied alerts", () => {
    it("generates high alert for completed referral with dissatisfied child", () => {
      const now = new Date();
      const referrals = [
        makeReferral({ id: "r1", status: "completed", child_satisfied: false }),
      ];
      const alerts = identifyAdvocacyAlerts(referrals, [], now);
      const dissatisfied = alerts.filter((a) => a.category === "child_dissatisfied");
      expect(dissatisfied).toHaveLength(1);
      expect(dissatisfied[0].severity).toBe("high");
      expect(dissatisfied[0].related_id).toBe("r1");
      expect(dissatisfied[0].related_type).toBe("referral");
    });

    it("generates high alert for declined referral with dissatisfied child", () => {
      const now = new Date();
      const referrals = [
        makeReferral({ id: "r1", status: "declined", child_satisfied: false }),
      ];
      const alerts = identifyAdvocacyAlerts(referrals, [], now);
      const dissatisfied = alerts.filter((a) => a.category === "child_dissatisfied");
      expect(dissatisfied).toHaveLength(1);
      expect(dissatisfied[0].severity).toBe("high");
    });

    it("does not flag satisfied child", () => {
      const now = new Date();
      const referrals = [
        makeReferral({ id: "r1", status: "completed", child_satisfied: true }),
      ];
      const alerts = identifyAdvocacyAlerts(referrals, [], now);
      const dissatisfied = alerts.filter((a) => a.category === "child_dissatisfied");
      expect(dissatisfied).toHaveLength(0);
    });

    it("does not flag null child_satisfied", () => {
      const now = new Date();
      const referrals = [
        makeReferral({ id: "r1", status: "completed", child_satisfied: null }),
      ];
      const alerts = identifyAdvocacyAlerts(referrals, [], now);
      const dissatisfied = alerts.filter((a) => a.category === "child_dissatisfied");
      expect(dissatisfied).toHaveLength(0);
    });

    it("does not flag dissatisfied child with active referral", () => {
      const now = new Date();
      const referrals = [
        makeReferral({ id: "r1", status: "active", child_satisfied: false }),
      ];
      const alerts = identifyAdvocacyAlerts(referrals, [], now);
      const dissatisfied = alerts.filter((a) => a.category === "child_dissatisfied");
      expect(dissatisfied).toHaveLength(0);
    });

    it("does not flag dissatisfied child with withdrawn referral", () => {
      const now = new Date();
      const referrals = [
        makeReferral({ id: "r1", status: "withdrawn", child_satisfied: false }),
      ];
      const alerts = identifyAdvocacyAlerts(referrals, [], now);
      const dissatisfied = alerts.filter((a) => a.category === "child_dissatisfied");
      expect(dissatisfied).toHaveLength(0);
    });

    it("includes child name in dissatisfied message", () => {
      const now = new Date();
      const referrals = [
        makeReferral({ id: "r1", status: "completed", child_satisfied: false, child_name: "Daisy May" }),
      ];
      const alerts = identifyAdvocacyAlerts(referrals, [], now);
      const dissatisfied = alerts.find((a) => a.category === "child_dissatisfied");
      expect(dissatisfied?.message).toContain("Daisy May");
    });

    it("mentions Reg 7 in dissatisfied message", () => {
      const now = new Date();
      const referrals = [
        makeReferral({ id: "r1", status: "completed", child_satisfied: false }),
      ];
      const alerts = identifyAdvocacyAlerts(referrals, [], now);
      const dissatisfied = alerts.find((a) => a.category === "child_dissatisfied");
      expect(dissatisfied?.message).toContain("Reg 7");
    });
  });

  // ── Complaint without advocacy alerts ─────────────────────────────────

  describe("complaint without advocacy alerts", () => {
    it("generates medium alert for declined complaint referral with no active replacement", () => {
      const now = new Date();
      const referrals = [
        makeReferral({ id: "r1", child_id: "c1", referral_reason: "complaint", status: "declined", child_name: "Eve Green" }),
      ];
      const alerts = identifyAdvocacyAlerts(referrals, [], now);
      const noAdvocacy = alerts.filter((a) => a.category === "complaint_without_advocacy");
      expect(noAdvocacy).toHaveLength(1);
      expect(noAdvocacy[0].severity).toBe("medium");
      expect(noAdvocacy[0].related_id).toBe("r1");
      expect(noAdvocacy[0].related_type).toBe("referral");
    });

    it("generates medium alert for withdrawn complaint referral with no active replacement", () => {
      const now = new Date();
      const referrals = [
        makeReferral({ id: "r1", child_id: "c1", referral_reason: "complaint", status: "withdrawn" }),
      ];
      const alerts = identifyAdvocacyAlerts(referrals, [], now);
      const noAdvocacy = alerts.filter((a) => a.category === "complaint_without_advocacy");
      expect(noAdvocacy).toHaveLength(1);
      expect(noAdvocacy[0].severity).toBe("medium");
    });

    it("does not flag when child has active complaint advocacy", () => {
      const now = new Date();
      const referrals = [
        makeReferral({ id: "r1", child_id: "c1", referral_reason: "complaint", status: "declined" }),
        makeReferral({ id: "r2", child_id: "c1", referral_reason: "complaint", status: "active" }),
      ];
      const alerts = identifyAdvocacyAlerts(referrals, [], now);
      const noAdvocacy = alerts.filter((a) => a.category === "complaint_without_advocacy");
      expect(noAdvocacy).toHaveLength(0);
    });

    it("does not flag when child has referred complaint advocacy", () => {
      const now = new Date();
      const referrals = [
        makeReferral({ id: "r1", child_id: "c1", referral_reason: "complaint", status: "withdrawn" }),
        makeReferral({ id: "r2", child_id: "c1", referral_reason: "complaint", status: "referred" }),
      ];
      const alerts = identifyAdvocacyAlerts(referrals, [], now);
      const noAdvocacy = alerts.filter((a) => a.category === "complaint_without_advocacy");
      expect(noAdvocacy).toHaveLength(0);
    });

    it("does not flag when child has allocated complaint advocacy", () => {
      const now = new Date();
      const referrals = [
        makeReferral({ id: "r1", child_id: "c1", referral_reason: "complaint", status: "declined" }),
        makeReferral({ id: "r2", child_id: "c1", referral_reason: "complaint", status: "allocated" }),
      ];
      const alerts = identifyAdvocacyAlerts(referrals, [], now);
      const noAdvocacy = alerts.filter((a) => a.category === "complaint_without_advocacy");
      expect(noAdvocacy).toHaveLength(0);
    });

    it("does not flag non-complaint referrals that are declined", () => {
      const now = new Date();
      const referrals = [
        makeReferral({ id: "r1", child_id: "c1", referral_reason: "child_request", status: "declined" }),
      ];
      const alerts = identifyAdvocacyAlerts(referrals, [], now);
      const noAdvocacy = alerts.filter((a) => a.category === "complaint_without_advocacy");
      expect(noAdvocacy).toHaveLength(0);
    });

    it("includes child name in complaint without advocacy message", () => {
      const now = new Date();
      const referrals = [
        makeReferral({ id: "r1", child_id: "c1", referral_reason: "complaint", status: "declined", child_name: "Finn Walsh" }),
      ];
      const alerts = identifyAdvocacyAlerts(referrals, [], now);
      const noAdvocacy = alerts.find((a) => a.category === "complaint_without_advocacy");
      expect(noAdvocacy?.message).toContain("Finn Walsh");
    });
  });

  // ── Key right not informed alerts ─────────────────────────────────────

  describe("key right not informed alerts", () => {
    it("generates high alert when child not informed of complaint_process", () => {
      const now = new Date();
      const records = [
        makeRightsRecord({ id: "rr-1", child_id: "c1", right_type: "advocacy_access", child_informed: true }),
        makeRightsRecord({ id: "rr-2", child_id: "c1", right_type: "lac_review_participation", child_informed: true }),
        makeRightsRecord({ id: "rr-3", child_id: "c1", right_type: "care_plan_input", child_informed: true }),
      ];
      const alerts = identifyAdvocacyAlerts([], records, now);
      const keyRightAlerts = alerts.filter(
        (a) => a.category === "key_right_not_informed" && a.message.includes("Complaint Process"),
      );
      expect(keyRightAlerts).toHaveLength(1);
      expect(keyRightAlerts[0].severity).toBe("high");
      expect(keyRightAlerts[0].related_type).toBe("rights_record");
    });

    it("generates high alert when child not informed of advocacy_access", () => {
      const now = new Date();
      const records = [
        makeRightsRecord({ id: "rr-1", child_id: "c1", right_type: "complaint_process", child_informed: true }),
        makeRightsRecord({ id: "rr-2", child_id: "c1", right_type: "lac_review_participation", child_informed: true }),
        makeRightsRecord({ id: "rr-3", child_id: "c1", right_type: "care_plan_input", child_informed: true }),
      ];
      const alerts = identifyAdvocacyAlerts([], records, now);
      const keyRightAlerts = alerts.filter(
        (a) => a.category === "key_right_not_informed" && a.message.includes("Access to Advocacy"),
      );
      expect(keyRightAlerts).toHaveLength(1);
      expect(keyRightAlerts[0].severity).toBe("high");
    });

    it("generates high alert when child not informed of lac_review_participation", () => {
      const now = new Date();
      const records = [
        makeRightsRecord({ id: "rr-1", child_id: "c1", right_type: "complaint_process", child_informed: true }),
        makeRightsRecord({ id: "rr-2", child_id: "c1", right_type: "advocacy_access", child_informed: true }),
        makeRightsRecord({ id: "rr-3", child_id: "c1", right_type: "care_plan_input", child_informed: true }),
      ];
      const alerts = identifyAdvocacyAlerts([], records, now);
      const keyRightAlerts = alerts.filter(
        (a) => a.category === "key_right_not_informed" && a.message.includes("LAC Review Participation"),
      );
      expect(keyRightAlerts).toHaveLength(1);
    });

    it("generates high alert when child not informed of care_plan_input", () => {
      const now = new Date();
      const records = [
        makeRightsRecord({ id: "rr-1", child_id: "c1", right_type: "complaint_process", child_informed: true }),
        makeRightsRecord({ id: "rr-2", child_id: "c1", right_type: "advocacy_access", child_informed: true }),
        makeRightsRecord({ id: "rr-3", child_id: "c1", right_type: "lac_review_participation", child_informed: true }),
      ];
      const alerts = identifyAdvocacyAlerts([], records, now);
      const keyRightAlerts = alerts.filter(
        (a) => a.category === "key_right_not_informed" && a.message.includes("Care Plan Input"),
      );
      expect(keyRightAlerts).toHaveLength(1);
    });

    it("does not flag when child informed of all key rights", () => {
      const now = new Date();
      const records = [
        makeRightsRecord({ id: "rr-1", child_id: "c1", right_type: "complaint_process", child_informed: true }),
        makeRightsRecord({ id: "rr-2", child_id: "c1", right_type: "advocacy_access", child_informed: true }),
        makeRightsRecord({ id: "rr-3", child_id: "c1", right_type: "lac_review_participation", child_informed: true }),
        makeRightsRecord({ id: "rr-4", child_id: "c1", right_type: "care_plan_input", child_informed: true }),
      ];
      const alerts = identifyAdvocacyAlerts([], records, now);
      const keyRightAlerts = alerts.filter((a) => a.category === "key_right_not_informed");
      expect(keyRightAlerts).toHaveLength(0);
    });

    it("generates alerts for multiple missing key rights", () => {
      const now = new Date();
      const records = [
        makeRightsRecord({ id: "rr-1", child_id: "c1", right_type: "privacy", child_informed: true }),
      ];
      const alerts = identifyAdvocacyAlerts([], records, now);
      const keyRightAlerts = alerts.filter((a) => a.category === "key_right_not_informed");
      // Missing: complaint_process, advocacy_access, lac_review_participation, care_plan_input
      expect(keyRightAlerts).toHaveLength(4);
    });

    it("does not count child_informed: false as informed", () => {
      const now = new Date();
      const records = [
        makeRightsRecord({ id: "rr-1", child_id: "c1", right_type: "complaint_process", child_informed: false }),
        makeRightsRecord({ id: "rr-2", child_id: "c1", right_type: "advocacy_access", child_informed: true }),
        makeRightsRecord({ id: "rr-3", child_id: "c1", right_type: "lac_review_participation", child_informed: true }),
        makeRightsRecord({ id: "rr-4", child_id: "c1", right_type: "care_plan_input", child_informed: true }),
      ];
      const alerts = identifyAdvocacyAlerts([], records, now);
      const keyRightAlerts = alerts.filter(
        (a) => a.category === "key_right_not_informed" && a.message.includes("Complaint Process"),
      );
      expect(keyRightAlerts).toHaveLength(1);
    });

    it("includes child name in key right not informed message", () => {
      const now = new Date();
      const records = [
        makeRightsRecord({ id: "rr-1", child_id: "c1", child_name: "Grace Hill", right_type: "privacy", child_informed: true }),
      ];
      const alerts = identifyAdvocacyAlerts([], records, now);
      const keyRightAlerts = alerts.filter((a) => a.category === "key_right_not_informed");
      for (const alert of keyRightAlerts) {
        expect(alert.message).toContain("Grace Hill");
      }
    });

    it("generates alerts per child independently", () => {
      const now = new Date();
      const records = [
        makeRightsRecord({ id: "rr-1", child_id: "c1", right_type: "privacy", child_informed: true }),
        makeRightsRecord({ id: "rr-2", child_id: "c2", right_type: "recreation", child_informed: true }),
      ];
      const alerts = identifyAdvocacyAlerts([], records, now);
      const keyRightAlerts = alerts.filter((a) => a.category === "key_right_not_informed");
      // Each child missing 4 key rights = 8 alerts
      expect(keyRightAlerts).toHaveLength(8);
    });
  });

  // ── Rights review overdue alerts ──────────────────────────────────────

  describe("rights review overdue alerts", () => {
    it("generates medium alert for rights record not reviewed in 6+ months", () => {
      const now = new Date();
      const records = [
        makeRightsRecord({ id: "rr-1", review_date: daysAgo(200) }),
      ];
      const alerts = identifyAdvocacyAlerts([], records, now);
      const overdue = alerts.filter((a) => a.category === "rights_review_overdue");
      expect(overdue).toHaveLength(1);
      expect(overdue[0].severity).toBe("medium");
      expect(overdue[0].related_id).toBe("rr-1");
      expect(overdue[0].related_type).toBe("rights_record");
    });

    it("does not flag rights record reviewed within 6 months", () => {
      const now = new Date();
      const records = [
        makeRightsRecord({ id: "rr-1", review_date: daysAgo(30) }),
      ];
      const alerts = identifyAdvocacyAlerts([], records, now);
      const overdue = alerts.filter((a) => a.category === "rights_review_overdue");
      expect(overdue).toHaveLength(0);
    });

    it("does not flag rights record with no review_date", () => {
      const now = new Date();
      const records = [
        makeRightsRecord({ id: "rr-1", review_date: null }),
      ];
      const alerts = identifyAdvocacyAlerts([], records, now);
      const overdue = alerts.filter((a) => a.category === "rights_review_overdue");
      expect(overdue).toHaveLength(0);
    });

    it("includes child name in overdue review message", () => {
      const now = new Date();
      const records = [
        makeRightsRecord({ id: "rr-1", child_name: "Hannah Clark", review_date: daysAgo(200) }),
      ];
      const alerts = identifyAdvocacyAlerts([], records, now);
      const overdue = alerts.find((a) => a.category === "rights_review_overdue");
      expect(overdue?.message).toContain("Hannah Clark");
    });

    it("includes right label in overdue review message", () => {
      const now = new Date();
      const records = [
        makeRightsRecord({ id: "rr-1", right_type: "complaint_process", review_date: daysAgo(200) }),
      ];
      const alerts = identifyAdvocacyAlerts([], records, now);
      const overdue = alerts.find((a) => a.category === "rights_review_overdue");
      expect(overdue?.message).toContain("Complaint Process");
    });

    it("mentions Reg 45 in overdue review message", () => {
      const now = new Date();
      const records = [
        makeRightsRecord({ id: "rr-1", review_date: daysAgo(200) }),
      ];
      const alerts = identifyAdvocacyAlerts([], records, now);
      const overdue = alerts.find((a) => a.category === "rights_review_overdue");
      expect(overdue?.message).toContain("Reg 45");
    });

    it("flags multiple overdue rights records", () => {
      const now = new Date();
      const records = [
        makeRightsRecord({ id: "rr-1", review_date: daysAgo(200) }),
        makeRightsRecord({ id: "rr-2", review_date: daysAgo(250) }),
      ];
      const alerts = identifyAdvocacyAlerts([], records, now);
      const overdue = alerts.filter((a) => a.category === "rights_review_overdue");
      expect(overdue).toHaveLength(2);
    });

    it("includes review_date in overdue message", () => {
      const now = new Date();
      const reviewDate = daysAgo(200);
      const records = [
        makeRightsRecord({ id: "rr-1", review_date: reviewDate }),
      ];
      const alerts = identifyAdvocacyAlerts([], records, now);
      const overdue = alerts.find((a) => a.category === "rights_review_overdue");
      expect(overdue?.message).toContain(reviewDate);
    });
  });

  // ── Alert sorting ─────────────────────────────────────────────────────

  describe("alert sorting", () => {
    it("sorts alerts by severity: critical before high before medium before low", () => {
      const now = new Date();
      // Create alerts of different severities:
      // high: unallocated referral
      // medium: no recent contact, rights review overdue
      // high: child dissatisfied
      const referrals = [
        makeReferral({ id: "r1", status: "referred", allocated_date: null, referral_date: daysAgo(10) }),
        makeReferral({ id: "r2", status: "active", last_contact_date: daysAgo(35), referral_date: daysAgo(60) }),
        makeReferral({ id: "r3", status: "completed", child_satisfied: false }),
      ];
      const records = [
        makeRightsRecord({ id: "rr-1", review_date: daysAgo(200), child_id: "c99", right_type: "privacy", child_informed: true }),
      ];
      const alerts = identifyAdvocacyAlerts(referrals, records, now);

      const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      for (let i = 1; i < alerts.length; i++) {
        expect(severityOrder[alerts[i].severity]).toBeGreaterThanOrEqual(
          severityOrder[alerts[i - 1].severity],
        );
      }
    });

    it("high severity alerts appear before medium severity alerts", () => {
      const now = new Date();
      const referrals = [
        makeReferral({ id: "r1", status: "referred", allocated_date: null, referral_date: daysAgo(10) }),
        makeReferral({ id: "r2", status: "active", last_contact_date: daysAgo(35), referral_date: daysAgo(60) }),
      ];
      const alerts = identifyAdvocacyAlerts(referrals, [], now);
      const highIdx = alerts.findIndex((a) => a.severity === "high");
      const mediumIdx = alerts.findIndex((a) => a.severity === "medium");
      if (highIdx !== -1 && mediumIdx !== -1) {
        expect(highIdx).toBeLessThan(mediumIdx);
      }
    });
  });

  // ── Combined / complex scenarios ──────────────────────────────────────

  describe("combined alert scenarios", () => {
    it("generates multiple alert types for a single problematic referral", () => {
      const now = new Date();
      const referrals = [
        makeReferral({
          id: "r1",
          status: "referred",
          allocated_date: null,
          referral_date: daysAgo(10),
          child_id: "c1",
          referral_reason: "complaint",
        }),
      ];
      const alerts = identifyAdvocacyAlerts(referrals, [], now);
      const categories = alerts.map((a) => a.category);
      expect(categories).toContain("unallocated_referral");
    });

    it("generates both referral and rights alerts simultaneously", () => {
      const now = new Date();
      const referrals = [
        makeReferral({ id: "r1", status: "referred", allocated_date: null, referral_date: daysAgo(10) }),
        makeReferral({ id: "r2", status: "completed", child_satisfied: false }),
      ];
      const records = [
        makeRightsRecord({ id: "rr-1", child_id: "c5", right_type: "privacy", child_informed: true, review_date: daysAgo(200) }),
      ];
      const alerts = identifyAdvocacyAlerts(referrals, records, now);
      const categories = alerts.map((a) => a.category);
      expect(categories).toContain("unallocated_referral");
      expect(categories).toContain("child_dissatisfied");
      expect(categories).toContain("rights_review_overdue");
      expect(categories).toContain("key_right_not_informed");
    });

    it("returns no alerts for healthy state", () => {
      const now = new Date();
      const referrals = [
        makeReferral({ id: "r1", status: "completed", child_satisfied: true }),
      ];
      const records = [
        makeRightsRecord({ id: "rr-1", child_id: "c1", right_type: "complaint_process", child_informed: true }),
        makeRightsRecord({ id: "rr-2", child_id: "c1", right_type: "advocacy_access", child_informed: true }),
        makeRightsRecord({ id: "rr-3", child_id: "c1", right_type: "lac_review_participation", child_informed: true }),
        makeRightsRecord({ id: "rr-4", child_id: "c1", right_type: "care_plan_input", child_informed: true }),
      ];
      const alerts = identifyAdvocacyAlerts(referrals, records, now);
      expect(alerts).toHaveLength(0);
    });

    it("handles large mixed dataset correctly", () => {
      const now = new Date();
      const referrals = [
        makeReferral({ id: "r1", status: "referred", allocated_date: null, referral_date: daysAgo(10), child_id: "c1" }),
        makeReferral({ id: "r2", status: "active", last_contact_date: daysAgo(40), referral_date: daysAgo(60), child_id: "c2" }),
        makeReferral({ id: "r3", status: "completed", child_satisfied: false, child_id: "c3" }),
        makeReferral({ id: "r4", status: "declined", child_satisfied: false, child_id: "c4" }),
        makeReferral({ id: "r5", child_id: "c5", referral_reason: "complaint", status: "withdrawn" }),
      ];
      const records = [
        makeRightsRecord({ id: "rr-1", child_id: "c10", right_type: "privacy", child_informed: true, review_date: daysAgo(200) }),
      ];
      const alerts = identifyAdvocacyAlerts(referrals, records, now);
      const categories = alerts.map((a) => a.category);
      expect(categories).toContain("unallocated_referral");
      expect(categories).toContain("no_recent_contact");
      expect(categories).toContain("child_dissatisfied");
      expect(categories).toContain("complaint_without_advocacy");
      expect(categories).toContain("rights_review_overdue");
      expect(categories).toContain("key_right_not_informed");
    });

    it("all alerts have required fields: severity, category, message, related_id, related_type", () => {
      const now = new Date();
      const referrals = [
        makeReferral({ id: "r1", status: "referred", allocated_date: null, referral_date: daysAgo(10) }),
        makeReferral({ id: "r2", status: "completed", child_satisfied: false }),
      ];
      const records = [
        makeRightsRecord({ id: "rr-1", child_id: "c5", right_type: "privacy", child_informed: true, review_date: daysAgo(200) }),
      ];
      const alerts = identifyAdvocacyAlerts(referrals, records, now);
      for (const alert of alerts) {
        expect(alert.severity).toBeTruthy();
        expect(alert.category).toBeTruthy();
        expect(alert.message).toBeTruthy();
        expect(alert.related_id).toBeTruthy();
        expect(alert.related_type).toBeTruthy();
      }
    });

    it("all alert severities are valid values", () => {
      const now = new Date();
      const referrals = [
        makeReferral({ id: "r1", status: "referred", allocated_date: null, referral_date: daysAgo(10) }),
        makeReferral({ id: "r2", status: "active", last_contact_date: daysAgo(40), referral_date: daysAgo(60) }),
      ];
      const records = [
        makeRightsRecord({ id: "rr-1", child_id: "c5", right_type: "privacy", child_informed: true, review_date: daysAgo(200) }),
      ];
      const alerts = identifyAdvocacyAlerts(referrals, records, now);
      const validSeverities = ["critical", "high", "medium", "low"];
      for (const alert of alerts) {
        expect(validSeverities).toContain(alert.severity);
      }
    });

    it("all alert related_type values are valid", () => {
      const now = new Date();
      const referrals = [
        makeReferral({ id: "r1", status: "referred", allocated_date: null, referral_date: daysAgo(10) }),
      ];
      const records = [
        makeRightsRecord({ id: "rr-1", child_id: "c5", right_type: "privacy", child_informed: true, review_date: daysAgo(200) }),
      ];
      const alerts = identifyAdvocacyAlerts(referrals, records, now);
      const validTypes = ["referral", "rights_record"];
      for (const alert of alerts) {
        expect(validTypes).toContain(alert.related_type);
      }
    });

    it("accepts custom now parameter for deterministic testing", () => {
      const fixedNow = new Date("2026-06-01T12:00:00Z");
      const referrals = [
        makeReferral({ id: "r1", status: "referred", allocated_date: null, referral_date: "2026-05-20" }),
      ];
      const alerts = identifyAdvocacyAlerts(referrals, [], fixedNow);
      const unalloc = alerts.filter((a) => a.category === "unallocated_referral");
      // 2026-05-20 to 2026-06-01 = 12 days > 5 days
      expect(unalloc).toHaveLength(1);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CRUD — Advocacy Referrals (Supabase disabled)
// ═══════════════════════════════════════════════════════════════════════════

describe("listReferrals", () => {
  it("returns ok: true with empty data array when Supabase is disabled", async () => {
    const result = await listReferrals("home-1");
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of childId filter", async () => {
    const result = await listReferrals("home-1", { childId: "child-1" });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of status filter", async () => {
    const result = await listReferrals("home-1", { status: "active" });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of referralReason filter", async () => {
    const result = await listReferrals("home-1", { referralReason: "complaint" });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of limit filter", async () => {
    const result = await listReferrals("home-1", { limit: 50 });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of combined filters", async () => {
    const result = await listReferrals("home-1", {
      childId: "child-1",
      status: "referred",
      referralReason: "safeguarding",
      limit: 25,
    });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });
});

describe("createReferral", () => {
  it("returns ok: false with Supabase not configured error", async () => {
    const result = await createReferral({
      homeId: "home-1",
      childId: "child-1",
      childName: "Alice Smith",
      referralReason: "child_request",
      advocateService: "nyas",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });

  it("returns ok: false with Supabase not configured error with all optional fields", async () => {
    const result = await createReferral({
      homeId: "home-1",
      childId: "child-1",
      childName: "Alice Smith",
      referralDate: "2026-05-01",
      referralReason: "complaint",
      advocateService: "coram_voice",
      advocateName: "John Advocate",
      advocateContact: "01onal234567",
      allocatedDate: "2026-05-02",
      firstVisitDate: "2026-05-03",
      lastContactDate: "2026-05-04",
      outcome: "Resolved positively",
      outcomeDate: "2026-05-10",
      childSatisfied: true,
      notes: "Test notes",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });
});

describe("updateReferral", () => {
  it("returns ok: false with Supabase not configured error", async () => {
    const result = await updateReferral("ref-1", { status: "allocated" });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });

  it("returns ok: false with Supabase not configured error with multiple updates", async () => {
    const result = await updateReferral("ref-1", {
      status: "active",
      advocate_name: "Jane Doe",
      last_contact_date: "2026-05-10",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CRUD — Children's Rights Records (Supabase disabled)
// ═══════════════════════════════════════════════════════════════════════════

describe("listRightsRecords", () => {
  it("returns ok: true with empty data array when Supabase is disabled", async () => {
    const result = await listRightsRecords("home-1");
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of childId filter", async () => {
    const result = await listRightsRecords("home-1", { childId: "child-1" });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of rightType filter", async () => {
    const result = await listRightsRecords("home-1", { rightType: "complaint_process" });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of limit filter", async () => {
    const result = await listRightsRecords("home-1", { limit: 25 });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of combined filters", async () => {
    const result = await listRightsRecords("home-1", {
      childId: "child-1",
      rightType: "privacy",
      limit: 10,
    });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });
});

describe("createRightsRecord", () => {
  it("returns ok: false with Supabase not configured error", async () => {
    const result = await createRightsRecord({
      homeId: "home-1",
      childId: "child-1",
      childName: "Alice Smith",
      recordedBy: "staff-1",
      rightType: "complaint_process",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });

  it("returns ok: false with Supabase not configured error with all optional fields", async () => {
    const result = await createRightsRecord({
      homeId: "home-1",
      childId: "child-1",
      childName: "Alice Smith",
      recordDate: "2026-05-01",
      recordedBy: "staff-1",
      rightType: "advocacy_access",
      childInformed: true,
      childUnderstands: true,
      childExercised: true,
      supportProvided: "Explained verbally",
      barriersIdentified: "Language barrier",
      actionsTaken: "Interpreter arranged",
      reviewDate: "2026-11-01",
      notes: "Follow up in 6 months",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });
});

describe("updateRightsRecord", () => {
  it("returns ok: false with Supabase not configured error", async () => {
    const result = await updateRightsRecord("rr-1", { child_informed: true });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });

  it("returns ok: false with Supabase not configured error with multiple updates", async () => {
    const result = await updateRightsRecord("rr-1", {
      child_informed: true,
      child_understands: true,
      child_exercised: true,
      review_date: "2026-11-01",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });
});
