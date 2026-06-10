import { describe, it, expect } from "vitest";
import {
  buildJobAdvertScaffold, buildCandidateSummaryScaffold, buildActionPlanScaffold,
  ADVERT_AI_SYSTEM_PROMPT, SUMMARY_AI_SYSTEM_PROMPT, PLAN_AI_SYSTEM_PROMPT,
  ASSISTANT_DISCLAIMER, type VacancyLite,
} from "../manager-assistant-engine";
import type { EmployerValuesProfile, ValuesMatchResult } from "../values-match-engine";

const VACANCY: VacancyLite = {
  id: "vac_001", title: "Residential Care Worker", employment_type: "permanent", contract_type: "full_time",
  salary_min: 24000, salary_max: 27000, hours: 40,
  shift_pattern: "Rotating days, evenings and sleep-ins",
  safeguarding_statement: "All posts are subject to an enhanced DBS check.",
};

const EMPLOYER: EmployerValuesProfile = {
  id: "evp", home_id: "home_oak", organisation_name: "Avisaar", home_name: "Chamberlain House",
  core_values: ["child-centred", "warmth", "resilience"],
  care_approach: "Relational, trauma-informed care.",
  leadership_style: "Visible and supportive.",
  therapeutic_model: "Attachment & PACE.",
  pace_commitment: "PACE in every interaction.",
  trauma_informed_expectations: "Behaviour as communication.",
  safeguarding_culture: "Speak up, always.",
  expected_behaviours: ["curiosity over judgement", "reliability"],
  non_negotiables: ["No physical punishment"],
  what_makes_us_different: "A small, nurturing home where relationships come first.",
  relational_practice_priority: "high",
  updated_at: "2026-01-01T00:00:00Z",
};

const MATCH: ValuesMatchResult = {
  candidate_id: "cand_001", candidate_name: "Amara Osei", preferred_role: "residential_care_worker",
  match_percent: 95, band: "strong",
  dimensions: [], shared_values: ["child-centred", "warmth"],
  strengths: ["Values alignment: shares 2 core values."],
  concerns: ["Report writing identified as a development area."],
  interview_prompts: [], suggested_support: ["Plan early development in: report writing."],
  areas_to_explore: [],
  disclaimer: "This is a support tool only. Final recruitment decisions must be made by the organisation using safer recruitment practice, professional judgement and human decision-making.",
};

describe("job advert scaffold", () => {
  it("assembles the advert from vacancy + values profile facts only", () => {
    const ad = buildJobAdvertScaffold(VACANCY, EMPLOYER);
    expect(ad).toContain("Residential Care Worker — Chamberlain House");
    expect(ad).toContain("£24,000–£27,000");
    expect(ad).toContain("40 hours/week");
    expect(ad).toContain("Rotating days, evenings and sleep-ins");
    expect(ad).toContain("A small, nurturing home where relationships come first.");
    expect(ad).toContain("child-centred · warmth · resilience");
    expect(ad).toContain("curiosity over judgement");
    expect(ad).toContain("All posts are subject to an enhanced DBS check.");
    expect(ad).toContain("Safer recruitment");
  });

  it("degrades gracefully without a values profile (placeholders, default safer-rec)", () => {
    const ad = buildJobAdvertScaffold({ ...VACANCY, safeguarding_statement: null }, null);
    expect(ad).toContain("[Add a short paragraph about your home");
    expect(ad).toMatch(/enhanced DBS check, barred list check/);
    expect(ad).not.toContain("undefined");
  });

  it("is deterministic", () => {
    expect(buildJobAdvertScaffold(VACANCY, EMPLOYER)).toBe(buildJobAdvertScaffold(VACANCY, EMPLOYER));
  });
});

describe("candidate summary scaffold", () => {
  it("re-presents the match facts and keeps the matching disclaimer", () => {
    const s = buildCandidateSummaryScaffold(MATCH);
    expect(s).toContain("Amara Osei");
    expect(s).toContain("95%");
    expect(s).toContain("Shared values: child-centred, warmth.");
    expect(s).toContain("Report writing identified as a development area.");
    expect(s).toMatch(/support tool only/);
  });
});

describe("action plan scaffold", () => {
  it("structures the goal with owner/date placeholders and a review section", () => {
    const p = buildActionPlanScaffold("Improve bedtime routines", "Two recent evening incidents");
    expect(p).toContain("Action plan (draft): Improve bedtime routines");
    expect(p).toContain("Context: Two recent evening incidents");
    expect(p).toMatch(/owner: \[name\], by: \[date\]/);
    expect(p).toContain("Evidence & review");
  });
});

describe("safety wording", () => {
  it("AI prompts forbid invention and decisions; disclaimer matches the spec", () => {
    expect(ADVERT_AI_SYSTEM_PROMPT).toMatch(/WITHOUT inventing any facts/);
    expect(ADVERT_AI_SYSTEM_PROMPT).toMatch(/safer-recruitment section verbatim/);
    expect(SUMMARY_AI_SYSTEM_PROMPT).toMatch(/never invent/);
    expect(SUMMARY_AI_SYSTEM_PROMPT).toMatch(/no hiring recommendation/);
    expect(PLAN_AI_SYSTEM_PROMPT).toMatch(/do not invent facts/);
    expect(ASSISTANT_DISCLAIMER).toMatch(/professional judgement and manager approval/);
    expect(ASSISTANT_DISCLAIMER).toMatch(/nothing is published or sent automatically/i);
  });
});
