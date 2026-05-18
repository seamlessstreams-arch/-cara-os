// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Shift Pattern & Staff Deployment Intelligence — Public API
// ══════════════════════════════════════════════════════════════════════════════

export {
  generateDeploymentIntelligence,
  evaluateFatigueRisk,
  evaluateKeyWorkerAvailability,
  analyseShiftCoverage,
  calculateShiftDurationHours,
  calculateRestGapHours,
  getComplianceRatingLabel,
  getFatigueRiskLabel,
  getShiftTypeLabel,
} from "./shift-intelligence-engine";

export type {
  ShiftType,
  StaffRole,
  FatigueRiskLevel,
  DeploymentConcern,
  ShiftRecord,
  StaffProfile,
  HomeShiftRequirements,
  FatigueAssessment,
  KeyWorkerAvailability,
  ShiftCoverageResult,
  DeploymentIntelligenceResult,
} from "./shift-intelligence-engine";
