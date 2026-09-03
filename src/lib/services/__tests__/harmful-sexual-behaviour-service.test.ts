import { describe, expect, it } from "vitest";
import {
  computeAlerts,
  type HarmfulSexualBehaviourRow,
} from "../harmful-sexual-behaviour-service";

function makeRecord(
  overrides: Partial<HarmfulSexualBehaviourRow> = {},
): HarmfulSexualBehaviourRow {
  return {
    id: "r-1",
    home_id: "home_oak",
    child_name: "Jamie",
    incident_date: "2026-05-04",
    assessor_name: "Alex Morgan",
    referral_source: "Staff Observation",
    behaviour_category: "Inappropriate",
    behaviour_description: "Inappropriate language towards a peer",
    victim_involved: false,
    victim_support_provided: true,
    aim_assessment_completed: true,
    brook_traffic_light_used: true,
    specialist_referral_made: true,
    specialist_service: null,
    safety_plan_in_place: true,
    environmental_risk_assessment: true,
    sleeping_arrangements_reviewed: true,
    supervision_level_adjusted: true,
    police_notified: true,
    social_worker_informed: true,
    parents_carers_informed: true,
    multi_agency_meeting_held: true,
    child_views_obtained: true,
    therapeutic_support: true,
    risk_level: "Low",
    review_date: null,
    outcome: "Monitoring",
    status: "Active",
    notes: null,
    created_at: "2026-05-04T10:00:00Z",
    updated_at: "2026-05-04T10:00:00Z",
    ...overrides,
  };
}

describe("tri-state judgements", () => {
  it("flags unrecorded victim involvement on a serious case as a gap", () => {
    const alerts = computeAlerts([
      makeRecord({ behaviour_category: "Abusive", victim_involved: null }),
    ]);
    expect(alerts.some((a) => a.type === "victim_involvement_not_recorded")).toBe(true);
  });

  it("does not flag the gap when victim involvement is recorded either way", () => {
    const recordedNo = computeAlerts([
      makeRecord({ behaviour_category: "Abusive", victim_involved: false }),
    ]);
    const recordedYes = computeAlerts([
      makeRecord({ behaviour_category: "Abusive", victim_involved: true }),
    ]);
    expect(recordedNo.some((a) => a.type === "victim_involvement_not_recorded")).toBe(false);
    expect(recordedYes.some((a) => a.type === "victim_involvement_not_recorded")).toBe(false);
  });

  it("does not assert a victim-support failure when involvement is unknown", () => {
    const alerts = computeAlerts([
      makeRecord({
        behaviour_category: "Abusive",
        victim_involved: null,
        victim_support_provided: false,
      }),
    ]);
    expect(alerts.some((a) => a.type === "victim_no_support")).toBe(false);
  });

  it("still alerts critically when a known victim has no support", () => {
    const alerts = computeAlerts([
      makeRecord({
        behaviour_category: "Abusive",
        victim_involved: true,
        victim_support_provided: false,
      }),
    ]);
    const alert = alerts.find((a) => a.type === "victim_no_support");
    expect(alert).toBeTruthy();
    expect(alert!.severity).toBe("critical");
  });
});
