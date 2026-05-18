// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Governance & Leadership — Public API
// ══════════════════════════════════════════════════════════════════════════════

export {
  generateGovernanceIntelligence,
  evaluateSoPCompliance,
  evaluateReg45Compliance,
  evaluatePolicyCompliance,
  evaluateNotificationCompliance,
  evaluateDevelopmentPlan,
  evaluateMeetingCompliance,
  evaluateManagementPresence,
  getPolicyCategoryLabel,
  getNotificationTypeLabel,
  getObjectiveStatusLabel,
} from "./governance-engine";

export type {
  PolicyCategory,
  NotificationType,
  NotificationRecipient,
  DevelopmentObjectiveStatus,
  MeetingType,
  StatementOfPurpose,
  Reg45Report,
  PolicyRecord,
  NotificationRecord,
  DevelopmentObjective,
  StaffMeetingRecord,
  ManagementPresence,
  SoPComplianceResult,
  Reg45ComplianceResult,
  PolicyComplianceResult,
  NotificationComplianceResult,
  DevelopmentPlanResult,
  MeetingComplianceResult,
  ManagementPresenceResult,
  GovernanceIntelligenceResult,
} from "./governance-engine";
