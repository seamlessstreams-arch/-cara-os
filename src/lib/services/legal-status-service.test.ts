import { describe, it, expect } from "vitest";
import {
  computeLegalMetrics,
  identifyLegalAlerts,
  type LegalRecord,
} from "./legal-status-service";

const NOW = new Date("2026-05-21T12:00:00Z");

function makeRecord(overrides: Partial<LegalRecord> = {}): LegalRecord {
  return {
    id: "leg-1",
    home_id: "home-1",
    child_name: "Alice",
    child_id: "child-1",
    legal_status: "section_31_full",
    order_type: "care_order",
    order_date: "2025-06-01",
    order_expiry: null,
    court_type: "family_court",
    court_name: "Manchester Family Court",
    conditions: ["supervised contact"],
    solicitor_name: "Smith & Co",
    solicitor_contact: "020 1234 5678",
    guardian_name: null,
    parental_responsibility: ["Local Authority"],
    contact_conditions: "Supervised twice weekly",
    next_hearing_date: null,
    last_hearing_outcome: "order_granted",
    staff_briefed: true,
    notes: null,
    created_at: "2025-06-01T10:00:00Z",
    updated_at: "2025-06-01T10:00:00Z",
    ...overrides,
  };
}

describe("computeLegalMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeLegalMetrics([], 4, NOW);
    expect(m.total_records).toBe(0);
    expect(m.children_with_records).toBe(0);
    expect(m.legal_coverage).toBe(0);
    expect(m.section_20_count).toBe(0);
    expect(m.staff_briefed_rate).toBeNull();;
    expect(m.upcoming_hearings).toBe(0);
  });

  it("computes correct metrics for populated data", () => {
    const records = [
      makeRecord({ id: "1", child_id: "c1", legal_status: "section_20", order_type: null, staff_briefed: true, conditions: [], solicitor_name: null }),
      makeRecord({ id: "2", child_id: "c2", legal_status: "section_31_full", order_type: "care_order", staff_briefed: false }),
      makeRecord({ id: "3", child_id: "c3", legal_status: "section_31_interim", order_type: "interim_care_order", staff_briefed: true, next_hearing_date: "2026-05-28" }),
      makeRecord({ id: "4", child_id: "c4", legal_status: "placement_order", order_type: "placement_order", staff_briefed: true, order_expiry: "2026-05-30" }),
    ];
    const m = computeLegalMetrics(records, 4, NOW);
    expect(m.total_records).toBe(4);
    expect(m.children_with_records).toBe(4);
    expect(m.legal_coverage).toBe(100);
    expect(m.section_20_count).toBe(1);
    expect(m.full_care_order_count).toBe(1);
    expect(m.interim_care_order_count).toBe(1);
    expect(m.placement_order_count).toBe(1);
    // staff_briefed: 3 out of 4 = 75%
    expect(m.staff_briefed_rate).toBe(75);
    // hearing on 2026-05-28 is within 30 days of NOW (2026-05-21)
    expect(m.upcoming_hearings).toBe(1);
    // order expiring 2026-05-30 within 30 days
    expect(m.orders_expiring_soon).toBe(1);
    // conditions: records 2,3,4 have conditions (record 1 empty)
    expect(m.with_conditions).toBe(3);
    // solicitor: records 2,3,4 have solicitor
    expect(m.with_solicitor).toBe(3);
    expect(m.by_legal_status).toEqual({
      section_20: 1,
      section_31_full: 1,
      section_31_interim: 1,
      placement_order: 1,
    });
  });
});

describe("identifyLegalAlerts", () => {
  it("returns empty alerts for empty data with no children", () => {
    expect(identifyLegalAlerts([], 0, NOW)).toEqual([]);
  });

  it("triggers no_legal_record when children lack records (critical)", () => {
    const records = [
      makeRecord({ id: "1", child_id: "c1" }),
    ];
    const alerts = identifyLegalAlerts(records, 4, NOW);
    const found = alerts.find((a) => a.type === "no_legal_record");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("critical");
    expect(found!.message).toContain("3");
  });

  it("triggers staff_not_briefed alert (high)", () => {
    const records = [
      makeRecord({ id: "a1", staff_briefed: false, child_name: "Alice" }),
    ];
    const alerts = identifyLegalAlerts(records, 1, NOW);
    const found = alerts.find((a) => a.type === "staff_not_briefed");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("high");
  });

  it("triggers hearing_imminent for hearing within 7 days (high)", () => {
    const records = [
      makeRecord({ id: "a2", next_hearing_date: "2026-05-25", child_name: "Bob", court_name: "Manchester Court" }),
    ];
    const alerts = identifyLegalAlerts(records, 1, NOW);
    const found = alerts.find((a) => a.type === "hearing_imminent");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("high");
  });

  it("does not trigger hearing_imminent for hearing beyond 7 days", () => {
    const records = [
      makeRecord({ id: "a3", next_hearing_date: "2026-06-15", child_name: "Charlie" }),
    ];
    const alerts = identifyLegalAlerts(records, 1, NOW);
    const found = alerts.find((a) => a.type === "hearing_imminent");
    expect(found).toBeUndefined();
  });

  it("triggers order_expiring for order expiring within 14 days (critical)", () => {
    const records = [
      makeRecord({ id: "a4", order_expiry: "2026-05-30", child_name: "Diana", order_type: "interim_care_order" }),
    ];
    const alerts = identifyLegalAlerts(records, 1, NOW);
    const found = alerts.find((a) => a.type === "order_expiring");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("critical");
  });

  it("triggers pr_not_documented for s.20 without PR holders (high)", () => {
    const records = [
      makeRecord({ id: "a5", legal_status: "section_20", parental_responsibility: [], child_name: "Eve" }),
    ];
    const alerts = identifyLegalAlerts(records, 1, NOW);
    const found = alerts.find((a) => a.type === "pr_not_documented");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("high");
  });

  it("does not trigger pr_not_documented when PR holders are documented", () => {
    const records = [
      makeRecord({ id: "a6", legal_status: "section_20", parental_responsibility: ["Mother"], child_name: "Frank" }),
    ];
    const alerts = identifyLegalAlerts(records, 1, NOW);
    const found = alerts.find((a) => a.type === "pr_not_documented");
    expect(found).toBeUndefined();
  });

  it("does not trigger no_legal_record when all children covered", () => {
    const records = [
      makeRecord({ id: "1", child_id: "c1" }),
      makeRecord({ id: "2", child_id: "c2" }),
    ];
    const alerts = identifyLegalAlerts(records, 2, NOW);
    const found = alerts.find((a) => a.type === "no_legal_record");
    expect(found).toBeUndefined();
  });
});
