// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Post-Incident Learning Intelligence API Route
//
// GET  → returns Chamberlain House demo post-incident learning intelligence
// POST → accepts custom data for any home
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { generatePostIncidentLearningIntelligence } from "@/lib/post-incident-learning/post-incident-learning-engine";
import type {
  PostIncidentReview,
  LearningAction,
  PatternAnalysis,
  TeamLearningSession,
} from "@/lib/post-incident-learning/post-incident-learning-engine";

// ── Chamberlain House Demo Data ─────────────────────────────────────────────────────

function getDemoData() {
  const reviews: PostIncidentReview[] = [
    // Physical intervention #1 — Alex, contact visit distress
    {
      id: "rev-pi1",
      incidentId: "inc-pi1",
      incidentType: "physical_intervention",
      incidentDate: "2025-02-10",
      reviewDate: "2025-02-11",
      reviewedBy: "Darren Laville",
      debriefStatus: "completed_within_24h",
      childInvolved: true,
      childDebrief: true,
      staffDebrief: true,
      rootCauseIdentified: true,
      lessonsDocumented: true,
      reviewQuality: "thorough",
    },
    // Physical intervention #2 — Alex, peer conflict escalation
    {
      id: "rev-pi2",
      incidentId: "inc-pi2",
      incidentType: "physical_intervention",
      incidentDate: "2025-04-18",
      reviewDate: "2025-04-19",
      reviewedBy: "Darren Laville",
      debriefStatus: "completed_within_24h",
      childInvolved: true,
      childDebrief: true,
      staffDebrief: true,
      rootCauseIdentified: true,
      lessonsDocumented: true,
      reviewQuality: "thorough",
    },
    // Missing from care — Jordan, did not return from school
    {
      id: "rev-mfc1",
      incidentId: "inc-mfc1",
      incidentType: "missing_from_care",
      incidentDate: "2025-03-15",
      reviewDate: "2025-03-17",
      reviewedBy: "Darren Laville",
      debriefStatus: "completed_late",
      childInvolved: true,
      childDebrief: true,
      staffDebrief: true,
      rootCauseIdentified: true,
      lessonsDocumented: true,
      reviewQuality: "adequate",
    },
    // Near miss — medication timing error caught by second checker
    {
      id: "rev-nm1",
      incidentId: "inc-nm1",
      incidentType: "near_miss",
      incidentDate: "2025-05-10",
      reviewDate: "2025-05-11",
      reviewedBy: "Lisa Williams",
      debriefStatus: "completed_within_24h",
      childInvolved: false,
      childDebrief: null,
      staffDebrief: true,
      rootCauseIdentified: true,
      lessonsDocumented: true,
      reviewQuality: "thorough",
    },
  ];

  const actions: LearningAction[] = [
    // From PI #1 — transition activity plan
    {
      id: "act-1",
      reviewId: "rev-pi1",
      learningOutcome: "practice_change",
      description: "Develop structured transition plan for Alex around contact visits with specific calming activities",
      assignedTo: "Sarah Johnson",
      dueDate: "2025-03-01",
      completedDate: "2025-02-28",
      evidenceRecorded: true,
    },
    // From PI #1 — de-escalation refresher
    {
      id: "act-2",
      reviewId: "rev-pi1",
      learningOutcome: "training_delivered",
      description: "De-escalation refresher training for all staff with focus on transition-related distress",
      assignedTo: "Darren Laville",
      dueDate: "2025-03-31",
      completedDate: "2025-03-15",
      evidenceRecorded: true,
    },
    // From PI #2 — peer conflict mediation
    {
      id: "act-3",
      reviewId: "rev-pi2",
      learningOutcome: "practice_change",
      description: "Introduce structured peer mediation approach when tensions arise between young people",
      assignedTo: "Tom Richards",
      dueDate: "2025-05-15",
      completedDate: "2025-05-10",
      evidenceRecorded: true,
    },
    // From missing from care — daily check-in procedure
    {
      id: "act-4",
      reviewId: "rev-mfc1",
      learningOutcome: "policy_update",
      description: "Update missing from care protocol to include daily after-school check-in at breakfast",
      assignedTo: "Darren Laville",
      dueDate: "2025-04-15",
      completedDate: "2025-04-01",
      evidenceRecorded: true,
    },
    // From missing from care — Jordan's safety plan
    {
      id: "act-5",
      reviewId: "rev-mfc1",
      learningOutcome: "practice_change",
      description: "Update Jordan's individual safety plan with clear expectations around after-school communication",
      assignedTo: "Tom Richards",
      dueDate: "2025-04-15",
      completedDate: "2025-04-05",
      evidenceRecorded: true,
    },
    // From near miss — medication handover procedure
    {
      id: "act-6",
      reviewId: "rev-nm1",
      learningOutcome: "policy_update",
      description: "Introduce medication double-check sheet for shift handover with mandatory sign-off",
      assignedTo: "Lisa Williams",
      dueDate: "2025-06-01",
      completedDate: "2025-05-20",
      evidenceRecorded: true,
    },
    // From near miss — environment change (medication storage)
    {
      id: "act-7",
      reviewId: "rev-nm1",
      learningOutcome: "environment_change",
      description: "Relocate medication administration checklist to be visible at handover station",
      assignedTo: "Lisa Williams",
      dueDate: "2025-06-01",
      completedDate: "2025-05-22",
      evidenceRecorded: true,
    },
  ];

  const patterns: PatternAnalysis[] = [
    // Alex — physical interventions pattern (de-escalating after structured plan)
    {
      id: "pat-1",
      childId: "child-alex",
      childName: "Alex",
      incidentType: "physical_intervention",
      recurrencePattern: "de_escalating",
      frequency: 2,
      triggerIdentified: true,
      strategiesUpdated: true,
      multiAgencyInvolved: false,
    },
    // Jordan — missing from care (first occurrence this period)
    {
      id: "pat-2",
      childId: "child-jordan",
      childName: "Jordan",
      incidentType: "missing_from_care",
      recurrencePattern: "first_occurrence",
      frequency: 1,
      triggerIdentified: true,
      strategiesUpdated: true,
      multiAgencyInvolved: true,
    },
  ];

  const sessions: TeamLearningSession[] = [
    {
      id: "sess-1",
      sessionDate: "2025-02-20",
      facilitator: "Darren Laville",
      topic: "Learning from physical intervention with Alex — transition planning",
      incidentRelated: true,
      attendeeCount: 9,
      totalStaff: 10,
      actionPointsGenerated: 4,
      actionPointsCompleted: 4,
    },
    {
      id: "sess-2",
      sessionDate: "2025-03-25",
      facilitator: "Darren Laville",
      topic: "Missing from care review — communication and safety planning",
      incidentRelated: true,
      attendeeCount: 8,
      totalStaff: 10,
      actionPointsGenerated: 3,
      actionPointsCompleted: 3,
    },
    {
      id: "sess-3",
      sessionDate: "2025-04-22",
      facilitator: "Sarah Johnson",
      topic: "De-escalation techniques refresher and peer conflict strategies",
      incidentRelated: true,
      attendeeCount: 10,
      totalStaff: 10,
      actionPointsGenerated: 5,
      actionPointsCompleted: 4,
    },
    {
      id: "sess-4",
      sessionDate: "2025-05-20",
      facilitator: "Lisa Williams",
      topic: "Medication safety and shift handover improvements",
      incidentRelated: true,
      attendeeCount: 9,
      totalStaff: 10,
      actionPointsGenerated: 3,
      actionPointsCompleted: 3,
    },
  ];

  return { reviews, actions, patterns, sessions };
}

// ── GET Handler ─────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const { reviews, actions, patterns, sessions } = getDemoData();
    const result = generatePostIncidentLearningIntelligence(
      reviews,
      actions,
      patterns,
      sessions,
      "oak-house",
      "2025-01-01",
      "2025-06-30",
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate post-incident learning intelligence", details: String(error) },
      { status: 500 },
    );
  }
}

// ── POST Handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { reviews, actions, patterns, sessions, homeId, periodStart, periodEnd } = body;

    if (!homeId || !periodStart || !periodEnd) {
      return NextResponse.json(
        { error: "Missing required fields: homeId, periodStart, periodEnd" },
        { status: 400 },
      );
    }

    if (
      !Array.isArray(reviews) ||
      !Array.isArray(actions) ||
      !Array.isArray(patterns) ||
      !Array.isArray(sessions)
    ) {
      return NextResponse.json(
        { error: "reviews, actions, patterns, and sessions must be arrays" },
        { status: 400 },
      );
    }

    const result = generatePostIncidentLearningIntelligence(
      reviews,
      actions,
      patterns,
      sessions,
      homeId,
      periodStart,
      periodEnd,
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process post-incident learning data", details: String(error) },
      { status: 500 },
    );
  }
}
