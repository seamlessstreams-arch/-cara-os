// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF WHISTLEBLOWING INVESTIGATION SERVICE TESTS
// Pure-function tests for whistleblowing investigation metrics, alert
// identification, Cara insight generation, and edge cases.
// CHR 2015 Reg 13 (leadership — open culture for raising concerns),
// Reg 34 (fitness of workers — duty to report),
// Reg 40 (notifications to Ofsted — notifiable events),
// Public Interest Disclosure Act 1998 (PIDA).
//
// Covers: whistleblowing disclosures, investigation management,
// whistleblower protection, regulatory body notifications,
// organisational learning, and policy improvement tracking.
//
// SCCIF: Leadership & Management — "Staff feel confident to raise concerns."
// "Whistleblowing procedures are effective and protective."
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";

import {
  CONCERN_CATEGORIES,
  INVESTIGATION_OUTCOMES,
  INVESTIGATION_STATUSES,
  WHISTLEBLOWER_PROTECTIONS,
  _testing,
} from "../staff-whistleblowing-investigation-service";

import type {
  StaffWhistleblowingInvestigationRow,
} from "../staff-whistleblowing-investigation-service";

const {
  computeStaffWhistleblowingMetrics,
  computeStaffWhistleblowingAlerts,
  generateStaffWhistleblowingCaraInsights,
} = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRow(
  overrides?: Partial<StaffWhistleblowingInvestigationRow>,
): StaffWhistleblowingInvestigationRow {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : crypto.randomUUID(),
    home_id: "home_id" in (overrides ?? {}) ? overrides!.home_id! : "home-1",
    staff_name: "staff_name" in (overrides ?? {}) ? overrides!.staff_name! : "Alice Smith",
    staff_id: "staff_id" in (overrides ?? {}) ? (overrides!.staff_id ?? null) : "staff-1",
    disclosure_date: "disclosure_date" in (overrides ?? {}) ? overrides!.disclosure_date! : now.toISOString().split("T")[0],
    concern_category: "concern_category" in (overrides ?? {}) ? overrides!.concern_category! : "unsafe_practice",
    investigation_outcome: "investigation_outcome" in (overrides ?? {}) ? overrides!.investigation_outcome! : "unsubstantiated",
    investigation_status: "investigation_status" in (overrides ?? {}) ? overrides!.investigation_status! : "closed",
    whistleblower_protection: "whistleblower_protection" in (overrides ?? {}) ? overrides!.whistleblower_protection! : "confidential_disclosure",
    investigating_officer: "investigating_officer" in (overrides ?? {}) ? (overrides!.investigating_officer ?? null) : null,
    whistleblower_supported: "whistleblower_supported" in (overrides ?? {}) ? overrides!.whistleblower_supported! : true,
    no_detriment_confirmed: "no_detriment_confirmed" in (overrides ?? {}) ? overrides!.no_detriment_confirmed! : true,
    regulatory_body_notified: "regulatory_body_notified" in (overrides ?? {}) ? overrides!.regulatory_body_notified! : true,
    organisational_learning_identified: "organisational_learning_identified" in (overrides ?? {}) ? overrides!.organisational_learning_identified! : false,
    learning_shared_with_team: "learning_shared_with_team" in (overrides ?? {}) ? overrides!.learning_shared_with_team! : false,
    policy_change_required: "policy_change_required" in (overrides ?? {}) ? overrides!.policy_change_required! : false,
    completion_date: "completion_date" in (overrides ?? {}) ? (overrides!.completion_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: "created_at" in (overrides ?? {}) ? overrides!.created_at! : now.toISOString(),
    updated_at: "updated_at" in (overrides ?? {}) ? overrides!.updated_at! : now.toISOString(),
  };
}

// ── computeStaffWhistleblowingMetrics ────────────────────────────────────

describe("computeStaffWhistleblowingMetrics", () => {
  describe("empty array", () => {
    it("returns zero total_investigations", () => {
      const m = computeStaffWhistleblowingMetrics([]);
      expect(m.total_investigations).toBe(0);
    });

    it("returns zero substantiated_count", () => {
      const m = computeStaffWhistleblowingMetrics([]);
      expect(m.substantiated_count).toBe(0);
    });

    it("returns zero ongoing_count", () => {
      const m = computeStaffWhistleblowingMetrics([]);
      expect(m.ongoing_count).toBe(0);
    });

    it("returns zero escalated_count", () => {
      const m = computeStaffWhistleblowingMetrics([]);
      expect(m.escalated_count).toBe(0);
    });

    it("returns zero policy_change_count", () => {
      const m = computeStaffWhistleblowingMetrics([]);
      expect(m.policy_change_count).toBe(0);
    });

    it("returns zero whistleblower_supported_rate", () => {
      const m = computeStaffWhistleblowingMetrics([]);
      expect(m.whistleblower_supported_rate).toBe(0);
    });

    it("returns zero no_detriment_rate", () => {
      const m = computeStaffWhistleblowingMetrics([]);
      expect(m.no_detriment_rate).toBe(0);
    });

    it("returns zero regulatory_notified_rate", () => {
      const m = computeStaffWhistleblowingMetrics([]);
      expect(m.regulatory_notified_rate).toBe(0);
    });

    it("returns zero learning_identified_rate", () => {
      const m = computeStaffWhistleblowingMetrics([]);
      expect(m.learning_identified_rate).toBe(0);
    });

    it("returns zero learning_shared_rate", () => {
      const m = computeStaffWhistleblowingMetrics([]);
      expect(m.learning_shared_rate).toBe(0);
    });

    it("returns empty category_breakdown", () => {
      const m = computeStaffWhistleblowingMetrics([]);
      expect(m.category_breakdown).toEqual({});
    });

    it("returns empty outcome_breakdown", () => {
      const m = computeStaffWhistleblowingMetrics([]);
      expect(m.outcome_breakdown).toEqual({});
    });

    it("returns zero unique_staff", () => {
      const m = computeStaffWhistleblowingMetrics([]);
      expect(m.unique_staff).toBe(0);
    });
  });

  describe("single row defaults", () => {
    it("returns total_investigations = 1", () => {
      const m = computeStaffWhistleblowingMetrics([makeRow()]);
      expect(m.total_investigations).toBe(1);
    });

    it("returns 100% for whistleblower_supported_rate with defaults", () => {
      const m = computeStaffWhistleblowingMetrics([makeRow()]);
      expect(m.whistleblower_supported_rate).toBe(100);
    });

    it("returns 100% for no_detriment_rate with defaults", () => {
      const m = computeStaffWhistleblowingMetrics([makeRow()]);
      expect(m.no_detriment_rate).toBe(100);
    });

    it("returns 100% for regulatory_notified_rate with defaults", () => {
      const m = computeStaffWhistleblowingMetrics([makeRow()]);
      expect(m.regulatory_notified_rate).toBe(100);
    });

    it("returns 0% for learning_identified_rate with defaults (false by default)", () => {
      const m = computeStaffWhistleblowingMetrics([makeRow()]);
      expect(m.learning_identified_rate).toBe(0);
    });

    it("returns 0% for learning_shared_rate with defaults (false by default)", () => {
      const m = computeStaffWhistleblowingMetrics([makeRow()]);
      expect(m.learning_shared_rate).toBe(0);
    });

    it("returns unique_staff = 1", () => {
      const m = computeStaffWhistleblowingMetrics([makeRow()]);
      expect(m.unique_staff).toBe(1);
    });
  });

  describe("outcome counting", () => {
    it("counts substantiated", () => {
      const m = computeStaffWhistleblowingMetrics([makeRow({ investigation_outcome: "substantiated" })]);
      expect(m.substantiated_count).toBe(1);
    });

    it("counts ongoing", () => {
      const m = computeStaffWhistleblowingMetrics([makeRow({ investigation_outcome: "ongoing" })]);
      expect(m.ongoing_count).toBe(1);
    });

    it("does not count unsubstantiated as substantiated", () => {
      const m = computeStaffWhistleblowingMetrics([makeRow({ investigation_outcome: "unsubstantiated" })]);
      expect(m.substantiated_count).toBe(0);
    });

    it("does not count inconclusive as ongoing", () => {
      const m = computeStaffWhistleblowingMetrics([makeRow({ investigation_outcome: "inconclusive" })]);
      expect(m.ongoing_count).toBe(0);
    });

    it("counts partially_substantiated in outcome_breakdown", () => {
      const m = computeStaffWhistleblowingMetrics([makeRow({ investigation_outcome: "partially_substantiated" })]);
      expect(m.outcome_breakdown["partially_substantiated"]).toBe(1);
    });
  });

  describe("status counting", () => {
    it("counts escalated status", () => {
      const m = computeStaffWhistleblowingMetrics([makeRow({ investigation_status: "escalated" })]);
      expect(m.escalated_count).toBe(1);
    });

    it("does not count closed as escalated", () => {
      const m = computeStaffWhistleblowingMetrics([makeRow({ investigation_status: "closed" })]);
      expect(m.escalated_count).toBe(0);
    });

    it("does not count received as escalated", () => {
      const m = computeStaffWhistleblowingMetrics([makeRow({ investigation_status: "received" })]);
      expect(m.escalated_count).toBe(0);
    });
  });

  describe("policy_change_count", () => {
    it("counts policy_change_required true", () => {
      const m = computeStaffWhistleblowingMetrics([makeRow({ policy_change_required: true })]);
      expect(m.policy_change_count).toBe(1);
    });

    it("does not count policy_change_required false", () => {
      const m = computeStaffWhistleblowingMetrics([makeRow({ policy_change_required: false })]);
      expect(m.policy_change_count).toBe(0);
    });
  });

  describe("unique_staff", () => {
    it("counts distinct staff by staff_name", () => {
      const rows = [makeRow({ staff_name: "A" }), makeRow({ staff_name: "B" }), makeRow({ staff_name: "A" })];
      const m = computeStaffWhistleblowingMetrics(rows);
      expect(m.unique_staff).toBe(2);
    });

    it("returns 1 when all rows have the same staff_name", () => {
      const rows = [makeRow({ staff_name: "A" }), makeRow({ staff_name: "A" }), makeRow({ staff_name: "A" })];
      const m = computeStaffWhistleblowingMetrics(rows);
      expect(m.unique_staff).toBe(1);
    });
  });

  describe("boolean rates", () => {
    it("whistleblower_supported_rate 0 when false", () => {
      const m = computeStaffWhistleblowingMetrics([makeRow({ whistleblower_supported: false })]);
      expect(m.whistleblower_supported_rate).toBe(0);
    });

    it("no_detriment_rate 0 when false", () => {
      const m = computeStaffWhistleblowingMetrics([makeRow({ no_detriment_confirmed: false })]);
      expect(m.no_detriment_rate).toBe(0);
    });

    it("calculates mixed rates (2/3 = 66.7%)", () => {
      const rows = [
        makeRow({ whistleblower_supported: true }),
        makeRow({ whistleblower_supported: true }),
        makeRow({ whistleblower_supported: false }),
      ];
      const m = computeStaffWhistleblowingMetrics(rows);
      expect(m.whistleblower_supported_rate).toBe(66.7);
    });

    it("calculates mixed rates (1/3 = 33.3%)", () => {
      const rows = [
        makeRow({ regulatory_body_notified: true }),
        makeRow({ regulatory_body_notified: false }),
        makeRow({ regulatory_body_notified: false }),
      ];
      const m = computeStaffWhistleblowingMetrics(rows);
      expect(m.regulatory_notified_rate).toBe(33.3);
    });
  });

  describe("category_breakdown", () => {
    it("counts all 10 categories", () => {
      const rows = CONCERN_CATEGORIES.map((c) => makeRow({ concern_category: c }));
      const m = computeStaffWhistleblowingMetrics(rows);
      for (const c of CONCERN_CATEGORIES) expect(m.category_breakdown[c]).toBe(1);
    });

    it("counts duplicate categories", () => {
      const rows = [
        makeRow({ concern_category: "safeguarding_practice" }),
        makeRow({ concern_category: "safeguarding_practice" }),
        makeRow({ concern_category: "data_breach" }),
      ];
      const m = computeStaffWhistleblowingMetrics(rows);
      expect(m.category_breakdown).toEqual({ safeguarding_practice: 2, data_breach: 1 });
    });
  });

  describe("outcome_breakdown", () => {
    it("counts all 5 outcomes", () => {
      const rows = INVESTIGATION_OUTCOMES.map((o) => makeRow({ investigation_outcome: o }));
      const m = computeStaffWhistleblowingMetrics(rows);
      for (const o of INVESTIGATION_OUTCOMES) expect(m.outcome_breakdown[o]).toBe(1);
    });

    it("counts duplicate outcomes", () => {
      const rows = [
        makeRow({ investigation_outcome: "substantiated" }),
        makeRow({ investigation_outcome: "substantiated" }),
        makeRow({ investigation_outcome: "inconclusive" }),
      ];
      const m = computeStaffWhistleblowingMetrics(rows);
      expect(m.outcome_breakdown).toEqual({ substantiated: 2, inconclusive: 1 });
    });
  });
});

// ── computeStaffWhistleblowingAlerts ─────────────────────────────────────

describe("computeStaffWhistleblowingAlerts", () => {
  describe("no alerts", () => {
    it("returns empty array when no rows", () => {
      const alerts = computeStaffWhistleblowingAlerts([]);
      expect(alerts).toHaveLength(0);
    });

    it("returns empty array when all rows are clean defaults", () => {
      const rows = [makeRow()];
      const alerts = computeStaffWhistleblowingAlerts(rows);
      expect(alerts).toEqual([]);
    });
  });

  describe("substantiated_not_notified alert", () => {
    it("fires for substantiated outcome + regulatory body not notified", () => {
      const rows = [makeRow({ investigation_outcome: "substantiated", regulatory_body_notified: false, staff_name: "Bob" })];
      const alerts = computeStaffWhistleblowingAlerts(rows);
      const alert = alerts.find((a) => a.type === "substantiated_not_notified");
      expect(alert).toBeDefined();
      expect(alert!.severity).toBe("critical");
      expect(alert!.message).toContain("Bob");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "inv-1", investigation_outcome: "substantiated", regulatory_body_notified: false })];
      const alerts = computeStaffWhistleblowingAlerts(rows);
      const alert = alerts.find((a) => a.type === "substantiated_not_notified")!;
      expect(alert.record_id).toBe("inv-1");
    });

    it("does not fire when regulatory body is notified", () => {
      const rows = [makeRow({ investigation_outcome: "substantiated", regulatory_body_notified: true })];
      const alerts = computeStaffWhistleblowingAlerts(rows);
      const alert = alerts.find((a) => a.type === "substantiated_not_notified");
      expect(alert).toBeUndefined();
    });

    it("does not fire for unsubstantiated outcome even if not notified", () => {
      const rows = [makeRow({ investigation_outcome: "unsubstantiated", regulatory_body_notified: false })];
      const alerts = computeStaffWhistleblowingAlerts(rows);
      const alert = alerts.find((a) => a.type === "substantiated_not_notified");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple substantiated not notified", () => {
      const rows = [
        makeRow({ investigation_outcome: "substantiated", regulatory_body_notified: false }),
        makeRow({ investigation_outcome: "substantiated", regulatory_body_notified: false }),
      ];
      const alerts = computeStaffWhistleblowingAlerts(rows);
      const critical = alerts.filter((a) => a.type === "substantiated_not_notified");
      expect(critical).toHaveLength(2);
    });
  });

  describe("whistleblower_protection_gap alert", () => {
    it("fires when whistleblower not supported", () => {
      const rows = [makeRow({ whistleblower_supported: false, no_detriment_confirmed: true, staff_name: "Carol" })];
      const alerts = computeStaffWhistleblowingAlerts(rows);
      const alert = alerts.find((a) => a.type === "whistleblower_protection_gap");
      expect(alert).toBeDefined();
      expect(alert!.severity).toBe("high");
      expect(alert!.message).toContain("Carol");
      expect(alert!.message).toContain("whistleblower not supported");
    });

    it("fires when no detriment not confirmed", () => {
      const rows = [makeRow({ whistleblower_supported: true, no_detriment_confirmed: false })];
      const alerts = computeStaffWhistleblowingAlerts(rows);
      const alert = alerts.find((a) => a.type === "whistleblower_protection_gap");
      expect(alert).toBeDefined();
      expect(alert!.message).toContain("no detriment not confirmed");
    });

    it("fires with both issues when both are false", () => {
      const rows = [makeRow({ whistleblower_supported: false, no_detriment_confirmed: false })];
      const alerts = computeStaffWhistleblowingAlerts(rows);
      const alert = alerts.find((a) => a.type === "whistleblower_protection_gap")!;
      expect(alert.message).toContain("whistleblower not supported");
      expect(alert.message).toContain("no detriment not confirmed");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "inv-2", whistleblower_supported: false })];
      const alerts = computeStaffWhistleblowingAlerts(rows);
      const alert = alerts.find((a) => a.type === "whistleblower_protection_gap")!;
      expect(alert.record_id).toBe("inv-2");
    });

    it("does not fire when both supported and detriment confirmed", () => {
      const rows = [makeRow({ whistleblower_supported: true, no_detriment_confirmed: true })];
      const alerts = computeStaffWhistleblowingAlerts(rows);
      const alert = alerts.find((a) => a.type === "whistleblower_protection_gap");
      expect(alert).toBeUndefined();
    });
  });

  describe("multiple_ongoing_investigations alert", () => {
    it("fires when 2 or more investigations are under_investigation or received", () => {
      const rows = [
        makeRow({ investigation_status: "under_investigation" }),
        makeRow({ investigation_status: "received" }),
      ];
      const alerts = computeStaffWhistleblowingAlerts(rows);
      const alert = alerts.find((a) => a.type === "multiple_ongoing_investigations");
      expect(alert).toBeDefined();
      expect(alert!.severity).toBe("high");
    });

    it("includes count in message", () => {
      const rows = [
        makeRow({ investigation_status: "under_investigation" }),
        makeRow({ investigation_status: "under_investigation" }),
        makeRow({ investigation_status: "received" }),
      ];
      const alerts = computeStaffWhistleblowingAlerts(rows);
      const alert = alerts.find((a) => a.type === "multiple_ongoing_investigations")!;
      expect(alert.message).toContain("3");
    });

    it("does not fire for only 1 ongoing investigation", () => {
      const rows = [makeRow({ investigation_status: "under_investigation" })];
      const alerts = computeStaffWhistleblowingAlerts(rows);
      const alert = alerts.find((a) => a.type === "multiple_ongoing_investigations");
      expect(alert).toBeUndefined();
    });

    it("does not fire when all are concluded or closed", () => {
      const rows = [
        makeRow({ investigation_status: "concluded" }),
        makeRow({ investigation_status: "closed" }),
      ];
      const alerts = computeStaffWhistleblowingAlerts(rows);
      const alert = alerts.find((a) => a.type === "multiple_ongoing_investigations");
      expect(alert).toBeUndefined();
    });

    it("fires only once as aggregate alert", () => {
      const rows = [
        makeRow({ investigation_status: "under_investigation" }),
        makeRow({ investigation_status: "under_investigation" }),
        makeRow({ investigation_status: "received" }),
      ];
      const alerts = computeStaffWhistleblowingAlerts(rows);
      const ongoingAlerts = alerts.filter((a) => a.type === "multiple_ongoing_investigations");
      expect(ongoingAlerts).toHaveLength(1);
    });
  });

  describe("learning_not_shared alert", () => {
    it("fires when learning identified but not shared", () => {
      const rows = [makeRow({ organisational_learning_identified: true, learning_shared_with_team: false, staff_name: "Dan" })];
      const alerts = computeStaffWhistleblowingAlerts(rows);
      const alert = alerts.find((a) => a.type === "learning_not_shared");
      expect(alert).toBeDefined();
      expect(alert!.severity).toBe("medium");
      expect(alert!.message).toContain("Dan");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "inv-3", organisational_learning_identified: true, learning_shared_with_team: false })];
      const alerts = computeStaffWhistleblowingAlerts(rows);
      const alert = alerts.find((a) => a.type === "learning_not_shared")!;
      expect(alert.record_id).toBe("inv-3");
    });

    it("does not fire when learning is shared", () => {
      const rows = [makeRow({ organisational_learning_identified: true, learning_shared_with_team: true })];
      const alerts = computeStaffWhistleblowingAlerts(rows);
      const alert = alerts.find((a) => a.type === "learning_not_shared");
      expect(alert).toBeUndefined();
    });

    it("does not fire when no learning identified", () => {
      const rows = [makeRow({ organisational_learning_identified: false, learning_shared_with_team: false })];
      const alerts = computeStaffWhistleblowingAlerts(rows);
      const alert = alerts.find((a) => a.type === "learning_not_shared");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple unshared learnings", () => {
      const rows = [
        makeRow({ organisational_learning_identified: true, learning_shared_with_team: false }),
        makeRow({ organisational_learning_identified: true, learning_shared_with_team: false }),
      ];
      const alerts = computeStaffWhistleblowingAlerts(rows);
      const learningAlerts = alerts.filter((a) => a.type === "learning_not_shared");
      expect(learningAlerts).toHaveLength(2);
    });
  });

  describe("combined alerts", () => {
    it("can fire all four alert types simultaneously", () => {
      const rows = [
        makeRow({ investigation_outcome: "substantiated", regulatory_body_notified: false, whistleblower_supported: false, no_detriment_confirmed: false, investigation_status: "under_investigation", organisational_learning_identified: true, learning_shared_with_team: false }),
        makeRow({ investigation_status: "received", whistleblower_supported: false }),
      ];
      const alerts = computeStaffWhistleblowingAlerts(rows);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("substantiated_not_notified");
      expect(types).toContain("whistleblower_protection_gap");
      expect(types).toContain("multiple_ongoing_investigations");
      expect(types).toContain("learning_not_shared");
    });
  });

  describe("alert structure", () => {
    it("every alert has type, severity, and message fields", () => {
      const rows = [
        makeRow({ investigation_outcome: "substantiated", regulatory_body_notified: false, whistleblower_supported: false }),
      ];
      const alerts = computeStaffWhistleblowingAlerts(rows);
      for (const alert of alerts) {
        expect(alert).toHaveProperty("type");
        expect(alert).toHaveProperty("severity");
        expect(alert).toHaveProperty("message");
      }
    });

    it("severity is always one of critical, high, or medium", () => {
      const rows = [
        makeRow({ investigation_outcome: "substantiated", regulatory_body_notified: false, whistleblower_supported: false, investigation_status: "under_investigation", organisational_learning_identified: true, learning_shared_with_team: false }),
        makeRow({ investigation_status: "received" }),
      ];
      const alerts = computeStaffWhistleblowingAlerts(rows);
      for (const alert of alerts) {
        expect(["critical", "high", "medium"]).toContain(alert.severity);
      }
    });
  });
});

// ── generateStaffWhistleblowingCaraInsights ──────────────────────────────

describe("generateStaffWhistleblowingCaraInsights", () => {
  it("returns exactly 3 insights", () => {
    const metrics = computeStaffWhistleblowingMetrics([]);
    const alerts = computeStaffWhistleblowingAlerts([]);
    const insights = generateStaffWhistleblowingCaraInsights(metrics, alerts);
    expect(insights).toHaveLength(3);
  });

  it("first insight starts with [cyan]", () => {
    const metrics = computeStaffWhistleblowingMetrics([makeRow()]);
    const alerts = computeStaffWhistleblowingAlerts([makeRow()]);
    const insights = generateStaffWhistleblowingCaraInsights(metrics, alerts);
    expect(insights[0]).toMatch(/^\[cyan\]/);
  });

  it("first insight includes total_investigations count", () => {
    const rows = [makeRow(), makeRow(), makeRow()];
    const metrics = computeStaffWhistleblowingMetrics(rows);
    const alerts = computeStaffWhistleblowingAlerts(rows);
    const insights = generateStaffWhistleblowingCaraInsights(metrics, alerts);
    expect(insights[0]).toContain("3");
  });

  it("first insight includes unique_staff count", () => {
    const rows = [makeRow({ staff_name: "A" }), makeRow({ staff_name: "B" })];
    const metrics = computeStaffWhistleblowingMetrics(rows);
    const alerts = computeStaffWhistleblowingAlerts(rows);
    const insights = generateStaffWhistleblowingCaraInsights(metrics, alerts);
    expect(insights[0]).toContain("2 unique staff members");
  });

  it("first insight uses singular member wording when 1 unique staff", () => {
    const rows = [makeRow({ staff_name: "A" })];
    const metrics = computeStaffWhistleblowingMetrics(rows);
    const alerts = computeStaffWhistleblowingAlerts(rows);
    const insights = generateStaffWhistleblowingCaraInsights(metrics, alerts);
    expect(insights[0]).toContain("1 unique staff member");
  });

  it("second insight starts with [amber]", () => {
    const metrics = computeStaffWhistleblowingMetrics([makeRow()]);
    const alerts = computeStaffWhistleblowingAlerts([makeRow()]);
    const insights = generateStaffWhistleblowingCaraInsights(metrics, alerts);
    expect(insights[1]).toMatch(/^\[amber\]/);
  });

  it("second insight mentions critical and high alerts when present", () => {
    const rows = [
      makeRow({ investigation_outcome: "substantiated", regulatory_body_notified: false, whistleblower_supported: false }),
    ];
    const metrics = computeStaffWhistleblowingMetrics(rows);
    const alerts = computeStaffWhistleblowingAlerts(rows);
    const insights = generateStaffWhistleblowingCaraInsights(metrics, alerts);
    expect(insights[1]).toContain("critical");
    expect(insights[1]).toContain("high");
  });

  it("second insight mentions no alerts when none present", () => {
    const rows = [makeRow()];
    const metrics = computeStaffWhistleblowingMetrics(rows);
    const alerts = computeStaffWhistleblowingAlerts(rows);
    const insights = generateStaffWhistleblowingCaraInsights(metrics, alerts);
    expect(insights[1]).toContain("No critical or high-priority alerts");
  });

  it("third insight starts with [reflect]", () => {
    const metrics = computeStaffWhistleblowingMetrics([makeRow()]);
    const alerts = computeStaffWhistleblowingAlerts([makeRow()]);
    const insights = generateStaffWhistleblowingCaraInsights(metrics, alerts);
    expect(insights[2]).toMatch(/^\[reflect\]/);
  });

  it("third insight mentions policy changes when policy_change_count > 0", () => {
    const rows = [makeRow({ policy_change_required: true })];
    const metrics = computeStaffWhistleblowingMetrics(rows);
    const alerts = computeStaffWhistleblowingAlerts(rows);
    const insights = generateStaffWhistleblowingCaraInsights(metrics, alerts);
    expect(insights[2]).toContain("policy change");
  });

  it("third insight asks about learning sharing when no policy changes but learning_shared_rate < 100", () => {
    const rows = [
      makeRow({ policy_change_required: false, learning_shared_with_team: false }),
      makeRow({ policy_change_required: false, learning_shared_with_team: true }),
    ];
    const metrics = computeStaffWhistleblowingMetrics(rows);
    const alerts = computeStaffWhistleblowingAlerts(rows);
    const insights = generateStaffWhistleblowingCaraInsights(metrics, alerts);
    expect(insights[2]).toContain("sharing lessons");
  });

  it("third insight celebrates strong culture when all learning shared and no policy changes", () => {
    const rows = [
      makeRow({ policy_change_required: false, learning_shared_with_team: true }),
      makeRow({ policy_change_required: false, learning_shared_with_team: true }),
    ];
    const metrics = computeStaffWhistleblowingMetrics(rows);
    const alerts = computeStaffWhistleblowingAlerts(rows);
    const insights = generateStaffWhistleblowingCaraInsights(metrics, alerts);
    expect(insights[2]).toContain("learning shared effectively");
  });

  it("uses singular investigation wording when 1 policy change", () => {
    const rows = [makeRow({ policy_change_required: true })];
    const metrics = computeStaffWhistleblowingMetrics(rows);
    const alerts = computeStaffWhistleblowingAlerts(rows);
    const insights = generateStaffWhistleblowingCaraInsights(metrics, alerts);
    expect(insights[2]).toContain("investigation has");
  });

  it("uses plural investigations wording when multiple policy changes", () => {
    const rows = [
      makeRow({ policy_change_required: true }),
      makeRow({ policy_change_required: true }),
    ];
    const metrics = computeStaffWhistleblowingMetrics(rows);
    const alerts = computeStaffWhistleblowingAlerts(rows);
    const insights = generateStaffWhistleblowingCaraInsights(metrics, alerts);
    expect(insights[2]).toContain("investigations have");
  });

  it("all insights are non-empty strings", () => {
    const metrics = computeStaffWhistleblowingMetrics([makeRow()]);
    const alerts = computeStaffWhistleblowingAlerts([makeRow()]);
    const insights = generateStaffWhistleblowingCaraInsights(metrics, alerts);
    for (const insight of insights) {
      expect(typeof insight).toBe("string");
      expect(insight.length).toBeGreaterThan(0);
    }
  });
});

// ── Enum constants ───────────────────────────────────────────────────────

describe("Enum constants", () => {
  it("CONCERN_CATEGORIES has exactly 10 items", () => {
    expect(CONCERN_CATEGORIES).toHaveLength(10);
  });

  it("INVESTIGATION_OUTCOMES has exactly 5 items", () => {
    expect(INVESTIGATION_OUTCOMES).toHaveLength(5);
  });

  it("INVESTIGATION_STATUSES has exactly 5 items", () => {
    expect(INVESTIGATION_STATUSES).toHaveLength(5);
  });

  it("WHISTLEBLOWER_PROTECTIONS has exactly 5 items", () => {
    expect(WHISTLEBLOWER_PROTECTIONS).toHaveLength(5);
  });

  it("CONCERN_CATEGORIES values are unique", () => {
    expect(new Set(CONCERN_CATEGORIES).size).toBe(CONCERN_CATEGORIES.length);
  });

  it("INVESTIGATION_OUTCOMES values are unique", () => {
    expect(new Set(INVESTIGATION_OUTCOMES).size).toBe(INVESTIGATION_OUTCOMES.length);
  });

  it("INVESTIGATION_STATUSES values are unique", () => {
    expect(new Set(INVESTIGATION_STATUSES).size).toBe(INVESTIGATION_STATUSES.length);
  });

  it("WHISTLEBLOWER_PROTECTIONS values are unique", () => {
    expect(new Set(WHISTLEBLOWER_PROTECTIONS).size).toBe(WHISTLEBLOWER_PROTECTIONS.length);
  });
});

// ── Factory helper validation ────────────────────────────────────────────

describe("makeRow factory helper", () => {
  it("creates a row with sensible defaults", () => {
    const r = makeRow();
    expect(r.home_id).toBe("home-1");
    expect(r.staff_name).toBe("Alice Smith");
    expect(r.staff_id).toBe("staff-1");
    expect(r.concern_category).toBe("unsafe_practice");
    expect(r.investigation_outcome).toBe("unsubstantiated");
    expect(r.investigation_status).toBe("closed");
    expect(r.whistleblower_protection).toBe("confidential_disclosure");
    expect(r.investigating_officer).toBeNull();
    expect(r.whistleblower_supported).toBe(true);
    expect(r.no_detriment_confirmed).toBe(true);
    expect(r.regulatory_body_notified).toBe(true);
    expect(r.organisational_learning_identified).toBe(false);
    expect(r.learning_shared_with_team).toBe(false);
    expect(r.policy_change_required).toBe(false);
    expect(r.completion_date).toBeNull();
    expect(r.notes).toBeNull();
  });

  it("allows overriding individual fields", () => {
    const r = makeRow({ concern_category: "data_breach", investigation_status: "escalated" });
    expect(r.concern_category).toBe("data_breach");
    expect(r.investigation_status).toBe("escalated");
    // defaults still apply
    expect(r.whistleblower_protection).toBe("confidential_disclosure");
  });

  it("generates unique ids by default", () => {
    const r1 = makeRow();
    const r2 = makeRow();
    expect(r1.id).not.toBe(r2.id);
  });

  it("allows overriding id", () => {
    const r = makeRow({ id: "custom-id" });
    expect(r.id).toBe("custom-id");
  });

  it("allows setting nullable fields to null", () => {
    const r = makeRow({ investigating_officer: null, completion_date: null, notes: null, staff_id: null });
    expect(r.investigating_officer).toBeNull();
    expect(r.completion_date).toBeNull();
    expect(r.notes).toBeNull();
    expect(r.staff_id).toBeNull();
  });

  it("allows setting nullable fields to values", () => {
    const r = makeRow({ investigating_officer: "Officer Jones", completion_date: "2026-06-01", notes: "Important case", staff_id: "staff-99" });
    expect(r.investigating_officer).toBe("Officer Jones");
    expect(r.completion_date).toBe("2026-06-01");
    expect(r.notes).toBe("Important case");
    expect(r.staff_id).toBe("staff-99");
  });
});
