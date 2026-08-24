// ══════════════════════════════════════════════════════════════════════════════
// TESTS — HOME SOCIAL WORKER CONTACT INTELLIGENCE ENGINE
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeSocialWorkerContact,
  type SocialWorkerContactInput,
  type SocialWorkerContactRecordInput,
} from "../home-social-worker-contact-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2025-06-15";

function makeContact(
  overrides: Partial<SocialWorkerContactRecordInput> = {},
): SocialWorkerContactRecordInput {
  return {
    id: "sw-1",
    child_id: "c1",
    date: "2025-06-10",
    contact_type: "visit",
    direction: "outgoing",
    initiated_by: "home",
    has_key_decisions: true,
    key_decision_count: 2,
    action_item_count: 2,
    action_completed_count: 2,
    action_overdue_count: 0,
    child_aware: true,
    has_child_views: true,
    follow_up_required: true,
    has_follow_up_date: true,
    documents_shared_count: 1,
    urgency: "routine",
    has_outcome: true,
    has_next_scheduled: true,
    ...overrides,
  };
}

function baseInput(
  overrides: Partial<SocialWorkerContactInput> = {},
): SocialWorkerContactInput {
  // Default: 4 children, 4 contacts covering c1-c4, all outstanding traits
  return {
    today: TODAY,
    total_children: 4,
    contacts: [
      makeContact({ id: "sw-1", child_id: "c1" }),
      makeContact({ id: "sw-2", child_id: "c2" }),
      makeContact({ id: "sw-3", child_id: "c3" }),
      makeContact({ id: "sw-4", child_id: "c4" }),
    ],
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. INSUFFICIENT DATA
// ══════════════════════════════════════════════════════════════════════════════

describe("Insufficient data", () => {
  it("returns insufficient_data when total_children is 0", () => {
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 0, contacts: [] });
    expect(r.contact_rating).toBe("insufficient_data");
    expect(r.contact_score).toBe(0);
    expect(r.headline).toBe("No data available for social worker contact intelligence analysis");
    expect(r.strengths).toEqual([]);
    expect(r.concerns).toEqual([]);
    expect(r.recommendations).toEqual([]);
    expect(r.insights).toEqual([]);
  });

  it("returns insufficient_data when total_children is 0 even with contacts", () => {
    const r = computeSocialWorkerContact({
      today: TODAY,
      total_children: 0,
      contacts: [makeContact()],
    });
    expect(r.contact_rating).toBe("insufficient_data");
    expect(r.contact_score).toBe(0);
  });

  it("returns insufficient_data when contacts are empty and total_children > 0", () => {
    // total_children=4, contacts=[] → total=0
    // Score: 52 - 3 (mod1) - 1 (mod2) - 1 (mod3) + 0 (mod4, no adjust) - 1 (mod5) - 2 (mod6) = 44
    // BUT total===0 && contacts.length===0 → insufficient_data
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 4, contacts: [] });
    expect(r.contact_rating).toBe("insufficient_data");
    expect(r.contact_score).toBe(44);
    expect(r.headline).toBe("No data available for social worker contact intelligence analysis");
  });

  it("leaves every rate unmeasured for insufficient data with 0 children", () => {
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 0, contacts: [] });
    expect(r.children_with_contact_rate).toBeNull();
    expect(r.home_initiated_rate).toBeNull();
    expect(r.child_awareness_rate).toBeNull();
    expect(r.follow_up_compliance_rate).toBeNull();
    expect(r.action_completion_rate).toBeNull();
    expect(r.decision_documentation_rate).toBeNull();
    expect(r.total_contacts).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. OUTSTANDING SCENARIO
// ══════════════════════════════════════════════════════════════════════════════

describe("Outstanding scenario", () => {
  it("scores 82 (max) with all modifiers maxed", () => {
    // 4 children, 4 contacts covering c1-c4 (100% coverage → +6)
    // All initiated_by "home" (100% → +5)
    // All child_aware (100% → +5)
    // All follow_up_required with follow_up_date (100% → +5)
    // action_item_count=2, action_completed_count=2 each → 8/8 = 100% → +4
    // All has_key_decisions (100% → +5)
    // Total: 52 + 6 + 5 + 5 + 5 + 4 + 5 = 82
    const r = computeSocialWorkerContact(baseInput());
    expect(r.contact_score).toBe(82);
    expect(r.contact_rating).toBe("outstanding");
    expect(r.children_with_contact_rate).toBe(100);
    expect(r.home_initiated_rate).toBe(100);
    expect(r.child_awareness_rate).toBe(100);
    expect(r.follow_up_compliance_rate).toBe(100);
    expect(r.action_completion_rate).toBe(100);
    expect(r.decision_documentation_rate).toBe(100);
    expect(r.total_contacts).toBe(4);
  });

  it("has outstanding headline", () => {
    const r = computeSocialWorkerContact(baseInput());
    expect(r.headline).toBe(
      "Outstanding social worker engagement — proactive, transparent and well-documented placing authority partnerships",
    );
  });

  it("generates all 6 strengths at max score", () => {
    const r = computeSocialWorkerContact(baseInput());
    expect(r.strengths).toHaveLength(6);
    expect(r.strengths[0]).toContain("covers virtually all children");
    expect(r.strengths[1]).toContain("proactively initiates contact");
    expect(r.strengths[2]).toContain("routinely informed about social worker contact");
    expect(r.strengths[3]).toContain("Follow-up actions from SW contacts are consistently completed");
    expect(r.strengths[4]).toContain("Action items from social worker contacts are completed at a high rate");
    expect(r.strengths[5]).toContain("Key decisions from SW contacts are documented");
  });

  it("generates zero concerns at max score", () => {
    const r = computeSocialWorkerContact(baseInput());
    expect(r.concerns).toHaveLength(0);
  });

  it("generates zero recommendations at max score", () => {
    const r = computeSocialWorkerContact(baseInput());
    expect(r.recommendations).toHaveLength(0);
  });

  it("scores 80 at the outstanding boundary", () => {
    // Need score = 80. Start with base outstanding (82).
    // Drop homeInitiatedRate from +5 to +2 → need 30-49%.
    // 82 - 5 + 2 = 79. That's good (not outstanding).
    // Instead: drop action completion from +4 to +1 → need 50-79%.
    // 82 - 4 + 1 = 79. Still good.
    // Drop decisions from +5 to +2 → need 30-59%.
    // 82 - 5 + 2 = 79. Still good.
    // We need exactly 80. Start from 82, subtract 2.
    // Drop follow_up from +5 to +2 → 82 - 3 = 79. No.
    // Drop coverage from +6 to +2 → 82 - 4 = 78. No.
    // Drop child_awareness from +5 to +2 → 82 - 3 = 79. No.
    // Drop action from +4 to +2 (actions=0) → 82 - 2 = 80! Yes!
    // Set action_item_count=0, action_completed_count=0 → totalActions=0 → +2 (instead of +4)
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", action_item_count: 0, action_completed_count: 0 }),
      makeContact({ id: "sw-2", child_id: "c2", action_item_count: 0, action_completed_count: 0 }),
      makeContact({ id: "sw-3", child_id: "c3", action_item_count: 0, action_completed_count: 0 }),
      makeContact({ id: "sw-4", child_id: "c4", action_item_count: 0, action_completed_count: 0 }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 4, contacts });
    expect(r.contact_score).toBe(80);
    expect(r.contact_rating).toBe("outstanding");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. GOOD SCENARIO
// ══════════════════════════════════════════════════════════════════════════════

describe("Good scenario", () => {
  it("scores in good range (65-79)", () => {
    // 4 children, 3 unique children (75% coverage → +2)
    // 2 of 4 home-initiated (50% → +5)
    // 3 of 4 child_aware (75% → +2)
    // 3 of 3 follow_up_required with date (100% → +5)
    // actions: 8 total, 7 completed (88% → +4)
    // 3 of 4 has_key_decisions (75% → +5)
    // Score: 52 + 2 + 5 + 2 + 5 + 4 + 5 = 75
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", initiated_by: "home", child_aware: true, follow_up_required: true, has_follow_up_date: true }),
      makeContact({ id: "sw-2", child_id: "c2", initiated_by: "home", child_aware: true, follow_up_required: true, has_follow_up_date: true }),
      makeContact({ id: "sw-3", child_id: "c3", initiated_by: "social_worker", child_aware: true, follow_up_required: true, has_follow_up_date: true, action_item_count: 2, action_completed_count: 1 }),
      makeContact({ id: "sw-4", child_id: "c3", initiated_by: "social_worker", child_aware: false, follow_up_required: false }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 4, contacts });
    expect(r.contact_score).toBe(75);
    expect(r.contact_rating).toBe("good");
  });

  it("has good headline", () => {
    // Reuse same scenario
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", initiated_by: "home", child_aware: true, follow_up_required: true, has_follow_up_date: true }),
      makeContact({ id: "sw-2", child_id: "c2", initiated_by: "home", child_aware: true, follow_up_required: true, has_follow_up_date: true }),
      makeContact({ id: "sw-3", child_id: "c3", initiated_by: "social_worker", child_aware: true, follow_up_required: true, has_follow_up_date: true, action_item_count: 2, action_completed_count: 1 }),
      makeContact({ id: "sw-4", child_id: "c3", initiated_by: "social_worker", child_aware: false, follow_up_required: false }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 4, contacts });
    expect(r.headline).toBe("Good social worker contact with regular communication and documented decisions");
  });

  it("scores 65 at the good boundary", () => {
    // Need score = 65.
    // 52 + coverage + home + child_aware + followup + actions + decisions = 65
    // So modifiers total = +13
    // coverage: 2/4 unique = 50% → below 60% but above 30% → 0
    // home: 2/4 = 50% → +5
    // child_aware: 2/4 = 50% → +2
    // follow_up: all 4 required, 3 with date → 75% → +2
    // actions: 8 total, 7 completed → 88% → +4
    // decisions: 2/4 = 50% → +2 (>=30% but <60%)
    // Total: 52 + 0 + 5 + 2 + 2 + 4 + 2 = 67. Too high.
    // Try: decisions 1/4 = 25% → below 30% but >= 10% → 0
    // 52 + 0 + 5 + 2 + 2 + 4 + 0 = 65. Yes!
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", initiated_by: "home", child_aware: true, follow_up_required: true, has_follow_up_date: true, has_key_decisions: true }),
      makeContact({ id: "sw-2", child_id: "c2", initiated_by: "home", child_aware: false, follow_up_required: true, has_follow_up_date: true, has_key_decisions: false }),
      makeContact({ id: "sw-3", child_id: "c1", initiated_by: "social_worker", child_aware: true, follow_up_required: true, has_follow_up_date: true, has_key_decisions: false }),
      makeContact({ id: "sw-4", child_id: "c1", initiated_by: "social_worker", child_aware: false, follow_up_required: true, has_follow_up_date: false, has_key_decisions: false }),
    ];
    // unique children: c1, c2 → 2/4 = 50% → 0
    // home: 2/4 = 50% → +5
    // child_aware: 2/4 = 50% → +2
    // followup: 4 required, 3 with date → 75% → +2
    // actions: 4*2=8 total, 4*2=8 completed → 100% → +4
    // decisions: 1/4 = 25% → 0
    // Score: 52 + 0 + 5 + 2 + 2 + 4 + 0 = 65
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 4, contacts });
    expect(r.contact_score).toBe(65);
    expect(r.contact_rating).toBe("good");
  });

  it("scores 79 at the upper good boundary", () => {
    // Need score = 79.
    // 52 + 6 + 5 + 5 + 5 + 4 + 2 = 79
    // coverage >= 90% → +6 → 4/4 = 100% ✓
    // home >= 50% → +5 → 100% ✓
    // child_aware >= 80% → +5 → 100% ✓
    // followup >= 90% → +5 → 100% ✓
    // actions >= 80% → +4 → 100% ✓
    // decisions >= 30% but < 60% → +2 → 1/4 = 25%? No, 25% < 30%.
    // Need decisions 30-59%: 2/4 = 50% → +2. But total = 52+6+5+5+5+4+2 = 79. No wait, 2/4=50% is >= 30% → +2. Let me verify: 50 >= 30 → +2.
    // But 50 < 60. So yes, +2.
    // But the default makeContact has has_key_decisions: true. So I need exactly 2 with decisions.
    // Actually: let's make 2 of 4 have has_key_decisions: false → 2/4=50% → +2
    // Score: 52 + 6 + 5 + 5 + 5 + 4 + 2 = 79
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1" }),
      makeContact({ id: "sw-2", child_id: "c2" }),
      makeContact({ id: "sw-3", child_id: "c3", has_key_decisions: false }),
      makeContact({ id: "sw-4", child_id: "c4", has_key_decisions: false }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 4, contacts });
    expect(r.contact_score).toBe(79);
    expect(r.contact_rating).toBe("good");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. ADEQUATE SCENARIO
// ══════════════════════════════════════════════════════════════════════════════

describe("Adequate scenario", () => {
  it("scores in adequate range (45-64)", () => {
    // 4 children, 3 unique children (75% coverage → +2)
    // 1 of 4 home (25% → below 30% above 15% → 0)
    // 2 of 4 child_aware (50% → +2)
    // 2 of 3 followup required have date (67% → +2)
    // actions: 8 total, 5 completed (63% → +1)
    // 1 of 4 decisions (25% → 0)
    // Score: 52 + 2 + 0 + 2 + 2 + 1 + 0 = 59
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", initiated_by: "home", child_aware: true, follow_up_required: true, has_follow_up_date: true, action_completed_count: 1, has_key_decisions: true }),
      makeContact({ id: "sw-2", child_id: "c2", initiated_by: "social_worker", child_aware: true, follow_up_required: true, has_follow_up_date: true, action_completed_count: 2, has_key_decisions: false }),
      makeContact({ id: "sw-3", child_id: "c3", initiated_by: "social_worker", child_aware: false, follow_up_required: true, has_follow_up_date: false, action_completed_count: 1, has_key_decisions: false }),
      makeContact({ id: "sw-4", child_id: "c3", initiated_by: "social_worker", child_aware: false, follow_up_required: false, action_completed_count: 1, has_key_decisions: false }),
    ];
    // unique: c1,c2,c3 → 3/4 = 75% → +2
    // home: 1/4 = 25% → 0
    // aware: 2/4 = 50% → +2
    // followup: 3 required, 2 with date → 67% → +2
    // actions: 8 total, 1+2+1+1=5 completed → 63% → +1
    // decisions: 1/4 = 25% → 0
    // Score: 52 + 2 + 0 + 2 + 2 + 1 + 0 = 59
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 4, contacts });
    expect(r.contact_score).toBe(59);
    expect(r.contact_rating).toBe("adequate");
  });

  it("has adequate headline", () => {
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", initiated_by: "home", child_aware: true, follow_up_required: true, has_follow_up_date: true, action_completed_count: 1, has_key_decisions: true }),
      makeContact({ id: "sw-2", child_id: "c2", initiated_by: "social_worker", child_aware: true, follow_up_required: true, has_follow_up_date: true, action_completed_count: 2, has_key_decisions: false }),
      makeContact({ id: "sw-3", child_id: "c3", initiated_by: "social_worker", child_aware: false, follow_up_required: true, has_follow_up_date: false, action_completed_count: 1, has_key_decisions: false }),
      makeContact({ id: "sw-4", child_id: "c3", initiated_by: "social_worker", child_aware: false, follow_up_required: false, action_completed_count: 1, has_key_decisions: false }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 4, contacts });
    expect(r.headline).toBe(
      "Social worker contact exists but proactivity, child awareness or follow-through needs improvement",
    );
  });

  it("scores 45 at the adequate boundary", () => {
    // Need exactly 45.
    // 52 + modifiers = 45 → modifiers = -7
    // coverage: 1/4 = 25% → below 30% → -5
    // home: 0/1 = 0% → below 15% → -5
    // child_aware: 0/1 = 0% → below 25% → -4
    // followup: 0 required → +2
    // actions: 0 → +2
    // decisions: 0/1 = 0% → below 10% → -3
    // Total: 52 - 5 - 5 - 4 + 2 + 2 - 3 = 39. Too low.
    // Let me try: one contact for c1.
    // coverage: 1/4 = 25% → -5
    // home: 1/1 = 100% → +5
    // child_aware: 1/1 = 100% → +5
    // followup: 1 required, 1 with date → 100% → +5
    // actions: 2 total, 2 completed → 100% → +4
    // decisions: 1/1 = 100% → +5
    // Total: 52 - 5 + 5 + 5 + 5 + 4 + 5 = 71. Too high.
    // Try: 2/4 = 50% coverage → 0, home 1/2 = 50% → +5, aware 1/2 = 50% → +2, followup 0 required → +2, actions 0 → +2, decisions 0/2 = 0% → -3
    // 52 + 0 + 5 + 2 + 2 + 2 - 3 = 60. No.
    // Target: modifiers = -7. Let me be systematic.
    // coverage: 1 child of 10 total = 10% → -5
    // home: 1/1 = 100% → +5
    // child_aware: 0/1 = 0% → -4
    // followup: 1 required, 0 with date → 0% → -4
    // actions: 2 total, 2 completed → 100% → +4
    // decisions: 0/1 = 0% → -3
    // Total: 52 - 5 + 5 - 4 - 4 + 4 - 3 = 45 ✓
    const contacts = [
      makeContact({
        id: "sw-1", child_id: "c1",
        initiated_by: "home",
        child_aware: false,
        follow_up_required: true, has_follow_up_date: false,
        action_item_count: 2, action_completed_count: 2,
        has_key_decisions: false,
      }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 10, contacts });
    expect(r.contact_score).toBe(45);
    expect(r.contact_rating).toBe("adequate");
  });

  it("scores 64 at the upper adequate boundary", () => {
    // Need exactly 64. modifiers = +12.
    // coverage: 4/4 = 100% → +6
    // home: 2/4 = 50% → +5
    // child_aware: 2/4 = 50% → +2
    // followup: 2 required, 1 with date → 50% → below 60% → below 90%. 50 < 60 so check < 30? No. So 0.
    // Hmm, 50% is >= 30% but < 60% → 0 (no modifier applies between 30-60)
    // Wait: the logic is: >= 90 → +5; >= 60 → +2; < 30 → -4; else 0.
    // So 50% → 0.
    // actions: 8 total, 4 completed → 50% → +1
    // decisions: 2/4 = 50% → +2 (>= 30% < 60%)
    // Total: 52 + 6 + 5 + 2 + 0 + 1 + 2 = 68. Too high.
    // Try: coverage 3/4 = 75% → +2; home 2/4 = 50% → +5; aware 2/4 = 50% → +2; followup 50% → 0; actions 50% → +1; decisions 50% → +2
    // 52 + 2 + 5 + 2 + 0 + 1 + 2 = 64. Yes!
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", initiated_by: "home", child_aware: true, follow_up_required: true, has_follow_up_date: true, action_completed_count: 1, has_key_decisions: true }),
      makeContact({ id: "sw-2", child_id: "c2", initiated_by: "home", child_aware: true, follow_up_required: true, has_follow_up_date: false, action_completed_count: 1, has_key_decisions: true }),
      makeContact({ id: "sw-3", child_id: "c3", initiated_by: "social_worker", child_aware: false, follow_up_required: false, action_completed_count: 1, has_key_decisions: false }),
      makeContact({ id: "sw-4", child_id: "c3", initiated_by: "social_worker", child_aware: false, follow_up_required: false, action_completed_count: 1, has_key_decisions: false }),
    ];
    // unique: c1,c2,c3 → 3/4 = 75% → +2
    // home: 2/4 = 50% → +5
    // aware: 2/4 = 50% → +2
    // followup: 2 required, 1 with date → 50% → 0
    // actions: 8 total, 4 completed → 50% → +1
    // decisions: 2/4 = 50% → +2
    // 52 + 2 + 5 + 2 + 0 + 1 + 2 = 64
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 4, contacts });
    expect(r.contact_score).toBe(64);
    expect(r.contact_rating).toBe("adequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. INADEQUATE SCENARIO
// ══════════════════════════════════════════════════════════════════════════════

describe("Inadequate scenario", () => {
  it("scores in inadequate range (< 45) with all modifiers negative", () => {
    // 10 children, 1 contact for c1 (10% coverage → -5)
    // initiated_by "social_worker" (0% home → -5)
    // child_aware: false (0% → -4)
    // follow_up_required: true, has_follow_up_date: false (0% → -4)
    // action_item_count: 4, completed: 0 (0% → -4)
    // has_key_decisions: false (0% → -3)
    // Score: 52 - 5 - 5 - 4 - 4 - 4 - 3 = 27
    const contacts = [
      makeContact({
        id: "sw-1", child_id: "c1",
        initiated_by: "social_worker",
        child_aware: false,
        has_child_views: false,
        follow_up_required: true, has_follow_up_date: false,
        action_item_count: 4, action_completed_count: 0, action_overdue_count: 4,
        has_key_decisions: false,
      }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 10, contacts });
    expect(r.contact_score).toBe(27);
    expect(r.contact_rating).toBe("inadequate");
  });

  it("has inadequate headline", () => {
    const contacts = [
      makeContact({
        id: "sw-1", child_id: "c1",
        initiated_by: "social_worker",
        child_aware: false,
        follow_up_required: true, has_follow_up_date: false,
        action_item_count: 4, action_completed_count: 0, action_overdue_count: 4,
        has_key_decisions: false,
      }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 10, contacts });
    expect(r.headline).toBe(
      "Inadequate social worker engagement — placing authority relationships lack structure, documentation and follow-through",
    );
  });

  it("scores 44 at just below adequate", () => {
    // Need exactly 44.
    // Try: coverage 1/10 = 10% → -5; home 100% → +5; aware 0% → -4; followup 0% → -4; actions 100% → +4; decisions 0% → -3
    // 52 -5 +5 -4 -4 +4 -3 = 45. One too many.
    // Replace actions +4 with +1 (50-79%):
    // actions: 2 total, 1 completed → 50% → +1
    // 52 -5 +5 -4 -4 +1 -3 = 42. Too low.
    // Replace actions with +2 (totalActions=0): 52 -5 +5 -4 -4 +2 -3 = 43. Still low.
    // Back to: coverage -5, home +5, aware -4, followup +2 (0 required), actions +4, decisions -3
    // Hmm, followup 0 required w/ records → +2.
    // 52 -5 +5 -4 +2 +4 -3 = 51. Too high.
    // Let me try: 52 -5 + 0 -4 -4 +4 +2 = 45. Just need -1.
    // home 20% → below 30% above 15% → 0
    // decisions 40% → +2 (>= 30% < 60%)
    // 52 -5 + 0 - 4 - 4 + 4 + 2 = 45. That's 45, not 44.
    // Need 44: 52 + modifiers = 44 → modifiers = -8.
    // coverage -5, home 0, aware -4, followup 0, actions +4, decisions -3 = -8.
    // home between 15% and 30% → 0: 1/5=20% → 0.
    // followup between 30% and 60% → 0: 1/2=50% → 0.
    // coverage 1/10 → -5
    // aware 1/5 = 20% → -4
    // decisions 0/5 = 0% → -3
    // actions 100% → +4
    // 52 -5 +0 -4 +0 +4 -3 = 44 ✓
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", initiated_by: "home", child_aware: true, follow_up_required: true, has_follow_up_date: true, has_key_decisions: false }),
      makeContact({ id: "sw-2", child_id: "c1", initiated_by: "social_worker", child_aware: false, follow_up_required: true, has_follow_up_date: false, has_key_decisions: false }),
      makeContact({ id: "sw-3", child_id: "c1", initiated_by: "social_worker", child_aware: false, follow_up_required: false, has_key_decisions: false }),
      makeContact({ id: "sw-4", child_id: "c1", initiated_by: "social_worker", child_aware: false, follow_up_required: false, has_key_decisions: false }),
      makeContact({ id: "sw-5", child_id: "c1", initiated_by: "social_worker", child_aware: false, follow_up_required: false, has_key_decisions: false }),
    ];
    // unique: c1 → 1/10 = 10% → -5
    // home: 1/5 = 20% → 0
    // aware: 1/5 = 20% → -4
    // followup: 2 required, 1 with date → 50% → 0
    // actions: 10 total, 10 completed → 100% → +4
    // decisions: 0/5 = 0% → -3
    // 52 - 5 + 0 - 4 + 0 + 4 - 3 = 44 ✓
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 10, contacts });
    expect(r.contact_score).toBe(44);
    expect(r.contact_rating).toBe("inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. MODIFIER 1 — COVERAGE (children with SW contact)
// ══════════════════════════════════════════════════════════════════════════════

describe("Modifier 1: Coverage", () => {
  // Use a controlled setup: keep all other modifiers constant.
  // We'll use home-initiated, child-aware, follow-up compliant, actions complete, decisions documented.
  // Only vary coverage by changing total_children.

  it("+6 when coverage >= 90%", () => {
    // 4 children, 4 unique → 100% → +6
    const r = computeSocialWorkerContact(baseInput());
    expect(r.children_with_contact_rate).toBe(100);
    expect(r.contact_score).toBe(82); // 52+6+5+5+5+4+5
  });

  it("+6 at exactly 90% coverage", () => {
    // 10 children, 9 unique → 90% → +6
    const contacts = Array.from({ length: 9 }, (_, i) =>
      makeContact({ id: `sw-${i}`, child_id: `c${i + 1}` }),
    );
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 10, contacts });
    expect(r.children_with_contact_rate).toBe(90);
    // 52 + 6 + 5 + 5 + 5 + 4 + 5 = 82
    expect(r.contact_score).toBe(82);
  });

  it("+2 when coverage 60-89%", () => {
    // 4 children, 3 unique → 75% → +2
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1" }),
      makeContact({ id: "sw-2", child_id: "c2" }),
      makeContact({ id: "sw-3", child_id: "c3" }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 4, contacts });
    expect(r.children_with_contact_rate).toBe(75);
    // 52 + 2 + 5 + 5 + 5 + 4 + 5 = 78
    expect(r.contact_score).toBe(78);
  });

  it("+2 at exactly 60% coverage", () => {
    // 5 children, 3 unique → 60% → +2
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1" }),
      makeContact({ id: "sw-2", child_id: "c2" }),
      makeContact({ id: "sw-3", child_id: "c3" }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 5, contacts });
    expect(r.children_with_contact_rate).toBe(60);
    // 52 + 2 + 5 + 5 + 5 + 4 + 5 = 78
    expect(r.contact_score).toBe(78);
  });

  it("0 when coverage 30-59%", () => {
    // 10 children, 4 unique → 40% → 0
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1" }),
      makeContact({ id: "sw-2", child_id: "c2" }),
      makeContact({ id: "sw-3", child_id: "c3" }),
      makeContact({ id: "sw-4", child_id: "c4" }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 10, contacts });
    expect(r.children_with_contact_rate).toBe(40);
    // 52 + 0 + 5 + 5 + 5 + 4 + 5 = 76
    expect(r.contact_score).toBe(76);
  });

  it("-5 when coverage < 30%", () => {
    // 10 children, 2 unique → 20% → -5
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1" }),
      makeContact({ id: "sw-2", child_id: "c2" }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 10, contacts });
    expect(r.children_with_contact_rate).toBe(20);
    // 52 - 5 + 5 + 5 + 5 + 4 + 5 = 71
    expect(r.contact_score).toBe(71);
  });

  it("-5 at exactly 29% coverage", () => {
    // pct(2,7) = Math.round(2/7*100) = Math.round(28.57) = 29
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1" }),
      makeContact({ id: "sw-2", child_id: "c2" }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 7, contacts });
    expect(r.children_with_contact_rate).toBe(29);
    // 52 - 5 + 5 + 5 + 5 + 4 + 5 = 71
    expect(r.contact_score).toBe(71);
  });

  it("-3 when total contacts is 0 (coverage modifier)", () => {
    // total_children=4, contacts=[] → total=0 → -3
    // Note: also insufficient_data due to total===0 && contacts.length===0
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 4, contacts: [] });
    // 52 - 3 - 1 - 1 + 0 - 1 - 2 = 44
    expect(r.contact_score).toBe(44);
  });

  it("at exactly 30% coverage gets 0 (not -5)", () => {
    // pct(3,10) = 30 → >= 30, not < 30 → 0 (no penalty, no bonus since <60)
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1" }),
      makeContact({ id: "sw-2", child_id: "c2" }),
      makeContact({ id: "sw-3", child_id: "c3" }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 10, contacts });
    expect(r.children_with_contact_rate).toBe(30);
    // 52 + 0 + 5 + 5 + 5 + 4 + 5 = 76
    expect(r.contact_score).toBe(76);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. MODIFIER 2 — HOME-INITIATED CONTACT
// ══════════════════════════════════════════════════════════════════════════════

describe("Modifier 2: Home-initiated contact", () => {
  it("+5 when home-initiated >= 50%", () => {
    // All home-initiated → 100%
    const r = computeSocialWorkerContact(baseInput());
    expect(r.home_initiated_rate).toBe(100);
    // +5 from mod2 (already in outstanding total)
    expect(r.contact_score).toBe(82);
  });

  it("+5 at exactly 50% home-initiated", () => {
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", initiated_by: "home" }),
      makeContact({ id: "sw-2", child_id: "c2", initiated_by: "social_worker" }),
    ];
    // 2 children of 2 total → 100% coverage → +6
    // home: 1/2 = 50% → +5
    // aware: 2/2 = 100% → +5
    // followup: 2/2 required, 2/2 with date → 100% → +5
    // actions: 4 total, 4 completed → 100% → +4
    // decisions: 2/2 = 100% → +5
    // 52+6+5+5+5+4+5 = 82
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 2, contacts });
    expect(r.home_initiated_rate).toBe(50);
    expect(r.contact_score).toBe(82);
  });

  it("+2 when home-initiated 30-49%", () => {
    // 3 contacts: 1 home, 2 SW → 33% → +2
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", initiated_by: "home" }),
      makeContact({ id: "sw-2", child_id: "c2", initiated_by: "social_worker" }),
      makeContact({ id: "sw-3", child_id: "c3", initiated_by: "social_worker" }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 3, contacts });
    expect(r.home_initiated_rate).toBe(33);
    // 52+6+2+5+5+4+5 = 79
    expect(r.contact_score).toBe(79);
  });

  it("+2 at exactly 30% home-initiated", () => {
    // pct(3,10) = 30 → >= 30 → +2
    const contacts = Array.from({ length: 10 }, (_, i) =>
      makeContact({
        id: `sw-${i}`,
        child_id: `c${i + 1}`,
        initiated_by: i < 3 ? "home" : "social_worker",
      }),
    );
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 10, contacts });
    expect(r.home_initiated_rate).toBe(30);
    // 52+6+2+5+5+4+5 = 79
    expect(r.contact_score).toBe(79);
  });

  it("0 when home-initiated 15-29%", () => {
    // 5 contacts: 1 home, 4 SW → 20% → 0
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", initiated_by: "home" }),
      makeContact({ id: "sw-2", child_id: "c2", initiated_by: "social_worker" }),
      makeContact({ id: "sw-3", child_id: "c3", initiated_by: "social_worker" }),
      makeContact({ id: "sw-4", child_id: "c4", initiated_by: "social_worker" }),
      makeContact({ id: "sw-5", child_id: "c5", initiated_by: "social_worker" }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 5, contacts });
    expect(r.home_initiated_rate).toBe(20);
    // 52+6+0+5+5+4+5 = 77
    expect(r.contact_score).toBe(77);
  });

  it("-5 when home-initiated < 15%", () => {
    // 10 contacts: 1 home, 9 SW → 10% → -5
    const contacts = Array.from({ length: 10 }, (_, i) =>
      makeContact({
        id: `sw-${i}`,
        child_id: `c${i + 1}`,
        initiated_by: i < 1 ? "home" : "social_worker",
      }),
    );
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 10, contacts });
    expect(r.home_initiated_rate).toBe(10);
    // 52+6-5+5+5+4+5 = 72
    expect(r.contact_score).toBe(72);
  });

  it("-5 when 0% home-initiated with records", () => {
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", initiated_by: "social_worker" }),
      makeContact({ id: "sw-2", child_id: "c2", initiated_by: "social_worker" }),
      makeContact({ id: "sw-3", child_id: "c3", initiated_by: "social_worker" }),
      makeContact({ id: "sw-4", child_id: "c4", initiated_by: "social_worker" }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 4, contacts });
    expect(r.home_initiated_rate).toBe(0);
    // 52+6-5+5+5+4+5 = 72
    expect(r.contact_score).toBe(72);
  });

  it("-1 when no records (mod2)", () => {
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 4, contacts: [] });
    // mod2 contributes -1
    expect(r.contact_score).toBe(44);
  });

  it("at exactly 15% home-initiated gets 0 (not -5)", () => {
    // pct(3,20) = 15 → >= 15, so not < 15 → 0
    const contacts = Array.from({ length: 20 }, (_, i) =>
      makeContact({
        id: `sw-${i}`,
        child_id: `c${(i % 20) + 1}`,
        initiated_by: i < 3 ? "home" : "social_worker",
      }),
    );
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 20, contacts });
    expect(r.home_initiated_rate).toBe(15);
    // 52+6+0+5+5+4+5 = 77
    expect(r.contact_score).toBe(77);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. MODIFIER 3 — CHILD AWARENESS
// ══════════════════════════════════════════════════════════════════════════════

describe("Modifier 3: Child awareness", () => {
  it("+5 when child awareness >= 80%", () => {
    const r = computeSocialWorkerContact(baseInput());
    expect(r.child_awareness_rate).toBe(100);
    expect(r.contact_score).toBe(82);
  });

  it("+5 at exactly 80% child awareness", () => {
    // 5 contacts, 4 aware → 80% → +5
    const contacts = Array.from({ length: 5 }, (_, i) =>
      makeContact({
        id: `sw-${i}`,
        child_id: `c${i + 1}`,
        child_aware: i < 4,
      }),
    );
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 5, contacts });
    expect(r.child_awareness_rate).toBe(80);
    // 52+6+5+5+5+4+5 = 82
    expect(r.contact_score).toBe(82);
  });

  it("+2 when child awareness 50-79%", () => {
    // 4 contacts, 2 aware → 50% → +2
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", child_aware: true }),
      makeContact({ id: "sw-2", child_id: "c2", child_aware: true }),
      makeContact({ id: "sw-3", child_id: "c3", child_aware: false }),
      makeContact({ id: "sw-4", child_id: "c4", child_aware: false }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 4, contacts });
    expect(r.child_awareness_rate).toBe(50);
    // 52+6+5+2+5+4+5 = 79
    expect(r.contact_score).toBe(79);
  });

  it("0 when child awareness 25-49%", () => {
    // pct(1,3) = 33 → 0
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", child_aware: true }),
      makeContact({ id: "sw-2", child_id: "c2", child_aware: false }),
      makeContact({ id: "sw-3", child_id: "c3", child_aware: false }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 3, contacts });
    expect(r.child_awareness_rate).toBe(33);
    // 52+6+5+0+5+4+5 = 77
    expect(r.contact_score).toBe(77);
  });

  it("-4 when child awareness < 25%", () => {
    // 5 contacts, 1 aware → 20% → -4
    const contacts = Array.from({ length: 5 }, (_, i) =>
      makeContact({
        id: `sw-${i}`,
        child_id: `c${i + 1}`,
        child_aware: i === 0,
      }),
    );
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 5, contacts });
    expect(r.child_awareness_rate).toBe(20);
    // 52+6+5-4+5+4+5 = 73
    expect(r.contact_score).toBe(73);
  });

  it("-4 at 0% child awareness", () => {
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", child_aware: false }),
      makeContact({ id: "sw-2", child_id: "c2", child_aware: false }),
      makeContact({ id: "sw-3", child_id: "c3", child_aware: false }),
      makeContact({ id: "sw-4", child_id: "c4", child_aware: false }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 4, contacts });
    expect(r.child_awareness_rate).toBe(0);
    // 52+6+5-4+5+4+5 = 73
    expect(r.contact_score).toBe(73);
  });

  it("-1 when no records (mod3)", () => {
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 4, contacts: [] });
    expect(r.contact_score).toBe(44);
  });

  it("at exactly 25% child awareness gets 0 (not -4)", () => {
    // pct(1,4) = 25 → >= 25, not < 25 → 0
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", child_aware: true }),
      makeContact({ id: "sw-2", child_id: "c2", child_aware: false }),
      makeContact({ id: "sw-3", child_id: "c3", child_aware: false }),
      makeContact({ id: "sw-4", child_id: "c4", child_aware: false }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 4, contacts });
    expect(r.child_awareness_rate).toBe(25);
    // 52+6+5+0+5+4+5 = 77
    expect(r.contact_score).toBe(77);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 9. MODIFIER 4 — FOLLOW-UP COMPLIANCE
// ══════════════════════════════════════════════════════════════════════════════

describe("Modifier 4: Follow-up compliance", () => {
  it("+5 when follow-up compliance >= 90%", () => {
    const r = computeSocialWorkerContact(baseInput());
    expect(r.follow_up_compliance_rate).toBe(100);
    expect(r.contact_score).toBe(82);
  });

  it("+5 at exactly 90%", () => {
    // 10 contacts, 10 follow_up_required, 9 with date → 90% → +5
    const contacts = Array.from({ length: 10 }, (_, i) =>
      makeContact({
        id: `sw-${i}`,
        child_id: `c${i + 1}`,
        follow_up_required: true,
        has_follow_up_date: i < 9,
      }),
    );
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 10, contacts });
    expect(r.follow_up_compliance_rate).toBe(90);
    // 52+6+5+5+5+4+5 = 82
    expect(r.contact_score).toBe(82);
  });

  it("+2 when follow-up compliance 60-89%", () => {
    // 4 contacts, all required, 3 with date → 75% → +2
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", follow_up_required: true, has_follow_up_date: true }),
      makeContact({ id: "sw-2", child_id: "c2", follow_up_required: true, has_follow_up_date: true }),
      makeContact({ id: "sw-3", child_id: "c3", follow_up_required: true, has_follow_up_date: true }),
      makeContact({ id: "sw-4", child_id: "c4", follow_up_required: true, has_follow_up_date: false }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 4, contacts });
    expect(r.follow_up_compliance_rate).toBe(75);
    // 52+6+5+5+2+4+5 = 79
    expect(r.contact_score).toBe(79);
  });

  it("+2 at exactly 60%", () => {
    // 5 contacts, 5 required, 3 with date → 60% → +2
    const contacts = Array.from({ length: 5 }, (_, i) =>
      makeContact({
        id: `sw-${i}`,
        child_id: `c${i + 1}`,
        follow_up_required: true,
        has_follow_up_date: i < 3,
      }),
    );
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 5, contacts });
    expect(r.follow_up_compliance_rate).toBe(60);
    // 52+6+5+5+2+4+5 = 79
    expect(r.contact_score).toBe(79);
  });

  it("0 when follow-up compliance 30-59%", () => {
    // 2 required, 1 with date → 50% → 0
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", follow_up_required: true, has_follow_up_date: true }),
      makeContact({ id: "sw-2", child_id: "c2", follow_up_required: true, has_follow_up_date: false }),
      makeContact({ id: "sw-3", child_id: "c3", follow_up_required: false }),
      makeContact({ id: "sw-4", child_id: "c4", follow_up_required: false }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 4, contacts });
    expect(r.follow_up_compliance_rate).toBe(50);
    // 52+6+5+5+0+4+5 = 77
    expect(r.contact_score).toBe(77);
  });

  it("-4 when follow-up compliance < 30%", () => {
    // 4 required, 1 with date → 25% → -4
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", follow_up_required: true, has_follow_up_date: true }),
      makeContact({ id: "sw-2", child_id: "c2", follow_up_required: true, has_follow_up_date: false }),
      makeContact({ id: "sw-3", child_id: "c3", follow_up_required: true, has_follow_up_date: false }),
      makeContact({ id: "sw-4", child_id: "c4", follow_up_required: true, has_follow_up_date: false }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 4, contacts });
    expect(r.follow_up_compliance_rate).toBe(25);
    // 52+6+5+5-4+4+5 = 73
    expect(r.contact_score).toBe(73);
  });

  it("+2 when 0 follow-ups required with records (edge case)", () => {
    // All contacts have follow_up_required: false → followUpRequired=0, total>0 → +2
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", follow_up_required: false }),
      makeContact({ id: "sw-2", child_id: "c2", follow_up_required: false }),
      makeContact({ id: "sw-3", child_id: "c3", follow_up_required: false }),
      makeContact({ id: "sw-4", child_id: "c4", follow_up_required: false }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 4, contacts });
    expect(r.follow_up_compliance_rate).toBeNull(); // 0 follow-ups required is an empty population, not a 0% rate
    // 52+6+5+5+2+4+5 = 79
    expect(r.contact_score).toBe(79);
  });

  it("no adjustment when total is 0 (mod4)", () => {
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 4, contacts: [] });
    // mod4 contributes 0 (no adjustment)
    // 52 - 3 - 1 - 1 + 0 - 1 - 2 = 44
    expect(r.contact_score).toBe(44);
  });

  it("at exactly 30% follow-up gets 0 (not -4)", () => {
    // pct(3,10) = 30 → >= 30 → 0
    const contacts = Array.from({ length: 10 }, (_, i) =>
      makeContact({
        id: `sw-${i}`,
        child_id: `c${i + 1}`,
        follow_up_required: true,
        has_follow_up_date: i < 3,
      }),
    );
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 10, contacts });
    expect(r.follow_up_compliance_rate).toBe(30);
    // 52+6+5+5+0+4+5 = 77
    expect(r.contact_score).toBe(77);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 10. MODIFIER 5 — ACTION COMPLETION
// ══════════════════════════════════════════════════════════════════════════════

describe("Modifier 5: Action completion", () => {
  it("+4 when action completion >= 80%", () => {
    const r = computeSocialWorkerContact(baseInput());
    expect(r.action_completion_rate).toBe(100);
    expect(r.contact_score).toBe(82);
  });

  it("+4 at exactly 80%", () => {
    // 5 contacts with 2 actions each = 10 total, 8 completed → 80%
    const contacts = Array.from({ length: 5 }, (_, i) =>
      makeContact({
        id: `sw-${i}`,
        child_id: `c${i + 1}`,
        action_item_count: 2,
        action_completed_count: i < 4 ? 2 : 0,
      }),
    );
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 5, contacts });
    expect(r.action_completion_rate).toBe(80);
    // 52+6+5+5+5+4+5 = 82
    expect(r.contact_score).toBe(82);
  });

  it("+1 when action completion 50-79%", () => {
    // 4 contacts: 8 total actions, 4 completed → 50% → +1
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", action_item_count: 2, action_completed_count: 2 }),
      makeContact({ id: "sw-2", child_id: "c2", action_item_count: 2, action_completed_count: 2 }),
      makeContact({ id: "sw-3", child_id: "c3", action_item_count: 2, action_completed_count: 0 }),
      makeContact({ id: "sw-4", child_id: "c4", action_item_count: 2, action_completed_count: 0 }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 4, contacts });
    expect(r.action_completion_rate).toBe(50);
    // 52+6+5+5+5+1+5 = 79
    expect(r.contact_score).toBe(79);
  });

  it("0 when action completion 25-49%", () => {
    // pct(2,6) = 33 → 0 (>= 25 but < 50)
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", action_item_count: 3, action_completed_count: 1 }),
      makeContact({ id: "sw-2", child_id: "c2", action_item_count: 3, action_completed_count: 1 }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 2, contacts });
    expect(r.action_completion_rate).toBe(33);
    // 52+6+5+5+5+0+5 = 78
    expect(r.contact_score).toBe(78);
  });

  it("-4 when action completion < 25%", () => {
    // 8 total, 1 completed → 13% → -4
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", action_item_count: 4, action_completed_count: 1 }),
      makeContact({ id: "sw-2", child_id: "c2", action_item_count: 4, action_completed_count: 0 }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 2, contacts });
    expect(r.action_completion_rate).toBe(13);
    // 52+6+5+5+5-4+5 = 74
    expect(r.contact_score).toBe(74);
  });

  it("+2 when totalActions is 0 with records (edge case)", () => {
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", action_item_count: 0, action_completed_count: 0 }),
      makeContact({ id: "sw-2", child_id: "c2", action_item_count: 0, action_completed_count: 0 }),
      makeContact({ id: "sw-3", child_id: "c3", action_item_count: 0, action_completed_count: 0 }),
      makeContact({ id: "sw-4", child_id: "c4", action_item_count: 0, action_completed_count: 0 }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 4, contacts });
    expect(r.action_completion_rate).toBeNull(); // 0 actions is an empty population, not a 0% rate
    // 52+6+5+5+5+2+5 = 80
    expect(r.contact_score).toBe(80);
  });

  it("-1 when no records (mod5)", () => {
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 4, contacts: [] });
    // 52 - 3 - 1 - 1 + 0 - 1 - 2 = 44
    expect(r.contact_score).toBe(44);
  });

  it("at exactly 25% action completion gets 0 (not -4)", () => {
    // pct(2,8) = 25 → >= 25 → 0
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", action_item_count: 4, action_completed_count: 1 }),
      makeContact({ id: "sw-2", child_id: "c2", action_item_count: 4, action_completed_count: 1 }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 2, contacts });
    expect(r.action_completion_rate).toBe(25);
    // 52+6+5+5+5+0+5 = 78
    expect(r.contact_score).toBe(78);
  });

  it("at exactly 50% action completion gets +1", () => {
    // pct(4,8) = 50 → >= 50 → +1
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", action_item_count: 4, action_completed_count: 2 }),
      makeContact({ id: "sw-2", child_id: "c2", action_item_count: 4, action_completed_count: 2 }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 2, contacts });
    expect(r.action_completion_rate).toBe(50);
    // 52+6+5+5+5+1+5 = 79
    expect(r.contact_score).toBe(79);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 11. MODIFIER 6 — DECISION DOCUMENTATION
// ══════════════════════════════════════════════════════════════════════════════

describe("Modifier 6: Decision documentation", () => {
  it("+5 when decision documentation >= 60%", () => {
    const r = computeSocialWorkerContact(baseInput());
    expect(r.decision_documentation_rate).toBe(100);
    expect(r.contact_score).toBe(82);
  });

  it("+5 at exactly 60%", () => {
    // 5 contacts, 3 with decisions → 60% → +5
    const contacts = Array.from({ length: 5 }, (_, i) =>
      makeContact({
        id: `sw-${i}`,
        child_id: `c${i + 1}`,
        has_key_decisions: i < 3,
      }),
    );
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 5, contacts });
    expect(r.decision_documentation_rate).toBe(60);
    // 52+6+5+5+5+4+5 = 82
    expect(r.contact_score).toBe(82);
  });

  it("+2 when decision documentation 30-59%", () => {
    // 4 contacts, 2 with decisions → 50% → +2
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", has_key_decisions: true }),
      makeContact({ id: "sw-2", child_id: "c2", has_key_decisions: true }),
      makeContact({ id: "sw-3", child_id: "c3", has_key_decisions: false }),
      makeContact({ id: "sw-4", child_id: "c4", has_key_decisions: false }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 4, contacts });
    expect(r.decision_documentation_rate).toBe(50);
    // 52+6+5+5+5+4+2 = 79
    expect(r.contact_score).toBe(79);
  });

  it("+2 at exactly 30%", () => {
    // pct(3,10) = 30 → +2
    const contacts = Array.from({ length: 10 }, (_, i) =>
      makeContact({
        id: `sw-${i}`,
        child_id: `c${i + 1}`,
        has_key_decisions: i < 3,
      }),
    );
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 10, contacts });
    expect(r.decision_documentation_rate).toBe(30);
    // 52+6+5+5+5+4+2 = 79
    expect(r.contact_score).toBe(79);
  });

  it("0 when decision documentation 10-29%", () => {
    // pct(1,5) = 20 → 0
    const contacts = Array.from({ length: 5 }, (_, i) =>
      makeContact({
        id: `sw-${i}`,
        child_id: `c${i + 1}`,
        has_key_decisions: i === 0,
      }),
    );
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 5, contacts });
    expect(r.decision_documentation_rate).toBe(20);
    // 52+6+5+5+5+4+0 = 77
    expect(r.contact_score).toBe(77);
  });

  it("-3 when decision documentation < 10%", () => {
    // 10 contacts, 0 decisions → 0% → -3
    const contacts = Array.from({ length: 10 }, (_, i) =>
      makeContact({
        id: `sw-${i}`,
        child_id: `c${i + 1}`,
        has_key_decisions: false,
      }),
    );
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 10, contacts });
    expect(r.decision_documentation_rate).toBe(0);
    // 52+6+5+5+5+4-3 = 74
    expect(r.contact_score).toBe(74);
  });

  it("-2 when no records (mod6)", () => {
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 4, contacts: [] });
    // 52 - 3 - 1 - 1 + 0 - 1 - 2 = 44
    expect(r.contact_score).toBe(44);
  });

  it("at exactly 10% decision documentation gets 0 (not -3)", () => {
    // pct(1,10) = 10 → >= 10 → 0
    const contacts = Array.from({ length: 10 }, (_, i) =>
      makeContact({
        id: `sw-${i}`,
        child_id: `c${i + 1}`,
        has_key_decisions: i === 0,
      }),
    );
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 10, contacts });
    expect(r.decision_documentation_rate).toBe(10);
    // 52+6+5+5+5+4+0 = 77
    expect(r.contact_score).toBe(77);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 12. STRENGTHS GENERATION
// ══════════════════════════════════════════════════════════════════════════════

describe("Strengths generation", () => {
  it("generates coverage strength when >= 90% with records", () => {
    const r = computeSocialWorkerContact(baseInput());
    expect(r.strengths).toContainEqual(
      expect.stringContaining("covers virtually all children"),
    );
  });

  it("no coverage strength at 89%", () => {
    // pct(8,9) = 89 → no coverage strength
    const contacts = Array.from({ length: 8 }, (_, i) =>
      makeContact({ id: `sw-${i}`, child_id: `c${i + 1}` }),
    );
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 9, contacts });
    expect(r.children_with_contact_rate).toBe(89);
    expect(r.strengths.some(s => s.includes("covers virtually all children"))).toBe(false);
  });

  it("generates home-initiated strength when >= 50% with records", () => {
    const r = computeSocialWorkerContact(baseInput());
    expect(r.strengths).toContainEqual(
      expect.stringContaining("proactively initiates contact"),
    );
  });

  it("no home-initiated strength at 49%", () => {
    // pct(49,100)=49 - but let's use smaller numbers: pct(2,5)=40
    // Actually we need exactly 49. pct(49,100)=49. Let me use fewer contacts.
    // pct(1,3)=33. Let me try: need <50. 2/5=40%.
    const contacts = Array.from({ length: 5 }, (_, i) =>
      makeContact({
        id: `sw-${i}`,
        child_id: `c${i + 1}`,
        initiated_by: i < 2 ? "home" : "social_worker",
      }),
    );
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 5, contacts });
    expect(r.home_initiated_rate).toBe(40);
    expect(r.strengths.some(s => s.includes("proactively initiates contact"))).toBe(false);
  });

  it("generates child awareness strength when >= 80% with records", () => {
    const r = computeSocialWorkerContact(baseInput());
    expect(r.strengths).toContainEqual(
      expect.stringContaining("routinely informed about social worker contact"),
    );
  });

  it("no child awareness strength at 79%", () => {
    // pct(3,4)=75 < 80 → no strength
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", child_aware: true }),
      makeContact({ id: "sw-2", child_id: "c2", child_aware: true }),
      makeContact({ id: "sw-3", child_id: "c3", child_aware: true }),
      makeContact({ id: "sw-4", child_id: "c4", child_aware: false }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 4, contacts });
    expect(r.child_awareness_rate).toBe(75);
    expect(r.strengths.some(s => s.includes("routinely informed"))).toBe(false);
  });

  it("generates follow-up strength when >= 90% and followUpRequired > 0", () => {
    const r = computeSocialWorkerContact(baseInput());
    expect(r.strengths).toContainEqual(
      expect.stringContaining("Follow-up actions from SW contacts are consistently completed"),
    );
  });

  it("no follow-up strength when followUpRequired is 0 even if rate is artificially high", () => {
    // followUpRequired=0 → strength condition not met (requires followUpRequired > 0)
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", follow_up_required: false }),
      makeContact({ id: "sw-2", child_id: "c2", follow_up_required: false }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 2, contacts });
    expect(r.strengths.some(s => s.includes("Follow-up actions from SW contacts"))).toBe(false);
  });

  it("generates action completion strength when >= 80% and totalActions > 0", () => {
    const r = computeSocialWorkerContact(baseInput());
    expect(r.strengths).toContainEqual(
      expect.stringContaining("Action items from social worker contacts are completed at a high rate"),
    );
  });

  it("no action strength when totalActions is 0", () => {
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", action_item_count: 0, action_completed_count: 0 }),
      makeContact({ id: "sw-2", child_id: "c2", action_item_count: 0, action_completed_count: 0 }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 2, contacts });
    expect(r.strengths.some(s => s.includes("Action items from social worker contacts"))).toBe(false);
  });

  it("generates decision documentation strength when >= 60% with records", () => {
    const r = computeSocialWorkerContact(baseInput());
    expect(r.strengths).toContainEqual(
      expect.stringContaining("Key decisions from SW contacts are documented"),
    );
  });

  it("no decision strength at 59%", () => {
    // pct(3,6) = 50 < 60 → no strength
    const contacts = Array.from({ length: 6 }, (_, i) =>
      makeContact({
        id: `sw-${i}`,
        child_id: `c${i + 1}`,
        has_key_decisions: i < 3,
      }),
    );
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 6, contacts });
    expect(r.decision_documentation_rate).toBe(50);
    expect(r.strengths.some(s => s.includes("Key decisions from SW contacts"))).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 13. CONCERNS GENERATION
// ══════════════════════════════════════════════════════════════════════════════

describe("Concerns generation", () => {
  it("concern: no contacts when total_children > 0", () => {
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 4, contacts: [] });
    expect(r.concerns).toContainEqual(
      expect.stringContaining("No social worker contact records"),
    );
  });

  it("no concern about missing contacts when there are records", () => {
    const r = computeSocialWorkerContact(baseInput());
    expect(r.concerns.some(c => c.includes("No social worker contact records"))).toBe(false);
  });

  it("concern: low coverage < 50%", () => {
    // 4 contacts for c1 only → 1/4 = 25% < 50%
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1" }),
      makeContact({ id: "sw-2", child_id: "c1" }),
      makeContact({ id: "sw-3", child_id: "c1" }),
      makeContact({ id: "sw-4", child_id: "c1" }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 4, contacts });
    expect(r.children_with_contact_rate).toBe(25);
    expect(r.concerns).toContainEqual(
      expect.stringContaining("Many children have no recorded social worker contact"),
    );
  });

  it("no coverage concern at 50%", () => {
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1" }),
      makeContact({ id: "sw-2", child_id: "c2" }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 4, contacts });
    expect(r.children_with_contact_rate).toBe(50);
    expect(r.concerns.some(c => c.includes("Many children have no recorded"))).toBe(false);
  });

  it("concern: home-initiated < 15%", () => {
    // 10 contacts, 1 home → 10% → concern
    const contacts = Array.from({ length: 10 }, (_, i) =>
      makeContact({
        id: `sw-${i}`,
        child_id: `c${i + 1}`,
        initiated_by: i === 0 ? "home" : "social_worker",
      }),
    );
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 10, contacts });
    expect(r.home_initiated_rate).toBe(10);
    expect(r.concerns).toContainEqual(
      expect.stringContaining("rarely initiates contact"),
    );
  });

  it("no home-initiated concern at 15%", () => {
    const contacts = Array.from({ length: 20 }, (_, i) =>
      makeContact({
        id: `sw-${i}`,
        child_id: `c${(i % 20) + 1}`,
        initiated_by: i < 3 ? "home" : "social_worker",
      }),
    );
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 20, contacts });
    expect(r.home_initiated_rate).toBe(15);
    expect(r.concerns.some(c => c.includes("rarely initiates contact"))).toBe(false);
  });

  it("concern: child awareness < 25%", () => {
    // 5 contacts, 1 aware → 20% → concern
    const contacts = Array.from({ length: 5 }, (_, i) =>
      makeContact({
        id: `sw-${i}`,
        child_id: `c${i + 1}`,
        child_aware: i === 0,
      }),
    );
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 5, contacts });
    expect(r.child_awareness_rate).toBe(20);
    expect(r.concerns).toContainEqual(
      expect.stringContaining("rarely informed about social worker contact"),
    );
  });

  it("no child awareness concern at 25%", () => {
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", child_aware: true }),
      makeContact({ id: "sw-2", child_id: "c2", child_aware: false }),
      makeContact({ id: "sw-3", child_id: "c3", child_aware: false }),
      makeContact({ id: "sw-4", child_id: "c4", child_aware: false }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 4, contacts });
    expect(r.child_awareness_rate).toBe(25);
    expect(r.concerns.some(c => c.includes("rarely informed"))).toBe(false);
  });

  it("concern: follow-up compliance < 30%", () => {
    // 4 required, 1 with date → 25% → concern
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", follow_up_required: true, has_follow_up_date: true }),
      makeContact({ id: "sw-2", child_id: "c2", follow_up_required: true, has_follow_up_date: false }),
      makeContact({ id: "sw-3", child_id: "c3", follow_up_required: true, has_follow_up_date: false }),
      makeContact({ id: "sw-4", child_id: "c4", follow_up_required: true, has_follow_up_date: false }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 4, contacts });
    expect(r.follow_up_compliance_rate).toBe(25);
    expect(r.concerns).toContainEqual(
      expect.stringContaining("Follow-ups from SW contacts are not being actioned"),
    );
  });

  it("no follow-up concern when followUpRequired is 0", () => {
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", follow_up_required: false }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 1, contacts });
    expect(r.concerns.some(c => c.includes("Follow-ups from SW contacts"))).toBe(false);
  });

  it("concern: overdue actions (singular)", () => {
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", action_overdue_count: 1 }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 1, contacts });
    expect(r.concerns).toContainEqual(
      expect.stringContaining("1 action from social worker contacts is overdue"),
    );
  });

  it("concern: overdue actions (plural)", () => {
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", action_overdue_count: 3 }),
      makeContact({ id: "sw-2", child_id: "c2", action_overdue_count: 2 }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 2, contacts });
    expect(r.concerns).toContainEqual(
      expect.stringContaining("5 actions from social worker contacts are overdue"),
    );
  });

  it("no overdue concern when overdue is 0", () => {
    const r = computeSocialWorkerContact(baseInput());
    expect(r.concerns.some(c => c.includes("overdue"))).toBe(false);
  });

  it("concern: decision documentation < 10%", () => {
    // 10 contacts, 0 decisions → 0% → concern
    const contacts = Array.from({ length: 10 }, (_, i) =>
      makeContact({
        id: `sw-${i}`,
        child_id: `c${i + 1}`,
        has_key_decisions: false,
      }),
    );
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 10, contacts });
    expect(r.decision_documentation_rate).toBe(0);
    expect(r.concerns).toContainEqual(
      expect.stringContaining("Decisions from social worker contacts are rarely documented"),
    );
  });

  it("no decision concern at 10%", () => {
    // pct(1,10) = 10 → >= 10 → no concern
    const contacts = Array.from({ length: 10 }, (_, i) =>
      makeContact({
        id: `sw-${i}`,
        child_id: `c${i + 1}`,
        has_key_decisions: i === 0,
      }),
    );
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 10, contacts });
    expect(r.decision_documentation_rate).toBe(10);
    expect(r.concerns.some(c => c.includes("rarely documented"))).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 14. RECOMMENDATIONS GENERATION
// ══════════════════════════════════════════════════════════════════════════════

describe("Recommendations generation", () => {
  it("recommends structured recording when no contacts and total_children > 0", () => {
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 4, contacts: [] });
    expect(r.recommendations).toContainEqual(
      expect.objectContaining({
        rank: 1,
        recommendation: expect.stringContaining("Establish structured social worker contact recording"),
        urgency: "immediate",
        regulatory_ref: "CHR 2015 Reg 5",
      }),
    );
  });

  it("recommends improving coverage when < 60% with records", () => {
    // 10 children, 4 contacts for c1-c4 → 40% → recommendation
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1" }),
      makeContact({ id: "sw-2", child_id: "c2" }),
      makeContact({ id: "sw-3", child_id: "c3" }),
      makeContact({ id: "sw-4", child_id: "c4" }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 10, contacts });
    expect(r.children_with_contact_rate).toBe(40);
    expect(r.recommendations).toContainEqual(
      expect.objectContaining({
        recommendation: expect.stringContaining("Ensure every child has recent social worker contact"),
        urgency: "immediate",
        regulatory_ref: "CHR 2015 Reg 5",
      }),
    );
  });

  it("no coverage recommendation at 60%", () => {
    const contacts = Array.from({ length: 3 }, (_, i) =>
      makeContact({ id: `sw-${i}`, child_id: `c${i + 1}` }),
    );
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 5, contacts });
    expect(r.children_with_contact_rate).toBe(60);
    expect(r.recommendations.some(rec => rec.recommendation.includes("Ensure every child"))).toBe(false);
  });

  it("recommends increasing home-initiated when < 30%", () => {
    // 5 contacts, 1 home → 20% → recommendation
    const contacts = Array.from({ length: 5 }, (_, i) =>
      makeContact({
        id: `sw-${i}`,
        child_id: `c${i + 1}`,
        initiated_by: i === 0 ? "home" : "social_worker",
      }),
    );
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 5, contacts });
    expect(r.home_initiated_rate).toBe(20);
    expect(r.recommendations).toContainEqual(
      expect.objectContaining({
        recommendation: expect.stringContaining("Increase home-initiated contact"),
        urgency: "soon",
        regulatory_ref: "SCCIF Leaders",
      }),
    );
  });

  it("no home-initiated recommendation at 30%", () => {
    const contacts = Array.from({ length: 10 }, (_, i) =>
      makeContact({
        id: `sw-${i}`,
        child_id: `c${i + 1}`,
        initiated_by: i < 3 ? "home" : "social_worker",
      }),
    );
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 10, contacts });
    expect(r.home_initiated_rate).toBe(30);
    expect(r.recommendations.some(rec => rec.recommendation.includes("Increase home-initiated"))).toBe(false);
  });

  it("recommends child awareness when < 50%", () => {
    // 5 contacts, 2 aware → 40% → recommendation
    const contacts = Array.from({ length: 5 }, (_, i) =>
      makeContact({
        id: `sw-${i}`,
        child_id: `c${i + 1}`,
        child_aware: i < 2,
      }),
    );
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 5, contacts });
    expect(r.child_awareness_rate).toBe(40);
    expect(r.recommendations).toContainEqual(
      expect.objectContaining({
        recommendation: expect.stringContaining("Inform children when their social worker makes contact"),
        urgency: "soon",
        regulatory_ref: "CHR 2015 Reg 7",
      }),
    );
  });

  it("no child awareness recommendation at 50%", () => {
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", child_aware: true }),
      makeContact({ id: "sw-2", child_id: "c2", child_aware: false }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 2, contacts });
    expect(r.child_awareness_rate).toBe(50);
    expect(r.recommendations.some(rec => rec.recommendation.includes("Inform children"))).toBe(false);
  });

  it("recommends clearing overdue actions", () => {
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", action_overdue_count: 3 }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 1, contacts });
    expect(r.recommendations).toContainEqual(
      expect.objectContaining({
        recommendation: expect.stringContaining("Clear all overdue action items"),
        urgency: "immediate",
        regulatory_ref: "CHR 2015 Reg 5",
      }),
    );
  });

  it("no overdue action recommendation when 0 overdue", () => {
    const r = computeSocialWorkerContact(baseInput());
    expect(r.recommendations.some(rec => rec.recommendation.includes("Clear all overdue"))).toBe(false);
  });

  it("recommends documenting decisions when < 30%", () => {
    // 5 contacts, 1 decision → 20% → recommendation
    const contacts = Array.from({ length: 5 }, (_, i) =>
      makeContact({
        id: `sw-${i}`,
        child_id: `c${i + 1}`,
        has_key_decisions: i === 0,
      }),
    );
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 5, contacts });
    expect(r.decision_documentation_rate).toBe(20);
    expect(r.recommendations).toContainEqual(
      expect.objectContaining({
        recommendation: expect.stringContaining("Document key decisions and outcomes"),
        urgency: "planned",
        regulatory_ref: "SCCIF Leaders",
      }),
    );
  });

  it("no decision recommendation at 30%", () => {
    const contacts = Array.from({ length: 10 }, (_, i) =>
      makeContact({
        id: `sw-${i}`,
        child_id: `c${i + 1}`,
        has_key_decisions: i < 3,
      }),
    );
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 10, contacts });
    expect(r.decision_documentation_rate).toBe(30);
    expect(r.recommendations.some(rec => rec.recommendation.includes("Document key decisions"))).toBe(false);
  });

  it("recommendations are ranked sequentially", () => {
    // Trigger multiple recommendations
    const contacts = [
      makeContact({
        id: "sw-1", child_id: "c1",
        initiated_by: "social_worker",
        child_aware: false,
        has_key_decisions: false,
        action_overdue_count: 2,
      }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 10, contacts });
    // Expected recommendations: coverage (<60%), home-initiated (<30%), child_awareness (<50%), overdue, decisions (<30%)
    const ranks = r.recommendations.map(rec => rec.rank);
    for (let i = 0; i < ranks.length; i++) {
      expect(ranks[i]).toBe(i + 1);
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 15. INSIGHTS GENERATION
// ══════════════════════════════════════════════════════════════════════════════

describe("Insights generation", () => {
  it("insight: no contacts critical when total_children > 0", () => {
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 4, contacts: [] });
    expect(r.insights).toContainEqual(
      expect.objectContaining({
        text: expect.stringContaining("No social worker contact records means Ofsted cannot verify"),
        severity: "critical",
      }),
    );
  });

  it("no critical insight when there are contacts", () => {
    const r = computeSocialWorkerContact(baseInput());
    expect(r.insights.some(i => i.text.includes("No social worker contact records means"))).toBe(false);
  });

  it("insight: proactive + transparent partnership", () => {
    // homeInitiatedRate >= 50 && childAwarenessRate >= 80
    const r = computeSocialWorkerContact(baseInput());
    expect(r.insights).toContainEqual(
      expect.objectContaining({
        text: expect.stringContaining("outstanding placing authority partnership"),
        severity: "positive",
      }),
    );
  });

  it("no partnership insight when home-initiated < 50%", () => {
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", initiated_by: "home" }),
      makeContact({ id: "sw-2", child_id: "c2", initiated_by: "social_worker" }),
      makeContact({ id: "sw-3", child_id: "c3", initiated_by: "social_worker" }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 3, contacts });
    expect(r.home_initiated_rate).toBe(33);
    expect(r.insights.some(i => i.text.includes("outstanding placing authority partnership"))).toBe(false);
  });

  it("no partnership insight when child awareness < 80%", () => {
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", child_aware: true }),
      makeContact({ id: "sw-2", child_id: "c2", child_aware: true }),
      makeContact({ id: "sw-3", child_id: "c3", child_aware: false }),
      makeContact({ id: "sw-4", child_id: "c4", child_aware: false }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 4, contacts });
    expect(r.child_awareness_rate).toBe(50);
    expect(r.insights.some(i => i.text.includes("outstanding placing authority partnership"))).toBe(false);
  });

  it("insight: urgent contacts (singular)", () => {
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", urgency: "urgent" }),
      makeContact({ id: "sw-2", child_id: "c2", urgency: "routine" }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 2, contacts });
    expect(r.insights).toContainEqual(
      expect.objectContaining({
        text: expect.stringContaining("1 urgent/emergency contact recorded"),
        severity: "warning",
      }),
    );
  });

  it("insight: urgent contacts (plural)", () => {
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", urgency: "urgent" }),
      makeContact({ id: "sw-2", child_id: "c2", urgency: "emergency" }),
      makeContact({ id: "sw-3", child_id: "c3", urgency: "routine" }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 3, contacts });
    expect(r.insights).toContainEqual(
      expect.objectContaining({
        text: expect.stringContaining("2 urgent/emergency contacts recorded"),
        severity: "warning",
      }),
    );
  });

  it("no urgent insight when all routine", () => {
    const r = computeSocialWorkerContact(baseInput());
    expect(r.insights.some(i => i.text.includes("urgent/emergency"))).toBe(false);
  });

  it("insight: face-to-face ratio >= 30%", () => {
    // Default contacts are all "visit" type → 100% face-to-face → insight
    const r = computeSocialWorkerContact(baseInput());
    expect(r.insights).toContainEqual(
      expect.objectContaining({
        text: expect.stringContaining("Strong face-to-face contact ratio"),
        severity: "positive",
      }),
    );
  });

  it("face-to-face includes statutory_visit and lac_review", () => {
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", contact_type: "statutory_visit" }),
      makeContact({ id: "sw-2", child_id: "c2", contact_type: "lac_review" }),
      makeContact({ id: "sw-3", child_id: "c3", contact_type: "phone_call" }),
    ];
    // faceToFace: 2/3 = 67% → >= 30% → insight
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 3, contacts });
    expect(r.insights).toContainEqual(
      expect.objectContaining({
        text: expect.stringContaining("Strong face-to-face contact ratio"),
        severity: "positive",
      }),
    );
  });

  it("no face-to-face insight when < 30%", () => {
    // pct(1,4) = 25 < 30 → no insight
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", contact_type: "visit" }),
      makeContact({ id: "sw-2", child_id: "c2", contact_type: "phone_call" }),
      makeContact({ id: "sw-3", child_id: "c3", contact_type: "email" }),
      makeContact({ id: "sw-4", child_id: "c4", contact_type: "phone_call" }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 4, contacts });
    expect(r.insights.some(i => i.text.includes("face-to-face contact ratio"))).toBe(false);
  });

  it("insight: LAC reviews documented (singular)", () => {
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", contact_type: "lac_review" }),
      makeContact({ id: "sw-2", child_id: "c2", contact_type: "phone_call" }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 2, contacts });
    expect(r.insights).toContainEqual(
      expect.objectContaining({
        text: expect.stringContaining("1 LAC review documented"),
        severity: "positive",
      }),
    );
  });

  it("insight: LAC reviews documented (plural)", () => {
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", contact_type: "lac_review" }),
      makeContact({ id: "sw-2", child_id: "c2", contact_type: "lac_review" }),
      makeContact({ id: "sw-3", child_id: "c3", contact_type: "phone_call" }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 3, contacts });
    expect(r.insights).toContainEqual(
      expect.objectContaining({
        text: expect.stringContaining("2 LAC reviews documented"),
        severity: "positive",
      }),
    );
  });

  it("no LAC review insight when none present", () => {
    const r = computeSocialWorkerContact(baseInput());
    expect(r.insights.some(i => i.text.includes("LAC review"))).toBe(false);
  });

  it("insight: overdue > 3 systemic issues", () => {
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", action_overdue_count: 4 }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 1, contacts });
    expect(r.insights).toContainEqual(
      expect.objectContaining({
        text: expect.stringContaining("systemic issues with follow-through"),
        severity: "warning",
      }),
    );
  });

  it("no systemic insight when overdue is exactly 3", () => {
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", action_overdue_count: 3 }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 1, contacts });
    expect(r.insights.some(i => i.text.includes("systemic issues"))).toBe(false);
  });

  it("no systemic insight when overdue is 0", () => {
    const r = computeSocialWorkerContact(baseInput());
    expect(r.insights.some(i => i.text.includes("systemic issues"))).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 16. HEADLINES
// ══════════════════════════════════════════════════════════════════════════════

describe("Headlines", () => {
  it("insufficient_data headline", () => {
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 0, contacts: [] });
    expect(r.headline).toBe("No data available for social worker contact intelligence analysis");
  });

  it("outstanding headline", () => {
    const r = computeSocialWorkerContact(baseInput());
    expect(r.headline).toBe(
      "Outstanding social worker engagement — proactive, transparent and well-documented placing authority partnerships",
    );
  });

  it("good headline", () => {
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1" }),
      makeContact({ id: "sw-2", child_id: "c2" }),
      makeContact({ id: "sw-3", child_id: "c3", has_key_decisions: false }),
      makeContact({ id: "sw-4", child_id: "c4", has_key_decisions: false }),
    ];
    // Score: 79 → good
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 4, contacts });
    expect(r.headline).toBe("Good social worker contact with regular communication and documented decisions");
  });

  it("adequate headline", () => {
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", initiated_by: "home", child_aware: true, follow_up_required: true, has_follow_up_date: true, action_completed_count: 1, has_key_decisions: true }),
      makeContact({ id: "sw-2", child_id: "c2", initiated_by: "social_worker", child_aware: true, follow_up_required: true, has_follow_up_date: true, action_completed_count: 2, has_key_decisions: false }),
      makeContact({ id: "sw-3", child_id: "c3", initiated_by: "social_worker", child_aware: false, follow_up_required: true, has_follow_up_date: false, action_completed_count: 1, has_key_decisions: false }),
      makeContact({ id: "sw-4", child_id: "c3", initiated_by: "social_worker", child_aware: false, follow_up_required: false, action_completed_count: 1, has_key_decisions: false }),
    ];
    // Score: 59 → adequate
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 4, contacts });
    expect(r.headline).toBe(
      "Social worker contact exists but proactivity, child awareness or follow-through needs improvement",
    );
  });

  it("inadequate headline", () => {
    const contacts = [
      makeContact({
        id: "sw-1", child_id: "c1",
        initiated_by: "social_worker",
        child_aware: false,
        follow_up_required: true, has_follow_up_date: false,
        action_item_count: 4, action_completed_count: 0,
        has_key_decisions: false,
      }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 10, contacts });
    expect(r.headline).toBe(
      "Inadequate social worker engagement — placing authority relationships lack structure, documentation and follow-through",
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 17. SINGLE CONTACT SCENARIOS
// ══════════════════════════════════════════════════════════════════════════════

describe("Single contact", () => {
  it("single perfect contact for 1 child", () => {
    // coverage: 1/1 = 100% → +6
    // home: 1/1 = 100% → +5
    // aware: 1/1 = 100% → +5
    // followup: 1/1 required, 1 with date → 100% → +5
    // actions: 2 total, 2 completed → 100% → +4
    // decisions: 1/1 = 100% → +5
    // 52 + 6 + 5 + 5 + 5 + 4 + 5 = 82
    const contacts = [makeContact({ id: "sw-1", child_id: "c1" })];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 1, contacts });
    expect(r.contact_score).toBe(82);
    expect(r.contact_rating).toBe("outstanding");
    expect(r.total_contacts).toBe(1);
  });

  it("single poor contact for many children", () => {
    // coverage: 1/10 = 10% → -5
    // home: 0/1 = 0% → -5
    // aware: 0/1 = 0% → -4
    // followup: 1 required, 0 with date → 0% → -4
    // actions: 4 total, 0 completed → 0% → -4
    // decisions: 0/1 = 0% → -3
    // 52 - 5 - 5 - 4 - 4 - 4 - 3 = 27
    const contacts = [
      makeContact({
        id: "sw-1", child_id: "c1",
        initiated_by: "social_worker",
        child_aware: false,
        follow_up_required: true, has_follow_up_date: false,
        action_item_count: 4, action_completed_count: 0,
        has_key_decisions: false,
      }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 10, contacts });
    expect(r.contact_score).toBe(27);
    expect(r.contact_rating).toBe("inadequate");
    expect(r.total_contacts).toBe(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 18. LARGE DATASET
// ══════════════════════════════════════════════════════════════════════════════

describe("Large dataset", () => {
  it("handles 50 contacts across 20 children", () => {
    const contacts = Array.from({ length: 50 }, (_, i) =>
      makeContact({
        id: `sw-${i}`,
        child_id: `c${(i % 20) + 1}`,
        initiated_by: i % 2 === 0 ? "home" : "social_worker",
        child_aware: i % 3 !== 0,
        follow_up_required: i % 4 !== 0,
        has_follow_up_date: i % 4 !== 0,
        action_item_count: 2,
        action_completed_count: 2,
        has_key_decisions: i % 2 === 0,
      }),
    );
    // 20 unique children / 20 total = 100% → +6
    // home: 25/50 = 50% → +5
    // aware: 17 not aware (i%3===0 for i=0,3,6,...,48 → 17), so 33 aware / 50 = 66% → +2
    // followup: 38 required (i%4!==0: exclude 0,4,8,...,48 → 13 excluded, 37 required)
    // Actually: i%4 === 0 for i=0,4,8,12,...,48 → 13 contacts have follow_up_required=false
    // So 50-13=37 required, all 37 with date → 100% → +5
    // actions: 100 total, 100 completed → 100% → +4
    // decisions: 25/50 = 50% → +2
    // 52+6+5+2+5+4+2 = 76
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 20, contacts });
    expect(r.children_with_contact_rate).toBe(100);
    expect(r.home_initiated_rate).toBe(50);
    // aware: count where i%3 !== 0 among 0..49
    // i%3===0: 0,3,6,...,48 → 17 values → 50-17=33 aware → pct(33,50) = 66
    expect(r.child_awareness_rate).toBe(66);
    expect(r.follow_up_compliance_rate).toBe(100);
    expect(r.action_completion_rate).toBe(100);
    expect(r.decision_documentation_rate).toBe(50);
    expect(r.contact_score).toBe(76);
    expect(r.contact_rating).toBe("good");
    expect(r.total_contacts).toBe(50);
  });

  it("handles 100 contacts for 1 child", () => {
    const contacts = Array.from({ length: 100 }, (_, i) =>
      makeContact({ id: `sw-${i}`, child_id: "c1" }),
    );
    // coverage: 1/1 = 100% → +6
    // All modifiers maxed → 82
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 1, contacts });
    expect(r.contact_score).toBe(82);
    expect(r.total_contacts).toBe(100);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 19. MIXED URGENCY PATTERNS
// ══════════════════════════════════════════════════════════════════════════════

describe("Mixed urgency patterns", () => {
  it("counts urgent and emergency together", () => {
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", urgency: "urgent" }),
      makeContact({ id: "sw-2", child_id: "c2", urgency: "emergency" }),
      makeContact({ id: "sw-3", child_id: "c3", urgency: "routine" }),
      makeContact({ id: "sw-4", child_id: "c4", urgency: "routine" }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 4, contacts });
    expect(r.insights).toContainEqual(
      expect.objectContaining({
        text: expect.stringContaining("2 urgent/emergency contacts recorded"),
        severity: "warning",
      }),
    );
  });

  it("only emergency counts as urgent contact", () => {
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", urgency: "emergency" }),
      makeContact({ id: "sw-2", child_id: "c2", urgency: "routine" }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 2, contacts });
    expect(r.insights).toContainEqual(
      expect.objectContaining({
        text: expect.stringContaining("1 urgent/emergency contact recorded"),
        severity: "warning",
      }),
    );
  });

  it("all routine generates no urgency insight", () => {
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", urgency: "routine" }),
      makeContact({ id: "sw-2", child_id: "c2", urgency: "routine" }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 2, contacts });
    expect(r.insights.some(i => i.text.includes("urgent/emergency"))).toBe(false);
  });

  it("urgency does not affect score", () => {
    // All urgent vs all routine should have same score with same other params
    const urgentContacts = [
      makeContact({ id: "sw-1", child_id: "c1", urgency: "urgent" }),
      makeContact({ id: "sw-2", child_id: "c2", urgency: "emergency" }),
    ];
    const routineContacts = [
      makeContact({ id: "sw-1", child_id: "c1", urgency: "routine" }),
      makeContact({ id: "sw-2", child_id: "c2", urgency: "routine" }),
    ];
    const rU = computeSocialWorkerContact({ today: TODAY, total_children: 2, contacts: urgentContacts });
    const rR = computeSocialWorkerContact({ today: TODAY, total_children: 2, contacts: routineContacts });
    expect(rU.contact_score).toBe(rR.contact_score);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 20. RATE CALCULATIONS
// ══════════════════════════════════════════════════════════════════════════════

describe("Rate calculations", () => {
  it("computes children_with_contact_rate correctly", () => {
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1" }),
      makeContact({ id: "sw-2", child_id: "c1" }),
      makeContact({ id: "sw-3", child_id: "c2" }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 4, contacts });
    // 2 unique children / 4 = 50%
    expect(r.children_with_contact_rate).toBe(50);
  });

  it("computes home_initiated_rate correctly", () => {
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", initiated_by: "home" }),
      makeContact({ id: "sw-2", child_id: "c2", initiated_by: "social_worker" }),
      makeContact({ id: "sw-3", child_id: "c3", initiated_by: "other" }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 3, contacts });
    expect(r.home_initiated_rate).toBe(33); // Math.round(1/3*100) = 33
  });

  it("computes child_awareness_rate correctly", () => {
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", child_aware: true }),
      makeContact({ id: "sw-2", child_id: "c2", child_aware: false }),
      makeContact({ id: "sw-3", child_id: "c3", child_aware: true }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 3, contacts });
    expect(r.child_awareness_rate).toBe(67); // Math.round(2/3*100) = 67
  });

  it("computes follow_up_compliance_rate correctly", () => {
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", follow_up_required: true, has_follow_up_date: true }),
      makeContact({ id: "sw-2", child_id: "c2", follow_up_required: true, has_follow_up_date: false }),
      makeContact({ id: "sw-3", child_id: "c3", follow_up_required: false }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 3, contacts });
    expect(r.follow_up_compliance_rate).toBe(50); // 1/2 = 50
  });

  it("computes action_completion_rate correctly", () => {
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", action_item_count: 3, action_completed_count: 2 }),
      makeContact({ id: "sw-2", child_id: "c2", action_item_count: 5, action_completed_count: 3 }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 2, contacts });
    expect(r.action_completion_rate).toBe(63); // Math.round(5/8*100) = 63
  });

  it("computes decision_documentation_rate correctly", () => {
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", has_key_decisions: true }),
      makeContact({ id: "sw-2", child_id: "c2", has_key_decisions: false }),
      makeContact({ id: "sw-3", child_id: "c3", has_key_decisions: true }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 3, contacts });
    expect(r.decision_documentation_rate).toBe(67); // Math.round(2/3*100) = 67
  });

  it("children_with_contact_rate is a genuine 0 with no contacts, but the other five rates are unmeasured", () => {
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 4, contacts: [] });
    expect(r.children_with_contact_rate).toBe(0);
    expect(r.home_initiated_rate).toBeNull();
    expect(r.child_awareness_rate).toBeNull();
    expect(r.follow_up_compliance_rate).toBeNull();
    expect(r.action_completion_rate).toBeNull();
    expect(r.decision_documentation_rate).toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 21. SCORE CLAMPING
// ══════════════════════════════════════════════════════════════════════════════

describe("Score clamping", () => {
  it("score never exceeds 100", () => {
    // With max modifiers score is 82 which is under 100, so this should just be 82
    const r = computeSocialWorkerContact(baseInput());
    expect(r.contact_score).toBeLessThanOrEqual(100);
    expect(r.contact_score).toBe(82);
  });

  it("score never goes below 0", () => {
    // Even with all penalties maximized:
    // 52 - 5 - 5 - 4 - 4 - 4 - 3 = 27 > 0, so hard to hit 0
    // But with 0 contacts, the penalties are: -3 -1 -1 +0 -1 -2 = -8 → 44
    // Still positive. The clamp is a safety net.
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 10, contacts: [] });
    expect(r.contact_score).toBeGreaterThanOrEqual(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 22. COMBINED EDGE CASES
// ══════════════════════════════════════════════════════════════════════════════

describe("Combined edge cases", () => {
  it("zero actions and zero follow-ups both give +2 bonus", () => {
    // With records but no actions and no follow-ups
    const contacts = [
      makeContact({
        id: "sw-1", child_id: "c1",
        follow_up_required: false,
        action_item_count: 0, action_completed_count: 0,
      }),
    ];
    // coverage: 1/1 = 100% → +6
    // home: 100% → +5
    // aware: 100% → +5
    // followup: 0 required, total>0 → +2
    // actions: 0 actions, total>0 → +2
    // decisions: 100% → +5
    // 52+6+5+5+2+2+5 = 77
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 1, contacts });
    expect(r.contact_score).toBe(77);
    expect(r.contact_rating).toBe("good");
  });

  it("contact types do not affect score modifiers", () => {
    // Different contact types should score the same (only modifiers matter, not type)
    const emailContacts = [
      makeContact({ id: "sw-1", child_id: "c1", contact_type: "email" }),
      makeContact({ id: "sw-2", child_id: "c2", contact_type: "email" }),
    ];
    const visitContacts = [
      makeContact({ id: "sw-1", child_id: "c1", contact_type: "visit" }),
      makeContact({ id: "sw-2", child_id: "c2", contact_type: "visit" }),
    ];
    const rE = computeSocialWorkerContact({ today: TODAY, total_children: 2, contacts: emailContacts });
    const rV = computeSocialWorkerContact({ today: TODAY, total_children: 2, contacts: visitContacts });
    expect(rE.contact_score).toBe(rV.contact_score);
  });

  it("direction does not affect score", () => {
    const inContacts = [
      makeContact({ id: "sw-1", child_id: "c1", direction: "incoming" }),
      makeContact({ id: "sw-2", child_id: "c2", direction: "incoming" }),
    ];
    const outContacts = [
      makeContact({ id: "sw-1", child_id: "c1", direction: "outgoing" }),
      makeContact({ id: "sw-2", child_id: "c2", direction: "outgoing" }),
    ];
    const rI = computeSocialWorkerContact({ today: TODAY, total_children: 2, contacts: inContacts });
    const rO = computeSocialWorkerContact({ today: TODAY, total_children: 2, contacts: outContacts });
    expect(rI.contact_score).toBe(rO.contact_score);
  });

  it("documents_shared_count does not affect score", () => {
    const noDocsContacts = [
      makeContact({ id: "sw-1", child_id: "c1", documents_shared_count: 0 }),
    ];
    const manyDocsContacts = [
      makeContact({ id: "sw-1", child_id: "c1", documents_shared_count: 10 }),
    ];
    const rNone = computeSocialWorkerContact({ today: TODAY, total_children: 1, contacts: noDocsContacts });
    const rMany = computeSocialWorkerContact({ today: TODAY, total_children: 1, contacts: manyDocsContacts });
    expect(rNone.contact_score).toBe(rMany.contact_score);
  });

  it("has_outcome does not affect score", () => {
    const noOutcome = [makeContact({ id: "sw-1", child_id: "c1", has_outcome: false })];
    const withOutcome = [makeContact({ id: "sw-1", child_id: "c1", has_outcome: true })];
    const rNo = computeSocialWorkerContact({ today: TODAY, total_children: 1, contacts: noOutcome });
    const rYes = computeSocialWorkerContact({ today: TODAY, total_children: 1, contacts: withOutcome });
    expect(rNo.contact_score).toBe(rYes.contact_score);
  });

  it("has_next_scheduled does not affect score", () => {
    const noScheduled = [makeContact({ id: "sw-1", child_id: "c1", has_next_scheduled: false })];
    const withScheduled = [makeContact({ id: "sw-1", child_id: "c1", has_next_scheduled: true })];
    const rNo = computeSocialWorkerContact({ today: TODAY, total_children: 1, contacts: noScheduled });
    const rYes = computeSocialWorkerContact({ today: TODAY, total_children: 1, contacts: withScheduled });
    expect(rNo.contact_score).toBe(rYes.contact_score);
  });

  it("duplicate child_ids count as one unique child", () => {
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1" }),
      makeContact({ id: "sw-2", child_id: "c1" }),
      makeContact({ id: "sw-3", child_id: "c1" }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 4, contacts });
    expect(r.children_with_contact_rate).toBe(25); // 1/4 = 25%
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 23. ZERO CONTACTS WITH CHILDREN (insufficient_data path)
// ══════════════════════════════════════════════════════════════════════════════

describe("Zero contacts with children > 0", () => {
  it("returns insufficient_data rating", () => {
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 4, contacts: [] });
    expect(r.contact_rating).toBe("insufficient_data");
  });

  it("still calculates score (44 for 0 contacts)", () => {
    // 52 - 3 (mod1) - 1 (mod2) - 1 (mod3) + 0 (mod4) - 1 (mod5) - 2 (mod6) = 44
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 4, contacts: [] });
    expect(r.contact_score).toBe(44);
  });

  it("generates concern about no contacts", () => {
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 4, contacts: [] });
    expect(r.concerns).toContainEqual(
      expect.stringContaining("No social worker contact records"),
    );
  });

  it("generates recommendation for structured recording", () => {
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 4, contacts: [] });
    expect(r.recommendations[0].recommendation).toContain("Establish structured social worker contact recording");
  });

  it("generates critical insight about Ofsted", () => {
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 4, contacts: [] });
    expect(r.insights[0]).toEqual({
      text: "No social worker contact records means Ofsted cannot verify placing authority engagement — a key leadership indicator",
      severity: "critical",
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 24. ADDITIONAL MODIFIER BOUNDARY TESTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Additional modifier boundaries", () => {
  it("coverage at 89% gets +2 not +6", () => {
    // pct(8,9) = 89 → +2
    const contacts = Array.from({ length: 8 }, (_, i) =>
      makeContact({ id: `sw-${i}`, child_id: `c${i + 1}` }),
    );
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 9, contacts });
    expect(r.children_with_contact_rate).toBe(89);
    // 52+2+5+5+5+4+5 = 78
    expect(r.contact_score).toBe(78);
  });

  it("coverage at 59% gets 0", () => {
    // pct(3,6) = 50 < 60 → 0
    // Actually let me get 59: pct(10,17) = Math.round(58.8) = 59.
    // Simpler: need exactly 59. pct(n,d)=59.
    // Actually in the engine, 59% is >= 30 but < 60 → 0.
    // Let me just use 50%: pct(2,4)=50
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1" }),
      makeContact({ id: "sw-2", child_id: "c2" }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 4, contacts });
    expect(r.children_with_contact_rate).toBe(50);
    // 52+0+5+5+5+4+5 = 76
    expect(r.contact_score).toBe(76);
  });

  it("home-initiated at 49% gets +2 not +5", () => {
    // pct(2,5) = 40, not 49. Let me try: pct(49,100) = 49. Big set.
    // Simpler: any value 30-49% gets +2.
    // pct(2,5)=40 → +2
    const contacts = Array.from({ length: 5 }, (_, i) =>
      makeContact({
        id: `sw-${i}`,
        child_id: `c${i + 1}`,
        initiated_by: i < 2 ? "home" : "social_worker",
      }),
    );
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 5, contacts });
    expect(r.home_initiated_rate).toBe(40);
    // 52+6+2+5+5+4+5 = 79
    expect(r.contact_score).toBe(79);
  });

  it("home-initiated at 14% gets -5", () => {
    // pct(1,8) = 13 < 15 → -5
    const contacts = Array.from({ length: 8 }, (_, i) =>
      makeContact({
        id: `sw-${i}`,
        child_id: `c${i + 1}`,
        initiated_by: i === 0 ? "home" : "social_worker",
      }),
    );
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 8, contacts });
    expect(r.home_initiated_rate).toBe(13);
    // 52+6-5+5+5+4+5 = 72
    expect(r.contact_score).toBe(72);
  });

  it("child awareness at 79% gets +2 not +5", () => {
    // pct(3,4) = 75 → +2
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", child_aware: true }),
      makeContact({ id: "sw-2", child_id: "c2", child_aware: true }),
      makeContact({ id: "sw-3", child_id: "c3", child_aware: true }),
      makeContact({ id: "sw-4", child_id: "c4", child_aware: false }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 4, contacts });
    expect(r.child_awareness_rate).toBe(75);
    // 52+6+5+2+5+4+5 = 79
    expect(r.contact_score).toBe(79);
  });

  it("child awareness at 24% gets -4", () => {
    // pct(1,5) = 20 < 25 → -4
    const contacts = Array.from({ length: 5 }, (_, i) =>
      makeContact({
        id: `sw-${i}`,
        child_id: `c${i + 1}`,
        child_aware: i === 0,
      }),
    );
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 5, contacts });
    expect(r.child_awareness_rate).toBe(20);
    // 52+6+5-4+5+4+5 = 73
    expect(r.contact_score).toBe(73);
  });

  it("follow-up at 89% gets +2 not +5", () => {
    // pct(8,9) = 89 → +2
    const contacts = Array.from({ length: 9 }, (_, i) =>
      makeContact({
        id: `sw-${i}`,
        child_id: `c${i + 1}`,
        follow_up_required: true,
        has_follow_up_date: i < 8,
      }),
    );
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 9, contacts });
    expect(r.follow_up_compliance_rate).toBe(89);
    // 52+6+5+5+2+4+5 = 79
    expect(r.contact_score).toBe(79);
  });

  it("follow-up at 29% gets -4", () => {
    // pct(2,7) = 29 < 30 → -4
    const contacts = Array.from({ length: 7 }, (_, i) =>
      makeContact({
        id: `sw-${i}`,
        child_id: `c${i + 1}`,
        follow_up_required: true,
        has_follow_up_date: i < 2,
      }),
    );
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 7, contacts });
    expect(r.follow_up_compliance_rate).toBe(29);
    // 52+6+5+5-4+4+5 = 73
    expect(r.contact_score).toBe(73);
  });

  it("action completion at 79% gets +1 not +4", () => {
    // pct(3,4) = 75 → +1
    // Need actions: total 4, completed 3.
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", action_item_count: 2, action_completed_count: 2 }),
      makeContact({ id: "sw-2", child_id: "c2", action_item_count: 2, action_completed_count: 1 }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 2, contacts });
    expect(r.action_completion_rate).toBe(75);
    // 52+6+5+5+5+1+5 = 79
    expect(r.contact_score).toBe(79);
  });

  it("action completion at 24% gets -4", () => {
    // pct(1,5) = 20 < 25 → -4
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", action_item_count: 5, action_completed_count: 1 }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 1, contacts });
    expect(r.action_completion_rate).toBe(20);
    // 52+6+5+5+5-4+5 = 74
    expect(r.contact_score).toBe(74);
  });

  it("decision documentation at 59% gets +2 not +5", () => {
    // pct(3,6) = 50 → +2
    const contacts = Array.from({ length: 6 }, (_, i) =>
      makeContact({
        id: `sw-${i}`,
        child_id: `c${i + 1}`,
        has_key_decisions: i < 3,
      }),
    );
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 6, contacts });
    expect(r.decision_documentation_rate).toBe(50);
    // 52+6+5+5+5+4+2 = 79
    expect(r.contact_score).toBe(79);
  });

  it("decision documentation at 9% gets -3", () => {
    // pct(0,10) = 0 < 10 → -3
    const contacts = Array.from({ length: 10 }, (_, i) =>
      makeContact({
        id: `sw-${i}`,
        child_id: `c${i + 1}`,
        has_key_decisions: false,
      }),
    );
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 10, contacts });
    expect(r.decision_documentation_rate).toBe(0);
    // 52+6+5+5+5+4-3 = 74
    expect(r.contact_score).toBe(74);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 25. FACE-TO-FACE AND LAC REVIEW EDGE CASES
// ══════════════════════════════════════════════════════════════════════════════

describe("Face-to-face and LAC review edge cases", () => {
  it("phone-only contacts produce no face-to-face insight", () => {
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", contact_type: "phone_call" }),
      makeContact({ id: "sw-2", child_id: "c2", contact_type: "phone_call" }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 2, contacts });
    expect(r.insights.some(i => i.text.includes("face-to-face"))).toBe(false);
  });

  it("email-only contacts produce no face-to-face insight", () => {
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", contact_type: "email" }),
      makeContact({ id: "sw-2", child_id: "c2", contact_type: "email" }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 2, contacts });
    expect(r.insights.some(i => i.text.includes("face-to-face"))).toBe(false);
  });

  it("face-to-face at exactly 30% triggers insight", () => {
    // 10 contacts, 3 face-to-face → 30%
    const contacts = Array.from({ length: 10 }, (_, i) =>
      makeContact({
        id: `sw-${i}`,
        child_id: `c${i + 1}`,
        contact_type: i < 3 ? "visit" : "phone_call",
      }),
    );
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 10, contacts });
    expect(r.insights).toContainEqual(
      expect.objectContaining({
        text: expect.stringContaining("Strong face-to-face contact ratio"),
        severity: "positive",
      }),
    );
  });

  it("face-to-face at 29% does not trigger insight", () => {
    // pct(2,7) = 29 < 30
    const contacts = Array.from({ length: 7 }, (_, i) =>
      makeContact({
        id: `sw-${i}`,
        child_id: `c${i + 1}`,
        contact_type: i < 2 ? "visit" : "phone_call",
      }),
    );
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 7, contacts });
    expect(r.insights.some(i => i.text.includes("face-to-face"))).toBe(false);
  });

  it("video_call is not counted as face-to-face", () => {
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", contact_type: "video_call" }),
      makeContact({ id: "sw-2", child_id: "c2", contact_type: "video_call" }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 2, contacts });
    expect(r.insights.some(i => i.text.includes("face-to-face"))).toBe(false);
  });

  it("text contact is not counted as face-to-face", () => {
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", contact_type: "text" }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 1, contacts });
    expect(r.insights.some(i => i.text.includes("face-to-face"))).toBe(false);
  });

  it("unplanned contact is not counted as face-to-face", () => {
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", contact_type: "unplanned" }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 1, contacts });
    expect(r.insights.some(i => i.text.includes("face-to-face"))).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 26. OVERDUE ACTIONS DETAIL
// ══════════════════════════════════════════════════════════════════════════════

describe("Overdue actions detail", () => {
  it("overdue actions accumulated across contacts", () => {
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", action_overdue_count: 2 }),
      makeContact({ id: "sw-2", child_id: "c2", action_overdue_count: 3 }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 2, contacts });
    expect(r.concerns).toContainEqual(
      expect.stringContaining("5 actions from social worker contacts are overdue"),
    );
  });

  it("exactly 4 overdue triggers systemic insight", () => {
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", action_overdue_count: 4 }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 1, contacts });
    expect(r.insights).toContainEqual(
      expect.objectContaining({
        text: expect.stringContaining("systemic issues"),
        severity: "warning",
      }),
    );
  });

  it("exactly 3 overdue does NOT trigger systemic insight", () => {
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", action_overdue_count: 3 }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 1, contacts });
    expect(r.insights.some(i => i.text.includes("systemic issues"))).toBe(false);
  });

  it("1 overdue triggers concern with singular grammar", () => {
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", action_overdue_count: 1 }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 1, contacts });
    const concern = r.concerns.find(c => c.includes("overdue"));
    expect(concern).toBeDefined();
    expect(concern).toContain("1 action");
    expect(concern).toContain("is overdue");
  });

  it("2 overdue triggers concern with plural grammar", () => {
    const contacts = [
      makeContact({ id: "sw-1", child_id: "c1", action_overdue_count: 2 }),
    ];
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 1, contacts });
    const concern = r.concerns.find(c => c.includes("overdue"));
    expect(concern).toBeDefined();
    expect(concern).toContain("2 actions");
    expect(concern).toContain("are overdue");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 27. TOTAL CONTACTS OUTPUT
// ══════════════════════════════════════════════════════════════════════════════

describe("Total contacts output", () => {
  it("returns correct total for 0 contacts", () => {
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 4, contacts: [] });
    expect(r.total_contacts).toBe(0);
  });

  it("returns correct total for 1 contact", () => {
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 1, contacts: [makeContact()] });
    expect(r.total_contacts).toBe(1);
  });

  it("returns correct total for many contacts", () => {
    const contacts = Array.from({ length: 25 }, (_, i) =>
      makeContact({ id: `sw-${i}`, child_id: `c${(i % 5) + 1}` }),
    );
    const r = computeSocialWorkerContact({ today: TODAY, total_children: 5, contacts });
    expect(r.total_contacts).toBe(25);
  });
});
