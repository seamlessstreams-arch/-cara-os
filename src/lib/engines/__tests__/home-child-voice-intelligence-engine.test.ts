// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME CHILD VOICE INTELLIGENCE ENGINE TESTS
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeHomeChildVoice,
  type HomeChildVoiceInput,
  type HouseMeetingInput,
  type VisitorInput,
} from "../home-child-voice-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeMeeting(overrides: Partial<HouseMeetingInput> = {}): HouseMeetingInput {
  return {
    id: "hm_1",
    date: "2026-05-20",
    children_present: 3,
    children_absent: 0,
    child_raised_topics: 2,
    total_agenda_items: 3,
    child_feedback_count: 3,
    new_actions_count: 2,
    previous_actions_completed: 2,
    previous_actions_total: 2,
    duration_minutes: 30,
    ...overrides,
  };
}

function makeVisitor(overrides: Partial<VisitorInput> = {}): VisitorInput {
  return {
    id: "vis_1",
    date: "2026-05-20",
    category: "professional",
    dbs_checked: true,
    id_verified: true,
    status: "signed_out",
    children_seen_count: 2,
    ...overrides,
  };
}

function baseInput(overrides: Partial<HomeChildVoiceInput> = {}): HomeChildVoiceInput {
  return {
    today: "2026-05-26",
    total_children: 3,
    house_meetings: [
      makeMeeting({ id: "hm_1", date: "2026-05-20" }),
      makeMeeting({ id: "hm_2", date: "2026-05-13" }),
      makeMeeting({ id: "hm_3", date: "2026-05-06" }),
      makeMeeting({ id: "hm_4", date: "2026-04-29" }),
    ],
    visitors: [
      makeVisitor({ id: "vis_1", date: "2026-05-20" }),
      makeVisitor({ id: "vis_2", date: "2026-05-15", category: "family", dbs_checked: false, children_seen_count: 1 }),
      makeVisitor({ id: "vis_3", date: "2026-05-10", category: "inspector", children_seen_count: 3 }),
    ],
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe("Home Child Voice Intelligence Engine", () => {

  // ── Insufficient Data ────────────────────────────────────────────────

  describe("insufficient data", () => {
    it("returns insufficient_data when no meetings and no visitors", () => {
      const r = computeHomeChildVoice({ today: "2026-05-26", total_children: 3, house_meetings: [], visitors: [] });
      expect(r.child_voice_rating).toBe("insufficient_data");
      expect(r.child_voice_score).toBe(0);
    });

    it("returns insufficient_data when only 1 visitor and 0 meetings", () => {
      const r = computeHomeChildVoice({ today: "2026-05-26", total_children: 3, house_meetings: [], visitors: [makeVisitor()] });
      expect(r.child_voice_rating).toBe("insufficient_data");
    });

    it("returns insufficient_data when only 1 meeting and 0 visitors", () => {
      const r = computeHomeChildVoice({ today: "2026-05-26", total_children: 3, house_meetings: [makeMeeting()], visitors: [] });
      expect(r.child_voice_rating).toBe("insufficient_data");
    });

    it("provides recommendation in insufficient_data state", () => {
      const r = computeHomeChildVoice({ today: "2026-05-26", total_children: 3, house_meetings: [], visitors: [] });
      expect(r.recommendations.length).toBe(1);
      expect(r.recommendations[0].urgency).toBe("immediate");
    });

    it("provides insight in insufficient_data state", () => {
      const r = computeHomeChildVoice({ today: "2026-05-26", total_children: 3, house_meetings: [], visitors: [] });
      expect(r.insights.length).toBe(1);
      expect(r.insights[0].severity).toBe("warning");
    });

    it("returns empty meetings and visitors profiles with insufficient data", () => {
      const r = computeHomeChildVoice({ today: "2026-05-26", total_children: 3, house_meetings: [], visitors: [] });
      expect(r.meetings.total_meetings_90d).toBe(0);
      expect(r.visitors.total_90d).toBe(0);
    });
  });

  // ── Rating Thresholds ────────────────────────────────────────────────

  describe("rating thresholds", () => {
    it("awards outstanding for high-quality meetings and visitor compliance", () => {
      const r = computeHomeChildVoice(baseInput());
      expect(r.child_voice_score).toBeGreaterThanOrEqual(80);
      expect(r.child_voice_rating).toBe("outstanding");
    });

    it("awards good when attendance dips slightly", () => {
      const meetings = [
        makeMeeting({ id: "hm_1", date: "2026-05-20", children_present: 2, children_absent: 1, child_raised_topics: 1, total_agenda_items: 3, child_feedback_count: 1 }),
        makeMeeting({ id: "hm_2", date: "2026-05-13", children_present: 2, children_absent: 1, child_raised_topics: 1, total_agenda_items: 3, child_feedback_count: 1 }),
        makeMeeting({ id: "hm_3", date: "2026-05-06", children_present: 2, children_absent: 1, child_raised_topics: 1, total_agenda_items: 4, child_feedback_count: 1 }),
      ];
      const r = computeHomeChildVoice(baseInput({ house_meetings: meetings }));
      expect(r.child_voice_score).toBeGreaterThanOrEqual(65);
      expect(r.child_voice_score).toBeLessThan(80);
      expect(r.child_voice_rating).toBe("good");
    });

    it("awards adequate for mediocre meetings", () => {
      const meetings = [
        makeMeeting({ id: "hm_1", date: "2026-05-20", children_present: 2, children_absent: 1, child_raised_topics: 1, total_agenda_items: 4, child_feedback_count: 1, previous_actions_completed: 2, previous_actions_total: 3 }),
        makeMeeting({ id: "hm_2", date: "2026-04-20", children_present: 2, children_absent: 1, child_raised_topics: 1, total_agenda_items: 3, child_feedback_count: 1, previous_actions_completed: 1, previous_actions_total: 2 }),
      ];
      const visitors = [
        makeVisitor({ id: "vis_1", date: "2026-05-20" }),
        makeVisitor({ id: "vis_2", date: "2026-05-15" }),
      ];
      const r = computeHomeChildVoice(baseInput({ house_meetings: meetings, visitors }));
      expect(r.child_voice_score).toBeGreaterThanOrEqual(45);
      expect(r.child_voice_score).toBeLessThan(65);
      expect(r.child_voice_rating).toBe("adequate");
    });

    it("awards inadequate when no meetings and visitors have poor compliance", () => {
      const visitors = [
        makeVisitor({ id: "vis_1", date: "2026-05-20", dbs_checked: false, id_verified: false, status: "signed_in", children_seen_count: 0 }),
        makeVisitor({ id: "vis_2", date: "2026-05-15", dbs_checked: false, id_verified: false, status: "signed_in", children_seen_count: 0 }),
      ];
      const r = computeHomeChildVoice(baseInput({ house_meetings: [], visitors }));
      expect(r.child_voice_score).toBeLessThan(45);
      expect(r.child_voice_rating).toBe("inadequate");
    });
  });

  // ── Meetings Profile ─────────────────────────────────────────────────

  describe("meetings profile", () => {
    it("counts only meetings within 90 days", () => {
      const meetings = [
        makeMeeting({ id: "hm_1", date: "2026-05-20" }),
        makeMeeting({ id: "hm_2", date: "2026-02-01" }),  // >90d ago
      ];
      const r = computeHomeChildVoice(baseInput({ house_meetings: meetings }));
      expect(r.meetings.total_meetings_90d).toBe(1);
    });

    it("calculates average attendance rate", () => {
      const meetings = [
        makeMeeting({ id: "hm_1", date: "2026-05-20", children_present: 3, children_absent: 0 }),
        makeMeeting({ id: "hm_2", date: "2026-05-13", children_present: 2, children_absent: 1 }),
      ];
      const r = computeHomeChildVoice(baseInput({ house_meetings: meetings }));
      // (100 + 66.7) / 2 = 83.3 → 83 (Math.round)
      expect(r.meetings.avg_attendance_rate).toBe(83);
    });

    it("counts full attendance meetings", () => {
      const meetings = [
        makeMeeting({ id: "hm_1", date: "2026-05-20", children_present: 3, children_absent: 0 }),
        makeMeeting({ id: "hm_2", date: "2026-05-13", children_present: 2, children_absent: 1 }),
        makeMeeting({ id: "hm_3", date: "2026-05-06", children_present: 3, children_absent: 0 }),
      ];
      const r = computeHomeChildVoice(baseInput({ house_meetings: meetings }));
      expect(r.meetings.full_attendance_count).toBe(2);
    });

    it("calculates child raised topic rate", () => {
      const meetings = [
        makeMeeting({ id: "hm_1", date: "2026-05-20", child_raised_topics: 2, total_agenda_items: 4 }),
        makeMeeting({ id: "hm_2", date: "2026-05-13", child_raised_topics: 1, total_agenda_items: 2 }),
      ];
      const r = computeHomeChildVoice(baseInput({ house_meetings: meetings }));
      // 3/6 = 50
      expect(r.meetings.child_raised_topic_rate).toBe(50);
    });

    it("calculates average feedback per meeting", () => {
      const meetings = [
        makeMeeting({ id: "hm_1", date: "2026-05-20", child_feedback_count: 3 }),
        makeMeeting({ id: "hm_2", date: "2026-05-13", child_feedback_count: 1 }),
      ];
      const r = computeHomeChildVoice(baseInput({ house_meetings: meetings }));
      expect(r.meetings.avg_feedback_per_meeting).toBe(2);
    });

    it("calculates action completion rate", () => {
      const meetings = [
        makeMeeting({ id: "hm_1", date: "2026-05-20", previous_actions_completed: 2, previous_actions_total: 3 }),
        makeMeeting({ id: "hm_2", date: "2026-05-13", previous_actions_completed: 1, previous_actions_total: 1 }),
      ];
      const r = computeHomeChildVoice(baseInput({ house_meetings: meetings }));
      // 3/4 = 75
      expect(r.meetings.action_completion_rate).toBe(75);
    });

    it("reports action completion as unmeasured when no previous actions", () => {
      const meetings = [
        makeMeeting({ id: "hm_1", date: "2026-05-20", previous_actions_completed: 0, previous_actions_total: 0 }),
        makeMeeting({ id: "hm_2", date: "2026-05-13", previous_actions_completed: 0, previous_actions_total: 0 }),
      ];
      const r = computeHomeChildVoice(baseInput({ house_meetings: meetings }));
      expect(r.meetings.action_completion_rate).toBeNull();
      expect(r.strengths.some(s => s.includes("meeting actions completed"))).toBe(false);
    });

    it("calculates average duration", () => {
      const meetings = [
        makeMeeting({ id: "hm_1", date: "2026-05-20", duration_minutes: 30 }),
        makeMeeting({ id: "hm_2", date: "2026-05-13", duration_minutes: 40 }),
      ];
      const r = computeHomeChildVoice(baseInput({ house_meetings: meetings }));
      expect(r.meetings.avg_duration_minutes).toBe(35);
    });

    it("calculates meeting frequency in weeks", () => {
      const meetings = [
        makeMeeting({ id: "hm_1", date: "2026-05-20" }),
        makeMeeting({ id: "hm_2", date: "2026-05-13" }),
        makeMeeting({ id: "hm_3", date: "2026-05-06" }),
      ];
      const r = computeHomeChildVoice(baseInput({ house_meetings: meetings }));
      expect(r.meetings.meeting_frequency_weeks).toBe(1);
    });

    it("returns null frequency for single meeting", () => {
      const r = computeHomeChildVoice(baseInput({ house_meetings: [makeMeeting({ date: "2026-05-20" })] }));
      expect(r.meetings.meeting_frequency_weeks).toBeNull();
    });
  });

  // ── Meeting Trend ────────────────────────────────────────────────────

  describe("meeting trend", () => {
    it("detects improving trend when later attendance is higher", () => {
      const meetings = [
        makeMeeting({ id: "hm_1", date: "2026-05-20", children_present: 3, children_absent: 0 }),
        makeMeeting({ id: "hm_2", date: "2026-05-13", children_present: 3, children_absent: 0 }),
        makeMeeting({ id: "hm_3", date: "2026-05-06", children_present: 1, children_absent: 2 }),
      ];
      const r = computeHomeChildVoice(baseInput({ house_meetings: meetings }));
      expect(r.meetings.trend).toBe("improving");
    });

    it("detects declining trend when later attendance is lower", () => {
      const meetings = [
        makeMeeting({ id: "hm_1", date: "2026-05-20", children_present: 1, children_absent: 2 }),
        makeMeeting({ id: "hm_2", date: "2026-05-13", children_present: 1, children_absent: 2 }),
        makeMeeting({ id: "hm_3", date: "2026-05-06", children_present: 3, children_absent: 0 }),
      ];
      const r = computeHomeChildVoice(baseInput({ house_meetings: meetings }));
      expect(r.meetings.trend).toBe("declining");
    });

    it("detects stable trend when attendance is consistent", () => {
      const meetings = [
        makeMeeting({ id: "hm_1", date: "2026-05-20", children_present: 3, children_absent: 0 }),
        makeMeeting({ id: "hm_2", date: "2026-05-13", children_present: 3, children_absent: 0 }),
        makeMeeting({ id: "hm_3", date: "2026-05-06", children_present: 3, children_absent: 0 }),
      ];
      const r = computeHomeChildVoice(baseInput({ house_meetings: meetings }));
      expect(r.meetings.trend).toBe("stable");
    });

    it("returns insufficient_data trend with fewer than 3 meetings", () => {
      const meetings = [
        makeMeeting({ id: "hm_1", date: "2026-05-20" }),
        makeMeeting({ id: "hm_2", date: "2026-05-13" }),
      ];
      const r = computeHomeChildVoice(baseInput({ house_meetings: meetings }));
      expect(r.meetings.trend).toBe("insufficient_data");
    });
  });

  // ── Visitor Profile ──────────────────────────────────────────────────

  describe("visitor profile", () => {
    it("counts visitors within 90 days", () => {
      const visitors = [
        makeVisitor({ id: "vis_1", date: "2026-05-20" }),
        makeVisitor({ id: "vis_2", date: "2026-02-01" }), // >90d
      ];
      const r = computeHomeChildVoice(baseInput({ visitors }));
      expect(r.visitors.total_90d).toBe(1);
    });

    it("categorises visitors correctly", () => {
      const visitors = [
        makeVisitor({ id: "vis_1", date: "2026-05-20", category: "professional" }),
        makeVisitor({ id: "vis_2", date: "2026-05-18", category: "family", dbs_checked: false }),
        makeVisitor({ id: "vis_3", date: "2026-05-15", category: "inspector" }),
        makeVisitor({ id: "vis_4", date: "2026-05-10", category: "tradesperson", dbs_checked: false }),
      ];
      const r = computeHomeChildVoice(baseInput({ visitors }));
      expect(r.visitors.professional_count).toBe(2); // professional + inspector
      expect(r.visitors.family_count).toBe(1);
      expect(r.visitors.inspector_count).toBe(1);
    });

    it("calculates DBS compliance for professionals and inspectors only", () => {
      const visitors = [
        makeVisitor({ id: "vis_1", date: "2026-05-20", category: "professional", dbs_checked: true }),
        makeVisitor({ id: "vis_2", date: "2026-05-18", category: "inspector", dbs_checked: false }),
        makeVisitor({ id: "vis_3", date: "2026-05-15", category: "family", dbs_checked: false }),
      ];
      const r = computeHomeChildVoice(baseInput({ visitors }));
      // 1 of 2 professionals/inspectors have DBS = 50%
      expect(r.visitors.dbs_compliance_rate).toBe(50);
    });

    it("calculates ID verification rate", () => {
      const visitors = [
        makeVisitor({ id: "vis_1", date: "2026-05-20", id_verified: true }),
        makeVisitor({ id: "vis_2", date: "2026-05-15", id_verified: false }),
      ];
      const r = computeHomeChildVoice(baseInput({ visitors }));
      expect(r.visitors.id_verification_rate).toBe(50);
    });

    it("calculates sign-out compliance rate", () => {
      const visitors = [
        makeVisitor({ id: "vis_1", date: "2026-05-20", status: "signed_out" }),
        makeVisitor({ id: "vis_2", date: "2026-05-15", status: "signed_in" }),
        makeVisitor({ id: "vis_3", date: "2026-05-10", status: "signed_out" }),
      ];
      const r = computeHomeChildVoice(baseInput({ visitors }));
      expect(r.visitors.sign_out_compliance_rate).toBe(67);
      expect(r.visitors.visitors_still_signed_in).toBe(1);
    });

    it("calculates children seen rate", () => {
      const visitors = [
        makeVisitor({ id: "vis_1", date: "2026-05-20", children_seen_count: 2 }),
        makeVisitor({ id: "vis_2", date: "2026-05-15", children_seen_count: 0 }),
      ];
      const r = computeHomeChildVoice(baseInput({ visitors }));
      expect(r.visitors.children_seen_rate).toBe(50);
    });

    it("reports DBS rate as unmeasured when no professionals visited", () => {
      const visitors = [
        makeVisitor({ id: "vis_1", date: "2026-05-20", category: "family", dbs_checked: false }),
        makeVisitor({ id: "vis_2", date: "2026-05-15", category: "tradesperson", dbs_checked: false }),
      ];
      const r = computeHomeChildVoice(baseInput({ visitors }));
      expect(r.visitors.dbs_compliance_rate).toBeNull();
      expect(r.strengths.some(s => s.includes("DBS compliance"))).toBe(false);
      expect(r.concerns.some(c => c.includes("DBS compliance"))).toBe(false);
    });
  });

  // ── Scoring ──────────────────────────────────────────────────────────

  describe("scoring", () => {
    it("starts from base 50", () => {
      // Minimal data: 2 items → not insufficient, but minimal
      const meetings = [makeMeeting({ id: "hm_1", date: "2026-05-20", children_present: 2, children_absent: 1, child_raised_topics: 1, total_agenda_items: 3, child_feedback_count: 1, previous_actions_completed: 1, previous_actions_total: 2 })];
      const visitors = [makeVisitor({ id: "vis_1", date: "2026-05-20" })];
      const r = computeHomeChildVoice(baseInput({ house_meetings: meetings, visitors }));
      // Score should be around base 50 with slight adjustments
      expect(r.child_voice_score).toBeGreaterThanOrEqual(40);
      expect(r.child_voice_score).toBeLessThanOrEqual(80);
    });

    it("rewards weekly meetings with frequency bonus", () => {
      const weekly = baseInput();
      const monthly = baseInput({
        house_meetings: [
          makeMeeting({ id: "hm_1", date: "2026-05-20" }),
          makeMeeting({ id: "hm_2", date: "2026-04-20" }),
        ],
      });
      const rw = computeHomeChildVoice(weekly);
      const rm = computeHomeChildVoice(monthly);
      expect(rw.child_voice_score).toBeGreaterThan(rm.child_voice_score);
    });

    it("rewards high attendance", () => {
      const highAtt = baseInput({
        house_meetings: [
          makeMeeting({ id: "hm_1", date: "2026-05-20", children_present: 3, children_absent: 0 }),
          makeMeeting({ id: "hm_2", date: "2026-05-13", children_present: 3, children_absent: 0 }),
          makeMeeting({ id: "hm_3", date: "2026-05-06", children_present: 3, children_absent: 0 }),
        ],
      });
      const lowAtt = baseInput({
        house_meetings: [
          makeMeeting({ id: "hm_1", date: "2026-05-20", children_present: 1, children_absent: 2 }),
          makeMeeting({ id: "hm_2", date: "2026-05-13", children_present: 1, children_absent: 2 }),
          makeMeeting({ id: "hm_3", date: "2026-05-06", children_present: 1, children_absent: 2 }),
        ],
      });
      expect(computeHomeChildVoice(highAtt).child_voice_score)
        .toBeGreaterThan(computeHomeChildVoice(lowAtt).child_voice_score);
    });

    it("rewards child-raised topics", () => {
      const childLed = baseInput({
        house_meetings: [
          makeMeeting({ id: "hm_1", date: "2026-05-20", child_raised_topics: 3, total_agenda_items: 4 }),
          makeMeeting({ id: "hm_2", date: "2026-05-13", child_raised_topics: 3, total_agenda_items: 4 }),
          makeMeeting({ id: "hm_3", date: "2026-05-06", child_raised_topics: 3, total_agenda_items: 4 }),
        ],
      });
      const staffLed = baseInput({
        house_meetings: [
          makeMeeting({ id: "hm_1", date: "2026-05-20", child_raised_topics: 0, total_agenda_items: 4 }),
          makeMeeting({ id: "hm_2", date: "2026-05-13", child_raised_topics: 0, total_agenda_items: 4 }),
          makeMeeting({ id: "hm_3", date: "2026-05-06", child_raised_topics: 0, total_agenda_items: 4 }),
        ],
      });
      expect(computeHomeChildVoice(childLed).child_voice_score)
        .toBeGreaterThan(computeHomeChildVoice(staffLed).child_voice_score);
    });

    it("penalises no meetings heavily", () => {
      const noMeetings = baseInput({
        house_meetings: [],
        visitors: [
          makeVisitor({ id: "vis_1", date: "2026-05-20" }),
          makeVisitor({ id: "vis_2", date: "2026-05-15" }),
        ],
      });
      const r = computeHomeChildVoice(noMeetings);
      expect(r.child_voice_score).toBeLessThanOrEqual(50);
    });

    it("penalises poor DBS compliance", () => {
      const good = baseInput({
        visitors: [
          makeVisitor({ id: "vis_1", date: "2026-05-20", dbs_checked: true }),
          makeVisitor({ id: "vis_2", date: "2026-05-15", dbs_checked: true }),
        ],
      });
      const poor = baseInput({
        visitors: [
          makeVisitor({ id: "vis_1", date: "2026-05-20", dbs_checked: false }),
          makeVisitor({ id: "vis_2", date: "2026-05-15", dbs_checked: false }),
        ],
      });
      expect(computeHomeChildVoice(good).child_voice_score)
        .toBeGreaterThan(computeHomeChildVoice(poor).child_voice_score);
    });

    it("rewards family contact", () => {
      const withFamily = baseInput({
        visitors: [
          makeVisitor({ id: "vis_1", date: "2026-05-20", category: "family", dbs_checked: false }),
          makeVisitor({ id: "vis_2", date: "2026-05-15" }),
        ],
      });
      const noFamily = baseInput({
        visitors: [
          makeVisitor({ id: "vis_1", date: "2026-05-20" }),
          makeVisitor({ id: "vis_2", date: "2026-05-15" }),
        ],
      });
      expect(computeHomeChildVoice(withFamily).child_voice_score)
        .toBeGreaterThan(computeHomeChildVoice(noFamily).child_voice_score);
    });

    it("rewards action follow-through", () => {
      const good = baseInput({
        house_meetings: [
          makeMeeting({ id: "hm_1", date: "2026-05-20", previous_actions_completed: 3, previous_actions_total: 3 }),
          makeMeeting({ id: "hm_2", date: "2026-05-13", previous_actions_completed: 2, previous_actions_total: 2 }),
          makeMeeting({ id: "hm_3", date: "2026-05-06", previous_actions_completed: 2, previous_actions_total: 2 }),
        ],
      });
      const poor = baseInput({
        house_meetings: [
          makeMeeting({ id: "hm_1", date: "2026-05-20", previous_actions_completed: 0, previous_actions_total: 3 }),
          makeMeeting({ id: "hm_2", date: "2026-05-13", previous_actions_completed: 0, previous_actions_total: 2 }),
          makeMeeting({ id: "hm_3", date: "2026-05-06", previous_actions_completed: 0, previous_actions_total: 2 }),
        ],
      });
      expect(computeHomeChildVoice(good).child_voice_score)
        .toBeGreaterThan(computeHomeChildVoice(poor).child_voice_score);
    });

    it("clamps score to 0-100", () => {
      // Perfect everything
      const r = computeHomeChildVoice(baseInput());
      expect(r.child_voice_score).toBeGreaterThanOrEqual(0);
      expect(r.child_voice_score).toBeLessThanOrEqual(100);
    });

    it("rewards meeting trend improving", () => {
      const improving = baseInput({
        house_meetings: [
          makeMeeting({ id: "hm_1", date: "2026-05-20", children_present: 3, children_absent: 0 }),
          makeMeeting({ id: "hm_2", date: "2026-05-13", children_present: 3, children_absent: 0 }),
          makeMeeting({ id: "hm_3", date: "2026-05-06", children_present: 1, children_absent: 2 }),
        ],
      });
      const declining = baseInput({
        house_meetings: [
          makeMeeting({ id: "hm_1", date: "2026-05-20", children_present: 1, children_absent: 2 }),
          makeMeeting({ id: "hm_2", date: "2026-05-13", children_present: 1, children_absent: 2 }),
          makeMeeting({ id: "hm_3", date: "2026-05-06", children_present: 3, children_absent: 0 }),
        ],
      });
      expect(computeHomeChildVoice(improving).child_voice_score)
        .toBeGreaterThan(computeHomeChildVoice(declining).child_voice_score);
    });
  });

  // ── Strengths ────────────────────────────────────────────────────────

  describe("strengths", () => {
    it("identifies high attendance as a strength", () => {
      const r = computeHomeChildVoice(baseInput());
      expect(r.strengths.some(s => s.includes("attendance"))).toBe(true);
    });

    it("identifies full attendance meetings as a strength", () => {
      const r = computeHomeChildVoice(baseInput());
      expect(r.strengths.some(s => s.includes("full attendance"))).toBe(true);
    });

    it("identifies child-raised topics as a strength when >= 50%", () => {
      const meetings = [
        makeMeeting({ id: "hm_1", date: "2026-05-20", child_raised_topics: 3, total_agenda_items: 4 }),
        makeMeeting({ id: "hm_2", date: "2026-05-13", child_raised_topics: 3, total_agenda_items: 4 }),
        makeMeeting({ id: "hm_3", date: "2026-05-06", child_raised_topics: 3, total_agenda_items: 4 }),
      ];
      const r = computeHomeChildVoice(baseInput({ house_meetings: meetings }));
      expect(r.strengths.some(s => s.includes("agenda items were raised by children"))).toBe(true);
    });

    it("identifies DBS compliance as a strength", () => {
      const r = computeHomeChildVoice(baseInput());
      expect(r.strengths.some(s => s.includes("DBS compliance"))).toBe(true);
    });

    it("identifies family contact as a strength", () => {
      const r = computeHomeChildVoice(baseInput());
      expect(r.strengths.some(s => s.includes("family contact"))).toBe(true);
    });

    it("identifies action follow-through as a strength", () => {
      const r = computeHomeChildVoice(baseInput());
      expect(r.strengths.some(s => s.includes("actions completed"))).toBe(true);
    });
  });

  // ── Concerns ─────────────────────────────────────────────────────────

  describe("concerns", () => {
    it("flags no meetings as a concern", () => {
      const r = computeHomeChildVoice(baseInput({
        house_meetings: [],
        visitors: [makeVisitor({ id: "vis_1" }), makeVisitor({ id: "vis_2" })],
      }));
      expect(r.concerns.some(c => c.includes("No house meetings"))).toBe(true);
    });

    it("flags low attendance as a concern", () => {
      const meetings = [
        makeMeeting({ id: "hm_1", date: "2026-05-20", children_present: 1, children_absent: 3 }),
        makeMeeting({ id: "hm_2", date: "2026-05-13", children_present: 1, children_absent: 3 }),
        makeMeeting({ id: "hm_3", date: "2026-05-06", children_present: 1, children_absent: 3 }),
      ];
      const r = computeHomeChildVoice(baseInput({ house_meetings: meetings }));
      expect(r.concerns.some(c => c.includes("attendance"))).toBe(true);
    });

    it("flags low child-raised topics as a concern", () => {
      const meetings = [
        makeMeeting({ id: "hm_1", date: "2026-05-20", child_raised_topics: 0, total_agenda_items: 5 }),
        makeMeeting({ id: "hm_2", date: "2026-05-13", child_raised_topics: 0, total_agenda_items: 4 }),
        makeMeeting({ id: "hm_3", date: "2026-05-06", child_raised_topics: 0, total_agenda_items: 3 }),
      ];
      const r = computeHomeChildVoice(baseInput({ house_meetings: meetings }));
      expect(r.concerns.some(c => c.includes("staff-driven"))).toBe(true);
    });

    it("flags poor action completion as a concern", () => {
      const meetings = [
        makeMeeting({ id: "hm_1", date: "2026-05-20", previous_actions_completed: 1, previous_actions_total: 5 }),
        makeMeeting({ id: "hm_2", date: "2026-05-13", previous_actions_completed: 0, previous_actions_total: 3 }),
        makeMeeting({ id: "hm_3", date: "2026-05-06", previous_actions_completed: 0, previous_actions_total: 2 }),
      ];
      const r = computeHomeChildVoice(baseInput({ house_meetings: meetings }));
      expect(r.concerns.some(c => c.includes("actions completed"))).toBe(true);
    });

    it("flags DBS non-compliance as a concern", () => {
      const visitors = [
        makeVisitor({ id: "vis_1", date: "2026-05-20", dbs_checked: false }),
        makeVisitor({ id: "vis_2", date: "2026-05-15", dbs_checked: false }),
      ];
      const r = computeHomeChildVoice(baseInput({ visitors }));
      expect(r.concerns.some(c => c.includes("DBS compliance"))).toBe(true);
    });

    it("flags visitors still signed in as a concern", () => {
      const visitors = [
        makeVisitor({ id: "vis_1", date: "2026-05-20", status: "signed_in" }),
        makeVisitor({ id: "vis_2", date: "2026-05-15" }),
      ];
      const r = computeHomeChildVoice(baseInput({ visitors }));
      expect(r.concerns.some(c => c.includes("still signed in"))).toBe(true);
    });

    it("flags declining trend as a concern", () => {
      const meetings = [
        makeMeeting({ id: "hm_1", date: "2026-05-20", children_present: 1, children_absent: 2 }),
        makeMeeting({ id: "hm_2", date: "2026-05-13", children_present: 1, children_absent: 2 }),
        makeMeeting({ id: "hm_3", date: "2026-05-06", children_present: 3, children_absent: 0 }),
      ];
      const r = computeHomeChildVoice(baseInput({ house_meetings: meetings }));
      expect(r.concerns.some(c => c.includes("declining"))).toBe(true);
    });
  });

  // ── Recommendations ──────────────────────────────────────────────────

  describe("recommendations", () => {
    it("recommends establishing meetings when none exist", () => {
      const r = computeHomeChildVoice(baseInput({
        house_meetings: [],
        visitors: [makeVisitor({ id: "vis_1" }), makeVisitor({ id: "vis_2" })],
      }));
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("house meetings"))).toBe(true);
    });

    it("recommends DBS check improvements when non-compliant", () => {
      const visitors = [
        makeVisitor({ id: "vis_1", date: "2026-05-20", dbs_checked: false }),
        makeVisitor({ id: "vis_2", date: "2026-05-15" }),
      ];
      const r = computeHomeChildVoice(baseInput({ visitors }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("DBS"))).toBe(true);
    });

    it("recommends reviewing sign-out procedures when visitors still signed in", () => {
      const visitors = [
        makeVisitor({ id: "vis_1", date: "2026-05-20", status: "signed_in" }),
        makeVisitor({ id: "vis_2", date: "2026-05-15" }),
      ];
      const r = computeHomeChildVoice(baseInput({ visitors }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("sign-out"))).toBe(true);
    });

    it("recommends improving action follow-through when low", () => {
      const meetings = [
        makeMeeting({ id: "hm_1", date: "2026-05-20", previous_actions_completed: 1, previous_actions_total: 5 }),
        makeMeeting({ id: "hm_2", date: "2026-05-13", previous_actions_completed: 0, previous_actions_total: 3 }),
        makeMeeting({ id: "hm_3", date: "2026-05-06", previous_actions_completed: 0, previous_actions_total: 2 }),
      ];
      const r = computeHomeChildVoice(baseInput({ house_meetings: meetings }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("follow-through"))).toBe(true);
    });

    it("recommends encouraging child agenda items when low", () => {
      const meetings = [
        makeMeeting({ id: "hm_1", date: "2026-05-20", child_raised_topics: 0, total_agenda_items: 4 }),
        makeMeeting({ id: "hm_2", date: "2026-05-13", child_raised_topics: 0, total_agenda_items: 3 }),
        makeMeeting({ id: "hm_3", date: "2026-05-06", child_raised_topics: 0, total_agenda_items: 3 }),
      ];
      const r = computeHomeChildVoice(baseInput({ house_meetings: meetings }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("suggestion boxes"))).toBe(true);
    });

    it("ranks recommendations by urgency", () => {
      const visitors = [
        makeVisitor({ id: "vis_1", date: "2026-05-20", dbs_checked: false, status: "signed_in" }),
        makeVisitor({ id: "vis_2", date: "2026-05-15", dbs_checked: false }),
      ];
      const r = computeHomeChildVoice(baseInput({
        house_meetings: [],
        visitors,
      }));
      const immediateRanks = r.recommendations.filter(rec => rec.urgency === "immediate").map(rec => rec.rank);
      const soonRanks = r.recommendations.filter(rec => rec.urgency === "soon").map(rec => rec.rank);
      if (immediateRanks.length > 0 && soonRanks.length > 0) {
        expect(Math.max(...immediateRanks)).toBeLessThan(Math.min(...soonRanks));
      }
    });

    it("includes regulatory references", () => {
      const r = computeHomeChildVoice(baseInput({
        house_meetings: [],
        visitors: [makeVisitor({ id: "vis_1" }), makeVisitor({ id: "vis_2" })],
      }));
      expect(r.recommendations.every(rec => rec.regulatory_ref.length > 0)).toBe(true);
    });
  });

  // ── Insights ─────────────────────────────────────────────────────────

  describe("insights", () => {
    it("generates critical insight when no meetings in 90d", () => {
      const r = computeHomeChildVoice(baseInput({
        house_meetings: [],
        visitors: [makeVisitor({ id: "vis_1" }), makeVisitor({ id: "vis_2" })],
      }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("No house meetings"))).toBe(true);
    });

    it("generates critical insight for DBS non-compliance", () => {
      const visitors = [
        makeVisitor({ id: "vis_1", date: "2026-05-20", dbs_checked: false }),
        makeVisitor({ id: "vis_2", date: "2026-05-15", dbs_checked: false }),
      ];
      const r = computeHomeChildVoice(baseInput({ visitors }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("DBS"))).toBe(true);
    });

    it("generates positive insight for strong child voice", () => {
      const meetings = [
        makeMeeting({ id: "hm_1", date: "2026-05-20", children_present: 3, children_absent: 0, child_raised_topics: 3, total_agenda_items: 4, previous_actions_completed: 3, previous_actions_total: 3 }),
        makeMeeting({ id: "hm_2", date: "2026-05-13", children_present: 3, children_absent: 0, child_raised_topics: 2, total_agenda_items: 3, previous_actions_completed: 2, previous_actions_total: 2 }),
        makeMeeting({ id: "hm_3", date: "2026-05-06", children_present: 3, children_absent: 0, child_raised_topics: 2, total_agenda_items: 3, previous_actions_completed: 2, previous_actions_total: 2 }),
      ];
      const r = computeHomeChildVoice(baseInput({ house_meetings: meetings }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("child-centred"))).toBe(true);
    });

    it("generates positive insight for action follow-through", () => {
      const r = computeHomeChildVoice(baseInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("action follow-through"))).toBe(true);
    });

    it("generates positive insight for improving trend", () => {
      const meetings = [
        makeMeeting({ id: "hm_1", date: "2026-05-20", children_present: 3, children_absent: 0 }),
        makeMeeting({ id: "hm_2", date: "2026-05-13", children_present: 3, children_absent: 0 }),
        makeMeeting({ id: "hm_3", date: "2026-05-06", children_present: 1, children_absent: 2 }),
      ];
      const r = computeHomeChildVoice(baseInput({ house_meetings: meetings }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("improving"))).toBe(true);
    });

    it("generates warning insight for low attendance", () => {
      const meetings = [
        makeMeeting({ id: "hm_1", date: "2026-05-20", children_present: 1, children_absent: 4 }),
        makeMeeting({ id: "hm_2", date: "2026-05-13", children_present: 1, children_absent: 4 }),
        makeMeeting({ id: "hm_3", date: "2026-05-06", children_present: 1, children_absent: 4 }),
      ];
      const r = computeHomeChildVoice(baseInput({ house_meetings: meetings }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Low meeting attendance"))).toBe(true);
    });

    it("generates positive insight for inspector visits", () => {
      const visitors = [
        makeVisitor({ id: "vis_1", date: "2026-05-20", category: "inspector", children_seen_count: 3 }),
        makeVisitor({ id: "vis_2", date: "2026-05-15" }),
      ];
      const r = computeHomeChildVoice(baseInput({ visitors }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("inspector"))).toBe(true);
    });
  });

  // ── Headlines ────────────────────────────────────────────────────────

  describe("headlines", () => {
    it("provides outstanding headline", () => {
      const r = computeHomeChildVoice(baseInput());
      expect(r.headline).toContain("outstanding");
    });

    it("provides inadequate headline", () => {
      const visitors = [
        makeVisitor({ id: "vis_1", date: "2026-05-20", dbs_checked: false, id_verified: false, status: "signed_in", children_seen_count: 0 }),
        makeVisitor({ id: "vis_2", date: "2026-05-15", dbs_checked: false, id_verified: false, status: "signed_in", children_seen_count: 0 }),
      ];
      const r = computeHomeChildVoice(baseInput({ house_meetings: [], visitors }));
      expect(r.headline).toContain("inadequate");
    });

    it("includes meeting count in good headline", () => {
      const meetings = [
        makeMeeting({ id: "hm_1", date: "2026-05-20", children_present: 2, children_absent: 1, child_raised_topics: 1, total_agenda_items: 3, child_feedback_count: 1 }),
        makeMeeting({ id: "hm_2", date: "2026-05-13", children_present: 2, children_absent: 1, child_raised_topics: 1, total_agenda_items: 3, child_feedback_count: 1 }),
        makeMeeting({ id: "hm_3", date: "2026-05-06", children_present: 2, children_absent: 1, child_raised_topics: 1, total_agenda_items: 4, child_feedback_count: 1 }),
      ];
      const r = computeHomeChildVoice(baseInput({ house_meetings: meetings }));
      if (r.child_voice_rating === "good") {
        expect(r.headline).toContain("3 meetings");
      }
    });
  });

  // ── Edge Cases ───────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("handles meetings with zero children present/absent", () => {
      const meetings = [
        makeMeeting({ id: "hm_1", date: "2026-05-20", children_present: 0, children_absent: 0 }),
        makeMeeting({ id: "hm_2", date: "2026-05-13", children_present: 0, children_absent: 0 }),
      ];
      const r = computeHomeChildVoice(baseInput({ house_meetings: meetings }));
      expect(r.meetings.avg_attendance_rate).toBeNull();
      expect(r.concerns.some(c => c.includes("average attendance"))).toBe(false);
    });

    it("handles meetings with zero agenda items", () => {
      const meetings = [
        makeMeeting({ id: "hm_1", date: "2026-05-20", child_raised_topics: 0, total_agenda_items: 0 }),
        makeMeeting({ id: "hm_2", date: "2026-05-13", child_raised_topics: 0, total_agenda_items: 0 }),
      ];
      const r = computeHomeChildVoice(baseInput({ house_meetings: meetings }));
      expect(r.meetings.child_raised_topic_rate).toBeNull();
      expect(r.concerns.some(c => c.includes("agenda items raised by children"))).toBe(false);
    });

    it("handles all visitors in the future", () => {
      const visitors = [
        makeVisitor({ id: "vis_1", date: "2026-07-01" }),
        makeVisitor({ id: "vis_2", date: "2026-08-01" }),
      ];
      const r = computeHomeChildVoice(baseInput({ visitors }));
      expect(r.visitors.total_90d).toBe(0);
    });

    it("handles meetings on the boundary of 90 days", () => {
      const meetings = [
        makeMeeting({ id: "hm_1", date: "2026-02-25" }), // exactly 90 days
      ];
      const r = computeHomeChildVoice(baseInput({ house_meetings: meetings }));
      expect(r.meetings.total_meetings_90d).toBe(1);
    });

    it("handles mixed in-range and out-of-range data", () => {
      const meetings = [
        makeMeeting({ id: "hm_1", date: "2026-05-20" }),
        makeMeeting({ id: "hm_2", date: "2025-01-01" }),
      ];
      const visitors = [
        makeVisitor({ id: "vis_1", date: "2026-05-15" }),
        makeVisitor({ id: "vis_2", date: "2025-01-01" }),
      ];
      const r = computeHomeChildVoice(baseInput({ house_meetings: meetings, visitors }));
      expect(r.meetings.total_meetings_90d).toBe(1);
      expect(r.visitors.total_90d).toBe(1);
    });
  });
});
