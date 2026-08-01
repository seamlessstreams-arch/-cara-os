import { describe, it, expect } from "vitest";
import {
  computeMetrics,
  computeAlerts,
  validateBirthFamilyContactSupport,
  type BirthFamilyContactSupportRow,
} from "./birth-family-contact-support-service";

function makeRow(overrides: Partial<BirthFamilyContactSupportRow> = {}): BirthFamilyContactSupportRow {
  return {
    id: "row-1",
    home_id: "home-1",
    child_name: "Child A",
    contact_person_name: "Parent A",
    family_role: "Birth Mother",
    support_type: "Contact Facilitation",
    contact_date: "2026-05-01",
    support_provided_by: "Staff A",
    child_prepared: true,
    child_views_considered: true,
    risk_assessment_current: true,
    safeguarding_concerns: false,
    concern_details: null,
    contact_plan_followed: true,
    child_emotional_response: "Positive",
    support_after_contact: true,
    social_worker_informed: true,
    court_order_in_place: false,
    contact_frequency_agreed: "Weekly",
    next_contact_date: null,
    status: "Completed",
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

describe("computeMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeMetrics([]);
    expect(m.total_records).toBe(0);
    expect(m.preparation_rate).toBeNull();;
    expect(m.unique_children).toBe(0);
    expect(m.cancellation_rate).toBeNull();;
  });

  it("computes rates based on completed records", () => {
    const rows = [
      makeRow({ id: "1", status: "Completed", child_prepared: true, child_views_considered: true, contact_plan_followed: true, support_after_contact: true }),
      makeRow({ id: "2", status: "Completed", child_prepared: false, child_views_considered: false, contact_plan_followed: false, support_after_contact: false }),
    ];
    const m = computeMetrics(rows);
    expect(m.total_records).toBe(2);
    expect(m.preparation_rate).toBe(50);
    expect(m.child_views_rate).toBe(50);
    expect(m.contact_plan_adherence_rate).toBe(50);
    expect(m.post_contact_support_rate).toBe(50);
  });

  it("computes cancellation breakdown", () => {
    const rows = [
      makeRow({ id: "1", status: "Cancelled — by Home" }),
      makeRow({ id: "2", status: "Cancelled — by Family" }),
      makeRow({ id: "3", status: "Cancelled — by Child" }),
      makeRow({ id: "4", status: "Completed" }),
    ];
    const m = computeMetrics(rows);
    expect(m.cancellation_rate).toBe(75);
    expect(m.cancellation_by_home).toBe(1);
    expect(m.cancellation_by_family).toBe(1);
    expect(m.cancellation_by_child).toBe(1);
  });

  it("counts unique children and contacts", () => {
    const rows = [
      makeRow({ id: "1", child_name: "Alice", contact_person_name: "Mum" }),
      makeRow({ id: "2", child_name: "Alice", contact_person_name: "Dad" }),
      makeRow({ id: "3", child_name: "Bob", contact_person_name: "Mum" }),
    ];
    const m = computeMetrics(rows);
    expect(m.unique_children).toBe(2);
    expect(m.unique_contacts).toBe(2); // "mum" and "dad"
  });
});

describe("computeAlerts", () => {
  it("returns no alerts for empty data", () => {
    expect(computeAlerts([])).toEqual([]);
  });

  it("fires critical alert for safeguarding concerns with SW not informed", () => {
    const rows = [makeRow({ id: "r1", safeguarding_concerns: true, social_worker_informed: false })];
    const alerts = computeAlerts(rows);
    const a = alerts.find((a) => a.type === "safeguarding_sw_not_informed");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("critical");
  });

  it("fires critical alert for supervised contact without current risk assessment", () => {
    const rows = [makeRow({ id: "r2", support_type: "Supervised Contact", risk_assessment_current: false })];
    const alerts = computeAlerts(rows);
    expect(alerts.find((a) => a.type === "supervised_no_risk_assessment")).toBeDefined();
  });

  it("fires critical alert for distressed child without post-contact support", () => {
    const rows = [
      makeRow({ id: "r3", child_emotional_response: "Distressed", support_after_contact: false, status: "Completed" }),
    ];
    const alerts = computeAlerts(rows);
    expect(alerts.find((a) => a.type === "distressed_no_support")).toBeDefined();
  });

  it("fires high alert for contact plan not followed on completed contact", () => {
    const rows = [makeRow({ id: "r4", contact_plan_followed: false, status: "Completed" })];
    const alerts = computeAlerts(rows);
    expect(alerts.find((a) => a.type === "contact_plan_not_followed")).toBeDefined();
  });

  it("fires high alert for court order contact that is suspended", () => {
    const rows = [makeRow({ id: "r5", court_order_in_place: true, status: "Suspended" })];
    const alerts = computeAlerts(rows);
    expect(alerts.find((a) => a.type === "court_order_suspended")).toBeDefined();
  });

  it("fires high alert for repeated negative emotional responses (>= 3)", () => {
    const rows = [
      makeRow({ id: "1", child_name: "Alice", child_emotional_response: "Upset" }),
      makeRow({ id: "2", child_name: "Alice", child_emotional_response: "Distressed" }),
      makeRow({ id: "3", child_name: "Alice", child_emotional_response: "Angry" }),
    ];
    const alerts = computeAlerts(rows);
    expect(alerts.find((a) => a.type === "repeated_negative_response")).toBeDefined();
  });
});

describe("validateBirthFamilyContactSupport", () => {
  it("passes for valid input", () => {
    const result = validateBirthFamilyContactSupport({
      childName: "Alice",
      contactPersonName: "Mum",
      familyRole: "Birth Mother",
      supportType: "Contact Facilitation",
      contactDate: "2026-05-01",
      supportProvidedBy: "Staff A",
    });
    expect(result.valid).toBe(true);
  });

  it("fails for missing required fields", () => {
    const result = validateBirthFamilyContactSupport({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(4);
  });

  it("fails when safeguarding concerns present without details", () => {
    const result = validateBirthFamilyContactSupport({
      childName: "Alice",
      contactPersonName: "Mum",
      familyRole: "Birth Mother",
      supportType: "Contact Facilitation",
      contactDate: "2026-05-01",
      supportProvidedBy: "Staff A",
      safeguardingConcerns: true,
      concernDetails: "",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Safeguarding"))).toBe(true);
  });

  it("fails when Court Order Compliance without court order in place", () => {
    const result = validateBirthFamilyContactSupport({
      childName: "Alice",
      contactPersonName: "Mum",
      familyRole: "Birth Mother",
      supportType: "Court Order Compliance",
      contactDate: "2026-05-01",
      supportProvidedBy: "Staff A",
      courtOrderInPlace: false,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("court order"))).toBe(true);
  });
});
