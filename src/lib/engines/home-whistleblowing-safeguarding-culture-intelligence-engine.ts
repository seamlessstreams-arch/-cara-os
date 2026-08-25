// ==============================================================================
// CARA -- HOME WHISTLEBLOWING & SAFEGUARDING CULTURE INTELLIGENCE ENGINE
// Measures safeguarding culture quality -- whistleblowing policy awareness,
// reporting confidence, safeguarding training currency, culture audit outcomes,
// and child protection practice quality.
// Pure deterministic engine -- no imports, no LLM, no external deps.
// CHR 2015 Reg 34 (Safeguarding -- employment of staff),
// Reg 35 (Behaviour management), SCCIF safety judgment.
// Store keys: whistleblowingAwarenessRecords, reportingConfidenceRecords,
//             safeguardingTrainingRecords, cultureAuditRecords,
//             childProtectionRecords
// ==============================================================================

import { rate, below, meets } from "@/lib/metrics/rate";

// -- Input Types --------------------------------------------------------------

export interface WhistleblowingAwarenessRecordInput {
  id: string;
  staff_id: string;
  staff_name: string;
  policy_read: boolean;
  policy_read_date: string | null;
  policy_version_current: boolean;
  understands_reporting_channels: boolean;
  knows_external_escalation: boolean;
  signed_declaration: boolean;
  declaration_date: string | null;
  refresher_completed: boolean;
  refresher_date: string | null;
  quiz_score: number; // 0-100
  quiz_passed: boolean;
  concerns_about_retaliation: boolean;
  aware_of_protections: boolean;
  role: "permanent" | "agency" | "bank" | "volunteer" | "manager";
  created_at: string;
}

export interface ReportingConfidenceRecordInput {
  id: string;
  staff_id: string;
  staff_name: string;
  survey_date: string;
  confidence_level: number; // 1-5
  would_report_colleague: boolean;
  would_report_manager: boolean;
  would_report_externally: boolean;
  feels_safe_reporting: boolean;
  has_reported_before: boolean;
  report_handled_well: boolean | null;
  barriers_to_reporting: string[];
  suggestions: string;
  anonymous: boolean;
  created_at: string;
}

export interface SafeguardingTrainingRecordInput {
  id: string;
  staff_id: string;
  staff_name: string;
  training_type: "level_1" | "level_2" | "level_3" | "advanced" | "refresher" | "specialist" | "prevent" | "online_safety" | "other";
  training_date: string;
  expiry_date: string | null;
  passed: boolean;
  score: number | null; // 0-100
  provider: string;
  accredited: boolean;
  certificates_on_file: boolean;
  role: "permanent" | "agency" | "bank" | "volunteer" | "manager";
  created_at: string;
}

export interface CultureAuditRecordInput {
  id: string;
  audit_date: string;
  auditor: string;
  audit_type: "internal" | "external" | "peer" | "reg44" | "ofsted" | "local_authority";
  overall_rating: "outstanding" | "good" | "adequate" | "inadequate";
  open_culture_score: number; // 0-100
  challenge_accepted: boolean;
  staff_feel_heard: boolean;
  children_feel_safe: boolean;
  whistleblowing_policy_visible: boolean;
  safeguarding_posters_displayed: boolean;
  children_know_how_to_complain: boolean;
  actions_from_previous_audit_completed: boolean;
  total_actions_raised: number;
  actions_completed: number;
  actions_overdue: number;
  notes: string;
  created_at: string;
}

export interface ChildProtectionRecordInput {
  id: string;
  child_id: string;
  date: string;
  concern_type: "disclosure" | "observation" | "allegation" | "third_party_report" | "online_concern" | "peer_on_peer" | "exploitation" | "self_harm" | "neglect" | "other";
  reported_within_24h: boolean;
  correct_channel_used: boolean;
  body_map_completed: boolean;
  child_voice_captured: boolean;
  manager_informed: boolean;
  lado_referral_made: boolean | null;
  lado_referral_timely: boolean | null;
  social_worker_informed: boolean;
  multi_agency_response: boolean;
  outcome_documented: boolean;
  follow_up_completed: boolean;
  lessons_learned_recorded: boolean;
  staff_debriefed: boolean;
  quality_rating: "excellent" | "good" | "adequate" | "poor";
  created_at: string;
}

export interface WhistleblowingInput {
  today: string;
  total_children: number;
  whistleblowing_awareness_records: WhistleblowingAwarenessRecordInput[];
  reporting_confidence_records: ReportingConfidenceRecordInput[];
  safeguarding_training_records: SafeguardingTrainingRecordInput[];
  culture_audit_records: CultureAuditRecordInput[];
  child_protection_records: ChildProtectionRecordInput[];
}

// -- Output Types -------------------------------------------------------------

export type WhistleblowingRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface WhistleblowingInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface WhistleblowingRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface WhistleblowingResult {
  safeguarding_culture_rating: WhistleblowingRating;
  safeguarding_culture_score: number;
  headline: string;
  // Null on empty across every composite rate — no records ⇒ no signal.
  // "0% awareness / 0% confidence / 0% training / 0% audit / 0% protection /
  // 0% staff confidence" would read as "we asked every staff member and they
  // all failed on safeguarding", not "unmeasured". Fab-0 doctrine.
  policy_awareness_rate: number | null;
  reporting_confidence_rate: number | null;
  training_currency_rate: number | null;
  culture_audit_rate: number | null;
  child_protection_rate: number | null;
  staff_confidence_rate: number | null;
  strengths: string[];
  concerns: string[];
  recommendations: WhistleblowingRecommendation[];
  insights: WhistleblowingInsight[];
}

// -- Helpers ------------------------------------------------------------------

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): WhistleblowingRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// -- Empty Result Factory -----------------------------------------------------

function emptyResult(
  rating: WhistleblowingRating,
  score: number,
  headline: string,
): WhistleblowingResult {
  return {
    safeguarding_culture_rating: rating,
    safeguarding_culture_score: score,
    headline,
    policy_awareness_rate: null,
    reporting_confidence_rate: null,
    training_currency_rate: null,
    culture_audit_rate: null,
    child_protection_rate: null,
    staff_confidence_rate: null,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// -- Main Compute -------------------------------------------------------------

export function computeWhistleblowingSafeguardingCulture(
  input: WhistleblowingInput,
): WhistleblowingResult {
  const {
    today,
    total_children,
    whistleblowing_awareness_records,
    reporting_confidence_records,
    safeguarding_training_records,
    culture_audit_records,
    child_protection_records,
  } = input;

  // -- Special case: all empty + 0 children -> insufficient_data ------------
  const allEmpty =
    whistleblowing_awareness_records.length === 0 &&
    reporting_confidence_records.length === 0 &&
    safeguarding_training_records.length === 0 &&
    culture_audit_records.length === 0 &&
    child_protection_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement -- insufficient data to assess whistleblowing and safeguarding culture.",
    );
  }

  // -- Special case: all empty + children > 0 -> inadequate -----------------
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No whistleblowing awareness, reporting confidence, safeguarding training, culture audit, or child protection records exist despite children on placement -- safeguarding culture requires urgent attention.",
      ),
      concerns: [
        "No whistleblowing policy awareness, reporting confidence, safeguarding training, culture audit, or child protection practice records exist despite children being on placement -- the home cannot evidence a functioning safeguarding culture.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured recording of whistleblowing policy awareness, staff reporting confidence, safeguarding training currency, culture audits, and child protection practice quality to evidence the home's safeguarding culture.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 34 -- Safeguarding (employment of staff)",
        },
        {
          rank: 2,
          recommendation:
            "Ensure all staff receive whistleblowing policy briefings and current safeguarding training with documented evidence of completion, and that culture audits are scheduled at regular intervals.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 35 -- Behaviour management; SCCIF safety",
        },
      ],
      insights: [
        {
          text: "The complete absence of safeguarding culture records means Ofsted cannot verify that the home has a functioning whistleblowing culture, that staff are trained and confident in reporting concerns, or that child protection practice meets required standards. This represents a fundamental gap in Reg 34 compliance.",
          severity: "critical",
        },
      ],
    };
  }

  // -- Compute core metrics -------------------------------------------------

  // === 1. Whistleblowing policy awareness ===
  const totalAwareness = whistleblowing_awareness_records.length;
  const policyRead = whistleblowing_awareness_records.filter((r) => r.policy_read).length;
  const policyReadRate = rate(policyRead, totalAwareness);

  const policyVersionCurrent = whistleblowing_awareness_records.filter(
    (r) => r.policy_version_current,
  ).length;
  const policyCurrentRate = rate(policyVersionCurrent, totalAwareness);

  const understandsChannels = whistleblowing_awareness_records.filter(
    (r) => r.understands_reporting_channels,
  ).length;
  const channelUnderstandingRate = rate(understandsChannels, totalAwareness);

  const knowsExternalEscalation = whistleblowing_awareness_records.filter(
    (r) => r.knows_external_escalation,
  ).length;
  const externalEscalationRate = rate(knowsExternalEscalation, totalAwareness);

  const signedDeclaration = whistleblowing_awareness_records.filter(
    (r) => r.signed_declaration,
  ).length;
  const declarationRate = rate(signedDeclaration, totalAwareness);

  const refresherCompleted = whistleblowing_awareness_records.filter(
    (r) => r.refresher_completed,
  ).length;
  const refresherRate = rate(refresherCompleted, totalAwareness);

  const quizPassed = whistleblowing_awareness_records.filter(
    (r) => r.quiz_passed,
  ).length;
  const quizPassRate = rate(quizPassed, totalAwareness);

  const awareOfProtections = whistleblowing_awareness_records.filter(
    (r) => r.aware_of_protections,
  ).length;
  const protectionAwarenessRate = rate(awareOfProtections, totalAwareness);

  const concernsAboutRetaliation = whistleblowing_awareness_records.filter(
    (r) => r.concerns_about_retaliation,
  ).length;
  const retaliationConcernRate = rate(concernsAboutRetaliation, totalAwareness);

  const quizScoreSum = whistleblowing_awareness_records.reduce(
    (sum, r) => sum + r.quiz_score, 0,
  );
  const avgQuizScore: number | null =
    totalAwareness > 0
      ? Math.round(quizScoreSum / totalAwareness)
      : null;

  // Composite policy awareness rate
  const policyAwarenessRate: number | null =
    totalAwareness > 0 ? Math.round(
          (policyReadRate! + policyCurrentRate! + channelUnderstandingRate! + declarationRate!) / 4) : null;

  // === 2. Reporting confidence ===
  const totalConfidence = reporting_confidence_records.length;

  const confidenceSum = reporting_confidence_records.reduce(
    (sum, r) => sum + r.confidence_level, 0,
  );
  const avgConfidence: number | null =
    totalConfidence > 0
      ? Math.round((confidenceSum / totalConfidence) * 100) / 100
      : null;

  const wouldReportColleague = reporting_confidence_records.filter(
    (r) => r.would_report_colleague,
  ).length;
  const colleagueReportRate = rate(wouldReportColleague, totalConfidence);

  const wouldReportManager = reporting_confidence_records.filter(
    (r) => r.would_report_manager,
  ).length;
  const managerReportRate = rate(wouldReportManager, totalConfidence);

  const wouldReportExternally = reporting_confidence_records.filter(
    (r) => r.would_report_externally,
  ).length;
  const externalReportRate = rate(wouldReportExternally, totalConfidence);

  const feelsSafeReporting = reporting_confidence_records.filter(
    (r) => r.feels_safe_reporting,
  ).length;
  const safeReportingRate = rate(feelsSafeReporting, totalConfidence);

  const hasReportedBefore = reporting_confidence_records.filter(
    (r) => r.has_reported_before,
  );
  const reportHandledWell = hasReportedBefore.filter(
    (r) => r.report_handled_well === true,
  ).length;
  const reportHandlingRate = rate(reportHandledWell, hasReportedBefore.length);

  const withBarriers = reporting_confidence_records.filter(
    (r) => r.barriers_to_reporting.length > 0,
  ).length;
  const barrierRate = rate(withBarriers, totalConfidence);

  // Composite reporting confidence rate
  const reportingConfidenceRate: number | null =
    totalConfidence > 0 ? Math.round(
          (colleagueReportRate! + managerReportRate! + safeReportingRate!) / 3) : null;

  // Staff confidence rate (average confidence as percentage of max 5)
  const staffConfidenceRate: number | null =
    totalConfidence > 0
      ? Math.round((avgConfidence! / 5) * 100)
      : null;

  // === 3. Safeguarding training currency ===
  const totalTraining = safeguarding_training_records.length;

  const trainingPassed = safeguarding_training_records.filter(
    (r) => r.passed,
  ).length;
  const trainingPassRate = rate(trainingPassed, totalTraining);

  const inDate = safeguarding_training_records.filter((r) => {
    if (!r.expiry_date) return r.passed;
    return r.expiry_date >= today && r.passed;
  }).length;
  const inDateRate = rate(inDate, totalTraining);

  const accredited = safeguarding_training_records.filter(
    (r) => r.accredited,
  ).length;
  const accreditedRate = rate(accredited, totalTraining);

  const certificatesOnFile = safeguarding_training_records.filter(
    (r) => r.certificates_on_file,
  ).length;
  const certificateRate = rate(certificatesOnFile, totalTraining);

  const expiredTraining = safeguarding_training_records.filter((r) => {
    if (!r.expiry_date) return false;
    return r.expiry_date < today;
  }).length;
  const expiredRate = rate(expiredTraining, totalTraining);

  const trainingScoreSum = safeguarding_training_records.reduce(
    (sum, r) => sum + (r.score ?? 0), 0,
  );
  const scoredTraining = safeguarding_training_records.filter(
    (r) => r.score !== null,
  ).length;
  const avgTrainingScore: number | null =
    scoredTraining > 0
      ? Math.round(trainingScoreSum / scoredTraining)
      : null;

  // Training types coverage
  const trainingTypes = new Set(
    safeguarding_training_records.map((r) => r.training_type),
  );

  // Composite training currency rate
  const trainingCurrencyRate: number | null =
    totalTraining > 0 ? Math.round(
          (inDateRate! + trainingPassRate! + certificateRate!) / 3) : null;

  // === 4. Culture audit outcomes ===
  const totalAudits = culture_audit_records.length;

  const auditRatingScores: Record<string, number> = {
    outstanding: 100,
    good: 75,
    adequate: 50,
    inadequate: 25,
  };
  const auditRatingSum = culture_audit_records.reduce(
    (sum, r) => sum + (auditRatingScores[r.overall_rating] ?? 50), 0,
  );
  const avgAuditRating: number | null =
    totalAudits > 0
      ? Math.round(auditRatingSum / totalAudits)
      : null;

  const openCultureScoreSum = culture_audit_records.reduce(
    (sum, r) => sum + r.open_culture_score, 0,
  );
  const avgOpenCultureScore: number | null =
    totalAudits > 0
      ? Math.round(openCultureScoreSum / totalAudits)
      : null;

  const challengeAccepted = culture_audit_records.filter(
    (r) => r.challenge_accepted,
  ).length;
  const challengeRate = rate(challengeAccepted, totalAudits);

  const staffFeelHeard = culture_audit_records.filter(
    (r) => r.staff_feel_heard,
  ).length;
  const staffHeardRate = rate(staffFeelHeard, totalAudits);

  const childrenFeelSafe = culture_audit_records.filter(
    (r) => r.children_feel_safe,
  ).length;
  const childSafeRate = rate(childrenFeelSafe, totalAudits);

  const whistleblowingVisible = culture_audit_records.filter(
    (r) => r.whistleblowing_policy_visible,
  ).length;
  const visibilityRate = rate(whistleblowingVisible, totalAudits);

  const childrenKnowComplain = culture_audit_records.filter(
    (r) => r.children_know_how_to_complain,
  ).length;
  const complainKnowledgeRate = rate(childrenKnowComplain, totalAudits);

  const totalActionsRaised = culture_audit_records.reduce(
    (sum, r) => sum + r.total_actions_raised, 0,
  );
  const totalActionsCompleted = culture_audit_records.reduce(
    (sum, r) => sum + r.actions_completed, 0,
  );
  const actionCompletionRate = rate(totalActionsCompleted, totalActionsRaised);

  const totalActionsOverdue = culture_audit_records.reduce(
    (sum, r) => sum + r.actions_overdue, 0,
  );
  const actionOverdueRate = rate(totalActionsOverdue, totalActionsRaised);

  const inadequateAudits = culture_audit_records.filter(
    (r) => r.overall_rating === "inadequate",
  ).length;
  const inadequateAuditRate = rate(inadequateAudits, totalAudits);

  const outstandingAudits = culture_audit_records.filter(
    (r) => r.overall_rating === "outstanding",
  ).length;

  // Composite culture audit rate
  const cultureAuditRate: number | null =
    totalAudits > 0
      ? Math.round(
          (avgAuditRating! + avgOpenCultureScore! + childSafeRate!) / 3,
        )
      : null;

  // === 5. Child protection practice quality ===
  const totalProtection = child_protection_records.length;

  const reportedWithin24h = child_protection_records.filter(
    (r) => r.reported_within_24h,
  ).length;
  const timelyReportingRate = rate(reportedWithin24h, totalProtection);

  const correctChannel = child_protection_records.filter(
    (r) => r.correct_channel_used,
  ).length;
  const correctChannelRate = rate(correctChannel, totalProtection);

  const childVoiceCaptured = child_protection_records.filter(
    (r) => r.child_voice_captured,
  ).length;
  const childVoiceRate = rate(childVoiceCaptured, totalProtection);

  const ladoReferralsNeeded = child_protection_records.filter(
    (r) => r.lado_referral_made !== null,
  );
  const ladoReferralsMade = ladoReferralsNeeded.filter(
    (r) => r.lado_referral_made === true,
  ).length;
  const ladoReferralRate = rate(ladoReferralsMade, ladoReferralsNeeded.length);

  const multiAgencyResponse = child_protection_records.filter(
    (r) => r.multi_agency_response,
  ).length;
  const multiAgencyRate = rate(multiAgencyResponse, totalProtection);

  const outcomeDocumented = child_protection_records.filter(
    (r) => r.outcome_documented,
  ).length;
  const outcomeRate = rate(outcomeDocumented, totalProtection);

  const followUpCompleted = child_protection_records.filter(
    (r) => r.follow_up_completed,
  ).length;
  const followUpRate = rate(followUpCompleted, totalProtection);

  const lessonsLearned = child_protection_records.filter(
    (r) => r.lessons_learned_recorded,
  ).length;
  const lessonsLearnedRate = rate(lessonsLearned, totalProtection);

  const staffDebriefed = child_protection_records.filter(
    (r) => r.staff_debriefed,
  ).length;
  const debriefRate = rate(staffDebriefed, totalProtection);

  const poorQuality = child_protection_records.filter(
    (r) => r.quality_rating === "poor",
  ).length;
  const poorQualityRate = rate(poorQuality, totalProtection);

  const excellentQuality = child_protection_records.filter(
    (r) => r.quality_rating === "excellent",
  ).length;

  // Composite child protection rate
  const childProtectionRate: number | null =
    totalProtection > 0 ? Math.round(
          (timelyReportingRate! + correctChannelRate! + childVoiceRate! + outcomeRate! + followUpRate!) / 5) : null;

  // -- Scoring: base 52 ----------------------------------------------------

  let score = 52;

  // --- Bonus 1: policyAwarenessRate (>=90: +4, >=70: +2) ---
  if (meets(policyAwarenessRate, 90)) score += 4;
  else if (meets(policyAwarenessRate, 70)) score += 2;

  // --- Bonus 2: reportingConfidenceRate (>=90: +4, >=70: +2) ---
  if (meets(reportingConfidenceRate, 90)) score += 4;
  else if (meets(reportingConfidenceRate, 70)) score += 2;

  // --- Bonus 3: trainingCurrencyRate (>=90: +4, >=70: +2) ---
  if (meets(trainingCurrencyRate, 90)) score += 4;
  else if (meets(trainingCurrencyRate, 70)) score += 2;

  // --- Bonus 4: cultureAuditRate (>=80: +4, >=60: +2) ---
  if (meets(cultureAuditRate, 80)) score += 4;
  else if (meets(cultureAuditRate, 60)) score += 2;

  // --- Bonus 5: childProtectionRate (>=90: +4, >=70: +2) ---
  if (meets(childProtectionRate, 90)) score += 4;
  else if (meets(childProtectionRate, 70)) score += 2;

  // --- Bonus 6: staffConfidenceRate (>=80: +3, >=60: +1) ---
  if (meets(staffConfidenceRate, 80)) score += 3;
  else if (meets(staffConfidenceRate, 60)) score += 1;

  // --- Bonus 7: childSafeRate (>=90: +3, >=70: +1) ---
  if (meets(childSafeRate, 90)) score += 3;
  else if (meets(childSafeRate, 70)) score += 1;

  // --- Bonus 8: safeReportingRate (>=90: +2, >=70: +1) ---
  if (meets(safeReportingRate, 90)) score += 2;
  else if (meets(safeReportingRate, 70)) score += 1;

  // -- Penalties (4 with guards) -------------------------------------------

  // below(policyAwarenessRate, 50) -> -6
  if (below(policyAwarenessRate, 50) && whistleblowing_awareness_records.length > 0) score -= 6;

  // below(reportingConfidenceRate, 50) -> -5
  if (below(reportingConfidenceRate, 50) && reporting_confidence_records.length > 0) score -= 5;

  // below(trainingCurrencyRate, 50) -> -5
  if (below(trainingCurrencyRate, 50) && safeguarding_training_records.length > 0) score -= 5;

  // below(childProtectionRate, 50) -> -6
  if (below(childProtectionRate, 50) && child_protection_records.length > 0) score -= 6;

  score = clamp(score, 0, 100);

  const safeguarding_culture_rating = toRating(score);

  // -- Strengths ------------------------------------------------------------

  const strengths: string[] = [];

  // Policy awareness strengths
  if (meets(policyAwarenessRate, 90) && totalAwareness > 0) {
    strengths.push(
      `${policyAwarenessRate}% composite policy awareness -- staff demonstrate comprehensive understanding of whistleblowing policy, reporting channels, and signed declarations.`,
    );
  } else if (meets(policyAwarenessRate, 70) && totalAwareness > 0) {
    strengths.push(
      `${policyAwarenessRate}% policy awareness rate -- most staff have read, understood, and signed the whistleblowing policy.`,
    );
  }

  if (meets(channelUnderstandingRate, 90) && totalAwareness > 0) {
    strengths.push(
      `${channelUnderstandingRate}% of staff understand reporting channels -- staff know how to raise concerns through both internal and external routes.`,
    );
  }

  if (meets(externalEscalationRate, 90) && totalAwareness > 0) {
    strengths.push(
      `${externalEscalationRate}% of staff know how to escalate externally -- staff are aware of routes to Ofsted, LADO, and other external bodies if internal escalation fails.`,
    );
  }

  if (meets(protectionAwarenessRate, 90) && totalAwareness > 0) {
    strengths.push(
      `${protectionAwarenessRate}% of staff are aware of legal protections for whistleblowers -- staff understand they are protected from retaliation when raising genuine concerns.`,
    );
  }

  if (meets(quizPassRate, 90) && totalAwareness > 0) {
    strengths.push(
      `${quizPassRate}% whistleblowing knowledge quiz pass rate with average score of ${avgQuizScore}% -- staff demonstrate strong working knowledge of whistleblowing procedures.`,
    );
  }

  if (meets(refresherRate, 80) && totalAwareness > 0) {
    strengths.push(
      `${refresherRate}% of staff have completed whistleblowing policy refresher training -- the home maintains currency of staff knowledge through regular updates.`,
    );
  }

  // Reporting confidence strengths
  if (meets(reportingConfidenceRate, 90) && totalConfidence > 0) {
    strengths.push(
      `${reportingConfidenceRate}% composite reporting confidence -- staff would report concerns about colleagues and managers and feel safe doing so.`,
    );
  } else if (meets(reportingConfidenceRate, 70) && totalConfidence > 0) {
    strengths.push(
      `${reportingConfidenceRate}% reporting confidence rate -- most staff are willing to report concerns about colleagues and managers.`,
    );
  }

  if (meets(avgConfidence, 4.0) && totalConfidence > 0) {
    strengths.push(
      `Staff confidence in reporting concerns averages ${avgConfidence}/5 -- staff feel empowered to raise safeguarding concerns without fear.`,
    );
  }

  if (meets(safeReportingRate, 90) && totalConfidence > 0) {
    strengths.push(
      `${safeReportingRate}% of staff feel safe reporting concerns -- the home has created a culture where whistleblowing is supported and protected.`,
    );
  }

  if (meets(reportHandlingRate, 90) && hasReportedBefore.length > 0) {
    strengths.push(
      `${reportHandlingRate}% of staff who have previously reported concerns felt their report was handled well -- the home demonstrates effective follow-through on whistleblowing.`,
    );
  }

  if (meets(managerReportRate, 80) && totalConfidence > 0) {
    strengths.push(
      `${managerReportRate}% of staff would report concerns about a manager -- the home's open culture extends to challenging senior staff when necessary.`,
    );
  }

  if (meets(externalReportRate, 80) && totalConfidence > 0) {
    strengths.push(
      `${externalReportRate}% of staff would escalate concerns externally if needed -- staff understand and trust external safeguarding routes.`,
    );
  }

  // Training currency strengths
  if (meets(trainingCurrencyRate, 90) && totalTraining > 0) {
    strengths.push(
      `${trainingCurrencyRate}% safeguarding training currency -- training is in-date, passed, and certificated to a high standard across the workforce.`,
    );
  } else if (meets(trainingCurrencyRate, 70) && totalTraining > 0) {
    strengths.push(
      `${trainingCurrencyRate}% training currency rate -- most staff have current, passed safeguarding training with certificates on file.`,
    );
  }

  if (meets(inDateRate, 95) && totalTraining > 0) {
    strengths.push(
      `${inDateRate}% of safeguarding training is in date -- the home maintains excellent training currency with minimal expiry risk.`,
    );
  }

  if (meets(accreditedRate, 90) && totalTraining > 0) {
    strengths.push(
      `${accreditedRate}% of safeguarding training is from accredited providers -- the home invests in quality-assured, recognised training programmes.`,
    );
  }

  if (trainingTypes.size >= 5 && totalTraining > 0) {
    strengths.push(
      `Staff have completed ${trainingTypes.size} different types of safeguarding training -- the home provides comprehensive, multi-faceted safeguarding education.`,
    );
  }

  if (meets(avgTrainingScore, 85) && scoredTraining > 0) {
    strengths.push(
      `Average safeguarding training score of ${avgTrainingScore}% -- staff demonstrate strong knowledge acquisition from safeguarding training.`,
    );
  }

  // Culture audit strengths
  if (meets(cultureAuditRate, 80) && totalAudits > 0) {
    strengths.push(
      `${cultureAuditRate}% composite culture audit rate -- audit ratings, open culture scores, and children feeling safe all score highly.`,
    );
  } else if (meets(cultureAuditRate, 60) && totalAudits > 0) {
    strengths.push(
      `${cultureAuditRate}% culture audit rate -- audits indicate a generally positive safeguarding culture across the home.`,
    );
  }

  if (meets(childSafeRate, 90) && totalAudits > 0) {
    strengths.push(
      `Children reported feeling safe in ${childSafeRate}% of culture audits -- children experience the home as a safe, protective environment.`,
    );
  }

  if (meets(staffHeardRate, 90) && totalAudits > 0) {
    strengths.push(
      `Staff feel heard in ${staffHeardRate}% of culture audits -- the home fosters an open, listening culture that supports whistleblowing and challenge.`,
    );
  }

  if (meets(challengeRate, 90) && totalAudits > 0) {
    strengths.push(
      `Challenge is accepted constructively in ${challengeRate}% of audits -- the home welcomes professional challenge as part of its safeguarding culture.`,
    );
  }

  if (meets(visibilityRate, 90) && totalAudits > 0) {
    strengths.push(
      `Whistleblowing policy visibly displayed in ${visibilityRate}% of audits -- staff and visitors can easily access whistleblowing information.`,
    );
  }

  if (meets(complainKnowledgeRate, 90) && totalAudits > 0) {
    strengths.push(
      `Children know how to complain in ${complainKnowledgeRate}% of audits -- children are empowered with knowledge of how to raise concerns.`,
    );
  }

  if (meets(actionCompletionRate, 90) && totalActionsRaised > 0) {
    strengths.push(
      `${actionCompletionRate}% of audit actions completed -- the home demonstrates strong follow-through on culture improvement actions.`,
    );
  }

  if (outstandingAudits > 0 && totalAudits > 0) {
    strengths.push(
      `${outstandingAudits} of ${totalAudits} culture audits rated outstanding -- external validation of the home's safeguarding culture.`,
    );
  }

  // Child protection strengths
  if (meets(childProtectionRate, 90) && totalProtection > 0) {
    strengths.push(
      `${childProtectionRate}% composite child protection practice quality -- timely reporting, correct channels, child voice, outcomes, and follow-up all score highly.`,
    );
  } else if (meets(childProtectionRate, 70) && totalProtection > 0) {
    strengths.push(
      `${childProtectionRate}% child protection practice quality -- most child protection responses meet required standards.`,
    );
  }

  if (meets(timelyReportingRate, 95) && totalProtection > 0) {
    strengths.push(
      `${timelyReportingRate}% of child protection concerns reported within 24 hours -- the home responds promptly to safeguarding concerns.`,
    );
  }

  if (meets(correctChannelRate, 95) && totalProtection > 0) {
    strengths.push(
      `Correct reporting channels used in ${correctChannelRate}% of cases -- staff understand and follow established safeguarding reporting procedures.`,
    );
  }

  if (meets(childVoiceRate, 90) && totalProtection > 0) {
    strengths.push(
      `Child voice captured in ${childVoiceRate}% of child protection cases -- children's perspectives are central to safeguarding responses.`,
    );
  }

  if (meets(lessonsLearnedRate, 80) && totalProtection > 0) {
    strengths.push(
      `Lessons learned recorded in ${lessonsLearnedRate}% of cases -- the home demonstrates a learning culture that strengthens future safeguarding practice.`,
    );
  }

  if (meets(debriefRate, 80) && totalProtection > 0) {
    strengths.push(
      `Staff debriefed in ${debriefRate}% of child protection cases -- the home supports staff wellbeing after difficult safeguarding events.`,
    );
  }

  if (meets(ladoReferralRate, 90) && ladoReferralsNeeded.length > 0) {
    strengths.push(
      `LADO referrals made in ${ladoReferralRate}% of applicable cases -- the home correctly escalates allegations to the Local Authority Designated Officer.`,
    );
  }

  if (meets(multiAgencyRate, 80) && totalProtection > 0) {
    strengths.push(
      `Multi-agency responses recorded in ${multiAgencyRate}% of cases -- the home works effectively with partner agencies to protect children.`,
    );
  }

  if (excellentQuality > 0 && totalProtection > 0) {
    strengths.push(
      `${excellentQuality} of ${totalProtection} child protection responses rated excellent -- demonstrating exemplary safeguarding practice.`,
    );
  }

  // -- Concerns -------------------------------------------------------------

  const concerns: string[] = [];

  // Policy awareness concerns
  if (below(policyAwarenessRate, 50) && totalAwareness > 0) {
    concerns.push(
      `Only ${policyAwarenessRate}% composite policy awareness -- the majority of staff have not read, understood, or signed the whistleblowing policy, creating a fundamental gap in the home's safeguarding culture.`,
    );
  } else if (below(policyAwarenessRate, 70) && meets(policyAwarenessRate, 50) && totalAwareness > 0) {
    concerns.push(
      `Policy awareness at ${policyAwarenessRate}% -- a significant minority of staff lack full understanding of whistleblowing procedures and their obligations.`,
    );
  }

  if (below(channelUnderstandingRate, 70) && totalAwareness > 0) {
    concerns.push(
      `Only ${channelUnderstandingRate}% of staff understand reporting channels -- staff cannot effectively raise concerns if they do not know how to do so.`,
    );
  }

  if (below(externalEscalationRate, 60) && totalAwareness > 0) {
    concerns.push(
      `Only ${externalEscalationRate}% of staff know how to escalate externally -- if internal channels fail, staff lack knowledge of external safeguarding routes to Ofsted, LADO, or the police.`,
    );
  }

  if (meets(retaliationConcernRate, 20) && totalAwareness > 0) {
    concerns.push(
      `${retaliationConcernRate}% of staff express concerns about retaliation for whistleblowing -- this suggests a culture of fear that suppresses safeguarding reporting.`,
    );
  }

  if (below(quizPassRate, 70) && totalAwareness > 0) {
    concerns.push(
      `Only ${quizPassRate}% of staff passed the whistleblowing knowledge quiz -- staff knowledge of whistleblowing procedures is insufficient.`,
    );
  }

  if (below(refresherRate, 50) && totalAwareness > 0) {
    concerns.push(
      `Only ${refresherRate}% of staff have completed whistleblowing refresher training -- knowledge of current procedures may be outdated.`,
    );
  }

  // Reporting confidence concerns
  if (below(reportingConfidenceRate, 50) && totalConfidence > 0) {
    concerns.push(
      `Only ${reportingConfidenceRate}% composite reporting confidence -- the majority of staff would not report concerns about colleagues or managers, indicating a closed safeguarding culture.`,
    );
  } else if (below(reportingConfidenceRate, 70) && meets(reportingConfidenceRate, 50) && totalConfidence > 0) {
    concerns.push(
      `Reporting confidence at ${reportingConfidenceRate}% -- a significant proportion of staff lack confidence in reporting safeguarding concerns about colleagues or managers.`,
    );
  }

  if (below(avgConfidence, 3.0) && totalConfidence > 0) {
    concerns.push(
      `Staff confidence in reporting concerns averages only ${avgConfidence}/5 -- staff do not feel empowered to raise safeguarding concerns, which directly undermines child protection.`,
    );
  }

  if (below(safeReportingRate, 60) && totalConfidence > 0) {
    concerns.push(
      `Only ${safeReportingRate}% of staff feel safe reporting concerns -- the home has not created an environment where whistleblowing is supported and protected.`,
    );
  }

  if (below(managerReportRate, 50) && totalConfidence > 0) {
    concerns.push(
      `Only ${managerReportRate}% of staff would report concerns about a manager -- this power imbalance creates a significant safeguarding blind spot.`,
    );
  }

  if (meets(barrierRate, 30) && totalConfidence > 0) {
    concerns.push(
      `${barrierRate}% of staff report barriers to raising concerns -- persistent barriers are suppressing safeguarding disclosures and undermining the whistleblowing culture.`,
    );
  }

  if (below(reportHandlingRate, 60) && hasReportedBefore.length > 0) {
    concerns.push(
      `Only ${reportHandlingRate}% of staff who previously reported concerns felt their report was handled well -- poor follow-through discourages future reporting.`,
    );
  }

  // Training currency concerns
  if (below(trainingCurrencyRate, 50) && totalTraining > 0) {
    concerns.push(
      `Only ${trainingCurrencyRate}% safeguarding training currency -- the majority of training records show expired, failed, or uncertificated training, leaving staff ill-equipped to safeguard children.`,
    );
  } else if (below(trainingCurrencyRate, 70) && meets(trainingCurrencyRate, 50) && totalTraining > 0) {
    concerns.push(
      `Training currency at ${trainingCurrencyRate}% -- a significant proportion of safeguarding training is expired, failed, or lacks certificates on file.`,
    );
  }

  if (meets(expiredRate, 20) && totalTraining > 0) {
    concerns.push(
      `${expiredRate}% of safeguarding training has expired -- staff are working with children without current safeguarding certification.`,
    );
  }

  if (below(certificateRate, 70) && totalTraining > 0) {
    concerns.push(
      `Certificates on file for only ${certificateRate}% of training -- the home cannot evidence that staff have completed the safeguarding training claimed.`,
    );
  }

  if (below(accreditedRate, 60) && totalTraining > 0) {
    concerns.push(
      `Only ${accreditedRate}% of safeguarding training is from accredited providers -- the quality and validity of non-accredited training cannot be assured.`,
    );
  }

  // Culture audit concerns
  if (below(cultureAuditRate, 50) && totalAudits > 0) {
    concerns.push(
      `Only ${cultureAuditRate}% composite culture audit rate -- audit ratings, open culture scores, and children's sense of safety are all concerning.`,
    );
  } else if (below(cultureAuditRate, 60) && meets(cultureAuditRate, 50) && totalAudits > 0) {
    concerns.push(
      `Culture audit rate at ${cultureAuditRate}% -- audits indicate a safeguarding culture that needs improvement across multiple domains.`,
    );
  }

  if (below(childSafeRate, 70) && totalAudits > 0) {
    concerns.push(
      `Children reported feeling safe in only ${childSafeRate}% of culture audits -- some children do not experience the home as a safe environment, which is a fundamental safeguarding concern.`,
    );
  }

  if (below(staffHeardRate, 60) && totalAudits > 0) {
    concerns.push(
      `Staff feel heard in only ${staffHeardRate}% of culture audits -- staff do not feel listened to, which suppresses whistleblowing and professional challenge.`,
    );
  }

  if (meets(inadequateAuditRate, 20) && totalAudits > 0) {
    concerns.push(
      `${inadequateAuditRate}% of culture audits rated inadequate -- repeated inadequate audit outcomes indicate systemic safeguarding culture failures.`,
    );
  }

  if (meets(actionOverdueRate, 20) && totalActionsRaised > 0) {
    concerns.push(
      `${actionOverdueRate}% of audit actions are overdue -- the home is not completing culture improvement actions in a timely manner.`,
    );
  }

  if (below(visibilityRate, 70) && totalAudits > 0) {
    concerns.push(
      `Whistleblowing policy visible in only ${visibilityRate}% of audits -- staff and visitors cannot easily access information about how to raise concerns.`,
    );
  }

  if (below(complainKnowledgeRate, 70) && totalAudits > 0) {
    concerns.push(
      `Children know how to complain in only ${complainKnowledgeRate}% of audits -- children are not sufficiently empowered to raise concerns about their care.`,
    );
  }

  if (totalAudits === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No culture audit records -- the home has not conducted or recorded safeguarding culture audits, so the quality of its whistleblowing and open culture cannot be evidenced.",
    );
  }

  // Child protection concerns
  if (below(childProtectionRate, 50) && totalProtection > 0) {
    concerns.push(
      `Only ${childProtectionRate}% composite child protection practice quality -- timely reporting, correct channels, child voice, outcomes, and follow-up are all below acceptable standards.`,
    );
  } else if (below(childProtectionRate, 70) && meets(childProtectionRate, 50) && totalProtection > 0) {
    concerns.push(
      `Child protection practice quality at ${childProtectionRate}% -- significant aspects of child protection responses do not meet required standards.`,
    );
  }

  if (below(timelyReportingRate, 80) && totalProtection > 0) {
    concerns.push(
      `Only ${timelyReportingRate}% of child protection concerns reported within 24 hours -- delayed reporting increases risk to children and may compromise investigations.`,
    );
  }

  if (below(correctChannelRate, 80) && totalProtection > 0) {
    concerns.push(
      `Correct reporting channels used in only ${correctChannelRate}% of cases -- staff are not consistently following established safeguarding reporting procedures.`,
    );
  }

  if (below(childVoiceRate, 70) && totalProtection > 0) {
    concerns.push(
      `Child voice captured in only ${childVoiceRate}% of child protection cases -- children's perspectives are not being sufficiently included in safeguarding responses.`,
    );
  }

  if (below(outcomeRate, 70) && totalProtection > 0) {
    concerns.push(
      `Outcomes documented in only ${outcomeRate}% of cases -- the home cannot evidence what happened as a result of child protection responses.`,
    );
  }

  if (below(followUpRate, 70) && totalProtection > 0) {
    concerns.push(
      `Follow-up completed in only ${followUpRate}% of cases -- children may be left at continuing risk if safeguarding follow-up is not completed.`,
    );
  }

  if (meets(poorQualityRate, 20) && totalProtection > 0) {
    concerns.push(
      `${poorQualityRate}% of child protection responses rated poor -- repeated poor practice represents a significant risk to children's safety.`,
    );
  }

  if (below(lessonsLearnedRate, 50) && totalProtection > 0) {
    concerns.push(
      `Lessons learned recorded in only ${lessonsLearnedRate}% of cases -- the home is not systematically learning from safeguarding events to improve future practice.`,
    );
  }

  if (below(ladoReferralRate, 80) && ladoReferralsNeeded.length > 0) {
    concerns.push(
      `LADO referrals made in only ${ladoReferralRate}% of applicable cases -- the home is not consistently escalating allegations as required.`,
    );
  }

  if (totalProtection === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No child protection practice records -- the home has not recorded any child protection responses, so the quality of its safeguarding practice cannot be assessed.",
    );
  }

  if (totalAwareness === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No whistleblowing awareness records -- the home cannot evidence that staff understand whistleblowing procedures or their obligations to report concerns.",
    );
  }

  if (totalConfidence === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No reporting confidence records -- the home has not assessed whether staff feel confident and safe to report safeguarding concerns.",
    );
  }

  if (totalTraining === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No safeguarding training records -- the home cannot evidence that staff have received current safeguarding training.",
    );
  }

  // -- Recommendations ------------------------------------------------------

  const recommendations: WhistleblowingRecommendation[] = [];
  let rank = 0;

  // Immediate recommendations
  if (below(policyAwarenessRate, 50) && totalAwareness > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently ensure all staff read, understand, and sign the current whistleblowing policy. Conduct face-to-face briefings covering internal and external reporting channels, legal protections, and the home's commitment to supporting whistleblowers.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 34 -- Safeguarding (employment of staff)",
    });
  }

  if (below(reportingConfidenceRate, 50) && totalConfidence > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Take immediate action to address the low reporting confidence culture. Conduct anonymous staff surveys to identify barriers, provide assurance of non-retaliation, share examples of well-handled reports, and consider appointing an independent safeguarding lead for confidential reporting.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 34 -- Safeguarding; SCCIF safety judgment",
    });
  }

  if (below(trainingCurrencyRate, 50) && totalTraining > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Immediately address safeguarding training gaps -- book expired staff onto accredited courses, verify and file all certificates, and ensure no staff member works unsupervised with children without current safeguarding training.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 34 -- Safeguarding (employment of staff)",
    });
  }

  if (below(childProtectionRate, 50) && totalProtection > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review all child protection practice -- implement mandatory 24-hour reporting, correct channel checklists, child voice capture in every case, outcome documentation, and follow-up completion tracking. Provide intensive refresher training for all staff.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 34 -- Safeguarding; Reg 35 -- Behaviour management",
    });
  }

  if (below(childSafeRate, 70) && totalAudits > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently investigate why children do not consistently feel safe -- conduct individual wellbeing conversations with each child, identify specific safety concerns, and implement targeted safeguarding improvements.",
      urgency: "immediate",
      regulatory_ref: "SCCIF -- Safety; CHR 2015 Reg 34 -- Safeguarding",
    });
  }

  if (below(safeReportingRate, 60) && totalConfidence > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Address the unsafe reporting culture by implementing anonymous reporting mechanisms, providing written assurance of whistleblowing protections, and taking visible action to support staff who raise concerns.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 34 -- Safeguarding (employment of staff)",
    });
  }

  if (meets(retaliationConcernRate, 20) && totalAwareness > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently address staff concerns about retaliation for whistleblowing. The registered person must provide explicit reassurance, investigate any instances of perceived or actual retaliation, and demonstrate that whistleblowers are protected and supported.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 34 -- Safeguarding; Public Interest Disclosure Act 1998",
    });
  }

  if (below(timelyReportingRate, 80) && totalProtection > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Reinforce the requirement for all child protection concerns to be reported within 24 hours -- implement a reporting checklist, ensure staff know who to contact, and conduct supervision to address barriers to timely reporting.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 34 -- Safeguarding; SCCIF safety",
    });
  }

  // Soon recommendations
  if (meets(policyAwarenessRate, 50) && below(policyAwarenessRate, 70) && totalAwareness > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve whistleblowing policy awareness to at least 70% by scheduling refresher briefings for all staff who have not confirmed understanding and signing of the current policy version.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 34 -- Safeguarding (employment of staff)",
    });
  }

  if (meets(reportingConfidenceRate, 50) && below(reportingConfidenceRate, 70) && totalConfidence > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen reporting confidence by sharing anonymised case studies of well-handled reports, providing regular reassurance in team meetings, and offering one-to-one conversations about reporting barriers.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 34 -- Safeguarding; SCCIF safety judgment",
    });
  }

  if (meets(trainingCurrencyRate, 50) && below(trainingCurrencyRate, 70) && totalTraining > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Bring safeguarding training currency to at least 70% -- schedule renewals for all expiring certificates, file outstanding certificates, and ensure all training is from accredited providers.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 34 -- Safeguarding (employment of staff)",
    });
  }

  if (meets(childProtectionRate, 50) && below(childProtectionRate, 70) && totalProtection > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve child protection practice quality to at least 70% -- focus on capturing child voice in every case, completing follow-up actions, and documenting outcomes and lessons learned.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 34 -- Safeguarding; Reg 35 -- Behaviour management",
    });
  }

  if (meets(expiredRate, 20) && totalTraining > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Renew all expired safeguarding training certificates within 30 days -- implement a training tracker with automated expiry alerts to prevent future lapses.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 34 -- Safeguarding (employment of staff)",
    });
  }

  if (below(childVoiceRate, 70) && totalProtection > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Embed child voice capture in every child protection response -- use age-appropriate tools, trained staff, and dedicated time to ensure children's perspectives are heard and recorded.",
      urgency: "soon",
      regulatory_ref: "SCCIF -- Experiences and progress of children",
    });
  }

  if (below(lessonsLearnedRate, 50) && totalProtection > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a systematic lessons learned process for every child protection case -- use structured debriefs, share anonymised learning across the team, and track how learning improves future practice.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 34 -- Safeguarding; SCCIF leadership and management",
    });
  }

  if (meets(actionOverdueRate, 20) && totalActionsRaised > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Clear overdue culture audit actions and implement a tracking system with assigned owners and completion deadlines to ensure all improvement actions are completed promptly.",
      urgency: "soon",
      regulatory_ref: "SCCIF -- Leadership and management",
    });
  }

  if (below(visibilityRate, 70) && totalAudits > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure the whistleblowing policy and safeguarding posters are prominently displayed in all communal areas, staff rooms, and areas accessible to visitors -- children and staff should be able to see how to raise concerns at all times.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 34 -- Safeguarding",
    });
  }

  if (below(complainKnowledgeRate, 70) && totalAudits > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all children know how to make a complaint -- use child-friendly materials, regular key-work discussions, and house meetings to reinforce children's rights to complain and how to do so.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 34 -- Safeguarding; Reg 39 -- Complaints",
    });
  }

  if (below(managerReportRate, 50) && totalConfidence > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Address the gap in willingness to report concerns about managers by providing independent external reporting routes, reinforcing protection guarantees, and ensuring the registered person models openness to challenge.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 34 -- Safeguarding (employment of staff)",
    });
  }

  // Planned recommendations
  if (totalAudits === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Schedule regular safeguarding culture audits covering open culture, staff confidence, children's sense of safety, whistleblowing visibility, and action completion. Include both internal self-assessment and external peer review.",
      urgency: "planned",
      regulatory_ref: "SCCIF -- Leadership and management; CHR 2015 Reg 34 -- Safeguarding",
    });
  }

  if (totalAwareness === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a whistleblowing awareness programme for all staff that includes policy reading, comprehension quizzes, signed declarations, and regular refresher sessions. Record and track completion for every staff member.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 34 -- Safeguarding (employment of staff)",
    });
  }

  if (totalConfidence === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Conduct anonymous reporting confidence surveys with all staff to establish a baseline understanding of the home's whistleblowing culture and identify barriers to reporting.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 34 -- Safeguarding; SCCIF safety judgment",
    });
  }

  if (totalTraining === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all staff have current, accredited safeguarding training and that certificates are on file. Implement a training tracker to monitor currency and schedule renewals before expiry.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 34 -- Safeguarding (employment of staff)",
    });
  }

  if (totalProtection === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish a structured child protection practice recording system that captures timely reporting, correct channels, child voice, outcomes, follow-up, and lessons learned for every safeguarding concern.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 34 -- Safeguarding; Reg 35 -- Behaviour management",
    });
  }

  if (below(debriefRate, 60) && totalProtection > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure staff are debriefed after every child protection event -- debriefs support staff wellbeing, identify learning, and strengthen future safeguarding practice.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 34 -- Safeguarding; staff wellbeing",
    });
  }

  if (meets(barrierRate, 30) && totalConfidence > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Conduct a barriers-to-reporting analysis using survey data and one-to-one conversations. Develop a targeted action plan to remove each identified barrier and reassess confidence levels within three months.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 34 -- Safeguarding (employment of staff)",
    });
  }

  // -- Insights -------------------------------------------------------------

  const insights: WhistleblowingInsight[] = [];

  // --- Critical insights ---

  if (below(policyAwarenessRate, 50) && totalAwareness > 0) {
    insights.push({
      text: `Only ${policyAwarenessRate}% composite policy awareness. Ofsted will view the widespread lack of whistleblowing policy understanding as evidence that the home has not embedded a safeguarding culture -- staff cannot blow the whistle if they do not understand how. This is a direct failure under Reg 34.`,
      severity: "critical",
    });
  }

  if (below(reportingConfidenceRate, 50) && totalConfidence > 0) {
    insights.push({
      text: `Only ${reportingConfidenceRate}% reporting confidence. When staff do not feel confident reporting concerns about colleagues or managers, safeguarding risks go undetected. Ofsted identifies a closed culture -- where concerns are not raised or listened to -- as a hallmark of inadequate safety provision.`,
      severity: "critical",
    });
  }

  if (below(trainingCurrencyRate, 50) && totalTraining > 0) {
    insights.push({
      text: `Only ${trainingCurrencyRate}% safeguarding training currency. Staff without current safeguarding training cannot be expected to recognise, respond to, or report concerns effectively. Ofsted will view this as a significant Reg 34 failure that directly compromises children's safety.`,
      severity: "critical",
    });
  }

  if (below(childProtectionRate, 50) && totalProtection > 0) {
    insights.push({
      text: `Only ${childProtectionRate}% child protection practice quality. When reporting is delayed, channels are misused, child voice is absent, outcomes are undocumented, and follow-up is incomplete, children are left at continuing risk. This pattern of practice failure undermines the home's ability to protect the children in its care.`,
      severity: "critical",
    });
  }

  if (below(childSafeRate, 70) && totalAudits > 0) {
    insights.push({
      text: `Children feel safe in only ${childSafeRate}% of culture audits. When children do not feel safe in their home, no other safeguarding measure compensates. Ofsted will view this as prima facie evidence of a safety failure requiring immediate action under the SCCIF safety judgment.`,
      severity: "critical",
    });
  }

  if (meets(retaliationConcernRate, 30) && totalAwareness > 0) {
    insights.push({
      text: `${retaliationConcernRate}% of staff express retaliation concerns. A culture where staff fear consequences for reporting concerns is the antithesis of a safe, open home. Ofsted identifies fear of retaliation as a marker of a closed culture that allows abuse to remain hidden.`,
      severity: "critical",
    });
  }

  if (below(safeReportingRate, 50) && totalConfidence > 0) {
    insights.push({
      text: `Only ${safeReportingRate}% of staff feel safe reporting concerns. When the majority of staff do not feel safe to raise safeguarding worries, the home has a closed culture that may conceal poor practice or abuse. This is one of the most significant safeguarding culture red flags Ofsted will identify.`,
      severity: "critical",
    });
  }

  if (totalAwareness === 0 && totalConfidence === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No whistleblowing awareness or reporting confidence records despite children being on placement. Ofsted cannot verify that the home has a functioning whistleblowing culture, that staff know how to raise concerns, or that they feel confident doing so. This absence of evidence is itself a safeguarding concern.",
      severity: "critical",
    });
  }

  // --- Warning insights ---

  if (meets(policyAwarenessRate, 50) && below(policyAwarenessRate, 70) && totalAwareness > 0) {
    insights.push({
      text: `Policy awareness at ${policyAwarenessRate}% -- improving but a significant minority of staff lack full understanding of whistleblowing procedures. Each staff member who does not understand the policy is a potential gap in the home's safeguarding net.`,
      severity: "warning",
    });
  }

  if (meets(reportingConfidenceRate, 50) && below(reportingConfidenceRate, 70) && totalConfidence > 0) {
    insights.push({
      text: `Reporting confidence at ${reportingConfidenceRate}% -- while some staff feel able to raise concerns, a significant proportion lack confidence. The home should actively work to build a culture where every member of staff feels empowered to whistleblow without fear.`,
      severity: "warning",
    });
  }

  if (meets(trainingCurrencyRate, 50) && below(trainingCurrencyRate, 70) && totalTraining > 0) {
    insights.push({
      text: `Training currency at ${trainingCurrencyRate}% -- while some training is current, gaps in expired or uncertificated training mean some staff may lack the knowledge to respond effectively to safeguarding concerns.`,
      severity: "warning",
    });
  }

  if (meets(childProtectionRate, 50) && below(childProtectionRate, 70) && totalProtection > 0) {
    insights.push({
      text: `Child protection practice quality at ${childProtectionRate}% -- while some responses meet standards, inconsistency in reporting timeliness, child voice capture, or follow-up completion means safeguarding responses are not reliably protecting children.`,
      severity: "warning",
    });
  }

  if (meets(expiredRate, 20) && below(expiredRate, 40) && totalTraining > 0) {
    insights.push({
      text: `${expiredRate}% of safeguarding training has expired -- staff with expired training may not be aware of current guidance, thresholds, or reporting procedures. This creates a tangible safeguarding risk.`,
      severity: "warning",
    });
  }

  if (meets(avgConfidence, 3.0) && below(avgConfidence, 4.0) && totalConfidence > 0) {
    insights.push({
      text: `Staff confidence averages ${avgConfidence}/5 -- moderate but not strong. The home should continue building confidence through regular reassurance, visible action on concerns raised, and an open-door culture.`,
      severity: "warning",
    });
  }

  if (meets(barrierRate, 20) && below(barrierRate, 30) && totalConfidence > 0) {
    insights.push({
      text: `${barrierRate}% of staff report barriers to raising concerns -- while not yet at critical levels, these barriers should be identified and addressed before they erode the home's whistleblowing culture.`,
      severity: "warning",
    });
  }

  if (meets(retaliationConcernRate, 10) && below(retaliationConcernRate, 20) && totalAwareness > 0) {
    insights.push({
      text: `${retaliationConcernRate}% of staff express some concern about retaliation -- even a small proportion of staff fearing consequences for raising concerns indicates room for improvement in the home's whistleblowing culture.`,
      severity: "warning",
    });
  }

  if (meets(actionCompletionRate, 60) && below(actionCompletionRate, 90) && totalActionsRaised > 0) {
    insights.push({
      text: `${actionCompletionRate}% of audit actions completed -- reasonable progress but overdue or incomplete actions suggest the home's pace of culture improvement needs acceleration.`,
      severity: "warning",
    });
  }

  if (meets(outcomeRate, 70) && below(outcomeRate, 90) && totalProtection > 0) {
    insights.push({
      text: `Outcomes documented in ${outcomeRate}% of cases -- generally good but every undocumented outcome is a gap in the home's ability to evidence its safeguarding response and demonstrate learning.`,
      severity: "warning",
    });
  }

  // --- Audit type diversity insight ---
  const auditTypes = new Set(
    culture_audit_records.map((r) => r.audit_type),
  );
  if (auditTypes.size >= 3 && totalAudits > 0) {
    insights.push({
      text: `The home has undergone ${auditTypes.size} different types of safeguarding culture audit -- diversity of audit approaches (internal, external, peer, regulatory) provides a more robust picture of the home's safeguarding culture and strengthens evidence for Ofsted.`,
      severity: "positive",
    });
  }

  // --- Positive insights ---

  if (safeguarding_culture_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates an outstanding safeguarding culture -- whistleblowing is embedded, staff are confident and competent, culture audits confirm an open environment, and child protection practice is of high quality. This is strong evidence for the SCCIF safety judgment and Reg 34 compliance.",
      severity: "positive",
    });
  }

  if (meets(policyAwarenessRate, 90) && meets(reportingConfidenceRate, 90) && totalAwareness > 0 && totalConfidence > 0) {
    insights.push({
      text: `${policyAwarenessRate}% policy awareness combined with ${reportingConfidenceRate}% reporting confidence -- staff both understand whistleblowing procedures and feel empowered to use them. This is the hallmark of an open, safe safeguarding culture.`,
      severity: "positive",
    });
  }

  if (meets(trainingCurrencyRate, 90) && totalTraining > 0) {
    insights.push({
      text: `${trainingCurrencyRate}% safeguarding training currency -- virtually all staff have current, passed, and certificated safeguarding training. The home can confidently evidence to Ofsted that its workforce is competent to safeguard children.`,
      severity: "positive",
    });
  }

  if (meets(childProtectionRate, 90) && totalProtection > 0) {
    insights.push({
      text: `${childProtectionRate}% child protection practice quality -- concerns are reported promptly through correct channels, child voice is captured, outcomes are documented, and follow-up is completed. This demonstrates exemplary safeguarding practice.`,
      severity: "positive",
    });
  }

  if (meets(childSafeRate, 90) && meets(staffHeardRate, 90) && totalAudits > 0) {
    insights.push({
      text: `Children feel safe in ${childSafeRate}% of audits and staff feel heard in ${staffHeardRate}% -- both children and staff experience the home as a safe, open environment. This dual perspective validates the home's safeguarding culture.`,
      severity: "positive",
    });
  }

  if (meets(safeReportingRate, 90) && meets(managerReportRate, 80) && totalConfidence > 0) {
    insights.push({
      text: `${safeReportingRate}% of staff feel safe reporting with ${managerReportRate}% willing to report concerns about managers -- the home's open culture extends to all levels of seniority. Staff trust the home to handle concerns appropriately regardless of who is involved.`,
      severity: "positive",
    });
  }

  if (meets(avgConfidence, 4.0) && totalConfidence > 0) {
    insights.push({
      text: `Staff confidence in reporting averages ${avgConfidence}/5 -- staff feel strongly empowered to raise safeguarding concerns. This level of confidence indicates a mature, embedded whistleblowing culture.`,
      severity: "positive",
    });
  }

  if (meets(actionCompletionRate, 90) && totalActionsRaised > 0) {
    insights.push({
      text: `${actionCompletionRate}% of culture audit actions completed -- the home consistently follows through on improvement actions. This demonstrates commitment to continuous safeguarding culture development.`,
      severity: "positive",
    });
  }

  if (meets(lessonsLearnedRate, 80) && meets(debriefRate, 80) && totalProtection > 0) {
    insights.push({
      text: `Lessons learned in ${lessonsLearnedRate}% of cases with ${debriefRate}% staff debrief rate -- the home has a mature learning culture that strengthens future safeguarding practice and supports staff wellbeing.`,
      severity: "positive",
    });
  }

  if (meets(reportHandlingRate, 90) && hasReportedBefore.length > 0) {
    insights.push({
      text: `${reportHandlingRate}% of previous whistleblowing reports handled well -- staff who have raised concerns confirm that the home responded appropriately. This positive track record reinforces the whistleblowing culture and encourages future reporting.`,
      severity: "positive",
    });
  }

  // -- Headline -------------------------------------------------------------

  let headline: string;

  if (safeguarding_culture_rating === "outstanding") {
    headline =
      "Outstanding safeguarding culture -- whistleblowing is embedded, staff are confident and competent, and child protection practice meets the highest standards.";
  } else if (safeguarding_culture_rating === "good") {
    headline = `Good safeguarding culture -- ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (safeguarding_culture_rating === "adequate") {
    headline = `Adequate safeguarding culture -- ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure whistleblowing is embedded and safeguarding practice meets required standards.`;
  } else {
    headline = `Safeguarding culture is inadequate -- ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to embed whistleblowing, strengthen reporting confidence, and improve child protection practice.`;
  }

  // -- Return ---------------------------------------------------------------

  return {
    safeguarding_culture_rating,
    safeguarding_culture_score: score,
    headline,
    policy_awareness_rate: policyAwarenessRate,
    reporting_confidence_rate: reportingConfidenceRate,
    training_currency_rate: trainingCurrencyRate,
    culture_audit_rate: cultureAuditRate,
    child_protection_rate: childProtectionRate,
    staff_confidence_rate: staffConfidenceRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
