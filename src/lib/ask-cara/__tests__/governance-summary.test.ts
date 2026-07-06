// ══════════════════════════════════════════════════════════════════════════════
// CARA — Governance summary tests (§24)
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { buildGovernanceSummary } from "../governance-summary";
import type { AskCaraAuditEvent } from "../audit-logger";
import type { ExternalAiDeclaration } from "../external-ai-declaration";

const evt = (o: Partial<AskCaraAuditEvent>): AskCaraAuditEvent => ({
  id: "e", mode: "ask", intent: "attention", managerReviewRequired: false, externalAiDeclared: false,
  prohibitedTriggered: false, deterministicOnly: true, createdAt: "2026-07-06T10:00:00Z", version: "1.0.0", ...o,
});
const decl = (o: Partial<ExternalAiDeclaration>): ExternalAiDeclaration => ({
  id: "d", declarationType: "yes", managerReviewStatus: "pending", createdAt: "2026-07-06T10:00:00Z", version: "1.0.0", ...o,
});

describe("buildGovernanceSummary", () => {
  it("counts usage by intent, most-common first", () => {
    const g = buildGovernanceSummary(
      [evt({ intent: "attention" }), evt({ intent: "attention" }), evt({ intent: "reflector" })],
      []
    );
    expect(g.usage.total).toBe(3);
    expect(g.usage.byIntent[0]).toEqual({ intent: "attention", count: 2 });
  });

  it("reports deterministic-only compliance (100% when all deterministic)", () => {
    const g = buildGovernanceSummary([evt({}), evt({})], []);
    expect(g.deterministic.compliancePct).toBe(100);
    expect(g.costAvoidance.externalCallsAvoided).toBe(2);
    expect(g.costAvoidance.estimatedCreditsSavedGbp).toBeGreaterThan(0);
  });

  it("counts prohibited attempts and manager-review flags", () => {
    const g = buildGovernanceSummary([evt({ prohibitedTriggered: true, managerReviewRequired: true }), evt({})], []);
    expect(g.safety.prohibitedAttempts).toBe(1);
    expect(g.safety.managerReviewRequired).toBe(1);
  });

  it("summarises declarations and pending review", () => {
    const g = buildGovernanceSummary([], [decl({ managerReviewStatus: "pending", confidentialDataEntered: true }), decl({ managerReviewStatus: "reviewed" })]);
    expect(g.declarations.total).toBe(2);
    expect(g.declarations.pendingReview).toBe(1);
    expect(g.declarations.confidentialDataEntered).toBe(1);
  });

  it("is safe on empty input (100% compliant, nothing to review)", () => {
    const g = buildGovernanceSummary([], []);
    expect(g.usage.total).toBe(0);
    expect(g.deterministic.compliancePct).toBe(100);
    expect(g.declarations.pendingReview).toBe(0);
  });
});
