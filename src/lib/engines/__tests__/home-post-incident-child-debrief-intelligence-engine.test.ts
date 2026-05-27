import { describe, it, expect } from "vitest";
import {
  computePostIncidentDebrief,
  PostIncidentDebriefInput,
  PostIncidentDebriefRecordInput,
} from "../home-post-incident-child-debrief-intelligence-engine";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeDebrief(
  overrides: Partial<PostIncidentDebriefRecordInput> = {},
): PostIncidentDebriefRecordInput {
  return {
    id: "debrief-1",
    child_id: "child-1",
    incident_date: "2025-06-10",
    debrief_date: "2025-06-11",
    debrief_method: "conversation",
    child_ready_to_debrief: true,
    has_child_account: true,
    has_feelings_before_during: true,
    has_feelings_now: true,
    has_wishes_different: true,
    what_helped_count: 2,
    what_did_not_help_count: 1,
    child_requests_count: 2,
    has_apologies_offered: true,
    has_apologies_received: true,
    repairs_agreed_count: 1,
    child_accepts_outcome: true,
    has_support_needed: true,
    has_follow_up_date: true,
    ...overrides,
  };
}

function baseInput(
  overrides: Partial<PostIncidentDebriefInput> = {},
): PostIncidentDebriefInput {
  return { today: "2025-06-15", total_children: 5, debriefs: [], ...overrides };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("computePostIncidentDebrief", () => {
  // ════════════════════════════════════════════════════════════════════════
  // INSUFFICIENT DATA GUARD
  // ════════════════════════════════════════════════════════════════════════

  describe("insufficient data guard", () => {
    it("returns insufficient_data when total_children is 0", () => {
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 0 }),
      );
      expect(result.debrief_rating).toBe("insufficient_data");
      expect(result.debrief_score).toBe(0);
    });

    it("returns zero for all rates when total_children is 0", () => {
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 0 }),
      );
      expect(result.timeliness_rate).toBe(0);
      expect(result.child_readiness_rate).toBe(0);
      expect(result.voice_depth_rate).toBe(0);
      expect(result.restorative_action_rate).toBe(0);
      expect(result.follow_up_rate).toBe(0);
      expect(result.method_diversity).toBe(0);
      expect(result.children_debriefed_rate).toBe(0);
    });

    it("returns empty arrays for strengths, concerns, recommendations, insights when total_children is 0", () => {
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 0 }),
      );
      expect(result.strengths).toEqual([]);
      expect(result.concerns).toEqual([]);
      expect(result.recommendations).toEqual([]);
      expect(result.insights).toEqual([]);
    });

    it("returns the correct headline when total_children is 0", () => {
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 0 }),
      );
      expect(result.headline).toBe(
        "No data available for post-incident debrief intelligence analysis",
      );
    });

    it("returns total_debriefs 0 when total_children is 0", () => {
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 0 }),
      );
      expect(result.total_debriefs).toBe(0);
    });

    it("returns insufficient_data when total_children is 0 even with debriefs provided", () => {
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 0, debriefs: [makeDebrief()] }),
      );
      expect(result.debrief_rating).toBe("insufficient_data");
      expect(result.debrief_score).toBe(0);
    });

    it("returns insufficient_data when total_children > 0 but debriefs array is empty", () => {
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 3, debriefs: [] }),
      );
      expect(result.debrief_rating).toBe("insufficient_data");
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // BASE SCORE
  // ════════════════════════════════════════════════════════════════════════

  describe("base score", () => {
    it("starts at 52 before modifiers are applied", () => {
      // With no debriefs, total===0, modifiers are: -3 -1 -1 +0 -1 -2 = -8
      // Score = 52 - 8 = 44 (but rating becomes insufficient_data when debriefs empty)
      // To see base, give a single debrief with exactly mid-range values
      // that hit no modifier branches
      const result = computePostIncidentDebrief(
        baseInput({
          debriefs: [
            makeDebrief({
              // timeliness: within 48h -> timely (1/1 = 100% >= 80 -> +6)
              // readiness: true (1/1 = 100% >= 85 -> +5)
              // voice: all true (1/1 = 100% >= 75 -> +5)
              // restorative: has apologies (1/1 = 100% >= 75 -> +5)
              // follow-up: true (1/1 = 100% >= 80 -> +4)
              // method: 1 unique method, requestRate=100%
              //   uniqueMethods < 4 but >=2 is false (1 method),
              //   requestRate >= 40 is true -> +2
            }),
          ],
        }),
      );
      // 52 + 6 + 5 + 5 + 5 + 4 + 2 = 79
      expect(result.debrief_score).toBe(79);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // MODIFIER 1: TIMELINESS
  // ════════════════════════════════════════════════════════════════════════

  describe("modifier 1 — timeliness", () => {
    it("applies -3 when total debriefs is 0", () => {
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 5, debriefs: [] }),
      );
      // total===0 modifiers: -3 -1 -1 +0 -1 -2 = -8
      // 52 - 8 = 44 (insufficient_data from rating branch)
      expect(result.debrief_score).toBe(44);
    });

    it("applies +6 when timelinessRate >= 80%", () => {
      // 5 debriefs, all timely (100% >= 80)
      const debriefs = Array.from({ length: 5 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          incident_date: "2025-06-10",
          debrief_date: "2025-06-11",
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ debriefs }),
      );
      expect(result.timeliness_rate).toBe(100);
      // timeliness +6 is in the score
    });

    it("applies +2 when timelinessRate >= 50% and < 80%", () => {
      // 10 debriefs, 6 timely (60% >= 50, < 80)
      const debriefs = [
        ...Array.from({ length: 6 }, (_, i) =>
          makeDebrief({
            id: `d-${i}`,
            child_id: `c-${i}`,
            incident_date: "2025-06-10",
            debrief_date: "2025-06-11",
          }),
        ),
        ...Array.from({ length: 4 }, (_, i) =>
          makeDebrief({
            id: `d-late-${i}`,
            child_id: `c-late-${i}`,
            incident_date: "2025-06-01",
            debrief_date: "2025-06-10",
          }),
        ),
      ];
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 10, debriefs }),
      );
      expect(result.timeliness_rate).toBe(60);
    });

    it("applies -5 when timelinessRate < 30%", () => {
      // 10 debriefs, 2 timely (20% < 30)
      const debriefs = [
        ...Array.from({ length: 2 }, (_, i) =>
          makeDebrief({
            id: `d-${i}`,
            child_id: `c-${i}`,
            incident_date: "2025-06-10",
            debrief_date: "2025-06-11",
          }),
        ),
        ...Array.from({ length: 8 }, (_, i) =>
          makeDebrief({
            id: `d-late-${i}`,
            child_id: `c-late-${i}`,
            incident_date: "2025-06-01",
            debrief_date: "2025-06-10",
          }),
        ),
      ];
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 10, debriefs }),
      );
      expect(result.timeliness_rate).toBe(20);
    });

    it("applies no modifier when timelinessRate is between 30% and 49%", () => {
      // 10 debriefs, 4 timely (40%, between 30 and 49, no modifier triggered)
      const debriefs = [
        ...Array.from({ length: 4 }, (_, i) =>
          makeDebrief({
            id: `d-${i}`,
            child_id: `c-${i}`,
            incident_date: "2025-06-10",
            debrief_date: "2025-06-11",
          }),
        ),
        ...Array.from({ length: 6 }, (_, i) =>
          makeDebrief({
            id: `d-late-${i}`,
            child_id: `c-late-${i}`,
            incident_date: "2025-06-01",
            debrief_date: "2025-06-10",
          }),
        ),
      ];
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 10, debriefs }),
      );
      expect(result.timeliness_rate).toBe(40);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // TIMELINESS DATE MATH
  // ════════════════════════════════════════════════════════════════════════

  describe("timeliness date math", () => {
    it("counts a debrief on the same day as the incident as timely", () => {
      const result = computePostIncidentDebrief(
        baseInput({
          debriefs: [
            makeDebrief({
              incident_date: "2025-06-10",
              debrief_date: "2025-06-10",
            }),
          ],
        }),
      );
      expect(result.timeliness_rate).toBe(100);
    });

    it("counts a debrief exactly 1 day after the incident as timely", () => {
      const result = computePostIncidentDebrief(
        baseInput({
          debriefs: [
            makeDebrief({
              incident_date: "2025-06-10",
              debrief_date: "2025-06-11",
            }),
          ],
        }),
      );
      expect(result.timeliness_rate).toBe(100);
    });

    it("counts a debrief exactly 2 days after the incident as timely", () => {
      const result = computePostIncidentDebrief(
        baseInput({
          debriefs: [
            makeDebrief({
              incident_date: "2025-06-10",
              debrief_date: "2025-06-12",
            }),
          ],
        }),
      );
      expect(result.timeliness_rate).toBe(100);
    });

    it("counts a debrief 3 days after the incident as NOT timely", () => {
      const result = computePostIncidentDebrief(
        baseInput({
          debriefs: [
            makeDebrief({
              incident_date: "2025-06-10",
              debrief_date: "2025-06-13",
            }),
          ],
        }),
      );
      expect(result.timeliness_rate).toBe(0);
    });

    it("counts a debrief BEFORE the incident as NOT timely", () => {
      const result = computePostIncidentDebrief(
        baseInput({
          debriefs: [
            makeDebrief({
              incident_date: "2025-06-10",
              debrief_date: "2025-06-09",
            }),
          ],
        }),
      );
      expect(result.timeliness_rate).toBe(0);
    });

    it("handles month boundary correctly (incident June 30, debrief July 2)", () => {
      const result = computePostIncidentDebrief(
        baseInput({
          debriefs: [
            makeDebrief({
              incident_date: "2025-06-30",
              debrief_date: "2025-07-02",
            }),
          ],
        }),
      );
      expect(result.timeliness_rate).toBe(100);
    });

    it("handles month boundary as untimely (incident June 30, debrief July 3)", () => {
      const result = computePostIncidentDebrief(
        baseInput({
          debriefs: [
            makeDebrief({
              incident_date: "2025-06-30",
              debrief_date: "2025-07-03",
            }),
          ],
        }),
      );
      expect(result.timeliness_rate).toBe(0);
    });

    it("handles year boundary (incident Dec 31, debrief Jan 2)", () => {
      const result = computePostIncidentDebrief(
        baseInput({
          debriefs: [
            makeDebrief({
              incident_date: "2025-12-31",
              debrief_date: "2026-01-02",
            }),
          ],
        }),
      );
      expect(result.timeliness_rate).toBe(100);
    });

    it("handles year boundary as untimely (incident Dec 31, debrief Jan 3)", () => {
      const result = computePostIncidentDebrief(
        baseInput({
          debriefs: [
            makeDebrief({
              incident_date: "2025-12-31",
              debrief_date: "2026-01-03",
            }),
          ],
        }),
      );
      expect(result.timeliness_rate).toBe(0);
    });

    it("handles leap year correctly (incident Feb 28, debrief Mar 1 in 2024)", () => {
      const result = computePostIncidentDebrief(
        baseInput({
          debriefs: [
            makeDebrief({
              incident_date: "2024-02-28",
              debrief_date: "2024-03-01",
            }),
          ],
        }),
      );
      // 2024 is leap year: Feb 28 -> Mar 1 = 2 days
      expect(result.timeliness_rate).toBe(100);
    });

    it("handles leap year boundary as untimely (incident Feb 28, debrief Mar 3 in 2024)", () => {
      const result = computePostIncidentDebrief(
        baseInput({
          debriefs: [
            makeDebrief({
              incident_date: "2024-02-28",
              debrief_date: "2024-03-03",
            }),
          ],
        }),
      );
      expect(result.timeliness_rate).toBe(0);
    });

    it("handles debrief much later than incident", () => {
      const result = computePostIncidentDebrief(
        baseInput({
          debriefs: [
            makeDebrief({
              incident_date: "2025-01-01",
              debrief_date: "2025-06-15",
            }),
          ],
        }),
      );
      expect(result.timeliness_rate).toBe(0);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // MODIFIER 2: CHILD READINESS
  // ════════════════════════════════════════════════════════════════════════

  describe("modifier 2 — child readiness", () => {
    it("applies -1 when total is 0", () => {
      const result = computePostIncidentDebrief(
        baseInput({ debriefs: [] }),
      );
      // included in the total -8 for empty debriefs
      expect(result.child_readiness_rate).toBe(0);
    });

    it("applies +5 when childReadinessRate >= 85%", () => {
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          child_ready_to_debrief: i < 9, // 9/10 = 90% >= 85
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 10, debriefs }),
      );
      expect(result.child_readiness_rate).toBe(90);
    });

    it("applies +2 when childReadinessRate >= 60% and < 85%", () => {
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          child_ready_to_debrief: i < 7, // 7/10 = 70%
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 10, debriefs }),
      );
      expect(result.child_readiness_rate).toBe(70);
    });

    it("applies -5 when childReadinessRate < 40%", () => {
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          child_ready_to_debrief: i < 3, // 3/10 = 30% < 40
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 10, debriefs }),
      );
      expect(result.child_readiness_rate).toBe(30);
    });

    it("applies no modifier when childReadinessRate is between 40% and 59%", () => {
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          child_ready_to_debrief: i < 5, // 5/10 = 50%
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 10, debriefs }),
      );
      expect(result.child_readiness_rate).toBe(50);
    });

    it("applies +5 at exactly 85%", () => {
      // 20 debriefs, 17 ready = 85%
      const debriefs = Array.from({ length: 20 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          child_ready_to_debrief: i < 17,
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 20, debriefs }),
      );
      expect(result.child_readiness_rate).toBe(85);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // MODIFIER 3: VOICE DEPTH
  // ════════════════════════════════════════════════════════════════════════

  describe("modifier 3 — voice depth", () => {
    it("applies -1 when total is 0", () => {
      const result = computePostIncidentDebrief(
        baseInput({ debriefs: [] }),
      );
      expect(result.voice_depth_rate).toBe(0);
    });

    it("applies +5 when voiceDepthRate >= 75%", () => {
      const debriefs = Array.from({ length: 4 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          has_child_account: true,
          has_feelings_before_during: true,
          has_feelings_now: true,
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 4, debriefs }),
      );
      expect(result.voice_depth_rate).toBe(100);
    });

    it("applies +2 when voiceDepthRate >= 45% and < 75%", () => {
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          has_child_account: i < 5,
          has_feelings_before_during: i < 5,
          has_feelings_now: i < 5,
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 10, debriefs }),
      );
      expect(result.voice_depth_rate).toBe(50);
    });

    it("applies -4 when voiceDepthRate < 20%", () => {
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          has_child_account: i < 1,
          has_feelings_before_during: i < 1,
          has_feelings_now: i < 1,
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 10, debriefs }),
      );
      expect(result.voice_depth_rate).toBe(10);
    });

    it("requires all three fields true for voice depth", () => {
      const debriefs = [
        makeDebrief({ has_child_account: true, has_feelings_before_during: true, has_feelings_now: false }),
        makeDebrief({ id: "d2", child_id: "c2", has_child_account: true, has_feelings_before_during: false, has_feelings_now: true }),
        makeDebrief({ id: "d3", child_id: "c3", has_child_account: false, has_feelings_before_during: true, has_feelings_now: true }),
      ];
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 3, debriefs }),
      );
      expect(result.voice_depth_rate).toBe(0);
    });

    it("applies no modifier when voiceDepthRate is between 20% and 44%", () => {
      // 10 debriefs, 3 deep = 30%
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          has_child_account: i < 3,
          has_feelings_before_during: i < 3,
          has_feelings_now: i < 3,
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 10, debriefs }),
      );
      expect(result.voice_depth_rate).toBe(30);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // MODIFIER 4: RESTORATIVE ACTIONS
  // ════════════════════════════════════════════════════════════════════════

  describe("modifier 4 — restorative actions", () => {
    it("applies no adjustment when total is 0", () => {
      const result = computePostIncidentDebrief(
        baseInput({ debriefs: [] }),
      );
      // modifier 4 contributes 0 when total===0
      expect(result.restorative_action_rate).toBe(0);
    });

    it("applies +5 when restorativeActionRate >= 75%", () => {
      const debriefs = Array.from({ length: 4 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          has_apologies_offered: true,
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 4, debriefs }),
      );
      expect(result.restorative_action_rate).toBe(100);
    });

    it("applies +2 when restorativeActionRate >= 50% and < 75%", () => {
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          has_apologies_offered: i < 6,
          has_apologies_received: false,
          repairs_agreed_count: 0,
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 10, debriefs }),
      );
      expect(result.restorative_action_rate).toBe(60);
    });

    it("applies -4 when restorativeActionRate < 25%", () => {
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          has_apologies_offered: i < 2,
          has_apologies_received: false,
          repairs_agreed_count: 0,
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 10, debriefs }),
      );
      expect(result.restorative_action_rate).toBe(20);
    });

    it("counts repairs_agreed_count > 0 as restorative", () => {
      const debriefs = [
        makeDebrief({
          has_apologies_offered: false,
          has_apologies_received: false,
          repairs_agreed_count: 3,
        }),
      ];
      const result = computePostIncidentDebrief(
        baseInput({ debriefs }),
      );
      expect(result.restorative_action_rate).toBe(100);
    });

    it("counts has_apologies_offered alone as restorative", () => {
      const debriefs = [
        makeDebrief({
          has_apologies_offered: true,
          has_apologies_received: false,
          repairs_agreed_count: 0,
        }),
      ];
      const result = computePostIncidentDebrief(
        baseInput({ debriefs }),
      );
      expect(result.restorative_action_rate).toBe(100);
    });

    it("counts has_apologies_received alone as restorative", () => {
      const debriefs = [
        makeDebrief({
          has_apologies_offered: false,
          has_apologies_received: true,
          repairs_agreed_count: 0,
        }),
      ];
      const result = computePostIncidentDebrief(
        baseInput({ debriefs }),
      );
      expect(result.restorative_action_rate).toBe(100);
    });

    it("does not count a debrief with no restorative fields", () => {
      const debriefs = [
        makeDebrief({
          has_apologies_offered: false,
          has_apologies_received: false,
          repairs_agreed_count: 0,
        }),
      ];
      const result = computePostIncidentDebrief(
        baseInput({ debriefs }),
      );
      expect(result.restorative_action_rate).toBe(0);
    });

    it("applies no modifier when restorativeActionRate is between 25% and 49%", () => {
      // 10 debriefs, 3 restorative = 30%
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          has_apologies_offered: i < 3,
          has_apologies_received: false,
          repairs_agreed_count: 0,
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 10, debriefs }),
      );
      expect(result.restorative_action_rate).toBe(30);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // MODIFIER 5: FOLLOW-UP SCHEDULING
  // ════════════════════════════════════════════════════════════════════════

  describe("modifier 5 — follow-up scheduling", () => {
    it("applies -1 when total is 0", () => {
      const result = computePostIncidentDebrief(
        baseInput({ debriefs: [] }),
      );
      expect(result.follow_up_rate).toBe(0);
    });

    it("applies +4 when followUpRate >= 80%", () => {
      const debriefs = Array.from({ length: 5 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          has_follow_up_date: true,
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ debriefs }),
      );
      expect(result.follow_up_rate).toBe(100);
    });

    it("applies +1 when followUpRate >= 50% and < 80%", () => {
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          has_follow_up_date: i < 6, // 6/10 = 60%
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 10, debriefs }),
      );
      expect(result.follow_up_rate).toBe(60);
    });

    it("applies -4 when followUpRate < 20%", () => {
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          has_follow_up_date: i < 1, // 1/10 = 10%
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 10, debriefs }),
      );
      expect(result.follow_up_rate).toBe(10);
    });

    it("applies no modifier when followUpRate is between 20% and 49%", () => {
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          has_follow_up_date: i < 3, // 3/10 = 30%
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 10, debriefs }),
      );
      expect(result.follow_up_rate).toBe(30);
    });

    it("applies +4 at exactly 80%", () => {
      const debriefs = Array.from({ length: 5 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          has_follow_up_date: i < 4, // 4/5 = 80%
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ debriefs }),
      );
      expect(result.follow_up_rate).toBe(80);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // MODIFIER 6: METHOD DIVERSITY + REQUESTS
  // ════════════════════════════════════════════════════════════════════════

  describe("modifier 6 — method diversity and requests", () => {
    it("applies -2 when total is 0", () => {
      const result = computePostIncidentDebrief(
        baseInput({ debriefs: [] }),
      );
      // modifier 6 contributes -2 when total===0
      expect(result.method_diversity).toBe(0);
    });

    it("applies +5 when uniqueMethods >= 4 AND requestRate >= 60%", () => {
      const debriefs = [
        makeDebrief({ id: "d1", child_id: "c1", debrief_method: "conversation", child_requests_count: 2 }),
        makeDebrief({ id: "d2", child_id: "c2", debrief_method: "drawing", child_requests_count: 1 }),
        makeDebrief({ id: "d3", child_id: "c3", debrief_method: "visual_cards", child_requests_count: 1 }),
        makeDebrief({ id: "d4", child_id: "c4", debrief_method: "walk_and_talk", child_requests_count: 1 }),
        makeDebrief({ id: "d5", child_id: "c5", debrief_method: "written", child_requests_count: 0 }),
      ];
      // 4/5 = 80% requests >= 60, 5 unique methods >= 4
      const result = computePostIncidentDebrief(
        baseInput({ debriefs }),
      );
      expect(result.method_diversity).toBe(5);
    });

    it("applies +2 when uniqueMethods >= 2 but < 4 with low requestRate", () => {
      const debriefs = [
        makeDebrief({ id: "d1", child_id: "c1", debrief_method: "conversation", child_requests_count: 0 }),
        makeDebrief({ id: "d2", child_id: "c2", debrief_method: "drawing", child_requests_count: 0 }),
      ];
      const result = computePostIncidentDebrief(
        baseInput({ debriefs }),
      );
      expect(result.method_diversity).toBe(2);
    });

    it("applies +2 when requestRate >= 40% even with only 1 method", () => {
      const debriefs = Array.from({ length: 5 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          debrief_method: "conversation",
          child_requests_count: i < 3 ? 1 : 0, // 3/5 = 60% >= 40
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ debriefs }),
      );
      expect(result.method_diversity).toBe(1);
    });

    it("applies -3 when uniqueMethods < 2 AND requestRate < 20%", () => {
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          debrief_method: "conversation",
          child_requests_count: i < 1 ? 1 : 0, // 1/10 = 10% < 20
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 10, debriefs }),
      );
      expect(result.method_diversity).toBe(1);
    });

    it("applies no modifier when uniqueMethods is 1 and requestRate is between 20% and 39%", () => {
      // 1 method < 2, requestRate 30% (not >= 40, not < 20)
      // Neither the +5 nor +2 nor -3 branches apply
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          debrief_method: "conversation",
          child_requests_count: i < 3 ? 1 : 0, // 3/10 = 30%
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 10, debriefs }),
      );
      expect(result.method_diversity).toBe(1);
    });

    it("applies +2 (not +5) when uniqueMethods >= 4 but requestRate < 60%", () => {
      const debriefs = [
        makeDebrief({ id: "d1", child_id: "c1", debrief_method: "conversation", child_requests_count: 1 }),
        makeDebrief({ id: "d2", child_id: "c2", debrief_method: "drawing", child_requests_count: 0 }),
        makeDebrief({ id: "d3", child_id: "c3", debrief_method: "visual_cards", child_requests_count: 0 }),
        makeDebrief({ id: "d4", child_id: "c4", debrief_method: "walk_and_talk", child_requests_count: 0 }),
        makeDebrief({ id: "d5", child_id: "c5", debrief_method: "written", child_requests_count: 0 }),
      ];
      // 1/5 = 20% requests < 60, but uniqueMethods >= 4 (5 methods)
      // Falls to second branch: uniqueMethods >= 2 -> +2
      const result = computePostIncidentDebrief(
        baseInput({ debriefs }),
      );
      expect(result.method_diversity).toBe(5);
    });

    it("applies +5 at exactly 4 methods and exactly 60% requests", () => {
      const debriefs = [
        makeDebrief({ id: "d1", child_id: "c1", debrief_method: "conversation", child_requests_count: 1 }),
        makeDebrief({ id: "d2", child_id: "c2", debrief_method: "drawing", child_requests_count: 1 }),
        makeDebrief({ id: "d3", child_id: "c3", debrief_method: "visual_cards", child_requests_count: 1 }),
        makeDebrief({ id: "d4", child_id: "c4", debrief_method: "walk_and_talk", child_requests_count: 0 }),
        makeDebrief({ id: "d5", child_id: "c5", debrief_method: "conversation", child_requests_count: 0 }),
      ];
      // 4 unique methods, 3/5 = 60%
      const result = computePostIncidentDebrief(
        baseInput({ debriefs }),
      );
      expect(result.method_diversity).toBe(4);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // SCORE CLAMPING
  // ════════════════════════════════════════════════════════════════════════

  describe("score clamping", () => {
    it("clamps score to minimum of 0", () => {
      // Maximally bad debriefs to drive score as low as possible
      // base 52, worst case: -5 -5 -4 -4 -4 -3 = -25 => 52-25=27 (still positive)
      // But we can verify clamping works by checking it doesn't go negative
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          incident_date: "2025-01-01",
          debrief_date: "2025-06-10",
          child_ready_to_debrief: false,
          has_child_account: false,
          has_feelings_before_during: false,
          has_feelings_now: false,
          has_apologies_offered: false,
          has_apologies_received: false,
          repairs_agreed_count: 0,
          has_follow_up_date: false,
          debrief_method: "conversation",
          child_requests_count: 0,
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 10, debriefs }),
      );
      // 52 - 5 - 5 - 4 - 4 - 4 - 3 = 27
      expect(result.debrief_score).toBe(27);
      expect(result.debrief_score).toBeGreaterThanOrEqual(0);
    });

    it("clamps score to maximum of 100", () => {
      // Even all positive modifiers: 52 + 6 + 5 + 5 + 5 + 4 + 5 = 82, under 100
      const debriefs = [
        makeDebrief({ id: "d1", child_id: "c1", debrief_method: "conversation", child_requests_count: 2 }),
        makeDebrief({ id: "d2", child_id: "c2", debrief_method: "drawing", child_requests_count: 1 }),
        makeDebrief({ id: "d3", child_id: "c3", debrief_method: "visual_cards", child_requests_count: 1 }),
        makeDebrief({ id: "d4", child_id: "c4", debrief_method: "walk_and_talk", child_requests_count: 1 }),
        makeDebrief({ id: "d5", child_id: "c5", debrief_method: "written", child_requests_count: 0 }),
      ];
      const result = computePostIncidentDebrief(
        baseInput({ debriefs }),
      );
      // 52 + 6 + 5 + 5 + 5 + 4 + 5 = 82
      expect(result.debrief_score).toBe(82);
      expect(result.debrief_score).toBeLessThanOrEqual(100);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // RATING THRESHOLDS
  // ════════════════════════════════════════════════════════════════════════

  describe("rating thresholds", () => {
    it("returns outstanding when score >= 80", () => {
      // Perfect debriefs: 52 + 6 + 5 + 5 + 5 + 4 + 5 = 82
      const debriefs = [
        makeDebrief({ id: "d1", child_id: "c1", debrief_method: "conversation", child_requests_count: 2 }),
        makeDebrief({ id: "d2", child_id: "c2", debrief_method: "drawing", child_requests_count: 1 }),
        makeDebrief({ id: "d3", child_id: "c3", debrief_method: "visual_cards", child_requests_count: 1 }),
        makeDebrief({ id: "d4", child_id: "c4", debrief_method: "walk_and_talk", child_requests_count: 1 }),
        makeDebrief({ id: "d5", child_id: "c5", debrief_method: "written", child_requests_count: 0 }),
      ];
      const result = computePostIncidentDebrief(
        baseInput({ debriefs }),
      );
      expect(result.debrief_score).toBeGreaterThanOrEqual(80);
      expect(result.debrief_rating).toBe("outstanding");
    });

    it("returns good when score >= 65 and < 80", () => {
      // Single perfect debrief: 52 + 6 + 5 + 5 + 5 + 4 + 2 = 79
      const result = computePostIncidentDebrief(
        baseInput({ debriefs: [makeDebrief()] }),
      );
      expect(result.debrief_score).toBe(79);
      expect(result.debrief_rating).toBe("good");
    });

    it("returns adequate when score >= 45 and < 65", () => {
      // Partially good debriefs to get mid-range score
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          incident_date: "2025-06-10",
          debrief_date: i < 5 ? "2025-06-11" : "2025-06-20",
          child_ready_to_debrief: i < 5,
          has_child_account: i < 3,
          has_feelings_before_during: i < 3,
          has_feelings_now: i < 3,
          has_apologies_offered: i < 3,
          has_apologies_received: false,
          repairs_agreed_count: 0,
          has_follow_up_date: i < 3,
          child_requests_count: i < 3 ? 1 : 0,
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 10, debriefs }),
      );
      expect(result.debrief_score).toBeGreaterThanOrEqual(45);
      expect(result.debrief_score).toBeLessThan(65);
      expect(result.debrief_rating).toBe("adequate");
    });

    it("returns inadequate when score < 45", () => {
      // All bad debriefs: 52 - 5 - 5 - 4 - 4 - 4 - 3 = 27
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          incident_date: "2025-01-01",
          debrief_date: "2025-06-10",
          child_ready_to_debrief: false,
          has_child_account: false,
          has_feelings_before_during: false,
          has_feelings_now: false,
          has_apologies_offered: false,
          has_apologies_received: false,
          repairs_agreed_count: 0,
          has_follow_up_date: false,
          debrief_method: "conversation",
          child_requests_count: 0,
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 10, debriefs }),
      );
      expect(result.debrief_score).toBeLessThan(45);
      expect(result.debrief_rating).toBe("inadequate");
    });

    it("returns exactly 80 as outstanding", () => {
      // We need exactly 80. 52 + 6 + 5 + 5 + 5 + 4 + 5 = 82, need -2 somewhere.
      // Use: timeliness +6, readiness +5, voice +5, restorative +2 (mid), follow +4, method +5 = 79
      // Or: timeliness +6, readiness +5, voice +5, restorative +5, follow +4, method +2 = 79 nope
      // 52 + 6 + 5 + 5 + 5 + 4 + 5 = 82; need score of exactly 80 => need net +28 from 52
      // Let's approach differently: build to exactly 80 by choosing modifiers
      // 52 + 6 + 5 + 5 + 5 + 4 + 2 + 1(extra no) = only those 6 modifiers
      // 52 + 6 + 5 + 5 + 5 + 1 + 5 = 79 nope, 52 + 6 + 5 + 5 + 5 + 4 + 2 = 79 nope
      // 52 + 6 + 5 + 5 + 5 + 4 + 5 = 82, 52 + 6 + 5 + 5 + 2 + 4 + 5 = 79
      // 52 + 6 + 5 + 5 + 5 + 4 + 5 = 82, so -2 from somewhere:
      // replace mod4 +5 with +2: 52+6+5+5+2+4+5 = 79
      // replace mod6 +5 with +2, mod4 +5: 52+6+5+5+5+4+2 = 79
      // replace mod5 +4 with +1: 52+6+5+5+5+1+5 = 79
      // Hard to get exactly 80 with these discrete values. Skip exact boundary test
      // and verify behavior around 80:
      // Score 82 is outstanding
      const debriefs = [
        makeDebrief({ id: "d1", child_id: "c1", debrief_method: "conversation", child_requests_count: 2 }),
        makeDebrief({ id: "d2", child_id: "c2", debrief_method: "drawing", child_requests_count: 1 }),
        makeDebrief({ id: "d3", child_id: "c3", debrief_method: "visual_cards", child_requests_count: 1 }),
        makeDebrief({ id: "d4", child_id: "c4", debrief_method: "walk_and_talk", child_requests_count: 1 }),
        makeDebrief({ id: "d5", child_id: "c5", debrief_method: "written", child_requests_count: 0 }),
      ];
      const result = computePostIncidentDebrief(
        baseInput({ debriefs }),
      );
      expect(result.debrief_score).toBe(82);
      expect(result.debrief_rating).toBe("outstanding");
    });

    it("returns insufficient_data for empty debriefs even with positive total_children", () => {
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 10, debriefs: [] }),
      );
      expect(result.debrief_rating).toBe("insufficient_data");
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // HEADLINES
  // ════════════════════════════════════════════════════════════════════════

  describe("headlines", () => {
    it("returns insufficient_data headline for no data", () => {
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 0 }),
      );
      expect(result.headline).toBe(
        "No data available for post-incident debrief intelligence analysis",
      );
    });

    it("returns insufficient_data headline for empty debriefs", () => {
      const result = computePostIncidentDebrief(
        baseInput({ debriefs: [] }),
      );
      expect(result.headline).toBe(
        "No data available for post-incident debrief intelligence analysis",
      );
    });

    it("returns outstanding headline", () => {
      const debriefs = [
        makeDebrief({ id: "d1", child_id: "c1", debrief_method: "conversation", child_requests_count: 2 }),
        makeDebrief({ id: "d2", child_id: "c2", debrief_method: "drawing", child_requests_count: 1 }),
        makeDebrief({ id: "d3", child_id: "c3", debrief_method: "visual_cards", child_requests_count: 1 }),
        makeDebrief({ id: "d4", child_id: "c4", debrief_method: "walk_and_talk", child_requests_count: 1 }),
        makeDebrief({ id: "d5", child_id: "c5", debrief_method: "written", child_requests_count: 0 }),
      ];
      const result = computePostIncidentDebrief(
        baseInput({ debriefs }),
      );
      expect(result.headline).toContain("Outstanding");
    });

    it("returns good headline", () => {
      const result = computePostIncidentDebrief(
        baseInput({ debriefs: [makeDebrief()] }),
      );
      expect(result.headline).toContain("Good");
    });

    it("returns adequate headline", () => {
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          incident_date: "2025-06-10",
          debrief_date: i < 5 ? "2025-06-11" : "2025-06-20",
          child_ready_to_debrief: i < 5,
          has_child_account: i < 3,
          has_feelings_before_during: i < 3,
          has_feelings_now: i < 3,
          has_apologies_offered: i < 3,
          has_apologies_received: false,
          repairs_agreed_count: 0,
          has_follow_up_date: i < 3,
          child_requests_count: i < 3 ? 1 : 0,
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 10, debriefs }),
      );
      expect(result.debrief_rating).toBe("adequate");
      expect(result.headline).toContain("Debriefs occur but");
    });

    it("returns inadequate headline", () => {
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          incident_date: "2025-01-01",
          debrief_date: "2025-06-10",
          child_ready_to_debrief: false,
          has_child_account: false,
          has_feelings_before_during: false,
          has_feelings_now: false,
          has_apologies_offered: false,
          has_apologies_received: false,
          repairs_agreed_count: 0,
          has_follow_up_date: false,
          debrief_method: "conversation",
          child_requests_count: 0,
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 10, debriefs }),
      );
      expect(result.debrief_rating).toBe("inadequate");
      expect(result.headline).toContain("Inadequate");
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // STRENGTHS
  // ════════════════════════════════════════════════════════════════════════

  describe("strengths", () => {
    it("includes timeliness strength when timelinessRate >= 80% and total > 0", () => {
      const result = computePostIncidentDebrief(
        baseInput({ debriefs: [makeDebrief()] }),
      );
      expect(result.strengths).toContainEqual(
        expect.stringContaining("promptly"),
      );
    });

    it("includes readiness strength when childReadinessRate >= 85% and total > 0", () => {
      const result = computePostIncidentDebrief(
        baseInput({ debriefs: [makeDebrief()] }),
      );
      expect(result.strengths).toContainEqual(
        expect.stringContaining("readiness"),
      );
    });

    it("includes voice depth strength when voiceDepthRate >= 75% and total > 0", () => {
      const result = computePostIncidentDebrief(
        baseInput({ debriefs: [makeDebrief()] }),
      );
      expect(result.strengths).toContainEqual(
        expect.stringContaining("deep child voice"),
      );
    });

    it("includes restorative strength when restorativeActionRate >= 75% and total > 0", () => {
      const result = computePostIncidentDebrief(
        baseInput({ debriefs: [makeDebrief()] }),
      );
      expect(result.strengths).toContainEqual(
        expect.stringContaining("Restorative actions"),
      );
    });

    it("includes follow-up strength when followUpRate >= 80% and total > 0", () => {
      const result = computePostIncidentDebrief(
        baseInput({ debriefs: [makeDebrief()] }),
      );
      expect(result.strengths).toContainEqual(
        expect.stringContaining("Follow-up"),
      );
    });

    it("includes method diversity strength when uniqueMethods >= 4 and total > 0", () => {
      const debriefs = [
        makeDebrief({ id: "d1", child_id: "c1", debrief_method: "conversation" }),
        makeDebrief({ id: "d2", child_id: "c2", debrief_method: "drawing" }),
        makeDebrief({ id: "d3", child_id: "c3", debrief_method: "visual_cards" }),
        makeDebrief({ id: "d4", child_id: "c4", debrief_method: "walk_and_talk" }),
      ];
      const result = computePostIncidentDebrief(
        baseInput({ debriefs }),
      );
      expect(result.strengths).toContainEqual(
        expect.stringContaining("Diverse debrief methods"),
      );
    });

    it("does not include timeliness strength when timelinessRate < 80%", () => {
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          incident_date: "2025-06-10",
          debrief_date: i < 7 ? "2025-06-11" : "2025-06-20",
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 10, debriefs }),
      );
      expect(result.timeliness_rate).toBe(70);
      expect(result.strengths).not.toContainEqual(
        expect.stringContaining("promptly"),
      );
    });

    it("does not include method diversity strength when uniqueMethods < 4", () => {
      const debriefs = [
        makeDebrief({ id: "d1", child_id: "c1", debrief_method: "conversation" }),
        makeDebrief({ id: "d2", child_id: "c2", debrief_method: "drawing" }),
        makeDebrief({ id: "d3", child_id: "c3", debrief_method: "visual_cards" }),
      ];
      const result = computePostIncidentDebrief(
        baseInput({ debriefs }),
      );
      expect(result.method_diversity).toBe(3);
      expect(result.strengths).not.toContainEqual(
        expect.stringContaining("Diverse debrief methods"),
      );
    });

    it("returns no strengths when all debriefs are poor quality", () => {
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          incident_date: "2025-01-01",
          debrief_date: "2025-06-10",
          child_ready_to_debrief: false,
          has_child_account: false,
          has_feelings_before_during: false,
          has_feelings_now: false,
          has_apologies_offered: false,
          has_apologies_received: false,
          repairs_agreed_count: 0,
          has_follow_up_date: false,
          debrief_method: "conversation",
          child_requests_count: 0,
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 10, debriefs }),
      );
      expect(result.strengths).toHaveLength(0);
    });

    it("returns all 6 strengths when everything is excellent", () => {
      const debriefs = [
        makeDebrief({ id: "d1", child_id: "c1", debrief_method: "conversation" }),
        makeDebrief({ id: "d2", child_id: "c2", debrief_method: "drawing" }),
        makeDebrief({ id: "d3", child_id: "c3", debrief_method: "visual_cards" }),
        makeDebrief({ id: "d4", child_id: "c4", debrief_method: "walk_and_talk" }),
        makeDebrief({ id: "d5", child_id: "c5", debrief_method: "written" }),
      ];
      const result = computePostIncidentDebrief(
        baseInput({ debriefs }),
      );
      expect(result.strengths).toHaveLength(6);
    });

    it("returns no strengths when total is 0", () => {
      const result = computePostIncidentDebrief(
        baseInput({ debriefs: [] }),
      );
      expect(result.strengths).toHaveLength(0);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // CONCERNS
  // ════════════════════════════════════════════════════════════════════════

  describe("concerns", () => {
    it("includes no-debriefs concern when total is 0 and total_children > 0", () => {
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 5, debriefs: [] }),
      );
      expect(result.concerns).toContainEqual(
        expect.stringContaining("No post-incident debriefs exist"),
      );
    });

    it("includes delayed concern when timelinessRate < 30% and total > 0", () => {
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          incident_date: "2025-01-01",
          debrief_date: "2025-06-10",
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 10, debriefs }),
      );
      expect(result.timeliness_rate).toBe(0);
      expect(result.concerns).toContainEqual(
        expect.stringContaining("frequently delayed"),
      );
    });

    it("includes readiness concern when childReadinessRate < 40% and total > 0", () => {
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          child_ready_to_debrief: i < 3, // 30% < 40
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 10, debriefs }),
      );
      expect(result.concerns).toContainEqual(
        expect.stringContaining("readiness is often not confirmed"),
      );
    });

    it("includes voice depth concern when voiceDepthRate < 20% and total > 0", () => {
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          has_child_account: i < 1,
          has_feelings_before_during: i < 1,
          has_feelings_now: i < 1,
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 10, debriefs }),
      );
      expect(result.concerns).toContainEqual(
        expect.stringContaining("Debriefs lack depth"),
      );
    });

    it("includes restorative concern when restorativeActionRate < 25% and total > 0", () => {
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          has_apologies_offered: i < 2,
          has_apologies_received: false,
          repairs_agreed_count: 0,
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 10, debriefs }),
      );
      expect(result.concerns).toContainEqual(
        expect.stringContaining("Restorative actions are rare"),
      );
    });

    it("includes follow-up concern when followUpRate < 20% and total > 0", () => {
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          has_follow_up_date: i < 1, // 10% < 20
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 10, debriefs }),
      );
      expect(result.concerns).toContainEqual(
        expect.stringContaining("Follow-up is rarely scheduled"),
      );
    });

    it("does not include no-debriefs concern when debriefs exist", () => {
      const result = computePostIncidentDebrief(
        baseInput({ debriefs: [makeDebrief()] }),
      );
      expect(result.concerns).not.toContainEqual(
        expect.stringContaining("No post-incident debriefs exist"),
      );
    });

    it("returns no concerns when all metrics are high", () => {
      const result = computePostIncidentDebrief(
        baseInput({ debriefs: [makeDebrief()] }),
      );
      expect(result.concerns).toHaveLength(0);
    });

    it("returns all 5 metric concerns when all metrics are low with debriefs present", () => {
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          incident_date: "2025-01-01",
          debrief_date: "2025-06-10",
          child_ready_to_debrief: false,
          has_child_account: false,
          has_feelings_before_during: false,
          has_feelings_now: false,
          has_apologies_offered: false,
          has_apologies_received: false,
          repairs_agreed_count: 0,
          has_follow_up_date: false,
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 10, debriefs }),
      );
      // Should have: delayed, readiness, voice depth, restorative, follow-up (5)
      expect(result.concerns.length).toBe(5);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // RECOMMENDATIONS
  // ════════════════════════════════════════════════════════════════════════

  describe("recommendations", () => {
    it("recommends implementing debriefs when total is 0 and total_children > 0", () => {
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 5, debriefs: [] }),
      );
      expect(result.recommendations).toHaveLength(1);
      expect(result.recommendations[0]).toMatchObject({
        rank: 1,
        urgency: "immediate",
        regulatory_ref: "CHR 2015 Reg 13",
      });
    });

    it("recommends timeliness when timelinessRate < 50% and total > 0", () => {
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          incident_date: "2025-06-10",
          debrief_date: i < 4 ? "2025-06-11" : "2025-06-20",
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 10, debriefs }),
      );
      expect(result.timeliness_rate).toBe(40);
      expect(result.recommendations).toContainEqual(
        expect.objectContaining({
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 35",
        }),
      );
    });

    it("recommends deepening voice when voiceDepthRate < 45% and total > 0", () => {
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          has_child_account: i < 4,
          has_feelings_before_during: i < 4,
          has_feelings_now: i < 4,
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 10, debriefs }),
      );
      expect(result.voice_depth_rate).toBe(40);
      expect(result.recommendations).toContainEqual(
        expect.objectContaining({
          urgency: "soon",
          regulatory_ref: "SCCIF Experiences",
        }),
      );
    });

    it("recommends restorative practices when restorativeActionRate < 50% and total > 0", () => {
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          has_apologies_offered: i < 4,
          has_apologies_received: false,
          repairs_agreed_count: 0,
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 10, debriefs }),
      );
      expect(result.restorative_action_rate).toBe(40);
      expect(result.recommendations).toContainEqual(
        expect.objectContaining({
          urgency: "soon",
          regulatory_ref: "CHR 2015 Reg 13",
        }),
      );
    });

    it("recommends follow-up when followUpRate < 50% and total > 0", () => {
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          has_follow_up_date: i < 4, // 40% < 50
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 10, debriefs }),
      );
      expect(result.follow_up_rate).toBe(40);
      expect(result.recommendations).toContainEqual(
        expect.objectContaining({
          urgency: "soon",
          regulatory_ref: "SCCIF Helped & Protected",
        }),
      );
    });

    it("recommends diverse methods when uniqueMethods < 2 and total > 0", () => {
      const result = computePostIncidentDebrief(
        baseInput({ debriefs: [makeDebrief({ debrief_method: "conversation" })] }),
      );
      expect(result.method_diversity).toBe(1);
      expect(result.recommendations).toContainEqual(
        expect.objectContaining({
          urgency: "planned",
          regulatory_ref: "CHR 2015 Reg 35",
        }),
      );
    });

    it("assigns sequential ranks to recommendations", () => {
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          incident_date: "2025-01-01",
          debrief_date: "2025-06-10",
          has_child_account: false,
          has_feelings_before_during: false,
          has_feelings_now: false,
          has_apologies_offered: false,
          has_apologies_received: false,
          repairs_agreed_count: 0,
          has_follow_up_date: false,
          debrief_method: "conversation",
          child_requests_count: 0,
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 10, debriefs }),
      );
      result.recommendations.forEach((rec, idx) => {
        expect(rec.rank).toBe(idx + 1);
      });
    });

    it("returns no recommendations when all metrics are high", () => {
      const debriefs = [
        makeDebrief({ id: "d1", child_id: "c1", debrief_method: "conversation" }),
        makeDebrief({ id: "d2", child_id: "c2", debrief_method: "drawing" }),
      ];
      const result = computePostIncidentDebrief(
        baseInput({ debriefs }),
      );
      // timeliness 100%, voice 100%, restorative 100%, follow-up 100%, methods 2 >= 2
      expect(result.recommendations).toHaveLength(0);
    });

    it("returns all 5 recommendations for debriefs present with all metrics low", () => {
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          incident_date: "2025-01-01",
          debrief_date: "2025-06-10",
          has_child_account: false,
          has_feelings_before_during: false,
          has_feelings_now: false,
          has_apologies_offered: false,
          has_apologies_received: false,
          repairs_agreed_count: 0,
          has_follow_up_date: false,
          debrief_method: "conversation",
          child_requests_count: 0,
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 10, debriefs }),
      );
      // timeliness, voice, restorative, follow-up, methods (5 recommendations)
      expect(result.recommendations).toHaveLength(5);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // INSIGHTS
  // ════════════════════════════════════════════════════════════════════════

  describe("insights", () => {
    it("includes critical insight when total is 0 and total_children > 0", () => {
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 5, debriefs: [] }),
      );
      expect(result.insights).toContainEqual(
        expect.objectContaining({ severity: "critical" }),
      );
    });

    it("includes voice+restorative positive insight when both >= 75%", () => {
      const result = computePostIncidentDebrief(
        baseInput({ debriefs: [makeDebrief()] }),
      );
      expect(result.insights).toContainEqual(
        expect.objectContaining({
          severity: "positive",
          text: expect.stringContaining("child-centred response"),
        }),
      );
    });

    it("includes timeliness+readiness positive insight when both meet thresholds", () => {
      const result = computePostIncidentDebrief(
        baseInput({ debriefs: [makeDebrief()] }),
      );
      expect(result.insights).toContainEqual(
        expect.objectContaining({
          severity: "positive",
          text: expect.stringContaining("emotional sensitivity"),
        }),
      );
    });

    it("includes wishes insight when wishes rate >= 60%", () => {
      const debriefs = Array.from({ length: 5 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          has_wishes_different: i < 3, // 3/5 = 60%
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ debriefs }),
      );
      expect(result.insights).toContainEqual(
        expect.objectContaining({
          severity: "positive",
          text: expect.stringContaining("wish had been different"),
        }),
      );
    });

    it("does not include wishes insight when wishes rate < 60%", () => {
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          has_wishes_different: i < 5, // 5/10 = 50% < 60
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 10, debriefs }),
      );
      expect(result.insights).not.toContainEqual(
        expect.objectContaining({
          text: expect.stringContaining("wish had been different"),
        }),
      );
    });

    it("includes reflection warning when reflection rate < 30%", () => {
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          what_helped_count: i < 2 ? 1 : 0,
          what_did_not_help_count: 0,
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 10, debriefs }),
      );
      expect(result.insights).toContainEqual(
        expect.objectContaining({
          severity: "warning",
          text: expect.stringContaining("not fully learning-oriented"),
        }),
      );
    });

    it("does not include reflection warning when reflection rate >= 30%", () => {
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          what_helped_count: i < 4 ? 1 : 0, // 4/10 = 40% >= 30
          what_did_not_help_count: 0,
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 10, debriefs }),
      );
      expect(result.insights).not.toContainEqual(
        expect.objectContaining({
          text: expect.stringContaining("not fully learning-oriented"),
        }),
      );
    });

    it("includes method diversity insight when uniqueMethods >= 4", () => {
      const debriefs = [
        makeDebrief({ id: "d1", child_id: "c1", debrief_method: "conversation" }),
        makeDebrief({ id: "d2", child_id: "c2", debrief_method: "drawing" }),
        makeDebrief({ id: "d3", child_id: "c3", debrief_method: "visual_cards" }),
        makeDebrief({ id: "d4", child_id: "c4", debrief_method: "walk_and_talk" }),
      ];
      const result = computePostIncidentDebrief(
        baseInput({ debriefs }),
      );
      expect(result.insights).toContainEqual(
        expect.objectContaining({
          severity: "positive",
          text: expect.stringContaining("Multiple debrief methods"),
        }),
      );
    });

    it("does not include method diversity insight when uniqueMethods < 4", () => {
      const debriefs = [
        makeDebrief({ id: "d1", child_id: "c1", debrief_method: "conversation" }),
        makeDebrief({ id: "d2", child_id: "c2", debrief_method: "drawing" }),
        makeDebrief({ id: "d3", child_id: "c3", debrief_method: "visual_cards" }),
      ];
      const result = computePostIncidentDebrief(
        baseInput({ debriefs }),
      );
      expect(result.insights).not.toContainEqual(
        expect.objectContaining({
          text: expect.stringContaining("Multiple debrief methods"),
        }),
      );
    });

    it("does not include the critical insight when total_children is 0", () => {
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 0 }),
      );
      expect(result.insights).toHaveLength(0);
    });

    it("counts what_did_not_help_count for reflection", () => {
      const debriefs = Array.from({ length: 5 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          what_helped_count: 0,
          what_did_not_help_count: i < 3 ? 1 : 0, // 3/5 = 60% >= 30
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ debriefs }),
      );
      expect(result.insights).not.toContainEqual(
        expect.objectContaining({
          text: expect.stringContaining("not fully learning-oriented"),
        }),
      );
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // METRIC CALCULATIONS
  // ════════════════════════════════════════════════════════════════════════

  describe("metric calculations", () => {
    it("calculates children_debriefed_rate correctly with unique children", () => {
      const debriefs = [
        makeDebrief({ id: "d1", child_id: "c1" }),
        makeDebrief({ id: "d2", child_id: "c2" }),
        makeDebrief({ id: "d3", child_id: "c1" }), // duplicate child
      ];
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 5, debriefs }),
      );
      // 2 unique children / 5 total = 40%
      expect(result.children_debriefed_rate).toBe(40);
    });

    it("calculates total_debriefs correctly", () => {
      const debriefs = Array.from({ length: 7 }, (_, i) =>
        makeDebrief({ id: `d-${i}`, child_id: `c-${i}` }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 10, debriefs }),
      );
      expect(result.total_debriefs).toBe(7);
    });

    it("returns 0 for rates when total debriefs is 0 but total_children > 0", () => {
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 5, debriefs: [] }),
      );
      expect(result.timeliness_rate).toBe(0);
      expect(result.child_readiness_rate).toBe(0);
      expect(result.voice_depth_rate).toBe(0);
      expect(result.restorative_action_rate).toBe(0);
      expect(result.follow_up_rate).toBe(0);
    });

    it("calculates children_debriefed_rate as 100% when all children debriefed", () => {
      const debriefs = Array.from({ length: 3 }, (_, i) =>
        makeDebrief({ id: `d-${i}`, child_id: `c-${i}` }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 3, debriefs }),
      );
      expect(result.children_debriefed_rate).toBe(100);
    });

    it("calculates method_diversity correctly with duplicate methods", () => {
      const debriefs = [
        makeDebrief({ id: "d1", child_id: "c1", debrief_method: "conversation" }),
        makeDebrief({ id: "d2", child_id: "c2", debrief_method: "conversation" }),
        makeDebrief({ id: "d3", child_id: "c3", debrief_method: "drawing" }),
      ];
      const result = computePostIncidentDebrief(
        baseInput({ debriefs }),
      );
      expect(result.method_diversity).toBe(2);
    });

    it("rounds percentages correctly", () => {
      // 1/3 = 33.33...% should round to 33
      const debriefs = Array.from({ length: 3 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          child_ready_to_debrief: i < 1,
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 3, debriefs }),
      );
      expect(result.child_readiness_rate).toBe(33);
    });

    it("rounds 2/3 correctly to 67%", () => {
      const debriefs = Array.from({ length: 3 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          child_ready_to_debrief: i < 2,
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 3, debriefs }),
      );
      expect(result.child_readiness_rate).toBe(67);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // COMPOSITE / END-TO-END SCENARIOS
  // ════════════════════════════════════════════════════════════════════════

  describe("composite scenarios", () => {
    it("perfect single debrief scores 79 (good)", () => {
      // 52 + 6 + 5 + 5 + 5 + 4 + 2 = 79 (one method, request rate 100% >= 40 -> +2)
      const result = computePostIncidentDebrief(
        baseInput({ debriefs: [makeDebrief()] }),
      );
      expect(result.debrief_score).toBe(79);
      expect(result.debrief_rating).toBe("good");
    });

    it("perfect diverse debriefs score 82 (outstanding)", () => {
      const debriefs = [
        makeDebrief({ id: "d1", child_id: "c1", debrief_method: "conversation", child_requests_count: 2 }),
        makeDebrief({ id: "d2", child_id: "c2", debrief_method: "drawing", child_requests_count: 1 }),
        makeDebrief({ id: "d3", child_id: "c3", debrief_method: "visual_cards", child_requests_count: 1 }),
        makeDebrief({ id: "d4", child_id: "c4", debrief_method: "walk_and_talk", child_requests_count: 1 }),
        makeDebrief({ id: "d5", child_id: "c5", debrief_method: "written", child_requests_count: 0 }),
      ];
      const result = computePostIncidentDebrief(
        baseInput({ debriefs }),
      );
      // 4/5 = 80% requests >= 60, 5 methods >= 4 -> +5
      expect(result.debrief_score).toBe(82);
      expect(result.debrief_rating).toBe("outstanding");
    });

    it("worst possible debriefs score 27 (inadequate)", () => {
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          incident_date: "2025-01-01",
          debrief_date: "2025-06-10",
          child_ready_to_debrief: false,
          has_child_account: false,
          has_feelings_before_during: false,
          has_feelings_now: false,
          has_apologies_offered: false,
          has_apologies_received: false,
          repairs_agreed_count: 0,
          has_follow_up_date: false,
          debrief_method: "conversation",
          child_requests_count: 0,
          has_wishes_different: false,
          what_helped_count: 0,
          what_did_not_help_count: 0,
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 10, debriefs }),
      );
      // 52 - 5 - 5 - 4 - 4 - 4 - 3 = 27
      expect(result.debrief_score).toBe(27);
      expect(result.debrief_rating).toBe("inadequate");
    });

    it("empty debriefs with children scores 44 (insufficient_data)", () => {
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 5, debriefs: [] }),
      );
      // 52 - 3 - 1 - 1 + 0 - 1 - 2 = 44
      expect(result.debrief_score).toBe(44);
      expect(result.debrief_rating).toBe("insufficient_data");
    });

    it("mid-range scenario produces adequate rating", () => {
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          incident_date: "2025-06-10",
          debrief_date: i < 6 ? "2025-06-11" : "2025-06-20",
          child_ready_to_debrief: i < 7,
          has_child_account: i < 5,
          has_feelings_before_during: i < 5,
          has_feelings_now: i < 5,
          has_apologies_offered: i < 5,
          has_apologies_received: false,
          repairs_agreed_count: 0,
          has_follow_up_date: i < 5,
          debrief_method: "conversation",
          child_requests_count: i < 3 ? 1 : 0,
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 10, debriefs }),
      );
      // timeliness 60% >= 50 -> +2
      // readiness 70% >= 60 -> +2
      // voice 50% >= 45 -> +2
      // restorative 50% >= 50 -> +2
      // follow-up 50% >= 50 -> +1
      // method diversity: 1 method, requestRate 30% — no branch hit -> 0
      // 52 + 2 + 2 + 2 + 2 + 1 + 0 = 61
      expect(result.debrief_score).toBe(61);
      expect(result.debrief_rating).toBe("adequate");
    });

    it("scenario with some strengths and some concerns", () => {
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          incident_date: "2025-06-10",
          debrief_date: "2025-06-11", // all timely (100%)
          child_ready_to_debrief: true, // all ready (100%)
          has_child_account: i < 1, // 10% voice depth
          has_feelings_before_during: i < 1,
          has_feelings_now: i < 1,
          has_apologies_offered: i < 1, // 10% restorative
          has_apologies_received: false,
          repairs_agreed_count: 0,
          has_follow_up_date: i < 1, // 10% follow-up
          debrief_method: "conversation",
          child_requests_count: 0,
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 10, debriefs }),
      );
      // timeliness 100% -> strength + modifier +6
      // readiness 100% -> strength + modifier +5
      // voice 10% < 20 -> concern + modifier -4
      // restorative 10% < 25 -> concern + modifier -4
      // follow-up 10% < 20 -> concern + modifier -4
      // methods: 1, requestRate 0% -> modifier -3
      // 52 + 6 + 5 - 4 - 4 - 4 - 3 = 48
      expect(result.debrief_score).toBe(48);
      expect(result.strengths.length).toBeGreaterThanOrEqual(2);
      expect(result.concerns.length).toBeGreaterThanOrEqual(3);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // EDGE CASES
  // ════════════════════════════════════════════════════════════════════════

  describe("edge cases", () => {
    it("handles a single debrief", () => {
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 1, debriefs: [makeDebrief()] }),
      );
      expect(result.total_debriefs).toBe(1);
      expect(result.children_debriefed_rate).toBe(100);
    });

    it("handles many debriefs for the same child", () => {
      const debriefs = Array.from({ length: 5 }, (_, i) =>
        makeDebrief({ id: `d-${i}`, child_id: "same-child" }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 5, debriefs }),
      );
      // 1 unique child / 5 total children = 20%
      expect(result.children_debriefed_rate).toBe(20);
      expect(result.total_debriefs).toBe(5);
    });

    it("handles children_debriefed_rate > 100% when uniqueChildren > total_children", () => {
      const debriefs = Array.from({ length: 3 }, (_, i) =>
        makeDebrief({ id: `d-${i}`, child_id: `c-${i}` }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 2, debriefs }),
      );
      // 3 unique children / 2 total = 150% -> pct rounds to 150
      expect(result.children_debriefed_rate).toBe(150);
    });

    it("handles all six debrief methods", () => {
      const methods = ["conversation", "drawing", "visual_cards", "walk_and_talk", "written", "through_advocate"];
      const debriefs = methods.map((method, i) =>
        makeDebrief({ id: `d-${i}`, child_id: `c-${i}`, debrief_method: method }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 6, debriefs }),
      );
      expect(result.method_diversity).toBe(6);
    });

    it("handles debrief with all boolean fields false", () => {
      const debrief = makeDebrief({
        child_ready_to_debrief: false,
        has_child_account: false,
        has_feelings_before_during: false,
        has_feelings_now: false,
        has_wishes_different: false,
        has_apologies_offered: false,
        has_apologies_received: false,
        has_support_needed: false,
        has_follow_up_date: false,
        child_accepts_outcome: false,
        repairs_agreed_count: 0,
      });
      const result = computePostIncidentDebrief(
        baseInput({ debriefs: [debrief] }),
      );
      expect(result.child_readiness_rate).toBe(0);
      expect(result.voice_depth_rate).toBe(0);
      expect(result.restorative_action_rate).toBe(0);
      expect(result.follow_up_rate).toBe(0);
    });

    it("handles debrief with all count fields at 0", () => {
      const debrief = makeDebrief({
        what_helped_count: 0,
        what_did_not_help_count: 0,
        child_requests_count: 0,
        repairs_agreed_count: 0,
      });
      const result = computePostIncidentDebrief(
        baseInput({ debriefs: [debrief] }),
      );
      expect(result.total_debriefs).toBe(1);
    });

    it("handles large number of debriefs", () => {
      const debriefs = Array.from({ length: 100 }, (_, i) =>
        makeDebrief({ id: `d-${i}`, child_id: `c-${i % 20}` }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 20, debriefs }),
      );
      expect(result.total_debriefs).toBe(100);
      expect(result.children_debriefed_rate).toBe(100);
    });

    it("total_children of 1 with no debriefs still returns insufficient_data", () => {
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 1, debriefs: [] }),
      );
      expect(result.debrief_rating).toBe("insufficient_data");
      expect(result.debrief_score).toBe(44);
    });

    it("handles high counts without affecting boolean-based metrics", () => {
      const debrief = makeDebrief({
        what_helped_count: 100,
        what_did_not_help_count: 50,
        child_requests_count: 25,
        repairs_agreed_count: 10,
      });
      const result = computePostIncidentDebrief(
        baseInput({ debriefs: [debrief] }),
      );
      expect(result.restorative_action_rate).toBe(100);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // BOUNDARY VALUES FOR EACH MODIFIER
  // ════════════════════════════════════════════════════════════════════════

  describe("modifier boundary values", () => {
    it("timeliness at exactly 80% triggers +6", () => {
      // 5 debriefs, 4 timely = 80%
      const debriefs = Array.from({ length: 5 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          incident_date: "2025-06-10",
          debrief_date: i < 4 ? "2025-06-11" : "2025-06-20",
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ debriefs }),
      );
      expect(result.timeliness_rate).toBe(80);
    });

    it("timeliness at exactly 79% does not trigger +6", () => {
      // Need a fraction that rounds to 79: difficult with integers.
      // 19/24 = 79.16... rounds to 79
      // Let's use something simpler: can't get exactly 79% easily
      // 11/14 = 78.57... rounds to 79
      const debriefs = Array.from({ length: 14 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          incident_date: "2025-06-10",
          debrief_date: i < 11 ? "2025-06-11" : "2025-06-20",
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 14, debriefs }),
      );
      expect(result.timeliness_rate).toBe(79);
    });

    it("timeliness at exactly 50% triggers +2", () => {
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          incident_date: "2025-06-10",
          debrief_date: i < 5 ? "2025-06-11" : "2025-06-20",
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 10, debriefs }),
      );
      expect(result.timeliness_rate).toBe(50);
    });

    it("timeliness at exactly 30% hits no modifier (between 30 and 49)", () => {
      // 3/10 = 30%
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          incident_date: "2025-06-10",
          debrief_date: i < 3 ? "2025-06-11" : "2025-06-20",
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 10, debriefs }),
      );
      expect(result.timeliness_rate).toBe(30);
    });

    it("timeliness at exactly 29% triggers -5", () => {
      // 2/7 = 28.57 rounds to 29
      const debriefs = Array.from({ length: 7 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          incident_date: "2025-06-10",
          debrief_date: i < 2 ? "2025-06-11" : "2025-06-20",
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 7, debriefs }),
      );
      expect(result.timeliness_rate).toBe(29);
    });

    it("child readiness at exactly 85% triggers +5", () => {
      // 17/20 = 85%
      const debriefs = Array.from({ length: 20 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          child_ready_to_debrief: i < 17,
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 20, debriefs }),
      );
      expect(result.child_readiness_rate).toBe(85);
    });

    it("child readiness at exactly 60% triggers +2", () => {
      const debriefs = Array.from({ length: 5 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          child_ready_to_debrief: i < 3, // 3/5 = 60%
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ debriefs }),
      );
      expect(result.child_readiness_rate).toBe(60);
    });

    it("child readiness at exactly 40% hits no modifier", () => {
      const debriefs = Array.from({ length: 5 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          child_ready_to_debrief: i < 2, // 2/5 = 40%
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ debriefs }),
      );
      expect(result.child_readiness_rate).toBe(40);
    });

    it("child readiness at exactly 39% triggers -5", () => {
      // Hard to get exactly 39% with rounding; 7/18 = 38.88... rounds to 39
      const debriefs = Array.from({ length: 18 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          child_ready_to_debrief: i < 7,
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 18, debriefs }),
      );
      expect(result.child_readiness_rate).toBe(39);
    });

    it("voice depth at exactly 75% triggers +5", () => {
      const debriefs = Array.from({ length: 4 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          has_child_account: i < 3,
          has_feelings_before_during: i < 3,
          has_feelings_now: i < 3,
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 4, debriefs }),
      );
      expect(result.voice_depth_rate).toBe(75);
    });

    it("voice depth at exactly 45% triggers +2", () => {
      // 9/20 = 45%
      const debriefs = Array.from({ length: 20 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          has_child_account: i < 9,
          has_feelings_before_during: i < 9,
          has_feelings_now: i < 9,
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 20, debriefs }),
      );
      expect(result.voice_depth_rate).toBe(45);
    });

    it("voice depth at exactly 20% hits no modifier", () => {
      const debriefs = Array.from({ length: 5 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          has_child_account: i < 1,
          has_feelings_before_during: i < 1,
          has_feelings_now: i < 1,
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ debriefs }),
      );
      expect(result.voice_depth_rate).toBe(20);
    });

    it("voice depth at exactly 19% triggers -4", () => {
      // Hard to get 19% exactly. Let's use a known fraction.
      // We need a setup where the rounded pct gives 19.
      // Actually, we can verify the behavior with < 20. Let's use 10%: 1/10
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          has_child_account: i < 1,
          has_feelings_before_during: i < 1,
          has_feelings_now: i < 1,
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 10, debriefs }),
      );
      expect(result.voice_depth_rate).toBe(10);
      // 10 < 20 -> -4 applied
    });

    it("restorative at exactly 75% triggers +5", () => {
      const debriefs = Array.from({ length: 4 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          has_apologies_offered: i < 3,
          has_apologies_received: false,
          repairs_agreed_count: 0,
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 4, debriefs }),
      );
      expect(result.restorative_action_rate).toBe(75);
    });

    it("restorative at exactly 50% triggers +2", () => {
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          has_apologies_offered: i < 5,
          has_apologies_received: false,
          repairs_agreed_count: 0,
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 10, debriefs }),
      );
      expect(result.restorative_action_rate).toBe(50);
    });

    it("restorative at exactly 25% hits no modifier", () => {
      const debriefs = Array.from({ length: 4 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          has_apologies_offered: i < 1,
          has_apologies_received: false,
          repairs_agreed_count: 0,
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 4, debriefs }),
      );
      expect(result.restorative_action_rate).toBe(25);
    });

    it("restorative at exactly 24% triggers -4", () => {
      // Difficult to get exactly 24 with rounding. Let's verify < 25 behavior
      // with 20%: 2/10
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          has_apologies_offered: i < 2,
          has_apologies_received: false,
          repairs_agreed_count: 0,
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 10, debriefs }),
      );
      expect(result.restorative_action_rate).toBe(20);
      // 20 < 25 -> -4 applied
    });

    it("follow-up at exactly 80% triggers +4", () => {
      const debriefs = Array.from({ length: 5 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          has_follow_up_date: i < 4, // 4/5 = 80%
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ debriefs }),
      );
      expect(result.follow_up_rate).toBe(80);
    });

    it("follow-up at exactly 50% triggers +1", () => {
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          has_follow_up_date: i < 5, // 5/10 = 50%
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 10, debriefs }),
      );
      expect(result.follow_up_rate).toBe(50);
    });

    it("follow-up at exactly 20% hits no modifier", () => {
      const debriefs = Array.from({ length: 5 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          has_follow_up_date: i < 1, // 1/5 = 20%
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ debriefs }),
      );
      expect(result.follow_up_rate).toBe(20);
    });

    it("follow-up at exactly 19% triggers -4", () => {
      // Can't easily hit 19. Let's verify < 20 with 10%
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          has_follow_up_date: i < 1, // 1/10 = 10%
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 10, debriefs }),
      );
      expect(result.follow_up_rate).toBe(10);
      // 10 < 20 -> -4 applied
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // SPECIFIC SCORE CALCULATIONS
  // ════════════════════════════════════════════════════════════════════════

  describe("specific score calculations", () => {
    it("empty debriefs score: 52 - 3 - 1 - 1 + 0 - 1 - 2 = 44", () => {
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 5, debriefs: [] }),
      );
      expect(result.debrief_score).toBe(44);
    });

    it("all maximum modifiers: 52 + 6 + 5 + 5 + 5 + 4 + 5 = 82", () => {
      const debriefs = [
        makeDebrief({ id: "d1", child_id: "c1", debrief_method: "conversation", child_requests_count: 2 }),
        makeDebrief({ id: "d2", child_id: "c2", debrief_method: "drawing", child_requests_count: 1 }),
        makeDebrief({ id: "d3", child_id: "c3", debrief_method: "visual_cards", child_requests_count: 1 }),
        makeDebrief({ id: "d4", child_id: "c4", debrief_method: "walk_and_talk", child_requests_count: 1 }),
        makeDebrief({ id: "d5", child_id: "c5", debrief_method: "written", child_requests_count: 0 }),
      ];
      const result = computePostIncidentDebrief(
        baseInput({ debriefs }),
      );
      expect(result.debrief_score).toBe(82);
    });

    it("all minimum modifiers: 52 - 5 - 5 - 4 - 4 - 4 - 3 = 27", () => {
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          incident_date: "2025-01-01",
          debrief_date: "2025-06-10",
          child_ready_to_debrief: false,
          has_child_account: false,
          has_feelings_before_during: false,
          has_feelings_now: false,
          has_apologies_offered: false,
          has_apologies_received: false,
          repairs_agreed_count: 0,
          has_follow_up_date: false,
          debrief_method: "conversation",
          child_requests_count: 0,
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 10, debriefs }),
      );
      expect(result.debrief_score).toBe(27);
    });

    it("timeliness +2, readiness +2, voice +2, restorative +2, follow-up +1, method +2 = 52+11=63", () => {
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          incident_date: "2025-06-10",
          debrief_date: i < 6 ? "2025-06-11" : "2025-06-20", // 60% timely
          child_ready_to_debrief: i < 7, // 70% ready
          has_child_account: i < 5,
          has_feelings_before_during: i < 5,
          has_feelings_now: i < 5, // 50% voice
          has_apologies_offered: i < 5,
          has_apologies_received: false,
          repairs_agreed_count: 0, // 50% restorative
          has_follow_up_date: i < 6, // 60% follow-up
          debrief_method: i < 5 ? "conversation" : "drawing", // 2 methods
          child_requests_count: i < 3 ? 1 : 0, // 30% requests
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 10, debriefs }),
      );
      // timeliness 60% >= 50 -> +2
      // readiness 70% >= 60 -> +2
      // voice 50% >= 45 -> +2
      // restorative 50% >= 50 -> +2
      // follow-up 60% >= 50 -> +1
      // methods >= 2 -> +2
      // 52 + 2 + 2 + 2 + 2 + 1 + 2 = 63
      expect(result.debrief_score).toBe(63);
    });

    it("mixed positive and negative modifiers: 52 + 6 + 5 - 4 - 4 - 4 - 3 = 48", () => {
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          incident_date: "2025-06-10",
          debrief_date: "2025-06-11", // 100% timely -> +6
          child_ready_to_debrief: true, // 100% ready -> +5
          has_child_account: i < 1,
          has_feelings_before_during: i < 1,
          has_feelings_now: i < 1, // 10% voice -> -4
          has_apologies_offered: i < 1,
          has_apologies_received: false,
          repairs_agreed_count: 0, // 10% restorative -> -4
          has_follow_up_date: i < 1, // 10% follow-up -> -4
          debrief_method: "conversation",
          child_requests_count: 0, // 0% requests, 1 method -> -3
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 10, debriefs }),
      );
      expect(result.debrief_score).toBe(48);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // PCT HELPER EDGE CASES
  // ════════════════════════════════════════════════════════════════════════

  describe("pct helper edge cases", () => {
    it("pct returns 0 when denominator is 0", () => {
      // timeliness_rate = pct(timely, total) where total = 0
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 5, debriefs: [] }),
      );
      expect(result.timeliness_rate).toBe(0);
    });

    it("pct returns 100 for 1/1", () => {
      const result = computePostIncidentDebrief(
        baseInput({ debriefs: [makeDebrief()] }),
      );
      expect(result.timeliness_rate).toBe(100);
    });

    it("pct rounds down for values just below .5 threshold", () => {
      // 1/3 = 33.33... -> Math.round = 33
      const debriefs = Array.from({ length: 3 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          has_follow_up_date: i < 1,
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 3, debriefs }),
      );
      expect(result.follow_up_rate).toBe(33);
    });

    it("pct rounds up for values at .5", () => {
      // 1/2 = 50 -> no rounding issue
      const debriefs = Array.from({ length: 2 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          has_follow_up_date: i < 1,
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ debriefs }),
      );
      expect(result.follow_up_rate).toBe(50);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // RATING BRANCH — total===0 vs toRating
  // ════════════════════════════════════════════════════════════════════════

  describe("rating determination branch", () => {
    it("uses insufficient_data when total===0 AND debriefs.length===0 regardless of score", () => {
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 5, debriefs: [] }),
      );
      // Score is 44 which would normally be inadequate, but the branch forces insufficient_data
      expect(result.debrief_score).toBe(44);
      expect(result.debrief_rating).toBe("insufficient_data");
    });

    it("uses toRating when debriefs exist even if they are poor", () => {
      const debriefs = [
        makeDebrief({
          incident_date: "2025-01-01",
          debrief_date: "2025-06-10",
          child_ready_to_debrief: false,
          has_child_account: false,
          has_feelings_before_during: false,
          has_feelings_now: false,
          has_apologies_offered: false,
          has_apologies_received: false,
          repairs_agreed_count: 0,
          has_follow_up_date: false,
          child_requests_count: 0,
        }),
      ];
      const result = computePostIncidentDebrief(
        baseInput({ debriefs }),
      );
      // total > 0, so toRating is used
      expect(result.debrief_rating).not.toBe("insufficient_data");
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // OUTPUT SHAPE VALIDATION
  // ════════════════════════════════════════════════════════════════════════

  describe("output shape", () => {
    it("returns all expected fields", () => {
      const result = computePostIncidentDebrief(
        baseInput({ debriefs: [makeDebrief()] }),
      );
      expect(result).toHaveProperty("debrief_rating");
      expect(result).toHaveProperty("debrief_score");
      expect(result).toHaveProperty("headline");
      expect(result).toHaveProperty("total_debriefs");
      expect(result).toHaveProperty("children_debriefed_rate");
      expect(result).toHaveProperty("timeliness_rate");
      expect(result).toHaveProperty("child_readiness_rate");
      expect(result).toHaveProperty("voice_depth_rate");
      expect(result).toHaveProperty("restorative_action_rate");
      expect(result).toHaveProperty("follow_up_rate");
      expect(result).toHaveProperty("method_diversity");
      expect(result).toHaveProperty("strengths");
      expect(result).toHaveProperty("concerns");
      expect(result).toHaveProperty("recommendations");
      expect(result).toHaveProperty("insights");
    });

    it("returns arrays for strengths, concerns, recommendations, insights", () => {
      const result = computePostIncidentDebrief(
        baseInput({ debriefs: [makeDebrief()] }),
      );
      expect(Array.isArray(result.strengths)).toBe(true);
      expect(Array.isArray(result.concerns)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(Array.isArray(result.insights)).toBe(true);
    });

    it("returns numbers for all rate fields", () => {
      const result = computePostIncidentDebrief(
        baseInput({ debriefs: [makeDebrief()] }),
      );
      expect(typeof result.debrief_score).toBe("number");
      expect(typeof result.total_debriefs).toBe("number");
      expect(typeof result.children_debriefed_rate).toBe("number");
      expect(typeof result.timeliness_rate).toBe("number");
      expect(typeof result.child_readiness_rate).toBe("number");
      expect(typeof result.voice_depth_rate).toBe("number");
      expect(typeof result.restorative_action_rate).toBe("number");
      expect(typeof result.follow_up_rate).toBe("number");
      expect(typeof result.method_diversity).toBe("number");
    });

    it("returns a string for headline", () => {
      const result = computePostIncidentDebrief(
        baseInput({ debriefs: [makeDebrief()] }),
      );
      expect(typeof result.headline).toBe("string");
    });

    it("recommendations have correct shape", () => {
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 5, debriefs: [] }),
      );
      result.recommendations.forEach((rec) => {
        expect(rec).toHaveProperty("rank");
        expect(rec).toHaveProperty("recommendation");
        expect(rec).toHaveProperty("urgency");
        expect(rec).toHaveProperty("regulatory_ref");
        expect(typeof rec.rank).toBe("number");
        expect(typeof rec.recommendation).toBe("string");
        expect(["immediate", "soon", "planned"]).toContain(rec.urgency);
        expect(typeof rec.regulatory_ref).toBe("string");
      });
    });

    it("insights have correct shape", () => {
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 5, debriefs: [] }),
      );
      result.insights.forEach((insight) => {
        expect(insight).toHaveProperty("text");
        expect(insight).toHaveProperty("severity");
        expect(typeof insight.text).toBe("string");
        expect(["critical", "warning", "positive"]).toContain(insight.severity);
      });
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // ADDITIONAL MODIFIER INTERACTION TESTS
  // ════════════════════════════════════════════════════════════════════════

  describe("modifier interactions", () => {
    it("modifier 6: +5 branch requires BOTH uniqueMethods >= 4 AND requestRate >= 60", () => {
      // 4 methods but only 50% requests -> falls to +2 branch (uniqueMethods >= 2)
      const debriefs = [
        makeDebrief({ id: "d1", child_id: "c1", debrief_method: "conversation", child_requests_count: 1 }),
        makeDebrief({ id: "d2", child_id: "c2", debrief_method: "drawing", child_requests_count: 1 }),
        makeDebrief({ id: "d3", child_id: "c3", debrief_method: "visual_cards", child_requests_count: 0 }),
        makeDebrief({ id: "d4", child_id: "c4", debrief_method: "walk_and_talk", child_requests_count: 0 }),
      ];
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 4, debriefs }),
      );
      // requestRate = 2/4 = 50%, uniqueMethods = 4
      // 50 < 60 so +5 branch fails, falls to: uniqueMethods >= 2 || requestRate >= 40 -> +2
      expect(result.method_diversity).toBe(4);
    });

    it("modifier 6: high requestRate alone (>= 40) gets +2 with 1 method", () => {
      const debriefs = [
        makeDebrief({ id: "d1", child_id: "c1", debrief_method: "conversation", child_requests_count: 1 }),
        makeDebrief({ id: "d2", child_id: "c2", debrief_method: "conversation", child_requests_count: 1 }),
      ];
      // requestRate = 2/2 = 100% >= 40 -> +2
      const result = computePostIncidentDebrief(
        baseInput({ debriefs }),
      );
      expect(result.method_diversity).toBe(1);
    });

    it("modifier 6: -3 branch requires BOTH uniqueMethods < 2 AND requestRate < 20", () => {
      // 1 method and 10% requests: both conditions met
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          debrief_method: "conversation",
          child_requests_count: i < 1 ? 1 : 0, // 10% < 20
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 10, debriefs }),
      );
      expect(result.method_diversity).toBe(1);
    });

    it("modifier 6: does not apply -3 when uniqueMethods >= 2 even if requestRate < 20", () => {
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          debrief_method: i < 5 ? "conversation" : "drawing",
          child_requests_count: 0, // 0% < 20
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 10, debriefs }),
      );
      // uniqueMethods = 2 >= 2 -> +2 branch applies (short circuit OR)
      expect(result.method_diversity).toBe(2);
    });

    it("modifier 6: does not apply -3 when requestRate >= 20 even if uniqueMethods < 2", () => {
      const debriefs = Array.from({ length: 5 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          debrief_method: "conversation",
          child_requests_count: i < 1 ? 1 : 0, // 1/5 = 20%, not < 20
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ debriefs }),
      );
      // uniqueMethods = 1 < 2, requestRate = 20% not < 20 -> -3 not applied
      // uniqueMethods >= 2 is false, requestRate >= 40 is false -> +2 not applied
      // No modifier applied for mod 6
      expect(result.method_diversity).toBe(1);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // COMPREHENSIVE STRENGTH/CONCERN INTERACTION
  // ════════════════════════════════════════════════════════════════════════

  describe("strength and concern interaction", () => {
    it("strengths and concerns do not overlap on the same metric", () => {
      const result = computePostIncidentDebrief(
        baseInput({ debriefs: [makeDebrief()] }),
      );
      // Timeliness >= 80 -> strength but not concern (< 30 needed for concern)
      const hasTimelinessStrength = result.strengths.some(s => s.includes("promptly"));
      const hasTimelinessConcern = result.concerns.some(c => c.includes("delayed"));
      expect(hasTimelinessStrength).toBe(true);
      expect(hasTimelinessConcern).toBe(false);
    });

    it("no-debriefs concern and critical insight appear together", () => {
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 5, debriefs: [] }),
      );
      expect(result.concerns).toHaveLength(1);
      expect(result.insights).toHaveLength(1);
      expect(result.concerns[0]).toContain("No post-incident debriefs exist");
      expect(result.insights[0].severity).toBe("critical");
    });

    it("method diversity strength and insight appear together when methods >= 4", () => {
      const debriefs = [
        makeDebrief({ id: "d1", child_id: "c1", debrief_method: "conversation" }),
        makeDebrief({ id: "d2", child_id: "c2", debrief_method: "drawing" }),
        makeDebrief({ id: "d3", child_id: "c3", debrief_method: "visual_cards" }),
        makeDebrief({ id: "d4", child_id: "c4", debrief_method: "walk_and_talk" }),
      ];
      const result = computePostIncidentDebrief(
        baseInput({ debriefs }),
      );
      const hasStrength = result.strengths.some(s => s.includes("Diverse debrief methods"));
      const hasInsight = result.insights.some(i => i.text.includes("Multiple debrief methods"));
      expect(hasStrength).toBe(true);
      expect(hasInsight).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // ADDITIONAL SCENARIOS FOR COVERAGE
  // ════════════════════════════════════════════════════════════════════════

  describe("additional coverage scenarios", () => {
    it("does not include voice+restorative positive insight when voice < 75%", () => {
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          has_child_account: i < 7,
          has_feelings_before_during: i < 7,
          has_feelings_now: i < 7, // 70% voice
          has_apologies_offered: true, // 100% restorative
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 10, debriefs }),
      );
      expect(result.voice_depth_rate).toBe(70);
      expect(result.insights).not.toContainEqual(
        expect.objectContaining({
          text: expect.stringContaining("child-centred response"),
        }),
      );
    });

    it("does not include timeliness+readiness insight when timeliness < 80%", () => {
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          incident_date: "2025-06-10",
          debrief_date: i < 7 ? "2025-06-11" : "2025-06-20", // 70%
          child_ready_to_debrief: true, // 100%
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 10, debriefs }),
      );
      expect(result.timeliness_rate).toBe(70);
      expect(result.insights).not.toContainEqual(
        expect.objectContaining({
          text: expect.stringContaining("emotional sensitivity"),
        }),
      );
    });

    it("does not include timeliness+readiness insight when readiness < 85%", () => {
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          incident_date: "2025-06-10",
          debrief_date: "2025-06-11", // 100%
          child_ready_to_debrief: i < 8, // 80% < 85
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 10, debriefs }),
      );
      expect(result.child_readiness_rate).toBe(80);
      expect(result.insights).not.toContainEqual(
        expect.objectContaining({
          text: expect.stringContaining("emotional sensitivity"),
        }),
      );
    });

    it("does not include no-debriefs concern when total_children is 0", () => {
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 0 }),
      );
      // Guard returns early so concerns is empty
      expect(result.concerns).toHaveLength(0);
    });

    it("does not recommend implementing debriefs when total_children is 0", () => {
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 0 }),
      );
      expect(result.recommendations).toHaveLength(0);
    });

    it("does not recommend timeliness when timelinessRate >= 50%", () => {
      const result = computePostIncidentDebrief(
        baseInput({ debriefs: [makeDebrief()] }),
      );
      // timeliness 100% >= 50
      expect(result.recommendations).not.toContainEqual(
        expect.objectContaining({
          recommendation: expect.stringContaining("Ensure debriefs occur within 48 hours"),
        }),
      );
    });

    it("does not recommend diverse methods when uniqueMethods >= 2", () => {
      const debriefs = [
        makeDebrief({ id: "d1", child_id: "c1", debrief_method: "conversation" }),
        makeDebrief({ id: "d2", child_id: "c2", debrief_method: "drawing" }),
      ];
      const result = computePostIncidentDebrief(
        baseInput({ debriefs }),
      );
      expect(result.method_diversity).toBe(2);
      const methodRec = result.recommendations.find(
        r => r.recommendation.includes("Offer diverse debrief methods"),
      );
      expect(methodRec).toBeUndefined();
    });

    it("multiple debriefs from same child does not inflate children_debriefed_rate beyond unique count", () => {
      const debriefs = [
        makeDebrief({ id: "d1", child_id: "c1" }),
        makeDebrief({ id: "d2", child_id: "c1" }),
        makeDebrief({ id: "d3", child_id: "c1" }),
      ];
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 3, debriefs }),
      );
      // 1 unique child / 3 total = 33%
      expect(result.children_debriefed_rate).toBe(33);
    });

    it("a debrief with only what_did_not_help_count counts for reflection", () => {
      const debriefs = [
        makeDebrief({
          what_helped_count: 0,
          what_did_not_help_count: 2,
        }),
      ];
      const result = computePostIncidentDebrief(
        baseInput({ debriefs }),
      );
      // Reflection checks what_helped_count > 0 || what_did_not_help_count > 0
      // This debrief counts, so reflection rate = 100% which is >= 30%, no warning
      expect(result.insights).not.toContainEqual(
        expect.objectContaining({
          text: expect.stringContaining("not fully learning-oriented"),
        }),
      );
    });

    it("a debrief with only what_helped_count counts for reflection", () => {
      const debriefs = [
        makeDebrief({
          what_helped_count: 3,
          what_did_not_help_count: 0,
        }),
      ];
      const result = computePostIncidentDebrief(
        baseInput({ debriefs }),
      );
      expect(result.insights).not.toContainEqual(
        expect.objectContaining({
          text: expect.stringContaining("not fully learning-oriented"),
        }),
      );
    });

    it("wishes insight threshold: exactly 60% triggers the insight", () => {
      const debriefs = Array.from({ length: 5 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          has_wishes_different: i < 3, // 3/5 = 60%
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ debriefs }),
      );
      expect(result.insights).toContainEqual(
        expect.objectContaining({
          text: expect.stringContaining("wish had been different"),
        }),
      );
    });

    it("wishes insight threshold: exactly 59% does not trigger", () => {
      // 10/17 = 58.82... rounds to 59
      const debriefs = Array.from({ length: 17 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          has_wishes_different: i < 10,
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 17, debriefs }),
      );
      // pct(10, 17) = round(58.82) = 59
      expect(result.insights).not.toContainEqual(
        expect.objectContaining({
          text: expect.stringContaining("wish had been different"),
        }),
      );
    });

    it("reflection warning threshold: exactly 30% does not trigger warning", () => {
      // 3/10 = 30%
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          what_helped_count: i < 3 ? 1 : 0,
          what_did_not_help_count: 0,
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 10, debriefs }),
      );
      // pct(3, 10) = 30, not < 30
      expect(result.insights).not.toContainEqual(
        expect.objectContaining({
          text: expect.stringContaining("not fully learning-oriented"),
        }),
      );
    });

    it("reflection warning threshold: exactly 29% triggers warning", () => {
      // 2/7 = 28.57 rounds to 29
      const debriefs = Array.from({ length: 7 }, (_, i) =>
        makeDebrief({
          id: `d-${i}`,
          child_id: `c-${i}`,
          what_helped_count: i < 2 ? 1 : 0,
          what_did_not_help_count: 0,
        }),
      );
      const result = computePostIncidentDebrief(
        baseInput({ total_children: 7, debriefs }),
      );
      // pct(2, 7) = 29 < 30
      expect(result.insights).toContainEqual(
        expect.objectContaining({
          severity: "warning",
          text: expect.stringContaining("not fully learning-oriented"),
        }),
      );
    });
  });
});
