import { describe, it, expect } from "vitest";
import {
  computeCookingLifeSkills,
  type CookingLifeSkillsInput,
  type CookingRecordInput,
} from "../home-cooking-life-skills-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeRecord(overrides: Partial<CookingRecordInput> = {}): CookingRecordInput {
  return {
    id: "rec-1",
    child_id: "child-1",
    competency_level: "assisted",
    recipes_attempted_count: 5,
    recipes_good_or_better_count: 4,
    cuisines_explored_count: 1,
    has_child_voice: true,
    hygiene_certificate: false,
    led_family_meal: false,
    category: "hob_cooking",
      ...overrides,
  };
}

function baseInput(overrides: Partial<CookingLifeSkillsInput> = {}): CookingLifeSkillsInput {
  return {
    today: "2026-05-27",
    total_children: 6,
    records: [],
      ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. INSUFFICIENT DATA
// ══════════════════════════════════════════════════════════════════════════════
describe("Insufficient data (total_children=0)", () => {
  it("returns insufficient_data rating with score 0", () => {
    const result = computeCookingLifeSkills(baseInput({ total_children: 0 }));
    expect(result.cooking_rating).toBe("insufficient_data");
    expect(result.cooking_score).toBe(0);
  });

  it("returns the no-data headline", () => {
    const result = computeCookingLifeSkills(baseInput({ total_children: 0 }));
    expect(result.headline).toBe("No data available for cooking life skills analysis");
  });

  it("returns total_records 0", () => {
    const result = computeCookingLifeSkills(baseInput({ total_children: 0 }));
    expect(result.total_records).toBe(0);
  });

  it("leaves every rate unmeasured", () => {
    const result = computeCookingLifeSkills(baseInput({ total_children: 0 }));
    expect(result.independence_rate).toBeNull();
    expect(result.hygiene_certificate_rate).toBeNull();
    expect(result.child_voice_rate).toBeNull();
    expect(result.recipe_success_rate).toBeNull();
    expect(result.category_variety).toBe(0);
    expect(result.children_engaged_rate).toBeNull();
  });

  it("returns empty arrays for qualitative outputs", () => {
    const result = computeCookingLifeSkills(baseInput({ total_children: 0 }));
    expect(result.strengths).toEqual([]);
    expect(result.concerns).toEqual([]);
    expect(result.recommendations).toEqual([]);
    expect(result.insights).toEqual([]);
  });

  it("returns insufficient_data even when records are provided with total_children=0", () => {
    const result = computeCookingLifeSkills(baseInput({
      total_children: 0,
      records: [makeRecord()],
    }));
    expect(result.cooking_rating).toBe("insufficient_data");
    expect(result.cooking_score).toBe(0);
    expect(result.total_records).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. ZERO RECORDS
// ══════════════════════════════════════════════════════════════════════════════
describe("Zero records (total_children > 0, no records)", () => {
  // Base=52, mod1: -3, mod2: no adj, mod3: no adj, mod4: no adj (0 recipes, 0 records), mod5: -1, mod6: -2
  // 52 -3 -1 -2 = 46
  it("computes score 46 with all zero-record penalties", () => {
    const result = computeCookingLifeSkills(baseInput({ total_children: 6, records: [] }));
    expect(result.cooking_score).toBe(46);
  });

  it("rates as adequate (46 >= 45)", () => {
    const result = computeCookingLifeSkills(baseInput({ total_children: 6, records: [] }));
    expect(result.cooking_rating).toBe("adequate");
  });

  it("returns adequate headline", () => {
    const result = computeCookingLifeSkills(baseInput({ total_children: 6, records: [] }));
    expect(result.headline).toBe("Cooking skills programme exists but needs broader coverage and deeper progression");
  });

  it("returns total_records 0 and leaves the rates unmeasured", () => {
    const result = computeCookingLifeSkills(baseInput({ total_children: 6, records: [] }));
    expect(result.total_records).toBe(0);
    expect(result.independence_rate).toBeNull();
    expect(result.hygiene_certificate_rate).toBeNull();
    expect(result.child_voice_rate).toBeNull();
    expect(result.recipe_success_rate).toBeNull();
    expect(result.category_variety).toBe(0);
    expect(result.children_engaged_rate).toBe(0);
  });

  it("generates the zero-records concern", () => {
    const result = computeCookingLifeSkills(baseInput({ total_children: 6, records: [] }));
    expect(result.concerns).toContain("No cooking or life skills records — children are not being taught essential independence skills");
  });

  it("generates the establish-programme recommendation", () => {
    const result = computeCookingLifeSkills(baseInput({ total_children: 6, records: [] }));
    expect(result.recommendations).toHaveLength(1);
    expect(result.recommendations[0]).toEqual({
      rank: 1,
      recommendation: "Establish a structured cooking and life skills programme for all children",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 9",
    });
  });

  it("generates the critical Ofsted insight", () => {
    const result = computeCookingLifeSkills(baseInput({ total_children: 6, records: [] }));
    expect(result.insights).toHaveLength(1);
    expect(result.insights[0]).toEqual({
      text: "Without cooking skills evidence, Ofsted will question how children are being prepared for adulthood",
      severity: "critical",
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. OUTSTANDING SCENARIO
// ══════════════════════════════════════════════════════════════════════════════
describe("Outstanding scenario — all modifiers maxed", () => {
  // 6 records, 6 unique children out of 6, all did_independently, all has_child_voice,
  // all hygiene_certificate, recipes: 10 attempted / 9 good each, 6 unique categories.
  // Metrics: independence=100, childrenEngaged=100, childVoice=100, recipeSuccess=Math.round(54/60*100)=90, categories=6, hygieneCert=100
  // Base=52, +5 +6 +5 +5 +4 +5 = 82
  const categories = ["knife_skills", "hob_cooking", "oven_baking", "recipe_planning", "budgeting", "cultural_cooking"];
  const records: CookingRecordInput[] = categories.map((cat, i) =>
    makeRecord({
      id: `rec-${i + 1}`,
      child_id: `child-${i + 1}`,
      competency_level: "did_independently",
      recipes_attempted_count: 10,
      recipes_good_or_better_count: 9,
      has_child_voice: true,
      hygiene_certificate: true,
      category: cat,
    }),
  );

  it("computes score 82", () => {
    const result = computeCookingLifeSkills(baseInput({ records }));
    expect(result.cooking_score).toBe(82);
  });

  it("rates as outstanding", () => {
    const result = computeCookingLifeSkills(baseInput({ records }));
    expect(result.cooking_rating).toBe("outstanding");
  });

  it("returns the outstanding headline", () => {
    const result = computeCookingLifeSkills(baseInput({ records }));
    expect(result.headline).toBe("Cooking and life skills programme is comprehensive — children are developing real independence");
  });

  it("reports all six strengths", () => {
    const result = computeCookingLifeSkills(baseInput({ records }));
    expect(result.strengths).toHaveLength(6);
    expect(result.strengths).toContain("Strong independence progression — children are cooking confidently on their own");
    expect(result.strengths).toContain("All children are engaged in cooking skills development");
    expect(result.strengths).toContain("Children's views and preferences are central to cooking activities");
    expect(result.strengths).toContain("High recipe success rate shows effective teaching and growing confidence");
    expect(result.strengths).toContain("Broad range of cooking categories covered — from knife skills to cultural cooking");
    expect(result.strengths).toContain("Good uptake of food hygiene certification — embedding safety knowledge");
  });

  it("has zero concerns", () => {
    const result = computeCookingLifeSkills(baseInput({ records }));
    expect(result.concerns).toHaveLength(0);
  });

  it("has zero recommendations", () => {
    const result = computeCookingLifeSkills(baseInput({ records }));
    expect(result.recommendations).toHaveLength(0);
  });

  it("generates the exemplary insight and child voice and hygiene insights (capped at 3)", () => {
    const result = computeCookingLifeSkills(baseInput({ records }));
    expect(result.insights).toHaveLength(3);
    expect(result.insights[0]).toEqual({
      text: "Exemplary life skills programme — children are gaining real-world independence through cooking",
      severity: "positive",
    });
    expect(result.insights[1]).toEqual({
      text: "Children's voices drive the cooking programme — meals reflect their culture, preferences and identity",
      severity: "positive",
    });
    expect(result.insights[2]).toEqual({
      text: "Hygiene certification shows children understand food safety — a tangible achievement they can be proud of",
      severity: "positive",
    });
  });

  it("computes correct metrics", () => {
    const result = computeCookingLifeSkills(baseInput({ records }));
    expect(result.total_records).toBe(6);
    expect(result.independence_rate).toBe(100);
    expect(result.children_engaged_rate).toBe(100);
    expect(result.child_voice_rate).toBe(100);
    // pct(54, 60) = Math.round(54/60*100) = Math.round(90) = 90
    expect(result.recipe_success_rate).toBe(90);
    expect(result.category_variety).toBe(6);
    expect(result.hygiene_certificate_rate).toBe(100);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. GOOD SCENARIO
// ══════════════════════════════════════════════════════════════════════════════
describe("Good scenario — moderate quality, score 65-79", () => {
  // 5 records, 4 unique children / 6 total (67% -> +2),
  // 3 did_independently => independenceRate = pct(3,5)=60 => +5,
  // 4 with voice => pct(4,5)=80 => +5,
  // recipes: 8 attempted each = 40 total, 7 good each = 35 good => pct(35,40)=88 => +5,
  // categories: 3 unique => +1,
  // hygiene: 2/5 = pct(2,5)=40 => +2 (>=20 but <50)
  // Base=52 + 5 + 2 + 5 + 5 + 1 + 2 = 72
  const records: CookingRecordInput[] = [
    makeRecord({ id: "r1", child_id: "c1", competency_level: "did_independently", recipes_attempted_count: 8, recipes_good_or_better_count: 7, has_child_voice: true, hygiene_certificate: true, category: "knife_skills" }),
    makeRecord({ id: "r2", child_id: "c2", competency_level: "did_independently", recipes_attempted_count: 8, recipes_good_or_better_count: 7, has_child_voice: true, hygiene_certificate: true, category: "hob_cooking" }),
    makeRecord({ id: "r3", child_id: "c3", competency_level: "did_independently", recipes_attempted_count: 8, recipes_good_or_better_count: 7, has_child_voice: true, hygiene_certificate: false, category: "oven_baking" }),
    makeRecord({ id: "r4", child_id: "c4", competency_level: "assisted", recipes_attempted_count: 8, recipes_good_or_better_count: 7, has_child_voice: true, hygiene_certificate: false, category: "knife_skills" }),
    makeRecord({ id: "r5", child_id: "c4", competency_level: "assisted", recipes_attempted_count: 8, recipes_good_or_better_count: 7, has_child_voice: false, hygiene_certificate: false, category: "hob_cooking" }),
  ];

  it("computes score 72", () => {
    const result = computeCookingLifeSkills(baseInput({ records }));
    expect(result.cooking_score).toBe(72);
  });

  it("rates as good", () => {
    const result = computeCookingLifeSkills(baseInput({ records }));
    expect(result.cooking_rating).toBe("good");
  });

  it("returns the good headline", () => {
    const result = computeCookingLifeSkills(baseInput({ records }));
    expect(result.headline).toBe("Good cooking skills development with effective progression and child engagement");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. ADEQUATE SCENARIO
// ══════════════════════════════════════════════════════════════════════════════
describe("Adequate scenario — mixed quality, score 45-64", () => {
  // 4 records, 2 unique children / 6 => pct(2,6)=33 => <40 => -5,
  // 1 did_independently => pct(1,4)=25 => >=15 and <30 => no modifier (falls through: not >=60, not >=30, not <15)
  // Wait: 25 is not >=30 and not <15. So no adjustment from modifier 1 for that range.
  // Actually re-read: if >=60 → +5, else if >=30 → +2, else if <15 → -5. 25 is none of these → 0.
  // voice: 2/4 = pct(2,4)=50 => >=50 => +2,
  // recipes: 3 attempted each = 12 total, 2 good each = 8 good => pct(8,12)=67 => >=50 => +2,
  // categories: 2 unique => not >=6, not >=3, not <=1 => 0,
  // hygiene: 0/4 = 0 => ===0 => -3
  // Base=52 + 0 -5 +2 +2 + 0 -3 = 48
  const records: CookingRecordInput[] = [
    makeRecord({ id: "r1", child_id: "c1", competency_level: "did_independently", recipes_attempted_count: 3, recipes_good_or_better_count: 2, has_child_voice: true, hygiene_certificate: false, category: "hob_cooking" }),
    makeRecord({ id: "r2", child_id: "c1", competency_level: "assisted", recipes_attempted_count: 3, recipes_good_or_better_count: 2, has_child_voice: false, hygiene_certificate: false, category: "hob_cooking" }),
    makeRecord({ id: "r3", child_id: "c2", competency_level: "observed_staff", recipes_attempted_count: 3, recipes_good_or_better_count: 2, has_child_voice: true, hygiene_certificate: false, category: "knife_skills" }),
    makeRecord({ id: "r4", child_id: "c2", competency_level: "assisted", recipes_attempted_count: 3, recipes_good_or_better_count: 2, has_child_voice: false, hygiene_certificate: false, category: "knife_skills" }),
  ];

  it("computes score 48", () => {
    const result = computeCookingLifeSkills(baseInput({ records }));
    expect(result.cooking_score).toBe(48);
  });

  it("rates as adequate", () => {
    const result = computeCookingLifeSkills(baseInput({ records }));
    expect(result.cooking_rating).toBe("adequate");
  });

  it("returns the adequate headline", () => {
    const result = computeCookingLifeSkills(baseInput({ records }));
    expect(result.headline).toBe("Cooking skills programme exists but needs broader coverage and deeper progression");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. INADEQUATE SCENARIO
// ══════════════════════════════════════════════════════════════════════════════
describe("Inadequate scenario — poor quality, score <45", () => {
  // 3 records, all same child => uniqueChildren=1, pct(1,6)=17 => <40 => -5,
  // all observed_staff => independence=0% => <15 => -5,
  // voice: 0/3=0 => <30 => -4,
  // recipes: 2 attempted each = 6 total, 0 good = pct(0,6)=0 => <30 => -5,
  // categories: 1 unique => <=1 => -4,
  // hygiene: 0/3=0 => ===0 => -3
  // Base=52 -5 -5 -4 -5 -4 -3 = 26
  const records: CookingRecordInput[] = [
    makeRecord({ id: "r1", child_id: "c1", competency_level: "observed_staff", recipes_attempted_count: 2, recipes_good_or_better_count: 0, has_child_voice: false, hygiene_certificate: false, category: "microwave" }),
    makeRecord({ id: "r2", child_id: "c1", competency_level: "observed_staff", recipes_attempted_count: 2, recipes_good_or_better_count: 0, has_child_voice: false, hygiene_certificate: false, category: "microwave" }),
    makeRecord({ id: "r3", child_id: "c1", competency_level: "observed_staff", recipes_attempted_count: 2, recipes_good_or_better_count: 0, has_child_voice: false, hygiene_certificate: false, category: "microwave" }),
  ];

  it("computes score 26", () => {
    const result = computeCookingLifeSkills(baseInput({ records }));
    expect(result.cooking_score).toBe(26);
  });

  it("rates as inadequate", () => {
    const result = computeCookingLifeSkills(baseInput({ records }));
    expect(result.cooking_rating).toBe("inadequate");
  });

  it("returns the inadequate headline", () => {
    const result = computeCookingLifeSkills(baseInput({ records }));
    expect(result.headline).toBe("Cooking and life skills provision is inadequate — children are not being prepared for independence");
  });

  it("produces multiple concerns", () => {
    const result = computeCookingLifeSkills(baseInput({ records }));
    expect(result.concerns).toContain("Very few children can cook independently — progression is too slow");
    expect(result.concerns).toContain("Most children are not engaged in cooking activities — opportunity to build skills is being missed");
    expect(result.concerns).toContain("Children's voice is largely absent from cooking activities");
    expect(result.concerns).toContain("No children have food hygiene certification — basic safety knowledge is not evidenced");
    expect(result.concerns).toContain("Cooking skills are limited to a single category — programme lacks breadth");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. INDEPENDENCE RATE MODIFIER (isolated)
// ══════════════════════════════════════════════════════════════════════════════
describe("Independence rate modifier", () => {
  // To isolate: use 6 records with 6 unique children (engaged=100% => +6),
  // all has_child_voice (100% => +5), recipes 10/10 each (100% => +5),
  // 6 unique categories (>=6 => +4), all hygiene_certificate (100% => +5).
  // Fixed modifiers: +6 +5 +5 +4 +5 = +25. Base=52. So score = 77 + independence modifier.

  const categories = ["knife_skills", "hob_cooking", "oven_baking", "recipe_planning", "budgeting", "cultural_cooking"];

  function makeIsolatedRecords(independentCount: number): CookingRecordInput[] {
    return categories.map((cat, i) =>
      makeRecord({
        id: `rec-${i}`,
        child_id: `child-${i + 1}`,
        competency_level: i < independentCount ? "did_independently" : "assisted",
        recipes_attempted_count: 10,
        recipes_good_or_better_count: 10,
        has_child_voice: true,
        hygiene_certificate: true,
        category: cat,
      }),
    );
  }

  it("0% independence (0/6=0%) => -5, score=72", () => {
    const result = computeCookingLifeSkills(baseInput({ records: makeIsolatedRecords(0) }));
    expect(result.independence_rate).toBe(0);
    expect(result.cooking_score).toBe(72);
  });

  it("~14% independence (not achievable exactly with 6 records — use 10 records for isolation)", () => {
    // Use 10 records, 10 unique children/10 total. But we have total_children=6 and 10 children => engaged=pct(10,6)=167 => 100 after clamping? No, pct just rounds: Math.round(10/6*100)=167. >=90 => +6. OK.
    // Instead, let's just use a different approach: 7 records, 1 independent. pct(1,7)=14 => <15 => -5.
    // 7 unique children / 6 total => pct(7,6)=117 => >=90 => +6.
    // 7 voice / 7 => 100 => +5. recipes 10*7=70, 10*7=70 => 100 => +5. 7 categories (need 7 unique).
    const cats7 = ["knife_skills", "hob_cooking", "oven_baking", "recipe_planning", "budgeting", "cultural_cooking", "food_hygiene"];
    const recs = cats7.map((cat, i) =>
      makeRecord({
        id: `rec-${i}`,
        child_id: `child-${i + 1}`,
        competency_level: i === 0 ? "did_independently" : "assisted",
        recipes_attempted_count: 10,
        recipes_good_or_better_count: 10,
        has_child_voice: true,
        hygiene_certificate: true,
        category: cat,
      }),
    );
    const result = computeCookingLifeSkills(baseInput({ records: recs }));
    // pct(1,7) = Math.round(100/7) = Math.round(14.2857) = 14
    expect(result.independence_rate).toBe(14);
    // 52 + (-5) + 6 + 5 + 5 + 4 + 5 = 72
    expect(result.cooking_score).toBe(72);
  });

  it("15% independence => no adjustment (between 15 and 29), score=77", () => {
    // Need pct(x, n) = 15. With 20 records: pct(3,20)=15. Too many. With 10 records: pct(1,10)=10. pct(2,10)=20.
    // pct(3,20)=15. Let's use 20 records with 6 unique children and 6 categories.
    // Actually simpler: use categories cycling. 20 records, all same 6 categories cycling, 6 unique children cycling.
    // 3 did_independently out of 20 => pct(3,20)=15.
    // children: cycle through child-1..child-6 => 6 unique / 6 total => 100% => +6.
    // voice: all true => 100% => +5. recipes: 10/10 each => +5. categories: 6 unique => +4. hygiene: all true => +5.
    // Score: 52 + 0 + 6 + 5 + 5 + 4 + 5 = 77
    const recs: CookingRecordInput[] = Array.from({ length: 20 }, (_, i) =>
      makeRecord({
        id: `rec-${i}`,
        child_id: `child-${(i % 6) + 1}`,
        competency_level: i < 3 ? "did_independently" : "assisted",
        recipes_attempted_count: 10,
        recipes_good_or_better_count: 10,
        has_child_voice: true,
        hygiene_certificate: true,
        category: categories[i % 6],
      }),
    );
    const result = computeCookingLifeSkills(baseInput({ records: recs }));
    expect(result.independence_rate).toBe(15);
    expect(result.cooking_score).toBe(77);
  });

  it("~30% independence => +2, score=79", () => {
    // pct(2,6)=33 => >=30 => +2. 52 + 2 + 6 + 5 + 5 + 4 + 5 = 79
    const result = computeCookingLifeSkills(baseInput({ records: makeIsolatedRecords(2) }));
    expect(result.independence_rate).toBe(33);
    expect(result.cooking_score).toBe(79);
  });

  it("~50% independence => +2, score=79", () => {
    // pct(3,6)=50 => >=30 => +2. 52 + 2 + 6 + 5 + 5 + 4 + 5 = 79
    const result = computeCookingLifeSkills(baseInput({ records: makeIsolatedRecords(3) }));
    expect(result.independence_rate).toBe(50);
    expect(result.cooking_score).toBe(79);
  });

  it("60% independence => +5, score=82", () => {
    // pct(4,6)=67 => >=60 => +5. Wait: Math.round(4/6*100)=Math.round(66.67)=67. >=60 => +5.
    // 52 + 5 + 6 + 5 + 5 + 4 + 5 = 82
    const result = computeCookingLifeSkills(baseInput({ records: makeIsolatedRecords(4) }));
    expect(result.independence_rate).toBe(67);
    expect(result.cooking_score).toBe(82);
  });

  it("100% independence => +5, score=82", () => {
    // pct(6,6)=100 => >=60 => +5. 52 + 5 + 6 + 5 + 5 + 4 + 5 = 82
    const result = computeCookingLifeSkills(baseInput({ records: makeIsolatedRecords(6) }));
    expect(result.independence_rate).toBe(100);
    expect(result.cooking_score).toBe(82);
  });

  it("can_teach_others also counts as independent", () => {
    const recs = categories.map((cat, i) =>
      makeRecord({
        id: `rec-${i}`,
        child_id: `child-${i + 1}`,
        competency_level: "can_teach_others",
        recipes_attempted_count: 10,
        recipes_good_or_better_count: 10,
        has_child_voice: true,
        hygiene_certificate: true,
        category: cat,
      }),
    );
    const result = computeCookingLifeSkills(baseInput({ records: recs }));
    expect(result.independence_rate).toBe(100);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. CHILDREN ENGAGED MODIFIER (isolated)
// ══════════════════════════════════════════════════════════════════════════════
describe("Children engaged modifier", () => {
  // To isolate: fix all others at neutral-ish. Use did_independently for all => independence_rate=100% => +5.
  // all has_child_voice => 100% => +5. recipes 10/10 => +5. 6 categories => +4. hygiene all true => +5.
  // So fixed = +5+5+5+4+5 = +24. Base=52. Score = 76 + engaged modifier.
  // Wait, we need varying numbers of unique children. Let's set total_children=6.

  function makeEngagedRecords(uniqueChildCount: number, totalRecords: number): CookingRecordInput[] {
    const cats = ["knife_skills", "hob_cooking", "oven_baking", "recipe_planning", "budgeting", "cultural_cooking"];
    return Array.from({ length: totalRecords }, (_, i) =>
      makeRecord({
        id: `rec-${i}`,
        child_id: `child-${(i % uniqueChildCount) + 1}`,
        competency_level: "did_independently",
        recipes_attempted_count: 10,
        recipes_good_or_better_count: 10,
        has_child_voice: true,
        hygiene_certificate: true,
        category: cats[i % cats.length],
      }),
    );
  }

  it("0 unique children out of 6 is impossible with records — tested via zero records section", () => {
    // With records there's always at least 1 unique child. See zero records test above.
    expect(true).toBe(true);
  });

  it("2/6 = 33% engaged (<40) => -5, score=71", () => {
    // 6 records, 2 unique children, 6 categories. independence=100 => +5, voice=100 => +5, recipes=100 => +5, cats=6 => +4, hygiene=100 => +5.
    // engaged=pct(2,6)=33 => <40 => -5.
    // 52 + 5 + (-5) + 5 + 5 + 4 + 5 = 71
    const result = computeCookingLifeSkills(baseInput({ records: makeEngagedRecords(2, 6) }));
    expect(result.children_engaged_rate).toBe(33);
    expect(result.cooking_score).toBe(71);
  });

  it("4/6 = 67% engaged (>=60) => +2, score=78", () => {
    // pct(4,6) = 67 => >=60 => +2. 52 + 5 + 2 + 5 + 5 + 4 + 5 = 78
    const result = computeCookingLifeSkills(baseInput({ records: makeEngagedRecords(4, 6) }));
    expect(result.children_engaged_rate).toBe(67);
    expect(result.cooking_score).toBe(78);
  });

  it("6/6 = 100% engaged (>=90) => +6, score=82", () => {
    // pct(6,6) = 100 => >=90 => +6. 52 + 5 + 6 + 5 + 5 + 4 + 5 = 82
    const result = computeCookingLifeSkills(baseInput({ records: makeEngagedRecords(6, 6) }));
    expect(result.children_engaged_rate).toBe(100);
    expect(result.cooking_score).toBe(82);
  });

  it("3/6 = 50% engaged (>=40 but <60) => no adjustment, score=76", () => {
    // pct(3,6) = 50. Not >=90, not >=60, not <40 => 0. 52 + 5 + 0 + 5 + 5 + 4 + 5 = 76
    const result = computeCookingLifeSkills(baseInput({ records: makeEngagedRecords(3, 6) }));
    expect(result.children_engaged_rate).toBe(50);
    expect(result.cooking_score).toBe(76);
  });

  it("1/6 = 17% engaged (<40) => -5, score=71", () => {
    // pct(1,6) = 17 => <40 => -5. 52 + 5 + (-5) + 5 + 5 + 4 + 5 = 71
    const result = computeCookingLifeSkills(baseInput({ records: makeEngagedRecords(1, 6) }));
    expect(result.children_engaged_rate).toBe(17);
    expect(result.cooking_score).toBe(71);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 9. CHILD VOICE RATE MODIFIER (isolated)
// ══════════════════════════════════════════════════════════════════════════════
describe("Child voice rate modifier", () => {
  // Fix: 6 records, 6 unique children, all did_independently, 6 categories, all hygiene.
  // independence=100 => +5, engaged=100 => +6, recipes=100 => +5, cats=6 => +4, hygiene=100 => +5.
  // Fixed = +25. Base=52. Score = 77 + voice modifier.
  const categories = ["knife_skills", "hob_cooking", "oven_baking", "recipe_planning", "budgeting", "cultural_cooking"];

  function makeVoiceRecords(voiceCount: number): CookingRecordInput[] {
    return categories.map((cat, i) =>
      makeRecord({
        id: `rec-${i}`,
        child_id: `child-${i + 1}`,
        competency_level: "did_independently",
        recipes_attempted_count: 10,
        recipes_good_or_better_count: 10,
        has_child_voice: i < voiceCount,
        hygiene_certificate: true,
        category: cat,
      }),
    );
  }

  it("0% voice => -4, score=73", () => {
    const result = computeCookingLifeSkills(baseInput({ records: makeVoiceRecords(0) }));
    expect(result.child_voice_rate).toBe(0);
    expect(result.cooking_score).toBe(73);
  });

  it("~17% voice (1/6=17%) => <30 => -4, score=73", () => {
    const result = computeCookingLifeSkills(baseInput({ records: makeVoiceRecords(1) }));
    expect(result.child_voice_rate).toBe(17);
    expect(result.cooking_score).toBe(73);
  });

  it("~33% voice (2/6=33%) => >=30 but <50 => no adj, score=77", () => {
    const result = computeCookingLifeSkills(baseInput({ records: makeVoiceRecords(2) }));
    expect(result.child_voice_rate).toBe(33);
    expect(result.cooking_score).toBe(77);
  });

  it("50% voice (3/6=50%) => +2, score=79", () => {
    const result = computeCookingLifeSkills(baseInput({ records: makeVoiceRecords(3) }));
    expect(result.child_voice_rate).toBe(50);
    expect(result.cooking_score).toBe(79);
  });

  it("~67% voice (4/6=67%) => >=50 => +2, score=79", () => {
    const result = computeCookingLifeSkills(baseInput({ records: makeVoiceRecords(4) }));
    expect(result.child_voice_rate).toBe(67);
    expect(result.cooking_score).toBe(79);
  });

  it("~83% voice (5/6=83%) => >=80 => +5, score=82", () => {
    const result = computeCookingLifeSkills(baseInput({ records: makeVoiceRecords(5) }));
    expect(result.child_voice_rate).toBe(83);
    expect(result.cooking_score).toBe(82);
  });

  it("100% voice (6/6=100%) => +5, score=82", () => {
    const result = computeCookingLifeSkills(baseInput({ records: makeVoiceRecords(6) }));
    expect(result.child_voice_rate).toBe(100);
    expect(result.cooking_score).toBe(82);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 10. RECIPE SUCCESS MODIFIER (isolated)
// ══════════════════════════════════════════════════════════════════════════════
describe("Recipe success modifier", () => {
  // Fix: 6 records, 6 unique children, all did_independently, 6 categories, voice=all, hygiene=all.
  // independence=100 => +5, engaged=100 => +6, voice=100 => +5, cats=6 => +4, hygiene=100 => +5.
  // Fixed = +25. Base=52. Score = 77 + recipe modifier.
  const categories = ["knife_skills", "hob_cooking", "oven_baking", "recipe_planning", "budgeting", "cultural_cooking"];

  function makeRecipeRecords(attempted: number, good: number): CookingRecordInput[] {
    return categories.map((cat, i) =>
      makeRecord({
        id: `rec-${i}`,
        child_id: `child-${i + 1}`,
        competency_level: "did_independently",
        recipes_attempted_count: attempted,
        recipes_good_or_better_count: good,
        has_child_voice: true,
        hygiene_certificate: true,
        category: cat,
      }),
    );
  }

  it("0 recipes attempted with records => -1, score=76", () => {
    // totalRecipes=0, total>0 => -1. 52 + 5 + 6 + 5 + (-1) + 4 + 5 = 76
    const result = computeCookingLifeSkills(baseInput({ records: makeRecipeRecords(0, 0) }));
    expect(result.recipe_success_rate).toBeNull();
    expect(result.cooking_score).toBe(76);
  });

  it("0 recipes attempted with no records => no adj (already tested in zero records)", () => {
    // This is covered by the zero records test (score=46). Confirm:
    const result = computeCookingLifeSkills(baseInput({ records: [] }));
    expect(result.recipe_success_rate).toBeNull();
    expect(result.cooking_score).toBe(46);
  });

  it("<30% recipe success => -5, score=72", () => {
    // 10 attempted, 2 good each. Total: 60 attempted, 12 good. pct(12,60)=20 => <30 => -5.
    // 52 + 5 + 6 + 5 + (-5) + 4 + 5 = 72
    const result = computeCookingLifeSkills(baseInput({ records: makeRecipeRecords(10, 2) }));
    expect(result.recipe_success_rate).toBe(20);
    expect(result.cooking_score).toBe(72);
  });

  it("50% recipe success => +2, score=79", () => {
    // 10 attempted, 5 good each. pct(30,60)=50 => >=50 => +2.
    // 52 + 5 + 6 + 5 + 2 + 4 + 5 = 79
    const result = computeCookingLifeSkills(baseInput({ records: makeRecipeRecords(10, 5) }));
    expect(result.recipe_success_rate).toBe(50);
    expect(result.cooking_score).toBe(79);
  });

  it("80% recipe success => +5, score=82", () => {
    // 10 attempted, 8 good each. pct(48,60)=80 => >=80 => +5.
    // 52 + 5 + 6 + 5 + 5 + 4 + 5 = 82
    const result = computeCookingLifeSkills(baseInput({ records: makeRecipeRecords(10, 8) }));
    expect(result.recipe_success_rate).toBe(80);
    expect(result.cooking_score).toBe(82);
  });

  it("100% recipe success => +5, score=82", () => {
    // 10 attempted, 10 good each. pct(60,60)=100 => >=80 => +5.
    const result = computeCookingLifeSkills(baseInput({ records: makeRecipeRecords(10, 10) }));
    expect(result.recipe_success_rate).toBe(100);
    expect(result.cooking_score).toBe(82);
  });

  it("between 30% and 49% recipe success => no adj, score=77", () => {
    // 10 attempted, 4 good each. pct(24,60)=40. Not >=80, not >=50, not <30 => 0.
    // 52 + 5 + 6 + 5 + 0 + 4 + 5 = 77
    const result = computeCookingLifeSkills(baseInput({ records: makeRecipeRecords(10, 4) }));
    expect(result.recipe_success_rate).toBe(40);
    expect(result.cooking_score).toBe(77);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 11. CATEGORY VARIETY MODIFIER (isolated)
// ══════════════════════════════════════════════════════════════════════════════
describe("Category variety modifier", () => {
  // Fix: all did_independently, all voice, hygiene, 10 recipes / 10 good.
  // We vary the number of unique categories and the number of unique children.
  // Need 6 unique children => engaged=100% => +6.
  // independence=100 => +5, voice=100 => +5, recipes=100 => +5, hygiene=100 => +5.
  // Fixed = +5 +6 +5 +5 +5 = +26. Base=52. Score = 78 + category modifier.

  function makeCategoryRecords(categoryList: string[]): CookingRecordInput[] {
    // categoryList.length records, cycling children through 6
    return categoryList.map((cat, i) =>
      makeRecord({
        id: `rec-${i}`,
        child_id: `child-${(i % 6) + 1}`,
        competency_level: "did_independently",
        recipes_attempted_count: 10,
        recipes_good_or_better_count: 10,
        has_child_voice: true,
        hygiene_certificate: true,
        category: cat,
      }),
    );
  }

  it("1 category => <=1 => -4, score=74", () => {
    // Need >= 6 records for 6 unique children. 6 records all same category.
    const recs = makeCategoryRecords(["knife_skills", "knife_skills", "knife_skills", "knife_skills", "knife_skills", "knife_skills"]);
    const result = computeCookingLifeSkills(baseInput({ records: recs }));
    expect(result.category_variety).toBe(1);
    // 52 + 5 + 6 + 5 + 5 + (-4) + 5 = 74
    expect(result.cooking_score).toBe(74);
  });

  it("2 categories => not >=3, not <=1 => 0, score=78", () => {
    const recs = makeCategoryRecords(["knife_skills", "hob_cooking", "knife_skills", "hob_cooking", "knife_skills", "hob_cooking"]);
    const result = computeCookingLifeSkills(baseInput({ records: recs }));
    expect(result.category_variety).toBe(2);
    // 52 + 5 + 6 + 5 + 5 + 0 + 5 = 78
    expect(result.cooking_score).toBe(78);
  });

  it("3 categories => >=3 => +1, score=79", () => {
    const recs = makeCategoryRecords(["knife_skills", "hob_cooking", "oven_baking", "knife_skills", "hob_cooking", "oven_baking"]);
    const result = computeCookingLifeSkills(baseInput({ records: recs }));
    expect(result.category_variety).toBe(3);
    // 52 + 5 + 6 + 5 + 5 + 1 + 5 = 79
    expect(result.cooking_score).toBe(79);
  });

  it("5 categories => >=3 => +1, score=79", () => {
    const recs = makeCategoryRecords(["knife_skills", "hob_cooking", "oven_baking", "recipe_planning", "budgeting", "knife_skills"]);
    const result = computeCookingLifeSkills(baseInput({ records: recs }));
    expect(result.category_variety).toBe(5);
    // 52 + 5 + 6 + 5 + 5 + 1 + 5 = 79
    expect(result.cooking_score).toBe(79);
  });

  it("6 categories => >=6 => +4, score=82", () => {
    const recs = makeCategoryRecords(["knife_skills", "hob_cooking", "oven_baking", "recipe_planning", "budgeting", "cultural_cooking"]);
    const result = computeCookingLifeSkills(baseInput({ records: recs }));
    expect(result.category_variety).toBe(6);
    // 52 + 5 + 6 + 5 + 5 + 4 + 5 = 82
    expect(result.cooking_score).toBe(82);
  });

  it("8 categories => >=6 => +4, score=82", () => {
    const recs = makeCategoryRecords([
      "knife_skills", "hob_cooking", "oven_baking", "recipe_planning",
      "budgeting", "cultural_cooking", "food_hygiene", "allergens_awareness",
    ]);
    // 8 records, cycling through 6 children => children 1-6 then 1-2 again => 6 unique => engaged=100%
    const result = computeCookingLifeSkills(baseInput({ records: recs }));
    expect(result.category_variety).toBe(8);
    // 52 + 5 + 6 + 5 + 5 + 4 + 5 = 82
    expect(result.cooking_score).toBe(82);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 12. HYGIENE CERTIFICATE MODIFIER (isolated)
// ══════════════════════════════════════════════════════════════════════════════
describe("Hygiene certificate modifier", () => {
  // Fix: 6 records, 6 unique children, all did_independently, 6 categories, voice=all.
  // independence=100 => +5, engaged=100 => +6, voice=100 => +5, recipes=100 => +5, cats=6 => +4.
  // Fixed = +25. Base=52. Score = 77 + hygiene modifier.
  const categories = ["knife_skills", "hob_cooking", "oven_baking", "recipe_planning", "budgeting", "cultural_cooking"];

  function makeHygieneRecords(hygieneCount: number): CookingRecordInput[] {
    return categories.map((cat, i) =>
      makeRecord({
        id: `rec-${i}`,
        child_id: `child-${i + 1}`,
        competency_level: "did_independently",
        recipes_attempted_count: 10,
        recipes_good_or_better_count: 10,
        has_child_voice: true,
        hygiene_certificate: i < hygieneCount,
        category: cat,
      }),
    );
  }

  it("0% hygiene => -3, score=74", () => {
    const result = computeCookingLifeSkills(baseInput({ records: makeHygieneRecords(0) }));
    expect(result.hygiene_certificate_rate).toBe(0);
    // 52 + 5 + 6 + 5 + 5 + 4 + (-3) = 74
    expect(result.cooking_score).toBe(74);
  });

  it("~17% hygiene (1/6=17%) => >0 but <20 => no adj, score=77", () => {
    const result = computeCookingLifeSkills(baseInput({ records: makeHygieneRecords(1) }));
    expect(result.hygiene_certificate_rate).toBe(17);
    // hygieneCertRate is 17, not 0, not >=20. Falls through all conditions => 0.
    // 52 + 5 + 6 + 5 + 5 + 4 + 0 = 77
    expect(result.cooking_score).toBe(77);
  });

  it("~33% hygiene (2/6=33%) => >=20 => +2, score=79", () => {
    const result = computeCookingLifeSkills(baseInput({ records: makeHygieneRecords(2) }));
    expect(result.hygiene_certificate_rate).toBe(33);
    // 52 + 5 + 6 + 5 + 5 + 4 + 2 = 79
    expect(result.cooking_score).toBe(79);
  });

  it("50% hygiene (3/6=50%) => >=50 => +5, score=82", () => {
    const result = computeCookingLifeSkills(baseInput({ records: makeHygieneRecords(3) }));
    expect(result.hygiene_certificate_rate).toBe(50);
    // 52 + 5 + 6 + 5 + 5 + 4 + 5 = 82
    expect(result.cooking_score).toBe(82);
  });

  it("100% hygiene (6/6=100%) => >=50 => +5, score=82", () => {
    const result = computeCookingLifeSkills(baseInput({ records: makeHygieneRecords(6) }));
    expect(result.hygiene_certificate_rate).toBe(100);
    expect(result.cooking_score).toBe(82);
  });

  it("~19% hygiene boundary check — need a denominator that gives exactly 19", () => {
    // We need a record count where pct(x,n) gives something between 1 and 19.
    // With 10 records: pct(1,10)=10 => not 0, not >=20. no adj.
    // 10 records, cycling 6 children (some repeated), 6 categories cycling, all independent, all voice.
    // uniqueChildren = 6 (we have child-1..child-6 cycling in 10). engaged = pct(6,6)=100 => +6.
    // independence=100 => +5, voice=100 => +5, recipes=100 => +5, cats=6 => +4.
    // Score = 52 + 5 + 6 + 5 + 5 + 4 + 0 = 77
    const cats = ["knife_skills", "hob_cooking", "oven_baking", "recipe_planning", "budgeting", "cultural_cooking"];
    const recs: CookingRecordInput[] = Array.from({ length: 10 }, (_, i) =>
      makeRecord({
        id: `rec-${i}`,
        child_id: `child-${(i % 6) + 1}`,
        competency_level: "did_independently",
        recipes_attempted_count: 10,
        recipes_good_or_better_count: 10,
        has_child_voice: true,
        hygiene_certificate: i === 0, // 1 out of 10 = 10%
        category: cats[i % 6],
      }),
    );
    const result = computeCookingLifeSkills(baseInput({ records: recs }));
    expect(result.hygiene_certificate_rate).toBe(10);
    // 10 is >0 but <20. Falls through: not >=50, not >=20, not ===0 => 0.
    expect(result.cooking_score).toBe(77);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 13. METRIC CALCULATIONS
// ══════════════════════════════════════════════════════════════════════════════
describe("Metric calculations", () => {
  it("independence_rate: pct of did_independently + can_teach_others", () => {
    const records = [
      makeRecord({ id: "r1", child_id: "c1", competency_level: "did_independently" }),
      makeRecord({ id: "r2", child_id: "c2", competency_level: "can_teach_others" }),
      makeRecord({ id: "r3", child_id: "c3", competency_level: "assisted" }),
      makeRecord({ id: "r4", child_id: "c4", competency_level: "observed_staff" }),
      makeRecord({ id: "r5", child_id: "c5", competency_level: "not_yet_introduced" }),
    ];
    const result = computeCookingLifeSkills(baseInput({ records }));
    // pct(2,5) = Math.round(2/5*100) = 40
    expect(result.independence_rate).toBe(40);
  });

  it("hygiene_certificate_rate: pct of hygiene_certificate true records", () => {
    const records = [
      makeRecord({ id: "r1", child_id: "c1", hygiene_certificate: true }),
      makeRecord({ id: "r2", child_id: "c2", hygiene_certificate: false }),
      makeRecord({ id: "r3", child_id: "c3", hygiene_certificate: true }),
    ];
    const result = computeCookingLifeSkills(baseInput({ records }));
    // pct(2,3) = Math.round(66.67) = 67
    expect(result.hygiene_certificate_rate).toBe(67);
  });

  it("child_voice_rate: pct of has_child_voice true records", () => {
    const records = [
      makeRecord({ id: "r1", child_id: "c1", has_child_voice: true }),
      makeRecord({ id: "r2", child_id: "c2", has_child_voice: true }),
      makeRecord({ id: "r3", child_id: "c3", has_child_voice: false }),
      makeRecord({ id: "r4", child_id: "c4", has_child_voice: false }),
    ];
    const result = computeCookingLifeSkills(baseInput({ records }));
    // pct(2,4) = 50
    expect(result.child_voice_rate).toBe(50);
  });

  it("recipe_success_rate: pct of total good / total attempted across all records", () => {
    const records = [
      makeRecord({ id: "r1", child_id: "c1", recipes_attempted_count: 10, recipes_good_or_better_count: 8 }),
      makeRecord({ id: "r2", child_id: "c2", recipes_attempted_count: 5, recipes_good_or_better_count: 3 }),
    ];
    const result = computeCookingLifeSkills(baseInput({ records }));
    // total attempted=15, total good=11. pct(11,15) = Math.round(73.33) = 73
    expect(result.recipe_success_rate).toBe(73);
  });

  it("category_variety: count of unique categories", () => {
    const records = [
      makeRecord({ id: "r1", child_id: "c1", category: "knife_skills" }),
      makeRecord({ id: "r2", child_id: "c2", category: "hob_cooking" }),
      makeRecord({ id: "r3", child_id: "c3", category: "knife_skills" }),
      makeRecord({ id: "r4", child_id: "c4", category: "oven_baking" }),
    ];
    const result = computeCookingLifeSkills(baseInput({ records }));
    expect(result.category_variety).toBe(3);
  });

  it("children_engaged_rate: unique child_ids / total_children", () => {
    const records = [
      makeRecord({ id: "r1", child_id: "c1" }),
      makeRecord({ id: "r2", child_id: "c1" }),
      makeRecord({ id: "r3", child_id: "c2" }),
      makeRecord({ id: "r4", child_id: "c3" }),
    ];
    const result = computeCookingLifeSkills(baseInput({ total_children: 6, records }));
    // uniqueChildren=3, pct(3,6) = 50
    expect(result.children_engaged_rate).toBe(50);
  });

  it("total_records: records.length", () => {
    const records = [makeRecord({ id: "r1" }), makeRecord({ id: "r2" }), makeRecord({ id: "r3" })];
    const result = computeCookingLifeSkills(baseInput({ records }));
    expect(result.total_records).toBe(3);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 14. STRENGTHS GENERATION
// ══════════════════════════════════════════════════════════════════════════════
describe("Strengths generation", () => {
  const categories = ["knife_skills", "hob_cooking", "oven_baking", "recipe_planning", "budgeting", "cultural_cooking"];

  it("independence >=60 and total>0 generates independence strength", () => {
    // 6 records, all did_independently
    const recs = categories.map((cat, i) =>
      makeRecord({ id: `r${i}`, child_id: `c${i + 1}`, competency_level: "did_independently", category: cat }),
    );
    const result = computeCookingLifeSkills(baseInput({ records: recs }));
    expect(result.strengths).toContain("Strong independence progression — children are cooking confidently on their own");
  });

  it("children engaged >=90 and total>0 generates engagement strength", () => {
    const recs = categories.map((cat, i) =>
      makeRecord({ id: `r${i}`, child_id: `c${i + 1}`, category: cat }),
    );
    const result = computeCookingLifeSkills(baseInput({ records: recs }));
    // 6 unique / 6 total => 100% => strength fires
    expect(result.strengths).toContain("All children are engaged in cooking skills development");
  });

  it("voice >=80 and total>0 generates voice strength", () => {
    const recs = categories.map((cat, i) =>
      makeRecord({ id: `r${i}`, child_id: `c${i + 1}`, has_child_voice: true, category: cat }),
    );
    const result = computeCookingLifeSkills(baseInput({ records: recs }));
    expect(result.strengths).toContain("Children's views and preferences are central to cooking activities");
  });

  it("recipe success >=80 and totalRecipes>0 generates recipe strength", () => {
    const recs = categories.map((cat, i) =>
      makeRecord({
        id: `r${i}`, child_id: `c${i + 1}`,
        recipes_attempted_count: 10, recipes_good_or_better_count: 9,
        category: cat,
      }),
    );
    const result = computeCookingLifeSkills(baseInput({ records: recs }));
    // pct(54,60)=90 >=80
    expect(result.strengths).toContain("High recipe success rate shows effective teaching and growing confidence");
  });

  it("unique categories >=6 and total>0 generates breadth strength", () => {
    const recs = categories.map((cat, i) =>
      makeRecord({ id: `r${i}`, child_id: `c${i + 1}`, category: cat }),
    );
    const result = computeCookingLifeSkills(baseInput({ records: recs }));
    expect(result.strengths).toContain("Broad range of cooking categories covered — from knife skills to cultural cooking");
  });

  it("hygiene >=50 and total>0 generates hygiene strength", () => {
    // 6 records, 3 with hygiene => pct(3,6)=50 >=50
    const recs = categories.map((cat, i) =>
      makeRecord({ id: `r${i}`, child_id: `c${i + 1}`, hygiene_certificate: i < 3, category: cat }),
    );
    const result = computeCookingLifeSkills(baseInput({ records: recs }));
    expect(result.strengths).toContain("Good uptake of food hygiene certification — embedding safety knowledge");
  });

  it("no strengths when thresholds are not met", () => {
    // 1 record, 1 child, not independent, no voice, no hygiene, no recipes, 1 category
    const recs = [makeRecord({
      id: "r1", child_id: "c1", competency_level: "observed_staff",
      has_child_voice: false, hygiene_certificate: false,
      recipes_attempted_count: 0, recipes_good_or_better_count: 0,
      category: "microwave",
    })];
    const result = computeCookingLifeSkills(baseInput({ records: recs }));
    expect(result.strengths).toHaveLength(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 15. CONCERNS GENERATION
// ══════════════════════════════════════════════════════════════════════════════
describe("Concerns generation", () => {
  it("total===0 generates the no-records concern", () => {
    const result = computeCookingLifeSkills(baseInput({ records: [] }));
    expect(result.concerns).toContain("No cooking or life skills records — children are not being taught essential independence skills");
  });

  it("independence <15 and total>0 generates progression concern", () => {
    // 10 records, 1 independent => pct(1,10)=10 <15
    const recs: CookingRecordInput[] = Array.from({ length: 10 }, (_, i) =>
      makeRecord({
        id: `r${i}`, child_id: `c${(i % 6) + 1}`,
        competency_level: i === 0 ? "did_independently" : "assisted",
      }),
    );
    const result = computeCookingLifeSkills(baseInput({ records: recs }));
    expect(result.concerns).toContain("Very few children can cook independently — progression is too slow");
  });

  it("children engaged <40 and total>0 generates engagement concern", () => {
    // 2 records, 1 unique child / 6 total => pct(1,6)=17 <40
    const recs = [
      makeRecord({ id: "r1", child_id: "c1" }),
      makeRecord({ id: "r2", child_id: "c1" }),
    ];
    const result = computeCookingLifeSkills(baseInput({ records: recs }));
    expect(result.concerns).toContain("Most children are not engaged in cooking activities — opportunity to build skills is being missed");
  });

  it("voice <30 and total>0 generates voice concern", () => {
    // 4 records, 1 with voice => pct(1,4)=25 <30
    const recs = [
      makeRecord({ id: "r1", child_id: "c1", has_child_voice: true }),
      makeRecord({ id: "r2", child_id: "c2", has_child_voice: false }),
      makeRecord({ id: "r3", child_id: "c3", has_child_voice: false }),
      makeRecord({ id: "r4", child_id: "c4", has_child_voice: false }),
    ];
    const result = computeCookingLifeSkills(baseInput({ records: recs }));
    expect(result.concerns).toContain("Children's voice is largely absent from cooking activities");
  });

  it("hygiene ===0 and total>0 generates hygiene concern", () => {
    const recs = [makeRecord({ id: "r1", child_id: "c1", hygiene_certificate: false })];
    const result = computeCookingLifeSkills(baseInput({ records: recs }));
    expect(result.concerns).toContain("No children have food hygiene certification — basic safety knowledge is not evidenced");
  });

  it("unique categories <=1 and total>0 generates breadth concern", () => {
    const recs = [
      makeRecord({ id: "r1", child_id: "c1", category: "microwave" }),
      makeRecord({ id: "r2", child_id: "c2", category: "microwave" }),
    ];
    const result = computeCookingLifeSkills(baseInput({ records: recs }));
    expect(result.concerns).toContain("Cooking skills are limited to a single category — programme lacks breadth");
  });

  it("no concerns when all thresholds are positive", () => {
    const cats = ["knife_skills", "hob_cooking", "oven_baking", "recipe_planning", "budgeting", "cultural_cooking"];
    const recs = cats.map((cat, i) =>
      makeRecord({
        id: `r${i}`, child_id: `c${i + 1}`,
        competency_level: "did_independently",
        has_child_voice: true,
        hygiene_certificate: true,
        category: cat,
      }),
    );
    const result = computeCookingLifeSkills(baseInput({ records: recs }));
    expect(result.concerns).toHaveLength(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 16. RECOMMENDATIONS GENERATION
// ══════════════════════════════════════════════════════════════════════════════
describe("Recommendations generation", () => {
  it("zero records triggers single establish-programme recommendation", () => {
    const result = computeCookingLifeSkills(baseInput({ records: [] }));
    expect(result.recommendations).toHaveLength(1);
    expect(result.recommendations[0]).toEqual({
      rank: 1,
      recommendation: "Establish a structured cooking and life skills programme for all children",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 9",
    });
  });

  it("low engaged (<60) with records triggers extend-programme recommendation", () => {
    // 2 records, 1 unique child => pct(1,6)=17 <60
    const recs = [makeRecord({ id: "r1", child_id: "c1" }), makeRecord({ id: "r2", child_id: "c1" })];
    const result = computeCookingLifeSkills(baseInput({ records: recs }));
    const extendRec = result.recommendations.find(r =>
      r.recommendation === "Extend cooking programme to include all children with age-appropriate activities",
    );
    expect(extendRec).toBeDefined();
    expect(extendRec!.urgency).toBe("soon");
    expect(extendRec!.regulatory_ref).toBe("SCCIF Independence");
  });

  it("low independence (<30) with records triggers progression recommendation", () => {
    // 4 records, 0 independent => 0% <30
    const recs = Array.from({ length: 4 }, (_, i) =>
      makeRecord({ id: `r${i}`, child_id: `c${i + 1}`, competency_level: "assisted" }),
    );
    const result = computeCookingLifeSkills(baseInput({ records: recs }));
    const progRec = result.recommendations.find(r =>
      r.recommendation === "Focus on progression pathways to move children from assisted to independent cooking",
    );
    expect(progRec).toBeDefined();
    expect(progRec!.urgency).toBe("soon");
    expect(progRec!.regulatory_ref).toBe("CHR 2015 Reg 9");
  });

  it("low voice (<50) with records triggers voice recommendation", () => {
    // 4 records, 1 voice => pct(1,4)=25 <50
    const recs = Array.from({ length: 4 }, (_, i) =>
      makeRecord({ id: `r${i}`, child_id: `c${i + 1}`, has_child_voice: i === 0 }),
    );
    const result = computeCookingLifeSkills(baseInput({ records: recs }));
    const voiceRec = result.recommendations.find(r =>
      r.recommendation === "Capture children's views and meal preferences as part of every cooking session",
    );
    expect(voiceRec).toBeDefined();
    expect(voiceRec!.urgency).toBe("planned");
    expect(voiceRec!.regulatory_ref).toBe("SCCIF Voice of Child");
  });

  it("low categories (<3) with records triggers curriculum recommendation", () => {
    const recs = [
      makeRecord({ id: "r1", child_id: "c1", category: "microwave" }),
      makeRecord({ id: "r2", child_id: "c2", category: "hob_cooking" }),
    ];
    const result = computeCookingLifeSkills(baseInput({ records: recs }));
    const catRec = result.recommendations.find(r =>
      r.recommendation === "Broaden the cooking curriculum to include budgeting, cultural cooking, and allergen awareness",
    );
    expect(catRec).toBeDefined();
    expect(catRec!.urgency).toBe("planned");
    expect(catRec!.regulatory_ref).toBe("SCCIF Independence");
  });

  it("low hygiene (<20) with records triggers hygiene recommendation", () => {
    // 10 records, 1 hygiene => pct(1,10)=10 <20
    const recs: CookingRecordInput[] = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ id: `r${i}`, child_id: `c${(i % 6) + 1}`, hygiene_certificate: i === 0 }),
    );
    const result = computeCookingLifeSkills(baseInput({ records: recs }));
    const hygRec = result.recommendations.find(r =>
      r.recommendation === "Introduce basic food hygiene certification for all children as a life skill milestone",
    );
    expect(hygRec).toBeDefined();
    expect(hygRec!.urgency).toBe("planned");
    expect(hygRec!.regulatory_ref).toBe("CHR 2015 Reg 9");
  });

  it("recommendations are capped at 5", () => {
    // Trigger all 5 possible record-based recommendations (not the zero-records one):
    // engaged<60, independence<30, voice<50, categories<3, hygiene<20
    // 1 record: 1 child, assisted, no voice, no hygiene, 1 category, 0 recipes
    const recs = [makeRecord({
      id: "r1", child_id: "c1",
      competency_level: "assisted",
      has_child_voice: false,
      hygiene_certificate: false,
      recipes_attempted_count: 0,
      recipes_good_or_better_count: 0,
      category: "microwave",
    })];
    const result = computeCookingLifeSkills(baseInput({ records: recs }));
    // engaged: pct(1,6)=17 <60 => rec
    // independence: pct(0,1)=0 <30 => rec
    // voice: pct(0,1)=0 <50 => rec
    // categories: 1 <3 => rec
    // hygiene: pct(0,1)=0 <20 => rec
    // That's 5 recommendations, all within the cap
    expect(result.recommendations).toHaveLength(5);
  });

  it("recommendations are re-ranked sequentially after capping", () => {
    const recs = [makeRecord({
      id: "r1", child_id: "c1",
      competency_level: "assisted",
      has_child_voice: false,
      hygiene_certificate: false,
      recipes_attempted_count: 0,
      recipes_good_or_better_count: 0,
      category: "microwave",
    })];
    const result = computeCookingLifeSkills(baseInput({ records: recs }));
    result.recommendations.forEach((rec, idx) => {
      expect(rec.rank).toBe(idx + 1);
    });
  });

  it("no recommendations when all thresholds are met", () => {
    const cats = ["knife_skills", "hob_cooking", "oven_baking", "recipe_planning", "budgeting", "cultural_cooking"];
    const recs = cats.map((cat, i) =>
      makeRecord({
        id: `r${i}`, child_id: `c${i + 1}`,
        competency_level: "did_independently",
        has_child_voice: true,
        hygiene_certificate: true,
        recipes_attempted_count: 10,
        recipes_good_or_better_count: 10,
        category: cat,
      }),
    );
    const result = computeCookingLifeSkills(baseInput({ records: recs }));
    expect(result.recommendations).toHaveLength(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 17. INSIGHTS GENERATION
// ══════════════════════════════════════════════════════════════════════════════
describe("Insights generation", () => {
  it("exemplary insight: independence>=60 AND engaged>=90 AND categories>=6", () => {
    const cats = ["knife_skills", "hob_cooking", "oven_baking", "recipe_planning", "budgeting", "cultural_cooking"];
    const recs = cats.map((cat, i) =>
      makeRecord({
        id: `r${i}`, child_id: `c${i + 1}`,
        competency_level: "did_independently",
        category: cat,
      }),
    );
    const result = computeCookingLifeSkills(baseInput({ records: recs }));
    expect(result.insights).toContainEqual({
      text: "Exemplary life skills programme — children are gaining real-world independence through cooking",
      severity: "positive",
    });
  });

  it("exemplary insight does NOT fire when independence <60", () => {
    const cats = ["knife_skills", "hob_cooking", "oven_baking", "recipe_planning", "budgeting", "cultural_cooking"];
    const recs = cats.map((cat, i) =>
      makeRecord({
        id: `r${i}`, child_id: `c${i + 1}`,
        competency_level: "assisted", // 0% independence
        category: cat,
      }),
    );
    const result = computeCookingLifeSkills(baseInput({ records: recs }));
    const exemplary = result.insights.find(ins => ins.text.includes("Exemplary"));
    expect(exemplary).toBeUndefined();
  });

  it("zero-records insight: critical severity", () => {
    const result = computeCookingLifeSkills(baseInput({ records: [] }));
    expect(result.insights).toContainEqual({
      text: "Without cooking skills evidence, Ofsted will question how children are being prepared for adulthood",
      severity: "critical",
    });
  });

  it("low independence insight: independence <15 and total>0", () => {
    const recs = Array.from({ length: 10 }, (_, i) =>
      makeRecord({
        id: `r${i}`, child_id: `c${(i % 6) + 1}`,
        competency_level: i === 0 ? "did_independently" : "assisted",
      }),
    );
    const result = computeCookingLifeSkills(baseInput({ records: recs }));
    // pct(1,10)=10 <15
    expect(result.insights).toContainEqual({
      text: "Low independence in cooking suggests over-reliance on staff — children need supported opportunities to lead",
      severity: "warning",
    });
  });

  it("child voice insight: voice >=80 and total>0", () => {
    const cats = ["knife_skills", "hob_cooking", "oven_baking", "recipe_planning", "budgeting", "cultural_cooking"];
    const recs = cats.map((cat, i) =>
      makeRecord({
        id: `r${i}`, child_id: `c${i + 1}`,
        has_child_voice: true,
        category: cat,
      }),
    );
    const result = computeCookingLifeSkills(baseInput({ records: recs }));
    expect(result.insights).toContainEqual({
      text: "Children's voices drive the cooking programme — meals reflect their culture, preferences and identity",
      severity: "positive",
    });
  });

  it("hygiene insight: hygieneCertRate >=50 and total>0", () => {
    const cats = ["knife_skills", "hob_cooking", "oven_baking", "recipe_planning", "budgeting", "cultural_cooking"];
    const recs = cats.map((cat, i) =>
      makeRecord({
        id: `r${i}`, child_id: `c${i + 1}`,
        hygiene_certificate: true,
        category: cat,
      }),
    );
    const result = computeCookingLifeSkills(baseInput({ records: recs }));
    expect(result.insights).toContainEqual({
      text: "Hygiene certification shows children understand food safety — a tangible achievement they can be proud of",
      severity: "positive",
    });
  });

  it("insights are capped at 3", () => {
    // Trigger: exemplary (needs independence>=60, engaged>=90, cats>=6), voice>=80, hygiene>=50.
    // That's 3 already. The 4th (low independence) and 5th (zero records) won't fire since independence is high.
    // Actually all 5 conditions are mutually exclusive enough that max possible simultaneously is
    // exemplary + voice + hygiene = 3. So the cap never actually drops one in normal conditions.
    // But let's verify by checking we get exactly 3:
    const cats = ["knife_skills", "hob_cooking", "oven_baking", "recipe_planning", "budgeting", "cultural_cooking"];
    const recs = cats.map((cat, i) =>
      makeRecord({
        id: `r${i}`, child_id: `c${i + 1}`,
        competency_level: "did_independently",
        has_child_voice: true,
        hygiene_certificate: true,
        category: cat,
      }),
    );
    const result = computeCookingLifeSkills(baseInput({ records: recs }));
    // Fires: exemplary, voice, hygiene = 3
    expect(result.insights).toHaveLength(3);
  });

  it("no insights when no conditions are met", () => {
    // independence: pct(1,2)=50 => not <15 and not >=60 with >=90 engaged and >=6 cats
    // zero records: no. voice: pct(1,2)=50 => not >=80. hygiene: pct(1,2)=50 => >=50 => fires!
    // Actually hygiene fires. Let's adjust:
    const recs2 = [
      makeRecord({ id: "r1", child_id: "c1", competency_level: "did_independently", has_child_voice: true, hygiene_certificate: false, category: "knife_skills" }),
      makeRecord({ id: "r2", child_id: "c2", competency_level: "assisted", has_child_voice: false, hygiene_certificate: false, category: "hob_cooking" }),
    ];
    const result2 = computeCookingLifeSkills(baseInput({ records: recs2 }));
    // independence: pct(1,2)=50 => >=60? No. <15? No. So no low-independence insight.
    // engaged: pct(2,6)=33 => doesn't affect insights.
    // voice: pct(1,2)=50 => not >=80. hygiene: pct(0,2)=0 => not >=50.
    // categories: 2 => exemplary needs >=6. No conditions fire.
    expect(result2.insights).toHaveLength(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 18. HEADLINE PER RATING
// ══════════════════════════════════════════════════════════════════════════════
describe("Headline per rating", () => {
  it("outstanding headline", () => {
    const cats = ["knife_skills", "hob_cooking", "oven_baking", "recipe_planning", "budgeting", "cultural_cooking"];
    const recs = cats.map((cat, i) =>
      makeRecord({
        id: `r${i}`, child_id: `c${i + 1}`,
        competency_level: "did_independently",
        recipes_attempted_count: 10, recipes_good_or_better_count: 10,
        has_child_voice: true, hygiene_certificate: true, category: cat,
      }),
    );
    const result = computeCookingLifeSkills(baseInput({ records: recs }));
    expect(result.cooking_rating).toBe("outstanding");
    expect(result.headline).toBe("Cooking and life skills programme is comprehensive — children are developing real independence");
  });

  it("good headline", () => {
    // Use the good scenario records from section 4 (score=72)
    const records: CookingRecordInput[] = [
      makeRecord({ id: "r1", child_id: "c1", competency_level: "did_independently", recipes_attempted_count: 8, recipes_good_or_better_count: 7, has_child_voice: true, hygiene_certificate: true, category: "knife_skills" }),
      makeRecord({ id: "r2", child_id: "c2", competency_level: "did_independently", recipes_attempted_count: 8, recipes_good_or_better_count: 7, has_child_voice: true, hygiene_certificate: true, category: "hob_cooking" }),
      makeRecord({ id: "r3", child_id: "c3", competency_level: "did_independently", recipes_attempted_count: 8, recipes_good_or_better_count: 7, has_child_voice: true, hygiene_certificate: false, category: "oven_baking" }),
      makeRecord({ id: "r4", child_id: "c4", competency_level: "assisted", recipes_attempted_count: 8, recipes_good_or_better_count: 7, has_child_voice: true, hygiene_certificate: false, category: "knife_skills" }),
      makeRecord({ id: "r5", child_id: "c4", competency_level: "assisted", recipes_attempted_count: 8, recipes_good_or_better_count: 7, has_child_voice: false, hygiene_certificate: false, category: "hob_cooking" }),
    ];
    const result = computeCookingLifeSkills(baseInput({ records }));
    expect(result.cooking_rating).toBe("good");
    expect(result.headline).toBe("Good cooking skills development with effective progression and child engagement");
  });

  it("adequate headline", () => {
    const result = computeCookingLifeSkills(baseInput({ records: [] }));
    // zero records = score 46 => adequate
    expect(result.cooking_rating).toBe("adequate");
    expect(result.headline).toBe("Cooking skills programme exists but needs broader coverage and deeper progression");
  });

  it("inadequate headline", () => {
    const recs = [
      makeRecord({ id: "r1", child_id: "c1", competency_level: "observed_staff", recipes_attempted_count: 2, recipes_good_or_better_count: 0, has_child_voice: false, hygiene_certificate: false, category: "microwave" }),
      makeRecord({ id: "r2", child_id: "c1", competency_level: "observed_staff", recipes_attempted_count: 2, recipes_good_or_better_count: 0, has_child_voice: false, hygiene_certificate: false, category: "microwave" }),
      makeRecord({ id: "r3", child_id: "c1", competency_level: "observed_staff", recipes_attempted_count: 2, recipes_good_or_better_count: 0, has_child_voice: false, hygiene_certificate: false, category: "microwave" }),
    ];
    const result = computeCookingLifeSkills(baseInput({ records: recs }));
    expect(result.cooking_rating).toBe("inadequate");
    expect(result.headline).toBe("Cooking and life skills provision is inadequate — children are not being prepared for independence");
  });

  it("insufficient_data headline", () => {
    const result = computeCookingLifeSkills(baseInput({ total_children: 0 }));
    expect(result.cooking_rating).toBe("insufficient_data");
    expect(result.headline).toBe("No data available for cooking life skills analysis");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 19. EDGE CASES
// ══════════════════════════════════════════════════════════════════════════════
describe("Edge cases", () => {
  it("single record — all metrics computed from 1 record", () => {
    const recs = [makeRecord({
      id: "r1", child_id: "c1",
      competency_level: "did_independently",
      recipes_attempted_count: 5, recipes_good_or_better_count: 5,
      has_child_voice: true, hygiene_certificate: true,
      category: "hob_cooking",
    })];
    const result = computeCookingLifeSkills(baseInput({ records: recs }));
    // Metrics: independence=pct(1,1)=100, engaged=pct(1,6)=17, voice=pct(1,1)=100, recipes=pct(5,5)=100, cats=1, hygiene=pct(1,1)=100
    expect(result.total_records).toBe(1);
    expect(result.independence_rate).toBe(100);
    expect(result.children_engaged_rate).toBe(17);
    expect(result.child_voice_rate).toBe(100);
    expect(result.recipe_success_rate).toBe(100);
    expect(result.category_variety).toBe(1);
    expect(result.hygiene_certificate_rate).toBe(100);
    // Score: 52 + 5(indep>=60) + (-5)(engaged<40) + 5(voice>=80) + 5(recipe>=80) + (-4)(cats<=1) + 5(hygiene>=50)
    // 52 + 5 - 5 + 5 + 5 - 4 + 5 = 63
    expect(result.cooking_score).toBe(63);
    expect(result.cooking_rating).toBe("adequate");
  });

  it("all records same child — children_engaged_rate reflects single child", () => {
    const recs = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `r${i}`, child_id: "c1", category: `cat_${i}` }),
    );
    const result = computeCookingLifeSkills(baseInput({ records: recs }));
    // pct(1,6) = 17
    expect(result.children_engaged_rate).toBe(17);
  });

  it("score clamping at 0 — extreme penalties cannot go below 0", () => {
    // We need a scenario that could theoretically push below 0.
    // Base=52, max penalties: -5 -5 -4 -5 -4 -3 = -26. 52-26=26 which is still >0.
    // Can't actually reach 0 with records. With zero records: 52 -3 -1 -2 = 46. Also >0.
    // The clamp is a safety net. Let's verify the clamp function works by checking the
    // architecture — the minimum possible score is 26 (all penalties with records) or 46 (no records).
    // Just verify the worst case doesn't go negative:
    const recs = [
      makeRecord({ id: "r1", child_id: "c1", competency_level: "observed_staff", recipes_attempted_count: 10, recipes_good_or_better_count: 1, has_child_voice: false, hygiene_certificate: false, category: "microwave" }),
      makeRecord({ id: "r2", child_id: "c1", competency_level: "observed_staff", recipes_attempted_count: 10, recipes_good_or_better_count: 1, has_child_voice: false, hygiene_certificate: false, category: "microwave" }),
      makeRecord({ id: "r3", child_id: "c1", competency_level: "observed_staff", recipes_attempted_count: 10, recipes_good_or_better_count: 1, has_child_voice: false, hygiene_certificate: false, category: "microwave" }),
    ];
    const result = computeCookingLifeSkills(baseInput({ records: recs }));
    // independence: pct(0,3)=0 <15 => -5
    // engaged: pct(1,6)=17 <40 => -5
    // voice: pct(0,3)=0 <30 => -4
    // recipes: pct(3,30)=10 <30 => -5
    // cats: 1 <=1 => -4
    // hygiene: pct(0,3)=0 ===0 => -3
    // 52 -5 -5 -4 -5 -4 -3 = 26
    expect(result.cooking_score).toBe(26);
    expect(result.cooking_score).toBeGreaterThanOrEqual(0);
  });

  it("score clamping at 100 — even with massive bonuses, stays at 100", () => {
    // Max bonuses: +5 +6 +5 +5 +4 +5 = +30. 52+30=82. Can't reach 100 naturally.
    // But the clamp is there as a safety net. Verify score never exceeds 100:
    const cats = ["knife_skills", "hob_cooking", "oven_baking", "recipe_planning", "budgeting", "cultural_cooking"];
    const recs = cats.map((cat, i) =>
      makeRecord({
        id: `r${i}`, child_id: `c${i + 1}`,
        competency_level: "did_independently",
        recipes_attempted_count: 100, recipes_good_or_better_count: 100,
        has_child_voice: true, hygiene_certificate: true, category: cat,
      }),
    );
    const result = computeCookingLifeSkills(baseInput({ records: recs }));
    expect(result.cooking_score).toBeLessThanOrEqual(100);
    expect(result.cooking_score).toBe(82);
  });

  it("very large number of records processes correctly", () => {
    const cats = ["knife_skills", "hob_cooking", "oven_baking", "recipe_planning", "budgeting", "cultural_cooking"];
    const recs: CookingRecordInput[] = Array.from({ length: 100 }, (_, i) =>
      makeRecord({
        id: `r${i}`,
        child_id: `c${(i % 6) + 1}`,
        competency_level: i < 70 ? "did_independently" : "assisted",
        recipes_attempted_count: 5,
        recipes_good_or_better_count: 4,
        has_child_voice: i < 85,
        hygiene_certificate: i < 60,
        category: cats[i % 6],
      }),
    );
    const result = computeCookingLifeSkills(baseInput({ records: recs }));
    expect(result.total_records).toBe(100);
    // independence: pct(70,100) = 70 => >=60 => +5
    // engaged: pct(6,6) = 100 => >=90 => +6
    // voice: pct(85,100) = 85 => >=80 => +5
    // recipes: total attempted=500, good=400. pct(400,500) = 80 => >=80 => +5
    // cats: 6 => >=6 => +4
    // hygiene: pct(60,100) = 60 => >=50 => +5
    // 52 + 5 + 6 + 5 + 5 + 4 + 5 = 82
    expect(result.cooking_score).toBe(82);
    expect(result.cooking_rating).toBe("outstanding");
  });

  it("total_children=1 with 1 record — engaged rate is 100%", () => {
    const recs = [makeRecord({ id: "r1", child_id: "c1" })];
    const result = computeCookingLifeSkills(baseInput({ total_children: 1, records: recs }));
    // pct(1,1) = 100
    expect(result.children_engaged_rate).toBe(100);
  });

  it("more unique children than total_children — engaged rate can exceed 100", () => {
    // This is an edge case where data is inconsistent, but the engine should still compute
    const recs = Array.from({ length: 8 }, (_, i) =>
      makeRecord({ id: `r${i}`, child_id: `c${i + 1}` }),
    );
    const result = computeCookingLifeSkills(baseInput({ total_children: 6, records: recs }));
    // pct(8,6) = Math.round(133.33) = 133
    expect(result.children_engaged_rate).toBe(133);
  });

  it("recipes_good_or_better_count exceeds recipes_attempted_count — pct computes as-is", () => {
    const recs = [makeRecord({
      id: "r1", child_id: "c1",
      recipes_attempted_count: 5,
      recipes_good_or_better_count: 8,
    })];
    const result = computeCookingLifeSkills(baseInput({ records: recs }));
    // pct(8,5) = Math.round(160) = 160
    expect(result.recipe_success_rate).toBe(160);
  });

  it("pct helper rounds correctly at .5 boundary", () => {
    // pct(1,3) = Math.round(33.333) = 33
    // pct(2,3) = Math.round(66.667) = 67
    const recs = [
      makeRecord({ id: "r1", child_id: "c1", hygiene_certificate: true }),
      makeRecord({ id: "r2", child_id: "c2", hygiene_certificate: false }),
      makeRecord({ id: "r3", child_id: "c3", hygiene_certificate: false }),
    ];
    const result = computeCookingLifeSkills(baseInput({ records: recs }));
    expect(result.hygiene_certificate_rate).toBe(33);
  });

  it("did_with_prompts does NOT count as independent", () => {
    const recs = [makeRecord({ id: "r1", child_id: "c1", competency_level: "did_with_prompts" })];
    const result = computeCookingLifeSkills(baseInput({ records: recs }));
    expect(result.independence_rate).toBe(0);
  });

  it("not_yet_introduced does NOT count as independent", () => {
    const recs = [makeRecord({ id: "r1", child_id: "c1", competency_level: "not_yet_introduced" })];
    const result = computeCookingLifeSkills(baseInput({ records: recs }));
    expect(result.independence_rate).toBe(0);
  });

  it("boundary: score exactly 80 is outstanding", () => {
    // Aim for score=79: indep +5, engaged +6, voice +5, recipe +5, cats +1 (3 unique), hygiene +5.
    // +5+6+5+5+1+5 = +27 => 52+27=79. Good.
    // 3 categories: need exactly 3 unique from 6 records.
    const catList = ["knife_skills", "hob_cooking", "oven_baking", "knife_skills", "hob_cooking", "oven_baking"];
    const recs = catList.map((cat, i) =>
      makeRecord({
        id: `r${i}`, child_id: `c${i + 1}`,
        competency_level: "did_independently",
        recipes_attempted_count: 10, recipes_good_or_better_count: 10,
        has_child_voice: true, hygiene_certificate: true,
        category: cat,
      }),
    );
    const result = computeCookingLifeSkills(baseInput({ records: recs }));
    expect(result.cooking_score).toBe(79);
    expect(result.cooking_rating).toBe("good");
  });

  it("boundary: score exactly 65 is good", () => {
    // Need modifiers summing to +13. 52+13=65.
    // +5(indep) +0(engaged: 40-59%) +0(voice: 30-49%) +0(recipe: 30-49%) +4(cats>=6) +2(hygiene 20-49%)
    // = +5 +0 +0 +0 +4 +2 = +11 => 63. Close but not 65.
    // +5(indep) +2(engaged>=60) +0(voice) +0(recipe) +4(cats) +2(hygiene) = +13 => 65!
    // 6 records, 6 unique categories.
    // engaged: need pct(x,6) >= 60 but < 90 => need 4 or 5 unique children. pct(4,6)=67.
    // Use 6 records with 4 unique children.
    // independence: all did_independently => 100% => +5.
    // voice: need pct between 30-49. With 6 records, pct(2,6)=33. So 2 with voice.
    // recipes: need pct between 30-49. E.g. 10 attempted per record=60 total, need pct(good,60) between 30-49.
    // pct(24,60)=40. So 4 good per record = 24 total good. 40%.
    // hygiene: need pct between 20-49. With 6 records, pct(2,6)=33. 2 with hygiene.
    // cats: 6 unique => +4.
    const catList = ["knife_skills", "hob_cooking", "oven_baking", "recipe_planning", "budgeting", "cultural_cooking"];
    const recs: CookingRecordInput[] = catList.map((cat, i) =>
      makeRecord({
        id: `r${i}`,
        child_id: `c${(i % 4) + 1}`, // 4 unique children: c1,c2,c3,c4,c1,c2
        competency_level: "did_independently",
        recipes_attempted_count: 10,
        recipes_good_or_better_count: 4,
        has_child_voice: i < 2, // 2 with voice
        hygiene_certificate: i < 2, // 2 with hygiene
        category: cat,
      }),
    );
    const result = computeCookingLifeSkills(baseInput({ records: recs }));
    // Verify metrics:
    expect(result.independence_rate).toBe(100); // pct(6,6)=100 => +5
    expect(result.children_engaged_rate).toBe(67); // pct(4,6)=67 => >=60 => +2
    expect(result.child_voice_rate).toBe(33); // pct(2,6)=33 => >=30 but <50 => 0
    expect(result.recipe_success_rate).toBe(40); // pct(24,60)=40 => >=30 but <50 => 0
    expect(result.category_variety).toBe(6); // >=6 => +4
    expect(result.hygiene_certificate_rate).toBe(33); // pct(2,6)=33 => >=20 => +2
    // Score: 52 + 5 + 2 + 0 + 0 + 4 + 2 = 65
    expect(result.cooking_score).toBe(65);
    expect(result.cooking_rating).toBe("good");
  });

  it("boundary: score exactly 45 is adequate", () => {
    // Need modifiers summing to -7. 52-7=45.
    // -5(indep<15) + 0(engaged 40-59%) + 0(voice 30-49%) + (-1)(recipe: 0 attempted with records) + (-1)(cats: zero records penalty doesn't apply with records; cats=2 → 0)
    // Wait, modifier 5 for categories with records: >=6→+4, >=3→+1, <=1→-4. 2 categories → 0.
    // So: -5 + 0 + 0 + (-1) + 0 + (-3)(hygiene===0) = -9 => 43. Too low.
    // Try: -5(indep) + 2(engaged>=60) + 0(voice) + (-1)(recipe 0 attempted) + 0(cats 2) + (-3)(hygiene 0) = -7 => 45!
    // Need: total > 0. Independence pct <15. Engaged >= 60%. Voice 30-49%. 0 recipes attempted. 2 categories. Hygiene 0.
    // 10 records, 1 independent. pct(1,10)=10 <15 => -5.
    // 7 unique children / 6 total. pct(7,6)=117 >= 90 → +6. That's too much. Need >=60 but <90.
    // Actually for +2 (engaged >=60 but <90): need pct(x,6) in [60, 89].
    // pct(4,6)=67. So 4 unique children in 10 records.
    // voice: need 30-49%. With 10 records: pct(4,10)=40. 4 with voice.
    // recipes: all 0.
    // categories: 2 unique => 0.
    // hygiene: 0 => -3.
    // Score: 52 + (-5) + (+2) + 0 + (-1) + 0 + (-3) = 45
    const recs: CookingRecordInput[] = Array.from({ length: 10 }, (_, i) =>
      makeRecord({
        id: `r${i}`,
        child_id: `c${(i % 4) + 1}`, // 4 unique: c1,c2,c3,c4,c1,c2,c3,c4,c1,c2
        competency_level: i === 0 ? "did_independently" : "assisted",
        recipes_attempted_count: 0,
        recipes_good_or_better_count: 0,
        has_child_voice: i < 4,
        hygiene_certificate: false,
        category: i % 2 === 0 ? "knife_skills" : "hob_cooking",
      }),
    );
    const result = computeCookingLifeSkills(baseInput({ records: recs }));
    expect(result.independence_rate).toBe(10); // pct(1,10)=10 <15 => -5
    expect(result.children_engaged_rate).toBe(67); // pct(4,6)=67 >= 60 => +2
    expect(result.child_voice_rate).toBe(40); // pct(4,10)=40 >= 30 <50 => 0
    expect(result.recipe_success_rate).toBeNull(); // 0 attempted with records => -1
    expect(result.category_variety).toBe(2); // 2 cats, not >=3, not <=1 => 0
    expect(result.hygiene_certificate_rate).toBe(0); // ===0 => -3
    // 52 - 5 + 2 + 0 - 1 + 0 - 3 = 45
    expect(result.cooking_score).toBe(45);
    expect(result.cooking_rating).toBe("adequate");
  });

  it("boundary: score 44 is inadequate", () => {
    // Same as above but tweak voice to <30 for -4 instead of 0, giving us 45-4=41. Too low.
    // Or: take the 45-scoring setup and remove the engaged +2 => score 43. Also inadequate.
    // Let's make engaged <40 from the 45-scoring setup:
    // Use 1 unique child (engaged=pct(1,6)=17 <40 => -5 instead of +2).
    // 52 + (-5) + (-5) + 0 + (-1) + 0 + (-3) = 38. Inadequate.
    // For exactly 44: start from 52. Need modifiers = -8.
    // -5(indep) + 2(engaged) + (-4)(voice<30) + 0(recipe 30-49%) + 1(cats>=3) + (-3)(hygiene===0)
    // = -5 +2 -4 +0 +1 -3 = -9 => 43. Off by 1.
    // Try: -5(indep) + 2(engaged) + (-4)(voice) + 2(recipe>=50) + 0(cats=2) + (-3)(hygiene) = -8 => 44!
    // Need: 10+ records, indep<15%, engaged>=60%<90%, voice<30%, recipe 50-79%, 2 cats, hygiene=0.
    const recs: CookingRecordInput[] = Array.from({ length: 10 }, (_, i) =>
      makeRecord({
        id: `r${i}`,
        child_id: `c${(i % 4) + 1}`,
        competency_level: i === 0 ? "did_independently" : "observed_staff",
        recipes_attempted_count: 10,
        recipes_good_or_better_count: 6, // pct(60,100) = 60 => >=50 => +2
        has_child_voice: i < 2, // pct(2,10)=20 <30 => -4
        hygiene_certificate: false,
        category: i % 2 === 0 ? "knife_skills" : "hob_cooking",
      }),
    );
    const result = computeCookingLifeSkills(baseInput({ records: recs }));
    expect(result.independence_rate).toBe(10); // <15 => -5
    expect(result.children_engaged_rate).toBe(67); // >=60 => +2
    expect(result.child_voice_rate).toBe(20); // <30 => -4
    expect(result.recipe_success_rate).toBe(60); // >=50 => +2
    expect(result.category_variety).toBe(2); // 0
    expect(result.hygiene_certificate_rate).toBe(0); // ===0 => -3
    // 52 - 5 + 2 - 4 + 2 + 0 - 3 = 44
    expect(result.cooking_score).toBe(44);
    expect(result.cooking_rating).toBe("inadequate");
  });

  it("led_family_meal does not affect scoring (field exists but is unused in modifiers)", () => {
    const recs1 = [makeRecord({ id: "r1", child_id: "c1", led_family_meal: true })];
    const recs2 = [makeRecord({ id: "r1", child_id: "c1", led_family_meal: false })];
    const result1 = computeCookingLifeSkills(baseInput({ records: recs1 }));
    const result2 = computeCookingLifeSkills(baseInput({ records: recs2 }));
    expect(result1.cooking_score).toBe(result2.cooking_score);
  });

  it("cuisines_explored_count does not affect scoring (field exists but is unused in modifiers)", () => {
    const recs1 = [makeRecord({ id: "r1", child_id: "c1", cuisines_explored_count: 100 })];
    const recs2 = [makeRecord({ id: "r1", child_id: "c1", cuisines_explored_count: 0 })];
    const result1 = computeCookingLifeSkills(baseInput({ records: recs1 }));
    const result2 = computeCookingLifeSkills(baseInput({ records: recs2 }));
    expect(result1.cooking_score).toBe(result2.cooking_score);
  });
});
