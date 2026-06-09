// ══════════════════════════════════════════════════════════════════════════════
// API: /api/key-worker — Key Worker Relationship Quality Intelligence
//
// GET  — returns Chamberlain House demo data with full intelligence report
// POST — analyse custom key worker data with validation
//
// CHR 2015 Reg 10 — Positive relationships
// CHR 2015 Reg 14 — Care planning
// SCCIF — Experience of Children
// UNCRC Article 12 — Right to be heard
// Working Together 2023
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  generateKeyWorkerIntelligence,
  evaluateSessionConsistency,
  evaluateChildVoice,
  evaluateRelationshipQuality,
  evaluateGoalProgress,
  buildChildKeyWorkerProfiles,
} from "@/lib/key-worker";
import type {
  KeyWorkerSession,
  KeyWorkerAssignment,
  KeyWorkerGoal,
} from "@/lib/key-worker";

// ── GET Handler ───────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const homeId = url.searchParams.get("homeId") ?? "home-oak";
  const periodStart =
    url.searchParams.get("periodStart") ?? "2026-03-01T00:00:00Z";
  const periodEnd =
    url.searchParams.get("periodEnd") ?? "2026-05-18T23:59:59Z";
  const referenceDate = new Date().toISOString();

  const sessions = getDemoSessions();
  const assignments = getDemoAssignments();
  const goals = getDemoGoals();

  const result = generateKeyWorkerIntelligence(
    sessions,
    assignments,
    goals,
    homeId,
    periodStart,
    periodEnd,
    referenceDate,
  );

  return NextResponse.json(result);
}

// ── POST Handler ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const { action } = body;

  if (action === "full_intelligence") {
    const { sessions, assignments, goals, homeId, periodStart, periodEnd } =
      body;
    if (!homeId || !periodStart || !periodEnd) {
      return NextResponse.json(
        { error: "homeId, periodStart, and periodEnd are required" },
        { status: 400 },
      );
    }
    if (!Array.isArray(sessions) || !Array.isArray(assignments)) {
      return NextResponse.json(
        { error: "sessions and assignments must be arrays" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      generateKeyWorkerIntelligence(
        sessions as KeyWorkerSession[],
        assignments as KeyWorkerAssignment[],
        (goals ?? []) as KeyWorkerGoal[],
        homeId as string,
        periodStart as string,
        periodEnd as string,
        new Date().toISOString(),
      ),
    );
  }

  if (action === "session_consistency") {
    const { sessions, assignments, periodStart, periodEnd } = body;
    if (!Array.isArray(sessions) || !Array.isArray(assignments)) {
      return NextResponse.json(
        { error: "sessions and assignments must be arrays" },
        { status: 400 },
      );
    }
    if (!periodStart || !periodEnd) {
      return NextResponse.json(
        { error: "periodStart and periodEnd are required" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      evaluateSessionConsistency(
        sessions as KeyWorkerSession[],
        assignments as KeyWorkerAssignment[],
        periodStart as string,
        periodEnd as string,
      ),
    );
  }

  if (action === "child_voice") {
    const { sessions } = body;
    if (!Array.isArray(sessions)) {
      return NextResponse.json(
        { error: "sessions must be an array" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      evaluateChildVoice(sessions as KeyWorkerSession[]),
    );
  }

  if (action === "relationship_quality") {
    const { sessions } = body;
    if (!Array.isArray(sessions)) {
      return NextResponse.json(
        { error: "sessions must be an array" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      evaluateRelationshipQuality(sessions as KeyWorkerSession[]),
    );
  }

  if (action === "goal_progress") {
    const { goals } = body;
    if (!Array.isArray(goals)) {
      return NextResponse.json(
        { error: "goals must be an array" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      evaluateGoalProgress(goals as KeyWorkerGoal[]),
    );
  }

  if (action === "child_profiles") {
    const { sessions, assignments, goals } = body;
    if (!Array.isArray(sessions) || !Array.isArray(assignments)) {
      return NextResponse.json(
        { error: "sessions and assignments must be arrays" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      buildChildKeyWorkerProfiles(
        sessions as KeyWorkerSession[],
        assignments as KeyWorkerAssignment[],
        (goals ?? []) as KeyWorkerGoal[],
      ),
    );
  }

  return NextResponse.json(
    {
      error: "Unknown action. Supported: full_intelligence, session_consistency, child_voice, relationship_quality, goal_progress, child_profiles",
    },
    { status: 400 },
  );
}

// ── Demo Data ─────────────────────────────────────────────────────────────

function getDemoAssignments(): KeyWorkerAssignment[] {
  return [
    {
      childId: "child-alex",
      childName: "Alex",
      primaryKeyWorkerId: "staff-tr",
      primaryKeyWorkerName: "Tom Richards",
      secondaryKeyWorkerId: "staff-sj",
      secondaryKeyWorkerName: "Sarah Johnson",
      assignmentDate: "2025-09-01",
    },
    {
      childId: "child-jordan",
      childName: "Jordan",
      primaryKeyWorkerId: "staff-lw",
      primaryKeyWorkerName: "Lisa Williams",
      secondaryKeyWorkerId: "staff-dl",
      secondaryKeyWorkerName: "Darren Laville",
      assignmentDate: "2025-10-01",
    },
    {
      childId: "child-morgan",
      childName: "Morgan",
      primaryKeyWorkerId: "staff-sj",
      primaryKeyWorkerName: "Sarah Johnson",
      secondaryKeyWorkerId: "staff-tr",
      secondaryKeyWorkerName: "Tom Richards",
      assignmentDate: "2025-08-15",
      lastChangeDate: "2026-01-10",
      changeReason: "Staff restructuring",
    },
  ];
}

function getDemoSessions(): KeyWorkerSession[] {
  return [
    // Alex — Tom Richards
    {
      id: "kw-s001", childId: "child-alex", childName: "Alex",
      keyWorkerId: "staff-tr", keyWorkerName: "Tom Richards",
      date: "2026-03-05T14:00:00Z", duration: 45, sessionType: "one_to_one", status: "completed",
      topicsDiscussed: ["settling in", "room personalisation"],
      childVoiceIndicators: ["wishes_recorded", "feelings_expressed", "choices_offered"],
      relationshipIndicators: ["trust_building", "warmth_demonstrated", "active_listening"],
      goalsReviewed: [], goalsSet: [],
    },
    {
      id: "kw-s002", childId: "child-alex", childName: "Alex",
      keyWorkerId: "staff-tr", keyWorkerName: "Tom Richards",
      date: "2026-03-12T15:00:00Z", duration: 60, sessionType: "activity_based", status: "completed",
      topicsDiscussed: ["football", "team building"],
      childVoiceIndicators: ["wishes_recorded", "choices_offered"],
      relationshipIndicators: ["trust_building", "child_led", "warmth_demonstrated"],
      goalsReviewed: [], goalsSet: [],
    },
    {
      id: "kw-s003", childId: "child-alex", childName: "Alex",
      keyWorkerId: "staff-tr", keyWorkerName: "Tom Richards",
      date: "2026-03-19T14:00:00Z", duration: 30, sessionType: "goal_setting", status: "completed",
      topicsDiscussed: ["education targets", "weekend activities"],
      childVoiceIndicators: ["wishes_recorded", "feelings_expressed", "views_influenced_plan"],
      relationshipIndicators: ["active_listening", "child_led", "trauma_informed"],
      goalsReviewed: [], goalsSet: ["goal-001", "goal-002"],
    },
    {
      id: "kw-s004", childId: "child-alex", childName: "Alex",
      keyWorkerId: "staff-tr", keyWorkerName: "Tom Richards",
      date: "2026-04-02T14:00:00Z", duration: 45, sessionType: "one_to_one", status: "completed",
      topicsDiscussed: ["school progress", "friendships"],
      childVoiceIndicators: ["feelings_expressed", "choices_offered"],
      relationshipIndicators: ["trust_building", "consistent_boundaries", "warmth_demonstrated", "active_listening"],
      goalsReviewed: [], goalsSet: [],
    },
    {
      id: "kw-s005", childId: "child-alex", childName: "Alex",
      keyWorkerId: "staff-tr", keyWorkerName: "Tom Richards",
      date: "2026-04-16T15:00:00Z", duration: 50, sessionType: "review", status: "completed",
      topicsDiscussed: ["care plan review", "family contact"],
      childVoiceIndicators: ["wishes_recorded", "feelings_expressed", "views_influenced_plan"],
      relationshipIndicators: ["active_listening", "warmth_demonstrated", "trauma_informed", "culturally_responsive"],
      goalsReviewed: ["goal-001"], goalsSet: [],
    },
    {
      id: "kw-s006", childId: "child-alex", childName: "Alex",
      keyWorkerId: "staff-tr", keyWorkerName: "Tom Richards",
      date: "2026-04-25T10:00:00Z", duration: 40, sessionType: "informal_check_in", status: "completed",
      topicsDiscussed: ["weekend plans"],
      childVoiceIndicators: ["wishes_recorded"],
      relationshipIndicators: ["warmth_demonstrated", "trust_building"],
      goalsReviewed: [], goalsSet: [],
    },
    {
      id: "kw-s007", childId: "child-alex", childName: "Alex",
      keyWorkerId: "staff-tr", keyWorkerName: "Tom Richards",
      date: "2026-05-07T14:00:00Z", duration: 45, sessionType: "one_to_one", status: "completed",
      topicsDiscussed: ["exam preparation", "anxiety"],
      childVoiceIndicators: ["feelings_expressed", "wishes_recorded", "choices_offered"],
      relationshipIndicators: ["trauma_informed", "active_listening", "warmth_demonstrated", "trust_building"],
      goalsReviewed: [], goalsSet: [],
    },
    {
      id: "kw-s008", childId: "child-alex", childName: "Alex",
      keyWorkerId: "staff-tr", keyWorkerName: "Tom Richards",
      date: "2026-05-14T14:00:00Z", duration: 0, sessionType: "one_to_one", status: "cancelled_by_staff",
      topicsDiscussed: [], childVoiceIndicators: [], relationshipIndicators: [],
      goalsReviewed: [], goalsSet: [],
    },

    // Jordan — Lisa Williams
    {
      id: "kw-s009", childId: "child-jordan", childName: "Jordan",
      keyWorkerId: "staff-lw", keyWorkerName: "Lisa Williams",
      date: "2026-03-04T10:00:00Z", duration: 50, sessionType: "one_to_one", status: "completed",
      topicsDiscussed: ["feelings about placement", "interests"],
      childVoiceIndicators: ["wishes_recorded", "feelings_expressed", "choices_offered", "views_influenced_plan"],
      relationshipIndicators: ["trust_building", "warmth_demonstrated", "active_listening", "child_led", "trauma_informed"],
      goalsReviewed: [], goalsSet: [],
    },
    {
      id: "kw-s010", childId: "child-jordan", childName: "Jordan",
      keyWorkerId: "staff-lw", keyWorkerName: "Lisa Williams",
      date: "2026-03-11T14:00:00Z", duration: 60, sessionType: "activity_based", status: "completed",
      topicsDiscussed: ["art project", "self-expression"],
      childVoiceIndicators: ["wishes_recorded", "feelings_expressed", "choices_offered"],
      relationshipIndicators: ["child_led", "warmth_demonstrated", "culturally_responsive", "active_listening"],
      goalsReviewed: [], goalsSet: [],
    },
    {
      id: "kw-s011", childId: "child-jordan", childName: "Jordan",
      keyWorkerId: "staff-lw", keyWorkerName: "Lisa Williams",
      date: "2026-03-25T10:00:00Z", duration: 45, sessionType: "goal_setting", status: "completed",
      topicsDiscussed: ["social goals", "independence"],
      childVoiceIndicators: ["wishes_recorded", "feelings_expressed", "views_influenced_plan", "choices_offered"],
      relationshipIndicators: ["active_listening", "child_led", "trauma_informed", "culturally_responsive"],
      goalsReviewed: [], goalsSet: ["goal-005", "goal-006"],
    },
    {
      id: "kw-s012", childId: "child-jordan", childName: "Jordan",
      keyWorkerId: "staff-lw", keyWorkerName: "Lisa Williams",
      date: "2026-04-08T14:00:00Z", duration: 55, sessionType: "one_to_one", status: "completed",
      topicsDiscussed: ["family contact", "school transition"],
      childVoiceIndicators: ["wishes_recorded", "feelings_expressed", "views_influenced_plan", "disagreement_noted"],
      relationshipIndicators: ["trust_building", "consistent_boundaries", "active_listening", "warmth_demonstrated", "trauma_informed"],
      goalsReviewed: [], goalsSet: [],
    },
    {
      id: "kw-s013", childId: "child-jordan", childName: "Jordan",
      keyWorkerId: "staff-lw", keyWorkerName: "Lisa Williams",
      date: "2026-04-22T10:00:00Z", duration: 50, sessionType: "review", status: "completed",
      topicsDiscussed: ["care plan update", "placement review"],
      childVoiceIndicators: ["wishes_recorded", "feelings_expressed", "views_influenced_plan", "advocacy_offered"],
      relationshipIndicators: ["active_listening", "child_led", "trauma_informed", "culturally_responsive", "warmth_demonstrated"],
      goalsReviewed: ["goal-005"], goalsSet: [],
    },
    {
      id: "kw-s014", childId: "child-jordan", childName: "Jordan",
      keyWorkerId: "staff-lw", keyWorkerName: "Lisa Williams",
      date: "2026-05-06T14:00:00Z", duration: 45, sessionType: "one_to_one", status: "completed",
      topicsDiscussed: ["friendships", "healthy relationships"],
      childVoiceIndicators: ["wishes_recorded", "feelings_expressed", "choices_offered"],
      relationshipIndicators: ["trust_building", "warmth_demonstrated", "active_listening", "culturally_responsive"],
      goalsReviewed: [], goalsSet: [],
    },
    {
      id: "kw-s015", childId: "child-jordan", childName: "Jordan",
      keyWorkerId: "staff-lw", keyWorkerName: "Lisa Williams",
      date: "2026-05-13T10:00:00Z", duration: 40, sessionType: "informal_check_in", status: "completed",
      topicsDiscussed: ["weekend", "hobbies"],
      childVoiceIndicators: ["wishes_recorded", "feelings_expressed"],
      relationshipIndicators: ["warmth_demonstrated", "child_led"],
      goalsReviewed: [], goalsSet: [],
    },

    // Morgan — Sarah Johnson
    {
      id: "kw-s016", childId: "child-morgan", childName: "Morgan",
      keyWorkerId: "staff-sj", keyWorkerName: "Sarah Johnson",
      date: "2026-03-06T14:00:00Z", duration: 40, sessionType: "one_to_one", status: "completed",
      topicsDiscussed: ["placement settling", "routines"],
      childVoiceIndicators: ["feelings_expressed"],
      relationshipIndicators: ["trust_building", "consistent_boundaries", "trauma_informed"],
      goalsReviewed: [], goalsSet: [],
    },
    {
      id: "kw-s017", childId: "child-morgan", childName: "Morgan",
      keyWorkerId: "staff-sj", keyWorkerName: "Sarah Johnson",
      date: "2026-03-15T10:00:00Z", duration: 30, sessionType: "crisis_support", status: "completed",
      topicsDiscussed: ["family conflict", "emotional regulation"],
      childVoiceIndicators: ["feelings_expressed", "wishes_recorded"],
      relationshipIndicators: ["trauma_informed", "active_listening", "warmth_demonstrated"],
      goalsReviewed: [], goalsSet: [],
    },
    {
      id: "kw-s018", childId: "child-morgan", childName: "Morgan",
      keyWorkerId: "staff-sj", keyWorkerName: "Sarah Johnson",
      date: "2026-03-22T14:00:00Z", duration: 0, sessionType: "one_to_one", status: "cancelled_by_child",
      topicsDiscussed: [], childVoiceIndicators: [], relationshipIndicators: [],
      goalsReviewed: [], goalsSet: [],
    },
    {
      id: "kw-s019", childId: "child-morgan", childName: "Morgan",
      keyWorkerId: "staff-sj", keyWorkerName: "Sarah Johnson",
      date: "2026-04-01T14:00:00Z", duration: 45, sessionType: "one_to_one", status: "completed",
      topicsDiscussed: ["anger management", "coping strategies"],
      childVoiceIndicators: ["feelings_expressed", "choices_offered"],
      relationshipIndicators: ["trauma_informed", "consistent_boundaries", "active_listening"],
      goalsReviewed: [], goalsSet: [],
    },
    {
      id: "kw-s020", childId: "child-morgan", childName: "Morgan",
      keyWorkerId: "staff-sj", keyWorkerName: "Sarah Johnson",
      date: "2026-04-10T10:00:00Z", duration: 35, sessionType: "crisis_support", status: "completed",
      topicsDiscussed: ["peer conflict", "safety planning"],
      childVoiceIndicators: ["feelings_expressed"],
      relationshipIndicators: ["trauma_informed", "active_listening", "consistent_boundaries"],
      goalsReviewed: [], goalsSet: [],
    },
    {
      id: "kw-s021", childId: "child-morgan", childName: "Morgan",
      keyWorkerId: "staff-sj", keyWorkerName: "Sarah Johnson",
      date: "2026-04-20T14:00:00Z", duration: 50, sessionType: "goal_setting", status: "completed",
      topicsDiscussed: ["independence goals", "education"],
      childVoiceIndicators: ["wishes_recorded", "feelings_expressed", "views_influenced_plan"],
      relationshipIndicators: ["active_listening", "child_led", "trauma_informed"],
      goalsReviewed: [], goalsSet: ["goal-009", "goal-010"],
    },
    {
      id: "kw-s022", childId: "child-morgan", childName: "Morgan",
      keyWorkerId: "staff-sj", keyWorkerName: "Sarah Johnson",
      date: "2026-05-01T14:00:00Z", duration: 0, sessionType: "one_to_one", status: "missed",
      topicsDiscussed: [], childVoiceIndicators: [], relationshipIndicators: [],
      goalsReviewed: [], goalsSet: [],
    },
    {
      id: "kw-s023", childId: "child-morgan", childName: "Morgan",
      keyWorkerId: "staff-sj", keyWorkerName: "Sarah Johnson",
      date: "2026-05-08T14:00:00Z", duration: 40, sessionType: "one_to_one", status: "completed",
      topicsDiscussed: ["progress check", "emotional wellbeing"],
      childVoiceIndicators: ["feelings_expressed", "wishes_recorded"],
      relationshipIndicators: ["trust_building", "warmth_demonstrated", "trauma_informed"],
      goalsReviewed: [], goalsSet: [],
    },
    {
      id: "kw-s024", childId: "child-morgan", childName: "Morgan",
      keyWorkerId: "staff-sj", keyWorkerName: "Sarah Johnson",
      date: "2026-05-15T10:00:00Z", duration: 30, sessionType: "crisis_support", status: "completed",
      topicsDiscussed: ["anxiety episode", "grounding techniques"],
      childVoiceIndicators: ["feelings_expressed"],
      relationshipIndicators: ["trauma_informed", "active_listening", "warmth_demonstrated"],
      goalsReviewed: [], goalsSet: [],
    },
  ];
}

function getDemoGoals(): KeyWorkerGoal[] {
  return [
    { id: "goal-001", childId: "child-alex", childName: "Alex", setBySession: "kw-s003",
      goalDescription: "Improve maths confidence", category: "educational", targetDate: "2026-06-30", status: "active" },
    { id: "goal-002", childId: "child-alex", childName: "Alex", setBySession: "kw-s003",
      goalDescription: "Join the football club", category: "social", targetDate: "2026-04-30", status: "achieved" },
    { id: "goal-003", childId: "child-alex", childName: "Alex", setBySession: "kw-s005",
      goalDescription: "Build confidence speaking in group settings", category: "emotional", targetDate: "2026-07-31", status: "active" },
    { id: "goal-004", childId: "child-alex", childName: "Alex", setBySession: "kw-s005",
      goalDescription: "Learn to cook three meals independently", category: "independence", targetDate: "2026-06-15", status: "partially_achieved" },
    { id: "goal-005", childId: "child-jordan", childName: "Jordan", setBySession: "kw-s011",
      goalDescription: "Develop peer friendships outside placement", category: "social", targetDate: "2026-05-31", status: "achieved" },
    { id: "goal-006", childId: "child-jordan", childName: "Jordan", setBySession: "kw-s011",
      goalDescription: "Explore cultural heritage through art", category: "emotional", targetDate: "2026-06-30", status: "active" },
    { id: "goal-007", childId: "child-jordan", childName: "Jordan", setBySession: "kw-s013",
      goalDescription: "Attend all scheduled health appointments", category: "health", targetDate: "2026-06-30", status: "achieved" },
    { id: "goal-008", childId: "child-jordan", childName: "Jordan", setBySession: "kw-s013",
      goalDescription: "Complete homework independently 4 days a week", category: "educational", targetDate: "2026-07-31", status: "active" },
    { id: "goal-009", childId: "child-morgan", childName: "Morgan", setBySession: "kw-s021",
      goalDescription: "Use coping strategies before escalation", category: "behavioural", targetDate: "2026-06-30", status: "partially_achieved" },
    { id: "goal-010", childId: "child-morgan", childName: "Morgan", setBySession: "kw-s021",
      goalDescription: "Attend college open day", category: "educational", targetDate: "2026-05-15", status: "not_achieved" },
    { id: "goal-011", childId: "child-morgan", childName: "Morgan", setBySession: "kw-s021",
      goalDescription: "Maintain consistent bedtime routine", category: "health", targetDate: "2026-05-31", status: "deferred",
      reviewNotes: "Deferred due to ongoing anxiety — reassess next month" },
    { id: "goal-012", childId: "child-morgan", childName: "Morgan", setBySession: "kw-s023",
      goalDescription: "Build one trusted peer relationship", category: "social", targetDate: "2026-07-31", status: "active" },
    { id: "goal-013", childId: "child-morgan", childName: "Morgan", setBySession: "kw-s023",
      goalDescription: "Learn to manage budget for personal items", category: "independence", targetDate: "2026-08-31", status: "active" },
  ];
}
