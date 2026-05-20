// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Handover Intelligence — Public API
// ══════════════════════════════════════════════════════════════════════════════

export {
  pct,
  getRating,
  getHandoverCategoryLabel,
  getHandoverOutcomeLabel,
  getRatingLabel,
  evaluateHandoverQuality,
  evaluateHandoverCompliance,
  evaluateHandoverPolicy,
  evaluateStaffHandoverReadiness,
  buildChildHandoverProfiles,
  generateHandoverIntelligence,
} from "./handover-engine";

export type {
  HandoverCategory,
  HandoverOutcome,
  Rating,
  HandoverRecord,
  HandoverPolicy,
  StaffHandoverTraining,
  HandoverQualityResult,
  HandoverComplianceResult,
  HandoverPolicyResult,
  StaffHandoverReadinessResult,
  ChildHandoverProfile,
  HandoverIntelligence,
} from "./handover-engine";
