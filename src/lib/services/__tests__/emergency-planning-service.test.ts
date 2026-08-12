// ══════════════════════════════════════════════════════════════════════════════
// CARA — EMERGENCY PLANNING SERVICE TESTS
// Pure-function tests for emergency preparedness computation, alert
// identification, and constant validation.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "../emergency-planning-service";
import { todayStr } from "@/lib/utils";
import {
  DRILL_TYPES,
  EMERGENCY_CONTACT_TYPES,
  CONTINGENCY_PLAN_TYPES,
} from "../emergency-planning-service";
import type {
  FireDrillRecord,
  EmergencyContact,
  ContingencyPlan,
} from "../emergency-planning-service";

const {
  computeEmergencyPreparedness,
  identifyEmergencyAlerts,
} = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

/** ISO date string N days ago from now. */
function daysAgo(n: number): string {
  const d = new Date(todayStr());
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

/** Build a minimal FireDrillRecord with sensible defaults. */
function makeDrill(
  overrides: Partial<{
    id: string;
    home_id: string;
    drill_date: string;
    drill_time: string;
    drill_type: string;
    staff_present: string[];
    children_present: string[];
    children_absent: string[];
    evacuation_time_seconds: number;
    assembly_point_used: string;
    alarm_activated: boolean;
    all_accounted_for: boolean;
    issues_identified: string[];
    improvements_needed: string[];
    conducted_by: string;
    next_drill_date: string | null;
    created_at: string;
  }> = {},
): FireDrillRecord {
  return {
    id: "id" in overrides ? overrides.id! : "drill-1",
    home_id: "home_id" in overrides ? overrides.home_id! : "home-1",
    drill_date: "drill_date" in overrides ? overrides.drill_date! : daysAgo(5),
    drill_time: "drill_time" in overrides ? overrides.drill_time! : "10:00",
    drill_type: "drill_type" in overrides ? overrides.drill_type! : "fire_evacuation",
    staff_present: "staff_present" in overrides ? overrides.staff_present! : ["staff-1"],
    children_present: "children_present" in overrides ? overrides.children_present! : ["child-1"],
    children_absent: "children_absent" in overrides ? overrides.children_absent! : [],
    evacuation_time_seconds: "evacuation_time_seconds" in overrides ? overrides.evacuation_time_seconds! : 120,
    assembly_point_used: "assembly_point_used" in overrides ? overrides.assembly_point_used! : "Front garden",
    alarm_activated: "alarm_activated" in overrides ? overrides.alarm_activated! : true,
    all_accounted_for: "all_accounted_for" in overrides ? overrides.all_accounted_for! : true,
    issues_identified: "issues_identified" in overrides ? overrides.issues_identified! : [],
    improvements_needed: "improvements_needed" in overrides ? overrides.improvements_needed! : [],
    conducted_by: "conducted_by" in overrides ? overrides.conducted_by! : "staff-1",
    next_drill_date: "next_drill_date" in overrides ? overrides.next_drill_date! : null,
    created_at: "created_at" in overrides ? overrides.created_at! : "2026-01-01T00:00:00Z",
  };
}

/** Build a minimal EmergencyContact with sensible defaults. */
function makeContact(
  overrides: Partial<{
    id: string;
    home_id: string;
    contact_type: string;
    name: string;
    role: string;
    phone_primary: string;
    phone_secondary: string | null;
    email: string | null;
    availability: string;
    priority_order: number;
    last_verified_date: string;
    status: "active" | "inactive";
    created_at: string;
    updated_at: string;
  }> = {},
): EmergencyContact {
  return {
    id: "id" in overrides ? overrides.id! : "contact-1",
    home_id: "home_id" in overrides ? overrides.home_id! : "home-1",
    contact_type: "contact_type" in overrides ? overrides.contact_type! : "fire_service",
    name: "name" in overrides ? overrides.name! : "Fire Service",
    role: "role" in overrides ? overrides.role! : "Emergency Service",
    phone_primary: "phone_primary" in overrides ? overrides.phone_primary! : "999",
    phone_secondary: "phone_secondary" in overrides ? overrides.phone_secondary! : null,
    email: "email" in overrides ? overrides.email! : null,
    availability: "availability" in overrides ? overrides.availability! : "24/7",
    priority_order: "priority_order" in overrides ? overrides.priority_order! : 1,
    last_verified_date: "last_verified_date" in overrides ? overrides.last_verified_date! : daysAgo(30),
    status: "status" in overrides ? overrides.status! : "active",
    created_at: "created_at" in overrides ? overrides.created_at! : "2026-01-01T00:00:00Z",
    updated_at: "updated_at" in overrides ? overrides.updated_at! : "2026-01-01T00:00:00Z",
  };
}

/** Build a minimal ContingencyPlan with sensible defaults. */
function makePlan(
  overrides: Partial<{
    id: string;
    home_id: string;
    plan_type: string;
    title: string;
    description: string;
    trigger_conditions: string[];
    immediate_actions: string[];
    responsible_persons: string[];
    escalation_contacts: string[];
    review_date: string;
    reviewed_by: string | null;
    status: "current" | "under_review" | "expired";
    version: number;
    created_at: string;
    updated_at: string;
  }> = {},
): ContingencyPlan {
  return {
    id: "id" in overrides ? overrides.id! : "plan-1",
    home_id: "home_id" in overrides ? overrides.home_id! : "home-1",
    plan_type: "plan_type" in overrides ? overrides.plan_type! : "fire",
    title: "title" in overrides ? overrides.title! : "Fire Evacuation Plan",
    description: "description" in overrides ? overrides.description! : "Procedures for fire evacuation",
    trigger_conditions: "trigger_conditions" in overrides ? overrides.trigger_conditions! : ["Fire alarm activated"],
    immediate_actions: "immediate_actions" in overrides ? overrides.immediate_actions! : ["Evacuate all residents"],
    responsible_persons: "responsible_persons" in overrides ? overrides.responsible_persons! : ["staff-1"],
    escalation_contacts: "escalation_contacts" in overrides ? overrides.escalation_contacts! : ["contact-1"],
    review_date: "review_date" in overrides ? overrides.review_date! : daysAgo(10),
    reviewed_by: "reviewed_by" in overrides ? overrides.reviewed_by! : null,
    status: "status" in overrides ? overrides.status! : "current",
    version: "version" in overrides ? overrides.version! : 1,
    created_at: "created_at" in overrides ? overrides.created_at! : "2026-01-01T00:00:00Z",
    updated_at: "updated_at" in overrides ? overrides.updated_at! : "2026-01-01T00:00:00Z",
  };
}

// ── computeEmergencyPreparedness ──────────────────────────────────────────

describe("computeEmergencyPreparedness", () => {
  it("returns zeroes for all metrics when given empty arrays", () => {
    const result = computeEmergencyPreparedness([], [], []);
    expect(result).toEqual({
      total_drills: 0,
      drills_by_type: {},
      avg_evacuation_time: null,
      all_accounted_rate: null,
      drills_with_issues: 0,
      active_contacts: 0,
      contacts_verified: 0,
      contacts_verification_rate: null,
      current_plans: 0,
      expired_plans: 0,
      total_plan_types_covered: 0,
    });
  });

  it("counts total drills correctly", () => {
    const drills = [
      makeDrill({ id: "d1" }),
      makeDrill({ id: "d2" }),
      makeDrill({ id: "d3" }),
    ];
    const result = computeEmergencyPreparedness(drills, [], []);
    expect(result.total_drills).toBe(3);
  });

  it("groups drills by type correctly", () => {
    const drills = [
      makeDrill({ id: "d1", drill_type: "fire_evacuation" }),
      makeDrill({ id: "d2", drill_type: "fire_evacuation" }),
      makeDrill({ id: "d3", drill_type: "lockdown" }),
      makeDrill({ id: "d4", drill_type: "missing_child" }),
    ];
    const result = computeEmergencyPreparedness(drills, [], []);
    expect(result.drills_by_type).toEqual({
      fire_evacuation: 2,
      lockdown: 1,
      missing_child: 1,
    });
  });

  it("calculates average evacuation time rounded to nearest integer", () => {
    const drills = [
      makeDrill({ id: "d1", evacuation_time_seconds: 100 }),
      makeDrill({ id: "d2", evacuation_time_seconds: 200 }),
      makeDrill({ id: "d3", evacuation_time_seconds: 150 }),
    ];
    const result = computeEmergencyPreparedness(drills, [], []);
    // (100 + 200 + 150) / 3 = 150
    expect(result.avg_evacuation_time).toBe(150);
  });

  it("rounds average evacuation time correctly with non-divisible total", () => {
    const drills = [
      makeDrill({ id: "d1", evacuation_time_seconds: 100 }),
      makeDrill({ id: "d2", evacuation_time_seconds: 101 }),
    ];
    const result = computeEmergencyPreparedness(drills, [], []);
    // (100 + 101) / 2 = 100.5 -> rounds to 101
    expect(result.avg_evacuation_time).toBe(101);
  });

  it("returns 0 avg_evacuation_time when no drills exist", () => {
    const result = computeEmergencyPreparedness([], [], []);
    expect(result.avg_evacuation_time).toBeNull();;
  });

  it("calculates all_accounted_rate as a rounded percentage", () => {
    const drills = [
      makeDrill({ id: "d1", all_accounted_for: true }),
      makeDrill({ id: "d2", all_accounted_for: true }),
      makeDrill({ id: "d3", all_accounted_for: false }),
    ];
    const result = computeEmergencyPreparedness(drills, [], []);
    // 2/3 * 100 = 66.67 -> rounds to 67
    expect(result.all_accounted_rate).toBe(67);
  });

  it("returns 100 for all_accounted_rate when all drills accounted", () => {
    const drills = [
      makeDrill({ id: "d1", all_accounted_for: true }),
      makeDrill({ id: "d2", all_accounted_for: true }),
    ];
    const result = computeEmergencyPreparedness(drills, [], []);
    expect(result.all_accounted_rate).toBe(100);
  });

  it("returns 0 for all_accounted_rate when no drills accounted", () => {
    const drills = [
      makeDrill({ id: "d1", all_accounted_for: false }),
      makeDrill({ id: "d2", all_accounted_for: false }),
    ];
    const result = computeEmergencyPreparedness(drills, [], []);
    expect(result.all_accounted_rate).toBe(0);
  });

  it("counts drills with issues correctly", () => {
    const drills = [
      makeDrill({ id: "d1", issues_identified: ["Slow exit via corridor"] }),
      makeDrill({ id: "d2", issues_identified: [] }),
      makeDrill({ id: "d3", issues_identified: ["Door blocked", "Alarm faint"] }),
    ];
    const result = computeEmergencyPreparedness(drills, [], []);
    expect(result.drills_with_issues).toBe(2);
  });

  it("counts only active contacts", () => {
    const contacts = [
      makeContact({ id: "c1", status: "active" }),
      makeContact({ id: "c2", status: "inactive" }),
      makeContact({ id: "c3", status: "active" }),
    ];
    const result = computeEmergencyPreparedness([], contacts, []);
    expect(result.active_contacts).toBe(2);
  });

  it("counts contacts verified within 180 days", () => {
    const contacts = [
      makeContact({ id: "c1", status: "active", last_verified_date: daysAgo(10) }),
      makeContact({ id: "c2", status: "active", last_verified_date: daysAgo(179) }),
      makeContact({ id: "c3", status: "active", last_verified_date: daysAgo(200) }),
    ];
    const result = computeEmergencyPreparedness([], contacts, []);
    expect(result.contacts_verified).toBe(2);
  });

  it("excludes inactive contacts from verification count", () => {
    const contacts = [
      makeContact({ id: "c1", status: "inactive", last_verified_date: daysAgo(10) }),
      makeContact({ id: "c2", status: "active", last_verified_date: daysAgo(10) }),
    ];
    const result = computeEmergencyPreparedness([], contacts, []);
    expect(result.active_contacts).toBe(1);
    expect(result.contacts_verified).toBe(1);
  });

  it("calculates contacts_verification_rate as rounded percentage", () => {
    const contacts = [
      makeContact({ id: "c1", status: "active", last_verified_date: daysAgo(10) }),
      makeContact({ id: "c2", status: "active", last_verified_date: daysAgo(200) }),
      makeContact({ id: "c3", status: "active", last_verified_date: daysAgo(200) }),
    ];
    const result = computeEmergencyPreparedness([], contacts, []);
    // 1 verified out of 3 active = 33.33 -> 33
    expect(result.contacts_verification_rate).toBe(33);
  });

  it("returns 0 contacts_verification_rate when no active contacts", () => {
    const contacts = [
      makeContact({ id: "c1", status: "inactive" }),
    ];
    const result = computeEmergencyPreparedness([], contacts, []);
    expect(result.contacts_verification_rate).toBeNull();;
  });

  it("counts current and expired plans correctly", () => {
    const plans = [
      makePlan({ id: "p1", status: "current" }),
      makePlan({ id: "p2", status: "expired" }),
      makePlan({ id: "p3", status: "under_review" }),
      makePlan({ id: "p4", status: "current" }),
      makePlan({ id: "p5", status: "expired" }),
    ];
    const result = computeEmergencyPreparedness([], [], plans);
    expect(result.current_plans).toBe(2);
    expect(result.expired_plans).toBe(2);
  });

  it("counts unique plan types covered by current plans only", () => {
    const plans = [
      makePlan({ id: "p1", plan_type: "fire", status: "current" }),
      makePlan({ id: "p2", plan_type: "fire", status: "current" }),
      makePlan({ id: "p3", plan_type: "flood", status: "current" }),
      makePlan({ id: "p4", plan_type: "pandemic", status: "expired" }),
    ];
    const result = computeEmergencyPreparedness([], [], plans);
    // Only current plans: fire, flood = 2 unique types
    expect(result.total_plan_types_covered).toBe(2);
  });

  it("does not count expired or under_review plans in type coverage", () => {
    const plans = [
      makePlan({ id: "p1", plan_type: "fire", status: "expired" }),
      makePlan({ id: "p2", plan_type: "flood", status: "under_review" }),
    ];
    const result = computeEmergencyPreparedness([], [], plans);
    expect(result.total_plan_types_covered).toBe(0);
  });

  it("handles a single drill correctly", () => {
    const drills = [makeDrill({ evacuation_time_seconds: 90, all_accounted_for: true })];
    const result = computeEmergencyPreparedness(drills, [], []);
    expect(result.total_drills).toBe(1);
    expect(result.avg_evacuation_time).toBe(90);
    expect(result.all_accounted_rate).toBe(100);
  });

  it("handles zero evacuation time", () => {
    const drills = [
      makeDrill({ id: "d1", evacuation_time_seconds: 0 }),
      makeDrill({ id: "d2", evacuation_time_seconds: 0 }),
    ];
    const result = computeEmergencyPreparedness(drills, [], []);
    expect(result.avg_evacuation_time).toBe(0);
  });
});

// ── identifyEmergencyAlerts ──────────────────────────────────────────────

describe("identifyEmergencyAlerts", () => {
  it("returns empty array when everything is compliant", () => {
    const drills = [makeDrill({ drill_date: daysAgo(5), drill_type: "fire_evacuation", all_accounted_for: true })];
    const contacts = [makeContact({ status: "active", last_verified_date: daysAgo(30) })];
    const plans = [
      makePlan({ plan_type: "fire", status: "current" }),
      makePlan({ plan_type: "missing_child", status: "current" }),
      makePlan({ plan_type: "serious_incident", status: "current" }),
      makePlan({ plan_type: "staffing_crisis", status: "current" }),
    ];
    const alerts = identifyEmergencyAlerts(drills, contacts, plans);
    expect(alerts).toEqual([]);
  });

  // -- no_fire_drill alerts --

  it("raises no_fire_drill alert when no fire drills exist", () => {
    const alerts = identifyEmergencyAlerts([], [], []);
    const fireDrillAlert = alerts.find((a) => a.type === "no_fire_drill");
    expect(fireDrillAlert).toBeDefined();
    expect(fireDrillAlert!.severity).toBe("high");
  });

  it("raises no_fire_drill alert when last fire drill was over 30 days ago", () => {
    const drills = [makeDrill({ drill_date: daysAgo(35), drill_type: "fire_evacuation" })];
    const alerts = identifyEmergencyAlerts(drills, [], []);
    const fireDrillAlert = alerts.find((a) => a.type === "no_fire_drill");
    expect(fireDrillAlert).toBeDefined();
    expect(fireDrillAlert!.severity).toBe("high");
  });

  it("does not raise no_fire_drill alert when fire drill is within 30 days", () => {
    const drills = [makeDrill({ drill_date: daysAgo(10), drill_type: "fire_evacuation" })];
    const alerts = identifyEmergencyAlerts(drills, [], []);
    const fireDrillAlert = alerts.find((a) => a.type === "no_fire_drill");
    expect(fireDrillAlert).toBeUndefined();
  });

  it("only checks fire_evacuation type for the 30-day rule, not other drill types", () => {
    const drills = [
      makeDrill({ drill_date: daysAgo(5), drill_type: "lockdown" }),
      makeDrill({ drill_date: daysAgo(5), drill_type: "missing_child" }),
    ];
    const alerts = identifyEmergencyAlerts(drills, [], []);
    const fireDrillAlert = alerts.find((a) => a.type === "no_fire_drill");
    expect(fireDrillAlert).toBeDefined();
  });

  // -- not_all_accounted alerts --

  it("raises not_all_accounted alert when a drill has unaccounted children", () => {
    const drills = [makeDrill({ all_accounted_for: false })];
    const alerts = identifyEmergencyAlerts(drills, [], []);
    const alert = alerts.find((a) => a.type === "not_all_accounted");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("critical");
  });

  it("uses singular form for 1 drill not accounted", () => {
    const drills = [makeDrill({ all_accounted_for: false })];
    const alerts = identifyEmergencyAlerts(drills, [], []);
    const alert = alerts.find((a) => a.type === "not_all_accounted");
    expect(alert!.message).toContain("1 drill where");
    expect(alert!.message).not.toContain("drills where");
  });

  it("uses plural form for multiple drills not accounted", () => {
    const drills = [
      makeDrill({ id: "d1", all_accounted_for: false }),
      makeDrill({ id: "d2", all_accounted_for: false }),
      makeDrill({ id: "d3", all_accounted_for: false }),
    ];
    const alerts = identifyEmergencyAlerts(drills, [], []);
    const alert = alerts.find((a) => a.type === "not_all_accounted");
    expect(alert!.message).toContain("3 drills where");
  });

  it("does not raise not_all_accounted when all drills accounted", () => {
    const drills = [
      makeDrill({ id: "d1", all_accounted_for: true }),
      makeDrill({ id: "d2", all_accounted_for: true }),
    ];
    const alerts = identifyEmergencyAlerts(drills, [], []);
    const alert = alerts.find((a) => a.type === "not_all_accounted");
    expect(alert).toBeUndefined();
  });

  // -- expired_plans alerts --

  it("raises expired_plans alert when plans are expired", () => {
    const plans = [makePlan({ status: "expired" })];
    const alerts = identifyEmergencyAlerts([], [], plans);
    const alert = alerts.find((a) => a.type === "expired_plans");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("high");
  });

  it("uses singular form for 1 expired plan", () => {
    const plans = [makePlan({ status: "expired" })];
    const alerts = identifyEmergencyAlerts([], [], plans);
    const alert = alerts.find((a) => a.type === "expired_plans");
    expect(alert!.message).toContain("1 contingency plan expired");
    expect(alert!.message).not.toContain("plans expired");
  });

  it("uses plural form for multiple expired plans", () => {
    const plans = [
      makePlan({ id: "p1", status: "expired" }),
      makePlan({ id: "p2", status: "expired" }),
    ];
    const alerts = identifyEmergencyAlerts([], [], plans);
    const alert = alerts.find((a) => a.type === "expired_plans");
    expect(alert!.message).toContain("2 contingency plans expired");
  });

  it("does not raise expired_plans when no plans are expired", () => {
    const plans = [
      makePlan({ id: "p1", status: "current" }),
      makePlan({ id: "p2", status: "under_review" }),
    ];
    const alerts = identifyEmergencyAlerts([], [], plans);
    const alert = alerts.find((a) => a.type === "expired_plans");
    expect(alert).toBeUndefined();
  });

  // -- unverified_contacts alerts --

  it("raises unverified_contacts alert for contacts not verified in 6 months", () => {
    const contacts = [
      makeContact({ status: "active", last_verified_date: daysAgo(200) }),
    ];
    const alerts = identifyEmergencyAlerts([], contacts, []);
    const alert = alerts.find((a) => a.type === "unverified_contacts");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("medium");
  });

  it("does not raise unverified_contacts when all active contacts verified recently", () => {
    const contacts = [
      makeContact({ id: "c1", status: "active", last_verified_date: daysAgo(10) }),
      makeContact({ id: "c2", status: "active", last_verified_date: daysAgo(179) }),
    ];
    const alerts = identifyEmergencyAlerts([], contacts, []);
    const alert = alerts.find((a) => a.type === "unverified_contacts");
    expect(alert).toBeUndefined();
  });

  it("ignores inactive contacts for unverified_contacts alert", () => {
    const contacts = [
      makeContact({ status: "inactive", last_verified_date: daysAgo(400) }),
    ];
    const alerts = identifyEmergencyAlerts([], contacts, []);
    const alert = alerts.find((a) => a.type === "unverified_contacts");
    expect(alert).toBeUndefined();
  });

  it("uses singular form for 1 unverified contact", () => {
    const contacts = [
      makeContact({ status: "active", last_verified_date: daysAgo(200) }),
    ];
    const alerts = identifyEmergencyAlerts([], contacts, []);
    const alert = alerts.find((a) => a.type === "unverified_contacts");
    expect(alert!.message).toContain("1 emergency contact not");
    expect(alert!.message).not.toContain("contacts not");
  });

  it("uses plural form for multiple unverified contacts", () => {
    const contacts = [
      makeContact({ id: "c1", status: "active", last_verified_date: daysAgo(200) }),
      makeContact({ id: "c2", status: "active", last_verified_date: daysAgo(300) }),
    ];
    const alerts = identifyEmergencyAlerts([], contacts, []);
    const alert = alerts.find((a) => a.type === "unverified_contacts");
    expect(alert!.message).toContain("2 emergency contacts not");
  });

  // -- missing_essential_plans alerts --

  it("raises missing_essential_plans alert when all essential plan types are missing", () => {
    const alerts = identifyEmergencyAlerts([], [], []);
    const alert = alerts.find((a) => a.type === "missing_essential_plans");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("high");
    expect(alert!.message).toContain("fire");
    expect(alert!.message).toContain("missing_child");
    expect(alert!.message).toContain("serious_incident");
    expect(alert!.message).toContain("staffing_crisis");
  });

  it("raises missing_essential_plans for partially missing essential types", () => {
    const plans = [
      makePlan({ id: "p1", plan_type: "fire", status: "current" }),
      makePlan({ id: "p2", plan_type: "missing_child", status: "current" }),
    ];
    const alerts = identifyEmergencyAlerts([], [], plans);
    const alert = alerts.find((a) => a.type === "missing_essential_plans");
    expect(alert).toBeDefined();
    expect(alert!.message).toContain("serious_incident");
    expect(alert!.message).toContain("staffing_crisis");
    expect(alert!.message).not.toContain("fire");
    expect(alert!.message).not.toContain("missing_child");
  });

  it("does not raise missing_essential_plans when all four essential types have current plans", () => {
    const plans = [
      makePlan({ id: "p1", plan_type: "fire", status: "current" }),
      makePlan({ id: "p2", plan_type: "missing_child", status: "current" }),
      makePlan({ id: "p3", plan_type: "serious_incident", status: "current" }),
      makePlan({ id: "p4", plan_type: "staffing_crisis", status: "current" }),
    ];
    const alerts = identifyEmergencyAlerts([], [], plans);
    const alert = alerts.find((a) => a.type === "missing_essential_plans");
    expect(alert).toBeUndefined();
  });

  it("does not count expired plans as covering essential types", () => {
    const plans = [
      makePlan({ id: "p1", plan_type: "fire", status: "expired" }),
      makePlan({ id: "p2", plan_type: "missing_child", status: "expired" }),
      makePlan({ id: "p3", plan_type: "serious_incident", status: "expired" }),
      makePlan({ id: "p4", plan_type: "staffing_crisis", status: "expired" }),
    ];
    const alerts = identifyEmergencyAlerts([], [], plans);
    const alert = alerts.find((a) => a.type === "missing_essential_plans");
    expect(alert).toBeDefined();
    expect(alert!.message).toContain("fire");
  });

  it("does not count under_review plans as covering essential types", () => {
    const plans = [
      makePlan({ id: "p1", plan_type: "fire", status: "under_review" }),
      makePlan({ id: "p2", plan_type: "missing_child", status: "under_review" }),
      makePlan({ id: "p3", plan_type: "serious_incident", status: "under_review" }),
      makePlan({ id: "p4", plan_type: "staffing_crisis", status: "under_review" }),
    ];
    const alerts = identifyEmergencyAlerts([], [], plans);
    const alert = alerts.find((a) => a.type === "missing_essential_plans");
    expect(alert).toBeDefined();
  });

  // -- multiple alerts at once --

  it("can raise multiple alert types simultaneously", () => {
    // No fire drill, unaccounted drill, expired plan, unverified contact, missing essential plans
    const drills = [
      makeDrill({ drill_date: daysAgo(60), drill_type: "fire_evacuation", all_accounted_for: false }),
    ];
    const contacts = [
      makeContact({ status: "active", last_verified_date: daysAgo(200) }),
    ];
    const plans = [
      makePlan({ status: "expired", plan_type: "flood" }),
    ];
    const alerts = identifyEmergencyAlerts(drills, contacts, plans);
    const alertTypes = alerts.map((a) => a.type);
    expect(alertTypes).toContain("no_fire_drill");
    expect(alertTypes).toContain("not_all_accounted");
    expect(alertTypes).toContain("expired_plans");
    expect(alertTypes).toContain("unverified_contacts");
    expect(alertTypes).toContain("missing_essential_plans");
    expect(alerts.length).toBe(5);
  });

  it("includes Ofsted reference in missing_essential_plans message", () => {
    const alerts = identifyEmergencyAlerts([], [], []);
    const alert = alerts.find((a) => a.type === "missing_essential_plans");
    expect(alert!.message).toContain("Ofsted");
  });

  it("includes Reg 25 reference in no_fire_drill message", () => {
    const alerts = identifyEmergencyAlerts([], [], []);
    const alert = alerts.find((a) => a.type === "no_fire_drill");
    expect(alert!.message).toContain("Reg 25");
  });
});

// ── DRILL_TYPES constant ─────────────────────────────────────────────────

describe("DRILL_TYPES", () => {
  it("contains exactly 6 drill types", () => {
    expect(DRILL_TYPES).toHaveLength(6);
  });

  it("has correct shape for every entry", () => {
    for (const entry of DRILL_TYPES) {
      expect(entry).toHaveProperty("type");
      expect(entry).toHaveProperty("label");
      expect(entry).toHaveProperty("frequency");
      expect(typeof entry.type).toBe("string");
      expect(typeof entry.label).toBe("string");
      expect(typeof entry.frequency).toBe("string");
    }
  });

  it("has unique type values", () => {
    const types = DRILL_TYPES.map((d) => d.type);
    expect(new Set(types).size).toBe(types.length);
  });

  it("includes fire_evacuation with Monthly frequency", () => {
    const entry = DRILL_TYPES.find((d) => d.type === "fire_evacuation");
    expect(entry).toBeDefined();
    expect(entry!.frequency).toBe("Monthly");
  });

  it("includes fire_night with Quarterly frequency", () => {
    const entry = DRILL_TYPES.find((d) => d.type === "fire_night");
    expect(entry).toBeDefined();
    expect(entry!.frequency).toBe("Quarterly");
  });

  it("includes lockdown with 6-monthly frequency", () => {
    const entry = DRILL_TYPES.find((d) => d.type === "lockdown");
    expect(entry).toBeDefined();
    expect(entry!.frequency).toBe("6-monthly");
  });

  it("includes utility_failure with Annual frequency", () => {
    const entry = DRILL_TYPES.find((d) => d.type === "utility_failure");
    expect(entry).toBeDefined();
    expect(entry!.frequency).toBe("Annual");
  });

  it("has non-empty labels for all entries", () => {
    for (const entry of DRILL_TYPES) {
      expect(entry.label.length).toBeGreaterThan(0);
    }
  });
});

// ── EMERGENCY_CONTACT_TYPES constant ─────────────────────────────────────

describe("EMERGENCY_CONTACT_TYPES", () => {
  it("contains exactly 14 contact types", () => {
    expect(EMERGENCY_CONTACT_TYPES).toHaveLength(14);
  });

  it("has correct shape for every entry", () => {
    for (const entry of EMERGENCY_CONTACT_TYPES) {
      expect(entry).toHaveProperty("type");
      expect(entry).toHaveProperty("label");
      expect(typeof entry.type).toBe("string");
      expect(typeof entry.label).toBe("string");
    }
  });

  it("has unique type values", () => {
    const types = EMERGENCY_CONTACT_TYPES.map((c) => c.type);
    expect(new Set(types).size).toBe(types.length);
  });

  it("includes fire_service", () => {
    const entry = EMERGENCY_CONTACT_TYPES.find((c) => c.type === "fire_service");
    expect(entry).toBeDefined();
    expect(entry!.label).toBe("Fire & Rescue Service");
  });

  it("includes ofsted", () => {
    const entry = EMERGENCY_CONTACT_TYPES.find((c) => c.type === "ofsted");
    expect(entry).toBeDefined();
    expect(entry!.label).toBe("Ofsted");
  });

  it("includes lado", () => {
    const entry = EMERGENCY_CONTACT_TYPES.find((c) => c.type === "lado");
    expect(entry).toBeDefined();
    expect(entry!.label).toBe("LADO");
  });

  it("includes camhs", () => {
    const entry = EMERGENCY_CONTACT_TYPES.find((c) => c.type === "camhs");
    expect(entry).toBeDefined();
    expect(entry!.label).toBe("CAMHS Crisis Team");
  });

  it("includes registered_manager", () => {
    const entry = EMERGENCY_CONTACT_TYPES.find((c) => c.type === "registered_manager");
    expect(entry).toBeDefined();
  });

  it("has non-empty labels for all entries", () => {
    for (const entry of EMERGENCY_CONTACT_TYPES) {
      expect(entry.label.length).toBeGreaterThan(0);
    }
  });
});

// ── CONTINGENCY_PLAN_TYPES constant ──────────────────────────────────────

describe("CONTINGENCY_PLAN_TYPES", () => {
  it("contains exactly 10 plan types", () => {
    expect(CONTINGENCY_PLAN_TYPES).toHaveLength(10);
  });

  it("has correct shape for every entry", () => {
    for (const entry of CONTINGENCY_PLAN_TYPES) {
      expect(entry).toHaveProperty("type");
      expect(entry).toHaveProperty("label");
      expect(typeof entry.type).toBe("string");
      expect(typeof entry.label).toBe("string");
    }
  });

  it("has unique type values", () => {
    const types = CONTINGENCY_PLAN_TYPES.map((p) => p.type);
    expect(new Set(types).size).toBe(types.length);
  });

  it("includes fire plan type", () => {
    const entry = CONTINGENCY_PLAN_TYPES.find((p) => p.type === "fire");
    expect(entry).toBeDefined();
    expect(entry!.label).toBe("Fire & Evacuation");
  });

  it("includes missing_child plan type", () => {
    const entry = CONTINGENCY_PLAN_TYPES.find((p) => p.type === "missing_child");
    expect(entry).toBeDefined();
    expect(entry!.label).toBe("Missing Child");
  });

  it("includes staffing_crisis plan type", () => {
    const entry = CONTINGENCY_PLAN_TYPES.find((p) => p.type === "staffing_crisis");
    expect(entry).toBeDefined();
    expect(entry!.label).toBe("Staffing Crisis");
  });

  it("includes serious_incident plan type", () => {
    const entry = CONTINGENCY_PLAN_TYPES.find((p) => p.type === "serious_incident");
    expect(entry).toBeDefined();
    expect(entry!.label).toBe("Serious Incident");
  });

  it("includes data_breach plan type", () => {
    const entry = CONTINGENCY_PLAN_TYPES.find((p) => p.type === "data_breach");
    expect(entry).toBeDefined();
    expect(entry!.label).toBe("Data Breach / IT Failure");
  });

  it("has non-empty labels for all entries", () => {
    for (const entry of CONTINGENCY_PLAN_TYPES) {
      expect(entry.label.length).toBeGreaterThan(0);
    }
  });

  it("contains all four essential plan types required by identifyEmergencyAlerts", () => {
    const types = CONTINGENCY_PLAN_TYPES.map((p) => p.type);
    expect(types).toContain("fire");
    expect(types).toContain("missing_child");
    expect(types).toContain("serious_incident");
    expect(types).toContain("staffing_crisis");
  });
});
