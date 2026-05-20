// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Staff Wellbeing Intelligence — Public API
// ══════════════════════════════════════════════════════════════════════════════

export {
  pct,
  getRating,
  getStaffWellbeingCategoryLabel,
  getStaffWellbeingOutcomeLabel,
  getRatingLabel,
  evaluateWellbeingQuality,
  evaluateWellbeingCompliance,
  evaluateWellbeingPolicy,
  evaluateStaffWellbeingReadiness,
  buildStaffWellbeingProfiles,
  generateStaffWellbeingIntelligence,
} from "./staff-wellbeing-engine";

export type {
  StaffWellbeingCategory,
  StaffWellbeingOutcome,
  Rating,
  StaffWellbeingRecord,
  StaffWellbeingPolicy,
  StaffWellbeingTraining,
  StaffWellbeingQualityResult,
  StaffWellbeingComplianceResult,
  StaffWellbeingPolicyResult,
  StaffWellbeingReadinessResult,
  StaffWellbeingProfile,
  StaffWellbeingIntelligence,
} from "./staff-wellbeing-engine";
