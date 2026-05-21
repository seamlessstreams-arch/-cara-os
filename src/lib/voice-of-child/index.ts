// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Voice of the Child — Public API
// ══════════════════════════════════════════════════════════════════════════════

export {
  generateVoiceOfChildIntelligence,
  analyseDomainCapture,
  buildChildVoiceResults,
  getVoiceDomainLabel,
  getVoiceMethodLabel,
  getInfluenceLabel,
} from "./voice-of-child-engine";

export type {
  VoiceDomain,
  VoiceMethod,
  VoiceInfluence,
  ParticipationLevel,
  VoiceEntry,
  AdvocacyRecord,
  ParticipationRecord,
  ChildVoiceProfile,
  DomainCaptureResult,
  ChildVoiceResult,
  VoiceOfChildIntelligenceResult,
} from "./voice-of-child-engine";

// Intelligence engine exports
export {
  generateVoiceOfChildIntelligenceReport,
  evaluateVoiceOfChildQuality,
  evaluateVoiceOfChildCompliance,
  evaluateVoiceOfChildPolicy,
  evaluateStaffVoiceOfChildReadiness,
  buildChildVoiceOfChildProfiles,
  pct,
  getRating,
  getVoiceOfChildCategoryLabel,
  getVoiceOfChildOutcomeLabel,
  getRatingLabel,
} from "./voice-of-child-intelligence-engine";

export type {
  VoiceOfChildCategory,
  VoiceOfChildOutcome,
  Rating,
  VoiceOfChildRecord,
  VoiceOfChildPolicy,
  StaffVoiceOfChildTraining,
  VoiceOfChildQualityResult,
  VoiceOfChildComplianceResult,
  VoiceOfChildPolicyResult,
  StaffVoiceOfChildReadinessResult,
  ChildVoiceOfChildProfile,
  VoiceOfChildIntelligence,
  GenerateVoiceOfChildIntelligenceInput,
} from "./voice-of-child-intelligence-engine";
