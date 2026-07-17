import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { reviewTone } from "@/lib/philosophy/covenant";
import {
  bandOf,
  buildRoutineActivityView,
  ROUTINE_ACTIVITY_CAVEAT,
  type IncidentPoint,
  type ShiftPoint,
} from "../routine-activity-engine";

const NOW = new Date("2026-07-17T09:00:00.000Z");
const day = (n: number) => new Date(NOW.getTime() - n * 86_400_000).toISOString().slice(0, 10);

let seq = 0;
const inc = (over: Partial<IncidentPoint> = {}): IncidentPoint => ({
  id: `inc_${++seq}`,
  date: day(3),
  time: "16:10",
  location: "Communal Lounge",
  ...over,
});

const shift = (over: Partial<ShiftPoint> = {}): ShiftPoint => ({
  id: `sh_${++seq}`,
  staff_id: "staff_a",
  date: day(3),
  start_time: "08:00",
  end_time: "17:00",
  status: "confirmed",
  ...over,
});

describe("the triangle has three legs — Cara computes exactly one", () => {
  it("has no machinery anywhere for a motivated person or a suitable target", () => {
    // The guarantee is structural: there is no field, no function, no output
    // that could mark a child as the danger or as the prey.
    const src = readFileSync(join(__dirname, "..", "routine-activity-engine.ts"), "utf8");
    const code = src.slice(src.indexOf("export type Band")); // skip the header prose
    for (const banned of ["motivatedOffender", "motivated_offender", "suitableTarget", "suitable_target", "offenderScore", "vulnerabilityScore", "targetScore"]) {
      expect(code).not.toContain(banned);
    }
  });

  it("never puts a child id in its output — the unit is a time and a place", () => {
    const view = buildRoutineActivityView(
      [inc({ location: "Alex's Bedroom" }), inc({ location: "Alex's Bedroom" }), inc({ location: "Alex's Bedroom" })],
      [shift()],
      NOW,
    );
    expect(JSON.stringify(view)).not.toMatch(/yp_[a-z]+/);
  });

  it("asks an environmental question even where a place names a child", () => {
    const view = buildRoutineActivityView(
      [inc({ location: "Alex's Bedroom" }), inc({ location: "Alex's Bedroom" }), inc({ location: "Alex's Bedroom" })],
      [shift()],
      NOW,
    );
    const f = view.findings.find((x) => x.key === "place_concentration" || x.key === "convergence")!;
    expect(f.question).toMatch(/what is that space like|was the .* what anyone had in mind/i);
    expect(f.question).not.toMatch(/why does alex|what is wrong with/i);
  });
});

describe("unknown time gets to be unknown", () => {
  it("does not default an unparseable time into afternoon", () => {
    // emotional-safety's timeBucket returns "afternoon" here. Reusing it would
    // pile unstamped records into one band and manufacture a phantom cluster.
    for (const bad of ["", "   ", "nonsense", "25:00", null, undefined]) {
      expect(bandOf(bad)).toBe("unknown");
    }
    expect(bandOf("16:10")).toBe("afternoon");
    expect(bandOf("08:15")).toBe("morning");
    expect(bandOf("19:10")).toBe("evening");
    expect(bandOf("23:40")).toBe("night");
    expect(bandOf("02:00")).toBe("night");
  });

  it("reports unstamped incidents as a record gap, not as a finding about the home", () => {
    const view = buildRoutineActivityView([inc({ time: null }), inc({ time: "" })], [shift()], NOW);
    const f = view.findings.find((x) => x.key === "time_unrecorded")!;
    expect(f.headline).toMatch(/2 incidents with no usable time/i);
    expect(f.whyShown).toMatch(/has not guessed/i);
    expect(f.readings[0]).toMatch(/gap in the record, not a finding about the home/i);
  });
});

describe("a cluster is not a cause", () => {
  it("always gives both readings, never picks the one that sounds like an insight", () => {
    const view = buildRoutineActivityView(
      [inc(), inc(), inc(), inc()],
      [shift(), shift({ staff_id: "staff_b" })],
      NOW,
    );
    const f = view.findings.find((x) => x.key === "convergence" || x.key === "place_concentration")!;
    expect(f.readings.length).toBeGreaterThanOrEqual(2);
    expect(JSON.stringify(f.readings)).toMatch(/cannot tell|may be/i);
  });

  it("says plainly that Cara cannot tell them apart, on a convergence", () => {
    const view = buildRoutineActivityView(
      [inc({ time: "23:30" }), inc({ time: "23:40" }), inc({ time: "02:10" })],
      [shift(), shift({ staff_id: "staff_n", start_time: "22:00", end_time: "06:00" })],
      NOW,
    );
    const f = view.findings.find((x) => x.key === "convergence");
    if (f) expect(JSON.stringify(f.readings)).toMatch(/cannot tell these apart/i);
  });
});

describe("an incident-free hour is not a safe hour", () => {
  it("never names a safest time", () => {
    const view = buildRoutineActivityView([inc(), inc(), inc()], [shift()], NOW);
    const blob = JSON.stringify(view).toLowerCase();
    for (const forbidden of ["safest", "safe time", "safe band", "lowest risk"]) {
      expect(blob).not.toContain(forbidden);
    }
  });

  it("says an empty window is not a safe window", () => {
    const view = buildRoutineActivityView([], [shift()], NOW);
    expect(view.visible).toBe(false);
    expect(view.summary).toMatch(/not the same as a safe/i);
    expect(view.concentrations).toEqual([]);
  });

  it("carries the caveat that a quiet hour may just be an empty building", () => {
    const view = buildRoutineActivityView([inc()], [shift()], NOW);
    expect(view.caveat).toBe(ROUTINE_ACTIVITY_CAVEAT);
    expect(view.caveat).toMatch(/quiet hour is not a safe hour/i);
    expect(view.caveat).toMatch(/times and places, never at people/i);
  });
});

describe("it never silently merges places", () => {
  it("counts two spellings separately and says they may be one place", () => {
    const view = buildRoutineActivityView(
      [inc({ location: "Alex's Room" }), inc({ location: "Alex's Bedroom" }), inc({ location: "Alex's Bedroom" })],
      [shift()],
      NOW,
    );
    const dup = view.possibleSamePlace[0];
    expect(dup.places.sort()).toEqual(["Alex's Bedroom", "Alex's Room"]);
    // The direction of the error is stated: split counts UNDER-report.
    expect(dup.why).toMatch(/stronger than it looks above, not weaker/i);
  });

  it("spots a shared distinctive word across different room words", () => {
    const view = buildRoutineActivityView(
      [inc({ location: "Communal Lounge" }), inc({ location: "Communal Area" })],
      [shift()],
      NOW,
    );
    expect(view.possibleSamePlace).toHaveLength(1);
  });

  it("does not pair genuinely different places", () => {
    const view = buildRoutineActivityView(
      [inc({ location: "Medication Room" }), inc({ location: "Upstairs Corridor" }), inc({ location: "Community" })],
      [shift()],
      NOW,
    );
    expect(view.possibleSamePlace).toEqual([]);
  });

  it("never merges — the concentration counts stay separate", () => {
    const view = buildRoutineActivityView(
      [inc({ location: "Alex's Room" }), inc({ location: "Alex's Bedroom" }), inc({ location: "Alex's Bedroom" })],
      [shift()],
      NOW,
    );
    // 2 + 1 stays 2 and 1 — never a merged 3 that nobody could check.
    expect(view.concentrations.every((c) => c.incidents < 3)).toBe(true);
  });
});

describe("supervision — the only leg Cara computes", () => {
  it("counts a wrapped waking-night shift into the morning it actually worked", () => {
    // 20:00 → 08:00 covers 06:00–08:00. A linear overlap test misses that tail
    // and under-counts supervision, which is the dangerous direction.
    const view = buildRoutineActivityView(
      [inc()],
      [shift({ staff_id: "staff_n", start_time: "20:00", end_time: "08:00" })],
      NOW,
    );
    const morning = view.supervision.find((s) => s.band === "morning")!;
    const night = view.supervision.find((s) => s.band === "night")!;
    expect(morning.typicalOnShift).toBe(1);
    expect(night.typicalOnShift).toBe(1);
  });

  it("does not count a day shift into the night", () => {
    const view = buildRoutineActivityView([inc()], [shift({ start_time: "08:00", end_time: "17:00" })], NOW);
    expect(view.supervision.find((s) => s.band === "night")!.typicalOnShift).toBeNull();
    expect(view.supervision.find((s) => s.band === "evening")!.typicalOnShift).toBeNull();
  });

  it("ignores cancelled and no-show shifts — they supervised nobody", () => {
    const view = buildRoutineActivityView(
      [inc()],
      [shift({ status: "cancelled" }), shift({ staff_id: "staff_b", status: "no_show" })],
      NOW,
    );
    expect(view.supervision.every((s) => s.typicalOnShift === null)).toBe(true);
  });

  it("returns an honest null where it cannot tell, never a zero", () => {
    const view = buildRoutineActivityView([inc()], [], NOW);
    expect(view.supervision.every((s) => s.typicalOnShift === null && s.daysSeen === 0)).toBe(true);
  });
});

describe("three is a pattern, two is a coincidence", () => {
  it("does not call two incidents a concentration", () => {
    const view = buildRoutineActivityView([inc(), inc()], [shift()], NOW);
    expect(view.concentrations).toEqual([]);
    expect(view.summary).toMatch(/none concentrating/i);
  });

  it("counts three in the same time and place", () => {
    const view = buildRoutineActivityView([inc(), inc(), inc()], [shift()], NOW);
    expect(view.concentrations[0].incidents).toBe(3);
  });

  it("ignores incidents outside the window", () => {
    const view = buildRoutineActivityView([inc({ date: day(200) }), inc(), inc()], [shift()], NOW, 90);
    expect(view.concentrations).toEqual([]);
  });
});

describe("it never lectures theory (1.13)", () => {
  it("says nothing about routine-activity theory at the reader", () => {
    const view = buildRoutineActivityView([inc(), inc(), inc()], [shift()], NOW);
    const blob = JSON.stringify(view).toLowerCase();
    for (const lecture of ["routine activity", "theory", "capable guardian", "motivated"]) {
      expect(blob).not.toContain(lecture);
    }
  });
});

describe("the shipped copy honours the language covenant", () => {
  it("carries no deficit, accusatory or blaming language", () => {
    const view = buildRoutineActivityView(
      [inc({ time: null }), inc({ location: "Alex's Room" }), inc(), inc(), inc()],
      [shift(), shift({ staff_id: "staff_n", start_time: "22:00", end_time: "06:00" })],
      NOW,
    );
    for (const f of view.findings) {
      expect(reviewTone(f.headline, "to_staff")).toEqual([]);
      expect(reviewTone(f.whyShown, "to_staff")).toEqual([]);
      expect(reviewTone(f.question, "to_staff")).toEqual([]);
      for (const r of f.readings) expect(reviewTone(r, "to_staff")).toEqual([]);
    }
    expect(reviewTone(view.summary, "to_staff")).toEqual([]);
    expect(reviewTone(view.caveat, "to_staff")).toEqual([]);
  });
});
