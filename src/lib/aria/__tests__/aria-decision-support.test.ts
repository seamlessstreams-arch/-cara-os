// ══════════════════════════════════════════════════════════════════════════════
// ARIA Decision Support engine tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db/store";
import {
  runDecisionSupport,
  loadDecisionSupport,
} from "@/lib/aria/aria-decision-support";

const HOME_ID = "home_oak";
const CHILD_ID = "yp_alex";

function todayMinus(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function seedRepeatMissingPattern() {
  return db.ariaSafeguardingPatterns.create({
    home_id: HOME_ID,
    child_id: CHILD_ID,
    pattern_type: "repeat_missing",
    title: "2 missing episodes — yp_alex",
    description: "test pattern",
    severity: "critical",
    window_start: todayMinus(30),
    window_end: todayMinus(0),
    evidence_refs: [],
    reflective_prompt: "test prompt",
    status: "open",
    acknowledged_by: null,
    acknowledged_at: null,
    resolution_note: null,
    is_ai_draft: true,
    detected_at: new Date().toISOString(),
  });
}

function seedRiskAssessment() {
  return db.riskAssessments.create({
    child_id: CHILD_ID,
    domain: "absconding",
    current_level: "high",
    previous_level: "medium",
    trend: "increasing",
    status: "current",
    assessed_by: "u1",
    assessed_date: todayMinus(10),
    review_date: todayMinus(-30),
    triggers: ["peer pressure", "phone contact"],
    indicators: ["missing twice"],
    mitigations: [
      { strategy: "Trusted adult check-in", responsible: "key worker", effectiveness: "effective" },
    ],
    contingency_plan: "police involvement",
    child_views: "",
    history_notes: "",
    linked_incidents: [],
    home_id: HOME_ID,
  });
}

describe("runDecisionSupport", () => {
  beforeEach(() => {
    // Wipe prior decision-support state
    for (const f of db.ariaFormulations.findAll(HOME_ID)) {
      if (f.status !== "rejected") {
        db.ariaFormulations.patch(f.id, { status: "rejected" });
      }
    }
    for (const r of db.ariaDecisionRecommendations.findOpen(HOME_ID)) {
      db.ariaDecisionRecommendations.patch(r.id, { status: "rejected" });
    }
  });

  it("produces an empty snapshot when there is nothing to formulate", () => {
    const snap = runDecisionSupport("home_with_no_signals_xyz");
    expect(snap.formulations).toHaveLength(0);
    expect(snap.recommendations).toHaveLength(0);
    expect(snap.summary.recommendations).toBe(0);
  });

  it("drafts a formulation and at least one P1/P2 recommendation when a critical pattern exists", () => {
    seedRepeatMissingPattern();
    seedRiskAssessment();

    const snap = runDecisionSupport(HOME_ID);
    expect(snap.formulations.length).toBeGreaterThan(0);
    const f = snap.formulations.find((x) => x.child_id === CHILD_ID);
    expect(f).toBeDefined();
    expect(f!.is_ai_draft).toBe(true);
    expect(f!.factors.some((x) => x.factor_type === "perpetuating")).toBe(true);
    expect(f!.factors.some((x) => x.factor_type === "protective")).toBe(true);

    const reg40 = snap.recommendations.find((r) => r.action === "trigger_reg40_notification");
    expect(reg40).toBeDefined();
    expect(["p1", "p2"]).toContain(reg40!.priority);
    expect(reg40!.confidence).toBeGreaterThan(0.5);
  });

  it("is idempotent: rerunning supersedes the prior formulation and patches the prior recommendation", () => {
    seedRepeatMissingPattern();
    const a = runDecisionSupport(HOME_ID);
    const b = runDecisionSupport(HOME_ID);
    const aRec = a.recommendations.find((r) => r.action === "trigger_reg40_notification");
    const bRec = b.recommendations.find((r) => r.action === "trigger_reg40_notification");
    expect(aRec?.id).toBe(bRec?.id);

    // Only one active formulation per child for this run
    const active = db.ariaFormulations
      .findByChild(HOME_ID, CHILD_ID)
      .filter((f) => f.status === "ai_draft");
    expect(active.length).toBe(1);
  });

  it("loadDecisionSupport returns persisted formulations + open recommendations", () => {
    seedRepeatMissingPattern();
    runDecisionSupport(HOME_ID);
    const loaded = loadDecisionSupport(HOME_ID);
    expect(loaded.formulations.length).toBeGreaterThan(0);
    expect(loaded.recommendations.length).toBeGreaterThan(0);
  });

  it("scoping to a child filters formulations and recommendations", () => {
    seedRepeatMissingPattern();
    const snap = runDecisionSupport(HOME_ID, { childId: CHILD_ID });
    expect(snap.formulations.every((f) => f.child_id === CHILD_ID)).toBe(true);
    expect(
      snap.recommendations.every((r) => r.child_id === null || r.child_id === CHILD_ID),
    ).toBe(true);
  });
});
