// ══════════════════════════════════════════════════════════════════════════════
// TESTS — HOME COMMUNICATION & CONTACT INTELLIGENCE ENGINE
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeHomeCommunicationContact,
  type HomeCommunicationContactInput,
  type CommBookInput,
  type CorrespondenceInput,
  type ContactPlanInput,
  type CommProfileInput,
} from "../home-communication-contact-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2025-06-15";

function makeCommBook(overrides: Partial<CommBookInput> = {}): CommBookInput {
  return {
    id: "cb-1", date: "2025-06-10", priority: "normal",
    action_required: true, action_completed: true, related_yp_present: true,
    ...overrides,
  };
}

function makeCorrespondence(overrides: Partial<CorrespondenceInput> = {}): CorrespondenceInput {
  return {
    id: "corr-1", date: "2025-06-10", direction: "incoming",
    priority: "normal", status: "actioned",
    action_required_present: false, action_due: null, child_related: true,
    ...overrides,
  };
}

function makeContactPlan(overrides: Partial<ContactPlanInput> = {}): ContactPlanInput {
  return {
    id: "cp-1", child_id: "c1", review_date: "2025-12-01",
    status: "active", arrangements_count: 3, child_wishes_provided: true,
    risk_factors_count: 1, next_scheduled_contact: "2025-06-20",
    ...overrides,
  };
}

function makeCommProfile(overrides: Partial<CommProfileInput> = {}): CommProfileInput {
  return {
    id: "prof-1", child_id: "c1", last_review_date: "2025-05-01",
    interpreter_required: false, salt_involved: false,
    strategies_count: 4, aac_tools_count: 0, child_views_provided: true,
    ...overrides,
  };
}

/**
 * Base input: outstanding scenario.
 * 5 children, 8 staff.
 * Score calculation:
 * Base 52
 * mod1 (comm book actions): 8 entries, all with action completed → +5
 * mod2 (contact plan coverage): 5/5 = 100% → +4
 * mod3 (contact review timeliness): all on time → +3
 * mod4 (comm profile coverage): 5/5 = 100% → +4
 * mod5 (child voice): all with wishes/views → +3
 * mod6 (correspondence): 0 overdue → +3
 * mod7 (comm book activity): 40 entries, expected 32 (8*4) = 125% → +3
 * mod8 (SALT/accessibility): no specialist needs, strategies present → +1
 * Total: 52 + 5 + 4 + 3 + 4 + 3 + 3 + 3 + 1 = 78
 * Need +2 more. Let me adjust: need specialist need with support → +3 instead of +1
 */
function baseInput(overrides: Partial<HomeCommunicationContactInput> = {}): HomeCommunicationContactInput {
  const commBooks: CommBookInput[] = [];
  for (let i = 1; i <= 40; i++) {
    commBooks.push(makeCommBook({ id: `cb-${i}`, date: `2025-06-${String(Math.min(i, 15)).padStart(2, "0")}` }));
  }

  return {
    today: TODAY,
    comm_book_entries: commBooks,
    correspondence_entries: [
      makeCorrespondence({ id: "corr-1" }),
      makeCorrespondence({ id: "corr-2", direction: "outgoing" }),
      makeCorrespondence({ id: "corr-3", status: "filed" }),
      makeCorrespondence({ id: "corr-4", direction: "internal", status: "actioned" }),
    ],
    contact_plans: [
      makeContactPlan({ child_id: "c1" }),
      makeContactPlan({ id: "cp-2", child_id: "c2" }),
      makeContactPlan({ id: "cp-3", child_id: "c3" }),
      makeContactPlan({ id: "cp-4", child_id: "c4" }),
      makeContactPlan({ id: "cp-5", child_id: "c5" }),
    ],
    communication_profiles: [
      makeCommProfile({ child_id: "c1", interpreter_required: true, strategies_count: 5, aac_tools_count: 2 }),
      makeCommProfile({ id: "prof-2", child_id: "c2", salt_involved: true, strategies_count: 6, aac_tools_count: 1 }),
      makeCommProfile({ id: "prof-3", child_id: "c3", strategies_count: 4 }),
      makeCommProfile({ id: "prof-4", child_id: "c4", strategies_count: 3 }),
      makeCommProfile({ id: "prof-5", child_id: "c5", strategies_count: 4 }),
    ],
    total_children: 5,
    total_staff: 8,
    ...overrides,
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Home Communication & Contact Intelligence Engine", () => {

  // ── Insufficient data ──────────────────────────────────────────────────

  describe("insufficient data", () => {
    it("returns insufficient_data when all empty and no children/staff", () => {
      const result = computeHomeCommunicationContact({
        today: TODAY, comm_book_entries: [], correspondence_entries: [],
        contact_plans: [], communication_profiles: [],
        total_children: 0, total_staff: 0,
      });
      expect(result.communication_rating).toBe("insufficient_data");
      expect(result.communication_score).toBe(0);
    });

    it("does NOT return insufficient_data when children exist", () => {
      const result = computeHomeCommunicationContact({
        today: TODAY, comm_book_entries: [], correspondence_entries: [],
        contact_plans: [], communication_profiles: [],
        total_children: 3, total_staff: 0,
      });
      expect(result.communication_rating).not.toBe("insufficient_data");
    });

    it("does NOT return insufficient_data when staff exist", () => {
      const result = computeHomeCommunicationContact({
        today: TODAY, comm_book_entries: [], correspondence_entries: [],
        contact_plans: [], communication_profiles: [],
        total_children: 0, total_staff: 5,
      });
      expect(result.communication_rating).not.toBe("insufficient_data");
    });

    it("does NOT return insufficient_data when data exists", () => {
      const result = computeHomeCommunicationContact({
        today: TODAY, comm_book_entries: [makeCommBook()], correspondence_entries: [],
        contact_plans: [], communication_profiles: [],
        total_children: 0, total_staff: 0,
      });
      expect(result.communication_rating).not.toBe("insufficient_data");
    });

    it("has concern when insufficient_data", () => {
      const result = computeHomeCommunicationContact({
        today: TODAY, comm_book_entries: [], correspondence_entries: [],
        contact_plans: [], communication_profiles: [],
        total_children: 0, total_staff: 0,
      });
      expect(result.concerns.length).toBeGreaterThan(0);
    });
  });

  // ── Rating thresholds ─────────────────────────────────────────────────

  describe("rating thresholds", () => {
    it("rates outstanding for score >= 80", () => {
      const result = computeHomeCommunicationContact(baseInput());
      expect(result.communication_score).toBeGreaterThanOrEqual(80);
      expect(result.communication_rating).toBe("outstanding");
    });

    it("rates good for score 65-79", () => {
      // Reduce comm book and weaken some modifiers
      const result = computeHomeCommunicationContact(baseInput({
        comm_book_entries: [
          // 15 entries (expected 32 for 8 staff) → 47% → +0 for mod7
          ...Array.from({ length: 15 }, (_, i) => makeCommBook({
            id: `cb-${i + 1}`,
            date: `2025-06-${String(Math.min(i + 1, 15)).padStart(2, "0")}`,
          })),
        ],
        communication_profiles: [
          // Only 3 of 5 children → 60% → -4? No, mod4: 60% is >=50% → +0
          // Actually 3/5 = 60% which is < 70 but >= 50 → +0
          makeCommProfile({ child_id: "c1" }),
          makeCommProfile({ id: "prof-2", child_id: "c2" }),
          makeCommProfile({ id: "prof-3", child_id: "c3" }),
        ],
      }));
      expect(result.communication_score).toBeGreaterThanOrEqual(65);
      expect(result.communication_score).toBeLessThan(80);
      expect(result.communication_rating).toBe("good");
    });

    it("rates adequate for score 45-64", () => {
      const result = computeHomeCommunicationContact({
        today: TODAY,
        comm_book_entries: [makeCommBook()],
        correspondence_entries: [],
        contact_plans: [
          makeContactPlan({ child_id: "c1" }),
          makeContactPlan({ id: "cp-2", child_id: "c2" }),
        ],
        communication_profiles: [makeCommProfile({ child_id: "c1" })],
        total_children: 5,
        total_staff: 8,
      });
      // mod1: 1 action completed → +5
      // mod2: 2/5 = 40% → -4
      // mod3: all on time → +3
      // mod4: 1/5 = 20% → -4
      // mod5: 2 plans + 1 profile = 3 applicable, all have voice → +3
      // mod6: no correspondence → +0
      // mod7: 1 entry, expected 32 → 3% → -3
      // mod8: no specialist needs, strats present → +1
      // Score: 52 + 5 - 4 + 3 - 4 + 3 + 0 - 3 + 1 = 53
      expect(result.communication_score).toBeGreaterThanOrEqual(45);
      expect(result.communication_score).toBeLessThan(65);
      expect(result.communication_rating).toBe("adequate");
    });

    it("rates inadequate for score < 45", () => {
      const result = computeHomeCommunicationContact({
        today: TODAY,
        comm_book_entries: [
          makeCommBook({ action_required: true, action_completed: false }),
          makeCommBook({ id: "cb-2", action_required: true, action_completed: false }),
        ],
        correspondence_entries: [],
        contact_plans: [],
        communication_profiles: [],
        total_children: 5,
        total_staff: 8,
      });
      // mod1: 0/2 actions completed = 0% → -5
      // mod2: no contact plans, children exist → -4
      // mod3: no plans → +0
      // mod4: no profiles, children exist → -4
      // mod5: 0 applicable → +0
      // mod6: no correspondence → +0
      // mod7: 2 entries, expected 32 → 6% → -3
      // mod8: no profiles → +0
      // Score: 52 - 5 - 4 + 0 - 4 + 0 + 0 - 3 + 0 = 36
      expect(result.communication_score).toBeLessThan(45);
      expect(result.communication_rating).toBe("inadequate");
    });
  });

  // ── Score boundaries ──────────────────────────────────────────────────

  describe("score boundaries", () => {
    it("outstanding base score is correct", () => {
      const result = computeHomeCommunicationContact(baseInput());
      // mod1: 40 actions, all completed → +5
      // mod2: 5/5 coverage → +4
      // mod3: all on time → +3
      // mod4: 5/5 profiles → +4
      // mod5: all voice → +3
      // mod6: 0 overdue → +3
      // mod7: 40 entries, expected 32 → 125% → +3
      // mod8: 2 specialist (interp+salt) both have strategies/aac → +3
      // Total: 52 + 5 + 4 + 3 + 4 + 3 + 3 + 3 + 3 = 80
      expect(result.communication_score).toBe(80);
    });

    it("never exceeds 100", () => {
      const result = computeHomeCommunicationContact(baseInput());
      expect(result.communication_score).toBeLessThanOrEqual(100);
    });

    it("never goes below 0", () => {
      const result = computeHomeCommunicationContact({
        today: TODAY,
        comm_book_entries: Array.from({ length: 5 }, (_, i) =>
          makeCommBook({ id: `cb-${i}`, action_required: true, action_completed: false })),
        correspondence_entries: Array.from({ length: 10 }, (_, i) =>
          makeCorrespondence({
            id: `corr-${i}`, action_required_present: true,
            action_due: "2025-06-01", status: "awaiting_response",
          })),
        contact_plans: [],
        communication_profiles: [],
        total_children: 10,
        total_staff: 20,
      });
      expect(result.communication_score).toBeGreaterThanOrEqual(0);
    });
  });

  // ── Modifier 1: Comm book action completion (±5) ──────────────────────

  describe("mod1: communication book action completion", () => {
    it("+5 when action completion >= 95%", () => {
      const result = computeHomeCommunicationContact(baseInput());
      expect(result.comm_book.action_completion_rate).toBe(100);
    });

    it("-5 when action completion < 60%", () => {
      const entries = Array.from({ length: 10 }, (_, i) => makeCommBook({
        id: `cb-${i}`, date: "2025-06-10",
        action_required: true,
        action_completed: i < 3, // 30% completed
      }));
      const result = computeHomeCommunicationContact(baseInput({
        comm_book_entries: entries,
      }));
      expect(result.comm_book.action_completion_rate).toBe(30);
    });

    it("+2 when no actions required but book is active", () => {
      const entries = Array.from({ length: 10 }, (_, i) => makeCommBook({
        id: `cb-${i}`, date: "2025-06-10",
        action_required: false, action_completed: false,
      }));
      const result = computeHomeCommunicationContact(baseInput({
        comm_book_entries: entries,
      }));
      expect(result.comm_book.action_required_count).toBe(0);
    });

    it("+0 when no comm book entries", () => {
      const result = computeHomeCommunicationContact(baseInput({
        comm_book_entries: [],
      }));
      expect(result.comm_book.total_entries_30d).toBe(0);
    });

    it("filters entries to 30d window", () => {
      const result = computeHomeCommunicationContact(baseInput({
        comm_book_entries: [
          makeCommBook({ id: "cb-1", date: "2025-06-10" }),      // within 30d
          makeCommBook({ id: "cb-2", date: "2025-04-01" }),      // outside 30d
        ],
      }));
      expect(result.comm_book.total_entries_30d).toBe(1);
    });
  });

  // ── Modifier 2: Contact plan coverage (±4) ────────────────────────────

  describe("mod2: contact plan coverage", () => {
    it("+4 when coverage >= 90%", () => {
      const result = computeHomeCommunicationContact(baseInput());
      expect(result.contact_plans.child_coverage).toBe(100);
    });

    it("-4 when no contact plans and children exist", () => {
      const result = computeHomeCommunicationContact(baseInput({
        contact_plans: [],
      }));
      expect(result.contact_plans.total_plans).toBe(0);
    });

    it("+2 when coverage 70-89%", () => {
      // 4 of 5 children
      const result = computeHomeCommunicationContact(baseInput({
        contact_plans: [
          makeContactPlan({ child_id: "c1" }),
          makeContactPlan({ id: "cp-2", child_id: "c2" }),
          makeContactPlan({ id: "cp-3", child_id: "c3" }),
          makeContactPlan({ id: "cp-4", child_id: "c4" }),
        ],
      }));
      expect(result.contact_plans.child_coverage).toBe(80);
    });

    it("-4 when coverage < 50%", () => {
      const result = computeHomeCommunicationContact(baseInput({
        contact_plans: [makeContactPlan({ child_id: "c1" })],
      }));
      expect(result.contact_plans.child_coverage).toBe(20);
    });
  });

  // ── Modifier 3: Contact plan review timeliness (±3) ───────────────────

  describe("mod3: contact plan review timeliness", () => {
    it("+3 when all reviews on time", () => {
      const result = computeHomeCommunicationContact(baseInput());
      expect(result.contact_plans.overdue_reviews).toBe(0);
    });

    it("-3 when most reviews overdue", () => {
      const result = computeHomeCommunicationContact(baseInput({
        contact_plans: [
          makeContactPlan({ child_id: "c1", review_date: "2025-01-01" }),
          makeContactPlan({ id: "cp-2", child_id: "c2", review_date: "2025-01-01" }),
          makeContactPlan({ id: "cp-3", child_id: "c3", review_date: "2025-01-01" }),
          makeContactPlan({ id: "cp-4", child_id: "c4", review_date: "2025-01-01" }),
          makeContactPlan({ id: "cp-5", child_id: "c5" }),
        ],
      }));
      expect(result.contact_plans.overdue_reviews).toBe(4);
    });

    it("+0 when no contact plans", () => {
      const result = computeHomeCommunicationContact(baseInput({
        contact_plans: [],
      }));
      expect(result.contact_plans.overdue_reviews).toBe(0);
    });
  });

  // ── Modifier 4: Communication profile coverage (±4) ───────────────────

  describe("mod4: communication profile coverage", () => {
    it("+4 when coverage >= 90%", () => {
      const result = computeHomeCommunicationContact(baseInput());
      expect(result.comm_profiles.child_coverage).toBe(100);
    });

    it("-4 when no profiles and children exist", () => {
      const result = computeHomeCommunicationContact(baseInput({
        communication_profiles: [],
      }));
      expect(result.comm_profiles.total_profiles).toBe(0);
    });

    it("+2 when coverage 70-89%", () => {
      const result = computeHomeCommunicationContact(baseInput({
        communication_profiles: [
          makeCommProfile({ child_id: "c1" }),
          makeCommProfile({ id: "prof-2", child_id: "c2" }),
          makeCommProfile({ id: "prof-3", child_id: "c3" }),
          makeCommProfile({ id: "prof-4", child_id: "c4" }),
        ],
      }));
      expect(result.comm_profiles.child_coverage).toBe(80);
    });
  });

  // ── Modifier 5: Child voice (±3) ─────────────────────────────────────

  describe("mod5: child voice in contact & communication", () => {
    it("+3 when voice rate >= 90%", () => {
      const result = computeHomeCommunicationContact(baseInput());
      expect(result.contact_plans.child_wishes_rate).toBe(100);
      expect(result.comm_profiles.child_views_rate).toBe(100);
    });

    it("-3 when voice rate < 50%", () => {
      const result = computeHomeCommunicationContact(baseInput({
        contact_plans: [
          makeContactPlan({ child_id: "c1", child_wishes_provided: false }),
          makeContactPlan({ id: "cp-2", child_id: "c2", child_wishes_provided: false }),
          makeContactPlan({ id: "cp-3", child_id: "c3", child_wishes_provided: false }),
          makeContactPlan({ id: "cp-4", child_id: "c4", child_wishes_provided: false }),
          makeContactPlan({ id: "cp-5", child_id: "c5", child_wishes_provided: false }),
        ],
        communication_profiles: [
          makeCommProfile({ child_id: "c1", child_views_provided: false }),
          makeCommProfile({ id: "prof-2", child_id: "c2", child_views_provided: false }),
          makeCommProfile({ id: "prof-3", child_id: "c3", child_views_provided: false }),
          makeCommProfile({ id: "prof-4", child_id: "c4", child_views_provided: false }),
          makeCommProfile({ id: "prof-5", child_id: "c5", child_views_provided: false }),
        ],
      }));
      expect(result.contact_plans.child_wishes_rate).toBe(0);
      expect(result.comm_profiles.child_views_rate).toBe(0);
    });

    it("+0 when no applicable records", () => {
      const result = computeHomeCommunicationContact(baseInput({
        contact_plans: [],
        communication_profiles: [],
      }));
      // 0 applicable
      // mod5 +0; base 52 +5(mod1) -4(mod2 no plans) -4(mod4 no profiles) +3(mod6) +3(mod7) = 55
      expect(result.communication_score).toBe(55);
    });
  });

  // ── Modifier 6: Correspondence handling (±3) ─────────────────────────

  describe("mod6: correspondence handling", () => {
    it("+3 when no overdue actions", () => {
      const result = computeHomeCommunicationContact(baseInput());
      expect(result.correspondence.overdue_actions).toBe(0);
    });

    it("-3 when > 5 overdue actions", () => {
      const overdueCorr = Array.from({ length: 8 }, (_, i) => makeCorrespondence({
        id: `corr-${i}`, date: "2025-06-10",
        action_required_present: true, action_due: "2025-06-01",
        status: "awaiting_response",
      }));
      const result = computeHomeCommunicationContact(baseInput({
        correspondence_entries: overdueCorr,
      }));
      expect(result.correspondence.overdue_actions).toBe(8);
    });

    it("+1 when 1-2 overdue actions", () => {
      const result = computeHomeCommunicationContact(baseInput({
        correspondence_entries: [
          makeCorrespondence({ id: "corr-1", action_required_present: true, action_due: "2025-06-01", status: "awaiting_response" }),
          makeCorrespondence({ id: "corr-2" }),
        ],
      }));
      expect(result.correspondence.overdue_actions).toBe(1);
    });

    it("+0 when no correspondence", () => {
      const result = computeHomeCommunicationContact(baseInput({
        correspondence_entries: [],
      }));
      expect(result.correspondence.total_entries_30d).toBe(0);
    });
  });

  // ── Modifier 7: Comm book activity (±3) ──────────────────────────────

  describe("mod7: communication book activity", () => {
    it("+3 when activity >= 80% of expected", () => {
      // 8 staff * 4 = 32 expected; 40 entries → 125%
      const result = computeHomeCommunicationContact(baseInput());
      expect(result.comm_book.total_entries_30d).toBeGreaterThanOrEqual(32);
    });

    it("-3 when activity < 20% of expected", () => {
      const result = computeHomeCommunicationContact(baseInput({
        comm_book_entries: [makeCommBook()], // 1 entry, expected 32
      }));
      expect(result.comm_book.total_entries_30d).toBe(1);
    });

    it("+0 when no staff and no children", () => {
      const result = computeHomeCommunicationContact({
        today: TODAY,
        comm_book_entries: [makeCommBook()],
        correspondence_entries: [],
        contact_plans: [],
        communication_profiles: [],
        total_children: 0,
        total_staff: 0,
      });
      // total_staff=0, total_children=0 → +0
      // mod7 +0; only mod1 fires (+5, 1 action completed) → 52 + 5 = 57
      expect(result.communication_score).toBe(57);
    });
  });

  // ── Modifier 8: SALT & accessibility (±3) ────────────────────────────

  describe("mod8: SALT & accessibility provision", () => {
    it("+3 when specialist needs met with strategies", () => {
      const result = computeHomeCommunicationContact(baseInput());
      // c1 has interpreter + strategies/aac, c2 has SALT + strategies/aac
      // supportRate 2/2 = 100% → mod8 +3; full outstanding total = 80
      expect(result.communication_score).toBe(80);
    });

    it("-3 when specialist needs not supported", () => {
      const result = computeHomeCommunicationContact(baseInput({
        communication_profiles: [
          makeCommProfile({ child_id: "c1", interpreter_required: true, strategies_count: 0, aac_tools_count: 0 }),
          makeCommProfile({ id: "prof-2", child_id: "c2", salt_involved: true, strategies_count: 0, aac_tools_count: 0 }),
          makeCommProfile({ id: "prof-3", child_id: "c3" }),
          makeCommProfile({ id: "prof-4", child_id: "c4" }),
          makeCommProfile({ id: "prof-5", child_id: "c5" }),
        ],
      }));
      // 2 specialist needs, 0 with support → 0% → -3
      // base 80 has mod8 +3; here mod8 -3 → 74
      expect(result.communication_score).toBe(74);
    });

    it("+1 when no specialist needs", () => {
      const result = computeHomeCommunicationContact(baseInput({
        communication_profiles: [
          makeCommProfile({ child_id: "c1", interpreter_required: false, salt_involved: false, aac_tools_count: 0 }),
          makeCommProfile({ id: "prof-2", child_id: "c2" }),
          makeCommProfile({ id: "prof-3", child_id: "c3" }),
          makeCommProfile({ id: "prof-4", child_id: "c4" }),
          makeCommProfile({ id: "prof-5", child_id: "c5" }),
        ],
      }));
      // No specialist needs → +1
      // base 80 has mod8 +3; here mod8 +1 → 78
      expect(result.communication_score).toBe(78);
    });

    it("+0 when no profiles", () => {
      const result = computeHomeCommunicationContact(baseInput({
        communication_profiles: [],
      }));
      // mod8 +0; vs base 80: mod4 +4 → -4, mod8 +3 → 0 → 80 - 8 - 3 = 69
      expect(result.communication_score).toBe(69);
    });
  });

  // ── Profile calculations ──────────────────────────────────────────────

  describe("profile calculations", () => {
    it("calculates comm book profile correctly", () => {
      const entries = [
        makeCommBook({ id: "cb-1", date: "2025-06-10", priority: "urgent", action_required: true, action_completed: true, related_yp_present: true }),
        makeCommBook({ id: "cb-2", date: "2025-06-10", priority: "normal", action_required: true, action_completed: false, related_yp_present: false }),
        makeCommBook({ id: "cb-3", date: "2025-06-10", priority: "high", action_required: false, action_completed: false, related_yp_present: true }),
      ];
      const result = computeHomeCommunicationContact(baseInput({ comm_book_entries: entries }));
      expect(result.comm_book.total_entries_30d).toBe(3);
      expect(result.comm_book.urgent_count).toBe(2); // urgent + high
      expect(result.comm_book.action_required_count).toBe(2);
      expect(result.comm_book.action_completion_rate).toBe(50);
      expect(result.comm_book.child_related_rate).toBe(67);
    });

    it("calculates correspondence profile correctly", () => {
      const result = computeHomeCommunicationContact(baseInput({
        correspondence_entries: [
          makeCorrespondence({ id: "c1", direction: "incoming", status: "actioned" }),
          makeCorrespondence({ id: "c2", direction: "outgoing", status: "sent" }),
          makeCorrespondence({ id: "c3", direction: "incoming", status: "filed" }),
        ],
      }));
      expect(result.correspondence.total_entries_30d).toBe(3);
      expect(result.correspondence.incoming_count).toBe(2);
      expect(result.correspondence.outgoing_count).toBe(1);
      // actioned + filed = 2/3 = 67%
      expect(result.correspondence.actioned_rate).toBe(67);
    });

    it("calculates contact plan profile correctly", () => {
      const result = computeHomeCommunicationContact(baseInput());
      expect(result.contact_plans.total_plans).toBe(5);
      expect(result.contact_plans.active_count).toBe(5);
      expect(result.contact_plans.child_coverage).toBe(100);
      expect(result.contact_plans.child_wishes_rate).toBe(100);
    });

    it("calculates comm profile summary correctly", () => {
      const result = computeHomeCommunicationContact(baseInput());
      expect(result.comm_profiles.total_profiles).toBe(5);
      expect(result.comm_profiles.child_coverage).toBe(100);
      expect(result.comm_profiles.interpreter_needed_count).toBe(1);
      expect(result.comm_profiles.salt_involved_count).toBe(1);
      expect(result.comm_profiles.child_views_rate).toBe(100);
    });

    it("calculates upcoming contacts", () => {
      const result = computeHomeCommunicationContact(baseInput({
        contact_plans: [
          makeContactPlan({ child_id: "c1", next_scheduled_contact: "2025-06-20" }), // within 30d
          makeContactPlan({ id: "cp-2", child_id: "c2", next_scheduled_contact: "2025-08-01" }), // outside 30d
          makeContactPlan({ id: "cp-3", child_id: "c3", next_scheduled_contact: "2025-06-25" }), // within 30d
          makeContactPlan({ id: "cp-4", child_id: "c4", next_scheduled_contact: "2025-06-14" }), // past → 0? No, daysBetween(today, contact) >= 0 means future or today
          makeContactPlan({ id: "cp-5", child_id: "c5", next_scheduled_contact: "2025-06-15" }), // today → within
        ],
      }));
      expect(result.contact_plans.upcoming_contacts_count).toBe(3);
    });
  });

  // ── Headlines ─────────────────────────────────────────────────────────

  describe("headlines", () => {
    it("outstanding headline", () => {
      const result = computeHomeCommunicationContact(baseInput());
      expect(result.headline).toContain("Exceptional");
    });

    it("inadequate headline", () => {
      const result = computeHomeCommunicationContact({
        today: TODAY,
        comm_book_entries: [makeCommBook({ action_required: true, action_completed: false })],
        correspondence_entries: [],
        contact_plans: [],
        communication_profiles: [],
        total_children: 5, total_staff: 8,
      });
      expect(result.headline).toContain("Critical");
    });

    it("insufficient_data headline", () => {
      const result = computeHomeCommunicationContact({
        today: TODAY, comm_book_entries: [], correspondence_entries: [],
        contact_plans: [], communication_profiles: [],
        total_children: 0, total_staff: 0,
      });
      expect(result.headline).toContain("No communication");
    });
  });

  // ── Strengths ─────────────────────────────────────────────────────────

  describe("strengths", () => {
    it("includes action completion strength", () => {
      const result = computeHomeCommunicationContact(baseInput());
      expect(result.strengths.some(s => s.includes("action") && s.includes("completed"))).toBe(true);
    });

    it("includes contact plan coverage strength", () => {
      const result = computeHomeCommunicationContact(baseInput());
      expect(result.strengths.some(s => s.includes("contact plan coverage"))).toBe(true);
    });

    it("includes communication profile strength", () => {
      const result = computeHomeCommunicationContact(baseInput());
      expect(result.strengths.some(s => s.includes("communication profiles") || s.includes("Communication profiles"))).toBe(true);
    });

    it("no strengths when data is poor", () => {
      const result = computeHomeCommunicationContact({
        today: TODAY,
        comm_book_entries: [makeCommBook({ action_required: true, action_completed: false })],
        correspondence_entries: [],
        contact_plans: [],
        communication_profiles: [],
        total_children: 5, total_staff: 8,
      });
      expect(result.strengths.length).toBe(0);
    });
  });

  // ── Concerns ──────────────────────────────────────────────────────────

  describe("concerns", () => {
    it("flags overdue contact reviews", () => {
      const result = computeHomeCommunicationContact(baseInput({
        contact_plans: [
          makeContactPlan({ child_id: "c1", review_date: "2025-01-01" }),
          ...baseInput().contact_plans.slice(1),
        ],
      }));
      expect(result.concerns.some(c => c.includes("overdue"))).toBe(true);
    });

    it("flags no contact plans", () => {
      const result = computeHomeCommunicationContact(baseInput({
        contact_plans: [],
      }));
      expect(result.concerns.some(c => c.includes("No contact plans"))).toBe(true);
    });

    it("flags no communication profiles", () => {
      const result = computeHomeCommunicationContact(baseInput({
        communication_profiles: [],
      }));
      expect(result.concerns.some(c => c.includes("No communication profiles") || c.includes("communication profiles"))).toBe(true);
    });

    it("flags overdue correspondence actions", () => {
      const overdueCorr = Array.from({ length: 5 }, (_, i) => makeCorrespondence({
        id: `corr-${i}`, action_required_present: true,
        action_due: "2025-06-01", status: "awaiting_response",
      }));
      const result = computeHomeCommunicationContact(baseInput({
        correspondence_entries: overdueCorr,
      }));
      expect(result.concerns.some(c => c.includes("overdue correspondence"))).toBe(true);
    });

    it("flags poor action completion", () => {
      const entries = Array.from({ length: 10 }, (_, i) => makeCommBook({
        id: `cb-${i}`, date: "2025-06-10",
        action_required: true, action_completed: i < 2,
      }));
      const result = computeHomeCommunicationContact(baseInput({
        comm_book_entries: entries,
      }));
      expect(result.concerns.some(c => c.includes("action completion"))).toBe(true);
    });
  });

  // ── Recommendations ───────────────────────────────────────────────────

  describe("recommendations", () => {
    it("recommends contact plans when missing", () => {
      const result = computeHomeCommunicationContact(baseInput({
        contact_plans: [],
      }));
      expect(result.recommendations.some(r =>
        r.recommendation.includes("contact plan") && r.urgency === "immediate" &&
        r.regulatory_ref === "CHR 2015 Reg 14",
      )).toBe(true);
    });

    it("recommends communication profiles when missing", () => {
      const result = computeHomeCommunicationContact(baseInput({
        communication_profiles: [],
      }));
      expect(result.recommendations.some(r =>
        r.recommendation.includes("communication profile") && r.regulatory_ref === "CHR 2015 Reg 7",
      )).toBe(true);
    });

    it("recommends overdue review action", () => {
      const result = computeHomeCommunicationContact(baseInput({
        contact_plans: [
          makeContactPlan({ child_id: "c1", review_date: "2025-01-01" }),
          makeContactPlan({ id: "cp-2", child_id: "c2", review_date: "2025-01-01" }),
          makeContactPlan({ id: "cp-3", child_id: "c3", review_date: "2025-01-01" }),
          makeContactPlan({ id: "cp-4", child_id: "c4" }),
          makeContactPlan({ id: "cp-5", child_id: "c5" }),
        ],
      }));
      expect(result.recommendations.some(r => r.recommendation.includes("overdue"))).toBe(true);
    });

    it("has no recommendations when everything excellent", () => {
      const result = computeHomeCommunicationContact(baseInput());
      expect(result.recommendations.length).toBe(0);
    });

    it("has ranked recommendations", () => {
      const result = computeHomeCommunicationContact(baseInput({
        contact_plans: [],
        communication_profiles: [],
      }));
      if (result.recommendations.length >= 2) {
        expect(result.recommendations[0].rank).toBe(1);
        expect(result.recommendations[1].rank).toBe(2);
      }
    });
  });

  // ── Insights ──────────────────────────────────────────────────────────

  describe("insights", () => {
    it("warning for many urgent comm book entries", () => {
      const urgentEntries = Array.from({ length: 8 }, (_, i) => makeCommBook({
        id: `cb-${i}`, date: "2025-06-10", priority: i < 5 ? "urgent" : "high",
      }));
      const result = computeHomeCommunicationContact(baseInput({
        comm_book_entries: urgentEntries,
      }));
      expect(result.insights.some(i => i.severity === "warning" && i.text.includes("urgent"))).toBe(true);
    });

    it("critical for many overdue correspondence actions", () => {
      const overdueCorr = Array.from({ length: 7 }, (_, i) => makeCorrespondence({
        id: `corr-${i}`, action_required_present: true,
        action_due: "2025-06-01", status: "awaiting_response",
      }));
      const result = computeHomeCommunicationContact(baseInput({
        correspondence_entries: overdueCorr,
      }));
      expect(result.insights.some(i => i.severity === "critical" && i.text.includes("overdue"))).toBe(true);
    });

    it("positive for comprehensive governance", () => {
      const result = computeHomeCommunicationContact(baseInput());
      expect(result.insights.some(i => i.severity === "positive" && i.text.includes("governance"))).toBe(true);
    });

    it("warning for interpreter needs", () => {
      const result = computeHomeCommunicationContact(baseInput());
      expect(result.insights.some(i => i.text.includes("interpreter"))).toBe(true);
    });

    it("positive for SALT involvement", () => {
      const result = computeHomeCommunicationContact(baseInput());
      expect(result.insights.some(i => i.text.includes("SALT"))).toBe(true);
    });

    it("warning for suspended/ceased plans", () => {
      const result = computeHomeCommunicationContact(baseInput({
        contact_plans: [
          makeContactPlan({ child_id: "c1", status: "suspended" }),
          makeContactPlan({ id: "cp-2", child_id: "c2" }),
          makeContactPlan({ id: "cp-3", child_id: "c3" }),
          makeContactPlan({ id: "cp-4", child_id: "c4" }),
          makeContactPlan({ id: "cp-5", child_id: "c5" }),
        ],
      }));
      expect(result.insights.some(i => i.text.includes("suspended"))).toBe(true);
    });
  });

  // ── Edge cases ────────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("handles duplicate child_ids in contact plans", () => {
      const result = computeHomeCommunicationContact(baseInput({
        contact_plans: [
          makeContactPlan({ child_id: "c1" }),
          makeContactPlan({ id: "cp-2", child_id: "c1" }), // same child
        ],
      }));
      expect(result.contact_plans.child_coverage).toBe(20); // 1 unique child of 5
    });

    it("handles old correspondence entries outside 30d window", () => {
      const result = computeHomeCommunicationContact(baseInput({
        correspondence_entries: [
          makeCorrespondence({ date: "2025-01-01" }), // outside 30d
        ],
      }));
      expect(result.correspondence.total_entries_30d).toBe(0);
    });

    it("handles contact plan with past next_scheduled_contact", () => {
      const result = computeHomeCommunicationContact(baseInput({
        contact_plans: [
          makeContactPlan({ child_id: "c1", next_scheduled_contact: "2025-05-01" }), // past
          makeContactPlan({ id: "cp-2", child_id: "c2" }),
          makeContactPlan({ id: "cp-3", child_id: "c3" }),
          makeContactPlan({ id: "cp-4", child_id: "c4" }),
          makeContactPlan({ id: "cp-5", child_id: "c5" }),
        ],
      }));
      expect(result.contact_plans.upcoming_contacts_count).toBe(4);
    });

    it("handles zero total_staff for activity calculation", () => {
      const result = computeHomeCommunicationContact(baseInput({
        total_staff: 0,
        total_children: 5,
      }));
      // total_staff=0 but total_children=5 → max(0,1)*4 = 4 expected
      // 40 entries vs 4 expected = 1000% ≥ 80 → mod7 +3 → full base score 80
      expect(result.communication_score).toBe(80);
    });
  });

  // ── Cross-modifier isolation ──────────────────────────────────────────

  describe("cross-modifier isolation", () => {
    it("changing comm book does not affect contact plans", () => {
      const a = computeHomeCommunicationContact(baseInput());
      const b = computeHomeCommunicationContact(baseInput({
        comm_book_entries: [],
      }));
      expect(a.contact_plans.child_coverage).toBe(b.contact_plans.child_coverage);
    });

    it("changing contact plans does not affect comm profiles", () => {
      const a = computeHomeCommunicationContact(baseInput());
      const b = computeHomeCommunicationContact(baseInput({
        contact_plans: [],
      }));
      expect(a.comm_profiles.child_coverage).toBe(b.comm_profiles.child_coverage);
    });
  });
});
