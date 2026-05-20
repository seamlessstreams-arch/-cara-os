// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Homework & Study Support Intelligence -- Public API
// ══════════════════════════════════════════════════════════════════════════════

export {
  evaluateQuality,
  evaluateCompliance,
  evaluatePolicy,
  evaluateStaffReadiness,
  buildChildProfiles,
  generateHomeworkStudySupportIntelligence,
  getRating,
  getStudyActivityTypeLabel,
  getEngagementLevelLabel,
  getRatingLabel,
  pct,
} from "./homework-study-support-engine";

export type {
  StudyActivityType,
  EngagementLevel,
  Rating,
  StudySession,
  StudySupportPolicy,
  StaffStudySupportTraining,
  QualityResult,
  ComplianceResult,
  PolicyResult,
  StaffReadinessResult,
  ChildProfile,
  HomeworkStudySupportIntelligence,
} from "./homework-study-support-engine";
