// ══════════════════════════════════════════════════════════════════════════════
// CARA — REG 44 REPORT PERSISTENCE TESTS
//
// Pins what the durable report carries beyond the gate draft: the rendered
// A–Q sections travel with the report, a visitor can edit their narrative
// while it is unsigned, signing FREEZES those sections, a locked report refuses
// section edits (and audits the refusal), and an export of a signed report
// renders the frozen sections rather than a fresh assembly.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { createReg44Report, signReg44Report, editReg44Sections } from "../report-lifecycle";
import { buildReg44ExportModel } from "../report-export";
import { assembleReg44ReportDraft } from "../report-assembly";
import { assessReg44QualityStandards } from "../qs-assessment-engine";
import type { Reg44AssessmentInput } from "../types";
import type { Reg44ReportDraft } from "../report-validation";

const qsInput: Reg44AssessmentInput = {
  homeId: "home_oak", month: "2026-06", asOf: "2026-07-05",
  headline: { children_in_residence: 3, incidents: 2, incidents_critical: 0, missing_episodes: 0, missing_high_risk: 0, restraints: 1, restraints_with_injuries: 0, complaints: 0, complaints_unresolved: 0, safeguarding_events: 0, reg40_notifications: 0, keywork_sessions: 4, last_visit_recommendations_outstanding: 1 },
  restraints: [{ id: "r", childDebriefed: true, hasDebriefRecord: true }],
  missingEpisodes: [], keywork: [{ id: "kw", childVoice: "happy" }], childVoice: [{ id: "v", category: "food", sentiment: "happy" }],
  complaints: [], educationRecords: 0, healthRecords: 0, achievementRecords: 0, carePlanRecords: 0, childrenSpokenTo: 2,
};

const assembly = () =>
  assembleReg44ReportDraft({
    homeId: "home_oak", homeName: "Oak House", month: "2026-06", asOf: "2026-07-05",
    qs: assessReg44QualityStandards(qsInput), headline: qsInput.headline,
    childVoiceEntries: [{ ref: "A.M.", summary: "Feels settled." }], previousRecommendations: [], reg45EvidenceCount: 4,
  });

const completeDraft = (): Reg44ReportDraft => ({
  homeId: "home_oak", month: "2026-06",
  meta: { visitDate: "2026-06-18", visitorName: "J. Okafor", visitorIndependent: true },
  independence: { confirmed: true, conflictsDeclared: false },
  methodology: { peopleSpokenTo: ["2 children"], areasObserved: ["communal"], recordsExamined: ["daily logs"], childrenOnRoll: 3, childrenPresent: 3, childrenSpokenTo: 2 },
  childrenVoice: { captured: true, blankReason: "", entries: [{ ref: "A.M.", summary: "Settled." }] },
  qualityStandardsAssessed: 9,
  opinions: { safeguarding: { stated: true, hasEvidence: true }, wellbeing: { stated: true, hasEvidence: true } },
  recommendations: [{ id: "r1", text: "Audit PI records.", timescale: "by 2026-07-15", owner: "RM" }],
  previousRecommendationsReviewed: true,
  conflictOfInterestCompleted: true,
  distribution: { completed: true, recipients: ["Ofsted"] },
  reg45EvidenceExtractOnly: true,
  outputContainsChildNames: false,
  signOff: { signedBy: null, signedAt: null, decision: null, overrideReason: null },
});

const fresh = () => {
  const a = assembly();
  return createReg44Report({ id: "r44_p1", homeId: "home_oak", month: "2026-06", draft: completeDraft(), sections: a.sections, engineVersion: "test", createdBy: "J. Okafor", at: "2026-06-18T09:00:00Z" });
};

describe("sections travel with the persisted report", () => {
  it("a new report carries the assembled A–Q sections and the engine version", () => {
    const r = fresh();
    expect(r.sections?.length).toBeGreaterThan(10);
    expect(r.sections?.some((s) => s.key === "A")).toBe(true);
    expect(r.engineVersion).toBe("test");
    expect(r.signedSections ?? null).toBeNull();
  });

  it("an unsigned report accepts a section edit and audits which keys changed", () => {
    const out = editReg44Sections(fresh(), [{ key: "A", content: "Visitor's own account of section A." }], { by: "J. Okafor", at: "2026-06-18T10:00:00Z" });
    expect(out.ok).toBe(true);
    const a = out.report!.sections!.find((s) => s.key === "A")!;
    expect(a.content).toBe("Visitor's own account of section A.");
    expect(a.visitorMustComplete).toBe(false);
    const last = out.report!.auditTrail.at(-1)!;
    expect(last.action).toBe("edited");
    expect(last.detail).toContain("A");
  });

  it("unknown section keys are ignored rather than invented", () => {
    const before = fresh();
    const out = editReg44Sections(before, [{ key: "ZZ", content: "nope" }], { by: "J. Okafor", at: "t" });
    expect(out.ok).toBe(true);
    expect(out.report!.sections!.length).toBe(before.sections!.length);
    expect(out.report!.sections!.some((s) => s.key === "ZZ")).toBe(false);
  });
});

describe("signing freezes the sections", () => {
  const signedReport = () => {
    const edited = editReg44Sections(fresh(), [{ key: "A", content: "Frozen text." }], { by: "J. Okafor", at: "2026-06-18T10:00:00Z" }).report!;
    return signReg44Report(edited, { decision: "approved", decidedBy: "R. Okafor (IRO)", at: "2026-06-19T09:00:00Z" }).report!;
  };

  it("a signed report has signedSections equal to the sections at signing", () => {
    const s = signedReport();
    expect(s.locked).toBe(true);
    expect(s.signedSections).not.toBeNull();
    expect(s.signedSections!.find((x) => x.key === "A")!.content).toBe("Frozen text.");
  });

  it("a locked report refuses section edits and audits the refusal", () => {
    const s = signedReport();
    const out = editReg44Sections(s, [{ key: "A", content: "Changed after signing." }], { by: "Someone", at: "2026-06-20T09:00:00Z" });
    expect(out.ok).toBe(false);
    expect(out.report!.signedSections!.find((x) => x.key === "A")!.content).toBe("Frozen text.");
    expect(out.report!.sections!.find((x) => x.key === "A")!.content).toBe("Frozen text.");
    expect(out.report!.auditTrail.at(-1)!.action).toBe("edit_refused");
  });

  it("the export of a signed report renders the frozen sections, not a fresh assembly", () => {
    const s = signedReport();
    const model = buildReg44ExportModel(assembly(), { homeName: "Oak House", generatedAt: "t", persisted: s });
    expect(model.sections.find((x) => x.key === "A")!.content).toBe("Frozen text.");
  });

  it("the export of an unsigned report renders its working sections", () => {
    const edited = editReg44Sections(fresh(), [{ key: "A", content: "Working text." }], { by: "J. Okafor", at: "t" }).report!;
    const model = buildReg44ExportModel(assembly(), { homeName: "Oak House", generatedAt: "t", persisted: edited });
    expect(model.sections.find((x) => x.key === "A")!.content).toBe("Working text.");
  });

  it("a persisted report with no stored sections falls back to the assembly", () => {
    const bare = createReg44Report({ id: "r44_p2", homeId: "home_oak", month: "2026-06", draft: completeDraft(), createdBy: "J. Okafor", at: "t" });
    const model = buildReg44ExportModel(assembly(), { homeName: "Oak House", generatedAt: "t", persisted: bare });
    expect(model.sections.length).toBe(assembly().sections.length);
  });
});
