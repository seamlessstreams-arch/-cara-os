import { describe, it, expect } from "vitest";
import {
  computeRoutineMetrics,
  identifyRoutineAlerts,
  DailyRoutineRecord,
} from "./daily-routine-service";

function makeRecord(overrides: Partial<DailyRoutineRecord> = {}): DailyRoutineRecord {
  return {
    id: "rtn-1",
    home_id: "home-1",
    child_name: "Alice",
    child_id: "child-1",
    routine_date: "2026-05-21",
    routine_type: "weekday",
    routine_slot: "breakfast",
    scheduled_time: "08:00",
    actual_time: "08:10",
    compliance_rating: "fully_followed",
    adapted: false,
    adaptation_reason: null,
    child_engaged: true,
    child_mood: "happy",
    staff_supporting: "Staff A",
    notes: null,
    created_at: "2026-05-21T08:15:00Z",
    updated_at: "2026-05-21T08:15:00Z",
    ...overrides,
  };
}

// ── computeRoutineMetrics ──────────────────────────────────────────────

describe("computeRoutineMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeRoutineMetrics([], 4);
    expect(m.total_records).toBe(0);
    expect(m.children_with_routines).toBe(0);
    // totalChildren=4 → 0/4 = real 0.
    expect(m.routine_coverage).toBe(0);
    // fab-0: null when records=[] (no data to compute rates over).
    expect(m.compliance_rate).toBeNull();
    expect(m.adaptation_rate).toBeNull();
    expect(m.child_engaged_rate).toBeNull();
    expect(m.average_per_child).toBeNull();
  });

  it("calculates correct metrics for populated data", () => {
    const records = [
      makeRecord({ child_id: "child-1", compliance_rating: "fully_followed", adapted: false, child_engaged: true }),
      makeRecord({ id: "rtn-2", child_id: "child-2", child_name: "Bob", compliance_rating: "mostly_followed", adapted: true, adaptation_reason: "child_request", child_engaged: true }),
      makeRecord({ id: "rtn-3", child_id: "child-1", compliance_rating: "not_followed", adapted: false, child_engaged: false }),
    ];
    const m = computeRoutineMetrics(records, 4);
    expect(m.total_records).toBe(3);
    expect(m.children_with_routines).toBe(2);
    expect(m.routine_coverage).toBe(50); // 2/4 = 50%
    expect(m.fully_followed_count).toBe(1);
    expect(m.mostly_followed_count).toBe(1);
    expect(m.not_followed_count).toBe(1);
    // compliance rate: 2 compliant out of 3 applicable = 66.7%
    expect(m.compliance_rate).toBe(66.7);
    expect(m.adapted_count).toBe(1);
    expect(m.adaptation_rate).toBe(33.3);
    expect(m.child_engaged_rate).toBe(66.7);
    expect(m.by_adaptation_reason).toEqual({ child_request: 1 });
  });

  it("handles not_applicable compliance correctly", () => {
    const records = [
      makeRecord({ compliance_rating: "not_applicable" }),
      makeRecord({ id: "rtn-2", compliance_rating: "fully_followed" }),
    ];
    const m = computeRoutineMetrics(records, 4);
    // Only 1 applicable record, and it's fully_followed => 100%
    expect(m.compliance_rate).toBe(100);
  });
});

// ── identifyRoutineAlerts ──────────────────────────────────────────────

describe("identifyRoutineAlerts", () => {
  it("returns no alerts for empty data", () => {
    const alerts = identifyRoutineAlerts([], 0);
    expect(alerts).toEqual([]);
  });

  it("alerts when children have no routine records (totalChildren > covered)", () => {
    const records = [makeRecord({ child_id: "child-1" })];
    const alerts = identifyRoutineAlerts(records, 4);
    const noRoutine = alerts.find((a) => a.type === "no_routine");
    expect(noRoutine).toBeDefined();
    expect(noRoutine!.severity).toBe("high");
    expect(noRoutine!.message).toContain("3 children have");
  });

  it("alerts for child with >50% not_followed rate (>=3 records)", () => {
    const records = [
      makeRecord({ child_id: "child-1", child_name: "Alice", compliance_rating: "not_followed" }),
      makeRecord({ id: "rtn-2", child_id: "child-1", child_name: "Alice", compliance_rating: "not_followed" }),
      makeRecord({ id: "rtn-3", child_id: "child-1", child_name: "Alice", compliance_rating: "fully_followed" }),
    ];
    const alerts = identifyRoutineAlerts(records, 1);
    const notFollowed = alerts.find((a) => a.type === "routine_not_followed");
    expect(notFollowed).toBeDefined();
    expect(notFollowed!.severity).toBe("high");
  });

  it("alerts when >=2 bedtime routines not followed", () => {
    const records = [
      makeRecord({ routine_slot: "bedtime", compliance_rating: "not_followed" }),
      makeRecord({ id: "rtn-2", routine_slot: "bedtime", compliance_rating: "not_followed" }),
    ];
    const alerts = identifyRoutineAlerts(records, 1);
    const bedtime = alerts.find((a) => a.type === "bedtime_disruption");
    expect(bedtime).toBeDefined();
    expect(bedtime!.severity).toBe("medium");
  });

  it("alerts when >=5 low engagement records", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `rtn-${i}`, child_engaged: false, compliance_rating: "fully_followed" }),
    );
    const alerts = identifyRoutineAlerts(records, 1);
    expect(alerts.find((a) => a.type === "low_engagement")).toBeDefined();
  });

  it("alerts when >=2 emergency adaptations", () => {
    const records = [
      makeRecord({ adapted: true, adaptation_reason: "emergency" }),
      makeRecord({ id: "rtn-2", adapted: true, adaptation_reason: "emergency" }),
    ];
    const alerts = identifyRoutineAlerts(records, 1);
    expect(alerts.find((a) => a.type === "emergency_adaptations")).toBeDefined();
  });
});
