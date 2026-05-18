// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Home Matching Impact Intelligence — Public API
// ══════════════════════════════════════════════════════════════════════════════

export {
  evaluateMatchingQuality,
  evaluateImpactMonitoring,
  evaluateResidentConsultation,
  evaluateAdmissionOutcomes,
  generateHomeMatchingImpactIntelligence,
  getAdmissionTypeLabel,
  getMatchingDecisionLabel,
  getImpactAreaLabel,
  getImpactLevelLabel,
  getMonitoringFrequencyLabel,
} from "./home-matching-impact-engine";

export type {
  AdmissionType,
  MatchingDecision,
  ImpactArea,
  ImpactLevel,
  MonitoringFrequency,
  MatchingAssessment,
  ImpactMonitoring,
  ResidentConsultation,
  AdmissionOutcome,
  MatchingQualityResult,
  ImpactMonitoringResult,
  ResidentConsultationResult,
  AdmissionOutcomeResult,
  HomeMatchingImpactIntelligence,
} from "./home-matching-impact-engine";
