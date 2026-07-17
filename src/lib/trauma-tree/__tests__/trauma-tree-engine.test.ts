import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { reviewTone } from "@/lib/philosophy/covenant";
import {
  buildTraumaTree,
  TRAUMA_TREE_CAVEAT,
  type Leaf,
  type RootsRecord,
  type SupportSession,
} from "../trauma-tree-engine";

const NOW = new Date("2026-07-17T09:00:00.000Z");
const day = (n: number) => new Date(NOW.getTime() - n * 86_400_000).toISOString().slice(0, 10);

const CHILD = [{ id: "yp_alex", name: "Alex" }];

let seq = 0;
const leaf = (over: Partial<Leaf> = {}): Leaf => ({
  id: `leaf_${++seq}`,
  child_id: "yp_alex",
  date: day(5),
  kind: "behaviour",
  ...over,
});

const roots = (over: Partial<RootsRecord> = {}): RootsRecord => ({
  id: "mdf_1",
  child_id: "yp_alex",
  version: 1,
  formulation_date: day(20),
  next_review_date: day(-20), // 20 days in the future
  key_hypotheses: ["Absences follow contact with an older peer; belonging is the pull."],
  presenting_difficulties: ["Unauthorised absences"],
  agreed_interventions: ["Weekly DDP sessions"],
  participants_attended: ["Key worker", "CAMHS psychologist"],
  ...over,
});

const session = (over: Partial<SupportSession> = {}): SupportSession => ({
  id: `ses_${++seq}`,
  child_id: "yp_alex",
  date: day(10),
  attended: true,
  modality: "ddp",
  ...over,
});

const build = (o: Partial<Parameters<typeof buildTraumaTree>[0]> = {}) =>
  buildTraumaTree({
    children: CHILD,
    leaves: [],
    roots: [],
    support: [],
    labelling: [],
    now: NOW,
    ...o,
  });

const tree = (v: ReturnType<typeof build>) => v.children[0];
const find = (v: ReturnType<typeof build>, k: string) => tree(v).findings.find((f) => f.key === k);

describe("Cara never authors a root", () => {
  it("has no function or field that could produce a hypothesis", () => {
    const src = readFileSync(join(__dirname, "..", "trauma-tree-engine.ts"), "utf8");
    const code = src.slice(src.indexOf("export type TreeFindingKey")); // skip header prose
    for (const banned of [
      "inferRoot", "suggestHypothesis", "generateFormulation", "deriveRoot",
      "likelyCause", "probableCause", "diagnosis", "predictedRoot",
    ]) {
      expect(code).not.toContain(banned);
    }
  });

  it("only ever quotes hypotheses back from the record it read", () => {
    const written = ["Absences follow contact with an older peer; belonging is the pull."];
    const v = build({ roots: [roots({ key_hypotheses: written })], leaves: [leaf(), leaf(), leaf()] });
    expect(tree(v).roots!.hypotheses).toEqual(written); // verbatim, nothing added
  });

  it("says outright that it does not work out why a child does what they do", () => {
    const v = build({ leaves: [leaf(), leaf(), leaf()] });
    expect(v.caveat).toBe(TRAUMA_TREE_CAVEAT);
    expect(v.caveat).toMatch(/does not work out why a child does what they do/i);
    expect(v.caveat).toMatch(/never a substitute for it/i);
  });

  it("does not guess whether the formulation covers today's behaviour — it counts and asks", () => {
    // Word-overlap on clinical free text would be confidently wrong about the
    // most sensitive document in the file. So: no matching, only counting.
    const v = build({
      roots: [roots({ presenting_difficulties: ["Unauthorised absences"] })],
      leaves: [leaf(), leaf(), leaf(), leaf()],
    });
    const f = find(v, "leaves_since_roots")!;
    expect(f.whyShown).toMatch(/has not read them against the formulation/i);
    expect(f.whyShown).toMatch(/would be guessing if it tried/i);
    expect(f.question).toMatch(/does it still describe this child/i);
    // It must NOT claim the formulation is out of date.
    expect(f.headline).not.toMatch(/out of date|no longer|doesn't mention|missing from/i);
  });
});

describe("leaf-only — the doctrine's named case", () => {
  it("fires when the home keeps responding and no formulation exists", () => {
    const v = build({ leaves: [leaf(), leaf(), leaf(), leaf()] });
    const f = find(v, "leaf_only")!;
    expect(f.headline).toMatch(/4 recorded responses.*no formulation on record/i);
    expect(f.needsClinicalSupport).toBe(true); // the doctrine asks for clinical support
    expect(f.question).toMatch(/clinical colleagues/i);
  });

  it("allows that the thinking may exist off-record, and says why that still matters", () => {
    const v = build({ leaves: [leaf(), leaf(), leaf()] });
    const f = find(v, "leaf_only")!;
    expect(f.readings[0]).toMatch(/absence from the record, not from the team/i);
    expect(f.readings[1]).toMatch(/leaves with the people who hold it/i);
  });

  it("does not fire when roots are on record", () => {
    const v = build({ leaves: [leaf(), leaf(), leaf()], roots: [roots()] });
    expect(find(v, "leaf_only")).toBeUndefined();
  });

  it("says nothing at all about a child with too little on record", () => {
    const v = build({ leaves: [leaf()] });
    expect(v.children).toEqual([]);
    expect(v.tooLittleToSay).toEqual(["Alex"]);
  });
});

describe("the roots on record", () => {
  it("takes the latest version — a formulation is a living document, not a log", () => {
    const v = build({
      leaves: [leaf(), leaf(), leaf()],
      roots: [
        roots({ id: "mdf_old", version: 1, key_hypotheses: ["old thinking"] }),
        roots({ id: "mdf_new", version: 2, key_hypotheses: ["current thinking"] }),
      ],
    });
    expect(tree(v).roots!.id).toBe("mdf_new");
    expect(tree(v).roots!.hypotheses).toEqual(["current thinking"]);
  });

  it("notices a formulation whose hypotheses are empty", () => {
    const v = build({ leaves: [leaf(), leaf(), leaf()], roots: [roots({ key_hypotheses: [] })] });
    const f = find(v, "roots_without_hypothesis")!;
    expect(f.needsClinicalSupport).toBe(true);
    expect(f.whyShown).toMatch(/the part that says what the team thinks is underneath it is empty/i);
  });

  it("notices an overdue review", () => {
    const v = build({ leaves: [leaf(), leaf(), leaf()], roots: [roots({ next_review_date: day(9) })] });
    expect(find(v, "roots_unreviewed")!.headline).toMatch(/review was due 9 days ago/i);
  });

  it("notices a formulation with no review date at all", () => {
    const v = build({ leaves: [leaf(), leaf(), leaf()], roots: [roots({ next_review_date: null })] });
    const f = find(v, "roots_unreviewed")!;
    expect(f.headline).toMatch(/no review date/i);
    expect(f.whyShown).toMatch(/hypotheses go out of date/i);
  });

  it("allows that a review may have happened without the record catching up", () => {
    const v = build({ leaves: [leaf(), leaf(), leaf()], roots: [roots({ next_review_date: day(9) })] });
    expect(find(v, "roots_unreviewed")!.readings[0]).toMatch(/without the record being updated/i);
  });
});

describe("what feeds the tree — support", () => {
  it("measures lapse against the CHILD'S OWN rhythm, not a weekly assumption", () => {
    // Fortnightly therapy is not "overdue" because a rule said weekly.
    const v = build({
      leaves: [leaf(), leaf(), leaf()],
      roots: [roots()],
      support: [session({ date: day(45) }), session({ date: day(31) })],
    });
    const f = find(v, "support_lapsed")!;
    expect(f.headline).toMatch(/31 days since the last ddp session/i);
    expect(f.whyShown).toMatch(/roughly every 14 days/i);
  });

  it("does not call a within-rhythm gap a lapse", () => {
    const v = build({
      leaves: [leaf(), leaf(), leaf()],
      roots: [roots()],
      support: [session({ date: day(28) }), session({ date: day(14) }), session({ date: day(4) })],
    });
    expect(find(v, "support_lapsed")).toBeUndefined();
  });

  it("allows that the work may simply have finished", () => {
    const v = build({
      leaves: [leaf(), leaf(), leaf()],
      roots: [roots()],
      support: [session({ date: day(45) }), session({ date: day(31) })],
    });
    expect(find(v, "support_lapsed")!.readings[0]).toMatch(/ended by agreement, or the work may be complete/i);
  });

  it("ignores missed sessions when working out the rhythm", () => {
    const v = build({
      leaves: [leaf(), leaf(), leaf()],
      roots: [roots()],
      support: [session({ date: day(45) }), session({ date: day(38), attended: false }), session({ date: day(31) })],
    });
    expect(find(v, "support_lapsed")!.whyShown).toMatch(/roughly every 14 days/i);
  });

  it("notices support that was agreed and never arrived", () => {
    const v = build({
      leaves: [leaf(), leaf(), leaf()],
      roots: [roots({ agreed_interventions: ["Weekly DDP", "Art therapy"] })],
      support: [],
    });
    const f = find(v, "support_never_arrived")!;
    expect(f.headline).toMatch(/2 interventions agreed, and no sessions on record/i);
    expect(f.readings[0]).toMatch(/waiting list|referral/i);
    expect(f.question).toMatch(/where is this stuck/i);
  });
});

describe("what feeds the tree — labelling", () => {
  it("reuses the care-language audit's count rather than a second vocabulary", () => {
    const v = build({
      leaves: [leaf(), leaf(), leaf()],
      roots: [roots()],
      labelling: [{ childId: "yp_alex", totalHits: 4, mostAffectedCategory: "criminalising" }],
    });
    const f = find(v, "labelling_feeding_the_tree")!;
    expect(f.headline).toMatch(/4 pieces of labelling language/i);
    expect(f.whyShown).toMatch(/becomes how they are seen, and then how they are treated/i);
    expect(f.question).toMatch(/would this child recognise themselves in their own file/i);
  });

  it("stays quiet when there is none", () => {
    const v = build({
      leaves: [leaf(), leaf(), leaf()],
      roots: [roots()],
      labelling: [{ childId: "yp_alex", totalHits: 0, mostAffectedCategory: null }],
    });
    expect(find(v, "labelling_feeding_the_tree")).toBeUndefined();
  });
});

describe("it catches people doing it right (2.2.6)", () => {
  it("credits a formulation that is written, hypothesised and dated", () => {
    // The agreed intervention needs sessions on record, or support_never_arrived
    // rightly fires and the credit is withheld.
    const v = build({
      leaves: [leaf(), leaf()],
      roots: [roots()],
      support: [session({ date: day(18) }), session({ date: day(4) })],
    });
    const f = find(v, "roots_tended")!;
    expect(f.tone).toBe("positive");
    expect(f.question).toMatch(/hard part of the work, and it is being done/i);
  });

  it("does not credit while the review is overdue", () => {
    const v = build({
      leaves: [leaf(), leaf(), leaf()],
      roots: [roots({ next_review_date: day(9) })],
      support: [session({ date: day(18) }), session({ date: day(4) })],
    });
    expect(find(v, "roots_tended")).toBeUndefined();
  });

  it("does not credit while agreed support has never arrived", () => {
    const v = build({ leaves: [leaf(), leaf()], roots: [roots()], support: [] });
    expect(find(v, "support_never_arrived")).toBeDefined();
    expect(find(v, "roots_tended")).toBeUndefined();
  });
});

describe("the shipped copy honours the language covenant", () => {
  it("carries no deficit, accusatory or blaming language", () => {
    const v = build({
      leaves: [leaf(), leaf(), leaf(), leaf()],
      roots: [roots({ next_review_date: null, key_hypotheses: [] })],
      support: [session({ date: day(45) }), session({ date: day(31) })],
      labelling: [{ childId: "yp_alex", totalHits: 3, mostAffectedCategory: "criminalising" }],
    });
    for (const f of tree(v).findings) {
      expect(reviewTone(f.headline, "to_staff")).toEqual([]);
      expect(reviewTone(f.whyShown, "to_staff")).toEqual([]);
      expect(reviewTone(f.question, "to_staff")).toEqual([]);
      for (const r of f.readings) expect(reviewTone(r, "to_staff")).toEqual([]);
    }
    expect(reviewTone(v.summary, "to_staff")).toEqual([]);
    expect(reviewTone(v.caveat, "to_staff")).toEqual([]);
  });

  it("summarises without grading anyone", () => {
    const v = build({ leaves: [leaf(), leaf(), leaf()], roots: [roots()] });
    const blob = JSON.stringify(v).toLowerCase();
    for (const forbidden of ['"score"', '"grade"', '"rating"', "inadequate", "outstanding"]) {
      expect(blob).not.toContain(forbidden);
    }
  });
});
