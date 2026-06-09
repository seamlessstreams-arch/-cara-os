// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Professional Development Intelligence API Route
//
// GET  → returns Chamberlain House demo intelligence
// POST → accepts custom data for any home
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { generateProfessionalDevelopmentIntelligence } from "@/lib/professional-development/professional-development-engine";
import type {
  CPDRecord,
  QualificationProgress,
  SupervisionDevelopment,
  LearningCulture,
} from "@/lib/professional-development/professional-development-engine";

// ── Chamberlain House Demo Data ──────────────────────────────────────────────────────

function getDemoData(): {
  cpdRecords: CPDRecord[];
  qualifications: QualificationProgress[];
  supervisions: SupervisionDevelopment[];
  learningCulture: LearningCulture[];
} {
  // Staff: Darren Laville (RM, Level 5 in progress, extensive CPD)
  //        Sarah Johnson (Level 3 complete, pursuing Level 4)
  //        Tom Richards (Level 3 in progress, early career)
  //        Lisa Williams (Level 3 complete, specialist training)

  const cpdRecords: CPDRecord[] = [
    // ── Darren Laville — RM, extensive CPD ────────────────────────────────
    { id: "cpd-d01", staffId: "staff-darren", staffName: "Darren Laville", category: "mandatory_training", title: "Designated Safeguarding Lead Refresher", date: "2025-02-10", hours: 12, provider: "Local Authority", certificateObtained: true, impactAssessed: true, impact: "significant_improvement", sharedWithTeam: true, relevantToRole: true },
    { id: "cpd-d02", staffId: "staff-darren", staffName: "Darren Laville", category: "conference_seminar", title: "National Residential Childcare Conference", date: "2025-03-22", hours: 14, provider: "NCERCC", certificateObtained: false, impactAssessed: true, impact: "significant_improvement", sharedWithTeam: true, relevantToRole: true },
    { id: "cpd-d03", staffId: "staff-darren", staffName: "Darren Laville", category: "specialist_qualification", title: "Level 5 Leadership & Management Module 4", date: "2025-04-15", hours: 20, provider: "Open University", certificateObtained: false, impactAssessed: true, impact: "some_improvement", sharedWithTeam: false, relevantToRole: true },
    { id: "cpd-d04", staffId: "staff-darren", staffName: "Darren Laville", category: "peer_learning", title: "Managers Peer Support Network", date: "2025-05-08", hours: 3, provider: null, certificateObtained: false, impactAssessed: true, impact: "some_improvement", sharedWithTeam: true, relevantToRole: true },
    { id: "cpd-d05", staffId: "staff-darren", staffName: "Darren Laville", category: "reflective_practice", title: "Reflective Practice Journal — Q1 Review", date: "2025-04-01", hours: 4, provider: null, certificateObtained: false, impactAssessed: true, impact: "some_improvement", sharedWithTeam: false, relevantToRole: true },
    { id: "cpd-d06", staffId: "staff-darren", staffName: "Darren Laville", category: "external_course", title: "Trauma-Informed Leadership", date: "2025-06-12", hours: 8, provider: "Bath Spa University", certificateObtained: true, impactAssessed: true, impact: "significant_improvement", sharedWithTeam: true, relevantToRole: true },

    // ── Sarah Johnson — Level 3 complete, pursuing Level 4 ───────────────
    { id: "cpd-s01", staffId: "staff-sarah", staffName: "Sarah Johnson", category: "mandatory_training", title: "Safeguarding Children Level 2", date: "2025-02-15", hours: 6, provider: "Local Authority", certificateObtained: true, impactAssessed: true, impact: "some_improvement", sharedWithTeam: true, relevantToRole: true },
    { id: "cpd-s02", staffId: "staff-sarah", staffName: "Sarah Johnson", category: "specialist_qualification", title: "Level 4 Children & Young People Module 1", date: "2025-03-10", hours: 16, provider: "City & Guilds", certificateObtained: false, impactAssessed: true, impact: "significant_improvement", sharedWithTeam: true, relevantToRole: true },
    { id: "cpd-s03", staffId: "staff-sarah", staffName: "Sarah Johnson", category: "in_house_training", title: "Medication Administration Refresher", date: "2025-01-20", hours: 3, provider: "In-house", certificateObtained: true, impactAssessed: true, impact: "some_improvement", sharedWithTeam: false, relevantToRole: true },
    { id: "cpd-s04", staffId: "staff-sarah", staffName: "Sarah Johnson", category: "mentoring", title: "Mentoring Tom Richards — Monthly Session", date: "2025-05-15", hours: 2, provider: null, certificateObtained: false, impactAssessed: true, impact: "some_improvement", sharedWithTeam: false, relevantToRole: true },
    { id: "cpd-s05", staffId: "staff-sarah", staffName: "Sarah Johnson", category: "external_course", title: "Attachment Theory & PACE Model", date: "2025-04-20", hours: 6, provider: "External", certificateObtained: true, impactAssessed: true, impact: "significant_improvement", sharedWithTeam: true, relevantToRole: true },

    // ── Tom Richards — Level 3 in progress, early career ─────────────────
    { id: "cpd-t01", staffId: "staff-tom", staffName: "Tom Richards", category: "mandatory_training", title: "Safeguarding Induction", date: "2025-01-15", hours: 6, provider: "Local Authority", certificateObtained: true, impactAssessed: true, impact: "significant_improvement", sharedWithTeam: false, relevantToRole: true },
    { id: "cpd-t02", staffId: "staff-tom", staffName: "Tom Richards", category: "specialist_qualification", title: "Level 3 Diploma Module 2", date: "2025-03-05", hours: 14, provider: "Open University", certificateObtained: false, impactAssessed: false, impact: null, sharedWithTeam: false, relevantToRole: true },
    { id: "cpd-t03", staffId: "staff-tom", staffName: "Tom Richards", category: "shadowing", title: "Shadowing Sarah — Shift Management", date: "2025-04-10", hours: 4, provider: null, certificateObtained: false, impactAssessed: true, impact: "significant_improvement", sharedWithTeam: false, relevantToRole: true },
    { id: "cpd-t04", staffId: "staff-tom", staffName: "Tom Richards", category: "in_house_training", title: "Fire Safety Awareness", date: "2025-02-01", hours: 2, provider: "In-house", certificateObtained: true, impactAssessed: false, impact: null, sharedWithTeam: false, relevantToRole: true },

    // ── Lisa Williams — Level 3 complete, specialist training ────────────
    { id: "cpd-l01", staffId: "staff-lisa", staffName: "Lisa Williams", category: "mandatory_training", title: "Advanced Safeguarding Level 3", date: "2025-02-12", hours: 12, provider: "Local Authority", certificateObtained: true, impactAssessed: true, impact: "significant_improvement", sharedWithTeam: true, relevantToRole: true },
    { id: "cpd-l02", staffId: "staff-lisa", staffName: "Lisa Williams", category: "external_course", title: "Mental Health First Aid", date: "2025-04-20", hours: 8, provider: "MHFA England", certificateObtained: true, impactAssessed: true, impact: "significant_improvement", sharedWithTeam: true, relevantToRole: true },
    { id: "cpd-l03", staffId: "staff-lisa", staffName: "Lisa Williams", category: "external_course", title: "Therapeutic Crisis Intervention", date: "2025-05-15", hours: 6, provider: "Cornell University (licensed)", certificateObtained: true, impactAssessed: true, impact: "significant_improvement", sharedWithTeam: true, relevantToRole: true },
    { id: "cpd-l04", staffId: "staff-lisa", staffName: "Lisa Williams", category: "reflective_practice", title: "Reflective Practice Group — Q2", date: "2025-06-01", hours: 3, provider: null, certificateObtained: false, impactAssessed: true, impact: "some_improvement", sharedWithTeam: true, relevantToRole: true },
    { id: "cpd-l05", staffId: "staff-lisa", staffName: "Lisa Williams", category: "peer_learning", title: "Team Case Study Discussion — Self-Harm Awareness", date: "2025-05-28", hours: 2, provider: null, certificateObtained: false, impactAssessed: true, impact: "some_improvement", sharedWithTeam: true, relevantToRole: true },
  ];

  const qualifications: QualificationProgress[] = [
    { id: "qual-d01", staffId: "staff-darren", staffName: "Darren Laville", qualificationName: "Level 5 Diploma in Leadership & Management (Residential Childcare)", level: "level_5", status: "in_progress", startDate: "2024-09-01", expectedCompletion: "2026-03-31", actualCompletion: null, fundedByEmployer: true, supportProvided: true },
    { id: "qual-s01", staffId: "staff-sarah", staffName: "Sarah Johnson", qualificationName: "Level 3 Diploma in Residential Childcare", level: "level_3", status: "completed", startDate: "2022-09-01", expectedCompletion: "2024-06-30", actualCompletion: "2024-05-15", fundedByEmployer: true, supportProvided: true },
    { id: "qual-s02", staffId: "staff-sarah", staffName: "Sarah Johnson", qualificationName: "Level 4 Children, Young People & Families Practitioner", level: "level_4", status: "in_progress", startDate: "2025-01-15", expectedCompletion: "2026-06-30", actualCompletion: null, fundedByEmployer: true, supportProvided: true },
    { id: "qual-t01", staffId: "staff-tom", staffName: "Tom Richards", qualificationName: "Level 3 Diploma in Residential Childcare", level: "level_3", status: "in_progress", startDate: "2024-09-01", expectedCompletion: "2026-08-31", actualCompletion: null, fundedByEmployer: true, supportProvided: true },
    { id: "qual-l01", staffId: "staff-lisa", staffName: "Lisa Williams", qualificationName: "Level 3 Diploma in Residential Childcare", level: "level_3", status: "completed", startDate: "2021-09-01", expectedCompletion: "2023-06-30", actualCompletion: "2023-05-20", fundedByEmployer: true, supportProvided: true },
  ];

  const supervisions: SupervisionDevelopment[] = [
    // Darren — supervised by RI; strong development focus
    { id: "sup-d01", staffId: "staff-darren", staffName: "Darren Laville", supervisionDate: "2025-01-20", developmentGoalsSet: true, progressReviewed: true, trainingNeedsIdentified: true, actionPlanCreated: true, previousActionsCompleted: null },
    { id: "sup-d02", staffId: "staff-darren", staffName: "Darren Laville", supervisionDate: "2025-03-17", developmentGoalsSet: true, progressReviewed: true, trainingNeedsIdentified: true, actionPlanCreated: true, previousActionsCompleted: true },
    { id: "sup-d03", staffId: "staff-darren", staffName: "Darren Laville", supervisionDate: "2025-05-12", developmentGoalsSet: true, progressReviewed: true, trainingNeedsIdentified: true, actionPlanCreated: true, previousActionsCompleted: true },

    // Sarah — supervised by Darren; good development focus
    { id: "sup-s01", staffId: "staff-sarah", staffName: "Sarah Johnson", supervisionDate: "2025-01-25", developmentGoalsSet: true, progressReviewed: true, trainingNeedsIdentified: true, actionPlanCreated: true, previousActionsCompleted: null },
    { id: "sup-s02", staffId: "staff-sarah", staffName: "Sarah Johnson", supervisionDate: "2025-03-22", developmentGoalsSet: true, progressReviewed: true, trainingNeedsIdentified: true, actionPlanCreated: true, previousActionsCompleted: true },
    { id: "sup-s03", staffId: "staff-sarah", staffName: "Sarah Johnson", supervisionDate: "2025-05-17", developmentGoalsSet: true, progressReviewed: true, trainingNeedsIdentified: false, actionPlanCreated: true, previousActionsCompleted: true },

    // Tom — supervised by Darren; early career, some gaps
    { id: "sup-t01", staffId: "staff-tom", staffName: "Tom Richards", supervisionDate: "2025-02-01", developmentGoalsSet: true, progressReviewed: true, trainingNeedsIdentified: true, actionPlanCreated: true, previousActionsCompleted: null },
    { id: "sup-t02", staffId: "staff-tom", staffName: "Tom Richards", supervisionDate: "2025-04-05", developmentGoalsSet: true, progressReviewed: true, trainingNeedsIdentified: true, actionPlanCreated: false, previousActionsCompleted: true },
    { id: "sup-t03", staffId: "staff-tom", staffName: "Tom Richards", supervisionDate: "2025-06-02", developmentGoalsSet: true, progressReviewed: false, trainingNeedsIdentified: true, actionPlanCreated: true, previousActionsCompleted: false },

    // Lisa — supervised by Darren; strong development focus
    { id: "sup-l01", staffId: "staff-lisa", staffName: "Lisa Williams", supervisionDate: "2025-01-28", developmentGoalsSet: true, progressReviewed: true, trainingNeedsIdentified: true, actionPlanCreated: true, previousActionsCompleted: null },
    { id: "sup-l02", staffId: "staff-lisa", staffName: "Lisa Williams", supervisionDate: "2025-03-25", developmentGoalsSet: true, progressReviewed: true, trainingNeedsIdentified: true, actionPlanCreated: true, previousActionsCompleted: true },
    { id: "sup-l03", staffId: "staff-lisa", staffName: "Lisa Williams", supervisionDate: "2025-05-20", developmentGoalsSet: true, progressReviewed: true, trainingNeedsIdentified: true, actionPlanCreated: true, previousActionsCompleted: true },
  ];

  const learningCulture: LearningCulture[] = [
    {
      id: "lc-oak-01",
      homeId: "oak-house",
      assessmentDate: "2025-06-01",
      regularTeamMeetings: true,
      sharedLearningOpportunities: true,
      reflectivePracticeEmbedded: true,
      feedbackCulture: true,
      innovationEncouraged: true,
      budgetAllocated: true,
      trainingCalendarExists: true,
      inductionProgramRobust: true,
    },
  ];

  return { cpdRecords, qualifications, supervisions, learningCulture };
}

// ── GET Handler ──────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const { cpdRecords, qualifications, supervisions, learningCulture } = getDemoData();
    const result = generateProfessionalDevelopmentIntelligence(
      cpdRecords,
      qualifications,
      supervisions,
      learningCulture,
      "oak-house",
      "2025-01-01",
      "2025-12-31",
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate professional development intelligence", details: String(error) },
      { status: 500 },
    );
  }
}

// ── POST Handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cpdRecords, qualifications, supervisions, learningCulture, homeId, periodStart, periodEnd } = body;

    if (!periodStart || !periodEnd) {
      return NextResponse.json(
        { error: "Missing required fields: periodStart, periodEnd" },
        { status: 400 },
      );
    }

    const safeCPD: CPDRecord[] = Array.isArray(cpdRecords) ? cpdRecords : [];
    const safeQuals: QualificationProgress[] = Array.isArray(qualifications) ? qualifications : [];
    const safeSups: SupervisionDevelopment[] = Array.isArray(supervisions) ? supervisions : [];
    const safeCulture: LearningCulture[] = Array.isArray(learningCulture) ? learningCulture : [];

    const result = generateProfessionalDevelopmentIntelligence(
      safeCPD,
      safeQuals,
      safeSups,
      safeCulture,
      homeId ?? "unknown",
      periodStart,
      periodEnd,
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process professional development data", details: String(error) },
      { status: 500 },
    );
  }
}
