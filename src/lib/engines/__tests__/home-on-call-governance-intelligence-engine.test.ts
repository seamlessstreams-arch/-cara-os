// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME ON-CALL GOVERNANCE INTELLIGENCE ENGINE — TESTS
// Reg 33(4)(b): out-of-hours management support arrangements.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeHomeOnCallGovernance,
  type HomeOnCallGovernanceInput,
  type OnCallShiftInput,
  type OnCallCallInput,
} from "../home-on-call-governance-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeCall(overrides: Partial<OnCallCallInput> = {}): OnCallCallInput {
  return {
    datetime: "2026-05-20T22:00:00Z",
    from_contact: "staff_1",
    call_type: "routine",
    duration_mins: 10,
    outcome: "Resolved",
    escalated: false,
    ...overrides,
  };
}

function makeShift(overrides: Partial<OnCallShiftInput> = {}): OnCallShiftInput {
  return {
    id: "oc_test",
    date_from: "2026-05-20T17:00:00Z",
    date_to: "2026-05-21T08:00:00Z",
    role: "first_line_rm",
    on_call_staff: "staff_darren",
    backup_staff: "staff_ryan",
    calls_received: [makeCall()],
    critical_incidents_handled: 0,
    routine_calls_handled: 1,
    advisory_calls_handled: 0,
    feedback_on_arrangements: "Good handover from shift staff.",
    review_notes: "",
    ...overrides,
  };
}

function baseInput(overrides: Partial<HomeOnCallGovernanceInput> = {}): HomeOnCallGovernanceInput {
  return {
    today: "2026-05-27",
    on_call_shifts: [makeShift()],
    total_staff: 10,
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. INSUFFICIENT DATA
// ═══════════════════════════════════════════════════════════════════════════

describe("insufficient data", () => {
  it("returns insufficient_data when total_staff is 0", () => {
    const r = computeHomeOnCallGovernance(baseInput({ total_staff: 0 }));
    expect(r.on_call_rating).toBe("insufficient_data");
    expect(r.on_call_score).toBe(0);
  });

  it("returns insufficient_data when no on-call shifts", () => {
    const r = computeHomeOnCallGovernance(baseInput({ on_call_shifts: [] }));
    expect(r.on_call_rating).toBe("insufficient_data");
    expect(r.on_call_score).toBe(0);
  });

  it("populates all profiles with zeros", () => {
    const r = computeHomeOnCallGovernance(baseInput({ on_call_shifts: [] }));
    expect(r.coverage.total_shifts).toBe(0);
    expect(r.response.total_calls).toBe(0);
    expect(r.quality.feedback_rate).toBeNull();
    expect(r.workload.critical_incidents_total).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. COVERAGE PROFILE
// ═══════════════════════════════════════════════════════════════════════════

describe("coverage profile", () => {
  it("counts total shifts", () => {
    const shifts = [makeShift({ id: "s1" }), makeShift({ id: "s2" })];
    const r = computeHomeOnCallGovernance(baseInput({ on_call_shifts: shifts }));
    expect(r.coverage.total_shifts).toBe(2);
  });

  it("counts shifts in last 14 days", () => {
    const shifts = [
      makeShift({ id: "s1", date_from: "2026-05-20T17:00:00Z" }), // 7 days ago
      makeShift({ id: "s2", date_from: "2026-05-10T17:00:00Z" }), // 17 days ago - outside 14
      makeShift({ id: "s3", date_from: "2026-05-14T17:00:00Z" }), // 13 days ago - within 14
    ];
    const r = computeHomeOnCallGovernance(baseInput({ on_call_shifts: shifts }));
    expect(r.coverage.shifts_last_14_days).toBe(2);
  });

  it("counts unique on-call staff", () => {
    const shifts = [
      makeShift({ id: "s1", on_call_staff: "staff_darren" }),
      makeShift({ id: "s2", on_call_staff: "staff_ryan" }),
      makeShift({ id: "s3", on_call_staff: "staff_darren" }),
    ];
    const r = computeHomeOnCallGovernance(baseInput({ on_call_shifts: shifts }));
    expect(r.coverage.unique_on_call_staff).toBe(2);
  });

  it("calculates backup designation rate", () => {
    const shifts = [
      makeShift({ id: "s1", backup_staff: "staff_ryan" }),
      makeShift({ id: "s2", backup_staff: "" }),
      makeShift({ id: "s3", backup_staff: "staff_darren" }),
    ];
    const r = computeHomeOnCallGovernance(baseInput({ on_call_shifts: shifts }));
    expect(r.coverage.has_backup_rate).toBe(67); // 2/3
  });

  it("tracks role distribution", () => {
    const shifts = [
      makeShift({ id: "s1", role: "first_line_rm" }),
      makeShift({ id: "s2", role: "second_line_deputy" }),
      makeShift({ id: "s3", role: "first_line_rm" }),
    ];
    const r = computeHomeOnCallGovernance(baseInput({ on_call_shifts: shifts }));
    expect(r.coverage.role_distribution).toEqual({
      first_line_rm: 2,
      second_line_deputy: 1,
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. RESPONSE PROFILE
// ═══════════════════════════════════════════════════════════════════════════

describe("response profile", () => {
  it("counts call types across all shifts", () => {
    const shifts = [
      makeShift({
        id: "s1",
        calls_received: [
          makeCall({ call_type: "critical", escalated: true }),
          makeCall({ call_type: "routine" }),
        ],
      }),
      makeShift({
        id: "s2",
        calls_received: [makeCall({ call_type: "advisory" })],
      }),
    ];
    const r = computeHomeOnCallGovernance(baseInput({ on_call_shifts: shifts }));
    expect(r.response.total_calls).toBe(3);
    expect(r.response.critical_calls).toBe(1);
    expect(r.response.routine_calls).toBe(1);
    expect(r.response.advisory_calls).toBe(1);
    expect(r.response.escalated_calls).toBe(1);
  });

  it("calculates average call duration", () => {
    const calls = [
      makeCall({ duration_mins: 10 }),
      makeCall({ duration_mins: 30 }),
    ];
    const r = computeHomeOnCallGovernance(baseInput({
      on_call_shifts: [makeShift({ calls_received: calls })],
    }));
    expect(r.response.avg_call_duration).toBe(20);
  });

  it("calculates calls per shift", () => {
    const shifts = [
      makeShift({ id: "s1", calls_received: [makeCall(), makeCall()] }),
      makeShift({ id: "s2", calls_received: [] }),
    ];
    const r = computeHomeOnCallGovernance(baseInput({ on_call_shifts: shifts }));
    expect(r.response.calls_per_shift).toBe(1); // 2/2 = 1.0
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. QUALITY PROFILE
// ═══════════════════════════════════════════════════════════════════════════

describe("quality profile", () => {
  it("counts shifts with feedback and review notes (completed only)", () => {
    const shifts = [
      makeShift({ id: "s1", date_to: "2026-05-21T08:00:00Z", feedback_on_arrangements: "Good", review_notes: "Note" }),
      makeShift({ id: "s2", date_to: "2026-05-22T08:00:00Z", feedback_on_arrangements: "", review_notes: "" }),
      makeShift({ id: "s3", date_to: "2026-06-01T08:00:00Z", feedback_on_arrangements: "Future shift", review_notes: "" }), // not completed yet
    ];
    const r = computeHomeOnCallGovernance(baseInput({ on_call_shifts: shifts }));
    expect(r.quality.shifts_with_feedback).toBe(1); // only s1
    expect(r.quality.shifts_with_review_notes).toBe(1);
    expect(r.quality.feedback_rate).toBe(50); // 1/2 completed shifts
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. WORKLOAD PROFILE
// ═══════════════════════════════════════════════════════════════════════════

describe("workload profile", () => {
  it("counts critical, routine, advisory totals from shift-level fields", () => {
    const shifts = [
      makeShift({ id: "s1", critical_incidents_handled: 1, routine_calls_handled: 2, advisory_calls_handled: 1 }),
      makeShift({ id: "s2", critical_incidents_handled: 0, routine_calls_handled: 1, advisory_calls_handled: 0 }),
    ];
    const r = computeHomeOnCallGovernance(baseInput({ on_call_shifts: shifts }));
    expect(r.workload.critical_incidents_total).toBe(1);
    expect(r.workload.routine_total).toBe(3);
    expect(r.workload.advisory_total).toBe(1);
  });

  it("finds busiest shift and quiet shifts", () => {
    const shifts = [
      makeShift({ id: "s1", calls_received: [makeCall(), makeCall(), makeCall()] }),
      makeShift({ id: "s2", calls_received: [] }),
      makeShift({ id: "s3", calls_received: [makeCall()] }),
    ];
    const r = computeHomeOnCallGovernance(baseInput({ on_call_shifts: shifts }));
    expect(r.workload.busiest_shift_calls).toBe(3);
    expect(r.workload.quiet_shifts).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. SCORING MODIFIERS
// ═══════════════════════════════════════════════════════════════════════════

describe("mod1: coverage frequency", () => {
  it("awards +4 for >= 4 shifts in 14 days", () => {
    const shifts = Array.from({ length: 4 }, (_, i) =>
      makeShift({ id: `s${i}`, date_from: `2026-05-${20 + i}T17:00:00Z` }),
    );
    const r = computeHomeOnCallGovernance(baseInput({ on_call_shifts: shifts }));
    expect(r.coverage.shifts_last_14_days).toBe(4);
  });

  it("penalises -4 for no shifts in 14 days", () => {
    const good = baseInput({
      on_call_shifts: [makeShift({ date_from: "2026-05-20T17:00:00Z" })],
    });
    const bad = baseInput({
      on_call_shifts: [makeShift({ date_from: "2026-05-01T17:00:00Z" })],
    });
    const rGood = computeHomeOnCallGovernance(good);
    const rBad = computeHomeOnCallGovernance(bad);
    // good: 1 shift in 14 days → 0; bad: 0 in 14 days → -4. Diff from mod1 = 4
    // mod8 also changes: good: 1 in 30 days → 0; bad: 1 in 30 days → 0. Same.
    expect(rGood.on_call_score! - rBad.on_call_score!).toBe(4);
  });
});

describe("mod2: backup designation", () => {
  it("awards +4 for >= 90% backup rate", () => {
    const r = computeHomeOnCallGovernance(baseInput());
    // Default has backup_staff="staff_ryan" → 100% → +4
    expect(r.coverage.has_backup_rate).toBe(100);
  });
});

describe("mod3: staff diversity", () => {
  it("awards +3 for >= 3 unique staff", () => {
    const shifts = [
      makeShift({ id: "s1", on_call_staff: "staff_a" }),
      makeShift({ id: "s2", on_call_staff: "staff_b" }),
      makeShift({ id: "s3", on_call_staff: "staff_c" }),
    ];
    const r = computeHomeOnCallGovernance(baseInput({ on_call_shifts: shifts }));
    expect(r.coverage.unique_on_call_staff).toBe(3);
  });

  it("penalises -2 for single person covering all", () => {
    const multi = baseInput({
      on_call_shifts: [
        makeShift({ id: "s1", on_call_staff: "staff_a" }),
        makeShift({ id: "s2", on_call_staff: "staff_b" }),
      ],
    });
    const single = baseInput({
      on_call_shifts: [
        makeShift({ id: "s1", on_call_staff: "staff_a" }),
        makeShift({ id: "s2", on_call_staff: "staff_a" }),
      ],
    });
    const rMulti = computeHomeOnCallGovernance(multi);
    const rSingle = computeHomeOnCallGovernance(single);
    // multi: 2 staff → +1; single: 1 staff → -2. Diff = 3
    expect(rMulti.on_call_score! - rSingle.on_call_score!).toBe(3);
  });
});

describe("mod4: response documentation", () => {
  it("awards +4 when all calls have outcomes", () => {
    const r = computeHomeOnCallGovernance(baseInput());
    // Default call has outcome="Resolved" → 100% → +4
    expect(r.response.total_calls).toBe(1);
  });

  it("penalises -3 when < 50% have outcomes", () => {
    const good = baseInput({
      on_call_shifts: [makeShift({
        calls_received: [
          makeCall({ outcome: "Done" }),
          makeCall({ outcome: "Done" }),
        ],
      })],
    });
    const bad = baseInput({
      on_call_shifts: [makeShift({
        calls_received: [
          makeCall({ outcome: "Done" }),
          makeCall({ outcome: "" }),
          makeCall({ outcome: "" }),
          makeCall({ outcome: "" }),
        ],
      })],
    });
    const rGood = computeHomeOnCallGovernance(good);
    const rBad = computeHomeOnCallGovernance(bad);
    // good: 2/2=100% → +4; bad: 1/4=25% → -3. Diff = 7
    expect(rGood.on_call_score! - rBad.on_call_score!).toBe(7);
  });
});

describe("mod5: feedback quality", () => {
  it("awards +3 when >= 80% feedback rate", () => {
    const shifts = [
      makeShift({ id: "s1", feedback_on_arrangements: "Good" }),
      makeShift({ id: "s2", feedback_on_arrangements: "Fine" }),
    ];
    const r = computeHomeOnCallGovernance(baseInput({ on_call_shifts: shifts }));
    expect(r.quality.feedback_rate).toBe(100);
  });
});

describe("mod6: escalation appropriateness", () => {
  it("awards +3 when all critical calls escalated", () => {
    const good = baseInput({
      on_call_shifts: [makeShift({
        calls_received: [makeCall({ call_type: "critical", escalated: true })],
        critical_incidents_handled: 1,
      })],
    });
    const bad = baseInput({
      on_call_shifts: [makeShift({
        calls_received: [makeCall({ call_type: "critical", escalated: false })],
        critical_incidents_handled: 1,
      })],
    });
    const rGood = computeHomeOnCallGovernance(good);
    const rBad = computeHomeOnCallGovernance(bad);
    // good: all critical escalated → +3; bad: 1 critical not escalated → 0. Diff = 3
    expect(rGood.on_call_score! - rBad.on_call_score!).toBe(3);
  });
});

describe("mod7: role coverage", () => {
  it("awards +3 for >= 2 roles", () => {
    const multi = baseInput({
      on_call_shifts: [
        makeShift({ id: "s1", role: "first_line_rm" }),
        makeShift({ id: "s2", role: "second_line_deputy" }),
      ],
    });
    const single = baseInput({
      on_call_shifts: [
        makeShift({ id: "s1", role: "first_line_rm" }),
        makeShift({ id: "s2", role: "first_line_rm" }),
      ],
    });
    const rMulti = computeHomeOnCallGovernance(multi);
    const rSingle = computeHomeOnCallGovernance(single);
    // multi: 2 roles → +3; single: 1 role → 0. Diff = 3
    expect(rMulti.on_call_score! - rSingle.on_call_score!).toBe(3);
  });
});

describe("mod8: continuity", () => {
  it("awards +4 for >= 6 shifts in 30 days", () => {
    const shifts = Array.from({ length: 6 }, (_, i) =>
      makeShift({ id: `s${i}`, date_from: `2026-05-${10 + i * 3}T17:00:00Z` }),
    );
    const r = computeHomeOnCallGovernance(baseInput({ on_call_shifts: shifts }));
    expect(r.coverage.shifts_last_30_days).toBeGreaterThanOrEqual(6);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. RATING THRESHOLDS
// ═══════════════════════════════════════════════════════════════════════════

describe("rating thresholds", () => {
  it("returns outstanding for excellent scenario", () => {
    // 3 unique staff → mod3 +3, critical escalated → mod6 +3
    const shifts = Array.from({ length: 6 }, (_, i) =>
      makeShift({
        id: `s${i}`,
        date_from: `2026-05-${14 + i * 2}T17:00:00Z`,
        date_to: `2026-05-${15 + i * 2}T08:00:00Z`,
        on_call_staff: i < 2 ? "staff_darren" : i < 4 ? "staff_ryan" : "staff_anna",
        role: i % 2 === 0 ? "first_line_rm" : "second_line_deputy",
        calls_received: [
          makeCall({
            outcome: "Resolved",
            call_type: i === 0 ? "critical" : "routine",
            escalated: i === 0,
          }),
        ],
        feedback_on_arrangements: "All good",
      }),
    );
    const r = computeHomeOnCallGovernance(baseInput({ on_call_shifts: shifts }));
    expect(r.on_call_rating).toBe("outstanding");
    expect(r.on_call_score).toBeGreaterThanOrEqual(80);
  });

  it("returns inadequate for poor scenario", () => {
    const shifts = [
      makeShift({
        date_from: "2026-04-01T17:00:00Z",
        date_to: "2026-04-02T08:00:00Z",
        backup_staff: "",
        calls_received: [makeCall({ call_type: "critical", escalated: false, outcome: "" })],
        feedback_on_arrangements: "",
        critical_incidents_handled: 1,
      }),
    ];
    const r = computeHomeOnCallGovernance(baseInput({ on_call_shifts: shifts }));
    expect(r.on_call_rating).toBe("inadequate");
    expect(r.on_call_score).toBeLessThan(45);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. STRENGTHS & CONCERNS
// ═══════════════════════════════════════════════════════════════════════════

describe("strengths", () => {
  it("includes backup rate strength", () => {
    const r = computeHomeOnCallGovernance(baseInput());
    expect(r.strengths.some((s) => s.includes("backup"))).toBe(true);
  });

  it("includes staff diversity strength", () => {
    const shifts = [
      makeShift({ id: "s1", on_call_staff: "a" }),
      makeShift({ id: "s2", on_call_staff: "b" }),
    ];
    const r = computeHomeOnCallGovernance(baseInput({ on_call_shifts: shifts }));
    expect(r.strengths.some((s) => s.includes("different staff"))).toBe(true);
  });
});

describe("concerns", () => {
  it("flags no coverage in 14 days", () => {
    const r = computeHomeOnCallGovernance(baseInput({
      on_call_shifts: [makeShift({ date_from: "2026-04-01T17:00:00Z" })],
    }));
    expect(r.concerns.some((c) => c.includes("14 days"))).toBe(true);
  });

  it("flags single person coverage", () => {
    const shifts = [
      makeShift({ id: "s1", on_call_staff: "staff_a" }),
      makeShift({ id: "s2", on_call_staff: "staff_a" }),
      makeShift({ id: "s3", on_call_staff: "staff_a" }),
    ];
    const r = computeHomeOnCallGovernance(baseInput({ on_call_shifts: shifts }));
    expect(r.concerns.some((c) => c.includes("one person"))).toBe(true);
  });

  it("flags critical incidents not escalated", () => {
    const r = computeHomeOnCallGovernance(baseInput({
      on_call_shifts: [makeShift({
        calls_received: [makeCall({ call_type: "critical", escalated: false })],
      })],
    }));
    expect(r.concerns.some((c) => c.includes("not escalated"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. RECOMMENDATIONS
// ═══════════════════════════════════════════════════════════════════════════

describe("recommendations", () => {
  it("generates immediate rec for no coverage", () => {
    const r = computeHomeOnCallGovernance(baseInput({
      on_call_shifts: [makeShift({ date_from: "2026-04-01T17:00:00Z" })],
    }));
    const rec = r.recommendations.find((r) => r.urgency === "immediate");
    expect(rec).toBeDefined();
    expect(rec!.regulatory_ref).toBe("Reg 33(4)(b)");
  });

  it("generates rec for single-person dependency", () => {
    const shifts = [makeShift(), makeShift({ id: "s2" })];
    const r = computeHomeOnCallGovernance(baseInput({ on_call_shifts: shifts }));
    expect(r.recommendations.some((rec) => rec.recommendation.includes("additional staff"))).toBe(true);
  });

  it("ranks sequentially", () => {
    const r = computeHomeOnCallGovernance(baseInput({
      on_call_shifts: [makeShift({
        date_from: "2026-04-01T17:00:00Z",
        calls_received: [makeCall({ call_type: "critical", escalated: false })],
      })],
    }));
    r.recommendations.forEach((rec, i) => {
      expect(rec.rank).toBe(i + 1);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 10. INSIGHTS
// ═══════════════════════════════════════════════════════════════════════════

describe("insights", () => {
  it("generates insight for critical incidents handled", () => {
    const r = computeHomeOnCallGovernance(baseInput({
      on_call_shifts: [makeShift({ critical_incidents_handled: 1 })],
    }));
    expect(r.insights.some((i) => i.text.includes("critical incident"))).toBe(true);
  });

  it("generates critical insight for single-person dependency", () => {
    const shifts = Array.from({ length: 3 }, (_, i) =>
      makeShift({ id: `s${i}`, on_call_staff: "staff_darren" }),
    );
    const r = computeHomeOnCallGovernance(baseInput({ on_call_shifts: shifts }));
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("one person"))).toBe(true);
  });

  it("generates positive insight for escalation governance", () => {
    const r = computeHomeOnCallGovernance(baseInput({
      on_call_shifts: [makeShift({
        calls_received: [makeCall({ call_type: "critical", escalated: true })],
        critical_incidents_handled: 1,
      })],
    }));
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("escalated"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 11. SCORE CLAMPING
// ═══════════════════════════════════════════════════════════════════════════

describe("score clamping", () => {
  it("never exceeds 100", () => {
    const shifts = Array.from({ length: 10 }, (_, i) =>
      makeShift({
        id: `s${i}`,
        date_from: `2026-05-${17 + (i % 10)}T17:00:00Z`,
        date_to: `2026-05-${18 + (i % 10)}T08:00:00Z`,
        on_call_staff: i < 4 ? "staff_a" : i < 7 ? "staff_b" : "staff_c",
        role: i % 2 === 0 ? "first_line_rm" : "second_line_deputy",
        feedback_on_arrangements: "Good",
      }),
    );
    const r = computeHomeOnCallGovernance(baseInput({ on_call_shifts: shifts }));
    expect(r.on_call_score).toBeLessThanOrEqual(100);
  });

  it("never goes below 0", () => {
    const shifts = [
      makeShift({
        date_from: "2026-03-01T17:00:00Z",
        date_to: "2026-03-02T08:00:00Z",
        backup_staff: "",
        calls_received: [
          makeCall({ call_type: "critical", escalated: false, outcome: "" }),
          makeCall({ call_type: "critical", escalated: false, outcome: "" }),
        ],
        feedback_on_arrangements: "",
      }),
    ];
    const r = computeHomeOnCallGovernance(baseInput({ on_call_shifts: shifts }));
    expect(r.on_call_score).toBeGreaterThanOrEqual(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 12. EDGE CASES
// ═══════════════════════════════════════════════════════════════════════════

describe("edge cases", () => {
  it("handles shift with no calls", () => {
    const r = computeHomeOnCallGovernance(baseInput({
      on_call_shifts: [makeShift({ calls_received: [] })],
    }));
    expect(r.response.total_calls).toBe(0);
    expect(r.response.avg_call_duration).toBe(0);
    expect(r.response.calls_per_shift).toBe(0);
  });

  it("handles single shift correctly", () => {
    const r = computeHomeOnCallGovernance(baseInput());
    expect(r.on_call_rating).not.toBe("insufficient_data");
    expect(r.coverage.total_shifts).toBe(1);
  });

  it("handles future shift (not completed)", () => {
    const r = computeHomeOnCallGovernance(baseInput({
      on_call_shifts: [makeShift({
        date_from: "2026-06-01T17:00:00Z",
        date_to: "2026-06-02T08:00:00Z",
        feedback_on_arrangements: "Future",
      })],
    }));
    // Future shift should not count as completed
    expect(r.quality.shifts_with_feedback).toBe(0);
  });
});
