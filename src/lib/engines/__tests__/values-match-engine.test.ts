import { describe, it, expect } from "vitest";
import {
  computeValuesMatch, computeAllMatches, bandFor, MATCH_DISCLAIMER,
  type EmployerValuesProfile, type CandidateValuesProfile,
} from "../values-match-engine";

const EMPLOYER: EmployerValuesProfile = {
  id: "evp_1", home_id: "home_oak", organisation_name: "Avisaar", home_name: "Chamberlain House",
  core_values: ["child-centred", "warmth", "resilience", "honesty", "consistency"],
  care_approach: "Relational, trauma-informed.",
  leadership_style: "Supportive, visible.",
  therapeutic_model: "Attachment & PACE.",
  pace_commitment: "PACE in every interaction.",
  trauma_informed_expectations: "Behaviour as communication.",
  safeguarding_culture: "Speak up, always.",
  expected_behaviours: ["curiosity", "reliability"],
  non_negotiables: ["No physical punishment", "Always record concerns"],
  what_makes_us_different: "Small, nurturing.",
  relational_practice_priority: "high",
  updated_at: "2026-01-01T00:00:00Z",
};

function cand(over: Partial<CandidateValuesProfile> = {}): CandidateValuesProfile {
  return {
    id: "cvp_x", candidate_id: "cand_x", candidate_name: "Test Candidate",
    values: [], what_matters_in_employer: "", childrens_home_experience_years: 0,
    preferred_role: "residential_care_worker", availability: "Full-time, flexible",
    qualifications: [], confidence_areas: [], development_areas: [],
    safeguarding_mindset: "", relational_indicators: [], scenario_answers: [],
    updated_at: "2026-01-01T00:00:00Z", ...over,
  };
}

describe("computeValuesMatch", () => {
  it("always carries the mandatory disclaimer", () => {
    const r = computeValuesMatch(EMPLOYER, cand());
    expect(r.disclaimer).toBe(MATCH_DISCLAIMER);
    expect(r.disclaimer).toMatch(/support tool only/i);
  });

  it("dimension weights sum to 1", () => {
    const r = computeValuesMatch(EMPLOYER, cand());
    const total = r.dimensions.reduce((s, d) => s + d.weight, 0);
    expect(total).toBeCloseTo(1, 5);
  });

  it("scores a strong, aligned candidate highly and lists shared values", () => {
    const r = computeValuesMatch(EMPLOYER, cand({
      values: ["child-centred", "warmth", "resilience", "honesty"],
      childrens_home_experience_years: 4,
      qualifications: ["Level 3 Diploma in Residential Childcare"],
      relational_indicators: ["PACE", "co-regulation", "attunement"],
      safeguarding_mindset: "I would safeguard the child, record the concern and escalate to the designated lead immediately.",
    }));
    expect(r.shared_values).toEqual(expect.arrayContaining(["child-centred", "warmth", "resilience", "honesty"]));
    expect(r.match_percent).toBeGreaterThanOrEqual(80);
    expect(r.band).toBe("strong");
    expect(r.strengths.length).toBeGreaterThan(0);
  });

  it("scores a thin candidate low and raises concerns + areas to explore", () => {
    const r = computeValuesMatch(EMPLOYER, cand({
      values: [], childrens_home_experience_years: 0, qualifications: [],
      relational_indicators: [], safeguarding_mindset: "",
    }));
    expect(r.match_percent).toBeLessThan(50);
    expect(r.band).toBe("limited");
    expect(r.concerns.length).toBeGreaterThan(0);
    expect(r.areas_to_explore.length).toBeGreaterThan(0);
  });

  it("interview prompts include a values probe and the non-negotiables", () => {
    const r = computeValuesMatch(EMPLOYER, cand());
    expect(r.interview_prompts.some((p) => p.includes("child-centred"))).toBe(true);
    expect(r.interview_prompts.some((p) => p.includes("No physical punishment"))).toBe(true);
  });

  it("turns development areas into suggested support", () => {
    const r = computeValuesMatch(EMPLOYER, cand({ development_areas: ["de-escalation"] }));
    expect(r.suggested_support.some((s) => /de-escalation/i.test(s))).toBe(true);
  });

  it("relational priority 'high' weights relational practice more than 'low'", () => {
    const high = computeValuesMatch({ ...EMPLOYER, relational_practice_priority: "high" }, cand());
    const low = computeValuesMatch({ ...EMPLOYER, relational_practice_priority: "low" }, cand());
    const relHigh = high.dimensions.find((d) => d.key === "relational")!.weight;
    const relLow = low.dimensions.find((d) => d.key === "relational")!.weight;
    expect(relHigh).toBeGreaterThan(relLow);
  });

  it("is deterministic", () => {
    const c = cand({ values: ["warmth"], childrens_home_experience_years: 2 });
    expect(computeValuesMatch(EMPLOYER, c)).toEqual(computeValuesMatch(EMPLOYER, c));
  });
});

describe("computeAllMatches", () => {
  it("ranks candidates by match percent, highest first", () => {
    const strong = cand({ candidate_id: "s", candidate_name: "Strong", values: ["child-centred", "warmth", "resilience", "honesty", "consistency"], childrens_home_experience_years: 5, qualifications: ["Level 5 Diploma"], relational_indicators: ["PACE", "co-regulation", "attunement"], safeguarding_mindset: "safeguard, record concern, escalate to designated lead" });
    const weak = cand({ candidate_id: "w", candidate_name: "Weak" });
    const ranked = computeAllMatches(EMPLOYER, [weak, strong]);
    expect(ranked[0].candidate_id).toBe("s");
    expect(ranked[0].match_percent).toBeGreaterThanOrEqual(ranked[1].match_percent);
  });
});

describe("bandFor", () => {
  it("bands by threshold", () => {
    expect(bandFor(85)).toBe("strong");
    expect(bandFor(70)).toBe("promising");
    expect(bandFor(55)).toBe("explore");
    expect(bandFor(20)).toBe("limited");
  });
});
