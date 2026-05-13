// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — DEPRIVATION OF LIBERTY & RESTRICTIONS SERVICE TESTS
// Pure-function tests for DoL metrics computation, alert identification, and
// constant validation for CHR 2015 Reg 20/21, Children Act 1989 s25 compliance.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  _testing,
  DOL_ORDER_TYPES,
  AUTHORISING_BODIES,
  DOL_STATUS,
  RESTRICTION_TYPES,
  LEGAL_BASIS_OPTIONS,
  REVIEW_FREQUENCY,
  RESTRICTION_STATUS,
  listDoLOrders,
  createDoLOrder,
  updateDoLOrder,
  listRestrictions,
  createRestriction,
  updateRestriction,
} from "../deprivation-of-liberty-service";
import type {
  DoLOrder,
  RestrictionRecord,
} from "../deprivation-of-liberty-service";

const {
  computeDoLMetrics,
  identifyDoLAlerts,
} = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

const orderDefaults: DoLOrder = {
  id: "dol-1",
  home_id: "home-1",
  child_id: "child-1",
  child_name: "Alex Taylor",
  order_type: "court_order",
  authorising_body: "high_court",
  order_reference: "DOL-2026-001",
  start_date: "2026-01-01",
  end_date: "2026-12-31",
  review_date: "2026-06-01",
  conditions: ["Must remain in placement"],
  justification: "Risk of significant harm if unsupervised",
  legal_representative: "Smith & Partners",
  irm_notified: true,
  ofsted_notified: true,
  status: "active",
  reviewed_by: "Manager A",
  review_notes: "Order reviewed and confirmed necessary",
  created_at: "2026-01-01T10:00:00Z",
  updated_at: "2026-01-01T10:00:00Z",
};

const restrictionDefaults: RestrictionRecord = {
  id: "restr-1",
  home_id: "home-1",
  child_id: "child-1",
  child_name: "Alex Taylor",
  restriction_type: "movement",
  description: "Cannot leave the home unaccompanied",
  justification: "Risk assessment indicates high absconding risk",
  legal_basis: "court_order",
  start_date: "2026-01-01",
  end_date: null,
  review_frequency: "weekly",
  last_review_date: "2026-04-01",
  next_review_date: "2026-07-01",
  reviewed_by: "Manager A",
  child_consulted: true,
  child_views: "Child understands the restriction",
  social_worker_informed: true,
  social_worker_informed_date: "2026-01-02",
  parent_informed: true,
  proportionate: true,
  status: "active",
  created_at: "2026-01-01T10:00:00Z",
  updated_at: "2026-01-01T10:00:00Z",
};

/** Build a minimal DoL order with sensible defaults. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeOrder(overrides: Record<string, unknown> = {}): any {
  return { ...orderDefaults, ...overrides };
}

/** Build a minimal restriction record with sensible defaults. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeRestriction(overrides: Record<string, unknown> = {}): any {
  return { ...restrictionDefaults, ...overrides };
}

// ── DOL_ORDER_TYPES ────────────────────────────────────────────────────────

describe("DOL_ORDER_TYPES", () => {
  it("has exactly 4 entries", () => {
    expect(DOL_ORDER_TYPES).toHaveLength(4);
  });

  it("each entry has type and label properties", () => {
    for (const entry of DOL_ORDER_TYPES) {
      expect(typeof entry.type).toBe("string");
      expect(typeof entry.label).toBe("string");
    }
  });

  it("has unique type values", () => {
    const types = DOL_ORDER_TYPES.map((e) => e.type);
    expect(new Set(types).size).toBe(types.length);
  });

  it("contains expected order types", () => {
    const types = DOL_ORDER_TYPES.map((e) => e.type);
    expect(types).toContain("court_order");
    expect(types).toContain("inherent_jurisdiction");
    expect(types).toContain("secure_accommodation");
    expect(types).toContain("liberty_protection_safeguards");
  });

  it("has correct label for court_order", () => {
    const found = DOL_ORDER_TYPES.find((e) => e.type === "court_order");
    expect(found?.label).toBe("Court Order");
  });

  it("has correct label for inherent_jurisdiction", () => {
    const found = DOL_ORDER_TYPES.find((e) => e.type === "inherent_jurisdiction");
    expect(found?.label).toBe("Inherent Jurisdiction (High Court)");
  });

  it("has correct label for secure_accommodation", () => {
    const found = DOL_ORDER_TYPES.find((e) => e.type === "secure_accommodation");
    expect(found?.label).toBe("Secure Accommodation (s25 CA 1989)");
  });

  it("has correct label for liberty_protection_safeguards", () => {
    const found = DOL_ORDER_TYPES.find((e) => e.type === "liberty_protection_safeguards");
    expect(found?.label).toBe("Liberty Protection Safeguards");
  });
});

// ── AUTHORISING_BODIES ─────────────────────────────────────────────────────

describe("AUTHORISING_BODIES", () => {
  it("has exactly 4 entries", () => {
    expect(AUTHORISING_BODIES).toHaveLength(4);
  });

  it("each entry has body and label properties", () => {
    for (const entry of AUTHORISING_BODIES) {
      expect(typeof entry.body).toBe("string");
      expect(typeof entry.label).toBe("string");
    }
  });

  it("has unique body values", () => {
    const bodies = AUTHORISING_BODIES.map((e) => e.body);
    expect(new Set(bodies).size).toBe(bodies.length);
  });

  it("contains expected authorising bodies", () => {
    const bodies = AUTHORISING_BODIES.map((e) => e.body);
    expect(bodies).toContain("high_court");
    expect(bodies).toContain("family_court");
    expect(bodies).toContain("local_authority");
    expect(bodies).toContain("secretary_of_state");
  });

  it("has correct label for high_court", () => {
    const found = AUTHORISING_BODIES.find((e) => e.body === "high_court");
    expect(found?.label).toBe("High Court");
  });

  it("has correct label for family_court", () => {
    const found = AUTHORISING_BODIES.find((e) => e.body === "family_court");
    expect(found?.label).toBe("Family Court");
  });

  it("has correct label for local_authority", () => {
    const found = AUTHORISING_BODIES.find((e) => e.body === "local_authority");
    expect(found?.label).toBe("Local Authority");
  });

  it("has correct label for secretary_of_state", () => {
    const found = AUTHORISING_BODIES.find((e) => e.body === "secretary_of_state");
    expect(found?.label).toBe("Secretary of State");
  });
});

// ── DOL_STATUS ─────────────────────────────────────────────────────────────

describe("DOL_STATUS", () => {
  it("has exactly 5 entries", () => {
    expect(DOL_STATUS).toHaveLength(5);
  });

  it("each entry has status and label properties", () => {
    for (const entry of DOL_STATUS) {
      expect(typeof entry.status).toBe("string");
      expect(typeof entry.label).toBe("string");
    }
  });

  it("has unique status values", () => {
    const statuses = DOL_STATUS.map((e) => e.status);
    expect(new Set(statuses).size).toBe(statuses.length);
  });

  it("contains expected statuses", () => {
    const statuses = DOL_STATUS.map((e) => e.status);
    expect(statuses).toContain("active");
    expect(statuses).toContain("expired");
    expect(statuses).toContain("revoked");
    expect(statuses).toContain("under_review");
    expect(statuses).toContain("pending");
  });

  it("has correct label for active", () => {
    const found = DOL_STATUS.find((e) => e.status === "active");
    expect(found?.label).toBe("Active");
  });

  it("has correct label for under_review", () => {
    const found = DOL_STATUS.find((e) => e.status === "under_review");
    expect(found?.label).toBe("Under Review");
  });

  it("has correct label for expired", () => {
    const found = DOL_STATUS.find((e) => e.status === "expired");
    expect(found?.label).toBe("Expired");
  });

  it("has correct label for revoked", () => {
    const found = DOL_STATUS.find((e) => e.status === "revoked");
    expect(found?.label).toBe("Revoked");
  });

  it("has correct label for pending", () => {
    const found = DOL_STATUS.find((e) => e.status === "pending");
    expect(found?.label).toBe("Pending");
  });
});

// ── RESTRICTION_TYPES ──────────────────────────────────────────────────────

describe("RESTRICTION_TYPES", () => {
  it("has exactly 10 entries", () => {
    expect(RESTRICTION_TYPES).toHaveLength(10);
  });

  it("each entry has type and label properties", () => {
    for (const entry of RESTRICTION_TYPES) {
      expect(typeof entry.type).toBe("string");
      expect(typeof entry.label).toBe("string");
    }
  });

  it("has unique type values", () => {
    const types = RESTRICTION_TYPES.map((e) => e.type);
    expect(new Set(types).size).toBe(types.length);
  });

  it("contains expected restriction types", () => {
    const types = RESTRICTION_TYPES.map((e) => e.type);
    expect(types).toContain("movement");
    expect(types).toContain("communication");
    expect(types).toContain("association");
    expect(types).toContain("internet");
    expect(types).toContain("mobile_phone");
    expect(types).toContain("bedroom_door_lock");
    expect(types).toContain("bathroom_lock");
    expect(types).toContain("kitchen_access");
    expect(types).toContain("leave_home");
    expect(types).toContain("contact_with_person");
  });

  it("has correct label for movement", () => {
    const found = RESTRICTION_TYPES.find((e) => e.type === "movement");
    expect(found?.label).toBe("Movement Restriction");
  });

  it("has correct label for bedroom_door_lock", () => {
    const found = RESTRICTION_TYPES.find((e) => e.type === "bedroom_door_lock");
    expect(found?.label).toBe("Bedroom Door Lock");
  });

  it("has correct label for contact_with_person", () => {
    const found = RESTRICTION_TYPES.find((e) => e.type === "contact_with_person");
    expect(found?.label).toBe("Contact with Named Person");
  });

  it("has correct label for kitchen_access", () => {
    const found = RESTRICTION_TYPES.find((e) => e.type === "kitchen_access");
    expect(found?.label).toBe("Kitchen Access Restriction");
  });
});

// ── LEGAL_BASIS_OPTIONS ────────────────────────────────────────────────────

describe("LEGAL_BASIS_OPTIONS", () => {
  it("has exactly 5 entries", () => {
    expect(LEGAL_BASIS_OPTIONS).toHaveLength(5);
  });

  it("each entry has basis and label properties", () => {
    for (const entry of LEGAL_BASIS_OPTIONS) {
      expect(typeof entry.basis).toBe("string");
      expect(typeof entry.label).toBe("string");
    }
  });

  it("has unique basis values", () => {
    const bases = LEGAL_BASIS_OPTIONS.map((e) => e.basis);
    expect(new Set(bases).size).toBe(bases.length);
  });

  it("contains expected legal bases", () => {
    const bases = LEGAL_BASIS_OPTIONS.map((e) => e.basis);
    expect(bases).toContain("court_order");
    expect(bases).toContain("risk_assessment");
    expect(bases).toContain("placement_plan");
    expect(bases).toContain("behaviour_support_plan");
    expect(bases).toContain("safeguarding");
  });

  it("has correct label for court_order", () => {
    const found = LEGAL_BASIS_OPTIONS.find((e) => e.basis === "court_order");
    expect(found?.label).toBe("Court Order");
  });

  it("has correct label for behaviour_support_plan", () => {
    const found = LEGAL_BASIS_OPTIONS.find((e) => e.basis === "behaviour_support_plan");
    expect(found?.label).toBe("Behaviour Support Plan");
  });

  it("has correct label for safeguarding", () => {
    const found = LEGAL_BASIS_OPTIONS.find((e) => e.basis === "safeguarding");
    expect(found?.label).toBe("Safeguarding");
  });

  it("has correct label for risk_assessment", () => {
    const found = LEGAL_BASIS_OPTIONS.find((e) => e.basis === "risk_assessment");
    expect(found?.label).toBe("Risk Assessment");
  });

  it("has correct label for placement_plan", () => {
    const found = LEGAL_BASIS_OPTIONS.find((e) => e.basis === "placement_plan");
    expect(found?.label).toBe("Placement Plan");
  });
});

// ── REVIEW_FREQUENCY ───────────────────────────────────────────────────────

describe("REVIEW_FREQUENCY", () => {
  it("has exactly 4 entries", () => {
    expect(REVIEW_FREQUENCY).toHaveLength(4);
  });

  it("each entry has frequency and label properties", () => {
    for (const entry of REVIEW_FREQUENCY) {
      expect(typeof entry.frequency).toBe("string");
      expect(typeof entry.label).toBe("string");
    }
  });

  it("has unique frequency values", () => {
    const freqs = REVIEW_FREQUENCY.map((e) => e.frequency);
    expect(new Set(freqs).size).toBe(freqs.length);
  });

  it("contains expected frequencies", () => {
    const freqs = REVIEW_FREQUENCY.map((e) => e.frequency);
    expect(freqs).toContain("daily");
    expect(freqs).toContain("weekly");
    expect(freqs).toContain("fortnightly");
    expect(freqs).toContain("monthly");
  });

  it("has correct label for daily", () => {
    const found = REVIEW_FREQUENCY.find((e) => e.frequency === "daily");
    expect(found?.label).toBe("Daily");
  });

  it("has correct label for fortnightly", () => {
    const found = REVIEW_FREQUENCY.find((e) => e.frequency === "fortnightly");
    expect(found?.label).toBe("Fortnightly");
  });

  it("has correct label for weekly", () => {
    const found = REVIEW_FREQUENCY.find((e) => e.frequency === "weekly");
    expect(found?.label).toBe("Weekly");
  });

  it("has correct label for monthly", () => {
    const found = REVIEW_FREQUENCY.find((e) => e.frequency === "monthly");
    expect(found?.label).toBe("Monthly");
  });
});

// ── RESTRICTION_STATUS ─────────────────────────────────────────────────────

describe("RESTRICTION_STATUS", () => {
  it("has exactly 3 entries", () => {
    expect(RESTRICTION_STATUS).toHaveLength(3);
  });

  it("each entry has status and label properties", () => {
    for (const entry of RESTRICTION_STATUS) {
      expect(typeof entry.status).toBe("string");
      expect(typeof entry.label).toBe("string");
    }
  });

  it("has unique status values", () => {
    const statuses = RESTRICTION_STATUS.map((e) => e.status);
    expect(new Set(statuses).size).toBe(statuses.length);
  });

  it("contains expected statuses", () => {
    const statuses = RESTRICTION_STATUS.map((e) => e.status);
    expect(statuses).toContain("active");
    expect(statuses).toContain("ended");
    expect(statuses).toContain("under_review");
  });

  it("has correct label for active", () => {
    const found = RESTRICTION_STATUS.find((e) => e.status === "active");
    expect(found?.label).toBe("Active");
  });

  it("has correct label for ended", () => {
    const found = RESTRICTION_STATUS.find((e) => e.status === "ended");
    expect(found?.label).toBe("Ended");
  });

  it("has correct label for under_review", () => {
    const found = RESTRICTION_STATUS.find((e) => e.status === "under_review");
    expect(found?.label).toBe("Under Review");
  });
});

// ── computeDoLMetrics ──────────────────────────────────────────────────────

describe("computeDoLMetrics", () => {
  it("returns zeroed metrics for empty arrays", () => {
    const result = computeDoLMetrics([], []);
    expect(result.active_orders).toBe(0);
    expect(result.active_restrictions).toBe(0);
    expect(result.overdue_reviews).toBe(0);
    expect(result.child_consultation_rate).toBe(100);
    expect(result.proportionality_rate).toBe(100);
    expect(result.restrictions_by_type).toEqual({});
  });

  it("counts active orders only", () => {
    const result = computeDoLMetrics(
      [
        makeOrder({ id: "o1", status: "active" }),
        makeOrder({ id: "o2", status: "expired" }),
        makeOrder({ id: "o3", status: "active" }),
        makeOrder({ id: "o4", status: "revoked" }),
        makeOrder({ id: "o5", status: "pending" }),
      ],
      [],
    );
    expect(result.active_orders).toBe(2);
  });

  it("does not count expired orders as active", () => {
    const result = computeDoLMetrics(
      [makeOrder({ status: "expired" })],
      [],
    );
    expect(result.active_orders).toBe(0);
  });

  it("does not count revoked orders as active", () => {
    const result = computeDoLMetrics(
      [makeOrder({ status: "revoked" })],
      [],
    );
    expect(result.active_orders).toBe(0);
  });

  it("does not count under_review orders as active", () => {
    const result = computeDoLMetrics(
      [makeOrder({ status: "under_review" })],
      [],
    );
    expect(result.active_orders).toBe(0);
  });

  it("does not count pending orders as active", () => {
    const result = computeDoLMetrics(
      [makeOrder({ status: "pending" })],
      [],
    );
    expect(result.active_orders).toBe(0);
  });

  it("counts active restrictions only", () => {
    const result = computeDoLMetrics(
      [],
      [
        makeRestriction({ id: "r1", status: "active" }),
        makeRestriction({ id: "r2", status: "ended" }),
        makeRestriction({ id: "r3", status: "active" }),
        makeRestriction({ id: "r4", status: "under_review" }),
      ],
    );
    expect(result.active_restrictions).toBe(2);
  });

  it("does not count ended restrictions as active", () => {
    const result = computeDoLMetrics(
      [],
      [makeRestriction({ status: "ended" })],
    );
    expect(result.active_restrictions).toBe(0);
  });

  it("does not count under_review restrictions as active", () => {
    const result = computeDoLMetrics(
      [],
      [makeRestriction({ status: "under_review" })],
    );
    expect(result.active_restrictions).toBe(0);
  });

  // ── Overdue reviews ──

  it("counts overdue order reviews for active orders with past review_date", () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 10);
    const result = computeDoLMetrics(
      [makeOrder({ status: "active", review_date: pastDate.toISOString().split("T")[0] })],
      [],
    );
    expect(result.overdue_reviews).toBe(1);
  });

  it("does not count future order review dates as overdue", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const result = computeDoLMetrics(
      [makeOrder({ status: "active", review_date: futureDate.toISOString().split("T")[0] })],
      [],
    );
    expect(result.overdue_reviews).toBe(0);
  });

  it("does not count overdue reviews for non-active orders", () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 10);
    const result = computeDoLMetrics(
      [makeOrder({ status: "expired", review_date: pastDate.toISOString().split("T")[0] })],
      [],
    );
    expect(result.overdue_reviews).toBe(0);
  });

  it("counts overdue restriction reviews for active restrictions with past next_review_date", () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);
    const result = computeDoLMetrics(
      [],
      [makeRestriction({ status: "active", next_review_date: pastDate.toISOString().split("T")[0] })],
    );
    expect(result.overdue_reviews).toBe(1);
  });

  it("does not count future restriction review dates as overdue", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const result = computeDoLMetrics(
      [],
      [makeRestriction({ status: "active", next_review_date: futureDate.toISOString().split("T")[0] })],
    );
    expect(result.overdue_reviews).toBe(0);
  });

  it("does not count overdue reviews for ended restrictions", () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);
    const result = computeDoLMetrics(
      [],
      [makeRestriction({ status: "ended", next_review_date: pastDate.toISOString().split("T")[0] })],
    );
    expect(result.overdue_reviews).toBe(0);
  });

  it("combines overdue reviews from both orders and restrictions", () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 10);
    const result = computeDoLMetrics(
      [makeOrder({ id: "o1", status: "active", review_date: pastDate.toISOString().split("T")[0] })],
      [makeRestriction({ id: "r1", status: "active", next_review_date: pastDate.toISOString().split("T")[0] })],
    );
    expect(result.overdue_reviews).toBe(2);
  });

  // ── Child consultation rate ──

  it("computes child_consultation_rate as 100% when all active restrictions consulted", () => {
    const result = computeDoLMetrics(
      [],
      [
        makeRestriction({ id: "r1", status: "active", child_consulted: true }),
        makeRestriction({ id: "r2", status: "active", child_consulted: true }),
      ],
    );
    expect(result.child_consultation_rate).toBe(100);
  });

  it("computes child_consultation_rate as 0% when no active restrictions consulted", () => {
    const result = computeDoLMetrics(
      [],
      [
        makeRestriction({ id: "r1", status: "active", child_consulted: false }),
        makeRestriction({ id: "r2", status: "active", child_consulted: false }),
      ],
    );
    expect(result.child_consultation_rate).toBe(0);
  });

  it("computes child_consultation_rate as 50% for mixed consultation", () => {
    const result = computeDoLMetrics(
      [],
      [
        makeRestriction({ id: "r1", status: "active", child_consulted: true }),
        makeRestriction({ id: "r2", status: "active", child_consulted: false }),
      ],
    );
    expect(result.child_consultation_rate).toBe(50);
  });

  it("returns 100 child_consultation_rate when no active restrictions exist", () => {
    const result = computeDoLMetrics([], []);
    expect(result.child_consultation_rate).toBe(100);
  });

  it("only counts active restrictions for child_consultation_rate", () => {
    const result = computeDoLMetrics(
      [],
      [
        makeRestriction({ id: "r1", status: "active", child_consulted: true }),
        makeRestriction({ id: "r2", status: "ended", child_consulted: false }),
      ],
    );
    expect(result.child_consultation_rate).toBe(100);
  });

  it("rounds child_consultation_rate to nearest integer", () => {
    const result = computeDoLMetrics(
      [],
      [
        makeRestriction({ id: "r1", status: "active", child_consulted: true }),
        makeRestriction({ id: "r2", status: "active", child_consulted: false }),
        makeRestriction({ id: "r3", status: "active", child_consulted: true }),
      ],
    );
    // 2/3 = 66.666...% -> 67
    expect(result.child_consultation_rate).toBe(67);
  });

  // ── Proportionality rate ──

  it("computes proportionality_rate as 100% when all active restrictions proportionate", () => {
    const result = computeDoLMetrics(
      [],
      [
        makeRestriction({ id: "r1", status: "active", proportionate: true }),
        makeRestriction({ id: "r2", status: "active", proportionate: true }),
      ],
    );
    expect(result.proportionality_rate).toBe(100);
  });

  it("computes proportionality_rate as 0% when no active restrictions proportionate", () => {
    const result = computeDoLMetrics(
      [],
      [
        makeRestriction({ id: "r1", status: "active", proportionate: false }),
        makeRestriction({ id: "r2", status: "active", proportionate: false }),
      ],
    );
    expect(result.proportionality_rate).toBe(0);
  });

  it("computes proportionality_rate as 50% for mixed proportionality", () => {
    const result = computeDoLMetrics(
      [],
      [
        makeRestriction({ id: "r1", status: "active", proportionate: true }),
        makeRestriction({ id: "r2", status: "active", proportionate: false }),
      ],
    );
    expect(result.proportionality_rate).toBe(50);
  });

  it("returns 100 proportionality_rate when no active restrictions exist", () => {
    const result = computeDoLMetrics([], []);
    expect(result.proportionality_rate).toBe(100);
  });

  it("only counts active restrictions for proportionality_rate", () => {
    const result = computeDoLMetrics(
      [],
      [
        makeRestriction({ id: "r1", status: "active", proportionate: true }),
        makeRestriction({ id: "r2", status: "ended", proportionate: false }),
      ],
    );
    expect(result.proportionality_rate).toBe(100);
  });

  it("rounds proportionality_rate to nearest integer", () => {
    const result = computeDoLMetrics(
      [],
      [
        makeRestriction({ id: "r1", status: "active", proportionate: true }),
        makeRestriction({ id: "r2", status: "active", proportionate: false }),
        makeRestriction({ id: "r3", status: "active", proportionate: true }),
      ],
    );
    // 2/3 = 66.666...% -> 67
    expect(result.proportionality_rate).toBe(67);
  });

  // ── Restrictions by type ──

  it("groups active restrictions by type", () => {
    const result = computeDoLMetrics(
      [],
      [
        makeRestriction({ id: "r1", status: "active", restriction_type: "movement" }),
        makeRestriction({ id: "r2", status: "active", restriction_type: "movement" }),
        makeRestriction({ id: "r3", status: "active", restriction_type: "internet" }),
        makeRestriction({ id: "r4", status: "active", restriction_type: "communication" }),
      ],
    );
    expect(result.restrictions_by_type).toEqual({
      movement: 2,
      internet: 1,
      communication: 1,
    });
  });

  it("does not include ended restrictions in restrictions_by_type", () => {
    const result = computeDoLMetrics(
      [],
      [
        makeRestriction({ id: "r1", status: "active", restriction_type: "movement" }),
        makeRestriction({ id: "r2", status: "ended", restriction_type: "internet" }),
      ],
    );
    expect(result.restrictions_by_type).toEqual({ movement: 1 });
  });

  it("returns empty restrictions_by_type when no active restrictions", () => {
    const result = computeDoLMetrics(
      [],
      [makeRestriction({ status: "ended", restriction_type: "movement" })],
    );
    expect(result.restrictions_by_type).toEqual({});
  });

  // ── Combined metrics ──

  it("handles mixed orders and restrictions together", () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 10);
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const result = computeDoLMetrics(
      [
        makeOrder({ id: "o1", status: "active", review_date: futureDate.toISOString().split("T")[0] }),
        makeOrder({ id: "o2", status: "expired" }),
      ],
      [
        makeRestriction({ id: "r1", status: "active", child_consulted: true, proportionate: true, restriction_type: "movement", next_review_date: futureDate.toISOString().split("T")[0] }),
        makeRestriction({ id: "r2", status: "active", child_consulted: false, proportionate: false, restriction_type: "internet", next_review_date: pastDate.toISOString().split("T")[0] }),
        makeRestriction({ id: "r3", status: "ended" }),
      ],
    );
    expect(result.active_orders).toBe(1);
    expect(result.active_restrictions).toBe(2);
    expect(result.overdue_reviews).toBe(1);
    expect(result.child_consultation_rate).toBe(50);
    expect(result.proportionality_rate).toBe(50);
    expect(result.restrictions_by_type).toEqual({ movement: 1, internet: 1 });
  });
});

// ── identifyDoLAlerts ──────────────────────────────────────────────────────

describe("identifyDoLAlerts", () => {
  it("returns empty array when no records exist", () => {
    const result = identifyDoLAlerts([], []);
    expect(result).toEqual([]);
  });

  it("returns alerts with correct structure", () => {
    const result = identifyDoLAlerts(
      [makeOrder({ status: "active", irm_notified: false })],
      [],
    );
    expect(result.length).toBeGreaterThan(0);
    for (const alert of result) {
      expect(alert).toHaveProperty("type");
      expect(alert).toHaveProperty("severity");
      expect(alert).toHaveProperty("message");
      expect(["critical", "high", "medium", "low"]).toContain(alert.severity);
    }
  });

  // ── Order expired alerts ──

  it("generates critical alert for active order that has expired", () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);
    const result = identifyDoLAlerts(
      [makeOrder({
        status: "active",
        end_date: pastDate.toISOString().split("T")[0],
        order_reference: "DOL-EXPIRED",
        child_name: "Beth Cooper",
      })],
      [],
    );
    const alerts = result.filter((a) => a.type === "order_expired");
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe("critical");
    expect(alerts[0].message).toContain("DOL-EXPIRED");
    expect(alerts[0].message).toContain("Beth Cooper");
    expect(alerts[0].message).toContain("Reg 20");
  });

  it("does not generate order_expired for non-active orders", () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);
    const result = identifyDoLAlerts(
      [makeOrder({ status: "expired", end_date: pastDate.toISOString().split("T")[0] })],
      [],
    );
    const alerts = result.filter((a) => a.type === "order_expired");
    expect(alerts).toHaveLength(0);
  });

  // ── Order expiring alerts ──

  it("generates high alert for active order expiring within 14 days", () => {
    const soonDate = new Date();
    soonDate.setDate(soonDate.getDate() + 7);
    const result = identifyDoLAlerts(
      [makeOrder({
        status: "active",
        end_date: soonDate.toISOString().split("T")[0],
        order_reference: "DOL-EXPIRING",
        child_name: "Chris Davis",
        authorising_body: "family_court",
      })],
      [],
    );
    const alerts = result.filter((a) => a.type === "order_expiring");
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe("high");
    expect(alerts[0].message).toContain("DOL-EXPIRING");
    expect(alerts[0].message).toContain("Chris Davis");
    expect(alerts[0].message).toContain("family_court");
  });

  it("generates order_expiring alert for order expiring in exactly 1 day", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const result = identifyDoLAlerts(
      [makeOrder({ status: "active", end_date: tomorrow.toISOString().split("T")[0] })],
      [],
    );
    const alerts = result.filter((a) => a.type === "order_expiring");
    expect(alerts).toHaveLength(1);
    expect(alerts[0].message).toContain("1 day");
    // singular form check
    expect(alerts[0].message).not.toContain("1 days");
  });

  it("generates order_expiring alert for order expiring in exactly 14 days", () => {
    const in14Days = new Date();
    in14Days.setDate(in14Days.getDate() + 14);
    const result = identifyDoLAlerts(
      [makeOrder({ status: "active", end_date: in14Days.toISOString().split("T")[0] })],
      [],
    );
    const alerts = result.filter((a) => a.type === "order_expiring");
    expect(alerts).toHaveLength(1);
    expect(alerts[0].message).toContain("14 days");
  });

  it("does not generate order_expiring for order more than 14 days away", () => {
    const farDate = new Date();
    farDate.setDate(farDate.getDate() + 30);
    const result = identifyDoLAlerts(
      [makeOrder({ status: "active", end_date: farDate.toISOString().split("T")[0] })],
      [],
    );
    const alerts = result.filter((a) => a.type === "order_expiring");
    expect(alerts).toHaveLength(0);
  });

  it("does not generate order_expiring for non-active orders", () => {
    const soonDate = new Date();
    soonDate.setDate(soonDate.getDate() + 5);
    const result = identifyDoLAlerts(
      [makeOrder({ status: "pending", end_date: soonDate.toISOString().split("T")[0] })],
      [],
    );
    const alerts = result.filter((a) => a.type === "order_expiring");
    expect(alerts).toHaveLength(0);
  });

  // ── Order review overdue alerts ──

  it("generates high alert for overdue order review", () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 15);
    const result = identifyDoLAlerts(
      [makeOrder({
        status: "active",
        review_date: pastDate.toISOString().split("T")[0],
        order_reference: "DOL-OVERDUE",
        child_name: "Dana Ellis",
      })],
      [],
    );
    const alerts = result.filter((a) => a.type === "order_review_overdue");
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe("high");
    expect(alerts[0].message).toContain("DOL-OVERDUE");
    expect(alerts[0].message).toContain("Dana Ellis");
    expect(alerts[0].message).toContain("Reg 20");
  });

  it("includes correct days overdue count in order review alert", () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 7);
    const result = identifyDoLAlerts(
      [makeOrder({ status: "active", review_date: pastDate.toISOString().split("T")[0] })],
      [],
    );
    const alerts = result.filter((a) => a.type === "order_review_overdue");
    expect(alerts).toHaveLength(1);
    expect(alerts[0].message).toMatch(/\d+ day/);
    expect(alerts[0].message).toContain("overdue");
  });

  it("does not generate order_review_overdue for future review dates", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const result = identifyDoLAlerts(
      [makeOrder({ status: "active", review_date: futureDate.toISOString().split("T")[0] })],
      [],
    );
    const alerts = result.filter((a) => a.type === "order_review_overdue");
    expect(alerts).toHaveLength(0);
  });

  it("does not generate order_review_overdue for non-active orders", () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 15);
    const result = identifyDoLAlerts(
      [makeOrder({ status: "revoked", review_date: pastDate.toISOString().split("T")[0] })],
      [],
    );
    const alerts = result.filter((a) => a.type === "order_review_overdue");
    expect(alerts).toHaveLength(0);
  });

  // ── IRM not notified alerts ──

  it("generates high alert when IRM not notified for active order", () => {
    const result = identifyDoLAlerts(
      [makeOrder({
        status: "active",
        irm_notified: false,
        order_reference: "DOL-IRM",
        child_name: "Eve Fox",
      })],
      [],
    );
    const alerts = result.filter((a) => a.type === "irm_not_notified");
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe("high");
    expect(alerts[0].message).toContain("DOL-IRM");
    expect(alerts[0].message).toContain("Eve Fox");
    expect(alerts[0].message).toContain("IRM");
  });

  it("does not generate irm_not_notified when IRM is notified", () => {
    const result = identifyDoLAlerts(
      [makeOrder({ status: "active", irm_notified: true })],
      [],
    );
    const alerts = result.filter((a) => a.type === "irm_not_notified");
    expect(alerts).toHaveLength(0);
  });

  it("does not generate irm_not_notified for non-active orders", () => {
    const result = identifyDoLAlerts(
      [makeOrder({ status: "expired", irm_notified: false })],
      [],
    );
    const alerts = result.filter((a) => a.type === "irm_not_notified");
    expect(alerts).toHaveLength(0);
  });

  // ── Ofsted not notified alerts ──

  it("generates high alert when Ofsted not notified for active order", () => {
    const result = identifyDoLAlerts(
      [makeOrder({
        status: "active",
        ofsted_notified: false,
        order_reference: "DOL-OFSTED",
        child_name: "Fred Grant",
      })],
      [],
    );
    const alerts = result.filter((a) => a.type === "ofsted_not_notified");
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe("high");
    expect(alerts[0].message).toContain("DOL-OFSTED");
    expect(alerts[0].message).toContain("Fred Grant");
    expect(alerts[0].message).toContain("Reg 40");
  });

  it("does not generate ofsted_not_notified when Ofsted is notified", () => {
    const result = identifyDoLAlerts(
      [makeOrder({ status: "active", ofsted_notified: true })],
      [],
    );
    const alerts = result.filter((a) => a.type === "ofsted_not_notified");
    expect(alerts).toHaveLength(0);
  });

  it("does not generate ofsted_not_notified for non-active orders", () => {
    const result = identifyDoLAlerts(
      [makeOrder({ status: "revoked", ofsted_notified: false })],
      [],
    );
    const alerts = result.filter((a) => a.type === "ofsted_not_notified");
    expect(alerts).toHaveLength(0);
  });

  // ── Missing justification (orders) ──

  it("generates critical alert for active order with missing justification", () => {
    const result = identifyDoLAlerts(
      [makeOrder({
        status: "active",
        justification: "",
        order_reference: "DOL-NOJUST",
        child_name: "Gina Harris",
      })],
      [],
    );
    const alerts = result.filter((a) => a.type === "missing_justification");
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe("critical");
    expect(alerts[0].message).toContain("DOL-NOJUST");
    expect(alerts[0].message).toContain("Gina Harris");
    expect(alerts[0].message).toContain("Reg 20");
  });

  it("generates critical alert for active order with whitespace-only justification", () => {
    const result = identifyDoLAlerts(
      [makeOrder({ status: "active", justification: "   " })],
      [],
    );
    const alerts = result.filter((a) => a.type === "missing_justification");
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe("critical");
  });

  it("does not generate missing_justification when justification is present", () => {
    const result = identifyDoLAlerts(
      [makeOrder({ status: "active", justification: "Required for child safety" })],
      [],
    );
    const alerts = result.filter((a) => a.type === "missing_justification");
    expect(alerts).toHaveLength(0);
  });

  it("does not generate missing_justification for non-active orders", () => {
    const result = identifyDoLAlerts(
      [makeOrder({ status: "expired", justification: "" })],
      [],
    );
    const alerts = result.filter((a) => a.type === "missing_justification");
    expect(alerts).toHaveLength(0);
  });

  // ── Restriction review overdue alerts ──

  it("generates high alert for overdue restriction review", () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 12);
    const result = identifyDoLAlerts(
      [],
      [makeRestriction({
        status: "active",
        next_review_date: pastDate.toISOString().split("T")[0],
        restriction_type: "internet",
        child_name: "Hank Irving",
      })],
    );
    const alerts = result.filter((a) => a.type === "restriction_review_overdue");
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe("high");
    expect(alerts[0].message).toContain("internet");
    expect(alerts[0].message).toContain("Hank Irving");
    expect(alerts[0].message).toContain("Reg 20/21");
  });

  it("includes correct overdue days in restriction review alert", () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 7);
    const result = identifyDoLAlerts(
      [],
      [makeRestriction({ status: "active", next_review_date: pastDate.toISOString().split("T")[0] })],
    );
    const alerts = result.filter((a) => a.type === "restriction_review_overdue");
    expect(alerts).toHaveLength(1);
    expect(alerts[0].message).toMatch(/\d+ day/);
    expect(alerts[0].message).toContain("overdue");
  });

  it("does not generate restriction_review_overdue for future review dates", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 14);
    const result = identifyDoLAlerts(
      [],
      [makeRestriction({ status: "active", next_review_date: futureDate.toISOString().split("T")[0] })],
    );
    const alerts = result.filter((a) => a.type === "restriction_review_overdue");
    expect(alerts).toHaveLength(0);
  });

  it("does not generate restriction_review_overdue for ended restrictions", () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 10);
    const result = identifyDoLAlerts(
      [],
      [makeRestriction({ status: "ended", next_review_date: pastDate.toISOString().split("T")[0] })],
    );
    const alerts = result.filter((a) => a.type === "restriction_review_overdue");
    expect(alerts).toHaveLength(0);
  });

  // ── Child not consulted alerts ──

  it("generates medium alert when child not consulted about active restriction", () => {
    const result = identifyDoLAlerts(
      [],
      [makeRestriction({
        status: "active",
        child_consulted: false,
        child_name: "Ivy James",
        restriction_type: "communication",
      })],
    );
    const alerts = result.filter((a) => a.type === "child_not_consulted");
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe("medium");
    expect(alerts[0].message).toContain("Ivy James");
    expect(alerts[0].message).toContain("communication");
    expect(alerts[0].message).toContain("Children Act 1989");
  });

  it("does not generate child_not_consulted when child is consulted", () => {
    const result = identifyDoLAlerts(
      [],
      [makeRestriction({ status: "active", child_consulted: true })],
    );
    const alerts = result.filter((a) => a.type === "child_not_consulted");
    expect(alerts).toHaveLength(0);
  });

  it("does not generate child_not_consulted for ended restrictions", () => {
    const result = identifyDoLAlerts(
      [],
      [makeRestriction({ status: "ended", child_consulted: false })],
    );
    const alerts = result.filter((a) => a.type === "child_not_consulted");
    expect(alerts).toHaveLength(0);
  });

  // ── Social worker not informed alerts ──

  it("generates medium alert when social worker not informed about active restriction", () => {
    const result = identifyDoLAlerts(
      [],
      [makeRestriction({
        status: "active",
        social_worker_informed: false,
        child_name: "Jake King",
        restriction_type: "association",
      })],
    );
    const alerts = result.filter((a) => a.type === "social_worker_not_informed");
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe("medium");
    expect(alerts[0].message).toContain("Jake King");
    expect(alerts[0].message).toContain("association");
  });

  it("does not generate social_worker_not_informed when social worker is informed", () => {
    const result = identifyDoLAlerts(
      [],
      [makeRestriction({ status: "active", social_worker_informed: true })],
    );
    const alerts = result.filter((a) => a.type === "social_worker_not_informed");
    expect(alerts).toHaveLength(0);
  });

  it("does not generate social_worker_not_informed for ended restrictions", () => {
    const result = identifyDoLAlerts(
      [],
      [makeRestriction({ status: "ended", social_worker_informed: false })],
    );
    const alerts = result.filter((a) => a.type === "social_worker_not_informed");
    expect(alerts).toHaveLength(0);
  });

  // ── Disproportionate restriction alerts ──

  it("generates critical alert for active restriction flagged as not proportionate", () => {
    const result = identifyDoLAlerts(
      [],
      [makeRestriction({
        status: "active",
        proportionate: false,
        child_name: "Kate Lewis",
        restriction_type: "movement",
      })],
    );
    const alerts = result.filter((a) => a.type === "disproportionate_restriction");
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe("critical");
    expect(alerts[0].message).toContain("Kate Lewis");
    expect(alerts[0].message).toContain("movement");
    expect(alerts[0].message).toContain("Reg 20");
  });

  it("does not generate disproportionate_restriction when proportionate is true", () => {
    const result = identifyDoLAlerts(
      [],
      [makeRestriction({ status: "active", proportionate: true })],
    );
    const alerts = result.filter((a) => a.type === "disproportionate_restriction");
    expect(alerts).toHaveLength(0);
  });

  it("does not generate disproportionate_restriction for ended restrictions", () => {
    const result = identifyDoLAlerts(
      [],
      [makeRestriction({ status: "ended", proportionate: false })],
    );
    const alerts = result.filter((a) => a.type === "disproportionate_restriction");
    expect(alerts).toHaveLength(0);
  });

  // ── Missing restriction justification alerts ──

  it("generates high alert for active restriction with empty justification", () => {
    const result = identifyDoLAlerts(
      [],
      [makeRestriction({
        status: "active",
        justification: "",
        child_name: "Leo Moore",
        restriction_type: "bedroom_door_lock",
      })],
    );
    const alerts = result.filter((a) => a.type === "missing_restriction_justification");
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe("high");
    expect(alerts[0].message).toContain("Leo Moore");
    expect(alerts[0].message).toContain("bedroom_door_lock");
    expect(alerts[0].message).toContain("Reg 20");
  });

  it("generates high alert for active restriction with whitespace-only justification", () => {
    const result = identifyDoLAlerts(
      [],
      [makeRestriction({ status: "active", justification: "   " })],
    );
    const alerts = result.filter((a) => a.type === "missing_restriction_justification");
    expect(alerts).toHaveLength(1);
  });

  it("does not generate missing_restriction_justification when justification present", () => {
    const result = identifyDoLAlerts(
      [],
      [makeRestriction({ status: "active", justification: "Necessary for safeguarding" })],
    );
    const alerts = result.filter((a) => a.type === "missing_restriction_justification");
    expect(alerts).toHaveLength(0);
  });

  it("does not generate missing_restriction_justification for ended restrictions", () => {
    const result = identifyDoLAlerts(
      [],
      [makeRestriction({ status: "ended", justification: "" })],
    );
    const alerts = result.filter((a) => a.type === "missing_restriction_justification");
    expect(alerts).toHaveLength(0);
  });

  // ── Multiple alerts from a single order ──

  it("generates multiple alerts for a single problematic order", () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 10);
    const result = identifyDoLAlerts(
      [makeOrder({
        status: "active",
        end_date: pastDate.toISOString().split("T")[0],
        review_date: pastDate.toISOString().split("T")[0],
        irm_notified: false,
        ofsted_notified: false,
        justification: "",
      })],
      [],
    );
    const types = result.map((a) => a.type);
    expect(types).toContain("order_expired");
    expect(types).toContain("order_review_overdue");
    expect(types).toContain("irm_not_notified");
    expect(types).toContain("ofsted_not_notified");
    expect(types).toContain("missing_justification");
  });

  // ── Multiple alerts from a single restriction ──

  it("generates multiple alerts for a single problematic restriction", () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);
    const result = identifyDoLAlerts(
      [],
      [makeRestriction({
        status: "active",
        next_review_date: pastDate.toISOString().split("T")[0],
        child_consulted: false,
        social_worker_informed: false,
        proportionate: false,
        justification: "",
      })],
    );
    const types = result.map((a) => a.type);
    expect(types).toContain("restriction_review_overdue");
    expect(types).toContain("child_not_consulted");
    expect(types).toContain("social_worker_not_informed");
    expect(types).toContain("disproportionate_restriction");
    expect(types).toContain("missing_restriction_justification");
  });

  // ── Combined order and restriction alerts ──

  it("generates alerts from both orders and restrictions simultaneously", () => {
    const result = identifyDoLAlerts(
      [makeOrder({ status: "active", irm_notified: false })],
      [makeRestriction({ status: "active", child_consulted: false })],
    );
    const types = result.map((a) => a.type);
    expect(types).toContain("irm_not_notified");
    expect(types).toContain("child_not_consulted");
  });

  // ── Edge cases for non-active statuses ──

  it("generates no alerts for fully compliant active order", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 60);
    const result = identifyDoLAlerts(
      [makeOrder({
        status: "active",
        end_date: futureDate.toISOString().split("T")[0],
        review_date: futureDate.toISOString().split("T")[0],
        irm_notified: true,
        ofsted_notified: true,
        justification: "Fully justified order",
      })],
      [],
    );
    expect(result).toHaveLength(0);
  });

  it("generates no alerts for fully compliant active restriction", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const result = identifyDoLAlerts(
      [],
      [makeRestriction({
        status: "active",
        next_review_date: futureDate.toISOString().split("T")[0],
        child_consulted: true,
        social_worker_informed: true,
        proportionate: true,
        justification: "Required for safety",
      })],
    );
    expect(result).toHaveLength(0);
  });

  it("skips all order alerts for under_review status", () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 10);
    const result = identifyDoLAlerts(
      [makeOrder({
        status: "under_review",
        end_date: pastDate.toISOString().split("T")[0],
        review_date: pastDate.toISOString().split("T")[0],
        irm_notified: false,
        ofsted_notified: false,
        justification: "",
      })],
      [],
    );
    expect(result).toHaveLength(0);
  });

  it("skips all restriction alerts for under_review status", () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);
    const result = identifyDoLAlerts(
      [],
      [makeRestriction({
        status: "under_review",
        next_review_date: pastDate.toISOString().split("T")[0],
        child_consulted: false,
        social_worker_informed: false,
        proportionate: false,
        justification: "",
      })],
    );
    expect(result).toHaveLength(0);
  });

  // ── Multiple records ──

  it("generates alerts for multiple active orders independently", () => {
    const result = identifyDoLAlerts(
      [
        makeOrder({ id: "o1", status: "active", irm_notified: false, child_name: "Mia North" }),
        makeOrder({ id: "o2", status: "active", irm_notified: false, child_name: "Nate Owen" }),
      ],
      [],
    );
    const irmAlerts = result.filter((a) => a.type === "irm_not_notified");
    expect(irmAlerts).toHaveLength(2);
    const names = irmAlerts.map((a) => a.message);
    expect(names.some((m) => m.includes("Mia North"))).toBe(true);
    expect(names.some((m) => m.includes("Nate Owen"))).toBe(true);
  });

  it("generates alerts for multiple active restrictions independently", () => {
    const result = identifyDoLAlerts(
      [],
      [
        makeRestriction({ id: "r1", status: "active", child_consulted: false, child_name: "Olive Park" }),
        makeRestriction({ id: "r2", status: "active", child_consulted: false, child_name: "Paul Quinn" }),
      ],
    );
    const consultAlerts = result.filter((a) => a.type === "child_not_consulted");
    expect(consultAlerts).toHaveLength(2);
  });
});

// ── CRUD — listDoLOrders ───────────────────────────────────────────────────

describe("listDoLOrders", () => {
  it("returns ok with empty array and persisted false when Supabase is disabled", async () => {
    const result = await listDoLOrders("home-1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
      expect((result as { persisted: boolean }).persisted).toBe(false);
    }
  });

  it("returns ok with empty array when called with filters and Supabase is disabled", async () => {
    const result = await listDoLOrders("home-1", {
      childId: "child-1",
      status: "active",
      orderType: "court_order",
      dateFrom: "2026-01-01",
      dateTo: "2026-12-31",
      limit: 50,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });
});

// ── CRUD — createDoLOrder ──────────────────────────────────────────────────

describe("createDoLOrder", () => {
  it("returns error when Supabase is not configured", async () => {
    const result = await createDoLOrder({
      home_id: "home-1",
      child_id: "child-1",
      child_name: "Test Child",
      order_type: "court_order",
      authorising_body: "high_court",
      order_reference: "DOL-TEST",
      start_date: "2026-01-01",
      end_date: "2026-12-31",
      review_date: "2026-06-01",
      conditions: [],
      justification: "Test",
      legal_representative: "Test Rep",
      irm_notified: false,
      ofsted_notified: false,
      status: "active",
      reviewed_by: "Reviewer",
      review_notes: "Notes",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });
});

// ── CRUD — updateDoLOrder ──────────────────────────────────────────────────

describe("updateDoLOrder", () => {
  it("returns error when Supabase is not configured", async () => {
    const result = await updateDoLOrder("dol-1", { status: "expired" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });
});

// ── CRUD — listRestrictions ────────────────────────────────────────────────

describe("listRestrictions", () => {
  it("returns ok with empty array and persisted false when Supabase is disabled", async () => {
    const result = await listRestrictions("home-1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
      expect((result as { persisted: boolean }).persisted).toBe(false);
    }
  });

  it("returns ok with empty array when called with filters and Supabase is disabled", async () => {
    const result = await listRestrictions("home-1", {
      childId: "child-1",
      restrictionType: "movement",
      status: "active",
      legalBasis: "court_order",
      dateFrom: "2026-01-01",
      dateTo: "2026-12-31",
      limit: 50,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });
});

// ── CRUD — createRestriction ───────────────────────────────────────────────

describe("createRestriction", () => {
  it("returns error when Supabase is not configured", async () => {
    const result = await createRestriction({
      home_id: "home-1",
      child_id: "child-1",
      child_name: "Test Child",
      restriction_type: "movement",
      description: "Test restriction",
      justification: "Test justification",
      legal_basis: "court_order",
      start_date: "2026-01-01",
      end_date: null,
      review_frequency: "weekly",
      last_review_date: "2026-01-01",
      next_review_date: "2026-01-08",
      reviewed_by: "Reviewer",
      child_consulted: true,
      child_views: "Child agrees",
      social_worker_informed: true,
      social_worker_informed_date: "2026-01-02",
      parent_informed: true,
      proportionate: true,
      status: "active",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });
});

// ── CRUD — updateRestriction ───────────────────────────────────────────────

describe("updateRestriction", () => {
  it("returns error when Supabase is not configured", async () => {
    const result = await updateRestriction("restr-1", { status: "ended" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });
});
