// ══════════════════════════════════════════════════════════════════════════════
// ARIA STUDIO — BARREL EXPORT
// ══════════════════════════════════════════════════════════════════════════════

export { getStudioAIProvider, generateStudioContent } from "./ai-provider.service";
export { buildGenerationPrompt, ARIA_STUDIO_SYSTEM_PROMPT, FRAMEWORK_PROMPTS, TONE_PROMPTS, ARTIFACT_TYPE_PROMPTS } from "./prompts";
export { generateArtifact } from "./generation.service";
export { indexSource, listSources, getSource, searchSources } from "./source.service";
export { assessEvidence, assessMultipleSources, calculateOverallConfidence } from "./evidence.service";
export { detectGaps, resolveGap } from "./gap-detection.service";
export { runQualityCheck } from "./quality-check.service";
export { submitForReview, reviewArtifact, approveArtifact, commitArtifact, rejectArtifact } from "./approval.service";
export { writeStudioAuditLog, getAuditTrail } from "./audit.service";
export { upsertGraphNode, createGraphEdge, getNodesByType, getEdgesForNode, getChildKnowledgeGraph, findConnections, autoPopulateGraphForChild } from "./care-graph.service";
export { detectContradictions, listContradictions, resolveContradiction } from "./contradiction.service";
export { scanSafeguardingPatterns, listSafeguardingPatterns, reviewSafeguardingPattern } from "./safeguarding-patterns.service";
export { generateHomeDynamicsSnapshot, getLatestSnapshot, listSnapshots } from "./home-dynamics.service";
export { runEarlyWarningChecks, listEarlyWarnings, reviewEarlyWarning } from "./early-warning.service";
export { createFormulation, getFormulationForChild, listFormulations, updateFormulation, approveFormulation } from "./formulation.service";
export { createDecisionSupport, getDecisionSupport, listDecisionSupport, recordDecision } from "./decision-support.service";
