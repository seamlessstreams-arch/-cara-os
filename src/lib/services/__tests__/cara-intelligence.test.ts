// ══════════════════════════════════════════════════════════════════════════════
// CARA — Cara INTELLIGENCE DETECTION TESTS
// Pure-function unit tests for all 8 detection engines.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "../cara-intelligence";

const {
  detectOverdueForms,
  detectMissingOversight,
  detectWeakRecording,
  detectStaffingConcerns,
  detectComplianceGaps,
  detectIncidentTrends,
  detectPositivePatterns,
  detectHandoverGaps,
} = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Build an ISO date string offset by `days` from `base`. Negative = past. */
function daysFromNow(days: number, base: Date = new Date("2025-06-01T12:00:00Z")): string {
  return new Date(base.getTime() + days * 86400000).toISOString();
}

const NOW = new Date("2025-06-01T12:00:00Z");

// ── detectOverdueForms ─────────────────────────────────────────────────────

describe("detectOverdueForms", () => {
  it("should return empty when no submissions are overdue", () => {
    const submissions = [
      { id: "1", status: "approved", due_date: daysFromNow(-5), template_id: "t1", linked_child_id: "c1" },
      { id: "2", status: "draft", due_date: daysFromNow(3), template_id: "t2", linked_child_id: "c2" },
      { id: "3", status: "rejected", due_date: daysFromNow(-10), template_id: "t3", linked_child_id: null },
    ];
    expect(detectOverdueForms(submissions, NOW)).toEqual([]);
  });

  it("should return empty when all overdue submissions have terminal statuses", () => {
    const submissions = [
      { id: "1", status: "approved", due_date: daysFromNow(-20), template_id: "t1", linked_child_id: "c1" },
      { id: "2", status: "archived", due_date: daysFromNow(-15), template_id: "t2", linked_child_id: "c2" },
      { id: "3", status: "rejected", due_date: daysFromNow(-8), template_id: "t3", linked_child_id: null },
    ];
    expect(detectOverdueForms(submissions, NOW)).toEqual([]);
  });

  it("should detect overdue forms with correct count and max_days_overdue", () => {
    const submissions = [
      { id: "1", status: "draft", due_date: daysFromNow(-3), template_id: "t1", linked_child_id: "c1" },
      { id: "2", status: "pending_review", due_date: daysFromNow(-10), template_id: "t2", linked_child_id: "c2" },
    ];
    const results = detectOverdueForms(submissions, NOW);
    expect(results).toHaveLength(1);
    expect(results[0].recommendation_type).toBe("overdue_form");
    expect(results[0].supporting_data?.overdue_count).toBe(2);
    expect(results[0].supporting_data?.max_days_overdue).toBe(10);
  });

  it("should assign severity 'low' for <=7 days overdue", () => {
    const submissions = [
      { id: "1", status: "draft", due_date: daysFromNow(-5), template_id: "t1", linked_child_id: null },
    ];
    const results = detectOverdueForms(submissions, NOW);
    expect(results[0].severity).toBe("low");
  });

  it("should assign severity 'medium' for 8-14 days overdue", () => {
    const submissions = [
      { id: "1", status: "draft", due_date: daysFromNow(-10), template_id: "t1", linked_child_id: null },
    ];
    const results = detectOverdueForms(submissions, NOW);
    expect(results[0].severity).toBe("medium");
  });

  it("should assign severity 'high' for >14 days overdue", () => {
    const submissions = [
      { id: "1", status: "draft", due_date: daysFromNow(-20), template_id: "t1", linked_child_id: null },
    ];
    const results = detectOverdueForms(submissions, NOW);
    expect(results[0].severity).toBe("high");
  });
});

// ── detectMissingOversight ─────────────────────────────────────────────────

describe("detectMissingOversight", () => {
  it("should return empty for non-significant record types", () => {
    const records = [
      { id: "1", type: "daily_log", reference: "DL-001", created_at: daysFromNow(-5), has_oversight: false },
      { id: "2", type: "activity", reference: "ACT-001", created_at: daysFromNow(-5), has_oversight: false },
    ];
    expect(detectMissingOversight(records, NOW)).toEqual([]);
  });

  it("should ignore records that already have oversight", () => {
    const records = [
      { id: "1", type: "incident", reference: "INC-001", created_at: daysFromNow(-5), has_oversight: true },
      { id: "2", type: "safeguarding", reference: "SG-001", created_at: daysFromNow(-3), has_oversight: true },
    ];
    expect(detectMissingOversight(records, NOW)).toEqual([]);
  });

  it("should ignore significant records less than 48 hours old", () => {
    const recentDate = new Date(NOW.getTime() - 24 * 3600000).toISOString(); // 24h ago
    const records = [
      { id: "1", type: "incident", reference: "INC-001", created_at: recentDate, has_oversight: false },
    ];
    expect(detectMissingOversight(records, NOW)).toEqual([]);
  });

  it("should detect missing oversight for significant records >48h old", () => {
    const records = [
      { id: "1", type: "incident", reference: "INC-001", created_at: daysFromNow(-3), has_oversight: false },
      { id: "2", type: "restraint", reference: "RST-001", created_at: daysFromNow(-4), has_oversight: false },
    ];
    const results = detectMissingOversight(records, NOW);
    expect(results).toHaveLength(1);
    expect(results[0].recommendation_type).toBe("missing_oversight");
    expect(results[0].data_points).toBe(2);
  });

  it("should assign severity 'medium' for 1 record", () => {
    const records = [
      { id: "1", type: "safeguarding", reference: "SG-001", created_at: daysFromNow(-5), has_oversight: false },
    ];
    const results = detectMissingOversight(records, NOW);
    expect(results[0].severity).toBe("medium");
  });

  it("should assign severity 'high' for 2-3 records", () => {
    const records = [
      { id: "1", type: "incident", reference: "INC-001", created_at: daysFromNow(-3), has_oversight: false },
      { id: "2", type: "complaint", reference: "CMP-001", created_at: daysFromNow(-4), has_oversight: false },
    ];
    const results = detectMissingOversight(records, NOW);
    expect(results[0].severity).toBe("high");
  });

  it("should assign severity 'critical' for >3 records", () => {
    const records = [
      { id: "1", type: "incident", reference: "INC-001", created_at: daysFromNow(-3), has_oversight: false },
      { id: "2", type: "restraint", reference: "RST-001", created_at: daysFromNow(-4), has_oversight: false },
      { id: "3", type: "missing_episode", reference: "ME-001", created_at: daysFromNow(-5), has_oversight: false },
      { id: "4", type: "medication_error", reference: "MED-001", created_at: daysFromNow(-6), has_oversight: false },
    ];
    const results = detectMissingOversight(records, NOW);
    expect(results[0].severity).toBe("critical");
  });
});

// ── detectWeakRecording ────────────────────────────────────────────────────

describe("detectWeakRecording", () => {
  const childNames: Record<string, string> = { c1: "Alex", c2: "Jordan" };

  it("should return empty when entries are long and have mood scores", () => {
    const logs = Array.from({ length: 8 }, (_, i) => ({
      id: `log-${i}`,
      content: "This is a sufficiently long daily log entry that captures the day well and exceeds fifty characters.",
      child_id: "c1",
      date: daysFromNow(-i),
      mood_score: 7,
    }));
    expect(detectWeakRecording(logs, childNames)).toEqual([]);
  });

  it("should not flag short entries when total logs < 5", () => {
    const logs = [
      { id: "1", content: "Short", child_id: "c1", date: daysFromNow(-1), mood_score: 5 },
      { id: "2", content: "Short", child_id: "c1", date: daysFromNow(-2), mood_score: 5 },
      { id: "3", content: "Short", child_id: "c1", date: daysFromNow(-3), mood_score: 5 },
    ];
    expect(detectWeakRecording(logs, childNames)).toEqual([]);
  });

  it("should detect short entries when >50% are under 50 chars with >=5 logs", () => {
    const logs = [
      { id: "1", content: "Short entry", child_id: "c1", date: daysFromNow(-1), mood_score: 5 },
      { id: "2", content: "Brief note", child_id: "c1", date: daysFromNow(-2), mood_score: 6 },
      { id: "3", content: "Quick note here", child_id: "c1", date: daysFromNow(-3), mood_score: 4 },
      { id: "4", content: "Good day all round, child seemed happy and engaged throughout activities and at mealtimes.", child_id: "c1", date: daysFromNow(-4), mood_score: 7 },
      { id: "5", content: "Ok", child_id: "c1", date: daysFromNow(-5), mood_score: 5 },
    ];
    const results = detectWeakRecording(logs, childNames);
    const shortEntryResult = results.find((r) => r.title.includes("Brief daily log"));
    expect(shortEntryResult).toBeDefined();
    expect(shortEntryResult!.severity).toBe("medium");
    expect(shortEntryResult!.linked_child_id).toBe("c1");
  });

  it("should detect missing mood scores when >60% are null with >=7 logs", () => {
    const logs = Array.from({ length: 7 }, (_, i) => ({
      id: `log-${i}`,
      content: "This is a detailed daily log entry that is long enough to avoid the short-entry check.",
      child_id: "c1",
      date: daysFromNow(-i),
      mood_score: i < 2 ? 5 : null, // 2 with mood, 5 without (71% null)
    }));
    const results = detectWeakRecording(logs, childNames);
    const moodResult = results.find((r) => r.title.includes("Missing mood scores"));
    expect(moodResult).toBeDefined();
    expect(moodResult!.severity).toBe("low");
  });

  it("should not flag missing mood scores when exactly 60% are null", () => {
    // 5 logs total, 3 null = 60% -> not > 60%, but also < 7 logs
    // Use 10 logs: 6 null = 60% -> not > 60%
    const logs = Array.from({ length: 10 }, (_, i) => ({
      id: `log-${i}`,
      content: "A well-written daily log entry with enough detail to pass the length check.",
      child_id: "c1",
      date: daysFromNow(-i),
      mood_score: i < 4 ? 5 : null, // 4 with mood, 6 without (60% null - boundary)
    }));
    const results = detectWeakRecording(logs, childNames);
    const moodResult = results.find((r) => r.title.includes("Missing mood scores"));
    expect(moodResult).toBeUndefined();
  });

  it("should group by child and report per-child", () => {
    const logs = [
      // c1: all short (5 logs, 100% short)
      ...Array.from({ length: 5 }, (_, i) => ({
        id: `c1-${i}`, content: "Brief", child_id: "c1", date: daysFromNow(-i), mood_score: 5,
      })),
      // c2: all long (5 logs)
      ...Array.from({ length: 5 }, (_, i) => ({
        id: `c2-${i}`, content: "A detailed and thorough log entry covering the child's day in full detail.", child_id: "c2", date: daysFromNow(-i), mood_score: 7,
      })),
    ];
    const results = detectWeakRecording(logs, childNames);
    expect(results).toHaveLength(1);
    expect(results[0].linked_child_id).toBe("c1");
  });
});

// ── detectStaffingConcerns ─────────────────────────────────────────────────

describe("detectStaffingConcerns", () => {
  it("should return empty when all shifts are filled and no consecutive runs", () => {
    const shifts = [
      { staff_id: "s1", date: daysFromNow(1), shift_type: "day", actual_start: null, actual_end: null, status: "scheduled" },
      { staff_id: "s2", date: daysFromNow(3), shift_type: "night", actual_start: null, actual_end: null, status: "scheduled" },
    ];
    expect(detectStaffingConcerns(shifts, NOW)).toEqual([]);
  });

  it("should detect open shifts (no staff_id, within next 7 days)", () => {
    const shifts = [
      { staff_id: "", date: daysFromNow(1), shift_type: "day", actual_start: null, actual_end: null, status: "scheduled" },
      { staff_id: "", date: daysFromNow(2), shift_type: "night", actual_start: null, actual_end: null, status: "scheduled" },
    ];
    const results = detectStaffingConcerns(shifts, NOW);
    const openShiftResult = results.find((r) => r.recommendation_type === "staffing_concern");
    expect(openShiftResult).toBeDefined();
    expect(openShiftResult!.supporting_data?.open_shift_count).toBe(2);
  });

  it("should not count open shifts beyond 7 days", () => {
    const shifts = [
      { staff_id: "", date: daysFromNow(10), shift_type: "day", actual_start: null, actual_end: null, status: "scheduled" },
    ];
    const results = detectStaffingConcerns(shifts, NOW);
    const openShiftResult = results.find((r) => r.recommendation_type === "staffing_concern");
    expect(openShiftResult).toBeUndefined();
  });

  it("should detect consecutive shifts >=6 for a staff member", () => {
    const shifts = Array.from({ length: 7 }, (_, i) => ({
      staff_id: "s1",
      date: daysFromNow(-i),
      shift_type: "day",
      actual_start: daysFromNow(-i),
      actual_end: daysFromNow(-i),
      status: "completed",
    }));
    const results = detectStaffingConcerns(shifts, NOW);
    const consecutiveResult = results.find((r) => r.recommendation_type === "wellbeing_concern");
    expect(consecutiveResult).toBeDefined();
    expect(consecutiveResult!.supporting_data?.consecutive_days).toBe(7);
    expect(consecutiveResult!.severity).toBe("medium");
  });

  it("should assign severity 'high' for >=8 consecutive days", () => {
    const shifts = Array.from({ length: 9 }, (_, i) => ({
      staff_id: "s1",
      date: daysFromNow(-i),
      shift_type: "day",
      actual_start: daysFromNow(-i),
      actual_end: daysFromNow(-i),
      status: "completed",
    }));
    const results = detectStaffingConcerns(shifts, NOW);
    const consecutiveResult = results.find((r) => r.recommendation_type === "wellbeing_concern");
    expect(consecutiveResult).toBeDefined();
    expect(consecutiveResult!.severity).toBe("high");
  });

  it("should not flag 5 consecutive days", () => {
    const shifts = Array.from({ length: 5 }, (_, i) => ({
      staff_id: "s1",
      date: daysFromNow(-i),
      shift_type: "day",
      actual_start: daysFromNow(-i),
      actual_end: daysFromNow(-i),
      status: "completed",
    }));
    const results = detectStaffingConcerns(shifts, NOW);
    const consecutiveResult = results.find((r) => r.recommendation_type === "wellbeing_concern");
    expect(consecutiveResult).toBeUndefined();
  });
});

// ── detectComplianceGaps ───────────────────────────────────────────────────

describe("detectComplianceGaps", () => {
  it("should return empty when training is current and supervisions are done", () => {
    const training = [
      { staff_id: "s1", course_name: "Safeguarding", status: "completed", expiry_date: daysFromNow(30), is_mandatory: true },
    ];
    const supervisions = [
      { staff_id: "s1", status: "completed", scheduled_date: daysFromNow(-10), actual_date: daysFromNow(-9) },
    ];
    expect(detectComplianceGaps(training, supervisions, NOW)).toEqual([]);
  });

  it("should detect expired mandatory training", () => {
    const training = [
      { staff_id: "s1", course_name: "First Aid", status: "expired", expiry_date: daysFromNow(-10), is_mandatory: true },
      { staff_id: "s2", course_name: "Safeguarding", status: "overdue", expiry_date: daysFromNow(-5), is_mandatory: true },
    ];
    const results = detectComplianceGaps(training, [], NOW);
    const trainingResult = results.find((r) => r.recommendation_type === "training_due");
    expect(trainingResult).toBeDefined();
    expect(trainingResult!.data_points).toBe(2);
    expect(trainingResult!.severity).toBe("medium");
  });

  it("should ignore non-mandatory expired training", () => {
    const training = [
      { staff_id: "s1", course_name: "Optional Workshop", status: "expired", expiry_date: daysFromNow(-10), is_mandatory: false },
    ];
    expect(detectComplianceGaps(training, [], NOW)).toEqual([]);
  });

  it("should ignore mandatory training with status 'completed'", () => {
    const training = [
      { staff_id: "s1", course_name: "First Aid", status: "completed", expiry_date: daysFromNow(-10), is_mandatory: true },
    ];
    expect(detectComplianceGaps(training, [], NOW)).toEqual([]);
  });

  it("should assign training severity 'high' for 3-5 expired", () => {
    const training = Array.from({ length: 4 }, (_, i) => ({
      staff_id: `s${i}`, course_name: `Course ${i}`, status: "expired", expiry_date: daysFromNow(-10), is_mandatory: true,
    }));
    const results = detectComplianceGaps(training, [], NOW);
    expect(results[0].severity).toBe("high");
  });

  it("should assign training severity 'critical' for >5 expired", () => {
    const training = Array.from({ length: 6 }, (_, i) => ({
      staff_id: `s${i}`, course_name: `Course ${i}`, status: "expired", expiry_date: daysFromNow(-10), is_mandatory: true,
    }));
    const results = detectComplianceGaps(training, [], NOW);
    expect(results[0].severity).toBe("critical");
  });

  it("should detect overdue supervisions", () => {
    const supervisions = [
      { staff_id: "s1", status: "scheduled", scheduled_date: daysFromNow(-5), actual_date: null },
      { staff_id: "s2", status: "scheduled", scheduled_date: daysFromNow(-3), actual_date: null },
    ];
    const results = detectComplianceGaps([], supervisions, NOW);
    const supervisionResult = results.find((r) => r.recommendation_type === "supervision_due");
    expect(supervisionResult).toBeDefined();
    expect(supervisionResult!.data_points).toBe(2);
  });

  it("should not flag supervisions that have an actual_date", () => {
    const supervisions = [
      { staff_id: "s1", status: "scheduled", scheduled_date: daysFromNow(-5), actual_date: daysFromNow(-4) },
    ];
    expect(detectComplianceGaps([], supervisions, NOW)).toEqual([]);
  });
});

// ── detectIncidentTrends ───────────────────────────────────────────────────

describe("detectIncidentTrends", () => {
  it("should return empty when fewer than 3 incidents", () => {
    const incidents = [
      { id: "1", type: "incident", severity: "low", child_id: "c1", date: daysFromNow(-5) },
      { id: "2", type: "incident", severity: "low", child_id: "c2", date: daysFromNow(-10) },
    ];
    expect(detectIncidentTrends(incidents, NOW)).toEqual([]);
  });

  it("should detect an increasing trend when recent > previous * 1.5", () => {
    // Previous period (31-60 days ago): 2 incidents
    // Recent period (0-30 days ago): 4 incidents -> 4 > 2*1.5=3 -> increase
    const incidents = [
      { id: "1", type: "incident", severity: "low", child_id: "c1", date: daysFromNow(-5) },
      { id: "2", type: "incident", severity: "low", child_id: "c1", date: daysFromNow(-10) },
      { id: "3", type: "incident", severity: "low", child_id: "c2", date: daysFromNow(-15) },
      { id: "4", type: "incident", severity: "low", child_id: "c2", date: daysFromNow(-20) },
      { id: "5", type: "incident", severity: "low", child_id: "c1", date: daysFromNow(-40) },
      { id: "6", type: "incident", severity: "low", child_id: "c2", date: daysFromNow(-50) },
    ];
    const results = detectIncidentTrends(incidents, NOW);
    const trendResult = results.find((r) => r.recommendation_type === "incident_trend");
    expect(trendResult).toBeDefined();
    expect(trendResult!.supporting_data?.recent).toBe(4);
    expect(trendResult!.supporting_data?.previous).toBe(2);
  });

  it("should detect a decreasing trend (positive recognition) when recent < previous * 0.6", () => {
    // Previous period: 5 incidents; Recent period: 2 -> 2 < 5*0.6=3 -> decrease
    const incidents = [
      { id: "1", type: "incident", severity: "low", child_id: "c1", date: daysFromNow(-5) },
      { id: "2", type: "incident", severity: "low", child_id: "c2", date: daysFromNow(-10) },
      { id: "3", type: "incident", severity: "low", child_id: "c1", date: daysFromNow(-35) },
      { id: "4", type: "incident", severity: "low", child_id: "c1", date: daysFromNow(-40) },
      { id: "5", type: "incident", severity: "low", child_id: "c2", date: daysFromNow(-45) },
      { id: "6", type: "incident", severity: "low", child_id: "c2", date: daysFromNow(-50) },
      { id: "7", type: "incident", severity: "low", child_id: "c1", date: daysFromNow(-55) },
    ];
    const results = detectIncidentTrends(incidents, NOW);
    const positiveResult = results.find((r) => r.recommendation_type === "positive_recognition");
    expect(positiveResult).toBeDefined();
    expect(positiveResult!.severity).toBe("info");
  });

  it("should detect per-child escalation when recent > previous*2 and recent >= 3", () => {
    // Child c1: previous = 1, recent = 3 -> 3 > 1*2=2 AND >=3 -> escalation
    const incidents = [
      { id: "1", type: "incident", severity: "low", child_id: "c1", date: daysFromNow(-5) },
      { id: "2", type: "incident", severity: "low", child_id: "c1", date: daysFromNow(-10) },
      { id: "3", type: "incident", severity: "low", child_id: "c1", date: daysFromNow(-15) },
      { id: "4", type: "incident", severity: "low", child_id: "c1", date: daysFromNow(-45) },
    ];
    const results = detectIncidentTrends(incidents, NOW);
    const escalationResult = results.find((r) => r.recommendation_type === "risk_escalation");
    expect(escalationResult).toBeDefined();
    expect(escalationResult!.linked_child_id).toBe("c1");
    expect(escalationResult!.severity).toBe("high");
  });

  it("should not flag per-child escalation when recent < 3", () => {
    // Child c1: previous = 1, recent = 2 -> 2 > 1*2=2 is false -> no escalation
    const incidents = [
      { id: "1", type: "incident", severity: "low", child_id: "c1", date: daysFromNow(-5) },
      { id: "2", type: "incident", severity: "low", child_id: "c1", date: daysFromNow(-10) },
      { id: "3", type: "incident", severity: "low", child_id: "c1", date: daysFromNow(-45) },
    ];
    const results = detectIncidentTrends(incidents, NOW);
    const escalationResult = results.find((r) => r.recommendation_type === "risk_escalation");
    expect(escalationResult).toBeUndefined();
  });
});

// ── detectPositivePatterns ─────────────────────────────────────────────────

describe("detectPositivePatterns", () => {
  const childNames: Record<string, string> = { c1: "Alex", c2: "Jordan" };

  it("should return empty when fewer than 10 mood scores for a child", () => {
    const logs = Array.from({ length: 8 }, (_, i) => ({
      child_id: "c1",
      mood_score: i < 4 ? 3 : 8,
      date: daysFromNow(-i),
    }));
    expect(detectPositivePatterns(logs, childNames)).toEqual([]);
  });

  it("should skip null mood scores and require 10 non-null", () => {
    const logs = [
      // 8 non-null + 5 null = 13 total but only 8 scored -> skip
      ...Array.from({ length: 8 }, (_, i) => ({
        child_id: "c1", mood_score: i < 4 ? 3 : 8, date: daysFromNow(-i),
      })),
      ...Array.from({ length: 5 }, (_, i) => ({
        child_id: "c1", mood_score: null as number | null, date: daysFromNow(-i - 8),
      })),
    ];
    expect(detectPositivePatterns(logs, childNames)).toEqual([]);
  });

  it("should detect improving mood when secondHalf avg > firstHalf avg + 1.5", () => {
    // First half (indices 0-4): scores 3,3,3,3,3 -> avg 3
    // Second half (indices 5-9): scores 6,6,6,6,6 -> avg 6 -> 6 > 3 + 1.5 -> yes
    const logs = Array.from({ length: 10 }, (_, i) => ({
      child_id: "c1",
      mood_score: i < 5 ? 3 : 6,
      date: daysFromNow(-i),
    }));
    const results = detectPositivePatterns(logs, childNames);
    expect(results).toHaveLength(1);
    expect(results[0].recommendation_type).toBe("positive_recognition");
    expect(results[0].severity).toBe("info");
    expect(results[0].linked_child_id).toBe("c1");
  });

  it("should not flag when improvement is exactly 1.5 (not strictly greater)", () => {
    // First half: avg 4, second half: avg 5.5 -> 5.5 > 4 + 1.5 = 5.5 is false
    const logs = Array.from({ length: 10 }, (_, i) => ({
      child_id: "c1",
      mood_score: i < 5 ? 4 : 5.5,
      date: daysFromNow(-i),
    }));
    expect(detectPositivePatterns(logs, childNames)).toEqual([]);
  });

  it("should not flag when mood is stable or declining", () => {
    const logs = Array.from({ length: 10 }, (_, i) => ({
      child_id: "c1",
      mood_score: 5,
      date: daysFromNow(-i),
    }));
    expect(detectPositivePatterns(logs, childNames)).toEqual([]);
  });
});

// ── detectHandoverGaps ─────────────────────────────────────────────────────

describe("detectHandoverGaps", () => {
  it("should return empty when fewer than 5 handovers", () => {
    const handovers = Array.from({ length: 4 }, (_, i) => ({
      date: daysFromNow(-i),
      shift_type: "day",
      content: "Short",
      has_yp_updates: false,
    }));
    expect(detectHandoverGaps(handovers)).toEqual([]);
  });

  it("should return empty when handovers are high quality", () => {
    const handovers = Array.from({ length: 6 }, (_, i) => ({
      date: daysFromNow(-i),
      shift_type: "day",
      content: "A comprehensive handover covering all young people, medication updates, outstanding tasks, and key events from the shift.",
      has_yp_updates: true,
    }));
    expect(detectHandoverGaps(handovers)).toEqual([]);
  });

  it("should detect missing YP updates when >40% lack them", () => {
    const handovers = [
      { date: daysFromNow(-1), shift_type: "day", content: "A detailed handover with all necessary info covering the full shift period.", has_yp_updates: true },
      { date: daysFromNow(-2), shift_type: "day", content: "A detailed handover with all necessary info covering the full shift period.", has_yp_updates: true },
      { date: daysFromNow(-3), shift_type: "day", content: "A detailed handover with all necessary info covering the full shift period.", has_yp_updates: false },
      { date: daysFromNow(-4), shift_type: "day", content: "A detailed handover with all necessary info covering the full shift period.", has_yp_updates: false },
      { date: daysFromNow(-5), shift_type: "day", content: "A detailed handover with all necessary info covering the full shift period.", has_yp_updates: false },
    ];
    const results = detectHandoverGaps(handovers);
    const ypResult = results.find((r) => r.title.includes("missing young person updates"));
    expect(ypResult).toBeDefined();
    expect(ypResult!.recommendation_type).toBe("handover_quality");
    expect(ypResult!.severity).toBe("medium");
  });

  it("should detect short handovers when >30% are under 100 chars", () => {
    const handovers = [
      { date: daysFromNow(-1), shift_type: "day", content: "Short note.", has_yp_updates: true },
      { date: daysFromNow(-2), shift_type: "day", content: "Brief.", has_yp_updates: true },
      { date: daysFromNow(-3), shift_type: "day", content: "A comprehensive handover with detailed notes about every young person, medication times, and task handoff.", has_yp_updates: true },
      { date: daysFromNow(-4), shift_type: "day", content: "A comprehensive handover with detailed notes about every young person, medication times, and task handoff.", has_yp_updates: true },
      { date: daysFromNow(-5), shift_type: "day", content: "A comprehensive handover with detailed notes about every young person, medication times, and task handoff.", has_yp_updates: true },
    ];
    const results = detectHandoverGaps(handovers);
    const shortResult = results.find((r) => r.title.includes("Brief handover"));
    expect(shortResult).toBeDefined();
    expect(shortResult!.recommendation_type).toBe("handover_quality");
    expect(shortResult!.severity).toBe("low");
  });

  it("should not flag missing YP updates at exactly 40%", () => {
    const handovers = [
      { date: daysFromNow(-1), shift_type: "day", content: "A comprehensive handover with detailed notes about every young person, medication times, and task handoff.", has_yp_updates: false },
      { date: daysFromNow(-2), shift_type: "day", content: "A comprehensive handover with detailed notes about every young person, medication times, and task handoff.", has_yp_updates: false },
      { date: daysFromNow(-3), shift_type: "day", content: "A comprehensive handover with detailed notes about every young person, medication times, and task handoff.", has_yp_updates: true },
      { date: daysFromNow(-4), shift_type: "day", content: "A comprehensive handover with detailed notes about every young person, medication times, and task handoff.", has_yp_updates: true },
      { date: daysFromNow(-5), shift_type: "day", content: "A comprehensive handover with detailed notes about every young person, medication times, and task handoff.", has_yp_updates: true },
    ];
    const results = detectHandoverGaps(handovers);
    const ypResult = results.find((r) => r.title.includes("missing young person updates"));
    expect(ypResult).toBeUndefined();
  });

  it("should flag both missing YP updates and short handovers simultaneously", () => {
    const handovers = [
      { date: daysFromNow(-1), shift_type: "day", content: "Short.", has_yp_updates: false },
      { date: daysFromNow(-2), shift_type: "day", content: "Brief.", has_yp_updates: false },
      { date: daysFromNow(-3), shift_type: "day", content: "Tiny.", has_yp_updates: false },
      { date: daysFromNow(-4), shift_type: "day", content: "A comprehensive handover with detailed notes about every young person, medication times, and task handoff.", has_yp_updates: true },
      { date: daysFromNow(-5), shift_type: "day", content: "A comprehensive handover with detailed notes about every young person, medication times, and task handoff.", has_yp_updates: true },
    ];
    const results = detectHandoverGaps(handovers);
    expect(results).toHaveLength(2);
    expect(results.map((r) => r.title)).toContain("Handover notes missing young person updates");
    expect(results.map((r) => r.title)).toContain("Brief handover notes");
  });
});
