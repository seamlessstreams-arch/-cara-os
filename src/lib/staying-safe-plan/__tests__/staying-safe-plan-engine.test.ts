import { describe, it, expect } from "vitest";
import {
  analyseStayingSafePlan,
  buildStayingSafePlanOverview,
} from "../staying-safe-plan-engine";
import type { StayingSafePlan } from "../types";

const NOW = "2026-06-23T12:00:00.000Z";

function plan(over: Partial<StayingSafePlan> = {}): StayingSafePlan {
  return {
    id: "ssp_1", child_id: "yp_alex", home_id: "home_oak",
    preferred_name: "Alex", communication_style: "Short sentences, give time", theme: "blue",
    when_to_use: "Use this when you can see I'm starting to struggle",
    early_warning_signs: "I go quiet, stop eating, pace around",
    green: { signs: "Chatty, joining in", staff_do: "Keep things normal, notice the good", staff_dont: "Don't make a big deal" },
    amber: { signs: "Snappy, restless", staff_do: "Offer a walk or my music", staff_dont: "Don't crowd me or raise your voice" },
    red: { signs: "Shouting, throwing things", staff_do: "Give me space, stay calm, one familiar adult speaks", staff_dont: "Don't grab me or bring lots of people" },
    helpful_words: "“Take your time”, “I'm here”", unhelpful_words: "“Calm down”, “You're being silly”",
    calming_tools: "Music, a walk, cold water, my weighted blanket",
    trusted_people: "Mirela, my key worker; my nan on the phone",
    safe_spaces: "My room, the garden", sensory_needs: "Hates bright lights and loud TV",
    contact_preferences: "Likes to call nan when upset",
    repair_recovery: "A quiet chat the next day, not straight after",
    what_helps_feel_safe_again: "Knowing I'm not in trouble for being upset", my_choices: "I choose who talks to me first",
    child_contribution: "Alex helped write this in key work", staff_contribution: "Reviewed with the team",
    manager_approved: true, manager_id: "staff_dl", approved_at: "2026-06-01",
    review_date: "2026-12-01", status: "active",
    created_at: NOW, updated_at: NOW, created_by: "staff_mirela", updated_by: "staff_mirela",
    ...over,
  };
}

describe("analyseStayingSafePlan", () => {
  it("rates a complete, co-produced plan highly with no high flags", () => {
    const a = analyseStayingSafePlan(plan(), NOW);
    expect(a.completenessPct).toBe(100);
    expect(a.flags.some((f) => f.severity === "high")).toBe(false);
    expect(a.needsAttention).toBe(false);
  });

  it("flags an empty red-zone response as high", () => {
    const a = analyseStayingSafePlan(plan({ red: { signs: "Shouting", staff_do: "", staff_dont: "Don't grab" } }), NOW);
    expect(a.flags.find((f) => f.key === "red-zone-incomplete")?.severity).toBe("high");
    expect(a.needsAttention).toBe(true);
  });

  it("flags no trusted people and no child contribution as high", () => {
    const a = analyseStayingSafePlan(plan({ trusted_people: "", child_contribution: "" }), NOW);
    expect(a.flags.map((f) => f.key)).toEqual(expect.arrayContaining(["no-trusted-people", "no-child-voice"]));
  });

  it("flags an overdue review", () => {
    const a = analyseStayingSafePlan(plan({ review_date: "2026-05-01" }), NOW);
    expect(a.flags.some((f) => f.key === "review-overdue")).toBe(true);
  });

  it("flags a plan not approved by a manager", () => {
    const a = analyseStayingSafePlan(plan({ manager_approved: false }), NOW);
    expect(a.flags.some((f) => f.key === "not-approved")).toBe(true);
  });
});

describe("buildStayingSafePlanOverview", () => {
  const children = [{ id: "yp_alex", name: "Alex" }, { id: "yp_jordan", name: "Jordan" }];

  it("reports settled when every child has a complete plan", () => {
    const o = buildStayingSafePlanOverview({
      now: NOW,
      plans: [plan(), plan({ id: "ssp_2", child_id: "yp_jordan" })],
      children,
      reflections: [],
      incidents: [],
    });
    expect(o.childrenWithoutPlan).toHaveLength(0);
    expect(o.homeStatus).toBe("settled");
  });

  it("surfaces a child with no plan", () => {
    const o = buildStayingSafePlanOverview({ now: NOW, plans: [plan()], children, reflections: [], incidents: [] });
    expect(o.childrenWithoutPlan.map((c) => c.name)).toEqual(["Jordan"]);
    expect(o.alerts.some((a) => a.key === "no_plan")).toBe(true);
    expect(o.homeStatus).toBe("action_needed");
  });

  it("flags a plan a reflection asked to review", () => {
    const reflections = [{ child_id: "yp_alex", staying_safe_plan_review: true, incident_date: "2026-06-20" }] as never[];
    const o = buildStayingSafePlanOverview({ now: NOW, plans: [plan(), plan({ id: "ssp_2", child_id: "yp_jordan" })], children, reflections, incidents: [] });
    expect(o.alerts.some((a) => a.key === "review_flagged")).toBe(true);
  });

  it("is deterministic", () => {
    const args = { now: NOW, plans: [plan()], children, reflections: [], incidents: [] };
    expect(buildStayingSafePlanOverview(args)).toEqual(buildStayingSafePlanOverview(args));
  });
});
