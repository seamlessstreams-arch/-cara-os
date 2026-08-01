import { describe, it, expect } from "vitest";
import {
  computeKeyWorkerAllocationMetrics,
  identifyKeyWorkerAllocationAlerts,
  type KeyWorkerAllocationRecord,
} from "./key-worker-allocation-service";

function makeRecord(overrides: Partial<KeyWorkerAllocationRecord> = {}): KeyWorkerAllocationRecord {
  return {
    id: "kwa-1",
    home_id: "home-1",
    allocation_status: "active",
    relationship_quality: "good",
    workload_level: "balanced",
    continuity_rating: "stable",
    review_date: "2026-05-10",
    child_name: "Alex Smith",
    child_id: "child-1",
    key_worker_name: "Jane Doe",
    reviewed_by: "Manager",
    child_views_sought: true,
    child_choice_considered: true,
    regular_sessions_held: true,
    care_plan_involvement: true,
    advocacy_role_fulfilled: true,
    training_appropriate: true,
    supervision_discussed: true,
    handover_plan_exists: true,
    backup_worker_identified: true,
    social_worker_informed: true,
    relationship_supported: true,
    recorded_promptly: true,
    issues_found: [],
    actions_taken: [],
    next_review_date: "2026-08-10",
    notes: null,
    created_at: "2026-05-10T00:00:00Z",
    updated_at: "2026-05-10T00:00:00Z",
    ...overrides,
  };
}

describe("key-worker-allocation-service", () => {
  // -- computeKeyWorkerAllocationMetrics -----------------------------------------

  describe("computeKeyWorkerAllocationMetrics", () => {
    it("returns zeroes for empty data", () => {
      const m = computeKeyWorkerAllocationMetrics([]);
      expect(m.total_allocations).toBe(0);
      expect(m.unallocated_count).toBe(0);
      expect(m.broken_down_count).toBe(0);
      expect(m.overloaded_count).toBe(0);
      expect(m.child_views_rate).toBeNull();;
      expect(m.unique_children).toBe(0);
    });

    it("counts status-based metrics", () => {
      const records = [
        makeRecord({ allocation_status: "unallocated", relationship_quality: "broken_down", workload_level: "overloaded", continuity_rating: "no_continuity" }),
        makeRecord({ id: "r2", allocation_status: "active" }),
      ];
      const m = computeKeyWorkerAllocationMetrics(records);
      expect(m.unallocated_count).toBe(1);
      expect(m.broken_down_count).toBe(1);
      expect(m.overloaded_count).toBe(1);
      expect(m.no_continuity_count).toBe(1);
    });

    it("computes boolean rates correctly", () => {
      const records = [
        makeRecord({
          child_views_sought: true,
          child_choice_considered: false,
          regular_sessions_held: true,
          care_plan_involvement: false,
          advocacy_role_fulfilled: true,
          training_appropriate: false,
          supervision_discussed: true,
          handover_plan_exists: false,
          backup_worker_identified: true,
          social_worker_informed: false,
          relationship_supported: true,
          recorded_promptly: false,
        }),
      ];
      const m = computeKeyWorkerAllocationMetrics(records);
      expect(m.child_views_rate).toBe(100);
      expect(m.child_choice_rate).toBe(0);
      expect(m.regular_sessions_rate).toBe(100);
      expect(m.care_plan_rate).toBe(0);
      expect(m.advocacy_rate).toBe(100);
      expect(m.training_rate).toBe(0);
    });

    it("counts unique children", () => {
      const records = [
        makeRecord({ child_name: "Alex" }),
        makeRecord({ id: "r2", child_name: "Alex" }),
        makeRecord({ id: "r3", child_name: "Beth" }),
      ];
      const m = computeKeyWorkerAllocationMetrics(records);
      expect(m.unique_children).toBe(2);
    });

    it("builds breakdown records", () => {
      const records = [
        makeRecord({ allocation_status: "active", relationship_quality: "excellent", workload_level: "heavy", continuity_rating: "very_stable" }),
      ];
      const m = computeKeyWorkerAllocationMetrics(records);
      expect(m.by_allocation_status["active"]).toBe(1);
      expect(m.by_relationship_quality["excellent"]).toBe(1);
      expect(m.by_workload_level["heavy"]).toBe(1);
      expect(m.by_continuity_rating["very_stable"]).toBe(1);
    });
  });

  // -- identifyKeyWorkerAllocationAlerts -----------------------------------------

  describe("identifyKeyWorkerAllocationAlerts", () => {
    it("returns no alerts for empty data", () => {
      expect(identifyKeyWorkerAllocationAlerts([])).toHaveLength(0);
    });

    it("fires critical unallocated_broken_down per-record", () => {
      const records = [
        makeRecord({ allocation_status: "unallocated", relationship_quality: "broken_down" }),
      ];
      const alerts = identifyKeyWorkerAllocationAlerts(records);
      const ubd = alerts.find((a) => a.type === "unallocated_broken_down");
      expect(ubd).toBeDefined();
      expect(ubd!.severity).toBe("critical");
    });

    it("fires high children_unallocated when >= 1 unallocated", () => {
      const records = [makeRecord({ allocation_status: "unallocated" })];
      const alerts = identifyKeyWorkerAllocationAlerts(records);
      expect(alerts.find((a) => a.type === "children_unallocated")).toBeDefined();
    });

    it("fires high no_regular_sessions when >= 1 without sessions", () => {
      const records = [makeRecord({ regular_sessions_held: false })];
      const alerts = identifyKeyWorkerAllocationAlerts(records);
      expect(alerts.find((a) => a.type === "no_regular_sessions")).toBeDefined();
    });

    it("fires medium no_backup_worker when >= 2 without backup", () => {
      const records = [
        makeRecord({ backup_worker_identified: false }),
        makeRecord({ id: "r2", backup_worker_identified: false }),
      ];
      const alerts = identifyKeyWorkerAllocationAlerts(records);
      expect(alerts.find((a) => a.type === "no_backup_worker")).toBeDefined();
    });

    it("fires medium no_handover_plan when >= 2 without handover", () => {
      const records = [
        makeRecord({ handover_plan_exists: false }),
        makeRecord({ id: "r2", handover_plan_exists: false }),
      ];
      const alerts = identifyKeyWorkerAllocationAlerts(records);
      expect(alerts.find((a) => a.type === "no_handover_plan")).toBeDefined();
    });

    it("does NOT fire no_backup_worker when only 1 record", () => {
      const records = [makeRecord({ backup_worker_identified: false })];
      const alerts = identifyKeyWorkerAllocationAlerts(records);
      expect(alerts.find((a) => a.type === "no_backup_worker")).toBeUndefined();
    });
  });
});
