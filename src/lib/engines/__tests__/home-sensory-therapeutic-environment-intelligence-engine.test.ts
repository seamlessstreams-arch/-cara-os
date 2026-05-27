// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME SENSORY & THERAPEUTIC ENVIRONMENT INTELLIGENCE ENGINE — TESTS
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeHomeSensoryTherapeuticEnvironment,
  type SensoryTherapeuticInput,
  type SensoryRoomUsageInput,
  type SensoryEquipmentInput,
  type PhysicalActivityInput,
} from "../home-sensory-therapeutic-environment-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeSensoryUsage(
  id: string,
  childId: string,
  overrides: Partial<SensoryRoomUsageInput> = {},
): SensoryRoomUsageInput {
  return {
    id,
    child_id: childId,
    date: "2026-05-01",
    duration_minutes: 30,
    was_beneficial: true,
    staff_supported: true,
    ...overrides,
  };
}

function makeEquipment(
  id: string,
  overrides: Partial<SensoryEquipmentInput> = {},
): SensoryEquipmentInput {
  return {
    id,
    item_name: "Weighted blanket",
    condition: "good",
    last_checked: "2026-04-01",
    in_use: true,
    ...overrides,
  };
}

function makeActivity(
  id: string,
  childId: string,
  overrides: Partial<PhysicalActivityInput> = {},
): PhysicalActivityInput {
  return {
    id,
    child_id: childId,
    date: "2026-05-01",
    activity_type: "sport",
    duration_minutes: 60,
    child_enjoyed: true,
    ...overrides,
  };
}

function baseInput(overrides: Partial<SensoryTherapeuticInput> = {}): SensoryTherapeuticInput {
  return {
    today: "2026-05-15",
    total_children: 4,
    sensory_room_usage: [
      makeSensoryUsage("s1", "c1"),
      makeSensoryUsage("s2", "c2"),
      makeSensoryUsage("s3", "c3"),
      makeSensoryUsage("s4", "c4"),
    ],
    sensory_equipment: [
      makeEquipment("e1"),
      makeEquipment("e2"),
      makeEquipment("e3"),
      makeEquipment("e4"),
    ],
    physical_activities: [
      makeActivity("a1", "c1"),
      makeActivity("a2", "c2"),
      makeActivity("a3", "c3"),
      makeActivity("a4", "c4"),
    ],
    ...overrides,
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("computeHomeSensoryTherapeuticEnvironment", () => {

  // ─── Insufficient Data ──────────────────────────────────────

  describe("insufficient data", () => {
    it("returns insufficient_data when 0 children", () => {
      const r = computeHomeSensoryTherapeuticEnvironment(baseInput({ total_children: 0 }));
      expect(r.sensory_rating).toBe("insufficient_data");
      expect(r.sensory_score).toBe(0);
    });

    it("returns zero metrics on insufficient data", () => {
      const r = computeHomeSensoryTherapeuticEnvironment(baseInput({ total_children: 0 }));
      expect(r.children_using_sensory_room).toBe(0);
      expect(r.sensory_beneficial_rate).toBe(0);
      expect(r.equipment_condition_rate).toBe(0);
      expect(r.children_physically_active).toBe(0);
      expect(r.activity_enjoyment_rate).toBe(0);
    });
  });

  // ─── Rating Classifications ─────────────────────────────────

  describe("rating classifications", () => {
    it("rates outstanding with full provision — score 81", () => {
      // base: 52
      // Mod 1: coverage 100% → +5
      // Mod 2: beneficial 100% → +5
      // Mod 3: condition 100% → +5
      // Mod 4: active 100% → +6
      // Mod 5: enjoy 100% → +4
      // Mod 6: support 100% → +4
      // Total: 52+5+5+5+6+4+4 = 81
      const r = computeHomeSensoryTherapeuticEnvironment(baseInput());
      expect(r.sensory_rating).toBe("outstanding");
      expect(r.sensory_score).toBe(81);
    });

    it("rates good when 2-3 modifiers degraded — score 74", () => {
      // Degrade: 3/4 active (75% → +3), 1 equipment poor (75% → +3), 3/4 staff supported (75% → +2)
      // Mod 1: coverage 100% → +5
      // Mod 2: beneficial 100% → +5
      // Mod 3: conditionRate 75% → +3
      // Mod 4: activeRate 75% → +3
      // Mod 5: enjoyRate 100% → +4
      // Mod 6: supportRate 75% → +2
      // Total: 52+5+5+3+3+4+2 = 74
      const r = computeHomeSensoryTherapeuticEnvironment(baseInput({
        sensory_room_usage: [
          makeSensoryUsage("s1", "c1"),
          makeSensoryUsage("s2", "c2"),
          makeSensoryUsage("s3", "c3"),
          makeSensoryUsage("s4", "c4", { staff_supported: false }),
        ],
        sensory_equipment: [
          makeEquipment("e1"),
          makeEquipment("e2"),
          makeEquipment("e3"),
          makeEquipment("e4", { condition: "poor" }),
        ],
        physical_activities: [
          makeActivity("a1", "c1"),
          makeActivity("a2", "c2"),
          makeActivity("a3", "c3"),
        ],
      }));
      expect(r.sensory_rating).toBe("good");
      expect(r.sensory_score).toBe(74);
    });

    it("rates adequate with moderate gaps — score 52", () => {
      // No sensory data at all → Mod 1: +0, Mod 2: +0, Mod 6: +0
      // No equipment → Mod 3: -2
      // 2/4 active (50%) → Mod 4: >=40 → +0
      // 1/2 enjoyed (50%) → Mod 5: >=50 → +0
      // Total: 52+0+0-2+0+0+0 = 50
      const r = computeHomeSensoryTherapeuticEnvironment(baseInput({
        sensory_room_usage: [],
        sensory_equipment: [],
        physical_activities: [
          makeActivity("a1", "c1"),
          makeActivity("a2", "c2", { child_enjoyed: false }),
        ],
      }));
      expect(r.sensory_rating).toBe("adequate");
      expect(r.sensory_score).toBe(50);
    });

    it("rates inadequate with severe deficits — score 23", () => {
      // 1/4 sensory coverage (25%) → Mod 1: -5
      // 0/4 beneficial → Mod 2: -5
      // 0/4 equipment good → Mod 3: -5
      // 1/4 active (25%) → Mod 4: -6
      // 0/1 enjoyed → Mod 5: -4
      // 0/4 staff supported → Mod 6: -4
      // Total: 52-5-5-5-6-4-4 = 23
      const r = computeHomeSensoryTherapeuticEnvironment(baseInput({
        sensory_room_usage: [
          makeSensoryUsage("s1", "c1", { was_beneficial: false, staff_supported: false }),
          makeSensoryUsage("s2", "c1", { was_beneficial: false, staff_supported: false }),
          makeSensoryUsage("s3", "c1", { was_beneficial: false, staff_supported: false }),
          makeSensoryUsage("s4", "c1", { was_beneficial: false, staff_supported: false }),
        ],
        sensory_equipment: [
          makeEquipment("e1", { condition: "broken" }),
          makeEquipment("e2", { condition: "poor" }),
          makeEquipment("e3", { condition: "broken" }),
          makeEquipment("e4", { condition: "poor" }),
        ],
        physical_activities: [
          makeActivity("a1", "c1", { child_enjoyed: false }),
        ],
      }));
      expect(r.sensory_rating).toBe("inadequate");
      expect(r.sensory_score).toBe(23);
    });
  });

  // ─── Metric Calculations ────────────────────────────────────

  describe("metric calculations", () => {
    it("counts children_using_sensory_room as unique child_ids", () => {
      const r = computeHomeSensoryTherapeuticEnvironment(baseInput({
        sensory_room_usage: [
          makeSensoryUsage("s1", "c1"),
          makeSensoryUsage("s2", "c1"),
          makeSensoryUsage("s3", "c2"),
        ],
      }));
      expect(r.children_using_sensory_room).toBe(2);
    });

    it("calculates equipment_condition_rate correctly", () => {
      const r = computeHomeSensoryTherapeuticEnvironment(baseInput({
        sensory_equipment: [
          makeEquipment("e1", { condition: "good" }),
          makeEquipment("e2", { condition: "fair" }),
          makeEquipment("e3", { condition: "poor" }),
          makeEquipment("e4", { condition: "broken" }),
        ],
      }));
      // 2 good/fair out of 4 = 50%
      expect(r.equipment_condition_rate).toBe(50);
    });

    it("calculates activity_enjoyment_rate correctly", () => {
      const r = computeHomeSensoryTherapeuticEnvironment(baseInput({
        physical_activities: [
          makeActivity("a1", "c1", { child_enjoyed: true }),
          makeActivity("a2", "c2", { child_enjoyed: true }),
          makeActivity("a3", "c3", { child_enjoyed: false }),
        ],
      }));
      // 2/3 = 67%
      expect(r.activity_enjoyment_rate).toBe(67);
    });

    it("counts children_physically_active as unique child_ids", () => {
      const r = computeHomeSensoryTherapeuticEnvironment(baseInput({
        physical_activities: [
          makeActivity("a1", "c1"),
          makeActivity("a2", "c1"),
          makeActivity("a3", "c2"),
          makeActivity("a4", "c3"),
        ],
      }));
      expect(r.children_physically_active).toBe(3);
    });

    it("calculates sensory_beneficial_rate correctly", () => {
      const r = computeHomeSensoryTherapeuticEnvironment(baseInput({
        sensory_room_usage: [
          makeSensoryUsage("s1", "c1", { was_beneficial: true }),
          makeSensoryUsage("s2", "c2", { was_beneficial: true }),
          makeSensoryUsage("s3", "c3", { was_beneficial: false }),
        ],
      }));
      // 2/3 = 67%
      expect(r.sensory_beneficial_rate).toBe(67);
    });
  });

  // ─── Strengths ──────────────────────────────────────────────

  describe("strengths", () => {
    it("includes sensory room access strength when coverage >= 70%", () => {
      const r = computeHomeSensoryTherapeuticEnvironment(baseInput());
      expect(r.strengths.some(s => s.includes("sensory room"))).toBe(true);
    });

    it("includes equipment condition strength when rate >= 90%", () => {
      const r = computeHomeSensoryTherapeuticEnvironment(baseInput());
      expect(r.strengths.some(s => s.includes("equipment"))).toBe(true);
    });

    it("includes physical activity strength when rate >= 80%", () => {
      const r = computeHomeSensoryTherapeuticEnvironment(baseInput());
      expect(r.strengths.some(s => s.includes("physically active"))).toBe(true);
    });

    it("includes beneficial sessions strength when rate >= 90%", () => {
      const r = computeHomeSensoryTherapeuticEnvironment(baseInput());
      expect(r.strengths.some(s => s.includes("beneficial"))).toBe(true);
    });

    it("includes activity enjoyment strength when rate >= 90%", () => {
      const r = computeHomeSensoryTherapeuticEnvironment(baseInput());
      expect(r.strengths.some(s => s.includes("enjoyed"))).toBe(true);
    });
  });

  // ─── Concerns ───────────────────────────────────────────────

  describe("concerns", () => {
    it("flags poor equipment condition when rate < 50%", () => {
      const r = computeHomeSensoryTherapeuticEnvironment(baseInput({
        sensory_equipment: [
          makeEquipment("e1", { condition: "broken" }),
          makeEquipment("e2", { condition: "poor" }),
          makeEquipment("e3", { condition: "broken" }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("equipment"))).toBe(true);
    });

    it("flags low physical activity when rate < 40%", () => {
      const r = computeHomeSensoryTherapeuticEnvironment(baseInput({
        physical_activities: [
          makeActivity("a1", "c1"),
        ],
      }));
      // 1/4 = 25% < 40%
      expect(r.concerns.some(c => c.includes("physically active"))).toBe(true);
    });

    it("flags low beneficial rate when < 50%", () => {
      const r = computeHomeSensoryTherapeuticEnvironment(baseInput({
        sensory_room_usage: [
          makeSensoryUsage("s1", "c1", { was_beneficial: false }),
          makeSensoryUsage("s2", "c2", { was_beneficial: false }),
          makeSensoryUsage("s3", "c3", { was_beneficial: false }),
          makeSensoryUsage("s4", "c4", { was_beneficial: true }),
        ],
      }));
      // 1/4 = 25% < 50%
      expect(r.concerns.some(c => c.includes("sensory sessions beneficial"))).toBe(true);
    });

    it("flags low staff support when < 50%", () => {
      const r = computeHomeSensoryTherapeuticEnvironment(baseInput({
        sensory_room_usage: [
          makeSensoryUsage("s1", "c1", { staff_supported: false }),
          makeSensoryUsage("s2", "c2", { staff_supported: false }),
          makeSensoryUsage("s3", "c3", { staff_supported: false }),
          makeSensoryUsage("s4", "c4", { staff_supported: true }),
        ],
      }));
      // 1/4 = 25% < 50%
      expect(r.concerns.some(c => c.includes("staff-supported"))).toBe(true);
    });
  });

  // ─── Recommendations ────────────────────────────────────────

  describe("recommendations", () => {
    it("recommends expanding physical activity when rate < 60%", () => {
      const r = computeHomeSensoryTherapeuticEnvironment(baseInput({
        physical_activities: [
          makeActivity("a1", "c1"),
          makeActivity("a2", "c2"),
        ],
      }));
      // 2/4 = 50% < 60%
      expect(r.recommendations.some(rec => rec.recommendation.includes("physical activity"))).toBe(true);
      expect(r.recommendations.some(rec => rec.regulatory_ref === "Reg 9")).toBe(true);
    });

    it("recommends equipment audit when condition rate < 70%", () => {
      const r = computeHomeSensoryTherapeuticEnvironment(baseInput({
        sensory_equipment: [
          makeEquipment("e1", { condition: "good" }),
          makeEquipment("e2", { condition: "poor" }),
          makeEquipment("e3", { condition: "broken" }),
        ],
      }));
      // 1/3 = 33% < 70%
      expect(r.recommendations.some(rec => rec.recommendation.includes("sensory equipment"))).toBe(true);
      expect(r.recommendations.some(rec => rec.regulatory_ref === "Reg 10")).toBe(true);
    });

    it("recommends sensory review when beneficial rate < 70%", () => {
      const r = computeHomeSensoryTherapeuticEnvironment(baseInput({
        sensory_room_usage: [
          makeSensoryUsage("s1", "c1", { was_beneficial: true }),
          makeSensoryUsage("s2", "c2", { was_beneficial: true }),
          makeSensoryUsage("s3", "c3", { was_beneficial: false }),
          makeSensoryUsage("s4", "c4", { was_beneficial: false }),
        ],
      }));
      // 2/4 = 50% < 70%
      expect(r.recommendations.some(rec => rec.recommendation.includes("sensory intervention"))).toBe(true);
    });

    it("recommends improvement plan when score < 65", () => {
      const r = computeHomeSensoryTherapeuticEnvironment(baseInput({
        sensory_room_usage: [],
        sensory_equipment: [],
        physical_activities: [],
      }));
      // 52+0+0-2-6+0+0 = 44 < 65
      expect(r.recommendations.some(rec => rec.recommendation.includes("improvement plan"))).toBe(true);
      expect(r.recommendations.some(rec => rec.urgency === "planned")).toBe(true);
    });
  });

  // ─── Insights ───────────────────────────────────────────────

  describe("insights", () => {
    it("generates positive insight for outstanding", () => {
      const r = computeHomeSensoryTherapeuticEnvironment(baseInput());
      expect(r.insights.some(i => i.severity === "positive")).toBe(true);
    });

    it("generates critical insight for inadequate", () => {
      const r = computeHomeSensoryTherapeuticEnvironment(baseInput({
        sensory_room_usage: [
          makeSensoryUsage("s1", "c1", { was_beneficial: false, staff_supported: false }),
          makeSensoryUsage("s2", "c1", { was_beneficial: false, staff_supported: false }),
          makeSensoryUsage("s3", "c1", { was_beneficial: false, staff_supported: false }),
          makeSensoryUsage("s4", "c1", { was_beneficial: false, staff_supported: false }),
        ],
        sensory_equipment: [
          makeEquipment("e1", { condition: "broken" }),
          makeEquipment("e2", { condition: "poor" }),
          makeEquipment("e3", { condition: "broken" }),
          makeEquipment("e4", { condition: "poor" }),
        ],
        physical_activities: [
          makeActivity("a1", "c1", { child_enjoyed: false }),
        ],
      }));
      expect(r.insights.some(i => i.severity === "critical")).toBe(true);
    });

    it("generates positive insight for strong staff-supported therapeutic practice", () => {
      // Need beneficialRate >= 85 and supportRate >= 85
      const r = computeHomeSensoryTherapeuticEnvironment(baseInput());
      // 100% beneficial, 100% support
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("Staff-supported"))).toBe(true);
    });

    it("generates warning insight for degraded equipment with active sessions", () => {
      // conditionRate < 50 and totalSessions >= 5
      const r = computeHomeSensoryTherapeuticEnvironment(baseInput({
        sensory_room_usage: [
          makeSensoryUsage("s1", "c1"),
          makeSensoryUsage("s2", "c2"),
          makeSensoryUsage("s3", "c3"),
          makeSensoryUsage("s4", "c4"),
          makeSensoryUsage("s5", "c1"),
        ],
        sensory_equipment: [
          makeEquipment("e1", { condition: "broken" }),
          makeEquipment("e2", { condition: "poor" }),
          makeEquipment("e3", { condition: "broken" }),
          makeEquipment("e4", { condition: "poor" }),
        ],
      }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("degraded"))).toBe(true);
    });
  });

  // ─── Headlines ──────────────────────────────────────────────

  describe("headlines", () => {
    it("outstanding headline contains 'Outstanding'", () => {
      const r = computeHomeSensoryTherapeuticEnvironment(baseInput());
      expect(r.headline).toContain("Outstanding");
    });

    it("good headline reflects concern count", () => {
      const r = computeHomeSensoryTherapeuticEnvironment(baseInput({
        sensory_room_usage: [
          makeSensoryUsage("s1", "c1"),
          makeSensoryUsage("s2", "c2"),
          makeSensoryUsage("s3", "c3"),
          makeSensoryUsage("s4", "c4", { staff_supported: false }),
        ],
        sensory_equipment: [
          makeEquipment("e1"),
          makeEquipment("e2"),
          makeEquipment("e3"),
          makeEquipment("e4", { condition: "poor" }),
        ],
        physical_activities: [
          makeActivity("a1", "c1"),
          makeActivity("a2", "c2"),
          makeActivity("a3", "c3"),
        ],
      }));
      expect(r.headline).toContain("Good");
    });

    it("adequate headline references gaps", () => {
      const r = computeHomeSensoryTherapeuticEnvironment(baseInput({
        sensory_room_usage: [],
        sensory_equipment: [],
        physical_activities: [
          makeActivity("a1", "c1"),
          makeActivity("a2", "c2"),
        ],
      }));
      expect(r.headline).toContain("Adequate");
    });

    it("inadequate headline reflects severity", () => {
      const r = computeHomeSensoryTherapeuticEnvironment(baseInput({
        sensory_room_usage: [
          makeSensoryUsage("s1", "c1", { was_beneficial: false, staff_supported: false }),
          makeSensoryUsage("s2", "c1", { was_beneficial: false, staff_supported: false }),
          makeSensoryUsage("s3", "c1", { was_beneficial: false, staff_supported: false }),
          makeSensoryUsage("s4", "c1", { was_beneficial: false, staff_supported: false }),
        ],
        sensory_equipment: [
          makeEquipment("e1", { condition: "broken" }),
          makeEquipment("e2", { condition: "poor" }),
          makeEquipment("e3", { condition: "broken" }),
          makeEquipment("e4", { condition: "poor" }),
        ],
        physical_activities: [
          makeActivity("a1", "c1", { child_enjoyed: false }),
        ],
      }));
      expect(r.headline.toLowerCase()).toContain("inadequate");
    });

    it("insufficient data headline", () => {
      const r = computeHomeSensoryTherapeuticEnvironment(baseInput({ total_children: 0 }));
      expect(r.headline).toContain("cannot be assessed");
    });
  });

  // ─── Edge Cases ─────────────────────────────────────────────

  describe("edge cases", () => {
    it("handles empty sensory_room_usage with neutral scoring", () => {
      // No sensory data → Mod 1: +0, Mod 2: +0, Mod 6: +0
      const r = computeHomeSensoryTherapeuticEnvironment(baseInput({
        sensory_room_usage: [],
      }));
      // 52+0+0+5+6+4+0 = 67 → good
      expect(r.sensory_score).toBe(67);
      expect(r.sensory_rating).toBe("good");
    });

    it("handles empty equipment with -2 penalty", () => {
      const r = computeHomeSensoryTherapeuticEnvironment(baseInput({
        sensory_equipment: [],
      }));
      // 52+5+5-2+6+4+4 = 74 → good
      expect(r.sensory_score).toBe(74);
    });

    it("handles empty physical_activities with -6 penalty", () => {
      const r = computeHomeSensoryTherapeuticEnvironment(baseInput({
        physical_activities: [],
      }));
      // 52+5+5+5-6+0+4 = 65 → good
      expect(r.sensory_score).toBe(65);
      expect(r.sensory_rating).toBe("good");
    });

    it("handles all collections empty", () => {
      const r = computeHomeSensoryTherapeuticEnvironment(baseInput({
        sensory_room_usage: [],
        sensory_equipment: [],
        physical_activities: [],
      }));
      // 52+0+0-2-6+0+0 = 44 → inadequate
      expect(r.sensory_score).toBe(44);
      expect(r.sensory_rating).toBe("inadequate");
    });

    it("score stays within 0-100", () => {
      const r = computeHomeSensoryTherapeuticEnvironment(baseInput());
      expect(r.sensory_score).toBeGreaterThanOrEqual(0);
      expect(r.sensory_score).toBeLessThanOrEqual(100);
    });

    it("score does not go below 0 in worst case", () => {
      const r = computeHomeSensoryTherapeuticEnvironment(baseInput({
        sensory_room_usage: [
          makeSensoryUsage("s1", "c1", { was_beneficial: false, staff_supported: false }),
          makeSensoryUsage("s2", "c1", { was_beneficial: false, staff_supported: false }),
          makeSensoryUsage("s3", "c1", { was_beneficial: false, staff_supported: false }),
          makeSensoryUsage("s4", "c1", { was_beneficial: false, staff_supported: false }),
        ],
        sensory_equipment: [
          makeEquipment("e1", { condition: "broken" }),
          makeEquipment("e2", { condition: "poor" }),
          makeEquipment("e3", { condition: "broken" }),
          makeEquipment("e4", { condition: "poor" }),
        ],
        physical_activities: [
          makeActivity("a1", "c1", { child_enjoyed: false }),
        ],
      }));
      expect(r.sensory_score).toBeGreaterThanOrEqual(0);
    });

    it("no strengths when all metrics are poor", () => {
      const r = computeHomeSensoryTherapeuticEnvironment(baseInput({
        sensory_room_usage: [
          makeSensoryUsage("s1", "c1", { was_beneficial: false, staff_supported: false }),
        ],
        sensory_equipment: [
          makeEquipment("e1", { condition: "broken" }),
        ],
        physical_activities: [
          makeActivity("a1", "c1", { child_enjoyed: false }),
        ],
      }));
      expect(r.strengths.length).toBe(0);
    });
  });
});
