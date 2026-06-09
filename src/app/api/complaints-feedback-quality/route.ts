// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Complaints & Feedback Quality Intelligence API Route
//
// GET  → returns Chamberlain House demo complaints & feedback quality intelligence
// POST → accepts custom data for any home
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { generateComplaintsFeedbackQualityIntelligence } from "@/lib/complaints-feedback-quality/complaints-feedback-quality-engine";
import type {
  ComplaintRecord,
  FeedbackRecord,
  ComplaintsPolicy,
  LessonLearned,
} from "@/lib/complaints-feedback-quality/complaints-feedback-quality-engine";

// ── Chamberlain House Demo Data ─────────────────────────────────────────────────────

const CHILD_IDS = ["alex", "jordan", "morgan"];
const CHILD_NAMES: Record<string, string> = {
  alex: "Alex",
  jordan: "Jordan",
  morgan: "Morgan",
};

function getDemoData() {
  // Alex: 1 food complaint — resolved, informed, supported
  const complaints: ComplaintRecord[] = [
    {
      id: "c-01",
      childId: "alex",
      childName: "Alex",
      complainantType: "child",
      feedbackType: "formal_complaint",
      category: "food_nutrition",
      stage: "stage_1",
      status: "resolved",
      outcome: "upheld",
      dateReceived: "2025-02-10",
      dateResolved: "2025-02-18",
      targetResolutionDays: 20,
      actualResolutionDays: 8,
      childInformedOfOutcome: true,
      childSupportedToComplain: true,
      lessonsLearned: true,
      actionsTaken: ["Updated meal plan", "Introduced weekly menu choice"],
      escalatedExternally: false,
    },
    // Jordan: 1 bullying concern — still investigating
    {
      id: "c-02",
      childId: "jordan",
      childName: "Jordan",
      complainantType: "child",
      feedbackType: "concern",
      category: "bullying",
      stage: "stage_1",
      status: "investigating",
      outcome: null,
      dateReceived: "2025-03-15",
      dateResolved: null,
      targetResolutionDays: 14,
      actualResolutionDays: null,
      childInformedOfOutcome: false,
      childSupportedToComplain: true,
      lessonsLearned: false,
      actionsTaken: ["Meeting arranged with keyworker"],
      escalatedExternally: false,
    },
  ];

  // Morgan: 2 compliments + 1 suggestion
  const feedback: FeedbackRecord[] = [
    {
      id: "f-01",
      source: "child",
      feedbackType: "compliment",
      date: "2025-02-20",
      category: null,
      acknowledged: true,
      actedUpon: true,
      responseWithinTimescale: true,
      childId: "morgan",
      childName: "Morgan",
    },
    {
      id: "f-02",
      source: "child",
      feedbackType: "compliment",
      date: "2025-03-01",
      category: "care_quality",
      acknowledged: true,
      actedUpon: true,
      responseWithinTimescale: true,
      childId: "morgan",
      childName: "Morgan",
    },
    {
      id: "f-03",
      source: "child",
      feedbackType: "suggestion",
      date: "2025-03-10",
      category: "food_nutrition",
      acknowledged: true,
      actedUpon: false,
      responseWithinTimescale: true,
      childId: "morgan",
      childName: "Morgan",
    },
  ];

  // 2 lessons learned from Alex's food complaint
  const lessons: LessonLearned[] = [
    {
      id: "l-01",
      complaintId: "c-01",
      description: "Introduced weekly menu choice for children",
      implementedDate: "2025-02-25",
      impactAssessed: true,
      sharedWithTeam: true,
      policyChanged: false,
    },
    {
      id: "l-02",
      complaintId: "c-01",
      description: "Updated dietary needs assessment process",
      implementedDate: "2025-03-01",
      impactAssessed: false,
      sharedWithTeam: true,
      policyChanged: true,
    },
  ];

  // Policy mostly compliant
  const policy: ComplaintsPolicy = {
    id: "p-01",
    homeId: "oak-house",
    policyReviewedDate: "2025-01-10",
    childFriendlyVersionAvailable: true,
    displayedProminently: true,
    childrenAwareOfProcess: true,
    advocacyAccessible: true,
    independentPersonAvailable: false,
    regularAuditCompleted: true,
  };

  return { complaints, feedback, lessons, policy };
}

// ── GET Handler ─────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const { complaints, feedback, lessons, policy } = getDemoData();
    const result = generateComplaintsFeedbackQualityIntelligence(
      complaints, feedback, lessons, policy,
      CHILD_IDS, CHILD_NAMES,
      "oak-house", "2025-01-01", "2025-06-30",
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate complaints & feedback quality intelligence", details: String(error) },
      { status: 500 },
    );
  }
}

// ── POST Handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      complaints, feedback, lessons, policy,
      childIds, childNames, homeId, periodStart, periodEnd,
    } = body;

    if (
      !complaints || !feedback || !childIds || !childNames ||
      !homeId || !periodStart || !periodEnd
    ) {
      return NextResponse.json(
        {
          error: "Missing required fields: complaints, feedback, childIds, childNames, homeId, periodStart, periodEnd",
        },
        { status: 400 },
      );
    }

    if (
      !Array.isArray(complaints) || !Array.isArray(feedback) ||
      !Array.isArray(childIds)
    ) {
      return NextResponse.json(
        { error: "complaints, feedback, and childIds must be arrays" },
        { status: 400 },
      );
    }

    if (lessons !== undefined && lessons !== null && !Array.isArray(lessons)) {
      return NextResponse.json(
        { error: "lessons must be an array if provided" },
        { status: 400 },
      );
    }

    if (policy !== undefined && policy !== null && (typeof policy !== "object" || Array.isArray(policy))) {
      return NextResponse.json(
        { error: "policy must be an object if provided" },
        { status: 400 },
      );
    }

    const result = generateComplaintsFeedbackQualityIntelligence(
      complaints,
      feedback,
      Array.isArray(lessons) ? lessons : [],
      policy ?? null,
      childIds,
      childNames,
      homeId,
      periodStart,
      periodEnd,
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process complaints & feedback quality data", details: String(error) },
      { status: 500 },
    );
  }
}
