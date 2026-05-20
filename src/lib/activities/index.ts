// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Activities & Enrichment Intelligence — Public API
// ══════════════════════════════════════════════════════════════════════════════

export {
  pct,
  getRating,
  getActivityCategoryLabel,
  getActivityOutcomeLabel,
  getRatingLabel,
  evaluateActivityQuality,
  evaluateActivityCompliance,
  evaluateActivityPolicy,
  evaluateStaffActivityReadiness,
  buildChildActivityProfiles,
  generateActivitiesIntelligence,
} from "./activities-engine";

export type {
  ActivityCategory,
  ActivityOutcome,
  Rating,
  ActivityRecord,
  ActivityPolicy,
  StaffActivityTraining,
  ActivityQualityResult,
  ActivityComplianceResult,
  ActivityPolicyResult,
  StaffActivityReadinessResult,
  ChildActivityProfile,
  ActivitiesIntelligence,
} from "./activities-engine";
