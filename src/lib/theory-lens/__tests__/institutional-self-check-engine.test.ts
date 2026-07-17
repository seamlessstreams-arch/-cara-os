import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { reviewTone } from "@/lib/philosophy/covenant";
import { buildInstitutionalSelfCheck, SELF_CHECK_CAVEAT } from "../institutional-self-check-engine";
import type { EscalationQualityResult } from "@/lib/risk-escalation/escalation-quality-engine";
import type { VoiceFollowThroughResult } from "@/lib/voice-of-child/voice-follow-through-engine";
import type { RepairCycleData } from "@/lib/repair-cycle-intelligence/repair-cycle-engine";

// Minimal stand-ins shaped like the three real engines' outputs. This engine
// composes them; it must never re-derive what they own.
const escalation = (over: Partial<EscalationQualityResult> = {}): EscalationQualityResult =>
  ({
    reads: [],
    findings: [],
    counts: { total: 4, awaiting: 0, withinWindow: 4, exceededWindow: 0, amendedDown: 0, urgentShare: 0.2 },
    medianHoursByLevel: {},
    ...over,
  }) as EscalationQualityResult;

const repair = (over: Partial<RepairCycleData["summary"]> = {}, profiles: unknown[] = []): RepairCycleData =>
  ({
    incidentProfiles: profiles,
    childSummaries: [],
    summary: {
      totalIncidents: 3,
      incidentsWithDebrief: 3,
      incidentsWithLessonsLearned: 3,
      incidentsWithChildPerspective: 3,
      incidentsWithCompleteRepair: 3,
      avgDebriefTurnaroundDays: 1,
      mostCommonMissingStep: "none",
      overallCompletionRate: 100,
      ofstedNote: "",
      ...over,
    },
  }) as RepairCycleData;

const voice = (over: Partial<VoiceFollowThroughResult> = {}): VoiceFollowThroughResult =>
  ({
    loops: [{ id: "vl_1" }],
    detections: [],
    counts: { open: 1, awaitingExplainBack: 0, closed: 0 },
    ...over,
  }) as VoiceFollowThroughResult;

describe("absence of data is NOT reassurance (the inversion)", () => {
  it("does NOT go green on an empty home — it reports that nothing is monitored", () => {
    // The most dangerous output this engine could produce is a clean bill of
    // health earned by never writing anything down.
    const c = buildInstitutionalSelfCheck({ escalation: null, repair: null, voice: null });
    expect(c.lit).toBe(0);
    expect(c.unlit).toBe(3);
    expect(c.findings).toEqual([]);
    expect(c.summary).toMatch(/not a clean bill of health/i);
    expect(c.summary).toMatch(/nothing here is being monitored/i);
  });

  it("treats an engine with zero records as unlit, not as passing", () => {
    const c = buildInstitutionalSelfCheck({
      escalation: escalation({ counts: { total: 0, awaiting: 0, withinWindow: 0, exceededWindow: 0, amendedDown: 0, urgentShare: 0 } }),
      repair: repair({ totalIncidents: 0, incidentsWithCompleteRepair: 0, incidentsWithChildPerspective: 0 }),
      voice: voice({ loops: [] }),
    });
    expect(c.lit).toBe(0);
    // Crucially: no "responding_well" / "repairing_well" / "answering_well".
    expect(c.findings.filter((f) => f.tone === "positive")).toEqual([]);
  });

  it("says plainly, on every unlit strand, that silence is not health", () => {
    const c = buildInstitutionalSelfCheck({ escalation: null, repair: null, voice: null });
    for (const s of c.strands) {
      expect(s.visibility).toBe("unlit");
      expect(s.visibilityNote).toMatch(/not the same as this going well/i);
      expect(s.visibilityNote).toMatch(/cannot audit itself on records it never made/i);
    }
  });

  it("never relaxes about unmonitored strands even when the lit ones are clean", () => {
    const c = buildInstitutionalSelfCheck({ escalation: escalation(), repair: null, voice: null });
    expect(c.summary).toMatch(/unmonitored — worth knowing, not worth relaxing about/i);
  });
});

describe("the unit is the home, never a person", () => {
  it("has no staff field on a finding — the shape forbids the performance report", () => {
    const src = readFileSync(join(__dirname, "..", "institutional-self-check-engine.ts"), "utf8");
    const iface = src.slice(src.indexOf("export interface SelfCheckFinding"), src.indexOf("export interface StrandView"));
    for (const banned of ["staffId", "staff_id", "facilitated_by", "blamed", "responsible"]) {
      expect(iface).not.toContain(banned);
    }
  });

  it("carries no staff identifier through from the source engines", () => {
    const c = buildInstitutionalSelfCheck({
      escalation: escalation({
        findings: [
          {
            key: "decision_overdue",
            tone: "prompt",
            headline: "Casey — 11 days at emerging concern",
            whyShown: "Past its 8-hour window.",
            evidenceIds: ["esc_1"],
            suggestedQuestions: [],
          },
        ],
      }),
      repair: null,
      voice: null,
    });
    expect(JSON.stringify(c)).not.toMatch(/staff_[a-z]+/);
  });
});

describe("it speaks from where the child sits", () => {
  it("re-voices a timescale breach as a child waiting", () => {
    const c = buildInstitutionalSelfCheck({
      escalation: escalation({
        findings: [
          {
            key: "decision_overdue",
            tone: "prompt",
            headline: "Casey — 11 days at emerging concern",
            whyShown: "Past its 8-hour window.",
            evidenceIds: ["esc_1"],
            suggestedQuestions: [],
          },
        ],
      }),
      repair: null,
      voice: null,
    });
    const f = c.findings[0];
    expect(f.headline).toMatch(/A child is waiting on a decision/i);
    expect(f.evidenceIds).toEqual(["esc_1"]); // traceable back to the record
  });

  it("frames an unanswered voice as what the child learns, not as an SLA", () => {
    const c = buildInstitutionalSelfCheck({
      escalation: null,
      repair: null,
      voice: voice({
        detections: [
          { key: "voice_without_response", tone: "prompt", childId: "yp_casey", loopId: "vl_9", headline: "x", whyShown: "y", evidence: { raisedDates: [], stage: "listened", daysAtStage: 12 }, suggestedQuestions: [] },
        ],
      } as Partial<VoiceFollowThroughResult>),
    });
    const f = c.findings.find((x) => x.key === "voice_unanswered")!;
    expect(f.whyShown).toMatch(/speaking up changes nothing/i);
    expect(f.question).toMatch(/what would this child say has happened/i);
  });

  it("says why an unrepaired rupture matters to the child, not to the audit", () => {
    const c = buildInstitutionalSelfCheck({
      escalation: null,
      repair: repair({ totalIncidents: 5, incidentsWithCompleteRepair: 2, mostCommonMissingStep: "the child's account" }),
      voice: null,
    });
    const f = c.findings.find((x) => x.key === "ruptures_left_unrepaired")!;
    expect(f.headline).toMatch(/3 of 5/);
    expect(f.whyShown).toMatch(/adults leave things broken/i);
  });

  it("notices when the record holds only the adults' version", () => {
    const c = buildInstitutionalSelfCheck({
      escalation: null,
      repair: repair({ totalIncidents: 4, incidentsWithChildPerspective: 1, incidentsWithCompleteRepair: 4 }),
      voice: null,
    });
    const f = c.findings.find((x) => x.key === "child_perspective_missing")!;
    expect(f.headline).toMatch(/3 incidents recorded without the child's account/i);
    expect(f.question).toMatch(/would the child recognise it/i);
  });
});

describe("it credits the home, not only flags it", () => {
  it("says so when concerns are decided inside their windows", () => {
    const c = buildInstitutionalSelfCheck({ escalation: escalation(), repair: null, voice: null });
    const f = c.findings.find((x) => x.key === "responding_well")!;
    expect(f.tone).toBe("positive");
    expect(f.headline).toMatch(/inside their windows/i);
  });

  it("names the hard half being done when every voice loop is answered back", () => {
    const c = buildInstitutionalSelfCheck({ escalation: null, repair: null, voice: voice() });
    const f = c.findings.find((x) => x.key === "answering_well")!;
    expect(f.tone).toBe("positive");
    expect(f.question).toMatch(/hard half/i);
  });
});

describe("a prompt, never a verdict", () => {
  it("always carries the caveat, whatever the findings say", () => {
    for (const c of [
      buildInstitutionalSelfCheck({ escalation: null, repair: null, voice: null }),
      buildInstitutionalSelfCheck({ escalation: escalation(), repair: repair(), voice: voice() }),
    ]) {
      expect(c.caveat).toBe(SELF_CHECK_CAVEAT);
      expect(c.caveat).toMatch(/never at any individual/i);
      expect(c.caveat).toMatch(/not a verdict and not a grade/i);
    }
  });

  it("produces no score, grade or RAG rating anywhere", () => {
    const c = buildInstitutionalSelfCheck({ escalation: escalation(), repair: repair(), voice: voice() });
    const blob = JSON.stringify(c).toLowerCase();
    for (const forbidden of ['"score"', '"grade"', '"rating"', '"rag"', "outstanding", "inadequate"]) {
      expect(blob).not.toContain(forbidden);
    }
  });

  it("gives every finding a question to start, not an answer to accept", () => {
    const c = buildInstitutionalSelfCheck({
      escalation: escalation({ findings: [{ key: "alert_fatigue_risk", tone: "prompt", headline: "h", whyShown: "w", evidenceIds: ["e"], suggestedQuestions: [] }] }),
      repair: repair({ totalIncidents: 2, incidentsWithCompleteRepair: 0, incidentsWithChildPerspective: 0 }),
      voice: voice({ detections: [{ key: "explain_back_overdue", tone: "prompt", childId: "c", loopId: "l", headline: "h", whyShown: "w", evidence: { raisedDates: [], stage: "acting", daysAtStage: 9 }, suggestedQuestions: [] }] } as Partial<VoiceFollowThroughResult>),
    });
    expect(c.findings.length).toBeGreaterThan(0);
    for (const f of c.findings) expect(f.question.trim().length).toBeGreaterThan(0);
  });
});

describe("it never lectures theory (1.13)", () => {
  it("says nothing about betrayal theory at the reader", () => {
    const c = buildInstitutionalSelfCheck({ escalation: escalation(), repair: repair(), voice: voice() });
    const blob = JSON.stringify(c).toLowerCase();
    for (const lecture of ["institutional betrayal", "theory", "freyd", "literature", "framework"]) {
      expect(blob).not.toContain(lecture);
    }
  });
});

describe("the shipped copy honours the language covenant", () => {
  it("carries no deficit, accusatory or blaming language", () => {
    const c = buildInstitutionalSelfCheck({
      escalation: escalation({ findings: [{ key: "alert_fatigue_risk", tone: "prompt", headline: "h", whyShown: "w", evidenceIds: [], suggestedQuestions: [] }] }),
      repair: repair({ totalIncidents: 5, incidentsWithCompleteRepair: 1, incidentsWithChildPerspective: 1 }),
      voice: voice({ detections: [{ key: "voice_without_response", tone: "prompt", childId: "c", loopId: "l", headline: "h", whyShown: "w", evidence: { raisedDates: [], stage: "listened", daysAtStage: 9 }, suggestedQuestions: [] }] } as Partial<VoiceFollowThroughResult>),
    });
    for (const f of c.findings) {
      expect(reviewTone(f.headline, "to_staff")).toEqual([]);
      expect(reviewTone(f.whyShown, "to_staff")).toEqual([]);
      expect(reviewTone(f.question, "to_staff")).toEqual([]);
    }
    expect(reviewTone(c.summary, "to_staff")).toEqual([]);
    expect(reviewTone(c.caveat, "to_staff")).toEqual([]);
  });
});
