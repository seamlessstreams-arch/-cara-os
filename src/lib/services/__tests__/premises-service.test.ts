// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — PREMISES & MAINTENANCE SERVICE TESTS
// Pure-function tests for premises compliance, maintenance summaries,
// alert identification, check scheduling, and constant validation.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "../premises-service";
import {
  CHECK_TYPES,
  MAINTENANCE_PRIORITIES,
  MAINTENANCE_CATEGORIES,
} from "../premises-service";
import type { PremisesCheck, MaintenanceRequest } from "../premises-service";

const {
  computePremisesCompliance,
  computeMaintenanceSummary,
  identifyPremisesAlerts,
  computeCheckSchedule,
} = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Helper: ISO date string N days ago from now. */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

/** Helper: ISO date string N days from now. */
function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

/** Build a minimal PremisesCheck with sensible defaults. */
function makePremisesCheck(
  overrides: Partial<{
    id: string;
    home_id: string;
    check_type: string;
    check_date: string;
    completed_by: string;
    result: string;
    notes: string | null;
    issues_found: string[];
    follow_up_required: boolean;
    follow_up_date: string | null;
    certificate_reference: string | null;
    created_at: string;
  }> = {},
): PremisesCheck {
  return {
    id: "id" in overrides ? overrides.id! : "chk-1",
    home_id: "home_id" in overrides ? overrides.home_id! : "home-1",
    check_type: "check_type" in overrides ? overrides.check_type! : "fire_alarm_test",
    check_date: "check_date" in overrides ? overrides.check_date! : daysAgo(1),
    completed_by: "completed_by" in overrides ? overrides.completed_by! : "staff-1",
    result: "result" in overrides ? overrides.result! : "pass",
    notes: "notes" in overrides ? overrides.notes! : null,
    issues_found: "issues_found" in overrides ? overrides.issues_found! : [],
    follow_up_required: "follow_up_required" in overrides ? overrides.follow_up_required! : false,
    follow_up_date: "follow_up_date" in overrides ? overrides.follow_up_date! : null,
    certificate_reference: "certificate_reference" in overrides ? overrides.certificate_reference! : null,
    created_at: "created_at" in overrides ? overrides.created_at! : "2026-01-01T00:00:00Z",
  };
}

/** Build a minimal MaintenanceRequest with sensible defaults. */
function makeMaintenanceRequest(
  overrides: Partial<{
    id: string;
    home_id: string;
    title: string;
    description: string;
    category: string;
    priority: string;
    location: string;
    reported_by: string;
    reported_date: string;
    assigned_to: string | null;
    estimated_cost: number | null;
    actual_cost: number | null;
    completion_date: string | null;
    status: string;
    child_safety_risk: boolean;
    created_at: string;
    updated_at: string;
  }> = {},
): MaintenanceRequest {
  return {
    id: "id" in overrides ? overrides.id! : "maint-1",
    home_id: "home_id" in overrides ? overrides.home_id! : "home-1",
    title: "title" in overrides ? overrides.title! : "Fix broken window",
    description: "description" in overrides ? overrides.description! : "Window in bedroom 3 is cracked",
    category: "category" in overrides ? overrides.category! : "windows_doors",
    priority: "priority" in overrides ? overrides.priority! : "medium",
    location: "location" in overrides ? overrides.location! : "Bedroom 3",
    reported_by: "reported_by" in overrides ? overrides.reported_by! : "staff-1",
    reported_date: "reported_date" in overrides ? overrides.reported_date! : daysAgo(3),
    assigned_to: "assigned_to" in overrides ? overrides.assigned_to! : null,
    estimated_cost: "estimated_cost" in overrides ? overrides.estimated_cost! : null,
    actual_cost: "actual_cost" in overrides ? overrides.actual_cost! : null,
    completion_date: "completion_date" in overrides ? overrides.completion_date! : null,
    status: "status" in overrides ? overrides.status! : "open",
    child_safety_risk: "child_safety_risk" in overrides ? overrides.child_safety_risk! : false,
    created_at: "created_at" in overrides ? overrides.created_at! : "2026-01-01T00:00:00Z",
    updated_at: "updated_at" in overrides ? overrides.updated_at! : "2026-01-01T00:00:00Z",
  };
}

// ── CHECK_TYPES ──────────────────────────────────────────────────────────────

describe("CHECK_TYPES", () => {
  it("contains exactly 12 entries", () => {
    expect(CHECK_TYPES).toHaveLength(12);
  });

  it("has correct shape for each entry", () => {
    for (const ct of CHECK_TYPES) {
      expect(ct).toHaveProperty("type");
      expect(ct).toHaveProperty("label");
      expect(ct).toHaveProperty("frequency_days");
      expect(ct).toHaveProperty("statutory");
      expect(typeof ct.type).toBe("string");
      expect(typeof ct.label).toBe("string");
      expect(typeof ct.frequency_days).toBe("number");
      expect(typeof ct.statutory).toBe("boolean");
    }
  });

  it("includes fire_alarm_test with 7-day frequency", () => {
    const fire = CHECK_TYPES.find((ct) => ct.type === "fire_alarm_test");
    expect(fire).toBeDefined();
    expect(fire!.frequency_days).toBe(7);
    expect(fire!.statutory).toBe(true);
  });

  it("includes electrical_inspection with 1825-day frequency", () => {
    const eicr = CHECK_TYPES.find((ct) => ct.type === "electrical_inspection");
    expect(eicr).toBeDefined();
    expect(eicr!.frequency_days).toBe(1825);
    expect(eicr!.statutory).toBe(true);
  });

  it("marks h_and_s_audit as non-statutory", () => {
    const hs = CHECK_TYPES.find((ct) => ct.type === "h_and_s_audit");
    expect(hs).toBeDefined();
    expect(hs!.statutory).toBe(false);
  });

  it("has 9 statutory and 3 non-statutory check types", () => {
    const statutory = CHECK_TYPES.filter((ct) => ct.statutory);
    const nonStatutory = CHECK_TYPES.filter((ct) => !ct.statutory);
    expect(statutory).toHaveLength(9);
    expect(nonStatutory).toHaveLength(3);
  });
});

// ── MAINTENANCE_PRIORITIES ───────────────────────────────────────────────────

describe("MAINTENANCE_PRIORITIES", () => {
  it("contains exactly 4 priorities", () => {
    expect(MAINTENANCE_PRIORITIES).toHaveLength(4);
  });

  it("includes urgent, high, medium, low in that order", () => {
    expect(MAINTENANCE_PRIORITIES).toEqual(["urgent", "high", "medium", "low"]);
  });
});

// ── MAINTENANCE_CATEGORIES ───────────────────────────────────────────────────

describe("MAINTENANCE_CATEGORIES", () => {
  it("contains exactly 13 categories", () => {
    expect(MAINTENANCE_CATEGORIES).toHaveLength(13);
  });

  it("includes plumbing", () => {
    expect(MAINTENANCE_CATEGORIES).toContain("plumbing");
  });

  it("includes fire_safety", () => {
    expect(MAINTENANCE_CATEGORIES).toContain("fire_safety");
  });

  it("ends with other", () => {
    expect(MAINTENANCE_CATEGORIES[MAINTENANCE_CATEGORIES.length - 1]).toBe("other");
  });
});

// ── computePremisesCompliance ────────────────────────────────────────────────

describe("computePremisesCompliance", () => {
  it("returns perfect metrics for empty array", () => {
    const result = computePremisesCompliance([]);
    expect(result.total_checks).toBe(0);
    expect(result.pass_rate).toBe(100);
    expect(result.fail_count).toBe(0);
    expect(result.follow_ups_pending).toBe(0);
    expect(result.issues_found_count).toBe(0);
    // All 12 check types are overdue when no checks exist
    expect(result.overdue_checks).toHaveLength(12);
  });

  it("computes pass_rate from pass / (pass + fail + partial)", () => {
    const checks = [
      makePremisesCheck({ id: "1", result: "pass" }),
      makePremisesCheck({ id: "2", result: "fail" }),
      makePremisesCheck({ id: "3", result: "pass" }),
      makePremisesCheck({ id: "4", result: "partial" }),
    ];
    // 2 pass / 4 applicable = 50%
    const result = computePremisesCompliance(checks);
    expect(result.pass_rate).toBe(50);
    expect(result.fail_count).toBe(1);
  });

  it("excludes not_applicable results from pass rate", () => {
    const checks = [
      makePremisesCheck({ id: "1", result: "pass" }),
      makePremisesCheck({ id: "2", result: "not_applicable" }),
    ];
    // 1 pass / 1 applicable = 100%
    const result = computePremisesCompliance(checks);
    expect(result.pass_rate).toBe(100);
  });

  it("returns 100 pass_rate when no applicable checks exist", () => {
    const checks = [
      makePremisesCheck({ id: "1", result: "not_applicable" }),
      makePremisesCheck({ id: "2", result: "not_applicable" }),
    ];
    const result = computePremisesCompliance(checks);
    expect(result.pass_rate).toBe(100);
  });

  it("counts issues_found across all checks", () => {
    const checks = [
      makePremisesCheck({ id: "1", issues_found: ["issue A", "issue B"] }),
      makePremisesCheck({ id: "2", issues_found: ["issue C"] }),
      makePremisesCheck({ id: "3", issues_found: [] }),
    ];
    const result = computePremisesCompliance(checks);
    expect(result.issues_found_count).toBe(3);
  });

  it("counts follow-ups pending when follow_up_required and no follow_up_date", () => {
    const checks = [
      makePremisesCheck({ id: "1", follow_up_required: true, follow_up_date: null }),
      makePremisesCheck({ id: "2", follow_up_required: true, follow_up_date: daysFromNow(10) }),
      makePremisesCheck({ id: "3", follow_up_required: false }),
    ];
    const result = computePremisesCompliance(checks);
    // 1 with no date + 1 with future date = 2 pending
    expect(result.follow_ups_pending).toBe(2);
  });

  it("does not count follow-up as pending when follow_up_date is in the past", () => {
    const checks = [
      makePremisesCheck({ id: "1", follow_up_required: true, follow_up_date: daysAgo(5) }),
    ];
    const result = computePremisesCompliance(checks);
    expect(result.follow_ups_pending).toBe(0);
  });

  it("detects overdue checks when last check was long ago", () => {
    // Fire alarm test has 7-day frequency; do one 30 days ago -> overdue
    const checks = [
      makePremisesCheck({ id: "1", check_type: "fire_alarm_test", check_date: daysAgo(30) }),
    ];
    const result = computePremisesCompliance(checks);
    const overdueFireAlarm = result.overdue_checks.find(
      (o) => o.check_type === "fire_alarm_test",
    );
    expect(overdueFireAlarm).toBeDefined();
    expect(overdueFireAlarm!.days_overdue).toBeGreaterThan(0);
    expect(overdueFireAlarm!.last_done).toBe(daysAgo(30));
  });

  it("does not mark a check as overdue if done within its frequency window", () => {
    // Fire alarm test has 7-day frequency; done 1 day ago -> not overdue
    const checks = [
      makePremisesCheck({ id: "1", check_type: "fire_alarm_test", check_date: daysAgo(1) }),
    ];
    const result = computePremisesCompliance(checks);
    const overdueFireAlarm = result.overdue_checks.find(
      (o) => o.check_type === "fire_alarm_test",
    );
    expect(overdueFireAlarm).toBeUndefined();
  });

  it("marks never-done checks as overdue with days_overdue equal to frequency_days", () => {
    const result = computePremisesCompliance([]);
    const neverDone = result.overdue_checks.find(
      (o) => o.check_type === "fire_alarm_test",
    );
    expect(neverDone).toBeDefined();
    expect(neverDone!.last_done).toBeNull();
    expect(neverDone!.days_overdue).toBe(7);
  });

  it("computes statutory_compliance_rate based on up-to-date statutory checks", () => {
    // There are 9 statutory check types. Supply recent checks for 2 of them.
    const checks = [
      makePremisesCheck({ id: "1", check_type: "fire_alarm_test", check_date: daysAgo(1) }),
      makePremisesCheck({ id: "2", check_type: "emergency_lighting", check_date: daysAgo(1) }),
    ];
    const result = computePremisesCompliance(checks);
    // 2 up to date / 9 total statutory = 22.2%
    expect(result.statutory_compliance_rate).toBe(22.2);
  });

  it("returns 100% statutory_compliance_rate when all statutory checks are current", () => {
    // All 9 statutory check types done within their frequency
    const statutoryTypes = CHECK_TYPES.filter((ct) => ct.statutory);
    const checks = statutoryTypes.map((ct, i) =>
      makePremisesCheck({ id: `s-${i}`, check_type: ct.type, check_date: daysAgo(1) }),
    );
    const result = computePremisesCompliance(checks);
    expect(result.statutory_compliance_rate).toBe(100);
  });

  it("uses the most recent check_date when multiple checks of same type exist", () => {
    // Fire alarm: old one 30 days ago (overdue), but recent one 2 days ago (ok)
    const checks = [
      makePremisesCheck({ id: "1", check_type: "fire_alarm_test", check_date: daysAgo(30) }),
      makePremisesCheck({ id: "2", check_type: "fire_alarm_test", check_date: daysAgo(2) }),
    ];
    const result = computePremisesCompliance(checks);
    const overdueFireAlarm = result.overdue_checks.find(
      (o) => o.check_type === "fire_alarm_test",
    );
    expect(overdueFireAlarm).toBeUndefined();
  });
});

// ── computeMaintenanceSummary ────────────────────────────────────────────────

describe("computeMaintenanceSummary", () => {
  it("returns zeroed metrics for empty array", () => {
    const result = computeMaintenanceSummary([]);
    expect(result.total_requests).toBe(0);
    expect(result.open).toBe(0);
    expect(result.in_progress).toBe(0);
    expect(result.completed).toBe(0);
    expect(result.by_priority).toEqual({});
    expect(result.by_category).toEqual({});
    expect(result.avg_resolution_days).toBe(0);
    expect(result.safety_risks_open).toBe(0);
    expect(result.total_cost).toBe(0);
    expect(result.overdue_urgent).toBe(0);
  });

  it("counts requests by status correctly", () => {
    const requests = [
      makeMaintenanceRequest({ id: "1", status: "open" }),
      makeMaintenanceRequest({ id: "2", status: "open" }),
      makeMaintenanceRequest({ id: "3", status: "in_progress" }),
      makeMaintenanceRequest({ id: "4", status: "completed" }),
      makeMaintenanceRequest({ id: "5", status: "awaiting_parts" }),
      makeMaintenanceRequest({ id: "6", status: "cancelled" }),
    ];
    const result = computeMaintenanceSummary(requests);
    expect(result.total_requests).toBe(6);
    expect(result.open).toBe(2);
    expect(result.in_progress).toBe(1);
    expect(result.completed).toBe(1);
  });

  it("groups requests by priority", () => {
    const requests = [
      makeMaintenanceRequest({ id: "1", priority: "urgent" }),
      makeMaintenanceRequest({ id: "2", priority: "urgent" }),
      makeMaintenanceRequest({ id: "3", priority: "high" }),
      makeMaintenanceRequest({ id: "4", priority: "low" }),
    ];
    const result = computeMaintenanceSummary(requests);
    expect(result.by_priority).toEqual({ urgent: 2, high: 1, low: 1 });
  });

  it("groups requests by category", () => {
    const requests = [
      makeMaintenanceRequest({ id: "1", category: "plumbing" }),
      makeMaintenanceRequest({ id: "2", category: "plumbing" }),
      makeMaintenanceRequest({ id: "3", category: "electrical" }),
    ];
    const result = computeMaintenanceSummary(requests);
    expect(result.by_category).toEqual({ plumbing: 2, electrical: 1 });
  });

  it("computes avg_resolution_days for completed requests", () => {
    const requests = [
      makeMaintenanceRequest({
        id: "1",
        status: "completed",
        reported_date: "2026-01-01",
        completion_date: "2026-01-11",
      }),
      makeMaintenanceRequest({
        id: "2",
        status: "completed",
        reported_date: "2026-01-01",
        completion_date: "2026-01-06",
      }),
    ];
    const result = computeMaintenanceSummary(requests);
    // (10 + 5) / 2 = 7.5
    expect(result.avg_resolution_days).toBe(7.5);
  });

  it("returns 0 avg_resolution_days when no completed requests", () => {
    const requests = [makeMaintenanceRequest({ status: "open" })];
    const result = computeMaintenanceSummary(requests);
    expect(result.avg_resolution_days).toBe(0);
  });

  it("counts safety_risks_open for open/in_progress with child_safety_risk", () => {
    const requests = [
      makeMaintenanceRequest({ id: "1", status: "open", child_safety_risk: true }),
      makeMaintenanceRequest({ id: "2", status: "in_progress", child_safety_risk: true }),
      makeMaintenanceRequest({ id: "3", status: "completed", child_safety_risk: true }),
      makeMaintenanceRequest({ id: "4", status: "open", child_safety_risk: false }),
    ];
    const result = computeMaintenanceSummary(requests);
    expect(result.safety_risks_open).toBe(2);
  });

  it("sums total_cost from actual_cost of completed requests only", () => {
    const requests = [
      makeMaintenanceRequest({ id: "1", status: "completed", actual_cost: 150.50 }),
      makeMaintenanceRequest({ id: "2", status: "completed", actual_cost: 200 }),
      makeMaintenanceRequest({ id: "3", status: "open", actual_cost: 999 }),
      makeMaintenanceRequest({ id: "4", status: "completed", actual_cost: null }),
    ];
    const result = computeMaintenanceSummary(requests);
    expect(result.total_cost).toBe(350.50);
  });

  it("rounds total_cost to 2 decimal places", () => {
    const requests = [
      makeMaintenanceRequest({ id: "1", status: "completed", actual_cost: 33.333 }),
      makeMaintenanceRequest({ id: "2", status: "completed", actual_cost: 66.667 }),
    ];
    const result = computeMaintenanceSummary(requests);
    expect(result.total_cost).toBe(100);
  });

  it("counts overdue_urgent when urgent open/in_progress > 7 days old", () => {
    const requests = [
      makeMaintenanceRequest({
        id: "1",
        priority: "urgent",
        status: "open",
        reported_date: daysAgo(10),
      }),
      makeMaintenanceRequest({
        id: "2",
        priority: "urgent",
        status: "in_progress",
        reported_date: daysAgo(8),
      }),
      // Not overdue: only 3 days old
      makeMaintenanceRequest({
        id: "3",
        priority: "urgent",
        status: "open",
        reported_date: daysAgo(3),
      }),
      // Not urgent
      makeMaintenanceRequest({
        id: "4",
        priority: "high",
        status: "open",
        reported_date: daysAgo(20),
      }),
      // Completed, not counted
      makeMaintenanceRequest({
        id: "5",
        priority: "urgent",
        status: "completed",
        reported_date: daysAgo(15),
      }),
    ];
    const result = computeMaintenanceSummary(requests);
    expect(result.overdue_urgent).toBe(2);
  });

  it("does not count awaiting_parts or cancelled in overdue_urgent", () => {
    const requests = [
      makeMaintenanceRequest({
        id: "1",
        priority: "urgent",
        status: "awaiting_parts",
        reported_date: daysAgo(30),
      }),
      makeMaintenanceRequest({
        id: "2",
        priority: "urgent",
        status: "cancelled",
        reported_date: daysAgo(30),
      }),
    ];
    const result = computeMaintenanceSummary(requests);
    expect(result.overdue_urgent).toBe(0);
  });
});

// ── identifyPremisesAlerts ──────────────────────────────────────────────────

describe("identifyPremisesAlerts", () => {
  it("returns no alerts when all statutory checks are current and no issues", () => {
    // Provide recent checks for all 12 types
    const checks = CHECK_TYPES.map((ct, i) =>
      makePremisesCheck({ id: `c-${i}`, check_type: ct.type, check_date: daysAgo(1) }),
    );
    const result = identifyPremisesAlerts(checks, []);
    expect(result).toHaveLength(0);
  });

  it("returns check_overdue alerts for all statutory checks when empty", () => {
    const result = identifyPremisesAlerts([], []);
    const overdueAlerts = result.filter((a) => a.type === "check_overdue");
    // Only statutory checks trigger check_overdue alerts (9 types)
    expect(overdueAlerts).toHaveLength(9);
  });

  it("marks fire-related overdue checks as critical severity", () => {
    const result = identifyPremisesAlerts([], []);
    const fireAlarmAlert = result.find(
      (a) => a.type === "check_overdue" && a.message.includes("Fire Alarm Test"),
    );
    expect(fireAlarmAlert).toBeDefined();
    expect(fireAlarmAlert!.severity).toBe("critical");
  });

  it("marks non-fire statutory overdue checks as high severity", () => {
    const result = identifyPremisesAlerts([], []);
    const legionellaAlert = result.find(
      (a) => a.type === "check_overdue" && a.message.includes("Legionella Check"),
    );
    expect(legionellaAlert).toBeDefined();
    expect(legionellaAlert!.severity).toBe("high");
  });

  it("does not generate overdue alerts for non-statutory check types", () => {
    const result = identifyPremisesAlerts([], []);
    const nonStatutoryTypes = CHECK_TYPES.filter((ct) => !ct.statutory).map((ct) => ct.label);
    for (const label of nonStatutoryTypes) {
      const alert = result.find(
        (a) => a.type === "check_overdue" && a.message.includes(label),
      );
      expect(alert).toBeUndefined();
    }
  });

  it("creates check_failed alert for each failed check", () => {
    const checks = [
      makePremisesCheck({ id: "1", check_type: "fire_alarm_test", result: "fail", check_date: daysAgo(1) }),
      makePremisesCheck({ id: "2", check_type: "gas_safety", result: "fail", check_date: daysAgo(1) }),
      makePremisesCheck({ id: "3", check_type: "fire_alarm_test", result: "pass", check_date: daysAgo(1) }),
    ];
    // Provide all check types current to avoid overdue noise
    const allCurrent = CHECK_TYPES.map((ct, i) =>
      makePremisesCheck({ id: `cur-${i}`, check_type: ct.type, check_date: daysAgo(1) }),
    );
    const result = identifyPremisesAlerts([...checks, ...allCurrent], []);
    const failedAlerts = result.filter((a) => a.type === "check_failed");
    expect(failedAlerts).toHaveLength(2);
    expect(failedAlerts[0].severity).toBe("high");
  });

  it("creates safety_risk alert for open maintenance with child_safety_risk", () => {
    const req = makeMaintenanceRequest({
      title: "Broken stairgate",
      status: "open",
      child_safety_risk: true,
    });
    // Supply all checks current to isolate the alert
    const checks = CHECK_TYPES.map((ct, i) =>
      makePremisesCheck({ id: `c-${i}`, check_type: ct.type, check_date: daysAgo(1) }),
    );
    const result = identifyPremisesAlerts(checks, [req]);
    const safetyAlerts = result.filter((a) => a.type === "safety_risk");
    expect(safetyAlerts).toHaveLength(1);
    expect(safetyAlerts[0].severity).toBe("critical");
    expect(safetyAlerts[0].message).toContain("Broken stairgate");
  });

  it("creates safety_risk alert for in_progress maintenance with child_safety_risk", () => {
    const req = makeMaintenanceRequest({
      title: "Exposed wiring",
      status: "in_progress",
      child_safety_risk: true,
    });
    const checks = CHECK_TYPES.map((ct, i) =>
      makePremisesCheck({ id: `c-${i}`, check_type: ct.type, check_date: daysAgo(1) }),
    );
    const result = identifyPremisesAlerts(checks, [req]);
    const safetyAlerts = result.filter((a) => a.type === "safety_risk");
    expect(safetyAlerts).toHaveLength(1);
    expect(safetyAlerts[0].message).toContain("in_progress");
  });

  it("does not create safety_risk alert for completed or cancelled requests", () => {
    const requests = [
      makeMaintenanceRequest({ id: "1", status: "completed", child_safety_risk: true }),
      makeMaintenanceRequest({ id: "2", status: "cancelled", child_safety_risk: true }),
    ];
    const checks = CHECK_TYPES.map((ct, i) =>
      makePremisesCheck({ id: `c-${i}`, check_type: ct.type, check_date: daysAgo(1) }),
    );
    const result = identifyPremisesAlerts(checks, requests);
    const safetyAlerts = result.filter((a) => a.type === "safety_risk");
    expect(safetyAlerts).toHaveLength(0);
  });

  it("creates urgent_maintenance alert when urgent open > 3 days", () => {
    const req = makeMaintenanceRequest({
      title: "Boiler failure",
      priority: "urgent",
      status: "open",
      reported_date: daysAgo(5),
    });
    const checks = CHECK_TYPES.map((ct, i) =>
      makePremisesCheck({ id: `c-${i}`, check_type: ct.type, check_date: daysAgo(1) }),
    );
    const result = identifyPremisesAlerts(checks, [req]);
    const urgentAlerts = result.filter((a) => a.type === "urgent_maintenance");
    expect(urgentAlerts).toHaveLength(1);
    expect(urgentAlerts[0].severity).toBe("high");
    expect(urgentAlerts[0].message).toContain("Boiler failure");
    expect(urgentAlerts[0].message).toContain("5 days");
  });

  it("does not create urgent_maintenance alert when urgent < 3 days old", () => {
    const req = makeMaintenanceRequest({
      priority: "urgent",
      status: "open",
      reported_date: daysAgo(1),
    });
    const checks = CHECK_TYPES.map((ct, i) =>
      makePremisesCheck({ id: `c-${i}`, check_type: ct.type, check_date: daysAgo(1) }),
    );
    const result = identifyPremisesAlerts(checks, [req]);
    const urgentAlerts = result.filter((a) => a.type === "urgent_maintenance");
    expect(urgentAlerts).toHaveLength(0);
  });

  it("creates high_maintenance_backlog alert when 5+ open/in_progress/awaiting_parts", () => {
    const requests = [
      makeMaintenanceRequest({ id: "1", status: "open" }),
      makeMaintenanceRequest({ id: "2", status: "in_progress" }),
      makeMaintenanceRequest({ id: "3", status: "awaiting_parts" }),
      makeMaintenanceRequest({ id: "4", status: "open" }),
      makeMaintenanceRequest({ id: "5", status: "open" }),
    ];
    const checks = CHECK_TYPES.map((ct, i) =>
      makePremisesCheck({ id: `c-${i}`, check_type: ct.type, check_date: daysAgo(1) }),
    );
    const result = identifyPremisesAlerts(checks, requests);
    const backlogAlerts = result.filter((a) => a.type === "high_maintenance_backlog");
    expect(backlogAlerts).toHaveLength(1);
    expect(backlogAlerts[0].severity).toBe("medium");
    expect(backlogAlerts[0].message).toContain("5");
  });

  it("does not create backlog alert when fewer than 5 outstanding requests", () => {
    const requests = [
      makeMaintenanceRequest({ id: "1", status: "open" }),
      makeMaintenanceRequest({ id: "2", status: "in_progress" }),
      makeMaintenanceRequest({ id: "3", status: "completed" }),
      makeMaintenanceRequest({ id: "4", status: "completed" }),
    ];
    const checks = CHECK_TYPES.map((ct, i) =>
      makePremisesCheck({ id: `c-${i}`, check_type: ct.type, check_date: daysAgo(1) }),
    );
    const result = identifyPremisesAlerts(checks, requests);
    const backlogAlerts = result.filter((a) => a.type === "high_maintenance_backlog");
    expect(backlogAlerts).toHaveLength(0);
  });
});

// ── computeCheckSchedule ────────────────────────────────────────────────────

describe("computeCheckSchedule", () => {
  it("returns all 12 check types even with no checks", () => {
    const schedule = computeCheckSchedule([]);
    expect(schedule).toHaveLength(12);
  });

  it("marks never-done checks as due today (days_until = 0, not overdue)", () => {
    const schedule = computeCheckSchedule([]);
    for (const entry of schedule) {
      expect(entry.last_done).toBeNull();
      // Never-done: nextDue = now, so days_until = 0 and overdue = false (0 < 0 is false)
      expect(entry.days_until).toBe(0);
      expect(entry.overdue).toBe(false);
    }
  });

  it("sorts by days_until ascending (most urgent first)", () => {
    // Provide a recent fire alarm (due in 6 days) and an old gas safety (overdue)
    const checks = [
      makePremisesCheck({ id: "1", check_type: "fire_alarm_test", check_date: daysAgo(1) }),
      makePremisesCheck({ id: "2", check_type: "gas_safety", check_date: daysAgo(400) }),
    ];
    const schedule = computeCheckSchedule(checks);
    for (let i = 1; i < schedule.length; i++) {
      expect(schedule[i].days_until).toBeGreaterThanOrEqual(schedule[i - 1].days_until);
    }
  });

  it("computes correct next_due and days_until for a recent check", () => {
    const checkDate = daysAgo(3);
    const checks = [
      makePremisesCheck({ id: "1", check_type: "fire_alarm_test", check_date: checkDate }),
    ];
    const schedule = computeCheckSchedule(checks);
    const fireEntry = schedule.find((s) => s.check_type === "fire_alarm_test")!;
    expect(fireEntry.last_done).toBe(checkDate);
    // Fire alarm frequency = 7 days, done 3 days ago
    // days_until depends on time-of-day due to Math.floor; should be 3 or 4
    expect(fireEntry.days_until).toBeGreaterThanOrEqual(3);
    expect(fireEntry.days_until).toBeLessThanOrEqual(4);
    expect(fireEntry.overdue).toBe(false);
  });

  it("marks a check as overdue when past its frequency", () => {
    const checks = [
      makePremisesCheck({ id: "1", check_type: "fire_alarm_test", check_date: daysAgo(20) }),
    ];
    const schedule = computeCheckSchedule(checks);
    const fireEntry = schedule.find((s) => s.check_type === "fire_alarm_test")!;
    expect(fireEntry.overdue).toBe(true);
    expect(fireEntry.days_until).toBeLessThan(0);
  });

  it("uses the most recent check when multiple exist for same type", () => {
    const recentDate = daysAgo(2);
    const checks = [
      makePremisesCheck({ id: "1", check_type: "fire_alarm_test", check_date: daysAgo(50) }),
      makePremisesCheck({ id: "2", check_type: "fire_alarm_test", check_date: recentDate }),
    ];
    const schedule = computeCheckSchedule(checks);
    const fireEntry = schedule.find((s) => s.check_type === "fire_alarm_test")!;
    expect(fireEntry.last_done).toBe(recentDate);
    // 7 - 2 = 5, but Math.floor may give 4 depending on time-of-day
    expect(fireEntry.days_until).toBeGreaterThanOrEqual(4);
    expect(fireEntry.days_until).toBeLessThanOrEqual(5);
    expect(fireEntry.overdue).toBe(false);
  });

  it("returns correct next_due date format (YYYY-MM-DD)", () => {
    const checks = [
      makePremisesCheck({ id: "1", check_type: "fire_alarm_test", check_date: daysAgo(1) }),
    ];
    const schedule = computeCheckSchedule(checks);
    const fireEntry = schedule.find((s) => s.check_type === "fire_alarm_test")!;
    expect(fireEntry.next_due).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("handles long-frequency checks correctly (EICR 1825 days)", () => {
    const checks = [
      makePremisesCheck({ id: "1", check_type: "electrical_inspection", check_date: daysAgo(100) }),
    ];
    const schedule = computeCheckSchedule(checks);
    const eicrEntry = schedule.find((s) => s.check_type === "electrical_inspection")!;
    // 1825 - 100 = 1725, but Math.floor may give 1724 depending on time-of-day
    expect(eicrEntry.days_until).toBeGreaterThanOrEqual(1724);
    expect(eicrEntry.days_until).toBeLessThanOrEqual(1725);
    expect(eicrEntry.overdue).toBe(false);
  });

  it("returns label and check_type for each entry", () => {
    const schedule = computeCheckSchedule([]);
    for (const entry of schedule) {
      expect(typeof entry.check_type).toBe("string");
      expect(typeof entry.label).toBe("string");
      expect(entry.check_type.length).toBeGreaterThan(0);
      expect(entry.label.length).toBeGreaterThan(0);
    }
  });

  it("sets next_due to today for never-done checks", () => {
    const schedule = computeCheckSchedule([]);
    const today = new Date().toISOString().split("T")[0];
    for (const entry of schedule) {
      expect(entry.next_due).toBe(today);
    }
  });

  it("provides all CHECK_TYPES entries in the schedule", () => {
    const schedule = computeCheckSchedule([]);
    const scheduledTypes = schedule.map((s) => s.check_type);
    for (const ct of CHECK_TYPES) {
      expect(scheduledTypes).toContain(ct.type);
    }
  });
});
