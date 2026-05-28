import { describe, it, expect } from "vitest";
import {
  computeInformationFlowQuality,
  type InformationFlowQualityInput,
  type HandoverInput,
  type DailyLogInput,
  type CareEventSummaryInput,
  type NotificationSummaryInput,
} from "../home-information-flow-quality-intelligence-engine";

// ── Factory Helpers ─────────────────────────────────────────────────────────

function makeHandover(overrides: Partial<HandoverInput> = {}): HandoverInput {
  return {
    id: "h-1",
    shift_date: "2025-03-15",
    shift_type: "day",
    handed_over_by: "staff-1",
    received_by: "staff-2",
    has_content: true,
    items_count: 5,
    urgent_items_count: 1,
    children_mentioned_count: 4,
    total_children: 6,
    completed: true,
    created_at: "2025-03-15T07:00:00Z",
    ...overrides,
  };
}

function makeDailyLog(overrides: Partial<DailyLogInput> = {}): DailyLogInput {
  return {
    id: "dl-1",
    child_id: "child-1",
    date: "2025-03-15",
    staff_id: "staff-1",
    has_content: true,
    word_count: 120,
    categories_count: 3,
    has_mood_rating: true,
    has_incident_reference: false,
    created_at: "2025-03-15T18:00:00Z",
    ...overrides,
  };
}

function makeCareEvent(
  overrides: Partial<CareEventSummaryInput> = {},
): CareEventSummaryInput {
  return {
    id: "ce-1",
    child_id: "child-1",
    staff_id: "staff-1",
    category: "health",
    date: "2025-03-15",
    is_significant: false,
    is_verified: true,
    has_handover_note: false,
    has_follow_up: true,
    ...overrides,
  };
}

function makeNotification(
  overrides: Partial<NotificationSummaryInput> = {},
): NotificationSummaryInput {
  return {
    id: "notif-1",
    recipient_id: "staff-1",
    priority: "normal",
    read: true,
    entity_type: null,
    created_at: "2025-03-15T08:00:00Z",
    ...overrides,
  };
}

function baseInput(
  overrides: Partial<InformationFlowQualityInput> = {},
): InformationFlowQualityInput {
  return {
    today: "2025-03-15",
    total_staff: 10,
    total_children: 6,
    handovers: [],
    daily_logs: [],
    care_events: [],
    notifications: [],
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. SPECIAL CASES
// ═══════════════════════════════════════════════════════════════════════════

describe("computeInformationFlowQuality", () => {
  describe("special cases", () => {
    it("returns insufficient_data when all empty + 0 children + 0 staff", () => {
      const result = computeInformationFlowQuality(
        baseInput({ total_staff: 0, total_children: 0 }),
      );
      expect(result.flow_rating).toBe("insufficient_data");
      expect(result.flow_score).toBe(0);
    });

    it("returns correct headline for insufficient_data", () => {
      const result = computeInformationFlowQuality(
        baseInput({ total_staff: 0, total_children: 0 }),
      );
      expect(result.headline).toContain("Insufficient data");
    });

    it("returns zero for all metric rates on insufficient_data", () => {
      const result = computeInformationFlowQuality(
        baseInput({ total_staff: 0, total_children: 0 }),
      );
      expect(result.handover_completion_rate).toBe(0);
      expect(result.handover_content_rate).toBe(0);
      expect(result.daily_log_coverage_rate).toBe(0);
      expect(result.daily_log_quality_rate).toBe(0);
      expect(result.significant_event_handover_rate).toBe(0);
      expect(result.care_event_verification_rate).toBe(0);
      expect(result.notification_read_rate).toBe(0);
      expect(result.urgent_notification_read_rate).toBe(0);
      expect(result.information_continuity_score).toBe(0);
      expect(result.staff_engagement_rate).toBe(0);
    });

    it("returns one concern for insufficient_data", () => {
      const result = computeInformationFlowQuality(
        baseInput({ total_staff: 0, total_children: 0 }),
      );
      expect(result.concerns).toHaveLength(1);
      expect(result.concerns[0]).toContain("No data available");
    });

    it("returns one recommendation for insufficient_data", () => {
      const result = computeInformationFlowQuality(
        baseInput({ total_staff: 0, total_children: 0 }),
      );
      expect(result.recommendations).toHaveLength(1);
      expect(result.recommendations[0].rank).toBe(1);
      expect(result.recommendations[0].urgency).toBe("immediate");
      expect(result.recommendations[0].regulatory_ref).toBe("Reg 13");
    });

    it("returns one warning insight for insufficient_data", () => {
      const result = computeInformationFlowQuality(
        baseInput({ total_staff: 0, total_children: 0 }),
      );
      expect(result.insights).toHaveLength(1);
      expect(result.insights[0].severity).toBe("warning");
    });

    it("returns empty strengths for insufficient_data", () => {
      const result = computeInformationFlowQuality(
        baseInput({ total_staff: 0, total_children: 0 }),
      );
      expect(result.strengths).toHaveLength(0);
    });

    it("returns inadequate when all empty but children > 0", () => {
      const result = computeInformationFlowQuality(
        baseInput({ total_children: 6, total_staff: 10 }),
      );
      expect(result.flow_rating).toBe("inadequate");
      expect(result.flow_score).toBe(15);
    });

    it("returns correct headline for inadequate with children", () => {
      const result = computeInformationFlowQuality(
        baseInput({ total_children: 3 }),
      );
      expect(result.headline).toContain("No information flow activity recorded");
    });

    it("returns one concern for inadequate with children", () => {
      const result = computeInformationFlowQuality(
        baseInput({ total_children: 3 }),
      );
      expect(result.concerns).toHaveLength(1);
      expect(result.concerns[0]).toContain("No information flow activity recorded");
    });

    it("returns two recommendations for inadequate with children", () => {
      const result = computeInformationFlowQuality(
        baseInput({ total_children: 3 }),
      );
      expect(result.recommendations).toHaveLength(2);
      expect(result.recommendations[0].rank).toBe(1);
      expect(result.recommendations[0].regulatory_ref).toBe("Reg 13");
      expect(result.recommendations[1].rank).toBe(2);
      expect(result.recommendations[1].regulatory_ref).toBe("Reg 36");
    });

    it("returns one critical insight for inadequate with children", () => {
      const result = computeInformationFlowQuality(
        baseInput({ total_children: 3 }),
      );
      expect(result.insights).toHaveLength(1);
      expect(result.insights[0].severity).toBe("critical");
    });

    it("returns inadequate with children=1 and staff=0", () => {
      const result = computeInformationFlowQuality(
        baseInput({ total_children: 1, total_staff: 0 }),
      );
      expect(result.flow_rating).toBe("inadequate");
      expect(result.flow_score).toBe(15);
    });

    it("staff > 0 but children=0 and arrays empty falls through to normal computation", () => {
      const result = computeInformationFlowQuality(
        baseInput({ total_staff: 5, total_children: 0 }),
      );
      // Falls through both special cases (not insufficient_data because total_staff > 0,
      // not the children case because total_children === 0).
      // However, with all arrays empty, all rates are 0 via pct(0,0)=0,
      // triggering all four penalties: 52 - 5 - 5 - 5 - 3 = 34 → inadequate.
      expect(result.flow_rating).not.toBe("insufficient_data");
      expect(result.flow_rating).toBe("inadequate");
      expect(result.flow_score).toBe(34);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. BASE SCORE
  // ═══════════════════════════════════════════════════════════════════════════

  describe("base score", () => {
    it("achieves exact base score 52 with carefully neutral rates", () => {
      const result = computeInformationFlowQuality(
        baseInput({
          total_staff: 20,
          total_children: 6,
          handovers: [
            makeHandover({ id: "h-1", completed: true, has_content: false }),
            makeHandover({ id: "h-2", completed: false, has_content: false, handed_over_by: "staff-3", received_by: "staff-4" }),
          ],
          daily_logs: [
            makeDailyLog({ id: "dl-1", child_id: "child-1", word_count: 10, staff_id: "staff-5" }),
            makeDailyLog({ id: "dl-2", child_id: "child-2", word_count: 10, staff_id: "staff-6" }),
            makeDailyLog({ id: "dl-3", child_id: "child-3", word_count: 10, staff_id: "staff-7" }),
          ],
          care_events: [
            makeCareEvent({ id: "ce-1", is_significant: true, has_handover_note: true, is_verified: false, staff_id: "staff-8" }),
            makeCareEvent({ id: "ce-2", is_significant: true, has_handover_note: false, is_verified: false, staff_id: "staff-9" }),
          ],
          notifications: Array.from({ length: 10 }, (_, i) =>
            makeNotification({
              id: `n-${i}`,
              priority: "urgent",
              read: i < 7,
              recipient_id: `staff-n-${i}`,
            }),
          ),
        }),
      );
      // handoverCompletion=50, handoverContent=0, dailyLogCoverage=50, dailyLogQuality=0
      // sigEventHandover=50, careEventVerification=0, notifRead=70 => +1
      // urgentNotifRead=70 => no penalty, staffEngagement=9/20=45% => no bonus
      // Score: 52 + 1 = 53
      expect(result.flow_score).toBe(53);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. INDIVIDUAL BONUSES
  // ═══════════════════════════════════════════════════════════════════════════

  describe("individual bonuses", () => {
    function neutralInputWithUrgent(): InformationFlowQualityInput {
      return baseInput({
        total_staff: 50,
        total_children: 6,
        handovers: [
          makeHandover({ id: "hb-1", completed: true, has_content: false }),
          makeHandover({ id: "hb-2", completed: false, has_content: false, handed_over_by: "staff-3", received_by: "staff-4" }),
        ],
        daily_logs: [
          makeDailyLog({ id: "dlb-1", child_id: "child-1", word_count: 10, staff_id: "staff-5" }),
          makeDailyLog({ id: "dlb-2", child_id: "child-2", word_count: 10, staff_id: "staff-6" }),
          makeDailyLog({ id: "dlb-3", child_id: "child-3", word_count: 10, staff_id: "staff-7" }),
        ],
        care_events: [
          makeCareEvent({ id: "ceb-1", is_significant: true, has_handover_note: true, is_verified: false, staff_id: "staff-8" }),
          makeCareEvent({ id: "ceb-2", is_significant: true, has_handover_note: false, is_verified: false, staff_id: "staff-9" }),
        ],
        notifications: Array.from({ length: 10 }, (_, i) =>
          makeNotification({
            id: `nb-${i}`,
            priority: "urgent",
            read: i < 7,
            recipient_id: `staff-nb-${i}`,
          }),
        ),
      });
    }
    // Baseline: 52 + 1(notifRead 70%) = 53. staffEngagement: 9/50=18%

    it("handoverCompletionRate >= 95 gives +4", () => {
      const input = neutralInputWithUrgent();
      input.handovers = Array.from({ length: 20 }, (_, i) =>
        makeHandover({ id: `h-${i}`, completed: i < 19, has_content: false, handed_over_by: `staff-hx-${i}`, received_by: `staff-rx-${i}` }),
      );
      const result = computeInformationFlowQuality(input);
      expect(result.handover_completion_rate).toBe(95);
      // staff: 40+3+2=45/50=90% => +2
      expect(result.flow_score).toBe(59);
    });

    it("handoverCompletionRate >= 80 but < 95 gives +2", () => {
      const input = neutralInputWithUrgent();
      input.handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandover({ id: `h-${i}`, completed: i < 8, has_content: false, handed_over_by: `staff-hx-${i}`, received_by: `staff-rx-${i}` }),
      );
      const result = computeInformationFlowQuality(input);
      expect(result.handover_completion_rate).toBe(80);
      // staff: 20+3+2=25/50=50% => +1
      expect(result.flow_score).toBe(56);
    });

    it("handoverContentRate >= 90 gives +3", () => {
      const input = neutralInputWithUrgent();
      input.handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandover({ id: `h-${i}`, completed: i < 5, has_content: i < 9, handed_over_by: `staff-hx-${i}`, received_by: `staff-rx-${i}` }),
      );
      const result = computeInformationFlowQuality(input);
      expect(result.handover_content_rate).toBe(90);
      expect(result.flow_score).toBe(57);
    });

    it("handoverContentRate >= 70 but < 90 gives +1", () => {
      const input = neutralInputWithUrgent();
      input.handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandover({ id: `h-${i}`, completed: i < 5, has_content: i < 7, handed_over_by: `staff-hx-${i}`, received_by: `staff-rx-${i}` }),
      );
      const result = computeInformationFlowQuality(input);
      expect(result.handover_content_rate).toBe(70);
      expect(result.flow_score).toBe(55);
    });

    it("dailyLogCoverageRate >= 90 gives +4", () => {
      const input = neutralInputWithUrgent();
      input.daily_logs = Array.from({ length: 6 }, (_, i) =>
        makeDailyLog({ id: `dl-${i}`, child_id: `child-${i + 1}`, word_count: 10, staff_id: `staff-lx-${i}` }),
      );
      const result = computeInformationFlowQuality(input);
      expect(result.daily_log_coverage_rate).toBe(100);
      expect(result.flow_score).toBe(57);
    });

    it("dailyLogCoverageRate >= 70 but < 90 gives +2", () => {
      const input = neutralInputWithUrgent();
      input.daily_logs = Array.from({ length: 5 }, (_, i) =>
        makeDailyLog({ id: `dl-${i}`, child_id: `child-${i + 1}`, word_count: 10, staff_id: `staff-lx-${i}` }),
      );
      const result = computeInformationFlowQuality(input);
      expect(result.daily_log_coverage_rate).toBe(83);
      expect(result.flow_score).toBe(55);
    });

    it("dailyLogQualityRate >= 80 gives +3", () => {
      const input = neutralInputWithUrgent();
      input.daily_logs = Array.from({ length: 5 }, (_, i) =>
        makeDailyLog({ id: `dl-${i}`, child_id: `child-${(i % 3) + 1}`, word_count: i < 4 ? 80 : 10, staff_id: `staff-lx-${i}` }),
      );
      const result = computeInformationFlowQuality(input);
      expect(result.daily_log_quality_rate).toBe(80);
      expect(result.flow_score).toBe(56);
    });

    it("dailyLogQualityRate >= 60 but < 80 gives +1", () => {
      const input = neutralInputWithUrgent();
      input.daily_logs = Array.from({ length: 5 }, (_, i) =>
        makeDailyLog({ id: `dl-${i}`, child_id: `child-${(i % 3) + 1}`, word_count: i < 3 ? 80 : 10, staff_id: `staff-lx-${i}` }),
      );
      const result = computeInformationFlowQuality(input);
      expect(result.daily_log_quality_rate).toBe(60);
      expect(result.flow_score).toBe(54);
    });

    it("significantEventHandoverRate >= 90 gives +4", () => {
      const input = neutralInputWithUrgent();
      input.care_events = Array.from({ length: 10 }, (_, i) =>
        makeCareEvent({ id: `ce-${i}`, is_significant: true, has_handover_note: i < 9, is_verified: false, staff_id: `staff-ex-${i}` }),
      );
      const result = computeInformationFlowQuality(input);
      expect(result.significant_event_handover_rate).toBe(90);
      expect(result.flow_score).toBe(57);
    });

    it("significantEventHandoverRate >= 70 but < 90 gives +2", () => {
      const input = neutralInputWithUrgent();
      input.care_events = Array.from({ length: 10 }, (_, i) =>
        makeCareEvent({ id: `ce-${i}`, is_significant: true, has_handover_note: i < 7, is_verified: false, staff_id: `staff-ex-${i}` }),
      );
      const result = computeInformationFlowQuality(input);
      expect(result.significant_event_handover_rate).toBe(70);
      expect(result.flow_score).toBe(55);
    });

    it("careEventVerificationRate >= 90 gives +3", () => {
      const input = neutralInputWithUrgent();
      input.care_events = Array.from({ length: 10 }, (_, i) =>
        makeCareEvent({ id: `ce-${i}`, is_significant: false, is_verified: i < 9, staff_id: `staff-ex-${i}` }),
      );
      const result = computeInformationFlowQuality(input);
      expect(result.care_event_verification_rate).toBe(90);
      // sigEventHandover=pct(0,0)=0 => -5
      expect(result.flow_score).toBe(51);
    });

    it("careEventVerificationRate >= 75 but < 90 gives +1", () => {
      const input = neutralInputWithUrgent();
      input.care_events = Array.from({ length: 4 }, (_, i) =>
        makeCareEvent({ id: `ce-${i}`, is_significant: false, is_verified: i < 3, staff_id: `staff-ex-${i}` }),
      );
      const result = computeInformationFlowQuality(input);
      expect(result.care_event_verification_rate).toBe(75);
      // sigEventHandover=pct(0,0)=0 => -5
      expect(result.flow_score).toBe(49);
    });

    it("notificationReadRate >= 90 gives +3", () => {
      const input = neutralInputWithUrgent();
      input.notifications = Array.from({ length: 10 }, (_, i) =>
        makeNotification({ id: `n-${i}`, priority: "urgent", read: i < 9, recipient_id: `staff-nx-${i}` }),
      );
      const result = computeInformationFlowQuality(input);
      expect(result.notification_read_rate).toBe(90);
      expect(result.flow_score).toBe(55);
    });

    it("notificationReadRate >= 70 but < 90 gives +1", () => {
      const input = neutralInputWithUrgent();
      const result = computeInformationFlowQuality(input);
      expect(result.notification_read_rate).toBe(70);
      expect(result.flow_score).toBe(53);
    });

    it("urgentNotificationReadRate >= 100 gives +2", () => {
      const input = neutralInputWithUrgent();
      input.notifications = Array.from({ length: 10 }, (_, i) =>
        makeNotification({ id: `n-${i}`, priority: i < 5 ? "urgent" : "normal", read: true, recipient_id: `staff-nx-${i}` }),
      );
      const result = computeInformationFlowQuality(input);
      expect(result.urgent_notification_read_rate).toBe(100);
      // notifRead=100% => +3, urgentNotifRead=100% => +2
      expect(result.flow_score).toBe(57);
    });

    it("urgentNotificationReadRate 99 does not give +2", () => {
      const input = neutralInputWithUrgent();
      input.notifications = Array.from({ length: 100 }, (_, i) =>
        makeNotification({ id: `n-${i}`, priority: "urgent", read: i < 99, recipient_id: `staff-nx-${i}` }),
      );
      const result = computeInformationFlowQuality(input);
      expect(result.urgent_notification_read_rate).toBe(99);
      // notifRead=99% => +3
      expect(result.flow_score).toBe(55);
    });

    it("staffEngagementRate >= 80 gives +2", () => {
      const result = computeInformationFlowQuality(
        baseInput({
          total_staff: 5,
          total_children: 6,
          handovers: [
            makeHandover({ id: "h-1", handed_over_by: "s1", received_by: "s2", completed: true, has_content: false }),
            makeHandover({ id: "h-2", handed_over_by: "s3", received_by: "s4", completed: false, has_content: false }),
          ],
          daily_logs: [
            makeDailyLog({ id: "dl-1", child_id: "child-1", staff_id: "s1", word_count: 10 }),
            makeDailyLog({ id: "dl-2", child_id: "child-2", staff_id: "s2", word_count: 10 }),
            makeDailyLog({ id: "dl-3", child_id: "child-3", staff_id: "s3", word_count: 10 }),
          ],
          care_events: [
            makeCareEvent({ id: "ce-1", is_significant: true, has_handover_note: true, is_verified: false, staff_id: "s4" }),
            makeCareEvent({ id: "ce-2", is_significant: true, has_handover_note: false, is_verified: false, staff_id: "s5" }),
          ],
          notifications: Array.from({ length: 10 }, (_, i) =>
            makeNotification({ id: `n-${i}`, priority: "urgent", read: i < 7 }),
          ),
        }),
      );
      expect(result.staff_engagement_rate).toBe(100);
      // 52 + 1(notif) + 2(staff) = 55
      expect(result.flow_score).toBe(55);
    });

    it("staffEngagementRate >= 50 but < 80 gives +1", () => {
      const result = computeInformationFlowQuality(
        baseInput({
          total_staff: 10,
          total_children: 6,
          handovers: [
            makeHandover({ id: "h-1", handed_over_by: "s1", received_by: "s2", completed: true, has_content: false }),
            makeHandover({ id: "h-2", handed_over_by: "s3", received_by: "s4", completed: false, has_content: false }),
          ],
          daily_logs: [
            makeDailyLog({ id: "dl-1", child_id: "child-1", staff_id: "s5", word_count: 10 }),
            makeDailyLog({ id: "dl-2", child_id: "child-2", staff_id: "s1", word_count: 10 }),
            makeDailyLog({ id: "dl-3", child_id: "child-3", staff_id: "s2", word_count: 10 }),
          ],
          care_events: [
            makeCareEvent({ id: "ce-1", is_significant: true, has_handover_note: true, is_verified: false, staff_id: "s4" }),
            makeCareEvent({ id: "ce-2", is_significant: true, has_handover_note: false, is_verified: false, staff_id: "s5" }),
          ],
          notifications: Array.from({ length: 10 }, (_, i) =>
            makeNotification({ id: `n-${i}`, priority: "urgent", read: i < 7 }),
          ),
        }),
      );
      expect(result.staff_engagement_rate).toBe(50);
      // 52 + 1(notif) + 1(staff) = 54
      expect(result.flow_score).toBe(54);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. INDIVIDUAL PENALTIES
  // ═══════════════════════════════════════════════════════════════════════════

  describe("individual penalties", () => {
    it("handoverCompletionRate < 50 gives -5 penalty", () => {
      const result = computeInformationFlowQuality(
        baseInput({
          total_staff: 50,
          handovers: Array.from({ length: 10 }, (_, i) =>
            makeHandover({ id: `h-${i}`, completed: i < 4, has_content: false, handed_over_by: `sh-${i}`, received_by: `sr-${i}` }),
          ),
          daily_logs: [
            makeDailyLog({ id: "dl-1", child_id: "child-1", word_count: 10, staff_id: "sa" }),
            makeDailyLog({ id: "dl-2", child_id: "child-2", word_count: 10, staff_id: "sb" }),
            makeDailyLog({ id: "dl-3", child_id: "child-3", word_count: 10, staff_id: "sc" }),
          ],
          care_events: [
            makeCareEvent({ id: "ce-1", is_significant: true, has_handover_note: true, is_verified: false, staff_id: "se1" }),
            makeCareEvent({ id: "ce-2", is_significant: true, has_handover_note: false, is_verified: false, staff_id: "se2" }),
          ],
          notifications: Array.from({ length: 10 }, (_, i) =>
            makeNotification({ id: `n-${i}`, priority: "urgent", read: i < 7 }),
          ),
        }),
      );
      expect(result.handover_completion_rate).toBe(40);
      // 52 + 1(notif70%) + 1(staffEngagement>=50: 25/50=50%) - 5(handover<50) = 49
      expect(result.flow_score).toBe(49);
    });

    it("significantEventHandoverRate < 50 gives -5 penalty", () => {
      const result = computeInformationFlowQuality(
        baseInput({
          total_staff: 50,
          handovers: [
            makeHandover({ id: "h-1", completed: true, has_content: false }),
            makeHandover({ id: "h-2", completed: false, has_content: false, handed_over_by: "s3", received_by: "s4" }),
          ],
          daily_logs: [
            makeDailyLog({ id: "dl-1", child_id: "child-1", word_count: 10, staff_id: "sa" }),
            makeDailyLog({ id: "dl-2", child_id: "child-2", word_count: 10, staff_id: "sb" }),
            makeDailyLog({ id: "dl-3", child_id: "child-3", word_count: 10, staff_id: "sc" }),
          ],
          care_events: Array.from({ length: 10 }, (_, i) =>
            makeCareEvent({ id: `ce-${i}`, is_significant: true, has_handover_note: i < 4, is_verified: false, staff_id: `se-${i}` }),
          ),
          notifications: Array.from({ length: 10 }, (_, i) =>
            makeNotification({ id: `n-${i}`, priority: "urgent", read: i < 7 }),
          ),
        }),
      );
      expect(result.significant_event_handover_rate).toBe(40);
      // 52 + 1(notif) - 5(sigEvent) = 48
      expect(result.flow_score).toBe(48);
    });

    it("urgentNotificationReadRate < 70 gives -5 penalty", () => {
      const result = computeInformationFlowQuality(
        baseInput({
          total_staff: 50,
          handovers: [
            makeHandover({ id: "h-1", completed: true, has_content: false }),
            makeHandover({ id: "h-2", completed: false, has_content: false, handed_over_by: "s3", received_by: "s4" }),
          ],
          daily_logs: [
            makeDailyLog({ id: "dl-1", child_id: "child-1", word_count: 10, staff_id: "sa" }),
            makeDailyLog({ id: "dl-2", child_id: "child-2", word_count: 10, staff_id: "sb" }),
            makeDailyLog({ id: "dl-3", child_id: "child-3", word_count: 10, staff_id: "sc" }),
          ],
          care_events: [
            makeCareEvent({ id: "ce-1", is_significant: true, has_handover_note: true, is_verified: false, staff_id: "se1" }),
            makeCareEvent({ id: "ce-2", is_significant: true, has_handover_note: false, is_verified: false, staff_id: "se2" }),
          ],
          notifications: Array.from({ length: 10 }, (_, i) =>
            makeNotification({ id: `n-${i}`, priority: "urgent", read: i < 6 }),
          ),
        }),
      );
      expect(result.urgent_notification_read_rate).toBe(60);
      // 52 - 5(urgentNotif<70) = 47
      expect(result.flow_score).toBe(47);
    });

    it("dailyLogCoverageRate < 40 gives -3 penalty", () => {
      const result = computeInformationFlowQuality(
        baseInput({
          total_staff: 50,
          total_children: 6,
          handovers: [
            makeHandover({ id: "h-1", completed: true, has_content: false }),
            makeHandover({ id: "h-2", completed: false, has_content: false, handed_over_by: "s3", received_by: "s4" }),
          ],
          daily_logs: [
            makeDailyLog({ id: "dl-1", child_id: "child-1", word_count: 10, staff_id: "sa" }),
            makeDailyLog({ id: "dl-2", child_id: "child-2", word_count: 10, staff_id: "sb" }),
          ],
          care_events: [
            makeCareEvent({ id: "ce-1", is_significant: true, has_handover_note: true, is_verified: false, staff_id: "se1" }),
            makeCareEvent({ id: "ce-2", is_significant: true, has_handover_note: false, is_verified: false, staff_id: "se2" }),
          ],
          notifications: Array.from({ length: 10 }, (_, i) =>
            makeNotification({ id: `n-${i}`, priority: "urgent", read: i < 7 }),
          ),
        }),
      );
      expect(result.daily_log_coverage_rate).toBe(33);
      // 52 + 1(notif) - 3(coverage) = 50
      expect(result.flow_score).toBe(50);
    });

    it("significantEventHandoverRate penalty fires even with 0 significant events", () => {
      const result = computeInformationFlowQuality(
        baseInput({
          total_staff: 50,
          handovers: [
            makeHandover({ id: "h-1", completed: true, has_content: false }),
            makeHandover({ id: "h-2", completed: false, has_content: false, handed_over_by: "s3", received_by: "s4" }),
          ],
          daily_logs: [
            makeDailyLog({ id: "dl-1", child_id: "child-1", word_count: 10, staff_id: "sa" }),
            makeDailyLog({ id: "dl-2", child_id: "child-2", word_count: 10, staff_id: "sb" }),
            makeDailyLog({ id: "dl-3", child_id: "child-3", word_count: 10, staff_id: "sc" }),
          ],
          care_events: [makeCareEvent({ id: "ce-1", is_significant: false, is_verified: false, staff_id: "sd" })],
          notifications: Array.from({ length: 10 }, (_, i) =>
            makeNotification({ id: `n-${i}`, priority: "urgent", read: i < 7 }),
          ),
        }),
      );
      expect(result.significant_event_handover_rate).toBe(0);
      // pct(0,0)=0 < 50 => -5. 52 + 1(notif) - 5 = 48
      expect(result.flow_score).toBe(48);
    });

    it("all four penalties stack", () => {
      const result = computeInformationFlowQuality(
        baseInput({
          total_staff: 100,
          total_children: 10,
          handovers: Array.from({ length: 10 }, (_, i) =>
            makeHandover({ id: `h-${i}`, completed: i < 4, has_content: false, handed_over_by: `sh-${i}`, received_by: `sr-${i}` }),
          ),
          daily_logs: [
            makeDailyLog({ id: "dl-1", child_id: "child-1", word_count: 10, staff_id: "sa" }),
            makeDailyLog({ id: "dl-2", child_id: "child-2", word_count: 10, staff_id: "sb" }),
            makeDailyLog({ id: "dl-3", child_id: "child-3", word_count: 10, staff_id: "sc" }),
          ],
          care_events: Array.from({ length: 10 }, (_, i) =>
            makeCareEvent({ id: `ce-${i}`, is_significant: true, has_handover_note: i < 4, is_verified: false, staff_id: `se-${i}` }),
          ),
          notifications: Array.from({ length: 10 }, (_, i) =>
            makeNotification({ id: `n-${i}`, priority: "urgent", read: i < 6 }),
          ),
        }),
      );
      // -5(handover) -5(sigEvent) -5(urgent) -3(coverage) = -18
      expect(result.flow_score).toBe(34);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. COMBINED -- OUTSTANDING
  // ═══════════════════════════════════════════════════════════════════════════

  describe("combined bonuses -- outstanding scenario", () => {
    it("all max bonuses yield score of 80", () => {
      const result = computeInformationFlowQuality(
        baseInput({
          total_staff: 10,
          total_children: 6,
          handovers: Array.from({ length: 20 }, (_, i) =>
            makeHandover({ id: `h-${i}`, completed: true, has_content: true, handed_over_by: `sh-${i}`, received_by: `sr-${i}` }),
          ),
          daily_logs: Array.from({ length: 6 }, (_, i) =>
            makeDailyLog({ id: `dl-${i}`, child_id: `child-${i + 1}`, word_count: 100, staff_id: `sl-${i}` }),
          ),
          care_events: Array.from({ length: 10 }, (_, i) =>
            makeCareEvent({ id: `ce-${i}`, is_significant: true, has_handover_note: true, is_verified: true, staff_id: `se-${i}` }),
          ),
          notifications: Array.from({ length: 10 }, (_, i) =>
            makeNotification({ id: `n-${i}`, priority: i < 5 ? "urgent" : "normal", read: true }),
          ),
        }),
      );
      expect(result.flow_score).toBe(80);
      expect(result.flow_rating).toBe("outstanding");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. RATING BOUNDARIES
  // ═══════════════════════════════════════════════════════════════════════════

  describe("rating boundaries", () => {
    it("score 80 -> outstanding", () => {
      const result = computeInformationFlowQuality(
        baseInput({
          total_staff: 10, total_children: 6,
          handovers: Array.from({ length: 20 }, (_, i) => makeHandover({ id: `h-${i}`, completed: true, has_content: true, handed_over_by: `sh-${i}`, received_by: `sr-${i}` })),
          daily_logs: Array.from({ length: 6 }, (_, i) => makeDailyLog({ id: `dl-${i}`, child_id: `child-${i + 1}`, word_count: 100, staff_id: `sl-${i}` })),
          care_events: Array.from({ length: 10 }, (_, i) => makeCareEvent({ id: `ce-${i}`, is_significant: true, has_handover_note: true, is_verified: true, staff_id: `se-${i}` })),
          notifications: Array.from({ length: 10 }, (_, i) => makeNotification({ id: `n-${i}`, priority: i < 5 ? "urgent" : "normal", read: true })),
        }),
      );
      expect(result.flow_score).toBe(80);
      expect(result.flow_rating).toBe("outstanding");
    });

    it("score 79 -> good", () => {
      const result = computeInformationFlowQuality(
        baseInput({
          total_staff: 100, total_children: 6,
          handovers: Array.from({ length: 20 }, (_, i) => makeHandover({ id: `h-${i}`, completed: true, has_content: true, handed_over_by: `sh-${i}`, received_by: `sr-${i}` })),
          daily_logs: Array.from({ length: 6 }, (_, i) => makeDailyLog({ id: `dl-${i}`, child_id: `child-${i + 1}`, word_count: 100, staff_id: `sl-${i}` })),
          care_events: Array.from({ length: 10 }, (_, i) => makeCareEvent({ id: `ce-${i}`, is_significant: true, has_handover_note: true, is_verified: true, staff_id: `se-${i}` })),
          notifications: Array.from({ length: 10 }, (_, i) => makeNotification({ id: `n-${i}`, priority: i < 5 ? "urgent" : "normal", read: true })),
        }),
      );
      // staff: 56/100=56% => +1 instead of +2. Score: 79
      expect(result.flow_score).toBe(79);
      expect(result.flow_rating).toBe("good");
    });

    it("score 45 -> adequate", () => {
      const result = computeInformationFlowQuality(
        baseInput({
          total_staff: 100, total_children: 6,
          handovers: Array.from({ length: 10 }, (_, i) => makeHandover({ id: `h-${i}`, completed: i < 4, has_content: false, handed_over_by: `sh-${i}`, received_by: `sr-${i}` })),
          daily_logs: [makeDailyLog({ id: "dl-1", child_id: "child-1", word_count: 10, staff_id: "sl-1" }), makeDailyLog({ id: "dl-2", child_id: "child-2", word_count: 10, staff_id: "sl-2" })],
          care_events: [
            makeCareEvent({ id: "ce-1", is_significant: true, has_handover_note: true, is_verified: false, staff_id: "se1" }),
            makeCareEvent({ id: "ce-2", is_significant: true, has_handover_note: false, is_verified: false, staff_id: "se2" }),
          ],
          notifications: Array.from({ length: 10 }, (_, i) => makeNotification({ id: `n-${i}`, priority: "urgent", read: i < 7 })),
        }),
      );
      // 52 + 1(notif70%) - 5(handover<50) - 3(coverage<40) = 45
      expect(result.flow_score).toBe(45);
      expect(result.flow_rating).toBe("adequate");
    });

    it("score 44 -> inadequate", () => {
      const result = computeInformationFlowQuality(
        baseInput({
          total_staff: 100, total_children: 6,
          handovers: Array.from({ length: 10 }, (_, i) => makeHandover({ id: `h-${i}`, completed: i < 4, has_content: false, handed_over_by: `sh-${i}`, received_by: `sr-${i}` })),
          daily_logs: [makeDailyLog({ id: "dl-1", child_id: "child-1", word_count: 10, staff_id: "sl-1" }), makeDailyLog({ id: "dl-2", child_id: "child-2", word_count: 10, staff_id: "sl-2" })],
          care_events: [
            makeCareEvent({ id: "ce-1", is_significant: true, has_handover_note: true, is_verified: false, staff_id: "se1" }),
            makeCareEvent({ id: "ce-2", is_significant: true, has_handover_note: false, is_verified: false, staff_id: "se2" }),
          ],
          notifications: [
            ...Array.from({ length: 10 }, (_, i) => makeNotification({ id: `nu-${i}`, priority: "urgent", read: i < 7 })),
            ...Array.from({ length: 10 }, (_, i) => makeNotification({ id: `nn-${i}`, priority: "normal", read: false })),
          ],
        }),
      );
      // notifRead=pct(7,20)=35% => no bonus. 52 - 5(handover) - 3(coverage) = 44
      expect(result.flow_score).toBe(44);
      expect(result.flow_rating).toBe("inadequate");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. METRIC CALCULATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("metric calculations", () => {
    it("handover_completion_rate = completed / total handovers", () => {
      const result = computeInformationFlowQuality(baseInput({
        handovers: [
          makeHandover({ id: "h-1", completed: true }),
          makeHandover({ id: "h-2", completed: true, handed_over_by: "s3", received_by: "s4" }),
          makeHandover({ id: "h-3", completed: false, handed_over_by: "s5", received_by: "s6" }),
        ],
      }));
      expect(result.handover_completion_rate).toBe(67);
    });

    it("handover_content_rate = has_content / total handovers", () => {
      const result = computeInformationFlowQuality(baseInput({
        handovers: [
          makeHandover({ id: "h-1", has_content: true }),
          makeHandover({ id: "h-2", has_content: false, handed_over_by: "s3", received_by: "s4" }),
          makeHandover({ id: "h-3", has_content: true, handed_over_by: "s5", received_by: "s6" }),
          makeHandover({ id: "h-4", has_content: false, handed_over_by: "s7", received_by: "s8" }),
        ],
      }));
      expect(result.handover_content_rate).toBe(50);
    });

    it("daily_log_coverage_rate = unique children / total_children", () => {
      const result = computeInformationFlowQuality(baseInput({
        total_children: 10,
        daily_logs: [
          makeDailyLog({ id: "dl-1", child_id: "child-1" }),
          makeDailyLog({ id: "dl-2", child_id: "child-1" }),
          makeDailyLog({ id: "dl-3", child_id: "child-2" }),
          makeDailyLog({ id: "dl-4", child_id: "child-3" }),
        ],
      }));
      expect(result.daily_log_coverage_rate).toBe(30);
    });

    it("daily_log_quality_rate = word_count>=50 / total logs", () => {
      const result = computeInformationFlowQuality(baseInput({
        daily_logs: [
          makeDailyLog({ id: "dl-1", child_id: "child-1", word_count: 50 }),
          makeDailyLog({ id: "dl-2", child_id: "child-2", word_count: 49 }),
          makeDailyLog({ id: "dl-3", child_id: "child-3", word_count: 100 }),
          makeDailyLog({ id: "dl-4", child_id: "child-4", word_count: 10 }),
        ],
      }));
      expect(result.daily_log_quality_rate).toBe(50);
    });

    it("word_count of exactly 50 counts as quality", () => {
      const result = computeInformationFlowQuality(baseInput({
        daily_logs: [makeDailyLog({ id: "dl-1", child_id: "child-1", word_count: 50 })],
      }));
      expect(result.daily_log_quality_rate).toBe(100);
    });

    it("word_count of 49 does not count as quality", () => {
      const result = computeInformationFlowQuality(baseInput({
        daily_logs: [makeDailyLog({ id: "dl-1", child_id: "child-1", word_count: 49 })],
      }));
      expect(result.daily_log_quality_rate).toBe(0);
    });

    it("significant_event_handover_rate excludes non-significant events", () => {
      const result = computeInformationFlowQuality(baseInput({
        care_events: [
          makeCareEvent({ id: "ce-1", is_significant: true, has_handover_note: true }),
          makeCareEvent({ id: "ce-2", is_significant: true, has_handover_note: false, staff_id: "s2" }),
          makeCareEvent({ id: "ce-3", is_significant: false, has_handover_note: true, staff_id: "s3" }),
        ],
      }));
      expect(result.significant_event_handover_rate).toBe(50);
    });

    it("care_event_verification_rate = verified / total", () => {
      const result = computeInformationFlowQuality(baseInput({
        care_events: [
          makeCareEvent({ id: "ce-1", is_verified: true }),
          makeCareEvent({ id: "ce-2", is_verified: false, staff_id: "s2" }),
          makeCareEvent({ id: "ce-3", is_verified: true, staff_id: "s3" }),
        ],
      }));
      expect(result.care_event_verification_rate).toBe(67);
    });

    it("notification_read_rate = read / total", () => {
      const result = computeInformationFlowQuality(baseInput({
        notifications: [
          makeNotification({ id: "n-1", read: true }),
          makeNotification({ id: "n-2", read: false }),
          makeNotification({ id: "n-3", read: true }),
        ],
      }));
      expect(result.notification_read_rate).toBe(67);
    });

    it("urgent_notification_read_rate counts urgent AND high", () => {
      const result = computeInformationFlowQuality(baseInput({
        notifications: [
          makeNotification({ id: "n-1", priority: "urgent", read: true }),
          makeNotification({ id: "n-2", priority: "high", read: true }),
          makeNotification({ id: "n-3", priority: "high", read: false }),
          makeNotification({ id: "n-4", priority: "normal", read: false }),
        ],
      }));
      expect(result.urgent_notification_read_rate).toBe(67);
    });

    it("normal and low do not count toward urgent rate", () => {
      const result = computeInformationFlowQuality(baseInput({
        notifications: [
          makeNotification({ id: "n-1", priority: "normal", read: true }),
          makeNotification({ id: "n-2", priority: "low", read: true }),
        ],
      }));
      expect(result.urgent_notification_read_rate).toBe(0);
    });

    it("information_continuity_score averages four rates", () => {
      const result = computeInformationFlowQuality(baseInput({
        total_children: 4,
        handovers: [makeHandover({ id: "h-1", completed: true }), makeHandover({ id: "h-2", completed: true, handed_over_by: "s3", received_by: "s4" })],
        daily_logs: [makeDailyLog({ id: "dl-1", child_id: "child-1" }), makeDailyLog({ id: "dl-2", child_id: "child-2" })],
        care_events: [makeCareEvent({ id: "ce-1", is_verified: true }), makeCareEvent({ id: "ce-2", is_verified: false, staff_id: "s5" })],
        notifications: [makeNotification({ id: "n-1", read: true }), makeNotification({ id: "n-2", read: true }), makeNotification({ id: "n-3", read: false }), makeNotification({ id: "n-4", read: true })],
      }));
      // (100+50+50+75)/4 = 68.75 => 69
      expect(result.information_continuity_score).toBe(69);
    });

    it("staff_engagement_rate deduplicates staff", () => {
      const result = computeInformationFlowQuality(baseInput({
        total_staff: 10,
        handovers: [makeHandover({ id: "h-1", handed_over_by: "s1", received_by: "s2" })],
        daily_logs: [makeDailyLog({ id: "dl-1", child_id: "child-1", staff_id: "s2" }), makeDailyLog({ id: "dl-2", child_id: "child-2", staff_id: "s3" })],
        care_events: [makeCareEvent({ id: "ce-1", staff_id: "s3" }), makeCareEvent({ id: "ce-2", staff_id: "s4" })],
      }));
      expect(result.staff_engagement_rate).toBe(40);
    });

    it("staff_engagement counts both handover roles", () => {
      const result = computeInformationFlowQuality(baseInput({
        total_staff: 5,
        handovers: [
          makeHandover({ id: "h-1", handed_over_by: "s1", received_by: "s2" }),
          makeHandover({ id: "h-2", handed_over_by: "s3", received_by: "s4" }),
        ],
      }));
      expect(result.staff_engagement_rate).toBe(80);
    });

    it("pct returns 0 when denominator is 0", () => {
      const result = computeInformationFlowQuality(baseInput({
        total_children: 0, total_staff: 5, handovers: [makeHandover({ id: "h-1" })],
      }));
      expect(result.daily_log_coverage_rate).toBe(0);
    });

    it("pct rounds 33.33 to 33", () => {
      const result = computeInformationFlowQuality(baseInput({
        handovers: [
          makeHandover({ id: "h-1", completed: true }),
          makeHandover({ id: "h-2", completed: false, handed_over_by: "s3", received_by: "s4" }),
          makeHandover({ id: "h-3", completed: false, handed_over_by: "s5", received_by: "s6" }),
        ],
      }));
      expect(result.handover_completion_rate).toBe(33);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. STRENGTHS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("strengths", () => {
    it("handoverCompletion >= 95 triggers strength", () => {
      const result = computeInformationFlowQuality(baseInput({
        handovers: Array.from({ length: 20 }, (_, i) => makeHandover({ id: `h-${i}`, completed: true, handed_over_by: `s-${i}`, received_by: `r-${i}` })),
      }));
      expect(result.strengths).toEqual(expect.arrayContaining([expect.stringContaining("handover completion")]));
    });

    it("handoverCompletion 94 does not trigger strength", () => {
      const result = computeInformationFlowQuality(baseInput({
        handovers: Array.from({ length: 18 }, (_, i) => makeHandover({ id: `h-${i}`, completed: i < 17, handed_over_by: `s-${i}`, received_by: `r-${i}` })),
      }));
      expect(result.strengths.some(s => s.includes("handover completion"))).toBe(false);
    });

    it("handoverContent >= 90 triggers strength", () => {
      const result = computeInformationFlowQuality(baseInput({
        handovers: Array.from({ length: 10 }, (_, i) => makeHandover({ id: `h-${i}`, has_content: true, handed_over_by: `s-${i}`, received_by: `r-${i}` })),
      }));
      expect(result.strengths).toEqual(expect.arrayContaining([expect.stringContaining("substantive content")]));
    });

    it("dailyLogCoverage >= 90 triggers strength", () => {
      const result = computeInformationFlowQuality(baseInput({
        total_children: 6,
        daily_logs: Array.from({ length: 6 }, (_, i) => makeDailyLog({ id: `dl-${i}`, child_id: `child-${i + 1}` })),
      }));
      expect(result.strengths).toEqual(expect.arrayContaining([expect.stringContaining("daily log coverage")]));
    });

    it("dailyLogQuality >= 80 triggers strength", () => {
      const result = computeInformationFlowQuality(baseInput({
        daily_logs: Array.from({ length: 5 }, (_, i) => makeDailyLog({ id: `dl-${i}`, child_id: `child-${(i % 3) + 1}`, word_count: i < 4 ? 100 : 50 })),
      }));
      expect(result.strengths).toEqual(expect.arrayContaining([expect.stringContaining("quality threshold")]));
    });

    it("sigEventHandover >= 90 with events triggers strength", () => {
      const result = computeInformationFlowQuality(baseInput({
        care_events: Array.from({ length: 10 }, (_, i) => makeCareEvent({ id: `ce-${i}`, is_significant: true, has_handover_note: true, staff_id: `s-${i}` })),
      }));
      expect(result.strengths).toEqual(expect.arrayContaining([expect.stringContaining("significant events flagged for handover")]));
    });

    it("sigEventHandover >= 90 with 0 significant events does NOT trigger", () => {
      const result = computeInformationFlowQuality(baseInput({
        care_events: [makeCareEvent({ id: "ce-1", is_significant: false })],
      }));
      expect(result.strengths.some(s => s.includes("significant events flagged"))).toBe(false);
    });

    it("careEventVerification >= 90 with events triggers strength", () => {
      const result = computeInformationFlowQuality(baseInput({
        care_events: Array.from({ length: 10 }, (_, i) => makeCareEvent({ id: `ce-${i}`, is_verified: true, staff_id: `s-${i}` })),
      }));
      expect(result.strengths).toEqual(expect.arrayContaining([expect.stringContaining("care event verification")]));
    });

    it("careEventVerification >= 90 with 0 events does NOT trigger", () => {
      const result = computeInformationFlowQuality(baseInput({ care_events: [] }));
      expect(result.strengths.some(s => s.includes("care event verification"))).toBe(false);
    });

    it("notificationRead >= 90 triggers strength", () => {
      const result = computeInformationFlowQuality(baseInput({
        notifications: Array.from({ length: 10 }, (_, i) => makeNotification({ id: `n-${i}`, read: true })),
      }));
      expect(result.strengths).toEqual(expect.arrayContaining([expect.stringContaining("notification read rate")]));
    });

    it("urgentNotifRead === 100 with urgent notifs triggers strength", () => {
      const result = computeInformationFlowQuality(baseInput({
        notifications: [makeNotification({ id: "n-1", priority: "urgent", read: true }), makeNotification({ id: "n-2", priority: "high", read: true })],
      }));
      expect(result.strengths).toEqual(expect.arrayContaining([expect.stringContaining("urgent and high-priority notifications have been read")]));
    });

    it("urgentNotifRead === 100 with 0 urgent does NOT trigger", () => {
      const result = computeInformationFlowQuality(baseInput({
        notifications: [makeNotification({ id: "n-1", priority: "normal", read: true })],
      }));
      expect(result.strengths.some(s => s.includes("urgent and high-priority"))).toBe(false);
    });

    it("staffEngagement >= 80 triggers strength", () => {
      const result = computeInformationFlowQuality(baseInput({
        total_staff: 5,
        handovers: [makeHandover({ id: "h-1", handed_over_by: "s1", received_by: "s2" }), makeHandover({ id: "h-2", handed_over_by: "s3", received_by: "s4" })],
      }));
      expect(result.strengths).toEqual(expect.arrayContaining([expect.stringContaining("staff engagement")]));
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. CONCERNS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("concerns", () => {
    it("handoverCompletion < 50 triggers critical concern", () => {
      const result = computeInformationFlowQuality(baseInput({
        handovers: Array.from({ length: 10 }, (_, i) => makeHandover({ id: `h-${i}`, completed: i < 4, handed_over_by: `s-${i}`, received_by: `r-${i}` })),
      }));
      expect(result.concerns).toEqual(expect.arrayContaining([expect.stringContaining("critical communication gaps")]));
    });

    it("handoverCompletion 50-79 triggers moderate concern", () => {
      const result = computeInformationFlowQuality(baseInput({
        handovers: Array.from({ length: 10 }, (_, i) => makeHandover({ id: `h-${i}`, completed: i < 6, handed_over_by: `s-${i}`, received_by: `r-${i}` })),
      }));
      expect(result.concerns).toEqual(expect.arrayContaining([expect.stringContaining("some shift changes lack")]));
    });

    it("handoverCompletion >= 80 no concern", () => {
      const result = computeInformationFlowQuality(baseInput({
        handovers: Array.from({ length: 10 }, (_, i) => makeHandover({ id: `h-${i}`, completed: i < 8, handed_over_by: `s-${i}`, received_by: `r-${i}` })),
      }));
      expect(result.concerns.some(s => s.includes("handover") && s.includes("completion"))).toBe(false);
    });

    it("handoverContent < 70 with handovers triggers concern", () => {
      const result = computeInformationFlowQuality(baseInput({
        handovers: Array.from({ length: 10 }, (_, i) => makeHandover({ id: `h-${i}`, has_content: i < 6, handed_over_by: `s-${i}`, received_by: `r-${i}` })),
      }));
      expect(result.concerns).toEqual(expect.arrayContaining([expect.stringContaining("formality")]));
    });

    it("handoverContent < 70 with 0 handovers no concern", () => {
      const result = computeInformationFlowQuality(baseInput());
      expect(result.concerns.some(s => s.includes("formality"))).toBe(false);
    });

    it("dailyLogCoverage < 40 triggers critical concern", () => {
      const result = computeInformationFlowQuality(baseInput({
        total_children: 10,
        daily_logs: [makeDailyLog({ id: "dl-1", child_id: "child-1" }), makeDailyLog({ id: "dl-2", child_id: "child-2" }), makeDailyLog({ id: "dl-3", child_id: "child-3" })],
      }));
      expect(result.concerns).toEqual(expect.arrayContaining([expect.stringContaining("most children have no daily recording")]));
    });

    it("dailyLogCoverage 40-69 triggers moderate concern", () => {
      const result = computeInformationFlowQuality(baseInput({
        total_children: 10,
        daily_logs: Array.from({ length: 5 }, (_, i) => makeDailyLog({ id: `dl-${i}`, child_id: `child-${i + 1}` })),
      }));
      expect(result.concerns).toEqual(expect.arrayContaining([expect.stringContaining("some children are not being recorded")]));
    });

    it("dailyLogQuality < 60 with logs triggers concern", () => {
      const result = computeInformationFlowQuality(baseInput({
        daily_logs: Array.from({ length: 10 }, (_, i) => makeDailyLog({ id: `dl-${i}`, child_id: `child-${(i % 6) + 1}`, word_count: i < 5 ? 60 : 10 })),
      }));
      expect(result.concerns).toEqual(expect.arrayContaining([expect.stringContaining("lack detail")]));
    });

    it("sigEventHandover < 50 with events triggers concern", () => {
      const result = computeInformationFlowQuality(baseInput({
        care_events: [
          makeCareEvent({ id: "ce-1", is_significant: true, has_handover_note: false }),
          makeCareEvent({ id: "ce-2", is_significant: true, has_handover_note: false, staff_id: "s2" }),
        ],
      }));
      expect(result.concerns).toEqual(expect.arrayContaining([expect.stringContaining("not reaching the next shift")]));
    });

    it("sigEventHandover < 50 with 0 significant no concern", () => {
      const result = computeInformationFlowQuality(baseInput({
        care_events: [makeCareEvent({ id: "ce-1", is_significant: false })],
      }));
      expect(result.concerns.some(s => s.includes("not reaching the next shift"))).toBe(false);
    });

    it("careEventVerification < 75 with events triggers concern", () => {
      const result = computeInformationFlowQuality(baseInput({
        care_events: Array.from({ length: 4 }, (_, i) => makeCareEvent({ id: `ce-${i}`, is_verified: i < 2, staff_id: `s-${i}` })),
      }));
      expect(result.concerns).toEqual(expect.arrayContaining([expect.stringContaining("management oversight")]));
    });

    it("urgentNotifRead < 70 with urgent triggers concern", () => {
      const result = computeInformationFlowQuality(baseInput({
        notifications: Array.from({ length: 10 }, (_, i) => makeNotification({ id: `n-${i}`, priority: "urgent", read: i < 6 })),
      }));
      expect(result.concerns).toEqual(expect.arrayContaining([expect.stringContaining("critical alerts are being missed")]));
    });

    it("notifRead < 70 with notifications triggers concern", () => {
      const result = computeInformationFlowQuality(baseInput({
        notifications: Array.from({ length: 10 }, (_, i) => makeNotification({ id: `n-${i}`, priority: "normal", read: i < 6 })),
      }));
      expect(result.concerns).toEqual(expect.arrayContaining([expect.stringContaining("staff are not engaging")]));
    });

    it("staffEngagement < 50 with staff>0 triggers concern", () => {
      const result = computeInformationFlowQuality(baseInput({
        total_staff: 10,
        handovers: [makeHandover({ id: "h-1", handed_over_by: "s1", received_by: "s2" })],
        daily_logs: [makeDailyLog({ id: "dl-1", child_id: "child-1", staff_id: "s3" })],
      }));
      expect(result.concerns).toEqual(expect.arrayContaining([expect.stringContaining("most of the team")]));
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 10. RECOMMENDATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("recommendations", () => {
    it("handoverCompletion < 80 => immediate, Reg 13", () => {
      const result = computeInformationFlowQuality(baseInput({
        handovers: Array.from({ length: 10 }, (_, i) => makeHandover({ id: `h-${i}`, completed: i < 7, handed_over_by: `s-${i}`, received_by: `r-${i}` })),
      }));
      const rec = result.recommendations.find(r => r.recommendation.includes("mandatory handover"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
      expect(rec!.regulatory_ref).toBe("Reg 13");
    });

    it("handoverCompletion >= 80 no recommendation", () => {
      const result = computeInformationFlowQuality(baseInput({
        handovers: Array.from({ length: 10 }, (_, i) => makeHandover({ id: `h-${i}`, completed: i < 8, handed_over_by: `s-${i}`, received_by: `r-${i}` })),
      }));
      expect(result.recommendations.find(r => r.recommendation.includes("mandatory handover"))).toBeUndefined();
    });

    it("sigEventHandover < 70 with events => immediate, Reg 36", () => {
      const result = computeInformationFlowQuality(baseInput({
        care_events: Array.from({ length: 10 }, (_, i) => makeCareEvent({ id: `ce-${i}`, is_significant: true, has_handover_note: i < 6, staff_id: `s-${i}` })),
      }));
      const rec = result.recommendations.find(r => r.recommendation.includes("automatically flagged"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
      expect(rec!.regulatory_ref).toBe("Reg 36");
    });

    it("urgentNotifRead < 70 with urgent => immediate, Reg 13", () => {
      const result = computeInformationFlowQuality(baseInput({
        notifications: Array.from({ length: 10 }, (_, i) => makeNotification({ id: `n-${i}`, priority: "urgent", read: i < 6 })),
      }));
      const rec = result.recommendations.find(r => r.recommendation.includes("urgent notifications"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("dailyLogCoverage < 70 => soon, Reg 36", () => {
      const result = computeInformationFlowQuality(baseInput({
        total_children: 10,
        daily_logs: [makeDailyLog({ id: "dl-1", child_id: "child-1" }), makeDailyLog({ id: "dl-2", child_id: "child-2" })],
      }));
      const rec = result.recommendations.find(r => r.recommendation.includes("daily log completion"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("dailyLogQuality < 60 with logs => soon, Reg 36", () => {
      const result = computeInformationFlowQuality(baseInput({
        daily_logs: Array.from({ length: 10 }, (_, i) => makeDailyLog({ id: `dl-${i}`, child_id: `child-${(i % 6) + 1}`, word_count: i < 5 ? 60 : 10 })),
      }));
      const rec = result.recommendations.find(r => r.recommendation.includes("meaningful recording"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("careEventVerification < 75 => soon, Reg 13", () => {
      const result = computeInformationFlowQuality(baseInput({
        care_events: Array.from({ length: 4 }, (_, i) => makeCareEvent({ id: `ce-${i}`, is_verified: i < 2, staff_id: `s-${i}` })),
      }));
      const rec = result.recommendations.find(r => r.recommendation.includes("verification workflow"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("staffEngagement < 50 => planned, Reg 13", () => {
      const result = computeInformationFlowQuality(baseInput({
        total_staff: 20, handovers: [makeHandover({ id: "h-1" })],
      }));
      const rec = result.recommendations.find(r => r.recommendation.includes("low staff engagement"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
    });

    it("notifRead < 70 => planned, Reg 13", () => {
      const result = computeInformationFlowQuality(baseInput({
        notifications: Array.from({ length: 10 }, (_, i) => makeNotification({ id: `n-${i}`, priority: "normal", read: i < 6 })),
      }));
      const rec = result.recommendations.find(r => r.recommendation.includes("notification delivery"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
    });

    it("recommendations have sequential ranks", () => {
      const result = computeInformationFlowQuality(baseInput({
        total_staff: 100, total_children: 6,
        handovers: Array.from({ length: 10 }, (_, i) => makeHandover({ id: `h-${i}`, completed: i < 3, has_content: false, handed_over_by: `s-${i}`, received_by: `r-${i}` })),
        daily_logs: [makeDailyLog({ id: "dl-1", child_id: "child-1", word_count: 10, staff_id: "sl-1" }), makeDailyLog({ id: "dl-2", child_id: "child-2", word_count: 10, staff_id: "sl-2" })],
        care_events: Array.from({ length: 10 }, (_, i) => makeCareEvent({ id: `ce-${i}`, is_significant: true, has_handover_note: i < 5, is_verified: i < 5, staff_id: `se-${i}` })),
        notifications: Array.from({ length: 10 }, (_, i) => makeNotification({ id: `n-${i}`, priority: i < 5 ? "urgent" : "normal", read: i < 3 })),
      }));
      for (let i = 0; i < result.recommendations.length; i++) {
        expect(result.recommendations[i].rank).toBe(i + 1);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 11. INSIGHTS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("insights", () => {
    it("positive insight for strong flow", () => {
      const result = computeInformationFlowQuality(baseInput({
        total_staff: 10, total_children: 6,
        handovers: Array.from({ length: 20 }, (_, i) => makeHandover({ id: `h-${i}`, completed: true, has_content: true, handed_over_by: `s-${i}`, received_by: `r-${i}` })),
        daily_logs: Array.from({ length: 6 }, (_, i) => makeDailyLog({ id: `dl-${i}`, child_id: `child-${i + 1}`, staff_id: `sl-${i}` })),
        notifications: Array.from({ length: 10 }, (_, i) => makeNotification({ id: `n-${i}`, read: true })),
      }));
      const insight = result.insights.find(i => i.text.includes("Information flows strongly"));
      expect(insight).toBeDefined();
      expect(insight!.severity).toBe("positive");
    });

    it("positive insight for exemplary sig event communication", () => {
      const result = computeInformationFlowQuality(baseInput({
        care_events: Array.from({ length: 10 }, (_, i) => makeCareEvent({ id: `ce-${i}`, is_significant: true, has_handover_note: true, is_verified: true, staff_id: `se-${i}` })),
        handovers: [makeHandover({ id: "h-1" })],
      }));
      expect(result.insights.find(i => i.text.includes("exemplary"))).toBeDefined();
    });

    it("exemplary requires significant events > 0", () => {
      const result = computeInformationFlowQuality(baseInput({
        care_events: [makeCareEvent({ id: "ce-1", is_significant: false, is_verified: true })],
        handovers: [makeHandover({ id: "h-1" })],
      }));
      expect(result.insights.find(i => i.text.includes("exemplary"))).toBeUndefined();
    });

    it("exemplary requires verification >= 90", () => {
      const result = computeInformationFlowQuality(baseInput({
        care_events: Array.from({ length: 10 }, (_, i) => makeCareEvent({ id: `ce-${i}`, is_significant: true, has_handover_note: true, is_verified: i < 8, staff_id: `se-${i}` })),
        handovers: [makeHandover({ id: "h-1" })],
      }));
      expect(result.insights.find(i => i.text.includes("exemplary"))).toBeUndefined();
    });

    it("critical insight when handoverCompletion < 50", () => {
      const result = computeInformationFlowQuality(baseInput({
        handovers: Array.from({ length: 10 }, (_, i) => makeHandover({ id: `h-${i}`, completed: i < 4, handed_over_by: `s-${i}`, received_by: `r-${i}` })),
      }));
      expect(result.insights.find(i => i.text.includes("Fewer than half"))?.severity).toBe("critical");
    });

    it("critical insight when sigEventHandover < 50 with events", () => {
      const result = computeInformationFlowQuality(baseInput({
        care_events: Array.from({ length: 10 }, (_, i) => makeCareEvent({ id: `ce-${i}`, is_significant: true, has_handover_note: i < 4, staff_id: `s-${i}` })),
        handovers: [makeHandover({ id: "h-1" })],
      }));
      expect(result.insights.find(i => i.text.includes("critical safety information"))?.severity).toBe("critical");
    });

    it("sigEventHandover < 50 insight requires events > 0", () => {
      const result = computeInformationFlowQuality(baseInput({
        care_events: [], handovers: [makeHandover({ id: "h-1" })],
      }));
      expect(result.insights.find(i => i.text.includes("critical safety information") && i.text.includes("flagged for handover"))).toBeUndefined();
    });

    it("critical insight when urgentNotifRead < 70 with urgent", () => {
      const result = computeInformationFlowQuality(baseInput({
        notifications: Array.from({ length: 10 }, (_, i) => makeNotification({ id: `n-${i}`, priority: "urgent", read: i < 5 })),
        handovers: [makeHandover({ id: "h-1" })],
      }));
      expect(result.insights.find(i => i.text.includes("urgent and high-priority notifications are unread"))?.severity).toBe("critical");
    });

    it("urgentNotif insight requires urgent > 0", () => {
      const result = computeInformationFlowQuality(baseInput({
        notifications: [makeNotification({ id: "n-1", priority: "normal", read: false })],
        handovers: [makeHandover({ id: "h-1" })],
      }));
      expect(result.insights.find(i => i.text.includes("urgent and high-priority notifications are unread"))).toBeUndefined();
    });

    it("critical insight when dailyLogCoverage < 40", () => {
      const result = computeInformationFlowQuality(baseInput({
        total_children: 10,
        daily_logs: [makeDailyLog({ id: "dl-1", child_id: "child-1" })],
        handovers: [makeHandover({ id: "h-1" })],
      }));
      expect(result.insights.find(i => i.text.includes("most children have no daily record"))?.severity).toBe("critical");
    });

    it("warning insight for low staff + poor handover", () => {
      const result = computeInformationFlowQuality(baseInput({
        total_staff: 100,
        handovers: Array.from({ length: 10 }, (_, i) => makeHandover({ id: `h-${i}`, completed: i < 6, handed_over_by: `s-${i}`, received_by: `r-${i}` })),
        daily_logs: [makeDailyLog({ id: "dl-1", child_id: "child-1", staff_id: "sl-1" }), makeDailyLog({ id: "dl-2", child_id: "child-2", staff_id: "sl-2" }), makeDailyLog({ id: "dl-3", child_id: "child-3", staff_id: "sl-3" })],
      }));
      expect(result.insights.find(i => i.text.includes("systemic communication culture problem"))?.severity).toBe("warning");
    });

    it("warning insight for low quality but reasonable coverage", () => {
      const result = computeInformationFlowQuality(baseInput({
        total_children: 6,
        daily_logs: Array.from({ length: 10 }, (_, i) => makeDailyLog({ id: `dl-${i}`, child_id: `child-${(i % 6) + 1}`, word_count: i < 5 ? 60 : 10 })),
        handovers: [makeHandover({ id: "h-1" })],
      }));
      expect(result.insights.find(i => i.text.includes("quality is low"))?.severity).toBe("warning");
    });

    it("quality-coverage warning requires coverage >= 70", () => {
      const result = computeInformationFlowQuality(baseInput({
        total_children: 10,
        daily_logs: Array.from({ length: 3 }, (_, i) => makeDailyLog({ id: `dl-${i}`, child_id: `child-${i + 1}`, word_count: 10 })),
        handovers: [makeHandover({ id: "h-1" })],
      }));
      expect(result.insights.find(i => i.text.includes("quality is low") && i.text.includes("coverage is reasonable"))).toBeUndefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 12. HEADLINES
  // ═══════════════════════════════════════════════════════════════════════════

  describe("headlines", () => {
    it("outstanding headline includes metrics", () => {
      const result = computeInformationFlowQuality(baseInput({
        total_staff: 10, total_children: 6,
        handovers: Array.from({ length: 20 }, (_, i) => makeHandover({ id: `h-${i}`, completed: true, has_content: true, handed_over_by: `s-${i}`, received_by: `r-${i}` })),
        daily_logs: Array.from({ length: 6 }, (_, i) => makeDailyLog({ id: `dl-${i}`, child_id: `child-${i + 1}`, word_count: 100, staff_id: `sl-${i}` })),
        care_events: Array.from({ length: 10 }, (_, i) => makeCareEvent({ id: `ce-${i}`, is_significant: true, has_handover_note: true, is_verified: true, staff_id: `se-${i}` })),
        notifications: Array.from({ length: 10 }, (_, i) => makeNotification({ id: `n-${i}`, priority: i < 5 ? "urgent" : "normal", read: true })),
      }));
      expect(result.headline).toContain("Outstanding information flow");
    });

    it("good headline text", () => {
      const result = computeInformationFlowQuality(baseInput({
        total_staff: 100, total_children: 6,
        handovers: Array.from({ length: 20 }, (_, i) => makeHandover({ id: `h-${i}`, completed: true, has_content: true, handed_over_by: `s-${i}`, received_by: `r-${i}` })),
        daily_logs: Array.from({ length: 6 }, (_, i) => makeDailyLog({ id: `dl-${i}`, child_id: `child-${i + 1}`, word_count: 100, staff_id: `sl-${i}` })),
        care_events: [makeCareEvent({ id: "ce-1", is_significant: true, has_handover_note: true, is_verified: true, staff_id: "se-1" }), makeCareEvent({ id: "ce-2", is_significant: true, has_handover_note: false, is_verified: true, staff_id: "se-2" })],
        notifications: Array.from({ length: 10 }, (_, i) => makeNotification({ id: `n-${i}`, priority: i < 5 ? "urgent" : "normal", read: true })),
      }));
      expect(result.headline).toContain("Good information flow");
    });

    it("adequate headline text", () => {
      const result = computeInformationFlowQuality(baseInput({
        total_staff: 50,
        handovers: [makeHandover({ id: "h-1", completed: true, has_content: false }), makeHandover({ id: "h-2", completed: false, has_content: false, handed_over_by: "s3", received_by: "s4" })],
        daily_logs: [makeDailyLog({ id: "dl-1", child_id: "child-1", word_count: 10 }), makeDailyLog({ id: "dl-2", child_id: "child-2", word_count: 10 }), makeDailyLog({ id: "dl-3", child_id: "child-3", word_count: 10 })],
        care_events: [makeCareEvent({ id: "ce-1", is_significant: true, has_handover_note: true, is_verified: false, staff_id: "se1" }), makeCareEvent({ id: "ce-2", is_significant: true, has_handover_note: false, is_verified: false, staff_id: "se2" })],
        notifications: Array.from({ length: 10 }, (_, i) => makeNotification({ id: `n-${i}`, priority: "urgent", read: i < 7 })),
      }));
      expect(result.headline).toContain("Adequate information flow");
    });

    it("inadequate headline text", () => {
      const result = computeInformationFlowQuality(baseInput({
        total_staff: 100,
        handovers: Array.from({ length: 10 }, (_, i) => makeHandover({ id: `h-${i}`, completed: i < 3, has_content: false, handed_over_by: `s-${i}`, received_by: `r-${i}` })),
        daily_logs: [makeDailyLog({ id: "dl-1", child_id: "child-1", word_count: 10 }), makeDailyLog({ id: "dl-2", child_id: "child-2", word_count: 10 })],
        care_events: Array.from({ length: 10 }, (_, i) => makeCareEvent({ id: `ce-${i}`, is_significant: true, has_handover_note: i < 3, is_verified: false, staff_id: `se-${i}` })),
        notifications: Array.from({ length: 10 }, (_, i) => makeNotification({ id: `n-${i}`, priority: "urgent", read: i < 5 })),
      }));
      expect(result.headline).toContain("Inadequate information flow");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 13. EDGE CASES
  // ═══════════════════════════════════════════════════════════════════════════

  describe("edge cases", () => {
    it("single handover only", () => {
      const result = computeInformationFlowQuality(baseInput({ handovers: [makeHandover({ id: "h-1", completed: true, has_content: true })] }));
      expect(result.handover_completion_rate).toBe(100);
      expect(result.handover_content_rate).toBe(100);
    });

    it("single daily log only", () => {
      const result = computeInformationFlowQuality(baseInput({ daily_logs: [makeDailyLog({ id: "dl-1", child_id: "child-1", word_count: 100 })] }));
      expect(result.daily_log_coverage_rate).toBe(17);
      expect(result.daily_log_quality_rate).toBe(100);
    });

    it("single care event only", () => {
      const result = computeInformationFlowQuality(baseInput({ care_events: [makeCareEvent({ id: "ce-1", is_significant: true, has_handover_note: true, is_verified: true })] }));
      expect(result.significant_event_handover_rate).toBe(100);
      expect(result.care_event_verification_rate).toBe(100);
    });

    it("single notification only", () => {
      const result = computeInformationFlowQuality(baseInput({ notifications: [makeNotification({ id: "n-1", priority: "urgent", read: true })] }));
      expect(result.notification_read_rate).toBe(100);
      expect(result.urgent_notification_read_rate).toBe(100);
    });

    it("score stays >= 0", () => {
      const result = computeInformationFlowQuality(baseInput({
        total_staff: 100, total_children: 20,
        handovers: Array.from({ length: 10 }, (_, i) => makeHandover({ id: `h-${i}`, completed: false, has_content: false, handed_over_by: `s-${i}`, received_by: `r-${i}` })),
        daily_logs: [makeDailyLog({ id: "dl-1", child_id: "child-1", word_count: 10 })],
        care_events: Array.from({ length: 10 }, (_, i) => makeCareEvent({ id: `ce-${i}`, is_significant: true, has_handover_note: false, is_verified: false, staff_id: `se-${i}` })),
        notifications: Array.from({ length: 10 }, (_, i) => makeNotification({ id: `n-${i}`, priority: "urgent", read: false })),
      }));
      expect(result.flow_score).toBeGreaterThanOrEqual(0);
    });

    it("score stays <= 100", () => {
      const result = computeInformationFlowQuality(baseInput({
        total_staff: 5, total_children: 6,
        handovers: Array.from({ length: 100 }, (_, i) => makeHandover({ id: `h-${i}`, completed: true, has_content: true, handed_over_by: `s-${i}`, received_by: `r-${i}` })),
        daily_logs: Array.from({ length: 6 }, (_, i) => makeDailyLog({ id: `dl-${i}`, child_id: `child-${i + 1}`, word_count: 200, staff_id: `sl-${i}` })),
        care_events: Array.from({ length: 20 }, (_, i) => makeCareEvent({ id: `ce-${i}`, is_significant: true, has_handover_note: true, is_verified: true, staff_id: `se-${i}` })),
        notifications: Array.from({ length: 20 }, (_, i) => makeNotification({ id: `n-${i}`, priority: i < 10 ? "urgent" : "normal", read: true })),
      }));
      expect(result.flow_score).toBeLessThanOrEqual(100);
    });

    it("large dataset processes without error", () => {
      const result = computeInformationFlowQuality(baseInput({
        total_staff: 50, total_children: 50,
        handovers: Array.from({ length: 200 }, (_, i) => makeHandover({ id: `h-${i}`, completed: i % 3 !== 0, has_content: i % 2 === 0, handed_over_by: `s-${i}`, received_by: `r-${i}` })),
        daily_logs: Array.from({ length: 500 }, (_, i) => makeDailyLog({ id: `dl-${i}`, child_id: `child-${(i % 50) + 1}`, word_count: i % 3 === 0 ? 100 : 20, staff_id: `sl-${i % 30}` })),
        care_events: Array.from({ length: 300 }, (_, i) => makeCareEvent({ id: `ce-${i}`, is_significant: i % 5 === 0, has_handover_note: i % 7 === 0, is_verified: i % 4 !== 0, staff_id: `se-${i % 40}` })),
        notifications: Array.from({ length: 400 }, (_, i) => makeNotification({ id: `n-${i}`, priority: i % 10 === 0 ? "urgent" : "normal", read: i % 3 !== 0 })),
      }));
      expect(result.flow_score).toBeGreaterThanOrEqual(0);
      expect(result.flow_score).toBeLessThanOrEqual(100);
    });

    it("duplicate child_ids count as one for coverage", () => {
      const result = computeInformationFlowQuality(baseInput({
        total_children: 6,
        daily_logs: [makeDailyLog({ id: "dl-1", child_id: "child-1" }), makeDailyLog({ id: "dl-2", child_id: "child-1" }), makeDailyLog({ id: "dl-3", child_id: "child-1" })],
      }));
      expect(result.daily_log_coverage_rate).toBe(17);
    });

    it("same staff across sources counted once", () => {
      const result = computeInformationFlowQuality(baseInput({
        total_staff: 5,
        handovers: [makeHandover({ id: "h-1", handed_over_by: "s1", received_by: "s2" })],
        daily_logs: [makeDailyLog({ id: "dl-1", child_id: "child-1", staff_id: "s1" })],
        care_events: [makeCareEvent({ id: "ce-1", staff_id: "s2" })],
      }));
      expect(result.staff_engagement_rate).toBe(40);
    });

    it("total_children=0 with data no division error", () => {
      const result = computeInformationFlowQuality(baseInput({
        total_children: 0, daily_logs: [makeDailyLog({ id: "dl-1", child_id: "child-1" })], handovers: [makeHandover({ id: "h-1" })],
      }));
      expect(result.daily_log_coverage_rate).toBe(0);
    });

    it("total_staff=0 with data no division error", () => {
      const result = computeInformationFlowQuality(baseInput({
        total_staff: 0, total_children: 0, handovers: [makeHandover({ id: "h-1" })],
      }));
      expect(result.staff_engagement_rate).toBe(0);
    });

    it("high priority counts as urgent", () => {
      const result = computeInformationFlowQuality(baseInput({
        notifications: [makeNotification({ id: "n-1", priority: "high", read: true }), makeNotification({ id: "n-2", priority: "high", read: false })],
      }));
      expect(result.urgent_notification_read_rate).toBe(50);
    });

    it("empty handovers gives 0% rates", () => {
      const result = computeInformationFlowQuality(baseInput({ handovers: [], daily_logs: [makeDailyLog({ id: "dl-1", child_id: "child-1" })] }));
      expect(result.handover_completion_rate).toBe(0);
      expect(result.handover_content_rate).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 14. COMBINED REALISTIC SCENARIOS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("combined realistic scenarios", () => {
    it("realistic outstanding home", () => {
      const result = computeInformationFlowQuality({
        today: "2025-03-15", total_staff: 8, total_children: 6,
        handovers: Array.from({ length: 14 }, (_, i) => makeHandover({ id: `h-${i}`, completed: true, has_content: i < 13, handed_over_by: `staff-${(i % 8) + 1}`, received_by: `staff-${((i + 1) % 8) + 1}` })),
        daily_logs: Array.from({ length: 42 }, (_, i) => makeDailyLog({ id: `dl-${i}`, child_id: `child-${(i % 6) + 1}`, staff_id: `staff-${(i % 8) + 1}`, word_count: i < 38 ? 80 : 30 })),
        care_events: Array.from({ length: 8 }, (_, i) => makeCareEvent({ id: `ce-${i}`, staff_id: `staff-${(i % 8) + 1}`, is_significant: i < 4, has_handover_note: i < 4, is_verified: true })),
        notifications: Array.from({ length: 20 }, (_, i) => makeNotification({ id: `n-${i}`, priority: i < 4 ? "urgent" : i < 8 ? "high" : "normal", read: i < 19 })),
      });
      expect(result.flow_rating).toBe("outstanding");
      expect(result.strengths.length).toBeGreaterThan(0);
    });

    it("realistic inadequate home", () => {
      const result = computeInformationFlowQuality({
        today: "2025-03-15", total_staff: 10, total_children: 6,
        handovers: Array.from({ length: 8 }, (_, i) => makeHandover({ id: `h-${i}`, completed: i < 3, has_content: i < 2, handed_over_by: `staff-${(i % 4) + 1}`, received_by: `staff-${((i + 1) % 4) + 1}` })),
        daily_logs: Array.from({ length: 4 }, (_, i) => makeDailyLog({ id: `dl-${i}`, child_id: `child-${(i % 2) + 1}`, staff_id: `staff-${(i % 4) + 1}`, word_count: i < 1 ? 60 : 15 })),
        care_events: Array.from({ length: 6 }, (_, i) => makeCareEvent({ id: `ce-${i}`, staff_id: `staff-${(i % 4) + 1}`, is_significant: i < 4, has_handover_note: i < 1, is_verified: i < 2 })),
        notifications: Array.from({ length: 10 }, (_, i) => makeNotification({ id: `n-${i}`, priority: i < 4 ? "urgent" : "normal", read: i < 4 })),
      });
      expect(result.flow_rating).toBe("inadequate");
      expect(result.concerns.length).toBeGreaterThan(0);
    });

    it("all notification priorities handled", () => {
      const result = computeInformationFlowQuality(baseInput({
        notifications: [
          makeNotification({ id: "n-1", priority: "urgent", read: true }),
          makeNotification({ id: "n-2", priority: "high", read: true }),
          makeNotification({ id: "n-3", priority: "normal", read: true }),
          makeNotification({ id: "n-4", priority: "low", read: false }),
        ],
        handovers: [makeHandover({ id: "h-1" })],
      }));
      expect(result.notification_read_rate).toBe(75);
      expect(result.urgent_notification_read_rate).toBe(100);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 15. RETURN SHAPE VALIDATION
  // ═══════════════════════════════════════════════════════════════════════════

  describe("return shape validation", () => {
    it("returns all expected fields", () => {
      const result = computeInformationFlowQuality(baseInput({
        handovers: [makeHandover({ id: "h-1" })],
        daily_logs: [makeDailyLog({ id: "dl-1", child_id: "child-1" })],
        care_events: [makeCareEvent({ id: "ce-1" })],
        notifications: [makeNotification({ id: "n-1" })],
      }));
      expect(result).toHaveProperty("flow_rating");
      expect(result).toHaveProperty("flow_score");
      expect(result).toHaveProperty("headline");
      expect(result).toHaveProperty("handover_completion_rate");
      expect(result).toHaveProperty("handover_content_rate");
      expect(result).toHaveProperty("daily_log_coverage_rate");
      expect(result).toHaveProperty("daily_log_quality_rate");
      expect(result).toHaveProperty("significant_event_handover_rate");
      expect(result).toHaveProperty("care_event_verification_rate");
      expect(result).toHaveProperty("notification_read_rate");
      expect(result).toHaveProperty("urgent_notification_read_rate");
      expect(result).toHaveProperty("information_continuity_score");
      expect(result).toHaveProperty("staff_engagement_rate");
      expect(result).toHaveProperty("strengths");
      expect(result).toHaveProperty("concerns");
      expect(result).toHaveProperty("recommendations");
      expect(result).toHaveProperty("insights");
    });

    it("all rate fields are numbers", () => {
      const result = computeInformationFlowQuality(baseInput({ handovers: [makeHandover({ id: "h-1" })] }));
      expect(typeof result.handover_completion_rate).toBe("number");
      expect(typeof result.handover_content_rate).toBe("number");
      expect(typeof result.daily_log_coverage_rate).toBe("number");
      expect(typeof result.daily_log_quality_rate).toBe("number");
      expect(typeof result.significant_event_handover_rate).toBe("number");
      expect(typeof result.care_event_verification_rate).toBe("number");
      expect(typeof result.notification_read_rate).toBe("number");
      expect(typeof result.urgent_notification_read_rate).toBe("number");
      expect(typeof result.information_continuity_score).toBe("number");
      expect(typeof result.staff_engagement_rate).toBe("number");
    });

    it("arrays are arrays", () => {
      const result = computeInformationFlowQuality(baseInput({ handovers: [makeHandover({ id: "h-1" })] }));
      expect(Array.isArray(result.strengths)).toBe(true);
      expect(Array.isArray(result.concerns)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(Array.isArray(result.insights)).toBe(true);
    });

    it("recommendation items have correct shape", () => {
      const result = computeInformationFlowQuality(baseInput({ handovers: [makeHandover({ id: "h-1", completed: false })] }));
      const rec = result.recommendations[0];
      expect(rec).toBeDefined();
      expect(typeof rec.rank).toBe("number");
      expect(typeof rec.recommendation).toBe("string");
      expect(["immediate", "soon", "planned"]).toContain(rec.urgency);
    });

    it("insight items have correct shape", () => {
      const result = computeInformationFlowQuality(baseInput({
        handovers: Array.from({ length: 10 }, (_, i) => makeHandover({ id: `h-${i}`, completed: i < 3, handed_over_by: `s-${i}`, received_by: `r-${i}` })),
      }));
      const insight = result.insights.find(i => i.severity === "critical");
      expect(insight).toBeDefined();
      expect(typeof insight!.text).toBe("string");
    });

    it("flow_rating is valid", () => {
      const result = computeInformationFlowQuality(baseInput({ handovers: [makeHandover({ id: "h-1" })] }));
      expect(["outstanding", "good", "adequate", "inadequate", "insufficient_data"]).toContain(result.flow_rating);
    });

    it("flow_score is integer", () => {
      const result = computeInformationFlowQuality(baseInput({ handovers: [makeHandover({ id: "h-1" })] }));
      expect(Number.isInteger(result.flow_score)).toBe(true);
    });

    it("headline is non-empty string", () => {
      const result = computeInformationFlowQuality(baseInput({ handovers: [makeHandover({ id: "h-1" })] }));
      expect(result.headline.length).toBeGreaterThan(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 16. BOUNDARY TESTS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("boundary tests", () => {
    it("handoverCompletion exactly 80 gives +2", () => {
      const result = computeInformationFlowQuality(baseInput({
        total_staff: 50,
        handovers: Array.from({ length: 5 }, (_, i) => makeHandover({ id: `h-${i}`, completed: i < 4, has_content: false, handed_over_by: `s-${i}`, received_by: `r-${i}` })),
      }));
      expect(result.handover_completion_rate).toBe(80);
    });

    it("handoverContent exactly 70 gives +1", () => {
      const result = computeInformationFlowQuality(baseInput({
        total_staff: 50,
        handovers: Array.from({ length: 10 }, (_, i) => makeHandover({ id: `h-${i}`, has_content: i < 7, completed: i < 5, handed_over_by: `s-${i}`, received_by: `r-${i}` })),
      }));
      expect(result.handover_content_rate).toBe(70);
    });

    it("dailyLogCoverage exactly 40 avoids penalty", () => {
      const result = computeInformationFlowQuality(baseInput({
        total_children: 10,
        daily_logs: Array.from({ length: 4 }, (_, i) => makeDailyLog({ id: `dl-${i}`, child_id: `child-${i + 1}`, word_count: 10, staff_id: `sl-${i}` })),
      }));
      expect(result.daily_log_coverage_rate).toBe(40);
    });

    it("dailyLogQuality exactly 60 gives +1", () => {
      const result = computeInformationFlowQuality(baseInput({
        daily_logs: Array.from({ length: 5 }, (_, i) => makeDailyLog({ id: `dl-${i}`, child_id: `child-${(i % 3) + 1}`, word_count: i < 3 ? 50 : 10, staff_id: `sl-${i}` })),
      }));
      expect(result.daily_log_quality_rate).toBe(60);
    });

    it("sigEventHandover exactly 50 avoids penalty", () => {
      const result = computeInformationFlowQuality(baseInput({
        care_events: [
          makeCareEvent({ id: "ce-1", is_significant: true, has_handover_note: true, staff_id: "s1" }),
          makeCareEvent({ id: "ce-2", is_significant: true, has_handover_note: false, staff_id: "s2" }),
        ],
        handovers: [makeHandover({ id: "h-1" })],
      }));
      expect(result.significant_event_handover_rate).toBe(50);
    });

    it("careEventVerification exactly 75 gives +1", () => {
      const result = computeInformationFlowQuality(baseInput({
        care_events: Array.from({ length: 4 }, (_, i) => makeCareEvent({ id: `ce-${i}`, is_verified: i < 3, staff_id: `s-${i}` })),
      }));
      expect(result.care_event_verification_rate).toBe(75);
    });

    it("notifRead exactly 70 gives +1", () => {
      const result = computeInformationFlowQuality(baseInput({
        notifications: Array.from({ length: 10 }, (_, i) => makeNotification({ id: `n-${i}`, read: i < 7 })),
      }));
      expect(result.notification_read_rate).toBe(70);
    });

    it("urgentNotifRead exactly 70 avoids penalty", () => {
      const result = computeInformationFlowQuality(baseInput({
        notifications: Array.from({ length: 10 }, (_, i) => makeNotification({ id: `n-${i}`, priority: "urgent", read: i < 7 })),
      }));
      expect(result.urgent_notification_read_rate).toBe(70);
    });

    it("staffEngagement exactly 50 gives +1", () => {
      const result = computeInformationFlowQuality(baseInput({
        total_staff: 10,
        handovers: [
          makeHandover({ id: "h-1", handed_over_by: "s1", received_by: "s2", completed: true, has_content: false }),
          makeHandover({ id: "h-2", handed_over_by: "s3", received_by: "s4", completed: false, has_content: false }),
        ],
        daily_logs: [makeDailyLog({ id: "dl-1", child_id: "child-1", staff_id: "s5", word_count: 10 }), makeDailyLog({ id: "dl-2", child_id: "child-2", staff_id: "s1", word_count: 10 }), makeDailyLog({ id: "dl-3", child_id: "child-3", staff_id: "s2", word_count: 10 })],
      }));
      expect(result.staff_engagement_rate).toBe(50);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 17. CONTINUITY SCORE
  // ═══════════════════════════════════════════════════════════════════════════

  describe("continuity score", () => {
    it("all 100 gives 100", () => {
      const result = computeInformationFlowQuality(baseInput({
        total_children: 6,
        handovers: [makeHandover({ id: "h-1", completed: true })],
        daily_logs: Array.from({ length: 6 }, (_, i) => makeDailyLog({ id: `dl-${i}`, child_id: `child-${i + 1}` })),
        care_events: [makeCareEvent({ id: "ce-1", is_verified: true })],
        notifications: [makeNotification({ id: "n-1", read: true })],
      }));
      expect(result.information_continuity_score).toBe(100);
    });

    it("all 0 gives 0", () => {
      const result = computeInformationFlowQuality(baseInput({
        handovers: [makeHandover({ id: "h-1", completed: false })],
      }));
      expect(result.information_continuity_score).toBe(0);
    });

    it("rounds correctly", () => {
      const result = computeInformationFlowQuality(baseInput({
        total_children: 6,
        handovers: [makeHandover({ id: "h-1", completed: true })],
        daily_logs: [makeDailyLog({ id: "dl-1", child_id: "child-1" }), makeDailyLog({ id: "dl-2", child_id: "child-2" }), makeDailyLog({ id: "dl-3", child_id: "child-3" })],
        care_events: [makeCareEvent({ id: "ce-1", is_verified: true }), makeCareEvent({ id: "ce-2", is_verified: false, staff_id: "s2" }), makeCareEvent({ id: "ce-3", is_verified: false, staff_id: "s3" })],
        notifications: [makeNotification({ id: "n-1", read: true }), makeNotification({ id: "n-2", read: true }), makeNotification({ id: "n-3", read: false }), makeNotification({ id: "n-4", read: true })],
      }));
      // (100+50+33+75)/4 = 64.5 => 65
      expect(result.information_continuity_score).toBe(65);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 18. MIXED PRIORITY NOTIFICATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("mixed priority notifications", () => {
    it("only urgent+high count toward urgent rate", () => {
      const result = computeInformationFlowQuality(baseInput({
        notifications: [
          makeNotification({ id: "n-1", priority: "urgent", read: true }),
          makeNotification({ id: "n-2", priority: "high", read: false }),
          makeNotification({ id: "n-3", priority: "normal", read: true }),
          makeNotification({ id: "n-4", priority: "low", read: true }),
          makeNotification({ id: "n-5", priority: "normal", read: false }),
        ],
        handovers: [makeHandover({ id: "h-1" })],
      }));
      expect(result.notification_read_rate).toBe(60);
      expect(result.urgent_notification_read_rate).toBe(50);
    });

    it("all urgent read, some normal unread", () => {
      const result = computeInformationFlowQuality(baseInput({
        notifications: [
          makeNotification({ id: "n-1", priority: "urgent", read: true }),
          makeNotification({ id: "n-2", priority: "high", read: true }),
          makeNotification({ id: "n-3", priority: "normal", read: false }),
          makeNotification({ id: "n-4", priority: "normal", read: false }),
        ],
        handovers: [makeHandover({ id: "h-1" })],
      }));
      expect(result.urgent_notification_read_rate).toBe(100);
      expect(result.notification_read_rate).toBe(50);
    });

    it("no urgent means urgentRate 0", () => {
      const result = computeInformationFlowQuality(baseInput({
        notifications: [makeNotification({ id: "n-1", priority: "normal", read: true }), makeNotification({ id: "n-2", priority: "low", read: true })],
        handovers: [makeHandover({ id: "h-1" })],
      }));
      expect(result.urgent_notification_read_rate).toBe(0);
      expect(result.notification_read_rate).toBe(100);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 19. UNUSED FIELDS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("unused fields", () => {
    it("shift_type does not affect metrics", () => {
      const result = computeInformationFlowQuality(baseInput({
        handovers: [
          makeHandover({ id: "h-1", shift_type: "day", completed: true }),
          makeHandover({ id: "h-2", shift_type: "night", completed: true, handed_over_by: "s3", received_by: "s4" }),
          makeHandover({ id: "h-3", shift_type: "late", completed: false, handed_over_by: "s5", received_by: "s6" }),
          makeHandover({ id: "h-4", shift_type: "early", completed: false, handed_over_by: "s7", received_by: "s8" }),
        ],
      }));
      expect(result.handover_completion_rate).toBe(50);
    });

    it("entity_type does not affect metrics", () => {
      const result = computeInformationFlowQuality(baseInput({
        notifications: [
          makeNotification({ id: "n-1", entity_type: "handover", read: true }),
          makeNotification({ id: "n-2", entity_type: "daily_log", read: false }),
          makeNotification({ id: "n-3", entity_type: null, read: true }),
        ],
      }));
      expect(result.notification_read_rate).toBe(67);
    });

    it("category does not affect metrics", () => {
      const result = computeInformationFlowQuality(baseInput({
        care_events: [
          makeCareEvent({ id: "ce-1", category: "health", is_verified: true }),
          makeCareEvent({ id: "ce-2", category: "behaviour", is_verified: false, staff_id: "s2" }),
        ],
      }));
      expect(result.care_event_verification_rate).toBe(50);
    });

    it("has_mood_rating and has_incident_reference do not affect quality", () => {
      const result = computeInformationFlowQuality(baseInput({
        daily_logs: [
          makeDailyLog({ id: "dl-1", child_id: "child-1", word_count: 49, has_mood_rating: true, has_incident_reference: true }),
          makeDailyLog({ id: "dl-2", child_id: "child-2", word_count: 50, has_mood_rating: false, has_incident_reference: false }),
        ],
      }));
      expect(result.daily_log_quality_rate).toBe(50);
    });

    it("categories_count does not affect quality", () => {
      const result = computeInformationFlowQuality(baseInput({
        daily_logs: [
          makeDailyLog({ id: "dl-1", child_id: "child-1", word_count: 30, categories_count: 10 }),
          makeDailyLog({ id: "dl-2", child_id: "child-2", word_count: 100, categories_count: 0 }),
        ],
      }));
      expect(result.daily_log_quality_rate).toBe(50);
    });

    it("items_count does not affect metrics", () => {
      const result = computeInformationFlowQuality(baseInput({
        handovers: [
          makeHandover({ id: "h-1", items_count: 0, completed: true, has_content: true }),
          makeHandover({ id: "h-2", items_count: 100, completed: false, has_content: false, handed_over_by: "s3", received_by: "s4" }),
        ],
      }));
      expect(result.handover_completion_rate).toBe(50);
    });

    it("has_follow_up does not affect metrics", () => {
      const result = computeInformationFlowQuality(baseInput({
        care_events: [
          makeCareEvent({ id: "ce-1", has_follow_up: true, is_verified: true }),
          makeCareEvent({ id: "ce-2", has_follow_up: false, is_verified: false, staff_id: "s2" }),
        ],
      }));
      expect(result.care_event_verification_rate).toBe(50);
    });

    it("today field does not affect computation", () => {
      const r1 = computeInformationFlowQuality(baseInput({ today: "2025-01-01", handovers: [makeHandover({ id: "h-1" })] }));
      const r2 = computeInformationFlowQuality(baseInput({ today: "2025-12-31", handovers: [makeHandover({ id: "h-1" })] }));
      expect(r1.flow_score).toBe(r2.flow_score);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 20. TEXT CORRECTNESS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("text includes correct percentages", () => {
    it("strong flow insight includes rates", () => {
      const result = computeInformationFlowQuality(baseInput({
        total_staff: 10, total_children: 6,
        handovers: Array.from({ length: 20 }, (_, i) => makeHandover({ id: `h-${i}`, completed: true, has_content: true, handed_over_by: `s-${i}`, received_by: `r-${i}` })),
        daily_logs: Array.from({ length: 6 }, (_, i) => makeDailyLog({ id: `dl-${i}`, child_id: `child-${i + 1}`, staff_id: `sl-${i}` })),
        notifications: Array.from({ length: 10 }, (_, i) => makeNotification({ id: `n-${i}`, read: true })),
      }));
      const insight = result.insights.find(i => i.text.includes("Information flows strongly"));
      expect(insight!.text).toContain("100% handover completion");
      expect(insight!.text).toContain("100% daily log coverage");
    });

    it("urgent unread insight includes percentage", () => {
      const result = computeInformationFlowQuality(baseInput({
        notifications: Array.from({ length: 10 }, (_, i) => makeNotification({ id: `n-${i}`, priority: "urgent", read: i < 4 })),
        handovers: [makeHandover({ id: "h-1" })],
      }));
      const insight = result.insights.find(i => i.text.includes("notifications are unread"));
      expect(insight!.text).toContain("60%");
    });

    it("handover completion concern includes rate", () => {
      const result = computeInformationFlowQuality(baseInput({
        handovers: Array.from({ length: 10 }, (_, i) => makeHandover({ id: `h-${i}`, completed: i < 3, handed_over_by: `s-${i}`, received_by: `r-${i}` })),
      }));
      expect(result.concerns.find(c => c.includes("handovers completed"))).toContain("30%");
    });

    it("handover completion strength includes rate", () => {
      const result = computeInformationFlowQuality(baseInput({
        handovers: Array.from({ length: 20 }, (_, i) => makeHandover({ id: `h-${i}`, completed: i < 19, handed_over_by: `s-${i}`, received_by: `r-${i}` })),
      }));
      expect(result.strengths.find(s => s.includes("handover completion"))).toContain("95%");
    });

    it("staff engagement concern includes rate", () => {
      const result = computeInformationFlowQuality(baseInput({ total_staff: 10, handovers: [makeHandover({ id: "h-1" })] }));
      expect(result.concerns.find(c => c.includes("most of the team"))).toContain("20%");
    });

    it("staff engagement strength includes rate", () => {
      const result = computeInformationFlowQuality(baseInput({
        total_staff: 5,
        handovers: [makeHandover({ id: "h-1", handed_over_by: "s1", received_by: "s2" }), makeHandover({ id: "h-2", handed_over_by: "s3", received_by: "s4" })],
      }));
      expect(result.strengths.find(s => s.includes("staff engagement"))).toContain("80%");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 21. EMPTY RESULT HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("empty result helpers", () => {
    it("insufficient_data recommendation text", () => {
      const result = computeInformationFlowQuality(baseInput({ total_staff: 0, total_children: 0 }));
      expect(result.recommendations[0].recommendation).toContain("Begin recording");
    });

    it("inadequate first recommendation text", () => {
      const result = computeInformationFlowQuality(baseInput({ total_children: 3, total_staff: 5 }));
      expect(result.recommendations[0].recommendation).toContain("Immediately establish handover recording");
    });

    it("inadequate second recommendation text", () => {
      const result = computeInformationFlowQuality(baseInput({ total_children: 3, total_staff: 5 }));
      expect(result.recommendations[1].recommendation).toContain("Implement daily log recording");
    });

    it("insufficient_data insight mentions baseline", () => {
      const result = computeInformationFlowQuality(baseInput({ total_staff: 0, total_children: 0 }));
      expect(result.insights[0].text).toContain("baseline data");
    });

    it("inadequate insight mentions total communication failure", () => {
      const result = computeInformationFlowQuality(baseInput({ total_children: 5 }));
      expect(result.insights[0].text).toContain("total communication failure");
    });

    it("inadequate with many children still gives score 15", () => {
      const result = computeInformationFlowQuality(baseInput({ total_children: 100, total_staff: 50 }));
      expect(result.flow_score).toBe(15);
      expect(result.flow_rating).toBe("inadequate");
    });

    it("insufficient_data with 0 staff and 0 children gives score 0", () => {
      const result = computeInformationFlowQuality(baseInput({ total_staff: 0, total_children: 0 }));
      expect(result.flow_score).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 22. SCORING SINGLE SOURCES
  // ═══════════════════════════════════════════════════════════════════════════

  describe("scoring with single data source", () => {
    it("only handovers", () => {
      const result = computeInformationFlowQuality(baseInput({
        total_staff: 10, total_children: 6,
        handovers: Array.from({ length: 20 }, (_, i) => makeHandover({ id: `h-${i}`, completed: true, has_content: true, handed_over_by: `s-${i}`, received_by: `r-${i}` })),
      }));
      // +4(comp) +3(content) -3(coverage<40) -5(sigEvent) -5(urgentNotif) +2(staff)
      expect(result.flow_score).toBe(48);
    });

    it("only notifications", () => {
      const result = computeInformationFlowQuality(baseInput({
        total_staff: 50, total_children: 6,
        notifications: Array.from({ length: 10 }, (_, i) => makeNotification({ id: `n-${i}`, priority: i < 5 ? "urgent" : "normal", read: true })),
      }));
      // +3(notifRead) +2(urgentNotifRead) -5(handoverComp) -3(coverage) -5(sigEvent)
      expect(result.flow_score).toBe(44);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 23. STRENGTH AND CONCERN COUNTS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("strength and concern counts", () => {
    it("outstanding generates many strengths and no concerns", () => {
      const result = computeInformationFlowQuality(baseInput({
        total_staff: 10, total_children: 6,
        handovers: Array.from({ length: 20 }, (_, i) => makeHandover({ id: `h-${i}`, completed: true, has_content: true, handed_over_by: `s-${i}`, received_by: `r-${i}` })),
        daily_logs: Array.from({ length: 6 }, (_, i) => makeDailyLog({ id: `dl-${i}`, child_id: `child-${i + 1}`, word_count: 100, staff_id: `sl-${i}` })),
        care_events: Array.from({ length: 10 }, (_, i) => makeCareEvent({ id: `ce-${i}`, is_significant: true, has_handover_note: true, is_verified: true, staff_id: `se-${i}` })),
        notifications: Array.from({ length: 10 }, (_, i) => makeNotification({ id: `n-${i}`, priority: i < 5 ? "urgent" : "normal", read: true })),
      }));
      expect(result.strengths.length).toBeGreaterThanOrEqual(8);
      expect(result.concerns.length).toBe(0);
    });

    it("worst case generates many concerns and no strengths", () => {
      const result = computeInformationFlowQuality({
        today: "2025-03-15", total_staff: 50, total_children: 10,
        handovers: Array.from({ length: 10 }, (_, i) => makeHandover({ id: `h-${i}`, completed: i < 2, has_content: i < 2, handed_over_by: `s-${i}`, received_by: `r-${i}` })),
        daily_logs: Array.from({ length: 4 }, (_, i) => makeDailyLog({ id: `dl-${i}`, child_id: `child-${(i % 2) + 1}`, word_count: 10, staff_id: `sl-${i}` })),
        care_events: Array.from({ length: 10 }, (_, i) => makeCareEvent({ id: `ce-${i}`, is_significant: i < 6, has_handover_note: i < 1, is_verified: i < 3, staff_id: `se-${i}` })),
        notifications: Array.from({ length: 20 }, (_, i) => makeNotification({ id: `n-${i}`, priority: i < 8 ? "urgent" : "normal", read: i < 6 })),
      });
      expect(result.strengths.length).toBe(0);
      expect(result.concerns.length).toBeGreaterThanOrEqual(5);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 24. MISC ADDITIONAL
  // ═══════════════════════════════════════════════════════════════════════════

  describe("miscellaneous additional", () => {
    it("100 logs for same child counts as one", () => {
      const result = computeInformationFlowQuality(baseInput({
        total_children: 6,
        daily_logs: Array.from({ length: 100 }, (_, i) => makeDailyLog({ id: `dl-${i}`, child_id: "child-1", word_count: 100, staff_id: `sl-${i}` })),
      }));
      expect(result.daily_log_coverage_rate).toBe(17);
    });

    it("non-significant event with handover note does not affect sig rate", () => {
      const result = computeInformationFlowQuality(baseInput({
        care_events: [
          makeCareEvent({ id: "ce-1", is_significant: false, has_handover_note: true }),
          makeCareEvent({ id: "ce-2", is_significant: true, has_handover_note: false, staff_id: "s2" }),
        ],
      }));
      expect(result.significant_event_handover_rate).toBe(0);
    });

    it("urgent_items_count does not affect metrics", () => {
      const result = computeInformationFlowQuality(baseInput({
        handovers: [makeHandover({ id: "h-1", urgent_items_count: 50, completed: true })],
      }));
      expect(result.handover_completion_rate).toBe(100);
    });

    it("both recommendations for inadequate empty result have immediate urgency", () => {
      const result = computeInformationFlowQuality(baseInput({ total_children: 3, total_staff: 5 }));
      expect(result.recommendations[0].urgency).toBe("immediate");
      expect(result.recommendations[1].urgency).toBe("immediate");
    });

    it("created_at does not affect computation", () => {
      const result = computeInformationFlowQuality(baseInput({
        handovers: [
          makeHandover({ id: "h-1", created_at: "2025-01-01T00:00:00Z", completed: true }),
          makeHandover({ id: "h-2", created_at: "2025-12-31T23:59:59Z", completed: true, handed_over_by: "s3", received_by: "s4" }),
        ],
      }));
      expect(result.handover_completion_rate).toBe(100);
    });

    it("daily log date does not affect computation", () => {
      const result = computeInformationFlowQuality(baseInput({
        daily_logs: [
          makeDailyLog({ id: "dl-1", child_id: "child-1", date: "2025-01-01" }),
          makeDailyLog({ id: "dl-2", child_id: "child-2", date: "2025-06-15" }),
        ],
      }));
      expect(result.daily_log_coverage_rate).toBe(33);
    });

    it("care event date does not affect computation", () => {
      const result = computeInformationFlowQuality(baseInput({
        care_events: [
          makeCareEvent({ id: "ce-1", date: "2025-01-01", is_verified: true }),
          makeCareEvent({ id: "ce-2", date: "2025-12-31", is_verified: false, staff_id: "s2" }),
        ],
      }));
      expect(result.care_event_verification_rate).toBe(50);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 25. PENALTY-BONUS INTERACTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("penalty-bonus interactions", () => {
    it("handover completion bonus at 80% and no handover penalty", () => {
      const result = computeInformationFlowQuality(baseInput({
        total_staff: 100,
        total_children: 6,
        handovers: Array.from({ length: 10 }, (_, i) =>
          makeHandover({ id: `h-${i}`, completed: i < 8, has_content: false, handed_over_by: `sh-${i}`, received_by: `sr-${i}` }),
        ),
        daily_logs: Array.from({ length: 6 }, (_, i) =>
          makeDailyLog({ id: `dl-${i}`, child_id: `child-${i + 1}`, word_count: 10, staff_id: `sdl-${i}` }),
        ),
        care_events: [
          makeCareEvent({ id: "ce-1", is_significant: true, has_handover_note: true, staff_id: "sce-1" }),
          makeCareEvent({ id: "ce-2", is_significant: true, has_handover_note: true, staff_id: "sce-2" }),
        ],
        notifications: Array.from({ length: 10 }, (_, i) =>
          makeNotification({ id: `n-${i}`, priority: "urgent", read: i < 7 }),
        ),
      }));
      expect(result.handover_completion_rate).toBe(80);
      // 80% handover triggers +2 bonus, no handover penalty
      // dailyLogCoverage=100% -> +4, sigEvent=100% -> +4, notifRead=70% -> +1, urgentNotif=70% -> no penalty
      // Score should be well above 52
      expect(result.flow_score).toBeGreaterThan(52);
    });

    it("handover completion at 49% triggers penalty not bonus", () => {
      const result = computeInformationFlowQuality(baseInput({
        total_staff: 100,
        handovers: Array.from({ length: 100 }, (_, i) =>
          makeHandover({ id: `h-${i}`, completed: i < 49, has_content: false, handed_over_by: `sh-${i}`, received_by: `sr-${i}` }),
        ),
      }));
      expect(result.handover_completion_rate).toBe(49);
      expect(result.flow_score).toBeLessThan(52);
    });

    it("penalty does not push score below 0", () => {
      const result = computeInformationFlowQuality(baseInput({
        total_staff: 0,
        total_children: 0,
        handovers: [makeHandover({ id: "h-1", completed: false, has_content: false })],
      }));
      expect(result.flow_score).toBeGreaterThanOrEqual(0);
    });

    it("bonuses do not push score above 100", () => {
      // This is practically impossible to hit but clamp protects it
      const result = computeInformationFlowQuality(baseInput({
        total_staff: 8,
        handovers: Array.from({ length: 14 }, (_, i) => makeHandover({ id: `h-${i}`, completed: true, has_content: true, handed_over_by: `s-${(i % 8) + 1}`, received_by: `s-${((i + 1) % 8) + 1}` })),
        daily_logs: Array.from({ length: 42 }, (_, i) => makeDailyLog({ id: `dl-${i}`, child_id: `child-${(i % 6) + 1}`, staff_id: `s-${(i % 8) + 1}`, word_count: 200 })),
        care_events: Array.from({ length: 10 }, (_, i) => makeCareEvent({ id: `ce-${i}`, staff_id: `s-${(i % 8) + 1}`, is_significant: true, has_handover_note: true, is_verified: true })),
        notifications: Array.from({ length: 20 }, (_, i) => makeNotification({ id: `n-${i}`, priority: i < 10 ? "urgent" : "normal", read: true })),
      }));
      expect(result.flow_score).toBeLessThanOrEqual(100);
    });

    it("simultaneous high handover bonus and low log penalty", () => {
      const result = computeInformationFlowQuality(baseInput({
        total_staff: 100,
        total_children: 10,
        handovers: Array.from({ length: 20 }, (_, i) =>
          makeHandover({ id: `h-${i}`, completed: true, has_content: true, handed_over_by: `sh-${i}`, received_by: `sr-${i}` }),
        ),
        daily_logs: [makeDailyLog({ id: "dl-1", child_id: "child-1", staff_id: "sdl-1" })],
        care_events: [
          makeCareEvent({ id: "ce-1", is_significant: true, has_handover_note: true, is_verified: true, staff_id: "sce-1" }),
        ],
        notifications: Array.from({ length: 10 }, (_, i) =>
          makeNotification({ id: `n-${i}`, priority: "urgent", read: i < 7 }),
        ),
      }));
      // handover 100% -> +4, content 100% -> +3, dailyLogCoverage 10% -> -3 penalty
      // sigEvent 100% -> +4, careVerif 100% -> +3, notifRead 70% -> +1
      // urgentNotifRead 70% -> no penalty, no bonus, staffEngagement low
      expect(result.handover_completion_rate).toBe(100);
      expect(result.daily_log_coverage_rate).toBe(10);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 26. INFORMATION CONTINUITY FORMULA
  // ═══════════════════════════════════════════════════════════════════════════

  describe("information continuity formula", () => {
    it("continuity is average of four rates rounded", () => {
      const result = computeInformationFlowQuality(baseInput({
        total_staff: 100,
        handovers: [makeHandover({ id: "h-1", completed: true, has_content: false }), makeHandover({ id: "h-2", completed: false, has_content: false, handed_over_by: "s3", received_by: "s4" })],
        daily_logs: [
          makeDailyLog({ id: "dl-1", child_id: "child-1", staff_id: "s5" }),
          makeDailyLog({ id: "dl-2", child_id: "child-2", staff_id: "s6" }),
        ],
        care_events: [
          makeCareEvent({ id: "ce-1", is_verified: true, staff_id: "s7" }),
          makeCareEvent({ id: "ce-2", is_verified: false, staff_id: "s8" }),
        ],
        notifications: [
          makeNotification({ id: "n-1", read: true }),
          makeNotification({ id: "n-2", read: true }),
          makeNotification({ id: "n-3", read: false }),
        ],
      }));
      // handoverCompletion=50, dailyLogCoverage=33, careEventVerif=50, notifRead=67
      // (50+33+50+67)/4 = 200/4 = 50
      expect(result.information_continuity_score).toBe(50);
    });

    it("continuity is 0 when all arrays empty but falls through special cases", () => {
      const result = computeInformationFlowQuality(baseInput({
        total_staff: 1,
        total_children: 0,
      }));
      // All rates are 0 via pct(0,0)=0
      expect(result.information_continuity_score).toBe(0);
    });

    it("continuity is 100 when all four rates are 100", () => {
      const result = computeInformationFlowQuality(baseInput({
        total_staff: 2,
        total_children: 2,
        handovers: [makeHandover({ id: "h-1", completed: true })],
        daily_logs: [
          makeDailyLog({ id: "dl-1", child_id: "child-1" }),
          makeDailyLog({ id: "dl-2", child_id: "child-2", staff_id: "s2" }),
        ],
        care_events: [makeCareEvent({ id: "ce-1", is_verified: true })],
        notifications: [makeNotification({ id: "n-1", read: true })],
      }));
      expect(result.information_continuity_score).toBe(100);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 27. STAFF ENGAGEMENT EDGE CASES
  // ═══════════════════════════════════════════════════════════════════════════

  describe("staff engagement edge cases", () => {
    it("same staff member in handover and daily log counted once", () => {
      const result = computeInformationFlowQuality(baseInput({
        total_staff: 2,
        handovers: [makeHandover({ id: "h-1", handed_over_by: "staff-A", received_by: "staff-B" })],
        daily_logs: [makeDailyLog({ id: "dl-1", child_id: "child-1", staff_id: "staff-A" })],
        care_events: [makeCareEvent({ id: "ce-1", staff_id: "staff-B" })],
      }));
      // Engaged: staff-A (handover + log), staff-B (handover + event) = 2 unique / 2 total
      expect(result.staff_engagement_rate).toBe(100);
    });

    it("staff appearing only in care events are counted", () => {
      const result = computeInformationFlowQuality(baseInput({
        total_staff: 10,
        total_children: 0,
        handovers: [],
        daily_logs: [],
        care_events: [
          makeCareEvent({ id: "ce-1", staff_id: "staff-X" }),
          makeCareEvent({ id: "ce-2", staff_id: "staff-Y" }),
        ],
      }));
      expect(result.staff_engagement_rate).toBe(20);
    });

    it("staff engagement 100% when total_staff equals engaged staff", () => {
      const result = computeInformationFlowQuality(baseInput({
        total_staff: 3,
        handovers: [makeHandover({ id: "h-1", handed_over_by: "s1", received_by: "s2" })],
        daily_logs: [makeDailyLog({ id: "dl-1", child_id: "child-1", staff_id: "s3" })],
      }));
      expect(result.staff_engagement_rate).toBe(100);
    });

    it("received_by counts as engaged even without daily logs", () => {
      const result = computeInformationFlowQuality(baseInput({
        total_staff: 2,
        total_children: 0,
        handovers: [makeHandover({ id: "h-1", handed_over_by: "s1", received_by: "s2" })],
      }));
      expect(result.staff_engagement_rate).toBe(100);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 28. RECOMMENDATION RANKING AND URGENCY
  // ═══════════════════════════════════════════════════════════════════════════

  describe("recommendation ranking and urgency", () => {
    it("recommendations are ranked sequentially starting from 1", () => {
      const result = computeInformationFlowQuality(baseInput({
        total_staff: 100,
        handovers: [makeHandover({ id: "h-1", completed: false, has_content: false })],
        daily_logs: [makeDailyLog({ id: "dl-1", child_id: "child-1", word_count: 10, staff_id: "s1" })],
        care_events: [
          makeCareEvent({ id: "ce-1", is_significant: true, has_handover_note: false, is_verified: false, staff_id: "s2" }),
        ],
        notifications: [
          makeNotification({ id: "n-1", priority: "urgent", read: false }),
        ],
      }));
      expect(result.recommendations.length).toBeGreaterThan(2);
      for (let i = 0; i < result.recommendations.length; i++) {
        expect(result.recommendations[i].rank).toBe(i + 1);
      }
    });

    it("handover recommendation comes first when handoverCompletion < 80", () => {
      const result = computeInformationFlowQuality(baseInput({
        total_staff: 100,
        handovers: [makeHandover({ id: "h-1", completed: false, has_content: false })],
        daily_logs: [makeDailyLog({ id: "dl-1", child_id: "child-1", staff_id: "s1" })],
        care_events: [
          makeCareEvent({ id: "ce-1", is_significant: true, has_handover_note: false, is_verified: false, staff_id: "s2" }),
        ],
        notifications: [
          makeNotification({ id: "n-1", priority: "urgent", read: false }),
        ],
      }));
      expect(result.recommendations[0].recommendation).toContain("handover");
      expect(result.recommendations[0].urgency).toBe("immediate");
    });

    it("all immediate recommendations have regulatory_ref", () => {
      const result = computeInformationFlowQuality(baseInput({
        total_staff: 100,
        handovers: [makeHandover({ id: "h-1", completed: false, has_content: false })],
        daily_logs: [makeDailyLog({ id: "dl-1", child_id: "child-1", word_count: 10, staff_id: "s1" })],
        care_events: [
          makeCareEvent({ id: "ce-1", is_significant: true, has_handover_note: false, is_verified: false, staff_id: "s2" }),
        ],
        notifications: [
          makeNotification({ id: "n-1", priority: "urgent", read: false }),
        ],
      }));
      const immediateRecs = result.recommendations.filter(r => r.urgency === "immediate");
      for (const rec of immediateRecs) {
        expect(rec.regulatory_ref).toBeDefined();
      }
    });

    it("no recommendations when all rates are excellent", () => {
      const result = computeInformationFlowQuality(baseInput({
        total_staff: 2,
        total_children: 2,
        handovers: [makeHandover({ id: "h-1", completed: true, has_content: true })],
        daily_logs: [
          makeDailyLog({ id: "dl-1", child_id: "child-1", word_count: 80 }),
          makeDailyLog({ id: "dl-2", child_id: "child-2", word_count: 80, staff_id: "staff-2" }),
        ],
        care_events: [makeCareEvent({ id: "ce-1", is_significant: true, has_handover_note: true, is_verified: true })],
        notifications: [makeNotification({ id: "n-1", priority: "urgent", read: true })],
      }));
      expect(result.recommendations).toHaveLength(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 29. DAILY LOG QUALITY THRESHOLDS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("daily log quality thresholds", () => {
    it("word_count exactly 50 counts as quality", () => {
      const result = computeInformationFlowQuality(baseInput({
        daily_logs: [makeDailyLog({ id: "dl-1", child_id: "child-1", word_count: 50 })],
      }));
      expect(result.daily_log_quality_rate).toBe(100);
    });

    it("word_count 49 does not count as quality", () => {
      const result = computeInformationFlowQuality(baseInput({
        daily_logs: [makeDailyLog({ id: "dl-1", child_id: "child-1", word_count: 49 })],
      }));
      expect(result.daily_log_quality_rate).toBe(0);
    });

    it("word_count 0 does not count as quality", () => {
      const result = computeInformationFlowQuality(baseInput({
        daily_logs: [makeDailyLog({ id: "dl-1", child_id: "child-1", word_count: 0 })],
      }));
      expect(result.daily_log_quality_rate).toBe(0);
    });

    it("mix of quality and non-quality logs", () => {
      const result = computeInformationFlowQuality(baseInput({
        daily_logs: [
          makeDailyLog({ id: "dl-1", child_id: "child-1", word_count: 100 }),
          makeDailyLog({ id: "dl-2", child_id: "child-2", word_count: 30, staff_id: "s2" }),
          makeDailyLog({ id: "dl-3", child_id: "child-3", word_count: 50, staff_id: "s3" }),
        ],
      }));
      // 2 quality / 3 total = 67%
      expect(result.daily_log_quality_rate).toBe(67);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 30. INSIGHT SEVERITY DISTRIBUTION
  // ═══════════════════════════════════════════════════════════════════════════

  describe("insight severity distribution", () => {
    it("outstanding scenario has positive insights", () => {
      const result = computeInformationFlowQuality(baseInput({
        total_staff: 8,
        handovers: Array.from({ length: 14 }, (_, i) => makeHandover({ id: `h-${i}`, completed: true, has_content: true, handed_over_by: `s-${(i % 8) + 1}`, received_by: `s-${((i + 1) % 8) + 1}` })),
        daily_logs: Array.from({ length: 42 }, (_, i) => makeDailyLog({ id: `dl-${i}`, child_id: `child-${(i % 6) + 1}`, staff_id: `s-${(i % 8) + 1}`, word_count: 200 })),
        care_events: Array.from({ length: 10 }, (_, i) => makeCareEvent({ id: `ce-${i}`, staff_id: `s-${(i % 8) + 1}`, is_significant: true, has_handover_note: true, is_verified: true })),
        notifications: Array.from({ length: 20 }, (_, i) => makeNotification({ id: `n-${i}`, priority: i < 10 ? "urgent" : "normal", read: true })),
      }));
      const positiveInsights = result.insights.filter(i => i.severity === "positive");
      expect(positiveInsights.length).toBeGreaterThan(0);
    });

    it("worst-case scenario has critical insights", () => {
      const result = computeInformationFlowQuality(baseInput({
        total_staff: 100,
        handovers: Array.from({ length: 10 }, (_, i) =>
          makeHandover({ id: `h-${i}`, completed: i < 2, has_content: false, handed_over_by: `sh-${i}`, received_by: `sr-${i}` }),
        ),
        daily_logs: [makeDailyLog({ id: "dl-1", child_id: "child-1", word_count: 10, staff_id: "sd-1" })],
        care_events: Array.from({ length: 10 }, (_, i) =>
          makeCareEvent({ id: `ce-${i}`, is_significant: true, has_handover_note: false, is_verified: false, staff_id: `sce-${i}` }),
        ),
        notifications: Array.from({ length: 10 }, (_, i) =>
          makeNotification({ id: `n-${i}`, priority: "urgent", read: false }),
        ),
      }));
      const criticalInsights = result.insights.filter(i => i.severity === "critical");
      expect(criticalInsights.length).toBeGreaterThan(0);
    });

    it("no critical insights when all rates are good", () => {
      const result = computeInformationFlowQuality(baseInput({
        total_staff: 2,
        total_children: 2,
        handovers: [makeHandover({ id: "h-1", completed: true, has_content: true })],
        daily_logs: [
          makeDailyLog({ id: "dl-1", child_id: "child-1", word_count: 80 }),
          makeDailyLog({ id: "dl-2", child_id: "child-2", word_count: 80, staff_id: "staff-2" }),
        ],
        care_events: [makeCareEvent({ id: "ce-1", is_verified: true })],
        notifications: [makeNotification({ id: "n-1", read: true })],
      }));
      const criticalInsights = result.insights.filter(i => i.severity === "critical");
      expect(criticalInsights).toHaveLength(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 31. HEADLINE CORRECTNESS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("headline correctness", () => {
    it("outstanding headline includes rates", () => {
      const result = computeInformationFlowQuality(baseInput({
        total_staff: 8,
        handovers: Array.from({ length: 14 }, (_, i) => makeHandover({ id: `h-${i}`, completed: true, has_content: true, handed_over_by: `s-${(i % 8) + 1}`, received_by: `s-${((i + 1) % 8) + 1}` })),
        daily_logs: Array.from({ length: 42 }, (_, i) => makeDailyLog({ id: `dl-${i}`, child_id: `child-${(i % 6) + 1}`, staff_id: `s-${(i % 8) + 1}`, word_count: 200 })),
        care_events: Array.from({ length: 10 }, (_, i) => makeCareEvent({ id: `ce-${i}`, staff_id: `s-${(i % 8) + 1}`, is_significant: true, has_handover_note: true, is_verified: true })),
        notifications: Array.from({ length: 20 }, (_, i) => makeNotification({ id: `n-${i}`, priority: i < 10 ? "urgent" : "normal", read: true })),
      }));
      expect(result.headline).toContain("Outstanding");
      expect(result.headline).toContain("100%");
    });

    it("good headline mentions minor gaps", () => {
      const result = computeInformationFlowQuality(baseInput({
        total_staff: 20,
        handovers: Array.from({ length: 10 }, (_, i) =>
          makeHandover({ id: `h-${i}`, completed: i < 9, has_content: i < 8, handed_over_by: `sh-${i}`, received_by: `sr-${i}` }),
        ),
        daily_logs: Array.from({ length: 18 }, (_, i) =>
          makeDailyLog({ id: `dl-${i}`, child_id: `child-${(i % 6) + 1}`, word_count: 60, staff_id: `sdl-${i}` }),
        ),
        care_events: Array.from({ length: 4 }, (_, i) =>
          makeCareEvent({ id: `ce-${i}`, is_significant: true, has_handover_note: true, is_verified: true, staff_id: `sce-${i}` }),
        ),
        notifications: Array.from({ length: 10 }, (_, i) =>
          makeNotification({ id: `n-${i}`, priority: "urgent", read: i < 8 }),
        ),
      }));
      expect(result.headline).toContain("Good");
    });

    it("adequate headline mentions gaps", () => {
      const result = computeInformationFlowQuality(baseInput({
        total_staff: 20,
        handovers: [
          makeHandover({ id: "h-1", completed: true, has_content: false }),
          makeHandover({ id: "h-2", completed: false, has_content: false, handed_over_by: "s3", received_by: "s4" }),
        ],
        daily_logs: [
          makeDailyLog({ id: "dl-1", child_id: "child-1", word_count: 10, staff_id: "s5" }),
          makeDailyLog({ id: "dl-2", child_id: "child-2", word_count: 10, staff_id: "s6" }),
          makeDailyLog({ id: "dl-3", child_id: "child-3", word_count: 10, staff_id: "s7" }),
        ],
        care_events: [
          makeCareEvent({ id: "ce-1", is_significant: true, has_handover_note: true, is_verified: false, staff_id: "s8" }),
          makeCareEvent({ id: "ce-2", is_significant: true, has_handover_note: false, is_verified: false, staff_id: "s9" }),
        ],
        notifications: Array.from({ length: 10 }, (_, i) =>
          makeNotification({ id: `n-${i}`, priority: "urgent", read: i < 7 }),
        ),
      }));
      expect(result.headline).toContain("Adequate");
    });

    it("inadequate headline mentions safety", () => {
      const result = computeInformationFlowQuality(baseInput({
        total_staff: 100,
        handovers: [makeHandover({ id: "h-1", completed: false, has_content: false })],
        daily_logs: [makeDailyLog({ id: "dl-1", child_id: "child-1", word_count: 10, staff_id: "s1" })],
      }));
      expect(result.headline).toContain("Inadequate");
      expect(result.headline).toContain("safety");
    });
  });
});
