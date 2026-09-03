import { describe, expect, it } from "vitest";
import {
  computeAlerts,
  type CountyLinesIntelligenceRow,
} from "../county-lines-intelligence-service";

function makeRecord(
  overrides: Partial<CountyLinesIntelligenceRow> = {},
): CountyLinesIntelligenceRow {
  return {
    id: "r-1",
    home_id: "home_oak",
    child_name: "Jamie",
    assessment_date: "2026-05-04",
    assessor_name: "Alex Morgan",
    intelligence_type: "Intelligence Log",
    risk_level: "Low",
    indicators_present: "",
    travel_patterns_noted: false,
    new_possessions_noted: false,
    phone_activity_concerns: false,
    missing_episodes_linked: false,
    peer_association_concerns: false,
    drug_related_concerns: false,
    debt_bondage_suspected: false,
    violence_intimidation_present: false,
    nrm_referral_made: true,
    nrm_referral_date: "2026-05-04",
    police_notified: true,
    social_worker_informed: true,
    multi_agency_meeting_held: true,
    safety_plan_in_place: true,
    disruption_activity: "Weekly peer mapping in place",
    child_views_obtained: true,
    outcome: "Ongoing Monitoring",
    status: "Active",
    notes: null,
    created_at: "2026-05-04T10:00:00Z",
    updated_at: "2026-05-04T10:00:00Z",
    ...overrides,
  };
}

describe("tri-state judgements", () => {
  it("does not assert debt bondage nobody recorded", () => {
    const alerts = computeAlerts([
      makeRecord({ debt_bondage_suspected: null, police_notified: false }),
    ]);
    expect(alerts.some((a) => a.type === "exploitation_no_police")).toBe(false);
  });

  it("still escalates recorded debt bondage without police notification", () => {
    const alerts = computeAlerts([
      makeRecord({ debt_bondage_suspected: true, police_notified: false }),
    ]);
    expect(alerts.some((a) => a.type === "exploitation_no_police")).toBe(true);
  });

  it("does not count unrecorded signs as exploitation indicators", () => {
    const alerts = computeAlerts([
      makeRecord({
        travel_patterns_noted: null,
        new_possessions_noted: null,
        phone_activity_concerns: null,
        missing_episodes_linked: null,
        peer_association_concerns: null,
        drug_related_concerns: null,
        debt_bondage_suspected: null,
        violence_intimidation_present: null,
        disruption_activity: null,
      }),
    ]);
    expect(alerts.some((a) => a.type === "multiple_indicators_no_disruption")).toBe(false);
  });

  it("still flags four recorded indicators with no disruption activity", () => {
    const alerts = computeAlerts([
      makeRecord({
        travel_patterns_noted: true,
        new_possessions_noted: true,
        phone_activity_concerns: true,
        missing_episodes_linked: true,
        disruption_activity: null,
      }),
    ]);
    expect(alerts.some((a) => a.type === "multiple_indicators_no_disruption")).toBe(true);
  });
});
