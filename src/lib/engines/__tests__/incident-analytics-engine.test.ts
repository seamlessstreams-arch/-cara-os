// ══════════════════════════════════════════════════════════════════════════════
// CARA — INCIDENT ANALYTICS ENGINE TESTS
// Comprehensive test suite: unit + integration
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeIncidentAnalytics,
  daysBetween,
  extractHour,
  getTimeBlock,
  getDayOfWeek,
  categoryLabel,
  type IncidentAnalyticsInput,
  type IncidentInput,
  type ChildRef,
} from "../incident-analytics-engine";

// ── Factories ───────────────────────────────────────────────────────────────

const TODAY = "2026-05-24";

function makeIncident(overrides: Partial<IncidentInput> = {}): IncidentInput {
  return {
    id: "inc_1",
    child_id: "child_1",
    date: "2026-05-15",
    time: "14:30",
    type: "behaviour_incident",
    severity: "medium",
    status: "closed",
    requires_oversight: false,
    oversight_by: null,
    ...overrides,
  };
}

function makeInput(overrides: Partial<IncidentAnalyticsInput> = {}): IncidentAnalyticsInput {
  return {
    incidents: [],
    children: [
      { id: "child_1", name: "Alex" },
      { id: "child_2", name: "Jordan" },
      { id: "child_3", name: "Casey" },
    ],
    today: TODAY,
    ...overrides,
  };
}

// ── Unit Tests: daysBetween ─────────────────────────────────────────────────

describe("daysBetween", () => {
  it("returns 0 for same day", () => {
    expect(daysBetween("2026-05-24", "2026-05-24")).toBe(0);
  });

  it("returns 30 for month span", () => {
    expect(daysBetween("2026-04-24", "2026-05-24")).toBe(30);
  });
});

// ── Unit Tests: extractHour ─────────────────────────────────────────────────

describe("extractHour", () => {
  it("extracts hour from HH:MM format", () => {
    expect(extractHour("14:30")).toBe(14);
    expect(extractHour("08:15")).toBe(8);
    expect(extractHour("22:00")).toBe(22);
  });

  it("extracts hour from HH:MM:SS format", () => {
    expect(extractHour("09:15:00")).toBe(9);
  });

  it("defaults to 12 for unparseable", () => {
    expect(extractHour("invalid")).toBe(12);
  });
});

// ── Unit Tests: getTimeBlock ────────────────────────────────────────────────

describe("getTimeBlock", () => {
  it("maps 6-8 to Early Morning", () => {
    expect(getTimeBlock(6)).toBe("Early Morning");
    expect(getTimeBlock(8)).toBe("Early Morning");
  });

  it("maps 9-11 to Morning", () => {
    expect(getTimeBlock(9)).toBe("Morning");
    expect(getTimeBlock(11)).toBe("Morning");
  });

  it("maps 12-13 to Lunchtime", () => {
    expect(getTimeBlock(12)).toBe("Lunchtime");
    expect(getTimeBlock(13)).toBe("Lunchtime");
  });

  it("maps 14-16 to Afternoon", () => {
    expect(getTimeBlock(14)).toBe("Afternoon");
    expect(getTimeBlock(16)).toBe("Afternoon");
  });

  it("maps 17-19 to Evening", () => {
    expect(getTimeBlock(17)).toBe("Evening");
    expect(getTimeBlock(19)).toBe("Evening");
  });

  it("maps 20-22 to Late Evening", () => {
    expect(getTimeBlock(20)).toBe("Late Evening");
    expect(getTimeBlock(22)).toBe("Late Evening");
  });

  it("maps 23-5 to Night", () => {
    expect(getTimeBlock(23)).toBe("Night");
    expect(getTimeBlock(0)).toBe("Night");
    expect(getTimeBlock(5)).toBe("Night");
  });
});

// ── Unit Tests: getDayOfWeek ────────────────────────────────────────────────

describe("getDayOfWeek", () => {
  it("returns correct day", () => {
    // 2026-05-24 is a Sunday
    expect(getDayOfWeek("2026-05-24")).toBe("Sunday");
    expect(getDayOfWeek("2026-05-25")).toBe("Monday");
    expect(getDayOfWeek("2026-05-23")).toBe("Saturday");
  });
});

// ── Unit Tests: categoryLabel ───────────────────────────────────────────────

describe("categoryLabel", () => {
  it("returns human labels for known types", () => {
    expect(categoryLabel("physical_intervention")).toBe("Physical Intervention");
    expect(categoryLabel("missing_from_care")).toBe("Missing from Care");
    expect(categoryLabel("self_harm")).toBe("Self-Harm");
  });

  it("auto-formats unknown types", () => {
    expect(categoryLabel("something_else")).toBe("Something Else");
  });
});

// ── Integration: Empty Input ────────────────────────────────────────────────

describe("computeIncidentAnalytics — empty input", () => {
  const result = computeIncidentAnalytics(makeInput());

  it("returns zero totals", () => {
    expect(result.summary.total_30d).toBe(0);
    expect(result.summary.total_90d).toBe(0);
    expect(result.summary.average_per_week_30d).toBe(0);
  });

  it("returns stable trend", () => {
    expect(result.summary.trend_direction).toBe("stable");
  });

  it("returns zero severity counts", () => {
    expect(result.severity.critical).toBe(0);
    expect(result.severity.high).toBe(0);
    expect(result.severity.medium).toBe(0);
    expect(result.severity.low).toBe(0);
  });

  it("reports oversight compliance as unmeasured, not 100%, when no incident required oversight", () => {
    // Zero incidents is not perfect oversight — there is nothing to have overseen.
    expect(result.oversight.compliance_rate).toBeNull();
  });

  it("generates positive insights", () => {
    expect(result.insights.some((i) => i.severity === "positive")).toBe(true);
  });
});

// ── Integration: Period Summary ─────────────────────────────────────────────

describe("computeIncidentAnalytics — period summary", () => {
  it("computes correct 30d and 90d totals", () => {
    const incidents = [
      makeIncident({ id: "1", date: "2026-05-20" }), // within 30d
      makeIncident({ id: "2", date: "2026-05-10" }), // within 30d
      makeIncident({ id: "3", date: "2026-04-01" }), // 30-90d
      makeIncident({ id: "4", date: "2026-03-01" }), // 30-90d
      makeIncident({ id: "5", date: "2026-01-01" }), // outside 90d
    ];
    const result = computeIncidentAnalytics(makeInput({ incidents }));
    expect(result.summary.total_30d).toBe(2);
    expect(result.summary.total_90d).toBe(4);
  });

  it("computes average per week", () => {
    const incidents = [
      makeIncident({ id: "1", date: "2026-05-20" }),
      makeIncident({ id: "2", date: "2026-05-15" }),
      makeIncident({ id: "3", date: "2026-05-10" }),
      makeIncident({ id: "4", date: "2026-05-01" }),
    ];
    const result = computeIncidentAnalytics(makeInput({ incidents }));
    // 4 incidents / (30/7) weeks ≈ 0.9
    expect(result.summary.average_per_week_30d).toBeCloseTo(0.9, 0);
  });

  it("detects increasing trend", () => {
    // 4 in recent 30 days, 1 in prior 30 days
    const incidents = [
      makeIncident({ id: "1", date: "2026-05-20" }),
      makeIncident({ id: "2", date: "2026-05-15" }),
      makeIncident({ id: "3", date: "2026-05-10" }),
      makeIncident({ id: "4", date: "2026-05-01" }),
      makeIncident({ id: "5", date: "2026-04-10" }), // older period
    ];
    const result = computeIncidentAnalytics(makeInput({ incidents }));
    expect(result.summary.trend_direction).toBe("increasing");
    expect(result.summary.percentage_change).toBeGreaterThan(0);
  });

  it("detects decreasing trend", () => {
    // 1 in recent 30 days, 4 in prior 30 days
    const incidents = [
      makeIncident({ id: "1", date: "2026-05-15" }),
      makeIncident({ id: "2", date: "2026-04-20" }),
      makeIncident({ id: "3", date: "2026-04-15" }),
      makeIncident({ id: "4", date: "2026-04-10" }),
      makeIncident({ id: "5", date: "2026-04-05" }),
    ];
    const result = computeIncidentAnalytics(makeInput({ incidents }));
    expect(result.summary.trend_direction).toBe("decreasing");
    expect(result.summary.percentage_change).toBeLessThan(0);
  });
});

// ── Integration: Severity Breakdown ─────────────────────────────────────────

describe("computeIncidentAnalytics — severity breakdown", () => {
  const incidents = [
    makeIncident({ id: "1", date: "2026-05-20", severity: "critical" }),
    makeIncident({ id: "2", date: "2026-05-15", severity: "high" }),
    makeIncident({ id: "3", date: "2026-05-10", severity: "high" }),
    makeIncident({ id: "4", date: "2026-04-10", severity: "medium" }),
    makeIncident({ id: "5", date: "2026-04-05", severity: "medium" }),
    makeIncident({ id: "6", date: "2026-03-15", severity: "medium" }),
    makeIncident({ id: "7", date: "2026-03-10", severity: "low" }),
  ];
  const result = computeIncidentAnalytics(makeInput({ incidents }));

  it("counts each severity correctly", () => {
    expect(result.severity.critical).toBe(1);
    expect(result.severity.high).toBe(2);
    expect(result.severity.medium).toBe(3);
    expect(result.severity.low).toBe(1);
  });
});

// ── Integration: Category Breakdown ─────────────────────────────────────────

describe("computeIncidentAnalytics — categories", () => {
  const incidents = [
    makeIncident({ id: "1", date: "2026-05-20", type: "physical_intervention" }),
    makeIncident({ id: "2", date: "2026-05-15", type: "physical_intervention" }),
    makeIncident({ id: "3", date: "2026-05-10", type: "physical_intervention" }),
    makeIncident({ id: "4", date: "2026-04-20", type: "missing_from_care" }),
    makeIncident({ id: "5", date: "2026-04-15", type: "missing_from_care" }),
    makeIncident({ id: "6", date: "2026-03-20", type: "complaint" }),
  ];
  const result = computeIncidentAnalytics(makeInput({ incidents }));

  it("sorts categories by count descending", () => {
    expect(result.categories[0].category).toBe("physical_intervention");
    expect(result.categories[0].count).toBe(3);
    expect(result.categories[1].category).toBe("missing_from_care");
    expect(result.categories[1].count).toBe(2);
    expect(result.categories[2].category).toBe("complaint");
    expect(result.categories[2].count).toBe(1);
  });

  it("provides human-readable labels", () => {
    expect(result.categories[0].label).toBe("Physical Intervention");
    expect(result.categories[1].label).toBe("Missing from Care");
  });
});

// ── Integration: Time Patterns ──────────────────────────────────────────────

describe("computeIncidentAnalytics — time patterns", () => {
  const incidents = [
    makeIncident({ id: "1", date: "2026-05-20", time: "21:15" }),
    makeIncident({ id: "2", date: "2026-05-15", time: "22:40" }),
    makeIncident({ id: "3", date: "2026-05-10", time: "14:30" }),
    makeIncident({ id: "4", date: "2026-04-20", time: "08:15" }),
    makeIncident({ id: "5", date: "2026-04-10", time: "19:10" }),
  ];
  const result = computeIncidentAnalytics(makeInput({ incidents }));

  it("returns all 7 time blocks", () => {
    expect(result.time_patterns.length).toBe(7);
  });

  it("counts incidents in correct blocks", () => {
    const lateEvening = result.time_patterns.find((t) => t.block === "Late Evening");
    expect(lateEvening!.count).toBe(2); // 21:15 and 22:40
    const afternoon = result.time_patterns.find((t) => t.block === "Afternoon");
    expect(afternoon!.count).toBe(1); // 14:30
    const earlyMorning = result.time_patterns.find((t) => t.block === "Early Morning");
    expect(earlyMorning!.count).toBe(1); // 08:15
    const evening = result.time_patterns.find((t) => t.block === "Evening");
    expect(evening!.count).toBe(1); // 19:10
  });
});

// ── Integration: Day Patterns ───────────────────────────────────────────────

describe("computeIncidentAnalytics — day patterns", () => {
  const incidents = [
    makeIncident({ id: "1", date: "2026-05-18" }), // Monday
    makeIncident({ id: "2", date: "2026-05-19" }), // Tuesday
    makeIncident({ id: "3", date: "2026-05-20" }), // Wednesday
    makeIncident({ id: "4", date: "2026-05-21" }), // Thursday
    makeIncident({ id: "5", date: "2026-05-22" }), // Friday (originally Thursday)
  ];
  const result = computeIncidentAnalytics(makeInput({ incidents }));

  it("returns all 7 days", () => {
    expect(result.day_patterns.length).toBe(7);
  });

  it("counts incidents per day correctly", () => {
    const monday = result.day_patterns.find((d) => d.day === "Monday");
    expect(monday!.count).toBe(1);
  });
});

// ── Integration: Child Profiles ─────────────────────────────────────────────

describe("computeIncidentAnalytics — child profiles", () => {
  const incidents = [
    makeIncident({ id: "1", date: "2026-05-20", child_id: "child_1", type: "physical_intervention", severity: "critical" }),
    makeIncident({ id: "2", date: "2026-05-15", child_id: "child_1", type: "physical_intervention", severity: "high" }),
    makeIncident({ id: "3", date: "2026-04-10", child_id: "child_1", type: "missing_from_care", severity: "high" }),
    makeIncident({ id: "4", date: "2026-05-14", child_id: "child_2", type: "complaint", severity: "medium" }),
  ];
  const result = computeIncidentAnalytics(makeInput({ incidents }));

  it("creates profiles per child involved", () => {
    expect(result.child_profiles.length).toBe(2);
  });

  it("sorts by 90d count descending", () => {
    expect(result.child_profiles[0].child_id).toBe("child_1");
    expect(result.child_profiles[0].count_90d).toBe(3);
    expect(result.child_profiles[1].child_id).toBe("child_2");
    expect(result.child_profiles[1].count_90d).toBe(1);
  });

  it("identifies top type per child", () => {
    expect(result.child_profiles[0].top_type).toBe("Physical Intervention");
  });

  it("identifies highest severity per child", () => {
    expect(result.child_profiles[0].highest_severity).toBe("critical");
    expect(result.child_profiles[1].highest_severity).toBe("medium");
  });

  it("computes 30d count per child", () => {
    expect(result.child_profiles[0].count_30d).toBe(2); // Only May 20 and 15 are within 30d
  });
});

// ── Integration: Oversight Compliance ───────────────────────────────────────

describe("computeIncidentAnalytics — oversight compliance", () => {
  const incidents = [
    makeIncident({ id: "1", requires_oversight: true, oversight_by: "staff_1" }),
    makeIncident({ id: "2", requires_oversight: true, oversight_by: "staff_1" }),
    makeIncident({ id: "3", requires_oversight: true, oversight_by: null }),
    makeIncident({ id: "4", requires_oversight: false }),
  ];
  const result = computeIncidentAnalytics(makeInput({ incidents }));

  it("counts total requiring oversight", () => {
    expect(result.oversight.total_requiring_oversight).toBe(3);
  });

  it("counts completed oversight", () => {
    expect(result.oversight.oversight_completed).toBe(2);
  });

  it("counts pending oversight", () => {
    expect(result.oversight.oversight_pending).toBe(1);
  });

  it("computes compliance rate", () => {
    // 2/3 = 67%
    expect(result.oversight.compliance_rate).toBe(67);
  });
});

// ── Integration: Insights ───────────────────────────────────────────────────

describe("computeIncidentAnalytics — insights", () => {
  it("generates critical insight for critical-severity incidents", () => {
    const result = computeIncidentAnalytics(makeInput({
      incidents: [makeIncident({ id: "1", date: "2026-05-20", severity: "critical" })],
    }));
    const critInsight = result.insights.find((i) =>
      i.severity === "critical" && i.text.includes("critical-severity")
    );
    expect(critInsight).toBeDefined();
  });

  it("generates oversight critical insight", () => {
    const result = computeIncidentAnalytics(makeInput({
      incidents: [makeIncident({ id: "1", requires_oversight: true, oversight_by: null })],
    }));
    const oversightInsight = result.insights.find((i) =>
      i.severity === "critical" && i.text.includes("oversight")
    );
    expect(oversightInsight).toBeDefined();
  });

  it("generates repeat-child warning", () => {
    const result = computeIncidentAnalytics(makeInput({
      incidents: [
        makeIncident({ id: "1", date: "2026-05-20", child_id: "child_1" }),
        makeIncident({ id: "2", date: "2026-05-15", child_id: "child_1" }),
        makeIncident({ id: "3", date: "2026-04-10", child_id: "child_1" }),
      ],
    }));
    const repeatInsight = result.insights.find((i) =>
      i.text.includes("3+ incidents")
    );
    expect(repeatInsight).toBeDefined();
    expect(repeatInsight!.severity).toBe("warning");
    expect(repeatInsight!.text).toContain("Alex");
  });

  it("generates zero-incidents positive insight", () => {
    const result = computeIncidentAnalytics(makeInput({ incidents: [] }));
    const zeroInsight = result.insights.find((i) =>
      i.text.includes("Zero incidents")
    );
    expect(zeroInsight).toBeDefined();
    expect(zeroInsight!.severity).toBe("positive");
  });

  it("generates low-severity positive insight", () => {
    const result = computeIncidentAnalytics(makeInput({
      incidents: [
        makeIncident({ id: "1", date: "2026-05-20", severity: "medium" }),
        makeIncident({ id: "2", date: "2026-05-15", severity: "low" }),
      ],
    }));
    const lowSevInsight = result.insights.find((i) =>
      i.text.includes("No critical or high-severity")
    );
    expect(lowSevInsight).toBeDefined();
    expect(lowSevInsight!.severity).toBe("positive");
  });

  it("generates full oversight compliance positive insight", () => {
    const result = computeIncidentAnalytics(makeInput({
      incidents: [
        makeIncident({ id: "1", requires_oversight: true, oversight_by: "staff_1" }),
        makeIncident({ id: "2", requires_oversight: true, oversight_by: "staff_2" }),
      ],
    }));
    const complianceInsight = result.insights.find((i) =>
      i.text.includes("Reg 45 monitoring compliance")
    );
    expect(complianceInsight).toBeDefined();
    expect(complianceInsight!.severity).toBe("positive");
  });

  it("ensures at least one insight always generated", () => {
    const result = computeIncidentAnalytics(makeInput());
    expect(result.insights.length).toBeGreaterThan(0);
  });
});

// ── Integration: Full Chamberlain House Scenario ────────────────────────────────────

describe("computeIncidentAnalytics — Chamberlain House integration", () => {
  const children: ChildRef[] = [
    { id: "yp_alex", name: "Alex" },
    { id: "yp_jordan", name: "Jordan" },
    { id: "yp_casey", name: "Casey" },
  ];

  const incidents: IncidentInput[] = [
    makeIncident({ id: "inc_001", child_id: "yp_alex", date: "2026-05-22", time: "22:40", type: "missing_from_care", severity: "high", status: "open", requires_oversight: true }),
    makeIncident({ id: "inc_002", child_id: "yp_casey", date: "2026-05-21", time: "08:15", type: "medication_error", severity: "medium", status: "closed", requires_oversight: true, oversight_by: "staff_darren" }),
    makeIncident({ id: "inc_003", child_id: "yp_jordan", date: "2026-05-23", time: "14:30", type: "complaint", severity: "medium", status: "open", requires_oversight: true }),
    makeIncident({ id: "inc_004", child_id: "yp_alex", date: "2026-05-23", time: "19:10", type: "safeguarding_concern", severity: "critical", status: "open", requires_oversight: true }),
    makeIncident({ id: "inc_005", child_id: "yp_alex", date: "2026-04-19", time: "21:15", type: "physical_intervention", severity: "high", status: "closed", requires_oversight: true, oversight_by: "staff_darren" }),
    makeIncident({ id: "inc_006", child_id: "yp_alex", date: "2026-05-02", time: "14:50", type: "physical_intervention", severity: "high", status: "open", requires_oversight: true }),
    makeIncident({ id: "inc_007", child_id: "yp_alex", date: "2026-05-14", time: "18:30", type: "physical_intervention", severity: "critical", status: "open", requires_oversight: true }),
  ];

  const result = computeIncidentAnalytics(makeInput({ incidents, children }));

  it("computes correct totals", () => {
    expect(result.summary.total_90d).toBe(7);
  });

  it("computes severity breakdown", () => {
    expect(result.severity.critical).toBe(2);
    expect(result.severity.high).toBe(3);
    expect(result.severity.medium).toBe(2);
  });

  it("top category is physical_intervention", () => {
    expect(result.categories[0].category).toBe("physical_intervention");
    expect(result.categories[0].count).toBe(3);
  });

  it("Alex has most incidents", () => {
    expect(result.child_profiles[0].child_name).toBe("Alex");
    expect(result.child_profiles[0].count_90d).toBe(5);
  });

  it("detects Alex as repeat child", () => {
    const repeatInsight = result.insights.find((i) =>
      i.text.includes("Alex")
    );
    expect(repeatInsight).toBeDefined();
  });

  it("flags critical-severity incidents", () => {
    const critInsight = result.insights.find((i) =>
      i.severity === "critical" && i.text.includes("critical-severity")
    );
    expect(critInsight).toBeDefined();
  });

  it("detects oversight pending", () => {
    // inc_001, inc_003, inc_004, inc_006, inc_007 have no oversight_by
    expect(result.oversight.oversight_pending).toBe(5);
  });

  it("detects late evening time pattern", () => {
    const lateEvening = result.time_patterns.find((t) => t.block === "Late Evening");
    expect(lateEvening!.count).toBeGreaterThanOrEqual(2);
  });
});
