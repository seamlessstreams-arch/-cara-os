// ══════════════════════════════════════════════════════════════════════════════
// CARA — YOUNG PERSON ADMISSION SERVICE TESTS
// Pure-function unit tests for phase transitions, progress computation,
// checklist logic, matching scores, and Cara matching intelligence.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "../yp-admission-service";
import type { PreAdmissionItem, MatchingFactor, AdmissionPhase } from "../yp-admission-service";

const {
  validatePhaseTransition,
  computePhaseProgress,
  computeChecklistProgress,
  computeMatchingScore,
  generateCaraMatchingFactors,
  ADMISSION_PHASES,
  VALID_TRANSITIONS,
  DEFAULT_CHECKLIST_ITEMS,
} = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Minimal PreAdmissionItem with only the fields the pure function inspects. */
function item(is_mandatory: boolean, is_completed: boolean): PreAdmissionItem {
  return { is_mandatory, is_completed } as any;
}

/** Minimal MatchingFactor with score and risk_level. */
function factor(score: number, risk_level: "low" | "medium" | "high"): MatchingFactor {
  return { score, risk_level } as any;
}

// ── validatePhaseTransition ───────────────────────────────────────────────

describe("validatePhaseTransition", () => {
  it("should allow valid forward transition: referral_intake -> initial_screening", () => {
    const result = validatePhaseTransition("referral_intake", "initial_screening");
    expect(result).toEqual({ valid: true });
  });

  it("should allow valid forward transition: initial_screening -> impact_assessment", () => {
    const result = validatePhaseTransition("initial_screening", "impact_assessment");
    expect(result).toEqual({ valid: true });
  });

  it("should allow valid forward transition: placement_start -> completed", () => {
    const result = validatePhaseTransition("placement_start", "completed");
    expect(result).toEqual({ valid: true });
  });

  it("should allow any non-terminal phase to transition to withdrawn", () => {
    const nonTerminal: AdmissionPhase[] = [
      "referral_intake", "initial_screening", "impact_assessment",
      "matching_panel", "pre_admission", "admission_planning", "placement_start",
    ];
    for (const phase of nonTerminal) {
      const result = validatePhaseTransition(phase, "withdrawn");
      expect(result).toEqual({ valid: true });
    }
  });

  it("should reject skipping phases (referral_intake -> matching_panel)", () => {
    const result = validatePhaseTransition("referral_intake", "matching_panel");
    expect(result.valid).toBe(false);
    expect(result.reason).toBeDefined();
    expect(result.reason).toContain("Cannot transition");
  });

  it("should reject skipping phases (initial_screening -> pre_admission)", () => {
    const result = validatePhaseTransition("initial_screening", "pre_admission");
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("Cannot transition");
  });

  it("should reject same-phase transition with specific message", () => {
    const result = validatePhaseTransition("impact_assessment", "impact_assessment");
    expect(result).toEqual({ valid: false, reason: "Already in this phase" });
  });

  it("should reject any transition from completed", () => {
    const result = validatePhaseTransition("completed", "referral_intake");
    expect(result).toEqual({ valid: false, reason: "Workflow already completed" });
  });

  it("should reject completed -> withdrawn", () => {
    const result = validatePhaseTransition("completed", "withdrawn");
    expect(result).toEqual({ valid: false, reason: "Workflow already completed" });
  });

  it("should reject any transition from withdrawn", () => {
    const result = validatePhaseTransition("withdrawn", "referral_intake");
    expect(result).toEqual({ valid: false, reason: "Workflow already withdrawn" });
  });
});

// ── computePhaseProgress ──────────────────────────────────────────────────

describe("computePhaseProgress", () => {
  it("should return { current: 1, total: 8, percentage: 13 } for referral_intake", () => {
    expect(computePhaseProgress("referral_intake")).toEqual({
      current: 1,
      total: 8,
      percentage: 13,
    });
  });

  it("should return { current: 4, total: 8, percentage: 50 } for matching_panel", () => {
    expect(computePhaseProgress("matching_panel")).toEqual({
      current: 4,
      total: 8,
      percentage: 50,
    });
  });

  it("should return { current: 8, total: 8, percentage: 100 } for completed", () => {
    expect(computePhaseProgress("completed")).toEqual({
      current: 8,
      total: 8,
      percentage: 100,
    });
  });

  it("should return { current: 0, total: 8, percentage: 0 } for withdrawn", () => {
    expect(computePhaseProgress("withdrawn")).toEqual({
      current: 0,
      total: 8,
      percentage: 0,
    });
  });
});

// ── computeChecklistProgress ──────────────────────────────────────────────

describe("computeChecklistProgress", () => {
  it("should return all zeros and ready: true for an empty array", () => {
    expect(computeChecklistProgress([])).toEqual({
      total: 0,
      completed: 0,
      mandatory_total: 0,
      mandatory_completed: 0,
      percentage: 0,
      ready: true,
    });
  });

  it("should report ready: true when all mandatory items are completed", () => {
    const items = [
      item(true, true),
      item(true, true),
      item(false, false),
    ];
    const result = computeChecklistProgress(items);
    expect(result.ready).toBe(true);
    expect(result.mandatory_total).toBe(2);
    expect(result.mandatory_completed).toBe(2);
  });

  it("should report ready: false when any mandatory item is incomplete", () => {
    const items = [
      item(true, true),
      item(true, false),
      item(false, true),
    ];
    const result = computeChecklistProgress(items);
    expect(result.ready).toBe(false);
    expect(result.mandatory_completed).toBe(1);
  });

  it("should compute percentage correctly", () => {
    const items = [
      item(true, true),
      item(false, true),
      item(true, false),
      item(false, false),
    ];
    const result = computeChecklistProgress(items);
    expect(result.total).toBe(4);
    expect(result.completed).toBe(2);
    expect(result.percentage).toBe(50);
  });

  it("should compute 100% when all items are completed", () => {
    const items = [item(true, true), item(false, true), item(true, true)];
    const result = computeChecklistProgress(items);
    expect(result.percentage).toBe(100);
    expect(result.ready).toBe(true);
  });
});

// ── computeMatchingScore ──────────────────────────────────────────────────

describe("computeMatchingScore", () => {
  it("should return not_suitable with zeros for an empty array", () => {
    expect(computeMatchingScore([])).toEqual({
      overall: 0,
      highRiskCount: 0,
      recommendation: "not_suitable",
    });
  });

  it("should recommend strongly_suitable when avg >= 8 and no high-risk", () => {
    const factors = [factor(9, "low"), factor(8, "low"), factor(9, "medium")];
    const result = computeMatchingScore(factors);
    expect(result.overall).toBeCloseTo(8.7, 1);
    expect(result.highRiskCount).toBe(0);
    expect(result.recommendation).toBe("strongly_suitable");
  });

  it("should recommend suitable when avg >= 6 and highRisk <= 1", () => {
    const factors = [factor(7, "low"), factor(6, "high"), factor(7, "low")];
    const result = computeMatchingScore(factors);
    expect(result.overall).toBeCloseTo(6.7, 1);
    expect(result.highRiskCount).toBe(1);
    expect(result.recommendation).toBe("suitable");
  });

  it("should recommend conditionally_suitable when avg >= 4 but high risk > 1", () => {
    const factors = [factor(5, "high"), factor(4, "high"), factor(6, "low")];
    const result = computeMatchingScore(factors);
    expect(result.overall).toBe(5);
    expect(result.highRiskCount).toBe(2);
    expect(result.recommendation).toBe("conditionally_suitable");
  });

  it("should recommend not_suitable when avg < 4", () => {
    const factors = [factor(2, "high"), factor(3, "high"), factor(3, "medium")];
    const result = computeMatchingScore(factors);
    expect(result.overall).toBeCloseTo(2.7, 1);
    expect(result.recommendation).toBe("not_suitable");
  });

  it("should round overall score to 1 decimal place", () => {
    const factors = [factor(7, "low"), factor(8, "low"), factor(9, "low")];
    const result = computeMatchingScore(factors);
    expect(result.overall).toBe(8);
  });
});

// ── generateCaraMatchingFactors ───────────────────────────────────────────

describe("generateCaraMatchingFactors", () => {
  const baseChild = {
    age: 14,
    gender: "male",
    presentingNeeds: ["emotional_behavioural"],
    riskFactors: [],
    mentalHealthDiagnosis: [],
    previousPlacements: 1,
  };

  it("should return age_compatibility score 8 when no current residents", () => {
    const result = generateCaraMatchingFactors({
      incomingChild: baseChild,
      currentYoungPeople: [],
      homeCapacity: 4,
    });
    const ageFactor = result.factors.find((f) => f.factorType === "age_compatibility");
    expect(ageFactor).toBeDefined();
    expect(ageFactor!.score).toBe(8);
    expect(ageFactor!.riskLevel).toBe("low");
  });

  it("should return environmental_capacity score 4 and high risk at full capacity", () => {
    const currentYP = [
      { age: 14, gender: "male", riskFlags: [], status: "current" },
      { age: 15, gender: "female", riskFlags: [], status: "current" },
    ];
    const result = generateCaraMatchingFactors({
      incomingChild: baseChild,
      currentYoungPeople: currentYP,
      homeCapacity: 2,
    });
    const capFactor = result.factors.find((f) => f.factorType === "environmental_capacity");
    expect(capFactor).toBeDefined();
    expect(capFactor!.score).toBe(4);
    expect(capFactor!.riskLevel).toBe("high");
  });

  it("should return risk_compatibility score 3 and high risk with overlapping risk factors", () => {
    const child = { ...baseChild, riskFactors: ["cse", "self_harm"] };
    const currentYP = [
      { age: 15, gender: "female", riskFlags: ["cse"], status: "current" },
    ];
    const result = generateCaraMatchingFactors({
      incomingChild: child,
      currentYoungPeople: currentYP,
      homeCapacity: 4,
    });
    const riskFactor = result.factors.find((f) => f.factorType === "risk_compatibility");
    expect(riskFactor).toBeDefined();
    expect(riskFactor!.score).toBe(3);
    expect(riskFactor!.riskLevel).toBe("high");
  });

  it("should flag relationship_dynamics as high risk with >3 previous placements", () => {
    const child = { ...baseChild, previousPlacements: 5 };
    const result = generateCaraMatchingFactors({
      incomingChild: child,
      currentYoungPeople: [],
      homeCapacity: 4,
    });
    const relFactor = result.factors.find((f) => f.factorType === "relationship_dynamics");
    expect(relFactor).toBeDefined();
    expect(relFactor!.riskLevel).toBe("high");
  });

  it("should return overall risk low for a low-risk incoming child", () => {
    const result = generateCaraMatchingFactors({
      incomingChild: baseChild,
      currentYoungPeople: [],
      homeCapacity: 4,
    });
    expect(result.overallRisk).toBe("low");
    expect(result.factors).toHaveLength(5);
  });

  it("should always return exactly 5 factors", () => {
    const result = generateCaraMatchingFactors({
      incomingChild: { ...baseChild, riskFactors: ["cse"], mentalHealthDiagnosis: ["ADHD", "ASD", "PTSD"], presentingNeeds: ["a", "b", "c", "d"] },
      currentYoungPeople: [{ age: 12, gender: "female", riskFlags: ["cse"], status: "current" }],
      homeCapacity: 3,
    });
    expect(result.factors).toHaveLength(5);

    const types = result.factors.map((f) => f.factorType);
    expect(types).toContain("age_compatibility");
    expect(types).toContain("environmental_capacity");
    expect(types).toContain("risk_compatibility");
    expect(types).toContain("needs_compatibility");
    expect(types).toContain("relationship_dynamics");
  });

  it("should include a summary string in the result", () => {
    const result = generateCaraMatchingFactors({
      incomingChild: baseChild,
      currentYoungPeople: [],
      homeCapacity: 4,
    });
    expect(typeof result.summary).toBe("string");
    expect(result.summary.length).toBeGreaterThan(0);
    expect(result.summary).toContain("Cara matching analysis");
  });
});

// ── Constants validation ──────────────────────────────────────────────────

describe("Constants validation", () => {
  it("ADMISSION_PHASES should have exactly 8 entries", () => {
    expect(ADMISSION_PHASES).toHaveLength(8);
  });

  it("ADMISSION_PHASES should start with referral_intake and end with completed", () => {
    expect(ADMISSION_PHASES[0]).toBe("referral_intake");
    expect(ADMISSION_PHASES[ADMISSION_PHASES.length - 1]).toBe("completed");
  });

  it("VALID_TRANSITIONS: completed should have an empty transitions array", () => {
    expect(VALID_TRANSITIONS.completed).toEqual([]);
  });

  it("VALID_TRANSITIONS: withdrawn should have an empty transitions array", () => {
    expect(VALID_TRANSITIONS.withdrawn).toEqual([]);
  });

  it("DEFAULT_CHECKLIST_ITEMS should contain items in all 8 categories", () => {
    const categories = new Set(DEFAULT_CHECKLIST_ITEMS.map((i) => i.category));
    expect(categories).toContain("documentation");
    expect(categories).toContain("health");
    expect(categories).toContain("education");
    expect(categories).toContain("safeguarding");
    expect(categories).toContain("environment");
    expect(categories).toContain("staffing");
    expect(categories).toContain("legal");
    expect(categories).toContain("family");
  });

  it("DEFAULT_CHECKLIST_ITEMS should have mandatory items in every category", () => {
    const categories: string[] = ["documentation", "health", "education", "safeguarding", "environment", "staffing", "legal", "family"];
    for (const cat of categories) {
      const mandatoryInCat = DEFAULT_CHECKLIST_ITEMS.filter((i) => i.category === cat && i.is_mandatory);
      expect(mandatoryInCat.length).toBeGreaterThan(0);
    }
  });
});
