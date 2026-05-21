import { NextResponse } from "next/server";
import {
  generateVoiceOfChildIntelligenceReport,
  type VoiceOfChildRecord,
  type VoiceOfChildPolicy,
  type StaffVoiceOfChildTraining,
} from "@/lib/voice-of-child/voice-of-child-intelligence-engine";

// ── Oak House demo data ───────────────────────────────────────────────────

const DEMO_RECORDS: VoiceOfChildRecord[] = [
  { id: "voc-001", homeId: "home-oak-house", date: "2025-02-10", childId: "child-alex", childName: "Alex", category: "wishes_feelings_capture", outcome: "voice_influenced_decision", wishesFeelingsRecorded: true, childDirectlyConsulted: true, voiceInfluencedOutcome: true, ageAppropriateMethod: true, documentationComplete: true, timelyRecording: true },
  { id: "voc-002", homeId: "home-oak-house", date: "2025-03-05", childId: "child-alex", childName: "Alex", category: "care_plan_voice", outcome: "voice_influenced_decision", wishesFeelingsRecorded: true, childDirectlyConsulted: true, voiceInfluencedOutcome: true, ageAppropriateMethod: true, documentationComplete: true, timelyRecording: true },
  { id: "voc-003", homeId: "home-oak-house", date: "2025-04-12", childId: "child-alex", childName: "Alex", category: "lac_review_participation", outcome: "voice_acknowledged", wishesFeelingsRecorded: true, childDirectlyConsulted: true, voiceInfluencedOutcome: false, ageAppropriateMethod: true, documentationComplete: true, timelyRecording: true },
  { id: "voc-004", homeId: "home-oak-house", date: "2025-05-20", childId: "child-alex", childName: "Alex", category: "house_meeting_voice", outcome: "voice_influenced_decision", wishesFeelingsRecorded: true, childDirectlyConsulted: true, voiceInfluencedOutcome: true, ageAppropriateMethod: true, documentationComplete: true, timelyRecording: false },
  { id: "voc-005", homeId: "home-oak-house", date: "2025-02-18", childId: "child-jordan", childName: "Jordan", category: "wishes_feelings_capture", outcome: "voice_influenced_decision", wishesFeelingsRecorded: true, childDirectlyConsulted: true, voiceInfluencedOutcome: true, ageAppropriateMethod: true, documentationComplete: true, timelyRecording: true },
  { id: "voc-006", homeId: "home-oak-house", date: "2025-03-22", childId: "child-jordan", childName: "Jordan", category: "key_decision_participation", outcome: "voice_acknowledged", wishesFeelingsRecorded: true, childDirectlyConsulted: false, voiceInfluencedOutcome: false, ageAppropriateMethod: true, documentationComplete: true, timelyRecording: true },
  { id: "voc-007", homeId: "home-oak-house", date: "2025-05-10", childId: "child-jordan", childName: "Jordan", category: "advocacy_access", outcome: "voice_influenced_decision", wishesFeelingsRecorded: true, childDirectlyConsulted: true, voiceInfluencedOutcome: true, ageAppropriateMethod: true, documentationComplete: true, timelyRecording: true },
  { id: "voc-008", homeId: "home-oak-house", date: "2025-06-15", childId: "child-jordan", childName: "Jordan", category: "complaint_voice", outcome: "voice_partially_captured", wishesFeelingsRecorded: false, childDirectlyConsulted: true, voiceInfluencedOutcome: false, ageAppropriateMethod: true, documentationComplete: false, timelyRecording: true },
  { id: "voc-009", homeId: "home-oak-house", date: "2025-03-01", childId: "child-morgan", childName: "Morgan", category: "daily_life_choice", outcome: "voice_influenced_decision", wishesFeelingsRecorded: true, childDirectlyConsulted: true, voiceInfluencedOutcome: true, ageAppropriateMethod: true, documentationComplete: true, timelyRecording: true },
  { id: "voc-010", homeId: "home-oak-house", date: "2025-04-28", childId: "child-morgan", childName: "Morgan", category: "care_plan_voice", outcome: "voice_influenced_decision", wishesFeelingsRecorded: true, childDirectlyConsulted: true, voiceInfluencedOutcome: true, ageAppropriateMethod: true, documentationComplete: true, timelyRecording: true },
  { id: "voc-011", homeId: "home-oak-house", date: "2025-06-01", childId: "child-morgan", childName: "Morgan", category: "lac_review_participation", outcome: "voice_acknowledged", wishesFeelingsRecorded: true, childDirectlyConsulted: true, voiceInfluencedOutcome: false, ageAppropriateMethod: false, documentationComplete: true, timelyRecording: true },
  { id: "voc-012", homeId: "home-oak-house", date: "2025-07-10", childId: "child-morgan", childName: "Morgan", category: "key_decision_participation", outcome: "voice_influenced_decision", wishesFeelingsRecorded: true, childDirectlyConsulted: true, voiceInfluencedOutcome: true, ageAppropriateMethod: true, documentationComplete: true, timelyRecording: true },
];

const DEMO_POLICY: VoiceOfChildPolicy = {
  wishesFeelingsPolicy: true,
  advocacyAccessPolicy: true,
  complaintVoicePolicy: true,
  participationFramework: true,
  ageAppropriateMethodsPolicy: true,
  independentAdvocacyArrangement: true,
  childFeedbackMechanism: true,
};

const DEMO_STAFF: StaffVoiceOfChildTraining[] = [
  { staffId: "staff-sarah", wishesFeelingsCapture: true, activeListeningSkills: true, ageAppropriateEngagement: true, advocacyAwareness: true, participationFacilitation: true, nonVerbalCommunication: true },
  { staffId: "staff-tom", wishesFeelingsCapture: true, activeListeningSkills: true, ageAppropriateEngagement: true, advocacyAwareness: true, participationFacilitation: false, nonVerbalCommunication: true },
  { staffId: "staff-lisa", wishesFeelingsCapture: true, activeListeningSkills: true, ageAppropriateEngagement: true, advocacyAwareness: false, participationFacilitation: true, nonVerbalCommunication: false },
  { staffId: "staff-darren", wishesFeelingsCapture: true, activeListeningSkills: true, ageAppropriateEngagement: true, advocacyAwareness: true, participationFacilitation: true, nonVerbalCommunication: true },
];

export async function GET() {
  const result = generateVoiceOfChildIntelligenceReport({
    homeId: "home-oak-house",
    periodStart: "2025-01-01",
    periodEnd: "2025-12-31",
    records: DEMO_RECORDS,
    policy: DEMO_POLICY,
    staff: DEMO_STAFF,
  });

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        generatedAt: new Date().toISOString(),
        engine: "voice-of-child-intelligence-engine",
        version: "1.0.0",
      },
    },
  });
}
