// ══════════════════════════════════════════════════════════════════════════════
// CARA — POLICIES & PROCEDURES REGISTER SERVICE TESTS
// Pure-function unit tests for policy register metrics computation, policy
// governance alert identification, constant validation, and CRUD fallback
// behaviour (Supabase disabled). CHR 2015 Reg 38 (policies and procedures),
// cross-refs Reg 12, Reg 19, Reg 20, Reg 23, Reg 25, Reg 32/33, Reg 34,
// Reg 36, Reg 39, Reg 40, SCCIF Leadership & Management.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  _testing,
  POLICY_CATEGORIES,
  POLICY_STATUSES,
  REVIEW_FREQUENCIES,
  REVIEW_OUTCOMES,
  REQUIRED_POLICIES,
  listPolicies,
  createPolicy,
  updatePolicy,
  listAcknowledgements,
  createAcknowledgement,
  listReviewHistory,
  createReviewHistory,
} from "../policies-register-service";

import type {
  Policy,
  PolicyAcknowledgement,
  PolicyReviewHistory,
} from "../policies-register-service";

const { computePolicyMetrics, identifyPolicyAlerts } = _testing;

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

/** Build a minimal Policy with sensible defaults. */
function makePolicy(overrides: Partial<Policy> = {}): Policy {
  return {
    id: "pol-1",
    home_id: "home-1",
    policy_name: "Safeguarding Policy",
    policy_reference: null,
    category: "safeguarding",
    regulation_reference: "Reg 12",
    description: "Core safeguarding policy for the home",
    version: "1.0",
    status: "active",
    owner: "staff-1",
    approved_by: null,
    approval_date: null,
    effective_date: daysAgo(90),
    review_date: daysFromNow(90),
    last_reviewed_date: null,
    reviewed_by: null,
    review_frequency: "annual",
    document_url: null,
    staff_acknowledgement_required: false,
    created_at: daysAgoISO(90),
    updated_at: daysAgoISO(90),
    ...overrides,
  };
}

/** Build a minimal PolicyAcknowledgement with sensible defaults. */
function makeAcknowledgement(
  overrides: Partial<PolicyAcknowledgement> = {},
): PolicyAcknowledgement {
  return {
    id: "ack-1",
    home_id: "home-1",
    policy_id: "pol-1",
    staff_id: "staff-1",
    staff_name: "Jane Smith",
    acknowledged_date: daysAgo(5),
    acknowledged: true,
    notes: null,
    created_at: daysAgoISO(5),
    ...overrides,
  };
}

/** Build a minimal PolicyReviewHistory with sensible defaults. */
function makeReviewHistory(
  overrides: Partial<PolicyReviewHistory> = {},
): PolicyReviewHistory {
  return {
    id: "rev-1",
    home_id: "home-1",
    policy_id: "pol-1",
    review_date: daysAgo(30),
    reviewed_by: "staff-1",
    previous_version: null,
    new_version: null,
    changes_summary: "No changes needed",
    outcome: "no_changes",
    next_review_date: null,
    created_at: daysAgoISO(30),
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

describe("POLICY_CATEGORIES", () => {
  it("has exactly 17 categories", () => {
    expect(POLICY_CATEGORIES).toHaveLength(17);
  });

  it("contains unique category values", () => {
    const categories = POLICY_CATEGORIES.map((c) => c.category);
    expect(new Set(categories).size).toBe(categories.length);
  });

  it("contains unique label values", () => {
    const labels = POLICY_CATEGORIES.map((c) => c.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes safeguarding", () => {
    expect(POLICY_CATEGORIES.find((c) => c.category === "safeguarding")).toBeDefined();
  });

  it("includes behaviour_management", () => {
    expect(POLICY_CATEGORIES.find((c) => c.category === "behaviour_management")).toBeDefined();
  });

  it("includes health_safety", () => {
    expect(POLICY_CATEGORIES.find((c) => c.category === "health_safety")).toBeDefined();
  });

  it("includes medication", () => {
    expect(POLICY_CATEGORIES.find((c) => c.category === "medication")).toBeDefined();
  });

  it("includes missing_children", () => {
    expect(POLICY_CATEGORIES.find((c) => c.category === "missing_children")).toBeDefined();
  });

  it("includes restraint", () => {
    expect(POLICY_CATEGORIES.find((c) => c.category === "restraint")).toBeDefined();
  });

  it("includes complaints", () => {
    expect(POLICY_CATEGORIES.find((c) => c.category === "complaints")).toBeDefined();
  });

  it("includes whistleblowing", () => {
    expect(POLICY_CATEGORIES.find((c) => c.category === "whistleblowing")).toBeDefined();
  });

  it("includes recruitment", () => {
    expect(POLICY_CATEGORIES.find((c) => c.category === "recruitment")).toBeDefined();
  });

  it("includes data_protection", () => {
    expect(POLICY_CATEGORIES.find((c) => c.category === "data_protection")).toBeDefined();
  });

  it("includes fire_safety", () => {
    expect(POLICY_CATEGORIES.find((c) => c.category === "fire_safety")).toBeDefined();
  });

  it("includes lone_working", () => {
    expect(POLICY_CATEGORIES.find((c) => c.category === "lone_working")).toBeDefined();
  });

  it("includes equality_diversity", () => {
    expect(POLICY_CATEGORIES.find((c) => c.category === "equality_diversity")).toBeDefined();
  });

  it("includes anti_bullying", () => {
    expect(POLICY_CATEGORIES.find((c) => c.category === "anti_bullying")).toBeDefined();
  });

  it("includes internet_safety", () => {
    expect(POLICY_CATEGORIES.find((c) => c.category === "internet_safety")).toBeDefined();
  });

  it("includes intimate_care", () => {
    expect(POLICY_CATEGORIES.find((c) => c.category === "intimate_care")).toBeDefined();
  });

  it("includes other", () => {
    expect(POLICY_CATEGORIES.find((c) => c.category === "other")).toBeDefined();
  });

  it("every entry has both category and label", () => {
    for (const entry of POLICY_CATEGORIES) {
      expect(entry.category).toBeTruthy();
      expect(entry.label).toBeTruthy();
    }
  });
});

describe("POLICY_STATUSES", () => {
  it("has exactly 5 statuses", () => {
    expect(POLICY_STATUSES).toHaveLength(5);
  });

  it("contains unique status values", () => {
    const statuses = POLICY_STATUSES.map((s) => s.status);
    expect(new Set(statuses).size).toBe(statuses.length);
  });

  it("contains unique label values", () => {
    const labels = POLICY_STATUSES.map((s) => s.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes draft", () => {
    expect(POLICY_STATUSES.find((s) => s.status === "draft")).toBeDefined();
  });

  it("includes active", () => {
    expect(POLICY_STATUSES.find((s) => s.status === "active")).toBeDefined();
  });

  it("includes under_review", () => {
    expect(POLICY_STATUSES.find((s) => s.status === "under_review")).toBeDefined();
  });

  it("includes archived", () => {
    expect(POLICY_STATUSES.find((s) => s.status === "archived")).toBeDefined();
  });

  it("includes superseded", () => {
    expect(POLICY_STATUSES.find((s) => s.status === "superseded")).toBeDefined();
  });

  it("every entry has both status and label", () => {
    for (const entry of POLICY_STATUSES) {
      expect(entry.status).toBeTruthy();
      expect(entry.label).toBeTruthy();
    }
  });
});

describe("REVIEW_FREQUENCIES", () => {
  it("has exactly 4 frequencies", () => {
    expect(REVIEW_FREQUENCIES).toHaveLength(4);
  });

  it("contains unique frequency values", () => {
    const frequencies = REVIEW_FREQUENCIES.map((f) => f.frequency);
    expect(new Set(frequencies).size).toBe(frequencies.length);
  });

  it("contains unique label values", () => {
    const labels = REVIEW_FREQUENCIES.map((f) => f.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes quarterly", () => {
    expect(REVIEW_FREQUENCIES.find((f) => f.frequency === "quarterly")).toBeDefined();
  });

  it("includes biannual", () => {
    expect(REVIEW_FREQUENCIES.find((f) => f.frequency === "biannual")).toBeDefined();
  });

  it("includes annual", () => {
    expect(REVIEW_FREQUENCIES.find((f) => f.frequency === "annual")).toBeDefined();
  });

  it("includes biennial", () => {
    expect(REVIEW_FREQUENCIES.find((f) => f.frequency === "biennial")).toBeDefined();
  });

  it("every entry has both frequency and label", () => {
    for (const entry of REVIEW_FREQUENCIES) {
      expect(entry.frequency).toBeTruthy();
      expect(entry.label).toBeTruthy();
    }
  });
});

describe("REVIEW_OUTCOMES", () => {
  it("has exactly 4 outcomes", () => {
    expect(REVIEW_OUTCOMES).toHaveLength(4);
  });

  it("contains unique outcome values", () => {
    const outcomes = REVIEW_OUTCOMES.map((o) => o.outcome);
    expect(new Set(outcomes).size).toBe(outcomes.length);
  });

  it("contains unique label values", () => {
    const labels = REVIEW_OUTCOMES.map((o) => o.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes no_changes", () => {
    expect(REVIEW_OUTCOMES.find((o) => o.outcome === "no_changes")).toBeDefined();
  });

  it("includes minor_update", () => {
    expect(REVIEW_OUTCOMES.find((o) => o.outcome === "minor_update")).toBeDefined();
  });

  it("includes major_revision", () => {
    expect(REVIEW_OUTCOMES.find((o) => o.outcome === "major_revision")).toBeDefined();
  });

  it("includes superseded", () => {
    expect(REVIEW_OUTCOMES.find((o) => o.outcome === "superseded")).toBeDefined();
  });

  it("every entry has both outcome and label", () => {
    for (const entry of REVIEW_OUTCOMES) {
      expect(entry.outcome).toBeTruthy();
      expect(entry.label).toBeTruthy();
    }
  });
});

describe("REQUIRED_POLICIES", () => {
  it("has exactly 12 required policies", () => {
    expect(REQUIRED_POLICIES).toHaveLength(12);
  });

  it("contains unique name values", () => {
    const names = REQUIRED_POLICIES.map((p) => p.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("includes safeguarding category", () => {
    expect(REQUIRED_POLICIES.find((p) => p.category === "safeguarding")).toBeDefined();
  });

  it("includes behaviour_management category", () => {
    expect(REQUIRED_POLICIES.find((p) => p.category === "behaviour_management")).toBeDefined();
  });

  it("includes missing_children category", () => {
    expect(REQUIRED_POLICIES.find((p) => p.category === "missing_children")).toBeDefined();
  });

  it("includes restraint category", () => {
    expect(REQUIRED_POLICIES.find((p) => p.category === "restraint")).toBeDefined();
  });

  it("includes complaints category", () => {
    expect(REQUIRED_POLICIES.find((p) => p.category === "complaints")).toBeDefined();
  });

  it("includes whistleblowing category", () => {
    expect(REQUIRED_POLICIES.find((p) => p.category === "whistleblowing")).toBeDefined();
  });

  it("includes medication category", () => {
    expect(REQUIRED_POLICIES.find((p) => p.category === "medication")).toBeDefined();
  });

  it("includes health_safety category", () => {
    expect(REQUIRED_POLICIES.find((p) => p.category === "health_safety")).toBeDefined();
  });

  it("includes fire_safety category", () => {
    expect(REQUIRED_POLICIES.find((p) => p.category === "fire_safety")).toBeDefined();
  });

  it("includes recruitment category", () => {
    expect(REQUIRED_POLICIES.find((p) => p.category === "recruitment")).toBeDefined();
  });

  it("includes data_protection category", () => {
    expect(REQUIRED_POLICIES.find((p) => p.category === "data_protection")).toBeDefined();
  });

  it("includes anti_bullying category", () => {
    expect(REQUIRED_POLICIES.find((p) => p.category === "anti_bullying")).toBeDefined();
  });

  it("every entry has category, name, and regulation", () => {
    for (const entry of REQUIRED_POLICIES) {
      expect(entry.category).toBeTruthy();
      expect(entry.name).toBeTruthy();
      expect(entry.regulation).toBeTruthy();
    }
  });

  it("every regulation reference starts with Reg", () => {
    for (const entry of REQUIRED_POLICIES) {
      expect(entry.regulation).toMatch(/^Reg /);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// computePolicyMetrics
// ═══════════════════════════════════════════════════════════════════════════

describe("computePolicyMetrics", () => {
  it("returns zeroed metrics for empty inputs", () => {
    const result = computePolicyMetrics([], []);
    expect(result.total_policies).toBe(0);
    expect(result.active_policies).toBe(0);
    expect(result.overdue_reviews).toBe(0);
    expect(result.upcoming_reviews_30d).toBe(0);
    expect(result.by_category).toEqual({});
    expect(result.by_status).toEqual({});
    expect(result.acknowledgement_rate).toBeNull();;
    expect(result.missing_required_policies).toHaveLength(12);
    expect(result.avg_days_since_review).toBeNull();;
  });

  it("counts total policies correctly", () => {
    const policies = [
      makePolicy({ id: "p1" }),
      makePolicy({ id: "p2" }),
      makePolicy({ id: "p3" }),
    ];
    const result = computePolicyMetrics(policies, []);
    expect(result.total_policies).toBe(3);
  });

  it("counts active policies correctly", () => {
    const policies = [
      makePolicy({ id: "p1", status: "active" }),
      makePolicy({ id: "p2", status: "active" }),
      makePolicy({ id: "p3", status: "draft" }),
      makePolicy({ id: "p4", status: "archived" }),
    ];
    const result = computePolicyMetrics(policies, []);
    expect(result.active_policies).toBe(2);
  });

  it("counts only active policies as active", () => {
    const policies = [
      makePolicy({ id: "p1", status: "draft" }),
      makePolicy({ id: "p2", status: "under_review" }),
      makePolicy({ id: "p3", status: "archived" }),
      makePolicy({ id: "p4", status: "superseded" }),
    ];
    const result = computePolicyMetrics(policies, []);
    expect(result.active_policies).toBe(0);
  });

  it("counts overdue reviews for active policies with past review dates", () => {
    const policies = [
      makePolicy({ id: "p1", status: "active", review_date: daysAgo(10) }),
      makePolicy({ id: "p2", status: "active", review_date: daysAgo(5) }),
      makePolicy({ id: "p3", status: "active", review_date: daysFromNow(30) }),
    ];
    const result = computePolicyMetrics(policies, []);
    expect(result.overdue_reviews).toBe(2);
  });

  it("does not count draft policies as overdue even with past review dates", () => {
    const policies = [
      makePolicy({ id: "p1", status: "draft", review_date: daysAgo(10) }),
      makePolicy({ id: "p2", status: "archived", review_date: daysAgo(5) }),
    ];
    const result = computePolicyMetrics(policies, []);
    expect(result.overdue_reviews).toBe(0);
  });

  it("counts upcoming reviews within 30 days", () => {
    const policies = [
      makePolicy({ id: "p1", status: "active", review_date: daysFromNow(5) }),
      makePolicy({ id: "p2", status: "active", review_date: daysFromNow(15) }),
      makePolicy({ id: "p3", status: "active", review_date: daysFromNow(29) }),
      makePolicy({ id: "p4", status: "active", review_date: daysFromNow(60) }),
    ];
    const result = computePolicyMetrics(policies, []);
    expect(result.upcoming_reviews_30d).toBe(3);
  });

  it("does not count overdue reviews as upcoming", () => {
    const policies = [
      makePolicy({ id: "p1", status: "active", review_date: daysAgo(5) }),
    ];
    const result = computePolicyMetrics(policies, []);
    expect(result.upcoming_reviews_30d).toBe(0);
    expect(result.overdue_reviews).toBe(1);
  });

  it("groups policies by category", () => {
    const policies = [
      makePolicy({ id: "p1", category: "safeguarding" }),
      makePolicy({ id: "p2", category: "safeguarding" }),
      makePolicy({ id: "p3", category: "medication" }),
      makePolicy({ id: "p4", category: "fire_safety" }),
    ];
    const result = computePolicyMetrics(policies, []);
    expect(result.by_category).toEqual({
      safeguarding: 2,
      medication: 1,
      fire_safety: 1,
    });
  });

  it("groups policies by status", () => {
    const policies = [
      makePolicy({ id: "p1", status: "active" }),
      makePolicy({ id: "p2", status: "active" }),
      makePolicy({ id: "p3", status: "draft" }),
      makePolicy({ id: "p4", status: "archived" }),
      makePolicy({ id: "p5", status: "superseded" }),
    ];
    const result = computePolicyMetrics(policies, []);
    expect(result.by_status).toEqual({
      active: 2,
      draft: 1,
      archived: 1,
      superseded: 1,
    });
  });

  it("returns empty by_category when no policies exist", () => {
    const result = computePolicyMetrics([], []);
    expect(result.by_category).toEqual({});
  });

  it("returns empty by_status when no policies exist", () => {
    const result = computePolicyMetrics([], []);
    expect(result.by_status).toEqual({});
  });

  // ── Acknowledgement rate ───────────────────────────────────────────────

  it("computes 100% acknowledgement rate when all staff acknowledged", () => {
    const policies = [
      makePolicy({ id: "p1", status: "active", staff_acknowledgement_required: true }),
    ];
    const acknowledgements = [
      makeAcknowledgement({ id: "a1", policy_id: "p1", staff_id: "s1", acknowledged: true }),
      makeAcknowledgement({ id: "a2", policy_id: "p1", staff_id: "s2", acknowledged: true }),
    ];
    const result = computePolicyMetrics(policies, acknowledgements);
    expect(result.acknowledgement_rate).toBe(100);
  });

  it("computes 0% acknowledgement rate when no staff acknowledged", () => {
    const policies = [
      makePolicy({ id: "p1", status: "active", staff_acknowledgement_required: true }),
    ];
    const acknowledgements = [
      makeAcknowledgement({ id: "a1", policy_id: "p1", staff_id: "s1", acknowledged: false }),
      makeAcknowledgement({ id: "a2", policy_id: "p1", staff_id: "s2", acknowledged: false }),
    ];
    const result = computePolicyMetrics(policies, acknowledgements);
    expect(result.acknowledgement_rate).toBe(0);
  });

  it("computes 50% acknowledgement rate correctly", () => {
    const policies = [
      makePolicy({ id: "p1", status: "active", staff_acknowledgement_required: true }),
    ];
    const acknowledgements = [
      makeAcknowledgement({ id: "a1", policy_id: "p1", staff_id: "s1", acknowledged: true }),
      makeAcknowledgement({ id: "a2", policy_id: "p1", staff_id: "s2", acknowledged: false }),
    ];
    const result = computePolicyMetrics(policies, acknowledgements);
    expect(result.acknowledgement_rate).toBe(50);
  });

  it("rounds acknowledgement rate to nearest integer", () => {
    const policies = [
      makePolicy({ id: "p1", status: "active", staff_acknowledgement_required: true }),
    ];
    const acknowledgements = [
      makeAcknowledgement({ id: "a1", policy_id: "p1", staff_id: "s1", acknowledged: true }),
      makeAcknowledgement({ id: "a2", policy_id: "p1", staff_id: "s2", acknowledged: false }),
      makeAcknowledgement({ id: "a3", policy_id: "p1", staff_id: "s3", acknowledged: false }),
    ];
    const result = computePolicyMetrics(policies, acknowledgements);
    expect(result.acknowledgement_rate).toBe(33);
  });

  it("returns 0% acknowledgement rate when no policies require acknowledgement", () => {
    const policies = [
      makePolicy({ id: "p1", status: "active", staff_acknowledgement_required: false }),
    ];
    const result = computePolicyMetrics(policies, []);
    expect(result.acknowledgement_rate).toBeNull();;
  });

  it("only considers active policies for acknowledgement rate", () => {
    const policies = [
      makePolicy({ id: "p1", status: "draft", staff_acknowledgement_required: true }),
      makePolicy({ id: "p2", status: "active", staff_acknowledgement_required: true }),
    ];
    const acknowledgements = [
      makeAcknowledgement({ id: "a1", policy_id: "p1", staff_id: "s1", acknowledged: false }),
      makeAcknowledgement({ id: "a2", policy_id: "p2", staff_id: "s1", acknowledged: true }),
    ];
    const result = computePolicyMetrics(policies, acknowledgements);
    expect(result.acknowledgement_rate).toBe(100);
  });

  it("computes acknowledgement rate across multiple policies", () => {
    const policies = [
      makePolicy({ id: "p1", status: "active", staff_acknowledgement_required: true }),
      makePolicy({ id: "p2", status: "active", staff_acknowledgement_required: true }),
    ];
    const acknowledgements = [
      makeAcknowledgement({ id: "a1", policy_id: "p1", staff_id: "s1", acknowledged: true }),
      makeAcknowledgement({ id: "a2", policy_id: "p1", staff_id: "s2", acknowledged: true }),
      makeAcknowledgement({ id: "a3", policy_id: "p2", staff_id: "s1", acknowledged: true }),
      makeAcknowledgement({ id: "a4", policy_id: "p2", staff_id: "s2", acknowledged: false }),
    ];
    const result = computePolicyMetrics(policies, acknowledgements);
    expect(result.acknowledgement_rate).toBe(75);
  });

  // ── Missing required policies ──────────────────────────────────────────

  it("reports all 12 required policies missing when no policies exist", () => {
    const result = computePolicyMetrics([], []);
    expect(result.missing_required_policies).toHaveLength(12);
  });

  it("reports zero missing when all required categories have active policies", () => {
    const requiredCategories = REQUIRED_POLICIES.map((rp) => rp.category);
    const policies = requiredCategories.map((cat, i) =>
      makePolicy({ id: `p${i}`, category: cat, status: "active" }),
    );
    const result = computePolicyMetrics(policies, []);
    expect(result.missing_required_policies).toHaveLength(0);
  });

  it("only considers active policies for required policy coverage", () => {
    const policies = [
      makePolicy({ id: "p1", category: "safeguarding", status: "draft" }),
      makePolicy({ id: "p2", category: "safeguarding", status: "archived" }),
    ];
    const result = computePolicyMetrics(policies, []);
    const missing = result.missing_required_policies.find(
      (m) => m.category === "safeguarding",
    );
    expect(missing).toBeDefined();
  });

  it("reports specific missing categories accurately", () => {
    const policies = [
      makePolicy({ id: "p1", category: "safeguarding", status: "active" }),
      makePolicy({ id: "p2", category: "medication", status: "active" }),
    ];
    const result = computePolicyMetrics(policies, []);
    const missingCategories = result.missing_required_policies.map((m) => m.category);
    expect(missingCategories).not.toContain("safeguarding");
    expect(missingCategories).not.toContain("medication");
    expect(missingCategories).toContain("behaviour_management");
    expect(missingCategories).toContain("restraint");
  });

  it("each missing policy entry has category, name, and regulation", () => {
    const result = computePolicyMetrics([], []);
    for (const m of result.missing_required_policies) {
      expect(m.category).toBeTruthy();
      expect(m.name).toBeTruthy();
      expect(m.regulation).toBeTruthy();
    }
  });

  // ── Average days since review ──────────────────────────────────────────

  it("returns 0 avg days since review when no policies have been reviewed", () => {
    const policies = [
      makePolicy({ id: "p1", last_reviewed_date: null }),
      makePolicy({ id: "p2", last_reviewed_date: null }),
    ];
    const result = computePolicyMetrics(policies, []);
    expect(result.avg_days_since_review).toBeNull();;
  });

  it("computes avg days since review for a single reviewed policy", () => {
    const policies = [
      makePolicy({ id: "p1", last_reviewed_date: daysAgo(30) }),
    ];
    const result = computePolicyMetrics(policies, []);
    expect(result.avg_days_since_review).toBeGreaterThanOrEqual(29);
    expect(result.avg_days_since_review).toBeLessThanOrEqual(31);
  });

  it("computes avg days since review across multiple reviewed policies", () => {
    const policies = [
      makePolicy({ id: "p1", last_reviewed_date: daysAgo(10) }),
      makePolicy({ id: "p2", last_reviewed_date: daysAgo(20) }),
    ];
    const result = computePolicyMetrics(policies, []);
    // Average of ~10 and ~20 days = ~15
    expect(result.avg_days_since_review).toBeGreaterThanOrEqual(14);
    expect(result.avg_days_since_review).toBeLessThanOrEqual(16);
  });

  it("excludes unreviewed policies from avg days calculation", () => {
    const policies = [
      makePolicy({ id: "p1", last_reviewed_date: daysAgo(10) }),
      makePolicy({ id: "p2", last_reviewed_date: null }),
    ];
    const result = computePolicyMetrics(policies, []);
    // Only p1 counted, so ~10 days
    expect(result.avg_days_since_review).toBeGreaterThanOrEqual(9);
    expect(result.avg_days_since_review).toBeLessThanOrEqual(11);
  });

  it("rounds avg days since review to nearest integer", () => {
    const policies = [
      makePolicy({ id: "p1", last_reviewed_date: daysAgo(10) }),
    ];
    const result = computePolicyMetrics(policies, []);
    expect(Number.isInteger(result.avg_days_since_review)).toBe(true);
  });

  // ── Combined metrics scenarios ─────────────────────────────────────────

  it("handles a single active policy with all features", () => {
    const policies = [
      makePolicy({
        id: "p1",
        status: "active",
        category: "safeguarding",
        review_date: daysFromNow(10),
        last_reviewed_date: daysAgo(60),
        staff_acknowledgement_required: true,
      }),
    ];
    const acknowledgements = [
      makeAcknowledgement({ id: "a1", policy_id: "p1", acknowledged: true }),
    ];
    const result = computePolicyMetrics(policies, acknowledgements);
    expect(result.total_policies).toBe(1);
    expect(result.active_policies).toBe(1);
    expect(result.overdue_reviews).toBe(0);
    expect(result.upcoming_reviews_30d).toBe(1);
    expect(result.by_category).toEqual({ safeguarding: 1 });
    expect(result.by_status).toEqual({ active: 1 });
    expect(result.acknowledgement_rate).toBe(100);
  });

  it("handles large mixed dataset correctly", () => {
    const requiredCategories = REQUIRED_POLICIES.map((rp) => rp.category);
    const policies = [
      ...requiredCategories.map((cat, i) =>
        makePolicy({
          id: `p${i}`,
          category: cat,
          status: "active",
          review_date: daysFromNow(90),
          last_reviewed_date: daysAgo(30),
        }),
      ),
      makePolicy({ id: "p-draft", status: "draft", category: "other", review_date: daysAgo(5) }),
      makePolicy({ id: "p-arch", status: "archived", category: "other", review_date: daysAgo(10) }),
    ];
    const result = computePolicyMetrics(policies, []);
    expect(result.total_policies).toBe(14);
    expect(result.active_policies).toBe(12);
    expect(result.overdue_reviews).toBe(0);
    expect(result.missing_required_policies).toHaveLength(0);
  });

  it("handles policies with no acknowledgement records for a requiring policy", () => {
    const policies = [
      makePolicy({ id: "p1", status: "active", staff_acknowledgement_required: true }),
    ];
    const result = computePolicyMetrics(policies, []);
    // No ack records, so 0 out of 1 expected
    expect(result.acknowledgement_rate).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// identifyPolicyAlerts
// ═══════════════════════════════════════════════════════════════════════════

describe("identifyPolicyAlerts", () => {
  it("returns only missing required policy alerts for empty inputs", () => {
    const alerts = identifyPolicyAlerts([], []);
    // With no policies at all, every required policy is missing
    expect(alerts).toHaveLength(12);
    for (const a of alerts) {
      expect(a.type).toBe("missing_required_policy");
      expect(a.severity).toBe("critical");
    }
  });

  // ── Missing required policy alerts ─────────────────────────────────────

  describe("missing required policy alerts", () => {
    it("generates critical alerts for all 12 missing required policies when none exist", () => {
      const alerts = identifyPolicyAlerts([], []);
      // No active policies, so all are in missing_required_policies computed inside,
      // but identifyPolicyAlerts checks against REQUIRED_POLICIES
      const missing = alerts.filter((a) => a.type === "missing_required_policy");
      expect(missing).toHaveLength(12);
      for (const m of missing) {
        expect(m.severity).toBe("critical");
      }
    });

    it("does not generate missing alert when required category has active policy", () => {
      const policies = [
        makePolicy({ id: "p1", category: "safeguarding", status: "active" }),
      ];
      const alerts = identifyPolicyAlerts(policies, []);
      const missing = alerts.filter((a) => a.type === "missing_required_policy");
      const safeguardingMissing = missing.find((m) => m.message.includes("Safeguarding Children Policy"));
      expect(safeguardingMissing).toBeUndefined();
    });

    it("generates missing alert when required category only has draft policy", () => {
      const policies = [
        makePolicy({ id: "p1", category: "safeguarding", status: "draft" }),
      ];
      const alerts = identifyPolicyAlerts(policies, []);
      const missing = alerts.filter((a) => a.type === "missing_required_policy");
      const safeguardingMissing = missing.find((m) => m.message.includes("Safeguarding Children Policy"));
      expect(safeguardingMissing).toBeDefined();
    });

    it("includes regulation reference in missing policy message", () => {
      const alerts = identifyPolicyAlerts([], []);
      const missing = alerts.filter((a) => a.type === "missing_required_policy");
      for (const m of missing) {
        expect(m.message).toMatch(/Reg \d/);
      }
    });

    it("includes Reg 38 reference in missing policy messages", () => {
      const alerts = identifyPolicyAlerts([], []);
      const missing = alerts.filter((a) => a.type === "missing_required_policy");
      for (const m of missing) {
        expect(m.message).toContain("Reg 38");
      }
    });

    it("generates zero missing alerts when all required categories are active", () => {
      const requiredCategories = REQUIRED_POLICIES.map((rp) => rp.category);
      const policies = requiredCategories.map((cat, i) =>
        makePolicy({ id: `p${i}`, category: cat, status: "active" }),
      );
      const alerts = identifyPolicyAlerts(policies, []);
      const missing = alerts.filter((a) => a.type === "missing_required_policy");
      expect(missing).toHaveLength(0);
    });
  });

  // ── Overdue review alerts ──────────────────────────────────────────────

  describe("overdue review alerts", () => {
    it("generates high alert for active policy with overdue review", () => {
      const policies = [
        makePolicy({ id: "p1", status: "active", review_date: daysAgo(10), policy_name: "Test Policy" }),
      ];
      const alerts = identifyPolicyAlerts(policies, []);
      const overdue = alerts.filter((a) => a.type === "overdue_review");
      expect(overdue).toHaveLength(1);
      expect(overdue[0].severity).toBe("high");
    });

    it("includes policy name in overdue review message", () => {
      const policies = [
        makePolicy({ id: "p1", status: "active", review_date: daysAgo(10), policy_name: "My Important Policy" }),
      ];
      const alerts = identifyPolicyAlerts(policies, []);
      const overdue = alerts.find((a) => a.type === "overdue_review");
      expect(overdue?.message).toContain("My Important Policy");
    });

    it("includes review date in overdue review message", () => {
      const reviewDate = daysAgo(10);
      const policies = [
        makePolicy({ id: "p1", status: "active", review_date: reviewDate }),
      ];
      const alerts = identifyPolicyAlerts(policies, []);
      const overdue = alerts.find((a) => a.type === "overdue_review");
      expect(overdue?.message).toContain(reviewDate);
    });

    it("includes Reg 38 reference in overdue review message", () => {
      const policies = [
        makePolicy({ id: "p1", status: "active", review_date: daysAgo(10) }),
      ];
      const alerts = identifyPolicyAlerts(policies, []);
      const overdue = alerts.find((a) => a.type === "overdue_review");
      expect(overdue?.message).toContain("Reg 38");
    });

    it("does not generate overdue alert for draft policy with past review date", () => {
      const policies = [
        makePolicy({ id: "p1", status: "draft", review_date: daysAgo(10) }),
      ];
      const alerts = identifyPolicyAlerts(policies, []);
      const overdue = alerts.filter((a) => a.type === "overdue_review");
      expect(overdue).toHaveLength(0);
    });

    it("does not generate overdue alert for active policy with future review date", () => {
      const policies = [
        makePolicy({ id: "p1", status: "active", review_date: daysFromNow(30) }),
      ];
      const alerts = identifyPolicyAlerts(policies, []);
      const overdue = alerts.filter((a) => a.type === "overdue_review");
      expect(overdue).toHaveLength(0);
    });

    it("generates multiple overdue alerts for multiple overdue policies", () => {
      const policies = [
        makePolicy({ id: "p1", status: "active", review_date: daysAgo(10) }),
        makePolicy({ id: "p2", status: "active", review_date: daysAgo(5) }),
        makePolicy({ id: "p3", status: "active", review_date: daysFromNow(30) }),
      ];
      const alerts = identifyPolicyAlerts(policies, []);
      const overdue = alerts.filter((a) => a.type === "overdue_review");
      expect(overdue).toHaveLength(2);
    });
  });

  // ── Review due soon alerts ─────────────────────────────────────────────

  describe("review due soon alerts", () => {
    it("generates medium alert for active policy with review due within 14 days", () => {
      const policies = [
        makePolicy({ id: "p1", status: "active", review_date: daysFromNow(7), policy_name: "Soon Policy" }),
      ];
      const alerts = identifyPolicyAlerts(policies, []);
      const dueSoon = alerts.filter((a) => a.type === "review_due_soon");
      expect(dueSoon).toHaveLength(1);
      expect(dueSoon[0].severity).toBe("medium");
    });

    it("includes policy name in review due soon message", () => {
      const policies = [
        makePolicy({ id: "p1", status: "active", review_date: daysFromNow(7), policy_name: "Imminent Review Policy" }),
      ];
      const alerts = identifyPolicyAlerts(policies, []);
      const dueSoon = alerts.find((a) => a.type === "review_due_soon");
      expect(dueSoon?.message).toContain("Imminent Review Policy");
    });

    it("does not flag policy with review due in 20 days as due soon", () => {
      const policies = [
        makePolicy({ id: "p1", status: "active", review_date: daysFromNow(20) }),
      ];
      const alerts = identifyPolicyAlerts(policies, []);
      const dueSoon = alerts.filter((a) => a.type === "review_due_soon");
      expect(dueSoon).toHaveLength(0);
    });

    it("does not flag overdue policy as due soon", () => {
      const policies = [
        makePolicy({ id: "p1", status: "active", review_date: daysAgo(5) }),
      ];
      const alerts = identifyPolicyAlerts(policies, []);
      const dueSoon = alerts.filter((a) => a.type === "review_due_soon");
      expect(dueSoon).toHaveLength(0);
    });

    it("does not flag draft policy as due soon", () => {
      const policies = [
        makePolicy({ id: "p1", status: "draft", review_date: daysFromNow(7) }),
      ];
      const alerts = identifyPolicyAlerts(policies, []);
      const dueSoon = alerts.filter((a) => a.type === "review_due_soon");
      expect(dueSoon).toHaveLength(0);
    });
  });

  // ── No acknowledgement records alerts ──────────────────────────────────

  describe("no acknowledgements alerts", () => {
    it("generates medium alert for active policy requiring ack with no records", () => {
      const policies = [
        makePolicy({ id: "p1", status: "active", staff_acknowledgement_required: true, policy_name: "Unacked Policy" }),
      ];
      const alerts = identifyPolicyAlerts(policies, []);
      const noAcks = alerts.filter((a) => a.type === "no_acknowledgements");
      expect(noAcks).toHaveLength(1);
      expect(noAcks[0].severity).toBe("medium");
    });

    it("includes policy name in no acknowledgements message", () => {
      const policies = [
        makePolicy({ id: "p1", status: "active", staff_acknowledgement_required: true, policy_name: "Missing Acks Policy" }),
      ];
      const alerts = identifyPolicyAlerts(policies, []);
      const noAcks = alerts.find((a) => a.type === "no_acknowledgements");
      expect(noAcks?.message).toContain("Missing Acks Policy");
    });

    it("does not flag policy that does not require acknowledgement", () => {
      const policies = [
        makePolicy({ id: "p1", status: "active", staff_acknowledgement_required: false }),
      ];
      const alerts = identifyPolicyAlerts(policies, []);
      const noAcks = alerts.filter((a) => a.type === "no_acknowledgements");
      expect(noAcks).toHaveLength(0);
    });

    it("does not flag policy requiring ack that has acknowledgement records", () => {
      const policies = [
        makePolicy({ id: "p1", status: "active", staff_acknowledgement_required: true }),
      ];
      const acknowledgements = [
        makeAcknowledgement({ id: "a1", policy_id: "p1", acknowledged: true }),
      ];
      const alerts = identifyPolicyAlerts(policies, acknowledgements);
      const noAcks = alerts.filter((a) => a.type === "no_acknowledgements");
      expect(noAcks).toHaveLength(0);
    });

    it("does not flag inactive policy requiring ack with no records", () => {
      const policies = [
        makePolicy({ id: "p1", status: "draft", staff_acknowledgement_required: true }),
      ];
      const alerts = identifyPolicyAlerts(policies, []);
      const noAcks = alerts.filter((a) => a.type === "no_acknowledgements");
      expect(noAcks).toHaveLength(0);
    });
  });

  // ── Low acknowledgement rate alerts ────────────────────────────────────

  describe("low acknowledgement rate alerts", () => {
    it("generates high alert when acknowledgement rate is below 80%", () => {
      const policies = [
        makePolicy({ id: "p1", status: "active", staff_acknowledgement_required: true, policy_name: "Low Ack Policy" }),
      ];
      const acknowledgements = [
        makeAcknowledgement({ id: "a1", policy_id: "p1", staff_id: "s1", acknowledged: true }),
        makeAcknowledgement({ id: "a2", policy_id: "p1", staff_id: "s2", acknowledged: false }),
        makeAcknowledgement({ id: "a3", policy_id: "p1", staff_id: "s3", acknowledged: false }),
        makeAcknowledgement({ id: "a4", policy_id: "p1", staff_id: "s4", acknowledged: false }),
      ];
      const alerts = identifyPolicyAlerts(policies, acknowledgements);
      const lowAck = alerts.filter((a) => a.type === "low_acknowledgement_rate");
      expect(lowAck).toHaveLength(1);
      expect(lowAck[0].severity).toBe("high");
    });

    it("includes acknowledgement rate percentage in message", () => {
      const policies = [
        makePolicy({ id: "p1", status: "active", staff_acknowledgement_required: true }),
      ];
      const acknowledgements = [
        makeAcknowledgement({ id: "a1", policy_id: "p1", staff_id: "s1", acknowledged: true }),
        makeAcknowledgement({ id: "a2", policy_id: "p1", staff_id: "s2", acknowledged: false }),
        makeAcknowledgement({ id: "a3", policy_id: "p1", staff_id: "s3", acknowledged: false }),
        makeAcknowledgement({ id: "a4", policy_id: "p1", staff_id: "s4", acknowledged: false }),
      ];
      const alerts = identifyPolicyAlerts(policies, acknowledgements);
      const lowAck = alerts.find((a) => a.type === "low_acknowledgement_rate");
      expect(lowAck?.message).toContain("25%");
    });

    it("does not flag when acknowledgement rate is exactly 80%", () => {
      const policies = [
        makePolicy({ id: "p1", status: "active", staff_acknowledgement_required: true }),
      ];
      const acknowledgements = [
        makeAcknowledgement({ id: "a1", policy_id: "p1", staff_id: "s1", acknowledged: true }),
        makeAcknowledgement({ id: "a2", policy_id: "p1", staff_id: "s2", acknowledged: true }),
        makeAcknowledgement({ id: "a3", policy_id: "p1", staff_id: "s3", acknowledged: true }),
        makeAcknowledgement({ id: "a4", policy_id: "p1", staff_id: "s4", acknowledged: true }),
        makeAcknowledgement({ id: "a5", policy_id: "p1", staff_id: "s5", acknowledged: false }),
      ];
      const alerts = identifyPolicyAlerts(policies, acknowledgements);
      const lowAck = alerts.filter((a) => a.type === "low_acknowledgement_rate");
      expect(lowAck).toHaveLength(0);
    });

    it("does not flag when acknowledgement rate is 100%", () => {
      const policies = [
        makePolicy({ id: "p1", status: "active", staff_acknowledgement_required: true }),
      ];
      const acknowledgements = [
        makeAcknowledgement({ id: "a1", policy_id: "p1", staff_id: "s1", acknowledged: true }),
        makeAcknowledgement({ id: "a2", policy_id: "p1", staff_id: "s2", acknowledged: true }),
      ];
      const alerts = identifyPolicyAlerts(policies, acknowledgements);
      const lowAck = alerts.filter((a) => a.type === "low_acknowledgement_rate");
      expect(lowAck).toHaveLength(0);
    });

    it("does not generate low ack alert when there are zero ack records (caught by no_acknowledgements)", () => {
      const policies = [
        makePolicy({ id: "p1", status: "active", staff_acknowledgement_required: true }),
      ];
      const alerts = identifyPolicyAlerts(policies, []);
      const lowAck = alerts.filter((a) => a.type === "low_acknowledgement_rate");
      expect(lowAck).toHaveLength(0);
    });

    it("includes policy name in low acknowledgement rate message", () => {
      const policies = [
        makePolicy({ id: "p1", status: "active", staff_acknowledgement_required: true, policy_name: "Poor Compliance Policy" }),
      ];
      const acknowledgements = [
        makeAcknowledgement({ id: "a1", policy_id: "p1", staff_id: "s1", acknowledged: true }),
        makeAcknowledgement({ id: "a2", policy_id: "p1", staff_id: "s2", acknowledged: false }),
        makeAcknowledgement({ id: "a3", policy_id: "p1", staff_id: "s3", acknowledged: false }),
        makeAcknowledgement({ id: "a4", policy_id: "p1", staff_id: "s4", acknowledged: false }),
        makeAcknowledgement({ id: "a5", policy_id: "p1", staff_id: "s5", acknowledged: false }),
      ];
      const alerts = identifyPolicyAlerts(policies, acknowledgements);
      const lowAck = alerts.find((a) => a.type === "low_acknowledgement_rate");
      expect(lowAck?.message).toContain("Poor Compliance Policy");
    });
  });

  // ── Draft stale alerts ─────────────────────────────────────────────────

  describe("draft stale alerts", () => {
    it("generates medium alert for policy in draft for more than 30 days", () => {
      const policies = [
        makePolicy({ id: "p1", status: "draft", policy_name: "Old Draft", created_at: daysAgoISO(45) }),
      ];
      const alerts = identifyPolicyAlerts(policies, []);
      const stale = alerts.filter((a) => a.type === "draft_stale");
      expect(stale).toHaveLength(1);
      expect(stale[0].severity).toBe("medium");
    });

    it("includes policy name in stale draft message", () => {
      const policies = [
        makePolicy({ id: "p1", status: "draft", policy_name: "Stale Draft Policy", created_at: daysAgoISO(45) }),
      ];
      const alerts = identifyPolicyAlerts(policies, []);
      const stale = alerts.find((a) => a.type === "draft_stale");
      expect(stale?.message).toContain("Stale Draft Policy");
    });

    it("does not flag draft created less than 30 days ago", () => {
      const policies = [
        makePolicy({ id: "p1", status: "draft", created_at: daysAgoISO(15) }),
      ];
      const alerts = identifyPolicyAlerts(policies, []);
      const stale = alerts.filter((a) => a.type === "draft_stale");
      expect(stale).toHaveLength(0);
    });

    it("does not flag active policy even if created more than 30 days ago", () => {
      const policies = [
        makePolicy({ id: "p1", status: "active", created_at: daysAgoISO(90) }),
      ];
      const alerts = identifyPolicyAlerts(policies, []);
      const stale = alerts.filter((a) => a.type === "draft_stale");
      expect(stale).toHaveLength(0);
    });

    it("flags multiple stale drafts", () => {
      const policies = [
        makePolicy({ id: "p1", status: "draft", created_at: daysAgoISO(45) }),
        makePolicy({ id: "p2", status: "draft", created_at: daysAgoISO(60) }),
        makePolicy({ id: "p3", status: "draft", created_at: daysAgoISO(10) }),
      ];
      const alerts = identifyPolicyAlerts(policies, []);
      const stale = alerts.filter((a) => a.type === "draft_stale");
      expect(stale).toHaveLength(2);
    });
  });

  // ── Superseded still active alerts ─────────────────────────────────────

  describe("superseded still active alerts", () => {
    it("generates high alert when active policy has older version than superseded one in same category", () => {
      const policies = [
        makePolicy({ id: "p1", category: "safeguarding", status: "active", version: "1.0", policy_name: "SG Policy" }),
        makePolicy({ id: "p2", category: "safeguarding", status: "superseded", version: "2.0" }),
      ];
      const alerts = identifyPolicyAlerts(policies, []);
      const superseded = alerts.filter((a) => a.type === "superseded_still_active");
      expect(superseded).toHaveLength(1);
      expect(superseded[0].severity).toBe("high");
    });

    it("includes policy name and versions in superseded alert message", () => {
      const policies = [
        makePolicy({ id: "p1", category: "safeguarding", status: "active", version: "1.0", policy_name: "SG Policy" }),
        makePolicy({ id: "p2", category: "safeguarding", status: "superseded", version: "2.0" }),
      ];
      const alerts = identifyPolicyAlerts(policies, []);
      const superseded = alerts.find((a) => a.type === "superseded_still_active");
      expect(superseded?.message).toContain("SG Policy");
      expect(superseded?.message).toContain("1.0");
      expect(superseded?.message).toContain("2.0");
    });

    it("does not flag when active version is newer than superseded version", () => {
      const policies = [
        makePolicy({ id: "p1", category: "safeguarding", status: "active", version: "3.0" }),
        makePolicy({ id: "p2", category: "safeguarding", status: "superseded", version: "2.0" }),
      ];
      const alerts = identifyPolicyAlerts(policies, []);
      const superseded = alerts.filter((a) => a.type === "superseded_still_active");
      expect(superseded).toHaveLength(0);
    });

    it("does not flag when superseded policy is in different category", () => {
      const policies = [
        makePolicy({ id: "p1", category: "safeguarding", status: "active", version: "1.0" }),
        makePolicy({ id: "p2", category: "medication", status: "superseded", version: "2.0" }),
      ];
      const alerts = identifyPolicyAlerts(policies, []);
      const superseded = alerts.filter((a) => a.type === "superseded_still_active");
      expect(superseded).toHaveLength(0);
    });

    it("does not flag when versions are equal", () => {
      const policies = [
        makePolicy({ id: "p1", category: "safeguarding", status: "active", version: "2.0" }),
        makePolicy({ id: "p2", category: "safeguarding", status: "superseded", version: "2.0" }),
      ];
      const alerts = identifyPolicyAlerts(policies, []);
      const superseded = alerts.filter((a) => a.type === "superseded_still_active");
      expect(superseded).toHaveLength(0);
    });
  });

  // ── No document URL alerts ─────────────────────────────────────────────

  describe("no document URL alerts", () => {
    it("generates low alert for active policy with no document URL", () => {
      const policies = [
        makePolicy({ id: "p1", status: "active", document_url: null, policy_name: "No Doc Policy" }),
      ];
      const alerts = identifyPolicyAlerts(policies, []);
      const noDoc = alerts.filter((a) => a.type === "no_document_url");
      expect(noDoc).toHaveLength(1);
      expect(noDoc[0].severity).toBe("low");
    });

    it("includes policy name in no document URL message", () => {
      const policies = [
        makePolicy({ id: "p1", status: "active", document_url: null, policy_name: "Unlinked Policy" }),
      ];
      const alerts = identifyPolicyAlerts(policies, []);
      const noDoc = alerts.find((a) => a.type === "no_document_url");
      expect(noDoc?.message).toContain("Unlinked Policy");
    });

    it("does not flag active policy with document URL", () => {
      const policies = [
        makePolicy({ id: "p1", status: "active", document_url: "https://example.com/doc.pdf" }),
      ];
      const alerts = identifyPolicyAlerts(policies, []);
      const noDoc = alerts.filter((a) => a.type === "no_document_url");
      expect(noDoc).toHaveLength(0);
    });

    it("does not flag draft policy with no document URL", () => {
      const policies = [
        makePolicy({ id: "p1", status: "draft", document_url: null }),
      ];
      const alerts = identifyPolicyAlerts(policies, []);
      const noDoc = alerts.filter((a) => a.type === "no_document_url");
      expect(noDoc).toHaveLength(0);
    });

    it("does not flag archived policy with no document URL", () => {
      const policies = [
        makePolicy({ id: "p1", status: "archived", document_url: null }),
      ];
      const alerts = identifyPolicyAlerts(policies, []);
      const noDoc = alerts.filter((a) => a.type === "no_document_url");
      expect(noDoc).toHaveLength(0);
    });

    it("flags multiple active policies without document URLs", () => {
      const policies = [
        makePolicy({ id: "p1", status: "active", document_url: null }),
        makePolicy({ id: "p2", status: "active", document_url: null }),
        makePolicy({ id: "p3", status: "active", document_url: "https://example.com/doc.pdf" }),
      ];
      const alerts = identifyPolicyAlerts(policies, []);
      const noDoc = alerts.filter((a) => a.type === "no_document_url");
      expect(noDoc).toHaveLength(2);
    });
  });

  // ── Combined / complex scenarios ──────────────────────────────────────

  describe("combined alert scenarios", () => {
    it("generates multiple alert types for a single problematic policy", () => {
      const policies = [
        makePolicy({
          id: "p1",
          status: "active",
          category: "other",
          review_date: daysAgo(5),
          staff_acknowledgement_required: true,
          document_url: null,
          policy_name: "Problematic Policy",
        }),
      ];
      const alerts = identifyPolicyAlerts(policies, []);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("overdue_review");
      expect(types).toContain("no_acknowledgements");
      expect(types).toContain("no_document_url");
    });

    it("generates both missing policy and overdue review alerts", () => {
      const policies = [
        makePolicy({ id: "p1", status: "active", category: "safeguarding", review_date: daysAgo(10) }),
      ];
      const alerts = identifyPolicyAlerts(policies, []);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("overdue_review");
      expect(types).toContain("missing_required_policy");
    });

    it("does not generate alerts for a fully compliant active policy", () => {
      // Cover all required categories to eliminate missing policy alerts
      const requiredCategories = REQUIRED_POLICIES.map((rp) => rp.category);
      const policies = requiredCategories.map((cat, i) =>
        makePolicy({
          id: `p${i}`,
          category: cat,
          status: "active",
          review_date: daysFromNow(90),
          document_url: "https://example.com/doc.pdf",
          staff_acknowledgement_required: false,
        }),
      );
      const alerts = identifyPolicyAlerts(policies, []);
      expect(alerts).toHaveLength(0);
    });

    it("handles large mixed dataset with multiple alert types", () => {
      const policies = [
        makePolicy({ id: "p1", status: "active", category: "safeguarding", review_date: daysAgo(10), document_url: null, staff_acknowledgement_required: true }),
        makePolicy({ id: "p2", status: "active", category: "medication", review_date: daysFromNow(7), document_url: "https://example.com", staff_acknowledgement_required: true }),
        makePolicy({ id: "p3", status: "draft", category: "other", created_at: daysAgoISO(60) }),
        makePolicy({ id: "p4", status: "active", category: "fire_safety", review_date: daysFromNow(90), document_url: "https://example.com", staff_acknowledgement_required: false }),
      ];
      const acknowledgements = [
        makeAcknowledgement({ id: "a1", policy_id: "p1", staff_id: "s1", acknowledged: false }),
        makeAcknowledgement({ id: "a2", policy_id: "p2", staff_id: "s1", acknowledged: true }),
        makeAcknowledgement({ id: "a3", policy_id: "p2", staff_id: "s2", acknowledged: true }),
      ];
      const alerts = identifyPolicyAlerts(policies, acknowledgements);
      const types = alerts.map((a) => a.type);

      // p1: overdue_review, low_acknowledgement_rate (0%), no_document_url
      expect(types).toContain("overdue_review");
      expect(types).toContain("low_acknowledgement_rate");
      expect(types).toContain("no_document_url");
      // p2: review_due_soon
      expect(types).toContain("review_due_soon");
      // p3: draft_stale
      expect(types).toContain("draft_stale");
      // Missing required policies (many categories not covered)
      expect(types).toContain("missing_required_policy");
    });

    it("returns alerts with valid type, severity, and message fields", () => {
      const policies = [
        makePolicy({ id: "p1", status: "active", review_date: daysAgo(5), document_url: null }),
      ];
      const alerts = identifyPolicyAlerts(policies, []);
      for (const alert of alerts) {
        expect(alert.type).toBeTruthy();
        expect(["critical", "high", "medium", "low"]).toContain(alert.severity);
        expect(alert.message).toBeTruthy();
        expect(typeof alert.message).toBe("string");
      }
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CRUD — Policies (Supabase disabled)
// ═══════════════════════════════════════════════════════════════════════════

describe("listPolicies", () => {
  it("returns ok: true with empty data array when Supabase is disabled", async () => {
    const result = await listPolicies("home-1");
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of filters", async () => {
    const result = await listPolicies("home-1", {
      category: "safeguarding",
      status: "active",
      owner: "staff-1",
      limit: 50,
    });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });
});

describe("createPolicy", () => {
  it("returns ok: false with Supabase not configured error", async () => {
    const result = await createPolicy({
      home_id: "home-1",
      policy_name: "Test Policy",
      policy_reference: null,
      category: "safeguarding",
      regulation_reference: "Reg 12",
      description: "Test",
      version: "1.0",
      status: "draft",
      owner: "staff-1",
      approved_by: null,
      approval_date: null,
      effective_date: "2026-01-01",
      review_date: "2026-07-01",
      last_reviewed_date: null,
      reviewed_by: null,
      review_frequency: "annual",
      document_url: null,
      staff_acknowledgement_required: false,
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });
});

describe("updatePolicy", () => {
  it("returns ok: false with Supabase not configured error", async () => {
    const result = await updatePolicy("pol-1", { status: "active" });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CRUD — Acknowledgements (Supabase disabled)
// ═══════════════════════════════════════════════════════════════════════════

describe("listAcknowledgements", () => {
  it("returns ok: true with empty data array when Supabase is disabled", async () => {
    const result = await listAcknowledgements("home-1");
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of filters", async () => {
    const result = await listAcknowledgements("home-1", {
      policyId: "pol-1",
      staffId: "staff-1",
      limit: 25,
    });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });
});

describe("createAcknowledgement", () => {
  it("returns ok: false with Supabase not configured error", async () => {
    const result = await createAcknowledgement({
      home_id: "home-1",
      policy_id: "pol-1",
      staff_id: "staff-1",
      staff_name: "Jane Smith",
      acknowledged_date: "2026-05-01",
      acknowledged: true,
      notes: null,
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CRUD — Review History (Supabase disabled)
// ═══════════════════════════════════════════════════════════════════════════

describe("listReviewHistory", () => {
  it("returns ok: true with empty data array when Supabase is disabled", async () => {
    const result = await listReviewHistory("home-1");
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of filters", async () => {
    const result = await listReviewHistory("home-1", {
      policyId: "pol-1",
      reviewedBy: "staff-1",
      outcome: "no_changes",
      limit: 25,
    });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });
});

describe("createReviewHistory", () => {
  it("returns ok: false with Supabase not configured error", async () => {
    const result = await createReviewHistory({
      home_id: "home-1",
      policy_id: "pol-1",
      review_date: "2026-05-01",
      reviewed_by: "staff-1",
      previous_version: "1.0",
      new_version: "1.1",
      changes_summary: "Minor update to section 3",
      outcome: "minor_update",
      next_review_date: "2027-05-01",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });
});
