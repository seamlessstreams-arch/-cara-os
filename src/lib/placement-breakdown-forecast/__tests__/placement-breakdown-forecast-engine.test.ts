import { describe, it, expect } from "vitest";
import {
  computePlacementBreakdownForecast,
  daysBetween,
  daysAgo,
  addDays,
  ageFromDob,
  average,
  CRITICAL_THRESHOLD,
  MAX_HORIZON_DAYS,
  type PlacementForecastInput,
  type ChildInput,
  type IncidentInput,
  type MissingInput,
  type RestraintInput,
  type SanctionInput,
  type BehaviourInput,
  type EducationInput,
  type KeyworkingInput,
} from "../placement-breakdown-forecast-engine";

// ── Fixed clock ───────────────────────────────────────────────────────────────
const TODAY = "2026-06-02";
const ago = (n: number) => addDays(TODAY, -n);

// ── Factories ─────────────────────────────────────────────────────────────────
function makeChild(overrides: Partial<ChildInput> = {}): ChildInput {
  return {
    id: "yp_1",
    name: "Test Child",
    date_of_birth: "2010-06-02", // 16 on TODAY
    placement_start: ago(730),   // settled (2 years)
    placement_type: "long_term",
    risk_flags: [],
    ...overrides,
  };
}
const inc = (o: Partial<IncidentInput> & { child_id: string }): IncidentInput => ({
  date: ago(5), severity: "medium", ...o,
});
const miss = (o: Partial<MissingInput> & { child_id: string }): MissingInput => ({
  date_missing: ago(5), risk_level: "medium", return_interview_completed: true, ...o,
});
const res = (o: Partial<RestraintInput> & { child_id: string }): RestraintInput => ({
  date: ago(5), ...o,
});
const san = (o: Partial<SanctionInput> & { child_id: string }): SanctionInput => ({
  date: ago(5), direction: "sanction", proportionate: true, ...o,
});
const beh = (o: Partial<BehaviourInput> & { child_id: string }): BehaviourInput => ({
  date: ago(5), direction: "concern", intensity: "moderate", ...o,
});
const edu = (o: Partial<EducationInput> & { child_id: string }): EducationInput => ({
  date: ago(5), attendance_status: "present", ...o,
});
const kw = (o: Partial<KeyworkingInput> & { child_id: string }): KeyworkingInput => ({
  date: ago(5), mood_before: 3, mood_after: 4, ...o,
});

function run(partial: Partial<PlacementForecastInput>): PlacementForecastInput {
  return {
    children: [],
    incidents: [],
    missingEpisodes: [],
    restraints: [],
    sanctions: [],
    behaviour: [],
    education: [],
    keyworking: [],
    today: TODAY,
    ...partial,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
describe("date helpers", () => {
  it("daysBetween counts whole days", () => {
    expect(daysBetween("2026-06-02", "2026-06-07")).toBe(5);
    expect(daysBetween("2026-06-07", "2026-06-02")).toBe(5);
    expect(daysBetween("2026-06-02", "2026-06-02")).toBe(0);
  });
  it("daysAgo is positive for past dates relative to today", () => {
    expect(daysAgo(ago(5), TODAY)).toBe(5);
    expect(daysAgo(ago(20), TODAY)).toBe(20);
    expect(daysAgo(TODAY, TODAY)).toBe(0);
  });
  it("addDays shifts forward and backward", () => {
    expect(addDays("2026-06-02", 5)).toBe("2026-06-07");
    expect(addDays("2026-06-02", -5)).toBe("2026-05-28");
  });
  it("ageFromDob floors to whole years", () => {
    expect(ageFromDob("2010-06-02", TODAY)).toBe(16);
    expect(ageFromDob("2012-12-25", TODAY)).toBe(13);
  });
  it("average handles empty arrays", () => {
    expect(average([])).toBe(0);
    expect(average([2, 4])).toBe(3);
  });
});

describe("empty input", () => {
  it("produces a zeroed overview and no forecasts", () => {
    const r = computePlacementBreakdownForecast(run({}));
    expect(r.child_forecasts).toHaveLength(0);
    expect(r.overview.total_children).toBe(0);
    expect(r.overview.avg_risk_score).toBe(0);
    expect(r.overview.most_at_risk_child).toBeNull();
    expect(r.overview.earliest_projected_days).toBeNull();
    expect(r.alerts).toHaveLength(0);
  });
});

describe("stable child (engaged, no concerns)", () => {
  const input = run({
    children: [makeChild({ id: "s1", name: "Stable Sam" })],
    keyworking: [
      kw({ child_id: "s1", date: ago(5) }),
      kw({ child_id: "s1", date: ago(20) }),
    ],
  });
  const r = computePlacementBreakdownForecast(input);
  const f = r.child_forecasts[0];

  it("scores zero risk and a stable trend", () => {
    expect(f.risk_score).toBe(0);
    expect(f.risk_band).toBe("stable");
    expect(f.trend).toBe("stable");
    expect(f.velocity_per_week).toBe(0);
  });
  it("has no forward projection", () => {
    expect(f.projected_days_to_critical).toBeNull();
    expect(f.projected_date).toBeNull();
  });
  it("surfaces protective factors", () => {
    expect(f.protective_factors).toContain("No recorded incidents in the last 14 days");
    expect(f.protective_factors).toContain("Regular key-working engagement maintained");
    expect(f.protective_factors).toContain("Settled placement (over 12 months)");
  });
  it("recommends only routine continuation", () => {
    expect(f.recommended_actions).toHaveLength(1);
    expect(f.recommended_actions[0].priority).toBe("routine");
  });
});

describe("escalating child (recent surge vs quiet prior window)", () => {
  const C = "e1";
  const input = run({
    children: [makeChild({ id: C, name: "Escalating Ellie", placement_start: ago(200), risk_flags: ["CSE risk", "goes missing"] })],
    incidents: [inc({ child_id: C, date: ago(3), severity: "high" }), inc({ child_id: C, date: ago(6), severity: "critical" })],
    missingEpisodes: [miss({ child_id: C, date_missing: ago(4), risk_level: "high", return_interview_completed: false })],
    restraints: [res({ child_id: C, date: ago(2) })],
    sanctions: [san({ child_id: C, date: ago(5), proportionate: true }), san({ child_id: C, date: ago(7), proportionate: false })],
    behaviour: [beh({ child_id: C, date: ago(3), intensity: "high" })],
    education: [edu({ child_id: C, date: ago(8), attendance_status: "absent_unauthorised" })],
    keyworking: [], // no engagement either window → cancels in velocity
  });
  const r = computePlacementBreakdownForecast(input);
  const f = r.child_forecasts[0];

  it("computes the exact composite score (17+13+6+7+4+3+5 + standing 4)", () => {
    expect(f.risk_score).toBe(59);
    expect(f.risk_band).toBe("elevated");
  });
  it("detects an escalating trajectory with positive velocity", () => {
    expect(f.trend).toBe("escalating");
    expect(f.velocity_per_week).toBe(25); // (59 - 9) / 2
  });
  it("projects days-to-critical from the velocity", () => {
    // (75 - 59) / 25 * 7 = 4.48 → ceil = 5
    expect(f.projected_days_to_critical).toBe(5);
    expect(f.projected_date).toBe(addDays(TODAY, 5));
  });
  it("ranks contributing factors highest-first with rising flags", () => {
    expect(f.contributing_factors[0].factor).toBe("Incident pressure");
    expect(f.contributing_factors[0].points).toBe(17);
    expect(f.contributing_factors[0].rising).toBe(true);
    const missingF = f.contributing_factors.find((x) => x.factor === "Missing-from-care episodes");
    expect(missingF?.points).toBe(13); // 10 (high) + 3 (no RHI)
  });
  it("raises a critical alert for a short horizon", () => {
    const crit = r.alerts.filter((a) => a.severity === "critical");
    expect(crit.length).toBeGreaterThanOrEqual(1);
    expect(crit.some((a) => a.child_id === C)).toBe(true);
  });
  it("recommends urgent/high regulatory-linked actions", () => {
    const priorities = f.recommended_actions.map((a) => a.priority);
    expect(priorities).toContain("high");
    expect(f.recommended_actions.some((a) => /missing/i.test(a.action))).toBe(true);
    expect(f.recommended_actions.every((a) => a.regulatory_link.length > 0)).toBe(true);
  });
});

describe("improving child (quiet recent vs heavy prior window)", () => {
  const C = "i1";
  const input = run({
    children: [makeChild({ id: C, name: "Improving Ivy", placement_start: ago(300) })],
    incidents: [
      inc({ child_id: C, date: ago(20), severity: "high" }),
      inc({ child_id: C, date: ago(22), severity: "high" }),
      inc({ child_id: C, date: ago(4), severity: "low" }),
    ],
    missingEpisodes: [miss({ child_id: C, date_missing: ago(21), risk_level: "critical", return_interview_completed: false })],
    restraints: [res({ child_id: C, date: ago(19) })],
    keyworking: [kw({ child_id: C, date: ago(3), mood_before: 3, mood_after: 5 })],
  });
  const r = computePlacementBreakdownForecast(input);
  const f = r.child_forecasts[0];

  it("has a low current score", () => {
    expect(f.risk_score).toBe(2); // only the recent low incident
  });
  it("detects an improving trajectory with negative velocity", () => {
    expect(f.trend).toBe("improving");
    expect(f.velocity_per_week).toBeLessThan(0);
  });
  it("does not project a horizon when de-escalating", () => {
    expect(f.projected_days_to_critical).toBeNull();
  });
});

describe("critical child (caps bite, score clamps to 100)", () => {
  const C = "c1";
  const input = run({
    children: [makeChild({ id: C, name: "Critical Cara", placement_start: ago(10), risk_flags: ["CSE", "county lines"] })],
    incidents: [
      inc({ child_id: C, date: ago(1), severity: "critical" }),
      inc({ child_id: C, date: ago(2), severity: "critical" }),
      inc({ child_id: C, date: ago(3), severity: "critical" }),
    ],
    missingEpisodes: [
      miss({ child_id: C, date_missing: ago(1), risk_level: "critical", return_interview_completed: false }),
      miss({ child_id: C, date_missing: ago(2), risk_level: "critical", return_interview_completed: false }),
    ],
    restraints: [res({ child_id: C, date: ago(1) }), res({ child_id: C, date: ago(2) }), res({ child_id: C, date: ago(3) }), res({ child_id: C, date: ago(4) })],
    behaviour: [
      beh({ child_id: C, date: ago(1), intensity: "critical" }),
      beh({ child_id: C, date: ago(2), intensity: "critical" }),
      beh({ child_id: C, date: ago(3), intensity: "critical" }),
    ],
    education: [
      edu({ child_id: C, date: ago(1), attendance_status: "excluded" }),
      edu({ child_id: C, date: ago(2), attendance_status: "excluded" }),
      edu({ child_id: C, date: ago(3), attendance_status: "excluded" }),
    ],
  });
  const r = computePlacementBreakdownForecast(input);
  const f = r.child_forecasts[0];

  it("clamps the score to 100 and bands critical", () => {
    expect(f.risk_score).toBe(100);
    expect(f.risk_band).toBe("critical");
  });
  it("projects zero days when already at/over the threshold", () => {
    expect(f.trend).toBe("escalating");
    expect(f.projected_days_to_critical).toBe(0);
    expect(f.projected_date).toBe(TODAY);
  });
  it("includes an urgent disruption-prevention action", () => {
    expect(f.recommended_actions[0].priority).toBe("urgent");
    expect(f.recommended_actions[0].action).toMatch(/disruption prevention|stability/i);
  });
});

describe("safeguarding-gap weighting (no return home interview)", () => {
  it("adds extra risk when a missing episode has no completed RHI", () => {
    const withRHI = computePlacementBreakdownForecast(run({
      children: [makeChild({ id: "a" })],
      missingEpisodes: [miss({ child_id: "a", risk_level: "medium", return_interview_completed: true })],
    })).child_forecasts[0].risk_score;
    const withoutRHI = computePlacementBreakdownForecast(run({
      children: [makeChild({ id: "a" })],
      missingEpisodes: [miss({ child_id: "a", risk_level: "medium", return_interview_completed: false })],
    })).child_forecasts[0].risk_score;
    expect(withoutRHI - withRHI).toBe(3);
  });
});

describe("disproportionate sanction weighting (Reg 19)", () => {
  it("adds extra risk for a disproportionate sanction", () => {
    const proportionate = computePlacementBreakdownForecast(run({
      children: [makeChild({ id: "a" })],
      sanctions: [san({ child_id: "a", proportionate: true })],
    })).child_forecasts[0].risk_score;
    const disproportionate = computePlacementBreakdownForecast(run({
      children: [makeChild({ id: "a" })],
      sanctions: [san({ child_id: "a", proportionate: false })],
    })).child_forecasts[0].risk_score;
    expect(disproportionate - proportionate).toBe(3);
  });
});

describe("overview aggregation across a mixed cohort", () => {
  const input = run({
    children: [
      makeChild({ id: "s1", name: "Stable Sam" }),
      makeChild({ id: "e1", name: "Escalating Ellie", placement_start: ago(200), risk_flags: ["CSE risk", "goes missing"] }),
      makeChild({ id: "i1", name: "Improving Ivy", placement_start: ago(300) }),
      makeChild({ id: "c1", name: "Critical Cara", placement_start: ago(10), risk_flags: ["CSE"] }),
    ],
    keyworking: [kw({ child_id: "s1", date: ago(5) }), kw({ child_id: "s1", date: ago(20) })],
    incidents: [
      inc({ child_id: "e1", date: ago(3), severity: "high" }), inc({ child_id: "e1", date: ago(6), severity: "critical" }),
      inc({ child_id: "i1", date: ago(20), severity: "high" }), inc({ child_id: "i1", date: ago(22), severity: "high" }),
      inc({ child_id: "c1", date: ago(1), severity: "critical" }), inc({ child_id: "c1", date: ago(2), severity: "critical" }), inc({ child_id: "c1", date: ago(3), severity: "critical" }),
    ],
    missingEpisodes: [
      miss({ child_id: "e1", date_missing: ago(4), risk_level: "high", return_interview_completed: false }),
      miss({ child_id: "c1", date_missing: ago(1), risk_level: "critical", return_interview_completed: false }),
      miss({ child_id: "c1", date_missing: ago(2), risk_level: "critical", return_interview_completed: false }),
    ],
    restraints: [
      res({ child_id: "e1", date: ago(2) }),
      res({ child_id: "c1", date: ago(1) }), res({ child_id: "c1", date: ago(2) }), res({ child_id: "c1", date: ago(3) }), res({ child_id: "c1", date: ago(4) }),
    ],
    sanctions: [san({ child_id: "e1", date: ago(5) }), san({ child_id: "e1", date: ago(7), proportionate: false })],
    behaviour: [
      beh({ child_id: "e1", date: ago(3), intensity: "high" }),
      beh({ child_id: "c1", date: ago(1), intensity: "critical" }), beh({ child_id: "c1", date: ago(2), intensity: "critical" }), beh({ child_id: "c1", date: ago(3), intensity: "critical" }),
    ],
    education: [
      edu({ child_id: "e1", date: ago(8), attendance_status: "absent_unauthorised" }),
      edu({ child_id: "c1", date: ago(1), attendance_status: "excluded" }), edu({ child_id: "c1", date: ago(2), attendance_status: "excluded" }), edu({ child_id: "c1", date: ago(3), attendance_status: "excluded" }),
    ],
  });
  const r = computePlacementBreakdownForecast(input);

  it("counts bands correctly", () => {
    expect(r.overview.total_children).toBe(4);
    expect(r.overview.critical_count).toBe(1);
    expect(r.overview.elevated_count).toBe(1);
    expect(r.overview.stable_count).toBe(2);
  });
  it("counts trajectories correctly", () => {
    expect(r.overview.escalating_count).toBe(2);
    expect(r.overview.improving_count).toBe(1);
  });
  it("identifies the most-at-risk child and earliest projected breakdown", () => {
    expect(r.overview.most_at_risk_child).toBe("Critical Cara");
    expect(r.overview.earliest_projected_days).toBe(0);
    expect(r.overview.earliest_projected_child).toBe("Critical Cara");
  });
  it("orders forecasts most-urgent first", () => {
    expect(r.child_forecasts[0].child_name).toBe("Critical Cara");
    expect(r.child_forecasts[1].child_name).toBe("Escalating Ellie");
  });
  it("produces a critical ARIA insight and a positive improving insight", () => {
    expect(r.insights.some((i) => i.severity === "critical")).toBe(true);
    expect(r.insights.some((i) => i.severity === "warning")).toBe(true);
    expect(r.insights.some((i) => i.severity === "positive")).toBe(true);
  });
});

describe("all-stable cohort yields a positive insight", () => {
  it("emits the 'all stable' positive narrative", () => {
    const r = computePlacementBreakdownForecast(run({
      children: [makeChild({ id: "s1" }), makeChild({ id: "s2", name: "Two" })],
      keyworking: [
        kw({ child_id: "s1", date: ago(5) }), kw({ child_id: "s1", date: ago(20) }),
        kw({ child_id: "s2", date: ago(5) }), kw({ child_id: "s2", date: ago(20) }),
      ],
    }));
    expect(r.overview.critical_count).toBe(0);
    expect(r.overview.escalating_count).toBe(0);
    expect(r.insights.some((i) => i.severity === "positive" && /stable/i.test(i.text))).toBe(true);
  });
});

describe("projection bounds", () => {
  it("never projects beyond the max horizon", () => {
    // Tiny but positive velocity → projected days would exceed MAX_HORIZON → null
    const C = "p1";
    const r = computePlacementBreakdownForecast(run({
      children: [makeChild({ id: C, placement_start: ago(500) })],
      behaviour: [beh({ child_id: C, date: ago(2), intensity: "low" })], // +1 recent only
    }));
    const f = r.child_forecasts[0];
    expect(f.velocity_per_week).toBeGreaterThan(0);
    expect(f.velocity_per_week).toBeLessThan(2); // below escalating threshold
    expect(f.trend).toBe("stable");
    expect(f.projected_days_to_critical).toBeNull();
  });
  it("keeps any real projection within [1, MAX_HORIZON]", () => {
    const r = computePlacementBreakdownForecast(run({
      children: [makeChild({ id: "e1", placement_start: ago(200), risk_flags: ["CSE risk", "goes missing"] })],
      incidents: [inc({ child_id: "e1", date: ago(3), severity: "high" }), inc({ child_id: "e1", date: ago(6), severity: "critical" })],
      missingEpisodes: [miss({ child_id: "e1", date_missing: ago(4), risk_level: "high", return_interview_completed: false })],
    }));
    const f = r.child_forecasts[0];
    if (f.projected_days_to_critical != null) {
      expect(f.projected_days_to_critical).toBeGreaterThanOrEqual(1);
      expect(f.projected_days_to_critical).toBeLessThanOrEqual(MAX_HORIZON_DAYS);
    }
  });
});

describe("determinism", () => {
  it("returns identical output for identical input", () => {
    const input = run({
      children: [makeChild({ id: "e1", placement_start: ago(200), risk_flags: ["CSE risk"] })],
      incidents: [inc({ child_id: "e1", date: ago(3), severity: "high" })],
      missingEpisodes: [miss({ child_id: "e1", date_missing: ago(4), risk_level: "high", return_interview_completed: false })],
    });
    const a = computePlacementBreakdownForecast(input);
    const b = computePlacementBreakdownForecast(input);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
  it("exposes the documented threshold constant", () => {
    expect(CRITICAL_THRESHOLD).toBe(75);
  });
});
