// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CHRONOLOGY INTELLIGENCE ENGINE — TEST SUITE
// Reg 36 — case records, event patterns, recording gaps, category coverage,
// timeline analysis, and ARIA chronology insights.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeChronologyIntelligence,
  daysBetween,
  daysUntil,
  average,
  type ChildInput,
  type ChronologyEventInput,
  type EventCategory,
  type EventSignificance,
} from "../chronology-intelligence-engine";

// ── Constants ─────────────────────────────────────────────────────────────────

const TODAY = "2026-05-25";

// ── Factory Functions ─────────────────────────────────────────────────────────

function makeChild(overrides: Partial<ChildInput> = {}): ChildInput {
  return {
    id: "child_1",
    name: "Alex W",
    placement_start_date: "2025-09-01",
    ...overrides,
  };
}

function makeEvent(overrides: Partial<ChronologyEventInput> = {}): ChronologyEventInput {
  return {
    id: "evt_001",
    child_id: "child_1",
    date: "2026-05-20",
    category: "placement",
    title: "Placement commenced",
    significance: "significant",
    has_linked_incident: false,
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════

describe("Chronology Engine — Helpers", () => {
  describe("daysBetween", () => {
    it("returns 0 for same date", () => {
      expect(daysBetween("2026-05-01", "2026-05-01")).toBe(0);
    });

    it("returns correct days", () => {
      expect(daysBetween("2026-05-01", "2026-05-15")).toBe(14);
    });

    it("returns absolute value", () => {
      expect(daysBetween("2026-05-15", "2026-05-01")).toBe(14);
    });
  });

  describe("daysUntil", () => {
    it("returns positive for future", () => {
      expect(daysUntil("2026-05-25", "2026-06-04")).toBe(10);
    });

    it("returns negative for past", () => {
      expect(daysUntil("2026-05-25", "2026-05-15")).toBe(-10);
    });
  });

  describe("average", () => {
    it("returns 0 for empty", () => {
      expect(average([])).toBe(0);
    });

    it("computes correctly", () => {
      expect(average([3, 6, 9])).toBe(6);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// EMPTY STATE
// ══════════════════════════════════════════════════════════════════════════════

describe("Chronology Engine — Empty State", () => {
  it("handles no children and no events", () => {
    const result = computeChronologyIntelligence({
      children: [],
      events: [],
      today: TODAY,
    });

    expect(result.overview.total_events).toBe(0);
    expect(result.overview.children_with_chronology).toBe(0);
    expect(result.child_profiles).toHaveLength(0);
    expect(result.category_breakdown).toHaveLength(0);
    expect(result.timeline).toHaveLength(0);
    expect(result.alerts).toHaveLength(0);
    expect(result.insights).toHaveLength(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// OVERVIEW COMPUTATION
// ══════════════════════════════════════════════════════════════════════════════

describe("Chronology Engine — Overview", () => {
  it("counts events correctly", () => {
    const result = computeChronologyIntelligence({
      children: [makeChild()],
      events: [
        makeEvent({ id: "e1", date: "2026-05-20" }),
        makeEvent({ id: "e2", date: "2026-05-10" }),
        makeEvent({ id: "e3", date: "2026-04-01" }),
        makeEvent({ id: "e4", date: "2026-01-15" }),
      ],
      today: TODAY,
    });

    expect(result.overview.total_events).toBe(4);
    expect(result.overview.events_30d).toBe(2); // May 20 and May 10 within 30 days
    expect(result.overview.events_90d).toBe(3); // not Jan 15
  });

  it("counts significance levels", () => {
    const result = computeChronologyIntelligence({
      children: [makeChild()],
      events: [
        makeEvent({ id: "e1", significance: "critical" }),
        makeEvent({ id: "e2", significance: "critical" }),
        makeEvent({ id: "e3", significance: "significant" }),
        makeEvent({ id: "e4", significance: "routine" }),
      ],
      today: TODAY,
    });

    expect(result.overview.critical_events_total).toBe(2);
    expect(result.overview.significant_events_total).toBe(1);
  });

  it("computes category coverage", () => {
    const result = computeChronologyIntelligence({
      children: [makeChild()],
      events: [
        makeEvent({ id: "e1", category: "placement" }),
        makeEvent({ id: "e2", category: "education" }),
        makeEvent({ id: "e3", category: "health" }),
        makeEvent({ id: "e4", category: "health" }),
      ],
      today: TODAY,
    });

    expect(result.overview.category_coverage).toBe(3);
  });

  it("computes average events per child", () => {
    const result = computeChronologyIntelligence({
      children: [
        makeChild({ id: "c1" }),
        makeChild({ id: "c2" }),
      ],
      events: [
        makeEvent({ id: "e1", child_id: "c1" }),
        makeEvent({ id: "e2", child_id: "c1" }),
        makeEvent({ id: "e3", child_id: "c1" }),
        makeEvent({ id: "e4", child_id: "c2" }),
      ],
      today: TODAY,
    });

    expect(result.overview.avg_events_per_child).toBe(2); // 4/2
  });

  it("computes recording frequency for 30 days", () => {
    const result = computeChronologyIntelligence({
      children: [
        makeChild({ id: "c1" }),
        makeChild({ id: "c2" }),
      ],
      events: [
        makeEvent({ id: "e1", child_id: "c1", date: "2026-05-20" }),
        makeEvent({ id: "e2", child_id: "c1", date: "2026-05-15" }),
        makeEvent({ id: "e3", child_id: "c2", date: "2026-05-18" }),
        makeEvent({ id: "e4", child_id: "c2", date: "2026-05-10" }),
        makeEvent({ id: "e5", child_id: "c1", date: "2026-03-01" }), // outside 30d
      ],
      today: TODAY,
    });

    // 4 events in 30d / 2 children = 2.0
    expect(result.overview.recording_frequency_30d).toBe(2);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// CHILD PROFILES
// ══════════════════════════════════════════════════════════════════════════════

describe("Chronology Engine — Child Profiles", () => {
  it("creates profiles for each child", () => {
    const result = computeChronologyIntelligence({
      children: [
        makeChild({ id: "c1", name: "Alex W" }),
        makeChild({ id: "c2", name: "Jordan K" }),
      ],
      events: [
        makeEvent({ id: "e1", child_id: "c1", category: "placement" }),
        makeEvent({ id: "e2", child_id: "c1", category: "education" }),
        makeEvent({ id: "e3", child_id: "c2", category: "health" }),
      ],
      today: TODAY,
    });

    expect(result.child_profiles).toHaveLength(2);
    const alex = result.child_profiles.find((p) => p.child_id === "c1")!;
    expect(alex.total_events).toBe(2);
    expect(alex.categories_covered).toContain("placement");
    expect(alex.categories_covered).toContain("education");
  });

  it("detects recording gaps (> 14 days)", () => {
    const result = computeChronologyIntelligence({
      children: [makeChild({ id: "c1" })],
      events: [
        makeEvent({ id: "e1", child_id: "c1", date: "2026-05-05" }), // 20 days ago
      ],
      today: TODAY,
    });

    expect(result.child_profiles[0].has_gap).toBe(true);
    expect(result.child_profiles[0].days_since_last_entry).toBe(20);
  });

  it("no gap when last entry within 14 days", () => {
    const result = computeChronologyIntelligence({
      children: [makeChild({ id: "c1" })],
      events: [
        makeEvent({ id: "e1", child_id: "c1", date: "2026-05-20" }), // 5 days ago
      ],
      today: TODAY,
    });

    expect(result.child_profiles[0].has_gap).toBe(false);
    expect(result.child_profiles[0].days_since_last_entry).toBe(5);
  });

  it("computes recording rate", () => {
    const result = computeChronologyIntelligence({
      children: [makeChild({ id: "c1", placement_start_date: "2026-04-25" })], // 30 days
      events: [
        makeEvent({ id: "e1", child_id: "c1", date: "2026-05-05" }),
        makeEvent({ id: "e2", child_id: "c1", date: "2026-05-15" }),
        makeEvent({ id: "e3", child_id: "c1", date: "2026-05-20" }),
      ],
      today: TODAY,
    });

    // 30 days placement = 1 month, 3 events → rate = 3.0
    expect(result.child_profiles[0].recording_rate).toBe(3);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// CATEGORY BREAKDOWN
// ══════════════════════════════════════════════════════════════════════════════

describe("Chronology Engine — Category Breakdown", () => {
  it("groups events by category", () => {
    const result = computeChronologyIntelligence({
      children: [makeChild()],
      events: [
        makeEvent({ id: "e1", category: "safeguarding", significance: "critical" }),
        makeEvent({ id: "e2", category: "safeguarding", significance: "significant" }),
        makeEvent({ id: "e3", category: "education", significance: "routine" }),
      ],
      today: TODAY,
    });

    expect(result.category_breakdown).toHaveLength(2);
    const safeguarding = result.category_breakdown.find((c) => c.category === "safeguarding")!;
    expect(safeguarding.count).toBe(2);
    expect(safeguarding.critical).toBe(1);
    expect(safeguarding.significant).toBe(1);
  });

  it("sorts by count descending", () => {
    const result = computeChronologyIntelligence({
      children: [makeChild()],
      events: [
        makeEvent({ id: "e1", category: "education" }),
        makeEvent({ id: "e2", category: "health" }),
        makeEvent({ id: "e3", category: "health" }),
        makeEvent({ id: "e4", category: "health" }),
      ],
      today: TODAY,
    });

    expect(result.category_breakdown[0].category).toBe("health");
    expect(result.category_breakdown[0].count).toBe(3);
  });

  it("computes percentage of total", () => {
    const result = computeChronologyIntelligence({
      children: [makeChild()],
      events: [
        makeEvent({ id: "e1", category: "placement" }),
        makeEvent({ id: "e2", category: "placement" }),
        makeEvent({ id: "e3", category: "education" }),
        makeEvent({ id: "e4", category: "health" }),
      ],
      today: TODAY,
    });

    const placement = result.category_breakdown.find((c) => c.category === "placement")!;
    expect(placement.pct_of_total).toBe(50); // 2/4
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// TIMELINE
// ══════════════════════════════════════════════════════════════════════════════

describe("Chronology Engine — Timeline", () => {
  it("groups events by month", () => {
    const result = computeChronologyIntelligence({
      children: [makeChild()],
      events: [
        makeEvent({ id: "e1", date: "2026-05-20" }),
        makeEvent({ id: "e2", date: "2026-05-10" }),
        makeEvent({ id: "e3", date: "2026-04-15" }),
        makeEvent({ id: "e4", date: "2026-04-01" }),
        makeEvent({ id: "e5", date: "2026-03-10" }),
      ],
      today: TODAY,
    });

    expect(result.timeline.length).toBe(3);
    // sorted newest first
    expect(result.timeline[0].period).toBe("2026-05");
    expect(result.timeline[0].count).toBe(2);
    expect(result.timeline[1].period).toBe("2026-04");
    expect(result.timeline[1].count).toBe(2);
  });

  it("tracks critical events per month", () => {
    const result = computeChronologyIntelligence({
      children: [makeChild()],
      events: [
        makeEvent({ id: "e1", date: "2026-05-20", significance: "critical" }),
        makeEvent({ id: "e2", date: "2026-05-10", significance: "significant" }),
        makeEvent({ id: "e3", date: "2026-05-05", significance: "critical" }),
      ],
      today: TODAY,
    });

    expect(result.timeline[0].period).toBe("2026-05");
    expect(result.timeline[0].critical).toBe(2);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// ALERTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Chronology Engine — Alerts", () => {
  it("generates critical alert for children without chronology", () => {
    const result = computeChronologyIntelligence({
      children: [makeChild({ id: "c1", name: "Alex W" })],
      events: [], // no events
      today: TODAY,
    });

    const critical = result.alerts.filter((a) => a.severity === "critical");
    expect(critical.some((a) => a.message.includes("Alex W") && a.message.includes("no chronology"))).toBe(true);
  });

  it("generates high alert for recording gaps", () => {
    const result = computeChronologyIntelligence({
      children: [makeChild({ id: "c1", name: "Alex W" })],
      events: [
        makeEvent({ id: "e1", child_id: "c1", date: "2026-05-01" }), // 24 days gap
      ],
      today: TODAY,
    });

    const high = result.alerts.filter((a) => a.severity === "high");
    expect(high.some((a) => a.message.includes("Alex W") && a.message.includes("gap"))).toBe(true);
  });

  it("generates medium alert for limited category coverage", () => {
    const result = computeChronologyIntelligence({
      children: [makeChild({ id: "c1", name: "Alex W" })],
      events: [
        makeEvent({ id: "e1", child_id: "c1", category: "placement", date: "2026-05-20" }),
        makeEvent({ id: "e2", child_id: "c1", category: "placement", date: "2026-05-15" }),
        makeEvent({ id: "e3", child_id: "c1", category: "placement", date: "2026-05-10" }),
      ],
      today: TODAY,
    });

    const medium = result.alerts.filter((a) => a.severity === "medium");
    expect(medium.some((a) => a.message.includes("Alex W") && a.message.includes("1 category"))).toBe(true);
  });

  it("generates low alert for recent critical events", () => {
    const result = computeChronologyIntelligence({
      children: [makeChild({ id: "c1" })],
      events: [
        makeEvent({ id: "e1", child_id: "c1", date: "2026-05-20", significance: "critical" }),
      ],
      today: TODAY,
    });

    const low = result.alerts.filter((a) => a.severity === "low");
    expect(low.some((a) => a.message.includes("critical event"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// ARIA INSIGHTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Chronology Engine — ARIA Insights", () => {
  it("generates critical insight for missing chronologies", () => {
    const result = computeChronologyIntelligence({
      children: [makeChild({ id: "c1" })],
      events: [],
      today: TODAY,
    });

    const critical = result.insights.filter((i) => i.severity === "critical");
    expect(critical.some((i) => i.text.includes("no chronology entries"))).toBe(true);
  });

  it("generates warning for recording gaps", () => {
    const result = computeChronologyIntelligence({
      children: [makeChild({ id: "c1", name: "Alex W" })],
      events: [
        makeEvent({ id: "e1", child_id: "c1", date: "2026-05-01" }),
      ],
      today: TODAY,
    });

    const warnings = result.insights.filter((i) => i.severity === "warning");
    expect(warnings.some((w) => w.text.includes("recording gaps") && w.text.includes("Alex W"))).toBe(true);
  });

  it("generates positive insight when all children have chronologies", () => {
    const result = computeChronologyIntelligence({
      children: [
        makeChild({ id: "c1" }),
        makeChild({ id: "c2" }),
      ],
      events: [
        makeEvent({ id: "e1", child_id: "c1", date: "2026-05-20" }),
        makeEvent({ id: "e2", child_id: "c2", date: "2026-05-18" }),
      ],
      today: TODAY,
    });

    const positive = result.insights.filter((i) => i.severity === "positive");
    expect(positive.some((p) => p.text.includes("All 2 children"))).toBe(true);
  });

  it("generates positive insight for good category breadth", () => {
    const result = computeChronologyIntelligence({
      children: [makeChild({ id: "c1" })],
      events: [
        makeEvent({ id: "e1", child_id: "c1", category: "placement", date: "2026-05-20" }),
        makeEvent({ id: "e2", child_id: "c1", category: "education", date: "2026-05-19" }),
        makeEvent({ id: "e3", child_id: "c1", category: "health", date: "2026-05-18" }),
        makeEvent({ id: "e4", child_id: "c1", category: "safeguarding", date: "2026-05-17" }),
        makeEvent({ id: "e5", child_id: "c1", category: "missing", date: "2026-05-16" }),
        makeEvent({ id: "e6", child_id: "c1", category: "review", date: "2026-05-15" }),
        makeEvent({ id: "e7", child_id: "c1", category: "contact", date: "2026-05-14" }),
        makeEvent({ id: "e8", child_id: "c1", category: "behaviour", date: "2026-05-13" }),
        makeEvent({ id: "e9", child_id: "c1", category: "achievement", date: "2026-05-12" }),
        makeEvent({ id: "e10", child_id: "c1", category: "legal", date: "2026-05-11" }),
      ],
      today: TODAY,
    });

    const positive = result.insights.filter((i) => i.severity === "positive");
    expect(positive.some((p) => p.text.includes("10 different categories"))).toBe(true);
  });

  it("generates positive insight for high recording frequency", () => {
    const result = computeChronologyIntelligence({
      children: [makeChild({ id: "c1" })],
      events: [
        makeEvent({ id: "e1", child_id: "c1", date: "2026-05-24" }),
        makeEvent({ id: "e2", child_id: "c1", date: "2026-05-22" }),
        makeEvent({ id: "e3", child_id: "c1", date: "2026-05-20" }),
      ],
      today: TODAY,
    });

    // 3 events in 30d / 1 child = 3.0 >= 3
    const positive = result.insights.filter((i) => i.severity === "positive");
    expect(positive.some((p) => p.text.includes("Recording frequency"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// FULL OAK HOUSE INTEGRATION
// ══════════════════════════════════════════════════════════════════════════════

describe("Chronology Engine — Chamberlain House Integration", () => {
  it("produces comprehensive output for realistic Chamberlain House data", () => {
    const children: ChildInput[] = [
      { id: "yp_alex", name: "Alex W", placement_start_date: "2025-09-01" },
      { id: "yp_jordan", name: "Jordan K", placement_start_date: "2025-11-15" },
      { id: "yp_casey", name: "Casey T", placement_start_date: "2026-01-10" },
    ];

    const events: ChronologyEventInput[] = [
      // Alex (7 events across multiple categories)
      { id: "chr_001", child_id: "yp_alex", date: "2025-09-01", category: "placement", title: "Placement commenced at Chamberlain House", significance: "critical", has_linked_incident: false },
      { id: "chr_002", child_id: "yp_alex", date: "2025-10-01", category: "education", title: "School placement arranged", significance: "significant", has_linked_incident: false },
      { id: "chr_003", child_id: "yp_alex", date: "2026-01-15", category: "missing", title: "First missing from care episode", significance: "significant", has_linked_incident: false },
      { id: "chr_004", child_id: "yp_alex", date: "2026-02-05", category: "review", title: "LAC Review", significance: "significant", has_linked_incident: false },
      { id: "chr_005", child_id: "yp_alex", date: "2026-02-28", category: "missing", title: "Second missing episode — CS risk flagged", significance: "critical", has_linked_incident: false },
      { id: "chr_006", child_id: "yp_alex", date: "2026-04-01", category: "missing", title: "Third missing episode — escalated", significance: "critical", has_linked_incident: true },
      { id: "chr_007", child_id: "yp_alex", date: "2026-04-14", category: "safeguarding", title: "Safeguarding disclosure — CE risk", significance: "critical", has_linked_incident: true },
      // Jordan (3 events)
      { id: "chr_010", child_id: "yp_jordan", date: "2025-11-15", category: "placement", title: "Placement commenced", significance: "critical", has_linked_incident: false },
      { id: "chr_011", child_id: "yp_jordan", date: "2025-12-01", category: "education", title: "School placement", significance: "significant", has_linked_incident: false },
      { id: "chr_012", child_id: "yp_jordan", date: "2026-04-14", category: "behaviour", title: "Complaint raised", significance: "significant", has_linked_incident: true },
      // Casey (4 events)
      { id: "chr_020", child_id: "yp_casey", date: "2026-01-10", category: "placement", title: "Placement commenced", significance: "critical", has_linked_incident: false },
      { id: "chr_021", child_id: "yp_casey", date: "2026-01-15", category: "health", title: "Melatonin prescribed", significance: "significant", has_linked_incident: false },
      { id: "chr_022", child_id: "yp_casey", date: "2026-02-01", category: "health", title: "Fluoxetine prescribed", significance: "significant", has_linked_incident: false },
      { id: "chr_023", child_id: "yp_casey", date: "2026-04-13", category: "health", title: "Medication late administration", significance: "significant", has_linked_incident: true },
    ];

    const result = computeChronologyIntelligence({ children, events, today: TODAY });

    // Overview
    expect(result.overview.total_events).toBe(14);
    expect(result.overview.critical_events_total).toBe(6);
    expect(result.overview.children_with_chronology).toBe(3);
    expect(result.overview.category_coverage).toBe(7); // placement, education, missing, review, safeguarding, health, behaviour

    // Child profiles
    expect(result.child_profiles).toHaveLength(3);
    const alex = result.child_profiles.find((p) => p.child_id === "yp_alex")!;
    expect(alex.total_events).toBe(7);
    expect(alex.critical_count).toBe(4);

    // All children have recording gaps (last entries are April or earlier)
    expect(result.child_profiles.every((p) => p.has_gap)).toBe(true);

    // Category breakdown
    expect(result.category_breakdown.length).toBeGreaterThanOrEqual(5);

    // Timeline
    expect(result.timeline.length).toBeGreaterThanOrEqual(4);

    // Alerts (recording gaps for all)
    expect(result.alerts.filter((a) => a.severity === "high").length).toBeGreaterThanOrEqual(3);

    // Insights — should have warnings (gaps) and positive (all have chronologies)
    expect(result.insights.some((i) => i.severity === "warning")).toBe(true);
    expect(result.insights.some((i) => i.severity === "positive")).toBe(true);
  });
});
