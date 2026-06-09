// ==============================================================================
// API: /api/independence
//
// Independence Intelligence
//
// GET  — Returns assessment with Chamberlain House demo data
//
// CHR 2015 Reg 5 — Quality and purpose of care (preparing for independence)
// CHR 2015 Reg 9 — Promoting independence
// Children (Leaving Care) Act 2000 — Pathway planning
// SCCIF — Preparation for independence
// ==============================================================================

import { NextResponse } from "next/server";
import { generateIndependenceIntelligence } from "@/lib/independence";
import type {
  IndependenceRecord,
  IndependencePolicy,
  StaffIndependenceTraining,
} from "@/lib/independence";

// -- Demo Data: Chamberlain House -------------------------------------------------------

const DEMO_RECORDS: IndependenceRecord[] = [
  { id: "rec-1", childId: "child-alex", childName: "Alex", assessmentDate: "2026-02-10", category: "cooking_nutrition", outcome: "progressing", individualPlanInPlace: true, ageAppropriate: true, childEngaged: true, progressRecorded: true, documentationComplete: true, pathwayPlanAligned: true },
  { id: "rec-2", childId: "child-alex", childName: "Alex", assessmentDate: "2026-03-05", category: "money_management", outcome: "developing", individualPlanInPlace: true, ageAppropriate: true, childEngaged: true, progressRecorded: true, documentationComplete: true, pathwayPlanAligned: true },
  { id: "rec-3", childId: "child-alex", childName: "Alex", assessmentDate: "2026-04-12", category: "personal_hygiene", outcome: "mastered", individualPlanInPlace: true, ageAppropriate: true, childEngaged: true, progressRecorded: true, documentationComplete: true, pathwayPlanAligned: true },
  { id: "rec-4", childId: "child-jordan", childName: "Jordan", assessmentDate: "2026-02-18", category: "household_tasks", outcome: "progressing", individualPlanInPlace: true, ageAppropriate: true, childEngaged: true, progressRecorded: true, documentationComplete: true, pathwayPlanAligned: true },
  { id: "rec-5", childId: "child-jordan", childName: "Jordan", assessmentDate: "2026-03-22", category: "travel_skills", outcome: "progressing", individualPlanInPlace: true, ageAppropriate: true, childEngaged: false, progressRecorded: true, documentationComplete: true, pathwayPlanAligned: false },
  { id: "rec-6", childId: "child-jordan", childName: "Jordan", assessmentDate: "2026-04-30", category: "health_management", outcome: "mastered", individualPlanInPlace: true, ageAppropriate: true, childEngaged: true, progressRecorded: true, documentationComplete: true, pathwayPlanAligned: true },
  { id: "rec-7", childId: "child-jordan", childName: "Jordan", assessmentDate: "2026-05-05", category: "social_skills", outcome: "developing", individualPlanInPlace: true, ageAppropriate: true, childEngaged: true, progressRecorded: false, documentationComplete: false, pathwayPlanAligned: true },
  { id: "rec-8", childId: "child-morgan", childName: "Morgan", assessmentDate: "2026-01-20", category: "education_employment", outcome: "progressing", individualPlanInPlace: true, ageAppropriate: true, childEngaged: true, progressRecorded: true, documentationComplete: true, pathwayPlanAligned: true },
  { id: "rec-9", childId: "child-morgan", childName: "Morgan", assessmentDate: "2026-03-15", category: "cooking_nutrition", outcome: "mastered", individualPlanInPlace: true, ageAppropriate: true, childEngaged: true, progressRecorded: true, documentationComplete: true, pathwayPlanAligned: true },
  { id: "rec-10", childId: "child-morgan", childName: "Morgan", assessmentDate: "2026-04-10", category: "money_management", outcome: "progressing", individualPlanInPlace: true, ageAppropriate: false, childEngaged: true, progressRecorded: true, documentationComplete: true, pathwayPlanAligned: true },
  { id: "rec-11", childId: "child-alex", childName: "Alex", assessmentDate: "2026-05-01", category: "social_skills", outcome: "progressing", individualPlanInPlace: true, ageAppropriate: true, childEngaged: true, progressRecorded: true, documentationComplete: true, pathwayPlanAligned: true },
  { id: "rec-12", childId: "child-morgan", childName: "Morgan", assessmentDate: "2026-05-10", category: "household_tasks", outcome: "developing", individualPlanInPlace: false, ageAppropriate: true, childEngaged: false, progressRecorded: true, documentationComplete: false, pathwayPlanAligned: false },
];

const DEMO_POLICY: IndependencePolicy = {
  id: "pol-1",
  independencePolicy: true,
  pathwayPlanningGuidance: true,
  lifeSkillsFramework: true,
  transitionProtocol: true,
  leavingCarePreparation: true,
  partnershipWorkingPolicy: true,
  reviewSchedule: true,
};

const DEMO_STAFF: StaffIndependenceTraining[] = [
  { id: "tr-1", staffId: "staff-sarah", staffName: "Sarah Johnson", independencePlanning: true, lifeSkillsTeaching: true, pathwayKnowledge: true, motivationalSkills: true, communityResources: true, transitionSupport: true },
  { id: "tr-2", staffId: "staff-tom", staffName: "Tom Richards", independencePlanning: true, lifeSkillsTeaching: true, pathwayKnowledge: true, motivationalSkills: false, communityResources: true, transitionSupport: false },
  { id: "tr-3", staffId: "staff-lisa", staffName: "Lisa Williams", independencePlanning: true, lifeSkillsTeaching: true, pathwayKnowledge: false, motivationalSkills: true, communityResources: false, transitionSupport: true },
  { id: "tr-4", staffId: "staff-darren", staffName: "Darren Laville", independencePlanning: true, lifeSkillsTeaching: true, pathwayKnowledge: true, motivationalSkills: true, communityResources: true, transitionSupport: true },
];

// -- GET ------------------------------------------------------------------------

export async function GET() {
  const result = generateIndependenceIntelligence(
    DEMO_RECORDS,
    DEMO_POLICY,
    DEMO_STAFF,
    "oak-house",
    "2026-01-01",
    "2026-05-20",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        generatedAt: new Date().toISOString(),
        engine: "independence",
        version: "2.0.0",
      },
    },
  });
}
