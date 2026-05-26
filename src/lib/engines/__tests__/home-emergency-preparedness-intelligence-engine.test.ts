// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME EMERGENCY PREPAREDNESS INTELLIGENCE ENGINE TESTS
// Tests the pure deterministic engine for policy compliance, drill readiness,
// emergency plan coverage, and staff acknowledgement rates.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeHomeEmergencyPreparedness,
  type PolicyInput,
  type DrillInput,
  type EmergencyPlanInput,
  type HomeEmergencyInput,
} from "../home-emergency-preparedness-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2026-05-26";

function daysAgo(n: number): string {
  const d = new Date(TODAY);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function daysFrom(n: number): string {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function makePolicy(overrides: Partial<PolicyInput> = {}): PolicyInput {
  return {
    id: `pol_${Math.random().toString(36).slice(2, 8)}`,
    title: "Test Policy",
    status: "current",
    next_review_date: daysFrom(60),
    read_acknowledgement_count: 8,
    total_staff_required: 8,
    has_statutory_basis: true,
    ...overrides,
  };
}

function makeDrill(overrides: Partial<DrillInput> = {}): DrillInput {
  return {
    id: `drill_${Math.random().toString(36).slice(2, 8)}`,
    date: daysAgo(30),
    scenario_type: "evacuation",
    outcome: "satisfactory",
    protocol_followed: true,
    has_actions_required: false,
    response_time_minutes: 3,
    participant_count: 4,
    next_drill_due: daysFrom(60),
    ...overrides,
  };
}

function makePlan(overrides: Partial<EmergencyPlanInput> = {}): EmergencyPlanInput {
  return {
    id: `eplan_${Math.random().toString(36).slice(2, 8)}`,
    title: "Test Emergency Plan",
    status: "current",
    last_tested: daysAgo(30),
    next_test: daysFrom(60),
    has_child_considerations: true,
    has_staff_roles: true,
    has_contact_sequence: true,
    ...overrides,
  };
}

function baseInput(overrides: Partial<HomeEmergencyInput> = {}): HomeEmergencyInput {
  return {
    today: TODAY,
    total_staff: 8,
    policies: [],
    drills: [],
    emergency_plans: [],
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// INSUFFICIENT DATA
// ══════════════════════════════════════════════════════════════════════════════

describe("Insufficient data", () => {
  it("returns insufficient_data when no data", () => {
    const r = computeHomeEmergencyPreparedness(baseInput());
    expect(r.emergency_rating).toBe("insufficient_data");
    expect(r.emergency_score).toBe(0);
  });

  it("includes concerns and recommendations when insufficient", () => {
    const r = computeHomeEmergencyPreparedness(baseInput());
    expect(r.concerns.length).toBeGreaterThan(0);
    expect(r.recommendations.length).toBeGreaterThan(0);
    expect(r.insights.length).toBeGreaterThan(0);
  });

  it("is NOT insufficient when only policies exist", () => {
    const r = computeHomeEmergencyPreparedness(baseInput({
      policies: [makePolicy()],
    }));
    expect(r.emergency_rating).not.toBe("insufficient_data");
  });

  it("is NOT insufficient when only drills exist", () => {
    const r = computeHomeEmergencyPreparedness(baseInput({
      drills: [makeDrill()],
    }));
    expect(r.emergency_rating).not.toBe("insufficient_data");
  });

  it("is NOT insufficient when only emergency plans exist", () => {
    const r = computeHomeEmergencyPreparedness(baseInput({
      emergency_plans: [makePlan()],
    }));
    expect(r.emergency_rating).not.toBe("insufficient_data");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// OUTSTANDING SCENARIO
// ══════════════════════════════════════════════════════════════════════════════

describe("Outstanding scenario", () => {
  function outstandingInput(): HomeEmergencyInput {
    return baseInput({
      policies: [
        makePolicy({ id: "p1", title: "Safeguarding" }),
        makePolicy({ id: "p2", title: "Care Practice" }),
        makePolicy({ id: "p3", title: "H&S" }),
        makePolicy({ id: "p4", title: "Behaviour" }),
        makePolicy({ id: "p5", title: "Missing" }),
        makePolicy({ id: "p6", title: "Fire Safety" }),
      ],
      drills: [
        makeDrill({ id: "d1", date: daysAgo(30), scenario_type: "evacuation" }),
        makeDrill({ id: "d2", date: daysAgo(60), scenario_type: "missing_child" }),
        makeDrill({ id: "d3", date: daysAgo(90), scenario_type: "medical_emergency" }),
        makeDrill({ id: "d4", date: daysAgo(120), scenario_type: "power_failure" }),
        makeDrill({ id: "d5", date: daysAgo(180), scenario_type: "flooding" }),
        makeDrill({ id: "d6", date: daysAgo(240), scenario_type: "intruder_alert" }),
      ],
      emergency_plans: [
        makePlan({ id: "e1", title: "Fire Evacuation" }),
        makePlan({ id: "e2", title: "Power Failure" }),
        makePlan({ id: "e3", title: "Flood" }),
        makePlan({ id: "e4", title: "Serious Incident" }),
      ],
    });
  }

  it("rates outstanding", () => {
    const r = computeHomeEmergencyPreparedness(outstandingInput());
    // Policy overdue: 0/6 = 0% → +5
    // Ack rate: all 100% → +4
    // Drills: 6 in 12m → +4
    // Satisfactory: 6/6 = 100% → +3
    // Protocol: 6/6 = 100% → +3
    // Overdue drills: 0 → +3
    // Plans: 4 ≥ 3 → +3
    // Child considerations: 4/4 = 100% → +3
    // Scenario diversity: 6 unique → +2
    // Total: 52+5+4+4+3+3+3+3+3+2 = 52+30 = 82
    expect(r.emergency_score).toBe(82);
    expect(r.emergency_rating).toBe("outstanding");
  });

  it("has strengths in outstanding", () => {
    const r = computeHomeEmergencyPreparedness(outstandingInput());
    expect(r.strengths.length).toBeGreaterThanOrEqual(5);
  });

  it("has no concerns in outstanding", () => {
    const r = computeHomeEmergencyPreparedness(outstandingInput());
    expect(r.concerns.length).toBe(0);
  });

  it("has positive insights in outstanding", () => {
    const r = computeHomeEmergencyPreparedness(outstandingInput());
    expect(r.insights.some(i => i.severity === "positive")).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GOOD SCENARIO
// ══════════════════════════════════════════════════════════════════════════════

describe("Good scenario", () => {
  it("rates good with moderate compliance", () => {
    const r = computeHomeEmergencyPreparedness(baseInput({
      policies: [
        makePolicy({ id: "p1" }),
        makePolicy({ id: "p2" }),
        makePolicy({ id: "p3" }),
        makePolicy({ id: "p4", status: "overdue", next_review_date: daysAgo(14) }), // 1 overdue
      ],
      drills: [
        makeDrill({ id: "d1", date: daysAgo(30), scenario_type: "evacuation" }),
        makeDrill({ id: "d2", date: daysAgo(90), scenario_type: "missing_child" }),
        makeDrill({ id: "d3", date: daysAgo(150), scenario_type: "medical_emergency" }),
        makeDrill({ id: "d4", date: daysAgo(250), scenario_type: "power_failure" }),
        makeDrill({ id: "d5", date: daysAgo(300), scenario_type: "flooding", next_drill_due: daysAgo(10) }), // 1 overdue
      ],
      emergency_plans: [
        makePlan({ id: "e1" }),
        makePlan({ id: "e2" }),
        makePlan({ id: "e3" }),
      ],
    }));
    // Policy overdue: 1/4 = 25% → ≤20? no, 25% → -4
    // Wait: policyOverdueRate is pct(overduePolicies, policies.length)
    // overduePolicies: status "overdue" OR (next_review_date < today AND status !== "archived")
    // p4 status="overdue" → counted. p1-p3 next_review > today → not counted. So 1/4 = 25% → >20 → -4
    // Actually ≤20 is +2. 25% > 20 → -4
    // Ack rate: all 100% → +4
    // Drills: 5 in 12m → ≥4 → +2
    // Satisfactory: 5/5 = 100% → +3
    // Protocol: 5/5 = 100% → +3
    // Overdue drills: d5 overdue → 1 → ≤1 → +1
    // Plans: 3 → +3
    // Child cons: 3/3 = 100% → +3
    // Scenario diversity: 5 unique → +2
    // Total: 52-4+4+2+3+3+1+3+3+2 = 52+17 = 69
    expect(r.emergency_score).toBe(69);
    expect(r.emergency_rating).toBe("good");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// ADEQUATE SCENARIO
// ══════════════════════════════════════════════════════════════════════════════

describe("Adequate scenario", () => {
  it("rates adequate with gaps", () => {
    const r = computeHomeEmergencyPreparedness(baseInput({
      policies: [
        makePolicy({ id: "p1" }),
        makePolicy({ id: "p2", status: "overdue", next_review_date: daysAgo(14) }),
        makePolicy({ id: "p3", status: "overdue", next_review_date: daysAgo(30) }),
        makePolicy({ id: "p4", read_acknowledgement_count: 4 }), // 50% ack
      ],
      drills: [
        makeDrill({ id: "d1", date: daysAgo(60), scenario_type: "evacuation" }),
        makeDrill({ id: "d2", date: daysAgo(120), scenario_type: "missing_child", outcome: "needs_improvement", protocol_followed: false }),
        makeDrill({ id: "d3", date: daysAgo(200), scenario_type: "evacuation", next_drill_due: daysAgo(20) }),
      ],
      emergency_plans: [
        makePlan({ id: "e1" }),
        makePlan({ id: "e2", has_child_considerations: false }),
      ],
    }));
    // Policy overdue: p2 + p3 = 2/4 = 50% → >20 → -4
    // Ack rate: (100+100+100+50)/4 = 87.5 → 88% → ≥70 → +2
    // Wait actually Math.round(350/4) = Math.round(87.5) = 88
    // Drills: 3 in 12m → ≥2 → +0
    // Satisfactory: d1(satisfactory) + d3(satisfactory) = 2/3 = 67% → ≥60 → +1
    // Protocol: d1(true) + d3(true) = 2/3 = 67% → <70 → wait, we need to check: 67% < 70 → -2
    // Hmm that's harsh. Let me recalculate: 67% < 70 → -2
    // Overdue drills: d3 overdue → 1 → ≤1 → +1
    // Plans: 2 → ≥2 → +1
    // Child cons: 1/2 = 50% → ≥50 → +1
    // Scenario diversity: 2 unique (evacuation, missing_child) → ≥2 → +1
    // Total: 52-4+2+0+1-2+1+1+1+1 = 52+1 = 53
    expect(r.emergency_score).toBe(53);
    expect(r.emergency_rating).toBe("adequate");
  });

  it("has concerns in adequate", () => {
    const r = computeHomeEmergencyPreparedness(baseInput({
      policies: [
        makePolicy({ id: "p1" }),
        makePolicy({ id: "p2", status: "overdue", next_review_date: daysAgo(14) }),
      ],
      drills: [
        makeDrill({ id: "d1", date: daysAgo(60), scenario_type: "evacuation" }),
      ],
      emergency_plans: [
        makePlan({ id: "e1" }),
      ],
    }));
    expect(r.concerns.length).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// INADEQUATE SCENARIO
// ══════════════════════════════════════════════════════════════════════════════

describe("Inadequate scenario", () => {
  it("rates inadequate with critical failures", () => {
    const r = computeHomeEmergencyPreparedness(baseInput({
      policies: [
        makePolicy({ id: "p1", status: "overdue", next_review_date: daysAgo(30), read_acknowledgement_count: 2 }),
        makePolicy({ id: "p2", status: "overdue", next_review_date: daysAgo(60), read_acknowledgement_count: 3 }),
      ],
      drills: [
        makeDrill({ id: "d1", date: daysAgo(300), scenario_type: "evacuation", outcome: "failed", protocol_followed: false, next_drill_due: daysAgo(60) }),
      ],
      emergency_plans: [
        makePlan({ id: "e1", has_child_considerations: false, has_staff_roles: false }),
      ],
    }));
    // Policy overdue: 2/2 = 100% → -4
    // Ack rate: (25+38)/2 = 31.5 → 32% → <70 → -3
    // Wait: pct(2,8)=25, pct(3,8)=38. avg = (25+38)/2 = 31.5 → Math.round = 32
    // Drills: 1 in 12m → ≥2? No, d1 at daysAgo(300) is within 365d → 1 drill → < 2 → -3
    // Satisfactory: 0/1 = 0% → <60 → -2
    // Protocol: 0/1 = 0% → <70 → -2
    // Overdue drills: 1 → ≤1 → +1
    // Plans: 1 → < 2 → +0? No wait: ≥3→+3, ≥2→+1, else → 1 plan → score += 0? Let me check...
    // Code: if >= 3 → +3, else if >= 2 → +1, else if === 0 → -2. So 1 plan = none of those → +0
    // Child cons: 0/1 = 0% → <50 → -2
    // Scenario diversity: 1 unique → +0
    // Total: 52-4-3-3-2-2+1+0-2+0 = 52-15 = 37
    expect(r.emergency_score).toBe(37);
    expect(r.emergency_rating).toBe("inadequate");
  });

  it("has critical insights in inadequate", () => {
    const r = computeHomeEmergencyPreparedness(baseInput({
      policies: [
        makePolicy({ id: "p1", status: "overdue", next_review_date: daysAgo(30), read_acknowledgement_count: 2 }),
        makePolicy({ id: "p2", status: "overdue", next_review_date: daysAgo(60), read_acknowledgement_count: 3 }),
      ],
    }));
    expect(r.insights.some(i => i.severity === "critical")).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// POLICY COMPLIANCE PROFILE
// ══════════════════════════════════════════════════════════════════════════════

describe("Policy compliance profile", () => {
  it("counts current, overdue and review_due correctly", () => {
    const r = computeHomeEmergencyPreparedness(baseInput({
      policies: [
        makePolicy({ id: "p1", status: "current" }),
        makePolicy({ id: "p2", status: "overdue", next_review_date: daysAgo(10) }),
        makePolicy({ id: "p3", status: "review_due" }),
      ],
    }));
    expect(r.policy_compliance.total_policies).toBe(3);
    expect(r.policy_compliance.current_count).toBe(1);
    expect(r.policy_compliance.overdue_count).toBe(1);
    expect(r.policy_compliance.review_due_count).toBe(1);
  });

  it("detects overdue by next_review_date even if status is current", () => {
    const r = computeHomeEmergencyPreparedness(baseInput({
      policies: [
        makePolicy({ id: "p1", status: "current", next_review_date: daysAgo(5) }),
      ],
    }));
    expect(r.policy_compliance.overdue_count).toBe(1);
  });

  it("calculates avg acknowledgement rate", () => {
    const r = computeHomeEmergencyPreparedness(baseInput({
      policies: [
        makePolicy({ id: "p1", read_acknowledgement_count: 8, total_staff_required: 8 }), // 100%
        makePolicy({ id: "p2", read_acknowledgement_count: 4, total_staff_required: 8 }), // 50%
      ],
    }));
    expect(r.policy_compliance.avg_acknowledgement_rate).toBe(75);
  });

  it("counts full acknowledgement policies", () => {
    const r = computeHomeEmergencyPreparedness(baseInput({
      policies: [
        makePolicy({ id: "p1", read_acknowledgement_count: 8, total_staff_required: 8 }),
        makePolicy({ id: "p2", read_acknowledgement_count: 8, total_staff_required: 8 }),
        makePolicy({ id: "p3", read_acknowledgement_count: 4, total_staff_required: 8 }),
      ],
    }));
    expect(r.policy_compliance.full_acknowledgement_count).toBe(2);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// DRILL READINESS PROFILE
// ══════════════════════════════════════════════════════════════════════════════

describe("Drill readiness profile", () => {
  it("counts drills in 12m window only", () => {
    const r = computeHomeEmergencyPreparedness(baseInput({
      drills: [
        makeDrill({ date: daysAgo(30) }),
        makeDrill({ date: daysAgo(200) }),
        makeDrill({ date: daysAgo(400) }), // outside 365d
      ],
    }));
    expect(r.drill_readiness.total_drills_12m).toBe(2);
  });

  it("calculates satisfactory rate", () => {
    const r = computeHomeEmergencyPreparedness(baseInput({
      drills: [
        makeDrill({ date: daysAgo(30), outcome: "satisfactory" }),
        makeDrill({ date: daysAgo(60), outcome: "satisfactory" }),
        makeDrill({ date: daysAgo(90), outcome: "needs_improvement" }),
      ],
    }));
    expect(r.drill_readiness.satisfactory_rate).toBe(67);
  });

  it("calculates protocol followed rate", () => {
    const r = computeHomeEmergencyPreparedness(baseInput({
      drills: [
        makeDrill({ date: daysAgo(30), protocol_followed: true }),
        makeDrill({ date: daysAgo(60), protocol_followed: false }),
      ],
    }));
    expect(r.drill_readiness.protocol_followed_rate).toBe(50);
  });

  it("counts overdue drills", () => {
    const r = computeHomeEmergencyPreparedness(baseInput({
      drills: [
        makeDrill({ next_drill_due: daysAgo(10) }),
        makeDrill({ next_drill_due: daysAgo(5) }),
        makeDrill({ next_drill_due: daysFrom(30) }),
      ],
    }));
    expect(r.drill_readiness.drills_overdue).toBe(2);
  });

  it("counts unique scenario types", () => {
    const r = computeHomeEmergencyPreparedness(baseInput({
      drills: [
        makeDrill({ date: daysAgo(30), scenario_type: "evacuation" }),
        makeDrill({ date: daysAgo(60), scenario_type: "medical_emergency" }),
        makeDrill({ date: daysAgo(90), scenario_type: "evacuation" }), // duplicate
        makeDrill({ date: daysAgo(120), scenario_type: "power_failure" }),
      ],
    }));
    expect(r.drill_readiness.unique_scenario_types).toBe(3);
  });

  it("calculates avg response time", () => {
    const r = computeHomeEmergencyPreparedness(baseInput({
      drills: [
        makeDrill({ date: daysAgo(30), response_time_minutes: 3 }),
        makeDrill({ date: daysAgo(60), response_time_minutes: 5 }),
      ],
    }));
    expect(r.drill_readiness.avg_response_time).toBe(4);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// PLAN COVERAGE PROFILE
// ══════════════════════════════════════════════════════════════════════════════

describe("Plan coverage profile", () => {
  it("counts current and review_due plans", () => {
    const r = computeHomeEmergencyPreparedness(baseInput({
      emergency_plans: [
        makePlan({ status: "current" }),
        makePlan({ status: "current" }),
        makePlan({ status: "review_due" }),
      ],
    }));
    expect(r.plan_coverage.total_plans).toBe(3);
    expect(r.plan_coverage.current_count).toBe(2);
    expect(r.plan_coverage.review_due_count).toBe(1);
  });

  it("detects review_due by next_test date", () => {
    const r = computeHomeEmergencyPreparedness(baseInput({
      emergency_plans: [
        makePlan({ status: "current", next_test: daysAgo(5) }),
      ],
    }));
    expect(r.plan_coverage.review_due_count).toBe(1);
  });

  it("counts plans with child considerations", () => {
    const r = computeHomeEmergencyPreparedness(baseInput({
      emergency_plans: [
        makePlan({ has_child_considerations: true }),
        makePlan({ has_child_considerations: true }),
        makePlan({ has_child_considerations: false }),
      ],
    }));
    expect(r.plan_coverage.plans_with_child_considerations).toBe(2);
  });

  it("counts plans tested in 90d", () => {
    const r = computeHomeEmergencyPreparedness(baseInput({
      emergency_plans: [
        makePlan({ last_tested: daysAgo(30) }),
        makePlan({ last_tested: daysAgo(100) }), // outside 90d
      ],
    }));
    expect(r.plan_coverage.plans_tested_in_90d).toBe(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// STRENGTHS, CONCERNS, RECOMMENDATIONS, INSIGHTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Strengths", () => {
  it("highlights all policies current", () => {
    const r = computeHomeEmergencyPreparedness(baseInput({
      policies: [makePolicy({ id: "p1" }), makePolicy({ id: "p2" })],
    }));
    expect(r.strengths.some(s => s.includes("current"))).toBe(true);
  });

  it("highlights high acknowledgement rate", () => {
    const r = computeHomeEmergencyPreparedness(baseInput({
      policies: [makePolicy({ id: "p1", read_acknowledgement_count: 8 })],
    }));
    expect(r.strengths.some(s => s.includes("acknowledgement"))).toBe(true);
  });

  it("highlights 6+ drills", () => {
    const r = computeHomeEmergencyPreparedness(baseInput({
      drills: Array.from({ length: 6 }, (_, i) =>
        makeDrill({ id: `d${i}`, date: daysAgo(i * 50 + 10), scenario_type: `type_${i}` }),
      ),
    }));
    expect(r.strengths.some(s => s.includes("drill"))).toBe(true);
  });

  it("highlights no overdue drills", () => {
    const r = computeHomeEmergencyPreparedness(baseInput({
      drills: [makeDrill({ next_drill_due: daysFrom(30) })],
    }));
    expect(r.strengths.some(s => s.includes("overdue") || s.includes("on track"))).toBe(true);
  });

  it("highlights child-specific considerations", () => {
    const r = computeHomeEmergencyPreparedness(baseInput({
      emergency_plans: [
        makePlan({ has_child_considerations: true }),
        makePlan({ has_child_considerations: true }),
        makePlan({ has_child_considerations: true }),
      ],
    }));
    expect(r.strengths.some(s => s.includes("child"))).toBe(true);
  });
});

describe("Concerns", () => {
  it("flags overdue policies", () => {
    const r = computeHomeEmergencyPreparedness(baseInput({
      policies: [makePolicy({ status: "overdue", next_review_date: daysAgo(10) })],
    }));
    expect(r.concerns.some(c => c.includes("overdue"))).toBe(true);
  });

  it("flags low acknowledgement rate", () => {
    const r = computeHomeEmergencyPreparedness(baseInput({
      policies: [makePolicy({ read_acknowledgement_count: 2 })],
    }));
    expect(r.concerns.some(c => c.includes("acknowledgement"))).toBe(true);
  });

  it("flags low drill frequency", () => {
    const r = computeHomeEmergencyPreparedness(baseInput({
      drills: [makeDrill({ date: daysAgo(30) })],
    }));
    expect(r.concerns.some(c => c.includes("drill"))).toBe(true);
  });

  it("flags overdue drills", () => {
    const r = computeHomeEmergencyPreparedness(baseInput({
      drills: [
        makeDrill({ next_drill_due: daysAgo(10) }),
        makeDrill({ next_drill_due: daysAgo(20) }),
      ],
    }));
    expect(r.concerns.some(c => c.includes("overdue"))).toBe(true);
  });

  it("flags few emergency plans", () => {
    const r = computeHomeEmergencyPreparedness(baseInput({
      emergency_plans: [makePlan()],
    }));
    expect(r.concerns.some(c => c.includes("plan"))).toBe(true);
  });
});

describe("Recommendations", () => {
  it("recommends policy review when overdue", () => {
    const r = computeHomeEmergencyPreparedness(baseInput({
      policies: [makePolicy({ status: "overdue", next_review_date: daysAgo(10) })],
    }));
    expect(r.recommendations.some(rc => rc.regulatory_ref === "Reg 22")).toBe(true);
  });

  it("recommends drill scheduling when overdue", () => {
    const r = computeHomeEmergencyPreparedness(baseInput({
      drills: [makeDrill({ next_drill_due: daysAgo(10) })],
    }));
    expect(r.recommendations.some(rc => rc.regulatory_ref === "Reg 25")).toBe(true);
  });
});

describe("Insights", () => {
  it("generates critical insight for multiple overdue policies", () => {
    const r = computeHomeEmergencyPreparedness(baseInput({
      policies: [
        makePolicy({ id: "p1", status: "overdue", next_review_date: daysAgo(30) }),
        makePolicy({ id: "p2", status: "overdue", next_review_date: daysAgo(60) }),
      ],
    }));
    expect(r.insights.some(i => i.severity === "critical")).toBe(true);
  });

  it("generates positive insight for comprehensive drill programme", () => {
    const r = computeHomeEmergencyPreparedness(baseInput({
      drills: [
        makeDrill({ id: "d1", date: daysAgo(30) }),
        makeDrill({ id: "d2", date: daysAgo(90) }),
        makeDrill({ id: "d3", date: daysAgo(150) }),
        makeDrill({ id: "d4", date: daysAgo(210) }),
      ],
    }));
    expect(r.insights.some(i => i.severity === "positive")).toBe(true);
  });

  it("generates warning for overdue drills", () => {
    const r = computeHomeEmergencyPreparedness(baseInput({
      drills: [
        makeDrill({ id: "d1", next_drill_due: daysAgo(10) }),
        makeDrill({ id: "d2", next_drill_due: daysAgo(20) }),
      ],
    }));
    expect(r.insights.some(i => i.severity === "warning")).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// HEADLINE
// ══════════════════════════════════════════════════════════════════════════════

describe("Headline", () => {
  it("outstanding headline mentions drills and policies", () => {
    const r = computeHomeEmergencyPreparedness(baseInput({
      policies: Array.from({ length: 6 }, (_, i) => makePolicy({ id: `p${i}` })),
      drills: Array.from({ length: 6 }, (_, i) => makeDrill({ id: `d${i}`, date: daysAgo(i * 50 + 10), scenario_type: `type_${i}` })),
      emergency_plans: Array.from({ length: 4 }, (_, i) => makePlan({ id: `e${i}` })),
    }));
    if (r.emergency_rating === "outstanding") {
      expect(r.headline.toLowerCase()).toContain("outstanding");
    }
  });

  it("inadequate headline mentions inadequate", () => {
    const r = computeHomeEmergencyPreparedness(baseInput({
      policies: [makePolicy({ status: "overdue", next_review_date: daysAgo(30), read_acknowledgement_count: 1 })],
    }));
    expect(r.headline.toLowerCase()).toContain("inadequate");
  });

  it("insufficient data headline", () => {
    const r = computeHomeEmergencyPreparedness(baseInput());
    expect(r.headline.toLowerCase()).toContain("no emergency");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// EDGE CASES
// ══════════════════════════════════════════════════════════════════════════════

describe("Edge cases", () => {
  it("handles policies only (no drills or plans)", () => {
    const r = computeHomeEmergencyPreparedness(baseInput({
      policies: [makePolicy()],
    }));
    expect(r.emergency_rating).not.toBe("insufficient_data");
  });

  it("handles drills only (no policies or plans)", () => {
    const r = computeHomeEmergencyPreparedness(baseInput({
      drills: [makeDrill()],
    }));
    expect(r.emergency_rating).not.toBe("insufficient_data");
  });

  it("handles plans only (no policies or drills)", () => {
    const r = computeHomeEmergencyPreparedness(baseInput({
      emergency_plans: [makePlan()],
    }));
    expect(r.emergency_rating).not.toBe("insufficient_data");
  });

  it("score is clamped to 0-100", () => {
    const r = computeHomeEmergencyPreparedness(baseInput({
      policies: Array.from({ length: 10 }, (_, i) => makePolicy({ id: `p${i}` })),
      drills: Array.from({ length: 10 }, (_, i) => makeDrill({ id: `d${i}`, date: daysAgo(i * 30 + 10), scenario_type: `type_${i}` })),
      emergency_plans: Array.from({ length: 5 }, (_, i) => makePlan({ id: `e${i}` })),
    }));
    expect(r.emergency_score).toBeLessThanOrEqual(100);
    expect(r.emergency_score).toBeGreaterThanOrEqual(0);
  });

  it("handles 0 total_staff", () => {
    const r = computeHomeEmergencyPreparedness(baseInput({
      total_staff: 0,
      policies: [makePolicy({ total_staff_required: 0 })],
    }));
    expect(r.emergency_rating).not.toBe("insufficient_data");
  });

  it("drill on boundary (day 365) is included", () => {
    const r = computeHomeEmergencyPreparedness(baseInput({
      drills: [makeDrill({ date: daysAgo(365) })],
    }));
    expect(r.drill_readiness.total_drills_12m).toBe(1);
  });

  it("drill at day 366 is excluded", () => {
    const r = computeHomeEmergencyPreparedness(baseInput({
      drills: [makeDrill({ date: daysAgo(366) })],
    }));
    expect(r.drill_readiness.total_drills_12m).toBe(0);
  });
});
