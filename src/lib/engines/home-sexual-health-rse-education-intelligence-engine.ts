import { below, meets, rate } from "@/lib/metrics/rate";
// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME SEXUAL HEALTH & RSE EDUCATION INTELLIGENCE ENGINE
// Monitors how effectively the home delivers relationships and sex education,
// ensures sexual health screening compliance, provides age-appropriate guidance,
// delivers consent education, and maintains safeguarding awareness.
// Measures RSE delivery rate, health screening compliance, age-appropriate
// guidance coverage, consent education effectiveness, safeguarding awareness
// rate, and child confidence in accessing support.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 5 (RSE education), Reg 14 (Health care),
// Reg 34 (Safeguarding), SCCIF health and wellbeing.
// Store keys: rseEducationRecords, sexualHealthScreeningRecords,
//             ageGuidanceRecords, consentEducationRecords,
//             safeguardingAwarenessRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface RseEducationRecordInput {
  id: string;
  child_id: string;
  session_date: string;
  session_type: "one_to_one" | "group" | "workshop" | "online" | "peer_led";
  topic: "relationships" | "consent" | "online_safety" | "healthy_boundaries" | "identity_diversity" | "contraception" | "sti_awareness" | "emotional_wellbeing" | "puberty" | "exploitation_awareness";
  facilitator_name: string;
  facilitator_qualified: boolean;
  duration_minutes: number;
  child_engaged: boolean;
  child_feedback_positive: boolean;
  learning_objectives_met: boolean;
  follow_up_needed: boolean;
  follow_up_completed: boolean;
  age_appropriate: boolean;
  materials_used: boolean;
  parent_carer_informed: boolean;
  notes_recorded: boolean;
  created_at: string;
}

export interface SexualHealthScreeningRecordInput {
  id: string;
  child_id: string;
  screening_type: "routine" | "requested" | "concern_led" | "annual" | "follow_up";
  date_due: string;
  date_completed: string | null;
  completed: boolean;
  overdue: boolean;
  provider: "gp" | "sexual_health_clinic" | "school_nurse" | "specialist" | "other";
  child_consented: boolean;
  outcome_recorded: boolean;
  follow_up_needed: boolean;
  follow_up_completed: boolean;
  confidentiality_explained: boolean;
  child_comfortable: boolean;
  staff_supported_attendance: boolean;
  created_at: string;
}

export interface AgeGuidanceRecordInput {
  id: string;
  child_id: string;
  guidance_date: string;
  guidance_type: "verbal" | "written" | "visual" | "digital" | "peer_support";
  topic: "puberty" | "healthy_relationships" | "online_safety" | "consent" | "contraception" | "identity" | "boundaries" | "body_autonomy" | "emotional_literacy" | "exploitation_risks";
  age_appropriate: boolean;
  developmental_stage_considered: boolean;
  child_understanding_confirmed: boolean;
  child_questions_answered: boolean;
  delivered_by: string;
  delivered_by_qualified: boolean;
  parent_carer_aware: boolean;
  cultural_sensitivity_considered: boolean;
  follow_up_planned: boolean;
  follow_up_completed: boolean;
  notes_recorded: boolean;
  created_at: string;
}

export interface ConsentEducationRecordInput {
  id: string;
  child_id: string;
  session_date: string;
  session_type: "one_to_one" | "group" | "role_play" | "scenario_based" | "peer_discussion";
  topic: "what_is_consent" | "saying_no" | "recognising_pressure" | "online_consent" | "relationship_consent" | "body_autonomy" | "coercive_control" | "power_dynamics";
  child_demonstrated_understanding: boolean;
  child_can_articulate_consent: boolean;
  child_identifies_pressure: boolean;
  child_knows_who_to_tell: boolean;
  facilitator_name: string;
  facilitator_qualified: boolean;
  age_appropriate: boolean;
  scenario_practice_included: boolean;
  child_feedback_positive: boolean;
  review_date: string | null;
  review_overdue: boolean;
  notes_recorded: boolean;
  created_at: string;
}

export interface SafeguardingAwarenessRecordInput {
  id: string;
  child_id: string;
  assessment_date: string;
  assessment_type: "formal" | "informal" | "observation" | "self_report" | "staff_assessment";
  child_knows_safe_adults: boolean;
  child_knows_how_to_report: boolean;
  child_understands_exploitation: boolean;
  child_understands_online_risks: boolean;
  child_understands_grooming: boolean;
  child_can_identify_unsafe_situations: boolean;
  child_confidence_score: number | null; // 1-10
  child_willingness_to_disclose: boolean;
  staff_confidence_in_child: number; // 1-5
  areas_for_development: string[];
  support_plan_in_place: boolean;
  review_date: string | null;
  review_overdue: boolean;
  created_at: string;
}

export interface SexualHealthRseInput {
  today: string;
  total_children: number;
  rse_education_records: RseEducationRecordInput[];
  sexual_health_screening_records: SexualHealthScreeningRecordInput[];
  age_guidance_records: AgeGuidanceRecordInput[];
  consent_education_records: ConsentEducationRecordInput[];
  safeguarding_awareness_records: SafeguardingAwarenessRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type SexualHealthRseRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface SexualHealthRseInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface SexualHealthRseRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface SexualHealthRseResult {
  rse_rating: SexualHealthRseRating;
  rse_score: number | null;
  headline: string;
  total_rse_sessions: number;
  rse_delivery_rate: number | null;
  health_screening_rate: number | null;
  age_appropriate_rate: number | null;
  consent_education_rate: number | null;
  safeguarding_awareness_rate: number | null;
  child_confidence_rate: number | null;
  screening_compliance_avg: number | null;
  consent_understanding_avg: number | null;
  strengths: string[];
  concerns: string[];
  recommendations: SexualHealthRseRecommendation[];
  insights: SexualHealthRseInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): SexualHealthRseRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: SexualHealthRseRating,
  score: number,
  headline: string,
): SexualHealthRseResult {
  return {
    rse_rating: rating,
    rse_score: score,
    headline,
    total_rse_sessions: 0,
    rse_delivery_rate: null,
    health_screening_rate: null,
    age_appropriate_rate: null,
    consent_education_rate: null,
    safeguarding_awareness_rate: null,
    child_confidence_rate: null,
    screening_compliance_avg: 0,
    consent_understanding_avg: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeSexualHealthRseEducation(
  input: SexualHealthRseInput,
): SexualHealthRseResult {
  const {
    total_children,
    rse_education_records,
    sexual_health_screening_records,
    age_guidance_records,
    consent_education_records,
    safeguarding_awareness_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    rse_education_records.length === 0 &&
    sexual_health_screening_records.length === 0 &&
    age_guidance_records.length === 0 &&
    consent_education_records.length === 0 &&
    safeguarding_awareness_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess sexual health and RSE education provision.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No RSE education or sexual health data recorded despite children on placement — relationships and sex education, sexual health screening, and safeguarding awareness require urgent attention.",
      ),
      concerns: [
        "No RSE education sessions, sexual health screenings, age-appropriate guidance, consent education, or safeguarding awareness records exist despite children being on placement — the home cannot evidence that it meets its duty to provide relationships and sex education or support children's sexual health needs.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement a structured RSE education programme for all children immediately — the home has a duty under Reg 5 to ensure children receive age-appropriate relationships and sex education that prepares them for adult life and protects them from exploitation.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 5 — RSE education",
        },
        {
          rank: 2,
          recommendation:
            "Establish a sexual health screening and support pathway for all children — ensure that where screening is appropriate, children are supported to access sexual health services with full confidentiality and informed consent.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 14 — Health care",
        },
      ],
      insights: [
        {
          text: "The complete absence of RSE education and sexual health records means the home cannot demonstrate compliance with its duty to provide relationships and sex education (Reg 5), support children's health needs (Reg 14), or ensure children understand consent and exploitation as part of safeguarding (Reg 34). This represents a fundamental gap in the home's provision that Ofsted will view as a significant shortfall.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- RSE delivery rate ---
  const totalRseSessions = rse_education_records.length;
  const uniqueChildrenWithRse = new Set(
    rse_education_records.map((r) => r.child_id),
  ).size;
  const rseDeliveryRate =
    total_children > 0 ? rate(uniqueChildrenWithRse, total_children) : 0;

  // --- RSE quality metrics ---
  const rseObjectivesMet = rse_education_records.filter(
    (r) => r.learning_objectives_met,
  ).length;
  const rseObjectivesMetRate = rate(rseObjectivesMet, totalRseSessions);

  const rseChildEngaged = rse_education_records.filter(
    (r) => r.child_engaged,
  ).length;
  const rseEngagementRate = rate(rseChildEngaged, totalRseSessions);

  const rseChildFeedbackPositive = rse_education_records.filter(
    (r) => r.child_feedback_positive,
  ).length;
  const rseFeedbackPositiveRate = rate(rseChildFeedbackPositive, totalRseSessions);

  const rseFacilitatorQualified = rse_education_records.filter(
    (r) => r.facilitator_qualified,
  ).length;
  const rseFacilitatorQualifiedRate = rate(rseFacilitatorQualified, totalRseSessions);

  const rseNotesRecorded = rse_education_records.filter(
    (r) => r.notes_recorded,
  ).length;
  const rseDocumentationRate = rate(rseNotesRecorded, totalRseSessions);

  const rseFollowUpNeeded = rse_education_records.filter(
    (r) => r.follow_up_needed,
  ).length;
  const rseFollowUpCompleted = rse_education_records.filter(
    (r) => r.follow_up_needed && r.follow_up_completed,
  ).length;
  const rseFollowUpCompletionRate = rate(rseFollowUpCompleted, rseFollowUpNeeded);

  // --- RSE topic coverage ---
  const rseTopicsCovered = new Set(
    rse_education_records.map((r) => r.topic),
  ).size;
  const totalRseTopics = 10; // total possible topics
  const rseTopicCoverageRate = rate(rseTopicsCovered, totalRseTopics);

  // --- Sexual health screening ---
  const totalScreenings = sexual_health_screening_records.length;
  const uniqueChildrenScreened = new Set(
    sexual_health_screening_records.map((s) => s.child_id),
  ).size;
  const healthScreeningRate =
    total_children > 0 ? rate(uniqueChildrenScreened, total_children) : 0;

  const completedScreenings = sexual_health_screening_records.filter(
    (s) => s.completed,
  ).length;
  const screeningCompletionRate = rate(completedScreenings, totalScreenings);

  const overdueScreenings = sexual_health_screening_records.filter(
    (s) => s.overdue,
  ).length;
  const screeningOverdueCount = overdueScreenings;

  const screeningConsented = sexual_health_screening_records.filter(
    (s) => s.child_consented,
  ).length;
  const screeningConsentRate = rate(screeningConsented, totalScreenings);

  const screeningConfidentialityExplained = sexual_health_screening_records.filter(
    (s) => s.confidentiality_explained,
  ).length;
  const confidentialityExplainedRate = rate(screeningConfidentialityExplained, totalScreenings);

  const screeningFollowUpNeeded = sexual_health_screening_records.filter(
    (s) => s.follow_up_needed,
  ).length;
  const screeningFollowUpCompleted = sexual_health_screening_records.filter(
    (s) => s.follow_up_needed && s.follow_up_completed,
  ).length;
  const screeningFollowUpRate = rate(screeningFollowUpCompleted, screeningFollowUpNeeded);

  // Screening compliance average (composite of completion + consent + confidentiality)
  const screeningComplianceAvg =
    totalScreenings > 0 ? Math.round(
          (screeningCompletionRate! + screeningConsentRate! + confidentialityExplainedRate!) / 3) : null;

  // --- Age-appropriate guidance ---
  const totalGuidance = age_guidance_records.length;

  const guidanceAgeAppropriate = age_guidance_records.filter(
    (g) => g.age_appropriate,
  ).length;
  const ageAppropriateRate = rate(guidanceAgeAppropriate, totalGuidance);

  const guidanceDevelopmentalConsidered = age_guidance_records.filter(
    (g) => g.developmental_stage_considered,
  ).length;
  const developmentalConsiderationRate = rate(guidanceDevelopmentalConsidered, totalGuidance);

  const guidanceCulturalSensitivity = age_guidance_records.filter(
    (g) => g.cultural_sensitivity_considered,
  ).length;
  const culturalSensitivityRate = rate(guidanceCulturalSensitivity, totalGuidance);

  // --- Consent education ---
  const totalConsentSessions = consent_education_records.length;
  const uniqueChildrenConsentEd = new Set(
    consent_education_records.map((c) => c.child_id),
  ).size;
  const consentEducationRate =
    total_children > 0 ? rate(uniqueChildrenConsentEd, total_children) : 0;

  const consentDemonstratedUnderstanding = consent_education_records.filter(
    (c) => c.child_demonstrated_understanding,
  ).length;
  const consentUnderstandingRate = rate(consentDemonstratedUnderstanding, totalConsentSessions);

  const consentCanArticulate = consent_education_records.filter(
    (c) => c.child_can_articulate_consent,
  ).length;
  const consentArticulationRate = rate(consentCanArticulate, totalConsentSessions);

  const consentIdentifiesPressure = consent_education_records.filter(
    (c) => c.child_identifies_pressure,
  ).length;
  const pressureIdentificationRate = rate(consentIdentifiesPressure, totalConsentSessions);

  const consentKnowsWhoToTell = consent_education_records.filter(
    (c) => c.child_knows_who_to_tell,
  ).length;
  const knowsWhoToTellRate = rate(consentKnowsWhoToTell, totalConsentSessions);

  const consentScenarioPractice = consent_education_records.filter(
    (c) => c.scenario_practice_included,
  ).length;
  const scenarioPracticeRate = rate(consentScenarioPractice, totalConsentSessions);

  const overdueConsentReviews = consent_education_records.filter(
    (c) => c.review_overdue,
  ).length;

  // Consent understanding average (composite of understanding + articulation + pressure + knows who to tell)
  const consentUnderstandingAvg =
    totalConsentSessions > 0 ? Math.round(
          (consentUnderstandingRate! + consentArticulationRate! + pressureIdentificationRate! + knowsWhoToTellRate!) / 4) : null;

  // --- Safeguarding awareness ---
  const totalSafeguardingAssessments = safeguarding_awareness_records.length;
  const uniqueChildrenSafeguarding = new Set(
    safeguarding_awareness_records.map((s) => s.child_id),
  ).size;
  const safeguardingAwarenessRate =
    total_children > 0 ? rate(uniqueChildrenSafeguarding, total_children) : 0;

  const sgKnowsHowToReport = safeguarding_awareness_records.filter(
    (s) => s.child_knows_how_to_report,
  ).length;
  const knowsHowToReportRate = rate(sgKnowsHowToReport, totalSafeguardingAssessments);

  const sgUnderstandsExploitation = safeguarding_awareness_records.filter(
    (s) => s.child_understands_exploitation,
  ).length;
  const understandsExploitationRate = rate(sgUnderstandsExploitation, totalSafeguardingAssessments);

  const sgUnderstandsGrooming = safeguarding_awareness_records.filter(
    (s) => s.child_understands_grooming,
  ).length;
  const understandsGroomingRate = rate(sgUnderstandsGrooming, totalSafeguardingAssessments);

  const sgWillingToDisclose = safeguarding_awareness_records.filter(
    (s) => s.child_willingness_to_disclose,
  ).length;
  const willingnessToDiscloseRate = rate(sgWillingToDisclose, totalSafeguardingAssessments);

  const overdueSafeguardingReviews = safeguarding_awareness_records.filter(
    (s) => s.review_overdue,
  ).length;

  // Child confidence scores
  const confidenceScoreSum = safeguarding_awareness_records.reduce(
    (sum, s) => sum + (s.child_confidence_score ?? 0),
    0,
  );
  const childConfidenceAvg =
    totalSafeguardingAssessments > 0
      ? Math.round((confidenceScoreSum / totalSafeguardingAssessments) * 100) / 100
      : null;

  // Staff confidence in child
  const staffConfidenceSum = safeguarding_awareness_records.reduce(
    (sum, s) => sum + s.staff_confidence_in_child,
    0,
  );
  const staffConfidenceAvg =
    totalSafeguardingAssessments > 0
      ? Math.round((staffConfidenceSum / totalSafeguardingAssessments) * 100) / 100
      : null;

  // --- Child confidence rate (composite across consent ed + safeguarding awareness) ---
  // Based on child confidence scores >= 7/10 in safeguarding + consent demonstrated understanding
  const childrenConfidentSafeguarding = safeguarding_awareness_records.filter(
    (s) => (s.child_confidence_score ?? 0) >= 7,
  ).length;
  const totalConfidenceOpportunities = totalSafeguardingAssessments + totalConsentSessions;
  const totalConfidencePositive = childrenConfidentSafeguarding + consentDemonstratedUnderstanding;
  const childConfidenceRate = rate(totalConfidencePositive, totalConfidenceOpportunities);

  // ── Scoring: base 52 ─────────────────────────────────────────────────

  let score = 52;

  // --- Bonus 1: rseDeliveryRate (>=100: +4, >=80: +2) ---
  if (meets(rseDeliveryRate, 100)) score += 4;
  else if (meets(rseDeliveryRate, 80)) score += 2;

  // --- Bonus 2: healthScreeningRate (>=100: +4, >=80: +2) ---
  if (meets(healthScreeningRate, 100)) score += 4;
  else if (meets(healthScreeningRate, 80)) score += 2;

  // --- Bonus 3: ageAppropriateRate (>=95: +3, >=80: +1) ---
  if (meets(ageAppropriateRate, 95)) score += 3;
  else if (meets(ageAppropriateRate, 80)) score += 1;

  // --- Bonus 4: consentEducationRate (>=100: +4, >=80: +2) ---
  if (meets(consentEducationRate, 100)) score += 4;
  else if (meets(consentEducationRate, 80)) score += 2;

  // --- Bonus 5: safeguardingAwarenessRate (>=100: +4, >=80: +2) ---
  if (meets(safeguardingAwarenessRate, 100)) score += 4;
  else if (meets(safeguardingAwarenessRate, 80)) score += 2;

  // --- Bonus 6: childConfidenceRate (>=90: +3, >=70: +1) ---
  if (meets(childConfidenceRate, 90)) score += 3;
  else if (meets(childConfidenceRate, 70)) score += 1;

  // --- Bonus 7: consentUnderstandingAvg (>=80: +3, >=60: +1) ---
  if ((consentUnderstandingAvg ?? 0) >= 80) score += 3;
  else if ((consentUnderstandingAvg ?? 0) >= 60) score += 1;

  // --- Bonus 8: rseObjectivesMetRate (>=90: +2, >=70: +1) ---
  if (meets(rseObjectivesMetRate, 90)) score += 2;
  else if (meets(rseObjectivesMetRate, 70)) score += 1;

  // --- Bonus 9: screeningComplianceAvg (>=90: +1) ---
  if ((screeningComplianceAvg ?? 0) >= 90) score += 1;

  // ── Penalties ─────────────────────────────────────────────────────────

  // rseDeliveryRate < 50 → -5
  if (below(rseDeliveryRate, 50) && total_children > 0) score -= 5;

  // consentEducationRate < 50 → -5
  if (below(consentEducationRate, 50) && total_children > 0) score -= 5;

  // safeguardingAwarenessRate < 50 → -4
  if (below(safeguardingAwarenessRate, 50) && total_children > 0) score -= 4;

  // healthScreeningRate < 40 with overdue screenings → -4
  if (below(healthScreeningRate, 40) && sexual_health_screening_records.length > 0) score -= 4;

  score = clamp(score, 0, 100);

  const rse_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (meets(rseDeliveryRate, 100) && total_children > 0) {
    strengths.push(
      "Every child is receiving relationships and sex education — the home demonstrates comprehensive RSE delivery, ensuring all children are prepared with age-appropriate knowledge about relationships, consent, and sexual health.",
    );
  } else if (meets(rseDeliveryRate, 80) && total_children > 0) {
    strengths.push(
      `${rseDeliveryRate}% of children receiving RSE education — strong coverage in delivering relationships and sex education across the home.`,
    );
  }

  if (meets(healthScreeningRate, 100) && total_children > 0) {
    strengths.push(
      "Every child has been supported to access sexual health screening — the home ensures comprehensive health screening coverage with full confidentiality and consent.",
    );
  } else if (meets(healthScreeningRate, 80) && total_children > 0) {
    strengths.push(
      `${healthScreeningRate}% of children supported with sexual health screening — strong compliance with health screening responsibilities.`,
    );
  }

  if (meets(ageAppropriateRate, 95) && totalGuidance > 0) {
    strengths.push(
      `${ageAppropriateRate}% of guidance confirmed as age-appropriate — the home consistently tailors sexual health and RSE content to each child's developmental stage and understanding.`,
    );
  } else if (meets(ageAppropriateRate, 80) && totalGuidance > 0) {
    strengths.push(
      `${ageAppropriateRate}% age-appropriate guidance delivery — the home generally ensures that information is matched to children's developmental readiness.`,
    );
  }

  if (meets(consentEducationRate, 100) && total_children > 0) {
    strengths.push(
      "Every child has received consent education — the home provides comprehensive teaching on consent, boundaries, and recognising coercive behaviour.",
    );
  } else if (meets(consentEducationRate, 80) && total_children > 0) {
    strengths.push(
      `${consentEducationRate}% of children receiving consent education — strong coverage in teaching children about consent, healthy boundaries, and their right to say no.`,
    );
  }

  if (meets(safeguardingAwarenessRate, 100) && total_children > 0) {
    strengths.push(
      "Every child has had their safeguarding awareness assessed — the home comprehensively evaluates whether children can recognise and respond to unsafe situations including exploitation and grooming.",
    );
  } else if (meets(safeguardingAwarenessRate, 80) && total_children > 0) {
    strengths.push(
      `${safeguardingAwarenessRate}% of children assessed for safeguarding awareness — strong coverage in ensuring children understand how to keep themselves safe.`,
    );
  }

  if (meets(childConfidenceRate, 90) && totalConfidenceOpportunities > 0) {
    strengths.push(
      `${childConfidenceRate}% child confidence rate — children overwhelmingly demonstrate confidence in their understanding of consent, relationships, and safeguarding, indicating effective education.`,
    );
  } else if (meets(childConfidenceRate, 70) && totalConfidenceOpportunities > 0) {
    strengths.push(
      `${childConfidenceRate}% child confidence — the majority of children feel confident in their understanding of consent and safeguarding.`,
    );
  }

  if ((consentUnderstandingAvg ?? 0) >= 80 && totalConsentSessions > 0) {
    strengths.push(
      `Consent understanding composite at ${consentUnderstandingAvg}% — children demonstrate strong grasp of consent principles, can articulate boundaries, identify pressure, and know who to tell when they feel unsafe.`,
    );
  } else if ((consentUnderstandingAvg ?? 0) >= 60 && totalConsentSessions > 0) {
    strengths.push(
      `Consent understanding at ${consentUnderstandingAvg}% — most children demonstrate adequate understanding of consent and boundaries.`,
    );
  }

  if (meets(rseObjectivesMetRate, 90) && totalRseSessions > 0) {
    strengths.push(
      `${rseObjectivesMetRate}% of RSE sessions meeting learning objectives — education sessions are well-planned, purposeful, and achieving their intended outcomes.`,
    );
  } else if (meets(rseObjectivesMetRate, 70) && totalRseSessions > 0) {
    strengths.push(
      `${rseObjectivesMetRate}% RSE learning objectives met — the majority of education sessions achieve their planned outcomes.`,
    );
  }

  if (meets(rseFacilitatorQualifiedRate, 90) && totalRseSessions > 0) {
    strengths.push(
      `${rseFacilitatorQualifiedRate}% of RSE sessions delivered by qualified facilitators — the home ensures that sensitive topics are delivered by appropriately trained staff.`,
    );
  } else if (meets(rseFacilitatorQualifiedRate, 70) && totalRseSessions > 0) {
    strengths.push(
      `${rseFacilitatorQualifiedRate}% of RSE sessions have qualified facilitators — the home generally ensures facilitator competence for sensitive education topics.`,
    );
  }

  if (meets(screeningConsentRate, 95) && totalScreenings > 0) {
    strengths.push(
      "Children's consent is obtained for the vast majority of sexual health screenings — the home respects children's bodily autonomy and right to make informed decisions about their health care.",
    );
  }

  if (meets(confidentialityExplainedRate, 95) && totalScreenings > 0) {
    strengths.push(
      "Confidentiality is explained in virtually all screening encounters — children are supported to understand that their sexual health information is private and protected.",
    );
  }

  if (meets(culturalSensitivityRate, 90) && totalGuidance > 0) {
    strengths.push(
      `${culturalSensitivityRate}% of guidance considers cultural sensitivity — the home respects and accommodates children's cultural, religious, and personal values in RSE delivery.`,
    );
  }

  if (meets(scenarioPracticeRate, 80) && totalConsentSessions > 0) {
    strengths.push(
      `${scenarioPracticeRate}% of consent sessions include scenario practice — children are given practical opportunities to rehearse saying no, setting boundaries, and responding to pressure.`,
    );
  }

  if (meets(rseTopicCoverageRate, 80)) {
    strengths.push(
      `RSE topic coverage at ${rseTopicCoverageRate}% — the home delivers a broad curriculum covering the full range of relationships, consent, online safety, and exploitation awareness topics.`,
    );
  }

  if (meets(willingnessToDiscloseRate, 80) && totalSafeguardingAssessments > 0) {
    strengths.push(
      `${willingnessToDiscloseRate}% of children willing to disclose concerns — children feel safe and trusting enough to tell adults when something is wrong.`,
    );
  }

  if (meets(understandsGroomingRate, 80) && totalSafeguardingAssessments > 0) {
    strengths.push(
      `${understandsGroomingRate}% of children understand grooming behaviours — strong safeguarding awareness that helps protect children from exploitation.`,
    );
  }

  if (meets(rseDocumentationRate, 90) && totalRseSessions > 0) {
    strengths.push(
      `${rseDocumentationRate}% of RSE sessions have recorded notes — strong documentation practice supporting evidence of education delivery.`,
    );
  }

  if (meets(rseFollowUpCompletionRate, 90) && rseFollowUpNeeded > 0) {
    strengths.push(
      `${rseFollowUpCompletionRate}% of RSE follow-ups completed — the home reliably follows through when children need additional support or information.`,
    );
  }

  if (meets(screeningFollowUpRate, 90) && screeningFollowUpNeeded > 0) {
    strengths.push(
      `${screeningFollowUpRate}% of screening follow-ups completed — the home ensures continuity of care when screening identifies further needs.`,
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (below(rseDeliveryRate, 50) && total_children > 0) {
    concerns.push(
      `Only ${rseDeliveryRate}% of children receiving RSE education — the majority of children are not receiving relationships and sex education, leaving them without essential knowledge about relationships, consent, and sexual health that they need to stay safe.`,
    );
  } else if (below(rseDeliveryRate, 80) && meets(rseDeliveryRate, 50) && total_children > 0) {
    concerns.push(
      `RSE delivery rate at ${rseDeliveryRate}% — some children are not receiving relationships and sex education, which may leave gaps in their understanding of consent, healthy relationships, and exploitation.`,
    );
  }

  if (below(healthScreeningRate, 40) && totalScreenings > 0) {
    concerns.push(
      `Only ${healthScreeningRate}% of children supported with sexual health screening — the majority of children are not being supported to access appropriate health screening, and the home cannot evidence compliance with its health care duties.`,
    );
  } else if (below(healthScreeningRate, 80) && meets(healthScreeningRate, 40) && totalScreenings > 0) {
    concerns.push(
      `Health screening rate at ${healthScreeningRate}% — some children have not been supported to access sexual health screening where appropriate.`,
    );
  }

  if (below(ageAppropriateRate, 70) && totalGuidance > 0) {
    concerns.push(
      `Only ${ageAppropriateRate}% of guidance confirmed as age-appropriate — a significant proportion of sexual health and RSE guidance may not be matched to children's developmental stage, risking harm through inappropriate content or insufficient information.`,
    );
  } else if (below(ageAppropriateRate, 80) && meets(ageAppropriateRate, 70) && totalGuidance > 0) {
    concerns.push(
      `Age-appropriate guidance rate at ${ageAppropriateRate}% — some guidance sessions have not been confirmed as age-appropriate, which requires review.`,
    );
  }

  if (below(consentEducationRate, 50) && total_children > 0) {
    concerns.push(
      `Only ${consentEducationRate}% of children receiving consent education — the majority of children have not been taught about consent, boundaries, and their right to say no. This is a serious safeguarding concern as children without consent education are more vulnerable to exploitation.`,
    );
  } else if (below(consentEducationRate, 80) && meets(consentEducationRate, 50) && total_children > 0) {
    concerns.push(
      `Consent education coverage at ${consentEducationRate}% — some children have not received education on consent and boundaries, leaving potential gaps in their ability to protect themselves.`,
    );
  }

  if (below(safeguardingAwarenessRate, 50) && total_children > 0) {
    concerns.push(
      `Only ${safeguardingAwarenessRate}% of children assessed for safeguarding awareness — the majority of children have not had their understanding of exploitation, grooming, and unsafe situations evaluated. Without assessment, the home cannot identify and address gaps in children's protective knowledge.`,
    );
  } else if (below(safeguardingAwarenessRate, 80) && meets(safeguardingAwarenessRate, 50) && total_children > 0) {
    concerns.push(
      `Safeguarding awareness assessment at ${safeguardingAwarenessRate}% — some children's understanding of safeguarding has not been assessed, potentially leaving vulnerabilities unidentified.`,
    );
  }

  if (below(childConfidenceRate, 50) && totalConfidenceOpportunities > 0) {
    concerns.push(
      `Only ${childConfidenceRate}% child confidence rate — most children do not demonstrate confidence in their understanding of consent and safeguarding, suggesting that education is not translating into protective capability.`,
    );
  } else if (below(childConfidenceRate, 70) && meets(childConfidenceRate, 50) && totalConfidenceOpportunities > 0) {
    concerns.push(
      `Child confidence rate at ${childConfidenceRate}% — a significant proportion of children lack confidence in consent and safeguarding understanding.`,
    );
  }

  if ((consentUnderstandingAvg ?? 0) < 40 && totalConsentSessions > 0) {
    concerns.push(
      `Consent understanding composite at only ${consentUnderstandingAvg}% — children are not demonstrating adequate understanding of consent principles. This suggests consent education is not achieving its aims and children may remain vulnerable.`,
    );
  } else if ((consentUnderstandingAvg ?? 0) < 60 && (consentUnderstandingAvg ?? 0) >= 40 && totalConsentSessions > 0) {
    concerns.push(
      `Consent understanding at ${consentUnderstandingAvg}% — while some progress is evident, many children are not yet demonstrating the level of consent understanding needed to protect themselves.`,
    );
  }

  if (screeningOverdueCount > 0 && totalScreenings > 0) {
    concerns.push(
      `${screeningOverdueCount} sexual health screening${screeningOverdueCount !== 1 ? "s are" : " is"} overdue — delayed screenings may mean health needs go unidentified and untreated.`,
    );
  }

  if (overdueConsentReviews > 0 && totalConsentSessions > 0) {
    concerns.push(
      `${overdueConsentReviews} consent education review${overdueConsentReviews !== 1 ? "s are" : " is"} overdue — without timely reviews, consent education may not keep pace with children's developing understanding and changing circumstances.`,
    );
  }

  if (overdueSafeguardingReviews > 0 && totalSafeguardingAssessments > 0) {
    concerns.push(
      `${overdueSafeguardingReviews} safeguarding awareness review${overdueSafeguardingReviews !== 1 ? "s are" : " is"} overdue — children's safeguarding knowledge must be regularly reassessed to ensure it remains current and robust.`,
    );
  }

  if (below(rseFacilitatorQualifiedRate, 50) && totalRseSessions > 0) {
    concerns.push(
      `Only ${rseFacilitatorQualifiedRate}% of RSE sessions delivered by qualified facilitators — delivering sensitive sexual health and relationships content without adequate training risks inappropriate delivery, misinformation, or causing distress.`,
    );
  }

  if (below(screeningConsentRate, 70) && totalScreenings > 0) {
    concerns.push(
      `Consent obtained for only ${screeningConsentRate}% of screenings — children's right to informed consent for health interventions must be respected. Screenings without documented consent raise ethical and safeguarding concerns.`,
    );
  }

  if (below(confidentialityExplainedRate, 70) && totalScreenings > 0) {
    concerns.push(
      `Confidentiality explained in only ${confidentialityExplainedRate}% of screenings — children must understand that their sexual health information is treated confidentially to feel safe accessing services.`,
    );
  }

  if (below(understandsExploitationRate, 50) && totalSafeguardingAssessments > 0) {
    concerns.push(
      `Only ${understandsExploitationRate}% of children understand exploitation — the majority of children cannot recognise exploitative situations, representing a significant safeguarding vulnerability.`,
    );
  }

  if (below(understandsGroomingRate, 50) && totalSafeguardingAssessments > 0) {
    concerns.push(
      `Only ${understandsGroomingRate}% of children understand grooming — most children cannot identify grooming behaviours, leaving them significantly more vulnerable to sexual exploitation.`,
    );
  }

  if (below(willingnessToDiscloseRate, 50) && totalSafeguardingAssessments > 0) {
    concerns.push(
      `Only ${willingnessToDiscloseRate}% of children willing to disclose concerns — most children would not tell a trusted adult if something was wrong. This is a critical safeguarding barrier that must be addressed.`,
    );
  }

  if (below(rseDocumentationRate, 70) && totalRseSessions > 0) {
    concerns.push(
      `RSE session documentation at only ${rseDocumentationRate}% — poor recording makes it difficult to evidence that the home is delivering its RSE education responsibilities.`,
    );
  }

  if (below(rseFollowUpCompletionRate, 50) && rseFollowUpNeeded > 0) {
    concerns.push(
      `Only ${rseFollowUpCompletionRate}% of RSE follow-ups completed — when children need further support or information, the home is not reliably following through.`,
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: SexualHealthRseRecommendation[] = [];
  let rank = 0;

  if (below(rseDeliveryRate, 50) && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently implement an RSE education programme reaching all children — every child must receive age-appropriate relationships and sex education to meet the home's duty under Reg 5 and to protect children from exploitation through knowledge and understanding.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — RSE education",
    });
  }

  if (below(consentEducationRate, 50) && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently deliver consent education to all children — without understanding consent, boundaries, and coercive behaviour, children are significantly more vulnerable to sexual exploitation. This is both an educational and safeguarding imperative.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 34 — Safeguarding",
    });
  }

  if (below(safeguardingAwarenessRate, 50) && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Immediately assess all children's safeguarding awareness — without understanding what children know about exploitation, grooming, and unsafe situations, the home cannot provide targeted protective education.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 34 — Safeguarding",
    });
  }

  if (below(healthScreeningRate, 40) && totalScreenings > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review and improve sexual health screening pathways — ensure all children are supported to access screening with informed consent, confidentiality assurance, and appropriate follow-up.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (below(understandsExploitationRate, 50) && totalSafeguardingAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Deliver targeted exploitation awareness education for all children — when most children cannot recognise exploitative situations, the home must provide focused, age-appropriate education on exploitation, coercion, and trafficking.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 34 — Safeguarding",
    });
  }

  if (below(understandsGroomingRate, 50) && totalSafeguardingAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement grooming awareness education immediately — children in care are particularly vulnerable to grooming and must be equipped to recognise and respond to grooming behaviours both online and offline.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 34 — Safeguarding",
    });
  }

  if (below(willingnessToDiscloseRate, 50) && totalSafeguardingAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently address barriers to disclosure — when most children would not tell an adult if something was wrong, the home must rebuild trust, ensure children know who their safe adults are, and create a culture where disclosure is safe and supported.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 34 — Safeguarding",
    });
  }

  if (below(rseFacilitatorQualifiedRate, 50) && totalRseSessions > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all RSE sessions are delivered by qualified, trained facilitators — sexual health and relationships education requires specialist skills to deliver sensitively, accurately, and safely.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — RSE education",
    });
  }

  if (below(screeningConsentRate, 70) && totalScreenings > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a robust consent protocol for all sexual health screenings — children must give informed consent before any health screening, with clear documentation of the consent process.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (screeningOverdueCount > 0 && totalScreenings > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Complete all overdue sexual health screenings — delays in screening may leave health needs unidentified. Review scheduling processes to prevent future overdue screenings.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (overdueConsentReviews > 0 && totalConsentSessions > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Complete all overdue consent education reviews — children's understanding of consent must be periodically reassessed to confirm retention and address any new concerns.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — RSE education",
    });
  }

  if (overdueSafeguardingReviews > 0 && totalSafeguardingAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Complete all overdue safeguarding awareness reviews — children's safeguarding knowledge must be regularly revisited, particularly as they mature and face new risks.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 34 — Safeguarding",
    });
  }

  if (
    meets(rseDeliveryRate, 50) &&
    below(rseDeliveryRate, 80) &&
    total_children > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend RSE education to reach all children — aim for 100% coverage to ensure every child receives the relationships and sexual health education they need.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — RSE education",
    });
  }

  if (
    meets(consentEducationRate, 50) &&
    below(consentEducationRate, 80) &&
    total_children > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase consent education coverage to at least 80% — every child must understand consent, boundaries, and their right to refuse as a fundamental safeguarding measure.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 34 — Safeguarding",
    });
  }

  if (
    meets(safeguardingAwarenessRate, 50) &&
    below(safeguardingAwarenessRate, 80) &&
    total_children > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend safeguarding awareness assessments to all children — aim for full coverage to ensure every child's protective knowledge is evaluated and supported.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 34 — Safeguarding",
    });
  }

  if (
    meets(ageAppropriateRate, 70) &&
    below(ageAppropriateRate, 95) &&
    totalGuidance > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review and improve age-appropriateness of all guidance — ensure every session is confirmed as matched to the child's developmental stage and understanding before delivery.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — RSE education",
    });
  }

  if (
    (consentUnderstandingAvg ?? 0) >= 40 &&
    (consentUnderstandingAvg ?? 0) < 60 &&
    totalConsentSessions > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen consent education methods to improve children's understanding — consider using more scenario-based practice, role play, and age-appropriate materials to deepen comprehension.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — RSE education",
    });
  }

  if (below(rseFollowUpCompletionRate, 70) && rseFollowUpNeeded > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve RSE follow-up completion — when children need further support or information after an RSE session, it must be provided promptly and reliably.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — RSE education",
    });
  }

  if (below(screeningFollowUpRate, 70) && screeningFollowUpNeeded > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve follow-up completion for sexual health screening results — when screening identifies further needs, prompt follow-up is essential to ensure children receive appropriate care.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (below(rseDocumentationRate, 70) && totalRseSessions > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve RSE session documentation — every session should have recorded notes covering content delivered, child engagement, and outcomes to evidence compliance with Reg 5.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — RSE education",
    });
  }

  if (below(culturalSensitivityRate, 70) && totalGuidance > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve cultural sensitivity in RSE and guidance delivery — ensure staff consider and respect children's cultural, religious, and personal values when delivering sexual health education.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Children receive care focused on individual needs",
    });
  }

  if (below(scenarioPracticeRate, 60) && totalConsentSessions > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase the use of scenario practice in consent education — children learn best through practical rehearsal of saying no, setting boundaries, and responding to pressure in realistic scenarios.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — RSE education",
    });
  }

  if (below(rseTopicCoverageRate, 60)) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Broaden RSE topic coverage — ensure the programme includes the full range of topics including online safety, exploitation awareness, identity and diversity, and healthy relationships alongside traditional RSE content.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — RSE education",
    });
  }

  if (
    meets(rseFacilitatorQualifiedRate, 50) &&
    below(rseFacilitatorQualifiedRate, 80) &&
    totalRseSessions > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Invest in RSE facilitator training to ensure all staff delivering RSE are appropriately qualified — competent facilitation is essential for sensitive topics to be delivered safely and effectively.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — RSE education",
    });
  }

  if (
    meets(confidentialityExplainedRate, 70) &&
    below(confidentialityExplainedRate, 95) &&
    totalScreenings > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure confidentiality is explained to every child before every screening — children must understand their right to confidentiality to feel safe accessing sexual health services.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: SexualHealthRseInsight[] = [];

  // -- Critical insights --

  if (below(rseDeliveryRate, 50) && total_children > 0) {
    insights.push({
      text: `Only ${rseDeliveryRate}% of children receiving RSE education. Without relationships and sex education, children in care are denied essential knowledge about consent, healthy relationships, and sexual health. Ofsted expects evidence that the home delivers age-appropriate RSE as part of its education duties under Reg 5.`,
      severity: "critical",
    });
  }

  if (below(consentEducationRate, 50) && total_children > 0) {
    insights.push({
      text: `Only ${consentEducationRate}% of children receiving consent education. Children in care are disproportionately vulnerable to exploitation, and consent education is a critical protective factor. Without understanding consent, boundaries, and coercive behaviour, children cannot protect themselves effectively. This directly undermines Reg 34 safeguarding duties.`,
      severity: "critical",
    });
  }

  if (below(safeguardingAwarenessRate, 50) && total_children > 0) {
    insights.push({
      text: `Only ${safeguardingAwarenessRate}% of children assessed for safeguarding awareness. Without assessing what children understand about exploitation, grooming, and unsafe situations, the home cannot target protective education effectively. The absence of assessment means the home is operating blind to children's actual safeguarding knowledge gaps.`,
      severity: "critical",
    });
  }

  if (below(healthScreeningRate, 40) && totalScreenings > 0) {
    insights.push({
      text: `Only ${healthScreeningRate}% of children supported with sexual health screening. Looked-after children have the same right to sexual health care as all young people, and the home has a duty under Reg 14 to support access to health services. Low screening rates may mean health needs go unidentified and untreated.`,
      severity: "critical",
    });
  }

  if (below(willingnessToDiscloseRate, 50) && totalSafeguardingAssessments > 0) {
    insights.push({
      text: `Only ${willingnessToDiscloseRate}% of children willing to disclose concerns to a trusted adult. This is perhaps the most critical safeguarding indicator — when children do not feel safe to tell someone, abuse and exploitation can continue unchecked. The home must urgently build a culture of trust and openness.`,
      severity: "critical",
    });
  }

  if (
    below(understandsExploitationRate, 50) &&
    below(understandsGroomingRate, 50) &&
    totalSafeguardingAssessments > 0
  ) {
    insights.push({
      text: `Children's understanding of exploitation (${understandsExploitationRate}%) and grooming (${understandsGroomingRate}%) is critically low. Children in care are among the most vulnerable to sexual exploitation, and this level of awareness leaves them significantly exposed. Targeted, age-appropriate education on exploitation and grooming is urgently needed.`,
      severity: "critical",
    });
  }

  if ((consentUnderstandingAvg ?? 0) < 40 && totalConsentSessions > 0) {
    insights.push({
      text: `Consent understanding composite at only ${consentUnderstandingAvg}%. Despite consent education being delivered, children are not demonstrating adequate understanding of consent principles, the ability to articulate boundaries, recognition of pressure, or knowledge of who to tell. The education approach requires fundamental review and likely needs more practical, scenario-based methods.`,
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (
    meets(rseDeliveryRate, 50) &&
    below(rseDeliveryRate, 80) &&
    total_children > 0
  ) {
    insights.push({
      text: `RSE delivery rate at ${rseDeliveryRate}% — improving but some children are still not receiving relationships and sex education. Each child without RSE may have gaps in their understanding of consent, healthy relationships, and personal safety.`,
      severity: "warning",
    });
  }

  if (
    meets(consentEducationRate, 50) &&
    below(consentEducationRate, 80) &&
    total_children > 0
  ) {
    insights.push({
      text: `Consent education coverage at ${consentEducationRate}% — some children have not yet received formal consent education. Given the vulnerability of looked-after children to exploitation, all children should have access to consent education as a priority.`,
      severity: "warning",
    });
  }

  if (
    meets(safeguardingAwarenessRate, 50) &&
    below(safeguardingAwarenessRate, 80) &&
    total_children > 0
  ) {
    insights.push({
      text: `Safeguarding awareness at ${safeguardingAwarenessRate}% — some children's understanding of safeguarding has not been formally assessed. Without assessment, gaps in protective knowledge may go undetected and unaddressed.`,
      severity: "warning",
    });
  }

  if (
    meets(healthScreeningRate, 40) &&
    below(healthScreeningRate, 80) &&
    totalScreenings > 0
  ) {
    insights.push({
      text: `Health screening rate at ${healthScreeningRate}% — some children have not been supported to access sexual health screening. Consider whether there are barriers such as embarrassment, lack of information, or insufficient staff support that need to be addressed.`,
      severity: "warning",
    });
  }

  if (
    meets(childConfidenceRate, 50) &&
    below(childConfidenceRate, 70) &&
    totalConfidenceOpportunities > 0
  ) {
    insights.push({
      text: `Child confidence rate at ${childConfidenceRate}% — a notable proportion of children are not yet confident in their understanding of consent and safeguarding. Consider whether education methods need adaptation or whether children need more opportunities to practice and consolidate their learning.`,
      severity: "warning",
    });
  }

  if (
    (consentUnderstandingAvg ?? 0) >= 40 &&
    (consentUnderstandingAvg ?? 0) < 60 &&
    totalConsentSessions > 0
  ) {
    insights.push({
      text: `Consent understanding at ${consentUnderstandingAvg}% — while some progress is evident, the composite understanding of consent remains below the level needed for effective self-protection. More interactive, scenario-based education methods may help.`,
      severity: "warning",
    });
  }

  if (
    meets(ageAppropriateRate, 70) &&
    below(ageAppropriateRate, 95) &&
    totalGuidance > 0
  ) {
    insights.push({
      text: `Age-appropriateness confirmed for ${ageAppropriateRate}% of guidance — some sessions have not been verified as age-appropriate. Delivering content that is too advanced or too basic undermines the effectiveness of education and may cause distress.`,
      severity: "warning",
    });
  }

  if (screeningOverdueCount > 0 && totalScreenings > 0) {
    insights.push({
      text: `${screeningOverdueCount} screening${screeningOverdueCount !== 1 ? "s" : ""} overdue. Delays in sexual health screening can mean that health needs go unidentified for longer. Review whether overdue screenings reflect scheduling issues, capacity problems, or children declining to attend.`,
      severity: "warning",
    });
  }

  if (overdueConsentReviews > 0 && totalConsentSessions > 0) {
    insights.push({
      text: `${overdueConsentReviews} consent education review${overdueConsentReviews !== 1 ? "s" : ""} overdue. Children's understanding of consent should be reassessed regularly, particularly as they mature and encounter new relationship dynamics.`,
      severity: "warning",
    });
  }

  if (overdueSafeguardingReviews > 0 && totalSafeguardingAssessments > 0) {
    insights.push({
      text: `${overdueSafeguardingReviews} safeguarding awareness review${overdueSafeguardingReviews !== 1 ? "s" : ""} overdue. As children grow and face evolving risks (particularly online), their safeguarding knowledge must be kept current through regular reassessment.`,
      severity: "warning",
    });
  }

  if (
    meets(rseFacilitatorQualifiedRate, 50) &&
    below(rseFacilitatorQualifiedRate, 80) &&
    totalRseSessions > 0
  ) {
    insights.push({
      text: `Qualified facilitators for ${rseFacilitatorQualifiedRate}% of RSE sessions — some sessions are delivered by staff who may not have specialist training in RSE. Sensitive topics require confident, competent facilitation.`,
      severity: "warning",
    });
  }

  if (
    meets(rseTopicCoverageRate, 40) &&
    below(rseTopicCoverageRate, 80)
  ) {
    insights.push({
      text: `RSE topic coverage at ${rseTopicCoverageRate}% — some important RSE topics are not being covered. A comprehensive programme should address relationships, consent, online safety, exploitation, identity, and health across the full curriculum.`,
      severity: "warning",
    });
  }

  // Analysis of RSE topics covered
  const rseTopicCounts: Record<string, number> = {};
  for (const rec of rse_education_records) {
    rseTopicCounts[rec.topic] = (rseTopicCounts[rec.topic] ?? 0) + 1;
  }
  const topRseTopics = Object.entries(rseTopicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  if (topRseTopics.length >= 3 && totalRseSessions >= 5) {
    const topicStr = topRseTopics
      .map(([t, c]) => `${t.replace(/_/g, " ")} (${c})`)
      .join(", ");
    insights.push({
      text: `Most frequent RSE topics: ${topicStr}. Review whether the topic distribution aligns with children's actual needs and whether any critical areas such as exploitation awareness or online safety are underrepresented.`,
      severity: "warning",
    });
  }

  // Analysis of consent education topics
  const consentTopicCounts: Record<string, number> = {};
  for (const rec of consent_education_records) {
    consentTopicCounts[rec.topic] = (consentTopicCounts[rec.topic] ?? 0) + 1;
  }
  const topConsentTopics = Object.entries(consentTopicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topConsentTopics.length >= 2 && totalConsentSessions >= 3) {
    const consentStr = topConsentTopics
      .map(([t, c]) => `${t.replace(/_/g, " ")} (${c})`)
      .join(", ");
    insights.push({
      text: `Most frequent consent topics: ${consentStr}. Ensure the consent curriculum covers the full range including online consent, coercive control, and power dynamics alongside foundational consent concepts.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (rse_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding RSE education and sexual health support — children receive comprehensive, age-appropriate relationships and sex education, sexual health screening is well-managed, consent education is effective, and safeguarding awareness is strong. This is powerful evidence of the home fulfilling its duties under Reg 5, Reg 14, and Reg 34.",
      severity: "positive",
    });
  }

  if (
    meets(rseDeliveryRate, 100) &&
    meets(rseObjectivesMetRate, 90) &&
    total_children > 0 &&
    totalRseSessions > 0
  ) {
    insights.push({
      text: "Every child receiving RSE with 90%+ of sessions meeting learning objectives — the home delivers comprehensive, effective relationships and sex education that genuinely prepares children with the knowledge they need.",
      severity: "positive",
    });
  }

  if (
    meets(consentEducationRate, 100) &&
    (consentUnderstandingAvg ?? 0) >= 80 &&
    total_children > 0 &&
    totalConsentSessions > 0
  ) {
    insights.push({
      text: `Every child receiving consent education with ${consentUnderstandingAvg}% composite understanding — children can articulate consent, recognise pressure, set boundaries, and know who to tell. This is exceptional protective education.`,
      severity: "positive",
    });
  }

  if (
    meets(safeguardingAwarenessRate, 100) &&
    meets(understandsExploitationRate, 80) &&
    meets(understandsGroomingRate, 80) &&
    total_children > 0 &&
    totalSafeguardingAssessments > 0
  ) {
    insights.push({
      text: `Every child assessed with ${understandsExploitationRate}% understanding exploitation and ${understandsGroomingRate}% understanding grooming — children demonstrate strong awareness of the specific risks they face, which is the foundation of effective safeguarding.`,
      severity: "positive",
    });
  }

  if (
    meets(healthScreeningRate, 100) &&
    meets(screeningConsentRate, 95) &&
    meets(confidentialityExplainedRate, 95) &&
    total_children > 0 &&
    totalScreenings > 0
  ) {
    insights.push({
      text: "Sexual health screening is comprehensive with excellent consent and confidentiality practices — the home supports every child to access health services while fully respecting their autonomy, privacy, and right to informed consent.",
      severity: "positive",
    });
  }

  if (
    meets(willingnessToDiscloseRate, 80) &&
    meets(knowsHowToReportRate, 80) &&
    totalSafeguardingAssessments > 0
  ) {
    insights.push({
      text: `${willingnessToDiscloseRate}% of children willing to disclose concerns and ${knowsHowToReportRate}% know how to report — children feel safe and empowered to speak up. This culture of trust and openness is the most powerful safeguarding measure the home can have.`,
      severity: "positive",
    });
  }

  if (
    meets(childConfidenceRate, 90) &&
    totalConfidenceOpportunities > 0
  ) {
    insights.push({
      text: `${childConfidenceRate}% child confidence in consent and safeguarding understanding — children overwhelmingly feel equipped with the knowledge to protect themselves. This confidence comes from effective, consistent education that genuinely empowers.`,
      severity: "positive",
    });
  }

  if (
    meets(rseEngagementRate, 90) &&
    meets(rseFeedbackPositiveRate, 90) &&
    totalRseSessions > 0
  ) {
    insights.push({
      text: `${rseEngagementRate}% child engagement and ${rseFeedbackPositiveRate}% positive feedback on RSE sessions — children are actively engaged in their education and find it beneficial. This suggests the programme is well-designed, sensitively delivered, and genuinely valued by young people.`,
      severity: "positive",
    });
  }

  if (
    meets(culturalSensitivityRate, 90) &&
    meets(developmentalConsiderationRate, 90) &&
    totalGuidance > 0
  ) {
    insights.push({
      text: `${culturalSensitivityRate}% cultural sensitivity and ${developmentalConsiderationRate}% developmental consideration in guidance — the home delivers RSE that respects children's individual backgrounds while ensuring content is matched to their readiness and understanding.`,
      severity: "positive",
    });
  }

  if (
    (staffConfidenceAvg ?? 0) >= 4.0 &&
    (childConfidenceAvg ?? 0) >= 7.0 &&
    totalSafeguardingAssessments > 0
  ) {
    insights.push({
      text: `Staff confidence in children's safeguarding knowledge averages ${staffConfidenceAvg}/5 with child confidence at ${childConfidenceAvg}/10 — both staff assessment and children's self-report converge on strong safeguarding understanding, providing compelling evidence for Ofsted.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (rse_rating === "outstanding") {
    headline =
      "Outstanding RSE education and sexual health support — children receive comprehensive relationships and sex education, consent understanding is strong, and safeguarding awareness is embedded.";
  } else if (rse_rating === "good") {
    headline = `Good RSE education and sexual health provision — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (rse_rating === "adequate") {
    headline = `Adequate RSE and sexual health provision — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure children receive the education and support they need.`;
  } else {
    headline = `RSE education and sexual health support is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to protect children through knowledge, education, and health support.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    rse_rating,
    rse_score: score,
    headline,
    total_rse_sessions: totalRseSessions,
    rse_delivery_rate: rseDeliveryRate,
    health_screening_rate: healthScreeningRate,
    age_appropriate_rate: ageAppropriateRate,
    consent_education_rate: consentEducationRate,
    safeguarding_awareness_rate: safeguardingAwarenessRate,
    child_confidence_rate: childConfidenceRate,
    screening_compliance_avg: screeningComplianceAvg,
    consent_understanding_avg: consentUnderstandingAvg,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
