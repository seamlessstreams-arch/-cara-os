// ══════════════════════════════════════════════════════════════════════════════
// CARA — INCIDENT ANALYTICS SERVICE TESTS
// Pure-function tests for incident summary aggregation, trend detection,
// physical intervention analysis, pattern identification, and notifications.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "../incident-analytics-service";

const {
  computeIncidentSummary,
  computeIncidentTrend,
  computePIAnalysis,
  identifyHighFrequencyPatterns,
  computeNotificationRequirements,
  INCIDENT_CATEGORIES,
  DEBRIEF_REQUIREMENTS,
} = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Build a minimal incident record for summary tests. */
function incident(
  overrides: Partial<{
    id: string;
    category: string;
    severity: string;
    child_id: string;
    staff_involved: string[];
    created_at: string;
    physical_intervention_used: boolean;
  }> = {},
) {
  return {
    id: "inc-1",
    category: "violence",
    severity: "moderate",
    child_id: "child-1",
    staff_involved: ["staff-1"],
    created_at: "2026-04-10T14:00:00Z",
    physical_intervention_used: false,
      ...overrides,
  };
}

/** Build a minimal PI record for PI analysis tests. */
function piRecord(
  overrides: Partial<{
    id: string;
    child_id: string;
    staff_involved: string[];
    duration_minutes: number | null;
    technique_used: string | null;
    injury_reported: boolean;
    debrief_completed: boolean;
    created_at: string;
  }> = {},
) {
  return {
    id: "pi-1",
    child_id: "child-1",
    staff_involved: ["staff-1"],
    duration_minutes: ("duration_minutes" in overrides ? overrides.duration_minutes : 5) as number | null,
    technique_used: ("technique_used" in overrides ? overrides.technique_used : "guide_away") as string | null,
    injury_reported: false,
    debrief_completed: true,
    created_at: "2026-04-10T14:00:00Z",
      ...overrides,
  };
}

/** Build a minimal pattern record for high-frequency pattern tests. */
function patternRecord(
  overrides: Partial<{
    category: string;
    child_id: string;
    created_at: string;
  }> = {},
) {
  return {
    category: "violence",
    child_id: "child-1",
    created_at: "2026-04-10T14:00:00Z",
      ...overrides,
  };
}

/** Build a minimal notification record. */
function notifRecord(
  overrides: Partial<{
    id: string;
    category: string;
    notification_sent: boolean;
  }> = {},
) {
  return {
    id: "notif-1",
    category: "physical_intervention",
    notification_sent: false,
      ...overrides,
  };
}

const PERIOD_START = "2026-04-01T00:00:00Z";
const PERIOD_END = "2026-04-30T23:59:59Z";

// ── computeIncidentSummary ──────────────────────────────────────────────

describe("computeIncidentSummary", () => {
  it("returns zeroed summary for empty incidents", () => {
    const result = computeIncidentSummary([], PERIOD_START, PERIOD_END);
    expect(result.total).toBe(0);
    expect(result.by_category).toEqual({});
    expect(result.by_severity).toEqual({});
    expect(result.by_child).toEqual({});
    expect(result.by_staff_involved).toEqual({});
    expect(result.by_day_of_week).toEqual([0, 0, 0, 0, 0, 0, 0]);
    expect(result.by_hour).toEqual(Array(24).fill(0));
    expect(result.physical_interventions).toBe(0);
    expect(result.average_per_week).toBe(0);
    expect(result.period_start).toBe(PERIOD_START);
    expect(result.period_end).toBe(PERIOD_END);
  });

  it("aggregates a single incident correctly", () => {
    const inc = incident({
      category: "violence",
      severity: "major",
      child_id: "child-A",
      staff_involved: ["staff-X"],
      created_at: "2026-04-15T10:00:00Z",
      physical_intervention_used: true,
    });

    const result = computeIncidentSummary([inc], PERIOD_START, PERIOD_END);
    expect(result.total).toBe(1);
    expect(result.by_category).toEqual({ violence: 1 });
    expect(result.by_severity).toEqual({ major: 1 });
    expect(result.by_child).toEqual({ "child-A": 1 });
    expect(result.by_staff_involved).toEqual({ "staff-X": 1 });
    expect(result.physical_interventions).toBe(1);
  });

  it("aggregates multiple incidents across categories", () => {
    const incidents = [
      incident({ id: "i1", category: "violence", severity: "major" }),
      incident({ id: "i2", category: "violence", severity: "minor" }),
      incident({ id: "i3", category: "self_harm", severity: "critical" }),
      incident({ id: "i4", category: "absconding", severity: "moderate" }),
    ];

    const result = computeIncidentSummary(incidents, PERIOD_START, PERIOD_END);
    expect(result.total).toBe(4);
    expect(result.by_category).toEqual({ violence: 2, self_harm: 1, absconding: 1 });
  });

  it("aggregates by_severity correctly", () => {
    const incidents = [
      incident({ id: "i1", severity: "critical" }),
      incident({ id: "i2", severity: "critical" }),
      incident({ id: "i3", severity: "minor" }),
    ];

    const result = computeIncidentSummary(incidents, PERIOD_START, PERIOD_END);
    expect(result.by_severity).toEqual({ critical: 2, minor: 1 });
  });

  it("tracks by_day_of_week from created_at", () => {
    // 2026-04-13 is a Monday (getDay() = 1)
    const inc = incident({ created_at: "2026-04-13T10:00:00Z" });
    const result = computeIncidentSummary([inc], PERIOD_START, PERIOD_END);
    // 2026-04-13 is a Monday (index 1) — pinned literally so the expectation
    // can't inherit the runner's zone like the by_hour fixture did.
    expect(result.by_day_of_week[1]).toBe(1);
  });

  it("tracks by_hour from created_at, bucketed by the LONDON hour", () => {
    const inc = incident({ created_at: "2026-04-10T15:30:00Z" });
    const result = computeIncidentSummary([inc], PERIOD_START, PERIOD_END);
    // 15:30Z in April is 16:30 BST. The old expectation used getHours() —
    // the RUNNER's zone — so it passed on a London machine and failed on
    // UTC CI, which is exactly the bug the engine had.
    expect(result.by_hour[16]).toBe(1);
    expect(result.by_hour[15]).toBe(0);
  });

  it("counts physical_interventions from boolean flag", () => {
    const incidents = [
      incident({ id: "i1", physical_intervention_used: true }),
      incident({ id: "i2", physical_intervention_used: false }),
      incident({ id: "i3", physical_intervention_used: true }),
    ];

    const result = computeIncidentSummary(incidents, PERIOD_START, PERIOD_END);
    expect(result.physical_interventions).toBe(2);
  });

  it("computes average_per_week based on period span", () => {
    // 4 incidents over roughly 4.28 weeks (April 1–30)
    const incidents = [
      incident({ id: "i1" }),
      incident({ id: "i2" }),
      incident({ id: "i3" }),
      incident({ id: "i4" }),
    ];

    const result = computeIncidentSummary(incidents, PERIOD_START, PERIOD_END);
    expect(result.average_per_week).toBeGreaterThan(0);
    expect(result.average_per_week).toBeLessThan(4);
  });

  it("tallies staff_involved across multiple staff per incident", () => {
    const inc = incident({
      staff_involved: ["staff-A", "staff-B", "staff-C"],
    });
    const result = computeIncidentSummary([inc], PERIOD_START, PERIOD_END);
    expect(result.by_staff_involved).toEqual({
      "staff-A": 1,
      "staff-B": 1,
      "staff-C": 1,
    });
  });
});

// ── computeIncidentTrend ────────────────────────────────────────────────

describe("computeIncidentTrend", () => {
  function makeSummary(
    total: number,
    byCategory: Record<string, number> = {},
  ) {
    return {
      total,
      by_category: byCategory,
      by_severity: {},
      by_child: {},
      by_staff_involved: {},
      by_day_of_week: [0, 0, 0, 0, 0, 0, 0] as [number, number, number, number, number, number, number],
      by_hour: Array(24).fill(0) as [
        number, number, number, number, number, number,
        number, number, number, number, number, number,
        number, number, number, number, number, number,
        number, number, number, number, number, number,
      ],
      physical_interventions: 0,
      average_per_week: 0,
      period_start: PERIOD_START,
      period_end: PERIOD_END,
    };
  }

  it("reports increasing when percentage change >10%", () => {
    const prev = makeSummary(10);
    const curr = makeSummary(12);

    const result = computeIncidentTrend(curr, prev);
    expect(result.direction).toBe("increasing");
    expect(result.percentage_change).toBe(20);
  });

  it("reports decreasing when percentage change < -10%", () => {
    const prev = makeSummary(10);
    const curr = makeSummary(8);

    const result = computeIncidentTrend(curr, prev);
    expect(result.direction).toBe("decreasing");
    expect(result.percentage_change).toBe(-20);
  });

  it("reports stable when percentage change is within ±10%", () => {
    const prev = makeSummary(10);
    const curr = makeSummary(10);

    const result = computeIncidentTrend(curr, prev);
    expect(result.direction).toBe("stable");
    expect(result.percentage_change).toBe(0);
  });

  it("detects emerging_patterns for new categories (0 → >0)", () => {
    const prev = makeSummary(5, { violence: 5 });
    const curr = makeSummary(8, { violence: 5, self_harm: 3 });

    const result = computeIncidentTrend(curr, prev);
    expect(result.emerging_patterns).toContain("self_harm");
  });

  it("detects emerging_patterns for >50% increase in a category", () => {
    const prev = makeSummary(10, { violence: 4 });
    const curr = makeSummary(15, { violence: 7 });

    const result = computeIncidentTrend(curr, prev);
    // 75% increase: (7-4)/4 = 75%
    expect(result.emerging_patterns).toContain("violence");
  });

  it("computes category_changes with correct direction per category", () => {
    const prev = makeSummary(10, { violence: 5, absconding: 5 });
    const curr = makeSummary(10, { violence: 2, absconding: 8 });

    const result = computeIncidentTrend(curr, prev);
    const violenceChange = result.category_changes.find((c) => c.category === "violence");
    const abscondingChange = result.category_changes.find((c) => c.category === "absconding");

    expect(violenceChange?.direction).toBe("decreasing");
    expect(abscondingChange?.direction).toBe("increasing");
  });

  it("handles previous total of zero", () => {
    const prev = makeSummary(0);
    const curr = makeSummary(5);

    const result = computeIncidentTrend(curr, prev);
    expect(result.percentage_change).toBe(100);
    expect(result.direction).toBe("increasing");
  });

  it("handles both periods at zero", () => {
    const prev = makeSummary(0);
    const curr = makeSummary(0);

    const result = computeIncidentTrend(curr, prev);
    expect(result.percentage_change).toBe(0);
    expect(result.direction).toBe("stable");
  });
});

// ── computePIAnalysis ───────────────────────────────────────────────────

describe("computePIAnalysis", () => {
  it("returns zeroed analysis for empty incidents", () => {
    const result = computePIAnalysis([]);
    expect(result.total_pi).toBe(0);
    expect(result.unique_children).toBe(0);
    expect(result.unique_staff).toBe(0);
    expect(result.avg_duration_minutes).toBeNull();;
    expect(result.injury_rate).toBeNull();;
    expect(result.debrief_completion_rate).toBeNull();;
    expect(result.repeat_children).toEqual([]);
    expect(result.by_technique).toEqual({});
    expect(result.trend_direction).toBe("stable");
  });

  it("computes stats for a single PI", () => {
    const pi = piRecord({
      child_id: "child-A",
      staff_involved: ["staff-X", "staff-Y"],
      duration_minutes: 10,
      technique_used: "guide_away",
      injury_reported: false,
      debrief_completed: true,
    });

    const result = computePIAnalysis([pi]);
    expect(result.total_pi).toBe(1);
    expect(result.unique_children).toBe(1);
    expect(result.unique_staff).toBe(2);
    expect(result.avg_duration_minutes).toBe(10);
    expect(result.injury_rate).toBe(0);
    expect(result.debrief_completion_rate).toBe(100);
  });

  it("counts unique_children and unique_staff across multiple PIs", () => {
    const pis = [
      piRecord({ id: "pi-1", child_id: "child-A", staff_involved: ["staff-1", "staff-2"] }),
      piRecord({ id: "pi-2", child_id: "child-B", staff_involved: ["staff-2", "staff-3"] }),
      piRecord({ id: "pi-3", child_id: "child-A", staff_involved: ["staff-1"] }),
    ];

    const result = computePIAnalysis(pis);
    expect(result.unique_children).toBe(2);
    expect(result.unique_staff).toBe(3);
  });

  it("computes avg_duration correctly, ignoring nulls", () => {
    const pis = [
      piRecord({ id: "pi-1", duration_minutes: 10 }),
      piRecord({ id: "pi-2", duration_minutes: null }),
      piRecord({ id: "pi-3", duration_minutes: 20 }),
    ];

    const result = computePIAnalysis(pis);
    expect(result.avg_duration_minutes).toBe(15);
  });

  it("computes injury_rate as percentage", () => {
    const pis = [
      piRecord({ id: "pi-1", injury_reported: true }),
      piRecord({ id: "pi-2", injury_reported: false }),
      piRecord({ id: "pi-3", injury_reported: true }),
      piRecord({ id: "pi-4", injury_reported: false }),
    ];

    const result = computePIAnalysis(pis);
    expect(result.injury_rate).toBe(50);
  });

  it("computes debrief_completion_rate as percentage", () => {
    const pis = [
      piRecord({ id: "pi-1", debrief_completed: true }),
      piRecord({ id: "pi-2", debrief_completed: true }),
      piRecord({ id: "pi-3", debrief_completed: false }),
    ];

    const result = computePIAnalysis(pis);
    expect(result.debrief_completion_rate).toBeCloseTo(66.67, 1);
  });

  it("identifies repeat_children with count > 1, sorted descending", () => {
    const pis = [
      piRecord({ id: "pi-1", child_id: "child-A", created_at: "2026-04-01T10:00:00Z" }),
      piRecord({ id: "pi-2", child_id: "child-A", created_at: "2026-04-02T10:00:00Z" }),
      piRecord({ id: "pi-3", child_id: "child-A", created_at: "2026-04-03T10:00:00Z" }),
      piRecord({ id: "pi-4", child_id: "child-B", created_at: "2026-04-04T10:00:00Z" }),
      piRecord({ id: "pi-5", child_id: "child-B", created_at: "2026-04-05T10:00:00Z" }),
      piRecord({ id: "pi-6", child_id: "child-C", created_at: "2026-04-06T10:00:00Z" }),
    ];

    const result = computePIAnalysis(pis);
    expect(result.repeat_children).toEqual([
      { child_id: "child-A", count: 3 },
      { child_id: "child-B", count: 2 },
    ]);
  });

  it("aggregates by_technique", () => {
    const pis = [
      piRecord({ id: "pi-1", technique_used: "guide_away" }),
      piRecord({ id: "pi-2", technique_used: "guide_away" }),
      piRecord({ id: "pi-3", technique_used: "seated_hold" }),
      piRecord({ id: "pi-4", technique_used: null }),
    ];

    const result = computePIAnalysis(pis);
    expect(result.by_technique).toEqual({ guide_away: 2, seated_hold: 1 });
  });

  it("computes trend_direction as increasing when second half > first half by >10%", () => {
    // 5 records: first half = floor(5/2) = 2, second half = 3
    // change = (3-2)/2 * 100 = 50% => increasing
    const pis = [
      piRecord({ id: "pi-1", created_at: "2026-04-01T10:00:00Z" }),
      piRecord({ id: "pi-2", created_at: "2026-04-02T10:00:00Z" }),
      piRecord({ id: "pi-3", created_at: "2026-04-20T10:00:00Z" }),
      piRecord({ id: "pi-4", created_at: "2026-04-21T10:00:00Z" }),
      piRecord({ id: "pi-5", created_at: "2026-04-22T10:00:00Z" }),
    ];

    const result = computePIAnalysis(pis);
    expect(result.trend_direction).toBe("increasing");
  });

  it("reports stable trend when fewer than 4 incidents", () => {
    const pis = [
      piRecord({ id: "pi-1" }),
      piRecord({ id: "pi-2" }),
      piRecord({ id: "pi-3" }),
    ];

    const result = computePIAnalysis(pis);
    expect(result.trend_direction).toBe("stable");
  });
});

// ── identifyHighFrequencyPatterns ───────────────────────────────────────

describe("identifyHighFrequencyPatterns", () => {
  it("returns empty arrays when no incidents", () => {
    const result = identifyHighFrequencyPatterns([]);
    expect(result.high_frequency_children).toEqual([]);
    expect(result.high_frequency_categories).toEqual([]);
    expect(result.clustering).toEqual([]);
  });

  it("identifies high_frequency_children with 3+ incidents (default threshold)", () => {
    const records = [
      patternRecord({ child_id: "child-A", category: "violence" }),
      patternRecord({ child_id: "child-A", category: "self_harm" }),
      patternRecord({ child_id: "child-A", category: "violence" }),
      patternRecord({ child_id: "child-B", category: "violence" }),
      patternRecord({ child_id: "child-B", category: "violence" }),
    ];

    const result = identifyHighFrequencyPatterns(records);
    expect(result.high_frequency_children).toHaveLength(1);
    expect(result.high_frequency_children[0].child_id).toBe("child-A");
    expect(result.high_frequency_children[0].count).toBe(3);
    expect(result.high_frequency_children[0].categories).toContain("violence");
    expect(result.high_frequency_children[0].categories).toContain("self_harm");
  });

  it("identifies high_frequency_categories with 5+ incidents (default threshold)", () => {
    const records = Array.from({ length: 6 }, (_, i) =>
      patternRecord({ child_id: `child-${i}`, category: "violence" }),
    );
    // Add 3 of another category — below threshold
    records.push(
      patternRecord({ child_id: "child-X", category: "self_harm" }),
      patternRecord({ child_id: "child-Y", category: "self_harm" }),
      patternRecord({ child_id: "child-Z", category: "self_harm" }),
    );

    const result = identifyHighFrequencyPatterns(records);
    expect(result.high_frequency_categories).toHaveLength(1);
    expect(result.high_frequency_categories[0].category).toBe("violence");
    expect(result.high_frequency_categories[0].count).toBe(6);
  });

  it("detects temporal clustering of 3+ incidents within 48h window", () => {
    const records = [
      patternRecord({ child_id: "child-A", created_at: "2026-04-10T10:00:00Z" }),
      patternRecord({ child_id: "child-B", created_at: "2026-04-10T14:00:00Z" }),
      patternRecord({ child_id: "child-C", created_at: "2026-04-11T08:00:00Z" }),
    ];

    const result = identifyHighFrequencyPatterns(records);
    expect(result.clustering).toHaveLength(1);
    expect(result.clustering[0].count).toBe(3);
  });

  it("does not cluster incidents spread beyond the window", () => {
    const records = [
      patternRecord({ child_id: "child-A", created_at: "2026-04-01T10:00:00Z" }),
      patternRecord({ child_id: "child-B", created_at: "2026-04-05T10:00:00Z" }),
      patternRecord({ child_id: "child-C", created_at: "2026-04-10T10:00:00Z" }),
    ];

    const result = identifyHighFrequencyPatterns(records);
    expect(result.clustering).toEqual([]);
  });

  it("respects custom thresholds", () => {
    const records = [
      patternRecord({ child_id: "child-A" }),
      patternRecord({ child_id: "child-A" }),
    ];

    // Default threshold is 3, so child-A should not appear
    const defaultResult = identifyHighFrequencyPatterns(records);
    expect(defaultResult.high_frequency_children).toHaveLength(0);

    // Custom threshold of 2 should include child-A
    const customResult = identifyHighFrequencyPatterns(records, { childThreshold: 2 });
    expect(customResult.high_frequency_children).toHaveLength(1);
    expect(customResult.high_frequency_children[0].child_id).toBe("child-A");
  });
});

// ── computeNotificationRequirements ─────────────────────────────────────

describe("computeNotificationRequirements", () => {
  it("returns 100% compliance when all notifiable incidents are sent", () => {
    const records = [
      notifRecord({ id: "n1", category: "physical_intervention", notification_sent: true }),
      notifRecord({ id: "n2", category: "missing", notification_sent: true }),
      notifRecord({ id: "n3", category: "safeguarding", notification_sent: true }),
    ];

    const result = computeNotificationRequirements(records);
    expect(result.required).toBe(3);
    expect(result.sent).toBe(3);
    expect(result.outstanding).toBe(0);
    expect(result.compliance_percentage).toBe(100);
    expect(result.outstanding_incidents).toEqual([]);
  });

  it("returns 100% compliance when no notifiable incidents exist", () => {
    const records = [
      notifRecord({ id: "n1", category: "violence", notification_sent: false }),
      notifRecord({ id: "n2", category: "bullying", notification_sent: false }),
    ];

    const result = computeNotificationRequirements(records);
    expect(result.required).toBe(0);
    expect(result.sent).toBe(0);
    expect(result.outstanding).toBe(0);
    expect(result.compliance_percentage).toBe(100);
    expect(result.outstanding_incidents).toEqual([]);
  });

  it("tracks outstanding when none are sent", () => {
    const records = [
      notifRecord({ id: "n1", category: "physical_intervention", notification_sent: false }),
      notifRecord({ id: "n2", category: "medication_error", notification_sent: false }),
    ];

    const result = computeNotificationRequirements(records);
    expect(result.required).toBe(2);
    expect(result.sent).toBe(0);
    expect(result.outstanding).toBe(2);
    expect(result.compliance_percentage).toBe(0);
    expect(result.outstanding_incidents).toHaveLength(2);
  });

  it("handles mixed sent/unsent with correct compliance percentage", () => {
    const records = [
      notifRecord({ id: "n1", category: "physical_intervention", notification_sent: true }),
      notifRecord({ id: "n2", category: "missing", notification_sent: false }),
      notifRecord({ id: "n3", category: "safeguarding", notification_sent: true }),
      notifRecord({ id: "n4", category: "medication_error", notification_sent: false }),
    ];

    const result = computeNotificationRequirements(records);
    expect(result.required).toBe(4);
    expect(result.sent).toBe(2);
    expect(result.outstanding).toBe(2);
    expect(result.compliance_percentage).toBe(50);
  });

  it("lists outstanding_incidents with id and category", () => {
    const records = [
      notifRecord({ id: "n1", category: "physical_intervention", notification_sent: true }),
      notifRecord({ id: "n2", category: "safeguarding", notification_sent: false }),
      notifRecord({ id: "n3", category: "missing", notification_sent: false }),
    ];

    const result = computeNotificationRequirements(records);
    expect(result.outstanding_incidents).toEqual([
      { id: "n2", category: "safeguarding" },
      { id: "n3", category: "missing" },
    ]);
  });

  it("ignores non-notifiable categories entirely", () => {
    const records = [
      notifRecord({ id: "n1", category: "near_miss", notification_sent: false }),
      notifRecord({ id: "n2", category: "other", notification_sent: false }),
      notifRecord({ id: "n3", category: "property_damage", notification_sent: false }),
    ];

    const result = computeNotificationRequirements(records);
    expect(result.required).toBe(0);
    expect(result.compliance_percentage).toBe(100);
  });
});

// ── INCIDENT_CATEGORIES constant ────────────────────────────────────────

describe("INCIDENT_CATEGORIES", () => {
  it("contains exactly 15 entries", () => {
    expect(INCIDENT_CATEGORIES).toHaveLength(15);
  });

  it("marks physical_intervention as requiresNotification", () => {
    const pi = INCIDENT_CATEGORIES.find((c) => c.category === "physical_intervention");
    expect(pi?.requiresNotification).toBe(true);
  });

  it("marks missing as requiresNotification", () => {
    const missing = INCIDENT_CATEGORIES.find((c) => c.category === "missing");
    expect(missing?.requiresNotification).toBe(true);
  });

  it("marks medication_error as requiresNotification", () => {
    const med = INCIDENT_CATEGORIES.find((c) => c.category === "medication_error");
    expect(med?.requiresNotification).toBe(true);
  });

  it("marks safeguarding as requiresNotification", () => {
    const sg = INCIDENT_CATEGORIES.find((c) => c.category === "safeguarding");
    expect(sg?.requiresNotification).toBe(true);
  });

  it("does not mark violence as requiresNotification", () => {
    const v = INCIDENT_CATEGORIES.find((c) => c.category === "violence");
    expect(v?.requiresNotification).toBe(false);
  });

  it("does not mark near_miss as requiresNotification", () => {
    const nm = INCIDENT_CATEGORIES.find((c) => c.category === "near_miss");
    expect(nm?.requiresNotification).toBe(false);
  });

  it("has exactly 4 categories requiring notification", () => {
    const notifiable = INCIDENT_CATEGORIES.filter((c) => c.requiresNotification);
    expect(notifiable).toHaveLength(4);
  });
});

// ── DEBRIEF_REQUIREMENTS constant ───────────────────────────────────────

describe("DEBRIEF_REQUIREMENTS", () => {
  it("requires debrief for physical_intervention within 24h", () => {
    expect(DEBRIEF_REQUIREMENTS.physical_intervention.required).toBe(true);
    expect(DEBRIEF_REQUIREMENTS.physical_intervention.timeframeHours).toBe(24);
  });

  it("requires debrief for violence within 24h", () => {
    expect(DEBRIEF_REQUIREMENTS.violence.required).toBe(true);
    expect(DEBRIEF_REQUIREMENTS.violence.timeframeHours).toBe(24);
  });

  it("requires debrief for self_harm within 24h", () => {
    expect(DEBRIEF_REQUIREMENTS.self_harm.required).toBe(true);
    expect(DEBRIEF_REQUIREMENTS.self_harm.timeframeHours).toBe(24);
  });

  it("requires debrief for absconding within 24h", () => {
    expect(DEBRIEF_REQUIREMENTS.absconding.required).toBe(true);
    expect(DEBRIEF_REQUIREMENTS.absconding.timeframeHours).toBe(24);
  });

  it("requires debrief for missing within 24h", () => {
    expect(DEBRIEF_REQUIREMENTS.missing.required).toBe(true);
    expect(DEBRIEF_REQUIREMENTS.missing.timeframeHours).toBe(24);
  });

  it("requires debrief for medication_error within 48h", () => {
    expect(DEBRIEF_REQUIREMENTS.medication_error.required).toBe(true);
    expect(DEBRIEF_REQUIREMENTS.medication_error.timeframeHours).toBe(48);
  });

  it("does not require debrief for property_damage", () => {
    expect(DEBRIEF_REQUIREMENTS.property_damage.required).toBe(false);
    expect(DEBRIEF_REQUIREMENTS.property_damage.timeframeHours).toBe(0);
  });

  it("does not require debrief for near_miss", () => {
    expect(DEBRIEF_REQUIREMENTS.near_miss.required).toBe(false);
    expect(DEBRIEF_REQUIREMENTS.near_miss.timeframeHours).toBe(0);
  });

  it("does not require debrief for other", () => {
    expect(DEBRIEF_REQUIREMENTS.other.required).toBe(false);
    expect(DEBRIEF_REQUIREMENTS.other.timeframeHours).toBe(0);
  });

  it("has exactly 6 categories requiring debrief", () => {
    const requiringDebrief = Object.values(DEBRIEF_REQUIREMENTS).filter((d) => d.required);
    expect(requiringDebrief).toHaveLength(6);
  });
});
