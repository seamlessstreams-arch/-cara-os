import { describe, expect, it } from "vitest";
import {
  _testing,
  computeAlerts,
  type EatingDisorderSupportRow,
} from "../eating-disorder-support-service";

function makeRecord(
  overrides: Partial<EatingDisorderSupportRow> = {},
): EatingDisorderSupportRow {
  return {
    id: "r-1",
    home_id: "home_oak",
    child_name: "Jamie",
    assessment_date: "2026-05-04",
    lead_professional: "Alex Morgan",
    concern_type: "Anorexia Nervosa",
    risk_level: "Low",
    weight_monitoring_in_place: true,
    gp_consulted: true,
    specialist_referral_made: true,
    specialist_service: null,
    camhs_engaged: true,
    dietitian_involved: true,
    meal_plan_in_place: true,
    supervised_meals: true,
    bathroom_supervision: true,
    exercise_monitoring: true,
    purging_behaviours_identified: false,
    food_restriction_identified: false,
    binge_behaviours_identified: false,
    self_induced_vomiting: false,
    laxative_misuse: false,
    body_weight_status: "Healthy Weight",
    young_person_engaged: true,
    family_involved: true,
    school_aware: true,
    social_worker_informed: true,
    review_date: null,
    status: "Active",
    notes: null,
    created_at: "2026-05-04T10:00:00Z",
    updated_at: "2026-05-04T10:00:00Z",
    ...overrides,
  };
}

describe("tri-state judgements", () => {
  it("does not assert laxative misuse nobody recorded", () => {
    const alerts = computeAlerts([makeRecord({ laxative_misuse: null })]);
    expect(alerts.some((a) => a.type === "laxative_misuse")).toBe(false);
  });

  it("still alerts on recorded laxative misuse", () => {
    const alerts = computeAlerts([makeRecord({ laxative_misuse: true })]);
    expect(alerts.some((a) => a.type === "laxative_misuse")).toBe(true);
  });

  it("does not dilute behaviour rates with unrecorded rows", () => {
    const rows = [true, null, null, null].map((v, i) =>
      makeRecord({ id: `r-${i}`, laxative_misuse: v }),
    );
    const metrics = _testing.computeMetrics(rows);
    expect(metrics.laxative_misuse_rate).toBe(100);
  });

  it("reports null behaviour rates when nothing is recorded", () => {
    const rows = [null, null].map((v, i) =>
      makeRecord({ id: `r-${i}`, self_induced_vomiting: v }),
    );
    const metrics = _testing.computeMetrics(rows);
    expect(metrics.self_induced_vomiting_rate).toBe(null);
  });
});
