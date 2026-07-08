import { describe, it, expect } from "vitest";
import { getWeeklyIntelligenceObject, getAllWeeklyIntelligenceObjects } from "@/lib/cpie/get-weekly-intelligence-object";
import { getChildTwin } from "@/lib/cpie/get-child-twin";
import { buildWeeklyIntelligenceObject } from "@/lib/cpie/weekly-intelligence-object";
import { daysFromNow } from "@/lib/utils";

const d = (n: number) => daysFromNow(n).slice(0, 10);

describe("CPIE — Weekly Intelligence Object (slice 2)", () => {
  it("builds a structured weekly object for Alex, carrying the whole child", () => {
    const w = getWeeklyIntelligenceObject("yp_alex");
    expect(w).toBeTruthy();
    expect(w!.weekStart < w!.weekEnding).toBe(true);
    // Whole-child carry from the twin — never the week in isolation.
    expect(w!.wholeChild.who.toLowerCase()).toContain("football");
    expect(["improving", "stable", "declining", "not yet readable"]).toContain(w!.wholeChild.directionOfTravel);
  });

  it("windows records to the 7 days ending on weekEnding", () => {
    // Alex's celebrated 'walked away from a wind-up' achievement is at -5 days.
    const thisWeek = getWeeklyIntelligenceObject("yp_alex", d(0))!;
    expect(thisWeek.week.achievements.some((a) => /wind-up/i.test(a.title))).toBe(true);
    // The winning-goal achievement is at -12 days — NOT in this week…
    expect(thisWeek.week.achievements.some((a) => /winning goal/i.test(a.title))).toBe(false);
    // …but a week ending ~12 days ago captures it and drops the -5 one.
    const priorWeek = getWeeklyIntelligenceObject("yp_alex", d(-12))!;
    expect(priorWeek.week.achievements.some((a) => /winning goal/i.test(a.title))).toBe(true);
    expect(priorWeek.week.achievements.some((a) => /wind-up/i.test(a.title))).toBe(false);
  });

  it("celebrations reflect achievements marked with a celebration", () => {
    const w = getWeeklyIntelligenceObject("yp_alex", d(0))!;
    expect(w.week.celebrations.length).toBeGreaterThan(0);
  });

  it("emits Quality Standards and Five Outcomes evidence only where evidenced", () => {
    const w = getWeeklyIntelligenceObject("yp_alex", d(0))!;
    // Alex has trusted adults → Positive relationships QS line present.
    expect(w.qualityStandardsEvidence.some((e) => /positive relationships/i.test(e.label))).toBe(true);
    // Every evidence line must actually carry evidence text (no empty scaffold).
    expect(w.qualityStandardsEvidence.every((e) => e.evidence.length > 0)).toBe(true);
    expect(w.fiveOutcomesEvidence.every((e) => e.evidence.length > 0)).toBe(true);
  });

  it("carries honesty fields from the twin (missing info + contradictions)", () => {
    const twin = getChildTwin("yp_alex")!;
    const w = getWeeklyIntelligenceObject("yp_alex", d(0))!;
    expect(w.missingInformation).toEqual(twin.missingInformation.slice(0, 5));
    expect(Array.isArray(w.contradictions)).toBe(true);
    expect(["high", "moderate", "low"]).toContain(w.evidenceConfidence);
  });

  it("is deterministic and contains NO record it wasn't given (pure builder)", () => {
    const twin = getChildTwin("yp_alex")!;
    const empty = buildWeeklyIntelligenceObject({
      twin, now: new Date().toISOString(), weekEnding: d(0),
      positiveAchievements: [], lifeStoryEntries: [], incidents: [], missingEpisodes: [],
      keyWorkingSessions: [], familyTimeSessions: [], dailyLogs: [], behaviourLog: [],
      educationRecords: [], returnInterviews: [],
    });
    // No windowed events → a quiet-week picture, low confidence, but the whole
    // child still carries (the week is never read alone).
    expect(empty.week.achievements.length).toBe(0);
    expect(empty.evidenceConfidence).toBe("low");
    expect(empty.week.picture.toLowerCase()).toContain("quiet week");
    expect(empty.wholeChild.who.toLowerCase()).toContain("football");
  });

  it("chokepoint returns null for an unknown child; getAll covers current children", () => {
    expect(getWeeklyIntelligenceObject("yp_nope")).toBeNull();
    expect(getAllWeeklyIntelligenceObjects().length).toBeGreaterThanOrEqual(3);
  });
});
