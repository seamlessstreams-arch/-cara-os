import { describe, it, expect } from "vitest";
import { learnFromEvents } from "../learning-engine";
import { buildLearningInput } from "../hydrate";
import type { LearningEvent, LearningInput } from "../types";

function ev(over: Partial<LearningEvent> = {}): LearningEvent {
  return {
    type: "incident",
    date: "2026-06-01",
    text: "",
    outcome: undefined,
    lessonsLearned: [],
    whatWorked: [],
    whatDidntWork: [],
    changesNeeded: [],
    reviewed: true,
    ...over,
  };
}
function inp(events: LearningEvent[], over: Partial<LearningInput> = {}): LearningInput {
  return { scope: "child", childName: "Alex", events, windowDays: 180, today: "2026-06-15", ...over };
}

describe("learnFromEvents", () => {
  it("aggregates and dedupes recorded learning", () => {
    const r = learnFromEvents(
      inp([
        ev({ whatWorked: ["Calm approach helped"], whatDidntWork: ["Too slow to respond"], lessonsLearned: ["Prepare earlier"] }),
        ev({ whatWorked: ["Calm approach helped"], changesNeeded: ["Add to plan"] }),
      ]),
    );
    expect(r.whatWorked).toEqual(["Calm approach helped"]); // deduped
    expect(r.whatDidntWork).toContain("Too slow to respond");
    expect(r.doDifferently).toEqual(expect.arrayContaining(["Prepare earlier", "Add to plan"]));
  });

  it("detects a recurring family-contact theme and emits a watch-point", () => {
    const r = learnFromEvents(
      inp([
        ev({ text: "Agitated following a phone call with a family member." }),
        ev({ text: "Distressed before a family contact visit." }),
      ]),
    );
    const fc = r.learningThemes.find((t) => t.key === "family_contact");
    expect(fc?.frequency).toBe(2);
    expect(r.whatCaraShouldLearn.some((w) => /family contact/i.test(w.trigger))).toBe(true);
  });

  it("treats a repeated event type as a theme", () => {
    const r = learnFromEvents(
      inp([
        ev({ type: "physical_intervention", text: "a" }),
        ev({ type: "physical_intervention", text: "b" }),
        ev({ type: "physical_intervention", text: "c" }),
      ]),
    );
    const t = r.learningThemes.find((x) => x.key === "type:physical_intervention");
    expect(t?.frequency).toBe(3);
    expect(t?.theme).toMatch(/Repeated physical intervention/i);
  });

  it("notes unreviewed events in organisational memory", () => {
    const r = learnFromEvents(inp([ev({ reviewed: false }), ev({ reviewed: true })]));
    expect(r.organisationalMemory.some((m) => /no recorded management oversight/i.test(m))).toBe(true);
  });

  it("scales confidence with data volume", () => {
    expect(learnFromEvents(inp([])).confidence).toBe("low");
    const rich = learnFromEvents(
      inp([
        ev({ whatWorked: ["x"], text: "family contact" }),
        ev({ whatDidntWork: ["y"], text: "family contact" }),
        ev({ lessonsLearned: ["z"], text: "community time" }),
      ]),
    );
    expect(rich.confidence).toBe("high");
  });

  it("is deterministic", () => {
    const i = inp([ev({ type: "physical_intervention", text: "family phone call" }), ev({ type: "physical_intervention", text: "family visit" })]);
    expect(learnFromEvents(i)).toEqual(learnFromEvents(i));
  });
});

describe("buildLearningInput", () => {
  it("hydrates events from incidents + linked debriefs, within the window", () => {
    const input = buildLearningInput({
      scope: "child",
      childName: "Alex",
      incidents: [
        {
          id: "inc_005",
          type: "physical_intervention",
          date: "2026-06-01",
          description: "Agitated following a phone call with a family member.",
          outcome: "No injuries sustained. Alex settled.",
          lessons_learned: "Pre-call preparation may reduce escalation risk. Consider keyworker present during contact calls.",
          oversight_by: "staff_darren",
        },
        { id: "inc_old", type: "incident", date: "2020-01-01", description: "old", oversight_by: null },
      ],
      debriefs: [
        {
          linked_incident_id: "inc_005",
          what_worked_well: "Calm approach helped",
          what_could_improve: "Earlier preparation",
          lessons_learned: ["Plan contact calls"],
          changes_needed: ["Add to behaviour support plan"],
        },
      ],
      today: "2026-06-15",
    });
    expect(input.events.length).toBe(1); // 2020 entry outside the 180-day window
    const e = input.events[0];
    expect(e.lessonsLearned).toContain("Pre-call preparation may reduce escalation risk");
    expect(e.lessonsLearned).toContain("Plan contact calls");
    expect(e.whatWorked).toContain("Calm approach helped");
    expect(e.whatWorked.some((w) => /safe resolution/i.test(w))).toBe(true); // positive outcome
    expect(e.whatDidntWork).toContain("Earlier preparation");
    expect(e.changesNeeded).toContain("Add to behaviour support plan");
    expect(e.reviewed).toBe(true);
  });
});
