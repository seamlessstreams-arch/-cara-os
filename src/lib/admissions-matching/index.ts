// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Admissions & Matching Intelligence — Public API
// ══════════════════════════════════════════════════════════════════════════════

export {
  evaluateReferralProcessing,
  evaluateMatchingQuality,
  evaluateIntroductionPlanning,
  evaluateAdmissionOutcomes,
  buildReferralTimeline,
  generateAdmissionsMatchingIntelligence,
  getIntroductionPhaseLabel,
  getReferralStatusLabel,
  getDeclineReasonLabel,
  getMatchingCriterionLabel,
} from "./admissions-matching-engine";

export type {
  ReferralStatus,
  DeclineReason,
  MatchingCriterion,
  IntroductionPhase,
  Referral,
  MatchingAssessment,
  MatchingScore,
  IntroductionPlan,
  IntroductionPhaseRecord,
  AdmissionOutcome,
  ReferralProcessingResult,
  MatchingQualityResult,
  IntroductionPlanningResult,
  AdmissionOutcomesResult,
  ReferralTimelineEntry,
  AdmissionsMatchingIntelligence,
} from "./admissions-matching-engine";
