// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Inspection — Public API
// ══════════════════════════════════════════════════════════════════════════════

export {
  generateInspectionIntelligence,
  evaluateInspectionQuality,
  evaluateInspectionCompliance,
  evaluateInspectionPolicy,
  evaluateStaffInspectionReadiness,
  buildChildInspectionProfiles,
  pct,
  getRating,
  getInspectionCategoryLabel,
  getInspectionOutcomeLabel,
  getRatingLabel,
} from "./inspection-engine";

export type {
  InspectionCategory,
  InspectionOutcome,
  Rating,
  InspectionRecord,
  InspectionPolicy,
  StaffInspectionTraining,
  InspectionQualityResult,
  InspectionComplianceResult,
  InspectionPolicyResult,
  StaffInspectionReadinessResult,
  ChildInspectionProfile,
  InspectionIntelligence,
} from "./inspection-engine";

// Legacy re-exports (old readiness engine)
export {
  calculateInspectionReadiness,
  scoreToJudgement,
  getDomainLabel,
} from "./readiness-engine";

export type {
  OfstedJudgement,
  ReadinessDomain,
  EvidenceStrength,
  DomainAssessment,
  InspectionReadinessResult,
  InspectionInputs,
} from "./readiness-engine";
