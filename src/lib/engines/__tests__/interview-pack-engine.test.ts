import { describe, it, expect } from "vitest";
import { buildInterviewPack, INTERVIEW_ROLES, INTERVIEW_DISCLAIMER } from "../interview-pack-engine";
import type { EmployerValuesProfile } from "../values-match-engine";

const EMPLOYER: EmployerValuesProfile = {
  id: "evp", home_id: "home_oak", organisation_name: "Avisaar", home_name: "Chamberlain House",
  core_values: ["child-centred", "warmth", "resilience", "honesty"],
  care_approach: "", leadership_style: "", therapeutic_model: "", pace_commitment: "",
  trauma_informed_expectations: "", safeguarding_culture: "",
  expected_behaviours: [], non_negotiables: ["No physical punishment", "Always record concerns"],
  what_makes_us_different: "", relational_practice_priority: "high", updated_at: "2026-01-01T00:00:00Z",
};

describe("buildInterviewPack", () => {
  it("includes the common sections for a residential worker (no leadership)", () => {
    const pack = buildInterviewPack({ role: "residential_care_worker" });
    const keys = pack.sections.map((s) => s.key);
    expect(keys).toEqual(["values", "safeguarding", "trauma_informed", "pace", "scenario"]);
    expect(keys).not.toContain("leadership");
    expect(pack.role_label).toMatch(/Residential/);
  });

  it("adds a leadership section for senior roles", () => {
    for (const role of ["team_leader", "deputy_manager", "registered_manager"]) {
      const pack = buildInterviewPack({ role });
      expect(pack.sections.map((s) => s.key)).toContain("leadership");
    }
  });

  it("derives values prompts from the employer profile (core values + non-negotiables)", () => {
    const pack = buildInterviewPack({ role: "residential_care_worker", employer: EMPLOYER });
    expect(pack.values_prompts.some((p) => p.includes("child-centred"))).toBe(true);
    expect(pack.values_prompts.some((p) => p.includes("No physical punishment"))).toBe(true);
  });

  it("has no values prompts when no employer profile is given", () => {
    const pack = buildInterviewPack({ role: "team_leader" });
    expect(pack.values_prompts).toHaveLength(0);
  });

  it("attaches and de-duplicates candidate-specific prompts", () => {
    const pack = buildInterviewPack({ role: "residential_care_worker", candidatePrompts: ["Explore X", "Explore X", "Explore Y"] });
    expect(pack.candidate_prompts).toEqual(["Explore X", "Explore Y"]);
  });

  it("every question carries guidance and red flags", () => {
    const pack = buildInterviewPack({ role: "registered_manager", employer: EMPLOYER });
    for (const s of pack.sections) {
      for (const q of s.questions) {
        expect(q.q.length).toBeGreaterThan(0);
        expect(q.guidance.length).toBeGreaterThan(0);
        expect(Array.isArray(q.red_flags)).toBe(true);
      }
    }
  });

  it("exposes the 7 scoring categories, panel decisions and the disclaimer", () => {
    const pack = buildInterviewPack({ role: "deputy_manager" });
    expect(pack.scoring_categories.map((c) => c.key)).toContain("safeguarding_awareness");
    expect(pack.scoring_categories).toHaveLength(7);
    expect(pack.panel_decision_options.map((d) => d.key)).toContain("do_not_recommend");
    expect(pack.disclaimer).toBe(INTERVIEW_DISCLAIMER);
  });

  it("falls back to the first role for an unknown role key", () => {
    const pack = buildInterviewPack({ role: "nonsense" });
    expect(pack.role).toBe(INTERVIEW_ROLES[0].key);
  });

  it("is deterministic", () => {
    const a = buildInterviewPack({ role: "team_leader", employer: EMPLOYER, candidatePrompts: ["P"] });
    const b = buildInterviewPack({ role: "team_leader", employer: EMPLOYER, candidatePrompts: ["P"] });
    expect(a).toEqual(b);
  });
});
