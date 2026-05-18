// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Safeguarding Effectiveness Intelligence — Public API
// ══════════════════════════════════════════════════════════════════════════════

export {
  evaluateReferralQuality,
  evaluateTrainingCompliance,
  evaluateAuditFindings,
  evaluateSafeguardingSupervision,
  buildStaffSafeguardingProfiles,
  generateSafeguardingEffectivenessIntelligence,
  getReferralTypeLabel,
  getReferralOutcomeLabel,
  getTrainingLevelLabel,
  getAuditAreaLabel,
  getOfstedRatingLabel,
} from "./safeguarding-effectiveness-engine";

export type {
  ReferralType,
  ReferralOutcome,
  TrainingLevel,
  SafeguardingAuditArea,
  OfstedRating,
  SafeguardingReferral,
  SafeguardingTraining,
  SafeguardingAudit,
  SafeguardingSupervision,
  ReferralQualityResult,
  TrainingComplianceResult,
  AuditFindingsResult,
  SupervisionResult,
  StaffSafeguardingProfile,
  SafeguardingEffectivenessIntelligence,
} from "./safeguarding-effectiveness-engine";
