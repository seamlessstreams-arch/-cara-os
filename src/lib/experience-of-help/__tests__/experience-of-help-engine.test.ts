import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { reviewTone } from "@/lib/philosophy/covenant";
import {
  HELP_LENSES,
  HELP_CAVEAT,
  REFLECTION_PERIOD_DAYS,
  buildExperienceOfHelp,
  validateReflection,
  type HelpReflection,
  type SystemBarrier,
} from "../experience-of-help-engine";

const NOW = new Date("2026-07-17T09:00:00.000Z");
const day = (n: number) => new Date(NOW.getTime() - n * 86_400_000).toISOString().slice(0, 10);

const CHILD = [{ id: "yp_alex", name: "Alex" }];

const reflection = (over: Partial<HelpReflection> = {}): HelpReflection => ({
  id: "hr_1",
  home_id: "home_oak",
  child_id: "yp_alex",
  recorded_on: day(10),
  source: "child",
  lens: "door",
  their_words: "You actually got my brother's number for me. Nobody else did that.",
  system_barriers_named: [],
  one_change: "Ring the social worker on the day we say we will, not the week after.",
  safety_consideration: "Contact stays supervised; the change is about our timekeeping, not the plan.",
  recorded_by: "staff_edward",
  created_at: "2026-07-07T00:00:00.000Z",
  ...over,
});

const barrier = (over: Partial<SystemBarrier> = {}): SystemBarrier => ({
  id: "sb_1",
  childId: "yp_alex",
  origin: "voice",
  what: "Asked about seeing her brother, 12 days ago, no answer yet",
  since: day(12),
  ...over,
});

const build = (o: Partial<Parameters<typeof buildExperienceOfHelp>[0]> = {}) =>
  buildExperienceOfHelp({ children: CHILD, reflections: [], barriers: [], now: NOW, ...o });

const view = (v: ReturnType<typeof build>) => v.children[0];
const find = (v: ReturnType<typeof build>, k: string) => view(v).findings.find((f) => f.key === k);

describe("Cara never picks the lens", () => {
  it("has no function that could infer how a child experiences us", () => {
    const src = readFileSync(join(__dirname, "..", "experience-of-help-engine.ts"), "utf8");
    const code = src.slice(src.indexOf("export type HelpLens")); // skip header prose
    for (const banned of ["inferLens", "guessLens", "deriveLens", "predictLens", "classifyExperience", "scoreExperience"]) {
      expect(code).not.toContain(banned);
    }
  });

  it("says outright that Cara will never fill this in", () => {
    const v = build();
    expect(v.caveat).toBe(HELP_CAVEAT);
    expect(v.caveat).toMatch(/theirs to say, not ours to work out/i);
    expect(v.caveat).toMatch(/never fill this in/i);
  });

  it("asks when nobody has, rather than answering for them", () => {
    const v = build();
    const f = find(v, "never_asked")!;
    expect(f.headline).toMatch(/nobody has asked how this feels/i);
    expect(f.whyShown).toMatch(/engagement tells you whether they turn up/i);
    expect(view(v).latest).toBeNull();
  });

  it("offers all six of 1.6's lenses, not the four 2.2.5 abbreviates to", () => {
    // A child offered only four boxes gets the nearest wrong one.
    expect(HELP_LENSES.map((l) => l.lens).sort()).toEqual(
      ["door", "gate", "mirror", "revolving_door", "trap", "wall"],
    );
  });

  it("writes each lens from the child's side, not as a clinical gloss", () => {
    for (const l of HELP_LENSES) expect(l.fromTheirView).toMatch(/\b(I|me|my|you)\b/);
  });
});

describe("a team view is a hypothesis, never the answer", () => {
  it("labels a team_view as ours, out loud", () => {
    const v = build({ reflections: [reflection({ source: "team_view" })] });
    expect(view(v).isHypothesis).toBe(true);
    expect(view(v).hypothesisNote).toMatch(/team's hypothesis.*They have not been asked/i);
    const f = find(v, "only_team_view")!;
    expect(f.headline).toMatch(/our view of their experience, not theirs/i);
    expect(f.whyShown).toMatch(/adults deciding how a child feels about adults/i);
  });

  it("does not treat a child's own answer as a hypothesis", () => {
    const v = build({ reflections: [reflection({ source: "child" })] });
    expect(view(v).isHypothesis).toBe(false);
    expect(find(v, "only_team_view")).toBeUndefined();
  });

  it("never credits a team view as having asked", () => {
    const v = build({ reflections: [reflection({ source: "team_view" })] });
    expect(find(v, "asked_and_acted")).toBeUndefined();
  });

  it("requires the source before anything else — it matters most", () => {
    expect(validateReflection({ lens: "door", their_words: "x", one_change: "y", safety_consideration: "z" }))
      .toMatch(/whose view is this/i);
  });
});

describe("the barriers Cara can see are ours", () => {
  it("names a barrier our records prove that the conversation missed", () => {
    const v = build({
      reflections: [reflection({ system_barriers_named: [] })],
      barriers: [barrier(), barrier({ id: "sb_2", origin: "support", what: "DDP agreed in March, no sessions yet" })],
    });
    const f = find(v, "barriers_unnamed")!;
    expect(f.headline).toMatch(/2 things our own records show we did/i);
    expect(f.whyShown).toMatch(/these are ours, not theirs/i);
    expect(f.whyShown).toMatch(/quietly re-read as the child not engaging/i);
    expect(f.evidenceIds).toEqual(["sb_1", "sb_2"]);
  });

  it("stays quiet about a barrier the conversation already named", () => {
    const v = build({
      reflections: [reflection({ system_barriers_named: ["Asked about seeing her brother, 12 days ago, no answer yet"] })],
      barriers: [barrier()],
    });
    expect(find(v, "barriers_unnamed")).toBeUndefined();
  });

  it("matches a named barrier regardless of case and padding", () => {
    const v = build({
      reflections: [reflection({ system_barriers_named: ["  ASKED ABOUT SEEING HER BROTHER, 12 DAYS AGO, NO ANSWER YET  "] })],
      barriers: [barrier()],
    });
    expect(find(v, "barriers_unnamed")).toBeUndefined();
  });

  it("has no field for barriers on the child's side — those are named with them, not about them", () => {
    const src = readFileSync(join(__dirname, "..", "experience-of-help-engine.ts"), "utf8");
    const iface = src.slice(src.indexOf("export interface HelpReflection"), src.indexOf("export interface SystemBarrier"));
    for (const banned of ["their_barriers", "child_barriers", "family_barriers", "resistance", "non_engagement"]) {
      expect(iface).not.toContain(banned);
    }
  });
});

describe("it ends in one concrete change that keeps the child safe", () => {
  it("asks for one change, and says why one", () => {
    const err = validateReflection({ source: "child", lens: "wall", their_words: "x" })!;
    expect(err).toMatch(/one change/i);
    expect(err).toMatch(/a list is a plan nobody does/i);
  });

  it("will not accept a change without the safety clause", () => {
    const err = validateReflection({ source: "child", lens: "wall", their_words: "x", one_change: "y" })!;
    expect(err).toMatch(/how does that change keep the child safe/i);
    expect(err).toMatch(/makes us feel better and the child less safe/i);
  });

  it("accepts a complete reflection", () => {
    expect(
      validateReflection({
        source: "child",
        lens: "trap",
        their_words: "Every time I tell you something it ends up in a meeting.",
        one_change: "Tell her who will hear it before she says it, not after.",
        safety_consideration: "Safeguarding still gets passed on — she'll know that up front, which is the point.",
      }),
    ).toBeNull();
  });

  it("asks a team_view for its reasoning, in its own voice", () => {
    const err = validateReflection({ source: "team_view", lens: "wall" })!;
    expect(err).toMatch(/what made the team land on that/i);
    expect(err).toMatch(/this is the team's reasoning, and it should read like it/i);
  });
});

describe("periodic, with a visible period", () => {
  it("prompts once a reflection is past the period", () => {
    const v = build({ reflections: [reflection({ recorded_on: day(REFLECTION_PERIOD_DAYS + 5) })] });
    const f = find(v, "reflection_stale")!;
    expect(f.headline).toMatch(/last time anyone asked was 95 days ago/i);
    expect(f.whyShown).toMatch(/changes as the relationship changes/i);
  });

  it("does not nag a recent one", () => {
    const v = build({ reflections: [reflection({ recorded_on: day(10) })] });
    expect(find(v, "reflection_stale")).toBeUndefined();
  });

  it("uses the latest reflection when there are several", () => {
    const v = build({
      reflections: [
        reflection({ id: "old", recorded_on: day(200), lens: "wall" }),
        reflection({ id: "new", recorded_on: day(5), lens: "door" }),
      ],
    });
    expect(view(v).latest!.id).toBe("new");
    expect(find(v, "reflection_stale")).toBeUndefined();
  });
});

describe("it credits asking, and asking well", () => {
  it("credits a reflection in their own words that changed something", () => {
    const v = build({ reflections: [reflection()] });
    const f = find(v, "asked_and_acted")!;
    expect(f.tone).toBe("positive");
    expect(f.whyShown).toMatch(/they said it felt like a door/i);
    expect(f.question).toMatch(/that is what makes the next answer honest/i);
  });

  it("does not credit a stale one", () => {
    const v = build({ reflections: [reflection({ recorded_on: day(200) })] });
    expect(find(v, "asked_and_acted")).toBeUndefined();
  });
});

describe("the shipped copy honours the language covenant", () => {
  it("carries no deficit, accusatory or blaming language", () => {
    for (const v of [
      build(),
      build({ reflections: [reflection({ source: "team_view" })], barriers: [barrier()] }),
      build({ reflections: [reflection({ recorded_on: day(200) })] }),
      build({ reflections: [reflection()] }),
    ]) {
      for (const f of view(v).findings) {
        expect(reviewTone(f.headline, "to_staff")).toEqual([]);
        expect(reviewTone(f.whyShown, "to_staff")).toEqual([]);
        expect(reviewTone(f.question, "to_staff")).toEqual([]);
      }
      expect(reviewTone(v.summary, "to_staff")).toEqual([]);
    }
    expect(reviewTone(HELP_CAVEAT, "to_staff")).toEqual([]);
    for (const l of HELP_LENSES) expect(reviewTone(l.fromTheirView, "about_child")).toEqual([]);
  });

  it("keeps every write-law message an invitation, not a rejection", () => {
    for (const patch of [
      {},
      { source: "child" },
      { source: "child", lens: "wall" },
      { source: "child", lens: "wall", their_words: "x" },
      { source: "child", lens: "wall", their_words: "x", one_change: "y" },
    ]) {
      const err = validateReflection(patch)!;
      expect(err).toBeTruthy();
      expect(reviewTone(err, "to_staff")).toEqual([]);
      expect(err).not.toMatch(/invalid|required field|error|failed/i);
    }
  });
});
