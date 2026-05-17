// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Children's Participation & Advocacy — Public API
// ══════════════════════════════════════════════════════════════════════════════

export {
  evaluateChildParticipation,
  calculateHomeParticipationMetrics,
  getDecisionAreaLabel,
  getParticipationMethodLabel,
} from "./participation-engine";

export type {
  ParticipationMethod,
  DecisionArea,
  MeetingType,
  ChildParticipationProfile,
  ParticipationEntry,
  HouseMeeting,
  FeedbackRecord,
  ChildParticipationResult,
  HomeParticipationMetrics,
} from "./participation-engine";
