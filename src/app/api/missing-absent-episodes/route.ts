// ══════════════════════════════════════════════════════════════════════════════
// API: /api/missing-absent-episodes
//
// Missing & Absent Episodes Intelligence
//
// GET  — Returns missing/absent episodes metrics with demo data (Chamberlain House)
// POST — Accepts custom data and returns analysis
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  generateMissingAbsentEpisodesIntelligence,
  getEpisodeTypeLabel,
  getEpisodeOutcomeLabel,
  getRiskLevelLabel,
  getRatingLabel,
} from "@/lib/missing-absent-episodes";
import type {
  MissingEpisode,
  MissingPolicy,
  StaffMissingTraining,
} from "@/lib/missing-absent-episodes";

// ── Demo Data: Chamberlain House ──────────────────────────────────────────────────

function generateDemoData(): {
  episodes: MissingEpisode[];
  policy: MissingPolicy;
  training: StaffMissingTraining[];
} {
  const episodes: MissingEpisode[] = [
    {
      id: "ep-001",
      childId: "child-alex",
      childName: "Alex",
      episodeType: "missing",
      reportedDate: "2026-02-15",
      resolvedDate: "2026-02-15",
      durationMinutes: 180,
      riskLevel: "medium",
      outcome: "returned_self",
      returnInterviewCompleted: true,
      returnInterviewTimely: true,
      triggerIdentified: true,
      preventionPlanUpdated: true,
      policeNotified: true,
      localAuthorityNotified: true,
    },
    {
      id: "ep-002",
      childId: "child-jordan",
      childName: "Jordan",
      episodeType: "absent_without_permission",
      reportedDate: "2026-03-01",
      resolvedDate: "2026-03-01",
      durationMinutes: 90,
      riskLevel: "low",
      outcome: "found_by_staff",
      returnInterviewCompleted: true,
      returnInterviewTimely: true,
      triggerIdentified: true,
      preventionPlanUpdated: true,
      policeNotified: true,
      localAuthorityNotified: true,
    },
    {
      id: "ep-003",
      childId: "child-alex",
      childName: "Alex",
      episodeType: "failure_to_return",
      reportedDate: "2026-03-20",
      resolvedDate: "2026-03-21",
      durationMinutes: 480,
      riskLevel: "high",
      outcome: "found_by_police",
      returnInterviewCompleted: true,
      returnInterviewTimely: true,
      triggerIdentified: true,
      preventionPlanUpdated: true,
      policeNotified: true,
      localAuthorityNotified: true,
    },
    {
      id: "ep-004",
      childId: "child-morgan",
      childName: "Morgan",
      episodeType: "absent_no_contact",
      reportedDate: "2026-04-10",
      resolvedDate: "2026-04-10",
      durationMinutes: 60,
      riskLevel: "low",
      outcome: "returned_self",
      returnInterviewCompleted: true,
      returnInterviewTimely: true,
      triggerIdentified: true,
      preventionPlanUpdated: true,
      policeNotified: true,
      localAuthorityNotified: true,
    },
    {
      id: "ep-005",
      childId: "child-jordan",
      childName: "Jordan",
      episodeType: "missing",
      reportedDate: "2026-05-02",
      resolvedDate: "2026-05-03",
      durationMinutes: 360,
      riskLevel: "high",
      outcome: "found_by_police",
      returnInterviewCompleted: true,
      returnInterviewTimely: false,
      triggerIdentified: false,
      preventionPlanUpdated: true,
      policeNotified: true,
      localAuthorityNotified: true,
    },
  ];

  const policy: MissingPolicy = {
    id: "policy-001",
    missingProtocolInPlace: true,
    riskAssessmentFramework: true,
    returnInterviewProcess: true,
    preventionStrategy: true,
    multiAgencyProtocol: true,
    regularReview: true,
    staffGuidanceClear: true,
  };

  const training: StaffMissingTraining[] = [
    {
      id: "train-001",
      staffId: "staff-sarah",
      staffName: "Sarah Johnson",
      missingProtocol: true,
      riskAssessment: true,
      returnInterviews: true,
      preventionStrategies: true,
      multiAgencyWorking: true,
      recordKeeping: true,
    },
    {
      id: "train-002",
      staffId: "staff-tom",
      staffName: "Tom Richards",
      missingProtocol: true,
      riskAssessment: true,
      returnInterviews: true,
      preventionStrategies: true,
      multiAgencyWorking: true,
      recordKeeping: true,
    },
    {
      id: "train-003",
      staffId: "staff-lisa",
      staffName: "Lisa Williams",
      missingProtocol: true,
      riskAssessment: true,
      returnInterviews: false,
      preventionStrategies: true,
      multiAgencyWorking: true,
      recordKeeping: true,
    },
    {
      id: "train-004",
      staffId: "staff-darren",
      staffName: "Darren Laville",
      missingProtocol: true,
      riskAssessment: true,
      returnInterviews: true,
      preventionStrategies: true,
      multiAgencyWorking: true,
      recordKeeping: true,
    },
  ];

  return { episodes, policy, training };
}

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET() {
  const { episodes, policy, training } = generateDemoData();

  const result = generateMissingAbsentEpisodesIntelligence(
    episodes,
    policy,
    training,
    "oak-house",
    "2026-01-01",
    "2026-05-19",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        episodeSummary: episodes.map((e) => ({
          id: e.id,
          date: e.reportedDate,
          type: getEpisodeTypeLabel(e.episodeType),
          riskLevel: getRiskLevelLabel(e.riskLevel),
          outcome: getEpisodeOutcomeLabel(e.outcome),
          child: e.childName,
        })),
        ratingLabel: getRatingLabel(result.rating),
      },
    },
  });
}

// ── POST ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    episodes,
    policy,
    training,
    homeId,
    periodStart,
    periodEnd,
  } = body as {
    episodes?: MissingEpisode[];
    policy?: MissingPolicy | null;
    training?: StaffMissingTraining[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!periodStart || !periodEnd) {
    return NextResponse.json(
      { error: "periodStart and periodEnd are required" },
      { status: 400 },
    );
  }

  const result = generateMissingAbsentEpisodesIntelligence(
    episodes ?? [],
    policy ?? null,
    training ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
