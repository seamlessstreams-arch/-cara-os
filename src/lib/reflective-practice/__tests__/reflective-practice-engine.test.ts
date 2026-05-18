// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Professional Development & Reflective Practice Intelligence — Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateReflectiveEngagement,
  evaluateLearningOutcomes,
  evaluateTeamLearning,
  evaluateGoalProgress,
  buildStaffDevelopmentProfiles,
  generateReflectivePracticeIntelligence,
  getActivityTypeLabel,
  getPracticeAreaLabel,
  getTeamActivityTypes,
} from "../reflective-practice-engine";
import type {
  ReflectiveActivity,
  PracticeDevelopmentGoal,
  StaffProfile,
} from "../reflective-practice-engine";

// ── Test Constants ───────────────────────────────────────────────────────────

const PERIOD_START = "2025-01-01";
const PERIOD_END = "2025-06-30";
const REFERENCE_DATE = "2025-06-15";

// ── Oak House Demo Data ──────────────────────────────────────────────────────
// Staff: Sarah Johnson (RM), Tom Richards (RSW), Lisa Williams (Senior RSW), Darren Laville (RM)
// Sarah and Darren as managers have more coaching/mentoring.
// Tom has fewer activities (area for development).
// Lisa is highly engaged.

const demoStaff: StaffProfile[] = [
  { staffId: "staff-sarah", staffName: "Sarah Johnson", role: "registered_manager", startDate: "2020-03-01" },
  { staffId: "staff-tom", staffName: "Tom Richards", role: "rsw", startDate: "2022-01-15" },
  { staffId: "staff-lisa", staffName: "Lisa Williams", role: "senior_rsw", startDate: "2021-06-01" },
  { staffId: "staff-darren", staffName: "Darren Laville", role: "registered_manager", startDate: "2018-01-10" },
];

const demoActivities: ReflectiveActivity[] = [
  // ── Sarah Johnson — RM, strong coaching/mentoring, reflective leader ───
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

  // ── Tom Richards — RSW, fewer activities (area for development) ─────────
  { id: "ra-t01", homeId: "oak-house", staffId: "staff-tom", staffName: "Tom Richards", date: "2025-01-20", activityType: "supervision_reflection", practiceArea: "behaviour_support", title: "Reflecting on de-escalation", description: "Discussed de-escalation techniques in supervision.", durationMinutes: 30, learningOutcomes: ["new_insight"], sharedWithTeam: false, linkedToChildOutcome: false, evidenceRecorded: true },
  { id: "ra-t02", homeId: "oak-house", staffId: "staff-tom", staffName: "Tom Richards", date: "2025-02-08", activityType: "team_debrief", practiceArea: "behaviour_support", title: "Team debrief — challenging behaviour incident", description: "Participated in team debrief after incident.", durationMinutes: 90, learningOutcomes: ["new_insight", "shared_with_team"], sharedWithTeam: true, linkedToChildOutcome: true, linkedChildId: "child-alex", linkedChildName: "Alex", evidenceRecorded: true },
  { id: "ra-t03", homeId: "oak-house", staffId: "staff-tom", staffName: "Tom Richards", date: "2025-03-15", activityType: "peer_observation", practiceArea: "communication", title: "Observed Lisa's key-work session", description: "Observed Lisa running a key-work session with Jordan.", durationMinutes: 60, learningOutcomes: ["new_insight", "skill_development"], sharedWithTeam: false, linkedToChildOutcome: true, linkedChildId: "child-jordan", linkedChildName: "Jordan", evidenceRecorded: true },
  { id: "ra-t04", homeId: "oak-house", staffId: "staff-tom", staffName: "Tom Richards", date: "2025-04-10", activityType: "practice_workshop", practiceArea: "therapeutic_care", title: "PACE workshop — practical application", description: "In-house workshop on applying PACE with children.", durationMinutes: 120, learningOutcomes: ["skill_development", "practice_change"], sharedWithTeam: true, linkedToChildOutcome: false, facilitatedBy: "Sarah Johnson", evidenceRecorded: true },
  { id: "ra-t05", homeId: "oak-house", staffId: "staff-tom", staffName: "Tom Richards", date: "2025-05-20", activityType: "team_debrief", practiceArea: "attachment", title: "Team debrief — attachment and transitions", description: "Participated in debrief on Jordan's transition.", durationMinutes: 60, learningOutcomes: ["new_insight"], sharedWithTeam: true, linkedToChildOutcome: true, linkedChildId: "child-jordan", linkedChildName: "Jordan", evidenceRecorded: true },

  // ── Lisa Williams — Senior RSW, highly engaged ─────────────────────────
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

  // ── Darren Laville — RM, strategic reflective practice ──────────────────
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

const demoGoals: PracticeDevelopmentGoal[] = [
  // Sarah
  { id: "goal-s01", staffId: "staff-sarah", staffName: "Sarah Johnson", goalDescription: "Develop coaching skills to support team reflective practice", practiceArea: "leadership", targetDate: "2025-06-30", status: "achieved", achievedDate: "2025-05-15", reviewDate: "2025-03-15" },
  { id: "goal-s02", staffId: "staff-sarah", staffName: "Sarah Johnson", goalDescription: "Complete DDP foundation training to enhance therapeutic model", practiceArea: "therapeutic_care", targetDate: "2025-09-30", status: "in_progress", reviewDate: "2025-06-15" },

  // Tom
  { id: "goal-t01", staffId: "staff-tom", staffName: "Tom Richards", goalDescription: "Improve confidence in managing challenging behaviour independently", practiceArea: "behaviour_support", targetDate: "2025-06-30", status: "in_progress", reviewDate: "2025-03-20" },
  { id: "goal-t02", staffId: "staff-tom", staffName: "Tom Richards", goalDescription: "Begin regular reflective journaling (at least monthly)", practiceArea: "general", targetDate: "2025-03-31", status: "not_started", reviewDate: "2025-01-20" },

  // Lisa
  { id: "goal-l01", staffId: "staff-lisa", staffName: "Lisa Williams", goalDescription: "Develop advanced attachment-based practice skills", practiceArea: "attachment", targetDate: "2025-06-30", status: "achieved", achievedDate: "2025-06-01", reviewDate: "2025-04-01" },
  { id: "goal-l02", staffId: "staff-lisa", staffName: "Lisa Williams", goalDescription: "Build leadership skills for senior RSW role", practiceArea: "leadership", targetDate: "2025-09-30", status: "in_progress", reviewDate: "2025-06-01" },
  { id: "goal-l03", staffId: "staff-lisa", staffName: "Lisa Williams", goalDescription: "Lead at least one team practice session per quarter", practiceArea: "general", targetDate: "2025-12-31", status: "in_progress", reviewDate: "2025-06-15" },

  // Darren
  { id: "goal-d01", staffId: "staff-darren", staffName: "Darren Laville", goalDescription: "Implement whole-home trauma-informed approach", practiceArea: "trauma_informed", targetDate: "2025-09-30", status: "in_progress", reviewDate: "2025-06-10" },
  { id: "goal-d02", staffId: "staff-darren", staffName: "Darren Laville", goalDescription: "Establish RI peer support network across homes", practiceArea: "leadership", targetDate: "2025-06-30", status: "achieved", achievedDate: "2025-04-20", reviewDate: "2025-03-01" },
  { id: "goal-d03", staffId: "staff-darren", staffName: "Darren Laville", goalDescription: "Strengthen Regulation 44/45 audit processes", practiceArea: "legislation", targetDate: "2025-04-30", status: "achieved", achievedDate: "2025-04-15", reviewDate: "2025-02-28" },
];


// ══════════════════════════════════════════════════════════════════════════════
// TESTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Reflective Practice — evaluateReflectiveEngagement", () => {
  it("counts total activities in period", () => {
    const result = evaluateReflectiveEngagement(demoActivities, demoStaff, PERIOD_START, PERIOD_END);
    // Total activities: Sarah(10) + Tom(5) + Lisa(12) + Darren(10) = 37
    expect(result.totalActivities).toBe(37);
  });

  it("calculates activities per staff", () => {
    const result = evaluateReflectiveEngagement(demoActivities, demoStaff, PERIOD_START, PERIOD_END);
    // 37 / 4 = 9.25 → 9.3
    expect(result.activitiesPerStaff).toBe(9.3);
  });

  it("identifies staff with zero activities", () => {
    const result = evaluateReflectiveEngagement(demoActivities, demoStaff, PERIOD_START, PERIOD_END);
    expect(result.staffWithZeroActivities).toEqual([]);
  });

  it("identifies staff with zero activities when they exist", () => {
    const extraStaff: StaffProfile[] = [
      ...demoStaff,
      { staffId: "staff-newbie", staffName: "New Worker", role: "rsw", startDate: "2025-05-01" },
    ];
    const result = evaluateReflectiveEngagement(demoActivities, extraStaff, PERIOD_START, PERIOD_END);
    expect(result.staffWithZeroActivities).toContain("New Worker");
  });

  it("calculates total hours", () => {
    const result = evaluateReflectiveEngagement(demoActivities, demoStaff, PERIOD_START, PERIOD_END);
    // Sum all durationMinutes / 60
    expect(result.totalHours).toBeGreaterThan(0);
  });

  it("calculates average hours per staff", () => {
    const result = evaluateReflectiveEngagement(demoActivities, demoStaff, PERIOD_START, PERIOD_END);
    expect(result.avgHoursPerStaff).toBeGreaterThan(0);
    // avgHoursPerStaff = totalHours / 4
    expect(result.avgHoursPerStaff).toBe(Math.round((result.totalHours / 4) * 10) / 10);
  });

  it("builds activity type distribution", () => {
    const result = evaluateReflectiveEngagement(demoActivities, demoStaff, PERIOD_START, PERIOD_END);
    expect(result.activityTypeDistribution).toHaveProperty("team_debrief");
    expect(result.activityTypeDistribution).toHaveProperty("supervision_reflection");
    expect(result.activityTypeDistribution).toHaveProperty("case_discussion");
  });

  it("builds practice area distribution", () => {
    const result = evaluateReflectiveEngagement(demoActivities, demoStaff, PERIOD_START, PERIOD_END);
    expect(result.practiceAreaDistribution).toHaveProperty("leadership");
    expect(result.practiceAreaDistribution).toHaveProperty("behaviour_support");
    expect(result.practiceAreaDistribution).toHaveProperty("therapeutic_care");
  });

  it("calculates engagement rate", () => {
    const result = evaluateReflectiveEngagement(demoActivities, demoStaff, PERIOD_START, PERIOD_END);
    // All 4 staff have activities. Period is Jan-Jun = 5 calendar months.
    // Staff with >= 5 activities: Sarah(10), Tom(5), Lisa(12), Darren(10) = 4/4 = 100%
    expect(result.engagementRate).toBe(100);
  });

  it("handles empty activities", () => {
    const result = evaluateReflectiveEngagement([], demoStaff, PERIOD_START, PERIOD_END);
    expect(result.totalActivities).toBe(0);
    expect(result.activitiesPerStaff).toBe(0);
    expect(result.staffWithZeroActivities.length).toBe(4);
    expect(result.engagementRate).toBe(0);
  });

  it("handles empty staff", () => {
    const result = evaluateReflectiveEngagement(demoActivities, [], PERIOD_START, PERIOD_END);
    expect(result.activitiesPerStaff).toBe(0);
    expect(result.avgHoursPerStaff).toBe(0);
    expect(result.engagementRate).toBe(0);
  });

  it("excludes activities outside period", () => {
    const outOfPeriod: ReflectiveActivity[] = [
      { ...demoActivities[0], id: "out-1", date: "2024-12-15" },
      { ...demoActivities[0], id: "out-2", date: "2025-07-15" },
    ];
    const result = evaluateReflectiveEngagement(outOfPeriod, demoStaff, PERIOD_START, PERIOD_END);
    expect(result.totalActivities).toBe(0);
  });
});

describe("Reflective Practice — evaluateLearningOutcomes", () => {
  it("counts total outcomes", () => {
    const result = evaluateLearningOutcomes(demoActivities, PERIOD_START, PERIOD_END);
    expect(result.totalOutcomes).toBeGreaterThan(0);
  });

  it("calculates practice change rate", () => {
    const result = evaluateLearningOutcomes(demoActivities, PERIOD_START, PERIOD_END);
    // Many activities have practice_change outcome
    expect(result.practiceChangeRate).toBeGreaterThan(0);
    expect(result.practiceChangeRate).toBeLessThanOrEqual(100);
  });

  it("calculates skill development rate", () => {
    const result = evaluateLearningOutcomes(demoActivities, PERIOD_START, PERIOD_END);
    expect(result.skillDevelopmentRate).toBeGreaterThan(0);
  });

  it("calculates shared with team rate", () => {
    const result = evaluateLearningOutcomes(demoActivities, PERIOD_START, PERIOD_END);
    // Most activities are shared
    expect(result.sharedWithTeamRate).toBeGreaterThan(50);
  });

  it("calculates linked to child outcome rate", () => {
    const result = evaluateLearningOutcomes(demoActivities, PERIOD_START, PERIOD_END);
    expect(result.linkedToChildOutcomeRate).toBeGreaterThan(0);
  });

  it("calculates no outcome rate", () => {
    const result = evaluateLearningOutcomes(demoActivities, PERIOD_START, PERIOD_END);
    // None of our demo data has no_clear_outcome
    expect(result.noOutcomeRate).toBe(0);
  });

  it("returns 100% when all activities have practice_change", () => {
    const allChange: ReflectiveActivity[] = [
      { ...demoActivities[0], id: "pc-1", learningOutcomes: ["practice_change"] },
      { ...demoActivities[0], id: "pc-2", learningOutcomes: ["practice_change"] },
    ];
    const result = evaluateLearningOutcomes(allChange, PERIOD_START, PERIOD_END);
    expect(result.practiceChangeRate).toBe(100);
  });

  it("handles empty activities", () => {
    const result = evaluateLearningOutcomes([], PERIOD_START, PERIOD_END);
    expect(result.totalOutcomes).toBe(0);
    expect(result.practiceChangeRate).toBe(0);
    expect(result.sharedWithTeamRate).toBe(0);
  });

  it("correctly handles no_clear_outcome", () => {
    const noOutcome: ReflectiveActivity[] = [
      { ...demoActivities[0], id: "no-1", learningOutcomes: ["no_clear_outcome"], sharedWithTeam: false, linkedToChildOutcome: false },
      { ...demoActivities[0], id: "no-2", learningOutcomes: ["no_clear_outcome"], sharedWithTeam: false, linkedToChildOutcome: false },
      { ...demoActivities[0], id: "no-3", learningOutcomes: ["practice_change"], sharedWithTeam: true, linkedToChildOutcome: true },
    ];
    const result = evaluateLearningOutcomes(noOutcome, PERIOD_START, PERIOD_END);
    expect(result.noOutcomeRate).toBe(67); // 2/3
    expect(result.practiceChangeRate).toBe(33); // 1/3
  });
});

describe("Reflective Practice — evaluateTeamLearning", () => {
  it("identifies team activities", () => {
    const result = evaluateTeamLearning(demoActivities, PERIOD_START, PERIOD_END);
    // Team types: team_debrief, case_discussion, practice_workshop, action_learning_set
    expect(result.totalTeamSessions).toBeGreaterThan(0);
  });

  it("only includes team activity types", () => {
    const result = evaluateTeamLearning(demoActivities, PERIOD_START, PERIOD_END);
    const teamTypes = new Set(["team_debrief", "case_discussion", "practice_workshop", "action_learning_set"]);
    for (const a of result.teamActivities) {
      expect(teamTypes.has(a.activityType)).toBe(true);
    }
  });

  it("calculates average attendance", () => {
    const result = evaluateTeamLearning(demoActivities, PERIOD_START, PERIOD_END);
    // Team debriefs on 2025-02-08 have 4 staff, etc.
    expect(result.avgAttendance).toBeGreaterThan(1);
  });

  it("identifies top team topics", () => {
    const result = evaluateTeamLearning(demoActivities, PERIOD_START, PERIOD_END);
    expect(result.topTeamTopics.length).toBeGreaterThan(0);
    // Topics are sorted by count descending
    if (result.topTeamTopics.length > 1) {
      expect(result.topTeamTopics[0].count).toBeGreaterThanOrEqual(result.topTeamTopics[1].count);
    }
  });

  it("calculates shared learning rate across all activities", () => {
    const result = evaluateTeamLearning(demoActivities, PERIOD_START, PERIOD_END);
    expect(result.sharedLearningRate).toBeGreaterThan(0);
    expect(result.sharedLearningRate).toBeLessThanOrEqual(100);
  });

  it("handles no team activities", () => {
    const soloOnly: ReflectiveActivity[] = [
      { ...demoActivities[0], id: "solo-1", activityType: "reflective_journal" },
      { ...demoActivities[0], id: "solo-2", activityType: "reading_research" },
    ];
    const result = evaluateTeamLearning(soloOnly, PERIOD_START, PERIOD_END);
    expect(result.totalTeamSessions).toBe(0);
    expect(result.avgAttendance).toBe(0);
  });

  it("handles empty activities", () => {
    const result = evaluateTeamLearning([], PERIOD_START, PERIOD_END);
    expect(result.totalTeamSessions).toBe(0);
    expect(result.sharedLearningRate).toBe(0);
  });
});

describe("Reflective Practice — evaluateGoalProgress", () => {
  it("counts total goals", () => {
    const result = evaluateGoalProgress(demoGoals, REFERENCE_DATE);
    expect(result.totalGoals).toBe(10);
  });

  it("counts achieved goals", () => {
    const result = evaluateGoalProgress(demoGoals, REFERENCE_DATE);
    // Sarah(1) + Lisa(1) + Darren(2) = 4 achieved
    expect(result.achieved).toBe(4);
  });

  it("counts in-progress goals", () => {
    const result = evaluateGoalProgress(demoGoals, REFERENCE_DATE);
    // Sarah(1) + Tom(1) + Lisa(2) + Darren(1) = 5 in_progress
    expect(result.inProgress).toBe(5);
  });

  it("identifies overdue goals", () => {
    const result = evaluateGoalProgress(demoGoals, REFERENCE_DATE);
    // Tom goal-t02: targetDate "2025-03-31", status "not_started" — overdue
    expect(result.overdue).toBeGreaterThanOrEqual(1);
    expect(result.overdueGoals.some((g) => g.staffName === "Tom Richards")).toBe(true);
  });

  it("calculates achievement rate", () => {
    const result = evaluateGoalProgress(demoGoals, REFERENCE_DATE);
    // 4 / 10 = 40%
    expect(result.achievementRate).toBe(40);
  });

  it("sorts overdue goals by most overdue first", () => {
    const result = evaluateGoalProgress(demoGoals, REFERENCE_DATE);
    if (result.overdueGoals.length > 1) {
      expect(result.overdueGoals[0].daysPastDue).toBeGreaterThanOrEqual(
        result.overdueGoals[result.overdueGoals.length - 1].daysPastDue,
      );
    }
  });

  it("builds practice area distribution", () => {
    const result = evaluateGoalProgress(demoGoals, REFERENCE_DATE);
    expect(result.practiceAreaDistribution).toHaveProperty("leadership");
    expect(result.practiceAreaDistribution).toHaveProperty("therapeutic_care");
  });

  it("handles empty goals", () => {
    const result = evaluateGoalProgress([], REFERENCE_DATE);
    expect(result.totalGoals).toBe(0);
    expect(result.achieved).toBe(0);
    expect(result.achievementRate).toBe(0);
  });

  it("handles all achieved goals", () => {
    const allAchieved: PracticeDevelopmentGoal[] = [
      { ...demoGoals[0], id: "a1", status: "achieved", achievedDate: "2025-05-01" },
      { ...demoGoals[1], id: "a2", status: "achieved", achievedDate: "2025-05-01" },
    ];
    const result = evaluateGoalProgress(allAchieved, REFERENCE_DATE);
    expect(result.achievementRate).toBe(100);
    expect(result.overdue).toBe(0);
  });

  it("does not count achieved goals as overdue", () => {
    const achievedPastDue: PracticeDevelopmentGoal[] = [
      { ...demoGoals[0], id: "apd1", status: "achieved", targetDate: "2025-01-01", achievedDate: "2025-02-01" },
    ];
    const result = evaluateGoalProgress(achievedPastDue, REFERENCE_DATE);
    expect(result.overdue).toBe(0);
  });

  it("does not count discontinued goals as overdue", () => {
    const discontinued: PracticeDevelopmentGoal[] = [
      { ...demoGoals[0], id: "disc1", status: "discontinued", targetDate: "2025-01-01" },
    ];
    const result = evaluateGoalProgress(discontinued, REFERENCE_DATE);
    expect(result.overdue).toBe(0);
  });
});

describe("Reflective Practice — buildStaffDevelopmentProfiles", () => {
  const profiles = buildStaffDevelopmentProfiles(demoActivities, demoGoals, demoStaff, PERIOD_START, PERIOD_END, REFERENCE_DATE);

  it("builds profiles for all staff", () => {
    expect(profiles.length).toBe(4);
  });

  it("Sarah has 10 activities", () => {
    const sarah = profiles.find((p) => p.staffId === "staff-sarah");
    expect(sarah!.totalActivities).toBe(10);
  });

  it("Tom has 5 activities (fewest)", () => {
    const tom = profiles.find((p) => p.staffId === "staff-tom");
    expect(tom!.totalActivities).toBe(5);
  });

  it("Lisa has 12 activities (most)", () => {
    const lisa = profiles.find((p) => p.staffId === "staff-lisa");
    expect(lisa!.totalActivities).toBe(12);
  });

  it("Darren has 10 activities", () => {
    const darren = profiles.find((p) => p.staffId === "staff-darren");
    expect(darren!.totalActivities).toBe(10);
  });

  it("calculates total hours per staff", () => {
    const sarah = profiles.find((p) => p.staffId === "staff-sarah");
    expect(sarah!.totalHours).toBeGreaterThan(0);
  });

  it("counts practice changes per staff", () => {
    const sarah = profiles.find((p) => p.staffId === "staff-sarah");
    // Sarah activities with practice_change: s01, s03, s05, s07, s09 = 5
    expect(sarah!.practiceChangeCount).toBe(5);
  });

  it("counts goals achieved per staff", () => {
    const sarah = profiles.find((p) => p.staffId === "staff-sarah");
    expect(sarah!.goalsAchieved).toBe(1);

    const darren = profiles.find((p) => p.staffId === "staff-darren");
    expect(darren!.goalsAchieved).toBe(2);
  });

  it("counts active goals per staff", () => {
    const sarah = profiles.find((p) => p.staffId === "staff-sarah");
    // Sarah has 1 in_progress goal
    expect(sarah!.activeGoals).toBe(1);
  });

  it("Lisa rated exemplary (highly engaged)", () => {
    const lisa = profiles.find((p) => p.staffId === "staff-lisa");
    expect(lisa!.reflectiveScore).toBeGreaterThanOrEqual(75);
    expect(lisa!.developmentRating).toBe("exemplary");
  });

  it("Tom has lower rating than Lisa", () => {
    const tom = profiles.find((p) => p.staffId === "staff-tom");
    const lisa = profiles.find((p) => p.staffId === "staff-lisa");
    expect(tom!.reflectiveScore).toBeLessThan(lisa!.reflectiveScore);
  });

  it("Sarah rated exemplary or engaged", () => {
    const sarah = profiles.find((p) => p.staffId === "staff-sarah");
    expect(["exemplary", "engaged"]).toContain(sarah!.developmentRating);
  });

  it("assigns reflective score between 0-100", () => {
    for (const p of profiles) {
      expect(p.reflectiveScore).toBeGreaterThanOrEqual(0);
      expect(p.reflectiveScore).toBeLessThanOrEqual(100);
    }
  });

  it("handles empty data", () => {
    const result = buildStaffDevelopmentProfiles([], [], [], PERIOD_START, PERIOD_END, REFERENCE_DATE);
    expect(result.length).toBe(0);
  });

  it("handles staff with no activities or goals", () => {
    const lonelyStaff: StaffProfile[] = [
      { staffId: "lonely", staffName: "Lonely Worker", role: "rsw", startDate: "2025-01-01" },
    ];
    const result = buildStaffDevelopmentProfiles([], [], lonelyStaff, PERIOD_START, PERIOD_END, REFERENCE_DATE);
    expect(result.length).toBe(1);
    expect(result[0].totalActivities).toBe(0);
    expect(result[0].developmentRating).toBe("minimal");
    expect(result[0].reflectiveScore).toBe(0);
  });
});

describe("Reflective Practice — generateReflectivePracticeIntelligence (integration)", () => {
  const result = generateReflectivePracticeIntelligence(
    demoActivities, demoGoals, demoStaff,
    "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
  );

  it("returns complete structure", () => {
    expect(result).toHaveProperty("homeId", "oak-house");
    expect(result).toHaveProperty("periodStart", PERIOD_START);
    expect(result).toHaveProperty("periodEnd", PERIOD_END);
    expect(result).toHaveProperty("referenceDate", REFERENCE_DATE);
    expect(result).toHaveProperty("overallScore");
    expect(result).toHaveProperty("rating");
    expect(result).toHaveProperty("engagement");
    expect(result).toHaveProperty("learningOutcomes");
    expect(result).toHaveProperty("teamLearning");
    expect(result).toHaveProperty("goalProgress");
    expect(result).toHaveProperty("staffProfiles");
    expect(result).toHaveProperty("strengths");
    expect(result).toHaveProperty("areasForImprovement");
    expect(result).toHaveProperty("actions");
    expect(result).toHaveProperty("regulatoryLinks");
  });

  it("achieves good or outstanding rating", () => {
    expect(["good", "outstanding"]).toContain(result.rating);
  });

  it("scores at least 60", () => {
    expect(result.overallScore).toBeGreaterThanOrEqual(60);
  });

  it("scores no more than 100", () => {
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("produces inadequate with no data", () => {
    const empty = generateReflectivePracticeIntelligence([], [], [], "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE);
    expect(empty.rating).toBe("inadequate");
    expect(empty.overallScore).toBe(0);
  });

  it("includes 4 staff profiles", () => {
    expect(result.staffProfiles.length).toBe(4);
  });

  it("links to Reg 13", () => {
    expect(result.regulatoryLinks.some((l) => l.includes("Reg 13"))).toBe(true);
  });

  it("links to Reg 33", () => {
    expect(result.regulatoryLinks.some((l) => l.includes("Reg 33"))).toBe(true);
  });

  it("links to SCCIF", () => {
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
  });

  it("links to Working Together", () => {
    expect(result.regulatoryLinks.some((l) => l.includes("Working Together"))).toBe(true);
  });

  it("identifies strengths", () => {
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("identifies areas for improvement", () => {
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("identifies actions", () => {
    expect(result.actions.length).toBeGreaterThan(0);
  });

  it("identifies shared learning strength", () => {
    expect(result.strengths.some((s) => s.toLowerCase().includes("shared"))).toBe(true);
  });

  it("identifies overdue goals in areas for improvement", () => {
    expect(result.areasForImprovement.some((a) => a.toLowerCase().includes("overdue"))).toBe(true);
  });

  it("rating maps correctly for scores", () => {
    // Test each rating boundary
    const highScore = generateReflectivePracticeIntelligence(
      demoActivities, demoGoals, demoStaff,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    if (highScore.overallScore >= 80) expect(highScore.rating).toBe("outstanding");
    else if (highScore.overallScore >= 60) expect(highScore.rating).toBe("good");
    else if (highScore.overallScore >= 40) expect(highScore.rating).toBe("requires_improvement");
    else expect(highScore.rating).toBe("inadequate");
  });

  it("engagement section populated correctly", () => {
    expect(result.engagement.totalActivities).toBe(37);
    expect(result.engagement.activitiesPerStaff).toBe(9.3);
  });

  it("learning outcomes section populated", () => {
    expect(result.learningOutcomes.practiceChangeRate).toBeGreaterThan(0);
    expect(result.learningOutcomes.sharedWithTeamRate).toBeGreaterThan(0);
  });

  it("team learning section populated", () => {
    expect(result.teamLearning.totalTeamSessions).toBeGreaterThan(0);
    expect(result.teamLearning.avgAttendance).toBeGreaterThan(0);
  });

  it("goal progress section populated", () => {
    expect(result.goalProgress.totalGoals).toBe(10);
    expect(result.goalProgress.achieved).toBe(4);
  });
});

describe("Reflective Practice — Labels", () => {
  it("returns Reflective Journal label", () => {
    expect(getActivityTypeLabel("reflective_journal")).toBe("Reflective Journal");
  });

  it("returns Team Debrief label", () => {
    expect(getActivityTypeLabel("team_debrief")).toBe("Team Debrief");
  });

  it("returns Supervision Reflection label", () => {
    expect(getActivityTypeLabel("supervision_reflection")).toBe("Supervision Reflection");
  });

  it("returns Case Discussion label", () => {
    expect(getActivityTypeLabel("case_discussion")).toBe("Case Discussion");
  });

  it("returns Practice Workshop label", () => {
    expect(getActivityTypeLabel("practice_workshop")).toBe("Practice Workshop");
  });

  it("returns External Conference label", () => {
    expect(getActivityTypeLabel("external_conference")).toBe("External Conference");
  });

  it("returns Coaching Session label", () => {
    expect(getActivityTypeLabel("coaching_session")).toBe("Coaching Session");
  });

  it("returns Mentoring label", () => {
    expect(getActivityTypeLabel("mentoring")).toBe("Mentoring");
  });

  it("returns Practice Audit label", () => {
    expect(getActivityTypeLabel("practice_audit")).toBe("Practice Audit");
  });

  it("returns Action Learning Set label", () => {
    expect(getActivityTypeLabel("action_learning_set")).toBe("Action Learning Set");
  });

  it("returns Therapeutic Care practice area label", () => {
    expect(getPracticeAreaLabel("therapeutic_care")).toBe("Therapeutic Care");
  });

  it("returns Safeguarding practice area label", () => {
    expect(getPracticeAreaLabel("safeguarding")).toBe("Safeguarding");
  });

  it("returns Behaviour Support practice area label", () => {
    expect(getPracticeAreaLabel("behaviour_support")).toBe("Behaviour Support");
  });

  it("returns Trauma-Informed Practice label", () => {
    expect(getPracticeAreaLabel("trauma_informed")).toBe("Trauma-Informed Practice");
  });

  it("returns team activity types list", () => {
    const types = getTeamActivityTypes();
    expect(types).toContain("team_debrief");
    expect(types).toContain("case_discussion");
    expect(types).toContain("practice_workshop");
    expect(types).toContain("action_learning_set");
    expect(types.length).toBe(4);
  });

  it("returns Equality & Diversity practice area label", () => {
    expect(getPracticeAreaLabel("equality_diversity")).toBe("Equality & Diversity");
  });
});

describe("Reflective Practice — Edge cases", () => {
  it("single staff with many activities scores well", () => {
    const singleStaff: StaffProfile[] = [
      { staffId: "s1", staffName: "Solo Worker", role: "rsw", startDate: "2025-01-01" },
    ];
    const manyActivities: ReflectiveActivity[] = Array.from({ length: 20 }, (_, i) => ({
      ...demoActivities[0],
      id: `many-${i}`,
      staffId: "s1",
      staffName: "Solo Worker",
      date: `2025-0${Math.min(Math.floor(i / 4) + 1, 6)}-${String((i % 28) + 1).padStart(2, "0")}`,
      learningOutcomes: i % 2 === 0 ? ["practice_change", "shared_with_team"] as const : ["new_insight"] as const,
      sharedWithTeam: i % 2 === 0,
      linkedToChildOutcome: i % 3 === 0,
    }));
    const goals: PracticeDevelopmentGoal[] = [
      { ...demoGoals[0], staffId: "s1", staffName: "Solo Worker", status: "achieved", achievedDate: "2025-05-01" },
    ];
    const result = generateReflectivePracticeIntelligence(manyActivities, goals, singleStaff, "home", PERIOD_START, PERIOD_END, REFERENCE_DATE);
    expect(result.overallScore).toBeGreaterThanOrEqual(50);
  });

  it("activities with no outcomes still count for engagement", () => {
    const noOutcomes: ReflectiveActivity[] = [
      { ...demoActivities[0], id: "no-1", learningOutcomes: ["no_clear_outcome"], sharedWithTeam: false, linkedToChildOutcome: false },
    ];
    const result = evaluateReflectiveEngagement(noOutcomes, demoStaff, PERIOD_START, PERIOD_END);
    expect(result.totalActivities).toBe(1);
  });

  it("team session with single participant has attendance of 1", () => {
    const solo: ReflectiveActivity[] = [
      { ...demoActivities[0], id: "solo-td", activityType: "team_debrief", date: "2025-01-10" },
    ];
    const result = evaluateTeamLearning(solo, PERIOD_START, PERIOD_END);
    expect(result.avgAttendance).toBe(1);
  });

  it("handles very short period (same month)", () => {
    const result = evaluateReflectiveEngagement(demoActivities, demoStaff, "2025-01-01", "2025-01-31");
    expect(result.totalActivities).toBeGreaterThan(0);
  });

  it("all goals overdue produces low score", () => {
    const overdueGoals: PracticeDevelopmentGoal[] = [
      { ...demoGoals[0], id: "od1", staffId: "staff-sarah", status: "not_started", targetDate: "2025-01-01" },
      { ...demoGoals[1], id: "od2", staffId: "staff-tom", status: "in_progress", targetDate: "2025-01-01" },
    ];
    const result = evaluateGoalProgress(overdueGoals, REFERENCE_DATE);
    expect(result.overdue).toBe(2);
    expect(result.achievementRate).toBe(0);
  });
});
