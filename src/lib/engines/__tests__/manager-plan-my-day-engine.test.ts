import { describe, expect, it } from "vitest";
import { computeManagerPlanDay, type PlanMyDayInput } from "../manager-plan-my-day-engine";

const TODAY = "2026-06-15";
const NOW = "2026-06-15T08:00:00";

function input(over: Partial<PlanMyDayInput> = {}): PlanMyDayInput {
  return {
    today: TODAY,
    now: NOW,
    manager_name: "Olivia",
    calendar: [],
    tasks: [],
    incidents: [],
    supervisions: [],
    training: [],
    keyworkGaps: [],
    ...over,
  };
}

describe("computeManagerPlanDay — fixed commitments", () => {
  it("orders timed items before all-day and exposes HH:MM", () => {
    const r = computeManagerPlanDay(
      input({
        calendar: [
          { id: "a", title: "All-day thing", start: "2026-06-15T00:00:00", all_day: true, source: "calendar", href: "/calendar?event=a" },
          { id: "m", title: "MDT meeting", start: "2026-06-15T14:00:00", all_day: false, source: "calendar", child_name: "Alex", location: "Office", href: "/calendar?event=m" },
          { id: "g", title: "GP appt", start: "2026-06-15T09:30:00", all_day: false, source: "appointment", href: "/appointments" },
        ],
      }),
    );
    expect(r.fixed.map((f) => f.id)).toEqual(["g", "m", "a"]);
    expect(r.fixed[0].time).toBe("09:30");
    expect(r.fixed[2].time).toBeNull();
    expect(r.fixed[1].subtitle).toBe("Alex · Office");
  });
});

describe("computeManagerPlanDay — priorities", () => {
  it("surfaces incidents awaiting oversight as safeguarding, ranked first", () => {
    const r = computeManagerPlanDay(
      input({
        incidents: [
          { id: "i1", child_name: "Jordan", type: "safeguarding", severity: "medium", date: "2026-06-14", requires_oversight: true, oversight_at: null, status: "open" },
          { id: "i2", type: "near_miss", severity: "low", date: "2026-06-14", requires_oversight: true, oversight_at: "2026-06-14T10:00:00", status: "under_review" }, // already signed off
        ],
      }),
    );
    expect(r.priorities).toHaveLength(1);
    expect(r.priorities[0].category).toBe("safeguarding");
    expect(r.priorities[0].severity).toBe("high"); // safeguarding type lifts medium→high
    expect(r.counts.concerns).toBe(1);
  });

  it("treats overdue tasks as priorities and due-today as watch", () => {
    const r = computeManagerPlanDay(
      input({
        tasks: [
          { id: "t1", title: "Update care plan", due_date: "2026-06-10", status: "in_progress", priority: "high" },
          { id: "t2", title: "File note", due_date: "2026-06-15", status: "not_started", priority: "low" },
          { id: "t3", title: "Done", due_date: "2026-06-09", status: "completed", priority: "high" },
        ],
      }),
    );
    expect(r.priorities.some((p) => p.id === "task_t1" && p.severity === "high")).toBe(true);
    expect(r.watch.some((p) => p.id === "taskd_t2")).toBe(true);
    expect(r.counts.overdue_tasks).toBe(1);
  });

  it("flags overdue supervisions and expired/expiring training", () => {
    const r = computeManagerPlanDay(
      input({
        supervisions: [
          { staff_name: "Marcus", scheduled_date: "2026-06-01", status: "scheduled" },
          { staff_name: "Priya", scheduled_date: "2026-06-20", status: "scheduled" }, // future, not overdue
        ],
        training: [
          { staff_name: "Marcus", course_name: "Safeguarding L2", expiry_date: "2026-06-10", status: "expired" }, // expired
          { staff_name: "Priya", course_name: "First Aid", expiry_date: "2026-06-18", status: "valid" }, // expiring within 7d
          { staff_name: "Sam", course_name: "Food Hygiene", expiry_date: "2026-07-10", status: "valid" }, // within 30d → watch
        ],
      }),
    );
    expect(r.priorities.some((p) => p.title.includes("Supervision overdue — Marcus"))).toBe(true);
    expect(r.priorities.some((p) => p.title.includes("Training expired: Safeguarding L2"))).toBe(true);
    expect(r.priorities.some((p) => p.title.includes("Training expiring: First Aid"))).toBe(true);
    expect(r.watch.some((p) => p.title.includes("expiring this month: Food Hygiene"))).toBe(true);
  });

  it("flags children overdue a key-working session", () => {
    const r = computeManagerPlanDay(
      input({
        keyworkGaps: [
          { child_name: "Alex", last_session_date: "2026-05-20", days_since: 26 },
          { child_name: "Casey", last_session_date: "2026-06-12", days_since: 3 }, // recent → not flagged
          { child_name: "New YP", last_session_date: null, days_since: null }, // never → flagged
        ],
      }),
    );
    const kw = r.priorities.filter((p) => p.category === "keywork");
    expect(kw.map((p) => p.title)).toEqual(expect.arrayContaining(["Key-working due — Alex", "Key-working due — New YP"]));
    expect(kw.some((p) => p.title.includes("Casey"))).toBe(false);
  });

  it("ranks critical before high before medium", () => {
    const r = computeManagerPlanDay(
      input({
        incidents: [{ id: "c", type: "physical_intervention", severity: "critical", date: "2026-06-14", requires_oversight: true, oversight_at: null, status: "open" }],
        keyworkGaps: [{ child_name: "Alex", last_session_date: null, days_since: null }],
        supervisions: [{ staff_name: "M", scheduled_date: "2026-06-01", status: "scheduled" }],
      }),
    );
    const sevs = r.priorities.map((p) => p.severity);
    const rank = { critical: 0, high: 1, medium: 2, low: 3 } as const;
    for (let i = 1; i < sevs.length; i++) {
      expect(rank[sevs[i]]).toBeGreaterThanOrEqual(rank[sevs[i - 1]]);
    }
    expect(sevs[0]).toBe("critical");
  });
});

describe("computeManagerPlanDay — timed schedule", () => {
  it("produces a running order with a handover block and anchors a timed calendar item", () => {
    const r = computeManagerPlanDay(
      input({
        calendar: [{ id: "m", title: "Team meeting", start: "2026-06-15T10:00:00", all_day: false, source: "calendar", href: "/calendar?event=m" }],
        incidents: [{ id: "i", type: "safeguarding", severity: "high", date: "2026-06-14", requires_oversight: true, oversight_at: null, status: "open" }],
        tasks: [{ id: "t1", title: "Update care plan", due_date: "2026-06-10", status: "in_progress", priority: "high" }],
        dayStart: "09:00",
        dayEnd: "17:00",
      }),
    );
    expect(r.schedule.length).toBeGreaterThan(0);
    expect(r.schedule[0].title).toContain("Start of shift");
    // the meeting is anchored at 10:00
    expect(r.schedule.find((b) => b.title === "Team meeting")?.start).toBe("10:00");
    // a lunch break exists
    expect(r.schedule.some((b) => b.kind === "break")).toBe(true);
    // the safeguarding oversight got a time slot
    expect(r.schedule.some((b) => b.kind === "task" && b.category === "safeguarding")).toBe(true);
    expect(r.day_window).toEqual({ start: "09:00", end: "17:00" });
  });
});

describe("computeManagerPlanDay — headline & positives", () => {
  it("writes a clean-day headline and positives when nothing is pressing", () => {
    const r = computeManagerPlanDay(input());
    expect(r.headline).toContain("0 fixed commitments");
    expect(r.positives).toEqual(
      expect.arrayContaining([
        "No incidents awaiting your oversight",
        "No overdue tasks",
        "All supervisions up to date",
        "Key-working is up to date across the home",
      ]),
    );
  });

  it("summarises counts in the headline when busy", () => {
    const r = computeManagerPlanDay(
      input({
        calendar: [{ id: "m", title: "Meeting", start: "2026-06-15T10:00:00", all_day: false, source: "calendar", href: "/x" }],
        incidents: [{ id: "i", type: "safeguarding", severity: "high", date: "2026-06-14", requires_oversight: true, oversight_at: null, status: "open" }],
      }),
    );
    expect(r.headline).toContain("1 fixed commitment");
    expect(r.headline).toContain("1 concern to review");
    expect(r.counts.by_category.find((c) => c.category === "safeguarding")?.count).toBe(1);
  });
});
