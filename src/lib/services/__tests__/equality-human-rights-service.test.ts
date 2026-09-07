// ══════════════════════════════════════════════════════════════════════════════
// CARA — EQUALITY & HUMAN RIGHTS SERVICE TESTS
// Pure-function tests for equality metrics, alert identification,
// constant validation, and edge cases.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { todayStr } from "@/lib/utils";

import {
  ASSESSMENT_TYPES,
  PROTECTED_CHARACTERISTICS,
  COMPLIANCE_LEVELS,
  ACTION_STATUSES,
  _testing,
} from "../equality-human-rights-service";

import type {
  EqualityRecord,
  AssessmentType,
  ProtectedCharacteristic,
  ComplianceLevel,
  ActionStatus,
} from "../equality-human-rights-service";

const { computeEqualityMetrics, identifyEqualityAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

function makeRecord(
  overrides?: Partial<EqualityRecord>,
): EqualityRecord {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : crypto.randomUUID(),
    home_id: "home_id" in (overrides ?? {}) ? overrides!.home_id! : "home-1",
    assessment_type: "assessment_type" in (overrides ?? {}) ? overrides!.assessment_type! : "equality_impact_assessment",
    assessment_date: "assessment_date" in (overrides ?? {}) ? overrides!.assessment_date! : "2026-05-01",
    protected_characteristic: "protected_characteristic" in (overrides ?? {}) ? overrides!.protected_characteristic! : "none_identified",
    compliance_level: "compliance_level" in (overrides ?? {}) ? overrides!.compliance_level! : "fully_compliant",
    action_status: "action_status" in (overrides ?? {}) ? overrides!.action_status! : "completed",
    assessed_by: "assessed_by" in (overrides ?? {}) ? overrides!.assessed_by! : "Manager",
    child_involved: "child_involved" in (overrides ?? {}) ? (overrides!.child_involved ?? null) : null,
    staff_involved: "staff_involved" in (overrides ?? {}) ? (overrides!.staff_involved ?? null) : null,
    description: "description" in (overrides ?? {}) ? overrides!.description! : "Test record",
    findings: "findings" in (overrides ?? {}) ? (overrides!.findings ?? null) : null,
    actions_required: "actions_required" in (overrides ?? {}) ? overrides!.actions_required! : [],
    actions_completed: "actions_completed" in (overrides ?? {}) ? overrides!.actions_completed! : [],
    reasonable_adjustment_made: "reasonable_adjustment_made" in (overrides ?? {}) ? overrides!.reasonable_adjustment_made! : false,
    human_rights_article: "human_rights_article" in (overrides ?? {}) ? (overrides!.human_rights_article ?? null) : null,
    discrimination_type: "discrimination_type" in (overrides ?? {}) ? (overrides!.discrimination_type ?? null) : null,
    impact_on_child: "impact_on_child" in (overrides ?? {}) ? overrides!.impact_on_child! : false,
    review_date: "review_date" in (overrides ?? {}) ? (overrides!.review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: "created_at" in (overrides ?? {}) ? overrides!.created_at! : "2026-05-01T08:00:00Z",
    updated_at: "updated_at" in (overrides ?? {}) ? overrides!.updated_at! : "2026-05-01T08:00:00Z",
  };
}

/** Return an ISO date string for N days ago from now */
function daysAgo(n: number): string {
  // UTC throughout: parsing todayStr() gives UTC midnight, so the day shift
  // must stay in UTC too — a local setDate lands an hour off across a DST
  // boundary and toISOString().slice(0,10) then names the wrong day.
  const [y, m, d] = todayStr().split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d - n)).toISOString().slice(0, 10);
}

/** Return an ISO date string for N days from now (future) */
function daysFromNow(n: number): string {
  // UTC throughout: parsing todayStr() gives UTC midnight, so the day shift
  // must stay in UTC too — a local setDate lands an hour off across a DST
  // boundary and toISOString().slice(0,10) then names the wrong day.
  const [y, m, d] = todayStr().split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

// ── Constants ──────────────────────────────────────────────────────────────

describe("Constants", () => {
  describe("ASSESSMENT_TYPES", () => {
    it("has exactly 9 items", () => {
      expect(ASSESSMENT_TYPES).toHaveLength(9);
    });

    it("contains equality_impact_assessment", () => {
      expect(ASSESSMENT_TYPES).toContainEqual({ type: "equality_impact_assessment", label: "Equality Impact Assessment" });
    });

    it("contains human_rights_audit", () => {
      expect(ASSESSMENT_TYPES).toContainEqual({ type: "human_rights_audit", label: "Human Rights Audit" });
    });

    it("contains discrimination_incident", () => {
      expect(ASSESSMENT_TYPES).toContainEqual({ type: "discrimination_incident", label: "Discrimination Incident" });
    });

    it("contains reasonable_adjustment", () => {
      expect(ASSESSMENT_TYPES).toContainEqual({ type: "reasonable_adjustment", label: "Reasonable Adjustment" });
    });

    it("contains policy_review", () => {
      expect(ASSESSMENT_TYPES).toContainEqual({ type: "policy_review", label: "Policy Review" });
    });

    it("contains staff_training", () => {
      expect(ASSESSMENT_TYPES).toContainEqual({ type: "staff_training", label: "Staff Training" });
    });

    it("contains child_consultation", () => {
      expect(ASSESSMENT_TYPES).toContainEqual({ type: "child_consultation", label: "Child Consultation" });
    });

    it("contains compliance_check", () => {
      expect(ASSESSMENT_TYPES).toContainEqual({ type: "compliance_check", label: "Compliance Check" });
    });

    it("contains other", () => {
      expect(ASSESSMENT_TYPES).toContainEqual({ type: "other", label: "Other" });
    });

    it("has unique type values", () => {
      const types = ASSESSMENT_TYPES.map((t) => t.type);
      expect(new Set(types).size).toBe(types.length);
    });

    it("has unique labels", () => {
      const labels = ASSESSMENT_TYPES.map((t) => t.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of ASSESSMENT_TYPES) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });
  });

  describe("PROTECTED_CHARACTERISTICS", () => {
    it("has exactly 11 items", () => {
      expect(PROTECTED_CHARACTERISTICS).toHaveLength(11);
    });

    it("contains age", () => {
      expect(PROTECTED_CHARACTERISTICS).toContainEqual({ characteristic: "age", label: "Age" });
    });

    it("contains disability", () => {
      expect(PROTECTED_CHARACTERISTICS).toContainEqual({ characteristic: "disability", label: "Disability" });
    });

    it("contains gender_reassignment", () => {
      expect(PROTECTED_CHARACTERISTICS).toContainEqual({ characteristic: "gender_reassignment", label: "Gender Reassignment" });
    });

    it("contains marriage_civil_partnership", () => {
      expect(PROTECTED_CHARACTERISTICS).toContainEqual({ characteristic: "marriage_civil_partnership", label: "Marriage/Civil Partnership" });
    });

    it("contains pregnancy_maternity", () => {
      expect(PROTECTED_CHARACTERISTICS).toContainEqual({ characteristic: "pregnancy_maternity", label: "Pregnancy/Maternity" });
    });

    it("contains race", () => {
      expect(PROTECTED_CHARACTERISTICS).toContainEqual({ characteristic: "race", label: "Race" });
    });

    it("contains religion_belief", () => {
      expect(PROTECTED_CHARACTERISTICS).toContainEqual({ characteristic: "religion_belief", label: "Religion/Belief" });
    });

    it("contains sex", () => {
      expect(PROTECTED_CHARACTERISTICS).toContainEqual({ characteristic: "sex", label: "Sex" });
    });

    it("contains sexual_orientation", () => {
      expect(PROTECTED_CHARACTERISTICS).toContainEqual({ characteristic: "sexual_orientation", label: "Sexual Orientation" });
    });

    it("contains multiple", () => {
      expect(PROTECTED_CHARACTERISTICS).toContainEqual({ characteristic: "multiple", label: "Multiple" });
    });

    it("contains none_identified", () => {
      expect(PROTECTED_CHARACTERISTICS).toContainEqual({ characteristic: "none_identified", label: "None Identified" });
    });

    it("has unique characteristic values", () => {
      const chars = PROTECTED_CHARACTERISTICS.map((c) => c.characteristic);
      expect(new Set(chars).size).toBe(chars.length);
    });

    it("has unique labels", () => {
      const labels = PROTECTED_CHARACTERISTICS.map((c) => c.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of PROTECTED_CHARACTERISTICS) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });
  });

  describe("COMPLIANCE_LEVELS", () => {
    it("has exactly 5 items", () => {
      expect(COMPLIANCE_LEVELS).toHaveLength(5);
    });

    it("contains fully_compliant", () => {
      expect(COMPLIANCE_LEVELS).toContainEqual({ level: "fully_compliant", label: "Fully Compliant" });
    });

    it("contains mostly_compliant", () => {
      expect(COMPLIANCE_LEVELS).toContainEqual({ level: "mostly_compliant", label: "Mostly Compliant" });
    });

    it("contains partially_compliant", () => {
      expect(COMPLIANCE_LEVELS).toContainEqual({ level: "partially_compliant", label: "Partially Compliant" });
    });

    it("contains non_compliant", () => {
      expect(COMPLIANCE_LEVELS).toContainEqual({ level: "non_compliant", label: "Non-Compliant" });
    });

    it("contains not_assessed", () => {
      expect(COMPLIANCE_LEVELS).toContainEqual({ level: "not_assessed", label: "Not Assessed" });
    });

    it("has unique level values", () => {
      const levels = COMPLIANCE_LEVELS.map((l) => l.level);
      expect(new Set(levels).size).toBe(levels.length);
    });

    it("has unique labels", () => {
      const labels = COMPLIANCE_LEVELS.map((l) => l.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of COMPLIANCE_LEVELS) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });
  });

  describe("ACTION_STATUSES", () => {
    it("has exactly 5 items", () => {
      expect(ACTION_STATUSES).toHaveLength(5);
    });

    it("contains completed", () => {
      expect(ACTION_STATUSES).toContainEqual({ status: "completed", label: "Completed" });
    });

    it("contains in_progress", () => {
      expect(ACTION_STATUSES).toContainEqual({ status: "in_progress", label: "In Progress" });
    });

    it("contains planned", () => {
      expect(ACTION_STATUSES).toContainEqual({ status: "planned", label: "Planned" });
    });

    it("contains overdue", () => {
      expect(ACTION_STATUSES).toContainEqual({ status: "overdue", label: "Overdue" });
    });

    it("contains not_required", () => {
      expect(ACTION_STATUSES).toContainEqual({ status: "not_required", label: "Not Required" });
    });

    it("has unique status values", () => {
      const statuses = ACTION_STATUSES.map((s) => s.status);
      expect(new Set(statuses).size).toBe(statuses.length);
    });

    it("has unique labels", () => {
      const labels = ACTION_STATUSES.map((s) => s.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of ACTION_STATUSES) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });
  });
});

// ── computeEqualityMetrics ────────────────────────────────────────────────

describe("computeEqualityMetrics", () => {
  describe("empty array", () => {
    it("returns zero total_records", () => {
      const m = computeEqualityMetrics([]);
      expect(m.total_records).toBe(0);
    });

    it("returns zero eia_count", () => {
      const m = computeEqualityMetrics([]);
      expect(m.eia_count).toBe(0);
    });

    it("returns zero human_rights_audit_count", () => {
      const m = computeEqualityMetrics([]);
      expect(m.human_rights_audit_count).toBe(0);
    });

    it("returns zero discrimination_incident_count", () => {
      const m = computeEqualityMetrics([]);
      expect(m.discrimination_incident_count).toBe(0);
    });

    it("returns zero reasonable_adjustment_count", () => {
      const m = computeEqualityMetrics([]);
      expect(m.reasonable_adjustment_count).toBe(0);
    });

    it("returns zero fully_compliant_rate", () => {
      const m = computeEqualityMetrics([]);
      expect(m.fully_compliant_rate).toBeNull();;
    });

    it("returns zero non_compliant_count", () => {
      const m = computeEqualityMetrics([]);
      expect(m.non_compliant_count).toBe(0);
    });

    it("returns zero actions_overdue_count", () => {
      const m = computeEqualityMetrics([]);
      expect(m.actions_overdue_count).toBe(0);
    });

    it("returns zero actions_completed_rate", () => {
      const m = computeEqualityMetrics([]);
      expect(m.actions_completed_rate).toBeNull();;
    });

    it("returns zero reasonable_adjustment_rate", () => {
      const m = computeEqualityMetrics([]);
      expect(m.reasonable_adjustment_rate).toBeNull();;
    });

    it("returns zero impact_on_child_count", () => {
      const m = computeEqualityMetrics([]);
      expect(m.impact_on_child_count).toBe(0);
    });

    it("returns zero review_overdue_count", () => {
      const m = computeEqualityMetrics([]);
      expect(m.review_overdue_count).toBe(0);
    });

    it("returns empty by_assessment_type", () => {
      const m = computeEqualityMetrics([]);
      expect(m.by_assessment_type).toEqual({});
    });

    it("returns empty by_protected_characteristic", () => {
      const m = computeEqualityMetrics([]);
      expect(m.by_protected_characteristic).toEqual({});
    });

    it("returns empty by_compliance_level", () => {
      const m = computeEqualityMetrics([]);
      expect(m.by_compliance_level).toEqual({});
    });

    it("returns empty by_action_status", () => {
      const m = computeEqualityMetrics([]);
      expect(m.by_action_status).toEqual({});
    });
  });

  describe("single record", () => {
    const record = makeRecord({
      assessment_type: "equality_impact_assessment",
      assessment_date: "2026-05-01",
      protected_characteristic: "disability",
      compliance_level: "fully_compliant",
      action_status: "completed",
      actions_required: ["a1", "a2"],
      actions_completed: ["a1"],
      reasonable_adjustment_made: true,
      impact_on_child: false,
    });

    it("returns total_records = 1", () => {
      const m = computeEqualityMetrics([record]);
      expect(m.total_records).toBe(1);
    });

    it("returns eia_count = 1", () => {
      const m = computeEqualityMetrics([record]);
      expect(m.eia_count).toBe(1);
    });

    it("returns human_rights_audit_count = 0", () => {
      const m = computeEqualityMetrics([record]);
      expect(m.human_rights_audit_count).toBe(0);
    });

    it("returns discrimination_incident_count = 0", () => {
      const m = computeEqualityMetrics([record]);
      expect(m.discrimination_incident_count).toBe(0);
    });

    it("returns reasonable_adjustment_count = 0", () => {
      const m = computeEqualityMetrics([record]);
      expect(m.reasonable_adjustment_count).toBe(0);
    });

    it("returns fully_compliant_rate = 100", () => {
      const m = computeEqualityMetrics([record]);
      expect(m.fully_compliant_rate).toBe(100);
    });

    it("returns non_compliant_count = 0", () => {
      const m = computeEqualityMetrics([record]);
      expect(m.non_compliant_count).toBe(0);
    });

    it("returns actions_overdue_count = 0", () => {
      const m = computeEqualityMetrics([record]);
      expect(m.actions_overdue_count).toBe(0);
    });

    it("returns actions_completed_rate = 50 (1/2)", () => {
      const m = computeEqualityMetrics([record]);
      expect(m.actions_completed_rate).toBe(50);
    });

    it("returns reasonable_adjustment_rate = 100", () => {
      const m = computeEqualityMetrics([record]);
      expect(m.reasonable_adjustment_rate).toBe(100);
    });

    it("returns impact_on_child_count = 0", () => {
      const m = computeEqualityMetrics([record]);
      expect(m.impact_on_child_count).toBe(0);
    });

    it("returns by_assessment_type with single entry", () => {
      const m = computeEqualityMetrics([record]);
      expect(m.by_assessment_type).toEqual({ equality_impact_assessment: 1 });
    });

    it("returns by_protected_characteristic with single entry", () => {
      const m = computeEqualityMetrics([record]);
      expect(m.by_protected_characteristic).toEqual({ disability: 1 });
    });

    it("returns by_compliance_level with single entry", () => {
      const m = computeEqualityMetrics([record]);
      expect(m.by_compliance_level).toEqual({ fully_compliant: 1 });
    });

    it("returns by_action_status with single entry", () => {
      const m = computeEqualityMetrics([record]);
      expect(m.by_action_status).toEqual({ completed: 1 });
    });
  });

  describe("multiple records", () => {
    const records = [
      makeRecord({ assessment_type: "equality_impact_assessment", protected_characteristic: "disability", compliance_level: "fully_compliant", action_status: "completed", actions_required: ["a1"], actions_completed: ["a1"], reasonable_adjustment_made: true, impact_on_child: false }),
      makeRecord({ assessment_type: "human_rights_audit", protected_characteristic: "race", compliance_level: "mostly_compliant", action_status: "in_progress", actions_required: ["a1", "a2"], actions_completed: [], reasonable_adjustment_made: false, impact_on_child: true }),
      makeRecord({ assessment_type: "discrimination_incident", protected_characteristic: "sex", compliance_level: "non_compliant", action_status: "overdue", actions_required: ["a1", "a2", "a3"], actions_completed: ["a1", "a2"], reasonable_adjustment_made: false, impact_on_child: true }),
      makeRecord({ assessment_type: "reasonable_adjustment", protected_characteristic: "age", compliance_level: "partially_compliant", action_status: "planned", actions_required: ["a1"], actions_completed: [], reasonable_adjustment_made: true, impact_on_child: false }),
      makeRecord({ assessment_type: "policy_review", protected_characteristic: "multiple", compliance_level: "fully_compliant", action_status: "not_required", actions_required: [], actions_completed: [], reasonable_adjustment_made: false, impact_on_child: false }),
    ];

    it("returns total_records = 5", () => {
      const m = computeEqualityMetrics(records);
      expect(m.total_records).toBe(5);
    });

    it("returns eia_count = 1", () => {
      const m = computeEqualityMetrics(records);
      expect(m.eia_count).toBe(1);
    });

    it("returns human_rights_audit_count = 1", () => {
      const m = computeEqualityMetrics(records);
      expect(m.human_rights_audit_count).toBe(1);
    });

    it("returns discrimination_incident_count = 1", () => {
      const m = computeEqualityMetrics(records);
      expect(m.discrimination_incident_count).toBe(1);
    });

    it("returns reasonable_adjustment_count = 1", () => {
      const m = computeEqualityMetrics(records);
      expect(m.reasonable_adjustment_count).toBe(1);
    });

    it("calculates fully_compliant_rate correctly (2/5 = 40%)", () => {
      const m = computeEqualityMetrics(records);
      expect(m.fully_compliant_rate).toBe(40);
    });

    it("returns non_compliant_count = 1", () => {
      const m = computeEqualityMetrics(records);
      expect(m.non_compliant_count).toBe(1);
    });

    it("returns actions_overdue_count = 1", () => {
      const m = computeEqualityMetrics(records);
      expect(m.actions_overdue_count).toBe(1);
    });

    it("calculates actions_completed_rate correctly (3/7 = 42.9%)", () => {
      const m = computeEqualityMetrics(records);
      // totalRequired=1+2+3+1+0=7, totalCompleted=1+0+2+0+0=3, 3/7=42.857...
      expect(m.actions_completed_rate).toBe(42.9);
    });

    it("calculates reasonable_adjustment_rate correctly (2/5 = 40%)", () => {
      const m = computeEqualityMetrics(records);
      expect(m.reasonable_adjustment_rate).toBe(40);
    });

    it("returns impact_on_child_count = 2", () => {
      const m = computeEqualityMetrics(records);
      expect(m.impact_on_child_count).toBe(2);
    });

    it("groups by_assessment_type correctly", () => {
      const m = computeEqualityMetrics(records);
      expect(m.by_assessment_type).toEqual({ equality_impact_assessment: 1, human_rights_audit: 1, discrimination_incident: 1, reasonable_adjustment: 1, policy_review: 1 });
    });

    it("groups by_protected_characteristic correctly", () => {
      const m = computeEqualityMetrics(records);
      expect(m.by_protected_characteristic).toEqual({ disability: 1, race: 1, sex: 1, age: 1, multiple: 1 });
    });

    it("groups by_compliance_level correctly", () => {
      const m = computeEqualityMetrics(records);
      expect(m.by_compliance_level).toEqual({ fully_compliant: 2, mostly_compliant: 1, non_compliant: 1, partially_compliant: 1 });
    });

    it("groups by_action_status correctly", () => {
      const m = computeEqualityMetrics(records);
      expect(m.by_action_status).toEqual({ completed: 1, in_progress: 1, overdue: 1, planned: 1, not_required: 1 });
    });
  });

  describe("assessment type counts", () => {
    it("counts equality_impact_assessment records", () => {
      const records = [
        makeRecord({ assessment_type: "equality_impact_assessment" }),
        makeRecord({ assessment_type: "equality_impact_assessment" }),
      ];
      const m = computeEqualityMetrics(records);
      expect(m.eia_count).toBe(2);
    });

    it("counts human_rights_audit records", () => {
      const records = [
        makeRecord({ assessment_type: "human_rights_audit" }),
        makeRecord({ assessment_type: "human_rights_audit" }),
        makeRecord({ assessment_type: "human_rights_audit" }),
      ];
      const m = computeEqualityMetrics(records);
      expect(m.human_rights_audit_count).toBe(3);
    });

    it("counts discrimination_incident records", () => {
      const records = [makeRecord({ assessment_type: "discrimination_incident" })];
      const m = computeEqualityMetrics(records);
      expect(m.discrimination_incident_count).toBe(1);
    });

    it("counts reasonable_adjustment records", () => {
      const records = [
        makeRecord({ assessment_type: "reasonable_adjustment" }),
        makeRecord({ assessment_type: "reasonable_adjustment" }),
      ];
      const m = computeEqualityMetrics(records);
      expect(m.reasonable_adjustment_count).toBe(2);
    });

    it("does not count policy_review as eia", () => {
      const records = [makeRecord({ assessment_type: "policy_review" })];
      const m = computeEqualityMetrics(records);
      expect(m.eia_count).toBe(0);
    });

    it("does not count staff_training as human_rights_audit", () => {
      const records = [makeRecord({ assessment_type: "staff_training" })];
      const m = computeEqualityMetrics(records);
      expect(m.human_rights_audit_count).toBe(0);
    });

    it("does not count compliance_check as discrimination_incident", () => {
      const records = [makeRecord({ assessment_type: "compliance_check" })];
      const m = computeEqualityMetrics(records);
      expect(m.discrimination_incident_count).toBe(0);
    });

    it("does not count other as any specific type", () => {
      const records = [makeRecord({ assessment_type: "other" })];
      const m = computeEqualityMetrics(records);
      expect(m.eia_count).toBe(0);
      expect(m.human_rights_audit_count).toBe(0);
      expect(m.discrimination_incident_count).toBe(0);
      expect(m.reasonable_adjustment_count).toBe(0);
    });
  });

  describe("fully_compliant_rate", () => {
    it("returns 100 when all fully_compliant", () => {
      const records = [
        makeRecord({ compliance_level: "fully_compliant" }),
        makeRecord({ compliance_level: "fully_compliant" }),
      ];
      const m = computeEqualityMetrics(records);
      expect(m.fully_compliant_rate).toBe(100);
    });

    it("returns 0 when none fully_compliant", () => {
      const records = [
        makeRecord({ compliance_level: "non_compliant" }),
        makeRecord({ compliance_level: "mostly_compliant" }),
      ];
      const m = computeEqualityMetrics(records);
      expect(m.fully_compliant_rate).toBe(0);
    });

    it("calculates with rounding (1/3 = 33.3%)", () => {
      const records = [
        makeRecord({ compliance_level: "fully_compliant" }),
        makeRecord({ compliance_level: "mostly_compliant" }),
        makeRecord({ compliance_level: "non_compliant" }),
      ];
      const m = computeEqualityMetrics(records);
      expect(m.fully_compliant_rate).toBe(33.3);
    });

    it("calculates (2/3 = 66.7%)", () => {
      const records = [
        makeRecord({ compliance_level: "fully_compliant" }),
        makeRecord({ compliance_level: "fully_compliant" }),
        makeRecord({ compliance_level: "non_compliant" }),
      ];
      const m = computeEqualityMetrics(records);
      expect(m.fully_compliant_rate).toBe(66.7);
    });

    it("uses all records as denominator including not_assessed", () => {
      const records = [
        makeRecord({ compliance_level: "fully_compliant" }),
        makeRecord({ compliance_level: "not_assessed" }),
      ];
      // 1/2 = 50%
      const m = computeEqualityMetrics(records);
      expect(m.fully_compliant_rate).toBe(50);
    });
  });

  describe("non_compliant_count", () => {
    it("counts non_compliant records accurately", () => {
      const records = [
        makeRecord({ compliance_level: "non_compliant" }),
        makeRecord({ compliance_level: "non_compliant" }),
        makeRecord({ compliance_level: "fully_compliant" }),
      ];
      const m = computeEqualityMetrics(records);
      expect(m.non_compliant_count).toBe(2);
    });

    it("does not count mostly_compliant as non_compliant", () => {
      const records = [makeRecord({ compliance_level: "mostly_compliant" })];
      const m = computeEqualityMetrics(records);
      expect(m.non_compliant_count).toBe(0);
    });

    it("does not count partially_compliant as non_compliant", () => {
      const records = [makeRecord({ compliance_level: "partially_compliant" })];
      const m = computeEqualityMetrics(records);
      expect(m.non_compliant_count).toBe(0);
    });

    it("does not count not_assessed as non_compliant", () => {
      const records = [makeRecord({ compliance_level: "not_assessed" })];
      const m = computeEqualityMetrics(records);
      expect(m.non_compliant_count).toBe(0);
    });
  });

  describe("actions_overdue_count", () => {
    it("counts overdue action_status records", () => {
      const records = [
        makeRecord({ action_status: "overdue" }),
        makeRecord({ action_status: "overdue" }),
        makeRecord({ action_status: "completed" }),
      ];
      const m = computeEqualityMetrics(records);
      expect(m.actions_overdue_count).toBe(2);
    });

    it("does not count in_progress as overdue", () => {
      const records = [makeRecord({ action_status: "in_progress" })];
      const m = computeEqualityMetrics(records);
      expect(m.actions_overdue_count).toBe(0);
    });

    it("does not count planned as overdue", () => {
      const records = [makeRecord({ action_status: "planned" })];
      const m = computeEqualityMetrics(records);
      expect(m.actions_overdue_count).toBe(0);
    });
  });

  describe("actions_completed_rate", () => {
    it("returns 100 when all actions completed", () => {
      const records = [
        makeRecord({ actions_required: ["a", "b"], actions_completed: ["a", "b"] }),
      ];
      const m = computeEqualityMetrics(records);
      expect(m.actions_completed_rate).toBe(100);
    });

    it("returns 0 when no actions completed", () => {
      const records = [
        makeRecord({ actions_required: ["a", "b"], actions_completed: [] }),
      ];
      const m = computeEqualityMetrics(records);
      expect(m.actions_completed_rate).toBe(0);
    });

    it("returns 0 when no actions required", () => {
      const records = [
        makeRecord({ actions_required: [], actions_completed: [] }),
      ];
      const m = computeEqualityMetrics(records);
      expect(m.actions_completed_rate).toBeNull();;
    });

    it("sums across multiple records (2+1)/(3+2) = 60%", () => {
      const records = [
        makeRecord({ actions_required: ["a", "b", "c"], actions_completed: ["a", "b"] }),
        makeRecord({ actions_required: ["x", "y"], actions_completed: ["x"] }),
      ];
      const m = computeEqualityMetrics(records);
      expect(m.actions_completed_rate).toBe(60);
    });

    it("calculates with rounding (1/3 = 33.3%)", () => {
      const records = [
        makeRecord({ actions_required: ["a", "b", "c"], actions_completed: ["a"] }),
      ];
      const m = computeEqualityMetrics(records);
      expect(m.actions_completed_rate).toBe(33.3);
    });

    it("calculates (2/3 = 66.7%)", () => {
      const records = [
        makeRecord({ actions_required: ["a", "b", "c"], actions_completed: ["a", "b"] }),
      ];
      const m = computeEqualityMetrics(records);
      expect(m.actions_completed_rate).toBe(66.7);
    });
  });

  describe("reasonable_adjustment_rate", () => {
    it("returns 100 when all adjustments made", () => {
      const records = [
        makeRecord({ reasonable_adjustment_made: true }),
        makeRecord({ reasonable_adjustment_made: true }),
      ];
      const m = computeEqualityMetrics(records);
      expect(m.reasonable_adjustment_rate).toBe(100);
    });

    it("returns 0 when no adjustments made", () => {
      const records = [
        makeRecord({ reasonable_adjustment_made: false }),
        makeRecord({ reasonable_adjustment_made: false }),
      ];
      const m = computeEqualityMetrics(records);
      expect(m.reasonable_adjustment_rate).toBe(0);
    });

    it("calculates with rounding (1/3 = 33.3%)", () => {
      const records = [
        makeRecord({ reasonable_adjustment_made: true }),
        makeRecord({ reasonable_adjustment_made: false }),
        makeRecord({ reasonable_adjustment_made: false }),
      ];
      const m = computeEqualityMetrics(records);
      expect(m.reasonable_adjustment_rate).toBe(33.3);
    });

    it("calculates (2/3 = 66.7%)", () => {
      const records = [
        makeRecord({ reasonable_adjustment_made: true }),
        makeRecord({ reasonable_adjustment_made: true }),
        makeRecord({ reasonable_adjustment_made: false }),
      ];
      const m = computeEqualityMetrics(records);
      expect(m.reasonable_adjustment_rate).toBe(66.7);
    });

    it("uses all records as denominator", () => {
      const records = [
        makeRecord({ reasonable_adjustment_made: true }),
        makeRecord({ reasonable_adjustment_made: false }),
      ];
      const m = computeEqualityMetrics(records);
      expect(m.reasonable_adjustment_rate).toBe(50);
    });
  });

  describe("impact_on_child_count", () => {
    it("counts records with impact_on_child true", () => {
      const records = [
        makeRecord({ impact_on_child: true }),
        makeRecord({ impact_on_child: true }),
        makeRecord({ impact_on_child: false }),
      ];
      const m = computeEqualityMetrics(records);
      expect(m.impact_on_child_count).toBe(2);
    });

    it("returns 0 when no impact_on_child", () => {
      const records = [
        makeRecord({ impact_on_child: false }),
        makeRecord({ impact_on_child: false }),
      ];
      const m = computeEqualityMetrics(records);
      expect(m.impact_on_child_count).toBe(0);
    });
  });

  describe("review_overdue_count", () => {
    it("counts records with past review_date", () => {
      const records = [
        makeRecord({ review_date: daysAgo(5) }),
        makeRecord({ review_date: daysAgo(10) }),
      ];
      const m = computeEqualityMetrics(records);
      expect(m.review_overdue_count).toBe(2);
    });

    it("does not count records with future review_date", () => {
      const records = [
        makeRecord({ review_date: daysFromNow(10) }),
        makeRecord({ review_date: daysFromNow(20) }),
      ];
      const m = computeEqualityMetrics(records);
      expect(m.review_overdue_count).toBe(0);
    });

    it("does not count records with null review_date", () => {
      const records = [
        makeRecord({ review_date: null }),
        makeRecord({ review_date: null }),
      ];
      const m = computeEqualityMetrics(records);
      expect(m.review_overdue_count).toBe(0);
    });

    it("counts mixed past/future/null correctly", () => {
      const records = [
        makeRecord({ review_date: daysAgo(5) }),
        makeRecord({ review_date: daysFromNow(5) }),
        makeRecord({ review_date: null }),
      ];
      const m = computeEqualityMetrics(records);
      expect(m.review_overdue_count).toBe(1);
    });
  });

  describe("by_assessment_type breakdown", () => {
    it("counts each assessment type separately", () => {
      const records = [
        makeRecord({ assessment_type: "equality_impact_assessment" }),
        makeRecord({ assessment_type: "equality_impact_assessment" }),
        makeRecord({ assessment_type: "human_rights_audit" }),
        makeRecord({ assessment_type: "policy_review" }),
      ];
      const m = computeEqualityMetrics(records);
      expect(m.by_assessment_type).toEqual({ equality_impact_assessment: 2, human_rights_audit: 1, policy_review: 1 });
    });

    it("handles all nine assessment types", () => {
      const types: AssessmentType[] = ["equality_impact_assessment", "human_rights_audit", "discrimination_incident", "reasonable_adjustment", "policy_review", "staff_training", "child_consultation", "compliance_check", "other"];
      const records = types.map((t) => makeRecord({ assessment_type: t }));
      const m = computeEqualityMetrics(records);
      for (const t of types) {
        expect(m.by_assessment_type[t]).toBe(1);
      }
    });
  });

  describe("by_protected_characteristic breakdown", () => {
    it("counts each characteristic separately", () => {
      const records = [
        makeRecord({ protected_characteristic: "disability" }),
        makeRecord({ protected_characteristic: "disability" }),
        makeRecord({ protected_characteristic: "race" }),
      ];
      const m = computeEqualityMetrics(records);
      expect(m.by_protected_characteristic).toEqual({ disability: 2, race: 1 });
    });

    it("handles all eleven characteristics", () => {
      const chars: ProtectedCharacteristic[] = ["age", "disability", "gender_reassignment", "marriage_civil_partnership", "pregnancy_maternity", "race", "religion_belief", "sex", "sexual_orientation", "multiple", "none_identified"];
      const records = chars.map((c) => makeRecord({ protected_characteristic: c }));
      const m = computeEqualityMetrics(records);
      for (const c of chars) {
        expect(m.by_protected_characteristic[c]).toBe(1);
      }
    });
  });

  describe("by_compliance_level breakdown", () => {
    it("counts each compliance level separately", () => {
      const records = [
        makeRecord({ compliance_level: "fully_compliant" }),
        makeRecord({ compliance_level: "fully_compliant" }),
        makeRecord({ compliance_level: "non_compliant" }),
      ];
      const m = computeEqualityMetrics(records);
      expect(m.by_compliance_level).toEqual({ fully_compliant: 2, non_compliant: 1 });
    });

    it("handles all five compliance levels", () => {
      const levels: ComplianceLevel[] = ["fully_compliant", "mostly_compliant", "partially_compliant", "non_compliant", "not_assessed"];
      const records = levels.map((l) => makeRecord({ compliance_level: l }));
      const m = computeEqualityMetrics(records);
      for (const l of levels) {
        expect(m.by_compliance_level[l]).toBe(1);
      }
    });
  });

  describe("by_action_status breakdown", () => {
    it("counts each action status separately", () => {
      const records = [
        makeRecord({ action_status: "completed" }),
        makeRecord({ action_status: "completed" }),
        makeRecord({ action_status: "overdue" }),
      ];
      const m = computeEqualityMetrics(records);
      expect(m.by_action_status).toEqual({ completed: 2, overdue: 1 });
    });

    it("handles all five action statuses", () => {
      const statuses: ActionStatus[] = ["completed", "in_progress", "planned", "overdue", "not_required"];
      const records = statuses.map((s) => makeRecord({ action_status: s }));
      const m = computeEqualityMetrics(records);
      for (const s of statuses) {
        expect(m.by_action_status[s]).toBe(1);
      }
    });
  });

  describe("large data set", () => {
    it("handles 100 records correctly", () => {
      const records: EqualityRecord[] = [];
      for (let i = 0; i < 100; i++) {
        records.push(
          makeRecord({
            assessment_type: i % 3 === 0 ? "equality_impact_assessment" : i % 3 === 1 ? "human_rights_audit" : "discrimination_incident",
            compliance_level: "fully_compliant",
            action_status: "completed",
            actions_required: ["a"],
            actions_completed: ["a"],
            reasonable_adjustment_made: true,
            impact_on_child: i % 5 === 0,
          }),
        );
      }
      const m = computeEqualityMetrics(records);
      expect(m.total_records).toBe(100);
      expect(m.fully_compliant_rate).toBe(100);
      expect(m.actions_completed_rate).toBe(100);
      expect(m.reasonable_adjustment_rate).toBe(100);
      // eia: i%3===0 => 34, hr_audit: i%3===1 => 33, discrim: i%3===2 => 33
      expect(m.eia_count).toBe(34);
      expect(m.human_rights_audit_count).toBe(33);
      expect(m.discrimination_incident_count).toBe(33);
      // impact_on_child: i%5===0 => 20
      expect(m.impact_on_child_count).toBe(20);
    });
  });
});

// ── identifyEqualityAlerts ────────────────────────────────────────────────

describe("identifyEqualityAlerts", () => {
  describe("no alerts", () => {
    it("returns empty array when no records", () => {
      const alerts = identifyEqualityAlerts([]);
      expect(alerts).toHaveLength(0);
    });

    it("returns empty array when all records are clean", () => {
      const records = [
        makeRecord({
          assessment_type: "equality_impact_assessment",
          compliance_level: "fully_compliant",
          action_status: "completed",
          impact_on_child: false,
          reasonable_adjustment_made: true,
          review_date: daysFromNow(30),
        }),
      ];
      const alerts = identifyEqualityAlerts(records);
      expect(alerts).toEqual([]);
    });

    it("returns empty for single well-formed record with future review", () => {
      const records = [
        makeRecord({
          assessment_type: "policy_review",
          compliance_level: "mostly_compliant",
          action_status: "completed",
          impact_on_child: false,
          review_date: daysFromNow(10),
        }),
      ];
      const alerts = identifyEqualityAlerts(records);
      expect(alerts).toEqual([]);
    });
  });

  describe("discrimination_incident alert", () => {
    it("fires for a discrimination_incident assessment_type", () => {
      const records = [makeRecord({ assessment_type: "discrimination_incident", assessment_date: "2026-05-01", protected_characteristic: "race" })];
      const alerts = identifyEqualityAlerts(records);
      const alert = alerts.find((a) => a.type === "discrimination_incident");
      expect(alert).toBeDefined();
    });

    it("has severity critical", () => {
      const records = [makeRecord({ assessment_type: "discrimination_incident", assessment_date: "2026-05-01", protected_characteristic: "race" })];
      const alerts = identifyEqualityAlerts(records);
      const alert = alerts.find((a) => a.type === "discrimination_incident")!;
      expect(alert.severity).toBe("critical");
    });

    it("uses the record id as alert id", () => {
      const records = [makeRecord({ id: "disc-1", assessment_type: "discrimination_incident", assessment_date: "2026-05-01", protected_characteristic: "race" })];
      const alerts = identifyEqualityAlerts(records);
      const alert = alerts.find((a) => a.type === "discrimination_incident")!;
      expect(alert.id).toBe("disc-1");
    });

    it("includes assessment_date in message", () => {
      const records = [makeRecord({ assessment_type: "discrimination_incident", assessment_date: "2026-04-15", protected_characteristic: "race" })];
      const alerts = identifyEqualityAlerts(records);
      const alert = alerts.find((a) => a.type === "discrimination_incident")!;
      expect(alert.message).toContain("2026-04-15");
    });

    it("includes protected_characteristic with underscores replaced in message", () => {
      const records = [makeRecord({ assessment_type: "discrimination_incident", assessment_date: "2026-05-01", protected_characteristic: "gender_reassignment" })];
      const alerts = identifyEqualityAlerts(records);
      const alert = alerts.find((a) => a.type === "discrimination_incident")!;
      expect(alert.message).toContain("gender reassignment");
    });

    it("replaces underscores for marriage_civil_partnership", () => {
      const records = [makeRecord({ assessment_type: "discrimination_incident", assessment_date: "2026-05-01", protected_characteristic: "marriage_civil_partnership" })];
      const alerts = identifyEqualityAlerts(records);
      const alert = alerts.find((a) => a.type === "discrimination_incident")!;
      expect(alert.message).toContain("marriage civil partnership");
    });

    it("replaces underscores for pregnancy_maternity", () => {
      const records = [makeRecord({ assessment_type: "discrimination_incident", assessment_date: "2026-05-01", protected_characteristic: "pregnancy_maternity" })];
      const alerts = identifyEqualityAlerts(records);
      const alert = alerts.find((a) => a.type === "discrimination_incident")!;
      expect(alert.message).toContain("pregnancy maternity");
    });

    it("replaces underscores for religion_belief", () => {
      const records = [makeRecord({ assessment_type: "discrimination_incident", assessment_date: "2026-05-01", protected_characteristic: "religion_belief" })];
      const alerts = identifyEqualityAlerts(records);
      const alert = alerts.find((a) => a.type === "discrimination_incident")!;
      expect(alert.message).toContain("religion belief");
    });

    it("replaces underscores for sexual_orientation", () => {
      const records = [makeRecord({ assessment_type: "discrimination_incident", assessment_date: "2026-05-01", protected_characteristic: "sexual_orientation" })];
      const alerts = identifyEqualityAlerts(records);
      const alert = alerts.find((a) => a.type === "discrimination_incident")!;
      expect(alert.message).toContain("sexual orientation");
    });

    it("replaces underscores for none_identified", () => {
      const records = [makeRecord({ assessment_type: "discrimination_incident", assessment_date: "2026-05-01", protected_characteristic: "none_identified" })];
      const alerts = identifyEqualityAlerts(records);
      const alert = alerts.find((a) => a.type === "discrimination_incident")!;
      expect(alert.message).toContain("none identified");
    });

    it("fires per record for multiple discrimination incidents", () => {
      const records = [
        makeRecord({ assessment_type: "discrimination_incident", assessment_date: "2026-05-01", protected_characteristic: "race" }),
        makeRecord({ assessment_type: "discrimination_incident", assessment_date: "2026-04-01", protected_characteristic: "disability" }),
        makeRecord({ assessment_type: "discrimination_incident", assessment_date: "2026-03-01", protected_characteristic: "sex" }),
      ];
      const alerts = identifyEqualityAlerts(records);
      const discAlerts = alerts.filter((a) => a.type === "discrimination_incident");
      expect(discAlerts).toHaveLength(3);
    });

    it("does not fire for equality_impact_assessment", () => {
      const records = [makeRecord({ assessment_type: "equality_impact_assessment" })];
      const alerts = identifyEqualityAlerts(records);
      const alert = alerts.find((a) => a.type === "discrimination_incident");
      expect(alert).toBeUndefined();
    });

    it("does not fire for human_rights_audit", () => {
      const records = [makeRecord({ assessment_type: "human_rights_audit" })];
      const alerts = identifyEqualityAlerts(records);
      const alert = alerts.find((a) => a.type === "discrimination_incident");
      expect(alert).toBeUndefined();
    });

    it("does not fire for policy_review", () => {
      const records = [makeRecord({ assessment_type: "policy_review" })];
      const alerts = identifyEqualityAlerts(records);
      const alert = alerts.find((a) => a.type === "discrimination_incident");
      expect(alert).toBeUndefined();
    });

    it("message contains investigate and take action wording", () => {
      const records = [makeRecord({ assessment_type: "discrimination_incident", assessment_date: "2026-05-01", protected_characteristic: "race" })];
      const alerts = identifyEqualityAlerts(records);
      const alert = alerts.find((a) => a.type === "discrimination_incident")!;
      expect(alert.message).toContain("investigate and take action");
    });
  });

  describe("non_compliant alert", () => {
    it("fires for non_compliant compliance_level", () => {
      const records = [makeRecord({ compliance_level: "non_compliant", assessment_type: "equality_impact_assessment", assessment_date: "2026-05-01" })];
      const alerts = identifyEqualityAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const records = [makeRecord({ compliance_level: "non_compliant", assessment_type: "equality_impact_assessment", assessment_date: "2026-05-01" })];
      const alerts = identifyEqualityAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant")!;
      expect(alert.severity).toBe("high");
    });

    it("uses the record id as alert id", () => {
      const records = [makeRecord({ id: "nc-1", compliance_level: "non_compliant", assessment_type: "equality_impact_assessment", assessment_date: "2026-05-01" })];
      const alerts = identifyEqualityAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant")!;
      expect(alert.id).toBe("nc-1");
    });

    it("includes assessment_date in message", () => {
      const records = [makeRecord({ compliance_level: "non_compliant", assessment_type: "equality_impact_assessment", assessment_date: "2026-03-20" })];
      const alerts = identifyEqualityAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant")!;
      expect(alert.message).toContain("2026-03-20");
    });

    it("replaces underscores with spaces in assessment_type in message", () => {
      const records = [makeRecord({ compliance_level: "non_compliant", assessment_type: "equality_impact_assessment", assessment_date: "2026-05-01" })];
      const alerts = identifyEqualityAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant")!;
      expect(alert.message).toContain("equality impact assessment");
    });

    it("replaces underscores for human_rights_audit", () => {
      const records = [makeRecord({ compliance_level: "non_compliant", assessment_type: "human_rights_audit", assessment_date: "2026-05-01" })];
      const alerts = identifyEqualityAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant")!;
      expect(alert.message).toContain("human rights audit");
    });

    it("replaces underscores for discrimination_incident", () => {
      const records = [makeRecord({ compliance_level: "non_compliant", assessment_type: "discrimination_incident", assessment_date: "2026-05-01" })];
      const alerts = identifyEqualityAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant")!;
      expect(alert.message).toContain("discrimination incident");
    });

    it("replaces underscores for reasonable_adjustment", () => {
      const records = [makeRecord({ compliance_level: "non_compliant", assessment_type: "reasonable_adjustment", assessment_date: "2026-05-01" })];
      const alerts = identifyEqualityAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant")!;
      expect(alert.message).toContain("reasonable adjustment");
    });

    it("replaces underscores for staff_training", () => {
      const records = [makeRecord({ compliance_level: "non_compliant", assessment_type: "staff_training", assessment_date: "2026-05-01" })];
      const alerts = identifyEqualityAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant")!;
      expect(alert.message).toContain("staff training");
    });

    it("replaces underscores for compliance_check", () => {
      const records = [makeRecord({ compliance_level: "non_compliant", assessment_type: "compliance_check", assessment_date: "2026-05-01" })];
      const alerts = identifyEqualityAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant")!;
      expect(alert.message).toContain("compliance check");
    });

    it("fires per record for multiple non_compliant records", () => {
      const records = [
        makeRecord({ compliance_level: "non_compliant", assessment_type: "equality_impact_assessment", assessment_date: "2026-05-01" }),
        makeRecord({ compliance_level: "non_compliant", assessment_type: "human_rights_audit", assessment_date: "2026-04-01" }),
      ];
      const alerts = identifyEqualityAlerts(records);
      const ncAlerts = alerts.filter((a) => a.type === "non_compliant");
      expect(ncAlerts).toHaveLength(2);
    });

    it("does not fire for fully_compliant", () => {
      const records = [makeRecord({ compliance_level: "fully_compliant" })];
      const alerts = identifyEqualityAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant");
      expect(alert).toBeUndefined();
    });

    it("does not fire for mostly_compliant", () => {
      const records = [makeRecord({ compliance_level: "mostly_compliant" })];
      const alerts = identifyEqualityAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant");
      expect(alert).toBeUndefined();
    });

    it("does not fire for partially_compliant", () => {
      const records = [makeRecord({ compliance_level: "partially_compliant" })];
      const alerts = identifyEqualityAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant");
      expect(alert).toBeUndefined();
    });

    it("does not fire for not_assessed", () => {
      const records = [makeRecord({ compliance_level: "not_assessed" })];
      const alerts = identifyEqualityAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant");
      expect(alert).toBeUndefined();
    });

    it("message contains remedial action required wording", () => {
      const records = [makeRecord({ compliance_level: "non_compliant", assessment_type: "equality_impact_assessment", assessment_date: "2026-05-01" })];
      const alerts = identifyEqualityAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant")!;
      expect(alert.message).toContain("remedial action required");
    });
  });

  describe("actions_overdue alert", () => {
    it("fires when >= 1 action is overdue", () => {
      const records = [makeRecord({ action_status: "overdue" })];
      const alerts = identifyEqualityAlerts(records);
      const alert = alerts.find((a) => a.type === "actions_overdue");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const records = [makeRecord({ action_status: "overdue" })];
      const alerts = identifyEqualityAlerts(records);
      const alert = alerts.find((a) => a.type === "actions_overdue")!;
      expect(alert.severity).toBe("high");
    });

    it("has id actions_overdue", () => {
      const records = [makeRecord({ action_status: "overdue" })];
      const alerts = identifyEqualityAlerts(records);
      const alert = alerts.find((a) => a.type === "actions_overdue")!;
      expect(alert.id).toBe("actions_overdue");
    });

    it("uses singular 'action is' for 1 overdue", () => {
      const records = [makeRecord({ action_status: "overdue" })];
      const alerts = identifyEqualityAlerts(records);
      const alert = alerts.find((a) => a.type === "actions_overdue")!;
      expect(alert.message).toContain("1 equality action is overdue");
    });

    it("uses plural 'actions are' for multiple overdue", () => {
      const records = [
        makeRecord({ action_status: "overdue" }),
        makeRecord({ action_status: "overdue" }),
        makeRecord({ action_status: "overdue" }),
      ];
      const alerts = identifyEqualityAlerts(records);
      const alert = alerts.find((a) => a.type === "actions_overdue")!;
      expect(alert.message).toContain("3 equality actions are overdue");
    });

    it("does not fire when no actions are overdue", () => {
      const records = [
        makeRecord({ action_status: "completed" }),
        makeRecord({ action_status: "in_progress" }),
        makeRecord({ action_status: "planned" }),
      ];
      const alerts = identifyEqualityAlerts(records);
      const alert = alerts.find((a) => a.type === "actions_overdue");
      expect(alert).toBeUndefined();
    });

    it("fires as a single aggregate alert, not per record", () => {
      const records = [
        makeRecord({ action_status: "overdue" }),
        makeRecord({ action_status: "overdue" }),
      ];
      const alerts = identifyEqualityAlerts(records);
      const overdueAlerts = alerts.filter((a) => a.type === "actions_overdue");
      expect(overdueAlerts).toHaveLength(1);
    });

    it("message contains complete promptly wording", () => {
      const records = [makeRecord({ action_status: "overdue" })];
      const alerts = identifyEqualityAlerts(records);
      const alert = alerts.find((a) => a.type === "actions_overdue")!;
      expect(alert.message).toContain("complete promptly");
    });

    it("includes count in message", () => {
      const records = [
        makeRecord({ action_status: "overdue" }),
        makeRecord({ action_status: "overdue" }),
      ];
      const alerts = identifyEqualityAlerts(records);
      const alert = alerts.find((a) => a.type === "actions_overdue")!;
      expect(alert.message).toContain("2");
    });

    it("counts only overdue actions, not completed or planned", () => {
      const records = [
        makeRecord({ action_status: "overdue" }),
        makeRecord({ action_status: "completed" }),
        makeRecord({ action_status: "planned" }),
        makeRecord({ action_status: "overdue" }),
      ];
      const alerts = identifyEqualityAlerts(records);
      const alert = alerts.find((a) => a.type === "actions_overdue")!;
      expect(alert.message).toContain("2 equality actions are overdue");
    });
  });

  describe("child_impact_no_adjustment alert", () => {
    it("fires when impact_on_child and no adjustment and not completed", () => {
      const records = [makeRecord({ impact_on_child: true, reasonable_adjustment_made: false, action_status: "in_progress", assessment_type: "equality_impact_assessment", assessment_date: "2026-05-01" })];
      const alerts = identifyEqualityAlerts(records);
      const alert = alerts.find((a) => a.type === "child_impact_no_adjustment");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const records = [makeRecord({ impact_on_child: true, reasonable_adjustment_made: false, action_status: "in_progress", assessment_type: "equality_impact_assessment", assessment_date: "2026-05-01" })];
      const alerts = identifyEqualityAlerts(records);
      const alert = alerts.find((a) => a.type === "child_impact_no_adjustment")!;
      expect(alert.severity).toBe("medium");
    });

    it("uses the record id as alert id", () => {
      const records = [makeRecord({ id: "ci-1", impact_on_child: true, reasonable_adjustment_made: false, action_status: "overdue", assessment_type: "equality_impact_assessment", assessment_date: "2026-05-01" })];
      const alerts = identifyEqualityAlerts(records);
      const alert = alerts.find((a) => a.type === "child_impact_no_adjustment")!;
      expect(alert.id).toBe("ci-1");
    });

    it("includes assessment_date in message", () => {
      const records = [makeRecord({ impact_on_child: true, reasonable_adjustment_made: false, action_status: "planned", assessment_type: "equality_impact_assessment", assessment_date: "2026-04-20" })];
      const alerts = identifyEqualityAlerts(records);
      const alert = alerts.find((a) => a.type === "child_impact_no_adjustment")!;
      expect(alert.message).toContain("2026-04-20");
    });

    it("replaces underscores in assessment_type in message", () => {
      const records = [makeRecord({ impact_on_child: true, reasonable_adjustment_made: false, action_status: "in_progress", assessment_type: "equality_impact_assessment", assessment_date: "2026-05-01" })];
      const alerts = identifyEqualityAlerts(records);
      const alert = alerts.find((a) => a.type === "child_impact_no_adjustment")!;
      expect(alert.message).toContain("equality impact assessment");
    });

    it("replaces underscores for human_rights_audit", () => {
      const records = [makeRecord({ impact_on_child: true, reasonable_adjustment_made: false, action_status: "planned", assessment_type: "human_rights_audit", assessment_date: "2026-05-01" })];
      const alerts = identifyEqualityAlerts(records);
      const alert = alerts.find((a) => a.type === "child_impact_no_adjustment")!;
      expect(alert.message).toContain("human rights audit");
    });

    it("replaces underscores for child_consultation", () => {
      const records = [makeRecord({ impact_on_child: true, reasonable_adjustment_made: false, action_status: "overdue", assessment_type: "child_consultation", assessment_date: "2026-05-01" })];
      const alerts = identifyEqualityAlerts(records);
      const alert = alerts.find((a) => a.type === "child_impact_no_adjustment")!;
      expect(alert.message).toContain("child consultation");
    });

    it("does not fire when impact_on_child is false", () => {
      const records = [makeRecord({ impact_on_child: false, reasonable_adjustment_made: false, action_status: "in_progress" })];
      const alerts = identifyEqualityAlerts(records);
      const alert = alerts.find((a) => a.type === "child_impact_no_adjustment");
      expect(alert).toBeUndefined();
    });

    it("does not fire when reasonable_adjustment_made is true", () => {
      const records = [makeRecord({ impact_on_child: true, reasonable_adjustment_made: true, action_status: "in_progress" })];
      const alerts = identifyEqualityAlerts(records);
      const alert = alerts.find((a) => a.type === "child_impact_no_adjustment");
      expect(alert).toBeUndefined();
    });

    it("does not fire when action_status is completed", () => {
      const records = [makeRecord({ impact_on_child: true, reasonable_adjustment_made: false, action_status: "completed" })];
      const alerts = identifyEqualityAlerts(records);
      const alert = alerts.find((a) => a.type === "child_impact_no_adjustment");
      expect(alert).toBeUndefined();
    });

    it("fires for overdue action_status", () => {
      const records = [makeRecord({ impact_on_child: true, reasonable_adjustment_made: false, action_status: "overdue", assessment_type: "policy_review", assessment_date: "2026-05-01" })];
      const alerts = identifyEqualityAlerts(records);
      const alert = alerts.find((a) => a.type === "child_impact_no_adjustment");
      expect(alert).toBeDefined();
    });

    it("fires for planned action_status", () => {
      const records = [makeRecord({ impact_on_child: true, reasonable_adjustment_made: false, action_status: "planned", assessment_type: "policy_review", assessment_date: "2026-05-01" })];
      const alerts = identifyEqualityAlerts(records);
      const alert = alerts.find((a) => a.type === "child_impact_no_adjustment");
      expect(alert).toBeDefined();
    });

    it("fires for not_required action_status", () => {
      const records = [makeRecord({ impact_on_child: true, reasonable_adjustment_made: false, action_status: "not_required", assessment_type: "policy_review", assessment_date: "2026-05-01" })];
      const alerts = identifyEqualityAlerts(records);
      const alert = alerts.find((a) => a.type === "child_impact_no_adjustment");
      expect(alert).toBeDefined();
    });

    it("fires per record for multiple matching records", () => {
      const records = [
        makeRecord({ impact_on_child: true, reasonable_adjustment_made: false, action_status: "in_progress", assessment_type: "equality_impact_assessment", assessment_date: "2026-05-01" }),
        makeRecord({ impact_on_child: true, reasonable_adjustment_made: false, action_status: "overdue", assessment_type: "human_rights_audit", assessment_date: "2026-04-01" }),
      ];
      const alerts = identifyEqualityAlerts(records);
      const ciAlerts = alerts.filter((a) => a.type === "child_impact_no_adjustment");
      expect(ciAlerts).toHaveLength(2);
    });

    it("message contains without reasonable adjustment wording", () => {
      const records = [makeRecord({ impact_on_child: true, reasonable_adjustment_made: false, action_status: "in_progress", assessment_type: "equality_impact_assessment", assessment_date: "2026-05-01" })];
      const alerts = identifyEqualityAlerts(records);
      const alert = alerts.find((a) => a.type === "child_impact_no_adjustment")!;
      expect(alert.message).toContain("without reasonable adjustment");
    });
  });

  describe("review_overdue alert", () => {
    it("fires when >= 1 review is overdue", () => {
      const records = [makeRecord({ review_date: daysAgo(5) })];
      const alerts = identifyEqualityAlerts(records);
      const alert = alerts.find((a) => a.type === "review_overdue");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const records = [makeRecord({ review_date: daysAgo(5) })];
      const alerts = identifyEqualityAlerts(records);
      const alert = alerts.find((a) => a.type === "review_overdue")!;
      expect(alert.severity).toBe("medium");
    });

    it("has id review_overdue", () => {
      const records = [makeRecord({ review_date: daysAgo(5) })];
      const alerts = identifyEqualityAlerts(records);
      const alert = alerts.find((a) => a.type === "review_overdue")!;
      expect(alert.id).toBe("review_overdue");
    });

    it("uses singular 'review is' for 1 overdue", () => {
      const records = [makeRecord({ review_date: daysAgo(5) })];
      const alerts = identifyEqualityAlerts(records);
      const alert = alerts.find((a) => a.type === "review_overdue")!;
      expect(alert.message).toContain("1 equality review is overdue");
    });

    it("uses plural 'reviews are' for multiple overdue", () => {
      const records = [
        makeRecord({ review_date: daysAgo(5) }),
        makeRecord({ review_date: daysAgo(10) }),
        makeRecord({ review_date: daysAgo(15) }),
      ];
      const alerts = identifyEqualityAlerts(records);
      const alert = alerts.find((a) => a.type === "review_overdue")!;
      expect(alert.message).toContain("3 equality reviews are overdue");
    });

    it("does not fire when all reviews are in the future", () => {
      const records = [
        makeRecord({ review_date: daysFromNow(10) }),
        makeRecord({ review_date: daysFromNow(20) }),
      ];
      const alerts = identifyEqualityAlerts(records);
      const alert = alerts.find((a) => a.type === "review_overdue");
      expect(alert).toBeUndefined();
    });

    it("does not fire when all review_date are null", () => {
      const records = [
        makeRecord({ review_date: null }),
        makeRecord({ review_date: null }),
      ];
      const alerts = identifyEqualityAlerts(records);
      const alert = alerts.find((a) => a.type === "review_overdue");
      expect(alert).toBeUndefined();
    });

    it("fires as a single aggregate alert, not per record", () => {
      const records = [
        makeRecord({ review_date: daysAgo(5) }),
        makeRecord({ review_date: daysAgo(10) }),
      ];
      const alerts = identifyEqualityAlerts(records);
      const reviewAlerts = alerts.filter((a) => a.type === "review_overdue");
      expect(reviewAlerts).toHaveLength(1);
    });

    it("message contains schedule promptly wording", () => {
      const records = [makeRecord({ review_date: daysAgo(5) })];
      const alerts = identifyEqualityAlerts(records);
      const alert = alerts.find((a) => a.type === "review_overdue")!;
      expect(alert.message).toContain("schedule promptly");
    });

    it("counts only overdue reviews, not future or null", () => {
      const records = [
        makeRecord({ review_date: daysAgo(5) }),
        makeRecord({ review_date: daysFromNow(10) }),
        makeRecord({ review_date: null }),
        makeRecord({ review_date: daysAgo(15) }),
      ];
      const alerts = identifyEqualityAlerts(records);
      const alert = alerts.find((a) => a.type === "review_overdue")!;
      expect(alert.message).toContain("2 equality reviews are overdue");
    });
  });

  describe("combined alerts", () => {
    it("can fire all five alert types simultaneously", () => {
      const records = [
        makeRecord({ id: "r1", assessment_type: "discrimination_incident", assessment_date: "2026-05-01", protected_characteristic: "race", compliance_level: "non_compliant", action_status: "overdue", impact_on_child: true, reasonable_adjustment_made: false, review_date: daysAgo(5) }),
      ];
      const alerts = identifyEqualityAlerts(records);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("discrimination_incident");
      expect(types).toContain("non_compliant");
      expect(types).toContain("actions_overdue");
      expect(types).toContain("child_impact_no_adjustment");
      expect(types).toContain("review_overdue");
    });

    it("returns correct total number of alerts for combined scenario", () => {
      const records = [
        makeRecord({ assessment_type: "discrimination_incident", assessment_date: "2026-05-01", protected_characteristic: "race", compliance_level: "non_compliant", action_status: "overdue", impact_on_child: true, reasonable_adjustment_made: false, review_date: daysAgo(5) }),
      ];
      const alerts = identifyEqualityAlerts(records);
      // discrimination_incident=1, non_compliant=1, actions_overdue=1, child_impact_no_adjustment=1, review_overdue=1
      expect(alerts).toHaveLength(5);
    });

    it("per-record alerts multiply while threshold alerts stay singular", () => {
      const records = [
        makeRecord({ assessment_type: "discrimination_incident", assessment_date: "2026-05-01", protected_characteristic: "race", compliance_level: "non_compliant", action_status: "overdue", impact_on_child: true, reasonable_adjustment_made: false, review_date: daysAgo(5) }),
        makeRecord({ assessment_type: "discrimination_incident", assessment_date: "2026-04-01", protected_characteristic: "disability", compliance_level: "non_compliant", action_status: "overdue", impact_on_child: true, reasonable_adjustment_made: false, review_date: daysAgo(10) }),
      ];
      const alerts = identifyEqualityAlerts(records);
      expect(alerts.filter((a) => a.type === "discrimination_incident")).toHaveLength(2);
      expect(alerts.filter((a) => a.type === "non_compliant")).toHaveLength(2);
      expect(alerts.filter((a) => a.type === "child_impact_no_adjustment")).toHaveLength(2);
      expect(alerts.filter((a) => a.type === "actions_overdue")).toHaveLength(1);
      expect(alerts.filter((a) => a.type === "review_overdue")).toHaveLength(1);
    });
  });

  describe("alert structure", () => {
    it("every alert has type, severity, message, and id fields", () => {
      const records = [
        makeRecord({ assessment_type: "discrimination_incident", assessment_date: "2026-05-01", protected_characteristic: "race" }),
      ];
      const alerts = identifyEqualityAlerts(records);
      for (const alert of alerts) {
        expect(alert).toHaveProperty("type");
        expect(alert).toHaveProperty("severity");
        expect(alert).toHaveProperty("message");
        expect(alert).toHaveProperty("id");
      }
    });

    it("severity is always one of critical, high, or medium", () => {
      const records = [
        makeRecord({ assessment_type: "discrimination_incident", assessment_date: "2026-05-01", protected_characteristic: "race", compliance_level: "non_compliant", action_status: "overdue", impact_on_child: true, reasonable_adjustment_made: false, review_date: daysAgo(5) }),
      ];
      const alerts = identifyEqualityAlerts(records);
      for (const alert of alerts) {
        expect(["critical", "high", "medium"]).toContain(alert.severity);
      }
    });

    it("message is always a non-empty string", () => {
      const records = [makeRecord({ assessment_type: "discrimination_incident", assessment_date: "2026-05-01", protected_characteristic: "race" })];
      const alerts = identifyEqualityAlerts(records);
      for (const alert of alerts) {
        expect(typeof alert.message).toBe("string");
        expect(alert.message.length).toBeGreaterThan(0);
      }
    });
  });

  describe("edge cases", () => {
    it("child impact with adjustment does not trigger child_impact_no_adjustment", () => {
      const records = [makeRecord({ impact_on_child: true, reasonable_adjustment_made: true, action_status: "in_progress" })];
      const alerts = identifyEqualityAlerts(records);
      const alert = alerts.find((a) => a.type === "child_impact_no_adjustment");
      expect(alert).toBeUndefined();
    });

    it("child impact with completed status does not trigger child_impact_no_adjustment", () => {
      const records = [makeRecord({ impact_on_child: true, reasonable_adjustment_made: false, action_status: "completed" })];
      const alerts = identifyEqualityAlerts(records);
      const alert = alerts.find((a) => a.type === "child_impact_no_adjustment");
      expect(alert).toBeUndefined();
    });

    it("fully compliant records trigger no alerts", () => {
      const records = [
        makeRecord({
          assessment_type: "equality_impact_assessment",
          compliance_level: "fully_compliant",
          action_status: "completed",
          impact_on_child: false,
          reasonable_adjustment_made: true,
          review_date: daysFromNow(30),
        }),
      ];
      const alerts = identifyEqualityAlerts(records);
      expect(alerts).toHaveLength(0);
    });

    it("multiple assessment types in assessment_type get underscores replaced properly in non_compliant alert", () => {
      const types: AssessmentType[] = ["equality_impact_assessment", "human_rights_audit", "discrimination_incident", "reasonable_adjustment", "policy_review", "staff_training", "child_consultation", "compliance_check"];
      for (const t of types) {
        const records = [makeRecord({ compliance_level: "non_compliant", assessment_type: t, assessment_date: "2026-05-01" })];
        const alerts = identifyEqualityAlerts(records);
        const alert = alerts.find((a) => a.type === "non_compliant")!;
        expect(alert.message).toContain(t.replace(/_/g, " "));
      }
    });
  });
});

// ── Factory helper validation ────────────────────────────────────────────

describe("makeRecord factory helper", () => {
  it("creates a record with sensible defaults", () => {
    const r = makeRecord();
    expect(r.home_id).toBe("home-1");
    expect(r.assessment_type).toBe("equality_impact_assessment");
    expect(r.assessment_date).toBe("2026-05-01");
    expect(r.protected_characteristic).toBe("none_identified");
    expect(r.compliance_level).toBe("fully_compliant");
    expect(r.action_status).toBe("completed");
    expect(r.assessed_by).toBe("Manager");
    expect(r.child_involved).toBeNull();
    expect(r.staff_involved).toBeNull();
    expect(r.description).toBe("Test record");
    expect(r.findings).toBeNull();
    expect(r.actions_required).toEqual([]);
    expect(r.actions_completed).toEqual([]);
    expect(r.reasonable_adjustment_made).toBe(false);
    expect(r.human_rights_article).toBeNull();
    expect(r.discrimination_type).toBeNull();
    expect(r.impact_on_child).toBe(false);
    expect(r.review_date).toBeNull();
    expect(r.notes).toBeNull();
  });

  it("allows overriding individual fields", () => {
    const r = makeRecord({ assessment_type: "discrimination_incident", compliance_level: "non_compliant" });
    expect(r.assessment_type).toBe("discrimination_incident");
    expect(r.compliance_level).toBe("non_compliant");
    // defaults still apply
    expect(r.protected_characteristic).toBe("none_identified");
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
    const r = makeRecord({ child_involved: null, staff_involved: null, findings: null, human_rights_article: null, discrimination_type: null, review_date: null, notes: null });
    expect(r.child_involved).toBeNull();
    expect(r.staff_involved).toBeNull();
    expect(r.findings).toBeNull();
    expect(r.human_rights_article).toBeNull();
    expect(r.discrimination_type).toBeNull();
    expect(r.review_date).toBeNull();
    expect(r.notes).toBeNull();
  });

  it("allows setting child_involved to a string", () => {
    const r = makeRecord({ child_involved: "Child A" });
    expect(r.child_involved).toBe("Child A");
  });

  it("allows setting staff_involved to a string", () => {
    const r = makeRecord({ staff_involved: "Staff B" });
    expect(r.staff_involved).toBe("Staff B");
  });

  it("allows setting notes to a string", () => {
    const r = makeRecord({ notes: "Test note" });
    expect(r.notes).toBe("Test note");
  });

  it("allows setting review_date to a date string", () => {
    const r = makeRecord({ review_date: "2026-12-31" });
    expect(r.review_date).toBe("2026-12-31");
  });
});
