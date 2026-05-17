// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Education & PEP Tracking — Public API
// ══════════════════════════════════════════════════════════════════════════════

export {
  evaluateEducationCompliance,
  calculateHomeEducationMetrics,
  getEducationStatusLabel,
  getKeyStageLabel,
  getAttainmentLabel,
} from "./education-engine";

export type {
  EducationStatus,
  KeyStage,
  AttainmentLevel,
  PEPStatus,
  ChildEducationRecord,
  PEPTarget,
  SubjectAttainment,
  ExclusionRecord,
  EducationComplianceResult,
  HomeEducationMetrics,
} from "./education-engine";
