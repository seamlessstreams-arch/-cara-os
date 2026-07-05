// ══════════════════════════════════════════════════════════════════════════════
// CARA — REG 44 REPORT LIFECYCLE TESTS
//
// Pins the tamper-evident lifecycle: a signed report is LOCKED and immutable;
// the only change to a locked report is a dated, named addendum that never alters
// the signed snapshot; sign-off runs the gate (blocked → needs override); and
// every action appends to the audit trail.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { createReg44Report, editReg44Report, signReg44Report, addReg44Addendum } from "../report-lifecycle";
import type { Reg44ReportDraft } from "../report-validation";

const completeDraft = (o: Partial<Reg44ReportDraft> = {}): Reg44ReportDraft => ({
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
  ...o,
});

const fresh = (draft = completeDraft()) => createReg44Report({ id: "r44_1", homeId: "home_oak", month: "2026-06", draft, createdBy: "J. Okafor", at: "2026-06-18T09:00:00Z" });

describe("draft lifecycle", () => {
  it("creates a draft, unlocked, with a created audit entry", () => {
    const r = fresh();
    expect(r.status).toBe("draft");
    expect(r.locked).toBe(false);
    expect(r.auditTrail.map((a) => a.action)).toEqual(["created"]);
  });

  it("edits a draft and audits it", () => {
    const out = editReg44Report(fresh(), { meta: { ...completeDraft().meta, visitorName: "K. Adeyemi" } }, { by: "K. Adeyemi", at: "2026-06-18T10:00:00Z" });
    expect(out.ok).toBe(true);
    expect(out.report!.draft.meta.visitorName).toBe("K. Adeyemi");
    expect(out.report!.auditTrail.some((a) => a.action === "edited")).toBe(true);
  });
});

describe("sign-off locks the report", () => {
  it("signs a complete report → locked, snapshot frozen, audit 'signed'", () => {
    const out = signReg44Report(fresh(), { decision: "approved", decidedBy: "R. Okafor (IRO)", at: "2026-06-19T09:00:00Z" });
    expect(out.ok).toBe(true);
    expect(out.report!.status).toBe("signed");
    expect(out.report!.locked).toBe(true);
    expect(out.report!.signedSnapshot).not.toBeNull();
    expect(out.report!.auditTrail.some((a) => a.action === "signed")).toBe(true);
  });

  it("refuses to sign a blocked report without an override (gate), and does NOT lock", () => {
    const blocked = fresh(completeDraft({ conflictOfInterestCompleted: false }));
    const out = signReg44Report(blocked, { decision: "approved", decidedBy: "R. Okafor", at: "2026-06-19T09:00:00Z" });
    expect(out.ok).toBe(false);
    expect(out.report!.locked).toBe(false);
    expect(out.report!.auditTrail.some((a) => a.action === "validated")).toBe(true);
  });

  it("signs a blocked report WITH a named override", () => {
    const blocked = fresh(completeDraft({ conflictOfInterestCompleted: false }));
    const out = signReg44Report(blocked, { decision: "approved_with_actions", decidedBy: "R. Okafor", overrideReason: "COI to follow in 24h", at: "2026-06-19T09:00:00Z" });
    expect(out.ok).toBe(true);
    expect(out.report!.locked).toBe(true);
    expect(out.report!.auditTrail.find((a) => a.action === "signed")!.detail).toMatch(/override/i);
  });

  it("'returned for amendment' does NOT lock the report", () => {
    const out = signReg44Report(fresh(), { decision: "returned_for_amendment", decidedBy: "R. Okafor", at: "2026-06-19T09:00:00Z" });
    expect(out.ok).toBe(true);
    expect(out.report!.locked).toBe(false);
    expect(out.report!.status).toBe("draft");
  });
});

describe("a locked report is immutable except by addendum", () => {
  const signed = () => signReg44Report(fresh(), { decision: "approved", decidedBy: "R. Okafor", at: "2026-06-19T09:00:00Z" }).report!;

  it("refuses a direct edit and records the attempt", () => {
    const out = editReg44Report(signed(), { meta: { ...completeDraft().meta, visitorName: "X" } }, { by: "someone", at: "2026-06-20T09:00:00Z" });
    expect(out.ok).toBe(false);
    expect(out.refusedReason).toMatch(/signed and locked/i);
    expect(out.report!.auditTrail.some((a) => a.action === "edit_refused")).toBe(true);
    // the signed content is untouched
    expect(out.report!.draft.meta.visitorName).toBe("J. Okafor");
  });

  it("allows a dated, named addendum without altering the signed snapshot", () => {
    const before = signed();
    const out = addReg44Addendum(before, { id: "add_1", text: "Correction: the gas cert was in fact in date.", author: "R. Okafor", at: "2026-06-21T09:00:00Z" });
    expect(out.ok).toBe(true);
    expect(out.report!.status).toBe("amended");
    expect(out.report!.addenda).toHaveLength(1);
    expect(out.report!.signedSnapshot).toEqual(before.signedSnapshot); // unchanged
    expect(out.report!.auditTrail.some((a) => a.action === "addendum")).toBe(true);
  });

  it("refuses an addendum on an unsigned draft", () => {
    const out = addReg44Addendum(fresh(), { id: "a", text: "x", author: "y", at: "2026-06-20T09:00:00Z" });
    expect(out.ok).toBe(false);
  });
});

describe("audit trail is append-only", () => {
  it("grows with each action and never rewrites earlier entries", () => {
    const r0 = fresh();
    const r1 = editReg44Report(r0, { methodology: { ...completeDraft().methodology } }, { by: "a", at: "t1" }).report!;
    const r2 = signReg44Report(r1, { decision: "approved", decidedBy: "R. Okafor", at: "t2" }).report!;
    const r3 = addReg44Addendum(r2, { id: "a1", text: "note", author: "R. Okafor", at: "t3" }).report!;
    expect(r3.auditTrail.length).toBeGreaterThanOrEqual(4);
    expect(r3.auditTrail[0].action).toBe("created"); // first entry preserved
  });
});
