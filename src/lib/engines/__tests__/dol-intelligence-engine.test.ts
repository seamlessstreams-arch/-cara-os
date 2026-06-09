// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — DEPRIVATION OF LIBERTY INTELLIGENCE ENGINE — TEST SUITE
// Reg 20 — restraint and deprivation of liberty
// Reg 21 — privacy and access
// SCCIF Helped & Protected — evidence of proportionality
// Children Act 1989 — inherent jurisdiction orders
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeDoLIntelligence,
  daysBetween,
  getRestrictionTypeLabel,
  getOrderTypeLabel,
  type DoLRestrictionInput,
  type DoLOrderInput,
  type ChildRef,
  type StaffRef,
  type DoLIntelligenceInput,
} from "../dol-intelligence-engine";

// ── Factories ─────────────────────────────────────────────────────────────────

const TODAY = "2026-05-25";

function makeChild(overrides: Partial<ChildRef> = {}): ChildRef {
  return { id: "yp_alex", name: "Alex", ...overrides };
}

function makeStaff(overrides: Partial<StaffRef> = {}): StaffRef {
  return { id: "staff_darren", name: "Darren", ...overrides };
}

function makeRestriction(overrides: Partial<DoLRestrictionInput> = {}): DoLRestrictionInput {
  return {
    id: "res_1",
    child_id: "yp_alex",
    restriction_type: "internet_access",
    reason: "Safeguarding — monitored access only",
    date_imposed: "2026-03-01",
    last_reviewed: "2026-05-10",
    next_review_due: "2026-06-10",
    child_consulted: true,
    child_view: "Alex understands why monitoring is needed",
    social_worker_informed: true,
    proportionate: true,
    status: "active",
    ...overrides,
  };
}

function makeOrder(overrides: Partial<DoLOrderInput> = {}): DoLOrderInput {
  return {
    id: "order_1",
    child_id: "yp_jordan",
    order_type: "inherent_jurisdiction",
    start_date: "2026-01-15",
    expiry_date: "2026-08-13",
    status: "active",
    court: "Family Court",
    conditions: ["Must reside at Chamberlain House", "Staff escort after 6pm"],
    ...overrides,
  };
}

function makeInput(overrides: Partial<DoLIntelligenceInput> = {}): DoLIntelligenceInput {
  return {
    restrictions: [],
    orders: [],
    children: [makeChild()],
    staff: [makeStaff()],
    today: TODAY,
    ...overrides,
  };
}

// ── Chamberlain House Test Data ───────────────────────────────────────────────────────

const OAK_HOUSE_CHILDREN: ChildRef[] = [
  { id: "yp_alex", name: "Alex" },
  { id: "yp_jordan", name: "Jordan" },
  { id: "yp_casey", name: "Casey" },
];

const OAK_HOUSE_STAFF: StaffRef[] = [
  { id: "staff_darren", name: "Darren" },
  { id: "staff_anna", name: "Anna" },
];

const OAK_HOUSE_ORDERS: DoLOrderInput[] = [
  makeOrder({
    id: "order_jordan_1",
    child_id: "yp_jordan",
    order_type: "inherent_jurisdiction",
    start_date: "2026-01-15",
    expiry_date: "2026-08-13", // 80 days from 2026-05-25
    status: "active",
    court: "Family Court",
    conditions: ["Must reside at Chamberlain House", "Staff escort after 6pm"],
  }),
];

const OAK_HOUSE_RESTRICTIONS: DoLRestrictionInput[] = [
  // Jordan: internet_access, overdue by 5 days
  makeRestriction({
    id: "res_jordan_internet",
    child_id: "yp_jordan",
    restriction_type: "internet_access",
    reason: "Safeguarding — monitored access only",
    date_imposed: "2026-02-01",
    last_reviewed: "2026-05-06",
    next_review_due: "2026-05-20", // 5 days overdue from 2026-05-25
    child_consulted: true,
    child_view: "Jordan accepts monitoring is needed for safety",
    social_worker_informed: true,
    proportionate: true,
    status: "active",
  }),
  // Jordan: leave_unaccompanied, overdue by 8 days
  makeRestriction({
    id: "res_jordan_leave",
    child_id: "yp_jordan",
    restriction_type: "leave_unaccompanied",
    reason: "Must have staff escort after 6pm",
    date_imposed: "2026-02-01",
    last_reviewed: "2026-05-03",
    next_review_due: "2026-05-17", // 8 days overdue from 2026-05-25
    child_consulted: true,
    child_view: "Jordan understands this is part of the court order",
    social_worker_informed: true,
    proportionate: true,
    status: "active",
  }),
  // Casey: mobile_phone, next review in 14 days
  makeRestriction({
    id: "res_casey_phone",
    child_id: "yp_casey",
    restriction_type: "mobile_phone",
    reason: "Phone held by staff overnight",
    date_imposed: "2026-04-01",
    last_reviewed: "2026-05-22",
    next_review_due: "2026-06-08", // 14 days from 2026-05-25
    child_consulted: true,
    child_view: "Casey agrees phone being held overnight helps sleep",
    social_worker_informed: true,
    proportionate: true,
    status: "active",
  }),
  // Casey: social_media, child NOT consulted, next review in 7 days
  makeRestriction({
    id: "res_casey_social",
    child_id: "yp_casey",
    restriction_type: "social_media",
    reason: "Supervised access only",
    date_imposed: "2026-04-10",
    last_reviewed: "2026-05-18",
    next_review_due: "2026-06-01", // 7 days from 2026-05-25
    child_consulted: false,
    child_view: "",
    social_worker_informed: true,
    proportionate: true,
    status: "active",
  }),
  // Casey: contact_with_person, next review in 21 days
  makeRestriction({
    id: "res_casey_contact",
    child_id: "yp_casey",
    restriction_type: "contact_with_person",
    reason: "No unsupervised contact with uncle",
    date_imposed: "2026-03-15",
    last_reviewed: "2026-05-15",
    next_review_due: "2026-06-15", // 21 days from 2026-05-25
    child_consulted: true,
    child_view: "Casey understands the safeguarding concern",
    social_worker_informed: true,
    proportionate: true,
    status: "active",
  }),
  // Alex: curfew, removed 15 days ago
  makeRestriction({
    id: "res_alex_curfew",
    child_id: "yp_alex",
    restriction_type: "curfew",
    reason: "Home by 9pm on school nights",
    date_imposed: "2026-01-15",
    last_reviewed: "2026-05-10", // removed 15 days ago from 2026-05-25
    next_review_due: "2026-06-10",
    child_consulted: true,
    child_view: "Alex pleased curfew has been removed",
    social_worker_informed: true,
    proportionate: true,
    status: "removed",
  }),
];

function makeOakHouseInput(): DoLIntelligenceInput {
  return {
    restrictions: OAK_HOUSE_RESTRICTIONS,
    orders: OAK_HOUSE_ORDERS,
    children: OAK_HOUSE_CHILDREN,
    staff: OAK_HOUSE_STAFF,
    today: TODAY,
  };
}

// ── Unit Tests: Helpers ───────────────────────────────────────────────────────

describe("daysBetween", () => {
  it("returns 0 for same day", () => {
    expect(daysBetween("2026-05-25", "2026-05-25")).toBe(0);
  });

  it("returns positive days when b is after a", () => {
    expect(daysBetween("2026-05-20", "2026-05-25")).toBe(5);
  });

  it("returns negative days when b is before a", () => {
    expect(daysBetween("2026-05-25", "2026-05-20")).toBe(-5);
  });

  it("handles month boundaries", () => {
    expect(daysBetween("2026-04-28", "2026-05-03")).toBe(5);
  });

  it("handles year boundaries", () => {
    expect(daysBetween("2025-12-30", "2026-01-02")).toBe(3);
  });

  it("handles large spans", () => {
    expect(daysBetween("2026-01-01", "2026-12-31")).toBe(364);
  });
});

describe("getRestrictionTypeLabel", () => {
  it("returns correct label for internet_access", () => {
    expect(getRestrictionTypeLabel("internet_access")).toBe("Internet Access");
  });

  it("returns correct label for leave_unaccompanied", () => {
    expect(getRestrictionTypeLabel("leave_unaccompanied")).toBe("Leave Unaccompanied");
  });

  it("returns correct label for mobile_phone", () => {
    expect(getRestrictionTypeLabel("mobile_phone")).toBe("Mobile Phone");
  });

  it("returns correct label for contact_with_person", () => {
    expect(getRestrictionTypeLabel("contact_with_person")).toBe("Contact with Person");
  });

  it("returns correct label for social_media", () => {
    expect(getRestrictionTypeLabel("social_media")).toBe("Social Media");
  });

  it("returns correct label for curfew", () => {
    expect(getRestrictionTypeLabel("curfew")).toBe("Curfew");
  });

  it("returns raw type for unknown restriction type", () => {
    expect(getRestrictionTypeLabel("unknown_type")).toBe("unknown_type");
  });
});

describe("getOrderTypeLabel", () => {
  it("returns correct label for inherent_jurisdiction", () => {
    expect(getOrderTypeLabel("inherent_jurisdiction")).toBe("Inherent Jurisdiction");
  });

  it("returns correct label for secure_accommodation", () => {
    expect(getOrderTypeLabel("secure_accommodation")).toBe("Secure Accommodation");
  });

  it("returns correct label for dol_order", () => {
    expect(getOrderTypeLabel("dol_order")).toBe("DoL Order");
  });

  it("returns raw type for unknown order type", () => {
    expect(getOrderTypeLabel("some_other_order")).toBe("some_other_order");
  });
});

// ── Integration Tests: Overview ─────────────────────────────────────────────

describe("computeDoLIntelligence — Overview", () => {
  it("counts active orders correctly", () => {
    const result = computeDoLIntelligence(makeOakHouseInput());
    expect(result.overview.active_orders).toBe(1);
  });

  it("counts active restrictions (excludes removed)", () => {
    const result = computeDoLIntelligence(makeOakHouseInput());
    // 5 active (2 Jordan + 3 Casey), 1 removed (Alex)
    expect(result.overview.active_restrictions).toBe(5);
  });

  it("counts children with active restrictions", () => {
    const result = computeDoLIntelligence(makeOakHouseInput());
    // Jordan and Casey have active restrictions, Alex only removed
    expect(result.overview.children_with_restrictions).toBe(2);
  });

  it("returns total children count", () => {
    const result = computeDoLIntelligence(makeOakHouseInput());
    expect(result.overview.total_children).toBe(3);
  });

  it("computes proportionality rate correctly", () => {
    const result = computeDoLIntelligence(makeOakHouseInput());
    // All 5 active restrictions are proportionate
    expect(result.overview.proportionality_rate).toBe(100);
  });

  it("computes child consultation rate correctly", () => {
    const result = computeDoLIntelligence(makeOakHouseInput());
    // 4 out of 5 active restrictions have child consulted (Casey social_media = false)
    expect(result.overview.child_consultation_rate).toBe(80);
  });

  it("computes social worker informed rate correctly", () => {
    const result = computeDoLIntelligence(makeOakHouseInput());
    // All 5 have sw informed
    expect(result.overview.social_worker_informed_rate).toBe(100);
  });

  it("counts overdue reviews correctly", () => {
    const result = computeDoLIntelligence(makeOakHouseInput());
    // Jordan internet (5 days overdue) + Jordan leave (8 days overdue)
    expect(result.overview.overdue_reviews).toBe(2);
  });

  it("counts restrictions removed in last 30 days", () => {
    const result = computeDoLIntelligence(makeOakHouseInput());
    // Alex curfew removed 15 days ago
    expect(result.overview.restrictions_removed_last_30_days).toBe(1);
  });

  it("handles empty input gracefully", () => {
    const result = computeDoLIntelligence(makeInput({ restrictions: [], orders: [], children: [] }));
    expect(result.overview.active_orders).toBe(0);
    expect(result.overview.active_restrictions).toBe(0);
    expect(result.overview.children_with_restrictions).toBe(0);
    expect(result.overview.total_children).toBe(0);
    expect(result.overview.proportionality_rate).toBe(100);
    expect(result.overview.child_consultation_rate).toBe(100);
    expect(result.overview.social_worker_informed_rate).toBe(100);
    expect(result.overview.overdue_reviews).toBe(0);
    expect(result.overview.restrictions_removed_last_30_days).toBe(0);
  });

  it("does not count expired orders in active_orders", () => {
    const input = makeInput({
      orders: [makeOrder({ status: "expired" })],
      children: OAK_HOUSE_CHILDREN,
    });
    const result = computeDoLIntelligence(input);
    expect(result.overview.active_orders).toBe(0);
  });

  it("counts pending_renewal orders in active_orders", () => {
    const input = makeInput({
      orders: [makeOrder({ status: "pending_renewal" })],
      children: OAK_HOUSE_CHILDREN,
    });
    const result = computeDoLIntelligence(input);
    expect(result.overview.active_orders).toBe(1);
  });

  it("computes 0% proportionality rate when no restrictions are proportionate", () => {
    const input = makeInput({
      restrictions: [
        makeRestriction({ proportionate: false }),
        makeRestriction({ id: "res_2", proportionate: false }),
      ],
    });
    const result = computeDoLIntelligence(input);
    expect(result.overview.proportionality_rate).toBe(0);
  });
});

// ── Integration Tests: Restriction Types ────────────────────────────────────

describe("computeDoLIntelligence — Restriction Types", () => {
  it("groups active restrictions by type with correct counts", () => {
    const result = computeDoLIntelligence(makeOakHouseInput());
    const internetType = result.restriction_types.find((t) => t.restriction_type === "internet_access");
    expect(internetType).toBeDefined();
    expect(internetType!.count).toBe(1);
  });

  it("provides correct type labels", () => {
    const result = computeDoLIntelligence(makeOakHouseInput());
    const leaveType = result.restriction_types.find((t) => t.restriction_type === "leave_unaccompanied");
    expect(leaveType?.type_label).toBe("Leave Unaccompanied");
  });

  it("tracks overdue count per type", () => {
    const result = computeDoLIntelligence(makeOakHouseInput());
    const internetType = result.restriction_types.find((t) => t.restriction_type === "internet_access");
    expect(internetType!.overdue_count).toBe(1);
  });

  it("computes reviewed_on_time correctly", () => {
    const result = computeDoLIntelligence(makeOakHouseInput());
    const phoneType = result.restriction_types.find((t) => t.restriction_type === "mobile_phone");
    expect(phoneType!.reviewed_on_time).toBe(1);
    expect(phoneType!.overdue_count).toBe(0);
  });

  it("sorts restriction types by count descending", () => {
    const result = computeDoLIntelligence(makeOakHouseInput());
    for (let i = 1; i < result.restriction_types.length; i++) {
      expect(result.restriction_types[i].count).toBeLessThanOrEqual(result.restriction_types[i - 1].count);
    }
  });

  it("does not include removed restrictions in type summaries", () => {
    const result = computeDoLIntelligence(makeOakHouseInput());
    // Alex curfew is removed — should not appear unless another curfew is active
    const curfewType = result.restriction_types.find((t) => t.restriction_type === "curfew");
    expect(curfewType).toBeUndefined();
  });
});

// ── Integration Tests: Child Restriction Profiles ───────────────────────────

describe("computeDoLIntelligence — Child Restriction Profiles", () => {
  it("includes only children with active restrictions", () => {
    const result = computeDoLIntelligence(makeOakHouseInput());
    const childIds = result.child_restrictions.map((c) => c.child_id);
    expect(childIds).toContain("yp_jordan");
    expect(childIds).toContain("yp_casey");
    expect(childIds).not.toContain("yp_alex"); // only has removed restriction
  });

  it("counts active restrictions per child correctly", () => {
    const result = computeDoLIntelligence(makeOakHouseInput());
    const jordan = result.child_restrictions.find((c) => c.child_id === "yp_jordan");
    expect(jordan!.active_restrictions).toBe(2);
    const casey = result.child_restrictions.find((c) => c.child_id === "yp_casey");
    expect(casey!.active_restrictions).toBe(3);
  });

  it("counts overdue reviews per child correctly", () => {
    const result = computeDoLIntelligence(makeOakHouseInput());
    const jordan = result.child_restrictions.find((c) => c.child_id === "yp_jordan");
    expect(jordan!.overdue_reviews).toBe(2);
    const casey = result.child_restrictions.find((c) => c.child_id === "yp_casey");
    expect(casey!.overdue_reviews).toBe(0);
  });

  it("computes child consultation rate per child", () => {
    const result = computeDoLIntelligence(makeOakHouseInput());
    const jordan = result.child_restrictions.find((c) => c.child_id === "yp_jordan");
    expect(jordan!.child_consulted_rate).toBe(100); // both consulted
    const casey = result.child_restrictions.find((c) => c.child_id === "yp_casey");
    expect(casey!.child_consulted_rate).toBe(67); // 2 out of 3 (Math.round(2/3*100) = 67)
  });

  it("identifies children with DoL orders", () => {
    const result = computeDoLIntelligence(makeOakHouseInput());
    const jordan = result.child_restrictions.find((c) => c.child_id === "yp_jordan");
    expect(jordan!.has_dol_order).toBe(true);
    const casey = result.child_restrictions.find((c) => c.child_id === "yp_casey");
    expect(casey!.has_dol_order).toBe(false);
  });

  it("uses child name correctly", () => {
    const result = computeDoLIntelligence(makeOakHouseInput());
    const jordan = result.child_restrictions.find((c) => c.child_id === "yp_jordan");
    expect(jordan!.child_name).toBe("Jordan");
  });
});

// ── Integration Tests: Active Orders ────────────────────────────────────────

describe("computeDoLIntelligence — Active Orders", () => {
  it("includes active and pending_renewal orders", () => {
    const input = makeInput({
      orders: [
        makeOrder({ id: "o1", status: "active" }),
        makeOrder({ id: "o2", status: "pending_renewal" }),
        makeOrder({ id: "o3", status: "expired" }),
      ],
      children: OAK_HOUSE_CHILDREN,
    });
    const result = computeDoLIntelligence(input);
    expect(result.active_orders.length).toBe(2);
  });

  it("computes days_until_expiry correctly for future expiry", () => {
    const result = computeDoLIntelligence(makeOakHouseInput());
    const order = result.active_orders[0];
    // 2026-05-25 to 2026-08-13 = 80 days
    expect(order.days_until_expiry).toBe(80);
  });

  it("computes negative days_until_expiry for expired orders", () => {
    const input = makeInput({
      orders: [makeOrder({ expiry_date: "2026-05-20", status: "active" })],
      children: OAK_HOUSE_CHILDREN,
    });
    const result = computeDoLIntelligence(input);
    expect(result.active_orders[0].days_until_expiry).toBe(-5);
  });

  it("returns correct type label for orders", () => {
    const result = computeDoLIntelligence(makeOakHouseInput());
    expect(result.active_orders[0].type_label).toBe("Inherent Jurisdiction");
  });

  it("maps child name to orders", () => {
    const result = computeDoLIntelligence(makeOakHouseInput());
    expect(result.active_orders[0].child_name).toBe("Jordan");
  });

  it("returns Unknown for orders with missing child", () => {
    const input = makeInput({
      orders: [makeOrder({ child_id: "nonexistent" })],
      children: [],
    });
    const result = computeDoLIntelligence(input);
    expect(result.active_orders[0].child_name).toBe("Unknown");
  });
});

// ── Integration Tests: Alerts ───────────────────────────────────────────────

describe("computeDoLIntelligence — Alerts", () => {
  it("generates critical alert for DoL order expiring within 14 days", () => {
    const input = makeInput({
      orders: [makeOrder({ expiry_date: "2026-06-01", status: "active" })], // 7 days
      children: OAK_HOUSE_CHILDREN,
    });
    const result = computeDoLIntelligence(input);
    const critical = result.alerts.filter((a) => a.severity === "critical");
    expect(critical.some((a) => a.message.includes("expires in 7 days"))).toBe(true);
  });

  it("does NOT generate critical alert for order expiring in 14 days with pending_renewal", () => {
    const input = makeInput({
      orders: [makeOrder({ expiry_date: "2026-06-01", status: "pending_renewal" })],
      children: OAK_HOUSE_CHILDREN,
    });
    const result = computeDoLIntelligence(input);
    const critical = result.alerts.filter(
      (a) => a.severity === "critical" && a.message.includes("expires in"),
    );
    expect(critical.length).toBe(0);
  });

  it("generates critical alert when child not consulted AND sw not informed", () => {
    const input = makeInput({
      restrictions: [makeRestriction({ child_consulted: false, social_worker_informed: false })],
    });
    const result = computeDoLIntelligence(input);
    const critical = result.alerts.filter(
      (a) => a.severity === "critical" && a.message.includes("child not consulted and social worker not informed"),
    );
    expect(critical.length).toBe(1);
  });

  it("does NOT generate critical alert if only child not consulted (sw is informed)", () => {
    const input = makeInput({
      restrictions: [makeRestriction({ child_consulted: false, social_worker_informed: true })],
    });
    const result = computeDoLIntelligence(input);
    const critical = result.alerts.filter(
      (a) => a.severity === "critical" && a.message.includes("child not consulted and social worker not informed"),
    );
    expect(critical.length).toBe(0);
  });

  it("generates high alert for overdue restriction review", () => {
    const result = computeDoLIntelligence(makeOakHouseInput());
    const high = result.alerts.filter((a) => a.severity === "high" && a.message.includes("overdue"));
    expect(high.length).toBe(2); // Jordan internet (5 days) + Jordan leave (8 days)
  });

  it("includes days overdue in high alert message", () => {
    const result = computeDoLIntelligence(makeOakHouseInput());
    const high = result.alerts.filter((a) => a.severity === "high" && a.message.includes("overdue"));
    expect(high.some((a) => a.message.includes("5 day"))).toBe(true);
    expect(high.some((a) => a.message.includes("8 day"))).toBe(true);
  });

  it("generates high alert for non-proportionate restriction", () => {
    const input = makeInput({
      restrictions: [makeRestriction({ proportionate: false })],
    });
    const result = computeDoLIntelligence(input);
    const high = result.alerts.filter(
      (a) => a.severity === "high" && a.message.includes("proportionality not established"),
    );
    expect(high.length).toBe(1);
  });

  it("generates medium alert when child consultation rate below 80%", () => {
    const input = makeInput({
      restrictions: [
        makeRestriction({ id: "r1", child_consulted: true }),
        makeRestriction({ id: "r2", child_consulted: false }),
        makeRestriction({ id: "r3", child_consulted: false }),
        makeRestriction({ id: "r4", child_consulted: false }),
        makeRestriction({ id: "r5", child_consulted: false }),
      ],
    });
    const result = computeDoLIntelligence(input);
    const medium = result.alerts.filter(
      (a) => a.severity === "medium" && a.message.includes("Child consultation rate"),
    );
    expect(medium.length).toBe(1);
  });

  it("does NOT generate medium alert when consultation rate is exactly 80%", () => {
    const result = computeDoLIntelligence(makeOakHouseInput());
    // 4/5 = 80%
    const medium = result.alerts.filter(
      (a) => a.severity === "medium" && a.message.includes("Child consultation rate"),
    );
    expect(medium.length).toBe(0);
  });

  it("generates medium alert when social worker informed rate below 90%", () => {
    const input = makeInput({
      restrictions: [
        makeRestriction({ id: "r1", social_worker_informed: true }),
        makeRestriction({ id: "r2", social_worker_informed: false }),
        makeRestriction({ id: "r3", social_worker_informed: false }),
      ],
    });
    const result = computeDoLIntelligence(input);
    const medium = result.alerts.filter(
      (a) => a.severity === "medium" && a.message.includes("Social worker informed rate"),
    );
    expect(medium.length).toBe(1);
  });

  it("does NOT generate medium alert when social worker rate is 90% or above", () => {
    const input = makeInput({
      restrictions: Array.from({ length: 10 }, (_, i) =>
        makeRestriction({ id: `r${i}`, social_worker_informed: i < 9 ? true : false }),
      ),
    });
    const result = computeDoLIntelligence(input);
    // 9/10 = 90%, which is not below 90%
    const medium = result.alerts.filter(
      (a) => a.severity === "medium" && a.message.includes("Social worker informed rate"),
    );
    expect(medium.length).toBe(0);
  });

  it("generates low alert for restriction active > 90 days", () => {
    const input = makeInput({
      restrictions: [makeRestriction({ date_imposed: "2026-01-01" })], // 144 days active
    });
    const result = computeDoLIntelligence(input);
    const low = result.alerts.filter(
      (a) => a.severity === "low" && a.message.includes("days"),
    );
    expect(low.length).toBe(1);
    expect(low[0].message).toContain("144 days");
  });

  it("does NOT generate low alert for restriction active exactly 90 days", () => {
    const input = makeInput({
      restrictions: [makeRestriction({ date_imposed: "2026-02-24" })], // 90 days from May 25
    });
    const result = computeDoLIntelligence(input);
    const low = result.alerts.filter(
      (a) => a.severity === "low" && a.message.includes("consider whether removal"),
    );
    expect(low.length).toBe(0);
  });

  it("does NOT generate low alert for restriction active 89 days", () => {
    const input = makeInput({
      restrictions: [makeRestriction({ date_imposed: "2026-02-25" })], // 89 days
    });
    const result = computeDoLIntelligence(input);
    const low = result.alerts.filter(
      (a) => a.severity === "low" && a.message.includes("consider whether removal"),
    );
    expect(low.length).toBe(0);
  });

  it("generates no alerts for a fully compliant home", () => {
    const input = makeInput({
      restrictions: [
        makeRestriction({
          date_imposed: "2026-04-01", // < 90 days
          next_review_due: "2026-06-10", // not overdue
          child_consulted: true,
          social_worker_informed: true,
          proportionate: true,
        }),
      ],
      orders: [],
    });
    const result = computeDoLIntelligence(input);
    expect(result.alerts.length).toBe(0);
  });
});

// ── Integration Tests: Insights ─────────────────────────────────────────────

describe("computeDoLIntelligence — Insights", () => {
  it("generates critical insight for imminent order expiry", () => {
    const input = makeInput({
      orders: [makeOrder({ expiry_date: "2026-06-01", status: "active" })], // 7 days
      children: OAK_HOUSE_CHILDREN,
    });
    const result = computeDoLIntelligence(input);
    const critical = result.insights.filter((i) => i.severity === "critical");
    expect(critical.length).toBe(1);
    expect(critical[0].text).toContain("Court application needed");
  });

  it("does NOT generate critical insight when renewal is pending", () => {
    const input = makeInput({
      orders: [makeOrder({ expiry_date: "2026-06-01", status: "pending_renewal" })],
      children: OAK_HOUSE_CHILDREN,
    });
    const result = computeDoLIntelligence(input);
    const critical = result.insights.filter((i) => i.severity === "critical");
    expect(critical.length).toBe(0);
  });

  it("generates warning insight for overdue reviews", () => {
    const result = computeDoLIntelligence(makeOakHouseInput());
    const warnings = result.insights.filter(
      (i) => i.severity === "warning" && i.text.includes("overdue"),
    );
    expect(warnings.length).toBe(1);
    expect(warnings[0].text).toContain("2 restriction reviews overdue");
  });

  it("generates warning insight for low child consultation rate", () => {
    const input = makeInput({
      restrictions: [
        makeRestriction({ id: "r1", child_consulted: false }),
        makeRestriction({ id: "r2", child_consulted: false }),
        makeRestriction({ id: "r3", child_consulted: true }),
      ],
    });
    const result = computeDoLIntelligence(input);
    const warnings = result.insights.filter(
      (i) => i.severity === "warning" && i.text.includes("Child consultation rate"),
    );
    expect(warnings.length).toBe(1);
  });

  it("generates positive insight when all restrictions reviewed on time", () => {
    const input = makeInput({
      restrictions: [
        makeRestriction({ next_review_due: "2026-06-10" }),
        makeRestriction({ id: "r2", next_review_due: "2026-06-15" }),
      ],
    });
    const result = computeDoLIntelligence(input);
    const positive = result.insights.filter(
      (i) => i.severity === "positive" && i.text.includes("reviewed on time"),
    );
    expect(positive.length).toBe(1);
  });

  it("generates positive insight for 100% consultation and sw rate", () => {
    const input = makeInput({
      restrictions: [
        makeRestriction({ child_consulted: true, social_worker_informed: true }),
        makeRestriction({ id: "r2", child_consulted: true, social_worker_informed: true }),
      ],
    });
    const result = computeDoLIntelligence(input);
    const positive = result.insights.filter(
      (i) => i.severity === "positive" && i.text.includes("100% child consultation"),
    );
    expect(positive.length).toBe(1);
  });

  it("generates positive insight for removed restrictions", () => {
    const result = computeDoLIntelligence(makeOakHouseInput());
    const positive = result.insights.filter(
      (i) => i.severity === "positive" && i.text.includes("removed in the last 30 days"),
    );
    expect(positive.length).toBe(1);
  });

  it("does NOT generate positive all-on-time insight when reviews are overdue", () => {
    const result = computeDoLIntelligence(makeOakHouseInput());
    const positive = result.insights.filter(
      (i) => i.severity === "positive" && i.text.includes("reviewed on time"),
    );
    expect(positive.length).toBe(0);
  });

  it("does NOT generate positive 100% insight when consultation < 100%", () => {
    const result = computeDoLIntelligence(makeOakHouseInput());
    const positive = result.insights.filter(
      (i) => i.severity === "positive" && i.text.includes("100% child consultation"),
    );
    expect(positive.length).toBe(0);
  });

  it("generates no insights for empty input", () => {
    const result = computeDoLIntelligence(makeInput({ restrictions: [], orders: [] }));
    expect(result.insights.length).toBe(0);
  });
});

// ── Integration Tests: Full Chamberlain House Scenario ──────────────────────────────

describe("computeDoLIntelligence — Chamberlain House Full Scenario", () => {
  it("returns complete result structure", () => {
    const result = computeDoLIntelligence(makeOakHouseInput());
    expect(result).toHaveProperty("overview");
    expect(result).toHaveProperty("restriction_types");
    expect(result).toHaveProperty("child_restrictions");
    expect(result).toHaveProperty("active_orders");
    expect(result).toHaveProperty("alerts");
    expect(result).toHaveProperty("insights");
  });

  it("overview matches expected Chamberlain House state", () => {
    const result = computeDoLIntelligence(makeOakHouseInput());
    expect(result.overview).toEqual({
      active_orders: 1,
      active_restrictions: 5,
      children_with_restrictions: 2,
      total_children: 3,
      proportionality_rate: 100,
      child_consultation_rate: 80,
      social_worker_informed_rate: 100,
      overdue_reviews: 2,
      restrictions_removed_last_30_days: 1,
    });
  });

  it("has 5 distinct restriction type summaries", () => {
    const result = computeDoLIntelligence(makeOakHouseInput());
    expect(result.restriction_types.length).toBe(5);
  });

  it("has 2 child restriction profiles (Jordan and Casey)", () => {
    const result = computeDoLIntelligence(makeOakHouseInput());
    expect(result.child_restrictions.length).toBe(2);
  });

  it("has 1 active order (Jordan's inherent jurisdiction)", () => {
    const result = computeDoLIntelligence(makeOakHouseInput());
    expect(result.active_orders.length).toBe(1);
    expect(result.active_orders[0].child_name).toBe("Jordan");
    expect(result.active_orders[0].order_type).toBe("inherent_jurisdiction");
  });

  it("generates appropriate alerts for Chamberlain House state", () => {
    const result = computeDoLIntelligence(makeOakHouseInput());
    // Should have: 2 high alerts (overdue reviews) + low alerts for restrictions > 90 days
    const high = result.alerts.filter((a) => a.severity === "high");
    expect(high.length).toBe(2);
    // Jordan's restrictions were imposed on 2026-02-01, 113 days from 2026-05-25
    const low = result.alerts.filter((a) => a.severity === "low");
    expect(low.length).toBe(2); // both of Jordan's restrictions are > 90 days
  });

  it("generates overdue warning insight for Chamberlain House", () => {
    const result = computeDoLIntelligence(makeOakHouseInput());
    const warnings = result.insights.filter((i) => i.severity === "warning");
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings.some((w) => w.text.includes("overdue"))).toBe(true);
  });

  it("generates positive removal insight for Chamberlain House", () => {
    const result = computeDoLIntelligence(makeOakHouseInput());
    const positive = result.insights.filter((i) => i.severity === "positive");
    expect(positive.some((p) => p.text.includes("removed"))).toBe(true);
  });
});

// ── Edge Cases ──────────────────────────────────────────────────────────────

describe("computeDoLIntelligence — Edge Cases", () => {
  it("defaults today to current date if not provided", () => {
    const input: DoLIntelligenceInput = {
      restrictions: [],
      orders: [],
      children: [makeChild()],
      staff: [makeStaff()],
    };
    // Should not throw
    const result = computeDoLIntelligence(input);
    expect(result.overview.active_restrictions).toBe(0);
  });

  it("handles restriction with review due today (not overdue)", () => {
    const input = makeInput({
      restrictions: [makeRestriction({ next_review_due: TODAY })],
    });
    const result = computeDoLIntelligence(input);
    expect(result.overview.overdue_reviews).toBe(0);
  });

  it("handles restriction with review due yesterday (overdue)", () => {
    const input = makeInput({
      restrictions: [makeRestriction({ next_review_due: "2026-05-24" })],
    });
    const result = computeDoLIntelligence(input);
    expect(result.overview.overdue_reviews).toBe(1);
  });

  it("handles order expiring today (0 days until expiry triggers alert)", () => {
    const input = makeInput({
      orders: [makeOrder({ expiry_date: TODAY, status: "active" })],
      children: OAK_HOUSE_CHILDREN,
    });
    const result = computeDoLIntelligence(input);
    const critical = result.alerts.filter(
      (a) => a.severity === "critical" && a.message.includes("expires in 0 days"),
    );
    expect(critical.length).toBe(1);
  });

  it("handles order already expired (negative days_until_expiry)", () => {
    const input = makeInput({
      orders: [makeOrder({ expiry_date: "2026-05-15", status: "active" })],
      children: OAK_HOUSE_CHILDREN,
    });
    const result = computeDoLIntelligence(input);
    expect(result.active_orders[0].days_until_expiry).toBe(-10);
    // Still triggers critical alert since -10 <= 14
    const critical = result.alerts.filter(
      (a) => a.severity === "critical" && a.message.includes("expires in -10 day"),
    );
    expect(critical.length).toBe(1);
  });

  it("handles under_review restrictions (not counted as active)", () => {
    const input = makeInput({
      restrictions: [makeRestriction({ status: "under_review" })],
    });
    const result = computeDoLIntelligence(input);
    expect(result.overview.active_restrictions).toBe(0);
  });

  it("handles multiple orders for same child", () => {
    const input = makeInput({
      orders: [
        makeOrder({ id: "o1", child_id: "yp_jordan", order_type: "inherent_jurisdiction" }),
        makeOrder({ id: "o2", child_id: "yp_jordan", order_type: "dol_order" }),
      ],
      children: OAK_HOUSE_CHILDREN,
    });
    const result = computeDoLIntelligence(input);
    expect(result.active_orders.length).toBe(2);
    expect(result.overview.active_orders).toBe(2);
  });

  it("handles child with no matching restriction in children list", () => {
    const input = makeInput({
      restrictions: [makeRestriction({ child_id: "unknown_child" })],
      children: [makeChild({ id: "yp_alex" })],
    });
    const result = computeDoLIntelligence(input);
    // unknown_child won't appear in child_restrictions since not in children list
    expect(result.child_restrictions.length).toBe(0);
    // But active_restrictions still counted
    expect(result.overview.active_restrictions).toBe(1);
  });

  it("handles removal not within 30 days (not counted)", () => {
    const input = makeInput({
      restrictions: [makeRestriction({ status: "removed", last_reviewed: "2026-04-01" })],
    });
    const result = computeDoLIntelligence(input);
    // 54 days ago — outside 30 day window
    expect(result.overview.restrictions_removed_last_30_days).toBe(0);
  });

  it("handles all restrictions being for the same type", () => {
    const input = makeInput({
      restrictions: [
        makeRestriction({ id: "r1", restriction_type: "curfew", child_id: "yp_alex" }),
        makeRestriction({ id: "r2", restriction_type: "curfew", child_id: "yp_alex" }),
        makeRestriction({ id: "r3", restriction_type: "curfew", child_id: "yp_alex" }),
      ],
    });
    const result = computeDoLIntelligence(input);
    expect(result.restriction_types.length).toBe(1);
    expect(result.restriction_types[0].count).toBe(3);
  });
});
