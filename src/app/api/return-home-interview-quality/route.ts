// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Return Home Interview Quality Intelligence API Route
//
// GET  → returns Chamberlain House demo RHI quality intelligence
// POST → accepts custom data for any home
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { generateReturnHomeInterviewQualityIntelligence } from "@/lib/return-home-interview-quality/return-home-interview-quality-engine";
import type {
  MissingEpisode,
  ReturnHomeInterview,
  StrategyMeeting,
  PreventionMeasure,
} from "@/lib/return-home-interview-quality/return-home-interview-quality-engine";

// ── Chamberlain House Demo Data ─────────────────────────────────────────────────────

const CHILD_IDS = ["jordan", "alex"];
const CHILD_NAMES: Record<string, string> = {
  jordan: "Jordan",
  alex: "Alex",
};

function getDemoData() {
  // Jordan: 2 missing episodes with RHIs
  // Episode 1: missing, 8 hours, thorough RHI within 72h
  // Episode 2: runaway, 14 hours, adequate RHI within 72h
  const episodes: MissingEpisode[] = [
    {
      id: "ep-01",
      childId: "jordan",
      childName: "Jordan",
      category: "missing",
      dateReported: "2025-02-10",
      dateReturned: "2025-02-10",
      duration: 8,
      policeNotified: true,
      riskAssessmentUpdated: true,
      socialWorkerNotified: true,
    },
    {
      id: "ep-02",
      childId: "jordan",
      childName: "Jordan",
      category: "runaway",
      dateReported: "2025-03-20",
      dateReturned: "2025-03-21",
      duration: 14,
      policeNotified: true,
      riskAssessmentUpdated: true,
      socialWorkerNotified: true,
    },
    // Alex: 1 absent-without-permission episode
    {
      id: "ep-03",
      childId: "alex",
      childName: "Alex",
      category: "absent_without_permission",
      dateReported: "2025-04-01",
      dateReturned: "2025-04-01",
      duration: 3,
      policeNotified: false,
      riskAssessmentUpdated: true,
      socialWorkerNotified: true,
    },
  ];

  const interviews: ReturnHomeInterview[] = [
    // Jordan episode 1 — thorough independent RHI
    {
      id: "rhi-01",
      episodeId: "ep-01",
      childId: "jordan",
      childName: "Jordan",
      interviewDate: "2025-02-11",
      interviewedBy: "Sarah Independent",
      timeliness: "within_72h",
      quality: "thorough",
      childViewsSought: true,
      pushFactorsIdentified: ["placement_unhappy"],
      pullFactorsIdentified: ["peer_influence"],
      safetyPlanStatus: "created",
      referralsMade: 1,
      informationSharedWithPolice: true,
      independentInterviewer: true,
    },
    // Jordan episode 2 — adequate independent RHI
    {
      id: "rhi-02",
      episodeId: "ep-02",
      childId: "jordan",
      childName: "Jordan",
      interviewDate: "2025-03-22",
      interviewedBy: "Sarah Independent",
      timeliness: "within_72h",
      quality: "adequate",
      childViewsSought: true,
      pushFactorsIdentified: ["mental_health", "placement_unhappy"],
      pullFactorsIdentified: ["peer_influence"],
      safetyPlanStatus: "updated",
      referralsMade: 2,
      informationSharedWithPolice: true,
      independentInterviewer: true,
    },
    // Alex episode — adequate RHI
    {
      id: "rhi-03",
      episodeId: "ep-03",
      childId: "alex",
      childName: "Alex",
      interviewDate: "2025-04-02",
      interviewedBy: "Mark Keyworker",
      timeliness: "within_72h",
      quality: "adequate",
      childViewsSought: true,
      pushFactorsIdentified: [],
      pullFactorsIdentified: ["family_contact"],
      safetyPlanStatus: "existing_adequate",
      referralsMade: 0,
      informationSharedWithPolice: false,
      independentInterviewer: false,
    },
  ];

  const meetings: StrategyMeeting[] = [
    {
      id: "sm-01",
      childId: "jordan",
      childName: "Jordan",
      meetingDate: "2025-02-11",
      attendees: 5,
      multiAgencyAttendance: true,
      actionPlanCreated: true,
      actionPlanReviewed: true,
      triggerPatternDiscussed: true,
    },
    {
      id: "sm-02",
      childId: "jordan",
      childName: "Jordan",
      meetingDate: "2025-03-22",
      attendees: 4,
      multiAgencyAttendance: true,
      actionPlanCreated: true,
      actionPlanReviewed: null,
      triggerPatternDiscussed: true,
    },
  ];

  const measures: PreventionMeasure[] = [
    {
      id: "pm-01",
      childId: "jordan",
      childName: "Jordan",
      measureDate: "2025-02-15",
      measureDescription: "Increased keyworker sessions to twice weekly",
      implementedBy: "Keyworker Team",
      effective: true,
      reviewedDate: "2025-03-15",
    },
    {
      id: "pm-02",
      childId: "jordan",
      childName: "Jordan",
      measureDate: "2025-03-25",
      measureDescription: "Peer mentoring programme referral",
      implementedBy: "Registered Manager",
      effective: null,
      reviewedDate: null,
    },
    {
      id: "pm-03",
      childId: "alex",
      childName: "Alex",
      measureDate: "2025-04-05",
      measureDescription: "Family contact schedule reviewed and updated",
      implementedBy: "Social Worker",
      effective: true,
      reviewedDate: "2025-04-20",
    },
  ];

  return { episodes, interviews, meetings, measures };
}

// ── GET Handler ─────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const { episodes, interviews, meetings, measures } = getDemoData();
    const result = generateReturnHomeInterviewQualityIntelligence(
      episodes, interviews, meetings, measures,
      CHILD_IDS, CHILD_NAMES,
      "oak-house", "2025-01-01", "2025-06-30",
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate return home interview quality intelligence", details: String(error) },
      { status: 500 },
    );
  }
}

// ── POST Handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      episodes, interviews, meetings, measures,
      childIds, childNames, homeId, periodStart, periodEnd,
    } = body;

    if (
      !episodes || !interviews || !childIds || !childNames ||
      !homeId || !periodStart || !periodEnd
    ) {
      return NextResponse.json(
        {
          error: "Missing required fields: episodes, interviews, childIds, childNames, homeId, periodStart, periodEnd",
        },
        { status: 400 },
      );
    }

    if (
      !Array.isArray(episodes) || !Array.isArray(interviews) ||
      !Array.isArray(childIds)
    ) {
      return NextResponse.json(
        { error: "episodes, interviews, and childIds must be arrays" },
        { status: 400 },
      );
    }

    if (meetings !== undefined && meetings !== null && !Array.isArray(meetings)) {
      return NextResponse.json(
        { error: "meetings must be an array if provided" },
        { status: 400 },
      );
    }

    if (measures !== undefined && measures !== null && !Array.isArray(measures)) {
      return NextResponse.json(
        { error: "measures must be an array if provided" },
        { status: 400 },
      );
    }

    const result = generateReturnHomeInterviewQualityIntelligence(
      episodes,
      interviews,
      Array.isArray(meetings) ? meetings : [],
      Array.isArray(measures) ? measures : [],
      childIds,
      childNames,
      homeId,
      periodStart,
      periodEnd,
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process return home interview quality data", details: String(error) },
      { status: 500 },
    );
  }
}
