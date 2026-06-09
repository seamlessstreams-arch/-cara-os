// ══════════════════════════════════════════════════════════════════════════════
// API: /api/anti-bullying-effectiveness
//
// Anti-Bullying Effectiveness Intelligence
//
// GET  — Returns anti-bullying effectiveness metrics with demo data (Chamberlain House)
// POST — Accepts custom data and returns analysis
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  generateAntiBullyingEffectivenessIntelligence,
  getBullyingTypeLabel,
  getSeverityLabel,
  getResolutionLabel,
  getRatingLabel,
} from "@/lib/anti-bullying-effectiveness";
import type {
  BullyingIncident,
  ChildBullyingSurvey,
  AntiBullyingPolicy,
  StaffAntiBullyingTraining,
} from "@/lib/anti-bullying-effectiveness";

// ── Demo Data: Chamberlain House ──────────────────────────────────────────────────

function generateDemoData(): {
  incidents: BullyingIncident[];
  surveys: ChildBullyingSurvey[];
  policy: AntiBullyingPolicy;
  training: StaffAntiBullyingTraining[];
} {
  const incidents: BullyingIncident[] = [
    {
      id: "bul-001",
      date: "2026-05-05",
      bullyingType: "verbal",
      severity: "medium",
      childrenInvolved: [
        { childId: "child-jordan", childName: "Jordan", role: "perpetrator" },
        { childId: "child-alex", childName: "Alex", role: "target" },
      ],
      location: "Common room",
      reportedBy: "Sarah Johnson",
      timeToResponse: 2,
      interventionType: "restorative_practice",
      resolutionOutcome: "fully_resolved",
      followUpCompleted: true,
      impactAssessed: true,
      childViewSought: true,
      safetyPlanCreated: false,
    },
    {
      id: "bul-002",
      date: "2026-05-10",
      bullyingType: "cyberbullying",
      severity: "high",
      childrenInvolved: [
        { childId: "child-morgan", childName: "Morgan", role: "target" },
      ],
      location: "Online",
      reportedBy: "Tom Richards",
      timeToResponse: 4,
      interventionType: "external_referral",
      resolutionOutcome: "escalated",
      followUpCompleted: true,
      impactAssessed: true,
      childViewSought: true,
      safetyPlanCreated: true,
    },
  ];

  const surveys: ChildBullyingSurvey[] = [
    {
      id: "survey-001",
      childId: "child-alex",
      childName: "Alex",
      surveyDate: "2026-05-01",
      feelsSafe: true,
      bulliedRecently: false,
      confidenceInStaffResponse: "very_confident",
    },
    {
      id: "survey-002",
      childId: "child-jordan",
      childName: "Jordan",
      surveyDate: "2026-05-01",
      feelsSafe: true,
      bulliedRecently: false,
      confidenceInStaffResponse: "confident",
    },
    {
      id: "survey-003",
      childId: "child-morgan",
      childName: "Morgan",
      surveyDate: "2026-05-01",
      feelsSafe: true,
      bulliedRecently: true,
      confidenceInStaffResponse: "confident",
    },
  ];

  const policy: AntiBullyingPolicy = {
    id: "policy-001",
    lastReviewDate: "2026-03-15",
    childrenConsulted: true,
    staffTrained: true,
    parentsInformed: true,
    policyAccessible: true,
    updatedAnnually: true,
    antiDiscriminatory: true,
  };

  const training: StaffAntiBullyingTraining[] = [
    {
      id: "abt-001",
      staffId: "staff-sarah",
      staffName: "Sarah Johnson",
      trainingDate: "2026-02-15",
      recognitionSkills: true,
      interventionSkills: true,
      restorativePracticeTrained: true,
    },
    {
      id: "abt-002",
      staffId: "staff-tom",
      staffName: "Tom Richards",
      trainingDate: "2026-02-15",
      recognitionSkills: true,
      interventionSkills: true,
      restorativePracticeTrained: true,
    },
    {
      id: "abt-003",
      staffId: "staff-lisa",
      staffName: "Lisa Williams",
      trainingDate: "2026-02-15",
      recognitionSkills: true,
      interventionSkills: true,
      restorativePracticeTrained: false,
    },
    {
      id: "abt-004",
      staffId: "staff-darren",
      staffName: "Darren Laville",
      trainingDate: "2026-02-15",
      recognitionSkills: true,
      interventionSkills: true,
      restorativePracticeTrained: true,
    },
  ];

  return { incidents, surveys, policy, training };
}

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET() {
  const { incidents, surveys, policy, training } = generateDemoData();

  const result = generateAntiBullyingEffectivenessIntelligence(
    incidents,
    surveys,
    policy,
    training,
    "oak-house",
    "2026-04-01",
    "2026-05-18",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        incidentSummary: incidents.map((i) => ({
          id: i.id,
          date: i.date,
          type: getBullyingTypeLabel(i.bullyingType),
          severity: getSeverityLabel(i.severity),
          outcome: getResolutionLabel(i.resolutionOutcome),
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
    incidents,
    surveys,
    policy,
    training,
    homeId,
    periodStart,
    periodEnd,
  } = body as {
    incidents?: BullyingIncident[];
    surveys?: ChildBullyingSurvey[];
    policy?: AntiBullyingPolicy | null;
    training?: StaffAntiBullyingTraining[];
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

  const result = generateAntiBullyingEffectivenessIntelligence(
    incidents ?? [],
    surveys ?? [],
    policy ?? null,
    training ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
