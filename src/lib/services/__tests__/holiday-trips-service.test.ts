// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOLIDAY TRIPS SERVICE TESTS
// Pure-function tests for trip metrics, alert identification,
// constant validation, and edge cases.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";

import {
  TRIP_TYPES,
  TRIP_STATUSES,
  RISK_ASSESSMENT_STATUSES,
  CHILD_ENJOYMENT_LEVELS,
  _testing,
} from "../holiday-trips-service";

import type {
  HolidayTripRecord,
  TripType,
  TripStatus,
  RiskAssessmentStatus,
  ChildEnjoyment,
} from "../holiday-trips-service";

const { computeTripMetrics, identifyTripAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

function makeRecord(
  overrides?: Partial<HolidayTripRecord>,
): HolidayTripRecord {
  return {
    id: overrides?.id ?? crypto.randomUUID(),
    home_id: overrides?.home_id ?? "home-1",
    trip_type: overrides?.trip_type ?? "day_trip",
    trip_date: overrides?.trip_date ?? "2026-05-10",
    return_date:
      "return_date" in (overrides ?? {})
        ? (overrides!.return_date ?? null)
        : null,
    trip_status: overrides?.trip_status ?? "completed",
    risk_assessment_status: overrides?.risk_assessment_status ?? "completed",
    child_enjoyment: overrides?.child_enjoyment ?? "enjoyed",
    destination: overrides?.destination ?? "Beach",
    children_attending: overrides?.children_attending ?? 3,
    staff_attending: overrides?.staff_attending ?? 2,
    child_chose_activity: overrides?.child_chose_activity ?? true,
    consent_obtained: overrides?.consent_obtained ?? true,
    social_worker_informed: overrides?.social_worker_informed ?? true,
    parent_carer_informed: overrides?.parent_carer_informed ?? true,
    delegated_authority_used: overrides?.delegated_authority_used ?? false,
    emergency_contacts_carried: overrides?.emergency_contacts_carried ?? true,
    medication_taken: overrides?.medication_taken ?? false,
    first_aid_kit_carried: overrides?.first_aid_kit_carried ?? true,
    incident_during_trip: overrides?.incident_during_trip ?? false,
    cost: "cost" in (overrides ?? {}) ? (overrides!.cost ?? null) : null,
    budget_approved: overrides?.budget_approved ?? true,
    children_names: overrides?.children_names ?? ["Child A"],
    learning_outcomes: overrides?.learning_outcomes ?? [],
    issues_found: overrides?.issues_found ?? [],
    actions_taken: overrides?.actions_taken ?? [],
    organised_by: overrides?.organised_by ?? "Staff Member",
    notes:
      "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? "2026-05-01T10:00:00Z",
    updated_at: overrides?.updated_at ?? "2026-05-01T10:00:00Z",
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════

describe("TRIP_TYPES", () => {
  it("has exactly 10 entries", () => {
    expect(TRIP_TYPES).toHaveLength(10);
  });

  it("has unique type values", () => {
    const values = TRIP_TYPES.map((t) => t.type);
    expect(new Set(values).size).toBe(values.length);
  });

  it("has unique labels", () => {
    const labels = TRIP_TYPES.map((t) => t.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes day_trip", () => {
    expect(TRIP_TYPES.find((t) => t.type === "day_trip")).toBeDefined();
  });

  it("includes overnight_stay", () => {
    expect(TRIP_TYPES.find((t) => t.type === "overnight_stay")).toBeDefined();
  });

  it("includes holiday", () => {
    expect(TRIP_TYPES.find((t) => t.type === "holiday")).toBeDefined();
  });

  it("includes educational_visit", () => {
    expect(TRIP_TYPES.find((t) => t.type === "educational_visit")).toBeDefined();
  });

  it("includes reward_outing", () => {
    expect(TRIP_TYPES.find((t) => t.type === "reward_outing")).toBeDefined();
  });

  it("includes birthday_treat", () => {
    expect(TRIP_TYPES.find((t) => t.type === "birthday_treat")).toBeDefined();
  });

  it("includes community_activity", () => {
    expect(TRIP_TYPES.find((t) => t.type === "community_activity")).toBeDefined();
  });

  it("includes sporting_event", () => {
    expect(TRIP_TYPES.find((t) => t.type === "sporting_event")).toBeDefined();
  });

  it("includes cultural_visit", () => {
    expect(TRIP_TYPES.find((t) => t.type === "cultural_visit")).toBeDefined();
  });

  it("includes other", () => {
    expect(TRIP_TYPES.find((t) => t.type === "other")).toBeDefined();
  });
});

describe("TRIP_STATUSES", () => {
  it("has exactly 5 entries", () => {
    expect(TRIP_STATUSES).toHaveLength(5);
  });

  it("has unique status values", () => {
    const values = TRIP_STATUSES.map((s) => s.status);
    expect(new Set(values).size).toBe(values.length);
  });

  it("has unique labels", () => {
    const labels = TRIP_STATUSES.map((s) => s.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes completed", () => {
    expect(TRIP_STATUSES.find((s) => s.status === "completed")).toBeDefined();
  });

  it("includes cancelled", () => {
    expect(TRIP_STATUSES.find((s) => s.status === "cancelled")).toBeDefined();
  });
});

describe("RISK_ASSESSMENT_STATUSES", () => {
  it("has exactly 4 entries", () => {
    expect(RISK_ASSESSMENT_STATUSES).toHaveLength(4);
  });

  it("has unique status values", () => {
    const values = RISK_ASSESSMENT_STATUSES.map((s) => s.status);
    expect(new Set(values).size).toBe(values.length);
  });

  it("has unique labels", () => {
    const labels = RISK_ASSESSMENT_STATUSES.map((s) => s.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes overdue", () => {
    expect(
      RISK_ASSESSMENT_STATUSES.find((s) => s.status === "overdue"),
    ).toBeDefined();
  });
});

describe("CHILD_ENJOYMENT_LEVELS", () => {
  it("has exactly 5 entries", () => {
    expect(CHILD_ENJOYMENT_LEVELS).toHaveLength(5);
  });

  it("has unique level values", () => {
    const values = CHILD_ENJOYMENT_LEVELS.map((l) => l.level);
    expect(new Set(values).size).toBe(values.length);
  });

  it("has unique labels", () => {
    const labels = CHILD_ENJOYMENT_LEVELS.map((l) => l.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes loved_it", () => {
    expect(
      CHILD_ENJOYMENT_LEVELS.find((l) => l.level === "loved_it"),
    ).toBeDefined();
  });

  it("includes did_not_enjoy", () => {
    expect(
      CHILD_ENJOYMENT_LEVELS.find((l) => l.level === "did_not_enjoy"),
    ).toBeDefined();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. computeTripMetrics — empty input
// ══════════════════════════════════════════════════════════════════════════════

describe("computeTripMetrics — empty input", () => {
  const m = computeTripMetrics([]);

  it("total_trips is 0", () => expect(m.total_trips).toBe(0));
  it("day_trip_count is 0", () => expect(m.day_trip_count).toBe(0));
  it("overnight_count is 0", () => expect(m.overnight_count).toBe(0));
  it("holiday_count is 0", () => expect(m.holiday_count).toBe(0));
  it("educational_count is 0", () => expect(m.educational_count).toBe(0));
  it("completed_count is 0", () => expect(m.completed_count).toBe(0));
  it("cancelled_count is 0", () => expect(m.cancelled_count).toBe(0));
  it("planned_count is 0", () => expect(m.planned_count).toBe(0));
  it("loved_it_rate is 0", () => expect(m.loved_it_rate).toBeNull());
  it("enjoyed_rate is 0", () => expect(m.enjoyed_rate).toBeNull());
  it("did_not_enjoy_count is 0", () => expect(m.did_not_enjoy_count).toBe(0));
  it("child_chose_rate is 0", () => expect(m.child_chose_rate).toBeNull());
  it("consent_obtained_rate is 0", () => expect(m.consent_obtained_rate).toBeNull());
  it("risk_assessment_completed_rate is 0", () =>
    expect(m.risk_assessment_completed_rate).toBeNull());
  it("risk_assessment_overdue_count is 0", () =>
    expect(m.risk_assessment_overdue_count).toBe(0));
  it("social_worker_informed_rate is 0", () =>
    expect(m.social_worker_informed_rate).toBeNull());
  it("parent_carer_informed_rate is 0", () =>
    expect(m.parent_carer_informed_rate).toBeNull());
  it("emergency_contacts_rate is 0", () =>
    expect(m.emergency_contacts_rate).toBeNull());
  it("first_aid_rate is 0", () => expect(m.first_aid_rate).toBeNull());
  it("incident_count is 0", () => expect(m.incident_count).toBe(0));
  it("total_cost is 0", () => expect(m.total_cost).toBe(0));
  it("average_cost is 0", () => expect(m.average_cost).toBeNull());
  it("unique_children is 0", () => expect(m.unique_children).toBe(0));
  it("by_trip_type is empty", () =>
    expect(Object.keys(m.by_trip_type)).toHaveLength(0));
  it("by_trip_status is empty", () =>
    expect(Object.keys(m.by_trip_status)).toHaveLength(0));
  it("by_risk_assessment is empty", () =>
    expect(Object.keys(m.by_risk_assessment)).toHaveLength(0));
  it("by_child_enjoyment is empty", () =>
    expect(Object.keys(m.by_child_enjoyment)).toHaveLength(0));
  it("returns exactly 27 keys", () =>
    expect(Object.keys(m)).toHaveLength(27));
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. computeTripMetrics — single record (defaults)
// ══════════════════════════════════════════════════════════════════════════════

describe("computeTripMetrics — single default record", () => {
  const m = computeTripMetrics([makeRecord()]);

  it("total_trips is 1", () => expect(m.total_trips).toBe(1));
  it("day_trip_count is 1", () => expect(m.day_trip_count).toBe(1));
  it("overnight_count is 0", () => expect(m.overnight_count).toBe(0));
  it("holiday_count is 0", () => expect(m.holiday_count).toBe(0));
  it("educational_count is 0", () => expect(m.educational_count).toBe(0));
  it("completed_count is 1", () => expect(m.completed_count).toBe(1));
  it("cancelled_count is 0", () => expect(m.cancelled_count).toBe(0));
  it("planned_count is 0", () => expect(m.planned_count).toBe(0));
  it("loved_it_rate is 0", () => expect(m.loved_it_rate).toBe(0));
  it("enjoyed_rate is 100", () => expect(m.enjoyed_rate).toBe(100));
  it("did_not_enjoy_count is 0", () => expect(m.did_not_enjoy_count).toBe(0));
  it("child_chose_rate is 100", () => expect(m.child_chose_rate).toBe(100));
  it("consent_obtained_rate is 100", () =>
    expect(m.consent_obtained_rate).toBe(100));
  it("risk_assessment_completed_rate is 100", () =>
    expect(m.risk_assessment_completed_rate).toBe(100));
  it("risk_assessment_overdue_count is 0", () =>
    expect(m.risk_assessment_overdue_count).toBe(0));
  it("social_worker_informed_rate is 100", () =>
    expect(m.social_worker_informed_rate).toBe(100));
  it("parent_carer_informed_rate is 100", () =>
    expect(m.parent_carer_informed_rate).toBe(100));
  it("emergency_contacts_rate is 100", () =>
    expect(m.emergency_contacts_rate).toBe(100));
  it("first_aid_rate is 100", () => expect(m.first_aid_rate).toBe(100));
  it("incident_count is 0", () => expect(m.incident_count).toBe(0));
  it("total_cost is 0", () => expect(m.total_cost).toBe(0));
  it("average_cost is 0", () => expect(m.average_cost).toBeNull());
  it("unique_children is 1", () => expect(m.unique_children).toBe(1));
  it("by_trip_type has day_trip=1", () =>
    expect(m.by_trip_type.day_trip).toBe(1));
  it("by_trip_status has completed=1", () =>
    expect(m.by_trip_status.completed).toBe(1));
  it("by_risk_assessment has completed=1", () =>
    expect(m.by_risk_assessment.completed).toBe(1));
  it("by_child_enjoyment has enjoyed=1", () =>
    expect(m.by_child_enjoyment.enjoyed).toBe(1));
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. computeTripMetrics — trip type counts
// ══════════════════════════════════════════════════════════════════════════════

describe("computeTripMetrics — trip type counts", () => {
  const records = [
    makeRecord({ trip_type: "day_trip" }),
    makeRecord({ trip_type: "day_trip" }),
    makeRecord({ trip_type: "overnight_stay" }),
    makeRecord({ trip_type: "holiday" }),
    makeRecord({ trip_type: "holiday" }),
    makeRecord({ trip_type: "holiday" }),
    makeRecord({ trip_type: "educational_visit" }),
    makeRecord({ trip_type: "reward_outing" }),
    makeRecord({ trip_type: "birthday_treat" }),
    makeRecord({ trip_type: "community_activity" }),
  ];
  const m = computeTripMetrics(records);

  it("total_trips is 10", () => expect(m.total_trips).toBe(10));
  it("day_trip_count is 2", () => expect(m.day_trip_count).toBe(2));
  it("overnight_count is 1", () => expect(m.overnight_count).toBe(1));
  it("holiday_count is 3", () => expect(m.holiday_count).toBe(3));
  it("educational_count is 1", () => expect(m.educational_count).toBe(1));

  it("by_trip_type has reward_outing=1", () =>
    expect(m.by_trip_type.reward_outing).toBe(1));
  it("by_trip_type has birthday_treat=1", () =>
    expect(m.by_trip_type.birthday_treat).toBe(1));
  it("by_trip_type has community_activity=1", () =>
    expect(m.by_trip_type.community_activity).toBe(1));
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. computeTripMetrics — trip status counts
// ══════════════════════════════════════════════════════════════════════════════

describe("computeTripMetrics — trip status counts", () => {
  const records = [
    makeRecord({ trip_status: "completed" }),
    makeRecord({ trip_status: "completed" }),
    makeRecord({ trip_status: "cancelled" }),
    makeRecord({ trip_status: "planned" }),
    makeRecord({ trip_status: "planned" }),
    makeRecord({ trip_status: "planned" }),
    makeRecord({ trip_status: "approved" }),
    makeRecord({ trip_status: "postponed" }),
  ];
  const m = computeTripMetrics(records);

  it("completed_count is 2", () => expect(m.completed_count).toBe(2));
  it("cancelled_count is 1", () => expect(m.cancelled_count).toBe(1));
  it("planned_count is 3", () => expect(m.planned_count).toBe(3));

  it("by_trip_status has approved=1", () =>
    expect(m.by_trip_status.approved).toBe(1));
  it("by_trip_status has postponed=1", () =>
    expect(m.by_trip_status.postponed).toBe(1));
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. computeTripMetrics — enjoyment rates & counts
// ══════════════════════════════════════════════════════════════════════════════

describe("computeTripMetrics — enjoyment", () => {
  const records = [
    makeRecord({ child_enjoyment: "loved_it" }),
    makeRecord({ child_enjoyment: "loved_it" }),
    makeRecord({ child_enjoyment: "enjoyed" }),
    makeRecord({ child_enjoyment: "mixed" }),
    makeRecord({ child_enjoyment: "did_not_enjoy" }),
  ];
  const m = computeTripMetrics(records);

  it("loved_it_rate is 40", () => expect(m.loved_it_rate).toBe(40));
  it("enjoyed_rate is 20", () => expect(m.enjoyed_rate).toBe(20));
  it("did_not_enjoy_count is 1", () => expect(m.did_not_enjoy_count).toBe(1));

  it("by_child_enjoyment has loved_it=2", () =>
    expect(m.by_child_enjoyment.loved_it).toBe(2));
  it("by_child_enjoyment has mixed=1", () =>
    expect(m.by_child_enjoyment.mixed).toBe(1));
  it("by_child_enjoyment has did_not_enjoy=1", () =>
    expect(m.by_child_enjoyment.did_not_enjoy).toBe(1));
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. computeTripMetrics — boolean rates
// ══════════════════════════════════════════════════════════════════════════════

describe("computeTripMetrics — boolean rates", () => {
  it("child_chose_rate at 50% with 2/4 true", () => {
    const records = [
      makeRecord({ child_chose_activity: true }),
      makeRecord({ child_chose_activity: true }),
      makeRecord({ child_chose_activity: false }),
      makeRecord({ child_chose_activity: false }),
    ];
    expect(computeTripMetrics(records).child_chose_rate).toBe(50);
  });

  it("consent_obtained_rate at 75%", () => {
    const records = [
      makeRecord({ consent_obtained: true }),
      makeRecord({ consent_obtained: true }),
      makeRecord({ consent_obtained: true }),
      makeRecord({ consent_obtained: false }),
    ];
    expect(computeTripMetrics(records).consent_obtained_rate).toBe(75);
  });

  it("social_worker_informed_rate at 0% when all false", () => {
    const records = [
      makeRecord({ social_worker_informed: false }),
      makeRecord({ social_worker_informed: false }),
    ];
    expect(computeTripMetrics(records).social_worker_informed_rate).toBe(0);
  });

  it("parent_carer_informed_rate at 100% when all true", () => {
    const records = [
      makeRecord({ parent_carer_informed: true }),
      makeRecord({ parent_carer_informed: true }),
    ];
    expect(computeTripMetrics(records).parent_carer_informed_rate).toBe(100);
  });

  it("emergency_contacts_rate with 1/3 true", () => {
    const records = [
      makeRecord({ emergency_contacts_carried: true }),
      makeRecord({ emergency_contacts_carried: false }),
      makeRecord({ emergency_contacts_carried: false }),
    ];
    expect(computeTripMetrics(records).emergency_contacts_rate).toBe(33.3);
  });

  it("first_aid_rate with 2/3 true", () => {
    const records = [
      makeRecord({ first_aid_kit_carried: true }),
      makeRecord({ first_aid_kit_carried: true }),
      makeRecord({ first_aid_kit_carried: false }),
    ];
    expect(computeTripMetrics(records).first_aid_rate).toBe(66.7);
  });

  it("delegated_authority boolean does not affect other rates", () => {
    const records = [makeRecord({ delegated_authority_used: true })];
    const m = computeTripMetrics(records);
    expect(m.child_chose_rate).toBe(100);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. computeTripMetrics — risk assessment
// ══════════════════════════════════════════════════════════════════════════════

describe("computeTripMetrics — risk assessment", () => {
  it("risk_assessment_completed_rate with 2/4 completed", () => {
    const records = [
      makeRecord({ risk_assessment_status: "completed" }),
      makeRecord({ risk_assessment_status: "completed" }),
      makeRecord({ risk_assessment_status: "pending" }),
      makeRecord({ risk_assessment_status: "overdue" }),
    ];
    expect(computeTripMetrics(records).risk_assessment_completed_rate).toBe(50);
  });

  it("risk_assessment_overdue_count counts overdue", () => {
    const records = [
      makeRecord({ risk_assessment_status: "overdue" }),
      makeRecord({ risk_assessment_status: "overdue" }),
      makeRecord({ risk_assessment_status: "completed" }),
    ];
    expect(computeTripMetrics(records).risk_assessment_overdue_count).toBe(2);
  });

  it("by_risk_assessment groups correctly", () => {
    const records = [
      makeRecord({ risk_assessment_status: "completed" }),
      makeRecord({ risk_assessment_status: "pending" }),
      makeRecord({ risk_assessment_status: "not_required" }),
      makeRecord({ risk_assessment_status: "overdue" }),
    ];
    const m = computeTripMetrics(records);
    expect(m.by_risk_assessment.completed).toBe(1);
    expect(m.by_risk_assessment.pending).toBe(1);
    expect(m.by_risk_assessment.not_required).toBe(1);
    expect(m.by_risk_assessment.overdue).toBe(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 9. computeTripMetrics — incidents
// ══════════════════════════════════════════════════════════════════════════════

describe("computeTripMetrics — incident_count", () => {
  it("counts incidents correctly", () => {
    const records = [
      makeRecord({ incident_during_trip: true }),
      makeRecord({ incident_during_trip: true }),
      makeRecord({ incident_during_trip: false }),
    ];
    expect(computeTripMetrics(records).incident_count).toBe(2);
  });

  it("is 0 when no incidents", () => {
    const records = [makeRecord(), makeRecord()];
    expect(computeTripMetrics(records).incident_count).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 10. computeTripMetrics — costs
// ══════════════════════════════════════════════════════════════════════════════

describe("computeTripMetrics — costs", () => {
  it("total_cost sums costs with null excluded", () => {
    const records = [
      makeRecord({ cost: 25.5 }),
      makeRecord({ cost: 30 }),
      makeRecord(), // cost is null by default
    ];
    expect(computeTripMetrics(records).total_cost).toBe(55.5);
  });

  it("average_cost divides by records with cost only", () => {
    const records = [
      makeRecord({ cost: 20 }),
      makeRecord({ cost: 40 }),
      makeRecord(), // null cost — excluded from average
    ];
    expect(computeTripMetrics(records).average_cost).toBe(30);
  });

  it("total_cost rounds to 2 decimal places", () => {
    const records = [
      makeRecord({ cost: 10.115 }),
      makeRecord({ cost: 20.225 }),
    ];
    // 10.115 + 20.225 = 30.34
    expect(computeTripMetrics(records).total_cost).toBe(30.34);
  });

  it("average_cost rounds to 2 decimal places", () => {
    const records = [
      makeRecord({ cost: 10 }),
      makeRecord({ cost: 10 }),
      makeRecord({ cost: 10 }),
    ];
    // avg = 30/3 = 10
    expect(computeTripMetrics(records).average_cost).toBe(10);
  });

  it("average_cost handles non-even division", () => {
    const records = [
      makeRecord({ cost: 10 }),
      makeRecord({ cost: 20 }),
      makeRecord({ cost: 30 }),
    ];
    // avg = 60/3 = 20
    expect(computeTripMetrics(records).average_cost).toBe(20);
  });

  it("total_cost and average_cost are 0 when all costs are null", () => {
    const records = [makeRecord(), makeRecord()];
    const m = computeTripMetrics(records);
    expect(m.total_cost).toBe(0);
    expect(m.average_cost).toBeNull();;
  });

  it("handles a single record with cost", () => {
    const records = [makeRecord({ cost: 99.99 })];
    const m = computeTripMetrics(records);
    expect(m.total_cost).toBe(99.99);
    expect(m.average_cost).toBe(99.99);
  });

  it("handles cost of 0 (not null)", () => {
    const records = [makeRecord({ cost: 0 })];
    const m = computeTripMetrics(records);
    expect(m.total_cost).toBe(0);
    expect(m.average_cost).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 11. computeTripMetrics — unique children
// ══════════════════════════════════════════════════════════════════════════════

describe("computeTripMetrics — unique_children", () => {
  it("deduplicates children across records", () => {
    const records = [
      makeRecord({ children_names: ["Alice", "Bob"] }),
      makeRecord({ children_names: ["Bob", "Charlie"] }),
    ];
    expect(computeTripMetrics(records).unique_children).toBe(3);
  });

  it("counts 0 when all children_names are empty arrays", () => {
    const records = [
      makeRecord({ children_names: [] }),
      makeRecord({ children_names: [] }),
    ];
    expect(computeTripMetrics(records).unique_children).toBe(0);
  });

  it("counts 1 when same child in all records", () => {
    const records = [
      makeRecord({ children_names: ["Alice"] }),
      makeRecord({ children_names: ["Alice"] }),
      makeRecord({ children_names: ["Alice"] }),
    ];
    expect(computeTripMetrics(records).unique_children).toBe(1);
  });

  it("handles single child in single record", () => {
    const records = [makeRecord({ children_names: ["Solo"] })];
    expect(computeTripMetrics(records).unique_children).toBe(1);
  });

  it("counts many unique children", () => {
    const records = [
      makeRecord({
        children_names: ["A", "B", "C", "D", "E"],
      }),
    ];
    expect(computeTripMetrics(records).unique_children).toBe(5);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 12. computeTripMetrics — rate rounding (Math.round * 1000 / 10)
// ══════════════════════════════════════════════════════════════════════════════

describe("computeTripMetrics — rate rounding", () => {
  it("1/3 yields 33.3", () => {
    const records = [
      makeRecord({ child_enjoyment: "loved_it" }),
      makeRecord({ child_enjoyment: "enjoyed" }),
      makeRecord({ child_enjoyment: "mixed" }),
    ];
    expect(computeTripMetrics(records).loved_it_rate).toBe(33.3);
  });

  it("2/3 yields 66.7", () => {
    const records = [
      makeRecord({ child_enjoyment: "loved_it" }),
      makeRecord({ child_enjoyment: "loved_it" }),
      makeRecord({ child_enjoyment: "enjoyed" }),
    ];
    expect(computeTripMetrics(records).loved_it_rate).toBe(66.7);
  });

  it("1/7 yields 14.3", () => {
    const records = Array.from({ length: 7 }, (_, i) =>
      makeRecord({
        child_enjoyment: i === 0 ? "loved_it" : "enjoyed",
      }),
    );
    expect(computeTripMetrics(records).loved_it_rate).toBe(14.3);
  });

  it("3/7 yields 42.9", () => {
    const records = Array.from({ length: 7 }, (_, i) =>
      makeRecord({
        child_enjoyment: i < 3 ? "loved_it" : "enjoyed",
      }),
    );
    expect(computeTripMetrics(records).loved_it_rate).toBe(42.9);
  });

  it("1/6 yields 16.7", () => {
    const records = Array.from({ length: 6 }, (_, i) =>
      makeRecord({
        consent_obtained: i === 0,
      }),
    );
    expect(computeTripMetrics(records).consent_obtained_rate).toBe(16.7);
  });

  it("5/6 yields 83.3", () => {
    const records = Array.from({ length: 6 }, (_, i) =>
      makeRecord({
        consent_obtained: i < 5,
      }),
    );
    expect(computeTripMetrics(records).consent_obtained_rate).toBe(83.3);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 13. computeTripMetrics — by_trip_type breakdown
// ══════════════════════════════════════════════════════════════════════════════

describe("computeTripMetrics — by_trip_type", () => {
  it("groups multiple types correctly", () => {
    const records = [
      makeRecord({ trip_type: "day_trip" }),
      makeRecord({ trip_type: "day_trip" }),
      makeRecord({ trip_type: "sporting_event" }),
      makeRecord({ trip_type: "cultural_visit" }),
    ];
    const m = computeTripMetrics(records);
    expect(m.by_trip_type.day_trip).toBe(2);
    expect(m.by_trip_type.sporting_event).toBe(1);
    expect(m.by_trip_type.cultural_visit).toBe(1);
  });

  it("does not include types not present", () => {
    const records = [makeRecord({ trip_type: "holiday" })];
    const m = computeTripMetrics(records);
    expect(m.by_trip_type.holiday).toBe(1);
    expect(m.by_trip_type.day_trip).toBeUndefined();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 14. computeTripMetrics — by_trip_status breakdown
// ══════════════════════════════════════════════════════════════════════════════

describe("computeTripMetrics — by_trip_status", () => {
  it("groups all statuses", () => {
    const records = [
      makeRecord({ trip_status: "planned" }),
      makeRecord({ trip_status: "approved" }),
      makeRecord({ trip_status: "completed" }),
      makeRecord({ trip_status: "cancelled" }),
      makeRecord({ trip_status: "postponed" }),
    ];
    const m = computeTripMetrics(records);
    expect(m.by_trip_status.planned).toBe(1);
    expect(m.by_trip_status.approved).toBe(1);
    expect(m.by_trip_status.completed).toBe(1);
    expect(m.by_trip_status.cancelled).toBe(1);
    expect(m.by_trip_status.postponed).toBe(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 15. computeTripMetrics — mixed large dataset
// ══════════════════════════════════════════════════════════════════════════════

describe("computeTripMetrics — mixed dataset", () => {
  const records = [
    makeRecord({
      trip_type: "day_trip",
      trip_status: "completed",
      child_enjoyment: "loved_it",
      cost: 50,
      children_names: ["Alice", "Bob"],
      incident_during_trip: false,
    }),
    makeRecord({
      trip_type: "holiday",
      trip_status: "completed",
      child_enjoyment: "enjoyed",
      cost: 200,
      children_names: ["Charlie"],
      incident_during_trip: true,
    }),
    makeRecord({
      trip_type: "educational_visit",
      trip_status: "planned",
      child_enjoyment: "mixed",
      children_names: ["Alice", "David"],
      risk_assessment_status: "overdue",
    }),
    makeRecord({
      trip_type: "overnight_stay",
      trip_status: "cancelled",
      child_enjoyment: "not_assessed",
      children_names: ["Bob"],
      consent_obtained: false,
    }),
  ];
  const m = computeTripMetrics(records);

  it("total_trips is 4", () => expect(m.total_trips).toBe(4));
  it("completed_count is 2", () => expect(m.completed_count).toBe(2));
  it("cancelled_count is 1", () => expect(m.cancelled_count).toBe(1));
  it("planned_count is 1", () => expect(m.planned_count).toBe(1));
  it("loved_it_rate is 25", () => expect(m.loved_it_rate).toBe(25));
  it("enjoyed_rate is 25", () => expect(m.enjoyed_rate).toBe(25));
  it("did_not_enjoy_count is 0", () => expect(m.did_not_enjoy_count).toBe(0));
  it("incident_count is 1", () => expect(m.incident_count).toBe(1));
  it("total_cost is 250", () => expect(m.total_cost).toBe(250));
  it("average_cost is 125", () => expect(m.average_cost).toBe(125));
  it("unique_children is 4", () => expect(m.unique_children).toBe(4));
  it("risk_assessment_overdue_count is 1", () =>
    expect(m.risk_assessment_overdue_count).toBe(1));
});

// ══════════════════════════════════════════════════════════════════════════════
// 16. computeTripMetrics — sporting_event and cultural_visit not counted
//     by named fields (only counted in by_trip_type)
// ══════════════════════════════════════════════════════════════════════════════

describe("computeTripMetrics — non-named trip types", () => {
  it("sporting_event not in day_trip/overnight/holiday/educational counts", () => {
    const records = [makeRecord({ trip_type: "sporting_event" })];
    const m = computeTripMetrics(records);
    expect(m.day_trip_count).toBe(0);
    expect(m.overnight_count).toBe(0);
    expect(m.holiday_count).toBe(0);
    expect(m.educational_count).toBe(0);
    expect(m.by_trip_type.sporting_event).toBe(1);
  });

  it("cultural_visit not in named counts", () => {
    const records = [makeRecord({ trip_type: "cultural_visit" })];
    const m = computeTripMetrics(records);
    expect(m.day_trip_count).toBe(0);
    expect(m.overnight_count).toBe(0);
    expect(m.holiday_count).toBe(0);
    expect(m.educational_count).toBe(0);
    expect(m.by_trip_type.cultural_visit).toBe(1);
  });

  it("other type not in named counts", () => {
    const records = [makeRecord({ trip_type: "other" })];
    const m = computeTripMetrics(records);
    expect(m.day_trip_count).toBe(0);
    expect(m.overnight_count).toBe(0);
    expect(m.holiday_count).toBe(0);
    expect(m.educational_count).toBe(0);
    expect(m.by_trip_type.other).toBe(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 17. computeTripMetrics — all booleans false
// ══════════════════════════════════════════════════════════════════════════════

describe("computeTripMetrics — all booleans false", () => {
  const records = [
    makeRecord({
      child_chose_activity: false,
      consent_obtained: false,
      social_worker_informed: false,
      parent_carer_informed: false,
      emergency_contacts_carried: false,
      first_aid_kit_carried: false,
    }),
  ];
  const m = computeTripMetrics(records);

  it("child_chose_rate is 0", () => expect(m.child_chose_rate).toBe(0));
  it("consent_obtained_rate is 0", () =>
    expect(m.consent_obtained_rate).toBe(0));
  it("social_worker_informed_rate is 0", () =>
    expect(m.social_worker_informed_rate).toBe(0));
  it("parent_carer_informed_rate is 0", () =>
    expect(m.parent_carer_informed_rate).toBe(0));
  it("emergency_contacts_rate is 0", () =>
    expect(m.emergency_contacts_rate).toBe(0));
  it("first_aid_rate is 0", () => expect(m.first_aid_rate).toBe(0));
});

// ══════════════════════════════════════════════════════════════════════════════
// 18. identifyTripAlerts — empty input
// ══════════════════════════════════════════════════════════════════════════════

describe("identifyTripAlerts — empty input", () => {
  it("returns empty array", () => {
    expect(identifyTripAlerts([])).toEqual([]);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 19. identifyTripAlerts — no alerts from clean records
// ══════════════════════════════════════════════════════════════════════════════

describe("identifyTripAlerts — no alerts", () => {
  it("returns empty when all records are clean", () => {
    const records = [makeRecord(), makeRecord()];
    expect(identifyTripAlerts(records)).toEqual([]);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 20. identifyTripAlerts — incident_during_trip (critical)
// ══════════════════════════════════════════════════════════════════════════════

describe("identifyTripAlerts — incident_during_trip", () => {
  it("produces a critical alert for an incident", () => {
    const records = [
      makeRecord({
        id: "trip-1",
        incident_during_trip: true,
        trip_type: "day_trip",
        destination: "Park",
        trip_date: "2026-05-10",
      }),
    ];
    const alerts = identifyTripAlerts(records);
    const alert = alerts.find((a) => a.type === "incident_during_trip");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("critical");
  });

  it("includes trip_type with underscores replaced by spaces", () => {
    const records = [
      makeRecord({
        id: "trip-2",
        incident_during_trip: true,
        trip_type: "overnight_stay",
        destination: "Cabin",
        trip_date: "2026-06-01",
      }),
    ];
    const alerts = identifyTripAlerts(records);
    const alert = alerts.find((a) => a.type === "incident_during_trip");
    expect(alert!.message).toContain("overnight stay");
  });

  it("includes destination in message", () => {
    const records = [
      makeRecord({
        id: "trip-3",
        incident_during_trip: true,
        destination: "Mountain Lodge",
        trip_date: "2026-07-15",
      }),
    ];
    const alerts = identifyTripAlerts(records);
    const alert = alerts.find((a) => a.type === "incident_during_trip");
    expect(alert!.message).toContain("Mountain Lodge");
  });

  it("includes trip_date in message", () => {
    const records = [
      makeRecord({
        id: "trip-4",
        incident_during_trip: true,
        trip_date: "2026-08-20",
      }),
    ];
    const alerts = identifyTripAlerts(records);
    const alert = alerts.find((a) => a.type === "incident_during_trip");
    expect(alert!.message).toContain("2026-08-20");
  });

  it("includes record id", () => {
    const records = [
      makeRecord({ id: "trip-5", incident_during_trip: true }),
    ];
    const alerts = identifyTripAlerts(records);
    const alert = alerts.find((a) => a.type === "incident_during_trip");
    expect(alert!.id).toBe("trip-5");
  });

  it("message includes review and report", () => {
    const records = [
      makeRecord({ id: "trip-6", incident_during_trip: true }),
    ];
    const alerts = identifyTripAlerts(records);
    const alert = alerts.find((a) => a.type === "incident_during_trip");
    expect(alert!.message).toContain("review and report");
  });

  it("produces one alert per incident record", () => {
    const records = [
      makeRecord({ id: "a", incident_during_trip: true }),
      makeRecord({ id: "b", incident_during_trip: true }),
      makeRecord({ id: "c", incident_during_trip: false }),
    ];
    const alerts = identifyTripAlerts(records).filter(
      (a) => a.type === "incident_during_trip",
    );
    expect(alerts).toHaveLength(2);
  });

  it("no incident alert when incident_during_trip is false", () => {
    const records = [makeRecord({ incident_during_trip: false })];
    const alerts = identifyTripAlerts(records).filter(
      (a) => a.type === "incident_during_trip",
    );
    expect(alerts).toHaveLength(0);
  });

  it("replaces educational_visit underscores", () => {
    const records = [
      makeRecord({
        id: "ev-1",
        incident_during_trip: true,
        trip_type: "educational_visit",
        destination: "Museum",
        trip_date: "2026-03-01",
      }),
    ];
    const alerts = identifyTripAlerts(records);
    const alert = alerts.find((a) => a.type === "incident_during_trip");
    expect(alert!.message).toContain("educational visit");
  });

  it("replaces community_activity underscores", () => {
    const records = [
      makeRecord({
        id: "ca-1",
        incident_during_trip: true,
        trip_type: "community_activity",
        destination: "Town Hall",
        trip_date: "2026-04-01",
      }),
    ];
    const alerts = identifyTripAlerts(records);
    const alert = alerts.find((a) => a.type === "incident_during_trip");
    expect(alert!.message).toContain("community activity");
  });

  it("replaces sporting_event underscores", () => {
    const records = [
      makeRecord({
        id: "se-1",
        incident_during_trip: true,
        trip_type: "sporting_event",
        destination: "Stadium",
        trip_date: "2026-09-01",
      }),
    ];
    const alerts = identifyTripAlerts(records);
    const alert = alerts.find((a) => a.type === "incident_during_trip");
    expect(alert!.message).toContain("sporting event");
  });

  it("replaces birthday_treat underscores", () => {
    const records = [
      makeRecord({
        id: "bt-1",
        incident_during_trip: true,
        trip_type: "birthday_treat",
        destination: "Restaurant",
        trip_date: "2026-10-01",
      }),
    ];
    const alerts = identifyTripAlerts(records);
    const alert = alerts.find((a) => a.type === "incident_during_trip");
    expect(alert!.message).toContain("birthday treat");
  });

  it("replaces reward_outing underscores", () => {
    const records = [
      makeRecord({
        id: "ro-1",
        incident_during_trip: true,
        trip_type: "reward_outing",
        destination: "Cinema",
        trip_date: "2026-11-01",
      }),
    ];
    const alerts = identifyTripAlerts(records);
    const alert = alerts.find((a) => a.type === "incident_during_trip");
    expect(alert!.message).toContain("reward outing");
  });

  it("replaces cultural_visit underscores", () => {
    const records = [
      makeRecord({
        id: "cv-1",
        incident_during_trip: true,
        trip_type: "cultural_visit",
        destination: "Gallery",
        trip_date: "2026-12-01",
      }),
    ];
    const alerts = identifyTripAlerts(records);
    const alert = alerts.find((a) => a.type === "incident_during_trip");
    expect(alert!.message).toContain("cultural visit");
  });

  it("holiday has no underscores to replace", () => {
    const records = [
      makeRecord({
        id: "hol-1",
        incident_during_trip: true,
        trip_type: "holiday",
        destination: "Spain",
        trip_date: "2026-07-01",
      }),
    ];
    const alerts = identifyTripAlerts(records);
    const alert = alerts.find((a) => a.type === "incident_during_trip");
    expect(alert!.message).toContain("holiday");
  });

  it("other has no underscores to replace", () => {
    const records = [
      makeRecord({
        id: "oth-1",
        incident_during_trip: true,
        trip_type: "other",
        destination: "Somewhere",
        trip_date: "2026-01-01",
      }),
    ];
    const alerts = identifyTripAlerts(records);
    const alert = alerts.find((a) => a.type === "incident_during_trip");
    expect(alert!.message).toContain("other");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 21. identifyTripAlerts — risk_assessment_overdue (high)
// ══════════════════════════════════════════════════════════════════════════════

describe("identifyTripAlerts — risk_assessment_overdue", () => {
  it("fires when 1 trip has overdue risk assessment", () => {
    const records = [makeRecord({ risk_assessment_status: "overdue" })];
    const alerts = identifyTripAlerts(records);
    const alert = alerts.find((a) => a.type === "risk_assessment_overdue");
    expect(alert).toBeDefined();
  });

  it("has severity high", () => {
    const records = [makeRecord({ risk_assessment_status: "overdue" })];
    const alerts = identifyTripAlerts(records);
    const alert = alerts.find((a) => a.type === "risk_assessment_overdue");
    expect(alert!.severity).toBe("high");
  });

  it("uses singular 'trip has' for 1 overdue", () => {
    const records = [makeRecord({ risk_assessment_status: "overdue" })];
    const alerts = identifyTripAlerts(records);
    const alert = alerts.find((a) => a.type === "risk_assessment_overdue");
    expect(alert!.message).toContain("1 trip has");
  });

  it("uses plural 'trips have' for 2 overdue", () => {
    const records = [
      makeRecord({ risk_assessment_status: "overdue" }),
      makeRecord({ risk_assessment_status: "overdue" }),
    ];
    const alerts = identifyTripAlerts(records);
    const alert = alerts.find((a) => a.type === "risk_assessment_overdue");
    expect(alert!.message).toContain("2 trips have");
  });

  it("message includes complete before departure", () => {
    const records = [makeRecord({ risk_assessment_status: "overdue" })];
    const alerts = identifyTripAlerts(records);
    const alert = alerts.find((a) => a.type === "risk_assessment_overdue");
    expect(alert!.message).toContain("complete before departure");
  });

  it("id is risk_assessment_overdue", () => {
    const records = [makeRecord({ risk_assessment_status: "overdue" })];
    const alerts = identifyTripAlerts(records);
    const alert = alerts.find((a) => a.type === "risk_assessment_overdue");
    expect(alert!.id).toBe("risk_assessment_overdue");
  });

  it("does not fire when no overdue", () => {
    const records = [
      makeRecord({ risk_assessment_status: "completed" }),
      makeRecord({ risk_assessment_status: "pending" }),
    ];
    const alerts = identifyTripAlerts(records).filter(
      (a) => a.type === "risk_assessment_overdue",
    );
    expect(alerts).toHaveLength(0);
  });

  it("uses plural for 5 overdue", () => {
    const records = Array.from({ length: 5 }, () =>
      makeRecord({ risk_assessment_status: "overdue" }),
    );
    const alerts = identifyTripAlerts(records);
    const alert = alerts.find((a) => a.type === "risk_assessment_overdue");
    expect(alert!.message).toContain("5 trips have");
  });

  it("produces exactly one aggregate alert regardless of count", () => {
    const records = Array.from({ length: 3 }, () =>
      makeRecord({ risk_assessment_status: "overdue" }),
    );
    const alerts = identifyTripAlerts(records).filter(
      (a) => a.type === "risk_assessment_overdue",
    );
    expect(alerts).toHaveLength(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 22. identifyTripAlerts — no_consent (high)
// ══════════════════════════════════════════════════════════════════════════════

describe("identifyTripAlerts — no_consent", () => {
  it("fires when 1 trip lacks consent", () => {
    const records = [makeRecord({ consent_obtained: false })];
    const alerts = identifyTripAlerts(records);
    const alert = alerts.find((a) => a.type === "no_consent");
    expect(alert).toBeDefined();
  });

  it("has severity high", () => {
    const records = [makeRecord({ consent_obtained: false })];
    const alerts = identifyTripAlerts(records);
    const alert = alerts.find((a) => a.type === "no_consent");
    expect(alert!.severity).toBe("high");
  });

  it("uses singular 'trip' for 1 without consent", () => {
    const records = [makeRecord({ consent_obtained: false })];
    const alerts = identifyTripAlerts(records);
    const alert = alerts.find((a) => a.type === "no_consent");
    expect(alert!.message).toContain("1 trip without");
  });

  it("uses plural 'trips' for 2 without consent", () => {
    const records = [
      makeRecord({ consent_obtained: false }),
      makeRecord({ consent_obtained: false }),
    ];
    const alerts = identifyTripAlerts(records);
    const alert = alerts.find((a) => a.type === "no_consent");
    expect(alert!.message).toContain("2 trips without");
  });

  it("excludes cancelled trips from no_consent count", () => {
    const records = [
      makeRecord({ consent_obtained: false, trip_status: "cancelled" }),
    ];
    const alerts = identifyTripAlerts(records).filter(
      (a) => a.type === "no_consent",
    );
    expect(alerts).toHaveLength(0);
  });

  it("counts non-cancelled trips only", () => {
    const records = [
      makeRecord({ consent_obtained: false, trip_status: "completed" }),
      makeRecord({ consent_obtained: false, trip_status: "cancelled" }),
      makeRecord({ consent_obtained: false, trip_status: "planned" }),
    ];
    const alerts = identifyTripAlerts(records);
    const alert = alerts.find((a) => a.type === "no_consent");
    expect(alert!.message).toContain("2 trips without");
  });

  it("message includes secure before proceeding", () => {
    const records = [makeRecord({ consent_obtained: false })];
    const alerts = identifyTripAlerts(records);
    const alert = alerts.find((a) => a.type === "no_consent");
    expect(alert!.message).toContain("secure before proceeding");
  });

  it("id is no_consent", () => {
    const records = [makeRecord({ consent_obtained: false })];
    const alerts = identifyTripAlerts(records);
    const alert = alerts.find((a) => a.type === "no_consent");
    expect(alert!.id).toBe("no_consent");
  });

  it("does not fire when all have consent", () => {
    const records = [
      makeRecord({ consent_obtained: true }),
      makeRecord({ consent_obtained: true }),
    ];
    const alerts = identifyTripAlerts(records).filter(
      (a) => a.type === "no_consent",
    );
    expect(alerts).toHaveLength(0);
  });

  it("produces exactly one aggregate alert", () => {
    const records = Array.from({ length: 4 }, () =>
      makeRecord({ consent_obtained: false }),
    );
    const alerts = identifyTripAlerts(records).filter(
      (a) => a.type === "no_consent",
    );
    expect(alerts).toHaveLength(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 23. identifyTripAlerts — child_did_not_enjoy (medium)
// ══════════════════════════════════════════════════════════════════════════════

describe("identifyTripAlerts — child_did_not_enjoy", () => {
  it("fires when 1 trip has did_not_enjoy", () => {
    const records = [makeRecord({ child_enjoyment: "did_not_enjoy" })];
    const alerts = identifyTripAlerts(records);
    const alert = alerts.find((a) => a.type === "child_did_not_enjoy");
    expect(alert).toBeDefined();
  });

  it("has severity medium", () => {
    const records = [makeRecord({ child_enjoyment: "did_not_enjoy" })];
    const alerts = identifyTripAlerts(records);
    const alert = alerts.find((a) => a.type === "child_did_not_enjoy");
    expect(alert!.severity).toBe("medium");
  });

  it("uses singular 'trip' for 1", () => {
    const records = [makeRecord({ child_enjoyment: "did_not_enjoy" })];
    const alerts = identifyTripAlerts(records);
    const alert = alerts.find((a) => a.type === "child_did_not_enjoy");
    expect(alert!.message).toContain("1 trip where");
  });

  it("uses plural 'trips' for 2", () => {
    const records = [
      makeRecord({ child_enjoyment: "did_not_enjoy" }),
      makeRecord({ child_enjoyment: "did_not_enjoy" }),
    ];
    const alerts = identifyTripAlerts(records);
    const alert = alerts.find((a) => a.type === "child_did_not_enjoy");
    expect(alert!.message).toContain("2 trips where");
  });

  it("message includes review activity planning", () => {
    const records = [makeRecord({ child_enjoyment: "did_not_enjoy" })];
    const alerts = identifyTripAlerts(records);
    const alert = alerts.find((a) => a.type === "child_did_not_enjoy");
    expect(alert!.message).toContain("review activity planning");
  });

  it("id is child_did_not_enjoy", () => {
    const records = [makeRecord({ child_enjoyment: "did_not_enjoy" })];
    const alerts = identifyTripAlerts(records);
    const alert = alerts.find((a) => a.type === "child_did_not_enjoy");
    expect(alert!.id).toBe("child_did_not_enjoy");
  });

  it("does not fire for mixed enjoyment", () => {
    const records = [makeRecord({ child_enjoyment: "mixed" })];
    const alerts = identifyTripAlerts(records).filter(
      (a) => a.type === "child_did_not_enjoy",
    );
    expect(alerts).toHaveLength(0);
  });

  it("does not fire for not_assessed", () => {
    const records = [makeRecord({ child_enjoyment: "not_assessed" })];
    const alerts = identifyTripAlerts(records).filter(
      (a) => a.type === "child_did_not_enjoy",
    );
    expect(alerts).toHaveLength(0);
  });

  it("produces exactly one aggregate alert", () => {
    const records = Array.from({ length: 3 }, () =>
      makeRecord({ child_enjoyment: "did_not_enjoy" }),
    );
    const alerts = identifyTripAlerts(records).filter(
      (a) => a.type === "child_did_not_enjoy",
    );
    expect(alerts).toHaveLength(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 24. identifyTripAlerts — child_not_choosing (medium, threshold 3)
// ══════════════════════════════════════════════════════════════════════════════

describe("identifyTripAlerts — child_not_choosing", () => {
  it("does not fire with 2 non-choosing trips", () => {
    const records = [
      makeRecord({ child_chose_activity: false }),
      makeRecord({ child_chose_activity: false }),
    ];
    const alerts = identifyTripAlerts(records).filter(
      (a) => a.type === "child_not_choosing",
    );
    expect(alerts).toHaveLength(0);
  });

  it("fires when exactly 3 trips lack child choice", () => {
    const records = [
      makeRecord({ child_chose_activity: false }),
      makeRecord({ child_chose_activity: false }),
      makeRecord({ child_chose_activity: false }),
    ];
    const alerts = identifyTripAlerts(records);
    const alert = alerts.find((a) => a.type === "child_not_choosing");
    expect(alert).toBeDefined();
  });

  it("has severity medium", () => {
    const records = Array.from({ length: 3 }, () =>
      makeRecord({ child_chose_activity: false }),
    );
    const alerts = identifyTripAlerts(records);
    const alert = alerts.find((a) => a.type === "child_not_choosing");
    expect(alert!.severity).toBe("medium");
  });

  it("message includes count of non-choosing trips", () => {
    const records = Array.from({ length: 4 }, () =>
      makeRecord({ child_chose_activity: false }),
    );
    const alerts = identifyTripAlerts(records);
    const alert = alerts.find((a) => a.type === "child_not_choosing");
    expect(alert!.message).toContain("4 trips");
  });

  it("message includes increase child-led planning", () => {
    const records = Array.from({ length: 3 }, () =>
      makeRecord({ child_chose_activity: false }),
    );
    const alerts = identifyTripAlerts(records);
    const alert = alerts.find((a) => a.type === "child_not_choosing");
    expect(alert!.message).toContain("increase child-led planning");
  });

  it("excludes cancelled trips", () => {
    const records = [
      makeRecord({ child_chose_activity: false, trip_status: "cancelled" }),
      makeRecord({ child_chose_activity: false, trip_status: "cancelled" }),
      makeRecord({ child_chose_activity: false, trip_status: "cancelled" }),
    ];
    const alerts = identifyTripAlerts(records).filter(
      (a) => a.type === "child_not_choosing",
    );
    expect(alerts).toHaveLength(0);
  });

  it("counts only non-cancelled trips for threshold", () => {
    const records = [
      makeRecord({ child_chose_activity: false, trip_status: "completed" }),
      makeRecord({ child_chose_activity: false, trip_status: "planned" }),
      makeRecord({ child_chose_activity: false, trip_status: "cancelled" }),
    ];
    const alerts = identifyTripAlerts(records).filter(
      (a) => a.type === "child_not_choosing",
    );
    // only 2 non-cancelled => below threshold of 3
    expect(alerts).toHaveLength(0);
  });

  it("fires when 3 non-cancelled trips lack choice", () => {
    const records = [
      makeRecord({ child_chose_activity: false, trip_status: "completed" }),
      makeRecord({ child_chose_activity: false, trip_status: "planned" }),
      makeRecord({ child_chose_activity: false, trip_status: "approved" }),
      makeRecord({ child_chose_activity: false, trip_status: "cancelled" }),
    ];
    const alerts = identifyTripAlerts(records);
    const alert = alerts.find((a) => a.type === "child_not_choosing");
    expect(alert).toBeDefined();
    expect(alert!.message).toContain("3 trips");
  });

  it("id is child_not_choosing", () => {
    const records = Array.from({ length: 3 }, () =>
      makeRecord({ child_chose_activity: false }),
    );
    const alerts = identifyTripAlerts(records);
    const alert = alerts.find((a) => a.type === "child_not_choosing");
    expect(alert!.id).toBe("child_not_choosing");
  });

  it("does not fire when all chose activity", () => {
    const records = Array.from({ length: 5 }, () =>
      makeRecord({ child_chose_activity: true }),
    );
    const alerts = identifyTripAlerts(records).filter(
      (a) => a.type === "child_not_choosing",
    );
    expect(alerts).toHaveLength(0);
  });

  it("produces exactly one aggregate alert", () => {
    const records = Array.from({ length: 6 }, () =>
      makeRecord({ child_chose_activity: false }),
    );
    const alerts = identifyTripAlerts(records).filter(
      (a) => a.type === "child_not_choosing",
    );
    expect(alerts).toHaveLength(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 25. identifyTripAlerts — multiple alert types
// ══════════════════════════════════════════════════════════════════════════════

describe("identifyTripAlerts — multiple alert types", () => {
  it("produces alerts of all types simultaneously", () => {
    const records = [
      makeRecord({
        id: "inc-1",
        incident_during_trip: true,
        child_enjoyment: "did_not_enjoy",
        risk_assessment_status: "overdue",
        consent_obtained: false,
        child_chose_activity: false,
      }),
      makeRecord({
        child_chose_activity: false,
        consent_obtained: false,
      }),
      makeRecord({
        child_chose_activity: false,
      }),
    ];
    const alerts = identifyTripAlerts(records);
    const types = alerts.map((a) => a.type);
    expect(types).toContain("incident_during_trip");
    expect(types).toContain("risk_assessment_overdue");
    expect(types).toContain("no_consent");
    expect(types).toContain("child_did_not_enjoy");
    expect(types).toContain("child_not_choosing");
  });

  it("incident alerts appear before aggregate alerts", () => {
    const records = [
      makeRecord({
        id: "inc-1",
        incident_during_trip: true,
        risk_assessment_status: "overdue",
      }),
    ];
    const alerts = identifyTripAlerts(records);
    const incidentIdx = alerts.findIndex(
      (a) => a.type === "incident_during_trip",
    );
    const overdueIdx = alerts.findIndex(
      (a) => a.type === "risk_assessment_overdue",
    );
    expect(incidentIdx).toBeLessThan(overdueIdx);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 26. identifyTripAlerts — boundary conditions
// ══════════════════════════════════════════════════════════════════════════════

describe("identifyTripAlerts — boundary conditions", () => {
  it("child_not_choosing does not fire at threshold of 1", () => {
    const records = [makeRecord({ child_chose_activity: false })];
    const alerts = identifyTripAlerts(records).filter(
      (a) => a.type === "child_not_choosing",
    );
    expect(alerts).toHaveLength(0);
  });

  it("risk_assessment_overdue fires at threshold of 1", () => {
    const records = [makeRecord({ risk_assessment_status: "overdue" })];
    const alerts = identifyTripAlerts(records).filter(
      (a) => a.type === "risk_assessment_overdue",
    );
    expect(alerts).toHaveLength(1);
  });

  it("no_consent fires at threshold of 1", () => {
    const records = [makeRecord({ consent_obtained: false })];
    const alerts = identifyTripAlerts(records).filter(
      (a) => a.type === "no_consent",
    );
    expect(alerts).toHaveLength(1);
  });

  it("child_did_not_enjoy fires at threshold of 1", () => {
    const records = [makeRecord({ child_enjoyment: "did_not_enjoy" })];
    const alerts = identifyTripAlerts(records).filter(
      (a) => a.type === "child_did_not_enjoy",
    );
    expect(alerts).toHaveLength(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 27. makeRecord factory verification
// ══════════════════════════════════════════════════════════════════════════════

describe("makeRecord factory", () => {
  it("produces a valid default record", () => {
    const r = makeRecord();
    expect(r.trip_type).toBe("day_trip");
    expect(r.trip_status).toBe("completed");
    expect(r.risk_assessment_status).toBe("completed");
    expect(r.child_enjoyment).toBe("enjoyed");
    expect(r.destination).toBe("Beach");
    expect(r.children_attending).toBe(3);
    expect(r.staff_attending).toBe(2);
  });

  it("default booleans are correct", () => {
    const r = makeRecord();
    expect(r.child_chose_activity).toBe(true);
    expect(r.consent_obtained).toBe(true);
    expect(r.social_worker_informed).toBe(true);
    expect(r.parent_carer_informed).toBe(true);
    expect(r.delegated_authority_used).toBe(false);
    expect(r.emergency_contacts_carried).toBe(true);
    expect(r.medication_taken).toBe(false);
    expect(r.first_aid_kit_carried).toBe(true);
    expect(r.incident_during_trip).toBe(false);
    expect(r.budget_approved).toBe(true);
  });

  it("nullable fields default to null", () => {
    const r = makeRecord();
    expect(r.return_date).toBeNull();
    expect(r.cost).toBeNull();
    expect(r.notes).toBeNull();
  });

  it("overrides nullable fields to non-null", () => {
    const r = makeRecord({
      return_date: "2026-05-15",
      cost: 100,
      notes: "Test note",
    });
    expect(r.return_date).toBe("2026-05-15");
    expect(r.cost).toBe(100);
    expect(r.notes).toBe("Test note");
  });

  it("overrides nullable fields to explicit null", () => {
    const r = makeRecord({
      return_date: null,
      cost: null,
      notes: null,
    });
    expect(r.return_date).toBeNull();
    expect(r.cost).toBeNull();
    expect(r.notes).toBeNull();
  });

  it("default arrays are empty", () => {
    const r = makeRecord();
    expect(r.learning_outcomes).toEqual([]);
    expect(r.issues_found).toEqual([]);
    expect(r.actions_taken).toEqual([]);
  });

  it("default children_names has one child", () => {
    const r = makeRecord();
    expect(r.children_names).toEqual(["Child A"]);
  });

  it("overrides children_names", () => {
    const r = makeRecord({ children_names: ["X", "Y", "Z"] });
    expect(r.children_names).toEqual(["X", "Y", "Z"]);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 28. computeTripMetrics — all enjoyment types at once
// ══════════════════════════════════════════════════════════════════════════════

describe("computeTripMetrics — all enjoyment types", () => {
  const records = [
    makeRecord({ child_enjoyment: "loved_it" }),
    makeRecord({ child_enjoyment: "enjoyed" }),
    makeRecord({ child_enjoyment: "mixed" }),
    makeRecord({ child_enjoyment: "did_not_enjoy" }),
    makeRecord({ child_enjoyment: "not_assessed" }),
  ];
  const m = computeTripMetrics(records);

  it("by_child_enjoyment has all 5 keys", () =>
    expect(Object.keys(m.by_child_enjoyment)).toHaveLength(5));
  it("loved_it count is 1", () =>
    expect(m.by_child_enjoyment.loved_it).toBe(1));
  it("enjoyed count is 1", () =>
    expect(m.by_child_enjoyment.enjoyed).toBe(1));
  it("mixed count is 1", () =>
    expect(m.by_child_enjoyment.mixed).toBe(1));
  it("did_not_enjoy count is 1", () =>
    expect(m.by_child_enjoyment.did_not_enjoy).toBe(1));
  it("not_assessed count is 1", () =>
    expect(m.by_child_enjoyment.not_assessed).toBe(1));
  it("loved_it_rate is 20", () => expect(m.loved_it_rate).toBe(20));
  it("enjoyed_rate is 20", () => expect(m.enjoyed_rate).toBe(20));
  it("did_not_enjoy_count is 1", () => expect(m.did_not_enjoy_count).toBe(1));
});

// ══════════════════════════════════════════════════════════════════════════════
// 29. computeTripMetrics — cost edge cases
// ══════════════════════════════════════════════════════════════════════════════

describe("computeTripMetrics — cost precision", () => {
  it("total_cost with many decimal places", () => {
    const records = [
      makeRecord({ cost: 33.333 }),
      makeRecord({ cost: 66.667 }),
    ];
    // 33.333 + 66.667 = 100
    expect(computeTripMetrics(records).total_cost).toBe(100);
  });

  it("average_cost with non-trivial division", () => {
    const records = [
      makeRecord({ cost: 100 }),
      makeRecord({ cost: 200 }),
      makeRecord({ cost: 300 }),
    ];
    // avg = 600/3 = 200
    expect(computeTripMetrics(records).average_cost).toBe(200);
  });

  it("single cost of 0.01", () => {
    const records = [makeRecord({ cost: 0.01 })];
    const m = computeTripMetrics(records);
    expect(m.total_cost).toBe(0.01);
    expect(m.average_cost).toBe(0.01);
  });

  it("large cost value", () => {
    const records = [makeRecord({ cost: 99999.99 })];
    const m = computeTripMetrics(records);
    expect(m.total_cost).toBe(99999.99);
    expect(m.average_cost).toBe(99999.99);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 30. identifyTripAlerts — cancelled trips excluded from no_consent
//     and child_not_choosing but NOT from incident or enjoyment
// ══════════════════════════════════════════════════════════════════════════════

describe("identifyTripAlerts — cancelled exclusion nuances", () => {
  it("cancelled trip with incident still produces incident alert", () => {
    const records = [
      makeRecord({
        id: "canc-1",
        trip_status: "cancelled",
        incident_during_trip: true,
      }),
    ];
    const alerts = identifyTripAlerts(records).filter(
      (a) => a.type === "incident_during_trip",
    );
    expect(alerts).toHaveLength(1);
  });

  it("cancelled trip with did_not_enjoy still counts for enjoyment alert", () => {
    const records = [
      makeRecord({
        trip_status: "cancelled",
        child_enjoyment: "did_not_enjoy",
      }),
    ];
    const alerts = identifyTripAlerts(records).filter(
      (a) => a.type === "child_did_not_enjoy",
    );
    expect(alerts).toHaveLength(1);
  });

  it("cancelled trip with overdue RA still counts for overdue alert", () => {
    const records = [
      makeRecord({
        trip_status: "cancelled",
        risk_assessment_status: "overdue",
      }),
    ];
    const alerts = identifyTripAlerts(records).filter(
      (a) => a.type === "risk_assessment_overdue",
    );
    expect(alerts).toHaveLength(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 31. computeTripMetrics — all trip types at once
// ══════════════════════════════════════════════════════════════════════════════

describe("computeTripMetrics — all 10 trip types", () => {
  const allTypes: TripType[] = [
    "day_trip",
    "overnight_stay",
    "holiday",
    "educational_visit",
    "reward_outing",
    "birthday_treat",
    "community_activity",
    "sporting_event",
    "cultural_visit",
    "other",
  ];
  const records = allTypes.map((t) => makeRecord({ trip_type: t }));
  const m = computeTripMetrics(records);

  it("total_trips is 10", () => expect(m.total_trips).toBe(10));
  it("by_trip_type has 10 keys", () =>
    expect(Object.keys(m.by_trip_type)).toHaveLength(10));
  it("each type has count 1", () => {
    for (const t of allTypes) {
      expect(m.by_trip_type[t]).toBe(1);
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 32. computeTripMetrics — all statuses at once
// ══════════════════════════════════════════════════════════════════════════════

describe("computeTripMetrics — all 5 statuses", () => {
  const allStatuses: TripStatus[] = [
    "planned",
    "approved",
    "completed",
    "cancelled",
    "postponed",
  ];
  const records = allStatuses.map((s) => makeRecord({ trip_status: s }));
  const m = computeTripMetrics(records);

  it("by_trip_status has 5 keys", () =>
    expect(Object.keys(m.by_trip_status)).toHaveLength(5));
  it("each status has count 1", () => {
    for (const s of allStatuses) {
      expect(m.by_trip_status[s]).toBe(1);
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 33. computeTripMetrics — all risk assessment statuses at once
// ══════════════════════════════════════════════════════════════════════════════

describe("computeTripMetrics — all 4 risk assessment statuses", () => {
  const allRA: RiskAssessmentStatus[] = [
    "completed",
    "pending",
    "not_required",
    "overdue",
  ];
  const records = allRA.map((s) =>
    makeRecord({ risk_assessment_status: s }),
  );
  const m = computeTripMetrics(records);

  it("by_risk_assessment has 4 keys", () =>
    expect(Object.keys(m.by_risk_assessment)).toHaveLength(4));
  it("risk_assessment_completed_rate is 25", () =>
    expect(m.risk_assessment_completed_rate).toBe(25));
  it("risk_assessment_overdue_count is 1", () =>
    expect(m.risk_assessment_overdue_count).toBe(1));
});

// ══════════════════════════════════════════════════════════════════════════════
// 34. identifyTripAlerts — exact message format
// ══════════════════════════════════════════════════════════════════════════════

describe("identifyTripAlerts — exact message format", () => {
  it("incident message format: Incident during {type} to {dest} on {date}", () => {
    const records = [
      makeRecord({
        id: "fmt-1",
        incident_during_trip: true,
        trip_type: "day_trip",
        destination: "Zoo",
        trip_date: "2026-03-15",
      }),
    ];
    const alert = identifyTripAlerts(records).find(
      (a) => a.type === "incident_during_trip",
    );
    expect(alert!.message).toBe(
      "Incident during day trip to Zoo on 2026-03-15 — review and report",
    );
  });

  it("overdue message format singular", () => {
    const records = [makeRecord({ risk_assessment_status: "overdue" })];
    const alert = identifyTripAlerts(records).find(
      (a) => a.type === "risk_assessment_overdue",
    );
    expect(alert!.message).toBe(
      "1 trip has overdue risk assessment — complete before departure",
    );
  });

  it("overdue message format plural", () => {
    const records = [
      makeRecord({ risk_assessment_status: "overdue" }),
      makeRecord({ risk_assessment_status: "overdue" }),
      makeRecord({ risk_assessment_status: "overdue" }),
    ];
    const alert = identifyTripAlerts(records).find(
      (a) => a.type === "risk_assessment_overdue",
    );
    expect(alert!.message).toBe(
      "3 trips have overdue risk assessment — complete before departure",
    );
  });

  it("no_consent message format singular", () => {
    const records = [makeRecord({ consent_obtained: false })];
    const alert = identifyTripAlerts(records).find(
      (a) => a.type === "no_consent",
    );
    expect(alert!.message).toBe(
      "1 trip without consent obtained — secure before proceeding",
    );
  });

  it("no_consent message format plural", () => {
    const records = [
      makeRecord({ consent_obtained: false }),
      makeRecord({ consent_obtained: false }),
    ];
    const alert = identifyTripAlerts(records).find(
      (a) => a.type === "no_consent",
    );
    expect(alert!.message).toBe(
      "2 trips without consent obtained — secure before proceeding",
    );
  });

  it("child_did_not_enjoy message format singular", () => {
    const records = [makeRecord({ child_enjoyment: "did_not_enjoy" })];
    const alert = identifyTripAlerts(records).find(
      (a) => a.type === "child_did_not_enjoy",
    );
    expect(alert!.message).toBe(
      "1 trip where child did not enjoy — review activity planning",
    );
  });

  it("child_did_not_enjoy message format plural", () => {
    const records = [
      makeRecord({ child_enjoyment: "did_not_enjoy" }),
      makeRecord({ child_enjoyment: "did_not_enjoy" }),
    ];
    const alert = identifyTripAlerts(records).find(
      (a) => a.type === "child_did_not_enjoy",
    );
    expect(alert!.message).toBe(
      "2 trips where child did not enjoy — review activity planning",
    );
  });

  it("child_not_choosing message format", () => {
    const records = Array.from({ length: 3 }, () =>
      makeRecord({ child_chose_activity: false }),
    );
    const alert = identifyTripAlerts(records).find(
      (a) => a.type === "child_not_choosing",
    );
    expect(alert!.message).toBe(
      "3 trips where child did not choose activity — increase child-led planning",
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 35. identifyTripAlerts — alert ordering
// ══════════════════════════════════════════════════════════════════════════════

describe("identifyTripAlerts — ordering", () => {
  it("incident alerts come first, then overdue, then no_consent, then enjoyment, then choosing", () => {
    const records = [
      makeRecord({
        id: "ord-1",
        incident_during_trip: true,
        risk_assessment_status: "overdue",
        consent_obtained: false,
        child_enjoyment: "did_not_enjoy",
        child_chose_activity: false,
      }),
      makeRecord({
        id: "ord-2",
        child_chose_activity: false,
      }),
      makeRecord({
        id: "ord-3",
        child_chose_activity: false,
      }),
    ];
    const alerts = identifyTripAlerts(records);
    const types = alerts.map((a) => a.type);
    const incidentIdx = types.indexOf("incident_during_trip");
    const overdueIdx = types.indexOf("risk_assessment_overdue");
    const noConsentIdx = types.indexOf("no_consent");
    const enjoyIdx = types.indexOf("child_did_not_enjoy");
    const choosingIdx = types.indexOf("child_not_choosing");
    expect(incidentIdx).toBeLessThan(overdueIdx);
    expect(overdueIdx).toBeLessThan(noConsentIdx);
    expect(noConsentIdx).toBeLessThan(enjoyIdx);
    expect(enjoyIdx).toBeLessThan(choosingIdx);
  });
});
