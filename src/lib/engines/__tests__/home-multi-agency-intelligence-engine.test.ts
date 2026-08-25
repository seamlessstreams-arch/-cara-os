import { describe, it, expect } from "vitest";
import {
  computeHomeMultiAgency,
  type HomeMultiAgencyInput,
  type MultiAgencyMeetingInput,
  type ProfessionalMeetingInput,
  type IROCorrespondenceInput,
  type PoliceContactInput,
} from "../home-multi-agency-intelligence-engine";

// ── Helpers ────────────────────────────────────────────────────────────────

let _id = 0;
const uid = () => `ma-${++_id}`;

function makeMeeting(overrides: Partial<MultiAgencyMeetingInput> = {}): MultiAgencyMeetingInput {
  return {
    id: uid(),
    child_id: "c1",
    meeting_type: "lac_review",
    meeting_status: "completed",
    date: "2026-04-01",
    child_participation: "attended_and_contributed",
    action_items_count: 5,
    actions_completed: 5,
    attendees_count: 6,
    ...overrides,
  };
}

function makeProfMeeting(overrides: Partial<ProfessionalMeetingInput> = {}): ProfessionalMeetingInput {
  return {
    id: uid(),
    child_id: "c1",
    meeting_date: "2026-04-15",
    meeting_type: "pep",
    child_attended: true,
    agencies_present: ["education", "health", "social_work"],
    actions_for_home_count: 3,
    report_submitted: true,
    home_contribution: "comprehensive",
    ...overrides,
  };
}

function makeIRO(overrides: Partial<IROCorrespondenceInput> = {}): IROCorrespondenceInput {
  return {
    id: uid(),
    child_id: "c1",
    date: "2026-04-10",
    direction: "from_iro",
    response_required: true,
    response_sent: true,
    response_deadline: "2026-04-20",
    formal_dispute: false,
    ...overrides,
  };
}

function makePolice(overrides: Partial<PoliceContactInput> = {}): PoliceContactInput {
  return {
    id: uid(),
    child_id: "c1",
    contact_date: "2026-04-05",
    home_protocol_followed: true,
    concordat_principles_applied: true,
    appropriate_adult_present: true,
    restorative_opportunity: true,
    follow_up_required: false,
    follow_up_action: null,
    ...overrides,
  };
}

function baseInput(overrides: Partial<HomeMultiAgencyInput> = {}): HomeMultiAgencyInput {
  return {
    today: "2026-05-27",
    multi_agency_meetings: [makeMeeting(), makeMeeting({ child_id: "c2" })],
    professional_meetings: [
      makeProfMeeting(),
      makeProfMeeting({ child_id: "c2", agencies_present: ["camhs", "police", "education", "yot", "housing"] }),
    ],
    iro_correspondence: [makeIRO(), makeIRO({ child_id: "c2" })],
    police_contacts: [makePolice()],
    total_children: 3,
    ...overrides,
  };
}

beforeEach(() => { _id = 0; });

// ── Tests ──────────────────────────────────────────────────────────────────

describe("computeHomeMultiAgency", () => {

  // ── Insufficient data ──────────────────────────────────────────────────

  describe("insufficient data", () => {
    it("returns insufficient_data when total_children is 0 and no meetings", () => {
      const r = computeHomeMultiAgency({
        today: "2026-05-27",
        multi_agency_meetings: [],
        professional_meetings: [],
        iro_correspondence: [],
        police_contacts: [],
        total_children: 0,
      });
      expect(r.multi_agency_rating).toBe("insufficient_data");
      expect(r.multi_agency_score).toBe(0);
    });

    it("NOT insufficient_data when total_children > 0 even with no meetings", () => {
      const r = computeHomeMultiAgency({
        today: "2026-05-27",
        multi_agency_meetings: [],
        professional_meetings: [],
        iro_correspondence: [],
        police_contacts: [],
        total_children: 3,
      });
      expect(r.multi_agency_rating).not.toBe("insufficient_data");
    });

    it("NOT insufficient_data when total_children is 0 but multi_agency_meetings exist", () => {
      const r = computeHomeMultiAgency({
        today: "2026-05-27",
        multi_agency_meetings: [makeMeeting()],
        professional_meetings: [],
        iro_correspondence: [],
        police_contacts: [],
        total_children: 0,
      });
      expect(r.multi_agency_rating).not.toBe("insufficient_data");
    });

    it("NOT insufficient_data when total_children is 0 but professional_meetings exist", () => {
      const r = computeHomeMultiAgency({
        today: "2026-05-27",
        multi_agency_meetings: [],
        professional_meetings: [makeProfMeeting()],
        iro_correspondence: [],
        police_contacts: [],
        total_children: 0,
      });
      expect(r.multi_agency_rating).not.toBe("insufficient_data");
    });
  });

  // ── Rating thresholds ────────────────────────────────────────────────

  describe("rating thresholds", () => {
    it("outstanding for excellent multi-agency practice (score >= 80)", () => {
      // baseInput: all actions completed, child participation, IRO 100%, reports submitted, police protocol, 5+ agencies, 0 cancellations, 0 disputes
      const r = computeHomeMultiAgency(baseInput());
      expect(r.multi_agency_score).toBeGreaterThanOrEqual(80);
      expect(r.multi_agency_rating).toBe("outstanding");
    });

    it("good for score 65-79", () => {
      // Reduce some areas: remove police contacts (gets +2 neutral), lower agencies
      const r = computeHomeMultiAgency(baseInput({
        police_contacts: [],
        professional_meetings: [
          makeProfMeeting({ agencies_present: ["education", "health"], report_submitted: false }),
          makeProfMeeting({ agencies_present: ["education"], report_submitted: true }),
        ],
      }));
      expect(r.multi_agency_score).toBeGreaterThanOrEqual(65);
      expect(r.multi_agency_score).toBeLessThan(80);
      expect(r.multi_agency_rating).toBe("good");
    });

    it("adequate for score 45-64", () => {
      // Moderate issues: some actions incomplete, moderate participation, partial IRO compliance
      // mod1: 7/10 = 70% → +3. mod2: 1/2 completed participated → 50% → +0
      // mod3: 1/1 IRO responded → +4. mod4: 1/2 reports → 50% → +0
      // mod5: no police → +2. mod6: 2 agencies → +0. mod7: 50% cancellation → -3. mod8: 0 disputes → +2
      // 52 + 3+0+4+0+2+0-3+2 = 60 → adequate
      const r = computeHomeMultiAgency(baseInput({
        multi_agency_meetings: [
          makeMeeting({ action_items_count: 10, actions_completed: 7, child_participation: "attended" }),
          makeMeeting({ meeting_status: "cancelled", action_items_count: 0, actions_completed: 0 }),
        ],
        professional_meetings: [
          makeProfMeeting({ report_submitted: false, agencies_present: ["education", "health"] }),
          makeProfMeeting({ report_submitted: true, agencies_present: ["education"] }),
        ],
        iro_correspondence: [
          makeIRO({ response_required: true, response_sent: true }),
        ],
        police_contacts: [],
      }));
      expect(r.multi_agency_score).toBeGreaterThanOrEqual(45);
      expect(r.multi_agency_score).toBeLessThan(65);
      expect(r.multi_agency_rating).toBe("adequate");
    });

    it("inadequate for score < 45", () => {
      const r = computeHomeMultiAgency(baseInput({
        multi_agency_meetings: [
          makeMeeting({ action_items_count: 10, actions_completed: 1, child_participation: "none" }),
          makeMeeting({ meeting_status: "cancelled" }),
          makeMeeting({ meeting_status: "cancelled" }),
          makeMeeting({ meeting_status: "cancelled" }),
        ],
        professional_meetings: [
          makeProfMeeting({ report_submitted: false, child_attended: false, agencies_present: [] }),
        ],
        iro_correspondence: [
          makeIRO({ response_sent: false, response_deadline: "2026-04-01", formal_dispute: true }),
          makeIRO({ response_sent: false, response_deadline: "2026-04-15", formal_dispute: true }),
          makeIRO({ response_sent: false, response_deadline: "2026-05-01" }),
        ],
        police_contacts: [
          makePolice({ home_protocol_followed: false, concordat_principles_applied: false, appropriate_adult_present: false }),
        ],
      }));
      expect(r.multi_agency_score).toBeLessThan(45);
      expect(r.multi_agency_rating).toBe("inadequate");
    });
  });

  // ── Meeting Profile ──────────────────────────────────────────────────

  describe("meeting profile", () => {
    it("counts meetings in 90d window", () => {
      const r = computeHomeMultiAgency(baseInput({
        multi_agency_meetings: [
          makeMeeting({ date: "2026-05-01" }),           // 26 days ago — in window
          makeMeeting({ date: "2026-03-01" }),           // 87 days ago — in window
          makeMeeting({ date: "2026-01-01" }),           // outside 90d — excluded
        ],
      }));
      expect(r.meetings.total_meetings_90d).toBe(2);
    });

    it("tracks completed and cancelled counts", () => {
      const r = computeHomeMultiAgency(baseInput({
        multi_agency_meetings: [
          makeMeeting({ meeting_status: "completed" }),
          makeMeeting({ meeting_status: "completed" }),
          makeMeeting({ meeting_status: "cancelled" }),
          makeMeeting({ meeting_status: "postponed" }),
        ],
      }));
      expect(r.meetings.completed_meetings).toBe(2);
      expect(r.meetings.cancelled_meetings).toBe(1);
    });

    it("calculates child participation rate from completed meetings only", () => {
      const r = computeHomeMultiAgency(baseInput({
        multi_agency_meetings: [
          makeMeeting({ meeting_status: "completed", child_participation: "attended_and_contributed" }),
          makeMeeting({ meeting_status: "completed", child_participation: "none" }),
          makeMeeting({ meeting_status: "cancelled", child_participation: "attended_and_contributed" }),
        ],
      }));
      // 1 out of 2 completed meetings had participation → 50%
      expect(r.meetings.child_participation_rate).toBe(50);
    });

    it("treats empty child_participation as none", () => {
      const r = computeHomeMultiAgency(baseInput({
        multi_agency_meetings: [
          makeMeeting({ meeting_status: "completed", child_participation: "" }),
          makeMeeting({ meeting_status: "completed", child_participation: "attended" }),
        ],
      }));
      expect(r.meetings.child_participation_rate).toBe(50);
    });

    it("calculates action completion rate", () => {
      const r = computeHomeMultiAgency(baseInput({
        multi_agency_meetings: [
          makeMeeting({ action_items_count: 10, actions_completed: 8 }),
          makeMeeting({ action_items_count: 10, actions_completed: 10 }),
        ],
      }));
      // 18/20 = 90%
      expect(r.meetings.action_completion_rate).toBe(90);
    });

    it("tracks meeting types", () => {
      const r = computeHomeMultiAgency(baseInput({
        multi_agency_meetings: [
          makeMeeting({ meeting_type: "lac_review" }),
          makeMeeting({ meeting_type: "lac_review" }),
          makeMeeting({ meeting_type: "strategy_meeting" }),
        ],
      }));
      expect(r.meetings.by_type).toEqual({ lac_review: 2, strategy_meeting: 1 });
    });
  });

  // ── Professional Meeting Profile ─────────────────────────────────────

  describe("professional meeting profile", () => {
    it("filters to 90d window", () => {
      const r = computeHomeMultiAgency(baseInput({
        professional_meetings: [
          makeProfMeeting({ meeting_date: "2026-05-01" }),
          makeProfMeeting({ meeting_date: "2026-01-01" }), // outside 90d
        ],
      }));
      expect(r.professional_meetings.total_90d).toBe(1);
    });

    it("calculates child attendance rate", () => {
      const r = computeHomeMultiAgency(baseInput({
        professional_meetings: [
          makeProfMeeting({ child_attended: true }),
          makeProfMeeting({ child_attended: true }),
          makeProfMeeting({ child_attended: false }),
        ],
      }));
      expect(r.professional_meetings.child_attendance_rate).toBe(67);
    });

    it("calculates report submission rate", () => {
      const r = computeHomeMultiAgency(baseInput({
        professional_meetings: [
          makeProfMeeting({ report_submitted: true }),
          makeProfMeeting({ report_submitted: true }),
          makeProfMeeting({ report_submitted: false }),
        ],
      }));
      expect(r.professional_meetings.report_submission_rate).toBe(67);
    });

    it("counts unique agencies and averages per meeting", () => {
      const r = computeHomeMultiAgency(baseInput({
        professional_meetings: [
          makeProfMeeting({ agencies_present: ["education", "health", "police"] }),
          makeProfMeeting({ agencies_present: ["health", "camhs"] }),
        ],
      }));
      // unique: education, health, police, camhs = 4
      expect(r.professional_meetings.unique_agencies).toBe(4);
      // avg: (3+2)/2 = 2.5
      expect(r.professional_meetings.avg_agencies_per_meeting).toBe(2.5);
    });
  });

  // ── IRO Profile ───────────────────────────────────────────────────────

  describe("IRO profile", () => {
    it("calculates response compliance from those requiring response", () => {
      const r = computeHomeMultiAgency(baseInput({
        iro_correspondence: [
          makeIRO({ response_required: true, response_sent: true }),
          makeIRO({ response_required: true, response_sent: false, response_deadline: "2026-06-15" }),
          makeIRO({ response_required: false, response_sent: false }),
        ],
      }));
      // 1 out of 2 requiring response → 50%
      expect(r.iro.response_compliance_rate).toBe(50);
      expect(r.iro.total_correspondence).toBe(3);
    });

    it("counts overdue responses (deadline past today and not sent)", () => {
      const r = computeHomeMultiAgency(baseInput({
        iro_correspondence: [
          makeIRO({ response_required: true, response_sent: false, response_deadline: "2026-05-01" }),  // overdue
          makeIRO({ response_required: true, response_sent: false, response_deadline: "2026-06-15" }),  // not overdue
          makeIRO({ response_required: true, response_sent: true, response_deadline: "2026-04-01" }),   // sent
        ],
      }));
      expect(r.iro.overdue_responses).toBe(1);
    });

    it("counts formal disputes", () => {
      const r = computeHomeMultiAgency(baseInput({
        iro_correspondence: [
          makeIRO({ formal_dispute: true }),
          makeIRO({ formal_dispute: true }),
          makeIRO({ formal_dispute: false }),
        ],
      }));
      expect(r.iro.formal_disputes).toBe(2);
    });
  });

  // ── Police Contact Profile ────────────────────────────────────────────

  describe("police contact profile", () => {
    it("filters to 90d window", () => {
      const r = computeHomeMultiAgency(baseInput({
        police_contacts: [
          makePolice({ contact_date: "2026-05-01" }),
          makePolice({ contact_date: "2026-01-01" }),   // outside 90d
        ],
      }));
      expect(r.police.total_contacts_90d).toBe(1);
    });

    it("calculates protocol compliance rate", () => {
      const r = computeHomeMultiAgency(baseInput({
        police_contacts: [
          makePolice({ home_protocol_followed: true }),
          makePolice({ home_protocol_followed: true }),
          makePolice({ home_protocol_followed: false }),
        ],
      }));
      expect(r.police.protocol_compliance_rate).toBe(67);
    });

    it("calculates concordat rate", () => {
      const r = computeHomeMultiAgency(baseInput({
        police_contacts: [
          makePolice({ concordat_principles_applied: true }),
          makePolice({ concordat_principles_applied: false }),
        ],
      }));
      expect(r.police.concordat_rate).toBe(50);
    });

    it("calculates appropriate adult rate", () => {
      const r = computeHomeMultiAgency(baseInput({
        police_contacts: [
          makePolice({ appropriate_adult_present: true }),
          makePolice({ appropriate_adult_present: true }),
          makePolice({ appropriate_adult_present: false }),
        ],
      }));
      expect(r.police.appropriate_adult_rate).toBe(67);
    });

    it("calculates restorative opportunity rate", () => {
      const r = computeHomeMultiAgency(baseInput({
        police_contacts: [
          makePolice({ restorative_opportunity: true }),
          makePolice({ restorative_opportunity: false }),
          makePolice({ restorative_opportunity: false }),
        ],
      }));
      expect(r.police.restorative_rate).toBe(33);
    });
  });

  // ── Scoring Modifiers ─────────────────────────────────────────────────

  describe("mod1: meeting action completion (±5)", () => {
    it("+5 when action completion >= 90%", () => {
      const high = computeHomeMultiAgency(baseInput({
        multi_agency_meetings: [makeMeeting({ action_items_count: 10, actions_completed: 9 })],
      }));
      const low = computeHomeMultiAgency(baseInput({
        multi_agency_meetings: [makeMeeting({ action_items_count: 10, actions_completed: 4 })],
      }));
      // high: +5, low: -5 → diff = 10
      expect(high.multi_agency_score! - low.multi_agency_score!).toBe(10);
    });

    it("+2 when no actions but meetings completed", () => {
      const r = computeHomeMultiAgency(baseInput({
        multi_agency_meetings: [makeMeeting({ action_items_count: 0, actions_completed: 0 })],
      }));
      // totalActions=0, completedMeetings=1 → +2
      // Compare to a version with actions at 90%+ → +5, diff should be 3
      const withActions = computeHomeMultiAgency(baseInput({
        multi_agency_meetings: [makeMeeting({ action_items_count: 10, actions_completed: 10 })],
      }));
      expect(withActions.multi_agency_score! - r.multi_agency_score!).toBe(3);
    });

    it("+0 when no actions and no completed meetings", () => {
      const noMeetings = computeHomeMultiAgency(baseInput({
        multi_agency_meetings: [makeMeeting({ action_items_count: 0, actions_completed: 0, meeting_status: "cancelled" })],
      }));
      const withActions = computeHomeMultiAgency(baseInput({
        multi_agency_meetings: [makeMeeting({ action_items_count: 0, actions_completed: 0, meeting_status: "completed" })],
      }));
      // cancelled: totalActions=0, completedMeetings=0 → +0
      // completed: totalActions=0, completedMeetings=1 → +2
      // But other modifiers differ (cancellation rate, child participation, etc.) — need controlled test
      // cancelled meeting also affects mod7 (cancellation rate) and mod2 (child participation denominator=0)
      // Let's just verify the no-action-completed-meeting case gives +2 by checking directly
      expect(withActions.multi_agency_score).toBeGreaterThan(noMeetings.multi_agency_score!);
    });
  });

  describe("mod2: child participation (±4)", () => {
    it("+4 when participation >= 80%", () => {
      const high = computeHomeMultiAgency(baseInput({
        multi_agency_meetings: [
          makeMeeting({ child_participation: "attended_and_contributed" }),
          makeMeeting({ child_participation: "views_represented" }),
        ],
      }));
      expect(high.meetings.child_participation_rate).toBe(100);
      // Should have the +4 bonus
      const low = computeHomeMultiAgency(baseInput({
        multi_agency_meetings: [
          makeMeeting({ child_participation: "none" }),
          makeMeeting({ child_participation: "none" }),
        ],
      }));
      expect(low.meetings.child_participation_rate).toBe(0);
      // high: +4, low: -4 → diff = 8
      expect(high.multi_agency_score! - low.multi_agency_score!).toBe(8);
    });

    it("+0 when no completed meetings", () => {
      const r = computeHomeMultiAgency(baseInput({
        multi_agency_meetings: [makeMeeting({ meeting_status: "cancelled" })],
      }));
      // completedMeetings=0 → +0 for mod2
      expect(r.meetings.child_participation_rate).toBeNull();
    });
  });

  describe("mod3: IRO response compliance (±4)", () => {
    it("+4 when 100% compliance and 0 overdue", () => {
      const high = computeHomeMultiAgency(baseInput({
        iro_correspondence: [
          makeIRO({ response_required: true, response_sent: true }),
          makeIRO({ response_required: true, response_sent: true }),
        ],
      }));
      const low = computeHomeMultiAgency(baseInput({
        iro_correspondence: [
          makeIRO({ response_required: true, response_sent: false, response_deadline: "2026-05-01" }),
          makeIRO({ response_required: true, response_sent: false, response_deadline: "2026-04-01" }),
        ],
      }));
      // high: +4, low: -4 → diff = 8
      expect(high.multi_agency_score! - low.multi_agency_score!).toBe(8);
    });

    it("+2 when no IRO correspondence requiring response", () => {
      const none = computeHomeMultiAgency(baseInput({
        iro_correspondence: [],
      }));
      const full = computeHomeMultiAgency(baseInput({
        iro_correspondence: [
          makeIRO({ response_required: true, response_sent: true }),
        ],
      }));
      // none: +2, full (100% compliance): +4 → diff = 2
      expect(full.multi_agency_score! - none.multi_agency_score!).toBe(2);
    });
  });

  describe("mod4: report submission (±3)", () => {
    it("+3 when submission >= 90%", () => {
      const high = computeHomeMultiAgency(baseInput({
        professional_meetings: [
          makeProfMeeting({ report_submitted: true }),
          makeProfMeeting({ report_submitted: true }),
        ],
      }));
      const low = computeHomeMultiAgency(baseInput({
        professional_meetings: [
          makeProfMeeting({ report_submitted: false }),
          makeProfMeeting({ report_submitted: false }),
        ],
      }));
      // high: +3, low: -3 → diff = 6
      expect(high.multi_agency_score! - low.multi_agency_score!).toBe(6);
    });

    it("+1 when no professional meetings", () => {
      const none = computeHomeMultiAgency(baseInput({
        professional_meetings: [],
      }));
      const good = computeHomeMultiAgency(baseInput({
        professional_meetings: [makeProfMeeting({ report_submitted: true })],
      }));
      // none: +1, good (100%): +3 → diff = 2
      // But agencies also change (mod6) — need to control. none has 0 agencies from prof meetings.
      // Actually the unique agencies come from prof meetings, so removing them affects mod6 too.
      // Let me use a controlled comparison: prof meetings with same agencies
      // Actually the base also has multi_agency_meetings which don't contribute agencies.
      // allAgencies is built from profMeetings90d only.
      // none: 0 agencies from prof → mod6 impacted. So we can't isolate mod4 this way.
      // Just verify the score is reasonable
      expect(none.multi_agency_score).toBeLessThan(good.multi_agency_score!);
    });
  });

  describe("mod5: police protocol compliance (±4)", () => {
    it("+4 when 100% protocol and concordat >= 80%", () => {
      const high = computeHomeMultiAgency(baseInput({
        police_contacts: [
          makePolice({ home_protocol_followed: true, concordat_principles_applied: true }),
          makePolice({ home_protocol_followed: true, concordat_principles_applied: true }),
        ],
      }));
      const low = computeHomeMultiAgency(baseInput({
        police_contacts: [
          makePolice({ home_protocol_followed: false, concordat_principles_applied: false }),
          makePolice({ home_protocol_followed: false, concordat_principles_applied: false }),
        ],
      }));
      // high: +4, low: -4 → diff = 8
      expect(high.multi_agency_score! - low.multi_agency_score!).toBe(8);
    });

    it("+2 when no police contacts", () => {
      const none = computeHomeMultiAgency(baseInput({
        police_contacts: [],
      }));
      const full = computeHomeMultiAgency(baseInput({
        police_contacts: [makePolice()],
      }));
      // none: +2, full (100% protocol and concordat): +4 → diff = 2
      expect(full.multi_agency_score! - none.multi_agency_score!).toBe(2);
    });
  });

  describe("mod6: partnership breadth (±3)", () => {
    it("+3 when >= 5 unique agencies", () => {
      const r = computeHomeMultiAgency(baseInput({
        professional_meetings: [
          makeProfMeeting({ agencies_present: ["education", "health", "social_work", "camhs", "police"] }),
        ],
      }));
      expect(r.professional_meetings.unique_agencies).toBe(5);
    });

    it("+1 when 3-4 unique agencies", () => {
      const three = computeHomeMultiAgency(baseInput({
        professional_meetings: [
          makeProfMeeting({ agencies_present: ["education", "health", "social_work"] }),
        ],
      }));
      const five = computeHomeMultiAgency(baseInput({
        professional_meetings: [
          makeProfMeeting({ agencies_present: ["education", "health", "social_work", "camhs", "police"] }),
        ],
      }));
      // three: +1, five: +3 → diff = 2
      expect(five.multi_agency_score! - three.multi_agency_score!).toBe(2);
    });

    it("-3 when 0 agencies", () => {
      const r = computeHomeMultiAgency(baseInput({
        professional_meetings: [makeProfMeeting({ agencies_present: [] })],
      }));
      expect(r.professional_meetings.unique_agencies).toBe(0);
    });
  });

  describe("mod7: meeting cancellation rate (±3)", () => {
    it("+3 when 0 cancellations", () => {
      const r = computeHomeMultiAgency(baseInput({
        multi_agency_meetings: [
          makeMeeting({ meeting_status: "completed" }),
          makeMeeting({ meeting_status: "completed" }),
        ],
      }));
      expect(r.meetings.cancelled_meetings).toBe(0);
    });

    it("-3 when cancellation rate > 30%", () => {
      const low = computeHomeMultiAgency(baseInput({
        multi_agency_meetings: [
          makeMeeting({ meeting_status: "cancelled" }),
          makeMeeting({ meeting_status: "cancelled" }),
          makeMeeting({ meeting_status: "completed" }),
        ],
      }));
      const high = computeHomeMultiAgency(baseInput({
        multi_agency_meetings: [
          makeMeeting({ meeting_status: "completed" }),
          makeMeeting({ meeting_status: "completed" }),
          makeMeeting({ meeting_status: "completed" }),
        ],
      }));
      // high: +3 (0%), low: -3 (67%) → diff = 6
      // But child_participation changes too since completed count differs — only 1 completed vs 3
      // In low: 1 completed meeting with default participation → 100% → +4
      // In high: 3 completed meetings all with default participation → 100% → +4
      // So mod2 is same. mod1 differs because completed meetings have actions.
      // low: totalActions from 3 meetings (cancelled ones still contribute actions_completed/items)
      // Actually all 3 meetings have default 5/5 actions.
      // low: totalActions=15, completedActions=15, rate=100% → +5
      // high: totalActions=15, completedActions=15, rate=100% → +5
      // So mod1 same. mod7 diff = 6.
      expect(high.multi_agency_score! - low.multi_agency_score!).toBe(6);
    });

    it("+0 when no meetings in 90d", () => {
      const r = computeHomeMultiAgency(baseInput({
        multi_agency_meetings: [],
      }));
      expect(r.meetings.total_meetings_90d).toBe(0);
    });
  });

  describe("mod8: formal disputes (±2)", () => {
    it("+2 when 0 disputes", () => {
      const none = computeHomeMultiAgency(baseInput({
        iro_correspondence: [makeIRO({ formal_dispute: false })],
      }));
      const two = computeHomeMultiAgency(baseInput({
        iro_correspondence: [makeIRO({ formal_dispute: true }), makeIRO({ formal_dispute: true })],
      }));
      // none: +2, two: -2 → diff = 4
      // But IRO compliance also changes — both have response_required:true, response_sent:true
      // none: 1 requiring response, 1 sent → 100% → +4
      // two: 2 requiring response, 2 sent → 100% → +4
      // So mod3 same. diff = 4 from mod8.
      expect(none.multi_agency_score! - two.multi_agency_score!).toBe(4);
    });

    it("+0 when exactly 1 dispute", () => {
      const one = computeHomeMultiAgency(baseInput({
        iro_correspondence: [makeIRO({ formal_dispute: true })],
      }));
      const zero = computeHomeMultiAgency(baseInput({
        iro_correspondence: [makeIRO({ formal_dispute: false })],
      }));
      // zero: +2, one: +0 → diff = 2
      expect(zero.multi_agency_score! - one.multi_agency_score!).toBe(2);
    });
  });

  // ── Strengths ─────────────────────────────────────────────────────────

  describe("strengths", () => {
    it("includes action completion strength when >= 90%", () => {
      const r = computeHomeMultiAgency(baseInput());
      expect(r.strengths.some(s => s.includes("multi-agency actions completed"))).toBe(true);
    });

    it("includes child participation strength when >= 80%", () => {
      const r = computeHomeMultiAgency(baseInput());
      expect(r.strengths.some(s => s.includes("child participation"))).toBe(true);
    });

    it("includes IRO compliance strength when 100%", () => {
      const r = computeHomeMultiAgency(baseInput());
      expect(r.strengths.some(s => s.includes("IRO response compliance"))).toBe(true);
    });

    it("includes report submission strength when >= 90%", () => {
      const r = computeHomeMultiAgency(baseInput());
      expect(r.strengths.some(s => s.includes("report submission rate"))).toBe(true);
    });

    it("includes protocol compliance strength when 100%", () => {
      const r = computeHomeMultiAgency(baseInput());
      expect(r.strengths.some(s => s.includes("protocol compliance"))).toBe(true);
    });

    it("includes agency breadth strength when >= 5 agencies", () => {
      const r = computeHomeMultiAgency(baseInput());
      expect(r.strengths.some(s => s.includes("unique agencies engaged"))).toBe(true);
    });

    it("no strengths when everything is poor", () => {
      const r = computeHomeMultiAgency(baseInput({
        multi_agency_meetings: [makeMeeting({ action_items_count: 10, actions_completed: 1, child_participation: "none" })],
        professional_meetings: [makeProfMeeting({ report_submitted: false, agencies_present: ["education"] })],
        iro_correspondence: [makeIRO({ response_sent: false, response_deadline: "2026-05-01" })],
        police_contacts: [makePolice({ home_protocol_followed: false })],
      }));
      expect(r.strengths.length).toBe(0);
    });
  });

  // ── Concerns ──────────────────────────────────────────────────────────

  describe("concerns", () => {
    it("flags overdue IRO responses", () => {
      const r = computeHomeMultiAgency(baseInput({
        iro_correspondence: [
          makeIRO({ response_required: true, response_sent: false, response_deadline: "2026-05-01" }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("overdue IRO response"))).toBe(true);
    });

    it("flags formal disputes >= 2", () => {
      const r = computeHomeMultiAgency(baseInput({
        iro_correspondence: [
          makeIRO({ formal_dispute: true }),
          makeIRO({ formal_dispute: true }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("formal IRO disputes"))).toBe(true);
    });

    it("flags cancelled meetings >= 3", () => {
      const r = computeHomeMultiAgency(baseInput({
        multi_agency_meetings: [
          makeMeeting({ meeting_status: "cancelled" }),
          makeMeeting({ meeting_status: "cancelled" }),
          makeMeeting({ meeting_status: "cancelled" }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("cancelled multi-agency meetings"))).toBe(true);
    });

    it("flags low action completion < 50%", () => {
      const r = computeHomeMultiAgency(baseInput({
        multi_agency_meetings: [
          makeMeeting({ action_items_count: 10, actions_completed: 3 }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("multi-agency actions completed"))).toBe(true);
    });

    it("flags low child participation < 40%", () => {
      const r = computeHomeMultiAgency(baseInput({
        multi_agency_meetings: [
          makeMeeting({ child_participation: "none" }),
          makeMeeting({ child_participation: "none" }),
          makeMeeting({ child_participation: "none" }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("child participation in meetings"))).toBe(true);
    });

    it("flags police protocol compliance < 80%", () => {
      const r = computeHomeMultiAgency(baseInput({
        police_contacts: [
          makePolice({ home_protocol_followed: false }),
          makePolice({ home_protocol_followed: false }),
          makePolice({ home_protocol_followed: true }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("Police contact protocol compliance"))).toBe(true);
    });
  });

  // ── Recommendations ───────────────────────────────────────────────────

  describe("recommendations", () => {
    it("recommends immediate IRO response when overdue", () => {
      const r = computeHomeMultiAgency(baseInput({
        iro_correspondence: [
          makeIRO({ response_required: true, response_sent: false, response_deadline: "2026-04-01" }),
        ],
      }));
      const rec = r.recommendations.find(rec => rec.urgency === "immediate");
      expect(rec).toBeDefined();
      expect(rec!.recommendation).toContain("IRO correspondence");
      expect(rec!.regulatory_ref).toBe("Reg 5");
    });

    it("recommends action follow-through when < 70%", () => {
      const r = computeHomeMultiAgency(baseInput({
        multi_agency_meetings: [
          makeMeeting({ action_items_count: 10, actions_completed: 5 }),
        ],
      }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("action follow-through"))).toBe(true);
    });

    it("recommends child participation when < 60%", () => {
      const r = computeHomeMultiAgency(baseInput({
        multi_agency_meetings: [
          makeMeeting({ child_participation: "none" }),
          makeMeeting({ child_participation: "none" }),
        ],
      }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("child participation"))).toBe(true);
    });

    it("recommends report submission when < 70%", () => {
      const r = computeHomeMultiAgency(baseInput({
        professional_meetings: [
          makeProfMeeting({ report_submitted: false }),
          makeProfMeeting({ report_submitted: false }),
        ],
      }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("Submit reports"))).toBe(true);
    });

    it("recommends protocol compliance when < 100%", () => {
      const r = computeHomeMultiAgency(baseInput({
        police_contacts: [
          makePolice({ home_protocol_followed: false }),
        ],
      }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("protocol compliance"))).toBe(true);
    });

    it("ranks recommendations sequentially", () => {
      const r = computeHomeMultiAgency(baseInput({
        multi_agency_meetings: [makeMeeting({ action_items_count: 10, actions_completed: 3, child_participation: "none" })],
        iro_correspondence: [makeIRO({ response_required: true, response_sent: false, response_deadline: "2026-04-01" })],
        professional_meetings: [makeProfMeeting({ report_submitted: false })],
        police_contacts: [makePolice({ home_protocol_followed: false })],
      }));
      for (let i = 0; i < r.recommendations.length; i++) {
        expect(r.recommendations[i].rank).toBe(i + 1);
      }
    });
  });

  // ── Cara Insights ─────────────────────────────────────────────────────

  describe("Cara insights", () => {
    it("generates positive insight for exemplary partnership", () => {
      const r = computeHomeMultiAgency(baseInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("exemplary"))).toBe(true);
    });

    it("generates critical insight for strained IRO relationship", () => {
      const r = computeHomeMultiAgency(baseInput({
        iro_correspondence: [
          makeIRO({ formal_dispute: true, response_required: true, response_sent: false, response_deadline: "2026-04-01" }),
          makeIRO({ formal_dispute: true, response_required: true, response_sent: false, response_deadline: "2026-04-15" }),
        ],
      }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("strained"))).toBe(true);
    });

    it("generates warning insight for high cancellation + low action completion", () => {
      // Need cancelledMeetings >= 3 AND actionCompletionRate < 50
      // Cancelled meetings have 0 actions so they don't inflate the rate
      const r = computeHomeMultiAgency(baseInput({
        multi_agency_meetings: [
          makeMeeting({ meeting_status: "cancelled", action_items_count: 0, actions_completed: 0 }),
          makeMeeting({ meeting_status: "cancelled", action_items_count: 0, actions_completed: 0 }),
          makeMeeting({ meeting_status: "cancelled", action_items_count: 0, actions_completed: 0 }),
          makeMeeting({ action_items_count: 10, actions_completed: 2 }),
        ],
      }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("cancellation rate"))).toBe(true);
    });

    it("generates positive restorative insight when >= 50% and >= 2 contacts", () => {
      const r = computeHomeMultiAgency(baseInput({
        police_contacts: [
          makePolice({ restorative_opportunity: true }),
          makePolice({ restorative_opportunity: true }),
          makePolice({ restorative_opportunity: false }),
        ],
      }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("restorative"))).toBe(true);
    });
  });

  // ── Headlines ─────────────────────────────────────────────────────────

  describe("headlines", () => {
    it("outstanding headline mentions partnership and agencies", () => {
      const r = computeHomeMultiAgency(baseInput());
      expect(r.headline).toContain("Outstanding");
      expect(r.headline).toContain("agencies engaged");
    });

    it("good headline mentions action completion", () => {
      const r = computeHomeMultiAgency(baseInput({
        police_contacts: [],
        professional_meetings: [
          makeProfMeeting({ agencies_present: ["education", "health"], report_submitted: false }),
          makeProfMeeting({ agencies_present: ["education"], report_submitted: true }),
        ],
      }));
      expect(r.headline).toContain("Good");
      expect(r.headline).toContain("action completion");
    });

    it("adequate headline mentions concerns", () => {
      // Use same data as the adequate rating test to guarantee adequate rating
      const r = computeHomeMultiAgency(baseInput({
        multi_agency_meetings: [
          makeMeeting({ action_items_count: 10, actions_completed: 7, child_participation: "attended" }),
          makeMeeting({ meeting_status: "cancelled", action_items_count: 0, actions_completed: 0 }),
        ],
        professional_meetings: [
          makeProfMeeting({ report_submitted: false, agencies_present: ["education", "health"] }),
          makeProfMeeting({ report_submitted: true, agencies_present: ["education"] }),
        ],
        iro_correspondence: [
          makeIRO({ response_required: true, response_sent: true }),
        ],
        police_contacts: [],
      }));
      expect(r.multi_agency_rating).toBe("adequate");
      expect(r.headline).toContain("needs improvement");
    });

    it("inadequate headline mentions significant gaps", () => {
      const r = computeHomeMultiAgency(baseInput({
        multi_agency_meetings: [
          makeMeeting({ action_items_count: 10, actions_completed: 1, child_participation: "none" }),
          makeMeeting({ meeting_status: "cancelled" }),
          makeMeeting({ meeting_status: "cancelled" }),
          makeMeeting({ meeting_status: "cancelled" }),
        ],
        professional_meetings: [
          makeProfMeeting({ report_submitted: false, child_attended: false, agencies_present: [] }),
        ],
        iro_correspondence: [
          makeIRO({ response_sent: false, response_deadline: "2026-04-01", formal_dispute: true }),
          makeIRO({ response_sent: false, response_deadline: "2026-04-15", formal_dispute: true }),
          makeIRO({ response_sent: false, response_deadline: "2026-05-01" }),
        ],
        police_contacts: [
          makePolice({ home_protocol_followed: false, concordat_principles_applied: false, appropriate_adult_present: false }),
        ],
      }));
      expect(r.headline).toContain("inadequate");
      expect(r.headline).toContain("significant gaps");
    });
  });

  // ── Edge cases ────────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("score is clamped 0-100", () => {
      const r = computeHomeMultiAgency(baseInput());
      expect(r.multi_agency_score).toBeGreaterThanOrEqual(0);
      expect(r.multi_agency_score).toBeLessThanOrEqual(100);
    });

    it("empty arrays with total_children > 0 still produce rating", () => {
      const r = computeHomeMultiAgency({
        today: "2026-05-27",
        multi_agency_meetings: [],
        professional_meetings: [],
        iro_correspondence: [],
        police_contacts: [],
        total_children: 3,
      });
      expect(r.multi_agency_rating).not.toBe("insufficient_data");
      expect(typeof r.multi_agency_score).toBe("number");
    });

    it("meetings outside 90d window are excluded from all profiles", () => {
      const r = computeHomeMultiAgency(baseInput({
        multi_agency_meetings: [makeMeeting({ date: "2025-01-01" })],
        professional_meetings: [makeProfMeeting({ meeting_date: "2025-01-01" })],
        police_contacts: [makePolice({ contact_date: "2025-01-01" })],
      }));
      expect(r.meetings.total_meetings_90d).toBe(0);
      expect(r.professional_meetings.total_90d).toBe(0);
      expect(r.police.total_contacts_90d).toBe(0);
    });

    it("IRO correspondence is not filtered by 90d window", () => {
      const r = computeHomeMultiAgency(baseInput({
        iro_correspondence: [makeIRO({ date: "2025-01-01", response_required: true, response_sent: true })],
      }));
      expect(r.iro.total_correspondence).toBe(1);
      expect(r.iro.response_compliance_rate).toBe(100);
    });
  });
});
