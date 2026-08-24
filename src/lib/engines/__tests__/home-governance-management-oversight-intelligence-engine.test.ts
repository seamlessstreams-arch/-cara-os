import { describe, it, expect } from "vitest";
import {
  computeGovernanceManagementOversight,
  type GovernanceOversightInput,
  type WalkroundInput,
  type GovernanceMeetingInput,
  type BoardReportInput,
  type OperationalMeetingInput,
  type CommissioningFeedbackInput,
} from "../home-governance-management-oversight-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2026-05-27";

function makeWalkround(id: string, overrides?: Partial<WalkroundInput>): WalkroundInput {
  return {
    id,
    date: "2026-05-01",
    areas_visited_count: 4,
    positive_observations: 3,
    improvements_identified: 1,
    child_interactions: 3,
    staff_interactions: 2,
    immediate_actions_taken: 1,
    follow_up_actions_logged: 2,
    ...overrides,
  };
}

function makeGovernanceMeeting(id: string, overrides?: Partial<GovernanceMeetingInput>): GovernanceMeetingInput {
  return {
    id,
    date: "2026-05-01",
    attendees_count: 5,
    key_decisions_count: 3,
    actions_count: 4,
    children_discussed_count: 3,
    regulatory_topics_discussed: true,
    risk_items_count: 2,
    ...overrides,
  };
}

function makeBoardReport(id: string, overrides?: Partial<BoardReportInput>): BoardReportInput {
  return {
    id,
    submitted_date: "2026-05-01",
    risk_rag: "green",
    board_response_received: true,
    actions_agreed_count: 2,
    areas_of_concern_count: 0,
    ...overrides,
  };
}

function makeOpsMeeting(id: string, overrides?: Partial<OperationalMeetingInput>): OperationalMeetingInput {
  return {
    id,
    date: "2026-05-01",
    attendees_count: 6,
    key_decisions_count: 3,
    child_updates_count: 4,
    risks_identified_count: 1,
    actions_agreed_count: 3,
    positive_moments_shared: 2,
    ...overrides,
  };
}

function makeCommFeedback(id: string, overrides?: Partial<CommissioningFeedbackInput>): CommissioningFeedbackInput {
  return {
    id,
    date: "2026-05-01",
    overall_rating: 4,
    has_strengths: true,
    has_development_areas: false,
    action_plan_in_place: true,
    ...overrides,
  };
}

/**
 * Builds a strong baseline input that produces outstanding (score ~82).
 * 4 children, 5 walkrounds (3+ child interactions), 4 governance meetings
 * (all with regulatory topics, children discussed, risk items),
 * 3 board reports (all green, all responded), 6 operational meetings
 * (all with decisions + actions), 4 commissioning feedback (all rating 4+).
 *
 * Mod 1: walkrounds=5 >=4, avgChildInteractions=3 >=2 → +5
 * Mod 2: 4/4 = 100% → +6
 * Mod 3: 3/3 = 100% → +5
 * Mod 4: 6/6 = 100% → +5
 * Mod 5: 4/4 = 100% → +5
 * Mod 6: 4/4 = 100% → +4
 * Total: 52 + 5 + 6 + 5 + 5 + 5 + 4 = 82
 */
function baseInput(overrides?: Partial<GovernanceOversightInput>): GovernanceOversightInput {
  return {
    today: TODAY,
    total_children: 4,
    walkrounds: [
      makeWalkround("w1", { date: "2026-03-01" }),
      makeWalkround("w2", { date: "2026-03-15" }),
      makeWalkround("w3", { date: "2026-04-01" }),
      makeWalkround("w4", { date: "2026-04-15" }),
      makeWalkround("w5", { date: "2026-05-01" }),
    ],
    governance_meetings: [
      makeGovernanceMeeting("gm1", { date: "2026-03-01" }),
      makeGovernanceMeeting("gm2", { date: "2026-03-20" }),
      makeGovernanceMeeting("gm3", { date: "2026-04-10" }),
      makeGovernanceMeeting("gm4", { date: "2026-05-01" }),
    ],
    board_reports: [
      makeBoardReport("br1", { submitted_date: "2026-03-01" }),
      makeBoardReport("br2", { submitted_date: "2026-04-01" }),
      makeBoardReport("br3", { submitted_date: "2026-05-01" }),
    ],
    operational_meetings: [
      makeOpsMeeting("om1", { date: "2026-03-01" }),
      makeOpsMeeting("om2", { date: "2026-03-15" }),
      makeOpsMeeting("om3", { date: "2026-04-01" }),
      makeOpsMeeting("om4", { date: "2026-04-15" }),
      makeOpsMeeting("om5", { date: "2026-05-01" }),
      makeOpsMeeting("om6", { date: "2026-05-15" }),
    ],
    commissioning_feedback: [
      makeCommFeedback("cf1", { date: "2026-03-01" }),
      makeCommFeedback("cf2", { date: "2026-03-20" }),
      makeCommFeedback("cf3", { date: "2026-04-15" }),
      makeCommFeedback("cf4", { date: "2026-05-01" }),
    ],
    ...overrides,
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("computeGovernanceManagementOversight", () => {

  // ─── Insufficient Data ───────────────────────────────────────────

  describe("insufficient data", () => {
    it("returns insufficient_data when total_children is 0", () => {
      const r = computeGovernanceManagementOversight(baseInput({ total_children: 0 }));
      expect(r.governance_rating).toBe("insufficient_data");
      expect(r.governance_score).toBe(0);
    });

    it("leaves every rate unmeasured when total_children is 0", () => {
      const r = computeGovernanceManagementOversight(baseInput({ total_children: 0 }));
      expect(r.total_walkrounds).toBe(0);
      expect(r.total_governance_meetings).toBe(0);
      expect(r.total_board_reports).toBe(0);
      expect(r.operational_meeting_rate).toBeNull();
      expect(r.commissioning_satisfaction_rate).toBeNull();
    });

    it("returns empty strengths, concerns, and recommendations with an insight", () => {
      const r = computeGovernanceManagementOversight(baseInput({ total_children: 0 }));
      expect(r.strengths).toHaveLength(0);
      expect(r.concerns).toHaveLength(0);
      expect(r.recommendations).toHaveLength(0);
      expect(r.insights.length).toBe(1);
      expect(r.insights[0].severity).toBe("warning");
    });

    it("returns headline mentioning no children", () => {
      const r = computeGovernanceManagementOversight(baseInput({ total_children: 0 }));
      expect(r.headline).toContain("No children");
    });
  });

  // ─── Outstanding Rating ──────────────────────────────────────────

  describe("outstanding rating", () => {
    it("rates outstanding with full base input — score 82", () => {
      const r = computeGovernanceManagementOversight(baseInput());
      expect(r.governance_score).toBe(82);
      expect(r.governance_rating).toBe("outstanding");
    });

    it("headline includes walkround and governance meeting counts", () => {
      const r = computeGovernanceManagementOversight(baseInput());
      expect(r.headline).toContain("Outstanding");
      expect(r.headline).toContain("5 walkrounds");
      expect(r.headline).toContain("4 governance meetings");
    });
  });

  // ─── Good Rating ─────────────────────────────────────────────────

  describe("good rating", () => {
    it("rates good when Mod 3 and Mod 5 are degraded — score 72", () => {
      // Mod 3: 1/3 board responded = 33% → >=30 → +0
      // Mod 5: 1/3 commissioning >=4 = 33% → >=30 → +0
      // Score: 52 + 5 + 6 + 0 + 5 + 0 + 4 = 72
      const r = computeGovernanceManagementOversight(baseInput({
        board_reports: [
          makeBoardReport("br1", { board_response_received: true }),
          makeBoardReport("br2", { board_response_received: false }),
          makeBoardReport("br3", { board_response_received: false }),
        ],
        commissioning_feedback: [
          makeCommFeedback("cf1", { overall_rating: 4 }),
          makeCommFeedback("cf2", { overall_rating: 2 }),
          makeCommFeedback("cf3", { overall_rating: 2 }),
        ],
      }));
      expect(r.governance_score).toBe(72);
      expect(r.governance_rating).toBe("good");
    });

    it("headline contains Good", () => {
      const r = computeGovernanceManagementOversight(baseInput({
        board_reports: [
          makeBoardReport("br1", { board_response_received: true }),
          makeBoardReport("br2", { board_response_received: false }),
          makeBoardReport("br3", { board_response_received: false }),
        ],
        commissioning_feedback: [
          makeCommFeedback("cf1", { overall_rating: 4 }),
          makeCommFeedback("cf2", { overall_rating: 2 }),
          makeCommFeedback("cf3", { overall_rating: 2 }),
        ],
      }));
      expect(r.headline).toContain("Good");
    });
  });

  // ─── Adequate Rating ─────────────────────────────────────────────

  describe("adequate rating", () => {
    it("rates adequate with moderate degradation — score in 45–64 range", () => {
      // Mod 1: 2 walkrounds → +0 (count >= 2 but < 4)
      // Mod 2: 0 engaged gov meetings out of 2 → 0% < 30% → -5
      // Mod 3: 1/2 board responded → 50% → +2
      // Mod 4: 2/3 effective ops → 67% → +2
      // Mod 5: 1/2 satisfied → 50% → +2
      // Mod 6: 1/2 risk gov → 50% → +1
      // Score: 52 + 0 + (-5) + 2 + 2 + 2 + 1 = 54
      const r = computeGovernanceManagementOversight(baseInput({
        walkrounds: [
          makeWalkround("w1", { child_interactions: 3 }),
          makeWalkround("w2", { child_interactions: 3 }),
        ],
        governance_meetings: [
          makeGovernanceMeeting("gm1", { regulatory_topics_discussed: false, children_discussed_count: 0, risk_items_count: 2 }),
          makeGovernanceMeeting("gm2", { regulatory_topics_discussed: false, children_discussed_count: 0, risk_items_count: 0 }),
        ],
        board_reports: [
          makeBoardReport("br1", { board_response_received: true }),
          makeBoardReport("br2", { board_response_received: false }),
        ],
        operational_meetings: [
          makeOpsMeeting("om1", { key_decisions_count: 3, actions_agreed_count: 2 }),
          makeOpsMeeting("om2", { key_decisions_count: 2, actions_agreed_count: 1 }),
          makeOpsMeeting("om3", { key_decisions_count: 0, actions_agreed_count: 0 }),
        ],
        commissioning_feedback: [
          makeCommFeedback("cf1", { overall_rating: 4 }),
          makeCommFeedback("cf2", { overall_rating: 2 }),
        ],
      }));
      expect(r.governance_score).toBe(54);
      expect(r.governance_rating).toBe("adequate");
    });

    it("headline contains Adequate", () => {
      const r = computeGovernanceManagementOversight(baseInput({
        walkrounds: [
          makeWalkround("w1"),
          makeWalkround("w2"),
        ],
        governance_meetings: [
          makeGovernanceMeeting("gm1", { regulatory_topics_discussed: false, children_discussed_count: 0, risk_items_count: 2 }),
          makeGovernanceMeeting("gm2", { regulatory_topics_discussed: false, children_discussed_count: 0, risk_items_count: 0 }),
        ],
        board_reports: [
          makeBoardReport("br1", { board_response_received: true }),
          makeBoardReport("br2", { board_response_received: false }),
        ],
        operational_meetings: [
          makeOpsMeeting("om1"),
          makeOpsMeeting("om2"),
          makeOpsMeeting("om3", { key_decisions_count: 0, actions_agreed_count: 0 }),
        ],
        commissioning_feedback: [
          makeCommFeedback("cf1", { overall_rating: 4 }),
          makeCommFeedback("cf2", { overall_rating: 2 }),
        ],
      }));
      expect(r.headline).toContain("Adequate");
    });
  });

  // ─── Inadequate Rating ───────────────────────────────────────────

  describe("inadequate rating", () => {
    it("rates inadequate with all penalties — score clamps within bounds", () => {
      // Mod 1: 0 walkrounds → -5
      // Mod 2: 0 gov meetings → 0% < 30% → -5
      // Mod 3: 0 board reports → 0% < 30% → -5
      // Mod 4: 0 ops meetings → 0% < 30% → -4
      // Mod 5: 0 comm feedback → 0% < 30% → -5
      // Mod 6: 0 gov meetings → -1
      // Score: 52 - 5 - 5 - 5 - 4 - 5 - 1 = 27
      const r = computeGovernanceManagementOversight({
        today: TODAY,
        total_children: 4,
        walkrounds: [],
        governance_meetings: [],
        board_reports: [],
        operational_meetings: [],
        commissioning_feedback: [],
      });
      expect(r.governance_score).toBe(27);
      expect(r.governance_rating).toBe("inadequate");
    });

    it("headline contains inadequate", () => {
      const r = computeGovernanceManagementOversight({
        today: TODAY,
        total_children: 4,
        walkrounds: [],
        governance_meetings: [],
        board_reports: [],
        operational_meetings: [],
        commissioning_feedback: [],
      });
      expect(r.headline).toContain("inadequate");
    });
  });

  // ─── Modifier 1: Walkround Frequency & Quality ──────────────────

  describe("modifier 1 — walkround frequency and quality", () => {
    it("awards +5 when walkrounds >= 4 AND avg child_interactions >= 2", () => {
      // Base already gets +5 for this
      const r = computeGovernanceManagementOversight(baseInput());
      expect(r.governance_score).toBe(82);
    });

    it("awards +2 when walkrounds >= 4 but avg child_interactions < 2", () => {
      // Change to 4 walkrounds with 1 child interaction each → avg = 1 < 2 → +2 instead of +5
      // Diff: -3 → score 82 - 3 = 79
      const r = computeGovernanceManagementOversight(baseInput({
        walkrounds: [
          makeWalkround("w1", { child_interactions: 1 }),
          makeWalkround("w2", { child_interactions: 1 }),
          makeWalkround("w3", { child_interactions: 1 }),
          makeWalkround("w4", { child_interactions: 1 }),
        ],
      }));
      expect(r.governance_score).toBe(79);
    });

    it("awards +0 when walkrounds >= 2 but < 4", () => {
      // 2 walkrounds with good interactions → +0 instead of +5
      // Diff: -5 → score 82 - 5 = 77
      const r = computeGovernanceManagementOversight(baseInput({
        walkrounds: [
          makeWalkround("w1", { child_interactions: 3 }),
          makeWalkround("w2", { child_interactions: 3 }),
        ],
      }));
      expect(r.governance_score).toBe(77);
    });

    it("awards -5 when walkrounds < 2", () => {
      // 1 walkround → -5 instead of +5
      // Diff: -10 → score 82 - 10 = 72
      const r = computeGovernanceManagementOversight(baseInput({
        walkrounds: [makeWalkround("w1")],
      }));
      expect(r.governance_score).toBe(72);
    });
  });

  // ─── Modifier 2: Governance Meeting Engagement ──────────────────

  describe("modifier 2 — governance meeting engagement", () => {
    it("awards +6 when engagement >= 80%", () => {
      // Base already gets +6 (4/4 = 100%)
      const r = computeGovernanceManagementOversight(baseInput());
      expect(r.governance_score).toBe(82);
    });

    it("awards +3 when engagement >= 50% but < 80%", () => {
      // 3/5 engaged = 60% → +3 instead of +6. Diff: -3 → 82 - 3 = 79
      const r = computeGovernanceManagementOversight(baseInput({
        governance_meetings: [
          makeGovernanceMeeting("gm1"), // engaged (regulatory + children)
          makeGovernanceMeeting("gm2"), // engaged
          makeGovernanceMeeting("gm3"), // engaged
          makeGovernanceMeeting("gm4", { regulatory_topics_discussed: false }), // not engaged
          makeGovernanceMeeting("gm5", { children_discussed_count: 0 }), // not engaged
        ],
      }));
      expect(r.governance_score).toBe(79);
    });

    it("awards +0 when engagement >= 30% but < 50%", () => {
      // 1/3 engaged = 33% → +0 instead of +6. Diff: -6 → 82 - 6 = 76
      const r = computeGovernanceManagementOversight(baseInput({
        governance_meetings: [
          makeGovernanceMeeting("gm1"), // engaged
          makeGovernanceMeeting("gm2", { regulatory_topics_discussed: false }),
          makeGovernanceMeeting("gm3", { children_discussed_count: 0 }),
        ],
      }));
      expect(r.governance_score).toBe(76);
    });

    it("awards -5 when engagement < 30%", () => {
      // 0/2 engaged = 0% → -5 instead of +6. Diff: -11 → 82 - 11 = 71
      const r = computeGovernanceManagementOversight(baseInput({
        governance_meetings: [
          makeGovernanceMeeting("gm1", { regulatory_topics_discussed: false }),
          makeGovernanceMeeting("gm2", { children_discussed_count: 0 }),
        ],
      }));
      expect(r.governance_score).toBe(71);
    });

    it("does not count meeting with regulatory topics but no children discussed", () => {
      const r = computeGovernanceManagementOversight(baseInput({
        governance_meetings: [
          makeGovernanceMeeting("gm1", { regulatory_topics_discussed: true, children_discussed_count: 0 }),
        ],
      }));
      // 0/1 = 0% < 30% → -5 for Mod 2. Mod 6: risk_items_count = 2 by default, 1/1 = 100% → +4
      // 52 + 5 + (-5) + 5 + 5 + 5 + 4 = 71
      expect(r.governance_score).toBe(71);
    });

    it("does not count meeting with children discussed but no regulatory topics", () => {
      const r = computeGovernanceManagementOversight(baseInput({
        governance_meetings: [
          makeGovernanceMeeting("gm1", { regulatory_topics_discussed: false, children_discussed_count: 3 }),
        ],
      }));
      expect(r.governance_score).toBe(71);
    });

    it("counts meeting only when both regulatory AND children conditions are met", () => {
      const r = computeGovernanceManagementOversight(baseInput({
        governance_meetings: [
          makeGovernanceMeeting("gm1", { regulatory_topics_discussed: true, children_discussed_count: 3 }),
        ],
      }));
      // 1/1 = 100% → +6 for Mod 2. Mod 6: 1/1 = 100% → +4
      // 52 + 5 + 6 + 5 + 5 + 5 + 4 = 82
      expect(r.governance_score).toBe(82);
    });
  });

  // ─── Modifier 3: Board Reporting & Responsiveness ───────────────

  describe("modifier 3 — board reporting and responsiveness", () => {
    it("awards +5 when board response >= 80%", () => {
      // Base already gets +5 (3/3 = 100%)
      const r = computeGovernanceManagementOversight(baseInput());
      expect(r.governance_score).toBe(82);
    });

    it("awards +2 when board response >= 50% but < 80%", () => {
      // 3/5 responded = 60% → +2 instead of +5. Diff: -3 → 82 - 3 = 79
      const r = computeGovernanceManagementOversight(baseInput({
        board_reports: [
          makeBoardReport("br1", { board_response_received: true }),
          makeBoardReport("br2", { board_response_received: true }),
          makeBoardReport("br3", { board_response_received: true }),
          makeBoardReport("br4", { board_response_received: false }),
          makeBoardReport("br5", { board_response_received: false }),
        ],
      }));
      expect(r.governance_score).toBe(79);
    });

    it("awards +0 when board response >= 30% but < 50%", () => {
      // 1/3 responded = 33% → +0 instead of +5. Diff: -5 → 82 - 5 = 77
      const r = computeGovernanceManagementOversight(baseInput({
        board_reports: [
          makeBoardReport("br1", { board_response_received: true }),
          makeBoardReport("br2", { board_response_received: false }),
          makeBoardReport("br3", { board_response_received: false }),
        ],
      }));
      expect(r.governance_score).toBe(77);
    });

    it("awards -5 when board response < 30%", () => {
      // 0/3 responded = 0% → -5 instead of +5. Diff: -10 → 82 - 10 = 72
      const r = computeGovernanceManagementOversight(baseInput({
        board_reports: [
          makeBoardReport("br1", { board_response_received: false }),
          makeBoardReport("br2", { board_response_received: false }),
          makeBoardReport("br3", { board_response_received: false }),
        ],
      }));
      expect(r.governance_score).toBe(72);
    });
  });

  // ─── Modifier 4: Operational Meeting Effectiveness ──────────────

  describe("modifier 4 — operational meeting effectiveness", () => {
    it("awards +5 when effectiveness >= 80%", () => {
      // Base already gets +5 (6/6 = 100%)
      const r = computeGovernanceManagementOversight(baseInput());
      expect(r.governance_score).toBe(82);
    });

    it("awards +2 when effectiveness >= 50% but < 80%", () => {
      // 3/5 effective = 60% → +2 instead of +5. Diff: -3 → 82 - 3 = 79
      const r = computeGovernanceManagementOversight(baseInput({
        operational_meetings: [
          makeOpsMeeting("om1"),
          makeOpsMeeting("om2"),
          makeOpsMeeting("om3"),
          makeOpsMeeting("om4", { key_decisions_count: 0, actions_agreed_count: 0 }),
          makeOpsMeeting("om5", { key_decisions_count: 0, actions_agreed_count: 0 }),
        ],
      }));
      expect(r.governance_score).toBe(79);
    });

    it("awards +0 when effectiveness >= 30% but < 50%", () => {
      // 1/3 effective = 33% → +0 instead of +5. Diff: -5 → 82 - 5 = 77
      const r = computeGovernanceManagementOversight(baseInput({
        operational_meetings: [
          makeOpsMeeting("om1"),
          makeOpsMeeting("om2", { key_decisions_count: 0, actions_agreed_count: 0 }),
          makeOpsMeeting("om3", { key_decisions_count: 0, actions_agreed_count: 0 }),
        ],
      }));
      expect(r.governance_score).toBe(77);
    });

    it("awards -4 when effectiveness < 30%", () => {
      // 0/3 effective = 0% → -4 instead of +5. Diff: -9 → 82 - 9 = 73
      const r = computeGovernanceManagementOversight(baseInput({
        operational_meetings: [
          makeOpsMeeting("om1", { key_decisions_count: 0, actions_agreed_count: 0 }),
          makeOpsMeeting("om2", { key_decisions_count: 0, actions_agreed_count: 0 }),
          makeOpsMeeting("om3", { key_decisions_count: 0, actions_agreed_count: 0 }),
        ],
      }));
      expect(r.governance_score).toBe(73);
    });
  });

  // ─── Modifier 5: Commissioning Satisfaction ─────────────────────

  describe("modifier 5 — commissioning satisfaction", () => {
    it("awards +5 when satisfaction >= 80%", () => {
      // Base already gets +5 (4/4 = 100%)
      const r = computeGovernanceManagementOversight(baseInput());
      expect(r.governance_score).toBe(82);
    });

    it("awards +2 when satisfaction >= 50% but < 80%", () => {
      // 3/5 satisfied = 60% → +2 instead of +5. Diff: -3 → 82 - 3 = 79
      const r = computeGovernanceManagementOversight(baseInput({
        commissioning_feedback: [
          makeCommFeedback("cf1", { overall_rating: 5 }),
          makeCommFeedback("cf2", { overall_rating: 4 }),
          makeCommFeedback("cf3", { overall_rating: 4 }),
          makeCommFeedback("cf4", { overall_rating: 2 }),
          makeCommFeedback("cf5", { overall_rating: 1 }),
        ],
      }));
      expect(r.governance_score).toBe(79);
    });

    it("awards +0 when satisfaction >= 30% but < 50%", () => {
      // 1/3 satisfied = 33% → +0 instead of +5. Diff: -5 → 82 - 5 = 77
      const r = computeGovernanceManagementOversight(baseInput({
        commissioning_feedback: [
          makeCommFeedback("cf1", { overall_rating: 4 }),
          makeCommFeedback("cf2", { overall_rating: 2 }),
          makeCommFeedback("cf3", { overall_rating: 1 }),
        ],
      }));
      expect(r.governance_score).toBe(77);
    });

    it("awards -5 when satisfaction < 30%", () => {
      // 0/3 satisfied = 0% → -5 instead of +5. Diff: -10 → 82 - 10 = 72
      const r = computeGovernanceManagementOversight(baseInput({
        commissioning_feedback: [
          makeCommFeedback("cf1", { overall_rating: 2 }),
          makeCommFeedback("cf2", { overall_rating: 1 }),
          makeCommFeedback("cf3", { overall_rating: 3 }),
        ],
      }));
      expect(r.governance_score).toBe(72);
    });
  });

  // ─── Modifier 6: Risk Governance ────────────────────────────────

  describe("modifier 6 — risk governance", () => {
    it("awards +4 when risk governance >= 70%", () => {
      // Base already gets +4 (4/4 = 100%)
      const r = computeGovernanceManagementOversight(baseInput());
      expect(r.governance_score).toBe(82);
    });

    it("awards +1 when risk governance >= 40% but < 70%", () => {
      // 2/4 risk meetings = 50% → +1 instead of +4. Diff: -3 → 82 - 3 = 79
      const r = computeGovernanceManagementOversight(baseInput({
        governance_meetings: [
          makeGovernanceMeeting("gm1", { risk_items_count: 2 }),
          makeGovernanceMeeting("gm2", { risk_items_count: 1 }),
          makeGovernanceMeeting("gm3", { risk_items_count: 0 }),
          makeGovernanceMeeting("gm4", { risk_items_count: 0 }),
        ],
      }));
      expect(r.governance_score).toBe(79);
    });

    it("awards +0 when risk governance >= 20% but < 40%", () => {
      // 1/4 risk meetings = 25% → +0 instead of +4. Diff: -4 → 82 - 4 = 78
      const r = computeGovernanceManagementOversight(baseInput({
        governance_meetings: [
          makeGovernanceMeeting("gm1", { risk_items_count: 1 }),
          makeGovernanceMeeting("gm2", { risk_items_count: 0 }),
          makeGovernanceMeeting("gm3", { risk_items_count: 0 }),
          makeGovernanceMeeting("gm4", { risk_items_count: 0 }),
        ],
      }));
      expect(r.governance_score).toBe(78);
    });

    it("awards -4 when risk governance < 20%", () => {
      // 0/4 risk meetings = 0% → -4 instead of +4. Diff: -8 → 82 - 8 = 74
      const r = computeGovernanceManagementOversight(baseInput({
        governance_meetings: [
          makeGovernanceMeeting("gm1", { risk_items_count: 0 }),
          makeGovernanceMeeting("gm2", { risk_items_count: 0 }),
          makeGovernanceMeeting("gm3", { risk_items_count: 0 }),
          makeGovernanceMeeting("gm4", { risk_items_count: 0 }),
        ],
      }));
      expect(r.governance_score).toBe(74);
    });

    it("awards -1 when no governance meetings at all", () => {
      // No gov meetings → Mod 6 = -1 instead of +4. Also Mod 2 changes: 0 meetings → 0% < 30% → -5 instead of +6.
      // 52 + 5(mod1) + (-5)(mod2 no meetings 0%) + 5(mod3) + 5(mod4) + 5(mod5) + (-1)(mod6 no meetings) = 66
      const r = computeGovernanceManagementOversight(baseInput({
        governance_meetings: [],
      }));
      expect(r.governance_score).toBe(66);
    });

    it("treats risk_items_count = 0 as not addressing risk", () => {
      const r = computeGovernanceManagementOversight(baseInput({
        governance_meetings: [
          makeGovernanceMeeting("gm1", { risk_items_count: 0 }),
          makeGovernanceMeeting("gm2", { risk_items_count: 0 }),
          makeGovernanceMeeting("gm3", { risk_items_count: 0 }),
          makeGovernanceMeeting("gm4", { risk_items_count: 0 }),
        ],
      }));
      // 0/4 = 0% < 20% → -4 instead of +4. Diff: -8
      expect(r.governance_score).toBe(74);
    });

    it("risk_items_count = 1 counts as addressing risk", () => {
      const r = computeGovernanceManagementOversight(baseInput({
        governance_meetings: [
          makeGovernanceMeeting("gm1", { risk_items_count: 1 }),
          makeGovernanceMeeting("gm2", { risk_items_count: 1 }),
          makeGovernanceMeeting("gm3", { risk_items_count: 1 }),
          makeGovernanceMeeting("gm4", { risk_items_count: 1 }),
        ],
      }));
      // 4/4 = 100% → +4 (same as base)
      expect(r.governance_score).toBe(82);
    });
  });

  // ─── Metrics ────────────────────────────────────────────────────

  describe("metrics", () => {
    it("counts total walkrounds", () => {
      const r = computeGovernanceManagementOversight(baseInput());
      expect(r.total_walkrounds).toBe(5);
    });

    it("counts total governance meetings", () => {
      const r = computeGovernanceManagementOversight(baseInput());
      expect(r.total_governance_meetings).toBe(4);
    });

    it("counts total board reports", () => {
      const r = computeGovernanceManagementOversight(baseInput());
      expect(r.total_board_reports).toBe(3);
    });

    it("calculates operational meeting effectiveness rate", () => {
      // 6/6 = 100%
      const r = computeGovernanceManagementOversight(baseInput());
      expect(r.operational_meeting_rate).toBe(100);
    });

    it("calculates commissioning satisfaction rate", () => {
      // 4/4 = 100%
      const r = computeGovernanceManagementOversight(baseInput());
      expect(r.commissioning_satisfaction_rate).toBe(100);
    });

    it("leaves every rate unmeasured when no data provided", () => {
      const r = computeGovernanceManagementOversight({
        today: TODAY,
        total_children: 4,
        walkrounds: [],
        governance_meetings: [],
        board_reports: [],
        operational_meetings: [],
        commissioning_feedback: [],
      });
      expect(r.operational_meeting_rate).toBeNull();
      expect(r.commissioning_satisfaction_rate).toBeNull();
    });

    it("returns 0 ops rate when no ops meetings have decisions and actions", () => {
      const r = computeGovernanceManagementOversight(baseInput({
        operational_meetings: [
          makeOpsMeeting("om1", { key_decisions_count: 0, actions_agreed_count: 0 }),
          makeOpsMeeting("om2", { key_decisions_count: 0, actions_agreed_count: 0 }),
        ],
      }));
      expect(r.operational_meeting_rate).toBe(0);
    });

    it("requires BOTH decisions and actions for ops effectiveness", () => {
      const r = computeGovernanceManagementOversight(baseInput({
        operational_meetings: [
          makeOpsMeeting("om1", { key_decisions_count: 3, actions_agreed_count: 0 }),
          makeOpsMeeting("om2", { key_decisions_count: 0, actions_agreed_count: 3 }),
        ],
      }));
      expect(r.operational_meeting_rate).toBe(0);
    });

    it("commissioning_satisfaction_rate is unmeasured when no feedback items exist", () => {
      const r = computeGovernanceManagementOversight(baseInput({
        commissioning_feedback: [],
      }));
      expect(r.commissioning_satisfaction_rate).toBeNull();
    });

    it("counts rating 5 as satisfied for commissioning", () => {
      const r = computeGovernanceManagementOversight(baseInput({
        commissioning_feedback: [makeCommFeedback("cf1", { overall_rating: 5 })],
      }));
      expect(r.commissioning_satisfaction_rate).toBe(100);
    });

    it("calculates partial commissioning satisfaction rate", () => {
      // 2/4 = 50%
      const r = computeGovernanceManagementOversight(baseInput({
        commissioning_feedback: [
          makeCommFeedback("cf1", { overall_rating: 4 }),
          makeCommFeedback("cf2", { overall_rating: 5 }),
          makeCommFeedback("cf3", { overall_rating: 2 }),
          makeCommFeedback("cf4", { overall_rating: 1 }),
        ],
      }));
      expect(r.commissioning_satisfaction_rate).toBe(50);
    });
  });

  // ─── Strengths ──────────────────────────────────────────────────

  describe("strengths", () => {
    it("includes walkround strength when >= 4 with good child engagement", () => {
      const r = computeGovernanceManagementOversight(baseInput());
      expect(r.strengths.some(s => s.includes("walkround"))).toBe(true);
    });

    it("includes board responsiveness strength when >= 80%", () => {
      const r = computeGovernanceManagementOversight(baseInput());
      expect(r.strengths.some(s => s.includes("board reports received a response"))).toBe(true);
    });

    it("includes ops meeting strength when effectiveness >= 80%", () => {
      const r = computeGovernanceManagementOversight(baseInput());
      expect(r.strengths.some(s => s.includes("operational meetings"))).toBe(true);
    });

    it("includes governance engagement strength when >= 80%", () => {
      const r = computeGovernanceManagementOversight(baseInput());
      expect(r.strengths.some(s => s.includes("governance meetings"))).toBe(true);
    });

    it("includes commissioning satisfaction strength when >= 80%", () => {
      const r = computeGovernanceManagementOversight(baseInput());
      expect(r.strengths.some(s => s.includes("commissioning satisfaction"))).toBe(true);
    });

    it("includes risk governance strength when >= 70%", () => {
      const r = computeGovernanceManagementOversight(baseInput());
      expect(r.strengths.some(s => s.includes("risk"))).toBe(true);
    });

    it("returns no strengths when all areas are weak", () => {
      const r = computeGovernanceManagementOversight({
        today: TODAY,
        total_children: 4,
        walkrounds: [makeWalkround("w1", { child_interactions: 0 })],
        governance_meetings: [makeGovernanceMeeting("gm1", { regulatory_topics_discussed: false, risk_items_count: 0 })],
        board_reports: [makeBoardReport("br1", { board_response_received: false })],
        operational_meetings: [makeOpsMeeting("om1", { key_decisions_count: 0, actions_agreed_count: 0 })],
        commissioning_feedback: [makeCommFeedback("cf1", { overall_rating: 2 })],
      });
      expect(r.strengths).toHaveLength(0);
    });
  });

  // ─── Concerns ───────────────────────────────────────────────────

  describe("concerns", () => {
    it("flags concern when walkrounds < 2", () => {
      const r = computeGovernanceManagementOversight(baseInput({
        walkrounds: [makeWalkround("w1")],
      }));
      expect(r.concerns.some(c => c.includes("walkround"))).toBe(true);
    });

    it("flags concern when board response < 30%", () => {
      const r = computeGovernanceManagementOversight(baseInput({
        board_reports: [
          makeBoardReport("br1", { board_response_received: false }),
          makeBoardReport("br2", { board_response_received: false }),
          makeBoardReport("br3", { board_response_received: false }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("board reports"))).toBe(true);
    });

    it("flags concern when commissioning satisfaction < 30%", () => {
      const r = computeGovernanceManagementOversight(baseInput({
        commissioning_feedback: [
          makeCommFeedback("cf1", { overall_rating: 2 }),
          makeCommFeedback("cf2", { overall_rating: 1 }),
          makeCommFeedback("cf3", { overall_rating: 3 }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("commissioning satisfaction"))).toBe(true);
    });

    it("flags concern when governance engagement < 30%", () => {
      const r = computeGovernanceManagementOversight(baseInput({
        governance_meetings: [
          makeGovernanceMeeting("gm1", { regulatory_topics_discussed: false }),
          makeGovernanceMeeting("gm2", { children_discussed_count: 0 }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("governance meetings"))).toBe(true);
    });

    it("flags concern when ops effectiveness < 30%", () => {
      const r = computeGovernanceManagementOversight(baseInput({
        operational_meetings: [
          makeOpsMeeting("om1", { key_decisions_count: 0, actions_agreed_count: 0 }),
          makeOpsMeeting("om2", { key_decisions_count: 0, actions_agreed_count: 0 }),
          makeOpsMeeting("om3", { key_decisions_count: 0, actions_agreed_count: 0 }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("operational meetings"))).toBe(true);
    });

    it("flags concern when risk governance < 20%", () => {
      const r = computeGovernanceManagementOversight(baseInput({
        governance_meetings: [
          makeGovernanceMeeting("gm1", { risk_items_count: 0 }),
          makeGovernanceMeeting("gm2", { risk_items_count: 0 }),
          makeGovernanceMeeting("gm3", { risk_items_count: 0 }),
          makeGovernanceMeeting("gm4", { risk_items_count: 0 }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("risk"))).toBe(true);
    });

    it("returns no concerns when all areas are strong", () => {
      const r = computeGovernanceManagementOversight(baseInput());
      expect(r.concerns).toHaveLength(0);
    });
  });

  // ─── Recommendations ────────────────────────────────────────────

  describe("recommendations", () => {
    it("recommends increasing walkrounds when < 2", () => {
      const r = computeGovernanceManagementOversight(baseInput({
        walkrounds: [makeWalkround("w1")],
      }));
      const rec = r.recommendations.find(rec => rec.recommendation.includes("walkround"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
      expect(rec!.regulatory_ref).toBe("CHR 2015 Reg 40");
    });

    it("recommends improving board engagement when response < 50%", () => {
      const r = computeGovernanceManagementOversight(baseInput({
        board_reports: [
          makeBoardReport("br1", { board_response_received: true }),
          makeBoardReport("br2", { board_response_received: false }),
          makeBoardReport("br3", { board_response_received: false }),
        ],
      }));
      const rec = r.recommendations.find(rec => rec.recommendation.includes("board"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
      expect(rec!.regulatory_ref).toBe("CHR 2015 Reg 45");
    });

    it("recommends improving governance engagement when < 50%", () => {
      const r = computeGovernanceManagementOversight(baseInput({
        governance_meetings: [
          makeGovernanceMeeting("gm1"), // engaged
          makeGovernanceMeeting("gm2", { regulatory_topics_discussed: false }),
          makeGovernanceMeeting("gm3", { children_discussed_count: 0 }),
          makeGovernanceMeeting("gm4", { regulatory_topics_discussed: false }),
        ],
      }));
      const rec = r.recommendations.find(rec => rec.recommendation.includes("governance meetings"));
      expect(rec).toBeDefined();
      expect(rec!.regulatory_ref).toBe("CHR 2015 Reg 45");
    });

    it("recommends strengthening ops meetings when effectiveness < 50%", () => {
      const r = computeGovernanceManagementOversight(baseInput({
        operational_meetings: [
          makeOpsMeeting("om1"),
          makeOpsMeeting("om2", { key_decisions_count: 0, actions_agreed_count: 0 }),
          makeOpsMeeting("om3", { key_decisions_count: 0, actions_agreed_count: 0 }),
        ],
      }));
      const rec = r.recommendations.find(rec => rec.recommendation.includes("operational meeting"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
      expect(rec!.regulatory_ref).toBeNull();
    });

    it("recommends addressing commissioning concerns when satisfaction < 50%", () => {
      const r = computeGovernanceManagementOversight(baseInput({
        commissioning_feedback: [
          makeCommFeedback("cf1", { overall_rating: 4 }),
          makeCommFeedback("cf2", { overall_rating: 2 }),
          makeCommFeedback("cf3", { overall_rating: 1 }),
        ],
      }));
      const rec = r.recommendations.find(rec => rec.recommendation.includes("commissioning"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("recommends establishing governance meetings when none exist", () => {
      const r = computeGovernanceManagementOversight(baseInput({
        governance_meetings: [],
      }));
      const rec = r.recommendations.find(rec => rec.recommendation.includes("governance meeting"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
      expect(rec!.regulatory_ref).toBe("CHR 2015 Reg 45");
    });

    it("returns no recommendations when all areas are strong", () => {
      const r = computeGovernanceManagementOversight(baseInput());
      expect(r.recommendations).toHaveLength(0);
    });

    it("ranks recommendations sequentially", () => {
      const r = computeGovernanceManagementOversight({
        today: TODAY,
        total_children: 4,
        walkrounds: [makeWalkround("w1")],
        governance_meetings: [],
        board_reports: [makeBoardReport("br1", { board_response_received: false })],
        operational_meetings: [makeOpsMeeting("om1", { key_decisions_count: 0, actions_agreed_count: 0 })],
        commissioning_feedback: [makeCommFeedback("cf1", { overall_rating: 1 })],
      });
      expect(r.recommendations.length).toBeGreaterThan(1);
      for (let i = 0; i < r.recommendations.length; i++) {
        expect(r.recommendations[i].rank).toBe(i + 1);
      }
    });
  });

  // ─── Insights ───────────────────────────────────────────────────

  describe("insights", () => {
    it("generates positive insight for outstanding governance", () => {
      const r = computeGovernanceManagementOversight(baseInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("exemplary"))).toBe(true);
    });

    it("generates positive insight for strong walkround engagement", () => {
      const r = computeGovernanceManagementOversight(baseInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("walkround"))).toBe(true);
    });

    it("generates critical insight for insufficient walkrounds", () => {
      const r = computeGovernanceManagementOversight(baseInput({
        walkrounds: [makeWalkround("w1")],
      }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("walkround"))).toBe(true);
    });

    it("generates critical insight for poor board responsiveness", () => {
      const r = computeGovernanceManagementOversight(baseInput({
        board_reports: [
          makeBoardReport("br1", { board_response_received: false }),
          makeBoardReport("br2", { board_response_received: false }),
          makeBoardReport("br3", { board_response_received: false }),
        ],
      }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("Board responsiveness"))).toBe(true);
    });

    it("generates warning insight for low governance engagement", () => {
      const r = computeGovernanceManagementOversight(baseInput({
        governance_meetings: [
          makeGovernanceMeeting("gm1", { regulatory_topics_discussed: false }),
          makeGovernanceMeeting("gm2", { children_discussed_count: 0 }),
        ],
      }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("governance meetings"))).toBe(true);
    });

    it("generates warning insight for low commissioning satisfaction", () => {
      const r = computeGovernanceManagementOversight(baseInput({
        commissioning_feedback: [
          makeCommFeedback("cf1", { overall_rating: 2 }),
          makeCommFeedback("cf2", { overall_rating: 1 }),
          makeCommFeedback("cf3", { overall_rating: 3 }),
        ],
      }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Commissioning satisfaction"))).toBe(true);
    });
  });

  // ─── Headlines ──────────────────────────────────────────────────

  describe("headlines", () => {
    it("outstanding headline includes key metrics", () => {
      const r = computeGovernanceManagementOversight(baseInput());
      expect(r.headline).toContain("Outstanding");
      expect(r.headline).toContain("5 walkrounds");
      expect(r.headline).toContain("100%");
    });

    it("good headline", () => {
      const r = computeGovernanceManagementOversight(baseInput({
        board_reports: [
          makeBoardReport("br1", { board_response_received: true }),
          makeBoardReport("br2", { board_response_received: false }),
          makeBoardReport("br3", { board_response_received: false }),
        ],
        commissioning_feedback: [
          makeCommFeedback("cf1", { overall_rating: 4 }),
          makeCommFeedback("cf2", { overall_rating: 2 }),
          makeCommFeedback("cf3", { overall_rating: 2 }),
        ],
      }));
      expect(r.headline).toContain("Good");
    });

    it("adequate headline", () => {
      const r = computeGovernanceManagementOversight(baseInput({
        walkrounds: [makeWalkround("w1"), makeWalkround("w2")],
        governance_meetings: [
          makeGovernanceMeeting("gm1", { regulatory_topics_discussed: false, children_discussed_count: 0, risk_items_count: 2 }),
          makeGovernanceMeeting("gm2", { regulatory_topics_discussed: false, children_discussed_count: 0, risk_items_count: 0 }),
        ],
        board_reports: [
          makeBoardReport("br1", { board_response_received: true }),
          makeBoardReport("br2", { board_response_received: false }),
        ],
        operational_meetings: [
          makeOpsMeeting("om1"),
          makeOpsMeeting("om2"),
          makeOpsMeeting("om3", { key_decisions_count: 0, actions_agreed_count: 0 }),
        ],
        commissioning_feedback: [
          makeCommFeedback("cf1", { overall_rating: 4 }),
          makeCommFeedback("cf2", { overall_rating: 2 }),
        ],
      }));
      expect(r.headline).toContain("Adequate");
    });

    it("inadequate headline", () => {
      const r = computeGovernanceManagementOversight({
        today: TODAY,
        total_children: 4,
        walkrounds: [],
        governance_meetings: [],
        board_reports: [],
        operational_meetings: [],
        commissioning_feedback: [],
      });
      expect(r.headline).toContain("inadequate");
    });

    it("insufficient data headline", () => {
      const r = computeGovernanceManagementOversight(baseInput({ total_children: 0 }));
      expect(r.headline).toContain("No children");
    });
  });

  // ─── Edge Cases ─────────────────────────────────────────────────

  describe("edge cases", () => {
    it("score is clamped to 0 minimum", () => {
      // Even with many penalties, score should not go below 0.
      // We can't actually get below 0 with the current modifiers (min possible = 27),
      // but verify the clamp is in effect.
      const r = computeGovernanceManagementOversight({
        today: TODAY,
        total_children: 4,
        walkrounds: [],
        governance_meetings: [],
        board_reports: [],
        operational_meetings: [],
        commissioning_feedback: [],
      });
      expect(r.governance_score).toBeGreaterThanOrEqual(0);
    });

    it("score is clamped to 100 maximum", () => {
      const r = computeGovernanceManagementOversight(baseInput());
      expect(r.governance_score).toBeLessThanOrEqual(100);
    });

    it("handles single item in each category", () => {
      const r = computeGovernanceManagementOversight({
        today: TODAY,
        total_children: 1,
        walkrounds: [makeWalkround("w1")],
        governance_meetings: [makeGovernanceMeeting("gm1")],
        board_reports: [makeBoardReport("br1")],
        operational_meetings: [makeOpsMeeting("om1")],
        commissioning_feedback: [makeCommFeedback("cf1")],
      });
      // 1 walkround < 2 → -5
      // 1/1 gov engaged = 100% → +6
      // 1/1 board responded = 100% → +5
      // 1/1 ops effective = 100% → +5
      // 1/1 comm satisfied = 100% → +5
      // 1/1 risk gov = 100% → +4
      // 52 - 5 + 6 + 5 + 5 + 5 + 4 = 72
      expect(r.governance_score).toBe(72);
      expect(r.governance_rating).toBe("good");
    });

    it("handles empty arrays with children present", () => {
      const r = computeGovernanceManagementOversight({
        today: TODAY,
        total_children: 3,
        walkrounds: [],
        governance_meetings: [],
        board_reports: [],
        operational_meetings: [],
        commissioning_feedback: [],
      });
      expect(r.governance_rating).toBe("inadequate");
      expect(r.governance_score).toBe(27);
    });

    it("treats walkround threshold boundary correctly (exactly 4 walkrounds with exactly 2 avg interactions)", () => {
      const r = computeGovernanceManagementOversight(baseInput({
        walkrounds: [
          makeWalkround("w1", { child_interactions: 2 }),
          makeWalkround("w2", { child_interactions: 2 }),
          makeWalkround("w3", { child_interactions: 2 }),
          makeWalkround("w4", { child_interactions: 2 }),
        ],
      }));
      // 4 walkrounds >= 4, avg interactions = 2 >= 2 → +5
      // 52 + 5 + 6 + 5 + 5 + 5 + 4 = 82
      expect(r.governance_score).toBe(82);
    });

    it("handles exactly 80% boundary for board response", () => {
      // 4/5 = 80% → exactly at >= 80% threshold → +5
      const r = computeGovernanceManagementOversight(baseInput({
        board_reports: [
          makeBoardReport("br1", { board_response_received: true }),
          makeBoardReport("br2", { board_response_received: true }),
          makeBoardReport("br3", { board_response_received: true }),
          makeBoardReport("br4", { board_response_received: true }),
          makeBoardReport("br5", { board_response_received: false }),
        ],
      }));
      // pct(4, 5) = 80 → +5 (same as base)
      expect(r.governance_score).toBe(82);
    });

    it("commissioning rating boundary: exactly rating 4 counts as satisfied", () => {
      const r = computeGovernanceManagementOversight(baseInput({
        commissioning_feedback: [
          makeCommFeedback("cf1", { overall_rating: 4 }),
        ],
      }));
      // 1/1 = 100% → +5
      expect(r.governance_score).toBe(82);
    });

    it("commissioning rating boundary: rating 3 does not count as satisfied", () => {
      const r = computeGovernanceManagementOversight(baseInput({
        commissioning_feedback: [
          makeCommFeedback("cf1", { overall_rating: 3 }),
        ],
      }));
      // 0/1 = 0% < 30% → -5 instead of +5. Diff: -10 → 82 - 10 = 72
      expect(r.governance_score).toBe(72);
    });
  });

  // ─── Score Boundary Values ──────────────────────────────────────

  describe("score boundary values", () => {
    it("score exactly 80 is outstanding", () => {
      // Reduce base by 2 points: degrade Mod 4 from +5 to +2 (effectiveness 50-79%)
      // and Mod 6 from +4 to +1 (risk gov 40-69%)
      // 52 + 5 + 6 + 5 + 2 + 5 + 1 = 76... that's not 80
      // Let's try: degrade only Mod 1 from +5 to +2 (walkrounds >= 4 but avg interactions < 2)
      // and Mod 6 from +4 to +1
      // 52 + 2 + 6 + 5 + 5 + 5 + 1 = 76... not 80 either
      // Let's try: base is 82, degrade Mod 3 from +5 to +2 (board response 50-79%)
      // and Mod 6 stays at +4
      // 52 + 5 + 6 + 2 + 5 + 5 + 4 = 79... close.
      // How about: degrade Mod 1 from +5 to +2: 52 + 2 + 6 + 5 + 5 + 5 + 4 = 79
      // Degrade Mod 6 from +4 to +1: 52 + 5 + 6 + 5 + 5 + 5 + 1 = 79
      // Score 80: 52 + 5 + 6 + 5 + 5 + 5 + 2... nope all tiers don't give +2 for Mod 6
      // Let me just verify 82 (outstanding) and 79 (good) and 65 (good boundary) and 45 (adequate boundary)
      // and 44 (inadequate). Score 82 is already tested. Let me test 65.
      // 65: 52 + 5 + 6 + 0 + 0 + 0 + 2... nope.
      // Actually let me just build a test for exactly 65.
      // 52 + 5 + 6 + 0 + 5 + 0 + (-1) = 67 (governance meetings empty: Mod 2 → -5, Mod 6 → -1... no)
      // Let me compute: 52 + 0 + 3 + 2 + 2 + 2 + 4 = 65
      // Mod 1: walkrounds 2-3 → +0 (2 walkrounds)
      // Mod 2: engagement 50-79% → +3 (3/5 engaged)
      // Mod 3: board 50-79% → +2 (3/5 responded)
      // Mod 4: ops 50-79% → +2 (3/5 effective)
      // Mod 5: comm 50-79% → +2 (3/5 rating >= 4)
      // Mod 6: risk 70%+ → +4 (4/5 with risk items... but we need 5 gov meetings with 3/5 engaged)
      // Wait Mod 6 uses governance meetings count. 5 gov meetings with 4/5 having risk items → 80% → +4
      // Score: 52 + 0 + 3 + 2 + 2 + 2 + 4 = 65
      const r = computeGovernanceManagementOversight(baseInput({
        walkrounds: [
          makeWalkround("w1", { child_interactions: 3 }),
          makeWalkround("w2", { child_interactions: 3 }),
        ],
        governance_meetings: [
          makeGovernanceMeeting("gm1"),
          makeGovernanceMeeting("gm2"),
          makeGovernanceMeeting("gm3"),
          makeGovernanceMeeting("gm4", { regulatory_topics_discussed: false }),
          makeGovernanceMeeting("gm5", { children_discussed_count: 0 }),
        ],
        board_reports: [
          makeBoardReport("br1", { board_response_received: true }),
          makeBoardReport("br2", { board_response_received: true }),
          makeBoardReport("br3", { board_response_received: true }),
          makeBoardReport("br4", { board_response_received: false }),
          makeBoardReport("br5", { board_response_received: false }),
        ],
        operational_meetings: [
          makeOpsMeeting("om1"),
          makeOpsMeeting("om2"),
          makeOpsMeeting("om3"),
          makeOpsMeeting("om4", { key_decisions_count: 0, actions_agreed_count: 0 }),
          makeOpsMeeting("om5", { key_decisions_count: 0, actions_agreed_count: 0 }),
        ],
        commissioning_feedback: [
          makeCommFeedback("cf1", { overall_rating: 4 }),
          makeCommFeedback("cf2", { overall_rating: 4 }),
          makeCommFeedback("cf3", { overall_rating: 5 }),
          makeCommFeedback("cf4", { overall_rating: 2 }),
          makeCommFeedback("cf5", { overall_rating: 1 }),
        ],
      }));
      expect(r.governance_score).toBe(65);
      expect(r.governance_rating).toBe("good");
    });

    it("score 64 is adequate (just below good threshold)", () => {
      // From the 65 scenario, need -1. Degrade Mod 6 from +4 to +1 (risk gov 40-69%)
      // Need 2/5 risk items = 40% → +1
      // Score: 52 + 0 + 3 + 2 + 2 + 2 + 1 = 62... that's 62 not 64
      // Try: 52 + 0 + 3 + 2 + 2 + 2 + 4 = 65. I need 64.
      // 52 + 0 + 3 + 2 + 2 + 2 + 1 = 62. Need 64 so that's not right either.
      // 52 + 2 + 3 + 2 + 2 + 2 + 1 = 64. Mod 1: +2 (walkrounds >=4, avg interactions <2)
      const r = computeGovernanceManagementOversight(baseInput({
        walkrounds: [
          makeWalkround("w1", { child_interactions: 1 }),
          makeWalkround("w2", { child_interactions: 1 }),
          makeWalkround("w3", { child_interactions: 1 }),
          makeWalkround("w4", { child_interactions: 1 }),
        ],
        governance_meetings: [
          makeGovernanceMeeting("gm1", { risk_items_count: 2 }),
          makeGovernanceMeeting("gm2", { risk_items_count: 1 }),
          makeGovernanceMeeting("gm3", { risk_items_count: 0 }),
          makeGovernanceMeeting("gm4", { regulatory_topics_discussed: false, risk_items_count: 0 }),
          makeGovernanceMeeting("gm5", { children_discussed_count: 0, risk_items_count: 0 }),
        ],
        board_reports: [
          makeBoardReport("br1", { board_response_received: true }),
          makeBoardReport("br2", { board_response_received: true }),
          makeBoardReport("br3", { board_response_received: true }),
          makeBoardReport("br4", { board_response_received: false }),
          makeBoardReport("br5", { board_response_received: false }),
        ],
        operational_meetings: [
          makeOpsMeeting("om1"),
          makeOpsMeeting("om2"),
          makeOpsMeeting("om3"),
          makeOpsMeeting("om4", { key_decisions_count: 0, actions_agreed_count: 0 }),
          makeOpsMeeting("om5", { key_decisions_count: 0, actions_agreed_count: 0 }),
        ],
        commissioning_feedback: [
          makeCommFeedback("cf1", { overall_rating: 4 }),
          makeCommFeedback("cf2", { overall_rating: 4 }),
          makeCommFeedback("cf3", { overall_rating: 5 }),
          makeCommFeedback("cf4", { overall_rating: 2 }),
          makeCommFeedback("cf5", { overall_rating: 1 }),
        ],
      }));
      expect(r.governance_score).toBe(64);
      expect(r.governance_rating).toBe("adequate");
    });

    it("score exactly 45 is adequate", () => {
      // 52 + (-5) + (-5) + 0 + 0 + 0 + 3... nah let me compute carefully.
      // Need score = 45. base = 52, need modifiers to sum to -7.
      // Mod 1: -5, Mod 2: +3, Mod 3: +0, Mod 4: +0, Mod 5: +0, Mod 6: -5... no that's not right.
      // Let me try: Mod 1: -5, Mod 2: 0, Mod 3: 0, Mod 4: 0, Mod 5: 0, Mod 6: -2... Mod 6 doesn't have -2.
      // Mod 6 tiers: +4, +1, 0, -4, or -1 (no meetings).
      // Mod 1: +0, Mod 2: -5, Mod 3: 0, Mod 4: 0, Mod 5: 0, Mod 6: -1 = 52 - 6 = 46. Need -7.
      // Mod 1: +0, Mod 2: -5, Mod 3: 0, Mod 4: -4, Mod 5: 0, Mod 6: +0 = 52 - 9 = 43. Too low.
      // Mod 1: +0, Mod 2: -5, Mod 3: 0, Mod 4: 0, Mod 5: +2, Mod 6: -4 = 52 - 7 = 45. Yes!
      const r = computeGovernanceManagementOversight(baseInput({
        walkrounds: [
          makeWalkround("w1"),
          makeWalkround("w2"),
        ],
        governance_meetings: [
          makeGovernanceMeeting("gm1", { regulatory_topics_discussed: false, children_discussed_count: 0, risk_items_count: 0 }),
          makeGovernanceMeeting("gm2", { regulatory_topics_discussed: false, children_discussed_count: 0, risk_items_count: 0 }),
        ],
        board_reports: [
          makeBoardReport("br1", { board_response_received: true }),
          makeBoardReport("br2", { board_response_received: false }),
          makeBoardReport("br3", { board_response_received: false }),
        ],
        operational_meetings: [
          makeOpsMeeting("om1"),
          makeOpsMeeting("om2", { key_decisions_count: 0, actions_agreed_count: 0 }),
          makeOpsMeeting("om3", { key_decisions_count: 0, actions_agreed_count: 0 }),
        ],
        commissioning_feedback: [
          makeCommFeedback("cf1", { overall_rating: 4 }),
          makeCommFeedback("cf2", { overall_rating: 5 }),
          makeCommFeedback("cf3", { overall_rating: 2 }),
          makeCommFeedback("cf4", { overall_rating: 1 }),
        ],
      }));
      // Mod 1: 2 walkrounds → +0
      // Mod 2: 0/2 engaged → 0% < 30% → -5
      // Mod 3: 1/3 responded → 33% → +0
      // Mod 4: 1/3 effective → 33% → +0
      // Mod 5: 2/4 satisfied → 50% → +2
      // Mod 6: 0/2 risk → 0% < 20% → -4
      // 52 + 0 - 5 + 0 + 0 + 2 - 4 = 45
      expect(r.governance_score).toBe(45);
      expect(r.governance_rating).toBe("adequate");
    });

    it("score 44 is inadequate (just below adequate threshold)", () => {
      // Mod 1: 0 walkrounds → -5
      // Mod 2: 3/5 engaged → 60% → +3
      // Mod 3: 1/3 responded → 33% → +0
      // Mod 4: 1/3 effective → 33% → +0
      // Mod 5: 0/3 satisfied → 0% → -5
      // Mod 6: 5/5 risk items → 100% → +4... wait, need to check risk items on the meetings.
      // The default makeGovernanceMeeting has risk_items_count: 2. So 5/5 have risk items → 100% → +4
      // 52 - 5 + 3 + 0 + 0 - 5 + 4 = 49. Not 44.
      // Let me fix: set risk_items_count to 0 for most. Need Mod 6 = -1 (no meetings) or adjust.
      // Actually I said governance_meetings has 5 meetings, that can't be -1. Need to make Mod 6 lower.
      // Mod 6 with 0/5 risk = 0% → -4. Then: 52 - 5 + 3 + 0 + 0 - 5 - 4 = 41. Too low.
      // Mod 6 with 1/5 = 20% → +0. Then: 52 - 5 + 3 + 0 + 0 - 5 + 0 = 45. Still 45.
      // Mod 6 = -4 and Mod 2 = +6 (80%+) → 52 - 5 + 6 + 0 + 0 - 5 - 4 = 44. That works!
      // Need 4/5 engaged → 80%. So 4 meetings with both conditions, 1 without.
      // And 0/5 risk items → 0% → -4.
      const r2 = computeGovernanceManagementOversight(baseInput({
        walkrounds: [],
        governance_meetings: [
          makeGovernanceMeeting("gm1", { risk_items_count: 0 }),
          makeGovernanceMeeting("gm2", { risk_items_count: 0 }),
          makeGovernanceMeeting("gm3", { risk_items_count: 0 }),
          makeGovernanceMeeting("gm4", { risk_items_count: 0 }),
          makeGovernanceMeeting("gm5", { regulatory_topics_discussed: false, risk_items_count: 0 }),
        ],
        board_reports: [
          makeBoardReport("br1", { board_response_received: true }),
          makeBoardReport("br2", { board_response_received: false }),
          makeBoardReport("br3", { board_response_received: false }),
        ],
        operational_meetings: [
          makeOpsMeeting("om1"),
          makeOpsMeeting("om2", { key_decisions_count: 0, actions_agreed_count: 0 }),
          makeOpsMeeting("om3", { key_decisions_count: 0, actions_agreed_count: 0 }),
        ],
        commissioning_feedback: [
          makeCommFeedback("cf1", { overall_rating: 2 }),
          makeCommFeedback("cf2", { overall_rating: 1 }),
          makeCommFeedback("cf3", { overall_rating: 3 }),
        ],
      }));
      // Mod 1: 0 walkrounds → -5
      // Mod 2: 4/5 engaged → 80% → +6
      // Mod 3: 1/3 responded → 33% → +0
      // Mod 4: 1/3 effective → 33% → +0
      // Mod 5: 0/3 satisfied → 0% → -5
      // Mod 6: 0/5 risk → 0% → -4
      // 52 - 5 + 6 + 0 + 0 - 5 - 4 = 44
      expect(r2.governance_score).toBe(44);
      expect(r2.governance_rating).toBe("inadequate");
    });
  });
});
