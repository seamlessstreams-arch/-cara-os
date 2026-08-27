import { describe, it, expect } from "vitest";
import { composeWeeklyReport, type WeeklyReportInput } from "../weekly-report";
import { getWeeklyIntelligenceObject } from "../get-weekly-intelligence-object";
import { getStore } from "@/lib/db/store";

// `store.behaviourLog` spells a concerning entry "concern"; this report used to
// filter for "concerning", a word no store row carries. The section found no
// events and fell through to its empty branch — telling the child there was
// "nothing of real concern" in a week that had some.

const CHILD = "yp_alex";

function reportWith(direction: string) {
  const store = getStore();
  const now = new Date().toISOString();
  const end = now.slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  const wio = getWeeklyIntelligenceObject(CHILD, end, now, 7, "week");
  expect(wio).toBeTruthy();

  const input: WeeklyReportInput = {
    childId: CHILD,
    childName: "Alex",
    now,
    weekEnding: end,
    windowDays: 7,
    wio: wio!,
    dailyLogs: [],
    positiveAchievements: [],
    incidents: [],
    behaviourLog: [
      {
        id: "beh_vocab_test",
        child_id: CHILD,
        date: yesterday,
        direction,
        trigger: "a change of plan",
        outcome: "settled with support",
      },
    ],
    familyTimeSessions: [],
    educationRecords: [],
    medications: [],
    activities: [],
    healthRecordEntries: [],
    ypFeedback: [],
    keyWorkingSessions: [],
  };
  void store;
  return composeWeeklyReport(input);
}

function struggledBody(direction: string): string {
  const r = reportWith(direction);
  const s = r.sections.find((x) => x.heading.toLowerCase().includes("struggled"));
  expect(s).toBeTruthy();
  return s!.body;
}

describe("the weekly report reads the vocabulary the store writes", () => {
  it("a store-spelled concerning entry reaches the child's struggled section", () => {
    const body = struggledBody("concern");
    expect(body).not.toMatch(/nothing of real concern/i);
    expect(body).toContain("a change of plan");
  });

  it("a positive entry is still left out of it", () => {
    expect(struggledBody("positive")).toMatch(/nothing of real concern/i);
  });
});
