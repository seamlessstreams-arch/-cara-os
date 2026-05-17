// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Inspection — Public API
// ══════════════════════════════════════════════════════════════════════════════

export {
  calculateInspectionReadiness,
  scoreToJudgement,
  getDomainLabel,
} from "./readiness-engine";

export type {
  OfstedJudgement,
  ReadinessDomain,
  EvidenceStrength,
  DomainAssessment,
  InspectionReadinessResult,
  InspectionInputs,
} from "./readiness-engine";
