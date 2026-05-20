import { NextResponse } from "next/server";
import { generateTherapeuticIntelligence } from "@/lib/therapeutic";
import type {
  TherapeuticRecord,
  TherapeuticPolicy,
  StaffTherapeuticTraining,
} from "@/lib/therapeutic";

// ── Demo Data ─────────────────────────────────────────────────────────────

const DEMO_RECORDS: TherapeuticRecord[] = [
  // Alex — individual therapy, trauma-informed care, wellbeing assessment
  { id: "th-001", homeId: "home-oak", date: "2026-01-15", childId: "child-alex", childName: "Alex", category: "individual_therapy", outcome: "positive_progress", therapeuticGoalAligned: true, voiceOfChildIncluded: true, evidenceBasedApproach: true, wellbeingImpactRecorded: true, documentationComplete: true, timelyRecording: true },
  { id: "th-002", homeId: "home-oak", date: "2026-02-10", childId: "child-alex", childName: "Alex", category: "trauma_informed_care", outcome: "positive_progress", therapeuticGoalAligned: true, voiceOfChildIncluded: true, evidenceBasedApproach: true, wellbeingImpactRecorded: true, documentationComplete: true, timelyRecording: true },
  { id: "th-003", homeId: "home-oak", date: "2026-03-05", childId: "child-alex", childName: "Alex", category: "wellbeing_assessment", outcome: "maintaining", therapeuticGoalAligned: true, voiceOfChildIncluded: true, evidenceBasedApproach: true, wellbeingImpactRecorded: true, documentationComplete: true, timelyRecording: true },
  { id: "th-004", homeId: "home-oak", date: "2026-04-01", childId: "child-alex", childName: "Alex", category: "emotional_regulation", outcome: "positive_progress", therapeuticGoalAligned: true, voiceOfChildIncluded: true, evidenceBasedApproach: true, wellbeingImpactRecorded: true, documentationComplete: true, timelyRecording: true },

  // Jordan — group therapy, crisis intervention, mental health review
  { id: "th-005", homeId: "home-oak", date: "2026-01-20", childId: "child-jordan", childName: "Jordan", category: "group_therapy", outcome: "some_improvement", therapeuticGoalAligned: true, voiceOfChildIncluded: true, evidenceBasedApproach: true, wellbeingImpactRecorded: true, documentationComplete: true, timelyRecording: true },
  { id: "th-006", homeId: "home-oak", date: "2026-02-15", childId: "child-jordan", childName: "Jordan", category: "crisis_intervention", outcome: "maintaining", therapeuticGoalAligned: true, voiceOfChildIncluded: true, evidenceBasedApproach: true, wellbeingImpactRecorded: true, documentationComplete: true, timelyRecording: true },
  { id: "th-007", homeId: "home-oak", date: "2026-03-10", childId: "child-jordan", childName: "Jordan", category: "mental_health_review", outcome: "positive_progress", therapeuticGoalAligned: true, voiceOfChildIncluded: true, evidenceBasedApproach: true, wellbeingImpactRecorded: true, documentationComplete: true, timelyRecording: false },
  { id: "th-008", homeId: "home-oak", date: "2026-04-10", childId: "child-jordan", childName: "Jordan", category: "therapeutic_activity", outcome: "some_improvement", therapeuticGoalAligned: true, voiceOfChildIncluded: true, evidenceBasedApproach: true, wellbeingImpactRecorded: true, documentationComplete: true, timelyRecording: true },

  // Morgan — emotional regulation, therapeutic activity, wellbeing
  { id: "th-009", homeId: "home-oak", date: "2026-02-01", childId: "child-morgan", childName: "Morgan", category: "emotional_regulation", outcome: "positive_progress", therapeuticGoalAligned: true, voiceOfChildIncluded: true, evidenceBasedApproach: true, wellbeingImpactRecorded: true, documentationComplete: true, timelyRecording: true },
  { id: "th-010", homeId: "home-oak", date: "2026-03-15", childId: "child-morgan", childName: "Morgan", category: "therapeutic_activity", outcome: "maintaining", therapeuticGoalAligned: true, voiceOfChildIncluded: true, evidenceBasedApproach: true, wellbeingImpactRecorded: true, documentationComplete: true, timelyRecording: true },
  { id: "th-011", homeId: "home-oak", date: "2026-04-10", childId: "child-morgan", childName: "Morgan", category: "wellbeing_assessment", outcome: "positive_progress", therapeuticGoalAligned: false, voiceOfChildIncluded: true, evidenceBasedApproach: true, wellbeingImpactRecorded: true, documentationComplete: true, timelyRecording: true },
  { id: "th-012", homeId: "home-oak", date: "2026-05-01", childId: "child-morgan", childName: "Morgan", category: "individual_therapy", outcome: "some_improvement", therapeuticGoalAligned: true, voiceOfChildIncluded: false, evidenceBasedApproach: true, wellbeingImpactRecorded: true, documentationComplete: false, timelyRecording: true },
];

const DEMO_POLICY: TherapeuticPolicy = {
  therapeuticCareModel: true,
  traumaInformedPolicy: true,
  emotionalRegulationFramework: true,
  mentalHealthSupportPolicy: true,
  crisisInterventionProtocol: true,
  wellbeingMonitoringPolicy: true,
  therapeuticSupervisionPolicy: true,
};

const DEMO_STAFF: StaffTherapeuticTraining[] = [
  { staffId: "staff-sarah", therapeuticCareKnowledge: true, traumaInformedPractice: true, emotionalRegulationSkills: true, mentalHealthAwareness: true, crisisDeEscalation: true, therapeuticRelationshipBuilding: true },
  { staffId: "staff-tom", therapeuticCareKnowledge: true, traumaInformedPractice: true, emotionalRegulationSkills: true, mentalHealthAwareness: true, crisisDeEscalation: true, therapeuticRelationshipBuilding: false },
  { staffId: "staff-lisa", therapeuticCareKnowledge: true, traumaInformedPractice: true, emotionalRegulationSkills: true, mentalHealthAwareness: true, crisisDeEscalation: false, therapeuticRelationshipBuilding: true },
  { staffId: "staff-darren", therapeuticCareKnowledge: true, traumaInformedPractice: true, emotionalRegulationSkills: true, mentalHealthAwareness: true, crisisDeEscalation: true, therapeuticRelationshipBuilding: true },
];

// ── Handler ───────────────────────────────────────────────────────────────

export async function GET() {
  const result = generateTherapeuticIntelligence({
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
      meta: {
        generatedAt: new Date().toISOString(),
        engine: "therapeutic-intelligence",
        version: "2.0.0",
      },
    },
  });
}
