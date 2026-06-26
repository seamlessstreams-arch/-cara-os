import { describe, it, expect } from "vitest";
import { buildDeterministicIntelligence, DETERMINISTIC_INTELLIGENCE_MODES } from "../deterministic-intelligence";

describe("buildDeterministicIntelligence", () => {
  it("covers the 6 supported intelligence modes", () => {
    expect(DETERMINISTIC_INTELLIGENCE_MODES.sort()).toEqual([
      "compute_experience_snapshot",
      "compute_home_climate",
      "generate_oversight",
      "interactive_session_summary",
      "keywork_session_plan",
      "situation_review",
    ]);
  });

  it("returns null for an unknown mode", () => {
    expect(buildDeterministicIntelligence("assist")).toBeNull();
    expect(buildDeterministicIntelligence("learning_quiz")).toBeNull();
    expect(buildDeterministicIntelligence("")).toBeNull();
  });

  it("every mode returns a non-null object", () => {
    for (const mode of DETERMINISTIC_INTELLIGENCE_MODES) {
      expect(buildDeterministicIntelligence(mode), mode).not.toBeNull();
    }
  });

  it("keywork_session_plan provides the arrays the page maps, all non-empty", () => {
    const p = buildDeterministicIntelligence("keywork_session_plan") as Record<string, unknown>;
    for (const field of ["main_discussion_questions", "staff_prompts", "follow_up_actions"]) {
      expect(Array.isArray(p[field]), field).toBe(true);
      expect((p[field] as unknown[]).length, field).toBeGreaterThan(0);
    }
  });

  it("situation_review is honest (never fabricates) and uses the unknown-state enums", () => {
    const s = buildDeterministicIntelligence("situation_review") as Record<string, unknown>;
    expect(s.risk_level).toBe("not_identified");
    expect(s.confidence_level).toBe("insufficient_information");
    expect(Array.isArray(s.safeguarding_flags)).toBe(true); // page maps this unguarded
    expect(Array.isArray(s.suggested_actions)).toBe(true);
  });

  it("generate_oversight is not marked Ofsted-ready and carries array fields", () => {
    const o = buildDeterministicIntelligence("generate_oversight") as Record<string, unknown>;
    expect(o.is_ofsted_ready).toBe(false);
    expect(Array.isArray(o.follow_up_actions)).toBe(true);
    expect(Array.isArray(o.plans_to_update)).toBe(true);
    expect(Array.isArray(o.professionals_to_inform)).toBe(true);
  });

  it("compute_experience_snapshot returns 11 numeric scores at the neutral default", () => {
    const x = buildDeterministicIntelligence("compute_experience_snapshot") as Record<string, unknown>;
    const scoreFields = ["safety_score", "belonging_score", "regulation_score", "engagement_score", "relationships_score", "participation_score", "health_score", "education_score", "stability_score", "achievement_score", "overall_score"];
    for (const f of scoreFields) {
      expect(typeof x[f], f).toBe("number");
      expect(x[f]).toBe(50);
    }
    expect(["improving", "stable", "worsening", "mixed"]).toContain(x.trend);
    expect(String(x.narrative).toLowerCase()).toContain("placeholder");
  });

  it("compute_home_climate returns numeric scores and a placeholder narrative", () => {
    const c = buildDeterministicIntelligence("compute_home_climate") as Record<string, unknown>;
    expect(typeof c.overall_climate_score).toBe("number");
    expect(c.overall_climate_score).toBe(70);
    expect(Array.isArray(c.hotspot_times)).toBe(true);
    expect(Array.isArray(c.risk_flags)).toBe(true);
    expect(String(c.narrative).toLowerCase()).toContain("placeholder");
  });
});
