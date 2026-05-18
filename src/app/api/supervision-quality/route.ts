// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Supervision Quality Intelligence API Route
//
// GET  → returns Oak House demo supervision quality intelligence
// POST → accepts custom data for any home
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { generateSupervisionQualityIntelligence } from "@/lib/supervision-quality/supervision-quality-engine";
import type {
  SupervisionSession,
  SupervisionSchedule,
  SupervisionAction,
  StaffDevelopmentOutcome,
} from "@/lib/supervision-quality/supervision-quality-engine";

// ── Oak House Demo Data ─────────────────────────────────────────────────────

function getDemoData() {
  const sessions: SupervisionSession[] = [
    // Sarah Johnson — Senior RSW: 6 formal sessions, outstanding quality, reflective, on schedule
    {
      id: "sess-s1", staffId: "staff-sarah", staffName: "Sarah Johnson",
      supervisorId: "staff-darren", supervisorName: "Darren Laville",
      date: "2025-01-15", durationMinutes: 60, supervisionType: "formal_individual",
      quality: "outstanding", reflectivePracticeLevel: "reflective",
      safeguardingDiscussed: true, childrenDiscussed: ["Child A", "Child B"],
      actionsAgreed: 3, actionsCompleted: 3, wellbeingCheck: "no_concerns",
      recordedTimely: true, staffSignedOff: true, supervisorSignedOff: true,
    },
    {
      id: "sess-s2", staffId: "staff-sarah", staffName: "Sarah Johnson",
      supervisorId: "staff-darren", supervisorName: "Darren Laville",
      date: "2025-02-12", durationMinutes: 55, supervisionType: "formal_individual",
      quality: "outstanding", reflectivePracticeLevel: "deeply_reflective",
      safeguardingDiscussed: true, childrenDiscussed: ["Child A", "Child C"],
      actionsAgreed: 2, actionsCompleted: 2, wellbeingCheck: "no_concerns",
      recordedTimely: true, staffSignedOff: true, supervisorSignedOff: true,
    },
    {
      id: "sess-s3", staffId: "staff-sarah", staffName: "Sarah Johnson",
      supervisorId: "staff-darren", supervisorName: "Darren Laville",
      date: "2025-03-11", durationMinutes: 65, supervisionType: "formal_individual",
      quality: "good", reflectivePracticeLevel: "reflective",
      safeguardingDiscussed: true, childrenDiscussed: ["Child B", "Child D"],
      actionsAgreed: 3, actionsCompleted: 2, wellbeingCheck: "minor_concerns_addressed",
      recordedTimely: true, staffSignedOff: true, supervisorSignedOff: true,
    },
    {
      id: "sess-s4", staffId: "staff-sarah", staffName: "Sarah Johnson",
      supervisorId: "staff-darren", supervisorName: "Darren Laville",
      date: "2025-04-08", durationMinutes: 60, supervisionType: "formal_individual",
      quality: "outstanding", reflectivePracticeLevel: "deeply_reflective",
      safeguardingDiscussed: true, childrenDiscussed: ["Child A", "Child B", "Child C"],
      actionsAgreed: 4, actionsCompleted: 3, wellbeingCheck: "no_concerns",
      recordedTimely: true, staffSignedOff: true, supervisorSignedOff: true,
    },
    {
      id: "sess-s5", staffId: "staff-sarah", staffName: "Sarah Johnson",
      supervisorId: "staff-darren", supervisorName: "Darren Laville",
      date: "2025-05-06", durationMinutes: 60, supervisionType: "formal_individual",
      quality: "outstanding", reflectivePracticeLevel: "reflective",
      safeguardingDiscussed: true, childrenDiscussed: ["Child D"],
      actionsAgreed: 2, actionsCompleted: 2, wellbeingCheck: "no_concerns",
      recordedTimely: true, staffSignedOff: true, supervisorSignedOff: true,
    },
    {
      id: "sess-s6", staffId: "staff-sarah", staffName: "Sarah Johnson",
      supervisorId: "staff-darren", supervisorName: "Darren Laville",
      date: "2025-06-03", durationMinutes: 55, supervisionType: "formal_individual",
      quality: "good", reflectivePracticeLevel: "reflective",
      safeguardingDiscussed: true, childrenDiscussed: ["Child A", "Child C"],
      actionsAgreed: 3, actionsCompleted: 2, wellbeingCheck: "no_concerns",
      recordedTimely: true, staffSignedOff: true, supervisorSignedOff: true,
    },

    // Tom Richards — RSW: 4 sessions, good quality, surface-level reflection, slightly overdue
    {
      id: "sess-t1", staffId: "staff-tom", staffName: "Tom Richards",
      supervisorId: "staff-sarah", supervisorName: "Sarah Johnson",
      date: "2025-01-20", durationMinutes: 50, supervisionType: "formal_individual",
      quality: "good", reflectivePracticeLevel: "surface_level",
      safeguardingDiscussed: true, childrenDiscussed: ["Child B"],
      actionsAgreed: 3, actionsCompleted: 1, wellbeingCheck: "no_concerns",
      recordedTimely: true, staffSignedOff: true, supervisorSignedOff: true,
    },
    {
      id: "sess-t2", staffId: "staff-tom", staffName: "Tom Richards",
      supervisorId: "staff-sarah", supervisorName: "Sarah Johnson",
      date: "2025-02-24", durationMinutes: 45, supervisionType: "formal_individual",
      quality: "good", reflectivePracticeLevel: "surface_level",
      safeguardingDiscussed: true, childrenDiscussed: ["Child A", "Child D"],
      actionsAgreed: 2, actionsCompleted: 1, wellbeingCheck: "minor_concerns_addressed",
      recordedTimely: false, staffSignedOff: true, supervisorSignedOff: true,
    },
    {
      id: "sess-t3", staffId: "staff-tom", staffName: "Tom Richards",
      supervisorId: "staff-sarah", supervisorName: "Sarah Johnson",
      date: "2025-04-01", durationMinutes: 50, supervisionType: "formal_individual",
      quality: "adequate", reflectivePracticeLevel: "surface_level",
      safeguardingDiscussed: false, childrenDiscussed: ["Child C"],
      actionsAgreed: 3, actionsCompleted: 2, wellbeingCheck: "no_concerns",
      recordedTimely: true, staffSignedOff: true, supervisorSignedOff: false,
    },
    {
      id: "sess-t4", staffId: "staff-tom", staffName: "Tom Richards",
      supervisorId: "staff-sarah", supervisorName: "Sarah Johnson",
      date: "2025-05-12", durationMinutes: 55, supervisionType: "formal_individual",
      quality: "good", reflectivePracticeLevel: "reflective",
      safeguardingDiscussed: true, childrenDiscussed: ["Child B", "Child D"],
      actionsAgreed: 2, actionsCompleted: 1, wellbeingCheck: "no_concerns",
      recordedTimely: true, staffSignedOff: true, supervisorSignedOff: true,
    },

    // Lisa Williams — Senior RSW: 5 sessions, outstanding, deeply reflective
    {
      id: "sess-l1", staffId: "staff-lisa", staffName: "Lisa Williams",
      supervisorId: "staff-darren", supervisorName: "Darren Laville",
      date: "2025-01-17", durationMinutes: 70, supervisionType: "formal_individual",
      quality: "outstanding", reflectivePracticeLevel: "deeply_reflective",
      safeguardingDiscussed: true, childrenDiscussed: ["Child A", "Child B", "Child C"],
      actionsAgreed: 3, actionsCompleted: 3, wellbeingCheck: "no_concerns",
      recordedTimely: true, staffSignedOff: true, supervisorSignedOff: true,
    },
    {
      id: "sess-l2", staffId: "staff-lisa", staffName: "Lisa Williams",
      supervisorId: "staff-darren", supervisorName: "Darren Laville",
      date: "2025-02-14", durationMinutes: 65, supervisionType: "formal_individual",
      quality: "outstanding", reflectivePracticeLevel: "deeply_reflective",
      safeguardingDiscussed: true, childrenDiscussed: ["Child D"],
      actionsAgreed: 2, actionsCompleted: 2, wellbeingCheck: "no_concerns",
      recordedTimely: true, staffSignedOff: true, supervisorSignedOff: true,
    },
    {
      id: "sess-l3", staffId: "staff-lisa", staffName: "Lisa Williams",
      supervisorId: "staff-darren", supervisorName: "Darren Laville",
      date: "2025-03-14", durationMinutes: 60, supervisionType: "formal_individual",
      quality: "outstanding", reflectivePracticeLevel: "deeply_reflective",
      safeguardingDiscussed: true, childrenDiscussed: ["Child A", "Child C"],
      actionsAgreed: 3, actionsCompleted: 3, wellbeingCheck: "no_concerns",
      recordedTimely: true, staffSignedOff: true, supervisorSignedOff: true,
    },
    {
      id: "sess-l4", staffId: "staff-lisa", staffName: "Lisa Williams",
      supervisorId: "staff-darren", supervisorName: "Darren Laville",
      date: "2025-04-11", durationMinutes: 70, supervisionType: "formal_individual",
      quality: "good", reflectivePracticeLevel: "deeply_reflective",
      safeguardingDiscussed: true, childrenDiscussed: ["Child B"],
      actionsAgreed: 2, actionsCompleted: 2, wellbeingCheck: "no_concerns",
      recordedTimely: true, staffSignedOff: true, supervisorSignedOff: true,
    },
    {
      id: "sess-l5", staffId: "staff-lisa", staffName: "Lisa Williams",
      supervisorId: "staff-darren", supervisorName: "Darren Laville",
      date: "2025-05-09", durationMinutes: 65, supervisionType: "formal_individual",
      quality: "outstanding", reflectivePracticeLevel: "deeply_reflective",
      safeguardingDiscussed: true, childrenDiscussed: ["Child A", "Child D"],
      actionsAgreed: 3, actionsCompleted: 2, wellbeingCheck: "no_concerns",
      recordedTimely: true, staffSignedOff: true, supervisorSignedOff: true,
    },

    // Darren Laville — RM: 3 management supervisions of staff, monthly schedule
    {
      id: "sess-d1", staffId: "staff-darren", staffName: "Darren Laville",
      supervisorId: "ext-ri", supervisorName: "External RI",
      date: "2025-02-05", durationMinutes: 75, supervisionType: "management",
      quality: "outstanding", reflectivePracticeLevel: "deeply_reflective",
      safeguardingDiscussed: true, childrenDiscussed: ["Child A", "Child B", "Child C", "Child D"],
      actionsAgreed: 4, actionsCompleted: 4, wellbeingCheck: "no_concerns",
      recordedTimely: true, staffSignedOff: true, supervisorSignedOff: true,
    },
    {
      id: "sess-d2", staffId: "staff-darren", staffName: "Darren Laville",
      supervisorId: "ext-ri", supervisorName: "External RI",
      date: "2025-04-02", durationMinutes: 70, supervisionType: "management",
      quality: "outstanding", reflectivePracticeLevel: "deeply_reflective",
      safeguardingDiscussed: true, childrenDiscussed: ["Child A", "Child B", "Child C", "Child D"],
      actionsAgreed: 3, actionsCompleted: 3, wellbeingCheck: "no_concerns",
      recordedTimely: true, staffSignedOff: true, supervisorSignedOff: true,
    },
    {
      id: "sess-d3", staffId: "staff-darren", staffName: "Darren Laville",
      supervisorId: "ext-ri", supervisorName: "External RI",
      date: "2025-06-04", durationMinutes: 80, supervisionType: "management",
      quality: "outstanding", reflectivePracticeLevel: "deeply_reflective",
      safeguardingDiscussed: true, childrenDiscussed: ["Child A", "Child B", "Child C", "Child D"],
      actionsAgreed: 3, actionsCompleted: 2, wellbeingCheck: "no_concerns",
      recordedTimely: true, staffSignedOff: true, supervisorSignedOff: true,
    },
  ];

  const schedules: SupervisionSchedule[] = [
    {
      id: "sch-sarah", staffId: "staff-sarah", staffName: "Sarah Johnson",
      requiredFrequency: "monthly", lastSessionDate: "2025-06-03",
      nextDueDate: "2025-07-03", consecutiveMissed: 0, overdue: false,
    },
    {
      id: "sch-tom", staffId: "staff-tom", staffName: "Tom Richards",
      requiredFrequency: "monthly", lastSessionDate: "2025-05-12",
      nextDueDate: "2025-06-12", consecutiveMissed: 1, overdue: true,
    },
    {
      id: "sch-lisa", staffId: "staff-lisa", staffName: "Lisa Williams",
      requiredFrequency: "monthly", lastSessionDate: "2025-05-09",
      nextDueDate: "2025-06-09", consecutiveMissed: 0, overdue: false,
    },
    {
      id: "sch-darren", staffId: "staff-darren", staffName: "Darren Laville",
      requiredFrequency: "monthly", lastSessionDate: "2025-06-04",
      nextDueDate: "2025-07-04", consecutiveMissed: 0, overdue: false,
    },
  ];

  const actions: SupervisionAction[] = [
    // Sarah — mostly completed
    {
      id: "act-s1", sessionId: "sess-s4", staffId: "staff-sarah", staffName: "Sarah Johnson",
      description: "Complete trauma-informed practice training module", targetDate: "2025-05-01",
      status: "completed_on_time", category: "training",
    },
    {
      id: "act-s2", sessionId: "sess-s5", staffId: "staff-sarah", staffName: "Sarah Johnson",
      description: "Update risk assessments for Child A", targetDate: "2025-05-20",
      status: "completed_on_time", category: "safeguarding",
    },
    {
      id: "act-s3", sessionId: "sess-s6", staffId: "staff-sarah", staffName: "Sarah Johnson",
      description: "Prepare for Level 4 Diploma portfolio assessment", targetDate: "2025-07-01",
      status: "in_progress", category: "development",
    },
    {
      id: "act-s4", sessionId: "sess-s3", staffId: "staff-sarah", staffName: "Sarah Johnson",
      description: "Review wellbeing support plan for self", targetDate: "2025-04-15",
      status: "completed_on_time", category: "wellbeing",
    },

    // Tom — mix of completed, in-progress, overdue
    {
      id: "act-t1", sessionId: "sess-t1", staffId: "staff-tom", staffName: "Tom Richards",
      description: "Complete online safeguarding refresher course", targetDate: "2025-02-28",
      status: "completed_late", category: "safeguarding",
    },
    {
      id: "act-t2", sessionId: "sess-t2", staffId: "staff-tom", staffName: "Tom Richards",
      description: "Shadow senior staff on complex behaviour support", targetDate: "2025-03-31",
      status: "completed_on_time", category: "practice",
    },
    {
      id: "act-t3", sessionId: "sess-t3", staffId: "staff-tom", staffName: "Tom Richards",
      description: "Submit Level 3 Diploma Unit 5 assignment", targetDate: "2025-05-01",
      status: "overdue", category: "development",
    },
    {
      id: "act-t4", sessionId: "sess-t4", staffId: "staff-tom", staffName: "Tom Richards",
      description: "Complete child-centred care plan for Child B", targetDate: "2025-06-15",
      status: "in_progress", category: "practice",
    },

    // Lisa — mostly completed
    {
      id: "act-l1", sessionId: "sess-l1", staffId: "staff-lisa", staffName: "Lisa Williams",
      description: "Deliver team training on therapeutic communication", targetDate: "2025-03-01",
      status: "completed_on_time", category: "training",
    },
    {
      id: "act-l2", sessionId: "sess-l3", staffId: "staff-lisa", staffName: "Lisa Williams",
      description: "Review and update safeguarding procedures", targetDate: "2025-04-30",
      status: "completed_on_time", category: "safeguarding",
    },
    {
      id: "act-l3", sessionId: "sess-l5", staffId: "staff-lisa", staffName: "Lisa Williams",
      description: "Develop reflective practice workshop for team", targetDate: "2025-06-30",
      status: "in_progress", category: "development",
    },

    // Darren — management actions
    {
      id: "act-d1", sessionId: "sess-d1", staffId: "staff-darren", staffName: "Darren Laville",
      description: "Complete Reg 44 visit action plan follow-up", targetDate: "2025-03-01",
      status: "completed_on_time", category: "practice",
    },
    {
      id: "act-d2", sessionId: "sess-d2", staffId: "staff-darren", staffName: "Darren Laville",
      description: "Review and update home safeguarding policy", targetDate: "2025-05-01",
      status: "completed_on_time", category: "safeguarding",
    },
    {
      id: "act-d3", sessionId: "sess-d3", staffId: "staff-darren", staffName: "Darren Laville",
      description: "Submit strategic development plan for next quarter", targetDate: "2025-07-01",
      status: "in_progress", category: "development",
    },
  ];

  const outcomes: StaffDevelopmentOutcome[] = [
    // Sarah
    {
      id: "dev-s1", staffId: "staff-sarah", staffName: "Sarah Johnson",
      skillArea: "Therapeutic Care", startLevel: 2, currentLevel: 3,
      improvementPlan: true, targetDate: "2025-09-01",
    },
    {
      id: "dev-s2", staffId: "staff-sarah", staffName: "Sarah Johnson",
      skillArea: "Reflective Practice", startLevel: 3, currentLevel: 4,
      improvementPlan: false, targetDate: "2025-06-01",
    },

    // Tom
    {
      id: "dev-t1", staffId: "staff-tom", staffName: "Tom Richards",
      skillArea: "Record Keeping", startLevel: 1, currentLevel: 3,
      improvementPlan: true, targetDate: "2025-06-01",
    },
    {
      id: "dev-t2", staffId: "staff-tom", staffName: "Tom Richards",
      skillArea: "Behaviour Management", startLevel: 2, currentLevel: 3,
      improvementPlan: true, targetDate: "2025-08-01",
    },

    // Lisa
    {
      id: "dev-l1", staffId: "staff-lisa", staffName: "Lisa Williams",
      skillArea: "Clinical Supervision Skills", startLevel: 3, currentLevel: 4,
      improvementPlan: false, targetDate: "2025-06-01",
    },
    {
      id: "dev-l2", staffId: "staff-lisa", staffName: "Lisa Williams",
      skillArea: "Safeguarding Leadership", startLevel: 3, currentLevel: 4,
      improvementPlan: true, targetDate: "2025-09-01",
    },

    // Darren
    {
      id: "dev-d1", staffId: "staff-darren", staffName: "Darren Laville",
      skillArea: "Strategic Leadership", startLevel: 3, currentLevel: 4,
      improvementPlan: true, targetDate: "2025-12-01",
    },
    {
      id: "dev-d2", staffId: "staff-darren", staffName: "Darren Laville",
      skillArea: "Quality Assurance", startLevel: 4, currentLevel: 5,
      improvementPlan: false, targetDate: "2025-09-01",
    },
  ];

  return { sessions, schedules, actions, outcomes };
}

// ── GET Handler ─────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const { sessions, schedules, actions, outcomes } = getDemoData();
    const result = generateSupervisionQualityIntelligence(
      sessions, schedules, actions, outcomes,
      "oak-house", "2025-01-01", "2025-06-30",
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate supervision quality intelligence", details: String(error) },
      { status: 500 },
    );
  }
}

// ── POST Handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessions, schedules, actions, outcomes, homeId, periodStart, periodEnd } = body;

    if (!homeId || !periodStart || !periodEnd) {
      return NextResponse.json(
        { error: "Missing required fields: homeId, periodStart, periodEnd" },
        { status: 400 },
      );
    }

    if (!Array.isArray(sessions) || !Array.isArray(schedules) || !Array.isArray(actions) || !Array.isArray(outcomes)) {
      return NextResponse.json(
        { error: "sessions, schedules, actions, and outcomes must be arrays" },
        { status: 400 },
      );
    }

    const result = generateSupervisionQualityIntelligence(
      sessions, schedules, actions, outcomes,
      homeId, periodStart, periodEnd,
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process supervision quality data", details: String(error) },
      { status: 500 },
    );
  }
}
