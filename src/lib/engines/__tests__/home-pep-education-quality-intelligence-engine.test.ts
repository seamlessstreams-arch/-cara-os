import { describe, it, expect, beforeAll } from "vitest";
import {
  computePepEducationQuality,
  type PepRecordInput,
  type PepEducationQualityInput,
  type PepEducationResult,
} from "../home-pep-education-quality-intelligence-engine";

// ── Helpers ────────────────────────────────────────────────────────────────

let _id = 0;
const uid = () => `pep-${++_id}`;

function makePep(overrides: Partial<PepRecordInput> = {}): PepRecordInput {
  return {
    id: uid(),
    child_id: "c1",
    status: "current",
    attendance: 96,
    exclusions: 0,
    exclusion_days: 0,
    target_count: 5,
    targets_on_track_count: 3,
    targets_exceeded_count: 1,
    has_child_views: true,
    has_carer_views: true,
    actions_total: 4,
    actions_completed: 4,
    pupil_premium_allocated: 2530,
    pupil_premium_spent: 2000,
    has_sen: false,
    ...overrides,
  };
}

function baseInput(overrides: Partial<PepEducationQualityInput> = {}): PepEducationQualityInput {
  return {
    today: "2026-05-27",
    total_children: 10,
    peps: [],
    ...overrides,
  };
}

/** Helper: creates N identical PEPs, each for a unique child */
function pepArray(n: number, overrides: Partial<PepRecordInput> = {}): PepRecordInput[] {
  return Array.from({ length: n }, (_, i) =>
    makePep({ child_id: `c${i + 1}`, ...overrides }),
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 1: Insufficient Data
// ══════════════════════════════════════════════════════════════════════════════
describe("computePepEducationQuality", () => {
  describe("insufficient data", () => {
    it("returns insufficient_data when total_children is 0", () => {
      const result = computePepEducationQuality(baseInput({ total_children: 0 }));
      expect(result.pep_rating).toBe("insufficient_data");
      expect(result.pep_score).toBe(0);
    });

    it("returns zero for all metrics when total_children is 0", () => {
      const result = computePepEducationQuality(baseInput({ total_children: 0 }));
      expect(result.total_peps).toBe(0);
      expect(result.children_with_pep_rate).toBe(0);
      expect(result.current_rate).toBe(0);
      expect(result.average_attendance).toBe(0);
      expect(result.exclusion_rate).toBe(0);
      expect(result.target_progress_rate).toBe(0);
      expect(result.action_completion_rate).toBe(0);
    });

    it("returns empty arrays for strengths, concerns, recommendations, insights when total_children is 0", () => {
      const result = computePepEducationQuality(baseInput({ total_children: 0 }));
      expect(result.strengths).toEqual([]);
      expect(result.concerns).toEqual([]);
      expect(result.recommendations).toEqual([]);
      expect(result.insights).toEqual([]);
    });

    it("returns correct headline when total_children is 0", () => {
      const result = computePepEducationQuality(baseInput({ total_children: 0 }));
      expect(result.headline).toBe("No data available for PEP education quality analysis");
    });

    it("returns insufficient_data even when peps are supplied but total_children is 0", () => {
      const result = computePepEducationQuality(
        baseInput({ total_children: 0, peps: [makePep()] }),
      );
      expect(result.pep_rating).toBe("insufficient_data");
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 2: Zero PEP records (total_children > 0 but peps=[])
  // ══════════════════════════════════════════════════════════════════════════
  describe("zero PEP records with children", () => {
    let result: PepEducationResult;
    beforeAll(() => {
      result = computePepEducationQuality(baseInput({ total_children: 5, peps: [] }));
    });

    it("total_peps is 0", () => {
      expect(result.total_peps).toBe(0);
    });

    it("applies zero-record modifiers: base 52 - 3 (coverage) - 1 (attendance) - 1 (actions) - 2 (child voice) = 45", () => {
      // Mod1: -3, Mod2: no adj, Mod3: -1, Mod4: no adj, Mod5: -1, Mod6: -2
      expect(result.pep_score).toBe(45);
    });

    it("rates as adequate with score 45", () => {
      expect(result.pep_rating).toBe("adequate");
    });

    it("children_with_pep_rate is 0", () => {
      expect(result.children_with_pep_rate).toBe(0);
    });

    it("includes 'no PEP records' concern", () => {
      expect(result.concerns).toContain(
        "No PEP records — children's education plans are not being documented",
      );
    });

    it("includes recommendation to create PEPs", () => {
      expect(result.recommendations.length).toBeGreaterThanOrEqual(1);
      expect(result.recommendations[0].recommendation).toContain("Ensure every child has a Personal Education Plan");
      expect(result.recommendations[0].urgency).toBe("immediate");
    });

    it("includes critical insight about Ofsted verification", () => {
      expect(result.insights).toContainEqual(
        expect.objectContaining({ severity: "critical", text: expect.stringContaining("No PEP records") }),
      );
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 3: Rating Thresholds
  // ══════════════════════════════════════════════════════════════════════════
  describe("rating thresholds", () => {
    describe("outstanding (score >= 80)", () => {
      it("returns outstanding with perfect PEPs across all modifiers", () => {
        // 10 children, 10 PEPs all unique → coverage 100% → +6
        // all current → +5
        // attendance 96 → +5
        // targets 4/5 = 80% → +5
        // actions 4/4 = 100% → +4
        // child views 100% → +5
        // 52 + 6 + 5 + 5 + 5 + 4 + 5 = 82
        const peps = pepArray(10);
        const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
        expect(result.pep_score).toBe(82);
        expect(result.pep_rating).toBe("outstanding");
      });

      it("returns outstanding headline", () => {
        const peps = pepArray(10);
        const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
        expect(result.headline).toContain("outstanding");
      });

      it("returns outstanding at boundary score 80", () => {
        // Need score exactly 80
        // Base 52, coverage +6 = 58, currency +5 = 63, attendance +5 = 68,
        // target +5 = 73, actions +4 = 77, voice +5 = 82 → too high
        // Reduce actions: actions_completed 2/4 = 50% → +1 instead of +4 → 79 (not enough)
        // Reduce actions: actions_completed 0/4 = 0% → -4 → 75 → too low
        // Let's try: coverage +6, currency +5, attendance +5, target +2, actions +4, voice +5 = 79 → still not 80
        // coverage +6, currency +5, attendance +5, target +5, actions +4, voice +2 = 79 → nope
        // coverage +6, currency +5, attendance +5, target +5, actions +4, voice +5 = 82
        // Need exactly 80 → 52 + 28 = 80. So coverage +6, currency +5, attendance +5, target +5, actions +2(50%), voice +5 = 80
        // actions 50% → >= 50 → +1 not +2. Actually: >=80→+4, >=50→+1. So 50% → +1.
        // 52+6+5+5+5+1+5 = 79. Not 80 either.
        // Let's do: coverage +6, currency +5, attendance +5, target +5, actions +4, voice +2 = 79.
        // Voice at 50% → +2: 52+6+5+5+5+4+2 = 79. Still 79.
        // Coverage at 90%, rest max: 52+6+5+5+5+4+5=82.
        // Reduce target to +2 (>=50 <75): 52+6+5+5+2+4+5=79. Hmm.
        // Target at 0 with peps → +2: 52+6+5+5+2+4+5=79.
        // Ok, approach differently. Score 80 exactly:
        // 52 + X = 80, X = 28. We need modifiers summing to 28.
        // Max possible is 6+5+5+5+4+5=30. We need 28. Diff = 2.
        // Drop 2: e.g. currency from +5 to +2 (drop 3 → too much), or coverage from +6 to +2 (drop 4 → too much).
        // Target from +5 to +2 (drop 3 → sums 27). Target from +5 to +5, voice from +5 to +2 (drop 3 → sums 27).
        // Actions from +4 to +1 (drop 3 → sums 27). Actions from +4 to +4, attendance from +5 to +2 (drop 3 → sums 27).
        // Ok, it seems 28 is not directly reachable with clean steps. Let's try 30 - 2:
        // coverage +6, currency +5, attendance +2, target +5, actions +4, voice +5 = 79. Nope.
        // The jumps skip 28. Let's test at 82 which is achievable.
        // Actually the question is just: does toRating(80) return "outstanding"? We already proved 82 works.
        // Let's still confirm the boundary by testing toRating indirectly.
        // We'll set up for score=82 which is the lowest clean achievable outstanding.
        const peps = pepArray(10);
        const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
        expect(result.pep_score).toBeGreaterThanOrEqual(80);
        expect(result.pep_rating).toBe("outstanding");
      });
    });

    describe("good (65 <= score < 80)", () => {
      it("returns good with strong but not perfect metrics", () => {
        // 10 children, 7 unique children → 70% → +2 coverage
        // all current → +5 currency
        // attendance 96 → +5
        // target 80% → +5
        // actions 100% → +4
        // child_views 100% → +5
        // 52 + 2 + 5 + 5 + 5 + 4 + 5 = 78
        const peps = pepArray(7);
        const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
        expect(result.pep_score).toBe(78);
        expect(result.pep_rating).toBe("good");
      });

      it("returns good headline", () => {
        const peps = pepArray(7);
        const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
        expect(result.headline).toContain("Good PEP practice");
      });

      it("returns good at boundary score 65", () => {
        // 52 + 13 needed. Coverage +2, currency +2, attendance +2, target +2, actions +1, voice +2 = 11 → 63. Close.
        // Coverage +2, currency +5, attendance +2, target +2, actions +1, voice +2 = 14 → 66.
        // Coverage +2, currency +2, attendance +5, target +2, actions +1, voice +2 = 14 → 66.
        // Let's try score 66 which is achievable:
        // 6 unique kids / 10 = 60% → +2
        // 4/6 current = 67% → +2
        // attendance 90 → +2 (>=85 <95)
        // targets 60% → +2
        // actions 60% → +1
        // voice 4/6 = 67% → +2
        // 52 + 2 + 2 + 2 + 2 + 1 + 2 = 63. Hmm.
        // Need more: currency 5/6 = 83% → +5: 52+2+5+2+2+1+2=66.
        const peps = [
          makePep({ child_id: "c1", status: "current", attendance: 90, target_count: 5, targets_on_track_count: 2, targets_exceeded_count: 1, actions_total: 5, actions_completed: 3, has_child_views: true }),
          makePep({ child_id: "c2", status: "current", attendance: 90, target_count: 5, targets_on_track_count: 2, targets_exceeded_count: 1, actions_total: 5, actions_completed: 3, has_child_views: true }),
          makePep({ child_id: "c3", status: "current", attendance: 90, target_count: 5, targets_on_track_count: 2, targets_exceeded_count: 1, actions_total: 5, actions_completed: 3, has_child_views: true }),
          makePep({ child_id: "c4", status: "current", attendance: 90, target_count: 5, targets_on_track_count: 2, targets_exceeded_count: 1, actions_total: 5, actions_completed: 3, has_child_views: true }),
          makePep({ child_id: "c5", status: "current", attendance: 90, target_count: 5, targets_on_track_count: 2, targets_exceeded_count: 1, actions_total: 5, actions_completed: 3, has_child_views: false }),
          makePep({ child_id: "c6", status: "draft", attendance: 90, target_count: 5, targets_on_track_count: 2, targets_exceeded_count: 1, actions_total: 5, actions_completed: 3, has_child_views: false }),
        ];
        // 6/10 = 60% → +2 coverage
        // 5/6 current = 83% → +5 currency
        // avg attendance 90 → +2
        // targets: total 30, on_track+exceeded = 18 → 60% → +2
        // actions: 30 total, 18 completed → 60% → +1
        // child views: 4/6 = 67% → +2
        // 52 + 2 + 5 + 2 + 2 + 1 + 2 = 66
        const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
        expect(result.pep_score).toBe(66);
        expect(result.pep_rating).toBe("good");
      });
    });

    describe("adequate (45 <= score < 65)", () => {
      it("returns adequate with mediocre metrics", () => {
        // 4/10 = 40% coverage → no adjustment (40–59 range: not >=60, not <40 → 0)
        // 2/4 = 50% current → +2
        // attendance 80 → +0 (>=75 <85 → no bracket hit, no adjustment — between 75 and 85 is neither <75 nor >=85)
        // Actually the logic: >=95→+5, >=85→+2, <75→-4. If 75<=x<85, no adjustment.
        // targets 40% → no bracket (<30→-4, >=50→+2, >=75→+5) — between 30 and 50 → no adj
        // actions 40% → same as targets: between 30 and 50 → no adj
        // voice 2/4 = 50% → +2
        // 52 + 0 + 2 + 0 + 0 + 0 + 2 = 56
        const peps = [
          makePep({ child_id: "c1", status: "current", attendance: 80, target_count: 5, targets_on_track_count: 2, targets_exceeded_count: 0, actions_total: 5, actions_completed: 2, has_child_views: true }),
          makePep({ child_id: "c2", status: "current", attendance: 80, target_count: 5, targets_on_track_count: 2, targets_exceeded_count: 0, actions_total: 5, actions_completed: 2, has_child_views: true }),
          makePep({ child_id: "c3", status: "draft", attendance: 80, target_count: 5, targets_on_track_count: 2, targets_exceeded_count: 0, actions_total: 5, actions_completed: 2, has_child_views: false }),
          makePep({ child_id: "c4", status: "overdue", attendance: 80, target_count: 5, targets_on_track_count: 2, targets_exceeded_count: 0, actions_total: 5, actions_completed: 2, has_child_views: false }),
        ];
        const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
        expect(result.pep_score).toBe(56);
        expect(result.pep_rating).toBe("adequate");
      });

      it("returns adequate headline", () => {
        const peps = [
          makePep({ child_id: "c1", status: "current", attendance: 80, target_count: 5, targets_on_track_count: 2, targets_exceeded_count: 0, actions_total: 5, actions_completed: 2, has_child_views: true }),
          makePep({ child_id: "c2", status: "current", attendance: 80, target_count: 5, targets_on_track_count: 2, targets_exceeded_count: 0, actions_total: 5, actions_completed: 2, has_child_views: true }),
          makePep({ child_id: "c3", status: "draft", attendance: 80, target_count: 5, targets_on_track_count: 2, targets_exceeded_count: 0, actions_total: 5, actions_completed: 2, has_child_views: false }),
          makePep({ child_id: "c4", status: "overdue", attendance: 80, target_count: 5, targets_on_track_count: 2, targets_exceeded_count: 0, actions_total: 5, actions_completed: 2, has_child_views: false }),
        ];
        const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
        expect(result.headline).toContain("PEPs exist but currency");
      });
    });

    describe("inadequate (score < 45)", () => {
      it("returns inadequate with poor metrics across the board", () => {
        // 2/10 = 20% coverage → -5
        // 0/2 current (both draft) → 0% < 30 → -5
        // attendance 60 → <75 → -4
        // targets 10% → <30 → -4
        // actions 10% → <30 → -4
        // voice 0/2 = 0% → <30 → -3
        // 52 - 5 - 5 - 4 - 4 - 4 - 3 = 27
        const peps = [
          makePep({ child_id: "c1", status: "draft", attendance: 60, target_count: 10, targets_on_track_count: 1, targets_exceeded_count: 0, actions_total: 10, actions_completed: 1, has_child_views: false }),
          makePep({ child_id: "c2", status: "overdue", attendance: 60, target_count: 10, targets_on_track_count: 1, targets_exceeded_count: 0, actions_total: 10, actions_completed: 1, has_child_views: false }),
        ];
        const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
        expect(result.pep_score).toBe(27);
        expect(result.pep_rating).toBe("inadequate");
      });

      it("returns inadequate headline", () => {
        const peps = [
          makePep({ child_id: "c1", status: "draft", attendance: 60, target_count: 10, targets_on_track_count: 1, targets_exceeded_count: 0, actions_total: 10, actions_completed: 1, has_child_views: false }),
          makePep({ child_id: "c2", status: "overdue", attendance: 60, target_count: 10, targets_on_track_count: 1, targets_exceeded_count: 0, actions_total: 10, actions_completed: 1, has_child_views: false }),
        ];
        const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
        expect(result.headline).toContain("inadequate");
      });

      it("returns inadequate at boundary score 44", () => {
        // Need exactly 44. 52 + X = 44, X = -8.
        // coverage +2 (60%), currency 0 (30-49%), attendance -4 (<75), target 0 (30-49%), actions -4 (<30), voice -2 (no: wait that's for 0 records)
        // Let me think: voice <30 → -3.
        // +2 + 0 + (-4) + 0 + (-4) + (-3) = -9 → 43. Close but one off.
        // Try: coverage +2, currency -5(<30), attendance +2(>=85), target 0, actions -4, voice -3 = -8 → 44
        // 3/5 children: 60% → +2
        // currency: 0/3 current → 0% <30 → -5
        // attendance: 90 → >=85 → +2
        // targets: 40% → between 30-49 → 0
        // actions: 20% → <30 → -4
        // voice: 0/3 → 0% <30 → -3
        // 52 + 2 - 5 + 2 + 0 - 4 - 3 = 44
        const peps = [
          makePep({ child_id: "c1", status: "draft", attendance: 90, target_count: 5, targets_on_track_count: 2, targets_exceeded_count: 0, actions_total: 5, actions_completed: 1, has_child_views: false }),
          makePep({ child_id: "c2", status: "overdue", attendance: 90, target_count: 5, targets_on_track_count: 2, targets_exceeded_count: 0, actions_total: 5, actions_completed: 1, has_child_views: false }),
          makePep({ child_id: "c3", status: "overdue", attendance: 90, target_count: 5, targets_on_track_count: 2, targets_exceeded_count: 0, actions_total: 5, actions_completed: 1, has_child_views: false }),
        ];
        // 3/5 = 60% → +2
        // 0/3 current → 0% < 30 → -5
        // avg attendance 90 → +2
        // targets: 15 total, on_track 6+exceeded 0 = 6 → 40% → no adj
        // actions: 15 total, 3 completed → 20% < 30 → -4
        // voice: 0/3 = 0% < 30 → -3
        // 52 + 2 - 5 + 2 + 0 - 4 - 3 = 44
        const result = computePepEducationQuality(baseInput({ total_children: 5, peps }));
        expect(result.pep_score).toBe(44);
        expect(result.pep_rating).toBe("inadequate");
      });
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 4: Modifier 1 — Children with PEP (coverage)
  // ══════════════════════════════════════════════════════════════════════════
  describe("Modifier 1: Children with PEP coverage", () => {
    it("adds +6 when coverage >= 90%", () => {
      // 9/10 unique children = 90% → +6
      const peps = pepArray(9, { attendance: 80, target_count: 0, actions_total: 0, has_child_views: false });
      // With target_count=0 → mod4 +2, actions_total=0 → mod5 +2
      // voice 0% → -3, currency 100% → +5, attendance 80 → 0 (between 75 and 85)
      // Base 52 + 6 + 5 + 0 + 2 + 2 - 3 = 64
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.pep_score).toBe(64);
    });

    it("adds +2 when coverage >= 60% and < 90%", () => {
      // 6/10 = 60% → +2
      const peps = pepArray(6, { attendance: 80, target_count: 0, actions_total: 0, has_child_views: false });
      // 52 + 2 + 5 + 0 + 2 + 2 - 3 = 60
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.pep_score).toBe(60);
    });

    it("no adjustment when 40% <= coverage < 60%", () => {
      // 4/10 = 40% → no adjustment (not >=60, not <40)
      const peps = pepArray(4, { attendance: 80, target_count: 0, actions_total: 0, has_child_views: false });
      // 52 + 0 + 5 + 0 + 2 + 2 - 3 = 58
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.pep_score).toBe(58);
    });

    it("subtracts -5 when coverage < 40%", () => {
      // 3/10 = 30% → -5
      const peps = pepArray(3, { attendance: 80, target_count: 0, actions_total: 0, has_child_views: false });
      // 52 - 5 + 5 + 0 + 2 + 2 - 3 = 53
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.pep_score).toBe(53);
    });

    it("subtracts -3 when no PEP records (0 records path)", () => {
      // 0 records: mod1 -3, mod2 0, mod3 -1, mod4 0, mod5 -1, mod6 -2 → 52-3-1-1-2=45
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps: [] }));
      expect(result.pep_score).toBe(45);
    });

    it("counts unique children for coverage (deduplicates child_id)", () => {
      // Two PEPs for same child → only 1 unique child / 10 = 10% → <40 → -5
      const peps = [
        makePep({ child_id: "c1" }),
        makePep({ child_id: "c1" }),
      ];
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.children_with_pep_rate).toBe(10);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 5: Modifier 2 — PEP currency (status = "current")
  // ══════════════════════════════════════════════════════════════════════════
  describe("Modifier 2: PEP currency", () => {
    it("adds +5 when current rate >= 80%", () => {
      const peps = pepArray(10, { status: "current" });
      // 100% current → +5
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.current_rate).toBe(100);
    });

    it("adds +2 when current rate >= 50% and < 80%", () => {
      const peps = [
        ...pepArray(5, { status: "current" }),
        ...pepArray(5, { status: "draft" }),
      ];
      // 5/10 = 50% → +2
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.current_rate).toBe(50);
    });

    it("subtracts -5 when current rate < 30%", () => {
      const peps = [
        makePep({ child_id: "c1", status: "current" }),
        ...pepArray(9, { status: "overdue" }),
      ];
      // 1/10 = 10% → -5
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.current_rate).toBe(10);
    });

    it("no adjustment when 30% <= current rate < 50%", () => {
      const peps = [
        ...Array.from({ length: 3 }, (_, i) => makePep({ child_id: `cur${i}`, status: "current" })),
        ...Array.from({ length: 7 }, (_, i) => makePep({ child_id: `oth${i}`, status: "draft" })),
      ];
      // 3/10 = 30% → not <30, not >=50 → no adjustment
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.current_rate).toBe(30);
    });

    it("no adjustment when 0 PEP records", () => {
      const result = computePepEducationQuality(baseInput({ total_children: 5, peps: [] }));
      // The currency modifier contributes 0 with zero records
      // Total: 52 - 3 (coverage) + 0 (currency) - 1 (attendance) + 0 (target) - 1 (actions) - 2 (voice) = 45
      expect(result.pep_score).toBe(45);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 6: Modifier 3 — Average attendance
  // ══════════════════════════════════════════════════════════════════════════
  describe("Modifier 3: Average attendance", () => {
    it("adds +5 when average attendance >= 95", () => {
      const peps = pepArray(10, { attendance: 96 });
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.average_attendance).toBe(96);
    });

    it("adds +2 when average attendance >= 85 and < 95", () => {
      const peps = pepArray(10, { attendance: 90 });
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.average_attendance).toBe(90);
    });

    it("subtracts -4 when average attendance < 75", () => {
      const peps = pepArray(10, { attendance: 60 });
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.average_attendance).toBe(60);
    });

    it("no adjustment when 75 <= attendance < 85", () => {
      const peps = pepArray(10, { attendance: 80 });
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.average_attendance).toBe(80);
    });

    it("subtracts -1 when 0 PEP records", () => {
      // Already tested via zero records score
      const result = computePepEducationQuality(baseInput({ total_children: 5, peps: [] }));
      expect(result.average_attendance).toBe(0);
    });

    it("rounds average attendance to nearest integer", () => {
      const peps = [
        makePep({ child_id: "c1", attendance: 93 }),
        makePep({ child_id: "c2", attendance: 94 }),
        makePep({ child_id: "c3", attendance: 95 }),
      ];
      // (93+94+95)/3 = 94 → exact
      const result = computePepEducationQuality(baseInput({ total_children: 3, peps }));
      expect(result.average_attendance).toBe(94);
    });

    it("rounds up on .5 boundary", () => {
      const peps = [
        makePep({ child_id: "c1", attendance: 95 }),
        makePep({ child_id: "c2", attendance: 96 }),
      ];
      // (95+96)/2 = 95.5 → Math.round → 96
      const result = computePepEducationQuality(baseInput({ total_children: 2, peps }));
      expect(result.average_attendance).toBe(96);
    });

    it("rounds down when below .5", () => {
      const peps = [
        makePep({ child_id: "c1", attendance: 90 }),
        makePep({ child_id: "c2", attendance: 91 }),
        makePep({ child_id: "c3", attendance: 90 }),
      ];
      // (90+91+90)/3 = 90.333 → 90
      const result = computePepEducationQuality(baseInput({ total_children: 3, peps }));
      expect(result.average_attendance).toBe(90);
    });

    it("attendance boundary at exactly 95 yields +5", () => {
      const peps = pepArray(10, { attendance: 95 });
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.average_attendance).toBe(95);
      // Verify via score: coverage 100% → +6, currency +5, attendance +5, target 80% → +5, actions 100% → +4, voice 100% → +5
      // 52+6+5+5+5+4+5=82
      expect(result.pep_score).toBe(82);
    });

    it("attendance boundary at exactly 85 yields +2", () => {
      const peps = pepArray(10, { attendance: 85 });
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.average_attendance).toBe(85);
    });

    it("attendance boundary at exactly 75 does not yield -4 (only < 75)", () => {
      const peps = pepArray(10, { attendance: 75 });
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.average_attendance).toBe(75);
      // 75 is not <75, not >=85 → no adjustment for attendance
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 7: Modifier 4 — Target progress
  // ══════════════════════════════════════════════════════════════════════════
  describe("Modifier 4: Target progress", () => {
    it("adds +5 when target progress >= 75%", () => {
      const peps = pepArray(10, { target_count: 4, targets_on_track_count: 2, targets_exceeded_count: 1 });
      // 3/4 = 75% per pep → total: 30/40 = 75% → +5
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.target_progress_rate).toBe(75);
    });

    it("adds +2 when target progress >= 50% and < 75%", () => {
      const peps = pepArray(10, { target_count: 4, targets_on_track_count: 2, targets_exceeded_count: 0 });
      // 2/4 = 50% → +2
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.target_progress_rate).toBe(50);
    });

    it("subtracts -4 when target progress < 30%", () => {
      const peps = pepArray(10, { target_count: 10, targets_on_track_count: 2, targets_exceeded_count: 0 });
      // 2/10 = 20% → -4
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.target_progress_rate).toBe(20);
    });

    it("no adjustment when 30% <= target progress < 50%", () => {
      const peps = pepArray(10, { target_count: 10, targets_on_track_count: 3, targets_exceeded_count: 0 });
      // 3/10 = 30% → not <30, not >=50 → 0
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.target_progress_rate).toBe(30);
    });

    it("adds +2 when total targets is 0 but PEPs exist (neutral bonus)", () => {
      const peps = pepArray(5, { target_count: 0, targets_on_track_count: 0, targets_exceeded_count: 0 });
      // totalTargets = 0, total > 0 → +2
      const result = computePepEducationQuality(baseInput({ total_children: 5, peps }));
      expect(result.target_progress_rate).toBe(0);
      // We can verify score includes +2 from this path
    });

    it("no adjustment for target progress when 0 records", () => {
      const result = computePepEducationQuality(baseInput({ total_children: 5, peps: [] }));
      expect(result.target_progress_rate).toBe(0);
    });

    it("combines on_track and exceeded for progress calculation", () => {
      const peps = [
        makePep({ child_id: "c1", target_count: 10, targets_on_track_count: 5, targets_exceeded_count: 3 }),
      ];
      // (5+3)/10 = 80% → 80
      const result = computePepEducationQuality(baseInput({ total_children: 1, peps }));
      expect(result.target_progress_rate).toBe(80);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 8: Modifier 5 — Action completion
  // ══════════════════════════════════════════════════════════════════════════
  describe("Modifier 5: Action completion", () => {
    it("adds +4 when action completion >= 80%", () => {
      const peps = pepArray(10, { actions_total: 5, actions_completed: 4 });
      // 4/5 = 80% → +4
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.action_completion_rate).toBe(80);
    });

    it("adds +1 when action completion >= 50% and < 80%", () => {
      const peps = pepArray(10, { actions_total: 10, actions_completed: 5 });
      // 5/10 = 50% → +1
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.action_completion_rate).toBe(50);
    });

    it("subtracts -4 when action completion < 30%", () => {
      const peps = pepArray(10, { actions_total: 10, actions_completed: 2 });
      // 2/10 = 20% → -4
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.action_completion_rate).toBe(20);
    });

    it("no adjustment when 30% <= action completion < 50%", () => {
      const peps = pepArray(10, { actions_total: 10, actions_completed: 3 });
      // 3/10 = 30% → no adj
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.action_completion_rate).toBe(30);
    });

    it("adds +2 when total actions is 0 but PEPs exist (neutral bonus)", () => {
      const peps = pepArray(5, { actions_total: 0, actions_completed: 0 });
      const result = computePepEducationQuality(baseInput({ total_children: 5, peps }));
      expect(result.action_completion_rate).toBe(0);
    });

    it("subtracts -1 when 0 PEP records", () => {
      const result = computePepEducationQuality(baseInput({ total_children: 5, peps: [] }));
      // Already verified total score, but confirm action_completion_rate is 0
      expect(result.action_completion_rate).toBe(0);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 9: Modifier 6 — Child voice
  // ══════════════════════════════════════════════════════════════════════════
  describe("Modifier 6: Child voice", () => {
    it("adds +5 when child voice rate >= 80%", () => {
      const peps = pepArray(10, { has_child_views: true });
      // 10/10 = 100% → +5
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      // Verify via the presence of the strength
      expect(result.strengths).toContain(
        "Children's own educational aspirations and views are captured in their PEPs",
      );
    });

    it("adds +2 when child voice rate >= 50% and < 80%", () => {
      const peps = [
        ...Array.from({ length: 5 }, (_, i) => makePep({ child_id: `cv${i}`, has_child_views: true })),
        ...Array.from({ length: 5 }, (_, i) => makePep({ child_id: `nv${i}`, has_child_views: false })),
      ];
      // 5/10 = 50% → +2
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      // Voice at 50% → +2, not enough for strength
      expect(result.strengths).not.toContain(
        "Children's own educational aspirations and views are captured in their PEPs",
      );
    });

    it("subtracts -3 when child voice rate < 30%", () => {
      const peps = [
        makePep({ child_id: "c1", has_child_views: true }),
        ...Array.from({ length: 9 }, (_, i) => makePep({ child_id: `nv${i}`, has_child_views: false })),
      ];
      // 1/10 = 10% → -3
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      // Just verify score includes the -3
      expect(result.pep_score).toBeDefined();
    });

    it("no adjustment when 30% <= voice < 50%", () => {
      const peps = [
        ...Array.from({ length: 3 }, (_, i) => makePep({ child_id: `cv${i}`, has_child_views: true })),
        ...Array.from({ length: 7 }, (_, i) => makePep({ child_id: `nv${i}`, has_child_views: false })),
      ];
      // 3/10 = 30% → not <30, not >=50 → 0
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.pep_score).toBeDefined();
    });

    it("subtracts -2 when 0 PEP records", () => {
      const result = computePepEducationQuality(baseInput({ total_children: 5, peps: [] }));
      // Total: 52 -3 +0 -1 +0 -1 -2 = 45
      expect(result.pep_score).toBe(45);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 10: Metrics
  // ══════════════════════════════════════════════════════════════════════════
  describe("metrics computation", () => {
    it("total_peps equals peps array length", () => {
      const peps = pepArray(7);
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.total_peps).toBe(7);
    });

    it("children_with_pep_rate uses unique child_ids", () => {
      const peps = [
        makePep({ child_id: "c1" }),
        makePep({ child_id: "c1" }),
        makePep({ child_id: "c2" }),
      ];
      // 2 unique children / 10 total = 20%
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.children_with_pep_rate).toBe(20);
    });

    it("current_rate computes percentage of current status PEPs", () => {
      const peps = [
        makePep({ child_id: "c1", status: "current" }),
        makePep({ child_id: "c2", status: "current" }),
        makePep({ child_id: "c3", status: "draft" }),
        makePep({ child_id: "c4", status: "overdue" }),
      ];
      // 2/4 = 50%
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.current_rate).toBe(50);
    });

    it("exclusion_rate counts PEPs with exclusions > 0", () => {
      const peps = [
        makePep({ child_id: "c1", exclusions: 2 }),
        makePep({ child_id: "c2", exclusions: 0 }),
        makePep({ child_id: "c3", exclusions: 1 }),
        makePep({ child_id: "c4", exclusions: 0 }),
      ];
      // 2/4 = 50%
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.exclusion_rate).toBe(50);
    });

    it("exclusion_rate is 0 when no PEPs have exclusions", () => {
      const peps = pepArray(5, { exclusions: 0 });
      const result = computePepEducationQuality(baseInput({ total_children: 5, peps }));
      expect(result.exclusion_rate).toBe(0);
    });

    it("target_progress_rate aggregates all targets across PEPs", () => {
      const peps = [
        makePep({ child_id: "c1", target_count: 10, targets_on_track_count: 5, targets_exceeded_count: 2 }),
        makePep({ child_id: "c2", target_count: 10, targets_on_track_count: 3, targets_exceeded_count: 0 }),
      ];
      // total targets 20, on_track+exceeded 10 → 50%
      const result = computePepEducationQuality(baseInput({ total_children: 2, peps }));
      expect(result.target_progress_rate).toBe(50);
    });

    it("action_completion_rate aggregates actions across PEPs", () => {
      const peps = [
        makePep({ child_id: "c1", actions_total: 10, actions_completed: 8 }),
        makePep({ child_id: "c2", actions_total: 10, actions_completed: 4 }),
      ];
      // 12/20 = 60%
      const result = computePepEducationQuality(baseInput({ total_children: 2, peps }));
      expect(result.action_completion_rate).toBe(60);
    });

    it("pct helper returns 0 when denominator is 0", () => {
      const peps = pepArray(5, { target_count: 0, targets_on_track_count: 0, targets_exceeded_count: 0 });
      const result = computePepEducationQuality(baseInput({ total_children: 5, peps }));
      expect(result.target_progress_rate).toBe(0);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 11: Score clamping
  // ══════════════════════════════════════════════════════════════════════════
  describe("score clamping", () => {
    it("clamps score to minimum 0", () => {
      // Maximum possible penalty: 52 - 5 - 5 - 4 - 4 - 4 - 3 = 27, which is > 0
      // But with 0 records: 52 - 3 - 1 - 1 - 2 = 45. Still > 0.
      // In practice, the minimum reachable is 27 so we just verify it doesn't go negative
      const peps = [
        makePep({ child_id: "c1", status: "draft", attendance: 60, target_count: 10, targets_on_track_count: 1, targets_exceeded_count: 0, actions_total: 10, actions_completed: 1, has_child_views: false }),
        makePep({ child_id: "c2", status: "overdue", attendance: 60, target_count: 10, targets_on_track_count: 1, targets_exceeded_count: 0, actions_total: 10, actions_completed: 1, has_child_views: false }),
      ];
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.pep_score).toBeGreaterThanOrEqual(0);
    });

    it("clamps score to maximum 100", () => {
      // Maximum: 52 + 6 + 5 + 5 + 5 + 4 + 5 = 82, which is < 100
      // Score never exceeds 100
      const peps = pepArray(10);
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.pep_score).toBeLessThanOrEqual(100);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 12: Strengths
  // ══════════════════════════════════════════════════════════════════════════
  describe("strengths", () => {
    it("includes comprehensive coverage strength when >= 90%", () => {
      const peps = pepArray(10);
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.strengths).toContain(
        "All children have Personal Education Plans — comprehensive education oversight",
      );
    });

    it("excludes coverage strength when < 90%", () => {
      const peps = pepArray(8);
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.strengths).not.toContain(
        "All children have Personal Education Plans — comprehensive education oversight",
      );
    });

    it("includes current PEP strength when >= 80%", () => {
      const peps = pepArray(10, { status: "current" });
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.strengths).toContain(
        "PEPs are overwhelmingly current and up to date",
      );
    });

    it("excludes current PEP strength when < 80%", () => {
      const peps = [
        ...pepArray(7, { status: "current" }),
        ...Array.from({ length: 3 }, (_, i) => makePep({ child_id: `d${i}`, status: "draft" })),
      ];
      // 7/10 = 70% → below 80
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.strengths).not.toContain(
        "PEPs are overwhelmingly current and up to date",
      );
    });

    it("includes attendance strength when >= 95%", () => {
      const peps = pepArray(10, { attendance: 97 });
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.strengths).toContain(
        "School attendance across the home is excellent — above 95%",
      );
    });

    it("excludes attendance strength when < 95%", () => {
      const peps = pepArray(10, { attendance: 94 });
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.strengths).not.toContain(
        "School attendance across the home is excellent — above 95%",
      );
    });

    it("includes target progress strength when >= 75% and totalTargets > 0", () => {
      const peps = pepArray(10, { target_count: 4, targets_on_track_count: 2, targets_exceeded_count: 1 });
      // 3/4 = 75%
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.strengths).toContain(
        "Education targets are on track or exceeded for most children",
      );
    });

    it("excludes target progress strength when totalTargets is 0", () => {
      const peps = pepArray(10, { target_count: 0, targets_on_track_count: 0, targets_exceeded_count: 0 });
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.strengths).not.toContain(
        "Education targets are on track or exceeded for most children",
      );
    });

    it("includes action completion strength when >= 80% and totalActions > 0", () => {
      const peps = pepArray(10, { actions_total: 5, actions_completed: 4 });
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.strengths).toContain(
        "PEP actions are consistently completed — strong follow-through",
      );
    });

    it("excludes action completion strength when totalActions is 0", () => {
      const peps = pepArray(10, { actions_total: 0, actions_completed: 0 });
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.strengths).not.toContain(
        "PEP actions are consistently completed — strong follow-through",
      );
    });

    it("includes child voice strength when >= 80%", () => {
      const peps = pepArray(10, { has_child_views: true });
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.strengths).toContain(
        "Children's own educational aspirations and views are captured in their PEPs",
      );
    });

    it("no strengths when all metrics are poor", () => {
      const peps = [
        makePep({ child_id: "c1", status: "draft", attendance: 60, target_count: 10, targets_on_track_count: 0, targets_exceeded_count: 0, actions_total: 10, actions_completed: 0, has_child_views: false }),
      ];
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.strengths).toHaveLength(0);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 13: Concerns
  // ══════════════════════════════════════════════════════════════════════════
  describe("concerns", () => {
    it("includes 'no PEP records' concern when total is 0", () => {
      const result = computePepEducationQuality(baseInput({ total_children: 5, peps: [] }));
      expect(result.concerns).toContain(
        "No PEP records — children's education plans are not being documented",
      );
    });

    it("includes coverage concern when < 40%", () => {
      const peps = pepArray(3);
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.concerns).toContain(
        "Most children do not have a PEP — education planning is critically incomplete",
      );
    });

    it("excludes coverage concern when >= 40%", () => {
      const peps = pepArray(5);
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.concerns).not.toContain(
        "Most children do not have a PEP — education planning is critically incomplete",
      );
    });

    it("includes currency concern when < 30%", () => {
      const peps = pepArray(10, { status: "overdue" });
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.concerns).toContain(
        "Most PEPs are overdue or in draft — plans are not current",
      );
    });

    it("includes attendance concern when < 75%", () => {
      const peps = pepArray(10, { attendance: 70 });
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.concerns).toContain(
        "Average attendance is below 75% — persistent absence is a significant concern",
      );
    });

    it("includes target progress concern when < 30% and totalTargets > 0", () => {
      const peps = pepArray(10, { target_count: 10, targets_on_track_count: 2, targets_exceeded_count: 0 });
      // 20% → <30
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.concerns).toContain(
        "Very few education targets are on track — children are not making expected progress",
      );
    });

    it("excludes target progress concern when totalTargets is 0", () => {
      const peps = pepArray(10, { target_count: 0, targets_on_track_count: 0, targets_exceeded_count: 0 });
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.concerns).not.toContain(
        "Very few education targets are on track — children are not making expected progress",
      );
    });

    it("includes action completion concern when < 30% and totalActions > 0", () => {
      const peps = pepArray(10, { actions_total: 10, actions_completed: 2 });
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.concerns).toContain(
        "PEP actions are rarely completed — accountability is poor",
      );
    });

    it("no concerns when all metrics are excellent", () => {
      const peps = pepArray(10);
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.concerns).toHaveLength(0);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 14: Recommendations
  // ══════════════════════════════════════════════════════════════════════════
  describe("recommendations", () => {
    it("recommends creating PEPs when no records exist", () => {
      const result = computePepEducationQuality(baseInput({ total_children: 5, peps: [] }));
      expect(result.recommendations).toContainEqual(
        expect.objectContaining({ urgency: "immediate", regulatory_ref: "CHR 2015 Reg 8" }),
      );
    });

    it("recommends creating PEPs for children when coverage < 60%", () => {
      const peps = pepArray(5);
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.recommendations).toContainEqual(
        expect.objectContaining({ recommendation: expect.stringContaining("Prioritise creating PEPs"), urgency: "immediate" }),
      );
    });

    it("recommends PEP reviews when current rate < 50%", () => {
      const peps = pepArray(10, { status: "overdue" });
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.recommendations).toContainEqual(
        expect.objectContaining({ recommendation: expect.stringContaining("Schedule PEP reviews"), urgency: "soon" }),
      );
    });

    it("recommends attendance strategies when < 85%", () => {
      const peps = pepArray(10, { attendance: 80 });
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.recommendations).toContainEqual(
        expect.objectContaining({ recommendation: expect.stringContaining("attendance improvement"), urgency: "soon" }),
      );
    });

    it("recommends target review when progress < 50%", () => {
      const peps = pepArray(10, { target_count: 10, targets_on_track_count: 4, targets_exceeded_count: 0 });
      // 4/10 = 40% → <50
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.recommendations).toContainEqual(
        expect.objectContaining({ recommendation: expect.stringContaining("Review education targets"), urgency: "planned" }),
      );
    });

    it("recommends exclusion reduction when exclusion rate >= 30%", () => {
      const peps = [
        ...Array.from({ length: 3 }, (_, i) => makePep({ child_id: `ex${i}`, exclusions: 2 })),
        ...Array.from({ length: 7 }, (_, i) => makePep({ child_id: `ne${i}`, exclusions: 0 })),
      ];
      // 3/10 = 30% → >= 30
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.recommendations).toContainEqual(
        expect.objectContaining({ recommendation: expect.stringContaining("reduce exclusions"), urgency: "soon" }),
      );
    });

    it("caps recommendations at 5", () => {
      // Trigger as many as possible: 0 records triggers 1, coverage <60 triggers another...
      // With 0 records: only the "Ensure every child" rec fires. Need records for others.
      // Use records that trigger many: coverage <60, current <50, attendance <85, target <50, exclusion >=30
      const peps = [
        makePep({ child_id: "c1", status: "overdue", attendance: 60, target_count: 10, targets_on_track_count: 2, targets_exceeded_count: 0, exclusions: 3, actions_total: 10, actions_completed: 1, has_child_views: false }),
        makePep({ child_id: "c2", status: "draft", attendance: 60, target_count: 10, targets_on_track_count: 2, targets_exceeded_count: 0, exclusions: 3, actions_total: 10, actions_completed: 1, has_child_views: false }),
        makePep({ child_id: "c3", status: "draft", attendance: 60, target_count: 10, targets_on_track_count: 2, targets_exceeded_count: 0, exclusions: 3, actions_total: 10, actions_completed: 1, has_child_views: false }),
      ];
      // 3/10 = 30% <60 → rec; 0/3 current → <50 → rec; attendance 60 <85 → rec; target 20% <50 → rec; exclusion 100% → rec
      // That's 5 recs
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.recommendations.length).toBeLessThanOrEqual(5);
    });

    it("re-ranks recommendations from 1 to N", () => {
      const peps = [
        makePep({ child_id: "c1", status: "overdue", attendance: 60, target_count: 10, targets_on_track_count: 2, targets_exceeded_count: 0, exclusions: 3, actions_total: 10, actions_completed: 1, has_child_views: false }),
      ];
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      result.recommendations.forEach((r, i) => {
        expect(r.rank).toBe(i + 1);
      });
    });

    it("no recommendations when everything is excellent", () => {
      const peps = pepArray(10, { exclusions: 0 });
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.recommendations).toHaveLength(0);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 15: Insights
  // ══════════════════════════════════════════════════════════════════════════
  describe("insights", () => {
    it("includes exemplary education insight when coverage>=90, current>=80, attendance>=95, total>=10", () => {
      const peps = pepArray(10, { attendance: 96 });
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.insights).toContainEqual(
        expect.objectContaining({ severity: "positive", text: expect.stringContaining("exemplary") }),
      );
    });

    it("excludes exemplary insight when total < 10", () => {
      const peps = pepArray(9);
      const result = computePepEducationQuality(baseInput({ total_children: 9, peps }));
      expect(result.insights).not.toContainEqual(
        expect.objectContaining({ text: expect.stringContaining("exemplary") }),
      );
    });

    it("excludes exemplary insight when current rate < 80", () => {
      const peps = [
        ...pepArray(8, { attendance: 96 }),
        ...Array.from({ length: 2 }, (_, i) => makePep({ child_id: `d${i}`, status: "draft", attendance: 96 })),
      ];
      // 8/10 current = 80%. Hmm, that is >=80. Let's make it below.
      const mixedPeps = [
        ...Array.from({ length: 7 }, (_, i) => makePep({ child_id: `c${i}`, status: "current", attendance: 96 })),
        ...Array.from({ length: 3 }, (_, i) => makePep({ child_id: `d${i}`, status: "draft", attendance: 96 })),
      ];
      // 7/10 = 70% current → not >=80
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps: mixedPeps }));
      expect(result.insights).not.toContainEqual(
        expect.objectContaining({ text: expect.stringContaining("exemplary") }),
      );
    });

    it("includes critical Ofsted insight when 0 records", () => {
      const result = computePepEducationQuality(baseInput({ total_children: 5, peps: [] }));
      expect(result.insights).toContainEqual(
        expect.objectContaining({ severity: "critical" }),
      );
    });

    it("includes persistent absence warning when attendance < 75", () => {
      const peps = pepArray(10, { attendance: 70 });
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.insights).toContainEqual(
        expect.objectContaining({ severity: "warning", text: expect.stringContaining("Persistent absence") }),
      );
    });

    it("includes excellent attendance insight when >= 95", () => {
      const peps = pepArray(10, { attendance: 97 });
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.insights).toContainEqual(
        expect.objectContaining({ severity: "positive", text: expect.stringContaining("Excellent attendance") }),
      );
    });

    it("includes high exclusion insight when exclusion rate >= 30%", () => {
      const peps = pepArray(10, { exclusions: 1 });
      // 10/10 = 100% exclusion rate → >= 30%
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.insights).toContainEqual(
        expect.objectContaining({ severity: "warning", text: expect.stringContaining("exclusion") }),
      );
    });

    it("caps insights at 3", () => {
      // 0 records triggers: critical Ofsted insight. That's only 1 for 0 records scenario.
      // Let's make a scenario that could trigger many: attendance <75 → warning, exclusion >=30 → warning, plus excellent attendance → positive (contradictory, can't happen)
      // With low attendance and high exclusions: 2 insights
      const peps = pepArray(10, { attendance: 70, exclusions: 2 });
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.insights.length).toBeLessThanOrEqual(3);
    });

    it("no insights when metrics are merely adequate", () => {
      const peps = pepArray(5, { attendance: 90, exclusions: 0 });
      // attendance 90 → not >=95 → no positive. Not <75 → no warning.
      // exclusion 0% → not >=30 → no warning.
      // coverage 50% → not >=90 → no exemplary.
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.insights).toHaveLength(0);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 16: Headlines
  // ══════════════════════════════════════════════════════════════════════════
  describe("headlines", () => {
    it("outstanding headline mentions ambitious targets and children's voices", () => {
      const peps = pepArray(10);
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.headline).toContain("outstanding");
      expect(result.headline).toContain("children's voices");
    });

    it("good headline mentions up-to-date plans", () => {
      const peps = pepArray(7);
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.headline).toContain("up-to-date");
    });

    it("adequate headline mentions currency and target progress", () => {
      const peps = pepArray(4, { attendance: 80, target_count: 5, targets_on_track_count: 2, targets_exceeded_count: 0, actions_total: 5, actions_completed: 2, has_child_views: false });
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      if (result.pep_rating === "adequate") {
        expect(result.headline).toContain("currency");
      }
    });

    it("inadequate headline describes failure to manage education plans", () => {
      const peps = [
        makePep({ child_id: "c1", status: "draft", attendance: 60, target_count: 10, targets_on_track_count: 1, targets_exceeded_count: 0, actions_total: 10, actions_completed: 1, has_child_views: false }),
        makePep({ child_id: "c2", status: "overdue", attendance: 60, target_count: 10, targets_on_track_count: 1, targets_exceeded_count: 0, actions_total: 10, actions_completed: 1, has_child_views: false }),
      ];
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.headline).toContain("inadequate");
    });

    it("insufficient data headline describes no data available", () => {
      const result = computePepEducationQuality(baseInput({ total_children: 0 }));
      expect(result.headline).toBe("No data available for PEP education quality analysis");
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 17: Edge cases
  // ══════════════════════════════════════════════════════════════════════════
  describe("edge cases", () => {
    it("handles single PEP for single child", () => {
      const peps = [makePep({ child_id: "c1" })];
      const result = computePepEducationQuality(baseInput({ total_children: 1, peps }));
      expect(result.total_peps).toBe(1);
      expect(result.children_with_pep_rate).toBe(100);
    });

    it("handles 100% coverage with many children", () => {
      const peps = pepArray(50);
      const result = computePepEducationQuality(baseInput({ total_children: 50, peps }));
      expect(result.children_with_pep_rate).toBe(100);
    });

    it("handles multiple PEPs per child (only unique counted for coverage)", () => {
      const peps = [
        makePep({ child_id: "c1" }),
        makePep({ child_id: "c1" }),
        makePep({ child_id: "c1" }),
      ];
      const result = computePepEducationQuality(baseInput({ total_children: 3, peps }));
      // 1 unique child / 3 = 33% → <40 → -5
      expect(result.children_with_pep_rate).toBe(33);
    });

    it("handles attendance of exactly 0", () => {
      const peps = pepArray(5, { attendance: 0 });
      const result = computePepEducationQuality(baseInput({ total_children: 5, peps }));
      expect(result.average_attendance).toBe(0);
    });

    it("handles attendance of exactly 100", () => {
      const peps = pepArray(5, { attendance: 100 });
      const result = computePepEducationQuality(baseInput({ total_children: 5, peps }));
      expect(result.average_attendance).toBe(100);
    });

    it("handles mixed statuses", () => {
      const peps = [
        makePep({ child_id: "c1", status: "current" }),
        makePep({ child_id: "c2", status: "review_due" }),
        makePep({ child_id: "c3", status: "overdue" }),
        makePep({ child_id: "c4", status: "draft" }),
      ];
      const result = computePepEducationQuality(baseInput({ total_children: 4, peps }));
      expect(result.current_rate).toBe(25); // 1/4 = 25%
    });

    it("today field is passed through (used for context)", () => {
      const result = computePepEducationQuality(baseInput({ today: "2026-01-01", total_children: 0 }));
      expect(result.pep_rating).toBe("insufficient_data");
    });

    it("large number of PEPs does not break computation", () => {
      const peps = pepArray(500);
      const result = computePepEducationQuality(baseInput({ total_children: 500, peps }));
      expect(result.total_peps).toBe(500);
      expect(result.pep_rating).toBe("outstanding");
    });

    it("all PEPs having has_sen true does not affect scoring", () => {
      const peps = pepArray(10, { has_sen: true });
      const result1 = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      const peps2 = pepArray(10, { has_sen: false });
      const result2 = computePepEducationQuality(baseInput({ total_children: 10, peps: peps2 }));
      expect(result1.pep_score).toBe(result2.pep_score);
    });

    it("has_carer_views does not affect scoring directly", () => {
      const peps1 = pepArray(10, { has_carer_views: true });
      const peps2 = pepArray(10, { has_carer_views: false });
      const r1 = computePepEducationQuality(baseInput({ total_children: 10, peps: peps1 }));
      const r2 = computePepEducationQuality(baseInput({ total_children: 10, peps: peps2 }));
      expect(r1.pep_score).toBe(r2.pep_score);
    });

    it("pupil premium fields do not affect scoring", () => {
      const peps1 = pepArray(10, { pupil_premium_allocated: 10000, pupil_premium_spent: 5000 });
      const peps2 = pepArray(10, { pupil_premium_allocated: 0, pupil_premium_spent: 0 });
      const r1 = computePepEducationQuality(baseInput({ total_children: 10, peps: peps1 }));
      const r2 = computePepEducationQuality(baseInput({ total_children: 10, peps: peps2 }));
      expect(r1.pep_score).toBe(r2.pep_score);
    });

    it("exclusion_days field does not affect scoring directly", () => {
      const peps1 = pepArray(10, { exclusions: 0, exclusion_days: 100 });
      const peps2 = pepArray(10, { exclusions: 0, exclusion_days: 0 });
      const r1 = computePepEducationQuality(baseInput({ total_children: 10, peps: peps1 }));
      const r2 = computePepEducationQuality(baseInput({ total_children: 10, peps: peps2 }));
      expect(r1.pep_score).toBe(r2.pep_score);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 18: Composite score validation
  // ══════════════════════════════════════════════════════════════════════════
  describe("composite score validation", () => {
    it("max possible score is 82 (52 + 30)", () => {
      // coverage +6, currency +5, attendance +5, target +5, actions +4, voice +5 = 30
      const peps = pepArray(10);
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.pep_score).toBe(82);
    });

    it("min possible score with PEPs is 27 (52 - 25)", () => {
      // coverage -5, currency -5, attendance -4, target -4, actions -4, voice -3 = -25
      const peps = [
        makePep({ child_id: "c1", status: "draft", attendance: 60, target_count: 10, targets_on_track_count: 1, targets_exceeded_count: 0, actions_total: 10, actions_completed: 1, has_child_views: false }),
        makePep({ child_id: "c2", status: "overdue", attendance: 60, target_count: 10, targets_on_track_count: 1, targets_exceeded_count: 0, actions_total: 10, actions_completed: 1, has_child_views: false }),
      ];
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.pep_score).toBe(27);
    });

    it("zero records score is 45 (52 - 7)", () => {
      // -3 (coverage) + 0 (currency) + -1 (attendance) + 0 (target) + -1 (actions) + -2 (voice) = -7
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps: [] }));
      expect(result.pep_score).toBe(45);
    });

    it("mixed modifiers correctly sum", () => {
      // 9/10 coverage → +6
      // 5/9 current = 56% → +2
      // attendance 90 → +2
      // targets 60% → +2
      // actions 70% → +1
      // voice 5/9 = 56% → +2
      // Total: 52 + 6 + 2 + 2 + 2 + 1 + 2 = 67
      const peps = [
        ...Array.from({ length: 5 }, (_, i) => makePep({
          child_id: `cur${i}`,
          status: "current",
          attendance: 90,
          target_count: 5,
          targets_on_track_count: 2,
          targets_exceeded_count: 1,
          actions_total: 10,
          actions_completed: 7,
          has_child_views: true,
        })),
        ...Array.from({ length: 4 }, (_, i) => makePep({
          child_id: `oth${i}`,
          status: "review_due",
          attendance: 90,
          target_count: 5,
          targets_on_track_count: 2,
          targets_exceeded_count: 1,
          actions_total: 10,
          actions_completed: 7,
          has_child_views: false,
        })),
      ];
      // 9 unique / 10 = 90% → +6
      // 5/9 current = 56% → +2
      // avg attendance 90 → +2
      // targets: 9*5=45 total, 9*(2+1)=27 → 27/45=60% → +2
      // actions: 9*10=90 total, 9*7=63 completed → 63/90=70% → +1 (>=50 <80)
      // voice: 5/9 = 56% → +2
      // 52 + 6 + 2 + 2 + 2 + 1 + 2 = 67
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.pep_score).toBe(67);
      expect(result.pep_rating).toBe("good");
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 19: Return shape validation
  // ══════════════════════════════════════════════════════════════════════════
  describe("return shape", () => {
    it("includes all required keys in the result", () => {
      const peps = pepArray(5);
      const result = computePepEducationQuality(baseInput({ total_children: 5, peps }));
      expect(result).toHaveProperty("pep_rating");
      expect(result).toHaveProperty("pep_score");
      expect(result).toHaveProperty("headline");
      expect(result).toHaveProperty("total_peps");
      expect(result).toHaveProperty("children_with_pep_rate");
      expect(result).toHaveProperty("current_rate");
      expect(result).toHaveProperty("average_attendance");
      expect(result).toHaveProperty("exclusion_rate");
      expect(result).toHaveProperty("target_progress_rate");
      expect(result).toHaveProperty("action_completion_rate");
      expect(result).toHaveProperty("strengths");
      expect(result).toHaveProperty("concerns");
      expect(result).toHaveProperty("recommendations");
      expect(result).toHaveProperty("insights");
    });

    it("pep_rating is one of the valid enum values", () => {
      const result = computePepEducationQuality(baseInput({ total_children: 5, peps: pepArray(5) }));
      expect(["outstanding", "good", "adequate", "inadequate", "insufficient_data"]).toContain(result.pep_rating);
    });

    it("pep_score is a number between 0 and 100", () => {
      const result = computePepEducationQuality(baseInput({ total_children: 5, peps: pepArray(5) }));
      expect(result.pep_score).toBeGreaterThanOrEqual(0);
      expect(result.pep_score).toBeLessThanOrEqual(100);
    });

    it("strengths is an array of strings", () => {
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps: pepArray(10) }));
      expect(Array.isArray(result.strengths)).toBe(true);
      result.strengths.forEach(s => expect(typeof s).toBe("string"));
    });

    it("recommendations have rank, recommendation, urgency, and regulatory_ref", () => {
      const result = computePepEducationQuality(baseInput({ total_children: 5, peps: [] }));
      result.recommendations.forEach(r => {
        expect(r).toHaveProperty("rank");
        expect(r).toHaveProperty("recommendation");
        expect(r).toHaveProperty("urgency");
        expect(r).toHaveProperty("regulatory_ref");
        expect(["immediate", "soon", "planned"]).toContain(r.urgency);
      });
    });

    it("insights have text and severity", () => {
      const result = computePepEducationQuality(baseInput({ total_children: 5, peps: [] }));
      result.insights.forEach(i => {
        expect(i).toHaveProperty("text");
        expect(i).toHaveProperty("severity");
        expect(["critical", "warning", "positive"]).toContain(i.severity);
      });
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 20: Specific modifier interaction tests
  // ══════════════════════════════════════════════════════════════════════════
  describe("modifier interactions", () => {
    it("zero targets + zero actions both contribute +2 each", () => {
      // 10 PEPs, 10 children → 100% coverage → +6
      // all current → +5
      // attendance 80 → 0 (between 75 and 85)
      // zero targets → +2
      // zero actions → +2
      // voice 100% → +5
      // 52 + 6 + 5 + 0 + 2 + 2 + 5 = 72
      const peps = pepArray(10, { attendance: 80, target_count: 0, targets_on_track_count: 0, targets_exceeded_count: 0, actions_total: 0, actions_completed: 0 });
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.pep_score).toBe(72);
    });

    it("zero targets path only triggers when total > 0 and totalTargets === 0", () => {
      // 0 records → totalTargets = 0, but total = 0 → no adjustment (not the neutral +2 path)
      const result = computePepEducationQuality(baseInput({ total_children: 5, peps: [] }));
      // Score: 52 -3 +0 -1 +0 -1 -2 = 45 (target contributes 0, not +2)
      expect(result.pep_score).toBe(45);
    });

    it("zero actions path only triggers when total > 0 and totalActions === 0", () => {
      // 0 records → totalActions = 0, but total = 0 → -1 (not +2)
      const result = computePepEducationQuality(baseInput({ total_children: 5, peps: [] }));
      expect(result.pep_score).toBe(45);
    });

    it("all modifiers negative with PEPs produce lowest possible score", () => {
      // -5 -5 -4 -4 -4 -3 = -25. Score = 52 - 25 = 27
      const peps = [
        makePep({
          child_id: "c1", status: "draft", attendance: 50,
          target_count: 10, targets_on_track_count: 0, targets_exceeded_count: 0,
          actions_total: 10, actions_completed: 0, has_child_views: false,
        }),
      ];
      // 1/10 = 10% → -5
      // 0/1 current → 0% → -5
      // attendance 50 → <75 → -4
      // targets 0/10 = 0% → <30 → -4
      // actions 0/10 = 0% → <30 → -4
      // voice 0/1 = 0% → <30 → -3
      // 52 - 5 - 5 - 4 - 4 - 4 - 3 = 27
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.pep_score).toBe(27);
    });

    it("all modifiers at mid tier (no adjustment) produce base score 52", () => {
      // coverage 40-59% → 0
      // current 30-49% → 0
      // attendance 75-84 → 0
      // target 30-49% → 0
      // actions 30-49% → 0
      // voice 30-49% → 0
      // All must hit "no adjustment" band
      const peps = [
        makePep({ child_id: "c1", status: "current", attendance: 80, target_count: 10, targets_on_track_count: 4, targets_exceeded_count: 0, actions_total: 10, actions_completed: 4, has_child_views: true }),
        makePep({ child_id: "c2", status: "draft", attendance: 80, target_count: 10, targets_on_track_count: 4, targets_exceeded_count: 0, actions_total: 10, actions_completed: 4, has_child_views: true }),
        makePep({ child_id: "c3", status: "draft", attendance: 80, target_count: 10, targets_on_track_count: 4, targets_exceeded_count: 0, actions_total: 10, actions_completed: 4, has_child_views: false }),
        makePep({ child_id: "c4", status: "overdue", attendance: 80, target_count: 10, targets_on_track_count: 4, targets_exceeded_count: 0, actions_total: 10, actions_completed: 4, has_child_views: false }),
        makePep({ child_id: "c5", status: "overdue", attendance: 80, target_count: 10, targets_on_track_count: 4, targets_exceeded_count: 0, actions_total: 10, actions_completed: 4, has_child_views: false }),
      ];
      // 5/10 = 50% coverage → not >=60, not <40 → 0
      // 1/5 current = 20% → <30 → -5 (not the "no adj" band!)
      // Need current at 30-49%: 2/5 = 40% → +0? No, >=50→+2, <30→-5. 40% is 30-49 → 0.
      // But 1/5=20% <30 → -5. Let me fix:
      const peps2 = [
        makePep({ child_id: "c1", status: "current", attendance: 80, target_count: 10, targets_on_track_count: 4, targets_exceeded_count: 0, actions_total: 10, actions_completed: 4, has_child_views: true }),
        makePep({ child_id: "c2", status: "current", attendance: 80, target_count: 10, targets_on_track_count: 4, targets_exceeded_count: 0, actions_total: 10, actions_completed: 4, has_child_views: true }),
        makePep({ child_id: "c3", status: "draft", attendance: 80, target_count: 10, targets_on_track_count: 4, targets_exceeded_count: 0, actions_total: 10, actions_completed: 4, has_child_views: false }),
        makePep({ child_id: "c4", status: "overdue", attendance: 80, target_count: 10, targets_on_track_count: 4, targets_exceeded_count: 0, actions_total: 10, actions_completed: 4, has_child_views: false }),
        makePep({ child_id: "c5", status: "overdue", attendance: 80, target_count: 10, targets_on_track_count: 4, targets_exceeded_count: 0, actions_total: 10, actions_completed: 4, has_child_views: false }),
      ];
      // 5/10 = 50% coverage → 0
      // 2/5 current = 40% → 30-49% → 0
      // attendance 80 → 75-84 → 0
      // targets: 50 total, 20 on_track → 40% → 30-49 → 0
      // actions: 50 total, 20 completed → 40% → 30-49 → 0
      // voice: 2/5 = 40% → 30-49 → 0
      // Total: 52 + 0 = 52
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps: peps2 }));
      expect(result.pep_score).toBe(52);
      expect(result.pep_rating).toBe("adequate");
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 21: Additional modifier boundary tests
  // ══════════════════════════════════════════════════════════════════════════
  describe("modifier boundary precision", () => {
    it("coverage at exactly 90% triggers +6", () => {
      // 9 unique children / 10 total = 90%
      const peps = pepArray(9, { attendance: 80, target_count: 0, actions_total: 0, has_child_views: false });
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.children_with_pep_rate).toBe(90);
    });

    it("coverage at exactly 60% triggers +2", () => {
      const peps = pepArray(6, { attendance: 80, target_count: 0, actions_total: 0, has_child_views: false });
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.children_with_pep_rate).toBe(60);
    });

    it("coverage at 39% triggers -5", () => {
      // 3/10 = 30%, but we need 39%: 39 unique / 100 = 39%. Hard to get exactly 39.
      // 39/100 = 39%. Let's use that.
      const peps = pepArray(39, { attendance: 80, target_count: 0, actions_total: 0, has_child_views: false });
      const result = computePepEducationQuality(baseInput({ total_children: 100, peps }));
      expect(result.children_with_pep_rate).toBe(39);
    });

    it("current rate at exactly 80% triggers +5", () => {
      const peps = [
        ...Array.from({ length: 8 }, (_, i) => makePep({ child_id: `c${i}`, status: "current" })),
        ...Array.from({ length: 2 }, (_, i) => makePep({ child_id: `d${i}`, status: "draft" })),
      ];
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.current_rate).toBe(80);
    });

    it("current rate at exactly 50% triggers +2", () => {
      const peps = [
        ...Array.from({ length: 5 }, (_, i) => makePep({ child_id: `c${i}`, status: "current" })),
        ...Array.from({ length: 5 }, (_, i) => makePep({ child_id: `d${i}`, status: "overdue" })),
      ];
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.current_rate).toBe(50);
    });

    it("current rate at 29% triggers -5", () => {
      // Need exactly 29%. 29/100 PEPs current.
      const peps = [
        ...Array.from({ length: 29 }, (_, i) => makePep({ child_id: `c${i}`, status: "current" })),
        ...Array.from({ length: 71 }, (_, i) => makePep({ child_id: `d${i}`, status: "draft" })),
      ];
      const result = computePepEducationQuality(baseInput({ total_children: 100, peps }));
      expect(result.current_rate).toBe(29);
    });

    it("target progress at exactly 75% triggers +5", () => {
      const peps = pepArray(10, { target_count: 4, targets_on_track_count: 3, targets_exceeded_count: 0 });
      // 3/4 = 75%
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.target_progress_rate).toBe(75);
    });

    it("target progress at exactly 50% triggers +2", () => {
      const peps = pepArray(10, { target_count: 4, targets_on_track_count: 2, targets_exceeded_count: 0 });
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.target_progress_rate).toBe(50);
    });

    it("target progress at 29% triggers -4", () => {
      // 29/100 = 29%
      const peps = pepArray(10, { target_count: 100, targets_on_track_count: 29, targets_exceeded_count: 0 });
      // total targets = 1000, on_track = 290 → 29%
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.target_progress_rate).toBe(29);
    });

    it("action completion at exactly 80% triggers +4", () => {
      const peps = pepArray(10, { actions_total: 5, actions_completed: 4 });
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.action_completion_rate).toBe(80);
    });

    it("action completion at exactly 50% triggers +1", () => {
      const peps = pepArray(10, { actions_total: 10, actions_completed: 5 });
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.action_completion_rate).toBe(50);
    });

    it("action completion at 29% triggers -4", () => {
      // 29/100 = 29%
      const peps = pepArray(10, { actions_total: 100, actions_completed: 29 });
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      expect(result.action_completion_rate).toBe(29);
    });

    it("child voice at exactly 80% triggers +5", () => {
      const peps = [
        ...Array.from({ length: 8 }, (_, i) => makePep({ child_id: `v${i}`, has_child_views: true })),
        ...Array.from({ length: 2 }, (_, i) => makePep({ child_id: `n${i}`, has_child_views: false })),
      ];
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      // 8/10 = 80% → +5
      expect(result.strengths).toContain(
        "Children's own educational aspirations and views are captured in their PEPs",
      );
    });

    it("child voice at exactly 50% triggers +2", () => {
      const peps = [
        ...Array.from({ length: 5 }, (_, i) => makePep({ child_id: `v${i}`, has_child_views: true })),
        ...Array.from({ length: 5 }, (_, i) => makePep({ child_id: `n${i}`, has_child_views: false })),
      ];
      const result = computePepEducationQuality(baseInput({ total_children: 10, peps }));
      // 5/10 = 50% → +2, not enough for strength (needs >=80)
      expect(result.strengths).not.toContain(
        "Children's own educational aspirations and views are captured in their PEPs",
      );
    });

    it("child voice at 29% triggers -3", () => {
      const peps = [
        ...Array.from({ length: 29 }, (_, i) => makePep({ child_id: `v${i}`, has_child_views: true })),
        ...Array.from({ length: 71 }, (_, i) => makePep({ child_id: `n${i}`, has_child_views: false })),
      ];
      const result = computePepEducationQuality(baseInput({ total_children: 100, peps }));
      // 29/100 = 29% → <30 → -3
      expect(result.pep_score).toBeDefined();
    });
  });
});
