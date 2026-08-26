// ══════════════════════════════════════════════════════════════════════════════
// Cara Missing & Absent Episodes Intelligence — Public API
// ══════════════════════════════════════════════════════════════════════════════

export {
  evaluateEpisodeManagement,
  evaluatePreventionEffectiveness,
  evaluateMissingPolicy,
  evaluateStaffMissingReadiness,
  buildChildMissingProfiles,
  generateMissingAbsentEpisodesIntelligence,
  getEpisodeTypeLabel,
  getEpisodeOutcomeLabel,
  getRiskLevelLabel,
  getRatingLabel,
  getRating,
} from "./missing-absent-episodes-engine";

export type {
  EpisodeType,
  EpisodeOutcome,
  RiskLevel,
  Rating,
  MissingEpisode,
  MissingPolicy,
  StaffMissingTraining,
  ChildMissingProfile,
  EpisodeManagementResult,
  PreventionEffectivenessResult,
  MissingPolicyResult,
  StaffMissingReadinessResult,
  MissingAbsentEpisodesIntelligence,
} from "./missing-absent-episodes-engine";
