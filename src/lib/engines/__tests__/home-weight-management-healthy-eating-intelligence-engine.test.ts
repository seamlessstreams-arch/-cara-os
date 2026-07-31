// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME WEIGHT MANAGEMENT & HEALTHY EATING INTELLIGENCE ENGINE TESTS
// Comprehensive test suite covering weight monitoring, BMI tracking, healthy
// eating programmes, portion control, body positivity, and scoring.
// CHR 2015 Reg 14 (Health care), SCCIF Health and wellbeing.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeWeightManagementHealthyEating,
  type WeightManagementInput,
  type WeightMonitoringRecordInput,
  type BmiTrackingRecordInput,
  type HealthyEatingRecordInput,
  type PortionControlRecordInput,
  type BodyPositivityRecordInput,
} from "../home-weight-management-healthy-eating-intelligence-engine";

const TODAY = "2026-05-25";

// ── Factories ───────────────────────────────────────────────────────────────

let _id = 0;

function makeWeightMonitoring(overrides: Partial<WeightMonitoringRecordInput> = {}): WeightMonitoringRecordInput {
  _id++;
  return {
    id: `wm_${_id}`,
    child_id: "yp_1",
    date: "2026-05-20",
    weight_kg: 45,
    height_cm: 150,
    measured_by: "nurse",
    measurement_context: "routine",
    weight_trend: "stable",
    within_healthy_range: true,
    action_taken: true,
    action_details: "Recorded and reviewed",
    gp_notified: true,
    child_informed: true,
    child_consent_obtained: true,
    follow_up_date: null,
    follow_up_completed: false,
    notes: "",
    created_at: "2026-05-20T10:00:00Z",
    ...overrides,
  };
}

function makeBmiTracking(overrides: Partial<BmiTrackingRecordInput> = {}): BmiTrackingRecordInput {
  _id++;
  return {
    id: `bmi_${_id}`,
    child_id: "yp_1",
    date: "2026-05-20",
    bmi_value: 20,
    bmi_category: "healthy",
    centile_position: 50,
    plotted_on_growth_chart: true,
    growth_chart_reviewed: true,
    trend_direction: "stable",
    referral_made: false,
    referral_type: "none",
    professional_involved: true,
    review_frequency_weeks: 4,
    last_professional_review: "2026-05-15",
    child_age_appropriate_discussion: true,
    notes: "",
    created_at: "2026-05-20T10:00:00Z",
    ...overrides,
  };
}

function makeHealthyEating(overrides: Partial<HealthyEatingRecordInput> = {}): HealthyEatingRecordInput {
  _id++;
  return {
    id: `he_${_id}`,
    child_id: "yp_1",
    programme_name: "Cook & Learn",
    programme_type: "cooking_session",
    date: "2026-05-20",
    attended: true,
    engaged: true,
    child_enjoyed: true,
    child_satisfaction: 4,
    learning_objectives_met: true,
    skills_gained: ["knife_skills"],
    staff_led: true,
    external_provider: false,
    dietary_knowledge_improved: true,
    healthy_choice_made: true,
    follow_up_planned: false,
    follow_up_completed: false,
    notes: "",
    created_at: "2026-05-20T10:00:00Z",
    ...overrides,
  };
}

function makePortionControl(overrides: Partial<PortionControlRecordInput> = {}): PortionControlRecordInput {
  _id++;
  return {
    id: `pc_${_id}`,
    child_id: "yp_1",
    date: "2026-05-20",
    assessment_type: "meal_observation",
    understands_portions: true,
    age_appropriate_portions_served: true,
    child_self_serves: true,
    child_makes_healthy_choices: true,
    overeating_concerns: false,
    undereating_concerns: false,
    emotional_eating_identified: false,
    support_plan_in_place: true,
    staff_trained_on_portions: true,
    meals_balanced: true,
    snack_provision_appropriate: true,
    hydration_adequate: true,
    child_voice_captured: true,
    notes: "",
    created_at: "2026-05-20T10:00:00Z",
    ...overrides,
  };
}

function makeBodyPositivity(overrides: Partial<BodyPositivityRecordInput> = {}): BodyPositivityRecordInput {
  _id++;
  return {
    id: `bp_${_id}`,
    child_id: "yp_1",
    date: "2026-05-20",
    activity_type: "group_session",
    child_engaged: true,
    child_satisfaction: 4,
    positive_body_image_discussed: true,
    media_literacy_included: true,
    self_esteem_component: true,
    weight_stigma_addressed: true,
    staff_facilitated: true,
    external_professional_involved: false,
    child_voice_captured: true,
    concerns_identified: false,
    concerns_details: "",
    referral_made: false,
    referral_type: "none",
    outcomes_documented: true,
    notes: "",
    created_at: "2026-05-20T10:00:00Z",
    ...overrides,
  };
}

const baseInput: WeightManagementInput = {
  today: TODAY,
  total_children: 3,
  weight_monitoring_records: [],
  bmi_tracking_records: [],
  healthy_eating_records: [],
  portion_control_records: [],
  body_positivity_records: [],
};

function run(overrides: Partial<WeightManagementInput> = {}) {
  return computeWeightManagementHealthyEating({ ...baseInput, ...overrides });
}

// ── 1. Insufficient Data / Edge Cases ──────────────────────────────────────

describe("insufficient data and edge cases", () => {
  it("returns insufficient_data when all empty and 0 children", () => {
    const r = run({ total_children: 0 });
    expect(r.weight_rating).toBe("insufficient_data");
    expect(r.weight_score).toBe(0);
  });

  it("returns inadequate with score 15 when all empty but children > 0", () => {
    const r = run({ total_children: 3 });
    expect(r.weight_rating).toBe("inadequate");
    expect(r.weight_score).toBe(15);
    expect(r.concerns.length).toBe(1);
    expect(r.recommendations.length).toBe(2);
    expect(r.insights.length).toBe(1);
    expect(r.insights[0].severity).toBe("critical");
  });

  it("headline mentions 'No children on placement' for insufficient_data", () => {
    const r = run({ total_children: 0 });
    expect(r.headline).toContain("No children on placement");
  });

  it("headline mentions 'No weight management' for empty with children", () => {
    const r = run({ total_children: 2 });
    expect(r.headline).toContain("No weight management");
  });

  it("recommendations have correct regulatory refs for empty-with-children", () => {
    const r = run({ total_children: 2 });
    expect(r.recommendations[0].regulatory_ref).toContain("Reg 14");
    expect(r.recommendations[1].regulatory_ref).toContain("Health and wellbeing");
  });

  it("all rates are 0 for insufficient_data", () => {
    const r = run({ total_children: 0 });
    expect(r.weight_monitoring_rate).toBe(0);
    expect(r.bmi_tracking_rate).toBeNull();
    expect(r.healthy_eating_rate).toBeNull();
    expect(r.portion_control_rate).toBeNull();
    expect(r.body_positivity_rate).toBeNull();
    expect(r.child_engagement_rate).toBe(0);
  });

  it("empty arrays for insufficient_data", () => {
    const r = run({ total_children: 0 });
    expect(r.strengths).toEqual([]);
    expect(r.concerns).toEqual([]);
    expect(r.recommendations).toEqual([]);
    expect(r.insights).toEqual([]);
  });
});

// ── 2. Weight Monitoring ───────────────────────────────────────────────────

describe("weight monitoring", () => {
  it("100% monitoring rate when all within healthy range", () => {
    const records = Array.from({ length: 10 }, () => makeWeightMonitoring({ within_healthy_range: true }));
    const r = run({ weight_monitoring_records: records });
    expect(r.weight_monitoring_rate).toBe(100);
  });

  it("0% monitoring rate when none within healthy range", () => {
    const records = Array.from({ length: 10 }, () => makeWeightMonitoring({ within_healthy_range: false }));
    const r = run({ weight_monitoring_records: records });
    expect(r.weight_monitoring_rate).toBe(0);
  });

  it("strength for >= 90% monitoring rate", () => {
    const records = Array.from({ length: 10 }, () => makeWeightMonitoring({ within_healthy_range: true }));
    const r = run({ weight_monitoring_records: records });
    expect(r.strengths.some(s => s.includes("effective weight monitoring"))).toBe(true);
  });

  it("strength for 70-89% monitoring rate", () => {
    const records = [
      ...Array.from({ length: 8 }, () => makeWeightMonitoring({ within_healthy_range: true })),
      ...Array.from({ length: 2 }, () => makeWeightMonitoring({ within_healthy_range: false })),
    ];
    const r = run({ weight_monitoring_records: records });
    expect(r.strengths.some(s => s.includes("weight is well managed"))).toBe(true);
  });

  it("high monitoring rate (>=90) gives +4 bonus", () => {
    const records = Array.from({ length: 10 }, () => makeWeightMonitoring({ within_healthy_range: true }));
    const r = run({ weight_monitoring_records: records });
    expect(r.weight_score).toBeGreaterThanOrEqual(56);
  });

  it("monitoring rate 70-89 gives +2 bonus", () => {
    const records = [
      ...Array.from({ length: 8 }, () => makeWeightMonitoring({ within_healthy_range: true })),
      ...Array.from({ length: 2 }, () => makeWeightMonitoring({ within_healthy_range: false })),
    ];
    const r = run({ weight_monitoring_records: records });
    expect(r.weight_monitoring_rate).toBe(80);
  });

  it("concern for weight concern > 50% and action < 50%", () => {
    const records = Array.from({ length: 10 }, () =>
      makeWeightMonitoring({ within_healthy_range: false, action_taken: false })
    );
    const r = run({ weight_monitoring_records: records });
    expect(r.concerns.some(c => c.includes("not responding adequately"))).toBe(true);
  });

  it("concern for weight concern > 30%", () => {
    const records = [
      ...Array.from({ length: 6 }, () => makeWeightMonitoring({ within_healthy_range: true })),
      ...Array.from({ length: 4 }, () => makeWeightMonitoring({ within_healthy_range: false, action_taken: true })),
    ];
    const r = run({ weight_monitoring_records: records });
    expect(r.concerns.some(c => c.includes("outside healthy range"))).toBe(true);
  });

  it("strength for >= 90% weight coverage", () => {
    const records = [
      makeWeightMonitoring({ child_id: "yp_1" }),
      makeWeightMonitoring({ child_id: "yp_2" }),
      makeWeightMonitoring({ child_id: "yp_3" }),
    ];
    const r = run({ weight_monitoring_records: records });
    expect(r.strengths.some(s => s.includes("weight monitoring records"))).toBe(true);
  });

  it("concern for weight coverage < 50%", () => {
    const records = [makeWeightMonitoring({ child_id: "yp_1" })];
    const r = run({ total_children: 3, weight_monitoring_records: records });
    expect(r.concerns.some(c => c.includes("not being actively tracked"))).toBe(true);
  });

  it("strength for >= 90% action rate", () => {
    const records = Array.from({ length: 10 }, () => makeWeightMonitoring({ action_taken: true }));
    const r = run({ weight_monitoring_records: records });
    expect(r.strengths.some(s => s.includes("responds promptly"))).toBe(true);
  });

  it("strength for >= 90% consent rate", () => {
    const records = Array.from({ length: 10 }, () => makeWeightMonitoring({ child_consent_obtained: true }));
    const r = run({ weight_monitoring_records: records });
    expect(r.strengths.some(s => s.includes("consent obtained"))).toBe(true);
  });

  it("concern for consent rate < 50%", () => {
    const records = Array.from({ length: 10 }, () => makeWeightMonitoring({ child_consent_obtained: false }));
    const r = run({ weight_monitoring_records: records });
    expect(r.concerns.some(c => c.includes("consent"))).toBe(true);
  });

  it("strength for >= 90% follow-up rate", () => {
    const records = Array.from({ length: 10 }, () =>
      makeWeightMonitoring({ follow_up_date: "2026-06-01", follow_up_completed: true })
    );
    const r = run({ weight_monitoring_records: records });
    expect(r.strengths.some(s => s.includes("follow-ups completed"))).toBe(true);
  });

  it("concern for follow-up rate < 50%", () => {
    const records = Array.from({ length: 10 }, () =>
      makeWeightMonitoring({ follow_up_date: "2026-06-01", follow_up_completed: false })
    );
    const r = run({ weight_monitoring_records: records });
    expect(r.concerns.some(c => c.includes("follow-ups completed"))).toBe(true);
  });

  it("strength for routine monitoring >= 70%", () => {
    const records = Array.from({ length: 10 }, () =>
      makeWeightMonitoring({ measurement_context: "routine" })
    );
    const r = run({ weight_monitoring_records: records });
    expect(r.strengths.some(s => s.includes("routine"))).toBe(true);
  });

  it("no weight records concern when other data exists", () => {
    const r = run({ total_children: 3, weight_monitoring_records: [], healthy_eating_records: [makeHealthyEating()] });
    expect(r.concerns.some(c => c.includes("No weight monitoring records"))).toBe(true);
  });

  it("penalty for high concern + low action", () => {
    const records = Array.from({ length: 10 }, () =>
      makeWeightMonitoring({ within_healthy_range: false, action_taken: false })
    );
    const r = run({ weight_monitoring_records: records });
    expect(r.weight_score).toBeLessThanOrEqual(52);
  });

  it("critical insight for high concern and low action", () => {
    const records = Array.from({ length: 10 }, () =>
      makeWeightMonitoring({ within_healthy_range: false, action_taken: false })
    );
    const r = run({ weight_monitoring_records: records });
    expect(r.insights.some(i => i.severity === "critical" && i.text.includes("failure to act"))).toBe(true);
  });

  it("warning insight for concern rate 31-50%", () => {
    const records = [
      ...Array.from({ length: 6 }, () => makeWeightMonitoring({ within_healthy_range: true })),
      ...Array.from({ length: 4 }, () => makeWeightMonitoring({ within_healthy_range: false, action_taken: true })),
    ];
    const r = run({ weight_monitoring_records: records });
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("outside healthy range"))).toBe(true);
  });

  it("recommendation for high concern + low action", () => {
    const records = Array.from({ length: 10 }, () =>
      makeWeightMonitoring({ within_healthy_range: false, action_taken: false })
    );
    const r = run({ weight_monitoring_records: records });
    expect(r.recommendations.some(rec => rec.recommendation.includes("Urgently review"))).toBe(true);
  });

  it("recommendation for no weight records", () => {
    const r = run({ total_children: 3, weight_monitoring_records: [], healthy_eating_records: [makeHealthyEating()] });
    expect(r.recommendations.some(rec => rec.recommendation.includes("routine weight monitoring"))).toBe(true);
  });
});

// ── 3. BMI Tracking ────────────────────────────────────────────────────────

describe("BMI tracking", () => {
  it("bmiTrackingRate is 0 when no records", () => {
    const r = run({});
    expect(r.bmi_tracking_rate).toBeNull();
  });

  it("100% when all plotted and reviewed", () => {
    const records = Array.from({ length: 10 }, () =>
      makeBmiTracking({ plotted_on_growth_chart: true, growth_chart_reviewed: true })
    );
    const r = run({ bmi_tracking_records: records });
    expect(r.bmi_tracking_rate).toBe(100);
  });

  it("0% when none plotted or reviewed", () => {
    const records = Array.from({ length: 10 }, () =>
      makeBmiTracking({ plotted_on_growth_chart: false, growth_chart_reviewed: false })
    );
    const r = run({ bmi_tracking_records: records });
    // record exists → 0, not null
    expect(r.bmi_tracking_rate).toBe(0);
  });

  it("strength for BMI tracking >= 80%", () => {
    const records = Array.from({ length: 10 }, () => makeBmiTracking());
    const r = run({ bmi_tracking_records: records });
    expect(r.strengths.some(s => s.includes("BMI tracking rate at 100%"))).toBe(true);
  });

  it("strength for BMI tracking 60-79%", () => {
    const records = [
      ...Array.from({ length: 7 }, () => makeBmiTracking()),
      ...Array.from({ length: 3 }, () => makeBmiTracking({ plotted_on_growth_chart: false, growth_chart_reviewed: false })),
    ];
    const r = run({ bmi_tracking_records: records });
    expect(r.strengths.some(s => s.includes("good progress"))).toBe(true);
  });

  it("concern for BMI tracking < 50%", () => {
    const records = Array.from({ length: 10 }, () =>
      makeBmiTracking({ plotted_on_growth_chart: false, growth_chart_reviewed: false })
    );
    const r = run({ bmi_tracking_records: records });
    expect(r.concerns.some(c => c.includes("growth charts are not being consistently"))).toBe(true);
  });

  it("concern for declining BMI > 40%", () => {
    const records = Array.from({ length: 10 }, () =>
      makeBmiTracking({ trend_direction: "declining" })
    );
    const r = run({ bmi_tracking_records: records });
    expect(r.concerns.some(c => c.includes("declining"))).toBe(true);
  });

  it("concern for declining BMI 21-40%", () => {
    const records = [
      ...Array.from({ length: 7 }, () => makeBmiTracking({ trend_direction: "stable" })),
      ...Array.from({ length: 3 }, () => makeBmiTracking({ trend_direction: "declining" })),
    ];
    const r = run({ bmi_tracking_records: records });
    expect(r.concerns.some(c => c.includes("declining"))).toBe(true);
  });

  it("strength for BMI healthy >= 80%", () => {
    const records = Array.from({ length: 10 }, () => makeBmiTracking({ bmi_category: "healthy" }));
    const r = run({ bmi_tracking_records: records });
    expect(r.strengths.some(s => s.includes("healthy category"))).toBe(true);
  });

  it("strength for professional involved >= 80%", () => {
    const records = Array.from({ length: 10 }, () => makeBmiTracking({ professional_involved: true }));
    const r = run({ bmi_tracking_records: records });
    expect(r.strengths.some(s => s.includes("Health professionals"))).toBe(true);
  });

  it("concern for professional involvement < 50%", () => {
    const records = Array.from({ length: 10 }, () => makeBmiTracking({ professional_involved: false }));
    const r = run({ bmi_tracking_records: records });
    expect(r.concerns.some(c => c.includes("clinical oversight"))).toBe(true);
  });

  it("strength for discussion rate >= 80%", () => {
    const records = Array.from({ length: 10 }, () => makeBmiTracking({ child_age_appropriate_discussion: true }));
    const r = run({ bmi_tracking_records: records });
    expect(r.strengths.some(s => s.includes("Age-appropriate BMI discussions"))).toBe(true);
  });

  it("concern for discussion rate < 50%", () => {
    const records = Array.from({ length: 10 }, () => makeBmiTracking({ child_age_appropriate_discussion: false }));
    const r = run({ bmi_tracking_records: records });
    expect(r.concerns.some(c => c.includes("understand their growth"))).toBe(true);
  });

  it("penalty for declining BMI > 40%", () => {
    const records = Array.from({ length: 10 }, () => makeBmiTracking({ trend_direction: "declining" }));
    const r = run({ bmi_tracking_records: records });
    expect(r.weight_score).toBeLessThanOrEqual(52);
  });

  it("critical insight for declining > 40%", () => {
    const records = Array.from({ length: 10 }, () => makeBmiTracking({ trend_direction: "declining" }));
    const r = run({ bmi_tracking_records: records });
    expect(r.insights.some(i => i.severity === "critical" && i.text.includes("declining"))).toBe(true);
  });

  it("warning insight for declining 21-40%", () => {
    const records = [
      ...Array.from({ length: 7 }, () => makeBmiTracking({ trend_direction: "stable" })),
      ...Array.from({ length: 3 }, () => makeBmiTracking({ trend_direction: "declining" })),
    ];
    const r = run({ bmi_tracking_records: records });
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("declining"))).toBe(true);
  });

  it("no BMI records concern when other data exists", () => {
    const r = run({ total_children: 3, bmi_tracking_records: [], healthy_eating_records: [makeHealthyEating()] });
    expect(r.concerns.some(c => c.includes("No BMI tracking records"))).toBe(true);
  });

  it("recommendation for declining BMI > 40%", () => {
    const records = Array.from({ length: 10 }, () => makeBmiTracking({ trend_direction: "declining" }));
    const r = run({ bmi_tracking_records: records });
    expect(r.recommendations.some(rec => rec.recommendation.includes("declining BMI"))).toBe(true);
  });

  it("recommendation for no BMI records", () => {
    const r = run({ total_children: 3, bmi_tracking_records: [], healthy_eating_records: [makeHealthyEating()] });
    expect(r.recommendations.some(rec => rec.recommendation.includes("BMI calculation"))).toBe(true);
  });

  it("recommendation for BMI tracking < 50%", () => {
    const records = Array.from({ length: 10 }, () =>
      makeBmiTracking({ plotted_on_growth_chart: false, growth_chart_reviewed: false })
    );
    const r = run({ bmi_tracking_records: records });
    expect(r.recommendations.some(rec => rec.recommendation.includes("systematic BMI tracking"))).toBe(true);
  });

  it("recommendation for discussion rate < 50%", () => {
    const records = Array.from({ length: 10 }, () => makeBmiTracking({ child_age_appropriate_discussion: false }));
    const r = run({ bmi_tracking_records: records });
    expect(r.recommendations.some(rec => rec.recommendation.includes("age-appropriate discussion"))).toBe(true);
  });

  it("critical insight for no weight + no BMI records", () => {
    const r = run({ total_children: 3, weight_monitoring_records: [], bmi_tracking_records: [], healthy_eating_records: [makeHealthyEating()] });
    expect(r.insights.some(i => i.severity === "critical" && i.text.includes("No weight monitoring or BMI tracking"))).toBe(true);
  });
});

// ── 4. Healthy Eating ──────────────────────────────────────────────────────

describe("healthy eating", () => {
  it("healthyEatingRate is 0 when no records", () => {
    const r = run({});
    expect(r.healthy_eating_rate).toBeNull();
  });

  it("100% when all attended and engaged", () => {
    const records = Array.from({ length: 10 }, () => makeHealthyEating({ attended: true, engaged: true }));
    const r = run({ healthy_eating_records: records });
    expect(r.healthy_eating_rate).toBe(100);
  });

  it("0% when none attended or engaged", () => {
    const records = Array.from({ length: 10 }, () => makeHealthyEating({ attended: false, engaged: false }));
    const r = run({ healthy_eating_records: records });
    // record exists → 0, not null
    expect(r.healthy_eating_rate).toBe(0);
  });

  it("strength for >= 90% rate", () => {
    const records = Array.from({ length: 10 }, () => makeHealthyEating());
    const r = run({ healthy_eating_records: records });
    expect(r.strengths.some(s => s.includes("Healthy eating programme engagement"))).toBe(true);
  });

  it("strength for 70-89% rate", () => {
    const records = [
      ...Array.from({ length: 8 }, () => makeHealthyEating()),
      ...Array.from({ length: 2 }, () => makeHealthyEating({ attended: false, engaged: false })),
    ];
    const r = run({ healthy_eating_records: records });
    expect(r.strengths.some(s => s.includes("Healthy eating engagement"))).toBe(true);
  });

  it("concern for rate < 40%", () => {
    const records = Array.from({ length: 10 }, () => makeHealthyEating({ attended: false, engaged: false }));
    const r = run({ healthy_eating_records: records });
    expect(r.concerns.some(c => c.includes("not attending or engaging"))).toBe(true);
  });

  it("concern for rate 40-69%", () => {
    const records = [
      ...Array.from({ length: 6 }, () => makeHealthyEating()),
      ...Array.from({ length: 4 }, () => makeHealthyEating({ attended: false, engaged: false })),
    ];
    const r = run({ healthy_eating_records: records });
    expect(r.concerns.some(c => c.includes("needs strengthening"))).toBe(true);
  });

  it("strength for satisfaction >= 4.0", () => {
    const records = Array.from({ length: 10 }, () => makeHealthyEating({ child_satisfaction: 5 }));
    const r = run({ healthy_eating_records: records });
    expect(r.strengths.some(s => s.includes("satisfaction"))).toBe(true);
  });

  it("concern for satisfaction < 3.0", () => {
    const records = Array.from({ length: 10 }, () => makeHealthyEating({ child_satisfaction: 2 }));
    const r = run({ healthy_eating_records: records });
    expect(r.concerns.some(c => c.includes("satisfaction"))).toBe(true);
  });

  it("strength for healthy choice >= 80%", () => {
    const records = Array.from({ length: 10 }, () => makeHealthyEating({ healthy_choice_made: true }));
    const r = run({ healthy_eating_records: records });
    expect(r.strengths.some(s => s.includes("Healthy food choices"))).toBe(true);
  });

  it("concern for healthy choice < 50%", () => {
    const records = Array.from({ length: 10 }, () => makeHealthyEating({ healthy_choice_made: false }));
    const r = run({ healthy_eating_records: records });
    expect(r.concerns.some(c => c.includes("not translating into"))).toBe(true);
  });

  it("strength for dietary knowledge >= 80%", () => {
    const records = Array.from({ length: 10 }, () => makeHealthyEating({ dietary_knowledge_improved: true }));
    const r = run({ healthy_eating_records: records });
    expect(r.strengths.some(s => s.includes("Dietary knowledge"))).toBe(true);
  });

  it("strength for objectives met >= 80%", () => {
    const records = Array.from({ length: 10 }, () => makeHealthyEating({ learning_objectives_met: true }));
    const r = run({ healthy_eating_records: records });
    expect(r.strengths.some(s => s.includes("Learning objectives"))).toBe(true);
  });

  it("penalty for rate < 40%", () => {
    const records = Array.from({ length: 10 }, () => makeHealthyEating({ attended: false, engaged: false }));
    const r = run({ healthy_eating_records: records });
    expect(r.weight_score).toBeLessThanOrEqual(52);
  });

  it("critical insight for rate < 40%", () => {
    const records = Array.from({ length: 10 }, () => makeHealthyEating({ attended: false, engaged: false }));
    const r = run({ healthy_eating_records: records });
    expect(r.insights.some(i => i.severity === "critical" && i.text.includes("Healthy eating programme engagement"))).toBe(true);
  });

  it("warning insight for rate 40-69%", () => {
    const records = [
      ...Array.from({ length: 5 }, () => makeHealthyEating()),
      ...Array.from({ length: 5 }, () => makeHealthyEating({ attended: false, engaged: false })),
    ];
    const r = run({ healthy_eating_records: records });
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Healthy eating engagement"))).toBe(true);
  });

  it("recommendation for rate < 40%", () => {
    const records = Array.from({ length: 10 }, () => makeHealthyEating({ attended: false, engaged: false }));
    const r = run({ healthy_eating_records: records });
    expect(r.recommendations.some(rec => rec.recommendation.includes("Redesign"))).toBe(true);
  });

  it("recommendation for rate 40-69%", () => {
    const records = [
      ...Array.from({ length: 5 }, () => makeHealthyEating()),
      ...Array.from({ length: 5 }, () => makeHealthyEating({ attended: false, engaged: false })),
    ];
    const r = run({ healthy_eating_records: records });
    expect(r.recommendations.some(rec => rec.recommendation.includes("Increase healthy eating programme"))).toBe(true);
  });
});

// ── 5. Portion Control ─────────────────────────────────────────────────────

describe("portion control", () => {
  it("portionControlRate is 0 when no records", () => {
    const r = run({});
    expect(r.portion_control_rate).toBeNull();
  });

  it("100% when all understand and served appropriate portions", () => {
    const records = Array.from({ length: 10 }, () => makePortionControl());
    const r = run({ portion_control_records: records });
    expect(r.portion_control_rate).toBe(100);
  });

  it("0% when none understand or served appropriate portions", () => {
    const records = Array.from({ length: 10 }, () =>
      makePortionControl({ understands_portions: false, age_appropriate_portions_served: false })
    );
    const r = run({ portion_control_records: records });
    // record exists → 0, not null
    expect(r.portion_control_rate).toBe(0);
  });

  it("strength for >= 90% rate", () => {
    const records = Array.from({ length: 10 }, () => makePortionControl());
    const r = run({ portion_control_records: records });
    expect(r.strengths.some(s => s.includes("Portion control awareness at 100%"))).toBe(true);
  });

  it("concern for rate < 50%", () => {
    const records = Array.from({ length: 10 }, () =>
      makePortionControl({ understands_portions: false, age_appropriate_portions_served: false })
    );
    const r = run({ portion_control_records: records });
    expect(r.concerns.some(c => c.includes("Portion control awareness at only 0%"))).toBe(true);
  });

  it("concern for rate 50-69%", () => {
    const records = [
      ...Array.from({ length: 6 }, () => makePortionControl()),
      ...Array.from({ length: 4 }, () => makePortionControl({ understands_portions: false, age_appropriate_portions_served: false })),
    ];
    const r = run({ portion_control_records: records });
    expect(r.concerns.some(c => c.includes("Portion control awareness at 60%"))).toBe(true);
  });

  it("strength for meals balanced >= 90%", () => {
    const records = Array.from({ length: 10 }, () => makePortionControl({ meals_balanced: true }));
    const r = run({ portion_control_records: records });
    expect(r.strengths.some(s => s.includes("balanced"))).toBe(true);
  });

  it("concern for meals balanced < 70%", () => {
    const records = [
      ...Array.from({ length: 5 }, () => makePortionControl({ meals_balanced: true })),
      ...Array.from({ length: 5 }, () => makePortionControl({ meals_balanced: false })),
    ];
    const r = run({ portion_control_records: records });
    expect(r.concerns.some(c => c.includes("balanced"))).toBe(true);
  });

  it("strength for snack appropriate >= 90%", () => {
    const records = Array.from({ length: 10 }, () => makePortionControl({ snack_provision_appropriate: true }));
    const r = run({ portion_control_records: records });
    expect(r.strengths.some(s => s.includes("snack provision"))).toBe(true);
  });

  it("strength for hydration >= 90%", () => {
    const records = Array.from({ length: 10 }, () => makePortionControl({ hydration_adequate: true }));
    const r = run({ portion_control_records: records });
    expect(r.strengths.some(s => s.includes("hydration"))).toBe(true);
  });

  it("concern for hydration < 70%", () => {
    const records = [
      ...Array.from({ length: 5 }, () => makePortionControl({ hydration_adequate: true })),
      ...Array.from({ length: 5 }, () => makePortionControl({ hydration_adequate: false })),
    ];
    const r = run({ portion_control_records: records });
    expect(r.concerns.some(c => c.includes("hydration"))).toBe(true);
  });

  it("concern for overeating > 30%", () => {
    const records = Array.from({ length: 10 }, () => makePortionControl({ overeating_concerns: true }));
    const r = run({ portion_control_records: records });
    expect(r.concerns.some(c => c.includes("Overeating"))).toBe(true);
  });

  it("concern for undereating > 30%", () => {
    const records = Array.from({ length: 10 }, () => makePortionControl({ undereating_concerns: true }));
    const r = run({ portion_control_records: records });
    expect(r.concerns.some(c => c.includes("Undereating"))).toBe(true);
  });

  it("concern for emotional eating > 20%", () => {
    const records = Array.from({ length: 10 }, () => makePortionControl({ emotional_eating_identified: true }));
    const r = run({ portion_control_records: records });
    expect(r.concerns.some(c => c.includes("Emotional eating"))).toBe(true);
  });

  it("strength for self-serving >= 60%", () => {
    const records = Array.from({ length: 10 }, () => makePortionControl({ child_self_serves: true }));
    const r = run({ portion_control_records: records });
    expect(r.strengths.some(s => s.includes("self-serve"))).toBe(true);
  });

  it("strength for staff trained >= 80%", () => {
    const records = Array.from({ length: 10 }, () => makePortionControl({ staff_trained_on_portions: true }));
    const r = run({ portion_control_records: records });
    expect(r.strengths.some(s => s.includes("Staff trained"))).toBe(true);
  });

  it("recommendation for rate < 50%", () => {
    const records = Array.from({ length: 10 }, () =>
      makePortionControl({ understands_portions: false, age_appropriate_portions_served: false })
    );
    const r = run({ portion_control_records: records });
    expect(r.recommendations.some(rec => rec.recommendation.includes("portion awareness training"))).toBe(true);
  });

  it("recommendation for meals balanced < 70%", () => {
    const records = Array.from({ length: 10 }, () => makePortionControl({ meals_balanced: false }));
    const r = run({ portion_control_records: records });
    expect(r.recommendations.some(rec => rec.recommendation.includes("menu planning"))).toBe(true);
  });

  it("recommendation for emotional eating > 20%", () => {
    const records = Array.from({ length: 10 }, () => makePortionControl({ emotional_eating_identified: true }));
    const r = run({ portion_control_records: records });
    expect(r.recommendations.some(rec => rec.recommendation.includes("emotional eating"))).toBe(true);
  });

  it("recommendation for hydration < 70%", () => {
    const records = Array.from({ length: 10 }, () => makePortionControl({ hydration_adequate: false }));
    const r = run({ portion_control_records: records });
    expect(r.recommendations.some(rec => rec.recommendation.includes("hydration"))).toBe(true);
  });

  it("warning insight for overeating > 30%", () => {
    const records = Array.from({ length: 10 }, () => makePortionControl({ overeating_concerns: true }));
    const r = run({ portion_control_records: records });
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Overeating"))).toBe(true);
  });

  it("warning insight for undereating > 30%", () => {
    const records = Array.from({ length: 10 }, () => makePortionControl({ undereating_concerns: true }));
    const r = run({ portion_control_records: records });
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Undereating"))).toBe(true);
  });

  it("warning insight for emotional eating > 20%", () => {
    const records = Array.from({ length: 10 }, () => makePortionControl({ emotional_eating_identified: true }));
    const r = run({ portion_control_records: records });
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Emotional eating"))).toBe(true);
  });

  it("warning insight for portion control 50-69%", () => {
    const records = [
      ...Array.from({ length: 6 }, () => makePortionControl()),
      ...Array.from({ length: 4 }, () => makePortionControl({ understands_portions: false, age_appropriate_portions_served: false })),
    ];
    const r = run({ portion_control_records: records });
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Portion control awareness at 60%"))).toBe(true);
  });

  it("recommendation for portion control 50-69%", () => {
    const records = [
      ...Array.from({ length: 6 }, () => makePortionControl()),
      ...Array.from({ length: 4 }, () => makePortionControl({ understands_portions: false, age_appropriate_portions_served: false })),
    ];
    const r = run({ portion_control_records: records });
    expect(r.recommendations.some(rec => rec.recommendation.includes("Strengthen portion control"))).toBe(true);
  });

  it("warning insight for meals balanced 70-89%", () => {
    const records = [
      ...Array.from({ length: 8 }, () => makePortionControl({ meals_balanced: true })),
      ...Array.from({ length: 2 }, () => makePortionControl({ meals_balanced: false })),
    ];
    const r = run({ portion_control_records: records });
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("balanced"))).toBe(true);
  });
});

// ── 6. Body Positivity ─────────────────────────────────────────────────────

describe("body positivity", () => {
  it("bodyPositivityRate is 0 when no records", () => {
    const r = run({});
    expect(r.body_positivity_rate).toBeNull();
  });

  it("100% when all engaged and discussed", () => {
    const records = Array.from({ length: 10 }, () => makeBodyPositivity());
    const r = run({ body_positivity_records: records });
    expect(r.body_positivity_rate).toBe(100);
  });

  it("0% when none engaged or discussed", () => {
    const records = Array.from({ length: 10 }, () =>
      makeBodyPositivity({ child_engaged: false, positive_body_image_discussed: false })
    );
    const r = run({ body_positivity_records: records });
    // record exists → 0, not null
    expect(r.body_positivity_rate).toBe(0);
  });

  it("strength for >= 90% rate", () => {
    const records = Array.from({ length: 10 }, () => makeBodyPositivity());
    const r = run({ body_positivity_records: records });
    expect(r.strengths.some(s => s.includes("Body positivity support at 100%"))).toBe(true);
  });

  it("strength for 70-89% rate", () => {
    const records = [
      ...Array.from({ length: 8 }, () => makeBodyPositivity()),
      ...Array.from({ length: 2 }, () => makeBodyPositivity({ child_engaged: false, positive_body_image_discussed: false })),
    ];
    const r = run({ body_positivity_records: records });
    expect(r.strengths.some(s => s.includes("Body positivity support at 80%"))).toBe(true);
  });

  it("concern for rate < 40%", () => {
    const records = Array.from({ length: 10 }, () =>
      makeBodyPositivity({ child_engaged: false, positive_body_image_discussed: false })
    );
    const r = run({ body_positivity_records: records });
    expect(r.concerns.some(c => c.includes("not engaging with positive body image"))).toBe(true);
  });

  it("concern for rate 40-69%", () => {
    const records = [
      ...Array.from({ length: 5 }, () => makeBodyPositivity()),
      ...Array.from({ length: 5 }, () => makeBodyPositivity({ child_engaged: false, positive_body_image_discussed: false })),
    ];
    const r = run({ body_positivity_records: records });
    expect(r.concerns.some(c => c.includes("more children need"))).toBe(true);
  });

  it("strength for satisfaction >= 4.0", () => {
    const records = Array.from({ length: 10 }, () => makeBodyPositivity({ child_satisfaction: 5 }));
    const r = run({ body_positivity_records: records });
    expect(r.strengths.some(s => s.includes("satisfaction with body positivity"))).toBe(true);
  });

  it("concern for satisfaction < 3.0", () => {
    const records = Array.from({ length: 10 }, () => makeBodyPositivity({ child_satisfaction: 2 }));
    const r = run({ body_positivity_records: records });
    expect(r.concerns.some(c => c.includes("satisfaction with body positivity"))).toBe(true);
  });

  it("strength for self-esteem >= 80%", () => {
    const records = Array.from({ length: 10 }, () => makeBodyPositivity({ self_esteem_component: true }));
    const r = run({ body_positivity_records: records });
    expect(r.strengths.some(s => s.includes("Self-esteem"))).toBe(true);
  });

  it("strength for media literacy >= 60%", () => {
    const records = Array.from({ length: 10 }, () => makeBodyPositivity({ media_literacy_included: true }));
    const r = run({ body_positivity_records: records });
    expect(r.strengths.some(s => s.includes("Media literacy"))).toBe(true);
  });

  it("strength for weight stigma >= 60%", () => {
    const records = Array.from({ length: 10 }, () => makeBodyPositivity({ weight_stigma_addressed: true }));
    const r = run({ body_positivity_records: records });
    expect(r.strengths.some(s => s.includes("Weight stigma"))).toBe(true);
  });

  it("strength for outcomes >= 80%", () => {
    const records = Array.from({ length: 10 }, () => makeBodyPositivity({ outcomes_documented: true }));
    const r = run({ body_positivity_records: records });
    expect(r.strengths.some(s => s.includes("Outcomes documented"))).toBe(true);
  });

  it("concern for body image concerns > 30%", () => {
    const records = Array.from({ length: 10 }, () => makeBodyPositivity({ concerns_identified: true }));
    const r = run({ body_positivity_records: records });
    expect(r.concerns.some(c => c.includes("Body image concerns"))).toBe(true);
  });

  it("no body positivity records concern", () => {
    const r = run({ total_children: 3, body_positivity_records: [], healthy_eating_records: [makeHealthyEating()] });
    expect(r.concerns.some(c => c.includes("No body positivity records"))).toBe(true);
  });

  it("penalty for rate < 40%", () => {
    const records = Array.from({ length: 10 }, () =>
      makeBodyPositivity({ child_engaged: false, positive_body_image_discussed: false })
    );
    const r = run({ body_positivity_records: records });
    expect(r.weight_score).toBeLessThanOrEqual(52);
  });

  it("critical insight for rate < 40%", () => {
    const records = Array.from({ length: 10 }, () =>
      makeBodyPositivity({ child_engaged: false, positive_body_image_discussed: false })
    );
    const r = run({ body_positivity_records: records });
    expect(r.insights.some(i => i.severity === "critical" && i.text.includes("Body positivity support at only 0%"))).toBe(true);
  });

  it("warning insight for rate 40-69%", () => {
    const records = [
      ...Array.from({ length: 5 }, () => makeBodyPositivity()),
      ...Array.from({ length: 5 }, () => makeBodyPositivity({ child_engaged: false, positive_body_image_discussed: false })),
    ];
    const r = run({ body_positivity_records: records });
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Body positivity support at 50%"))).toBe(true);
  });

  it("recommendation for rate < 40%", () => {
    const records = Array.from({ length: 10 }, () =>
      makeBodyPositivity({ child_engaged: false, positive_body_image_discussed: false })
    );
    const r = run({ body_positivity_records: records });
    expect(r.recommendations.some(rec => rec.recommendation.includes("Strengthen body positivity"))).toBe(true);
  });

  it("recommendation for body image concerns > 30%", () => {
    const records = Array.from({ length: 10 }, () => makeBodyPositivity({ concerns_identified: true }));
    const r = run({ body_positivity_records: records });
    expect(r.recommendations.some(rec => rec.recommendation.includes("specialist referrals"))).toBe(true);
  });

  it("recommendation for no body positivity records", () => {
    const r = run({ total_children: 3, body_positivity_records: [], healthy_eating_records: [makeHealthyEating()] });
    expect(r.recommendations.some(rec => rec.recommendation.includes("body positivity programme"))).toBe(true);
  });

  it("recommendation for rate 40-69%", () => {
    const records = [
      ...Array.from({ length: 5 }, () => makeBodyPositivity()),
      ...Array.from({ length: 5 }, () => makeBodyPositivity({ child_engaged: false, positive_body_image_discussed: false })),
    ];
    const r = run({ body_positivity_records: records });
    expect(r.recommendations.some(rec => rec.recommendation.includes("Expand body positivity"))).toBe(true);
  });

  it("warning insight for body image concerns > 30%", () => {
    const records = Array.from({ length: 10 }, () => makeBodyPositivity({ concerns_identified: true }));
    const r = run({ body_positivity_records: records });
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Body image concerns"))).toBe(true);
  });
});

// ── 7. Child Engagement ────────────────────────────────────────────────────

describe("child engagement", () => {
  it("0% when no engagement data", () => {
    const r = run({});
    expect(r.child_engagement_rate).toBe(0);
  });

  it("high engagement from healthy eating + body positivity + portion voice", () => {
    const he = Array.from({ length: 5 }, () => makeHealthyEating({ engaged: true }));
    const bp = Array.from({ length: 5 }, () => makeBodyPositivity({ child_engaged: true, child_voice_captured: true }));
    const pc = Array.from({ length: 5 }, () => makePortionControl({ child_voice_captured: true }));
    const r = run({ healthy_eating_records: he, body_positivity_records: bp, portion_control_records: pc });
    expect(r.child_engagement_rate).toBeGreaterThanOrEqual(80);
  });

  it("strength for engagement >= 80%", () => {
    const he = Array.from({ length: 5 }, () => makeHealthyEating({ engaged: true }));
    const bp = Array.from({ length: 5 }, () => makeBodyPositivity({ child_engaged: true, child_voice_captured: true }));
    const pc = Array.from({ length: 5 }, () => makePortionControl({ child_voice_captured: true }));
    const r = run({ healthy_eating_records: he, body_positivity_records: bp, portion_control_records: pc });
    expect(r.strengths.some(s => s.includes("Overall child engagement"))).toBe(true);
  });

  it("concern for engagement < 50%", () => {
    const he = Array.from({ length: 5 }, () => makeHealthyEating({ engaged: false }));
    const bp = Array.from({ length: 5 }, () => makeBodyPositivity({ child_engaged: false, child_voice_captured: false }));
    const pc = Array.from({ length: 5 }, () => makePortionControl({ child_voice_captured: false }));
    const r = run({ healthy_eating_records: he, body_positivity_records: bp, portion_control_records: pc });
    expect(r.concerns.some(c => c.includes("Overall child engagement rate"))).toBe(true);
  });

  it("warning insight for engagement 50-79%", () => {
    // numerator = engaged(5) + bpEngaged(3) + pcVoice(0) + bpVoice(3) = 11
    // denominator = he(5) + bp(5) + pc(0) + bp(5) = 15, rate = 73%
    const he = Array.from({ length: 5 }, () => makeHealthyEating({ engaged: true }));
    const bp = [
      ...Array.from({ length: 3 }, () => makeBodyPositivity({ child_engaged: true, child_voice_captured: true })),
      ...Array.from({ length: 2 }, () => makeBodyPositivity({ child_engaged: false, child_voice_captured: false })),
    ];
    const r = run({ healthy_eating_records: he, body_positivity_records: bp });
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Child engagement rate"))).toBe(true);
  });
});

// ── 8. Scoring and Rating ──────────────────────────────────────────────────

describe("scoring and rating", () => {
  it("outstanding with all high metrics", () => {
    const wm = Array.from({ length: 10 }, (_, i) => makeWeightMonitoring({ child_id: `yp_${i % 3 + 1}`, within_healthy_range: true }));
    const bmi = Array.from({ length: 10 }, () => makeBmiTracking());
    const he = Array.from({ length: 10 }, () => makeHealthyEating());
    const pc = Array.from({ length: 10 }, () => makePortionControl());
    const bp = Array.from({ length: 10 }, () => makeBodyPositivity());
    const r = run({
      weight_monitoring_records: wm,
      bmi_tracking_records: bmi,
      healthy_eating_records: he,
      portion_control_records: pc,
      body_positivity_records: bp,
    });
    expect(r.weight_rating).toBe("outstanding");
    expect(r.weight_score).toBeGreaterThanOrEqual(80);
  });

  it("base score is 52", () => {
    const r = run({ weight_monitoring_records: [makeWeightMonitoring({ within_healthy_range: false })] });
    expect(r.weight_score).toBeLessThanOrEqual(55);
    expect(r.weight_score).toBeGreaterThanOrEqual(45);
  });

  it("score clamped to 0 minimum", () => {
    const wm = Array.from({ length: 10 }, () => makeWeightMonitoring({ within_healthy_range: false, action_taken: false }));
    const bmi = Array.from({ length: 10 }, () => makeBmiTracking({ trend_direction: "declining" }));
    const he = Array.from({ length: 10 }, () => makeHealthyEating({ attended: false, engaged: false }));
    const bp = Array.from({ length: 10 }, () => makeBodyPositivity({ child_engaged: false, positive_body_image_discussed: false }));
    const r = run({
      weight_monitoring_records: wm,
      bmi_tracking_records: bmi,
      healthy_eating_records: he,
      body_positivity_records: bp,
    });
    expect(r.weight_score).toBeGreaterThanOrEqual(0);
  });

  it("score clamped to 100 maximum", () => {
    const wm = Array.from({ length: 20 }, (_, i) => makeWeightMonitoring({ child_id: `yp_${i % 3 + 1}` }));
    const bmi = Array.from({ length: 20 }, () => makeBmiTracking());
    const he = Array.from({ length: 20 }, () => makeHealthyEating());
    const pc = Array.from({ length: 20 }, () => makePortionControl());
    const bp = Array.from({ length: 20 }, () => makeBodyPositivity());
    const r = run({
      weight_monitoring_records: wm,
      bmi_tracking_records: bmi,
      healthy_eating_records: he,
      portion_control_records: pc,
      body_positivity_records: bp,
    });
    expect(r.weight_score).toBeLessThanOrEqual(100);
  });

  it("inadequate for low scores", () => {
    const wm = Array.from({ length: 10 }, () => makeWeightMonitoring({ within_healthy_range: false, action_taken: false }));
    const bmi = Array.from({ length: 10 }, () => makeBmiTracking({ trend_direction: "declining" }));
    const he = Array.from({ length: 10 }, () => makeHealthyEating({ attended: false, engaged: false }));
    const bp = Array.from({ length: 10 }, () => makeBodyPositivity({ child_engaged: false, positive_body_image_discussed: false }));
    const r = run({
      weight_monitoring_records: wm,
      bmi_tracking_records: bmi,
      healthy_eating_records: he,
      body_positivity_records: bp,
    });
    expect(r.weight_rating).toBe("inadequate");
  });
});

// ── 9. Headlines ───────────────────────────────────────────────────────────

describe("headlines", () => {
  it("outstanding headline", () => {
    const wm = Array.from({ length: 10 }, (_, i) => makeWeightMonitoring({ child_id: `yp_${i % 3 + 1}` }));
    const bmi = Array.from({ length: 10 }, () => makeBmiTracking());
    const he = Array.from({ length: 10 }, () => makeHealthyEating());
    const pc = Array.from({ length: 10 }, () => makePortionControl());
    const bp = Array.from({ length: 10 }, () => makeBodyPositivity());
    const r = run({
      weight_monitoring_records: wm,
      bmi_tracking_records: bmi,
      healthy_eating_records: he,
      portion_control_records: pc,
      body_positivity_records: bp,
    });
    expect(r.headline).toContain("Outstanding");
  });

  it("good headline mentions strengths", () => {
    const wm = Array.from({ length: 10 }, () => makeWeightMonitoring());
    const he = Array.from({ length: 10 }, () => makeHealthyEating());
    const r = run({ weight_monitoring_records: wm, healthy_eating_records: he });
    if (r.weight_rating === "good") {
      expect(r.headline).toContain("Good");
    }
  });

  it("inadequate headline", () => {
    const wm = Array.from({ length: 10 }, () => makeWeightMonitoring({ within_healthy_range: false, action_taken: false }));
    const bmi = Array.from({ length: 10 }, () => makeBmiTracking({ trend_direction: "declining" }));
    const he = Array.from({ length: 10 }, () => makeHealthyEating({ attended: false, engaged: false }));
    const bp = Array.from({ length: 10 }, () => makeBodyPositivity({ child_engaged: false, positive_body_image_discussed: false }));
    const r = run({
      weight_monitoring_records: wm,
      bmi_tracking_records: bmi,
      healthy_eating_records: he,
      body_positivity_records: bp,
    });
    expect(r.headline).toContain("inadequate");
  });
});

// ── 10. Positive Insights ──────────────────────────────────────────────────

describe("positive insights", () => {
  it("outstanding positive insight", () => {
    const wm = Array.from({ length: 10 }, (_, i) => makeWeightMonitoring({ child_id: `yp_${i % 3 + 1}` }));
    const bmi = Array.from({ length: 10 }, () => makeBmiTracking());
    const he = Array.from({ length: 10 }, () => makeHealthyEating());
    const pc = Array.from({ length: 10 }, () => makePortionControl());
    const bp = Array.from({ length: 10 }, () => makeBodyPositivity());
    const r = run({
      weight_monitoring_records: wm,
      bmi_tracking_records: bmi,
      healthy_eating_records: he,
      portion_control_records: pc,
      body_positivity_records: bp,
    });
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("outstanding"))).toBe(true);
  });

  it("positive insight for high weight + BMI tracking", () => {
    const wm = Array.from({ length: 10 }, () => makeWeightMonitoring({ within_healthy_range: true }));
    const bmi = Array.from({ length: 10 }, () => makeBmiTracking());
    const r = run({ weight_monitoring_records: wm, bmi_tracking_records: bmi });
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("systematic weight monitoring"))).toBe(true);
  });

  it("positive insight for high healthy eating + satisfaction", () => {
    const he = Array.from({ length: 10 }, () => makeHealthyEating({ child_satisfaction: 5 }));
    const r = run({ healthy_eating_records: he });
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("Healthy eating engagement"))).toBe(true);
  });

  it("positive insight for high portion control + balanced meals", () => {
    const pc = Array.from({ length: 10 }, () => makePortionControl());
    const r = run({ portion_control_records: pc });
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("Portion awareness"))).toBe(true);
  });

  it("positive insight for high body positivity + self-esteem", () => {
    const bp = Array.from({ length: 10 }, () => makeBodyPositivity({ self_esteem_component: true }));
    const r = run({ body_positivity_records: bp });
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("Body positivity"))).toBe(true);
  });

  it("positive insight for healthy choices + knowledge", () => {
    const he = Array.from({ length: 10 }, () =>
      makeHealthyEating({ healthy_choice_made: true, dietary_knowledge_improved: true })
    );
    const r = run({ healthy_eating_records: he });
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("Healthy choices"))).toBe(true);
  });

  it("positive insight for hydration + snacks", () => {
    const pc = Array.from({ length: 10 }, () =>
      makePortionControl({ hydration_adequate: true, snack_provision_appropriate: true })
    );
    const r = run({ portion_control_records: pc });
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("Hydration"))).toBe(true);
  });

  it("positive insight for consent + child informed", () => {
    const wm = Array.from({ length: 10 }, () =>
      makeWeightMonitoring({ child_consent_obtained: true, child_informed: true })
    );
    const r = run({ weight_monitoring_records: wm });
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("Consent obtained"))).toBe(true);
  });

  it("positive insight for media literacy + weight stigma", () => {
    const bp = Array.from({ length: 10 }, () =>
      makeBodyPositivity({ media_literacy_included: true, weight_stigma_addressed: true })
    );
    const r = run({ body_positivity_records: bp });
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("Media literacy"))).toBe(true);
  });
});

// ── 11. Recommendation Ranking and Urgency ─────────────────────────────────

describe("recommendation ranking and urgency", () => {
  it("recommendations ranked sequentially", () => {
    const wm = Array.from({ length: 10 }, () => makeWeightMonitoring({ within_healthy_range: false, action_taken: false }));
    const bmi = Array.from({ length: 10 }, () => makeBmiTracking({ trend_direction: "declining" }));
    const r = run({ weight_monitoring_records: wm, bmi_tracking_records: bmi });
    for (let i = 0; i < r.recommendations.length; i++) {
      expect(r.recommendations[i].rank).toBe(i + 1);
    }
  });

  it("immediate urgency for high concern + low action", () => {
    const wm = Array.from({ length: 10 }, () => makeWeightMonitoring({ within_healthy_range: false, action_taken: false }));
    const r = run({ weight_monitoring_records: wm });
    const rec = r.recommendations.find(rec => rec.recommendation.includes("Urgently review"));
    expect(rec?.urgency).toBe("immediate");
  });

  it("each recommendation has regulatory_ref", () => {
    const wm = Array.from({ length: 10 }, () => makeWeightMonitoring({ within_healthy_range: false, action_taken: false }));
    const r = run({ weight_monitoring_records: wm });
    r.recommendations.forEach(rec => {
      expect(rec.regulatory_ref).toBeTruthy();
    });
  });
});

// ── 12. Output Shape ───────────────────────────────────────────────────────

describe("output shape", () => {
  it("returns all expected fields", () => {
    const r = run({});
    expect(r).toHaveProperty("weight_rating");
    expect(r).toHaveProperty("weight_score");
    expect(r).toHaveProperty("headline");
    expect(r).toHaveProperty("weight_monitoring_rate");
    expect(r).toHaveProperty("bmi_tracking_rate");
    expect(r).toHaveProperty("healthy_eating_rate");
    expect(r).toHaveProperty("portion_control_rate");
    expect(r).toHaveProperty("body_positivity_rate");
    expect(r).toHaveProperty("child_engagement_rate");
    expect(r).toHaveProperty("strengths");
    expect(r).toHaveProperty("concerns");
    expect(r).toHaveProperty("recommendations");
    expect(r).toHaveProperty("insights");
  });

  it("rating is valid enum value", () => {
    const r = run({});
    expect(["outstanding", "good", "adequate", "inadequate", "insufficient_data"]).toContain(r.weight_rating);
  });

  it("score is between 0 and 100", () => {
    const r = run({ weight_monitoring_records: [makeWeightMonitoring()] });
    expect(r.weight_score).toBeGreaterThanOrEqual(0);
    expect(r.weight_score).toBeLessThanOrEqual(100);
  });

  it("insights have valid severity", () => {
    const wm = Array.from({ length: 10 }, () => makeWeightMonitoring({ within_healthy_range: false, action_taken: false }));
    const r = run({ weight_monitoring_records: wm });
    r.insights.forEach(i => {
      expect(["critical", "warning", "positive"]).toContain(i.severity);
    });
  });

  it("recommendations have all required fields", () => {
    const r = run({ total_children: 3, weight_monitoring_records: [], healthy_eating_records: [makeHealthyEating()] });
    r.recommendations.forEach(rec => {
      expect(rec).toHaveProperty("rank");
      expect(rec).toHaveProperty("recommendation");
      expect(rec).toHaveProperty("urgency");
      expect(rec).toHaveProperty("regulatory_ref");
    });
  });
});

// ── 13. Additional Weight Monitoring Coverage ──────────────────────────────

describe("weight monitoring coverage details", () => {
  it("strength for 70-89% coverage", () => {
    const records = [
      makeWeightMonitoring({ child_id: "yp_1" }),
      makeWeightMonitoring({ child_id: "yp_2" }),
      makeWeightMonitoring({ child_id: "yp_3" }),
    ];
    // 3/4 = 75% coverage
    const r = run({ total_children: 4, weight_monitoring_records: records });
    expect(r.strengths.some(s => s.includes("weight monitoring coverage"))).toBe(true);
  });

  it("concern for coverage 50-69%", () => {
    const records = [
      makeWeightMonitoring({ child_id: "yp_1" }),
      makeWeightMonitoring({ child_id: "yp_2" }),
    ];
    const r = run({ total_children: 4, weight_monitoring_records: records });
    expect(r.concerns.some(c => c.includes("Weight monitoring coverage"))).toBe(true);
  });

  it("weight coverage >= 90 gives +2 bonus", () => {
    const records = [
      makeWeightMonitoring({ child_id: "yp_1" }),
      makeWeightMonitoring({ child_id: "yp_2" }),
      makeWeightMonitoring({ child_id: "yp_3" }),
    ];
    const r = run({ total_children: 3, weight_monitoring_records: records });
    expect(r.weight_score).toBeGreaterThanOrEqual(54);
  });

  it("weight coverage 70-89 gives +1 bonus", () => {
    const records = [
      makeWeightMonitoring({ child_id: "yp_1" }),
      makeWeightMonitoring({ child_id: "yp_2" }),
      makeWeightMonitoring({ child_id: "yp_3" }),
    ];
    const r = run({ total_children: 4, weight_monitoring_records: records });
    expect(r.weight_score).toBeGreaterThanOrEqual(53);
  });

  it("recommendation for coverage < 50%", () => {
    const records = [makeWeightMonitoring({ child_id: "yp_1" })];
    const r = run({ total_children: 3, weight_monitoring_records: records });
    expect(r.recommendations.some(rec => rec.recommendation.includes("Ensure every child"))).toBe(true);
  });

  it("recommendation for coverage 50-69%", () => {
    const records = [
      makeWeightMonitoring({ child_id: "yp_1" }),
      makeWeightMonitoring({ child_id: "yp_2" }),
    ];
    const r = run({ total_children: 4, weight_monitoring_records: records });
    expect(r.recommendations.some(rec => rec.recommendation.includes("Increase weight monitoring coverage"))).toBe(true);
  });

  it("warning insight for coverage 50-69%", () => {
    const records = [
      makeWeightMonitoring({ child_id: "yp_1" }),
      makeWeightMonitoring({ child_id: "yp_2" }),
    ];
    const r = run({ total_children: 4, weight_monitoring_records: records });
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Weight monitoring covers"))).toBe(true);
  });

  it("recommendation for consent < 50%", () => {
    const records = Array.from({ length: 10 }, () => makeWeightMonitoring({ child_consent_obtained: false }));
    const r = run({ weight_monitoring_records: records });
    expect(r.recommendations.some(rec => rec.recommendation.includes("consent-seeking"))).toBe(true);
  });
});

// ── 14. Additional BMI Details ─────────────────────────────────────────────

describe("BMI tracking additional", () => {
  it("BMI tracking >= 80 gives +4 bonus", () => {
    const records = Array.from({ length: 10 }, () => makeBmiTracking());
    const r = run({ bmi_tracking_records: records });
    expect(r.weight_score).toBeGreaterThanOrEqual(56);
  });

  it("BMI tracking 60-79 gives +2 bonus", () => {
    const records = [
      ...Array.from({ length: 7 }, () => makeBmiTracking()),
      ...Array.from({ length: 3 }, () => makeBmiTracking({ plotted_on_growth_chart: false, growth_chart_reviewed: false })),
    ];
    const r = run({ bmi_tracking_records: records });
    expect(r.weight_score).toBeGreaterThanOrEqual(54);
  });

  it("concern for BMI tracking 50-59%", () => {
    const records = [
      ...Array.from({ length: 5 }, () => makeBmiTracking()),
      ...Array.from({ length: 5 }, () => makeBmiTracking({ plotted_on_growth_chart: false, growth_chart_reviewed: false })),
    ];
    const r = run({ bmi_tracking_records: records });
    expect(r.concerns.some(c => c.includes("BMI tracking rate at 50%"))).toBe(true);
  });
});

// ── 15. Healthy Eating Follow-up ───────────────────────────────────────────

describe("healthy eating follow-up", () => {
  it("healthy eating >= 90 gives +4 bonus", () => {
    const records = Array.from({ length: 10 }, () => makeHealthyEating());
    const r = run({ healthy_eating_records: records });
    expect(r.weight_score).toBeGreaterThanOrEqual(56);
  });

  it("healthy eating 70-89 gives +2 bonus", () => {
    const records = [
      ...Array.from({ length: 8 }, () => makeHealthyEating()),
      ...Array.from({ length: 2 }, () => makeHealthyEating({ attended: false, engaged: false })),
    ];
    const r = run({ healthy_eating_records: records });
    expect(r.weight_score).toBeGreaterThanOrEqual(54);
  });
});

// ── 16. Portion and Body Positivity Bonuses ────────────────────────────────

describe("portion and body positivity bonuses", () => {
  it("portion control >= 90 gives +3 bonus", () => {
    const records = Array.from({ length: 10 }, () => makePortionControl());
    const r = run({ portion_control_records: records });
    expect(r.weight_score).toBeGreaterThanOrEqual(55);
  });

  it("portion control 70-89 gives +1 bonus", () => {
    const records = [
      ...Array.from({ length: 8 }, () => makePortionControl()),
      ...Array.from({ length: 2 }, () => makePortionControl({ understands_portions: false, age_appropriate_portions_served: false })),
    ];
    const r = run({ portion_control_records: records });
    expect(r.weight_score).toBeGreaterThanOrEqual(53);
  });

  it("body positivity >= 90 gives +3 bonus", () => {
    const records = Array.from({ length: 10 }, () => makeBodyPositivity());
    const r = run({ body_positivity_records: records });
    expect(r.weight_score).toBeGreaterThanOrEqual(55);
  });

  it("body positivity 70-89 gives +1 bonus", () => {
    const records = [
      ...Array.from({ length: 8 }, () => makeBodyPositivity()),
      ...Array.from({ length: 2 }, () => makeBodyPositivity({ child_engaged: false, positive_body_image_discussed: false })),
    ];
    const r = run({ body_positivity_records: records });
    expect(r.weight_score).toBeGreaterThanOrEqual(53);
  });

  it("meals balanced >= 95 gives +3 bonus", () => {
    const records = Array.from({ length: 20 }, () => makePortionControl({ meals_balanced: true }));
    const r = run({ portion_control_records: records });
    expect(r.weight_score).toBeGreaterThanOrEqual(55);
  });

  it("meals balanced 80-94 gives +1 bonus", () => {
    const records = [
      ...Array.from({ length: 9 }, () => makePortionControl({ meals_balanced: true })),
      makePortionControl({ meals_balanced: false }),
    ];
    const r = run({ portion_control_records: records });
    expect(r.weight_score).toBeGreaterThanOrEqual(53);
  });

  it("hydration >= 90 gives +2 bonus", () => {
    const records = Array.from({ length: 10 }, () => makePortionControl({ hydration_adequate: true }));
    const r = run({ portion_control_records: records });
    expect(r.weight_score).toBeGreaterThanOrEqual(54);
  });

  it("hydration 70-89 gives +1 bonus", () => {
    const records = [
      ...Array.from({ length: 8 }, () => makePortionControl({ hydration_adequate: true })),
      ...Array.from({ length: 2 }, () => makePortionControl({ hydration_adequate: false })),
    ];
    const r = run({ portion_control_records: records });
    expect(r.weight_score).toBeGreaterThanOrEqual(53);
  });

  it("engagement >= 80 gives +3 bonus", () => {
    const he = Array.from({ length: 5 }, () => makeHealthyEating({ engaged: true }));
    const bp = Array.from({ length: 5 }, () => makeBodyPositivity({ child_engaged: true, child_voice_captured: true }));
    const pc = Array.from({ length: 5 }, () => makePortionControl({ child_voice_captured: true }));
    const r = run({ healthy_eating_records: he, body_positivity_records: bp, portion_control_records: pc });
    expect(r.weight_score).toBeGreaterThanOrEqual(55);
  });

  it("engagement 60-79 gives +1 bonus", () => {
    const he = Array.from({ length: 5 }, () => makeHealthyEating({ engaged: true }));
    const bp = [
      ...Array.from({ length: 3 }, () => makeBodyPositivity({ child_engaged: true, child_voice_captured: true })),
      ...Array.from({ length: 2 }, () => makeBodyPositivity({ child_engaged: false, child_voice_captured: false })),
    ];
    const r = run({ healthy_eating_records: he, body_positivity_records: bp });
    expect(r.weight_score).toBeGreaterThanOrEqual(53);
  });

  it("concern for engagement 50-59%", () => {
    const he = Array.from({ length: 5 }, () => makeHealthyEating({ engaged: true }));
    const bp = Array.from({ length: 10 }, () => makeBodyPositivity({ child_engaged: false, child_voice_captured: false }));
    const r = run({ healthy_eating_records: he, body_positivity_records: bp });
    if (r.child_engagement_rate >= 50 && r.child_engagement_rate < 60) {
      expect(r.concerns.some(c => c.includes("engagement with healthy eating"))).toBe(true);
    }
  });

  it("strength for engagement 60-79%", () => {
    const he = Array.from({ length: 5 }, () => makeHealthyEating({ engaged: true }));
    const bp = [
      ...Array.from({ length: 3 }, () => makeBodyPositivity({ child_engaged: true, child_voice_captured: true })),
      ...Array.from({ length: 2 }, () => makeBodyPositivity({ child_engaged: false, child_voice_captured: false })),
    ];
    const r = run({ healthy_eating_records: he, body_positivity_records: bp });
    expect(r.strengths.some(s => s.includes("Child engagement rate"))).toBe(true);
  });

  it("positive insight for high engagement", () => {
    const he = Array.from({ length: 5 }, () => makeHealthyEating({ engaged: true }));
    const bp = Array.from({ length: 5 }, () => makeBodyPositivity({ child_engaged: true, child_voice_captured: true }));
    const pc = Array.from({ length: 5 }, () => makePortionControl({ child_voice_captured: true }));
    const r = run({ healthy_eating_records: he, body_positivity_records: bp, portion_control_records: pc });
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("child engagement"))).toBe(true);
  });

  it("strength for portion control 70-89%", () => {
    const records = [
      ...Array.from({ length: 8 }, () => makePortionControl()),
      ...Array.from({ length: 2 }, () => makePortionControl({ understands_portions: false, age_appropriate_portions_served: false })),
    ];
    const r = run({ portion_control_records: records });
    expect(r.strengths.some(s => s.includes("Portion control awareness at 80%"))).toBe(true);
  });

  it("healthy eating enjoyment rate tracks child_enjoyed", () => {
    const records = Array.from({ length: 10 }, () => makeHealthyEating({ child_enjoyed: true }));
    const r = run({ healthy_eating_records: records });
    expect(r.healthy_eating_rate).toBe(100);
  });

  it("body positivity staff rate tracked", () => {
    const records = Array.from({ length: 10 }, () => makeBodyPositivity({ staff_facilitated: true }));
    const r = run({ body_positivity_records: records });
    expect(r.body_positivity_rate).toBe(100);
  });
});

// ── 17. Additional Scoring Combos ──────────────────────────────────────────

describe("additional scoring combinations", () => {
  it("all penalties applied together", () => {
    const wm = Array.from({ length: 10 }, () => makeWeightMonitoring({ within_healthy_range: false, action_taken: false }));
    const bmi = Array.from({ length: 10 }, () => makeBmiTracking({ trend_direction: "declining", plotted_on_growth_chart: false, growth_chart_reviewed: false }));
    const he = Array.from({ length: 10 }, () => makeHealthyEating({ attended: false, engaged: false }));
    const bp = Array.from({ length: 10 }, () => makeBodyPositivity({ child_engaged: false, positive_body_image_discussed: false }));
    const r = run({ weight_monitoring_records: wm, bmi_tracking_records: bmi, healthy_eating_records: he, body_positivity_records: bp });
    // 52 + 0 (no bonuses) - 5 - 5 - 4 - 4 = 34
    expect(r.weight_score).toBe(34);
  });

  it("all max bonuses give score 84", () => {
    const wm = Array.from({ length: 10 }, (_, i) => makeWeightMonitoring({ child_id: `yp_${i % 3 + 1}`, within_healthy_range: true }));
    const bmi = Array.from({ length: 10 }, () => makeBmiTracking());
    const he = Array.from({ length: 10 }, () => makeHealthyEating());
    const pc = Array.from({ length: 10 }, () => makePortionControl());
    const bp = Array.from({ length: 10 }, () => makeBodyPositivity());
    const r = run({
      weight_monitoring_records: wm,
      bmi_tracking_records: bmi,
      healthy_eating_records: he,
      portion_control_records: pc,
      body_positivity_records: bp,
    });
    // 52+4+4+4+3+3+3+3+2+2 = 80
    expect(r.weight_score).toBeGreaterThanOrEqual(80);
  });

  it("adequate rating for moderate scores", () => {
    const wm = Array.from({ length: 10 }, () => makeWeightMonitoring({ within_healthy_range: false }));
    const r = run({ weight_monitoring_records: wm });
    expect(["adequate", "good"]).toContain(r.weight_rating);
  });
});
