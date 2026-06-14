import { describe, it, expect } from "vitest";
import {
  validatePhaseTransition,
  computePhaseProgress,
  computeChecklistProgress,
  computeMatchingScore,
  generateCaraMatchingFactors,
  ADMISSION_PHASES,
  type PreAdmissionItem,
  type MatchingFactor,
  type CaraMatchingInput,
} from "./yp-admission-service";

// ── Factories ──────────────────────────────────────────────────────────────

function makeChecklistItem(overrides: Partial<PreAdmissionItem> = {}): PreAdmissionItem {
  return {
    id: "item-1",
    workflow_id: "wf-1",
    category: "documentation",
    item_text: "Referral pack received",
    is_mandatory: true,
    is_completed: false,
    completed_by: null,
    completed_at: null,
    evidence_ref: null,
    notes: null,
    sort_order: 0,
    created_at: "2025-05-01T00:00:00Z",
    ...overrides,
  };
}

function makeMatchingFactor(overrides: Partial<MatchingFactor> = {}): MatchingFactor {
  return {
    id: "mf-1",
    workflow_id: "wf-1",
    factor_type: "age_compatibility",
    score: 8,
    rationale: "Good age match",
    risk_level: "low",
    mitigations: null,
    assessed_by: "user-1",
    created_at: "2025-05-01T00:00:00Z",
    ...overrides,
  };
}

// ── validatePhaseTransition ────────────────────────────────────────────────

describe("validatePhaseTransition", () => {
  it("allows valid forward transition", () => {
    const result = validatePhaseTransition("referral_intake", "initial_screening");
    expect(result.valid).toBe(true);
  });

  it("allows withdrawal from any active phase", () => {
    expect(validatePhaseTransition("referral_intake", "withdrawn").valid).toBe(true);
    expect(validatePhaseTransition("matching_panel", "withdrawn").valid).toBe(true);
    expect(validatePhaseTransition("placement_start", "withdrawn").valid).toBe(true);
  });

  it("rejects same-phase transition", () => {
    const result = validatePhaseTransition("referral_intake", "referral_intake");
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("Already in this phase");
  });

  it("rejects transition from completed", () => {
    const result = validatePhaseTransition("completed", "referral_intake");
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("already completed");
  });

  it("rejects transition from withdrawn", () => {
    const result = validatePhaseTransition("withdrawn", "referral_intake");
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("already withdrawn");
  });

  it("rejects skipping phases", () => {
    const result = validatePhaseTransition("referral_intake", "matching_panel");
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("Cannot transition");
  });
});

// ── computePhaseProgress ───────────────────────────────────────────────────

describe("computePhaseProgress", () => {
  it("returns first step for referral_intake", () => {
    const p = computePhaseProgress("referral_intake");
    expect(p.current).toBe(1);
    expect(p.total).toBe(ADMISSION_PHASES.length);
    expect(p.percentage).toBe(Math.round((1 / ADMISSION_PHASES.length) * 100));
  });

  it("returns 100% for completed", () => {
    const p = computePhaseProgress("completed");
    expect(p.current).toBe(ADMISSION_PHASES.length);
    expect(p.percentage).toBe(100);
  });

  it("returns 0% for withdrawn", () => {
    const p = computePhaseProgress("withdrawn");
    expect(p.current).toBe(0);
    expect(p.percentage).toBe(0);
  });

  it("returns correct midway progress", () => {
    const p = computePhaseProgress("matching_panel");
    expect(p.current).toBe(4); // 4th in the list
    expect(p.percentage).toBe(Math.round((4 / ADMISSION_PHASES.length) * 100));
  });
});

// ── computeChecklistProgress ───────────────────────────────────────────────

describe("computeChecklistProgress", () => {
  it("returns zeroes for empty items", () => {
    const p = computeChecklistProgress([]);
    expect(p.total).toBe(0);
    expect(p.completed).toBe(0);
    expect(p.mandatory_total).toBe(0);
    expect(p.mandatory_completed).toBe(0);
    expect(p.percentage).toBe(0);
    expect(p.ready).toBe(true); // 0 mandatory = all done
  });

  it("computes progress with mix of completed and incomplete", () => {
    const items = [
      makeChecklistItem({ is_mandatory: true, is_completed: true }),
      makeChecklistItem({ id: "i2", is_mandatory: true, is_completed: false }),
      makeChecklistItem({ id: "i3", is_mandatory: false, is_completed: true }),
    ];
    const p = computeChecklistProgress(items);
    expect(p.total).toBe(3);
    expect(p.completed).toBe(2);
    expect(p.mandatory_total).toBe(2);
    expect(p.mandatory_completed).toBe(1);
    expect(p.percentage).toBe(67); // 2/3 rounded
    expect(p.ready).toBe(false);
  });

  it("ready is true when all mandatory items are completed", () => {
    const items = [
      makeChecklistItem({ is_mandatory: true, is_completed: true }),
      makeChecklistItem({ id: "i2", is_mandatory: false, is_completed: false }),
    ];
    const p = computeChecklistProgress(items);
    expect(p.ready).toBe(true);
  });
});

// ── computeMatchingScore ───────────────────────────────────────────────────

describe("computeMatchingScore", () => {
  it("returns not_suitable for empty factors", () => {
    const result = computeMatchingScore([]);
    expect(result.overall).toBe(0);
    expect(result.highRiskCount).toBe(0);
    expect(result.recommendation).toBe("not_suitable");
  });

  it("returns strongly_suitable for high scores and no high risk", () => {
    const factors = [
      makeMatchingFactor({ score: 9, risk_level: "low" }),
      makeMatchingFactor({ id: "mf-2", score: 8, risk_level: "low" }),
    ];
    const result = computeMatchingScore(factors);
    expect(result.overall).toBe(8.5);
    expect(result.recommendation).toBe("strongly_suitable");
  });

  it("returns suitable for avg >= 6 with at most 1 high risk", () => {
    const factors = [
      makeMatchingFactor({ score: 7, risk_level: "low" }),
      makeMatchingFactor({ id: "mf-2", score: 6, risk_level: "high" }),
    ];
    const result = computeMatchingScore(factors);
    expect(result.overall).toBe(6.5);
    expect(result.highRiskCount).toBe(1);
    expect(result.recommendation).toBe("suitable");
  });

  it("returns conditionally_suitable for avg >= 4", () => {
    const factors = [
      makeMatchingFactor({ score: 5, risk_level: "high" }),
      makeMatchingFactor({ id: "mf-2", score: 4, risk_level: "high" }),
    ];
    const result = computeMatchingScore(factors);
    expect(result.overall).toBe(4.5);
    expect(result.recommendation).toBe("conditionally_suitable");
  });

  it("returns not_suitable for avg < 4", () => {
    const factors = [
      makeMatchingFactor({ score: 3, risk_level: "high" }),
      makeMatchingFactor({ id: "mf-2", score: 2, risk_level: "high" }),
    ];
    const result = computeMatchingScore(factors);
    expect(result.overall).toBe(2.5);
    expect(result.recommendation).toBe("not_suitable");
  });
});

// ── generateCaraMatchingFactors ────────────────────────────────────────────

describe("generateCaraMatchingFactors", () => {
  const baseInput: CaraMatchingInput = {
    incomingChild: {
      age: 14,
      gender: "male",
      presentingNeeds: ["anxiety"],
      riskFactors: [],
      mentalHealthDiagnosis: [],
      previousPlacements: 1,
    },
    currentYoungPeople: [],
    homeCapacity: 4,
  };

  it("returns factors for empty home", () => {
    const result = generateCaraMatchingFactors(baseInput);
    expect(result.factors.length).toBeGreaterThanOrEqual(4);
    expect(result.overallRisk).toBeDefined();
    expect(result.summary).toBeTruthy();
  });

  it("generates age_compatibility factor with score 8 for empty home", () => {
    const result = generateCaraMatchingFactors(baseInput);
    const ageFactor = result.factors.find((f) => f.factorType === "age_compatibility");
    expect(ageFactor).toBeDefined();
    expect(ageFactor!.score).toBe(8);
    expect(ageFactor!.riskLevel).toBe("low");
  });

  it("scores environmental capacity high when plenty of space", () => {
    const result = generateCaraMatchingFactors(baseInput);
    const cap = result.factors.find((f) => f.factorType === "environmental_capacity");
    expect(cap).toBeDefined();
    expect(cap!.score).toBe(9);
    expect(cap!.riskLevel).toBe("low");
  });

  it("scores environmental capacity low when at capacity", () => {
    const input: CaraMatchingInput = {
      ...baseInput,
      currentYoungPeople: [
        { age: 13, gender: "male", riskFlags: [], status: "current" },
        { age: 14, gender: "female", riskFlags: [], status: "current" },
        { age: 15, gender: "male", riskFlags: [], status: "current" },
        { age: 12, gender: "male", riskFlags: [], status: "current" },
      ],
      homeCapacity: 4,
    };
    const result = generateCaraMatchingFactors(input);
    const cap = result.factors.find((f) => f.factorType === "environmental_capacity");
    expect(cap).toBeDefined();
    expect(cap!.score).toBe(4);
    expect(cap!.riskLevel).toBe("high");
  });

  it("flags high risk for overlapping risk factors", () => {
    const input: CaraMatchingInput = {
      ...baseInput,
      incomingChild: {
        ...baseInput.incomingChild,
        riskFactors: ["CSE"],
      },
      currentYoungPeople: [
        { age: 14, gender: "female", riskFlags: ["CSE"], status: "current" },
      ],
    };
    const result = generateCaraMatchingFactors(input);
    const risk = result.factors.find((f) => f.factorType === "risk_compatibility");
    expect(risk).toBeDefined();
    expect(risk!.score).toBe(3);
    expect(risk!.riskLevel).toBe("high");
  });

  it("overall risk is high when 2+ factors are high risk", () => {
    const input: CaraMatchingInput = {
      incomingChild: {
        age: 14,
        gender: "male",
        presentingNeeds: ["anxiety", "self-harm", "aggression", "absconding"],
        riskFactors: ["CSE"],
        mentalHealthDiagnosis: ["PTSD", "ADHD", "depression"],
        previousPlacements: 6,
      },
      currentYoungPeople: [
        { age: 14, gender: "female", riskFlags: ["CSE"], status: "current" },
        { age: 13, gender: "male", riskFlags: [], status: "current" },
        { age: 15, gender: "male", riskFlags: [], status: "current" },
        { age: 12, gender: "female", riskFlags: [], status: "current" },
      ],
      homeCapacity: 4,
    };
    const result = generateCaraMatchingFactors(input);
    expect(result.overallRisk).toBe("high");
  });
});
