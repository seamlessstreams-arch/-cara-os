import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { reviewTone } from "@/lib/philosophy/covenant";
import {
  CIRCLE_KINDS,
  CIRCLE_DEFINITIONS,
  buildRhythmView,
  suggestPrompt,
  nextOccurrence,
  validateCircleNote,
  type CircleNote,
  type CircleRhythm,
} from "../rhythm-engine";

const NOW = new Date("2026-07-17T09:00:00.000Z");
const day = (n: number) => new Date(NOW.getTime() - n * 86_400_000).toISOString().slice(0, 10);

const rhythm = (over: Partial<CircleRhythm> = {}): CircleRhythm => ({
  id: "cr_1",
  home_id: "home_oak",
  kind: "check_in",
  starts_at: "2026-07-13T08:30:00.000Z",
  recurrence: { freq: "daily", interval: 1, until: null, count: null },
  enabled: true,
  created_at: "2026-07-01T00:00:00.000Z",
  updated_at: "2026-07-01T00:00:00.000Z",
  ...over,
});

const note = (over: Partial<CircleNote> = {}): CircleNote => ({
  id: `cn_${Math.abs(hash(JSON.stringify(over)))}`,
  home_id: "home_oak",
  kind: "check_out",
  date: day(1),
  facilitated_by: "staff_darren",
  themes: [],
  gratitude: [],
  emerging_concerns: [],
  created_at: "2026-07-16T20:00:00.000Z",
  created_by: "staff_darren",
  ...over,
});

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

describe("a circle is not a compliance task", () => {
  it("exposes no completion, attendance or missed-circle number anywhere in the view", () => {
    const view = buildRhythmView([rhythm()], [note({ themes: ["tired"] })], NOW);
    const keys = JSON.stringify(view).toLowerCase();
    for (const forbidden of ["compliance", "completionrate", "attendance", "missed", "overdue", "adherence"]) {
      expect(keys).not.toContain(forbidden);
    }
  });

  it("treats a rhythm with nothing captured as unremarkable, not as a failure", () => {
    const view = buildRhythmView([rhythm()], [], NOW);
    expect(view.summary).toMatch(/may well be happening/i);
    expect(view.summary).not.toMatch(/missed|failed|overdue|non-complian/i);
  });

  it("says plainly that a home with no circles is not failing", () => {
    const view = buildRhythmView([], [], NOW);
    expect(view.configured).toBe(false);
    expect(view.summary).toMatch(/optional/i);
    expect(view.themes).toEqual([]);
  });

  it("honours a switched-off circle rather than nagging about it", () => {
    const view = buildRhythmView([rhythm({ enabled: false })], [], NOW);
    expect(view.configured).toBe(false);
    expect(view.upcoming).toEqual([]);
  });
});

describe("supportive, not surveillant", () => {
  it("has no attendee or participant field to surveil with — the shape forbids it", () => {
    // The guarantee is structural: you cannot write the per-person report if the
    // record never held per-person data.
    const src = readFileSync(join(__dirname, "..", "rhythm-engine.ts"), "utf8");
    const iface = src.slice(src.indexOf("export interface CircleNote"), src.indexOf("export interface ThemeSignal"));
    for (const banned of ["attendees", "participants", "attended", "present:", "absent"]) {
      expect(iface).not.toContain(banned);
    }
  });

  it("counts themes across CIRCLES, never across people", () => {
    const view = buildRhythmView(
      [rhythm()],
      [
        note({ date: day(1), themes: ["Short-staffed evenings"], facilitated_by: "staff_a" }),
        note({ date: day(3), themes: ["short-staffed evenings"], facilitated_by: "staff_b" }),
        note({ date: day(5), themes: ["Short-Staffed Evenings"], facilitated_by: "staff_a" }),
      ],
      NOW,
    );
    const t = view.themes[0];
    expect(t.circles).toBe(3); // three circles, not "staff_a said it twice"
    expect(t.whyShown).toMatch(/3 separate circles/);
    expect(JSON.stringify(view.themes)).not.toContain("staff_a");
  });

  it("says once is a moment, twice is a pattern", () => {
    const view = buildRhythmView([rhythm()], [note({ themes: ["one-off grumble"] })], NOW);
    expect(view.themes).toEqual([]); // a single mention is not a finding
  });

  it("carries gratitude for recognition without ranking anyone", () => {
    const view = buildRhythmView(
      [rhythm()],
      [note({ gratitude: ["Priya stayed late to sit with Casey"] })],
      NOW,
    );
    expect(view.gratitude[0].text).toMatch(/Priya stayed late/);
    expect(JSON.stringify(view)).not.toMatch(/score|rank|leaderboard/i);
  });
});

describe("a concern raised in a circle is a concern, not circle data", () => {
  it("routes a safeguarding worry out to the safeguarding record, today", () => {
    const view = buildRhythmView(
      [rhythm()],
      [note({ emerging_concerns: ["Jordan said something that sounded unsafe about his weekends"] })],
      NOW,
    );
    expect(view.handoffs).toHaveLength(1);
    expect(view.handoffs[0].suggestedRoute).toMatch(/safeguarding/i);
    expect(view.handoffs[0].why).toMatch(/where it belongs, today/i);
  });

  it("routes something a child raised into the voice follow-through loop", () => {
    const view = buildRhythmView(
      [rhythm()],
      [note({ emerging_concerns: ["Casey asked again about seeing her brother"] })],
      NOW,
    );
    expect(view.handoffs[0].suggestedRoute).toMatch(/voice/i);
  });

  it("routes named capacity to a conversation rather than quiet absorption", () => {
    const view = buildRhythmView(
      [rhythm()],
      [note({ emerging_concerns: ["Evening cover is too thin to do bedtime properly"] })],
      NOW,
    );
    expect(view.handoffs[0].suggestedRoute).toMatch(/supervision|manager/i);
    expect(view.handoffs[0].why).toMatch(/negotiated, not quietly absorbed/i);
  });

  it("uses word-boundary matching — 'harmless' must not trip safeguarding", () => {
    const view = buildRhythmView(
      [rhythm()],
      [note({ emerging_concerns: ["A harmless mix-up over the film night list"] })],
      NOW,
    );
    expect(view.handoffs[0].suggestedRoute).not.toMatch(/safeguarding/i);
  });

  it("always gives a concern somewhere to go", () => {
    const view = buildRhythmView([rhythm()], [note({ emerging_concerns: ["Something vague"] })], NOW);
    expect(view.handoffs[0].suggestedRoute.length).toBeGreaterThan(0);
  });
});

describe("the suggested question", () => {
  it("is deterministic — same circle, same day, same opener on every screen", () => {
    expect(suggestPrompt("check_in", "2026-07-17")).toBe(suggestPrompt("check_in", "2026-07-17"));
  });

  it("rotates across days rather than asking the same thing forever", () => {
    const week = [...Array(5)].map((_, i) => suggestPrompt("check_in", `2026-07-1${i + 3}`));
    expect(new Set(week).size).toBeGreaterThan(1);
  });

  it("comes from the bank for that circle, never invented", () => {
    for (const kind of CIRCLE_KINDS) {
      const def = CIRCLE_DEFINITIONS.find((d) => d.kind === kind)!;
      expect(def.prompts).toContain(suggestPrompt(kind, "2026-07-17"));
    }
  });
});

describe("one scheduler, not two", () => {
  it("computes the next circle with the calendar's own recurrence maths", () => {
    const next = nextOccurrence(rhythm(), NOW.toISOString());
    expect(next).toBeTruthy();
    expect(Date.parse(next!)).toBeGreaterThanOrEqual(NOW.getTime());
  });

  it("returns null once a rhythm has run out rather than inventing one", () => {
    const ended = rhythm({ recurrence: { freq: "weekly", interval: 1, until: "2026-07-01", count: null } });
    expect(nextOccurrence(ended, NOW.toISOString())).toBeNull();
  });

  it("orders upcoming circles soonest first", () => {
    const view = buildRhythmView(
      [rhythm({ id: "a", kind: "check_out", starts_at: "2026-07-20T20:00:00.000Z", recurrence: null }),
       rhythm({ id: "b", kind: "check_in", starts_at: "2026-07-18T08:30:00.000Z", recurrence: null })],
      [],
      NOW,
    );
    expect(view.upcoming.map((u) => u.kind)).toEqual(["check_in", "check_out"]);
  });
});

describe("capture asks for almost nothing", () => {
  it("accepts a circle with a single thank you and nothing else", () => {
    expect(validateCircleNote({ kind: "check_out", date: "2026-07-17", gratitude: ["Good shift, all"] })).toBeNull();
  });

  it("asks for a date and a kind", () => {
    expect(validateCircleNote({ kind: "check_in", themes: ["x"] })).toMatch(/date/i);
    expect(validateCircleNote({ date: "2026-07-17", themes: ["x"] })).toMatch(/which circle/i);
  });

  it("invites rather than scolds when nothing was entered", () => {
    const err = validateCircleNote({ kind: "check_in", date: "2026-07-17" })!;
    expect(err).toMatch(/a few words is plenty/i);
    expect(err).not.toMatch(/required|invalid|must/i);
  });
});

describe("the shipped copy honours the language covenant", () => {
  it("carries no deficit, accusatory or blaming language", () => {
    for (const d of CIRCLE_DEFINITIONS) {
      expect(reviewTone(d.purpose, "to_staff")).toEqual([]);
      for (const p of d.prompts) expect(reviewTone(p, "to_staff")).toEqual([]);
    }
  });

  it("keeps the summaries warm in every state", () => {
    for (const view of [
      buildRhythmView([], [], NOW),
      buildRhythmView([rhythm()], [], NOW),
      buildRhythmView([rhythm()], [note({ themes: ["a"] })], NOW),
    ]) {
      expect(reviewTone(view.summary, "to_staff")).toEqual([]);
    }
  });
});
