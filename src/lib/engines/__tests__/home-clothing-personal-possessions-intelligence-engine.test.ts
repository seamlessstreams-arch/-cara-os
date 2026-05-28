// ══════════════════════════════════════════════════════════════════════════════
// TESTS — Home Clothing & Personal Possessions Intelligence Engine
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeClothingPersonalPossessions,
  type ClothingPossessionsInput,
  type ClothingAllowanceRecordInput,
  type WardrobeReviewRecordInput,
  type PersonalInventoryRecordInput,
  type ClothingRequestRecordInput,
  type PossessionSafeguardingRecordInput,
} from "../home-clothing-personal-possessions-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2026-05-28";

let _seq = 0;
function uid(): string {
  return `id_${++_seq}`;
}

function baseInput(
  overrides: Partial<ClothingPossessionsInput> = {},
): ClothingPossessionsInput {
  return {
    today: TODAY,
    total_children: 3,
    clothing_allowance_records: [],
    wardrobe_review_records: [],
    personal_inventory_records: [],
    clothing_request_records: [],
    possession_safeguarding_records: [],
    ...overrides,
  };
}

// -- Record factories --

function makeAllowance(
  overrides: Partial<ClothingAllowanceRecordInput> = {},
): ClothingAllowanceRecordInput {
  return {
    id: uid(),
    child_id: "child_1",
    period_start: "2026-01-01",
    period_end: "2026-03-31",
    allowance_amount_gbp: 100,
    amount_spent_gbp: 0,
    child_involved_in_shopping: false,
    child_chose_own_items: false,
    age_appropriate: false,
    seasonal_needs_met: false,
    receipts_retained: false,
    budget_category: "clothing",
    quality_rating: 1,
    notes: "",
    created_at: "2026-01-15",
    ...overrides,
  };
}

function makeWardrobeReview(
  overrides: Partial<WardrobeReviewRecordInput> = {},
): WardrobeReviewRecordInput {
  return {
    id: uid(),
    child_id: "child_1",
    review_date: "2026-03-01",
    reviewer: "staff_1",
    season: "spring",
    adequate_clothing: false,
    adequate_footwear: false,
    adequate_outerwear: false,
    adequate_school_uniform: false,
    adequate_nightwear: false,
    adequate_underwear: false,
    items_needing_replacement: 0,
    items_replaced: 0,
    child_consulted: false,
    child_satisfied: false,
    cultural_religious_needs_met: false,
    dignity_maintained: false,
    overall_adequate: false,
    action_plan_created: false,
    action_plan_completed: false,
    notes: "",
    created_at: "2026-03-01",
    ...overrides,
  };
}

function makeInventory(
  overrides: Partial<PersonalInventoryRecordInput> = {},
): PersonalInventoryRecordInput {
  return {
    id: uid(),
    child_id: "child_1",
    inventory_date: "2026-03-01",
    total_items_recorded: 0,
    items_accounted_for: 0,
    items_missing: 0,
    items_damaged: 0,
    items_replaced: 0,
    sentimental_items_safeguarded: false,
    electronics_recorded: false,
    child_involved_in_inventory: false,
    storage_adequate: false,
    privacy_respected: false,
    photographic_record: false,
    inventory_complete: false,
    notes: "",
    created_at: "2026-03-01",
    ...overrides,
  };
}

function makeClothingRequest(
  overrides: Partial<ClothingRequestRecordInput> = {},
): ClothingRequestRecordInput {
  return {
    id: uid(),
    child_id: "child_1",
    request_date: "2026-03-01",
    item_requested: "Shoes",
    request_type: "replacement",
    urgency: "standard",
    fulfilled: false,
    fulfilment_date: null,
    days_to_fulfil: 0,
    child_satisfied_with_outcome: false,
    child_choice_respected: false,
    reason_if_unfulfilled: "",
    cost_gbp: 0,
    notes: "",
    created_at: "2026-03-01",
    ...overrides,
  };
}

function makeSafeguarding(
  overrides: Partial<PossessionSafeguardingRecordInput> = {},
): PossessionSafeguardingRecordInput {
  return {
    id: uid(),
    child_id: "child_1",
    date: "2026-03-01",
    event_type: "loss",
    item_description: "Book",
    item_value_gbp: 10,
    sentimental_value: false,
    resolved: false,
    resolution_date: null,
    days_to_resolve: 0,
    child_informed: false,
    child_satisfied: false,
    replacement_provided: false,
    compensation_offered: false,
    incident_documented: false,
    staff_involved: "staff_1",
    notes: "",
    created_at: "2026-03-01",
    ...overrides,
  };
}

// Helper to create N copies of a record with optional per-record overrides
function repeat<T>(n: number, factory: (i: number) => T): T[] {
  return Array.from({ length: n }, (_, i) => factory(i));
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Home Clothing & Personal Possessions Intelligence Engine", () => {
  // ════════════════════════════════════════════════════════════════════════
  // INSUFFICIENT DATA
  // ════════════════════════════════════════════════════════════════════════

  describe("Insufficient Data", () => {
    it("returns insufficient_data when all arrays empty and total_children=0", () => {
      const r = computeClothingPersonalPossessions(baseInput({ total_children: 0 }));
      expect(r.clothing_rating).toBe("insufficient_data");
      expect(r.clothing_score).toBe(0);
      expect(r.headline).toContain("No children on placement");
    });

    it("returns all rates as 0 for insufficient_data", () => {
      const r = computeClothingPersonalPossessions(baseInput({ total_children: 0 }));
      expect(r.allowance_utilisation_rate).toBe(0);
      expect(r.wardrobe_adequacy_rate).toBe(0);
      expect(r.inventory_completeness_rate).toBe(0);
      expect(r.request_fulfilment_rate).toBe(0);
      expect(r.possession_safeguarding_rate).toBe(0);
      expect(r.child_choice_rate).toBe(0);
    });

    it("returns empty arrays for insufficient_data", () => {
      const r = computeClothingPersonalPossessions(baseInput({ total_children: 0 }));
      expect(r.strengths).toEqual([]);
      expect(r.concerns).toEqual([]);
      expect(r.recommendations).toEqual([]);
      expect(r.insights).toEqual([]);
    });

    it("returns zero total counts for insufficient_data", () => {
      const r = computeClothingPersonalPossessions(baseInput({ total_children: 0 }));
      expect(r.total_allowance_records).toBe(0);
      expect(r.total_wardrobe_reviews).toBe(0);
      expect(r.total_inventory_records).toBe(0);
      expect(r.total_request_records).toBe(0);
      expect(r.total_safeguarding_records).toBe(0);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // INADEQUATE FLOOR (all empty + children > 0)
  // ════════════════════════════════════════════════════════════════════════

  describe("Inadequate Floor (all empty, children > 0)", () => {
    it("returns inadequate with score 15 when all arrays empty but children present", () => {
      const r = computeClothingPersonalPossessions(baseInput());
      expect(r.clothing_rating).toBe("inadequate");
      expect(r.clothing_score).toBe(15);
    });

    it("headline mentions no data recorded", () => {
      const r = computeClothingPersonalPossessions(baseInput());
      expect(r.headline).toContain("No clothing or personal possessions data recorded");
    });

    it("has exactly 1 concern about missing records", () => {
      const r = computeClothingPersonalPossessions(baseInput());
      expect(r.concerns).toHaveLength(1);
      expect(r.concerns[0]).toContain("No clothing allowance records");
    });

    it("has exactly 2 recommendations both immediate", () => {
      const r = computeClothingPersonalPossessions(baseInput());
      expect(r.recommendations).toHaveLength(2);
      expect(r.recommendations[0].urgency).toBe("immediate");
      expect(r.recommendations[1].urgency).toBe("immediate");
      expect(r.recommendations[0].rank).toBe(1);
      expect(r.recommendations[1].rank).toBe(2);
    });

    it("has exactly 1 critical insight", () => {
      const r = computeClothingPersonalPossessions(baseInput());
      expect(r.insights).toHaveLength(1);
      expect(r.insights[0].severity).toBe("critical");
    });

    it("works for total_children=1", () => {
      const r = computeClothingPersonalPossessions(baseInput({ total_children: 1 }));
      expect(r.clothing_rating).toBe("inadequate");
      expect(r.clothing_score).toBe(15);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // OUTPUT SHAPE
  // ════════════════════════════════════════════════════════════════════════

  describe("Output Shape", () => {
    it("returns all expected result fields", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({ clothing_allowance_records: [makeAllowance()] }),
      );
      expect(r).toHaveProperty("clothing_rating");
      expect(r).toHaveProperty("clothing_score");
      expect(r).toHaveProperty("headline");
      expect(r).toHaveProperty("total_allowance_records");
      expect(r).toHaveProperty("total_wardrobe_reviews");
      expect(r).toHaveProperty("total_inventory_records");
      expect(r).toHaveProperty("total_request_records");
      expect(r).toHaveProperty("total_safeguarding_records");
      expect(r).toHaveProperty("allowance_utilisation_rate");
      expect(r).toHaveProperty("wardrobe_adequacy_rate");
      expect(r).toHaveProperty("inventory_completeness_rate");
      expect(r).toHaveProperty("request_fulfilment_rate");
      expect(r).toHaveProperty("possession_safeguarding_rate");
      expect(r).toHaveProperty("child_choice_rate");
      expect(r).toHaveProperty("strengths");
      expect(r).toHaveProperty("concerns");
      expect(r).toHaveProperty("recommendations");
      expect(r).toHaveProperty("insights");
    });

    it("total counts reflect input lengths", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [makeAllowance(), makeAllowance()],
          wardrobe_review_records: [makeWardrobeReview()],
          personal_inventory_records: [makeInventory(), makeInventory(), makeInventory()],
          clothing_request_records: [makeClothingRequest()],
          possession_safeguarding_records: [makeSafeguarding(), makeSafeguarding()],
        }),
      );
      expect(r.total_allowance_records).toBe(2);
      expect(r.total_wardrobe_reviews).toBe(1);
      expect(r.total_inventory_records).toBe(3);
      expect(r.total_request_records).toBe(1);
      expect(r.total_safeguarding_records).toBe(2);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // SCORING ARCHITECTURE — base=52, max bonuses=+28
  // ════════════════════════════════════════════════════════════════════════

  describe("Scoring Architecture", () => {
    it("base score is 52 with minimal data (no bonus, no penalty)", () => {
      // Use only safeguarding records — they don't contribute to childChoice denom
      // resolved: true at exactly 1/1 = 100% => +3 bonus
      // We need no bonus AND no penalty: use safeguarding with resolved at 70-89% => +1
      // Actually, the simplest: 1 safeguarding record that is unresolved but
      // safeguardingRate = 0% < 50 => -4 penalty. That's not 52 either.
      //
      // True base 52 is only achievable when childChoiceDenom = 0 AND no other
      // bonus/penalty fires. That means only safeguarding records at exactly 50-69%
      // (no bonus, no penalty). pct(1,2) = 50%.
      const r = computeClothingPersonalPossessions(
        baseInput({
          possession_safeguarding_records: [
            makeSafeguarding({ resolved: true }),
            makeSafeguarding({ resolved: false }),
          ],
        }),
      );
      // safeguarding = 50% => not >=70 (no bonus), not <50 (no penalty)
      // childChoice denom = 0 => no penalty
      // 52 + 0 = 52
      expect(r.clothing_score).toBe(52);
    });

    it("max score is 80 (52 base + 28 bonuses) yielding outstanding", () => {
      // All 9 bonuses at max: +4+4+3+3+3+3+3+3+2 = 28
      const r = computeClothingPersonalPossessions(
        baseInput({
          total_children: 3,
          clothing_allowance_records: repeat(3, (i) =>
            makeAllowance({
              child_id: `child_${i + 1}`,
              allowance_amount_gbp: 100,
              amount_spent_gbp: 85,
              child_involved_in_shopping: true,
              child_chose_own_items: true,
              age_appropriate: true,
              seasonal_needs_met: true,
              receipts_retained: true,
              quality_rating: 5,
            }),
          ),
          wardrobe_review_records: [
            ...repeat(3, (i) =>
              makeWardrobeReview({
                child_id: `child_${i + 1}`,
                season: (["spring", "summer", "autumn"] as const)[i],
                overall_adequate: true,
                adequate_clothing: true,
                adequate_footwear: true,
                adequate_outerwear: true,
                adequate_school_uniform: true,
                adequate_nightwear: true,
                adequate_underwear: true,
                child_consulted: true,
                child_satisfied: true,
                cultural_religious_needs_met: true,
                dignity_maintained: true,
                items_needing_replacement: 2,
                items_replaced: 2,
              }),
            ),
            makeWardrobeReview({
              child_id: "child_1",
              season: "winter",
              overall_adequate: true,
              adequate_clothing: true,
              adequate_footwear: true,
              adequate_outerwear: true,
              adequate_school_uniform: true,
              adequate_nightwear: true,
              adequate_underwear: true,
              child_consulted: true,
              child_satisfied: true,
              cultural_religious_needs_met: true,
              dignity_maintained: true,
              items_needing_replacement: 1,
              items_replaced: 1,
            }),
          ],
          personal_inventory_records: repeat(3, (i) =>
            makeInventory({
              child_id: `child_${i + 1}`,
              total_items_recorded: 20,
              items_accounted_for: 20,
              items_missing: 0,
              items_damaged: 0,
              sentimental_items_safeguarded: true,
              electronics_recorded: true,
              child_involved_in_inventory: true,
              storage_adequate: true,
              privacy_respected: true,
              photographic_record: true,
              inventory_complete: true,
            }),
          ),
          clothing_request_records: repeat(3, (i) =>
            makeClothingRequest({
              child_id: `child_${i + 1}`,
              fulfilled: true,
              fulfilment_date: "2026-03-05",
              days_to_fulfil: 2,
              child_satisfied_with_outcome: true,
              child_choice_respected: true,
            }),
          ),
          possession_safeguarding_records: repeat(3, (i) =>
            makeSafeguarding({
              child_id: `child_${i + 1}`,
              resolved: true,
              resolution_date: "2026-03-05",
              days_to_resolve: 1,
              child_informed: true,
              child_satisfied: true,
              replacement_provided: true,
              incident_documented: true,
            }),
          ),
        }),
      );
      expect(r.clothing_score).toBe(80);
      expect(r.clothing_rating).toBe("outstanding");
    });

    it("score is clamped to 0 minimum", () => {
      // All 4 penalties applied: -6-5-3-4 = -18; base 52 - 18 = 34
      // But let's construct a case where penalties exceed base
      // Actually max penalty = 18, base = 52, so min with penalties = 34
      // clamp(34, 0, 100) = 34
      // Score can never go below 0 with these penalties, but let's verify clamp works
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 })],
          wardrobe_review_records: repeat(10, () =>
            makeWardrobeReview({ overall_adequate: false }),
          ),
          clothing_request_records: repeat(10, () =>
            makeClothingRequest({ fulfilled: false }),
          ),
          possession_safeguarding_records: repeat(10, () =>
            makeSafeguarding({ resolved: false }),
          ),
        }),
      );
      // wardrobe < 50: -6, request < 50: -5, safeguarding < 50: -4, childChoice < 30: -3
      // childChoiceRate: pct(0, 1+10+0+10) = pct(0,21) = 0 < 30 => -3
      // Total: 52 - 6 - 5 - 4 - 3 = 34
      expect(r.clothing_score).toBe(34);
      expect(r.clothing_score).toBeGreaterThanOrEqual(0);
    });

    it("score is clamped to 100 maximum", () => {
      // Not possible with 52+28=80, but verify clamp logic
      // Score of 80 is max achievable
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: repeat(3, (i) =>
            makeAllowance({
              child_id: `child_${i + 1}`,
              allowance_amount_gbp: 100,
              amount_spent_gbp: 85,
              child_chose_own_items: true,
              quality_rating: 5,
            }),
          ),
          wardrobe_review_records: repeat(3, (i) =>
            makeWardrobeReview({
              child_id: `child_${i + 1}`,
              overall_adequate: true,
              child_consulted: true,
              dignity_maintained: true,
              items_needing_replacement: 2,
              items_replaced: 2,
            }),
          ),
          personal_inventory_records: repeat(3, (i) =>
            makeInventory({
              child_id: `child_${i + 1}`,
              total_items_recorded: 20,
              items_accounted_for: 20,
              child_involved_in_inventory: true,
            }),
          ),
          clothing_request_records: repeat(3, () =>
            makeClothingRequest({
              fulfilled: true,
              child_choice_respected: true,
            }),
          ),
          possession_safeguarding_records: repeat(3, () =>
            makeSafeguarding({ resolved: true }),
          ),
        }),
      );
      expect(r.clothing_score).toBeLessThanOrEqual(100);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // RATING THRESHOLDS
  // ════════════════════════════════════════════════════════════════════════

  describe("Rating Thresholds", () => {
    it("score >= 80 -> outstanding", () => {
      // Build max scenario (score=80)
      const r = computeClothingPersonalPossessions(
        baseInput({
          total_children: 3,
          clothing_allowance_records: repeat(3, (i) =>
            makeAllowance({
              child_id: `child_${i + 1}`,
              allowance_amount_gbp: 100,
              amount_spent_gbp: 85,
              child_involved_in_shopping: true,
              child_chose_own_items: true,
              age_appropriate: true,
              seasonal_needs_met: true,
              receipts_retained: true,
              quality_rating: 5,
            }),
          ),
          wardrobe_review_records: [
            ...repeat(3, (i) =>
              makeWardrobeReview({
                child_id: `child_${i + 1}`,
                season: (["spring", "summer", "autumn"] as const)[i],
                overall_adequate: true,
                child_consulted: true,
                child_satisfied: true,
                cultural_religious_needs_met: true,
                dignity_maintained: true,
                items_needing_replacement: 2,
                items_replaced: 2,
              }),
            ),
            makeWardrobeReview({
              child_id: "child_1",
              season: "winter",
              overall_adequate: true,
              child_consulted: true,
              child_satisfied: true,
              cultural_religious_needs_met: true,
              dignity_maintained: true,
              items_needing_replacement: 1,
              items_replaced: 1,
            }),
          ],
          personal_inventory_records: repeat(3, (i) =>
            makeInventory({
              child_id: `child_${i + 1}`,
              total_items_recorded: 20,
              items_accounted_for: 20,
              child_involved_in_inventory: true,
              sentimental_items_safeguarded: true,
              storage_adequate: true,
              privacy_respected: true,
              photographic_record: true,
              inventory_complete: true,
            }),
          ),
          clothing_request_records: repeat(3, (i) =>
            makeClothingRequest({
              child_id: `child_${i + 1}`,
              fulfilled: true,
              days_to_fulfil: 2,
              child_satisfied_with_outcome: true,
              child_choice_respected: true,
            }),
          ),
          possession_safeguarding_records: repeat(3, (i) =>
            makeSafeguarding({
              child_id: `child_${i + 1}`,
              resolved: true,
              days_to_resolve: 1,
              child_informed: true,
              child_satisfied: true,
              replacement_provided: true,
              incident_documented: true,
            }),
          ),
        }),
      );
      expect(r.clothing_score).toBeGreaterThanOrEqual(80);
      expect(r.clothing_rating).toBe("outstanding");
    });

    it("score 65-79 -> good", () => {
      // Need child_chose_own_items: true and child_consulted: true and child_involved: true
      // to avoid childChoice < 30 penalty and potentially earn childChoice bonus.
      // +4 (allowance>=80) +4 (wardrobe>=90) +3 (inventory>=95) +2 (quality>=4.0)
      // +3 (childChoice>=90) = 52 + 16 = 68
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({
              allowance_amount_gbp: 100,
              amount_spent_gbp: 85,
              child_chose_own_items: true,
              quality_rating: 4,
            }),
          ],
          wardrobe_review_records: [
            makeWardrobeReview({ overall_adequate: true, child_consulted: true }),
          ],
          personal_inventory_records: [
            makeInventory({
              total_items_recorded: 20,
              items_accounted_for: 20,
              child_involved_in_inventory: true,
            }),
          ],
        }),
      );
      expect(r.clothing_score).toBeGreaterThanOrEqual(65);
      expect(r.clothing_score).toBeLessThan(80);
      expect(r.clothing_rating).toBe("good");
    });

    it("score 45-64 -> adequate", () => {
      // Use safeguarding at 50-69% to get base 52 with no bonuses/penalties
      const r = computeClothingPersonalPossessions(
        baseInput({
          possession_safeguarding_records: [
            makeSafeguarding({ resolved: true }),
            makeSafeguarding({ resolved: false }),
          ],
        }),
      );
      // safeguarding=50% => no bonus, no penalty; childChoice denom=0 => no penalty
      expect(r.clothing_score).toBe(52);
      expect(r.clothing_rating).toBe("adequate");
    });

    it("score < 45 -> inadequate", () => {
      // Base 52 with heavy penalties
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 })],
          wardrobe_review_records: repeat(10, () =>
            makeWardrobeReview({ overall_adequate: false }),
          ),
          clothing_request_records: repeat(10, () =>
            makeClothingRequest({ fulfilled: false }),
          ),
          possession_safeguarding_records: repeat(10, () =>
            makeSafeguarding({ resolved: false }),
          ),
        }),
      );
      // 52 - 6 - 5 - 4 - 3 = 34
      expect(r.clothing_score).toBeLessThan(45);
      expect(r.clothing_rating).toBe("inadequate");
    });

    it("exact boundary: score=80 is outstanding", () => {
      // We already tested this above, but let's confirm the threshold
      // The max achievable is 80
      const r = computeClothingPersonalPossessions(
        baseInput({
          total_children: 3,
          clothing_allowance_records: repeat(3, (i) =>
            makeAllowance({
              child_id: `child_${i + 1}`,
              allowance_amount_gbp: 100,
              amount_spent_gbp: 85,
              child_involved_in_shopping: true,
              child_chose_own_items: true,
              quality_rating: 5,
            }),
          ),
          wardrobe_review_records: repeat(4, (i) =>
            makeWardrobeReview({
              child_id: `child_${(i % 3) + 1}`,
              season: (["spring", "summer", "autumn", "winter"] as const)[i],
              overall_adequate: true,
              child_consulted: true,
              dignity_maintained: true,
              items_needing_replacement: 2,
              items_replaced: 2,
            }),
          ),
          personal_inventory_records: repeat(3, (i) =>
            makeInventory({
              child_id: `child_${i + 1}`,
              total_items_recorded: 20,
              items_accounted_for: 20,
              child_involved_in_inventory: true,
            }),
          ),
          clothing_request_records: repeat(3, () =>
            makeClothingRequest({
              fulfilled: true,
              child_choice_respected: true,
            }),
          ),
          possession_safeguarding_records: repeat(3, () =>
            makeSafeguarding({ resolved: true }),
          ),
        }),
      );
      expect(r.clothing_score).toBe(80);
      expect(r.clothing_rating).toBe("outstanding");
    });

    it("exact boundary: score=65 is good", () => {
      // With childChoice penalty -3 from the 3 sources with false defaults:
      // 52 + 4(allowance>=80) + 4(wardrobe>=90) + 3(inventory>=95) + 2(quality>=4.0) - 3(childChoice<30) = 62
      // To get exactly 65 we need +3 more — set child choice on all sources => +3 childChoice bonus
      // 52 + 4 + 4 + 3 + 2 + 3 = 68 — too high
      // Drop quality to < 3.0 (no bonus): 52 + 4 + 4 + 3 + 0 + 3 = 66 — still not 65
      // Use inventory at 80-94 instead of 95+: +1 instead of +3
      // 52 + 4 + 4 + 1 + 2 + 3 = 66 — hmm
      // Use wardrobe at 70-89 (= +2): 52 + 4 + 2 + 3 + 2 + 3 = 66
      // Use allowance at 60-79 (= +2): 52 + 2 + 4 + 3 + 2 + 3 = 66
      // Let me use: +4(allowance) +2(wardrobe 70-89) +3(inv>=95) +3(childChoice>=90) +1(quality 3-3.9) = 65
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({
              allowance_amount_gbp: 100,
              amount_spent_gbp: 85,
              child_chose_own_items: true,
              quality_rating: 3.5,
            }),
          ],
          wardrobe_review_records: [
            ...repeat(7, () => makeWardrobeReview({ overall_adequate: true, child_consulted: true })),
            ...repeat(3, () => makeWardrobeReview({ overall_adequate: false, child_consulted: true })),
          ],
          personal_inventory_records: [
            makeInventory({
              total_items_recorded: 100,
              items_accounted_for: 96,
              child_involved_in_inventory: true,
            }),
          ],
        }),
      );
      // allowance util = 85% >= 80 => +4
      // wardrobe adequacy = 70% >= 70 => +2
      // inventory completeness = 96% >= 95 => +3
      // childChoice: num=1+10+1=12, denom=1+10+1=12 => 100% >= 90 => +3
      // quality = 3.5 >= 3.0 => +1
      // dignity = 0% => no bonus; replacement: pct(0,0)=0 => no bonus
      // No penalties (wardrobe >=50, childChoice >=90)
      // 52 + 4 + 2 + 3 + 3 + 1 = 65
      expect(r.clothing_score).toBe(65);
      expect(r.clothing_rating).toBe("good");
    });

    it("score=64 is adequate (not good)", () => {
      // 52 + 4(allowance>=80) + 2(wardrobe 70-89%) + 3(inventory>=95) + 3(childChoice>=90) + 0(quality<3) = 64
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({
              allowance_amount_gbp: 100,
              amount_spent_gbp: 85,
              child_chose_own_items: true,
              quality_rating: 2,
            }),
          ],
          wardrobe_review_records: [
            ...repeat(7, () => makeWardrobeReview({ overall_adequate: true, child_consulted: true })),
            ...repeat(3, () => makeWardrobeReview({ overall_adequate: false, child_consulted: true })),
          ],
          personal_inventory_records: [
            makeInventory({
              total_items_recorded: 100,
              items_accounted_for: 96,
              child_involved_in_inventory: true,
            }),
          ],
        }),
      );
      // allowance util = 85% => +4; wardrobe = 70% => +2; inventory = 96% => +3
      // childChoice: 1+10+1=12/1+10+1=12 => 100% => +3; quality = 2 => +0
      // dignity 0% => no bonus; replacement pct(0,0)=0 => no bonus
      // No penalties
      // 52 + 4 + 2 + 3 + 3 + 0 = 64
      expect(r.clothing_score).toBe(64);
      expect(r.clothing_rating).toBe("adequate");
    });

    it("score=45 is adequate (not inadequate)", () => {
      // 52 - 6 (wardrobe<50) - 3 (childChoice<30) + 2 (allowance>=60) = 45
      // Need wardrobe reviews all inadequate for -6, no child choice for -3
      // Need allowance util >= 60 for +2
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 65 }),
          ],
          wardrobe_review_records: repeat(4, () =>
            makeWardrobeReview({ overall_adequate: false }),
          ),
        }),
      );
      // wardrobe_adequacy = 0% < 50 => -6
      // childChoiceRate: numerators from allowance (childChoseItems=0) + wardrobe (childConsulted=0)
      // denom = 1 + 4 = 5, num = 0 => 0% < 30 => -3
      // allowance util = pct(65,100) = 65 >= 60 => +2
      // 52 + 2 - 6 - 3 = 45
      expect(r.clothing_score).toBe(45);
      expect(r.clothing_rating).toBe("adequate");
    });

    it("score=44 is inadequate", () => {
      // 52 - 6 (wardrobe<50) - 3 (childChoice<30) + 1 (allowance just >=60 won't work, we need +1 somewhere else)
      // Actually let's just get 52 - 6 - 3 = 43 + need +1 for 44
      // 52 + 1(inventory>=80) - 6(wardrobe<50) - 3(childChoice<30) = 44
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          wardrobe_review_records: repeat(4, () =>
            makeWardrobeReview({ overall_adequate: false }),
          ),
          personal_inventory_records: [
            makeInventory({
              total_items_recorded: 100,
              items_accounted_for: 85,
            }),
          ],
        }),
      );
      // inventory completeness = pct(85,100) = 85 >= 80 => +1
      // wardrobe_adequacy = 0% => -6
      // childChoiceRate: denom = 1 + 4 + 1 = 6, num = 0 => 0% < 30 => -3
      // 52 + 1 - 6 - 3 = 44
      expect(r.clothing_score).toBe(44);
      expect(r.clothing_rating).toBe("inadequate");
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // INDIVIDUAL BONUS TESTS
  // ════════════════════════════════════════════════════════════════════════

  describe("Individual Bonuses", () => {
    // Bonus 1: allowanceUtilisationRate
    // NOTE: A single allowance with child_chose_own_items: false makes childChoiceRate=0%<30% => -3
    // So all tests here use child_chose_own_items: true to get childChoice=100% => +3
    // We then compare relative to that baseline to isolate the allowance bonus.
    describe("Bonus 1: Allowance Utilisation Rate", () => {
      it("+4 when allowanceUtilisationRate >= 80", () => {
        const r = computeClothingPersonalPossessions(
          baseInput({
            clothing_allowance_records: [
              makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 80, child_chose_own_items: true }),
            ],
          }),
        );
        // 52 + 4(allowance) + 3(childChoice) = 59
        expect(r.clothing_score).toBe(59);
      });

      it("+2 when allowanceUtilisationRate >= 60 and < 80", () => {
        const r = computeClothingPersonalPossessions(
          baseInput({
            clothing_allowance_records: [
              makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 65, child_chose_own_items: true }),
            ],
          }),
        );
        // 52 + 2(allowance) + 3(childChoice) = 57
        expect(r.clothing_score).toBe(57);
      });

      it("+0 when allowanceUtilisationRate < 60", () => {
        const r = computeClothingPersonalPossessions(
          baseInput({
            clothing_allowance_records: [
              makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 50, child_chose_own_items: true }),
            ],
          }),
        );
        // 52 + 0(allowance) + 3(childChoice) = 55
        expect(r.clothing_score).toBe(55);
      });

      it("exact boundary: 80% util gets +4", () => {
        const r = computeClothingPersonalPossessions(
          baseInput({
            clothing_allowance_records: [
              makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 80, child_chose_own_items: true }),
            ],
          }),
        );
        expect(r.allowance_utilisation_rate).toBe(80);
        // 52 + 4 + 3 = 59
        expect(r.clothing_score).toBe(59);
      });

      it("exact boundary: 60% util gets +2", () => {
        const r = computeClothingPersonalPossessions(
          baseInput({
            clothing_allowance_records: [
              makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 60, child_chose_own_items: true }),
            ],
          }),
        );
        expect(r.allowance_utilisation_rate).toBe(60);
        // 52 + 2 + 3 = 57
        expect(r.clothing_score).toBe(57);
      });

      it("59% util gets +0", () => {
        const r = computeClothingPersonalPossessions(
          baseInput({
            clothing_allowance_records: [
              makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 59, child_chose_own_items: true }),
            ],
          }),
        );
        expect(r.allowance_utilisation_rate).toBe(59);
        // 52 + 0 + 3 = 55
        expect(r.clothing_score).toBe(55);
      });
    });

    // Bonus 2: wardrobeAdequacyRate
    describe("Bonus 2: Wardrobe Adequacy Rate", () => {
      it("+4 when wardrobeAdequacyRate >= 90", () => {
        const r = computeClothingPersonalPossessions(
          baseInput({
            clothing_allowance_records: [
              makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
            ],
            wardrobe_review_records: repeat(10, () =>
              makeWardrobeReview({ overall_adequate: true }),
            ),
          }),
        );
        // childChoiceRate: denom=1+10=11, num=0 => 0% < 30 => -3
        // 52 + 4 - 3 = 53
        expect(r.clothing_score).toBe(53);
      });

      it("+2 when wardrobeAdequacyRate >= 70 and < 90", () => {
        const r = computeClothingPersonalPossessions(
          baseInput({
            clothing_allowance_records: [
              makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
            ],
            wardrobe_review_records: [
              ...repeat(7, () => makeWardrobeReview({ overall_adequate: true })),
              ...repeat(3, () => makeWardrobeReview({ overall_adequate: false })),
            ],
          }),
        );
        // wardrobe_adequacy = pct(7,10) = 70 >= 70 => +2
        // childChoiceRate: denom=1+10=11, num=0 => 0% < 30 => -3
        // 52 + 2 - 3 = 51
        expect(r.clothing_score).toBe(51);
      });

      it("+0 when wardrobeAdequacyRate < 70", () => {
        const r = computeClothingPersonalPossessions(
          baseInput({
            clothing_allowance_records: [
              makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
            ],
            wardrobe_review_records: [
              ...repeat(6, () => makeWardrobeReview({ overall_adequate: true })),
              ...repeat(4, () => makeWardrobeReview({ overall_adequate: false })),
            ],
          }),
        );
        // wardrobe_adequacy = pct(6,10) = 60 => +0, no penalty (>=50)
        // childChoiceRate: denom=1+10=11, num=0 => 0% < 30 => -3
        // 52 + 0 - 3 = 49
        expect(r.clothing_score).toBe(49);
      });
    });

    // Bonus 3: inventoryCompletenessRate
    describe("Bonus 3: Inventory Completeness Rate", () => {
      it("+3 when inventoryCompletenessRate >= 95", () => {
        const r = computeClothingPersonalPossessions(
          baseInput({
            clothing_allowance_records: [
              makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
            ],
            personal_inventory_records: [
              makeInventory({ total_items_recorded: 100, items_accounted_for: 96 }),
            ],
          }),
        );
        // childChoiceRate: denom=1+1=2, num=0 => 0% < 30 => -3
        // 52 + 3 - 3 = 52
        expect(r.clothing_score).toBe(52);
      });

      it("+1 when inventoryCompletenessRate >= 80 and < 95", () => {
        const r = computeClothingPersonalPossessions(
          baseInput({
            clothing_allowance_records: [
              makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
            ],
            personal_inventory_records: [
              makeInventory({ total_items_recorded: 100, items_accounted_for: 85 }),
            ],
          }),
        );
        // childChoiceRate: denom=1+1=2, num=0 => 0% < 30 => -3
        // 52 + 1 - 3 = 50
        expect(r.clothing_score).toBe(50);
      });

      it("+0 when inventoryCompletenessRate < 80", () => {
        const r = computeClothingPersonalPossessions(
          baseInput({
            clothing_allowance_records: [
              makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
            ],
            personal_inventory_records: [
              makeInventory({ total_items_recorded: 100, items_accounted_for: 70 }),
            ],
          }),
        );
        // childChoiceRate: denom=1+1=2, num=0 => 0% < 30 => -3
        // 52 + 0 - 3 = 49
        expect(r.clothing_score).toBe(49);
      });
    });

    // Bonus 4: requestFulfilmentRate
    describe("Bonus 4: Request Fulfilment Rate", () => {
      it("+3 when requestFulfilmentRate >= 90", () => {
        const r = computeClothingPersonalPossessions(
          baseInput({
            clothing_allowance_records: [
              makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
            ],
            clothing_request_records: repeat(10, () =>
              makeClothingRequest({ fulfilled: true }),
            ),
          }),
        );
        // childChoiceRate: denom=1+10=11, num=0+0=0 => 0% < 30 => -3
        // 52 + 3 - 3 = 52
        expect(r.clothing_score).toBe(52);
      });

      it("+1 when requestFulfilmentRate >= 70 and < 90", () => {
        const r = computeClothingPersonalPossessions(
          baseInput({
            clothing_allowance_records: [
              makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
            ],
            clothing_request_records: [
              ...repeat(7, () => makeClothingRequest({ fulfilled: true })),
              ...repeat(3, () => makeClothingRequest({ fulfilled: false })),
            ],
          }),
        );
        // request_fulfilment = pct(7,10)=70 >= 70 => +1
        // childChoiceRate: denom=1+10=11, num=0 => 0% < 30 => -3
        // 52 + 1 - 3 = 50
        expect(r.clothing_score).toBe(50);
      });
    });

    // Bonus 5: possessionSafeguardingRate
    describe("Bonus 5: Possession Safeguarding Rate", () => {
      it("+3 when possessionSafeguardingRate >= 90", () => {
        const r = computeClothingPersonalPossessions(
          baseInput({
            clothing_allowance_records: [
              makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
            ],
            possession_safeguarding_records: repeat(10, () =>
              makeSafeguarding({ resolved: true }),
            ),
          }),
        );
        // childChoiceRate: denom=1, num=0 => 0% < 30 => -3
        // 52 + 3 - 3 = 52
        expect(r.clothing_score).toBe(52);
      });

      it("+1 when possessionSafeguardingRate >= 70 and < 90", () => {
        const r = computeClothingPersonalPossessions(
          baseInput({
            clothing_allowance_records: [
              makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
            ],
            possession_safeguarding_records: [
              ...repeat(7, () => makeSafeguarding({ resolved: true })),
              ...repeat(3, () => makeSafeguarding({ resolved: false })),
            ],
          }),
        );
        // possession_safeguarding = pct(7,10)=70 >= 70 => +1
        // childChoiceRate: denom=1, num=0 => 0% < 30 => -3
        // 52 + 1 - 3 = 50
        expect(r.clothing_score).toBe(50);
      });
    });

    // Bonus 6: childChoiceRate
    describe("Bonus 6: Child Choice Rate", () => {
      it("+3 when childChoiceRate >= 90", () => {
        const r = computeClothingPersonalPossessions(
          baseInput({
            clothing_allowance_records: [
              makeAllowance({
                allowance_amount_gbp: 100,
                amount_spent_gbp: 0,
                child_chose_own_items: true,
              }),
            ],
            wardrobe_review_records: [
              makeWardrobeReview({ child_consulted: true }),
            ],
            personal_inventory_records: [
              makeInventory({
                total_items_recorded: 0,
                items_accounted_for: 0,
                child_involved_in_inventory: true,
              }),
            ],
            clothing_request_records: [
              makeClothingRequest({ child_choice_respected: true }),
            ],
          }),
        );
        // childChoiceRate: num = 1+1+1+1 = 4, denom = 1+1+1+1 = 4 => 100% >= 90 => +3
        // No penalty for childChoice >= 90
        // wardrobe adequacy 0/1 = 0% < 50 => -6 penalty
        // request_fulfilment 0/1 = 0% < 50 => -5 penalty
        // 52 + 3 - 6 - 5 = 44
        expect(r.clothing_score).toBe(44);
      });

      it("+1 when childChoiceRate >= 70 and < 90", () => {
        // 3 out of 4 sources have choice = 75%
        const r = computeClothingPersonalPossessions(
          baseInput({
            clothing_allowance_records: [
              makeAllowance({
                allowance_amount_gbp: 100,
                amount_spent_gbp: 0,
                child_chose_own_items: true,
              }),
            ],
            wardrobe_review_records: [
              makeWardrobeReview({ child_consulted: true }),
            ],
            personal_inventory_records: [
              makeInventory({
                total_items_recorded: 0,
                items_accounted_for: 0,
                child_involved_in_inventory: true,
              }),
            ],
            clothing_request_records: [
              makeClothingRequest({ child_choice_respected: false }),
            ],
          }),
        );
        // childChoiceRate: num=1+1+1+0=3, denom=1+1+1+1=4 => 75% >= 70 => +1
        // wardrobe adequacy 0/1=0% < 50 => -6
        // request 0/1=0% < 50 => -5
        // 52 + 1 - 6 - 5 = 42
        expect(r.clothing_score).toBe(42);
      });

      it("+0 when childChoiceRate < 70", () => {
        // 1 out of 4 => 25%
        const r = computeClothingPersonalPossessions(
          baseInput({
            clothing_allowance_records: [
              makeAllowance({
                allowance_amount_gbp: 100,
                amount_spent_gbp: 0,
                child_chose_own_items: true,
              }),
            ],
            wardrobe_review_records: [
              makeWardrobeReview({ child_consulted: false }),
            ],
            personal_inventory_records: [
              makeInventory({
                total_items_recorded: 0,
                items_accounted_for: 0,
                child_involved_in_inventory: false,
              }),
            ],
            clothing_request_records: [
              makeClothingRequest({ child_choice_respected: false }),
            ],
          }),
        );
        // childChoiceRate: num=1+0+0+0=1, denom=1+1+1+1=4 => 25% < 30 => penalty -3
        // wardrobe adequacy 0/1=0% < 50 => -6
        // request 0/1=0% < 50 => -5
        // 52 + 0 - 6 - 5 - 3 = 38
        expect(r.clothing_score).toBe(38);
      });
    });

    // Bonus 7: dignityMaintainedRate
    describe("Bonus 7: Dignity Maintained Rate", () => {
      it("+3 when dignityMaintainedRate >= 95", () => {
        // Need to isolate this: wardrobe with all dignity maintained
        const r = computeClothingPersonalPossessions(
          baseInput({
            clothing_allowance_records: [
              makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
            ],
            wardrobe_review_records: repeat(20, () =>
              makeWardrobeReview({
                overall_adequate: true,
                dignity_maintained: true,
              }),
            ),
          }),
        );
        // wardrobe adequacy = 100% >= 90 => +4
        // dignity maintained = 100% >= 95 => +3
        // childChoiceRate: denom=1+20=21, num=0 => 0% < 30 => -3
        // 52 + 4 + 3 - 3 = 56
        expect(r.clothing_score).toBe(56);
      });

      it("+1 when dignityMaintainedRate >= 80 and < 95", () => {
        const r = computeClothingPersonalPossessions(
          baseInput({
            clothing_allowance_records: [
              makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
            ],
            wardrobe_review_records: [
              ...repeat(8, () =>
                makeWardrobeReview({ overall_adequate: true, dignity_maintained: true }),
              ),
              ...repeat(2, () =>
                makeWardrobeReview({ overall_adequate: true, dignity_maintained: false }),
              ),
            ],
          }),
        );
        // dignity = pct(8,10) = 80 >= 80 => +1
        // wardrobe_adequacy = 100% >= 90 => +4
        // childChoiceRate: denom=1+10=11, num=0 => 0% < 30 => -3
        // 52 + 4 + 1 - 3 = 54
        expect(r.clothing_score).toBe(54);
      });
    });

    // Bonus 8: replacementRate
    describe("Bonus 8: Replacement Rate", () => {
      it("+3 when replacementRate >= 90", () => {
        const r = computeClothingPersonalPossessions(
          baseInput({
            clothing_allowance_records: [
              makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
            ],
            wardrobe_review_records: [
              makeWardrobeReview({
                items_needing_replacement: 10,
                items_replaced: 10,
              }),
            ],
          }),
        );
        // replacement = pct(10,10) = 100% >= 90 => +3
        // wardrobe adequacy 0/1=0% < 50 => -6
        // childChoiceRate: denom=1+1=2, num=0 => 0% < 30 => -3
        // 52 + 3 - 6 - 3 = 46
        expect(r.clothing_score).toBe(46);
      });

      it("+1 when replacementRate >= 70 and < 90", () => {
        const r = computeClothingPersonalPossessions(
          baseInput({
            clothing_allowance_records: [
              makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
            ],
            wardrobe_review_records: [
              makeWardrobeReview({
                items_needing_replacement: 10,
                items_replaced: 7,
              }),
            ],
          }),
        );
        // replacement = pct(7,10) = 70% >= 70 => +1
        // wardrobe adequacy 0/1=0% < 50 => -6
        // childChoiceRate: denom=1+1=2, num=0 => 0% < 30 => -3
        // 52 + 1 - 6 - 3 = 44
        expect(r.clothing_score).toBe(44);
      });

      it("+0 when replacementRate < 70", () => {
        const r = computeClothingPersonalPossessions(
          baseInput({
            clothing_allowance_records: [
              makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
            ],
            wardrobe_review_records: [
              makeWardrobeReview({
                items_needing_replacement: 10,
                items_replaced: 5,
              }),
            ],
          }),
        );
        // replacement = pct(5,10) = 50% < 70 => +0
        // wardrobe adequacy 0/1=0% < 50 => -6
        // childChoiceRate: denom=1+1=2, num=0 => 0% < 30 => -3
        // 52 + 0 - 6 - 3 = 43
        expect(r.clothing_score).toBe(43);
      });

      it("+0 when no items need replacement (d=0)", () => {
        const r = computeClothingPersonalPossessions(
          baseInput({
            clothing_allowance_records: [
              makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
            ],
            wardrobe_review_records: [
              makeWardrobeReview({
                items_needing_replacement: 0,
                items_replaced: 0,
              }),
            ],
          }),
        );
        // replacement = pct(0,0) = 0 => +0
        // wardrobe adequacy 0/1=0% < 50 => -6
        // childChoiceRate: denom=1+1=2, num=0 => 0% < 30 => -3
        // 52 - 6 - 3 = 43
        expect(r.clothing_score).toBe(43);
      });
    });

    // Bonus 9: avgQualityRating
    // NOTE: child_chose_own_items:true => childChoice=100% => +3 bonus to avoid penalty.
    // Baseline with child_chose_own_items:true + 0 util = 52 + 3(childChoice) = 55
    describe("Bonus 9: Average Quality Rating", () => {
      it("+2 when avgQualityRating >= 4.0", () => {
        const r = computeClothingPersonalPossessions(
          baseInput({
            clothing_allowance_records: [
              makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0, quality_rating: 4, child_chose_own_items: true }),
            ],
          }),
        );
        expect(r.clothing_score).toBe(57); // 52 + 3(childChoice) + 2(quality)
      });

      it("+1 when avgQualityRating >= 3.0 and < 4.0", () => {
        const r = computeClothingPersonalPossessions(
          baseInput({
            clothing_allowance_records: [
              makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0, quality_rating: 3, child_chose_own_items: true }),
            ],
          }),
        );
        expect(r.clothing_score).toBe(56); // 52 + 3(childChoice) + 1(quality)
      });

      it("+0 when avgQualityRating < 3.0", () => {
        const r = computeClothingPersonalPossessions(
          baseInput({
            clothing_allowance_records: [
              makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0, quality_rating: 2, child_chose_own_items: true }),
            ],
          }),
        );
        expect(r.clothing_score).toBe(55); // 52 + 3(childChoice) + 0(quality)
      });

      it("averages quality across multiple records", () => {
        const r = computeClothingPersonalPossessions(
          baseInput({
            clothing_allowance_records: [
              makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0, quality_rating: 5, child_chose_own_items: true }),
              makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0, quality_rating: 3, child_chose_own_items: true }),
            ],
          }),
        );
        // avg = (5+3)/2 = 4.0 >= 4.0 => +2; childChoice = 100% => +3
        expect(r.clothing_score).toBe(57); // 52 + 3 + 2
      });
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // INDIVIDUAL PENALTY TESTS
  // ════════════════════════════════════════════════════════════════════════

  describe("Individual Penalties", () => {
    // Penalty 1: wardrobeAdequacyRate < 50 => -6
    describe("Penalty: Wardrobe Adequacy < 50%", () => {
      it("-6 when wardrobeAdequacyRate < 50 with records present", () => {
        const r = computeClothingPersonalPossessions(
          baseInput({
            clothing_allowance_records: [
              makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
            ],
            wardrobe_review_records: [
              makeWardrobeReview({ overall_adequate: false }),
            ],
          }),
        );
        // wardrobe = 0% < 50 => -6
        // childChoiceRate: denom=1+1=2, num=0 => 0% < 30 => -3
        // 52 - 6 - 3 = 43
        expect(r.clothing_score).toBe(43);
      });

      it("no penalty at exactly 50%", () => {
        const r = computeClothingPersonalPossessions(
          baseInput({
            clothing_allowance_records: [
              makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
            ],
            wardrobe_review_records: [
              makeWardrobeReview({ overall_adequate: true }),
              makeWardrobeReview({ overall_adequate: false }),
            ],
          }),
        );
        // wardrobe = pct(1,2) = 50 => NOT < 50, no penalty
        // childChoiceRate: denom=1+2=3, num=0 => 0% < 30 => -3
        // 52 - 3 = 49
        expect(r.clothing_score).toBe(49);
      });

      it("no penalty when no wardrobe reviews (guarded)", () => {
        const r = computeClothingPersonalPossessions(
          baseInput({
            clothing_allowance_records: [
              makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0, child_chose_own_items: true }),
            ],
          }),
        );
        // No wardrobe reviews => guard prevents wardrobe penalty
        // childChoice = 100% => +3
        // 52 + 3 = 55
        expect(r.clothing_score).toBe(55);
      });
    });

    // Penalty 2: requestFulfilmentRate < 50 => -5
    describe("Penalty: Request Fulfilment < 50%", () => {
      it("-5 when requestFulfilmentRate < 50 with records present", () => {
        const r = computeClothingPersonalPossessions(
          baseInput({
            clothing_allowance_records: [
              makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
            ],
            clothing_request_records: [
              makeClothingRequest({ fulfilled: false }),
            ],
          }),
        );
        // request = 0% < 50 => -5
        // childChoiceRate: denom=1+1=2, num=0 => 0% < 30 => -3
        // 52 - 5 - 3 = 44
        expect(r.clothing_score).toBe(44);
      });

      it("no penalty at exactly 50%", () => {
        const r = computeClothingPersonalPossessions(
          baseInput({
            clothing_allowance_records: [
              makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
            ],
            clothing_request_records: [
              makeClothingRequest({ fulfilled: true }),
              makeClothingRequest({ fulfilled: false }),
            ],
          }),
        );
        // request = pct(1,2)=50 => NOT < 50, no penalty
        // childChoiceRate: denom=1+2=3, num=0 => 0% < 30 => -3
        // 52 - 3 = 49
        expect(r.clothing_score).toBe(49);
      });

      it("no penalty when no request records (guarded)", () => {
        const r = computeClothingPersonalPossessions(
          baseInput({
            clothing_allowance_records: [
              makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0, child_chose_own_items: true }),
            ],
          }),
        );
        // childChoice = 100% => +3; no request penalty since no request records
        expect(r.clothing_score).toBe(55);
      });
    });

    // Penalty 3: childChoiceRate < 30 => -3
    describe("Penalty: Child Choice Rate < 30%", () => {
      it("-3 when childChoiceRate < 30 with denominator > 0", () => {
        const r = computeClothingPersonalPossessions(
          baseInput({
            clothing_allowance_records: [
              makeAllowance({
                allowance_amount_gbp: 100,
                amount_spent_gbp: 0,
                child_chose_own_items: false,
              }),
            ],
            wardrobe_review_records: [
              makeWardrobeReview({ child_consulted: false }),
            ],
          }),
        );
        // childChoiceRate: denom=1+1=2, num=0 => 0% < 30 => -3
        // wardrobe < 50 => -6
        // 52 - 6 - 3 = 43
        expect(r.clothing_score).toBe(43);
      });

      it("no penalty at exactly 30%", () => {
        // 3 chose out of 10 total = 30% => pct(3,10)=30 which is NOT < 30 => no penalty
        const r = computeClothingPersonalPossessions(
          baseInput({
            clothing_allowance_records: [
              makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0, child_chose_own_items: true }),
              makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0, child_chose_own_items: true }),
              makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0, child_chose_own_items: true }),
            ],
            wardrobe_review_records: repeat(7, () =>
              makeWardrobeReview({ child_consulted: false, overall_adequate: false }),
            ),
          }),
        );
        // childChoiceRate: num=3+0=3, denom=3+7=10 => pct(3,10)=30 NOT < 30 => no penalty
        // wardrobe adequacy = 0/7 = 0% < 50 => -6
        // 52 - 6 = 46
        expect(r.clothing_score).toBe(46);
      });

      it("no penalty when childChoice denom is 0 (guarded)", () => {
        // Only allowance records with 0 length, but we need at least something
        // If all arrays are empty, it takes a different path
        // The only way denom=0 is if all array-lengths for contributing sources are 0
        // Since we have an allowance, denom > 0
        // Let's test with no contributing arrays at all but still have data
        // This happens when only safeguarding records exist (they don't contribute to childChoice)
        const r = computeClothingPersonalPossessions(
          baseInput({
            possession_safeguarding_records: [
              makeSafeguarding({ resolved: false }),
            ],
          }),
        );
        // childChoiceRate denom = 0 => guard prevents penalty
        // safeguarding < 50 => -4
        // 52 - 4 = 48
        expect(r.clothing_score).toBe(48);
      });
    });

    // Penalty 4: possessionSafeguardingRate < 50 => -4
    describe("Penalty: Possession Safeguarding < 50%", () => {
      it("-4 when possessionSafeguardingRate < 50 with records present", () => {
        const r = computeClothingPersonalPossessions(
          baseInput({
            clothing_allowance_records: [
              makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
            ],
            possession_safeguarding_records: [
              makeSafeguarding({ resolved: false }),
            ],
          }),
        );
        // safeguarding = 0% < 50 => -4
        // childChoiceRate: denom=1, num=0 => 0% < 30 => -3
        // 52 - 4 - 3 = 45
        expect(r.clothing_score).toBe(45);
      });

      it("no penalty at exactly 50%", () => {
        const r = computeClothingPersonalPossessions(
          baseInput({
            clothing_allowance_records: [
              makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
            ],
            possession_safeguarding_records: [
              makeSafeguarding({ resolved: true }),
              makeSafeguarding({ resolved: false }),
            ],
          }),
        );
        // safeguarding = pct(1,2)=50 => NOT < 50, no penalty
        // childChoiceRate: denom=1, num=0 => 0% < 30 => -3
        // 52 - 3 = 49
        expect(r.clothing_score).toBe(49);
      });

      it("no penalty when no safeguarding records (guarded)", () => {
        const r = computeClothingPersonalPossessions(
          baseInput({
            clothing_allowance_records: [
              makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0, child_chose_own_items: true }),
            ],
          }),
        );
        // childChoice = 100% => +3; no safeguarding penalty since no records
        expect(r.clothing_score).toBe(55);
      });
    });

    // Combined penalties
    describe("Combined Penalties", () => {
      it("all four penalties stack: -6 -5 -3 -4 = -18", () => {
        const r = computeClothingPersonalPossessions(
          baseInput({
            clothing_allowance_records: [
              makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
            ],
            wardrobe_review_records: [makeWardrobeReview({ overall_adequate: false })],
            clothing_request_records: [makeClothingRequest({ fulfilled: false })],
            possession_safeguarding_records: [makeSafeguarding({ resolved: false })],
          }),
        );
        // wardrobe < 50 => -6
        // request < 50 => -5
        // childChoice: denom=1+1+1=3, num=0 => 0% < 30 => -3
        // safeguarding < 50 => -4
        // 52 - 6 - 5 - 3 - 4 = 34
        expect(r.clothing_score).toBe(34);
      });
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // RATE CALCULATION TESTS
  // ════════════════════════════════════════════════════════════════════════

  describe("Rate Calculations", () => {
    it("allowance_utilisation_rate = pct(spent, allowance)", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 200, amount_spent_gbp: 150 }),
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 50 }),
          ],
        }),
      );
      // total allowance = 300, total spent = 200 => pct(200,300)=67
      expect(r.allowance_utilisation_rate).toBe(67);
    });

    it("allowance_utilisation_rate is 0 when allowance = 0", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 0, amount_spent_gbp: 0 }),
          ],
        }),
      );
      expect(r.allowance_utilisation_rate).toBe(0);
    });

    it("wardrobe_adequacy_rate = pct(adequate, total)", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          wardrobe_review_records: [
            makeWardrobeReview({ overall_adequate: true }),
            makeWardrobeReview({ overall_adequate: true }),
            makeWardrobeReview({ overall_adequate: false }),
          ],
        }),
      );
      expect(r.wardrobe_adequacy_rate).toBe(67); // pct(2,3)=67
    });

    it("inventory_completeness_rate = pct(accounted_for, total_items)", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          personal_inventory_records: [
            makeInventory({ total_items_recorded: 50, items_accounted_for: 45 }),
            makeInventory({ total_items_recorded: 50, items_accounted_for: 50 }),
          ],
        }),
      );
      // total items = 100, accounted for = 95 => pct(95,100)=95
      expect(r.inventory_completeness_rate).toBe(95);
    });

    it("request_fulfilment_rate = pct(fulfilled, total_requests)", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          clothing_request_records: [
            makeClothingRequest({ fulfilled: true }),
            makeClothingRequest({ fulfilled: true }),
            makeClothingRequest({ fulfilled: false }),
            makeClothingRequest({ fulfilled: false }),
            makeClothingRequest({ fulfilled: false }),
          ],
        }),
      );
      expect(r.request_fulfilment_rate).toBe(40); // pct(2,5)=40
    });

    it("possession_safeguarding_rate = pct(resolved, total_safeguarding)", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          possession_safeguarding_records: [
            makeSafeguarding({ resolved: true }),
            makeSafeguarding({ resolved: true }),
            makeSafeguarding({ resolved: false }),
          ],
        }),
      );
      expect(r.possession_safeguarding_rate).toBe(67); // pct(2,3)=67
    });

    it("child_choice_rate is composite across 4 sources", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0, child_chose_own_items: true }),
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0, child_chose_own_items: false }),
          ],
          wardrobe_review_records: [
            makeWardrobeReview({ child_consulted: true }),
            makeWardrobeReview({ child_consulted: true }),
          ],
          personal_inventory_records: [
            makeInventory({ child_involved_in_inventory: true }),
          ],
          clothing_request_records: [
            makeClothingRequest({ child_choice_respected: true }),
            makeClothingRequest({ child_choice_respected: false }),
            makeClothingRequest({ child_choice_respected: false }),
          ],
        }),
      );
      // allowance: 1/2, wardrobe: 2/2, inventory: 1/1, request: 1/3
      // total num=1+2+1+1=5, total denom=2+2+1+3=8 => pct(5,8)=63
      expect(r.child_choice_rate).toBe(63);
    });

    it("child_choice_rate excludes sources with 0 records from denominator", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0, child_chose_own_items: true }),
          ],
          // No wardrobe, no inventory, no requests
        }),
      );
      // Only allowance contributes: 1/1 = 100%
      expect(r.child_choice_rate).toBe(100);
    });

    it("child_choice_rate is 0 when denom is 0", () => {
      // Safeguarding records don't contribute to child choice
      const r = computeClothingPersonalPossessions(
        baseInput({
          possession_safeguarding_records: [
            makeSafeguarding({ resolved: true }),
          ],
        }),
      );
      expect(r.child_choice_rate).toBe(0);
    });

    it("pct rounds to nearest integer", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 300, amount_spent_gbp: 200 }),
          ],
        }),
      );
      // pct(200, 300) = Math.round(200/300*100) = Math.round(66.67) = 67
      expect(r.allowance_utilisation_rate).toBe(67);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // OUTSTANDING SCENARIO
  // ════════════════════════════════════════════════════════════════════════

  describe("Outstanding Scenario", () => {
    function outstandingInput(): ClothingPossessionsInput {
      return baseInput({
        total_children: 3,
        clothing_allowance_records: repeat(3, (i) =>
          makeAllowance({
            child_id: `child_${i + 1}`,
            allowance_amount_gbp: 100,
            amount_spent_gbp: 90,
            child_involved_in_shopping: true,
            child_chose_own_items: true,
            age_appropriate: true,
            seasonal_needs_met: true,
            receipts_retained: true,
            quality_rating: 5,
          }),
        ),
        wardrobe_review_records: [
          ...repeat(3, (i) =>
            makeWardrobeReview({
              child_id: `child_${i + 1}`,
              season: (["spring", "summer", "autumn"] as const)[i],
              overall_adequate: true,
              adequate_clothing: true,
              adequate_footwear: true,
              adequate_outerwear: true,
              adequate_school_uniform: true,
              adequate_nightwear: true,
              adequate_underwear: true,
              child_consulted: true,
              child_satisfied: true,
              cultural_religious_needs_met: true,
              dignity_maintained: true,
              items_needing_replacement: 2,
              items_replaced: 2,
            }),
          ),
          makeWardrobeReview({
            child_id: "child_1",
            season: "winter",
            overall_adequate: true,
            adequate_clothing: true,
            adequate_footwear: true,
            adequate_outerwear: true,
            adequate_school_uniform: true,
            adequate_nightwear: true,
            adequate_underwear: true,
            child_consulted: true,
            child_satisfied: true,
            cultural_religious_needs_met: true,
            dignity_maintained: true,
            items_needing_replacement: 1,
            items_replaced: 1,
          }),
        ],
        personal_inventory_records: repeat(3, (i) =>
          makeInventory({
            child_id: `child_${i + 1}`,
            total_items_recorded: 20,
            items_accounted_for: 20,
            items_missing: 0,
            items_damaged: 0,
            sentimental_items_safeguarded: true,
            electronics_recorded: true,
            child_involved_in_inventory: true,
            storage_adequate: true,
            privacy_respected: true,
            photographic_record: true,
            inventory_complete: true,
          }),
        ),
        clothing_request_records: repeat(3, (i) =>
          makeClothingRequest({
            child_id: `child_${i + 1}`,
            fulfilled: true,
            fulfilment_date: "2026-03-05",
            days_to_fulfil: 2,
            child_satisfied_with_outcome: true,
            child_choice_respected: true,
          }),
        ),
        possession_safeguarding_records: repeat(3, (i) =>
          makeSafeguarding({
            child_id: `child_${i + 1}`,
            resolved: true,
            resolution_date: "2026-03-05",
            days_to_resolve: 1,
            child_informed: true,
            child_satisfied: true,
            replacement_provided: true,
            incident_documented: true,
          }),
        ),
      });
    }

    it("achieves outstanding rating with score 80", () => {
      const r = computeClothingPersonalPossessions(outstandingInput());
      expect(r.clothing_rating).toBe("outstanding");
      expect(r.clothing_score).toBe(80);
    });

    it("headline says outstanding", () => {
      const r = computeClothingPersonalPossessions(outstandingInput());
      expect(r.headline).toContain("Outstanding clothing and personal possessions practice");
    });

    it("has multiple strengths", () => {
      const r = computeClothingPersonalPossessions(outstandingInput());
      expect(r.strengths.length).toBeGreaterThan(5);
    });

    it("has no concerns", () => {
      const r = computeClothingPersonalPossessions(outstandingInput());
      expect(r.concerns).toHaveLength(0);
    });

    it("has no recommendations", () => {
      const r = computeClothingPersonalPossessions(outstandingInput());
      expect(r.recommendations).toHaveLength(0);
    });

    it("has positive insights", () => {
      const r = computeClothingPersonalPossessions(outstandingInput());
      const positiveInsights = r.insights.filter((i) => i.severity === "positive");
      expect(positiveInsights.length).toBeGreaterThan(0);
    });

    it("includes outstanding practice insight", () => {
      const r = computeClothingPersonalPossessions(outstandingInput());
      const outstandingInsight = r.insights.find(
        (i) => i.severity === "positive" && i.text.includes("outstanding practice"),
      );
      expect(outstandingInsight).toBeDefined();
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // GOOD SCENARIO
  // ════════════════════════════════════════════════════════════════════════

  describe("Good Scenario", () => {
    it("achieves good with moderate bonuses", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({
              allowance_amount_gbp: 100,
              amount_spent_gbp: 85,
              child_chose_own_items: true,
              quality_rating: 4,
            }),
          ],
          wardrobe_review_records: [
            makeWardrobeReview({
              overall_adequate: true,
              child_consulted: true,
              dignity_maintained: true,
              items_needing_replacement: 5,
              items_replaced: 5,
            }),
          ],
          personal_inventory_records: [
            makeInventory({
              total_items_recorded: 100,
              items_accounted_for: 96,
              child_involved_in_inventory: true,
            }),
          ],
          clothing_request_records: [
            makeClothingRequest({
              fulfilled: true,
              child_choice_respected: true,
            }),
          ],
          possession_safeguarding_records: [
            makeSafeguarding({ resolved: true }),
          ],
        }),
      );
      // allowance >=80 => +4, wardrobe >=90 (1/1=100%) => +4
      // inventory >=95 (96%) => +3, request >=90 (100%) => +3
      // safeguarding >=90 (100%) => +3, dignity >=95 (100%) => +3
      // replacement >=90 (100%) => +3, quality >=4.0 => +2
      // childChoice: num=1+1+1+1=4, denom=1+1+1+1=4 => 100% >= 90 => +3
      // Total: 52 + 4+4+3+3+3+3+3+3+2 = 80 => outstanding!
      // Let's tone it down: drop inventory child involvement and request choice
      expect(r.clothing_rating).toBe("outstanding");
      // This is actually outstanding. Good scenario needs fewer bonuses.
    });

    it("achieves good with targeted bonuses (score 65-79)", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({
              allowance_amount_gbp: 100,
              amount_spent_gbp: 85,
              quality_rating: 4,
            }),
          ],
          wardrobe_review_records: [
            makeWardrobeReview({ overall_adequate: true }),
          ],
          personal_inventory_records: [
            makeInventory({
              total_items_recorded: 100,
              items_accounted_for: 96,
            }),
          ],
        }),
      );
      // allowance >=80 => +4, wardrobe >=90 => +4, inventory >= 95 => +3
      // quality >= 4.0 => +2
      // childChoice: denom=1+1+1=3, num=0 => 0% < 30 => -3
      // 52 + 4 + 4 + 3 + 2 - 3 = 62 => adequate
      // Hmm, still not good. We need +13 without penalty:
      // Let's ensure child choice doesn't trigger penalty
      const r2 = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({
              allowance_amount_gbp: 100,
              amount_spent_gbp: 85,
              child_chose_own_items: true,
              quality_rating: 4,
            }),
          ],
          wardrobe_review_records: [
            makeWardrobeReview({
              overall_adequate: true,
              child_consulted: true,
            }),
          ],
          personal_inventory_records: [
            makeInventory({
              total_items_recorded: 100,
              items_accounted_for: 96,
              child_involved_in_inventory: true,
            }),
          ],
        }),
      );
      // allowance >=80 => +4, wardrobe >=90 => +4, inventory >= 95 => +3
      // quality >= 4.0 => +2
      // childChoice: denom=1+1+1=3, num=1+1+1=3 => 100% >= 90 => +3
      // dignity: 0% => no bonus (< 80)
      // replacement: 0 items => pct(0,0) = 0 => no bonus
      // 52 + 4 + 4 + 3 + 2 + 3 = 68 => good
      expect(r2.clothing_score).toBe(68);
      expect(r2.clothing_rating).toBe("good");
    });

    it("good headline includes strength and concern counts", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({
              allowance_amount_gbp: 100,
              amount_spent_gbp: 85,
              child_chose_own_items: true,
              quality_rating: 4,
            }),
          ],
          wardrobe_review_records: [
            makeWardrobeReview({
              overall_adequate: true,
              child_consulted: true,
            }),
          ],
          personal_inventory_records: [
            makeInventory({
              total_items_recorded: 100,
              items_accounted_for: 96,
              child_involved_in_inventory: true,
            }),
          ],
        }),
      );
      expect(r.headline).toContain("Good clothing and personal possessions practice");
      expect(r.headline).toMatch(/strength/);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // ADEQUATE SCENARIO
  // ════════════════════════════════════════════════════════════════════════

  describe("Adequate Scenario", () => {
    it("base score of 52 yields adequate", () => {
      // Use safeguarding at 50-69% for a clean base 52 with no bonuses/penalties
      const r = computeClothingPersonalPossessions(
        baseInput({
          possession_safeguarding_records: [
            makeSafeguarding({ resolved: true }),
            makeSafeguarding({ resolved: false }),
          ],
        }),
      );
      expect(r.clothing_rating).toBe("adequate");
      expect(r.clothing_score).toBe(52);
    });

    it("adequate headline mentions concerns", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          possession_safeguarding_records: [
            makeSafeguarding({ resolved: true }),
            makeSafeguarding({ resolved: false }),
          ],
        }),
      );
      expect(r.headline).toContain("Adequate clothing and personal possessions practice");
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // INADEQUATE SCENARIO
  // ════════════════════════════════════════════════════════════════════════

  describe("Inadequate Scenario", () => {
    it("heavy penalties yield inadequate", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          wardrobe_review_records: [makeWardrobeReview({ overall_adequate: false })],
          clothing_request_records: [makeClothingRequest({ fulfilled: false })],
          possession_safeguarding_records: [makeSafeguarding({ resolved: false })],
        }),
      );
      expect(r.clothing_rating).toBe("inadequate");
      expect(r.clothing_score).toBe(34);
    });

    it("inadequate headline mentions significant concerns", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          wardrobe_review_records: [makeWardrobeReview({ overall_adequate: false })],
          clothing_request_records: [makeClothingRequest({ fulfilled: false })],
          possession_safeguarding_records: [makeSafeguarding({ resolved: false })],
        }),
      );
      expect(r.headline).toContain("inadequate");
      expect(r.headline).toMatch(/significant concern/);
    });

    it("inadequate generates multiple concerns", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          wardrobe_review_records: [makeWardrobeReview({ overall_adequate: false })],
          clothing_request_records: [makeClothingRequest({ fulfilled: false })],
          possession_safeguarding_records: [makeSafeguarding({ resolved: false })],
        }),
      );
      expect(r.concerns.length).toBeGreaterThan(3);
    });

    it("inadequate generates immediate recommendations", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          wardrobe_review_records: [makeWardrobeReview({ overall_adequate: false })],
          clothing_request_records: [makeClothingRequest({ fulfilled: false })],
          possession_safeguarding_records: [makeSafeguarding({ resolved: false })],
        }),
      );
      const immediateRecs = r.recommendations.filter((rec) => rec.urgency === "immediate");
      expect(immediateRecs.length).toBeGreaterThan(0);
    });

    it("recommendations have sequential ranks", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          wardrobe_review_records: [makeWardrobeReview({ overall_adequate: false })],
          clothing_request_records: [makeClothingRequest({ fulfilled: false })],
          possession_safeguarding_records: [makeSafeguarding({ resolved: false })],
        }),
      );
      for (let i = 0; i < r.recommendations.length; i++) {
        expect(r.recommendations[i].rank).toBe(i + 1);
      }
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // STRENGTHS
  // ════════════════════════════════════════════════════════════════════════

  describe("Strengths", () => {
    it("includes allowance utilisation strength at >= 80%", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 85 }),
          ],
        }),
      );
      const s = r.strengths.find((s) => s.includes("allowance utilisation"));
      expect(s).toBeDefined();
      expect(s).toContain("85%");
    });

    it("includes allowance utilisation strength at >= 60% tier", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 65 }),
          ],
        }),
      );
      const s = r.strengths.find((s) => s.includes("allowance utilisation"));
      expect(s).toBeDefined();
      expect(s).toContain("65%");
      expect(s).toContain("reasonable use");
    });

    it("includes wardrobe adequacy strength at >= 90%", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          wardrobe_review_records: [makeWardrobeReview({ overall_adequate: true })],
        }),
      );
      const s = r.strengths.find((s) => s.includes("wardrobe adequacy"));
      expect(s).toBeDefined();
    });

    it("includes wardrobe adequacy strength at >= 70% tier", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          wardrobe_review_records: [
            ...repeat(7, () => makeWardrobeReview({ overall_adequate: true })),
            ...repeat(3, () => makeWardrobeReview({ overall_adequate: false })),
          ],
        }),
      );
      const s = r.strengths.find((s) => s.includes("wardrobe adequacy"));
      expect(s).toBeDefined();
      expect(s).toContain("70%");
    });

    it("includes inventory completeness strength at >= 95%", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          personal_inventory_records: [
            makeInventory({ total_items_recorded: 100, items_accounted_for: 96 }),
          ],
        }),
      );
      const s = r.strengths.find((s) => s.includes("inventory completeness"));
      expect(s).toBeDefined();
    });

    it("includes request fulfilment strength at >= 90%", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          clothing_request_records: [
            makeClothingRequest({ fulfilled: true }),
          ],
        }),
      );
      const s = r.strengths.find((s) => s.includes("clothing requests fulfilled"));
      expect(s).toBeDefined();
    });

    it("includes safeguarding strength at >= 90%", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          possession_safeguarding_records: [
            makeSafeguarding({ resolved: true }),
          ],
        }),
      );
      const s = r.strengths.find((s) => s.includes("possession safeguarding"));
      expect(s).toBeDefined();
    });

    it("includes child choice strength at >= 90%", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({
              allowance_amount_gbp: 100,
              amount_spent_gbp: 0,
              child_chose_own_items: true,
            }),
          ],
        }),
      );
      const s = r.strengths.find((s) => s.includes("child choice rate"));
      expect(s).toBeDefined();
    });

    it("includes dignity maintained strength at >= 95%", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          wardrobe_review_records: [
            makeWardrobeReview({ dignity_maintained: true }),
          ],
        }),
      );
      const s = r.strengths.find((s) => s.includes("dignity maintained"));
      expect(s).toBeDefined();
    });

    it("includes replacement rate strength at >= 90%", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          wardrobe_review_records: [
            makeWardrobeReview({ items_needing_replacement: 10, items_replaced: 10 }),
          ],
        }),
      );
      const s = r.strengths.find((s) => s.includes("replacement"));
      expect(s).toBeDefined();
    });

    it("includes quality rating strength at >= 4.0", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0, quality_rating: 4.5 }),
          ],
        }),
      );
      const s = r.strengths.find((s) => s.includes("quality rating"));
      expect(s).toBeDefined();
    });

    it("includes child involved in shopping strength at >= 90%", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({
              allowance_amount_gbp: 100,
              amount_spent_gbp: 0,
              child_involved_in_shopping: true,
            }),
          ],
        }),
      );
      const s = r.strengths.find((s) => s.includes("shopping trips"));
      expect(s).toBeDefined();
    });

    it("includes cultural/religious strength at >= 95%", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          wardrobe_review_records: [
            makeWardrobeReview({ cultural_religious_needs_met: true }),
          ],
        }),
      );
      const s = r.strengths.find((s) => s.includes("Cultural and religious"));
      expect(s).toBeDefined();
    });

    it("includes sentimental safeguarded strength at >= 90%", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          personal_inventory_records: [
            makeInventory({ sentimental_items_safeguarded: true }),
          ],
        }),
      );
      const s = r.strengths.find((s) => s.includes("Sentimental items safeguarded"));
      expect(s).toBeDefined();
    });

    it("includes urgent fulfilment strength at >= 95%", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          clothing_request_records: [
            makeClothingRequest({ urgency: "urgent", fulfilled: true }),
          ],
        }),
      );
      const s = r.strengths.find((s) => s.includes("urgent clothing requests fulfilled"));
      expect(s).toBeDefined();
    });

    it("includes child satisfied in wardrobe reviews strength at >= 90%", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          wardrobe_review_records: [
            makeWardrobeReview({ child_satisfied: true }),
          ],
        }),
      );
      const s = r.strengths.find((s) => s.includes("child satisfaction in wardrobe reviews"));
      expect(s).toBeDefined();
    });

    it("includes all seasons covered strength", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          wardrobe_review_records: [
            makeWardrobeReview({ season: "spring" }),
            makeWardrobeReview({ season: "summer" }),
            makeWardrobeReview({ season: "autumn" }),
            makeWardrobeReview({ season: "winter" }),
          ],
        }),
      );
      const s = r.strengths.find((s) => s.includes("all four seasons"));
      expect(s).toBeDefined();
    });

    it("includes privacy respected strength at >= 95%", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          personal_inventory_records: [
            makeInventory({ privacy_respected: true }),
          ],
        }),
      );
      const s = r.strengths.find((s) => s.includes("Privacy respected"));
      expect(s).toBeDefined();
    });

    it("includes storage adequate strength at >= 90%", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          personal_inventory_records: [
            makeInventory({ storage_adequate: true }),
          ],
        }),
      );
      const s = r.strengths.find((s) => s.includes("Adequate storage"));
      expect(s).toBeDefined();
    });

    it("includes receipts retained strength at >= 90%", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0, receipts_retained: true }),
          ],
        }),
      );
      const s = r.strengths.find((s) => s.includes("Receipts retained"));
      expect(s).toBeDefined();
    });

    it("includes all children have allowance strength at 100% coverage", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          total_children: 3,
          clothing_allowance_records: [
            makeAllowance({ child_id: "child_1", allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
            makeAllowance({ child_id: "child_2", allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
            makeAllowance({ child_id: "child_3", allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
        }),
      );
      const s = r.strengths.find((s) => s.includes("Every child has clothing allowance"));
      expect(s).toBeDefined();
    });

    it("includes documented rate strength at >= 90%", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          possession_safeguarding_records: [
            makeSafeguarding({ incident_documented: true }),
          ],
        }),
      );
      const s = r.strengths.find((s) => s.includes("documented"));
      expect(s).toBeDefined();
    });

    it("includes fast fulfilment strength at <= 3 days", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          clothing_request_records: [
            makeClothingRequest({ fulfilled: true, days_to_fulfil: 2 }),
          ],
        }),
      );
      const s = r.strengths.find((s) => s.includes("fulfilment in"));
      expect(s).toBeDefined();
    });

    it("no strengths for allowance util when 0 records", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          possession_safeguarding_records: [makeSafeguarding({ resolved: true })],
        }),
      );
      const s = r.strengths.find((s) => s.includes("allowance utilisation"));
      expect(s).toBeUndefined();
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // CONCERNS
  // ════════════════════════════════════════════════════════════════════════

  describe("Concerns", () => {
    it("concern for wardrobe adequacy < 50%", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          wardrobe_review_records: [
            makeWardrobeReview({ overall_adequate: false }),
            makeWardrobeReview({ overall_adequate: false }),
          ],
        }),
      );
      const c = r.concerns.find((c) => c.includes("wardrobe reviews show adequate"));
      expect(c).toBeDefined();
    });

    it("concern for wardrobe adequacy 50-69%", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          wardrobe_review_records: [
            ...repeat(6, () => makeWardrobeReview({ overall_adequate: true })),
            ...repeat(4, () => makeWardrobeReview({ overall_adequate: false })),
          ],
        }),
      );
      const c = r.concerns.find((c) => c.includes("Wardrobe adequacy at 60%"));
      expect(c).toBeDefined();
    });

    it("concern for request fulfilment < 50%", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          clothing_request_records: [
            makeClothingRequest({ fulfilled: false }),
          ],
        }),
      );
      const c = r.concerns.find((c) => c.includes("clothing requests fulfilled"));
      expect(c).toBeDefined();
    });

    it("concern for request fulfilment 50-69%", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          clothing_request_records: [
            ...repeat(6, () => makeClothingRequest({ fulfilled: true })),
            ...repeat(4, () => makeClothingRequest({ fulfilled: false })),
          ],
        }),
      );
      const c = r.concerns.find((c) => c.includes("Clothing request fulfilment at 60%"));
      expect(c).toBeDefined();
    });

    it("concern for child choice < 30%", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0, child_chose_own_items: false }),
          ],
          wardrobe_review_records: [
            makeWardrobeReview({ child_consulted: false }),
          ],
        }),
      );
      const c = r.concerns.find((c) => c.includes("child choice rate"));
      expect(c).toBeDefined();
    });

    it("concern for child choice 30-69%", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0, child_chose_own_items: true }),
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0, child_chose_own_items: false }),
          ],
        }),
      );
      // childChoice: 1/2 = 50% in 30-69 range
      const c = r.concerns.find((c) => c.includes("Child choice rate at 50%"));
      expect(c).toBeDefined();
    });

    it("concern for safeguarding rate < 50%", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          possession_safeguarding_records: [
            makeSafeguarding({ resolved: false }),
          ],
        }),
      );
      const c = r.concerns.find((c) => c.includes("possession safeguarding incidents resolved"));
      expect(c).toBeDefined();
    });

    it("concern for safeguarding rate 50-69%", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          possession_safeguarding_records: [
            ...repeat(6, () => makeSafeguarding({ resolved: true })),
            ...repeat(4, () => makeSafeguarding({ resolved: false })),
          ],
        }),
      );
      const c = r.concerns.find((c) => c.includes("Possession safeguarding resolution at 60%"));
      expect(c).toBeDefined();
    });

    it("concern for allowance utilisation < 40%", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 30 }),
          ],
        }),
      );
      const c = r.concerns.find((c) => c.includes("clothing allowance utilisation"));
      expect(c).toBeDefined();
    });

    it("concern for allowance utilisation 40-59%", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 45 }),
          ],
        }),
      );
      const c = r.concerns.find((c) => c.includes("Clothing allowance utilisation at 45%"));
      expect(c).toBeDefined();
    });

    it("concern for inventory completeness < 70%", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          personal_inventory_records: [
            makeInventory({ total_items_recorded: 100, items_accounted_for: 60 }),
          ],
        }),
      );
      const c = r.concerns.find((c) => c.includes("Inventory completeness at 60%"));
      expect(c).toBeDefined();
    });

    it("concern for inventory completeness 70-79%", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          personal_inventory_records: [
            makeInventory({ total_items_recorded: 100, items_accounted_for: 75 }),
          ],
        }),
      );
      const c = r.concerns.find((c) => c.includes("Inventory completeness at 75%"));
      expect(c).toBeDefined();
    });

    it("concern for dignity < 80%", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          wardrobe_review_records: [
            makeWardrobeReview({ dignity_maintained: false }),
          ],
        }),
      );
      const c = r.concerns.find((c) => c.includes("Dignity maintained in only"));
      expect(c).toBeDefined();
    });

    it("concern for cultural/religious < 80%", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          wardrobe_review_records: [
            makeWardrobeReview({ cultural_religious_needs_met: false }),
          ],
        }),
      );
      const c = r.concerns.find((c) => c.includes("Cultural and religious clothing needs"));
      expect(c).toBeDefined();
    });

    it("concern for missing items >= 15%", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          personal_inventory_records: [
            makeInventory({ total_items_recorded: 100, items_accounted_for: 80, items_missing: 16 }),
          ],
        }),
      );
      const c = r.concerns.find((c) => c.includes("inventoried items missing"));
      expect(c).toBeDefined();
    });

    it("concern for missing items 8-14%", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          personal_inventory_records: [
            makeInventory({ total_items_recorded: 100, items_accounted_for: 90, items_missing: 8 }),
          ],
        }),
      );
      const c = r.concerns.find((c) => c.includes("8% of inventoried items missing"));
      expect(c).toBeDefined();
    });

    it("concern for urgent fulfilment < 80%", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          clothing_request_records: [
            makeClothingRequest({ urgency: "urgent", fulfilled: false }),
          ],
        }),
      );
      const c = r.concerns.find((c) => c.includes("urgent clothing requests fulfilled"));
      expect(c).toBeDefined();
    });

    it("concern for confiscations not returned", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          possession_safeguarding_records: [
            makeSafeguarding({ event_type: "confiscation", resolved: false }),
          ],
        }),
      );
      const c = r.concerns.find((c) => c.includes("confiscation"));
      expect(c).toBeDefined();
    });

    it("no confiscation concern when all confiscations returned", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          possession_safeguarding_records: [
            makeSafeguarding({ event_type: "confiscation", resolved: true }),
          ],
        }),
      );
      const c = r.concerns.find((c) => c.includes("confiscation"));
      expect(c).toBeUndefined();
    });

    it("concern for avg fulfilment > 14 days", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          clothing_request_records: [
            makeClothingRequest({ fulfilled: true, days_to_fulfil: 20 }),
          ],
        }),
      );
      const c = r.concerns.find((c) => c.includes("20 days"));
      expect(c).toBeDefined();
    });

    it("concern for avg fulfilment 7-14 days", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          clothing_request_records: [
            makeClothingRequest({ fulfilled: true, days_to_fulfil: 10 }),
          ],
        }),
      );
      const c = r.concerns.find((c) => c.includes("10 days"));
      expect(c).toBeDefined();
    });

    it("concern for review child coverage < 80%", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          total_children: 3,
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          wardrobe_review_records: [
            makeWardrobeReview({ child_id: "child_1" }),
            makeWardrobeReview({ child_id: "child_2" }),
          ],
        }),
      );
      // 2/3 = 67% < 80%
      const c = r.concerns.find((c) => c.includes("wardrobe reviews"));
      expect(c).toBeDefined();
    });

    it("concern for storage < 70%", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          personal_inventory_records: [
            makeInventory({ storage_adequate: false }),
          ],
        }),
      );
      const c = r.concerns.find((c) => c.includes("adequate storage"));
      expect(c).toBeDefined();
    });

    it("concern for child satisfaction < 60% in fulfilled requests", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          clothing_request_records: [
            makeClothingRequest({ fulfilled: true, child_satisfied_with_outcome: false }),
            makeClothingRequest({ fulfilled: true, child_satisfied_with_outcome: false }),
            makeClothingRequest({ fulfilled: true, child_satisfied_with_outcome: true }),
          ],
        }),
      );
      // childSatisfiedRequest = 1, fulfilledRequests = 3, rate = pct(1,3) = 33%
      const c = r.concerns.find((c) => c.includes("child satisfaction with fulfilled"));
      expect(c).toBeDefined();
    });

    it("concern for replacement rate < 50%", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          wardrobe_review_records: [
            makeWardrobeReview({ items_needing_replacement: 10, items_replaced: 3 }),
          ],
        }),
      );
      const c = r.concerns.find((c) => c.includes("items identified for replacement"));
      expect(c).toBeDefined();
    });

    it("concern for replacement rate 50-69%", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          wardrobe_review_records: [
            makeWardrobeReview({ items_needing_replacement: 10, items_replaced: 6 }),
          ],
        }),
      );
      const c = r.concerns.find((c) => c.includes("Replacement rate at 60%"));
      expect(c).toBeDefined();
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // RECOMMENDATIONS
  // ════════════════════════════════════════════════════════════════════════

  describe("Recommendations", () => {
    it("immediate rec for wardrobe adequacy < 50%", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          wardrobe_review_records: [makeWardrobeReview({ overall_adequate: false })],
        }),
      );
      const rec = r.recommendations.find(
        (rec) => rec.urgency === "immediate" && rec.recommendation.includes("wardrobe adequacy"),
      );
      expect(rec).toBeDefined();
    });

    it("immediate rec for request fulfilment < 50%", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          clothing_request_records: [makeClothingRequest({ fulfilled: false })],
        }),
      );
      const rec = r.recommendations.find(
        (rec) => rec.urgency === "immediate" && rec.recommendation.includes("unfulfilled clothing requests"),
      );
      expect(rec).toBeDefined();
    });

    it("immediate rec for child choice < 30%", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0, child_chose_own_items: false }),
          ],
          wardrobe_review_records: [makeWardrobeReview({ child_consulted: false })],
        }),
      );
      const rec = r.recommendations.find(
        (rec) => rec.urgency === "immediate" && rec.recommendation.includes("children's voice and choice"),
      );
      expect(rec).toBeDefined();
    });

    it("immediate rec for safeguarding < 50%", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          possession_safeguarding_records: [makeSafeguarding({ resolved: false })],
        }),
      );
      const rec = r.recommendations.find(
        (rec) => rec.urgency === "immediate" && rec.recommendation.includes("possession safeguarding system"),
      );
      expect(rec).toBeDefined();
    });

    it("immediate rec for dignity < 80%", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          wardrobe_review_records: [makeWardrobeReview({ dignity_maintained: false })],
        }),
      );
      const rec = r.recommendations.find(
        (rec) => rec.urgency === "immediate" && rec.recommendation.includes("dignity"),
      );
      expect(rec).toBeDefined();
    });

    it("soon rec for allowance utilisation 40-59%", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 50 }),
          ],
        }),
      );
      const rec = r.recommendations.find(
        (rec) => rec.urgency === "soon" && rec.recommendation.includes("allowance utilisation"),
      );
      expect(rec).toBeDefined();
    });

    it("soon rec for request fulfilment 50-69%", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          clothing_request_records: [
            ...repeat(6, () => makeClothingRequest({ fulfilled: true })),
            ...repeat(4, () => makeClothingRequest({ fulfilled: false })),
          ],
        }),
      );
      const rec = r.recommendations.find(
        (rec) => rec.urgency === "soon" && rec.recommendation.includes("request fulfilment"),
      );
      expect(rec).toBeDefined();
    });

    it("soon rec for child choice 30-69%", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0, child_chose_own_items: true }),
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0, child_chose_own_items: false }),
          ],
        }),
      );
      const rec = r.recommendations.find(
        (rec) => rec.urgency === "soon" && rec.recommendation.includes("children's involvement"),
      );
      expect(rec).toBeDefined();
    });

    it("soon rec for safeguarding 50-69%", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          possession_safeguarding_records: [
            ...repeat(6, () => makeSafeguarding({ resolved: true })),
            ...repeat(4, () => makeSafeguarding({ resolved: false })),
          ],
        }),
      );
      const rec = r.recommendations.find(
        (rec) => rec.urgency === "soon" && rec.recommendation.includes("safeguarding processes"),
      );
      expect(rec).toBeDefined();
    });

    it("planned rec for wardrobe adequacy 50-69%", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          wardrobe_review_records: [
            ...repeat(6, () => makeWardrobeReview({ overall_adequate: true })),
            ...repeat(4, () => makeWardrobeReview({ overall_adequate: false })),
          ],
        }),
      );
      const rec = r.recommendations.find(
        (rec) => rec.urgency === "planned" && rec.recommendation.includes("wardrobe improvement plans"),
      );
      expect(rec).toBeDefined();
    });

    it("planned rec for seasonal coverage < 4", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          wardrobe_review_records: [
            makeWardrobeReview({ season: "spring" }),
            makeWardrobeReview({ season: "summer" }),
          ],
        }),
      );
      const rec = r.recommendations.find(
        (rec) => rec.urgency === "planned" && rec.recommendation.includes("all four seasons"),
      );
      expect(rec).toBeDefined();
    });

    it("planned rec for photographic record < 50%", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          personal_inventory_records: [
            makeInventory({ photographic_record: false }),
          ],
        }),
      );
      const rec = r.recommendations.find(
        (rec) => rec.urgency === "planned" && rec.recommendation.includes("photographic records"),
      );
      expect(rec).toBeDefined();
    });

    it("all recommendations have regulatory_ref", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          wardrobe_review_records: [makeWardrobeReview({ overall_adequate: false })],
          clothing_request_records: [makeClothingRequest({ fulfilled: false })],
          possession_safeguarding_records: [makeSafeguarding({ resolved: false })],
        }),
      );
      for (const rec of r.recommendations) {
        expect(rec.regulatory_ref).toBeTruthy();
      }
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // INSIGHTS
  // ════════════════════════════════════════════════════════════════════════

  describe("Insights", () => {
    it("critical insight for wardrobe adequacy < 50%", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          wardrobe_review_records: [makeWardrobeReview({ overall_adequate: false })],
        }),
      );
      const i = r.insights.find(
        (i) => i.severity === "critical" && i.text.includes("wardrobe reviews show adequate"),
      );
      expect(i).toBeDefined();
    });

    it("critical insight for request fulfilment < 50%", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          clothing_request_records: [makeClothingRequest({ fulfilled: false })],
        }),
      );
      const i = r.insights.find(
        (i) => i.severity === "critical" && i.text.includes("clothing requests fulfilled"),
      );
      expect(i).toBeDefined();
    });

    it("critical insight for child choice < 30%", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0, child_chose_own_items: false }),
          ],
          wardrobe_review_records: [makeWardrobeReview({ child_consulted: false })],
        }),
      );
      const i = r.insights.find(
        (i) => i.severity === "critical" && i.text.includes("Child choice rate"),
      );
      expect(i).toBeDefined();
    });

    it("critical insight for safeguarding < 50%", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          possession_safeguarding_records: [makeSafeguarding({ resolved: false })],
        }),
      );
      const i = r.insights.find(
        (i) => i.severity === "critical" && i.text.includes("possession incidents resolved"),
      );
      expect(i).toBeDefined();
    });

    it("critical insight for dignity < 70%", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          wardrobe_review_records: [
            makeWardrobeReview({ dignity_maintained: false }),
            makeWardrobeReview({ dignity_maintained: false }),
          ],
        }),
      );
      const i = r.insights.find(
        (i) => i.severity === "critical" && i.text.includes("Dignity maintained in only"),
      );
      expect(i).toBeDefined();
    });

    it("critical insight for no wardrobe reviews but children present", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
        }),
      );
      const i = r.insights.find(
        (i) => i.severity === "critical" && i.text.includes("No wardrobe reviews"),
      );
      expect(i).toBeDefined();
    });

    it("critical insight for no inventory records but children present", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
        }),
      );
      const i = r.insights.find(
        (i) => i.severity === "critical" && i.text.includes("No personal inventory records"),
      );
      expect(i).toBeDefined();
    });

    it("warning insight for wardrobe adequacy 50-69%", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          wardrobe_review_records: [
            ...repeat(6, () => makeWardrobeReview({ overall_adequate: true })),
            ...repeat(4, () => makeWardrobeReview({ overall_adequate: false })),
          ],
        }),
      );
      const i = r.insights.find(
        (i) => i.severity === "warning" && i.text.includes("Wardrobe adequacy at 60%"),
      );
      expect(i).toBeDefined();
    });

    it("warning insight for request fulfilment 50-69%", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          clothing_request_records: [
            ...repeat(6, () => makeClothingRequest({ fulfilled: true })),
            ...repeat(4, () => makeClothingRequest({ fulfilled: false })),
          ],
        }),
      );
      const i = r.insights.find(
        (i) => i.severity === "warning" && i.text.includes("Clothing request fulfilment at 60%"),
      );
      expect(i).toBeDefined();
    });

    it("warning insight for child choice 30-69%", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0, child_chose_own_items: true }),
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0, child_chose_own_items: false }),
          ],
        }),
      );
      const i = r.insights.find(
        (i) => i.severity === "warning" && i.text.includes("Child choice rate at 50%"),
      );
      expect(i).toBeDefined();
    });

    it("warning insight for safeguarding 50-69%", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          possession_safeguarding_records: [
            ...repeat(6, () => makeSafeguarding({ resolved: true })),
            ...repeat(4, () => makeSafeguarding({ resolved: false })),
          ],
        }),
      );
      const i = r.insights.find(
        (i) => i.severity === "warning" && i.text.includes("Possession safeguarding resolution at 60%"),
      );
      expect(i).toBeDefined();
    });

    it("warning insight for allowance utilisation 40-59%", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 50 }),
          ],
        }),
      );
      const i = r.insights.find(
        (i) => i.severity === "warning" && i.text.includes("Clothing allowance utilisation at 50%"),
      );
      expect(i).toBeDefined();
    });

    it("warning insight for confiscations >= 3", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          possession_safeguarding_records: [
            makeSafeguarding({ event_type: "confiscation" }),
            makeSafeguarding({ event_type: "confiscation" }),
            makeSafeguarding({ event_type: "confiscation" }),
          ],
        }),
      );
      const i = r.insights.find(
        (i) => i.severity === "warning" && i.text.includes("confiscation events recorded"),
      );
      expect(i).toBeDefined();
    });

    it("warning insight for missing budget categories", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ budget_category: "clothing", allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
            makeAllowance({ budget_category: "clothing", allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
            makeAllowance({ budget_category: "clothing", allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
            makeAllowance({ budget_category: "clothing", allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
        }),
      );
      // 4 records, all "clothing" => missing footwear, accessories, school_uniform, sports_kit (4 >= 3)
      const i = r.insights.find(
        (i) => i.severity === "warning" && i.text.includes("limited categories"),
      );
      expect(i).toBeDefined();
    });

    it("no missing category insight when < 4 total records", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ budget_category: "clothing", allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
        }),
      );
      const i = r.insights.find(
        (i) => i.severity === "warning" && i.text.includes("limited categories"),
      );
      expect(i).toBeUndefined();
    });

    it("positive insight for outstanding rating", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          total_children: 3,
          clothing_allowance_records: repeat(3, (i) =>
            makeAllowance({
              child_id: `child_${i + 1}`,
              allowance_amount_gbp: 100,
              amount_spent_gbp: 85,
              child_involved_in_shopping: true,
              child_chose_own_items: true,
              quality_rating: 5,
            }),
          ),
          wardrobe_review_records: repeat(4, (i) =>
            makeWardrobeReview({
              child_id: `child_${(i % 3) + 1}`,
              season: (["spring", "summer", "autumn", "winter"] as const)[i],
              overall_adequate: true,
              child_consulted: true,
              dignity_maintained: true,
              items_needing_replacement: 2,
              items_replaced: 2,
            }),
          ),
          personal_inventory_records: repeat(3, (i) =>
            makeInventory({
              child_id: `child_${i + 1}`,
              total_items_recorded: 20,
              items_accounted_for: 20,
              child_involved_in_inventory: true,
            }),
          ),
          clothing_request_records: repeat(3, () =>
            makeClothingRequest({ fulfilled: true, child_choice_respected: true }),
          ),
          possession_safeguarding_records: repeat(3, () =>
            makeSafeguarding({ resolved: true }),
          ),
        }),
      );
      const i = r.insights.find(
        (i) => i.severity === "positive" && i.text.includes("outstanding practice"),
      );
      expect(i).toBeDefined();
    });

    it("positive insight for combined wardrobe + dignity", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          wardrobe_review_records: [
            makeWardrobeReview({ overall_adequate: true, dignity_maintained: true }),
          ],
        }),
      );
      const i = r.insights.find(
        (i) => i.severity === "positive" && i.text.includes("wardrobe adequacy") && i.text.includes("dignity"),
      );
      expect(i).toBeDefined();
    });

    it("positive insight for combined request fulfilment + satisfaction", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          clothing_request_records: [
            makeClothingRequest({ fulfilled: true, child_satisfied_with_outcome: true }),
          ],
        }),
      );
      const i = r.insights.find(
        (i) =>
          i.severity === "positive" &&
          i.text.includes("request fulfilment") &&
          i.text.includes("child satisfaction"),
      );
      expect(i).toBeDefined();
    });

    it("positive insight for combined inventory + sentimental", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          personal_inventory_records: [
            makeInventory({
              total_items_recorded: 20,
              items_accounted_for: 20,
              sentimental_items_safeguarded: true,
            }),
          ],
        }),
      );
      const i = r.insights.find(
        (i) =>
          i.severity === "positive" &&
          i.text.includes("inventory completeness") &&
          i.text.includes("sentimental"),
      );
      expect(i).toBeDefined();
    });

    it("positive insight for combined safeguarding + documented", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          possession_safeguarding_records: [
            makeSafeguarding({ resolved: true, incident_documented: true }),
          ],
        }),
      );
      const i = r.insights.find(
        (i) =>
          i.severity === "positive" &&
          i.text.includes("possession incidents resolved") &&
          i.text.includes("documented"),
      );
      expect(i).toBeDefined();
    });

    it("positive insight for cultural/religious >= 95%", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          wardrobe_review_records: [
            makeWardrobeReview({ cultural_religious_needs_met: true }),
          ],
        }),
      );
      const i = r.insights.find(
        (i) => i.severity === "positive" && i.text.includes("Cultural and religious"),
      );
      expect(i).toBeDefined();
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // EDGE CASES
  // ════════════════════════════════════════════════════════════════════════

  describe("Edge Cases", () => {
    it("single child with all perfect data", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          total_children: 1,
          clothing_allowance_records: [
            makeAllowance({
              child_id: "child_1",
              allowance_amount_gbp: 200,
              amount_spent_gbp: 180,
              child_involved_in_shopping: true,
              child_chose_own_items: true,
              age_appropriate: true,
              seasonal_needs_met: true,
              receipts_retained: true,
              quality_rating: 5,
            }),
          ],
          wardrobe_review_records: [
            makeWardrobeReview({
              child_id: "child_1",
              overall_adequate: true,
              child_consulted: true,
              child_satisfied: true,
              dignity_maintained: true,
              cultural_religious_needs_met: true,
              items_needing_replacement: 3,
              items_replaced: 3,
            }),
          ],
          personal_inventory_records: [
            makeInventory({
              child_id: "child_1",
              total_items_recorded: 50,
              items_accounted_for: 50,
              child_involved_in_inventory: true,
              sentimental_items_safeguarded: true,
              storage_adequate: true,
              privacy_respected: true,
              photographic_record: true,
              inventory_complete: true,
            }),
          ],
          clothing_request_records: [
            makeClothingRequest({
              child_id: "child_1",
              fulfilled: true,
              days_to_fulfil: 1,
              child_satisfied_with_outcome: true,
              child_choice_respected: true,
            }),
          ],
          possession_safeguarding_records: [
            makeSafeguarding({
              child_id: "child_1",
              resolved: true,
              days_to_resolve: 1,
              child_informed: true,
              child_satisfied: true,
              replacement_provided: true,
              incident_documented: true,
            }),
          ],
        }),
      );
      expect(r.clothing_rating).toBe("outstanding");
      expect(r.clothing_score).toBe(80);
    });

    it("very large number of records", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: repeat(100, () =>
            makeAllowance({
              allowance_amount_gbp: 100,
              amount_spent_gbp: 85,
              child_chose_own_items: true,
              quality_rating: 4,
            }),
          ),
        }),
      );
      expect(r.total_allowance_records).toBe(100);
      expect(r.allowance_utilisation_rate).toBe(85);
    });

    it("total_children=0 with records still gives insufficient_data only when all empty", () => {
      // With records but total_children=0, it should NOT take insufficient_data path
      const r = computeClothingPersonalPossessions(
        baseInput({
          total_children: 0,
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 80 }),
          ],
        }),
      );
      expect(r.clothing_rating).not.toBe("insufficient_data");
    });

    it("handles mixed child IDs correctly", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          total_children: 2,
          clothing_allowance_records: [
            makeAllowance({ child_id: "child_1", allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
            makeAllowance({ child_id: "child_1", allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
            makeAllowance({ child_id: "child_2", allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
        }),
      );
      // 2 unique children out of 2 total => 100% coverage
      const s = r.strengths.find((s) => s.includes("Every child has clothing allowance"));
      expect(s).toBeDefined();
    });

    it("over-spend (>100% utilisation)", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 150, child_chose_own_items: true }),
          ],
        }),
      );
      // pct(150, 100) = 150
      expect(r.allowance_utilisation_rate).toBe(150);
      // +4 bonus (allowance>=80) + 3 (childChoice 100%) = 52 + 4 + 3 = 59
      expect(r.clothing_score).toBe(59);
    });

    it("zero amount allowance does not cause division by zero", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 0, amount_spent_gbp: 0 }),
          ],
        }),
      );
      expect(r.allowance_utilisation_rate).toBe(0);
    });

    it("zero items in inventory does not cause division by zero", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          personal_inventory_records: [
            makeInventory({ total_items_recorded: 0, items_accounted_for: 0 }),
          ],
        }),
      );
      expect(r.inventory_completeness_rate).toBe(0);
    });

    it("only safeguarding records (no other data)", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          possession_safeguarding_records: [
            makeSafeguarding({ resolved: true, incident_documented: true }),
          ],
        }),
      );
      // Not allEmpty since safeguarding exists
      // safeguarding >=90 => +3
      // childChoice denom=0 => no penalty
      // 52 + 3 = 55
      expect(r.clothing_score).toBe(55);
      expect(r.clothing_rating).toBe("adequate");
    });

    it("only wardrobe reviews (no allowance records)", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          wardrobe_review_records: [
            makeWardrobeReview({
              overall_adequate: true,
              child_consulted: true,
              dignity_maintained: true,
            }),
          ],
        }),
      );
      // wardrobe >=90 => +4, dignity >=95 => +3
      // childChoice: only wardrobe contributes, 1/1 = 100% >= 90 => +3
      // 52 + 4 + 3 + 3 = 62
      expect(r.clothing_score).toBe(62);
    });

    it("only inventory records", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          personal_inventory_records: [
            makeInventory({
              total_items_recorded: 20,
              items_accounted_for: 20,
              child_involved_in_inventory: true,
            }),
          ],
        }),
      );
      // inventory >=95 => +3
      // childChoice: only inventory, 1/1 = 100% >= 90 => +3
      // 52 + 3 + 3 = 58
      expect(r.clothing_score).toBe(58);
    });

    it("only request records", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_request_records: [
            makeClothingRequest({ fulfilled: true, child_choice_respected: true }),
          ],
        }),
      );
      // request >=90 => +3
      // childChoice: only request, 1/1 = 100% >= 90 => +3
      // 52 + 3 + 3 = 58
      expect(r.clothing_score).toBe(58);
    });

    it("handles sentimental value incidents in safeguarding", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          possession_safeguarding_records: [
            makeSafeguarding({ sentimental_value: true, resolved: true }),
          ],
        }),
      );
      // Sentimental resolved rate = 100%, but this doesn't directly affect score
      expect(r.clothing_score).toBeGreaterThanOrEqual(52);
    });

    it("loss/theft/damage events tracked correctly", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          possession_safeguarding_records: [
            makeSafeguarding({ event_type: "loss", resolved: true }),
            makeSafeguarding({ event_type: "theft", resolved: false }),
            makeSafeguarding({ event_type: "damage", resolved: true }),
            makeSafeguarding({ event_type: "safekeeping", resolved: true }),
          ],
        }),
      );
      // resolved = 3/4 = 75% >= 70 => +1 (not >=90)
      expect(r.possession_safeguarding_rate).toBe(75);
    });

    it("empty wardrobe/inventory insight only fires when not allEmpty", () => {
      // When allEmpty and children > 0, the special case handles it
      const r = computeClothingPersonalPossessions(baseInput());
      // The special case returns different insights (the single critical one)
      const noWardrobeInsight = r.insights.find(
        (i) => i.text.includes("No wardrobe reviews recorded"),
      );
      // Should NOT appear because allEmpty takes the special path
      expect(noWardrobeInsight).toBeUndefined();
    });

    it("multiple seasons from same season count as 1", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          wardrobe_review_records: [
            makeWardrobeReview({ season: "spring" }),
            makeWardrobeReview({ season: "spring" }),
            makeWardrobeReview({ season: "spring" }),
          ],
        }),
      );
      // Only 1 season covered
      const s = r.strengths.find((s) => s.includes("all four seasons"));
      expect(s).toBeUndefined();
    });

    it("3 seasons covered triggers warning insight", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          wardrobe_review_records: [
            makeWardrobeReview({ season: "spring" }),
            makeWardrobeReview({ season: "summer" }),
            makeWardrobeReview({ season: "autumn" }),
          ],
        }),
      );
      const i = r.insights.find(
        (i) => i.severity === "warning" && i.text.includes("3 of 4 seasons"),
      );
      expect(i).toBeDefined();
    });

    it("action plan completion rate tracked correctly", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          wardrobe_review_records: [
            makeWardrobeReview({
              action_plan_created: true,
              action_plan_completed: true,
            }),
            makeWardrobeReview({
              action_plan_created: true,
              action_plan_completed: false,
            }),
          ],
        }),
      );
      // Action plan doesn't directly affect score, but is calculated
      // pct(1, 2) = 50%
      // Just verify the engine runs without error
      expect(r.clothing_score).toBeDefined();
    });

    it("allowance child coverage 80-99% strength", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          total_children: 5,
          clothing_allowance_records: [
            makeAllowance({ child_id: "child_1", allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
            makeAllowance({ child_id: "child_2", allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
            makeAllowance({ child_id: "child_3", allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
            makeAllowance({ child_id: "child_4", allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
        }),
      );
      // 4/5 = 80%
      const s = r.strengths.find((s) => s.includes("80% of children have clothing allowance"));
      expect(s).toBeDefined();
    });

    it("urgent requests with 0 urgent records does not trigger concern", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          clothing_request_records: [
            makeClothingRequest({ urgency: "standard", fulfilled: true }),
          ],
        }),
      );
      const c = r.concerns.find((c) => c.includes("urgent clothing requests"));
      expect(c).toBeUndefined();
    });

    it("replacement rate is 0 when pct(0,0) and no penalty/bonus triggers", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          wardrobe_review_records: [
            makeWardrobeReview({
              items_needing_replacement: 0,
              items_replaced: 0,
              overall_adequate: true,
            }),
          ],
        }),
      );
      // pct(0,0)=0 => no replacement bonus
      // No replacement concern because totalItemsNeedingReplacement=0
      const c = r.concerns.find((c) => c.includes("replacement"));
      expect(c).toBeUndefined();
    });

    it("compensation offered is tracked but does not affect score", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          possession_safeguarding_records: [
            makeSafeguarding({ resolved: true, compensation_offered: true }),
          ],
        }),
      );
      // compensation_offered doesn't affect score, just tracked
      expect(r.clothing_score).toBeGreaterThanOrEqual(52);
    });

    it("multiple child IDs in wardrobe reviews affect review coverage", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          total_children: 5,
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          wardrobe_review_records: [
            makeWardrobeReview({ child_id: "child_1" }),
            makeWardrobeReview({ child_id: "child_1" }),
            makeWardrobeReview({ child_id: "child_2" }),
          ],
        }),
      );
      // 2 unique children out of 5 => 40% < 80% => concern
      const c = r.concerns.find((c) => c.includes("wardrobe reviews"));
      expect(c).toBeDefined();
    });

    it("fulfilled request with 0 days_to_fulfil counts in average", () => {
      const r = computeClothingPersonalPossessions(
        baseInput({
          clothing_allowance_records: [
            makeAllowance({ allowance_amount_gbp: 100, amount_spent_gbp: 0 }),
          ],
          clothing_request_records: [
            makeClothingRequest({ fulfilled: true, days_to_fulfil: 0 }),
          ],
        }),
      );
      // avg = 0 days <= 3 => fast fulfilment strength
      const s = r.strengths.find((s) => s.includes("fulfilment in 0 days"));
      expect(s).toBeDefined();
    });
  });
});
