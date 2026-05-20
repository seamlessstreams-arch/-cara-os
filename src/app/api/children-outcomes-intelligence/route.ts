import { NextResponse } from "next/server";
import { generateChildrenOutcomesIntelligence } from "@/lib/children-outcomes";
import type { ChildrenOutcomesRecord, ChildrenOutcomesPolicy, StaffChildrenOutcomesTraining } from "@/lib/children-outcomes";

const DEMO_RECORDS: ChildrenOutcomesRecord[] = [
  { id: "co-001", homeId: "home-oak", date: "2026-01-15", childId: "child-alex", childName: "Alex", category: "educational_achievement", outcome: "good_progress", outcomeMeasured: true, progressEvidenced: true, interventionAligned: true, voiceOfChildCaptured: true, documentationComplete: true, timelyRecording: true },
  { id: "co-002", homeId: "home-oak", date: "2026-02-10", childId: "child-alex", childName: "Alex", category: "health_wellbeing", outcome: "exceptional_progress", outcomeMeasured: true, progressEvidenced: true, interventionAligned: true, voiceOfChildCaptured: true, documentationComplete: true, timelyRecording: true },
  { id: "co-003", homeId: "home-oak", date: "2026-03-05", childId: "child-alex", childName: "Alex", category: "emotional_development", outcome: "good_progress", outcomeMeasured: true, progressEvidenced: true, interventionAligned: true, voiceOfChildCaptured: true, documentationComplete: true, timelyRecording: true },
  { id: "co-004", homeId: "home-oak", date: "2026-04-01", childId: "child-alex", childName: "Alex", category: "social_skills", outcome: "good_progress", outcomeMeasured: true, progressEvidenced: true, interventionAligned: true, voiceOfChildCaptured: true, documentationComplete: true, timelyRecording: true },
  { id: "co-005", homeId: "home-oak", date: "2026-01-20", childId: "child-jordan", childName: "Jordan", category: "independent_living", outcome: "good_progress", outcomeMeasured: true, progressEvidenced: true, interventionAligned: true, voiceOfChildCaptured: true, documentationComplete: true, timelyRecording: true },
  { id: "co-006", homeId: "home-oak", date: "2026-02-15", childId: "child-jordan", childName: "Jordan", category: "identity_belonging", outcome: "steady_progress", outcomeMeasured: true, progressEvidenced: true, interventionAligned: true, voiceOfChildCaptured: true, documentationComplete: true, timelyRecording: true },
  { id: "co-007", homeId: "home-oak", date: "2026-03-10", childId: "child-jordan", childName: "Jordan", category: "positive_relationships", outcome: "good_progress", outcomeMeasured: true, progressEvidenced: true, interventionAligned: true, voiceOfChildCaptured: false, documentationComplete: true, timelyRecording: false },
  { id: "co-008", homeId: "home-oak", date: "2026-04-10", childId: "child-jordan", childName: "Jordan", category: "safety_stability", outcome: "good_progress", outcomeMeasured: true, progressEvidenced: true, interventionAligned: true, voiceOfChildCaptured: true, documentationComplete: true, timelyRecording: true },
  { id: "co-009", homeId: "home-oak", date: "2026-02-01", childId: "child-morgan", childName: "Morgan", category: "educational_achievement", outcome: "good_progress", outcomeMeasured: true, progressEvidenced: true, interventionAligned: true, voiceOfChildCaptured: true, documentationComplete: true, timelyRecording: true },
  { id: "co-010", homeId: "home-oak", date: "2026-03-15", childId: "child-morgan", childName: "Morgan", category: "health_wellbeing", outcome: "good_progress", outcomeMeasured: true, progressEvidenced: true, interventionAligned: true, voiceOfChildCaptured: true, documentationComplete: true, timelyRecording: true },
  { id: "co-011", homeId: "home-oak", date: "2026-04-10", childId: "child-morgan", childName: "Morgan", category: "emotional_development", outcome: "steady_progress", outcomeMeasured: true, progressEvidenced: false, interventionAligned: true, voiceOfChildCaptured: true, documentationComplete: true, timelyRecording: true },
  { id: "co-012", homeId: "home-oak", date: "2026-05-01", childId: "child-morgan", childName: "Morgan", category: "social_skills", outcome: "good_progress", outcomeMeasured: true, progressEvidenced: true, interventionAligned: false, voiceOfChildCaptured: true, documentationComplete: false, timelyRecording: true },
];

const DEMO_POLICY: ChildrenOutcomesPolicy = {
  outcomesFrameworkPolicy: true, progressTrackingPolicy: true, educationSupportPolicy: true,
  healthWellbeingPolicy: true, independentLivingSkillsPolicy: true, voiceOfChildPolicy: true, multiAgencyOutcomesPolicy: true,
};

const DEMO_STAFF: StaffChildrenOutcomesTraining[] = [
  { staffId: "staff-sarah", outcomesFrameworkKnowledge: true, progressTrackingSkills: true, therapeuticInterventions: true, educationalSupportSkills: true, voiceOfChildTechniques: true, multiAgencyCollaboration: true },
  { staffId: "staff-tom", outcomesFrameworkKnowledge: true, progressTrackingSkills: true, therapeuticInterventions: true, educationalSupportSkills: true, voiceOfChildTechniques: true, multiAgencyCollaboration: false },
  { staffId: "staff-lisa", outcomesFrameworkKnowledge: true, progressTrackingSkills: true, therapeuticInterventions: true, educationalSupportSkills: true, voiceOfChildTechniques: false, multiAgencyCollaboration: true },
  { staffId: "staff-darren", outcomesFrameworkKnowledge: true, progressTrackingSkills: true, therapeuticInterventions: true, educationalSupportSkills: true, voiceOfChildTechniques: true, multiAgencyCollaboration: true },
];

export async function GET() {
  const result = generateChildrenOutcomesIntelligence({
    homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-05-20",
    records: DEMO_RECORDS, policy: DEMO_POLICY, staff: DEMO_STAFF,
  });
  return NextResponse.json({ data: { ...result, meta: { generatedAt: new Date().toISOString(), engine: "children-outcomes-intelligence", version: "2.0.0" } } });
}
