// ══════════════════════════════════════════════════════════════════════════════
// CARA — HEALTH APPOINTMENTS SERVICE TESTS
// Pure-function unit tests for health appointment metrics computation
// and alert identification. CHR 2015 Reg 7 (health needs),
// Reg 10 (children's views — health decisions),
// Reg 33 (health oversight duties).
//
// SCCIF: Health — "Children receive timely healthcare."
// "Health appointments are kept and outcomes recorded."
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "../health-appointments-service";

import type { HealthAppointmentRecord } from "../health-appointments-service";
import { todayStr } from "@/lib/utils";

const { computeHealthAppointmentMetrics, identifyHealthAppointmentAlerts } =
  _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

function daysAgo(n: number): string {
  const d = new Date(todayStr());
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function daysFromNow(n: number): string {
  const d = new Date(todayStr());
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function daysAgoISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

/** Normalised "today" at midnight for overdue comparisons. */
const now = new Date(todayStr());

/** Build a minimal HealthAppointmentRecord with sensible defaults. */
function makeRecord(
  overrides?: Partial<HealthAppointmentRecord>,
): HealthAppointmentRecord {
  return {
    id: overrides?.id ?? crypto.randomUUID(),
    home_id: overrides?.home_id ?? "home-1",
    child_name: overrides?.child_name ?? "Alice Smith",
    child_id:
      "child_id" in (overrides ?? {})
        ? (overrides!.child_id ?? null)
        : null,
    appointment_type: overrides?.appointment_type ?? "gp_visit",
    appointment_date: overrides?.appointment_date ?? daysAgo(3),
    appointment_status: overrides?.appointment_status ?? "attended",
    appointment_outcome: overrides?.appointment_outcome ?? "no_concerns",
    consent_status: overrides?.consent_status ?? "consent_given",
    child_accompanied: overrides?.child_accompanied ?? true,
    accompanied_by:
      "accompanied_by" in (overrides ?? {})
        ? (overrides!.accompanied_by ?? null)
        : null,
    child_views_captured: overrides?.child_views_captured ?? true,
    child_anxious: overrides?.child_anxious ?? false,
    follow_up_date:
      "follow_up_date" in (overrides ?? {})
        ? (overrides!.follow_up_date ?? null)
        : null,
    follow_up_actions: overrides?.follow_up_actions ?? [],
    health_plan_updated: overrides?.health_plan_updated ?? true,
    social_worker_informed: overrides?.social_worker_informed ?? true,
    parent_carer_informed: overrides?.parent_carer_informed ?? true,
    notes:
      "notes" in (overrides ?? {})
        ? (overrides!.notes ?? null)
        : null,
    created_at: overrides?.created_at ?? daysAgoISO(3),
    updated_at: overrides?.updated_at ?? daysAgoISO(3),
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// TESTS
// ══════════════════════════════════════════════════════════════════════════════

describe("health-appointments-service", () => {
  // ────────────────────────────────────────────────────────────────────────
  // computeHealthAppointmentMetrics
  // ────────────────────────────────────────────────────────────────────────
  describe("computeHealthAppointmentMetrics", () => {
    // ── Empty array ──────────────────────────────────────────────────────
    it("returns all zeros for an empty array", () => {
      const m = computeHealthAppointmentMetrics([]);
      expect(m.total_appointments).toBe(0);
      expect(m.gp_count).toBe(0);
      expect(m.dental_count).toBe(0);
      expect(m.optician_count).toBe(0);
      expect(m.camhs_count).toBe(0);
      expect(m.attended_rate).toBeNull();;
      expect(m.missed_count).toBe(0);
      expect(m.cancelled_count).toBe(0);
      expect(m.pending_count).toBe(0);
      expect(m.child_accompanied_rate).toBeNull();;
      expect(m.child_views_captured_rate).toBeNull();;
      expect(m.child_anxious_count).toBe(0);
      expect(m.health_plan_updated_rate).toBeNull();;
      expect(m.social_worker_informed_rate).toBeNull();;
      expect(m.parent_carer_informed_rate).toBeNull();;
      expect(m.follow_up_needed_count).toBe(0);
      expect(m.follow_up_overdue_count).toBe(0);
      expect(m.unique_children).toBe(0);
    });

    it("returns empty breakdown maps for empty array", () => {
      const m = computeHealthAppointmentMetrics([]);
      expect(m.by_appointment_type).toEqual({});
      expect(m.by_appointment_status).toEqual({});
      expect(m.by_appointment_outcome).toEqual({});
      expect(m.by_consent_status).toEqual({});
    });

    // ── total_appointments ───────────────────────────────────────────────
    it("counts a single record", () => {
      const m = computeHealthAppointmentMetrics([makeRecord()]);
      expect(m.total_appointments).toBe(1);
    });

    it("counts multiple records", () => {
      const records = [makeRecord(), makeRecord(), makeRecord()];
      const m = computeHealthAppointmentMetrics(records);
      expect(m.total_appointments).toBe(3);
    });

    it("counts five records correctly", () => {
      const records = Array.from({ length: 5 }, () => makeRecord());
      const m = computeHealthAppointmentMetrics(records);
      expect(m.total_appointments).toBe(5);
    });

    // ── gp_count ─────────────────────────────────────────────────────────
    it("counts gp_visit appointments", () => {
      const records = [
        makeRecord({ appointment_type: "gp_visit" }),
        makeRecord({ appointment_type: "gp_visit" }),
        makeRecord({ appointment_type: "dental_check" }),
      ];
      const m = computeHealthAppointmentMetrics(records);
      expect(m.gp_count).toBe(2);
    });

    it("returns 0 gp_count when none present", () => {
      const m = computeHealthAppointmentMetrics([
        makeRecord({ appointment_type: "dental_check" }),
      ]);
      expect(m.gp_count).toBe(0);
    });

    // ── dental_count ─────────────────────────────────────────────────────
    it("counts dental_check appointments", () => {
      const records = [
        makeRecord({ appointment_type: "dental_check" }),
        makeRecord({ appointment_type: "dental_check" }),
        makeRecord({ appointment_type: "dental_check" }),
      ];
      const m = computeHealthAppointmentMetrics(records);
      expect(m.dental_count).toBe(3);
    });

    it("returns 0 dental_count when none present", () => {
      const m = computeHealthAppointmentMetrics([
        makeRecord({ appointment_type: "gp_visit" }),
      ]);
      expect(m.dental_count).toBe(0);
    });

    // ── optician_count ───────────────────────────────────────────────────
    it("counts optician appointments", () => {
      const records = [
        makeRecord({ appointment_type: "optician" }),
        makeRecord({ appointment_type: "gp_visit" }),
      ];
      const m = computeHealthAppointmentMetrics(records);
      expect(m.optician_count).toBe(1);
    });

    it("returns 0 optician_count when none present", () => {
      const m = computeHealthAppointmentMetrics([
        makeRecord({ appointment_type: "camhs" }),
      ]);
      expect(m.optician_count).toBe(0);
    });

    // ── camhs_count ──────────────────────────────────────────────────────
    it("counts camhs appointments", () => {
      const records = [
        makeRecord({ appointment_type: "camhs" }),
        makeRecord({ appointment_type: "camhs" }),
      ];
      const m = computeHealthAppointmentMetrics(records);
      expect(m.camhs_count).toBe(2);
    });

    it("returns 0 camhs_count when none present", () => {
      const m = computeHealthAppointmentMetrics([
        makeRecord({ appointment_type: "gp_visit" }),
      ]);
      expect(m.camhs_count).toBe(0);
    });

    // ── attended_rate ────────────────────────────────────────────────────
    it("returns 100% attended_rate when all attended", () => {
      const records = [
        makeRecord({ appointment_status: "attended" }),
        makeRecord({ appointment_status: "attended" }),
      ];
      const m = computeHealthAppointmentMetrics(records);
      expect(m.attended_rate).toBe(100);
    });

    it("returns 0% attended_rate when none attended", () => {
      const records = [
        makeRecord({ appointment_status: "missed" }),
        makeRecord({ appointment_status: "missed" }),
      ];
      const m = computeHealthAppointmentMetrics(records);
      expect(m.attended_rate).toBe(0);
    });

    it("returns 50% attended_rate when half attended", () => {
      const records = [
        makeRecord({ appointment_status: "attended" }),
        makeRecord({ appointment_status: "missed" }),
      ];
      const m = computeHealthAppointmentMetrics(records);
      expect(m.attended_rate).toBe(50);
    });

    it("calculates attended_rate with decimal rounding (1 of 3)", () => {
      // 1/3 = 0.3333... => Math.round(333.3) / 10 = 33.3
      const records = [
        makeRecord({ appointment_status: "attended" }),
        makeRecord({ appointment_status: "missed" }),
        makeRecord({ appointment_status: "missed" }),
      ];
      const m = computeHealthAppointmentMetrics(records);
      expect(m.attended_rate).toBe(33.3);
    });

    it("calculates attended_rate with decimal rounding (2 of 3)", () => {
      // 2/3 = 0.6666... => Math.round(666.6) / 10 = 66.7
      const records = [
        makeRecord({ appointment_status: "attended" }),
        makeRecord({ appointment_status: "attended" }),
        makeRecord({ appointment_status: "missed" }),
      ];
      const m = computeHealthAppointmentMetrics(records);
      expect(m.attended_rate).toBe(66.7);
    });

    it("calculates attended_rate 25% (1 of 4)", () => {
      const records = [
        makeRecord({ appointment_status: "attended" }),
        makeRecord({ appointment_status: "missed" }),
        makeRecord({ appointment_status: "missed" }),
        makeRecord({ appointment_status: "pending" }),
      ];
      const m = computeHealthAppointmentMetrics(records);
      expect(m.attended_rate).toBe(25);
    });

    it("calculates attended_rate 75% (3 of 4)", () => {
      const records = [
        makeRecord({ appointment_status: "attended" }),
        makeRecord({ appointment_status: "attended" }),
        makeRecord({ appointment_status: "attended" }),
        makeRecord({ appointment_status: "missed" }),
      ];
      const m = computeHealthAppointmentMetrics(records);
      expect(m.attended_rate).toBe(75);
    });

    // ── missed_count ────────────────────────────────────────────────────
    it("counts missed appointments", () => {
      const records = [
        makeRecord({ appointment_status: "missed" }),
        makeRecord({ appointment_status: "missed" }),
        makeRecord({ appointment_status: "attended" }),
      ];
      const m = computeHealthAppointmentMetrics(records);
      expect(m.missed_count).toBe(2);
    });

    it("returns 0 missed_count when none missed", () => {
      const m = computeHealthAppointmentMetrics([
        makeRecord({ appointment_status: "attended" }),
      ]);
      expect(m.missed_count).toBe(0);
    });

    // ── cancelled_count ─────────────────────────────────────────────────
    it("counts cancelled_by_child as cancelled", () => {
      const m = computeHealthAppointmentMetrics([
        makeRecord({ appointment_status: "cancelled_by_child" }),
      ]);
      expect(m.cancelled_count).toBe(1);
    });

    it("counts cancelled_by_service as cancelled", () => {
      const m = computeHealthAppointmentMetrics([
        makeRecord({ appointment_status: "cancelled_by_service" }),
      ]);
      expect(m.cancelled_count).toBe(1);
    });

    it("counts both cancellation types together", () => {
      const records = [
        makeRecord({ appointment_status: "cancelled_by_child" }),
        makeRecord({ appointment_status: "cancelled_by_service" }),
        makeRecord({ appointment_status: "cancelled_by_child" }),
      ];
      const m = computeHealthAppointmentMetrics(records);
      expect(m.cancelled_count).toBe(3);
    });

    it("does not count other statuses as cancelled", () => {
      const records = [
        makeRecord({ appointment_status: "attended" }),
        makeRecord({ appointment_status: "missed" }),
        makeRecord({ appointment_status: "rescheduled" }),
        makeRecord({ appointment_status: "pending" }),
      ];
      const m = computeHealthAppointmentMetrics(records);
      expect(m.cancelled_count).toBe(0);
    });

    // ── pending_count ───────────────────────────────────────────────────
    it("counts pending appointments", () => {
      const records = [
        makeRecord({ appointment_status: "pending" }),
        makeRecord({ appointment_status: "pending" }),
        makeRecord({ appointment_status: "attended" }),
      ];
      const m = computeHealthAppointmentMetrics(records);
      expect(m.pending_count).toBe(2);
    });

    it("returns 0 pending_count when none pending", () => {
      const m = computeHealthAppointmentMetrics([
        makeRecord({ appointment_status: "attended" }),
      ]);
      expect(m.pending_count).toBe(0);
    });

    // ── child_accompanied_rate ──────────────────────────────────────────
    it("returns 100% child_accompanied_rate when all accompanied", () => {
      const records = [
        makeRecord({ child_accompanied: true }),
        makeRecord({ child_accompanied: true }),
      ];
      const m = computeHealthAppointmentMetrics(records);
      expect(m.child_accompanied_rate).toBe(100);
    });

    it("returns 0% child_accompanied_rate when none accompanied", () => {
      const records = [
        makeRecord({ child_accompanied: false }),
        makeRecord({ child_accompanied: false }),
      ];
      const m = computeHealthAppointmentMetrics(records);
      expect(m.child_accompanied_rate).toBe(0);
    });

    it("returns 50% child_accompanied_rate when half accompanied", () => {
      const records = [
        makeRecord({ child_accompanied: true }),
        makeRecord({ child_accompanied: false }),
      ];
      const m = computeHealthAppointmentMetrics(records);
      expect(m.child_accompanied_rate).toBe(50);
    });

    it("calculates child_accompanied_rate with rounding (1 of 3)", () => {
      const records = [
        makeRecord({ child_accompanied: true }),
        makeRecord({ child_accompanied: false }),
        makeRecord({ child_accompanied: false }),
      ];
      const m = computeHealthAppointmentMetrics(records);
      expect(m.child_accompanied_rate).toBe(33.3);
    });

    // ── child_views_captured_rate ───────────────────────────────────────
    it("returns 100% child_views_captured_rate when all captured", () => {
      const records = [
        makeRecord({ child_views_captured: true }),
        makeRecord({ child_views_captured: true }),
      ];
      const m = computeHealthAppointmentMetrics(records);
      expect(m.child_views_captured_rate).toBe(100);
    });

    it("returns 0% child_views_captured_rate when none captured", () => {
      const records = [
        makeRecord({ child_views_captured: false }),
        makeRecord({ child_views_captured: false }),
      ];
      const m = computeHealthAppointmentMetrics(records);
      expect(m.child_views_captured_rate).toBe(0);
    });

    it("returns 50% child_views_captured_rate when half captured", () => {
      const records = [
        makeRecord({ child_views_captured: true }),
        makeRecord({ child_views_captured: false }),
      ];
      const m = computeHealthAppointmentMetrics(records);
      expect(m.child_views_captured_rate).toBe(50);
    });

    it("calculates child_views_captured_rate with rounding (2 of 3)", () => {
      const records = [
        makeRecord({ child_views_captured: true }),
        makeRecord({ child_views_captured: true }),
        makeRecord({ child_views_captured: false }),
      ];
      const m = computeHealthAppointmentMetrics(records);
      expect(m.child_views_captured_rate).toBe(66.7);
    });

    // ── child_anxious_count ─────────────────────────────────────────────
    it("counts anxious children", () => {
      const records = [
        makeRecord({ child_anxious: true }),
        makeRecord({ child_anxious: true }),
        makeRecord({ child_anxious: false }),
      ];
      const m = computeHealthAppointmentMetrics(records);
      expect(m.child_anxious_count).toBe(2);
    });

    it("returns 0 child_anxious_count when none anxious", () => {
      const records = [
        makeRecord({ child_anxious: false }),
        makeRecord({ child_anxious: false }),
      ];
      const m = computeHealthAppointmentMetrics(records);
      expect(m.child_anxious_count).toBe(0);
    });

    it("counts all anxious when all true", () => {
      const records = [
        makeRecord({ child_anxious: true }),
        makeRecord({ child_anxious: true }),
      ];
      const m = computeHealthAppointmentMetrics(records);
      expect(m.child_anxious_count).toBe(2);
    });

    // ── health_plan_updated_rate ────────────────────────────────────────
    it("returns 100% health_plan_updated_rate when all updated", () => {
      const records = [
        makeRecord({ health_plan_updated: true }),
        makeRecord({ health_plan_updated: true }),
      ];
      const m = computeHealthAppointmentMetrics(records);
      expect(m.health_plan_updated_rate).toBe(100);
    });

    it("returns 0% health_plan_updated_rate when none updated", () => {
      const records = [
        makeRecord({ health_plan_updated: false }),
        makeRecord({ health_plan_updated: false }),
      ];
      const m = computeHealthAppointmentMetrics(records);
      expect(m.health_plan_updated_rate).toBe(0);
    });

    it("returns 50% health_plan_updated_rate when half updated", () => {
      const records = [
        makeRecord({ health_plan_updated: true }),
        makeRecord({ health_plan_updated: false }),
      ];
      const m = computeHealthAppointmentMetrics(records);
      expect(m.health_plan_updated_rate).toBe(50);
    });

    it("calculates health_plan_updated_rate with rounding (1 of 3)", () => {
      const records = [
        makeRecord({ health_plan_updated: true }),
        makeRecord({ health_plan_updated: false }),
        makeRecord({ health_plan_updated: false }),
      ];
      const m = computeHealthAppointmentMetrics(records);
      expect(m.health_plan_updated_rate).toBe(33.3);
    });

    // ── social_worker_informed_rate ────────────────────────────────────
    it("returns 100% social_worker_informed_rate when all informed", () => {
      const records = [
        makeRecord({ social_worker_informed: true }),
        makeRecord({ social_worker_informed: true }),
      ];
      const m = computeHealthAppointmentMetrics(records);
      expect(m.social_worker_informed_rate).toBe(100);
    });

    it("returns 0% social_worker_informed_rate when none informed", () => {
      const records = [
        makeRecord({ social_worker_informed: false }),
        makeRecord({ social_worker_informed: false }),
      ];
      const m = computeHealthAppointmentMetrics(records);
      expect(m.social_worker_informed_rate).toBe(0);
    });

    it("returns 50% social_worker_informed_rate when half informed", () => {
      const records = [
        makeRecord({ social_worker_informed: true }),
        makeRecord({ social_worker_informed: false }),
      ];
      const m = computeHealthAppointmentMetrics(records);
      expect(m.social_worker_informed_rate).toBe(50);
    });

    it("calculates social_worker_informed_rate with rounding (2 of 3)", () => {
      const records = [
        makeRecord({ social_worker_informed: true }),
        makeRecord({ social_worker_informed: true }),
        makeRecord({ social_worker_informed: false }),
      ];
      const m = computeHealthAppointmentMetrics(records);
      expect(m.social_worker_informed_rate).toBe(66.7);
    });

    // ── parent_carer_informed_rate ──────────────────────────────────────
    it("returns 100% parent_carer_informed_rate when all informed", () => {
      const records = [
        makeRecord({ parent_carer_informed: true }),
        makeRecord({ parent_carer_informed: true }),
      ];
      const m = computeHealthAppointmentMetrics(records);
      expect(m.parent_carer_informed_rate).toBe(100);
    });

    it("returns 0% parent_carer_informed_rate when none informed", () => {
      const records = [
        makeRecord({ parent_carer_informed: false }),
        makeRecord({ parent_carer_informed: false }),
      ];
      const m = computeHealthAppointmentMetrics(records);
      expect(m.parent_carer_informed_rate).toBe(0);
    });

    it("returns 50% parent_carer_informed_rate when half informed", () => {
      const records = [
        makeRecord({ parent_carer_informed: true }),
        makeRecord({ parent_carer_informed: false }),
      ];
      const m = computeHealthAppointmentMetrics(records);
      expect(m.parent_carer_informed_rate).toBe(50);
    });

    it("calculates parent_carer_informed_rate with rounding (1 of 3)", () => {
      const records = [
        makeRecord({ parent_carer_informed: true }),
        makeRecord({ parent_carer_informed: false }),
        makeRecord({ parent_carer_informed: false }),
      ];
      const m = computeHealthAppointmentMetrics(records);
      expect(m.parent_carer_informed_rate).toBe(33.3);
    });

    // ── follow_up_needed_count ──────────────────────────────────────────
    it("counts follow_up_needed outcomes", () => {
      const records = [
        makeRecord({ appointment_outcome: "follow_up_needed" }),
        makeRecord({ appointment_outcome: "follow_up_needed" }),
        makeRecord({ appointment_outcome: "no_concerns" }),
      ];
      const m = computeHealthAppointmentMetrics(records);
      expect(m.follow_up_needed_count).toBe(2);
    });

    it("returns 0 follow_up_needed_count when no follow-ups", () => {
      const records = [
        makeRecord({ appointment_outcome: "no_concerns" }),
        makeRecord({ appointment_outcome: "treatment_given" }),
      ];
      const m = computeHealthAppointmentMetrics(records);
      expect(m.follow_up_needed_count).toBe(0);
    });

    it("does not count other outcomes as follow_up_needed", () => {
      const records = [
        makeRecord({ appointment_outcome: "referral_made" }),
        makeRecord({ appointment_outcome: "medication_prescribed" }),
        makeRecord({ appointment_outcome: "not_applicable" }),
      ];
      const m = computeHealthAppointmentMetrics(records);
      expect(m.follow_up_needed_count).toBe(0);
    });

    // ── follow_up_overdue_count ─────────────────────────────────────────
    it("counts overdue follow-ups with past date", () => {
      const records = [
        makeRecord({ follow_up_date: daysAgo(5) }),
        makeRecord({ follow_up_date: daysAgo(10) }),
      ];
      const m = computeHealthAppointmentMetrics(records);
      expect(m.follow_up_overdue_count).toBe(2);
    });

    it("does not count future follow-up dates as overdue", () => {
      const records = [
        makeRecord({ follow_up_date: daysFromNow(5) }),
        makeRecord({ follow_up_date: daysFromNow(10) }),
      ];
      const m = computeHealthAppointmentMetrics(records);
      expect(m.follow_up_overdue_count).toBe(0);
    });

    it("does not count null follow-up dates as overdue", () => {
      const records = [
        makeRecord({ follow_up_date: null }),
        makeRecord({ follow_up_date: null }),
      ];
      const m = computeHealthAppointmentMetrics(records);
      expect(m.follow_up_overdue_count).toBe(0);
    });

    it("mixes past, future, and null follow-up dates", () => {
      const records = [
        makeRecord({ follow_up_date: daysAgo(5) }),
        makeRecord({ follow_up_date: daysFromNow(5) }),
        makeRecord({ follow_up_date: null }),
      ];
      const m = computeHealthAppointmentMetrics(records);
      expect(m.follow_up_overdue_count).toBe(1);
    });

    it("records without follow_up_date key default to no overdue", () => {
      const records = [makeRecord()];
      const m = computeHealthAppointmentMetrics(records);
      expect(m.follow_up_overdue_count).toBe(0);
    });

    // ── unique_children ─────────────────────────────────────────────────
    it("counts unique children by name", () => {
      const records = [
        makeRecord({ child_name: "Alice" }),
        makeRecord({ child_name: "Bob" }),
        makeRecord({ child_name: "Charlie" }),
      ];
      const m = computeHealthAppointmentMetrics(records);
      expect(m.unique_children).toBe(3);
    });

    it("deduplicates same child name", () => {
      const records = [
        makeRecord({ child_name: "Alice" }),
        makeRecord({ child_name: "Alice" }),
        makeRecord({ child_name: "Bob" }),
      ];
      const m = computeHealthAppointmentMetrics(records);
      expect(m.unique_children).toBe(2);
    });

    it("returns 1 for single child with multiple appointments", () => {
      const records = [
        makeRecord({ child_name: "Alice" }),
        makeRecord({ child_name: "Alice" }),
        makeRecord({ child_name: "Alice" }),
      ];
      const m = computeHealthAppointmentMetrics(records);
      expect(m.unique_children).toBe(1);
    });

    it("returns 0 unique_children for empty array", () => {
      const m = computeHealthAppointmentMetrics([]);
      expect(m.unique_children).toBe(0);
    });

    // ── by_appointment_type breakdown ───────────────────────────────────
    it("breaks down by single appointment type", () => {
      const records = [
        makeRecord({ appointment_type: "gp_visit" }),
        makeRecord({ appointment_type: "gp_visit" }),
      ];
      const m = computeHealthAppointmentMetrics(records);
      expect(m.by_appointment_type).toEqual({ gp_visit: 2 });
    });

    it("breaks down by multiple appointment types", () => {
      const records = [
        makeRecord({ appointment_type: "gp_visit" }),
        makeRecord({ appointment_type: "dental_check" }),
        makeRecord({ appointment_type: "optician" }),
        makeRecord({ appointment_type: "camhs" }),
        makeRecord({ appointment_type: "gp_visit" }),
      ];
      const m = computeHealthAppointmentMetrics(records);
      expect(m.by_appointment_type).toEqual({
        gp_visit: 2,
        dental_check: 1,
        optician: 1,
        camhs: 1,
      });
    });

    it("includes specialist, health_assessment, immunisation types", () => {
      const records = [
        makeRecord({ appointment_type: "specialist" }),
        makeRecord({ appointment_type: "health_assessment" }),
        makeRecord({ appointment_type: "immunisation" }),
      ];
      const m = computeHealthAppointmentMetrics(records);
      expect(m.by_appointment_type).toEqual({
        specialist: 1,
        health_assessment: 1,
        immunisation: 1,
      });
    });

    it("includes hospital, sexual_health, other types", () => {
      const records = [
        makeRecord({ appointment_type: "hospital" }),
        makeRecord({ appointment_type: "sexual_health" }),
        makeRecord({ appointment_type: "other" }),
      ];
      const m = computeHealthAppointmentMetrics(records);
      expect(m.by_appointment_type).toEqual({
        hospital: 1,
        sexual_health: 1,
        other: 1,
      });
    });

    // ── by_appointment_status breakdown ──────────────────────────────────
    it("breaks down by single appointment status", () => {
      const records = [
        makeRecord({ appointment_status: "attended" }),
        makeRecord({ appointment_status: "attended" }),
      ];
      const m = computeHealthAppointmentMetrics(records);
      expect(m.by_appointment_status).toEqual({ attended: 2 });
    });

    it("breaks down by multiple appointment statuses", () => {
      const records = [
        makeRecord({ appointment_status: "attended" }),
        makeRecord({ appointment_status: "missed" }),
        makeRecord({ appointment_status: "cancelled_by_child" }),
        makeRecord({ appointment_status: "cancelled_by_service" }),
        makeRecord({ appointment_status: "rescheduled" }),
        makeRecord({ appointment_status: "pending" }),
      ];
      const m = computeHealthAppointmentMetrics(records);
      expect(m.by_appointment_status).toEqual({
        attended: 1,
        missed: 1,
        cancelled_by_child: 1,
        cancelled_by_service: 1,
        rescheduled: 1,
        pending: 1,
      });
    });

    it("accumulates counts for repeated statuses", () => {
      const records = [
        makeRecord({ appointment_status: "missed" }),
        makeRecord({ appointment_status: "missed" }),
        makeRecord({ appointment_status: "missed" }),
      ];
      const m = computeHealthAppointmentMetrics(records);
      expect(m.by_appointment_status).toEqual({ missed: 3 });
    });

    // ── by_appointment_outcome breakdown ─────────────────────────────────
    it("breaks down by single outcome", () => {
      const records = [
        makeRecord({ appointment_outcome: "no_concerns" }),
        makeRecord({ appointment_outcome: "no_concerns" }),
      ];
      const m = computeHealthAppointmentMetrics(records);
      expect(m.by_appointment_outcome).toEqual({ no_concerns: 2 });
    });

    it("breaks down by all outcome types", () => {
      const records = [
        makeRecord({ appointment_outcome: "no_concerns" }),
        makeRecord({ appointment_outcome: "treatment_given" }),
        makeRecord({ appointment_outcome: "referral_made" }),
        makeRecord({ appointment_outcome: "follow_up_needed" }),
        makeRecord({ appointment_outcome: "medication_prescribed" }),
        makeRecord({ appointment_outcome: "not_applicable" }),
      ];
      const m = computeHealthAppointmentMetrics(records);
      expect(m.by_appointment_outcome).toEqual({
        no_concerns: 1,
        treatment_given: 1,
        referral_made: 1,
        follow_up_needed: 1,
        medication_prescribed: 1,
        not_applicable: 1,
      });
    });

    // ── by_consent_status breakdown ─────────────────────────────────────
    it("breaks down by single consent status", () => {
      const records = [
        makeRecord({ consent_status: "consent_given" }),
        makeRecord({ consent_status: "consent_given" }),
      ];
      const m = computeHealthAppointmentMetrics(records);
      expect(m.by_consent_status).toEqual({ consent_given: 2 });
    });

    it("breaks down by all consent statuses", () => {
      const records = [
        makeRecord({ consent_status: "consent_given" }),
        makeRecord({ consent_status: "consent_refused" }),
        makeRecord({ consent_status: "gillick_competent" }),
        makeRecord({ consent_status: "delegated_authority" }),
        makeRecord({ consent_status: "not_required" }),
      ];
      const m = computeHealthAppointmentMetrics(records);
      expect(m.by_consent_status).toEqual({
        consent_given: 1,
        consent_refused: 1,
        gillick_competent: 1,
        delegated_authority: 1,
        not_required: 1,
      });
    });

    it("accumulates consent counts", () => {
      const records = [
        makeRecord({ consent_status: "consent_refused" }),
        makeRecord({ consent_status: "consent_refused" }),
        makeRecord({ consent_status: "consent_given" }),
      ];
      const m = computeHealthAppointmentMetrics(records);
      expect(m.by_consent_status).toEqual({
        consent_refused: 2,
        consent_given: 1,
      });
    });

    // ── Mixed dataset ───────────────────────────────────────────────────
    it("handles a mixed dataset correctly", () => {
      const records = [
        makeRecord({
          child_name: "Alice",
          appointment_type: "gp_visit",
          appointment_status: "attended",
          appointment_outcome: "no_concerns",
          child_accompanied: true,
          child_views_captured: true,
          child_anxious: false,
          health_plan_updated: true,
          social_worker_informed: true,
          parent_carer_informed: true,
        }),
        makeRecord({
          child_name: "Bob",
          appointment_type: "dental_check",
          appointment_status: "missed",
          appointment_outcome: "not_applicable",
          child_accompanied: false,
          child_views_captured: false,
          child_anxious: true,
          health_plan_updated: false,
          social_worker_informed: false,
          parent_carer_informed: false,
        }),
        makeRecord({
          child_name: "Alice",
          appointment_type: "camhs",
          appointment_status: "attended",
          appointment_outcome: "follow_up_needed",
          child_accompanied: true,
          child_views_captured: true,
          child_anxious: true,
          health_plan_updated: true,
          social_worker_informed: true,
          parent_carer_informed: false,
          follow_up_date: daysAgo(2),
        }),
        makeRecord({
          child_name: "Charlie",
          appointment_type: "optician",
          appointment_status: "cancelled_by_child",
          appointment_outcome: "not_applicable",
          child_accompanied: false,
          child_views_captured: false,
          child_anxious: false,
          health_plan_updated: false,
          social_worker_informed: false,
          parent_carer_informed: true,
        }),
      ];
      const m = computeHealthAppointmentMetrics(records);

      expect(m.total_appointments).toBe(4);
      expect(m.gp_count).toBe(1);
      expect(m.dental_count).toBe(1);
      expect(m.optician_count).toBe(1);
      expect(m.camhs_count).toBe(1);
      expect(m.attended_rate).toBe(50); // 2/4
      expect(m.missed_count).toBe(1);
      expect(m.cancelled_count).toBe(1);
      expect(m.pending_count).toBe(0);
      expect(m.child_accompanied_rate).toBe(50); // 2/4
      expect(m.child_views_captured_rate).toBe(50); // 2/4
      expect(m.child_anxious_count).toBe(2);
      expect(m.health_plan_updated_rate).toBe(50); // 2/4
      expect(m.social_worker_informed_rate).toBe(50); // 2/4
      expect(m.parent_carer_informed_rate).toBe(50); // 2/4
      expect(m.follow_up_needed_count).toBe(1);
      expect(m.follow_up_overdue_count).toBe(1);
      expect(m.unique_children).toBe(3);
    });

    it("mixed dataset produces correct breakdowns", () => {
      const records = [
        makeRecord({
          appointment_type: "gp_visit",
          appointment_status: "attended",
          appointment_outcome: "no_concerns",
          consent_status: "consent_given",
        }),
        makeRecord({
          appointment_type: "dental_check",
          appointment_status: "missed",
          appointment_outcome: "not_applicable",
          consent_status: "consent_refused",
        }),
        makeRecord({
          appointment_type: "gp_visit",
          appointment_status: "pending",
          appointment_outcome: "not_applicable",
          consent_status: "consent_given",
        }),
      ];
      const m = computeHealthAppointmentMetrics(records);
      expect(m.by_appointment_type).toEqual({ gp_visit: 2, dental_check: 1 });
      expect(m.by_appointment_status).toEqual({
        attended: 1,
        missed: 1,
        pending: 1,
      });
      expect(m.by_appointment_outcome).toEqual({
        no_concerns: 1,
        not_applicable: 2,
      });
      expect(m.by_consent_status).toEqual({
        consent_given: 2,
        consent_refused: 1,
      });
    });

    // ── Single record metrics ────────────────────────────────────────────
    it("single attended record gives 100% rates", () => {
      const m = computeHealthAppointmentMetrics([
        makeRecord({
          appointment_status: "attended",
          child_accompanied: true,
          child_views_captured: true,
          health_plan_updated: true,
          social_worker_informed: true,
          parent_carer_informed: true,
        }),
      ]);
      expect(m.total_appointments).toBe(1);
      expect(m.attended_rate).toBe(100);
      expect(m.child_accompanied_rate).toBe(100);
      expect(m.child_views_captured_rate).toBe(100);
      expect(m.health_plan_updated_rate).toBe(100);
      expect(m.social_worker_informed_rate).toBe(100);
      expect(m.parent_carer_informed_rate).toBe(100);
    });

    it("single record with all false booleans gives 0% rates", () => {
      const m = computeHealthAppointmentMetrics([
        makeRecord({
          appointment_status: "missed",
          child_accompanied: false,
          child_views_captured: false,
          health_plan_updated: false,
          social_worker_informed: false,
          parent_carer_informed: false,
        }),
      ]);
      expect(m.attended_rate).toBe(0);
      expect(m.child_accompanied_rate).toBe(0);
      expect(m.child_views_captured_rate).toBe(0);
      expect(m.health_plan_updated_rate).toBe(0);
      expect(m.social_worker_informed_rate).toBe(0);
      expect(m.parent_carer_informed_rate).toBe(0);
    });

    it("single record populates all breakdown maps", () => {
      const m = computeHealthAppointmentMetrics([
        makeRecord({
          appointment_type: "camhs",
          appointment_status: "attended",
          appointment_outcome: "treatment_given",
          consent_status: "gillick_competent",
        }),
      ]);
      expect(m.by_appointment_type).toEqual({ camhs: 1 });
      expect(m.by_appointment_status).toEqual({ attended: 1 });
      expect(m.by_appointment_outcome).toEqual({ treatment_given: 1 });
      expect(m.by_consent_status).toEqual({ gillick_competent: 1 });
    });

    it("single record unique_children is 1", () => {
      const m = computeHealthAppointmentMetrics([makeRecord()]);
      expect(m.unique_children).toBe(1);
    });

    // ── Large dataset (20+ records) ─────────────────────────────────────
    it("handles a large dataset of 20 records", () => {
      const names = ["Alice", "Bob", "Charlie", "Diana", "Eve"];
      const types: HealthAppointmentRecord["appointment_type"][] = [
        "gp_visit",
        "dental_check",
        "optician",
        "camhs",
        "specialist",
      ];
      const statuses: HealthAppointmentRecord["appointment_status"][] = [
        "attended",
        "attended",
        "attended",
        "missed",
        "pending",
      ];
      const records = Array.from({ length: 20 }, (_, i) =>
        makeRecord({
          child_name: names[i % names.length],
          appointment_type: types[i % types.length],
          appointment_status: statuses[i % statuses.length],
        }),
      );
      const m = computeHealthAppointmentMetrics(records);

      expect(m.total_appointments).toBe(20);
      expect(m.unique_children).toBe(5);
      // 4 repeats of each type => 4 each
      expect(m.gp_count).toBe(4);
      expect(m.dental_count).toBe(4);
      expect(m.optician_count).toBe(4);
      expect(m.camhs_count).toBe(4);
      // attended: indices 0,1,2, 5,6,7, 10,11,12, 15,16,17 = 12 attended
      expect(m.attended_rate).toBe(60); // 12/20
      expect(m.missed_count).toBe(4); // indices 3,8,13,18
      expect(m.pending_count).toBe(4); // indices 4,9,14,19
    });

    it("handles 25 records with varied data", () => {
      const records = Array.from({ length: 25 }, (_, i) =>
        makeRecord({
          child_name: `Child ${i % 8}`,
          appointment_type: i % 2 === 0 ? "gp_visit" : "dental_check",
          appointment_status: i % 5 === 0 ? "missed" : "attended",
          child_anxious: i % 3 === 0,
        }),
      );
      const m = computeHealthAppointmentMetrics(records);

      expect(m.total_appointments).toBe(25);
      expect(m.unique_children).toBe(8);
      expect(m.gp_count).toBe(13); // even indices 0..24
      expect(m.dental_count).toBe(12); // odd indices
      // missed: 0,5,10,15,20 = 5
      expect(m.missed_count).toBe(5);
      // attended: 25-5 = 20
      expect(m.attended_rate).toBe(80); // 20/25
      // anxious: 0,3,6,9,12,15,18,21,24 = 9
      expect(m.child_anxious_count).toBe(9);
    });

    // ── Rate rounding edge cases ────────────────────────────────────────
    it("rate rounding: 1 of 6 => 16.7%", () => {
      const records = [
        makeRecord({ child_accompanied: true }),
        ...Array.from({ length: 5 }, () =>
          makeRecord({ child_accompanied: false }),
        ),
      ];
      const m = computeHealthAppointmentMetrics(records);
      // 1/6 = 0.1666... => Math.round(166.6) / 10 = 16.7
      expect(m.child_accompanied_rate).toBe(16.7);
    });

    it("rate rounding: 5 of 6 => 83.3%", () => {
      const records = [
        ...Array.from({ length: 5 }, () =>
          makeRecord({ child_accompanied: true }),
        ),
        makeRecord({ child_accompanied: false }),
      ];
      const m = computeHealthAppointmentMetrics(records);
      // 5/6 = 0.8333... => Math.round(833.3) / 10 = 83.3
      expect(m.child_accompanied_rate).toBe(83.3);
    });

    it("rate rounding: 1 of 7 => 14.3%", () => {
      const records = [
        makeRecord({ social_worker_informed: true }),
        ...Array.from({ length: 6 }, () =>
          makeRecord({ social_worker_informed: false }),
        ),
      ];
      const m = computeHealthAppointmentMetrics(records);
      // 1/7 = 0.142857... => Math.round(142.857) / 10 = 14.3
      expect(m.social_worker_informed_rate).toBe(14.3);
    });

    it("rate rounding: 3 of 7 => 42.9%", () => {
      const records = [
        ...Array.from({ length: 3 }, () =>
          makeRecord({ parent_carer_informed: true }),
        ),
        ...Array.from({ length: 4 }, () =>
          makeRecord({ parent_carer_informed: false }),
        ),
      ];
      const m = computeHealthAppointmentMetrics(records);
      // 3/7 = 0.428571... => Math.round(428.571) / 10 = 42.9
      expect(m.parent_carer_informed_rate).toBe(42.9);
    });

    // ── Appointment types not covered by named counts ───────────────────
    it("specialist type not in gp/dental/optician/camhs counts", () => {
      const records = [
        makeRecord({ appointment_type: "specialist" }),
        makeRecord({ appointment_type: "health_assessment" }),
        makeRecord({ appointment_type: "immunisation" }),
        makeRecord({ appointment_type: "hospital" }),
        makeRecord({ appointment_type: "sexual_health" }),
        makeRecord({ appointment_type: "other" }),
      ];
      const m = computeHealthAppointmentMetrics(records);
      expect(m.gp_count).toBe(0);
      expect(m.dental_count).toBe(0);
      expect(m.optician_count).toBe(0);
      expect(m.camhs_count).toBe(0);
      expect(m.total_appointments).toBe(6);
    });

    // ── Rescheduled status ──────────────────────────────────────────────
    it("rescheduled status is not counted as missed, cancelled, or pending", () => {
      const records = [
        makeRecord({ appointment_status: "rescheduled" }),
        makeRecord({ appointment_status: "rescheduled" }),
      ];
      const m = computeHealthAppointmentMetrics(records);
      expect(m.missed_count).toBe(0);
      expect(m.cancelled_count).toBe(0);
      expect(m.pending_count).toBe(0);
      expect(m.attended_rate).toBe(0);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // identifyHealthAppointmentAlerts
  // ────────────────────────────────────────────────────────────────────────
  describe("identifyHealthAppointmentAlerts", () => {
    // ── Empty array ─────────────────────────────────────────────────────
    it("returns no alerts for empty array", () => {
      const alerts = identifyHealthAppointmentAlerts([]);
      expect(alerts).toEqual([]);
    });

    // ── consent_refused ──────────────────────────────────────────────────
    it("fires consent_refused alert for consent_refused + non-attended", () => {
      const r = makeRecord({
        id: "rec-1",
        child_name: "Alice",
        appointment_type: "gp_visit",
        appointment_date: "2025-06-01",
        consent_status: "consent_refused",
        appointment_status: "missed",
      });
      const alerts = identifyHealthAppointmentAlerts([r]);
      const a = alerts.find((x) => x.type === "consent_refused");
      expect(a).toBeDefined();
      expect(a!.severity).toBe("critical");
      expect(a!.id).toBe("rec-1");
    });

    it("consent_refused alert message includes child name", () => {
      const r = makeRecord({
        id: "rec-1",
        child_name: "Bob",
        appointment_type: "dental_check",
        appointment_date: "2025-07-15",
        consent_status: "consent_refused",
        appointment_status: "pending",
      });
      const alerts = identifyHealthAppointmentAlerts([r]);
      const a = alerts.find((x) => x.type === "consent_refused");
      expect(a!.message).toContain("Bob");
    });

    it("consent_refused alert message includes formatted appointment type", () => {
      const r = makeRecord({
        id: "rec-1",
        child_name: "Alice",
        appointment_type: "dental_check",
        appointment_date: "2025-07-15",
        consent_status: "consent_refused",
        appointment_status: "cancelled_by_child",
      });
      const alerts = identifyHealthAppointmentAlerts([r]);
      const a = alerts.find((x) => x.type === "consent_refused");
      // "dental_check" => "dental check"
      expect(a!.message).toContain("dental check");
    });

    it("consent_refused alert message includes appointment date", () => {
      const r = makeRecord({
        id: "rec-1",
        child_name: "Alice",
        appointment_type: "gp_visit",
        appointment_date: "2025-08-20",
        consent_status: "consent_refused",
        appointment_status: "missed",
      });
      const alerts = identifyHealthAppointmentAlerts([r]);
      const a = alerts.find((x) => x.type === "consent_refused");
      expect(a!.message).toContain("2025-08-20");
    });

    it("consent_refused alert message ends with assess capacity and welfare", () => {
      const r = makeRecord({
        id: "rec-1",
        consent_status: "consent_refused",
        appointment_status: "missed",
      });
      const alerts = identifyHealthAppointmentAlerts([r]);
      const a = alerts.find((x) => x.type === "consent_refused");
      expect(a!.message).toContain("assess capacity and welfare");
    });

    it("does NOT fire consent_refused when appointment_status is attended", () => {
      const r = makeRecord({
        consent_status: "consent_refused",
        appointment_status: "attended",
      });
      const alerts = identifyHealthAppointmentAlerts([r]);
      const consentAlerts = alerts.filter((x) => x.type === "consent_refused");
      expect(consentAlerts).toHaveLength(0);
    });

    it("fires consent_refused for cancelled_by_child status", () => {
      const r = makeRecord({
        consent_status: "consent_refused",
        appointment_status: "cancelled_by_child",
      });
      const alerts = identifyHealthAppointmentAlerts([r]);
      expect(alerts.some((x) => x.type === "consent_refused")).toBe(true);
    });

    it("fires consent_refused for cancelled_by_service status", () => {
      const r = makeRecord({
        consent_status: "consent_refused",
        appointment_status: "cancelled_by_service",
      });
      const alerts = identifyHealthAppointmentAlerts([r]);
      expect(alerts.some((x) => x.type === "consent_refused")).toBe(true);
    });

    it("fires consent_refused for pending status", () => {
      const r = makeRecord({
        consent_status: "consent_refused",
        appointment_status: "pending",
      });
      const alerts = identifyHealthAppointmentAlerts([r]);
      expect(alerts.some((x) => x.type === "consent_refused")).toBe(true);
    });

    it("fires consent_refused for rescheduled status", () => {
      const r = makeRecord({
        consent_status: "consent_refused",
        appointment_status: "rescheduled",
      });
      const alerts = identifyHealthAppointmentAlerts([r]);
      expect(alerts.some((x) => x.type === "consent_refused")).toBe(true);
    });

    it("fires per-record consent_refused — two records two alerts", () => {
      const records = [
        makeRecord({
          id: "rec-a",
          child_name: "Alice",
          consent_status: "consent_refused",
          appointment_status: "missed",
        }),
        makeRecord({
          id: "rec-b",
          child_name: "Bob",
          consent_status: "consent_refused",
          appointment_status: "pending",
        }),
      ];
      const alerts = identifyHealthAppointmentAlerts(records);
      const consentAlerts = alerts.filter((x) => x.type === "consent_refused");
      expect(consentAlerts).toHaveLength(2);
      expect(consentAlerts[0].id).toBe("rec-a");
      expect(consentAlerts[1].id).toBe("rec-b");
    });

    it("does not fire consent_refused for consent_given", () => {
      const r = makeRecord({
        consent_status: "consent_given",
        appointment_status: "missed",
      });
      const alerts = identifyHealthAppointmentAlerts([r]);
      expect(alerts.filter((x) => x.type === "consent_refused")).toHaveLength(
        0,
      );
    });

    it("does not fire consent_refused for gillick_competent", () => {
      const r = makeRecord({
        consent_status: "gillick_competent",
        appointment_status: "missed",
      });
      const alerts = identifyHealthAppointmentAlerts([r]);
      expect(alerts.filter((x) => x.type === "consent_refused")).toHaveLength(
        0,
      );
    });

    it("does not fire consent_refused for delegated_authority", () => {
      const r = makeRecord({
        consent_status: "delegated_authority",
        appointment_status: "missed",
      });
      const alerts = identifyHealthAppointmentAlerts([r]);
      expect(alerts.filter((x) => x.type === "consent_refused")).toHaveLength(
        0,
      );
    });

    it("does not fire consent_refused for not_required", () => {
      const r = makeRecord({
        consent_status: "not_required",
        appointment_status: "missed",
      });
      const alerts = identifyHealthAppointmentAlerts([r]);
      expect(alerts.filter((x) => x.type === "consent_refused")).toHaveLength(
        0,
      );
    });

    it("consent_refused alert replaces underscores in type (gp_visit => gp visit)", () => {
      const r = makeRecord({
        id: "rec-1",
        appointment_type: "gp_visit",
        consent_status: "consent_refused",
        appointment_status: "missed",
      });
      const alerts = identifyHealthAppointmentAlerts([r]);
      const a = alerts.find((x) => x.type === "consent_refused");
      expect(a!.message).toContain("gp visit");
      expect(a!.message).not.toContain("gp_visit");
    });

    it("consent_refused alert replaces underscores for health_assessment", () => {
      const r = makeRecord({
        id: "rec-1",
        appointment_type: "health_assessment",
        consent_status: "consent_refused",
        appointment_status: "missed",
      });
      const alerts = identifyHealthAppointmentAlerts([r]);
      const a = alerts.find((x) => x.type === "consent_refused");
      expect(a!.message).toContain("health assessment");
    });

    // ── missed_appointments ─────────────────────────────────────────────
    it("fires missed_appointments alert for 1 missed", () => {
      const records = [
        makeRecord({ appointment_status: "missed" }),
      ];
      const alerts = identifyHealthAppointmentAlerts(records);
      const a = alerts.find((x) => x.type === "missed_appointments");
      expect(a).toBeDefined();
      expect(a!.severity).toBe("high");
      expect(a!.id).toBe("missed_appointments");
    });

    it("missed_appointments uses singular 'appointment' for 1", () => {
      const alerts = identifyHealthAppointmentAlerts([
        makeRecord({ appointment_status: "missed" }),
      ]);
      const a = alerts.find((x) => x.type === "missed_appointments");
      expect(a!.message).toContain("1 missed appointment ");
      expect(a!.message).not.toContain("appointments");
    });

    it("missed_appointments uses plural 'appointments' for 2+", () => {
      const alerts = identifyHealthAppointmentAlerts([
        makeRecord({ appointment_status: "missed" }),
        makeRecord({ appointment_status: "missed" }),
      ]);
      const a = alerts.find((x) => x.type === "missed_appointments");
      expect(a!.message).toContain("2 missed appointments");
    });

    it("missed_appointments uses plural for 5 missed", () => {
      const records = Array.from({ length: 5 }, () =>
        makeRecord({ appointment_status: "missed" }),
      );
      const alerts = identifyHealthAppointmentAlerts(records);
      const a = alerts.find((x) => x.type === "missed_appointments");
      expect(a!.message).toContain("5 missed appointments");
    });

    it("missed_appointments message includes rebook instruction", () => {
      const alerts = identifyHealthAppointmentAlerts([
        makeRecord({ appointment_status: "missed" }),
      ]);
      const a = alerts.find((x) => x.type === "missed_appointments");
      expect(a!.message).toContain("rebook and investigate barriers");
    });

    it("does not fire missed_appointments when 0 missed", () => {
      const records = [
        makeRecord({ appointment_status: "attended" }),
        makeRecord({ appointment_status: "pending" }),
      ];
      const alerts = identifyHealthAppointmentAlerts(records);
      expect(
        alerts.filter((x) => x.type === "missed_appointments"),
      ).toHaveLength(0);
    });

    it("does not count cancelled as missed for alert threshold", () => {
      const records = [
        makeRecord({ appointment_status: "cancelled_by_child" }),
        makeRecord({ appointment_status: "cancelled_by_service" }),
      ];
      const alerts = identifyHealthAppointmentAlerts(records);
      expect(
        alerts.filter((x) => x.type === "missed_appointments"),
      ).toHaveLength(0);
    });

    // ── follow_up_overdue ───────────────────────────────────────────────
    it("fires follow_up_overdue alert for 1 overdue", () => {
      const records = [
        makeRecord({ follow_up_date: daysAgo(5) }),
      ];
      const alerts = identifyHealthAppointmentAlerts(records);
      const a = alerts.find((x) => x.type === "follow_up_overdue");
      expect(a).toBeDefined();
      expect(a!.severity).toBe("high");
      expect(a!.id).toBe("follow_up_overdue");
    });

    it("follow_up_overdue uses singular for 1 overdue", () => {
      const alerts = identifyHealthAppointmentAlerts([
        makeRecord({ follow_up_date: daysAgo(5) }),
      ]);
      const a = alerts.find((x) => x.type === "follow_up_overdue");
      expect(a!.message).toContain("1 health follow-up is overdue");
    });

    it("follow_up_overdue uses plural for 2+ overdue", () => {
      const alerts = identifyHealthAppointmentAlerts([
        makeRecord({ follow_up_date: daysAgo(5) }),
        makeRecord({ follow_up_date: daysAgo(10) }),
      ]);
      const a = alerts.find((x) => x.type === "follow_up_overdue");
      expect(a!.message).toContain("2 health follow-ups are overdue");
    });

    it("follow_up_overdue uses plural for 4 overdue", () => {
      const records = Array.from({ length: 4 }, () =>
        makeRecord({ follow_up_date: daysAgo(3) }),
      );
      const alerts = identifyHealthAppointmentAlerts(records);
      const a = alerts.find((x) => x.type === "follow_up_overdue");
      expect(a!.message).toContain("4 health follow-ups are overdue");
    });

    it("follow_up_overdue message includes arrange promptly", () => {
      const alerts = identifyHealthAppointmentAlerts([
        makeRecord({ follow_up_date: daysAgo(5) }),
      ]);
      const a = alerts.find((x) => x.type === "follow_up_overdue");
      expect(a!.message).toContain("arrange promptly");
    });

    it("does not fire follow_up_overdue when dates are future", () => {
      const records = [
        makeRecord({ follow_up_date: daysFromNow(5) }),
        makeRecord({ follow_up_date: daysFromNow(10) }),
      ];
      const alerts = identifyHealthAppointmentAlerts(records);
      expect(
        alerts.filter((x) => x.type === "follow_up_overdue"),
      ).toHaveLength(0);
    });

    it("does not fire follow_up_overdue when dates are null", () => {
      const records = [
        makeRecord({ follow_up_date: null }),
        makeRecord({ follow_up_date: null }),
      ];
      const alerts = identifyHealthAppointmentAlerts(records);
      expect(
        alerts.filter((x) => x.type === "follow_up_overdue"),
      ).toHaveLength(0);
    });

    it("fires follow_up_overdue only for past dates in mixed set", () => {
      const records = [
        makeRecord({ follow_up_date: daysAgo(5) }),
        makeRecord({ follow_up_date: daysFromNow(5) }),
        makeRecord({ follow_up_date: null }),
      ];
      const alerts = identifyHealthAppointmentAlerts(records);
      const a = alerts.find((x) => x.type === "follow_up_overdue");
      expect(a).toBeDefined();
      expect(a!.message).toContain("1 health follow-up is overdue");
    });

    // ── views_not_captured ──────────────────────────────────────────────
    it("fires views_not_captured when 3 attended without views", () => {
      const records = Array.from({ length: 3 }, () =>
        makeRecord({
          appointment_status: "attended",
          child_views_captured: false,
        }),
      );
      const alerts = identifyHealthAppointmentAlerts(records);
      const a = alerts.find((x) => x.type === "views_not_captured");
      expect(a).toBeDefined();
      expect(a!.severity).toBe("medium");
      expect(a!.id).toBe("views_not_captured");
    });

    it("views_not_captured message includes count", () => {
      const records = Array.from({ length: 4 }, () =>
        makeRecord({
          appointment_status: "attended",
          child_views_captured: false,
        }),
      );
      const alerts = identifyHealthAppointmentAlerts(records);
      const a = alerts.find((x) => x.type === "views_not_captured");
      expect(a!.message).toContain("4 attended appointments without child views captured");
    });

    it("views_not_captured message includes ensure participation", () => {
      const records = Array.from({ length: 3 }, () =>
        makeRecord({
          appointment_status: "attended",
          child_views_captured: false,
        }),
      );
      const alerts = identifyHealthAppointmentAlerts(records);
      const a = alerts.find((x) => x.type === "views_not_captured");
      expect(a!.message).toContain("ensure participation");
    });

    it("does not fire views_not_captured for exactly 2 attended without views", () => {
      const records = [
        makeRecord({
          appointment_status: "attended",
          child_views_captured: false,
        }),
        makeRecord({
          appointment_status: "attended",
          child_views_captured: false,
        }),
      ];
      const alerts = identifyHealthAppointmentAlerts(records);
      expect(
        alerts.filter((x) => x.type === "views_not_captured"),
      ).toHaveLength(0);
    });

    it("does not fire views_not_captured for 1 attended without views", () => {
      const records = [
        makeRecord({
          appointment_status: "attended",
          child_views_captured: false,
        }),
      ];
      const alerts = identifyHealthAppointmentAlerts(records);
      expect(
        alerts.filter((x) => x.type === "views_not_captured"),
      ).toHaveLength(0);
    });

    it("does not count non-attended records for views_not_captured", () => {
      const records = [
        makeRecord({
          appointment_status: "missed",
          child_views_captured: false,
        }),
        makeRecord({
          appointment_status: "missed",
          child_views_captured: false,
        }),
        makeRecord({
          appointment_status: "missed",
          child_views_captured: false,
        }),
      ];
      const alerts = identifyHealthAppointmentAlerts(records);
      expect(
        alerts.filter((x) => x.type === "views_not_captured"),
      ).toHaveLength(0);
    });

    it("does not count pending records for views_not_captured", () => {
      const records = [
        makeRecord({
          appointment_status: "pending",
          child_views_captured: false,
        }),
        makeRecord({
          appointment_status: "pending",
          child_views_captured: false,
        }),
        makeRecord({
          appointment_status: "pending",
          child_views_captured: false,
        }),
      ];
      const alerts = identifyHealthAppointmentAlerts(records);
      expect(
        alerts.filter((x) => x.type === "views_not_captured"),
      ).toHaveLength(0);
    });

    it("does not count cancelled records for views_not_captured", () => {
      const records = [
        makeRecord({
          appointment_status: "cancelled_by_child",
          child_views_captured: false,
        }),
        makeRecord({
          appointment_status: "cancelled_by_service",
          child_views_captured: false,
        }),
        makeRecord({
          appointment_status: "cancelled_by_child",
          child_views_captured: false,
        }),
      ];
      const alerts = identifyHealthAppointmentAlerts(records);
      expect(
        alerts.filter((x) => x.type === "views_not_captured"),
      ).toHaveLength(0);
    });

    it("views_not_captured only counts attended with false views", () => {
      const records = [
        // These 3 should count
        makeRecord({
          appointment_status: "attended",
          child_views_captured: false,
        }),
        makeRecord({
          appointment_status: "attended",
          child_views_captured: false,
        }),
        makeRecord({
          appointment_status: "attended",
          child_views_captured: false,
        }),
        // These should NOT count
        makeRecord({
          appointment_status: "attended",
          child_views_captured: true,
        }),
        makeRecord({
          appointment_status: "missed",
          child_views_captured: false,
        }),
      ];
      const alerts = identifyHealthAppointmentAlerts(records);
      const a = alerts.find((x) => x.type === "views_not_captured");
      expect(a).toBeDefined();
      expect(a!.message).toContain("3 attended");
    });

    // ── health_plan_not_updated ─────────────────────────────────────────
    it("fires health_plan_not_updated when 2 attended non-no_concerns without update", () => {
      const records = [
        makeRecord({
          appointment_status: "attended",
          appointment_outcome: "treatment_given",
          health_plan_updated: false,
        }),
        makeRecord({
          appointment_status: "attended",
          appointment_outcome: "follow_up_needed",
          health_plan_updated: false,
        }),
      ];
      const alerts = identifyHealthAppointmentAlerts(records);
      const a = alerts.find((x) => x.type === "health_plan_not_updated");
      expect(a).toBeDefined();
      expect(a!.severity).toBe("medium");
      expect(a!.id).toBe("health_plan_not_updated");
    });

    it("health_plan_not_updated message includes count", () => {
      const records = [
        makeRecord({
          appointment_status: "attended",
          appointment_outcome: "referral_made",
          health_plan_updated: false,
        }),
        makeRecord({
          appointment_status: "attended",
          appointment_outcome: "medication_prescribed",
          health_plan_updated: false,
        }),
        makeRecord({
          appointment_status: "attended",
          appointment_outcome: "treatment_given",
          health_plan_updated: false,
        }),
      ];
      const alerts = identifyHealthAppointmentAlerts(records);
      const a = alerts.find((x) => x.type === "health_plan_not_updated");
      expect(a!.message).toContain("3 appointments where health plan not updated after treatment");
    });

    it("health_plan_not_updated message includes review records", () => {
      const records = [
        makeRecord({
          appointment_status: "attended",
          appointment_outcome: "treatment_given",
          health_plan_updated: false,
        }),
        makeRecord({
          appointment_status: "attended",
          appointment_outcome: "referral_made",
          health_plan_updated: false,
        }),
      ];
      const alerts = identifyHealthAppointmentAlerts(records);
      const a = alerts.find((x) => x.type === "health_plan_not_updated");
      expect(a!.message).toContain("review records");
    });

    it("does not fire health_plan_not_updated when only 1 qualifies", () => {
      const records = [
        makeRecord({
          appointment_status: "attended",
          appointment_outcome: "treatment_given",
          health_plan_updated: false,
        }),
      ];
      const alerts = identifyHealthAppointmentAlerts(records);
      expect(
        alerts.filter((x) => x.type === "health_plan_not_updated"),
      ).toHaveLength(0);
    });

    it("does not fire health_plan_not_updated for no_concerns outcome", () => {
      const records = [
        makeRecord({
          appointment_status: "attended",
          appointment_outcome: "no_concerns",
          health_plan_updated: false,
        }),
        makeRecord({
          appointment_status: "attended",
          appointment_outcome: "no_concerns",
          health_plan_updated: false,
        }),
        makeRecord({
          appointment_status: "attended",
          appointment_outcome: "no_concerns",
          health_plan_updated: false,
        }),
      ];
      const alerts = identifyHealthAppointmentAlerts(records);
      expect(
        alerts.filter((x) => x.type === "health_plan_not_updated"),
      ).toHaveLength(0);
    });

    it("does not fire health_plan_not_updated for non-attended", () => {
      const records = [
        makeRecord({
          appointment_status: "missed",
          appointment_outcome: "treatment_given",
          health_plan_updated: false,
        }),
        makeRecord({
          appointment_status: "missed",
          appointment_outcome: "referral_made",
          health_plan_updated: false,
        }),
        makeRecord({
          appointment_status: "pending",
          appointment_outcome: "treatment_given",
          health_plan_updated: false,
        }),
      ];
      const alerts = identifyHealthAppointmentAlerts(records);
      expect(
        alerts.filter((x) => x.type === "health_plan_not_updated"),
      ).toHaveLength(0);
    });

    it("does not fire health_plan_not_updated when plan IS updated", () => {
      const records = [
        makeRecord({
          appointment_status: "attended",
          appointment_outcome: "treatment_given",
          health_plan_updated: true,
        }),
        makeRecord({
          appointment_status: "attended",
          appointment_outcome: "referral_made",
          health_plan_updated: true,
        }),
      ];
      const alerts = identifyHealthAppointmentAlerts(records);
      expect(
        alerts.filter((x) => x.type === "health_plan_not_updated"),
      ).toHaveLength(0);
    });

    it("health_plan_not_updated only counts attended + non-no_concerns + not updated", () => {
      const records = [
        // Counts: attended, treatment_given, not updated
        makeRecord({
          appointment_status: "attended",
          appointment_outcome: "treatment_given",
          health_plan_updated: false,
        }),
        // Counts: attended, referral_made, not updated
        makeRecord({
          appointment_status: "attended",
          appointment_outcome: "referral_made",
          health_plan_updated: false,
        }),
        // Does NOT count: no_concerns
        makeRecord({
          appointment_status: "attended",
          appointment_outcome: "no_concerns",
          health_plan_updated: false,
        }),
        // Does NOT count: plan updated
        makeRecord({
          appointment_status: "attended",
          appointment_outcome: "treatment_given",
          health_plan_updated: true,
        }),
        // Does NOT count: not attended
        makeRecord({
          appointment_status: "missed",
          appointment_outcome: "treatment_given",
          health_plan_updated: false,
        }),
      ];
      const alerts = identifyHealthAppointmentAlerts(records);
      const a = alerts.find((x) => x.type === "health_plan_not_updated");
      expect(a).toBeDefined();
      expect(a!.message).toContain("2 appointments");
    });

    it("health_plan_not_updated counts not_applicable outcome as qualifying", () => {
      // not_applicable is NOT "no_concerns", so it qualifies
      const records = [
        makeRecord({
          appointment_status: "attended",
          appointment_outcome: "not_applicable",
          health_plan_updated: false,
        }),
        makeRecord({
          appointment_status: "attended",
          appointment_outcome: "not_applicable",
          health_plan_updated: false,
        }),
      ];
      const alerts = identifyHealthAppointmentAlerts(records);
      const a = alerts.find((x) => x.type === "health_plan_not_updated");
      expect(a).toBeDefined();
    });

    it("health_plan_not_updated counts medication_prescribed as qualifying", () => {
      const records = [
        makeRecord({
          appointment_status: "attended",
          appointment_outcome: "medication_prescribed",
          health_plan_updated: false,
        }),
        makeRecord({
          appointment_status: "attended",
          appointment_outcome: "medication_prescribed",
          health_plan_updated: false,
        }),
      ];
      const alerts = identifyHealthAppointmentAlerts(records);
      expect(
        alerts.some((x) => x.type === "health_plan_not_updated"),
      ).toBe(true);
    });

    // ── Multiple alert types simultaneously ─────────────────────────────
    it("fires multiple alert types at once", () => {
      const records = [
        // consent_refused
        makeRecord({
          id: "cr-1",
          consent_status: "consent_refused",
          appointment_status: "missed",
        }),
        // missed (also contributes to missed_appointments)
        makeRecord({ appointment_status: "missed" }),
        // follow_up_overdue
        makeRecord({ follow_up_date: daysAgo(5) }),
        // views_not_captured (need 3 attended without views)
        makeRecord({
          appointment_status: "attended",
          child_views_captured: false,
        }),
        makeRecord({
          appointment_status: "attended",
          child_views_captured: false,
        }),
        makeRecord({
          appointment_status: "attended",
          child_views_captured: false,
        }),
        // health_plan_not_updated (need 2 attended + non-no_concerns + not updated)
        makeRecord({
          appointment_status: "attended",
          appointment_outcome: "treatment_given",
          health_plan_updated: false,
        }),
        makeRecord({
          appointment_status: "attended",
          appointment_outcome: "referral_made",
          health_plan_updated: false,
        }),
      ];
      const alerts = identifyHealthAppointmentAlerts(records);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("consent_refused");
      expect(types).toContain("missed_appointments");
      expect(types).toContain("follow_up_overdue");
      expect(types).toContain("views_not_captured");
      expect(types).toContain("health_plan_not_updated");
    });

    it("fires consent_refused, missed_appointments, and follow_up_overdue together", () => {
      const records = [
        makeRecord({
          id: "cr-1",
          consent_status: "consent_refused",
          appointment_status: "missed",
          follow_up_date: daysAgo(3),
        }),
      ];
      const alerts = identifyHealthAppointmentAlerts(records);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("consent_refused");
      expect(types).toContain("missed_appointments");
      expect(types).toContain("follow_up_overdue");
    });

    // ── No alerts when all conditions are good ──────────────────────────
    it("returns no alerts when all records are healthy", () => {
      const records = [
        makeRecord({
          appointment_status: "attended",
          consent_status: "consent_given",
          child_views_captured: true,
          health_plan_updated: true,
          appointment_outcome: "no_concerns",
        }),
        makeRecord({
          appointment_status: "attended",
          consent_status: "consent_given",
          child_views_captured: true,
          health_plan_updated: true,
          appointment_outcome: "no_concerns",
        }),
        makeRecord({
          appointment_status: "attended",
          consent_status: "consent_given",
          child_views_captured: true,
          health_plan_updated: true,
          appointment_outcome: "no_concerns",
        }),
      ];
      const alerts = identifyHealthAppointmentAlerts(records);
      expect(alerts).toEqual([]);
    });

    it("returns no alerts with attended + views captured + plan updated + future follow-up", () => {
      const records = [
        makeRecord({
          appointment_status: "attended",
          consent_status: "consent_given",
          child_views_captured: true,
          health_plan_updated: true,
          appointment_outcome: "treatment_given",
          follow_up_date: daysFromNow(10),
        }),
        makeRecord({
          appointment_status: "attended",
          consent_status: "gillick_competent",
          child_views_captured: true,
          health_plan_updated: true,
          appointment_outcome: "referral_made",
          follow_up_date: daysFromNow(20),
        }),
      ];
      const alerts = identifyHealthAppointmentAlerts(records);
      expect(alerts).toEqual([]);
    });

    it("no alerts with a single good record", () => {
      const alerts = identifyHealthAppointmentAlerts([
        makeRecord({
          appointment_status: "attended",
          consent_status: "consent_given",
          child_views_captured: true,
          health_plan_updated: true,
          appointment_outcome: "no_concerns",
        }),
      ]);
      expect(alerts).toEqual([]);
    });

    // ── Edge cases: exactly at thresholds ────────────────────────────────
    it("views_not_captured fires at exactly 3 (threshold)", () => {
      const records = Array.from({ length: 3 }, () =>
        makeRecord({
          appointment_status: "attended",
          child_views_captured: false,
        }),
      );
      const alerts = identifyHealthAppointmentAlerts(records);
      expect(alerts.some((x) => x.type === "views_not_captured")).toBe(true);
    });

    it("views_not_captured does not fire at 2 (below threshold)", () => {
      const records = Array.from({ length: 2 }, () =>
        makeRecord({
          appointment_status: "attended",
          child_views_captured: false,
        }),
      );
      const alerts = identifyHealthAppointmentAlerts(records);
      expect(alerts.some((x) => x.type === "views_not_captured")).toBe(false);
    });

    it("health_plan_not_updated fires at exactly 2 (threshold)", () => {
      const records = [
        makeRecord({
          appointment_status: "attended",
          appointment_outcome: "treatment_given",
          health_plan_updated: false,
        }),
        makeRecord({
          appointment_status: "attended",
          appointment_outcome: "referral_made",
          health_plan_updated: false,
        }),
      ];
      const alerts = identifyHealthAppointmentAlerts(records);
      expect(
        alerts.some((x) => x.type === "health_plan_not_updated"),
      ).toBe(true);
    });

    it("health_plan_not_updated does not fire at 1 (below threshold)", () => {
      const records = [
        makeRecord({
          appointment_status: "attended",
          appointment_outcome: "treatment_given",
          health_plan_updated: false,
        }),
      ];
      const alerts = identifyHealthAppointmentAlerts(records);
      expect(
        alerts.some((x) => x.type === "health_plan_not_updated"),
      ).toBe(false);
    });

    it("missed_appointments fires at exactly 1 (threshold)", () => {
      const alerts = identifyHealthAppointmentAlerts([
        makeRecord({ appointment_status: "missed" }),
      ]);
      expect(alerts.some((x) => x.type === "missed_appointments")).toBe(true);
    });

    it("missed_appointments does not fire at 0 (below threshold)", () => {
      const alerts = identifyHealthAppointmentAlerts([
        makeRecord({ appointment_status: "attended" }),
      ]);
      expect(alerts.some((x) => x.type === "missed_appointments")).toBe(false);
    });

    it("follow_up_overdue fires at exactly 1 (threshold)", () => {
      const alerts = identifyHealthAppointmentAlerts([
        makeRecord({ follow_up_date: daysAgo(1) }),
      ]);
      expect(alerts.some((x) => x.type === "follow_up_overdue")).toBe(true);
    });

    it("follow_up_overdue does not fire at 0 (below threshold)", () => {
      const alerts = identifyHealthAppointmentAlerts([
        makeRecord({ follow_up_date: daysFromNow(1) }),
      ]);
      expect(alerts.some((x) => x.type === "follow_up_overdue")).toBe(false);
    });

    // ── Alert ordering ──────────────────────────────────────────────────
    it("consent_refused alerts come before missed_appointments", () => {
      const records = [
        makeRecord({
          id: "cr-1",
          consent_status: "consent_refused",
          appointment_status: "missed",
        }),
      ];
      const alerts = identifyHealthAppointmentAlerts(records);
      const crIdx = alerts.findIndex((a) => a.type === "consent_refused");
      const maIdx = alerts.findIndex((a) => a.type === "missed_appointments");
      expect(crIdx).toBeLessThan(maIdx);
    });

    it("missed_appointments comes before follow_up_overdue", () => {
      const records = [
        makeRecord({
          appointment_status: "missed",
          follow_up_date: daysAgo(5),
        }),
      ];
      const alerts = identifyHealthAppointmentAlerts(records);
      const maIdx = alerts.findIndex((a) => a.type === "missed_appointments");
      const fuIdx = alerts.findIndex((a) => a.type === "follow_up_overdue");
      expect(maIdx).toBeLessThan(fuIdx);
    });

    it("follow_up_overdue comes before views_not_captured", () => {
      const records = [
        makeRecord({ follow_up_date: daysAgo(5) }),
        makeRecord({
          appointment_status: "attended",
          child_views_captured: false,
        }),
        makeRecord({
          appointment_status: "attended",
          child_views_captured: false,
        }),
        makeRecord({
          appointment_status: "attended",
          child_views_captured: false,
        }),
      ];
      const alerts = identifyHealthAppointmentAlerts(records);
      const fuIdx = alerts.findIndex((a) => a.type === "follow_up_overdue");
      const vnIdx = alerts.findIndex((a) => a.type === "views_not_captured");
      expect(fuIdx).toBeLessThan(vnIdx);
    });

    it("views_not_captured comes before health_plan_not_updated", () => {
      const records = [
        // 3 for views_not_captured
        makeRecord({
          appointment_status: "attended",
          child_views_captured: false,
          appointment_outcome: "treatment_given",
          health_plan_updated: false,
        }),
        makeRecord({
          appointment_status: "attended",
          child_views_captured: false,
          appointment_outcome: "referral_made",
          health_plan_updated: false,
        }),
        makeRecord({
          appointment_status: "attended",
          child_views_captured: false,
          appointment_outcome: "treatment_given",
          health_plan_updated: false,
        }),
      ];
      const alerts = identifyHealthAppointmentAlerts(records);
      const vnIdx = alerts.findIndex((a) => a.type === "views_not_captured");
      const hpIdx = alerts.findIndex(
        (a) => a.type === "health_plan_not_updated",
      );
      expect(vnIdx).toBeLessThan(hpIdx);
    });

    // ── consent_refused with different appointment types ────────────────
    it("consent_refused formats sexual_health as 'sexual health'", () => {
      const r = makeRecord({
        id: "rec-1",
        appointment_type: "sexual_health",
        consent_status: "consent_refused",
        appointment_status: "pending",
      });
      const alerts = identifyHealthAppointmentAlerts([r]);
      const a = alerts.find((x) => x.type === "consent_refused");
      expect(a!.message).toContain("sexual health");
    });

    it("consent_refused formats single-word types without change", () => {
      const r = makeRecord({
        id: "rec-1",
        appointment_type: "optician",
        consent_status: "consent_refused",
        appointment_status: "missed",
      });
      const alerts = identifyHealthAppointmentAlerts([r]);
      const a = alerts.find((x) => x.type === "consent_refused");
      expect(a!.message).toContain("optician");
    });

    it("consent_refused formats camhs as 'camhs'", () => {
      const r = makeRecord({
        id: "rec-1",
        appointment_type: "camhs",
        consent_status: "consent_refused",
        appointment_status: "missed",
      });
      const alerts = identifyHealthAppointmentAlerts([r]);
      const a = alerts.find((x) => x.type === "consent_refused");
      expect(a!.message).toContain("camhs");
    });
  });
});
