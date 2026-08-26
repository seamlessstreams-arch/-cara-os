// ══════════════════════════════════════════════════════════════════════════════
// Cara Incidents — Public API
// ══════════════════════════════════════════════════════════════════════════════

// ── Legacy engine (v1) ───────────────────────────────────────────────────
export {
  evaluateIncidentCompliance as evaluateIncidentComplianceLegacy,
  analyzeRestraints,
  calculateIncidentMetrics,
  getSeverityLabel,
  getCategoryLabel,
  getRestraintTypeLabel,
} from "./incident-engine";

export type {
  IncidentCategory as IncidentCategoryLegacy,
  IncidentSeverity,
  RestraintType,
  DeEscalationTechnique,
  PostIncidentAction,
  Incident,
  RestraintRecord,
  InjuryRecord,
  NotificationRecord,
  IncidentComplianceResult as IncidentComplianceResultLegacy,
  RestraintAnalysis,
  IncidentMetrics,
} from "./incident-engine";

// ── New standardised engine (v2) ─────────────────────────────────────────
export {
  generateIncidentIntelligence,
  evaluateIncidentQuality,
  evaluateIncidentCompliance,
  evaluateIncidentPolicy,
  evaluateStaffIncidentReadiness,
  buildChildIncidentProfiles,
  getRating,
  getIncidentCategoryLabel,
  getIncidentOutcomeLabel,
  getRatingLabel,
} from "./incidents-engine";

export type {
  IncidentCategory,
  IncidentOutcome,
  Rating,
  IncidentRecord,
  IncidentPolicy,
  StaffIncidentTraining,
  IncidentQualityResult,
  IncidentComplianceResult,
  IncidentPolicyResult,
  StaffIncidentReadinessResult,
  ChildIncidentProfile,
  IncidentIntelligence,
} from "./incidents-engine";
