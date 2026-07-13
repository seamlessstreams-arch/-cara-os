import { describe, it, expect } from "vitest";
import {
  validateMonitoringPlan,
  computeMonitoringBoard,
  type MonitoringPlan,
} from "../monitoring-plans-engine";

const NOW = "2026-07-13T12:00:00.000Z";

const validRestrictive = {
  child_id: "yp_alex",
  observation_level: "line_of_sight",
  check_frequency_minutes: null,
  rationale: "Recent self-harm disclosure; agreed at strategy meeting",
  restriction_acknowledged: true,
  child_views: "Alex says it feels safer for now; wants it reviewed weekly",
  agreed_by: "staff_darren",
  start_date: "2026-07-10",
  review_date: "2026-07-24",
};

const plan = (over: Partial<MonitoringPlan>): MonitoringPlan => ({
  id: "mp_1",
  child_id: "yp_alex",
  observation_level: "general",
  check_frequency_minutes: null,
  rationale: "",
  restriction_acknowledged: false,
  child_views: "",
  agreed_by: "staff_darren",
  start_date: "2026-07-01",
  review_date: "2026-09-01",
  status: "active",
  created_at: NOW,
  updated_at: NOW,
  ...over,
});

const YP = [
  { id: "yp_alex", first_name: "Alex", last_name: "W", status: "current" },
  { id: "yp_jordan", first_name: "Jordan", last_name: "M", status: "current" },
  { id: "yp_casey", first_name: "Casey", last_name: "T", status: "current" },
];

describe("validateMonitoringPlan — the rights rule", () => {
  it("a complete restrictive plan validates", () => {
    expect(validateMonitoringPlan(validRestrictive)).toEqual({ valid: true, errors: [] });
  });

  it("a restrictive level without acknowledgement / rationale / child views is refused, each named", () => {
    const r = validateMonitoringPlan({
      ...validRestrictive,
      restriction_acknowledged: false,
      rationale: "",
      child_views: "  ",
    });
    expect(r.valid).toBe(false);
    expect(r.errors.join(" ")).toMatch(/restriction_acknowledged must be true/);
    expect(r.errors.join(" ")).toMatch(/requires a rationale/);
    expect(r.errors.join(" ")).toMatch(/child's views/);
  });

  it("a restrictive level must be reviewed within 28 days", () => {
    const r = validateMonitoringPlan({ ...validRestrictive, review_date: "2026-08-20" }); // 41 days
    expect(r.valid).toBe(false);
    expect(r.errors.join(" ")).toMatch(/within 28 days/);
  });

  it("a general plan needs no restriction fields but still needs review_date + agreed_by", () => {
    const ok = validateMonitoringPlan({
      child_id: "yp_alex",
      observation_level: "general",
      agreed_by: "staff_darren",
      start_date: "2026-07-01",
      review_date: "2026-10-01", // >28d fine for general
    });
    expect(ok.valid).toBe(true);

    const bad = validateMonitoringPlan({ child_id: "yp_alex", observation_level: "general" });
    expect(bad.valid).toBe(false);
    expect(bad.errors.join(" ")).toMatch(/agreed_by/);
    expect(bad.errors.join(" ")).toMatch(/review_date/);
  });

  it("intermittent requires a frequency in 5–120; other levels refuse a frequency", () => {
    const missing = validateMonitoringPlan({
      ...validRestrictive,
      observation_level: "intermittent",
      check_frequency_minutes: null,
    });
    expect(missing.errors.join(" ")).toMatch(/need check_frequency_minutes/);

    const tooOften = validateMonitoringPlan({
      ...validRestrictive,
      observation_level: "intermittent",
      check_frequency_minutes: 2,
    });
    expect(tooOften.errors.join(" ")).toMatch(/between 5 and 120/);

    const wrongPlace = validateMonitoringPlan({ ...validRestrictive, check_frequency_minutes: 30 });
    expect(wrongPlace.errors.join(" ")).toMatch(/only applies to intermittent/);
  });

  it("review before start is refused; unknown level is refused", () => {
    expect(
      validateMonitoringPlan({ ...validRestrictive, review_date: "2026-07-01" }).errors.join(" "),
    ).toMatch(/cannot be before start_date/);
    expect(
      validateMonitoringPlan({ ...validRestrictive, observation_level: "constant" }).errors.join(" "),
    ).toMatch(/observation_level must be one of/);
  });
});

describe("computeMonitoringBoard — honest projection", () => {
  it("boards active plans, counts children without a plan (never invents a level)", () => {
    const b = computeMonitoringBoard({
      plans: [plan({ id: "mp_1", child_id: "yp_alex", observation_level: "line_of_sight", rationale: "x", restriction_acknowledged: true, child_views: "y", review_date: "2026-07-20" })],
      youngPeople: YP,
      nowIso: NOW,
    });
    expect(b.active_plans).toBe(1);
    expect(b.children_without_plan).toBe(2);
    expect(b.restrictive_count).toBe(1);
    expect(b.rows[0].level_label).toBe("Line of sight");
  });

  it("ended plans and non-resident children never board", () => {
    const b = computeMonitoringBoard({
      plans: [
        plan({ id: "mp_1", child_id: "yp_alex", status: "ended" }),
        plan({ id: "mp_2", child_id: "yp_gone" }),
      ],
      youngPeople: YP,
      nowIso: NOW,
    });
    expect(b.active_plans).toBe(0);
    expect(b.children_without_plan).toBe(3);
  });

  it("one plan per child — latest start_date wins", () => {
    const b = computeMonitoringBoard({
      plans: [
        plan({ id: "old", child_id: "yp_alex", observation_level: "general", start_date: "2026-06-01" }),
        plan({ id: "new", child_id: "yp_alex", observation_level: "intermittent", check_frequency_minutes: 30, rationale: "x", restriction_acknowledged: true, child_views: "y", start_date: "2026-07-01", review_date: "2026-07-20" }),
      ],
      youngPeople: YP,
      nowIso: NOW,
    });
    expect(b.rows).toHaveLength(1);
    expect(b.rows[0].plan_id).toBe("new");
  });

  it("flags overdue reviews and orders most-restrictive first", () => {
    const b = computeMonitoringBoard({
      plans: [
        plan({ id: "g", child_id: "yp_jordan", observation_level: "general", review_date: "2026-07-01" }), // overdue
        plan({ id: "a", child_id: "yp_alex", observation_level: "arms_length", rationale: "x", restriction_acknowledged: true, child_views: "y", start_date: "2026-07-10", review_date: "2026-07-30" }),
        plan({ id: "i", child_id: "yp_casey", observation_level: "intermittent", check_frequency_minutes: 15, rationale: "x", restriction_acknowledged: true, child_views: "y", start_date: "2026-07-10", review_date: "2026-07-20" }),
      ],
      youngPeople: YP,
      nowIso: NOW,
    });
    expect(b.rows.map((r) => r.plan_id)).toEqual(["a", "i", "g"]);
    expect(b.reviews_overdue).toBe(1);
    expect(b.rows.find((r) => r.plan_id === "g")?.review_overdue).toBe(true);
  });
});
