// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — PLACEMENT STABILITY SERVICE TESTS
// Pure-function unit tests for placement stability metrics computation,
// alert identification, constant validation, and CRUD fallback behaviour
// (Supabase disabled). CHR 2015 Reg 36 (records — placement history),
// Reg 8 (placement plans — matching and stability),
// Reg 9 (quality of care — continuity and stability).
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeAll } from "vitest";
import { _testing } from "../placement-stability-service";
import {
  PLACEMENT_TYPES,
  MOVE_REASONS,
  STABILITY_RISKS,
  DISRUPTION_OUTCOMES,
} from "../placement-stability-service";

import type {
  PlacementMove,
  PlacementType,
  MoveReason,
  StabilityRisk,
  DisruptionOutcome,
} from "../placement-stability-service";

const { computeStabilityMetrics, identifyStabilityAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

const now = new Date(new Date().toISOString().split("T")[0]);

/** Date string N days ago from now. */
function daysAgo(n: number): string {
  const d = new Date(now.getTime() - n * 24 * 60 * 60 * 1000);
  return d.toISOString().split("T")[0];
}

/** ISO datetime string N days ago. */
function daysAgoISO(n: number): string {
  const d = new Date(now.getTime() - n * 24 * 60 * 60 * 1000);
  return d.toISOString();
}

/** Build a minimal PlacementMove with sensible defaults. */
function makeMove(overrides: Partial<PlacementMove> = {}): PlacementMove {
  return {
    id: overrides.id ?? "move-1",
    home_id: overrides.home_id ?? "home-1",
    child_name: overrides.child_name ?? "Alice Smith",
    child_id: overrides.child_id ?? "child-1",
    move_date: overrides.move_date ?? daysAgo(5),
    placement_type: overrides.placement_type ?? "residential",
    previous_placement_type: overrides.previous_placement_type ?? null,
    move_reason: overrides.move_reason ?? "planned_transition",
    planned: overrides.planned ?? true,
    disruption_meeting_held: overrides.disruption_meeting_held ?? true,
    disruption_outcome: overrides.disruption_outcome ?? "not_applicable",
    placement_duration_days: overrides.placement_duration_days ?? 90,
    child_views_sought: overrides.child_views_sought ?? true,
    child_views: overrides.child_views ?? null,
    social_worker_consulted: overrides.social_worker_consulted ?? true,
    irp_updated: overrides.irp_updated ?? true,
    notes: overrides.notes ?? null,
    created_at: overrides.created_at ?? daysAgoISO(5),
    updated_at: overrides.updated_at ?? daysAgoISO(5),
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Constants", () => {
  // ── PLACEMENT_TYPES ─────────────────────────────────────────────────────

  describe("PLACEMENT_TYPES", () => {
    it("has exactly 9 items", () => {
      expect(PLACEMENT_TYPES).toHaveLength(9);
    });

    it("has unique type values", () => {
      const types = PLACEMENT_TYPES.map((t) => t.type);
      expect(new Set(types).size).toBe(types.length);
    });

    it("has unique label values", () => {
      const labels = PLACEMENT_TYPES.map((t) => t.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("contains residential type", () => {
      expect(PLACEMENT_TYPES.find((t) => t.type === "residential")).toBeDefined();
    });

    it("contains foster_care type", () => {
      expect(PLACEMENT_TYPES.find((t) => t.type === "foster_care")).toBeDefined();
    });

    it("contains kinship_care type", () => {
      expect(PLACEMENT_TYPES.find((t) => t.type === "kinship_care")).toBeDefined();
    });

    it("contains semi_independent type", () => {
      expect(PLACEMENT_TYPES.find((t) => t.type === "semi_independent")).toBeDefined();
    });

    it("contains secure type", () => {
      expect(PLACEMENT_TYPES.find((t) => t.type === "secure")).toBeDefined();
    });

    it("contains hospital type", () => {
      expect(PLACEMENT_TYPES.find((t) => t.type === "hospital")).toBeDefined();
    });

    it("contains parent_resumed type", () => {
      expect(PLACEMENT_TYPES.find((t) => t.type === "parent_resumed")).toBeDefined();
    });

    it("contains adoption type", () => {
      expect(PLACEMENT_TYPES.find((t) => t.type === "adoption")).toBeDefined();
    });

    it("contains other type", () => {
      expect(PLACEMENT_TYPES.find((t) => t.type === "other")).toBeDefined();
    });

    it("every item has a non-empty label", () => {
      for (const t of PLACEMENT_TYPES) {
        expect(t.label.length).toBeGreaterThan(0);
      }
    });
  });

  // ── MOVE_REASONS ────────────────────────────────────────────────────────

  describe("MOVE_REASONS", () => {
    it("has exactly 12 items", () => {
      expect(MOVE_REASONS).toHaveLength(12);
    });

    it("has unique reason values", () => {
      const reasons = MOVE_REASONS.map((r) => r.reason);
      expect(new Set(reasons).size).toBe(reasons.length);
    });

    it("has unique label values", () => {
      const labels = MOVE_REASONS.map((r) => r.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("contains planned_transition", () => {
      expect(MOVE_REASONS.find((r) => r.reason === "planned_transition")).toBeDefined();
    });

    it("contains placement_breakdown", () => {
      expect(MOVE_REASONS.find((r) => r.reason === "placement_breakdown")).toBeDefined();
    });

    it("contains safeguarding", () => {
      expect(MOVE_REASONS.find((r) => r.reason === "safeguarding")).toBeDefined();
    });

    it("contains matching_issues", () => {
      expect(MOVE_REASONS.find((r) => r.reason === "matching_issues")).toBeDefined();
    });

    it("contains childs_request", () => {
      expect(MOVE_REASONS.find((r) => r.reason === "childs_request")).toBeDefined();
    });

    it("contains court_directed", () => {
      expect(MOVE_REASONS.find((r) => r.reason === "court_directed")).toBeDefined();
    });

    it("every item has a non-empty label", () => {
      for (const r of MOVE_REASONS) {
        expect(r.label.length).toBeGreaterThan(0);
      }
    });
  });

  // ── STABILITY_RISKS ─────────────────────────────────────────────────────

  describe("STABILITY_RISKS", () => {
    it("has exactly 5 items", () => {
      expect(STABILITY_RISKS).toHaveLength(5);
    });

    it("has unique risk values", () => {
      const risks = STABILITY_RISKS.map((r) => r.risk);
      expect(new Set(risks).size).toBe(risks.length);
    });

    it("has unique label values", () => {
      const labels = STABILITY_RISKS.map((r) => r.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("contains very_high risk", () => {
      expect(STABILITY_RISKS.find((r) => r.risk === "very_high")).toBeDefined();
    });

    it("contains high risk", () => {
      expect(STABILITY_RISKS.find((r) => r.risk === "high")).toBeDefined();
    });

    it("contains medium risk", () => {
      expect(STABILITY_RISKS.find((r) => r.risk === "medium")).toBeDefined();
    });

    it("contains low risk", () => {
      expect(STABILITY_RISKS.find((r) => r.risk === "low")).toBeDefined();
    });

    it("contains stable risk", () => {
      expect(STABILITY_RISKS.find((r) => r.risk === "stable")).toBeDefined();
    });

    it("every item has a non-empty label", () => {
      for (const r of STABILITY_RISKS) {
        expect(r.label.length).toBeGreaterThan(0);
      }
    });
  });

  // ── DISRUPTION_OUTCOMES ─────────────────────────────────────────────────

  describe("DISRUPTION_OUTCOMES", () => {
    it("has exactly 6 items", () => {
      expect(DISRUPTION_OUTCOMES).toHaveLength(6);
    });

    it("has unique outcome values", () => {
      const outcomes = DISRUPTION_OUTCOMES.map((o) => o.outcome);
      expect(new Set(outcomes).size).toBe(outcomes.length);
    });

    it("has unique label values", () => {
      const labels = DISRUPTION_OUTCOMES.map((o) => o.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("contains placement_maintained", () => {
      expect(DISRUPTION_OUTCOMES.find((o) => o.outcome === "placement_maintained")).toBeDefined();
    });

    it("contains additional_support", () => {
      expect(DISRUPTION_OUTCOMES.find((o) => o.outcome === "additional_support")).toBeDefined();
    });

    it("contains planned_move", () => {
      expect(DISRUPTION_OUTCOMES.find((o) => o.outcome === "planned_move")).toBeDefined();
    });

    it("contains emergency_move", () => {
      expect(DISRUPTION_OUTCOMES.find((o) => o.outcome === "emergency_move")).toBeDefined();
    });

    it("contains ongoing_monitoring", () => {
      expect(DISRUPTION_OUTCOMES.find((o) => o.outcome === "ongoing_monitoring")).toBeDefined();
    });

    it("contains not_applicable", () => {
      expect(DISRUPTION_OUTCOMES.find((o) => o.outcome === "not_applicable")).toBeDefined();
    });

    it("every item has a non-empty label", () => {
      for (const o of DISRUPTION_OUTCOMES) {
        expect(o.label.length).toBeGreaterThan(0);
      }
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. computeStabilityMetrics
// ══════════════════════════════════════════════════════════════════════════════

describe("computeStabilityMetrics", () => {
  // ── Empty array ─────────────────────────────────────────────────────────

  describe("empty moves array", () => {
    it("returns total_moves 0", () => {
      const m = computeStabilityMetrics([], 5);
      expect(m.total_moves).toBe(0);
    });

    it("returns children_with_moves 0", () => {
      const m = computeStabilityMetrics([], 5);
      expect(m.children_with_moves).toBe(0);
    });

    it("returns planned_moves 0", () => {
      const m = computeStabilityMetrics([], 5);
      expect(m.planned_moves).toBe(0);
    });

    it("returns unplanned_moves 0", () => {
      const m = computeStabilityMetrics([], 5);
      expect(m.unplanned_moves).toBe(0);
    });

    it("returns planned_rate 0", () => {
      const m = computeStabilityMetrics([], 5);
      expect(m.planned_rate).toBe(0);
    });

    it("returns breakdowns 0", () => {
      const m = computeStabilityMetrics([], 5);
      expect(m.breakdowns).toBe(0);
    });

    it("returns safeguarding_moves 0", () => {
      const m = computeStabilityMetrics([], 5);
      expect(m.safeguarding_moves).toBe(0);
    });

    it("returns average_placement_duration 0", () => {
      const m = computeStabilityMetrics([], 5);
      expect(m.average_placement_duration).toBe(0);
    });

    it("returns disruption_meetings_held 0", () => {
      const m = computeStabilityMetrics([], 5);
      expect(m.disruption_meetings_held).toBe(0);
    });

    it("returns disruption_meeting_rate 0", () => {
      const m = computeStabilityMetrics([], 5);
      expect(m.disruption_meeting_rate).toBe(0);
    });

    it("returns child_views_sought_rate 0", () => {
      const m = computeStabilityMetrics([], 5);
      expect(m.child_views_sought_rate).toBe(0);
    });

    it("returns social_worker_consulted_rate 0", () => {
      const m = computeStabilityMetrics([], 5);
      expect(m.social_worker_consulted_rate).toBe(0);
    });

    it("returns irp_updated_rate 0", () => {
      const m = computeStabilityMetrics([], 5);
      expect(m.irp_updated_rate).toBe(0);
    });

    it("returns children_with_multiple_moves 0", () => {
      const m = computeStabilityMetrics([], 5);
      expect(m.children_with_multiple_moves).toBe(0);
    });

    it("returns empty by_placement_type", () => {
      const m = computeStabilityMetrics([], 5);
      expect(m.by_placement_type).toEqual({});
    });

    it("returns empty by_move_reason", () => {
      const m = computeStabilityMetrics([], 5);
      expect(m.by_move_reason).toEqual({});
    });

    it("returns empty by_disruption_outcome", () => {
      const m = computeStabilityMetrics([], 5);
      expect(m.by_disruption_outcome).toEqual({});
    });
  });

  // ── Single move ─────────────────────────────────────────────────────────

  describe("single move", () => {
    const single = makeMove();

    it("returns total_moves 1", () => {
      const m = computeStabilityMetrics([single], 5);
      expect(m.total_moves).toBe(1);
    });

    it("returns children_with_moves 1", () => {
      const m = computeStabilityMetrics([single], 5);
      expect(m.children_with_moves).toBe(1);
    });

    it("counts planned move correctly", () => {
      const m = computeStabilityMetrics([single], 5);
      expect(m.planned_moves).toBe(1);
      expect(m.unplanned_moves).toBe(0);
    });

    it("returns planned_rate 100 for single planned move", () => {
      const m = computeStabilityMetrics([single], 5);
      expect(m.planned_rate).toBe(100);
    });

    it("returns average_placement_duration equal to single move duration", () => {
      const m = computeStabilityMetrics([single], 5);
      expect(m.average_placement_duration).toBe(90);
    });

    it("returns children_with_multiple_moves 0 for single move", () => {
      const m = computeStabilityMetrics([single], 5);
      expect(m.children_with_multiple_moves).toBe(0);
    });

    it("returns by_placement_type with one entry", () => {
      const m = computeStabilityMetrics([single], 5);
      expect(m.by_placement_type).toEqual({ residential: 1 });
    });

    it("returns by_move_reason with one entry", () => {
      const m = computeStabilityMetrics([single], 5);
      expect(m.by_move_reason).toEqual({ planned_transition: 1 });
    });

    it("returns by_disruption_outcome with one entry", () => {
      const m = computeStabilityMetrics([single], 5);
      expect(m.by_disruption_outcome).toEqual({ not_applicable: 1 });
    });
  });

  // ── Multiple moves ──────────────────────────────────────────────────────

  describe("multiple moves", () => {
    const moves = [
      makeMove({ id: "m1", child_id: "c1", child_name: "Alice", planned: true, placement_duration_days: 60, placement_type: "residential", move_reason: "planned_transition", disruption_outcome: "not_applicable", disruption_meeting_held: true, child_views_sought: true, social_worker_consulted: true, irp_updated: true }),
      makeMove({ id: "m2", child_id: "c1", child_name: "Alice", planned: false, placement_duration_days: 30, placement_type: "foster_care", move_reason: "placement_breakdown", disruption_outcome: "emergency_move", disruption_meeting_held: false, child_views_sought: false, social_worker_consulted: false, irp_updated: false }),
      makeMove({ id: "m3", child_id: "c2", child_name: "Bob", planned: true, placement_duration_days: 120, placement_type: "residential", move_reason: "safeguarding", disruption_outcome: "planned_move", disruption_meeting_held: true, child_views_sought: true, social_worker_consulted: true, irp_updated: true }),
      makeMove({ id: "m4", child_id: "c3", child_name: "Charlie", planned: false, placement_duration_days: 10, placement_type: "semi_independent", move_reason: "childs_request", disruption_outcome: "additional_support", disruption_meeting_held: false, child_views_sought: true, social_worker_consulted: false, irp_updated: false }),
    ];

    it("returns correct total_moves", () => {
      const m = computeStabilityMetrics(moves, 10);
      expect(m.total_moves).toBe(4);
    });

    it("returns correct children_with_moves", () => {
      const m = computeStabilityMetrics(moves, 10);
      expect(m.children_with_moves).toBe(3);
    });

    it("counts planned moves correctly", () => {
      const m = computeStabilityMetrics(moves, 10);
      expect(m.planned_moves).toBe(2);
    });

    it("counts unplanned moves correctly", () => {
      const m = computeStabilityMetrics(moves, 10);
      expect(m.unplanned_moves).toBe(2);
    });

    it("calculates planned_rate correctly", () => {
      const m = computeStabilityMetrics(moves, 10);
      expect(m.planned_rate).toBe(50);
    });

    it("counts breakdowns (placement_breakdown reason)", () => {
      const m = computeStabilityMetrics(moves, 10);
      expect(m.breakdowns).toBe(1);
    });

    it("counts safeguarding_moves", () => {
      const m = computeStabilityMetrics(moves, 10);
      expect(m.safeguarding_moves).toBe(1);
    });

    it("calculates average_placement_duration correctly", () => {
      const m = computeStabilityMetrics(moves, 10);
      // (60 + 30 + 120 + 10) / 4 = 55
      expect(m.average_placement_duration).toBe(55);
    });

    it("counts disruption_meetings_held", () => {
      const m = computeStabilityMetrics(moves, 10);
      expect(m.disruption_meetings_held).toBe(2);
    });

    it("calculates disruption_meeting_rate", () => {
      const m = computeStabilityMetrics(moves, 10);
      expect(m.disruption_meeting_rate).toBe(50);
    });

    it("calculates child_views_sought_rate", () => {
      const m = computeStabilityMetrics(moves, 10);
      // 3 / 4 = 75%
      expect(m.child_views_sought_rate).toBe(75);
    });

    it("calculates social_worker_consulted_rate", () => {
      const m = computeStabilityMetrics(moves, 10);
      // 2 / 4 = 50%
      expect(m.social_worker_consulted_rate).toBe(50);
    });

    it("calculates irp_updated_rate", () => {
      const m = computeStabilityMetrics(moves, 10);
      // 2 / 4 = 50%
      expect(m.irp_updated_rate).toBe(50);
    });

    it("counts children_with_multiple_moves (2+)", () => {
      const m = computeStabilityMetrics(moves, 10);
      // Only c1 has 2 moves
      expect(m.children_with_multiple_moves).toBe(1);
    });

    it("builds by_placement_type breakdown", () => {
      const m = computeStabilityMetrics(moves, 10);
      expect(m.by_placement_type).toEqual({
        residential: 2,
        foster_care: 1,
        semi_independent: 1,
      });
    });

    it("builds by_move_reason breakdown", () => {
      const m = computeStabilityMetrics(moves, 10);
      expect(m.by_move_reason).toEqual({
        planned_transition: 1,
        placement_breakdown: 1,
        safeguarding: 1,
        childs_request: 1,
      });
    });

    it("builds by_disruption_outcome breakdown", () => {
      const m = computeStabilityMetrics(moves, 10);
      expect(m.by_disruption_outcome).toEqual({
        not_applicable: 1,
        emergency_move: 1,
        planned_move: 1,
        additional_support: 1,
      });
    });
  });

  // ── Planned rate edge cases ─────────────────────────────────────────────

  describe("planned rate edge cases", () => {
    it("returns 0 planned_rate when all unplanned", () => {
      const moves = [
        makeMove({ id: "m1", planned: false }),
        makeMove({ id: "m2", planned: false }),
      ];
      const m = computeStabilityMetrics(moves, 5);
      expect(m.planned_rate).toBe(0);
    });

    it("returns 100 planned_rate when all planned", () => {
      const moves = [
        makeMove({ id: "m1", planned: true }),
        makeMove({ id: "m2", planned: true }),
      ];
      const m = computeStabilityMetrics(moves, 5);
      expect(m.planned_rate).toBe(100);
    });

    it("rounds planned_rate to one decimal place", () => {
      const moves = [
        makeMove({ id: "m1", planned: true }),
        makeMove({ id: "m2", planned: false }),
        makeMove({ id: "m3", planned: true }),
      ];
      const m = computeStabilityMetrics(moves, 5);
      // 2/3 = 66.666... -> 66.7
      expect(m.planned_rate).toBe(66.7);
    });
  });

  // ── Disruption meeting rate edge cases ──────────────────────────────────

  describe("disruption_meeting_rate edge cases", () => {
    it("returns 100 when all meetings held", () => {
      const moves = [
        makeMove({ id: "m1", disruption_meeting_held: true }),
        makeMove({ id: "m2", disruption_meeting_held: true }),
      ];
      const m = computeStabilityMetrics(moves, 5);
      expect(m.disruption_meeting_rate).toBe(100);
    });

    it("returns 0 when no meetings held", () => {
      const moves = [
        makeMove({ id: "m1", disruption_meeting_held: false }),
        makeMove({ id: "m2", disruption_meeting_held: false }),
      ];
      const m = computeStabilityMetrics(moves, 5);
      expect(m.disruption_meeting_rate).toBe(0);
    });

    it("rounds disruption_meeting_rate to one decimal place", () => {
      const moves = [
        makeMove({ id: "m1", disruption_meeting_held: true }),
        makeMove({ id: "m2", disruption_meeting_held: false }),
        makeMove({ id: "m3", disruption_meeting_held: true }),
      ];
      const m = computeStabilityMetrics(moves, 5);
      expect(m.disruption_meeting_rate).toBe(66.7);
    });
  });

  // ── Child views sought rate edge cases ──────────────────────────────────

  describe("child_views_sought_rate edge cases", () => {
    it("returns 100 when all views sought", () => {
      const moves = [
        makeMove({ id: "m1", child_views_sought: true }),
        makeMove({ id: "m2", child_views_sought: true }),
      ];
      const m = computeStabilityMetrics(moves, 5);
      expect(m.child_views_sought_rate).toBe(100);
    });

    it("returns 0 when no views sought", () => {
      const moves = [
        makeMove({ id: "m1", child_views_sought: false }),
        makeMove({ id: "m2", child_views_sought: false }),
      ];
      const m = computeStabilityMetrics(moves, 5);
      expect(m.child_views_sought_rate).toBe(0);
    });
  });

  // ── Social worker consulted rate edge cases ─────────────────────────────

  describe("social_worker_consulted_rate edge cases", () => {
    it("returns 100 when all social workers consulted", () => {
      const moves = [
        makeMove({ id: "m1", social_worker_consulted: true }),
        makeMove({ id: "m2", social_worker_consulted: true }),
      ];
      const m = computeStabilityMetrics(moves, 5);
      expect(m.social_worker_consulted_rate).toBe(100);
    });

    it("returns 0 when no social workers consulted", () => {
      const moves = [
        makeMove({ id: "m1", social_worker_consulted: false }),
        makeMove({ id: "m2", social_worker_consulted: false }),
      ];
      const m = computeStabilityMetrics(moves, 5);
      expect(m.social_worker_consulted_rate).toBe(0);
    });
  });

  // ── IRP updated rate edge cases ─────────────────────────────────────────

  describe("irp_updated_rate edge cases", () => {
    it("returns 100 when all IRPs updated", () => {
      const moves = [
        makeMove({ id: "m1", irp_updated: true }),
        makeMove({ id: "m2", irp_updated: true }),
      ];
      const m = computeStabilityMetrics(moves, 5);
      expect(m.irp_updated_rate).toBe(100);
    });

    it("returns 0 when no IRPs updated", () => {
      const moves = [
        makeMove({ id: "m1", irp_updated: false }),
        makeMove({ id: "m2", irp_updated: false }),
      ];
      const m = computeStabilityMetrics(moves, 5);
      expect(m.irp_updated_rate).toBe(0);
    });
  });

  // ── Breakdowns and safeguarding counts ──────────────────────────────────

  describe("breakdowns and safeguarding counts", () => {
    it("counts zero breakdowns when no placement_breakdown reason", () => {
      const moves = [
        makeMove({ id: "m1", move_reason: "planned_transition" }),
        makeMove({ id: "m2", move_reason: "safeguarding" }),
      ];
      const m = computeStabilityMetrics(moves, 5);
      expect(m.breakdowns).toBe(0);
    });

    it("counts multiple breakdowns", () => {
      const moves = [
        makeMove({ id: "m1", move_reason: "placement_breakdown" }),
        makeMove({ id: "m2", move_reason: "placement_breakdown" }),
        makeMove({ id: "m3", move_reason: "planned_transition" }),
      ];
      const m = computeStabilityMetrics(moves, 5);
      expect(m.breakdowns).toBe(2);
    });

    it("counts zero safeguarding moves when none present", () => {
      const moves = [
        makeMove({ id: "m1", move_reason: "planned_transition" }),
        makeMove({ id: "m2", move_reason: "childs_request" }),
      ];
      const m = computeStabilityMetrics(moves, 5);
      expect(m.safeguarding_moves).toBe(0);
    });

    it("counts multiple safeguarding moves", () => {
      const moves = [
        makeMove({ id: "m1", move_reason: "safeguarding" }),
        makeMove({ id: "m2", move_reason: "safeguarding" }),
        makeMove({ id: "m3", move_reason: "safeguarding" }),
      ];
      const m = computeStabilityMetrics(moves, 5);
      expect(m.safeguarding_moves).toBe(3);
    });
  });

  // ── Average placement duration ──────────────────────────────────────────

  describe("average_placement_duration", () => {
    it("returns the single duration for one move", () => {
      const moves = [makeMove({ placement_duration_days: 180 })];
      const m = computeStabilityMetrics(moves, 5);
      expect(m.average_placement_duration).toBe(180);
    });

    it("rounds average to nearest integer", () => {
      const moves = [
        makeMove({ id: "m1", placement_duration_days: 10 }),
        makeMove({ id: "m2", placement_duration_days: 11 }),
        makeMove({ id: "m3", placement_duration_days: 12 }),
      ];
      const m = computeStabilityMetrics(moves, 5);
      expect(m.average_placement_duration).toBe(11);
    });

    it("rounds down when fractional part is less than 0.5", () => {
      const moves = [
        makeMove({ id: "m1", placement_duration_days: 10 }),
        makeMove({ id: "m2", placement_duration_days: 11 }),
      ];
      const m = computeStabilityMetrics(moves, 5);
      // (10+11)/2 = 10.5 -> Math.round = 11 (rounds to even/up)
      expect(m.average_placement_duration).toBe(11);
    });

    it("handles zero duration moves", () => {
      const moves = [
        makeMove({ id: "m1", placement_duration_days: 0 }),
        makeMove({ id: "m2", placement_duration_days: 0 }),
      ];
      const m = computeStabilityMetrics(moves, 5);
      expect(m.average_placement_duration).toBe(0);
    });
  });

  // ── Children with multiple moves ────────────────────────────────────────

  describe("children_with_multiple_moves", () => {
    it("returns 0 when each child has only one move", () => {
      const moves = [
        makeMove({ id: "m1", child_id: "c1" }),
        makeMove({ id: "m2", child_id: "c2" }),
        makeMove({ id: "m3", child_id: "c3" }),
      ];
      const m = computeStabilityMetrics(moves, 10);
      expect(m.children_with_multiple_moves).toBe(0);
    });

    it("counts one child with exactly 2 moves", () => {
      const moves = [
        makeMove({ id: "m1", child_id: "c1" }),
        makeMove({ id: "m2", child_id: "c1" }),
        makeMove({ id: "m3", child_id: "c2" }),
      ];
      const m = computeStabilityMetrics(moves, 10);
      expect(m.children_with_multiple_moves).toBe(1);
    });

    it("counts multiple children with 2+ moves", () => {
      const moves = [
        makeMove({ id: "m1", child_id: "c1" }),
        makeMove({ id: "m2", child_id: "c1" }),
        makeMove({ id: "m3", child_id: "c2" }),
        makeMove({ id: "m4", child_id: "c2" }),
        makeMove({ id: "m5", child_id: "c2" }),
        makeMove({ id: "m6", child_id: "c3" }),
      ];
      const m = computeStabilityMetrics(moves, 10);
      expect(m.children_with_multiple_moves).toBe(2);
    });

    it("includes children with 3+ moves in multiple movers count", () => {
      const moves = [
        makeMove({ id: "m1", child_id: "c1" }),
        makeMove({ id: "m2", child_id: "c1" }),
        makeMove({ id: "m3", child_id: "c1" }),
        makeMove({ id: "m4", child_id: "c1" }),
      ];
      const m = computeStabilityMetrics(moves, 10);
      expect(m.children_with_multiple_moves).toBe(1);
    });
  });

  // ── By placement type breakdown ─────────────────────────────────────────

  describe("by_placement_type breakdown", () => {
    it("aggregates multiple types correctly", () => {
      const moves = [
        makeMove({ id: "m1", placement_type: "residential" }),
        makeMove({ id: "m2", placement_type: "residential" }),
        makeMove({ id: "m3", placement_type: "foster_care" }),
        makeMove({ id: "m4", placement_type: "secure" }),
        makeMove({ id: "m5", placement_type: "foster_care" }),
      ];
      const m = computeStabilityMetrics(moves, 10);
      expect(m.by_placement_type).toEqual({
        residential: 2,
        foster_care: 2,
        secure: 1,
      });
    });

    it("handles all moves being the same type", () => {
      const moves = [
        makeMove({ id: "m1", placement_type: "kinship_care" }),
        makeMove({ id: "m2", placement_type: "kinship_care" }),
      ];
      const m = computeStabilityMetrics(moves, 5);
      expect(m.by_placement_type).toEqual({ kinship_care: 2 });
    });
  });

  // ── By move reason breakdown ────────────────────────────────────────────

  describe("by_move_reason breakdown", () => {
    it("aggregates multiple reasons correctly", () => {
      const moves = [
        makeMove({ id: "m1", move_reason: "planned_transition" }),
        makeMove({ id: "m2", move_reason: "planned_transition" }),
        makeMove({ id: "m3", move_reason: "safeguarding" }),
      ];
      const m = computeStabilityMetrics(moves, 10);
      expect(m.by_move_reason).toEqual({
        planned_transition: 2,
        safeguarding: 1,
      });
    });

    it("handles single reason type", () => {
      const moves = [
        makeMove({ id: "m1", move_reason: "court_directed" }),
        makeMove({ id: "m2", move_reason: "court_directed" }),
        makeMove({ id: "m3", move_reason: "court_directed" }),
      ];
      const m = computeStabilityMetrics(moves, 10);
      expect(m.by_move_reason).toEqual({ court_directed: 3 });
    });
  });

  // ── By disruption outcome breakdown ─────────────────────────────────────

  describe("by_disruption_outcome breakdown", () => {
    it("aggregates multiple outcomes correctly", () => {
      const moves = [
        makeMove({ id: "m1", disruption_outcome: "placement_maintained" }),
        makeMove({ id: "m2", disruption_outcome: "placement_maintained" }),
        makeMove({ id: "m3", disruption_outcome: "emergency_move" }),
        makeMove({ id: "m4", disruption_outcome: "ongoing_monitoring" }),
      ];
      const m = computeStabilityMetrics(moves, 10);
      expect(m.by_disruption_outcome).toEqual({
        placement_maintained: 2,
        emergency_move: 1,
        ongoing_monitoring: 1,
      });
    });

    it("handles single outcome type", () => {
      const moves = [
        makeMove({ id: "m1", disruption_outcome: "not_applicable" }),
        makeMove({ id: "m2", disruption_outcome: "not_applicable" }),
      ];
      const m = computeStabilityMetrics(moves, 10);
      expect(m.by_disruption_outcome).toEqual({ not_applicable: 2 });
    });
  });

  // ── Rounding behaviour for rates ────────────────────────────────────────

  describe("rate rounding", () => {
    it("rounds child_views_sought_rate to one decimal", () => {
      const moves = [
        makeMove({ id: "m1", child_views_sought: true }),
        makeMove({ id: "m2", child_views_sought: true }),
        makeMove({ id: "m3", child_views_sought: false }),
      ];
      const m = computeStabilityMetrics(moves, 5);
      expect(m.child_views_sought_rate).toBe(66.7);
    });

    it("rounds social_worker_consulted_rate to one decimal", () => {
      const moves = [
        makeMove({ id: "m1", social_worker_consulted: true }),
        makeMove({ id: "m2", social_worker_consulted: false }),
        makeMove({ id: "m3", social_worker_consulted: false }),
      ];
      const m = computeStabilityMetrics(moves, 5);
      expect(m.social_worker_consulted_rate).toBe(33.3);
    });

    it("rounds irp_updated_rate to one decimal", () => {
      const moves = [
        makeMove({ id: "m1", irp_updated: true }),
        makeMove({ id: "m2", irp_updated: false }),
        makeMove({ id: "m3", irp_updated: false }),
      ];
      const m = computeStabilityMetrics(moves, 5);
      expect(m.irp_updated_rate).toBe(33.3);
    });
  });

  // ── Large dataset ───────────────────────────────────────────────────────

  describe("large dataset", () => {
    it("handles 50 moves across 10 children", () => {
      const moves: PlacementMove[] = [];
      for (let i = 0; i < 50; i++) {
        moves.push(
          makeMove({
            id: `m-${i}`,
            child_id: `c-${i % 10}`,
            child_name: `Child ${i % 10}`,
            planned: i % 3 === 0,
            placement_duration_days: 30 + i,
          }),
        );
      }
      const m = computeStabilityMetrics(moves, 20);
      expect(m.total_moves).toBe(50);
      expect(m.children_with_moves).toBe(10);
      expect(m.children_with_multiple_moves).toBe(10);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. identifyStabilityAlerts
// ══════════════════════════════════════════════════════════════════════════════

describe("identifyStabilityAlerts", () => {
  // ── No alerts when clean ────────────────────────────────────────────────

  describe("no alerts when clean", () => {
    it("returns empty array when no moves", () => {
      const alerts = identifyStabilityAlerts([], 5);
      expect(alerts).toEqual([]);
    });

    it("returns empty array for fully compliant move", () => {
      const move = makeMove({
        move_reason: "planned_transition",
        planned: true,
        disruption_meeting_held: true,
        child_views_sought: true,
        irp_updated: true,
      });
      const alerts = identifyStabilityAlerts([move], 5);
      expect(alerts).toEqual([]);
    });
  });

  // ── placement_breakdown alerts ──────────────────────────────────────────

  describe("placement_breakdown alert", () => {
    it("generates high severity alert for placement_breakdown", () => {
      const move = makeMove({
        id: "bd-1",
        move_reason: "placement_breakdown",
        child_name: "Alice",
        move_date: "2026-05-01",
        planned: true,
        disruption_meeting_held: true,
        child_views_sought: true,
        irp_updated: true,
      });
      const alerts = identifyStabilityAlerts([move], 5);
      const bdAlerts = alerts.filter((a) => a.type === "placement_breakdown");
      expect(bdAlerts).toHaveLength(1);
    });

    it("has severity high", () => {
      const move = makeMove({
        id: "bd-1",
        move_reason: "placement_breakdown",
        planned: true,
        disruption_meeting_held: true,
        child_views_sought: true,
        irp_updated: true,
      });
      const alerts = identifyStabilityAlerts([move], 5);
      const bdAlert = alerts.find((a) => a.type === "placement_breakdown");
      expect(bdAlert!.severity).toBe("high");
    });

    it("includes child name in message", () => {
      const move = makeMove({
        id: "bd-1",
        move_reason: "placement_breakdown",
        child_name: "Alice Smith",
        planned: true,
        disruption_meeting_held: true,
        child_views_sought: true,
        irp_updated: true,
      });
      const alerts = identifyStabilityAlerts([move], 5);
      const bdAlert = alerts.find((a) => a.type === "placement_breakdown");
      expect(bdAlert!.message).toContain("Alice Smith");
    });

    it("includes move date in message", () => {
      const move = makeMove({
        id: "bd-1",
        move_reason: "placement_breakdown",
        move_date: "2026-05-01",
        planned: true,
        disruption_meeting_held: true,
        child_views_sought: true,
        irp_updated: true,
      });
      const alerts = identifyStabilityAlerts([move], 5);
      const bdAlert = alerts.find((a) => a.type === "placement_breakdown");
      expect(bdAlert!.message).toContain("2026-05-01");
    });

    it("sets id to the move id", () => {
      const move = makeMove({
        id: "bd-42",
        move_reason: "placement_breakdown",
        planned: true,
        disruption_meeting_held: true,
        child_views_sought: true,
        irp_updated: true,
      });
      const alerts = identifyStabilityAlerts([move], 5);
      const bdAlert = alerts.find((a) => a.type === "placement_breakdown");
      expect(bdAlert!.id).toBe("bd-42");
    });

    it("generates multiple breakdown alerts for multiple breakdowns", () => {
      const moves = [
        makeMove({ id: "bd-1", move_reason: "placement_breakdown", planned: true, disruption_meeting_held: true, child_views_sought: true, irp_updated: true }),
        makeMove({ id: "bd-2", move_reason: "placement_breakdown", child_id: "c2", planned: true, disruption_meeting_held: true, child_views_sought: true, irp_updated: true }),
      ];
      const alerts = identifyStabilityAlerts(moves, 5);
      const bdAlerts = alerts.filter((a) => a.type === "placement_breakdown");
      expect(bdAlerts).toHaveLength(2);
    });

    it("does not generate breakdown alert for non-breakdown reason", () => {
      const move = makeMove({
        move_reason: "planned_transition",
        planned: true,
        disruption_meeting_held: true,
        child_views_sought: true,
        irp_updated: true,
      });
      const alerts = identifyStabilityAlerts([move], 5);
      const bdAlerts = alerts.filter((a) => a.type === "placement_breakdown");
      expect(bdAlerts).toHaveLength(0);
    });
  });

  // ── no_disruption_meeting alerts ────────────────────────────────────────

  describe("no_disruption_meeting alert", () => {
    it("generates high severity alert for unplanned move without meeting", () => {
      const move = makeMove({
        id: "ndm-1",
        planned: false,
        disruption_meeting_held: false,
        child_views_sought: true,
        irp_updated: true,
      });
      const alerts = identifyStabilityAlerts([move], 5);
      const ndmAlerts = alerts.filter((a) => a.type === "no_disruption_meeting");
      expect(ndmAlerts).toHaveLength(1);
    });

    it("has severity high", () => {
      const move = makeMove({
        id: "ndm-1",
        planned: false,
        disruption_meeting_held: false,
        child_views_sought: true,
        irp_updated: true,
      });
      const alerts = identifyStabilityAlerts([move], 5);
      const ndmAlert = alerts.find((a) => a.type === "no_disruption_meeting");
      expect(ndmAlert!.severity).toBe("high");
    });

    it("includes child name in message", () => {
      const move = makeMove({
        id: "ndm-1",
        child_name: "Bob Jones",
        planned: false,
        disruption_meeting_held: false,
        child_views_sought: true,
        irp_updated: true,
      });
      const alerts = identifyStabilityAlerts([move], 5);
      const ndmAlert = alerts.find((a) => a.type === "no_disruption_meeting");
      expect(ndmAlert!.message).toContain("Bob Jones");
    });

    it("does not fire for planned move without meeting", () => {
      const move = makeMove({
        planned: true,
        disruption_meeting_held: false,
        child_views_sought: true,
        irp_updated: true,
      });
      const alerts = identifyStabilityAlerts([move], 5);
      const ndmAlerts = alerts.filter((a) => a.type === "no_disruption_meeting");
      expect(ndmAlerts).toHaveLength(0);
    });

    it("does not fire for unplanned move with meeting held", () => {
      const move = makeMove({
        planned: false,
        disruption_meeting_held: true,
        child_views_sought: true,
        irp_updated: true,
      });
      const alerts = identifyStabilityAlerts([move], 5);
      const ndmAlerts = alerts.filter((a) => a.type === "no_disruption_meeting");
      expect(ndmAlerts).toHaveLength(0);
    });

    it("does not fire for planned move with meeting held", () => {
      const move = makeMove({
        planned: true,
        disruption_meeting_held: true,
        child_views_sought: true,
        irp_updated: true,
      });
      const alerts = identifyStabilityAlerts([move], 5);
      const ndmAlerts = alerts.filter((a) => a.type === "no_disruption_meeting");
      expect(ndmAlerts).toHaveLength(0);
    });

    it("sets id to the move id", () => {
      const move = makeMove({
        id: "ndm-99",
        planned: false,
        disruption_meeting_held: false,
        child_views_sought: true,
        irp_updated: true,
      });
      const alerts = identifyStabilityAlerts([move], 5);
      const ndmAlert = alerts.find((a) => a.type === "no_disruption_meeting");
      expect(ndmAlert!.id).toBe("ndm-99");
    });
  });

  // ── views_not_sought alerts ─────────────────────────────────────────────

  describe("views_not_sought alert", () => {
    it("generates medium severity alert when views not sought", () => {
      const move = makeMove({
        id: "vns-1",
        child_views_sought: false,
        planned: true,
        disruption_meeting_held: true,
        irp_updated: true,
      });
      const alerts = identifyStabilityAlerts([move], 5);
      const vnsAlerts = alerts.filter((a) => a.type === "views_not_sought");
      expect(vnsAlerts).toHaveLength(1);
    });

    it("has severity medium", () => {
      const move = makeMove({
        id: "vns-1",
        child_views_sought: false,
        planned: true,
        disruption_meeting_held: true,
        irp_updated: true,
      });
      const alerts = identifyStabilityAlerts([move], 5);
      const vnsAlert = alerts.find((a) => a.type === "views_not_sought");
      expect(vnsAlert!.severity).toBe("medium");
    });

    it("includes child name in message", () => {
      const move = makeMove({
        id: "vns-1",
        child_name: "Charlie Brown",
        child_views_sought: false,
        planned: true,
        disruption_meeting_held: true,
        irp_updated: true,
      });
      const alerts = identifyStabilityAlerts([move], 5);
      const vnsAlert = alerts.find((a) => a.type === "views_not_sought");
      expect(vnsAlert!.message).toContain("Charlie Brown");
    });

    it("includes move date in message", () => {
      const move = makeMove({
        id: "vns-1",
        move_date: "2026-04-15",
        child_views_sought: false,
        planned: true,
        disruption_meeting_held: true,
        irp_updated: true,
      });
      const alerts = identifyStabilityAlerts([move], 5);
      const vnsAlert = alerts.find((a) => a.type === "views_not_sought");
      expect(vnsAlert!.message).toContain("2026-04-15");
    });

    it("does not fire when views are sought", () => {
      const move = makeMove({
        child_views_sought: true,
        planned: true,
        disruption_meeting_held: true,
        irp_updated: true,
      });
      const alerts = identifyStabilityAlerts([move], 5);
      const vnsAlerts = alerts.filter((a) => a.type === "views_not_sought");
      expect(vnsAlerts).toHaveLength(0);
    });

    it("generates alerts for multiple moves with views not sought", () => {
      const moves = [
        makeMove({ id: "vns-1", child_views_sought: false, planned: true, disruption_meeting_held: true, irp_updated: true }),
        makeMove({ id: "vns-2", child_id: "c2", child_views_sought: false, planned: true, disruption_meeting_held: true, irp_updated: true }),
      ];
      const alerts = identifyStabilityAlerts(moves, 5);
      const vnsAlerts = alerts.filter((a) => a.type === "views_not_sought");
      expect(vnsAlerts).toHaveLength(2);
    });
  });

  // ── instability_pattern alerts ──────────────────────────────────────────

  describe("instability_pattern alert", () => {
    it("generates critical alert for child with 3 moves", () => {
      const moves = [
        makeMove({ id: "ip-1", child_id: "c1", child_name: "Alice", planned: true, disruption_meeting_held: true, child_views_sought: true, irp_updated: true }),
        makeMove({ id: "ip-2", child_id: "c1", child_name: "Alice", planned: true, disruption_meeting_held: true, child_views_sought: true, irp_updated: true }),
        makeMove({ id: "ip-3", child_id: "c1", child_name: "Alice", planned: true, disruption_meeting_held: true, child_views_sought: true, irp_updated: true }),
      ];
      const alerts = identifyStabilityAlerts(moves, 5);
      const ipAlerts = alerts.filter((a) => a.type === "instability_pattern");
      expect(ipAlerts).toHaveLength(1);
    });

    it("has severity critical", () => {
      const moves = [
        makeMove({ id: "ip-1", child_id: "c1", child_name: "Alice", planned: true, disruption_meeting_held: true, child_views_sought: true, irp_updated: true }),
        makeMove({ id: "ip-2", child_id: "c1", child_name: "Alice", planned: true, disruption_meeting_held: true, child_views_sought: true, irp_updated: true }),
        makeMove({ id: "ip-3", child_id: "c1", child_name: "Alice", planned: true, disruption_meeting_held: true, child_views_sought: true, irp_updated: true }),
      ];
      const alerts = identifyStabilityAlerts(moves, 5);
      const ipAlert = alerts.find((a) => a.type === "instability_pattern");
      expect(ipAlert!.severity).toBe("critical");
    });

    it("includes child name in message", () => {
      const moves = [
        makeMove({ id: "ip-1", child_id: "c1", child_name: "Diana", planned: true, disruption_meeting_held: true, child_views_sought: true, irp_updated: true }),
        makeMove({ id: "ip-2", child_id: "c1", child_name: "Diana", planned: true, disruption_meeting_held: true, child_views_sought: true, irp_updated: true }),
        makeMove({ id: "ip-3", child_id: "c1", child_name: "Diana", planned: true, disruption_meeting_held: true, child_views_sought: true, irp_updated: true }),
      ];
      const alerts = identifyStabilityAlerts(moves, 5);
      const ipAlert = alerts.find((a) => a.type === "instability_pattern");
      expect(ipAlert!.message).toContain("Diana");
    });

    it("includes move count in message", () => {
      const moves = [
        makeMove({ id: "ip-1", child_id: "c1", child_name: "Alice", planned: true, disruption_meeting_held: true, child_views_sought: true, irp_updated: true }),
        makeMove({ id: "ip-2", child_id: "c1", child_name: "Alice", planned: true, disruption_meeting_held: true, child_views_sought: true, irp_updated: true }),
        makeMove({ id: "ip-3", child_id: "c1", child_name: "Alice", planned: true, disruption_meeting_held: true, child_views_sought: true, irp_updated: true }),
        makeMove({ id: "ip-4", child_id: "c1", child_name: "Alice", planned: true, disruption_meeting_held: true, child_views_sought: true, irp_updated: true }),
      ];
      const alerts = identifyStabilityAlerts(moves, 5);
      const ipAlert = alerts.find((a) => a.type === "instability_pattern");
      expect(ipAlert!.message).toContain("4");
    });

    it("sets id to instability_ prefix plus child_id", () => {
      const moves = [
        makeMove({ id: "ip-1", child_id: "c-xyz", child_name: "Alice", planned: true, disruption_meeting_held: true, child_views_sought: true, irp_updated: true }),
        makeMove({ id: "ip-2", child_id: "c-xyz", child_name: "Alice", planned: true, disruption_meeting_held: true, child_views_sought: true, irp_updated: true }),
        makeMove({ id: "ip-3", child_id: "c-xyz", child_name: "Alice", planned: true, disruption_meeting_held: true, child_views_sought: true, irp_updated: true }),
      ];
      const alerts = identifyStabilityAlerts(moves, 5);
      const ipAlert = alerts.find((a) => a.type === "instability_pattern");
      expect(ipAlert!.id).toBe("instability_c-xyz");
    });

    it("does not fire for child with exactly 2 moves", () => {
      const moves = [
        makeMove({ id: "ip-1", child_id: "c1", child_name: "Alice", planned: true, disruption_meeting_held: true, child_views_sought: true, irp_updated: true }),
        makeMove({ id: "ip-2", child_id: "c1", child_name: "Alice", planned: true, disruption_meeting_held: true, child_views_sought: true, irp_updated: true }),
      ];
      const alerts = identifyStabilityAlerts(moves, 5);
      const ipAlerts = alerts.filter((a) => a.type === "instability_pattern");
      expect(ipAlerts).toHaveLength(0);
    });

    it("does not fire for child with exactly 1 move", () => {
      const moves = [
        makeMove({ id: "ip-1", child_id: "c1", planned: true, disruption_meeting_held: true, child_views_sought: true, irp_updated: true }),
      ];
      const alerts = identifyStabilityAlerts(moves, 5);
      const ipAlerts = alerts.filter((a) => a.type === "instability_pattern");
      expect(ipAlerts).toHaveLength(0);
    });

    it("generates separate alerts for multiple children with 3+ moves", () => {
      const moves = [
        makeMove({ id: "m1", child_id: "c1", child_name: "Alice", planned: true, disruption_meeting_held: true, child_views_sought: true, irp_updated: true }),
        makeMove({ id: "m2", child_id: "c1", child_name: "Alice", planned: true, disruption_meeting_held: true, child_views_sought: true, irp_updated: true }),
        makeMove({ id: "m3", child_id: "c1", child_name: "Alice", planned: true, disruption_meeting_held: true, child_views_sought: true, irp_updated: true }),
        makeMove({ id: "m4", child_id: "c2", child_name: "Bob", planned: true, disruption_meeting_held: true, child_views_sought: true, irp_updated: true }),
        makeMove({ id: "m5", child_id: "c2", child_name: "Bob", planned: true, disruption_meeting_held: true, child_views_sought: true, irp_updated: true }),
        makeMove({ id: "m6", child_id: "c2", child_name: "Bob", planned: true, disruption_meeting_held: true, child_views_sought: true, irp_updated: true }),
      ];
      const alerts = identifyStabilityAlerts(moves, 5);
      const ipAlerts = alerts.filter((a) => a.type === "instability_pattern");
      expect(ipAlerts).toHaveLength(2);
    });

    it("uses the child name from the moves (not child_id)", () => {
      const moves = [
        makeMove({ id: "m1", child_id: "c1", child_name: "Eve Green", planned: true, disruption_meeting_held: true, child_views_sought: true, irp_updated: true }),
        makeMove({ id: "m2", child_id: "c1", child_name: "Eve Green", planned: true, disruption_meeting_held: true, child_views_sought: true, irp_updated: true }),
        makeMove({ id: "m3", child_id: "c1", child_name: "Eve Green", planned: true, disruption_meeting_held: true, child_views_sought: true, irp_updated: true }),
      ];
      const alerts = identifyStabilityAlerts(moves, 5);
      const ipAlert = alerts.find((a) => a.type === "instability_pattern");
      expect(ipAlert!.message).toContain("Eve Green");
    });
  });

  // ── irp_not_updated alerts ──────────────────────────────────────────────

  describe("irp_not_updated alert", () => {
    it("generates medium severity alert when IRP not updated", () => {
      const move = makeMove({
        id: "irp-1",
        irp_updated: false,
        planned: true,
        disruption_meeting_held: true,
        child_views_sought: true,
      });
      const alerts = identifyStabilityAlerts([move], 5);
      const irpAlerts = alerts.filter((a) => a.type === "irp_not_updated");
      expect(irpAlerts).toHaveLength(1);
    });

    it("has severity medium", () => {
      const move = makeMove({
        id: "irp-1",
        irp_updated: false,
        planned: true,
        disruption_meeting_held: true,
        child_views_sought: true,
      });
      const alerts = identifyStabilityAlerts([move], 5);
      const irpAlert = alerts.find((a) => a.type === "irp_not_updated");
      expect(irpAlert!.severity).toBe("medium");
    });

    it("includes child name in message", () => {
      const move = makeMove({
        id: "irp-1",
        child_name: "Frank Wilson",
        irp_updated: false,
        planned: true,
        disruption_meeting_held: true,
        child_views_sought: true,
      });
      const alerts = identifyStabilityAlerts([move], 5);
      const irpAlert = alerts.find((a) => a.type === "irp_not_updated");
      expect(irpAlert!.message).toContain("Frank Wilson");
    });

    it("includes move date in message", () => {
      const move = makeMove({
        id: "irp-1",
        move_date: "2026-03-20",
        irp_updated: false,
        planned: true,
        disruption_meeting_held: true,
        child_views_sought: true,
      });
      const alerts = identifyStabilityAlerts([move], 5);
      const irpAlert = alerts.find((a) => a.type === "irp_not_updated");
      expect(irpAlert!.message).toContain("2026-03-20");
    });

    it("does not fire when IRP is updated", () => {
      const move = makeMove({
        irp_updated: true,
        planned: true,
        disruption_meeting_held: true,
        child_views_sought: true,
      });
      const alerts = identifyStabilityAlerts([move], 5);
      const irpAlerts = alerts.filter((a) => a.type === "irp_not_updated");
      expect(irpAlerts).toHaveLength(0);
    });

    it("generates alerts for multiple moves with IRP not updated", () => {
      const moves = [
        makeMove({ id: "irp-1", irp_updated: false, planned: true, disruption_meeting_held: true, child_views_sought: true }),
        makeMove({ id: "irp-2", child_id: "c2", irp_updated: false, planned: true, disruption_meeting_held: true, child_views_sought: true }),
        makeMove({ id: "irp-3", child_id: "c3", irp_updated: false, planned: true, disruption_meeting_held: true, child_views_sought: true }),
      ];
      const alerts = identifyStabilityAlerts(moves, 5);
      const irpAlerts = alerts.filter((a) => a.type === "irp_not_updated");
      expect(irpAlerts).toHaveLength(3);
    });

    it("sets id to the move id", () => {
      const move = makeMove({
        id: "irp-42",
        irp_updated: false,
        planned: true,
        disruption_meeting_held: true,
        child_views_sought: true,
      });
      const alerts = identifyStabilityAlerts([move], 5);
      const irpAlert = alerts.find((a) => a.type === "irp_not_updated");
      expect(irpAlert!.id).toBe("irp-42");
    });
  });

  // ── Combined alerts ─────────────────────────────────────────────────────

  describe("combined alerts", () => {
    it("generates all alert types for a move that triggers all conditions", () => {
      const move = makeMove({
        id: "combo-1",
        move_reason: "placement_breakdown",
        planned: false,
        disruption_meeting_held: false,
        child_views_sought: false,
        irp_updated: false,
      });
      const alerts = identifyStabilityAlerts([move], 5);
      const types = new Set(alerts.map((a) => a.type));
      expect(types.has("placement_breakdown")).toBe(true);
      expect(types.has("no_disruption_meeting")).toBe(true);
      expect(types.has("views_not_sought")).toBe(true);
      expect(types.has("irp_not_updated")).toBe(true);
    });

    it("does not generate instability_pattern for single problematic move", () => {
      const move = makeMove({
        id: "combo-1",
        move_reason: "placement_breakdown",
        planned: false,
        disruption_meeting_held: false,
        child_views_sought: false,
        irp_updated: false,
      });
      const alerts = identifyStabilityAlerts([move], 5);
      const ipAlerts = alerts.filter((a) => a.type === "instability_pattern");
      expect(ipAlerts).toHaveLength(0);
    });

    it("generates instability + breakdown + no_meeting + views + irp alerts for 3 bad moves from same child", () => {
      const moves = [
        makeMove({ id: "combo-1", child_id: "c1", child_name: "Alice", move_reason: "placement_breakdown", planned: false, disruption_meeting_held: false, child_views_sought: false, irp_updated: false }),
        makeMove({ id: "combo-2", child_id: "c1", child_name: "Alice", move_reason: "placement_breakdown", planned: false, disruption_meeting_held: false, child_views_sought: false, irp_updated: false }),
        makeMove({ id: "combo-3", child_id: "c1", child_name: "Alice", move_reason: "placement_breakdown", planned: false, disruption_meeting_held: false, child_views_sought: false, irp_updated: false }),
      ];
      const alerts = identifyStabilityAlerts(moves, 5);
      const types = alerts.map((a) => a.type);
      expect(types.filter((t) => t === "placement_breakdown")).toHaveLength(3);
      expect(types.filter((t) => t === "no_disruption_meeting")).toHaveLength(3);
      expect(types.filter((t) => t === "views_not_sought")).toHaveLength(3);
      expect(types.filter((t) => t === "irp_not_updated")).toHaveLength(3);
      expect(types.filter((t) => t === "instability_pattern")).toHaveLength(1);
    });

    it("generates correct total alert count for mixed moves", () => {
      const moves = [
        makeMove({ id: "a", child_id: "c1", move_reason: "planned_transition", planned: true, disruption_meeting_held: true, child_views_sought: true, irp_updated: true }),
        makeMove({ id: "b", child_id: "c2", move_reason: "placement_breakdown", planned: false, disruption_meeting_held: false, child_views_sought: false, irp_updated: false }),
      ];
      const alerts = identifyStabilityAlerts(moves, 5);
      // b: placement_breakdown(1) + no_disruption_meeting(1) + views_not_sought(1) + irp_not_updated(1)
      expect(alerts).toHaveLength(4);
    });
  });

  // ── Alert ordering ──────────────────────────────────────────────────────

  describe("alert ordering", () => {
    it("placement_breakdown alerts come before no_disruption_meeting alerts", () => {
      const move = makeMove({
        id: "order-1",
        move_reason: "placement_breakdown",
        planned: false,
        disruption_meeting_held: false,
        child_views_sought: true,
        irp_updated: true,
      });
      const alerts = identifyStabilityAlerts([move], 5);
      const bdIdx = alerts.findIndex((a) => a.type === "placement_breakdown");
      const ndmIdx = alerts.findIndex((a) => a.type === "no_disruption_meeting");
      expect(bdIdx).toBeLessThan(ndmIdx);
    });

    it("no_disruption_meeting alerts come before views_not_sought alerts", () => {
      const move = makeMove({
        id: "order-1",
        planned: false,
        disruption_meeting_held: false,
        child_views_sought: false,
        irp_updated: true,
      });
      const alerts = identifyStabilityAlerts([move], 5);
      const ndmIdx = alerts.findIndex((a) => a.type === "no_disruption_meeting");
      const vnsIdx = alerts.findIndex((a) => a.type === "views_not_sought");
      expect(ndmIdx).toBeLessThan(vnsIdx);
    });

    it("views_not_sought alerts come before instability_pattern alerts", () => {
      const moves = [
        makeMove({ id: "o1", child_id: "c1", planned: true, disruption_meeting_held: true, child_views_sought: false, irp_updated: true }),
        makeMove({ id: "o2", child_id: "c1", planned: true, disruption_meeting_held: true, child_views_sought: false, irp_updated: true }),
        makeMove({ id: "o3", child_id: "c1", planned: true, disruption_meeting_held: true, child_views_sought: false, irp_updated: true }),
      ];
      const alerts = identifyStabilityAlerts(moves, 5);
      const vnsIdx = alerts.findIndex((a) => a.type === "views_not_sought");
      const ipIdx = alerts.findIndex((a) => a.type === "instability_pattern");
      expect(vnsIdx).toBeLessThan(ipIdx);
    });

    it("instability_pattern alerts come before irp_not_updated alerts", () => {
      const moves = [
        makeMove({ id: "o1", child_id: "c1", planned: true, disruption_meeting_held: true, child_views_sought: true, irp_updated: false }),
        makeMove({ id: "o2", child_id: "c1", planned: true, disruption_meeting_held: true, child_views_sought: true, irp_updated: false }),
        makeMove({ id: "o3", child_id: "c1", planned: true, disruption_meeting_held: true, child_views_sought: true, irp_updated: false }),
      ];
      const alerts = identifyStabilityAlerts(moves, 5);
      const ipIdx = alerts.findIndex((a) => a.type === "instability_pattern");
      const irpIdx = alerts.findIndex((a) => a.type === "irp_not_updated");
      expect(ipIdx).toBeLessThan(irpIdx);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. CRUD fallback (Supabase disabled)
// ══════════════════════════════════════════════════════════════════════════════

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => false,
  createServerClient: () => null,
}));

describe("CRUD fallback (Supabase disabled)", () => {
  it("listMoves returns ok with empty data", async () => {
    const { listMoves } = await import("../placement-stability-service");
    const result = await listMoves("home-1");
    expect(result).toEqual({ ok: true, data: [] });
  });

  it("listMoves returns ok with filters", async () => {
    const { listMoves } = await import("../placement-stability-service");
    const result = await listMoves("home-1", { childId: "c1", placementType: "residential" });
    expect(result).toEqual({ ok: true, data: [] });
  });

  it("listMoves returns ok with date range filters", async () => {
    const { listMoves } = await import("../placement-stability-service");
    const result = await listMoves("home-1", { dateFrom: "2026-01-01", dateTo: "2026-12-31" });
    expect(result).toEqual({ ok: true, data: [] });
  });

  it("listMoves returns ok with moveReason filter", async () => {
    const { listMoves } = await import("../placement-stability-service");
    const result = await listMoves("home-1", { moveReason: "safeguarding" });
    expect(result).toEqual({ ok: true, data: [] });
  });

  it("listMoves returns ok with limit filter", async () => {
    const { listMoves } = await import("../placement-stability-service");
    const result = await listMoves("home-1", { limit: 10 });
    expect(result).toEqual({ ok: true, data: [] });
  });

  it("createMove returns error when Supabase disabled", async () => {
    const { createMove } = await import("../placement-stability-service");
    const result = await createMove({
      homeId: "home-1",
      childName: "Alice Smith",
      childId: "child-1",
      moveDate: "2026-05-01",
      placementType: "residential",
      moveReason: "planned_transition",
      planned: true,
      disruptionMeetingHeld: true,
      disruptionOutcome: "not_applicable",
      placementDurationDays: 90,
      childViewsSought: true,
      socialWorkerConsulted: true,
      irpUpdated: true,
    });
    expect(result).toEqual({ ok: false, error: "Supabase not configured" });
  });

  it("createMove returns error with optional fields", async () => {
    const { createMove } = await import("../placement-stability-service");
    const result = await createMove({
      homeId: "home-1",
      childName: "Bob Jones",
      childId: "child-2",
      moveDate: "2026-05-10",
      placementType: "foster_care",
      previousPlacementType: "residential",
      moveReason: "placement_breakdown",
      planned: false,
      disruptionMeetingHeld: false,
      disruptionOutcome: "emergency_move",
      placementDurationDays: 15,
      childViewsSought: false,
      childViews: "Child was upset",
      socialWorkerConsulted: false,
      irpUpdated: false,
      notes: "Emergency breakdown",
    });
    expect(result).toEqual({ ok: false, error: "Supabase not configured" });
  });

  it("updateMove returns error when Supabase disabled", async () => {
    const { updateMove } = await import("../placement-stability-service");
    const result = await updateMove("move-1", { planned: false });
    expect(result).toEqual({ ok: false, error: "Supabase not configured" });
  });

  it("updateMove returns error with multiple fields", async () => {
    const { updateMove } = await import("../placement-stability-service");
    const result = await updateMove("move-1", {
      placement_type: "foster_care",
      move_reason: "safeguarding",
      planned: false,
      notes: "Updated notes",
    });
    expect(result).toEqual({ ok: false, error: "Supabase not configured" });
  });
});
