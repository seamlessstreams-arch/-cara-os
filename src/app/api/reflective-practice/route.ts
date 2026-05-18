// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Professional Development & Reflective Practice Intelligence API Route
//
// GET  → returns Oak House demo intelligence
// POST → accepts custom data for any home
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { generateReflectivePracticeIntelligence } from "@/lib/reflective-practice/reflective-practice-engine";
import type { ReflectiveActivity, PracticeDevelopmentGoal, StaffProfile } from "@/lib/reflective-practice/reflective-practice-engine";

// ── Oak House Demo Data ──────────────────────────────────────────────────────

function getDemoData(): {
  activities: ReflectiveActivity[];
  goals: PracticeDevelopmentGoal[];
  staff: StaffProfile[];
} {
  const staff: StaffProfile[] = [
    { staffId: "staff-sarah", staffName: "Sarah Johnson", role: "registered_manager", startDate: "2020-03-01" },
    { staffId: "staff-tom", staffName: "Tom Richards", role: "rsw", startDate: "2022-01-15" },
    { staffId: "staff-lisa", staffName: "Lisa Williams", role: "senior_rsw", startDate: "2021-06-01" },
    { staffId: "staff-darren", staffName: "Darren Laville", role: "registered_manager", startDate: "2018-01-10" },
  ];

  const activities: ReflectiveActivity[] = [
    // Sarah Johnson — RM, strong coaching/mentoring
    { id: "ra-s01", homeId: "oak-house", staffId: "staff-sarah", staffName: "Sarah Johnson", date: "2025-01-10", activityType: "supervision_reflection", practiceArea: "leadership", title: "Reflecting on team dynamics", description: "Explored team communication patterns in supervision.", durationMinutes: 60, learningOutcomes: ["new_insight", "practice_change"], sharedWithTeam: true, linkedToChildOutcome: false, evidenceRecorded: true },
    { id: "ra-s02", homeId: "oak-house", staffId: "staff-sarah", staffName: "Sarah Johnson", date: "2025-01-25", activityType: "coaching_session", practiceArea: "therapeutic_care", title: "Coaching Tom on therapeutic responses", description: "Coaching session with Tom on PACE model application.", durationMinutes: 45, learningOutcomes: ["skill_development", "shared_with_team"], sharedWithTeam: true, linkedToChildOutcome: true, linkedChildId: "child-alex", linkedChildName: "Alex", facilitatedBy: "Sarah Johnson", evidenceRecorded: true },
    { id: "ra-s03", homeId: "oak-house", staffId: "staff-sarah", staffName: "Sarah Johnson", date: "2025-02-08", activityType: "team_debrief", practiceArea: "behaviour_support", title: "Team debrief — challenging behaviour incident", description: "Whole team debrief after significant incident with Alex.", durationMinutes: 90, learningOutcomes: ["new_insight", "practice_change", "shared_with_team"], sharedWithTeam: true, linkedToChildOutcome: true, linkedChildId: "child-alex", linkedChildName: "Alex", facilitatedBy: "Sarah Johnson", evidenceRecorded: true },
    { id: "ra-s04", homeId: "oak-house", staffId: "staff-sarah", staffName: "Sarah Johnson", date: "2025-02-20", activityType: "reading_research", practiceArea: "trauma_informed", title: "Research on DDP approaches", description: "Reading latest research on Dyadic Developmental Psychotherapy.", durationMinutes: 120, learningOutcomes: ["new_insight"], sharedWithTeam: false, linkedToChildOutcome: false, evidenceRecorded: true },
    { id: "ra-s05", homeId: "oak-house", staffId: "staff-sarah", staffName: "Sarah Johnson", date: "2025-03-12", activityType: "case_discussion", practiceArea: "safeguarding", title: "Case discussion — online safety concerns", description: "Multi-agency case discussion re Morgan's online activity.", durationMinutes: 90, learningOutcomes: ["practice_change", "shared_with_team"], sharedWithTeam: true, linkedToChildOutcome: true, linkedChildId: "child-morgan", linkedChildName: "Morgan", evidenceRecorded: true },
    { id: "ra-s06", homeId: "oak-house", staffId: "staff-sarah", staffName: "Sarah Johnson", date: "2025-03-28", activityType: "mentoring", practiceArea: "leadership", title: "Mentoring Lisa — senior role development", description: "Supporting Lisa's development as senior RSW.", durationMinutes: 60, learningOutcomes: ["skill_development", "confidence_growth"], sharedWithTeam: false, linkedToChildOutcome: false, facilitatedBy: "Sarah Johnson", evidenceRecorded: true },
    { id: "ra-s07", homeId: "oak-house", staffId: "staff-sarah", staffName: "Sarah Johnson", date: "2025-04-15", activityType: "practice_audit", practiceArea: "recording", title: "Practice audit — recording quality", description: "Audited team recording quality against standards.", durationMinutes: 120, learningOutcomes: ["practice_change", "shared_with_team"], sharedWithTeam: true, linkedToChildOutcome: false, evidenceRecorded: true },
    { id: "ra-s08", homeId: "oak-house", staffId: "staff-sarah", staffName: "Sarah Johnson", date: "2025-05-05", activityType: "external_conference", practiceArea: "therapeutic_care", title: "NRCN Residential Care Conference", description: "Attended national conference on therapeutic residential care.", durationMinutes: 360, learningOutcomes: ["new_insight", "skill_development", "shared_with_team"], sharedWithTeam: true, linkedToChildOutcome: false, evidenceRecorded: true },
    { id: "ra-s09", homeId: "oak-house", staffId: "staff-sarah", staffName: "Sarah Johnson", date: "2025-05-20", activityType: "team_debrief", practiceArea: "attachment", title: "Team debrief — attachment and transitions", description: "Debrief on supporting Jordan through placement transition.", durationMinutes: 60, learningOutcomes: ["new_insight", "practice_change"], sharedWithTeam: true, linkedToChildOutcome: true, linkedChildId: "child-jordan", linkedChildName: "Jordan", evidenceRecorded: true },
    { id: "ra-s10", homeId: "oak-house", staffId: "staff-sarah", staffName: "Sarah Johnson", date: "2025-06-10", activityType: "reflective_journal", practiceArea: "leadership", title: "Reflective journal — leadership under pressure", description: "Reflecting on Ofsted preparation and team support.", durationMinutes: 45, learningOutcomes: ["new_insight", "confidence_growth"], sharedWithTeam: false, linkedToChildOutcome: false, evidenceRecorded: true },

    // Tom Richards — RSW, fewer activities
    { id: "ra-t01", homeId: "oak-house", staffId: "staff-tom", staffName: "Tom Richards", date: "2025-01-20", activityType: "supervision_reflection", practiceArea: "behaviour_support", title: "Reflecting on de-escalation", description: "Discussed de-escalation techniques in supervision.", durationMinutes: 30, learningOutcomes: ["new_insight"], sharedWithTeam: false, linkedToChildOutcome: false, evidenceRecorded: true },
    { id: "ra-t02", homeId: "oak-house", staffId: "staff-tom", staffName: "Tom Richards", date: "2025-02-08", activityType: "team_debrief", practiceArea: "behaviour_support", title: "Team debrief — challenging behaviour incident", description: "Participated in team debrief after incident.", durationMinutes: 90, learningOutcomes: ["new_insight", "shared_with_team"], sharedWithTeam: true, linkedToChildOutcome: true, linkedChildId: "child-alex", linkedChildName: "Alex", evidenceRecorded: true },
    { id: "ra-t03", homeId: "oak-house", staffId: "staff-tom", staffName: "Tom Richards", date: "2025-03-15", activityType: "peer_observation", practiceArea: "communication", title: "Observed Lisa's key-work session", description: "Observed Lisa running a key-work session with Jordan.", durationMinutes: 60, learningOutcomes: ["new_insight", "skill_development"], sharedWithTeam: false, linkedToChildOutcome: true, linkedChildId: "child-jordan", linkedChildName: "Jordan", evidenceRecorded: true },
    { id: "ra-t04", homeId: "oak-house", staffId: "staff-tom", staffName: "Tom Richards", date: "2025-04-10", activityType: "practice_workshop", practiceArea: "therapeutic_care", title: "PACE workshop — practical application", description: "In-house workshop on applying PACE with children.", durationMinutes: 120, learningOutcomes: ["skill_development", "practice_change"], sharedWithTeam: true, linkedToChildOutcome: false, facilitatedBy: "Sarah Johnson", evidenceRecorded: true },
    { id: "ra-t05", homeId: "oak-house", staffId: "staff-tom", staffName: "Tom Richards", date: "2025-05-20", activityType: "team_debrief", practiceArea: "attachment", title: "Team debrief — attachment and transitions", description: "Participated in debrief on Jordan's transition.", durationMinutes: 60, learningOutcomes: ["new_insight"], sharedWithTeam: true, linkedToChildOutcome: true, linkedChildId: "child-jordan", linkedChildName: "Jordan", evidenceRecorded: true },

    // Lisa Williams — Senior RSW, highly engaged
    { id: "ra-l01", homeId: "oak-house", staffId: "staff-lisa", staffName: "Lisa Williams", date: "2025-01-08", activityType: "reflective_journal", practiceArea: "therapeutic_care", title: "Reflective journal — PACE in practice", description: "Reflecting on using PACE model with Alex this week.", durationMinutes: 30, learningOutcomes: ["new_insight", "practice_change"], sharedWithTeam: false, linkedToChildOutcome: true, linkedChildId: "child-alex", linkedChildName: "Alex", evidenceRecorded: true },
    { id: "ra-l02", homeId: "oak-house", staffId: "staff-lisa", staffName: "Lisa Williams", date: "2025-01-22", activityType: "case_discussion", practiceArea: "risk_assessment", title: "Case discussion — risk assessment approaches", description: "Team case discussion on dynamic risk assessment.", durationMinutes: 60, learningOutcomes: ["practice_change", "shared_with_team"], sharedWithTeam: true, linkedToChildOutcome: true, linkedChildId: "child-morgan", linkedChildName: "Morgan", evidenceRecorded: true },
    { id: "ra-l03", homeId: "oak-house", staffId: "staff-lisa", staffName: "Lisa Williams", date: "2025-02-05", activityType: "supervision_reflection", practiceArea: "attachment", title: "Supervision — attachment patterns", description: "Explored attachment patterns in supervision.", durationMinutes: 60, learningOutcomes: ["new_insight", "skill_development"], sharedWithTeam: false, linkedToChildOutcome: true, linkedChildId: "child-jordan", linkedChildName: "Jordan", evidenceRecorded: true },
    { id: "ra-l04", homeId: "oak-house", staffId: "staff-lisa", staffName: "Lisa Williams", date: "2025-02-08", activityType: "team_debrief", practiceArea: "behaviour_support", title: "Team debrief — challenging behaviour incident", description: "Participated in whole team debrief.", durationMinutes: 90, learningOutcomes: ["new_insight", "practice_change", "shared_with_team"], sharedWithTeam: true, linkedToChildOutcome: true, linkedChildId: "child-alex", linkedChildName: "Alex", evidenceRecorded: true },
    { id: "ra-l05", homeId: "oak-house", staffId: "staff-lisa", staffName: "Lisa Williams", date: "2025-02-25", activityType: "reading_research", practiceArea: "participation", title: "Research — children's voice in care planning", description: "Reading about participation approaches for LAC.", durationMinutes: 90, learningOutcomes: ["new_insight", "practice_change"], sharedWithTeam: true, linkedToChildOutcome: false, evidenceRecorded: true },
    { id: "ra-l06", homeId: "oak-house", staffId: "staff-lisa", staffName: "Lisa Williams", date: "2025-03-12", activityType: "case_discussion", practiceArea: "safeguarding", title: "Case discussion — online safety concerns", description: "Participated in multi-agency case discussion.", durationMinutes: 90, learningOutcomes: ["new_insight", "shared_with_team"], sharedWithTeam: true, linkedToChildOutcome: true, linkedChildId: "child-morgan", linkedChildName: "Morgan", evidenceRecorded: true },
    { id: "ra-l07", homeId: "oak-house", staffId: "staff-lisa", staffName: "Lisa Williams", date: "2025-03-28", activityType: "peer_observation", practiceArea: "communication", title: "Peer observation by Tom", description: "Tom observed my key-work session — feedback session.", durationMinutes: 45, learningOutcomes: ["confidence_growth", "shared_with_team"], sharedWithTeam: true, linkedToChildOutcome: true, linkedChildId: "child-jordan", linkedChildName: "Jordan", evidenceRecorded: true },
    { id: "ra-l08", homeId: "oak-house", staffId: "staff-lisa", staffName: "Lisa Williams", date: "2025-04-10", activityType: "practice_workshop", practiceArea: "therapeutic_care", title: "PACE workshop — practical application", description: "Participated in PACE workshop facilitated by Sarah.", durationMinutes: 120, learningOutcomes: ["skill_development", "practice_change", "shared_with_team"], sharedWithTeam: true, linkedToChildOutcome: false, facilitatedBy: "Sarah Johnson", evidenceRecorded: true },
    { id: "ra-l09", homeId: "oak-house", staffId: "staff-lisa", staffName: "Lisa Williams", date: "2025-04-28", activityType: "action_learning_set", practiceArea: "equality_diversity", title: "Action learning — cultural competence", description: "Cross-home action learning set on cultural awareness.", durationMinutes: 120, learningOutcomes: ["new_insight", "practice_change", "skill_development"], sharedWithTeam: true, linkedToChildOutcome: false, evidenceRecorded: true },
    { id: "ra-l10", homeId: "oak-house", staffId: "staff-lisa", staffName: "Lisa Williams", date: "2025-05-12", activityType: "reflective_journal", practiceArea: "attachment", title: "Reflective journal — building trust with Jordan", description: "Reflecting on progress building therapeutic relationship.", durationMinutes: 30, learningOutcomes: ["new_insight", "confidence_growth"], sharedWithTeam: false, linkedToChildOutcome: true, linkedChildId: "child-jordan", linkedChildName: "Jordan", evidenceRecorded: true },
    { id: "ra-l11", homeId: "oak-house", staffId: "staff-lisa", staffName: "Lisa Williams", date: "2025-05-20", activityType: "team_debrief", practiceArea: "attachment", title: "Team debrief — attachment and transitions", description: "Participated in debrief on transition planning.", durationMinutes: 60, learningOutcomes: ["new_insight", "practice_change"], sharedWithTeam: true, linkedToChildOutcome: true, linkedChildId: "child-jordan", linkedChildName: "Jordan", evidenceRecorded: true },
    { id: "ra-l12", homeId: "oak-house", staffId: "staff-lisa", staffName: "Lisa Williams", date: "2025-06-05", activityType: "mentoring", practiceArea: "leadership", title: "Mentoring session with Sarah", description: "Developing leadership skills with Sarah's mentoring.", durationMinutes: 60, learningOutcomes: ["skill_development", "confidence_growth"], sharedWithTeam: false, linkedToChildOutcome: false, facilitatedBy: "Sarah Johnson", evidenceRecorded: true },

    // Darren Laville — RM, strategic reflective practice
    { id: "ra-d01", homeId: "oak-house", staffId: "staff-darren", staffName: "Darren Laville", date: "2025-01-15", activityType: "coaching_session", practiceArea: "leadership", title: "Coaching Sarah — Ofsted readiness", description: "Coaching Sarah on Ofsted preparation and self-evaluation.", durationMinutes: 60, learningOutcomes: ["skill_development", "shared_with_team"], sharedWithTeam: true, linkedToChildOutcome: false, facilitatedBy: "Darren Laville", evidenceRecorded: true },
    { id: "ra-d02", homeId: "oak-house", staffId: "staff-darren", staffName: "Darren Laville", date: "2025-01-30", activityType: "practice_audit", practiceArea: "safeguarding", title: "Safeguarding practice audit", description: "Quarterly safeguarding audit with team review.", durationMinutes: 180, learningOutcomes: ["practice_change", "shared_with_team"], sharedWithTeam: true, linkedToChildOutcome: false, evidenceRecorded: true },
    { id: "ra-d03", homeId: "oak-house", staffId: "staff-darren", staffName: "Darren Laville", date: "2025-02-08", activityType: "team_debrief", practiceArea: "behaviour_support", title: "Team debrief — challenging behaviour incident", description: "Joined team debrief and contributed strategic perspective.", durationMinutes: 90, learningOutcomes: ["new_insight", "shared_with_team"], sharedWithTeam: true, linkedToChildOutcome: true, linkedChildId: "child-alex", linkedChildName: "Alex", evidenceRecorded: true },
    { id: "ra-d04", homeId: "oak-house", staffId: "staff-darren", staffName: "Darren Laville", date: "2025-02-28", activityType: "external_conference", practiceArea: "legislation", title: "Regulation 44/45 conference", description: "Conference on regulatory inspection and independent visitor roles.", durationMinutes: 300, learningOutcomes: ["new_insight", "skill_development"], sharedWithTeam: true, linkedToChildOutcome: false, evidenceRecorded: true },
    { id: "ra-d05", homeId: "oak-house", staffId: "staff-darren", staffName: "Darren Laville", date: "2025-03-12", activityType: "case_discussion", practiceArea: "safeguarding", title: "Case discussion — online safety concerns", description: "Contributed to multi-agency case discussion.", durationMinutes: 90, learningOutcomes: ["practice_change", "shared_with_team"], sharedWithTeam: true, linkedToChildOutcome: true, linkedChildId: "child-morgan", linkedChildName: "Morgan", evidenceRecorded: true },
    { id: "ra-d06", homeId: "oak-house", staffId: "staff-darren", staffName: "Darren Laville", date: "2025-04-05", activityType: "mentoring", practiceArea: "leadership", title: "Mentoring — RI peer group", description: "Responsible Individual peer mentoring session.", durationMinutes: 60, learningOutcomes: ["new_insight", "confidence_growth"], sharedWithTeam: false, linkedToChildOutcome: false, evidenceRecorded: true },
    { id: "ra-d07", homeId: "oak-house", staffId: "staff-darren", staffName: "Darren Laville", date: "2025-04-20", activityType: "reading_research", practiceArea: "trauma_informed", title: "Research — trauma-informed systems", description: "Reading on whole-system trauma-informed approaches.", durationMinutes: 90, learningOutcomes: ["new_insight", "practice_change"], sharedWithTeam: true, linkedToChildOutcome: false, evidenceRecorded: true },
    { id: "ra-d08", homeId: "oak-house", staffId: "staff-darren", staffName: "Darren Laville", date: "2025-05-10", activityType: "supervision_reflection", practiceArea: "therapeutic_care", title: "Reflective supervision with Sarah", description: "Joint reflective supervision on therapeutic model.", durationMinutes: 60, learningOutcomes: ["new_insight", "practice_change", "shared_with_team"], sharedWithTeam: true, linkedToChildOutcome: true, linkedChildId: "child-alex", linkedChildName: "Alex", evidenceRecorded: true },
    { id: "ra-d09", homeId: "oak-house", staffId: "staff-darren", staffName: "Darren Laville", date: "2025-05-20", activityType: "team_debrief", practiceArea: "attachment", title: "Team debrief — attachment and transitions", description: "Led team debrief on attachment and transition planning.", durationMinutes: 60, learningOutcomes: ["new_insight", "practice_change"], sharedWithTeam: true, linkedToChildOutcome: true, linkedChildId: "child-jordan", linkedChildName: "Jordan", facilitatedBy: "Darren Laville", evidenceRecorded: true },
    { id: "ra-d10", homeId: "oak-house", staffId: "staff-darren", staffName: "Darren Laville", date: "2025-06-08", activityType: "action_learning_set", practiceArea: "leadership", title: "Action learning — leadership resilience", description: "Cross-organisation action learning set for RMs.", durationMinutes: 120, learningOutcomes: ["new_insight", "skill_development", "shared_with_team"], sharedWithTeam: true, linkedToChildOutcome: false, evidenceRecorded: true },
  ];

  const goals: PracticeDevelopmentGoal[] = [
    { id: "goal-s01", staffId: "staff-sarah", staffName: "Sarah Johnson", goalDescription: "Develop coaching skills to support team reflective practice", practiceArea: "leadership", targetDate: "2025-06-30", status: "achieved", achievedDate: "2025-05-15", reviewDate: "2025-03-15" },
    { id: "goal-s02", staffId: "staff-sarah", staffName: "Sarah Johnson", goalDescription: "Complete DDP foundation training to enhance therapeutic model", practiceArea: "therapeutic_care", targetDate: "2025-09-30", status: "in_progress", reviewDate: "2025-06-15" },
    { id: "goal-t01", staffId: "staff-tom", staffName: "Tom Richards", goalDescription: "Improve confidence in managing challenging behaviour independently", practiceArea: "behaviour_support", targetDate: "2025-06-30", status: "in_progress", reviewDate: "2025-03-20" },
    { id: "goal-t02", staffId: "staff-tom", staffName: "Tom Richards", goalDescription: "Begin regular reflective journaling (at least monthly)", practiceArea: "general", targetDate: "2025-03-31", status: "not_started", reviewDate: "2025-01-20" },
    { id: "goal-l01", staffId: "staff-lisa", staffName: "Lisa Williams", goalDescription: "Develop advanced attachment-based practice skills", practiceArea: "attachment", targetDate: "2025-06-30", status: "achieved", achievedDate: "2025-06-01", reviewDate: "2025-04-01" },
    { id: "goal-l02", staffId: "staff-lisa", staffName: "Lisa Williams", goalDescription: "Build leadership skills for senior RSW role", practiceArea: "leadership", targetDate: "2025-09-30", status: "in_progress", reviewDate: "2025-06-01" },
    { id: "goal-l03", staffId: "staff-lisa", staffName: "Lisa Williams", goalDescription: "Lead at least one team practice session per quarter", practiceArea: "general", targetDate: "2025-12-31", status: "in_progress", reviewDate: "2025-06-15" },
    { id: "goal-d01", staffId: "staff-darren", staffName: "Darren Laville", goalDescription: "Implement whole-home trauma-informed approach", practiceArea: "trauma_informed", targetDate: "2025-09-30", status: "in_progress", reviewDate: "2025-06-10" },
    { id: "goal-d02", staffId: "staff-darren", staffName: "Darren Laville", goalDescription: "Establish RI peer support network across homes", practiceArea: "leadership", targetDate: "2025-06-30", status: "achieved", achievedDate: "2025-04-20", reviewDate: "2025-03-01" },
    { id: "goal-d03", staffId: "staff-darren", staffName: "Darren Laville", goalDescription: "Strengthen Regulation 44/45 audit processes", practiceArea: "legislation", targetDate: "2025-04-30", status: "achieved", achievedDate: "2025-04-15", reviewDate: "2025-02-28" },
  ];

  return { activities, goals, staff };
}

// ── GET Handler ──────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const { activities, goals, staff } = getDemoData();
    const result = generateReflectivePracticeIntelligence(
      activities, goals, staff,
      "oak-house",
      "2025-01-01",
      "2025-06-30",
      new Date().toISOString().split("T")[0],
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate reflective practice intelligence", details: String(error) },
      { status: 500 },
    );
  }
}

// ── POST Handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { activities, goals, staff, homeId, periodStart, periodEnd, referenceDate } = body;

    if (!activities || !goals || !staff || !homeId || !periodStart || !periodEnd || !referenceDate) {
      return NextResponse.json(
        { error: "Missing required fields: activities, goals, staff, homeId, periodStart, periodEnd, referenceDate" },
        { status: 400 },
      );
    }

    if (!Array.isArray(activities) || !Array.isArray(goals) || !Array.isArray(staff)) {
      return NextResponse.json(
        { error: "activities, goals, and staff must be arrays" },
        { status: 400 },
      );
    }

    const result = generateReflectivePracticeIntelligence(
      activities, goals, staff,
      homeId, periodStart, periodEnd, referenceDate,
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process reflective practice data", details: String(error) },
      { status: 500 },
    );
  }
}
