// ══════════════════════════════════════════════════════════════════════════════
// CARA — COGNITIVE BIAS REFLECTION ENGINE TESTS
//
// Pins: all sixteen biases defined; the spec's example prompts VERBATIM;
// deterministic trigger/no-trigger per rule (each triggered prompt cites its
// fact); standing reflections per context; and the NON-JUDGEMENTAL LANGUAGE
// GATE — no prompt may accuse, name, or score a person.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  BIAS_DEFINITIONS,
  computeBiasReflections,
} from "../bias-engine";
import { BIAS_KEYS, type BiasSignalInput } from "../types";

const base = (overrides: Partial<BiasSignalInput> = {}): BiasSignalInput => ({
  context: "management_oversight",
  ...overrides,
});

// ── The bank itself ───────────────────────────────────────────────────────────

describe("bias definitions", () => {
  it("defines all sixteen biases from the spec", () => {
    expect(BIAS_KEYS).toHaveLength(16);
    for (const key of BIAS_KEYS) {
      expect(BIAS_DEFINITIONS[key].prompt.trim().length).toBeGreaterThan(0);
      expect(BIAS_DEFINITIONS[key].whatItLooksLike.trim().length).toBeGreaterThan(0);
    }
  });

  it("keeps the spec's example prompts verbatim", () => {
    expect(BIAS_DEFINITIONS.confirmation.prompt).toBe(
      "Before finalising, have alternative explanations been considered?",
    );
    expect(BIAS_DEFINITIONS.recency.prompt).toBe(
      "Recent incidents may be influencing this judgement. Would reviewing the wider chronology help?",
    );
    const standing = computeBiasReflections(base({ context: "safeguarding_concern" })).standing.map((s) => s.prompt);
    expect(standing).toContain("Has the child's voice been considered directly, or are we relying mainly on adult interpretation?");
    expect(standing).toContain("Is this decision based on evidence, interpretation, or both?");
    expect(standing).toContain("Have cultural, disability, trauma, neurodiversity or communication needs been considered?");
  });

  it("NON-JUDGEMENTAL LANGUAGE GATE — no prompt accuses, names or scores a person", () => {
    const banned = [
      /\byou (failed|should have|must|are)\b/i,
      /\bstaff (failed|error|fault|to blame)\b/i,
      /\bincompetent|negligent|careless|lazy\b/i,
      /\bblame\b/i,
      /\byour (bias|failure|mistake)\b/i,
    ];
    const allText = Object.values(BIAS_DEFINITIONS)
      .flatMap((d) => [d.prompt, d.whatItLooksLike])
      .join("\n");
    for (const pattern of banned) {
      expect(allText).not.toMatch(pattern);
    }
    // Every prompt is a question — reflection, not instruction.
    for (const d of Object.values(BIAS_DEFINITIONS)) {
      expect(d.prompt.trim().endsWith("?")).toBe(true);
    }
  });
});

// ── Trigger rules: fire on the fact, silent without it ────────────────────────

describe("signal-triggered rules", () => {
  const cases: Array<{ bias: string; fire: Partial<BiasSignalInput>; silent: Partial<BiasSignalInput> }> = [
    { bias: "confirmation", fire: { alternativesConsideredCount: 0 }, silent: { alternativesConsideredCount: 2 } },
    { bias: "anchoring", fire: { initialAssessmentUnchanged: true }, silent: { initialAssessmentUnchanged: false } },
    { bias: "availability", fire: { comparisonCaseCitedWithoutRecords: true }, silent: {} },
    { bias: "recency", fire: { recentIncidentCount7d: 2 }, silent: { recentIncidentCount7d: 1 } },
    { bias: "recency", fire: { decisionWithinDaysOfIncident: 1 }, silent: { decisionWithinDaysOfIncident: 10 } },
    { bias: "negativity", fire: { concernsRecordedCount: 4, strengthsRecordedCount: 0 }, silent: { concernsRecordedCount: 4, strengthsRecordedCount: 1 } },
    { bias: "halo", fire: { reputationCitedAgainstConcern: true }, silent: {} },
    { bias: "authority", fire: { seniorViewAdoptedWithoutEvidence: true }, silent: {} },
    { bias: "groupthink", fire: { contributorsAgreeing: 3, dissentRecorded: false }, silent: { contributorsAgreeing: 3, dissentRecorded: true } },
    { bias: "optimism", fire: { riskDowngradedWithoutNewEvidence: true }, silent: {} },
    { bias: "escalation_commitment", fire: { planUnchangedDespiteNoImprovement: true }, silent: {} },
    { bias: "defensive_recording", fire: { justificationFocusedRecording: true }, silent: {} },
    { bias: "professional_drift", fire: { policyDeviationsRecent: 2 }, silent: { policyDeviationsRecent: 1 } },
    { bias: "compassion_fatigue", fire: { staffIncidentExposure30d: 5 }, silent: { staffIncidentExposure30d: 4 } },
  ];

  it.each(cases)("$bias fires on its fact and stays silent without it", ({ bias, fire, silent }) => {
    const fired = computeBiasReflections(base(fire)).prompts.map((p) => p.bias);
    expect(fired).toContain(bias);
    const quiet = computeBiasReflections(base(silent)).prompts.map((p) => p.bias);
    expect(quiet).not.toContain(bias);
  });

  it("outcome bias fires only in retrospective contexts", () => {
    const inReview = computeBiasReflections(base({ context: "incident_review", outcomeKnownAtReview: true }));
    expect(inReview.prompts.map((p) => p.bias)).toContain("outcome");
    const inEscalation = computeBiasReflections(base({ context: "risk_escalation", outcomeKnownAtReview: true }));
    expect(inEscalation.prompts.map((p) => p.bias)).not.toContain("outcome");
  });

  it("missing child voice sharpens the attribution prompt with the citing fact", () => {
    const result = computeBiasReflections(base({ childVoiceQuoted: false }));
    const prompt = result.prompts.find((p) => p.bias === "fundamental_attribution");
    expect(prompt).toBeTruthy();
    expect(prompt!.because).toMatch(/own words are not quoted/i);
    // And quoted voice keeps it silent.
    expect(
      computeBiasReflections(base({ childVoiceQuoted: true })).prompts.map((p) => p.bias),
    ).not.toContain("fundamental_attribution");
  });

  it("every triggered prompt cites the fact that fired it", () => {
    const result = computeBiasReflections(
      base({ alternativesConsideredCount: 0, recentIncidentCount7d: 3, staffIncidentExposure30d: 6 }),
    );
    for (const p of result.prompts) {
      expect(p.because.trim().length).toBeGreaterThan(0);
    }
  });

  it("an empty signal triggers nothing — no facts, no prompts", () => {
    expect(computeBiasReflections(base()).prompts).toEqual([]);
  });
});

// ── Standing reflections per context ──────────────────────────────────────────

describe("standing reflections", () => {
  it("serious incident reviews always carry the hindsight check", () => {
    const standing = computeBiasReflections(base({ context: "serious_incident_review" })).standing;
    expect(standing.some((s) => /signs feel obvious/i.test(s.prompt))).toBe(true);
  });

  it("every context carries at least one standing reflection and the disclaimer", () => {
    const contexts = [
      "safeguarding_concern",
      "risk_escalation",
      "management_oversight",
      "strategy_discussion",
      "incident_review",
      "complaint",
      "placement_stability_review",
      "child_protection",
      "serious_incident_review",
    ] as const;
    for (const context of contexts) {
      const result = computeBiasReflections(base({ context }));
      expect(result.standing.length).toBeGreaterThan(0);
      expect(result.disclaimer).toMatch(/never to score or profile/i);
    }
  });
});
