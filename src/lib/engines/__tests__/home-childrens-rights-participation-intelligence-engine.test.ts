// ══════════════════════════════════════════════════════════════════════════════
// TESTS — HOME CHILDREN'S RIGHTS & PARTICIPATION INTELLIGENCE ENGINE
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeHomeChildrensRightsParticipation,
  type HomeChildrensRightsInput,
  type ChildrensRightInput,
  type ChildLedMeetingInput,
  type FeedbackLoopInput,
  type PledgeInput,
  type ParticipationInput,
  type AdvocacyInput,
} from "../home-childrens-rights-participation-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2025-06-15";

function makeRight(overrides: Partial<ChildrensRightInput> = {}): ChildrensRightInput {
  return {
    id: "r-1",
    compliance_level: "fully_met",
    evidence_count: 3,
    child_feedback_provided: true,
    action_needed_present: false,
    ...overrides,
  };
}

function makeMeeting(overrides: Partial<ChildLedMeetingInput> = {}): ChildLedMeetingInput {
  return {
    id: "m-1",
    child_id: "c1",
    date: "2025-05-20",
    decisions_reached_count: 3,
    child_agenda_count: 3,
    proud_moments_count: 2,
    visible_change_provided: true,
    ...overrides,
  };
}

function makeFeedbackLoop(overrides: Partial<FeedbackLoopInput> = {}): FeedbackLoopInput {
  return {
    id: "fl-1",
    child_id: "c1",
    feedback_date: "2025-05-25",
    decision_made: "accepted",
    child_accepts: true,
    duration_days_to_close: 7,
    actions_taken_count: 2,
    visible_change_provided: true,
    ...overrides,
  };
}

function makePledge(overrides: Partial<PledgeInput> = {}): PledgeInput {
  return {
    id: "p-1",
    child_id: "c1",
    status: "met",
    evidence_of_delivery_count: 3,
    last_review_date: "2025-05-01",
    child_feedback_provided: true,
    ...overrides,
  };
}

function makeParticipation(overrides: Partial<ParticipationInput> = {}): ParticipationInput {
  return {
    id: "part-1",
    date: "2025-05-20",
    children_involved_count: 3,
    child_influenced: true,
    feedback_given_provided: true,
    ...overrides,
  };
}

function makeAdvocacy(overrides: Partial<AdvocacyInput> = {}): AdvocacyInput {
  return {
    id: "adv-1",
    child_id: "c1",
    status: "active",
    visits_count: 3,
    review_date: "2025-12-01",
    child_view_provided: true,
    ...overrides,
  };
}

/**
 * Base input: outstanding scenario — scores EXACTLY 80.
 * 5 children.
 * Score calculation:
 * Base 52
 * mod1 (rights compliance): 10 rights, all fully_met → 100% → +5
 * mod2 (feedback responsiveness): 6 loops, all child_accepts, avg 7d → +4
 * mod3 (child-led meetings): 6 meetings, avg 3 decisions, avg 3 child agenda → +3
 * mod4 (pledge delivery): 5 pledges, 3 met + 2 active = 100%, avg evidence 3 → +4
 * mod5 (participation influence): 5 entries, all influenced = 100% → +3
 * mod6 (advocacy access): 3 records, 3/5 children = 60%, avg 3 visits → +3
 * mod7 (child voice diversity): 6/6 domains → +3
 * mod8 (feedback closure time): avg 7 days → +3
 * Total: 52 + 5 + 4 + 3 + 4 + 3 + 3 + 3 + 3 = 80
 */
function baseInput(overrides: Partial<HomeChildrensRightsInput> = {}): HomeChildrensRightsInput {
  return {
    today: TODAY,
    rights_entries: Array.from({ length: 10 }, (_, i) =>
      makeRight({ id: `r-${i + 1}` }),
    ),
    child_led_meetings: [
      makeMeeting({ id: "m-1", child_id: "c1", date: "2025-05-10" }),
      makeMeeting({ id: "m-2", child_id: "c2", date: "2025-05-15" }),
      makeMeeting({ id: "m-3", child_id: "c3", date: "2025-05-20" }),
      makeMeeting({ id: "m-4", child_id: "c1", date: "2025-05-25" }),
      makeMeeting({ id: "m-5", child_id: "c2", date: "2025-06-01" }),
      makeMeeting({ id: "m-6", child_id: "c4", date: "2025-06-05" }),
    ],
    feedback_loops: [
      makeFeedbackLoop({ id: "fl-1", child_id: "c1" }),
      makeFeedbackLoop({ id: "fl-2", child_id: "c2" }),
      makeFeedbackLoop({ id: "fl-3", child_id: "c3" }),
      makeFeedbackLoop({ id: "fl-4", child_id: "c4" }),
      makeFeedbackLoop({ id: "fl-5", child_id: "c5" }),
      makeFeedbackLoop({ id: "fl-6", child_id: "c1", feedback_date: "2025-06-01" }),
    ],
    pledges: [
      makePledge({ id: "p-1", child_id: "c1", status: "met" }),
      makePledge({ id: "p-2", child_id: "c2", status: "met" }),
      makePledge({ id: "p-3", child_id: "c3", status: "met" }),
      makePledge({ id: "p-4", child_id: "c4", status: "active" }),
      makePledge({ id: "p-5", child_id: "c5", status: "active" }),
    ],
    participation_entries: [
      makeParticipation({ id: "part-1", date: "2025-05-10" }),
      makeParticipation({ id: "part-2", date: "2025-05-15" }),
      makeParticipation({ id: "part-3", date: "2025-05-20" }),
      makeParticipation({ id: "part-4", date: "2025-06-01" }),
      makeParticipation({ id: "part-5", date: "2025-06-05" }),
    ],
    advocacy_records: [
      makeAdvocacy({ id: "adv-1", child_id: "c1" }),
      makeAdvocacy({ id: "adv-2", child_id: "c2" }),
      makeAdvocacy({ id: "adv-3", child_id: "c3" }),
    ],
    total_children: 5,
    ...overrides,
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Home Children's Rights & Participation Intelligence Engine", () => {

  // ── Insufficient data ──────────────────────────────────────────────────

  describe("insufficient data", () => {
    it("returns insufficient_data when all empty and no children", () => {
      const result = computeHomeChildrensRightsParticipation({
        today: TODAY, rights_entries: [], child_led_meetings: [],
        feedback_loops: [], pledges: [], participation_entries: [],
        advocacy_records: [], total_children: 0,
      });
      expect(result.rights_rating).toBe("insufficient_data");
      expect(result.rights_score).toBe(0);
    });

    it("has concern when insufficient_data", () => {
      const result = computeHomeChildrensRightsParticipation({
        today: TODAY, rights_entries: [], child_led_meetings: [],
        feedback_loops: [], pledges: [], participation_entries: [],
        advocacy_records: [], total_children: 0,
      });
      expect(result.concerns.length).toBeGreaterThan(0);
    });

    it("does NOT return insufficient_data when children exist", () => {
      const result = computeHomeChildrensRightsParticipation({
        today: TODAY, rights_entries: [], child_led_meetings: [],
        feedback_loops: [], pledges: [], participation_entries: [],
        advocacy_records: [], total_children: 3,
      });
      expect(result.rights_rating).not.toBe("insufficient_data");
    });

    it("does NOT return insufficient_data when rights data exists", () => {
      const result = computeHomeChildrensRightsParticipation({
        today: TODAY, rights_entries: [makeRight()], child_led_meetings: [],
        feedback_loops: [], pledges: [], participation_entries: [],
        advocacy_records: [], total_children: 0,
      });
      expect(result.rights_rating).not.toBe("insufficient_data");
    });

    it("does NOT return insufficient_data when meetings exist", () => {
      const result = computeHomeChildrensRightsParticipation({
        today: TODAY, rights_entries: [], child_led_meetings: [makeMeeting()],
        feedback_loops: [], pledges: [], participation_entries: [],
        advocacy_records: [], total_children: 0,
      });
      expect(result.rights_rating).not.toBe("insufficient_data");
    });

    it("does NOT return insufficient_data when feedback loops exist", () => {
      const result = computeHomeChildrensRightsParticipation({
        today: TODAY, rights_entries: [], child_led_meetings: [],
        feedback_loops: [makeFeedbackLoop()], pledges: [], participation_entries: [],
        advocacy_records: [], total_children: 0,
      });
      expect(result.rights_rating).not.toBe("insufficient_data");
    });

    it("does NOT return insufficient_data when pledges exist", () => {
      const result = computeHomeChildrensRightsParticipation({
        today: TODAY, rights_entries: [], child_led_meetings: [],
        feedback_loops: [], pledges: [makePledge()], participation_entries: [],
        advocacy_records: [], total_children: 0,
      });
      expect(result.rights_rating).not.toBe("insufficient_data");
    });

    it("does NOT return insufficient_data when participation entries exist", () => {
      const result = computeHomeChildrensRightsParticipation({
        today: TODAY, rights_entries: [], child_led_meetings: [],
        feedback_loops: [], pledges: [], participation_entries: [makeParticipation()],
        advocacy_records: [], total_children: 0,
      });
      expect(result.rights_rating).not.toBe("insufficient_data");
    });

    it("does NOT return insufficient_data when advocacy exists", () => {
      const result = computeHomeChildrensRightsParticipation({
        today: TODAY, rights_entries: [], child_led_meetings: [],
        feedback_loops: [], pledges: [], participation_entries: [],
        advocacy_records: [makeAdvocacy()], total_children: 0,
      });
      expect(result.rights_rating).not.toBe("insufficient_data");
    });

    it("returns empty arrays for strengths, recommendations, insights on insufficient_data", () => {
      const result = computeHomeChildrensRightsParticipation({
        today: TODAY, rights_entries: [], child_led_meetings: [],
        feedback_loops: [], pledges: [], participation_entries: [],
        advocacy_records: [], total_children: 0,
      });
      expect(result.strengths).toEqual([]);
      expect(result.recommendations).toEqual([]);
      expect(result.insights).toEqual([]);
    });
  });

  // ── Rating thresholds ─────────────────────────────────────────────────

  describe("rating thresholds", () => {
    it("rates outstanding for score >= 80", () => {
      const result = computeHomeChildrensRightsParticipation(baseInput());
      expect(result.rights_score).toBeGreaterThanOrEqual(80);
      expect(result.rights_rating).toBe("outstanding");
    });

    it("rates good for score 65-79", () => {
      // Weaken: remove meetings (mod3 → +0), weaken voice domains (mod7 drops)
      // Remove participation (mod5 → +0), reduce advocacy (mod6 → +0 or less)
      // mod1: +5, mod2: +4, mod3: 0, mod4: +4, mod5: 0, mod6: 0, mod7: voice domains
      // Voice domains without meetings & participation: rights(yes), loops(yes), pledges(yes), advocacy(yes) = 4 → +1
      // mod8: +3
      // Score: 52 + 5 + 4 + 0 + 4 + 0 + 0 + 1 + 3 = 69
      const result = computeHomeChildrensRightsParticipation(baseInput({
        child_led_meetings: [],
        participation_entries: [],
        advocacy_records: [makeAdvocacy({ id: "adv-1", child_id: "c1", visits_count: 1 })],
      }));
      expect(result.rights_score).toBeGreaterThanOrEqual(65);
      expect(result.rights_score).toBeLessThan(80);
      expect(result.rights_rating).toBe("good");
    });

    it("rates adequate for score 45-64", () => {
      // Minimal data: some rights partially met, no meetings, limited feedback
      // mod1: 50% fully met → +0
      // mod2: 1 loop, child accepts, 7d → +4
      // mod3: no meetings → +0
      // mod4: 1 pledge met → 100%, evidence 3 → +4
      // mod5: no participation → +0
      // mod6: no advocacy, children exist → -1
      // mod7: rights feedback rate 50%, loops(yes), pledge(yes) = 3 → +1
      // mod8: 1 loop, 7 days → +3
      // Score: 52 + 0 + 4 + 0 + 4 + 0 - 1 + 1 + 3 = 63
      // Need lower. Remove pledge too.
      // mod4: 0, mod7: rights(yes), loops(yes) = 2 → +0
      // Score: 52 + 0 + 4 + 0 + 0 + 0 - 1 + 0 + 3 = 58
      const result = computeHomeChildrensRightsParticipation({
        today: TODAY,
        rights_entries: [
          makeRight({ id: "r-1", compliance_level: "fully_met" }),
          makeRight({ id: "r-2", compliance_level: "partially_met" }),
        ],
        child_led_meetings: [],
        feedback_loops: [makeFeedbackLoop()],
        pledges: [],
        participation_entries: [],
        advocacy_records: [],
        total_children: 5,
      });
      expect(result.rights_score).toBeGreaterThanOrEqual(45);
      expect(result.rights_score).toBeLessThan(65);
      expect(result.rights_rating).toBe("adequate");
    });

    it("rates inadequate for score < 45", () => {
      // Worst case: not_met rights, no meetings, rejected feedback, no pledges, no participation, no advocacy
      // mod1: 0% fully met + not_met present → -5
      // mod2: 2 loops, child_accepts false, 45 days → -4
      // mod3: no meetings → +0
      // mod4: no pledges → +0
      // mod5: no participation → +0
      // mod6: no advocacy, children exist → -1
      // mod7: rights feedback(0%, no), loops accepts(0%, no) = 0 domains → -3
      // mod8: 2 loops, avg 45 → -3
      // Score: 52 - 5 - 4 + 0 + 0 + 0 - 1 - 3 - 3 = 36
      const result = computeHomeChildrensRightsParticipation({
        today: TODAY,
        rights_entries: [
          makeRight({ id: "r-1", compliance_level: "not_met", child_feedback_provided: false }),
          makeRight({ id: "r-2", compliance_level: "not_met", child_feedback_provided: false }),
        ],
        child_led_meetings: [],
        feedback_loops: [
          makeFeedbackLoop({ id: "fl-1", child_accepts: false, duration_days_to_close: 45, decision_made: "declined", visible_change_provided: false }),
          makeFeedbackLoop({ id: "fl-2", child_accepts: false, duration_days_to_close: 45, decision_made: "declined", visible_change_provided: false }),
        ],
        pledges: [],
        participation_entries: [],
        advocacy_records: [],
        total_children: 5,
      });
      expect(result.rights_score).toBeLessThan(45);
      expect(result.rights_rating).toBe("inadequate");
    });
  });

  // ── Score boundaries ──────────────────────────────────────────────────

  describe("score boundaries", () => {
    it("outstanding base score is exactly 80", () => {
      const result = computeHomeChildrensRightsParticipation(baseInput());
      expect(result.rights_score).toBe(80);
    });

    it("never exceeds 100", () => {
      const result = computeHomeChildrensRightsParticipation(baseInput());
      expect(result.rights_score).toBeLessThanOrEqual(100);
    });

    it("never goes below 0", () => {
      const result = computeHomeChildrensRightsParticipation({
        today: TODAY,
        rights_entries: Array.from({ length: 10 }, (_, i) =>
          makeRight({ id: `r-${i}`, compliance_level: "not_met", child_feedback_provided: false }),
        ),
        child_led_meetings: [makeMeeting({ decisions_reached_count: 0, child_agenda_count: 0, visible_change_provided: false })],
        feedback_loops: Array.from({ length: 5 }, (_, i) =>
          makeFeedbackLoop({ id: `fl-${i}`, child_accepts: false, duration_days_to_close: 60, decision_made: "declined", visible_change_provided: false }),
        ),
        pledges: Array.from({ length: 5 }, (_, i) =>
          makePledge({ id: `p-${i}`, status: "withdrawn", evidence_of_delivery_count: 0, child_feedback_provided: false }),
        ),
        participation_entries: Array.from({ length: 5 }, (_, i) =>
          makeParticipation({ id: `part-${i}`, child_influenced: false, feedback_given_provided: false }),
        ),
        advocacy_records: [makeAdvocacy({ visits_count: 0, child_view_provided: false })],
        total_children: 10,
      });
      expect(result.rights_score).toBeGreaterThanOrEqual(0);
    });
  });

  // ── Modifier 1: Rights compliance level (±5) ─────────────────────────

  describe("mod1: rights compliance level", () => {
    it("+5 when fully_met rate >= 90%", () => {
      const result = computeHomeChildrensRightsParticipation(baseInput());
      expect(result.rights_compliance.fully_met_rate).toBe(100);
      expect(result.rights_score).toBe(80);
    });

    it("+3 when fully_met rate 70-89%", () => {
      // 8/10 fully met = 80%, no not_met
      const rights = Array.from({ length: 10 }, (_, i) =>
        makeRight({
          id: `r-${i + 1}`,
          compliance_level: i < 8 ? "fully_met" : "partially_met",
        }),
      );
      const result = computeHomeChildrensRightsParticipation(baseInput({ rights_entries: rights }));
      expect(result.rights_compliance.fully_met_rate).toBe(80);
      // mod1 drops from +5 to +3 → score drops by 2
      expect(result.rights_score).toBe(78);
    });

    it("+0 when fully_met rate 50-69%", () => {
      const rights = Array.from({ length: 10 }, (_, i) =>
        makeRight({
          id: `r-${i + 1}`,
          compliance_level: i < 6 ? "fully_met" : "partially_met",
        }),
      );
      const result = computeHomeChildrensRightsParticipation(baseInput({ rights_entries: rights }));
      expect(result.rights_compliance.fully_met_rate).toBe(60);
      // mod1 drops from +5 to +0 → score drops by 5
      expect(result.rights_score).toBe(75);
    });

    it("-5 when fully_met rate < 50% and not_met present", () => {
      const rights = Array.from({ length: 10 }, (_, i) =>
        makeRight({
          id: `r-${i + 1}`,
          compliance_level: i < 3 ? "fully_met" : (i < 7 ? "partially_met" : "not_met"),
        }),
      );
      const result = computeHomeChildrensRightsParticipation(baseInput({ rights_entries: rights }));
      expect(result.rights_compliance.fully_met_rate).toBe(30);
      // mod1 drops from +5 to -5 → score drops by 10
      expect(result.rights_score).toBe(70);
    });

    it("-2 when fully_met rate < 50% but no not_met", () => {
      const rights = Array.from({ length: 10 }, (_, i) =>
        makeRight({
          id: `r-${i + 1}`,
          compliance_level: i < 4 ? "fully_met" : "partially_met",
        }),
      );
      const result = computeHomeChildrensRightsParticipation(baseInput({ rights_entries: rights }));
      expect(result.rights_compliance.fully_met_rate).toBe(40);
      // mod1 drops from +5 to -2 → score drops by 7
      expect(result.rights_score).toBe(73);
    });

    it("+0 when no rights entries", () => {
      const result = computeHomeChildrensRightsParticipation(baseInput({
        rights_entries: [],
      }));
      // mod1: 0, mod7 loses rights domain. Voice domains: meetings(yes), loops(yes), pledges(yes), participation(yes), advocacy(yes) = 5 → +3 still
      // Total: 52 + 0 + 4 + 3 + 4 + 3 + 3 + 3 + 3 = 75
      expect(result.rights_score).toBe(75);
    });
  });

  // ── Modifier 2: Feedback loop responsiveness (±4) ─────────────────────

  describe("mod2: feedback loop responsiveness", () => {
    it("+4 when child_accepts >= 85% and avg closure <= 14d", () => {
      const result = computeHomeChildrensRightsParticipation(baseInput());
      expect(result.feedback_loops.child_accepts_rate).toBe(100);
      expect(result.feedback_loops.avg_closure_days).toBe(7);
    });

    it("+2 when child_accepts 70-84% and avg closure <= 21d", () => {
      // 5/7 accepts = 71%, avg closure 14d
      const loops = Array.from({ length: 7 }, (_, i) =>
        makeFeedbackLoop({
          id: `fl-${i + 1}`,
          child_id: `c${(i % 5) + 1}`,
          child_accepts: i < 5,
          duration_days_to_close: 14,
        }),
      );
      const result = computeHomeChildrensRightsParticipation(baseInput({
        feedback_loops: loops,
      }));
      expect(result.feedback_loops.child_accepts_rate).toBe(71);
      // mod2 drops from +4 to +2, mod8: avg 14 → +1 (was +3)
      // mod7: loops childAcceptsRate 71% >= 50 → still counts
      // Score: 52 + 5 + 2 + 3 + 4 + 3 + 3 + 3 + 1 = 76
      expect(result.rights_score).toBe(76);
    });

    it("-4 when child_accepts < 50%", () => {
      const loops = Array.from({ length: 6 }, (_, i) =>
        makeFeedbackLoop({
          id: `fl-${i + 1}`,
          child_id: `c${(i % 5) + 1}`,
          child_accepts: i < 2, // 2/6 = 33%
          duration_days_to_close: 7,
        }),
      );
      const result = computeHomeChildrensRightsParticipation(baseInput({
        feedback_loops: loops,
      }));
      expect(result.feedback_loops.child_accepts_rate).toBe(33);
      // mod2: -4 (was +4), mod7: loops acceptRate 33% < 50 → loses domain, now 5 → +3 still
      // mod8: avg 7 → +3
      // Score: 52 + 5 - 4 + 3 + 4 + 3 + 3 + 3 + 3 = 72
      expect(result.rights_score).toBe(72);
    });

    it("+0 when no feedback loops", () => {
      const result = computeHomeChildrensRightsParticipation(baseInput({
        feedback_loops: [],
      }));
      // mod2: +0, mod7: loses loops domain → 5 domains → +3 still, mod8: +0
      // Score: 52 + 5 + 0 + 3 + 4 + 3 + 3 + 3 + 0 = 73
      expect(result.rights_score).toBe(73);
    });
  });

  // ── Modifier 3: Child-led meeting quality (±3) ────────────────────────

  describe("mod3: child-led meeting quality", () => {
    it("+3 when avg decisions >= 2 and avg child agenda >= 2", () => {
      const result = computeHomeChildrensRightsParticipation(baseInput());
      expect(result.child_led_meetings.avg_decisions).toBe(3);
      expect(result.child_led_meetings.avg_child_agenda).toBe(3);
    });

    it("+1 when avg decisions >= 1 and avg child agenda >= 1", () => {
      const meetings = Array.from({ length: 6 }, (_, i) =>
        makeMeeting({
          id: `m-${i + 1}`,
          child_id: `c${(i % 4) + 1}`,
          date: `2025-05-${String(10 + i).padStart(2, "0")}`,
          decisions_reached_count: 1,
          child_agenda_count: 1,
        }),
      );
      const result = computeHomeChildrensRightsParticipation(baseInput({
        child_led_meetings: meetings,
      }));
      expect(result.child_led_meetings.avg_decisions).toBe(1);
      expect(result.child_led_meetings.avg_child_agenda).toBe(1);
      // mod3: +1 (was +3 → drop 2)
      // Score: 52 + 5 + 4 + 1 + 4 + 3 + 3 + 3 + 3 = 78
      expect(result.rights_score).toBe(78);
    });

    it("-3 when avg decisions < 1 and avg child agenda < 1", () => {
      const meetings = [
        makeMeeting({ id: "m-1", decisions_reached_count: 0, child_agenda_count: 0, visible_change_provided: false }),
        makeMeeting({ id: "m-2", child_id: "c2", decisions_reached_count: 0, child_agenda_count: 0, visible_change_provided: false }),
      ];
      const result = computeHomeChildrensRightsParticipation(baseInput({
        child_led_meetings: meetings,
      }));
      expect(result.child_led_meetings.avg_decisions).toBe(0);
      expect(result.child_led_meetings.avg_child_agenda).toBe(0);
      // mod3: -3 (was +3 → drop 6)
      // mod7: meeting visible change rate 0% < 50 → loses domain → 5 → +3
      // Score: 52 + 5 + 4 - 3 + 4 + 3 + 3 + 3 + 3 = 74
      expect(result.rights_score).toBe(74);
    });

    it("+0 when no meetings", () => {
      const result = computeHomeChildrensRightsParticipation(baseInput({
        child_led_meetings: [],
      }));
      // mod3: +0 (was +3), mod7: loses meetings domain → 5 → +3
      // Score: 52 + 5 + 4 + 0 + 4 + 3 + 3 + 3 + 3 = 77
      expect(result.rights_score).toBe(77);
    });

    it("+0 when avg decisions >= 1 but child_agenda 0", () => {
      const meetings = [
        makeMeeting({ id: "m-1", decisions_reached_count: 2, child_agenda_count: 0, visible_change_provided: false }),
      ];
      const result = computeHomeChildrensRightsParticipation(baseInput({
        child_led_meetings: meetings,
      }));
      // avgDecisions 2, avgChildAgenda 0: decisions>=1 OR agenda>=1 → +0
      // mod7: meeting visible change 0% → loses domain → 5 → +3
      // Score: 52 + 5 + 4 + 0 + 4 + 3 + 3 + 3 + 3 = 77
      expect(result.rights_score).toBe(77);
    });

    it("filters meetings to 90d window", () => {
      const result = computeHomeChildrensRightsParticipation(baseInput({
        child_led_meetings: [
          makeMeeting({ id: "m-1", date: "2025-06-01" }),       // within 90d
          makeMeeting({ id: "m-2", date: "2025-01-01" }),       // outside 90d
        ],
      }));
      expect(result.child_led_meetings.total_meetings_90d).toBe(1);
    });
  });

  // ── Modifier 4: Pledge delivery (±4) ──────────────────────────────────

  describe("mod4: pledge delivery", () => {
    it("+4 when healthy rate >= 90% and avg evidence >= 2", () => {
      const result = computeHomeChildrensRightsParticipation(baseInput());
      // 3 met + 2 active out of 5 = 100%, avg evidence 3
      expect(result.pledges.met_rate).toBe(60);
      expect(result.pledges.avg_evidence).toBe(3);
    });

    it("+2 when healthy rate 70-89% and avg evidence >= 1", () => {
      // healthy: met(1) + active(2) = 3/5 = 60% → not >= 70, so check next
      // Actually 60 < 70 → +0. Need 4/5.
      const pledges2 = [
        makePledge({ id: "p-1", status: "met", evidence_of_delivery_count: 2 }),
        makePledge({ id: "p-2", status: "active", evidence_of_delivery_count: 1 }),
        makePledge({ id: "p-3", status: "active", evidence_of_delivery_count: 1 }),
        makePledge({ id: "p-4", status: "in_progress", evidence_of_delivery_count: 1 }),
        makePledge({ id: "p-5", status: "withdrawn", evidence_of_delivery_count: 0 }),
      ];
      // healthy: met(1) + active(2) + in_progress(1) = 4/5 = 80%, avg evidence 1
      const result = computeHomeChildrensRightsParticipation(baseInput({ pledges: pledges2 }));
      // mod4: +2 (was +4, drop 2)
      // Score: 52 + 5 + 4 + 3 + 2 + 3 + 3 + 3 + 3 = 78
      expect(result.rights_score).toBe(78);
    });

    it("-4 when healthy rate < 50%", () => {
      const pls = [
        makePledge({ id: "p-1", status: "withdrawn" }),
        makePledge({ id: "p-2", status: "withdrawn" }),
        makePledge({ id: "p-3", status: "withdrawn" }),
        makePledge({ id: "p-4", status: "under_review" }),
        makePledge({ id: "p-5", status: "active" }),
      ];
      // healthy: active(1) = 1/5 = 20% → -4
      const result = computeHomeChildrensRightsParticipation(baseInput({ pledges: pls }));
      // mod4: -4 (was +4, drop 8)
      // mod7: pledge feedback rate — all have feedback → still counts
      // Score: 52 + 5 + 4 + 3 - 4 + 3 + 3 + 3 + 3 = 72
      expect(result.rights_score).toBe(72);
    });

    it("+0 when no pledges", () => {
      const result = computeHomeChildrensRightsParticipation(baseInput({
        pledges: [],
      }));
      // mod4: +0, mod7: loses pledge domain → 5 → +3
      // Score: 52 + 5 + 4 + 3 + 0 + 3 + 3 + 3 + 3 = 76
      expect(result.rights_score).toBe(76);
    });

    it("tracks overdue pledge reviews", () => {
      const pls = [
        makePledge({ id: "p-1", last_review_date: "2025-01-01" }), // 165 days ago > 90
        makePledge({ id: "p-2", last_review_date: "2025-05-01" }), // 45 days ago <= 90
      ];
      const result = computeHomeChildrensRightsParticipation(baseInput({ pledges: pls }));
      expect(result.pledges.overdue_reviews).toBe(1);
    });
  });

  // ── Modifier 5: Participation influence (±3) ──────────────────────────

  describe("mod5: participation influence", () => {
    it("+3 when child_influenced rate >= 80%", () => {
      const result = computeHomeChildrensRightsParticipation(baseInput());
      expect(result.participation.child_influence_rate).toBe(100);
    });

    it("+1 when child_influenced rate 60-79%", () => {
      const entries = Array.from({ length: 5 }, (_, i) =>
        makeParticipation({
          id: `part-${i + 1}`,
          date: `2025-05-${String(10 + i).padStart(2, "0")}`,
          child_influenced: i < 3, // 3/5 = 60%
        }),
      );
      const result = computeHomeChildrensRightsParticipation(baseInput({
        participation_entries: entries,
      }));
      expect(result.participation.child_influence_rate).toBe(60);
      // mod5: +1 (was +3, drop 2)
      // Score: 52 + 5 + 4 + 3 + 4 + 1 + 3 + 3 + 3 = 78
      expect(result.rights_score).toBe(78);
    });

    it("-3 when child_influenced rate < 40%", () => {
      const entries = Array.from({ length: 5 }, (_, i) =>
        makeParticipation({
          id: `part-${i + 1}`,
          date: `2025-05-${String(10 + i).padStart(2, "0")}`,
          child_influenced: i < 1, // 1/5 = 20%
          feedback_given_provided: false,
        }),
      );
      const result = computeHomeChildrensRightsParticipation(baseInput({
        participation_entries: entries,
      }));
      expect(result.participation.child_influence_rate).toBe(20);
      // mod5: -3 (was +3, drop 6)
      // mod7: participation feedback rate 0% → loses domain → 5 → +3
      // Score: 52 + 5 + 4 + 3 + 4 - 3 + 3 + 3 + 3 = 74
      expect(result.rights_score).toBe(74);
    });

    it("+0 when no participation entries", () => {
      const result = computeHomeChildrensRightsParticipation(baseInput({
        participation_entries: [],
      }));
      // mod5: +0, mod7: loses participation domain → 5 → +3
      // Score: 52 + 5 + 4 + 3 + 4 + 0 + 3 + 3 + 3 = 77
      expect(result.rights_score).toBe(77);
    });

    it("filters participation to 90d window", () => {
      const result = computeHomeChildrensRightsParticipation(baseInput({
        participation_entries: [
          makeParticipation({ id: "p-1", date: "2025-06-01" }),       // within 90d
          makeParticipation({ id: "p-2", date: "2025-01-01" }),       // outside 90d
        ],
      }));
      expect(result.participation.total_entries_90d).toBe(1);
    });
  });

  // ── Modifier 6: Advocacy access (±3) ──────────────────────────────────

  describe("mod6: advocacy access", () => {
    it("+3 when coverage >= 60% and avg visits >= 2", () => {
      const result = computeHomeChildrensRightsParticipation(baseInput());
      expect(result.advocacy.child_coverage).toBe(60);
      expect(result.advocacy.avg_visits).toBe(3);
    });

    it("+1 when coverage 40-59% and avg visits >= 1", () => {
      // 2/5 children = 40%
      const result = computeHomeChildrensRightsParticipation(baseInput({
        advocacy_records: [
          makeAdvocacy({ id: "adv-1", child_id: "c1", visits_count: 2 }),
          makeAdvocacy({ id: "adv-2", child_id: "c2", visits_count: 1 }),
        ],
      }));
      expect(result.advocacy.child_coverage).toBe(40);
      // mod6: +1 (was +3, drop 2)
      // Score: 52 + 5 + 4 + 3 + 4 + 3 + 1 + 3 + 3 = 78
      expect(result.rights_score).toBe(78);
    });

    it("-3 when coverage < 20%", () => {
      // 1/5 = 20% → actually that's >=20 → +0. Need 0/5.
      // But we need at least 1 record to not hit the no-advocacy branch.
      // 1 child with 0 visits, 1/5 = 20% → +0
      // Use total_children: 10, 1 record → 1/10 = 10% → < 20 → -3
      const result = computeHomeChildrensRightsParticipation(baseInput({
        advocacy_records: [
          makeAdvocacy({ id: "adv-1", child_id: "c1", visits_count: 0 }),
        ],
        total_children: 10,
      }));
      expect(result.advocacy.child_coverage).toBe(10);
      // mod6: -3 (was +3, drop 6)
      // Score changes: mod6 -3 vs +3 = -6
      // But total_children changed from 5 to 10, only affects advocacy coverage
      // Score: 52 + 5 + 4 + 3 + 4 + 3 - 3 + 3 + 3 = 74
      expect(result.rights_score).toBe(74);
    });

    it("-1 when no advocacy records but children exist", () => {
      const result = computeHomeChildrensRightsParticipation(baseInput({
        advocacy_records: [],
      }));
      // mod6: -1, mod7: loses advocacy domain → 5 → +3
      // Score: 52 + 5 + 4 + 3 + 4 + 3 - 1 + 3 + 3 = 76
      expect(result.rights_score).toBe(76);
    });

    it("+0 when no advocacy and no children", () => {
      const result = computeHomeChildrensRightsParticipation({
        today: TODAY,
        rights_entries: [makeRight()],
        child_led_meetings: [],
        feedback_loops: [],
        pledges: [],
        participation_entries: [],
        advocacy_records: [],
        total_children: 0,
      });
      // mod6: +0 (no records, no children)
      // mod1: +5 (1 right fully_met), mod7: 1 domain → +0, all others +0
      // Score: 52 + 5 + 0 + 0 + 0 + 0 + 0 + 0 + 0 = 57
      expect(result.rights_score).toBe(57);
    });

    it("tracks overdue advocacy reviews", () => {
      const result = computeHomeChildrensRightsParticipation(baseInput({
        advocacy_records: [
          makeAdvocacy({ id: "adv-1", child_id: "c1", status: "active", review_date: "2025-01-01" }), // overdue
          makeAdvocacy({ id: "adv-2", child_id: "c2", status: "active", review_date: "2025-12-01" }), // not overdue
          makeAdvocacy({ id: "adv-3", child_id: "c3", status: "completed", review_date: "2025-01-01" }), // completed, not counted
        ],
      }));
      expect(result.advocacy.overdue_reviews).toBe(1);
    });
  });

  // ── Modifier 7: Child voice diversity (±3) ────────────────────────────

  describe("mod7: child voice diversity", () => {
    it("+3 when voice in 5+ domains", () => {
      const result = computeHomeChildrensRightsParticipation(baseInput());
      // All 6 domains active
      // mod7: +3 → full outstanding score of 80
      expect(result.rights_score).toBe(80);
    });

    it("+1 when voice in 3-4 domains", () => {
      // Remove rights feedback, meetings, participation → 3 domains: loops, pledges, advocacy
      const result = computeHomeChildrensRightsParticipation(baseInput({
        rights_entries: [makeRight({ child_feedback_provided: false })],
        child_led_meetings: [],
        participation_entries: [],
      }));
      // domains: rights(0%), meetings(none), loops(yes), pledges(yes), participation(none), advocacy(yes) = 3 → +1
      // mod1: 1 right, fully_met → 100% → +5
      // mod3: no meetings → +0
      // mod5: no participation → +0
      // mod7: 3 domains → +1
      // Score: 52 + 5 + 4 + 0 + 4 + 0 + 3 + 1 + 3 = 72
      expect(result.rights_score).toBe(72);
    });

    it("-3 when voice in 0 domains", () => {
      const result = computeHomeChildrensRightsParticipation({
        today: TODAY,
        rights_entries: [makeRight({ child_feedback_provided: false })],
        child_led_meetings: [],
        feedback_loops: [],
        pledges: [],
        participation_entries: [],
        advocacy_records: [],
        total_children: 5,
      });
      // domains: rights(0%), meetings(none), loops(none), pledges(none), participation(none), advocacy(none) = 0 → -3
      // mod1: 1 right, fully_met → +5
      // mod2-5: all +0
      // mod6: no advocacy, children exist → -1
      // mod7: -3
      // mod8: +0
      // Score: 52 + 5 + 0 + 0 + 0 + 0 - 1 - 3 + 0 = 53
      expect(result.rights_score).toBe(53);
    });

    it("+0 when voice in 1-2 domains", () => {
      // Only rights feedback active (1 domain)
      const result = computeHomeChildrensRightsParticipation({
        today: TODAY,
        rights_entries: Array.from({ length: 10 }, (_, i) => makeRight({ id: `r-${i + 1}` })),
        child_led_meetings: [],
        feedback_loops: [],
        pledges: [],
        participation_entries: [],
        advocacy_records: [],
        total_children: 5,
      });
      // domains: rights(100% → yes), rest none = 1 → +0
      // mod1: +5, mod2-5: +0 each, mod6: -1, mod7: +0, mod8: +0
      // Score: 52 + 5 + 0 + 0 + 0 + 0 - 1 + 0 + 0 = 56
      expect(result.rights_score).toBe(56);
    });
  });

  // ── Modifier 8: Feedback loop closure time (±3) ──────────────────────

  describe("mod8: feedback loop closure time", () => {
    it("+3 when avg closure <= 7 days", () => {
      const result = computeHomeChildrensRightsParticipation(baseInput());
      expect(result.feedback_loops.avg_closure_days).toBe(7);
    });

    it("+1 when avg closure 8-14 days", () => {
      const loops = baseInput().feedback_loops.map((f) => ({
        ...f,
        duration_days_to_close: 10,
      }));
      const result = computeHomeChildrensRightsParticipation(baseInput({
        feedback_loops: loops,
      }));
      expect(result.feedback_loops.avg_closure_days).toBe(10);
      // mod2: childAcceptsRate 100%, avg 10 <= 14 → +4
      // mod8: avg 10 → +1 (was +3, drop 2)
      // Score: 52 + 5 + 4 + 3 + 4 + 3 + 3 + 3 + 1 = 78
      expect(result.rights_score).toBe(78);
    });

    it("+0 when avg closure 15-30 days", () => {
      const loops = baseInput().feedback_loops.map(f => ({
        ...f,
        duration_days_to_close: 20,
      }));
      const result = computeHomeChildrensRightsParticipation(baseInput({
        feedback_loops: loops,
      }));
      expect(result.feedback_loops.avg_closure_days).toBe(20);
      // mod2: childAcceptsRate 100%, avg 20 <= 21 → +2
      // mod8: avg 20 → +0 (was +3, drop 3)
      // Total change: mod2 drops 2, mod8 drops 3 = -5
      // Score: 80 - 5 = 75
      expect(result.rights_score).toBe(75);
    });

    it("-3 when avg closure > 30 days", () => {
      const loops = baseInput().feedback_loops.map(f => ({
        ...f,
        duration_days_to_close: 45,
      }));
      const result = computeHomeChildrensRightsParticipation(baseInput({
        feedback_loops: loops,
      }));
      expect(result.feedback_loops.avg_closure_days).toBe(45);
      // mod2: childAcceptsRate 100% >= 85, avg 45 > 21 → check next: >=50 → +0
      // mod8: avg 45 → -3 (was +3, drop 6)
      // Total change: mod2 drops 4, mod8 drops 6 = -10
      // Score: 80 - 10 = 70
      expect(result.rights_score).toBe(70);
    });

    it("+0 when no feedback loops", () => {
      const result = computeHomeChildrensRightsParticipation(baseInput({
        feedback_loops: [],
      }));
      // Both mod2 and mod8 → +0; mod7 loses loops domain → 5 → still +3
      // Score: 52 + 5 + 0 + 3 + 4 + 3 + 3 + 3 + 0 = 73
      expect(result.rights_score).toBe(73);
    });
  });

  // ── Profile calculations ──────────────────────────────────────────────

  describe("profile calculations", () => {
    it("calculates rights compliance profile correctly", () => {
      const rights = [
        makeRight({ id: "r-1", compliance_level: "fully_met", evidence_count: 5, child_feedback_provided: true }),
        makeRight({ id: "r-2", compliance_level: "partially_met", evidence_count: 2, child_feedback_provided: false }),
        makeRight({ id: "r-3", compliance_level: "not_met", evidence_count: 0, child_feedback_provided: false }),
        makeRight({ id: "r-4", compliance_level: "under_review", evidence_count: 3, child_feedback_provided: true }),
      ];
      const result = computeHomeChildrensRightsParticipation(baseInput({ rights_entries: rights }));
      expect(result.rights_compliance.total_rights).toBe(4);
      expect(result.rights_compliance.fully_met_count).toBe(1);
      expect(result.rights_compliance.partially_met_count).toBe(1);
      expect(result.rights_compliance.not_met_count).toBe(1);
      expect(result.rights_compliance.under_review_count).toBe(1);
      expect(result.rights_compliance.fully_met_rate).toBe(25);
      expect(result.rights_compliance.evidence_avg).toBe(2.5);
      expect(result.rights_compliance.child_feedback_rate).toBe(50);
    });

    it("calculates child-led meeting profile correctly", () => {
      const meetings = [
        makeMeeting({ id: "m-1", child_id: "c1", date: "2025-05-20", decisions_reached_count: 4, child_agenda_count: 2, visible_change_provided: true }),
        makeMeeting({ id: "m-2", child_id: "c2", date: "2025-05-25", decisions_reached_count: 2, child_agenda_count: 4, visible_change_provided: false }),
        makeMeeting({ id: "m-3", child_id: "c1", date: "2025-06-01", decisions_reached_count: 3, child_agenda_count: 3, visible_change_provided: true }),
      ];
      const result = computeHomeChildrensRightsParticipation(baseInput({ child_led_meetings: meetings }));
      expect(result.child_led_meetings.total_meetings_90d).toBe(3);
      expect(result.child_led_meetings.unique_children).toBe(2);
      expect(result.child_led_meetings.avg_decisions).toBe(3);
      expect(result.child_led_meetings.avg_child_agenda).toBe(3);
      expect(result.child_led_meetings.visible_change_rate).toBe(67);
    });

    it("calculates feedback loop profile correctly", () => {
      const loops = [
        makeFeedbackLoop({ id: "fl-1", decision_made: "accepted", child_accepts: true, duration_days_to_close: 5, visible_change_provided: true }),
        makeFeedbackLoop({ id: "fl-2", decision_made: "partially_accepted", child_accepts: true, duration_days_to_close: 10, visible_change_provided: false }),
        makeFeedbackLoop({ id: "fl-3", decision_made: "declined", child_accepts: false, duration_days_to_close: 15, visible_change_provided: false }),
      ];
      const result = computeHomeChildrensRightsParticipation(baseInput({ feedback_loops: loops }));
      expect(result.feedback_loops.total_loops_90d).toBe(3);
      expect(result.feedback_loops.acceptance_rate).toBe(67); // 2/3
      expect(result.feedback_loops.child_accepts_rate).toBe(67);
      expect(result.feedback_loops.avg_closure_days).toBe(10);
      expect(result.feedback_loops.visible_change_rate).toBe(33);
    });

    it("calculates pledge profile correctly", () => {
      const pls = [
        makePledge({ id: "p-1", status: "met", evidence_of_delivery_count: 4, child_feedback_provided: true }),
        makePledge({ id: "p-2", status: "active", evidence_of_delivery_count: 2, child_feedback_provided: true }),
        makePledge({ id: "p-3", status: "in_progress", evidence_of_delivery_count: 1, child_feedback_provided: false }),
        makePledge({ id: "p-4", status: "withdrawn", evidence_of_delivery_count: 0, child_feedback_provided: false }),
      ];
      const result = computeHomeChildrensRightsParticipation(baseInput({ pledges: pls }));
      expect(result.pledges.total_pledges).toBe(4);
      expect(result.pledges.met_rate).toBe(25); // 1/4
      expect(result.pledges.active_in_progress_rate).toBe(50); // 2/4
      expect(result.pledges.avg_evidence).toBe(1.8); // 7/4
      expect(result.pledges.child_feedback_rate).toBe(50);
    });

    it("calculates participation profile correctly", () => {
      const entries = [
        makeParticipation({ id: "p-1", children_involved_count: 5, child_influenced: true, feedback_given_provided: true }),
        makeParticipation({ id: "p-2", children_involved_count: 3, child_influenced: false, feedback_given_provided: true }),
        makeParticipation({ id: "p-3", children_involved_count: 1, child_influenced: true, feedback_given_provided: false }),
      ];
      const result = computeHomeChildrensRightsParticipation(baseInput({ participation_entries: entries }));
      expect(result.participation.total_entries_90d).toBe(3);
      expect(result.participation.child_influence_rate).toBe(67); // 2/3
      expect(result.participation.feedback_given_rate).toBe(67);
      expect(result.participation.avg_children_involved).toBe(3);
    });

    it("calculates advocacy profile correctly", () => {
      const records = [
        makeAdvocacy({ id: "adv-1", child_id: "c1", status: "active", visits_count: 4 }),
        makeAdvocacy({ id: "adv-2", child_id: "c2", status: "completed", visits_count: 3 }),
        makeAdvocacy({ id: "adv-3", child_id: "c3", status: "on_hold", visits_count: 1 }),
      ];
      const result = computeHomeChildrensRightsParticipation(baseInput({ advocacy_records: records }));
      expect(result.advocacy.total_records).toBe(3);
      expect(result.advocacy.active_count).toBe(2); // active + completed
      expect(result.advocacy.child_coverage).toBe(60); // 3/5
      expect(result.advocacy.avg_visits).toBe(2.7);
      expect(result.advocacy.child_view_rate).toBe(100);
    });
  });

  // ── Headline ──────────────────────────────────────────────────────────

  describe("headline", () => {
    it("returns outstanding headline", () => {
      const result = computeHomeChildrensRightsParticipation(baseInput());
      expect(result.headline).toContain("Exceptional");
    });

    it("returns good headline", () => {
      const result = computeHomeChildrensRightsParticipation(baseInput({
        child_led_meetings: [],
        participation_entries: [],
        advocacy_records: [makeAdvocacy({ id: "adv-1", child_id: "c1", visits_count: 1 })],
      }));
      expect(result.headline).toContain("Strong");
    });

    it("returns inadequate headline", () => {
      const result = computeHomeChildrensRightsParticipation({
        today: TODAY,
        rights_entries: [makeRight({ compliance_level: "not_met", child_feedback_provided: false })],
        child_led_meetings: [],
        feedback_loops: [
          makeFeedbackLoop({ child_accepts: false, duration_days_to_close: 45, decision_made: "declined", visible_change_provided: false }),
        ],
        pledges: [],
        participation_entries: [],
        advocacy_records: [],
        total_children: 5,
      });
      expect(result.headline).toContain("Critical");
    });

    it("returns insufficient_data headline", () => {
      const result = computeHomeChildrensRightsParticipation({
        today: TODAY, rights_entries: [], child_led_meetings: [],
        feedback_loops: [], pledges: [], participation_entries: [],
        advocacy_records: [], total_children: 0,
      });
      expect(result.headline).toContain("No children's rights");
    });
  });

  // ── Strengths ─────────────────────────────────────────────────────────

  describe("strengths", () => {
    it("includes rights compliance strength when high", () => {
      const result = computeHomeChildrensRightsParticipation(baseInput());
      expect(result.strengths.some(s => s.includes("rights compliance"))).toBe(true);
    });

    it("includes feedback responsiveness strength when high", () => {
      const result = computeHomeChildrensRightsParticipation(baseInput());
      expect(result.strengths.some(s => s.includes("feedback responsiveness"))).toBe(true);
    });

    it("includes child-led meetings strength when productive", () => {
      const result = computeHomeChildrensRightsParticipation(baseInput());
      expect(result.strengths.some(s => s.includes("child-led meetings"))).toBe(true);
    });

    it("includes participation strength when influence high", () => {
      const result = computeHomeChildrensRightsParticipation(baseInput());
      expect(result.strengths.some(s => s.includes("influencing decisions"))).toBe(true);
    });

    it("includes advocacy strength when coverage high", () => {
      const result = computeHomeChildrensRightsParticipation(baseInput());
      expect(result.strengths.some(s => s.includes("advocacy access"))).toBe(true);
    });

    it("includes voice diversity strength when high", () => {
      const result = computeHomeChildrensRightsParticipation(baseInput());
      expect(result.strengths.some(s => s.includes("Diverse child voice"))).toBe(true);
    });

    it("includes rapid closure strength when fast", () => {
      const result = computeHomeChildrensRightsParticipation(baseInput());
      expect(result.strengths.some(s => s.includes("Rapid feedback closure"))).toBe(true);
    });

    it("has no strengths when everything is poor", () => {
      const result = computeHomeChildrensRightsParticipation({
        today: TODAY,
        rights_entries: [makeRight({ compliance_level: "not_met", child_feedback_provided: false })],
        child_led_meetings: [],
        feedback_loops: [],
        pledges: [],
        participation_entries: [],
        advocacy_records: [],
        total_children: 5,
      });
      expect(result.strengths.length).toBe(0);
    });
  });

  // ── Concerns ──────────────────────────────────────────────────────────

  describe("concerns", () => {
    it("flags not_met rights", () => {
      const result = computeHomeChildrensRightsParticipation(baseInput({
        rights_entries: [
          makeRight({ id: "r-1", compliance_level: "not_met" }),
          makeRight({ id: "r-2", compliance_level: "fully_met" }),
        ],
      }));
      expect(result.concerns.some(c => c.includes("not met"))).toBe(true);
    });

    it("flags low child acceptance in feedback", () => {
      const loops = Array.from({ length: 6 }, (_, i) =>
        makeFeedbackLoop({
          id: `fl-${i + 1}`,
          child_id: `c${(i % 5) + 1}`,
          child_accepts: false,
          duration_days_to_close: 7,
        }),
      );
      const result = computeHomeChildrensRightsParticipation(baseInput({ feedback_loops: loops }));
      expect(result.concerns.some(c => c.includes("accept feedback outcomes"))).toBe(true);
    });

    it("flags no child-led meetings", () => {
      const result = computeHomeChildrensRightsParticipation(baseInput({
        child_led_meetings: [],
      }));
      expect(result.concerns.some(c => c.includes("No child-led meetings"))).toBe(true);
    });

    it("flags overdue pledge reviews", () => {
      const pls = [
        makePledge({ id: "p-1", last_review_date: "2025-01-01" }),
      ];
      const result = computeHomeChildrensRightsParticipation(baseInput({ pledges: pls }));
      expect(result.concerns.some(c => c.includes("pledge review"))).toBe(true);
    });

    it("flags low participation influence", () => {
      const entries = Array.from({ length: 5 }, (_, i) =>
        makeParticipation({
          id: `part-${i + 1}`,
          date: `2025-05-${String(10 + i).padStart(2, "0")}`,
          child_influenced: false,
          feedback_given_provided: false,
        }),
      );
      const result = computeHomeChildrensRightsParticipation(baseInput({
        participation_entries: entries,
      }));
      expect(result.concerns.some(c => c.includes("tokenistic"))).toBe(true);
    });

    it("flags no advocacy records", () => {
      const result = computeHomeChildrensRightsParticipation(baseInput({
        advocacy_records: [],
      }));
      expect(result.concerns.some(c => c.includes("No advocacy records"))).toBe(true);
    });

    it("flags overdue advocacy reviews", () => {
      const result = computeHomeChildrensRightsParticipation(baseInput({
        advocacy_records: [
          makeAdvocacy({ id: "adv-1", child_id: "c1", status: "active", review_date: "2025-01-01" }),
        ],
      }));
      expect(result.concerns.some(c => c.includes("advocacy review"))).toBe(true);
    });

    it("flags slow feedback closure", () => {
      const loops = baseInput().feedback_loops.map(f => ({
        ...f,
        duration_days_to_close: 45,
      }));
      const result = computeHomeChildrensRightsParticipation(baseInput({ feedback_loops: loops }));
      expect(result.concerns.some(c => c.includes("waiting too long"))).toBe(true);
    });
  });

  // ── Recommendations ───────────────────────────────────────────────────

  describe("recommendations", () => {
    it("recommends addressing unmet rights", () => {
      const result = computeHomeChildrensRightsParticipation(baseInput({
        rights_entries: [makeRight({ compliance_level: "not_met" })],
      }));
      expect(result.recommendations.some(r => r.recommendation.includes("unmet"))).toBe(true);
      expect(result.recommendations.some(r => r.urgency === "immediate")).toBe(true);
    });

    it("recommends child-led meetings when missing", () => {
      const result = computeHomeChildrensRightsParticipation(baseInput({
        child_led_meetings: [],
      }));
      expect(result.recommendations.some(r => r.recommendation.includes("child-led meetings"))).toBe(true);
    });

    it("recommends advocacy when missing", () => {
      const result = computeHomeChildrensRightsParticipation(baseInput({
        advocacy_records: [],
      }));
      expect(result.recommendations.some(r => r.recommendation.includes("advocacy"))).toBe(true);
    });

    it("recommends reviewing feedback processes on low acceptance", () => {
      const loops = Array.from({ length: 6 }, (_, i) =>
        makeFeedbackLoop({
          id: `fl-${i + 1}`,
          child_id: `c${(i % 5) + 1}`,
          child_accepts: false,
          duration_days_to_close: 7,
        }),
      );
      const result = computeHomeChildrensRightsParticipation(baseInput({ feedback_loops: loops }));
      expect(result.recommendations.some(r => r.recommendation.includes("feedback processes"))).toBe(true);
    });

    it("recommends pledge review when overdue", () => {
      const pls = [makePledge({ last_review_date: "2025-01-01" })];
      const result = computeHomeChildrensRightsParticipation(baseInput({ pledges: pls }));
      expect(result.recommendations.some(r => r.recommendation.includes("overdue pledge"))).toBe(true);
    });

    it("has sequential rank numbers", () => {
      const result = computeHomeChildrensRightsParticipation(baseInput({
        rights_entries: [makeRight({ compliance_level: "not_met" })],
        child_led_meetings: [],
        advocacy_records: [],
      }));
      for (let i = 0; i < result.recommendations.length; i++) {
        expect(result.recommendations[i].rank).toBe(i + 1);
      }
    });

    it("includes regulatory refs", () => {
      const result = computeHomeChildrensRightsParticipation(baseInput({
        rights_entries: [makeRight({ compliance_level: "not_met" })],
      }));
      const rec = result.recommendations.find(r => r.recommendation.includes("unmet"));
      expect(rec?.regulatory_ref).toContain("UNCRC");
    });

    it("no recommendations when outstanding", () => {
      const result = computeHomeChildrensRightsParticipation(baseInput());
      expect(result.recommendations.length).toBe(0);
    });
  });

  // ── Insights ──────────────────────────────────────────────────────────

  describe("insights", () => {
    it("recognises rights-respecting culture", () => {
      const result = computeHomeChildrensRightsParticipation(baseInput());
      expect(result.insights.some(i => i.text.includes("rights-respecting culture") && i.severity === "positive")).toBe(true);
    });

    it("flags systemic rights gap", () => {
      const rights = Array.from({ length: 5 }, (_, i) =>
        makeRight({ id: `r-${i + 1}`, compliance_level: "not_met" }),
      );
      const result = computeHomeChildrensRightsParticipation(baseInput({ rights_entries: rights }));
      expect(result.insights.some(i => i.text.includes("systemic") && i.severity === "critical")).toBe(true);
    });

    it("detects embedded participation culture", () => {
      const result = computeHomeChildrensRightsParticipation(baseInput());
      expect(result.insights.some(i => i.text.includes("embedded participation"))).toBe(true);
    });

    it("flags slow feedback closure", () => {
      const loops = Array.from({ length: 6 }, (_, i) =>
        makeFeedbackLoop({
          id: `fl-${i + 1}`,
          child_id: `c${(i % 5) + 1}`,
          duration_days_to_close: 45,
        }),
      );
      const result = computeHomeChildrensRightsParticipation(baseInput({ feedback_loops: loops }));
      expect(result.insights.some(i => i.text.includes("disengaging") && i.severity === "warning")).toBe(true);
    });

    it("flags overdue advocacy reviews", () => {
      const result = computeHomeChildrensRightsParticipation(baseInput({
        advocacy_records: [
          makeAdvocacy({ id: "adv-1", child_id: "c1", status: "active", review_date: "2025-01-01" }),
          makeAdvocacy({ id: "adv-2", child_id: "c2", status: "active", review_date: "2025-01-01" }),
        ],
      }));
      expect(result.insights.some(i => i.text.includes("advocacy reviews overdue"))).toBe(true);
    });

    it("flags withdrawn pledges", () => {
      const pls = [
        makePledge({ id: "p-1", status: "withdrawn" }),
        makePledge({ id: "p-2", status: "withdrawn" }),
        makePledge({ id: "p-3", status: "met" }),
      ];
      const result = computeHomeChildrensRightsParticipation(baseInput({ pledges: pls }));
      expect(result.insights.some(i => i.text.includes("pledges withdrawn"))).toBe(true);
    });

    it("highlights active child-led meetings", () => {
      const meetings = Array.from({ length: 8 }, (_, i) =>
        makeMeeting({
          id: `m-${i + 1}`,
          child_id: `c${(i % 5) + 1}`,
          date: `2025-05-${String(10 + i).padStart(2, "0")}`,
        }),
      );
      const result = computeHomeChildrensRightsParticipation(baseInput({
        child_led_meetings: meetings,
      }));
      expect(result.insights.some(i => i.text.includes("child-led meetings in 90 days") && i.severity === "positive")).toBe(true);
    });
  });

  // ── Edge cases ────────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("handles single child scenario", () => {
      const result = computeHomeChildrensRightsParticipation({
        today: TODAY,
        rights_entries: [makeRight()],
        child_led_meetings: [makeMeeting()],
        feedback_loops: [makeFeedbackLoop()],
        pledges: [makePledge()],
        participation_entries: [makeParticipation()],
        advocacy_records: [makeAdvocacy()],
        total_children: 1,
      });
      expect(result.rights_rating).not.toBe("insufficient_data");
      expect(result.rights_score).toBeGreaterThan(0);
    });

    it("handles total_children = 0 with some data", () => {
      const result = computeHomeChildrensRightsParticipation({
        today: TODAY,
        rights_entries: [makeRight()],
        child_led_meetings: [],
        feedback_loops: [],
        pledges: [],
        participation_entries: [],
        advocacy_records: [],
        total_children: 0,
      });
      expect(result.rights_rating).not.toBe("insufficient_data");
    });

    it("handles future-dated meetings outside 90d window", () => {
      const result = computeHomeChildrensRightsParticipation(baseInput({
        child_led_meetings: [
          makeMeeting({ id: "m-1", date: "2025-12-01" }), // future, daysBetween is negative
        ],
      }));
      expect(result.child_led_meetings.total_meetings_90d).toBe(0);
    });

    it("handles future-dated feedback loops outside 90d window", () => {
      const result = computeHomeChildrensRightsParticipation(baseInput({
        feedback_loops: [
          makeFeedbackLoop({ id: "fl-1", feedback_date: "2025-12-01" }),
        ],
      }));
      expect(result.feedback_loops.total_loops_90d).toBe(0);
    });

    it("handles future-dated participation entries outside 90d window", () => {
      const result = computeHomeChildrensRightsParticipation(baseInput({
        participation_entries: [
          makeParticipation({ id: "p-1", date: "2025-12-01" }),
        ],
      }));
      expect(result.participation.total_entries_90d).toBe(0);
    });

    it("handles duplicate child IDs in advocacy", () => {
      const result = computeHomeChildrensRightsParticipation(baseInput({
        advocacy_records: [
          makeAdvocacy({ id: "adv-1", child_id: "c1" }),
          makeAdvocacy({ id: "adv-2", child_id: "c1" }),
        ],
      }));
      expect(result.advocacy.child_coverage).toBe(20); // only 1 unique child of 5
    });

    it("handles all rights under_review", () => {
      const rights = Array.from({ length: 5 }, (_, i) =>
        makeRight({ id: `r-${i + 1}`, compliance_level: "under_review" }),
      );
      const result = computeHomeChildrensRightsParticipation(baseInput({ rights_entries: rights }));
      expect(result.rights_compliance.under_review_count).toBe(5);
      expect(result.rights_compliance.fully_met_rate).toBe(0);
    });

    it("handles zero evidence in rights", () => {
      const rights = Array.from({ length: 3 }, (_, i) =>
        makeRight({ id: `r-${i + 1}`, evidence_count: 0 }),
      );
      const result = computeHomeChildrensRightsParticipation(baseInput({ rights_entries: rights }));
      expect(result.rights_compliance.evidence_avg).toBe(0);
    });

    it("handles zero duration_days_to_close", () => {
      const loops = [
        makeFeedbackLoop({ id: "fl-1", duration_days_to_close: 0 }),
        makeFeedbackLoop({ id: "fl-2", duration_days_to_close: 0 }),
      ];
      const result = computeHomeChildrensRightsParticipation(baseInput({ feedback_loops: loops }));
      expect(result.feedback_loops.avg_closure_days).toBe(0);
    });

    it("handles all pledges withdrawn", () => {
      const pls = Array.from({ length: 5 }, (_, i) =>
        makePledge({ id: `p-${i + 1}`, status: "withdrawn", evidence_of_delivery_count: 0 }),
      );
      const result = computeHomeChildrensRightsParticipation(baseInput({ pledges: pls }));
      expect(result.pledges.met_rate).toBe(0);
      expect(result.pledges.active_in_progress_rate).toBe(0);
    });

    it("handles large dataset without errors", () => {
      const result = computeHomeChildrensRightsParticipation({
        today: TODAY,
        rights_entries: Array.from({ length: 50 }, (_, i) => makeRight({ id: `r-${i}` })),
        child_led_meetings: Array.from({ length: 100 }, (_, i) =>
          makeMeeting({ id: `m-${i}`, child_id: `c${i % 10}`, date: "2025-05-20" }),
        ),
        feedback_loops: Array.from({ length: 100 }, (_, i) =>
          makeFeedbackLoop({ id: `fl-${i}`, child_id: `c${i % 10}` }),
        ),
        pledges: Array.from({ length: 50 }, (_, i) =>
          makePledge({ id: `p-${i}`, child_id: `c${i % 10}` }),
        ),
        participation_entries: Array.from({ length: 100 }, (_, i) =>
          makeParticipation({ id: `part-${i}`, date: "2025-05-20" }),
        ),
        advocacy_records: Array.from({ length: 30 }, (_, i) =>
          makeAdvocacy({ id: `adv-${i}`, child_id: `c${i % 10}` }),
        ),
        total_children: 10,
      });
      expect(result.rights_rating).toBe("outstanding");
    });

    it("returns correct structure on insufficient data", () => {
      const result = computeHomeChildrensRightsParticipation({
        today: TODAY, rights_entries: [], child_led_meetings: [],
        feedback_loops: [], pledges: [], participation_entries: [],
        advocacy_records: [], total_children: 0,
      });
      expect(result).toHaveProperty("rights_rating");
      expect(result).toHaveProperty("rights_score");
      expect(result).toHaveProperty("headline");
      expect(result).toHaveProperty("rights_compliance");
      expect(result).toHaveProperty("child_led_meetings");
      expect(result).toHaveProperty("feedback_loops");
      expect(result).toHaveProperty("pledges");
      expect(result).toHaveProperty("participation");
      expect(result).toHaveProperty("advocacy");
      expect(result).toHaveProperty("strengths");
      expect(result).toHaveProperty("concerns");
      expect(result).toHaveProperty("recommendations");
      expect(result).toHaveProperty("insights");
    });

    it("handles meetings on boundary dates", () => {
      // Exactly 90 days ago should be included
      const result = computeHomeChildrensRightsParticipation(baseInput({
        child_led_meetings: [
          makeMeeting({ id: "m-1", date: "2025-03-17" }), // 90 days before June 15
        ],
      }));
      expect(result.child_led_meetings.total_meetings_90d).toBe(1);
    });

    it("handles meetings just outside 90d boundary", () => {
      const result = computeHomeChildrensRightsParticipation(baseInput({
        child_led_meetings: [
          makeMeeting({ id: "m-1", date: "2025-03-16" }), // 91 days before June 15
        ],
      }));
      expect(result.child_led_meetings.total_meetings_90d).toBe(0);
    });
  });

  // ── Cross-modifier interactions ───────────────────────────────────────

  describe("cross-modifier interactions", () => {
    it("mod2 and mod8 both respond to closure time changes", () => {
      // mod2 checks childAcceptsRate AND avgClosureDays
      // mod8 checks avgClosureDays only
      const loops1 = baseInput().feedback_loops.map(f => ({ ...f, duration_days_to_close: 5 }));
      const result1 = computeHomeChildrensRightsParticipation(baseInput({ feedback_loops: loops1 }));

      const loops2 = baseInput().feedback_loops.map(f => ({ ...f, duration_days_to_close: 25 }));
      const result2 = computeHomeChildrensRightsParticipation(baseInput({ feedback_loops: loops2 }));

      // result1: mod2 +4, mod8 +3 = score 80
      // result2: mod2 +0 (100% accepts but 25 > 21), mod8 +0 = 52+5+0+3+4+3+3+3+0=73
      expect(result1.rights_score).toBeGreaterThan(result2.rights_score);
    });

    it("removing all data collections from outstanding reduces score", () => {
      const full = computeHomeChildrensRightsParticipation(baseInput());
      const stripped = computeHomeChildrensRightsParticipation(baseInput({
        rights_entries: [],
        child_led_meetings: [],
        feedback_loops: [],
        pledges: [],
        participation_entries: [],
        advocacy_records: [],
      }));
      expect(full.rights_score).toBeGreaterThan(stripped.rights_score);
    });

    it("mod7 voice domains track all six data sources", () => {
      // Remove each data source one at a time and verify mod7 still works
      const withoutRights = computeHomeChildrensRightsParticipation(baseInput({
        rights_entries: [],
      }));
      // Without rights: 5 domains → still +3
      // mod1 also changes: +0. Score: 52 + 0 + 4 + 3 + 4 + 3 + 3 + 3 + 3 = 75
      expect(withoutRights.rights_score).toBe(75);
    });
  });

  // ── Feedback loops 90d filter ─────────────────────────────────────────

  describe("feedback loop 90d filtering", () => {
    it("includes loops within 90d", () => {
      const result = computeHomeChildrensRightsParticipation(baseInput({
        feedback_loops: [
          makeFeedbackLoop({ id: "fl-1", feedback_date: "2025-05-25" }),
        ],
      }));
      expect(result.feedback_loops.total_loops_90d).toBe(1);
    });

    it("excludes loops outside 90d", () => {
      const result = computeHomeChildrensRightsParticipation(baseInput({
        feedback_loops: [
          makeFeedbackLoop({ id: "fl-1", feedback_date: "2025-01-01" }),
        ],
      }));
      expect(result.feedback_loops.total_loops_90d).toBe(0);
    });
  });

  // ── Pledge met rate calculation ───────────────────────────────────────

  describe("pledge calculations", () => {
    it("correctly identifies met pledges", () => {
      const result = computeHomeChildrensRightsParticipation(baseInput());
      // baseInput: 3 met + 2 active = 5 total → met_rate = 60%
      expect(result.pledges.met_rate).toBe(60);
    });

    it("correctly identifies active + in_progress", () => {
      const result = computeHomeChildrensRightsParticipation(baseInput());
      // baseInput: 2 active / 5 = 40%
      expect(result.pledges.active_in_progress_rate).toBe(40);
    });
  });

  // ── Advocacy coverage edge ────────────────────────────────────────────

  describe("advocacy coverage", () => {
    it("returns null coverage when total_children is null", () => {
      const result = computeHomeChildrensRightsParticipation({
        today: TODAY,
        rights_entries: [makeRight()],
        child_led_meetings: [],
        feedback_loops: [],
        pledges: [],
        participation_entries: [],
        advocacy_records: [makeAdvocacy()],
        total_children: 0,
      });
      expect(result.advocacy.child_coverage).toBeNull();
    });

    it("100% coverage when all children have advocacy", () => {
      const result = computeHomeChildrensRightsParticipation(baseInput({
        advocacy_records: [
          makeAdvocacy({ id: "adv-1", child_id: "c1" }),
          makeAdvocacy({ id: "adv-2", child_id: "c2" }),
          makeAdvocacy({ id: "adv-3", child_id: "c3" }),
          makeAdvocacy({ id: "adv-4", child_id: "c4" }),
          makeAdvocacy({ id: "adv-5", child_id: "c5" }),
        ],
      }));
      expect(result.advocacy.child_coverage).toBe(100);
    });
  });
});
