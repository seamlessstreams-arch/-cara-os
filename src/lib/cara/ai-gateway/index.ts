// Cara AI Gateway — the single chokepoint for every AI/LLM call.
// Deterministic-first: rules → cache → availability → permission → sensitivity →
// redaction → cost-limit → metered provider call → cache-store → audit.
export {
  invokeAiGateway,
  getAiGatewayAuditLog,
  __resetAiGatewayAuditLog,
} from "./ai-gateway";
export type {
  AiGatewayRequest,
  AiGatewayResult,
  AiGatewayMethod,
  AiGatewayIdentity,
  AiGatewayDeps,
  AiGatewayAuditEntry,
} from "./ai-gateway";
export { summariseGatewayAudit, classifyRefusal } from "./audit-summary";
export type {
  GatewayAuditSummary,
  GatewayFeatureStat,
  GatewayRefusalStat,
  GatewayRefusalReason,
} from "./audit-summary";
