export {
  evaluateConnectionBreadth,
  evaluateEngagement,
  evaluateBarriers,
  evaluateGoalProgress,
  buildChildProfiles,
  generateCommunityIntegrationIntelligence,
  getConnectionTypeLabel,
  getBarrierLabel,
  getEngagementLabel,
  getAllConnectionTypes,
} from "./community-integration-engine";

export type {
  ConnectionType,
  ConnectionStatus,
  EngagementLevel,
  BarrierType,
  CommunityConnection,
  IntegrationGoal,
  ChildProfile,
  BreadthResult,
  EngagementResult,
  BarrierResult,
  GoalProgressResult,
  ChildIntegrationProfile,
  CommunityIntegrationResult,
} from "./community-integration-engine";
