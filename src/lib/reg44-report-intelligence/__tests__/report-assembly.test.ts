// ══════════════════════════════════════════════════════════════════════════════
// CARA — REG 44 REPORT ASSEMBLY TESTS
//
// Pins: the A–Q report is assembled from the QS assessment + evidence pack; every
// drafted section is evidence-based; the sections needing the visitor's judgement
// are flagged; children's voice uses the anonymised refs only; the Reg 45 section
// is explicitly evidence-only; and the gate-draft reflects the assembled state.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { assembleReg44ReportDraft, type Reg44AssemblyInput } from "../report-assembly";
import { assessReg44QualityStandards } from "../qs-assessment-engine";
import { validateReg44Report } from "../report-validation";
import type { Reg44AssessmentInput } from "../types";

const qsInput: Reg44AssessmentInput = {
  homeId: "home_oak",
  month: "2026-06",
  asOf: "2026-07-05",
  headline: {
    children_in_residence: 3, incidents: 4, incidents_critical: 1, missing_episodes: 1, missing_high_risk: 0,
    restraints: 2, restraints_with_injuries: 0, complaints: 1, complaints_unresolved: 1, safeguarding_events: 1,
    reg40_notifications: 1, keywork_sessions: 5, last_visit_recommendations_outstanding: 2,
  },
  restraints: [{ id: "rst1", childDebriefed: false, hasDebriefRecord: false }],
  missingEpisodes: [{ id: "m1", hasReturnInterview: false }],
  keywork: [{ id: "kw1", childVoice: "I like it here" }],
  childVoice: [{ id: "v1", category: "being_listened_to", sentiment: "unhappy" }],
  complaints: [{ id: "c1", resolved: false }],
  educationRecords: 0, healthRecords: 0, achievementRecords: 0, carePlanRecords: 0,
  childrenSpokenTo: 2,
};

const input = (o: Partial<Reg44AssemblyInput> = {}): Reg44AssemblyInput => ({
  homeId: "home_oak",
  homeName: "Oak House",
  month: "2026-06",
  asOf: "2026-07-05",
  qs: assessReg44QualityStandards(qsInput),
  headline: qsInput.headline,
  childVoiceEntries: [{ ref: "A.M.", summary: "Feels settled; wants more cooking." }],
  previousRecommendations: [{ text: "Audit PI records", status: "outstanding", priority: "high" }],
  reg45EvidenceCount: 4,
  ...o,
});

describe("A–Q assembly", () => {
  const a = assembleReg44ReportDraft(input());

  it("assembles the full A–Q structure including J1–J8", () => {
    const keys = a.sections.map((s) => s.key);
    for (const k of ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J1", "J6", "J8", "K", "L", "M", "N", "O", "P", "Q"]) {
      expect(keys).toContain(k);
    }
  });

  it("drafts the executive summary from the evidence (counts the standards)", () => {
    const A = a.sections.find((s) => s.key === "A")!;
    expect(A.status).toBe("drafted_from_evidence");
    expect(A.content).toMatch(/nine Quality Standards/);
  });

  it("uses the anonymised refs for children's voice — never names", () => {
    const D = a.sections.find((s) => s.key === "D")!;
    expect(D.content).toMatch(/A\.M\./);
    expect(D.status).toBe("drafted_from_evidence");
  });

  it("flags children's voice insufficient when none is captured", () => {
    const a2 = assembleReg44ReportDraft(input({ childVoiceEntries: [] }));
    const D = a2.sections.find((s) => s.key === "D")!;
    expect(D.status).toBe("insufficient_evidence");
    expect(D.visitorMustComplete).toBe(true);
  });

  it("carries the protection finding into J6 detailed findings", () => {
    const J6 = a.sections.find((s) => s.key === "J6")!;
    expect(J6.content.length).toBeGreaterThan(0);
  });

  it("leaves the statutory opinion (K) for the visitor", () => {
    const K = a.sections.find((s) => s.key === "K")!;
    expect(K.visitorMustComplete).toBe(true);
    expect(K.content).toMatch(/must state both opinions/i);
  });

  it("makes the Reg 45 section explicitly evidence-only", () => {
    const N = a.sections.find((s) => s.key === "N")!;
    expect(N.content).toMatch(/does not constitute the Regulation 45 review/i);
  });

  it("flags independence, opinion, conflict-of-interest and sign-off for the visitor", () => {
    for (const k of ["B", "K", "P", "Q"]) {
      expect(a.sections.find((s) => s.key === k)!.visitorMustComplete).toBe(true);
    }
  });
});

describe("gate-draft reflects the assembled state", () => {
  it("marks all nine standards assessed and child voice captured, and the gate can validate it", () => {
    const a = assembleReg44ReportDraft(input());
    expect(a.draftForGate.qualityStandardsAssessed).toBe(9);
    expect(a.draftForGate.childrenVoice.captured).toBe(true);
    // A freshly-assembled draft still needs the visitor's human sections → blocks.
    const v = validateReg44Report(a.draftForGate);
    expect(v.canSubmit).toBe(false);
    expect(v.blocks.some((b) => b.id === "visit_date_missing")).toBe(true);
  });
});
