import { describe, it, expect } from "vitest";
import {
  computeMetrics,
  computeAlerts,
  validateFamilyContactArrangement,
  type FamilyContactArrangementsRow,
} from "./family-contact-arrangements-service";

function makeRow(overrides: Partial<FamilyContactArrangementsRow> = {}): FamilyContactArrangementsRow {
  return {
    id: "fca-1",
    home_id: "home-1",
    child_name: "Child A",
    contact_person_name: "Parent A",
    relationship: "Mother",
    contact_type: "Face-to-Face Supervised",
    scheduled_date: "2026-05-15",
    actual_date: "2026-05-15",
    duration_minutes: 60,
    location: "Family Room",
    supervisor_name: "Staff A",
    child_wishes_considered: true,
    child_mood_before: "Happy",
    child_mood_after: "Happy",
    contact_quality: "Positive",
    risk_assessed: true,
    concerns_raised: false,
    concern_details: null,
    social_worker_notified: false,
    outcome_notes: "Positive session. Child and parent engaged well.",
    next_contact_date: "2026-05-29",
    status: "Completed",
    notes: null,
    created_at: "2026-05-15T10:00:00Z",
    updated_at: "2026-05-15T10:00:00Z",
    ...overrides,
  };
}

describe("computeMetrics", () => {
  it("returns nulls for empty data — an empty register is not a score", () => {
    const m = computeMetrics([]);
    expect(m.total_contacts).toBe(0);
    expect(m.completed_count).toBe(0);
    expect(m.completion_rate).toBeNull();
    expect(m.concern_rate).toBeNull();
    expect(m.unique_children).toBe(0);
    expect(m.unique_contacts).toBe(0);
    expect(m.average_duration).toBeNull();
    expect(m.positive_quality_rate).toBeNull();
    expect(m.difficult_quality_rate).toBeNull();
    expect(m.sw_notification_rate).toBeNull();
  });

  it("computes correct counts and rates for populated data", () => {
    const rows: FamilyContactArrangementsRow[] = [
      makeRow({ id: "r1", status: "Completed", contact_quality: "Positive", child_mood_before: "Anxious", child_mood_after: "Happy" }),
      makeRow({ id: "r2", status: "Completed", contact_quality: "Difficult", child_name: "Child B", child_mood_before: "Happy", child_mood_after: "Distressed", duration_minutes: 30 }),
      makeRow({ id: "r3", status: "Cancelled", next_contact_date: null, child_name: "Child B" }),
      makeRow({ id: "r4", status: "Refused by Child" }),
      makeRow({ id: "r5", status: "Suspended by Court" }),
    ];
    const m = computeMetrics(rows);
    expect(m.total_contacts).toBe(5);
    expect(m.completed_count).toBe(2);
    expect(m.cancelled_count).toBe(1);
    expect(m.refused_by_child_count).toBe(1);
    expect(m.suspended_count).toBe(1);
    // completion_rate: 2 / (5 - 1 suspended) = 2/4 = 50%
    expect(m.completion_rate).toBe(50);
    // positive_quality_rate: 1/2 completed = 50%
    expect(m.positive_quality_rate).toBe(50);
    // difficult_quality_rate: 1/2 completed = 50%
    expect(m.difficult_quality_rate).toBe(50);
    // unique_children: Child A, Child B
    expect(m.unique_children).toBe(2);
    // average_duration: (60+30)/2 = 45
    expect(m.average_duration).toBe(45);
    // mood_improvement: r1 was anxious->happy = improved. negativeBeforeCount = 1. rate = 100%
    expect(m.mood_improvement_rate).toBe(100);
    // mood_deterioration: r2 was happy->distressed. positiveBeforeCount from completed = 1 (r2). rate = 100%
    expect(m.mood_deterioration_rate).toBe(100);
  });
});

describe("computeAlerts", () => {
  it("returns no alerts for empty data", () => {
    expect(computeAlerts([])).toEqual([]);
  });

  it("generates critical alert when concerns raised but SW not notified", () => {
    const rows = [makeRow({ concerns_raised: true, social_worker_notified: false, concern_details: "Shouting observed." })];
    const alerts = computeAlerts(rows);
    const swAlert = alerts.filter((a) => a.type === "concerns_sw_not_notified");
    expect(swAlert).toHaveLength(1);
    expect(swAlert[0].severity).toBe("critical");
  });

  it("generates critical alert for distressed child with no concerns documented", () => {
    const rows = [makeRow({ child_mood_after: "Distressed", concerns_raised: false, status: "Completed" })];
    const alerts = computeAlerts(rows);
    const distressed = alerts.filter((a) => a.type === "distressed_no_concerns");
    expect(distressed).toHaveLength(1);
    expect(distressed[0].severity).toBe("critical");
  });

  it("generates critical alert for face-to-face completed without risk assessment", () => {
    const rows = [makeRow({ contact_type: "Face-to-Face Supervised", risk_assessed: false, status: "Completed" })];
    const alerts = computeAlerts(rows);
    const noRisk = alerts.filter((a) => a.type === "no_risk_assessment");
    expect(noRisk).toHaveLength(1);
    expect(noRisk[0].severity).toBe("critical");
  });

  it("generates high alert for repeated difficult contact (>= 2, >= 50%)", () => {
    const rows = [
      makeRow({ id: "r1", child_name: "Child A", contact_person_name: "Parent X", contact_quality: "Difficult", status: "Completed" }),
      makeRow({ id: "r2", child_name: "Child A", contact_person_name: "Parent X", contact_quality: "Difficult", status: "Completed" }),
    ];
    const alerts = computeAlerts(rows);
    const repeated = alerts.filter((a) => a.type === "repeated_difficult_contact");
    expect(repeated).toHaveLength(1);
    expect(repeated[0].severity).toBe("high");
  });

  it("generates high alert for repeated child refusal (>= 2)", () => {
    const rows = [
      makeRow({ id: "r1", status: "Refused by Child", child_name: "Child A" }),
      makeRow({ id: "r2", status: "Refused by Child", child_name: "Child A" }),
    ];
    const alerts = computeAlerts(rows);
    const refusal = alerts.filter((a) => a.type === "repeated_child_refusal");
    expect(refusal).toHaveLength(1);
    expect(refusal[0].severity).toBe("high");
  });

  it("generates high alert when child wishes not considered", () => {
    const rows = [makeRow({ child_wishes_considered: false, status: "Completed" })];
    const alerts = computeAlerts(rows);
    const wishes = alerts.filter((a) => a.type === "wishes_not_considered");
    expect(wishes).toHaveLength(1);
    expect(wishes[0].severity).toBe("high");
  });

  it("generates medium alert for cancelled contact with no reschedule", () => {
    const rows = [makeRow({ status: "Cancelled", next_contact_date: null })];
    const alerts = computeAlerts(rows);
    const cancelled = alerts.filter((a) => a.type === "cancelled_no_reschedule");
    expect(cancelled).toHaveLength(1);
    expect(cancelled[0].severity).toBe("medium");
  });
});

describe("validateFamilyContactArrangement", () => {
  it("validates a correct input", () => {
    const result = validateFamilyContactArrangement({
      childName: "Child A",
      contactPersonName: "Parent A",
      relationship: "Mother",
      contactType: "Face-to-Face Supervised",
      scheduledDate: "2026-05-15",
      actualDate: "2026-05-15",
      childWishesConsidered: true,
      childMoodBefore: "Happy",
      childMoodAfter: "Happy",
      contactQuality: "Positive",
      riskAssessed: true,
      outcomeNotes: "Good session.",
      supervisorName: "Staff A",
      status: "Completed",
      nextContactDate: "2026-05-29",
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("fails with missing required fields", () => {
    const result = validateFamilyContactArrangement({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(5);
  });

  it("fails when concerns raised without details", () => {
    const result = validateFamilyContactArrangement({
      childName: "Child A",
      contactPersonName: "Parent A",
      relationship: "Mother",
      contactType: "Phone Call",
      scheduledDate: "2026-05-15",
      childWishesConsidered: true,
      childMoodBefore: "Happy",
      childMoodAfter: "Happy",
      contactQuality: "Positive",
      riskAssessed: true,
      outcomeNotes: "Good session.",
      status: "Completed",
      actualDate: "2026-05-15",
      nextContactDate: "2026-05-29",
      concernsRaised: true,
      concernDetails: "",
      socialWorkerNotified: true,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Concern details"))).toBe(true);
  });
});
