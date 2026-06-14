// ══════════════════════════════════════════════════════════════════════════════
// Cara PRACTICE INTELLIGENCE — REVIEW / RESOLUTION TESTS
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { validateReview, buildFlagResolution, buildAssessmentDecision, buildThresholdDecision } from "../cara-review";
import { db } from "@/lib/db/store";

const NOW = "2026-06-07T10:00:00.000Z";

describe("validateReview", () => {
  it("rejects resolving a flag without a rationale", () => {
    expect(validateReview({ entity: "flag", id: "f1" }).ok).toBe(false);
    expect(validateReview({ entity: "flag", id: "f1", rationale: "  " }).ok).toBe(false);
  });
  it("accepts resolving a flag with a rationale", () => {
    expect(validateReview({ entity: "flag", id: "f1", rationale: "Risk addressed via safety plan." }).ok).toBe(true);
  });
  it("requires both a decision and rationale for assessment/threshold", () => {
    expect(validateReview({ entity: "assessment", id: "a1", rationale: "x" }).ok).toBe(false);
    expect(validateReview({ entity: "assessment", id: "a1", decision: "Reviewed" }).ok).toBe(false);
    expect(validateReview({ entity: "threshold", id: "t1", decision: "Threshold met", rationale: "Evidence supports escalation." }).ok).toBe(true);
  });
  it("rejects unknown entity / missing id", () => {
    expect(validateReview({ entity: "bogus" as never, id: "x" }).ok).toBe(false);
    expect(validateReview({ entity: "flag", id: "" }).ok).toBe(false);
  });
});

describe("patch builders", () => {
  it("buildFlagResolution stamps resolver + rationale + resolved", () => {
    const p = buildFlagResolution("staff_darren", "  Mitigated via supervision.  ", NOW);
    expect(p.resolved).toBe(true);
    expect(p.resolved_by).toBe("staff_darren");
    expect(p.resolution_rationale).toBe("Mitigated via supervision.");
    expect(p.resolved_at).toBe(NOW);
  });
  it("buildAssessmentDecision marks reviewed with decision + rationale + reviewer", () => {
    const p = buildAssessmentDecision("staff_darren", "Accept", "Impact now evidenced.", NOW);
    expect(p.status).toBe("reviewed");
    expect(p.manager_decision).toBe("Accept");
    expect(p.reviewer_id).toBe("staff_darren");
    expect(p.reviewed_at).toBe(NOW);
  });
  it("buildThresholdDecision records the manager decision", () => {
    const p = buildThresholdDecision("Threshold met", "Strategy discussion requested.");
    expect(p.manager_decision).toBe("Threshold met");
    expect(p.manager_rationale).toBe("Strategy discussion requested.");
  });
});

describe("store integration — flags resolve, never delete", () => {
  it("resolving a flag persists resolution + keeps the record on file", () => {
    const flag = db.caraPracticeFlags.create({
      tenant_id: null, child_id: "yp_alex", staff_id: null, home_id: "home_oak",
      source_type: "safeguarding_concern", source_id: null, flag_type: "safeguarding_threshold",
      severity: "critical", title: "test critical flag", description: "d", evidence: "e",
      recommended_action: "a", requires_manager_review: true, requires_ri_review: true,
      resolved: false, resolved_at: null,
    });
    db.caraPracticeFlags.patch(flag.id, buildFlagResolution("staff_darren", "Child made safe; plan in place.", NOW));
    const after = db.caraPracticeFlags.findById(flag.id);
    expect(after).toBeDefined(); // never deleted
    expect(after!.resolved).toBe(true);
    expect(after!.resolution_rationale).toBe("Child made safe; plan in place.");
    expect(after!.resolved_by).toBe("staff_darren");
  });
});
