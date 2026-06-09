import { NextResponse } from "next/server";
import {
  generateActivitiesIntelligence,
} from "@/lib/activities";
import type {
  ActivityRecord,
  ActivityPolicy,
  StaffActivityTraining,
} from "@/lib/activities";

// ── Demo Data: Chamberlain House ──────────────────────────────────────────────────

function generateDemoData(): {
  records: ActivityRecord[];
  policy: ActivityPolicy;
  training: StaffActivityTraining[];
} {
  const records: ActivityRecord[] = [
    // Alex — 4 records
    { id: "act-001", childId: "child-alex", childName: "Alex", activityDate: "2026-01-20", category: "sport_physical", childChoiceOffered: true, ageAppropriate: true, inclusiveParticipation: true, enjoymentRecorded: true, documentationComplete: true, riskAssessed: true },
    { id: "act-002", childId: "child-alex", childName: "Alex", activityDate: "2026-02-10", category: "creative_arts", childChoiceOffered: true, ageAppropriate: true, inclusiveParticipation: true, enjoymentRecorded: true, documentationComplete: true, riskAssessed: true },
    { id: "act-003", childId: "child-alex", childName: "Alex", activityDate: "2026-03-05", category: "outdoor_adventure", childChoiceOffered: true, ageAppropriate: true, inclusiveParticipation: true, enjoymentRecorded: true, documentationComplete: true, riskAssessed: true },
    { id: "act-004", childId: "child-alex", childName: "Alex", activityDate: "2026-04-15", category: "social_recreational", childChoiceOffered: true, ageAppropriate: true, inclusiveParticipation: false, enjoymentRecorded: true, documentationComplete: true, riskAssessed: false },

    // Jordan — 4 records
    { id: "act-005", childId: "child-jordan", childName: "Jordan", activityDate: "2026-01-25", category: "sport_physical", childChoiceOffered: true, ageAppropriate: true, inclusiveParticipation: true, enjoymentRecorded: true, documentationComplete: true, riskAssessed: true },
    { id: "act-006", childId: "child-jordan", childName: "Jordan", activityDate: "2026-02-18", category: "educational_enrichment", childChoiceOffered: true, ageAppropriate: true, inclusiveParticipation: true, enjoymentRecorded: true, documentationComplete: true, riskAssessed: true },
    { id: "act-007", childId: "child-jordan", childName: "Jordan", activityDate: "2026-03-12", category: "community_involvement", childChoiceOffered: false, ageAppropriate: true, inclusiveParticipation: true, enjoymentRecorded: false, documentationComplete: true, riskAssessed: true },
    { id: "act-008", childId: "child-jordan", childName: "Jordan", activityDate: "2026-04-22", category: "cultural_heritage", childChoiceOffered: true, ageAppropriate: true, inclusiveParticipation: true, enjoymentRecorded: true, documentationComplete: false, riskAssessed: true },

    // Morgan — 4 records
    { id: "act-009", childId: "child-morgan", childName: "Morgan", activityDate: "2026-01-30", category: "creative_arts", childChoiceOffered: true, ageAppropriate: true, inclusiveParticipation: true, enjoymentRecorded: true, documentationComplete: true, riskAssessed: true },
    { id: "act-010", childId: "child-morgan", childName: "Morgan", activityDate: "2026-02-25", category: "therapeutic_activity", childChoiceOffered: true, ageAppropriate: true, inclusiveParticipation: true, enjoymentRecorded: true, documentationComplete: true, riskAssessed: true },
    { id: "act-011", childId: "child-morgan", childName: "Morgan", activityDate: "2026-03-18", category: "outdoor_adventure", childChoiceOffered: true, ageAppropriate: true, inclusiveParticipation: true, enjoymentRecorded: true, documentationComplete: true, riskAssessed: true },
    { id: "act-012", childId: "child-morgan", childName: "Morgan", activityDate: "2026-04-28", category: "social_recreational", childChoiceOffered: true, ageAppropriate: true, inclusiveParticipation: true, enjoymentRecorded: true, documentationComplete: true, riskAssessed: true },
  ];

  const policy: ActivityPolicy = {
    id: "pol-001",
    activitiesPolicy: true,
    inclusionFramework: true,
    riskAssessmentProtocol: true,
    childParticipationGuidance: true,
    communityEngagementStrategy: true,
    budgetAllocationPolicy: true,
    reviewSchedule: true,
  };

  const training: StaffActivityTraining[] = [
    { id: "tr-001", staffId: "staff-sarah", staffName: "Sarah Johnson", activityPlanning: true, safeguardingAwareness: true, inclusionSkills: true, riskManagement: true, communityLinks: true, firstAid: true },
    { id: "tr-002", staffId: "staff-tom", staffName: "Tom Richards", activityPlanning: true, safeguardingAwareness: true, inclusionSkills: true, riskManagement: true, communityLinks: false, firstAid: false },
    { id: "tr-003", staffId: "staff-lisa", staffName: "Lisa Williams", activityPlanning: true, safeguardingAwareness: true, inclusionSkills: false, riskManagement: true, communityLinks: true, firstAid: false },
    { id: "tr-004", staffId: "staff-darren", staffName: "Darren Laville", activityPlanning: true, safeguardingAwareness: true, inclusionSkills: true, riskManagement: true, communityLinks: true, firstAid: true },
  ];

  return { records, policy, training };
}

// ── GET Handler ──────────────────────────────────────────────────────────

export async function GET() {
  const { records, policy, training } = generateDemoData();

  const result = generateActivitiesIntelligence(
    records,
    policy,
    training,
    "oak-house",
    "2026-01-01",
    "2026-05-20",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        generatedAt: new Date().toISOString(),
        engine: "activities",
        version: "2.0.0",
      },
    },
  });
}
