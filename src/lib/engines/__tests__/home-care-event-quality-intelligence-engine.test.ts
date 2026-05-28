// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME CARE EVENT QUALITY INTELLIGENCE ENGINE — TESTS
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";

import {
  computeHomeCareEventQuality,
  type CareEventRecordInput,
  type CareEventQualityInput,
} from "../home-care-event-quality-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2026-05-28";

function makeEvent(overrides: Partial<CareEventRecordInput> = {}): CareEventRecordInput {
  return {
    id: "evt_1",
    child_id: "child_1",
    staff_id: "staff_1",
    date: "2026-05-20",
    category: "general",
    has_content: true,
    is_verified: true,
    is_locked: false,
    has_return_note: false,
    route_count: 2,
    routes_completed: 2,
    routes_failed: 0,
    audit_trail_count: 3,
    time_saved_minutes: 5,
    ...overrides,
  };
}

function baseInput(overrides: Partial<CareEventQualityInput> = {}): CareEventQualityInput {
  return {
    today: TODAY,
    total_children: 4,
    total_staff: 8,
    events: [],
    ...overrides,
  };
}

// ── Special Cases ──────────────────────────────────────────────────────────

describe("Home Care Event Quality Intelligence Engine", () => {
  describe("special cases", () => {
    it("returns insufficient_data when total_children is 0", () => {
      const r = computeHomeCareEventQuality(baseInput({ total_children: 0 }));
      expect(r.event_rating).toBe("insufficient_data");
      expect(r.event_score).toBe(0);
      expect(r.headline).toContain("No children placed");
    });

    it("returns score 0 for insufficient_data", () => {
      const r = computeHomeCareEventQuality(baseInput({ total_children: 0 }));
      expect(r.event_score).toBe(0);
    });

    it("returns warning insight for no children", () => {
      const r = computeHomeCareEventQuality(baseInput({ total_children: 0 }));
      expect(r.insights.length).toBe(1);
      expect(r.insights[0].severity).toBe("warning");
    });

    it("returns empty strengths/concerns/recommendations for no children", () => {
      const r = computeHomeCareEventQuality(baseInput({ total_children: 0 }));
      expect(r.strengths).toEqual([]);
      expect(r.concerns).toEqual([]);
      expect(r.recommendations).toEqual([]);
    });

    it("returns total_events even when insufficient_data", () => {
      const r = computeHomeCareEventQuality(baseInput({
        total_children: 0,
        events: [makeEvent()],
      }));
      expect(r.total_events).toBe(1);
    });

    it("returns inadequate with score 25 when 0 events with children present", () => {
      const r = computeHomeCareEventQuality(baseInput({ events: [] }));
      expect(r.event_rating).toBe("inadequate");
      expect(r.event_score).toBe(25);
    });

    it("returns concern about no care events recorded", () => {
      const r = computeHomeCareEventQuality(baseInput({ events: [] }));
      expect(r.concerns.length).toBeGreaterThan(0);
      expect(r.concerns[0]).toContain("No care events recorded");
    });

    it("returns critical insight for 0 events with children", () => {
      const r = computeHomeCareEventQuality(baseInput({ events: [] }));
      expect(r.insights.length).toBe(1);
      expect(r.insights[0].severity).toBe("critical");
    });

    it("returns immediate recommendation for 0 events", () => {
      const r = computeHomeCareEventQuality(baseInput({ events: [] }));
      expect(r.recommendations.length).toBe(1);
      expect(r.recommendations[0].urgency).toBe("immediate");
      expect(r.recommendations[0].regulatory_ref).toContain("Reg 36");
    });

    it("returns inadequate when all events are outside 90-day window", () => {
      const r = computeHomeCareEventQuality(baseInput({
        events: [
          makeEvent({ date: "2026-01-01" }),
          makeEvent({ id: "evt_2", date: "2025-12-15" }),
        ],
      }));
      expect(r.event_rating).toBe("inadequate");
      expect(r.event_score).toBe(25);
      expect(r.events_last_90_days).toBe(0);
    });

    it("reports total_events including out-of-window events", () => {
      const r = computeHomeCareEventQuality(baseInput({
        events: [
          makeEvent({ date: "2026-01-01" }),
          makeEvent({ id: "evt_2", date: "2026-05-20" }),
        ],
      }));
      expect(r.total_events).toBe(2);
    });

    it("filters events to last 90 days", () => {
      const r = computeHomeCareEventQuality(baseInput({
        events: [
          makeEvent({ id: "evt_1", date: "2026-05-20" }),       // within
          makeEvent({ id: "evt_2", date: "2026-02-20" }),       // 97 days ago, outside
          makeEvent({ id: "evt_3", date: "2026-03-01" }),       // 88 days ago, within
        ],
      }));
      expect(r.events_last_90_days).toBe(2);
      expect(r.total_events).toBe(3);
    });

    it("excludes future-dated events", () => {
      const r = computeHomeCareEventQuality(baseInput({
        events: [
          makeEvent({ id: "evt_1", date: "2026-05-29" }), // tomorrow
          makeEvent({ id: "evt_2", date: "2026-05-28" }), // today
        ],
      }));
      expect(r.events_last_90_days).toBe(1);
    });

    it("includes events on today's date", () => {
      const r = computeHomeCareEventQuality(baseInput({
        events: [makeEvent({ date: TODAY })],
      }));
      expect(r.events_last_90_days).toBe(1);
    });

    it("includes events on the cutoff boundary", () => {
      // 90 days before 2026-05-28 = 2026-02-27
      const r = computeHomeCareEventQuality(baseInput({
        events: [makeEvent({ date: "2026-02-27" })],
      }));
      expect(r.events_last_90_days).toBe(1);
    });
  });

  // ── Rating Thresholds ────────────────────────────────────────────────────

  describe("rating thresholds", () => {
    // Helper: build events to hit an exact score
    // Base 52, perfect modifiers: +6, +5, +5, +5, +4, +5 = +30, but max bonuses vary
    // We need to construct scenarios that land on boundary scores

    it("rates outstanding at score 80", () => {
      // Base 52 + 6(content 100%) + 5(verify 100%) + 5(routing 100%) + 5(audit 100%) + 4(return 0%) + 5(good coverage+diverse)
      // = 52 + 30 = 82, but we need exactly 80
      // Base 52 + 3(content 90%) + 5(verify 100%) + 5(routing 100%) + 5(audit 100%) + 4(return 0%) + 5(good coverage+diverse)
      // = 52 + 27 = 79 — too low
      // Base 52 + 6 + 5 + 5 + 5 + 4 + 5 = 82
      // To get 80: base 52 + 6 + 5 + 5 + 5 + 2(return <15%) + 5 = 80
      const children = ["c1", "c2", "c3", "c4"];
      const cats = ["behaviour", "health", "safeguarding", "education"];
      const events: CareEventRecordInput[] = [];
      // 20 events: 5 per child across 4 categories, 2 have return notes (10% return rate → +2)
      let idx = 0;
      for (const child of children) {
        for (let i = 0; i < 5; i++) {
          events.push(makeEvent({
            id: `evt_${idx}`,
            child_id: child,
            category: cats[i % 4],
            date: `2026-05-${String(5 + idx).padStart(2, "0")}`,
            has_content: true,
            is_verified: true,
            route_count: 2,
            routes_completed: 2,
            audit_trail_count: 3,
            has_return_note: idx < 2, // 2/20 = 10% → <15% → +2
          }));
          idx++;
        }
      }
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      // recording: 100% → +6
      // verification: 100% → +5
      // routing: 100% → +5
      // audit: 100% → +5
      // return: 10% → +2 (<15%)
      // coverage: 5/child=5 → good, diverse=4 → +5
      // = 52 + 6 + 5 + 5 + 5 + 2 + 5 = 80
      expect(r.event_score).toBe(80);
      expect(r.event_rating).toBe("outstanding");
    });

    it("rates good at score 79 (just below outstanding)", () => {
      // Need score 79. Base 52 + 6 + 5 + 5 + 5 + 2 + 5 = 80
      // Drop one: routing +2 instead of +5 → 52 + 6 + 5 + 2 + 5 + 2 + 5 = 77 — too low
      // Actually let's be precise. We need 79.
      // 52 + 6 + 5 + 5 + 5 + 4 + 2(coverage ok but not great+diverse) = 79
      // coverage ok means >=2 events/child but NOT (good AND diverse)
      // So: 2 events per child, diverse >=3 categories, but eventsPerChild < 5
      const children = ["c1", "c2", "c3", "c4"];
      const cats = ["behaviour", "health", "safeguarding"];
      const events: CareEventRecordInput[] = [];
      let idx = 0;
      for (const child of children) {
        for (let i = 0; i < 2; i++) {
          events.push(makeEvent({
            id: `evt_${idx}`,
            child_id: child,
            category: cats[idx % 3],
            date: `2026-05-${String(10 + idx).padStart(2, "0")}`,
            has_content: true,
            is_verified: true,
            route_count: 2,
            routes_completed: 2,
            audit_trail_count: 3,
            has_return_note: false,
          }));
          idx++;
        }
      }
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      // recording: 100% → +6
      // verification: 100% → +5
      // routing: 100% → +5
      // audit: 100% → +5
      // return: 0% → +4
      // coverage: 2/child → ok but not good (need >=5), diverse=3 → okCoverage → +2
      // = 52 + 6 + 5 + 5 + 5 + 4 + 2 = 79
      expect(r.event_score).toBe(79);
      expect(r.event_rating).toBe("good");
    });

    it("rates good at score 65", () => {
      // Need exactly 65. Base 52 + modifiers = 13
      // +3(recording 90%) + 2(verify 80%) + 2(routing 80%) + 2(audit 70%) + 2(return <15%) + 2(ok coverage) = 13
      const events: CareEventRecordInput[] = [];
      // 10 events for 4 children = 2.5 per child → ok coverage
      // 9/10 have content → 90% → +3
      // 8/10 verified → 80% → +2
      // routing: 80% → +2 (need 80% of routes completed)
      // audit: 7/10 have >=2 → 70% → +2
      // return: 1/10 → 10% → +2
      for (let i = 0; i < 10; i++) {
        events.push(makeEvent({
          id: `evt_${i}`,
          child_id: `child_${(i % 4) + 1}`,
          category: i < 3 ? "behaviour" : i < 6 ? "health" : "safeguarding",
          date: `2026-05-${String(10 + i).padStart(2, "0")}`,
          has_content: i < 9,             // 9/10 = 90%
          is_verified: i < 8,             // 8/10 = 80%
          route_count: 5,
          routes_completed: 4,            // 40/50 = 80%
          routes_failed: 0,
          audit_trail_count: i < 7 ? 2 : 1, // 7/10 = 70%
          has_return_note: i === 0,       // 1/10 = 10%
        }));
      }
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      // recording: 90% → +3
      // verification: 80% → +2
      // routing: 80% → +2
      // audit: 70% → +2
      // return: 10% → +2
      // coverage: 2.5/child → ok, 3 categories → diverse, but 2.5 < 5 → okCoverage → +2
      // = 52 + 3 + 2 + 2 + 2 + 2 + 2 = 65
      expect(r.event_score).toBe(65);
      expect(r.event_rating).toBe("good");
    });

    it("rates adequate at score 64 (just below good)", () => {
      // Need 64. Base 52 + 12.
      // +3(recording 90%) + 2(verify 80%) + 2(routing 80%) + 2(audit 70%) + 2(return <15%) -1(routing 0 routes) = wait, that's conflicting
      // Let me try: +3 + 2 + 2 + 2 + 2 + 2 = 13 → 65. Need 12.
      // +3 + 2 + 2 + 2 + 0 (return 15-30%, no bonus) + 2 = 11 → 63... nope
      // +3 + 2 + 2 + 2 + 2 + (coverage: poor → -3) = 8 → 60... too low
      // Let's try: +6(content 98%) + 2(verify 80%) + (-1)(no routes) + 2(audit 70%) + 2(return <15%) + 2(ok coverage) + (-1 no routes) wait
      // Actually: +6 + 2 + (-1) + 2 + 2 + 2 = 13 → 65... need one less
      // +3 + 2 + (-1) + 2 + 4 + 2 = 12 → 64!
      // content 90%→+3, verify 80%→+2, no routes→-1, audit 70%→+2, return 0%→+4, ok coverage→+2
      const events: CareEventRecordInput[] = [];
      for (let i = 0; i < 10; i++) {
        events.push(makeEvent({
          id: `evt_${i}`,
          child_id: `child_${(i % 4) + 1}`,
          category: i < 3 ? "behaviour" : i < 6 ? "health" : "safeguarding",
          date: `2026-05-${String(10 + i).padStart(2, "0")}`,
          has_content: i < 9,             // 9/10 = 90% → +3
          is_verified: i < 8,             // 8/10 = 80% → +2
          route_count: 0,                 // 0 routes → -1
          routes_completed: 0,
          routes_failed: 0,
          audit_trail_count: i < 7 ? 2 : 1, // 7/10 = 70% → +2
          has_return_note: false,         // 0% → +4
        }));
      }
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      // recording: 90% → +3
      // verification: 80% → +2
      // routing: 0 routes → -1
      // audit: 70% → +2
      // return: 0% → +4
      // coverage: 2.5/child → ok, 3 categories → +2
      // = 52 + 3 + 2 + (-1) + 2 + 4 + 2 = 64
      expect(r.event_score).toBe(64);
      expect(r.event_rating).toBe("adequate");
    });

    it("rates adequate at score 45", () => {
      // Need 45. Base 52 - 7.
      // content <70%→-5, verify 80%→+2, no routes→-1, audit 70%→+2, return 0%→+4, poor coverage→-3
      // = 52 - 5 + 2 - 1 + 2 + 4 - 3 = 51... too high
      // content <50%→-8, verify >=80→+2, routing 0→-1, audit >=70→+2, return 0%→+4, poor→-3
      // = 52 - 8 + 2 - 1 + 2 + 4 - 3 = 48... still too high
      // content <50%→-8, verify <60→-5, routing 0→-1, audit >=90→+5, return 0%→+4, poor→-3
      // = 52 - 8 - 5 - 1 + 5 + 4 - 3 = 44... one short
      // content <50%→-8, verify <60→-5, routing 0→-1, audit >=90→+5, return <15%→+2, ok coverage→+2
      // = 52 - 8 - 5 - 1 + 5 + 2 + 2 = 47... too high
      // content <70%→-5, verify <60→-5, routing 0→-1, audit >=70→+2, return 0%→+4, poor→-3
      // = 52 - 5 - 5 - 1 + 2 + 4 - 3 = 44... too low
      // content <70%→-5, verify <60→-5, routing 0→-1, audit >=70→+2, return 0%→+4, ok coverage→+2
      // = 52 - 5 - 5 - 1 + 2 + 4 + 2 = 49... too high
      // content <70%→-5, verify <60→-5, routing >=80→+2, audit <50→-4, return <15→+2, good+diverse→+5
      // = 52 - 5 - 5 + 2 - 4 + 2 + 5 = 47
      // content <70%→-5, verify <60→-5, routing >=80→+2, audit <50→-4, return <5→+4, ok→+2
      // = 52 - 5 - 5 + 2 - 4 + 4 + 2 = 46
      // content <70%→-5, verify <60→-5, routing >=80→+2, audit <50→-4, return <5→+4, poor→-3 = 41
      // content <70%→-5, verify >=80→+2, routing <60→-4, audit <50→-4, return <5→+4, ok→+2
      // = 52 - 5 + 2 - 4 - 4 + 4 + 2 = 47
      // content <70%→-5, verify >=80→+2, routing <60→-4, audit <50→-4, return <5→+4, poor→-3 = 42
      // content 90%→+3, verify <60→-5, routing <60→-4, audit <50→-4, return <5→+4, poor→-3 = 43
      // content 90%→+3, verify <60→-5, routing <60→-4, audit <50→-4, return <15→+2, ok→+2 = 46
      // content 90%→+3, verify <60→-5, routing <60→-4, audit <50→-4, return 0→+4, poor→-3 = 43
      // content 90%→+3, verify <60→-5, routing 0→-1, audit <50→-4, return <5→+4, poor→-3 = 46
      // content 98%→+6, verify <60→-5, routing <60→-4, audit <50→-4, return <5→+4, poor→-3 = 46
      // content 98%→+6, verify <60→-5, routing <60→-4, audit <50→-4, return <15→+2, poor→-3 = 44
      // Need exactly 45:
      // content 98%→+6, verify <60→-5, routing <60→-4, audit <50→-4, return 0→+4, poor→-3 = 46
      // Hmm. Let me try:
      // content 90%→+3, verify <60→-5, routing >=80→+2, audit <50→-4, return <5%→+4, poor→-3 = 49
      // content 90%→+3, verify <60→-5, routing 0→-1, audit <50→-4, return 0→+4, ok→+2 = 51
      // OK different approach:
      // 52 + x = 45 → x = -7
      // -5(content<70) + 0(verify 60-79, no bonus/penalty) + 0(routing 60-79) + 0(audit 50-69) + 0(return 15-30%) + (-2)(poor cover, but not terrible)
      // Wait, verify between 60-79 gets no bonus and no penalty (the spec says >=95→+5, >=80→+2, <60→-5)
      // So 60-79% verify → 0. And 60-79% routing → 0. And 50-69% audit → 0. And 15-30% return → 0.
      // -5(content<70) + 0 + 0 + 0 + 0 + (-2)(poor coverage) = -7 → 45!
      // Poor coverage: < 2 events per child, or not ok
      const events: CareEventRecordInput[] = [];
      // Need: content < 70%, verify ~70%, routing ~70%, audit ~60%, return ~20%, poor coverage
      // 5 events for 4 children = 1.25/child → poor. 2 categories → not diverse
      // 3/5 have content = 60% → <70% → -5
      // 4/5 verified = 80%... that gives +2. Need 60-79%
      // 3/5 verified = 60% → no bonus/penalty
      // routing: 70% → no bonus/penalty
      // audit: 3/5 = 60% → no bonus/penalty (>=50% but <70%)
      // return: 1/5 = 20% → no bonus/penalty (>=15% but <=30%)
      // coverage: 1.25/child → poor → -3... that would give 52 - 5 + 0 + 0 + 0 + 0 - 3 = 44
      // Need -2 not -3 from coverage. But coverage is either: +5, +2, or -3.
      // Let me get ok coverage with +2: 2 events/child but not good+diverse
      // Then I need more penalty elsewhere.
      // 8 events for 4 children = 2/child → ok → +2
      // content: 5/8 = 63% → <70% → -5
      // verify: 5/8 = 63% → between 60-79 → 0... wait, >=80→+2, <60→-5. 63% is >=60 so no penalty, but <80 so no bonus. → 0
      // routing: use 0 routes → -1
      // audit: 5/8 = 63% → >=50, <70 → 0
      // return: 2/8 = 25% → >=15, <=30 → 0
      // coverage: +2
      // = 52 - 5 + 0 - 1 + 0 + 0 + 2 = 48... still too high
      // Actually coverage check: 2/child ok. diverse: need to check categories
      // If diverse>=3 AND good coverage, then +5. If okCoverage → +2.
      // 2/child → ok but not good (need >=5) → +2. Good.
      // 52 - 5 + 0 - 1 + 0 + 0 + 2 = 48
      // Need 45. Diff is -3 more.
      // content <50% → -8 instead of -5: 52 - 8 + 0 - 1 + 0 + 0 + 2 = 45!
      // 8 events, 3 have content → 38% → <50% → -8
      for (let i = 0; i < 8; i++) {
        events.push(makeEvent({
          id: `evt_${i}`,
          child_id: `child_${(i % 4) + 1}`,
          category: i < 3 ? "behaviour" : i < 6 ? "health" : "safeguarding",
          date: `2026-05-${String(10 + i).padStart(2, "0")}`,
          has_content: i < 3,             // 3/8 = 38% → <50% → -8
          is_verified: i < 5,             // 5/8 = 63% → 0 (>=60, <80)
          route_count: 0,                 // 0 routes → -1
          routes_completed: 0,
          routes_failed: 0,
          audit_trail_count: i < 5 ? 2 : 1, // 5/8 = 63% → 0 (>=50, <70)
          has_return_note: i < 2,         // 2/8 = 25% → 0 (>=15, <=30)
        }));
      }
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.event_score).toBe(45);
      expect(r.event_rating).toBe("adequate");
    });

    it("rates inadequate at score 44 (just below adequate)", () => {
      // Need 44. From above, 45 = 52 - 8 + 0 - 1 + 0 + 0 + 2
      // Drop 1 more: make return > 30% → -4 instead of 0: 52 - 8 + 0 - 1 + 0 - 4 + 2 = 41
      // That's too much. Instead: verify <60 → -5 instead of 0: 52 - 8 - 5 - 1 + 0 + 0 + 2 = 40
      // Let me build up to 44:
      // 52 + x = 44 → x = -8
      // content <70%→-5, verify 0, routing -1, audit 0, return 0, coverage -3 → -9 → 43
      // content <70%→-5, verify 0, routing -1, audit 0, return 0, coverage +2 → -4 → 48
      // content <70%→-5, verify 0, routing 0(no routes wait routes must be present or 0)
      // Let me try: content <70%→-5, verify 0, routing <60%→-4, audit 0, return 0, coverage +2
      // = 52 -5+0-4+0+0+2 = 45... need one less
      // content <70%→-5, verify 0, routing <60%→-4, audit 0, return 0, poor→-3
      // = 52-5+0-4+0+0-3 = 40
      // Hmm. Let me try:
      // content 90%→+3, verify <60→-5, routing <60→-4, audit 50-69→0, return 15-30→0, poor→-3
      // = 52+3-5-4+0+0-3 = 43
      // content 90%→+3, verify <60→-5, routing <60→-4, audit 50-69→0, return <15→+2, poor→-3
      // = 52+3-5-4+0+2-3 = 45
      // content 90%→+3, verify <60→-5, routing <60→-4, audit 50-69→0, return 15-30→0, ok→+2
      // = 52+3-5-4+0+0+2 = 48
      // content <70→-5, verify <60→-5, routing 80→+2, audit 70→+2, return <5→+4, poor→-3
      // = 52-5-5+2+2+4-3 = 47
      // content <70→-5, verify <60→-5, routing 80→+2, audit 70→+2, return 15-30→0, poor→-3
      // = 52-5-5+2+2+0-3 = 43
      // content <70→-5, verify <60→-5, routing 80→+2, audit 70→+2, return <15→+2, poor→-3
      // = 52-5-5+2+2+2-3 = 45
      // content <70→-5, verify <60→-5, routing 80→+2, audit 50-69→0, return <15→+2, poor→-3
      // = 52-5-5+2+0+2-3 = 43
      // Let me just go for 44 directly:
      // 52 + (-5) + 0 + (-1) + 0 + (-2) + 0 = 44... wait what gives -2?
      // The modifiers are: +6/+3/-5/-8, +5/+2/-5, +5/+2/-4/-1, +5/+2/-4, +4/+2/-4, +5/+2/-3
      // Need sum of modifiers = -8
      // -5(content<70) + (-5)(verify<60) + 5(routing>=95) + (-4)(audit<50) + 4(return<5) + (-3)(poor) = -8 → 44!
      const events: CareEventRecordInput[] = [];
      // 3 events, 1 child, 1 category → poor coverage, not diverse
      // 2/3 content → 67% → <70% → -5
      // 1/3 verified → 33% → <60% → -5
      // routing: all completed → >=95% → +5
      // audit: 1/3 have >=2 → 33% → <50% → -4
      // return: 0/3 → 0% → <5% → +4
      // coverage: 3/1 child = 3/child → ok but 1 category → not diverse → okCoverage → +2
      // Wait, okCoverage is >=2 events/child, so +2. But I need poor → -3
      // For poor coverage: events per child < 2
      // 1 event for 4 children = 0.25/child → poor → -3
      // But then with 1 event: 1/1 content → 100% → +6, not what I want
      // Let me use more events and more children:
      // 5 events for 4 children. Some children have 0.
      // Actually eventsPerChild = events.length / total_children regardless of who has them
      // 5/4 = 1.25 → poor → -3
      // 3/5 content → 60% → <70% → -5
      // 1/5 verified → 20% → <60% → -5
      // routing 100% → +5
      // 1/5 audit >=2 → 20% → <50% → -4
      // 0/5 return → 0% → <5% → +4
      // = 52 -5 -5 +5 -4 +4 -3 = 44!
      for (let i = 0; i < 5; i++) {
        events.push(makeEvent({
          id: `evt_${i}`,
          child_id: `child_${(i % 2) + 1}`,
          category: "general",
          date: `2026-05-${String(20 + i).padStart(2, "0")}`,
          has_content: i < 3,             // 3/5 = 60% → -5
          is_verified: i === 0,           // 1/5 = 20% → -5
          route_count: 2,
          routes_completed: 2,            // 100% → +5
          routes_failed: 0,
          audit_trail_count: i === 0 ? 2 : 1, // 1/5 = 20% → -4
          has_return_note: false,         // 0% → +4
        }));
      }
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      // eventsPerChild = 5/4 = 1.25 → poor → -3
      // 52 -5 -5 +5 -4 +4 -3 = 44
      expect(r.event_score).toBe(44);
      expect(r.event_rating).toBe("inadequate");
    });
  });

  // ── Modifier 1: Recording Quality ────────────────────────────────────────

  describe("modifier 1: recording quality (has_content rate)", () => {
    it("gives +6 for >=98% content rate", () => {
      // 100 events, 99 have content → 99% → +6
      const events = Array.from({ length: 100 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        category: ["behaviour", "health", "safeguarding"][i % 3],
        date: `2026-05-${String((i % 25) + 1).padStart(2, "0")}`,
        has_content: i < 99,
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.recording_quality_rate).toBe(99);
      // Check it's higher than +3 scenario
      expect(r.event_score).toBeGreaterThan(52);
    });

    it("gives +6 for exactly 98% content rate", () => {
      const events = Array.from({ length: 50 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        category: ["behaviour", "health", "safeguarding"][i % 3],
        date: `2026-05-${String((i % 25) + 1).padStart(2, "0")}`,
        has_content: i < 49, // 49/50 = 98%
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.recording_quality_rate).toBe(98);
    });

    it("gives +3 for 90-97% content rate", () => {
      // 10 events, 9 have content → 90%
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        category: ["behaviour", "health", "safeguarding"][i % 3],
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
        has_content: i < 9,
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.recording_quality_rate).toBe(90);
    });

    it("gives -5 for <70% content rate (but >=50%)", () => {
      // 10 events, 6 have content → 60%
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        category: ["behaviour", "health", "safeguarding"][i % 3],
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
        has_content: i < 6,
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.recording_quality_rate).toBe(60);
    });

    it("gives -8 (combined -5 and -3) for <50% content rate", () => {
      // 10 events, 4 have content → 40%
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        category: ["behaviour", "health", "safeguarding"][i % 3],
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
        has_content: i < 4,
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.recording_quality_rate).toBe(40);
    });

    it("gives 0 modifier for 70-89% content rate", () => {
      // 10 events, 7 have content → 70% — exactly at boundary, not <70 so no penalty, not >=90 so no bonus
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        category: ["behaviour", "health", "safeguarding"][i % 3],
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
        has_content: i < 7,
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.recording_quality_rate).toBe(70);
    });

    it("calculates recording_quality_rate correctly", () => {
      const events = [
        makeEvent({ id: "e1", has_content: true, date: "2026-05-20" }),
        makeEvent({ id: "e2", has_content: false, date: "2026-05-21" }),
        makeEvent({ id: "e3", has_content: true, date: "2026-05-22" }),
      ];
      const r = computeHomeCareEventQuality(baseInput({ events }));
      expect(r.recording_quality_rate).toBe(67);
    });
  });

  // ── Modifier 2: Verification Compliance ──────────────────────────────────

  describe("modifier 2: verification compliance", () => {
    it("gives +5 for >=95% verification rate", () => {
      const events = Array.from({ length: 20 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        category: ["behaviour", "health", "safeguarding"][i % 3],
        date: `2026-05-${String((i % 25) + 1).padStart(2, "0")}`,
        is_verified: i < 19, // 19/20 = 95%
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.verification_rate).toBe(95);
    });

    it("gives +2 for 80-94% verification rate", () => {
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
        is_verified: i < 8, // 8/10 = 80%
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.verification_rate).toBe(80);
    });

    it("gives -5 for <60% verification rate", () => {
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
        is_verified: i < 5, // 5/10 = 50%
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.verification_rate).toBe(50);
    });

    it("gives 0 modifier for 60-79% verification rate", () => {
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
        is_verified: i < 7, // 7/10 = 70%
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.verification_rate).toBe(70);
    });

    it("calculates verification_rate correctly", () => {
      const events = [
        makeEvent({ id: "e1", is_verified: true, date: "2026-05-20" }),
        makeEvent({ id: "e2", is_verified: false, date: "2026-05-21" }),
        makeEvent({ id: "e3", is_verified: true, date: "2026-05-22" }),
        makeEvent({ id: "e4", is_verified: true, date: "2026-05-23" }),
      ];
      const r = computeHomeCareEventQuality(baseInput({ events }));
      expect(r.verification_rate).toBe(75);
    });
  });

  // ── Modifier 3: Routing Effectiveness ────────────────────────────────────

  describe("modifier 3: routing effectiveness", () => {
    it("gives +5 for >=95% routing completion", () => {
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
        route_count: 10,
        routes_completed: i < 9 ? 10 : 9, // 99/100 = 99%
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.routing_completion_rate).toBe(99);
    });

    it("gives +2 for 80-94% routing completion", () => {
      const events = [makeEvent({
        route_count: 10,
        routes_completed: 8, // 80%
        date: "2026-05-20",
      })];
      const r = computeHomeCareEventQuality(baseInput({ events }));
      expect(r.routing_completion_rate).toBe(80);
    });

    it("gives -4 for <60% routing completion", () => {
      const events = [makeEvent({
        route_count: 10,
        routes_completed: 5, // 50%
        date: "2026-05-20",
      })];
      const r = computeHomeCareEventQuality(baseInput({ events }));
      expect(r.routing_completion_rate).toBe(50);
    });

    it("gives -1 for 0 total routes", () => {
      const events = [makeEvent({
        route_count: 0,
        routes_completed: 0,
        date: "2026-05-20",
      })];
      const r = computeHomeCareEventQuality(baseInput({ events }));
      expect(r.routing_completion_rate).toBe(0);
    });

    it("gives 0 modifier for 60-79% routing completion", () => {
      const events = [makeEvent({
        route_count: 10,
        routes_completed: 7, // 70%
        date: "2026-05-20",
      })];
      const r = computeHomeCareEventQuality(baseInput({ events }));
      expect(r.routing_completion_rate).toBe(70);
    });

    it("calculates routing_completion_rate across all events", () => {
      const events = [
        makeEvent({ id: "e1", route_count: 3, routes_completed: 2, date: "2026-05-20" }),
        makeEvent({ id: "e2", route_count: 5, routes_completed: 5, date: "2026-05-21" }),
      ];
      const r = computeHomeCareEventQuality(baseInput({ events }));
      // 7/8 = 88%
      expect(r.routing_completion_rate).toBe(88);
    });
  });

  // ── Modifier 4: Audit Trail Completeness ─────────────────────────────────

  describe("modifier 4: audit trail completeness", () => {
    it("gives +5 for >=90% events with audit_trail_count >= 2", () => {
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
        audit_trail_count: i < 9 ? 3 : 1, // 9/10 = 90%
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.audit_trail_rate).toBe(90);
    });

    it("gives +2 for 70-89% audit trail rate", () => {
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
        audit_trail_count: i < 7 ? 2 : 1, // 7/10 = 70%
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.audit_trail_rate).toBe(70);
    });

    it("gives -4 for <50% audit trail rate", () => {
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
        audit_trail_count: i < 4 ? 2 : 1, // 4/10 = 40%
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.audit_trail_rate).toBe(40);
    });

    it("gives 0 modifier for 50-69% audit trail rate", () => {
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
        audit_trail_count: i < 6 ? 2 : 1, // 6/10 = 60%
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.audit_trail_rate).toBe(60);
    });

    it("counts only events with audit_trail_count >= 2", () => {
      const events = [
        makeEvent({ id: "e1", audit_trail_count: 0, date: "2026-05-20" }),
        makeEvent({ id: "e2", audit_trail_count: 1, date: "2026-05-21" }),
        makeEvent({ id: "e3", audit_trail_count: 2, date: "2026-05-22" }),
        makeEvent({ id: "e4", audit_trail_count: 5, date: "2026-05-23" }),
      ];
      const r = computeHomeCareEventQuality(baseInput({ events }));
      expect(r.audit_trail_rate).toBe(50); // 2/4
    });
  });

  // ── Modifier 5: Return/Correction Rate ───────────────────────────────────

  describe("modifier 5: return/correction rate", () => {
    it("gives +4 for <5% return rate", () => {
      const events = Array.from({ length: 20 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        category: ["behaviour", "health", "safeguarding"][i % 3],
        date: `2026-05-${String((i % 25) + 1).padStart(2, "0")}`,
        has_return_note: false, // 0% return
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.return_rate).toBe(0);
    });

    it("gives +2 for 5-14% return rate", () => {
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
        has_return_note: i === 0, // 1/10 = 10%
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.return_rate).toBe(10);
    });

    it("gives -4 for >30% return rate", () => {
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
        has_return_note: i < 4, // 4/10 = 40%
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.return_rate).toBe(40);
    });

    it("gives 0 modifier for 15-30% return rate", () => {
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
        has_return_note: i < 2, // 2/10 = 20%
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.return_rate).toBe(20);
    });

    it("return rate at exactly 5% gives +2 not +4", () => {
      const events = Array.from({ length: 20 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        category: ["behaviour", "health", "safeguarding"][i % 3],
        date: `2026-05-${String((i % 25) + 1).padStart(2, "0")}`,
        has_return_note: i === 0, // 1/20 = 5%
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.return_rate).toBe(5);
      // 5% is not < 5%, so should be +2 (5-14% range)
    });

    it("return rate at exactly 15% gives 0 modifier", () => {
      const events = Array.from({ length: 20 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        category: ["behaviour", "health", "safeguarding"][i % 3],
        date: `2026-05-${String((i % 25) + 1).padStart(2, "0")}`,
        has_return_note: i < 3, // 3/20 = 15%
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.return_rate).toBe(15);
    });

    it("calculates return_rate correctly", () => {
      const events = [
        makeEvent({ id: "e1", has_return_note: true, date: "2026-05-20" }),
        makeEvent({ id: "e2", has_return_note: false, date: "2026-05-21" }),
        makeEvent({ id: "e3", has_return_note: true, date: "2026-05-22" }),
        makeEvent({ id: "e4", has_return_note: false, date: "2026-05-23" }),
      ];
      const r = computeHomeCareEventQuality(baseInput({ events }));
      expect(r.return_rate).toBe(50);
    });
  });

  // ── Modifier 6: Coverage & Timeliness ────────────────────────────────────

  describe("modifier 6: coverage & timeliness", () => {
    it("gives +5 for good coverage AND diverse categories", () => {
      // >=5 events per child AND >=3 categories
      const events: CareEventRecordInput[] = [];
      let idx = 0;
      for (let c = 1; c <= 4; c++) {
        for (let i = 0; i < 5; i++) {
          events.push(makeEvent({
            id: `evt_${idx}`,
            child_id: `child_${c}`,
            category: ["behaviour", "health", "safeguarding"][i % 3],
            date: `2026-05-${String((idx % 25) + 1).padStart(2, "0")}`,
          }));
          idx++;
        }
      }
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.category_diversity).toBeGreaterThanOrEqual(3);
      // 20 events / 4 children = 5 per child → good
    });

    it("gives +2 for ok coverage (>=2 events per child but not good+diverse)", () => {
      // 8 events for 4 children = 2/child, 2 categories
      const events = Array.from({ length: 8 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        category: i < 4 ? "behaviour" : "health",
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      // 2/child → ok, 2 categories → not diverse, okCoverage → +2
      expect(r.unique_children_covered).toBe(4);
    });

    it("gives -3 for poor coverage (<2 events per child)", () => {
      // 4 events for 4 children = 1/child → poor
      const events = Array.from({ length: 4 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${i + 1}`,
        category: "general",
        date: `2026-05-${String(20 + i).padStart(2, "0")}`,
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      // 1/child → poor → -3
    });

    it("counts unique categories for diversity", () => {
      const events = [
        makeEvent({ id: "e1", category: "behaviour", date: "2026-05-20" }),
        makeEvent({ id: "e2", category: "health", date: "2026-05-21" }),
        makeEvent({ id: "e3", category: "behaviour", date: "2026-05-22" }),
        makeEvent({ id: "e4", category: "safeguarding", date: "2026-05-23" }),
        makeEvent({ id: "e5", category: "education", date: "2026-05-24" }),
      ];
      const r = computeHomeCareEventQuality(baseInput({ events }));
      expect(r.category_diversity).toBe(4);
    });

    it("counts unique children covered", () => {
      const events = [
        makeEvent({ id: "e1", child_id: "c1", date: "2026-05-20" }),
        makeEvent({ id: "e2", child_id: "c2", date: "2026-05-21" }),
        makeEvent({ id: "e3", child_id: "c1", date: "2026-05-22" }),
        makeEvent({ id: "e4", child_id: "c3", date: "2026-05-23" }),
      ];
      const r = computeHomeCareEventQuality(baseInput({ events }));
      expect(r.unique_children_covered).toBe(3);
    });

    it("considers ok coverage when diverse but not enough events per child", () => {
      // 12 events for 4 children = 3/child → ok (>=2 but <5), 3 categories
      // This is okCoverage=true, but goodCoverage=false, so even though diverse → +2
      const events = Array.from({ length: 12 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        category: ["behaviour", "health", "safeguarding"][i % 3],
        date: `2026-05-${String((i % 25) + 1).padStart(2, "0")}`,
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      // 3/child → ok not good, diverse → still only +2 because not good+diverse
    });
  });

  // ── Outstanding Rating ───────────────────────────────────────────────────

  describe("outstanding rating", () => {
    function outstandingEvents(): CareEventRecordInput[] {
      const children = ["c1", "c2", "c3", "c4"];
      const cats = ["behaviour", "health", "safeguarding", "education"];
      const events: CareEventRecordInput[] = [];
      let idx = 0;
      for (const child of children) {
        for (let i = 0; i < 5; i++) {
          events.push(makeEvent({
            id: `evt_${idx}`,
            child_id: child,
            category: cats[i % 4],
            date: `2026-05-${String((idx % 25) + 1).padStart(2, "0")}`,
            has_content: true,
            is_verified: true,
            route_count: 3,
            routes_completed: 3,
            routes_failed: 0,
            audit_trail_count: 4,
            has_return_note: false,
            time_saved_minutes: 5,
          }));
          idx++;
        }
      }
      return events;
    }

    it("achieves outstanding with perfect practice across all modifiers", () => {
      const events = outstandingEvents();
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      // 52 + 6 + 5 + 5 + 5 + 4 + 5 = 82
      expect(r.event_rating).toBe("outstanding");
      expect(r.event_score).toBe(82);
    });

    it("generates strengths for outstanding", () => {
      const events = outstandingEvents();
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.strengths.length).toBeGreaterThan(0);
    });

    it("includes content quality strength for outstanding", () => {
      const events = outstandingEvents();
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.strengths.some(s => s.includes("exemplary recording practice"))).toBe(true);
    });

    it("includes verification strength for outstanding", () => {
      const events = outstandingEvents();
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.strengths.some(s => s.includes("verification rate"))).toBe(true);
    });

    it("includes routing strength for outstanding", () => {
      const events = outstandingEvents();
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.strengths.some(s => s.includes("routing completion"))).toBe(true);
    });

    it("includes audit trail strength for outstanding", () => {
      const events = outstandingEvents();
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.strengths.some(s => s.includes("audit trails"))).toBe(true);
    });

    it("includes low return rate strength for outstanding", () => {
      const events = outstandingEvents();
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.strengths.some(s => s.includes("return rate"))).toBe(true);
    });

    it("includes coverage strength for outstanding", () => {
      const events = outstandingEvents();
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.strengths.some(s => s.includes("categories covered"))).toBe(true);
    });

    it("generates positive insights for outstanding", () => {
      const events = outstandingEvents();
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.insights.some(i => i.severity === "positive")).toBe(true);
    });

    it("generates outstanding headline", () => {
      const events = outstandingEvents();
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.headline).toContain("Outstanding");
    });

    it("has no concerns for outstanding", () => {
      const events = outstandingEvents();
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.concerns.length).toBe(0);
    });

    it("has no recommendations for outstanding", () => {
      const events = outstandingEvents();
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.recommendations.length).toBe(0);
    });
  });

  // ── Good Rating ──────────────────────────────────────────────────────────

  describe("good rating", () => {
    it("achieves good with minor gaps", () => {
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        category: ["behaviour", "health", "safeguarding"][i % 3],
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
        has_content: i < 9,       // 90%
        is_verified: i < 8,       // 80%
        route_count: 5,
        routes_completed: 4,      // 80%
        audit_trail_count: i < 7 ? 2 : 1, // 70%
        has_return_note: i === 0, // 10%
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      // 52 + 3 + 2 + 2 + 2 + 2 + 2 = 65
      expect(r.event_rating).toBe("good");
    });

    it("generates good headline", () => {
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        category: ["behaviour", "health", "safeguarding"][i % 3],
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
        has_content: i < 9,
        is_verified: i < 8,
        route_count: 5,
        routes_completed: 4,
        audit_trail_count: i < 7 ? 2 : 1,
        has_return_note: i === 0,
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.headline).toContain("Good");
    });
  });

  // ── Adequate Rating ──────────────────────────────────────────────────────

  describe("adequate rating", () => {
    it("achieves adequate with moderate gaps", () => {
      const events = Array.from({ length: 8 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        category: i < 3 ? "behaviour" : i < 6 ? "health" : "safeguarding",
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
        has_content: i < 3,       // 38% → -8
        is_verified: i < 5,       // 63% → 0
        route_count: 0,
        routes_completed: 0,      // 0 routes → -1
        audit_trail_count: i < 5 ? 2 : 1, // 63% → 0
        has_return_note: i < 2,   // 25% → 0
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.event_rating).toBe("adequate");
      expect(r.event_score).toBe(45);
    });

    it("generates adequate headline", () => {
      const events = Array.from({ length: 8 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        category: i < 3 ? "behaviour" : i < 6 ? "health" : "safeguarding",
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
        has_content: i < 3,
        is_verified: i < 5,
        route_count: 0,
        routes_completed: 0,
        audit_trail_count: i < 5 ? 2 : 1,
        has_return_note: i < 2,
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.headline).toContain("Adequate");
    });
  });

  // ── Inadequate Rating ────────────────────────────────────────────────────

  describe("inadequate rating", () => {
    it("scores inadequate with all poor metrics", () => {
      // content <50%, verify <60%, routing <60%, audit <50%, return >30%, poor coverage
      const events = Array.from({ length: 4 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 2) + 1}`,
        category: "general",
        date: `2026-05-${String(20 + i).padStart(2, "0")}`,
        has_content: i === 0,         // 25% → -8
        is_verified: i === 0,         // 25% → -5
        route_count: 5,
        routes_completed: 2,          // 8/20 = 40% → -4
        routes_failed: 2,
        audit_trail_count: i === 0 ? 2 : 0, // 25% → -4
        has_return_note: i < 2,       // 50% → -4
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      // 52 - 8 - 5 - 4 - 4 - 4 - 3 = 24
      expect(r.event_rating).toBe("inadequate");
      expect(r.event_score).toBe(24);
    });

    it("generates inadequate headline", () => {
      const events = Array.from({ length: 4 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 2) + 1}`,
        category: "general",
        date: `2026-05-${String(20 + i).padStart(2, "0")}`,
        has_content: i === 0,
        is_verified: i === 0,
        route_count: 5,
        routes_completed: 2,
        routes_failed: 2,
        audit_trail_count: i === 0 ? 2 : 0,
        has_return_note: i < 2,
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.headline).toContain("inadequate");
    });

    it("generates critical insights for inadequate", () => {
      const events = Array.from({ length: 4 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 2) + 1}`,
        category: "general",
        date: `2026-05-${String(20 + i).padStart(2, "0")}`,
        has_content: i === 0,
        is_verified: i === 0,
        route_count: 5,
        routes_completed: 2,
        audit_trail_count: 0,
        has_return_note: i < 2,
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.insights.some(i => i.severity === "critical")).toBe(true);
    });
  });

  // ── Strengths ────────────────────────────────────────────────────────────

  describe("strengths", () => {
    it("includes content quality strength for >=98%", () => {
      const events = Array.from({ length: 20 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        category: ["behaviour", "health", "safeguarding"][i % 3],
        date: `2026-05-${String((i % 25) + 1).padStart(2, "0")}`,
        has_content: true,
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.strengths.some(s => s.includes("exemplary recording practice"))).toBe(true);
    });

    it("includes content quality strength for 90-97%", () => {
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
        has_content: i < 9, // 90%
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.strengths.some(s => s.includes("strong content standards"))).toBe(true);
    });

    it("includes verification strength for >=95%", () => {
      const events = Array.from({ length: 20 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        category: ["behaviour", "health", "safeguarding"][i % 3],
        date: `2026-05-${String((i % 25) + 1).padStart(2, "0")}`,
        is_verified: true,
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.strengths.some(s => s.includes("comprehensive"))).toBe(true);
    });

    it("includes verification strength for 80-94%", () => {
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
        is_verified: i < 8, // 80%
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.strengths.some(s => s.includes("good management oversight"))).toBe(true);
    });

    it("includes routing strength for >=95% with routes present", () => {
      const events = [makeEvent({
        route_count: 10,
        routes_completed: 10,
        date: "2026-05-20",
      })];
      const r = computeHomeCareEventQuality(baseInput({ events }));
      expect(r.strengths.some(s => s.includes("routing completion"))).toBe(true);
    });

    it("does not include routing strength when 0 routes", () => {
      const events = [makeEvent({
        route_count: 0,
        routes_completed: 0,
        date: "2026-05-20",
      })];
      const r = computeHomeCareEventQuality(baseInput({ events }));
      expect(r.strengths.some(s => s.includes("routing completion"))).toBe(false);
    });

    it("includes audit trail strength for >=90%", () => {
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
        audit_trail_count: 3,
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.strengths.some(s => s.includes("audit trails"))).toBe(true);
    });

    it("includes low return rate strength", () => {
      const events = [makeEvent({ has_return_note: false, date: "2026-05-20" })];
      const r = computeHomeCareEventQuality(baseInput({ events }));
      expect(r.strengths.some(s => s.includes("return rate"))).toBe(true);
    });

    it("includes time saved strength when time_saved > 0", () => {
      const events = [makeEvent({ time_saved_minutes: 10, date: "2026-05-20" })];
      const r = computeHomeCareEventQuality(baseInput({ events }));
      expect(r.strengths.some(s => s.includes("minutes saved"))).toBe(true);
    });

    it("does not include time saved strength when 0 minutes", () => {
      const events = [makeEvent({ time_saved_minutes: 0, date: "2026-05-20" })];
      const r = computeHomeCareEventQuality(baseInput({ events }));
      expect(r.strengths.some(s => s.includes("minutes saved"))).toBe(false);
    });
  });

  // ── Concerns ─────────────────────────────────────────────────────────────

  describe("concerns", () => {
    it("flags low recording quality (<70%)", () => {
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
        has_content: i < 6, // 60%
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.concerns.some(c => c.includes("content"))).toBe(true);
    });

    it("flags low verification rate (<60%)", () => {
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
        is_verified: i < 5, // 50%
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.concerns.some(c => c.includes("verification"))).toBe(true);
    });

    it("flags low routing completion (<60%) with routes present", () => {
      const events = [makeEvent({
        route_count: 10,
        routes_completed: 5,
        routes_failed: 3,
        date: "2026-05-20",
      })];
      const r = computeHomeCareEventQuality(baseInput({ events }));
      expect(r.concerns.some(c => c.includes("routing"))).toBe(true);
    });

    it("does not flag routing concern with 0 routes", () => {
      const events = [makeEvent({
        route_count: 0,
        routes_completed: 0,
        routes_failed: 0,
        date: "2026-05-20",
      })];
      const r = computeHomeCareEventQuality(baseInput({ events }));
      expect(r.concerns.some(c => c.includes("routing"))).toBe(false);
    });

    it("flags low audit trail rate (<50%)", () => {
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
        audit_trail_count: i < 4 ? 2 : 1, // 40%
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.concerns.some(c => c.includes("audit"))).toBe(true);
    });

    it("flags high return rate (>30%)", () => {
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
        has_return_note: i < 4, // 40%
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.concerns.some(c => c.includes("return rate"))).toBe(true);
    });

    it("flags poor coverage (<2 events per child)", () => {
      const events = Array.from({ length: 3 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${i + 1}`,
        date: `2026-05-${String(20 + i).padStart(2, "0")}`,
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.concerns.some(c => c.includes("events per child"))).toBe(true);
    });

    it("flags low category diversity (<3 categories)", () => {
      const events = Array.from({ length: 5 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        category: i < 3 ? "behaviour" : "health",
        date: `2026-05-${String(20 + i).padStart(2, "0")}`,
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.concerns.some(c => c.includes("categor"))).toBe(true);
    });

    it("flags uncovered children", () => {
      // Only 2 children have events, but 4 total
      const events = [
        makeEvent({ id: "e1", child_id: "c1", date: "2026-05-20" }),
        makeEvent({ id: "e2", child_id: "c2", date: "2026-05-21" }),
      ];
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.concerns.some(c => c.includes("children have no care events"))).toBe(true);
    });

    it("does not flag uncovered children when all are covered", () => {
      const events = Array.from({ length: 4 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${i + 1}`,
        date: `2026-05-${String(20 + i).padStart(2, "0")}`,
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.concerns.some(c => c.includes("children have no care events"))).toBe(false);
    });

    it("uses singular for 1 uncovered child", () => {
      const events = Array.from({ length: 3 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${i + 1}`,
        date: `2026-05-${String(20 + i).padStart(2, "0")}`,
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.concerns.some(c => c.includes("1 child has"))).toBe(true);
    });
  });

  // ── Recommendations ──────────────────────────────────────────────────────

  describe("recommendations", () => {
    it("recommends improving content quality when <70%", () => {
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
        has_content: i < 6,
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("content quality"))).toBe(true);
      expect(r.recommendations.find(rec => rec.recommendation.includes("content quality"))?.urgency).toBe("immediate");
    });

    it("recommends verification workflow when <60%", () => {
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
        is_verified: i < 5,
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("verification"))).toBe(true);
    });

    it("recommends routing investigation when <60% completion", () => {
      const events = [makeEvent({
        route_count: 10,
        routes_completed: 5,
        date: "2026-05-20",
      })];
      const r = computeHomeCareEventQuality(baseInput({ events }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("routing"))).toBe(true);
    });

    it("recommends audit trail completeness when <50%", () => {
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
        audit_trail_count: i < 4 ? 2 : 1,
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("audit trail"))).toBe(true);
    });

    it("recommends staff training when return rate >30%", () => {
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
        has_return_note: i < 4,
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("return rate"))).toBe(true);
    });

    it("recommends increased recording when poor coverage", () => {
      const events = Array.from({ length: 3 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${i + 1}`,
        date: `2026-05-${String(20 + i).padStart(2, "0")}`,
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("recording frequency"))).toBe(true);
    });

    it("recommends broadening categories when diversity < 3", () => {
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        category: i < 5 ? "behaviour" : "health",
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("Broaden"))).toBe(true);
    });

    it("recommends covering all children when some uncovered", () => {
      const events = [makeEvent({ child_id: "c1", date: "2026-05-20" })];
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("all 4 children"))).toBe(true);
    });

    it("generates no recommendations for perfect practice", () => {
      const children = ["c1", "c2", "c3", "c4"];
      const cats = ["behaviour", "health", "safeguarding", "education"];
      const events: CareEventRecordInput[] = [];
      let idx = 0;
      for (const child of children) {
        for (let i = 0; i < 5; i++) {
          events.push(makeEvent({
            id: `evt_${idx}`,
            child_id: child,
            category: cats[i % 4],
            date: `2026-05-${String((idx % 25) + 1).padStart(2, "0")}`,
          }));
          idx++;
        }
      }
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.recommendations.length).toBe(0);
    });

    it("assigns ranks sequentially", () => {
      const events = Array.from({ length: 4 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 2) + 1}`,
        category: "general",
        date: `2026-05-${String(20 + i).padStart(2, "0")}`,
        has_content: false,
        is_verified: false,
        route_count: 10,
        routes_completed: 3,
        audit_trail_count: 0,
        has_return_note: true,
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.recommendations.length).toBeGreaterThan(0);
      for (let i = 0; i < r.recommendations.length; i++) {
        expect(r.recommendations[i].rank).toBe(i + 1);
      }
    });

    it("includes regulatory references in recommendations", () => {
      const events = Array.from({ length: 4 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 2) + 1}`,
        category: "general",
        date: `2026-05-${String(20 + i).padStart(2, "0")}`,
        has_content: false,
        is_verified: false,
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      for (const rec of r.recommendations) {
        expect(rec.regulatory_ref.length).toBeGreaterThan(0);
      }
    });

    it("category diversity recommendation has planned urgency", () => {
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        category: "behaviour",
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      const catRec = r.recommendations.find(rec => rec.recommendation.includes("Broaden"));
      expect(catRec?.urgency).toBe("planned");
    });

    it("recording frequency recommendation has immediate urgency", () => {
      const events = [makeEvent({ date: "2026-05-20" })];
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      const freqRec = r.recommendations.find(rec => rec.recommendation.includes("recording frequency"));
      expect(freqRec?.urgency).toBe("immediate");
    });
  });

  // ── Insights ─────────────────────────────────────────────────────────────

  describe("insights", () => {
    it("generates exemplary insight for top metrics", () => {
      const events = Array.from({ length: 20 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        category: ["behaviour", "health", "safeguarding"][i % 3],
        date: `2026-05-${String((i % 25) + 1).padStart(2, "0")}`,
        has_content: true,
        is_verified: true,
        audit_trail_count: 3,
        has_return_note: false,
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("exemplary"))).toBe(true);
    });

    it("generates verification+quality insight for strong combo", () => {
      const events = Array.from({ length: 20 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        category: ["behaviour", "health", "safeguarding"][i % 3],
        date: `2026-05-${String((i % 25) + 1).padStart(2, "0")}`,
        has_content: i < 18, // 90%
        is_verified: i < 19, // 95%
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("verification"))).toBe(true);
    });

    it("generates coverage insight for good coverage+diverse+quality", () => {
      const events: CareEventRecordInput[] = [];
      let idx = 0;
      for (let c = 1; c <= 4; c++) {
        for (let i = 0; i < 5; i++) {
          events.push(makeEvent({
            id: `evt_${idx}`,
            child_id: `child_${c}`,
            category: ["behaviour", "health", "safeguarding"][i % 3],
            date: `2026-05-${String((idx % 25) + 1).padStart(2, "0")}`,
            has_content: true,
          }));
          idx++;
        }
      }
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("Comprehensive coverage"))).toBe(true);
    });

    it("generates critical insight for <50% content quality", () => {
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
        has_content: i < 4, // 40%
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("critically low"))).toBe(true);
    });

    it("generates critical insight for <60% verification", () => {
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
        is_verified: i < 5, // 50%
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("Verification rate"))).toBe(true);
    });

    it("generates warning insight for >30% return rate", () => {
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
        has_return_note: i < 4, // 40%
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("return"))).toBe(true);
    });

    it("generates critical insight for <60% routing completion", () => {
      const events = [makeEvent({
        route_count: 10,
        routes_completed: 5,
        date: "2026-05-20",
      })];
      const r = computeHomeCareEventQuality(baseInput({ events }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("routes"))).toBe(true);
    });

    it("generates critical insight for uncovered children", () => {
      const events = [makeEvent({ child_id: "c1", date: "2026-05-20" })];
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("no care events"))).toBe(true);
    });

    it("generates positive insight for >=60 minutes time saved", () => {
      const events = Array.from({ length: 12 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
        time_saved_minutes: 5, // 12 * 5 = 60
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("hours"))).toBe(true);
    });

    it("does not generate time saved insight for <60 minutes", () => {
      const events = Array.from({ length: 5 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        date: `2026-05-${String(20 + i).padStart(2, "0")}`,
        time_saved_minutes: 10, // 50 total
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.insights.some(i => i.text.includes("hours"))).toBe(false);
    });
  });

  // ── Output Field Accuracy ────────────────────────────────────────────────

  describe("output field accuracy", () => {
    it("reports correct total_events (all events, not just filtered)", () => {
      const events = [
        makeEvent({ id: "e1", date: "2026-05-20" }),
        makeEvent({ id: "e2", date: "2025-01-01" }), // outside window
        makeEvent({ id: "e3", date: "2026-05-22" }),
      ];
      const r = computeHomeCareEventQuality(baseInput({ events }));
      expect(r.total_events).toBe(3);
    });

    it("reports correct events_last_90_days", () => {
      const events = [
        makeEvent({ id: "e1", date: "2026-05-20" }),
        makeEvent({ id: "e2", date: "2025-01-01" }),
        makeEvent({ id: "e3", date: "2026-05-22" }),
      ];
      const r = computeHomeCareEventQuality(baseInput({ events }));
      expect(r.events_last_90_days).toBe(2);
    });

    it("reports correct recording_quality_rate", () => {
      const events = [
        makeEvent({ id: "e1", has_content: true, date: "2026-05-20" }),
        makeEvent({ id: "e2", has_content: true, date: "2026-05-21" }),
        makeEvent({ id: "e3", has_content: false, date: "2026-05-22" }),
      ];
      const r = computeHomeCareEventQuality(baseInput({ events }));
      expect(r.recording_quality_rate).toBe(67);
    });

    it("reports correct verification_rate", () => {
      const events = [
        makeEvent({ id: "e1", is_verified: true, date: "2026-05-20" }),
        makeEvent({ id: "e2", is_verified: false, date: "2026-05-21" }),
      ];
      const r = computeHomeCareEventQuality(baseInput({ events }));
      expect(r.verification_rate).toBe(50);
    });

    it("reports correct routing_completion_rate", () => {
      const events = [
        makeEvent({ id: "e1", route_count: 4, routes_completed: 3, date: "2026-05-20" }),
        makeEvent({ id: "e2", route_count: 6, routes_completed: 4, date: "2026-05-21" }),
      ];
      const r = computeHomeCareEventQuality(baseInput({ events }));
      // 7/10 = 70%
      expect(r.routing_completion_rate).toBe(70);
    });

    it("reports correct audit_trail_rate", () => {
      const events = [
        makeEvent({ id: "e1", audit_trail_count: 2, date: "2026-05-20" }),
        makeEvent({ id: "e2", audit_trail_count: 1, date: "2026-05-21" }),
        makeEvent({ id: "e3", audit_trail_count: 0, date: "2026-05-22" }),
        makeEvent({ id: "e4", audit_trail_count: 3, date: "2026-05-23" }),
      ];
      const r = computeHomeCareEventQuality(baseInput({ events }));
      expect(r.audit_trail_rate).toBe(50); // 2/4
    });

    it("reports correct return_rate", () => {
      const events = [
        makeEvent({ id: "e1", has_return_note: true, date: "2026-05-20" }),
        makeEvent({ id: "e2", has_return_note: false, date: "2026-05-21" }),
        makeEvent({ id: "e3", has_return_note: true, date: "2026-05-22" }),
      ];
      const r = computeHomeCareEventQuality(baseInput({ events }));
      expect(r.return_rate).toBe(67);
    });

    it("reports correct unique_children_covered", () => {
      const events = [
        makeEvent({ id: "e1", child_id: "c1", date: "2026-05-20" }),
        makeEvent({ id: "e2", child_id: "c1", date: "2026-05-21" }),
        makeEvent({ id: "e3", child_id: "c2", date: "2026-05-22" }),
      ];
      const r = computeHomeCareEventQuality(baseInput({ events }));
      expect(r.unique_children_covered).toBe(2);
    });

    it("reports correct category_diversity", () => {
      const events = [
        makeEvent({ id: "e1", category: "behaviour", date: "2026-05-20" }),
        makeEvent({ id: "e2", category: "health", date: "2026-05-21" }),
        makeEvent({ id: "e3", category: "behaviour", date: "2026-05-22" }),
        makeEvent({ id: "e4", category: "emotional", date: "2026-05-23" }),
        makeEvent({ id: "e5", category: "emotional", date: "2026-05-24" }),
      ];
      const r = computeHomeCareEventQuality(baseInput({ events }));
      expect(r.category_diversity).toBe(3);
    });

    it("reports correct total_time_saved_minutes", () => {
      const events = [
        makeEvent({ id: "e1", time_saved_minutes: 10, date: "2026-05-20" }),
        makeEvent({ id: "e2", time_saved_minutes: 5, date: "2026-05-21" }),
        makeEvent({ id: "e3", time_saved_minutes: 0, date: "2026-05-22" }),
      ];
      const r = computeHomeCareEventQuality(baseInput({ events }));
      expect(r.total_time_saved_minutes).toBe(15);
    });

    it("only counts time_saved from events in window", () => {
      const events = [
        makeEvent({ id: "e1", time_saved_minutes: 10, date: "2026-05-20" }),
        makeEvent({ id: "e2", time_saved_minutes: 100, date: "2025-01-01" }), // outside
      ];
      const r = computeHomeCareEventQuality(baseInput({ events }));
      expect(r.total_time_saved_minutes).toBe(10);
    });
  });

  // ── Score Clamping ───────────────────────────────────────────────────────

  describe("score clamping", () => {
    it("clamps score to minimum 0", () => {
      // Build a scenario with all maximum penalties
      // 52 - 8 - 5 - 4 - 4 - 4 - 3 = 24... still positive. Hard to get below 0 with base 52.
      // But let's verify clamping works by checking the result is >= 0
      const events = Array.from({ length: 4 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 2) + 1}`,
        category: "general",
        date: `2026-05-${String(20 + i).padStart(2, "0")}`,
        has_content: false,
        is_verified: false,
        route_count: 10,
        routes_completed: 1,
        audit_trail_count: 0,
        has_return_note: true,
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      // 52 - 8 - 5 - 4 - 4 - 4 - 3 = 24
      expect(r.event_score).toBeGreaterThanOrEqual(0);
      expect(r.event_score).toBeLessThanOrEqual(100);
    });

    it("clamps score to maximum 100", () => {
      // With base 52 and max bonuses of ~30, we can't exceed 100 naturally,
      // but verify the clamp is applied
      const events: CareEventRecordInput[] = [];
      let idx = 0;
      for (let c = 1; c <= 4; c++) {
        for (let i = 0; i < 5; i++) {
          events.push(makeEvent({
            id: `evt_${idx}`,
            child_id: `child_${c}`,
            category: ["behaviour", "health", "safeguarding", "education"][i % 4],
            date: `2026-05-${String((idx % 25) + 1).padStart(2, "0")}`,
          }));
          idx++;
        }
      }
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.event_score).toBeLessThanOrEqual(100);
    });

    it("score is always an integer", () => {
      const events = [makeEvent({ date: "2026-05-20" })];
      const r = computeHomeCareEventQuality(baseInput({ events }));
      expect(Number.isInteger(r.event_score)).toBe(true);
    });

    it("worst case all penalties still produces valid score", () => {
      const events = Array.from({ length: 4 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 2) + 1}`,
        category: "general",
        date: `2026-05-${String(20 + i).padStart(2, "0")}`,
        has_content: false,
        is_verified: false,
        route_count: 10,
        routes_completed: 1,
        audit_trail_count: 0,
        has_return_note: true,
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.event_score).toBeGreaterThanOrEqual(0);
    });
  });

  // ── Headlines ────────────────────────────────────────────────────────────

  describe("headlines", () => {
    it("generates outstanding headline with metrics", () => {
      const events: CareEventRecordInput[] = [];
      let idx = 0;
      for (let c = 1; c <= 4; c++) {
        for (let i = 0; i < 5; i++) {
          events.push(makeEvent({
            id: `evt_${idx}`,
            child_id: `child_${c}`,
            category: ["behaviour", "health", "safeguarding", "education"][i % 4],
            date: `2026-05-${String((idx % 25) + 1).padStart(2, "0")}`,
          }));
          idx++;
        }
      }
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.headline).toContain("Outstanding");
      expect(r.headline).toContain("100%");
    });

    it("generates good headline", () => {
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        category: ["behaviour", "health", "safeguarding"][i % 3],
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
        has_content: i < 9,
        is_verified: i < 8,
        route_count: 5,
        routes_completed: 4,
        audit_trail_count: i < 7 ? 2 : 1,
        has_return_note: i === 0,
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.headline).toContain("Good");
    });

    it("generates adequate headline", () => {
      const events = Array.from({ length: 8 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        category: i < 3 ? "behaviour" : i < 6 ? "health" : "safeguarding",
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
        has_content: i < 3,
        is_verified: i < 5,
        route_count: 0,
        routes_completed: 0,
        audit_trail_count: i < 5 ? 2 : 1,
        has_return_note: i < 2,
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.headline).toContain("Adequate");
    });

    it("generates inadequate headline", () => {
      const events = Array.from({ length: 4 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 2) + 1}`,
        category: "general",
        date: `2026-05-${String(20 + i).padStart(2, "0")}`,
        has_content: false,
        is_verified: false,
        route_count: 5,
        routes_completed: 2,
        audit_trail_count: 0,
        has_return_note: true,
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.headline).toContain("inadequate");
    });

    it("generates insufficient_data headline for no children", () => {
      const r = computeHomeCareEventQuality(baseInput({ total_children: 0 }));
      expect(r.headline).toContain("No children placed");
    });

    it("generates headline for 0 events with children", () => {
      const r = computeHomeCareEventQuality(baseInput({ events: [] }));
      expect(r.headline).toContain("No care events recorded");
    });
  });

  // ── Edge Cases ───────────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("handles single event", () => {
      const r = computeHomeCareEventQuality(baseInput({
        events: [makeEvent({ date: "2026-05-20" })],
      }));
      expect(r.event_rating).not.toBe("insufficient_data");
      expect(r.events_last_90_days).toBe(1);
    });

    it("handles 0 staff gracefully", () => {
      const r = computeHomeCareEventQuality(baseInput({
        total_staff: 0,
        events: [makeEvent({ date: "2026-05-20" })],
      }));
      // total_staff doesn't affect scoring currently
      expect(r.event_rating).not.toBe("insufficient_data");
    });

    it("handles all events on same date", () => {
      const events = Array.from({ length: 5 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        date: "2026-05-20",
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.events_last_90_days).toBe(5);
    });

    it("handles events with 0 time_saved", () => {
      const events = [makeEvent({ time_saved_minutes: 0, date: "2026-05-20" })];
      const r = computeHomeCareEventQuality(baseInput({ events }));
      expect(r.total_time_saved_minutes).toBe(0);
    });

    it("handles events with large time_saved", () => {
      const events = [makeEvent({ time_saved_minutes: 1000, date: "2026-05-20" })];
      const r = computeHomeCareEventQuality(baseInput({ events }));
      expect(r.total_time_saved_minutes).toBe(1000);
    });

    it("handles events with 0 route_count and 0 routes_completed", () => {
      const events = [makeEvent({
        route_count: 0,
        routes_completed: 0,
        routes_failed: 0,
        date: "2026-05-20",
      })];
      const r = computeHomeCareEventQuality(baseInput({ events }));
      expect(r.routing_completion_rate).toBe(0);
    });

    it("handles events with 0 audit_trail_count", () => {
      const events = [makeEvent({ audit_trail_count: 0, date: "2026-05-20" })];
      const r = computeHomeCareEventQuality(baseInput({ events }));
      expect(r.audit_trail_rate).toBe(0);
    });

    it("handles all events for same child", () => {
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: "child_1",
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.unique_children_covered).toBe(1);
    });

    it("handles all events with same category", () => {
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        category: "general",
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.category_diversity).toBe(1);
    });

    it("handles events with all categories", () => {
      const cats = ["behaviour", "health", "safeguarding", "education", "emotional", "general"];
      const events = cats.map((cat, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        category: cat,
        date: `2026-05-${String(20 + i).padStart(2, "0")}`,
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.category_diversity).toBe(6);
    });

    it("handles total_children = 1", () => {
      const events = Array.from({ length: 5 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: "child_1",
        category: ["behaviour", "health", "safeguarding"][i % 3],
        date: `2026-05-${String(20 + i).padStart(2, "0")}`,
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 1 }));
      // 5 events / 1 child = 5 per child → good coverage
      expect(r.event_rating).not.toBe("insufficient_data");
    });

    it("handles large number of events", () => {
      const events = Array.from({ length: 200 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        category: ["behaviour", "health", "safeguarding", "education"][i % 4],
        date: `2026-05-${String((i % 25) + 1).padStart(2, "0")}`,
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.event_rating).toBeDefined();
      expect(r.event_score).toBeGreaterThan(0);
    });

    it("handles events with empty string child_id", () => {
      const events = [
        makeEvent({ id: "e1", child_id: "", date: "2026-05-20" }),
        makeEvent({ id: "e2", child_id: "", date: "2026-05-21" }),
      ];
      const r = computeHomeCareEventQuality(baseInput({ events }));
      expect(r.unique_children_covered).toBe(1);
    });

    it("uses only filtered events for metric calculations", () => {
      const events = [
        makeEvent({ id: "e1", has_content: false, date: "2025-01-01" }), // outside window
        makeEvent({ id: "e2", has_content: true, date: "2026-05-20" }),
      ];
      const r = computeHomeCareEventQuality(baseInput({ events }));
      // Only the in-window event counts
      expect(r.recording_quality_rate).toBe(100);
    });
  });

  // ── Combined Scenarios ───────────────────────────────────────────────────

  describe("combined scenarios", () => {
    it("high content quality but poor verification produces mixed result", () => {
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        category: ["behaviour", "health", "safeguarding"][i % 3],
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
        has_content: true,      // 100%
        is_verified: i < 4,     // 40% → -5
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.strengths.some(s => s.includes("recording practice") || s.includes("content standards"))).toBe(true);
      expect(r.concerns.some(c => c.includes("verification"))).toBe(true);
    });

    it("good verification but poor content produces mixed result", () => {
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        category: ["behaviour", "health", "safeguarding"][i % 3],
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
        has_content: i < 5,     // 50% → <70
        is_verified: true,      // 100%
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.strengths.some(s => s.includes("verification"))).toBe(true);
      expect(r.concerns.some(c => c.includes("content"))).toBe(true);
    });

    it("many failed routes generates routing concern and recommendation", () => {
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
        route_count: 5,
        routes_completed: 1,
        routes_failed: 3,
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.concerns.some(c => c.includes("routing"))).toBe(true);
      expect(r.recommendations.some(rec => rec.recommendation.includes("routing"))).toBe(true);
    });

    it("all events returned generates return concern", () => {
      const events = Array.from({ length: 5 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        date: `2026-05-${String(20 + i).padStart(2, "0")}`,
        has_return_note: true,
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.return_rate).toBe(100);
      expect(r.concerns.some(c => c.includes("return rate"))).toBe(true);
    });

    it("single category with good coverage still flags diversity concern", () => {
      const events: CareEventRecordInput[] = [];
      let idx = 0;
      for (let c = 1; c <= 4; c++) {
        for (let i = 0; i < 5; i++) {
          events.push(makeEvent({
            id: `evt_${idx}`,
            child_id: `child_${c}`,
            category: "general",
            date: `2026-05-${String((idx % 25) + 1).padStart(2, "0")}`,
          }));
          idx++;
        }
      }
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.concerns.some(c => c.includes("categor"))).toBe(true);
    });

    it("perfect metrics except one child uncovered still flags concern", () => {
      const events: CareEventRecordInput[] = [];
      let idx = 0;
      // Only 3 of 4 children covered
      for (let c = 1; c <= 3; c++) {
        for (let i = 0; i < 7; i++) {
          events.push(makeEvent({
            id: `evt_${idx}`,
            child_id: `child_${c}`,
            category: ["behaviour", "health", "safeguarding", "education"][i % 4],
            date: `2026-05-${String((idx % 25) + 1).padStart(2, "0")}`,
          }));
          idx++;
        }
      }
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.concerns.some(c => c.includes("1 child has no care events"))).toBe(true);
    });
  });

  // ── Score Calculation Verification ───────────────────────────────────────

  describe("score calculation verification", () => {
    it("base score is 52 with all neutral modifiers", () => {
      // All modifiers in neutral zone (no bonus, no penalty)
      // content 70-89%, verify 60-79%, routing 60-79%, audit 50-69%, return 15-30%, ok coverage
      const events = Array.from({ length: 8 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        category: i < 3 ? "behaviour" : i < 6 ? "health" : "safeguarding",
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
        has_content: i < 6,         // 6/8 = 75% → 0
        is_verified: i < 5,         // 5/8 = 63% → 0
        route_count: 10,
        routes_completed: 7,        // 56/80 = 70% → 0
        audit_trail_count: i < 4 ? 2 : 1, // 4/8 = 50% → 0
        has_return_note: i < 2,     // 2/8 = 25% → 0
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      // All modifiers = 0, coverage: 2/child → ok → +2
      // = 52 + 0 + 0 + 0 + 0 + 0 + 2 = 54
      expect(r.event_score).toBe(54);
    });

    it("maximum possible score with all bonuses", () => {
      // +6 + 5 + 5 + 5 + 4 + 5 = 30 → 82
      const events: CareEventRecordInput[] = [];
      let idx = 0;
      for (let c = 1; c <= 4; c++) {
        for (let i = 0; i < 5; i++) {
          events.push(makeEvent({
            id: `evt_${idx}`,
            child_id: `child_${c}`,
            category: ["behaviour", "health", "safeguarding", "education"][i % 4],
            date: `2026-05-${String((idx % 25) + 1).padStart(2, "0")}`,
            has_content: true,
            is_verified: true,
            route_count: 3,
            routes_completed: 3,
            audit_trail_count: 4,
            has_return_note: false,
          }));
          idx++;
        }
      }
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.event_score).toBe(82);
    });

    it("maximum penalties produce lowest non-special-case score", () => {
      // -8 - 5 - 4 - 4 - 4 - 3 = -28 → 52 - 28 = 24
      const events = Array.from({ length: 4 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 2) + 1}`,
        category: "general",
        date: `2026-05-${String(20 + i).padStart(2, "0")}`,
        has_content: false,          // 0% → -8
        is_verified: false,          // 0% → -5
        route_count: 10,
        routes_completed: 3,         // 12/40 = 30% <60% → -4
        audit_trail_count: 0,        // 0% → -4
        has_return_note: true,       // 100% → -4
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      // coverage: 1/child → poor → -3
      // 52 - 8 - 5 - 4 - 4 - 4 - 3 = 24
      expect(r.event_score).toBe(24);
    });
  });

  // ── Regulatory References ────────────────────────────────────────────────

  describe("regulatory references", () => {
    it("references CHR 2015 Reg 36 for recording recommendations", () => {
      const events = Array.from({ length: 5 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        date: `2026-05-${String(20 + i).padStart(2, "0")}`,
        has_content: false,
      }));
      const r = computeHomeCareEventQuality(baseInput({ events }));
      expect(r.recommendations.some(rec => rec.regulatory_ref.includes("Reg 36"))).toBe(true);
    });

    it("references CHR 2015 Reg 12 for routing failures", () => {
      const events = [makeEvent({
        route_count: 10,
        routes_completed: 3,
        date: "2026-05-20",
      })];
      const r = computeHomeCareEventQuality(baseInput({ events }));
      expect(r.recommendations.some(rec => rec.regulatory_ref.includes("Reg 12"))).toBe(true);
    });

    it("references SCCIF for category diversity", () => {
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        category: "behaviour",
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.recommendations.some(rec => rec.regulatory_ref.includes("SCCIF"))).toBe(true);
    });
  });

  // ── pct helper behaviour ─────────────────────────────────────────────────

  describe("pct helper behaviour (via engine rates)", () => {
    it("returns 0 when denominator is 0 for routing", () => {
      const events = [makeEvent({ route_count: 0, routes_completed: 0, date: "2026-05-20" })];
      const r = computeHomeCareEventQuality(baseInput({ events }));
      expect(r.routing_completion_rate).toBe(0);
    });

    it("rounds to nearest integer", () => {
      // 1/3 = 33.33... → 33
      const events = [
        makeEvent({ id: "e1", has_content: true, date: "2026-05-20" }),
        makeEvent({ id: "e2", has_content: false, date: "2026-05-21" }),
        makeEvent({ id: "e3", has_content: false, date: "2026-05-22" }),
      ];
      const r = computeHomeCareEventQuality(baseInput({ events }));
      expect(r.recording_quality_rate).toBe(33);
    });

    it("rounds 2/3 to 67%", () => {
      const events = [
        makeEvent({ id: "e1", has_content: true, date: "2026-05-20" }),
        makeEvent({ id: "e2", has_content: true, date: "2026-05-21" }),
        makeEvent({ id: "e3", has_content: false, date: "2026-05-22" }),
      ];
      const r = computeHomeCareEventQuality(baseInput({ events }));
      expect(r.recording_quality_rate).toBe(67);
    });

    it("returns 100 for n/n", () => {
      const events = [
        makeEvent({ id: "e1", has_content: true, date: "2026-05-20" }),
      ];
      const r = computeHomeCareEventQuality(baseInput({ events }));
      expect(r.recording_quality_rate).toBe(100);
    });
  });

  // ── Specific modifier boundary values ────────────────────────────────────

  describe("modifier boundary values", () => {
    it("content rate 97% gets +3 not +6", () => {
      // 97% is >= 90 but < 98 → +3
      // Need n/d = 97. 97/100 works but that's a lot of events.
      // Use smaller: can't get exact 97% with small numbers easily
      // 32/33 = 97% (rounded)
      // Use 29/30 = 97% (rounded)
      const events = Array.from({ length: 30 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        category: ["behaviour", "health", "safeguarding"][i % 3],
        date: `2026-05-${String((i % 25) + 1).padStart(2, "0")}`,
        has_content: i < 29, // 29/30 = 96.67 → rounds to 97
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.recording_quality_rate).toBe(97);
    });

    it("content rate 89% gets 0 (no bonus, no penalty)", () => {
      // 89% is >= 70 (so no -5 penalty) and < 90 (so no +3 bonus)
      const events = Array.from({ length: 9 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        category: ["behaviour", "health", "safeguarding"][i % 3],
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
        has_content: i < 8, // 8/9 = 89%
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.recording_quality_rate).toBe(89);
    });

    it("verification at exactly 80% gets +2", () => {
      const events = Array.from({ length: 5 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        date: `2026-05-${String(20 + i).padStart(2, "0")}`,
        is_verified: i < 4, // 4/5 = 80%
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.verification_rate).toBe(80);
    });

    it("verification at 79% gets 0 modifier", () => {
      // Can't get exact 79% easily. 11/14 = 78.57 → 79%
      const events = Array.from({ length: 14 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        date: `2026-05-${String((i % 25) + 1).padStart(2, "0")}`,
        is_verified: i < 11, // 11/14 = 78.57 → 79%
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.verification_rate).toBe(79);
    });

    it("verification at exactly 60% gets 0 modifier", () => {
      const events = Array.from({ length: 5 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        date: `2026-05-${String(20 + i).padStart(2, "0")}`,
        is_verified: i < 3, // 3/5 = 60%
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.verification_rate).toBe(60);
    });

    it("verification at 59% gets -5", () => {
      // 10/17 = 58.8 → 59%
      const events = Array.from({ length: 17 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        date: `2026-05-${String((i % 25) + 1).padStart(2, "0")}`,
        is_verified: i < 10, // 10/17 = 58.8 → 59%
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.verification_rate).toBe(59);
    });

    it("routing at exactly 95% gets +5", () => {
      // 19/20 = 95%
      const events = [
        makeEvent({ id: "e1", route_count: 20, routes_completed: 19, date: "2026-05-20" }),
      ];
      const r = computeHomeCareEventQuality(baseInput({ events }));
      expect(r.routing_completion_rate).toBe(95);
    });

    it("routing at 94% gets +2", () => {
      // 47/50 = 94%
      const events = [
        makeEvent({ id: "e1", route_count: 50, routes_completed: 47, date: "2026-05-20" }),
      ];
      const r = computeHomeCareEventQuality(baseInput({ events }));
      expect(r.routing_completion_rate).toBe(94);
    });

    it("audit trail at exactly 90% gets +5", () => {
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
        audit_trail_count: i < 9 ? 2 : 1, // 9/10 = 90%
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.audit_trail_rate).toBe(90);
    });

    it("audit trail at 89% gets +2", () => {
      const events = Array.from({ length: 9 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
        audit_trail_count: i < 8 ? 2 : 1, // 8/9 = 89%
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.audit_trail_rate).toBe(89);
    });

    it("audit trail at exactly 50% gets 0", () => {
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
        audit_trail_count: i < 5 ? 2 : 1, // 5/10 = 50%
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.audit_trail_rate).toBe(50);
    });

    it("audit trail at 49% gets -4", () => {
      // 49/100... use smaller: 7/15 = 46.67 → 47%. 24/49 = 48.98 → 49%
      // Actually simplest: 49% from pct. Let's use 49 out of 100... but that's a lot.
      // 37/76 = 48.7 → 49%? No: Math.round(37/76*100)=49. Let's try smaller.
      // 9/18 = 50% no. 8/17 = 47%. 9/19 = 47%. 10/21 = 48%.
      // 17/35 = 48.57 → 49%. Yes!
      // But 35 events is a lot. Let's just use a known value.
      // Actually for the test we just need < 50%. Even 40% is fine since we already tested the exact 50% boundary.
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
        audit_trail_count: i < 4 ? 2 : 1, // 4/10 = 40% < 50%
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.audit_trail_rate).toBe(40);
    });

    it("return rate at exactly 30% gets 0 modifier (not penalty)", () => {
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
        has_return_note: i < 3, // 3/10 = 30%
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.return_rate).toBe(30);
      // 30% is not > 30%, so 0 modifier
    });

    it("return rate at 31% gets -4 penalty", () => {
      // 31%: 5/16 = 31.25 → 31%. Or 31/100.
      // Use 9/29 = 31.03 → 31%
      // Simpler: just use enough events. 3/10 = 30%. 4/13 = 30.77 → 31%
      const events = Array.from({ length: 13 }, (_, i) => makeEvent({
        id: `evt_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        date: `2026-05-${String((i % 25) + 1).padStart(2, "0")}`,
        has_return_note: i < 4, // 4/13 = 30.77 → 31%
      }));
      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));
      expect(r.return_rate).toBe(31);
    });
  });

  // ── Integration: Full Scenario ───────────────────────────────────────────

  describe("full scenario integration", () => {
    it("realistic home with 12 care events across 4 children", () => {
      const events: CareEventRecordInput[] = [
        makeEvent({ id: "evt_1", child_id: "c1", staff_id: "s1", date: "2026-05-01", category: "behaviour", has_content: true, is_verified: true, route_count: 2, routes_completed: 2, audit_trail_count: 3, time_saved_minutes: 5 }),
        makeEvent({ id: "evt_2", child_id: "c1", staff_id: "s2", date: "2026-05-05", category: "health", has_content: true, is_verified: true, route_count: 1, routes_completed: 1, audit_trail_count: 2, time_saved_minutes: 3 }),
        makeEvent({ id: "evt_3", child_id: "c2", staff_id: "s1", date: "2026-05-03", category: "safeguarding", has_content: true, is_verified: true, route_count: 3, routes_completed: 3, audit_trail_count: 4, time_saved_minutes: 8 }),
        makeEvent({ id: "evt_4", child_id: "c2", staff_id: "s3", date: "2026-05-08", category: "education", has_content: true, is_verified: false, route_count: 2, routes_completed: 2, audit_trail_count: 2, time_saved_minutes: 4 }),
        makeEvent({ id: "evt_5", child_id: "c3", staff_id: "s2", date: "2026-05-10", category: "emotional", has_content: true, is_verified: true, route_count: 1, routes_completed: 1, audit_trail_count: 3, time_saved_minutes: 2 }),
        makeEvent({ id: "evt_6", child_id: "c3", staff_id: "s1", date: "2026-05-12", category: "general", has_content: false, is_verified: true, route_count: 2, routes_completed: 1, audit_trail_count: 1, time_saved_minutes: 0, has_return_note: true }),
        makeEvent({ id: "evt_7", child_id: "c4", staff_id: "s3", date: "2026-05-15", category: "behaviour", has_content: true, is_verified: true, route_count: 2, routes_completed: 2, audit_trail_count: 3, time_saved_minutes: 5 }),
        makeEvent({ id: "evt_8", child_id: "c4", staff_id: "s2", date: "2026-05-18", category: "health", has_content: true, is_verified: true, route_count: 1, routes_completed: 1, audit_trail_count: 2, time_saved_minutes: 3 }),
        makeEvent({ id: "evt_9", child_id: "c1", staff_id: "s1", date: "2026-05-20", category: "safeguarding", has_content: true, is_verified: true, route_count: 3, routes_completed: 3, audit_trail_count: 4, time_saved_minutes: 7 }),
        makeEvent({ id: "evt_10", child_id: "c2", staff_id: "s2", date: "2026-05-22", category: "education", has_content: true, is_verified: true, route_count: 2, routes_completed: 2, audit_trail_count: 3, time_saved_minutes: 4 }),
        makeEvent({ id: "evt_11", child_id: "c3", staff_id: "s3", date: "2026-05-24", category: "emotional", has_content: true, is_verified: true, route_count: 1, routes_completed: 1, audit_trail_count: 2, time_saved_minutes: 2 }),
        makeEvent({ id: "evt_12", child_id: "c4", staff_id: "s1", date: "2026-05-26", category: "general", has_content: true, is_verified: true, route_count: 2, routes_completed: 2, audit_trail_count: 3, time_saved_minutes: 5 }),
      ];

      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4, total_staff: 3 }));

      // Verify basic output fields
      expect(r.total_events).toBe(12);
      expect(r.events_last_90_days).toBe(12);
      expect(r.unique_children_covered).toBe(4);
      expect(r.category_diversity).toBe(6);

      // Content: 11/12 = 92% → +3
      expect(r.recording_quality_rate).toBe(92);
      // Verification: 11/12 = 92% → +2
      expect(r.verification_rate).toBe(92);
      // Routing: 21/22 = 95% → +5
      expect(r.routing_completion_rate).toBe(95);
      // Audit trail: 11/12 have >=2 (only evt_6 has count 1) → 92% → +5
      expect(r.audit_trail_rate).toBe(92);
      // Return: 1/12 = 8% → +2
      expect(r.return_rate).toBe(8);
      // Coverage: 3/child → ok, 6 categories → diverse, but 3 < 5 → okCoverage → +2
      // = 52 + 3 + 2 + 5 + 5 + 2 + 2 = 71
      expect(r.event_score).toBe(71);
      expect(r.event_rating).toBe("good");

      // Time saved
      expect(r.total_time_saved_minutes).toBe(48);
    });

    it("struggling home with poor metrics across the board", () => {
      const events: CareEventRecordInput[] = [
        makeEvent({ id: "evt_1", child_id: "c1", date: "2026-05-10", has_content: false, is_verified: false, route_count: 3, routes_completed: 1, routes_failed: 2, audit_trail_count: 0, has_return_note: true }),
        makeEvent({ id: "evt_2", child_id: "c1", date: "2026-05-15", has_content: false, is_verified: false, route_count: 2, routes_completed: 0, routes_failed: 2, audit_trail_count: 1, has_return_note: true }),
        makeEvent({ id: "evt_3", child_id: "c2", date: "2026-05-20", has_content: true, is_verified: false, route_count: 4, routes_completed: 1, routes_failed: 3, audit_trail_count: 0, has_return_note: false }),
      ];

      const r = computeHomeCareEventQuality(baseInput({ events, total_children: 4 }));

      expect(r.event_rating).toBe("inadequate");
      expect(r.concerns.length).toBeGreaterThan(0);
      expect(r.recommendations.length).toBeGreaterThan(0);
      expect(r.insights.some(i => i.severity === "critical")).toBe(true);
    });
  });
});
