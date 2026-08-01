import { describe, it, expect } from "vitest";
import {
  computeProfessionalConsultationMetrics,
  identifyProfessionalConsultationAlerts,
} from "./professional-consultation-service";
import type { ProfessionalConsultationRecord } from "./professional-consultation-service";

// -- Factory ------------------------------------------------------------------

function makeRecord(overrides: Partial<ProfessionalConsultationRecord> = {}): ProfessionalConsultationRecord {
  return {
    id: "pc-1",
    home_id: "home-1",
    professional_type: "camhs_therapist",
    consultation_type: "planned_session",
    consultation_outcome: "recommendations_made",
    consultation_urgency: "routine",
    consultation_date: "2026-05-01",
    professional_name: "Dr Smith",
    professional_organisation: "CAMHS Team",
    child_name: "Alex",
    child_id: "child-1",
    recommendations_documented: true,
    actions_agreed: true,
    actions_completed: true,
    staff_informed: true,
    care_plan_updated: true,
    parent_carer_informed: true,
    social_worker_informed: true,
    follow_up_required: false,
    follow_up_completed: false,
    child_participated: true,
    child_views_recorded: true,
    consent_obtained: true,
    issues_found: [],
    actions_taken: [],
    consulted_by: "Staff A",
    next_consultation_date: null,
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

// -- computeProfessionalConsultationMetrics ------------------------------------

describe("computeProfessionalConsultationMetrics", () => {
  it("returns zeroes for empty records", () => {
    const m = computeProfessionalConsultationMetrics([]);
    expect(m.total_consultations).toBe(0);
    expect(m.recommendations_made_count).toBe(0);
    expect(m.further_referral_count).toBe(0);
    expect(m.escalated_count).toBe(0);
    expect(m.emergency_count).toBe(0);
    expect(m.recommendations_documented_rate).toBeNull();;
    expect(m.actions_completed_rate).toBeNull();;
    expect(m.follow_up_required_count).toBe(0);
    expect(m.follow_up_completed_rate).toBeNull();;
    expect(m.unique_children).toBe(0);
  });

  it("counts outcome types correctly", () => {
    const records = [
      makeRecord({ id: "1", consultation_outcome: "recommendations_made" }),
      makeRecord({ id: "2", consultation_outcome: "further_referral" }),
      makeRecord({ id: "3", consultation_outcome: "escalated" }),
      makeRecord({ id: "4", consultation_outcome: "no_further_action" }),
    ];
    const m = computeProfessionalConsultationMetrics(records);
    expect(m.recommendations_made_count).toBe(1);
    expect(m.further_referral_count).toBe(1);
    expect(m.escalated_count).toBe(1);
  });

  it("counts emergency urgency", () => {
    const records = [
      makeRecord({ id: "1", consultation_urgency: "emergency" }),
      makeRecord({ id: "2", consultation_urgency: "routine" }),
    ];
    const m = computeProfessionalConsultationMetrics(records);
    expect(m.emergency_count).toBe(1);
  });

  it("computes boolean rates correctly at 50%", () => {
    const records = [
      makeRecord({ id: "1", recommendations_documented: true, staff_informed: true }),
      makeRecord({ id: "2", recommendations_documented: false, staff_informed: false }),
    ];
    const m = computeProfessionalConsultationMetrics(records);
    expect(m.recommendations_documented_rate).toBe(50);
    expect(m.staff_informed_rate).toBe(50);
  });

  it("computes follow-up completed rate from follow-up-required subset", () => {
    const records = [
      makeRecord({ id: "1", follow_up_required: true, follow_up_completed: true }),
      makeRecord({ id: "2", follow_up_required: true, follow_up_completed: false }),
      makeRecord({ id: "3", follow_up_required: false, follow_up_completed: false }),
    ];
    const m = computeProfessionalConsultationMetrics(records);
    expect(m.follow_up_required_count).toBe(2);
    expect(m.follow_up_completed_rate).toBe(50);
  });

  it("counts unique children", () => {
    const records = [
      makeRecord({ id: "1", child_name: "Alex" }),
      makeRecord({ id: "2", child_name: "Alex" }),
      makeRecord({ id: "3", child_name: "Beth" }),
    ];
    const m = computeProfessionalConsultationMetrics(records);
    expect(m.unique_children).toBe(2);
  });

  it("populates breakdown records", () => {
    const records = [
      makeRecord({ id: "1", professional_type: "camhs_therapist", consultation_type: "assessment" }),
      makeRecord({ id: "2", professional_type: "social_worker", consultation_type: "review" }),
    ];
    const m = computeProfessionalConsultationMetrics(records);
    expect(m.by_professional_type).toEqual({ camhs_therapist: 1, social_worker: 1 });
    expect(m.by_consultation_type).toEqual({ assessment: 1, review: 1 });
  });
});

// -- identifyProfessionalConsultationAlerts ------------------------------------

describe("identifyProfessionalConsultationAlerts", () => {
  it("returns empty alerts for empty records", () => {
    expect(identifyProfessionalConsultationAlerts([])).toHaveLength(0);
  });

  it("returns empty alerts for fully compliant records", () => {
    expect(identifyProfessionalConsultationAlerts([makeRecord()])).toHaveLength(0);
  });

  it("fires critical alert for emergency with actions not completed", () => {
    const records = [
      makeRecord({ consultation_urgency: "emergency", actions_completed: false }),
    ];
    const alerts = identifyProfessionalConsultationAlerts(records);
    const critical = alerts.filter((a) => a.type === "emergency_actions_incomplete");
    expect(critical).toHaveLength(1);
    expect(critical[0].severity).toBe("critical");
  });

  it("fires high alert when 1 consultation has recommendations not documented (threshold >= 1)", () => {
    const records = [makeRecord({ recommendations_documented: false })];
    const alerts = identifyProfessionalConsultationAlerts(records);
    expect(alerts.filter((a) => a.type === "recommendations_not_documented")).toHaveLength(1);
    expect(alerts.find((a) => a.type === "recommendations_not_documented")!.severity).toBe("high");
  });

  it("fires high alert for outstanding follow-up (threshold >= 1)", () => {
    const records = [makeRecord({ follow_up_required: true, follow_up_completed: false })];
    const alerts = identifyProfessionalConsultationAlerts(records);
    expect(alerts.filter((a) => a.type === "follow_up_overdue")).toHaveLength(1);
    expect(alerts.find((a) => a.type === "follow_up_overdue")!.severity).toBe("high");
  });

  it("fires medium alert for care plan not updated at threshold of 2", () => {
    const alerts1 = identifyProfessionalConsultationAlerts([makeRecord({ care_plan_updated: false })]);
    expect(alerts1.filter((a) => a.type === "care_plan_not_updated")).toHaveLength(0);

    const alerts2 = identifyProfessionalConsultationAlerts([
      makeRecord({ id: "1", care_plan_updated: false }),
      makeRecord({ id: "2", care_plan_updated: false }),
    ]);
    expect(alerts2.filter((a) => a.type === "care_plan_not_updated")).toHaveLength(1);
    expect(alerts2.find((a) => a.type === "care_plan_not_updated")!.severity).toBe("medium");
  });

  it("fires medium alert for consent not obtained at threshold of 2", () => {
    const alerts1 = identifyProfessionalConsultationAlerts([makeRecord({ consent_obtained: false })]);
    expect(alerts1.filter((a) => a.type === "consent_not_obtained")).toHaveLength(0);

    const alerts2 = identifyProfessionalConsultationAlerts([
      makeRecord({ id: "1", consent_obtained: false }),
      makeRecord({ id: "2", consent_obtained: false }),
    ]);
    expect(alerts2.filter((a) => a.type === "consent_not_obtained")).toHaveLength(1);
  });
});
