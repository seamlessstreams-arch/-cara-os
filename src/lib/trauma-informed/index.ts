// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Trauma-Informed Care Intelligence — Public API
// ══════════════════════════════════════════════════════════════════════════════

export {
  evaluateStaffCompetency,
  evaluatePracticeQuality,
  evaluateEnvironment,
  evaluateConsultation,
  evaluateTraumaScreening,
  generateTraumaInformedIntelligence,
  getRatingLabel,
  getRatingColour,
  getCompetencyLabel,
  getPrincipleLabel,
  getIndicatorLabel,
} from "./trauma-informed-engine";

export type {
  TraumaPrinciple,
  PracticeIndicator,
  StaffCompetencyLevel,
  OfstedRating,
  TraumaTrainingRecord,
  TherapeuticInterventionRecord,
  EnvironmentalAdaptation,
  ConsultationRecord,
  TraumaScreening,
  StaffCompetencyEvaluation,
  PracticeQualityEvaluation,
  PerChildQuality,
  EnvironmentEvaluation,
  ConsultationEvaluation,
  TraumaScreeningEvaluation,
  RegulatoryLink,
  TraumaInformedIntelligence,
} from "./trauma-informed-engine";
