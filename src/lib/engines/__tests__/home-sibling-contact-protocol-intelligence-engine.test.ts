// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME SIBLING CONTACT PROTOCOL INTELLIGENCE ENGINE — TESTS
// CHR 2015 Reg 7: Facilitating contact between each child and their family.
// SCCIF: Experiences and progress of children.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeSiblingContactProtocol,
  type SiblingContactInput,
  type SiblingContactRecordInput,
} from "../home-sibling-contact-protocol-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeRecord(
  overrides: Partial<SiblingContactRecordInput> = {},
): SiblingContactRecordInput {
  return {
    id: "rec_1",
    child_id: "child_1",
    sibling_name: "Jamie",
    current_relationship_quality: "good",
    contact_frequency: "weekly",
    contact_type_count: 3,
    has_agreed_plan: true,
    has_child_preferences: true,
    has_sibling_preferences: true,
    risk_factor_count: 0,
    protective_factor_count: 2,
    supervision_required: false,
    has_transport_arrangements: true,
    location_count: 2,
    has_birthday_plan: true,
    has_christmas_plan: true,
    court_ordered: false,
    has_court_order_terms: false,
    recent_contact_count: 3,
    recent_contact_within_30_days: 2,
    review_date: "2025-05-20",
    has_reviewer: true,
    ...overrides,
  };
}

function baseInput(
  overrides: Partial<SiblingContactInput> = {},
): SiblingContactInput {
  return {
    today: "2025-06-15",
    total_children: 4,
    records: [
      makeRecord({ id: "rec_1", child_id: "child_1", sibling_name: "Jamie" }),
      makeRecord({ id: "rec_2", child_id: "child_2", sibling_name: "Sam" }),
      makeRecord({ id: "rec_3", child_id: "child_3", sibling_name: "Alex" }),
      makeRecord({ id: "rec_4", child_id: "child_4", sibling_name: "Taylor" }),
    ],
    ...overrides,
  };
}

// ── 1. Insufficient Data ───────────────────────────────────────────────────

describe("Insufficient data", () => {
  it("returns insufficient_data when total_children is 0", () => {
    const result = computeSiblingContactProtocol({
      today: "2025-06-15",
      total_children: 0,
      records: [],
    });
    expect(result.contact_rating).toBe("insufficient_data");
    expect(result.contact_score).toBe(0);
    expect(result.headline).toBe(
      "No data available for sibling contact intelligence analysis",
    );
    expect(result.total_protocols).toBe(0);
    expect(result.children_with_protocol_rate).toBe(0);
    expect(result.regular_contact_rate).toBe(0);
    expect(result.agreed_plan_rate).toBe(0);
    expect(result.child_preference_rate).toBe(0);
    expect(result.celebration_plan_rate).toBe(0);
    expect(result.review_current_rate).toBe(0);
    expect(result.strengths).toEqual([]);
    expect(result.concerns).toEqual([]);
    expect(result.recommendations).toEqual([]);
    expect(result.insights).toEqual([]);
  });

  it("returns insufficient_data when total_children is 0 even with stray records", () => {
    const result = computeSiblingContactProtocol({
      today: "2025-06-15",
      total_children: 0,
      records: [makeRecord()],
    });
    // total_children=0 guard triggers before records are examined
    expect(result.contact_rating).toBe("insufficient_data");
    expect(result.contact_score).toBe(0);
  });

  it("returns insufficient_data when children exist but records are empty", () => {
    // total_children > 0 but records=[] → total=0 → insufficient_data branch
    // score = 52 - 3 -1 -1 +0 -1 -2 = 44 → BUT rating overridden to insufficient_data
    const result = computeSiblingContactProtocol({
      today: "2025-06-15",
      total_children: 4,
      records: [],
    });
    expect(result.contact_rating).toBe("insufficient_data");
    expect(result.contact_score).toBe(44);
    expect(result.total_protocols).toBe(0);
  });

  it("populates concerns when children exist but no records", () => {
    const result = computeSiblingContactProtocol({
      today: "2025-06-15",
      total_children: 3,
      records: [],
    });
    expect(result.concerns).toContain(
      "No sibling contact protocols — children's right to family contact is not being formally facilitated",
    );
  });

  it("populates recommendations when children exist but no records", () => {
    const result = computeSiblingContactProtocol({
      today: "2025-06-15",
      total_children: 3,
      records: [],
    });
    expect(result.recommendations).toHaveLength(1);
    expect(result.recommendations[0].recommendation).toBe(
      "Create sibling contact protocols for every child and establish regular review cycles",
    );
    expect(result.recommendations[0].urgency).toBe("immediate");
    expect(result.recommendations[0].rank).toBe(1);
    expect(result.recommendations[0].regulatory_ref).toBe("CHR 2015 Reg 7");
  });

  it("populates critical insight when children exist but no records", () => {
    const result = computeSiblingContactProtocol({
      today: "2025-06-15",
      total_children: 2,
      records: [],
    });
    expect(result.insights).toContainEqual({
      text: "No sibling contact records means Ofsted cannot verify how the home facilitates family relationships",
      severity: "critical",
    });
  });
});

// ── 2. Outstanding Scenario ────────────────────────────────────────────────

describe("Outstanding scenario", () => {
  it("achieves outstanding rating (score 82) with all modifiers maxed", () => {
    // 4 children, 4 unique child_ids → coverage = 100% → +6
    // all weekly → regular_contact_rate = 100% → +5
    // all has_agreed_plan → 100% → +5
    // all has_child_preferences → 100% → +5
    // all birthday+christmas → celebrationPlanRate = 100% → +4
    // all reviews within 90 days → 100% → +5
    // Score: 52+6+5+5+5+4+5 = 82
    const result = computeSiblingContactProtocol(baseInput());
    expect(result.contact_score).toBe(82);
    expect(result.contact_rating).toBe("outstanding");
    expect(result.headline).toBe(
      "Outstanding sibling contact — children's family relationships are proactively nurtured and celebrated",
    );
  });

  it("has all six strengths when outstanding", () => {
    const result = computeSiblingContactProtocol(baseInput());
    expect(result.strengths).toHaveLength(6);
    expect(result.strengths).toContain(
      "Sibling contact protocols are in place for the majority of children — the home proactively facilitates family bonds",
    );
    expect(result.strengths).toContain(
      "Regular contact is maintained — children see their siblings frequently through structured arrangements",
    );
    expect(result.strengths).toContain(
      "Contact plans are formally agreed and documented — expectations are clear for all parties",
    );
    expect(result.strengths).toContain(
      "Children's own preferences about sibling contact are consistently captured and respected",
    );
    expect(result.strengths).toContain(
      "Birthday and Christmas plans ensure siblings share important milestones together",
    );
    expect(result.strengths).toContain(
      "Sibling contact arrangements are reviewed regularly — the home adapts to changing circumstances",
    );
  });

  it("has no concerns when outstanding", () => {
    const result = computeSiblingContactProtocol(baseInput());
    expect(result.concerns).toEqual([]);
  });

  it("has no recommendations when outstanding", () => {
    const result = computeSiblingContactProtocol(baseInput());
    expect(result.recommendations).toEqual([]);
  });

  it("rates correctly at score exactly 80", () => {
    // Need score = 80 → outstanding
    // Let's reduce celebration to +1 (50-79%) and review to +2 (50-79%)
    // 52+6+5+5+5+1+5=79 — too low
    // Let's try: reduce celebration to +1 → 52+6+5+5+5+1+5=79 nope
    // Let's try: all max but celebration at +1 → 79
    // Need exactly 80 → reduce one of the +5 to +2 instead.
    // 52+6+5+5+5+4+2=79 still 79.
    // Actually: 52+6+5+5+5+4+5=82, so reduce just one +5 to +2 → 79. Not 80.
    // 82-2=80: reduce one +5 to +3. Can't, no modifier gives +3.
    // 82-2=80: reduce the +4 celebration to +2. No, +4→+1 is -3 = 79.
    // Actually let's just get 80: 52+6+5+5+2+4+5=79. No.
    // 52+6+5+5+5+4+5=82. Need to lose 2. Reduce one +5 to +2, lose 3 = 79. Or reduce +6 to +2, lose 4 = 78.
    // Can't hit exactly 80 with these modifier steps. Let's try:
    // 52+6+5+2+5+4+5=79. 52+6+5+5+5+4+2=79. 52+6+5+5+5+1+5=79.
    // 52+6+5+5+5+4+5=82, 82-1=81 would need a +3 somewhere. Not possible.
    // So 80 is not naturally reachable. Score 82 is outstanding, 79 is good.
    // We can test at score=82 (outstanding) and 79 (good). Score 80 achieved by clamping won't happen naturally.
    // Instead test toRating boundary: >= 80 is outstanding. 82 hits it; 79 would be good.
    // This is already covered. Skip exact-80 unless we find a combo.
    // Actually, we can do it with partial coverage:
    // 3 unique children out of 4 → pct(3,4)=75% → +2 (>=50% but <80%)
    // rest maxed: 52+2+5+5+5+4+5=78
    // Hmm. 2 unique children out of 4 → 50% → +2. Same.
    // Actually coverage >=80% gives +6. coverage 79% gives +2. Jump is 4.
    // Let's try: reduce child_preferences slightly. 3 out of 4 = 75% → +2. 52+6+5+5+2+4+5=79.
    // 4 out of 4 = 100% → +5. So no way to get +3 or +4 from child_preferences.
    // The modifier steps are discrete. 82 is the max. Next below is 79, 78, etc.
    // Let's just verify the boundary: score 82 = outstanding, score 79 = good.
    // Already tested above. Mark this test differently.

    // We CAN get 80 by having the score clamp. But natural scores jump.
    // The closest we can manufacture is 82 (outstanding) and 79 (good).
    // Test that score 82 is outstanding (already done) and 79 is good.
    // Let's test 79 here to confirm the boundary.
    // 3 out of 4 child prefs = 75% → +2 instead of +5 → score=79
    const input = baseInput({
      records: [
        makeRecord({ id: "r1", child_id: "child_1" }),
        makeRecord({ id: "r2", child_id: "child_2" }),
        makeRecord({ id: "r3", child_id: "child_3" }),
        makeRecord({
          id: "r4",
          child_id: "child_4",
          has_child_preferences: false,
        }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    // childPreferenceRate = pct(3,4)=75% → +2
    // 52+6+5+5+2+4+5=79
    expect(result.contact_score).toBe(79);
    expect(result.contact_rating).toBe("good");
  });
});

// ── 3. Good Scenario ───────────────────────────────────────────────────────

describe("Good scenario", () => {
  it("scores in good range with slightly reduced metrics", () => {
    // 3 of 4 children covered → 75% → +2
    // all weekly → 100% → +5
    // all agreed → 100% → +5
    // all child prefs → 100% → +5
    // all celebrations → 100% → +4
    // all reviews current → 100% → +5
    // 52+2+5+5+5+4+5=78 → good
    const input = baseInput({
      records: [
        makeRecord({ id: "r1", child_id: "child_1" }),
        makeRecord({ id: "r2", child_id: "child_2" }),
        makeRecord({ id: "r3", child_id: "child_3" }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    expect(result.contact_score).toBe(78);
    expect(result.contact_rating).toBe("good");
    expect(result.headline).toBe(
      "Good sibling contact arrangements with regular visits and clear plans in place",
    );
  });

  it("scores 65 at the lower boundary of good", () => {
    // Need score=65. Start from 52.
    // coverage: 2 unique of 4 = 50% → +2
    // regular contact: 2 of 4 weekly, 2 "less_than_monthly" → pct(2,4)=50% → +2
    // agreed plans: 3 of 4 → 75% → +2
    // child prefs: 3 of 4 → 75% → +2
    // celebrations: 2 of 4 birthday, 2 of 4 christmas → pct(4,8)=50% → +1
    // review: 2 of 4 current → 50% → +2
    // 52+2+2+2+2+1+2=63. Hmm not enough.
    // Try: coverage +6 (4 of 4 children, 80% → need 4 unique from 4 total_children with 4 records)
    // +6, regular +2, agreed +2, child_prefs +2, celebrations +1, reviews -3 (<30%)
    // 52+6+2+2+2+1-3=62. Not 65.
    // Better: coverage +6, regular +5, agreed +2, child_prefs -4(<30%), celebrations -4(<20%), reviews +5
    // 52+6+5+2-4-4+5=62. No.
    // Let me try: coverage +6, regular +2, agreed +2, child_prefs +2, celebrations +4, reviews -3
    // 52+6+2+2+2+4-3=65. Yes!
    // coverage: 4 unique of 4 → 100% → +6
    // regular: 2 of 4 weekly, 2 "none" → pct(2,4)=50% → +2
    // agreed: 3 of 4 → 75% → +2
    // child_prefs: 3 of 4 → 75% → +2
    // celebrations: all birthday + all christmas → 100% → +4
    // reviews: 1 of 4 current → 25% → <30% → -3
    const input = baseInput({
      records: [
        makeRecord({
          id: "r1",
          child_id: "child_1",
          review_date: "2025-01-01",
        }),
        makeRecord({
          id: "r2",
          child_id: "child_2",
          contact_frequency: "none",
          has_agreed_plan: false,
          has_child_preferences: false,
          review_date: "2025-01-01",
        }),
        makeRecord({
          id: "r3",
          child_id: "child_3",
          contact_frequency: "none",
          review_date: "2025-01-01",
        }),
        makeRecord({ id: "r4", child_id: "child_4" }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    // coverage = pct(4,4)=100% → +6
    // regularContact: r1=weekly, r2=none, r3=none, r4=weekly → 2 of 4 = 50% → +2
    // agreed: r1=true, r2=false, r3=true, r4=true → 3 of 4 = 75% → +2
    // childPrefs: r1=true, r2=false, r3=true, r4=true → 3 of 4 = 75% → +2
    // celebrations: all have birthday+christmas → pct(8,8)=100% → +4
    // reviews: r1="2025-01-01" → daysSince=(Jun15-Jan1)=165 days >90, not current
    //          r2="2025-01-01" → same
    //          r3="2025-01-01" → same
    //          r4="2025-05-20" → daysSince=26 → current
    //          1 of 4 = 25% → <30% → -3
    // Score: 52+6+2+2+2+4-3=65
    expect(result.contact_score).toBe(65);
    expect(result.contact_rating).toBe("good");
  });

  it("scores 79 at the upper boundary of good", () => {
    // 3 of 4 child_prefs → 75% → +2
    // rest maxed → 52+6+5+5+2+4+5=79
    const input = baseInput({
      records: [
        makeRecord({ id: "r1", child_id: "child_1" }),
        makeRecord({ id: "r2", child_id: "child_2" }),
        makeRecord({ id: "r3", child_id: "child_3" }),
        makeRecord({
          id: "r4",
          child_id: "child_4",
          has_child_preferences: false,
        }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    expect(result.contact_score).toBe(79);
    expect(result.contact_rating).toBe("good");
  });
});

// ── 4. Adequate Scenario ───────────────────────────────────────────────────

describe("Adequate scenario", () => {
  it("scores in adequate range with mixed quality", () => {
    // coverage: 2 unique of 4 → 50% → +2
    // regular: 1 of 2 weekly → 50% → +2
    // agreed: 1 of 2 → 50% → <60% → no bonus, no penalty (between 30 and 60)
    // child_prefs: 1 of 2 → 50% → <60% → no bonus, no penalty
    // celebrations: 1 birthday + 1 christmas of 4 total → pct(2,4)=50% → +1
    // reviews: 1 of 2 current → 50% → +2
    // 52+2+2+0+0+1+2=59 → adequate
    const input = baseInput({
      records: [
        makeRecord({ id: "r1", child_id: "child_1" }),
        makeRecord({
          id: "r2",
          child_id: "child_2",
          contact_frequency: "none",
          has_agreed_plan: false,
          has_child_preferences: false,
          has_birthday_plan: false,
          has_christmas_plan: false,
          review_date: "2025-01-01",
        }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    expect(result.contact_score).toBe(59);
    expect(result.contact_rating).toBe("adequate");
    expect(result.headline).toBe(
      "Sibling contact exists but frequency, planning or child voice needs strengthening",
    );
  });

  it("scores 45 at the lower boundary of adequate", () => {
    // Need score=45.
    // coverage: 1 of 4 unique → 25% → <30% → -5
    // regular: 1 of 1 weekly → 100% → +5
    // agreed: 1 of 1 → 100% → +5
    // child_prefs: 0 of 1 → 0% → <30% → -4
    // celebrations: 0 of 2 → 0% → <20% → -4
    // reviews: 0 of 1 → 0% → <30% → -3
    // 52-5+5+5-4-4-3=46. Not 45.
    // Try: coverage -5, regular +2, agreed +2, child_prefs -4, celebrations -4, reviews +2
    // 52-5+2+2-4-4+2=45. Yes!
    // coverage: 1 unique of 4 = 25% → -5
    // regular: 2 of 3 (weekly or monthly) = pct(2,3)=67% → >=50% → +2
    // agreed: 2 of 3 = pct(2,3)=67% → >=60% → +2
    // child_prefs: 0 of 3 = 0% → <30% → -4
    // celebrations: 0 of 6 → 0% → <20% → -4
    // reviews: 2 of 3 current → pct(2,3)=67% → >=50% → +2
    const input = baseInput({
      records: [
        makeRecord({
          id: "r1",
          child_id: "child_1",
          has_child_preferences: false,
          has_birthday_plan: false,
          has_christmas_plan: false,
        }),
        makeRecord({
          id: "r2",
          child_id: "child_1",
          sibling_name: "Pat",
          contact_frequency: "monthly",
          has_child_preferences: false,
          has_birthday_plan: false,
          has_christmas_plan: false,
          review_date: "2025-01-01",
        }),
        makeRecord({
          id: "r3",
          child_id: "child_1",
          sibling_name: "Jo",
          contact_frequency: "none",
          has_agreed_plan: false,
          has_child_preferences: false,
          has_birthday_plan: false,
          has_christmas_plan: false,
        }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    // uniqueChildren = 1 → pct(1,4)=25% → <30% → -5
    // regularContact: r1=weekly, r2=monthly, r3=none → 2 of 3 → pct(2,3)=67% → +2
    // agreed: r1=true, r2=true, r3=false → 2 of 3 → pct(2,3)=67% → +2
    // childPrefs: all false → 0% → -4
    // celebrations: all false → pct(0,6)=0% → -4
    // reviews: r1="2025-05-20" → 26 days → current
    //          r2="2025-01-01" → 165 days → not current
    //          r3="2025-05-20" → 26 days → current
    //          → 2 of 3 → pct(2,3)=67% → +2
    // 52-5+2+2-4-4+2=45
    expect(result.contact_score).toBe(45);
    expect(result.contact_rating).toBe("adequate");
  });

  it("scores 64 at the upper boundary of adequate", () => {
    // Need score=64.
    // coverage: +6, regular +2, agreed +2, child_prefs +2, celebrations +4, reviews -3 → 52+6+2+2+2+4-3=65. One too many.
    // coverage +6, regular +2, agreed +2, child_prefs +2, celebrations +1, reviews -3 → 52+6+2+2+2+1-3=62. Too few.
    // coverage +6, regular +2, agreed +5, child_prefs -4, celebrations +4, reviews -3 → 52+6+2+5-4+4-3=62. No.
    // coverage +2, regular +5, agreed +5, child_prefs +2, celebrations +1, reviews -3 → 52+2+5+5+2+1-3=64. Yes!
    // coverage: 2 unique of 4 = 50% → +2
    // regular: 4 of 4 weekly → 100% → +5
    // agreed: 4 of 4 → 100% → +5
    // child_prefs: 3 of 4 → 75% → +2
    // celebrations: 2 birthday + 0 christmas of 8 → pct(2,8)=25% → <50% but >=20% → no bonus, no penalty. Wait: 25% is >=20% so not <20%, and <50% so not >=50%. So no adjustment → 0.
    // Hmm, that would give 52+2+5+5+2+0-3=63. Off by 1.
    // Let me try: celebrations: 3 of 8 → pct(3,8)=38% → still no adjustment → 0.
    // 4 of 8 → 50% → +1.
    // So: 52+2+5+5+2+1-3=64. Need celebrations at 50%.
    // 4 birthday of 4 + 0 christmas → pct(4,8)=50% → +1
    // reviews: 1 of 4 current → 25% → <30% → -3
    const input = baseInput({
      records: [
        makeRecord({
          id: "r1",
          child_id: "child_1",
          has_christmas_plan: false,
          review_date: "2025-01-01",
        }),
        makeRecord({
          id: "r2",
          child_id: "child_1",
          sibling_name: "Pat",
          has_child_preferences: false,
          has_christmas_plan: false,
          review_date: "2025-01-01",
        }),
        makeRecord({
          id: "r3",
          child_id: "child_2",
          has_christmas_plan: false,
          review_date: "2025-01-01",
        }),
        makeRecord({
          id: "r4",
          child_id: "child_2",
          sibling_name: "Lee",
          has_christmas_plan: false,
        }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    // uniqueChildren = {child_1, child_2} = 2 → pct(2,4)=50% → +2
    // regular: all weekly → 100% → +5
    // agreed: all true → 100% → +5
    // childPrefs: r1=true, r2=false, r3=true, r4=true → 3 of 4 = 75% → +2
    // celebrations: 4 birthday + 0 christmas → pct(4,8)=50% → +1
    // reviews: r1=2025-01-01(165d), r2=2025-01-01(165d), r3=2025-01-01(165d), r4=2025-05-20(26d) → 1 of 4 =25% → -3
    // 52+2+5+5+2+1-3=64
    expect(result.contact_score).toBe(64);
    expect(result.contact_rating).toBe("adequate");
  });
});

// ── 5. Inadequate Scenario ─────────────────────────────────────────────────

describe("Inadequate scenario", () => {
  it("scores inadequate with poor metrics across the board", () => {
    // 1 unique child of 4 → 25% → -5
    // contact_frequency=none → 0% → <30% → -5
    // no agreed plans → 0% → <30% → -4
    // no child prefs → 0% → <30% → -4
    // no celebrations → 0% → <20% → -4
    // review old → 0% → <30% → -3
    // 52-5-5-4-4-4-3=27
    const input = baseInput({
      records: [
        makeRecord({
          id: "r1",
          child_id: "child_1",
          contact_frequency: "none",
          has_agreed_plan: false,
          has_child_preferences: false,
          has_birthday_plan: false,
          has_christmas_plan: false,
          review_date: "2024-01-01",
        }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    expect(result.contact_score).toBe(27);
    expect(result.contact_rating).toBe("inadequate");
    expect(result.headline).toBe(
      "Sibling contact is inadequate — children are not being supported to maintain family bonds",
    );
  });

  it("scores 44 at the upper boundary of inadequate", () => {
    // Need score=44.
    // coverage: -5, regular: +2, agreed: +2, child_prefs: -4, celebrations: -4, reviews: +2
    // 52-5+2+2-4-4+2=45 → that's adequate.
    // coverage: -5, regular: +2, agreed: +2, child_prefs: -4, celebrations: -4, reviews: -3
    // 52-5+2+2-4-4-3=40. Too low.
    // coverage: -5, regular: +5, agreed: -4, child_prefs: -4, celebrations: +4, reviews: -3
    // 52-5+5-4-4+4-3=45. Nope.
    // coverage: -5, regular: +2, agreed: +5, child_prefs: -4, celebrations: -4, reviews: -3
    // 52-5+2+5-4-4-3=43.
    // coverage: -5, regular: +2, agreed: +5, child_prefs: -4, celebrations: -4, reviews: -3 → 43
    // coverage: -5, regular: +2, agreed: +5, child_prefs: -4, celebrations: -1, reviews: -3 → 46. Wait celebration -1 isn't an option.
    // Let me reconsider. With celebrations between 20% and 50%: no adjustment (0).
    // coverage: -5, regular: +2, agreed: +5, child_prefs: -4, celebrations: 0, reviews: -3 → 52-5+2+5-4+0-3=47. Too high.
    // coverage: -5, regular: +2, agreed: +2, child_prefs: -4, celebrations: 0, reviews: -3 → 52-5+2+2-4+0-3=44. Yes!
    // coverage: 1 unique of 4 = 25% → -5
    // regular: need 50-79%. 1 of 2 weekly → pct(1,2)=50% → +2
    // agreed: need 60-89%. 2 of 3 → pct(2,3)=67% → +2. Wait, need 2 records now.
    // Actually, I used 2 records above for regular. Let me use 2 records:
    // regular: 1 of 2 weekly, 1 none → pct(1,2)=50% → +2
    // agreed: 2 of 2 → 100% → >=90% → +5. Hmm I need +2 for agreed.
    // agreed: 1 of 2 → 50% → <60% → 0. No, need +2.
    // +2 for agreed requires >=60% and <90%. With 2 records: 1 of 2 = 50% is <60% → 0. 2 of 2 = 100% → +5.
    // Need 3 records for agreed: 2 of 3 = 67% → +2.
    // OK 3 records, 1 unique child:
    // coverage: pct(1,4)=25% → -5
    // regular: 2 of 3 weekly → pct(2,3)=67% → +2
    // agreed: 2 of 3 → 67% → +2
    // child_prefs: 0 of 3 → 0% → -4
    // celebrations: need 20-49%. 1 of 6 → pct(1,6)=17% → <20% → -4. pct(2,6)=33% → 0. Need 0.
    // So celebrations with 2 of 6 → 33% → 0.
    // reviews: 0 of 3 current → 0% → -3
    // 52-5+2+2-4+0-3=44. Yes!
    const input = baseInput({
      records: [
        makeRecord({
          id: "r1",
          child_id: "child_1",
          has_child_preferences: false,
          has_birthday_plan: false,
          has_christmas_plan: false,
          review_date: "2024-01-01",
        }),
        makeRecord({
          id: "r2",
          child_id: "child_1",
          sibling_name: "Sam",
          contact_frequency: "none",
          has_agreed_plan: false,
          has_child_preferences: false,
          has_christmas_plan: false,
          review_date: "2024-01-01",
        }),
        makeRecord({
          id: "r3",
          child_id: "child_1",
          sibling_name: "Jo",
          has_child_preferences: false,
          has_birthday_plan: false,
          has_christmas_plan: false,
          review_date: "2024-01-01",
        }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    // uniqueChildren = {child_1} → pct(1,4)=25% → -5
    // regular: r1=weekly, r2=none, r3=weekly → 2 of 3 → pct(2,3)=67% → +2
    // agreed: r1=true, r2=false, r3=true → 2 of 3 → 67% → +2
    // childPrefs: all false → 0% → -4
    // celebrations: r1(0,0) + r2(1,0) + r3(0,1) → birthday: r1=false,r2=true,r3=false → 1 birthday
    //   Wait, let me recheck. r1: has_birthday_plan=false, has_christmas_plan=false
    //   r2: has_birthday_plan=true (default), has_christmas_plan=false
    //   r3: has_birthday_plan=false, has_christmas_plan=false
    //   Hmm r2 birthday defaults to true. r3 christmas: I set false.
    //   withBirthdayPlan=1 (r2), withChristmasPlan=0 → pct(1,6)=17% → <20% → -4
    //   That gives 52-5+2+2-4-4-3=40. Not 44.
    //   I need celebrations to be 0 (between 20% and 50%). Need 2 of 6 (33%).
    //   So r2 keeps birthday=true and I need one more. Let r3 keep christmas=true (default).
    //   r3 overrides: has_birthday_plan:false, has_christmas_plan not overridden → true
    //   withBirthdayPlan=1(r2), withChristmasPlan=1(r3) → pct(2,6)=33% → 0. Good.
    // Actually let me fix r3:
    const input2 = baseInput({
      records: [
        makeRecord({
          id: "r1",
          child_id: "child_1",
          has_child_preferences: false,
          has_birthday_plan: false,
          has_christmas_plan: false,
          review_date: "2024-01-01",
        }),
        makeRecord({
          id: "r2",
          child_id: "child_1",
          sibling_name: "Sam",
          contact_frequency: "none",
          has_agreed_plan: false,
          has_child_preferences: false,
          has_christmas_plan: false,
          review_date: "2024-01-01",
        }),
        makeRecord({
          id: "r3",
          child_id: "child_1",
          sibling_name: "Jo",
          has_child_preferences: false,
          has_birthday_plan: false,
          review_date: "2024-01-01",
        }),
      ],
    });
    const result2 = computeSiblingContactProtocol(input2);
    // celebrations: r1(false,false) r2(true,false) r3(false,true) → bday=1, xmas=1 → pct(2,6)=33% → 0
    // 52-5+2+2-4+0-3=44
    expect(result2.contact_score).toBe(44);
    expect(result2.contact_rating).toBe("inadequate");
  });

  it("scores very low with worst possible data", () => {
    // 1 record, 1 unique of 4 → 25% → -5
    // none frequency → 0% <30% → -5
    // no agreed → 0% <30% → -4
    // no child_prefs → 0% <30% → -4
    // no celebrations → 0% <20% → -4
    // review stale → 0% <30% → -3
    // 52-5-5-4-4-4-3=27
    const input = baseInput({
      records: [
        makeRecord({
          id: "r1",
          child_id: "child_1",
          contact_frequency: "none",
          has_agreed_plan: false,
          has_child_preferences: false,
          has_birthday_plan: false,
          has_christmas_plan: false,
          review_date: "2024-01-01",
        }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    expect(result.contact_score).toBe(27);
    expect(result.contact_rating).toBe("inadequate");
  });
});

// ── 6. Modifier 1: Coverage ────────────────────────────────────────────────

describe("Modifier 1 — coverage (children with protocol rate)", () => {
  it("+6 when coverage >= 80%", () => {
    // 4 unique of 4 → 100% → +6
    const result = computeSiblingContactProtocol(baseInput());
    expect(result.children_with_protocol_rate).toBe(100);
    // Already tested as 82 (outstanding)
    expect(result.contact_score).toBe(82);
  });

  it("+2 when coverage >= 50% but < 80%", () => {
    // 2 unique of 4 → 50% → +2
    // rest maxed → 52+2+5+5+5+4+5=78
    const input = baseInput({
      records: [
        makeRecord({ id: "r1", child_id: "child_1" }),
        makeRecord({ id: "r2", child_id: "child_2" }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    expect(result.children_with_protocol_rate).toBe(50);
    expect(result.contact_score).toBe(78);
  });

  it("no adjustment when coverage >= 30% but < 50%", () => {
    // 2 unique of 5 → pct(2,5)=40% → no adjustment (>=30% but <50%)
    // rest maxed → 52+0+5+5+5+4+5=76
    const input: SiblingContactInput = {
      today: "2025-06-15",
      total_children: 5,
      records: [
        makeRecord({ id: "r1", child_id: "child_1" }),
        makeRecord({ id: "r2", child_id: "child_2" }),
      ],
    };
    const result = computeSiblingContactProtocol(input);
    expect(result.children_with_protocol_rate).toBe(40);
    expect(result.contact_score).toBe(76);
  });

  it("-5 when coverage < 30%", () => {
    // 1 unique of 4 → 25% → -5
    // rest maxed → 52-5+5+5+5+4+5=71
    const input = baseInput({
      records: [makeRecord({ id: "r1", child_id: "child_1" })],
    });
    const result = computeSiblingContactProtocol(input);
    expect(result.children_with_protocol_rate).toBe(25);
    expect(result.contact_score).toBe(71);
  });

  it("-3 when total records is 0 (no records)", () => {
    // Score: 52-3-1-1+0-1-2=44
    const result = computeSiblingContactProtocol({
      today: "2025-06-15",
      total_children: 4,
      records: [],
    });
    expect(result.contact_score).toBe(44);
  });

  it("coverage at exactly 80% gives +6", () => {
    // 4 unique of 5 → pct(4,5)=80% → +6
    const input: SiblingContactInput = {
      today: "2025-06-15",
      total_children: 5,
      records: [
        makeRecord({ id: "r1", child_id: "child_1" }),
        makeRecord({ id: "r2", child_id: "child_2" }),
        makeRecord({ id: "r3", child_id: "child_3" }),
        makeRecord({ id: "r4", child_id: "child_4" }),
      ],
    };
    const result = computeSiblingContactProtocol(input);
    expect(result.children_with_protocol_rate).toBe(80);
    expect(result.contact_score).toBe(82);
  });

  it("coverage at exactly 50% gives +2", () => {
    // 2 unique of 4 → pct(2,4)=50% → +2
    const input = baseInput({
      records: [
        makeRecord({ id: "r1", child_id: "child_1" }),
        makeRecord({ id: "r2", child_id: "child_2" }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    expect(result.children_with_protocol_rate).toBe(50);
    // 52+2+5+5+5+4+5=78
    expect(result.contact_score).toBe(78);
  });

  it("coverage at 29% triggers -5", () => {
    // Need pct(x, total_children) < 30.
    // 2 unique of 7 → pct(2,7)=29% → -5
    const input: SiblingContactInput = {
      today: "2025-06-15",
      total_children: 7,
      records: [
        makeRecord({ id: "r1", child_id: "child_1" }),
        makeRecord({ id: "r2", child_id: "child_2" }),
      ],
    };
    const result = computeSiblingContactProtocol(input);
    expect(result.children_with_protocol_rate).toBe(29);
    // 52-5+5+5+5+4+5=71
    expect(result.contact_score).toBe(71);
  });
});

// ── 7. Modifier 2: Regular Contact ─────────────────────────────────────────

describe("Modifier 2 — regular contact frequency", () => {
  it("+5 when regular contact rate >= 80%", () => {
    // all 4 weekly → 100% → +5
    const result = computeSiblingContactProtocol(baseInput());
    expect(result.regular_contact_rate).toBe(100);
  });

  it("+2 when regular contact rate >= 50% but < 80%", () => {
    // 2 of 4 weekly, 2 less_than_monthly → pct(2,4)=50% → +2
    const input = baseInput({
      records: [
        makeRecord({ id: "r1", child_id: "child_1" }),
        makeRecord({ id: "r2", child_id: "child_2" }),
        makeRecord({
          id: "r3",
          child_id: "child_3",
          contact_frequency: "less_than_monthly",
        }),
        makeRecord({
          id: "r4",
          child_id: "child_4",
          contact_frequency: "less_than_monthly",
        }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    expect(result.regular_contact_rate).toBe(50);
    // 52+6+2+5+5+4+5=79
    expect(result.contact_score).toBe(79);
  });

  it("no adjustment when regular contact rate >= 30% but < 50%", () => {
    // 2 of 5 regular → pct(2,5)=40% → no adjustment
    const input: SiblingContactInput = {
      today: "2025-06-15",
      total_children: 5,
      records: [
        makeRecord({ id: "r1", child_id: "child_1" }),
        makeRecord({ id: "r2", child_id: "child_2" }),
        makeRecord({
          id: "r3",
          child_id: "child_3",
          contact_frequency: "less_than_monthly",
        }),
        makeRecord({
          id: "r4",
          child_id: "child_4",
          contact_frequency: "none",
        }),
        makeRecord({
          id: "r5",
          child_id: "child_5",
          contact_frequency: "none",
        }),
      ],
    };
    const result = computeSiblingContactProtocol(input);
    expect(result.regular_contact_rate).toBe(40);
    // coverage: 5 of 5 → 100% → +6
    // regular: 40% → 0
    // agreed: 5 of 5 → 100% → +5
    // child_prefs: 5 of 5 → 100% → +5
    // celebrations: all → 100% → +4
    // reviews: all current → 100% → +5
    // 52+6+0+5+5+4+5=77
    expect(result.contact_score).toBe(77);
  });

  it("-5 when regular contact rate < 30%", () => {
    // 1 of 4 weekly, 3 none → pct(1,4)=25% → -5
    const input = baseInput({
      records: [
        makeRecord({ id: "r1", child_id: "child_1" }),
        makeRecord({
          id: "r2",
          child_id: "child_2",
          contact_frequency: "none",
        }),
        makeRecord({
          id: "r3",
          child_id: "child_3",
          contact_frequency: "none",
        }),
        makeRecord({
          id: "r4",
          child_id: "child_4",
          contact_frequency: "none",
        }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    expect(result.regular_contact_rate).toBe(25);
    // 52+6-5+5+5+4+5=72
    expect(result.contact_score).toBe(72);
  });

  it("-1 when total records is 0", () => {
    const result = computeSiblingContactProtocol({
      today: "2025-06-15",
      total_children: 4,
      records: [],
    });
    // modifier 2 contributes -1 out of total score 44
    expect(result.contact_score).toBe(44);
  });

  it("counts fortnightly and monthly as regular contact", () => {
    // 2 fortnightly + 2 monthly = 4 of 4 → 100% → +5
    const input = baseInput({
      records: [
        makeRecord({
          id: "r1",
          child_id: "child_1",
          contact_frequency: "fortnightly",
        }),
        makeRecord({
          id: "r2",
          child_id: "child_2",
          contact_frequency: "fortnightly",
        }),
        makeRecord({
          id: "r3",
          child_id: "child_3",
          contact_frequency: "monthly",
        }),
        makeRecord({
          id: "r4",
          child_id: "child_4",
          contact_frequency: "monthly",
        }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    expect(result.regular_contact_rate).toBe(100);
    // 52+6+5+5+5+4+5=82
    expect(result.contact_score).toBe(82);
  });

  it("does not count less_than_monthly as regular", () => {
    const input = baseInput({
      records: [
        makeRecord({
          id: "r1",
          child_id: "child_1",
          contact_frequency: "less_than_monthly",
        }),
        makeRecord({
          id: "r2",
          child_id: "child_2",
          contact_frequency: "less_than_monthly",
        }),
        makeRecord({
          id: "r3",
          child_id: "child_3",
          contact_frequency: "less_than_monthly",
        }),
        makeRecord({
          id: "r4",
          child_id: "child_4",
          contact_frequency: "less_than_monthly",
        }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    expect(result.regular_contact_rate).toBe(0);
  });
});

// ── 8. Modifier 3: Agreed Plans ────────────────────────────────────────────

describe("Modifier 3 — agreed contact plans", () => {
  it("+5 when agreed plan rate >= 90%", () => {
    // all 4 have agreed plans → 100% → +5
    const result = computeSiblingContactProtocol(baseInput());
    expect(result.agreed_plan_rate).toBe(100);
  });

  it("+2 when agreed plan rate >= 60% but < 90%", () => {
    // 3 of 4 → 75% → +2
    const input = baseInput({
      records: [
        makeRecord({ id: "r1", child_id: "child_1" }),
        makeRecord({ id: "r2", child_id: "child_2" }),
        makeRecord({ id: "r3", child_id: "child_3" }),
        makeRecord({
          id: "r4",
          child_id: "child_4",
          has_agreed_plan: false,
        }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    expect(result.agreed_plan_rate).toBe(75);
    // 52+6+5+2+5+4+5=79
    expect(result.contact_score).toBe(79);
  });

  it("no adjustment when agreed plan rate >= 30% but < 60%", () => {
    // 2 of 4 → 50% → 0
    const input = baseInput({
      records: [
        makeRecord({ id: "r1", child_id: "child_1" }),
        makeRecord({ id: "r2", child_id: "child_2" }),
        makeRecord({
          id: "r3",
          child_id: "child_3",
          has_agreed_plan: false,
        }),
        makeRecord({
          id: "r4",
          child_id: "child_4",
          has_agreed_plan: false,
        }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    expect(result.agreed_plan_rate).toBe(50);
    // 52+6+5+0+5+4+5=77
    expect(result.contact_score).toBe(77);
  });

  it("-4 when agreed plan rate < 30%", () => {
    // 1 of 4 → 25% → -4
    const input = baseInput({
      records: [
        makeRecord({ id: "r1", child_id: "child_1" }),
        makeRecord({
          id: "r2",
          child_id: "child_2",
          has_agreed_plan: false,
        }),
        makeRecord({
          id: "r3",
          child_id: "child_3",
          has_agreed_plan: false,
        }),
        makeRecord({
          id: "r4",
          child_id: "child_4",
          has_agreed_plan: false,
        }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    expect(result.agreed_plan_rate).toBe(25);
    // 52+6+5-4+5+4+5=73
    expect(result.contact_score).toBe(73);
  });

  it("-1 when total records is 0", () => {
    const result = computeSiblingContactProtocol({
      today: "2025-06-15",
      total_children: 2,
      records: [],
    });
    // 52-3-1-1+0-1-2=44
    expect(result.contact_score).toBe(44);
  });

  it("boundary: exactly 90% gives +5", () => {
    // Need pct(x,n)=90. 9 of 10 → 90%.
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({
        id: `r${i}`,
        child_id: `child_${i % 4}`,
        has_agreed_plan: i < 9,
      }),
    );
    const input: SiblingContactInput = {
      today: "2025-06-15",
      total_children: 4,
      records,
    };
    const result = computeSiblingContactProtocol(input);
    expect(result.agreed_plan_rate).toBe(90);
    // coverage: 4 unique of 4 → 100% → +6
    // regular: 10 of 10 weekly → 100% → +5
    // agreed: 90% → +5
    // child_prefs: 10 of 10 → 100% → +5
    // celebrations: 10 of 10 birthday + 10 of 10 christmas → 100% → +4
    // reviews: all "2025-05-20" → 26 days → all current → 100% → +5
    // 52+6+5+5+5+4+5=82
    expect(result.contact_score).toBe(82);
  });

  it("boundary: exactly 60% gives +2", () => {
    // 3 of 5 → 60%
    const input: SiblingContactInput = {
      today: "2025-06-15",
      total_children: 5,
      records: [
        makeRecord({ id: "r1", child_id: "child_1" }),
        makeRecord({ id: "r2", child_id: "child_2" }),
        makeRecord({ id: "r3", child_id: "child_3" }),
        makeRecord({
          id: "r4",
          child_id: "child_4",
          has_agreed_plan: false,
        }),
        makeRecord({
          id: "r5",
          child_id: "child_5",
          has_agreed_plan: false,
        }),
      ],
    };
    const result = computeSiblingContactProtocol(input);
    expect(result.agreed_plan_rate).toBe(60);
    // coverage: 5 of 5 → 100% → +6
    // regular: 5 of 5 → 100% → +5
    // agreed: 60% → +2
    // child_prefs: 5 of 5 → 100% → +5
    // celebrations: 100% → +4
    // reviews: 100% → +5
    // 52+6+5+2+5+4+5=79
    expect(result.contact_score).toBe(79);
  });
});

// ── 9. Modifier 4: Child Preferences ───────────────────────────────────────

describe("Modifier 4 — child preferences", () => {
  it("+5 when child preference rate >= 90%", () => {
    const result = computeSiblingContactProtocol(baseInput());
    expect(result.child_preference_rate).toBe(100);
  });

  it("+2 when child preference rate >= 60% but < 90%", () => {
    // 3 of 4 → 75% → +2
    const input = baseInput({
      records: [
        makeRecord({ id: "r1", child_id: "child_1" }),
        makeRecord({ id: "r2", child_id: "child_2" }),
        makeRecord({ id: "r3", child_id: "child_3" }),
        makeRecord({
          id: "r4",
          child_id: "child_4",
          has_child_preferences: false,
        }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    expect(result.child_preference_rate).toBe(75);
    // 52+6+5+5+2+4+5=79
    expect(result.contact_score).toBe(79);
  });

  it("no adjustment when child preference rate >= 30% but < 60%", () => {
    // 2 of 4 → 50% → 0
    const input = baseInput({
      records: [
        makeRecord({ id: "r1", child_id: "child_1" }),
        makeRecord({ id: "r2", child_id: "child_2" }),
        makeRecord({
          id: "r3",
          child_id: "child_3",
          has_child_preferences: false,
        }),
        makeRecord({
          id: "r4",
          child_id: "child_4",
          has_child_preferences: false,
        }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    expect(result.child_preference_rate).toBe(50);
    // 52+6+5+5+0+4+5=77
    expect(result.contact_score).toBe(77);
  });

  it("-4 when child preference rate < 30%", () => {
    // 1 of 4 → 25% → -4
    const input = baseInput({
      records: [
        makeRecord({ id: "r1", child_id: "child_1" }),
        makeRecord({
          id: "r2",
          child_id: "child_2",
          has_child_preferences: false,
        }),
        makeRecord({
          id: "r3",
          child_id: "child_3",
          has_child_preferences: false,
        }),
        makeRecord({
          id: "r4",
          child_id: "child_4",
          has_child_preferences: false,
        }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    expect(result.child_preference_rate).toBe(25);
    // 52+6+5+5-4+4+5=73
    expect(result.contact_score).toBe(73);
  });

  it("no adjustment when total records is 0 (modifier 4 does not penalize)", () => {
    // total=0 → no adjustment for modifier 4
    const result = computeSiblingContactProtocol({
      today: "2025-06-15",
      total_children: 4,
      records: [],
    });
    // 52-3-1-1+0-1-2=44
    expect(result.contact_score).toBe(44);
  });

  it("boundary: exactly 90% gives +5", () => {
    // 9 of 10 → 90%
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({
        id: `r${i}`,
        child_id: `child_${i % 4}`,
        has_child_preferences: i < 9,
      }),
    );
    const input: SiblingContactInput = {
      today: "2025-06-15",
      total_children: 4,
      records,
    };
    const result = computeSiblingContactProtocol(input);
    expect(result.child_preference_rate).toBe(90);
  });

  it("boundary: exactly 30% gives no adjustment (not < 30%)", () => {
    // 3 of 10 → 30%
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({
        id: `r${i}`,
        child_id: `child_${i % 4}`,
        has_child_preferences: i < 3,
      }),
    );
    const input: SiblingContactInput = {
      today: "2025-06-15",
      total_children: 4,
      records,
    };
    const result = computeSiblingContactProtocol(input);
    expect(result.child_preference_rate).toBe(30);
    // 30% is NOT < 30%, so no penalty. And not >= 60%, so no bonus. → 0
    // coverage: 4 of 4 → 100% → +6
    // regular: 10 of 10 → 100% → +5
    // agreed: 10 of 10 → 100% → +5
    // child_prefs: 30% → 0
    // celebrations: 100% → +4
    // reviews: 100% → +5
    // 52+6+5+5+0+4+5=77
    expect(result.contact_score).toBe(77);
  });
});

// ── 10. Modifier 5: Celebrations ───────────────────────────────────────────

describe("Modifier 5 — celebration planning", () => {
  it("+4 when celebration plan rate >= 80%", () => {
    // all birthday + all christmas → pct(8,8) = 100% → +4
    const result = computeSiblingContactProtocol(baseInput());
    expect(result.celebration_plan_rate).toBe(100);
  });

  it("+1 when celebration plan rate >= 50% but < 80%", () => {
    // 2 birthday of 4 + 2 christmas of 4 → pct(4,8)=50% → +1
    const input = baseInput({
      records: [
        makeRecord({ id: "r1", child_id: "child_1" }),
        makeRecord({
          id: "r2",
          child_id: "child_2",
          has_birthday_plan: false,
          has_christmas_plan: false,
        }),
        makeRecord({ id: "r3", child_id: "child_3" }),
        makeRecord({
          id: "r4",
          child_id: "child_4",
          has_birthday_plan: false,
          has_christmas_plan: false,
        }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    expect(result.celebration_plan_rate).toBe(50);
    // 52+6+5+5+5+1+5=79
    expect(result.contact_score).toBe(79);
  });

  it("no adjustment when celebration plan rate >= 20% but < 50%", () => {
    // 1 birthday of 4 + 1 christmas of 4 → pct(2,8)=25% → 0
    const input = baseInput({
      records: [
        makeRecord({ id: "r1", child_id: "child_1" }),
        makeRecord({
          id: "r2",
          child_id: "child_2",
          has_birthday_plan: false,
          has_christmas_plan: false,
        }),
        makeRecord({
          id: "r3",
          child_id: "child_3",
          has_birthday_plan: false,
          has_christmas_plan: false,
        }),
        makeRecord({
          id: "r4",
          child_id: "child_4",
          has_birthday_plan: false,
          has_christmas_plan: false,
        }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    expect(result.celebration_plan_rate).toBe(25);
    // 52+6+5+5+5+0+5=78
    expect(result.contact_score).toBe(78);
  });

  it("-4 when celebration plan rate < 20%", () => {
    // 0 of 8 → 0% → -4
    const input = baseInput({
      records: [
        makeRecord({
          id: "r1",
          child_id: "child_1",
          has_birthday_plan: false,
          has_christmas_plan: false,
        }),
        makeRecord({
          id: "r2",
          child_id: "child_2",
          has_birthday_plan: false,
          has_christmas_plan: false,
        }),
        makeRecord({
          id: "r3",
          child_id: "child_3",
          has_birthday_plan: false,
          has_christmas_plan: false,
        }),
        makeRecord({
          id: "r4",
          child_id: "child_4",
          has_birthday_plan: false,
          has_christmas_plan: false,
        }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    expect(result.celebration_plan_rate).toBe(0);
    // 52+6+5+5+5-4+5=74
    expect(result.contact_score).toBe(74);
  });

  it("-1 when total records is 0", () => {
    const result = computeSiblingContactProtocol({
      today: "2025-06-15",
      total_children: 4,
      records: [],
    });
    // 52-3-1-1+0-1-2=44
    expect(result.contact_score).toBe(44);
  });

  it("boundary: exactly 80% gives +4", () => {
    // Need pct(birthday+christmas, total*2) = 80
    // 4 records: 3 birthday + 3 christmas + 1 no birthday + 1 no christmas
    // Wait: need careful control. 5 records.
    // 5 records: total*2=10. Need 8 of 10 → 80%.
    // 4 birthday + 4 christmas = 8 of 10.
    // That means 4 of 5 have birthday, 4 of 5 have christmas.
    const input: SiblingContactInput = {
      today: "2025-06-15",
      total_children: 5,
      records: [
        makeRecord({ id: "r1", child_id: "child_1" }),
        makeRecord({ id: "r2", child_id: "child_2" }),
        makeRecord({ id: "r3", child_id: "child_3" }),
        makeRecord({ id: "r4", child_id: "child_4" }),
        makeRecord({
          id: "r5",
          child_id: "child_5",
          has_birthday_plan: false,
          has_christmas_plan: false,
        }),
      ],
    };
    const result = computeSiblingContactProtocol(input);
    expect(result.celebration_plan_rate).toBe(80);
    // coverage: 5 of 5 → 100% → +6
    // regular: 5 of 5 → 100% → +5
    // agreed: 5 of 5 → 100% → +5
    // child_prefs: 5 of 5 → 100% → +5
    // celebrations: 80% → +4
    // reviews: 5 of 5 current → 100% → +5
    // 52+6+5+5+5+4+5=82
    expect(result.contact_score).toBe(82);
  });

  it("boundary: exactly 50% gives +1", () => {
    // Already tested above with pct(4,8)=50%
    const input = baseInput({
      records: [
        makeRecord({ id: "r1", child_id: "child_1" }),
        makeRecord({
          id: "r2",
          child_id: "child_2",
          has_birthday_plan: false,
          has_christmas_plan: false,
        }),
        makeRecord({ id: "r3", child_id: "child_3" }),
        makeRecord({
          id: "r4",
          child_id: "child_4",
          has_birthday_plan: false,
          has_christmas_plan: false,
        }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    expect(result.celebration_plan_rate).toBe(50);
  });

  it("boundary: exactly 20% gives no penalty (not < 20%)", () => {
    // Need pct(x, total*2) = 20. 5 records: total*2=10. 2 of 10 = 20%.
    // 1 birthday + 1 christmas out of 5 each = pct(2,10)=20%
    const input: SiblingContactInput = {
      today: "2025-06-15",
      total_children: 5,
      records: [
        makeRecord({
          id: "r1",
          child_id: "child_1",
          has_christmas_plan: false,
        }),
        makeRecord({
          id: "r2",
          child_id: "child_2",
          has_birthday_plan: false,
        }),
        makeRecord({
          id: "r3",
          child_id: "child_3",
          has_birthday_plan: false,
          has_christmas_plan: false,
        }),
        makeRecord({
          id: "r4",
          child_id: "child_4",
          has_birthday_plan: false,
          has_christmas_plan: false,
        }),
        makeRecord({
          id: "r5",
          child_id: "child_5",
          has_birthday_plan: false,
          has_christmas_plan: false,
        }),
      ],
    };
    const result = computeSiblingContactProtocol(input);
    expect(result.celebration_plan_rate).toBe(20);
    // 20% is not < 20% and not >= 50% → no adjustment → 0
    // 52+6+5+5+5+0+5=78
    expect(result.contact_score).toBe(78);
  });

  it("only birthday without christmas counts as half celebration", () => {
    // 4 birthday + 0 christmas → pct(4,8)=50% → +1
    const input = baseInput({
      records: [
        makeRecord({
          id: "r1",
          child_id: "child_1",
          has_christmas_plan: false,
        }),
        makeRecord({
          id: "r2",
          child_id: "child_2",
          has_christmas_plan: false,
        }),
        makeRecord({
          id: "r3",
          child_id: "child_3",
          has_christmas_plan: false,
        }),
        makeRecord({
          id: "r4",
          child_id: "child_4",
          has_christmas_plan: false,
        }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    expect(result.celebration_plan_rate).toBe(50);
  });
});

// ── 11. Modifier 6: Review Currency ────────────────────────────────────────

describe("Modifier 6 — review currency", () => {
  it("+5 when review current rate >= 80%", () => {
    const result = computeSiblingContactProtocol(baseInput());
    expect(result.review_current_rate).toBe(100);
  });

  it("+2 when review current rate >= 50% but < 80%", () => {
    // 2 of 4 current → 50% → +2
    const input = baseInput({
      records: [
        makeRecord({ id: "r1", child_id: "child_1" }),
        makeRecord({ id: "r2", child_id: "child_2" }),
        makeRecord({
          id: "r3",
          child_id: "child_3",
          review_date: "2024-01-01",
        }),
        makeRecord({
          id: "r4",
          child_id: "child_4",
          review_date: "2024-01-01",
        }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    expect(result.review_current_rate).toBe(50);
    // 52+6+5+5+5+4+2=79
    expect(result.contact_score).toBe(79);
  });

  it("no adjustment when review current rate >= 30% but < 50%", () => {
    // Need 2 of 5 current → pct(2,5)=40% → 0
    const input: SiblingContactInput = {
      today: "2025-06-15",
      total_children: 5,
      records: [
        makeRecord({ id: "r1", child_id: "child_1" }),
        makeRecord({ id: "r2", child_id: "child_2" }),
        makeRecord({
          id: "r3",
          child_id: "child_3",
          review_date: "2024-01-01",
        }),
        makeRecord({
          id: "r4",
          child_id: "child_4",
          review_date: "2024-01-01",
        }),
        makeRecord({
          id: "r5",
          child_id: "child_5",
          review_date: "2024-01-01",
        }),
      ],
    };
    const result = computeSiblingContactProtocol(input);
    expect(result.review_current_rate).toBe(40);
    // coverage: 5 of 5 → 100% → +6
    // regular: 100% → +5
    // agreed: 100% → +5
    // child_prefs: 100% → +5
    // celebrations: 100% → +4
    // reviews: 40% → 0
    // 52+6+5+5+5+4+0=77
    expect(result.contact_score).toBe(77);
  });

  it("-3 when review current rate < 30%", () => {
    // 1 of 4 current → 25% → -3
    const input = baseInput({
      records: [
        makeRecord({ id: "r1", child_id: "child_1" }),
        makeRecord({
          id: "r2",
          child_id: "child_2",
          review_date: "2024-01-01",
        }),
        makeRecord({
          id: "r3",
          child_id: "child_3",
          review_date: "2024-01-01",
        }),
        makeRecord({
          id: "r4",
          child_id: "child_4",
          review_date: "2024-01-01",
        }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    expect(result.review_current_rate).toBe(25);
    // 52+6+5+5+5+4-3=74
    expect(result.contact_score).toBe(74);
  });

  it("-2 when total records is 0", () => {
    const result = computeSiblingContactProtocol({
      today: "2025-06-15",
      total_children: 4,
      records: [],
    });
    // 52-3-1-1+0-1-2=44
    expect(result.contact_score).toBe(44);
  });

  it("review within 90 days counts as current", () => {
    // review_date = "2025-03-20", today = "2025-06-15"
    // daysSince = (Jun15 - Mar20) = 87 days → <= 90 → current
    const input = baseInput({
      records: [
        makeRecord({
          id: "r1",
          child_id: "child_1",
          review_date: "2025-03-20",
        }),
        makeRecord({
          id: "r2",
          child_id: "child_2",
          review_date: "2025-03-20",
        }),
        makeRecord({
          id: "r3",
          child_id: "child_3",
          review_date: "2025-03-20",
        }),
        makeRecord({
          id: "r4",
          child_id: "child_4",
          review_date: "2025-03-20",
        }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    expect(result.review_current_rate).toBe(100);
  });

  it("review at exactly 90 days counts as current", () => {
    // today = "2025-06-15", 90 days back = "2025-03-17"
    // daysSince for "2025-03-17" → need to check
    // new Date("2025-06-15") - new Date("2025-03-17") = ...
    // Mar has 31 days. Mar17 to Mar31 = 14 days. Apr = 30. May = 31. Jun1-15 = 15.
    // 14+30+31+15 = 90 days. So daysSince = 90 → <= 90 → current
    const input = baseInput({
      records: [
        makeRecord({
          id: "r1",
          child_id: "child_1",
          review_date: "2025-03-17",
        }),
        makeRecord({
          id: "r2",
          child_id: "child_2",
          review_date: "2025-03-17",
        }),
        makeRecord({
          id: "r3",
          child_id: "child_3",
          review_date: "2025-03-17",
        }),
        makeRecord({
          id: "r4",
          child_id: "child_4",
          review_date: "2025-03-17",
        }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    expect(result.review_current_rate).toBe(100);
  });

  it("review at 91 days is NOT current", () => {
    // today = "2025-06-15", 91 days back = "2025-03-16"
    // Mar16 to Mar31 = 15 days. Apr=30. May=31. Jun1-15=15.
    // 15+30+31+15=91. daysSince=91 → > 90 → not current
    const input = baseInput({
      records: [
        makeRecord({
          id: "r1",
          child_id: "child_1",
          review_date: "2025-03-16",
        }),
        makeRecord({
          id: "r2",
          child_id: "child_2",
          review_date: "2025-03-16",
        }),
        makeRecord({
          id: "r3",
          child_id: "child_3",
          review_date: "2025-03-16",
        }),
        makeRecord({
          id: "r4",
          child_id: "child_4",
          review_date: "2025-03-16",
        }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    expect(result.review_current_rate).toBe(0);
    // 52+6+5+5+5+4-3=74
    expect(result.contact_score).toBe(74);
  });
});

// ── 12. Strengths Generation ───────────────────────────────────────────────

describe("Strengths generation", () => {
  it("includes coverage strength when childrenWithProtocolRate >= 80% and total > 0", () => {
    const result = computeSiblingContactProtocol(baseInput());
    expect(result.strengths).toContain(
      "Sibling contact protocols are in place for the majority of children — the home proactively facilitates family bonds",
    );
  });

  it("excludes coverage strength when childrenWithProtocolRate < 80%", () => {
    const input = baseInput({
      records: [
        makeRecord({ id: "r1", child_id: "child_1" }),
        makeRecord({ id: "r2", child_id: "child_2" }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    expect(result.children_with_protocol_rate).toBe(50);
    expect(result.strengths).not.toContain(
      "Sibling contact protocols are in place for the majority of children — the home proactively facilitates family bonds",
    );
  });

  it("includes regular contact strength when regularContactRate >= 80%", () => {
    const result = computeSiblingContactProtocol(baseInput());
    expect(result.strengths).toContain(
      "Regular contact is maintained — children see their siblings frequently through structured arrangements",
    );
  });

  it("excludes regular contact strength when regularContactRate < 80%", () => {
    const input = baseInput({
      records: [
        makeRecord({ id: "r1", child_id: "child_1" }),
        makeRecord({
          id: "r2",
          child_id: "child_2",
          contact_frequency: "none",
        }),
        makeRecord({ id: "r3", child_id: "child_3" }),
        makeRecord({
          id: "r4",
          child_id: "child_4",
          contact_frequency: "none",
        }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    expect(result.regular_contact_rate).toBe(50);
    expect(result.strengths).not.toContain(
      "Regular contact is maintained — children see their siblings frequently through structured arrangements",
    );
  });

  it("includes agreed plan strength when agreedPlanRate >= 90%", () => {
    const result = computeSiblingContactProtocol(baseInput());
    expect(result.strengths).toContain(
      "Contact plans are formally agreed and documented — expectations are clear for all parties",
    );
  });

  it("excludes agreed plan strength when agreedPlanRate < 90%", () => {
    const input = baseInput({
      records: [
        makeRecord({ id: "r1", child_id: "child_1" }),
        makeRecord({ id: "r2", child_id: "child_2" }),
        makeRecord({ id: "r3", child_id: "child_3" }),
        makeRecord({
          id: "r4",
          child_id: "child_4",
          has_agreed_plan: false,
        }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    expect(result.agreed_plan_rate).toBe(75);
    expect(result.strengths).not.toContain(
      "Contact plans are formally agreed and documented — expectations are clear for all parties",
    );
  });

  it("includes child preferences strength when childPreferenceRate >= 90%", () => {
    const result = computeSiblingContactProtocol(baseInput());
    expect(result.strengths).toContain(
      "Children's own preferences about sibling contact are consistently captured and respected",
    );
  });

  it("excludes child preferences strength when childPreferenceRate < 90%", () => {
    const input = baseInput({
      records: [
        makeRecord({ id: "r1", child_id: "child_1" }),
        makeRecord({ id: "r2", child_id: "child_2" }),
        makeRecord({ id: "r3", child_id: "child_3" }),
        makeRecord({
          id: "r4",
          child_id: "child_4",
          has_child_preferences: false,
        }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    expect(result.child_preference_rate).toBe(75);
    expect(result.strengths).not.toContain(
      "Children's own preferences about sibling contact are consistently captured and respected",
    );
  });

  it("includes celebration strength when celebrationPlanRate >= 80%", () => {
    const result = computeSiblingContactProtocol(baseInput());
    expect(result.strengths).toContain(
      "Birthday and Christmas plans ensure siblings share important milestones together",
    );
  });

  it("excludes celebration strength when celebrationPlanRate < 80%", () => {
    const input = baseInput({
      records: [
        makeRecord({ id: "r1", child_id: "child_1" }),
        makeRecord({
          id: "r2",
          child_id: "child_2",
          has_birthday_plan: false,
          has_christmas_plan: false,
        }),
        makeRecord({ id: "r3", child_id: "child_3" }),
        makeRecord({
          id: "r4",
          child_id: "child_4",
          has_birthday_plan: false,
          has_christmas_plan: false,
        }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    expect(result.celebration_plan_rate).toBe(50);
    expect(result.strengths).not.toContain(
      "Birthday and Christmas plans ensure siblings share important milestones together",
    );
  });

  it("includes review currency strength when reviewCurrentRate >= 80%", () => {
    const result = computeSiblingContactProtocol(baseInput());
    expect(result.strengths).toContain(
      "Sibling contact arrangements are reviewed regularly — the home adapts to changing circumstances",
    );
  });

  it("excludes review currency strength when reviewCurrentRate < 80%", () => {
    const input = baseInput({
      records: [
        makeRecord({ id: "r1", child_id: "child_1" }),
        makeRecord({ id: "r2", child_id: "child_2" }),
        makeRecord({
          id: "r3",
          child_id: "child_3",
          review_date: "2024-01-01",
        }),
        makeRecord({
          id: "r4",
          child_id: "child_4",
          review_date: "2024-01-01",
        }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    expect(result.review_current_rate).toBe(50);
    expect(result.strengths).not.toContain(
      "Sibling contact arrangements are reviewed regularly — the home adapts to changing circumstances",
    );
  });
});

// ── 13. Concerns Generation ────────────────────────────────────────────────

describe("Concerns generation", () => {
  it("concern: no protocols when children exist but records empty", () => {
    const result = computeSiblingContactProtocol({
      today: "2025-06-15",
      total_children: 3,
      records: [],
    });
    expect(result.concerns).toContain(
      "No sibling contact protocols — children's right to family contact is not being formally facilitated",
    );
  });

  it("no 'no protocols' concern when records exist", () => {
    const result = computeSiblingContactProtocol(baseInput());
    expect(result.concerns).not.toContain(
      "No sibling contact protocols — children's right to family contact is not being formally facilitated",
    );
  });

  it("concern: fewer than half have protocols when coverage < 50%", () => {
    // 1 unique of 4 → 25% < 50%
    const input = baseInput({
      records: [makeRecord({ id: "r1", child_id: "child_1" })],
    });
    const result = computeSiblingContactProtocol(input);
    expect(result.concerns).toContain(
      "Fewer than half of children have sibling contact protocols — some children may be missing out on family relationships",
    );
  });

  it("no coverage concern when coverage >= 50%", () => {
    const input = baseInput({
      records: [
        makeRecord({ id: "r1", child_id: "child_1" }),
        makeRecord({ id: "r2", child_id: "child_2" }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    expect(result.children_with_protocol_rate).toBe(50);
    expect(result.concerns).not.toContain(
      "Fewer than half of children have sibling contact protocols — some children may be missing out on family relationships",
    );
  });

  it("concern: infrequent contact when regularContactRate < 30%", () => {
    const input = baseInput({
      records: [
        makeRecord({ id: "r1", child_id: "child_1" }),
        makeRecord({
          id: "r2",
          child_id: "child_2",
          contact_frequency: "none",
        }),
        makeRecord({
          id: "r3",
          child_id: "child_3",
          contact_frequency: "none",
        }),
        makeRecord({
          id: "r4",
          child_id: "child_4",
          contact_frequency: "none",
        }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    expect(result.regular_contact_rate).toBe(25);
    expect(result.concerns).toContain(
      "Sibling contact is infrequent — children are not seeing siblings regularly",
    );
  });

  it("no infrequent contact concern when rate >= 30%", () => {
    const result = computeSiblingContactProtocol(baseInput());
    expect(result.concerns).not.toContain(
      "Sibling contact is infrequent — children are not seeing siblings regularly",
    );
  });

  it("concern: lack of agreed plans when agreedPlanRate < 30%", () => {
    const input = baseInput({
      records: [
        makeRecord({ id: "r1", child_id: "child_1" }),
        makeRecord({
          id: "r2",
          child_id: "child_2",
          has_agreed_plan: false,
        }),
        makeRecord({
          id: "r3",
          child_id: "child_3",
          has_agreed_plan: false,
        }),
        makeRecord({
          id: "r4",
          child_id: "child_4",
          has_agreed_plan: false,
        }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    expect(result.agreed_plan_rate).toBe(25);
    expect(result.concerns).toContain(
      "Most protocols lack an agreed contact plan — arrangements may be ad hoc and inconsistent",
    );
  });

  it("no agreed plan concern when rate >= 30%", () => {
    const result = computeSiblingContactProtocol(baseInput());
    expect(result.concerns).not.toContain(
      "Most protocols lack an agreed contact plan — arrangements may be ad hoc and inconsistent",
    );
  });

  it("concern: child preferences rarely captured when rate < 30%", () => {
    const input = baseInput({
      records: [
        makeRecord({ id: "r1", child_id: "child_1" }),
        makeRecord({
          id: "r2",
          child_id: "child_2",
          has_child_preferences: false,
        }),
        makeRecord({
          id: "r3",
          child_id: "child_3",
          has_child_preferences: false,
        }),
        makeRecord({
          id: "r4",
          child_id: "child_4",
          has_child_preferences: false,
        }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    expect(result.child_preference_rate).toBe(25);
    expect(result.concerns).toContain(
      "Children's preferences about sibling contact are rarely captured — their voice is not being heard",
    );
  });

  it("no child preferences concern when rate >= 30%", () => {
    const result = computeSiblingContactProtocol(baseInput());
    expect(result.concerns).not.toContain(
      "Children's preferences about sibling contact are rarely captured — their voice is not being heard",
    );
  });

  it("concern: reviews overdue when reviewCurrentRate < 30%", () => {
    const input = baseInput({
      records: [
        makeRecord({ id: "r1", child_id: "child_1" }),
        makeRecord({
          id: "r2",
          child_id: "child_2",
          review_date: "2024-01-01",
        }),
        makeRecord({
          id: "r3",
          child_id: "child_3",
          review_date: "2024-01-01",
        }),
        makeRecord({
          id: "r4",
          child_id: "child_4",
          review_date: "2024-01-01",
        }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    expect(result.review_current_rate).toBe(25);
    expect(result.concerns).toContain(
      "Sibling contact arrangements are overdue for review — protocols may be out of date",
    );
  });

  it("no review concern when rate >= 30%", () => {
    const result = computeSiblingContactProtocol(baseInput());
    expect(result.concerns).not.toContain(
      "Sibling contact arrangements are overdue for review — protocols may be out of date",
    );
  });

  it("concern: court-ordered contact lacking terms", () => {
    const input = baseInput({
      records: [
        makeRecord({
          id: "r1",
          child_id: "child_1",
          court_ordered: true,
          has_court_order_terms: true,
        }),
        makeRecord({
          id: "r2",
          child_id: "child_2",
          court_ordered: true,
          has_court_order_terms: false,
        }),
        makeRecord({ id: "r3", child_id: "child_3" }),
        makeRecord({ id: "r4", child_id: "child_4" }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    expect(result.concerns).toContain(
      "Some court-ordered sibling contact lacks documented terms — the home may be non-compliant",
    );
  });

  it("no court-order concern when all court-ordered have terms", () => {
    const input = baseInput({
      records: [
        makeRecord({
          id: "r1",
          child_id: "child_1",
          court_ordered: true,
          has_court_order_terms: true,
        }),
        makeRecord({ id: "r2", child_id: "child_2" }),
        makeRecord({ id: "r3", child_id: "child_3" }),
        makeRecord({ id: "r4", child_id: "child_4" }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    expect(result.concerns).not.toContain(
      "Some court-ordered sibling contact lacks documented terms — the home may be non-compliant",
    );
  });

  it("no court-order concern when no records are court-ordered", () => {
    const result = computeSiblingContactProtocol(baseInput());
    expect(result.concerns).not.toContain(
      "Some court-ordered sibling contact lacks documented terms — the home may be non-compliant",
    );
  });
});

// ── 14. Recommendations Generation ─────────────────────────────────────────

describe("Recommendations generation", () => {
  it("recommends creating protocols when no records exist", () => {
    const result = computeSiblingContactProtocol({
      today: "2025-06-15",
      total_children: 4,
      records: [],
    });
    expect(result.recommendations).toContainEqual({
      rank: 1,
      recommendation:
        "Create sibling contact protocols for every child and establish regular review cycles",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7",
    });
  });

  it("recommends extending protocols when coverage < 50%", () => {
    const input = baseInput({
      records: [makeRecord({ id: "r1", child_id: "child_1" })],
    });
    const result = computeSiblingContactProtocol(input);
    expect(result.recommendations).toContainEqual(
      expect.objectContaining({
        recommendation:
          "Extend sibling contact protocols to all children to ensure universal family bond support",
        urgency: "immediate",
        regulatory_ref: "CHR 2015 Reg 7",
      }),
    );
  });

  it("recommends increasing frequency when regularContactRate < 50%", () => {
    const input = baseInput({
      records: [
        makeRecord({ id: "r1", child_id: "child_1" }),
        makeRecord({
          id: "r2",
          child_id: "child_2",
          contact_frequency: "none",
        }),
        makeRecord({
          id: "r3",
          child_id: "child_3",
          contact_frequency: "none",
        }),
        makeRecord({
          id: "r4",
          child_id: "child_4",
          contact_frequency: "none",
        }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    expect(result.regular_contact_rate).toBe(25);
    expect(result.recommendations).toContainEqual(
      expect.objectContaining({
        recommendation:
          "Increase sibling contact frequency — aim for at least monthly contact for every child",
        urgency: "soon",
        regulatory_ref: "SCCIF Experiences",
      }),
    );
  });

  it("no frequency recommendation when rate >= 50%", () => {
    const result = computeSiblingContactProtocol(baseInput());
    const freqRec = result.recommendations.find((r) =>
      r.recommendation.includes("Increase sibling contact frequency"),
    );
    expect(freqRec).toBeUndefined();
  });

  it("recommends capturing child preferences when rate < 60%", () => {
    const input = baseInput({
      records: [
        makeRecord({ id: "r1", child_id: "child_1" }),
        makeRecord({
          id: "r2",
          child_id: "child_2",
          has_child_preferences: false,
        }),
        makeRecord({
          id: "r3",
          child_id: "child_3",
          has_child_preferences: false,
        }),
        makeRecord({
          id: "r4",
          child_id: "child_4",
          has_child_preferences: false,
        }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    expect(result.child_preference_rate).toBe(25);
    expect(result.recommendations).toContainEqual(
      expect.objectContaining({
        recommendation:
          "Capture children's preferences about how, when and where they want to see their siblings",
        urgency: "soon",
        regulatory_ref: "CHR 2015 Reg 7",
      }),
    );
  });

  it("no child preference recommendation when rate >= 60%", () => {
    // 3 of 4 → 75% → >= 60%
    const input = baseInput({
      records: [
        makeRecord({ id: "r1", child_id: "child_1" }),
        makeRecord({ id: "r2", child_id: "child_2" }),
        makeRecord({ id: "r3", child_id: "child_3" }),
        makeRecord({
          id: "r4",
          child_id: "child_4",
          has_child_preferences: false,
        }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    expect(result.child_preference_rate).toBe(75);
    const prefRec = result.recommendations.find((r) =>
      r.recommendation.includes("Capture children's preferences"),
    );
    expect(prefRec).toBeUndefined();
  });

  it("recommends celebration planning when rate < 50%", () => {
    const input = baseInput({
      records: [
        makeRecord({
          id: "r1",
          child_id: "child_1",
          has_birthday_plan: false,
          has_christmas_plan: false,
        }),
        makeRecord({
          id: "r2",
          child_id: "child_2",
          has_birthday_plan: false,
          has_christmas_plan: false,
        }),
        makeRecord({
          id: "r3",
          child_id: "child_3",
          has_birthday_plan: false,
          has_christmas_plan: false,
        }),
        makeRecord({
          id: "r4",
          child_id: "child_4",
          has_birthday_plan: false,
          has_christmas_plan: false,
        }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    expect(result.celebration_plan_rate).toBe(0);
    expect(result.recommendations).toContainEqual(
      expect.objectContaining({
        recommendation:
          "Plan birthday and Christmas arrangements so siblings can share milestones together",
        urgency: "planned",
        regulatory_ref: "SCCIF Experiences",
      }),
    );
  });

  it("no celebration recommendation when rate >= 50%", () => {
    const result = computeSiblingContactProtocol(baseInput());
    const celebRec = result.recommendations.find((r) =>
      r.recommendation.includes("Plan birthday and Christmas"),
    );
    expect(celebRec).toBeUndefined();
  });

  it("recommends reviewing protocols when reviewCurrentRate < 50%", () => {
    const input = baseInput({
      records: [
        makeRecord({ id: "r1", child_id: "child_1" }),
        makeRecord({
          id: "r2",
          child_id: "child_2",
          review_date: "2024-01-01",
        }),
        makeRecord({
          id: "r3",
          child_id: "child_3",
          review_date: "2024-01-01",
        }),
        makeRecord({
          id: "r4",
          child_id: "child_4",
          review_date: "2024-01-01",
        }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    expect(result.review_current_rate).toBe(25);
    expect(result.recommendations).toContainEqual(
      expect.objectContaining({
        recommendation:
          "Review all sibling contact protocols within the next quarter to ensure they remain current",
        urgency: "soon",
        regulatory_ref: "CHR 2015 Reg 7",
      }),
    );
  });

  it("no review recommendation when rate >= 50%", () => {
    const result = computeSiblingContactProtocol(baseInput());
    const revRec = result.recommendations.find((r) =>
      r.recommendation.includes("Review all sibling contact protocols"),
    );
    expect(revRec).toBeUndefined();
  });

  it("recommendations have correct incrementing ranks", () => {
    // Trigger all 5 non-zero-record recommendations
    const input = baseInput({
      records: [
        makeRecord({
          id: "r1",
          child_id: "child_1",
          contact_frequency: "none",
          has_agreed_plan: false,
          has_child_preferences: false,
          has_birthday_plan: false,
          has_christmas_plan: false,
          review_date: "2024-01-01",
        }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    // coverage < 50% → rank 1
    // regularContactRate < 50% → rank 2
    // childPreferenceRate < 60% → rank 3
    // celebrationPlanRate < 50% → rank 4
    // reviewCurrentRate < 50% → rank 5
    expect(result.recommendations).toHaveLength(5);
    expect(result.recommendations[0].rank).toBe(1);
    expect(result.recommendations[1].rank).toBe(2);
    expect(result.recommendations[2].rank).toBe(3);
    expect(result.recommendations[3].rank).toBe(4);
    expect(result.recommendations[4].rank).toBe(5);
  });
});

// ── 15. Insights Generation ────────────────────────────────────────────────

describe("Insights generation", () => {
  it("critical insight when no records but children exist", () => {
    const result = computeSiblingContactProtocol({
      today: "2025-06-15",
      total_children: 3,
      records: [],
    });
    expect(result.insights).toContainEqual({
      text: "No sibling contact records means Ofsted cannot verify how the home facilitates family relationships",
      severity: "critical",
    });
  });

  it("no critical insight when records exist", () => {
    const result = computeSiblingContactProtocol(baseInput());
    const critInsight = result.insights.find((i) =>
      i.text.includes("No sibling contact records means Ofsted"),
    );
    expect(critInsight).toBeUndefined();
  });

  it("positive insight for strong relationships when >= 70%", () => {
    // Need strongRelationships >= total * 0.7
    // 3 of 4 "strong" or "good" → 3 >= 4*0.7=2.8 → true
    const input = baseInput({
      records: [
        makeRecord({
          id: "r1",
          child_id: "child_1",
          current_relationship_quality: "strong",
        }),
        makeRecord({
          id: "r2",
          child_id: "child_2",
          current_relationship_quality: "good",
        }),
        makeRecord({
          id: "r3",
          child_id: "child_3",
          current_relationship_quality: "strong",
        }),
        makeRecord({
          id: "r4",
          child_id: "child_4",
          current_relationship_quality: "strained",
        }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    expect(result.insights).toContainEqual({
      text: "Strong sibling relationships indicate the home is doing effective work to preserve family bonds",
      severity: "positive",
    });
  });

  it("no strong relationships insight when < 70%", () => {
    // 2 of 4 → 2 < 4*0.7=2.8 → false
    const input = baseInput({
      records: [
        makeRecord({
          id: "r1",
          child_id: "child_1",
          current_relationship_quality: "strong",
        }),
        makeRecord({
          id: "r2",
          child_id: "child_2",
          current_relationship_quality: "good",
        }),
        makeRecord({
          id: "r3",
          child_id: "child_3",
          current_relationship_quality: "strained",
        }),
        makeRecord({
          id: "r4",
          child_id: "child_4",
          current_relationship_quality: "no_contact",
        }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    const strongInsight = result.insights.find((i) =>
      i.text.includes("Strong sibling relationships"),
    );
    expect(strongInsight).toBeUndefined();
  });

  it("positive insight for child-centred practice when regular >= 80% and prefs >= 80%", () => {
    // regularContactRate >= 80% AND childPreferenceRate >= 80%
    const result = computeSiblingContactProtocol(baseInput());
    expect(result.regular_contact_rate).toBe(100);
    expect(result.child_preference_rate).toBe(100);
    expect(result.insights).toContainEqual({
      text: "Regular contact driven by children's own preferences demonstrates outstanding child-centred practice",
      severity: "positive",
    });
  });

  it("no child-centred practice insight when regular < 80%", () => {
    const input = baseInput({
      records: [
        makeRecord({ id: "r1", child_id: "child_1" }),
        makeRecord({
          id: "r2",
          child_id: "child_2",
          contact_frequency: "none",
        }),
        makeRecord({
          id: "r3",
          child_id: "child_3",
          contact_frequency: "none",
        }),
        makeRecord({
          id: "r4",
          child_id: "child_4",
          contact_frequency: "none",
        }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    expect(result.regular_contact_rate).toBe(25);
    const insight = result.insights.find((i) =>
      i.text.includes("child-centred practice"),
    );
    expect(insight).toBeUndefined();
  });

  it("no child-centred practice insight when preferences < 80%", () => {
    const input = baseInput({
      records: [
        makeRecord({ id: "r1", child_id: "child_1" }),
        makeRecord({
          id: "r2",
          child_id: "child_2",
          has_child_preferences: false,
        }),
        makeRecord({
          id: "r3",
          child_id: "child_3",
          has_child_preferences: false,
        }),
        makeRecord({
          id: "r4",
          child_id: "child_4",
          has_child_preferences: false,
        }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    expect(result.child_preference_rate).toBe(25);
    const insight = result.insights.find((i) =>
      i.text.includes("child-centred practice"),
    );
    expect(insight).toBeUndefined();
  });

  it("warning insight for missing celebration plans when rate < 30%", () => {
    const input = baseInput({
      records: [
        makeRecord({
          id: "r1",
          child_id: "child_1",
          has_birthday_plan: false,
          has_christmas_plan: false,
        }),
        makeRecord({
          id: "r2",
          child_id: "child_2",
          has_birthday_plan: false,
          has_christmas_plan: false,
        }),
        makeRecord({
          id: "r3",
          child_id: "child_3",
          has_birthday_plan: false,
          has_christmas_plan: false,
        }),
        makeRecord({
          id: "r4",
          child_id: "child_4",
          has_birthday_plan: false,
          has_christmas_plan: false,
        }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    expect(result.celebration_plan_rate).toBe(0);
    expect(result.insights).toContainEqual({
      text: "Without celebration plans, siblings may miss sharing birthdays and holidays — this matters deeply to children",
      severity: "warning",
    });
  });

  it("no celebration warning when rate >= 30%", () => {
    const result = computeSiblingContactProtocol(baseInput());
    const celebInsight = result.insights.find((i) =>
      i.text.includes("Without celebration plans"),
    );
    expect(celebInsight).toBeUndefined();
  });

  it("positive insight for court-order compliance when all have terms", () => {
    const input = baseInput({
      records: [
        makeRecord({
          id: "r1",
          child_id: "child_1",
          court_ordered: true,
          has_court_order_terms: true,
        }),
        makeRecord({
          id: "r2",
          child_id: "child_2",
          court_ordered: true,
          has_court_order_terms: true,
        }),
        makeRecord({ id: "r3", child_id: "child_3" }),
        makeRecord({ id: "r4", child_id: "child_4" }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    expect(result.insights).toContainEqual({
      text: "All court-ordered contact has documented terms — the home demonstrates legal compliance",
      severity: "positive",
    });
  });

  it("no court-compliance insight when some lack terms", () => {
    const input = baseInput({
      records: [
        makeRecord({
          id: "r1",
          child_id: "child_1",
          court_ordered: true,
          has_court_order_terms: true,
        }),
        makeRecord({
          id: "r2",
          child_id: "child_2",
          court_ordered: true,
          has_court_order_terms: false,
        }),
        makeRecord({ id: "r3", child_id: "child_3" }),
        makeRecord({ id: "r4", child_id: "child_4" }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    const courtInsight = result.insights.find((i) =>
      i.text.includes("All court-ordered contact has documented terms"),
    );
    expect(courtInsight).toBeUndefined();
  });

  it("no court-compliance insight when no court-ordered records", () => {
    // courtOrdered = 0 → the condition `courtOrdered > 0` fails
    const result = computeSiblingContactProtocol(baseInput());
    const courtInsight = result.insights.find((i) =>
      i.text.includes("All court-ordered contact has documented terms"),
    );
    expect(courtInsight).toBeUndefined();
  });

  it("warning insight for outdated reviews when rate < 30%", () => {
    const input = baseInput({
      records: [
        makeRecord({
          id: "r1",
          child_id: "child_1",
          review_date: "2024-01-01",
        }),
        makeRecord({
          id: "r2",
          child_id: "child_2",
          review_date: "2024-01-01",
        }),
        makeRecord({
          id: "r3",
          child_id: "child_3",
          review_date: "2024-01-01",
        }),
        makeRecord({
          id: "r4",
          child_id: "child_4",
          review_date: "2024-01-01",
        }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    expect(result.review_current_rate).toBe(0);
    expect(result.insights).toContainEqual({
      text: "Outdated sibling contact protocols risk not reflecting children's current wishes or changed circumstances",
      severity: "warning",
    });
  });

  it("no outdated review insight when rate >= 30%", () => {
    const result = computeSiblingContactProtocol(baseInput());
    const reviewInsight = result.insights.find((i) =>
      i.text.includes("Outdated sibling contact protocols"),
    );
    expect(reviewInsight).toBeUndefined();
  });
});

// ── 16. Headlines ──────────────────────────────────────────────────────────

describe("Headlines", () => {
  it("insufficient_data headline", () => {
    const result = computeSiblingContactProtocol({
      today: "2025-06-15",
      total_children: 0,
      records: [],
    });
    expect(result.headline).toBe(
      "No data available for sibling contact intelligence analysis",
    );
  });

  it("outstanding headline", () => {
    const result = computeSiblingContactProtocol(baseInput());
    expect(result.headline).toBe(
      "Outstanding sibling contact — children's family relationships are proactively nurtured and celebrated",
    );
  });

  it("good headline", () => {
    const input = baseInput({
      records: [
        makeRecord({ id: "r1", child_id: "child_1" }),
        makeRecord({ id: "r2", child_id: "child_2" }),
        makeRecord({ id: "r3", child_id: "child_3" }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    expect(result.contact_rating).toBe("good");
    expect(result.headline).toBe(
      "Good sibling contact arrangements with regular visits and clear plans in place",
    );
  });

  it("adequate headline", () => {
    const input = baseInput({
      records: [
        makeRecord({ id: "r1", child_id: "child_1" }),
        makeRecord({
          id: "r2",
          child_id: "child_2",
          contact_frequency: "none",
          has_agreed_plan: false,
          has_child_preferences: false,
          has_birthday_plan: false,
          has_christmas_plan: false,
          review_date: "2024-01-01",
        }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    expect(result.contact_rating).toBe("adequate");
    expect(result.headline).toBe(
      "Sibling contact exists but frequency, planning or child voice needs strengthening",
    );
  });

  it("inadequate headline", () => {
    const input = baseInput({
      records: [
        makeRecord({
          id: "r1",
          child_id: "child_1",
          contact_frequency: "none",
          has_agreed_plan: false,
          has_child_preferences: false,
          has_birthday_plan: false,
          has_christmas_plan: false,
          review_date: "2024-01-01",
        }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    expect(result.contact_rating).toBe("inadequate");
    expect(result.headline).toBe(
      "Sibling contact is inadequate — children are not being supported to maintain family bonds",
    );
  });

  it("insufficient_data headline when children exist but no records", () => {
    const result = computeSiblingContactProtocol({
      today: "2025-06-15",
      total_children: 5,
      records: [],
    });
    expect(result.headline).toBe(
      "No data available for sibling contact intelligence analysis",
    );
  });
});

// ── 17. pct() Edge Cases ───────────────────────────────────────────────────

describe("pct() edge cases via engine outputs", () => {
  it("all rates are 0 when no records and total_children > 0", () => {
    const result = computeSiblingContactProtocol({
      today: "2025-06-15",
      total_children: 5,
      records: [],
    });
    expect(result.children_with_protocol_rate).toBe(0);
    expect(result.regular_contact_rate).toBe(0);
    expect(result.agreed_plan_rate).toBe(0);
    expect(result.child_preference_rate).toBe(0);
    expect(result.celebration_plan_rate).toBe(0);
    expect(result.review_current_rate).toBe(0);
  });

  it("rates are 0 when total_children is 0 (pct denominator 0)", () => {
    const result = computeSiblingContactProtocol({
      today: "2025-06-15",
      total_children: 0,
      records: [],
    });
    expect(result.children_with_protocol_rate).toBe(0);
    expect(result.regular_contact_rate).toBe(0);
    expect(result.agreed_plan_rate).toBe(0);
    expect(result.child_preference_rate).toBe(0);
    expect(result.celebration_plan_rate).toBe(0);
    expect(result.review_current_rate).toBe(0);
  });

  it("pct rounds correctly: 1 of 3 = 33%", () => {
    const input: SiblingContactInput = {
      today: "2025-06-15",
      total_children: 3,
      records: [
        makeRecord({ id: "r1", child_id: "child_1" }),
        makeRecord({
          id: "r2",
          child_id: "child_2",
          has_agreed_plan: false,
        }),
        makeRecord({
          id: "r3",
          child_id: "child_3",
          has_agreed_plan: false,
        }),
      ],
    };
    const result = computeSiblingContactProtocol(input);
    // agreedPlanRate = pct(1,3) = Math.round(1/3*100) = Math.round(33.33) = 33
    expect(result.agreed_plan_rate).toBe(33);
  });

  it("pct rounds correctly: 2 of 3 = 67%", () => {
    const input: SiblingContactInput = {
      today: "2025-06-15",
      total_children: 3,
      records: [
        makeRecord({ id: "r1", child_id: "child_1" }),
        makeRecord({ id: "r2", child_id: "child_2" }),
        makeRecord({
          id: "r3",
          child_id: "child_3",
          has_agreed_plan: false,
        }),
      ],
    };
    const result = computeSiblingContactProtocol(input);
    // agreedPlanRate = pct(2,3) = Math.round(2/3*100) = Math.round(66.67) = 67
    expect(result.agreed_plan_rate).toBe(67);
  });

  it("pct rounds 1 of 6 to 17%", () => {
    // 1 birthday of 3 records + 0 christmas = pct(1,6) = Math.round(16.67) = 17
    const input: SiblingContactInput = {
      today: "2025-06-15",
      total_children: 3,
      records: [
        makeRecord({
          id: "r1",
          child_id: "child_1",
          has_christmas_plan: false,
        }),
        makeRecord({
          id: "r2",
          child_id: "child_2",
          has_birthday_plan: false,
          has_christmas_plan: false,
        }),
        makeRecord({
          id: "r3",
          child_id: "child_3",
          has_birthday_plan: false,
          has_christmas_plan: false,
        }),
      ],
    };
    const result = computeSiblingContactProtocol(input);
    expect(result.celebration_plan_rate).toBe(17);
  });
});

// ── 18. Court-Ordered Compliance ───────────────────────────────────────────

describe("Court-ordered compliance", () => {
  it("all court-ordered records with terms produce positive insight", () => {
    const input = baseInput({
      records: [
        makeRecord({
          id: "r1",
          child_id: "child_1",
          court_ordered: true,
          has_court_order_terms: true,
        }),
        makeRecord({
          id: "r2",
          child_id: "child_2",
          court_ordered: true,
          has_court_order_terms: true,
        }),
        makeRecord({
          id: "r3",
          child_id: "child_3",
          court_ordered: true,
          has_court_order_terms: true,
        }),
        makeRecord({
          id: "r4",
          child_id: "child_4",
          court_ordered: true,
          has_court_order_terms: true,
        }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    expect(result.insights).toContainEqual({
      text: "All court-ordered contact has documented terms — the home demonstrates legal compliance",
      severity: "positive",
    });
    expect(result.concerns).not.toContain(
      "Some court-ordered sibling contact lacks documented terms — the home may be non-compliant",
    );
  });

  it("mixed court-ordered compliance produces concern", () => {
    const input = baseInput({
      records: [
        makeRecord({
          id: "r1",
          child_id: "child_1",
          court_ordered: true,
          has_court_order_terms: true,
        }),
        makeRecord({
          id: "r2",
          child_id: "child_2",
          court_ordered: true,
          has_court_order_terms: false,
        }),
        makeRecord({ id: "r3", child_id: "child_3" }),
        makeRecord({ id: "r4", child_id: "child_4" }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    expect(result.concerns).toContain(
      "Some court-ordered sibling contact lacks documented terms — the home may be non-compliant",
    );
    // And no positive court insight
    const courtInsight = result.insights.find((i) =>
      i.text.includes("All court-ordered contact has documented terms"),
    );
    expect(courtInsight).toBeUndefined();
  });

  it("single court-ordered record without terms raises concern", () => {
    const input = baseInput({
      records: [
        makeRecord({
          id: "r1",
          child_id: "child_1",
          court_ordered: true,
          has_court_order_terms: false,
        }),
        makeRecord({ id: "r2", child_id: "child_2" }),
        makeRecord({ id: "r3", child_id: "child_3" }),
        makeRecord({ id: "r4", child_id: "child_4" }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    expect(result.concerns).toContain(
      "Some court-ordered sibling contact lacks documented terms — the home may be non-compliant",
    );
  });

  it("court-ordered does not affect score modifiers", () => {
    // Court-ordered fields don't affect scoring, only concerns/insights
    const withCourt = computeSiblingContactProtocol(
      baseInput({
        records: [
          makeRecord({
            id: "r1",
            child_id: "child_1",
            court_ordered: true,
            has_court_order_terms: true,
          }),
          makeRecord({
            id: "r2",
            child_id: "child_2",
            court_ordered: true,
            has_court_order_terms: true,
          }),
          makeRecord({ id: "r3", child_id: "child_3" }),
          makeRecord({ id: "r4", child_id: "child_4" }),
        ],
      }),
    );
    const withoutCourt = computeSiblingContactProtocol(baseInput());
    expect(withCourt.contact_score).toBe(withoutCourt.contact_score);
  });
});

// ── 19. Mixed Quality Records ──────────────────────────────────────────────

describe("Mixed quality records", () => {
  it("handles records with diverse relationship qualities", () => {
    const input = baseInput({
      records: [
        makeRecord({
          id: "r1",
          child_id: "child_1",
          current_relationship_quality: "strong",
        }),
        makeRecord({
          id: "r2",
          child_id: "child_2",
          current_relationship_quality: "good",
        }),
        makeRecord({
          id: "r3",
          child_id: "child_3",
          current_relationship_quality: "strained",
        }),
        makeRecord({
          id: "r4",
          child_id: "child_4",
          current_relationship_quality: "no_contact",
        }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    // 2 strong relationships of 4 → 2 >= 4*0.7=2.8? No → no strong insight
    expect(result.contact_score).toBe(82);
    const strongInsight = result.insights.find((i) =>
      i.text.includes("Strong sibling relationships"),
    );
    expect(strongInsight).toBeUndefined();
  });

  it("handles mix of good and poor across all dimensions", () => {
    const input = baseInput({
      records: [
        makeRecord({ id: "r1", child_id: "child_1" }), // all good
        makeRecord({
          id: "r2",
          child_id: "child_2",
          contact_frequency: "none",
          has_agreed_plan: false,
          has_child_preferences: false,
          has_birthday_plan: false,
          has_christmas_plan: false,
          review_date: "2024-01-01",
        }), // all bad
        makeRecord({ id: "r3", child_id: "child_3" }), // all good
        makeRecord({
          id: "r4",
          child_id: "child_4",
          contact_frequency: "less_than_monthly",
          has_agreed_plan: false,
          has_birthday_plan: false,
          review_date: "2024-06-01",
        }), // mixed
      ],
    });
    const result = computeSiblingContactProtocol(input);
    // coverage: 4 of 4 → 100% → +6
    // regular: 2 of 4 (r1 weekly, r3 weekly) → 50% → +2
    // agreed: 2 of 4 → 50% → 0 (>=30% but <60%)
    // child_prefs: 3 of 4 → 75% → +2
    // celebrations: r1(1,1) r2(0,0) r3(1,1) r4(0,1) → birthday=2, christmas=3 → pct(5,8)=63% → +1
    // reviews: r1(26d) r2(>365d) r3(26d) r4: "2024-06-01" → 379 days → not current → 2 of 4 = 50% → +2
    // 52+6+2+0+2+1+2=65 → good
    expect(result.contact_score).toBe(65);
    expect(result.contact_rating).toBe("good");
  });

  it("handles records with same child_id (multiple sibling protocols per child)", () => {
    const input = baseInput({
      records: [
        makeRecord({
          id: "r1",
          child_id: "child_1",
          sibling_name: "Jamie",
        }),
        makeRecord({ id: "r2", child_id: "child_1", sibling_name: "Sam" }),
        makeRecord({ id: "r3", child_id: "child_1", sibling_name: "Alex" }),
        makeRecord({
          id: "r4",
          child_id: "child_1",
          sibling_name: "Taylor",
        }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    // uniqueChildren = 1 → pct(1,4) = 25% → -5
    // All other rates based on 4 records, all good
    // regular: 100% → +5
    // agreed: 100% → +5
    // child_prefs: 100% → +5
    // celebrations: 100% → +4
    // reviews: 100% → +5
    // 52-5+5+5+5+4+5=71
    expect(result.contact_score).toBe(71);
    expect(result.children_with_protocol_rate).toBe(25);
  });
});

// ── 20. Single Record Edge Cases ───────────────────────────────────────────

describe("Single record edge cases", () => {
  it("single perfect record with 1 total child scores outstanding", () => {
    const input: SiblingContactInput = {
      today: "2025-06-15",
      total_children: 1,
      records: [makeRecord({ id: "r1", child_id: "child_1" })],
    };
    const result = computeSiblingContactProtocol(input);
    // coverage: pct(1,1)=100% → +6
    // regular: pct(1,1)=100% → +5
    // agreed: 100% → +5
    // child_prefs: 100% → +5
    // celebrations: pct(2,2)=100% → +4
    // reviews: 100% → +5
    // 52+6+5+5+5+4+5=82
    expect(result.contact_score).toBe(82);
    expect(result.contact_rating).toBe("outstanding");
  });

  it("single bad record with many children is inadequate", () => {
    const input: SiblingContactInput = {
      today: "2025-06-15",
      total_children: 10,
      records: [
        makeRecord({
          id: "r1",
          child_id: "child_1",
          contact_frequency: "none",
          has_agreed_plan: false,
          has_child_preferences: false,
          has_birthday_plan: false,
          has_christmas_plan: false,
          review_date: "2024-01-01",
        }),
      ],
    };
    const result = computeSiblingContactProtocol(input);
    // coverage: pct(1,10)=10% → -5
    // regular: 0% → -5
    // agreed: 0% → -4
    // child_prefs: 0% → -4
    // celebrations: 0% → -4
    // reviews: 0% → -3
    // 52-5-5-4-4-4-3=27
    expect(result.contact_score).toBe(27);
    expect(result.contact_rating).toBe("inadequate");
  });

  it("single record — celebration with only birthday", () => {
    const input: SiblingContactInput = {
      today: "2025-06-15",
      total_children: 1,
      records: [
        makeRecord({
          id: "r1",
          child_id: "child_1",
          has_christmas_plan: false,
        }),
      ],
    };
    const result = computeSiblingContactProtocol(input);
    // celebrations: pct(1, 2) = 50% → +1
    // 52+6+5+5+5+1+5=79
    expect(result.contact_score).toBe(79);
    expect(result.celebration_plan_rate).toBe(50);
  });

  it("single record — celebration with only christmas", () => {
    const input: SiblingContactInput = {
      today: "2025-06-15",
      total_children: 1,
      records: [
        makeRecord({
          id: "r1",
          child_id: "child_1",
          has_birthday_plan: false,
        }),
      ],
    };
    const result = computeSiblingContactProtocol(input);
    expect(result.celebration_plan_rate).toBe(50);
    // 52+6+5+5+5+1+5=79
    expect(result.contact_score).toBe(79);
  });
});

// ── 21. Large Dataset ──────────────────────────────────────────────────────

describe("Large dataset (20+ records)", () => {
  it("handles 20 records across 10 children correctly", () => {
    const records: SiblingContactRecordInput[] = [];
    for (let i = 0; i < 20; i++) {
      records.push(
        makeRecord({
          id: `r${i}`,
          child_id: `child_${i % 10}`,
          sibling_name: `Sibling_${i}`,
        }),
      );
    }
    const input: SiblingContactInput = {
      today: "2025-06-15",
      total_children: 10,
      records,
    };
    const result = computeSiblingContactProtocol(input);
    // uniqueChildren = 10, total_children = 10 → pct(10,10)=100% → +6
    // All weekly → 100% → +5
    // All agreed → 100% → +5
    // All child_prefs → 100% → +5
    // All celebrations → 100% → +4
    // All reviews current → 100% → +5
    // 52+6+5+5+5+4+5=82
    expect(result.contact_score).toBe(82);
    expect(result.total_protocols).toBe(20);
    expect(result.contact_rating).toBe("outstanding");
  });

  it("handles 25 records with mixed quality across 8 children", () => {
    const records: SiblingContactRecordInput[] = [];
    for (let i = 0; i < 25; i++) {
      const isGood = i < 15;
      records.push(
        makeRecord({
          id: `r${i}`,
          child_id: `child_${i % 8}`,
          sibling_name: `Sibling_${i}`,
          contact_frequency: isGood ? "weekly" : "none",
          has_agreed_plan: isGood,
          has_child_preferences: isGood,
          has_birthday_plan: isGood,
          has_christmas_plan: isGood,
          review_date: isGood ? "2025-05-20" : "2024-01-01",
        }),
      );
    }
    const input: SiblingContactInput = {
      today: "2025-06-15",
      total_children: 10,
      records,
    };
    const result = computeSiblingContactProtocol(input);
    // uniqueChildren: child_0..child_7 = 8 → pct(8,10)=80% → +6
    // regularContact: 15 of 25 → pct(15,25)=60% → >=50% → +2
    // agreed: 15 of 25 → 60% → >=60% → +2
    // child_prefs: 15 of 25 → 60% → >=60% → +2
    // celebrations: 15 birthday + 15 christmas of 50 → pct(30,50)=60% → >=50% → +1
    // reviews: 15 of 25 current → 60% → >=50% → +2
    // 52+6+2+2+2+1+2=67
    expect(result.contact_score).toBe(67);
    expect(result.contact_rating).toBe("good");
    expect(result.total_protocols).toBe(25);
  });

  it("handles 30 records with uniform data", () => {
    const records: SiblingContactRecordInput[] = Array.from(
      { length: 30 },
      (_, i) =>
        makeRecord({
          id: `r${i}`,
          child_id: `child_${i % 5}`,
          sibling_name: `Sibling_${i}`,
        }),
    );
    const input: SiblingContactInput = {
      today: "2025-06-15",
      total_children: 5,
      records,
    };
    const result = computeSiblingContactProtocol(input);
    expect(result.total_protocols).toBe(30);
    expect(result.contact_score).toBe(82);
    expect(result.contact_rating).toBe("outstanding");
  });
});

// ── 22. Score Clamping ─────────────────────────────────────────────────────

describe("Score clamping", () => {
  it("score never exceeds 100", () => {
    // Max is 82 naturally, but test the clamp doesn't allow > 100
    const result = computeSiblingContactProtocol(baseInput());
    expect(result.contact_score).toBeLessThanOrEqual(100);
  });

  it("score never goes below 0", () => {
    // Worst case: 52-5-5-4-4-4-3=27, so can't naturally go below 0
    // But verify the clamp is in place
    const input = baseInput({
      records: [
        makeRecord({
          id: "r1",
          child_id: "child_1",
          contact_frequency: "none",
          has_agreed_plan: false,
          has_child_preferences: false,
          has_birthday_plan: false,
          has_christmas_plan: false,
          review_date: "2024-01-01",
        }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    expect(result.contact_score).toBeGreaterThanOrEqual(0);
  });
});

// ── 23. Output Structure ───────────────────────────────────────────────────

describe("Output structure", () => {
  it("returns all expected fields", () => {
    const result = computeSiblingContactProtocol(baseInput());
    expect(result).toHaveProperty("contact_rating");
    expect(result).toHaveProperty("contact_score");
    expect(result).toHaveProperty("headline");
    expect(result).toHaveProperty("total_protocols");
    expect(result).toHaveProperty("children_with_protocol_rate");
    expect(result).toHaveProperty("regular_contact_rate");
    expect(result).toHaveProperty("agreed_plan_rate");
    expect(result).toHaveProperty("child_preference_rate");
    expect(result).toHaveProperty("celebration_plan_rate");
    expect(result).toHaveProperty("review_current_rate");
    expect(result).toHaveProperty("strengths");
    expect(result).toHaveProperty("concerns");
    expect(result).toHaveProperty("recommendations");
    expect(result).toHaveProperty("insights");
  });

  it("total_protocols matches records length", () => {
    const input = baseInput();
    const result = computeSiblingContactProtocol(input);
    expect(result.total_protocols).toBe(input.records.length);
  });

  it("strengths is always an array", () => {
    const result = computeSiblingContactProtocol(baseInput());
    expect(Array.isArray(result.strengths)).toBe(true);
  });

  it("concerns is always an array", () => {
    const result = computeSiblingContactProtocol(baseInput());
    expect(Array.isArray(result.concerns)).toBe(true);
  });

  it("recommendations is always an array of objects with rank, recommendation, urgency, regulatory_ref", () => {
    const result = computeSiblingContactProtocol({
      today: "2025-06-15",
      total_children: 4,
      records: [],
    });
    for (const rec of result.recommendations) {
      expect(rec).toHaveProperty("rank");
      expect(rec).toHaveProperty("recommendation");
      expect(rec).toHaveProperty("urgency");
      expect(rec).toHaveProperty("regulatory_ref");
      expect(["immediate", "soon", "planned"]).toContain(rec.urgency);
    }
  });

  it("insights is always an array of objects with text and severity", () => {
    const result = computeSiblingContactProtocol({
      today: "2025-06-15",
      total_children: 4,
      records: [],
    });
    for (const insight of result.insights) {
      expect(insight).toHaveProperty("text");
      expect(insight).toHaveProperty("severity");
      expect(["critical", "warning", "positive"]).toContain(insight.severity);
    }
  });
});

// ── 24. Additional Edge Cases ──────────────────────────────────────────────

describe("Additional edge cases", () => {
  it("empty review_date is not counted as current", () => {
    const input = baseInput({
      records: [
        makeRecord({ id: "r1", child_id: "child_1", review_date: "" }),
        makeRecord({ id: "r2", child_id: "child_2", review_date: "" }),
        makeRecord({ id: "r3", child_id: "child_3", review_date: "" }),
        makeRecord({ id: "r4", child_id: "child_4", review_date: "" }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    expect(result.review_current_rate).toBe(0);
  });

  it("total_children = 1 with 1 record works correctly", () => {
    const input: SiblingContactInput = {
      today: "2025-06-15",
      total_children: 1,
      records: [makeRecord({ id: "r1", child_id: "child_1" })],
    };
    const result = computeSiblingContactProtocol(input);
    expect(result.children_with_protocol_rate).toBe(100);
    expect(result.total_protocols).toBe(1);
    expect(result.contact_score).toBe(82);
  });

  it("handles future review_date as current", () => {
    // review_date in the future → daysSince negative → <= 90 → current
    const input = baseInput({
      records: [
        makeRecord({
          id: "r1",
          child_id: "child_1",
          review_date: "2025-12-01",
        }),
        makeRecord({
          id: "r2",
          child_id: "child_2",
          review_date: "2025-12-01",
        }),
        makeRecord({
          id: "r3",
          child_id: "child_3",
          review_date: "2025-12-01",
        }),
        makeRecord({
          id: "r4",
          child_id: "child_4",
          review_date: "2025-12-01",
        }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    expect(result.review_current_rate).toBe(100);
  });

  it("children_with_protocol_rate counts unique child_ids only", () => {
    // 3 records but only 2 unique child_ids
    const input: SiblingContactInput = {
      today: "2025-06-15",
      total_children: 4,
      records: [
        makeRecord({ id: "r1", child_id: "child_1", sibling_name: "Jamie" }),
        makeRecord({ id: "r2", child_id: "child_1", sibling_name: "Sam" }),
        makeRecord({ id: "r3", child_id: "child_2", sibling_name: "Alex" }),
      ],
    };
    const result = computeSiblingContactProtocol(input);
    expect(result.children_with_protocol_rate).toBe(50);
  });

  it("contact_frequency values other than weekly/fortnightly/monthly are not regular", () => {
    const input = baseInput({
      records: [
        makeRecord({
          id: "r1",
          child_id: "child_1",
          contact_frequency: "less_than_monthly",
        }),
        makeRecord({
          id: "r2",
          child_id: "child_2",
          contact_frequency: "none",
        }),
        makeRecord({
          id: "r3",
          child_id: "child_3",
          contact_frequency: "less_than_monthly",
        }),
        makeRecord({
          id: "r4",
          child_id: "child_4",
          contact_frequency: "none",
        }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    expect(result.regular_contact_rate).toBe(0);
  });

  it("multiple insights can coexist", () => {
    // strong relationships insight + child-centred practice insight
    const input = baseInput({
      records: [
        makeRecord({
          id: "r1",
          child_id: "child_1",
          current_relationship_quality: "strong",
        }),
        makeRecord({
          id: "r2",
          child_id: "child_2",
          current_relationship_quality: "strong",
        }),
        makeRecord({
          id: "r3",
          child_id: "child_3",
          current_relationship_quality: "strong",
        }),
        makeRecord({
          id: "r4",
          child_id: "child_4",
          current_relationship_quality: "good",
        }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    // strongRelationships = 4 >= 4*0.7 = 2.8 → true
    // regularContactRate = 100% >= 80% AND childPreferenceRate = 100% >= 80% → true
    expect(result.insights).toContainEqual({
      text: "Strong sibling relationships indicate the home is doing effective work to preserve family bonds",
      severity: "positive",
    });
    expect(result.insights).toContainEqual({
      text: "Regular contact driven by children's own preferences demonstrates outstanding child-centred practice",
      severity: "positive",
    });
  });

  it("multiple concerns can coexist", () => {
    const input = baseInput({
      records: [
        makeRecord({
          id: "r1",
          child_id: "child_1",
          contact_frequency: "none",
          has_agreed_plan: false,
          has_child_preferences: false,
          review_date: "2024-01-01",
          court_ordered: true,
          has_court_order_terms: false,
        }),
      ],
    });
    const result = computeSiblingContactProtocol(input);
    // coverage < 50% → concern
    // regularContactRate < 30% → concern
    // agreedPlanRate < 30% → concern
    // childPreferenceRate < 30% → concern
    // reviewCurrentRate < 30% → concern
    // court-ordered without terms → concern
    expect(result.concerns.length).toBeGreaterThanOrEqual(6);
  });
});
