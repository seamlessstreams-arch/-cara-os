import { describe, expect, it } from "vitest";
import { buildDaySchedule, type ScheduleAction, type ScheduleAnchor } from "../day-schedule";

function action(id: string, duration_min: number, over: Partial<ScheduleAction> = {}): ScheduleAction {
  return { id, severity: "high", category: "tasks", title: `Task ${id}`, detail: "", href: "/x", duration_min, ...over };
}

describe("buildDaySchedule", () => {
  it("places anchors at their real times and fills gaps with actions in order", () => {
    const anchors: ScheduleAnchor[] = [{ time: "10:00", duration_min: 60, title: "Team meeting" }];
    const s = buildDaySchedule({
      dayStart: "09:00",
      dayEnd: "17:00",
      anchors,
      actions: [action("a", 30), action("b", 30)],
      lunch: null,
      wrapUpMin: 0,
    });
    const titles = s.blocks.map((b) => `${b.start} ${b.title}`);
    // 09:00 handover (30) → 09:30 Task a → 10:00 Team meeting → 11:00 Task b
    expect(titles[0]).toBe("09:00 Start of shift — handover & review overnight");
    expect(s.blocks.find((b) => b.title === "Team meeting")?.start).toBe("10:00");
    const taskA = s.blocks.find((b) => b.title === "Task a")!;
    expect(taskA.start).toBe("09:30");
    expect(s.blocks.find((b) => b.title === "Task b")!.start).toBe("11:00"); // after the meeting ends
  });

  it("reserves lunch near the preferred time", () => {
    const s = buildDaySchedule({ anchors: [], actions: [], lunch: { at: "13:00", min: 30 }, morningBlockMin: 0, wrapUpMin: 0 });
    const lunch = s.blocks.find((b) => b.kind === "break");
    expect(lunch).toBeTruthy();
    expect(lunch?.start).toBe("13:00");
    expect(lunch?.end).toBe("13:30");
  });

  it("shifts lunch when the preferred slot is taken by an anchor", () => {
    const s = buildDaySchedule({
      anchors: [{ time: "13:00", duration_min: 60, title: "Statutory visit" }],
      actions: [],
      lunch: { at: "13:00", min: 30 },
      morningBlockMin: 0,
      wrapUpMin: 0,
    });
    const lunch = s.blocks.find((b) => b.kind === "break")!;
    expect(lunch.start).not.toBe("13:00");
    // doesn't overlap the 13:00–14:00 visit
    expect(["12:30", "14:00"]).toContain(lunch.start);
  });

  it("carries over actions that don't fit before the day ends", () => {
    // Day 09:00–17:00, morning 30 + wrap 30 + lunch 30 = ~7h of fillable time.
    // 20 actions × 60 min = 20h → most carry over.
    const actions = Array.from({ length: 20 }, (_, i) => action(`t${i}`, 60));
    const s = buildDaySchedule({ anchors: [], actions });
    const scheduledTasks = s.blocks.filter((b) => b.kind === "task").length;
    expect(scheduledTasks).toBeGreaterThan(0);
    expect(scheduledTasks).toBeLessThan(20);
    expect(s.carry_over.length).toBe(20 - scheduledTasks);
  });

  it("never overlaps blocks and stays inside the day window", () => {
    const s = buildDaySchedule({
      anchors: [{ time: "11:00", duration_min: 90, title: "MDT" }, { time: "15:00", duration_min: 60, title: "Supervision" }],
      actions: Array.from({ length: 6 }, (_, i) => action(`t${i}`, 30)),
    });
    const sorted = [...s.blocks].sort((a, b) => a.start.localeCompare(b.start));
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].start >= sorted[i - 1].end).toBe(true); // no overlap
    }
    expect(sorted[0].start >= "09:00").toBe(true);
    expect(sorted[sorted.length - 1].end <= "17:00").toBe(true);
  });

  it("floors the plan at startFrom (planning mid-day)", () => {
    const s = buildDaySchedule({ anchors: [], actions: [action("a", 30)], startFrom: "14:12", morningBlockMin: 0, wrapUpMin: 0, lunch: null });
    // nothing scheduled before 14:15 (rounded up to 5)
    expect(s.blocks.every((b) => b.start >= "14:15")).toBe(true);
  });

  it("drops anchors already fully in the past relative to startFrom", () => {
    const s = buildDaySchedule({ anchors: [{ time: "09:00", duration_min: 60, title: "Early meeting" }], actions: [], startFrom: "11:00", morningBlockMin: 0, wrapUpMin: 0, lunch: null });
    expect(s.blocks.find((b) => b.title === "Early meeting")).toBeUndefined();
  });
});
