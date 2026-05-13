// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — FIRE SAFETY & DRILLS SERVICE TESTS
// Pure-function tests for fire safety metrics, alert identification,
// constant validation, and edge cases.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";

import {
  FIRE_EVENT_TYPES,
  EVACUATION_RESULTS,
  COMPLIANCE_STATUSES,
  EQUIPMENT_STATUSES,
  _testing,
} from "../fire-safety-service";

import type {
  FireSafetyRecord,
  FireEventType,
  EvacuationResult,
  ComplianceStatus,
  EquipmentStatus,
} from "../fire-safety-service";

const { computeFireSafetyMetrics, identifyFireSafetyAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

function makeRecord(
  overrides?: Partial<FireSafetyRecord>,
): FireSafetyRecord {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : crypto.randomUUID(),
    home_id: "home_id" in (overrides ?? {}) ? overrides!.home_id! : "home-1",
    event_type: "event_type" in (overrides ?? {}) ? overrides!.event_type! : "planned_drill",
    event_date: "event_date" in (overrides ?? {}) ? overrides!.event_date! : "2026-05-01",
    evacuation_result: "evacuation_result" in (overrides ?? {}) ? overrides!.evacuation_result! : "successful",
    evacuation_time_seconds: "evacuation_time_seconds" in (overrides ?? {}) ? (overrides!.evacuation_time_seconds ?? null) : 120,
    all_persons_accounted: "all_persons_accounted" in (overrides ?? {}) ? overrides!.all_persons_accounted! : true,
    children_present: "children_present" in (overrides ?? {}) ? overrides!.children_present! : 4,
    staff_present: "staff_present" in (overrides ?? {}) ? overrides!.staff_present! : 3,
    compliance_status: "compliance_status" in (overrides ?? {}) ? overrides!.compliance_status! : "compliant",
    equipment_status: "equipment_status" in (overrides ?? {}) ? overrides!.equipment_status! : "operational",
    issues_identified: "issues_identified" in (overrides ?? {}) ? overrides!.issues_identified! : [],
    actions_taken: "actions_taken" in (overrides ?? {}) ? overrides!.actions_taken! : [],
    conducted_by: "conducted_by" in (overrides ?? {}) ? overrides!.conducted_by! : "Manager",
    fire_service_attended: "fire_service_attended" in (overrides ?? {}) ? overrides!.fire_service_attended! : false,
    peep_plans_followed: "peep_plans_followed" in (overrides ?? {}) ? overrides!.peep_plans_followed! : true,
    night_staff_competent: "night_staff_competent" in (overrides ?? {}) ? (overrides!.night_staff_competent ?? null) : null,
    next_drill_date: "next_drill_date" in (overrides ?? {}) ? (overrides!.next_drill_date ?? null) : null,
    review_date: "review_date" in (overrides ?? {}) ? (overrides!.review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: "created_at" in (overrides ?? {}) ? overrides!.created_at! : "2026-05-01T08:00:00Z",
    updated_at: "updated_at" in (overrides ?? {}) ? overrides!.updated_at! : "2026-05-01T08:00:00Z",
  };
}

/** Return an ISO date string for N days ago from now */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

// ── Constants ──────────────────────────────────────────────────────────────

describe("Constants", () => {
  describe("FIRE_EVENT_TYPES", () => {
    it("has exactly 9 items", () => {
      expect(FIRE_EVENT_TYPES).toHaveLength(9);
    });

    it("contains planned_drill", () => {
      expect(FIRE_EVENT_TYPES).toContainEqual({ type: "planned_drill", label: "Planned Drill" });
    });

    it("contains unannounced_drill", () => {
      expect(FIRE_EVENT_TYPES).toContainEqual({ type: "unannounced_drill", label: "Unannounced Drill" });
    });

    it("contains night_drill", () => {
      expect(FIRE_EVENT_TYPES).toContainEqual({ type: "night_drill", label: "Night Drill" });
    });

    it("contains actual_fire", () => {
      expect(FIRE_EVENT_TYPES).toContainEqual({ type: "actual_fire", label: "Actual Fire" });
    });

    it("contains false_alarm", () => {
      expect(FIRE_EVENT_TYPES).toContainEqual({ type: "false_alarm", label: "False Alarm" });
    });

    it("contains equipment_check", () => {
      expect(FIRE_EVENT_TYPES).toContainEqual({ type: "equipment_check", label: "Equipment Check" });
    });

    it("contains risk_assessment", () => {
      expect(FIRE_EVENT_TYPES).toContainEqual({ type: "risk_assessment", label: "Risk Assessment" });
    });

    it("contains staff_training", () => {
      expect(FIRE_EVENT_TYPES).toContainEqual({ type: "staff_training", label: "Staff Training" });
    });

    it("contains other", () => {
      expect(FIRE_EVENT_TYPES).toContainEqual({ type: "other", label: "Other" });
    });

    it("has unique type values", () => {
      const types = FIRE_EVENT_TYPES.map((t) => t.type);
      expect(new Set(types).size).toBe(types.length);
    });

    it("has unique labels", () => {
      const labels = FIRE_EVENT_TYPES.map((t) => t.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of FIRE_EVENT_TYPES) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });
  });

  describe("EVACUATION_RESULTS", () => {
    it("has exactly 4 items", () => {
      expect(EVACUATION_RESULTS).toHaveLength(4);
    });

    it("contains successful", () => {
      expect(EVACUATION_RESULTS).toContainEqual({ result: "successful", label: "Successful" });
    });

    it("contains partial", () => {
      expect(EVACUATION_RESULTS).toContainEqual({ result: "partial", label: "Partial" });
    });

    it("contains failed", () => {
      expect(EVACUATION_RESULTS).toContainEqual({ result: "failed", label: "Failed" });
    });

    it("contains not_applicable", () => {
      expect(EVACUATION_RESULTS).toContainEqual({ result: "not_applicable", label: "Not Applicable" });
    });

    it("has unique result values", () => {
      const results = EVACUATION_RESULTS.map((r) => r.result);
      expect(new Set(results).size).toBe(results.length);
    });

    it("has unique labels", () => {
      const labels = EVACUATION_RESULTS.map((r) => r.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of EVACUATION_RESULTS) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });
  });

  describe("COMPLIANCE_STATUSES", () => {
    it("has exactly 4 items", () => {
      expect(COMPLIANCE_STATUSES).toHaveLength(4);
    });

    it("contains compliant", () => {
      expect(COMPLIANCE_STATUSES).toContainEqual({ status: "compliant", label: "Compliant" });
    });

    it("contains minor_issues", () => {
      expect(COMPLIANCE_STATUSES).toContainEqual({ status: "minor_issues", label: "Minor Issues" });
    });

    it("contains significant_issues", () => {
      expect(COMPLIANCE_STATUSES).toContainEqual({ status: "significant_issues", label: "Significant Issues" });
    });

    it("contains non_compliant", () => {
      expect(COMPLIANCE_STATUSES).toContainEqual({ status: "non_compliant", label: "Non-Compliant" });
    });

    it("has unique status values", () => {
      const statuses = COMPLIANCE_STATUSES.map((s) => s.status);
      expect(new Set(statuses).size).toBe(statuses.length);
    });

    it("has unique labels", () => {
      const labels = COMPLIANCE_STATUSES.map((s) => s.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of COMPLIANCE_STATUSES) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });
  });

  describe("EQUIPMENT_STATUSES", () => {
    it("has exactly 4 items", () => {
      expect(EQUIPMENT_STATUSES).toHaveLength(4);
    });

    it("contains operational", () => {
      expect(EQUIPMENT_STATUSES).toContainEqual({ status: "operational", label: "Operational" });
    });

    it("contains needs_maintenance", () => {
      expect(EQUIPMENT_STATUSES).toContainEqual({ status: "needs_maintenance", label: "Needs Maintenance" });
    });

    it("contains out_of_service", () => {
      expect(EQUIPMENT_STATUSES).toContainEqual({ status: "out_of_service", label: "Out of Service" });
    });

    it("contains not_checked", () => {
      expect(EQUIPMENT_STATUSES).toContainEqual({ status: "not_checked", label: "Not Checked" });
    });

    it("has unique status values", () => {
      const statuses = EQUIPMENT_STATUSES.map((s) => s.status);
      expect(new Set(statuses).size).toBe(statuses.length);
    });

    it("has unique labels", () => {
      const labels = EQUIPMENT_STATUSES.map((s) => s.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of EQUIPMENT_STATUSES) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });
  });
});

// ── computeFireSafetyMetrics ──────────────────────────────────────────────

describe("computeFireSafetyMetrics", () => {
  describe("empty array", () => {
    it("returns zero total_events", () => {
      const m = computeFireSafetyMetrics([]);
      expect(m.total_events).toBe(0);
    });

    it("returns zero drills_count", () => {
      const m = computeFireSafetyMetrics([]);
      expect(m.drills_count).toBe(0);
    });

    it("returns zero night_drills_count", () => {
      const m = computeFireSafetyMetrics([]);
      expect(m.night_drills_count).toBe(0);
    });

    it("returns zero actual_fires_count", () => {
      const m = computeFireSafetyMetrics([]);
      expect(m.actual_fires_count).toBe(0);
    });

    it("returns zero false_alarms_count", () => {
      const m = computeFireSafetyMetrics([]);
      expect(m.false_alarms_count).toBe(0);
    });

    it("returns zero equipment_checks_count", () => {
      const m = computeFireSafetyMetrics([]);
      expect(m.equipment_checks_count).toBe(0);
    });

    it("returns zero risk_assessments_count", () => {
      const m = computeFireSafetyMetrics([]);
      expect(m.risk_assessments_count).toBe(0);
    });

    it("returns zero successful_evacuation_rate", () => {
      const m = computeFireSafetyMetrics([]);
      expect(m.successful_evacuation_rate).toBe(0);
    });

    it("returns zero average_evacuation_time", () => {
      const m = computeFireSafetyMetrics([]);
      expect(m.average_evacuation_time).toBe(0);
    });

    it("returns zero all_accounted_rate", () => {
      const m = computeFireSafetyMetrics([]);
      expect(m.all_accounted_rate).toBe(0);
    });

    it("returns zero compliant_rate", () => {
      const m = computeFireSafetyMetrics([]);
      expect(m.compliant_rate).toBe(0);
    });

    it("returns zero non_compliant_count", () => {
      const m = computeFireSafetyMetrics([]);
      expect(m.non_compliant_count).toBe(0);
    });

    it("returns zero equipment_operational_rate", () => {
      const m = computeFireSafetyMetrics([]);
      expect(m.equipment_operational_rate).toBe(0);
    });

    it("returns zero peep_plans_followed_rate", () => {
      const m = computeFireSafetyMetrics([]);
      expect(m.peep_plans_followed_rate).toBe(0);
    });

    it("returns zero night_staff_competent_rate", () => {
      const m = computeFireSafetyMetrics([]);
      expect(m.night_staff_competent_rate).toBe(0);
    });

    it("returns drill_overdue = true", () => {
      const m = computeFireSafetyMetrics([]);
      expect(m.drill_overdue).toBe(true);
    });

    it("returns empty by_event_type", () => {
      const m = computeFireSafetyMetrics([]);
      expect(m.by_event_type).toEqual({});
    });

    it("returns empty by_evacuation_result", () => {
      const m = computeFireSafetyMetrics([]);
      expect(m.by_evacuation_result).toEqual({});
    });

    it("returns empty by_compliance_status", () => {
      const m = computeFireSafetyMetrics([]);
      expect(m.by_compliance_status).toEqual({});
    });

    it("returns empty by_equipment_status", () => {
      const m = computeFireSafetyMetrics([]);
      expect(m.by_equipment_status).toEqual({});
    });
  });

  describe("single record", () => {
    const record = makeRecord({
      event_type: "planned_drill",
      event_date: daysAgo(5),
      evacuation_result: "successful",
      evacuation_time_seconds: 90,
      all_persons_accounted: true,
      compliance_status: "compliant",
      equipment_status: "operational",
      peep_plans_followed: true,
      night_staff_competent: true,
    });

    it("returns total_events = 1", () => {
      const m = computeFireSafetyMetrics([record]);
      expect(m.total_events).toBe(1);
    });

    it("returns drills_count = 1", () => {
      const m = computeFireSafetyMetrics([record]);
      expect(m.drills_count).toBe(1);
    });

    it("returns night_drills_count = 0", () => {
      const m = computeFireSafetyMetrics([record]);
      expect(m.night_drills_count).toBe(0);
    });

    it("returns actual_fires_count = 0", () => {
      const m = computeFireSafetyMetrics([record]);
      expect(m.actual_fires_count).toBe(0);
    });

    it("returns false_alarms_count = 0", () => {
      const m = computeFireSafetyMetrics([record]);
      expect(m.false_alarms_count).toBe(0);
    });

    it("returns equipment_checks_count = 0", () => {
      const m = computeFireSafetyMetrics([record]);
      expect(m.equipment_checks_count).toBe(0);
    });

    it("returns risk_assessments_count = 0", () => {
      const m = computeFireSafetyMetrics([record]);
      expect(m.risk_assessments_count).toBe(0);
    });

    it("returns successful_evacuation_rate = 100", () => {
      const m = computeFireSafetyMetrics([record]);
      expect(m.successful_evacuation_rate).toBe(100);
    });

    it("returns average_evacuation_time = 90", () => {
      const m = computeFireSafetyMetrics([record]);
      expect(m.average_evacuation_time).toBe(90);
    });

    it("returns all_accounted_rate = 100", () => {
      const m = computeFireSafetyMetrics([record]);
      expect(m.all_accounted_rate).toBe(100);
    });

    it("returns compliant_rate = 100", () => {
      const m = computeFireSafetyMetrics([record]);
      expect(m.compliant_rate).toBe(100);
    });

    it("returns non_compliant_count = 0", () => {
      const m = computeFireSafetyMetrics([record]);
      expect(m.non_compliant_count).toBe(0);
    });

    it("returns equipment_operational_rate = 100", () => {
      const m = computeFireSafetyMetrics([record]);
      expect(m.equipment_operational_rate).toBe(100);
    });

    it("returns peep_plans_followed_rate = 100", () => {
      const m = computeFireSafetyMetrics([record]);
      expect(m.peep_plans_followed_rate).toBe(100);
    });

    it("returns night_staff_competent_rate = 100", () => {
      const m = computeFireSafetyMetrics([record]);
      expect(m.night_staff_competent_rate).toBe(100);
    });

    it("returns drill_overdue = false for recent drill", () => {
      const m = computeFireSafetyMetrics([record]);
      expect(m.drill_overdue).toBe(false);
    });

    it("returns by_event_type with single entry", () => {
      const m = computeFireSafetyMetrics([record]);
      expect(m.by_event_type).toEqual({ planned_drill: 1 });
    });

    it("returns by_evacuation_result with single entry", () => {
      const m = computeFireSafetyMetrics([record]);
      expect(m.by_evacuation_result).toEqual({ successful: 1 });
    });

    it("returns by_compliance_status with single entry", () => {
      const m = computeFireSafetyMetrics([record]);
      expect(m.by_compliance_status).toEqual({ compliant: 1 });
    });

    it("returns by_equipment_status with single entry", () => {
      const m = computeFireSafetyMetrics([record]);
      expect(m.by_equipment_status).toEqual({ operational: 1 });
    });
  });

  describe("multiple records", () => {
    const records = [
      makeRecord({ event_type: "planned_drill", event_date: daysAgo(5), evacuation_result: "successful", evacuation_time_seconds: 90, all_persons_accounted: true, compliance_status: "compliant", equipment_status: "operational", peep_plans_followed: true, night_staff_competent: true }),
      makeRecord({ event_type: "unannounced_drill", event_date: daysAgo(10), evacuation_result: "partial", evacuation_time_seconds: 150, all_persons_accounted: false, compliance_status: "minor_issues", equipment_status: "needs_maintenance", peep_plans_followed: false, night_staff_competent: false }),
      makeRecord({ event_type: "night_drill", event_date: daysAgo(15), evacuation_result: "failed", evacuation_time_seconds: 200, all_persons_accounted: true, compliance_status: "non_compliant", equipment_status: "out_of_service", peep_plans_followed: true, night_staff_competent: null }),
      makeRecord({ event_type: "actual_fire", event_date: daysAgo(20), evacuation_result: "successful", evacuation_time_seconds: null, all_persons_accounted: false, compliance_status: "compliant", equipment_status: "not_checked", peep_plans_followed: false, night_staff_competent: null }),
      makeRecord({ event_type: "false_alarm", event_date: daysAgo(25), evacuation_result: "not_applicable", evacuation_time_seconds: null, all_persons_accounted: true, compliance_status: "significant_issues", equipment_status: "operational", peep_plans_followed: true, night_staff_competent: true }),
    ];

    it("returns total_events = 5", () => {
      const m = computeFireSafetyMetrics(records);
      expect(m.total_events).toBe(5);
    });

    it("returns drills_count = 3 (planned + unannounced + night)", () => {
      const m = computeFireSafetyMetrics(records);
      expect(m.drills_count).toBe(3);
    });

    it("returns night_drills_count = 1", () => {
      const m = computeFireSafetyMetrics(records);
      expect(m.night_drills_count).toBe(1);
    });

    it("returns actual_fires_count = 1", () => {
      const m = computeFireSafetyMetrics(records);
      expect(m.actual_fires_count).toBe(1);
    });

    it("returns false_alarms_count = 1", () => {
      const m = computeFireSafetyMetrics(records);
      expect(m.false_alarms_count).toBe(1);
    });

    it("returns equipment_checks_count = 0", () => {
      const m = computeFireSafetyMetrics(records);
      expect(m.equipment_checks_count).toBe(0);
    });

    it("returns risk_assessments_count = 0", () => {
      const m = computeFireSafetyMetrics(records);
      expect(m.risk_assessments_count).toBe(0);
    });

    it("calculates successful_evacuation_rate correctly (2/4 = 50%)", () => {
      // evacuation applicable: successful, partial, failed, successful = 4
      // successful = 2
      const m = computeFireSafetyMetrics(records);
      expect(m.successful_evacuation_rate).toBe(50);
    });

    it("calculates average_evacuation_time (90+150+200)/3 = 146.7", () => {
      const m = computeFireSafetyMetrics(records);
      expect(m.average_evacuation_time).toBe(146.7);
    });

    it("calculates all_accounted_rate (3/5 = 60%)", () => {
      const m = computeFireSafetyMetrics(records);
      expect(m.all_accounted_rate).toBe(60);
    });

    it("calculates compliant_rate (2/5 = 40%)", () => {
      const m = computeFireSafetyMetrics(records);
      expect(m.compliant_rate).toBe(40);
    });

    it("returns non_compliant_count = 1", () => {
      const m = computeFireSafetyMetrics(records);
      expect(m.non_compliant_count).toBe(1);
    });

    it("calculates equipment_operational_rate (2/4 = 50%)", () => {
      // not_checked excluded => 4 records; operational = 2
      const m = computeFireSafetyMetrics(records);
      expect(m.equipment_operational_rate).toBe(50);
    });

    it("calculates peep_plans_followed_rate (3/4 = 75%)", () => {
      // evacuation applicable (not not_applicable) = 4; peep followed = 3 (first, third, fourth... wait)
      // rec0: followed=true, rec1: followed=false, rec2: followed=true, rec3: followed=false
      // records with evac != not_applicable: rec0,1,2,3 = 4; followed: rec0,rec2 = true,false,true,false => 2
      // Actually: rec0=true, rec1=false, rec2=true, rec3=false -> 2/4 = 50%
      const m = computeFireSafetyMetrics(records);
      expect(m.peep_plans_followed_rate).toBe(50);
    });

    it("calculates night_staff_competent_rate (2/3 = 66.7%)", () => {
      // night_staff_competent not null: rec0=true, rec1=false, rec4=true => 3 records, 2 competent
      const m = computeFireSafetyMetrics(records);
      expect(m.night_staff_competent_rate).toBe(66.7);
    });

    it("returns drill_overdue = false when recent drills exist", () => {
      const m = computeFireSafetyMetrics(records);
      expect(m.drill_overdue).toBe(false);
    });

    it("groups by_event_type correctly", () => {
      const m = computeFireSafetyMetrics(records);
      expect(m.by_event_type).toEqual({ planned_drill: 1, unannounced_drill: 1, night_drill: 1, actual_fire: 1, false_alarm: 1 });
    });

    it("groups by_evacuation_result correctly", () => {
      const m = computeFireSafetyMetrics(records);
      expect(m.by_evacuation_result).toEqual({ successful: 2, partial: 1, failed: 1, not_applicable: 1 });
    });

    it("groups by_compliance_status correctly", () => {
      const m = computeFireSafetyMetrics(records);
      expect(m.by_compliance_status).toEqual({ compliant: 2, minor_issues: 1, non_compliant: 1, significant_issues: 1 });
    });

    it("groups by_equipment_status correctly", () => {
      const m = computeFireSafetyMetrics(records);
      expect(m.by_equipment_status).toEqual({ operational: 2, needs_maintenance: 1, out_of_service: 1, not_checked: 1 });
    });
  });

  describe("drills_count includes all drill types", () => {
    it("counts planned_drill as drill", () => {
      const records = [makeRecord({ event_type: "planned_drill", event_date: daysAgo(1) })];
      const m = computeFireSafetyMetrics(records);
      expect(m.drills_count).toBe(1);
    });

    it("counts unannounced_drill as drill", () => {
      const records = [makeRecord({ event_type: "unannounced_drill", event_date: daysAgo(1) })];
      const m = computeFireSafetyMetrics(records);
      expect(m.drills_count).toBe(1);
    });

    it("counts night_drill as drill", () => {
      const records = [makeRecord({ event_type: "night_drill", event_date: daysAgo(1) })];
      const m = computeFireSafetyMetrics(records);
      expect(m.drills_count).toBe(1);
    });

    it("does not count actual_fire as drill", () => {
      const records = [makeRecord({ event_type: "actual_fire", event_date: daysAgo(1) })];
      const m = computeFireSafetyMetrics(records);
      expect(m.drills_count).toBe(0);
    });

    it("does not count false_alarm as drill", () => {
      const records = [makeRecord({ event_type: "false_alarm", event_date: daysAgo(1) })];
      const m = computeFireSafetyMetrics(records);
      expect(m.drills_count).toBe(0);
    });

    it("does not count equipment_check as drill", () => {
      const records = [makeRecord({ event_type: "equipment_check", event_date: daysAgo(1) })];
      const m = computeFireSafetyMetrics(records);
      expect(m.drills_count).toBe(0);
    });

    it("does not count risk_assessment as drill", () => {
      const records = [makeRecord({ event_type: "risk_assessment", event_date: daysAgo(1) })];
      const m = computeFireSafetyMetrics(records);
      expect(m.drills_count).toBe(0);
    });

    it("does not count staff_training as drill", () => {
      const records = [makeRecord({ event_type: "staff_training", event_date: daysAgo(1) })];
      const m = computeFireSafetyMetrics(records);
      expect(m.drills_count).toBe(0);
    });

    it("does not count other as drill", () => {
      const records = [makeRecord({ event_type: "other", event_date: daysAgo(1) })];
      const m = computeFireSafetyMetrics(records);
      expect(m.drills_count).toBe(0);
    });
  });

  describe("event type counts", () => {
    it("counts night_drill events", () => {
      const records = [
        makeRecord({ event_type: "night_drill", event_date: daysAgo(1) }),
        makeRecord({ event_type: "night_drill", event_date: daysAgo(2) }),
      ];
      const m = computeFireSafetyMetrics(records);
      expect(m.night_drills_count).toBe(2);
    });

    it("counts actual_fire events", () => {
      const records = [
        makeRecord({ event_type: "actual_fire" }),
        makeRecord({ event_type: "actual_fire" }),
        makeRecord({ event_type: "actual_fire" }),
      ];
      const m = computeFireSafetyMetrics(records);
      expect(m.actual_fires_count).toBe(3);
    });

    it("counts false_alarm events", () => {
      const records = [
        makeRecord({ event_type: "false_alarm" }),
        makeRecord({ event_type: "false_alarm" }),
      ];
      const m = computeFireSafetyMetrics(records);
      expect(m.false_alarms_count).toBe(2);
    });

    it("counts equipment_check events", () => {
      const records = [
        makeRecord({ event_type: "equipment_check" }),
        makeRecord({ event_type: "equipment_check" }),
      ];
      const m = computeFireSafetyMetrics(records);
      expect(m.equipment_checks_count).toBe(2);
    });

    it("counts risk_assessment events", () => {
      const records = [makeRecord({ event_type: "risk_assessment" })];
      const m = computeFireSafetyMetrics(records);
      expect(m.risk_assessments_count).toBe(1);
    });
  });

  describe("successful_evacuation_rate", () => {
    it("excludes not_applicable from denominator", () => {
      const records = [
        makeRecord({ evacuation_result: "successful" }),
        makeRecord({ evacuation_result: "not_applicable" }),
        makeRecord({ evacuation_result: "not_applicable" }),
      ];
      // applicable = 1, successful = 1, rate = 100
      const m = computeFireSafetyMetrics(records);
      expect(m.successful_evacuation_rate).toBe(100);
    });

    it("returns 0 when all results are not_applicable", () => {
      const records = [
        makeRecord({ evacuation_result: "not_applicable" }),
        makeRecord({ evacuation_result: "not_applicable" }),
      ];
      const m = computeFireSafetyMetrics(records);
      expect(m.successful_evacuation_rate).toBe(0);
    });

    it("counts only successful as numerator (not partial)", () => {
      const records = [
        makeRecord({ evacuation_result: "partial" }),
        makeRecord({ evacuation_result: "partial" }),
      ];
      const m = computeFireSafetyMetrics(records);
      expect(m.successful_evacuation_rate).toBe(0);
    });

    it("calculates rate with rounding (1/3 = 33.3%)", () => {
      const records = [
        makeRecord({ evacuation_result: "successful" }),
        makeRecord({ evacuation_result: "failed" }),
        makeRecord({ evacuation_result: "partial" }),
      ];
      const m = computeFireSafetyMetrics(records);
      expect(m.successful_evacuation_rate).toBe(33.3);
    });

    it("calculates rate (2/3 = 66.7%)", () => {
      const records = [
        makeRecord({ evacuation_result: "successful" }),
        makeRecord({ evacuation_result: "successful" }),
        makeRecord({ evacuation_result: "failed" }),
      ];
      const m = computeFireSafetyMetrics(records);
      expect(m.successful_evacuation_rate).toBe(66.7);
    });
  });

  describe("average_evacuation_time", () => {
    it("only includes records with non-null evacuation_time_seconds", () => {
      const records = [
        makeRecord({ evacuation_time_seconds: 100 }),
        makeRecord({ evacuation_time_seconds: null }),
        makeRecord({ evacuation_time_seconds: 200 }),
      ];
      // (100+200)/2 = 150
      const m = computeFireSafetyMetrics(records);
      expect(m.average_evacuation_time).toBe(150);
    });

    it("returns 0 when all times are null", () => {
      const records = [
        makeRecord({ evacuation_time_seconds: null }),
        makeRecord({ evacuation_time_seconds: null }),
      ];
      const m = computeFireSafetyMetrics(records);
      expect(m.average_evacuation_time).toBe(0);
    });

    it("returns exact value for single timed record", () => {
      const records = [makeRecord({ evacuation_time_seconds: 75 })];
      const m = computeFireSafetyMetrics(records);
      expect(m.average_evacuation_time).toBe(75);
    });

    it("rounds to 1 decimal place (100+110+130)/3 = 113.3", () => {
      const records = [
        makeRecord({ evacuation_time_seconds: 100 }),
        makeRecord({ evacuation_time_seconds: 110 }),
        makeRecord({ evacuation_time_seconds: 130 }),
      ];
      const m = computeFireSafetyMetrics(records);
      expect(m.average_evacuation_time).toBe(113.3);
    });

    it("handles single-second evacuation time", () => {
      const records = [makeRecord({ evacuation_time_seconds: 1 })];
      const m = computeFireSafetyMetrics(records);
      expect(m.average_evacuation_time).toBe(1);
    });
  });

  describe("all_accounted_rate", () => {
    it("uses all records as denominator (not just evacuation applicable)", () => {
      const records = [
        makeRecord({ all_persons_accounted: true, evacuation_result: "not_applicable" }),
        makeRecord({ all_persons_accounted: false, evacuation_result: "successful" }),
      ];
      // 1/2 = 50%
      const m = computeFireSafetyMetrics(records);
      expect(m.all_accounted_rate).toBe(50);
    });

    it("returns 100 when all accounted", () => {
      const records = [
        makeRecord({ all_persons_accounted: true }),
        makeRecord({ all_persons_accounted: true }),
      ];
      const m = computeFireSafetyMetrics(records);
      expect(m.all_accounted_rate).toBe(100);
    });

    it("returns 0 when none accounted", () => {
      const records = [
        makeRecord({ all_persons_accounted: false }),
        makeRecord({ all_persons_accounted: false }),
      ];
      const m = computeFireSafetyMetrics(records);
      expect(m.all_accounted_rate).toBe(0);
    });

    it("calculates with rounding (1/3 = 33.3%)", () => {
      const records = [
        makeRecord({ all_persons_accounted: true }),
        makeRecord({ all_persons_accounted: false }),
        makeRecord({ all_persons_accounted: false }),
      ];
      const m = computeFireSafetyMetrics(records);
      expect(m.all_accounted_rate).toBe(33.3);
    });
  });

  describe("compliant_rate and non_compliant_count", () => {
    it("uses all records as denominator", () => {
      const records = [
        makeRecord({ compliance_status: "compliant" }),
        makeRecord({ compliance_status: "minor_issues" }),
        makeRecord({ compliance_status: "non_compliant" }),
      ];
      // compliant = 1/3 = 33.3%
      const m = computeFireSafetyMetrics(records);
      expect(m.compliant_rate).toBe(33.3);
    });

    it("returns 100 when all compliant", () => {
      const records = [
        makeRecord({ compliance_status: "compliant" }),
        makeRecord({ compliance_status: "compliant" }),
      ];
      const m = computeFireSafetyMetrics(records);
      expect(m.compliant_rate).toBe(100);
    });

    it("returns 0 when none compliant", () => {
      const records = [
        makeRecord({ compliance_status: "non_compliant" }),
        makeRecord({ compliance_status: "minor_issues" }),
      ];
      const m = computeFireSafetyMetrics(records);
      expect(m.compliant_rate).toBe(0);
    });

    it("counts non_compliant records accurately", () => {
      const records = [
        makeRecord({ compliance_status: "non_compliant" }),
        makeRecord({ compliance_status: "non_compliant" }),
        makeRecord({ compliance_status: "compliant" }),
      ];
      const m = computeFireSafetyMetrics(records);
      expect(m.non_compliant_count).toBe(2);
    });

    it("does not count minor_issues as non_compliant", () => {
      const records = [makeRecord({ compliance_status: "minor_issues" })];
      const m = computeFireSafetyMetrics(records);
      expect(m.non_compliant_count).toBe(0);
    });

    it("does not count significant_issues as non_compliant", () => {
      const records = [makeRecord({ compliance_status: "significant_issues" })];
      const m = computeFireSafetyMetrics(records);
      expect(m.non_compliant_count).toBe(0);
    });
  });

  describe("equipment_operational_rate", () => {
    it("excludes not_checked from denominator", () => {
      const records = [
        makeRecord({ equipment_status: "operational" }),
        makeRecord({ equipment_status: "not_checked" }),
        makeRecord({ equipment_status: "not_checked" }),
      ];
      // checked = 1, operational = 1, rate = 100
      const m = computeFireSafetyMetrics(records);
      expect(m.equipment_operational_rate).toBe(100);
    });

    it("returns 0 when all not_checked", () => {
      const records = [
        makeRecord({ equipment_status: "not_checked" }),
        makeRecord({ equipment_status: "not_checked" }),
      ];
      const m = computeFireSafetyMetrics(records);
      expect(m.equipment_operational_rate).toBe(0);
    });

    it("calculates rate with mixed statuses", () => {
      const records = [
        makeRecord({ equipment_status: "operational" }),
        makeRecord({ equipment_status: "needs_maintenance" }),
        makeRecord({ equipment_status: "out_of_service" }),
      ];
      // 1/3 = 33.3%
      const m = computeFireSafetyMetrics(records);
      expect(m.equipment_operational_rate).toBe(33.3);
    });

    it("does not count needs_maintenance as operational", () => {
      const records = [makeRecord({ equipment_status: "needs_maintenance" })];
      const m = computeFireSafetyMetrics(records);
      expect(m.equipment_operational_rate).toBe(0);
    });

    it("does not count out_of_service as operational", () => {
      const records = [makeRecord({ equipment_status: "out_of_service" })];
      const m = computeFireSafetyMetrics(records);
      expect(m.equipment_operational_rate).toBe(0);
    });
  });

  describe("peep_plans_followed_rate", () => {
    it("excludes not_applicable evacuation from denominator", () => {
      const records = [
        makeRecord({ peep_plans_followed: true, evacuation_result: "successful" }),
        makeRecord({ peep_plans_followed: false, evacuation_result: "not_applicable" }),
      ];
      // applicable = 1, followed = 1, rate = 100
      const m = computeFireSafetyMetrics(records);
      expect(m.peep_plans_followed_rate).toBe(100);
    });

    it("returns 0 when all evacuation results are not_applicable", () => {
      const records = [
        makeRecord({ peep_plans_followed: true, evacuation_result: "not_applicable" }),
      ];
      const m = computeFireSafetyMetrics(records);
      expect(m.peep_plans_followed_rate).toBe(0);
    });

    it("calculates mixed rate (1/3 = 33.3%)", () => {
      const records = [
        makeRecord({ peep_plans_followed: true, evacuation_result: "successful" }),
        makeRecord({ peep_plans_followed: false, evacuation_result: "partial" }),
        makeRecord({ peep_plans_followed: false, evacuation_result: "failed" }),
      ];
      const m = computeFireSafetyMetrics(records);
      expect(m.peep_plans_followed_rate).toBe(33.3);
    });

    it("returns 100 when all applicable records have peep followed", () => {
      const records = [
        makeRecord({ peep_plans_followed: true, evacuation_result: "successful" }),
        makeRecord({ peep_plans_followed: true, evacuation_result: "partial" }),
      ];
      const m = computeFireSafetyMetrics(records);
      expect(m.peep_plans_followed_rate).toBe(100);
    });
  });

  describe("night_staff_competent_rate", () => {
    it("excludes null night_staff_competent from denominator", () => {
      const records = [
        makeRecord({ night_staff_competent: true }),
        makeRecord({ night_staff_competent: null }),
        makeRecord({ night_staff_competent: null }),
      ];
      // assessed = 1, competent = 1, rate = 100
      const m = computeFireSafetyMetrics(records);
      expect(m.night_staff_competent_rate).toBe(100);
    });

    it("returns 0 when all null", () => {
      const records = [
        makeRecord({ night_staff_competent: null }),
        makeRecord({ night_staff_competent: null }),
      ];
      const m = computeFireSafetyMetrics(records);
      expect(m.night_staff_competent_rate).toBe(0);
    });

    it("calculates mixed rate (1/3 = 33.3%)", () => {
      const records = [
        makeRecord({ night_staff_competent: true }),
        makeRecord({ night_staff_competent: false }),
        makeRecord({ night_staff_competent: false }),
      ];
      const m = computeFireSafetyMetrics(records);
      expect(m.night_staff_competent_rate).toBe(33.3);
    });

    it("returns 0 when all assessed are not competent", () => {
      const records = [
        makeRecord({ night_staff_competent: false }),
        makeRecord({ night_staff_competent: false }),
      ];
      const m = computeFireSafetyMetrics(records);
      expect(m.night_staff_competent_rate).toBe(0);
    });

    it("calculates (2/3 = 66.7%)", () => {
      const records = [
        makeRecord({ night_staff_competent: true }),
        makeRecord({ night_staff_competent: true }),
        makeRecord({ night_staff_competent: false }),
      ];
      const m = computeFireSafetyMetrics(records);
      expect(m.night_staff_competent_rate).toBe(66.7);
    });
  });

  describe("drill_overdue", () => {
    it("returns true when no records at all", () => {
      const m = computeFireSafetyMetrics([]);
      expect(m.drill_overdue).toBe(true);
    });

    it("returns true when only non-drill records exist", () => {
      const records = [
        makeRecord({ event_type: "equipment_check", event_date: daysAgo(1) }),
        makeRecord({ event_type: "risk_assessment", event_date: daysAgo(1) }),
      ];
      const m = computeFireSafetyMetrics(records);
      expect(m.drill_overdue).toBe(true);
    });

    it("returns true when last drill is more than 30 days ago", () => {
      const records = [makeRecord({ event_type: "planned_drill", event_date: daysAgo(31) })];
      const m = computeFireSafetyMetrics(records);
      expect(m.drill_overdue).toBe(true);
    });

    it("returns false when last drill is within 30 days", () => {
      const records = [makeRecord({ event_type: "planned_drill", event_date: daysAgo(15) })];
      const m = computeFireSafetyMetrics(records);
      expect(m.drill_overdue).toBe(false);
    });

    it("returns false when last drill is today", () => {
      const records = [makeRecord({ event_type: "planned_drill", event_date: daysAgo(0) })];
      const m = computeFireSafetyMetrics(records);
      expect(m.drill_overdue).toBe(false);
    });

    it("returns false when unannounced_drill is recent", () => {
      const records = [makeRecord({ event_type: "unannounced_drill", event_date: daysAgo(10) })];
      const m = computeFireSafetyMetrics(records);
      expect(m.drill_overdue).toBe(false);
    });

    it("returns false when night_drill is recent", () => {
      const records = [makeRecord({ event_type: "night_drill", event_date: daysAgo(5) })];
      const m = computeFireSafetyMetrics(records);
      expect(m.drill_overdue).toBe(false);
    });

    it("uses the most recent drill date when multiple drills exist", () => {
      const records = [
        makeRecord({ event_type: "planned_drill", event_date: daysAgo(60) }),
        makeRecord({ event_type: "planned_drill", event_date: daysAgo(10) }),
        makeRecord({ event_type: "planned_drill", event_date: daysAgo(45) }),
      ];
      const m = computeFireSafetyMetrics(records);
      expect(m.drill_overdue).toBe(false);
    });

    it("returns true when all drills are old", () => {
      const records = [
        makeRecord({ event_type: "planned_drill", event_date: daysAgo(60) }),
        makeRecord({ event_type: "unannounced_drill", event_date: daysAgo(45) }),
      ];
      const m = computeFireSafetyMetrics(records);
      expect(m.drill_overdue).toBe(true);
    });

    it("ignores non-drill event dates for overdue calculation", () => {
      const records = [
        makeRecord({ event_type: "equipment_check", event_date: daysAgo(1) }),
        makeRecord({ event_type: "planned_drill", event_date: daysAgo(35) }),
      ];
      const m = computeFireSafetyMetrics(records);
      expect(m.drill_overdue).toBe(true);
    });
  });

  describe("by_event_type breakdown", () => {
    it("counts each event type separately", () => {
      const records = [
        makeRecord({ event_type: "planned_drill" }),
        makeRecord({ event_type: "planned_drill" }),
        makeRecord({ event_type: "actual_fire" }),
        makeRecord({ event_type: "equipment_check" }),
      ];
      const m = computeFireSafetyMetrics(records);
      expect(m.by_event_type).toEqual({ planned_drill: 2, actual_fire: 1, equipment_check: 1 });
    });

    it("handles all nine event types", () => {
      const types: FireEventType[] = ["planned_drill", "unannounced_drill", "night_drill", "actual_fire", "false_alarm", "equipment_check", "risk_assessment", "staff_training", "other"];
      const records = types.map((t) => makeRecord({ event_type: t }));
      const m = computeFireSafetyMetrics(records);
      for (const t of types) {
        expect(m.by_event_type[t]).toBe(1);
      }
    });
  });

  describe("by_evacuation_result breakdown", () => {
    it("counts each evacuation result separately", () => {
      const records = [
        makeRecord({ evacuation_result: "successful" }),
        makeRecord({ evacuation_result: "successful" }),
        makeRecord({ evacuation_result: "failed" }),
      ];
      const m = computeFireSafetyMetrics(records);
      expect(m.by_evacuation_result).toEqual({ successful: 2, failed: 1 });
    });

    it("handles all four evacuation results", () => {
      const results: EvacuationResult[] = ["successful", "partial", "failed", "not_applicable"];
      const records = results.map((r) => makeRecord({ evacuation_result: r }));
      const m = computeFireSafetyMetrics(records);
      for (const r of results) {
        expect(m.by_evacuation_result[r]).toBe(1);
      }
    });
  });

  describe("by_compliance_status breakdown", () => {
    it("counts each compliance status separately", () => {
      const records = [
        makeRecord({ compliance_status: "compliant" }),
        makeRecord({ compliance_status: "compliant" }),
        makeRecord({ compliance_status: "non_compliant" }),
      ];
      const m = computeFireSafetyMetrics(records);
      expect(m.by_compliance_status).toEqual({ compliant: 2, non_compliant: 1 });
    });

    it("handles all four compliance statuses", () => {
      const statuses: ComplianceStatus[] = ["compliant", "minor_issues", "significant_issues", "non_compliant"];
      const records = statuses.map((s) => makeRecord({ compliance_status: s }));
      const m = computeFireSafetyMetrics(records);
      for (const s of statuses) {
        expect(m.by_compliance_status[s]).toBe(1);
      }
    });
  });

  describe("by_equipment_status breakdown", () => {
    it("counts each equipment status separately", () => {
      const records = [
        makeRecord({ equipment_status: "operational" }),
        makeRecord({ equipment_status: "operational" }),
        makeRecord({ equipment_status: "out_of_service" }),
      ];
      const m = computeFireSafetyMetrics(records);
      expect(m.by_equipment_status).toEqual({ operational: 2, out_of_service: 1 });
    });

    it("handles all four equipment statuses", () => {
      const statuses: EquipmentStatus[] = ["operational", "needs_maintenance", "out_of_service", "not_checked"];
      const records = statuses.map((s) => makeRecord({ equipment_status: s }));
      const m = computeFireSafetyMetrics(records);
      for (const s of statuses) {
        expect(m.by_equipment_status[s]).toBe(1);
      }
    });
  });

  describe("large data set", () => {
    it("handles 100 records correctly", () => {
      const records: FireSafetyRecord[] = [];
      for (let i = 0; i < 100; i++) {
        records.push(
          makeRecord({
            event_type: i % 3 === 0 ? "planned_drill" : i % 3 === 1 ? "unannounced_drill" : "equipment_check",
            event_date: daysAgo(i % 25),
            evacuation_result: i % 4 === 0 ? "successful" : "partial",
            evacuation_time_seconds: 100 + i,
            all_persons_accounted: i % 2 === 0,
            compliance_status: "compliant",
            equipment_status: "operational",
            peep_plans_followed: true,
            night_staff_competent: null,
          }),
        );
      }
      const m = computeFireSafetyMetrics(records);
      expect(m.total_events).toBe(100);
      // planned_drill: i%3===0 => 34, unannounced_drill: i%3===1 => 33, equipment_check: i%3===2 => 33
      expect(m.drills_count).toBe(67);
      expect(m.compliant_rate).toBe(100);
      expect(m.equipment_operational_rate).toBe(100);
      expect(m.night_staff_competent_rate).toBe(0);
    });
  });
});

// ── identifyFireSafetyAlerts ──────────────────────────────────────────────

describe("identifyFireSafetyAlerts", () => {
  describe("no alerts", () => {
    it("returns empty array when no records", () => {
      const alerts = identifyFireSafetyAlerts([]);
      // drill_overdue fires for no records
      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe("drill_overdue");
    });

    it("returns empty array when all records are clean with recent drill", () => {
      const records = [
        makeRecord({
          event_type: "planned_drill",
          event_date: daysAgo(5),
          evacuation_result: "successful",
          all_persons_accounted: true,
          compliance_status: "compliant",
          equipment_status: "operational",
        }),
      ];
      const alerts = identifyFireSafetyAlerts(records);
      expect(alerts).toEqual([]);
    });

    it("returns empty for single well-formed record with recent drill date", () => {
      const records = [
        makeRecord({
          event_type: "unannounced_drill",
          event_date: daysAgo(10),
          evacuation_result: "successful",
          all_persons_accounted: true,
          compliance_status: "compliant",
          equipment_status: "operational",
          peep_plans_followed: true,
        }),
      ];
      const alerts = identifyFireSafetyAlerts(records);
      expect(alerts).toEqual([]);
    });
  });

  describe("failed_evacuation alert", () => {
    it("fires for a failed evacuation record", () => {
      const records = [makeRecord({ evacuation_result: "failed", event_type: "planned_drill", event_date: daysAgo(1) })];
      const alerts = identifyFireSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "failed_evacuation");
      expect(alert).toBeDefined();
    });

    it("has severity critical", () => {
      const records = [makeRecord({ evacuation_result: "failed", event_type: "planned_drill", event_date: daysAgo(1) })];
      const alerts = identifyFireSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "failed_evacuation")!;
      expect(alert.severity).toBe("critical");
    });

    it("uses the record id as alert id", () => {
      const records = [makeRecord({ id: "rec-fail-1", evacuation_result: "failed", event_type: "planned_drill", event_date: daysAgo(1) })];
      const alerts = identifyFireSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "failed_evacuation")!;
      expect(alert.id).toBe("rec-fail-1");
    });

    it("replaces underscores with spaces in event_type in message", () => {
      const records = [makeRecord({ evacuation_result: "failed", event_type: "planned_drill", event_date: daysAgo(1) })];
      const alerts = identifyFireSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "failed_evacuation")!;
      expect(alert.message).toContain("planned drill");
    });

    it("replaces underscores for unannounced_drill", () => {
      const records = [makeRecord({ evacuation_result: "failed", event_type: "unannounced_drill", event_date: daysAgo(1) })];
      const alerts = identifyFireSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "failed_evacuation")!;
      expect(alert.message).toContain("unannounced drill");
    });

    it("replaces underscores for night_drill", () => {
      const records = [makeRecord({ evacuation_result: "failed", event_type: "night_drill", event_date: daysAgo(1) })];
      const alerts = identifyFireSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "failed_evacuation")!;
      expect(alert.message).toContain("night drill");
    });

    it("includes event_date in message", () => {
      const date = daysAgo(3);
      const records = [makeRecord({ evacuation_result: "failed", event_type: "planned_drill", event_date: date })];
      const alerts = identifyFireSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "failed_evacuation")!;
      expect(alert.message).toContain(date);
    });

    it("fires per record for multiple failed evacuations", () => {
      const records = [
        makeRecord({ evacuation_result: "failed", event_type: "planned_drill", event_date: daysAgo(1) }),
        makeRecord({ evacuation_result: "failed", event_type: "night_drill", event_date: daysAgo(2) }),
        makeRecord({ evacuation_result: "failed", event_type: "unannounced_drill", event_date: daysAgo(3) }),
      ];
      const alerts = identifyFireSafetyAlerts(records);
      const failAlerts = alerts.filter((a) => a.type === "failed_evacuation");
      expect(failAlerts).toHaveLength(3);
    });

    it("does not fire for successful evacuation", () => {
      const records = [makeRecord({ evacuation_result: "successful", event_type: "planned_drill", event_date: daysAgo(1) })];
      const alerts = identifyFireSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "failed_evacuation");
      expect(alert).toBeUndefined();
    });

    it("does not fire for partial evacuation", () => {
      const records = [makeRecord({ evacuation_result: "partial", event_type: "planned_drill", event_date: daysAgo(1) })];
      const alerts = identifyFireSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "failed_evacuation");
      expect(alert).toBeUndefined();
    });

    it("does not fire for not_applicable evacuation", () => {
      const records = [makeRecord({ evacuation_result: "not_applicable", event_type: "planned_drill", event_date: daysAgo(1) })];
      const alerts = identifyFireSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "failed_evacuation");
      expect(alert).toBeUndefined();
    });

    it("message contains review and re-drill wording", () => {
      const records = [makeRecord({ evacuation_result: "failed", event_type: "planned_drill", event_date: daysAgo(1) })];
      const alerts = identifyFireSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "failed_evacuation")!;
      expect(alert.message).toContain("conduct immediate review and re-drill");
    });
  });

  describe("persons_not_accounted alert", () => {
    it("fires when not all accounted and evacuation applicable", () => {
      const records = [makeRecord({ all_persons_accounted: false, evacuation_result: "successful", event_type: "planned_drill", event_date: daysAgo(1) })];
      const alerts = identifyFireSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "persons_not_accounted");
      expect(alert).toBeDefined();
    });

    it("has severity critical", () => {
      const records = [makeRecord({ all_persons_accounted: false, evacuation_result: "successful", event_type: "planned_drill", event_date: daysAgo(1) })];
      const alerts = identifyFireSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "persons_not_accounted")!;
      expect(alert.severity).toBe("critical");
    });

    it("uses the record id as alert id", () => {
      const records = [makeRecord({ id: "rec-not-accounted", all_persons_accounted: false, evacuation_result: "partial", event_type: "planned_drill", event_date: daysAgo(1) })];
      const alerts = identifyFireSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "persons_not_accounted")!;
      expect(alert.id).toBe("rec-not-accounted");
    });

    it("replaces underscores in event_type in message", () => {
      const records = [makeRecord({ all_persons_accounted: false, evacuation_result: "successful", event_type: "night_drill", event_date: daysAgo(1) })];
      const alerts = identifyFireSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "persons_not_accounted")!;
      expect(alert.message).toContain("night drill");
    });

    it("includes event_date in message", () => {
      const date = daysAgo(7);
      const records = [makeRecord({ all_persons_accounted: false, evacuation_result: "successful", event_type: "planned_drill", event_date: date })];
      const alerts = identifyFireSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "persons_not_accounted")!;
      expect(alert.message).toContain(date);
    });

    it("does not fire when all accounted", () => {
      const records = [makeRecord({ all_persons_accounted: true, evacuation_result: "successful", event_type: "planned_drill", event_date: daysAgo(1) })];
      const alerts = identifyFireSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "persons_not_accounted");
      expect(alert).toBeUndefined();
    });

    it("does not fire when evacuation is not_applicable", () => {
      const records = [makeRecord({ all_persons_accounted: false, evacuation_result: "not_applicable", event_type: "equipment_check", event_date: daysAgo(1) })];
      const alerts = identifyFireSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "persons_not_accounted");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple unaccounted records", () => {
      const records = [
        makeRecord({ all_persons_accounted: false, evacuation_result: "successful", event_type: "planned_drill", event_date: daysAgo(1) }),
        makeRecord({ all_persons_accounted: false, evacuation_result: "failed", event_type: "night_drill", event_date: daysAgo(2) }),
      ];
      const alerts = identifyFireSafetyAlerts(records);
      const naAlerts = alerts.filter((a) => a.type === "persons_not_accounted");
      expect(naAlerts).toHaveLength(2);
    });

    it("message contains roll-call procedures wording", () => {
      const records = [makeRecord({ all_persons_accounted: false, evacuation_result: "successful", event_type: "planned_drill", event_date: daysAgo(1) })];
      const alerts = identifyFireSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "persons_not_accounted")!;
      expect(alert.message).toContain("review roll-call procedures");
    });
  });

  describe("non_compliant alert", () => {
    it("fires for non_compliant compliance status", () => {
      const records = [makeRecord({ compliance_status: "non_compliant", event_type: "planned_drill", event_date: daysAgo(1) })];
      const alerts = identifyFireSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const records = [makeRecord({ compliance_status: "non_compliant", event_type: "planned_drill", event_date: daysAgo(1) })];
      const alerts = identifyFireSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant")!;
      expect(alert.severity).toBe("high");
    });

    it("uses the record id as alert id", () => {
      const records = [makeRecord({ id: "rec-nc-1", compliance_status: "non_compliant", event_type: "planned_drill", event_date: daysAgo(1) })];
      const alerts = identifyFireSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant")!;
      expect(alert.id).toBe("rec-nc-1");
    });

    it("includes event_date in message", () => {
      const date = daysAgo(2);
      const records = [makeRecord({ compliance_status: "non_compliant", event_type: "planned_drill", event_date: date })];
      const alerts = identifyFireSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant")!;
      expect(alert.message).toContain(date);
    });

    it("replaces underscores in event_type in message", () => {
      const records = [makeRecord({ compliance_status: "non_compliant", event_type: "risk_assessment", event_date: daysAgo(1) })];
      const alerts = identifyFireSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant")!;
      expect(alert.message).toContain("risk assessment");
    });

    it("fires per record for multiple non_compliant records", () => {
      const records = [
        makeRecord({ compliance_status: "non_compliant", event_type: "planned_drill", event_date: daysAgo(1) }),
        makeRecord({ compliance_status: "non_compliant", event_type: "night_drill", event_date: daysAgo(2) }),
      ];
      const alerts = identifyFireSafetyAlerts(records);
      const ncAlerts = alerts.filter((a) => a.type === "non_compliant");
      expect(ncAlerts).toHaveLength(2);
    });

    it("does not fire for compliant status", () => {
      const records = [makeRecord({ compliance_status: "compliant", event_type: "planned_drill", event_date: daysAgo(1) })];
      const alerts = identifyFireSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant");
      expect(alert).toBeUndefined();
    });

    it("does not fire for minor_issues status", () => {
      const records = [makeRecord({ compliance_status: "minor_issues", event_type: "planned_drill", event_date: daysAgo(1) })];
      const alerts = identifyFireSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant");
      expect(alert).toBeUndefined();
    });

    it("does not fire for significant_issues status", () => {
      const records = [makeRecord({ compliance_status: "significant_issues", event_type: "planned_drill", event_date: daysAgo(1) })];
      const alerts = identifyFireSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant");
      expect(alert).toBeUndefined();
    });

    it("message contains address immediately wording", () => {
      const records = [makeRecord({ compliance_status: "non_compliant", event_type: "planned_drill", event_date: daysAgo(1) })];
      const alerts = identifyFireSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant")!;
      expect(alert.message).toContain("address immediately");
    });
  });

  describe("equipment_out_of_service alert", () => {
    it("fires when >= 1 record has out_of_service equipment", () => {
      const records = [makeRecord({ equipment_status: "out_of_service", event_type: "planned_drill", event_date: daysAgo(1) })];
      const alerts = identifyFireSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "equipment_out_of_service");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const records = [makeRecord({ equipment_status: "out_of_service", event_type: "planned_drill", event_date: daysAgo(1) })];
      const alerts = identifyFireSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "equipment_out_of_service")!;
      expect(alert.severity).toBe("high");
    });

    it("has id equipment_out_of_service", () => {
      const records = [makeRecord({ equipment_status: "out_of_service", event_type: "planned_drill", event_date: daysAgo(1) })];
      const alerts = identifyFireSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "equipment_out_of_service")!;
      expect(alert.id).toBe("equipment_out_of_service");
    });

    it("uses singular message for 1 item", () => {
      const records = [makeRecord({ equipment_status: "out_of_service", event_type: "planned_drill", event_date: daysAgo(1) })];
      const alerts = identifyFireSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "equipment_out_of_service")!;
      expect(alert.message).toContain("1 fire safety equipment item is out of service");
    });

    it("uses plural message for multiple items", () => {
      const records = [
        makeRecord({ equipment_status: "out_of_service", event_type: "planned_drill", event_date: daysAgo(1) }),
        makeRecord({ equipment_status: "out_of_service", event_type: "equipment_check", event_date: daysAgo(2) }),
        makeRecord({ equipment_status: "out_of_service", event_type: "night_drill", event_date: daysAgo(3) }),
      ];
      const alerts = identifyFireSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "equipment_out_of_service")!;
      expect(alert.message).toContain("3 fire safety equipment items are out of service");
    });

    it("includes count of 2 correctly", () => {
      const records = [
        makeRecord({ equipment_status: "out_of_service", event_type: "planned_drill", event_date: daysAgo(1) }),
        makeRecord({ equipment_status: "out_of_service", event_type: "planned_drill", event_date: daysAgo(2) }),
      ];
      const alerts = identifyFireSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "equipment_out_of_service")!;
      expect(alert.message).toContain("2 fire safety equipment items are out of service");
    });

    it("does not fire when no out_of_service records", () => {
      const records = [
        makeRecord({ equipment_status: "operational", event_type: "planned_drill", event_date: daysAgo(1) }),
        makeRecord({ equipment_status: "needs_maintenance", event_type: "planned_drill", event_date: daysAgo(2) }),
      ];
      const alerts = identifyFireSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "equipment_out_of_service");
      expect(alert).toBeUndefined();
    });

    it("does not fire for not_checked status", () => {
      const records = [makeRecord({ equipment_status: "not_checked", event_type: "planned_drill", event_date: daysAgo(1) })];
      const alerts = identifyFireSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "equipment_out_of_service");
      expect(alert).toBeUndefined();
    });

    it("does not fire for needs_maintenance status", () => {
      const records = [makeRecord({ equipment_status: "needs_maintenance", event_type: "planned_drill", event_date: daysAgo(1) })];
      const alerts = identifyFireSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "equipment_out_of_service");
      expect(alert).toBeUndefined();
    });

    it("message contains repair or replacement wording", () => {
      const records = [makeRecord({ equipment_status: "out_of_service", event_type: "planned_drill", event_date: daysAgo(1) })];
      const alerts = identifyFireSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "equipment_out_of_service")!;
      expect(alert.message).toContain("arrange repair or replacement");
    });

    it("fires only once as aggregate alert, not per record", () => {
      const records = [
        makeRecord({ equipment_status: "out_of_service", event_type: "planned_drill", event_date: daysAgo(1) }),
        makeRecord({ equipment_status: "out_of_service", event_type: "planned_drill", event_date: daysAgo(2) }),
      ];
      const alerts = identifyFireSafetyAlerts(records);
      const eqAlerts = alerts.filter((a) => a.type === "equipment_out_of_service");
      expect(eqAlerts).toHaveLength(1);
    });
  });

  describe("drill_overdue alert", () => {
    it("fires when no records at all", () => {
      const alerts = identifyFireSafetyAlerts([]);
      const alert = alerts.find((a) => a.type === "drill_overdue");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const alerts = identifyFireSafetyAlerts([]);
      const alert = alerts.find((a) => a.type === "drill_overdue")!;
      expect(alert.severity).toBe("medium");
    });

    it("has id drill_overdue", () => {
      const alerts = identifyFireSafetyAlerts([]);
      const alert = alerts.find((a) => a.type === "drill_overdue")!;
      expect(alert.id).toBe("drill_overdue");
    });

    it("uses no drills recorded message when no drills exist", () => {
      const alerts = identifyFireSafetyAlerts([]);
      const alert = alerts.find((a) => a.type === "drill_overdue")!;
      expect(alert.message).toBe("No fire drills recorded — conduct fire drill immediately");
    });

    it("uses no drills recorded message when only non-drill records exist", () => {
      const records = [
        makeRecord({ event_type: "equipment_check", event_date: daysAgo(1) }),
      ];
      const alerts = identifyFireSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "drill_overdue")!;
      expect(alert.message).toBe("No fire drills recorded — conduct fire drill immediately");
    });

    it("uses overdue message when drills exist but are > 30 days old", () => {
      const records = [makeRecord({ event_type: "planned_drill", event_date: daysAgo(31) })];
      const alerts = identifyFireSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "drill_overdue")!;
      expect(alert.message).toBe("Fire drill overdue (last drill more than 30 days ago) — schedule drill");
    });

    it("does not fire when drill is within 30 days", () => {
      const records = [makeRecord({ event_type: "planned_drill", event_date: daysAgo(15) })];
      const alerts = identifyFireSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "drill_overdue");
      expect(alert).toBeUndefined();
    });

    it("does not fire when drill is today", () => {
      const records = [makeRecord({ event_type: "unannounced_drill", event_date: daysAgo(0) })];
      const alerts = identifyFireSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "drill_overdue");
      expect(alert).toBeUndefined();
    });

    it("fires when all drills are old even with recent non-drill events", () => {
      const records = [
        makeRecord({ event_type: "equipment_check", event_date: daysAgo(1) }),
        makeRecord({ event_type: "planned_drill", event_date: daysAgo(35) }),
      ];
      const alerts = identifyFireSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "drill_overdue");
      expect(alert).toBeDefined();
    });

    it("does not fire when most recent of multiple drills is within 30 days", () => {
      const records = [
        makeRecord({ event_type: "planned_drill", event_date: daysAgo(60) }),
        makeRecord({ event_type: "unannounced_drill", event_date: daysAgo(10) }),
      ];
      const alerts = identifyFireSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "drill_overdue");
      expect(alert).toBeUndefined();
    });
  });

  describe("combined alerts", () => {
    it("can fire all five alert types simultaneously", () => {
      const records = [
        // failed_evacuation (critical) + persons_not_accounted (critical) + non_compliant (high)
        makeRecord({ id: "r1", evacuation_result: "failed", all_persons_accounted: false, compliance_status: "non_compliant", equipment_status: "out_of_service", event_type: "planned_drill", event_date: daysAgo(35) }),
      ];
      const alerts = identifyFireSafetyAlerts(records);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("failed_evacuation");
      expect(types).toContain("persons_not_accounted");
      expect(types).toContain("non_compliant");
      expect(types).toContain("equipment_out_of_service");
      expect(types).toContain("drill_overdue");
    });

    it("returns correct total number of alerts for combined scenario", () => {
      const records = [
        // failed + not_accounted + non_compliant + out_of_service on single record + drill_overdue
        makeRecord({ evacuation_result: "failed", all_persons_accounted: false, compliance_status: "non_compliant", equipment_status: "out_of_service", event_type: "planned_drill", event_date: daysAgo(35) }),
      ];
      const alerts = identifyFireSafetyAlerts(records);
      // failed_evacuation=1, persons_not_accounted=1, non_compliant=1, equipment_out_of_service=1, drill_overdue=1
      expect(alerts).toHaveLength(5);
    });

    it("per-record alerts multiply while threshold alerts stay singular", () => {
      const records = [
        makeRecord({ evacuation_result: "failed", all_persons_accounted: false, compliance_status: "non_compliant", equipment_status: "out_of_service", event_type: "planned_drill", event_date: daysAgo(35) }),
        makeRecord({ evacuation_result: "failed", all_persons_accounted: false, compliance_status: "non_compliant", equipment_status: "out_of_service", event_type: "unannounced_drill", event_date: daysAgo(40) }),
      ];
      const alerts = identifyFireSafetyAlerts(records);
      expect(alerts.filter((a) => a.type === "failed_evacuation")).toHaveLength(2);
      expect(alerts.filter((a) => a.type === "persons_not_accounted")).toHaveLength(2);
      expect(alerts.filter((a) => a.type === "non_compliant")).toHaveLength(2);
      expect(alerts.filter((a) => a.type === "equipment_out_of_service")).toHaveLength(1);
      expect(alerts.filter((a) => a.type === "drill_overdue")).toHaveLength(1);
    });
  });

  describe("alert structure", () => {
    it("every alert has type, severity, message, and id fields", () => {
      const records = [
        makeRecord({ evacuation_result: "failed", event_type: "planned_drill", event_date: daysAgo(1) }),
      ];
      const alerts = identifyFireSafetyAlerts(records);
      for (const alert of alerts) {
        expect(alert).toHaveProperty("type");
        expect(alert).toHaveProperty("severity");
        expect(alert).toHaveProperty("message");
        expect(alert).toHaveProperty("id");
      }
    });

    it("severity is always one of critical, high, or medium", () => {
      const records = [
        makeRecord({ evacuation_result: "failed", all_persons_accounted: false, compliance_status: "non_compliant", equipment_status: "out_of_service", event_type: "planned_drill", event_date: daysAgo(35) }),
      ];
      const alerts = identifyFireSafetyAlerts(records);
      for (const alert of alerts) {
        expect(["critical", "high", "medium"]).toContain(alert.severity);
      }
    });

    it("message is always a non-empty string", () => {
      const records = [makeRecord({ evacuation_result: "failed", event_type: "planned_drill", event_date: daysAgo(1) })];
      const alerts = identifyFireSafetyAlerts(records);
      for (const alert of alerts) {
        expect(typeof alert.message).toBe("string");
        expect(alert.message.length).toBeGreaterThan(0);
      }
    });
  });

  describe("edge cases", () => {
    it("not_applicable evacuation with all_persons_accounted=false does not trigger persons_not_accounted", () => {
      const records = [makeRecord({ all_persons_accounted: false, evacuation_result: "not_applicable", event_type: "planned_drill", event_date: daysAgo(1) })];
      const alerts = identifyFireSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "persons_not_accounted");
      expect(alert).toBeUndefined();
    });

    it("operational equipment does not trigger equipment_out_of_service", () => {
      const records = [makeRecord({ equipment_status: "operational", event_type: "planned_drill", event_date: daysAgo(1) })];
      const alerts = identifyFireSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "equipment_out_of_service");
      expect(alert).toBeUndefined();
    });

    it("successful evacuation with all_persons_accounted triggers no critical alerts", () => {
      const records = [makeRecord({ evacuation_result: "successful", all_persons_accounted: true, compliance_status: "compliant", equipment_status: "operational", event_type: "planned_drill", event_date: daysAgo(1) })];
      const alerts = identifyFireSafetyAlerts(records);
      const criticals = alerts.filter((a) => a.severity === "critical");
      expect(criticals).toHaveLength(0);
    });

    it("multiple event types in event_type get underscores replaced properly", () => {
      const types: FireEventType[] = ["planned_drill", "unannounced_drill", "night_drill", "actual_fire", "false_alarm", "equipment_check", "risk_assessment", "staff_training"];
      for (const t of types) {
        const records = [makeRecord({ evacuation_result: "failed", event_type: t, event_date: daysAgo(1) })];
        const alerts = identifyFireSafetyAlerts(records);
        const alert = alerts.find((a) => a.type === "failed_evacuation")!;
        expect(alert.message).toContain(t.replace(/_/g, " "));
      }
    });
  });
});

// ── Factory helper validation ──────────────────────────────────────────────

describe("makeRecord factory helper", () => {
  it("creates a record with sensible defaults", () => {
    const r = makeRecord();
    expect(r.home_id).toBe("home-1");
    expect(r.event_type).toBe("planned_drill");
    expect(r.event_date).toBe("2026-05-01");
    expect(r.evacuation_result).toBe("successful");
    expect(r.evacuation_time_seconds).toBe(120);
    expect(r.all_persons_accounted).toBe(true);
    expect(r.children_present).toBe(4);
    expect(r.staff_present).toBe(3);
    expect(r.compliance_status).toBe("compliant");
    expect(r.equipment_status).toBe("operational");
    expect(r.issues_identified).toEqual([]);
    expect(r.actions_taken).toEqual([]);
    expect(r.conducted_by).toBe("Manager");
    expect(r.fire_service_attended).toBe(false);
    expect(r.peep_plans_followed).toBe(true);
    expect(r.night_staff_competent).toBeNull();
    expect(r.next_drill_date).toBeNull();
    expect(r.review_date).toBeNull();
    expect(r.notes).toBeNull();
  });

  it("allows overriding individual fields", () => {
    const r = makeRecord({ event_type: "night_drill", compliance_status: "non_compliant" });
    expect(r.event_type).toBe("night_drill");
    expect(r.compliance_status).toBe("non_compliant");
    // defaults still apply
    expect(r.evacuation_result).toBe("successful");
  });

  it("generates unique ids by default", () => {
    const r1 = makeRecord();
    const r2 = makeRecord();
    expect(r1.id).not.toBe(r2.id);
  });

  it("allows overriding id", () => {
    const r = makeRecord({ id: "custom-id" });
    expect(r.id).toBe("custom-id");
  });

  it("allows setting nullable fields to null", () => {
    const r = makeRecord({ evacuation_time_seconds: null, night_staff_competent: null, next_drill_date: null, review_date: null, notes: null });
    expect(r.evacuation_time_seconds).toBeNull();
    expect(r.night_staff_competent).toBeNull();
    expect(r.next_drill_date).toBeNull();
    expect(r.review_date).toBeNull();
    expect(r.notes).toBeNull();
  });
});
