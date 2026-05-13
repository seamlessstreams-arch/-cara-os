// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — RESTRAINT SERVICE TESTS
// Pure-function tests for restraint analysis computation, alert identification,
// and exported constants (types, techniques, de-escalation strategies, body
// locations). Covers Reg 19/20/35 compliance metrics and pattern detection.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  _testing,
  RESTRAINT_TYPES,
  APPROVED_TECHNIQUES,
  DE_ESCALATION_STRATEGIES,
  BODY_LOCATIONS,
} from "../restraint-service";
import type {
  RestraintRecord,
  StaffInvolved,
  InjuryRecord,
} from "../restraint-service";

const {
  computeRestraintAnalysis,
  identifyRestraintAlerts,
} = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

function makeStaffInvolved(
  overrides: Partial<StaffInvolved> = {},
): StaffInvolved {
  return {
    staff_name: "staff_name" in overrides ? overrides.staff_name! : "Jane Smith",
    role_in_incident: "role_in_incident" in overrides ? overrides.role_in_incident! : "Lead",
    trained: "trained" in overrides ? overrides.trained! : true,
  };
}

function makeInjuryRecord(
  overrides: Partial<InjuryRecord> = {},
): InjuryRecord {
  return {
    person_name: "person_name" in overrides ? overrides.person_name! : "Test Person",
    description: "description" in overrides ? overrides.description! : "Minor bruise",
    body_location: "body_location" in overrides ? overrides.body_location! : "left_arm",
    severity: "severity" in overrides ? overrides.severity! : "minor",
    treatment_given: "treatment_given" in overrides ? overrides.treatment_given! : "Ice pack applied",
    medical_attention_sought: "medical_attention_sought" in overrides ? overrides.medical_attention_sought! : false,
  };
}

function makeRestraintRecord(
  overrides: Partial<RestraintRecord> = {},
): RestraintRecord {
  return {
    id: "id" in overrides ? overrides.id! : "rr-1",
    home_id: "home_id" in overrides ? overrides.home_id! : "home-1",
    child_id: "child_id" in overrides ? overrides.child_id! : "child-1",
    child_name: "child_name" in overrides ? overrides.child_name! : "Alex Johnson",
    incident_date: "incident_date" in overrides ? overrides.incident_date! : "2026-04-15",
    incident_time: "incident_time" in overrides ? overrides.incident_time! : "14:30",
    restraint_type: "restraint_type" in overrides ? overrides.restraint_type! : "physical",
    technique_used: "technique_used" in overrides ? overrides.technique_used! : "Team-Teach",
    duration_minutes: "duration_minutes" in overrides ? overrides.duration_minutes! : 5,
    staff_involved: "staff_involved" in overrides ? overrides.staff_involved! : [makeStaffInvolved()],
    antecedent: "antecedent" in overrides ? overrides.antecedent! : "Escalating behaviour",
    behaviour_description: "behaviour_description" in overrides ? overrides.behaviour_description! : "Physical aggression towards staff",
    de_escalation_attempted: "de_escalation_attempted" in overrides ? overrides.de_escalation_attempted! : ["Verbal de-escalation"],
    outcome: "outcome" in overrides ? overrides.outcome! : "Child calmed after intervention",
    injuries_child: "injuries_child" in overrides ? overrides.injuries_child! : [],
    injuries_staff: "injuries_staff" in overrides ? overrides.injuries_staff! : [],
    body_map_completed: "body_map_completed" in overrides ? overrides.body_map_completed! : true,
    child_views_obtained: "child_views_obtained" in overrides ? overrides.child_views_obtained! : true,
    child_views: "child_views" in overrides ? overrides.child_views! : "Child expressed frustration",
    debrief_completed: "debrief_completed" in overrides ? overrides.debrief_completed! : true,
    debrief_date: "debrief_date" in overrides ? overrides.debrief_date! : "2026-04-15",
    debrief_notes: "debrief_notes" in overrides ? overrides.debrief_notes! : "Discussed triggers",
    manager_reviewed: "manager_reviewed" in overrides ? overrides.manager_reviewed! : true,
    manager_review_date: "manager_review_date" in overrides ? overrides.manager_review_date! : "2026-04-16",
    manager_review_notes: "manager_review_notes" in overrides ? overrides.manager_review_notes! : "Appropriate use",
    ofsted_notified: "ofsted_notified" in overrides ? overrides.ofsted_notified! : true,
    parent_carer_notified: "parent_carer_notified" in overrides ? overrides.parent_carer_notified! : true,
    social_worker_notified: "social_worker_notified" in overrides ? overrides.social_worker_notified! : true,
    created_by: "created_by" in overrides ? overrides.created_by! : "staff-1",
    created_at: "created_at" in overrides ? overrides.created_at! : "2026-04-15T14:30:00Z",
    updated_at: "updated_at" in overrides ? overrides.updated_at! : "2026-04-15T14:30:00Z",
  };
}

const DATE_FROM = "2026-04-01";
const DATE_TO = "2026-04-30";

// ── computeRestraintAnalysis ───────────────────────────────────────────────

describe("computeRestraintAnalysis", () => {
  it("returns zeroed analysis for empty records", () => {
    const result = computeRestraintAnalysis([], DATE_FROM, DATE_TO);
    expect(result.total_incidents).toBe(0);
    expect(result.by_type).toEqual({});
    expect(result.by_child).toEqual({});
    expect(result.avg_duration_minutes).toBe(0);
    expect(result.with_injuries).toBe(0);
    expect(result.injury_rate).toBe(0);
    expect(result.de_escalation_success_rate).toBe(0);
    expect(result.debrief_completion_rate).toBe(0);
    expect(result.manager_review_rate).toBe(0);
    expect(result.child_views_rate).toBe(0);
    expect(result.body_map_rate).toBe(0);
    expect(result.notification_compliance).toBe(0);
  });

  it("aggregates a single record correctly", () => {
    const record = makeRestraintRecord({
      restraint_type: "holding",
      child_id: "child-A",
      child_name: "Alex A",
      duration_minutes: 8,
    });

    const result = computeRestraintAnalysis([record], DATE_FROM, DATE_TO);
    expect(result.total_incidents).toBe(1);
    expect(result.by_type).toEqual({ holding: 1 });
    expect(result.by_child).toEqual({ "child-A": { name: "Alex A", count: 1 } });
    expect(result.avg_duration_minutes).toBe(8);
  });

  it("aggregates multiple records by restraint_type", () => {
    const records = [
      makeRestraintRecord({ id: "rr-1", restraint_type: "physical" }),
      makeRestraintRecord({ id: "rr-2", restraint_type: "physical" }),
      makeRestraintRecord({ id: "rr-3", restraint_type: "holding" }),
      makeRestraintRecord({ id: "rr-4", restraint_type: "guided_away" }),
    ];

    const result = computeRestraintAnalysis(records, DATE_FROM, DATE_TO);
    expect(result.total_incidents).toBe(4);
    expect(result.by_type).toEqual({ physical: 2, holding: 1, guided_away: 1 });
  });

  it("aggregates by_child with name and count", () => {
    const records = [
      makeRestraintRecord({ id: "rr-1", child_id: "c-A", child_name: "Alex" }),
      makeRestraintRecord({ id: "rr-2", child_id: "c-A", child_name: "Alex" }),
      makeRestraintRecord({ id: "rr-3", child_id: "c-B", child_name: "Beth" }),
    ];

    const result = computeRestraintAnalysis(records, DATE_FROM, DATE_TO);
    expect(result.by_child).toEqual({
      "c-A": { name: "Alex", count: 2 },
      "c-B": { name: "Beth", count: 1 },
    });
  });

  it("computes avg_duration_minutes rounded to 1dp", () => {
    const records = [
      makeRestraintRecord({ id: "rr-1", duration_minutes: 7 }),
      makeRestraintRecord({ id: "rr-2", duration_minutes: 4 }),
      makeRestraintRecord({ id: "rr-3", duration_minutes: 10 }),
    ];

    const result = computeRestraintAnalysis(records, DATE_FROM, DATE_TO);
    // (7 + 4 + 10) / 3 = 7.0
    expect(result.avg_duration_minutes).toBe(7);
  });

  it("rounds avg_duration_minutes correctly for non-integer averages", () => {
    const records = [
      makeRestraintRecord({ id: "rr-1", duration_minutes: 3 }),
      makeRestraintRecord({ id: "rr-2", duration_minutes: 7 }),
    ];

    const result = computeRestraintAnalysis(records, DATE_FROM, DATE_TO);
    // (3 + 7) / 2 = 5.0
    expect(result.avg_duration_minutes).toBe(5);
  });

  it("counts with_injuries when child or staff injuries present", () => {
    const records = [
      makeRestraintRecord({
        id: "rr-1",
        injuries_child: [makeInjuryRecord({ severity: "minor" })],
      }),
      makeRestraintRecord({
        id: "rr-2",
        injuries_staff: [makeInjuryRecord({ severity: "moderate" })],
      }),
      makeRestraintRecord({ id: "rr-3" }), // no injuries
    ];

    const result = computeRestraintAnalysis(records, DATE_FROM, DATE_TO);
    expect(result.with_injuries).toBe(2);
    expect(result.injury_rate).toBe(67); // Math.round(2/3 * 100) = 67
  });

  it("computes injury_rate as zero when no injuries", () => {
    const records = [
      makeRestraintRecord({ id: "rr-1" }),
      makeRestraintRecord({ id: "rr-2" }),
    ];

    const result = computeRestraintAnalysis(records, DATE_FROM, DATE_TO);
    expect(result.with_injuries).toBe(0);
    expect(result.injury_rate).toBe(0);
  });

  it("computes de_escalation_success_rate based on non-empty arrays", () => {
    const records = [
      makeRestraintRecord({ id: "rr-1", de_escalation_attempted: ["Verbal de-escalation", "Distraction"] }),
      makeRestraintRecord({ id: "rr-2", de_escalation_attempted: [] }),
      makeRestraintRecord({ id: "rr-3", de_escalation_attempted: ["Giving space / time out"] }),
      makeRestraintRecord({ id: "rr-4", de_escalation_attempted: [] }),
    ];

    const result = computeRestraintAnalysis(records, DATE_FROM, DATE_TO);
    // 2 out of 4 = 50%
    expect(result.de_escalation_success_rate).toBe(50);
  });

  it("computes debrief_completion_rate as percentage", () => {
    const records = [
      makeRestraintRecord({ id: "rr-1", debrief_completed: true }),
      makeRestraintRecord({ id: "rr-2", debrief_completed: true }),
      makeRestraintRecord({ id: "rr-3", debrief_completed: false }),
    ];

    const result = computeRestraintAnalysis(records, DATE_FROM, DATE_TO);
    // Math.round(2/3 * 100) = 67
    expect(result.debrief_completion_rate).toBe(67);
  });

  it("computes manager_review_rate as percentage", () => {
    const records = [
      makeRestraintRecord({ id: "rr-1", manager_reviewed: true }),
      makeRestraintRecord({ id: "rr-2", manager_reviewed: false }),
    ];

    const result = computeRestraintAnalysis(records, DATE_FROM, DATE_TO);
    expect(result.manager_review_rate).toBe(50);
  });

  it("computes child_views_rate as percentage", () => {
    const records = [
      makeRestraintRecord({ id: "rr-1", child_views_obtained: true }),
      makeRestraintRecord({ id: "rr-2", child_views_obtained: true }),
      makeRestraintRecord({ id: "rr-3", child_views_obtained: true }),
      makeRestraintRecord({ id: "rr-4", child_views_obtained: false }),
    ];

    const result = computeRestraintAnalysis(records, DATE_FROM, DATE_TO);
    expect(result.child_views_rate).toBe(75);
  });

  it("computes body_map_rate as percentage", () => {
    const records = [
      makeRestraintRecord({ id: "rr-1", body_map_completed: true }),
      makeRestraintRecord({ id: "rr-2", body_map_completed: false }),
      makeRestraintRecord({ id: "rr-3", body_map_completed: false }),
      makeRestraintRecord({ id: "rr-4", body_map_completed: false }),
    ];

    const result = computeRestraintAnalysis(records, DATE_FROM, DATE_TO);
    expect(result.body_map_rate).toBe(25);
  });

  it("computes notification_compliance requiring all three parties", () => {
    const records = [
      makeRestraintRecord({
        id: "rr-1",
        ofsted_notified: true,
        parent_carer_notified: true,
        social_worker_notified: true,
      }),
      makeRestraintRecord({
        id: "rr-2",
        ofsted_notified: true,
        parent_carer_notified: true,
        social_worker_notified: false, // one missing
      }),
    ];

    const result = computeRestraintAnalysis(records, DATE_FROM, DATE_TO);
    expect(result.notification_compliance).toBe(50);
  });

  // ── Date filtering ──

  it("filters records by dateFrom and dateTo inclusively", () => {
    const records = [
      makeRestraintRecord({ id: "rr-before", incident_date: "2026-03-31" }),
      makeRestraintRecord({ id: "rr-start", incident_date: "2026-04-01" }),
      makeRestraintRecord({ id: "rr-mid", incident_date: "2026-04-15" }),
      makeRestraintRecord({ id: "rr-end", incident_date: "2026-04-30" }),
      makeRestraintRecord({ id: "rr-after", incident_date: "2026-05-01" }),
    ];

    const result = computeRestraintAnalysis(records, DATE_FROM, DATE_TO);
    expect(result.total_incidents).toBe(3);
  });

  it("returns zeroed analysis when all records fall outside the date range", () => {
    const records = [
      makeRestraintRecord({ id: "rr-1", incident_date: "2025-01-01" }),
      makeRestraintRecord({ id: "rr-2", incident_date: "2027-12-31" }),
    ];

    const result = computeRestraintAnalysis(records, DATE_FROM, DATE_TO);
    expect(result.total_incidents).toBe(0);
    expect(result.by_type).toEqual({});
    expect(result.avg_duration_minutes).toBe(0);
  });

  it("includes records on the exact boundary dates", () => {
    const records = [
      makeRestraintRecord({ id: "rr-1", incident_date: "2026-04-01" }),
      makeRestraintRecord({ id: "rr-2", incident_date: "2026-04-30" }),
    ];

    const result = computeRestraintAnalysis(records, DATE_FROM, DATE_TO);
    expect(result.total_incidents).toBe(2);
  });

  it("returns 100% rates when all compliance booleans are true", () => {
    const records = [
      makeRestraintRecord({
        id: "rr-1",
        debrief_completed: true,
        manager_reviewed: true,
        child_views_obtained: true,
        body_map_completed: true,
        ofsted_notified: true,
        parent_carer_notified: true,
        social_worker_notified: true,
      }),
    ];

    const result = computeRestraintAnalysis(records, DATE_FROM, DATE_TO);
    expect(result.debrief_completion_rate).toBe(100);
    expect(result.manager_review_rate).toBe(100);
    expect(result.child_views_rate).toBe(100);
    expect(result.body_map_rate).toBe(100);
    expect(result.notification_compliance).toBe(100);
  });
});

// ── identifyRestraintAlerts ────────────────────────────────────────────────

describe("identifyRestraintAlerts", () => {
  it("returns empty alerts for empty records", () => {
    const result = identifyRestraintAlerts([]);
    expect(result).toEqual([]);
  });

  it("returns no alerts for a fully compliant record with no injuries", () => {
    const record = makeRestraintRecord();
    const result = identifyRestraintAlerts([record]);
    expect(result).toEqual([]);
  });

  // ── serious_injury ──

  it("raises critical alert for serious child injury", () => {
    const record = makeRestraintRecord({
      injuries_child: [makeInjuryRecord({ severity: "serious" })],
    });

    const result = identifyRestraintAlerts([record]);
    const seriousAlerts = result.filter((a) => a.type === "serious_injury");
    expect(seriousAlerts).toHaveLength(1);
    expect(seriousAlerts[0].severity).toBe("critical");
    expect(seriousAlerts[0].message).toContain("Alex Johnson");
    expect(seriousAlerts[0].message).toContain("2026-04-15");
  });

  it("raises critical alert for serious staff injury", () => {
    const record = makeRestraintRecord({
      injuries_staff: [makeInjuryRecord({ severity: "serious" })],
    });

    const result = identifyRestraintAlerts([record]);
    const seriousAlerts = result.filter((a) => a.type === "serious_injury");
    expect(seriousAlerts).toHaveLength(1);
    expect(seriousAlerts[0].severity).toBe("critical");
  });

  it("does not raise serious_injury alert for minor/moderate injuries", () => {
    const record = makeRestraintRecord({
      injuries_child: [makeInjuryRecord({ severity: "minor" })],
      injuries_staff: [makeInjuryRecord({ severity: "moderate" })],
    });

    const result = identifyRestraintAlerts([record]);
    const seriousAlerts = result.filter((a) => a.type === "serious_injury");
    expect(seriousAlerts).toHaveLength(0);
  });

  it("raises alert when both child and staff have serious injuries", () => {
    const record = makeRestraintRecord({
      injuries_child: [makeInjuryRecord({ severity: "serious" })],
      injuries_staff: [makeInjuryRecord({ severity: "serious" })],
    });

    const result = identifyRestraintAlerts([record]);
    const seriousAlerts = result.filter((a) => a.type === "serious_injury");
    // Both serious injuries combined trigger a single alert per record
    expect(seriousAlerts).toHaveLength(1);
  });

  // ── no_de_escalation ──

  it("raises high alert when no de-escalation strategies attempted", () => {
    const record = makeRestraintRecord({ de_escalation_attempted: [] });

    const result = identifyRestraintAlerts([record]);
    const deAlerts = result.filter((a) => a.type === "no_de_escalation");
    expect(deAlerts).toHaveLength(1);
    expect(deAlerts[0].severity).toBe("high");
    expect(deAlerts[0].message).toContain("Reg 19");
  });

  it("does not raise no_de_escalation when strategies were attempted", () => {
    const record = makeRestraintRecord({
      de_escalation_attempted: ["Verbal de-escalation"],
    });

    const result = identifyRestraintAlerts([record]);
    const deAlerts = result.filter((a) => a.type === "no_de_escalation");
    expect(deAlerts).toHaveLength(0);
  });

  // ── no_debrief ──

  it("raises medium alert when debrief not completed", () => {
    const record = makeRestraintRecord({ debrief_completed: false });

    const result = identifyRestraintAlerts([record]);
    const debriefAlerts = result.filter((a) => a.type === "no_debrief");
    expect(debriefAlerts).toHaveLength(1);
    expect(debriefAlerts[0].severity).toBe("medium");
  });

  it("does not raise no_debrief when debrief completed", () => {
    const record = makeRestraintRecord({ debrief_completed: true });

    const result = identifyRestraintAlerts([record]);
    const debriefAlerts = result.filter((a) => a.type === "no_debrief");
    expect(debriefAlerts).toHaveLength(0);
  });

  // ── no_child_views ──

  it("raises medium alert when child views not obtained", () => {
    const record = makeRestraintRecord({ child_views_obtained: false });

    const result = identifyRestraintAlerts([record]);
    const viewsAlerts = result.filter((a) => a.type === "no_child_views");
    expect(viewsAlerts).toHaveLength(1);
    expect(viewsAlerts[0].severity).toBe("medium");
    expect(viewsAlerts[0].message).toContain("Reg 7");
  });

  it("does not raise no_child_views when views obtained", () => {
    const record = makeRestraintRecord({ child_views_obtained: true });

    const result = identifyRestraintAlerts([record]);
    const viewsAlerts = result.filter((a) => a.type === "no_child_views");
    expect(viewsAlerts).toHaveLength(0);
  });

  // ── incomplete_notification ──

  it("raises high alert when Ofsted not notified", () => {
    const record = makeRestraintRecord({ ofsted_notified: false });

    const result = identifyRestraintAlerts([record]);
    const notifAlerts = result.filter((a) => a.type === "incomplete_notification");
    expect(notifAlerts).toHaveLength(1);
    expect(notifAlerts[0].severity).toBe("high");
    expect(notifAlerts[0].message).toContain("Ofsted");
  });

  it("raises high alert when parent/carer not notified", () => {
    const record = makeRestraintRecord({ parent_carer_notified: false });

    const result = identifyRestraintAlerts([record]);
    const notifAlerts = result.filter((a) => a.type === "incomplete_notification");
    expect(notifAlerts).toHaveLength(1);
    expect(notifAlerts[0].message).toContain("parent/carer");
  });

  it("raises high alert when social worker not notified", () => {
    const record = makeRestraintRecord({ social_worker_notified: false });

    const result = identifyRestraintAlerts([record]);
    const notifAlerts = result.filter((a) => a.type === "incomplete_notification");
    expect(notifAlerts).toHaveLength(1);
    expect(notifAlerts[0].message).toContain("social worker");
  });

  it("lists all missing parties in a single alert message", () => {
    const record = makeRestraintRecord({
      ofsted_notified: false,
      parent_carer_notified: false,
      social_worker_notified: false,
    });

    const result = identifyRestraintAlerts([record]);
    const notifAlerts = result.filter((a) => a.type === "incomplete_notification");
    expect(notifAlerts).toHaveLength(1);
    expect(notifAlerts[0].message).toContain("Ofsted");
    expect(notifAlerts[0].message).toContain("parent/carer");
    expect(notifAlerts[0].message).toContain("social worker");
    expect(notifAlerts[0].message).toContain("Reg 35/40");
  });

  it("does not raise incomplete_notification when all parties notified", () => {
    const record = makeRestraintRecord({
      ofsted_notified: true,
      parent_carer_notified: true,
      social_worker_notified: true,
    });

    const result = identifyRestraintAlerts([record]);
    const notifAlerts = result.filter((a) => a.type === "incomplete_notification");
    expect(notifAlerts).toHaveLength(0);
  });

  // ── untrained_staff ──

  it("raises critical alert when untrained staff involved", () => {
    const record = makeRestraintRecord({
      staff_involved: [
        makeStaffInvolved({ staff_name: "Bob Untrained", trained: false }),
      ],
    });

    const result = identifyRestraintAlerts([record]);
    const untrainedAlerts = result.filter((a) => a.type === "untrained_staff");
    expect(untrainedAlerts).toHaveLength(1);
    expect(untrainedAlerts[0].severity).toBe("critical");
    expect(untrainedAlerts[0].message).toContain("Bob Untrained");
  });

  it("lists multiple untrained staff names in the alert", () => {
    const record = makeRestraintRecord({
      staff_involved: [
        makeStaffInvolved({ staff_name: "Alice", trained: false }),
        makeStaffInvolved({ staff_name: "Charlie", trained: false }),
        makeStaffInvolved({ staff_name: "Dave", trained: true }),
      ],
    });

    const result = identifyRestraintAlerts([record]);
    const untrainedAlerts = result.filter((a) => a.type === "untrained_staff");
    expect(untrainedAlerts).toHaveLength(1);
    expect(untrainedAlerts[0].message).toContain("Alice");
    expect(untrainedAlerts[0].message).toContain("Charlie");
    expect(untrainedAlerts[0].message).not.toContain("Dave");
  });

  it("does not raise untrained_staff when all staff are trained", () => {
    const record = makeRestraintRecord({
      staff_involved: [
        makeStaffInvolved({ trained: true }),
        makeStaffInvolved({ staff_name: "Another", trained: true }),
      ],
    });

    const result = identifyRestraintAlerts([record]);
    const untrainedAlerts = result.filter((a) => a.type === "untrained_staff");
    expect(untrainedAlerts).toHaveLength(0);
  });

  // ── repeated_restraint ──

  it("raises high alert for child with 3+ incidents", () => {
    const records = [
      makeRestraintRecord({ id: "rr-1", child_id: "c-X", child_name: "Xander" }),
      makeRestraintRecord({ id: "rr-2", child_id: "c-X", child_name: "Xander" }),
      makeRestraintRecord({ id: "rr-3", child_id: "c-X", child_name: "Xander" }),
    ];

    const result = identifyRestraintAlerts(records);
    const repeatAlerts = result.filter((a) => a.type === "repeated_restraint");
    expect(repeatAlerts).toHaveLength(1);
    expect(repeatAlerts[0].severity).toBe("high");
    expect(repeatAlerts[0].message).toContain("Xander");
    expect(repeatAlerts[0].message).toContain("3");
    expect(repeatAlerts[0].message).toContain("CAMHS");
  });

  it("does not raise repeated_restraint for child with fewer than 3 incidents", () => {
    const records = [
      makeRestraintRecord({ id: "rr-1", child_id: "c-X", child_name: "Xander" }),
      makeRestraintRecord({ id: "rr-2", child_id: "c-X", child_name: "Xander" }),
    ];

    const result = identifyRestraintAlerts(records);
    const repeatAlerts = result.filter((a) => a.type === "repeated_restraint");
    expect(repeatAlerts).toHaveLength(0);
  });

  it("raises repeated_restraint for multiple children exceeding threshold", () => {
    const records = [
      makeRestraintRecord({ id: "rr-1", child_id: "c-A", child_name: "Alice" }),
      makeRestraintRecord({ id: "rr-2", child_id: "c-A", child_name: "Alice" }),
      makeRestraintRecord({ id: "rr-3", child_id: "c-A", child_name: "Alice" }),
      makeRestraintRecord({ id: "rr-4", child_id: "c-B", child_name: "Beth" }),
      makeRestraintRecord({ id: "rr-5", child_id: "c-B", child_name: "Beth" }),
      makeRestraintRecord({ id: "rr-6", child_id: "c-B", child_name: "Beth" }),
      makeRestraintRecord({ id: "rr-7", child_id: "c-B", child_name: "Beth" }),
    ];

    const result = identifyRestraintAlerts(records);
    const repeatAlerts = result.filter((a) => a.type === "repeated_restraint");
    expect(repeatAlerts).toHaveLength(2);
    const messages = repeatAlerts.map((a) => a.message);
    expect(messages.some((m) => m.includes("Alice") && m.includes("3"))).toBe(true);
    expect(messages.some((m) => m.includes("Beth") && m.includes("4"))).toBe(true);
  });

  // ── Multiple alerts from a single record ──

  it("raises multiple alert types for a single non-compliant record", () => {
    const record = makeRestraintRecord({
      de_escalation_attempted: [],
      debrief_completed: false,
      child_views_obtained: false,
      ofsted_notified: false,
      parent_carer_notified: false,
      social_worker_notified: false,
      staff_involved: [makeStaffInvolved({ trained: false })],
      injuries_child: [makeInjuryRecord({ severity: "serious" })],
    });

    const result = identifyRestraintAlerts([record]);
    const types = result.map((a) => a.type);
    expect(types).toContain("serious_injury");
    expect(types).toContain("no_de_escalation");
    expect(types).toContain("no_debrief");
    expect(types).toContain("no_child_views");
    expect(types).toContain("incomplete_notification");
    expect(types).toContain("untrained_staff");
  });

  it("generates alerts across multiple records independently", () => {
    const records = [
      makeRestraintRecord({ id: "rr-1", debrief_completed: false }),
      makeRestraintRecord({ id: "rr-2", debrief_completed: false }),
    ];

    const result = identifyRestraintAlerts(records);
    const debriefAlerts = result.filter((a) => a.type === "no_debrief");
    expect(debriefAlerts).toHaveLength(2);
  });

  it("does not raise injury alert for 'none' severity injuries", () => {
    const record = makeRestraintRecord({
      injuries_child: [makeInjuryRecord({ severity: "none" })],
    });

    const result = identifyRestraintAlerts([record]);
    const seriousAlerts = result.filter((a) => a.type === "serious_injury");
    expect(seriousAlerts).toHaveLength(0);
  });
});

// ── RESTRAINT_TYPES constant ───────────────────────────────────────────────

describe("RESTRAINT_TYPES", () => {
  it("contains exactly 5 entries", () => {
    expect(RESTRAINT_TYPES).toHaveLength(5);
  });

  it("each entry has type, label, and regulation", () => {
    for (const entry of RESTRAINT_TYPES) {
      expect(entry).toHaveProperty("type");
      expect(entry).toHaveProperty("label");
      expect(entry).toHaveProperty("regulation");
      expect(typeof entry.type).toBe("string");
      expect(typeof entry.label).toBe("string");
      expect(typeof entry.regulation).toBe("string");
    }
  });

  it("includes physical restraint under Reg 20", () => {
    const physical = RESTRAINT_TYPES.find((t) => t.type === "physical");
    expect(physical).toBeDefined();
    expect(physical!.label).toBe("Physical Restraint");
    expect(physical!.regulation).toBe("Reg 20");
  });

  it("includes guided_away under Reg 20", () => {
    const guided = RESTRAINT_TYPES.find((t) => t.type === "guided_away");
    expect(guided).toBeDefined();
    expect(guided!.regulation).toBe("Reg 20");
  });

  it("includes separation under Reg 19", () => {
    const sep = RESTRAINT_TYPES.find((t) => t.type === "separation");
    expect(sep).toBeDefined();
    expect(sep!.regulation).toBe("Reg 19");
  });

  it("includes environmental restriction under Reg 19", () => {
    const env = RESTRAINT_TYPES.find((t) => t.type === "environmental");
    expect(env).toBeDefined();
    expect(env!.regulation).toBe("Reg 19");
  });

  it("has exactly 3 entries referencing Reg 20", () => {
    const reg20 = RESTRAINT_TYPES.filter((t) => t.regulation === "Reg 20");
    expect(reg20).toHaveLength(3);
  });

  it("has exactly 2 entries referencing Reg 19", () => {
    const reg19 = RESTRAINT_TYPES.filter((t) => t.regulation === "Reg 19");
    expect(reg19).toHaveLength(2);
  });
});

// ── APPROVED_TECHNIQUES constant ───────────────────────────────────────────

describe("APPROVED_TECHNIQUES", () => {
  it("contains exactly 6 techniques", () => {
    expect(APPROVED_TECHNIQUES).toHaveLength(6);
  });

  it("includes Team-Teach", () => {
    expect(APPROVED_TECHNIQUES).toContain("Team-Teach");
  });

  it("includes PRICE", () => {
    expect(APPROVED_TECHNIQUES).toContain("PRICE");
  });

  it("includes CPI", () => {
    expect(APPROVED_TECHNIQUES).toContain("CPI (Crisis Prevention Institute)");
  });

  it("includes MAPA", () => {
    expect(APPROVED_TECHNIQUES).toContain("MAPA (Management of Actual or Potential Aggression)");
  });

  it("includes Verbal de-escalation only", () => {
    expect(APPROVED_TECHNIQUES).toContain("Verbal de-escalation only");
  });

  it("includes Other approved technique", () => {
    expect(APPROVED_TECHNIQUES).toContain("Other approved technique");
  });

  it("contains only strings", () => {
    for (const technique of APPROVED_TECHNIQUES) {
      expect(typeof technique).toBe("string");
    }
  });
});

// ── DE_ESCALATION_STRATEGIES constant ──────────────────────────────────────

describe("DE_ESCALATION_STRATEGIES", () => {
  it("contains exactly 10 strategies", () => {
    expect(DE_ESCALATION_STRATEGIES).toHaveLength(10);
  });

  it("includes Verbal de-escalation", () => {
    expect(DE_ESCALATION_STRATEGIES).toContain("Verbal de-escalation");
  });

  it("includes Distraction", () => {
    expect(DE_ESCALATION_STRATEGIES).toContain("Distraction");
  });

  it("includes Change of staff", () => {
    expect(DE_ESCALATION_STRATEGIES).toContain("Change of staff");
  });

  it("includes Sensory regulation tools", () => {
    expect(DE_ESCALATION_STRATEGIES).toContain("Sensory regulation tools");
  });

  it("includes Agreed safe space", () => {
    expect(DE_ESCALATION_STRATEGIES).toContain("Agreed safe space");
  });

  it("contains only strings", () => {
    for (const strategy of DE_ESCALATION_STRATEGIES) {
      expect(typeof strategy).toBe("string");
    }
  });
});

// ── BODY_LOCATIONS constant ────────────────────────────────────────────────

describe("BODY_LOCATIONS", () => {
  it("contains exactly 14 locations", () => {
    expect(BODY_LOCATIONS).toHaveLength(14);
  });

  it("includes head, face, and neck", () => {
    expect(BODY_LOCATIONS).toContain("head");
    expect(BODY_LOCATIONS).toContain("face");
    expect(BODY_LOCATIONS).toContain("neck");
  });

  it("includes bilateral arm locations", () => {
    expect(BODY_LOCATIONS).toContain("left_arm");
    expect(BODY_LOCATIONS).toContain("right_arm");
  });

  it("includes bilateral hand locations", () => {
    expect(BODY_LOCATIONS).toContain("left_hand");
    expect(BODY_LOCATIONS).toContain("right_hand");
  });

  it("includes torso locations", () => {
    expect(BODY_LOCATIONS).toContain("chest");
    expect(BODY_LOCATIONS).toContain("back");
    expect(BODY_LOCATIONS).toContain("abdomen");
  });

  it("includes bilateral leg locations", () => {
    expect(BODY_LOCATIONS).toContain("left_leg");
    expect(BODY_LOCATIONS).toContain("right_leg");
  });

  it("includes bilateral foot locations", () => {
    expect(BODY_LOCATIONS).toContain("left_foot");
    expect(BODY_LOCATIONS).toContain("right_foot");
  });

  it("contains only strings", () => {
    for (const location of BODY_LOCATIONS) {
      expect(typeof location).toBe("string");
    }
  });
});
