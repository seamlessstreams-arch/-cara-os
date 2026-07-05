// ══════════════════════════════════════════════════════════════════════════════
// CARA — REG 44 REPORT INTELLIGENCE TESTS
//
// Pins the safety-critical behaviour: all nine standards are assessed; the
// protection standard is NEVER auto-"met"; the two statutory opinions are always
// the visitor's (requiresVisitorJudgement) and are never a bare "yes children are
// safe"; "insufficient evidence" is stated where the records can't carry a
// standard; and every evidence line cites its source.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { assessReg44QualityStandards } from "../qs-assessment-engine";
import type { Reg44AssessmentInput } from "../types";

const base = (o: Partial<Reg44AssessmentInput> = {}): Reg44AssessmentInput => ({
  homeId: "home_oak",
  month: "2026-06",
  asOf: "2026-07-05",
  headline: {
    children_in_residence: 3,
    incidents: 0,
    incidents_critical: 0,
    missing_episodes: 0,
    missing_high_risk: 0,
    restraints: 0,
    restraints_with_injuries: 0,
    complaints: 0,
    complaints_unresolved: 0,
    safeguarding_events: 0,
    reg40_notifications: 0,
    keywork_sessions: 4,
    last_visit_recommendations_outstanding: 0,
  },
  restraints: [],
  missingEpisodes: [],
  keywork: [{ id: "kw1", childVoice: "I like cooking" }],
  childVoice: [{ id: "v1", category: "activities", sentiment: "happy" }],
  complaints: [],
  educationRecords: 0,
  healthRecords: 0,
  achievementRecords: 0,
  carePlanRecords: 0,
  childrenSpokenTo: 2,
  ...o,
});

describe("nine standards", () => {
  it("assesses all nine Quality Standards with their regulations", () => {
    const a = assessReg44QualityStandards(base());
    expect(a.standards).toHaveLength(9);
    expect(a.standards.map((s) => s.regulation)).toContain("Regulation 12");
    expect(a.standards.every((s) => s.requiresVisitorConfirmation)).toBe(true);
  });

  it("says 'insufficient evidence' for standards the records can't carry (education, health)", () => {
    const a = assessReg44QualityStandards(base());
    const edu = a.standards.find((s) => s.key === "qs_education")!;
    expect(edu.suggestedStatus).toBe("insufficient_evidence");
    expect(edu.suggestedNarrative).toMatch(/evidence not found/i);
  });

  it("every evidence line cites a source type and record", () => {
    const a = assessReg44QualityStandards(base());
    for (const s of a.standards) for (const e of s.evidence) {
      expect(e.sourceType).toBeTruthy();
      expect(e.recordType).toBeTruthy();
    }
  });
});

describe("protection (Reg 12) is never auto-'met'", () => {
  it("with clean records, protection is at most 'insufficient_evidence' — never 'met'", () => {
    const a = assessReg44QualityStandards(base({ headline: { ...base().headline, safeguarding_events: 0, incidents: 1 } }));
    const p = a.standards.find((s) => s.key === "qs_protection")!;
    expect(p.suggestedStatus).not.toBe("met");
    expect(p.suggestedNarrative).toMatch(/not on its own evidence/i);
  });

  it("flags a restraint without a child debrief as a protection concern", () => {
    const a = assessReg44QualityStandards(
      base({
        headline: { ...base().headline, restraints: 1 },
        restraints: [{ id: "rst1", childDebriefed: false, hasDebriefRecord: false }],
      }),
    );
    const p = a.standards.find((s) => s.key === "qs_protection")!;
    expect(p.concerns.join(" ")).toMatch(/without a recorded child debrief/i);
    expect(["partly_met", "not_met"]).toContain(p.suggestedStatus);
  });

  it("flags a missing episode without a return interview", () => {
    const a = assessReg44QualityStandards(
      base({
        headline: { ...base().headline, missing_episodes: 1 },
        missingEpisodes: [{ id: "m1", hasReturnInterview: false }],
      }),
    );
    expect(a.standards.find((s) => s.key === "qs_protection")!.concerns.join(" ")).toMatch(/return interview/i);
  });
});

describe("statutory opinions — always the visitor's, never a bare verdict", () => {
  it("both opinions require the visitor's judgement and never assert 'children are safe'", () => {
    const a = assessReg44QualityStandards(base());
    expect(a.safeguardingOpinion.requiresVisitorJudgement).toBe(true);
    expect(a.wellbeingOpinion.requiresVisitorJudgement).toBe(true);
    expect(a.safeguardingOpinion.basis.toLowerCase()).not.toMatch(/children are (effectively )?safe/);
    expect(a.safeguardingOpinion.position).not.toBe("evidence_supports"); // clean ≠ auto-affirm
  });

  it("reads 'concerns_identified' when protection shows unaddressed matters", () => {
    const a = assessReg44QualityStandards(
      base({
        headline: { ...base().headline, restraints: 1 },
        restraints: [{ id: "rst1", childDebriefed: false, hasDebriefRecord: false }],
      }),
    );
    expect(a.safeguardingOpinion.position).toBe("concerns_identified");
    expect(a.safeguardingOpinion.concerns.length).toBeGreaterThan(0);
  });

  it("reads 'insufficient_evidence' for wellbeing when the records are empty", () => {
    const a = assessReg44QualityStandards(base({ keywork: [], childVoice: [], healthRecords: 0, achievementRecords: 0 }));
    expect(a.wellbeingOpinion.position).toBe("insufficient_evidence");
  });
});

describe("validation + readiness", () => {
  it("hard-blocks a blank children's-voice section", () => {
    const a = assessReg44QualityStandards(base({ keywork: [], childVoice: [] }));
    expect(a.validationFlags.some((f) => f.id === "child_voice_blank" && f.severity === "block")).toBe(true);
  });

  it("warns when no child was spoken to", () => {
    const a = assessReg44QualityStandards(base({ childrenSpokenTo: 0 }));
    expect(a.validationFlags.some((f) => f.id === "no_child_spoken" && f.severity === "warning")).toBe(true);
  });

  it("scores readiness and reports safeguarding scrutiny", () => {
    const clean = assessReg44QualityStandards(base());
    expect(clean.readiness.childVoiceCaptured).toBe(true);
    const withConcern = assessReg44QualityStandards(
      base({ headline: { ...base().headline, restraints: 1 }, restraints: [{ id: "r", childDebriefed: false, hasDebriefRecord: false }] }),
    );
    expect(withConcern.readiness.safeguardingScrutiny).toBe("gaps");
  });
});
