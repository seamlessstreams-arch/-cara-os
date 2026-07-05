// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILD VOICE DIMENSIONS & TRENDS TESTS
//
// Pins: child_expressed dimensions come from the CHILD'S OWN sentiment (never
// inferred); "not_asked" is stated rather than guessed; trends read recent-half
// vs prior-half of the window; practice dimensions measure the SETTING; and the
// flagship highlight fires when the voice is RECORDED but the child says they
// aren't HEARD. Every scored dimension cites its records.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { computeChildVoiceDimensions } from "../dimensions-engine";
import type { ChildVoiceDimensionInput } from "../types";

const ASOF = "2026-07-05"; // window 90d → half=45d; recent ≥ 2026-05-21, prior 2026-04-06..05-21

const base = (overrides: Partial<ChildVoiceDimensionInput> = {}): ChildVoiceDimensionInput => ({
  childId: "yp_alex",
  childName: "Alex",
  asOf: ASOF,
  windowDays: 90,
  feedback: [],
  keyWork: [],
  lacReviews: [],
  feedbackLoops: [],
  advocacy: [],
  houseMeetings: [],
  ...overrides,
});

const fb = (o: Partial<ChildVoiceDimensionInput["feedback"][number]>): ChildVoiceDimensionInput["feedback"][number] => ({
  id: "fb_x",
  child_id: "yp_alex",
  date: "2026-06-20",
  category: "general",
  sentiment: "ok",
  response_given_to_child: false,
  child_satisfied: null,
  ...o,
});

describe("child_expressed dimensions — the child's own sentiment", () => {
  it("says 'not_asked' when the child hasn't shared a view on that dimension", () => {
    const p = computeChildVoiceDimensions(base());
    const safe = p.dimensions.find((d) => d.key === "feeling_safe")!;
    expect(safe.status).toBe("not_asked");
    expect(safe.score).toBeNull();
    expect(safe.note).toMatch(/hasn't shared a view/i);
  });

  it("scores 'feeling safe' from the child's expressed sentiment and cites the records", () => {
    const p = computeChildVoiceDimensions(
      base({
        feedback: [
          fb({ id: "fb_1", category: "feeling_safe", sentiment: "very_happy", date: "2026-06-20" }),
          fb({ id: "fb_2", category: "feeling_safe", sentiment: "happy", date: "2026-06-28" }),
        ],
      }),
    );
    const safe = p.dimensions.find((d) => d.key === "feeling_safe")!;
    expect(safe.score).toBeGreaterThanOrEqual(70);
    expect(safe.status).toBe("strong");
    expect(safe.sources.map((s) => s.recordId)).toEqual(["fb_1", "fb_2"]);
  });

  it("reads a DECLINING trend when the child's sentiment falls across the window", () => {
    const p = computeChildVoiceDimensions(
      base({
        feedback: [
          // prior half (older): happy/very_happy
          fb({ id: "p1", category: "being_listened_to", sentiment: "very_happy", date: "2026-04-20" }),
          fb({ id: "p2", category: "being_listened_to", sentiment: "happy", date: "2026-05-01" }),
          // recent half: unhappy
          fb({ id: "r1", category: "being_listened_to", sentiment: "unhappy", date: "2026-06-20" }),
          fb({ id: "r2", category: "being_listened_to", sentiment: "very_unhappy", date: "2026-07-01" }),
        ],
      }),
    );
    const listened = p.dimensions.find((d) => d.key === "feeling_listened_to")!;
    expect(listened.trend).toBe("declining");
    expect(listened.status).toBe("needs_attention");
  });
});

describe("practice dimensions — the setting", () => {
  it("voice_captured rewards breadth across channels and cites them", () => {
    const p = computeChildVoiceDimensions(
      base({
        keyWork: [{ id: "kw1", child_id: "yp_alex", date: "2026-06-20", child_voice: "I want to see my sister" }],
        lacReviews: [{ id: "lac1", child_id: "yp_alex", date: "2026-06-10", child_participation: "attended", child_views: "..." }],
        feedbackLoops: [{ id: "loop1", child_id: "yp_alex", feedback_date: "2026-06-15", child_words: "the food", decision_made: "acted_on_in_full", child_accepts: true }],
        feedback: [fb({ id: "fb_1", category: "activities", sentiment: "happy", date: "2026-06-25" })],
      }),
    );
    const cap = p.dimensions.find((d) => d.key === "voice_captured")!;
    expect(cap.score).toBeGreaterThan(35);
    expect(cap.sources.length).toBeGreaterThanOrEqual(4);
    expect(cap.sources.map((s) => s.recordType)).toContain("keyWorkingSessions");
    expect(cap.sources.map((s) => s.recordType)).toContain("lacReviews");
  });

  it("flags a silent child (no voice recorded in-window) as needs_attention + a watch highlight", () => {
    const p = computeChildVoiceDimensions(base());
    const cap = p.dimensions.find((d) => d.key === "voice_captured")!;
    expect(cap.status).toBe("needs_attention");
    expect(cap.note).toMatch(/no voice was recorded/i);
    expect(p.highlights.some((h) => h.id === "silent_child")).toBe(true);
  });

  it("voice_influence counts closed loops vs still-open ones", () => {
    const p = computeChildVoiceDimensions(
      base({
        feedbackLoops: [
          { id: "l1", child_id: "yp_alex", feedback_date: "2026-06-10", child_words: "a", decision_made: "acted_on_in_full", child_accepts: true },
          { id: "l2", child_id: "yp_alex", feedback_date: "2026-06-12", child_words: "b", decision_made: "pending_consideration", child_accepts: false },
        ],
      }),
    );
    const inf = p.dimensions.find((d) => d.key === "voice_influence")!;
    expect(inf.score).toBe(50); // 1 of 2 closed
    expect(inf.note).toMatch(/still open/i);
  });

  it("advocacy_access reports honestly when nothing is on record", () => {
    const p = computeChildVoiceDimensions(base());
    const adv = p.dimensions.find((d) => d.key === "advocacy_access")!;
    expect(adv.status).toBe("needs_attention");
    expect(adv.note).toMatch(/no independent advocacy/i);
  });
});

describe("highlights — critical-friend, most severe first", () => {
  it("fires the flagship dissonance: voice RECORDED but child not HEARD", () => {
    const p = computeChildVoiceDimensions(
      base({
        // voice captured widely
        keyWork: [
          { id: "kw1", child_id: "yp_alex", date: "2026-06-20", child_voice: "..." },
          { id: "kw2", child_id: "yp_alex", date: "2026-06-27", child_voice: "..." },
        ],
        lacReviews: [{ id: "lac1", child_id: "yp_alex", date: "2026-06-10", child_participation: "attended", child_views: "..." }],
        feedbackLoops: [{ id: "loop1", child_id: "yp_alex", feedback_date: "2026-06-15", child_words: "x", decision_made: "acted_on_in_full", child_accepts: true }],
        // but child says they aren't listened to
        feedback: [
          fb({ id: "fb_1", category: "being_listened_to", sentiment: "unhappy", date: "2026-06-20" }),
          fb({ id: "fb_2", category: "being_listened_to", sentiment: "very_unhappy", date: "2026-06-28" }),
        ],
      }),
    );
    const flag = p.highlights.find((h) => h.id === "listened_to_gap");
    expect(flag).toBeTruthy();
    expect(flag!.severity).toBe("priority");
    expect(flag!.dimensions).toContain("feeling_listened_to");
    expect(flag!.dimensions).toContain("voice_captured");
    // priority highlights sort before any strength
    expect(p.highlights[0].severity).toBe("priority");
  });

  it("surfaces the child's own safety voice as the top priority, never softened away", () => {
    const p = computeChildVoiceDimensions(
      base({
        feedback: [
          fb({ id: "s1", category: "feeling_safe", sentiment: "very_unhappy", date: "2026-06-20" }),
          fb({ id: "s2", category: "feeling_safe", sentiment: "unhappy", date: "2026-06-28" }),
        ],
      }),
    );
    const safety = p.highlights.find((h) => h.id === "safety_voice_concern");
    expect(safety).toBeTruthy();
    expect(safety!.severity).toBe("priority");
    expect(safety!.sources.length).toBeGreaterThan(0);
  });

  it("celebrates a strength when loops close and the child feels more heard", () => {
    const p = computeChildVoiceDimensions(
      base({
        feedbackLoops: [
          { id: "l1", child_id: "yp_alex", feedback_date: "2026-06-10", child_words: "a", decision_made: "acted_on_in_full", child_accepts: true },
          { id: "l2", child_id: "yp_alex", feedback_date: "2026-06-20", child_words: "b", decision_made: "acted_on_in_part", child_accepts: true },
        ],
        feedback: [
          fb({ id: "f1", category: "being_listened_to", sentiment: "happy", date: "2026-06-15", response_given_to_child: true }),
          fb({ id: "f2", category: "being_listened_to", sentiment: "very_happy", date: "2026-06-28", response_given_to_child: true }),
        ],
      }),
    );
    expect(p.highlights.some((h) => h.id === "loops_closing_strength")).toBe(true);
  });
});

describe("honesty + shape", () => {
  it("hasData is false when the child has no voice records at all", () => {
    const p = computeChildVoiceDimensions(base());
    expect(p.hasData).toBe(false);
  });

  it("always returns all six dimensions and the CRC/Reg-7 links + disclaimer", () => {
    const p = computeChildVoiceDimensions(base());
    expect(p.dimensions.map((d) => d.key).sort()).toEqual(
      ["advocacy_access", "expressed_sentiment", "feeling_listened_to", "feeling_safe", "voice_captured", "voice_influence"].sort(),
    );
    expect(p.regulatoryLinks.join(" ")).toMatch(/Article 12/);
    expect(p.disclaimer).toMatch(/do not measure how .* feels inside/i);
  });

  it("only counts records for the requested child", () => {
    const p = computeChildVoiceDimensions(
      base({
        feedback: [
          fb({ id: "mine", category: "feeling_safe", sentiment: "happy", date: "2026-06-20", child_id: "yp_alex" }),
          fb({ id: "theirs", category: "feeling_safe", sentiment: "very_unhappy", date: "2026-06-20", child_id: "yp_casey" }),
        ],
      }),
    );
    const safe = p.dimensions.find((d) => d.key === "feeling_safe")!;
    expect(safe.sources.map((s) => s.recordId)).toEqual(["mine"]);
  });
});
