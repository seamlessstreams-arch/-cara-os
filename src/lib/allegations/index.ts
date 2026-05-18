// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Allegations Against Staff — Public API
// ══════════════════════════════════════════════════════════════════════════════

export {
  generateAllegationsIntelligence,
  evaluateAllegationCompliance,
  analyseAllegationPatterns,
  buildAllegationStaffProfiles,
  getAllegationCategoryLabel,
  getAllegationOutcomeLabel,
  getStaffActionLabel,
  getSourceLabel,
} from "./allegations-engine";

export type {
  AllegationCategory,
  AllegationSource,
  AllegationOutcome,
  InvestigationStatus,
  StaffAction,
  StaffMember,
  Allegation,
  AllegationComplianceResult,
  AllegationPatternResult,
  AllegationStaffProfile,
  AllegationsIntelligenceResult,
} from "./allegations-engine";
