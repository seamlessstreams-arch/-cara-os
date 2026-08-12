import { describe, it, expect } from "vitest";
import { todayStr, daysFromNow} from "@/lib/utils";
import {
  computeFireSafetyMetrics,
  identifyFireSafetyAlerts,
  type FireSafetyRecord,
} from "./fire-safety-service";

function makeRecord(overrides: Partial<FireSafetyRecord> = {}): FireSafetyRecord {
  return {
    id: "rec-1",
    home_id: "home-1",
    event_type: "planned_drill",
    event_date: "2026-05-20",
    evacuation_result: "successful",
    evacuation_time_seconds: 120,
    all_persons_accounted: true,
    children_present: 4,
    staff_present: 2,
    compliance_status: "compliant",
    equipment_status: "operational",
    issues_identified: [],
    actions_taken: [],
    conducted_by: "Staff A",
    fire_service_attended: false,
    peep_plans_followed: true,
    night_staff_competent: null,
    next_drill_date: null,
    review_date: null,
    notes: null,
    created_at: "2026-05-20T10:00:00Z",
    updated_at: "2026-05-20T10:00:00Z",
    ...overrides,
  };
}

// ── computeFireSafetyMetrics ────────────────────────────────────────────

describe("computeFireSafetyMetrics", () => {
  it("returns zeroes for empty data", () => {
    const result = computeFireSafetyMetrics([]);
    expect(result.total_events).toBe(0);
    expect(result.drills_count).toBe(0);
    expect(result.successful_evacuation_rate).toBeNull(); // fab-0.
    expect(result.average_evacuation_time).toBeNull(); // fab-0.
    expect(result.drill_overdue).toBe(true); // no drills at all
  });

  it("counts event types correctly", () => {
    const records = [
      makeRecord({ id: "r1", event_type: "planned_drill" }),
      makeRecord({ id: "r2", event_type: "unannounced_drill" }),
      makeRecord({ id: "r3", event_type: "night_drill" }),
      makeRecord({ id: "r4", event_type: "actual_fire" }),
      makeRecord({ id: "r5", event_type: "false_alarm" }),
      makeRecord({ id: "r6", event_type: "equipment_check" }),
      makeRecord({ id: "r7", event_type: "risk_assessment" }),
    ];
    const result = computeFireSafetyMetrics(records);
    expect(result.total_events).toBe(7);
    expect(result.drills_count).toBe(3);
    expect(result.night_drills_count).toBe(1);
    expect(result.actual_fires_count).toBe(1);
    expect(result.false_alarms_count).toBe(1);
    expect(result.equipment_checks_count).toBe(1);
    expect(result.risk_assessments_count).toBe(1);
  });

  it("computes evacuation rates and times", () => {
    const records = [
      makeRecord({ id: "r1", evacuation_result: "successful", evacuation_time_seconds: 100 }),
      makeRecord({ id: "r2", evacuation_result: "failed", evacuation_time_seconds: 200 }),
      makeRecord({ id: "r3", evacuation_result: "not_applicable", evacuation_time_seconds: null }),
    ];
    const result = computeFireSafetyMetrics(records);
    // 1 successful out of 2 applicable = 50%
    expect(result.successful_evacuation_rate).toBe(50);
    // average of 100 and 200 = 150
    expect(result.average_evacuation_time).toBe(150);
  });

  it("detects drill_overdue when last drill > 30 days ago", () => {
    const oldDate = daysFromNow(-35);
    const records = [makeRecord({ event_date: oldDate })];
    const result = computeFireSafetyMetrics(records);
    expect(result.drill_overdue).toBe(true);
  });

  it("drill_overdue is false when drill is recent", () => {
    const recentDate = todayStr();
    const records = [makeRecord({ event_date: recentDate })];
    const result = computeFireSafetyMetrics(records);
    expect(result.drill_overdue).toBe(false);
  });
});

// ── identifyFireSafetyAlerts ────────────────────────────────────────────

describe("identifyFireSafetyAlerts", () => {
  it("returns empty alerts for empty data except drill_overdue", () => {
    const alerts = identifyFireSafetyAlerts([]);
    // should get a drill_overdue alert since no drills exist
    expect(alerts.some((a) => a.type === "drill_overdue")).toBe(true);
    expect(alerts.find((a) => a.type === "drill_overdue")!.severity).toBe("medium");
  });

  it("triggers failed_evacuation critical alert", () => {
    const records = [makeRecord({ evacuation_result: "failed", event_date: todayStr() })];
    const alerts = identifyFireSafetyAlerts(records);
    const failed = alerts.find((a) => a.type === "failed_evacuation");
    expect(failed).toBeDefined();
    expect(failed!.severity).toBe("critical");
  });

  it("triggers persons_not_accounted critical alert", () => {
    const records = [makeRecord({ all_persons_accounted: false, evacuation_result: "successful", event_date: todayStr() })];
    const alerts = identifyFireSafetyAlerts(records);
    const notAccounted = alerts.find((a) => a.type === "persons_not_accounted");
    expect(notAccounted).toBeDefined();
    expect(notAccounted!.severity).toBe("critical");
  });

  it("triggers non_compliant high alert", () => {
    const records = [makeRecord({ compliance_status: "non_compliant", event_date: todayStr() })];
    const alerts = identifyFireSafetyAlerts(records);
    const nc = alerts.find((a) => a.type === "non_compliant");
    expect(nc).toBeDefined();
    expect(nc!.severity).toBe("high");
  });

  it("triggers equipment_out_of_service high alert", () => {
    const records = [makeRecord({ equipment_status: "out_of_service", event_date: todayStr() })];
    const alerts = identifyFireSafetyAlerts(records);
    const oos = alerts.find((a) => a.type === "equipment_out_of_service");
    expect(oos).toBeDefined();
    expect(oos!.severity).toBe("high");
  });
});
