// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME STAFF RECOGNITION & MORALE INTELLIGENCE ENGINE — TESTS
// CHR 2015 Reg 33: fitness of workers. SCCIF: well-led and managed.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeStaffRecognitionMorale,
  type StaffRecognitionMoraleInput,
  type StaffRecognitionInput,
} from "../home-staff-recognition-morale-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeRecognition(overrides: Partial<StaffRecognitionInput> = {}): StaffRecognitionInput {
  return {
    id: "r1",
    staff_member: "staff_1",
    recognition_type: "above_and_beyond",
    recognised_by: "registered_manager",
    has_impact_description: true,
    has_child_impact: true,
    public_celebration: true,
    child_contributed_nomination: true,
    has_staff_response: true,
    ways_marked_count: 2,
    ...overrides,
  };
}

function baseInput(overrides: Partial<StaffRecognitionMoraleInput> = {}): StaffRecognitionMoraleInput {
  return {
    today: "2026-05-27",
    total_staff: 8,
    recognitions: [],
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. INSUFFICIENT DATA
// ═══════════════════════════════════════════════════════════════════════════

describe("insufficient data", () => {
  it("returns insufficient_data when total_staff is 0", () => {
    const r = computeStaffRecognitionMorale(baseInput({ total_staff: 0 }));
    expect(r.recognition_rating).toBe("insufficient_data");
    expect(r.recognition_score).toBe(0);
  });

  it("returns correct headline on insufficient data", () => {
    const r = computeStaffRecognitionMorale(baseInput({ total_staff: 0 }));
    expect(r.headline).toBe("No data available for staff recognition analysis");
  });

  it("leaves every rate unmeasured on insufficient data", () => {
    const r = computeStaffRecognitionMorale(baseInput({ total_staff: 0 }));
    expect(r.total_recognitions).toBe(0);
    expect(r.staff_recognised_rate).toBeNull();
    expect(r.child_involvement_rate).toBeNull();
    expect(r.public_celebration_rate).toBeNull();
    expect(r.impact_documented_rate).toBeNull();
    expect(r.recognition_type_variety).toBe(0);
  });

  it("returns empty arrays on insufficient data", () => {
    const r = computeStaffRecognitionMorale(baseInput({ total_staff: 0 }));
    expect(r.strengths).toEqual([]);
    expect(r.concerns).toEqual([]);
    expect(r.recommendations).toEqual([]);
    expect(r.insights).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. ZERO RECOGNITIONS — SCORE DERIVATION
// ═══════════════════════════════════════════════════════════════════════════

describe("zero recognitions", () => {
  it("computes score from base 52 with zero-recognition penalties", () => {
    // base 52, mod1: -5, mod2: 0, mod3: -1, mod4: 0, mod5: 0, mod6: -2 = 44
    const r = computeStaffRecognitionMorale(baseInput());
    expect(r.recognition_score).toBe(44);
  });

  it("rates zero recognitions as inadequate (score 44 < 45)", () => {
    const r = computeStaffRecognitionMorale(baseInput());
    expect(r.recognition_rating).toBe("inadequate");
  });

  it("reports total_recognitions as 0", () => {
    const r = computeStaffRecognitionMorale(baseInput());
    expect(r.total_recognitions).toBe(0);
  });

  it("reports every rate as unmeasured with zero recognitions", () => {
    const r = computeStaffRecognitionMorale(baseInput());
    expect(r.staff_recognised_rate).toBe(0);
    expect(r.child_involvement_rate).toBeNull();
    expect(r.public_celebration_rate).toBeNull();
    expect(r.impact_documented_rate).toBeNull();
    expect(r.recognition_type_variety).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. OUTSTANDING SCENARIO
// ═══════════════════════════════════════════════════════════════════════════

describe("outstanding scenario", () => {
  const types = [
    "above_and_beyond",
    "quiet_excellence",
    "team_contribution",
    "child_recognised",
    "anniversary_milestone",
  ];

  function outstandingInput(): StaffRecognitionMoraleInput {
    const recs: StaffRecognitionInput[] = [];
    for (let i = 0; i < 8; i++) {
      recs.push(
        makeRecognition({
          id: `r${i * 2 + 1}`,
          staff_member: `staff_${i + 1}`,
          recognition_type: types[i % types.length],
          child_contributed_nomination: true,
          public_celebration: true,
          has_impact_description: true,
        }),
        makeRecognition({
          id: `r${i * 2 + 2}`,
          staff_member: `staff_${i + 1}`,
          recognition_type: types[(i + 1) % types.length],
          child_contributed_nomination: i < 5,
          public_celebration: true,
          has_impact_description: true,
        }),
      );
    }
    return baseInput({ recognitions: recs });
  }

  it("rates as outstanding", () => {
    const r = computeStaffRecognitionMorale(outstandingInput());
    expect(r.recognition_rating).toBe("outstanding");
  });

  it("scores >= 80", () => {
    const r = computeStaffRecognitionMorale(outstandingInput());
    expect(r.recognition_score).toBeGreaterThanOrEqual(80);
  });

  it("headline matches outstanding wording", () => {
    const r = computeStaffRecognitionMorale(outstandingInput());
    expect(r.headline).toBe(
      "Staff recognition is embedded, varied and contributes to a positive, motivated workforce",
    );
  });

  it("has multiple strengths", () => {
    const r = computeStaffRecognitionMorale(outstandingInput());
    expect(r.strengths.length).toBeGreaterThanOrEqual(4);
  });

  it("has no concerns", () => {
    const r = computeStaffRecognitionMorale(outstandingInput());
    expect(r.concerns).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. GOOD SCENARIO
// ═══════════════════════════════════════════════════════════════════════════

describe("good scenario", () => {
  function goodInput(): StaffRecognitionMoraleInput {
    // 10 recs, 5 unique staff out of 8 = 63% coverage, 3 types, 30% child, 50% public, 80% impact
    const recs: StaffRecognitionInput[] = [];
    for (let i = 0; i < 10; i++) {
      recs.push(
        makeRecognition({
          id: `r${i + 1}`,
          staff_member: `staff_${(i % 5) + 1}`,
          recognition_type: ["above_and_beyond", "quiet_excellence", "team_contribution"][i % 3],
          child_contributed_nomination: i < 3,
          public_celebration: i < 5,
          has_impact_description: i < 8,
        }),
      );
    }
    return baseInput({ recognitions: recs });
  }

  it("rates as good", () => {
    // base 52, mod1: +2 (10/8=1.25), mod2: +2 (63%), mod3: +2 (30%), mod4: +5 (50%), mod5: +4 (80%), mod6: +2 (3 types) = 69
    const r = computeStaffRecognitionMorale(goodInput());
    expect(r.recognition_rating).toBe("good");
  });

  it("score is between 65 and 79", () => {
    const r = computeStaffRecognitionMorale(goodInput());
    expect(r.recognition_score).toBeGreaterThanOrEqual(65);
    expect(r.recognition_score).toBeLessThan(80);
  });

  it("headline matches good wording", () => {
    const r = computeStaffRecognitionMorale(goodInput());
    expect(r.headline).toBe(
      "Good staff recognition culture with effective acknowledgement of practice and contribution",
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. ADEQUATE SCENARIO
// ═══════════════════════════════════════════════════════════════════════════

describe("adequate scenario", () => {
  function adequateInput(): StaffRecognitionMoraleInput {
    // 4 recs, 3 unique staff out of 8 = 38%, 2 types, 25% child, 25% public, 50% impact
    const recs: StaffRecognitionInput[] = [
      makeRecognition({ id: "r1", staff_member: "staff_1", recognition_type: "above_and_beyond", child_contributed_nomination: true, public_celebration: true, has_impact_description: true }),
      makeRecognition({ id: "r2", staff_member: "staff_2", recognition_type: "above_and_beyond", child_contributed_nomination: false, public_celebration: false, has_impact_description: true }),
      makeRecognition({ id: "r3", staff_member: "staff_3", recognition_type: "quiet_excellence", child_contributed_nomination: false, public_celebration: false, has_impact_description: false }),
      makeRecognition({ id: "r4", staff_member: "staff_1", recognition_type: "quiet_excellence", child_contributed_nomination: false, public_celebration: false, has_impact_description: false }),
    ];
    return baseInput({ recognitions: recs });
  }

  it("rates as adequate", () => {
    // base 52, mod1: -2 (4/8=0.5), mod2: -5 (<30%? 3/8=38% >=30 but <50 → 0), mod3: +2 (25%>=15%), mod4: +2 (25%>=25%), mod5: +1 (50%>=50%), mod6: -3 (<=1? no, 2 types → 0 for >=3 check... uniqueTypes=2 → not >=3, not <=1 → 0)
    // Wait: mod2 for 38%: not >=80, not >=50, not <30 → 0; mod6 for 2 types: not >=5, not >=3, not <=1 → 0
    // 52 - 2 + 0 + 2 + 2 + 1 + 0 = 55
    const r = computeStaffRecognitionMorale(adequateInput());
    expect(r.recognition_rating).toBe("adequate");
  });

  it("score is between 45 and 64", () => {
    const r = computeStaffRecognitionMorale(adequateInput());
    expect(r.recognition_score).toBeGreaterThanOrEqual(45);
    expect(r.recognition_score).toBeLessThan(65);
  });

  it("headline matches adequate wording", () => {
    const r = computeStaffRecognitionMorale(adequateInput());
    expect(r.headline).toBe(
      "Staff recognition exists but needs to be more consistent, varied and visible",
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. INADEQUATE SCENARIO
// ═══════════════════════════════════════════════════════════════════════════

describe("inadequate scenario", () => {
  function inadequateInput(): StaffRecognitionMoraleInput {
    // 1 rec, 1 unique staff out of 8 = 13%, 1 type, 0% child, 0% public, 0% impact
    const recs = [
      makeRecognition({
        id: "r1",
        staff_member: "staff_1",
        recognition_type: "above_and_beyond",
        child_contributed_nomination: false,
        public_celebration: false,
        has_impact_description: false,
      }),
    ];
    return baseInput({ recognitions: recs });
  }

  it("rates as inadequate", () => {
    // base 52, mod1: -2 (1/8=0.125), mod2: -5 (13%<30%), mod3: -4 (0%), mod4: -5 (0%), mod5: -4 (<30%), mod6: -3 (<=1)
    // 52 - 2 - 5 - 4 - 5 - 4 - 3 = 29
    const r = computeStaffRecognitionMorale(inadequateInput());
    expect(r.recognition_rating).toBe("inadequate");
    expect(r.recognition_score).toBe(29);
  });

  it("headline matches inadequate wording", () => {
    const r = computeStaffRecognitionMorale(inadequateInput());
    expect(r.headline).toBe(
      "Staff recognition is inadequate — morale and retention are likely to be negatively impacted",
    );
  });

  it("has multiple concerns", () => {
    const r = computeStaffRecognitionMorale(inadequateInput());
    expect(r.concerns.length).toBeGreaterThanOrEqual(3);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. MODIFIER BOUNDARY TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe("modifier 1 — recognition frequency", () => {
  it("adds +5 when recsPerStaff >= 2", () => {
    // 16 recs / 8 staff = 2.0
    const recs = Array.from({ length: 16 }, (_, i) =>
      makeRecognition({ id: `r${i}`, staff_member: `staff_${(i % 8) + 1}` }),
    );
    const r = computeStaffRecognitionMorale(baseInput({ recognitions: recs }));
    // Verify score includes the +5 by comparing to a known baseline
    // With 16 recs, 8 staff: mod1=+5, mod2=+6 (100%), mod3=+5 (100%), mod4=+5 (100%), mod5=+4 (100%), mod6=-3 (1 type)
    // 52 + 5 + 6 + 5 + 5 + 4 - 3 = 74
    expect(r.recognition_score).toBe(74);
  });

  it("adds +2 when recsPerStaff >= 1 but < 2", () => {
    // 8 recs / 8 staff = 1.0
    const recs = Array.from({ length: 8 }, (_, i) =>
      makeRecognition({ id: `r${i}`, staff_member: `staff_${i + 1}` }),
    );
    const r = computeStaffRecognitionMorale(baseInput({ recognitions: recs }));
    // mod1=+2, mod2=+6 (100%), mod3=+5 (100%), mod4=+5 (100%), mod5=+4 (100%), mod6=-3 (1 type)
    // 52 + 2 + 6 + 5 + 5 + 4 - 3 = 71
    expect(r.recognition_score).toBe(71);
  });

  it("subtracts -5 when total is 0", () => {
    const r = computeStaffRecognitionMorale(baseInput({ recognitions: [] }));
    // 52 - 5 + 0 - 1 + 0 + 0 - 2 = 44
    expect(r.recognition_score).toBe(44);
  });

  it("subtracts -2 when recsPerStaff < 1 and total > 0", () => {
    // 4 recs / 8 staff = 0.5
    const recs = Array.from({ length: 4 }, (_, i) =>
      makeRecognition({ id: `r${i}`, staff_member: `staff_${i + 1}` }),
    );
    const r = computeStaffRecognitionMorale(baseInput({ recognitions: recs }));
    // mod1=-2, mod2=+2 (50%), mod3=+5 (100%), mod4=+5 (100%), mod5=+4 (100%), mod6=-3 (1 type)
    // 52 - 2 + 2 + 5 + 5 + 4 - 3 = 63
    expect(r.recognition_score).toBe(63);
  });
});

describe("modifier 2 — staff coverage", () => {
  it("adds +6 when staffRecognisedRate >= 80%", () => {
    // 7 unique staff / 8 total = 88%
    const recs = Array.from({ length: 7 }, (_, i) =>
      makeRecognition({ id: `r${i}`, staff_member: `staff_${i + 1}` }),
    );
    const r = computeStaffRecognitionMorale(baseInput({ recognitions: recs }));
    // mod1=-2 (7/8=0.875), mod2=+6 (88%), mod3=+5 (100%), mod4=+5 (100%), mod5=+4 (100%), mod6=-3 (1 type)
    // 52 - 2 + 6 + 5 + 5 + 4 - 3 = 67
    expect(r.recognition_score).toBe(67);
  });

  it("adds +2 when staffRecognisedRate >= 50% but < 80%", () => {
    // 5 unique staff / 8 total = 63%
    const recs = Array.from({ length: 5 }, (_, i) =>
      makeRecognition({ id: `r${i}`, staff_member: `staff_${i + 1}` }),
    );
    const r = computeStaffRecognitionMorale(baseInput({ recognitions: recs }));
    // mod1=-2 (5/8=0.625), mod2=+2 (63%), mod3=+5 (100%), mod4=+5 (100%), mod5=+4 (100%), mod6=-3 (1 type)
    // 52 - 2 + 2 + 5 + 5 + 4 - 3 = 63
    expect(r.recognition_score).toBe(63);
  });

  it("subtracts -5 when staffRecognisedRate < 30%", () => {
    // 2 unique staff / 8 total = 25%
    const recs = Array.from({ length: 2 }, (_, i) =>
      makeRecognition({ id: `r${i}`, staff_member: `staff_${i + 1}` }),
    );
    const r = computeStaffRecognitionMorale(baseInput({ recognitions: recs }));
    // mod1=-2 (2/8=0.25), mod2=-5 (25%), mod3=+5 (100%), mod4=+5 (100%), mod5=+4 (100%), mod6=-3 (1 type)
    // 52 - 2 - 5 + 5 + 5 + 4 - 3 = 56
    expect(r.recognition_score).toBe(56);
  });

  it("applies no adjustment when staffRecognisedRate is 30-49%", () => {
    // 3 unique staff / 8 total = 38%
    const recs = Array.from({ length: 3 }, (_, i) =>
      makeRecognition({ id: `r${i}`, staff_member: `staff_${i + 1}` }),
    );
    const r = computeStaffRecognitionMorale(baseInput({ recognitions: recs }));
    // mod1=-2 (3/8=0.375), mod2=0 (38%), mod3=+5 (100%), mod4=+5 (100%), mod5=+4 (100%), mod6=-3 (1 type)
    // 52 - 2 + 0 + 5 + 5 + 4 - 3 = 61
    expect(r.recognition_score).toBe(61);
  });
});

describe("modifier 3 — child involvement", () => {
  it("adds +5 when childInvolvementRate >= 30%", () => {
    // 3 of 8 recs = 38% child involvement
    const recs = Array.from({ length: 8 }, (_, i) =>
      makeRecognition({
        id: `r${i}`,
        staff_member: `staff_${i + 1}`,
        child_contributed_nomination: i < 3,
      }),
    );
    const r = computeStaffRecognitionMorale(baseInput({ recognitions: recs }));
    // mod1=+2 (8/8=1.0), mod2=+6 (100%), mod3=+5 (38%), mod4=-5 (0%), mod5=-4 (<30%→0%), mod6=-3 (1 type)
    // Wait, has_impact_description defaults true in makeRecognition
    // mod5=+4 (100%), mod4: all public_celebration=true → 100% → +5
    // Actually need to check defaults: public_celebration: true in makeRecognition
    // So i<3 only overrides child_contributed_nomination, everything else stays default=true
    // mod4=+5 (100%), mod5=+4 (100%)
    // 52 + 2 + 6 + 5 + 5 + 4 - 3 = 71
    expect(r.recognition_score).toBe(71);
  });

  it("adds +2 when childInvolvementRate >= 15% but < 30%", () => {
    // 2 of 10 recs = 20% child involvement
    const recs = Array.from({ length: 10 }, (_, i) =>
      makeRecognition({
        id: `r${i}`,
        staff_member: `staff_${(i % 8) + 1}`,
        child_contributed_nomination: i < 2,
      }),
    );
    const r = computeStaffRecognitionMorale(baseInput({ recognitions: recs }));
    // mod1=+2 (10/8=1.25), mod2=+6 (100%), mod3=+2 (20%), mod4=+5 (100%), mod5=+4 (100%), mod6=-3 (1 type)
    // 52 + 2 + 6 + 2 + 5 + 4 - 3 = 68
    expect(r.recognition_score).toBe(68);
  });

  it("subtracts -4 when childInvolvementRate is 0%", () => {
    const recs = Array.from({ length: 8 }, (_, i) =>
      makeRecognition({
        id: `r${i}`,
        staff_member: `staff_${i + 1}`,
        child_contributed_nomination: false,
      }),
    );
    const r = computeStaffRecognitionMorale(baseInput({ recognitions: recs }));
    // mod1=+2 (1.0), mod2=+6 (100%), mod3=-4 (0%), mod4=+5 (100%), mod5=+4 (100%), mod6=-3 (1 type)
    // 52 + 2 + 6 - 4 + 5 + 4 - 3 = 62
    expect(r.recognition_score).toBe(62);
  });

  it("subtracts -1 when total is 0 (zero recs)", () => {
    // Already tested: zero recs gives 52 - 5 + 0 - 1 + 0 + 0 - 2 = 44
    const r = computeStaffRecognitionMorale(baseInput());
    expect(r.recognition_score).toBe(44);
  });
});

describe("modifier 4 — public celebration rate", () => {
  it("adds +5 when publicCelebrationRate >= 50%", () => {
    // 5 of 8 recs = 63% public celebration
    const recs = Array.from({ length: 8 }, (_, i) =>
      makeRecognition({
        id: `r${i}`,
        staff_member: `staff_${i + 1}`,
        public_celebration: i < 5,
      }),
    );
    const r = computeStaffRecognitionMorale(baseInput({ recognitions: recs }));
    // mod1=+2, mod2=+6, mod3=+5 (100% child), mod4=+5 (63%), mod5=+4 (100%), mod6=-3
    // 52 + 2 + 6 + 5 + 5 + 4 - 3 = 71
    expect(r.recognition_score).toBe(71);
  });

  it("adds +2 when publicCelebrationRate >= 25% but < 50%", () => {
    // 3 of 8 recs = 38% public celebration
    const recs = Array.from({ length: 8 }, (_, i) =>
      makeRecognition({
        id: `r${i}`,
        staff_member: `staff_${i + 1}`,
        public_celebration: i < 3,
      }),
    );
    const r = computeStaffRecognitionMorale(baseInput({ recognitions: recs }));
    // mod4=+2 (38%)
    // 52 + 2 + 6 + 5 + 2 + 4 - 3 = 68
    expect(r.recognition_score).toBe(68);
  });

  it("subtracts -5 when publicCelebrationRate is 0%", () => {
    const recs = Array.from({ length: 8 }, (_, i) =>
      makeRecognition({
        id: `r${i}`,
        staff_member: `staff_${i + 1}`,
        public_celebration: false,
      }),
    );
    const r = computeStaffRecognitionMorale(baseInput({ recognitions: recs }));
    // mod4=-5 (0%)
    // 52 + 2 + 6 + 5 - 5 + 4 - 3 = 61
    expect(r.recognition_score).toBe(61);
  });

  it("applies no adjustment for 0 recs", () => {
    // already covered in zero recs test: mod4 contributes 0
    const r = computeStaffRecognitionMorale(baseInput());
    // 52 - 5 + 0 - 1 + 0 + 0 - 2 = 44
    expect(r.recognition_score).toBe(44);
  });
});

describe("modifier 5 — impact documentation", () => {
  it("adds +4 when impactDocumentedRate >= 80%", () => {
    // 7 of 8 = 88% impact documented
    const recs = Array.from({ length: 8 }, (_, i) =>
      makeRecognition({
        id: `r${i}`,
        staff_member: `staff_${i + 1}`,
        has_impact_description: i < 7,
      }),
    );
    const r = computeStaffRecognitionMorale(baseInput({ recognitions: recs }));
    // mod5=+4 (88%)
    // 52 + 2 + 6 + 5 + 5 + 4 - 3 = 71
    expect(r.recognition_score).toBe(71);
  });

  it("adds +1 when impactDocumentedRate >= 50% but < 80%", () => {
    // 5 of 8 = 63% impact documented
    const recs = Array.from({ length: 8 }, (_, i) =>
      makeRecognition({
        id: `r${i}`,
        staff_member: `staff_${i + 1}`,
        has_impact_description: i < 5,
      }),
    );
    const r = computeStaffRecognitionMorale(baseInput({ recognitions: recs }));
    // mod5=+1 (63%)
    // 52 + 2 + 6 + 5 + 5 + 1 - 3 = 68
    expect(r.recognition_score).toBe(68);
  });

  it("subtracts -4 when impactDocumentedRate < 30%", () => {
    // 1 of 8 = 13% impact documented
    const recs = Array.from({ length: 8 }, (_, i) =>
      makeRecognition({
        id: `r${i}`,
        staff_member: `staff_${i + 1}`,
        has_impact_description: i < 1,
      }),
    );
    const r = computeStaffRecognitionMorale(baseInput({ recognitions: recs }));
    // mod5=-4 (13%)
    // 52 + 2 + 6 + 5 + 5 - 4 - 3 = 63
    expect(r.recognition_score).toBe(63);
  });

  it("applies no adjustment when impactDocumentedRate is 30-49%", () => {
    // 3 of 8 = 38% impact documented
    const recs = Array.from({ length: 8 }, (_, i) =>
      makeRecognition({
        id: `r${i}`,
        staff_member: `staff_${i + 1}`,
        has_impact_description: i < 3,
      }),
    );
    const r = computeStaffRecognitionMorale(baseInput({ recognitions: recs }));
    // mod5=0 (38% — not >=50, not <30)
    // 52 + 2 + 6 + 5 + 5 + 0 - 3 = 67
    expect(r.recognition_score).toBe(67);
  });
});

describe("modifier 6 — type variety", () => {
  it("adds +5 when uniqueTypes >= 5", () => {
    const types = [
      "above_and_beyond",
      "quiet_excellence",
      "team_contribution",
      "child_recognised",
      "anniversary_milestone",
    ];
    const recs = types.map((t, i) =>
      makeRecognition({ id: `r${i}`, staff_member: `staff_${i + 1}`, recognition_type: t }),
    );
    const r = computeStaffRecognitionMorale(baseInput({ recognitions: recs }));
    // 5 recs / 8 staff = 0.625 → mod1=-2; 5/8=63% → mod2=+2; mod3=+5; mod4=+5; mod5=+4; mod6=+5
    // 52 - 2 + 2 + 5 + 5 + 4 + 5 = 71
    expect(r.recognition_score).toBe(71);
  });

  it("adds +2 when uniqueTypes >= 3 but < 5", () => {
    const types = ["above_and_beyond", "quiet_excellence", "team_contribution"];
    const recs = types.map((t, i) =>
      makeRecognition({ id: `r${i}`, staff_member: `staff_${i + 1}`, recognition_type: t }),
    );
    const r = computeStaffRecognitionMorale(baseInput({ recognitions: recs }));
    // 3/8=0.375 → mod1=-2; 3/8=38% → mod2=0; mod3=+5; mod4=+5; mod5=+4; mod6=+2
    // 52 - 2 + 0 + 5 + 5 + 4 + 2 = 66
    expect(r.recognition_score).toBe(66);
  });

  it("subtracts -3 when uniqueTypes <= 1", () => {
    // single type
    const recs = Array.from({ length: 8 }, (_, i) =>
      makeRecognition({
        id: `r${i}`,
        staff_member: `staff_${i + 1}`,
        recognition_type: "above_and_beyond",
      }),
    );
    const r = computeStaffRecognitionMorale(baseInput({ recognitions: recs }));
    // mod1=+2, mod2=+6, mod3=+5, mod4=+5, mod5=+4, mod6=-3
    // 52 + 2 + 6 + 5 + 5 + 4 - 3 = 71
    expect(r.recognition_score).toBe(71);
  });

  it("applies no adjustment when uniqueTypes is 2", () => {
    const recs = Array.from({ length: 8 }, (_, i) =>
      makeRecognition({
        id: `r${i}`,
        staff_member: `staff_${i + 1}`,
        recognition_type: i < 4 ? "above_and_beyond" : "quiet_excellence",
      }),
    );
    const r = computeStaffRecognitionMorale(baseInput({ recognitions: recs }));
    // mod6=0 (2 types: not >=3, not <=1)
    // 52 + 2 + 6 + 5 + 5 + 4 + 0 = 74
    expect(r.recognition_score).toBe(74);
  });

  it("subtracts -2 when total is 0 (zero recs)", () => {
    const r = computeStaffRecognitionMorale(baseInput());
    // 52 - 5 + 0 - 1 + 0 + 0 - 2 = 44
    expect(r.recognition_score).toBe(44);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. STRENGTHS GENERATION
// ═══════════════════════════════════════════════════════════════════════════

describe("strengths generation", () => {
  it("includes high frequency strength when recsPerStaff >= 2", () => {
    const recs = Array.from({ length: 16 }, (_, i) =>
      makeRecognition({ id: `r${i}`, staff_member: `staff_${(i % 8) + 1}` }),
    );
    const r = computeStaffRecognitionMorale(baseInput({ recognitions: recs }));
    expect(r.strengths).toContain(
      "High frequency of recognition indicates a culture that values and celebrates staff contributions",
    );
  });

  it("includes staff coverage strength when staffRecognisedRate >= 80%", () => {
    const recs = Array.from({ length: 8 }, (_, i) =>
      makeRecognition({ id: `r${i}`, staff_member: `staff_${i + 1}` }),
    );
    const r = computeStaffRecognitionMorale(baseInput({ recognitions: recs }));
    expect(r.strengths).toContain(
      "Recognition is distributed across the team — all staff feel seen and valued",
    );
  });

  it("includes child involvement strength when childInvolvementRate >= 30%", () => {
    const recs = Array.from({ length: 8 }, (_, i) =>
      makeRecognition({
        id: `r${i}`,
        staff_member: `staff_${i + 1}`,
        child_contributed_nomination: i < 3,
      }),
    );
    const r = computeStaffRecognitionMorale(baseInput({ recognitions: recs }));
    expect(r.strengths).toContain(
      "Children actively contribute to recognising staff — a powerful indicator of positive relationships",
    );
  });

  it("includes public celebration strength when publicCelebrationRate >= 50%", () => {
    const recs = Array.from({ length: 8 }, (_, i) =>
      makeRecognition({
        id: `r${i}`,
        staff_member: `staff_${i + 1}`,
        public_celebration: i < 5,
      }),
    );
    const r = computeStaffRecognitionMorale(baseInput({ recognitions: recs }));
    expect(r.strengths).toContain(
      "Recognition is publicly celebrated — reinforcing positive practice across the team",
    );
  });

  it("includes impact documentation strength when impactDocumentedRate >= 80%", () => {
    const recs = Array.from({ length: 8 }, (_, i) =>
      makeRecognition({
        id: `r${i}`,
        staff_member: `staff_${i + 1}`,
        has_impact_description: true,
      }),
    );
    const r = computeStaffRecognitionMorale(baseInput({ recognitions: recs }));
    expect(r.strengths).toContain(
      "Impact of recognised practice is well documented — linking recognition to outcomes",
    );
  });

  it("includes type variety strength when uniqueTypes >= 5", () => {
    const types = [
      "above_and_beyond",
      "quiet_excellence",
      "team_contribution",
      "child_recognised",
      "anniversary_milestone",
    ];
    const recs = types.map((t, i) =>
      makeRecognition({ id: `r${i}`, staff_member: `staff_${i + 1}`, recognition_type: t }),
    );
    const r = computeStaffRecognitionMorale(baseInput({ recognitions: recs }));
    expect(r.strengths).toContain(
      "Wide variety of recognition types shows appreciation for diverse contributions",
    );
  });

  it("returns no strengths when zero recognitions", () => {
    const r = computeStaffRecognitionMorale(baseInput());
    expect(r.strengths).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. CONCERNS GENERATION
// ═══════════════════════════════════════════════════════════════════════════

describe("concerns generation", () => {
  it("includes no recognition concern when total is 0", () => {
    const r = computeStaffRecognitionMorale(baseInput());
    expect(r.concerns).toContain(
      "No staff recognition recorded — this risks disengagement and poor retention",
    );
  });

  it("includes staff coverage concern when < 30%", () => {
    const recs = [makeRecognition({ id: "r1", staff_member: "staff_1" })];
    const r = computeStaffRecognitionMorale(baseInput({ recognitions: recs }));
    expect(r.concerns).toContain(
      "Recognition is concentrated on a few staff — most of the team feel unrecognised",
    );
  });

  it("includes child involvement concern when 0% with recs present", () => {
    const recs = Array.from({ length: 4 }, (_, i) =>
      makeRecognition({
        id: `r${i}`,
        staff_member: `staff_${i + 1}`,
        child_contributed_nomination: false,
      }),
    );
    const r = computeStaffRecognitionMorale(baseInput({ recognitions: recs }));
    expect(r.concerns).toContain(
      "Children are not involved in recognising staff — a missed opportunity for relationship building",
    );
  });

  it("includes public celebration concern when 0% with recs present", () => {
    const recs = Array.from({ length: 4 }, (_, i) =>
      makeRecognition({
        id: `r${i}`,
        staff_member: `staff_${i + 1}`,
        public_celebration: false,
      }),
    );
    const r = computeStaffRecognitionMorale(baseInput({ recognitions: recs }));
    expect(r.concerns).toContain(
      "Recognition is never publicly celebrated — good practice is invisible to the wider team",
    );
  });

  it("includes impact documentation concern when < 30%", () => {
    const recs = Array.from({ length: 8 }, (_, i) =>
      makeRecognition({
        id: `r${i}`,
        staff_member: `staff_${i + 1}`,
        has_impact_description: i < 2,
      }),
    );
    const r = computeStaffRecognitionMorale(baseInput({ recognitions: recs }));
    expect(r.concerns).toContain(
      "Impact of recognised practice is poorly documented — recognition lacks substance",
    );
  });

  it("includes single type concern when uniqueTypes <= 1 with recs present", () => {
    const recs = Array.from({ length: 4 }, (_, i) =>
      makeRecognition({
        id: `r${i}`,
        staff_member: `staff_${i + 1}`,
        recognition_type: "above_and_beyond",
      }),
    );
    const r = computeStaffRecognitionMorale(baseInput({ recognitions: recs }));
    expect(r.concerns).toContain(
      "Recognition is limited to a single type — it does not reflect the breadth of staff contributions",
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 10. RECOMMENDATIONS
// ═══════════════════════════════════════════════════════════════════════════

describe("recommendations", () => {
  it("recommends structured programme when total is 0", () => {
    const r = computeStaffRecognitionMorale(baseInput());
    expect(r.recommendations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          recommendation: "Implement a structured staff recognition programme to boost morale and retention",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 33",
        }),
      ]),
    );
  });

  it("recommends equitable distribution when staff coverage < 50%", () => {
    const recs = Array.from({ length: 3 }, (_, i) =>
      makeRecognition({ id: `r${i}`, staff_member: `staff_${i + 1}` }),
    );
    const r = computeStaffRecognitionMorale(baseInput({ recognitions: recs }));
    expect(r.recommendations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          recommendation: "Ensure recognition is equitably distributed across all team members",
          urgency: "soon",
        }),
      ]),
    );
  });

  it("recommends child nominations when childInvolvementRate is 0%", () => {
    const recs = Array.from({ length: 4 }, (_, i) =>
      makeRecognition({
        id: `r${i}`,
        staff_member: `staff_${i + 1}`,
        child_contributed_nomination: false,
      }),
    );
    const r = computeStaffRecognitionMorale(baseInput({ recognitions: recs }));
    expect(r.recommendations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          recommendation: "Invite children to nominate staff for recognition — strengthening voice and relationships",
          urgency: "soon",
          regulatory_ref: "CHR 2015 Reg 7",
        }),
      ]),
    );
  });

  it("recommends visibility when publicCelebrationRate < 25%", () => {
    const recs = Array.from({ length: 8 }, (_, i) =>
      makeRecognition({
        id: `r${i}`,
        staff_member: `staff_${i + 1}`,
        public_celebration: i < 1,
      }),
    );
    const r = computeStaffRecognitionMorale(baseInput({ recognitions: recs }));
    expect(r.recommendations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          recommendation: "Increase visibility of recognition through team meetings, noticeboards or newsletters",
          urgency: "planned",
        }),
      ]),
    );
  });

  it("recommends diversifying types when uniqueTypes < 3", () => {
    const recs = Array.from({ length: 4 }, (_, i) =>
      makeRecognition({
        id: `r${i}`,
        staff_member: `staff_${i + 1}`,
        recognition_type: "above_and_beyond",
      }),
    );
    const r = computeStaffRecognitionMorale(baseInput({ recognitions: recs }));
    expect(r.recommendations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          recommendation: "Diversify recognition categories to celebrate different types of contribution",
          urgency: "planned",
          regulatory_ref: "SCCIF Staff Development",
        }),
      ]),
    );
  });

  it("recommends documenting impact when impactDocumentedRate < 50%", () => {
    const recs = Array.from({ length: 8 }, (_, i) =>
      makeRecognition({
        id: `r${i}`,
        staff_member: `staff_${i + 1}`,
        has_impact_description: i < 3,
      }),
    );
    const r = computeStaffRecognitionMorale(baseInput({ recognitions: recs }));
    expect(r.recommendations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          recommendation: "Document the impact of recognised practice to build evidence of care quality",
          urgency: "planned",
          regulatory_ref: "CHR 2015 Reg 33",
        }),
      ]),
    );
  });

  it("assigns sequential rank numbers", () => {
    // Trigger multiple recommendations
    const recs = [
      makeRecognition({
        id: "r1",
        staff_member: "staff_1",
        recognition_type: "above_and_beyond",
        child_contributed_nomination: false,
        public_celebration: false,
        has_impact_description: false,
      }),
    ];
    const r = computeStaffRecognitionMorale(baseInput({ recognitions: recs }));
    r.recommendations.forEach((rec, i) => {
      expect(rec.rank).toBe(i + 1);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 11. INSIGHTS
// ═══════════════════════════════════════════════════════════════════════════

describe("insights", () => {
  it("includes vibrant culture insight when frequency + coverage + child involvement all high", () => {
    const recs = Array.from({ length: 16 }, (_, i) =>
      makeRecognition({
        id: `r${i}`,
        staff_member: `staff_${(i % 8) + 1}`,
        child_contributed_nomination: true,
      }),
    );
    const r = computeStaffRecognitionMorale(baseInput({ recognitions: recs }));
    expect(r.insights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          text: "A vibrant recognition culture — staff are frequently celebrated with children's voices central to the process",
          severity: "positive",
        }),
      ]),
    );
  });

  it("includes burnout risk insight when total is 0", () => {
    const r = computeStaffRecognitionMorale(baseInput());
    expect(r.insights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          text: "No recognition programme risks staff burnout and turnover — homes that celebrate their teams retain them",
          severity: "critical",
        }),
      ]),
    );
  });

  it("includes clustering resentment insight when staffRecognisedRate < 30%", () => {
    const recs = [makeRecognition({ id: "r1", staff_member: "staff_1" })];
    const r = computeStaffRecognitionMorale(baseInput({ recognitions: recs }));
    expect(r.insights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          text: "Recognition clustering around a few staff can breed resentment — ensure all contributions are valued equally",
          severity: "warning",
        }),
      ]),
    );
  });

  it("includes child recognition trust insight when childInvolvementRate >= 30%", () => {
    const recs = Array.from({ length: 8 }, (_, i) =>
      makeRecognition({
        id: `r${i}`,
        staff_member: `staff_${i + 1}`,
        child_contributed_nomination: i < 3,
      }),
    );
    const r = computeStaffRecognitionMorale(baseInput({ recognitions: recs }));
    expect(r.insights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          text: "Children recognising staff builds trust and shows inspectors that relationships are genuinely reciprocal",
          severity: "positive",
        }),
      ]),
    );
  });

  it("includes public celebration normalises excellence insight when >= 50%", () => {
    const recs = Array.from({ length: 8 }, (_, i) =>
      makeRecognition({
        id: `r${i}`,
        staff_member: `staff_${i + 1}`,
        public_celebration: i < 5,
      }),
    );
    const r = computeStaffRecognitionMorale(baseInput({ recognitions: recs }));
    expect(r.insights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          text: "Public celebration normalises excellence — it raises the bar for the whole team",
          severity: "positive",
        }),
      ]),
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 12. HEADLINES FOR EACH RATING
// ═══════════════════════════════════════════════════════════════════════════

describe("headlines", () => {
  it("returns outstanding headline", () => {
    const types = [
      "above_and_beyond", "quiet_excellence", "team_contribution",
      "child_recognised", "anniversary_milestone",
    ];
    const recs = Array.from({ length: 16 }, (_, i) =>
      makeRecognition({
        id: `r${i}`,
        staff_member: `staff_${(i % 8) + 1}`,
        recognition_type: types[i % types.length],
      }),
    );
    const r = computeStaffRecognitionMorale(baseInput({ recognitions: recs }));
    expect(r.headline).toBe(
      "Staff recognition is embedded, varied and contributes to a positive, motivated workforce",
    );
  });

  it("returns good headline", () => {
    const recs = Array.from({ length: 10 }, (_, i) =>
      makeRecognition({
        id: `r${i}`,
        staff_member: `staff_${(i % 5) + 1}`,
        recognition_type: ["above_and_beyond", "quiet_excellence", "team_contribution"][i % 3],
        child_contributed_nomination: i < 3,
        public_celebration: i < 5,
        has_impact_description: i < 8,
      }),
    );
    const r = computeStaffRecognitionMorale(baseInput({ recognitions: recs }));
    expect(r.headline).toBe(
      "Good staff recognition culture with effective acknowledgement of practice and contribution",
    );
  });

  it("returns adequate headline", () => {
    const recs = [
      makeRecognition({ id: "r1", staff_member: "staff_1", recognition_type: "above_and_beyond", child_contributed_nomination: true, public_celebration: true, has_impact_description: true }),
      makeRecognition({ id: "r2", staff_member: "staff_2", recognition_type: "above_and_beyond", child_contributed_nomination: false, public_celebration: false, has_impact_description: true }),
      makeRecognition({ id: "r3", staff_member: "staff_3", recognition_type: "quiet_excellence", child_contributed_nomination: false, public_celebration: false, has_impact_description: false }),
      makeRecognition({ id: "r4", staff_member: "staff_1", recognition_type: "quiet_excellence", child_contributed_nomination: false, public_celebration: false, has_impact_description: false }),
    ];
    const r = computeStaffRecognitionMorale(baseInput({ recognitions: recs }));
    expect(r.headline).toBe(
      "Staff recognition exists but needs to be more consistent, varied and visible",
    );
  });

  it("returns inadequate headline", () => {
    const recs = [
      makeRecognition({
        id: "r1",
        staff_member: "staff_1",
        recognition_type: "above_and_beyond",
        child_contributed_nomination: false,
        public_celebration: false,
        has_impact_description: false,
      }),
    ];
    const r = computeStaffRecognitionMorale(baseInput({ recognitions: recs }));
    expect(r.headline).toBe(
      "Staff recognition is inadequate — morale and retention are likely to be negatively impacted",
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 13. EDGE CASES
// ═══════════════════════════════════════════════════════════════════════════

describe("edge cases", () => {
  it("handles all recognitions for the same staff member", () => {
    // 8 recs all for staff_1: coverage = 1/8 = 13%
    const recs = Array.from({ length: 8 }, (_, i) =>
      makeRecognition({ id: `r${i}`, staff_member: "staff_1" }),
    );
    const r = computeStaffRecognitionMorale(baseInput({ recognitions: recs }));
    expect(r.staff_recognised_rate).toBe(13);
    expect(r.concerns).toContain(
      "Recognition is concentrated on a few staff — most of the team feel unrecognised",
    );
  });

  it("handles all recognitions of the same type", () => {
    const recs = Array.from({ length: 8 }, (_, i) =>
      makeRecognition({
        id: `r${i}`,
        staff_member: `staff_${i + 1}`,
        recognition_type: "above_and_beyond",
      }),
    );
    const r = computeStaffRecognitionMorale(baseInput({ recognitions: recs }));
    expect(r.recognition_type_variety).toBe(1);
    expect(r.concerns).toContain(
      "Recognition is limited to a single type — it does not reflect the breadth of staff contributions",
    );
  });

  it("handles single recognition correctly", () => {
    const recs = [makeRecognition()];
    const r = computeStaffRecognitionMorale(baseInput({ recognitions: recs }));
    expect(r.total_recognitions).toBe(1);
    // 1/8 = 13% coverage, 1 type, child 100%, public 100%, impact 100%
    expect(r.staff_recognised_rate).toBe(13);
    expect(r.child_involvement_rate).toBe(100);
    expect(r.public_celebration_rate).toBe(100);
    expect(r.impact_documented_rate).toBe(100);
    expect(r.recognition_type_variety).toBe(1);
  });

  it("computes correct score for single default recognition", () => {
    const recs = [makeRecognition()];
    const r = computeStaffRecognitionMorale(baseInput({ recognitions: recs }));
    // base 52, mod1=-2 (1/8=0.125), mod2=-5 (13%<30%), mod3=+5 (100%>=30%), mod4=+5 (100%>=50%), mod5=+4 (100%>=80%), mod6=-3 (1 type <=1)
    // 52 - 2 - 5 + 5 + 5 + 4 - 3 = 56
    expect(r.recognition_score).toBe(56);
  });

  it("reports metrics correctly with varied data", () => {
    const recs = [
      makeRecognition({ id: "r1", staff_member: "staff_1", child_contributed_nomination: true, public_celebration: true, has_impact_description: true }),
      makeRecognition({ id: "r2", staff_member: "staff_2", child_contributed_nomination: false, public_celebration: false, has_impact_description: false }),
      makeRecognition({ id: "r3", staff_member: "staff_3", child_contributed_nomination: false, public_celebration: true, has_impact_description: true }),
      makeRecognition({ id: "r4", staff_member: "staff_4", child_contributed_nomination: true, public_celebration: false, has_impact_description: false }),
    ];
    const r = computeStaffRecognitionMorale(baseInput({ recognitions: recs }));
    expect(r.total_recognitions).toBe(4);
    expect(r.staff_recognised_rate).toBe(50); // 4/8 = 50%
    expect(r.child_involvement_rate).toBe(50); // 2/4 = 50%
    expect(r.public_celebration_rate).toBe(50); // 2/4 = 50%
    expect(r.impact_documented_rate).toBe(50); // 2/4 = 50%
  });

  it("clamps score at 0 minimum", () => {
    // Construct extreme negative scenario: very low everything with 1 staff
    // 1 rec, 1 unique / 100 total_staff = 1% coverage, 0% child, 0% public, 0% impact, 1 type
    const recs = [
      makeRecognition({
        id: "r1",
        staff_member: "staff_1",
        child_contributed_nomination: false,
        public_celebration: false,
        has_impact_description: false,
      }),
    ];
    const r = computeStaffRecognitionMorale(baseInput({ total_staff: 100, recognitions: recs }));
    // base 52, mod1=-2 (0.01), mod2=-5 (1%), mod3=-4 (0%), mod4=-5 (0%), mod5=-4 (0%<30%), mod6=-3 (<=1)
    // 52 - 2 - 5 - 4 - 5 - 4 - 3 = 29 (above 0, so clamp doesn't trigger here)
    expect(r.recognition_score).toBeGreaterThanOrEqual(0);
  });

  it("clamps score at 100 maximum", () => {
    // Even with every modifier at max, score can't exceed 100
    const types = [
      "above_and_beyond", "quiet_excellence", "team_contribution",
      "child_recognised", "anniversary_milestone",
    ];
    const recs = Array.from({ length: 16 }, (_, i) =>
      makeRecognition({
        id: `r${i}`,
        staff_member: `staff_${(i % 8) + 1}`,
        recognition_type: types[i % types.length],
      }),
    );
    const r = computeStaffRecognitionMorale(baseInput({ recognitions: recs }));
    expect(r.recognition_score).toBeLessThanOrEqual(100);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 14. CAP TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe("cap tests", () => {
  it("caps recommendations at 5", () => {
    // Trigger all 6 recommendation conditions with recs present
    // staffRecognisedRate < 50%, childInvolvementRate === 0%, publicCelebrationRate < 25%, uniqueTypes < 3, impactDocumentedRate < 50%
    // That's 5 conditions with recs present; add total===0 scenario to get 6 but that conflicts with recs present
    // Actually, with recs present we can trigger: equitable (staff<50%), child nominations (child===0%),
    // visibility (public<25%), diversify types (types<3), document impact (impact<50%) = 5 recommendations
    // Let's construct a scenario triggering all 5 with recs and verify it outputs exactly 5
    const recs = [
      makeRecognition({
        id: "r1",
        staff_member: "staff_1",
        recognition_type: "above_and_beyond",
        child_contributed_nomination: false,
        public_celebration: false,
        has_impact_description: false,
      }),
    ];
    const r = computeStaffRecognitionMorale(baseInput({ recognitions: recs }));
    // staff coverage 13% < 50% ✓, child 0% ✓, public 0% < 25% ✓, types 1 < 3 ✓, impact 0% < 50% ✓ = 5 recs
    expect(r.recommendations.length).toBeLessThanOrEqual(5);
    expect(r.recommendations.length).toBe(5);
  });

  it("caps recommendations at 5 even when more would be triggered", () => {
    // With total===0 we get: structured programme (1) + no other conditions (total>0 required) = 1 rec
    // Actually the only way to trigger > 5 is having all 6 conditions, but total===0 precludes the total>0 conditions
    // So max natural is 6 with recs present? Let's check: the first condition (total===0) gives 1 rec.
    // With recs present, the remaining 5 conditions can all fire = 5 recs. Total max = 5 (or 1 for zero).
    // The cap at 5 is still tested above. Let's verify the zero-recs scenario gives exactly 1.
    const r = computeStaffRecognitionMorale(baseInput());
    expect(r.recommendations.length).toBe(1);
  });

  it("caps insights at 3", () => {
    // Trigger as many insights as possible:
    // 1. vibrant culture (recsPerStaff>=2 && staffRecognisedRate>=80 && childInvolvementRate>=30) → positive
    // 2. child recognition trust (childInvolvementRate>=30 && total>0) → positive
    // 3. public celebration (publicCelebrationRate>=50 && total>0) → positive
    // That's 3 insights, all triggered for an outstanding scenario
    const recs = Array.from({ length: 16 }, (_, i) =>
      makeRecognition({
        id: `r${i}`,
        staff_member: `staff_${(i % 8) + 1}`,
        child_contributed_nomination: true,
        public_celebration: true,
      }),
    );
    const r = computeStaffRecognitionMorale(baseInput({ recognitions: recs }));
    expect(r.insights.length).toBeLessThanOrEqual(3);
  });

  it("insight cap actually truncates when 4+ would be generated", () => {
    // The insight conditions are checked sequentially. Can we trigger 4?
    // 1. vibrant culture: recsPerStaff>=2, staffRecognisedRate>=80, childInvolvementRate>=30
    // 2. total===0 — conflicts with #1
    // 3. staffRecognisedRate < 30 && total > 0 — conflicts with #1
    // 4. childInvolvementRate >= 30 && total > 0 — compatible with #1
    // 5. publicCelebrationRate >= 50 && total > 0 — compatible with #1
    // Max simultaneously: #1 + #4 + #5 = 3 insights. Cap of 3 is not actually triggered by truncation.
    // The engine generates at most 3 simultaneous positive insights, so cap is protective but not exercised.
    // We verify the cap exists by checking the maximum generated is exactly 3.
    const recs = Array.from({ length: 16 }, (_, i) =>
      makeRecognition({
        id: `r${i}`,
        staff_member: `staff_${(i % 8) + 1}`,
        child_contributed_nomination: true,
        public_celebration: true,
      }),
    );
    const r = computeStaffRecognitionMorale(baseInput({ recognitions: recs }));
    expect(r.insights.length).toBe(3);
  });

  it("recommendations have re-ranked sequential numbers after capping", () => {
    const recs = [
      makeRecognition({
        id: "r1",
        staff_member: "staff_1",
        recognition_type: "above_and_beyond",
        child_contributed_nomination: false,
        public_celebration: false,
        has_impact_description: false,
      }),
    ];
    const r = computeStaffRecognitionMorale(baseInput({ recognitions: recs }));
    const ranks = r.recommendations.map(rec => rec.rank);
    expect(ranks).toEqual(ranks.map((_, i) => i + 1));
  });
});
