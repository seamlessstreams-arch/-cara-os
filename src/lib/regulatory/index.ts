// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Regulatory — Public API
// ══════════════════════════════════════════════════════════════════════════════

export {
  generateRegulatoryIntelligence,
  evaluateRegulatoryQuality,
  evaluateRegulatoryCompliance as evaluateRegulatoryComplianceIntel,
  evaluateRegulatoryPolicy,
  evaluateStaffRegulatoryReadiness,
  buildChildRegulatoryProfiles,
  pct,
  getRating,
  getRegulatoryCategoryLabel,
  getRegulatoryOutcomeLabel,
  getRatingLabel,
} from "./regulatory-intelligence-engine";

export type {
  RegulatoryCategory, RegulatoryOutcome, Rating,
  RegulatoryRecord, RegulatoryPolicy, StaffRegulatoryTraining,
  RegulatoryQualityResult, RegulatoryComplianceResult, RegulatoryPolicyResult,
  StaffRegulatoryReadinessResult, ChildRegulatoryProfile,
  RegulatoryIntelligence, GenerateRegulatoryIntelligenceInput,
} from "./regulatory-intelligence-engine";

// Legacy re-exports from reporting-engine
export {
  evaluateRegulatoryCompliance,
  checkNotificationTimeliness,
  generateReg44Schedule,
  validateReg44Report,
  summarizeActionPoints,
  getNotificationDeadlineHours,
  getReg44Sections,
  getNotificationTypeLabel,
  getReg44SectionLabel,
} from "./reporting-engine";

export type {
  ReportType, ReportStatus, NotificationType, Reg44Section,
  Schedule4Matter, Reg44Report, Reg44SectionEntry, ActionPoint,
  Reg45Review, Schedule4Finding, StatutoryNotification,
  RegulatoryComplianceResult as RegulatoryComplianceResultLegacy,
  Reg44ValidationResult, ActionPointSummary,
} from "./reporting-engine";
