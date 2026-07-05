// ══════════════════════════════════════════════════════════════════════════════
// CARA — REG 44 REPORT EXPORT TESTS
//
// Pins: the export model carries the A–Q sections + sign-off + addenda; the HTML
// renders every section heading, the home header and the sign-off, and escapes
// content; the Reg 45 extract is explicitly evidence-only; and the .docx renders
// to a non-empty Word binary.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { buildReg44ExportModel, renderReg44Html, renderReg44Json, renderReg45ExtractHtml } from "../report-export";
import { renderReg44Docx } from "../report-docx";
import { assembleReg44ReportDraft } from "../report-assembly";
import { assessReg44QualityStandards } from "../qs-assessment-engine";
import type { Reg44AssessmentInput } from "../types";
import type { PersistedReg44Report } from "../report-lifecycle";

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

const signed: PersistedReg44Report = {
  id: "rep1", homeId: "home_oak", month: "2026-06", status: "signed", locked: true,
  draft: { meta: { visitDate: "2026-06-18", visitorName: "J. Okafor", visitorIndependent: true } } as never,
  signedSnapshot: null, addenda: [{ id: "a1", at: "2026-06-21", author: "R. Okafor", text: "Gas cert was in date." }],
  auditTrail: [], createdAt: "2026-06-18", updatedAt: "2026-06-21",
};
// give the signed draft a real signOff for the model
(signed.draft as unknown as { signOff: unknown }).signOff = { signedBy: "R. Okafor", signedAt: "2026-06-19", decision: "approved", overrideReason: null };

describe("export model + HTML", () => {
  const model = buildReg44ExportModel(assembly(), { homeName: "Oak House", ofstedUrn: "SC123456", generatedAt: "2026-07-05T10:00:00Z", persisted: signed });

  it("carries the A–Q sections, header, sign-off and addenda", () => {
    expect(model.sections.map((s) => s.key)).toContain("K");
    expect(model.header.ofstedUrn).toBe("SC123456");
    expect(model.signOff.signed).toBe(true);
    expect(model.signOff.signedBy).toBe("R. Okafor");
    expect(model.addenda).toHaveLength(1);
  });

  it("renders HTML with the title, home header, every section heading and the sign-off", () => {
    const html = renderReg44Html(model);
    expect(html).toMatch(/Regulation 44 Independent Visitor/);
    expect(html).toMatch(/Oak House/);
    expect(html).toMatch(/URN SC123456/);
    expect(html).toMatch(/A\. Executive summary/);
    expect(html).toMatch(/K\. Independent visitor's statutory opinion/);
    expect(html).toMatch(/Signed off:/);
    expect(html).toMatch(/A\.M\./); // child voice by initials, preserved
  });

  it("escapes HTML in content (no injection)", () => {
    const a = assembly();
    a.sections[0].content = "<script>bad()</script> & stuff";
    const html = renderReg44Html(buildReg44ExportModel(a, { homeName: "Oak House", generatedAt: "t" }));
    expect(html).not.toMatch(/<script>bad/);
    expect(html).toMatch(/&lt;script&gt;/);
  });

  it("renders a JSON payload with a schema tag", () => {
    const json = JSON.parse(renderReg44Json(model));
    expect(json.schema).toBe("reg44-report");
    expect(Array.isArray(json.sections)).toBe(true);
  });
});

describe("Reg 45 evidence extract", () => {
  it("is explicitly evidence-only and not the review", () => {
    const model = buildReg44ExportModel(assembly(), { homeName: "Oak House", generatedAt: "t" });
    expect(model.reg45Extract).toMatch(/does not constitute the Regulation 45 review/i);
    expect(renderReg45ExtractHtml(model)).toMatch(/not the Regulation 45 review/i);
  });
});

describe("docx binary", () => {
  it("renders a non-empty Word document", async () => {
    const model = buildReg44ExportModel(assembly(), { homeName: "Oak House", generatedAt: "t", persisted: signed });
    const buf = await renderReg44Docx(model);
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.length).toBeGreaterThan(1000); // a real .docx zip
    expect(buf.slice(0, 2).toString("latin1")).toBe("PK"); // zip magic → valid Office Open XML
  });
});
