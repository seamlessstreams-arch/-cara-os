import { describe, it, expect } from "vitest";
import {
  computeMetrics,
  computeAlerts,
  validateRestorativePractice,
} from "./restorative-practice-service";
import type { RestorativePracticeRow } from "./restorative-practice-service";

// -- Factory ------------------------------------------------------------------

function makeRow(overrides: Partial<RestorativePracticeRow> = {}): RestorativePracticeRow {
  return {
    id: "rp-1",
    home_id: "home-1",
    child_name: "Alex",
    session_date: "2026-05-10",
    facilitator_name: "Staff A",
    session_type: "Restorative Chat",
    trigger_incident: null,
    participants: "Alex, Staff A",
    harm_acknowledged: true,
    perspectives_shared: true,
    agreement_reached: true,
    agreement_details: "Agree to talk calmly",
    actions_agreed: "Daily check-in",
    follow_up_required: false,
    follow_up_date: null,
    follow_up_completed: false,
    child_satisfied_with_process: true,
    outcome_rating: "Positive",
    relationship_improved: true,
    young_person_voice_heard: true,
    staff_reflective_practice: true,
    notes: null,
    created_at: "2026-05-10T00:00:00Z",
    updated_at: "2026-05-10T00:00:00Z",
    ...overrides,
  };
}

// -- computeMetrics -----------------------------------------------------------

describe("computeMetrics", () => {
  it("returns zeroes for empty array", () => {
    const m = computeMetrics([]);
    expect(m.total_sessions).toBe(0);
    expect(m.unique_children).toBe(0);
    expect(m.harm_acknowledged_rate).toBeNull();
    expect(m.positive_outcome_rate).toBeNull();
    expect(m.average_outcome_score).toBeNull();; expect(m.formal_session_count).toBe(0);
    expect(m.average_sessions_per_child).toBeNull();; expect(m.overdue_follow_ups).toBe(0);
    expect(m.negative_outcome_count).toBe(0);
  });

  it("counts total sessions and unique children", () => {
    const rows = [
      makeRow({ id: "1", child_name: "Alex" }),
      makeRow({ id: "2", child_name: "Beth" }),
      makeRow({ id: "3", child_name: "alex" }), // case-insensitive
    ];
    const m = computeMetrics(rows);
    expect(m.total_sessions).toBe(3);
    expect(m.unique_children).toBe(2);
    expect(m.average_sessions_per_child).toBe(1.5);
  });

  it("computes boolean rates correctly for 2-of-3 = 66.7%", () => {
    const rows = [
      makeRow({ id: "1", harm_acknowledged: true }),
      makeRow({ id: "2", harm_acknowledged: true }),
      makeRow({ id: "3", harm_acknowledged: false }),
    ];
    const m = computeMetrics(rows);
    expect(m.harm_acknowledged_rate).toBe(66.7);
  });

  it("counts session categories correctly", () => {
    const rows = [
      makeRow({ id: "1", session_type: "Restorative Conference" }),
      makeRow({ id: "2", session_type: "Restorative Chat" }),
      makeRow({ id: "3", session_type: "Peer Mediation" }),
      makeRow({ id: "4", session_type: "Community Meeting" }),
    ];
    const m = computeMetrics(rows);
    expect(m.formal_session_count).toBe(1);
    expect(m.informal_session_count).toBe(1);
    expect(m.mediation_session_count).toBe(1);
    expect(m.group_session_count).toBe(1);
  });

  it("computes positive outcome rate (Very Positive + Positive)", () => {
    const rows = [
      makeRow({ id: "1", outcome_rating: "Very Positive" }),
      makeRow({ id: "2", outcome_rating: "Positive" }),
      makeRow({ id: "3", outcome_rating: "Neutral" }),
      makeRow({ id: "4", outcome_rating: "Negative" }),
    ];
    const m = computeMetrics(rows);
    expect(m.positive_outcome_rate).toBe(50);
    expect(m.negative_outcome_count).toBe(1);
  });

  it("computes average outcome score", () => {
    // Very Positive=5, Positive=4 => avg (5+4)/2 = 4.5
    const rows = [
      makeRow({ id: "1", outcome_rating: "Very Positive" }),
      makeRow({ id: "2", outcome_rating: "Positive" }),
    ];
    const m = computeMetrics(rows);
    expect(m.average_outcome_score).toBe(4.5);
  });

  it("computes follow-up completion rate from those requiring follow-up", () => {
    const rows = [
      makeRow({ id: "1", follow_up_required: true, follow_up_completed: true, follow_up_date: "2026-06-01" }),
      makeRow({ id: "2", follow_up_required: true, follow_up_completed: false, follow_up_date: "2026-06-01" }),
      makeRow({ id: "3", follow_up_required: false, follow_up_completed: false }),
    ];
    const m = computeMetrics(rows);
    expect(m.follow_up_completion_rate).toBe(50);
    expect(m.follow_up_required_rate).toBe(66.7);
  });

  it("counts overdue follow-ups", () => {
    const rows = [
      makeRow({ id: "1", follow_up_required: true, follow_up_completed: false, follow_up_date: "2020-01-01" }),
      makeRow({ id: "2", follow_up_required: true, follow_up_completed: true, follow_up_date: "2020-01-01" }),
    ];
    const m = computeMetrics(rows);
    expect(m.overdue_follow_ups).toBe(1);
  });

  it("populates by_session_type and by_outcome_rating breakdowns", () => {
    const rows = [
      makeRow({ id: "1", session_type: "Harm Circle", outcome_rating: "Negative" }),
    ];
    const m = computeMetrics(rows);
    expect(m.by_session_type["Harm Circle"]).toBe(1);
    expect(m.by_session_type["Restorative Chat"]).toBe(0);
    expect(m.by_outcome_rating["Negative"]).toBe(1);
    expect(m.by_outcome_rating["Very Positive"]).toBe(0);
  });
});

// -- computeAlerts ------------------------------------------------------------

describe("computeAlerts", () => {
  it("returns empty for empty array", () => {
    expect(computeAlerts([])).toEqual([]);
  });

  it("fires critical alert for negative outcome without follow-up", () => {
    const rows = [makeRow({ outcome_rating: "Negative", follow_up_required: false })];
    const alerts = computeAlerts(rows);
    const hit = alerts.find((a) => a.type === "negative_no_follow_up");
    expect(hit).toBeDefined();
    expect(hit!.severity).toBe("critical");
  });

  it("fires critical alert when child unsatisfied AND voice not heard", () => {
    const rows = [makeRow({ child_satisfied_with_process: false, young_person_voice_heard: false })];
    const alerts = computeAlerts(rows);
    const hit = alerts.find((a) => a.type === "child_unheard_unsatisfied");
    expect(hit).toBeDefined();
    expect(hit!.severity).toBe("critical");
  });

  it("fires critical alert for 3+ negative outcomes for same child", () => {
    const rows = [
      makeRow({ id: "1", child_name: "Alex", outcome_rating: "Negative" }),
      makeRow({ id: "2", child_name: "Alex", outcome_rating: "Negative" }),
      makeRow({ id: "3", child_name: "Alex", outcome_rating: "Negative" }),
    ];
    const alerts = computeAlerts(rows);
    const hit = alerts.find((a) => a.type === "repeated_negative_outcomes");
    expect(hit).toBeDefined();
    expect(hit!.severity).toBe("critical");
  });

  it("does NOT fire repeated_negative_outcomes for only 2 negatives", () => {
    const rows = [
      makeRow({ id: "1", child_name: "Alex", outcome_rating: "Negative" }),
      makeRow({ id: "2", child_name: "Alex", outcome_rating: "Negative" }),
    ];
    const alerts = computeAlerts(rows);
    expect(alerts.find((a) => a.type === "repeated_negative_outcomes")).toBeUndefined();
  });

  it("fires high alert for overdue follow-up", () => {
    const rows = [makeRow({ follow_up_required: true, follow_up_completed: false, follow_up_date: "2020-01-01" })];
    const alerts = computeAlerts(rows);
    const hit = alerts.find((a) => a.type === "overdue_follow_up");
    expect(hit).toBeDefined();
    expect(hit!.severity).toBe("high");
  });

  it("fires high alert for agreement without actions", () => {
    const rows = [makeRow({ agreement_reached: true, actions_agreed: "" })];
    const alerts = computeAlerts(rows);
    const hit = alerts.find((a) => a.type === "agreement_no_actions");
    expect(hit).toBeDefined();
    expect(hit!.severity).toBe("high");
  });

  it("fires high alert for harm not acknowledged in Harm Circle", () => {
    const rows = [makeRow({ session_type: "Harm Circle", harm_acknowledged: false })];
    const alerts = computeAlerts(rows);
    const hit = alerts.find((a) => a.type === "harm_not_acknowledged_formal");
    expect(hit).toBeDefined();
    expect(hit!.severity).toBe("high");
  });

  it("fires high alert for low voice rate (>40% unheard with >= 5 sessions)", () => {
    const rows = Array.from({ length: 5 }, (_, i) =>
      makeRow({ id: `r-${i}`, young_person_voice_heard: i < 2 }), // 3 of 5 not heard = 60%
    );
    const alerts = computeAlerts(rows);
    const hit = alerts.find((a) => a.type === "low_voice_rate");
    expect(hit).toBeDefined();
    expect(hit!.severity).toBe("high");
  });

  it("fires medium alert for no perspectives in mediation session", () => {
    const rows = [makeRow({ session_type: "Peer Mediation", perspectives_shared: false })];
    const alerts = computeAlerts(rows);
    const hit = alerts.find((a) => a.type === "no_perspectives_mediation");
    expect(hit).toBeDefined();
    expect(hit!.severity).toBe("medium");
  });

  it("fires medium alert for relationship not improved in Relationship Repair", () => {
    const rows = [makeRow({ session_type: "Relationship Repair", relationship_improved: false })];
    const alerts = computeAlerts(rows);
    const hit = alerts.find((a) => a.type === "relationship_not_improved");
    expect(hit).toBeDefined();
    expect(hit!.severity).toBe("medium");
  });

  it("fires medium alert for no trigger in formal session", () => {
    const rows = [makeRow({ session_type: "Restorative Conference", trigger_incident: "" })];
    const alerts = computeAlerts(rows);
    const hit = alerts.find((a) => a.type === "no_trigger_formal");
    expect(hit).toBeDefined();
    expect(hit!.severity).toBe("medium");
  });
});

// -- validateRestorativePractice ----------------------------------------------

describe("validateRestorativePractice", () => {
  it("passes for valid input", () => {
    const result = validateRestorativePractice({
      childName: "Alex",
      sessionDate: "2026-05-10",
      facilitatorName: "Staff A",
      sessionType: "Restorative Chat",
      participants: "Alex, Staff A",
      outcomeRating: "Positive",
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects empty child name", () => {
    const result = validateRestorativePractice({
      childName: "",
      sessionDate: "2026-05-10",
      facilitatorName: "Staff",
      sessionType: "Restorative Chat",
      participants: "Alex",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Child name is required");
  });

  it("rejects missing session date", () => {
    const result = validateRestorativePractice({
      childName: "Alex",
      facilitatorName: "Staff",
      sessionType: "Restorative Chat",
      participants: "Alex",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Session date is required");
  });

  it("rejects agreement reached without details or actions", () => {
    const result = validateRestorativePractice({
      childName: "Alex",
      sessionDate: "2026-05-10",
      facilitatorName: "Staff",
      sessionType: "Restorative Chat",
      participants: "Alex",
      agreementReached: true,
      agreementDetails: "",
      actionsAgreed: "",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Agreement details"))).toBe(true);
    expect(result.errors.some((e) => e.includes("Actions agreed"))).toBe(true);
  });

  it("rejects follow-up required without follow-up date", () => {
    const result = validateRestorativePractice({
      childName: "Alex",
      sessionDate: "2026-05-10",
      facilitatorName: "Staff",
      sessionType: "Restorative Chat",
      participants: "Alex",
      followUpRequired: true,
      followUpDate: undefined,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Follow-up date is required"))).toBe(true);
  });

  it("rejects follow-up completed when not required", () => {
    const result = validateRestorativePractice({
      childName: "Alex",
      sessionDate: "2026-05-10",
      facilitatorName: "Staff",
      sessionType: "Restorative Chat",
      participants: "Alex",
      followUpCompleted: true,
      followUpRequired: false,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("cannot be marked as completed"))).toBe(true);
  });

  it("rejects invalid outcome rating", () => {
    const result = validateRestorativePractice({
      childName: "Alex",
      sessionDate: "2026-05-10",
      facilitatorName: "Staff",
      sessionType: "Restorative Chat",
      participants: "Alex",
      outcomeRating: "Fantastic",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Outcome rating"))).toBe(true);
  });
});
