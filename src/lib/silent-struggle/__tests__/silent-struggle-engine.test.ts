import { describe, it, expect } from "vitest";
import {
  readSilentStruggle,
  buildSilentStruggleOverview,
  type SilentStruggleInput,
  type SilentStruggleLogEntry,
} from "../silent-struggle-engine";

// The engine's defining property (doctrine 2.2.2): a child who has gone quiet
// generates LESS signal, not less need. Near-zero incidents + declining
// engagement must read as a CONCERN, not "settled". And absence of data is a
// recording gap, never a finding.

const NOW = "2026-07-16T12:00:00Z";
function daysAgo(n: number): string {
  return new Date(Date.parse(NOW) - n * 86_400_000).toISOString().slice(0, 10);
}

let idc = 0;
function log(over: Partial<SilentStruggleLogEntry>): SilentStruggleLogEntry {
  idc += 1;
  return {
    child_id: "yp_test", date: daysAgo(5), entry_type: "general",
    content: "Had a settled day.", mood_score: 7, ...over,
  };
}

function input(over: Partial<SilentStruggleInput> = {}): SilentStruggleInput {
  return { childId: "yp_test", childName: "Test", now: NOW, logs: [], incidentDates: [], ...over };
}

describe("insufficient data is a recording gap, not a finding", () => {
  it("returns 'insufficient' when almost nothing is recorded", () => {
    const r = readSilentStruggle(input({ logs: [log({})] }));
    expect(r.status).toBe("insufficient");
    expect(r.statusReason).toMatch(/recording gap, not a finding/i);
    expect(r.waysIn).toHaveLength(0);
  });
});

describe("the core inversion — quiet and unseen", () => {
  it("flags a child with NO incidents but declining engagement as a concern", () => {
    // Prior window: busy, engaged, positive. Recent: quiet, fewer entries.
    const logs: SilentStruggleLogEntry[] = [
      // prior 21–42 days: 6 entries incl. activities, good mood
      log({ date: daysAgo(40), entry_type: "activity", mood_score: 8, content: "Football club, really enjoyed it." }),
      log({ date: daysAgo(38), entry_type: "contact", mood_score: 7, content: "Good phone call with nan." }),
      log({ date: daysAgo(35), entry_type: "activity", mood_score: 8, content: "Cinema trip." }),
      log({ date: daysAgo(30), entry_type: "general", mood_score: 7, content: "Chatty at dinner." }),
      log({ date: daysAgo(28), entry_type: "activity", mood_score: 7, content: "Baking with staff." }),
      log({ date: daysAgo(24), entry_type: "general", mood_score: 7, content: "Settled evening." }),
      // recent 0–21 days: 2 entries, withdrawn, lower mood, no activities
      log({ date: daysAgo(8), entry_type: "mood", mood_score: 4, content: "Very quiet, kept to themselves most of the day." }),
      log({ date: daysAgo(3), entry_type: "general", mood_score: 4, content: "Declined to join the group; stayed in their room." }),
    ];
    const r = readSilentStruggle(input({ logs, incidentDates: [] }));
    expect(r.status).toBe("concern");
    expect(r.signals.some((s) => s.key === "quiet_and_unseen")).toBe(true);
    expect(r.statusReason).toMatch(/easy to overlook/i);
  });

  it("does NOT add the quiet-and-unseen signal when incidents are present (the distress is not silent)", () => {
    const logs: SilentStruggleLogEntry[] = [
      log({ date: daysAgo(40), entry_type: "activity", mood_score: 8, content: "Enjoyed swimming." }),
      log({ date: daysAgo(35), entry_type: "activity", mood_score: 7, content: "Park." }),
      log({ date: daysAgo(30), entry_type: "general", mood_score: 7, content: "Fine." }),
      log({ date: daysAgo(8), entry_type: "mood", mood_score: 4, content: "Withdrawn and isolating." }),
      log({ date: daysAgo(3), entry_type: "general", mood_score: 4, content: "Very quiet." }),
    ];
    const r = readSilentStruggle(input({ logs, incidentDates: [daysAgo(5)] }));
    expect(r.signals.some((s) => s.key === "quiet_and_unseen")).toBe(false);
  });
});

describe("individual signals", () => {
  function baseline(): SilentStruggleLogEntry[] {
    return [
      log({ date: daysAgo(40), entry_type: "activity", mood_score: 8, content: "Club." }),
      log({ date: daysAgo(37), entry_type: "contact", mood_score: 8, content: "Family call." }),
      log({ date: daysAgo(34), entry_type: "activity", mood_score: 8, content: "Trip." }),
      log({ date: daysAgo(30), entry_type: "general", mood_score: 8, content: "Good day." }),
      log({ date: daysAgo(26), entry_type: "activity", mood_score: 8, content: "Baking." }),
    ];
  }

  it("detects falling log volume", () => {
    const r = readSilentStruggle(input({ logs: [...baseline(), log({ date: daysAgo(5), mood_score: 7, content: "ok" })] }));
    expect(r.signals.some((s) => s.key === "log_volume_falling")).toBe(true);
  });

  it("detects a falling mood trend", () => {
    const logs = [
      ...baseline(),
      log({ date: daysAgo(10), mood_score: 4, content: "low" }),
      log({ date: daysAgo(6), mood_score: 3, content: "low" }),
      log({ date: daysAgo(2), mood_score: 4, content: "low" }),
    ];
    const r = readSilentStruggle(input({ logs }));
    expect(r.signals.some((s) => s.key === "mood_falling")).toBe(true);
  });

  it("detects withdrawal language via word boundaries", () => {
    const logs = [
      ...baseline(),
      log({ date: daysAgo(9), content: "Withdrawn all afternoon." , mood_score: 5}),
      log({ date: daysAgo(4), content: "Kept to themselves; one word answers." , mood_score: 5}),
    ];
    const r = readSilentStruggle(input({ logs }));
    expect(r.signals.some((s) => s.key === "withdrawal_language")).toBe(true);
  });
});

describe("the ways-in are PACE- and neurodiversity-aware", () => {
  it("offers a non-word route for children who can't name feelings", () => {
    const logs = [
      log({ date: daysAgo(40), entry_type: "activity", mood_score: 8, content: "Club." }),
      log({ date: daysAgo(30), entry_type: "activity", mood_score: 8, content: "Trip." }),
      log({ date: daysAgo(9), content: "Very quiet, withdrawn.", mood_score: 4 }),
      log({ date: daysAgo(4), content: "Declined to join; stayed in their room.", mood_score: 4 }),
    ];
    const r = readSilentStruggle(input({ logs }));
    expect(r.waysIn.join(" ")).toMatch(/alexithymia/i);
    expect(r.waysIn.join(" ")).toMatch(/body|scale|colour|show me/i);
  });
});

describe("whole-home rollup", () => {
  it("ranks concern and watch children to the top", () => {
    const settled = readSilentStruggle(input({ childId: "a", logs: [
      log({ child_id: "a", date: daysAgo(30), content: "good" }),
      log({ child_id: "a", date: daysAgo(10), content: "good" }),
      log({ child_id: "a", date: daysAgo(3), content: "good" }),
    ] }));
    const concern = readSilentStruggle(input({ childId: "b", logs: [
      log({ child_id: "b", date: daysAgo(40), entry_type: "activity", mood_score: 8, content: "club" }),
      log({ child_id: "b", date: daysAgo(34), entry_type: "activity", mood_score: 8, content: "trip" }),
      log({ child_id: "b", date: daysAgo(28), entry_type: "general", mood_score: 8, content: "good" }),
      log({ child_id: "b", date: daysAgo(6), content: "withdrawn, very quiet", mood_score: 3 }),
      log({ child_id: "b", date: daysAgo(2), content: "isolating, stayed in their room", mood_score: 3 }),
    ] }));
    const o = buildSilentStruggleOverview([settled, concern]);
    expect(o.needsAttention[0].childId).toBe("b");
    expect(o.counts.concern).toBeGreaterThanOrEqual(1);
  });
});
