// ══════════════════════════════════════════════════════════════════════════════
// CARA — UNIFIED NEURODIVERSITY PROFILE TESTS
//
// Pins: the profile merges the four silos (de-duped, latest plan wins), states
// "no profile" honestly, flags review gaps; and the point-of-work prompts are
// ordered for the context — a RESTRAINT leads with "what makes it worse" and the
// signs of shutdown, empty lists are dropped, and no profile means no prompts.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { unifyNeuroProfile, deriveRecordingPrompts } from "../unification-engine";
import type { UnifyNeuroInput } from "../types";

const ASOF = "2026-07-05";

const base = (o: Partial<UnifyNeuroInput> = {}): UnifyNeuroInput => ({
  childId: "yp_alex",
  childName: "Alex",
  asOf: ASOF,
  autismPlans: [],
  adhdPlans: [],
  sensoryProfiles: [],
  ehcps: [],
  ...o,
});

const autismPlan = (o: Partial<UnifyNeuroInput["autismPlans"][number]> = {}): UnifyNeuroInput["autismPlans"][number] => ({
  id: "aut_1",
  child_id: "yp_alex",
  plan_date: "2026-05-01",
  diagnosis_status: "diagnosed",
  diagnosis_date: "2024-03-01",
  diagnosing_clinician: "Dr Lee",
  special_interests: ["trains", "cooking"],
  communication_preferences: ["short sentences", "processing time"],
  sensory_profile: [{ sense: "auditory", seeking_or_avoiding: "avoiding", specific_notes: "busy noisy rooms overwhelm him" }],
  predictability_needs: ["a visual timetable"],
  meltdown_triggers: ["unexpected news about court", "raised voices"],
  meltdown_support: ["the quiet lounge", "no demands until calm"],
  shutdown_indicators: ["goes silent and still", "covers his ears"],
  shutdown_support: ["give space"],
  transition_support: ["five-minute warnings"],
  staff_do_strategies: ["warn him before court topics", "give processing time"],
  staff_do_not_strategies: ["spring information on him", "raise court topics after 7pm in the lounge"],
  child_voice: "I need to know what's happening before it happens.",
  review_date: "2026-11-01",
  key_worker: "Edward",
  ...o,
});

describe("unifyNeuroProfile — merges the silos honestly", () => {
  it("returns hasProfile=false and a pointer-to-gap disclaimer when nothing is on file", () => {
    const p = unifyNeuroProfile(base());
    expect(p.hasProfile).toBe(false);
    expect(p.conditions).toEqual([]);
    expect(p.disclaimer).toMatch(/no neurodiversity record/i);
  });

  it("brings the Autism plan into a unified profile with conditions, triggers and staff do/do-not", () => {
    const p = unifyNeuroProfile(base({ autismPlans: [autismPlan()] }));
    expect(p.hasProfile).toBe(true);
    expect(p.conditions[0]).toMatchObject({ kind: "autism", status: "diagnosed" });
    expect(p.behaviour.staffDoNot).toContain("spring information on him");
    expect(p.behaviour.shutdownIndicators).toContain("goes silent and still");
    expect(p.sources).toContain("autism_plan");
  });

  it("merges an ADHD plan alongside autism and de-duplicates staff strategies", () => {
    const p = unifyNeuroProfile(
      base({
        autismPlans: [autismPlan({ staff_do_strategies: ["give processing time"] })],
        adhdPlans: [
          {
            id: "adhd_1", child_id: "yp_alex", plan_date: "2026-05-02", diagnosis_status: "diagnosed",
            strengths: ["creative"], challenges: ["time blindness"], executive_function_support: ["checklists"],
            time_blindness_strategies: ["timers"], school_adjustments: [], home_adjustments: [],
            staff_do_strategies: ["give processing time", "use timers"], staff_do_not_strategies: ["rush him"],
            child_voice: "", review_date: "2026-12-01", key_worker: "Edward",
          },
        ],
      }),
    );
    expect(p.conditions.map((c) => c.kind).sort()).toEqual(["adhd", "autism"]);
    // "give processing time" appears in both plans but only once in the merge
    expect(p.behaviour.staffDo.filter((s) => s === "give processing time")).toHaveLength(1);
    expect(p.behaviour.staffDoNot).toContain("rush him");
  });

  it("takes the LATEST autism plan by plan_date", () => {
    const p = unifyNeuroProfile(
      base({
        autismPlans: [
          autismPlan({ id: "old", plan_date: "2025-01-01", diagnosis_status: "awaiting_assessment" }),
          autismPlan({ id: "new", plan_date: "2026-05-01", diagnosis_status: "diagnosed" }),
        ],
      }),
    );
    expect(p.conditions[0].status).toBe("diagnosed");
  });

  it("carries the EHCP and its outstanding actions", () => {
    const p = unifyNeuroProfile(
      base({
        ehcps: [
          { id: "ehcp_1", child_id: "yp_alex", plan_status: "final_plan_in_place", primary_need: "SEMH", secondary_needs: ["communication"], outstanding_actions: ["SALT referral"], next_annual_review_due: "2026-09-01" },
        ],
      }),
    );
    expect(p.ehcp?.primaryNeed).toBe("SEMH");
    expect(p.ehcp?.outstandingActions).toContain("SALT referral");
  });
});

describe("review gaps", () => {
  it("flags an overdue autism-plan review", () => {
    const p = unifyNeuroProfile(base({ autismPlans: [autismPlan({ review_date: "2026-06-01" })] }));
    expect(p.reviewGaps.some((g) => g.id === "autism_review" && g.severity === "overdue")).toBe(true);
  });

  it("flags a missing sensory profile when autism is recorded", () => {
    const p = unifyNeuroProfile(base({ autismPlans: [autismPlan()] }));
    expect(p.reviewGaps.some((g) => g.id === "sensory_missing" && g.severity === "missing")).toBe(true);
  });
});

describe("deriveRecordingPrompts — ordered for the context", () => {
  const profile = unifyNeuroProfile(base({ autismPlans: [autismPlan()] }));

  it("returns nothing when there is no profile", () => {
    const none = unifyNeuroProfile(base());
    expect(deriveRecordingPrompts(none, "restraint")).toEqual([]);
  });

  it("for a RESTRAINT leads with 'what makes it worse' and shutdown signs, both critical", () => {
    const prompts = deriveRecordingPrompts(profile, "restraint");
    expect(prompts[0].id).toBe("avoid");
    expect(prompts[0].priority).toBe("critical");
    expect(prompts[0].items).toContain("spring information on him");
    expect(prompts.some((p) => p.id === "shutdown" && p.priority === "critical")).toBe(true);
  });

  it("for an INCIDENT leads with triggers then staff DO", () => {
    const prompts = deriveRecordingPrompts(profile, "incident");
    expect(prompts[0].id).toBe("triggers");
    expect(prompts.find((p) => p.id === "do")?.items).toContain("warn him before court topics");
  });

  it("for KEY WORK surfaces special interests as a way in", () => {
    const prompts = deriveRecordingPrompts(profile, "key_work");
    expect(prompts.some((p) => p.id === "interests" && p.items.includes("trains"))).toBe(true);
  });

  it("drops prompts whose list is empty", () => {
    const sparse = unifyNeuroProfile(
      base({ autismPlans: [autismPlan({ shutdown_indicators: [], staff_do_not_strategies: [], meltdown_support: [], communication_preferences: [] })] }),
    );
    const prompts = deriveRecordingPrompts(sparse, "restraint");
    expect(prompts.every((p) => p.items.length > 0)).toBe(true);
    expect(prompts.some((p) => p.id === "shutdown")).toBe(false);
  });
});

describe("scoping", () => {
  it("only reads records for the requested child", () => {
    const p = unifyNeuroProfile(base({ autismPlans: [autismPlan({ child_id: "yp_casey" })] }));
    expect(p.hasProfile).toBe(false);
  });
});
