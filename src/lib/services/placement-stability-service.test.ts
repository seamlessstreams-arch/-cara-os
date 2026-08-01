import { describe, it, expect } from "vitest";
import {
  computeStabilityMetrics,
  identifyStabilityAlerts,
} from "./placement-stability-service";
import type { PlacementMove } from "./placement-stability-service";

// -- Factory ------------------------------------------------------------------

function makeMove(overrides: Partial<PlacementMove> = {}): PlacementMove {
  return {
    id: "move-1",
    home_id: "home-1",
    child_name: "Alex",
    child_id: "child-1",
    move_date: "2026-05-01",
    placement_type: "residential",
    previous_placement_type: "foster_care",
    move_reason: "planned_transition",
    planned: true,
    disruption_meeting_held: true,
    disruption_outcome: "not_applicable",
    placement_duration_days: 180,
    child_views_sought: true,
    child_views: "Happy with move",
    social_worker_consulted: true,
    irp_updated: true,
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

// -- computeStabilityMetrics --------------------------------------------------

describe("computeStabilityMetrics", () => {
  it("returns zeroes for empty moves", () => {
    const m = computeStabilityMetrics([], 4);
    expect(m.total_moves).toBe(0);
    expect(m.children_with_moves).toBe(0);
    expect(m.planned_moves).toBe(0);
    expect(m.unplanned_moves).toBe(0);
    expect(m.planned_rate).toBeNull();;
    expect(m.breakdowns).toBe(0);
    expect(m.average_placement_duration).toBeNull();;
    expect(m.disruption_meeting_rate).toBeNull();;
    expect(m.child_views_sought_rate).toBeNull();;
    expect(m.children_with_multiple_moves).toBe(0);
  });

  it("counts planned vs unplanned moves and rate", () => {
    const moves = [
      makeMove({ id: "1", planned: true }),
      makeMove({ id: "2", planned: true }),
      makeMove({ id: "3", planned: false }),
    ];
    const m = computeStabilityMetrics(moves, 3);
    expect(m.planned_moves).toBe(2);
    expect(m.unplanned_moves).toBe(1);
    expect(m.planned_rate).toBeCloseTo(66.7, 1);
  });

  it("counts breakdowns and safeguarding moves", () => {
    const moves = [
      makeMove({ id: "1", move_reason: "placement_breakdown" }),
      makeMove({ id: "2", move_reason: "safeguarding" }),
      makeMove({ id: "3", move_reason: "planned_transition" }),
    ];
    const m = computeStabilityMetrics(moves, 3);
    expect(m.breakdowns).toBe(1);
    expect(m.safeguarding_moves).toBe(1);
  });

  it("computes average placement duration", () => {
    const moves = [
      makeMove({ id: "1", placement_duration_days: 100 }),
      makeMove({ id: "2", placement_duration_days: 200 }),
    ];
    const m = computeStabilityMetrics(moves, 2);
    expect(m.average_placement_duration).toBe(150);
  });

  it("computes boolean rates", () => {
    const moves = [
      makeMove({ id: "1", disruption_meeting_held: true, child_views_sought: true, social_worker_consulted: true, irp_updated: true }),
      makeMove({ id: "2", disruption_meeting_held: false, child_views_sought: false, social_worker_consulted: false, irp_updated: false }),
    ];
    const m = computeStabilityMetrics(moves, 2);
    expect(m.disruption_meeting_rate).toBe(50);
    expect(m.child_views_sought_rate).toBe(50);
    expect(m.social_worker_consulted_rate).toBe(50);
    expect(m.irp_updated_rate).toBe(50);
  });

  it("counts children with multiple moves", () => {
    const moves = [
      makeMove({ id: "1", child_id: "c1" }),
      makeMove({ id: "2", child_id: "c1" }),
      makeMove({ id: "3", child_id: "c2" }),
    ];
    const m = computeStabilityMetrics(moves, 2);
    expect(m.children_with_moves).toBe(2);
    expect(m.children_with_multiple_moves).toBe(1); // c1 has 2 moves
  });

  it("builds breakdown maps", () => {
    const moves = [
      makeMove({ id: "1", placement_type: "residential", move_reason: "planned_transition", disruption_outcome: "not_applicable" }),
      makeMove({ id: "2", placement_type: "foster_care", move_reason: "placement_breakdown", disruption_outcome: "emergency_move" }),
    ];
    const m = computeStabilityMetrics(moves, 2);
    expect(m.by_placement_type).toEqual({ residential: 1, foster_care: 1 });
    expect(m.by_move_reason).toEqual({ planned_transition: 1, placement_breakdown: 1 });
    expect(m.by_disruption_outcome).toEqual({ not_applicable: 1, emergency_move: 1 });
  });
});

// -- identifyStabilityAlerts --------------------------------------------------

describe("identifyStabilityAlerts", () => {
  it("returns no alerts for empty moves", () => {
    expect(identifyStabilityAlerts([], 4)).toEqual([]);
  });

  it("returns no alerts for a clean planned move", () => {
    const moves = [makeMove()];
    const alerts = identifyStabilityAlerts(moves, 1);
    expect(alerts).toEqual([]);
  });

  it("fires placement_breakdown high alert per-record", () => {
    const moves = [makeMove({ move_reason: "placement_breakdown" })];
    const alerts = identifyStabilityAlerts(moves, 1);
    expect(alerts.some((a) => a.type === "placement_breakdown" && a.severity === "high")).toBe(true);
  });

  it("fires no_disruption_meeting high alert for unplanned move without meeting", () => {
    const moves = [makeMove({ planned: false, disruption_meeting_held: false })];
    const alerts = identifyStabilityAlerts(moves, 1);
    expect(alerts.some((a) => a.type === "no_disruption_meeting" && a.severity === "high")).toBe(true);
  });

  it("fires views_not_sought medium alert per-record", () => {
    const moves = [makeMove({ child_views_sought: false })];
    const alerts = identifyStabilityAlerts(moves, 1);
    expect(alerts.some((a) => a.type === "views_not_sought" && a.severity === "medium")).toBe(true);
  });

  it("fires instability_pattern critical when child has >= 3 moves", () => {
    const moves = [
      makeMove({ id: "1", child_id: "c1", child_name: "Alex" }),
      makeMove({ id: "2", child_id: "c1", child_name: "Alex" }),
      makeMove({ id: "3", child_id: "c1", child_name: "Alex" }),
    ];
    const alerts = identifyStabilityAlerts(moves, 1);
    expect(alerts.some((a) => a.type === "instability_pattern" && a.severity === "critical")).toBe(true);
  });

  it("does not fire instability_pattern for 2 moves", () => {
    const moves = [
      makeMove({ id: "1", child_id: "c1" }),
      makeMove({ id: "2", child_id: "c1" }),
    ];
    const alerts = identifyStabilityAlerts(moves, 1);
    expect(alerts.some((a) => a.type === "instability_pattern")).toBe(false);
  });

  it("fires irp_not_updated medium alert per-record", () => {
    const moves = [makeMove({ irp_updated: false })];
    const alerts = identifyStabilityAlerts(moves, 1);
    expect(alerts.some((a) => a.type === "irp_not_updated" && a.severity === "medium")).toBe(true);
  });
});
