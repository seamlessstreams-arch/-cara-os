// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Multi-Agency Effectiveness Intelligence — Public API
// ══════════════════════════════════════════════════════════════════════════════

export {
  evaluateMeetingEffectiveness,
  evaluateInformationSharing,
  evaluateProfessionalRelationships,
  evaluateEscalations,
  buildChildMultiAgencyProfile,
  generateMultiAgencyEffectivenessIntelligence,
} from "./multi-agency-effectiveness-engine";

export type {
  AgencyType,
  MeetingType,
  MeetingOutcome,
  InformationSharingQuality,
  MultiAgencyMeeting,
  InformationSharingRecord,
  ProfessionalRelationship,
  Escalation,
  MeetingEffectivenessResult,
  InformationSharingResult,
  ProfessionalRelationshipResult,
  EscalationManagementResult,
  ChildMultiAgencyProfile,
  MultiAgencyEffectivenessIntelligence,
} from "./multi-agency-effectiveness-engine";
