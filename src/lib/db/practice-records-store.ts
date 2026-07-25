/**
 * Practice Records Domain Store
 *
 * Re-export wrapper for all Practice Records collections.
 * Maintains lazy coupling during the extraction phase.
 * Do NOT modify imports in this layer; this is structural only.
 */

import { getStore } from './store';

export const getPracticeRecordsStore = () => {
  const store = getStore();
  return {
    restrictionReviews: store.restrictionReviews,
    postIncidentReflections: store.postIncidentReflections,
    stayingSafePlans: store.stayingSafePlans,
    relationshipEntries: store.relationshipEntries,
    knowledgeGovernance: store.knowledgeGovernance,
    professionalChallenges: store.professionalChallenges,
    voiceConcernLoops: store.voiceConcernLoops,
    regulationProfiles: store.regulationProfiles,
    adultRegulationReflections: store.adultRegulationReflections,
    ethicalIntelligenceEvents: store.ethicalIntelligenceEvents,
    escalationDecisions: store.escalationDecisions,
    tapSessions: store.tapSessions,
    strategyDiscussionRequests: store.strategyDiscussionRequests,
    circleRhythms: store.circleRhythms,
    circleNotes: store.circleNotes,
    helpReflections: store.helpReflections,
    caraIncidentSessions: store.caraIncidentSessions,
    caraIncidentTimeline: store.caraIncidentTimeline,
    caraRecordingReviews: store.caraRecordingReviews,
    caraRestorativeConversations: store.caraRestorativeConversations,
    caraPostIncidentReflections: store.caraPostIncidentReflections,
    restraints: store.restraints,
    notifiableEvents: store.notifiableEvents,
    nightLogs: store.nightLogs,
    behaviourLog: store.behaviourLog,
    accidentBook: store.accidentBook,
    medicationErrors: store.medicationErrors,
    complaints: store.complaints,
  };
};
