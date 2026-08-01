import { describe, it, expect } from "vitest";
import {
  computeSafetyMetrics,
  identifySafetyAlerts,
  type SafetyCheck,
  type FireDrill,
} from "./environmental-safety-service";

const NOW = new Date("2026-05-21T12:00:00Z");

function makeCheck(overrides: Partial<SafetyCheck> = {}): SafetyCheck {
  return {
    id: "chk-1",
    home_id: "home-1",
    category: "fire_safety",
    check_name: "Fire Alarm Test",
    check_date: "2026-05-01",
    checked_by: "Staff A",
    frequency: "monthly",
    next_due_date: "2026-06-01",
    compliance_status: "compliant",
    findings: null,
    remedial_actions: [],
    certificate_reference: null,
    certificate_expiry: null,
    certificate_status: "valid",
    notes: null,
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

function makeDrill(overrides: Partial<FireDrill> = {}): FireDrill {
  return {
    id: "drill-1",
    home_id: "home-1",
    drill_date: "2026-05-01",
    drill_time: "10:00",
    drill_type: "planned",
    evacuation_time_seconds: 120,
    all_evacuated: true,
    children_present: 4,
    staff_present: 2,
    visitors_present: 0,
    assembly_point_used: "Front Car Park",
    issues_identified: null,
    actions_required: null,
    conducted_by: "Manager A",
    notes: null,
    created_at: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

describe("computeSafetyMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeSafetyMetrics([], []);
    expect(m.total_checks).toBe(0);
    expect(m.compliant_count).toBe(0);
    expect(m.compliance_rate).toBeNull();;
    expect(m.overdue_checks).toBe(0);
    expect(m.non_compliant_checks).toBe(0);
    expect(m.certificates_expiring_soon).toBe(0);
    expect(m.certificates_expired).toBe(0);
    expect(m.open_remedial_actions).toBe(0);
    expect(m.critical_actions).toBe(0);
    expect(m.drills_this_year).toBe(0);
    expect(m.avg_evacuation_time).toBeNull();;
  });

  it("computes correct counts and rates for populated data", () => {
    const checks: SafetyCheck[] = [
      makeCheck({ id: "c1", compliance_status: "compliant", category: "fire_safety" }),
      makeCheck({ id: "c2", compliance_status: "non_compliant", category: "legionella", certificate_status: "expired" }),
      makeCheck({ id: "c3", compliance_status: "overdue", certificate_status: "expiring_soon" }),
      makeCheck({
        id: "c4",
        compliance_status: "compliant",
        remedial_actions: [
          { action: "Fix wiring", priority: "critical", assigned_to: "Elec Team", due_date: "2026-05-30", completed: false, completion_date: null },
          { action: "Replace bulb", priority: "low", assigned_to: "Maint", due_date: "2026-06-15", completed: true, completion_date: "2026-05-10" },
        ],
      }),
    ];
    const drills: FireDrill[] = [
      makeDrill({ evacuation_time_seconds: 90 }),
      makeDrill({ id: "drill-2", evacuation_time_seconds: 150 }),
    ];
    const m = computeSafetyMetrics(checks, drills);
    expect(m.total_checks).toBe(4);
    expect(m.compliant_count).toBe(2);
    expect(m.compliance_rate).toBe(50);
    expect(m.overdue_checks).toBe(1);
    expect(m.non_compliant_checks).toBe(1);
    expect(m.certificates_expired).toBe(1);
    expect(m.certificates_expiring_soon).toBe(1);
    expect(m.open_remedial_actions).toBe(1);
    expect(m.critical_actions).toBe(1);
    expect(m.avg_evacuation_time).toBe(120); // (90+150)/2
    // c1 (fire_safety, compliant), c3 (fire_safety default, overdue), c4 (fire_safety default, compliant)
    expect(m.by_category["fire_safety"]).toEqual({ total: 3, compliant: 2 });
    expect(m.by_category["legionella"]).toEqual({ total: 1, compliant: 0 });
  });
});

describe("identifySafetyAlerts", () => {
  it("returns no alerts for empty data", () => {
    const alerts = identifySafetyAlerts([], [], NOW);
    expect(alerts).toEqual([]);
  });

  it("generates critical alert for non-compliant check", () => {
    const checks = [makeCheck({ compliance_status: "non_compliant" })];
    const alerts = identifySafetyAlerts(checks, [], NOW);
    const nc = alerts.filter((a) => a.type === "non_compliant");
    expect(nc).toHaveLength(1);
    expect(nc[0].severity).toBe("critical");
  });

  it("generates high alert for overdue check (next_due_date in past)", () => {
    const checks = [makeCheck({ next_due_date: "2026-04-01" })];
    const alerts = identifySafetyAlerts(checks, [], NOW);
    const overdue = alerts.filter((a) => a.type === "check_overdue");
    expect(overdue).toHaveLength(1);
    expect(overdue[0].severity).toBe("high");
  });

  it("generates critical alert for expired certificate", () => {
    const checks = [makeCheck({ certificate_status: "expired" })];
    const alerts = identifySafetyAlerts(checks, [], NOW);
    const expired = alerts.filter((a) => a.type === "certificate_expired");
    expect(expired).toHaveLength(1);
    expect(expired[0].severity).toBe("critical");
  });

  it("generates medium alert for expiring_soon certificate", () => {
    const checks = [makeCheck({ certificate_status: "expiring_soon" })];
    const alerts = identifySafetyAlerts(checks, [], NOW);
    const expiring = alerts.filter((a) => a.type === "certificate_expiring");
    expect(expiring).toHaveLength(1);
    expect(expiring[0].severity).toBe("medium");
  });

  it("generates critical alert for critical outstanding remedial action", () => {
    const checks = [makeCheck({
      remedial_actions: [
        { action: "Fix now", priority: "critical", assigned_to: "Bob", due_date: "2026-05-20", completed: false, completion_date: null },
      ],
    })];
    const alerts = identifySafetyAlerts(checks, [], NOW);
    const crit = alerts.filter((a) => a.type === "critical_action_outstanding");
    expect(crit).toHaveLength(1);
    expect(crit[0].severity).toBe("critical");
  });

  it("generates high alert when no fire drill in last 90 days", () => {
    const drills = [makeDrill({ drill_date: "2026-01-01" })];
    const alerts = identifySafetyAlerts([], drills, NOW);
    const noDrill = alerts.filter((a) => a.type === "no_recent_drill");
    expect(noDrill).toHaveLength(1);
    expect(noDrill[0].severity).toBe("high");
  });

  it("generates critical alert for failed evacuation", () => {
    const drills = [makeDrill({ all_evacuated: false })];
    const alerts = identifySafetyAlerts([], drills, NOW);
    const failed = alerts.filter((a) => a.type === "failed_evacuation");
    expect(failed).toHaveLength(1);
    expect(failed[0].severity).toBe("critical");
  });
});
