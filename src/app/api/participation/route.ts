import { NextResponse } from "next/server";
import { generateParticipationIntelligence } from "@/lib/participation";
import type { ParticipationRecord, ParticipationPolicy, StaffParticipationTraining } from "@/lib/participation";

// ── Demo Data ─────────────────────────────────────────────────────────────

const DEMO_RECORDS: ParticipationRecord[] = [
  { id: "par-001", homeId: "home-oak", date: "2026-05-14", childId: "child-alex", childName: "Alex", category: "care_plan_voice", outcome: "views_acted_upon", childViewRecorded: true, viewsActedUpon: true, advocacyOffered: true, feedbackProvided: true, documentationComplete: true, timelyRecording: true },
  { id: "par-002", homeId: "home-oak", date: "2026-05-07", childId: "child-jordan", childName: "Jordan", category: "advocacy_access", outcome: "views_acted_upon", childViewRecorded: true, viewsActedUpon: true, advocacyOffered: true, feedbackProvided: true, documentationComplete: true, timelyRecording: true },
  { id: "par-003", homeId: "home-oak", date: "2026-04-30", childId: "child-morgan", childName: "Morgan", category: "complaints_awareness", outcome: "views_recorded", childViewRecorded: true, viewsActedUpon: false, advocacyOffered: true, feedbackProvided: true, documentationComplete: true, timelyRecording: true },
  { id: "par-004", homeId: "home-oak", date: "2026-04-23", childId: "child-alex", childName: "Alex", category: "house_meeting_input", outcome: "views_acted_upon", childViewRecorded: true, viewsActedUpon: true, advocacyOffered: true, feedbackProvided: true, documentationComplete: true, timelyRecording: true },
  { id: "par-005", homeId: "home-oak", date: "2026-04-16", childId: "child-jordan", childName: "Jordan", category: "review_participation", outcome: "views_acted_upon", childViewRecorded: true, viewsActedUpon: true, advocacyOffered: true, feedbackProvided: true, documentationComplete: true, timelyRecording: true },
  { id: "par-006", homeId: "home-oak", date: "2026-04-09", childId: "child-morgan", childName: "Morgan", category: "daily_decisions", outcome: "views_acted_upon", childViewRecorded: true, viewsActedUpon: true, advocacyOffered: true, feedbackProvided: false, documentationComplete: true, timelyRecording: false },
  { id: "par-007", homeId: "home-oak", date: "2026-04-02", childId: "child-alex", childName: "Alex", category: "feedback_mechanism", outcome: "views_acted_upon", childViewRecorded: true, viewsActedUpon: true, advocacyOffered: false, feedbackProvided: true, documentationComplete: true, timelyRecording: true },
  { id: "par-008", homeId: "home-oak", date: "2026-03-26", childId: "child-jordan", childName: "Jordan", category: "rights_education", outcome: "views_acted_upon", childViewRecorded: true, viewsActedUpon: true, advocacyOffered: true, feedbackProvided: true, documentationComplete: true, timelyRecording: true },
  { id: "par-009", homeId: "home-oak", date: "2026-03-19", childId: "child-morgan", childName: "Morgan", category: "care_plan_voice", outcome: "views_partially_acted", childViewRecorded: true, viewsActedUpon: false, advocacyOffered: true, feedbackProvided: true, documentationComplete: false, timelyRecording: true },
  { id: "par-010", homeId: "home-oak", date: "2026-03-12", childId: "child-alex", childName: "Alex", category: "advocacy_access", outcome: "views_acted_upon", childViewRecorded: true, viewsActedUpon: true, advocacyOffered: true, feedbackProvided: true, documentationComplete: true, timelyRecording: true },
  { id: "par-011", homeId: "home-oak", date: "2026-03-05", childId: "child-jordan", childName: "Jordan", category: "complaints_awareness", outcome: "child_declined", childViewRecorded: false, viewsActedUpon: false, advocacyOffered: true, feedbackProvided: true, documentationComplete: true, timelyRecording: true },
  { id: "par-012", homeId: "home-oak", date: "2026-02-26", childId: "child-morgan", childName: "Morgan", category: "house_meeting_input", outcome: "views_acted_upon", childViewRecorded: true, viewsActedUpon: true, advocacyOffered: true, feedbackProvided: true, documentationComplete: true, timelyRecording: true },
];

const DEMO_POLICY: ParticipationPolicy = {
  participationPolicy: true,
  advocacyAccessPolicy: true,
  complaintsAwarenessFramework: true,
  childVoiceInCarePlanning: true,
  feedbackMechanismPolicy: true,
  rightsEducationPolicy: true,
  independentVisitorScheme: true,
};

const DEMO_STAFF: StaffParticipationTraining[] = [
  { staffId: "staff-sarah", childVoiceCapture: true, advocacyKnowledge: true, participationFacilitation: true, complaintsAwareness: true, rightsBasedPractice: true, feedbackResponsiveness: true },
  { staffId: "staff-tom", childVoiceCapture: true, advocacyKnowledge: true, participationFacilitation: true, complaintsAwareness: true, rightsBasedPractice: false, feedbackResponsiveness: true },
  { staffId: "staff-lisa", childVoiceCapture: true, advocacyKnowledge: true, participationFacilitation: true, complaintsAwareness: true, rightsBasedPractice: true, feedbackResponsiveness: true },
  { staffId: "staff-darren", childVoiceCapture: true, advocacyKnowledge: true, participationFacilitation: true, complaintsAwareness: true, rightsBasedPractice: true, feedbackResponsiveness: true },
];

// ── Handler ───────────────────────────────────────────────────────────────

export async function GET() {
  const result = generateParticipationIntelligence({
    homeId: "home-oak",
    periodStart: "2026-01-01",
    periodEnd: "2026-05-20",
    records: DEMO_RECORDS,
    policy: DEMO_POLICY,
    staff: DEMO_STAFF,
  });

  return NextResponse.json({
    data: {
      ...result,
      meta: { generatedAt: new Date().toISOString(), engine: "participation", version: "2.0.0" },
    },
  });
}
