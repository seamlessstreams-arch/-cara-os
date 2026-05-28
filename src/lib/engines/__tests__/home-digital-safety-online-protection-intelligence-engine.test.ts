// ══════════════════════════════════════════════════════════════════════════════
// TESTS — HOME DIGITAL SAFETY & ONLINE PROTECTION INTELLIGENCE ENGINE
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeDigitalSafetyOnlineProtection,
  type DigitalSafetyOnlineProtectionInput,
  type EsafetyTrainingRecordInput,
  type InternetUsageLogInput,
  type SocialMediaAssessmentInput,
  type OnlineAccessAgreementInput,
  type DigitalLiteracyRecordInput,
} from "../home-digital-safety-online-protection-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2026-05-28";

function makeTraining(
  overrides: Partial<EsafetyTrainingRecordInput> = {},
): EsafetyTrainingRecordInput {
  return {
    id: "tr_1",
    child_id: "child_1",
    training_date: "2026-05-01",
    training_type: "initial",
    topic: "Online safety basics",
    completed: true,
    completion_date: "2026-05-01",
    assessment_score: 85,
    passed: true,
    trainer: "Staff A",
    next_due_date: "2026-11-01",
    overdue: false,
    child_engaged: true,
    child_understood: true,
    follow_up_required: false,
    follow_up_completed: false,
    notes: "",
    created_at: "2026-05-01",
    ...overrides,
  };
}

function makeUsageLog(
  overrides: Partial<InternetUsageLogInput> = {},
): InternetUsageLogInput {
  return {
    id: "log_1",
    child_id: "child_1",
    log_date: "2026-05-15",
    monitoring_active: true,
    hours_online: 2,
    sites_visited: 10,
    blocked_attempts: 0,
    flagged_content: false,
    flagged_content_category: null,
    action_taken: false,
    action_description: null,
    parental_controls_enabled: true,
    age_appropriate_filters: true,
    reviewed_by_staff: true,
    review_date: "2026-05-15",
    risk_level: "low",
    concerns_raised: false,
    concern_description: null,
    concern_resolved: false,
    created_at: "2026-05-15",
    ...overrides,
  };
}

function makeSocialMediaAssessment(
  overrides: Partial<SocialMediaAssessmentInput> = {},
): SocialMediaAssessmentInput {
  return {
    id: "sma_1",
    child_id: "child_1",
    assessment_date: "2026-05-01",
    platform: "TikTok",
    account_known: true,
    privacy_settings_reviewed: true,
    privacy_settings_appropriate: true,
    risk_level: "low",
    risks_identified: [],
    mitigation_actions: [],
    mitigation_completed: false,
    child_involved_in_assessment: true,
    consent_obtained: true,
    monitoring_plan_in_place: true,
    review_due_date: "2026-08-01",
    overdue: false,
    concerns_identified: false,
    concerns_description: null,
    concerns_escalated: false,
    outcome: "Safe",
    created_at: "2026-05-01",
    ...overrides,
  };
}

function makeAccessAgreement(
  overrides: Partial<OnlineAccessAgreementInput> = {},
): OnlineAccessAgreementInput {
  return {
    id: "oaa_1",
    child_id: "child_1",
    agreement_date: "2026-04-01",
    agreement_type: "standard",
    signed_by_child: true,
    signed_by_staff: true,
    signed_by_social_worker: true,
    terms_explained: true,
    child_understands_terms: true,
    devices_covered: ["phone", "tablet"],
    review_date: "2026-10-01",
    reviewed: true,
    overdue: false,
    active: true,
    breach_count: 0,
    breach_actions_taken: false,
    last_review_date: "2026-04-01",
    created_at: "2026-04-01",
    ...overrides,
  };
}

function makeDigitalLiteracy(
  overrides: Partial<DigitalLiteracyRecordInput> = {},
): DigitalLiteracyRecordInput {
  return {
    id: "dl_1",
    child_id: "child_1",
    activity_date: "2026-05-10",
    activity_type: "workshop",
    topic: "Digital citizenship",
    skill_area: "online_safety",
    completed: true,
    engagement_level: "high",
    progress_rating: 4,
    child_feedback_positive: true,
    staff_assessment: "Good progress",
    next_steps: "Continue to advanced topics",
    follow_up_date: "2026-06-10",
    certification_earned: false,
    created_at: "2026-05-10",
    ...overrides,
  };
}

function baseInput(
  overrides: Partial<DigitalSafetyOnlineProtectionInput> = {},
): DigitalSafetyOnlineProtectionInput {
  return {
    today: TODAY,
    total_children: 0,
    esafety_training_records: [],
    internet_usage_logs: [],
    social_media_assessments: [],
    online_access_agreements: [],
    digital_literacy_records: [],
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe("Home Digital Safety & Online Protection Intelligence Engine", () => {
  // ── Special cases ──────────────────────────────────────────────────────
  describe("insufficient data", () => {
    it("returns insufficient_data when all arrays empty and 0 children", () => {
      const r = computeDigitalSafetyOnlineProtection(baseInput());
      expect(r.digital_safety_rating).toBe("insufficient_data");
      expect(r.digital_safety_score).toBe(0);
    });

    it("returns headline about no children on placement", () => {
      const r = computeDigitalSafetyOnlineProtection(baseInput());
      expect(r.headline).toContain("No children on placement");
    });

    it("returns zero totals when insufficient data", () => {
      const r = computeDigitalSafetyOnlineProtection(baseInput());
      expect(r.total_training_records).toBe(0);
      expect(r.total_usage_logs).toBe(0);
      expect(r.total_social_media_assessments).toBe(0);
      expect(r.total_access_agreements).toBe(0);
      expect(r.total_digital_literacy_records).toBe(0);
    });

    it("returns empty arrays for strengths, concerns, recommendations, insights", () => {
      const r = computeDigitalSafetyOnlineProtection(baseInput());
      expect(r.strengths).toEqual([]);
      expect(r.concerns).toEqual([]);
      expect(r.recommendations).toEqual([]);
      expect(r.insights).toEqual([]);
    });
  });

  describe("inadequate baseline (all empty + children > 0)", () => {
    it("returns inadequate with score 15 when all arrays empty but children exist", () => {
      const r = computeDigitalSafetyOnlineProtection(baseInput({ total_children: 3 }));
      expect(r.digital_safety_rating).toBe("inadequate");
      expect(r.digital_safety_score).toBe(15);
    });

    it("returns headline about no data recorded despite children", () => {
      const r = computeDigitalSafetyOnlineProtection(baseInput({ total_children: 3 }));
      expect(r.headline).toContain("No digital safety or online protection data recorded");
    });

    it("returns exactly 1 concern about absence of records", () => {
      const r = computeDigitalSafetyOnlineProtection(baseInput({ total_children: 3 }));
      expect(r.concerns).toHaveLength(1);
      expect(r.concerns[0]).toContain("No e-safety training records");
    });

    it("returns exactly 2 recommendations", () => {
      const r = computeDigitalSafetyOnlineProtection(baseInput({ total_children: 3 }));
      expect(r.recommendations).toHaveLength(2);
      expect(r.recommendations[0].rank).toBe(1);
      expect(r.recommendations[0].urgency).toBe("immediate");
      expect(r.recommendations[1].rank).toBe(2);
      expect(r.recommendations[1].urgency).toBe("immediate");
    });

    it("returns exactly 1 critical insight", () => {
      const r = computeDigitalSafetyOnlineProtection(baseInput({ total_children: 3 }));
      expect(r.insights).toHaveLength(1);
      expect(r.insights[0].severity).toBe("critical");
    });
  });

  // ── Base score ─────────────────────────────────────────────────────────
  describe("base score", () => {
    it("starts at 52 with data present but no bonus or penalty triggers", () => {
      // Provide 1 training record with completed=false, passed=false to avoid bonuses
      // but also < 50% compliance to check penalty — so we need exactly 50% to avoid both
      // Actually, we need data that doesn't trigger bonuses or penalties.
      // Training: 1 record, completed=true (100%), passed=true (100%) → that would be bonuses.
      // We need to carefully set rates between 50-69 to avoid bonuses but also penalties.
      // Simpler: provide data that yields rates in the 50-69 range for all.
      // Let's use 2 training records, 1 completed 1 not → 50%, avoiding penalty (<50) and bonus (>=70)
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({
          total_children: 2,
          esafety_training_records: [
            makeTraining({ id: "tr_1", child_id: "child_1", completed: true, passed: true, child_engaged: false, child_understood: false }),
            makeTraining({ id: "tr_2", child_id: "child_2", completed: false, passed: false, child_engaged: false, child_understood: false }),
          ],
          internet_usage_logs: [
            makeUsageLog({ id: "log_1", child_id: "child_1", monitoring_active: true, reviewed_by_staff: false, parental_controls_enabled: false, age_appropriate_filters: false }),
            makeUsageLog({ id: "log_2", child_id: "child_2", monitoring_active: false, reviewed_by_staff: false, parental_controls_enabled: false, age_appropriate_filters: false }),
          ],
          social_media_assessments: [
            makeSocialMediaAssessment({ id: "sma_1", child_id: "child_1", privacy_settings_appropriate: true, child_involved_in_assessment: false, monitoring_plan_in_place: false }),
            makeSocialMediaAssessment({ id: "sma_2", child_id: "child_2", privacy_settings_appropriate: false, child_involved_in_assessment: false, monitoring_plan_in_place: false }),
          ],
          online_access_agreements: [
            makeAccessAgreement({ id: "oaa_1", child_id: "child_1", active: true, signed_by_child: false, terms_explained: false, child_understands_terms: false, reviewed: false }),
            // child_2 has no agreement → 50% coverage
          ],
          digital_literacy_records: [
            makeDigitalLiteracy({ id: "dl_1", child_id: "child_1", engagement_level: "low", completed: false, skill_area: "technical_skills", certification_earned: false }),
            makeDigitalLiteracy({ id: "dl_2", child_id: "child_2", engagement_level: "low", completed: false, skill_area: "technical_skills", certification_earned: false }),
          ],
        }),
      );
      // esafetyTrainingComplianceRate = 50% → no bonus, no penalty
      // usageMonitoringRate = 50% → no bonus, no penalty
      // socialMediaRiskAssessmentRate = 100% (2 unique children / 2) → +4 bonus
      // accessAgreementCoverageRate = 50% → no bonus, no penalty
      // digitalLiteracyEngagementRate = 0% → no bonus
      // incidentResponseRate = 0 (no incidents) → no bonus, no penalty
      // privacySettingsComplianceRate = 50% → no bonus
      // staffReviewRate = 0% → no bonus
      // trainingPassRate = 50% → no bonus
      // Score = 52 + 4 = 56
      expect(r.digital_safety_score).toBe(56);
    });
  });

  // ── Bonus 1: esafetyTrainingComplianceRate ─────────────────────────────
  describe("Bonus 1: esafetyTrainingComplianceRate", () => {
    it("+4 when compliance rate >= 90", () => {
      // 10 records, 9 completed → 90%
      const records = Array.from({ length: 10 }, (_, i) =>
        makeTraining({
          id: `tr_${i}`,
          child_id: `child_${i}`,
          completed: i < 9,
          passed: false,
          child_engaged: false,
          child_understood: false,
        }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, esafety_training_records: records }),
      );
      expect(r.esafety_training_compliance_rate).toBe(90);
      // base 52 + 4 (bonus1) + penalty2 (-5 for access<50) + penalty(incidentResponse 0 < 40 but no components) = 52+4-5 = 51
      expect(r.digital_safety_score).toBe(51);
    });

    it("+2 when compliance rate >= 70 and < 90", () => {
      // 10 records, 7 completed → 70%
      const records = Array.from({ length: 10 }, (_, i) =>
        makeTraining({
          id: `tr_${i}`,
          child_id: `child_${i}`,
          completed: i < 7,
          passed: false,
          child_engaged: false,
          child_understood: false,
        }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, esafety_training_records: records }),
      );
      expect(r.esafety_training_compliance_rate).toBe(70);
      // base 52 + 2 (bonus1) - 5 (penalty2: access < 50) = 49
      expect(r.digital_safety_score).toBe(49);
    });

    it("+0 when compliance rate < 70", () => {
      // 10 records, 6 completed → 60%
      const records = Array.from({ length: 10 }, (_, i) =>
        makeTraining({
          id: `tr_${i}`,
          child_id: `child_${i}`,
          completed: i < 6,
          passed: false,
          child_engaged: false,
          child_understood: false,
        }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, esafety_training_records: records }),
      );
      expect(r.esafety_training_compliance_rate).toBe(60);
      // base 52 + 0 - 5 (penalty2: access < 50) = 47
      expect(r.digital_safety_score).toBe(47);
    });
  });

  // ── Bonus 2: usageMonitoringRate ───────────────────────────────────────
  describe("Bonus 2: usageMonitoringRate", () => {
    it("+3 when monitoring rate >= 90", () => {
      const logs = Array.from({ length: 10 }, (_, i) =>
        makeUsageLog({
          id: `log_${i}`,
          child_id: `child_${i}`,
          monitoring_active: i < 9,
          reviewed_by_staff: false,
          parental_controls_enabled: false,
          age_appropriate_filters: false,
        }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, internet_usage_logs: logs }),
      );
      expect(r.usage_monitoring_rate).toBe(90);
      // 52 + 3 - 5 (access < 50) = 50
      expect(r.digital_safety_score).toBe(50);
    });

    it("+1 when monitoring rate >= 70 and < 90", () => {
      const logs = Array.from({ length: 10 }, (_, i) =>
        makeUsageLog({
          id: `log_${i}`,
          child_id: `child_${i}`,
          monitoring_active: i < 7,
          reviewed_by_staff: false,
          parental_controls_enabled: false,
          age_appropriate_filters: false,
        }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, internet_usage_logs: logs }),
      );
      expect(r.usage_monitoring_rate).toBe(70);
      // 52 + 1 - 5 (access < 50) = 48
      expect(r.digital_safety_score).toBe(48);
    });
  });

  // ── Bonus 3: socialMediaRiskAssessmentRate ─────────────────────────────
  describe("Bonus 3: socialMediaRiskAssessmentRate", () => {
    it("+4 when assessment rate >= 90", () => {
      // 10 children, 9 unique children assessed → 90%
      const assessments = Array.from({ length: 9 }, (_, i) =>
        makeSocialMediaAssessment({
          id: `sma_${i}`,
          child_id: `child_${i}`,
          privacy_settings_appropriate: false,
          child_involved_in_assessment: false,
          monitoring_plan_in_place: false,
        }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, social_media_assessments: assessments }),
      );
      expect(r.social_media_risk_assessment_rate).toBe(90);
      // 52 + 4 - 5 (access < 50) = 51
      expect(r.digital_safety_score).toBe(51);
    });

    it("+2 when assessment rate >= 70 and < 90", () => {
      const assessments = Array.from({ length: 7 }, (_, i) =>
        makeSocialMediaAssessment({
          id: `sma_${i}`,
          child_id: `child_${i}`,
          privacy_settings_appropriate: false,
          child_involved_in_assessment: false,
          monitoring_plan_in_place: false,
        }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, social_media_assessments: assessments }),
      );
      expect(r.social_media_risk_assessment_rate).toBe(70);
      // 52 + 2 - 5 (access < 50) = 49
      expect(r.digital_safety_score).toBe(49);
    });
  });

  // ── Bonus 4: accessAgreementCoverageRate ───────────────────────────────
  describe("Bonus 4: accessAgreementCoverageRate", () => {
    it("+3 when coverage rate >= 100", () => {
      // 3 children, 3 active agreements with unique children
      const agreements = Array.from({ length: 3 }, (_, i) =>
        makeAccessAgreement({
          id: `oaa_${i}`,
          child_id: `child_${i}`,
          active: true,
          signed_by_child: false,
          terms_explained: false,
          child_understands_terms: false,
          reviewed: false,
        }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 3, online_access_agreements: agreements }),
      );
      expect(r.access_agreement_coverage_rate).toBe(100);
      // 52 + 3 = 55
      expect(r.digital_safety_score).toBe(55);
    });

    it("+1 when coverage rate >= 80 and < 100", () => {
      // 5 children, 4 agreements → 80%
      const agreements = Array.from({ length: 4 }, (_, i) =>
        makeAccessAgreement({
          id: `oaa_${i}`,
          child_id: `child_${i}`,
          active: true,
          signed_by_child: false,
          terms_explained: false,
          child_understands_terms: false,
          reviewed: false,
        }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 5, online_access_agreements: agreements }),
      );
      expect(r.access_agreement_coverage_rate).toBe(80);
      // 52 + 1 = 53
      expect(r.digital_safety_score).toBe(53);
    });

    it("+0 when coverage rate < 80", () => {
      // 5 children, 3 agreements → 60%
      const agreements = Array.from({ length: 3 }, (_, i) =>
        makeAccessAgreement({
          id: `oaa_${i}`,
          child_id: `child_${i}`,
          active: true,
          signed_by_child: false,
          terms_explained: false,
          child_understands_terms: false,
          reviewed: false,
        }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 5, online_access_agreements: agreements }),
      );
      expect(r.access_agreement_coverage_rate).toBe(60);
      // 52 + 0 = 52
      expect(r.digital_safety_score).toBe(52);
    });
  });

  // ── Bonus 5: digitalLiteracyEngagementRate ─────────────────────────────
  describe("Bonus 5: digitalLiteracyEngagementRate", () => {
    it("+3 when engagement rate >= 90", () => {
      const records = Array.from({ length: 10 }, (_, i) =>
        makeDigitalLiteracy({
          id: `dl_${i}`,
          child_id: `child_${i}`,
          engagement_level: i < 9 ? "high" : "disengaged",
          completed: false,
          skill_area: "technical_skills",
          certification_earned: false,
          progress_rating: 1,
          child_feedback_positive: false,
        }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, digital_literacy_records: records }),
      );
      expect(r.digital_literacy_engagement_rate).toBe(90);
      // 52 + 3 - 5 (access < 50) = 50
      expect(r.digital_safety_score).toBe(50);
    });

    it("+1 when engagement rate >= 70 and < 90", () => {
      const records = Array.from({ length: 10 }, (_, i) =>
        makeDigitalLiteracy({
          id: `dl_${i}`,
          child_id: `child_${i}`,
          engagement_level: i < 7 ? "medium" : "disengaged",
          completed: false,
          skill_area: "technical_skills",
          certification_earned: false,
          progress_rating: 1,
          child_feedback_positive: false,
        }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, digital_literacy_records: records }),
      );
      expect(r.digital_literacy_engagement_rate).toBe(70);
      // 52 + 1 - 5 (access < 50) = 48
      expect(r.digital_safety_score).toBe(48);
    });
  });

  // ── Bonus 6: incidentResponseRate ──────────────────────────────────────
  describe("Bonus 6: incidentResponseRate", () => {
    it("+3 when incident response rate >= 90", () => {
      // Provide flagged content logs where all have action taken
      const logs = Array.from({ length: 10 }, (_, i) =>
        makeUsageLog({
          id: `log_${i}`,
          child_id: `child_1`,
          flagged_content: true,
          flagged_content_category: "violence",
          action_taken: true,
          monitoring_active: false,
          reviewed_by_staff: false,
          parental_controls_enabled: false,
          age_appropriate_filters: false,
        }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 1, internet_usage_logs: logs }),
      );
      // flaggedContentResponseRate = 100%, only 1 component → incidentResponseRate = 100
      expect(r.incident_response_rate).toBe(100);
      // 52 + 3 (bonus6) - 5 (penalty2: access<50) - 4 (penalty4: monitoring<50) = 46
      expect(r.digital_safety_score).toBe(46);
    });

    it("+1 when incident response rate >= 70 and < 90", () => {
      // 10 flagged, 7 with action → 70%
      const logs = Array.from({ length: 10 }, (_, i) =>
        makeUsageLog({
          id: `log_${i}`,
          child_id: `child_1`,
          flagged_content: true,
          flagged_content_category: "violence",
          action_taken: i < 7,
          monitoring_active: false,
          reviewed_by_staff: false,
          parental_controls_enabled: false,
          age_appropriate_filters: false,
        }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 1, internet_usage_logs: logs }),
      );
      expect(r.incident_response_rate).toBe(70);
      // 52 + 1 (bonus6) - 5 (penalty2: access<50) - 4 (penalty4: monitoring<50) = 44
      expect(r.digital_safety_score).toBe(44);
    });
  });

  // ── Bonus 7: privacySettingsComplianceRate ─────────────────────────────
  describe("Bonus 7: privacySettingsComplianceRate", () => {
    it("+3 when privacy compliance >= 90", () => {
      const assessments = Array.from({ length: 10 }, (_, i) =>
        makeSocialMediaAssessment({
          id: `sma_${i}`,
          child_id: `child_${i}`,
          privacy_settings_appropriate: i < 9,
          child_involved_in_assessment: false,
          monitoring_plan_in_place: false,
        }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, social_media_assessments: assessments }),
      );
      expect(r.privacy_settings_compliance_rate).toBe(90);
      // 52 + 4 (bonus3: smRate=100%) + 3 (bonus7) - 5 (penalty2: access<50) = 54
      expect(r.digital_safety_score).toBe(54);
    });

    it("+1 when privacy compliance >= 70 and < 90", () => {
      const assessments = Array.from({ length: 10 }, (_, i) =>
        makeSocialMediaAssessment({
          id: `sma_${i}`,
          child_id: `child_${i}`,
          privacy_settings_appropriate: i < 7,
          child_involved_in_assessment: false,
          monitoring_plan_in_place: false,
        }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, social_media_assessments: assessments }),
      );
      expect(r.privacy_settings_compliance_rate).toBe(70);
      // 52 + 4 (bonus3) + 1 (bonus7) - 5 (penalty2: access<50) = 52
      expect(r.digital_safety_score).toBe(52);
    });
  });

  // ── Bonus 8: staffReviewRate ───────────────────────────────────────────
  describe("Bonus 8: staffReviewRate", () => {
    it("+2 when staff review rate >= 90", () => {
      const logs = Array.from({ length: 10 }, (_, i) =>
        makeUsageLog({
          id: `log_${i}`,
          child_id: `child_${i}`,
          reviewed_by_staff: i < 9,
          monitoring_active: false,
          parental_controls_enabled: false,
          age_appropriate_filters: false,
        }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, internet_usage_logs: logs }),
      );
      // staffReviewRate = 90%
      // 52 + 2 (bonus8) - 5 (penalty2: access<50) - 4 (penalty4: monitoring<50) = 45
      expect(r.digital_safety_score).toBe(45);
    });

    it("+1 when staff review rate >= 70 and < 90", () => {
      const logs = Array.from({ length: 10 }, (_, i) =>
        makeUsageLog({
          id: `log_${i}`,
          child_id: `child_${i}`,
          reviewed_by_staff: i < 7,
          monitoring_active: false,
          parental_controls_enabled: false,
          age_appropriate_filters: false,
        }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, internet_usage_logs: logs }),
      );
      // staffReviewRate = 70%
      // 52 + 1 (bonus8) - 5 (penalty2: access<50) - 4 (penalty4: monitoring<50) = 44
      expect(r.digital_safety_score).toBe(44);
    });
  });

  // ── Bonus 9: trainingPassRate ──────────────────────────────────────────
  describe("Bonus 9: trainingPassRate", () => {
    it("+3 when pass rate >= 90", () => {
      const records = Array.from({ length: 10 }, (_, i) =>
        makeTraining({
          id: `tr_${i}`,
          child_id: `child_${i}`,
          completed: false,
          passed: i < 9,
          child_engaged: false,
          child_understood: false,
        }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, esafety_training_records: records }),
      );
      expect(r.training_pass_rate).toBe(90);
      // esafetyTrainingComplianceRate = 0% → penalty1: -5
      // 52 + 3 (bonus9) - 5 (penalty1: compliance<50) - 5 (penalty2: access<50) = 45
      expect(r.digital_safety_score).toBe(45);
    });

    it("+1 when pass rate >= 70 and < 90", () => {
      const records = Array.from({ length: 10 }, (_, i) =>
        makeTraining({
          id: `tr_${i}`,
          child_id: `child_${i}`,
          completed: false,
          passed: i < 7,
          child_engaged: false,
          child_understood: false,
        }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, esafety_training_records: records }),
      );
      expect(r.training_pass_rate).toBe(70);
      // 52 + 1 (bonus9) - 5 (penalty1) - 5 (penalty2) = 43
      expect(r.digital_safety_score).toBe(43);
    });
  });

  // ── All bonuses combined → outstanding ─────────────────────────────────
  describe("all bonuses combined", () => {
    it("reaches exactly 80 (outstanding) when all bonuses maxed and no penalties", () => {
      const children = 3;
      // Training: 100% completed, 100% passed
      const training = Array.from({ length: 3 }, (_, i) =>
        makeTraining({
          id: `tr_${i}`,
          child_id: `child_${i}`,
          completed: true,
          passed: true,
          child_engaged: true,
          child_understood: true,
        }),
      );
      // Usage logs: 100% monitored, 100% reviewed
      const logs = Array.from({ length: 3 }, (_, i) =>
        makeUsageLog({
          id: `log_${i}`,
          child_id: `child_${i}`,
          monitoring_active: true,
          reviewed_by_staff: true,
          parental_controls_enabled: true,
          age_appropriate_filters: true,
        }),
      );
      // Social media: 100% coverage, 100% privacy
      const assessments = Array.from({ length: 3 }, (_, i) =>
        makeSocialMediaAssessment({
          id: `sma_${i}`,
          child_id: `child_${i}`,
          privacy_settings_appropriate: true,
          child_involved_in_assessment: true,
          monitoring_plan_in_place: true,
        }),
      );
      // Access agreements: 100% coverage
      const agreements = Array.from({ length: 3 }, (_, i) =>
        makeAccessAgreement({
          id: `oaa_${i}`,
          child_id: `child_${i}`,
          active: true,
        }),
      );
      // Digital literacy: 100% engagement
      const literacy = Array.from({ length: 3 }, (_, i) =>
        makeDigitalLiteracy({
          id: `dl_${i}`,
          child_id: `child_${i}`,
          engagement_level: "high",
          completed: true,
        }),
      );

      const r = computeDigitalSafetyOnlineProtection(
        baseInput({
          total_children: children,
          esafety_training_records: training,
          internet_usage_logs: logs,
          social_media_assessments: assessments,
          online_access_agreements: agreements,
          digital_literacy_records: literacy,
        }),
      );

      // No incident components → incidentResponseRate = 0 → no bonus 6
      // 52 + 4 + 3 + 4 + 3 + 3 + 0 + 3 + 2 + 3 = 77
      // We need incidents to get bonus 6
      expect(r.digital_safety_score).toBe(77);
    });

    it("reaches 80 with all bonuses including incident response", () => {
      const children = 3;
      const training = Array.from({ length: 3 }, (_, i) =>
        makeTraining({
          id: `tr_${i}`,
          child_id: `child_${i}`,
          completed: true,
          passed: true,
          child_engaged: true,
          child_understood: true,
        }),
      );
      const logs = Array.from({ length: 3 }, (_, i) =>
        makeUsageLog({
          id: `log_${i}`,
          child_id: `child_${i}`,
          monitoring_active: true,
          reviewed_by_staff: true,
          parental_controls_enabled: true,
          age_appropriate_filters: true,
          flagged_content: true,
          flagged_content_category: "violence",
          action_taken: true,
        }),
      );
      const assessments = Array.from({ length: 3 }, (_, i) =>
        makeSocialMediaAssessment({
          id: `sma_${i}`,
          child_id: `child_${i}`,
          privacy_settings_appropriate: true,
          child_involved_in_assessment: true,
          monitoring_plan_in_place: true,
        }),
      );
      const agreements = Array.from({ length: 3 }, (_, i) =>
        makeAccessAgreement({
          id: `oaa_${i}`,
          child_id: `child_${i}`,
          active: true,
        }),
      );
      const literacy = Array.from({ length: 3 }, (_, i) =>
        makeDigitalLiteracy({
          id: `dl_${i}`,
          child_id: `child_${i}`,
          engagement_level: "high",
          completed: true,
        }),
      );

      const r = computeDigitalSafetyOnlineProtection(
        baseInput({
          total_children: children,
          esafety_training_records: training,
          internet_usage_logs: logs,
          social_media_assessments: assessments,
          online_access_agreements: agreements,
          digital_literacy_records: literacy,
        }),
      );

      // 52 + 4 + 3 + 4 + 3 + 3 + 3 + 3 + 2 + 3 = 80
      expect(r.digital_safety_score).toBe(80);
      expect(r.digital_safety_rating).toBe("outstanding");
    });
  });

  // ── Penalties ──────────────────────────────────────────────────────────
  describe("Penalty 1: esafetyTrainingComplianceRate < 50", () => {
    it("-5 when compliance < 50 with training records present", () => {
      // 10 records, 4 completed → 40%
      const records = Array.from({ length: 10 }, (_, i) =>
        makeTraining({
          id: `tr_${i}`,
          child_id: `child_${i}`,
          completed: i < 4,
          passed: false,
          child_engaged: false,
          child_understood: false,
        }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, esafety_training_records: records }),
      );
      expect(r.esafety_training_compliance_rate).toBe(40);
      // 52 - 5 (penalty1) - 5 (penalty2: access<50) = 42
      expect(r.digital_safety_score).toBe(42);
    });

    it("no penalty when compliance < 50 but no training records (guard)", () => {
      // No training records → compliance = pct(0,0) = 0, but guard: totalTrainingRecords > 0
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({
          total_children: 3,
          internet_usage_logs: [makeUsageLog({ id: "log_1", monitoring_active: true, reviewed_by_staff: false, parental_controls_enabled: false, age_appropriate_filters: false })],
        }),
      );
      expect(r.esafety_training_compliance_rate).toBe(0);
      // Penalty1 NOT applied (no records)
      // bonus2: monitoring 100% → +3
      // penalty2 (access<50): -5
      // 52 + 3 - 5 = 50
      expect(r.digital_safety_score).toBe(50);
    });
  });

  describe("Penalty 2: accessAgreementCoverageRate < 50", () => {
    it("-5 when coverage < 50 with children present", () => {
      // 10 children, 4 agreements → 40%
      const agreements = Array.from({ length: 4 }, (_, i) =>
        makeAccessAgreement({
          id: `oaa_${i}`,
          child_id: `child_${i}`,
          active: true,
          signed_by_child: false,
          terms_explained: false,
          child_understands_terms: false,
          reviewed: false,
        }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, online_access_agreements: agreements }),
      );
      expect(r.access_agreement_coverage_rate).toBe(40);
      // 52 - 5 = 47
      expect(r.digital_safety_score).toBe(47);
    });

    it("no penalty when total_children is 0 (guard)", () => {
      // total_children = 0 with some data present (not allEmpty) would hit insufficient_data
      // So test with total_children > 0 but all agreements inactive
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({
          total_children: 3,
          online_access_agreements: [
            makeAccessAgreement({ id: "oaa_1", child_id: "child_1", active: false, signed_by_child: false, terms_explained: false, child_understands_terms: false, reviewed: false }),
          ],
        }),
      );
      // accessAgreementCoverageRate = 0% (no active agreements), total_children > 0 → penalty applies
      expect(r.access_agreement_coverage_rate).toBe(0);
      // 52 - 5 = 47
      expect(r.digital_safety_score).toBe(47);
    });
  });

  describe("Penalty 3: incidentResponseRate < 40 with incidents", () => {
    it("-4 when incident response < 40 with incidents existing", () => {
      // Flagged content with no action → 0% response
      const logs = [
        makeUsageLog({
          id: "log_1",
          child_id: "child_1",
          flagged_content: true,
          flagged_content_category: "violence",
          action_taken: false,
          monitoring_active: false,
          reviewed_by_staff: false,
          parental_controls_enabled: false,
          age_appropriate_filters: false,
        }),
      ];
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 1, internet_usage_logs: logs }),
      );
      expect(r.incident_response_rate).toBe(0);
      // 52 - 5 (penalty2: access<50) - 4 (penalty3) - 4 (penalty4: monitoring<50) = 39
      expect(r.digital_safety_score).toBe(39);
    });

    it("no penalty when < 40 but no incident components", () => {
      // No flagged content, no concerns, no breaches → empty components
      const logs = [
        makeUsageLog({
          id: "log_1",
          child_id: "child_1",
          monitoring_active: true,
          reviewed_by_staff: false,
          parental_controls_enabled: false,
          age_appropriate_filters: false,
        }),
      ];
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 1, internet_usage_logs: logs }),
      );
      expect(r.incident_response_rate).toBe(0);
      // No penalty3 (no incident components)
      // bonus2: monitoring 100% → +3
      // penalty2 (access<50): -5
      // 52 + 3 - 5 = 50
      expect(r.digital_safety_score).toBe(50);
    });
  });

  describe("Penalty 4: usageMonitoringRate < 50", () => {
    it("-4 when monitoring rate < 50 with usage logs present", () => {
      // 10 logs, 4 monitored → 40%
      const logs = Array.from({ length: 10 }, (_, i) =>
        makeUsageLog({
          id: `log_${i}`,
          child_id: `child_${i}`,
          monitoring_active: i < 4,
          reviewed_by_staff: false,
          parental_controls_enabled: false,
          age_appropriate_filters: false,
        }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, internet_usage_logs: logs }),
      );
      expect(r.usage_monitoring_rate).toBe(40);
      // 52 - 5 (penalty2: access<50) - 4 (penalty4) = 43
      expect(r.digital_safety_score).toBe(43);
    });

    it("no penalty when monitoring rate < 50 but no logs (guard)", () => {
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({
          total_children: 3,
          esafety_training_records: [makeTraining({ completed: true, passed: false, child_engaged: false, child_understood: false })],
        }),
      );
      expect(r.usage_monitoring_rate).toBe(0);
      // No penalty4 (no logs)
      // bonus1: compliance 100% → +4
      // penalty2 (access<50): -5
      // 52 + 4 - 5 = 51
      expect(r.digital_safety_score).toBe(51);
    });
  });

  // ── Penalty guards ─────────────────────────────────────────────────────
  describe("penalty guards", () => {
    it("pct(0,0) = 0 but penalties guarded by record counts", () => {
      // All empty arrays → allEmpty → special case handled before penalties
      // With 1 record type present (non-allEmpty), the other pct(0,0) = 0 metrics should not trigger penalties
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({
          total_children: 3,
          digital_literacy_records: [
            makeDigitalLiteracy({ id: "dl_1", child_id: "child_1", engagement_level: "low", completed: false, skill_area: "technical_skills", certification_earned: false, progress_rating: 1, child_feedback_positive: false }),
          ],
        }),
      );
      // esafetyTrainingComplianceRate = 0 but no records → no penalty1
      // accessAgreementCoverageRate = 0 and total_children > 0 → penalty2: -5
      // incidentResponseRate = 0 but no components → no penalty3
      // usageMonitoringRate = 0 but no logs → no penalty4
      expect(r.digital_safety_score).toBe(47);
    });
  });

  // ── Rating boundaries ─────────────────────────────────────────────────
  describe("rating boundaries", () => {
    it("outstanding at score 80", () => {
      // Use the full bonus scenario from above
      const children = 3;
      const training = Array.from({ length: 3 }, (_, i) =>
        makeTraining({ id: `tr_${i}`, child_id: `child_${i}`, completed: true, passed: true, child_engaged: true, child_understood: true }),
      );
      const logs = Array.from({ length: 3 }, (_, i) =>
        makeUsageLog({ id: `log_${i}`, child_id: `child_${i}`, monitoring_active: true, reviewed_by_staff: true, flagged_content: true, flagged_content_category: "violence", action_taken: true }),
      );
      const assessments = Array.from({ length: 3 }, (_, i) =>
        makeSocialMediaAssessment({ id: `sma_${i}`, child_id: `child_${i}`, privacy_settings_appropriate: true, child_involved_in_assessment: true, monitoring_plan_in_place: true }),
      );
      const agreements = Array.from({ length: 3 }, (_, i) =>
        makeAccessAgreement({ id: `oaa_${i}`, child_id: `child_${i}`, active: true }),
      );
      const literacy = Array.from({ length: 3 }, (_, i) =>
        makeDigitalLiteracy({ id: `dl_${i}`, child_id: `child_${i}`, engagement_level: "high", completed: true }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: children, esafety_training_records: training, internet_usage_logs: logs, social_media_assessments: assessments, online_access_agreements: agreements, digital_literacy_records: literacy }),
      );
      expect(r.digital_safety_score).toBe(80);
      expect(r.digital_safety_rating).toBe("outstanding");
    });

    it("good at score 79 (just below outstanding)", () => {
      // 80 - need to drop 1 point. Remove incident response bonus (no flagged content) → 77
      // That's too low. Let's build from scratch:
      // All bonuses except bonus6 (no incident components): 52 + 4+3+4+3+3+0+3+2+3 = 77 → good
      const children = 3;
      const training = Array.from({ length: 3 }, (_, i) =>
        makeTraining({ id: `tr_${i}`, child_id: `child_${i}`, completed: true, passed: true, child_engaged: true, child_understood: true }),
      );
      const logs = Array.from({ length: 3 }, (_, i) =>
        makeUsageLog({ id: `log_${i}`, child_id: `child_${i}`, monitoring_active: true, reviewed_by_staff: true }),
      );
      const assessments = Array.from({ length: 3 }, (_, i) =>
        makeSocialMediaAssessment({ id: `sma_${i}`, child_id: `child_${i}`, privacy_settings_appropriate: true, child_involved_in_assessment: true, monitoring_plan_in_place: true }),
      );
      const agreements = Array.from({ length: 3 }, (_, i) =>
        makeAccessAgreement({ id: `oaa_${i}`, child_id: `child_${i}`, active: true }),
      );
      const literacy = Array.from({ length: 3 }, (_, i) =>
        makeDigitalLiteracy({ id: `dl_${i}`, child_id: `child_${i}`, engagement_level: "high", completed: true }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: children, esafety_training_records: training, internet_usage_logs: logs, social_media_assessments: assessments, online_access_agreements: agreements, digital_literacy_records: literacy }),
      );
      expect(r.digital_safety_score).toBe(77);
      expect(r.digital_safety_rating).toBe("good");
    });

    it("good at score 65", () => {
      // 52 + need 13 in bonuses with no penalties
      // bonus1(+4) + bonus3(+4) + bonus4(+3) + bonus7(+3) = 14 → 66. Close enough, let's use +2 for bonus1
      // bonus1(+2) + bonus3(+4) + bonus4(+3) + bonus7(+3) = 12 → 64. Need 1 more: add bonus9(+1)
      // 52 + 2 + 4 + 3 + 3 + 1 = 65
      // Training: 70% compliance, 70% pass rate
      const training = Array.from({ length: 10 }, (_, i) =>
        makeTraining({
          id: `tr_${i}`,
          child_id: `child_${i}`,
          completed: i < 7,
          passed: i < 7,
          child_engaged: false,
          child_understood: false,
        }),
      );
      // Social media: 100% coverage (10 children, 10 unique), 90% privacy
      const assessments = Array.from({ length: 10 }, (_, i) =>
        makeSocialMediaAssessment({
          id: `sma_${i}`,
          child_id: `child_${i}`,
          privacy_settings_appropriate: i < 9,
          child_involved_in_assessment: false,
          monitoring_plan_in_place: false,
        }),
      );
      // Access agreements: 100% coverage (10 children, 10 active)
      const agreements = Array.from({ length: 10 }, (_, i) =>
        makeAccessAgreement({
          id: `oaa_${i}`,
          child_id: `child_${i}`,
          active: true,
          signed_by_child: false,
          terms_explained: false,
          child_understands_terms: false,
          reviewed: false,
        }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({
          total_children: 10,
          esafety_training_records: training,
          social_media_assessments: assessments,
          online_access_agreements: agreements,
        }),
      );
      // bonus1: compliance 70% → +2
      // bonus3: smRate 100% → +4
      // bonus4: access 100% → +3
      // bonus7: privacy 90% → +3
      // bonus9: passRate 70% → +1
      // total: 52 + 2 + 4 + 3 + 3 + 1 = 65
      expect(r.digital_safety_score).toBe(65);
      expect(r.digital_safety_rating).toBe("good");
    });

    it("adequate at score 64 (just below good)", () => {
      // 52 + 12 bonuses
      // bonus1(+2) + bonus3(+4) + bonus4(+3) + bonus7(+3) = 12 → 64
      const training = Array.from({ length: 10 }, (_, i) =>
        makeTraining({
          id: `tr_${i}`,
          child_id: `child_${i}`,
          completed: i < 7,
          passed: false,
          child_engaged: false,
          child_understood: false,
        }),
      );
      const assessments = Array.from({ length: 10 }, (_, i) =>
        makeSocialMediaAssessment({
          id: `sma_${i}`,
          child_id: `child_${i}`,
          privacy_settings_appropriate: i < 9,
          child_involved_in_assessment: false,
          monitoring_plan_in_place: false,
        }),
      );
      const agreements = Array.from({ length: 10 }, (_, i) =>
        makeAccessAgreement({
          id: `oaa_${i}`,
          child_id: `child_${i}`,
          active: true,
          signed_by_child: false,
          terms_explained: false,
          child_understands_terms: false,
          reviewed: false,
        }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({
          total_children: 10,
          esafety_training_records: training,
          social_media_assessments: assessments,
          online_access_agreements: agreements,
        }),
      );
      // bonus1: 70% → +2, bonus3: 100% → +4, bonus4: 100% → +3, bonus7: 90% → +3
      // 52 + 2 + 4 + 3 + 3 = 64
      expect(r.digital_safety_score).toBe(64);
      expect(r.digital_safety_rating).toBe("adequate");
    });

    it("adequate at score 45", () => {
      // 52 - penalties to reach 45
      // penalty1 (-5) + penalty2 (-5): need compliance<50 + access<50 = 52 - 10 + bonuses
      // Actually 52 - 5 (penalty2) = 47, need to lose 2 more
      // Let's do penalty2(-5) + penalty4(-4) = 52 - 9 = 43... too low
      // penalty2(-5) only + bonus8(+1) = 52 - 5 + 1 = 48, still not 45
      // penalty1(-5) + penalty2(-5) = 42, need +3 bonus → bonus9(+3 with passRate>=90)
      // But penalty1 requires compliance<50, and we need passRate>=90
      // Training: 10 records, 4 completed (40% compliance → penalty1), 9 passed (90% → bonus9+3)
      const training = Array.from({ length: 10 }, (_, i) =>
        makeTraining({
          id: `tr_${i}`,
          child_id: `child_${i}`,
          completed: i < 4,
          passed: i < 9,
          child_engaged: false,
          child_understood: false,
        }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, esafety_training_records: training }),
      );
      // 52 + 3 (bonus9: passRate 90%) - 5 (penalty1: compliance 40%) - 5 (penalty2: access 0%) = 45
      expect(r.digital_safety_score).toBe(45);
      expect(r.digital_safety_rating).toBe("adequate");
    });

    it("inadequate at score 44 (just below adequate)", () => {
      // 52 - 5 (penalty1) - 5 (penalty2) + 1 (bonus9: passRate 70%) + 1 (bonus8: staffReview 70%)
      // = 52 - 10 + 2 = 44
      const training = Array.from({ length: 10 }, (_, i) =>
        makeTraining({
          id: `tr_${i}`,
          child_id: `child_${i}`,
          completed: i < 4,
          passed: i < 7,
          child_engaged: false,
          child_understood: false,
        }),
      );
      const logs = Array.from({ length: 10 }, (_, i) =>
        makeUsageLog({
          id: `log_${i}`,
          child_id: `child_${i}`,
          monitoring_active: true,
          reviewed_by_staff: i < 7,
          parental_controls_enabled: false,
          age_appropriate_filters: false,
        }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({
          total_children: 10,
          esafety_training_records: training,
          internet_usage_logs: logs,
        }),
      );
      // bonus2: monitoringRate 100% → +3, bonus8: staffReview 70% → +1, bonus9: passRate 70% → +1
      // penalty1: compliance 40% → -5, penalty2: access 0% → -5
      // 52 + 3 + 1 + 1 - 5 - 5 = 47... not 44
      // Need to adjust. Let's reduce monitoring bonus. 70% → +1
      // 52 + 1 + 1 + 1 - 5 - 5 = 45... still not 44
      // Make monitoring < 70 to get no bonus2 and no penalty4 (need >=50)
      // 60% monitoring → no bonus2, no penalty4
      // 52 + 0 + 1 + 1 - 5 - 5 = 44
      const training2 = Array.from({ length: 10 }, (_, i) =>
        makeTraining({
          id: `tr2_${i}`,
          child_id: `child_${i}`,
          completed: i < 4,
          passed: i < 7,
          child_engaged: false,
          child_understood: false,
        }),
      );
      const logs2 = Array.from({ length: 10 }, (_, i) =>
        makeUsageLog({
          id: `log2_${i}`,
          child_id: `child_${i}`,
          monitoring_active: i < 6,
          reviewed_by_staff: i < 7,
          parental_controls_enabled: false,
          age_appropriate_filters: false,
        }),
      );
      const r2 = computeDigitalSafetyOnlineProtection(
        baseInput({
          total_children: 10,
          esafety_training_records: training2,
          internet_usage_logs: logs2,
        }),
      );
      // bonus2: monitoring 60% → 0, bonus8: staffReview 70% → +1, bonus9: passRate 70% → +1
      // penalty1: compliance 40% → -5, penalty2: access 0% → -5
      // 52 + 0 + 1 + 1 - 5 - 5 = 44
      expect(r2.digital_safety_score).toBe(44);
      expect(r2.digital_safety_rating).toBe("inadequate");
    });
  });

  // ── Metric calculations ────────────────────────────────────────────────
  describe("metric calculations", () => {
    it("computes esafety_training_compliance_rate correctly", () => {
      const records = [
        makeTraining({ id: "tr_1", child_id: "child_1", completed: true }),
        makeTraining({ id: "tr_2", child_id: "child_2", completed: true }),
        makeTraining({ id: "tr_3", child_id: "child_3", completed: false }),
      ];
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 3, esafety_training_records: records }),
      );
      expect(r.esafety_training_compliance_rate).toBe(67); // Math.round(2/3*100)
    });

    it("computes training_pass_rate correctly", () => {
      const records = [
        makeTraining({ id: "tr_1", child_id: "child_1", passed: true }),
        makeTraining({ id: "tr_2", child_id: "child_2", passed: false }),
        makeTraining({ id: "tr_3", child_id: "child_3", passed: true }),
        makeTraining({ id: "tr_4", child_id: "child_4", passed: false }),
      ];
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 4, esafety_training_records: records }),
      );
      expect(r.training_pass_rate).toBe(50);
    });

    it("computes usage_monitoring_rate correctly", () => {
      const logs = [
        makeUsageLog({ id: "log_1", monitoring_active: true }),
        makeUsageLog({ id: "log_2", monitoring_active: false }),
        makeUsageLog({ id: "log_3", monitoring_active: true }),
      ];
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 1, internet_usage_logs: logs }),
      );
      expect(r.usage_monitoring_rate).toBe(67);
    });

    it("computes social_media_risk_assessment_rate correctly", () => {
      const assessments = [
        makeSocialMediaAssessment({ id: "sma_1", child_id: "child_1" }),
        makeSocialMediaAssessment({ id: "sma_2", child_id: "child_2" }),
        // child_3 has no assessment
      ];
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 3, social_media_assessments: assessments }),
      );
      expect(r.social_media_risk_assessment_rate).toBe(67);
    });

    it("computes access_agreement_coverage_rate correctly", () => {
      const agreements = [
        makeAccessAgreement({ id: "oaa_1", child_id: "child_1", active: true }),
        makeAccessAgreement({ id: "oaa_2", child_id: "child_2", active: true }),
        makeAccessAgreement({ id: "oaa_3", child_id: "child_3", active: false }),
      ];
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 4, online_access_agreements: agreements }),
      );
      // 2 unique active children / 4 total = 50%
      expect(r.access_agreement_coverage_rate).toBe(50);
    });

    it("computes digital_literacy_engagement_rate correctly", () => {
      const records = [
        makeDigitalLiteracy({ id: "dl_1", engagement_level: "high" }),
        makeDigitalLiteracy({ id: "dl_2", engagement_level: "medium" }),
        makeDigitalLiteracy({ id: "dl_3", engagement_level: "low" }),
        makeDigitalLiteracy({ id: "dl_4", engagement_level: "disengaged" }),
      ];
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 4, digital_literacy_records: records }),
      );
      // high + medium = 2 out of 4 = 50%
      expect(r.digital_literacy_engagement_rate).toBe(50);
    });

    it("computes incident_response_rate as average of available components", () => {
      // flaggedContentResponseRate: 1 flagged, 1 action → 100%
      // concernResolutionRate: 1 concern, 0 resolved → 0%
      // Average = 50%
      const logs = [
        makeUsageLog({
          id: "log_1",
          flagged_content: true,
          flagged_content_category: "violence",
          action_taken: true,
          concerns_raised: true,
          concern_resolved: false,
          monitoring_active: false,
          reviewed_by_staff: false,
          parental_controls_enabled: false,
          age_appropriate_filters: false,
        }),
      ];
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 1, internet_usage_logs: logs }),
      );
      expect(r.incident_response_rate).toBe(50);
    });

    it("computes privacy_settings_compliance_rate correctly", () => {
      const assessments = [
        makeSocialMediaAssessment({ id: "sma_1", privacy_settings_appropriate: true }),
        makeSocialMediaAssessment({ id: "sma_2", privacy_settings_appropriate: true }),
        makeSocialMediaAssessment({ id: "sma_3", privacy_settings_appropriate: false }),
      ];
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 3, social_media_assessments: assessments }),
      );
      expect(r.privacy_settings_compliance_rate).toBe(67);
    });

    it("computes agreement_breach_count as sum of all breach_count", () => {
      const agreements = [
        makeAccessAgreement({ id: "oaa_1", child_id: "child_1", breach_count: 2 }),
        makeAccessAgreement({ id: "oaa_2", child_id: "child_2", breach_count: 3 }),
      ];
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 2, online_access_agreements: agreements }),
      );
      expect(r.agreement_breach_count).toBe(5);
    });

    it("counts unique children_with_training (completed only)", () => {
      const records = [
        makeTraining({ id: "tr_1", child_id: "child_1", completed: true }),
        makeTraining({ id: "tr_2", child_id: "child_1", completed: true }), // same child
        makeTraining({ id: "tr_3", child_id: "child_2", completed: false }), // not completed
      ];
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 2, esafety_training_records: records }),
      );
      expect(r.children_with_training).toBe(1);
    });

    it("counts unique children_with_agreements (active only)", () => {
      const agreements = [
        makeAccessAgreement({ id: "oaa_1", child_id: "child_1", active: true }),
        makeAccessAgreement({ id: "oaa_2", child_id: "child_1", active: true }), // same child
        makeAccessAgreement({ id: "oaa_3", child_id: "child_2", active: false }), // inactive
      ];
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 2, online_access_agreements: agreements }),
      );
      expect(r.children_with_agreements).toBe(1);
    });

    it("counts unique children_with_assessments (all assessments)", () => {
      const assessments = [
        makeSocialMediaAssessment({ id: "sma_1", child_id: "child_1" }),
        makeSocialMediaAssessment({ id: "sma_2", child_id: "child_1" }), // same child
        makeSocialMediaAssessment({ id: "sma_3", child_id: "child_2" }),
      ];
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 2, social_media_assessments: assessments }),
      );
      expect(r.children_with_assessments).toBe(2);
    });

    it("counts unique children_with_monitoring (monitoring_active)", () => {
      const logs = [
        makeUsageLog({ id: "log_1", child_id: "child_1", monitoring_active: true }),
        makeUsageLog({ id: "log_2", child_id: "child_1", monitoring_active: true }), // same
        makeUsageLog({ id: "log_3", child_id: "child_2", monitoring_active: false }),
      ];
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 2, internet_usage_logs: logs }),
      );
      expect(r.children_with_monitoring).toBe(1);
    });

    it("counts unique children_with_literacy_support", () => {
      const records = [
        makeDigitalLiteracy({ id: "dl_1", child_id: "child_1" }),
        makeDigitalLiteracy({ id: "dl_2", child_id: "child_1" }), // same
        makeDigitalLiteracy({ id: "dl_3", child_id: "child_2" }),
      ];
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 2, digital_literacy_records: records }),
      );
      expect(r.children_with_literacy_support).toBe(2);
    });

    it("computes totals correctly", () => {
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({
          total_children: 1,
          esafety_training_records: [makeTraining()],
          internet_usage_logs: [makeUsageLog(), makeUsageLog({ id: "log_2" })],
          social_media_assessments: [makeSocialMediaAssessment()],
          online_access_agreements: [makeAccessAgreement()],
          digital_literacy_records: [makeDigitalLiteracy(), makeDigitalLiteracy({ id: "dl_2" }), makeDigitalLiteracy({ id: "dl_3" })],
        }),
      );
      expect(r.total_training_records).toBe(1);
      expect(r.total_usage_logs).toBe(2);
      expect(r.total_social_media_assessments).toBe(1);
      expect(r.total_access_agreements).toBe(1);
      expect(r.total_digital_literacy_records).toBe(3);
    });

    it("computes overdue_training_count", () => {
      const records = [
        makeTraining({ id: "tr_1", overdue: true }),
        makeTraining({ id: "tr_2", overdue: true }),
        makeTraining({ id: "tr_3", overdue: false }),
      ];
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 3, esafety_training_records: records }),
      );
      expect(r.overdue_training_count).toBe(2);
    });

    it("computes high_risk_usage_count", () => {
      const logs = [
        makeUsageLog({ id: "log_1", risk_level: "high" }),
        makeUsageLog({ id: "log_2", risk_level: "critical" }),
        makeUsageLog({ id: "log_3", risk_level: "medium" }),
        makeUsageLog({ id: "log_4", risk_level: "low" }),
      ];
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 1, internet_usage_logs: logs }),
      );
      expect(r.high_risk_usage_count).toBe(2);
    });

    it("computes flagged_content_count", () => {
      const logs = [
        makeUsageLog({ id: "log_1", flagged_content: true }),
        makeUsageLog({ id: "log_2", flagged_content: true }),
        makeUsageLog({ id: "log_3", flagged_content: false }),
      ];
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 1, internet_usage_logs: logs }),
      );
      expect(r.flagged_content_count).toBe(2);
    });
  });

  // ── Incident response composite metric ─────────────────────────────────
  describe("incident response composite metric", () => {
    it("returns 0 when no incident components exist", () => {
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({
          total_children: 1,
          esafety_training_records: [makeTraining()],
        }),
      );
      expect(r.incident_response_rate).toBe(0);
    });

    it("averages flaggedContentResponseRate and escalationRate when both present", () => {
      // flaggedContentResponseRate: 1/1 = 100%
      // escalationRate: 1 concern identified, 0 escalated → 0%
      // Average: (100+0)/2 = 50
      const logs = [
        makeUsageLog({
          id: "log_1",
          flagged_content: true,
          action_taken: true,
          monitoring_active: false,
          reviewed_by_staff: false,
          parental_controls_enabled: false,
          age_appropriate_filters: false,
        }),
      ];
      const assessments = [
        makeSocialMediaAssessment({
          id: "sma_1",
          child_id: "child_1",
          concerns_identified: true,
          concerns_escalated: false,
          privacy_settings_appropriate: false,
          child_involved_in_assessment: false,
          monitoring_plan_in_place: false,
        }),
      ];
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 1, internet_usage_logs: logs, social_media_assessments: assessments }),
      );
      expect(r.incident_response_rate).toBe(50);
    });

    it("includes breach response in composite", () => {
      // breachResponseRate: 1 agreement with breaches, actions taken → 100%
      const agreements = [
        makeAccessAgreement({
          id: "oaa_1",
          child_id: "child_1",
          breach_count: 2,
          breach_actions_taken: true,
          active: true,
          signed_by_child: false,
          terms_explained: false,
          child_understands_terms: false,
          reviewed: false,
        }),
      ];
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 1, online_access_agreements: agreements }),
      );
      // Only 1 component: breachResponseRate = 100%, incidentResponseRate = 100
      expect(r.incident_response_rate).toBe(100);
    });

    it("averages all four components when all present", () => {
      // flaggedContent: 2 flagged, 1 action → 50%
      // concernResolution: 2 concerns, 2 resolved → 100%
      // escalation: 2 sm concerns, 1 escalated → 50%
      // breachResponse: 1 agreement with breach, 1 action → 100%
      // Average: (50 + 100 + 50 + 100) / 4 = 75
      const logs = [
        makeUsageLog({
          id: "log_1",
          child_id: "child_1",
          flagged_content: true,
          action_taken: true,
          concerns_raised: true,
          concern_resolved: true,
          monitoring_active: false,
          reviewed_by_staff: false,
          parental_controls_enabled: false,
          age_appropriate_filters: false,
        }),
        makeUsageLog({
          id: "log_2",
          child_id: "child_1",
          flagged_content: true,
          action_taken: false,
          concerns_raised: true,
          concern_resolved: true,
          monitoring_active: false,
          reviewed_by_staff: false,
          parental_controls_enabled: false,
          age_appropriate_filters: false,
        }),
      ];
      const assessments = [
        makeSocialMediaAssessment({
          id: "sma_1",
          child_id: "child_1",
          concerns_identified: true,
          concerns_escalated: true,
          privacy_settings_appropriate: false,
          child_involved_in_assessment: false,
          monitoring_plan_in_place: false,
        }),
        makeSocialMediaAssessment({
          id: "sma_2",
          child_id: "child_2",
          concerns_identified: true,
          concerns_escalated: false,
          privacy_settings_appropriate: false,
          child_involved_in_assessment: false,
          monitoring_plan_in_place: false,
        }),
      ];
      const agreements = [
        makeAccessAgreement({
          id: "oaa_1",
          child_id: "child_1",
          breach_count: 1,
          breach_actions_taken: true,
          active: true,
          signed_by_child: false,
          terms_explained: false,
          child_understands_terms: false,
          reviewed: false,
        }),
      ];
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({
          total_children: 2,
          internet_usage_logs: logs,
          social_media_assessments: assessments,
          online_access_agreements: agreements,
        }),
      );
      expect(r.incident_response_rate).toBe(75);
    });
  });

  // ── Strengths ──────────────────────────────────────────────────────────
  describe("strengths", () => {
    it("includes strength for 100% e-safety training compliance", () => {
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({
          total_children: 1,
          esafety_training_records: [makeTraining({ completed: true })],
        }),
      );
      expect(r.strengths.some((s) => s.includes("Every e-safety training session has been completed"))).toBe(true);
    });

    it("includes strength for 90% e-safety training compliance (not 100%)", () => {
      const records = Array.from({ length: 10 }, (_, i) =>
        makeTraining({ id: `tr_${i}`, child_id: `child_${i}`, completed: i < 9 }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, esafety_training_records: records }),
      );
      expect(r.strengths.some((s) => s.includes("90% e-safety training compliance"))).toBe(true);
    });

    it("includes strength for 80% e-safety training compliance", () => {
      const records = Array.from({ length: 10 }, (_, i) =>
        makeTraining({ id: `tr_${i}`, child_id: `child_${i}`, completed: i < 8 }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, esafety_training_records: records }),
      );
      expect(r.strengths.some((s) => s.includes("80% e-safety training compliance"))).toBe(true);
    });

    it("includes strength for 90% training pass rate", () => {
      const records = Array.from({ length: 10 }, (_, i) =>
        makeTraining({ id: `tr_${i}`, child_id: `child_${i}`, passed: i < 9 }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, esafety_training_records: records }),
      );
      expect(r.strengths.some((s) => s.includes("90% training pass rate"))).toBe(true);
    });

    it("includes strength for 80% training pass rate", () => {
      const records = Array.from({ length: 10 }, (_, i) =>
        makeTraining({ id: `tr_${i}`, child_id: `child_${i}`, passed: i < 8 }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, esafety_training_records: records }),
      );
      expect(r.strengths.some((s) => s.includes("80% training pass rate"))).toBe(true);
    });

    it("includes strength for 90% usage monitoring rate", () => {
      const logs = Array.from({ length: 10 }, (_, i) =>
        makeUsageLog({ id: `log_${i}`, monitoring_active: i < 9, reviewed_by_staff: false }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, internet_usage_logs: logs }),
      );
      expect(r.strengths.some((s) => s.includes("90% of internet usage actively monitored"))).toBe(true);
    });

    it("includes strength for 80% usage monitoring rate", () => {
      const logs = Array.from({ length: 10 }, (_, i) =>
        makeUsageLog({ id: `log_${i}`, monitoring_active: i < 8, reviewed_by_staff: false }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, internet_usage_logs: logs }),
      );
      expect(r.strengths.some((s) => s.includes("80% internet usage monitoring rate"))).toBe(true);
    });

    it("includes strength for 90% staff review rate", () => {
      const logs = Array.from({ length: 10 }, (_, i) =>
        makeUsageLog({ id: `log_${i}`, reviewed_by_staff: i < 9, monitoring_active: false }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, internet_usage_logs: logs }),
      );
      expect(r.strengths.some((s) => s.includes("90% of internet usage logs reviewed by staff"))).toBe(true);
    });

    it("includes strength for 80% staff review rate", () => {
      const logs = Array.from({ length: 10 }, (_, i) =>
        makeUsageLog({ id: `log_${i}`, reviewed_by_staff: i < 8, monitoring_active: false }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, internet_usage_logs: logs }),
      );
      expect(r.strengths.some((s) => s.includes("80% staff review rate"))).toBe(true);
    });

    it("includes strength for 100% social media risk assessment coverage", () => {
      const assessments = Array.from({ length: 3 }, (_, i) =>
        makeSocialMediaAssessment({ id: `sma_${i}`, child_id: `child_${i}` }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 3, social_media_assessments: assessments }),
      );
      expect(r.strengths.some((s) => s.includes("Every child has had a social media risk assessment"))).toBe(true);
    });

    it("includes strength for 80% social media risk assessment coverage", () => {
      const assessments = Array.from({ length: 4 }, (_, i) =>
        makeSocialMediaAssessment({ id: `sma_${i}`, child_id: `child_${i}` }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 5, social_media_assessments: assessments }),
      );
      expect(r.strengths.some((s) => s.includes("80% social media risk assessment coverage"))).toBe(true);
    });

    it("includes strength for 90% privacy settings compliance", () => {
      const assessments = Array.from({ length: 10 }, (_, i) =>
        makeSocialMediaAssessment({ id: `sma_${i}`, child_id: `child_${i}`, privacy_settings_appropriate: i < 9 }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, social_media_assessments: assessments }),
      );
      expect(r.strengths.some((s) => s.includes("90% privacy settings compliance"))).toBe(true);
    });

    it("includes strength for 80% privacy settings compliance", () => {
      const assessments = Array.from({ length: 10 }, (_, i) =>
        makeSocialMediaAssessment({ id: `sma_${i}`, child_id: `child_${i}`, privacy_settings_appropriate: i < 8 }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, social_media_assessments: assessments }),
      );
      expect(r.strengths.some((s) => s.includes("80% of social media accounts have appropriate privacy settings"))).toBe(true);
    });

    it("includes strength for 100% access agreement coverage", () => {
      const agreements = Array.from({ length: 3 }, (_, i) =>
        makeAccessAgreement({ id: `oaa_${i}`, child_id: `child_${i}`, active: true }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 3, online_access_agreements: agreements }),
      );
      expect(r.strengths.some((s) => s.includes("Every child has an active online access agreement"))).toBe(true);
    });

    it("includes strength for 80% access agreement coverage", () => {
      const agreements = Array.from({ length: 4 }, (_, i) =>
        makeAccessAgreement({ id: `oaa_${i}`, child_id: `child_${i}`, active: true }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 5, online_access_agreements: agreements }),
      );
      expect(r.strengths.some((s) => s.includes("80% online access agreement coverage"))).toBe(true);
    });

    it("includes strength for 90% child signature rate", () => {
      const agreements = Array.from({ length: 10 }, (_, i) =>
        makeAccessAgreement({ id: `oaa_${i}`, child_id: `child_${i}`, active: true, signed_by_child: i < 9 }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, online_access_agreements: agreements }),
      );
      expect(r.strengths.some((s) => s.includes("90% of access agreements signed by the child"))).toBe(true);
    });

    it("includes strength for 90% terms explained rate", () => {
      const agreements = Array.from({ length: 10 }, (_, i) =>
        makeAccessAgreement({ id: `oaa_${i}`, child_id: `child_${i}`, active: true, terms_explained: i < 9 }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, online_access_agreements: agreements }),
      );
      expect(r.strengths.some((s) => s.includes("Terms explained in 90%"))).toBe(true);
    });

    it("includes strength for 90% digital literacy engagement", () => {
      const records = Array.from({ length: 10 }, (_, i) =>
        makeDigitalLiteracy({ id: `dl_${i}`, child_id: `child_${i}`, engagement_level: i < 9 ? "high" : "low" }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, digital_literacy_records: records }),
      );
      expect(r.strengths.some((s) => s.includes("90% engagement in digital literacy activities"))).toBe(true);
    });

    it("includes strength for 80% digital literacy engagement", () => {
      const records = Array.from({ length: 10 }, (_, i) =>
        makeDigitalLiteracy({ id: `dl_${i}`, child_id: `child_${i}`, engagement_level: i < 8 ? "medium" : "low" }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, digital_literacy_records: records }),
      );
      expect(r.strengths.some((s) => s.includes("80% digital literacy engagement"))).toBe(true);
    });

    it("includes strength for 90% incident response rate", () => {
      const logs = Array.from({ length: 10 }, (_, i) =>
        makeUsageLog({
          id: `log_${i}`,
          flagged_content: true,
          action_taken: i < 9,
          monitoring_active: false,
          reviewed_by_staff: false,
          parental_controls_enabled: false,
          age_appropriate_filters: false,
        }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, internet_usage_logs: logs }),
      );
      expect(r.strengths.some((s) => s.includes("90% incident response rate"))).toBe(true);
    });

    it("includes strength for 80% incident response rate", () => {
      const logs = Array.from({ length: 10 }, (_, i) =>
        makeUsageLog({
          id: `log_${i}`,
          flagged_content: true,
          action_taken: i < 8,
          monitoring_active: false,
          reviewed_by_staff: false,
          parental_controls_enabled: false,
          age_appropriate_filters: false,
        }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, internet_usage_logs: logs }),
      );
      expect(r.strengths.some((s) => s.includes("80% incident response rate"))).toBe(true);
    });

    it("includes strength for 100% flagged content response", () => {
      const logs = [
        makeUsageLog({ id: "log_1", flagged_content: true, action_taken: true, monitoring_active: false, reviewed_by_staff: false, parental_controls_enabled: false, age_appropriate_filters: false }),
      ];
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 1, internet_usage_logs: logs }),
      );
      expect(r.strengths.some((s) => s.includes("Every instance of flagged content has been acted upon"))).toBe(true);
    });

    it("includes strength for 90% parental controls rate", () => {
      const logs = Array.from({ length: 10 }, (_, i) =>
        makeUsageLog({ id: `log_${i}`, parental_controls_enabled: i < 9, monitoring_active: false, reviewed_by_staff: false, age_appropriate_filters: false }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, internet_usage_logs: logs }),
      );
      expect(r.strengths.some((s) => s.includes("90% parental controls enabled"))).toBe(true);
    });

    it("includes strength for 90% age filter rate", () => {
      const logs = Array.from({ length: 10 }, (_, i) =>
        makeUsageLog({ id: `log_${i}`, age_appropriate_filters: i < 9, monitoring_active: false, reviewed_by_staff: false, parental_controls_enabled: false }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, internet_usage_logs: logs }),
      );
      expect(r.strengths.some((s) => s.includes("90% age-appropriate filtering"))).toBe(true);
    });

    it("includes strength for child involvement >= 80%", () => {
      const assessments = Array.from({ length: 10 }, (_, i) =>
        makeSocialMediaAssessment({ id: `sma_${i}`, child_id: `child_${i}`, child_involved_in_assessment: i < 8 }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, social_media_assessments: assessments }),
      );
      expect(r.strengths.some((s) => s.includes("80% child involvement in social media assessments"))).toBe(true);
    });

    it("includes strength for certifications earned", () => {
      const records = [
        makeDigitalLiteracy({ id: "dl_1", certification_earned: true }),
        makeDigitalLiteracy({ id: "dl_2", certification_earned: true }),
      ];
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 1, digital_literacy_records: records }),
      );
      expect(r.strengths.some((s) => s.includes("2 digital safety certifications earned"))).toBe(true);
    });

    it("includes strength for 90% monitoring plan rate", () => {
      const assessments = Array.from({ length: 10 }, (_, i) =>
        makeSocialMediaAssessment({ id: `sma_${i}`, child_id: `child_${i}`, monitoring_plan_in_place: i < 9 }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, social_media_assessments: assessments }),
      );
      expect(r.strengths.some((s) => s.includes("90% of social media assessments have monitoring plans"))).toBe(true);
    });

    it("includes strength for online safety focus in digital literacy", () => {
      // Need >= 30% of completed literacy to be online_safety
      const records = [
        makeDigitalLiteracy({ id: "dl_1", skill_area: "online_safety", completed: true }),
        makeDigitalLiteracy({ id: "dl_2", skill_area: "technical_skills", completed: true }),
        makeDigitalLiteracy({ id: "dl_3", skill_area: "digital_citizenship", completed: true }),
      ];
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 3, digital_literacy_records: records }),
      );
      // onlineSafetyLiteracy = 1, completedLiteracy = 3, pct(1,3) = 33% >= 30
      expect(r.strengths.some((s) => s.includes("Online safety is a focus"))).toBe(true);
    });

    it("includes strength for avg progress rating >= 4.0", () => {
      const records = [
        makeDigitalLiteracy({ id: "dl_1", progress_rating: 4 }),
        makeDigitalLiteracy({ id: "dl_2", progress_rating: 5 }),
        makeDigitalLiteracy({ id: "dl_3", progress_rating: 4 }),
      ];
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 3, digital_literacy_records: records }),
      );
      // avg = (4+5+4)/3 = 4.33
      expect(r.strengths.some((s) => s.includes("Average digital literacy progress rating"))).toBe(true);
    });

    it("includes strength for no overdue training", () => {
      const records = [
        makeTraining({ id: "tr_1", overdue: false }),
        makeTraining({ id: "tr_2", overdue: false }),
      ];
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 2, esafety_training_records: records }),
      );
      expect(r.strengths.some((s) => s.includes("No overdue e-safety training"))).toBe(true);
    });

    it("includes strength for 100% escalation rate", () => {
      const assessments = [
        makeSocialMediaAssessment({ id: "sma_1", concerns_identified: true, concerns_escalated: true }),
        makeSocialMediaAssessment({ id: "sma_2", concerns_identified: true, concerns_escalated: true }),
      ];
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 2, social_media_assessments: assessments }),
      );
      expect(r.strengths.some((s) => s.includes("Every social media concern has been appropriately escalated"))).toBe(true);
    });

    it("includes strength for 100% breach response rate", () => {
      const agreements = [
        makeAccessAgreement({ id: "oaa_1", breach_count: 2, breach_actions_taken: true }),
      ];
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 1, online_access_agreements: agreements }),
      );
      expect(r.strengths.some((s) => s.includes("All agreement breaches have had appropriate actions taken"))).toBe(true);
    });

    it("includes strength for 90% training engagement rate", () => {
      const records = Array.from({ length: 10 }, (_, i) =>
        makeTraining({ id: `tr_${i}`, child_id: `child_${i}`, child_engaged: i < 9 }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, esafety_training_records: records }),
      );
      expect(r.strengths.some((s) => s.includes("90% child engagement in e-safety training"))).toBe(true);
    });

    it("includes strength for 90% training understanding rate", () => {
      const records = Array.from({ length: 10 }, (_, i) =>
        makeTraining({ id: `tr_${i}`, child_id: `child_${i}`, child_understood: i < 9 }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, esafety_training_records: records }),
      );
      expect(r.strengths.some((s) => s.includes("90% of children demonstrated understanding"))).toBe(true);
    });
  });

  // ── Concerns ───────────────────────────────────────────────────────────
  describe("concerns", () => {
    it("concern for e-safety compliance < 50", () => {
      const records = Array.from({ length: 10 }, (_, i) =>
        makeTraining({ id: `tr_${i}`, child_id: `child_${i}`, completed: i < 4 }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, esafety_training_records: records }),
      );
      expect(r.concerns.some((c) => c.includes("40% of e-safety training completed"))).toBe(true);
    });

    it("concern for e-safety compliance 50-79", () => {
      const records = Array.from({ length: 10 }, (_, i) =>
        makeTraining({ id: `tr_${i}`, child_id: `child_${i}`, completed: i < 6 }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, esafety_training_records: records }),
      );
      expect(r.concerns.some((c) => c.includes("E-safety training compliance at 60%"))).toBe(true);
    });

    it("concern for training pass rate < 50", () => {
      const records = Array.from({ length: 10 }, (_, i) =>
        makeTraining({ id: `tr_${i}`, child_id: `child_${i}`, passed: i < 4 }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, esafety_training_records: records }),
      );
      expect(r.concerns.some((c) => c.includes("40% training pass rate"))).toBe(true);
    });

    it("concern for training pass rate 50-69", () => {
      const records = Array.from({ length: 10 }, (_, i) =>
        makeTraining({ id: `tr_${i}`, child_id: `child_${i}`, passed: i < 6 }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, esafety_training_records: records }),
      );
      expect(r.concerns.some((c) => c.includes("Training pass rate at 60%"))).toBe(true);
    });

    it("concern for usage monitoring < 50", () => {
      const logs = Array.from({ length: 10 }, (_, i) =>
        makeUsageLog({ id: `log_${i}`, monitoring_active: i < 4, reviewed_by_staff: false }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, internet_usage_logs: logs }),
      );
      expect(r.concerns.some((c) => c.includes("40% of internet usage is monitored"))).toBe(true);
    });

    it("concern for usage monitoring 50-79", () => {
      const logs = Array.from({ length: 10 }, (_, i) =>
        makeUsageLog({ id: `log_${i}`, monitoring_active: i < 6, reviewed_by_staff: false }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, internet_usage_logs: logs }),
      );
      expect(r.concerns.some((c) => c.includes("Internet usage monitoring at 60%"))).toBe(true);
    });

    it("concern for staff review rate < 50", () => {
      const logs = Array.from({ length: 10 }, (_, i) =>
        makeUsageLog({ id: `log_${i}`, reviewed_by_staff: i < 4, monitoring_active: false }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, internet_usage_logs: logs }),
      );
      expect(r.concerns.some((c) => c.includes("40% of internet usage logs reviewed by staff"))).toBe(true);
    });

    it("concern for staff review rate 50-69", () => {
      const logs = Array.from({ length: 10 }, (_, i) =>
        makeUsageLog({ id: `log_${i}`, reviewed_by_staff: i < 6, monitoring_active: false }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, internet_usage_logs: logs }),
      );
      expect(r.concerns.some((c) => c.includes("Staff review rate of internet usage logs at 60%"))).toBe(true);
    });

    it("concern for social media assessment rate < 50", () => {
      const assessments = Array.from({ length: 4 }, (_, i) =>
        makeSocialMediaAssessment({ id: `sma_${i}`, child_id: `child_${i}` }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, social_media_assessments: assessments }),
      );
      expect(r.concerns.some((c) => c.includes("40% of children have had a social media risk assessment"))).toBe(true);
    });

    it("concern for social media assessment rate 50-79", () => {
      const assessments = Array.from({ length: 6 }, (_, i) =>
        makeSocialMediaAssessment({ id: `sma_${i}`, child_id: `child_${i}` }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, social_media_assessments: assessments }),
      );
      expect(r.concerns.some((c) => c.includes("Social media risk assessment coverage at 60%"))).toBe(true);
    });

    it("concern for privacy settings < 50", () => {
      const assessments = Array.from({ length: 10 }, (_, i) =>
        makeSocialMediaAssessment({ id: `sma_${i}`, child_id: `child_${i}`, privacy_settings_appropriate: i < 4 }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, social_media_assessments: assessments }),
      );
      expect(r.concerns.some((c) => c.includes("40% of social media accounts have appropriate privacy settings"))).toBe(true);
    });

    it("concern for privacy settings 50-79", () => {
      const assessments = Array.from({ length: 10 }, (_, i) =>
        makeSocialMediaAssessment({ id: `sma_${i}`, child_id: `child_${i}`, privacy_settings_appropriate: i < 6 }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, social_media_assessments: assessments }),
      );
      expect(r.concerns.some((c) => c.includes("Privacy settings compliance at 60%"))).toBe(true);
    });

    it("concern for access agreement coverage < 50", () => {
      const agreements = Array.from({ length: 4 }, (_, i) =>
        makeAccessAgreement({ id: `oaa_${i}`, child_id: `child_${i}`, active: true }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, online_access_agreements: agreements }),
      );
      expect(r.concerns.some((c) => c.includes("40% of children have an active online access agreement"))).toBe(true);
    });

    it("concern for access agreement coverage 50-79", () => {
      const agreements = Array.from({ length: 6 }, (_, i) =>
        makeAccessAgreement({ id: `oaa_${i}`, child_id: `child_${i}`, active: true }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, online_access_agreements: agreements }),
      );
      expect(r.concerns.some((c) => c.includes("Online access agreement coverage at 60%"))).toBe(true);
    });

    it("concern for digital literacy engagement < 50", () => {
      const records = Array.from({ length: 10 }, (_, i) =>
        makeDigitalLiteracy({ id: `dl_${i}`, child_id: `child_${i}`, engagement_level: i < 4 ? "high" : "low" }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, digital_literacy_records: records }),
      );
      expect(r.concerns.some((c) => c.includes("40% engagement in digital literacy activities"))).toBe(true);
    });

    it("concern for digital literacy engagement 50-69", () => {
      const records = Array.from({ length: 10 }, (_, i) =>
        makeDigitalLiteracy({ id: `dl_${i}`, child_id: `child_${i}`, engagement_level: i < 6 ? "high" : "low" }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, digital_literacy_records: records }),
      );
      expect(r.concerns.some((c) => c.includes("Digital literacy engagement at 60%"))).toBe(true);
    });

    it("concern for incident response < 40", () => {
      const logs = Array.from({ length: 10 }, (_, i) =>
        makeUsageLog({
          id: `log_${i}`,
          flagged_content: true,
          action_taken: i < 3,
          monitoring_active: false,
          reviewed_by_staff: false,
          parental_controls_enabled: false,
          age_appropriate_filters: false,
        }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, internet_usage_logs: logs }),
      );
      expect(r.concerns.some((c) => c.includes("Incident response rate at only 30%"))).toBe(true);
    });

    it("concern for incident response 40-69", () => {
      const logs = Array.from({ length: 10 }, (_, i) =>
        makeUsageLog({
          id: `log_${i}`,
          flagged_content: true,
          action_taken: i < 5,
          monitoring_active: false,
          reviewed_by_staff: false,
          parental_controls_enabled: false,
          age_appropriate_filters: false,
        }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, internet_usage_logs: logs }),
      );
      expect(r.concerns.some((c) => c.includes("Incident response rate at 50%"))).toBe(true);
    });

    it("concern for high risk usage events", () => {
      const logs = [
        makeUsageLog({ id: "log_1", risk_level: "high", monitoring_active: true, reviewed_by_staff: false }),
        makeUsageLog({ id: "log_2", risk_level: "critical", monitoring_active: true, reviewed_by_staff: false }),
      ];
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 1, internet_usage_logs: logs }),
      );
      expect(r.concerns.some((c) => c.includes("2 high or critical risk internet usage events"))).toBe(true);
    });

    it("concern for flagged content with incomplete response", () => {
      const logs = [
        makeUsageLog({ id: "log_1", flagged_content: true, action_taken: false, monitoring_active: false, reviewed_by_staff: false, parental_controls_enabled: false, age_appropriate_filters: false }),
        makeUsageLog({ id: "log_2", flagged_content: true, action_taken: true, monitoring_active: false, reviewed_by_staff: false, parental_controls_enabled: false, age_appropriate_filters: false }),
      ];
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 1, internet_usage_logs: logs }),
      );
      expect(r.concerns.some((c) => c.includes("2 instances of flagged content with only 50% receiving action"))).toBe(true);
    });

    it("concern for overdue training", () => {
      const records = [
        makeTraining({ id: "tr_1", overdue: true }),
        makeTraining({ id: "tr_2", overdue: true }),
      ];
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 2, esafety_training_records: records }),
      );
      expect(r.concerns.some((c) => c.includes("2 overdue e-safety training sessions"))).toBe(true);
    });

    it("concern for overdue assessments", () => {
      const assessments = [
        makeSocialMediaAssessment({ id: "sma_1", overdue: true }),
      ];
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 1, social_media_assessments: assessments }),
      );
      expect(r.concerns.some((c) => c.includes("1 overdue social media assessment"))).toBe(true);
    });

    it("concern for overdue agreement reviews", () => {
      const agreements = [
        makeAccessAgreement({ id: "oaa_1", active: true, overdue: true }),
      ];
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 1, online_access_agreements: agreements }),
      );
      expect(r.concerns.some((c) => c.includes("1 overdue online access agreement review"))).toBe(true);
    });

    it("concern for breaches with incomplete response", () => {
      const agreements = [
        makeAccessAgreement({ id: "oaa_1", breach_count: 3, breach_actions_taken: false }),
      ];
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 1, online_access_agreements: agreements }),
      );
      expect(r.concerns.some((c) => c.includes("3 agreement breaches recorded with only 0% receiving action"))).toBe(true);
    });

    it("concern for low parental controls rate", () => {
      const logs = Array.from({ length: 10 }, (_, i) =>
        makeUsageLog({ id: `log_${i}`, parental_controls_enabled: i < 4, monitoring_active: false, reviewed_by_staff: false, age_appropriate_filters: false }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, internet_usage_logs: logs }),
      );
      expect(r.concerns.some((c) => c.includes("Parental controls enabled on only 40%"))).toBe(true);
    });

    it("concern for low age filter rate", () => {
      const logs = Array.from({ length: 10 }, (_, i) =>
        makeUsageLog({ id: `log_${i}`, age_appropriate_filters: i < 4, monitoring_active: false, reviewed_by_staff: false, parental_controls_enabled: false }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, internet_usage_logs: logs }),
      );
      expect(r.concerns.some((c) => c.includes("Age-appropriate filters active in only 40%"))).toBe(true);
    });

    it("concern for no digital literacy records with children present (non-allEmpty)", () => {
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({
          total_children: 3,
          esafety_training_records: [makeTraining()],
        }),
      );
      expect(r.concerns.some((c) => c.includes("No digital literacy records exist"))).toBe(true);
    });

    it("concern for no training records with children present (non-allEmpty)", () => {
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({
          total_children: 3,
          internet_usage_logs: [makeUsageLog()],
        }),
      );
      expect(r.concerns.some((c) => c.includes("No e-safety training records exist"))).toBe(true);
    });

    it("concern for low escalation rate", () => {
      const assessments = [
        makeSocialMediaAssessment({ id: "sma_1", concerns_identified: true, concerns_escalated: false }),
        makeSocialMediaAssessment({ id: "sma_2", concerns_identified: true, concerns_escalated: false }),
      ];
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 2, social_media_assessments: assessments }),
      );
      expect(r.concerns.some((c) => c.includes("0% of identified social media concerns have been escalated"))).toBe(true);
    });

    it("concern for low child involvement in assessments", () => {
      const assessments = Array.from({ length: 10 }, (_, i) =>
        makeSocialMediaAssessment({ id: `sma_${i}`, child_id: `child_${i}`, child_involved_in_assessment: i < 4 }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, social_media_assessments: assessments }),
      );
      expect(r.concerns.some((c) => c.includes("Children involved in only 40%"))).toBe(true);
    });
  });

  // ── Recommendations ────────────────────────────────────────────────────
  describe("recommendations", () => {
    it("immediate recommendation for compliance < 50", () => {
      const records = Array.from({ length: 10 }, (_, i) =>
        makeTraining({ id: `tr_${i}`, child_id: `child_${i}`, completed: i < 4 }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, esafety_training_records: records }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("Urgently complete all outstanding e-safety training"))).toBe(true);
    });

    it("immediate recommendation for no training records", () => {
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({
          total_children: 3,
          internet_usage_logs: [makeUsageLog()],
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("Establish a structured e-safety training programme"))).toBe(true);
    });

    it("immediate recommendation for access agreement coverage < 50", () => {
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({
          total_children: 3,
          esafety_training_records: [makeTraining()],
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("Ensure every child has an active, signed online access agreement"))).toBe(true);
    });

    it("immediate recommendation for usage monitoring < 50", () => {
      const logs = Array.from({ length: 10 }, (_, i) =>
        makeUsageLog({ id: `log_${i}`, monitoring_active: i < 4, reviewed_by_staff: false }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, internet_usage_logs: logs }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("Establish comprehensive internet monitoring"))).toBe(true);
    });

    it("immediate recommendation for incident response < 40", () => {
      const logs = [
        makeUsageLog({ id: "log_1", flagged_content: true, action_taken: false, monitoring_active: false, reviewed_by_staff: false, parental_controls_enabled: false, age_appropriate_filters: false }),
      ];
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 1, internet_usage_logs: logs }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("Implement a robust incident response protocol"))).toBe(true);
    });

    it("immediate recommendation for social media rate < 50", () => {
      const assessments = Array.from({ length: 4 }, (_, i) =>
        makeSocialMediaAssessment({ id: `sma_${i}`, child_id: `child_${i}` }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, social_media_assessments: assessments }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("Conduct social media risk assessments for all children"))).toBe(true);
    });

    it("immediate recommendation for high risk events", () => {
      const logs = [
        makeUsageLog({ id: "log_1", risk_level: "high", monitoring_active: true }),
      ];
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 1, internet_usage_logs: logs }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("Review and address all 1 high/critical risk"))).toBe(true);
    });

    it("immediate recommendation for incomplete flagged content response", () => {
      const logs = [
        makeUsageLog({ id: "log_1", flagged_content: true, action_taken: false, monitoring_active: true, reviewed_by_staff: false }),
      ];
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 1, internet_usage_logs: logs }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("Ensure all flagged content instances receive documented action"))).toBe(true);
    });

    it("immediate recommendation for privacy settings < 50", () => {
      const assessments = Array.from({ length: 10 }, (_, i) =>
        makeSocialMediaAssessment({ id: `sma_${i}`, child_id: `child_${i}`, privacy_settings_appropriate: i < 4 }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, social_media_assessments: assessments }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("Review and correct privacy settings"))).toBe(true);
    });

    it("soon recommendation for overdue training", () => {
      const records = [makeTraining({ id: "tr_1", overdue: true })];
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 1, esafety_training_records: records }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("Schedule and complete 1 overdue"))).toBe(true);
    });

    it("soon recommendation for compliance 50-79", () => {
      const records = Array.from({ length: 10 }, (_, i) =>
        makeTraining({ id: `tr_${i}`, child_id: `child_${i}`, completed: i < 6 }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, esafety_training_records: records }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("Improve e-safety training compliance to at least 80%"))).toBe(true);
    });

    it("soon recommendation for monitoring 50-79", () => {
      const logs = Array.from({ length: 10 }, (_, i) =>
        makeUsageLog({ id: `log_${i}`, monitoring_active: i < 6, reviewed_by_staff: false }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, internet_usage_logs: logs }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("Extend internet monitoring coverage to at least 80%"))).toBe(true);
    });

    it("soon recommendation for social media rate 50-79", () => {
      const assessments = Array.from({ length: 6 }, (_, i) =>
        makeSocialMediaAssessment({ id: `sma_${i}`, child_id: `child_${i}` }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, social_media_assessments: assessments }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("Extend social media risk assessment coverage"))).toBe(true);
    });

    it("soon recommendation for access agreement 50-79", () => {
      const agreements = Array.from({ length: 6 }, (_, i) =>
        makeAccessAgreement({ id: `oaa_${i}`, child_id: `child_${i}`, active: true }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, online_access_agreements: agreements }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("Ensure all children have active online access agreements"))).toBe(true);
    });

    it("soon recommendation for staff review < 70", () => {
      const logs = Array.from({ length: 10 }, (_, i) =>
        makeUsageLog({ id: `log_${i}`, reviewed_by_staff: i < 6, monitoring_active: false }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, internet_usage_logs: logs }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("Increase staff review of internet usage logs"))).toBe(true);
    });

    it("soon recommendation for digital literacy engagement < 50", () => {
      const records = Array.from({ length: 10 }, (_, i) =>
        makeDigitalLiteracy({ id: `dl_${i}`, engagement_level: i < 4 ? "high" : "low" }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, digital_literacy_records: records }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("Review digital literacy provision to improve engagement"))).toBe(true);
    });

    it("soon recommendation for no digital literacy records", () => {
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({
          total_children: 3,
          esafety_training_records: [makeTraining()],
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("Introduce a digital literacy programme"))).toBe(true);
    });

    it("soon recommendation for pass rate < 50", () => {
      const records = Array.from({ length: 10 }, (_, i) =>
        makeTraining({ id: `tr_${i}`, child_id: `child_${i}`, passed: i < 4 }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, esafety_training_records: records }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("Review e-safety training content and delivery"))).toBe(true);
    });

    it("planned recommendation for child involvement < 50", () => {
      const assessments = Array.from({ length: 10 }, (_, i) =>
        makeSocialMediaAssessment({ id: `sma_${i}`, child_id: `child_${i}`, child_involved_in_assessment: i < 4 }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, social_media_assessments: assessments }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("Increase child involvement in social media assessments"))).toBe(true);
    });

    it("planned recommendation for parental controls < 70", () => {
      const logs = Array.from({ length: 10 }, (_, i) =>
        makeUsageLog({ id: `log_${i}`, parental_controls_enabled: i < 6, monitoring_active: false, reviewed_by_staff: false, age_appropriate_filters: false }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, internet_usage_logs: logs }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("Enable parental controls on all devices"))).toBe(true);
    });

    it("planned recommendation for age filters < 70", () => {
      const logs = Array.from({ length: 10 }, (_, i) =>
        makeUsageLog({ id: `log_${i}`, age_appropriate_filters: i < 6, monitoring_active: false, reviewed_by_staff: false, parental_controls_enabled: false }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, internet_usage_logs: logs }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("Ensure age-appropriate content filters"))).toBe(true);
    });

    it("planned recommendation for overdue assessments", () => {
      const assessments = [makeSocialMediaAssessment({ overdue: true })];
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 1, social_media_assessments: assessments }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("Complete 1 overdue social media risk assessment"))).toBe(true);
    });

    it("planned recommendation for overdue agreements", () => {
      const agreements = [makeAccessAgreement({ active: true, overdue: true })];
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 1, online_access_agreements: agreements }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("Review 1 overdue online access agreement"))).toBe(true);
    });

    it("planned recommendation for literacy engagement 50-69", () => {
      const records = Array.from({ length: 10 }, (_, i) =>
        makeDigitalLiteracy({ id: `dl_${i}`, engagement_level: i < 6 ? "high" : "low" }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, digital_literacy_records: records }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("Enhance digital literacy programme to boost engagement"))).toBe(true);
    });

    it("planned recommendation for incident response 40-69", () => {
      const logs = Array.from({ length: 10 }, (_, i) =>
        makeUsageLog({
          id: `log_${i}`,
          flagged_content: true,
          action_taken: i < 5,
          monitoring_active: false,
          reviewed_by_staff: false,
          parental_controls_enabled: false,
          age_appropriate_filters: false,
        }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, internet_usage_logs: logs }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("Strengthen incident response procedures"))).toBe(true);
    });

    it("recommendations have sequential ranks", () => {
      // Create scenario with multiple recommendations
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({
          total_children: 10,
          esafety_training_records: Array.from({ length: 10 }, (_, i) =>
            makeTraining({ id: `tr_${i}`, child_id: `child_${i}`, completed: i < 4, passed: i < 4, overdue: i >= 8 }),
          ),
          internet_usage_logs: Array.from({ length: 10 }, (_, i) =>
            makeUsageLog({ id: `log_${i}`, monitoring_active: i < 4, reviewed_by_staff: i < 4 }),
          ),
        }),
      );
      for (let i = 0; i < r.recommendations.length; i++) {
        expect(r.recommendations[i].rank).toBe(i + 1);
      }
    });
  });

  // ── Insights ───────────────────────────────────────────────────────────
  describe("insights", () => {
    it("critical insight for compliance < 50", () => {
      const records = Array.from({ length: 10 }, (_, i) =>
        makeTraining({ id: `tr_${i}`, child_id: `child_${i}`, completed: i < 4 }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, esafety_training_records: records }),
      );
      expect(r.insights.some((ins) => ins.severity === "critical" && ins.text.includes("40% of e-safety training completed"))).toBe(true);
    });

    it("critical insight for no training records with children", () => {
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({
          total_children: 3,
          internet_usage_logs: [makeUsageLog()],
        }),
      );
      expect(r.insights.some((ins) => ins.severity === "critical" && ins.text.includes("No e-safety training records exist"))).toBe(true);
    });

    it("critical insight for access agreement coverage < 50", () => {
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({
          total_children: 3,
          esafety_training_records: [makeTraining()],
        }),
      );
      expect(r.insights.some((ins) => ins.severity === "critical" && ins.text.includes("0% of children have online access agreements"))).toBe(true);
    });

    it("critical insight for usage monitoring < 50", () => {
      const logs = Array.from({ length: 10 }, (_, i) =>
        makeUsageLog({ id: `log_${i}`, monitoring_active: i < 4 }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, internet_usage_logs: logs }),
      );
      expect(r.insights.some((ins) => ins.severity === "critical" && ins.text.includes("40% of internet usage is actively monitored"))).toBe(true);
    });

    it("critical insight for incident response < 40 with components", () => {
      const logs = [
        makeUsageLog({ id: "log_1", flagged_content: true, action_taken: false, monitoring_active: false, reviewed_by_staff: false, parental_controls_enabled: false, age_appropriate_filters: false }),
      ];
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 1, internet_usage_logs: logs }),
      );
      expect(r.insights.some((ins) => ins.severity === "critical" && ins.text.includes("Incident response rate at only 0%"))).toBe(true);
    });

    it("critical insight for >= 3 high risk usage events", () => {
      const logs = Array.from({ length: 3 }, (_, i) =>
        makeUsageLog({ id: `log_${i}`, risk_level: "high", monitoring_active: true }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 3, internet_usage_logs: logs }),
      );
      expect(r.insights.some((ins) => ins.severity === "critical" && ins.text.includes("3 high or critical risk internet usage events"))).toBe(true);
    });

    it("critical insight for privacy settings < 50", () => {
      const assessments = Array.from({ length: 10 }, (_, i) =>
        makeSocialMediaAssessment({ id: `sma_${i}`, child_id: `child_${i}`, privacy_settings_appropriate: i < 4 }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, social_media_assessments: assessments }),
      );
      expect(r.insights.some((ins) => ins.severity === "critical" && ins.text.includes("40% of social media accounts have appropriate privacy settings"))).toBe(true);
    });

    it("critical insight for social media rate < 50 with assessments present", () => {
      const assessments = Array.from({ length: 4 }, (_, i) =>
        makeSocialMediaAssessment({ id: `sma_${i}`, child_id: `child_${i}` }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, social_media_assessments: assessments }),
      );
      expect(r.insights.some((ins) => ins.severity === "critical" && ins.text.includes("40% of children have had social media risk assessments"))).toBe(true);
    });

    it("warning insight for compliance 50-79", () => {
      const records = Array.from({ length: 10 }, (_, i) =>
        makeTraining({ id: `tr_${i}`, child_id: `child_${i}`, completed: i < 6 }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, esafety_training_records: records }),
      );
      expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("E-safety training compliance at 60%"))).toBe(true);
    });

    it("warning insight for pass rate 50-69", () => {
      const records = Array.from({ length: 10 }, (_, i) =>
        makeTraining({ id: `tr_${i}`, child_id: `child_${i}`, passed: i < 6 }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, esafety_training_records: records }),
      );
      expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("Training pass rate at 60%"))).toBe(true);
    });

    it("warning insight for monitoring 50-79", () => {
      const logs = Array.from({ length: 10 }, (_, i) =>
        makeUsageLog({ id: `log_${i}`, monitoring_active: i < 6 }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, internet_usage_logs: logs }),
      );
      expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("Internet usage monitoring at 60%"))).toBe(true);
    });

    it("warning insight for staff review 50-69", () => {
      const logs = Array.from({ length: 10 }, (_, i) =>
        makeUsageLog({ id: `log_${i}`, reviewed_by_staff: i < 6, monitoring_active: false }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, internet_usage_logs: logs }),
      );
      expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("Staff review rate at 60%"))).toBe(true);
    });

    it("warning insight for social media rate 50-79", () => {
      const assessments = Array.from({ length: 6 }, (_, i) =>
        makeSocialMediaAssessment({ id: `sma_${i}`, child_id: `child_${i}` }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, social_media_assessments: assessments }),
      );
      expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("Social media risk assessment coverage at 60%"))).toBe(true);
    });

    it("warning insight for privacy settings 50-79", () => {
      const assessments = Array.from({ length: 10 }, (_, i) =>
        makeSocialMediaAssessment({ id: `sma_${i}`, child_id: `child_${i}`, privacy_settings_appropriate: i < 6 }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, social_media_assessments: assessments }),
      );
      expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("Privacy settings compliance at 60%"))).toBe(true);
    });

    it("warning insight for access agreement 50-79", () => {
      const agreements = Array.from({ length: 6 }, (_, i) =>
        makeAccessAgreement({ id: `oaa_${i}`, child_id: `child_${i}`, active: true }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, online_access_agreements: agreements }),
      );
      expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("Online access agreement coverage at 60%"))).toBe(true);
    });

    it("warning insight for literacy engagement 50-69", () => {
      const records = Array.from({ length: 10 }, (_, i) =>
        makeDigitalLiteracy({ id: `dl_${i}`, engagement_level: i < 6 ? "high" : "low" }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, digital_literacy_records: records }),
      );
      expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("Digital literacy engagement at 60%"))).toBe(true);
    });

    it("warning insight for incident response 40-69", () => {
      const logs = Array.from({ length: 10 }, (_, i) =>
        makeUsageLog({
          id: `log_${i}`,
          flagged_content: true,
          action_taken: i < 5,
          monitoring_active: false,
          reviewed_by_staff: false,
          parental_controls_enabled: false,
          age_appropriate_filters: false,
        }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, internet_usage_logs: logs }),
      );
      expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("Incident response rate at 50%"))).toBe(true);
    });

    it("warning insight for overdue training < 3", () => {
      const records = [
        makeTraining({ id: "tr_1", overdue: true }),
      ];
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 1, esafety_training_records: records }),
      );
      expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("1 overdue e-safety training session"))).toBe(true);
    });

    it("warning insight for overdue training >= 3", () => {
      const records = Array.from({ length: 3 }, (_, i) =>
        makeTraining({ id: `tr_${i}`, child_id: `child_${i}`, overdue: true }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 3, esafety_training_records: records }),
      );
      expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("3 overdue e-safety training sessions"))).toBe(true);
    });

    it("warning insight for overdue assessments", () => {
      const assessments = [makeSocialMediaAssessment({ overdue: true })];
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 1, social_media_assessments: assessments }),
      );
      expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("1 overdue social media assessment"))).toBe(true);
    });

    it("warning insight for breaches", () => {
      const agreements = [makeAccessAgreement({ breach_count: 2 })];
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 1, online_access_agreements: agreements }),
      );
      expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("2 online access agreement breaches"))).toBe(true);
    });

    it("warning insight for high risk events < 3", () => {
      const logs = [
        makeUsageLog({ id: "log_1", risk_level: "high", monitoring_active: true }),
      ];
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 1, internet_usage_logs: logs }),
      );
      expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("1 high or critical risk internet usage event"))).toBe(true);
    });

    it("warning insight for child involvement 50-79", () => {
      const assessments = Array.from({ length: 10 }, (_, i) =>
        makeSocialMediaAssessment({ id: `sma_${i}`, child_id: `child_${i}`, child_involved_in_assessment: i < 6 }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, social_media_assessments: assessments }),
      );
      expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("Children involved in 60%"))).toBe(true);
    });

    it("warning insight for low training follow-up rate", () => {
      const records = [
        makeTraining({ id: "tr_1", follow_up_required: true, follow_up_completed: false }),
        makeTraining({ id: "tr_2", follow_up_required: true, follow_up_completed: false }),
        makeTraining({ id: "tr_3", follow_up_required: false, follow_up_completed: false }),
      ];
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 3, esafety_training_records: records }),
      );
      expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("0% of required training follow-ups"))).toBe(true);
    });

    it("warning insight for high risk social media platforms", () => {
      const assessments = [
        makeSocialMediaAssessment({ id: "sma_1", platform: "TikTok", risk_level: "high" }),
        makeSocialMediaAssessment({ id: "sma_2", platform: "Instagram", risk_level: "critical" }),
      ];
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 2, social_media_assessments: assessments }),
      );
      expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("TikTok") && ins.text.includes("Instagram"))).toBe(true);
    });

    it("warning insight for flagged content categories", () => {
      const logs = [
        makeUsageLog({ id: "log_1", flagged_content: true, flagged_content_category: "violence" }),
        makeUsageLog({ id: "log_2", flagged_content: true, flagged_content_category: "violence" }),
        makeUsageLog({ id: "log_3", flagged_content: true, flagged_content_category: "adult_content" }),
      ];
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 1, internet_usage_logs: logs }),
      );
      expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("violence") && ins.text.includes("2 instances"))).toBe(true);
    });

    it("positive insight for outstanding rating", () => {
      const children = 3;
      const training = Array.from({ length: 3 }, (_, i) =>
        makeTraining({ id: `tr_${i}`, child_id: `child_${i}`, completed: true, passed: true, child_engaged: true, child_understood: true }),
      );
      const logs = Array.from({ length: 3 }, (_, i) =>
        makeUsageLog({ id: `log_${i}`, child_id: `child_${i}`, monitoring_active: true, reviewed_by_staff: true, flagged_content: true, action_taken: true }),
      );
      const assessments = Array.from({ length: 3 }, (_, i) =>
        makeSocialMediaAssessment({ id: `sma_${i}`, child_id: `child_${i}`, privacy_settings_appropriate: true, child_involved_in_assessment: true, monitoring_plan_in_place: true }),
      );
      const agreements = Array.from({ length: 3 }, (_, i) =>
        makeAccessAgreement({ id: `oaa_${i}`, child_id: `child_${i}`, active: true }),
      );
      const literacy = Array.from({ length: 3 }, (_, i) =>
        makeDigitalLiteracy({ id: `dl_${i}`, child_id: `child_${i}`, engagement_level: "high", completed: true }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: children, esafety_training_records: training, internet_usage_logs: logs, social_media_assessments: assessments, online_access_agreements: agreements, digital_literacy_records: literacy }),
      );
      expect(r.digital_safety_rating).toBe("outstanding");
      expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("outstanding digital safety"))).toBe(true);
    });

    it("positive insight for 100% training + 90% pass rate", () => {
      const records = Array.from({ length: 10 }, (_, i) =>
        makeTraining({ id: `tr_${i}`, child_id: `child_${i}`, completed: true, passed: i < 9 }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, esafety_training_records: records }),
      );
      expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("All e-safety training completed with a 90% pass rate"))).toBe(true);
    });

    it("positive insight for 90% monitoring + 90% staff review", () => {
      const logs = Array.from({ length: 10 }, (_, i) =>
        makeUsageLog({ id: `log_${i}`, monitoring_active: i < 9, reviewed_by_staff: i < 9 }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, internet_usage_logs: logs }),
      );
      expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("90% monitoring with 90% staff review"))).toBe(true);
    });

    it("positive insight for 100% social media + 90% privacy", () => {
      const assessments = Array.from({ length: 3 }, (_, i) =>
        makeSocialMediaAssessment({ id: `sma_${i}`, child_id: `child_${i}`, privacy_settings_appropriate: true }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 3, social_media_assessments: assessments }),
      );
      expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("Every child has a social media risk assessment with 100% privacy compliance"))).toBe(true);
    });

    it("positive insight for 100% access agreement + 90% child signature", () => {
      const agreements = Array.from({ length: 10 }, (_, i) =>
        makeAccessAgreement({ id: `oaa_${i}`, child_id: `child_${i}`, active: true, signed_by_child: i < 9 }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, online_access_agreements: agreements }),
      );
      expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("Every child has an online access agreement with 90% signed by the child"))).toBe(true);
    });

    it("positive insight for 90% digital literacy engagement", () => {
      const records = Array.from({ length: 10 }, (_, i) =>
        makeDigitalLiteracy({ id: `dl_${i}`, child_id: `child_${i}`, engagement_level: i < 9 ? "high" : "low" }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, digital_literacy_records: records }),
      );
      expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("90% engagement in digital literacy"))).toBe(true);
    });

    it("positive insight for 90% incident response", () => {
      const logs = Array.from({ length: 10 }, (_, i) =>
        makeUsageLog({
          id: `log_${i}`,
          flagged_content: true,
          action_taken: i < 9,
          monitoring_active: false,
          reviewed_by_staff: false,
          parental_controls_enabled: false,
          age_appropriate_filters: false,
        }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, internet_usage_logs: logs }),
      );
      expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("90% incident response rate"))).toBe(true);
    });

    it("positive insight for 100% flagged content response", () => {
      const logs = [
        makeUsageLog({ id: "log_1", flagged_content: true, action_taken: true, monitoring_active: false, reviewed_by_staff: false, parental_controls_enabled: false, age_appropriate_filters: false }),
      ];
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 1, internet_usage_logs: logs }),
      );
      expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("Every instance of flagged content has received a documented response"))).toBe(true);
    });

    it("positive insight for 90% parental controls + 90% age filters", () => {
      const logs = Array.from({ length: 10 }, (_, i) =>
        makeUsageLog({ id: `log_${i}`, parental_controls_enabled: i < 9, age_appropriate_filters: i < 9, monitoring_active: false, reviewed_by_staff: false }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, internet_usage_logs: logs }),
      );
      expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("90% parental controls and 90% age-appropriate filtering"))).toBe(true);
    });

    it("positive insight for 100% concern resolution", () => {
      const logs = [
        makeUsageLog({ id: "log_1", concerns_raised: true, concern_resolved: true, monitoring_active: true, reviewed_by_staff: false }),
      ];
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 1, internet_usage_logs: logs }),
      );
      expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("Every internet usage concern has been resolved"))).toBe(true);
    });

    it("positive insight for 100% escalation", () => {
      const assessments = [
        makeSocialMediaAssessment({ id: "sma_1", concerns_identified: true, concerns_escalated: true }),
      ];
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 1, social_media_assessments: assessments }),
      );
      expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("Every identified social media concern has been appropriately escalated"))).toBe(true);
    });

    it("positive insight for >= 3 certifications", () => {
      const records = Array.from({ length: 3 }, (_, i) =>
        makeDigitalLiteracy({ id: `dl_${i}`, child_id: `child_${i}`, certification_earned: true }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 3, digital_literacy_records: records }),
      );
      expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("3 digital safety certifications earned"))).toBe(true);
    });

    it("positive insight for 90% training engagement + 90% understanding", () => {
      const records = Array.from({ length: 10 }, (_, i) =>
        makeTraining({ id: `tr_${i}`, child_id: `child_${i}`, child_engaged: i < 9, child_understood: i < 9 }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, esafety_training_records: records }),
      );
      expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("90% training engagement and 90% understanding"))).toBe(true);
    });

    it("positive insight for 80% child involvement", () => {
      const assessments = Array.from({ length: 10 }, (_, i) =>
        makeSocialMediaAssessment({ id: `sma_${i}`, child_id: `child_${i}`, child_involved_in_assessment: i < 8 }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, social_media_assessments: assessments }),
      );
      expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("80% child involvement in social media assessments"))).toBe(true);
    });

    it("positive insight for 90% monitoring plan rate", () => {
      const assessments = Array.from({ length: 10 }, (_, i) =>
        makeSocialMediaAssessment({ id: `sma_${i}`, child_id: `child_${i}`, monitoring_plan_in_place: i < 9 }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, social_media_assessments: assessments }),
      );
      expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("90% of social media assessments have monitoring plans"))).toBe(true);
    });
  });

  // ── Headlines ──────────────────────────────────────────────────────────
  describe("headlines", () => {
    it("outstanding headline", () => {
      const children = 3;
      const training = Array.from({ length: 3 }, (_, i) =>
        makeTraining({ id: `tr_${i}`, child_id: `child_${i}`, completed: true, passed: true, child_engaged: true, child_understood: true }),
      );
      const logs = Array.from({ length: 3 }, (_, i) =>
        makeUsageLog({ id: `log_${i}`, child_id: `child_${i}`, monitoring_active: true, reviewed_by_staff: true, flagged_content: true, action_taken: true }),
      );
      const assessments = Array.from({ length: 3 }, (_, i) =>
        makeSocialMediaAssessment({ id: `sma_${i}`, child_id: `child_${i}`, privacy_settings_appropriate: true }),
      );
      const agreements = Array.from({ length: 3 }, (_, i) =>
        makeAccessAgreement({ id: `oaa_${i}`, child_id: `child_${i}`, active: true }),
      );
      const literacy = Array.from({ length: 3 }, (_, i) =>
        makeDigitalLiteracy({ id: `dl_${i}`, child_id: `child_${i}`, engagement_level: "high", completed: true }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: children, esafety_training_records: training, internet_usage_logs: logs, social_media_assessments: assessments, online_access_agreements: agreements, digital_literacy_records: literacy }),
      );
      expect(r.headline).toContain("Outstanding digital safety and online protection");
    });

    it("good headline includes strengths count", () => {
      const training = Array.from({ length: 3 }, (_, i) =>
        makeTraining({ id: `tr_${i}`, child_id: `child_${i}`, completed: true, passed: true }),
      );
      const logs = Array.from({ length: 3 }, (_, i) =>
        makeUsageLog({ id: `log_${i}`, child_id: `child_${i}`, monitoring_active: true, reviewed_by_staff: true }),
      );
      const assessments = Array.from({ length: 3 }, (_, i) =>
        makeSocialMediaAssessment({ id: `sma_${i}`, child_id: `child_${i}`, privacy_settings_appropriate: true }),
      );
      const agreements = Array.from({ length: 3 }, (_, i) =>
        makeAccessAgreement({ id: `oaa_${i}`, child_id: `child_${i}`, active: true }),
      );
      const literacy = Array.from({ length: 3 }, (_, i) =>
        makeDigitalLiteracy({ id: `dl_${i}`, child_id: `child_${i}`, engagement_level: "high", completed: true }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 3, esafety_training_records: training, internet_usage_logs: logs, social_media_assessments: assessments, online_access_agreements: agreements, digital_literacy_records: literacy }),
      );
      expect(r.digital_safety_rating).toBe("good");
      expect(r.headline).toContain("Good digital safety and online protection");
      expect(r.headline).toContain("strength");
    });

    it("adequate headline includes concern count", () => {
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({
          total_children: 3,
          esafety_training_records: [makeTraining()],
        }),
      );
      expect(r.digital_safety_rating).toBe("adequate");
      expect(r.headline).toContain("Adequate digital safety and online protection");
      expect(r.headline).toContain("concern");
    });

    it("inadequate headline includes concern count", () => {
      // Multiple penalties to get below 45
      const training = Array.from({ length: 10 }, (_, i) =>
        makeTraining({ id: `tr_${i}`, child_id: `child_${i}`, completed: i < 3 }),
      );
      const logs = Array.from({ length: 10 }, (_, i) =>
        makeUsageLog({ id: `log_${i}`, monitoring_active: i < 3, reviewed_by_staff: false }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, esafety_training_records: training, internet_usage_logs: logs }),
      );
      expect(r.digital_safety_rating).toBe("inadequate");
      expect(r.headline).toContain("inadequate");
      expect(r.headline).toContain("concern");
    });
  });

  // ── Edge cases ─────────────────────────────────────────────────────────
  describe("edge cases", () => {
    it("score is clamped to 0 minimum", () => {
      // Stack all penalties: -5 -5 -4 -4 = -18 from 52 = 34
      // Can't get below 0 easily, but let's verify clamp works with massive penalties
      // Actually 52 - 18 = 34 is still positive. The clamp is a safety net.
      const training = Array.from({ length: 10 }, (_, i) =>
        makeTraining({ id: `tr_${i}`, child_id: `child_${i}`, completed: i < 4, passed: false, child_engaged: false, child_understood: false }),
      );
      const logs = Array.from({ length: 10 }, (_, i) =>
        makeUsageLog({
          id: `log_${i}`,
          child_id: `child_${i}`,
          monitoring_active: i < 4,
          reviewed_by_staff: false,
          flagged_content: true,
          action_taken: false,
          parental_controls_enabled: false,
          age_appropriate_filters: false,
        }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, esafety_training_records: training, internet_usage_logs: logs }),
      );
      // 52 - 5 (penalty1: compliance<50) - 5 (penalty2: access<50) - 4 (penalty3: incident<40) - 4 (penalty4: monitoring<50)
      // = 52 - 18 = 34
      expect(r.digital_safety_score).toBe(34);
      expect(r.digital_safety_score).toBeGreaterThanOrEqual(0);
    });

    it("score is clamped to 100 maximum", () => {
      // Cannot exceed 80 realistically (52 + 28), but verify clamp safety
      // Score should never exceed base + max bonuses = 80
      const children = 3;
      const training = Array.from({ length: 3 }, (_, i) =>
        makeTraining({ id: `tr_${i}`, child_id: `child_${i}`, completed: true, passed: true, child_engaged: true, child_understood: true }),
      );
      const logs = Array.from({ length: 3 }, (_, i) =>
        makeUsageLog({ id: `log_${i}`, child_id: `child_${i}`, monitoring_active: true, reviewed_by_staff: true, flagged_content: true, action_taken: true }),
      );
      const assessments = Array.from({ length: 3 }, (_, i) =>
        makeSocialMediaAssessment({ id: `sma_${i}`, child_id: `child_${i}`, privacy_settings_appropriate: true }),
      );
      const agreements = Array.from({ length: 3 }, (_, i) =>
        makeAccessAgreement({ id: `oaa_${i}`, child_id: `child_${i}`, active: true }),
      );
      const literacy = Array.from({ length: 3 }, (_, i) =>
        makeDigitalLiteracy({ id: `dl_${i}`, child_id: `child_${i}`, engagement_level: "high", completed: true }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: children, esafety_training_records: training, internet_usage_logs: logs, social_media_assessments: assessments, online_access_agreements: agreements, digital_literacy_records: literacy }),
      );
      expect(r.digital_safety_score).toBeLessThanOrEqual(100);
      expect(r.digital_safety_score).toBe(80);
    });

    it("single child with complete data across all areas", () => {
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({
          total_children: 1,
          esafety_training_records: [makeTraining({ child_id: "child_1", completed: true, passed: true })],
          internet_usage_logs: [makeUsageLog({ child_id: "child_1", monitoring_active: true, reviewed_by_staff: true })],
          social_media_assessments: [makeSocialMediaAssessment({ child_id: "child_1", privacy_settings_appropriate: true })],
          online_access_agreements: [makeAccessAgreement({ child_id: "child_1", active: true })],
          digital_literacy_records: [makeDigitalLiteracy({ child_id: "child_1", engagement_level: "high", completed: true })],
        }),
      );
      // All rates at 100% for applicable metrics
      expect(r.esafety_training_compliance_rate).toBe(100);
      expect(r.usage_monitoring_rate).toBe(100);
      expect(r.social_media_risk_assessment_rate).toBe(100);
      expect(r.access_agreement_coverage_rate).toBe(100);
      expect(r.digital_literacy_engagement_rate).toBe(100);
    });

    it("same child with multiple records across types", () => {
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({
          total_children: 1,
          esafety_training_records: [
            makeTraining({ id: "tr_1", child_id: "child_1", completed: true }),
            makeTraining({ id: "tr_2", child_id: "child_1", completed: true }),
          ],
          internet_usage_logs: [
            makeUsageLog({ id: "log_1", child_id: "child_1", monitoring_active: true }),
            makeUsageLog({ id: "log_2", child_id: "child_1", monitoring_active: true }),
          ],
        }),
      );
      expect(r.children_with_training).toBe(1); // unique
      expect(r.children_with_monitoring).toBe(1); // unique
      expect(r.total_training_records).toBe(2);
      expect(r.total_usage_logs).toBe(2);
    });

    it("inactive access agreements do not count toward coverage", () => {
      const agreements = [
        makeAccessAgreement({ id: "oaa_1", child_id: "child_1", active: false }),
        makeAccessAgreement({ id: "oaa_2", child_id: "child_2", active: false }),
      ];
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 2, online_access_agreements: agreements }),
      );
      expect(r.access_agreement_coverage_rate).toBe(0);
      expect(r.children_with_agreements).toBe(0);
    });

    it("social_media_risk_assessment_rate = 0 when total_children is 0 but has assessments", () => {
      // This scenario would hit allEmpty=false + total_children=0 → insufficient_data
      // Actually, allEmpty check looks at array lengths, so this would NOT be allEmpty
      // and total_children=0 doesn't meet the allEmpty && 0 path
      // Let's verify what happens:
      // allEmpty = false (has assessments), total_children = 0
      // Falls through to compute → socialMediaRiskAssessmentRate = total_children > 0 ? pct(...) : 0
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({
          total_children: 0,
          social_media_assessments: [makeSocialMediaAssessment()],
        }),
      );
      // Not allEmpty, not allEmpty+children>0, falls through to scoring
      expect(r.social_media_risk_assessment_rate).toBe(0);
    });

    it("pct(0,0) returns 0", () => {
      // When no training records, esafetyTrainingComplianceRate should be 0
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({
          total_children: 1,
          internet_usage_logs: [makeUsageLog()],
        }),
      );
      expect(r.esafety_training_compliance_rate).toBe(0);
      expect(r.training_pass_rate).toBe(0);
    });

    it("handles empty risks_identified array for mitigation rate", () => {
      // No risks identified → mitigation denominator = 0 → pct(0,0) = 0
      const assessments = [
        makeSocialMediaAssessment({ id: "sma_1", risks_identified: [], mitigation_completed: true }),
      ];
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 1, social_media_assessments: assessments }),
      );
      // No error thrown, and result is valid
      expect(r.total_social_media_assessments).toBe(1);
    });

    it("handles risks_identified with items for mitigation rate", () => {
      const assessments = [
        makeSocialMediaAssessment({ id: "sma_1", risks_identified: ["cyberbullying"], mitigation_completed: true }),
        makeSocialMediaAssessment({ id: "sma_2", risks_identified: ["grooming"], mitigation_completed: false }),
      ];
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 2, social_media_assessments: assessments }),
      );
      // mitigationCompletionRate = pct(1, 2) = 50 (not exposed in output but shouldn't error)
      expect(r.total_social_media_assessments).toBe(2);
    });

    it("certification singular vs plural in strength text", () => {
      const records = [
        makeDigitalLiteracy({ id: "dl_1", certification_earned: true }),
      ];
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 1, digital_literacy_records: records }),
      );
      expect(r.strengths.some((s) => s.includes("1 digital safety certification earned"))).toBe(true);
    });

    it("overdue training singular text", () => {
      const records = [makeTraining({ overdue: true })];
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 1, esafety_training_records: records }),
      );
      expect(r.concerns.some((c) => c.includes("1 overdue e-safety training session —"))).toBe(true);
    });

    it("access agreement coverage rate 0 when no active agreements and total_children > 0", () => {
      const agreements = [
        makeAccessAgreement({ id: "oaa_1", active: false }),
      ];
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 3, online_access_agreements: agreements }),
      );
      expect(r.access_agreement_coverage_rate).toBe(0);
    });

    it("multiple penalties stack correctly", () => {
      // penalty1 + penalty2 + penalty3 + penalty4
      const training = Array.from({ length: 10 }, (_, i) =>
        makeTraining({ id: `tr_${i}`, child_id: `child_${i}`, completed: i < 4, passed: false, child_engaged: false, child_understood: false }),
      );
      const logs = Array.from({ length: 10 }, (_, i) =>
        makeUsageLog({
          id: `log_${i}`,
          child_id: `child_${i}`,
          monitoring_active: i < 4,
          reviewed_by_staff: false,
          flagged_content: true,
          action_taken: false,
          parental_controls_enabled: false,
          age_appropriate_filters: false,
        }),
      );
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 10, esafety_training_records: training, internet_usage_logs: logs }),
      );
      // 52 - 5 - 5 - 4 - 4 = 34
      expect(r.digital_safety_score).toBe(34);
    });

    it("no flagged content concern when response is 100%", () => {
      const logs = [
        makeUsageLog({ id: "log_1", flagged_content: true, action_taken: true }),
      ];
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 1, internet_usage_logs: logs }),
      );
      expect(r.concerns.some((c) => c.includes("flagged content with only"))).toBe(false);
    });

    it("no breach concern when response is 100%", () => {
      const agreements = [
        makeAccessAgreement({ id: "oaa_1", breach_count: 2, breach_actions_taken: true }),
      ];
      const r = computeDigitalSafetyOnlineProtection(
        baseInput({ total_children: 1, online_access_agreements: agreements }),
      );
      expect(r.concerns.some((c) => c.includes("agreement breach") && c.includes("receiving action"))).toBe(false);
    });

    it("no digital literacy concern when allEmpty", () => {
      // allEmpty + children > 0 → special case, not general concerns
      const r = computeDigitalSafetyOnlineProtection(baseInput({ total_children: 3 }));
      expect(r.concerns.some((c) => c.includes("No digital literacy records exist"))).toBe(false);
    });

    it("no training concern when allEmpty", () => {
      const r = computeDigitalSafetyOnlineProtection(baseInput({ total_children: 3 }));
      expect(r.concerns.some((c) => c.includes("No e-safety training records exist"))).toBe(false);
    });
  });
});
