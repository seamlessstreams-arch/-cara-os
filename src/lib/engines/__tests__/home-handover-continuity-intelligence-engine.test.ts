// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME HANDOVER CONTINUITY INTELLIGENCE ENGINE — TESTS
// ══════════════════════════════════════════════════════════════════════════════

import {
  computeHomeHandoverContinuity,
  type HandoverInput,
  type HomeHandoverInput,
} from "../home-handover-continuity-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2026-05-26";

function makeHandover(overrides: Partial<HandoverInput> = {}): HandoverInput {
  return {
    id: "hnd_001",
    shift_date: TODAY,
    shift_from: "day",
    shift_to: "sleep_in",
    handover_time: "21:30",
    completed_at: TODAY + "T21:45:00Z",
    outgoing_staff_count: 2,
    incoming_staff_count: 2,
    signed_off_by: "staff_darren",
    sign_off_count: 2,
    child_update_count: 3,
    child_updates_with_mood: 3,
    child_updates_with_alerts: 1,
    total_children: 3,
    flag_count: 2,
    linked_incident_count: 1,
    has_general_notes: true,
    ...overrides,
  };
}

function baseInput(overrides: Partial<HomeHandoverInput> = {}): HomeHandoverInput {
  return {
    today: TODAY,
    handovers: [],
    ...overrides,
  };
}

// ── Insufficient Data ───────────────────────────────────────────────────────

describe("Home Handover Continuity Intelligence Engine", () => {
  describe("insufficient data", () => {
    it("returns insufficient_data with no handovers", () => {
      const r = computeHomeHandoverContinuity(baseInput());
      expect(r.handover_rating).toBe("insufficient_data");
      expect(r.handover_score).toBe(0);
      expect(r.concerns.length).toBeGreaterThan(0);
      expect(r.recommendations.length).toBe(1);
      expect(r.insights.length).toBe(1);
      expect(r.insights[0].severity).toBe("critical");
    });

    it("returns insufficient_data when all handovers are outside lookback window", () => {
      const r = computeHomeHandoverContinuity(baseInput({
        handovers: [makeHandover({ shift_date: "2026-04-01" })],
        lookback_days: 30,
      }));
      expect(r.handover_rating).toBe("insufficient_data");
      expect(r.handover_score).toBe(0);
    });

    it("includes handovers within lookback window", () => {
      const r = computeHomeHandoverContinuity(baseInput({
        handovers: [makeHandover({ shift_date: "2026-05-20" })],
        lookback_days: 30,
      }));
      expect(r.handover_rating).not.toBe("insufficient_data");
    });
  });

  // ── Outstanding ───────────────────────────────────────────────────────────

  describe("outstanding rating", () => {
    it("achieves outstanding with perfect handover practice", () => {
      // Base 52
      // +5 completion 100%, +4 signoff 100%, +3 staff signoff 100%,
      // +4 child coverage 100%, +3 mood 100%, +3 full coverage 100%,
      // +3 notes 100%, +3 incident linkage >= 30%
      // = 52 + 28 = 80
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandover({ id: `hnd_${i}`, shift_date: `2026-05-${String(16 + i).padStart(2, "0")}` })
      );
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      expect(r.handover_rating).toBe("outstanding");
      expect(r.handover_score).toBe(80);
    });

    it("generates strengths for outstanding practice", () => {
      const handovers = Array.from({ length: 5 }, (_, i) =>
        makeHandover({ id: `hnd_${i}`, shift_date: `2026-05-${String(21 + i).padStart(2, "0")}` })
      );
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      expect(r.strengths.length).toBeGreaterThan(0);
      expect(r.strengths.some(s => s.includes("completion"))).toBe(true);
      expect(r.strengths.some(s => s.includes("sign-off"))).toBe(true);
    });
  });

  // ── Good ──────────────────────────────────────────────────────────────────

  describe("good rating", () => {
    it("achieves good with high completion but moderate sign-off", () => {
      // 10 handovers: 9 completed, 7 manager sign-off, all child coverage
      // completion: 90% → +5, signoff: 70% → +1, staff signoff varies
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandover({
          id: `hnd_${i}`,
          shift_date: `2026-05-${String(16 + i).padStart(2, "0")}`,
          completed_at: i < 9 ? TODAY + "T21:45:00Z" : null,
          signed_off_by: i < 7 ? "staff_darren" : null,
          sign_off_count: i < 7 ? 2 : 0,
        })
      );
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      // 52 + 5(comp 90%) + 1(mgr signoff 70%) + ...
      // staff signoff: avg = (7*100 + 3*0)/10 = 70 → +1
      // child coverage 100% → +4, mood 100% → +3
      // full coverage 100% → +3, notes 100% → +3
      // incidents: all have linked_incident_count=1 → linkageRate=100% → +3
      // = 52+5+1+1+4+3+3+3+3 = 75
      expect(r.handover_rating).toBe("good");
      expect(r.handover_score).toBe(75);
    });
  });

  // ── Adequate ──────────────────────────────────────────────────────────────

  describe("adequate rating", () => {
    it("achieves adequate with mixed completion and no sign-off", () => {
      // 10 handovers: 6 completed, 0 sign-off, child coverage ok
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandover({
          id: `hnd_${i}`,
          shift_date: `2026-05-${String(16 + i).padStart(2, "0")}`,
          completed_at: i < 6 ? TODAY + "T21:45:00Z" : null,
          signed_off_by: null,
          sign_off_count: 0,
        })
      );
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      // 52 + (-1)(comp 60%) + (-3)(mgr signoff 0%) + (-2)(staff signoff 0%)
      // + 4(child 100%) + 3(mood 100%) + 3(full 100%) + 3(notes 100%)
      // + 3(incident linkage 100%)
      // = 52 -1 -3 -2 +4 +3 +3 +3 +3 = 62
      expect(r.handover_rating).toBe("adequate");
      expect(r.handover_score).toBe(62);
    });
  });

  // ── Inadequate ────────────────────────────────────────────────────────────

  describe("inadequate rating", () => {
    it("scores inadequate with poor completion and no sign-off or coverage", () => {
      // 10 handovers: 3 completed, 0 sign-off, 0 child updates, no notes
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandover({
          id: `hnd_${i}`,
          shift_date: `2026-05-${String(16 + i).padStart(2, "0")}`,
          completed_at: i < 3 ? TODAY + "T21:45:00Z" : null,
          signed_off_by: null,
          sign_off_count: 0,
          child_update_count: 0,
          child_updates_with_mood: 0,
          child_updates_with_alerts: 0,
          flag_count: 0,
          linked_incident_count: 0,
          has_general_notes: false,
        })
      );
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      // 52 + (-4)(comp 30%) + (-3)(mgr signoff 0%) + (-2)(staff signoff 0%)
      // + (-3)(child coverage 0%) + 0(no child updates) + (-1)(full coverage 0%)
      // + (-1)(notes 0%) + 0(no incidents)
      // = 52 -4 -3 -2 -3 -1 -1 = 38
      expect(r.handover_rating).toBe("inadequate");
      expect(r.handover_score).toBe(38);
    });

    it("generates critical insights for very poor practice", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandover({
          id: `hnd_${i}`,
          shift_date: `2026-05-${String(16 + i).padStart(2, "0")}`,
          completed_at: i < 3 ? TODAY + "T21:45:00Z" : null,
          signed_off_by: null,
          sign_off_count: 0,
          child_update_count: 1,
          child_updates_with_mood: 0,
          child_updates_with_alerts: 0,
          total_children: 3,
          flag_count: 0,
          linked_incident_count: 0,
          has_general_notes: false,
        })
      );
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      expect(r.insights.some(i => i.severity === "critical")).toBe(true);
      expect(r.concerns.length).toBeGreaterThan(0);
      expect(r.recommendations.length).toBeGreaterThan(0);
    });
  });

  // ── Completion Profile ────────────────────────────────────────────────────

  describe("completion profile", () => {
    it("calculates completion rate correctly", () => {
      const handovers = [
        makeHandover({ id: "hnd_1", shift_date: "2026-05-20", completed_at: TODAY + "T21:45:00Z" }),
        makeHandover({ id: "hnd_2", shift_date: "2026-05-21", completed_at: null }),
        makeHandover({ id: "hnd_3", shift_date: "2026-05-22", completed_at: TODAY + "T07:45:00Z" }),
      ];
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      expect(r.completion_profile.total_handovers).toBe(3);
      expect(r.completion_profile.completed_count).toBe(2);
      expect(r.completion_profile.incomplete_count).toBe(1);
      expect(r.completion_profile.completion_rate).toBe(67); // Math.round(2/3*100)
    });

    it("returns 100% when all handovers are completed", () => {
      const handovers = [
        makeHandover({ id: "hnd_1", shift_date: "2026-05-20" }),
        makeHandover({ id: "hnd_2", shift_date: "2026-05-21" }),
      ];
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      expect(r.completion_profile.completion_rate).toBe(100);
      expect(r.completion_profile.incomplete_count).toBe(0);
    });

    it("returns 0% when no handovers are completed", () => {
      const handovers = [
        makeHandover({ id: "hnd_1", shift_date: "2026-05-20", completed_at: null }),
        makeHandover({ id: "hnd_2", shift_date: "2026-05-21", completed_at: null }),
      ];
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      expect(r.completion_profile.completion_rate).toBe(0);
      expect(r.completion_profile.completed_count).toBe(0);
    });
  });

  // ── Sign-Off Profile ──────────────────────────────────────────────────────

  describe("sign-off profile", () => {
    it("calculates manager sign-off rate", () => {
      const handovers = [
        makeHandover({ id: "hnd_1", shift_date: "2026-05-20", signed_off_by: "staff_darren" }),
        makeHandover({ id: "hnd_2", shift_date: "2026-05-21", signed_off_by: null }),
        makeHandover({ id: "hnd_3", shift_date: "2026-05-22", signed_off_by: "staff_darren" }),
        makeHandover({ id: "hnd_4", shift_date: "2026-05-23", signed_off_by: null }),
      ];
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      expect(r.sign_off_profile.signed_off_count).toBe(2);
      expect(r.sign_off_profile.sign_off_rate).toBe(50);
    });

    it("calculates average staff sign-off rate", () => {
      const handovers = [
        makeHandover({ id: "hnd_1", shift_date: "2026-05-20", incoming_staff_count: 3, sign_off_count: 3 }),
        makeHandover({ id: "hnd_2", shift_date: "2026-05-21", incoming_staff_count: 2, sign_off_count: 1 }),
      ];
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      // hnd_1: 100%, hnd_2: 50%, avg = 75%
      expect(r.sign_off_profile.avg_staff_sign_off_rate).toBe(75);
    });

    it("counts fully signed handovers", () => {
      const handovers = [
        makeHandover({ id: "hnd_1", shift_date: "2026-05-20", incoming_staff_count: 2, sign_off_count: 2 }),
        makeHandover({ id: "hnd_2", shift_date: "2026-05-21", incoming_staff_count: 3, sign_off_count: 2 }),
        makeHandover({ id: "hnd_3", shift_date: "2026-05-22", incoming_staff_count: 2, sign_off_count: 2 }),
      ];
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      expect(r.sign_off_profile.fully_signed_count).toBe(2);
    });

    it("handles zero incoming staff gracefully", () => {
      const handovers = [
        makeHandover({ id: "hnd_1", shift_date: "2026-05-20", incoming_staff_count: 0, sign_off_count: 0 }),
      ];
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      expect(r.sign_off_profile.avg_staff_sign_off_rate).toBe(0);
      expect(r.sign_off_profile.fully_signed_count).toBe(0);
    });
  });

  // ── Child Coverage Profile ────────────────────────────────────────────────

  describe("child coverage profile", () => {
    it("calculates average child coverage", () => {
      const handovers = [
        makeHandover({ id: "hnd_1", shift_date: "2026-05-20", child_update_count: 3, total_children: 3 }),
        makeHandover({ id: "hnd_2", shift_date: "2026-05-21", child_update_count: 2, total_children: 3 }),
      ];
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      // hnd_1: 100%, hnd_2: 67%, avg = 84%
      expect(r.child_coverage_profile.avg_child_coverage).toBe(84);
    });

    it("counts full coverage handovers", () => {
      const handovers = [
        makeHandover({ id: "hnd_1", shift_date: "2026-05-20", child_update_count: 3, total_children: 3 }),
        makeHandover({ id: "hnd_2", shift_date: "2026-05-21", child_update_count: 2, total_children: 3 }),
        makeHandover({ id: "hnd_3", shift_date: "2026-05-22", child_update_count: 3, total_children: 3 }),
      ];
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      expect(r.child_coverage_profile.full_coverage_count).toBe(2);
    });

    it("calculates mood recording rate", () => {
      const handovers = [
        makeHandover({ id: "hnd_1", shift_date: "2026-05-20", child_update_count: 3, child_updates_with_mood: 2 }),
        makeHandover({ id: "hnd_2", shift_date: "2026-05-21", child_update_count: 3, child_updates_with_mood: 3 }),
      ];
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      // total updates: 6, with mood: 5 → 83%
      expect(r.child_coverage_profile.mood_recording_rate).toBe(83);
    });

    it("calculates alert recording rate", () => {
      const handovers = [
        makeHandover({ id: "hnd_1", shift_date: "2026-05-20", child_update_count: 3, child_updates_with_alerts: 2 }),
        makeHandover({ id: "hnd_2", shift_date: "2026-05-21", child_update_count: 3, child_updates_with_alerts: 1 }),
      ];
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      // total updates: 6, with alerts: 3 → 50%
      expect(r.child_coverage_profile.alert_recording_rate).toBe(50);
    });

    it("handles zero total children gracefully", () => {
      const handovers = [
        makeHandover({ id: "hnd_1", shift_date: "2026-05-20", child_update_count: 0, total_children: 0 }),
      ];
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      expect(r.child_coverage_profile.avg_child_coverage).toBe(0);
      expect(r.child_coverage_profile.full_coverage_count).toBe(0);
    });
  });

  // ── Continuity Profile ────────────────────────────────────────────────────

  describe("continuity profile", () => {
    it("calculates average flags per handover", () => {
      const handovers = [
        makeHandover({ id: "hnd_1", shift_date: "2026-05-20", flag_count: 3 }),
        makeHandover({ id: "hnd_2", shift_date: "2026-05-21", flag_count: 1 }),
      ];
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      expect(r.continuity_profile.avg_flags_per_handover).toBe(2); // (3+1)/2 = 2.0
    });

    it("counts handovers with flags", () => {
      const handovers = [
        makeHandover({ id: "hnd_1", shift_date: "2026-05-20", flag_count: 3 }),
        makeHandover({ id: "hnd_2", shift_date: "2026-05-21", flag_count: 0 }),
        makeHandover({ id: "hnd_3", shift_date: "2026-05-22", flag_count: 1 }),
      ];
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      expect(r.continuity_profile.handovers_with_flags).toBe(2);
    });

    it("counts handovers with linked incidents", () => {
      const handovers = [
        makeHandover({ id: "hnd_1", shift_date: "2026-05-20", linked_incident_count: 1 }),
        makeHandover({ id: "hnd_2", shift_date: "2026-05-21", linked_incident_count: 0 }),
        makeHandover({ id: "hnd_3", shift_date: "2026-05-22", linked_incident_count: 2 }),
      ];
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      expect(r.continuity_profile.handovers_with_incidents).toBe(2);
    });

    it("calculates notes recording rate", () => {
      const handovers = [
        makeHandover({ id: "hnd_1", shift_date: "2026-05-20", has_general_notes: true }),
        makeHandover({ id: "hnd_2", shift_date: "2026-05-21", has_general_notes: false }),
        makeHandover({ id: "hnd_3", shift_date: "2026-05-22", has_general_notes: true }),
        makeHandover({ id: "hnd_4", shift_date: "2026-05-23", has_general_notes: true }),
      ];
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      expect(r.continuity_profile.notes_recording_rate).toBe(75);
    });
  });

  // ── Scoring Modifiers ─────────────────────────────────────────────────────

  describe("scoring modifiers", () => {
    it("applies full bonus for 100% completion (+5)", () => {
      // Single perfect handover
      const r = computeHomeHandoverContinuity(baseInput({
        handovers: [makeHandover({ shift_date: "2026-05-20" })],
      }));
      // All bonuses apply: 52+5+4+3+4+3+3+3+3 = 80
      expect(r.handover_score).toBe(80);
    });

    it("applies penalty for <50% completion (-4)", () => {
      const handovers = [
        makeHandover({ id: "hnd_1", shift_date: "2026-05-20", completed_at: null }),
        makeHandover({ id: "hnd_2", shift_date: "2026-05-21", completed_at: null }),
        makeHandover({ id: "hnd_3", shift_date: "2026-05-22", completed_at: TODAY + "T21:00:00Z" }),
      ];
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      // comp: 33% → -4 (instead of +5), diff = -9
      // rest same as perfect (signoff/coverage/mood/fullcov/notes/incident all 100%)
      // 80 - 9 = 71
      expect(r.handover_score).toBe(71);
    });

    it("applies penalty for 0% manager sign-off (-3)", () => {
      const handovers = [
        makeHandover({ id: "hnd_1", shift_date: "2026-05-20", signed_off_by: null }),
        makeHandover({ id: "hnd_2", shift_date: "2026-05-21", signed_off_by: null }),
      ];
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      // signoff: 0% → -3 (instead of +4), diff = -7
      // staff signoff still 100% since sign_off_count=2, incoming=2
      // 80 - 7 = 73
      expect(r.handover_score).toBe(73);
    });

    it("applies penalty for poor staff sign-off (-2)", () => {
      const handovers = [
        makeHandover({ id: "hnd_1", shift_date: "2026-05-20", sign_off_count: 0, incoming_staff_count: 3 }),
        makeHandover({ id: "hnd_2", shift_date: "2026-05-21", sign_off_count: 0, incoming_staff_count: 2 }),
      ];
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      // staff signoff: avg 0% → -2 (instead of +3), diff = -5
      // also fully_signed_count = 0: fullCoverageRate for sign-offs is N/A but...
      // full_coverage for children is still 100%
      // 80 - 5 = 75
      expect(r.handover_score).toBe(75);
    });

    it("applies penalty for low child coverage (-3)", () => {
      const handovers = [
        makeHandover({ id: "hnd_1", shift_date: "2026-05-20", child_update_count: 1, total_children: 3, child_updates_with_mood: 1 }),
        makeHandover({ id: "hnd_2", shift_date: "2026-05-21", child_update_count: 1, total_children: 3, child_updates_with_mood: 1 }),
      ];
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      // child coverage: avg 33% → -3 (instead of +4), diff = -7
      // mood: 100% → +3
      // full coverage: 0% → -1 (instead of +3), diff = -4
      // 80 - 7 - 4 = 69
      expect(r.handover_score).toBe(69);
    });

    it("applies mood recording bonus for >= 80%", () => {
      const handovers = [
        makeHandover({ id: "hnd_1", shift_date: "2026-05-20", child_update_count: 5, child_updates_with_mood: 5 }),
      ];
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      // mood: 100% → +3 (in the default perfect handover path)
      expect(r.handover_score).toBe(80);
    });

    it("applies mood recording penalty for <50%", () => {
      const handovers = [
        makeHandover({ id: "hnd_1", shift_date: "2026-05-20", child_update_count: 3, child_updates_with_mood: 1, child_updates_with_alerts: 0 }),
      ];
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      // mood: 33% → -2 (instead of +3), diff = -5
      // alert recording doesn't affect scoring directly
      // 80 - 5 = 75
      expect(r.handover_score).toBe(75);
    });

    it("skips mood scoring when no child updates exist", () => {
      const handovers = [
        makeHandover({
          id: "hnd_1", shift_date: "2026-05-20",
          child_update_count: 0, child_updates_with_mood: 0, child_updates_with_alerts: 0,
          total_children: 3,
        }),
      ];
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      // child coverage 0% → -3, full coverage 0% → -1, mood: skipped (0 updates)
      // total: 52+5+4+3-3+0-1+3+3 = 66
      expect(r.handover_score).toBe(66);
    });

    it("gives bonus for incident linkage >= 30%", () => {
      const handovers = [
        makeHandover({ id: "hnd_1", shift_date: "2026-05-20", linked_incident_count: 1 }),
        makeHandover({ id: "hnd_2", shift_date: "2026-05-21", linked_incident_count: 0 }),
        makeHandover({ id: "hnd_3", shift_date: "2026-05-22", linked_incident_count: 0 }),
      ];
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      // linkageRate: 33% → +3
      expect(r.handover_score).toBe(80);
    });

    it("gives smaller bonus for incident linkage < 30%", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandover({
          id: `hnd_${i}`,
          shift_date: `2026-05-${String(16 + i).padStart(2, "0")}`,
          linked_incident_count: i < 2 ? 1 : 0,
        })
      );
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      // linkageRate: 20% → +1 (instead of +3), diff = -2
      // 80 - 2 = 78
      expect(r.handover_score).toBe(78);
    });

    it("gives no incident bonus when no incidents linked", () => {
      const handovers = [
        makeHandover({ id: "hnd_1", shift_date: "2026-05-20", linked_incident_count: 0 }),
      ];
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      // No incident linkage bonus: 80 - 3 = 77
      expect(r.handover_score).toBe(77);
    });
  });

  // ── Lookback Window ───────────────────────────────────────────────────────

  describe("lookback window", () => {
    it("uses default 30-day lookback", () => {
      const handovers = [
        makeHandover({ id: "hnd_1", shift_date: "2026-04-27" }), // 29 days ago = in window
        makeHandover({ id: "hnd_2", shift_date: "2026-04-25" }), // 31 days ago = outside
      ];
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      expect(r.completion_profile.total_handovers).toBe(1);
    });

    it("respects custom lookback_days", () => {
      const handovers = [
        makeHandover({ id: "hnd_1", shift_date: "2026-05-20" }), // 6 days ago
        makeHandover({ id: "hnd_2", shift_date: "2026-05-10" }), // 16 days ago
      ];
      const r = computeHomeHandoverContinuity(baseInput({ handovers, lookback_days: 7 }));
      expect(r.completion_profile.total_handovers).toBe(1);
    });

    it("includes handovers on the cutoff date boundary", () => {
      // today = 2026-05-26, lookback 30 days → cutoff = 2026-04-26
      const handovers = [
        makeHandover({ id: "hnd_1", shift_date: "2026-04-26" }), // exactly on cutoff
      ];
      const r = computeHomeHandoverContinuity(baseInput({ handovers, lookback_days: 30 }));
      expect(r.completion_profile.total_handovers).toBe(1);
    });

    it("excludes future handovers", () => {
      const handovers = [
        makeHandover({ id: "hnd_1", shift_date: "2026-05-27" }), // tomorrow
        makeHandover({ id: "hnd_2", shift_date: "2026-05-26" }), // today
      ];
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      expect(r.completion_profile.total_handovers).toBe(1);
    });
  });

  // ── Strengths ─────────────────────────────────────────────────────────────

  describe("strengths", () => {
    it("includes 100% completion strength", () => {
      const handovers = [makeHandover({ shift_date: "2026-05-20" })];
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      expect(r.strengths.some(s => s.includes("100% handover completion"))).toBe(true);
    });

    it("includes >=90% completion strength when not 100%", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandover({
          id: `hnd_${i}`,
          shift_date: `2026-05-${String(16 + i).padStart(2, "0")}`,
          completed_at: i < 9 ? TODAY + "T21:45:00Z" : null,
        })
      );
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      expect(r.strengths.some(s => s.includes("90% handover completion"))).toBe(true);
    });

    it("includes sign-off strength when >= 80%", () => {
      const handovers = [makeHandover({ shift_date: "2026-05-20" })];
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      expect(r.strengths.some(s => s.includes("sign-off rate"))).toBe(true);
    });

    it("includes child coverage strength when >= 90%", () => {
      const handovers = [makeHandover({ shift_date: "2026-05-20" })];
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      expect(r.strengths.some(s => s.includes("child coverage"))).toBe(true);
    });

    it("includes mood recording strength when >= 80%", () => {
      const handovers = [makeHandover({ shift_date: "2026-05-20" })];
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      expect(r.strengths.some(s => s.includes("mood score recording"))).toBe(true);
    });

    it("includes fully signed strength when all incoming staff signed", () => {
      const handovers = [makeHandover({ shift_date: "2026-05-20" })];
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      expect(r.strengths.some(s => s.includes("All incoming staff signed off"))).toBe(true);
    });

    it("includes notes strength when >= 80%", () => {
      const handovers = [makeHandover({ shift_date: "2026-05-20" })];
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      expect(r.strengths.some(s => s.includes("General notes recorded"))).toBe(true);
    });

    it("includes incident linkage strength", () => {
      const handovers = [makeHandover({ shift_date: "2026-05-20", linked_incident_count: 1 })];
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      expect(r.strengths.some(s => s.includes("Incidents linked"))).toBe(true);
    });
  });

  // ── Concerns ──────────────────────────────────────────────────────────────

  describe("concerns", () => {
    it("flags incomplete handovers", () => {
      const handovers = [
        makeHandover({ id: "hnd_1", shift_date: "2026-05-20", completed_at: null }),
      ];
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      expect(r.concerns.some(c => c.includes("incomplete"))).toBe(true);
    });

    it("flags low manager sign-off rate", () => {
      const handovers = [
        makeHandover({ id: "hnd_1", shift_date: "2026-05-20", signed_off_by: null }),
        makeHandover({ id: "hnd_2", shift_date: "2026-05-21", signed_off_by: null }),
        makeHandover({ id: "hnd_3", shift_date: "2026-05-22", signed_off_by: null }),
      ];
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      expect(r.concerns.some(c => c.includes("sign-off"))).toBe(true);
    });

    it("flags low staff sign-off rate", () => {
      const handovers = [
        makeHandover({ id: "hnd_1", shift_date: "2026-05-20", sign_off_count: 0, incoming_staff_count: 3 }),
        makeHandover({ id: "hnd_2", shift_date: "2026-05-21", sign_off_count: 0, incoming_staff_count: 2 }),
      ];
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      expect(r.concerns.some(c => c.includes("staff sign-off rate"))).toBe(true);
    });

    it("flags low child coverage", () => {
      const handovers = [
        makeHandover({ id: "hnd_1", shift_date: "2026-05-20", child_update_count: 1, total_children: 3 }),
      ];
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      expect(r.concerns.some(c => c.includes("child coverage"))).toBe(true);
    });

    it("flags low mood recording rate", () => {
      const handovers = [
        makeHandover({ id: "hnd_1", shift_date: "2026-05-20", child_update_count: 3, child_updates_with_mood: 1 }),
      ];
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      expect(r.concerns.some(c => c.includes("mood scores"))).toBe(true);
    });

    it("flags low notes recording rate", () => {
      const handovers = [
        makeHandover({ id: "hnd_1", shift_date: "2026-05-20", has_general_notes: false }),
        makeHandover({ id: "hnd_2", shift_date: "2026-05-21", has_general_notes: false }),
        makeHandover({ id: "hnd_3", shift_date: "2026-05-22", has_general_notes: false }),
      ];
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      expect(r.concerns.some(c => c.includes("general notes"))).toBe(true);
    });

    it("flags critically low completion rate", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandover({
          id: `hnd_${i}`,
          shift_date: `2026-05-${String(16 + i).padStart(2, "0")}`,
          completed_at: i < 3 ? TODAY + "T21:45:00Z" : null,
        })
      );
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      expect(r.concerns.some(c => c.includes("half of handovers"))).toBe(true);
    });
  });

  // ── Recommendations ───────────────────────────────────────────────────────

  describe("recommendations", () => {
    it("recommends completion improvement when < 70%", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandover({
          id: `hnd_${i}`,
          shift_date: `2026-05-${String(16 + i).padStart(2, "0")}`,
          completed_at: i < 5 ? TODAY + "T21:45:00Z" : null,
        })
      );
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("completed"))).toBe(true);
    });

    it("recommends manager sign-off when < 50%", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandover({
          id: `hnd_${i}`,
          shift_date: `2026-05-${String(16 + i).padStart(2, "0")}`,
          signed_off_by: i < 4 ? "staff_darren" : null,
        })
      );
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("manager sign-off"))).toBe(true);
    });

    it("recommends child coverage when < 70%", () => {
      const handovers = [
        makeHandover({ id: "hnd_1", shift_date: "2026-05-20", child_update_count: 1, total_children: 3 }),
      ];
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("child"))).toBe(true);
    });

    it("recommends mood recording when < 50%", () => {
      const handovers = [
        makeHandover({ id: "hnd_1", shift_date: "2026-05-20", child_update_count: 5, child_updates_with_mood: 1 }),
      ];
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("mood score"))).toBe(true);
    });

    it("assigns urgency levels appropriately", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandover({
          id: `hnd_${i}`,
          shift_date: `2026-05-${String(16 + i).padStart(2, "0")}`,
          completed_at: i < 3 ? TODAY + "T21:45:00Z" : null,
          signed_off_by: null,
          sign_off_count: 0,
          child_update_count: 1,
          child_updates_with_mood: 0,
          total_children: 3,
          has_general_notes: false,
        })
      );
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      expect(r.recommendations.some(rec => rec.urgency === "immediate")).toBe(true);
      expect(r.recommendations.some(rec => rec.urgency === "soon")).toBe(true);
    });

    it("generates no recommendations for perfect practice", () => {
      const handovers = [makeHandover({ shift_date: "2026-05-20" })];
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      expect(r.recommendations.length).toBe(0);
    });
  });

  // ── Insights ──────────────────────────────────────────────────────────────

  describe("insights", () => {
    it("generates positive insight for exemplary practice", () => {
      const handovers = Array.from({ length: 5 }, (_, i) =>
        makeHandover({ id: `hnd_${i}`, shift_date: `2026-05-${String(21 + i).padStart(2, "0")}` })
      );
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("exemplary"))).toBe(true);
    });

    it("generates critical insight for poor completion", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandover({
          id: `hnd_${i}`,
          shift_date: `2026-05-${String(16 + i).padStart(2, "0")}`,
          completed_at: i < 5 ? TODAY + "T21:45:00Z" : null,
        })
      );
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("incomplete"))).toBe(true);
    });

    it("generates critical insight for very low sign-off", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandover({
          id: `hnd_${i}`,
          shift_date: `2026-05-${String(16 + i).padStart(2, "0")}`,
          signed_off_by: i < 2 ? "staff_darren" : null,
        })
      );
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("sign-off"))).toBe(true);
    });

    it("generates critical insight for very low child coverage", () => {
      const handovers = Array.from({ length: 5 }, (_, i) =>
        makeHandover({
          id: `hnd_${i}`,
          shift_date: `2026-05-${String(21 + i).padStart(2, "0")}`,
          child_update_count: 1,
          child_updates_with_mood: 1,
          total_children: 3,
        })
      );
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("child coverage"))).toBe(true);
    });

    it("generates positive insight for strong child-centred practice", () => {
      const handovers = Array.from({ length: 5 }, (_, i) =>
        makeHandover({ id: `hnd_${i}`, shift_date: `2026-05-${String(21 + i).padStart(2, "0")}` })
      );
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("child-centred"))).toBe(true);
    });

    it("generates positive insight for flags and incident linkage", () => {
      const handovers = [
        makeHandover({ id: "hnd_1", shift_date: "2026-05-20", flag_count: 2, linked_incident_count: 1 }),
      ];
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      expect(r.insights.some(i => i.text.includes("flags") && i.text.includes("incident"))).toBe(true);
    });
  });

  // ── Headlines ─────────────────────────────────────────────────────────────

  describe("headlines", () => {
    it("generates outstanding headline", () => {
      const handovers = [makeHandover({ shift_date: "2026-05-20" })];
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      expect(r.headline).toContain("Outstanding");
    });

    it("generates good headline", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandover({
          id: `hnd_${i}`,
          shift_date: `2026-05-${String(16 + i).padStart(2, "0")}`,
          completed_at: i < 9 ? TODAY + "T21:45:00Z" : null,
          signed_off_by: i < 7 ? "staff_darren" : null,
          sign_off_count: i < 7 ? 2 : 0,
        })
      );
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      expect(r.headline).toContain("Good");
    });

    it("generates adequate headline", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandover({
          id: `hnd_${i}`,
          shift_date: `2026-05-${String(16 + i).padStart(2, "0")}`,
          completed_at: i < 6 ? TODAY + "T21:45:00Z" : null,
          signed_off_by: null,
          sign_off_count: 0,
        })
      );
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      expect(r.headline).toContain("Adequate");
    });

    it("generates inadequate headline", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandover({
          id: `hnd_${i}`,
          shift_date: `2026-05-${String(16 + i).padStart(2, "0")}`,
          completed_at: i < 3 ? TODAY + "T21:45:00Z" : null,
          signed_off_by: null,
          sign_off_count: 0,
          child_update_count: 0,
          child_updates_with_mood: 0,
          child_updates_with_alerts: 0,
          flag_count: 0,
          linked_incident_count: 0,
          has_general_notes: false,
        })
      );
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      expect(r.headline).toContain("inadequate");
    });

    it("generates insufficient_data headline", () => {
      const r = computeHomeHandoverContinuity(baseInput());
      expect(r.headline).toContain("No handover data");
    });
  });

  // ── Edge Cases ────────────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("handles single handover correctly", () => {
      const r = computeHomeHandoverContinuity(baseInput({
        handovers: [makeHandover({ shift_date: "2026-05-20" })],
      }));
      expect(r.handover_rating).toBe("outstanding");
      expect(r.completion_profile.total_handovers).toBe(1);
    });

    it("handles handover with all zeroes", () => {
      const r = computeHomeHandoverContinuity(baseInput({
        handovers: [makeHandover({
          shift_date: "2026-05-20",
          completed_at: null,
          outgoing_staff_count: 0,
          incoming_staff_count: 0,
          signed_off_by: null,
          sign_off_count: 0,
          child_update_count: 0,
          child_updates_with_mood: 0,
          child_updates_with_alerts: 0,
          total_children: 0,
          flag_count: 0,
          linked_incident_count: 0,
          has_general_notes: false,
        })],
      }));
      expect(r.handover_rating).not.toBe("insufficient_data");
      expect(r.handover_score).toBeGreaterThan(0);
    });

    it("clamps score at 0 minimum", () => {
      // All penalties can't go below 0
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandover({
          id: `hnd_${i}`,
          shift_date: `2026-05-${String(16 + i).padStart(2, "0")}`,
          completed_at: null,
          signed_off_by: null,
          sign_off_count: 0,
          incoming_staff_count: 3,
          child_update_count: 0,
          child_updates_with_mood: 0,
          child_updates_with_alerts: 0,
          total_children: 3,
          flag_count: 0,
          linked_incident_count: 0,
          has_general_notes: false,
        })
      );
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      expect(r.handover_score).toBeGreaterThanOrEqual(0);
    });

    it("clamps score at 100 maximum", () => {
      // Can't exceed 100 even with all bonuses
      const handovers = [makeHandover({ shift_date: "2026-05-20" })];
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      expect(r.handover_score).toBeLessThanOrEqual(100);
    });

    it("handles large number of handovers efficiently", () => {
      const handovers = Array.from({ length: 100 }, (_, i) =>
        makeHandover({
          id: `hnd_${i}`,
          shift_date: `2026-05-${String(Math.max(1, 26 - (i % 26))).padStart(2, "0")}`,
        })
      );
      const r = computeHomeHandoverContinuity(baseInput({ handovers }));
      expect(r.handover_rating).toBeDefined();
      expect(r.completion_profile.total_handovers).toBeGreaterThan(0);
    });

    it("plural forms correct for single incomplete handover", () => {
      const r = computeHomeHandoverContinuity(baseInput({
        handovers: [
          makeHandover({ id: "hnd_1", shift_date: "2026-05-20" }),
          makeHandover({ id: "hnd_2", shift_date: "2026-05-21", completed_at: null }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("1 handover incomplete"))).toBe(true);
    });

    it("plural forms correct for multiple incomplete handovers", () => {
      const r = computeHomeHandoverContinuity(baseInput({
        handovers: [
          makeHandover({ id: "hnd_1", shift_date: "2026-05-20", completed_at: null }),
          makeHandover({ id: "hnd_2", shift_date: "2026-05-21", completed_at: null }),
          makeHandover({ id: "hnd_3", shift_date: "2026-05-22" }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("2 handovers incomplete"))).toBe(true);
    });
  });
});
