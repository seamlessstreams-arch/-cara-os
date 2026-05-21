// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Home Intelligence Summary — Public API
// ══════════════════════════════════════════════════════════════════════════════

export {
  generateHomeIntelligenceSummary,
  evaluateDomainQuality,
  evaluateModuleCoverage,
  evaluateOfstedAlignment,
  evaluateRiskProfile,
  buildDomainSummaries,
  pct,
  getRating,
  getDomainLabel,
  getRatingLabel,
} from "./home-intelligence-engine";

export type {
  HomeIntelligenceDomain,
  Rating,
  ModuleIntelligenceScore,
  DomainSummary,
  DomainQualityResult,
  ModuleCoverageResult,
  OfstedAlignmentResult,
  RiskProfileResult,
  HomeIntelligenceSummary,
  GenerateHomeIntelligenceSummaryInput,
} from "./home-intelligence-engine";
