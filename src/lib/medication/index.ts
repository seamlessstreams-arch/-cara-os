// ══════════════════════════════════════════════════════════════════════════════
// Cara Medication Intelligence — Public API
// ══════════════════════════════════════════════════════════════════════════════

export {
  getRating,
  getMedicationCategoryLabel,
  getMedicationOutcomeLabel,
  getRatingLabel,
  evaluateMedicationQuality,
  evaluateMedicationCompliance,
  evaluateMedicationPolicy,
  evaluateStaffMedicationReadiness,
  buildChildMedicationProfiles,
  generateMedicationIntelligence,
} from "./medication-engine";

export type {
  MedicationCategory,
  MedicationOutcome,
  Rating,
  MedicationRecord,
  MedicationPolicy,
  StaffMedicationTraining,
  MedicationQualityResult,
  MedicationComplianceResult,
  MedicationPolicyResult,
  StaffMedicationReadinessResult,
  ChildMedicationProfile,
  MedicationIntelligence,
} from "./medication-engine";
