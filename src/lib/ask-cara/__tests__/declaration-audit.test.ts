// ══════════════════════════════════════════════════════════════════════════════
// CARA — Declaration flow + audit trail tests (§20/§21)
//
// Pins: declaration review-routing (yes/not-sure → pending + safer route); the
// supportive acknowledgement; manager review; audit event HASHES text and stores
// NO raw content; prohibited flag; deterministic-only.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { buildDeclaration, reviewDeclaration, declarationAcknowledgement } from "../external-ai-declaration";
import { buildAuditEvent, hashText } from "../audit-logger";

const META = { id: "d1", createdAt: "2026-07-06T10:00:00.000Z" };

describe("external-AI declaration", () => {
  it("flags a 'yes' declaration for review and offers the safer route", () => {
    const d = buildDeclaration({ declarationType: "yes", declaredTaskType: "make this incident report sound professional" }, META);
    expect(d.managerReviewStatus).toBe("pending");
    expect(d.saferCaraRoute?.routes[0].engine).toBe("RECORD_IMPROVEMENT");
  });
  it("routes 'not_sure' to review too", () => {
    expect(buildDeclaration({ declarationType: "not_sure" }, META).managerReviewStatus).toBe("pending");
  });
  it("does not require review for 'no' or spelling-only", () => {
    expect(buildDeclaration({ declarationType: "no" }, META).managerReviewStatus).toBe("not_required");
    expect(buildDeclaration({ declarationType: "spelling_grammar_only" }, META).managerReviewStatus).toBe("not_required");
  });
  it("acknowledgement is supportive, never punitive", () => {
    const d = buildDeclaration({ declarationType: "yes", declaredTaskType: "x" }, META);
    expect(declarationAcknowledgement(d)).toMatch(/thank you|integrity/i);
  });
  it("records a manager review", () => {
    const d = buildDeclaration({ declarationType: "yes", declaredTaskType: "x" }, META);
    const reviewed = reviewDeclaration(d, { reviewedBy: "RM", outcome: "guidance_given", reviewedAt: "2026-07-06T12:00:00.000Z" });
    expect(reviewed.managerReviewStatus).toBe("reviewed");
    expect(reviewed.reviewOutcome).toBe("guidance_given");
    expect(reviewed.managerReviewedBy).toBe("RM");
  });
});

describe("audit trail", () => {
  it("hashes text deterministically and returns undefined for empty", () => {
    expect(hashText("hello")).toBe(hashText("hello"));
    expect(hashText("hello")).toMatch(/^sha256:/);
    expect(hashText(undefined)).toBeUndefined();
  });
  it("stores hashes, NOT raw text", () => {
    const e = buildAuditEvent({ mode: "ask", intent: "attention", inputText: "Alex went missing", outputText: "2 restraints...", deterministicOnly: true }, META);
    const json = JSON.stringify(e);
    expect(json).not.toContain("Alex went missing");
    expect(json).not.toContain("2 restraints");
    expect(e.inputHash).toMatch(/^sha256:/);
    expect(e.outputHash).toMatch(/^sha256:/);
    // No raw-text keys leak onto the event.
    expect((e as Record<string, unknown>).inputText).toBeUndefined();
    expect((e as Record<string, unknown>).outputText).toBeUndefined();
  });
  it("carries the prohibited + deterministic flags", () => {
    const e = buildAuditEvent({ mode: "ask", intent: "prohibited", prohibitedTriggered: true, managerReviewRequired: true, deterministicOnly: true }, META);
    expect(e.prohibitedTriggered).toBe(true);
    expect(e.managerReviewRequired).toBe(true);
    expect(e.deterministicOnly).toBe(true);
  });
});
