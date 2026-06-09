// ══════════════════════════════════════════════════════════════════════════════
// API: /api/annual-development-review
//
// Annual Development Review Intelligence
//
// GET  — Returns annual development review metrics with demo data (Chamberlain House)
// POST — Accepts custom data and returns analysis
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  generateAnnualDevelopmentReviewIntelligence,
  getReviewTypeLabel,
  getGoalStatusLabel,
  getParticipationLevelLabel,
  getRatingLabel,
} from "@/lib/annual-development-review";
import type {
  ReviewRecord,
  GoalRecord,
  ReviewPolicy,
  StaffReviewTraining,
} from "@/lib/annual-development-review";

// ── Demo Data: Chamberlain House ──────────────────────────────────────────────────

function generateDemoData(): {
  reviews: ReviewRecord[];
  goals: GoalRecord[];
  policy: ReviewPolicy;
  training: StaffReviewTraining[];
} {
  const reviews: ReviewRecord[] = [
    {
      id: "rev-001",
      childId: "child-alex",
      childName: "Alex",
      reviewDate: "2026-02-10",
      reviewType: "subsequent",
      heldOnTime: true,
      iroPresent: true,
      childParticipation: "fully_participated",
      attendees: ["child", "social_worker", "iro", "keyworker", "teacher"],
      goalsSet: 3,
      previousGoalsReviewed: true,
      actionPlanCreated: true,
      minutesDistributed: true,
      nextReviewDate: "2026-08-10",
    },
    {
      id: "rev-002",
      childId: "child-jordan",
      childName: "Jordan",
      reviewDate: "2026-03-05",
      reviewType: "first_review",
      heldOnTime: true,
      iroPresent: true,
      childParticipation: "views_submitted",
      attendees: ["social_worker", "iro", "keyworker", "parent_carer"],
      goalsSet: 4,
      previousGoalsReviewed: false,
      actionPlanCreated: true,
      minutesDistributed: true,
      nextReviewDate: "2026-06-05",
    },
    {
      id: "rev-003",
      childId: "child-morgan",
      childName: "Morgan",
      reviewDate: "2026-04-20",
      reviewType: "subsequent",
      heldOnTime: true,
      iroPresent: true,
      childParticipation: "fully_participated",
      attendees: ["child", "social_worker", "iro", "keyworker", "health_professional", "teacher"],
      goalsSet: 3,
      previousGoalsReviewed: true,
      actionPlanCreated: true,
      minutesDistributed: true,
      nextReviewDate: "2026-10-20",
    },
    {
      id: "rev-004",
      childId: "child-alex",
      childName: "Alex",
      reviewDate: "2026-05-01",
      reviewType: "emergency",
      heldOnTime: false,
      iroPresent: false,
      childParticipation: "partially_participated",
      attendees: ["social_worker", "keyworker", "manager"],
      goalsSet: 1,
      previousGoalsReviewed: true,
      actionPlanCreated: true,
      minutesDistributed: false,
      nextReviewDate: "2026-08-10",
    },
  ];

  const goals: GoalRecord[] = [
    {
      id: "goal-001",
      childId: "child-alex",
      childName: "Alex",
      reviewId: "rev-001",
      goalDescription: "Improve school attendance to 95%",
      goalStatus: "achieved",
      targetDate: "2026-06-01",
      responsiblePerson: "Sarah Johnson",
      progressNotes: "Attendance improved from 88% to 96%",
    },
    {
      id: "goal-002",
      childId: "child-alex",
      childName: "Alex",
      reviewId: "rev-001",
      goalDescription: "Complete anger management programme",
      goalStatus: "on_track",
      targetDate: "2026-07-01",
      responsiblePerson: "Tom Richards",
      progressNotes: "Attending weekly sessions, good engagement",
    },
    {
      id: "goal-003",
      childId: "child-alex",
      childName: "Alex",
      reviewId: "rev-001",
      goalDescription: "Re-establish contact with aunt",
      goalStatus: "partially_met",
      targetDate: "2026-05-15",
      responsiblePerson: "Lisa Williams",
      progressNotes: "One phone call made, face-to-face visit pending",
    },
    {
      id: "goal-004",
      childId: "child-jordan",
      childName: "Jordan",
      reviewId: "rev-002",
      goalDescription: "Register with local GP",
      goalStatus: "achieved",
      targetDate: "2026-04-01",
      responsiblePerson: "Darren Laville",
      progressNotes: "Registered and initial health assessment completed",
    },
    {
      id: "goal-005",
      childId: "child-jordan",
      childName: "Jordan",
      reviewId: "rev-002",
      goalDescription: "Join a local sports club",
      goalStatus: "on_track",
      targetDate: "2026-06-15",
      responsiblePerson: "Tom Richards",
      progressNotes: "Trialling football club, positive feedback",
    },
    {
      id: "goal-006",
      childId: "child-jordan",
      childName: "Jordan",
      reviewId: "rev-002",
      goalDescription: "Complete life story work",
      goalStatus: "not_met",
      targetDate: "2026-05-01",
      responsiblePerson: "Sarah Johnson",
      progressNotes: "Jordan reluctant to engage — advocacy support being arranged",
    },
    {
      id: "goal-007",
      childId: "child-jordan",
      childName: "Jordan",
      reviewId: "rev-002",
      goalDescription: "Transition plan for secondary school",
      goalStatus: "deferred",
      targetDate: "2026-09-01",
      responsiblePerson: "Lisa Williams",
      progressNotes: "Deferred to align with school admissions timeline",
    },
    {
      id: "goal-008",
      childId: "child-morgan",
      childName: "Morgan",
      reviewId: "rev-003",
      goalDescription: "Complete GCSE coursework",
      goalStatus: "on_track",
      targetDate: "2026-06-30",
      responsiblePerson: "Sarah Johnson",
      progressNotes: "3 of 5 pieces submitted, on schedule",
    },
    {
      id: "goal-009",
      childId: "child-morgan",
      childName: "Morgan",
      reviewId: "rev-003",
      goalDescription: "Attend CAMHS appointments",
      goalStatus: "achieved",
      targetDate: "2026-05-01",
      responsiblePerson: "Tom Richards",
      progressNotes: "All appointments attended, positive engagement",
    },
    {
      id: "goal-010",
      childId: "child-morgan",
      childName: "Morgan",
      reviewId: "rev-003",
      goalDescription: "Develop independent living skills",
      goalStatus: "on_track",
      targetDate: "2026-08-01",
      responsiblePerson: "Darren Laville",
      progressNotes: "Cooking and budgeting sessions underway",
    },
    {
      id: "goal-011",
      childId: "child-alex",
      childName: "Alex",
      reviewId: "rev-004",
      goalDescription: "Safety plan following incident",
      goalStatus: "on_track",
      targetDate: "2026-06-01",
      responsiblePerson: "Darren Laville",
      progressNotes: "Safety plan in place, daily check-ins ongoing",
    },
  ];

  const policy: ReviewPolicy = {
    id: "policy-001",
    policyReviewDate: "2026-01-15",
    policyCurrent: true,
    timelinesCompliant: true,
    childParticipationFramework: true,
    multiAgencyInvitations: true,
    goalSettingStandards: true,
    minutesDistributionTimescale: true,
    qualityAssuranceProcess: true,
  };

  const training: StaffReviewTraining[] = [
    {
      id: "train-001",
      staffId: "staff-sarah",
      staffName: "Sarah Johnson",
      reviewProcess: true,
      childParticipation: true,
      goalSetting: true,
      multiAgencyWorking: true,
      minutesTaking: true,
      advocacyAwareness: true,
    },
    {
      id: "train-002",
      staffId: "staff-tom",
      staffName: "Tom Richards",
      reviewProcess: true,
      childParticipation: true,
      goalSetting: true,
      multiAgencyWorking: true,
      minutesTaking: true,
      advocacyAwareness: false,
    },
    {
      id: "train-003",
      staffId: "staff-lisa",
      staffName: "Lisa Williams",
      reviewProcess: true,
      childParticipation: true,
      goalSetting: true,
      multiAgencyWorking: false,
      minutesTaking: false,
      advocacyAwareness: true,
    },
    {
      id: "train-004",
      staffId: "staff-darren",
      staffName: "Darren Laville",
      reviewProcess: true,
      childParticipation: true,
      goalSetting: true,
      multiAgencyWorking: true,
      minutesTaking: true,
      advocacyAwareness: true,
    },
  ];

  return { reviews, goals, policy, training };
}

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET() {
  const { reviews, goals, policy, training } = generateDemoData();

  const result = generateAnnualDevelopmentReviewIntelligence(
    reviews,
    goals,
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
        reviewSummary: reviews.map((r) => ({
          id: r.id,
          childName: r.childName,
          reviewDate: r.reviewDate,
          reviewType: getReviewTypeLabel(r.reviewType),
          participation: getParticipationLevelLabel(r.childParticipation),
          heldOnTime: r.heldOnTime,
        })),
        goalSummary: goals.map((g) => ({
          id: g.id,
          childName: g.childName,
          description: g.goalDescription,
          status: getGoalStatusLabel(g.goalStatus),
          responsiblePerson: g.responsiblePerson,
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
    reviews,
    goals,
    policy,
    training,
    homeId,
    periodStart,
    periodEnd,
  } = body as {
    reviews?: ReviewRecord[];
    goals?: GoalRecord[];
    policy?: ReviewPolicy | null;
    training?: StaffReviewTraining[];
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

  const result = generateAnnualDevelopmentReviewIntelligence(
    reviews ?? [],
    goals ?? [],
    policy ?? null,
    training ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
