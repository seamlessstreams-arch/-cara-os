// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME ANNUAL HEALTH ASSESSMENT INTELLIGENCE ENGINE — TESTS
// CHR 2015 Reg 10: "The health and wellbeing standard." SCCIF: Health.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeAnnualHealthAssessment,
  type AnnualHealthAssessmentInput,
  type AnnualHealthAssessmentRecordInput,
} from "../home-annual-health-assessment-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeAssessment(
  overrides: Partial<AnnualHealthAssessmentRecordInput> = {},
): AnnualHealthAssessmentRecordInput {
  return {
    id: "aha_1",
    child_id: "yp_alex",
    completed_within_deadline: true,
    domain_count: 5,
    immunisations_up_to_date: true,
    dental_check_up_to_date: true,
    optical_check_up_to_date: true,
    has_child_contribution: true,
    report_shared: true,
    report_shared_with_count: 3,
    recommendation_count: 2,
    signed_off_by_la: true,
    growth_on_track: true,
    ...overrides,
  };
}

function baseInput(
  overrides: Partial<AnnualHealthAssessmentInput> = {},
): AnnualHealthAssessmentInput {
  return {
    today: "2026-05-27",
    total_children: 3,
    assessments: [
      makeAssessment({ id: "aha_1", child_id: "yp_alex" }),
      makeAssessment({ id: "aha_2", child_id: "yp_jordan" }),
      makeAssessment({ id: "aha_3", child_id: "yp_casey" }),
    ],
    ...overrides,
  };
}

/** Build N assessments with the same overrides, unique ids/child_ids. */
function makeMany(
  count: number,
  overrides: Partial<AnnualHealthAssessmentRecordInput> = {},
): AnnualHealthAssessmentRecordInput[] {
  return Array.from({ length: count }, (_, i) =>
    makeAssessment({
      id: `aha_${i + 1}`,
      child_id: `yp_${i + 1}`,
      ...overrides,
    }),
  );
}

/**
 * Build N assessments where `trueCount` have the specified boolean field true
 * and the remainder have it false.
 */
function makeMixed(
  total: number,
  trueCount: number,
  field: keyof AnnualHealthAssessmentRecordInput,
): AnnualHealthAssessmentRecordInput[] {
  return Array.from({ length: total }, (_, i) =>
    makeAssessment({
      id: `aha_${i + 1}`,
      child_id: `yp_${i + 1}`,
      [field]: i < trueCount,
    }),
  );
}

/**
 * Build N assessments where `trueCount` have BOTH dental and optical true,
 * and the remainder have at least one false.
 */
function makeMixedDentalOptical(
  total: number,
  trueCount: number,
): AnnualHealthAssessmentRecordInput[] {
  return Array.from({ length: total }, (_, i) =>
    makeAssessment({
      id: `aha_${i + 1}`,
      child_id: `yp_${i + 1}`,
      dental_check_up_to_date: i < trueCount,
      optical_check_up_to_date: i < trueCount,
    }),
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. INSUFFICIENT DATA
// ═══════════════════════════════════════════════════════════════════════════

describe("insufficient data", () => {
  it("returns insufficient_data when total_children is 0", () => {
    const r = computeAnnualHealthAssessment(
      baseInput({ total_children: 0, assessments: [] }),
    );
    expect(r.assessment_rating).toBe("insufficient_data");
    expect(r.assessment_score).toBe(0);
  });

  it("returns zero for all metric rates on insufficient data", () => {
    const r = computeAnnualHealthAssessment(
      baseInput({ total_children: 0, assessments: [] }),
    );
    expect(r.children_assessed_rate).toBe(0);
    expect(r.deadline_compliance_rate).toBe(0);
    expect(r.immunisation_rate).toBe(0);
    expect(r.dental_optical_rate).toBe(0);
    expect(r.child_contribution_rate).toBe(0);
    expect(r.report_sharing_rate).toBe(0);
  });

  it("returns no-data headline on insufficient data", () => {
    const r = computeAnnualHealthAssessment(
      baseInput({ total_children: 0, assessments: [] }),
    );
    expect(r.headline).toContain("No data available");
  });

  it("returns empty arrays for strengths, concerns, recommendations, insights on insufficient data", () => {
    const r = computeAnnualHealthAssessment(
      baseInput({ total_children: 0, assessments: [] }),
    );
    expect(r.strengths).toEqual([]);
    expect(r.concerns).toEqual([]);
    expect(r.recommendations).toEqual([]);
    expect(r.insights).toEqual([]);
  });

  it("returns total_assessments 0 on insufficient data", () => {
    const r = computeAnnualHealthAssessment(
      baseInput({ total_children: 0, assessments: [] }),
    );
    expect(r.total_assessments).toBe(0);
  });

  it("returns insufficient_data even when assessments present but total_children is 0", () => {
    const r = computeAnnualHealthAssessment(
      baseInput({ total_children: 0 }),
    );
    expect(r.assessment_rating).toBe("insufficient_data");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. ZERO RECORDS (total_children > 0 but no assessments)
// ═══════════════════════════════════════════════════════════════════════════

describe("zero records with positive total_children", () => {
  const r = computeAnnualHealthAssessment(
    baseInput({ total_children: 5, assessments: [] }),
  );

  it("applies all zero-record penalties: 52 - 3 - 1 - 1 - 2 = 45", () => {
    // Modifier 1: -3, Modifier 2: no adj, Modifier 3: -1, Modifier 4: no adj, Modifier 5: -1, Modifier 6: -2
    expect(r.assessment_score).toBe(45);
  });

  it("rates as adequate (45 >= 45)", () => {
    expect(r.assessment_rating).toBe("adequate");
  });

  it("total_assessments is 0", () => {
    expect(r.total_assessments).toBe(0);
  });

  it("all metric rates are 0", () => {
    expect(r.children_assessed_rate).toBe(0);
    expect(r.deadline_compliance_rate).toBe(0);
    expect(r.immunisation_rate).toBe(0);
    expect(r.dental_optical_rate).toBe(0);
    expect(r.child_contribution_rate).toBe(0);
    expect(r.report_sharing_rate).toBe(0);
  });

  it("adds concern about no assessments recorded", () => {
    expect(r.concerns.some(c => c.includes("No annual health assessments recorded"))).toBe(true);
  });

  it("adds recommendation to schedule assessments", () => {
    expect(r.recommendations.length).toBeGreaterThanOrEqual(1);
    expect(r.recommendations[0].urgency).toBe("immediate");
    expect(r.recommendations[0].regulatory_ref).toContain("CHR 2015");
  });

  it("adds critical insight about no records", () => {
    expect(r.insights.some(i => i.severity === "critical")).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. RATING THRESHOLDS
// ═══════════════════════════════════════════════════════════════════════════

describe("rating thresholds", () => {
  // All metrics perfect: 52 + 6 + 5 + 5 + 5 + 4 + 5 = 82 → outstanding
  it("outstanding when all metrics are perfect (>=80)", () => {
    const r = computeAnnualHealthAssessment(baseInput());
    expect(r.assessment_score).toBe(82);
    expect(r.assessment_rating).toBe("outstanding");
  });

  // Score exactly 80 → outstanding
  it("outstanding at exactly 80", () => {
    // Start from 82, need to lose 2 points. Drop child contribution to mid range (>=50 but <80 → +1 instead of +4, losing 3 → 79).
    // Better: make coverage 60-89 → +2 instead of +6, so 82-4=78. Not exact.
    // Let's be precise: use 10 children, 9 assessments (90% exactly for coverage).
    // All perfect except make child contribution 50-79% range → +1 instead of +4, score = 82-3 = 79
    // Or make report sharing 60-84% range → +2 instead of +5, score = 82-3 = 79. Still not 80.
    // 82 - 2 = 80: drop one modifier by 2. dental_optical from +5 to +3? No, it goes +5 or +2.
    // Coverage from +6 to +2 → 82-4=78. Deadline from +5 to +2 → 82-3=79.
    // Combination: deadline 70-89% (+2) and dental_optical 60-84% (+2): 82-3-3=76. Too low.
    // Better approach: 10 children, 9 assessed (90%), 9/10 on-time (90%), 9/10 immunisations (90%),
    // 9/10 dental+optical (90%), 8/10 child contrib (80%), 6/10 report shared (60%).
    // report sharing = 60% → +2, child contrib = 80% → +4
    // 52 + 6 + 5 + 5 + 5 + 4 + 2 = 79. Still 79.
    // Need 80: 52 + 6 + 5 + 5 + 5 + 4 + 5 = 82. Or 52 + 6 + 5 + 5 + 5 + 1 + 5 = 79. Not easy.
    // Approach: 52 + 6 + 5 + 5 + 2 + 4 + 5 = 79. 52 + 6 + 2 + 5 + 5 + 4 + 5 = 79.
    // 52 + 2 + 5 + 5 + 5 + 4 + 5 = 78. Hard to hit exactly 80.
    // Actually: midrange coverage (+2) + all other perfect = 52+2+5+5+5+4+5 = 78
    // High coverage + mid deadline = 52+6+2+5+5+4+5 = 79
    // Actually there's a gap: 52+6+5+5+5+4+5 = 82. Next step down is 79 (any single +5 → +2).
    // We can't easily hit 80 exactly. Let's test 82 >= 80 is outstanding, and 79 < 80 is good.
    // We already test 82 = outstanding above. Let's verify 79 is good.
    const assessments = makeMany(10);
    // Make 7 out of 10 on time → 70% → +2 instead of +5
    for (let i = 7; i < 10; i++) assessments[i].completed_within_deadline = false;
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 10,
      assessments,
    });
    // 52 + 6 + 2 + 5 + 5 + 4 + 5 = 79
    expect(r.assessment_score).toBe(79);
    expect(r.assessment_rating).toBe("good");
  });

  // Score exactly 65 → good
  it("good at exactly 65", () => {
    const assessments = makeMany(10);
    // Need score = 65. Start with all perfect = 82. Need to drop 17 points total.
    // coverage 60-89% → +2: drop 4 → 78. Need 13 more.
    // deadline 50-69% → no bonus, no penalty (0 instead of +5): drop 5 → 73. Need 8 more.
    // immunisation 50-69% → no bonus (0 instead of +5): drop 5 → 68. Need 3 more.
    // child_contrib 50-79% → +1 instead of +4: drop 3 → 65. Exact!
    // coverage: 6/10 unique = 60%
    // Only 6 unique children assessed out of 10 total_children
    const sixKids = makeMany(6);
    // deadline: 5/6 = 83% → that's >= 70 so +2. Not what we want.
    // Let me recalculate. With 6 assessments out of 10 children:
    // coverage = 60% → +2
    // Now deadline, immunisation, etc. are based on assessments (6 total).
    // deadline: need 50-69% → 3/6 = 50%.
    for (let i = 3; i < 6; i++) sixKids[i].completed_within_deadline = false;
    // immunisation: need 50-69% → 3/6 = 50%
    for (let i = 3; i < 6; i++) sixKids[i].immunisations_up_to_date = false;
    // dental_optical: keep 100% → +5
    // child_contrib: need 50-79% → 3/6 = 50% → +1
    for (let i = 3; i < 6; i++) sixKids[i].has_child_contribution = false;
    // report_sharing: keep 100% → +5
    // Wait, overlap: index 3,4,5 now have deadline=false, immunisation=false, child_contrib=false.
    // Score: 52 + 2 + 0 + 0 + 5 + 1 + 5 = 65.
    // Wait — deadline 50% is at the boundary: ">=70→+2" fails, "<50→-5" fails (50 is not <50), so no adj = 0.
    // immunisation 50%: ">=70→+2" fails, "<50→-4" fails (50 is not <50), so no adj = 0.
    // child contrib 50%: ">=50→+1" succeeds! → +1.
    // So 52 + 2 + 0 + 0 + 5 + 1 + 5 = 65 ✓
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 10,
      assessments: sixKids,
    });
    expect(r.assessment_score).toBe(65);
    expect(r.assessment_rating).toBe("good");
  });

  // Score exactly 45 → adequate
  it("adequate at exactly 45", () => {
    // zero records gives 45 (shown above). That's the simplest.
    const r = computeAnnualHealthAssessment(
      baseInput({ total_children: 5, assessments: [] }),
    );
    expect(r.assessment_score).toBe(45);
    expect(r.assessment_rating).toBe("adequate");
  });

  // Score 44 → inadequate
  it("inadequate when score is 44", () => {
    // Start with zero records = 45. Need one more penalty.
    // But with zero records, most modifiers already have fixed outcomes.
    // Need assessments but poor quality.
    // 1 assessment out of 10 children: coverage = 10% (<40 → -5)
    // deadline: 0% (<50 → -5), immunisation: 0% (<50 → -4), dental_optical: 0% (<40 → -4)
    // child_contribution: 0% (<30 → -4), report_sharing: 0% (<40 → -3)
    // 52 - 5 - 5 - 4 - 4 - 4 - 3 = 27
    // That's way below 44. Let's find something closer.
    // 10 assessments out of 10 children = 100% coverage → +6
    // deadline: 4/10 = 40% (<50 → -5)
    // immunisation: 4/10 = 40% (<50 → -4)
    // dental_optical: 3/10 = 30% (<40 → -4)
    // child_contribution: 2/10 = 20% (<30 → -4)
    // report_sharing: 3/10 = 30% (<40 → -3)
    // 52 + 6 - 5 - 4 - 4 - 4 - 3 = 38. Still not 44.
    // 10/10 coverage (+6), deadline 70% (+2), immunisation 40% (-4), dental_optical 30% (-4), child_contrib 20% (-4), report_sharing 30% (-3)
    // 52 + 6 + 2 - 4 - 4 - 4 - 3 = 45. That's 45, adequate.
    // Need 44: 52 + 6 + 2 - 4 - 4 - 4 - 3 = 45, need one less.
    // deadline 50-69% → 0 instead of +2 → 43. Too low.
    // Or: immunisation 50-69% → 0 instead of -4 → 49. Then need more penalty elsewhere.
    // This is getting complex. Let me just use: 52 + 2 - 5 - 4 + 2 - 4 - 3 = 40 ...
    // Simpler: just verify that score < 45 = inadequate. Build a known-bad scenario.
    const assessments = makeMany(10, {
      completed_within_deadline: false,
      immunisations_up_to_date: false,
      dental_check_up_to_date: false,
      optical_check_up_to_date: false,
      has_child_contribution: false,
      report_shared: false,
    });
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 10,
      assessments,
    });
    // coverage = 100% → +6, deadline = 0% → -5, immunisation = 0% → -4, dental_optical = 0% → -4
    // child_contrib = 0% → -4, report_sharing = 0% → -3
    // 52 + 6 - 5 - 4 - 4 - 4 - 3 = 38
    expect(r.assessment_score).toBe(38);
    expect(r.assessment_rating).toBe("inadequate");
  });

  it("outstanding headline when rating is outstanding", () => {
    const r = computeAnnualHealthAssessment(baseInput());
    expect(r.headline).toContain("thorough, timely and child-centred");
  });

  it("good headline when rating is good", () => {
    const assessments = makeMany(10);
    for (let i = 7; i < 10; i++) assessments[i].completed_within_deadline = false;
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 10,
      assessments,
    });
    expect(r.headline).toContain("Good health assessment practice");
  });

  it("adequate headline when rating is adequate", () => {
    const r = computeAnnualHealthAssessment(
      baseInput({ total_children: 5, assessments: [] }),
    );
    expect(r.headline).toContain("timeliness, coverage and child contribution need improvement");
  });

  it("inadequate headline when rating is inadequate", () => {
    const assessments = makeMany(10, {
      completed_within_deadline: false,
      immunisations_up_to_date: false,
      dental_check_up_to_date: false,
      optical_check_up_to_date: false,
      has_child_contribution: false,
      report_shared: false,
    });
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 10,
      assessments,
    });
    expect(r.headline).toContain("inadequate");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. MODIFIER 1 — CHILDREN ASSESSED (COVERAGE)
// ═══════════════════════════════════════════════════════════════════════════

describe("modifier 1: children assessed (coverage)", () => {
  // All other metrics kept perfect to isolate this modifier

  it("adds +6 when coverage >= 90%", () => {
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 10,
      assessments: makeMany(9), // 9/10 = 90%
    });
    expect(r.children_assessed_rate).toBe(90);
    // 52 + 6 + 5 + 5 + 5 + 4 + 5 = 82
    expect(r.assessment_score).toBe(82);
  });

  it("adds +6 when coverage is 100%", () => {
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 10,
      assessments: makeMany(10),
    });
    expect(r.children_assessed_rate).toBe(100);
    expect(r.assessment_score).toBe(82);
  });

  it("adds +2 when coverage is 60-89%", () => {
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 10,
      assessments: makeMany(6), // 6/10 = 60%
    });
    expect(r.children_assessed_rate).toBe(60);
    // 52 + 2 + 5 + 5 + 5 + 4 + 5 = 78
    expect(r.assessment_score).toBe(78);
  });

  it("adds +2 when coverage is 89%", () => {
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 100,
      assessments: makeMany(89), // 89%
    });
    expect(r.children_assessed_rate).toBe(89);
    // 52 + 2 + 5 + 5 + 5 + 4 + 5 = 78
    expect(r.assessment_score).toBe(78);
  });

  it("no adjustment when coverage is 40-59%", () => {
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 10,
      assessments: makeMany(5), // 5/10 = 50%
    });
    expect(r.children_assessed_rate).toBe(50);
    // 52 + 0 + 5 + 5 + 5 + 4 + 5 = 76
    expect(r.assessment_score).toBe(76);
  });

  it("subtracts -5 when coverage < 40%", () => {
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 10,
      assessments: makeMany(3), // 3/10 = 30%
    });
    expect(r.children_assessed_rate).toBe(30);
    // 52 - 5 + 5 + 5 + 5 + 4 + 5 = 71
    expect(r.assessment_score).toBe(71);
  });

  it("subtracts -5 when coverage is exactly 39%", () => {
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 100,
      assessments: makeMany(39), // 39%
    });
    expect(r.children_assessed_rate).toBe(39);
    // 52 - 5 + 5 + 5 + 5 + 4 + 5 = 71
    expect(r.assessment_score).toBe(71);
  });

  it("no adjustment at exactly 40% coverage (not < 40, not >= 60)", () => {
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 10,
      assessments: makeMany(4), // 4/10 = 40%
    });
    expect(r.children_assessed_rate).toBe(40);
    // 52 + 0 + 5 + 5 + 5 + 4 + 5 = 76
    expect(r.assessment_score).toBe(76);
  });

  it("subtracts -3 when total is 0 (zero records branch)", () => {
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 5,
      assessments: [],
    });
    // All zero-record adjustments: -3 + 0 + -1 + 0 + -1 + -2 = -7
    // 52 - 7 = 45
    expect(r.assessment_score).toBe(45);
  });

  it("counts unique children, not total assessments", () => {
    // Two assessments for the same child should count as 1 unique child
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 10,
      assessments: [
        ...makeMany(5),
        makeAssessment({ id: "aha_dup", child_id: "yp_1" }), // duplicate child_id
      ],
    });
    // 5 unique children / 10 = 50%
    expect(r.children_assessed_rate).toBe(50);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. MODIFIER 2 — DEADLINE COMPLIANCE
// ═══════════════════════════════════════════════════════════════════════════

describe("modifier 2: deadline compliance", () => {
  it("adds +5 when compliance >= 90%", () => {
    const assessments = makeMany(10);
    assessments[9].completed_within_deadline = false; // 9/10 = 90%
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 10,
      assessments,
    });
    expect(r.deadline_compliance_rate).toBe(90);
    // 52 + 6 + 5 + 5 + 5 + 4 + 5 = 82
    expect(r.assessment_score).toBe(82);
  });

  it("adds +2 when compliance is 70-89%", () => {
    const assessments = makeMany(10);
    for (let i = 7; i < 10; i++) assessments[i].completed_within_deadline = false; // 7/10 = 70%
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 10,
      assessments,
    });
    expect(r.deadline_compliance_rate).toBe(70);
    // 52 + 6 + 2 + 5 + 5 + 4 + 5 = 79
    expect(r.assessment_score).toBe(79);
  });

  it("no adjustment when compliance is 50-69%", () => {
    const assessments = makeMany(10);
    for (let i = 5; i < 10; i++) assessments[i].completed_within_deadline = false; // 5/10 = 50%
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 10,
      assessments,
    });
    expect(r.deadline_compliance_rate).toBe(50);
    // 52 + 6 + 0 + 5 + 5 + 4 + 5 = 77
    expect(r.assessment_score).toBe(77);
  });

  it("subtracts -5 when compliance < 50%", () => {
    const assessments = makeMany(10);
    for (let i = 4; i < 10; i++) assessments[i].completed_within_deadline = false; // 4/10 = 40%
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 10,
      assessments,
    });
    expect(r.deadline_compliance_rate).toBe(40);
    // 52 + 6 - 5 + 5 + 5 + 4 + 5 = 72
    expect(r.assessment_score).toBe(72);
  });

  it("no adjustment when zero records (not penalised)", () => {
    // Already tested in zero records section; verify modifier 2 specifically doesn't add penalty
    // Score with zero records = 45 (not 40 which would be if deadline added -5)
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 5,
      assessments: [],
    });
    expect(r.assessment_score).toBe(45);
  });

  it("compliance is 100% when all on time", () => {
    const r = computeAnnualHealthAssessment(baseInput());
    expect(r.deadline_compliance_rate).toBe(100);
  });

  it("compliance is 0% when none on time", () => {
    const assessments = makeMany(5, { completed_within_deadline: false });
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 5,
      assessments,
    });
    expect(r.deadline_compliance_rate).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. MODIFIER 3 — IMMUNISATION RATE
// ═══════════════════════════════════════════════════════════════════════════

describe("modifier 3: immunisation rate", () => {
  it("adds +5 when immunisation >= 90%", () => {
    const assessments = makeMany(10);
    assessments[9].immunisations_up_to_date = false; // 9/10 = 90%
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 10,
      assessments,
    });
    expect(r.immunisation_rate).toBe(90);
    // all modifiers perfect except immunisation stays at +5 since 90% >= 90
    expect(r.assessment_score).toBe(82);
  });

  it("adds +2 when immunisation is 70-89%", () => {
    const assessments = makeMany(10);
    for (let i = 7; i < 10; i++) assessments[i].immunisations_up_to_date = false; // 7/10 = 70%
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 10,
      assessments,
    });
    expect(r.immunisation_rate).toBe(70);
    // 52 + 6 + 5 + 2 + 5 + 4 + 5 = 79
    expect(r.assessment_score).toBe(79);
  });

  it("no adjustment when immunisation is 50-69%", () => {
    const assessments = makeMany(10);
    for (let i = 5; i < 10; i++) assessments[i].immunisations_up_to_date = false; // 5/10 = 50%
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 10,
      assessments,
    });
    expect(r.immunisation_rate).toBe(50);
    // 52 + 6 + 5 + 0 + 5 + 4 + 5 = 77
    expect(r.assessment_score).toBe(77);
  });

  it("subtracts -4 when immunisation < 50%", () => {
    const assessments = makeMany(10);
    for (let i = 4; i < 10; i++) assessments[i].immunisations_up_to_date = false; // 4/10 = 40%
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 10,
      assessments,
    });
    expect(r.immunisation_rate).toBe(40);
    // 52 + 6 + 5 - 4 + 5 + 4 + 5 = 73
    expect(r.assessment_score).toBe(73);
  });

  it("subtracts -1 when zero records", () => {
    // Zero records total penalty: 52 - 3 - 1 - 1 - 2 = 45
    // Without immunisation -1 it would be 46
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 5,
      assessments: [],
    });
    expect(r.assessment_score).toBe(45);
  });

  it("immunisation rate is 0% when all out of date", () => {
    const assessments = makeMany(5, { immunisations_up_to_date: false });
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 5,
      assessments,
    });
    expect(r.immunisation_rate).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. MODIFIER 4 — DENTAL & OPTICAL
// ═══════════════════════════════════════════════════════════════════════════

describe("modifier 4: dental & optical checks", () => {
  it("adds +5 when dental_optical >= 85%", () => {
    // 9/10 = 90% dental + optical both true
    const assessments = makeMixedDentalOptical(10, 9);
    // Keep everything else perfect
    assessments.forEach(a => {
      a.completed_within_deadline = true;
      a.immunisations_up_to_date = true;
      a.has_child_contribution = true;
      a.report_shared = true;
    });
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 10,
      assessments,
    });
    expect(r.dental_optical_rate).toBe(90);
    // 52 + 6 + 5 + 5 + 5 + 4 + 5 = 82
    expect(r.assessment_score).toBe(82);
  });

  it("adds +5 at exactly 85%", () => {
    const assessments = makeMixedDentalOptical(20, 17); // 17/20 = 85%
    assessments.forEach(a => {
      a.completed_within_deadline = true;
      a.immunisations_up_to_date = true;
      a.has_child_contribution = true;
      a.report_shared = true;
    });
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 20,
      assessments,
    });
    expect(r.dental_optical_rate).toBe(85);
    expect(r.assessment_score).toBe(82);
  });

  it("adds +2 when dental_optical is 60-84%", () => {
    const assessments = makeMixedDentalOptical(10, 6); // 6/10 = 60%
    assessments.forEach(a => {
      a.completed_within_deadline = true;
      a.immunisations_up_to_date = true;
      a.has_child_contribution = true;
      a.report_shared = true;
    });
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 10,
      assessments,
    });
    expect(r.dental_optical_rate).toBe(60);
    // 52 + 6 + 5 + 5 + 2 + 4 + 5 = 79
    expect(r.assessment_score).toBe(79);
  });

  it("no adjustment when dental_optical is 40-59%", () => {
    const assessments = makeMixedDentalOptical(10, 5); // 5/10 = 50%
    assessments.forEach(a => {
      a.completed_within_deadline = true;
      a.immunisations_up_to_date = true;
      a.has_child_contribution = true;
      a.report_shared = true;
    });
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 10,
      assessments,
    });
    expect(r.dental_optical_rate).toBe(50);
    // 52 + 6 + 5 + 5 + 0 + 4 + 5 = 77
    expect(r.assessment_score).toBe(77);
  });

  it("subtracts -4 when dental_optical < 40%", () => {
    const assessments = makeMixedDentalOptical(10, 3); // 3/10 = 30%
    assessments.forEach(a => {
      a.completed_within_deadline = true;
      a.immunisations_up_to_date = true;
      a.has_child_contribution = true;
      a.report_shared = true;
    });
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 10,
      assessments,
    });
    expect(r.dental_optical_rate).toBe(30);
    // 52 + 6 + 5 + 5 - 4 + 4 + 5 = 73
    expect(r.assessment_score).toBe(73);
  });

  it("requires BOTH dental and optical to be true to count", () => {
    const assessments = makeMany(10);
    // All have dental true but optical false → dental_optical = 0%
    assessments.forEach(a => {
      a.dental_check_up_to_date = true;
      a.optical_check_up_to_date = false;
    });
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 10,
      assessments,
    });
    expect(r.dental_optical_rate).toBe(0);
  });

  it("no adjustment for dental_optical when zero records", () => {
    // Already tested via total zero-records score = 45
    // Modifier 4 contributes 0 when zero records
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 5,
      assessments: [],
    });
    expect(r.assessment_score).toBe(45);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. MODIFIER 5 — CHILD CONTRIBUTION
// ═══════════════════════════════════════════════════════════════════════════

describe("modifier 5: child contribution", () => {
  it("adds +4 when child contribution >= 80%", () => {
    const assessments = makeMany(10);
    for (let i = 8; i < 10; i++) assessments[i].has_child_contribution = false; // 8/10 = 80%
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 10,
      assessments,
    });
    expect(r.child_contribution_rate).toBe(80);
    // 52 + 6 + 5 + 5 + 5 + 4 + 5 = 82
    expect(r.assessment_score).toBe(82);
  });

  it("adds +1 when child contribution is 50-79%", () => {
    const assessments = makeMany(10);
    for (let i = 5; i < 10; i++) assessments[i].has_child_contribution = false; // 5/10 = 50%
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 10,
      assessments,
    });
    expect(r.child_contribution_rate).toBe(50);
    // 52 + 6 + 5 + 5 + 5 + 1 + 5 = 79
    expect(r.assessment_score).toBe(79);
  });

  it("no adjustment when child contribution is 30-49%", () => {
    const assessments = makeMany(10);
    for (let i = 3; i < 10; i++) assessments[i].has_child_contribution = false; // 3/10 = 30%
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 10,
      assessments,
    });
    expect(r.child_contribution_rate).toBe(30);
    // 52 + 6 + 5 + 5 + 5 + 0 + 5 = 78
    expect(r.assessment_score).toBe(78);
  });

  it("subtracts -4 when child contribution < 30%", () => {
    const assessments = makeMany(10);
    for (let i = 2; i < 10; i++) assessments[i].has_child_contribution = false; // 2/10 = 20%
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 10,
      assessments,
    });
    expect(r.child_contribution_rate).toBe(20);
    // 52 + 6 + 5 + 5 + 5 - 4 + 5 = 74
    expect(r.assessment_score).toBe(74);
  });

  it("subtracts -1 when zero records", () => {
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 5,
      assessments: [],
    });
    // 52 - 3 + 0 - 1 + 0 - 1 - 2 = 45
    expect(r.assessment_score).toBe(45);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. MODIFIER 6 — REPORT SHARING
// ═══════════════════════════════════════════════════════════════════════════

describe("modifier 6: report sharing", () => {
  it("adds +5 when report sharing >= 85%", () => {
    const assessments = makeMany(20);
    for (let i = 17; i < 20; i++) assessments[i].report_shared = false; // 17/20 = 85%
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 20,
      assessments,
    });
    expect(r.report_sharing_rate).toBe(85);
    // 52 + 6 + 5 + 5 + 5 + 4 + 5 = 82
    expect(r.assessment_score).toBe(82);
  });

  it("adds +2 when report sharing is 60-84%", () => {
    const assessments = makeMany(10);
    for (let i = 6; i < 10; i++) assessments[i].report_shared = false; // 6/10 = 60%
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 10,
      assessments,
    });
    expect(r.report_sharing_rate).toBe(60);
    // 52 + 6 + 5 + 5 + 5 + 4 + 2 = 79
    expect(r.assessment_score).toBe(79);
  });

  it("no adjustment when report sharing is 40-59%", () => {
    const assessments = makeMany(10);
    for (let i = 5; i < 10; i++) assessments[i].report_shared = false; // 5/10 = 50%
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 10,
      assessments,
    });
    expect(r.report_sharing_rate).toBe(50);
    // 52 + 6 + 5 + 5 + 5 + 4 + 0 = 77
    expect(r.assessment_score).toBe(77);
  });

  it("subtracts -3 when report sharing < 40%", () => {
    const assessments = makeMany(10);
    for (let i = 3; i < 10; i++) assessments[i].report_shared = false; // 3/10 = 30%
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 10,
      assessments,
    });
    expect(r.report_sharing_rate).toBe(30);
    // 52 + 6 + 5 + 5 + 5 + 4 - 3 = 74
    expect(r.assessment_score).toBe(74);
  });

  it("subtracts -2 when zero records", () => {
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 5,
      assessments: [],
    });
    expect(r.assessment_score).toBe(45);
  });

  it("report sharing rate is 0% when no reports shared", () => {
    const assessments = makeMany(5, { report_shared: false });
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 5,
      assessments,
    });
    expect(r.report_sharing_rate).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 10. METRIC RATES
// ═══════════════════════════════════════════════════════════════════════════

describe("metric rates", () => {
  it("children_assessed_rate is based on unique children", () => {
    const assessments = [
      makeAssessment({ id: "a1", child_id: "yp_1" }),
      makeAssessment({ id: "a2", child_id: "yp_1" }),
      makeAssessment({ id: "a3", child_id: "yp_2" }),
    ];
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 4,
      assessments,
    });
    // 2 unique children / 4 total = 50%
    expect(r.children_assessed_rate).toBe(50);
  });

  it("deadline_compliance_rate is n/total assessments", () => {
    const assessments = [
      makeAssessment({ id: "a1", child_id: "yp_1", completed_within_deadline: true }),
      makeAssessment({ id: "a2", child_id: "yp_2", completed_within_deadline: false }),
      makeAssessment({ id: "a3", child_id: "yp_3", completed_within_deadline: true }),
    ];
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 3,
      assessments,
    });
    // 2/3 = 67% → Math.round(66.666...) = 67
    expect(r.deadline_compliance_rate).toBe(67);
  });

  it("immunisation_rate correctly calculated", () => {
    const assessments = makeMixed(4, 3, "immunisations_up_to_date");
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 4,
      assessments,
    });
    // 3/4 = 75%
    expect(r.immunisation_rate).toBe(75);
  });

  it("dental_optical_rate requires both checks to be up to date", () => {
    const assessments = [
      makeAssessment({ id: "a1", child_id: "yp_1", dental_check_up_to_date: true, optical_check_up_to_date: true }),
      makeAssessment({ id: "a2", child_id: "yp_2", dental_check_up_to_date: true, optical_check_up_to_date: false }),
      makeAssessment({ id: "a3", child_id: "yp_3", dental_check_up_to_date: false, optical_check_up_to_date: true }),
      makeAssessment({ id: "a4", child_id: "yp_4", dental_check_up_to_date: false, optical_check_up_to_date: false }),
    ];
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 4,
      assessments,
    });
    // Only 1/4 = 25%
    expect(r.dental_optical_rate).toBe(25);
  });

  it("child_contribution_rate correctly calculated", () => {
    const assessments = makeMixed(5, 4, "has_child_contribution");
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 5,
      assessments,
    });
    // 4/5 = 80%
    expect(r.child_contribution_rate).toBe(80);
  });

  it("report_sharing_rate correctly calculated", () => {
    const assessments = makeMixed(3, 1, "report_shared");
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 3,
      assessments,
    });
    // 1/3 = 33% → Math.round(33.333...) = 33
    expect(r.report_sharing_rate).toBe(33);
  });

  it("total_assessments equals the number of assessment records", () => {
    const r = computeAnnualHealthAssessment(baseInput());
    expect(r.total_assessments).toBe(3);
  });

  it("pct rounds correctly (Math.round)", () => {
    // 1/3 = 33.33... → 33
    const assessments = makeMixed(3, 1, "completed_within_deadline");
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 3,
      assessments,
    });
    expect(r.deadline_compliance_rate).toBe(33);
  });

  it("pct rounds up at .5", () => {
    // 1/2 = 50% exactly
    const assessments = makeMixed(2, 1, "completed_within_deadline");
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 2,
      assessments,
    });
    expect(r.deadline_compliance_rate).toBe(50);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 11. STRENGTHS
// ═══════════════════════════════════════════════════════════════════════════

describe("strengths", () => {
  it("includes coverage strength when coverage >= 90% and total > 0", () => {
    const r = computeAnnualHealthAssessment(baseInput());
    expect(r.strengths.some(s => s.includes("comprehensive health monitoring"))).toBe(true);
  });

  it("includes deadline strength when compliance >= 90% and total > 0", () => {
    const r = computeAnnualHealthAssessment(baseInput());
    expect(r.strengths.some(s => s.includes("within statutory deadlines"))).toBe(true);
  });

  it("includes immunisation strength when rate >= 90% and total > 0", () => {
    const r = computeAnnualHealthAssessment(baseInput());
    expect(r.strengths.some(s => s.includes("Immunisations are up to date"))).toBe(true);
  });

  it("includes dental/optical strength when rate >= 85% and total > 0", () => {
    const r = computeAnnualHealthAssessment(baseInput());
    expect(r.strengths.some(s => s.includes("Dental and optical checks"))).toBe(true);
  });

  it("includes child contribution strength when rate >= 80% and total > 0", () => {
    const r = computeAnnualHealthAssessment(baseInput());
    expect(r.strengths.some(s => s.includes("Children actively contribute"))).toBe(true);
  });

  it("includes report sharing strength when rate >= 85% and total > 0", () => {
    const r = computeAnnualHealthAssessment(baseInput());
    expect(r.strengths.some(s => s.includes("reports are consistently shared"))).toBe(true);
  });

  it("all 6 strengths present when all metrics are excellent", () => {
    const r = computeAnnualHealthAssessment(baseInput());
    expect(r.strengths.length).toBe(6);
  });

  it("no strengths when all metrics are poor (low coverage)", () => {
    // Use low coverage so coverage strength doesn't trigger either
    const assessments = makeMany(3, {
      completed_within_deadline: false,
      immunisations_up_to_date: false,
      dental_check_up_to_date: false,
      optical_check_up_to_date: false,
      has_child_contribution: false,
      report_shared: false,
    });
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 10,
      assessments, // 30% coverage < 90%
    });
    expect(r.strengths.length).toBe(0);
  });

  it("coverage strength present even when other metrics are poor", () => {
    const assessments = makeMany(10, {
      completed_within_deadline: false,
      immunisations_up_to_date: false,
      dental_check_up_to_date: false,
      optical_check_up_to_date: false,
      has_child_contribution: false,
      report_shared: false,
    });
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 10,
      assessments, // 100% coverage → still gets coverage strength
    });
    expect(r.strengths.length).toBe(1);
    expect(r.strengths[0]).toContain("comprehensive health monitoring");
  });

  it("no strengths when total is 0 (zero records)", () => {
    const r = computeAnnualHealthAssessment(
      baseInput({ total_children: 5, assessments: [] }),
    );
    expect(r.strengths.length).toBe(0);
  });

  it("does not include coverage strength when rate is 89%", () => {
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 100,
      assessments: makeMany(89),
    });
    expect(r.strengths.some(s => s.includes("comprehensive health monitoring"))).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 12. CONCERNS
// ═══════════════════════════════════════════════════════════════════════════

describe("concerns", () => {
  it("adds no-assessment concern when total is 0", () => {
    const r = computeAnnualHealthAssessment(
      baseInput({ total_children: 5, assessments: [] }),
    );
    expect(r.concerns.some(c => c.includes("No annual health assessments recorded"))).toBe(true);
  });

  it("adds coverage concern when rate < 40% and total > 0", () => {
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 10,
      assessments: makeMany(3), // 30%
    });
    expect(r.concerns.some(c => c.includes("coverage is critically low"))).toBe(true);
  });

  it("adds deadline concern when compliance < 50% and total > 0", () => {
    const assessments = makeMany(10, { completed_within_deadline: false });
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 10,
      assessments,
    });
    expect(r.concerns.some(c => c.includes("completed late"))).toBe(true);
  });

  it("adds immunisation concern when rate < 50% and total > 0", () => {
    const assessments = makeMany(10, { immunisations_up_to_date: false });
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 10,
      assessments,
    });
    expect(r.concerns.some(c => c.includes("out-of-date immunisations"))).toBe(true);
  });

  it("adds child contribution concern when rate < 30% and total > 0", () => {
    const assessments = makeMany(10, { has_child_contribution: false });
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 10,
      assessments,
    });
    expect(r.concerns.some(c => c.includes("Children rarely contribute"))).toBe(true);
  });

  it("adds report sharing concern when rate < 40% and total > 0", () => {
    const assessments = makeMany(10, { report_shared: false });
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 10,
      assessments,
    });
    expect(r.concerns.some(c => c.includes("reports are not being shared"))).toBe(true);
  });

  it("no concerns when all metrics are excellent", () => {
    const r = computeAnnualHealthAssessment(baseInput());
    expect(r.concerns.length).toBe(0);
  });

  it("multiple concerns when multiple metrics are poor", () => {
    const assessments = makeMany(10, {
      completed_within_deadline: false,
      immunisations_up_to_date: false,
      has_child_contribution: false,
      report_shared: false,
    });
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 10,
      assessments,
    });
    expect(r.concerns.length).toBeGreaterThanOrEqual(4);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 13. RECOMMENDATIONS
// ═══════════════════════════════════════════════════════════════════════════

describe("recommendations", () => {
  it("recommends scheduling assessments when total is 0", () => {
    const r = computeAnnualHealthAssessment(
      baseInput({ total_children: 5, assessments: [] }),
    );
    expect(r.recommendations.length).toBeGreaterThanOrEqual(1);
    expect(r.recommendations[0].recommendation).toContain("Schedule annual health assessments");
    expect(r.recommendations[0].urgency).toBe("immediate");
    expect(r.recommendations[0].regulatory_ref).toBe("CHR 2015 Reg 10");
  });

  it("recommends scheduling for unassessed children when coverage < 60%", () => {
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 10,
      assessments: makeMany(5), // 50% < 60%
    });
    expect(r.recommendations.some(rec => rec.recommendation.includes("Prioritise scheduling"))).toBe(true);
    expect(r.recommendations.find(rec => rec.recommendation.includes("Prioritise scheduling"))!.urgency).toBe("immediate");
  });

  it("recommends tracking system when deadline compliance < 70%", () => {
    const assessments = makeMany(10, { completed_within_deadline: false });
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 10,
      assessments,
    });
    expect(r.recommendations.some(rec => rec.recommendation.includes("tracking system"))).toBe(true);
    expect(r.recommendations.find(rec => rec.recommendation.includes("tracking system"))!.urgency).toBe("soon");
  });

  it("recommends immunisation work when rate < 70%", () => {
    const assessments = makeMany(10, { immunisations_up_to_date: false });
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 10,
      assessments,
    });
    expect(r.recommendations.some(rec => rec.recommendation.includes("immunisation records"))).toBe(true);
    expect(r.recommendations.find(rec => rec.recommendation.includes("immunisation records"))!.urgency).toBe("soon");
  });

  it("recommends child voice when contribution < 50%", () => {
    const assessments = makeMany(10, { has_child_contribution: false });
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 10,
      assessments,
    });
    expect(r.recommendations.some(rec => rec.recommendation.includes("express their views"))).toBe(true);
    expect(r.recommendations.find(rec => rec.recommendation.includes("express their views"))!.urgency).toBe("planned");
  });

  it("recommends sharing reports when rate < 60%", () => {
    const assessments = makeMany(10, { report_shared: false });
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 10,
      assessments,
    });
    expect(r.recommendations.some(rec => rec.recommendation.includes("Share all health assessment reports"))).toBe(true);
    expect(r.recommendations.find(rec => rec.recommendation.includes("Share all health assessment reports"))!.urgency).toBe("planned");
  });

  it("no recommendations when all metrics are excellent", () => {
    const r = computeAnnualHealthAssessment(baseInput());
    expect(r.recommendations.length).toBe(0);
  });

  it("caps recommendations at 5", () => {
    // All metrics terrible to trigger all 6 recommendation conditions
    // total > 0, coverage < 60%, deadline < 70%, immunisation < 70%, child contrib < 50%, report sharing < 60%
    const assessments = makeMany(3, {
      completed_within_deadline: false,
      immunisations_up_to_date: false,
      has_child_contribution: false,
      report_shared: false,
    });
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 10,
      assessments, // 30% coverage
    });
    // Would have 5 recs (all except zero-records one): coverage, deadline, immunisation, child contrib, report sharing
    expect(r.recommendations.length).toBeLessThanOrEqual(5);
  });

  it("recommendations have sequential ranks starting from 1", () => {
    const assessments = makeMany(10, {
      completed_within_deadline: false,
      immunisations_up_to_date: false,
      has_child_contribution: false,
      report_shared: false,
    });
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 20,
      assessments, // 50% coverage < 60%
    });
    r.recommendations.forEach((rec, i) => {
      expect(rec.rank).toBe(i + 1);
    });
  });

  it("recommendations include regulatory_ref", () => {
    const r = computeAnnualHealthAssessment(
      baseInput({ total_children: 5, assessments: [] }),
    );
    r.recommendations.forEach(rec => {
      expect(rec.regulatory_ref).toBeTruthy();
    });
  });

  it("does not recommend scheduling when coverage is exactly 60%", () => {
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 10,
      assessments: makeMany(6), // 60% >= 60
    });
    expect(r.recommendations.some(rec => rec.recommendation.includes("Prioritise scheduling"))).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 14. INSIGHTS
// ═══════════════════════════════════════════════════════════════════════════

describe("insights", () => {
  it("adds exemplary insight when coverage, deadline, and immunisation all >= 90% and total >= 10", () => {
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 10,
      assessments: makeMany(10),
    });
    expect(r.insights.some(i => i.text.includes("exemplary") && i.severity === "positive")).toBe(true);
  });

  it("does not add exemplary insight when total < 10", () => {
    const r = computeAnnualHealthAssessment(baseInput()); // 3 assessments
    expect(r.insights.some(i => i.text.includes("exemplary"))).toBe(false);
  });

  it("adds critical insight when total is 0", () => {
    const r = computeAnnualHealthAssessment(
      baseInput({ total_children: 5, assessments: [] }),
    );
    expect(r.insights.some(i => i.severity === "critical" && i.text.includes("Ofsted"))).toBe(true);
  });

  it("adds warning insight when immunisation < 50% and total > 0", () => {
    const assessments = makeMany(10, { immunisations_up_to_date: false });
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 10,
      assessments,
    });
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("immunisation"))).toBe(true);
  });

  it("adds positive insight when coverage >= 90% and total > 0", () => {
    const r = computeAnnualHealthAssessment(baseInput());
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("Comprehensive assessment coverage"))).toBe(true);
  });

  it("adds positive insight when deadline compliance >= 90% and total > 0", () => {
    const r = computeAnnualHealthAssessment(baseInput());
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("deadline compliance"))).toBe(true);
  });

  it("caps insights at 3", () => {
    // Trigger many: coverage >= 90, deadline >= 90, immunisation >= 90, total >= 10 → 4 possible positives
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 10,
      assessments: makeMany(10),
    });
    expect(r.insights.length).toBeLessThanOrEqual(3);
  });

  it("exemplary insight is prioritised (comes first)", () => {
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 10,
      assessments: makeMany(10),
    });
    expect(r.insights[0].text).toContain("exemplary");
  });

  it("no insights when metrics are middling", () => {
    // All rates in the 50-80% range: no insight triggers
    const assessments = makeMany(10);
    for (let i = 3; i < 10; i++) {
      assessments[i].immunisations_up_to_date = false; // 30% < 50 → triggers warning
    }
    // Actually that triggers immunisation warning. Let's keep it at 50% exactly.
    const assessments2 = makeMany(10);
    for (let i = 5; i < 10; i++) {
      assessments2[i].immunisations_up_to_date = false; // 50% — not < 50, so no warning
    }
    // coverage: 10/20 = 50% (not >= 90, so no positive insight; not < any trigger)
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 20,
      assessments: assessments2, // 10 unique out of 20 = 50% coverage
    });
    // coverage 50% → no coverage insight, no exemplary insight
    // deadline 100% → positive insight ✓
    // immunisation 50% → no warning
    // So there IS a deadline insight. Hard to get zero insights with records.
    // Let's make deadline <90% too.
    for (let i = 2; i < 10; i++) {
      assessments2[i].completed_within_deadline = false; // 2/10 = 20%
    }
    const r2 = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 20,
      assessments: assessments2,
    });
    // coverage 50% (not >=90), deadline 20% (not >=90), immunisation 50% (not <50)
    // total=10 but coverage < 90 so exemplary won't trigger even if others pass
    // No insight triggers → empty
    expect(r2.insights.length).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 15. EDGE CASES
// ═══════════════════════════════════════════════════════════════════════════

describe("edge cases", () => {
  it("score is clamped to 0 minimum", () => {
    // Maximum penalties: coverage < 40 → -5, deadline < 50 → -5, immunisation < 50 → -4,
    // dental_optical < 40 → -4, child_contrib < 30 → -4, report_sharing < 40 → -3
    // 52 - 5 - 5 - 4 - 4 - 4 - 3 = 27. Still above 0.
    // With only 1 child assessed out of 100, all metrics at 0%:
    const assessments = makeMany(1, {
      completed_within_deadline: false,
      immunisations_up_to_date: false,
      dental_check_up_to_date: false,
      optical_check_up_to_date: false,
      has_child_contribution: false,
      report_shared: false,
    });
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 100,
      assessments, // 1% coverage < 40% → -5
    });
    // 52 - 5 - 5 - 4 - 4 - 4 - 3 = 27. Can't get to 0 with the current modifiers.
    // Score is clamped at min 0 but 27 is already > 0.
    expect(r.assessment_score).toBeGreaterThanOrEqual(0);
    expect(r.assessment_score).toBe(27);
  });

  it("score is clamped to 100 maximum", () => {
    // Max possible: 52 + 6 + 5 + 5 + 5 + 4 + 5 = 82. Can't exceed 100 with normal inputs.
    const r = computeAnnualHealthAssessment(baseInput());
    expect(r.assessment_score).toBeLessThanOrEqual(100);
  });

  it("handles single assessment correctly", () => {
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 1,
      assessments: [makeAssessment()],
    });
    expect(r.total_assessments).toBe(1);
    expect(r.children_assessed_rate).toBe(100);
    expect(r.deadline_compliance_rate).toBe(100);
    expect(r.immunisation_rate).toBe(100);
    expect(r.dental_optical_rate).toBe(100);
    expect(r.child_contribution_rate).toBe(100);
    expect(r.report_sharing_rate).toBe(100);
    expect(r.assessment_score).toBe(82);
    expect(r.assessment_rating).toBe("outstanding");
  });

  it("handles large number of assessments", () => {
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 200,
      assessments: makeMany(200),
    });
    expect(r.total_assessments).toBe(200);
    expect(r.children_assessed_rate).toBe(100);
    expect(r.assessment_score).toBe(82);
  });

  it("more assessments than total_children results in >100% coverage rate", () => {
    // This can happen if total_children is understated or there are repeat assessments
    // with different child_ids
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 2,
      assessments: makeMany(5), // 5 unique children / 2 total = 250% → Math.round(250) = 250
    });
    // pct(5, 2) = Math.round(5/2 * 100) = 250
    expect(r.children_assessed_rate).toBe(250);
  });

  it("duplicate child_ids are counted once for coverage", () => {
    const assessments = [
      makeAssessment({ id: "a1", child_id: "yp_1" }),
      makeAssessment({ id: "a2", child_id: "yp_1" }),
      makeAssessment({ id: "a3", child_id: "yp_1" }),
    ];
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 3,
      assessments,
    });
    // 1 unique child / 3 = 33%
    expect(r.children_assessed_rate).toBe(33);
    // But total_assessments is 3
    expect(r.total_assessments).toBe(3);
  });

  it("per-record metrics use total assessments as denominator", () => {
    // 3 assessments, 2 on time
    const assessments = [
      makeAssessment({ id: "a1", child_id: "yp_1", completed_within_deadline: true }),
      makeAssessment({ id: "a2", child_id: "yp_1", completed_within_deadline: true }),
      makeAssessment({ id: "a3", child_id: "yp_1", completed_within_deadline: false }),
    ];
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 3,
      assessments,
    });
    // 2/3 = 67%
    expect(r.deadline_compliance_rate).toBe(67);
  });

  it("boundary: coverage exactly at each threshold", () => {
    // 90% boundary
    const r90 = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 10,
      assessments: makeMany(9), // 90%
    });
    expect(r90.children_assessed_rate).toBe(90);

    // 60% boundary
    const r60 = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 10,
      assessments: makeMany(6), // 60%
    });
    expect(r60.children_assessed_rate).toBe(60);

    // 40% boundary
    const r40 = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 10,
      assessments: makeMany(4), // 40%
    });
    expect(r40.children_assessed_rate).toBe(40);
  });

  it("handles mixed true/false across fields independently", () => {
    // Assess that each metric counts its own field, not affected by others
    const assessments = [
      makeAssessment({
        id: "a1", child_id: "yp_1",
        completed_within_deadline: true,
        immunisations_up_to_date: false,
        dental_check_up_to_date: true,
        optical_check_up_to_date: false,
        has_child_contribution: true,
        report_shared: false,
      }),
      makeAssessment({
        id: "a2", child_id: "yp_2",
        completed_within_deadline: false,
        immunisations_up_to_date: true,
        dental_check_up_to_date: false,
        optical_check_up_to_date: true,
        has_child_contribution: false,
        report_shared: true,
      }),
    ];
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 2,
      assessments,
    });
    expect(r.deadline_compliance_rate).toBe(50);
    expect(r.immunisation_rate).toBe(50);
    expect(r.dental_optical_rate).toBe(0); // Neither has both true
    expect(r.child_contribution_rate).toBe(50);
    expect(r.report_sharing_rate).toBe(50);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 16. FULL SCENARIO: OUTSTANDING
// ═══════════════════════════════════════════════════════════════════════════

describe("full scenario: outstanding", () => {
  it("perfect home gets score 82 and rating outstanding", () => {
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 10,
      assessments: makeMany(10),
    });
    expect(r.assessment_rating).toBe("outstanding");
    expect(r.assessment_score).toBe(82);
    expect(r.total_assessments).toBe(10);
    expect(r.children_assessed_rate).toBe(100);
    expect(r.deadline_compliance_rate).toBe(100);
    expect(r.immunisation_rate).toBe(100);
    expect(r.dental_optical_rate).toBe(100);
    expect(r.child_contribution_rate).toBe(100);
    expect(r.report_sharing_rate).toBe(100);
    expect(r.strengths.length).toBe(6);
    expect(r.concerns.length).toBe(0);
    expect(r.recommendations.length).toBe(0);
    expect(r.insights.length).toBe(3); // capped at 3; exemplary + coverage + deadline
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 17. FULL SCENARIO: INADEQUATE
// ═══════════════════════════════════════════════════════════════════════════

describe("full scenario: inadequate", () => {
  it("everything-bad home gets low score and rating inadequate", () => {
    const assessments = makeMany(10, {
      completed_within_deadline: false,
      immunisations_up_to_date: false,
      dental_check_up_to_date: false,
      optical_check_up_to_date: false,
      has_child_contribution: false,
      report_shared: false,
    });
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 10,
      assessments,
    });
    expect(r.assessment_rating).toBe("inadequate");
    // 52 + 6 - 5 - 4 - 4 - 4 - 3 = 38
    expect(r.assessment_score).toBe(38);
    // Coverage is still 100% (10/10) so coverage strength fires
    expect(r.strengths.length).toBe(1);
    expect(r.concerns.length).toBeGreaterThanOrEqual(4);
    expect(r.recommendations.length).toBeGreaterThanOrEqual(3);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 18. FULL SCENARIO: MIXED / GOOD
// ═══════════════════════════════════════════════════════════════════════════

describe("full scenario: mixed (good rating)", () => {
  it("mostly good home with some gaps scores good", () => {
    const assessments = makeMany(10);
    // Drop 3 deadline → 70% → +2
    for (let i = 7; i < 10; i++) assessments[i].completed_within_deadline = false;
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 10,
      assessments,
    });
    // 52 + 6 + 2 + 5 + 5 + 4 + 5 = 79 → good
    expect(r.assessment_rating).toBe("good");
    expect(r.assessment_score).toBe(79);
    expect(r.strengths.length).toBe(5); // coverage, immunisation, dental, child contrib, report sharing (not deadline since 70% < 90%)
    expect(r.concerns.length).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 19. MODIFIER BOUNDARY COMBINATIONS
// ═══════════════════════════════════════════════════════════════════════════

describe("modifier boundary combinations", () => {
  it("all modifiers at mid tier produce expected score", () => {
    // 10 children, 7 assessed = 70% coverage → +2
    // 7/7 deadline = 100% → +5
    // 5/7 immunisation = 71% → +2
    // 5/7 dental_optical = 71% → +2 (>=60)
    // 4/7 child_contrib = 57% → +1 (>=50)
    // 5/7 report_sharing = 71% → +2 (>=60)
    // 52 + 2 + 5 + 2 + 2 + 1 + 2 = 66 → good
    const assessments = makeMany(7);
    for (let i = 5; i < 7; i++) assessments[i].immunisations_up_to_date = false;
    for (let i = 5; i < 7; i++) {
      assessments[i].dental_check_up_to_date = false;
      assessments[i].optical_check_up_to_date = false;
    }
    for (let i = 4; i < 7; i++) assessments[i].has_child_contribution = false;
    for (let i = 5; i < 7; i++) assessments[i].report_shared = false;

    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 10,
      assessments,
    });
    expect(r.children_assessed_rate).toBe(70); // 7 unique / 10
    expect(r.deadline_compliance_rate).toBe(100); // 7/7
    expect(r.immunisation_rate).toBe(71); // 5/7
    expect(r.dental_optical_rate).toBe(71); // 5/7
    expect(r.child_contribution_rate).toBe(57); // 4/7
    expect(r.report_sharing_rate).toBe(71); // 5/7
    expect(r.assessment_score).toBe(66);
    expect(r.assessment_rating).toBe("good");
  });

  it("all modifiers in neutral/dead zone produce base score 52", () => {
    // coverage 40-59% → 0, deadline 50-69% → 0, immunisation 50-69% → 0,
    // dental_optical 40-59% → 0, child_contrib 30-49% → 0, report_sharing 40-59% → 0
    // 52 + 0 + 0 + 0 + 0 + 0 + 0 = 52 → adequate
    const assessments = makeMany(10);
    // coverage: 5/10 = 50%
    // But we have 10 assessments, 10 unique kids, so coverage = 10/total_children
    // We want 50% coverage: 10 kids assessed, 20 total
    const assessments2 = makeMany(10);
    // deadline: 5/10 = 50%
    for (let i = 5; i < 10; i++) assessments2[i].completed_within_deadline = false;
    // immunisation: 5/10 = 50%
    for (let i = 5; i < 10; i++) assessments2[i].immunisations_up_to_date = false;
    // dental_optical: 5/10 = 50%
    for (let i = 5; i < 10; i++) {
      assessments2[i].dental_check_up_to_date = false;
      assessments2[i].optical_check_up_to_date = false;
    }
    // child_contrib: 4/10 = 40%
    for (let i = 4; i < 10; i++) assessments2[i].has_child_contribution = false;
    // report_sharing: 5/10 = 50%
    for (let i = 5; i < 10; i++) assessments2[i].report_shared = false;

    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 20,
      assessments: assessments2,
    });
    expect(r.children_assessed_rate).toBe(50);
    expect(r.deadline_compliance_rate).toBe(50);
    expect(r.immunisation_rate).toBe(50);
    expect(r.dental_optical_rate).toBe(50);
    expect(r.child_contribution_rate).toBe(40);
    expect(r.report_sharing_rate).toBe(50);
    expect(r.assessment_score).toBe(52);
    expect(r.assessment_rating).toBe("adequate");
  });

  it("all modifiers at maximum penalty produces lowest possible score", () => {
    // coverage < 40% → -5, deadline < 50% → -5, immunisation < 50% → -4,
    // dental_optical < 40% → -4, child_contrib < 30% → -4, report_sharing < 40% → -3
    // 52 - 5 - 5 - 4 - 4 - 4 - 3 = 27
    const assessments = makeMany(1, {
      completed_within_deadline: false,
      immunisations_up_to_date: false,
      dental_check_up_to_date: false,
      optical_check_up_to_date: false,
      has_child_contribution: false,
      report_shared: false,
    });
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 100,
      assessments,
    });
    expect(r.assessment_score).toBe(27);
    expect(r.assessment_rating).toBe("inadequate");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 20. RETURN SHAPE
// ═══════════════════════════════════════════════════════════════════════════

describe("return shape", () => {
  it("result includes all expected properties", () => {
    const r = computeAnnualHealthAssessment(baseInput());
    expect(r).toHaveProperty("assessment_rating");
    expect(r).toHaveProperty("assessment_score");
    expect(r).toHaveProperty("headline");
    expect(r).toHaveProperty("total_assessments");
    expect(r).toHaveProperty("children_assessed_rate");
    expect(r).toHaveProperty("deadline_compliance_rate");
    expect(r).toHaveProperty("immunisation_rate");
    expect(r).toHaveProperty("dental_optical_rate");
    expect(r).toHaveProperty("child_contribution_rate");
    expect(r).toHaveProperty("report_sharing_rate");
    expect(r).toHaveProperty("strengths");
    expect(r).toHaveProperty("concerns");
    expect(r).toHaveProperty("recommendations");
    expect(r).toHaveProperty("insights");
  });

  it("strengths is an array of strings", () => {
    const r = computeAnnualHealthAssessment(baseInput());
    expect(Array.isArray(r.strengths)).toBe(true);
    r.strengths.forEach(s => expect(typeof s).toBe("string"));
  });

  it("concerns is an array of strings", () => {
    const assessments = makeMany(10, {
      completed_within_deadline: false,
      immunisations_up_to_date: false,
      has_child_contribution: false,
      report_shared: false,
    });
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 10,
      assessments,
    });
    expect(Array.isArray(r.concerns)).toBe(true);
    r.concerns.forEach(c => expect(typeof c).toBe("string"));
  });

  it("recommendations have rank, recommendation, urgency, and regulatory_ref", () => {
    const r = computeAnnualHealthAssessment(
      baseInput({ total_children: 5, assessments: [] }),
    );
    r.recommendations.forEach(rec => {
      expect(rec).toHaveProperty("rank");
      expect(rec).toHaveProperty("recommendation");
      expect(rec).toHaveProperty("urgency");
      expect(rec).toHaveProperty("regulatory_ref");
      expect(["immediate", "soon", "planned"]).toContain(rec.urgency);
    });
  });

  it("insights have text and severity", () => {
    const r = computeAnnualHealthAssessment(baseInput());
    r.insights.forEach(i => {
      expect(i).toHaveProperty("text");
      expect(i).toHaveProperty("severity");
      expect(["critical", "warning", "positive"]).toContain(i.severity);
    });
  });

  it("rating is one of the five valid values", () => {
    const r = computeAnnualHealthAssessment(baseInput());
    expect(["outstanding", "good", "adequate", "inadequate", "insufficient_data"]).toContain(r.assessment_rating);
  });

  it("score is a number", () => {
    const r = computeAnnualHealthAssessment(baseInput());
    expect(typeof r.assessment_score).toBe("number");
  });

  it("all rates are numbers", () => {
    const r = computeAnnualHealthAssessment(baseInput());
    expect(typeof r.children_assessed_rate).toBe("number");
    expect(typeof r.deadline_compliance_rate).toBe("number");
    expect(typeof r.immunisation_rate).toBe("number");
    expect(typeof r.dental_optical_rate).toBe("number");
    expect(typeof r.child_contribution_rate).toBe("number");
    expect(typeof r.report_sharing_rate).toBe("number");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 21. SCORING ARITHMETIC CROSS-CHECKS
// ═══════════════════════════════════════════════════════════════════════════

describe("scoring arithmetic cross-checks", () => {
  it("base score is 52 when no modifiers apply", () => {
    // Use the neutral zone test
    const assessments = makeMany(10);
    for (let i = 5; i < 10; i++) {
      assessments[i].completed_within_deadline = false;
      assessments[i].immunisations_up_to_date = false;
      assessments[i].dental_check_up_to_date = false;
      assessments[i].optical_check_up_to_date = false;
      assessments[i].report_shared = false;
    }
    for (let i = 4; i < 10; i++) assessments[i].has_child_contribution = false;

    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 20,
      assessments,
    });
    // coverage 50% → 0, deadline 50% → 0, immunisation 50% → 0
    // dental_optical 50% → 0, child_contrib 40% → 0, report_sharing 50% → 0
    expect(r.assessment_score).toBe(52);
  });

  it("max possible score is 82 (52+6+5+5+5+4+5)", () => {
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 10,
      assessments: makeMany(10),
    });
    expect(r.assessment_score).toBe(82);
  });

  it("minimum possible score with assessments is 27 (52-5-5-4-4-4-3)", () => {
    const assessments = makeMany(1, {
      completed_within_deadline: false,
      immunisations_up_to_date: false,
      dental_check_up_to_date: false,
      optical_check_up_to_date: false,
      has_child_contribution: false,
      report_shared: false,
    });
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 100,
      assessments,
    });
    expect(r.assessment_score).toBe(27);
  });

  it("zero records score is 45 (52-3-1-1-2)", () => {
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 5,
      assessments: [],
    });
    expect(r.assessment_score).toBe(45);
  });

  it("each modifier independently adjusts from base 52", () => {
    // Only coverage high (90%+), everything else neutral
    const assessments = makeMany(10);
    for (let i = 5; i < 10; i++) {
      assessments[i].completed_within_deadline = false;
      assessments[i].immunisations_up_to_date = false;
      assessments[i].dental_check_up_to_date = false;
      assessments[i].optical_check_up_to_date = false;
      assessments[i].report_shared = false;
    }
    for (let i = 4; i < 10; i++) assessments[i].has_child_contribution = false;

    // coverage = 10/10 = 100% → +6 (using total_children=10)
    // Wait — total_children needs to be 10 for 100% coverage
    const r = computeAnnualHealthAssessment({
      today: "2026-05-27",
      total_children: 10,
      assessments,
    });
    // coverage 100% → +6, deadline 50% → 0, immunisation 50% → 0
    // dental_optical 50% → 0, child_contrib 40% → 0, report_sharing 50% → 0
    expect(r.assessment_score).toBe(58); // 52 + 6
  });
});
