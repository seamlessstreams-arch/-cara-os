import { describe, it, expect } from "vitest";
import {
  computeMedicationErrorTrends,
  daysAgo,
  timeBand,
  maxSeverity,
  SEVERITY_RANK,
  REPEAT_THRESHOLD,
  type MedErrorTrendInput,
  type MedErrorInput,
} from "../medication-error-trends-engine";

// ── Fixed clock ───────────────────────────────────────────────────────────────
const TODAY = "2026-06-02";
function addDays(date: string, n: number): string {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
const ago = (n: number) => addDays(TODAY, -n);

// ── Factories ─────────────────────────────────────────────────────────────────
function makeErr(o: Partial<MedErrorInput> = {}): MedErrorInput {
  return {
    id: "me_1",
    child_id: "c1",
    child_name: "Child One",
    date_occurred: ago(5),
    time_occurred: "08:00",
    error_type: "wrong_dose",
    severity: "no_harm",
    medication: "Paracetamol",
    lessons_learned: "",
    remedial_actions: [],
    duty_of_candour: false,
    duty_of_candour_completed: null,
    status: "closed",
    ...o,
  };
}
function run(partial: Partial<MedErrorTrendInput>): MedErrorTrendInput {
  return { errors: [], administrations: [], today: TODAY, ...partial };
}
const admins = (n: number, day = 5) =>
  Array.from({ length: n }, () => ({ date: ago(day), status: "administered" }));

// ══════════════════════════════════════════════════════════════════════════════
describe("helpers", () => {
  it("daysAgo counts whole days", () => {
    expect(daysAgo(ago(5), TODAY)).toBe(5);
    expect(daysAgo(TODAY, TODAY)).toBe(0);
  });
  it("timeBand maps hours to medication rounds", () => {
    expect(timeBand("08:00")).toMatch(/Morning/);
    expect(timeBand("13:00")).toMatch(/Midday/);
    expect(timeBand("18:30")).toMatch(/Evening/);
    expect(timeBand("23:00")).toMatch(/Night/);
    expect(timeBand("03:00")).toMatch(/Night/);
    expect(timeBand("")).toMatch(/Unknown/);
  });
  it("maxSeverity returns the worst severity", () => {
    expect(maxSeverity([{ severity: "no_harm" }, { severity: "moderate" }, { severity: "low" }])).toBe("moderate");
    expect(maxSeverity([])).toBe("no_harm");
  });
  it("severity ranks ascend by harm", () => {
    expect(SEVERITY_RANK.death).toBeGreaterThan(SEVERITY_RANK.severe);
    expect(SEVERITY_RANK.moderate).toBeGreaterThan(SEVERITY_RANK.low);
  });
});

describe("empty input", () => {
  const r = computeMedicationErrorTrends(run({}));
  it("returns a clean zero-state", () => {
    expect(r.overview.total_errors_90d).toBe(0);
    expect(r.overview.trend_direction).toBe("stable");
    expect(r.repeat_patterns).toHaveLength(0);
    expect(r.learning_gaps).toHaveLength(0);
    expect(r.alerts).toHaveLength(0);
  });
  it("emits a positive 'no errors' insight", () => {
    expect(r.insights.some((i) => i.severity === "positive" && /No medication errors/i.test(i.text))).toBe(true);
  });
});

describe("trend analysis (rising)", () => {
  const r = computeMedicationErrorTrends(run({
    errors: [
      makeErr({ id: "1", medication: "MedA", child_id: "c1", error_type: "wrong_dose", time_occurred: "08:00", date_occurred: ago(3) }),
      makeErr({ id: "2", medication: "MedB", child_id: "c2", error_type: "omission", time_occurred: "13:00", date_occurred: ago(10) }),
      makeErr({ id: "3", medication: "MedC", child_id: "c3", error_type: "wrong_time", time_occurred: "18:00", date_occurred: ago(20) }),
      makeErr({ id: "4", medication: "MedD", child_id: "c4", error_type: "near_miss", time_occurred: "23:00", date_occurred: ago(45) }),
    ],
    administrations: admins(30),
  }));
  it("compares recent vs prior 30-day windows", () => {
    expect(r.trend.recent_30d).toBe(3);
    expect(r.trend.prior_30d).toBe(1);
    expect(r.trend.change).toBe(2);
    expect(r.trend.change_pct).toBe(200);
    expect(r.trend.direction).toBe("rising");
  });
  it("computes per-week velocity and an administration-adjusted rate", () => {
    expect(r.trend.velocity_per_week).toBe(0.5);
    expect(r.trend.recent_rate_per_100_admin).toBe(10); // 3 errors / 30 admins * 100
  });
  it("does not invent repeat patterns when every error is distinct", () => {
    expect(r.repeat_patterns).toHaveLength(0);
  });
  it("raises a rising-trend alert", () => {
    expect(r.alerts.some((a) => /rising/i.test(a.message))).toBe(true);
  });
});

describe("trend analysis (falling, healthy)", () => {
  const r = computeMedicationErrorTrends(run({
    errors: [
      makeErr({ id: "1", medication: "MedA", child_id: "c1", error_type: "wrong_dose", time_occurred: "08:00", date_occurred: ago(5) }),
      makeErr({ id: "2", medication: "MedB", child_id: "c2", error_type: "omission", time_occurred: "13:00", date_occurred: ago(35) }),
      makeErr({ id: "3", medication: "MedC", child_id: "c3", error_type: "wrong_time", time_occurred: "18:00", date_occurred: ago(40) }),
      makeErr({ id: "4", medication: "MedD", child_id: "c4", error_type: "near_miss", time_occurred: "23:00", date_occurred: ago(50) }),
    ],
  }));
  it("detects a falling trajectory", () => {
    expect(r.trend.recent_30d).toBe(1);
    expect(r.trend.prior_30d).toBe(3);
    expect(r.trend.direction).toBe("falling");
  });
  it("returns null rate when no administrations are recorded", () => {
    expect(r.trend.recent_rate_per_100_admin).toBeNull();
  });
  it("emits a positive falling-trend insight", () => {
    expect(r.insights.some((i) => i.severity === "positive" && /falling/i.test(i.text))).toBe(true);
  });
});

describe("repeat pattern — medication + learning-loop failure", () => {
  const r = computeMedicationErrorTrends(run({
    errors: [
      makeErr({ id: "1", medication: "Methylphenidate", child_id: "c1", time_occurred: "08:00", date_occurred: ago(80), lessons_learned: "Re-trained staff on dosing" }),
      makeErr({ id: "2", medication: "Methylphenidate", child_id: "c2", time_occurred: "13:00", date_occurred: ago(40) }),
      makeErr({ id: "3", medication: "Methylphenidate", child_id: "c3", time_occurred: "18:00", date_occurred: ago(10) }),
    ],
  }));
  it("flags the medication as a repeat pattern", () => {
    const med = r.repeat_patterns.find((p) => p.dimension === "medication");
    expect(med?.key).toBe("Methylphenidate");
    expect(med?.count).toBe(3);
  });
  it("detects recurrence after a lesson was recorded", () => {
    const med = r.repeat_patterns.find((p) => p.dimension === "medication");
    expect(med?.recurred_after_lesson).toBe(true);
  });
  it("raises a critical learning-loop gap", () => {
    const gap = r.learning_gaps.find((g) => g.type === "recurrence_despite_learning");
    expect(gap).toBeDefined();
    expect(gap?.severity).toBe("critical");
  });
  it("raises critical (recurrence) and high (high-risk medication) alerts", () => {
    expect(r.alerts.some((a) => a.severity === "critical" && /recurred despite/i.test(a.message))).toBe(true);
    expect(r.alerts.some((a) => a.severity === "high" && /high-risk medication/i.test(a.message))).toBe(true);
  });
  it("surfaces a critical ARIA insight about the learning loop", () => {
    expect(r.insights.some((i) => i.severity === "critical")).toBe(true);
  });
});

describe("repeat pattern — child", () => {
  const r = computeMedicationErrorTrends(run({
    errors: [
      makeErr({ id: "1", child_id: "c1", child_name: "Alex", medication: "MedA", error_type: "wrong_dose", time_occurred: "08:00", date_occurred: ago(10) }),
      makeErr({ id: "2", child_id: "c1", child_name: "Alex", medication: "MedB", error_type: "omission", time_occurred: "13:00", date_occurred: ago(40) }),
    ],
  }));
  it("groups repeats by affected child", () => {
    const childP = r.repeat_patterns.find((p) => p.dimension === "child");
    expect(childP?.key).toBe("Alex");
    expect(childP?.count).toBe(2);
  });
  it("honours the repeat threshold", () => {
    expect(REPEAT_THRESHOLD).toBe(2);
  });
});

describe("repeat pattern — time-of-day cluster", () => {
  const r = computeMedicationErrorTrends(run({
    errors: [
      makeErr({ id: "1", medication: "MedA", child_id: "c1", error_type: "wrong_dose", time_occurred: "18:10", date_occurred: ago(5) }),
      makeErr({ id: "2", medication: "MedB", child_id: "c2", error_type: "omission", time_occurred: "18:40", date_occurred: ago(15) }),
      makeErr({ id: "3", medication: "MedC", child_id: "c3", error_type: "wrong_time", time_occurred: "19:00", date_occurred: ago(25) }),
    ],
  }));
  it("clusters errors by medication round", () => {
    const t = r.repeat_patterns.find((p) => p.dimension === "time_of_day");
    expect(t?.key).toMatch(/Evening/);
    expect(t?.count).toBe(3);
  });
  it("raises a medium time-cluster alert", () => {
    expect(r.alerts.some((a) => a.severity === "medium" && /medication round/i.test(a.message))).toBe(true);
  });
});

describe("harm and notification", () => {
  const r = computeMedicationErrorTrends(run({
    errors: [
      makeErr({ id: "1", severity: "severe", medication: "Insulin", child_name: "Jordan", date_occurred: ago(8) }),
      makeErr({ id: "2", severity: "death", medication: "Morphine", child_name: "Casey", date_occurred: ago(20) }),
      makeErr({ id: "3", severity: "no_harm", medication: "Paracetamol", date_occurred: ago(12) }),
    ],
  }));
  it("counts harm events (moderate+) and a harm rate", () => {
    expect(r.severity_breakdown.severe).toBe(1);
    expect(r.severity_breakdown.death).toBe(1);
    expect(r.severity_breakdown.harm_events).toBe(2);
    expect(r.severity_breakdown.harm_rate).toBe(67); // 2 of 3
  });
  it("raises critical alerts for severe and death events", () => {
    const crit = r.alerts.filter((a) => a.severity === "critical");
    expect(crit.some((a) => /severe-harm/i.test(a.message))).toBe(true);
    expect(crit.some((a) => /A death/i.test(a.message))).toBe(true);
  });
});

describe("learning gaps — open remedial actions & candour", () => {
  const r = computeMedicationErrorTrends(run({
    errors: [
      makeErr({ id: "1", status: "action_required", remedial_actions: [{ status: "pending" }], medication: "MedA", date_occurred: ago(7) }),
      makeErr({ id: "2", duty_of_candour: true, duty_of_candour_completed: null, severity: "moderate", medication: "MedB", date_occurred: ago(14) }),
    ],
  }));
  it("flags open remedial actions", () => {
    const gap = r.learning_gaps.find((g) => g.type === "open_remedial_actions");
    expect(gap?.count).toBe(1);
    expect(gap?.severity).toBe("high");
  });
  it("flags incomplete duty of candour", () => {
    const gap = r.learning_gaps.find((g) => g.type === "candour_incomplete");
    expect(gap?.count).toBe(1);
  });
  it("raises a medium alert to close remedial actions", () => {
    expect(r.alerts.some((a) => a.severity === "medium" && /open remedial/i.test(a.message))).toBe(true);
  });
});

describe("overview aggregation", () => {
  const r = computeMedicationErrorTrends(run({
    errors: [
      makeErr({ id: "1", medication: "Methylphenidate", child_id: "c1", child_name: "Alex", error_type: "wrong_dose", time_occurred: "08:00", date_occurred: ago(10) }),
      makeErr({ id: "2", medication: "Methylphenidate", child_id: "c1", child_name: "Alex", error_type: "wrong_dose", time_occurred: "08:30", date_occurred: ago(40) }),
      makeErr({ id: "3", medication: "Paracetamol", child_id: "c2", child_name: "Bo", error_type: "omission", time_occurred: "20:00", date_occurred: ago(70) }),
    ],
    administrations: admins(20),
  }));
  it("summarises totals, trend, and most-involved entities", () => {
    expect(r.overview.total_errors_90d).toBe(3);
    expect(r.overview.most_involved_medication).toBe("Methylphenidate");
    expect(r.overview.most_affected_child).toBe("Alex");
    expect(r.overview.repeat_pattern_count).toBeGreaterThanOrEqual(2); // medication + child + error_type
  });
});

describe("determinism", () => {
  it("returns identical output for identical input", () => {
    const input = run({
      errors: [
        makeErr({ id: "1", medication: "MedA", date_occurred: ago(10), lessons_learned: "x" }),
        makeErr({ id: "2", medication: "MedA", date_occurred: ago(30) }),
      ],
    });
    const a = computeMedicationErrorTrends(input);
    const b = computeMedicationErrorTrends(input);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
