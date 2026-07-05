// ══════════════════════════════════════════════════════════════════════════════
// CARA — REG 44 REPORT VALIDATION & SIGN-OFF GATE TESTS
//
// Pins the statutory hard-blocks and the hard-block-with-override sign-off: a
// complete report submits; each missing critical requirement blocks; a blocked
// report cannot be approved without a NAMED person recording an override reason;
// returning/escalating is always allowed.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { validateReg44Report, applySignOffDecision, type Reg44ReportDraft } from "../report-validation";

const complete = (o: Partial<Reg44ReportDraft> = {}): Reg44ReportDraft => ({
  homeId: "home_oak",
  month: "2026-06",
  meta: { visitDate: "2026-06-18", visitorName: "J. Okafor", visitorIndependent: true, visitNumber: 7, announced: false, ofstedUrn: "SC123456" },
  independence: { confirmed: true, conflictsDeclared: false },
  methodology: {
    peopleSpokenTo: ["2 children", "RM", "2 staff"],
    areasObserved: ["communal areas", "bedrooms (with consent)"],
    recordsExamined: ["daily logs", "incident records", "medication records"],
    childrenOnRoll: 3,
    childrenPresent: 3,
    childrenSpokenTo: 2,
  },
  childrenVoice: { captured: true, blankReason: "", entries: [{ ref: "A.M.", summary: "Feels settled; wants more cooking." }] },
  qualityStandardsAssessed: 9,
  opinions: { safeguarding: { stated: true, hasEvidence: true }, wellbeing: { stated: true, hasEvidence: true } },
  recommendations: [{ id: "r1", text: "Audit PI records for June.", timescale: "by 2026-07-15", owner: "RM" }],
  previousRecommendationsReviewed: true,
  conflictOfInterestCompleted: true,
  distribution: { completed: true, recipients: ["Ofsted", "Placing authority", "RI"] },
  reg45EvidenceExtractOnly: true,
  outputContainsChildNames: false,
  signOff: { signedBy: null, signedAt: null, decision: null, overrideReason: null },
  ...o,
});

describe("a complete report passes", () => {
  it("has no blocks and can submit", () => {
    const v = validateReg44Report(complete());
    expect(v.blocks).toEqual([]);
    expect(v.canSubmit).toBe(true);
  });
});

describe("statutory hard-blocks", () => {
  const cases: Array<[string, Partial<Reg44ReportDraft>, string]> = [
    ["visit date", { meta: { ...complete().meta, visitDate: "" } }, "visit_date_missing"],
    ["visitor name", { meta: { ...complete().meta, visitorName: "" } }, "visitor_missing"],
    ["independence", { independence: { confirmed: false, conflictsDeclared: false } }, "independence_missing"],
    ["child voice blank", { childrenVoice: { captured: false, blankReason: "", entries: [] } }, "child_voice_blank"],
    ["methodology", { methodology: { ...complete().methodology, peopleSpokenTo: [], areasObserved: [] } }, "methodology_missing"],
    ["records examined", { methodology: { ...complete().methodology, recordsExamined: [] } }, "records_missing"],
    ["opinion missing", { opinions: { safeguarding: { stated: false, hasEvidence: false }, wellbeing: { stated: true, hasEvidence: true } } }, "opinion_missing"],
    ["opinion unsupported", { opinions: { safeguarding: { stated: true, hasEvidence: false }, wellbeing: { stated: true, hasEvidence: true } } }, "safeguarding_opinion_unsupported"],
    ["QS incomplete", { qualityStandardsAssessed: 6 }, "quality_standards_incomplete"],
    ["rec no timescale", { recommendations: [{ id: "r", text: "Improve records", timescale: "", owner: "" }] }, "recommendation_no_timescale"],
    ["conflict of interest", { conflictOfInterestCompleted: false }, "conflict_of_interest_missing"],
    ["distribution", { distribution: { completed: false, recipients: [] } }, "distribution_missing"],
    ["child names in output", { outputContainsChildNames: true }, "child_names_in_output"],
    ["reg45 as review", { reg45EvidenceExtractOnly: false }, "reg45_as_review"],
  ];
  for (const [name, patch, id] of cases) {
    it(`blocks when ${name} is missing/wrong`, () => {
      const v = validateReg44Report(complete(patch));
      expect(v.blocks.map((b) => b.id)).toContain(id);
      expect(v.canSubmit).toBe(false);
    });
  }
});

describe("sign-off gate — hard block with named override", () => {
  it("refuses to approve a blocked report without an override reason", () => {
    const draft = complete({ conflictOfInterestCompleted: false });
    const r = applySignOffDecision(draft, { decision: "approved", decidedBy: "R. Okafor (IRO)", decidedAt: "2026-06-19T10:00:00Z" });
    expect(r.ok).toBe(false);
    expect(r.refusedReason).toMatch(/unresolved block/i);
  });

  it("allows approval of a blocked report WITH a named override reason", () => {
    const draft = complete({ conflictOfInterestCompleted: false });
    const r = applySignOffDecision(draft, { decision: "approved_with_actions", decidedBy: "R. Okafor (IRO)", decidedAt: "2026-06-19T10:00:00Z", overrideReason: "COI form to follow within 24h; agreed with RI." });
    expect(r.ok).toBe(true);
    expect(r.draft!.signOff.overrideReason).toMatch(/COI form/);
    expect(r.draft!.signOff.decision).toBe("approved_with_actions");
  });

  it("always allows returning a report for amendment (no assertion of completeness)", () => {
    const draft = complete({ conflictOfInterestCompleted: false });
    const r = applySignOffDecision(draft, { decision: "returned_for_amendment", decidedBy: "R. Okafor", decidedAt: "2026-06-19T10:00:00Z" });
    expect(r.ok).toBe(true);
  });

  it("refuses sign-off without a named decision-maker", () => {
    const r = applySignOffDecision(complete(), { decision: "approved", decidedBy: "", decidedAt: "2026-06-19T10:00:00Z" });
    expect(r.ok).toBe(false);
    expect(r.refusedReason).toMatch(/named decision-maker/i);
  });

  it("signs off a complete report cleanly", () => {
    const r = applySignOffDecision(complete(), { decision: "approved", decidedBy: "R. Okafor", decidedAt: "2026-06-19T10:00:00Z" });
    expect(r.ok).toBe(true);
    expect(r.draft!.signOff.signedBy).toBe("R. Okafor");
  });
});
