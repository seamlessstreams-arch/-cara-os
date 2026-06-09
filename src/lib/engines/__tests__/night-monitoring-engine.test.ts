// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — NIGHT MONITORING & WELFARE ENGINE TESTS
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeNightMonitoring,
  daysBetween,
  average,
  classifySleepPattern,
  findEarliestAsleepTime,
  type ChildInput,
  type WelfareCheckInput,
  type WelfareRoundInput,
  type CheckStatus,
} from "../night-monitoring-engine";

// ── Factories ───────────────────────────────────────────────────────────────

const TODAY = "2026-05-24";

function makeChild(id: string, name: string): ChildInput {
  return { id, name };
}

function makeCheck(overrides: Partial<WelfareCheckInput> = {}): WelfareCheckInput {
  return {
    id: "wc_test",
    child_id: "yp_1",
    staff_id: "staff_1",
    check_date: "2026-05-23",
    check_time: "22:00",
    status: "asleep" as CheckStatus,
    mood: "settled",
    has_concern: false,
    physical_marks_noted: false,
    ...overrides,
  };
}

function makeRound(overrides: Partial<WelfareRoundInput> = {}): WelfareRoundInput {
  return {
    id: "wcr_test",
    round_date: "2026-05-23",
    round_time: "22:00",
    staff_id: "staff_1",
    shift_type: "sleep_in",
    all_children_checked: true,
    building_secure: true,
    fire_exits_clear: true,
    external_doors_locked: true,
    checks_count: 3,
    children_count: 3,
    ...overrides,
  };
}

function daysFromToday(n: number): string {
  const d = new Date("2026-05-24");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

// ── Unit Tests: Helpers ─────────────────────────────────────────────────────

describe("daysBetween", () => {
  it("returns correct difference", () => {
    expect(daysBetween("2026-05-20", "2026-05-24")).toBe(4);
  });
});

describe("average", () => {
  it("returns 0 for empty", () => {
    expect(average([])).toBe(0);
  });
  it("returns correct avg", () => {
    expect(average([4, 5, 6])).toBe(5);
  });
});

describe("classifySleepPattern", () => {
  it("returns settled when asleep rate >= 80% and no concerns", () => {
    expect(classifySleepPattern(85, 0)).toBe("settled");
  });
  it("returns disrupted when concerns present", () => {
    expect(classifySleepPattern(90, 1)).toBe("disrupted");
  });
  it("returns disrupted when asleep rate < 50%", () => {
    expect(classifySleepPattern(40, 0)).toBe("disrupted");
  });
  it("returns variable between 50-79% with no concerns", () => {
    expect(classifySleepPattern(65, 0)).toBe("variable");
  });
});

describe("findEarliestAsleepTime", () => {
  it("returns null when no asleep checks", () => {
    expect(findEarliestAsleepTime([
      makeCheck({ status: "awake" }),
    ])).toBeNull();
  });
  it("returns earliest asleep time", () => {
    expect(findEarliestAsleepTime([
      makeCheck({ status: "asleep", check_time: "00:00" }),
      makeCheck({ status: "asleep", check_time: "22:00" }),
      makeCheck({ status: "awake", check_time: "21:00" }),
    ])).toBe("00:00");
  });
});

// ── Integration Tests ───────────────────────────────────────────────────────

describe("computeNightMonitoring", () => {
  describe("empty state", () => {
    it("returns safe defaults with no data", () => {
      const result = computeNightMonitoring({
        children: [],
        welfareChecks: [],
        welfareRounds: [],
        today: TODAY,
      });
      expect(result.overview.total_rounds_7d).toBe(0);
      expect(result.overview.avg_rounds_per_night).toBe(0);
      expect(result.child_profiles).toHaveLength(0);
      expect(result.alerts).toHaveLength(0);
      expect(result.insights).toHaveLength(0);
    });
  });

  describe("overview", () => {
    it("counts rounds within 7 and 30 days", () => {
      const result = computeNightMonitoring({
        children: [makeChild("yp_1", "Alex")],
        welfareChecks: [],
        welfareRounds: [
          makeRound({ id: "r1", round_date: daysFromToday(-1) }),
          makeRound({ id: "r2", round_date: daysFromToday(-3) }),
          makeRound({ id: "r3", round_date: daysFromToday(-15) }),
          makeRound({ id: "r4", round_date: daysFromToday(-40) }),
        ],
        today: TODAY,
      });
      expect(result.overview.total_rounds_7d).toBe(2);
      expect(result.overview.total_rounds_30d).toBe(3);
    });

    it("calculates average rounds per night", () => {
      const result = computeNightMonitoring({
        children: [makeChild("yp_1", "Alex")],
        welfareChecks: [],
        welfareRounds: [
          makeRound({ id: "r1", round_date: daysFromToday(-1), round_time: "22:00" }),
          makeRound({ id: "r2", round_date: daysFromToday(-1), round_time: "00:00" }),
          makeRound({ id: "r3", round_date: daysFromToday(-1), round_time: "02:00" }),
          makeRound({ id: "r4", round_date: daysFromToday(-1), round_time: "04:00" }),
          makeRound({ id: "r5", round_date: daysFromToday(-1), round_time: "06:00" }),
          makeRound({ id: "r6", round_date: daysFromToday(-2), round_time: "22:00" }),
          makeRound({ id: "r7", round_date: daysFromToday(-2), round_time: "00:00" }),
          makeRound({ id: "r8", round_date: daysFromToday(-2), round_time: "02:00" }),
          makeRound({ id: "r9", round_date: daysFromToday(-2), round_time: "04:00" }),
          makeRound({ id: "r10", round_date: daysFromToday(-2), round_time: "06:00" }),
        ],
        today: TODAY,
      });
      // 10 rounds / 2 nights = 5.0
      expect(result.overview.avg_rounds_per_night).toBe(5);
    });

    it("calculates all children checked rate", () => {
      const result = computeNightMonitoring({
        children: [makeChild("yp_1", "Alex")],
        welfareChecks: [],
        welfareRounds: [
          makeRound({ id: "r1", round_date: daysFromToday(-1), all_children_checked: true }),
          makeRound({ id: "r2", round_date: daysFromToday(-2), all_children_checked: true }),
          makeRound({ id: "r3", round_date: daysFromToday(-3), all_children_checked: false }),
        ],
        today: TODAY,
      });
      // 2/3 = 67%
      expect(result.overview.all_children_checked_rate).toBe(67);
    });

    it("counts concerns and not-in-room checks", () => {
      const result = computeNightMonitoring({
        children: [makeChild("yp_1", "Alex")],
        welfareChecks: [
          makeCheck({ id: "c1", check_date: daysFromToday(-1), has_concern: true }),
          makeCheck({ id: "c2", check_date: daysFromToday(-2), status: "not_in_room" }),
          makeCheck({ id: "c3", check_date: daysFromToday(-3), physical_marks_noted: true }),
          makeCheck({ id: "c4", check_date: daysFromToday(-10) }), // outside 7d
        ],
        welfareRounds: [],
        today: TODAY,
      });
      expect(result.overview.concern_count_7d).toBe(1);
      expect(result.overview.not_in_room_count_7d).toBe(1);
      expect(result.overview.physical_marks_count_7d).toBe(1);
    });
  });

  describe("child profiles", () => {
    it("calculates per-child sleep stats", () => {
      const result = computeNightMonitoring({
        children: [makeChild("yp_1", "Alex"), makeChild("yp_2", "Jordan")],
        welfareChecks: [
          // Alex: 4 asleep, 1 awake = 80% asleep
          makeCheck({ id: "c1", child_id: "yp_1", check_date: daysFromToday(-1), check_time: "22:00", status: "awake" }),
          makeCheck({ id: "c2", child_id: "yp_1", check_date: daysFromToday(-1), check_time: "00:00", status: "asleep" }),
          makeCheck({ id: "c3", child_id: "yp_1", check_date: daysFromToday(-1), check_time: "02:00", status: "asleep" }),
          makeCheck({ id: "c4", child_id: "yp_1", check_date: daysFromToday(-1), check_time: "04:00", status: "asleep" }),
          makeCheck({ id: "c5", child_id: "yp_1", check_date: daysFromToday(-1), check_time: "06:00", status: "asleep" }),
          // Jordan: all asleep
          makeCheck({ id: "c6", child_id: "yp_2", check_date: daysFromToday(-1), check_time: "22:00", status: "asleep" }),
          makeCheck({ id: "c7", child_id: "yp_2", check_date: daysFromToday(-1), check_time: "00:00", status: "asleep" }),
          makeCheck({ id: "c8", child_id: "yp_2", check_date: daysFromToday(-1), check_time: "02:00", status: "asleep" }),
        ],
        welfareRounds: [],
        today: TODAY,
      });

      const alex = result.child_profiles.find((c) => c.child_id === "yp_1")!;
      expect(alex.checks_7d).toBe(5);
      expect(alex.asleep_rate).toBe(80);
      expect(alex.sleep_pattern).toBe("settled");

      const jordan = result.child_profiles.find((c) => c.child_id === "yp_2")!;
      expect(jordan.asleep_rate).toBe(100);
      expect(jordan.sleep_pattern).toBe("settled");
    });

    it("classifies disrupted sleep pattern when concerns present", () => {
      const result = computeNightMonitoring({
        children: [makeChild("yp_1", "Alex")],
        welfareChecks: [
          makeCheck({ id: "c1", child_id: "yp_1", check_date: daysFromToday(-1), status: "asleep", has_concern: true }),
          makeCheck({ id: "c2", child_id: "yp_1", check_date: daysFromToday(-1), status: "asleep" }),
        ],
        welfareRounds: [],
        today: TODAY,
      });
      expect(result.child_profiles[0].sleep_pattern).toBe("disrupted");
      expect(result.child_profiles[0].concern_count_7d).toBe(1);
    });

    it("classifies variable sleep pattern", () => {
      const result = computeNightMonitoring({
        children: [makeChild("yp_1", "Alex")],
        welfareChecks: [
          // 3 asleep, 2 awake = 60% → variable
          makeCheck({ id: "c1", child_id: "yp_1", check_date: daysFromToday(-1), status: "asleep" }),
          makeCheck({ id: "c2", child_id: "yp_1", check_date: daysFromToday(-1), status: "asleep" }),
          makeCheck({ id: "c3", child_id: "yp_1", check_date: daysFromToday(-1), status: "asleep" }),
          makeCheck({ id: "c4", child_id: "yp_1", check_date: daysFromToday(-2), status: "awake" }),
          makeCheck({ id: "c5", child_id: "yp_1", check_date: daysFromToday(-2), status: "awake" }),
        ],
        welfareRounds: [],
        today: TODAY,
      });
      expect(result.child_profiles[0].sleep_pattern).toBe("variable");
    });
  });

  describe("staffing analysis", () => {
    it("counts shift types and unique staff", () => {
      const result = computeNightMonitoring({
        children: [makeChild("yp_1", "Alex")],
        welfareChecks: [],
        welfareRounds: [
          makeRound({ id: "r1", round_date: daysFromToday(-1), staff_id: "staff_a", shift_type: "sleep_in" }),
          makeRound({ id: "r2", round_date: daysFromToday(-1), staff_id: "staff_a", shift_type: "sleep_in" }),
          makeRound({ id: "r3", round_date: daysFromToday(-2), staff_id: "staff_b", shift_type: "waking_night" }),
          makeRound({ id: "r4", round_date: daysFromToday(-2), staff_id: "staff_b", shift_type: "waking_night" }),
        ],
        today: TODAY,
      });
      expect(result.staffing.sleep_in_count).toBe(2);
      expect(result.staffing.waking_night_count).toBe(2);
      expect(result.staffing.unique_staff_7d).toBe(2);
      expect(result.staffing.total_nights_7d).toBe(2);
    });
  });

  describe("security compliance", () => {
    it("calculates security metrics from rounds", () => {
      const result = computeNightMonitoring({
        children: [makeChild("yp_1", "Alex")],
        welfareChecks: [],
        welfareRounds: [
          makeRound({ id: "r1", round_date: daysFromToday(-1), building_secure: true, fire_exits_clear: true, external_doors_locked: true }),
          makeRound({ id: "r2", round_date: daysFromToday(-2), building_secure: true, fire_exits_clear: true, external_doors_locked: false }),
          makeRound({ id: "r3", round_date: daysFromToday(-3), building_secure: false, fire_exits_clear: true, external_doors_locked: true }),
        ],
        today: TODAY,
      });
      expect(result.security.rounds_with_building_secure).toBe(2);
      expect(result.security.rounds_with_exits_clear).toBe(3);
      expect(result.security.rounds_with_doors_locked).toBe(2);
      // (2 + 3 + 2) / (3 * 3) = 7/9 = 78%
      expect(result.security.overall_compliance_rate).toBe(78);
    });
  });

  describe("alerts", () => {
    it("generates critical alert for child not in room", () => {
      const result = computeNightMonitoring({
        children: [makeChild("yp_1", "Alex")],
        welfareChecks: [
          makeCheck({ id: "c1", child_id: "yp_1", check_date: daysFromToday(-1), status: "not_in_room" }),
        ],
        welfareRounds: [],
        today: TODAY,
      });
      const critical = result.alerts.filter((a) => a.severity === "critical" && a.message.includes("not found"));
      expect(critical.length).toBe(1);
      expect(critical[0].message).toContain("Alex");
    });

    it("generates critical alert for physical marks", () => {
      const result = computeNightMonitoring({
        children: [makeChild("yp_1", "Alex")],
        welfareChecks: [
          makeCheck({ id: "c1", check_date: daysFromToday(-1), physical_marks_noted: true }),
        ],
        welfareRounds: [],
        today: TODAY,
      });
      const marks = result.alerts.filter((a) => a.message.includes("Physical marks"));
      expect(marks.length).toBe(1);
    });

    it("generates high alert for concerns", () => {
      const result = computeNightMonitoring({
        children: [makeChild("yp_1", "Alex")],
        welfareChecks: [
          makeCheck({ id: "c1", check_date: daysFromToday(-1), has_concern: true }),
          makeCheck({ id: "c2", check_date: daysFromToday(-2), has_concern: true }),
        ],
        welfareRounds: [],
        today: TODAY,
      });
      const high = result.alerts.filter((a) => a.severity === "high");
      expect(high.length).toBe(1);
      expect(high[0].message).toContain("2 concerns");
    });

    it("generates medium alert for incomplete rounds", () => {
      const result = computeNightMonitoring({
        children: [makeChild("yp_1", "Alex")],
        welfareChecks: [],
        welfareRounds: [
          makeRound({ id: "r1", round_date: daysFromToday(-1), all_children_checked: false }),
        ],
        today: TODAY,
      });
      const medium = result.alerts.filter((a) => a.message.includes("not all children"));
      expect(medium.length).toBe(1);
    });

    it("generates low alert for insufficient rounds per night", () => {
      const result = computeNightMonitoring({
        children: [makeChild("yp_1", "Alex")],
        welfareChecks: [],
        welfareRounds: [
          makeRound({ id: "r1", round_date: daysFromToday(-1) }),
          makeRound({ id: "r2", round_date: daysFromToday(-1) }),
          makeRound({ id: "r3", round_date: daysFromToday(-1) }),
        ],
        today: TODAY,
      });
      // 3 rounds / 1 night = 3 avg < 4
      const low = result.alerts.filter((a) => a.severity === "low");
      expect(low.length).toBe(1);
      expect(low[0].message).toContain("3");
    });
  });

  describe("ARIA insights", () => {
    it("generates critical insight for missing from room", () => {
      const result = computeNightMonitoring({
        children: [makeChild("yp_1", "Alex")],
        welfareChecks: [
          makeCheck({ id: "c1", check_date: daysFromToday(-1), status: "not_in_room" }),
        ],
        welfareRounds: [],
        today: TODAY,
      });
      const critical = result.insights.filter((i) => i.severity === "critical");
      expect(critical.length).toBe(1);
      expect(critical[0].text).toContain("not in room");
    });

    it("generates warning for disrupted sleep", () => {
      const result = computeNightMonitoring({
        children: [makeChild("yp_1", "Alex")],
        welfareChecks: [
          makeCheck({ id: "c1", child_id: "yp_1", check_date: daysFromToday(-1), has_concern: true }),
          makeCheck({ id: "c2", child_id: "yp_1", check_date: daysFromToday(-1), status: "asleep" }),
        ],
        welfareRounds: [],
        today: TODAY,
      });
      const warning = result.insights.filter((i) => i.text.includes("disrupted sleep"));
      expect(warning.length).toBe(1);
      expect(warning[0].text).toContain("Alex");
    });

    it("generates positive insight for excellent monitoring", () => {
      const rounds = Array.from({ length: 10 }, (_, i) =>
        makeRound({
          id: `r${i}`,
          round_date: daysFromToday(-(Math.floor(i / 5) + 1)),
          all_children_checked: true,
          building_secure: true,
          fire_exits_clear: true,
          external_doors_locked: true,
        }),
      );
      const result = computeNightMonitoring({
        children: [makeChild("yp_1", "Alex")],
        welfareChecks: [],
        welfareRounds: rounds,
        today: TODAY,
      });
      const positive = result.insights.filter((i) => i.text.includes("exemplary"));
      expect(positive.length).toBe(1);
    });

    it("generates positive insight when all children settled", () => {
      const result = computeNightMonitoring({
        children: [makeChild("yp_1", "Alex"), makeChild("yp_2", "Jordan")],
        welfareChecks: [
          // Both children 100% asleep across multiple checks
          makeCheck({ id: "c1", child_id: "yp_1", check_date: daysFromToday(-1), status: "asleep" }),
          makeCheck({ id: "c2", child_id: "yp_1", check_date: daysFromToday(-1), status: "asleep" }),
          makeCheck({ id: "c3", child_id: "yp_1", check_date: daysFromToday(-1), status: "asleep" }),
          makeCheck({ id: "c4", child_id: "yp_1", check_date: daysFromToday(-1), status: "asleep" }),
          makeCheck({ id: "c5", child_id: "yp_1", check_date: daysFromToday(-1), status: "asleep" }),
          makeCheck({ id: "c6", child_id: "yp_2", check_date: daysFromToday(-1), status: "asleep" }),
          makeCheck({ id: "c7", child_id: "yp_2", check_date: daysFromToday(-1), status: "asleep" }),
          makeCheck({ id: "c8", child_id: "yp_2", check_date: daysFromToday(-1), status: "asleep" }),
          makeCheck({ id: "c9", child_id: "yp_2", check_date: daysFromToday(-1), status: "asleep" }),
          makeCheck({ id: "c10", child_id: "yp_2", check_date: daysFromToday(-1), status: "asleep" }),
        ],
        welfareRounds: [],
        today: TODAY,
      });
      const settled = result.insights.filter((i) => i.text.includes("settled sleep patterns"));
      expect(settled.length).toBe(1);
    });
  });

  describe("full Chamberlain House integration", () => {
    it("produces comprehensive output for 3 children over 2 nights", () => {
      const children: ChildInput[] = [
        makeChild("yp_alex", "Alex"),
        makeChild("yp_jordan", "Jordan"),
        makeChild("yp_casey", "Casey"),
      ];

      // 5 rounds per night × 2 nights = 10 rounds
      const nights = [daysFromToday(-1), daysFromToday(-2)];
      const times = ["22:00", "00:00", "02:00", "04:00", "06:00"];
      const staff = ["staff_anna", "staff_lackson"];

      const welfareRounds: WelfareRoundInput[] = nights.flatMap((night, ni) =>
        times.map((time, ti) => makeRound({
          id: `wcr_${ni}_${ti}`,
          round_date: night,
          round_time: time,
          staff_id: staff[ni],
          shift_type: "sleep_in",
        })),
      );

      // Checks per round per child (all settled except Casey at 22:00)
      const welfareChecks: WelfareCheckInput[] = nights.flatMap((night, ni) =>
        times.flatMap((time, ti) =>
          children.map((child) => makeCheck({
            id: `wc_${ni}_${ti}_${child.id}`,
            child_id: child.id,
            staff_id: staff[ni],
            check_date: night,
            check_time: time,
            status: child.id === "yp_casey" && time === "22:00" ? "awake" : "asleep",
            mood: child.id === "yp_casey" && time === "22:00" ? "restless" : "settled",
          })),
        ),
      );

      const result = computeNightMonitoring({ children, welfareChecks, welfareRounds, today: TODAY });

      // Overview
      expect(result.overview.total_rounds_7d).toBe(10);
      expect(result.overview.avg_rounds_per_night).toBe(5);
      expect(result.overview.all_children_checked_rate).toBe(100);
      expect(result.overview.building_secure_rate).toBe(100);
      expect(result.overview.concern_count_7d).toBe(0);
      expect(result.overview.not_in_room_count_7d).toBe(0);

      // Child profiles
      expect(result.child_profiles).toHaveLength(3);
      const alex = result.child_profiles.find((c) => c.child_id === "yp_alex")!;
      expect(alex.asleep_rate).toBe(100);
      expect(alex.sleep_pattern).toBe("settled");

      const casey = result.child_profiles.find((c) => c.child_id === "yp_casey")!;
      // 8 asleep + 2 awake = 80% → settled
      expect(casey.asleep_rate).toBe(80);
      expect(casey.sleep_pattern).toBe("settled");

      // Security — all 100%
      expect(result.security.overall_compliance_rate).toBe(100);

      // Staffing
      expect(result.staffing.total_nights_7d).toBe(2);
      expect(result.staffing.unique_staff_7d).toBe(2);

      // Positive insight for settled sleep + exemplary monitoring
      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.length).toBeGreaterThanOrEqual(1);

      // No critical/high alerts
      const critical = result.alerts.filter((a) => a.severity === "critical" || a.severity === "high");
      expect(critical.length).toBe(0);
    });
  });
});
