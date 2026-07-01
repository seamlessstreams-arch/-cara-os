// ══════════════════════════════════════════════════════════════════════════════
// CARA — EMERGENCY PREPAREDNESS INTELLIGENCE ENGINE · TEST SUITE
//
// 50+ tests covering overview, drill type statuses, recent drills, plan
// coverage, alerts, Cara insights, and Chamberlain House integration data.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeEmergencyIntelligence,
  daysUntil,
  daysSince,
  ALL_SCENARIO_TYPES,
  ALL_PLAN_TYPES,
  SCENARIO_TYPE_LABELS,
  type ProtocolDrillInput,
  type EmergencyPlanInput,
  type StaffRef,
} from "../emergency-intelligence-engine";

const TODAY = "2026-05-25";

const STAFF: StaffRef[] = [
  { id: "staff_darren", name: "Darren" },
  { id: "staff_ryan", name: "Ryan" },
  { id: "staff_anna", name: "Anna" },
];

// ── Factory Functions ─────────────────────────────────────────────────────

let _id = 0;
function uid(): string {
  return `test_${++_id}`;
}

function makeDrill(overrides: Partial<ProtocolDrillInput> = {}): ProtocolDrillInput {
  return {
    id: uid(),
    date: "2026-04-01",
    scenario_type: "evacuation",
    lead_by: "staff_darren",
    participants: ["staff_darren", "staff_ryan"],
    response_time_minutes: 3,
    protocol_followed: true,
    outcome: "satisfactory",
    next_drill_due: "2026-07-01",
    actions_required: [],
    learning_points: [],
    ...overrides,
  };
}

function makePlan(overrides: Partial<EmergencyPlanInput> = {}): EmergencyPlanInput {
  return {
    id: uid(),
    title: "Test Emergency Plan",
    plan_type: "fire_evacuation",
    status: "current",
    last_tested: "2026-04-01",
    next_test: "2026-10-01",
    evacuation_required: true,
    ...overrides,
  };
}

// ── Helper function to compute relative dates ─────────────────────────────

function daysFromToday(days: number): string {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// ── Chamberlain House Test Data ───────────────────────────────────────────────────

function getOakHouseDrills(): ProtocolDrillInput[] {
  return [
    makeDrill({
      id: "drill_001",
      date: daysFromToday(-60),
      scenario_type: "evacuation",
      response_time_minutes: 3,
      outcome: "satisfactory",
      protocol_followed: true,
      next_drill_due: daysFromToday(30),
      actions_required: [],
    }),
    makeDrill({
      id: "drill_002",
      date: daysFromToday(-30),
      scenario_type: "evacuation",
      response_time_minutes: 2.5,
      outcome: "satisfactory",
      protocol_followed: true,
      next_drill_due: daysFromToday(60),
      actions_required: [],
    }),
    makeDrill({
      id: "drill_003",
      date: daysFromToday(-90),
      scenario_type: "missing_child",
      response_time_minutes: 8,
      outcome: "satisfactory",
      protocol_followed: true,
      next_drill_due: daysFromToday(-10),
      actions_required: ["Update contact list"],
    }),
    makeDrill({
      id: "drill_004",
      date: daysFromToday(-45),
      scenario_type: "medical_emergency",
      response_time_minutes: 5,
      outcome: "needs_improvement",
      protocol_followed: false,
      next_drill_due: daysFromToday(45),
      actions_required: ["Re-train on first aid protocol", "Update AED location signage"],
    }),
    makeDrill({
      id: "drill_005",
      date: daysFromToday(-20),
      scenario_type: "power_failure",
      response_time_minutes: 4,
      outcome: "satisfactory",
      protocol_followed: true,
      next_drill_due: daysFromToday(70),
      actions_required: [],
    }),
    makeDrill({
      id: "drill_006",
      date: daysFromToday(-120),
      scenario_type: "intruder_alert",
      response_time_minutes: 6,
      outcome: "satisfactory",
      protocol_followed: true,
      next_drill_due: daysFromToday(-30),
      actions_required: [],
    }),
    makeDrill({
      id: "drill_007",
      date: daysFromToday(-15),
      scenario_type: "flooding",
      response_time_minutes: 3.5,
      outcome: "satisfactory",
      protocol_followed: true,
      next_drill_due: daysFromToday(75),
      actions_required: [],
    }),
    makeDrill({
      id: "drill_008",
      date: daysFromToday(-7),
      scenario_type: "evacuation",
      response_time_minutes: 2.8,
      outcome: "satisfactory",
      protocol_followed: true,
      next_drill_due: daysFromToday(83),
      actions_required: [],
    }),
  ];
}

function getOakHousePlans(): EmergencyPlanInput[] {
  return [
    makePlan({
      id: "plan_001",
      title: "Fire Evacuation Plan",
      plan_type: "fire_evacuation",
      status: "current",
      last_tested: daysFromToday(-7),
      next_test: daysFromToday(83),
    }),
    makePlan({
      id: "plan_002",
      title: "Power Failure Plan",
      plan_type: "power_failure",
      status: "current",
      last_tested: daysFromToday(-20),
      next_test: daysFromToday(70),
    }),
    makePlan({
      id: "plan_003",
      title: "Flood Response Plan",
      plan_type: "flood_water_damage",
      status: "review_due",
      last_tested: daysFromToday(-100),
      next_test: daysFromToday(-10),
    }),
    makePlan({
      id: "plan_004",
      title: "Serious Incident Plan",
      plan_type: "serious_incident",
      status: "current",
      last_tested: daysFromToday(-30),
      next_test: daysFromToday(60),
    }),
  ];
}

// ══════════════════════════════════════════════════════════════════════════════
// TESTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Emergency Intelligence Engine", () => {
  // ── Helper function tests ─────────────────────────────────────────────────

  describe("daysUntil / daysSince helpers", () => {
    it("calculates positive days until future date", () => {
      expect(daysUntil("2026-05-25", "2026-06-25")).toBe(31);
    });

    it("calculates negative days until past date", () => {
      expect(daysUntil("2026-05-25", "2026-05-15")).toBe(-10);
    });

    it("returns 0 for same date", () => {
      expect(daysUntil("2026-05-25", "2026-05-25")).toBe(0);
    });

    it("daysSince calculates elapsed days", () => {
      expect(daysSince("2026-05-01", "2026-05-25")).toBe(24);
    });
  });

  // ── Empty input ───────────────────────────────────────────────────────────

  describe("empty input", () => {
    it("handles no drills and no plans gracefully", () => {
      const result = computeEmergencyIntelligence({
        drills: [],
        plans: [],
        staff: STAFF,
        today: TODAY,
      });

      expect(result.overview.total_drills).toBe(0);
      expect(result.overview.drills_last_90_days).toBe(0);
      expect(result.overview.avg_response_time_minutes).toBe(0);
      expect(result.overview.protocol_followed_rate).toBe(100);
      expect(result.overview.satisfactory_rate).toBe(100);
      expect(result.overview.total_plans).toBe(0);
      expect(result.overview.current_plans).toBe(0);
      expect(result.overview.expired_plans).toBe(0);
      expect(result.overview.total_actions_outstanding).toBe(0);
    });

    it("marks all drill types as overdue when no drills exist", () => {
      const result = computeEmergencyIntelligence({
        drills: [],
        plans: [],
        staff: STAFF,
        today: TODAY,
      });

      expect(result.drill_types).toHaveLength(ALL_SCENARIO_TYPES.length);
      for (const dt of result.drill_types) {
        expect(dt.status).toBe("overdue");
        expect(dt.drill_count).toBe(0);
        expect(dt.last_drill_date).toBeNull();
        expect(dt.next_due).toBeNull();
      }
    });

    it("shows zero plan coverage when no plans exist", () => {
      const result = computeEmergencyIntelligence({
        drills: [],
        plans: [],
        staff: STAFF,
        today: TODAY,
      });

      expect(result.plan_coverage.plan_types_required).toBe(5);
      expect(result.plan_coverage.plan_types_covered).toBe(0);
      expect(result.plan_coverage.plans_current).toBe(0);
    });

    it("generates critical alerts for all missing drill types", () => {
      const result = computeEmergencyIntelligence({
        drills: [],
        plans: [],
        staff: STAFF,
        today: TODAY,
      });

      const criticalAlerts = result.alerts.filter((a) => a.severity === "critical");
      expect(criticalAlerts).toHaveLength(ALL_SCENARIO_TYPES.length);
    });
  });

  // ── Overview calculations ─────────────────────────────────────────────────

  describe("overview", () => {
    it("counts total drills correctly", () => {
      const drills = [makeDrill(), makeDrill(), makeDrill()];
      const result = computeEmergencyIntelligence({
        drills,
        plans: [],
        staff: STAFF,
        today: TODAY,
      });
      expect(result.overview.total_drills).toBe(3);
    });

    it("counts drills in last 90 days", () => {
      const drills = [
        makeDrill({ date: daysFromToday(-30) }),
        makeDrill({ date: daysFromToday(-60) }),
        makeDrill({ date: daysFromToday(-100) }), // outside 90 days
      ];
      const result = computeEmergencyIntelligence({
        drills,
        plans: [],
        staff: STAFF,
        today: TODAY,
      });
      expect(result.overview.drills_last_90_days).toBe(2);
    });

    it("calculates average response time", () => {
      const drills = [
        makeDrill({ response_time_minutes: 3 }),
        makeDrill({ response_time_minutes: 5 }),
        makeDrill({ response_time_minutes: 7 }),
      ];
      const result = computeEmergencyIntelligence({
        drills,
        plans: [],
        staff: STAFF,
        today: TODAY,
      });
      expect(result.overview.avg_response_time_minutes).toBe(5);
    });

    it("calculates protocol followed rate", () => {
      const drills = [
        makeDrill({ protocol_followed: true }),
        makeDrill({ protocol_followed: true }),
        makeDrill({ protocol_followed: false }),
        makeDrill({ protocol_followed: false }),
      ];
      const result = computeEmergencyIntelligence({
        drills,
        plans: [],
        staff: STAFF,
        today: TODAY,
      });
      expect(result.overview.protocol_followed_rate).toBe(50);
    });

    it("calculates satisfactory rate", () => {
      const drills = [
        makeDrill({ outcome: "satisfactory" }),
        makeDrill({ outcome: "satisfactory" }),
        makeDrill({ outcome: "needs_improvement" }),
        makeDrill({ outcome: "failed" }),
      ];
      const result = computeEmergencyIntelligence({
        drills,
        plans: [],
        staff: STAFF,
        today: TODAY,
      });
      expect(result.overview.satisfactory_rate).toBe(50);
    });

    it("counts current plans", () => {
      const plans = [
        makePlan({ status: "current" }),
        makePlan({ status: "current" }),
        makePlan({ status: "review_due" }),
      ];
      const result = computeEmergencyIntelligence({
        drills: [],
        plans,
        staff: STAFF,
        today: TODAY,
      });
      expect(result.overview.total_plans).toBe(3);
      expect(result.overview.current_plans).toBe(2);
    });

    it("counts expired plans (next_test < today)", () => {
      const plans = [
        makePlan({ next_test: daysFromToday(-5) }),
        makePlan({ next_test: daysFromToday(-20) }),
        makePlan({ next_test: daysFromToday(30) }),
      ];
      const result = computeEmergencyIntelligence({
        drills: [],
        plans,
        staff: STAFF,
        today: TODAY,
      });
      expect(result.overview.expired_plans).toBe(2);
    });

    it("sums total outstanding actions", () => {
      const drills = [
        makeDrill({ actions_required: ["a", "b"] }),
        makeDrill({ actions_required: ["c"] }),
        makeDrill({ actions_required: [] }),
      ];
      const result = computeEmergencyIntelligence({
        drills,
        plans: [],
        staff: STAFF,
        today: TODAY,
      });
      expect(result.overview.total_actions_outstanding).toBe(3);
    });
  });

  // ── Drill type statuses ───────────────────────────────────────────────────

  describe("drill_types", () => {
    it("includes all 7 scenario types", () => {
      const result = computeEmergencyIntelligence({
        drills: [],
        plans: [],
        staff: STAFF,
        today: TODAY,
      });
      expect(result.drill_types).toHaveLength(7);
      const types = result.drill_types.map((dt) => dt.scenario_type);
      for (const st of ALL_SCENARIO_TYPES) {
        expect(types).toContain(st);
      }
    });

    it("sets status to 'current' when next_due > 30 days from today", () => {
      const drills = [
        makeDrill({
          scenario_type: "evacuation",
          date: daysFromToday(-10),
          next_drill_due: daysFromToday(60),
        }),
      ];
      const result = computeEmergencyIntelligence({
        drills,
        plans: [],
        staff: STAFF,
        today: TODAY,
      });
      const evac = result.drill_types.find((dt) => dt.scenario_type === "evacuation")!;
      expect(evac.status).toBe("current");
    });

    it("sets status to 'due' when next_due within 30 days", () => {
      const drills = [
        makeDrill({
          scenario_type: "evacuation",
          date: daysFromToday(-50),
          next_drill_due: daysFromToday(20),
        }),
      ];
      const result = computeEmergencyIntelligence({
        drills,
        plans: [],
        staff: STAFF,
        today: TODAY,
      });
      const evac = result.drill_types.find((dt) => dt.scenario_type === "evacuation")!;
      expect(evac.status).toBe("due");
    });

    it("sets status to 'overdue' when next_due < today", () => {
      const drills = [
        makeDrill({
          scenario_type: "evacuation",
          date: daysFromToday(-90),
          next_drill_due: daysFromToday(-5),
        }),
      ];
      const result = computeEmergencyIntelligence({
        drills,
        plans: [],
        staff: STAFF,
        today: TODAY,
      });
      const evac = result.drill_types.find((dt) => dt.scenario_type === "evacuation")!;
      expect(evac.status).toBe("overdue");
    });

    it("uses the most recent drill to determine next_due", () => {
      const drills = [
        makeDrill({
          scenario_type: "evacuation",
          date: daysFromToday(-60),
          next_drill_due: daysFromToday(-5), // older drill, overdue
        }),
        makeDrill({
          scenario_type: "evacuation",
          date: daysFromToday(-10),
          next_drill_due: daysFromToday(80), // newer drill, current
        }),
      ];
      const result = computeEmergencyIntelligence({
        drills,
        plans: [],
        staff: STAFF,
        today: TODAY,
      });
      const evac = result.drill_types.find((dt) => dt.scenario_type === "evacuation")!;
      expect(evac.status).toBe("current");
      expect(evac.drill_count).toBe(2);
    });

    it("uses correct type labels", () => {
      const result = computeEmergencyIntelligence({
        drills: [],
        plans: [],
        staff: STAFF,
        today: TODAY,
      });
      const labels = Object.fromEntries(
        result.drill_types.map((dt) => [dt.scenario_type, dt.type_label]),
      );
      expect(labels).toEqual(SCENARIO_TYPE_LABELS);
    });

    it("shows last_drill_date as the most recent drill date", () => {
      const drills = [
        makeDrill({ scenario_type: "flooding", date: daysFromToday(-60) }),
        makeDrill({ scenario_type: "flooding", date: daysFromToday(-10) }),
      ];
      const result = computeEmergencyIntelligence({
        drills,
        plans: [],
        staff: STAFF,
        today: TODAY,
      });
      const flooding = result.drill_types.find((dt) => dt.scenario_type === "flooding")!;
      expect(flooding.last_drill_date).toBe(daysFromToday(-10));
    });
  });

  // ── Recent drills ─────────────────────────────────────────────────────────

  describe("recent_drills", () => {
    it("sorts drills by date descending", () => {
      const drills = [
        makeDrill({ id: "old", date: daysFromToday(-60) }),
        makeDrill({ id: "new", date: daysFromToday(-5) }),
        makeDrill({ id: "mid", date: daysFromToday(-30) }),
      ];
      const result = computeEmergencyIntelligence({
        drills,
        plans: [],
        staff: STAFF,
        today: TODAY,
      });
      expect(result.recent_drills[0].drill_id).toBe("new");
      expect(result.recent_drills[1].drill_id).toBe("mid");
      expect(result.recent_drills[2].drill_id).toBe("old");
    });

    it("limits to 10 most recent drills", () => {
      const drills = Array.from({ length: 15 }, (_, i) =>
        makeDrill({ date: daysFromToday(-i) }),
      );
      const result = computeEmergencyIntelligence({
        drills,
        plans: [],
        staff: STAFF,
        today: TODAY,
      });
      expect(result.recent_drills).toHaveLength(10);
    });

    it("calculates issues_count from actions_required + protocol deviation", () => {
      const drills = [
        makeDrill({
          id: "d1",
          actions_required: ["a", "b"],
          protocol_followed: false,
        }),
      ];
      const result = computeEmergencyIntelligence({
        drills,
        plans: [],
        staff: STAFF,
        today: TODAY,
      });
      // 2 actions + 1 protocol deviation = 3
      expect(result.recent_drills[0].issues_count).toBe(3);
    });

    it("issues_count is 0 when no actions and protocol followed", () => {
      const drills = [
        makeDrill({
          id: "d1",
          actions_required: [],
          protocol_followed: true,
        }),
      ];
      const result = computeEmergencyIntelligence({
        drills,
        plans: [],
        staff: STAFF,
        today: TODAY,
      });
      expect(result.recent_drills[0].issues_count).toBe(0);
    });

    it("includes type_label for each drill", () => {
      const drills = [makeDrill({ scenario_type: "intruder_alert" })];
      const result = computeEmergencyIntelligence({
        drills,
        plans: [],
        staff: STAFF,
        today: TODAY,
      });
      expect(result.recent_drills[0].type_label).toBe("Intruder Alert");
    });
  });

  // ── Plan coverage ─────────────────────────────────────────────────────────

  describe("plan_coverage", () => {
    it("reports 5 plan types required", () => {
      const result = computeEmergencyIntelligence({
        drills: [],
        plans: [],
        staff: STAFF,
        today: TODAY,
      });
      expect(result.plan_coverage.plan_types_required).toBe(5);
    });

    it("counts unique plan types with current status", () => {
      const plans = [
        makePlan({ plan_type: "fire_evacuation", status: "current" }),
        makePlan({ plan_type: "power_failure", status: "current" }),
        makePlan({ plan_type: "flood_water_damage", status: "review_due" }),
      ];
      const result = computeEmergencyIntelligence({
        drills: [],
        plans,
        staff: STAFF,
        today: TODAY,
      });
      expect(result.plan_coverage.plan_types_covered).toBe(2);
    });

    it("counts plans by status", () => {
      const plans = [
        makePlan({ status: "current" }),
        makePlan({ status: "current" }),
        makePlan({ status: "review_due" }),
        makePlan({ status: "draft" }),
      ];
      const result = computeEmergencyIntelligence({
        drills: [],
        plans,
        staff: STAFF,
        today: TODAY,
      });
      expect(result.plan_coverage.plans_current).toBe(2);
      expect(result.plan_coverage.plans_review_due).toBe(1);
      expect(result.plan_coverage.plans_draft).toBe(1);
    });

    it("does not double-count same plan_type with multiple current plans", () => {
      const plans = [
        makePlan({ plan_type: "fire_evacuation", status: "current" }),
        makePlan({ plan_type: "fire_evacuation", status: "current" }),
      ];
      const result = computeEmergencyIntelligence({
        drills: [],
        plans,
        staff: STAFF,
        today: TODAY,
      });
      expect(result.plan_coverage.plan_types_covered).toBe(1);
      expect(result.plan_coverage.plans_current).toBe(2);
    });
  });

  // ── Alerts ────────────────────────────────────────────────────────────────

  describe("alerts", () => {
    it("critical alert for drill type never conducted", () => {
      // Only evacuation drill provided — 6 types missing
      const drills = [makeDrill({ scenario_type: "evacuation" })];
      const result = computeEmergencyIntelligence({
        drills,
        plans: [],
        staff: STAFF,
        today: TODAY,
      });
      const criticals = result.alerts.filter((a) => a.severity === "critical");
      expect(criticals.length).toBe(6); // 7 - 1 = 6 missing
      expect(criticals[0].message).toContain("never been conducted");
    });

    it("high alert for overdue drill", () => {
      const drills = [
        makeDrill({
          scenario_type: "evacuation",
          next_drill_due: daysFromToday(-15),
        }),
      ];
      const result = computeEmergencyIntelligence({
        drills,
        plans: [],
        staff: STAFF,
        today: TODAY,
      });
      const highAlerts = result.alerts.filter(
        (a) => a.severity === "high" && a.message.includes("Evacuation"),
      );
      expect(highAlerts.length).toBeGreaterThanOrEqual(1);
      expect(highAlerts[0].message).toContain("overdue");
    });

    it("high alert for expired plan", () => {
      const plans = [
        makePlan({
          title: "Fire Plan",
          next_test: daysFromToday(-10),
        }),
      ];
      const result = computeEmergencyIntelligence({
        drills: [],
        plans,
        staff: STAFF,
        today: TODAY,
      });
      const highAlerts = result.alerts.filter(
        (a) => a.severity === "high" && a.message.includes("Fire Plan"),
      );
      expect(highAlerts.length).toBe(1);
      expect(highAlerts[0].message).toContain("needs review");
    });

    it("medium alert for needs_improvement outcome on last drill", () => {
      const drills = [
        makeDrill({
          scenario_type: "evacuation",
          outcome: "needs_improvement",
          date: daysFromToday(-5),
        }),
      ];
      const result = computeEmergencyIntelligence({
        drills,
        plans: [],
        staff: STAFF,
        today: TODAY,
      });
      const medAlerts = result.alerts.filter(
        (a) => a.severity === "medium" && a.message.includes("needs_improvement"),
      );
      expect(medAlerts.length).toBe(1);
    });

    it("medium alert for failed outcome on last drill", () => {
      const drills = [
        makeDrill({
          scenario_type: "evacuation",
          outcome: "failed",
          date: daysFromToday(-5),
        }),
      ];
      const result = computeEmergencyIntelligence({
        drills,
        plans: [],
        staff: STAFF,
        today: TODAY,
      });
      const medAlerts = result.alerts.filter(
        (a) => a.severity === "medium" && a.message.includes("failed"),
      );
      expect(medAlerts.length).toBe(1);
    });

    it("medium alert when protocol compliance < 90%", () => {
      const drills = Array.from({ length: 10 }, (_, i) =>
        makeDrill({ protocol_followed: i < 8 }), // 80%
      );
      const result = computeEmergencyIntelligence({
        drills,
        plans: [],
        staff: STAFF,
        today: TODAY,
      });
      const complianceAlerts = result.alerts.filter(
        (a) => a.severity === "medium" && a.message.includes("Protocol compliance"),
      );
      expect(complianceAlerts.length).toBe(1);
      expect(complianceAlerts[0].message).toContain("80%");
    });

    it("no medium compliance alert when protocol compliance >= 90%", () => {
      const drills = Array.from({ length: 10 }, (_, i) =>
        makeDrill({ protocol_followed: i < 9 }), // 90%
      );
      const result = computeEmergencyIntelligence({
        drills,
        plans: [],
        staff: STAFF,
        today: TODAY,
      });
      const complianceAlerts = result.alerts.filter(
        (a) => a.severity === "medium" && a.message.includes("Protocol compliance"),
      );
      expect(complianceAlerts.length).toBe(0);
    });

    it("low alert when outstanding actions > 3", () => {
      const drills = [
        makeDrill({ actions_required: ["a", "b"] }),
        makeDrill({ actions_required: ["c", "d"] }),
      ];
      const result = computeEmergencyIntelligence({
        drills,
        plans: [],
        staff: STAFF,
        today: TODAY,
      });
      const lowAlerts = result.alerts.filter(
        (a) => a.severity === "low" && a.message.includes("outstanding actions"),
      );
      expect(lowAlerts.length).toBe(1);
      expect(lowAlerts[0].message).toContain("4");
    });

    it("no low alert when outstanding actions <= 3", () => {
      const drills = [
        makeDrill({ actions_required: ["a", "b"] }),
        makeDrill({ actions_required: ["c"] }),
      ];
      const result = computeEmergencyIntelligence({
        drills,
        plans: [],
        staff: STAFF,
        today: TODAY,
      });
      const lowAlerts = result.alerts.filter(
        (a) => a.severity === "low" && a.message.includes("outstanding actions"),
      );
      expect(lowAlerts.length).toBe(0);
    });
  });

  // ── Cara Insights ─────────────────────────────────────────────────────────

  describe("insights", () => {
    it("critical insight for drill types never conducted", () => {
      const drills = [makeDrill({ scenario_type: "evacuation" })];
      const result = computeEmergencyIntelligence({
        drills,
        plans: [],
        staff: STAFF,
        today: TODAY,
      });
      const critical = result.insights.filter((i) => i.severity === "critical");
      expect(critical.length).toBe(1);
      expect(critical[0].text).toContain("never conducted");
    });

    it("warning insight for overdue drills", () => {
      const drills = [
        makeDrill({
          scenario_type: "evacuation",
          next_drill_due: daysFromToday(-10),
          date: daysFromToday(-60),
        }),
      ];
      const result = computeEmergencyIntelligence({
        drills,
        plans: [],
        staff: STAFF,
        today: TODAY,
      });
      const warnings = result.insights.filter(
        (i) => i.severity === "warning" && i.text.includes("overdue"),
      );
      expect(warnings.length).toBe(1);
    });

    it("warning insight for expired plans", () => {
      const plans = [
        makePlan({ next_test: daysFromToday(-10) }),
      ];
      const result = computeEmergencyIntelligence({
        drills: [],
        plans,
        staff: STAFF,
        today: TODAY,
      });
      const warnings = result.insights.filter(
        (i) => i.severity === "warning" && i.text.includes("passed their test date"),
      );
      expect(warnings.length).toBe(1);
    });

    it("warning insight for low protocol compliance", () => {
      const drills = Array.from({ length: 10 }, (_, i) =>
        makeDrill({ protocol_followed: i < 7 }), // 70%
      );
      const result = computeEmergencyIntelligence({
        drills,
        plans: [],
        staff: STAFF,
        today: TODAY,
      });
      const warnings = result.insights.filter(
        (i) => i.severity === "warning" && i.text.includes("Protocol compliance"),
      );
      expect(warnings.length).toBe(1);
      expect(warnings[0].text).toContain("70%");
    });

    it("warning insight for failed drills", () => {
      const drills = [
        makeDrill({ outcome: "failed" }),
      ];
      const result = computeEmergencyIntelligence({
        drills,
        plans: [],
        staff: STAFF,
        today: TODAY,
      });
      const warnings = result.insights.filter(
        (i) => i.severity === "warning" && i.text.includes("failed"),
      );
      expect(warnings.length).toBe(1);
    });

    it("positive insight when all types drilled in last 90 days", () => {
      const drills = ALL_SCENARIO_TYPES.map((type) =>
        makeDrill({ scenario_type: type, date: daysFromToday(-30) }),
      );
      const result = computeEmergencyIntelligence({
        drills,
        plans: [],
        staff: STAFF,
        today: TODAY,
      });
      const positives = result.insights.filter(
        (i) => i.severity === "positive" && i.text.includes("All 7 emergency scenario types"),
      );
      expect(positives.length).toBe(1);
    });

    it("positive insight when protocol compliance >= 95%", () => {
      const drills = Array.from({ length: 20 }, (_, i) =>
        makeDrill({ protocol_followed: i < 19 }), // 95%
      );
      const result = computeEmergencyIntelligence({
        drills,
        plans: [],
        staff: STAFF,
        today: TODAY,
      });
      const positives = result.insights.filter(
        (i) => i.severity === "positive" && i.text.includes("95%"),
      );
      expect(positives.length).toBe(1);
    });

    it("positive insight when all outcomes satisfactory", () => {
      const drills = [
        makeDrill({ outcome: "satisfactory" }),
        makeDrill({ outcome: "satisfactory" }),
      ];
      const result = computeEmergencyIntelligence({
        drills,
        plans: [],
        staff: STAFF,
        today: TODAY,
      });
      const positives = result.insights.filter(
        (i) => i.severity === "positive" && i.text.includes("satisfactory outcome"),
      );
      expect(positives.length).toBe(1);
    });

    it("positive insight when all plans current and not expired", () => {
      const plans = ALL_PLAN_TYPES.map((type) =>
        makePlan({ plan_type: type, status: "current", next_test: daysFromToday(90) }),
      );
      const result = computeEmergencyIntelligence({
        drills: [],
        plans,
        staff: STAFF,
        today: TODAY,
      });
      const positives = result.insights.filter(
        (i) => i.severity === "positive" && i.text.includes("emergency plans are current"),
      );
      expect(positives.length).toBe(1);
    });

    it("positive insight for low response time (< 5 min average)", () => {
      const drills = [
        makeDrill({ response_time_minutes: 2 }),
        makeDrill({ response_time_minutes: 3 }),
        makeDrill({ response_time_minutes: 4 }),
      ];
      const result = computeEmergencyIntelligence({
        drills,
        plans: [],
        staff: STAFF,
        today: TODAY,
      });
      const positives = result.insights.filter(
        (i) => i.severity === "positive" && i.text.includes("response time"),
      );
      expect(positives.length).toBe(1);
    });

    it("no response time positive insight when avg >= 5 min", () => {
      const drills = [
        makeDrill({ response_time_minutes: 5 }),
        makeDrill({ response_time_minutes: 6 }),
      ];
      const result = computeEmergencyIntelligence({
        drills,
        plans: [],
        staff: STAFF,
        today: TODAY,
      });
      const positives = result.insights.filter(
        (i) => i.severity === "positive" && i.text.includes("response time"),
      );
      expect(positives.length).toBe(0);
    });
  });

  // ── Chamberlain House Integration ─────────────────────────────────────────────────

  describe("Chamberlain House integration", () => {
    it("computes overview correctly for Chamberlain House data", () => {
      const drills = getOakHouseDrills();
      const plans = getOakHousePlans();
      const result = computeEmergencyIntelligence({
        drills,
        plans,
        staff: STAFF,
        today: TODAY,
      });

      expect(result.overview.total_drills).toBe(8);
      expect(result.overview.total_plans).toBe(4);
      expect(result.overview.current_plans).toBe(3);
      expect(result.overview.expired_plans).toBe(1); // plan_003
      expect(result.overview.total_actions_outstanding).toBe(3);
    });

    it("identifies drills in last 90 days for Chamberlain House", () => {
      const drills = getOakHouseDrills();
      const result = computeEmergencyIntelligence({
        drills,
        plans: getOakHousePlans(),
        staff: STAFF,
        today: TODAY,
      });
      // Drills within 90 days: -7, -15, -20, -30, -45, -60 (6 drills)
      // -90 is exactly on boundary, -120 is outside
      expect(result.overview.drills_last_90_days).toBeGreaterThanOrEqual(6);
    });

    it("protocol followed rate is 87.5% (7 of 8 followed)", () => {
      const drills = getOakHouseDrills();
      const result = computeEmergencyIntelligence({
        drills,
        plans: getOakHousePlans(),
        staff: STAFF,
        today: TODAY,
      });
      // 7 out of 8 followed = 87.5%, rounds to 88%
      expect(result.overview.protocol_followed_rate).toBe(88);
    });

    it("satisfactory rate is 87.5% (7 of 8 satisfactory)", () => {
      const drills = getOakHouseDrills();
      const result = computeEmergencyIntelligence({
        drills,
        plans: getOakHousePlans(),
        staff: STAFF,
        today: TODAY,
      });
      expect(result.overview.satisfactory_rate).toBe(88);
    });

    it("evacuation drill type is current (most recent has next_due far in future)", () => {
      const drills = getOakHouseDrills();
      const result = computeEmergencyIntelligence({
        drills,
        plans: getOakHousePlans(),
        staff: STAFF,
        today: TODAY,
      });
      const evac = result.drill_types.find((dt) => dt.scenario_type === "evacuation")!;
      expect(evac.status).toBe("current");
      expect(evac.drill_count).toBe(3);
    });

    it("missing_child drill type is overdue", () => {
      const drills = getOakHouseDrills();
      const result = computeEmergencyIntelligence({
        drills,
        plans: getOakHousePlans(),
        staff: STAFF,
        today: TODAY,
      });
      const mc = result.drill_types.find((dt) => dt.scenario_type === "missing_child")!;
      expect(mc.status).toBe("overdue");
    });

    it("intruder_alert drill type is overdue", () => {
      const drills = getOakHouseDrills();
      const result = computeEmergencyIntelligence({
        drills,
        plans: getOakHousePlans(),
        staff: STAFF,
        today: TODAY,
      });
      const ia = result.drill_types.find((dt) => dt.scenario_type === "intruder_alert")!;
      expect(ia.status).toBe("overdue");
    });

    it("medication_error_response drill type is overdue (never conducted)", () => {
      const drills = getOakHouseDrills();
      const result = computeEmergencyIntelligence({
        drills,
        plans: getOakHousePlans(),
        staff: STAFF,
        today: TODAY,
      });
      const mer = result.drill_types.find(
        (dt) => dt.scenario_type === "medication_error_response",
      )!;
      expect(mer.status).toBe("overdue");
      expect(mer.drill_count).toBe(0);
      expect(mer.last_drill_date).toBeNull();
    });

    it("plan coverage shows 3 out of 5 types covered", () => {
      const plans = getOakHousePlans();
      const result = computeEmergencyIntelligence({
        drills: getOakHouseDrills(),
        plans,
        staff: STAFF,
        today: TODAY,
      });
      // fire_evacuation, power_failure, serious_incident are current
      // flood_water_damage is review_due (not counted as covered)
      // infectious_disease is missing
      expect(result.plan_coverage.plan_types_covered).toBe(3);
      expect(result.plan_coverage.plans_current).toBe(3);
      expect(result.plan_coverage.plans_review_due).toBe(1);
      expect(result.plan_coverage.plans_draft).toBe(0);
    });

    it("generates critical alert for medication_error_response never conducted", () => {
      const result = computeEmergencyIntelligence({
        drills: getOakHouseDrills(),
        plans: getOakHousePlans(),
        staff: STAFF,
        today: TODAY,
      });
      const criticals = result.alerts.filter(
        (a) => a.severity === "critical" && a.message.includes("Medication Error Response"),
      );
      expect(criticals.length).toBe(1);
      expect(criticals[0].message).toContain("never been conducted");
    });

    it("generates high alerts for overdue drills (missing_child and intruder_alert)", () => {
      const result = computeEmergencyIntelligence({
        drills: getOakHouseDrills(),
        plans: getOakHousePlans(),
        staff: STAFF,
        today: TODAY,
      });
      const highOverdue = result.alerts.filter(
        (a) => a.severity === "high" && a.message.includes("overdue"),
      );
      expect(highOverdue.length).toBe(2);
      const messages = highOverdue.map((a) => a.message).join(" ");
      expect(messages).toContain("Missing Child");
      expect(messages).toContain("Intruder Alert");
    });

    it("generates high alert for expired Flood Response Plan", () => {
      const result = computeEmergencyIntelligence({
        drills: getOakHouseDrills(),
        plans: getOakHousePlans(),
        staff: STAFF,
        today: TODAY,
      });
      const planAlerts = result.alerts.filter(
        (a) => a.severity === "high" && a.message.includes("Flood Response Plan"),
      );
      expect(planAlerts.length).toBe(1);
      expect(planAlerts[0].message).toContain("needs review");
    });

    it("generates medium alert for medical_emergency needs_improvement", () => {
      const result = computeEmergencyIntelligence({
        drills: getOakHouseDrills(),
        plans: getOakHousePlans(),
        staff: STAFF,
        today: TODAY,
      });
      const medAlerts = result.alerts.filter(
        (a) => a.severity === "medium" && a.message.includes("Medical Emergency"),
      );
      expect(medAlerts.length).toBe(1);
      expect(medAlerts[0].message).toContain("needs_improvement");
    });

    it("generates medium alert for protocol compliance < 90%", () => {
      const result = computeEmergencyIntelligence({
        drills: getOakHouseDrills(),
        plans: getOakHousePlans(),
        staff: STAFF,
        today: TODAY,
      });
      const compAlerts = result.alerts.filter(
        (a) => a.severity === "medium" && a.message.includes("Protocol compliance"),
      );
      expect(compAlerts.length).toBe(1);
      expect(compAlerts[0].message).toContain("88%");
    });

    it("most recent drill appears first in recent_drills", () => {
      const result = computeEmergencyIntelligence({
        drills: getOakHouseDrills(),
        plans: getOakHousePlans(),
        staff: STAFF,
        today: TODAY,
      });
      expect(result.recent_drills[0].drill_id).toBe("drill_008");
    });

    it("avg response time is calculated across all Chamberlain House drills", () => {
      const result = computeEmergencyIntelligence({
        drills: getOakHouseDrills(),
        plans: getOakHousePlans(),
        staff: STAFF,
        today: TODAY,
      });
      // (3 + 2.5 + 8 + 5 + 4 + 6 + 3.5 + 2.8) / 8 = 34.8 / 8 = 4.35
      expect(result.overview.avg_response_time_minutes).toBe(4.4);
    });

    it("generates positive insight for low response time (< 5 min average)", () => {
      const result = computeEmergencyIntelligence({
        drills: getOakHouseDrills(),
        plans: getOakHousePlans(),
        staff: STAFF,
        today: TODAY,
      });
      const positives = result.insights.filter(
        (i) => i.severity === "positive" && i.text.includes("response time"),
      );
      expect(positives.length).toBe(1);
    });

    it("does NOT generate positive insight for all plans current (one is review_due)", () => {
      const result = computeEmergencyIntelligence({
        drills: getOakHouseDrills(),
        plans: getOakHousePlans(),
        staff: STAFF,
        today: TODAY,
      });
      const planPositives = result.insights.filter(
        (i) => i.severity === "positive" && i.text.includes("emergency plans are current"),
      );
      expect(planPositives.length).toBe(0);
    });

    it("does NOT generate positive insight for all types drilled recently", () => {
      const result = computeEmergencyIntelligence({
        drills: getOakHouseDrills(),
        plans: getOakHousePlans(),
        staff: STAFF,
        today: TODAY,
      });
      // medication_error_response never conducted, intruder_alert at -120d
      const allTypesPositive = result.insights.filter(
        (i) => i.severity === "positive" && i.text.includes("All 7"),
      );
      expect(allTypesPositive.length).toBe(0);
    });
  });

  // ── Edge cases ────────────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("handles drill with next_drill_due exactly today (boundary = due)", () => {
      const drills = [
        makeDrill({
          scenario_type: "evacuation",
          next_drill_due: TODAY,
          date: daysFromToday(-30),
        }),
      ];
      const result = computeEmergencyIntelligence({
        drills,
        plans: [],
        staff: STAFF,
        today: TODAY,
      });
      const evac = result.drill_types.find((dt) => dt.scenario_type === "evacuation")!;
      // daysUntil(today, today) = 0, which is <= 30 so "due"
      expect(evac.status).toBe("due");
    });

    it("handles drill with next_drill_due exactly 30 days out (boundary = due)", () => {
      const drills = [
        makeDrill({
          scenario_type: "evacuation",
          next_drill_due: daysFromToday(30),
          date: daysFromToday(-30),
        }),
      ];
      const result = computeEmergencyIntelligence({
        drills,
        plans: [],
        staff: STAFF,
        today: TODAY,
      });
      const evac = result.drill_types.find((dt) => dt.scenario_type === "evacuation")!;
      expect(evac.status).toBe("due");
    });

    it("handles drill with next_drill_due at 31 days out (current)", () => {
      const drills = [
        makeDrill({
          scenario_type: "evacuation",
          next_drill_due: daysFromToday(31),
          date: daysFromToday(-30),
        }),
      ];
      const result = computeEmergencyIntelligence({
        drills,
        plans: [],
        staff: STAFF,
        today: TODAY,
      });
      const evac = result.drill_types.find((dt) => dt.scenario_type === "evacuation")!;
      expect(evac.status).toBe("current");
    });

    it("uses today's date when not explicitly provided", () => {
      const result = computeEmergencyIntelligence({
        drills: [],
        plans: [],
        staff: STAFF,
      });
      // Should not throw and should produce valid output
      expect(result.overview.total_drills).toBe(0);
      expect(result.drill_types).toHaveLength(7);
    });

    it("handles single drill with all actions", () => {
      const drills = [
        makeDrill({
          actions_required: ["action1", "action2", "action3", "action4"],
          protocol_followed: false,
          outcome: "failed",
        }),
      ];
      const result = computeEmergencyIntelligence({
        drills,
        plans: [],
        staff: STAFF,
        today: TODAY,
      });
      expect(result.overview.total_actions_outstanding).toBe(4);
      expect(result.recent_drills[0].issues_count).toBe(5); // 4 actions + 1 protocol
    });
  });

  describe("Future-date guard (no recency inflation)", () => {
    it("excludes a future-dated drill from drills_last_90_days", () => {
      // TODAY is 2026-05-25 — a drill dated after today must not count as recent.
      const result = computeEmergencyIntelligence({
        drills: [makeDrill({ date: "2026-05-10" }), makeDrill({ date: "2026-06-15" })],
        plans: [],
        staff: STAFF,
        today: TODAY,
      });
      expect(result.overview.drills_last_90_days).toBe(1);
    });
  });
});
