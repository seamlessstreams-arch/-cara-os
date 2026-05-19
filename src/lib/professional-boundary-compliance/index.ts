// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Professional Boundary Compliance Intelligence — Public API
// ══════════════════════════════════════════════════════════════════════════════

export {
  evaluateBoundaryCompliance,
  evaluateChildSafeguarding,
  evaluateBoundaryPolicy,
  evaluateStaffBoundaryReadiness,
  buildStaffBoundaryProfiles,
  generateProfessionalBoundaryComplianceIntelligence,
  getBoundaryAreaLabel,
  getComplianceLevelLabel,
  getRatingLabel,
  getRating,
  pct,
} from "./professional-boundary-compliance-engine";

export type {
  BoundaryArea,
  ComplianceLevel,
  Rating,
  BoundaryAudit,
  BoundaryPolicy,
  StaffBoundaryTraining,
  BoundaryComplianceResult,
  ChildSafeguardingResult,
  BoundaryPolicyResult,
  StaffBoundaryReadinessResult,
  StaffBoundaryProfile,
  ProfessionalBoundaryComplianceIntelligence,
} from "./professional-boundary-compliance-engine";
