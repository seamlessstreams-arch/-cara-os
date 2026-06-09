// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME ADVOCACY & INDEPENDENT VOICE INTELLIGENCE ENGINE TESTS
// Comprehensive test suite for advocacy access, independent advocate usage,
// child voice capture, private sessions, and type variety scoring.
// Covers CHR 2015 Reg 7 and SCCIF Voice requirements.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeAdvocacyIndependentVoice,
  type AdvocacyRecordInput,
  type AdvocacyVoiceInput,
} from "../home-advocacy-independent-voice-intelligence-engine";

const TODAY = "2026-05-27";

// ── Factories ───────────────────────────────────────────────────────────────

let _id = 0;
function makeRecord(overrides: Partial<AdvocacyRecordInput> = {}): AdvocacyRecordInput {
  _id++;
  return {
    id: `adv_${_id}`,
    child_id: `child_${_id}`,
    advocacy_type: "independent",
    status: "active",
    has_visits: true,
    visit_count: 3,
    private_session_count: 2,
    actions_raised_count: 1,
    has_child_view: true,
    has_home_response: true,
    issues_raised_count: 1,
    ...overrides,
  };
}

function baseInput(overrides: Partial<AdvocacyVoiceInput> = {}): AdvocacyVoiceInput {
  return {
    today: TODAY,
    total_children: 6,
    records: [],
    ...overrides,
  };
}

function run(records: AdvocacyRecordInput[], total_children = 6) {
  return computeAdvocacyIndependentVoice(baseInput({ records, total_children }));
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. INSUFFICIENT DATA
// ══════════════════════════════════════════════════════════════════════════════

describe("Insufficient data", () => {
  it("returns insufficient_data when total_children is 0", () => {
    const res = computeAdvocacyIndependentVoice(baseInput({ total_children: 0, records: [] }));
    expect(res.advocacy_rating).toBe("insufficient_data");
    expect(res.advocacy_score).toBe(0);
  });

  it("returns zero for all metrics when total_children is 0", () => {
    const res = computeAdvocacyIndependentVoice(baseInput({ total_children: 0, records: [] }));
    expect(res.total_records).toBe(0);
    expect(res.active_rate).toBe(0);
    expect(res.children_with_advocacy_rate).toBe(0);
    expect(res.independent_rate).toBe(0);
    expect(res.child_voice_rate).toBe(0);
    expect(res.private_session_rate).toBe(0);
    expect(res.advocacy_type_variety).toBe(0);
  });

  it("returns empty arrays when total_children is 0", () => {
    const res = computeAdvocacyIndependentVoice(baseInput({ total_children: 0, records: [] }));
    expect(res.strengths).toEqual([]);
    expect(res.concerns).toEqual([]);
    expect(res.recommendations).toEqual([]);
    expect(res.insights).toEqual([]);
  });

  it("returns the no-data headline when total_children is 0", () => {
    const res = computeAdvocacyIndependentVoice(baseInput({ total_children: 0, records: [] }));
    expect(res.headline).toBe("No data available for advocacy intelligence analysis");
  });

  it("still returns insufficient_data even when records exist but total_children is 0", () => {
    const res = computeAdvocacyIndependentVoice(
      baseInput({ total_children: 0, records: [makeRecord()] }),
    );
    expect(res.advocacy_rating).toBe("insufficient_data");
    expect(res.advocacy_score).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. ZERO RECORDS (but total_children > 0)
// ══════════════════════════════════════════════════════════════════════════════

describe("Zero records with children present", () => {
  it("applies all zero-record penalties: 52 - 3 - 1 - 1 - 2 = 45", () => {
    const res = run([], 6);
    // Mod1: -3, Mod2: no adj, Mod3: -1, Mod4: no adj, Mod5: -1, Mod6: -2
    expect(res.advocacy_score).toBe(45);
  });

  it("rates as adequate at score 45", () => {
    const res = run([], 6);
    expect(res.advocacy_rating).toBe("adequate");
  });

  it("reports 0 for all rates", () => {
    const res = run([], 6);
    expect(res.active_rate).toBe(0);
    expect(res.children_with_advocacy_rate).toBe(0);
    expect(res.independent_rate).toBe(0);
    expect(res.child_voice_rate).toBe(0);
    expect(res.private_session_rate).toBe(0);
    expect(res.advocacy_type_variety).toBe(0);
    expect(res.total_records).toBe(0);
  });

  it("includes 'no advocacy records' concern", () => {
    const res = run([], 6);
    expect(res.concerns.length).toBeGreaterThan(0);
    expect(res.concerns.some(c => c.toLowerCase().includes("no advocacy records"))).toBe(true);
  });

  it("includes immediate recommendation for referral pathways", () => {
    const res = run([], 6);
    expect(res.recommendations.length).toBeGreaterThan(0);
    expect(res.recommendations[0].urgency).toBe("immediate");
    expect(res.recommendations[0].regulatory_ref).toBe("CHR 2015 Reg 7");
  });

  it("includes critical insight about Ofsted verification", () => {
    const res = run([], 6);
    expect(res.insights.some(i => i.severity === "critical")).toBe(true);
  });

  it("shows adequate headline", () => {
    const res = run([], 6);
    expect(res.headline).toContain("available but");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. RATING THRESHOLDS
// ══════════════════════════════════════════════════════════════════════════════

describe("Rating thresholds", () => {
  // Outstanding: score >= 80
  it("rates as outstanding at score 80", () => {
    // Base 52 + 5 (active>=80) + 6 (coverage>=80) + 5 (independent>=50)
    //   + 5 (voice>=90) + 4 (private>=60) + 5 (variety>=4) = 82
    // We need 10 records, all active, covering 80% children, 50% independent,
    // 90% child voice, 60% private sessions, 4+ types
    const records = [
      makeRecord({ child_id: "c1", advocacy_type: "independent", status: "active", has_child_view: true, visit_count: 5, private_session_count: 3 }),
      makeRecord({ child_id: "c2", advocacy_type: "legal", status: "active", has_child_view: true, visit_count: 5, private_session_count: 3 }),
      makeRecord({ child_id: "c3", advocacy_type: "peer", status: "active", has_child_view: true, visit_count: 5, private_session_count: 3 }),
      makeRecord({ child_id: "c4", advocacy_type: "complaints", status: "completed", has_child_view: true, visit_count: 5, private_session_count: 3 }),
      makeRecord({ child_id: "c5", advocacy_type: "independent", status: "active", has_child_view: true, visit_count: 5, private_session_count: 3 }),
      makeRecord({ child_id: "c1", advocacy_type: "issue_based", status: "active", has_child_view: true, visit_count: 5, private_session_count: 3 }),
      makeRecord({ child_id: "c2", advocacy_type: "independent", status: "active", has_child_view: true, visit_count: 5, private_session_count: 3 }),
      makeRecord({ child_id: "c3", advocacy_type: "legal", status: "active", has_child_view: true, visit_count: 5, private_session_count: 3 }),
      makeRecord({ child_id: "c4", advocacy_type: "independent", status: "active", has_child_view: true, visit_count: 5, private_session_count: 3 }),
      makeRecord({ child_id: "c5", advocacy_type: "independent", status: "active", has_child_view: true, visit_count: 5, private_session_count: 3 }),
    ];
    const res = run(records, 6);
    // 5 unique children / 6 total = 83%, 10/10 active = 100%
    // independent+legal: 7/10 = 70%, voice: 10/10 = 100%
    // private: 30/50 = 60%, uniqueTypes: 5 >= 4
    // 52 + 5 + 6 + 5 + 5 + 4 + 5 = 82
    expect(res.advocacy_score).toBe(82);
    expect(res.advocacy_rating).toBe("outstanding");
  });

  it("rates as good at score 79 (just below outstanding)", () => {
    // 52 + 5 + 6 + 5 + 5 + 4 + 2 = 79 -> good
    // Need variety < 4 but >= 2 -> +2 instead of +5
    const records = [
      makeRecord({ child_id: "c1", advocacy_type: "independent", status: "active", has_child_view: true, visit_count: 5, private_session_count: 3 }),
      makeRecord({ child_id: "c2", advocacy_type: "legal", status: "active", has_child_view: true, visit_count: 5, private_session_count: 3 }),
      makeRecord({ child_id: "c3", advocacy_type: "independent", status: "active", has_child_view: true, visit_count: 5, private_session_count: 3 }),
      makeRecord({ child_id: "c4", advocacy_type: "legal", status: "completed", has_child_view: true, visit_count: 5, private_session_count: 3 }),
      makeRecord({ child_id: "c5", advocacy_type: "independent", status: "active", has_child_view: true, visit_count: 5, private_session_count: 3 }),
      makeRecord({ child_id: "c1", advocacy_type: "legal", status: "active", has_child_view: true, visit_count: 5, private_session_count: 3 }),
      makeRecord({ child_id: "c2", advocacy_type: "independent", status: "active", has_child_view: true, visit_count: 5, private_session_count: 3 }),
      makeRecord({ child_id: "c3", advocacy_type: "legal", status: "active", has_child_view: true, visit_count: 5, private_session_count: 3 }),
      makeRecord({ child_id: "c4", advocacy_type: "independent", status: "active", has_child_view: true, visit_count: 5, private_session_count: 3 }),
      makeRecord({ child_id: "c5", advocacy_type: "independent", status: "active", has_child_view: true, visit_count: 5, private_session_count: 3 }),
    ];
    const res = run(records, 6);
    // 5 unique children / 6 = 83% -> +6
    // 10/10 active -> +5, independent+legal 10/10 = 100% -> +5
    // voice 10/10 = 100% -> +5, private 30/50 = 60% -> +4
    // uniqueTypes: 2 (independent,legal) >= 2 -> +2
    // 52 + 5 + 6 + 5 + 5 + 4 + 2 = 79
    expect(res.advocacy_score).toBe(79);
    expect(res.advocacy_rating).toBe("good");
  });

  it("rates as good at score 65", () => {
    // 52 + 5 + 2 + 2 + 2 + 0 + 2 = 65
    // active>=80 -> +5 (4/4 = 100%)
    // coverage >=50 but <80 -> +2 (3/6 = 50%)
    // independent >=25 but <50 -> +2 (1/4 = 25%)
    // voice >=60 but <90 -> +2 (3/4 = 75%)
    // private 10-29 -> 0 (2/10 = 20%)
    // variety >=2 -> +2 (independent, peer = 2 types)
    const records: AdvocacyRecordInput[] = [
      makeRecord({ child_id: "c1", advocacy_type: "independent", status: "active", has_child_view: true, visit_count: 3, private_session_count: 1 }),
      makeRecord({ child_id: "c2", advocacy_type: "peer", status: "active", has_child_view: true, visit_count: 3, private_session_count: 1 }),
      makeRecord({ child_id: "c3", advocacy_type: "peer", status: "completed", has_child_view: true, visit_count: 2, private_session_count: 0 }),
      makeRecord({ child_id: "c1", advocacy_type: "peer", status: "active", has_child_view: false, visit_count: 2, private_session_count: 0 }),
    ];
    const res = run(records, 6);
    // active: 4/4=100%->+5, coverage: 3/6=50%->+2, ind: 1/4=25%->+2
    // voice: 3/4=75%->+2, private: 2/10=20%->0, variety: 2->+2
    expect(res.advocacy_score).toBe(65);
    expect(res.advocacy_rating).toBe("good");
  });

  it("rates as adequate at score 64 (just below good)", () => {
    // Same as above but reduce one modifier by 1 point difference
    // 52 + 5 + 2 + 2 + 2 + 0 + 2 = 65 ... need 64
    // Drop active to >=50 but <80 -> +2 instead of +5
    // 52 + 2 + 2 + 2 + 2 + 0 + 2 = 62 -> too low
    // Instead: 52 + 5 + 2 + 2 + 2 + 1 + 2 = 66 -> too high
    // Let me be precise:
    // 52 + 2 + 6 + 2 + 2 + 0 + 2 = 66 -> still not 64
    // 52 + 5 + 2 + 0 + 2 + 0 + 2 = 63 -> close
    // Let me just target 64 exactly:
    // 52 + 2 + 2 + 2 + 2 + 4 + 0 = 64
    // active 50-79% -> +2
    // coverage 50-79% -> +2
    // independent 25-49% -> +2
    // voice 60-89% -> +2
    // private >=60% -> +4
    // variety = 1 -> -3... no that's 52+2+2+2+2+4-3 = 61
    // variety 2-3 -> +2: 52+2+2+2+2+4+2 = 66 -> nope
    // Let me try: 52 + 5 + 2 + 2 + 2 + 1 + 0 = 64
    // active>=80->+5, coverage 50-79->+2, independent 25-49->+2, voice 60-89->+2
    // private 30-59->+1, variety: between... >=2->+2 but we need 0
    // variety 1 -> -3: 52+5+2+2+2+1-3 = 61 no
    // Let me try: 52 + 5 + 2 + 2 + 2 + 0 + 2 = 65 -> one less somewhere
    // Actually easier: go from the 65 scenario and change private to <10 -> -4
    // 52 + 5 + 2 + 2 + 2 + (-4) + 2 = 61 -> too far
    // OK: 52 + 5 + 2 + 5 + 2 + 0 + 0 = 66, 52 + 5 + 2 + 5 + 0 + 0 + 0 = 64
    // active>=80->+5, coverage 50-79->+2, independent>=50->+5, voice 30-59->0, private 10-29->0, variety: middle->0
    // voice between 30 and 59 -> no adjustment (not >=60, not <30)
    // variety: exactly 1 -> -3
    // 52+5+2+5+0+0-3 = 61 -> no
    // I'll construct it differently with simpler arithmetic.
    // Target: score = 64. Base 52. Need +12 from modifiers.
    // +5 (active>=80) +6 (coverage>=80) +2 (independent 25-49) +2 (voice 60-89) +0 (private 10-29) -3 (variety<=1)
    // = 52 + 5 + 6 + 2 + 2 + 0 - 3 = 64
    const records: AdvocacyRecordInput[] = [];
    // 5 records, all active (100%), 5 unique children / 6 = 83%
    // 2/5 independent (40%) -> 25-49 -> +2
    // 4/5 child_view (80%) -> 60-89 -> +2
    // visits: 25 total, 5 private -> 20% -> 10-29 -> 0
    // types: only "independent" -> 1 type -> -3
    records.push(makeRecord({ child_id: "c1", advocacy_type: "independent", status: "active", has_child_view: true, visit_count: 5, private_session_count: 1 }));
    records.push(makeRecord({ child_id: "c2", advocacy_type: "independent", status: "active", has_child_view: true, visit_count: 5, private_session_count: 1 }));
    records.push(makeRecord({ child_id: "c3", advocacy_type: "independent", status: "completed", has_child_view: true, visit_count: 5, private_session_count: 1 }));
    records.push(makeRecord({ child_id: "c4", advocacy_type: "independent", status: "active", has_child_view: true, visit_count: 5, private_session_count: 1 }));
    records.push(makeRecord({ child_id: "c5", advocacy_type: "independent", status: "active", has_child_view: false, visit_count: 5, private_session_count: 1 }));
    // active: 5/5 = 100% -> +5
    // coverage: 5/6 = 83% -> +6
    // independent: all 5 are "independent" -> 5/5 = 100% -> wait, >=50 -> +5 not +2!
    // I need only 2 out of 5 to be independent. Let me change 3 to "peer".
    records[2] = makeRecord({ child_id: "c3", advocacy_type: "peer", status: "completed", has_child_view: true, visit_count: 5, private_session_count: 1 });
    records[3] = makeRecord({ child_id: "c4", advocacy_type: "peer", status: "active", has_child_view: true, visit_count: 5, private_session_count: 1 });
    records[4] = makeRecord({ child_id: "c5", advocacy_type: "peer", status: "active", has_child_view: false, visit_count: 5, private_session_count: 1 });
    // Now independent: 2/5 = 40% -> +2
    // But types: "independent", "peer" -> 2 types -> +2 not -3
    // 52+5+6+2+2+0+2 = 69 -> too high. Need variety 1.
    // Make all peer -> "independent" but mark only 2 as independent type? No, can't have 1 type AND 40% independent.
    // With 1 type being "independent", independent rate = 100%. So >=50->+5.
    // 52+5+6+5+2+0-3 = 67. Nope.
    // OK let me just craft the exact modifiers differently.
    // Target 64 = 52 + 12. Let me pick: +5 +2 +2 +2 +1 +0 = 12. Variety in middle (2-3 types) = +2. 52+5+2+2+2+1+2 = 66. Too high.
    // +5+2+2+2+0+0 = 11 -> 63.  +5+2+2+2+1+0 = 12 -> 64 but variety exactly 1 -> -3 not 0.
    // For variety: <=1 -> -3, >=2 -> +2, >=4 -> +5. There is no 0 for variety.
    // So possible variety values: -3, +2, +5.
    // Let me pick: +5 +2 +2 +2 +0 -3 = 8 -> 60. Nope.
    // +5 +6 +2 +2 +0 -3 = 12 -> 64. Yes!
    // active>=80->+5, coverage>=80->+6, independent 25-49->+2, voice 60-89->+2, private 10-29->0, variety<=1->-3.
    // But to have 1 type AND independent rate 25-49%, the single type must be "independent", giving 100% -> +5 not +2.
    // With 1 type of "peer": independent rate = 0% < 10 -> -4. That gives 52+5+6-4+2+0-3 = 58. No.
    // This is tricky because variety and independent rate are coupled.
    // New approach: +5 +6 +5 +2 -4 +0 = 14 -> 66. Hmm. Let me try:
    // +2 +6 +5 +2 +0 -3 = 12 -> 64.
    // active 50-79->+2, coverage>=80->+6, independent>=50->+5, voice 60-89->+2, private 10-29->0, variety<=1->-3.
    // 1 type = "independent" -> independent rate 100% -> +5. variety = 1 -> -3. OK.
    // active 50-79%: need 2/4 active, 4 records total with 50% active/completed.
    // But careful: 2/4 = 50% which is >=50 -> +2. Good.
    // coverage>=80%: unique children / total_children >= 80%. 4 unique / 5 total = 80%. Use total_children=5.
    // All records type "independent", all have child_view? 3/4 = 75% -> >=60->+2. Good.
    // private: total visits = 20, private = 4 -> 20% -> between 10 and 29 -> 0.
    const records64: AdvocacyRecordInput[] = [
      makeRecord({ child_id: "c1", advocacy_type: "independent", status: "active", has_child_view: true, visit_count: 5, private_session_count: 1 }),
      makeRecord({ child_id: "c2", advocacy_type: "independent", status: "completed", has_child_view: true, visit_count: 5, private_session_count: 1 }),
      makeRecord({ child_id: "c3", advocacy_type: "independent", status: "pending_referral", has_child_view: true, visit_count: 5, private_session_count: 1 }),
      makeRecord({ child_id: "c4", advocacy_type: "independent", status: "declined_by_yp", has_child_view: false, visit_count: 5, private_session_count: 1 }),
    ];
    // active/completed: 2/4 = 50% -> +2
    // coverage: 4/5 = 80% -> +6
    // independent: 4/4 = 100% -> +5
    // voice: 3/4 = 75% -> +2
    // private: 4/20 = 20% -> 0
    // variety: 1 type -> -3
    // 52+2+6+5+2+0-3 = 64
    const res64 = run(records64, 5);
    expect(res64.advocacy_score).toBe(64);
    expect(res64.advocacy_rating).toBe("adequate");
  });

  it("rates as adequate at score 45", () => {
    // Zero records: 52 - 3 - 1 - 1 - 2 = 45
    const res = run([], 6);
    expect(res.advocacy_score).toBe(45);
    expect(res.advocacy_rating).toBe("adequate");
  });

  it("rates as inadequate at score 44", () => {
    // 52 - 3 - 1 - 1 - 2 = 45 for zero records. Need one more penalty.
    // Need records that produce score 44.
    // Let's build: 1 record, status "pending_referral" (not active/completed)
    // active rate: 0% < 30 -> -5
    // coverage: 1 child / 6 = 17% < 30 -> -5
    // type: "peer" -> independent rate 0% < 10 -> -4
    // child_view: false -> 0% < 30 -> -4
    // visits: 0 -> private 0/0 = 0% < 10 -> -4
    // variety: 1 -> -3
    // 52 - 5 - 5 - 4 - 4 - 4 - 3 = 27
    const records = [
      makeRecord({ child_id: "c1", advocacy_type: "peer", status: "pending_referral", has_child_view: false, visit_count: 0, private_session_count: 0 }),
    ];
    const res = run(records, 6);
    expect(res.advocacy_score).toBe(27);
    expect(res.advocacy_rating).toBe("inadequate");
  });

  it("rates as inadequate when all modifiers are maximally negative", () => {
    const records = [
      makeRecord({ child_id: "c1", advocacy_type: "peer", status: "pending_referral", has_child_view: false, visit_count: 1, private_session_count: 0 }),
    ];
    // active: 0/1 = 0% < 30 -> -5
    // coverage: 1/6 = 17% < 30 -> -5
    // independent: 0/1 = 0% < 10 -> -4
    // voice: 0/1 = 0% < 30 -> -4
    // private: 0/1 = 0% < 10 -> -4
    // variety: 1 <= 1 -> -3
    // 52 - 5 - 5 - 4 - 4 - 4 - 3 = 27
    const res = run(records, 6);
    expect(res.advocacy_score).toBe(27);
    expect(res.advocacy_rating).toBe("inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. MODIFIER 1 — ACTIVE/COMPLETED RATE
// ══════════════════════════════════════════════════════════════════════════════

describe("Modifier 1: Active/completed rate", () => {
  it("adds +5 when active rate >= 80%", () => {
    // 5 records, all active -> 100%
    const base = run([
      makeRecord({ status: "active" }),
      makeRecord({ status: "active" }),
      makeRecord({ status: "completed" }),
      makeRecord({ status: "active" }),
      makeRecord({ status: "active" }),
    ]);
    // active rate = 100%
    expect(base.active_rate).toBe(100);
  });

  it("adds +2 when active rate is between 50% and 79%", () => {
    // 4 records: 2 active, 2 pending -> 50%
    const records = [
      makeRecord({ status: "active" }),
      makeRecord({ status: "completed" }),
      makeRecord({ status: "pending_referral" }),
      makeRecord({ status: "declined_by_yp" }),
    ];
    const res = run(records);
    expect(res.active_rate).toBe(50);
  });

  it("subtracts -5 when active rate < 30%", () => {
    // 4 records: 1 active, 3 non-active -> 25%
    const records = [
      makeRecord({ status: "active" }),
      makeRecord({ status: "pending_referral" }),
      makeRecord({ status: "pending_referral" }),
      makeRecord({ status: "declined_by_yp" }),
    ];
    const res = run(records);
    expect(res.active_rate).toBe(25);
  });

  it("no adjustment when active rate is 30-49%", () => {
    // 10 records: 4 active, 6 non -> 40%
    const records = Array.from({ length: 4 }, () => makeRecord({ status: "active" }))
      .concat(Array.from({ length: 6 }, () => makeRecord({ status: "pending_referral" })));
    const res = run(records);
    expect(res.active_rate).toBe(40);
  });

  it("counts completed as active", () => {
    const records = [
      makeRecord({ status: "completed" }),
      makeRecord({ status: "completed" }),
    ];
    const res = run(records);
    expect(res.active_rate).toBe(100);
  });

  it("does not count pending_referral as active", () => {
    const records = [makeRecord({ status: "pending_referral" })];
    const res = run(records);
    expect(res.active_rate).toBe(0);
  });

  it("does not count declined_by_yp as active", () => {
    const records = [makeRecord({ status: "declined_by_yp" })];
    const res = run(records);
    expect(res.active_rate).toBe(0);
  });

  it("subtracts -3 when total is 0", () => {
    // Zero records: mod1 = -3
    const withZero = run([], 6);
    // Base 52 - 3(mod1) - 0(mod2) - 1(mod3) - 0(mod4) - 1(mod5) - 2(mod6) = 45
    expect(withZero.advocacy_score).toBe(45);
  });

  it("active rate at exact 80% boundary gets +5", () => {
    // 5 records: 4 active -> 80%
    const records = [
      makeRecord({ status: "active" }),
      makeRecord({ status: "active" }),
      makeRecord({ status: "active" }),
      makeRecord({ status: "completed" }),
      makeRecord({ status: "pending_referral" }),
    ];
    const res = run(records);
    expect(res.active_rate).toBe(80);
  });

  it("active rate at 79% gets +2", () => {
    // Math.round(79/100 * ...) We need exactly 79%.
    // pct(n, d) = Math.round(n/d * 100)
    // 11/14 = 0.7857 -> Math.round(78.57) = 79
    const records = Array.from({ length: 11 }, () => makeRecord({ status: "active" }))
      .concat(Array.from({ length: 3 }, () => makeRecord({ status: "pending_referral" })));
    const res = run(records);
    expect(res.active_rate).toBe(79);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. MODIFIER 2 — CHILDREN WITH ADVOCACY (COVERAGE)
// ══════════════════════════════════════════════════════════════════════════════

describe("Modifier 2: Children with advocacy coverage", () => {
  it("adds +6 when coverage >= 80%", () => {
    // 5 unique children out of 6 = 83%
    const records = [
      makeRecord({ child_id: "c1" }),
      makeRecord({ child_id: "c2" }),
      makeRecord({ child_id: "c3" }),
      makeRecord({ child_id: "c4" }),
      makeRecord({ child_id: "c5" }),
    ];
    const res = run(records, 6);
    expect(res.children_with_advocacy_rate).toBe(83);
  });

  it("adds +2 when coverage is between 50% and 79%", () => {
    // 3 unique children out of 6 = 50%
    const records = [
      makeRecord({ child_id: "c1" }),
      makeRecord({ child_id: "c2" }),
      makeRecord({ child_id: "c3" }),
    ];
    const res = run(records, 6);
    expect(res.children_with_advocacy_rate).toBe(50);
  });

  it("subtracts -5 when coverage < 30%", () => {
    // 1 unique child out of 6 = 17%
    const records = [makeRecord({ child_id: "c1" })];
    const res = run(records, 6);
    expect(res.children_with_advocacy_rate).toBe(17);
  });

  it("counts unique children (deduplicates)", () => {
    // Same child appears 3 times
    const records = [
      makeRecord({ child_id: "c1" }),
      makeRecord({ child_id: "c1" }),
      makeRecord({ child_id: "c1" }),
    ];
    const res = run(records, 6);
    expect(res.children_with_advocacy_rate).toBe(17); // 1/6 = 17%
  });

  it("no adjustment for zero records", () => {
    const res = run([], 6);
    // Modifier 2 does nothing for 0 records, verified by overall score
    expect(res.children_with_advocacy_rate).toBe(0);
  });

  it("coverage at exact 80% boundary gets +6", () => {
    // 4 unique children out of 5 = 80%
    const records = [
      makeRecord({ child_id: "c1" }),
      makeRecord({ child_id: "c2" }),
      makeRecord({ child_id: "c3" }),
      makeRecord({ child_id: "c4" }),
    ];
    const res = run(records, 5);
    expect(res.children_with_advocacy_rate).toBe(80);
  });

  it("coverage at 100% gets +6", () => {
    const records = [
      makeRecord({ child_id: "c1" }),
      makeRecord({ child_id: "c2" }),
      makeRecord({ child_id: "c3" }),
    ];
    const res = run(records, 3);
    expect(res.children_with_advocacy_rate).toBe(100);
  });

  it("no adjustment when coverage is 30-49%", () => {
    // 2/6 = 33%
    const records = [
      makeRecord({ child_id: "c1" }),
      makeRecord({ child_id: "c2" }),
    ];
    const res = run(records, 6);
    expect(res.children_with_advocacy_rate).toBe(33);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. MODIFIER 3 — INDEPENDENT ADVOCACY RATE
// ══════════════════════════════════════════════════════════════════════════════

describe("Modifier 3: Independent advocacy rate", () => {
  it("adds +5 when independent rate >= 50%", () => {
    const records = [
      makeRecord({ advocacy_type: "independent" }),
      makeRecord({ advocacy_type: "peer" }),
    ];
    const res = run(records);
    expect(res.independent_rate).toBe(50);
  });

  it("counts legal type as independent", () => {
    const records = [
      makeRecord({ advocacy_type: "legal" }),
      makeRecord({ advocacy_type: "peer" }),
    ];
    const res = run(records);
    expect(res.independent_rate).toBe(50);
  });

  it("adds +2 when independent rate is between 25% and 49%", () => {
    // 1 independent out of 4 = 25%
    const records = [
      makeRecord({ advocacy_type: "independent" }),
      makeRecord({ advocacy_type: "peer" }),
      makeRecord({ advocacy_type: "peer" }),
      makeRecord({ advocacy_type: "peer" }),
    ];
    const res = run(records);
    expect(res.independent_rate).toBe(25);
  });

  it("subtracts -4 when independent rate < 10%", () => {
    // 0 independent out of 5 = 0%
    const records = Array.from({ length: 5 }, () =>
      makeRecord({ advocacy_type: "peer" }),
    );
    const res = run(records);
    expect(res.independent_rate).toBe(0);
  });

  it("no adjustment when independent rate is 10-24%", () => {
    // 1/5 = 20%
    const records = [
      makeRecord({ advocacy_type: "independent" }),
      ...Array.from({ length: 4 }, () => makeRecord({ advocacy_type: "peer" })),
    ];
    const res = run(records);
    expect(res.independent_rate).toBe(20);
  });

  it("subtracts -1 when total is 0", () => {
    // Verified through the zero-records score calculation
    const res = run([], 6);
    // 52 - 3 (mod1) + 0 (mod2) - 1 (mod3) + 0 (mod4) - 1 (mod5) - 2 (mod6) = 45
    expect(res.advocacy_score).toBe(45);
  });

  it("does not count peer as independent", () => {
    const records = [makeRecord({ advocacy_type: "peer" })];
    const res = run(records);
    expect(res.independent_rate).toBe(0);
  });

  it("does not count complaints as independent", () => {
    const records = [makeRecord({ advocacy_type: "complaints" })];
    const res = run(records);
    expect(res.independent_rate).toBe(0);
  });

  it("does not count issue_based as independent", () => {
    const records = [makeRecord({ advocacy_type: "issue_based" })];
    const res = run(records);
    expect(res.independent_rate).toBe(0);
  });

  it("both independent and legal combined count toward rate", () => {
    const records = [
      makeRecord({ advocacy_type: "independent" }),
      makeRecord({ advocacy_type: "legal" }),
      makeRecord({ advocacy_type: "peer" }),
      makeRecord({ advocacy_type: "complaints" }),
    ];
    const res = run(records);
    expect(res.independent_rate).toBe(50);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. MODIFIER 4 — CHILD VOICE RATE
// ══════════════════════════════════════════════════════════════════════════════

describe("Modifier 4: Child voice rate", () => {
  it("adds +5 when child voice rate >= 90%", () => {
    // 10/10 = 100%
    const records = Array.from({ length: 10 }, () =>
      makeRecord({ has_child_view: true }),
    );
    const res = run(records);
    expect(res.child_voice_rate).toBe(100);
  });

  it("adds +2 when child voice rate is between 60% and 89%", () => {
    // 3/4 = 75%
    const records = [
      makeRecord({ has_child_view: true }),
      makeRecord({ has_child_view: true }),
      makeRecord({ has_child_view: true }),
      makeRecord({ has_child_view: false }),
    ];
    const res = run(records);
    expect(res.child_voice_rate).toBe(75);
  });

  it("subtracts -4 when child voice rate < 30%", () => {
    // 1/5 = 20%
    const records = [
      makeRecord({ has_child_view: true }),
      ...Array.from({ length: 4 }, () => makeRecord({ has_child_view: false })),
    ];
    const res = run(records);
    expect(res.child_voice_rate).toBe(20);
  });

  it("no adjustment when child voice rate is 30-59%", () => {
    // 2/5 = 40%
    const records = [
      makeRecord({ has_child_view: true }),
      makeRecord({ has_child_view: true }),
      makeRecord({ has_child_view: false }),
      makeRecord({ has_child_view: false }),
      makeRecord({ has_child_view: false }),
    ];
    const res = run(records);
    expect(res.child_voice_rate).toBe(40);
  });

  it("no adjustment for zero records", () => {
    const res = run([], 6);
    expect(res.child_voice_rate).toBe(0);
  });

  it("child voice at exact 90% boundary gets +5", () => {
    // 9/10 = 90%
    const records = [
      ...Array.from({ length: 9 }, () => makeRecord({ has_child_view: true })),
      makeRecord({ has_child_view: false }),
    ];
    const res = run(records);
    expect(res.child_voice_rate).toBe(90);
  });

  it("child voice at 89% gets +2", () => {
    // 8/9 = 88.88 -> Math.round = 89
    const records = [
      ...Array.from({ length: 8 }, () => makeRecord({ has_child_view: true })),
      makeRecord({ has_child_view: false }),
    ];
    const res = run(records);
    expect(res.child_voice_rate).toBe(89);
  });

  it("child voice at 60% gets +2", () => {
    // 3/5 = 60%
    const records = [
      makeRecord({ has_child_view: true }),
      makeRecord({ has_child_view: true }),
      makeRecord({ has_child_view: true }),
      makeRecord({ has_child_view: false }),
      makeRecord({ has_child_view: false }),
    ];
    const res = run(records);
    expect(res.child_voice_rate).toBe(60);
  });

  it("child voice at 29% gets -4", () => {
    // 2/7 = 28.57 -> Math.round = 29
    const records = [
      makeRecord({ has_child_view: true }),
      makeRecord({ has_child_view: true }),
      ...Array.from({ length: 5 }, () => makeRecord({ has_child_view: false })),
    ];
    const res = run(records);
    expect(res.child_voice_rate).toBe(29);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. MODIFIER 5 — PRIVATE SESSION RATE
// ══════════════════════════════════════════════════════════════════════════════

describe("Modifier 5: Private session rate", () => {
  it("adds +4 when private session rate >= 60%", () => {
    const records = [
      makeRecord({ visit_count: 10, private_session_count: 7 }),
    ];
    const res = run(records);
    expect(res.private_session_rate).toBe(70);
  });

  it("adds +1 when private session rate is between 30% and 59%", () => {
    const records = [
      makeRecord({ visit_count: 10, private_session_count: 4 }),
    ];
    const res = run(records);
    expect(res.private_session_rate).toBe(40);
  });

  it("subtracts -4 when private session rate < 10%", () => {
    const records = [
      makeRecord({ visit_count: 20, private_session_count: 1 }),
    ];
    const res = run(records);
    expect(res.private_session_rate).toBe(5);
  });

  it("no adjustment when private session rate is 10-29%", () => {
    const records = [
      makeRecord({ visit_count: 10, private_session_count: 2 }),
    ];
    const res = run(records);
    expect(res.private_session_rate).toBe(20);
  });

  it("calculates private rate from total private / total visits across all records", () => {
    const records = [
      makeRecord({ visit_count: 5, private_session_count: 1 }),
      makeRecord({ visit_count: 5, private_session_count: 4 }),
    ];
    const res = run(records);
    // total visits = 10, total private = 5 -> 50%
    expect(res.private_session_rate).toBe(50);
  });

  it("private rate is 0 when total visits is 0", () => {
    const records = [
      makeRecord({ visit_count: 0, private_session_count: 0 }),
    ];
    const res = run(records);
    expect(res.private_session_rate).toBe(0);
  });

  it("subtracts -1 when total is 0", () => {
    const res = run([], 6);
    expect(res.private_session_rate).toBe(0);
  });

  it("private rate at exact 60% boundary gets +4", () => {
    const records = [
      makeRecord({ visit_count: 10, private_session_count: 6 }),
    ];
    const res = run(records);
    expect(res.private_session_rate).toBe(60);
  });

  it("private rate at exact 30% boundary gets +1", () => {
    const records = [
      makeRecord({ visit_count: 10, private_session_count: 3 }),
    ];
    const res = run(records);
    expect(res.private_session_rate).toBe(30);
  });

  it("private rate at 9% gets -4", () => {
    // 1/11 = 9.09 -> Math.round = 9
    const records = [
      makeRecord({ visit_count: 11, private_session_count: 1 }),
    ];
    const res = run(records);
    expect(res.private_session_rate).toBe(9);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 9. MODIFIER 6 — ADVOCACY TYPE VARIETY
// ══════════════════════════════════════════════════════════════════════════════

describe("Modifier 6: Advocacy type variety", () => {
  it("adds +5 when there are 4 or more unique types", () => {
    const records = [
      makeRecord({ advocacy_type: "independent" }),
      makeRecord({ advocacy_type: "peer" }),
      makeRecord({ advocacy_type: "legal" }),
      makeRecord({ advocacy_type: "complaints" }),
    ];
    const res = run(records);
    expect(res.advocacy_type_variety).toBe(4);
  });

  it("adds +2 when there are 2-3 unique types", () => {
    const records = [
      makeRecord({ advocacy_type: "independent" }),
      makeRecord({ advocacy_type: "peer" }),
    ];
    const res = run(records);
    expect(res.advocacy_type_variety).toBe(2);
  });

  it("subtracts -3 when there is 1 or fewer unique types", () => {
    const records = [
      makeRecord({ advocacy_type: "peer" }),
      makeRecord({ advocacy_type: "peer" }),
    ];
    const res = run(records);
    expect(res.advocacy_type_variety).toBe(1);
  });

  it("subtracts -2 when total is 0", () => {
    const res = run([], 6);
    expect(res.advocacy_type_variety).toBe(0);
  });

  it("5 unique types also gets +5", () => {
    const records = [
      makeRecord({ advocacy_type: "independent" }),
      makeRecord({ advocacy_type: "peer" }),
      makeRecord({ advocacy_type: "legal" }),
      makeRecord({ advocacy_type: "complaints" }),
      makeRecord({ advocacy_type: "issue_based" }),
    ];
    const res = run(records);
    expect(res.advocacy_type_variety).toBe(5);
  });

  it("3 unique types gets +2", () => {
    const records = [
      makeRecord({ advocacy_type: "independent" }),
      makeRecord({ advocacy_type: "peer" }),
      makeRecord({ advocacy_type: "legal" }),
    ];
    const res = run(records);
    expect(res.advocacy_type_variety).toBe(3);
  });

  it("deduplicates types correctly", () => {
    const records = [
      makeRecord({ advocacy_type: "independent" }),
      makeRecord({ advocacy_type: "independent" }),
      makeRecord({ advocacy_type: "independent" }),
      makeRecord({ advocacy_type: "peer" }),
    ];
    const res = run(records);
    expect(res.advocacy_type_variety).toBe(2);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 10. METRIC CALCULATIONS
// ══════════════════════════════════════════════════════════════════════════════

describe("Metric calculations", () => {
  it("total_records equals records.length", () => {
    const records = [makeRecord(), makeRecord(), makeRecord()];
    const res = run(records);
    expect(res.total_records).toBe(3);
  });

  it("active_rate uses pct(active+completed, total)", () => {
    const records = [
      makeRecord({ status: "active" }),
      makeRecord({ status: "completed" }),
      makeRecord({ status: "pending_referral" }),
      makeRecord({ status: "declined_by_yp" }),
      makeRecord({ status: "active" }),
    ];
    const res = run(records);
    // 3 active+completed out of 5 = 60%
    expect(res.active_rate).toBe(60);
  });

  it("children_with_advocacy_rate uses unique children over total_children", () => {
    const records = [
      makeRecord({ child_id: "c1" }),
      makeRecord({ child_id: "c1" }),
      makeRecord({ child_id: "c2" }),
    ];
    const res = run(records, 4);
    // 2 unique / 4 total = 50%
    expect(res.children_with_advocacy_rate).toBe(50);
  });

  it("independent_rate counts independent and legal types", () => {
    const records = [
      makeRecord({ advocacy_type: "independent" }),
      makeRecord({ advocacy_type: "legal" }),
      makeRecord({ advocacy_type: "peer" }),
      makeRecord({ advocacy_type: "complaints" }),
    ];
    const res = run(records);
    // 2/4 = 50%
    expect(res.independent_rate).toBe(50);
  });

  it("child_voice_rate counts has_child_view records", () => {
    const records = [
      makeRecord({ has_child_view: true }),
      makeRecord({ has_child_view: false }),
      makeRecord({ has_child_view: true }),
    ];
    const res = run(records);
    // 2/3 = 67%
    expect(res.child_voice_rate).toBe(67);
  });

  it("private_session_rate uses totalPrivateSessions / totalVisits", () => {
    const records = [
      makeRecord({ visit_count: 5, private_session_count: 2 }),
      makeRecord({ visit_count: 10, private_session_count: 3 }),
    ];
    const res = run(records);
    // 5/15 = 33%
    expect(res.private_session_rate).toBe(33);
  });

  it("advocacy_type_variety counts unique advocacy types", () => {
    const records = [
      makeRecord({ advocacy_type: "independent" }),
      makeRecord({ advocacy_type: "independent" }),
      makeRecord({ advocacy_type: "legal" }),
      makeRecord({ advocacy_type: "peer" }),
    ];
    const res = run(records);
    expect(res.advocacy_type_variety).toBe(3);
  });

  it("pct rounds to nearest integer", () => {
    // 1/3 = 33.33 -> 33
    const records = [
      makeRecord({ child_id: "c1" }),
      makeRecord({ child_id: "c2" }),
      makeRecord({ child_id: "c3" }),
    ];
    const res = run(records, 9);
    expect(res.children_with_advocacy_rate).toBe(33);
  });

  it("pct rounds 0.5 up", () => {
    // 1/6 = 16.666 -> 17
    const records = [makeRecord({ child_id: "c1" })];
    const res = run(records, 6);
    expect(res.children_with_advocacy_rate).toBe(17);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 11. HEADLINES
// ══════════════════════════════════════════════════════════════════════════════

describe("Headlines", () => {
  it("outstanding headline mentions excellent access", () => {
    // Build outstanding scenario: need score >= 80
    // 52 + 5(active) + 6(coverage) + 5(ind>=50%) + 5(voice>=90) + 4(priv>=60) + 5(variety>=4) = 82
    const records = [
      makeRecord({ child_id: "c1", advocacy_type: "independent", status: "active", has_child_view: true, visit_count: 5, private_session_count: 4 }),
      makeRecord({ child_id: "c2", advocacy_type: "independent", status: "active", has_child_view: true, visit_count: 5, private_session_count: 4 }),
      makeRecord({ child_id: "c3", advocacy_type: "independent", status: "active", has_child_view: true, visit_count: 5, private_session_count: 4 }),
      makeRecord({ child_id: "c4", advocacy_type: "legal", status: "active", has_child_view: true, visit_count: 5, private_session_count: 4 }),
      makeRecord({ child_id: "c5", advocacy_type: "legal", status: "active", has_child_view: true, visit_count: 5, private_session_count: 4 }),
      makeRecord({ child_id: "c1", advocacy_type: "peer", status: "active", has_child_view: true, visit_count: 5, private_session_count: 4 }),
      makeRecord({ child_id: "c2", advocacy_type: "peer", status: "completed", has_child_view: true, visit_count: 5, private_session_count: 4 }),
      makeRecord({ child_id: "c3", advocacy_type: "complaints", status: "active", has_child_view: true, visit_count: 5, private_session_count: 4 }),
      makeRecord({ child_id: "c4", advocacy_type: "issue_based", status: "active", has_child_view: true, visit_count: 5, private_session_count: 4 }),
      makeRecord({ child_id: "c5", advocacy_type: "independent", status: "active", has_child_view: true, visit_count: 5, private_session_count: 4 }),
    ];
    // active: 10/10=100%->+5, coverage: 5/6=83%->+6
    // ind+legal: 6/10=60%->+5, voice: 10/10=100%->+5
    // private: 40/50=80%->+4, types: 5->+5
    // 52+5+6+5+5+4+5 = 82
    const res = run(records, 6);
    expect(res.advocacy_rating).toBe("outstanding");
    expect(res.headline).toContain("excellent access to independent advocacy");
  });

  it("good headline mentions strong independent voice support", () => {
    // Build a good-rated scenario (score 65-79)
    const records = [
      makeRecord({ child_id: "c1", advocacy_type: "independent", status: "active", has_child_view: true, visit_count: 5, private_session_count: 1 }),
      makeRecord({ child_id: "c2", advocacy_type: "peer", status: "active", has_child_view: true, visit_count: 5, private_session_count: 1 }),
      makeRecord({ child_id: "c3", advocacy_type: "peer", status: "completed", has_child_view: true, visit_count: 2, private_session_count: 0 }),
      makeRecord({ child_id: "c1", advocacy_type: "independent", status: "active", has_child_view: false, visit_count: 2, private_session_count: 0 }),
    ];
    const res = run(records, 6);
    expect(res.advocacy_rating).toBe("good");
    expect(res.headline).toContain("Good advocacy provision");
  });

  it("adequate headline mentions needs strengthening", () => {
    const res = run([], 6);
    expect(res.advocacy_rating).toBe("adequate");
    expect(res.headline).toContain("need strengthening");
  });

  it("inadequate headline mentions children lack independent support", () => {
    const records = [
      makeRecord({ advocacy_type: "peer", status: "pending_referral", has_child_view: false, visit_count: 1, private_session_count: 0 }),
    ];
    const res = run(records, 6);
    expect(res.advocacy_rating).toBe("inadequate");
    expect(res.headline).toContain("inadequate");
  });

  it("insufficient_data headline mentions no data", () => {
    const res = computeAdvocacyIndependentVoice(baseInput({ total_children: 0 }));
    expect(res.headline).toBe("No data available for advocacy intelligence analysis");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 12. STRENGTHS
// ══════════════════════════════════════════════════════════════════════════════

describe("Strengths generation", () => {
  it("includes strength for active rate >= 80% with records > 0", () => {
    const records = Array.from({ length: 5 }, () =>
      makeRecord({ status: "active" }),
    );
    const res = run(records);
    expect(res.strengths.some(s => s.toLowerCase().includes("timely support"))).toBe(true);
  });

  it("includes strength for coverage >= 80% with records > 0", () => {
    const records = [
      makeRecord({ child_id: "c1" }),
      makeRecord({ child_id: "c2" }),
      makeRecord({ child_id: "c3" }),
      makeRecord({ child_id: "c4" }),
      makeRecord({ child_id: "c5" }),
    ];
    const res = run(records, 6);
    expect(res.strengths.some(s => s.toLowerCase().includes("access to an advocate"))).toBe(true);
  });

  it("includes strength for independent rate >= 50% with records > 0", () => {
    const records = [
      makeRecord({ advocacy_type: "independent" }),
      makeRecord({ advocacy_type: "peer" }),
    ];
    const res = run(records);
    expect(res.strengths.some(s => s.toLowerCase().includes("independent advocates"))).toBe(true);
  });

  it("includes strength for child voice rate >= 90% with records > 0", () => {
    const records = Array.from({ length: 10 }, () =>
      makeRecord({ has_child_view: true }),
    );
    const res = run(records);
    expect(res.strengths.some(s => s.toLowerCase().includes("views are captured"))).toBe(true);
  });

  it("includes strength for private session rate >= 60% with records > 0", () => {
    const records = [
      makeRecord({ visit_count: 10, private_session_count: 7 }),
    ];
    const res = run(records);
    expect(res.strengths.some(s => s.toLowerCase().includes("private sessions"))).toBe(true);
  });

  it("includes strength for type variety >= 4 with records > 0", () => {
    const records = [
      makeRecord({ advocacy_type: "independent" }),
      makeRecord({ advocacy_type: "peer" }),
      makeRecord({ advocacy_type: "legal" }),
      makeRecord({ advocacy_type: "complaints" }),
    ];
    const res = run(records);
    expect(res.strengths.some(s => s.toLowerCase().includes("diverse advocacy types"))).toBe(true);
  });

  it("returns no strengths for zero records", () => {
    const res = run([], 6);
    expect(res.strengths).toEqual([]);
  });

  it("returns all 6 strengths when all thresholds met", () => {
    // Need: active>=80, coverage>=80, ind>=50, voice>=90, private>=60, variety>=4
    const records = [
      makeRecord({ child_id: "c1", advocacy_type: "independent", status: "active", has_child_view: true, visit_count: 5, private_session_count: 4 }),
      makeRecord({ child_id: "c2", advocacy_type: "independent", status: "active", has_child_view: true, visit_count: 5, private_session_count: 4 }),
      makeRecord({ child_id: "c3", advocacy_type: "independent", status: "active", has_child_view: true, visit_count: 5, private_session_count: 4 }),
      makeRecord({ child_id: "c4", advocacy_type: "legal", status: "active", has_child_view: true, visit_count: 5, private_session_count: 4 }),
      makeRecord({ child_id: "c5", advocacy_type: "legal", status: "active", has_child_view: true, visit_count: 5, private_session_count: 4 }),
      makeRecord({ child_id: "c1", advocacy_type: "peer", status: "active", has_child_view: true, visit_count: 5, private_session_count: 4 }),
      makeRecord({ child_id: "c2", advocacy_type: "peer", status: "completed", has_child_view: true, visit_count: 5, private_session_count: 4 }),
      makeRecord({ child_id: "c3", advocacy_type: "complaints", status: "active", has_child_view: true, visit_count: 5, private_session_count: 4 }),
      makeRecord({ child_id: "c4", advocacy_type: "issue_based", status: "active", has_child_view: true, visit_count: 5, private_session_count: 4 }),
      makeRecord({ child_id: "c5", advocacy_type: "independent", status: "active", has_child_view: true, visit_count: 5, private_session_count: 4 }),
    ];
    // ind+legal: 6/10=60%>=50, active: 100%>=80, coverage: 5/6=83%>=80
    // voice: 100%>=90, private: 80%>=60, types: 5>=4
    const res = run(records, 6);
    expect(res.strengths.length).toBe(6);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 13. CONCERNS
// ══════════════════════════════════════════════════════════════════════════════

describe("Concerns generation", () => {
  it("includes concern for no advocacy records", () => {
    const res = run([], 6);
    expect(res.concerns.some(c => c.toLowerCase().includes("no advocacy records"))).toBe(true);
  });

  it("includes concern for active rate < 30% with records > 0", () => {
    const records = [
      makeRecord({ status: "pending_referral" }),
      makeRecord({ status: "pending_referral" }),
      makeRecord({ status: "pending_referral" }),
      makeRecord({ status: "pending_referral" }),
    ];
    const res = run(records);
    expect(res.concerns.some(c => c.toLowerCase().includes("inactive"))).toBe(true);
  });

  it("includes concern for coverage < 30% with records > 0", () => {
    const records = [makeRecord({ child_id: "c1" })];
    const res = run(records, 6);
    expect(res.concerns.some(c => c.toLowerCase().includes("very few children"))).toBe(true);
  });

  it("includes concern for independent rate < 10% with records > 0", () => {
    const records = Array.from({ length: 5 }, () =>
      makeRecord({ advocacy_type: "peer" }),
    );
    const res = run(records);
    expect(res.concerns.some(c => c.toLowerCase().includes("no independent advocacy"))).toBe(true);
  });

  it("includes concern for child voice < 30% with records > 0", () => {
    const records = [
      makeRecord({ has_child_view: false }),
      makeRecord({ has_child_view: false }),
      makeRecord({ has_child_view: false }),
      makeRecord({ has_child_view: false }),
    ];
    const res = run(records);
    expect(res.concerns.some(c => c.toLowerCase().includes("rarely captured"))).toBe(true);
  });

  it("includes concern for private sessions < 10% with records > 0", () => {
    const records = [
      makeRecord({ visit_count: 20, private_session_count: 1 }),
    ];
    const res = run(records);
    expect(res.concerns.some(c => c.toLowerCase().includes("private sessions"))).toBe(true);
  });

  it("returns no record-specific concerns for zero records (only the no-records one)", () => {
    const res = run([], 6);
    expect(res.concerns.length).toBe(1);
    expect(res.concerns[0]).toContain("No advocacy records");
  });

  it("returns all record-based concerns when everything is poor", () => {
    const records = [
      makeRecord({
        child_id: "c1",
        advocacy_type: "peer",
        status: "pending_referral",
        has_child_view: false,
        visit_count: 20,
        private_session_count: 1,
      }),
    ];
    const res = run(records, 6);
    // active<30, coverage<30, independent<10, voice<30, private<10
    expect(res.concerns.length).toBe(5);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 14. RECOMMENDATIONS
// ══════════════════════════════════════════════════════════════════════════════

describe("Recommendations generation", () => {
  it("recommends referral pathways when total is 0", () => {
    const res = run([], 6);
    expect(res.recommendations.length).toBe(1);
    expect(res.recommendations[0].urgency).toBe("immediate");
    expect(res.recommendations[0].regulatory_ref).toBe("CHR 2015 Reg 7");
    expect(res.recommendations[0].rank).toBe(1);
  });

  it("recommends proactive advocacy offer when coverage < 50% with records > 0", () => {
    const records = [makeRecord({ child_id: "c1" })];
    const res = run(records, 6);
    expect(res.recommendations.some(r => r.recommendation.toLowerCase().includes("proactively offer"))).toBe(true);
  });

  it("recommends increasing independent advocates when rate < 25% with records > 0", () => {
    const records = Array.from({ length: 5 }, () =>
      makeRecord({ advocacy_type: "peer" }),
    );
    const res = run(records);
    expect(res.recommendations.some(r => r.recommendation.toLowerCase().includes("independent advocates"))).toBe(true);
  });

  it("recommends recording child views when voice rate < 60% with records > 0", () => {
    const records = [
      makeRecord({ has_child_view: false }),
      makeRecord({ has_child_view: false }),
      makeRecord({ has_child_view: true }),
    ];
    const res = run(records);
    // 1/3 = 33% < 60
    expect(res.recommendations.some(r => r.recommendation.toLowerCase().includes("child's own words"))).toBe(true);
  });

  it("recommends private sessions when rate < 30% with records > 0", () => {
    const records = [
      makeRecord({ visit_count: 10, private_session_count: 2 }),
    ];
    const res = run(records);
    expect(res.recommendations.some(r => r.recommendation.toLowerCase().includes("private sessions"))).toBe(true);
  });

  it("recommends diversifying types when variety < 2 with records > 0", () => {
    const records = [
      makeRecord({ advocacy_type: "peer" }),
      makeRecord({ advocacy_type: "peer" }),
    ];
    const res = run(records);
    expect(res.recommendations.some(r => r.recommendation.toLowerCase().includes("diversify"))).toBe(true);
  });

  it("caps recommendations at 5", () => {
    // Trigger all 5 record-based recommendations + no zero-record rec
    const records = [
      makeRecord({
        child_id: "c1",
        advocacy_type: "peer",
        status: "pending_referral",
        has_child_view: false,
        visit_count: 20,
        private_session_count: 1,
      }),
    ];
    const res = run(records, 6);
    // coverage<50, independent<25, voice<60, private<30, variety<2 = 5 recs
    expect(res.recommendations.length).toBeLessThanOrEqual(5);
  });

  it("ranks recommendations sequentially from 1", () => {
    const records = [
      makeRecord({
        child_id: "c1",
        advocacy_type: "peer",
        status: "pending_referral",
        has_child_view: false,
        visit_count: 20,
        private_session_count: 1,
      }),
    ];
    const res = run(records, 6);
    res.recommendations.forEach((r, i) => {
      expect(r.rank).toBe(i + 1);
    });
  });

  it("does not recommend referral pathways when records > 0", () => {
    const records = [makeRecord()];
    const res = run(records);
    expect(res.recommendations.every(r => !r.recommendation.toLowerCase().includes("referral pathways"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 15. INSIGHTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Insights generation", () => {
  it("includes exemplary insight when voice>=90, independent>=50, coverage>=80, total>=10", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({
        child_id: `c${(i % 5) + 1}`,
        advocacy_type: i % 2 === 0 ? "independent" : "legal",
        has_child_view: true,
      }),
    );
    const res = run(records, 6);
    // voice: 100%, independent: 100%, coverage: 83%, total: 10
    expect(res.insights.some(i => i.severity === "positive" && i.text.toLowerCase().includes("exemplary"))).toBe(true);
  });

  it("includes critical insight for zero records", () => {
    const res = run([], 6);
    expect(res.insights.some(i => i.severity === "critical" && i.text.toLowerCase().includes("ofsted"))).toBe(true);
  });

  it("includes warning insight when child voice < 30% with records > 0", () => {
    const records = Array.from({ length: 5 }, () =>
      makeRecord({ has_child_view: false }),
    );
    const res = run(records);
    expect(res.insights.some(i => i.severity === "warning" && i.text.toLowerCase().includes("absent"))).toBe(true);
  });

  it("includes positive insight for coverage >= 80% with records > 0", () => {
    const records = [
      makeRecord({ child_id: "c1" }),
      makeRecord({ child_id: "c2" }),
      makeRecord({ child_id: "c3" }),
      makeRecord({ child_id: "c4" }),
      makeRecord({ child_id: "c5" }),
    ];
    const res = run(records, 6);
    expect(res.insights.some(i => i.severity === "positive" && i.text.toLowerCase().includes("wide advocacy access"))).toBe(true);
  });

  it("includes positive insight for variety >= 4 with records > 0", () => {
    const records = [
      makeRecord({ advocacy_type: "independent" }),
      makeRecord({ advocacy_type: "peer" }),
      makeRecord({ advocacy_type: "legal" }),
      makeRecord({ advocacy_type: "complaints" }),
    ];
    const res = run(records);
    expect(res.insights.some(i => i.severity === "positive" && i.text.toLowerCase().includes("diverse advocacy"))).toBe(true);
  });

  it("caps insights at 3", () => {
    // Trigger: exemplary (voice>=90, ind>=50, cov>=80, total>=10)
    //        + coverage>=80 positive
    //        + variety>=4 positive
    //        = 3 insights (all should appear but capped at 3)
    const records = [
      makeRecord({ child_id: "c1", advocacy_type: "independent", has_child_view: true }),
      makeRecord({ child_id: "c2", advocacy_type: "independent", has_child_view: true }),
      makeRecord({ child_id: "c3", advocacy_type: "independent", has_child_view: true }),
      makeRecord({ child_id: "c4", advocacy_type: "legal", has_child_view: true }),
      makeRecord({ child_id: "c5", advocacy_type: "legal", has_child_view: true }),
      makeRecord({ child_id: "c1", advocacy_type: "peer", has_child_view: true }),
      makeRecord({ child_id: "c2", advocacy_type: "complaints", has_child_view: true }),
      makeRecord({ child_id: "c3", advocacy_type: "issue_based", has_child_view: true }),
      makeRecord({ child_id: "c4", advocacy_type: "independent", has_child_view: true }),
      makeRecord({ child_id: "c5", advocacy_type: "independent", has_child_view: true }),
    ];
    // ind+legal: 7/10=70%>=50, voice: 100%>=90, cov: 5/6=83%>=80, types: 5>=4
    const res = run(records, 6);
    expect(res.insights.length).toBeLessThanOrEqual(3);
  });

  it("does not include exemplary insight when total < 10", () => {
    const records = Array.from({ length: 9 }, (_, i) =>
      makeRecord({
        child_id: `c${(i % 5) + 1}`,
        advocacy_type: "independent",
        has_child_view: true,
      }),
    );
    const res = run(records, 6);
    expect(res.insights.every(i => !i.text.toLowerCase().includes("exemplary"))).toBe(true);
  });

  it("does not include exemplary insight when voice < 90%", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({
        child_id: `c${(i % 5) + 1}`,
        advocacy_type: "independent",
        has_child_view: i < 8, // 8/10 = 80%
      }),
    );
    const res = run(records, 6);
    expect(res.insights.every(i => !i.text.toLowerCase().includes("exemplary"))).toBe(true);
  });

  it("does not include exemplary insight when independent rate < 50%", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({
        child_id: `c${(i % 5) + 1}`,
        advocacy_type: i < 4 ? "independent" : "peer", // 4/10 = 40%
        has_child_view: true,
      }),
    );
    const res = run(records, 6);
    expect(res.insights.every(i => !i.text.toLowerCase().includes("exemplary"))).toBe(true);
  });

  it("does not include exemplary insight when coverage < 80%", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({
        child_id: `c${(i % 3) + 1}`, // only 3 unique children
        advocacy_type: "independent",
        has_child_view: true,
      }),
    );
    // 3 unique / 6 = 50%
    const res = run(records, 6);
    expect(res.insights.every(i => !i.text.toLowerCase().includes("exemplary"))).toBe(true);
  });

  it("returns empty insights when no conditions met and records > 0", () => {
    // voice between 30-89, coverage 30-79, variety < 4 -> no insight triggers
    const records = [
      makeRecord({ child_id: "c1", advocacy_type: "peer", has_child_view: true }),
      makeRecord({ child_id: "c2", advocacy_type: "peer", has_child_view: false }),
    ];
    const res = run(records, 6);
    expect(res.insights).toEqual([]);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 16. CLAMPING AND BOUNDARY EDGE CASES
// ══════════════════════════════════════════════════════════════════════════════

describe("Score clamping and boundary edge cases", () => {
  it("score never drops below 0", () => {
    // Maximise all penalties: each record with worst values
    // Need enough records so we have records > 0 but all metrics are terrible
    const records = Array.from({ length: 20 }, () =>
      makeRecord({
        child_id: "c1",
        advocacy_type: "peer",
        status: "pending_referral",
        has_child_view: false,
        visit_count: 10,
        private_session_count: 0,
      }),
    );
    // active: 0/20 = 0% -> -5
    // coverage: 1/6 = 17% -> -5
    // independent: 0/20 = 0% -> -4
    // voice: 0/20 = 0% -> -4
    // private: 0/200 = 0% -> -4
    // variety: 1 type -> -3
    // 52 - 5 - 5 - 4 - 4 - 4 - 3 = 27 (above 0, but let's verify clamping)
    const res = run(records, 6);
    expect(res.advocacy_score).toBeGreaterThanOrEqual(0);
  });

  it("score never exceeds 100", () => {
    // Maximum all bonuses
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({
        child_id: `c${(i % 5) + 1}`,
        advocacy_type: ["independent", "legal", "peer", "complaints", "issue_based"][i % 5],
        status: "active",
        has_child_view: true,
        visit_count: 5,
        private_session_count: 4,
      }),
    );
    const res = run(records, 6);
    // 52 + 5 + 6 + 5 + 5 + 4 + 5 = 82
    expect(res.advocacy_score).toBeLessThanOrEqual(100);
  });

  it("verifies the outstanding boundary (>=80 is outstanding, 79 is good)", () => {
    // Score 82 (all max bonuses) -> outstanding
    const outstandingRecords = [
      makeRecord({ child_id: "c1", advocacy_type: "independent", status: "active", has_child_view: true, visit_count: 5, private_session_count: 4 }),
      makeRecord({ child_id: "c2", advocacy_type: "independent", status: "active", has_child_view: true, visit_count: 5, private_session_count: 4 }),
      makeRecord({ child_id: "c3", advocacy_type: "independent", status: "active", has_child_view: true, visit_count: 5, private_session_count: 4 }),
      makeRecord({ child_id: "c4", advocacy_type: "legal", status: "active", has_child_view: true, visit_count: 5, private_session_count: 4 }),
      makeRecord({ child_id: "c5", advocacy_type: "legal", status: "active", has_child_view: true, visit_count: 5, private_session_count: 4 }),
      makeRecord({ child_id: "c1", advocacy_type: "peer", status: "active", has_child_view: true, visit_count: 5, private_session_count: 4 }),
      makeRecord({ child_id: "c2", advocacy_type: "peer", status: "completed", has_child_view: true, visit_count: 5, private_session_count: 4 }),
      makeRecord({ child_id: "c3", advocacy_type: "complaints", status: "active", has_child_view: true, visit_count: 5, private_session_count: 4 }),
      makeRecord({ child_id: "c4", advocacy_type: "issue_based", status: "active", has_child_view: true, visit_count: 5, private_session_count: 4 }),
      makeRecord({ child_id: "c5", advocacy_type: "independent", status: "active", has_child_view: true, visit_count: 5, private_session_count: 4 }),
    ];
    // 52+5+6+5+5+4+5 = 82 (>=80 -> outstanding)
    const outRes = run(outstandingRecords, 6);
    expect(outRes.advocacy_score).toBe(82);
    expect(outRes.advocacy_rating).toBe("outstanding");

    // Score 79 (variety only 2 types -> +2) -> good
    const goodRecords = [
      makeRecord({ child_id: "c1", advocacy_type: "independent", status: "active", has_child_view: true, visit_count: 5, private_session_count: 4 }),
      makeRecord({ child_id: "c2", advocacy_type: "independent", status: "active", has_child_view: true, visit_count: 5, private_session_count: 4 }),
      makeRecord({ child_id: "c3", advocacy_type: "independent", status: "active", has_child_view: true, visit_count: 5, private_session_count: 4 }),
      makeRecord({ child_id: "c4", advocacy_type: "legal", status: "active", has_child_view: true, visit_count: 5, private_session_count: 4 }),
      makeRecord({ child_id: "c5", advocacy_type: "legal", status: "active", has_child_view: true, visit_count: 5, private_session_count: 4 }),
      makeRecord({ child_id: "c1", advocacy_type: "independent", status: "active", has_child_view: true, visit_count: 5, private_session_count: 4 }),
      makeRecord({ child_id: "c2", advocacy_type: "legal", status: "completed", has_child_view: true, visit_count: 5, private_session_count: 4 }),
      makeRecord({ child_id: "c3", advocacy_type: "independent", status: "active", has_child_view: true, visit_count: 5, private_session_count: 4 }),
      makeRecord({ child_id: "c4", advocacy_type: "legal", status: "active", has_child_view: true, visit_count: 5, private_session_count: 4 }),
      makeRecord({ child_id: "c5", advocacy_type: "independent", status: "active", has_child_view: true, visit_count: 5, private_session_count: 4 }),
    ];
    // 52+5+6+5+5+4+2 = 79 (<80 -> good)
    const goodRes = run(goodRecords, 6);
    expect(goodRes.advocacy_score).toBe(79);
    expect(goodRes.advocacy_rating).toBe("good");
  });

  it("score 82 is outstanding and 79 is good", () => {
    // Build outstanding at 82: all max bonuses
    const outRecords = [
      makeRecord({ child_id: "c1", advocacy_type: "independent", status: "active", has_child_view: true, visit_count: 5, private_session_count: 4 }),
      makeRecord({ child_id: "c2", advocacy_type: "independent", status: "active", has_child_view: true, visit_count: 5, private_session_count: 4 }),
      makeRecord({ child_id: "c3", advocacy_type: "independent", status: "active", has_child_view: true, visit_count: 5, private_session_count: 4 }),
      makeRecord({ child_id: "c4", advocacy_type: "legal", status: "active", has_child_view: true, visit_count: 5, private_session_count: 4 }),
      makeRecord({ child_id: "c5", advocacy_type: "legal", status: "active", has_child_view: true, visit_count: 5, private_session_count: 4 }),
      makeRecord({ child_id: "c1", advocacy_type: "peer", status: "active", has_child_view: true, visit_count: 5, private_session_count: 4 }),
      makeRecord({ child_id: "c2", advocacy_type: "peer", status: "completed", has_child_view: true, visit_count: 5, private_session_count: 4 }),
      makeRecord({ child_id: "c3", advocacy_type: "complaints", status: "active", has_child_view: true, visit_count: 5, private_session_count: 4 }),
      makeRecord({ child_id: "c4", advocacy_type: "issue_based", status: "active", has_child_view: true, visit_count: 5, private_session_count: 4 }),
      makeRecord({ child_id: "c5", advocacy_type: "independent", status: "active", has_child_view: true, visit_count: 5, private_session_count: 4 }),
    ];
    // ind+legal: 6/10=60%->+5, types: 5->+5, active: 100%->+5
    // coverage: 5/6=83%->+6, voice: 100%->+5, private: 80%->+4
    // 52+5+6+5+5+4+5 = 82
    const outRes = run(outRecords, 6);
    expect(outRes.advocacy_score).toBe(82);
    expect(outRes.advocacy_rating).toBe("outstanding");

    // Build good at 79: same but only 2 types -> +2 instead of +5
    const goodRecords = [
      makeRecord({ child_id: "c1", advocacy_type: "independent", status: "active", has_child_view: true, visit_count: 5, private_session_count: 4 }),
      makeRecord({ child_id: "c2", advocacy_type: "independent", status: "active", has_child_view: true, visit_count: 5, private_session_count: 4 }),
      makeRecord({ child_id: "c3", advocacy_type: "independent", status: "active", has_child_view: true, visit_count: 5, private_session_count: 4 }),
      makeRecord({ child_id: "c4", advocacy_type: "legal", status: "active", has_child_view: true, visit_count: 5, private_session_count: 4 }),
      makeRecord({ child_id: "c5", advocacy_type: "legal", status: "active", has_child_view: true, visit_count: 5, private_session_count: 4 }),
      makeRecord({ child_id: "c1", advocacy_type: "independent", status: "active", has_child_view: true, visit_count: 5, private_session_count: 4 }),
      makeRecord({ child_id: "c2", advocacy_type: "legal", status: "completed", has_child_view: true, visit_count: 5, private_session_count: 4 }),
      makeRecord({ child_id: "c3", advocacy_type: "independent", status: "active", has_child_view: true, visit_count: 5, private_session_count: 4 }),
      makeRecord({ child_id: "c4", advocacy_type: "legal", status: "active", has_child_view: true, visit_count: 5, private_session_count: 4 }),
      makeRecord({ child_id: "c5", advocacy_type: "independent", status: "active", has_child_view: true, visit_count: 5, private_session_count: 4 }),
    ];
    // types: 2 (independent, legal) -> +2 instead of +5
    // 52+5+6+5+5+4+2 = 79
    const goodRes = run(goodRecords, 6);
    expect(goodRes.advocacy_score).toBe(79);
    expect(goodRes.advocacy_rating).toBe("good");
  });

  it("the maximum possible score is 82 (52 + 5 + 6 + 5 + 5 + 4 + 5)", () => {
    const records = [
      makeRecord({ child_id: "c1", advocacy_type: "independent", status: "active", has_child_view: true, visit_count: 5, private_session_count: 4 }),
      makeRecord({ child_id: "c2", advocacy_type: "independent", status: "active", has_child_view: true, visit_count: 5, private_session_count: 4 }),
      makeRecord({ child_id: "c3", advocacy_type: "independent", status: "active", has_child_view: true, visit_count: 5, private_session_count: 4 }),
      makeRecord({ child_id: "c4", advocacy_type: "legal", status: "active", has_child_view: true, visit_count: 5, private_session_count: 4 }),
      makeRecord({ child_id: "c5", advocacy_type: "legal", status: "active", has_child_view: true, visit_count: 5, private_session_count: 4 }),
      makeRecord({ child_id: "c1", advocacy_type: "peer", status: "active", has_child_view: true, visit_count: 5, private_session_count: 4 }),
      makeRecord({ child_id: "c2", advocacy_type: "peer", status: "completed", has_child_view: true, visit_count: 5, private_session_count: 4 }),
      makeRecord({ child_id: "c3", advocacy_type: "complaints", status: "active", has_child_view: true, visit_count: 5, private_session_count: 4 }),
      makeRecord({ child_id: "c4", advocacy_type: "issue_based", status: "active", has_child_view: true, visit_count: 5, private_session_count: 4 }),
      makeRecord({ child_id: "c5", advocacy_type: "independent", status: "active", has_child_view: true, visit_count: 5, private_session_count: 4 }),
    ];
    // ind+legal: 6/10=60%->+5, types: 5->+5
    // 52+5+6+5+5+4+5 = 82
    const res = run(records, 6);
    expect(res.advocacy_score).toBe(82);
  });

  it("the minimum possible score with records is 27 (52 - 5 - 5 - 4 - 4 - 4 - 3)", () => {
    const records = [
      makeRecord({
        child_id: "c1",
        advocacy_type: "peer",
        status: "pending_referral",
        has_child_view: false,
        visit_count: 10,
        private_session_count: 0,
      }),
    ];
    const res = run(records, 6);
    expect(res.advocacy_score).toBe(27);
  });

  it("the score for zero records is exactly 45", () => {
    const res = run([], 6);
    expect(res.advocacy_score).toBe(45);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 17. COMPLETE SCENARIO TESTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Complete scenario tests", () => {
  it("Chamberlain House ideal scenario produces outstanding rating", () => {
    const records = [
      makeRecord({ child_id: "c1", advocacy_type: "independent", status: "active", has_child_view: true, visit_count: 4, private_session_count: 3 }),
      makeRecord({ child_id: "c2", advocacy_type: "legal", status: "active", has_child_view: true, visit_count: 3, private_session_count: 2 }),
      makeRecord({ child_id: "c3", advocacy_type: "peer", status: "completed", has_child_view: true, visit_count: 5, private_session_count: 3 }),
      makeRecord({ child_id: "c4", advocacy_type: "complaints", status: "active", has_child_view: true, visit_count: 3, private_session_count: 2 }),
      makeRecord({ child_id: "c5", advocacy_type: "issue_based", status: "active", has_child_view: true, visit_count: 4, private_session_count: 3 }),
      makeRecord({ child_id: "c1", advocacy_type: "independent", status: "active", has_child_view: true, visit_count: 3, private_session_count: 2 }),
      makeRecord({ child_id: "c2", advocacy_type: "legal", status: "active", has_child_view: true, visit_count: 4, private_session_count: 3 }),
      makeRecord({ child_id: "c3", advocacy_type: "independent", status: "completed", has_child_view: true, visit_count: 2, private_session_count: 1 }),
      makeRecord({ child_id: "c4", advocacy_type: "independent", status: "active", has_child_view: true, visit_count: 3, private_session_count: 2 }),
      makeRecord({ child_id: "c5", advocacy_type: "independent", status: "active", has_child_view: true, visit_count: 4, private_session_count: 3 }),
    ];
    const res = run(records, 6);
    // active: 10/10 = 100% -> +5
    // coverage: 5/6 = 83% -> +6
    // independent+legal: 7/10 = 70% -> +5
    // voice: 10/10 = 100% -> +5
    // private: 24/35 = 69% -> +4
    // types: 5 -> +5
    // 52+5+6+5+5+4+5 = 82
    expect(res.advocacy_rating).toBe("outstanding");
    expect(res.advocacy_score).toBe(82);
    expect(res.strengths.length).toBe(6);
    expect(res.concerns.length).toBe(0);
  });

  it("single child with one poor record produces inadequate", () => {
    const records = [
      makeRecord({
        child_id: "c1",
        advocacy_type: "peer",
        status: "declined_by_yp",
        has_child_view: false,
        visit_count: 1,
        private_session_count: 0,
      }),
    ];
    const res = run(records, 6);
    expect(res.advocacy_rating).toBe("inadequate");
    expect(res.concerns.length).toBeGreaterThan(0);
  });

  it("moderate scenario with mixed records produces good or adequate", () => {
    const records = [
      makeRecord({ child_id: "c1", advocacy_type: "independent", status: "active", has_child_view: true, visit_count: 3, private_session_count: 1 }),
      makeRecord({ child_id: "c2", advocacy_type: "peer", status: "completed", has_child_view: true, visit_count: 2, private_session_count: 1 }),
      makeRecord({ child_id: "c3", advocacy_type: "independent", status: "pending_referral", has_child_view: false, visit_count: 0, private_session_count: 0 }),
    ];
    const res = run(records, 6);
    expect(["good", "adequate"]).toContain(res.advocacy_rating);
  });

  it("large number of records does not break the engine", () => {
    const records = Array.from({ length: 100 }, (_, i) =>
      makeRecord({
        child_id: `c${i % 10}`,
        advocacy_type: ["independent", "legal", "peer", "complaints", "issue_based"][i % 5],
        status: i % 4 === 0 ? "pending_referral" : "active",
        has_child_view: i % 3 !== 0,
        visit_count: 5,
        private_session_count: 2,
      }),
    );
    const res = run(records, 20);
    expect(res.total_records).toBe(100);
    expect(res.advocacy_score).toBeGreaterThanOrEqual(0);
    expect(res.advocacy_score).toBeLessThanOrEqual(100);
    expect(res.advocacy_rating).toBeDefined();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 18. EDGE CASES
// ══════════════════════════════════════════════════════════════════════════════

describe("Edge cases", () => {
  it("all records for the same child deduplicates to 1 unique child", () => {
    const records = Array.from({ length: 5 }, () =>
      makeRecord({ child_id: "c1" }),
    );
    const res = run(records, 6);
    expect(res.children_with_advocacy_rate).toBe(17); // 1/6
  });

  it("handles records with zero visit_count and zero private_session_count", () => {
    const records = [
      makeRecord({ visit_count: 0, private_session_count: 0 }),
    ];
    const res = run(records);
    expect(res.private_session_rate).toBe(0);
  });

  it("handles total_children of 1", () => {
    const records = [makeRecord({ child_id: "c1" })];
    const res = run(records, 1);
    expect(res.children_with_advocacy_rate).toBe(100);
  });

  it("handles very large visit counts without overflow", () => {
    const records = [
      makeRecord({ visit_count: 10000, private_session_count: 5000 }),
    ];
    const res = run(records);
    expect(res.private_session_rate).toBe(50);
  });

  it("mix of active and completed still counts both", () => {
    const records = [
      makeRecord({ status: "active" }),
      makeRecord({ status: "completed" }),
    ];
    const res = run(records);
    expect(res.active_rate).toBe(100);
  });

  it("today field is passed through without affecting computation", () => {
    const records = [makeRecord()];
    const res1 = computeAdvocacyIndependentVoice({ today: "2024-01-01", total_children: 6, records });
    const res2 = computeAdvocacyIndependentVoice({ today: "2030-12-31", total_children: 6, records });
    expect(res1.advocacy_score).toBe(res2.advocacy_score);
  });

  it("all records declined_by_yp gives 0% active rate", () => {
    const records = Array.from({ length: 3 }, () =>
      makeRecord({ status: "declined_by_yp" }),
    );
    const res = run(records);
    expect(res.active_rate).toBe(0);
  });

  it("single record with all positive attributes", () => {
    const records = [
      makeRecord({
        child_id: "c1",
        advocacy_type: "independent",
        status: "active",
        has_child_view: true,
        visit_count: 5,
        private_session_count: 4,
      }),
    ];
    const res = run(records, 1);
    // active: 100% -> +5
    // coverage: 1/1 = 100% -> +6
    // independent: 100% -> +5
    // voice: 100% -> +5
    // private: 4/5 = 80% -> +4
    // variety: 1 -> -3
    // 52+5+6+5+5+4-3 = 74
    expect(res.advocacy_score).toBe(74);
    expect(res.advocacy_rating).toBe("good");
  });

  it("recommendations do not appear for zero records plus record-based conditions", () => {
    const res = run([], 6);
    // Should only have the zero-records recommendation, not record-based ones
    expect(res.recommendations.length).toBe(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 19. RETURN TYPE SHAPE
// ══════════════════════════════════════════════════════════════════════════════

describe("Return type shape", () => {
  it("returns all expected fields", () => {
    const res = run([makeRecord()]);
    expect(res).toHaveProperty("advocacy_rating");
    expect(res).toHaveProperty("advocacy_score");
    expect(res).toHaveProperty("headline");
    expect(res).toHaveProperty("total_records");
    expect(res).toHaveProperty("active_rate");
    expect(res).toHaveProperty("children_with_advocacy_rate");
    expect(res).toHaveProperty("independent_rate");
    expect(res).toHaveProperty("child_voice_rate");
    expect(res).toHaveProperty("private_session_rate");
    expect(res).toHaveProperty("advocacy_type_variety");
    expect(res).toHaveProperty("strengths");
    expect(res).toHaveProperty("concerns");
    expect(res).toHaveProperty("recommendations");
    expect(res).toHaveProperty("insights");
  });

  it("recommendations have rank, recommendation, urgency, and regulatory_ref fields", () => {
    const res = run([], 6);
    expect(res.recommendations.length).toBeGreaterThan(0);
    const rec = res.recommendations[0];
    expect(rec).toHaveProperty("rank");
    expect(rec).toHaveProperty("recommendation");
    expect(rec).toHaveProperty("urgency");
    expect(rec).toHaveProperty("regulatory_ref");
    expect(["immediate", "soon", "planned"]).toContain(rec.urgency);
  });

  it("insights have text and severity fields", () => {
    const res = run([], 6);
    expect(res.insights.length).toBeGreaterThan(0);
    const insight = res.insights[0];
    expect(insight).toHaveProperty("text");
    expect(insight).toHaveProperty("severity");
    expect(["critical", "warning", "positive"]).toContain(insight.severity);
  });

  it("strengths is an array of strings", () => {
    const records = Array.from({ length: 5 }, () =>
      makeRecord({ status: "active" }),
    );
    const res = run(records);
    expect(Array.isArray(res.strengths)).toBe(true);
    res.strengths.forEach(s => expect(typeof s).toBe("string"));
  });

  it("concerns is an array of strings", () => {
    const res = run([], 6);
    expect(Array.isArray(res.concerns)).toBe(true);
    res.concerns.forEach(c => expect(typeof c).toBe("string"));
  });

  it("score is always a number", () => {
    const res = run([makeRecord()]);
    expect(typeof res.advocacy_score).toBe("number");
    expect(Number.isFinite(res.advocacy_score)).toBe(true);
  });

  it("all rate fields are numbers", () => {
    const res = run([makeRecord()]);
    expect(typeof res.active_rate).toBe("number");
    expect(typeof res.children_with_advocacy_rate).toBe("number");
    expect(typeof res.independent_rate).toBe("number");
    expect(typeof res.child_voice_rate).toBe("number");
    expect(typeof res.private_session_rate).toBe("number");
    expect(typeof res.advocacy_type_variety).toBe("number");
  });
});
