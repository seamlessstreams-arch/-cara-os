// ══════════════════════════════════════════════════════════════════════════════
// ARIA PRACTICE INTELLIGENCE — DASHBOARD AGGREGATOR TESTS
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { buildPracticeDashboard, type PracticeDashboardInput } from "../aria-dashboard";
import type { AriaPracticeFlag, AriaStaffWellbeingSignal, AriaThresholdConsultation, AriaSeverity, AriaFlagType } from "../types";

let n = 0;
function flag(flag_type: AriaFlagType, over: Partial<AriaPracticeFlag> = {}): AriaPracticeFlag {
  return {
    id: `f_${++n}`, tenant_id: null, child_id: "yp_alex", staff_id: null, home_id: "home_oak",
    source_type: "daily_record", source_id: null, flag_type, severity: "medium" as AriaSeverity,
    title: `${flag_type} flag`, description: "d", evidence: "", recommended_action: "a",
    requires_manager_review: false, requires_ri_review: false, resolved: false, created_at: "2026-06-07", resolved_at: null,
    ...over,
  };
}

function emptyInput(over: Partial<PracticeDashboardInput> = {}): PracticeDashboardInput {
  return {
    flags: [], thresholdConsultations: [], wellbeingSignals: [], developmentalGaps: [],
    protectiveFactorReviews: [], relationshipDepthReviews: [], assessments: [],
    canSeeWellbeing: true, viewerStaffId: null, ...over,
  };
}

describe("buildPracticeDashboard", () => {
  it("summarises open flags + review queues", () => {
    const d = buildPracticeDashboard(emptyInput({
      flags: [
        flag("safeguarding_threshold", { severity: "critical", requires_manager_review: true, requires_ri_review: true }),
        flag("vague_recording"),
        flag("activity_over_impact", { resolved: true }), // resolved excluded
      ],
    }));
    expect(d.summary.openFlags).toBe(2);
    expect(d.summary.criticalFlags).toBe(1);
    expect(d.summary.managerReviewQueue).toBe(1);
    expect(d.summary.riReviewQueue).toBe(1);
  });

  it("builds the developmental gap heatmap from flag evidence", () => {
    const d = buildPracticeDashboard(emptyInput({
      flags: [flag("developmental_gap", { child_id: "yp_casey", evidence: "stability; belonging; emotional security" })],
    }));
    expect(d.developmentalGapHeatmap.byDomain.stability).toBe(1);
    expect(d.developmentalGapHeatmap.byDomain.belonging).toBe(1);
    expect(d.developmentalGapHeatmap.byChild.yp_casey["emotional security"]).toBe(1);
  });

  it("collects practice-drift warnings and protective-factor weaknesses", () => {
    const d = buildPracticeDashboard(emptyInput({
      flags: [flag("activity_over_impact"), flag("vague_recording"), flag("overstated_protective_factor", { severity: "medium" })],
    }));
    expect(d.practiceDriftWarnings.length).toBe(2);
    expect(d.protectiveFactorWeaknesses.length).toBe(1);
  });

  it("includes open threshold consultations in the watchlist", () => {
    const consult: AriaThresholdConsultation = {
      id: "atc_1", tenant_id: null, child_id: "yp_alex", concern_type: "safeguarding", source_type: null, source_id: null,
      child_lived_experience: "", evidence_and_harm_analysis: "", family_functioning_parental_capacity: "",
      threshold_and_escalation_analysis: "", decision_rationale: "", recommended_next_step: "",
      reasonable_cause_to_suspect_significant_harm: null, strategy_discussion_recommended: true,
      lado_consultation_recommended: false, emergency_action_recommended: true, aria_summary: "concern",
      manager_decision: null, manager_rationale: null, created_by: "u", created_at: "2026-06-07",
    };
    const d = buildPracticeDashboard(emptyInput({ thresholdConsultations: [consult] }));
    const item = d.thresholdWatchlist.find((w) => w.id === "atc_1")!;
    expect(item).toBeDefined();
    expect(item.severity).toBe("critical");
    expect(item.strategyDiscussion).toBe(true);
  });

  it("restricts wellbeing signals by role", () => {
    const w: AriaStaffWellbeingSignal = {
      id: "aws_1", tenant_id: null, staff_id: "staff_ryan", home_id: "home_oak", signal_type: "burnout",
      signal_source: "supervision", severity: "medium", evidence: "drained", support_recommendation: "supervision",
      manager_action: null, resolved: false, created_at: "2026-06-07",
    };
    const hidden = buildPracticeDashboard(emptyInput({ wellbeingSignals: [w], canSeeWellbeing: false, viewerStaffId: "staff_anna" }));
    expect(hidden.staffWellbeingSignals.length).toBe(0); // not own, no permission
    const own = buildPracticeDashboard(emptyInput({ wellbeingSignals: [w], canSeeWellbeing: false, viewerStaffId: "staff_ryan" }));
    expect(own.staffWellbeingSignals.length).toBe(1); // own signal visible
    const mgr = buildPracticeDashboard(emptyInput({ wellbeingSignals: [w], canSeeWellbeing: true }));
    expect(mgr.staffWellbeingSignals.length).toBe(1); // permitted
  });

  it("derives culture-radar indicators from flag patterns", () => {
    const d = buildPracticeDashboard(emptyInput({
      flags: [flag("vague_recording"), flag("vague_recording"), flag("vague_recording"), flag("activity_over_impact")],
    }));
    expect(d.cultureRadar.some((c) => c.key === "compliance_over_impact")).toBe(true);
    expect(d.cultureRadar.some((c) => c.key === "recording_over_relationships")).toBe(true);
  });
});
