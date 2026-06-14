import { describe, it, expect } from "vitest";
import {
  RESTORATIVE_QUESTIONS, RESTORATIVE_READINESS_CHECKS, REFLECTION_QUESTIONS,
  REFLECTION_FACTORS, REFLECTION_OUTCOMES,
  buildRestorativeSummary, restorativeManagerReview,
  deriveFollowUpActions, reflectionManagerReview, buildReflectionSummary,
  POST_INCIDENT_AI_SYSTEM_PROMPT, RESTORATIVE_DISCLAIMER, REFLECTION_DISCLAIMER,
} from "../post-incident-engine";

const REST = {
  child_ready_to_engage: true,
  what_happened: "Disagreement over the games console.",
  who_was_affected: "Jordan and Casey.",
  child_voice: "Jordan said it felt unfair.",
  what_helped: "Space and a calm chat.",
  what_made_it_worse: "",
  repair_actions: "Jordan will apologise; shared rota for the console.",
  follow_up_required: false,
};

describe("restorative conversation", () => {
  it("templates cover the spec questions and readiness checks", () => {
    const labels = RESTORATIVE_QUESTIONS.map((q) => q.label.toLowerCase()).join(" | ");
    expect(labels).toMatch(/what happened/);
    expect(labels).toMatch(/who was affected/);
    expect(labels).toMatch(/feeling and needing/);
    expect(labels).toMatch(/what helped/);
    expect(labels).toMatch(/repair/);
    expect(RESTORATIVE_READINESS_CHECKS.join(" ")).toMatch(/enough time to regulate/);
  });

  it("summary re-presents only what staff recorded", () => {
    const s = buildRestorativeSummary(REST, "Jordan");
    expect(s).toContain(REST.what_happened);
    expect(s).toContain(REST.child_voice);
    expect(s).toContain(REST.repair_actions);
    expect(s).not.toMatch(/follow-up is planned/i); // follow_up_required false
  });

  it("respects a child who is not ready — records decline, never pressure", () => {
    const s = buildRestorativeSummary({ ...REST, child_ready_to_engage: false }, "Jordan");
    expect(s).toMatch(/not ready to engage/);
    expect(s).toMatch(/respected/);
    expect(s).not.toContain(REST.what_happened); // no fabricated conversation content
  });

  it("manager review when not ready, follow-up needed, or adult actions made it worse", () => {
    expect(restorativeManagerReview(REST)).toBe(false);
    expect(restorativeManagerReview({ ...REST, child_ready_to_engage: false })).toBe(true);
    expect(restorativeManagerReview({ ...REST, follow_up_required: true })).toBe(true);
    expect(restorativeManagerReview({ ...REST, what_made_it_worse: "Being told to calm down." })).toBe(true);
  });
});

describe("post-incident reflection", () => {
  it("question set covers the spec's reflective areas", () => {
    const labels = REFLECTION_QUESTIONS.map((q) => q.label.toLowerCase()).join(" | ");
    expect(labels).toMatch(/before the incident/);
    expect(labels).toMatch(/early signs/);
    expect(labels).toMatch(/regulate/);
    expect(labels).toMatch(/communicating or needing/);
    expect(labels).toMatch(/environmental/);
    const factorLabels = REFLECTION_FACTORS.map((f) => f.label.toLowerCase()).join(" | ");
    expect(factorLabels).toMatch(/family contact/);
    expect(factorLabels).toMatch(/staffing/);
    expect(factorLabels).toMatch(/shame, grief, trauma/);
  });

  it("derives deterministic, explainable follow-up suggestions from flags", () => {
    const actions = deriveFollowUpActions(["family_contact"], ["risk_assessment_update", "keywork_session"]);
    expect(actions.join(" | ")).toMatch(/family contact/i);
    expect(actions.join(" | ")).toMatch(/risk assessment/i);
    expect(actions.join(" | ")).toMatch(/key-work session/i);
    expect(deriveFollowUpActions([], [])).toEqual([]);
  });

  it("requires manager review for statutory-plan or supervision outcomes only", () => {
    expect(reflectionManagerReview(["team_learning"])).toBe(false);
    expect(reflectionManagerReview(["risk_assessment_update"])).toBe(true);
    expect(reflectionManagerReview(["placement_plan_update"])).toBe(true);
    expect(reflectionManagerReview(["staff_supervision"])).toBe(true);
  });

  it("summary is factual, includes chosen factor/outcome labels, and is deterministic", () => {
    const r = {
      antecedents: "Restless after school.",
      early_warning_signs: "Pacing and short answers.",
      staff_response: "Reduced demands, offered snack.",
      what_worked: "Quiet space.",
      what_did_not_work: "Direct questions.",
      child_needs_identified: "Decompression time after school.",
      environmental_factors: "Busy communal area.",
      factors: ["school_stress"],
      outcomes: ["team_learning"],
    };
    const a = buildReflectionSummary(r);
    expect(a).toContain("Restless after school.");
    expect(a).toMatch(/School stress was a factor/);
    expect(a).toMatch(/Team learning required/);
    expect(buildReflectionSummary(r)).toBe(a);
  });
});

describe("safety wording", () => {
  it("AI prompt is draft-only, no invention, behaviour-as-communication", () => {
    expect(POST_INCIDENT_AI_SYSTEM_PROMPT).toMatch(/never invent/);
    expect(POST_INCIDENT_AI_SYSTEM_PROMPT).toMatch(/never diagnose/);
    expect(POST_INCIDENT_AI_SYSTEM_PROMPT).toMatch(/draft for staff to review/);
  });
  it("disclaimers keep the child's pace and learning-not-blame framing", () => {
    expect(RESTORATIVE_DISCLAIMER).toMatch(/child's pace/);
    expect(REFLECTION_DISCLAIMER).toMatch(/learning, not blame/);
  });
});
