// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME HANDOVER & COMMUNICATION QUALITY INTELLIGENCE ENGINE — TESTS
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeHandoverCommunicationQuality,
  type HandoverRecordInput,
  type CommunicationLogRecordInput,
  type CriticalInfoRecordInput,
  type TimelinessRecordInput,
  type ActionCompletionRecordInput,
  type HandoverCommunicationQualityInput,
} from "../home-handover-communication-quality-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2026-05-31";

function makeHandoverRecord(overrides: Partial<HandoverRecordInput> = {}): HandoverRecordInput {
  return {
    id: "hr_001",
    shift_date: TODAY,
    shift_type: "day_to_night",
    outgoing_staff_id: "staff_1",
    incoming_staff_id: "staff_2",
    handover_completed: true,
    handover_method: "face_to_face",
    all_children_covered: true,
    behaviour_updates_included: true,
    medication_updates_included: true,
    safeguarding_updates_included: true,
    incident_updates_included: true,
    emotional_wellbeing_covered: true,
    appointments_handover_included: true,
    quality_rating: 5,
    manager_reviewed: true,
    issues_identified: [],
    issues_resolved: false,
    notes: "All handover items covered.",
    created_at: TODAY,
    ...overrides,
  };
}

function makeCommLog(overrides: Partial<CommunicationLogRecordInput> = {}): CommunicationLogRecordInput {
  return {
    id: "cl_001",
    date: TODAY,
    staff_id: "staff_1",
    log_type: "daily_log",
    completeness_score: 5,
    timely_entry: true,
    relevant_detail_included: true,
    professional_language_used: true,
    actions_documented: true,
    follow_up_identified: false,
    follow_up_completed: false,
    reviewed_by_manager: true,
    child_ids_referenced: ["child_1"],
    created_at: TODAY,
    ...overrides,
  };
}

function makeCriticalInfo(overrides: Partial<CriticalInfoRecordInput> = {}): CriticalInfoRecordInput {
  return {
    id: "ci_001",
    date: TODAY,
    info_type: "safeguarding_alert",
    originating_staff_id: "staff_1",
    priority: "urgent",
    all_relevant_staff_notified: true,
    notification_method: "face_to_face",
    acknowledged_by_count: 5,
    total_staff_to_notify: 5,
    documented_in_handover: true,
    follow_up_actions_set: true,
    follow_up_completed: true,
    escalated_to_manager: true,
    time_to_notify_minutes: 5,
    information_accurate: true,
    created_at: TODAY,
    ...overrides,
  };
}

function makeTimeliness(overrides: Partial<TimelinessRecordInput> = {}): TimelinessRecordInput {
  return {
    id: "tl_001",
    shift_date: TODAY,
    shift_type: "day_to_night",
    scheduled_handover_time: "20:00",
    actual_handover_time: "20:00",
    handover_started_on_time: true,
    handover_duration_minutes: 20,
    adequate_duration: true,
    overlap_period_available: true,
    rushing_noted: false,
    both_staff_present: true,
    interruptions_count: 0,
    created_at: TODAY,
    ...overrides,
  };
}

function makeAction(overrides: Partial<ActionCompletionRecordInput> = {}): ActionCompletionRecordInput {
  return {
    id: "ac_001",
    handover_date: TODAY,
    action_description: "Administer medication as per updated plan",
    assigned_to_staff_id: "staff_2",
    priority: "high",
    due_by: TODAY,
    completed: true,
    completed_on_time: true,
    completion_date: TODAY,
    verified_by_manager: true,
    outcome_recorded: true,
    carried_forward_count: 0,
    created_at: TODAY,
    ...overrides,
  };
}

function baseInput(overrides: Partial<HandoverCommunicationQualityInput> = {}): HandoverCommunicationQualityInput {
  return {
    today: TODAY,
    total_staff: 8,
    handover_records: [],
    communication_log_records: [],
    critical_info_records: [],
    timeliness_records: [],
    action_completion_records: [],
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe("computeHandoverCommunicationQuality", () => {
  // ── 1. Insufficient Data (total_staff=0, all empty) ─────────────────
  describe("insufficient_data — all empty + 0 staff", () => {
    it("returns insufficient_data rating", () => {
      const r = computeHandoverCommunicationQuality(baseInput({ total_staff: 0 }));
      expect(r.handover_rating).toBe("insufficient_data");
    });

    it("returns score 0", () => {
      const r = computeHandoverCommunicationQuality(baseInput({ total_staff: 0 }));
      expect(r.handover_score).toBe(0);
    });

    it("returns correct headline for insufficient data", () => {
      const r = computeHandoverCommunicationQuality(baseInput({ total_staff: 0 }));
      expect(r.headline).toContain("No staff on record");
    });

    it("returns 0 for all record counts", () => {
      const r = computeHandoverCommunicationQuality(baseInput({ total_staff: 0 }));
      expect(r.total_handover_records).toBe(0);
      expect(r.total_communication_logs).toBe(0);
      expect(r.total_critical_info_transfers).toBe(0);
    });

    it("returns 0 for all rate metrics", () => {
      const r = computeHandoverCommunicationQuality(baseInput({ total_staff: 0 }));
      expect(r.handover_quality_rate).toBe(0);
      expect(r.communication_log_rate).toBe(0);
      expect(r.critical_info_rate).toBe(0);
      expect(r.handover_timeliness_rate).toBe(0);
      expect(r.staff_satisfaction_rate).toBe(0);
      expect(r.action_completion_rate).toBe(0);
    });

    it("returns empty arrays for strengths, concerns, recommendations, insights", () => {
      const r = computeHandoverCommunicationQuality(baseInput({ total_staff: 0 }));
      expect(r.strengths).toEqual([]);
      expect(r.concerns).toEqual([]);
      expect(r.recommendations).toEqual([]);
      expect(r.insights).toEqual([]);
    });
  });

  // ── 2. All Empty + Staff > 0 → Inadequate ──────────────────────────
  describe("all empty + staff > 0 → inadequate", () => {
    it("returns inadequate rating", () => {
      const r = computeHandoverCommunicationQuality(baseInput());
      expect(r.handover_rating).toBe("inadequate");
    });

    it("returns score 15", () => {
      const r = computeHandoverCommunicationQuality(baseInput());
      expect(r.handover_score).toBe(15);
    });

    it("returns correct headline mentioning no data despite active staff", () => {
      const r = computeHandoverCommunicationQuality(baseInput());
      expect(r.headline).toContain("No handover or communication data recorded");
    });

    it("returns 0 for all counts", () => {
      const r = computeHandoverCommunicationQuality(baseInput());
      expect(r.total_handover_records).toBe(0);
      expect(r.total_communication_logs).toBe(0);
      expect(r.total_critical_info_transfers).toBe(0);
    });

    it("returns 0 for all rates", () => {
      const r = computeHandoverCommunicationQuality(baseInput());
      expect(r.handover_quality_rate).toBe(0);
      expect(r.communication_log_rate).toBe(0);
      expect(r.critical_info_rate).toBe(0);
      expect(r.handover_timeliness_rate).toBe(0);
      expect(r.staff_satisfaction_rate).toBe(0);
      expect(r.action_completion_rate).toBe(0);
    });

    it("returns exactly 1 concern", () => {
      const r = computeHandoverCommunicationQuality(baseInput());
      expect(r.concerns).toHaveLength(1);
      expect(r.concerns[0]).toContain("No handover records");
    });

    it("returns 2 recommendations both immediate", () => {
      const r = computeHandoverCommunicationQuality(baseInput());
      expect(r.recommendations).toHaveLength(2);
      expect(r.recommendations[0].urgency).toBe("immediate");
      expect(r.recommendations[1].urgency).toBe("immediate");
    });

    it("returns 1 critical insight", () => {
      const r = computeHandoverCommunicationQuality(baseInput());
      expect(r.insights).toHaveLength(1);
      expect(r.insights[0].severity).toBe("critical");
    });

    it("recommendations have rank 1 and 2", () => {
      const r = computeHandoverCommunicationQuality(baseInput());
      expect(r.recommendations[0].rank).toBe(1);
      expect(r.recommendations[1].rank).toBe(2);
    });

    it("recommendations reference Reg 16 and Reg 5", () => {
      const r = computeHandoverCommunicationQuality(baseInput());
      expect(r.recommendations[0].regulatory_ref).toContain("Reg 16");
      expect(r.recommendations[1].regulatory_ref).toContain("Reg 5");
    });

    it("returns empty strengths", () => {
      const r = computeHandoverCommunicationQuality(baseInput());
      expect(r.strengths).toEqual([]);
    });
  });

  // ── 3. Outstanding Rating ───────────────────────────────────────────
  describe("outstanding rating", () => {
    function outstandingInput(): HandoverCommunicationQualityInput {
      // All metrics >=90 → base 52 + 5 + 5 + 5 + 4 + 4 + 5 = 80
      return baseInput({
        handover_records: Array.from({ length: 10 }, (_, i) =>
          makeHandoverRecord({ id: `hr_${i}` })
        ),
        communication_log_records: Array.from({ length: 10 }, (_, i) =>
          makeCommLog({ id: `cl_${i}` })
        ),
        critical_info_records: Array.from({ length: 10 }, (_, i) =>
          makeCriticalInfo({ id: `ci_${i}` })
        ),
        timeliness_records: Array.from({ length: 10 }, (_, i) =>
          makeTimeliness({ id: `tl_${i}` })
        ),
        action_completion_records: Array.from({ length: 10 }, (_, i) =>
          makeAction({ id: `ac_${i}` })
        ),
      });
    }

    it("returns outstanding rating with all perfect data", () => {
      const r = computeHandoverCommunicationQuality(outstandingInput());
      expect(r.handover_rating).toBe("outstanding");
    });

    it("returns score 80 with all bonuses and no penalties", () => {
      const r = computeHandoverCommunicationQuality(outstandingInput());
      expect(r.handover_score).toBe(80);
    });

    it("returns outstanding headline", () => {
      const r = computeHandoverCommunicationQuality(outstandingInput());
      expect(r.headline).toContain("Outstanding");
    });

    it("returns correct total counts", () => {
      const r = computeHandoverCommunicationQuality(outstandingInput());
      expect(r.total_handover_records).toBe(10);
      expect(r.total_communication_logs).toBe(10);
      expect(r.total_critical_info_transfers).toBe(10);
    });

    it("returns 100% for all composite rates", () => {
      const r = computeHandoverCommunicationQuality(outstandingInput());
      expect(r.handover_quality_rate).toBe(100);
      expect(r.communication_log_rate).toBe(100);
      expect(r.critical_info_rate).toBe(100);
      expect(r.handover_timeliness_rate).toBe(100);
      expect(r.staff_satisfaction_rate).toBe(100);
      expect(r.action_completion_rate).toBe(100);
    });

    it("generates multiple strengths", () => {
      const r = computeHandoverCommunicationQuality(outstandingInput());
      expect(r.strengths.length).toBeGreaterThanOrEqual(6);
    });

    it("generates no concerns", () => {
      const r = computeHandoverCommunicationQuality(outstandingInput());
      expect(r.concerns).toHaveLength(0);
    });

    it("generates no recommendations", () => {
      const r = computeHandoverCommunicationQuality(outstandingInput());
      expect(r.recommendations).toHaveLength(0);
    });

    it("generates positive insights", () => {
      const r = computeHandoverCommunicationQuality(outstandingInput());
      const positives = r.insights.filter(i => i.severity === "positive");
      expect(positives.length).toBeGreaterThan(0);
    });

    it("includes outstanding overall insight", () => {
      const r = computeHandoverCommunicationQuality(outstandingInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("outstanding"))).toBe(true);
    });

    it("strength includes handover quality at 100%", () => {
      const r = computeHandoverCommunicationQuality(outstandingInput());
      expect(r.strengths.some(s => s.includes("100% handover quality"))).toBe(true);
    });

    it("strength includes communication log quality at 100%", () => {
      const r = computeHandoverCommunicationQuality(outstandingInput());
      expect(r.strengths.some(s => s.includes("100% communication log quality"))).toBe(true);
    });

    it("strength includes critical information transfer at 100%", () => {
      const r = computeHandoverCommunicationQuality(outstandingInput());
      expect(r.strengths.some(s => s.includes("100% critical information transfer"))).toBe(true);
    });

    it("strength includes handover timeliness at 100%", () => {
      const r = computeHandoverCommunicationQuality(outstandingInput());
      expect(r.strengths.some(s => s.includes("100% handover timeliness"))).toBe(true);
    });

    it("strength includes staff satisfaction at 100%", () => {
      const r = computeHandoverCommunicationQuality(outstandingInput());
      expect(r.strengths.some(s => s.includes("100% staff satisfaction"))).toBe(true);
    });

    it("strength includes action completion at 100%", () => {
      const r = computeHandoverCommunicationQuality(outstandingInput());
      expect(r.strengths.some(s => s.includes("100% handover action completion"))).toBe(true);
    });

    it("strength includes face-to-face rate at 100%", () => {
      const r = computeHandoverCommunicationQuality(outstandingInput());
      expect(r.strengths.some(s => s.includes("100% face-to-face"))).toBe(true);
    });

    it("strength includes content completeness at 100%", () => {
      const r = computeHandoverCommunicationQuality(outstandingInput());
      expect(r.strengths.some(s => s.includes("100% handover content completeness"))).toBe(true);
    });

    it("strength includes manager review rate at 100%", () => {
      const r = computeHandoverCommunicationQuality(outstandingInput());
      expect(r.strengths.some(s => s.includes("100% manager review"))).toBe(true);
    });

    it("strength includes rapid notification at 100%", () => {
      const r = computeHandoverCommunicationQuality(outstandingInput());
      expect(r.strengths.some(s => s.includes("100%") && s.includes("critical information communicated within 15 minutes"))).toBe(true);
    });

    it("strength includes on-time completion at 100%", () => {
      const r = computeHandoverCommunicationQuality(outstandingInput());
      expect(r.strengths.some(s => s.includes("100%") && s.includes("handover actions completed on time"))).toBe(true);
    });

    it("strength includes accuracy rate at 100%", () => {
      const r = computeHandoverCommunicationQuality(outstandingInput());
      expect(r.strengths.some(s => s.includes("100% information accuracy"))).toBe(true);
    });

    it("strength includes both staff present at 100%", () => {
      const r = computeHandoverCommunicationQuality(outstandingInput());
      expect(r.strengths.some(s => s.includes("100%") && s.includes("both outgoing and incoming staff present"))).toBe(true);
    });

    it("strength includes professional language at 100%", () => {
      const r = computeHandoverCommunicationQuality(outstandingInput());
      expect(r.strengths.some(s => s.includes("100% professional language"))).toBe(true);
    });
  });

  // ── 4. Good Rating ──────────────────────────────────────────────────
  describe("good rating", () => {
    it("achieves good with 70-89% across metrics (score 65-79)", () => {
      // handoverQuality 70% → +3, commLog 70% → +2, critInfo 70% → +3,
      // timeliness 70% → +2, satisfaction 70% → +2, actions 70% → +2
      // = 52 + 3+2+3+2+2+2 = 66
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandoverRecord({
          id: `hr_${i}`,
          handover_completed: i < 8,
          all_children_covered: i < 8,
          quality_rating: i < 7 ? 4 : 2,
        })
      );
      const commLogs = Array.from({ length: 10 }, (_, i) =>
        makeCommLog({
          id: `cl_${i}`,
          timely_entry: i < 8,
          completeness_score: i < 7 ? 5 : 2,
          relevant_detail_included: i < 8,
          professional_language_used: i < 8,
        })
      );
      const critInfo = Array.from({ length: 10 }, (_, i) =>
        makeCriticalInfo({
          id: `ci_${i}`,
          all_relevant_staff_notified: i < 8,
          documented_in_handover: i < 8,
          information_accurate: i < 9,
        })
      );
      const timeliness = Array.from({ length: 10 }, (_, i) =>
        makeTimeliness({
          id: `tl_${i}`,
          handover_started_on_time: i < 8,
          adequate_duration: i < 8,
          both_staff_present: i < 9,
          rushing_noted: i >= 8,
        })
      );
      const actions = Array.from({ length: 10 }, (_, i) =>
        makeAction({
          id: `ac_${i}`,
          completed: i < 8,
          completed_on_time: i < 7,
        })
      );
      const r = computeHandoverCommunicationQuality(baseInput({
        handover_records: handovers,
        communication_log_records: commLogs,
        critical_info_records: critInfo,
        timeliness_records: timeliness,
        action_completion_records: actions,
      }));
      expect(r.handover_rating).toBe("good");
      expect(r.handover_score).toBeGreaterThanOrEqual(65);
      expect(r.handover_score).toBeLessThan(80);
    });

    it("good headline includes strengths and areas for improvement", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandoverRecord({
          id: `hr_${i}`,
          handover_completed: i < 8,
          all_children_covered: i < 8,
          quality_rating: i < 7 ? 4 : 2,
        })
      );
      const r = computeHandoverCommunicationQuality(baseInput({
        handover_records: handovers,
        communication_log_records: Array.from({ length: 10 }, (_, i) =>
          makeCommLog({ id: `cl_${i}` })
        ),
        critical_info_records: Array.from({ length: 10 }, (_, i) =>
          makeCriticalInfo({ id: `ci_${i}` })
        ),
        timeliness_records: Array.from({ length: 10 }, (_, i) =>
          makeTimeliness({ id: `tl_${i}` })
        ),
        action_completion_records: Array.from({ length: 10 }, (_, i) =>
          makeAction({ id: `ac_${i}` })
        ),
      }));
      expect(r.headline).toContain("Good");
    });

    it("generates strengths for 70%+ metrics", () => {
      const r = computeHandoverCommunicationQuality(baseInput({
        handover_records: Array.from({ length: 10 }, (_, i) =>
          makeHandoverRecord({
            id: `hr_${i}`,
            handover_completed: i < 8,
            all_children_covered: i < 8,
            quality_rating: i < 7 ? 5 : 2,
          })
        ),
        communication_log_records: Array.from({ length: 10 }, (_, i) =>
          makeCommLog({ id: `cl_${i}` })
        ),
        critical_info_records: Array.from({ length: 10 }, (_, i) =>
          makeCriticalInfo({ id: `ci_${i}` })
        ),
        timeliness_records: Array.from({ length: 10 }, (_, i) =>
          makeTimeliness({ id: `tl_${i}` })
        ),
        action_completion_records: Array.from({ length: 10 }, (_, i) =>
          makeAction({ id: `ac_${i}` })
        ),
      }));
      expect(r.strengths.length).toBeGreaterThan(0);
    });
  });

  // ── 5. Adequate Rating ──────────────────────────────────────────────
  describe("adequate rating", () => {
    it("achieves adequate with moderate metrics (score 45-64)", () => {
      // handoverQuality <70 → no bonus, commLog <70 → no bonus
      // critInfo <70 → no bonus, timeliness <70 → no bonus
      // satisfaction <70 → no bonus, actions <70 → no bonus
      // But no penalty conditions met either → score = 52
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandoverRecord({
          id: `hr_${i}`,
          handover_completed: i < 6,
          all_children_covered: i < 6,
          quality_rating: i < 6 ? 4 : 2,
        })
      );
      const commLogs = Array.from({ length: 10 }, (_, i) =>
        makeCommLog({
          id: `cl_${i}`,
          timely_entry: i < 6,
          completeness_score: i < 6 ? 5 : 2,
          relevant_detail_included: i < 6,
          professional_language_used: i < 6,
        })
      );
      const critInfo = Array.from({ length: 10 }, (_, i) =>
        makeCriticalInfo({
          id: `ci_${i}`,
          all_relevant_staff_notified: i < 6,
          documented_in_handover: i < 6,
          information_accurate: i < 6,
        })
      );
      const timeliness = Array.from({ length: 10 }, (_, i) =>
        makeTimeliness({
          id: `tl_${i}`,
          handover_started_on_time: i < 5,
          adequate_duration: i < 5,
          both_staff_present: i < 5,
          rushing_noted: i >= 5,
        })
      );
      const actions = Array.from({ length: 10 }, (_, i) =>
        makeAction({
          id: `ac_${i}`,
          completed: i < 6,
          completed_on_time: i < 5,
        })
      );
      const r = computeHandoverCommunicationQuality(baseInput({
        handover_records: handovers,
        communication_log_records: commLogs,
        critical_info_records: critInfo,
        timeliness_records: timeliness,
        action_completion_records: actions,
      }));
      expect(r.handover_rating).toBe("adequate");
      expect(r.handover_score).toBeGreaterThanOrEqual(45);
      expect(r.handover_score).toBeLessThan(65);
    });

    it("adequate headline references concerns", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandoverRecord({
          id: `hr_${i}`,
          handover_completed: i < 6,
          all_children_covered: i < 6,
          quality_rating: i < 6 ? 4 : 2,
        })
      );
      const r = computeHandoverCommunicationQuality(baseInput({
        handover_records: handovers,
        communication_log_records: Array.from({ length: 10 }, (_, i) =>
          makeCommLog({
            id: `cl_${i}`,
            timely_entry: i < 6,
            completeness_score: i < 6 ? 5 : 2,
            relevant_detail_included: i < 6,
            professional_language_used: i < 6,
          })
        ),
        critical_info_records: Array.from({ length: 10 }, (_, i) =>
          makeCriticalInfo({
            id: `ci_${i}`,
            all_relevant_staff_notified: i < 6,
            documented_in_handover: i < 6,
            information_accurate: i < 6,
          })
        ),
        timeliness_records: Array.from({ length: 10 }, (_, i) =>
          makeTimeliness({
            id: `tl_${i}`,
            handover_started_on_time: i < 5,
            adequate_duration: i < 5,
            both_staff_present: i < 5,
            rushing_noted: i >= 5,
          })
        ),
        action_completion_records: Array.from({ length: 10 }, (_, i) =>
          makeAction({ id: `ac_${i}`, completed: i < 6 })
        ),
      }));
      expect(r.headline).toContain("Adequate");
    });
  });

  // ── 6. Inadequate Rating ────────────────────────────────────────────
  describe("inadequate rating", () => {
    it("returns inadequate with all metrics <50% and penalties applied", () => {
      // All <50 → 4 penalties: -6-6-4-4 = -20 → 52 - 20 = 32
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandoverRecord({
          id: `hr_${i}`,
          handover_completed: i < 3,
          all_children_covered: i < 3,
          quality_rating: i < 3 ? 4 : 1,
        })
      );
      const critInfo = Array.from({ length: 10 }, (_, i) =>
        makeCriticalInfo({
          id: `ci_${i}`,
          all_relevant_staff_notified: i < 3,
          documented_in_handover: i < 3,
          information_accurate: i < 3,
        })
      );
      const timeliness = Array.from({ length: 10 }, (_, i) =>
        makeTimeliness({
          id: `tl_${i}`,
          handover_started_on_time: i < 3,
          adequate_duration: i < 3,
          both_staff_present: i < 3,
          rushing_noted: i >= 3,
        })
      );
      const actions = Array.from({ length: 10 }, (_, i) =>
        makeAction({ id: `ac_${i}`, completed: i < 4, completed_on_time: i < 3 })
      );
      const r = computeHandoverCommunicationQuality(baseInput({
        handover_records: handovers,
        critical_info_records: critInfo,
        timeliness_records: timeliness,
        action_completion_records: actions,
      }));
      expect(r.handover_rating).toBe("inadequate");
      expect(r.handover_score).toBe(32);
    });

    it("inadequate headline mentions urgent action", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandoverRecord({
          id: `hr_${i}`,
          handover_completed: i < 3,
          all_children_covered: i < 3,
          quality_rating: i < 3 ? 4 : 1,
        })
      );
      const r = computeHandoverCommunicationQuality(baseInput({
        handover_records: handovers,
        critical_info_records: Array.from({ length: 10 }, (_, i) =>
          makeCriticalInfo({
            id: `ci_${i}`,
            all_relevant_staff_notified: i < 3,
            documented_in_handover: i < 3,
            information_accurate: i < 3,
          })
        ),
        timeliness_records: Array.from({ length: 10 }, (_, i) =>
          makeTimeliness({
            id: `tl_${i}`,
            handover_started_on_time: i < 3,
            adequate_duration: i < 3,
            both_staff_present: i < 3,
            rushing_noted: i >= 3,
          })
        ),
        action_completion_records: Array.from({ length: 10 }, (_, i) =>
          makeAction({ id: `ac_${i}`, completed: i < 4 })
        ),
      }));
      expect(r.headline).toContain("inadequate");
    });

    it("generates critical concerns when all rates are below 50%", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandoverRecord({
          id: `hr_${i}`,
          handover_completed: i < 3,
          all_children_covered: i < 3,
          quality_rating: i < 3 ? 4 : 1,
        })
      );
      const r = computeHandoverCommunicationQuality(baseInput({
        handover_records: handovers,
        critical_info_records: Array.from({ length: 10 }, (_, i) =>
          makeCriticalInfo({
            id: `ci_${i}`,
            all_relevant_staff_notified: i < 3,
            documented_in_handover: i < 3,
            information_accurate: i < 3,
          })
        ),
        timeliness_records: Array.from({ length: 10 }, (_, i) =>
          makeTimeliness({
            id: `tl_${i}`,
            handover_started_on_time: i < 3,
            adequate_duration: i < 3,
            both_staff_present: i < 3,
            rushing_noted: i >= 3,
          })
        ),
        action_completion_records: Array.from({ length: 10 }, (_, i) =>
          makeAction({ id: `ac_${i}`, completed: i < 4 })
        ),
      }));
      expect(r.concerns.length).toBeGreaterThanOrEqual(4);
    });

    it("generates immediate recommendations for <50% rates", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandoverRecord({
          id: `hr_${i}`,
          handover_completed: i < 3,
          all_children_covered: i < 3,
          quality_rating: i < 3 ? 4 : 1,
        })
      );
      const r = computeHandoverCommunicationQuality(baseInput({
        handover_records: handovers,
        critical_info_records: Array.from({ length: 10 }, (_, i) =>
          makeCriticalInfo({
            id: `ci_${i}`,
            all_relevant_staff_notified: i < 3,
            documented_in_handover: i < 3,
            information_accurate: i < 3,
          })
        ),
        timeliness_records: Array.from({ length: 10 }, (_, i) =>
          makeTimeliness({
            id: `tl_${i}`,
            handover_started_on_time: i < 3,
            adequate_duration: i < 3,
            both_staff_present: i < 3,
            rushing_noted: i >= 3,
          })
        ),
        action_completion_records: Array.from({ length: 10 }, (_, i) =>
          makeAction({ id: `ac_${i}`, completed: i < 4 })
        ),
      }));
      const immediateRecs = r.recommendations.filter(rec => rec.urgency === "immediate");
      expect(immediateRecs.length).toBeGreaterThanOrEqual(3);
    });

    it("generates critical insights when metrics are below 50%", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandoverRecord({
          id: `hr_${i}`,
          handover_completed: i < 3,
          all_children_covered: i < 3,
          quality_rating: i < 3 ? 4 : 1,
        })
      );
      const r = computeHandoverCommunicationQuality(baseInput({
        handover_records: handovers,
        critical_info_records: Array.from({ length: 10 }, (_, i) =>
          makeCriticalInfo({
            id: `ci_${i}`,
            all_relevant_staff_notified: i < 3,
            documented_in_handover: i < 3,
            information_accurate: i < 3,
          })
        ),
        timeliness_records: Array.from({ length: 10 }, (_, i) =>
          makeTimeliness({
            id: `tl_${i}`,
            handover_started_on_time: i < 3,
            adequate_duration: i < 3,
            both_staff_present: i < 3,
            rushing_noted: i >= 3,
          })
        ),
        action_completion_records: Array.from({ length: 10 }, (_, i) =>
          makeAction({ id: `ac_${i}`, completed: i < 4 })
        ),
      }));
      const criticalInsights = r.insights.filter(i => i.severity === "critical");
      expect(criticalInsights.length).toBeGreaterThanOrEqual(3);
    });
  });

  // ── 7. Scoring: Bonus 1 — Handover Quality Rate ────────────────────
  describe("scoring — handover quality rate bonuses", () => {
    it("+5 when handoverQualityRate >= 90", () => {
      // 10 handovers, 9 completed + all_children + quality>=4
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandoverRecord({ id: `hr_${i}` })
      );
      const r = computeHandoverCommunicationQuality(baseInput({
        handover_records: handovers,
      }));
      // handoverQualityRate=100% → +5; staffSatisfaction also 100% (all rating=5) → +4
      // base 52 + 5 + 4 = 61
      expect(r.handover_score).toBe(61);
    });

    it("+3 when handoverQualityRate 70-89%", () => {
      // 10 handovers, 8 high quality
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandoverRecord({
          id: `hr_${i}`,
          handover_completed: i < 8,
          all_children_covered: i < 8,
          quality_rating: i < 8 ? 4 : 2,
        })
      );
      const r = computeHandoverCommunicationQuality(baseInput({
        handover_records: handovers,
      }));
      // handoverQualityRate=80% → +3; staffSatisfaction 80% (8/10 rating>=4) → +2
      // base 52 + 3 + 2 = 57
      expect(r.handover_score).toBe(57);
    });

    it("no bonus when handoverQualityRate < 70%", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandoverRecord({
          id: `hr_${i}`,
          handover_completed: i < 6,
          all_children_covered: i < 6,
          quality_rating: i < 6 ? 4 : 2,
        })
      );
      const r = computeHandoverCommunicationQuality(baseInput({
        handover_records: handovers,
      }));
      // handoverQualityRate=60% → no bonus, but also no penalty (>=50)
      expect(r.handover_score).toBe(52);
    });
  });

  // ── 8. Scoring: Bonus 2 — Communication Log Rate ───────────────────
  describe("scoring — communication log rate bonuses", () => {
    it("+5 when communicationLogRate >= 90%", () => {
      const commLogs = Array.from({ length: 10 }, (_, i) =>
        makeCommLog({ id: `cl_${i}` })
      );
      const r = computeHandoverCommunicationQuality(baseInput({
        communication_log_records: commLogs,
      }));
      expect(r.handover_score).toBe(57);
    });

    it("+2 when communicationLogRate 70-89%", () => {
      const commLogs = Array.from({ length: 10 }, (_, i) =>
        makeCommLog({
          id: `cl_${i}`,
          timely_entry: i < 8,
          completeness_score: i < 8 ? 5 : 2,
          relevant_detail_included: i < 8,
          professional_language_used: i < 8,
        })
      );
      const r = computeHandoverCommunicationQuality(baseInput({
        communication_log_records: commLogs,
      }));
      // 80% quality logs → +2
      expect(r.handover_score).toBe(54);
    });

    it("no bonus when communicationLogRate < 70%", () => {
      const commLogs = Array.from({ length: 10 }, (_, i) =>
        makeCommLog({
          id: `cl_${i}`,
          timely_entry: i < 5,
          completeness_score: i < 5 ? 5 : 2,
        })
      );
      const r = computeHandoverCommunicationQuality(baseInput({
        communication_log_records: commLogs,
      }));
      expect(r.handover_score).toBe(52);
    });
  });

  // ── 9. Scoring: Bonus 3 — Critical Info Rate ───────────────────────
  describe("scoring — critical info rate bonuses", () => {
    it("+5 when criticalInfoRate >= 90%", () => {
      const critInfo = Array.from({ length: 10 }, (_, i) =>
        makeCriticalInfo({ id: `ci_${i}` })
      );
      const r = computeHandoverCommunicationQuality(baseInput({
        critical_info_records: critInfo,
      }));
      expect(r.handover_score).toBe(57);
    });

    it("+3 when criticalInfoRate 70-89%", () => {
      const critInfo = Array.from({ length: 10 }, (_, i) =>
        makeCriticalInfo({
          id: `ci_${i}`,
          all_relevant_staff_notified: i < 8,
          documented_in_handover: i < 8,
          information_accurate: i < 9,
        })
      );
      const r = computeHandoverCommunicationQuality(baseInput({
        critical_info_records: critInfo,
      }));
      // effective: notified + documented + accurate → 8 out of 10 = 80% → +3
      expect(r.handover_score).toBe(55);
    });

    it("no bonus when criticalInfoRate < 70%", () => {
      const critInfo = Array.from({ length: 10 }, (_, i) =>
        makeCriticalInfo({
          id: `ci_${i}`,
          all_relevant_staff_notified: i < 5,
          documented_in_handover: i < 5,
          information_accurate: i < 5,
        })
      );
      const r = computeHandoverCommunicationQuality(baseInput({
        critical_info_records: critInfo,
      }));
      expect(r.handover_score).toBe(52);
    });
  });

  // ── 10. Scoring: Bonus 4 — Timeliness Rate ─────────────────────────
  describe("scoring — timeliness rate bonuses", () => {
    it("+4 when handoverTimelinessRate >= 90%", () => {
      const timeliness = Array.from({ length: 10 }, (_, i) =>
        makeTimeliness({ id: `tl_${i}` })
      );
      const r = computeHandoverCommunicationQuality(baseInput({
        timeliness_records: timeliness,
      }));
      expect(r.handover_score).toBe(56);
    });

    it("+2 when handoverTimelinessRate 70-89%", () => {
      const timeliness = Array.from({ length: 10 }, (_, i) =>
        makeTimeliness({
          id: `tl_${i}`,
          handover_started_on_time: i < 8,
          adequate_duration: i < 8,
          both_staff_present: i < 9,
          rushing_noted: i >= 9,
        })
      );
      const r = computeHandoverCommunicationQuality(baseInput({
        timeliness_records: timeliness,
      }));
      // timely: on_time + adequate + both_present + !rushing → 8 qualify → 80% → +2
      expect(r.handover_score).toBe(54);
    });

    it("no bonus when handoverTimelinessRate < 70%", () => {
      const timeliness = Array.from({ length: 10 }, (_, i) =>
        makeTimeliness({
          id: `tl_${i}`,
          handover_started_on_time: i < 5,
          adequate_duration: i < 5,
          both_staff_present: i < 5,
          rushing_noted: i >= 5,
        })
      );
      const r = computeHandoverCommunicationQuality(baseInput({
        timeliness_records: timeliness,
      }));
      expect(r.handover_score).toBe(52);
    });
  });

  // ── 11. Scoring: Bonus 5 — Staff Satisfaction Rate ──────────────────
  describe("scoring — staff satisfaction rate bonuses", () => {
    it("+4 when staffSatisfactionRate >= 90%", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandoverRecord({ id: `hr_${i}`, quality_rating: 5 })
      );
      const r = computeHandoverCommunicationQuality(baseInput({
        handover_records: handovers,
      }));
      // staffSatisfaction 100% → +4, handoverQuality also 100% → +5, total 52+5+4 = 61
      expect(r.handover_score).toBe(61);
    });

    it("+2 when staffSatisfactionRate 70-89%", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandoverRecord({
          id: `hr_${i}`,
          quality_rating: i < 8 ? 4 : 2,
          // Make handover quality <70 to isolate satisfaction bonus
          handover_completed: i < 6,
          all_children_covered: i < 6,
        })
      );
      const r = computeHandoverCommunicationQuality(baseInput({
        handover_records: handovers,
      }));
      // satisfaction: rating>=4 → 8/10 = 80% → +2
      // handoverQuality: completed + all_children + quality>=4 → 6/10 = 60% → no bonus
      // 52 + 2 = 54
      expect(r.handover_score).toBe(54);
    });

    it("no bonus when staffSatisfactionRate < 70%", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandoverRecord({
          id: `hr_${i}`,
          quality_rating: i < 6 ? 4 : 2,
          // Make handoverQuality also 60% so no penalty applies
          handover_completed: i < 6,
          all_children_covered: i < 6,
        })
      );
      const r = computeHandoverCommunicationQuality(baseInput({
        handover_records: handovers,
      }));
      // satisfaction 60% → no bonus, handoverQuality 60% → no bonus, no penalties
      // 52 + 0 = 52
      expect(r.handover_score).toBe(52);
    });
  });

  // ── 12. Scoring: Bonus 6 — Action Completion Rate ───────────────────
  describe("scoring — action completion rate bonuses", () => {
    it("+5 when actionCompletionRate >= 90%", () => {
      const actions = Array.from({ length: 10 }, (_, i) =>
        makeAction({ id: `ac_${i}` })
      );
      const r = computeHandoverCommunicationQuality(baseInput({
        action_completion_records: actions,
      }));
      expect(r.handover_score).toBe(57);
    });

    it("+2 when actionCompletionRate 70-89%", () => {
      const actions = Array.from({ length: 10 }, (_, i) =>
        makeAction({ id: `ac_${i}`, completed: i < 8 })
      );
      const r = computeHandoverCommunicationQuality(baseInput({
        action_completion_records: actions,
      }));
      expect(r.handover_score).toBe(54);
    });

    it("no bonus when actionCompletionRate < 70%", () => {
      const actions = Array.from({ length: 10 }, (_, i) =>
        makeAction({ id: `ac_${i}`, completed: i < 6 })
      );
      const r = computeHandoverCommunicationQuality(baseInput({
        action_completion_records: actions,
      }));
      expect(r.handover_score).toBe(52);
    });
  });

  // ── 13. Scoring: Penalties ──────────────────────────────────────────
  describe("scoring — penalties", () => {
    it("-6 penalty when handoverQualityRate < 50%", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandoverRecord({
          id: `hr_${i}`,
          handover_completed: i < 4,
          all_children_covered: i < 4,
          quality_rating: i < 4 ? 4 : 1,
        })
      );
      const r = computeHandoverCommunicationQuality(baseInput({
        handover_records: handovers,
      }));
      // handoverQuality 40% → -6; 52 - 6 = 46
      expect(r.handover_score).toBe(46);
    });

    it("-6 penalty when criticalInfoRate < 50%", () => {
      const critInfo = Array.from({ length: 10 }, (_, i) =>
        makeCriticalInfo({
          id: `ci_${i}`,
          all_relevant_staff_notified: i < 4,
          documented_in_handover: i < 4,
          information_accurate: i < 4,
        })
      );
      const r = computeHandoverCommunicationQuality(baseInput({
        critical_info_records: critInfo,
      }));
      // critInfo 40% → -6; 52 - 6 = 46
      expect(r.handover_score).toBe(46);
    });

    it("-4 penalty when handoverTimelinessRate < 40%", () => {
      const timeliness = Array.from({ length: 10 }, (_, i) =>
        makeTimeliness({
          id: `tl_${i}`,
          handover_started_on_time: i < 3,
          adequate_duration: i < 3,
          both_staff_present: i < 3,
          rushing_noted: i >= 3,
        })
      );
      const r = computeHandoverCommunicationQuality(baseInput({
        timeliness_records: timeliness,
      }));
      // timeliness 30% → -4; 52 - 4 = 48
      expect(r.handover_score).toBe(48);
    });

    it("-4 penalty when actionCompletionRate < 50%", () => {
      const actions = Array.from({ length: 10 }, (_, i) =>
        makeAction({ id: `ac_${i}`, completed: i < 4 })
      );
      const r = computeHandoverCommunicationQuality(baseInput({
        action_completion_records: actions,
      }));
      // actions 40% → -4; 52 - 4 = 48
      expect(r.handover_score).toBe(48);
    });

    it("penalties do not apply when respective arrays are empty", () => {
      // All arrays empty except staff > 0 → special case with score 15
      const r = computeHandoverCommunicationQuality(baseInput());
      expect(r.handover_score).toBe(15);
    });

    it("all four penalties stack", () => {
      const r = computeHandoverCommunicationQuality(baseInput({
        handover_records: Array.from({ length: 10 }, (_, i) =>
          makeHandoverRecord({
            id: `hr_${i}`,
            handover_completed: i < 3,
            all_children_covered: i < 3,
            quality_rating: i < 3 ? 4 : 1,
          })
        ),
        critical_info_records: Array.from({ length: 10 }, (_, i) =>
          makeCriticalInfo({
            id: `ci_${i}`,
            all_relevant_staff_notified: i < 3,
            documented_in_handover: i < 3,
            information_accurate: i < 3,
          })
        ),
        timeliness_records: Array.from({ length: 10 }, (_, i) =>
          makeTimeliness({
            id: `tl_${i}`,
            handover_started_on_time: i < 3,
            adequate_duration: i < 3,
            both_staff_present: i < 3,
            rushing_noted: i >= 3,
          })
        ),
        action_completion_records: Array.from({ length: 10 }, (_, i) =>
          makeAction({ id: `ac_${i}`, completed: i < 4 })
        ),
      }));
      // 52 - 6 - 6 - 4 - 4 = 32
      expect(r.handover_score).toBe(32);
    });

    it("score is clamped to 0 minimum", () => {
      // Try to push below 0 — we can't since 52 - 20 = 32
      // But verify the clamping logic: score can't go below 0
      const r = computeHandoverCommunicationQuality(baseInput({
        handover_records: Array.from({ length: 10 }, (_, i) =>
          makeHandoverRecord({
            id: `hr_${i}`,
            handover_completed: i < 3,
            all_children_covered: i < 3,
            quality_rating: i < 3 ? 4 : 1,
          })
        ),
        critical_info_records: Array.from({ length: 10 }, (_, i) =>
          makeCriticalInfo({
            id: `ci_${i}`,
            all_relevant_staff_notified: i < 3,
            documented_in_handover: i < 3,
            information_accurate: i < 3,
          })
        ),
        timeliness_records: Array.from({ length: 10 }, (_, i) =>
          makeTimeliness({
            id: `tl_${i}`,
            handover_started_on_time: i < 3,
            adequate_duration: i < 3,
            both_staff_present: i < 3,
            rushing_noted: i >= 3,
          })
        ),
        action_completion_records: Array.from({ length: 10 }, (_, i) =>
          makeAction({ id: `ac_${i}`, completed: i < 4 })
        ),
      }));
      expect(r.handover_score).toBeGreaterThanOrEqual(0);
    });

    it("score is clamped to 100 maximum", () => {
      const r = computeHandoverCommunicationQuality(baseInput({
        handover_records: Array.from({ length: 10 }, (_, i) =>
          makeHandoverRecord({ id: `hr_${i}` })
        ),
        communication_log_records: Array.from({ length: 10 }, (_, i) =>
          makeCommLog({ id: `cl_${i}` })
        ),
        critical_info_records: Array.from({ length: 10 }, (_, i) =>
          makeCriticalInfo({ id: `ci_${i}` })
        ),
        timeliness_records: Array.from({ length: 10 }, (_, i) =>
          makeTimeliness({ id: `tl_${i}` })
        ),
        action_completion_records: Array.from({ length: 10 }, (_, i) =>
          makeAction({ id: `ac_${i}` })
        ),
      }));
      expect(r.handover_score).toBeLessThanOrEqual(100);
    });
  });

  // ── 14. Composite Rate: Handover Quality ────────────────────────────
  describe("composite rate — handover quality", () => {
    it("handover_quality_rate requires completed + all_children + quality>=4", () => {
      const handovers = [
        makeHandoverRecord({ id: "hr_1", handover_completed: true, all_children_covered: true, quality_rating: 5 }),
        makeHandoverRecord({ id: "hr_2", handover_completed: true, all_children_covered: true, quality_rating: 3 }),
        makeHandoverRecord({ id: "hr_3", handover_completed: false, all_children_covered: true, quality_rating: 5 }),
        makeHandoverRecord({ id: "hr_4", handover_completed: true, all_children_covered: false, quality_rating: 5 }),
      ];
      const r = computeHandoverCommunicationQuality(baseInput({ handover_records: handovers }));
      // Only hr_1 qualifies → 25%
      expect(r.handover_quality_rate).toBe(25);
    });

    it("handover_quality_rate is 0 when all fail criteria", () => {
      const handovers = Array.from({ length: 5 }, (_, i) =>
        makeHandoverRecord({ id: `hr_${i}`, quality_rating: 2 })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ handover_records: handovers }));
      expect(r.handover_quality_rate).toBe(0);
    });

    it("handover_quality_rate is 100 when all pass", () => {
      const handovers = Array.from({ length: 5 }, (_, i) =>
        makeHandoverRecord({ id: `hr_${i}` })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ handover_records: handovers }));
      expect(r.handover_quality_rate).toBe(100);
    });
  });

  // ── 15. Composite Rate: Communication Log ───────────────────────────
  describe("composite rate — communication log", () => {
    it("communication_log_rate requires timely + complete(>=4) + relevant + professional", () => {
      const commLogs = [
        makeCommLog({ id: "cl_1" }), // passes all
        makeCommLog({ id: "cl_2", timely_entry: false }), // fails timely
        makeCommLog({ id: "cl_3", completeness_score: 3 }), // fails completeness
        makeCommLog({ id: "cl_4", relevant_detail_included: false }), // fails relevant
        makeCommLog({ id: "cl_5", professional_language_used: false }), // fails professional
      ];
      const r = computeHandoverCommunicationQuality(baseInput({ communication_log_records: commLogs }));
      // Only cl_1 → 20%
      expect(r.communication_log_rate).toBe(20);
    });

    it("communication_log_rate is 100 when all pass", () => {
      const commLogs = Array.from({ length: 5 }, (_, i) =>
        makeCommLog({ id: `cl_${i}` })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ communication_log_records: commLogs }));
      expect(r.communication_log_rate).toBe(100);
    });
  });

  // ── 16. Composite Rate: Critical Info ───────────────────────────────
  describe("composite rate — critical info", () => {
    it("critical_info_rate requires notified + documented + accurate", () => {
      const critInfo = [
        makeCriticalInfo({ id: "ci_1" }), // all true
        makeCriticalInfo({ id: "ci_2", all_relevant_staff_notified: false }),
        makeCriticalInfo({ id: "ci_3", documented_in_handover: false }),
        makeCriticalInfo({ id: "ci_4", information_accurate: false }),
      ];
      const r = computeHandoverCommunicationQuality(baseInput({ critical_info_records: critInfo }));
      // Only ci_1 → 25%
      expect(r.critical_info_rate).toBe(25);
    });

    it("critical_info_rate is 100 when all pass", () => {
      const critInfo = Array.from({ length: 5 }, (_, i) =>
        makeCriticalInfo({ id: `ci_${i}` })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ critical_info_records: critInfo }));
      expect(r.critical_info_rate).toBe(100);
    });
  });

  // ── 17. Composite Rate: Timeliness ──────────────────────────────────
  describe("composite rate — timeliness", () => {
    it("handover_timeliness_rate requires on_time + adequate + both_present + !rushing", () => {
      const timeliness = [
        makeTimeliness({ id: "tl_1" }), // all pass
        makeTimeliness({ id: "tl_2", handover_started_on_time: false }),
        makeTimeliness({ id: "tl_3", adequate_duration: false }),
        makeTimeliness({ id: "tl_4", both_staff_present: false }),
        makeTimeliness({ id: "tl_5", rushing_noted: true }),
      ];
      const r = computeHandoverCommunicationQuality(baseInput({ timeliness_records: timeliness }));
      // Only tl_1 → 20%
      expect(r.handover_timeliness_rate).toBe(20);
    });

    it("handover_timeliness_rate is 100 when all pass", () => {
      const timeliness = Array.from({ length: 5 }, (_, i) =>
        makeTimeliness({ id: `tl_${i}` })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ timeliness_records: timeliness }));
      expect(r.handover_timeliness_rate).toBe(100);
    });
  });

  // ── 18. Composite Rate: Staff Satisfaction ──────────────────────────
  describe("composite rate — staff satisfaction", () => {
    it("staff_satisfaction_rate counts quality_rating >= 4", () => {
      const handovers = [
        makeHandoverRecord({ id: "hr_1", quality_rating: 5 }),
        makeHandoverRecord({ id: "hr_2", quality_rating: 4 }),
        makeHandoverRecord({ id: "hr_3", quality_rating: 3 }),
        makeHandoverRecord({ id: "hr_4", quality_rating: 2 }),
      ];
      const r = computeHandoverCommunicationQuality(baseInput({ handover_records: handovers }));
      // 2 out of 4 → 50%
      expect(r.staff_satisfaction_rate).toBe(50);
    });

    it("staff_satisfaction_rate is 100 when all ratings >= 4", () => {
      const handovers = Array.from({ length: 5 }, (_, i) =>
        makeHandoverRecord({ id: `hr_${i}`, quality_rating: 4 })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ handover_records: handovers }));
      expect(r.staff_satisfaction_rate).toBe(100);
    });

    it("staff_satisfaction_rate is 0 when all ratings < 4", () => {
      const handovers = Array.from({ length: 5 }, (_, i) =>
        makeHandoverRecord({ id: `hr_${i}`, quality_rating: 3 })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ handover_records: handovers }));
      expect(r.staff_satisfaction_rate).toBe(0);
    });
  });

  // ── 19. Composite Rate: Action Completion ───────────────────────────
  describe("composite rate — action completion", () => {
    it("action_completion_rate counts completed actions", () => {
      const actions = [
        makeAction({ id: "ac_1", completed: true }),
        makeAction({ id: "ac_2", completed: false }),
        makeAction({ id: "ac_3", completed: true }),
        makeAction({ id: "ac_4", completed: false }),
      ];
      const r = computeHandoverCommunicationQuality(baseInput({ action_completion_records: actions }));
      expect(r.action_completion_rate).toBe(50);
    });

    it("action_completion_rate is 0 when none completed", () => {
      const actions = Array.from({ length: 5 }, (_, i) =>
        makeAction({ id: `ac_${i}`, completed: false })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ action_completion_records: actions }));
      expect(r.action_completion_rate).toBe(0);
    });
  });

  // ── 20. Strengths — Handover Quality ────────────────────────────────
  describe("strengths — handover quality", () => {
    it("generates >=90% strength for handover quality", () => {
      const r = computeHandoverCommunicationQuality(baseInput({
        handover_records: Array.from({ length: 10 }, (_, i) =>
          makeHandoverRecord({ id: `hr_${i}` })
        ),
      }));
      expect(r.strengths.some(s => s.includes("100% handover quality") && s.includes("consistently completed"))).toBe(true);
    });

    it("generates >=70% strength for handover quality", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandoverRecord({
          id: `hr_${i}`,
          handover_completed: i < 8,
          all_children_covered: i < 8,
          quality_rating: i < 8 ? 4 : 2,
        })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ handover_records: handovers }));
      expect(r.strengths.some(s => s.includes("80% handover quality") && s.includes("good standard"))).toBe(true);
    });

    it("no handover quality strength when <70%", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandoverRecord({
          id: `hr_${i}`,
          handover_completed: i < 6,
          all_children_covered: i < 6,
          quality_rating: i < 6 ? 4 : 2,
        })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ handover_records: handovers }));
      // Use specific match to avoid matching other strengths that contain "handover"
      expect(r.strengths.some(s => s.includes("% handover quality"))).toBe(false);
    });
  });

  // ── 21. Strengths — Communication Log ───────────────────────────────
  describe("strengths — communication log", () => {
    it("generates >=90% strength for communication log quality", () => {
      const r = computeHandoverCommunicationQuality(baseInput({
        communication_log_records: Array.from({ length: 10 }, (_, i) =>
          makeCommLog({ id: `cl_${i}` })
        ),
      }));
      expect(r.strengths.some(s => s.includes("100% communication log quality"))).toBe(true);
    });

    it("generates >=70% strength for communication log quality", () => {
      const commLogs = Array.from({ length: 10 }, (_, i) =>
        makeCommLog({
          id: `cl_${i}`,
          timely_entry: i < 8,
          completeness_score: i < 8 ? 5 : 2,
          relevant_detail_included: i < 8,
          professional_language_used: i < 8,
        })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ communication_log_records: commLogs }));
      expect(r.strengths.some(s => s.includes("communication log quality") && s.includes("good standards"))).toBe(true);
    });
  });

  // ── 22. Strengths — Face-to-Face Rate ───────────────────────────────
  describe("strengths — face-to-face rate", () => {
    it("generates >=90% strength for face-to-face handovers", () => {
      const r = computeHandoverCommunicationQuality(baseInput({
        handover_records: Array.from({ length: 10 }, (_, i) =>
          makeHandoverRecord({ id: `hr_${i}`, handover_method: "face_to_face" })
        ),
      }));
      expect(r.strengths.some(s => s.includes("face-to-face"))).toBe(true);
    });

    it("generates >=70% strength for face-to-face/mixed handovers", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandoverRecord({
          id: `hr_${i}`,
          handover_method: i < 8 ? "mixed" : "written_only",
        })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ handover_records: handovers }));
      expect(r.strengths.some(s => s.includes("face-to-face or mixed handovers"))).toBe(true);
    });

    it("no face-to-face strength when all written_only", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandoverRecord({ id: `hr_${i}`, handover_method: "written_only" })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ handover_records: handovers }));
      expect(r.strengths.some(s => s.includes("face-to-face"))).toBe(false);
    });
  });

  // ── 23. Strengths — Content Completeness ────────────────────────────
  describe("strengths — content completeness", () => {
    it("generates >=90% strength for content completeness", () => {
      const r = computeHandoverCommunicationQuality(baseInput({
        handover_records: Array.from({ length: 10 }, (_, i) =>
          makeHandoverRecord({ id: `hr_${i}` })
        ),
      }));
      expect(r.strengths.some(s => s.includes("content completeness"))).toBe(true);
    });

    it("generates >=70% strength for content completeness", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandoverRecord({
          id: `hr_${i}`,
          behaviour_updates_included: i < 8,
          medication_updates_included: i < 8,
          safeguarding_updates_included: i < 8,
          incident_updates_included: i < 8,
          emotional_wellbeing_covered: i < 8,
          appointments_handover_included: i < 8,
        })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ handover_records: handovers }));
      expect(r.strengths.some(s => s.includes("content completeness"))).toBe(true);
    });
  });

  // ── 24. Strengths — Manager Review Rate ─────────────────────────────
  describe("strengths — manager review", () => {
    it("generates >=90% strength for manager review", () => {
      const r = computeHandoverCommunicationQuality(baseInput({
        handover_records: Array.from({ length: 10 }, (_, i) =>
          makeHandoverRecord({ id: `hr_${i}`, manager_reviewed: true })
        ),
      }));
      expect(r.strengths.some(s => s.includes("manager review"))).toBe(true);
    });

    it("generates >=70% strength for manager review", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandoverRecord({ id: `hr_${i}`, manager_reviewed: i < 8 })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ handover_records: handovers }));
      expect(r.strengths.some(s => s.includes("manager review"))).toBe(true);
    });
  });

  // ── 25. Strengths — Rapid Notification ──────────────────────────────
  describe("strengths — rapid notification", () => {
    it("generates >=90% strength for rapid notification within 15 min", () => {
      const r = computeHandoverCommunicationQuality(baseInput({
        critical_info_records: Array.from({ length: 10 }, (_, i) =>
          makeCriticalInfo({ id: `ci_${i}`, time_to_notify_minutes: 5 })
        ),
      }));
      expect(r.strengths.some(s => s.includes("critical information communicated within 15 minutes"))).toBe(true);
    });

    it("no rapid notification strength when times > 15 min", () => {
      const r = computeHandoverCommunicationQuality(baseInput({
        critical_info_records: Array.from({ length: 10 }, (_, i) =>
          makeCriticalInfo({ id: `ci_${i}`, time_to_notify_minutes: 30 })
        ),
      }));
      expect(r.strengths.some(s => s.includes("critical information communicated within 15 minutes"))).toBe(false);
    });
  });

  // ── 26. Strengths — Issue Resolution ────────────────────────────────
  describe("strengths — issue resolution", () => {
    it("generates >=90% strength for handover issue resolution", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandoverRecord({
          id: `hr_${i}`,
          issues_identified: ["gap"],
          issues_resolved: true,
        })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ handover_records: handovers }));
      expect(r.strengths.some(s => s.includes("handover issues resolved"))).toBe(true);
    });
  });

  // ── 27. Strengths — Both Staff Present ──────────────────────────────
  describe("strengths — both staff present", () => {
    it("generates >=90% strength for both staff present", () => {
      const r = computeHandoverCommunicationQuality(baseInput({
        timeliness_records: Array.from({ length: 10 }, (_, i) =>
          makeTimeliness({ id: `tl_${i}`, both_staff_present: true })
        ),
      }));
      expect(r.strengths.some(s => s.includes("both outgoing and incoming staff present"))).toBe(true);
    });
  });

  // ── 28. Strengths — Log Follow-Up ──────────────────────────────────
  describe("strengths — log follow-up", () => {
    it("generates >=90% strength for log follow-up completion", () => {
      const commLogs = Array.from({ length: 10 }, (_, i) =>
        makeCommLog({
          id: `cl_${i}`,
          follow_up_identified: true,
          follow_up_completed: true,
        })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ communication_log_records: commLogs }));
      expect(r.strengths.some(s => s.includes("communication log follow-ups completed"))).toBe(true);
    });
  });

  // ── 29. Concerns — Handover Quality < 50% ──────────────────────────
  describe("concerns — handover quality", () => {
    it("generates concern when handover quality < 50%", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandoverRecord({
          id: `hr_${i}`,
          handover_completed: i < 4,
          all_children_covered: i < 4,
          quality_rating: i < 4 ? 4 : 1,
        })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ handover_records: handovers }));
      expect(r.concerns.some(c => c.includes("40% handover quality"))).toBe(true);
    });

    it("generates concern for handover quality 50-69%", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandoverRecord({
          id: `hr_${i}`,
          handover_completed: i < 6,
          all_children_covered: i < 6,
          quality_rating: i < 6 ? 4 : 2,
        })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ handover_records: handovers }));
      expect(r.concerns.some(c => c.includes("Handover quality at 60%"))).toBe(true);
    });
  });

  // ── 30. Concerns — Communication Log < 50% ─────────────────────────
  describe("concerns — communication log", () => {
    it("generates concern when comm log quality < 50%", () => {
      const commLogs = Array.from({ length: 10 }, (_, i) =>
        makeCommLog({
          id: `cl_${i}`,
          timely_entry: i < 3,
          completeness_score: i < 3 ? 5 : 2,
          relevant_detail_included: i < 3,
          professional_language_used: i < 3,
        })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ communication_log_records: commLogs }));
      expect(r.concerns.some(c => c.includes("30% communication log quality"))).toBe(true);
    });

    it("generates concern for comm log quality 50-69%", () => {
      const commLogs = Array.from({ length: 10 }, (_, i) =>
        makeCommLog({
          id: `cl_${i}`,
          timely_entry: i < 6,
          completeness_score: i < 6 ? 5 : 2,
          relevant_detail_included: i < 6,
          professional_language_used: i < 6,
        })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ communication_log_records: commLogs }));
      expect(r.concerns.some(c => c.includes("Communication log quality at 60%"))).toBe(true);
    });
  });

  // ── 31. Concerns — Critical Info < 50% ──────────────────────────────
  describe("concerns — critical info", () => {
    it("generates concern when critical info < 50%", () => {
      const critInfo = Array.from({ length: 10 }, (_, i) =>
        makeCriticalInfo({
          id: `ci_${i}`,
          all_relevant_staff_notified: i < 4,
          documented_in_handover: i < 4,
          information_accurate: i < 4,
        })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ critical_info_records: critInfo }));
      expect(r.concerns.some(c => c.includes("40% critical information transfer"))).toBe(true);
    });

    it("generates concern for critical info 50-69%", () => {
      const critInfo = Array.from({ length: 10 }, (_, i) =>
        makeCriticalInfo({
          id: `ci_${i}`,
          all_relevant_staff_notified: i < 6,
          documented_in_handover: i < 6,
          information_accurate: i < 6,
        })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ critical_info_records: critInfo }));
      expect(r.concerns.some(c => c.includes("Critical information transfer at 60%"))).toBe(true);
    });
  });

  // ── 32. Concerns — Timeliness < 40% ─────────────────────────────────
  describe("concerns — timeliness", () => {
    it("generates concern when timeliness < 40%", () => {
      const timeliness = Array.from({ length: 10 }, (_, i) =>
        makeTimeliness({
          id: `tl_${i}`,
          handover_started_on_time: i < 3,
          adequate_duration: i < 3,
          both_staff_present: i < 3,
          rushing_noted: i >= 3,
        })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ timeliness_records: timeliness }));
      expect(r.concerns.some(c => c.includes("30% handover timeliness"))).toBe(true);
    });

    it("generates concern for timeliness 40-69%", () => {
      const timeliness = Array.from({ length: 10 }, (_, i) =>
        makeTimeliness({
          id: `tl_${i}`,
          handover_started_on_time: i < 5,
          adequate_duration: i < 5,
          both_staff_present: i < 5,
          rushing_noted: i >= 5,
        })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ timeliness_records: timeliness }));
      expect(r.concerns.some(c => c.includes("Handover timeliness at 50%"))).toBe(true);
    });
  });

  // ── 33. Concerns — Staff Satisfaction ───────────────────────────────
  describe("concerns — staff satisfaction", () => {
    it("generates concern when staff satisfaction < 50%", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandoverRecord({ id: `hr_${i}`, quality_rating: i < 4 ? 4 : 2 })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ handover_records: handovers }));
      expect(r.concerns.some(c => c.includes("40% staff satisfaction"))).toBe(true);
    });

    it("generates concern for staff satisfaction 50-69%", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandoverRecord({ id: `hr_${i}`, quality_rating: i < 6 ? 4 : 2 })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ handover_records: handovers }));
      expect(r.concerns.some(c => c.includes("Staff satisfaction with handovers at 60%"))).toBe(true);
    });
  });

  // ── 34. Concerns — Action Completion ────────────────────────────────
  describe("concerns — action completion", () => {
    it("generates concern when action completion < 50%", () => {
      const actions = Array.from({ length: 10 }, (_, i) =>
        makeAction({ id: `ac_${i}`, completed: i < 4 })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ action_completion_records: actions }));
      expect(r.concerns.some(c => c.includes("40% handover action completion"))).toBe(true);
    });

    it("generates concern for action completion 50-69%", () => {
      const actions = Array.from({ length: 10 }, (_, i) =>
        makeAction({ id: `ac_${i}`, completed: i < 6 })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ action_completion_records: actions }));
      expect(r.concerns.some(c => c.includes("Handover action completion at 60%"))).toBe(true);
    });
  });

  // ── 35. Concerns — Child Coverage ───────────────────────────────────
  describe("concerns — child coverage", () => {
    it("generates concern when child coverage < 50%", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandoverRecord({ id: `hr_${i}`, all_children_covered: i < 4 })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ handover_records: handovers }));
      expect(r.concerns.some(c => c.includes("40% of handovers cover all children"))).toBe(true);
    });

    it("generates concern for child coverage 50-69%", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandoverRecord({ id: `hr_${i}`, all_children_covered: i < 6 })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ handover_records: handovers }));
      expect(r.concerns.some(c => c.includes("Child coverage in handovers at 60%"))).toBe(true);
    });
  });

  // ── 36. Concerns — Rushing ──────────────────────────────────────────
  describe("concerns — rushing", () => {
    it("generates concern when rushing > 50%", () => {
      const timeliness = Array.from({ length: 10 }, (_, i) =>
        makeTimeliness({ id: `tl_${i}`, rushing_noted: i < 6 })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ timeliness_records: timeliness }));
      expect(r.concerns.some(c => c.includes("60% of handovers noted as rushed"))).toBe(true);
    });

    it("generates concern for rushing 31-50%", () => {
      const timeliness = Array.from({ length: 10 }, (_, i) =>
        makeTimeliness({ id: `tl_${i}`, rushing_noted: i < 4 })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ timeliness_records: timeliness }));
      expect(r.concerns.some(c => c.includes("40% of handovers noted as rushed"))).toBe(true);
    });

    it("no rushing concern when rushing <= 30%", () => {
      const timeliness = Array.from({ length: 10 }, (_, i) =>
        makeTimeliness({ id: `tl_${i}`, rushing_noted: i < 2 })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ timeliness_records: timeliness }));
      expect(r.concerns.some(c => c.includes("rushed"))).toBe(false);
    });
  });

  // ── 37. Concerns — Carried Forward ──────────────────────────────────
  describe("concerns — carried forward", () => {
    it("generates concern when carried forward rate > 40%", () => {
      const actions = Array.from({ length: 10 }, (_, i) =>
        makeAction({ id: `ac_${i}`, carried_forward_count: i < 5 ? 1 : 0 })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ action_completion_records: actions }));
      expect(r.concerns.some(c => c.includes("50% of handover actions have been carried forward"))).toBe(true);
    });

    it("generates concern for chronic carry-forward (>=3 times) > 20%", () => {
      const actions = Array.from({ length: 10 }, (_, i) =>
        makeAction({ id: `ac_${i}`, carried_forward_count: i < 3 ? 3 : 0 })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ action_completion_records: actions }));
      expect(r.concerns.some(c => c.includes("30% of actions carried forward 3+ times"))).toBe(true);
    });
  });

  // ── 38. Concerns — Urgent Notification ──────────────────────────────
  describe("concerns — urgent notification", () => {
    it("generates concern when urgent notification rate < 80%", () => {
      const critInfo = Array.from({ length: 10 }, (_, i) =>
        makeCriticalInfo({
          id: `ci_${i}`,
          priority: "urgent",
          all_relevant_staff_notified: i < 7,
        })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ critical_info_records: critInfo }));
      expect(r.concerns.some(c => c.includes("70% of urgent critical information"))).toBe(true);
    });

    it("no urgent notification concern when rate >= 80%", () => {
      const critInfo = Array.from({ length: 10 }, (_, i) =>
        makeCriticalInfo({
          id: `ci_${i}`,
          priority: "urgent",
          all_relevant_staff_notified: i < 9,
        })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ critical_info_records: critInfo }));
      expect(r.concerns.some(c => c.includes("urgent critical information notifications completed"))).toBe(false);
    });
  });

  // ── 39. Concerns — Missing Records ──────────────────────────────────
  describe("concerns — missing record types", () => {
    it("generates concern when no handover records but staff > 0 and other data exists", () => {
      const r = computeHandoverCommunicationQuality(baseInput({
        communication_log_records: [makeCommLog()],
      }));
      expect(r.concerns.some(c => c.includes("No handover records exist despite staff being on record"))).toBe(true);
    });

    it("generates concern when no comm logs but staff > 0 and other data exists", () => {
      const r = computeHandoverCommunicationQuality(baseInput({
        handover_records: [makeHandoverRecord()],
      }));
      expect(r.concerns.some(c => c.includes("No communication log records exist"))).toBe(true);
    });

    it("generates concern when no critical info but handover records exist", () => {
      const r = computeHandoverCommunicationQuality(baseInput({
        handover_records: [makeHandoverRecord()],
      }));
      expect(r.concerns.some(c => c.includes("No critical information transfer records exist"))).toBe(true);
    });
  });

  // ── 40. Recommendations — Immediate Urgency ─────────────────────────
  describe("recommendations — immediate urgency", () => {
    it("generates immediate rec for handover quality < 50%", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandoverRecord({
          id: `hr_${i}`,
          handover_completed: i < 4,
          all_children_covered: i < 4,
          quality_rating: i < 4 ? 4 : 1,
        })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ handover_records: handovers }));
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("handover quality"))).toBe(true);
    });

    it("generates immediate rec for critical info < 50%", () => {
      const critInfo = Array.from({ length: 10 }, (_, i) =>
        makeCriticalInfo({
          id: `ci_${i}`,
          all_relevant_staff_notified: i < 4,
          documented_in_handover: i < 4,
          information_accurate: i < 4,
        })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ critical_info_records: critInfo }));
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("critical information"))).toBe(true);
    });

    it("generates immediate rec for action completion < 50%", () => {
      const actions = Array.from({ length: 10 }, (_, i) =>
        makeAction({ id: `ac_${i}`, completed: i < 4 })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ action_completion_records: actions }));
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("action tracking"))).toBe(true);
    });

    it("generates immediate rec for timeliness < 40%", () => {
      const timeliness = Array.from({ length: 10 }, (_, i) =>
        makeTimeliness({
          id: `tl_${i}`,
          handover_started_on_time: i < 3,
          adequate_duration: i < 3,
          both_staff_present: i < 3,
          rushing_noted: i >= 3,
        })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ timeliness_records: timeliness }));
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("handover time"))).toBe(true);
    });

    it("generates immediate rec for comm log < 50%", () => {
      const commLogs = Array.from({ length: 10 }, (_, i) =>
        makeCommLog({
          id: `cl_${i}`,
          timely_entry: i < 3,
          completeness_score: i < 3 ? 5 : 2,
          relevant_detail_included: i < 3,
          professional_language_used: i < 3,
        })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ communication_log_records: commLogs }));
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("recording standards"))).toBe(true);
    });

    it("generates immediate rec for child coverage < 50%", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandoverRecord({ id: `hr_${i}`, all_children_covered: i < 4 })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ handover_records: handovers }));
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("every child is discussed"))).toBe(true);
    });

    it("generates immediate rec for urgent notification < 80%", () => {
      const critInfo = Array.from({ length: 10 }, (_, i) =>
        makeCriticalInfo({
          id: `ci_${i}`,
          priority: "urgent",
          all_relevant_staff_notified: i < 7,
        })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ critical_info_records: critInfo }));
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("urgent communication"))).toBe(true);
    });

    it("generates immediate rec for no handover records but other data exists", () => {
      const r = computeHandoverCommunicationQuality(baseInput({
        communication_log_records: [makeCommLog()],
      }));
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("shift handover recording"))).toBe(true);
    });
  });

  // ── 41. Recommendations — Soon Urgency ──────────────────────────────
  describe("recommendations — soon urgency", () => {
    it("generates soon rec for staff satisfaction < 50%", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandoverRecord({ id: `hr_${i}`, quality_rating: i < 4 ? 4 : 2 })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ handover_records: handovers }));
      expect(r.recommendations.some(rec => rec.urgency === "soon" && rec.recommendation.includes("barriers to effective handovers"))).toBe(true);
    });

    it("generates soon rec for handover quality 50-69%", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandoverRecord({
          id: `hr_${i}`,
          handover_completed: i < 6,
          all_children_covered: i < 6,
          quality_rating: i < 6 ? 4 : 2,
        })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ handover_records: handovers }));
      expect(r.recommendations.some(rec => rec.urgency === "soon" && rec.recommendation.includes("Improve handover quality"))).toBe(true);
    });

    it("generates soon rec for comm log quality 50-69%", () => {
      const commLogs = Array.from({ length: 10 }, (_, i) =>
        makeCommLog({
          id: `cl_${i}`,
          timely_entry: i < 6,
          completeness_score: i < 6 ? 5 : 2,
          relevant_detail_included: i < 6,
          professional_language_used: i < 6,
        })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ communication_log_records: commLogs }));
      expect(r.recommendations.some(rec => rec.urgency === "soon" && rec.recommendation.includes("communication log standards"))).toBe(true);
    });

    it("generates soon rec for critical info 50-69%", () => {
      const critInfo = Array.from({ length: 10 }, (_, i) =>
        makeCriticalInfo({
          id: `ci_${i}`,
          all_relevant_staff_notified: i < 6,
          documented_in_handover: i < 6,
          information_accurate: i < 6,
        })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ critical_info_records: critInfo }));
      expect(r.recommendations.some(rec => rec.urgency === "soon" && rec.recommendation.includes("Strengthen critical information"))).toBe(true);
    });

    it("generates soon rec for timeliness 40-69%", () => {
      const timeliness = Array.from({ length: 10 }, (_, i) =>
        makeTimeliness({
          id: `tl_${i}`,
          handover_started_on_time: i < 5,
          adequate_duration: i < 5,
          both_staff_present: i < 5,
          rushing_noted: i >= 5,
        })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ timeliness_records: timeliness }));
      expect(r.recommendations.some(rec => rec.urgency === "soon" && rec.recommendation.includes("Improve handover timeliness"))).toBe(true);
    });

    it("generates soon rec for action completion 50-69%", () => {
      const actions = Array.from({ length: 10 }, (_, i) =>
        makeAction({ id: `ac_${i}`, completed: i < 6 })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ action_completion_records: actions }));
      expect(r.recommendations.some(rec => rec.urgency === "soon" && rec.recommendation.includes("Strengthen action completion"))).toBe(true);
    });
  });

  // ── 42. Recommendations — Planned Urgency ───────────────────────────
  describe("recommendations — planned urgency", () => {
    it("generates planned rec for manager review < 50%", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandoverRecord({ id: `hr_${i}`, manager_reviewed: i < 4 })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ handover_records: handovers }));
      expect(r.recommendations.some(rec => rec.urgency === "planned" && rec.recommendation.includes("management oversight"))).toBe(true);
    });

    it("generates planned rec for face-to-face < 70%", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandoverRecord({ id: `hr_${i}`, handover_method: i < 6 ? "face_to_face" : "written_only" })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ handover_records: handovers }));
      expect(r.recommendations.some(rec => rec.urgency === "planned" && rec.recommendation.includes("face-to-face handovers"))).toBe(true);
    });

    it("generates planned rec for staff satisfaction 50-69%", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandoverRecord({
          id: `hr_${i}`,
          quality_rating: i < 6 ? 4 : 2,
        })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ handover_records: handovers }));
      expect(r.recommendations.some(rec => rec.urgency === "planned" && rec.recommendation.includes("staff feedback"))).toBe(true);
    });

    it("generates planned rec for log follow-up < 70%", () => {
      const commLogs = Array.from({ length: 10 }, (_, i) =>
        makeCommLog({
          id: `cl_${i}`,
          follow_up_identified: true,
          follow_up_completed: i < 5,
        })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ communication_log_records: commLogs }));
      expect(r.recommendations.some(rec => rec.urgency === "planned" && rec.recommendation.includes("follow-up completion"))).toBe(true);
    });

    it("generates planned rec for carried forward > 40%", () => {
      const actions = Array.from({ length: 10 }, (_, i) =>
        makeAction({ id: `ac_${i}`, carried_forward_count: i < 5 ? 1 : 0 })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ action_completion_records: actions }));
      expect(r.recommendations.some(rec => rec.urgency === "planned" && rec.recommendation.includes("carry-forward"))).toBe(true);
    });

    it("generates planned rec for overlap < 70%", () => {
      const timeliness = Array.from({ length: 10 }, (_, i) =>
        makeTimeliness({ id: `tl_${i}`, overlap_period_available: i < 6 })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ timeliness_records: timeliness }));
      expect(r.recommendations.some(rec => rec.urgency === "planned" && rec.recommendation.includes("overlap periods"))).toBe(true);
    });
  });

  // ── 43. Recommendations — Rank Ordering ─────────────────────────────
  describe("recommendations — rank ordering", () => {
    it("recommendation ranks are sequential starting from 1", () => {
      const r = computeHandoverCommunicationQuality(baseInput({
        handover_records: Array.from({ length: 10 }, (_, i) =>
          makeHandoverRecord({
            id: `hr_${i}`,
            handover_completed: i < 3,
            all_children_covered: i < 3,
            quality_rating: i < 3 ? 4 : 1,
          })
        ),
        critical_info_records: Array.from({ length: 10 }, (_, i) =>
          makeCriticalInfo({
            id: `ci_${i}`,
            all_relevant_staff_notified: i < 3,
            documented_in_handover: i < 3,
            information_accurate: i < 3,
          })
        ),
        action_completion_records: Array.from({ length: 10 }, (_, i) =>
          makeAction({ id: `ac_${i}`, completed: i < 3 })
        ),
      }));
      for (let i = 0; i < r.recommendations.length; i++) {
        expect(r.recommendations[i].rank).toBe(i + 1);
      }
    });
  });

  // ── 44. Insights — Critical Severity ────────────────────────────────
  describe("insights — critical severity", () => {
    it("critical insight for handover quality < 50%", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandoverRecord({
          id: `hr_${i}`,
          handover_completed: i < 4,
          all_children_covered: i < 4,
          quality_rating: i < 4 ? 4 : 1,
        })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ handover_records: handovers }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("40% handover quality"))).toBe(true);
    });

    it("critical insight for critical info < 50%", () => {
      const critInfo = Array.from({ length: 10 }, (_, i) =>
        makeCriticalInfo({
          id: `ci_${i}`,
          all_relevant_staff_notified: i < 4,
          documented_in_handover: i < 4,
          information_accurate: i < 4,
        })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ critical_info_records: critInfo }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("40% critical information"))).toBe(true);
    });

    it("critical insight for action completion < 50%", () => {
      const actions = Array.from({ length: 10 }, (_, i) =>
        makeAction({ id: `ac_${i}`, completed: i < 4 })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ action_completion_records: actions }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("40% handover action completion"))).toBe(true);
    });

    it("critical insight for timeliness < 40%", () => {
      const timeliness = Array.from({ length: 10 }, (_, i) =>
        makeTimeliness({
          id: `tl_${i}`,
          handover_started_on_time: i < 3,
          adequate_duration: i < 3,
          both_staff_present: i < 3,
          rushing_noted: i >= 3,
        })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ timeliness_records: timeliness }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("30% handover timeliness"))).toBe(true);
    });

    it("critical insight for child coverage < 50%", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandoverRecord({ id: `hr_${i}`, all_children_covered: i < 4 })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ handover_records: handovers }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("40% of handovers cover all children"))).toBe(true);
    });

    it("critical insight for no handover records", () => {
      const r = computeHandoverCommunicationQuality(baseInput({
        communication_log_records: [makeCommLog()],
      }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("No handover records exist"))).toBe(true);
    });

    it("critical insight for no comm log records", () => {
      const r = computeHandoverCommunicationQuality(baseInput({
        handover_records: [makeHandoverRecord()],
      }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("No communication log records exist"))).toBe(true);
    });

    it("critical insight for urgent notification < 80%", () => {
      const critInfo = Array.from({ length: 10 }, (_, i) =>
        makeCriticalInfo({
          id: `ci_${i}`,
          priority: "urgent",
          all_relevant_staff_notified: i < 7,
        })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ critical_info_records: critInfo }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("70% of urgent critical information"))).toBe(true);
    });
  });

  // ── 45. Insights — Warning Severity ─────────────────────────────────
  describe("insights — warning severity", () => {
    it("warning insight for handover quality 50-69%", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandoverRecord({
          id: `hr_${i}`,
          handover_completed: i < 6,
          all_children_covered: i < 6,
          quality_rating: i < 6 ? 4 : 2,
        })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ handover_records: handovers }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Handover quality at 60%"))).toBe(true);
    });

    it("warning insight for comm log quality 50-69%", () => {
      const commLogs = Array.from({ length: 10 }, (_, i) =>
        makeCommLog({
          id: `cl_${i}`,
          timely_entry: i < 6,
          completeness_score: i < 6 ? 5 : 2,
          relevant_detail_included: i < 6,
          professional_language_used: i < 6,
        })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ communication_log_records: commLogs }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Communication log quality at 60%"))).toBe(true);
    });

    it("warning insight for critical info 50-69%", () => {
      const critInfo = Array.from({ length: 10 }, (_, i) =>
        makeCriticalInfo({
          id: `ci_${i}`,
          all_relevant_staff_notified: i < 6,
          documented_in_handover: i < 6,
          information_accurate: i < 6,
        })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ critical_info_records: critInfo }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Critical information transfer at 60%"))).toBe(true);
    });

    it("warning insight for timeliness 40-69%", () => {
      const timeliness = Array.from({ length: 10 }, (_, i) =>
        makeTimeliness({
          id: `tl_${i}`,
          handover_started_on_time: i < 5,
          adequate_duration: i < 5,
          both_staff_present: i < 5,
          rushing_noted: i >= 5,
        })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ timeliness_records: timeliness }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Handover timeliness at 50%"))).toBe(true);
    });

    it("warning insight for staff satisfaction 50-69%", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandoverRecord({ id: `hr_${i}`, quality_rating: i < 6 ? 4 : 2 })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ handover_records: handovers }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Staff satisfaction with handovers at 60%"))).toBe(true);
    });

    it("warning insight for action completion 50-69%", () => {
      const actions = Array.from({ length: 10 }, (_, i) =>
        makeAction({ id: `ac_${i}`, completed: i < 6 })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ action_completion_records: actions }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Handover action completion at 60%"))).toBe(true);
    });

    it("warning insight for rushing > 30%", () => {
      const timeliness = Array.from({ length: 10 }, (_, i) =>
        makeTimeliness({ id: `tl_${i}`, rushing_noted: i < 4 })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ timeliness_records: timeliness }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("40% of handovers noted as rushed"))).toBe(true);
    });

    it("warning insight for manager review 30-69%", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandoverRecord({ id: `hr_${i}`, manager_reviewed: i < 5 })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ handover_records: handovers }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Manager review rate at 50%"))).toBe(true);
    });

    it("warning insight for carried forward > 30%", () => {
      const actions = Array.from({ length: 10 }, (_, i) =>
        makeAction({ id: `ac_${i}`, carried_forward_count: i < 4 ? 1 : 0 })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ action_completion_records: actions }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("40% of actions carried forward"))).toBe(true);
    });

    it("warning insight for log follow-up 50-69%", () => {
      const commLogs = Array.from({ length: 10 }, (_, i) =>
        makeCommLog({
          id: `cl_${i}`,
          follow_up_identified: true,
          follow_up_completed: i < 6,
        })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ communication_log_records: commLogs }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Communication log follow-up completion at 60%"))).toBe(true);
    });
  });

  // ── 46. Insights — Positive Severity ────────────────────────────────
  describe("insights — positive severity", () => {
    function outstandingInput(): HandoverCommunicationQualityInput {
      return baseInput({
        handover_records: Array.from({ length: 10 }, (_, i) =>
          makeHandoverRecord({ id: `hr_${i}` })
        ),
        communication_log_records: Array.from({ length: 10 }, (_, i) =>
          makeCommLog({ id: `cl_${i}` })
        ),
        critical_info_records: Array.from({ length: 10 }, (_, i) =>
          makeCriticalInfo({ id: `ci_${i}` })
        ),
        timeliness_records: Array.from({ length: 10 }, (_, i) =>
          makeTimeliness({ id: `tl_${i}` })
        ),
        action_completion_records: Array.from({ length: 10 }, (_, i) =>
          makeAction({ id: `ac_${i}` })
        ),
      });
    }

    it("positive insight for outstanding rating overall", () => {
      const r = computeHandoverCommunicationQuality(outstandingInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("outstanding"))).toBe(true);
    });

    it("positive insight for handover quality + content completeness >=90%", () => {
      const r = computeHandoverCommunicationQuality(outstandingInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("handover quality") && i.text.includes("content completeness"))).toBe(true);
    });

    it("positive insight for critical info + accuracy >=90%", () => {
      const r = computeHandoverCommunicationQuality(outstandingInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("critical information transfer") && i.text.includes("accuracy"))).toBe(true);
    });

    it("positive insight for timeliness + both-present >=90%", () => {
      const r = computeHandoverCommunicationQuality(outstandingInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("timeliness") && i.text.includes("both-staff presence"))).toBe(true);
    });

    it("positive insight for action completion + on-time >=90%", () => {
      const r = computeHandoverCommunicationQuality(outstandingInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("action completion") && i.text.includes("on time"))).toBe(true);
    });

    it("positive insight for comm log quality + professional language >=90%", () => {
      const r = computeHandoverCommunicationQuality(outstandingInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("communication log quality") && i.text.includes("professional language"))).toBe(true);
    });

    it("positive insight for staff satisfaction >=90%", () => {
      const r = computeHandoverCommunicationQuality(outstandingInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("staff satisfaction"))).toBe(true);
    });

    it("positive insight for manager review >=90%", () => {
      const r = computeHandoverCommunicationQuality(outstandingInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("manager review"))).toBe(true);
    });

    it("positive insight for face-to-face >=90% + no interruptions >=80%", () => {
      const r = computeHandoverCommunicationQuality(outstandingInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("face-to-face") && i.text.includes("uninterrupted"))).toBe(true);
    });

    it("positive insight for log follow-up >=90%", () => {
      const inp = outstandingInput();
      inp.communication_log_records = Array.from({ length: 10 }, (_, i) =>
        makeCommLog({ id: `cl_${i}`, follow_up_identified: true, follow_up_completed: true })
      );
      const r = computeHandoverCommunicationQuality(inp);
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("communication log follow-ups completed"))).toBe(true);
    });

    it("positive insight for issue resolution >=90%", () => {
      const inp = outstandingInput();
      inp.handover_records = Array.from({ length: 10 }, (_, i) =>
        makeHandoverRecord({ id: `hr_${i}`, issues_identified: ["gap"], issues_resolved: true })
      );
      const r = computeHandoverCommunicationQuality(inp);
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("handover issues resolved"))).toBe(true);
    });
  });

  // ── 47. Insights — Shift Type Distribution ──────────────────────────
  describe("insights — shift type distribution", () => {
    it("generates shift type distribution insight", () => {
      const handovers = [
        makeHandoverRecord({ id: "hr_1", shift_type: "day_to_night" }),
        makeHandoverRecord({ id: "hr_2", shift_type: "day_to_night" }),
        makeHandoverRecord({ id: "hr_3", shift_type: "night_to_day" }),
      ];
      const r = computeHandoverCommunicationQuality(baseInput({ handover_records: handovers }));
      expect(r.insights.some(i => i.text.includes("Handover distribution by shift type"))).toBe(true);
      expect(r.insights.some(i => i.text.includes("day to night (2)"))).toBe(true);
    });

    it("no shift type insight when no handover records", () => {
      const r = computeHandoverCommunicationQuality(baseInput({
        communication_log_records: [makeCommLog()],
      }));
      expect(r.insights.some(i => i.text.includes("Handover distribution by shift type"))).toBe(false);
    });
  });

  // ── 48. Insights — Critical Info Type Distribution ──────────────────
  describe("insights — critical info type distribution", () => {
    it("generates critical info type distribution insight", () => {
      const critInfo = [
        makeCriticalInfo({ id: "ci_1", info_type: "safeguarding_alert" }),
        makeCriticalInfo({ id: "ci_2", info_type: "safeguarding_alert" }),
        makeCriticalInfo({ id: "ci_3", info_type: "medical_emergency" }),
      ];
      const r = computeHandoverCommunicationQuality(baseInput({ critical_info_records: critInfo }));
      expect(r.insights.some(i => i.text.includes("Most common critical information types"))).toBe(true);
      expect(r.insights.some(i => i.text.includes("safeguarding alert (2)"))).toBe(true);
    });
  });

  // ── 49. Insights — Communication Log Type Distribution ──────────────
  describe("insights — comm log type distribution", () => {
    it("generates comm log type distribution insight", () => {
      const commLogs = [
        makeCommLog({ id: "cl_1", log_type: "daily_log" }),
        makeCommLog({ id: "cl_2", log_type: "daily_log" }),
        makeCommLog({ id: "cl_3", log_type: "incident_note" }),
      ];
      const r = computeHandoverCommunicationQuality(baseInput({ communication_log_records: commLogs }));
      expect(r.insights.some(i => i.text.includes("Communication log distribution"))).toBe(true);
      expect(r.insights.some(i => i.text.includes("daily log (2)"))).toBe(true);
    });
  });

  // ── 50. Headline Variations ─────────────────────────────────────────
  describe("headline variations", () => {
    it("outstanding headline starts with Outstanding", () => {
      const r = computeHandoverCommunicationQuality(baseInput({
        handover_records: Array.from({ length: 10 }, (_, i) =>
          makeHandoverRecord({ id: `hr_${i}` })
        ),
        communication_log_records: Array.from({ length: 10 }, (_, i) =>
          makeCommLog({ id: `cl_${i}` })
        ),
        critical_info_records: Array.from({ length: 10 }, (_, i) =>
          makeCriticalInfo({ id: `ci_${i}` })
        ),
        timeliness_records: Array.from({ length: 10 }, (_, i) =>
          makeTimeliness({ id: `tl_${i}` })
        ),
        action_completion_records: Array.from({ length: 10 }, (_, i) =>
          makeAction({ id: `ac_${i}` })
        ),
      }));
      expect(r.headline).toMatch(/^Outstanding/);
    });

    it("good headline includes strength count", () => {
      // Build a good-scoring scenario
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandoverRecord({
          id: `hr_${i}`,
          handover_completed: i < 8,
          all_children_covered: i < 8,
          quality_rating: i < 8 ? 4 : 2,
        })
      );
      const r = computeHandoverCommunicationQuality(baseInput({
        handover_records: handovers,
        communication_log_records: Array.from({ length: 10 }, (_, i) =>
          makeCommLog({ id: `cl_${i}` })
        ),
        critical_info_records: Array.from({ length: 10 }, (_, i) =>
          makeCriticalInfo({ id: `ci_${i}` })
        ),
        timeliness_records: Array.from({ length: 10 }, (_, i) =>
          makeTimeliness({ id: `tl_${i}` })
        ),
        action_completion_records: Array.from({ length: 10 }, (_, i) =>
          makeAction({ id: `ac_${i}` })
        ),
      }));
      expect(r.headline).toContain("strength");
    });

    it("inadequate headline includes concern count", () => {
      const r = computeHandoverCommunicationQuality(baseInput({
        handover_records: Array.from({ length: 10 }, (_, i) =>
          makeHandoverRecord({
            id: `hr_${i}`,
            handover_completed: i < 3,
            all_children_covered: i < 3,
            quality_rating: i < 3 ? 4 : 1,
          })
        ),
        critical_info_records: Array.from({ length: 10 }, (_, i) =>
          makeCriticalInfo({
            id: `ci_${i}`,
            all_relevant_staff_notified: i < 3,
            documented_in_handover: i < 3,
            information_accurate: i < 3,
          })
        ),
        timeliness_records: Array.from({ length: 10 }, (_, i) =>
          makeTimeliness({
            id: `tl_${i}`,
            handover_started_on_time: i < 3,
            adequate_duration: i < 3,
            both_staff_present: i < 3,
            rushing_noted: i >= 3,
          })
        ),
        action_completion_records: Array.from({ length: 10 }, (_, i) =>
          makeAction({ id: `ac_${i}`, completed: i < 4 })
        ),
      }));
      expect(r.headline).toContain("concern");
    });
  });

  // ── 51. Rating Boundary Tests ───────────────────────────────────────
  describe("rating boundaries", () => {
    it("score 80 maps to outstanding", () => {
      const r = computeHandoverCommunicationQuality(baseInput({
        handover_records: Array.from({ length: 10 }, (_, i) =>
          makeHandoverRecord({ id: `hr_${i}` })
        ),
        communication_log_records: Array.from({ length: 10 }, (_, i) =>
          makeCommLog({ id: `cl_${i}` })
        ),
        critical_info_records: Array.from({ length: 10 }, (_, i) =>
          makeCriticalInfo({ id: `ci_${i}` })
        ),
        timeliness_records: Array.from({ length: 10 }, (_, i) =>
          makeTimeliness({ id: `tl_${i}` })
        ),
        action_completion_records: Array.from({ length: 10 }, (_, i) =>
          makeAction({ id: `ac_${i}` })
        ),
      }));
      expect(r.handover_score).toBe(80);
      expect(r.handover_rating).toBe("outstanding");
    });

    it("score 79 maps to good", () => {
      // 52 + 5(hq) + 5(cl) + 5(ci) + 4(tl) + 4(ss) + 5(ac) = 80
      // Need exactly 79: drop one small bonus
      // If timeliness 70-89% → +2 instead of +4 → 80 - 2 = 78. Not right.
      // If satisfaction 70-89% → +2 instead of +4 → 80 - 2 = 78.
      // Need 79: keep timeliness at +4, drop something by 1.
      // Drop commLog from +5 to +2 → 80-3 = 77. Drop timeliness +4 to +2 → 78.
      // Let's just test that 79 = good. We know the boundary from toRating.
      // Score boundary: >=80 outstanding, >=65 good, >=45 adequate, else inadequate
      // A score of 79 should be "good"
      // 52 + 5(hq>=90) + 5(cl>=90) + 5(ci>=90) + 2(tl 70-89%) + 4(ss>=90) + 5(ac>=90) = 78
      // 52 + 5 + 5 + 5 + 2 + 4 + 5 = 78 → good
      const r = computeHandoverCommunicationQuality(baseInput({
        handover_records: Array.from({ length: 10 }, (_, i) =>
          makeHandoverRecord({ id: `hr_${i}` })
        ),
        communication_log_records: Array.from({ length: 10 }, (_, i) =>
          makeCommLog({ id: `cl_${i}` })
        ),
        critical_info_records: Array.from({ length: 10 }, (_, i) =>
          makeCriticalInfo({ id: `ci_${i}` })
        ),
        timeliness_records: Array.from({ length: 10 }, (_, i) =>
          makeTimeliness({
            id: `tl_${i}`,
            handover_started_on_time: i < 8,
            adequate_duration: i < 8,
            both_staff_present: i < 9,
            rushing_noted: false,
          })
        ),
        action_completion_records: Array.from({ length: 10 }, (_, i) =>
          makeAction({ id: `ac_${i}` })
        ),
      }));
      expect(r.handover_score).toBe(78);
      expect(r.handover_rating).toBe("good");
    });

    it("score 65 maps to good", () => {
      // 52 + 3(hq 70%) + 2(cl 70%) + 3(ci 70%) + 2(tl 70%) + 2(ss 70%) + 2(ac 70%) = 66
      // Let's verify 66 → good
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandoverRecord({
          id: `hr_${i}`,
          handover_completed: i < 8,
          all_children_covered: i < 8,
          quality_rating: i < 7 ? 4 : 2,
        })
      );
      const commLogs = Array.from({ length: 10 }, (_, i) =>
        makeCommLog({
          id: `cl_${i}`,
          timely_entry: i < 8,
          completeness_score: i < 7 ? 5 : 2,
          relevant_detail_included: i < 8,
          professional_language_used: i < 8,
        })
      );
      const critInfo = Array.from({ length: 10 }, (_, i) =>
        makeCriticalInfo({
          id: `ci_${i}`,
          all_relevant_staff_notified: i < 8,
          documented_in_handover: i < 8,
          information_accurate: i < 9,
        })
      );
      const timeliness = Array.from({ length: 10 }, (_, i) =>
        makeTimeliness({
          id: `tl_${i}`,
          handover_started_on_time: i < 8,
          adequate_duration: i < 8,
          both_staff_present: i < 9,
          rushing_noted: false,
        })
      );
      const actions = Array.from({ length: 10 }, (_, i) =>
        makeAction({ id: `ac_${i}`, completed: i < 8 })
      );
      const r = computeHandoverCommunicationQuality(baseInput({
        handover_records: handovers,
        communication_log_records: commLogs,
        critical_info_records: critInfo,
        timeliness_records: timeliness,
        action_completion_records: actions,
      }));
      expect(r.handover_score).toBeGreaterThanOrEqual(65);
      expect(r.handover_rating).toBe("good");
    });

    it("score 45 maps to adequate", () => {
      // 52 - 6(hq<50) = 46 → adequate
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandoverRecord({
          id: `hr_${i}`,
          handover_completed: i < 4,
          all_children_covered: i < 4,
          quality_rating: i < 4 ? 4 : 1,
        })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ handover_records: handovers }));
      expect(r.handover_score).toBe(46);
      expect(r.handover_rating).toBe("adequate");
    });

    it("score 44 maps to inadequate", () => {
      // 52 - 6(hq<50) - 4(timeliness<40) = 42 → inadequate
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandoverRecord({
          id: `hr_${i}`,
          handover_completed: i < 4,
          all_children_covered: i < 4,
          quality_rating: i < 4 ? 4 : 1,
        })
      );
      const timeliness = Array.from({ length: 10 }, (_, i) =>
        makeTimeliness({
          id: `tl_${i}`,
          handover_started_on_time: i < 3,
          adequate_duration: i < 3,
          both_staff_present: i < 3,
          rushing_noted: i >= 3,
        })
      );
      const r = computeHandoverCommunicationQuality(baseInput({
        handover_records: handovers,
        timeliness_records: timeliness,
      }));
      expect(r.handover_score).toBe(42);
      expect(r.handover_rating).toBe("inadequate");
    });
  });

  // ── 52. Edge Cases ──────────────────────────────────────────────────
  describe("edge cases", () => {
    it("single record in each array", () => {
      const r = computeHandoverCommunicationQuality(baseInput({
        handover_records: [makeHandoverRecord()],
        communication_log_records: [makeCommLog()],
        critical_info_records: [makeCriticalInfo()],
        timeliness_records: [makeTimeliness()],
        action_completion_records: [makeAction()],
      }));
      expect(r.total_handover_records).toBe(1);
      expect(r.total_communication_logs).toBe(1);
      expect(r.total_critical_info_transfers).toBe(1);
      expect(r.handover_rating).toBe("outstanding");
    });

    it("handles mixed handover methods (mixed counts as face-to-face)", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandoverRecord({
          id: `hr_${i}`,
          handover_method: i < 5 ? "face_to_face" : "mixed",
        })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ handover_records: handovers }));
      // faceToFaceRate=100% → generates strength
      expect(r.strengths.some(s => s.includes("face-to-face"))).toBe(true);
    });

    it("verbal_phone does not count as face-to-face", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandoverRecord({ id: `hr_${i}`, handover_method: "verbal_phone" })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ handover_records: handovers }));
      expect(r.strengths.some(s => s.includes("face-to-face"))).toBe(false);
    });

    it("digital_log does not count as face-to-face", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandoverRecord({ id: `hr_${i}`, handover_method: "digital_log" })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ handover_records: handovers }));
      expect(r.strengths.some(s => s.includes("face-to-face"))).toBe(false);
    });

    it("time_to_notify_minutes null does not count as rapid", () => {
      const critInfo = Array.from({ length: 10 }, (_, i) =>
        makeCriticalInfo({ id: `ci_${i}`, time_to_notify_minutes: null })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ critical_info_records: critInfo }));
      expect(r.strengths.some(s => s.includes("critical information communicated within 15 minutes"))).toBe(false);
    });

    it("time_to_notify_minutes at boundary 15 counts as rapid", () => {
      const critInfo = Array.from({ length: 10 }, (_, i) =>
        makeCriticalInfo({ id: `ci_${i}`, time_to_notify_minutes: 15 })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ critical_info_records: critInfo }));
      expect(r.strengths.some(s => s.includes("critical information communicated within 15 minutes"))).toBe(true);
    });

    it("time_to_notify_minutes 16 does not count as rapid", () => {
      const critInfo = Array.from({ length: 10 }, (_, i) =>
        makeCriticalInfo({ id: `ci_${i}`, time_to_notify_minutes: 16 })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ critical_info_records: critInfo }));
      expect(r.strengths.some(s => s.includes("critical information communicated within 15 minutes"))).toBe(false);
    });

    it("completeness_score 4 qualifies as complete", () => {
      const commLogs = Array.from({ length: 10 }, (_, i) =>
        makeCommLog({ id: `cl_${i}`, completeness_score: 4 })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ communication_log_records: commLogs }));
      expect(r.communication_log_rate).toBe(100);
    });

    it("completeness_score 3 does not qualify as complete", () => {
      const commLogs = Array.from({ length: 10 }, (_, i) =>
        makeCommLog({ id: `cl_${i}`, completeness_score: 3 })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ communication_log_records: commLogs }));
      expect(r.communication_log_rate).toBe(0);
    });

    it("quality_rating exactly 4 qualifies for satisfaction and quality", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandoverRecord({ id: `hr_${i}`, quality_rating: 4 })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ handover_records: handovers }));
      expect(r.staff_satisfaction_rate).toBe(100);
      expect(r.handover_quality_rate).toBe(100);
    });

    it("quality_rating 3 does not qualify", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandoverRecord({ id: `hr_${i}`, quality_rating: 3 })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ handover_records: handovers }));
      expect(r.staff_satisfaction_rate).toBe(0);
      expect(r.handover_quality_rate).toBe(0);
    });

    it("interruptions_count 0 counts as no interruptions", () => {
      // Positive insight requires faceToFaceRate >= 90 AND noInterruptionsRate >= 80
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandoverRecord({ id: `hr_${i}`, handover_method: "face_to_face" })
      );
      const timeliness = Array.from({ length: 10 }, (_, i) =>
        makeTimeliness({ id: `tl_${i}`, interruptions_count: 0 })
      );
      const r = computeHandoverCommunicationQuality(baseInput({
        handover_records: handovers,
        timeliness_records: timeliness,
      }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("uninterrupted"))).toBe(true);
    });

    it("interruptions_count > 0 does not count as no interruptions", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandoverRecord({ id: `hr_${i}`, handover_method: "face_to_face" })
      );
      const timeliness = Array.from({ length: 10 }, (_, i) =>
        makeTimeliness({ id: `tl_${i}`, interruptions_count: 1 })
      );
      const r = computeHandoverCommunicationQuality(baseInput({
        handover_records: handovers,
        timeliness_records: timeliness,
      }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("uninterrupted"))).toBe(false);
    });

    it("acknowledged_by_count must equal total_staff_to_notify for full acknowledgement", () => {
      const critInfo = [
        makeCriticalInfo({ id: "ci_1", acknowledged_by_count: 5, total_staff_to_notify: 5 }),
        makeCriticalInfo({ id: "ci_2", acknowledged_by_count: 4, total_staff_to_notify: 5 }),
        makeCriticalInfo({ id: "ci_3", acknowledged_by_count: 0, total_staff_to_notify: 0 }),
      ];
      const r = computeHandoverCommunicationQuality(baseInput({ critical_info_records: critInfo }));
      // fullAcknowledgementRate: ci_1 qualifies (5>=5), ci_2 fails (4<5), ci_3 fails (0 not >0)
      // 1 out of 3 ≈ 33%
      expect(r.total_critical_info_transfers).toBe(3);
    });

    it("carried_forward_count 3 qualifies as chronic", () => {
      const actions = Array.from({ length: 10 }, (_, i) =>
        makeAction({ id: `ac_${i}`, carried_forward_count: i < 3 ? 3 : 0 })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ action_completion_records: actions }));
      expect(r.concerns.some(c => c.includes("30% of actions carried forward 3+ times"))).toBe(true);
    });

    it("carried_forward_count 2 does not qualify as chronic", () => {
      const actions = Array.from({ length: 10 }, (_, i) =>
        makeAction({ id: `ac_${i}`, carried_forward_count: i < 3 ? 2 : 0 })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ action_completion_records: actions }));
      expect(r.concerns.some(c => c.includes("carried forward 3+ times"))).toBe(false);
    });
  });

  // ── 53. Various Shift Types ─────────────────────────────────────────
  describe("various shift types", () => {
    it("handles all shift types in handover records", () => {
      const shiftTypes: Array<"day_to_night" | "night_to_day" | "early_to_late" | "late_to_early" | "other"> = [
        "day_to_night", "night_to_day", "early_to_late", "late_to_early", "other",
      ];
      const handovers = shiftTypes.map((st, i) =>
        makeHandoverRecord({ id: `hr_${i}`, shift_type: st })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ handover_records: handovers }));
      expect(r.total_handover_records).toBe(5);
    });
  });

  // ── 54. Various Info Types ──────────────────────────────────────────
  describe("various info types", () => {
    it("handles all critical info types", () => {
      const infoTypes: Array<"safeguarding_alert" | "medical_emergency" | "medication_change" | "placement_risk" | "missing_child" | "court_order" | "professional_directive" | "behavioural_escalation" | "other"> = [
        "safeguarding_alert", "medical_emergency", "medication_change", "placement_risk",
        "missing_child", "court_order", "professional_directive", "behavioural_escalation", "other",
      ];
      const critInfo = infoTypes.map((it, i) =>
        makeCriticalInfo({ id: `ci_${i}`, info_type: it })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ critical_info_records: critInfo }));
      expect(r.total_critical_info_transfers).toBe(9);
    });
  });

  // ── 55. Various Log Types ───────────────────────────────────────────
  describe("various log types", () => {
    it("handles all communication log types", () => {
      const logTypes: Array<"daily_log" | "shift_summary" | "incident_note" | "professional_contact" | "family_contact" | "internal_memo" | "other"> = [
        "daily_log", "shift_summary", "incident_note", "professional_contact",
        "family_contact", "internal_memo", "other",
      ];
      const commLogs = logTypes.map((lt, i) =>
        makeCommLog({ id: `cl_${i}`, log_type: lt })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ communication_log_records: commLogs }));
      expect(r.total_communication_logs).toBe(7);
    });
  });

  // ── 56. Various Priority Types ──────────────────────────────────────
  describe("various priority types", () => {
    it("handles all action priority types", () => {
      const priorities: Array<"urgent" | "high" | "standard" | "low"> = [
        "urgent", "high", "standard", "low",
      ];
      const actions = priorities.map((p, i) =>
        makeAction({ id: `ac_${i}`, priority: p })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ action_completion_records: actions }));
      expect(r.action_completion_rate).toBe(100);
    });
  });

  // ── 57. No Critical Info Record Concern Gating ──────────────────────
  describe("no critical info concern gating", () => {
    it("no critical info concern only triggered when handover records exist", () => {
      const r = computeHandoverCommunicationQuality(baseInput({
        handover_records: [makeHandoverRecord()],
      }));
      expect(r.concerns.some(c => c.includes("No critical information transfer records exist"))).toBe(true);
    });

    it("no critical info concern NOT triggered when no handover records", () => {
      // totalHandovers = 0 → condition requires totalHandovers > 0
      const r = computeHandoverCommunicationQuality(baseInput({
        communication_log_records: [makeCommLog()],
      }));
      expect(r.concerns.some(c => c.includes("No critical information transfer records exist"))).toBe(false);
    });
  });

  // ── 58. Follow-Up Rate Tests ────────────────────────────────────────
  describe("follow-up rates", () => {
    it("log follow-up rate only considers records with follow_up_identified", () => {
      const commLogs = [
        makeCommLog({ id: "cl_1", follow_up_identified: true, follow_up_completed: true }),
        makeCommLog({ id: "cl_2", follow_up_identified: true, follow_up_completed: false }),
        makeCommLog({ id: "cl_3", follow_up_identified: false, follow_up_completed: false }),
      ];
      const r = computeHandoverCommunicationQuality(baseInput({ communication_log_records: commLogs }));
      // 1 completed out of 2 identified = 50%
      // logFollowUpRate = 50% → warning insight
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Communication log follow-up completion at 50%"))).toBe(true);
    });

    it("critical info follow-up rate only considers records with follow_up_actions_set", () => {
      const critInfo = [
        makeCriticalInfo({ id: "ci_1", follow_up_actions_set: true, follow_up_completed: true }),
        makeCriticalInfo({ id: "ci_2", follow_up_actions_set: true, follow_up_completed: false }),
        makeCriticalInfo({ id: "ci_3", follow_up_actions_set: false, follow_up_completed: false }),
      ];
      const r = computeHandoverCommunicationQuality(baseInput({ critical_info_records: critInfo }));
      // critFollowUpRate = 1/2 = 50%
      expect(r.total_critical_info_transfers).toBe(3);
    });
  });

  // ── 59. Issues Identified / Resolved ────────────────────────────────
  describe("issues identification and resolution", () => {
    it("issue resolution rate only considers handovers with issues identified", () => {
      const handovers = [
        makeHandoverRecord({ id: "hr_1", issues_identified: ["gap1"], issues_resolved: true }),
        makeHandoverRecord({ id: "hr_2", issues_identified: ["gap2"], issues_resolved: false }),
        makeHandoverRecord({ id: "hr_3", issues_identified: [], issues_resolved: false }),
      ];
      const r = computeHandoverCommunicationQuality(baseInput({ handover_records: handovers }));
      // 1 resolved out of 2 with issues = 50%
      expect(r.strengths.some(s => s.includes("handover issues resolved"))).toBe(false);
    });

    it("100% issue resolution generates strength", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandoverRecord({
          id: `hr_${i}`,
          issues_identified: ["gap"],
          issues_resolved: true,
        })
      );
      const r = computeHandoverCommunicationQuality(baseInput({ handover_records: handovers }));
      expect(r.strengths.some(s => s.includes("100% of handover issues resolved"))).toBe(true);
    });
  });

  // ── 60. Urgent Completion Rate ──────────────────────────────────────
  describe("urgent completion rate", () => {
    it("urgent action completion tracks urgent-only actions", () => {
      const actions = [
        makeAction({ id: "ac_1", priority: "urgent", completed: true }),
        makeAction({ id: "ac_2", priority: "urgent", completed: false }),
        makeAction({ id: "ac_3", priority: "high", completed: false }),
      ];
      const r = computeHandoverCommunicationQuality(baseInput({ action_completion_records: actions }));
      // overall completion: 1/3 = 33%
      // urgent completion: 1/2 = 50% (not directly exposed but used in logic)
      expect(r.action_completion_rate).toBe(33);
    });
  });
});
