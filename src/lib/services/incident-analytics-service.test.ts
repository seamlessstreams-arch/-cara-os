import { describe, it, expect } from "vitest";
import {
  computeIncidentSummary,
  computeIncidentTrend,
  computePIAnalysis,
  identifyHighFrequencyPatterns,
  computeNotificationRequirements,
} from "./incident-analytics-service";

function makeIncident(overrides: Partial<{
  id: string;
  category: string;
  severity: string;
  child_id: string;
  staff_involved: string[];
  created_at: string;
  physical_intervention_used: boolean;
}> = {}) {
  return {
    id: "inc-1",
    category: "violence",
    severity: "minor",
    child_id: "child-1",
    staff_involved: ["staff-1"],
    created_at: "2026-05-01T14:00:00Z",
    physical_intervention_used: false,
    ...overrides,
  };
}

describe("computeIncidentSummary", () => {
  it("returns zeroes for empty data", () => {
    const s = computeIncidentSummary([], "2026-05-01", "2026-05-31");
    expect(s.total).toBe(0);
    expect(s.physical_interventions).toBe(0);
    expect(s.average_per_week).toBe(0);
    expect(s.by_day_of_week).toEqual([0, 0, 0, 0, 0, 0, 0]);
  });

  it("aggregates correctly for populated data", () => {
    const incidents = [
      makeIncident({ id: "i1", category: "violence", severity: "major", physical_intervention_used: true, created_at: "2026-05-05T10:00:00Z" }),
      makeIncident({ id: "i2", category: "self_harm", severity: "minor", child_id: "child-2", staff_involved: ["staff-2"], created_at: "2026-05-10T15:00:00Z" }),
      makeIncident({ id: "i3", category: "violence", severity: "critical", physical_intervention_used: true, created_at: "2026-05-15T08:00:00Z" }),
    ];
    const s = computeIncidentSummary(incidents, "2026-05-01", "2026-05-31");
    expect(s.total).toBe(3);
    expect(s.by_category["violence"]).toBe(2);
    expect(s.by_category["self_harm"]).toBe(1);
    expect(s.by_severity["major"]).toBe(1);
    expect(s.by_severity["minor"]).toBe(1);
    expect(s.by_severity["critical"]).toBe(1);
    expect(s.by_child["child-1"]).toBe(2);
    expect(s.by_child["child-2"]).toBe(1);
    expect(s.by_staff_involved["staff-1"]).toBe(2);
    expect(s.by_staff_involved["staff-2"]).toBe(1);
    expect(s.physical_interventions).toBe(2);
    // 30 days = ~4.29 weeks, 3/4.29 ~= 0.7
    expect(s.average_per_week).toBeGreaterThan(0);
    expect(s.period_start).toBe("2026-05-01");
    expect(s.period_end).toBe("2026-05-31");
  });
});

describe("computeIncidentTrend", () => {
  it("returns stable for two empty periods", () => {
    const empty = computeIncidentSummary([], "2026-04-01", "2026-04-30");
    const trend = computeIncidentTrend(empty, empty);
    expect(trend.direction).toBe("stable");
    expect(trend.percentage_change).toBe(0);
  });

  it("detects increasing trend when current > previous by more than 10%", () => {
    const prev = computeIncidentSummary(
      [makeIncident({ id: "i1" })],
      "2026-04-01",
      "2026-04-30",
    );
    const curr = computeIncidentSummary(
      [makeIncident({ id: "i2" }), makeIncident({ id: "i3" })],
      "2026-05-01",
      "2026-05-31",
    );
    const trend = computeIncidentTrend(curr, prev);
    expect(trend.direction).toBe("increasing");
    expect(trend.percentage_change).toBe(100);
  });

  it("identifies emerging patterns for categories that go from 0 to >0", () => {
    const prev = computeIncidentSummary(
      [makeIncident({ id: "i1", category: "violence" })],
      "2026-04-01",
      "2026-04-30",
    );
    const curr = computeIncidentSummary(
      [makeIncident({ id: "i2", category: "violence" }), makeIncident({ id: "i3", category: "self_harm" })],
      "2026-05-01",
      "2026-05-31",
    );
    const trend = computeIncidentTrend(curr, prev);
    expect(trend.emerging_patterns).toContain("self_harm");
  });
});

describe("computePIAnalysis", () => {
  it("returns zeroes for empty data", () => {
    const r = computePIAnalysis([]);
    expect(r.total_pi).toBe(0);
    expect(r.unique_children).toBe(0);
    expect(r.unique_staff).toBe(0);
    expect(r.avg_duration_minutes).toBeNull();;
    expect(r.injury_rate).toBeNull();;
    expect(r.debrief_completion_rate).toBeNull();;
  });

  it("computes correctly for populated data", () => {
    const incidents = [
      { id: "pi1", child_id: "c1", staff_involved: ["s1", "s2"], duration_minutes: 10, technique_used: "Restrictive hold", injury_reported: false, debrief_completed: true, created_at: "2026-05-01T10:00:00Z" },
      { id: "pi2", child_id: "c1", staff_involved: ["s1"], duration_minutes: 20, technique_used: "Restrictive hold", injury_reported: true, debrief_completed: false, created_at: "2026-05-10T10:00:00Z" },
      { id: "pi3", child_id: "c2", staff_involved: ["s3"], duration_minutes: 5, technique_used: "Guide away", injury_reported: false, debrief_completed: true, created_at: "2026-05-15T10:00:00Z" },
      { id: "pi4", child_id: "c2", staff_involved: ["s1"], duration_minutes: null, technique_used: null, injury_reported: false, debrief_completed: true, created_at: "2026-05-20T10:00:00Z" },
    ];
    const r = computePIAnalysis(incidents);
    expect(r.total_pi).toBe(4);
    expect(r.unique_children).toBe(2);
    expect(r.unique_staff).toBe(3);
    // avg duration: (10+20+5)/3 ≈ 11.67
    expect(r.avg_duration_minutes).toBeCloseTo(11.67, 1);
    // injury rate: 1/4 = 25%
    expect(r.injury_rate).toBe(25);
    // debrief: 3/4 = 75%
    expect(r.debrief_completion_rate).toBe(75);
    // repeat children: c1 (2), c2 (2)
    expect(r.repeat_children).toHaveLength(2);
    expect(r.by_technique["Restrictive hold"]).toBe(2);
    expect(r.by_technique["Guide away"]).toBe(1);
  });
});

describe("identifyHighFrequencyPatterns", () => {
  it("returns empty arrays for empty data", () => {
    const r = identifyHighFrequencyPatterns([]);
    expect(r.high_frequency_children).toEqual([]);
    expect(r.high_frequency_categories).toEqual([]);
    expect(r.clustering).toEqual([]);
  });

  it("identifies high-frequency children (threshold default 3)", () => {
    const incidents = [
      { category: "violence", child_id: "c1", created_at: "2026-05-01T10:00:00Z" },
      { category: "self_harm", child_id: "c1", created_at: "2026-05-02T10:00:00Z" },
      { category: "absconding", child_id: "c1", created_at: "2026-05-03T10:00:00Z" },
      { category: "violence", child_id: "c2", created_at: "2026-05-04T10:00:00Z" },
    ];
    const r = identifyHighFrequencyPatterns(incidents);
    expect(r.high_frequency_children).toHaveLength(1);
    expect(r.high_frequency_children[0].child_id).toBe("c1");
    expect(r.high_frequency_children[0].count).toBe(3);
  });

  it("identifies high-frequency categories (threshold default 5)", () => {
    const incidents = Array.from({ length: 6 }, (_, i) => ({
      category: "violence",
      child_id: `c${i}`,
      created_at: `2026-05-0${i + 1}T10:00:00Z`,
    }));
    const r = identifyHighFrequencyPatterns(incidents);
    expect(r.high_frequency_categories.some((c) => c.category === "violence" && c.count === 6)).toBe(true);
  });

  it("detects temporal clustering (3+ within 48h window)", () => {
    const incidents = [
      { category: "violence", child_id: "c1", created_at: "2026-05-01T10:00:00Z" },
      { category: "self_harm", child_id: "c2", created_at: "2026-05-01T14:00:00Z" },
      { category: "absconding", child_id: "c3", created_at: "2026-05-02T08:00:00Z" },
    ];
    const r = identifyHighFrequencyPatterns(incidents);
    expect(r.clustering).toHaveLength(1);
    expect(r.clustering[0].count).toBe(3);
  });
});

describe("computeNotificationRequirements", () => {
  it("returns 100% compliance for empty data", () => {
    const r = computeNotificationRequirements([]);
    expect(r.required).toBe(0);
    expect(r.sent).toBe(0);
    expect(r.outstanding).toBe(0);
    expect(r.compliance_percentage).toBe(100);
  });

  it("computes correctly for notifiable incidents", () => {
    const incidents = [
      { id: "i1", category: "physical_intervention", notification_sent: true },
      { id: "i2", category: "missing", notification_sent: false },
      { id: "i3", category: "safeguarding", notification_sent: true },
      { id: "i4", category: "violence", notification_sent: false }, // not notifiable
    ];
    const r = computeNotificationRequirements(incidents);
    expect(r.required).toBe(3); // physical_intervention, missing, safeguarding
    expect(r.sent).toBe(2);
    expect(r.outstanding).toBe(1);
    // 2/3 = 66.67%
    expect(r.compliance_percentage).toBe(66.67);
    expect(r.outstanding_incidents).toHaveLength(1);
    expect(r.outstanding_incidents[0].category).toBe("missing");
  });
});
