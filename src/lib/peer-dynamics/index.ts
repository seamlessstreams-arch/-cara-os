// ══════════════════════════════════════════════════════════════════════════════
// Cara Peer Dynamics & Group Compatibility — Public API
// ══════════════════════════════════════════════════════════════════════════════

export {
  generatePeerDynamicsIntelligence,
  analyseDyads,
  detectBullyingPatterns,
  buildChildGroupProfiles,
  evaluateMatchingCompliance,
  determineGroupStabilityTrend,
  getInteractionTypeLabel,
  getCompatibilityFactorLabel,
  getRelationshipHealthLabel,
} from "./peer-dynamics-engine";

export type {
  InteractionType,
  InteractionSeverity,
  CompatibilityFactor,
  GroupStabilityTrend,
  ChildProfile,
  PeerInteraction,
  MatchingAssessment,
  GroupAssessment,
  DyadAnalysis,
  BullyingPattern,
  ChildGroupProfile,
  MatchingComplianceResult,
  PeerDynamicsIntelligenceResult as LegacyPeerDynamicsIntelligenceResult,
} from "./peer-dynamics-engine";

// ── Peer Dynamics Intelligence Engine ─────────────────────────────────────

export {
  generatePeerDynamicsIntelligenceResult,
  evaluatePeerDynamicsQuality,
  evaluatePeerDynamicsCompliance,
  evaluatePeerDynamicsPolicy,
  evaluateStaffPeerDynamicsReadiness,
  buildChildPeerDynamicsProfiles,
  getRating,
  getPeerDynamicsIntelligenceCategoryLabel,
  getPeerDynamicsIntelligenceOutcomeLabel,
  getPeerDynamicsRatingLabel,
} from "./peer-dynamics-intelligence-engine";

export type {
  PeerDynamicsIntelligenceCategory,
  PeerDynamicsIntelligenceOutcome,
  PeerDynamicsRating,
  PeerDynamicsIntelligenceRecord,
  PeerDynamicsIntelligencePolicy,
  StaffPeerDynamicsTraining,
  PeerDynamicsQualityResult,
  PeerDynamicsComplianceResult,
  PeerDynamicsPolicyResult,
  StaffPeerDynamicsReadinessResult,
  ChildPeerDynamicsProfile,
  PeerDynamicsIntelligenceResult,
  GeneratePeerDynamicsIntelligenceInput,
} from "./peer-dynamics-intelligence-engine";
