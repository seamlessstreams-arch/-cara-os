// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Reg 44 Compliance Intelligence — Public API
// ══════════════════════════════════════════════════════════════════════════════

export {
  generateReg44ComplianceIntelligence,
  evaluateVisitCompliance,
  evaluateRecommendations,
  evaluateChildParticipation,
  evaluateManagementResponse,
  buildVisitTimeline,
  getVisitFocusLabel,
  getRecommendationPriorityLabel,
  getRecommendationStatusLabel,
} from "./reg44-compliance-engine";

export type {
  VisitFocus,
  RecommendationPriority,
  RecommendationStatus,
  Reg44Visit,
  Reg44Recommendation,
  ChildParticipation,
  ManagementResponse,
  VisitComplianceResult,
  RecommendationResult,
  ChildParticipationResult,
  ManagementResponseResult,
  VisitTimelineEntry,
  Reg44ComplianceIntelligenceResult,
} from "./reg44-compliance-engine";
