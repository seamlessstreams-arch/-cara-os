import { describe, it, expect } from "vitest";
import { buildDeterministicIntelligence, DETERMINISTIC_INTELLIGENCE_MODES } from "../deterministic-intelligence";

describe("buildDeterministicIntelligence", () => {
  it("covers the 13 supported intelligence modes", () => {
    expect(DETERMINISTIC_INTELLIGENCE_MODES.sort()).toEqual([
      "check_missing_evidence",
      "compute_experience_snapshot",
      "compute_home_climate",
      "document_classify",
      "document_to_form",
      "generate_oversight",
      "interactive_session_summary",
      "keywork_session_plan",
      "livers_analysis",
      "livers_escalation",
      "livers_intervention",
      "practice_bank",
      "situation_review",
    ]);
  });

  it("returns null for an unknown mode", () => {
    expect(buildDeterministicIntelligence("assist")).toBeNull();
    expect(buildDeterministicIntelligence("learning_quiz")).toBeNull();
    expect(buildDeterministicIntelligence("")).toBeNull();
  });

  it("every mode returns a non-null value", () => {
    for (const mode of DETERMINISTIC_INTELLIGENCE_MODES) {
      expect(buildDeterministicIntelligence(mode), mode).not.toBeNull();
    }
  });

  it("check_missing_evidence returns an ARRAY (the oversight-radar page requires it) with a valid severity", () => {
    const arr = buildDeterministicIntelligence("check_missing_evidence");
    expect(Array.isArray(arr)).toBe(true);
    const items = arr as Array<Record<string, unknown>>;
    expect(items.length).toBeGreaterThan(0);
    for (const it of items) {
      expect(["red", "amber", "green", "blue"]).toContain(it.severity);
      expect(it.issue).toBeTruthy();
    }
  });

  it("practice_bank provides what_is_working[] and suggested_approaches[] the page reads", () => {
    const p = buildDeterministicIntelligence("practice_bank") as Record<string, unknown>;
    expect(Array.isArray(p.what_is_working)).toBe(true);
    expect((p.what_is_working as unknown[]).length).toBeGreaterThan(0);
    const approaches = p.suggested_approaches as Array<Record<string, unknown>>;
    expect(approaches.length).toBeGreaterThan(0);
    for (const a of approaches) { expect(a.approach).toBeTruthy(); expect(a.rationale).toBeTruthy(); }
  });

  it("livers_analysis is honest (insufficient_information) and never auto-escalates", () => {
    const a = buildDeterministicIntelligence("livers_analysis") as Record<string, unknown>;
    expect(a.cara_confidence).toBe("insufficient_information");
    expect(a.escalation_required).toBe(false);
    expect(["low", "moderate", "high"]).toContain(a.viability_rating);
  });

  it("livers_escalation defaults to human oversight, not a fabricated emergency", () => {
    const e = buildDeterministicIntelligence("livers_escalation") as Record<string, unknown>;
    expect(e.management_oversight_required).toBe(true);
    expect(["none", "internal_oversight", "external_referral", "emergency"]).toContain(e.escalation_level);
    expect(e.escalation_level).not.toBe("emergency"); // never fabricate an emergency
    expect(Array.isArray(e.escalation_actions)).toBe(true);
  });

  it("livers_intervention provides the arrays the page maps", () => {
    const s = buildDeterministicIntelligence("livers_intervention") as Record<string, unknown>;
    expect((s.session_steps as unknown[]).length).toBeGreaterThan(0);
    expect((s.reflective_questions_staff as unknown[]).length).toBeGreaterThan(0); // page maps unguarded
  });

  it("document_classify returns all the arrays the wizard maps (empty is safe)", () => {
    const d = buildDeterministicIntelligence("document_classify") as Record<string, unknown>;
    for (const f of ["suggested_tags", "key_facts", "key_dates", "key_people", "risks_identified", "actions_identified"]) {
      expect(Array.isArray(d[f]), f).toBe(true);
    }
  });

  it("document_to_form exposes `fields` (the wizard calls Object.entries on it)", () => {
    const d = buildDeterministicIntelligence("document_to_form") as Record<string, unknown>;
    expect(typeof d.fields).toBe("object");
    expect(d.fields).not.toBeNull();
    expect(() => Object.entries(d.fields as object)).not.toThrow();
    expect(Array.isArray(d.missing_fields)).toBe(true);
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
