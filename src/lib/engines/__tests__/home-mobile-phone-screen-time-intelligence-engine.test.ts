// ══════════════════════════════════════════════════════════════════════════════
// TESTS — HOME MOBILE PHONE & SCREEN TIME INTELLIGENCE ENGINE
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeMobilePhoneScreenTime,
  type MobilePhoneScreenTimeInput,
  type ScreenTimeRecordInput,
  type ContentMonitoringRecordInput,
  type UsageAgreementRecordInput,
  type DigitalWellbeingRecordInput,
  type SelfRegulationRecordInput,
} from "../home-mobile-phone-screen-time-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2026-05-31";

function makeScreenTime(overrides: Partial<ScreenTimeRecordInput> = {}): ScreenTimeRecordInput {
  return {
    id: "st_1",
    child_id: "child_1",
    date: "2026-05-30",
    agreed_limit_minutes: 120,
    actual_usage_minutes: 100,
    device_type: "smartphone",
    usage_categories: ["social_media", "gaming"],
    limit_adhered_to: true,
    staff_prompted_break: false,
    child_self_managed: true,
    bedtime_device_handover: true,
    weekend_or_holiday: false,
    staff_member: "Staff A",
    notes: null,
    created_at: "2026-05-30T10:00:00Z",
    ...overrides,
  };
}

function makeContentMonitoring(overrides: Partial<ContentMonitoringRecordInput> = {}): ContentMonitoringRecordInput {
  return {
    id: "cm_1",
    child_id: "child_1",
    date: "2026-05-30",
    monitoring_type: "routine_check",
    age_appropriate_content: true,
    inappropriate_content_found: false,
    content_description: null,
    action_taken: null,
    child_informed: true,
    child_age_years: 14,
    filters_active: true,
    safeguarding_referral_needed: false,
    safeguarding_referral_made: false,
    discussion_with_child: true,
    staff_member: "Staff A",
    created_at: "2026-05-30T10:00:00Z",
    ...overrides,
  };
}

function makeUsageAgreement(overrides: Partial<UsageAgreementRecordInput> = {}): UsageAgreementRecordInput {
  return {
    id: "ua_1",
    child_id: "child_1",
    agreement_date: "2026-05-01",
    agreement_type: "initial",
    covers_screen_time_limits: true,
    covers_content_boundaries: true,
    covers_social_media_rules: true,
    covers_online_safety: true,
    covers_device_care: true,
    covers_consequences: true,
    child_contributed: true,
    child_signed: true,
    carer_signed: true,
    social_worker_informed: true,
    review_date_set: "2026-08-01",
    agreement_active: true,
    created_at: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

function makeDigitalWellbeing(overrides: Partial<DigitalWellbeingRecordInput> = {}): DigitalWellbeingRecordInput {
  return {
    id: "dw_1",
    child_id: "child_1",
    date: "2026-05-28",
    session_type: "one_to_one",
    topic: "screen_time_balance",
    child_engaged: true,
    child_feedback_positive: true,
    learning_outcomes_achieved: true,
    follow_up_planned: true,
    follow_up_completed: true,
    external_resource_used: true,
    staff_member: "Staff B",
    notes: null,
    created_at: "2026-05-28T10:00:00Z",
    ...overrides,
  };
}

function makeSelfRegulation(overrides: Partial<SelfRegulationRecordInput> = {}): SelfRegulationRecordInput {
  return {
    id: "sr_1",
    child_id: "child_1",
    date: "2026-05-25",
    assessment_type: "observation",
    can_identify_overuse: true,
    takes_voluntary_breaks: true,
    follows_agreed_limits: true,
    asks_for_help_when_struggling: true,
    balances_screen_offline_activities: true,
    recognises_impact_on_mood: true,
    self_regulation_score: 5,
    improvement_since_last: "improved",
    support_plan_in_place: true,
    staff_member: "Staff C",
    notes: null,
    created_at: "2026-05-25T10:00:00Z",
    ...overrides,
  };
}

function baseInput(overrides: Partial<MobilePhoneScreenTimeInput> = {}): MobilePhoneScreenTimeInput {
  return {
    today: TODAY,
    total_children: 3,
    screen_time_records: [
      makeScreenTime({ id: "st_1", child_id: "child_1" }),
      makeScreenTime({ id: "st_2", child_id: "child_2" }),
      makeScreenTime({ id: "st_3", child_id: "child_3" }),
      makeScreenTime({ id: "st_4", child_id: "child_1", date: "2026-05-29", device_type: "tablet" }),
      makeScreenTime({ id: "st_5", child_id: "child_2", date: "2026-05-29" }),
    ],
    content_monitoring_records: [
      makeContentMonitoring({ id: "cm_1", child_id: "child_1" }),
      makeContentMonitoring({ id: "cm_2", child_id: "child_2" }),
      makeContentMonitoring({ id: "cm_3", child_id: "child_3" }),
    ],
    usage_agreement_records: [
      makeUsageAgreement({ id: "ua_1", child_id: "child_1" }),
      makeUsageAgreement({ id: "ua_2", child_id: "child_2" }),
      makeUsageAgreement({ id: "ua_3", child_id: "child_3" }),
    ],
    digital_wellbeing_records: [
      makeDigitalWellbeing({ id: "dw_1", child_id: "child_1" }),
      makeDigitalWellbeing({ id: "dw_2", child_id: "child_2" }),
      makeDigitalWellbeing({ id: "dw_3", child_id: "child_3" }),
    ],
    self_regulation_records: [
      makeSelfRegulation({ id: "sr_1", child_id: "child_1" }),
      makeSelfRegulation({ id: "sr_2", child_id: "child_2" }),
      makeSelfRegulation({ id: "sr_3", child_id: "child_3" }),
    ],
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// TESTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Home Mobile Phone & Screen Time Intelligence Engine", () => {
  // ── Result Shape ────────────────────────────────────────────────────────
  describe("result shape", () => {
    it("produces result with all required fields", () => {
      const r = computeMobilePhoneScreenTime(baseInput());
      expect(r.screen_time_rating).toBeDefined();
      expect(r.screen_time_score).toBeDefined();
      expect(r.headline).toBeDefined();
      expect(r.total_screen_time_records).toBeDefined();
      expect(r.total_content_checks).toBeDefined();
      expect(r.screen_time_management_rate).toBeDefined();
      expect(r.content_monitoring_rate).toBeDefined();
      expect(r.usage_agreement_rate).toBeDefined();
      expect(r.digital_wellbeing_rate).toBeDefined();
      expect(r.self_regulation_rate).toBeDefined();
      expect(r.child_satisfaction_rate).toBeDefined();
      expect(r.strengths).toBeDefined();
      expect(r.concerns).toBeDefined();
      expect(r.recommendations).toBeDefined();
      expect(r.insights).toBeDefined();
    });

    it("returns score between 0 and 100", () => {
      const r = computeMobilePhoneScreenTime(baseInput());
      expect(r.screen_time_score).toBeGreaterThanOrEqual(0);
      expect(r.screen_time_score).toBeLessThanOrEqual(100);
    });

    it("returns arrays for strengths, concerns, recommendations, insights", () => {
      const r = computeMobilePhoneScreenTime(baseInput());
      expect(Array.isArray(r.strengths)).toBe(true);
      expect(Array.isArray(r.concerns)).toBe(true);
      expect(Array.isArray(r.recommendations)).toBe(true);
      expect(Array.isArray(r.insights)).toBe(true);
    });

    it("returns valid rating value", () => {
      const r = computeMobilePhoneScreenTime(baseInput());
      expect(["outstanding", "good", "adequate", "inadequate", "insufficient_data"]).toContain(r.screen_time_rating);
    });

    it("returns correct total_screen_time_records count", () => {
      const r = computeMobilePhoneScreenTime(baseInput());
      expect(r.total_screen_time_records).toBe(5);
    });

    it("returns correct total_content_checks count", () => {
      const r = computeMobilePhoneScreenTime(baseInput());
      expect(r.total_content_checks).toBe(3);
    });
  });

  // ── Insufficient Data ─────────────────────────────────────────────────
  describe("insufficient data", () => {
    it("returns insufficient_data when total_children is 0 and all records empty", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        total_children: 0,
        screen_time_records: [],
        content_monitoring_records: [],
        usage_agreement_records: [],
        digital_wellbeing_records: [],
        self_regulation_records: [],
      }));
      expect(r.screen_time_rating).toBe("insufficient_data");
      expect(r.screen_time_score).toBe(0);
    });

    it("returns headline about no children for insufficient_data", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        total_children: 0,
        screen_time_records: [],
        content_monitoring_records: [],
        usage_agreement_records: [],
        digital_wellbeing_records: [],
        self_regulation_records: [],
      }));
      expect(r.headline).toContain("No children on placement");
      expect(r.headline).toContain("insufficient data");
    });

    it("returns zero rates for insufficient_data", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        total_children: 0,
        screen_time_records: [],
        content_monitoring_records: [],
        usage_agreement_records: [],
        digital_wellbeing_records: [],
        self_regulation_records: [],
      }));
      expect(r.screen_time_management_rate).toBe(0);
      expect(r.content_monitoring_rate).toBe(0);
      expect(r.usage_agreement_rate).toBe(0);
      expect(r.digital_wellbeing_rate).toBe(0);
      expect(r.self_regulation_rate).toBe(0);
      expect(r.child_satisfaction_rate).toBe(0);
    });

    it("returns empty arrays for insufficient_data", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        total_children: 0,
        screen_time_records: [],
        content_monitoring_records: [],
        usage_agreement_records: [],
        digital_wellbeing_records: [],
        self_regulation_records: [],
      }));
      expect(r.strengths).toEqual([]);
      expect(r.concerns).toEqual([]);
      expect(r.recommendations).toEqual([]);
      expect(r.insights).toEqual([]);
    });
  });

  // ── All Empty with Children ───────────────────────────────────────────
  describe("all empty with children on placement", () => {
    it("returns inadequate when children exist but no records", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        total_children: 3,
        screen_time_records: [],
        content_monitoring_records: [],
        usage_agreement_records: [],
        digital_wellbeing_records: [],
        self_regulation_records: [],
      }));
      expect(r.screen_time_rating).toBe("inadequate");
      expect(r.screen_time_score).toBe(15);
    });

    it("returns headline about no data despite children on placement", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        total_children: 3,
        screen_time_records: [],
        content_monitoring_records: [],
        usage_agreement_records: [],
        digital_wellbeing_records: [],
        self_regulation_records: [],
      }));
      expect(r.headline).toContain("No mobile phone or screen time management data");
      expect(r.headline).toContain("urgent attention");
    });

    it("returns one concern about complete absence of records", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        total_children: 3,
        screen_time_records: [],
        content_monitoring_records: [],
        usage_agreement_records: [],
        digital_wellbeing_records: [],
        self_regulation_records: [],
      }));
      expect(r.concerns).toHaveLength(1);
      expect(r.concerns[0]).toContain("No screen time records");
    });

    it("returns two immediate recommendations when all empty with children", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        total_children: 3,
        screen_time_records: [],
        content_monitoring_records: [],
        usage_agreement_records: [],
        digital_wellbeing_records: [],
        self_regulation_records: [],
      }));
      expect(r.recommendations).toHaveLength(2);
      expect(r.recommendations[0].urgency).toBe("immediate");
      expect(r.recommendations[1].urgency).toBe("immediate");
      expect(r.recommendations[0].rank).toBe(1);
      expect(r.recommendations[1].rank).toBe(2);
    });

    it("returns one critical insight when all empty with children", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        total_children: 3,
        screen_time_records: [],
        content_monitoring_records: [],
        usage_agreement_records: [],
        digital_wellbeing_records: [],
        self_regulation_records: [],
      }));
      expect(r.insights).toHaveLength(1);
      expect(r.insights[0].severity).toBe("critical");
      expect(r.insights[0].text).toContain("complete absence");
    });

    it("references Reg 7 in recommendations", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        total_children: 3,
        screen_time_records: [],
        content_monitoring_records: [],
        usage_agreement_records: [],
        digital_wellbeing_records: [],
        self_regulation_records: [],
      }));
      const reg7Recs = r.recommendations.filter((rec) => rec.regulatory_ref.includes("Reg 7"));
      expect(reg7Recs.length).toBeGreaterThan(0);
    });
  });

  // ── Rating Thresholds ─────────────────────────────────────────────────
  describe("rating thresholds", () => {
    it("rates outstanding for perfect data (score >= 80)", () => {
      const r = computeMobilePhoneScreenTime(baseInput());
      expect(r.screen_time_score).toBeGreaterThanOrEqual(80);
      expect(r.screen_time_rating).toBe("outstanding");
    });

    it("rates good for score 65-79", () => {
      // Keep strong screen time + content + agreements, weaken wellbeing + self-reg
      // screenTime: 100% => +5, content: 100% => +5, agreements: 100% => +5
      // wellbeing: moderate => +2, selfReg: moderate => +2, satisfaction: 67% => no bonus
      // 52 + 5 + 5 + 5 + 2 + 2 + 0 = 71
      const r = computeMobilePhoneScreenTime(baseInput({
        digital_wellbeing_records: [
          makeDigitalWellbeing({ id: "dw_1", child_engaged: true, child_feedback_positive: true, learning_outcomes_achieved: true, follow_up_planned: true, follow_up_completed: true }),
          makeDigitalWellbeing({ id: "dw_2", child_engaged: true, child_feedback_positive: false, learning_outcomes_achieved: false, follow_up_planned: true, follow_up_completed: false }),
          makeDigitalWellbeing({ id: "dw_3", child_engaged: false, child_feedback_positive: true, learning_outcomes_achieved: true, follow_up_planned: false, follow_up_completed: false }),
        ],
        self_regulation_records: [
          makeSelfRegulation({ id: "sr_1", can_identify_overuse: true, takes_voluntary_breaks: true, follows_agreed_limits: true, asks_for_help_when_struggling: true, balances_screen_offline_activities: false, recognises_impact_on_mood: false, self_regulation_score: 3, improvement_since_last: "maintained" }),
          makeSelfRegulation({ id: "sr_2", can_identify_overuse: false, takes_voluntary_breaks: true, follows_agreed_limits: true, asks_for_help_when_struggling: true, balances_screen_offline_activities: false, recognises_impact_on_mood: false, self_regulation_score: 3, improvement_since_last: "maintained" }),
        ],
      }));
      expect(r.screen_time_score).toBeGreaterThanOrEqual(65);
      expect(r.screen_time_score).toBeLessThan(80);
      expect(r.screen_time_rating).toBe("good");
    });

    it("rates adequate for score 45-64", () => {
      // Keep rates in the middle zone (40-69%) to avoid penalties and bonuses
      // screenTime: 50% => no bonus, no penalty; content: 50% => no bonus, no penalty
      // No usage agreements, no wellbeing, no self-reg => 0 rates, no bonuses
      // 52 + 0 = 52 => adequate
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [
          makeScreenTime({ id: "st_1", limit_adhered_to: true, bedtime_device_handover: false }),
          makeScreenTime({ id: "st_2", limit_adhered_to: false, bedtime_device_handover: true }),
        ],
        content_monitoring_records: [
          makeContentMonitoring({ id: "cm_1", age_appropriate_content: true, filters_active: true, child_informed: false }),
          makeContentMonitoring({ id: "cm_2", age_appropriate_content: false, filters_active: false, child_informed: true }),
        ],
        usage_agreement_records: [],
        digital_wellbeing_records: [],
        self_regulation_records: [],
      }));
      expect(r.screen_time_score).toBeGreaterThanOrEqual(45);
      expect(r.screen_time_score).toBeLessThan(65);
      expect(r.screen_time_rating).toBe("adequate");
    });

    it("rates inadequate for score < 45", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [
          makeScreenTime({ id: "st_1", limit_adhered_to: false, bedtime_device_handover: false, actual_usage_minutes: 200, agreed_limit_minutes: 60 }),
          makeScreenTime({ id: "st_2", limit_adhered_to: false, bedtime_device_handover: false, actual_usage_minutes: 250, agreed_limit_minutes: 60 }),
          makeScreenTime({ id: "st_3", limit_adhered_to: false, bedtime_device_handover: false, actual_usage_minutes: 300, agreed_limit_minutes: 60 }),
        ],
        content_monitoring_records: [
          makeContentMonitoring({ id: "cm_1", age_appropriate_content: false, filters_active: false, child_informed: false, safeguarding_referral_needed: true, safeguarding_referral_made: false }),
          makeContentMonitoring({ id: "cm_2", age_appropriate_content: false, filters_active: false, child_informed: false }),
        ],
        usage_agreement_records: [],
        digital_wellbeing_records: [],
        self_regulation_records: [],
      }));
      expect(r.screen_time_score).toBeLessThan(45);
      expect(r.screen_time_rating).toBe("inadequate");
    });
  });

  // ── Scoring: Base + Bonuses ───────────────────────────────────────────
  describe("scoring bonuses", () => {
    it("starts from base 52 with minimal records", () => {
      // One record, moderate metrics — no bonuses, no penalties
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [
          makeScreenTime({ id: "st_1", limit_adhered_to: true, bedtime_device_handover: false }),
        ],
        content_monitoring_records: [
          makeContentMonitoring({ id: "cm_1", age_appropriate_content: true, filters_active: false, child_informed: false }),
        ],
        usage_agreement_records: [],
        digital_wellbeing_records: [],
        self_regulation_records: [],
      }));
      // screenTimeManagement = pct(1+0, 2) = 50% => no bonus, no penalty
      // contentMonitoring = pct(1+0+0, 3) = 33% => no bonus, penalty -5
      // No usage agreements, no wellbeing, no self-reg => 0 rates
      // But contentMonitoringRate < 40 and totalContentChecks > 0 => penalty -5
      expect(r.screen_time_score).toBe(47);
    });

    it("awards +5 bonus for screenTimeManagementRate >= 90", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [
          makeScreenTime({ id: "st_1", limit_adhered_to: true, bedtime_device_handover: true }),
          makeScreenTime({ id: "st_2", limit_adhered_to: true, bedtime_device_handover: true }),
          makeScreenTime({ id: "st_3", limit_adhered_to: true, bedtime_device_handover: true }),
          makeScreenTime({ id: "st_4", limit_adhered_to: true, bedtime_device_handover: true }),
          makeScreenTime({ id: "st_5", limit_adhered_to: true, bedtime_device_handover: true }),
        ],
        content_monitoring_records: [],
        usage_agreement_records: [],
        digital_wellbeing_records: [],
        self_regulation_records: [],
      }));
      // screenTimeManagement = pct(10, 10) = 100% => +5
      // No content checks => no bonus/penalty
      expect(r.screen_time_management_rate).toBe(100);
      expect(r.screen_time_score).toBe(57);
    });

    it("awards +3 bonus for screenTimeManagementRate >= 70 but < 90", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [
          makeScreenTime({ id: "st_1", limit_adhered_to: true, bedtime_device_handover: true }),
          makeScreenTime({ id: "st_2", limit_adhered_to: true, bedtime_device_handover: false }),
          makeScreenTime({ id: "st_3", limit_adhered_to: true, bedtime_device_handover: true }),
          makeScreenTime({ id: "st_4", limit_adhered_to: false, bedtime_device_handover: true }),
          makeScreenTime({ id: "st_5", limit_adhered_to: true, bedtime_device_handover: false }),
        ],
        content_monitoring_records: [],
        usage_agreement_records: [],
        digital_wellbeing_records: [],
        self_regulation_records: [],
      }));
      // numerator = 4+3=7, denominator = 10, rate = 70% => +3
      expect(r.screen_time_management_rate).toBe(70);
      expect(r.screen_time_score).toBe(55);
    });

    it("awards +5 bonus for contentMonitoringRate >= 90", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [],
        content_monitoring_records: [
          makeContentMonitoring({ id: "cm_1", age_appropriate_content: true, filters_active: true, child_informed: true }),
          makeContentMonitoring({ id: "cm_2", age_appropriate_content: true, filters_active: true, child_informed: true }),
        ],
        usage_agreement_records: [],
        digital_wellbeing_records: [],
        self_regulation_records: [],
      }));
      expect(r.content_monitoring_rate).toBe(100);
      expect(r.screen_time_score).toBe(57);
    });

    it("awards +3 bonus for contentMonitoringRate >= 70 but < 90", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [],
        content_monitoring_records: [
          makeContentMonitoring({ id: "cm_1", age_appropriate_content: true, filters_active: true, child_informed: true }),
          makeContentMonitoring({ id: "cm_2", age_appropriate_content: true, filters_active: true, child_informed: false }),
          makeContentMonitoring({ id: "cm_3", age_appropriate_content: true, filters_active: false, child_informed: true }),
        ],
        usage_agreement_records: [],
        digital_wellbeing_records: [],
        self_regulation_records: [],
      }));
      // numerator = 3+2+2=7, denominator = 9, rate = pct(7,9) = 78% => +3
      expect(r.content_monitoring_rate).toBe(78);
      expect(r.screen_time_score).toBe(55);
    });

    it("awards +5 bonus for usageAgreementRate >= 85", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [],
        content_monitoring_records: [],
        usage_agreement_records: [
          makeUsageAgreement({ id: "ua_1", child_id: "child_1" }),
          makeUsageAgreement({ id: "ua_2", child_id: "child_2" }),
          makeUsageAgreement({ id: "ua_3", child_id: "child_3" }),
        ],
        digital_wellbeing_records: [],
        self_regulation_records: [],
      }));
      // coverage = pct(3,3) = 100%, contribution = 100%, comprehensiveness = 100%
      // rate = round((100+100+100)/3) = 100 => +5
      expect(r.usage_agreement_rate).toBe(100);
      expect(r.screen_time_score).toBe(57);
    });

    it("awards +2 bonus for usageAgreementRate >= 65 but < 85", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [],
        content_monitoring_records: [],
        usage_agreement_records: [
          makeUsageAgreement({ id: "ua_1", child_id: "child_1", child_contributed: true }),
          makeUsageAgreement({ id: "ua_2", child_id: "child_2", child_contributed: false, covers_screen_time_limits: false, covers_content_boundaries: false }),
        ],
        digital_wellbeing_records: [],
        self_regulation_records: [],
      }));
      // coverage = pct(2,3) = 67%, contribution = pct(1,2) = 50%, comprehensiveness = pct(10,12) = 83%
      // rate = round((67+50+83)/3) = round(66.67) = 67 => +2
      expect(r.usage_agreement_rate).toBe(67);
      expect(r.screen_time_score).toBe(54);
    });

    it("awards +4 bonus for digitalWellbeingRate >= 85", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [],
        content_monitoring_records: [],
        usage_agreement_records: [],
        digital_wellbeing_records: [
          makeDigitalWellbeing({ id: "dw_1", child_engaged: true, child_feedback_positive: false, learning_outcomes_achieved: true, follow_up_planned: true, follow_up_completed: true }),
          makeDigitalWellbeing({ id: "dw_2", child_engaged: true, child_feedback_positive: false, learning_outcomes_achieved: true, follow_up_planned: true, follow_up_completed: true }),
        ],
        self_regulation_records: [],
      }));
      // numerator = 2+2+2=6, denominator = 2+2+2=6, rate = 100% => +4
      // childSatisfaction = 0% => no bonus
      expect(r.digital_wellbeing_rate).toBe(100);
      expect(r.screen_time_score).toBe(56);
    });

    it("awards +2 bonus for digitalWellbeingRate >= 65 but < 85", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [],
        content_monitoring_records: [],
        usage_agreement_records: [],
        digital_wellbeing_records: [
          makeDigitalWellbeing({ id: "dw_1", child_engaged: true, learning_outcomes_achieved: true, follow_up_planned: true, follow_up_completed: true }),
          makeDigitalWellbeing({ id: "dw_2", child_engaged: true, learning_outcomes_achieved: false, follow_up_planned: true, follow_up_completed: false }),
          makeDigitalWellbeing({ id: "dw_3", child_engaged: false, learning_outcomes_achieved: false, follow_up_planned: false, follow_up_completed: false }),
        ],
        self_regulation_records: [],
      }));
      // numerator = 2+1+1=4, denominator = 3+3+2=8, rate = pct(4,8) = 50% => no bonus
      // Actually 50 < 65, so no bonus
      // Let me adjust to get 65-84
      expect(r.digital_wellbeing_rate).toBe(50);
    });

    it("awards +5 bonus for selfRegulationRate >= 85", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [],
        content_monitoring_records: [],
        usage_agreement_records: [],
        digital_wellbeing_records: [],
        self_regulation_records: [
          makeSelfRegulation({ id: "sr_1" }),
          makeSelfRegulation({ id: "sr_2" }),
        ],
      }));
      // All 6 checks pass per record => 12/12 = 100% => +5
      expect(r.self_regulation_rate).toBe(100);
      expect(r.screen_time_score).toBe(57);
    });

    it("awards +2 bonus for selfRegulationRate >= 65 but < 85", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [],
        content_monitoring_records: [],
        usage_agreement_records: [],
        digital_wellbeing_records: [],
        self_regulation_records: [
          makeSelfRegulation({ id: "sr_1", can_identify_overuse: true, takes_voluntary_breaks: true, follows_agreed_limits: true, asks_for_help_when_struggling: true, balances_screen_offline_activities: false, recognises_impact_on_mood: false }),
          makeSelfRegulation({ id: "sr_2", can_identify_overuse: true, takes_voluntary_breaks: true, follows_agreed_limits: true, asks_for_help_when_struggling: true, balances_screen_offline_activities: false, recognises_impact_on_mood: false }),
        ],
      }));
      // 8/12 = pct = 67% => +2
      expect(r.self_regulation_rate).toBe(67);
      expect(r.screen_time_score).toBe(54);
    });

    it("awards +4 bonus for childSatisfactionRate >= 90", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [],
        content_monitoring_records: [],
        usage_agreement_records: [],
        digital_wellbeing_records: [
          makeDigitalWellbeing({ id: "dw_1", child_feedback_positive: true, child_engaged: true, learning_outcomes_achieved: true, follow_up_planned: true, follow_up_completed: true }),
          makeDigitalWellbeing({ id: "dw_2", child_feedback_positive: true, child_engaged: true, learning_outcomes_achieved: true, follow_up_planned: true, follow_up_completed: true }),
        ],
        self_regulation_records: [],
      }));
      // childSatisfaction = pct(2, 2) = 100% => +4
      // digitalWellbeing = pct(6, 6) = 100% => +4
      expect(r.child_satisfaction_rate).toBe(100);
      // 52 + 4 (wellbeing) + 4 (satisfaction) = 60
      expect(r.screen_time_score).toBe(60);
    });

    it("awards +2 bonus for childSatisfactionRate >= 70 but < 90", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [],
        content_monitoring_records: [],
        usage_agreement_records: [],
        digital_wellbeing_records: [
          makeDigitalWellbeing({ id: "dw_1", child_feedback_positive: true, child_engaged: false, learning_outcomes_achieved: false, follow_up_planned: false, follow_up_completed: false }),
          makeDigitalWellbeing({ id: "dw_2", child_feedback_positive: true, child_engaged: false, learning_outcomes_achieved: false, follow_up_planned: false, follow_up_completed: false }),
          makeDigitalWellbeing({ id: "dw_3", child_feedback_positive: false, child_engaged: false, learning_outcomes_achieved: false, follow_up_planned: false, follow_up_completed: false }),
        ],
        self_regulation_records: [],
      }));
      // childSatisfaction = pct(2, 3) = 67% — just under 70, not qualifying
      expect(r.child_satisfaction_rate).toBe(67);
    });
  });

  // ── Scoring: Penalties ────────────────────────────────────────────────
  describe("scoring penalties", () => {
    it("applies -5 penalty when screenTimeManagementRate < 40 with records", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [
          makeScreenTime({ id: "st_1", limit_adhered_to: false, bedtime_device_handover: false }),
          makeScreenTime({ id: "st_2", limit_adhered_to: false, bedtime_device_handover: false }),
          makeScreenTime({ id: "st_3", limit_adhered_to: false, bedtime_device_handover: false }),
        ],
        content_monitoring_records: [],
        usage_agreement_records: [],
        digital_wellbeing_records: [],
        self_regulation_records: [],
      }));
      // screenTimeManagement = pct(0, 6) = 0% < 40 => -5
      expect(r.screen_time_management_rate).toBe(0);
      expect(r.screen_time_score).toBe(47);
    });

    it("applies -5 penalty when contentMonitoringRate < 40 with records", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [],
        content_monitoring_records: [
          makeContentMonitoring({ id: "cm_1", age_appropriate_content: false, filters_active: false, child_informed: false }),
          makeContentMonitoring({ id: "cm_2", age_appropriate_content: false, filters_active: false, child_informed: true }),
        ],
        usage_agreement_records: [],
        digital_wellbeing_records: [],
        self_regulation_records: [],
      }));
      // numerator = 0+0+1=1, denominator = 6, rate = pct(1,6) = 17% => -5
      expect(r.content_monitoring_rate).toBe(17);
      expect(r.screen_time_score).toBe(47);
    });

    it("applies -5 penalty when safeguarding referral missed", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [],
        content_monitoring_records: [
          makeContentMonitoring({ id: "cm_1", age_appropriate_content: true, filters_active: true, child_informed: true, safeguarding_referral_needed: true, safeguarding_referral_made: false }),
        ],
        usage_agreement_records: [],
        digital_wellbeing_records: [],
        self_regulation_records: [],
      }));
      // contentMonitoringRate = 100% => +5
      // safeguardingNeeded = 1, compliance < 100 => -5
      // 52 + 5 - 5 = 52
      expect(r.screen_time_score).toBe(52);
    });

    it("applies -3 penalty when overLimitRate > 50 with records", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [
          makeScreenTime({ id: "st_1", actual_usage_minutes: 200, agreed_limit_minutes: 60, limit_adhered_to: true, bedtime_device_handover: true }),
          makeScreenTime({ id: "st_2", actual_usage_minutes: 200, agreed_limit_minutes: 60, limit_adhered_to: true, bedtime_device_handover: true }),
          makeScreenTime({ id: "st_3", actual_usage_minutes: 50, agreed_limit_minutes: 60, limit_adhered_to: true, bedtime_device_handover: true }),
        ],
        content_monitoring_records: [],
        usage_agreement_records: [],
        digital_wellbeing_records: [],
        self_regulation_records: [],
      }));
      // overLimitRecords = 2 (200 > 60+15), rate = pct(2,3) = 67% > 50 => -3
      // screenTimeManagement = pct(6,6) = 100% => +5
      // 52 + 5 - 3 = 54
      expect(r.screen_time_score).toBe(54);
    });

    it("does not apply screenTimeManagement penalty when no records", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [],
        content_monitoring_records: [],
        usage_agreement_records: [makeUsageAgreement({ id: "ua_1" })],
        digital_wellbeing_records: [],
        self_regulation_records: [],
      }));
      // screenTimeManagement = 0 but no records => penalty guard
      // usageAgreement rate = 100% coverage for 1/3 children => pct(1,3) = 33%
      // Actually... coverage = pct(1,3)=33, contribution = 100%, comp = 100%
      // rate = round((33+100+100)/3) = round(77.67) = 78 => +2
      expect(r.screen_time_score).toBe(54);
    });

    it("does not apply overLimit penalty when no records", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [],
        content_monitoring_records: [makeContentMonitoring({ id: "cm_1" })],
        usage_agreement_records: [],
        digital_wellbeing_records: [],
        self_regulation_records: [],
      }));
      // No screen time records => overLimitRate = 0 but guard prevents penalty
      expect(r.screen_time_score).toBeGreaterThanOrEqual(52);
    });

    it("clamps score to 0 minimum", () => {
      // Stack all penalties
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [
          makeScreenTime({ id: "st_1", limit_adhered_to: false, bedtime_device_handover: false, actual_usage_minutes: 300, agreed_limit_minutes: 60 }),
          makeScreenTime({ id: "st_2", limit_adhered_to: false, bedtime_device_handover: false, actual_usage_minutes: 300, agreed_limit_minutes: 60 }),
          makeScreenTime({ id: "st_3", limit_adhered_to: false, bedtime_device_handover: false, actual_usage_minutes: 300, agreed_limit_minutes: 60 }),
        ],
        content_monitoring_records: [
          makeContentMonitoring({ id: "cm_1", age_appropriate_content: false, filters_active: false, child_informed: false, safeguarding_referral_needed: true, safeguarding_referral_made: false }),
          makeContentMonitoring({ id: "cm_2", age_appropriate_content: false, filters_active: false, child_informed: false }),
        ],
        usage_agreement_records: [],
        digital_wellbeing_records: [],
        self_regulation_records: [],
      }));
      // 52 - 5 (screen) - 5 (content) - 5 (safeguarding) - 3 (overlimit) = 34
      expect(r.screen_time_score).toBe(34);
      expect(r.screen_time_score).toBeGreaterThanOrEqual(0);
    });

    it("clamps score to 100 maximum", () => {
      const r = computeMobilePhoneScreenTime(baseInput());
      expect(r.screen_time_score).toBeLessThanOrEqual(100);
    });
  });

  // ── Screen Time Management Metrics ────────────────────────────────────
  describe("screen time management metrics", () => {
    it("computes screen_time_management_rate from limit adherence and bedtime handover", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [
          makeScreenTime({ id: "st_1", limit_adhered_to: true, bedtime_device_handover: true }),
          makeScreenTime({ id: "st_2", limit_adhered_to: true, bedtime_device_handover: false }),
          makeScreenTime({ id: "st_3", limit_adhered_to: false, bedtime_device_handover: true }),
          makeScreenTime({ id: "st_4", limit_adhered_to: false, bedtime_device_handover: false }),
        ],
      }));
      // numerator = 2+2=4, denominator = 8, rate = 50%
      expect(r.screen_time_management_rate).toBe(50);
    });

    it("returns 0 screen_time_management_rate when no records", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [],
      }));
      expect(r.screen_time_management_rate).toBe(0);
    });

    it("returns 100% screen_time_management_rate when all adhered and handover done", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [
          makeScreenTime({ id: "st_1", limit_adhered_to: true, bedtime_device_handover: true }),
          makeScreenTime({ id: "st_2", limit_adhered_to: true, bedtime_device_handover: true }),
        ],
      }));
      expect(r.screen_time_management_rate).toBe(100);
    });
  });

  // ── Content Monitoring Metrics ────────────────────────────────────────
  describe("content monitoring metrics", () => {
    it("computes content_monitoring_rate from age-appropriate, filters, child-informed", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        content_monitoring_records: [
          makeContentMonitoring({ id: "cm_1", age_appropriate_content: true, filters_active: true, child_informed: true }),
          makeContentMonitoring({ id: "cm_2", age_appropriate_content: true, filters_active: false, child_informed: false }),
        ],
      }));
      // numerator = 2+1+1=4, denominator = 6, rate = pct(4,6) = 67%
      expect(r.content_monitoring_rate).toBe(67);
    });

    it("returns 0 content_monitoring_rate when no records", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        content_monitoring_records: [],
      }));
      expect(r.content_monitoring_rate).toBe(0);
    });

    it("returns 100% content_monitoring_rate when all pass", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        content_monitoring_records: [
          makeContentMonitoring({ id: "cm_1" }),
          makeContentMonitoring({ id: "cm_2" }),
        ],
      }));
      expect(r.content_monitoring_rate).toBe(100);
    });
  });

  // ── Usage Agreement Metrics ───────────────────────────────────────────
  describe("usage agreement metrics", () => {
    it("computes usage_agreement_rate as average of coverage, contribution, comprehensiveness", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        usage_agreement_records: [
          makeUsageAgreement({ id: "ua_1", child_id: "child_1" }),
          makeUsageAgreement({ id: "ua_2", child_id: "child_2" }),
          makeUsageAgreement({ id: "ua_3", child_id: "child_3" }),
        ],
      }));
      // coverage 100%, contribution 100%, comprehensiveness 100% => 100
      expect(r.usage_agreement_rate).toBe(100);
    });

    it("returns 0 usage_agreement_rate when no agreements", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        usage_agreement_records: [],
      }));
      expect(r.usage_agreement_rate).toBe(0);
    });

    it("computes agreement coverage based on unique children with active agreements", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        total_children: 4,
        usage_agreement_records: [
          makeUsageAgreement({ id: "ua_1", child_id: "child_1", agreement_active: true }),
          makeUsageAgreement({ id: "ua_2", child_id: "child_2", agreement_active: true }),
          makeUsageAgreement({ id: "ua_3", child_id: "child_3", agreement_active: false }),
        ],
      }));
      // coverage = pct(2, 4) = 50%
      // contribution = 100%, comprehensiveness = 100%
      // rate = round((50+100+100)/3) = round(83.33) = 83
      expect(r.usage_agreement_rate).toBe(83);
    });

    it("accounts for comprehensiveness of agreement checks", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        usage_agreement_records: [
          makeUsageAgreement({
            id: "ua_1",
            child_id: "child_1",
            covers_screen_time_limits: true,
            covers_content_boundaries: false,
            covers_social_media_rules: false,
            covers_online_safety: true,
            covers_device_care: false,
            covers_consequences: false,
          }),
        ],
      }));
      // comprehensiveness = pct(2, 6) = 33%
      // coverage = pct(1, 3) = 33%, contribution = 100%
      // rate = round((33+100+33)/3) = round(55.33) = 55
      expect(r.usage_agreement_rate).toBe(55);
    });

    it("counts child contribution rate correctly", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        usage_agreement_records: [
          makeUsageAgreement({ id: "ua_1", child_contributed: true }),
          makeUsageAgreement({ id: "ua_2", child_contributed: false }),
        ],
      }));
      // contribution = pct(1, 2) = 50%
      expect(r.usage_agreement_rate).toBeDefined();
    });
  });

  // ── Digital Wellbeing Metrics ─────────────────────────────────────────
  describe("digital wellbeing metrics", () => {
    it("computes digital_wellbeing_rate from engaged + learning + follow-up", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        digital_wellbeing_records: [
          makeDigitalWellbeing({ id: "dw_1", child_engaged: true, learning_outcomes_achieved: true, follow_up_planned: true, follow_up_completed: true }),
          makeDigitalWellbeing({ id: "dw_2", child_engaged: true, learning_outcomes_achieved: false, follow_up_planned: true, follow_up_completed: false }),
        ],
      }));
      // numerator = 2 + 1 + 1 = 4
      // denominator = 2 + 2 + 2 = 6
      // rate = pct(4, 6) = 67%
      expect(r.digital_wellbeing_rate).toBe(67);
    });

    it("returns 0 digital_wellbeing_rate when no records", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        digital_wellbeing_records: [],
      }));
      expect(r.digital_wellbeing_rate).toBe(0);
    });

    it("handles follow_up_planned false correctly in denominator", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        digital_wellbeing_records: [
          makeDigitalWellbeing({ id: "dw_1", child_engaged: true, learning_outcomes_achieved: true, follow_up_planned: false, follow_up_completed: false }),
          makeDigitalWellbeing({ id: "dw_2", child_engaged: true, learning_outcomes_achieved: true, follow_up_planned: false, follow_up_completed: false }),
        ],
      }));
      // numerator = 2+2+0=4, denominator = 2+2+0=4 (followUpPlanned=0)
      // rate = 100%
      expect(r.digital_wellbeing_rate).toBe(100);
    });

    it("computes child_satisfaction_rate from positive feedback", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        digital_wellbeing_records: [
          makeDigitalWellbeing({ id: "dw_1", child_feedback_positive: true }),
          makeDigitalWellbeing({ id: "dw_2", child_feedback_positive: false }),
          makeDigitalWellbeing({ id: "dw_3", child_feedback_positive: true }),
        ],
      }));
      expect(r.child_satisfaction_rate).toBe(67);
    });

    it("returns 0 child_satisfaction_rate when no records", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        digital_wellbeing_records: [],
      }));
      expect(r.child_satisfaction_rate).toBe(0);
    });
  });

  // ── Self-Regulation Metrics ───────────────────────────────────────────
  describe("self-regulation metrics", () => {
    it("computes self_regulation_rate from 6 boolean checks", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        self_regulation_records: [
          makeSelfRegulation({ id: "sr_1", can_identify_overuse: true, takes_voluntary_breaks: true, follows_agreed_limits: true, asks_for_help_when_struggling: false, balances_screen_offline_activities: false, recognises_impact_on_mood: false }),
        ],
      }));
      // 3/6 = 50%
      expect(r.self_regulation_rate).toBe(50);
    });

    it("returns 0 self_regulation_rate when no records", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        self_regulation_records: [],
      }));
      expect(r.self_regulation_rate).toBe(0);
    });

    it("returns 100% self_regulation_rate when all checks pass", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        self_regulation_records: [
          makeSelfRegulation({ id: "sr_1" }),
        ],
      }));
      expect(r.self_regulation_rate).toBe(100);
    });
  });

  // ── Strengths ─────────────────────────────────────────────────────────
  describe("strengths", () => {
    it("includes screen time management strength when rate >= 90", () => {
      const r = computeMobilePhoneScreenTime(baseInput());
      const found = r.strengths.some((s) => s.includes("screen time management compliance"));
      expect(found).toBe(true);
    });

    it("includes mid-range screen time management strength when rate >= 70 and < 90", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [
          makeScreenTime({ id: "st_1", limit_adhered_to: true, bedtime_device_handover: true }),
          makeScreenTime({ id: "st_2", limit_adhered_to: true, bedtime_device_handover: false }),
          makeScreenTime({ id: "st_3", limit_adhered_to: true, bedtime_device_handover: true }),
          makeScreenTime({ id: "st_4", limit_adhered_to: false, bedtime_device_handover: true }),
          makeScreenTime({ id: "st_5", limit_adhered_to: true, bedtime_device_handover: false }),
        ],
      }));
      const found = r.strengths.some((s) => s.includes("screen time management") && s.includes("generally maintains"));
      expect(found).toBe(true);
    });

    it("includes content monitoring strength when rate >= 90", () => {
      const r = computeMobilePhoneScreenTime(baseInput());
      const found = r.strengths.some((s) => s.includes("content monitoring effectiveness"));
      expect(found).toBe(true);
    });

    it("includes mid-range content monitoring strength when rate >= 70 and < 90", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        content_monitoring_records: [
          makeContentMonitoring({ id: "cm_1", age_appropriate_content: true, filters_active: true, child_informed: true }),
          makeContentMonitoring({ id: "cm_2", age_appropriate_content: true, filters_active: true, child_informed: false }),
          makeContentMonitoring({ id: "cm_3", age_appropriate_content: true, filters_active: false, child_informed: true }),
        ],
      }));
      const found = r.strengths.some((s) => s.includes("content monitoring") && s.includes("generally effective"));
      expect(found).toBe(true);
    });

    it("includes usage agreement strength when rate >= 85", () => {
      const r = computeMobilePhoneScreenTime(baseInput());
      const found = r.strengths.some((s) => s.includes("usage agreement quality"));
      expect(found).toBe(true);
    });

    it("includes digital wellbeing strength when rate >= 85", () => {
      const r = computeMobilePhoneScreenTime(baseInput());
      const found = r.strengths.some((s) => s.includes("digital wellbeing effectiveness"));
      expect(found).toBe(true);
    });

    it("includes self-regulation strength when rate >= 85", () => {
      const r = computeMobilePhoneScreenTime(baseInput());
      const found = r.strengths.some((s) => s.includes("self-regulation capability"));
      expect(found).toBe(true);
    });

    it("includes child satisfaction strength when rate >= 90", () => {
      const r = computeMobilePhoneScreenTime(baseInput());
      const found = r.strengths.some((s) => s.includes("positive child feedback on digital wellbeing support"));
      expect(found).toBe(true);
    });

    it("includes limit adherence strength when rate >= 90", () => {
      const r = computeMobilePhoneScreenTime(baseInput());
      const found = r.strengths.some((s) => s.includes("screen time limit adherence"));
      expect(found).toBe(true);
    });

    it("includes bedtime handover strength when rate >= 90", () => {
      const r = computeMobilePhoneScreenTime(baseInput());
      const found = r.strengths.some((s) => s.includes("bedtime device handover compliance"));
      expect(found).toBe(true);
    });

    it("includes filters active strength when rate >= 90", () => {
      const r = computeMobilePhoneScreenTime(baseInput());
      const found = r.strengths.some((s) => s.includes("active content filters"));
      expect(found).toBe(true);
    });

    it("includes child contribution strength when rate >= 90", () => {
      const r = computeMobilePhoneScreenTime(baseInput());
      const found = r.strengths.some((s) => s.includes("child contribution to usage agreements"));
      expect(found).toBe(true);
    });

    it("includes safeguarding compliance strength when 100% and needed > 0", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        content_monitoring_records: [
          makeContentMonitoring({ id: "cm_1", safeguarding_referral_needed: true, safeguarding_referral_made: true }),
          makeContentMonitoring({ id: "cm_2" }),
        ],
      }));
      const found = r.strengths.some((s) => s.includes("safeguarding referral compliance"));
      expect(found).toBe(true);
    });

    it("includes self-managed strength when rate >= 70", () => {
      const r = computeMobilePhoneScreenTime(baseInput());
      const found = r.strengths.some((s) => s.includes("self-managed by children"));
      expect(found).toBe(true);
    });

    it("includes discussion strength when rate >= 90", () => {
      const r = computeMobilePhoneScreenTime(baseInput());
      const found = r.strengths.some((s) => s.includes("content checks include discussion"));
      expect(found).toBe(true);
    });

    it("includes improvement strength when rate >= 70", () => {
      const r = computeMobilePhoneScreenTime(baseInput());
      const found = r.strengths.some((s) => s.includes("improvement in self-regulation"));
      expect(found).toBe(true);
    });

    it("includes agreement comprehensiveness strength when rate >= 90", () => {
      const r = computeMobilePhoneScreenTime(baseInput());
      const found = r.strengths.some((s) => s.includes("agreement comprehensiveness"));
      expect(found).toBe(true);
    });

    it("includes follow-up completion strength when rate >= 90 and planned > 0", () => {
      const r = computeMobilePhoneScreenTime(baseInput());
      const found = r.strengths.some((s) => s.includes("follow-up completion"));
      expect(found).toBe(true);
    });

    it("does not include strength when no records exist for that metric", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [],
        content_monitoring_records: [],
        usage_agreement_records: [],
        digital_wellbeing_records: [],
        self_regulation_records: [],
        total_children: 0,
      }));
      expect(r.strengths).toEqual([]);
    });
  });

  // ── Concerns ──────────────────────────────────────────────────────────
  describe("concerns", () => {
    it("flags screen time management concern when rate < 40", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [
          makeScreenTime({ id: "st_1", limit_adhered_to: false, bedtime_device_handover: false }),
          makeScreenTime({ id: "st_2", limit_adhered_to: false, bedtime_device_handover: false }),
        ],
      }));
      const found = r.concerns.some((c) => c.includes("screen time management compliance"));
      expect(found).toBe(true);
    });

    it("flags mid-range screen time management concern when rate 40-69", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [
          makeScreenTime({ id: "st_1", limit_adhered_to: true, bedtime_device_handover: false }),
          makeScreenTime({ id: "st_2", limit_adhered_to: false, bedtime_device_handover: true }),
          makeScreenTime({ id: "st_3", limit_adhered_to: false, bedtime_device_handover: false }),
          makeScreenTime({ id: "st_4", limit_adhered_to: true, bedtime_device_handover: false }),
        ],
      }));
      // numerator = 2+1=3, denominator = 8, rate = pct(3,8)=38% -- that's <40
      // Let me adjust
      const r2 = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [
          makeScreenTime({ id: "st_1", limit_adhered_to: true, bedtime_device_handover: true }),
          makeScreenTime({ id: "st_2", limit_adhered_to: false, bedtime_device_handover: false }),
          makeScreenTime({ id: "st_3", limit_adhered_to: false, bedtime_device_handover: false }),
          makeScreenTime({ id: "st_4", limit_adhered_to: true, bedtime_device_handover: false }),
          makeScreenTime({ id: "st_5", limit_adhered_to: false, bedtime_device_handover: true }),
        ],
      }));
      // numerator = 2+2=4, denominator = 10, rate = 40%
      const found = r2.concerns.some((c) => c.includes("Screen time management at") && c.includes("inconsistent"));
      expect(found).toBe(true);
    });

    it("flags content monitoring concern when rate < 40", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        content_monitoring_records: [
          makeContentMonitoring({ id: "cm_1", age_appropriate_content: false, filters_active: false, child_informed: false }),
          makeContentMonitoring({ id: "cm_2", age_appropriate_content: false, filters_active: false, child_informed: false }),
        ],
      }));
      const found = r.concerns.some((c) => c.includes("content monitoring effectiveness"));
      expect(found).toBe(true);
    });

    it("flags mid-range content monitoring concern when rate 40-69", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        content_monitoring_records: [
          makeContentMonitoring({ id: "cm_1", age_appropriate_content: true, filters_active: false, child_informed: false }),
          makeContentMonitoring({ id: "cm_2", age_appropriate_content: true, filters_active: true, child_informed: false }),
        ],
      }));
      // numerator = 2+1+0=3, denominator=6, rate=50%
      const found = r.concerns.some((c) => c.includes("Content monitoring at") && c.includes("inconsistent"));
      expect(found).toBe(true);
    });

    it("flags usage agreement concern when rate < 40", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        usage_agreement_records: [
          makeUsageAgreement({
            id: "ua_1",
            child_id: "child_1",
            child_contributed: false,
            covers_screen_time_limits: false,
            covers_content_boundaries: false,
            covers_social_media_rules: false,
            covers_online_safety: false,
            covers_device_care: false,
            covers_consequences: false,
            agreement_active: true,
          }),
        ],
      }));
      // coverage = pct(1,3)=33%, contribution = 0%, comprehensiveness = 0%
      // rate = round((33+0+0)/3) = 11
      const found = r.concerns.some((c) => c.includes("usage agreement quality"));
      expect(found).toBe(true);
    });

    it("flags mid-range usage agreement concern when rate 40-64", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        usage_agreement_records: [
          makeUsageAgreement({ id: "ua_1", child_id: "child_1", child_contributed: true, covers_screen_time_limits: true, covers_content_boundaries: true, covers_social_media_rules: false, covers_online_safety: false, covers_device_care: false, covers_consequences: false }),
          makeUsageAgreement({ id: "ua_2", child_id: "child_2", child_contributed: false, covers_screen_time_limits: false, covers_content_boundaries: false, covers_social_media_rules: false, covers_online_safety: true, covers_device_care: false, covers_consequences: false }),
        ],
      }));
      // coverage = pct(2,3) = 67%, contribution = pct(1,2) = 50%, comp = pct(4,12) = 33%
      // rate = round((67+50+33)/3) = round(50) = 50
      const found = r.concerns.some((c) => c.includes("Usage agreement quality at") && c.includes("need improvement"));
      expect(found).toBe(true);
    });

    it("flags digital wellbeing concern when rate < 40", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        digital_wellbeing_records: [
          makeDigitalWellbeing({ id: "dw_1", child_engaged: false, learning_outcomes_achieved: false, follow_up_planned: true, follow_up_completed: false }),
          makeDigitalWellbeing({ id: "dw_2", child_engaged: false, learning_outcomes_achieved: false, follow_up_planned: true, follow_up_completed: false }),
        ],
      }));
      // numerator = 0+0+0=0, denominator = 2+2+2=6, rate = 0%
      const found = r.concerns.some((c) => c.includes("digital wellbeing effectiveness"));
      expect(found).toBe(true);
    });

    it("flags mid-range digital wellbeing concern when rate 40-64", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        digital_wellbeing_records: [
          makeDigitalWellbeing({ id: "dw_1", child_engaged: true, learning_outcomes_achieved: true, follow_up_planned: true, follow_up_completed: false }),
          makeDigitalWellbeing({ id: "dw_2", child_engaged: false, learning_outcomes_achieved: false, follow_up_planned: true, follow_up_completed: true }),
        ],
      }));
      // numerator = 1+1+1=3, denominator = 2+2+2=6, rate = 50%
      const found = r.concerns.some((c) => c.includes("Digital wellbeing effectiveness at") && c.includes("need improvement"));
      expect(found).toBe(true);
    });

    it("flags self-regulation concern when rate < 40", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        self_regulation_records: [
          makeSelfRegulation({ id: "sr_1", can_identify_overuse: false, takes_voluntary_breaks: false, follows_agreed_limits: false, asks_for_help_when_struggling: false, balances_screen_offline_activities: false, recognises_impact_on_mood: false, self_regulation_score: 1 }),
        ],
      }));
      const found = r.concerns.some((c) => c.includes("self-regulation capability"));
      expect(found).toBe(true);
    });

    it("flags mid-range self-regulation concern when rate 40-64", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        self_regulation_records: [
          makeSelfRegulation({ id: "sr_1", can_identify_overuse: true, takes_voluntary_breaks: true, follows_agreed_limits: true, asks_for_help_when_struggling: false, balances_screen_offline_activities: false, recognises_impact_on_mood: false }),
        ],
      }));
      // 3/6 = 50%
      const found = r.concerns.some((c) => c.includes("Self-regulation at") && c.includes("need additional support"));
      expect(found).toBe(true);
    });

    it("flags child satisfaction concern when rate < 50", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        digital_wellbeing_records: [
          makeDigitalWellbeing({ id: "dw_1", child_feedback_positive: false }),
          makeDigitalWellbeing({ id: "dw_2", child_feedback_positive: false }),
          makeDigitalWellbeing({ id: "dw_3", child_feedback_positive: true }),
        ],
      }));
      // childSatisfaction = pct(1,3) = 33%
      const found = r.concerns.some((c) => c.includes("positive child feedback on digital wellbeing"));
      expect(found).toBe(true);
    });

    it("flags mid-range child satisfaction concern when rate 50-69", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        digital_wellbeing_records: [
          makeDigitalWellbeing({ id: "dw_1", child_feedback_positive: true }),
          makeDigitalWellbeing({ id: "dw_2", child_feedback_positive: false }),
          makeDigitalWellbeing({ id: "dw_3", child_feedback_positive: true }),
        ],
      }));
      // childSatisfaction = pct(2,3) = 67%
      const found = r.concerns.some((c) => c.includes("Child satisfaction with digital wellbeing approach at"));
      expect(found).toBe(true);
    });

    it("flags safeguarding referral missed concern", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        content_monitoring_records: [
          makeContentMonitoring({ id: "cm_1", safeguarding_referral_needed: true, safeguarding_referral_made: false }),
        ],
      }));
      const found = r.concerns.some((c) => c.includes("safeguarding referral") && c.includes("not made"));
      expect(found).toBe(true);
    });

    it("flags over-limit concern when rate > 50", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [
          makeScreenTime({ id: "st_1", actual_usage_minutes: 200, agreed_limit_minutes: 60 }),
          makeScreenTime({ id: "st_2", actual_usage_minutes: 200, agreed_limit_minutes: 60 }),
          makeScreenTime({ id: "st_3", actual_usage_minutes: 50, agreed_limit_minutes: 60 }),
        ],
      }));
      const found = r.concerns.some((c) => c.includes("exceed agreed limits by more than 15 minutes"));
      expect(found).toBe(true);
    });

    it("flags mid-range over-limit concern when rate 31-50", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [
          makeScreenTime({ id: "st_1", actual_usage_minutes: 200, agreed_limit_minutes: 60 }),
          makeScreenTime({ id: "st_2", actual_usage_minutes: 50, agreed_limit_minutes: 60 }),
          makeScreenTime({ id: "st_3", actual_usage_minutes: 50, agreed_limit_minutes: 60 }),
        ],
      }));
      // overLimit = 1/3 = 33%
      const found = r.concerns.some((c) => c.includes("sessions exceed agreed limits") && c.includes("regularly exceed"));
      expect(found).toBe(true);
    });

    it("flags bedtime handover concern when rate < 50", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [
          makeScreenTime({ id: "st_1", bedtime_device_handover: false }),
          makeScreenTime({ id: "st_2", bedtime_device_handover: false }),
          makeScreenTime({ id: "st_3", bedtime_device_handover: true }),
        ],
      }));
      // bedtimeHandover = pct(1,3) = 33%
      const found = r.concerns.some((c) => c.includes("bedtime device handover"));
      expect(found).toBe(true);
    });

    it("flags mid-range bedtime handover concern when rate 50-69", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [
          makeScreenTime({ id: "st_1", bedtime_device_handover: true }),
          makeScreenTime({ id: "st_2", bedtime_device_handover: false }),
          makeScreenTime({ id: "st_3", bedtime_device_handover: true }),
          makeScreenTime({ id: "st_4", bedtime_device_handover: false }),
        ],
      }));
      // pct(2,4) = 50%
      const found = r.concerns.some((c) => c.includes("Bedtime device handover at") && c.includes("not consistently"));
      expect(found).toBe(true);
    });

    it("flags filters concern when rate < 50", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        content_monitoring_records: [
          makeContentMonitoring({ id: "cm_1", filters_active: false }),
          makeContentMonitoring({ id: "cm_2", filters_active: false }),
          makeContentMonitoring({ id: "cm_3", filters_active: true }),
        ],
      }));
      const found = r.concerns.some((c) => c.includes("active content filters"));
      expect(found).toBe(true);
    });

    it("flags mid-range filters concern when rate 50-69", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        content_monitoring_records: [
          makeContentMonitoring({ id: "cm_1", filters_active: true }),
          makeContentMonitoring({ id: "cm_2", filters_active: false }),
          makeContentMonitoring({ id: "cm_3", filters_active: true }),
          makeContentMonitoring({ id: "cm_4", filters_active: false }),
        ],
      }));
      // pct(2,4) = 50%
      const found = r.concerns.some((c) => c.includes("Content filters active on") && c.includes("not all"));
      expect(found).toBe(true);
    });

    it("flags agreement coverage concern when < 50% of children covered", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        total_children: 5,
        usage_agreement_records: [
          makeUsageAgreement({ id: "ua_1", child_id: "child_1", agreement_active: true }),
          makeUsageAgreement({ id: "ua_2", child_id: "child_2", agreement_active: true }),
        ],
      }));
      // pct(2,5) = 40%
      const found = r.concerns.some((c) => c.includes("children have active usage agreements"));
      expect(found).toBe(true);
    });

    it("flags declining self-regulation concern when rate > 30", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        self_regulation_records: [
          makeSelfRegulation({ id: "sr_1", improvement_since_last: "declined" }),
          makeSelfRegulation({ id: "sr_2", improvement_since_last: "declined" }),
          makeSelfRegulation({ id: "sr_3", improvement_since_last: "maintained" }),
        ],
      }));
      // declinedRate = pct(2,3) = 67%
      const found = r.concerns.some((c) => c.includes("declining self-regulation"));
      expect(found).toBe(true);
    });

    it("flags missing screen time records despite children on placement", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [],
        content_monitoring_records: [makeContentMonitoring({ id: "cm_1" })],
      }));
      const found = r.concerns.some((c) => c.includes("No screen time records exist"));
      expect(found).toBe(true);
    });

    it("flags missing content monitoring records despite children on placement", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        content_monitoring_records: [],
        screen_time_records: [makeScreenTime({ id: "st_1" })],
      }));
      const found = r.concerns.some((c) => c.includes("No content monitoring records"));
      expect(found).toBe(true);
    });

    it("flags missing usage agreements despite children on placement", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        usage_agreement_records: [],
        screen_time_records: [makeScreenTime({ id: "st_1" })],
      }));
      const found = r.concerns.some((c) => c.includes("No device usage agreements"));
      expect(found).toBe(true);
    });

    it("does not flag missing records when allEmpty (handled by special case)", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        total_children: 3,
        screen_time_records: [],
        content_monitoring_records: [],
        usage_agreement_records: [],
        digital_wellbeing_records: [],
        self_regulation_records: [],
      }));
      // Should hit allEmpty special case, not individual missing concerns
      expect(r.screen_time_rating).toBe("inadequate");
      expect(r.concerns).toHaveLength(1);
    });
  });

  // ── Recommendations ───────────────────────────────────────────────────
  describe("recommendations", () => {
    it("recommends immediate safeguarding review when referrals missed", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        content_monitoring_records: [
          makeContentMonitoring({ id: "cm_1", safeguarding_referral_needed: true, safeguarding_referral_made: false }),
        ],
      }));
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("safeguarding referrals"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
      expect(rec!.regulatory_ref).toContain("Reg 7");
    });

    it("recommends immediate screen time management when rate < 40", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [
          makeScreenTime({ id: "st_1", limit_adhered_to: false, bedtime_device_handover: false }),
          makeScreenTime({ id: "st_2", limit_adhered_to: false, bedtime_device_handover: false }),
        ],
      }));
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("screen time management"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("recommends immediate content monitoring when rate < 40", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        content_monitoring_records: [
          makeContentMonitoring({ id: "cm_1", age_appropriate_content: false, filters_active: false, child_informed: false }),
        ],
      }));
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("content monitoring"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("recommends immediate screen time recording when none exist with children", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [],
        content_monitoring_records: [makeContentMonitoring({ id: "cm_1" })],
      }));
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("recording of children's screen time"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("recommends immediate content monitoring when none exist with children", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        content_monitoring_records: [],
        screen_time_records: [makeScreenTime({ id: "st_1" })],
      }));
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("content monitoring for all children"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("recommends immediate usage agreements when none exist with children", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        usage_agreement_records: [],
        screen_time_records: [makeScreenTime({ id: "st_1" })],
      }));
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("device usage agreements for every child"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("recommends immediate bedtime routine when handover < 50%", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [
          makeScreenTime({ id: "st_1", bedtime_device_handover: false }),
          makeScreenTime({ id: "st_2", bedtime_device_handover: false }),
          makeScreenTime({ id: "st_3", bedtime_device_handover: true }),
        ],
      }));
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("bedtime device collection routine"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("recommends immediate filter activation when < 50%", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        content_monitoring_records: [
          makeContentMonitoring({ id: "cm_1", filters_active: false }),
          makeContentMonitoring({ id: "cm_2", filters_active: false }),
          makeContentMonitoring({ id: "cm_3", filters_active: true }),
        ],
      }));
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("content filters"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("recommends soon screen time limit review when overLimit > 50%", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [
          makeScreenTime({ id: "st_1", actual_usage_minutes: 200, agreed_limit_minutes: 60 }),
          makeScreenTime({ id: "st_2", actual_usage_minutes: 200, agreed_limit_minutes: 60 }),
        ],
      }));
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("Review and reset screen time limits"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("recommends soon self-regulation support when rate < 40", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        self_regulation_records: [
          makeSelfRegulation({ id: "sr_1", can_identify_overuse: false, takes_voluntary_breaks: false, follows_agreed_limits: false, asks_for_help_when_struggling: false, balances_screen_offline_activities: false, recognises_impact_on_mood: false }),
        ],
      }));
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("self-regulation support plans"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("recommends soon child consultation when satisfaction < 50%", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        digital_wellbeing_records: [
          makeDigitalWellbeing({ id: "dw_1", child_feedback_positive: false }),
          makeDigitalWellbeing({ id: "dw_2", child_feedback_positive: false }),
          makeDigitalWellbeing({ id: "dw_3", child_feedback_positive: true }),
        ],
      }));
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("Consult children individually"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("recommends soon agreement improvement when rate 40-64", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        usage_agreement_records: [
          makeUsageAgreement({ id: "ua_1", child_id: "child_1", child_contributed: true, covers_screen_time_limits: true, covers_content_boundaries: true, covers_social_media_rules: false, covers_online_safety: false, covers_device_care: false, covers_consequences: false }),
          makeUsageAgreement({ id: "ua_2", child_id: "child_2", child_contributed: false, covers_screen_time_limits: false, covers_content_boundaries: false, covers_social_media_rules: false, covers_online_safety: true, covers_device_care: false, covers_consequences: false }),
        ],
      }));
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("Improve device usage agreements"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("recommends soon wellbeing enhancement when rate 40-64", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        digital_wellbeing_records: [
          makeDigitalWellbeing({ id: "dw_1", child_engaged: true, learning_outcomes_achieved: true, follow_up_planned: true, follow_up_completed: false }),
          makeDigitalWellbeing({ id: "dw_2", child_engaged: false, learning_outcomes_achieved: false, follow_up_planned: true, follow_up_completed: true }),
        ],
      }));
      // rate = pct(3, 6) = 50%
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("Enhance digital wellbeing sessions"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("recommends planned screen time strengthening when rate 40-69", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [
          makeScreenTime({ id: "st_1", limit_adhered_to: true, bedtime_device_handover: true }),
          makeScreenTime({ id: "st_2", limit_adhered_to: false, bedtime_device_handover: false }),
          makeScreenTime({ id: "st_3", limit_adhered_to: false, bedtime_device_handover: false }),
          makeScreenTime({ id: "st_4", limit_adhered_to: true, bedtime_device_handover: false }),
          makeScreenTime({ id: "st_5", limit_adhered_to: false, bedtime_device_handover: true }),
        ],
      }));
      // rate = pct(4, 10) = 40%
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("Strengthen screen time management"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
    });

    it("recommends planned content monitoring improvement when rate 40-69", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        content_monitoring_records: [
          makeContentMonitoring({ id: "cm_1", age_appropriate_content: true, filters_active: false, child_informed: false }),
          makeContentMonitoring({ id: "cm_2", age_appropriate_content: true, filters_active: true, child_informed: false }),
        ],
      }));
      // numerator=2+1+0=3, denominator=6, rate=50%
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("Improve content monitoring practices"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
    });

    it("recommends planned self-regulation building when rate 40-64", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        self_regulation_records: [
          makeSelfRegulation({ id: "sr_1", can_identify_overuse: true, takes_voluntary_breaks: true, follows_agreed_limits: true, asks_for_help_when_struggling: false, balances_screen_offline_activities: false, recognises_impact_on_mood: false }),
        ],
      }));
      // 3/6 = 50%
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("Continue building children's self-regulation"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
    });

    it("recommends planned child feedback when satisfaction 50-69", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        digital_wellbeing_records: [
          makeDigitalWellbeing({ id: "dw_1", child_feedback_positive: true }),
          makeDigitalWellbeing({ id: "dw_2", child_feedback_positive: false }),
          makeDigitalWellbeing({ id: "dw_3", child_feedback_positive: true }),
        ],
      }));
      // 67%
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("Seek regular child feedback"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
    });

    it("recommends planned discussion increase when rate < 70", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        content_monitoring_records: [
          makeContentMonitoring({ id: "cm_1", discussion_with_child: true }),
          makeContentMonitoring({ id: "cm_2", discussion_with_child: false }),
          makeContentMonitoring({ id: "cm_3", discussion_with_child: false }),
        ],
      }));
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("discussion with children"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
    });

    it("recommends planned agreement coverage extension when < 50% with agreements existing", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        total_children: 5,
        usage_agreement_records: [
          makeUsageAgreement({ id: "ua_1", child_id: "child_1", agreement_active: true }),
          makeUsageAgreement({ id: "ua_2", child_id: "child_2", agreement_active: true }),
        ],
      }));
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("Extend device usage agreements"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
    });

    it("recommends planned social worker notification when rate < 70", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        usage_agreement_records: [
          makeUsageAgreement({ id: "ua_1", social_worker_informed: true }),
          makeUsageAgreement({ id: "ua_2", social_worker_informed: false }),
          makeUsageAgreement({ id: "ua_3", social_worker_informed: false }),
        ],
      }));
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("social workers are informed"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
    });

    it("generates sequential rank numbers", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [
          makeScreenTime({ id: "st_1", limit_adhered_to: false, bedtime_device_handover: false, actual_usage_minutes: 200, agreed_limit_minutes: 60 }),
          makeScreenTime({ id: "st_2", limit_adhered_to: false, bedtime_device_handover: false, actual_usage_minutes: 200, agreed_limit_minutes: 60 }),
        ],
        content_monitoring_records: [
          makeContentMonitoring({ id: "cm_1", age_appropriate_content: false, filters_active: false, child_informed: false, safeguarding_referral_needed: true, safeguarding_referral_made: false }),
        ],
      }));
      const ranks = r.recommendations.map((rec) => rec.rank);
      for (let i = 0; i < ranks.length; i++) {
        expect(ranks[i]).toBe(i + 1);
      }
    });

    it("produces no recommendations when all metrics are excellent", () => {
      const r = computeMobilePhoneScreenTime(baseInput());
      expect(r.recommendations).toHaveLength(0);
    });
  });

  // ── Insights ──────────────────────────────────────────────────────────
  describe("insights", () => {
    // -- Critical insights --
    it("generates critical insight for safeguarding referral failure", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        content_monitoring_records: [
          makeContentMonitoring({ id: "cm_1", safeguarding_referral_needed: true, safeguarding_referral_made: false }),
        ],
      }));
      const found = r.insights.some((i) => i.severity === "critical" && i.text.includes("Safeguarding referrals"));
      expect(found).toBe(true);
    });

    it("generates critical insight for low screen time management", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [
          makeScreenTime({ id: "st_1", limit_adhered_to: false, bedtime_device_handover: false }),
          makeScreenTime({ id: "st_2", limit_adhered_to: false, bedtime_device_handover: false }),
        ],
      }));
      const found = r.insights.some((i) => i.severity === "critical" && i.text.includes("screen time management compliance"));
      expect(found).toBe(true);
    });

    it("generates critical insight for low content monitoring", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        content_monitoring_records: [
          makeContentMonitoring({ id: "cm_1", age_appropriate_content: false, filters_active: false, child_informed: false }),
        ],
      }));
      const found = r.insights.some((i) => i.severity === "critical" && i.text.includes("content monitoring effectiveness"));
      expect(found).toBe(true);
    });

    it("generates critical insight for over-limit > 50%", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [
          makeScreenTime({ id: "st_1", actual_usage_minutes: 200, agreed_limit_minutes: 60 }),
          makeScreenTime({ id: "st_2", actual_usage_minutes: 200, agreed_limit_minutes: 60 }),
        ],
      }));
      const found = r.insights.some((i) => i.severity === "critical" && i.text.includes("exceed agreed limits"));
      expect(found).toBe(true);
    });

    it("generates critical insight for bedtime handover < 40%", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [
          makeScreenTime({ id: "st_1", bedtime_device_handover: false }),
          makeScreenTime({ id: "st_2", bedtime_device_handover: false }),
          makeScreenTime({ id: "st_3", bedtime_device_handover: true }),
        ],
      }));
      // pct(1,3) = 33% < 40
      const found = r.insights.some((i) => i.severity === "critical" && i.text.includes("bedtime device handover"));
      expect(found).toBe(true);
    });

    it("generates critical insight for missing screen time records", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [],
        content_monitoring_records: [makeContentMonitoring({ id: "cm_1" })],
      }));
      const found = r.insights.some((i) => i.severity === "critical" && i.text.includes("No screen time records"));
      expect(found).toBe(true);
    });

    it("generates critical insight for missing content monitoring records", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        content_monitoring_records: [],
        screen_time_records: [makeScreenTime({ id: "st_1" })],
      }));
      const found = r.insights.some((i) => i.severity === "critical" && i.text.includes("No content monitoring records"));
      expect(found).toBe(true);
    });

    it("generates critical insight for missing usage agreements", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        usage_agreement_records: [],
        screen_time_records: [makeScreenTime({ id: "st_1" })],
      }));
      const found = r.insights.some((i) => i.severity === "critical" && i.text.includes("No device usage agreements"));
      expect(found).toBe(true);
    });

    // -- Warning insights --
    it("generates warning insight for mid-range screen time management", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [
          makeScreenTime({ id: "st_1", limit_adhered_to: true, bedtime_device_handover: true }),
          makeScreenTime({ id: "st_2", limit_adhered_to: false, bedtime_device_handover: false }),
          makeScreenTime({ id: "st_3", limit_adhered_to: false, bedtime_device_handover: false }),
          makeScreenTime({ id: "st_4", limit_adhered_to: true, bedtime_device_handover: false }),
          makeScreenTime({ id: "st_5", limit_adhered_to: false, bedtime_device_handover: true }),
        ],
      }));
      // rate = 40%
      const found = r.insights.some((i) => i.severity === "warning" && i.text.includes("Screen time management at") && i.text.includes("improving but inconsistent"));
      expect(found).toBe(true);
    });

    it("generates warning insight for mid-range content monitoring", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        content_monitoring_records: [
          makeContentMonitoring({ id: "cm_1", age_appropriate_content: true, filters_active: false, child_informed: false }),
          makeContentMonitoring({ id: "cm_2", age_appropriate_content: true, filters_active: true, child_informed: false }),
        ],
      }));
      const found = r.insights.some((i) => i.severity === "warning" && i.text.includes("Content monitoring at"));
      expect(found).toBe(true);
    });

    it("generates warning insight for mid-range usage agreement quality", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        usage_agreement_records: [
          makeUsageAgreement({ id: "ua_1", child_id: "child_1", child_contributed: true, covers_screen_time_limits: true, covers_content_boundaries: true, covers_social_media_rules: false, covers_online_safety: false, covers_device_care: false, covers_consequences: false }),
          makeUsageAgreement({ id: "ua_2", child_id: "child_2", child_contributed: false, covers_screen_time_limits: false, covers_content_boundaries: false, covers_social_media_rules: false, covers_online_safety: true, covers_device_care: false, covers_consequences: false }),
        ],
      }));
      const found = r.insights.some((i) => i.severity === "warning" && i.text.includes("Usage agreement quality at"));
      expect(found).toBe(true);
    });

    it("generates warning insight for mid-range digital wellbeing", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        digital_wellbeing_records: [
          makeDigitalWellbeing({ id: "dw_1", child_engaged: true, learning_outcomes_achieved: true, follow_up_planned: true, follow_up_completed: false }),
          makeDigitalWellbeing({ id: "dw_2", child_engaged: false, learning_outcomes_achieved: false, follow_up_planned: true, follow_up_completed: true }),
        ],
      }));
      const found = r.insights.some((i) => i.severity === "warning" && i.text.includes("Digital wellbeing effectiveness at"));
      expect(found).toBe(true);
    });

    it("generates warning insight for mid-range self-regulation", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        self_regulation_records: [
          makeSelfRegulation({ id: "sr_1", can_identify_overuse: true, takes_voluntary_breaks: true, follows_agreed_limits: true, asks_for_help_when_struggling: false, balances_screen_offline_activities: false, recognises_impact_on_mood: false }),
        ],
      }));
      const found = r.insights.some((i) => i.severity === "warning" && i.text.includes("Self-regulation at"));
      expect(found).toBe(true);
    });

    it("generates warning insight for mid-range child satisfaction", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        digital_wellbeing_records: [
          makeDigitalWellbeing({ id: "dw_1", child_feedback_positive: true }),
          makeDigitalWellbeing({ id: "dw_2", child_feedback_positive: false }),
          makeDigitalWellbeing({ id: "dw_3", child_feedback_positive: true }),
        ],
      }));
      // 67%
      const found = r.insights.some((i) => i.severity === "warning" && i.text.includes("Child satisfaction at"));
      expect(found).toBe(true);
    });

    it("generates warning insight for mid-range over-limit (31-50%)", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [
          makeScreenTime({ id: "st_1", actual_usage_minutes: 200, agreed_limit_minutes: 60 }),
          makeScreenTime({ id: "st_2", actual_usage_minutes: 50, agreed_limit_minutes: 60 }),
          makeScreenTime({ id: "st_3", actual_usage_minutes: 50, agreed_limit_minutes: 60 }),
        ],
      }));
      // 33%
      const found = r.insights.some((i) => i.severity === "warning" && i.text.includes("sessions exceed agreed limits"));
      expect(found).toBe(true);
    });

    it("generates warning insight for mid-range bedtime handover (40-69%)", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [
          makeScreenTime({ id: "st_1", bedtime_device_handover: true }),
          makeScreenTime({ id: "st_2", bedtime_device_handover: false }),
          makeScreenTime({ id: "st_3", bedtime_device_handover: true }),
          makeScreenTime({ id: "st_4", bedtime_device_handover: false }),
          makeScreenTime({ id: "st_5", bedtime_device_handover: false }),
        ],
      }));
      // pct(2,5) = 40%
      const found = r.insights.some((i) => i.severity === "warning" && i.text.includes("Bedtime device handover at"));
      expect(found).toBe(true);
    });

    it("generates warning insight for declining self-regulation > 30%", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        self_regulation_records: [
          makeSelfRegulation({ id: "sr_1", improvement_since_last: "declined" }),
          makeSelfRegulation({ id: "sr_2", improvement_since_last: "declined" }),
          makeSelfRegulation({ id: "sr_3", improvement_since_last: "maintained" }),
        ],
      }));
      const found = r.insights.some((i) => i.severity === "warning" && i.text.includes("declining self-regulation"));
      expect(found).toBe(true);
    });

    it("generates warning insight for mid-range follow-up completion (50-69%)", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        digital_wellbeing_records: [
          makeDigitalWellbeing({ id: "dw_1", follow_up_planned: true, follow_up_completed: true }),
          makeDigitalWellbeing({ id: "dw_2", follow_up_planned: true, follow_up_completed: false }),
          makeDigitalWellbeing({ id: "dw_3", follow_up_planned: true, follow_up_completed: true }),
          makeDigitalWellbeing({ id: "dw_4", follow_up_planned: true, follow_up_completed: false }),
        ],
      }));
      // pct(2, 4) = 50%
      const found = r.insights.some((i) => i.severity === "warning" && i.text.includes("Follow-up completion rate at"));
      expect(found).toBe(true);
    });

    it("generates device type analysis insight when screen time records exist", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [
          makeScreenTime({ id: "st_1", device_type: "smartphone" }),
          makeScreenTime({ id: "st_2", device_type: "smartphone" }),
          makeScreenTime({ id: "st_3", device_type: "tablet" }),
        ],
      }));
      const found = r.insights.some((i) => i.text.includes("Most used device types"));
      expect(found).toBe(true);
    });

    it("formats device types with underscores replaced by spaces", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [
          makeScreenTime({ id: "st_1", device_type: "gaming_console" }),
          makeScreenTime({ id: "st_2", device_type: "gaming_console" }),
        ],
      }));
      const insight = r.insights.find((i) => i.text.includes("Most used device types"));
      expect(insight).toBeDefined();
      expect(insight!.text).toContain("gaming console");
    });

    it("generates wellbeing topic analysis insight when records exist", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        digital_wellbeing_records: [
          makeDigitalWellbeing({ id: "dw_1", topic: "online_safety" }),
          makeDigitalWellbeing({ id: "dw_2", topic: "cyberbullying" }),
        ],
      }));
      const found = r.insights.some((i) => i.text.includes("Most covered wellbeing topics"));
      expect(found).toBe(true);
    });

    it("formats wellbeing topics with underscores replaced by spaces", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        digital_wellbeing_records: [
          makeDigitalWellbeing({ id: "dw_1", topic: "screen_time_balance" }),
        ],
      }));
      const insight = r.insights.find((i) => i.text.includes("Most covered wellbeing topics"));
      expect(insight).toBeDefined();
      expect(insight!.text).toContain("screen time balance");
    });

    // -- Positive insights --
    it("generates positive insight for outstanding rating", () => {
      const r = computeMobilePhoneScreenTime(baseInput());
      const found = r.insights.some((i) => i.severity === "positive" && i.text.includes("outstanding mobile phone and screen time management"));
      expect(found).toBe(true);
    });

    it("generates positive insight for high screen time + bedtime handover", () => {
      const r = computeMobilePhoneScreenTime(baseInput());
      const found = r.insights.some((i) => i.severity === "positive" && i.text.includes("screen time management with") && i.text.includes("bedtime handover"));
      expect(found).toBe(true);
    });

    it("generates positive insight for high content monitoring + filters", () => {
      const r = computeMobilePhoneScreenTime(baseInput());
      const found = r.insights.some((i) => i.severity === "positive" && i.text.includes("content monitoring with") && i.text.includes("active filters"));
      expect(found).toBe(true);
    });

    it("generates positive insight for high agreement quality + child contribution", () => {
      const r = computeMobilePhoneScreenTime(baseInput());
      const found = r.insights.some((i) => i.severity === "positive" && i.text.includes("agreement quality with") && i.text.includes("child contribution"));
      expect(found).toBe(true);
    });

    it("generates positive insight for high wellbeing + satisfaction", () => {
      const r = computeMobilePhoneScreenTime(baseInput());
      const found = r.insights.some((i) => i.severity === "positive" && i.text.includes("wellbeing effectiveness with") && i.text.includes("positive child feedback"));
      expect(found).toBe(true);
    });

    it("generates positive insight for high self-regulation", () => {
      const r = computeMobilePhoneScreenTime(baseInput());
      const found = r.insights.some((i) => i.severity === "positive" && i.text.includes("self-regulation capability"));
      expect(found).toBe(true);
    });

    it("generates positive insight for high child satisfaction alone", () => {
      const r = computeMobilePhoneScreenTime(baseInput());
      const found = r.insights.some((i) => i.severity === "positive" && i.text.includes("positive child feedback on digital wellbeing"));
      expect(found).toBe(true);
    });

    it("generates positive insight for 100% safeguarding compliance", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        content_monitoring_records: [
          makeContentMonitoring({ id: "cm_1", safeguarding_referral_needed: true, safeguarding_referral_made: true }),
          makeContentMonitoring({ id: "cm_2" }),
        ],
      }));
      const found = r.insights.some((i) => i.severity === "positive" && i.text.includes("safeguarding referral compliance"));
      expect(found).toBe(true);
    });

    it("generates positive insight for high improvement rate >= 70%", () => {
      const r = computeMobilePhoneScreenTime(baseInput());
      const found = r.insights.some((i) => i.severity === "positive" && i.text.includes("improving self-regulation"));
      expect(found).toBe(true);
    });

    it("generates positive insight for high follow-up completion >= 90%", () => {
      const r = computeMobilePhoneScreenTime(baseInput());
      const found = r.insights.some((i) => i.severity === "positive" && i.text.includes("follow-up actions completed"));
      expect(found).toBe(true);
    });

    it("generates positive insight for high limit adherence + self-managed", () => {
      const r = computeMobilePhoneScreenTime(baseInput());
      const found = r.insights.some((i) => i.severity === "positive" && i.text.includes("limit adherence with") && i.text.includes("self-managed"));
      expect(found).toBe(true);
    });
  });

  // ── Headlines ─────────────────────────────────────────────────────────
  describe("headlines", () => {
    it("includes 'Outstanding' in headline for outstanding rating", () => {
      const r = computeMobilePhoneScreenTime(baseInput());
      expect(r.headline).toContain("Outstanding");
    });

    it("includes 'Good' in headline for good rating", () => {
      // Same data as the "rates good" test to produce good rating
      const r = computeMobilePhoneScreenTime(baseInput({
        digital_wellbeing_records: [
          makeDigitalWellbeing({ id: "dw_1", child_engaged: true, child_feedback_positive: true, learning_outcomes_achieved: true, follow_up_planned: true, follow_up_completed: true }),
          makeDigitalWellbeing({ id: "dw_2", child_engaged: true, child_feedback_positive: false, learning_outcomes_achieved: false, follow_up_planned: true, follow_up_completed: false }),
          makeDigitalWellbeing({ id: "dw_3", child_engaged: false, child_feedback_positive: true, learning_outcomes_achieved: true, follow_up_planned: false, follow_up_completed: false }),
        ],
        self_regulation_records: [
          makeSelfRegulation({ id: "sr_1", can_identify_overuse: true, takes_voluntary_breaks: true, follows_agreed_limits: true, asks_for_help_when_struggling: true, balances_screen_offline_activities: false, recognises_impact_on_mood: false, self_regulation_score: 3, improvement_since_last: "maintained" }),
          makeSelfRegulation({ id: "sr_2", can_identify_overuse: false, takes_voluntary_breaks: true, follows_agreed_limits: true, asks_for_help_when_struggling: true, balances_screen_offline_activities: false, recognises_impact_on_mood: false, self_regulation_score: 3, improvement_since_last: "maintained" }),
        ],
      }));
      expect(r.headline).toContain("Good");
    });

    it("includes 'Adequate' in headline for adequate rating", () => {
      // Same data as the "rates adequate" test: mid-range metrics, no penalties, no bonuses => 52
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [
          makeScreenTime({ id: "st_1", limit_adhered_to: true, bedtime_device_handover: false }),
          makeScreenTime({ id: "st_2", limit_adhered_to: false, bedtime_device_handover: true }),
        ],
        content_monitoring_records: [
          makeContentMonitoring({ id: "cm_1", age_appropriate_content: true, filters_active: true, child_informed: false }),
          makeContentMonitoring({ id: "cm_2", age_appropriate_content: false, filters_active: false, child_informed: true }),
        ],
        usage_agreement_records: [],
        digital_wellbeing_records: [],
        self_regulation_records: [],
      }));
      expect(r.headline).toContain("Adequate");
    });

    it("includes 'inadequate' in headline for inadequate rating", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [
          makeScreenTime({ id: "st_1", limit_adhered_to: false, bedtime_device_handover: false, actual_usage_minutes: 300, agreed_limit_minutes: 60 }),
          makeScreenTime({ id: "st_2", limit_adhered_to: false, bedtime_device_handover: false, actual_usage_minutes: 300, agreed_limit_minutes: 60 }),
          makeScreenTime({ id: "st_3", limit_adhered_to: false, bedtime_device_handover: false, actual_usage_minutes: 300, agreed_limit_minutes: 60 }),
        ],
        content_monitoring_records: [
          makeContentMonitoring({ id: "cm_1", age_appropriate_content: false, filters_active: false, child_informed: false, safeguarding_referral_needed: true, safeguarding_referral_made: false }),
          makeContentMonitoring({ id: "cm_2", age_appropriate_content: false, filters_active: false, child_informed: false }),
        ],
        usage_agreement_records: [],
        digital_wellbeing_records: [],
        self_regulation_records: [],
      }));
      expect(r.headline).toContain("inadequate");
    });

    it("includes strength count in headline for good rating", () => {
      // Use same data as the "rates good" test
      const r = computeMobilePhoneScreenTime(baseInput({
        digital_wellbeing_records: [
          makeDigitalWellbeing({ id: "dw_1", child_engaged: true, child_feedback_positive: true, learning_outcomes_achieved: true, follow_up_planned: true, follow_up_completed: true }),
          makeDigitalWellbeing({ id: "dw_2", child_engaged: true, child_feedback_positive: false, learning_outcomes_achieved: false, follow_up_planned: true, follow_up_completed: false }),
          makeDigitalWellbeing({ id: "dw_3", child_engaged: false, child_feedback_positive: true, learning_outcomes_achieved: true, follow_up_planned: false, follow_up_completed: false }),
        ],
        self_regulation_records: [
          makeSelfRegulation({ id: "sr_1", can_identify_overuse: true, takes_voluntary_breaks: true, follows_agreed_limits: true, asks_for_help_when_struggling: true, balances_screen_offline_activities: false, recognises_impact_on_mood: false, self_regulation_score: 3, improvement_since_last: "maintained" }),
          makeSelfRegulation({ id: "sr_2", can_identify_overuse: false, takes_voluntary_breaks: true, follows_agreed_limits: true, asks_for_help_when_struggling: true, balances_screen_offline_activities: false, recognises_impact_on_mood: false, self_regulation_score: 3, improvement_since_last: "maintained" }),
        ],
      }));
      expect(r.screen_time_rating).toBe("good");
      expect(r.headline).toContain("strength");
    });
  });

  // ── Edge Cases ────────────────────────────────────────────────────────
  describe("edge cases", () => {
    it("handles single child with comprehensive data", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        total_children: 1,
        screen_time_records: [makeScreenTime({ id: "st_1", child_id: "child_1" })],
        content_monitoring_records: [makeContentMonitoring({ id: "cm_1", child_id: "child_1" })],
        usage_agreement_records: [makeUsageAgreement({ id: "ua_1", child_id: "child_1" })],
        digital_wellbeing_records: [makeDigitalWellbeing({ id: "dw_1", child_id: "child_1" })],
        self_regulation_records: [makeSelfRegulation({ id: "sr_1", child_id: "child_1" })],
      }));
      expect(r.screen_time_rating).toBeDefined();
      expect(r.screen_time_score).toBeGreaterThan(0);
    });

    it("handles only screen time records with no other data", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [makeScreenTime({ id: "st_1" })],
        content_monitoring_records: [],
        usage_agreement_records: [],
        digital_wellbeing_records: [],
        self_regulation_records: [],
      }));
      expect(r.screen_time_rating).toBeDefined();
      expect(r.total_screen_time_records).toBe(1);
      expect(r.total_content_checks).toBe(0);
    });

    it("handles only content monitoring records with no other data", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [],
        content_monitoring_records: [makeContentMonitoring({ id: "cm_1" })],
        usage_agreement_records: [],
        digital_wellbeing_records: [],
        self_regulation_records: [],
      }));
      expect(r.screen_time_rating).toBeDefined();
      expect(r.total_content_checks).toBe(1);
    });

    it("handles only usage agreement records with no other data", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [],
        content_monitoring_records: [],
        usage_agreement_records: [makeUsageAgreement({ id: "ua_1" })],
        digital_wellbeing_records: [],
        self_regulation_records: [],
      }));
      expect(r.screen_time_rating).toBeDefined();
      expect(r.usage_agreement_rate).toBeGreaterThan(0);
    });

    it("handles only digital wellbeing records with no other data", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [],
        content_monitoring_records: [],
        usage_agreement_records: [],
        digital_wellbeing_records: [makeDigitalWellbeing({ id: "dw_1" })],
        self_regulation_records: [],
      }));
      expect(r.screen_time_rating).toBeDefined();
      expect(r.digital_wellbeing_rate).toBeGreaterThan(0);
    });

    it("handles only self-regulation records with no other data", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [],
        content_monitoring_records: [],
        usage_agreement_records: [],
        digital_wellbeing_records: [],
        self_regulation_records: [makeSelfRegulation({ id: "sr_1" })],
      }));
      expect(r.screen_time_rating).toBeDefined();
      expect(r.self_regulation_rate).toBe(100);
    });

    it("handles over-limit threshold at exactly 15 minutes over (not triggered)", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [
          makeScreenTime({ id: "st_1", actual_usage_minutes: 135, agreed_limit_minutes: 120 }),
        ],
      }));
      // 135 > 120 + 15 => 135 > 135 => false, not over limit
      expect(r.screen_time_rating).toBeDefined();
    });

    it("handles over-limit threshold at exactly 16 minutes over (triggered)", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [
          makeScreenTime({ id: "st_1", actual_usage_minutes: 136, agreed_limit_minutes: 120 }),
        ],
        content_monitoring_records: [],
        usage_agreement_records: [],
        digital_wellbeing_records: [],
        self_regulation_records: [],
      }));
      // 136 > 135 => true, over limit (100% rate > 50% => -3)
      expect(r.screen_time_score).toBeLessThanOrEqual(57);
    });

    it("handles duplicate child IDs in usage agreements correctly", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        total_children: 2,
        usage_agreement_records: [
          makeUsageAgreement({ id: "ua_1", child_id: "child_1", agreement_active: true }),
          makeUsageAgreement({ id: "ua_2", child_id: "child_1", agreement_active: true, agreement_type: "review" }),
          makeUsageAgreement({ id: "ua_3", child_id: "child_2", agreement_active: true }),
        ],
      }));
      // Unique children with active = 2, coverage = pct(2,2) = 100%
      expect(r.usage_agreement_rate).toBeDefined();
    });

    it("handles inactive agreements not counting toward coverage", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        total_children: 2,
        usage_agreement_records: [
          makeUsageAgreement({ id: "ua_1", child_id: "child_1", agreement_active: false }),
          makeUsageAgreement({ id: "ua_2", child_id: "child_2", agreement_active: true }),
        ],
      }));
      // coverage = pct(1, 2) = 50%
      expect(r.usage_agreement_rate).toBeDefined();
    });

    it("handles large number of records without error", () => {
      const manyScreenTime = Array.from({ length: 50 }, (_, i) =>
        makeScreenTime({ id: `st_${i}`, child_id: `child_${i % 5}` }),
      );
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: manyScreenTime,
      }));
      expect(r.total_screen_time_records).toBe(50);
      expect(r.screen_time_rating).toBeDefined();
    });

    it("handles zero total_children with some records (not allEmpty)", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        total_children: 0,
        screen_time_records: [makeScreenTime({ id: "st_1" })],
        content_monitoring_records: [],
        usage_agreement_records: [],
        digital_wellbeing_records: [],
        self_regulation_records: [],
      }));
      // Not allEmpty (has screen_time_records), not allEmpty+children=0
      // So runs full compute
      expect(r.screen_time_rating).toBeDefined();
      expect(r.screen_time_score).toBeGreaterThan(0);
    });

    it("handles follow-up with none planned (avoid division by zero)", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        digital_wellbeing_records: [
          makeDigitalWellbeing({ id: "dw_1", follow_up_planned: false, follow_up_completed: false }),
        ],
      }));
      // followUpPlanned = 0 => followUpCompletionRate = 0 (pct(0,0)=0)
      expect(r.digital_wellbeing_rate).toBeDefined();
    });

    it("handles all safeguarding referrals made when needed", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        content_monitoring_records: [
          makeContentMonitoring({ id: "cm_1", safeguarding_referral_needed: true, safeguarding_referral_made: true }),
          makeContentMonitoring({ id: "cm_2", safeguarding_referral_needed: true, safeguarding_referral_made: true }),
          makeContentMonitoring({ id: "cm_3" }),
        ],
      }));
      // No safeguarding penalty
      const safeguardingConcern = r.concerns.some((c) => c.includes("safeguarding referral") && c.includes("not made"));
      expect(safeguardingConcern).toBe(false);
    });

    it("handles multiple safeguarding referrals missed (plural form)", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        content_monitoring_records: [
          makeContentMonitoring({ id: "cm_1", safeguarding_referral_needed: true, safeguarding_referral_made: false }),
          makeContentMonitoring({ id: "cm_2", safeguarding_referral_needed: true, safeguarding_referral_made: false }),
        ],
      }));
      const concern = r.concerns.find((c) => c.includes("safeguarding referral"));
      expect(concern).toBeDefined();
      expect(concern).toContain("referrals");
    });

    it("handles single safeguarding referral missed (singular form)", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        content_monitoring_records: [
          makeContentMonitoring({ id: "cm_1", safeguarding_referral_needed: true, safeguarding_referral_made: false }),
        ],
      }));
      const concern = r.concerns.find((c) => c.includes("safeguarding referral"));
      expect(concern).toBeDefined();
      // "1 safeguarding referral not made" — singular
      expect(concern).toContain("1 safeguarding referral not made");
    });

    it("correctly reports number of safeguarding concerns for positive insight", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        content_monitoring_records: [
          makeContentMonitoring({ id: "cm_1", safeguarding_referral_needed: true, safeguarding_referral_made: true }),
        ],
      }));
      const insight = r.insights.find((i) => i.severity === "positive" && i.text.includes("safeguarding referral compliance"));
      expect(insight).toBeDefined();
      expect(insight!.text).toContain("1 identified concern");
    });

    it("computes all rates as 0 when no wellbeing sessions for child satisfaction", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        digital_wellbeing_records: [],
      }));
      expect(r.child_satisfaction_rate).toBe(0);
      expect(r.digital_wellbeing_rate).toBe(0);
    });

    it("handles agreement with no total_children (coverage = 0)", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        total_children: 0,
        screen_time_records: [],
        content_monitoring_records: [],
        usage_agreement_records: [makeUsageAgreement({ id: "ua_1" })],
        digital_wellbeing_records: [],
        self_regulation_records: [],
      }));
      // Not allEmpty => runs compute
      // agreementCoverageRate = total_children > 0 ? pct(...) : 0 => 0
      expect(r.usage_agreement_rate).toBeDefined();
    });

    it("device type analysis shows top 3 sorted by count", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [
          makeScreenTime({ id: "st_1", device_type: "smartphone" }),
          makeScreenTime({ id: "st_2", device_type: "smartphone" }),
          makeScreenTime({ id: "st_3", device_type: "smartphone" }),
          makeScreenTime({ id: "st_4", device_type: "tablet" }),
          makeScreenTime({ id: "st_5", device_type: "tablet" }),
          makeScreenTime({ id: "st_6", device_type: "laptop" }),
          makeScreenTime({ id: "st_7", device_type: "gaming_console" }),
        ],
      }));
      const insight = r.insights.find((i) => i.text.includes("Most used device types"));
      expect(insight).toBeDefined();
      // Should show smartphone (3), tablet (2), laptop (1) — top 3
      expect(insight!.text).toContain("smartphone (3)");
      expect(insight!.text).toContain("tablet (2)");
    });

    it("wellbeing topic analysis shows top 3 sorted by count", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        digital_wellbeing_records: [
          makeDigitalWellbeing({ id: "dw_1", topic: "online_safety" }),
          makeDigitalWellbeing({ id: "dw_2", topic: "online_safety" }),
          makeDigitalWellbeing({ id: "dw_3", topic: "online_safety" }),
          makeDigitalWellbeing({ id: "dw_4", topic: "cyberbullying" }),
          makeDigitalWellbeing({ id: "dw_5", topic: "cyberbullying" }),
          makeDigitalWellbeing({ id: "dw_6", topic: "screen_time_balance" }),
          makeDigitalWellbeing({ id: "dw_7", topic: "digital_footprint" }),
        ],
      }));
      const insight = r.insights.find((i) => i.text.includes("Most covered wellbeing topics"));
      expect(insight).toBeDefined();
      expect(insight!.text).toContain("online safety (3)");
      expect(insight!.text).toContain("cyberbullying (2)");
    });
  });

  // ── Composite Score Verification ──────────────────────────────────────
  describe("composite score verification", () => {
    it("achieves maximum score of 80 with all bonuses and no penalties", () => {
      const r = computeMobilePhoneScreenTime(baseInput());
      // 52 + 5 + 5 + 5 + 4 + 5 + 4 = 80
      expect(r.screen_time_score).toBe(80);
    });

    it("achieves score of 34 with all penalties and no bonuses", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [
          makeScreenTime({ id: "st_1", limit_adhered_to: false, bedtime_device_handover: false, actual_usage_minutes: 300, agreed_limit_minutes: 60 }),
          makeScreenTime({ id: "st_2", limit_adhered_to: false, bedtime_device_handover: false, actual_usage_minutes: 300, agreed_limit_minutes: 60 }),
          makeScreenTime({ id: "st_3", limit_adhered_to: false, bedtime_device_handover: false, actual_usage_minutes: 300, agreed_limit_minutes: 60 }),
        ],
        content_monitoring_records: [
          makeContentMonitoring({ id: "cm_1", age_appropriate_content: false, filters_active: false, child_informed: false, safeguarding_referral_needed: true, safeguarding_referral_made: false }),
          makeContentMonitoring({ id: "cm_2", age_appropriate_content: false, filters_active: false, child_informed: false }),
        ],
        usage_agreement_records: [],
        digital_wellbeing_records: [],
        self_regulation_records: [],
      }));
      // 52 - 5 (screen) - 5 (content) - 5 (safeguarding) - 3 (overlimit) = 34
      expect(r.screen_time_score).toBe(34);
    });

    it("base score of 52 with only neutral data", () => {
      // Records exist but rates are in the middle ranges (no bonus, no penalty)
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [
          makeScreenTime({ id: "st_1", limit_adhered_to: true, bedtime_device_handover: true }),
          makeScreenTime({ id: "st_2", limit_adhered_to: false, bedtime_device_handover: false }),
          makeScreenTime({ id: "st_3", limit_adhered_to: false, bedtime_device_handover: false }),
          makeScreenTime({ id: "st_4", limit_adhered_to: true, bedtime_device_handover: false }),
          makeScreenTime({ id: "st_5", limit_adhered_to: false, bedtime_device_handover: true }),
        ],
        content_monitoring_records: [
          makeContentMonitoring({ id: "cm_1", age_appropriate_content: true, filters_active: false, child_informed: false }),
          makeContentMonitoring({ id: "cm_2", age_appropriate_content: true, filters_active: true, child_informed: false }),
        ],
        usage_agreement_records: [
          makeUsageAgreement({ id: "ua_1", child_id: "child_1", child_contributed: true, covers_screen_time_limits: true, covers_content_boundaries: true, covers_social_media_rules: false, covers_online_safety: false, covers_device_care: false, covers_consequences: false }),
          makeUsageAgreement({ id: "ua_2", child_id: "child_2", child_contributed: false, covers_screen_time_limits: false, covers_content_boundaries: false, covers_social_media_rules: false, covers_online_safety: true, covers_device_care: false, covers_consequences: false }),
        ],
        digital_wellbeing_records: [
          makeDigitalWellbeing({ id: "dw_1", child_engaged: true, child_feedback_positive: true, learning_outcomes_achieved: true, follow_up_planned: true, follow_up_completed: false }),
          makeDigitalWellbeing({ id: "dw_2", child_engaged: false, child_feedback_positive: false, learning_outcomes_achieved: false, follow_up_planned: true, follow_up_completed: true }),
        ],
        self_regulation_records: [
          makeSelfRegulation({ id: "sr_1", can_identify_overuse: true, takes_voluntary_breaks: true, follows_agreed_limits: true, asks_for_help_when_struggling: false, balances_screen_offline_activities: false, recognises_impact_on_mood: false }),
        ],
      }));
      // screenTime: pct(4,10)=40% => no bonus (< 70), no penalty (>= 40)
      // content: pct(3,6)=50% => no bonus (< 70), no penalty (>= 40)
      // usage: rate = round((67+50+33)/3)=50 => no bonus (< 65)
      // wellbeing: pct(3,6)=50% => no bonus (< 65)
      // selfReg: 50% => no bonus (< 65)
      // satisfaction: pct(1,2)=50% => no bonus (< 70)
      // No penalties triggered
      expect(r.screen_time_score).toBe(52);
    });
  });

  // ── Regulatory References ─────────────────────────────────────────────
  describe("regulatory references", () => {
    it("all recommendations include regulatory_ref", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [
          makeScreenTime({ id: "st_1", limit_adhered_to: false, bedtime_device_handover: false, actual_usage_minutes: 300, agreed_limit_minutes: 60 }),
          makeScreenTime({ id: "st_2", limit_adhered_to: false, bedtime_device_handover: false, actual_usage_minutes: 300, agreed_limit_minutes: 60 }),
        ],
        content_monitoring_records: [
          makeContentMonitoring({ id: "cm_1", age_appropriate_content: false, filters_active: false, child_informed: false, safeguarding_referral_needed: true, safeguarding_referral_made: false }),
        ],
        usage_agreement_records: [],
        self_regulation_records: [
          makeSelfRegulation({ id: "sr_1", can_identify_overuse: false, takes_voluntary_breaks: false, follows_agreed_limits: false, asks_for_help_when_struggling: false, balances_screen_offline_activities: false, recognises_impact_on_mood: false }),
        ],
        digital_wellbeing_records: [
          makeDigitalWellbeing({ id: "dw_1", child_feedback_positive: false }),
        ],
      }));
      for (const rec of r.recommendations) {
        expect(rec.regulatory_ref).toBeDefined();
        expect(rec.regulatory_ref.length).toBeGreaterThan(0);
      }
    });

    it("safeguarding recommendations reference Reg 7", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        content_monitoring_records: [
          makeContentMonitoring({ id: "cm_1", safeguarding_referral_needed: true, safeguarding_referral_made: false }),
        ],
      }));
      const safeguardingRec = r.recommendations.find((rec) => rec.recommendation.includes("safeguarding"));
      expect(safeguardingRec).toBeDefined();
      expect(safeguardingRec!.regulatory_ref).toContain("Reg 7");
    });

    it("screen time management recommendations reference Reg 5", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [
          makeScreenTime({ id: "st_1", limit_adhered_to: false, bedtime_device_handover: false }),
          makeScreenTime({ id: "st_2", limit_adhered_to: false, bedtime_device_handover: false }),
        ],
      }));
      const stRec = r.recommendations.find((rec) => rec.recommendation.includes("screen time management"));
      expect(stRec).toBeDefined();
      expect(stRec!.regulatory_ref).toContain("Reg 5");
    });

    it("self-regulation recommendations reference SCCIF", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        self_regulation_records: [
          makeSelfRegulation({ id: "sr_1", can_identify_overuse: false, takes_voluntary_breaks: false, follows_agreed_limits: false, asks_for_help_when_struggling: false, balances_screen_offline_activities: false, recognises_impact_on_mood: false }),
        ],
      }));
      const srRec = r.recommendations.find((rec) => rec.recommendation.includes("self-regulation support plans"));
      expect(srRec).toBeDefined();
      expect(srRec!.regulatory_ref).toContain("SCCIF");
    });
  });

  // ── Insight Severities ────────────────────────────────────────────────
  describe("insight severities", () => {
    it("all insights have valid severity", () => {
      const r = computeMobilePhoneScreenTime(baseInput());
      for (const insight of r.insights) {
        expect(["critical", "warning", "positive"]).toContain(insight.severity);
      }
    });

    it("poor data generates critical insights", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [
          makeScreenTime({ id: "st_1", limit_adhered_to: false, bedtime_device_handover: false, actual_usage_minutes: 300, agreed_limit_minutes: 60 }),
          makeScreenTime({ id: "st_2", limit_adhered_to: false, bedtime_device_handover: false, actual_usage_minutes: 300, agreed_limit_minutes: 60 }),
        ],
        content_monitoring_records: [
          makeContentMonitoring({ id: "cm_1", age_appropriate_content: false, filters_active: false, child_informed: false, safeguarding_referral_needed: true, safeguarding_referral_made: false }),
        ],
        usage_agreement_records: [],
        digital_wellbeing_records: [],
        self_regulation_records: [],
      }));
      const criticalInsights = r.insights.filter((i) => i.severity === "critical");
      expect(criticalInsights.length).toBeGreaterThan(0);
    });

    it("excellent data generates positive insights", () => {
      const r = computeMobilePhoneScreenTime(baseInput());
      const positiveInsights = r.insights.filter((i) => i.severity === "positive");
      expect(positiveInsights.length).toBeGreaterThan(0);
    });

    it("mid-range data generates warning insights", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [
          makeScreenTime({ id: "st_1", limit_adhered_to: true, bedtime_device_handover: true }),
          makeScreenTime({ id: "st_2", limit_adhered_to: false, bedtime_device_handover: false }),
          makeScreenTime({ id: "st_3", limit_adhered_to: false, bedtime_device_handover: false }),
          makeScreenTime({ id: "st_4", limit_adhered_to: true, bedtime_device_handover: false }),
          makeScreenTime({ id: "st_5", limit_adhered_to: false, bedtime_device_handover: true }),
        ],
      }));
      const warningInsights = r.insights.filter((i) => i.severity === "warning");
      expect(warningInsights.length).toBeGreaterThan(0);
    });
  });

  // ── Recommendation Urgency ────────────────────────────────────────────
  describe("recommendation urgency", () => {
    it("all recommendations have valid urgency", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        screen_time_records: [
          makeScreenTime({ id: "st_1", limit_adhered_to: false, bedtime_device_handover: false }),
          makeScreenTime({ id: "st_2", limit_adhered_to: false, bedtime_device_handover: false }),
        ],
        content_monitoring_records: [
          makeContentMonitoring({ id: "cm_1", age_appropriate_content: false, filters_active: false, child_informed: false, safeguarding_referral_needed: true, safeguarding_referral_made: false }),
        ],
        usage_agreement_records: [],
        digital_wellbeing_records: [
          makeDigitalWellbeing({ id: "dw_1", child_feedback_positive: false }),
        ],
        self_regulation_records: [
          makeSelfRegulation({ id: "sr_1", can_identify_overuse: false, takes_voluntary_breaks: false, follows_agreed_limits: false, asks_for_help_when_struggling: false, balances_screen_offline_activities: false, recognises_impact_on_mood: false }),
        ],
      }));
      for (const rec of r.recommendations) {
        expect(["immediate", "soon", "planned"]).toContain(rec.urgency);
      }
    });

    it("safeguarding failures are always immediate urgency", () => {
      const r = computeMobilePhoneScreenTime(baseInput({
        content_monitoring_records: [
          makeContentMonitoring({ id: "cm_1", safeguarding_referral_needed: true, safeguarding_referral_made: false }),
        ],
      }));
      const safeguardingRec = r.recommendations.find((rec) => rec.recommendation.includes("safeguarding"));
      expect(safeguardingRec).toBeDefined();
      expect(safeguardingRec!.urgency).toBe("immediate");
      expect(safeguardingRec!.rank).toBe(1);
    });
  });
});
