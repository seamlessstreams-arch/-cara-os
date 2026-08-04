// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME FIRE SAFETY INTELLIGENCE ENGINE — TESTS
// Reg 25: "The premises standard — fire safety."
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeHomeFireSafety,
  type HomeFireSafetyInput,
  type FireDrillInput,
} from "../home-fire-safety-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeDrill(overrides: Partial<FireDrillInput> = {}): FireDrillInput {
  return {
    id: "fd_test",
    date: "2026-05-20",
    time: "14:00",
    drill_type: "fire_drill",
    evacuation_time_seconds: 95,
    result: "satisfactory",
    all_present: true,
    children_present: ["yp_alex", "yp_jordan", "yp_casey"],
    staff_present: ["staff_darren", "staff_anna"],
    issues: "",
    actions_taken: "",
    next_drill_due: "2026-06-20",
    conducted_by: "staff_darren",
    notes: "",
    ...overrides,
  };
}

function baseInput(overrides: Partial<HomeFireSafetyInput> = {}): HomeFireSafetyInput {
  return {
    today: "2026-05-27",
    fire_drills: [makeDrill()],
    total_children: 3,
    total_staff: 10,
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. INSUFFICIENT DATA
// ═══════════════════════════════════════════════════════════════════════════

describe("insufficient data", () => {
  it("returns insufficient_data when 0 children and 0 staff", () => {
    const r = computeHomeFireSafety(baseInput({ total_children: 0, total_staff: 0 }));
    expect(r.fire_safety_rating).toBe("insufficient_data");
    expect(r.fire_safety_score).toBe(0);
  });

  it("returns insufficient_data when no fire drills", () => {
    const r = computeHomeFireSafety(baseInput({ fire_drills: [] }));
    expect(r.fire_safety_rating).toBe("insufficient_data");
    expect(r.fire_safety_score).toBe(0);
  });

  it("populates all profiles with zeros", () => {
    const r = computeHomeFireSafety(baseInput({ fire_drills: [] }));
    expect(r.frequency.total_drills).toBe(0);
    expect(r.results.satisfactory).toBe(0);
    expect(r.evacuation.total_evacuations).toBe(0);
    expect(r.participation.drills_all_present).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. DRILL FREQUENCY PROFILE
// ═══════════════════════════════════════════════════════════════════════════

describe("drill frequency profile", () => {
  it("counts drills by type", () => {
    const drills = [
      makeDrill({ id: "d1", drill_type: "fire_drill" }),
      makeDrill({ id: "d2", drill_type: "fire_drill" }),
      makeDrill({ id: "d3", drill_type: "evacuation" }),
      makeDrill({ id: "d4", drill_type: "equipment_check", evacuation_time_seconds: null }),
      makeDrill({ id: "d5", drill_type: "lockdown" }),
    ];
    const r = computeHomeFireSafety(baseInput({ fire_drills: drills }));
    expect(r.frequency.fire_drills).toBe(2);
    expect(r.frequency.evacuations).toBe(1);
    expect(r.frequency.equipment_checks).toBe(1);
    expect(r.frequency.other_drills).toBe(1);
    expect(r.frequency.total_drills).toBe(5);
  });

  it("counts drills in last 30 and 90 days", () => {
    const drills = [
      makeDrill({ id: "d1", date: "2026-05-20" }), // 7 days ago → in 30 and 90
      makeDrill({ id: "d2", date: "2026-05-01" }), // 26 days → in 30 and 90
      makeDrill({ id: "d3", date: "2026-03-15" }), // 73 days → in 90 only
      makeDrill({ id: "d4", date: "2026-01-01" }), // 146 days → neither
    ];
    const r = computeHomeFireSafety(baseInput({ fire_drills: drills }));
    expect(r.frequency.drills_last_30_days).toBe(2);
    expect(r.frequency.drills_last_90_days).toBe(3);
  });

  it("detects overdue next drill", () => {
    const drills = [
      makeDrill({ id: "d1", date: "2026-04-01", next_drill_due: "2026-05-01" }), // overdue
    ];
    const r = computeHomeFireSafety(baseInput({ fire_drills: drills }));
    expect(r.frequency.next_drill_overdue).toBe(true);
  });

  it("detects non-overdue next drill", () => {
    const drills = [
      makeDrill({ id: "d1", date: "2026-05-20", next_drill_due: "2026-06-20" }),
    ];
    const r = computeHomeFireSafety(baseInput({ fire_drills: drills }));
    expect(r.frequency.next_drill_overdue).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. RESULT PROFILE
// ═══════════════════════════════════════════════════════════════════════════

describe("result profile", () => {
  it("counts results by type", () => {
    const drills = [
      makeDrill({ id: "d1", result: "satisfactory" }),
      makeDrill({ id: "d2", result: "satisfactory" }),
      makeDrill({ id: "d3", result: "issues_identified" }),
      makeDrill({ id: "d4", result: "failed" }),
    ];
    const r = computeHomeFireSafety(baseInput({ fire_drills: drills }));
    expect(r.results.satisfactory).toBe(2);
    expect(r.results.issues_identified).toBe(1);
    expect(r.results.failed).toBe(1);
    expect(r.results.satisfactory_rate).toBe(50);
  });

  it("calculates issue response rate", () => {
    const drills = [
      makeDrill({ id: "d1", result: "issues_identified", actions_taken: "Fixed it." }),
      makeDrill({ id: "d2", result: "issues_identified", actions_taken: "" }),
      makeDrill({ id: "d3", result: "satisfactory" }),
    ];
    const r = computeHomeFireSafety(baseInput({ fire_drills: drills }));
    expect(r.results.issues_actioned).toBe(1);
    expect(r.results.issue_response_rate).toBe(50); // 1/2
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. EVACUATION PROFILE
// ═══════════════════════════════════════════════════════════════════════════

describe("evacuation profile", () => {
  it("calculates evacuation stats from timed drills", () => {
    const drills = [
      makeDrill({ id: "d1", evacuation_time_seconds: 90 }),
      makeDrill({ id: "d2", evacuation_time_seconds: 110 }),
      makeDrill({ id: "d3", evacuation_time_seconds: 150 }),
    ];
    const r = computeHomeFireSafety(baseInput({ fire_drills: drills }));
    expect(r.evacuation.total_evacuations).toBe(3);
    expect(r.evacuation.avg_evacuation_time).toBe(117); // (90+110+150)/3
    expect(r.evacuation.fastest_evacuation).toBe(90);
    expect(r.evacuation.slowest_evacuation).toBe(150);
    expect(r.evacuation.within_target).toBe(2); // 90 and 110 <= 120
    expect(r.evacuation.target_compliance_rate).toBe(67); // 2/3
  });

  it("excludes null evacuation times", () => {
    const drills = [
      makeDrill({ id: "d1", evacuation_time_seconds: 95 }),
      makeDrill({ id: "d2", drill_type: "equipment_check", evacuation_time_seconds: null }),
    ];
    const r = computeHomeFireSafety(baseInput({ fire_drills: drills }));
    expect(r.evacuation.total_evacuations).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. PARTICIPATION PROFILE
// ═══════════════════════════════════════════════════════════════════════════

describe("participation profile", () => {
  it("counts all-present drills (excluding equipment checks)", () => {
    const drills = [
      makeDrill({ id: "d1", all_present: true }),
      makeDrill({ id: "d2", all_present: false }),
      makeDrill({ id: "d3", drill_type: "equipment_check", all_present: false, evacuation_time_seconds: null }),
    ];
    const r = computeHomeFireSafety(baseInput({ fire_drills: drills }));
    // Only d1 and d2 are participation drills (not equipment_check)
    expect(r.participation.drills_all_present).toBe(1);
    expect(r.participation.all_present_rate).toBe(50); // 1/2
  });

  it("identifies night drills (time >= 20:00 or < 06:00)", () => {
    const drills = [
      makeDrill({ id: "d1", time: "22:15" }),   // night
      makeDrill({ id: "d2", time: "03:00" }),   // night
      makeDrill({ id: "d3", time: "14:00" }),   // day
      makeDrill({ id: "d4", time: "19:59" }),   // day (just before 20:00)
    ];
    const r = computeHomeFireSafety(baseInput({ fire_drills: drills }));
    expect(r.participation.night_drills).toBe(2);
    expect(r.participation.daytime_drills).toBe(2);
  });

  it("calculates average children and staff per drill", () => {
    const drills = [
      makeDrill({ id: "d1", children_present: ["yp_alex", "yp_jordan"], staff_present: ["staff_darren"] }),
      makeDrill({ id: "d2", children_present: ["yp_alex", "yp_jordan", "yp_casey"], staff_present: ["staff_darren", "staff_anna", "staff_edward"] }),
    ];
    const r = computeHomeFireSafety(baseInput({ fire_drills: drills }));
    expect(r.participation.avg_children_per_drill).toBe(2.5);
    expect(r.participation.avg_staff_per_drill).toBe(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. SCORING MODIFIERS
// ═══════════════════════════════════════════════════════════════════════════

describe("mod1: drill frequency", () => {
  it("awards +4 for >= 2 drills in 30 days", () => {
    const frequent = baseInput({
      fire_drills: [
        makeDrill({ id: "d1", date: "2026-05-20" }),
        makeDrill({ id: "d2", date: "2026-05-10" }),
      ],
    });
    const rare = baseInput({
      fire_drills: [
        makeDrill({ id: "d1", date: "2026-05-20" }),
      ],
    });
    const rFreq = computeHomeFireSafety(frequent);
    const rRare = computeHomeFireSafety(rare);
    // frequent: >=2 → +4; rare: >=1 → +2. Diff = 2
    expect(rFreq.fire_safety_score! - rRare.fire_safety_score!).toBe(2);
  });
});

describe("mod2: results quality", () => {
  it("penalises -4 for any failed drill", () => {
    const passed = baseInput({
      fire_drills: [makeDrill({ id: "d1", result: "satisfactory" })],
    });
    const failed = baseInput({
      fire_drills: [makeDrill({ id: "d1", result: "failed", issues: "Alarm malfunction", actions_taken: "Repaired alarm" })],
    });
    const rPassed = computeHomeFireSafety(passed);
    const rFailed = computeHomeFireSafety(failed);
    // passed: 100% satisfactory → +4; failed: failed present → -4
    // Also mod3: passed has 0 issues → +2; failed has 1 issue actioned 100% → +3
    // mod3 diff: +2 vs +3 = -1
    // Total expected: (4 - (-4)) + (-1) = 7
    expect(rPassed.fire_safety_score! - rFailed.fire_safety_score!).toBe(7);
  });
});

describe("mod3: issue response", () => {
  it("awards +3 when all issues actioned", () => {
    const actioned = baseInput({
      fire_drills: [makeDrill({ id: "d1", result: "issues_identified", issues: "Problem found", actions_taken: "Fixed it" })],
    });
    const notActioned = baseInput({
      fire_drills: [makeDrill({ id: "d1", result: "issues_identified", issues: "Problem found", actions_taken: "" })],
    });
    const rActioned = computeHomeFireSafety(actioned);
    const rNotActioned = computeHomeFireSafety(notActioned);
    // actioned: 100% → +3; notActioned: 0% → -3. Diff = 6
    // mod2 also differs: both have issues_identified so satisfactory_rate = 0%
    // actioned: 0% satisfactory, no failed → >=40? 0% < 40 → -2
    // notActioned: same → -2. No diff on mod2.
    expect(rActioned.fire_safety_score! - rNotActioned.fire_safety_score!).toBe(6);
  });
});

describe("mod4: evacuation compliance", () => {
  it("awards +4 for >= 90% within target", () => {
    const fast = baseInput({
      fire_drills: [
        makeDrill({ id: "d1", evacuation_time_seconds: 90 }),
        makeDrill({ id: "d2", evacuation_time_seconds: 100 }),
      ],
    });
    const r = computeHomeFireSafety(fast);
    expect(r.evacuation.target_compliance_rate).toBe(100);
  });
});

describe("mod5: all present rate", () => {
  it("awards +3 for >= 80% all present", () => {
    const good = baseInput({
      fire_drills: [
        makeDrill({ id: "d1", all_present: true }),
        makeDrill({ id: "d2", all_present: true }),
      ],
    });
    const poor = baseInput({
      fire_drills: [
        makeDrill({ id: "d1", all_present: true }),
        makeDrill({ id: "d2", all_present: false }),
      ],
    });
    const rGood = computeHomeFireSafety(good);
    const rPoor = computeHomeFireSafety(poor);
    // good: 100% → +3; poor: 50% → +1. Diff = 2
    expect(rGood.fire_safety_score! - rPoor.fire_safety_score!).toBe(2);
  });
});

describe("mod6: night drills", () => {
  it("awards +3 for >= 2 night drills", () => {
    const nights = baseInput({
      fire_drills: [
        makeDrill({ id: "d1", time: "22:00" }),
        makeDrill({ id: "d2", time: "23:00" }),
      ],
    });
    const noNights = baseInput({
      fire_drills: [
        makeDrill({ id: "d1", time: "14:00" }),
        makeDrill({ id: "d2", time: "10:00" }),
      ],
    });
    const rNights = computeHomeFireSafety(nights);
    const rNoNights = computeHomeFireSafety(noNights);
    // nights: >=2 → +3; noNights: 0 → -2. Diff = 5
    expect(rNights.fire_safety_score! - rNoNights.fire_safety_score!).toBe(5);
  });
});

describe("mod7: equipment checks", () => {
  it("awards +3 for >= 2 equipment checks", () => {
    const checks = baseInput({
      fire_drills: [
        makeDrill({ id: "d1", drill_type: "equipment_check", evacuation_time_seconds: null }),
        makeDrill({ id: "d2", drill_type: "equipment_check", evacuation_time_seconds: null }),
        makeDrill({ id: "d3", drill_type: "fire_drill" }),
      ],
    });
    const r = computeHomeFireSafety(checks);
    expect(r.frequency.equipment_checks).toBe(2);
  });
});

describe("mod8: overdue drill", () => {
  it("penalises -4 when next drill overdue, awards +4 when current", () => {
    const current = baseInput({
      fire_drills: [makeDrill({ next_drill_due: "2026-06-15" })],
    });
    const overdue = baseInput({
      fire_drills: [makeDrill({ next_drill_due: "2026-05-20" })],
    });
    const rCurrent = computeHomeFireSafety(current);
    const rOverdue = computeHomeFireSafety(overdue);
    // current: +4; overdue: -4. Diff = 8
    expect(rCurrent.fire_safety_score! - rOverdue.fire_safety_score!).toBe(8);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. RATING THRESHOLDS
// ═══════════════════════════════════════════════════════════════════════════

describe("rating thresholds", () => {
  it("returns outstanding for excellent scenario", () => {
    const drills = [
      makeDrill({ id: "d1", date: "2026-05-20", time: "14:00", result: "satisfactory", evacuation_time_seconds: 85, all_present: true, next_drill_due: "2026-06-20" }),
      makeDrill({ id: "d2", date: "2026-05-10", time: "22:00", result: "satisfactory", evacuation_time_seconds: 100, all_present: true, next_drill_due: "2026-06-10" }),
      makeDrill({ id: "d3", date: "2026-05-05", time: "21:30", result: "issues_identified", issues: "Casey slow", actions_taken: "Updated PEEP", evacuation_time_seconds: 115, all_present: true, next_drill_due: "2026-06-05" }),
      makeDrill({ id: "d4", date: "2026-05-15", time: "09:00", drill_type: "equipment_check", evacuation_time_seconds: null, result: "satisfactory", all_present: false, next_drill_due: "2026-06-15" }),
      makeDrill({ id: "d5", date: "2026-05-01", time: "09:30", drill_type: "equipment_check", evacuation_time_seconds: null, result: "satisfactory", all_present: false, next_drill_due: "2026-06-01" }),
    ];
    const r = computeHomeFireSafety(baseInput({ fire_drills: drills }));
    // mod1: 5 in 30 days → +4
    // mod2: 0 failed, 4/5=80% satisfactory → +4
    // mod3: 1 issue, 100% actioned → +3
    // mod4: 3 evacuations: 85,100,115 all ≤120 → 100% → +4
    // mod5: 3 participation drills (excl equipment), all_present 3/3=100% → +3
    // mod6: 2 night drills (22:00 and 21:30) → +3
    // mod7: 2 equipment checks → +3
    // mod8: latest drill (d1 date 05-20) next_drill_due 06-20, not overdue → +4
    // Total: 52 + 4+4+3+4+3+3+3+4 = 80
    expect(r.fire_safety_rating).toBe("outstanding");
    expect(r.fire_safety_score).toBeGreaterThanOrEqual(80);
  });

  it("returns inadequate for poor scenario", () => {
    const drills = [
      makeDrill({
        id: "d1", date: "2026-02-01", time: "14:00",
        result: "failed", evacuation_time_seconds: 200,
        all_present: false, next_drill_due: "2026-03-01",
        issues: "Alarm failed", actions_taken: "",
      }),
    ];
    const r = computeHomeFireSafety(baseInput({ fire_drills: drills }));
    expect(r.fire_safety_rating).toBe("inadequate");
    expect(r.fire_safety_score).toBeLessThan(45);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. STRENGTHS & CONCERNS
// ═══════════════════════════════════════════════════════════════════════════

describe("strengths", () => {
  it("includes frequency strength for 2+ drills in 30 days", () => {
    const drills = [
      makeDrill({ id: "d1", date: "2026-05-20" }),
      makeDrill({ id: "d2", date: "2026-05-10" }),
    ];
    const r = computeHomeFireSafety(baseInput({ fire_drills: drills }));
    expect(r.strengths.some((s) => s.includes("drills/checks in last 30 days"))).toBe(true);
  });

  it("includes night drill strength", () => {
    const drills = [makeDrill({ time: "22:00" })];
    const r = computeHomeFireSafety(baseInput({ fire_drills: drills }));
    expect(r.strengths.some((s) => s.includes("night drill"))).toBe(true);
  });
});

describe("concerns", () => {
  it("flags failed drills", () => {
    const drills = [makeDrill({ result: "failed", issues: "Alarm broken", actions_taken: "Repaired" })];
    const r = computeHomeFireSafety(baseInput({ fire_drills: drills }));
    expect(r.concerns.some((c) => c.includes("failed"))).toBe(true);
  });

  it("flags overdue next drill", () => {
    const drills = [makeDrill({ next_drill_due: "2026-05-01" })];
    const r = computeHomeFireSafety(baseInput({ fire_drills: drills }));
    expect(r.concerns.some((c) => c.includes("overdue"))).toBe(true);
  });

  it("flags no night drills", () => {
    const drills = [makeDrill({ time: "14:00" })];
    const r = computeHomeFireSafety(baseInput({ fire_drills: drills }));
    expect(r.concerns.some((c) => c.includes("night drill"))).toBe(true);
  });

  it("flags no equipment checks", () => {
    const drills = [makeDrill({ drill_type: "fire_drill" })];
    const r = computeHomeFireSafety(baseInput({ fire_drills: drills }));
    expect(r.concerns.some((c) => c.includes("equipment check"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. RECOMMENDATIONS & INSIGHTS
// ═══════════════════════════════════════════════════════════════════════════

describe("recommendations", () => {
  it("generates immediate rec for overdue drill", () => {
    const drills = [makeDrill({ next_drill_due: "2026-05-01" })];
    const r = computeHomeFireSafety(baseInput({ fire_drills: drills }));
    const rec = r.recommendations.find((r) => r.recommendation.includes("overdue"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("generates immediate rec for failed drill", () => {
    const drills = [makeDrill({ result: "failed", issues: "Broken", actions_taken: "Fixed" })];
    const r = computeHomeFireSafety(baseInput({ fire_drills: drills }));
    const rec = r.recommendations.find((r) => r.recommendation.includes("failed"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("ranks sequentially", () => {
    const drills = [makeDrill({ result: "failed", next_drill_due: "2026-05-01", issues: "Problem", actions_taken: "" })];
    const r = computeHomeFireSafety(baseInput({ fire_drills: drills }));
    for (let i = 1; i < r.recommendations.length; i++) {
      expect(r.recommendations[i].rank).toBeGreaterThan(r.recommendations[i - 1].rank);
    }
  });
});

describe("insights", () => {
  it("generates critical insight for failed drills", () => {
    const drills = [makeDrill({ result: "failed", issues: "Broken", actions_taken: "Fixed" })];
    const r = computeHomeFireSafety(baseInput({ fire_drills: drills }));
    const ins = r.insights.find((i) => i.text.includes("failure"));
    expect(ins).toBeDefined();
    expect(ins!.severity).toBe("critical");
  });

  it("generates positive insight for good evacuation time", () => {
    const drills = [makeDrill({ evacuation_time_seconds: 90 })];
    const r = computeHomeFireSafety(baseInput({ fire_drills: drills }));
    const ins = r.insights.find((i) => i.text.includes("evacuation time"));
    expect(ins).toBeDefined();
    expect(ins!.severity).toBe("positive");
  });

  it("generates warning for slow evacuations", () => {
    const drills = [makeDrill({ evacuation_time_seconds: 150 })];
    const r = computeHomeFireSafety(baseInput({ fire_drills: drills }));
    const ins = r.insights.find((i) => i.text.includes("above the"));
    expect(ins).toBeDefined();
    expect(ins!.severity).toBe("warning");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 10. SCORE CLAMPING & EDGE CASES
// ═══════════════════════════════════════════════════════════════════════════

describe("score clamping", () => {
  it("never exceeds 100", () => {
    const drills = Array.from({ length: 10 }, (_, i) =>
      makeDrill({
        id: `d${i}`,
        date: `2026-05-${15 + i}`,
        time: i % 3 === 0 ? "22:00" : "14:00",
        drill_type: i < 7 ? "fire_drill" : "equipment_check",
        evacuation_time_seconds: i < 7 ? 80 : null,
        result: "satisfactory",
        all_present: true,
        next_drill_due: "2026-06-30",
      }),
    );
    const r = computeHomeFireSafety(baseInput({ fire_drills: drills }));
    expect(r.fire_safety_score).toBeLessThanOrEqual(100);
  });

  it("never goes below 0", () => {
    const drills = [
      makeDrill({
        result: "failed",
        evacuation_time_seconds: 300,
        all_present: false,
        time: "14:00",
        next_drill_due: "2026-03-01",
        date: "2026-02-01",
        issues: "Everything failed",
        actions_taken: "",
      }),
    ];
    const r = computeHomeFireSafety(baseInput({ fire_drills: drills }));
    expect(r.fire_safety_score).toBeGreaterThanOrEqual(0);
  });
});

describe("edge cases", () => {
  it("handles single drill correctly", () => {
    const r = computeHomeFireSafety(baseInput());
    expect(r.frequency.total_drills).toBe(1);
  });

  it("handles drill with 0 children and 0 staff present", () => {
    const drills = [makeDrill({ children_present: [], staff_present: [], all_present: false })];
    const r = computeHomeFireSafety(baseInput({ fire_drills: drills }));
    expect(r.participation.avg_children_per_drill).toBe(0);
    expect(r.participation.avg_staff_per_drill).toBe(0);
  });

  it("works with total_children 0 but total_staff > 0", () => {
    const r = computeHomeFireSafety(baseInput({ total_children: 0 }));
    expect(r.fire_safety_rating).not.toBe("insufficient_data");
  });
});
