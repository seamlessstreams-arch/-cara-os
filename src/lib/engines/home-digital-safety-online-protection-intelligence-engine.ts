// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME DIGITAL SAFETY & ONLINE PROTECTION INTELLIGENCE ENGINE
// Evaluates digital safety and online protection for children in care:
// e-safety training compliance, internet usage monitoring, social media risk
// assessments, online access agreements, and digital literacy support.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 12 (Promoting good health and well-being — including online
// safety), Reg 13 (Protection of children — safeguarding from online risks).
// SCCIF: "Children are safe and feel safe — including online."
// KCSIE: Keeping Children Safe in Education — online safety frameworks.
// Store keys: esafetyTrainingRecords, internetUsageLogs,
//             socialMediaAssessments, onlineAccessAgreements,
//             digitalLiteracyRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface EsafetyTrainingRecordInput {
  id: string;
  child_id: string;
  training_date: string;
  training_type: "initial" | "refresher" | "specialist" | "peer_led";
  topic: string;
  completed: boolean;
  completion_date: string | null;
  assessment_score: number | null; // 0-100
  passed: boolean;
  trainer: string;
  next_due_date: string | null;
  overdue: boolean;
  child_engaged: boolean;
  child_understood: boolean;
  follow_up_required: boolean;
  follow_up_completed: boolean;
  notes: string;
  created_at: string;
}

export interface InternetUsageLogInput {
  id: string;
  child_id: string;
  log_date: string;
  monitoring_active: boolean;
  hours_online: number;
  sites_visited: number;
  blocked_attempts: number;
  flagged_content: boolean;
  flagged_content_category: string | null;
  action_taken: boolean;
  action_description: string | null;
  parental_controls_enabled: boolean;
  age_appropriate_filters: boolean;
  reviewed_by_staff: boolean;
  review_date: string | null;
  risk_level: "low" | "medium" | "high" | "critical";
  concerns_raised: boolean;
  concern_description: string | null;
  concern_resolved: boolean;
  created_at: string;
}

export interface SocialMediaAssessmentInput {
  id: string;
  child_id: string;
  assessment_date: string;
  platform: string;
  account_known: boolean;
  privacy_settings_reviewed: boolean;
  privacy_settings_appropriate: boolean;
  risk_level: "low" | "medium" | "high" | "critical";
  risks_identified: string[];
  mitigation_actions: string[];
  mitigation_completed: boolean;
  child_involved_in_assessment: boolean;
  consent_obtained: boolean;
  monitoring_plan_in_place: boolean;
  review_due_date: string | null;
  overdue: boolean;
  concerns_identified: boolean;
  concerns_description: string | null;
  concerns_escalated: boolean;
  outcome: string;
  created_at: string;
}

export interface OnlineAccessAgreementInput {
  id: string;
  child_id: string;
  agreement_date: string;
  agreement_type: "standard" | "restricted" | "supervised" | "enhanced";
  signed_by_child: boolean;
  signed_by_staff: boolean;
  signed_by_social_worker: boolean;
  terms_explained: boolean;
  child_understands_terms: boolean;
  devices_covered: string[];
  review_date: string | null;
  reviewed: boolean;
  overdue: boolean;
  active: boolean;
  breach_count: number;
  breach_actions_taken: boolean;
  last_review_date: string | null;
  created_at: string;
}

export interface DigitalLiteracyRecordInput {
  id: string;
  child_id: string;
  activity_date: string;
  activity_type: "workshop" | "one_to_one" | "group_session" | "online_course" | "self_directed";
  topic: string;
  skill_area: "online_safety" | "digital_citizenship" | "critical_thinking" | "privacy_management" | "communication" | "content_creation" | "technical_skills";
  completed: boolean;
  engagement_level: "high" | "medium" | "low" | "disengaged";
  progress_rating: number; // 1-5
  child_feedback_positive: boolean;
  staff_assessment: string;
  next_steps: string;
  follow_up_date: string | null;
  certification_earned: boolean;
  created_at: string;
}

export interface DigitalSafetyOnlineProtectionInput {
  today: string;
  total_children: number;
  esafety_training_records: EsafetyTrainingRecordInput[];
  internet_usage_logs: InternetUsageLogInput[];
  social_media_assessments: SocialMediaAssessmentInput[];
  online_access_agreements: OnlineAccessAgreementInput[];
  digital_literacy_records: DigitalLiteracyRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type DigitalSafetyRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface DigitalSafetyInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface DigitalSafetyRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface DigitalSafetyOnlineProtectionResult {
  digital_safety_rating: DigitalSafetyRating;
  digital_safety_score: number;
  headline: string;
  total_training_records: number;
  total_usage_logs: number;
  total_social_media_assessments: number;
  total_access_agreements: number;
  total_digital_literacy_records: number;
  esafety_training_compliance_rate: number;
  usage_monitoring_rate: number;
  social_media_risk_assessment_rate: number;
  access_agreement_coverage_rate: number;
  digital_literacy_engagement_rate: number;
  incident_response_rate: number;
  training_pass_rate: number;
  overdue_training_count: number;
  high_risk_usage_count: number;
  flagged_content_count: number;
  privacy_settings_compliance_rate: number;
  agreement_breach_count: number;
  children_with_training: number;
  children_with_agreements: number;
  children_with_assessments: number;
  children_with_monitoring: number;
  children_with_literacy_support: number;
  strengths: string[];
  concerns: string[];
  recommendations: DigitalSafetyRecommendation[];
  insights: DigitalSafetyInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): DigitalSafetyRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: DigitalSafetyRating,
  score: number,
  headline: string,
): DigitalSafetyOnlineProtectionResult {
  return {
    digital_safety_rating: rating,
    digital_safety_score: score,
    headline,
    total_training_records: 0,
    total_usage_logs: 0,
    total_social_media_assessments: 0,
    total_access_agreements: 0,
    total_digital_literacy_records: 0,
    esafety_training_compliance_rate: 0,
    usage_monitoring_rate: 0,
    social_media_risk_assessment_rate: 0,
    access_agreement_coverage_rate: 0,
    digital_literacy_engagement_rate: 0,
    incident_response_rate: 0,
    training_pass_rate: 0,
    overdue_training_count: 0,
    high_risk_usage_count: 0,
    flagged_content_count: 0,
    privacy_settings_compliance_rate: 0,
    agreement_breach_count: 0,
    children_with_training: 0,
    children_with_agreements: 0,
    children_with_assessments: 0,
    children_with_monitoring: 0,
    children_with_literacy_support: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeDigitalSafetyOnlineProtection(
  input: DigitalSafetyOnlineProtectionInput,
): DigitalSafetyOnlineProtectionResult {
  const {
    total_children,
    esafety_training_records,
    internet_usage_logs,
    social_media_assessments,
    online_access_agreements,
    digital_literacy_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    esafety_training_records.length === 0 &&
    internet_usage_logs.length === 0 &&
    social_media_assessments.length === 0 &&
    online_access_agreements.length === 0 &&
    digital_literacy_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess digital safety and online protection.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No digital safety or online protection data recorded despite children on placement — e-safety training, internet monitoring, and online access agreements require urgent attention.",
      ),
      concerns: [
        "No e-safety training records, internet usage logs, social media assessments, online access agreements, or digital literacy records exist despite children being on placement — the home cannot evidence that children are safe online.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement comprehensive digital safety recording immediately — every child must have documented e-safety training, an online access agreement, and active internet monitoring to demonstrate compliance with safeguarding requirements.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 12/13 — Online safeguarding",
        },
        {
          rank: 2,
          recommendation:
            "Conduct social media risk assessments for all children and establish age-appropriate monitoring and filtering on all devices accessible to children in the home.",
          urgency: "immediate",
          regulatory_ref: "KCSIE — Online safety",
        },
      ],
      insights: [
        {
          text: "The complete absence of digital safety and online protection records means Ofsted cannot verify that children are protected from online risks, have received e-safety training, or have appropriate access agreements in place. This represents a fundamental safeguarding gap under Reg 12 and Reg 13.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- Totals ---
  const totalTrainingRecords = esafety_training_records.length;
  const totalUsageLogs = internet_usage_logs.length;
  const totalSocialMediaAssessments = social_media_assessments.length;
  const totalAccessAgreements = online_access_agreements.length;
  const totalDigitalLiteracyRecords = digital_literacy_records.length;

  // --- E-safety training metrics ---
  const completedTraining = esafety_training_records.filter((t) => t.completed).length;
  const esafetyTrainingComplianceRate = pct(completedTraining, totalTrainingRecords);

  const passedTraining = esafety_training_records.filter((t) => t.passed).length;
  const trainingPassRate = pct(passedTraining, totalTrainingRecords);

  const overdueTraining = esafety_training_records.filter((t) => t.overdue).length;
  const overdueTrainingCount = overdueTraining;

  const childrenWithTraining = new Set(
    esafety_training_records.filter((t) => t.completed).map((t) => t.child_id),
  ).size;

  const engagedInTraining = esafety_training_records.filter((t) => t.child_engaged).length;
  const trainingEngagementRate = pct(engagedInTraining, totalTrainingRecords);

  const understoodTraining = esafety_training_records.filter((t) => t.child_understood).length;
  const trainingUnderstandingRate = pct(understoodTraining, totalTrainingRecords);

  const followUpRequired = esafety_training_records.filter((t) => t.follow_up_required).length;
  const followUpCompleted = esafety_training_records.filter(
    (t) => t.follow_up_required && t.follow_up_completed,
  ).length;
  const trainingFollowUpRate = pct(followUpCompleted, followUpRequired);

  // --- Internet usage monitoring metrics ---
  const monitoredLogs = internet_usage_logs.filter((l) => l.monitoring_active).length;
  const usageMonitoringRate = pct(monitoredLogs, totalUsageLogs);

  const reviewedLogs = internet_usage_logs.filter((l) => l.reviewed_by_staff).length;
  const staffReviewRate = pct(reviewedLogs, totalUsageLogs);

  const childrenWithMonitoring = new Set(
    internet_usage_logs.filter((l) => l.monitoring_active).map((l) => l.child_id),
  ).size;

  const flaggedContentLogs = internet_usage_logs.filter((l) => l.flagged_content).length;
  const flaggedContentCount = flaggedContentLogs;

  const flaggedWithAction = internet_usage_logs.filter(
    (l) => l.flagged_content && l.action_taken,
  ).length;
  const flaggedContentResponseRate = pct(flaggedWithAction, flaggedContentLogs);

  const highRiskLogs = internet_usage_logs.filter(
    (l) => l.risk_level === "high" || l.risk_level === "critical",
  ).length;
  const highRiskUsageCount = highRiskLogs;

  const parentalControlsActive = internet_usage_logs.filter(
    (l) => l.parental_controls_enabled,
  ).length;
  const parentalControlsRate = pct(parentalControlsActive, totalUsageLogs);

  const ageFiltersActive = internet_usage_logs.filter(
    (l) => l.age_appropriate_filters,
  ).length;
  const ageFilterRate = pct(ageFiltersActive, totalUsageLogs);

  const concernsRaised = internet_usage_logs.filter((l) => l.concerns_raised).length;
  const concernsResolved = internet_usage_logs.filter(
    (l) => l.concerns_raised && l.concern_resolved,
  ).length;
  const concernResolutionRate = pct(concernsResolved, concernsRaised);

  // --- Social media assessment metrics ---
  const childrenWithAssessments = new Set(
    social_media_assessments.map((a) => a.child_id),
  ).size;
  const socialMediaRiskAssessmentRate =
    total_children > 0 ? pct(childrenWithAssessments, total_children) : 0;

  const privacyReviewed = social_media_assessments.filter(
    (a) => a.privacy_settings_reviewed,
  ).length;
  const privacyAppropriate = social_media_assessments.filter(
    (a) => a.privacy_settings_appropriate,
  ).length;
  const privacySettingsComplianceRate = pct(privacyAppropriate, totalSocialMediaAssessments);

  const highRiskAssessments = social_media_assessments.filter(
    (a) => a.risk_level === "high" || a.risk_level === "critical",
  ).length;

  const mitigationCompleted = social_media_assessments.filter(
    (a) => a.mitigation_completed,
  ).length;
  const mitigationCompletionRate = pct(
    mitigationCompleted,
    social_media_assessments.filter((a) => a.risks_identified.length > 0).length,
  );

  const childInvolved = social_media_assessments.filter(
    (a) => a.child_involved_in_assessment,
  ).length;
  const childInvolvementRate = pct(childInvolved, totalSocialMediaAssessments);

  const monitoringPlanInPlace = social_media_assessments.filter(
    (a) => a.monitoring_plan_in_place,
  ).length;
  const monitoringPlanRate = pct(monitoringPlanInPlace, totalSocialMediaAssessments);

  const overdueAssessments = social_media_assessments.filter((a) => a.overdue).length;

  const concernsIdentified = social_media_assessments.filter(
    (a) => a.concerns_identified,
  ).length;
  const concernsEscalated = social_media_assessments.filter(
    (a) => a.concerns_identified && a.concerns_escalated,
  ).length;
  const escalationRate = pct(concernsEscalated, concernsIdentified);

  // --- Online access agreement metrics ---
  const activeAgreements = online_access_agreements.filter((a) => a.active).length;
  const childrenWithAgreements = new Set(
    online_access_agreements.filter((a) => a.active).map((a) => a.child_id),
  ).size;
  const accessAgreementCoverageRate =
    total_children > 0 ? pct(childrenWithAgreements, total_children) : 0;

  const signedByChild = online_access_agreements.filter(
    (a) => a.active && a.signed_by_child,
  ).length;
  const childSignatureRate = pct(signedByChild, activeAgreements);

  const termsExplained = online_access_agreements.filter(
    (a) => a.active && a.terms_explained,
  ).length;
  const termsExplainedRate = pct(termsExplained, activeAgreements);

  const childUnderstands = online_access_agreements.filter(
    (a) => a.active && a.child_understands_terms,
  ).length;
  const childUnderstandsRate = pct(childUnderstands, activeAgreements);

  const reviewedAgreements = online_access_agreements.filter(
    (a) => a.active && a.reviewed,
  ).length;
  const agreementReviewRate = pct(reviewedAgreements, activeAgreements);

  const overdueAgreements = online_access_agreements.filter(
    (a) => a.active && a.overdue,
  ).length;

  const totalBreaches = online_access_agreements.reduce(
    (sum, a) => sum + a.breach_count,
    0,
  );
  const agreementBreachCount = totalBreaches;

  const agreementsWithBreaches = online_access_agreements.filter(
    (a) => a.breach_count > 0,
  ).length;
  const breachActionsCompleted = online_access_agreements.filter(
    (a) => a.breach_count > 0 && a.breach_actions_taken,
  ).length;
  const breachResponseRate = pct(breachActionsCompleted, agreementsWithBreaches);

  // --- Digital literacy metrics ---
  const childrenWithLiteracySupport = new Set(
    digital_literacy_records.map((r) => r.child_id),
  ).size;

  const completedLiteracy = digital_literacy_records.filter((r) => r.completed).length;
  const literacyCompletionRate = pct(completedLiteracy, totalDigitalLiteracyRecords);

  const highEngagement = digital_literacy_records.filter(
    (r) => r.engagement_level === "high" || r.engagement_level === "medium",
  ).length;
  const digitalLiteracyEngagementRate = pct(highEngagement, totalDigitalLiteracyRecords);

  const positiveFeedback = digital_literacy_records.filter(
    (r) => r.child_feedback_positive,
  ).length;
  const positiveFeedbackRate = pct(positiveFeedback, totalDigitalLiteracyRecords);

  const certifications = digital_literacy_records.filter(
    (r) => r.certification_earned,
  ).length;

  const avgProgressRating =
    totalDigitalLiteracyRecords > 0
      ? Math.round(
          (digital_literacy_records.reduce((sum, r) => sum + r.progress_rating, 0) /
            totalDigitalLiteracyRecords) *
            100,
        ) / 100
      : 0;

  const onlineSafetyLiteracy = digital_literacy_records.filter(
    (r) => r.skill_area === "online_safety" && r.completed,
  ).length;

  // --- Incident response composite metric ---
  // Combines: flagged content response + concern resolution + escalation + breach response
  const incidentResponseComponents: number[] = [];
  if (flaggedContentLogs > 0) incidentResponseComponents.push(flaggedContentResponseRate);
  if (concernsRaised > 0) incidentResponseComponents.push(concernResolutionRate);
  if (concernsIdentified > 0) incidentResponseComponents.push(escalationRate);
  if (agreementsWithBreaches > 0) incidentResponseComponents.push(breachResponseRate);
  const incidentResponseRate =
    incidentResponseComponents.length > 0
      ? Math.round(
          incidentResponseComponents.reduce((s, v) => s + v, 0) /
            incidentResponseComponents.length,
        )
      : 0;

  // ── Scoring: base 52 ─────────────────────────────────────────────────
  // 9 bonus categories summing to exactly 28 (max possible = 52 + 28 = 80 = outstanding)

  let score = 52;

  // --- Bonus 1: esafetyTrainingComplianceRate (>=90: +4, >=70: +2) --- max 4
  if (esafetyTrainingComplianceRate >= 90) score += 4;
  else if (esafetyTrainingComplianceRate >= 70) score += 2;

  // --- Bonus 2: usageMonitoringRate (>=90: +3, >=70: +1) --- max 3
  if (usageMonitoringRate >= 90) score += 3;
  else if (usageMonitoringRate >= 70) score += 1;

  // --- Bonus 3: socialMediaRiskAssessmentRate (>=90: +4, >=70: +2) --- max 4
  if (socialMediaRiskAssessmentRate >= 90) score += 4;
  else if (socialMediaRiskAssessmentRate >= 70) score += 2;

  // --- Bonus 4: accessAgreementCoverageRate (>=100: +3, >=80: +1) --- max 3
  if (accessAgreementCoverageRate >= 100) score += 3;
  else if (accessAgreementCoverageRate >= 80) score += 1;

  // --- Bonus 5: digitalLiteracyEngagementRate (>=90: +3, >=70: +1) --- max 3
  if (digitalLiteracyEngagementRate >= 90) score += 3;
  else if (digitalLiteracyEngagementRate >= 70) score += 1;

  // --- Bonus 6: incidentResponseRate (>=90: +3, >=70: +1) --- max 3
  if (incidentResponseRate >= 90) score += 3;
  else if (incidentResponseRate >= 70) score += 1;

  // --- Bonus 7: privacySettingsComplianceRate (>=90: +3, >=70: +1) --- max 3
  if (privacySettingsComplianceRate >= 90) score += 3;
  else if (privacySettingsComplianceRate >= 70) score += 1;

  // --- Bonus 8: staffReviewRate (>=90: +2, >=70: +1) --- max 2
  if (staffReviewRate >= 90) score += 2;
  else if (staffReviewRate >= 70) score += 1;

  // --- Bonus 9: trainingPassRate (>=90: +3, >=70: +1) --- max 3
  if (trainingPassRate >= 90) score += 3;
  else if (trainingPassRate >= 70) score += 1;

  // Total max bonus: 4+3+4+3+3+3+3+2+3 = 28

  // ── Penalties ─────────────────────────────────────────────────────────

  // Penalty 1: esafetyTrainingComplianceRate < 50 → -5 (guard: totalTrainingRecords > 0)
  if (esafetyTrainingComplianceRate < 50 && totalTrainingRecords > 0) score -= 5;

  // Penalty 2: accessAgreementCoverageRate < 50 → -5 (guard: total_children > 0)
  if (accessAgreementCoverageRate < 50 && total_children > 0) score -= 5;

  // Penalty 3: incidentResponseRate < 40 with incidents existing → -4
  if (incidentResponseRate < 40 && incidentResponseComponents.length > 0) score -= 4;

  // Penalty 4: usageMonitoringRate < 50 → -4 (guard: totalUsageLogs > 0)
  if (usageMonitoringRate < 50 && totalUsageLogs > 0) score -= 4;

  score = clamp(score, 0, 100);

  const digital_safety_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (esafetyTrainingComplianceRate >= 100 && totalTrainingRecords > 0) {
    strengths.push(
      "Every e-safety training session has been completed — the home demonstrates full compliance with e-safety training requirements for all children.",
    );
  } else if (esafetyTrainingComplianceRate >= 90 && totalTrainingRecords > 0) {
    strengths.push(
      `${esafetyTrainingComplianceRate}% e-safety training compliance — nearly all training sessions completed, demonstrating strong commitment to digital safety education.`,
    );
  } else if (esafetyTrainingComplianceRate >= 80 && totalTrainingRecords > 0) {
    strengths.push(
      `${esafetyTrainingComplianceRate}% e-safety training compliance — good levels of training completion across the home.`,
    );
  }

  if (trainingPassRate >= 90 && totalTrainingRecords > 0) {
    strengths.push(
      `${trainingPassRate}% training pass rate — children are demonstrating strong understanding of e-safety concepts through assessments.`,
    );
  } else if (trainingPassRate >= 80 && totalTrainingRecords > 0) {
    strengths.push(
      `${trainingPassRate}% training pass rate — most children are successfully demonstrating their e-safety knowledge.`,
    );
  }

  if (usageMonitoringRate >= 90 && totalUsageLogs > 0) {
    strengths.push(
      `${usageMonitoringRate}% of internet usage actively monitored — comprehensive oversight of children's online activity is in place.`,
    );
  } else if (usageMonitoringRate >= 80 && totalUsageLogs > 0) {
    strengths.push(
      `${usageMonitoringRate}% internet usage monitoring rate — strong monitoring coverage of children's online activity.`,
    );
  }

  if (staffReviewRate >= 90 && totalUsageLogs > 0) {
    strengths.push(
      `${staffReviewRate}% of internet usage logs reviewed by staff — proactive staff engagement in monitoring children's digital safety.`,
    );
  } else if (staffReviewRate >= 80 && totalUsageLogs > 0) {
    strengths.push(
      `${staffReviewRate}% staff review rate of internet usage — good staff involvement in overseeing online activity.`,
    );
  }

  if (socialMediaRiskAssessmentRate >= 100 && total_children > 0 && totalSocialMediaAssessments > 0) {
    strengths.push(
      "Every child has had a social media risk assessment — comprehensive coverage ensures all children's online presence is evaluated for safety.",
    );
  } else if (socialMediaRiskAssessmentRate >= 80 && total_children > 0 && totalSocialMediaAssessments > 0) {
    strengths.push(
      `${socialMediaRiskAssessmentRate}% social media risk assessment coverage — the majority of children have had their social media presence assessed for risks.`,
    );
  }

  if (privacySettingsComplianceRate >= 90 && totalSocialMediaAssessments > 0) {
    strengths.push(
      `${privacySettingsComplianceRate}% privacy settings compliance — social media accounts have appropriate privacy protections in place.`,
    );
  } else if (privacySettingsComplianceRate >= 80 && totalSocialMediaAssessments > 0) {
    strengths.push(
      `${privacySettingsComplianceRate}% of social media accounts have appropriate privacy settings — strong oversight of children's online privacy.`,
    );
  }

  if (accessAgreementCoverageRate >= 100 && total_children > 0 && totalAccessAgreements > 0) {
    strengths.push(
      "Every child has an active online access agreement — comprehensive coverage of digital access expectations and boundaries.",
    );
  } else if (accessAgreementCoverageRate >= 80 && total_children > 0 && totalAccessAgreements > 0) {
    strengths.push(
      `${accessAgreementCoverageRate}% online access agreement coverage — the majority of children have documented agreements governing their internet use.`,
    );
  }

  if (childSignatureRate >= 90 && activeAgreements > 0) {
    strengths.push(
      `${childSignatureRate}% of access agreements signed by the child — children are actively involved in agreeing their digital boundaries.`,
    );
  }

  if (termsExplainedRate >= 90 && activeAgreements > 0) {
    strengths.push(
      `Terms explained in ${termsExplainedRate}% of access agreements — staff ensure children understand their digital boundaries and responsibilities.`,
    );
  }

  if (digitalLiteracyEngagementRate >= 90 && totalDigitalLiteracyRecords > 0) {
    strengths.push(
      `${digitalLiteracyEngagementRate}% engagement in digital literacy activities — children are actively participating in developing their digital skills and knowledge.`,
    );
  } else if (digitalLiteracyEngagementRate >= 80 && totalDigitalLiteracyRecords > 0) {
    strengths.push(
      `${digitalLiteracyEngagementRate}% digital literacy engagement — good levels of participation in digital skills development.`,
    );
  }

  if (incidentResponseRate >= 90 && incidentResponseComponents.length > 0) {
    strengths.push(
      `${incidentResponseRate}% incident response rate — the home responds promptly and effectively to online safety incidents, flagged content, and agreement breaches.`,
    );
  } else if (incidentResponseRate >= 80 && incidentResponseComponents.length > 0) {
    strengths.push(
      `${incidentResponseRate}% incident response rate — strong response to online safety concerns and incidents.`,
    );
  }

  if (flaggedContentResponseRate >= 100 && flaggedContentLogs > 0) {
    strengths.push(
      "Every instance of flagged content has been acted upon — the home demonstrates zero-tolerance for unsafe online content exposure.",
    );
  }

  if (parentalControlsRate >= 90 && totalUsageLogs > 0) {
    strengths.push(
      `${parentalControlsRate}% parental controls enabled — robust technical safeguards are in place across devices.`,
    );
  }

  if (ageFilterRate >= 90 && totalUsageLogs > 0) {
    strengths.push(
      `${ageFilterRate}% age-appropriate filtering in place — content filtering is configured to match each child's developmental stage.`,
    );
  }

  if (childInvolvementRate >= 80 && totalSocialMediaAssessments > 0) {
    strengths.push(
      `${childInvolvementRate}% child involvement in social media assessments — children are partners in evaluating their own online safety.`,
    );
  }

  if (certifications > 0) {
    strengths.push(
      `${certifications} digital safety certification${certifications !== 1 ? "s" : ""} earned — children are achieving formal recognition of their digital literacy skills.`,
    );
  }

  if (monitoringPlanRate >= 90 && totalSocialMediaAssessments > 0) {
    strengths.push(
      `${monitoringPlanRate}% of social media assessments have monitoring plans in place — ongoing oversight is structured and documented.`,
    );
  }

  if (onlineSafetyLiteracy > 0 && totalDigitalLiteracyRecords > 0) {
    const onlineSafetyPct = pct(onlineSafetyLiteracy, completedLiteracy);
    if (onlineSafetyPct >= 30) {
      strengths.push(
        `Online safety is a focus of digital literacy provision — ${onlineSafetyLiteracy} completed session${onlineSafetyLiteracy !== 1 ? "s" : ""} specifically covering online safety skills.`,
      );
    }
  }

  if (avgProgressRating >= 4.0 && totalDigitalLiteracyRecords > 0) {
    strengths.push(
      `Average digital literacy progress rating of ${avgProgressRating}/5 — children are making strong progress in developing digital competencies.`,
    );
  }

  if (overdueTrainingCount === 0 && totalTrainingRecords > 0) {
    strengths.push(
      "No overdue e-safety training — all training is delivered within required timeframes.",
    );
  }

  if (escalationRate >= 100 && concernsIdentified > 0) {
    strengths.push(
      "Every social media concern has been appropriately escalated — the home demonstrates robust escalation procedures for online safeguarding concerns.",
    );
  }

  if (breachResponseRate >= 100 && agreementsWithBreaches > 0) {
    strengths.push(
      "All agreement breaches have had appropriate actions taken — the home consistently enforces digital boundaries while supporting children to understand expectations.",
    );
  }

  if (trainingEngagementRate >= 90 && totalTrainingRecords > 0) {
    strengths.push(
      `${trainingEngagementRate}% child engagement in e-safety training — children are actively participating in and responding to digital safety education.`,
    );
  }

  if (trainingUnderstandingRate >= 90 && totalTrainingRecords > 0) {
    strengths.push(
      `${trainingUnderstandingRate}% of children demonstrated understanding of e-safety training content — training is effective and age-appropriate.`,
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (esafetyTrainingComplianceRate < 50 && totalTrainingRecords > 0) {
    concerns.push(
      `Only ${esafetyTrainingComplianceRate}% of e-safety training completed — the majority of children have not received essential digital safety training, leaving them vulnerable to online risks.`,
    );
  } else if (esafetyTrainingComplianceRate < 80 && esafetyTrainingComplianceRate >= 50 && totalTrainingRecords > 0) {
    concerns.push(
      `E-safety training compliance at ${esafetyTrainingComplianceRate}% — some children have not completed their digital safety training, which may leave them less prepared to navigate online risks safely.`,
    );
  }

  if (trainingPassRate < 50 && totalTrainingRecords > 0) {
    concerns.push(
      `Only ${trainingPassRate}% training pass rate — the majority of children are not demonstrating adequate understanding of e-safety concepts, suggesting training may not be effective or age-appropriate.`,
    );
  } else if (trainingPassRate < 70 && trainingPassRate >= 50 && totalTrainingRecords > 0) {
    concerns.push(
      `Training pass rate at ${trainingPassRate}% — a significant proportion of children are not fully grasping e-safety concepts, indicating the need for adapted approaches.`,
    );
  }

  if (usageMonitoringRate < 50 && totalUsageLogs > 0) {
    concerns.push(
      `Only ${usageMonitoringRate}% of internet usage is monitored — the majority of children's online activity is unsupervised, creating significant safeguarding risks.`,
    );
  } else if (usageMonitoringRate < 80 && usageMonitoringRate >= 50 && totalUsageLogs > 0) {
    concerns.push(
      `Internet usage monitoring at ${usageMonitoringRate}% — gaps in monitoring coverage may leave some children's online activity unsupervised.`,
    );
  }

  if (staffReviewRate < 50 && totalUsageLogs > 0) {
    concerns.push(
      `Only ${staffReviewRate}% of internet usage logs reviewed by staff — without regular staff review, concerning patterns in children's online behaviour may go undetected.`,
    );
  } else if (staffReviewRate < 70 && staffReviewRate >= 50 && totalUsageLogs > 0) {
    concerns.push(
      `Staff review rate of internet usage logs at ${staffReviewRate}% — inconsistent review may mean some safeguarding concerns are missed.`,
    );
  }

  if (socialMediaRiskAssessmentRate < 50 && total_children > 0 && (totalSocialMediaAssessments > 0 || total_children > 0)) {
    concerns.push(
      `Only ${socialMediaRiskAssessmentRate}% of children have had a social media risk assessment — the majority of children's social media presence has not been evaluated for safety risks.`,
    );
  } else if (socialMediaRiskAssessmentRate < 80 && socialMediaRiskAssessmentRate >= 50 && total_children > 0) {
    concerns.push(
      `Social media risk assessment coverage at ${socialMediaRiskAssessmentRate}% — some children's social media use has not been assessed, leaving potential risks unidentified.`,
    );
  }

  if (privacySettingsComplianceRate < 50 && totalSocialMediaAssessments > 0) {
    concerns.push(
      `Only ${privacySettingsComplianceRate}% of social media accounts have appropriate privacy settings — children's personal information may be exposed to inappropriate audiences.`,
    );
  } else if (privacySettingsComplianceRate < 80 && privacySettingsComplianceRate >= 50 && totalSocialMediaAssessments > 0) {
    concerns.push(
      `Privacy settings compliance at ${privacySettingsComplianceRate}% — some children's social media accounts do not have adequate privacy protections.`,
    );
  }

  if (accessAgreementCoverageRate < 50 && total_children > 0) {
    concerns.push(
      `Only ${accessAgreementCoverageRate}% of children have an active online access agreement — the majority of children are using the internet without documented expectations and boundaries.`,
    );
  } else if (accessAgreementCoverageRate < 80 && accessAgreementCoverageRate >= 50 && total_children > 0) {
    concerns.push(
      `Online access agreement coverage at ${accessAgreementCoverageRate}% — some children do not have formal agreements governing their internet use.`,
    );
  }

  if (digitalLiteracyEngagementRate < 50 && totalDigitalLiteracyRecords > 0) {
    concerns.push(
      `Only ${digitalLiteracyEngagementRate}% engagement in digital literacy activities — the majority of children are not actively participating in digital skills development.`,
    );
  } else if (digitalLiteracyEngagementRate < 70 && digitalLiteracyEngagementRate >= 50 && totalDigitalLiteracyRecords > 0) {
    concerns.push(
      `Digital literacy engagement at ${digitalLiteracyEngagementRate}% — some children are not fully engaging with digital skills development opportunities.`,
    );
  }

  if (incidentResponseRate < 40 && incidentResponseComponents.length > 0) {
    concerns.push(
      `Incident response rate at only ${incidentResponseRate}% — online safety incidents, flagged content, and agreement breaches are not being consistently addressed, creating ongoing safeguarding risks.`,
    );
  } else if (incidentResponseRate < 70 && incidentResponseRate >= 40 && incidentResponseComponents.length > 0) {
    concerns.push(
      `Incident response rate at ${incidentResponseRate}% — some online safety incidents are not being fully addressed, which may allow harmful patterns to persist.`,
    );
  }

  if (highRiskUsageCount > 0) {
    concerns.push(
      `${highRiskUsageCount} high or critical risk internet usage event${highRiskUsageCount !== 1 ? "s" : ""} recorded — these require immediate review and action to ensure children's online safety.`,
    );
  }

  if (flaggedContentLogs > 0 && flaggedContentResponseRate < 100) {
    concerns.push(
      `${flaggedContentLogs} instance${flaggedContentLogs !== 1 ? "s" : ""} of flagged content with only ${flaggedContentResponseRate}% receiving action — all flagged content must be investigated and responded to.`,
    );
  }

  if (overdueTrainingCount > 0) {
    concerns.push(
      `${overdueTrainingCount} overdue e-safety training session${overdueTrainingCount !== 1 ? "s" : ""} — children may not have current knowledge of online risks and safe practices.`,
    );
  }

  if (overdueAssessments > 0) {
    concerns.push(
      `${overdueAssessments} overdue social media assessment${overdueAssessments !== 1 ? "s" : ""} — children's social media risk profiles may be outdated and require review.`,
    );
  }

  if (overdueAgreements > 0) {
    concerns.push(
      `${overdueAgreements} overdue online access agreement review${overdueAgreements !== 1 ? "s" : ""} — agreements may no longer reflect children's current needs and developmental stage.`,
    );
  }

  if (totalBreaches > 0 && breachResponseRate < 100) {
    concerns.push(
      `${totalBreaches} agreement breach${totalBreaches !== 1 ? "es" : ""} recorded with only ${breachResponseRate}% receiving action — all breaches should be addressed constructively to maintain safe digital boundaries.`,
    );
  }

  if (parentalControlsRate < 50 && totalUsageLogs > 0) {
    concerns.push(
      `Parental controls enabled on only ${parentalControlsRate}% of monitored sessions — children may be accessing the internet without adequate technical safeguards.`,
    );
  }

  if (ageFilterRate < 50 && totalUsageLogs > 0) {
    concerns.push(
      `Age-appropriate filters active in only ${ageFilterRate}% of sessions — children may be exposed to content that is not suitable for their developmental stage.`,
    );
  }

  if (totalDigitalLiteracyRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No digital literacy records exist — children are not receiving structured support to develop the digital skills they need for safe and effective online engagement.",
    );
  }

  if (totalTrainingRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No e-safety training records exist — children have not received documented training on how to stay safe online.",
    );
  }

  if (escalationRate < 50 && concernsIdentified > 0) {
    concerns.push(
      `Only ${escalationRate}% of identified social media concerns have been escalated — some serious concerns may not be receiving appropriate attention or follow-up.`,
    );
  }

  if (childInvolvementRate < 50 && totalSocialMediaAssessments > 0) {
    concerns.push(
      `Children involved in only ${childInvolvementRate}% of social media assessments — assessments should be collaborative, with children's views and understanding informing the process.`,
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: DigitalSafetyRecommendation[] = [];
  let rank = 0;

  if (esafetyTrainingComplianceRate < 50 && totalTrainingRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently complete all outstanding e-safety training — every child must receive up-to-date digital safety training to understand online risks and how to protect themselves. Schedule catch-up sessions within the next two weeks.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 12/13 — Online safeguarding",
    });
  }

  if (totalTrainingRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish a structured e-safety training programme immediately — all children must receive documented training covering online risks, safe communication, privacy, and reporting concerns. Schedule initial sessions within one week.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 12/13 — Online safeguarding, KCSIE",
    });
  }

  if (accessAgreementCoverageRate < 50 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure every child has an active, signed online access agreement — agreements set clear expectations and boundaries for internet use and provide a framework for addressing breaches constructively.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 12/13 — Online safeguarding",
    });
  }

  if (usageMonitoringRate < 50 && totalUsageLogs > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish comprehensive internet monitoring across all devices accessible to children — without active monitoring, the home cannot identify or respond to online safety concerns in a timely manner.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 13 — Protection of children",
    });
  }

  if (incidentResponseRate < 40 && incidentResponseComponents.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a robust incident response protocol for all online safety concerns — every flagged content instance, identified concern, and agreement breach must receive a documented, timely response with clear actions and follow-up.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 13 — Protection of children",
    });
  }

  if (socialMediaRiskAssessmentRate < 50 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Conduct social media risk assessments for all children — every child's online social media presence should be evaluated, with privacy settings reviewed, risks identified, and mitigation actions documented.",
      urgency: "immediate",
      regulatory_ref: "KCSIE — Online safety",
    });
  }

  if (highRiskUsageCount > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        `Review and address all ${highRiskUsageCount} high/critical risk internet usage event${highRiskUsageCount !== 1 ? "s" : ""} — ensure each event has been investigated, appropriate action taken, and safeguarding referrals made where necessary.`,
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 13 — Protection of children",
    });
  }

  if (flaggedContentLogs > 0 && flaggedContentResponseRate < 100) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all flagged content instances receive documented action — investigate the nature of the flagged content, discuss with the child, and implement any necessary protective measures or additional monitoring.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 13 — Protection of children",
    });
  }

  if (privacySettingsComplianceRate < 50 && totalSocialMediaAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review and correct privacy settings on all children's social media accounts — inappropriate privacy settings expose children to contact from unknown individuals and potential exploitation.",
      urgency: "immediate",
      regulatory_ref: "KCSIE — Online safety, CHR 2015 Reg 13",
    });
  }

  if (overdueTrainingCount > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        `Schedule and complete ${overdueTrainingCount} overdue e-safety training session${overdueTrainingCount !== 1 ? "s" : ""} — ensure all training is current and children have up-to-date knowledge of online safety practices.`,
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 12 — Good health and well-being",
    });
  }

  if (esafetyTrainingComplianceRate >= 50 && esafetyTrainingComplianceRate < 80 && totalTrainingRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve e-safety training compliance to at least 80% — identify barriers to completion and provide alternative formats or schedules to ensure all children complete their training.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 12/13 — Online safeguarding",
    });
  }

  if (usageMonitoringRate >= 50 && usageMonitoringRate < 80 && totalUsageLogs > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend internet monitoring coverage to at least 80% of all usage — consistent monitoring is essential to identify emerging online safety concerns before they escalate.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 13 — Protection of children",
    });
  }

  if (socialMediaRiskAssessmentRate >= 50 && socialMediaRiskAssessmentRate < 80 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend social media risk assessment coverage to all children — every child with a social media presence should have a documented assessment with privacy review and monitoring plan.",
      urgency: "soon",
      regulatory_ref: "KCSIE — Online safety",
    });
  }

  if (accessAgreementCoverageRate >= 50 && accessAgreementCoverageRate < 80 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all children have active online access agreements — agreements should be child-friendly, explain digital boundaries, and be reviewed regularly to reflect changing needs.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 12/13 — Online safeguarding",
    });
  }

  if (staffReviewRate < 70 && totalUsageLogs > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase staff review of internet usage logs — regular review by staff ensures concerning patterns are identified early and appropriate action is taken to protect children.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 13 — Protection of children",
    });
  }

  if (digitalLiteracyEngagementRate < 50 && totalDigitalLiteracyRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review digital literacy provision to improve engagement — explore more interactive, age-appropriate formats and topics that align with children's interests to increase participation.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 12 — Good health and well-being",
    });
  }

  if (totalDigitalLiteracyRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Introduce a digital literacy programme — children need structured support to develop critical thinking about online content, digital citizenship, and technical skills for safe internet use.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 12 — Good health and well-being",
    });
  }

  if (trainingPassRate < 50 && totalTrainingRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review e-safety training content and delivery — low pass rates suggest training may not be age-appropriate or effectively engaging children. Consider alternative approaches, visual aids, and practical scenarios.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 12/13 — Online safeguarding",
    });
  }

  if (childInvolvementRate < 50 && totalSocialMediaAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase child involvement in social media assessments — collaborative assessments help children understand risks and develop their own strategies for staying safe online.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (parentalControlsRate < 70 && totalUsageLogs > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Enable parental controls on all devices accessible to children — technical safeguards provide an essential layer of protection alongside monitoring and education.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 13 — Protection of children",
    });
  }

  if (ageFilterRate < 70 && totalUsageLogs > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure age-appropriate content filters are active on all devices — filters should be configured to match each child's age and developmental stage.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 13 — Protection of children",
    });
  }

  if (overdueAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        `Complete ${overdueAssessments} overdue social media risk assessment${overdueAssessments !== 1 ? "s" : ""} — children's social media risk profiles should be reviewed at least termly or when circumstances change.`,
      urgency: "planned",
      regulatory_ref: "KCSIE — Online safety",
    });
  }

  if (overdueAgreements > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        `Review ${overdueAgreements} overdue online access agreement${overdueAgreements !== 1 ? "s" : ""} — agreements should be reviewed regularly to ensure they remain appropriate to each child's age, understanding, and circumstances.`,
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 12/13 — Online safeguarding",
    });
  }

  if (digitalLiteracyEngagementRate >= 50 && digitalLiteracyEngagementRate < 70 && totalDigitalLiteracyRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Enhance digital literacy programme to boost engagement above 70% — consider peer-led sessions, gamification, and linking activities to children's interests and aspirations.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 12 — Good health and well-being",
    });
  }

  if (incidentResponseRate >= 40 && incidentResponseRate < 70 && incidentResponseComponents.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen incident response procedures to ensure all online safety incidents receive a documented response within 24 hours — consistent, timely responses are essential to mitigating ongoing risks.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 13 — Protection of children",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: DigitalSafetyInsight[] = [];

  // -- Critical insights --

  if (esafetyTrainingComplianceRate < 50 && totalTrainingRecords > 0) {
    insights.push({
      text: `Only ${esafetyTrainingComplianceRate}% of e-safety training completed. Ofsted will view the absence of completed digital safety training as evidence that children are not being equipped to protect themselves online. This is a fundamental safeguarding gap under Reg 12 and Reg 13.`,
      severity: "critical",
    });
  }

  if (totalTrainingRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No e-safety training records exist despite children being on placement. Without documented training, the home cannot evidence that children understand online risks, know how to report concerns, or have the knowledge to protect themselves in digital environments.",
      severity: "critical",
    });
  }

  if (accessAgreementCoverageRate < 50 && total_children > 0) {
    insights.push({
      text: `Only ${accessAgreementCoverageRate}% of children have online access agreements. Without clear, documented agreements, children lack understanding of digital boundaries, and the home has no framework for addressing inappropriate online behaviour constructively.`,
      severity: "critical",
    });
  }

  if (usageMonitoringRate < 50 && totalUsageLogs > 0) {
    insights.push({
      text: `Only ${usageMonitoringRate}% of internet usage is actively monitored. Children in care are disproportionately vulnerable to online exploitation, grooming, and harmful content. Without comprehensive monitoring, the home cannot fulfil its safeguarding duties under Reg 13.`,
      severity: "critical",
    });
  }

  if (incidentResponseRate < 40 && incidentResponseComponents.length > 0) {
    insights.push({
      text: `Incident response rate at only ${incidentResponseRate}%. When online safety incidents are not addressed, children remain exposed to ongoing risks. Each unaddressed incident — whether flagged content, a social media concern, or an agreement breach — represents a failure to protect.`,
      severity: "critical",
    });
  }

  if (highRiskUsageCount >= 3) {
    insights.push({
      text: `${highRiskUsageCount} high or critical risk internet usage events recorded. Multiple high-risk events indicate a pattern of concerning online behaviour or exposure that requires a coordinated safeguarding response, potentially including referral to the Local Authority Designated Officer (LADO) or police.`,
      severity: "critical",
    });
  }

  if (privacySettingsComplianceRate < 50 && totalSocialMediaAssessments > 0) {
    insights.push({
      text: `Only ${privacySettingsComplianceRate}% of social media accounts have appropriate privacy settings. Inappropriate privacy settings expose children to contact from strangers, potential grooming, and sharing of personal information that could be used to locate or identify them.`,
      severity: "critical",
    });
  }

  if (socialMediaRiskAssessmentRate < 50 && total_children > 0 && totalSocialMediaAssessments > 0) {
    insights.push({
      text: `Only ${socialMediaRiskAssessmentRate}% of children have had social media risk assessments. Without assessment, the home cannot identify which children are at risk from their social media activity, including exposure to inappropriate content, cyberbullying, or contact from unknown individuals.`,
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (esafetyTrainingComplianceRate >= 50 && esafetyTrainingComplianceRate < 80 && totalTrainingRecords > 0) {
    insights.push({
      text: `E-safety training compliance at ${esafetyTrainingComplianceRate}% — improving but gaps remain. Every child must complete e-safety training to understand the risks they face online and know how to seek help.`,
      severity: "warning",
    });
  }

  if (trainingPassRate >= 50 && trainingPassRate < 70 && totalTrainingRecords > 0) {
    insights.push({
      text: `Training pass rate at ${trainingPassRate}% — some children are not fully grasping e-safety concepts. Consider whether training content is appropriately pitched to each child's age and understanding.`,
      severity: "warning",
    });
  }

  if (usageMonitoringRate >= 50 && usageMonitoringRate < 80 && totalUsageLogs > 0) {
    insights.push({
      text: `Internet usage monitoring at ${usageMonitoringRate}% — gaps in monitoring coverage leave some children's online activity unsupervised. Consistent monitoring across all devices and sessions is essential for safeguarding.`,
      severity: "warning",
    });
  }

  if (staffReviewRate >= 50 && staffReviewRate < 70 && totalUsageLogs > 0) {
    insights.push({
      text: `Staff review rate at ${staffReviewRate}% — not all internet usage logs are being reviewed by staff. Automated monitoring is not sufficient alone; staff review adds contextual understanding of children's online behaviour.`,
      severity: "warning",
    });
  }

  if (socialMediaRiskAssessmentRate >= 50 && socialMediaRiskAssessmentRate < 80 && total_children > 0) {
    insights.push({
      text: `Social media risk assessment coverage at ${socialMediaRiskAssessmentRate}% — some children's social media activity has not been formally assessed. Given the rapidly evolving nature of social media risks, comprehensive coverage is essential.`,
      severity: "warning",
    });
  }

  if (privacySettingsComplianceRate >= 50 && privacySettingsComplianceRate < 80 && totalSocialMediaAssessments > 0) {
    insights.push({
      text: `Privacy settings compliance at ${privacySettingsComplianceRate}% — some children's social media accounts lack appropriate privacy protections. Regular review of privacy settings is needed as platforms frequently change their defaults.`,
      severity: "warning",
    });
  }

  if (accessAgreementCoverageRate >= 50 && accessAgreementCoverageRate < 80 && total_children > 0) {
    insights.push({
      text: `Online access agreement coverage at ${accessAgreementCoverageRate}% — not all children have documented agreements governing their internet use. Agreements provide an important framework for discussing and agreeing digital boundaries.`,
      severity: "warning",
    });
  }

  if (digitalLiteracyEngagementRate >= 50 && digitalLiteracyEngagementRate < 70 && totalDigitalLiteracyRecords > 0) {
    insights.push({
      text: `Digital literacy engagement at ${digitalLiteracyEngagementRate}% — while some children are engaging with digital skills development, a significant proportion are not fully participating. Consider whether the format and content are sufficiently engaging and relevant.`,
      severity: "warning",
    });
  }

  if (incidentResponseRate >= 40 && incidentResponseRate < 70 && incidentResponseComponents.length > 0) {
    insights.push({
      text: `Incident response rate at ${incidentResponseRate}% — some online safety incidents are not receiving a full response. Each unaddressed incident may allow harmful patterns to continue or escalate.`,
      severity: "warning",
    });
  }

  if (overdueTrainingCount > 0 && overdueTrainingCount < 3) {
    insights.push({
      text: `${overdueTrainingCount} overdue e-safety training session${overdueTrainingCount !== 1 ? "s" : ""}. While the number is small, overdue training means some children may not have current knowledge of online risks and protective strategies.`,
      severity: "warning",
    });
  } else if (overdueTrainingCount >= 3) {
    insights.push({
      text: `${overdueTrainingCount} overdue e-safety training sessions. A significant number of overdue sessions indicates systemic issues with training scheduling or completion that require management attention.`,
      severity: "warning",
    });
  }

  if (overdueAssessments > 0) {
    insights.push({
      text: `${overdueAssessments} overdue social media assessment${overdueAssessments !== 1 ? "s" : ""}. Social media platforms and children's online behaviour change rapidly — outdated assessments may not reflect current risks.`,
      severity: "warning",
    });
  }

  if (totalBreaches > 0) {
    insights.push({
      text: `${totalBreaches} online access agreement breach${totalBreaches !== 1 ? "es" : ""} recorded. While breaches are opportunities for learning, a pattern of breaches may indicate that agreements need revising, expectations need clarifying, or additional support is required.`,
      severity: "warning",
    });
  }

  if (highRiskUsageCount > 0 && highRiskUsageCount < 3) {
    insights.push({
      text: `${highRiskUsageCount} high or critical risk internet usage event${highRiskUsageCount !== 1 ? "s" : ""} recorded. Each event should be individually reviewed, discussed with the child, and documented with clear actions taken. Consider whether additional safeguards or monitoring are needed.`,
      severity: "warning",
    });
  }

  if (childInvolvementRate >= 50 && childInvolvementRate < 80 && totalSocialMediaAssessments > 0) {
    insights.push({
      text: `Children involved in ${childInvolvementRate}% of social media assessments — increasing child involvement helps them understand risks and develop their own protective strategies, which is more effective than top-down monitoring alone.`,
      severity: "warning",
    });
  }

  if (trainingFollowUpRate < 70 && followUpRequired > 0) {
    insights.push({
      text: `Only ${trainingFollowUpRate}% of required training follow-ups have been completed. When follow-up is needed after e-safety training, it typically indicates the child needs additional support to understand key concepts — leaving these incomplete undermines the training's effectiveness.`,
      severity: "warning",
    });
  }

  // Platform analysis for social media
  const platformCounts: Record<string, number> = {};
  for (const assessment of social_media_assessments) {
    platformCounts[assessment.platform] = (platformCounts[assessment.platform] ?? 0) + 1;
  }
  const topPlatforms = Object.entries(platformCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topPlatforms.length > 0) {
    const highRiskPlatforms = social_media_assessments.filter(
      (a) => a.risk_level === "high" || a.risk_level === "critical",
    );
    const highRiskPlatformNames = [...new Set(highRiskPlatforms.map((a) => a.platform))];
    if (highRiskPlatformNames.length > 0) {
      insights.push({
        text: `High or critical risk levels identified on platform${highRiskPlatformNames.length !== 1 ? "s" : ""}: ${highRiskPlatformNames.join(", ")}. These platforms require enhanced monitoring and may warrant restricting access depending on the individual child's risk profile and care plan.`,
        severity: "warning",
      });
    }
  }

  // Flagged content category analysis
  const categoryCount: Record<string, number> = {};
  for (const log of internet_usage_logs) {
    if (log.flagged_content && log.flagged_content_category) {
      categoryCount[log.flagged_content_category] =
        (categoryCount[log.flagged_content_category] ?? 0) + 1;
    }
  }
  const topCategories = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topCategories.length > 0) {
    insights.push({
      text: `Most common flagged content categories: ${topCategories.map(([cat, count]) => `"${cat}" (${count} instance${count !== 1 ? "s" : ""})`).join(", ")}. Understanding content categories helps target e-safety training to address the specific risks children are encountering.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (digital_safety_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding digital safety and online protection — e-safety training is comprehensive, internet monitoring is thorough, social media risks are actively assessed, online access agreements are in place, and incidents are responded to promptly. This is strong evidence of Reg 12/13 compliance and effective online safeguarding.",
      severity: "positive",
    });
  }

  if (esafetyTrainingComplianceRate >= 100 && trainingPassRate >= 90 && totalTrainingRecords > 0) {
    insights.push({
      text: `All e-safety training completed with a ${trainingPassRate}% pass rate — children are not only receiving training but demonstrating genuine understanding of online safety concepts. This comprehensive approach equips children with the knowledge to protect themselves.`,
      severity: "positive",
    });
  }

  if (usageMonitoringRate >= 90 && staffReviewRate >= 90 && totalUsageLogs > 0) {
    insights.push({
      text: `${usageMonitoringRate}% monitoring with ${staffReviewRate}% staff review — the home operates a dual-layer approach to internet safety combining automated monitoring with human oversight. This is best practice in online safeguarding.`,
      severity: "positive",
    });
  }

  if (
    socialMediaRiskAssessmentRate >= 100 &&
    privacySettingsComplianceRate >= 90 &&
    total_children > 0 &&
    totalSocialMediaAssessments > 0
  ) {
    insights.push({
      text: `Every child has a social media risk assessment with ${privacySettingsComplianceRate}% privacy compliance — the home maintains comprehensive oversight of children's social media presence, ensuring accounts are configured safely and risks are identified proactively.`,
      severity: "positive",
    });
  }

  if (
    accessAgreementCoverageRate >= 100 &&
    childSignatureRate >= 90 &&
    total_children > 0 &&
    activeAgreements > 0
  ) {
    insights.push({
      text: `Every child has an online access agreement with ${childSignatureRate}% signed by the child — agreements are not just administrative documents but genuine conversations about digital expectations and responsibilities.`,
      severity: "positive",
    });
  }

  if (digitalLiteracyEngagementRate >= 90 && totalDigitalLiteracyRecords > 0) {
    insights.push({
      text: `${digitalLiteracyEngagementRate}% engagement in digital literacy — children are actively developing the digital skills and critical thinking they need to navigate the online world safely and effectively. This proactive approach builds lasting protective factors.`,
      severity: "positive",
    });
  }

  if (incidentResponseRate >= 90 && incidentResponseComponents.length > 0) {
    insights.push({
      text: `${incidentResponseRate}% incident response rate — the home demonstrates a robust, responsive approach to online safety incidents. Prompt, documented responses to flagged content, concerns, and breaches ensure children are protected and supported.`,
      severity: "positive",
    });
  }

  if (flaggedContentResponseRate >= 100 && flaggedContentLogs > 0) {
    insights.push({
      text: "Every instance of flagged content has received a documented response — the home takes a zero-tolerance approach to inappropriate online content, ensuring every incident is investigated, discussed with the child, and resolved.",
      severity: "positive",
    });
  }

  if (
    parentalControlsRate >= 90 &&
    ageFilterRate >= 90 &&
    totalUsageLogs > 0
  ) {
    insights.push({
      text: `${parentalControlsRate}% parental controls and ${ageFilterRate}% age-appropriate filtering — robust technical safeguards are in place across all devices, providing essential baseline protection that complements monitoring and education.`,
      severity: "positive",
    });
  }

  if (concernResolutionRate >= 100 && concernsRaised > 0) {
    insights.push({
      text: "Every internet usage concern has been resolved — the home demonstrates thorough follow-through on all identified online safety concerns, ensuring children are supported and protected.",
      severity: "positive",
    });
  }

  if (escalationRate >= 100 && concernsIdentified > 0) {
    insights.push({
      text: "Every identified social media concern has been appropriately escalated — the home's escalation procedures are working effectively, ensuring serious online risks receive the attention they require.",
      severity: "positive",
    });
  }

  if (certifications >= 3) {
    insights.push({
      text: `${certifications} digital safety certifications earned — the home is supporting children to achieve formal recognition of their digital literacy, which builds confidence and demonstrates competence in online safety.`,
      severity: "positive",
    });
  }

  if (
    trainingEngagementRate >= 90 &&
    trainingUnderstandingRate >= 90 &&
    totalTrainingRecords > 0
  ) {
    insights.push({
      text: `${trainingEngagementRate}% training engagement and ${trainingUnderstandingRate}% understanding — e-safety training is not just being delivered but is genuinely engaging children and building their understanding of online risks. This evidences high-quality, child-centred digital safety education.`,
      severity: "positive",
    });
  }

  if (childInvolvementRate >= 80 && totalSocialMediaAssessments > 0) {
    insights.push({
      text: `${childInvolvementRate}% child involvement in social media assessments — the home treats children as partners in managing their online safety, empowering them to understand risks and develop their own protective strategies.`,
      severity: "positive",
    });
  }

  if (monitoringPlanRate >= 90 && totalSocialMediaAssessments > 0) {
    insights.push({
      text: `${monitoringPlanRate}% of social media assessments have monitoring plans in place — ongoing, structured oversight ensures that identified risks are continuously managed rather than reviewed once and forgotten.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (digital_safety_rating === "outstanding") {
    headline =
      "Outstanding digital safety and online protection — e-safety training is comprehensive, internet monitoring is thorough, and children are well-supported to navigate the digital world safely.";
  } else if (digital_safety_rating === "good") {
    headline = `Good digital safety and online protection — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (digital_safety_rating === "adequate") {
    headline = `Adequate digital safety and online protection — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure children are fully protected online.`;
  } else {
    headline = `Digital safety and online protection is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to safeguard children from online risks.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    digital_safety_rating,
    digital_safety_score: score,
    headline,
    total_training_records: totalTrainingRecords,
    total_usage_logs: totalUsageLogs,
    total_social_media_assessments: totalSocialMediaAssessments,
    total_access_agreements: totalAccessAgreements,
    total_digital_literacy_records: totalDigitalLiteracyRecords,
    esafety_training_compliance_rate: esafetyTrainingComplianceRate,
    usage_monitoring_rate: usageMonitoringRate,
    social_media_risk_assessment_rate: socialMediaRiskAssessmentRate,
    access_agreement_coverage_rate: accessAgreementCoverageRate,
    digital_literacy_engagement_rate: digitalLiteracyEngagementRate,
    incident_response_rate: incidentResponseRate,
    training_pass_rate: trainingPassRate,
    overdue_training_count: overdueTrainingCount,
    high_risk_usage_count: highRiskUsageCount,
    flagged_content_count: flaggedContentCount,
    privacy_settings_compliance_rate: privacySettingsComplianceRate,
    agreement_breach_count: agreementBreachCount,
    children_with_training: childrenWithTraining,
    children_with_agreements: childrenWithAgreements,
    children_with_assessments: childrenWithAssessments,
    children_with_monitoring: childrenWithMonitoring,
    children_with_literacy_support: childrenWithLiteracySupport,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
