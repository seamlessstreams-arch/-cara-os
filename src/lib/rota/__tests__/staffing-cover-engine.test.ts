import { describe, expect, it } from "vitest";
import {
  analyseStaffingCover,
  DEFAULT_STAFFING_POLICY,
  type CoverAssignment,
  type StaffingCoverInput,
} from "../staffing-cover-engine";

const D = "2026-06-15";

function input(over: Partial<StaffingCoverInput> = {}): StaffingCoverInput {
  return {
    today: D,
    range: { from: D, to: D },
    assignments: [],
    unavailable: new Set<string>(),
    policy: { ...DEFAULT_STAFFING_POLICY }, // min day 2/night 1, expected day 2/night 1, waking required
    coverNotes: [],
    resolveStaff: (id) => `Staff ${id}`,
    ...over,
  };
}
function a(staff_id: string, period: "day" | "night", over: Partial<CoverAssignment> = {}): CoverAssignment {
  return { date: D, period, staff_id, shift_type: period === "night" ? "waking_night" : "day", is_open: false, ...over };
}
const day = (r: ReturnType<typeof analyseStaffingCover>) => r.periods.find((p) => p.period === "day")!;
const night = (r: ReturnType<typeof analyseStaffingCover>) => r.periods.find((p) => p.period === "night")!;

describe("analyseStaffingCover — under cover", () => {
  it("flags below-minimum day cover as under, severity by shortfall", () => {
    // night is covered so only the day period is under
    const r = analyseStaffingCover(input({ assignments: [a("s1", "day"), a("n1", "night", { shift_type: "waking_night" })] })); // day 1 vs min 2
    expect(day(r).status).toBe("under");
    expect(day(r).shortfall).toBe(1);
    expect(day(r).severity).toBe("high");
    expect(r.summary.days_under).toBe(1);
  });
  it("zero cover is critical", () => {
    const r = analyseStaffingCover(input());
    expect(day(r).effective).toBe(0);
    expect(day(r).severity).toBe("critical");
  });
});

describe("analyseStaffingCover — phantom cover (the rota-blindness case)", () => {
  it("subtracts a scheduled staffer who is on leave/sick, exposing the hidden gap", () => {
    const r = analyseStaffingCover(input({
      assignments: [a("s1", "day"), a("s2", "day")], // looks like 2 (meets min)
      unavailable: new Set([`s2|${D}`]), // but s2 is actually off
    }));
    expect(day(r).effective).toBe(1); // real cover is 1
    expect(day(r).phantom).toBe(1);
    expect(day(r).phantom_names).toEqual(["Staff s2"]);
    expect(day(r).status).toBe("under"); // the gap is surfaced, not hidden
  });
});

describe("analyseStaffingCover — open shifts are not cover", () => {
  it("ignores unfilled shifts when counting effective cover", () => {
    const r = analyseStaffingCover(input({ assignments: [a("s1", "day"), a("open", "day", { is_open: true })] }));
    expect(day(r).effective).toBe(1);
    expect(day(r).open).toBe(1);
    expect(day(r).status).toBe("under");
    expect(r.summary.open_shift_periods).toBe(1);
  });
});

describe("analyseStaffingCover — waking night", () => {
  it("flags a night that meets the count but has no waking-night cover", () => {
    const r = analyseStaffingCover(input({ assignments: [a("s1", "night", { shift_type: "sleep_in" })] })); // meets min 1, but sleep-in only
    expect(night(r).effective).toBe(1);
    expect(night(r).has_waking_night).toBe(false);
    expect(night(r).status).toBe("no_waking_night");
    expect(r.summary.nights_no_waking).toBe(1);
  });
  it("a waking-night shift satisfies the requirement", () => {
    const r = analyseStaffingCover(input({ assignments: [a("s1", "night", { shift_type: "waking_night" })] }));
    expect(night(r).status).toBe("met");
  });
});

describe("analyseStaffingCover — over cover & reasons", () => {
  it("flags over-the-norm cover with no reason as 'over_unexplained'", () => {
    const r = analyseStaffingCover(input({ assignments: [a("s1", "day"), a("s2", "day"), a("s3", "day")] })); // 3 vs expected 2
    expect(day(r).effective).toBe(3);
    expect(day(r).excess).toBe(1);
    expect(day(r).status).toBe("over_unexplained");
    expect(day(r).severity).toBe("attention");
    expect(r.summary.over_unexplained).toBe(1);
  });
  it("a logged reason turns over-cover into 'over_explained' (ok)", () => {
    const r = analyseStaffingCover(input({
      assignments: [a("s1", "day"), a("s2", "day"), a("s3", "day")],
      coverNotes: [{ date: D, period: "day", reason: "shadow_shift", comment: "New starter shadowing" }],
    }));
    expect(day(r).status).toBe("over_explained");
    expect(day(r).reason).toBe("shadow_shift");
    expect(day(r).message).toContain("shadow shift");
    expect(r.summary.over_unexplained).toBe(0);
  });
});

describe("analyseStaffingCover — met & forward scan", () => {
  it("reports a clean range and an empty attention list", () => {
    const r = analyseStaffingCover(input({ assignments: [a("s1", "day"), a("s2", "day"), a("s1", "night", { shift_type: "waking_night" })] }));
    expect(day(r).status).toBe("met");
    expect(night(r).status).toBe("met");
    expect(r.attention).toHaveLength(0);
    expect(r.headline).toBe("Cover looks complete across the range");
  });

  it("scans a multi-day range and ranks attention worst-first", () => {
    const r = analyseStaffingCover(input({
      range: { from: "2026-06-15", to: "2026-06-16" },
      assignments: [
        // 15th day: 0 staff → critical under
        // 16th day: 3 staff → over_unexplained (attention)
        a("s1", "day", { date: "2026-06-16" }), a("s2", "day", { date: "2026-06-16" }), a("s3", "day", { date: "2026-06-16" }),
      ],
    }));
    expect(r.periods.length).toBe(4); // 2 days × 2 periods
    expect(r.attention[0].severity).toBe("critical"); // the 15th under-cover ranks first
  });
});
