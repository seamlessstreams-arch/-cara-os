import { NextResponse } from "next/server";
import {
  generateLifeStoryIntelligence,
} from "@/lib/life-story";
import type { LifeStoryRecord, LifeStoryPolicy, StaffLifeStoryTraining } from "@/lib/life-story";

// ── Demo Data ──────────────────────────────────────────────────────────────

const demoRecords: LifeStoryRecord[] = [
  // Alex — regular, high-quality life story work
  { id: "ls-1", childId: "child-alex", childName: "Alex", sessionDate: "2026-03-10", sessionType: "life_story_book", completed: true, childLedContent: true, childEngagement: "high", addedToLifeStoryBook: true, memoryBoxUpdated: true, photographsTaken: false, identityNeedsAddressed: true, culturalActivityIncluded: true, familyConnectionExplored: true },
  { id: "ls-2", childId: "child-alex", childName: "Alex", sessionDate: "2026-03-24", sessionType: "memory_box", completed: true, childLedContent: true, childEngagement: "high", addedToLifeStoryBook: false, memoryBoxUpdated: true, photographsTaken: true, identityNeedsAddressed: true, culturalActivityIncluded: false, familyConnectionExplored: false },
  { id: "ls-3", childId: "child-alex", childName: "Alex", sessionDate: "2026-04-07", sessionType: "photograph_session", completed: true, childLedContent: true, childEngagement: "moderate", addedToLifeStoryBook: true, memoryBoxUpdated: true, photographsTaken: true, identityNeedsAddressed: false, culturalActivityIncluded: false, familyConnectionExplored: true },
  { id: "ls-4", childId: "child-alex", childName: "Alex", sessionDate: "2026-04-21", sessionType: "family_tree", completed: true, childLedContent: true, childEngagement: "high", addedToLifeStoryBook: true, memoryBoxUpdated: false, photographsTaken: false, identityNeedsAddressed: true, culturalActivityIncluded: true, familyConnectionExplored: true },
  { id: "ls-5", childId: "child-alex", childName: "Alex", sessionDate: "2026-05-05", sessionType: "cultural_activity", completed: true, childLedContent: true, childEngagement: "high", addedToLifeStoryBook: true, memoryBoxUpdated: true, photographsTaken: true, identityNeedsAddressed: true, culturalActivityIncluded: true, familyConnectionExplored: false },

  // Jordan — good engagement but some gaps
  { id: "ls-6", childId: "child-jordan", childName: "Jordan", sessionDate: "2026-03-15", sessionType: "life_story_book", completed: true, childLedContent: true, childEngagement: "moderate", addedToLifeStoryBook: true, memoryBoxUpdated: false, photographsTaken: false, identityNeedsAddressed: true, culturalActivityIncluded: false, familyConnectionExplored: true },
  { id: "ls-7", childId: "child-jordan", childName: "Jordan", sessionDate: "2026-04-01", sessionType: "identity_discussion", completed: true, childLedContent: false, childEngagement: "moderate", addedToLifeStoryBook: false, memoryBoxUpdated: false, photographsTaken: false, identityNeedsAddressed: true, culturalActivityIncluded: false, familyConnectionExplored: false },
  { id: "ls-8", childId: "child-jordan", childName: "Jordan", sessionDate: "2026-04-15", sessionType: "creative_expression", completed: false, childLedContent: false, childEngagement: "refused", addedToLifeStoryBook: false, memoryBoxUpdated: false, photographsTaken: false, identityNeedsAddressed: false, culturalActivityIncluded: false, familyConnectionExplored: false },
  { id: "ls-9", childId: "child-jordan", childName: "Jordan", sessionDate: "2026-05-01", sessionType: "letter_writing", completed: true, childLedContent: true, childEngagement: "high", addedToLifeStoryBook: true, memoryBoxUpdated: true, photographsTaken: false, identityNeedsAddressed: false, culturalActivityIncluded: false, familyConnectionExplored: true },

  // Morgan — newer to home, fewer sessions
  { id: "ls-10", childId: "child-morgan", childName: "Morgan", sessionDate: "2026-04-10", sessionType: "life_story_book", completed: true, childLedContent: false, childEngagement: "low", addedToLifeStoryBook: true, memoryBoxUpdated: false, photographsTaken: false, identityNeedsAddressed: true, culturalActivityIncluded: true, familyConnectionExplored: false },
  { id: "ls-11", childId: "child-morgan", childName: "Morgan", sessionDate: "2026-04-28", sessionType: "timeline_work", completed: true, childLedContent: true, childEngagement: "moderate", addedToLifeStoryBook: true, memoryBoxUpdated: true, photographsTaken: false, identityNeedsAddressed: true, culturalActivityIncluded: false, familyConnectionExplored: true },
  { id: "ls-12", childId: "child-morgan", childName: "Morgan", sessionDate: "2026-05-12", sessionType: "photograph_session", completed: true, childLedContent: true, childEngagement: "moderate", addedToLifeStoryBook: false, memoryBoxUpdated: true, photographsTaken: true, identityNeedsAddressed: false, culturalActivityIncluded: false, familyConnectionExplored: false },
];

const demoPolicy: LifeStoryPolicy = {
  id: "pol-ls-1",
  lifeStoryWorkPolicy: true,
  childFriendlyMaterials: true,
  regularReviewSchedule: true,
  memoryKeepingProtocol: true,
  identityAssessmentFramework: true,
  culturalCompetencyPlan: true,
  familyConnectionProtocol: true,
};

const demoStaff: StaffLifeStoryTraining[] = [
  { id: "t-1", staffId: "staff-sarah", staffName: "Sarah Johnson", lifeStoryWork: true, identitySupport: true, culturalCompetency: true, therapeuticApproach: true, memoryKeeping: true, familyWorkSkills: true },
  { id: "t-2", staffId: "staff-tom", staffName: "Tom Richards", lifeStoryWork: true, identitySupport: true, culturalCompetency: true, therapeuticApproach: false, memoryKeeping: true, familyWorkSkills: true },
  { id: "t-3", staffId: "staff-lisa", staffName: "Lisa Williams", lifeStoryWork: true, identitySupport: true, culturalCompetency: true, therapeuticApproach: true, memoryKeeping: true, familyWorkSkills: false },
  { id: "t-4", staffId: "staff-darren", staffName: "Darren Laville", lifeStoryWork: true, identitySupport: true, culturalCompetency: false, therapeuticApproach: true, memoryKeeping: true, familyWorkSkills: true },
];

// ── Handler ────────────────────────────────────────────────────────────────

export async function GET() {
  const result = generateLifeStoryIntelligence(
    demoRecords,
    demoPolicy,
    demoStaff,
    "oak-house",
    "2026-01-01",
    "2026-05-20",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: { generatedAt: new Date().toISOString(), engine: "life-story", version: "2.0.0" },
    },
  });
}
