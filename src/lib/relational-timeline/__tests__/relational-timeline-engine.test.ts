import { describe, it, expect } from "vitest";
import {
  buildRelationalTimeline,
  type RelationalTimelineInput,
} from "../relational-timeline-engine";

// Minimal fixtures — cast partials to the collection types (only the fields the
// engine reads need to be present). `now` is injected for determinism.
const NOW = "2026-06-22T12:00:00.000Z";

function baseInput(over: Partial<RelationalTimelineInput> = {}): RelationalTimelineInput {
  return {
    childId: "child-alex",
    childName: "Alex",
    now: NOW,
    keyWorkingSessions: [],
    debriefRecords: [],
    incidents: [],
    familyTimeSessions: [],
    missingEpisodes: [],
    returnInterviews: [],
    positiveAchievements: [],
    educationRecords: [],
    lacReviews: [],
    trustedAdults: [],
    staffName: (id) => ({ "staff-emma": "Emma", "staff-tom": "Tom" }[id] ?? id),
    ...over,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const kw = (o: any) => o;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const inc = (o: any) => o;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const deb = (o: any) => o;

describe("buildRelationalTimeline", () => {
  it("projects key-work as a connection moment and captures child voice + mood", () => {
    const t = buildRelationalTimeline(
      baseInput({
        keyWorkingSessions: [
          kw({
            id: "kw1",
            child_id: "child-alex",
            staff_id: "staff-emma",
            date: "2026-06-20",
            type: "one_to_one",
            child_voice: "I felt listened to.",
            worker_observations: "Settled, made eye contact.",
            topics: ["school"],
            mood_before: 2,
            mood_after: 4,
          }),
        ],
        trustedAdults: ["Emma"],
      }),
    );

    expect(t.moments).toHaveLength(1);
    const m = t.moments[0];
    expect(m.lens).toBe("breakthrough"); // mood improved by 2
    expect(m.childVoice).toBe("I felt listened to.");
    expect(m.moodShift).toEqual({ before: 2, after: 4 });
    expect(m.trustedAdultPresent).toBe(true);
    expect(m.staffNames).toContain("Emma");
  });

  it("only includes moments for the requested child", () => {
    const t = buildRelationalTimeline(
      baseInput({
        keyWorkingSessions: [
          kw({ id: "a", child_id: "child-alex", staff_id: "staff-emma", date: "2026-06-01", mood_before: 3, mood_after: 3 }),
          kw({ id: "b", child_id: "child-jordan", staff_id: "staff-emma", date: "2026-06-02", mood_before: 3, mood_after: 3 }),
        ],
      }),
    );
    expect(t.moments).toHaveLength(1);
    expect(t.moments[0].sourceId).toBe("a");
  });

  it("sorts newest-first", () => {
    const t = buildRelationalTimeline(
      baseInput({
        positiveAchievements: [
          { id: "p1", child_id: "child-alex", date: "2026-06-01", title: "Old", description: "" } as never,
          { id: "p2", child_id: "child-alex", date: "2026-06-15", title: "New", description: "" } as never,
        ],
      }),
    );
    expect(t.moments.map((m) => m.sourceId)).toEqual(["p2", "p1"]);
  });

  it("rates a child with trusted adults, recent connection and repair as SECURE", () => {
    const t = buildRelationalTimeline(
      baseInput({
        trustedAdults: ["Emma"],
        keyWorkingSessions: [
          kw({ id: "k1", child_id: "child-alex", staff_id: "staff-emma", date: "2026-06-18", mood_before: 3, mood_after: 4 }),
          kw({ id: "k2", child_id: "child-alex", staff_id: "staff-emma", date: "2026-06-10", mood_before: 3, mood_after: 4 }),
        ],
        incidents: [inc({ id: "i1", child_id: "child-alex", date: "2026-06-12", type: "behaviour", severity: "low", description: "x", reported_by: "staff-tom" })],
        debriefRecords: [deb({ id: "d1", child_id: "child-alex", date: "2026-06-13", staff_involved: ["staff-emma"], what_worked_well: "Talked it through", child_perspective: "I was angry" })],
      }),
    );
    expect(t.stability.status).toBe("secure");
    expect(t.stability.trustedAdults).toEqual(["Emma"]);
    expect(t.stability.keyConnectors[0]).toMatchObject({ name: "Emma" });
    expect(t.stability.repairCount).toBe(1);
    expect(t.stability.ruptureCount).toBe(1);
  });

  it("rates an isolated child with unrepaired rupture as FRAGILE", () => {
    const t = buildRelationalTimeline(
      baseInput({
        trustedAdults: [],
        incidents: [inc({ id: "i1", child_id: "child-alex", date: "2026-06-15", type: "behaviour", severity: "high", description: "x", reported_by: "staff-tom" })],
      }),
    );
    expect(t.stability.status).toBe("fragile");
    expect(t.insights.some((i) => i.key === "no-trusted-adult")).toBe(true);
  });

  it("flags a repair GAP when a recent rupture has no repair recorded", () => {
    const t = buildRelationalTimeline(
      baseInput({
        trustedAdults: ["Emma"],
        keyWorkingSessions: [kw({ id: "k1", child_id: "child-alex", staff_id: "staff-emma", date: "2026-06-18", mood_before: 3, mood_after: 3 })],
        incidents: [inc({ id: "i1", child_id: "child-alex", date: "2026-06-17", type: "behaviour", severity: "medium", description: "x", reported_by: "staff-tom" })],
      }),
    );
    const gap = t.insights.find((i) => i.key === "repair-gap");
    expect(gap).toBeTruthy();
    expect(gap?.tone).toBe("gap");
  });

  it("projects school successes and LAC-review child voice; skips routine records", () => {
    const t = buildRelationalTimeline(
      baseInput({
        educationRecords: [
          { id: "e1", child_id: "child-alex", date: "2026-06-10", record_type: "achievement", title: "Star of the week", details: "Maths" } as never,
          { id: "e2", child_id: "child-alex", date: "2026-06-09", record_type: "attendance", title: "Present" } as never, // routine → skipped
        ],
        lacReviews: [
          { id: "l1", child_id: "child-alex", date: "2026-06-05", child_views: "I want to stay at this school." } as never,
          { id: "l2", child_id: "child-alex", date: "2026-06-04", child_views: "" } as never, // no voice → skipped
        ],
      }),
    );
    const edu = t.moments.find((m) => m.source === "educationRecords");
    expect(edu?.lens).toBe("achievement");
    expect(edu?.title).toContain("School success");
    const lac = t.moments.find((m) => m.source === "lacReviews");
    expect(lac?.lens).toBe("voice");
    expect(lac?.childVoice).toBe("I want to stay at this school.");
    // routine attendance + voiceless review excluded
    expect(t.moments).toHaveLength(2);
  });

  it("computes a relationship direction of travel + monthly buckets", () => {
    const t = buildRelationalTimeline(
      baseInput({
        // recent 60d (NOW=22 Jun): two connection moments; prior 60d: none → improving
        keyWorkingSessions: [
          kw({ id: "k1", child_id: "child-alex", staff_id: "staff-emma", date: "2026-06-10", mood_before: 3, mood_after: 3 }),
          kw({ id: "k2", child_id: "child-alex", staff_id: "staff-emma", date: "2026-05-20", mood_before: 3, mood_after: 3 }),
        ],
      }),
    );
    expect(t.trend.direction).toBe("improving");
    expect(t.trend.monthly.length).toBeGreaterThanOrEqual(2);
    const may = t.trend.monthly.find((m) => m.month === "2026-05");
    expect(may?.connection).toBe(1);
  });

  it("rates direction declining when rupture outpaces connection recently", () => {
    const t = buildRelationalTimeline(
      baseInput({
        incidents: [
          inc({ id: "i1", child_id: "child-alex", date: "2026-06-15", type: "behaviour", severity: "high", description: "x", reported_by: "staff-tom" }),
          inc({ id: "i2", child_id: "child-alex", date: "2026-06-10", type: "behaviour", severity: "high", description: "x", reported_by: "staff-tom" }),
        ],
      }),
    );
    expect(t.trend.direction).toBe("declining");
  });

  it("is deterministic — same input, identical output", () => {
    const input = baseInput({
      keyWorkingSessions: [kw({ id: "k1", child_id: "child-alex", staff_id: "staff-emma", date: "2026-06-18", mood_before: 2, mood_after: 5 })],
    });
    expect(buildRelationalTimeline(input)).toEqual(buildRelationalTimeline(input));
  });

  it("captures the child's own voice from a return home interview", () => {
    // Regression: the RHI projection read a non-existent `interview_notes` field
    // (masked by a cast), so the child's voice was always dropped. It must read
    // the real fields — the child's view on safety and what would help.
    const t = buildRelationalTimeline(
      baseInput({
        returnInterviews: [
          {
            id: "rhi1",
            child_id: "child-alex",
            interview_date: "2026-06-18",
            return_date: "2026-06-17",
            interviewed_by: "staff-emma",
            child_view_on_safety: "I felt safer at my mate's house",
            what_would_help: "Someone to call when it gets too much",
            notes: "Staff summary only",
          } as never,
        ],
      }),
    );
    const voice = t.moments.find((m) => m.lens === "voice");
    expect(voice).toBeDefined();
    expect(voice!.childVoice).toContain("I felt safer at my mate's house");
    expect(voice!.childVoice).toContain("Someone to call when it gets too much");
  });

  it("does not assert a 'declining' trend from a single rupture with no history", () => {
    // Regression: one incident and nothing else yielded direction="declining"
    // (rupture > warmth), manufacturing a downward trajectory from one data point.
    const t = buildRelationalTimeline(
      baseInput({
        incidents: [
          inc({ id: "i1", child_id: "child-alex", date: "2026-06-15", type: "behaviour", severity: "high", description: "x", reported_by: "staff-tom" }),
        ],
      }),
    );
    expect(t.trend.direction).toBe("stable");
  });

  it("does not count a future-dated key-work session as recent connection", () => {
    // Regression: daysBetween used Math.abs, so future-dated moments read as
    // "recent". Two future sessions with a trusted adult must NOT flip the child
    // to 'secure' — there is no recent connection yet.
    const t = buildRelationalTimeline(
      baseInput({
        keyWorkingSessions: [
          kw({ id: "f1", child_id: "child-alex", staff_id: "staff-emma", date: "2026-08-01", mood_before: 3, mood_after: 3 }),
          kw({ id: "f2", child_id: "child-alex", staff_id: "staff-emma", date: "2026-08-05", mood_before: 3, mood_after: 3 }),
        ],
        trustedAdults: ["Emma"],
      }),
    );
    expect(t.stability).not.toBe("secure");
  });
});
