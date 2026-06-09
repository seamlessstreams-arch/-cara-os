// ══════════════════════════════════════════════════════════════════════════════
// API: /api/after-care-support-quality
//
// After Care Support Quality Intelligence
//
// GET  — Returns after care support quality metrics with Chamberlain House demo data
// POST — Accepts custom data and returns analysis
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import {
  generateAfterCareSupportQualityIntelligence,
  getSupportTypeLabels,
  getEngagementLevelLabels,
  getRatingLabels,
} from "@/lib/after-care-support-quality";
import type {
  AfterCareSession,
  AfterCarePolicy,
  StaffAfterCareTraining,
} from "@/lib/after-care-support-quality";

// ── Demo Data: Chamberlain House ──────────────────────────────────────────────────

const DEMO_SESSIONS: AfterCareSession[] = [
  // Alex — housing support (highly engaged)
  { id: "acs-001", childId: "child-alex", childName: "Alex", sessionDate: "2026-02-10", supportType: "housing_support", engagementLevel: "highly_engaged", needsAssessed: true, goalsSet: true, progressTracked: true, documentedInPlan: true, staffSupported: true, feedbackGiven: true },
  // Alex — education continuation (engaged)
  { id: "acs-002", childId: "child-alex", childName: "Alex", sessionDate: "2026-03-05", supportType: "education_continuation", engagementLevel: "engaged", needsAssessed: true, goalsSet: true, progressTracked: true, documentedInPlan: true, staffSupported: true, feedbackGiven: true },
  // Alex — financial advice (highly engaged)
  { id: "acs-003", childId: "child-alex", childName: "Alex", sessionDate: "2026-04-12", supportType: "financial_advice", engagementLevel: "highly_engaged", needsAssessed: true, goalsSet: true, progressTracked: true, documentedInPlan: true, staffSupported: true, feedbackGiven: true },
  // Jordan — employment guidance (engaged)
  { id: "acs-004", childId: "child-jordan", childName: "Jordan", sessionDate: "2026-02-20", supportType: "employment_guidance", engagementLevel: "engaged", needsAssessed: true, goalsSet: true, progressTracked: true, documentedInPlan: true, staffSupported: true, feedbackGiven: true },
  // Jordan — emotional wellbeing (moderate)
  { id: "acs-005", childId: "child-jordan", childName: "Jordan", sessionDate: "2026-03-15", supportType: "emotional_wellbeing", engagementLevel: "moderate", needsAssessed: true, goalsSet: true, progressTracked: false, documentedInPlan: true, staffSupported: true, feedbackGiven: true },
  // Jordan — practical skills (engaged)
  { id: "acs-006", childId: "child-jordan", childName: "Jordan", sessionDate: "2026-04-20", supportType: "practical_skills", engagementLevel: "engaged", needsAssessed: true, goalsSet: true, progressTracked: true, documentedInPlan: true, staffSupported: true, feedbackGiven: true },
  // Morgan — health access (highly engaged)
  { id: "acs-007", childId: "child-morgan", childName: "Morgan", sessionDate: "2026-03-01", supportType: "health_access", engagementLevel: "highly_engaged", needsAssessed: true, goalsSet: true, progressTracked: true, documentedInPlan: true, staffSupported: true, feedbackGiven: true },
  // Morgan — social network (engaged)
  { id: "acs-008", childId: "child-morgan", childName: "Morgan", sessionDate: "2026-04-08", supportType: "social_network", engagementLevel: "engaged", needsAssessed: true, goalsSet: true, progressTracked: true, documentedInPlan: true, staffSupported: true, feedbackGiven: true },
];

const DEMO_POLICY: AfterCarePolicy = {
  id: "pol-oak",
  leavingCareStrategy: true,
  pathwayPlanFramework: true,
  housingProtocol: true,
  educationEmploymentPlan: true,
  healthAndWellbeingContinuity: true,
  financialSupportGuidance: true,
  regularReview: true,
};

const DEMO_TRAINING: StaffAfterCareTraining[] = [
  { id: "tr-sarah", staffId: "staff-sarah", staffName: "Sarah Johnson", leavingCareKnowledge: true, pathwayPlanning: true, housingAdvice: true, employmentSupport: true, benefitsAndFinance: true, emotionalResilience: true },
  { id: "tr-tom", staffId: "staff-tom", staffName: "Tom Richards", leavingCareKnowledge: true, pathwayPlanning: true, housingAdvice: true, employmentSupport: true, benefitsAndFinance: true, emotionalResilience: true },
  { id: "tr-lisa", staffId: "staff-lisa", staffName: "Lisa Williams", leavingCareKnowledge: true, pathwayPlanning: true, housingAdvice: true, employmentSupport: true, benefitsAndFinance: true, emotionalResilience: true },
  { id: "tr-darren", staffId: "staff-darren", staffName: "Darren Laville", leavingCareKnowledge: true, pathwayPlanning: true, housingAdvice: true, employmentSupport: true, benefitsAndFinance: true, emotionalResilience: true },
];

// ── GET ───────────────────────────────────────────────────────────────────

export async function GET() {
  const result = generateAfterCareSupportQualityIntelligence(
    DEMO_SESSIONS,
    DEMO_POLICY,
    DEMO_TRAINING,
    "oak-house",
    "2026-01-01",
    "2026-05-20",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        supportTypeLabels: getSupportTypeLabels(),
        engagementLevelLabels: getEngagementLevelLabels(),
        ratingLabels: getRatingLabels(),
      },
    },
  });
}

// ── POST ──────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { sessions, policy, training, homeId, periodStart, periodEnd } = body as {
    sessions?: AfterCareSession[];
    policy?: AfterCarePolicy | null;
    training?: StaffAfterCareTraining[];
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

  const result = generateAfterCareSupportQualityIntelligence(
    sessions ?? [],
    policy ?? null,
    training ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
