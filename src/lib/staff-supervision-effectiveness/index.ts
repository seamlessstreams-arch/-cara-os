// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Staff Supervision Effectiveness — Public API
// ══════════════════════════════════════════════════════════════════════════════

// Legacy re-exports from staff-supervision-effectiveness-engine
export {
  generateStaffSupervisionEffectivenessIntelligence as generateLegacyStaffSupervisionEffectivenessIntelligence,
  evaluateSessionEffectiveness,
  evaluateSupervisionCompliance,
  evaluateSupervisionPolicy,
  evaluateSupervisorReadiness,
  buildStaffSupervisionProfiles as buildLegacyStaffSupervisionProfiles,
  pct as legacyPct,
  getRating as legacyGetRating,
  getSupervisionTypeLabel,
  getSupervisionOutcomeLabel,
  getRatingLabel as legacyGetRatingLabel,
} from "./staff-supervision-effectiveness-engine";

export type {
  SupervisionType,
  SupervisionOutcome,
  Rating as LegacyRating,
  SupervisionSession,
  SupervisionPolicy as LegacySupervisionPolicy,
  SupervisorTraining,
  SessionEffectivenessResult,
  SupervisionComplianceResult,
  SupervisionPolicyResult,
  SupervisorReadinessResult,
  StaffSupervisionProfile as LegacyStaffSupervisionProfile,
  StaffSupervisionEffectivenessIntelligence as LegacyStaffSupervisionEffectivenessIntelligence,
} from "./staff-supervision-effectiveness-engine";

// Intelligence engine re-exports
export {
  generateStaffSupervisionEffectivenessIntelligence,
  evaluateStaffSupervisionEffectivenessQuality,
  evaluateStaffSupervisionEffectivenessCompliance,
  evaluateStaffSupervisionEffectivenessPolicy,
  evaluateStaffSupervisionEffectivenessReadiness,
  buildStaffSupervisionProfiles,
  pct,
  getRating,
  getStaffSupervisionEffectivenessCategoryLabel,
  getStaffSupervisionEffectivenessOutcomeLabel,
  getRatingLabel,
} from "./staff-supervision-effectiveness-intelligence-engine";

export type {
  StaffSupervisionEffectivenessCategory,
  StaffSupervisionEffectivenessOutcome,
  Rating,
  StaffSupervisionEffectivenessRecord,
  StaffSupervisionEffectivenessPolicy,
  StaffSupervisionEffectivenessTraining,
  StaffSupervisionEffectivenessQualityResult,
  StaffSupervisionEffectivenessComplianceResult,
  StaffSupervisionEffectivenessPolicyResult,
  StaffSupervisionEffectivenessReadinessResult,
  StaffSupervisionEffectivenessProfile,
  StaffSupervisionEffectivenessIntelligence,
  GenerateStaffSupervisionEffectivenessIntelligenceInput,
} from "./staff-supervision-effectiveness-intelligence-engine";
