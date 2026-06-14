import { describe, it, expect } from "vitest";

// ══════════════════════════════════════════════════════════════════════════════
// Cara — RISK TIER CLASSIFICATION TESTS
// ══════════════════════════════════════════════════════════════════════════════

import {
  classifyRisk,
  isHighRisk,
  requiresManagerApproval,
  LOW_RISK_ACTIONS,
  MEDIUM_RISK_ACTIONS,
  HIGH_RISK_ACTIONS,
} from "../risk-tiers";

describe("classifyRisk", () => {
  it("classifies known low-risk actions as low tier", () => {
    for (const action of LOW_RISK_ACTIONS) {
      const result = classifyRisk(action);
      expect(result.tier, `Expected "${action}" to be low risk`).toBe("low");
    }
  });

  it("classifies known medium-risk actions as medium tier", () => {
    for (const action of MEDIUM_RISK_ACTIONS) {
      const result = classifyRisk(action);
      expect(result.tier, `Expected "${action}" to be medium risk`).toBe("medium");
    }
  });

  it("classifies known high-risk actions as high tier", () => {
    for (const action of HIGH_RISK_ACTIONS) {
      const result = classifyRisk(action);
      expect(result.tier, `Expected "${action}" to be high risk`).toBe("high");
    }
  });

  it("defaults unknown actions to high risk (fail-safe)", () => {
    const result = classifyRisk("completely_unknown_action_xyz");
    expect(result.tier).toBe("high");
    expect(result.requiresApproval).toBe(true);
    expect(result.requiresEvidence).toBe(true);
  });

  it("low-risk actions require audit but not approval or evidence", () => {
    const result = classifyRisk("review_language_quality");
    expect(result.requiresApproval).toBe(false);
    expect(result.requiresEvidence).toBe(false);
    expect(result.requiresAudit).toBe(true);
    expect(result.requiresConfidenceScore).toBe(false);
    expect(result.requiresHumanReviewNote).toBe(false);
  });

  it("medium-risk actions require evidence and confidence score", () => {
    const result = classifyRisk("retrieve_evidence");
    expect(result.requiresApproval).toBe(false);
    expect(result.requiresEvidence).toBe(true);
    expect(result.requiresAudit).toBe(true);
    expect(result.requiresConfidenceScore).toBe(true);
    expect(result.requiresHumanReviewNote).toBe(false);
  });

  it("high-risk actions require all governance controls", () => {
    const result = classifyRisk("analyse_incident_patterns");
    expect(result.requiresApproval).toBe(true);
    expect(result.requiresEvidence).toBe(true);
    expect(result.requiresAudit).toBe(true);
    expect(result.requiresConfidenceScore).toBe(true);
    expect(result.requiresHumanReviewNote).toBe(true);
  });
});

describe("isHighRisk", () => {
  it("returns true for high-risk actions", () => {
    expect(isHighRisk("detect_exploitation_indicators")).toBe(true);
    expect(isHighRisk("generate_ofsted_report")).toBe(true);
  });

  it("returns false for low and medium-risk actions", () => {
    expect(isHighRisk("classify_document")).toBe(false);
    expect(isHighRisk("generate_oversight_summary")).toBe(false);
  });

  it("returns true for unknown actions (fail-safe)", () => {
    expect(isHighRisk("never_seen_before_action")).toBe(true);
  });
});

describe("requiresManagerApproval", () => {
  it("returns true for high-risk actions", () => {
    expect(requiresManagerApproval("flag_escalating_concerns")).toBe(true);
  });

  it("returns false for low-risk actions", () => {
    expect(requiresManagerApproval("suggest_therapeutic_framing")).toBe(false);
  });

  it("returns false for medium-risk actions", () => {
    expect(requiresManagerApproval("scan_recording_quality")).toBe(false);
  });

  it("returns true for unknown actions (fail-safe)", () => {
    expect(requiresManagerApproval("some_future_action")).toBe(true);
  });
});

describe("action list integrity", () => {
  it("no action appears in more than one tier", () => {
    const allActions = [...LOW_RISK_ACTIONS, ...MEDIUM_RISK_ACTIONS, ...HIGH_RISK_ACTIONS];
    const seen = new Set<string>();
    const duplicates: string[] = [];
    for (const action of allActions) {
      if (seen.has(action)) duplicates.push(action);
      seen.add(action);
    }
    expect(duplicates, `Duplicate actions found: ${duplicates.join(", ")}`).toEqual([]);
  });

  it("all action lists are non-empty", () => {
    expect(LOW_RISK_ACTIONS.length).toBeGreaterThan(0);
    expect(MEDIUM_RISK_ACTIONS.length).toBeGreaterThan(0);
    expect(HIGH_RISK_ACTIONS.length).toBeGreaterThan(0);
  });

  it("safeguarding actions are always high risk", () => {
    const safeguardingActions = HIGH_RISK_ACTIONS.filter(
      (a) => a.includes("safeguarding") || a.includes("exploitation"),
    );
    expect(safeguardingActions.length).toBeGreaterThan(0);
    for (const action of safeguardingActions) {
      expect(isHighRisk(action)).toBe(true);
    }
  });
});
