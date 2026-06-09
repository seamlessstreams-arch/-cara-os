// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — LAC Review Intelligence API Route
//
// GET  → returns Chamberlain House demo LAC review intelligence
// POST → accepts custom data for any home
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { generateLACReviewIntelligence } from "@/lib/lac-review/lac-review-engine";
import type {
  LACReview,
  ReviewRecommendation,
  IROActivity,
} from "@/lib/lac-review/lac-review-engine";

// ── Chamberlain House Demo Data ─────────────────────────────────────────────────────

function getDemoData() {
  const reviews: LACReview[] = [
    // Alex — initial (on time), second (late by 5 days)
    {
      id: "rev-a1", homeId: "oak-house", childId: "child-alex", childName: "Alex",
      reviewType: "initial", dueDate: "2025-01-25", actualDate: "2025-01-24",
      wasTimely: true, iroName: "Jane Cooper", iroIndependent: true,
      participationMethod: "attended_in_person", childViewsCaptured: true,
      childViewsSummary: "Alex shared his views openly about settling in",
      parentInvited: true, parentAttended: false, carerAttended: true,
      socialWorkerAttended: true, otherProfessionals: ["CAMHS"],
      outcome: "care_plan_endorsed", carePlanUpdated: true,
      minutesDistributedWithin5Days: true, nextReviewDate: "2025-04-24",
    },
    {
      id: "rev-a2", homeId: "oak-house", childId: "child-alex", childName: "Alex",
      reviewType: "second", dueDate: "2025-04-24", actualDate: "2025-04-29",
      wasTimely: false, iroName: "Jane Cooper", iroIndependent: true,
      participationMethod: "written_views", childViewsCaptured: true,
      childViewsSummary: "Alex submitted written views via his key worker",
      parentInvited: true, parentAttended: true, carerAttended: true,
      socialWorkerAttended: true, otherProfessionals: ["Virtual School Head"],
      outcome: "care_plan_amended", carePlanUpdated: true,
      minutesDistributedWithin5Days: false, nextReviewDate: "2025-10-29",
    },

    // Jordan — two reviews, both on time
    {
      id: "rev-j1", homeId: "oak-house", childId: "child-jordan", childName: "Jordan",
      reviewType: "subsequent", dueDate: "2025-02-15", actualDate: "2025-02-14",
      wasTimely: true, iroName: "Jane Cooper", iroIndependent: true,
      participationMethod: "attended_in_person", childViewsCaptured: true,
      childViewsSummary: "Jordan spoke confidently about his progress and goals",
      parentInvited: true, parentAttended: true, carerAttended: true,
      socialWorkerAttended: true, otherProfessionals: ["School Liaison"],
      outcome: "care_plan_endorsed", carePlanUpdated: true,
      minutesDistributedWithin5Days: true, nextReviewDate: "2025-08-14",
    },
    {
      id: "rev-j2", homeId: "oak-house", childId: "child-jordan", childName: "Jordan",
      reviewType: "emergency", dueDate: "2025-05-01", actualDate: "2025-05-01",
      wasTimely: true, iroName: "Jane Cooper", iroIndependent: true,
      participationMethod: "attended_virtually", childViewsCaptured: true,
      childViewsSummary: "Jordan joined by video and shared concerns about a peer incident",
      parentInvited: false, parentAttended: false, carerAttended: true,
      socialWorkerAttended: true, otherProfessionals: [],
      outcome: "additional_assessment_required", carePlanUpdated: true,
      minutesDistributedWithin5Days: true, nextReviewDate: "2025-08-14",
    },

    // Morgan — one review with refusal, one with advocate
    {
      id: "rev-m1", homeId: "oak-house", childId: "child-morgan", childName: "Morgan",
      reviewType: "subsequent", dueDate: "2025-03-10", actualDate: "2025-03-10",
      wasTimely: true, iroName: "David Hughes", iroIndependent: false,
      participationMethod: "refused_to_participate", childViewsCaptured: false,
      parentInvited: true, parentAttended: false, carerAttended: true,
      socialWorkerAttended: false, otherProfessionals: [],
      outcome: "care_plan_endorsed", carePlanUpdated: false,
      minutesDistributedWithin5Days: true, nextReviewDate: "2025-09-10",
    },
    {
      id: "rev-m2", homeId: "oak-house", childId: "child-morgan", childName: "Morgan",
      reviewType: "subsequent", dueDate: "2025-06-10", actualDate: "2025-06-10",
      wasTimely: true, iroName: "Jane Cooper", iroIndependent: true,
      participationMethod: "advocate_attended", childViewsCaptured: true,
      childViewsSummary: "Advocate presented Morgan's written views about placement",
      parentInvited: true, parentAttended: false, carerAttended: true,
      socialWorkerAttended: true, otherProfessionals: ["CAMHS"],
      outcome: "care_plan_amended", carePlanUpdated: true,
      minutesDistributedWithin5Days: true, nextReviewDate: "2025-12-10",
    },
  ];

  const recommendations: ReviewRecommendation[] = [
    // Alex
    { id: "rec-a1", homeId: "oak-house", reviewId: "rev-a1", childId: "child-alex", childName: "Alex", recommendation: "Arrange dental appointment within 4 weeks", responsiblePerson: "Sarah Johnson", priority: "high", dueDate: "2025-02-28", status: "completed", completedDate: "2025-02-20", evidenceOfCompletion: "Dental visit confirmed — good oral health" },
    { id: "rec-a2", homeId: "oak-house", reviewId: "rev-a1", childId: "child-alex", childName: "Alex", recommendation: "Update education PEP with new SMART targets", responsiblePerson: "Tom Richards", priority: "medium", dueDate: "2025-03-31", status: "overdue" },
    { id: "rec-a3", homeId: "oak-house", reviewId: "rev-a2", childId: "child-alex", childName: "Alex", recommendation: "Refer to CAMHS for anxiety reassessment", responsiblePerson: "Sarah Johnson", priority: "urgent", dueDate: "2025-05-06", status: "in_progress" },

    // Jordan — all completed
    { id: "rec-j1", homeId: "oak-house", reviewId: "rev-j1", childId: "child-jordan", childName: "Jordan", recommendation: "Increase contact with maternal grandmother to fortnightly", responsiblePerson: "Lisa Williams", priority: "medium", dueDate: "2025-04-15", status: "completed", completedDate: "2025-03-28", evidenceOfCompletion: "Contact plan updated and first extra visit completed" },
    { id: "rec-j2", homeId: "oak-house", reviewId: "rev-j1", childId: "child-jordan", childName: "Jordan", recommendation: "Enrol in swimming lessons at local leisure centre", responsiblePerson: "Tom Richards", priority: "low", dueDate: "2025-05-15", status: "completed", completedDate: "2025-04-10", evidenceOfCompletion: "Enrolled — attending weekly sessions" },
    { id: "rec-j3", homeId: "oak-house", reviewId: "rev-j2", childId: "child-jordan", childName: "Jordan", recommendation: "Complete updated risk assessment following peer incident", responsiblePerson: "Sarah Johnson", priority: "urgent", dueDate: "2025-05-08", status: "completed", completedDate: "2025-05-05", evidenceOfCompletion: "Risk assessment updated on file" },

    // Morgan
    { id: "rec-m1", homeId: "oak-house", reviewId: "rev-m1", childId: "child-morgan", childName: "Morgan", recommendation: "Re-engage Morgan with dental services using trauma-informed approach", responsiblePerson: "Lisa Williams", priority: "high", dueDate: "2025-04-30", status: "completed", completedDate: "2025-04-25", evidenceOfCompletion: "Appointment arranged — Morgan attended with support" },
    { id: "rec-m2", homeId: "oak-house", reviewId: "rev-m2", childId: "child-morgan", childName: "Morgan", recommendation: "Develop independence skills plan with Morgan's input", responsiblePerson: "Tom Richards", priority: "medium", dueDate: "2025-06-30", status: "not_started" },
    { id: "rec-m3", homeId: "oak-house", reviewId: "rev-m1", childId: "child-morgan", childName: "Morgan", recommendation: "Arrange school transfer meeting", responsiblePerson: "Tom Richards", priority: "low", dueDate: "2025-05-30", status: "no_longer_applicable" },
  ];

  const iroActivities: IROActivity[] = [
    { id: "iro-a1", homeId: "oak-house", childId: "child-alex", childName: "Alex", iroName: "Jane Cooper", activityDate: "2025-03-10", activityType: "mid_point_check", notes: "Spoke with Alex — settling well, happy with key worker relationship", childSpokenTo: true, issuesIdentified: [], actionsRequired: [] },
    { id: "iro-a2", homeId: "oak-house", childId: "child-alex", childName: "Alex", iroName: "Jane Cooper", activityDate: "2025-05-20", activityType: "consultation", notes: "Discussed CAMHS referral progress with RM", childSpokenTo: false, issuesIdentified: ["CAMHS waiting time exceeds 12 weeks"], actionsRequired: ["Chase CAMHS referral", "Consider interim support"] },
    { id: "iro-j1", homeId: "oak-house", childId: "child-jordan", childName: "Jordan", iroName: "Jane Cooper", activityDate: "2025-04-01", activityType: "mid_point_check", notes: "Positive check-in — Jordan making good progress with education", childSpokenTo: true, issuesIdentified: [], actionsRequired: [] },
    { id: "iro-j2", homeId: "oak-house", childId: "child-jordan", childName: "Jordan", iroName: "Jane Cooper", activityDate: "2025-05-15", activityType: "escalation", notes: "Escalated delay in risk assessment completion to team manager", childSpokenTo: true, issuesIdentified: ["Delayed risk assessment — 7 days overdue"], actionsRequired: ["Complete risk assessment within 48 hours"] },
    { id: "iro-m1", homeId: "oak-house", childId: "child-morgan", childName: "Morgan", iroName: "Jane Cooper", activityDate: "2025-04-20", activityType: "monitoring_visit", notes: "Visited home to check on Morgan's engagement following refusal to attend review", childSpokenTo: true, issuesIdentified: ["Low participation in review and activities"], actionsRequired: ["Explore reasons for disengagement", "Offer advocacy service"] },
  ];

  return { reviews, recommendations, iroActivities };
}

// ── GET Handler ─────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const { reviews, recommendations, iroActivities } = getDemoData();
    const childIds = ["child-alex", "child-jordan", "child-morgan"];
    const result = generateLACReviewIntelligence(
      reviews, recommendations, iroActivities,
      childIds, "oak-house", "2025-01-01", "2025-06-30", new Date().toISOString().split("T")[0],
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate LAC review intelligence", details: String(error) },
      { status: 500 },
    );
  }
}

// ── POST Handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { reviews, recommendations, iroActivities, childIds, homeId, periodStart, periodEnd, referenceDate } = body;

    if (!childIds || !homeId || !periodStart || !periodEnd || !referenceDate) {
      return NextResponse.json(
        { error: "Missing required fields: childIds, homeId, periodStart, periodEnd, referenceDate" },
        { status: 400 },
      );
    }

    if (!Array.isArray(reviews) || !Array.isArray(recommendations) || !Array.isArray(iroActivities) || !Array.isArray(childIds)) {
      return NextResponse.json(
        { error: "reviews, recommendations, iroActivities, and childIds must be arrays" },
        { status: 400 },
      );
    }

    const result = generateLACReviewIntelligence(
      reviews, recommendations, iroActivities,
      childIds, homeId, periodStart, periodEnd, referenceDate,
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process LAC review data", details: String(error) },
      { status: 500 },
    );
  }
}
