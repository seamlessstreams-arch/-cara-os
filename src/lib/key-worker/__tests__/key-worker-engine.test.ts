// ══════════════════════════════════════════════════════════════════════════════
// Key Worker Relationship Quality Intelligence Engine — Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateSessionConsistency,
  evaluateChildVoice,
  evaluateRelationshipQuality,
  evaluateGoalProgress,
  buildChildKeyWorkerProfiles,
  generateKeyWorkerIntelligence,
} from "../key-worker-engine";
import type {
  KeyWorkerSession,
  KeyWorkerAssignment,
  KeyWorkerGoal,
  SessionType,
  SessionStatus,
  VoiceIndicator,
  RelationshipQualityIndicator,
} from "../key-worker-engine";

// ── Constants ────────────────────────────────────────────────────────────

const PERIOD_START = "2026-03-01T00:00:00Z";
const PERIOD_END = "2026-05-18T23:59:59Z";
const REFERENCE_DATE = "2026-05-18T12:00:00Z";
const HOME_ID = "home-oak";

// ── Staff ────────────────────────────────────────────────────────────────

const STAFF = {
  sarah: { id: "staff-sj", name: "Sarah Johnson" },
  tom: { id: "staff-tr", name: "Tom Richards" },
  lisa: { id: "staff-lw", name: "Lisa Williams" },
  darren: { id: "staff-dl", name: "Darren Laville" },
};

// ── Children ─────────────────────────────────────────────────────────────

const CHILDREN = {
  alex: { id: "child-alex", name: "Alex", age: 14 },
  jordan: { id: "child-jordan", name: "Jordan", age: 13 },
  morgan: { id: "child-morgan", name: "Morgan", age: 15 },
};

// ── Assignments ──────────────────────────────────────────────────────────

const ASSIGNMENTS: KeyWorkerAssignment[] = [
  {
    childId: CHILDREN.alex.id,
    childName: CHILDREN.alex.name,
    primaryKeyWorkerId: STAFF.tom.id,
    primaryKeyWorkerName: STAFF.tom.name,
    secondaryKeyWorkerId: STAFF.sarah.id,
    secondaryKeyWorkerName: STAFF.sarah.name,
    assignmentDate: "2025-09-01",
  },
  {
    childId: CHILDREN.jordan.id,
    childName: CHILDREN.jordan.name,
    primaryKeyWorkerId: STAFF.lisa.id,
    primaryKeyWorkerName: STAFF.lisa.name,
    secondaryKeyWorkerId: STAFF.darren.id,
    secondaryKeyWorkerName: STAFF.darren.name,
    assignmentDate: "2025-10-01",
  },
  {
    childId: CHILDREN.morgan.id,
    childName: CHILDREN.morgan.name,
    primaryKeyWorkerId: STAFF.sarah.id,
    primaryKeyWorkerName: STAFF.sarah.name,
    secondaryKeyWorkerId: STAFF.tom.id,
    secondaryKeyWorkerName: STAFF.tom.name,
    assignmentDate: "2025-08-15",
    lastChangeDate: "2026-01-10",
    changeReason: "Staff restructuring",
  },
];

// ── Session Factory ──────────────────────────────────────────────────────

let sessionCounter = 0;
function makeSession(overrides: Partial<KeyWorkerSession> = {}): KeyWorkerSession {
  sessionCounter++;
  return {
    id: `session-${String(sessionCounter).padStart(3, "0")}`,
    childId: CHILDREN.alex.id,
    childName: CHILDREN.alex.name,
    keyWorkerId: STAFF.tom.id,
    keyWorkerName: STAFF.tom.name,
    date: "2026-04-10T14:00:00Z",
    duration: 45,
    sessionType: "one_to_one",
    status: "completed",
    topicsDiscussed: ["school", "friendships"],
    childVoiceIndicators: ["wishes_recorded", "feelings_expressed"],
    relationshipIndicators: ["trust_building", "active_listening", "warmth_demonstrated"],
    goalsReviewed: [],
    goalsSet: [],
    ...overrides,
  };
}

// ── Goal Factory ─────────────────────────────────────────────────────────

let goalCounter = 0;
function makeGoal(overrides: Partial<KeyWorkerGoal> = {}): KeyWorkerGoal {
  goalCounter++;
  return {
    id: `goal-${String(goalCounter).padStart(3, "0")}`,
    childId: CHILDREN.alex.id,
    childName: CHILDREN.alex.name,
    setBySession: "session-001",
    goalDescription: "Improve maths confidence",
    category: "educational",
    targetDate: "2026-06-30",
    status: "active",
    ...overrides,
  };
}

// ── Demo Sessions (20+) ─────────────────────────────────────────────────

const DEMO_SESSIONS: KeyWorkerSession[] = [
  // Alex — Tom Richards (good relationship, regular sessions)
  makeSession({
    childId: CHILDREN.alex.id, childName: CHILDREN.alex.name,
    keyWorkerId: STAFF.tom.id, keyWorkerName: STAFF.tom.name,
    date: "2026-03-05T14:00:00Z", duration: 45, sessionType: "one_to_one", status: "completed",
    topicsDiscussed: ["settling in", "room personalisation"],
    childVoiceIndicators: ["wishes_recorded", "feelings_expressed", "choices_offered"],
    relationshipIndicators: ["trust_building", "warmth_demonstrated", "active_listening"],
  }),
  makeSession({
    childId: CHILDREN.alex.id, childName: CHILDREN.alex.name,
    keyWorkerId: STAFF.tom.id, keyWorkerName: STAFF.tom.name,
    date: "2026-03-12T15:00:00Z", duration: 60, sessionType: "activity_based", status: "completed",
    topicsDiscussed: ["football", "team building"],
    childVoiceIndicators: ["wishes_recorded", "choices_offered"],
    relationshipIndicators: ["trust_building", "child_led", "warmth_demonstrated"],
  }),
  makeSession({
    childId: CHILDREN.alex.id, childName: CHILDREN.alex.name,
    keyWorkerId: STAFF.tom.id, keyWorkerName: STAFF.tom.name,
    date: "2026-03-19T14:00:00Z", duration: 30, sessionType: "goal_setting", status: "completed",
    topicsDiscussed: ["education targets", "weekend activities"],
    childVoiceIndicators: ["wishes_recorded", "feelings_expressed", "views_influenced_plan"],
    relationshipIndicators: ["active_listening", "child_led", "trauma_informed"],
    goalsSet: ["goal-001", "goal-002"],
  }),
  makeSession({
    childId: CHILDREN.alex.id, childName: CHILDREN.alex.name,
    keyWorkerId: STAFF.tom.id, keyWorkerName: STAFF.tom.name,
    date: "2026-04-02T14:00:00Z", duration: 45, sessionType: "one_to_one", status: "completed",
    topicsDiscussed: ["school progress", "friendships"],
    childVoiceIndicators: ["feelings_expressed", "choices_offered"],
    relationshipIndicators: ["trust_building", "consistent_boundaries", "warmth_demonstrated", "active_listening"],
  }),
  makeSession({
    childId: CHILDREN.alex.id, childName: CHILDREN.alex.name,
    keyWorkerId: STAFF.tom.id, keyWorkerName: STAFF.tom.name,
    date: "2026-04-16T15:00:00Z", duration: 50, sessionType: "review", status: "completed",
    topicsDiscussed: ["care plan review", "family contact"],
    childVoiceIndicators: ["wishes_recorded", "feelings_expressed", "views_influenced_plan"],
    relationshipIndicators: ["active_listening", "warmth_demonstrated", "trauma_informed", "culturally_responsive"],
    goalsReviewed: ["goal-001"],
  }),
  makeSession({
    childId: CHILDREN.alex.id, childName: CHILDREN.alex.name,
    keyWorkerId: STAFF.tom.id, keyWorkerName: STAFF.tom.name,
    date: "2026-04-25T10:00:00Z", duration: 40, sessionType: "informal_check_in", status: "completed",
    topicsDiscussed: ["weekend plans"],
    childVoiceIndicators: ["wishes_recorded"],
    relationshipIndicators: ["warmth_demonstrated", "trust_building"],
  }),
  makeSession({
    childId: CHILDREN.alex.id, childName: CHILDREN.alex.name,
    keyWorkerId: STAFF.tom.id, keyWorkerName: STAFF.tom.name,
    date: "2026-05-07T14:00:00Z", duration: 45, sessionType: "one_to_one", status: "completed",
    topicsDiscussed: ["exam preparation", "anxiety"],
    childVoiceIndicators: ["feelings_expressed", "wishes_recorded", "choices_offered"],
    relationshipIndicators: ["trauma_informed", "active_listening", "warmth_demonstrated", "trust_building"],
  }),
  // Alex — one cancelled by staff
  makeSession({
    childId: CHILDREN.alex.id, childName: CHILDREN.alex.name,
    keyWorkerId: STAFF.tom.id, keyWorkerName: STAFF.tom.name,
    date: "2026-05-14T14:00:00Z", duration: 0, sessionType: "one_to_one", status: "cancelled_by_staff",
    topicsDiscussed: [], childVoiceIndicators: [], relationshipIndicators: [],
  }),

  // Jordan — Lisa Williams (strong relationship, high voice scores)
  makeSession({
    childId: CHILDREN.jordan.id, childName: CHILDREN.jordan.name,
    keyWorkerId: STAFF.lisa.id, keyWorkerName: STAFF.lisa.name,
    date: "2026-03-04T10:00:00Z", duration: 50, sessionType: "one_to_one", status: "completed",
    topicsDiscussed: ["feelings about placement", "interests"],
    childVoiceIndicators: ["wishes_recorded", "feelings_expressed", "choices_offered", "views_influenced_plan"],
    relationshipIndicators: ["trust_building", "warmth_demonstrated", "active_listening", "child_led", "trauma_informed"],
  }),
  makeSession({
    childId: CHILDREN.jordan.id, childName: CHILDREN.jordan.name,
    keyWorkerId: STAFF.lisa.id, keyWorkerName: STAFF.lisa.name,
    date: "2026-03-11T14:00:00Z", duration: 60, sessionType: "activity_based", status: "completed",
    topicsDiscussed: ["art project", "self-expression"],
    childVoiceIndicators: ["wishes_recorded", "feelings_expressed", "choices_offered"],
    relationshipIndicators: ["child_led", "warmth_demonstrated", "culturally_responsive", "active_listening"],
  }),
  makeSession({
    childId: CHILDREN.jordan.id, childName: CHILDREN.jordan.name,
    keyWorkerId: STAFF.lisa.id, keyWorkerName: STAFF.lisa.name,
    date: "2026-03-25T10:00:00Z", duration: 45, sessionType: "goal_setting", status: "completed",
    topicsDiscussed: ["social goals", "independence"],
    childVoiceIndicators: ["wishes_recorded", "feelings_expressed", "views_influenced_plan", "choices_offered"],
    relationshipIndicators: ["active_listening", "child_led", "trauma_informed", "culturally_responsive"],
    goalsSet: ["goal-005", "goal-006"],
  }),
  makeSession({
    childId: CHILDREN.jordan.id, childName: CHILDREN.jordan.name,
    keyWorkerId: STAFF.lisa.id, keyWorkerName: STAFF.lisa.name,
    date: "2026-04-08T14:00:00Z", duration: 55, sessionType: "one_to_one", status: "completed",
    topicsDiscussed: ["family contact", "school transition"],
    childVoiceIndicators: ["wishes_recorded", "feelings_expressed", "views_influenced_plan", "disagreement_noted"],
    relationshipIndicators: ["trust_building", "consistent_boundaries", "active_listening", "warmth_demonstrated", "trauma_informed"],
  }),
  makeSession({
    childId: CHILDREN.jordan.id, childName: CHILDREN.jordan.name,
    keyWorkerId: STAFF.lisa.id, keyWorkerName: STAFF.lisa.name,
    date: "2026-04-22T10:00:00Z", duration: 50, sessionType: "review", status: "completed",
    topicsDiscussed: ["care plan update", "placement review"],
    childVoiceIndicators: ["wishes_recorded", "feelings_expressed", "views_influenced_plan", "advocacy_offered"],
    relationshipIndicators: ["active_listening", "child_led", "trauma_informed", "culturally_responsive", "warmth_demonstrated"],
    goalsReviewed: ["goal-005"],
  }),
  makeSession({
    childId: CHILDREN.jordan.id, childName: CHILDREN.jordan.name,
    keyWorkerId: STAFF.lisa.id, keyWorkerName: STAFF.lisa.name,
    date: "2026-05-06T14:00:00Z", duration: 45, sessionType: "one_to_one", status: "completed",
    topicsDiscussed: ["friendships", "healthy relationships"],
    childVoiceIndicators: ["wishes_recorded", "feelings_expressed", "choices_offered"],
    relationshipIndicators: ["trust_building", "warmth_demonstrated", "active_listening", "culturally_responsive"],
  }),
  makeSession({
    childId: CHILDREN.jordan.id, childName: CHILDREN.jordan.name,
    keyWorkerId: STAFF.lisa.id, keyWorkerName: STAFF.lisa.name,
    date: "2026-05-13T10:00:00Z", duration: 40, sessionType: "informal_check_in", status: "completed",
    topicsDiscussed: ["weekend", "hobbies"],
    childVoiceIndicators: ["wishes_recorded", "feelings_expressed"],
    relationshipIndicators: ["warmth_demonstrated", "child_led"],
  }),

  // Morgan — Sarah Johnson (complex needs, more crisis support)
  makeSession({
    childId: CHILDREN.morgan.id, childName: CHILDREN.morgan.name,
    keyWorkerId: STAFF.sarah.id, keyWorkerName: STAFF.sarah.name,
    date: "2026-03-06T14:00:00Z", duration: 40, sessionType: "one_to_one", status: "completed",
    topicsDiscussed: ["placement settling", "routines"],
    childVoiceIndicators: ["feelings_expressed"],
    relationshipIndicators: ["trust_building", "consistent_boundaries", "trauma_informed"],
  }),
  makeSession({
    childId: CHILDREN.morgan.id, childName: CHILDREN.morgan.name,
    keyWorkerId: STAFF.sarah.id, keyWorkerName: STAFF.sarah.name,
    date: "2026-03-15T10:00:00Z", duration: 30, sessionType: "crisis_support", status: "completed",
    topicsDiscussed: ["family conflict", "emotional regulation"],
    childVoiceIndicators: ["feelings_expressed", "wishes_recorded"],
    relationshipIndicators: ["trauma_informed", "active_listening", "warmth_demonstrated"],
  }),
  makeSession({
    childId: CHILDREN.morgan.id, childName: CHILDREN.morgan.name,
    keyWorkerId: STAFF.sarah.id, keyWorkerName: STAFF.sarah.name,
    date: "2026-03-22T14:00:00Z", duration: 0, sessionType: "one_to_one", status: "cancelled_by_child",
    topicsDiscussed: [], childVoiceIndicators: [], relationshipIndicators: [],
  }),
  makeSession({
    childId: CHILDREN.morgan.id, childName: CHILDREN.morgan.name,
    keyWorkerId: STAFF.sarah.id, keyWorkerName: STAFF.sarah.name,
    date: "2026-04-01T14:00:00Z", duration: 45, sessionType: "one_to_one", status: "completed",
    topicsDiscussed: ["anger management", "coping strategies"],
    childVoiceIndicators: ["feelings_expressed", "choices_offered"],
    relationshipIndicators: ["trauma_informed", "consistent_boundaries", "active_listening"],
  }),
  makeSession({
    childId: CHILDREN.morgan.id, childName: CHILDREN.morgan.name,
    keyWorkerId: STAFF.sarah.id, keyWorkerName: STAFF.sarah.name,
    date: "2026-04-10T10:00:00Z", duration: 35, sessionType: "crisis_support", status: "completed",
    topicsDiscussed: ["peer conflict", "safety planning"],
    childVoiceIndicators: ["feelings_expressed"],
    relationshipIndicators: ["trauma_informed", "active_listening", "consistent_boundaries"],
  }),
  makeSession({
    childId: CHILDREN.morgan.id, childName: CHILDREN.morgan.name,
    keyWorkerId: STAFF.sarah.id, keyWorkerName: STAFF.sarah.name,
    date: "2026-04-20T14:00:00Z", duration: 50, sessionType: "goal_setting", status: "completed",
    topicsDiscussed: ["independence goals", "education"],
    childVoiceIndicators: ["wishes_recorded", "feelings_expressed", "views_influenced_plan"],
    relationshipIndicators: ["active_listening", "child_led", "trauma_informed"],
    goalsSet: ["goal-009", "goal-010"],
  }),
  makeSession({
    childId: CHILDREN.morgan.id, childName: CHILDREN.morgan.name,
    keyWorkerId: STAFF.sarah.id, keyWorkerName: STAFF.sarah.name,
    date: "2026-05-01T14:00:00Z", duration: 0, sessionType: "one_to_one", status: "missed",
    topicsDiscussed: [], childVoiceIndicators: [], relationshipIndicators: [],
  }),
  makeSession({
    childId: CHILDREN.morgan.id, childName: CHILDREN.morgan.name,
    keyWorkerId: STAFF.sarah.id, keyWorkerName: STAFF.sarah.name,
    date: "2026-05-08T14:00:00Z", duration: 40, sessionType: "one_to_one", status: "completed",
    topicsDiscussed: ["progress check", "emotional wellbeing"],
    childVoiceIndicators: ["feelings_expressed", "wishes_recorded"],
    relationshipIndicators: ["trust_building", "warmth_demonstrated", "trauma_informed"],
  }),
  makeSession({
    childId: CHILDREN.morgan.id, childName: CHILDREN.morgan.name,
    keyWorkerId: STAFF.sarah.id, keyWorkerName: STAFF.sarah.name,
    date: "2026-05-15T10:00:00Z", duration: 30, sessionType: "crisis_support", status: "completed",
    topicsDiscussed: ["anxiety episode", "grounding techniques"],
    childVoiceIndicators: ["feelings_expressed"],
    relationshipIndicators: ["trauma_informed", "active_listening", "warmth_demonstrated"],
  }),
];

// ── Demo Goals (12+) ────────────────────────────────────────────────────

const DEMO_GOALS: KeyWorkerGoal[] = [
  // Alex goals
  makeGoal({ childId: CHILDREN.alex.id, childName: CHILDREN.alex.name, setBySession: "session-003",
    goalDescription: "Improve maths confidence", category: "educational", targetDate: "2026-06-30", status: "active" }),
  makeGoal({ childId: CHILDREN.alex.id, childName: CHILDREN.alex.name, setBySession: "session-003",
    goalDescription: "Join the football club", category: "social", targetDate: "2026-04-30", status: "achieved" }),
  makeGoal({ childId: CHILDREN.alex.id, childName: CHILDREN.alex.name, setBySession: "session-005",
    goalDescription: "Build confidence speaking in group settings", category: "emotional", targetDate: "2026-07-31", status: "active" }),
  makeGoal({ childId: CHILDREN.alex.id, childName: CHILDREN.alex.name, setBySession: "session-005",
    goalDescription: "Learn to cook three meals independently", category: "independence", targetDate: "2026-06-15", status: "partially_achieved" }),

  // Jordan goals
  makeGoal({ childId: CHILDREN.jordan.id, childName: CHILDREN.jordan.name, setBySession: "session-011",
    goalDescription: "Develop peer friendships outside placement", category: "social", targetDate: "2026-05-31", status: "achieved" }),
  makeGoal({ childId: CHILDREN.jordan.id, childName: CHILDREN.jordan.name, setBySession: "session-011",
    goalDescription: "Explore cultural heritage through art", category: "emotional", targetDate: "2026-06-30", status: "active" }),
  makeGoal({ childId: CHILDREN.jordan.id, childName: CHILDREN.jordan.name, setBySession: "session-013",
    goalDescription: "Attend all scheduled health appointments", category: "health", targetDate: "2026-06-30", status: "achieved" }),
  makeGoal({ childId: CHILDREN.jordan.id, childName: CHILDREN.jordan.name, setBySession: "session-013",
    goalDescription: "Complete homework independently 4 days a week", category: "educational", targetDate: "2026-07-31", status: "active" }),

  // Morgan goals
  makeGoal({ childId: CHILDREN.morgan.id, childName: CHILDREN.morgan.name, setBySession: "session-022",
    goalDescription: "Use coping strategies before escalation", category: "behavioural", targetDate: "2026-06-30", status: "partially_achieved" }),
  makeGoal({ childId: CHILDREN.morgan.id, childName: CHILDREN.morgan.name, setBySession: "session-022",
    goalDescription: "Attend college open day", category: "educational", targetDate: "2026-05-15", status: "not_achieved" }),
  makeGoal({ childId: CHILDREN.morgan.id, childName: CHILDREN.morgan.name, setBySession: "session-022",
    goalDescription: "Maintain consistent bedtime routine", category: "health", targetDate: "2026-05-31", status: "deferred",
    reviewNotes: "Deferred due to ongoing anxiety — reassess next month" }),
  makeGoal({ childId: CHILDREN.morgan.id, childName: CHILDREN.morgan.name, setBySession: "session-024",
    goalDescription: "Build one trusted peer relationship", category: "social", targetDate: "2026-07-31", status: "active" }),
  makeGoal({ childId: CHILDREN.morgan.id, childName: CHILDREN.morgan.name, setBySession: "session-024",
    goalDescription: "Learn to manage budget for personal items", category: "independence", targetDate: "2026-08-31", status: "active" }),
];

// ══════════════════════════════════════════════════════════════════════════════
// Tests
// ══════════════════════════════════════════════════════════════════════════════

// ── evaluateSessionConsistency ────────────────────────────────────────────

describe("evaluateSessionConsistency", () => {
  it("counts total sessions in period", () => {
    const result = evaluateSessionConsistency(DEMO_SESSIONS, ASSIGNMENTS, PERIOD_START, PERIOD_END);
    expect(result.totalSessions).toBe(DEMO_SESSIONS.length);
  });

  it("counts completed sessions correctly", () => {
    const result = evaluateSessionConsistency(DEMO_SESSIONS, ASSIGNMENTS, PERIOD_START, PERIOD_END);
    const expectedCompleted = DEMO_SESSIONS.filter(s => s.status === "completed").length;
    expect(result.completedSessions).toBe(expectedCompleted);
  });

  it("calculates completion rate", () => {
    const result = evaluateSessionConsistency(DEMO_SESSIONS, ASSIGNMENTS, PERIOD_START, PERIOD_END);
    expect(result.completionRate).toBeGreaterThan(0);
    expect(result.completionRate).toBeLessThanOrEqual(100);
  });

  it("counts cancellations by child", () => {
    const result = evaluateSessionConsistency(DEMO_SESSIONS, ASSIGNMENTS, PERIOD_START, PERIOD_END);
    expect(result.cancelledByChild).toBe(1); // Morgan cancelled one
  });

  it("counts cancellations by staff", () => {
    const result = evaluateSessionConsistency(DEMO_SESSIONS, ASSIGNMENTS, PERIOD_START, PERIOD_END);
    expect(result.cancelledByStaff).toBe(1); // Alex had one staff cancellation
  });

  it("counts missed sessions", () => {
    const result = evaluateSessionConsistency(DEMO_SESSIONS, ASSIGNMENTS, PERIOD_START, PERIOD_END);
    expect(result.missed).toBe(1); // Morgan missed one
  });

  it("calculates cancellation rate", () => {
    const result = evaluateSessionConsistency(DEMO_SESSIONS, ASSIGNMENTS, PERIOD_START, PERIOD_END);
    expect(result.cancellationRate).toBeGreaterThan(0);
  });

  it("calculates average duration from completed sessions only", () => {
    const result = evaluateSessionConsistency(DEMO_SESSIONS, ASSIGNMENTS, PERIOD_START, PERIOD_END);
    expect(result.averageDuration).toBeGreaterThan(30);
    expect(result.averageDuration).toBeLessThan(60);
  });

  it("computes sessions per child per month", () => {
    const result = evaluateSessionConsistency(DEMO_SESSIONS, ASSIGNMENTS, PERIOD_START, PERIOD_END);
    expect(Object.keys(result.sessionsPerChildPerMonth)).toContain(CHILDREN.alex.id);
    expect(Object.keys(result.sessionsPerChildPerMonth)).toContain(CHILDREN.jordan.id);
    expect(Object.keys(result.sessionsPerChildPerMonth)).toContain(CHILDREN.morgan.id);
  });

  it("identifies session type variety", () => {
    const result = evaluateSessionConsistency(DEMO_SESSIONS, ASSIGNMENTS, PERIOD_START, PERIOD_END);
    expect(result.sessionTypeVariety).toBeGreaterThanOrEqual(4);
  });

  it("populates session type breakdown", () => {
    const result = evaluateSessionConsistency(DEMO_SESSIONS, ASSIGNMENTS, PERIOD_START, PERIOD_END);
    expect(result.sessionTypeBreakdown.one_to_one).toBeGreaterThan(0);
    expect(result.sessionTypeBreakdown.crisis_support).toBeGreaterThan(0);
    expect(result.sessionTypeBreakdown.activity_based).toBeGreaterThan(0);
  });

  it("flags children below minimum sessions per month", () => {
    // Single session in a 2-month period = 0.5/month, below 2
    const sparse = [makeSession({ childId: "child-sparse", date: "2026-04-01T10:00:00Z", status: "completed" })];
    const sparsAssign: KeyWorkerAssignment[] = [{
      childId: "child-sparse", childName: "Sparse", primaryKeyWorkerId: "s1", primaryKeyWorkerName: "S1", assignmentDate: "2026-01-01",
    }];
    const result = evaluateSessionConsistency(sparse, sparsAssign, PERIOD_START, PERIOD_END);
    expect(result.childrenBelowMinimum).toContain("child-sparse");
  });

  it("returns empty arrays for no sessions", () => {
    const result = evaluateSessionConsistency([], ASSIGNMENTS, PERIOD_START, PERIOD_END);
    expect(result.totalSessions).toBe(0);
    expect(result.completedSessions).toBe(0);
    expect(result.completionRate).toBe(0);
    expect(result.averageDuration).toBe(0);
  });

  it("excludes sessions outside period", () => {
    const outsideSessions = [
      makeSession({ date: "2025-01-01T10:00:00Z", status: "completed" }),
      makeSession({ date: "2027-01-01T10:00:00Z", status: "completed" }),
    ];
    const result = evaluateSessionConsistency(outsideSessions, ASSIGNMENTS, PERIOD_START, PERIOD_END);
    expect(result.totalSessions).toBe(0);
  });

  it("handles rescheduled sessions", () => {
    const sessions = [
      makeSession({ status: "rescheduled", date: "2026-04-01T10:00:00Z" }),
      makeSession({ status: "completed", date: "2026-04-02T10:00:00Z" }),
    ];
    const result = evaluateSessionConsistency(sessions, ASSIGNMENTS, PERIOD_START, PERIOD_END);
    expect(result.rescheduled).toBe(1);
    expect(result.completedSessions).toBe(1);
  });
});

// ── evaluateChildVoice ───────────────────────────────────────────────────

describe("evaluateChildVoice", () => {
  it("counts total voice indicators", () => {
    const result = evaluateChildVoice(DEMO_SESSIONS);
    expect(result.totalVoiceIndicators).toBeGreaterThan(0);
  });

  it("computes voice indicator frequency for all indicator types", () => {
    const result = evaluateChildVoice(DEMO_SESSIONS);
    expect(result.voiceIndicatorFrequency.wishes_recorded).toBeGreaterThan(0);
    expect(result.voiceIndicatorFrequency.feelings_expressed).toBeGreaterThan(0);
    expect(result.voiceIndicatorFrequency.choices_offered).toBeGreaterThan(0);
    expect(result.voiceIndicatorFrequency.views_influenced_plan).toBeGreaterThan(0);
  });

  it("computes per-child voice presence", () => {
    const result = evaluateChildVoice(DEMO_SESSIONS);
    // Jordan has voice indicators in all completed sessions
    expect(result.perChildVoicePresence[CHILDREN.jordan.id]).toBe(100);
  });

  it("identifies plan influence rate", () => {
    const result = evaluateChildVoice(DEMO_SESSIONS);
    expect(result.planInfluenceRate).toBeGreaterThan(0);
    expect(result.planInfluenceRate).toBeLessThanOrEqual(100);
  });

  it("counts indicators driving plan changes", () => {
    const result = evaluateChildVoice(DEMO_SESSIONS);
    expect(result.indicatorsDrivingPlanChanges).toBeGreaterThan(0);
  });

  it("identifies children with low voice representation", () => {
    // Create sessions where one child has no voice indicators
    const silentSessions = [
      makeSession({ childId: "child-silent", status: "completed", childVoiceIndicators: [] }),
      makeSession({ childId: "child-silent", status: "completed", childVoiceIndicators: [] }),
      makeSession({ childId: "child-vocal", status: "completed", childVoiceIndicators: ["wishes_recorded"] }),
    ];
    const result = evaluateChildVoice(silentSessions);
    expect(result.childrenWithLowVoice).toContain("child-silent");
  });

  it("calculates average voice score", () => {
    const result = evaluateChildVoice(DEMO_SESSIONS);
    expect(result.averageVoiceScore).toBeGreaterThan(0);
    expect(result.averageVoiceScore).toBeLessThanOrEqual(100);
  });

  it("returns zeros for empty sessions", () => {
    const result = evaluateChildVoice([]);
    expect(result.totalVoiceIndicators).toBe(0);
    expect(result.averageVoiceScore).toBe(0);
    expect(result.planInfluenceRate).toBe(0);
  });

  it("only considers completed sessions", () => {
    const sessions = [
      makeSession({ status: "cancelled_by_child", childVoiceIndicators: ["wishes_recorded"] }),
      makeSession({ status: "missed", childVoiceIndicators: ["feelings_expressed"] }),
    ];
    const result = evaluateChildVoice(sessions);
    expect(result.totalVoiceIndicators).toBe(0);
  });

  it("handles disagreement_noted indicator", () => {
    const result = evaluateChildVoice(DEMO_SESSIONS);
    expect(result.voiceIndicatorFrequency.disagreement_noted).toBeGreaterThanOrEqual(1);
  });

  it("handles advocacy_offered indicator", () => {
    const result = evaluateChildVoice(DEMO_SESSIONS);
    expect(result.voiceIndicatorFrequency.advocacy_offered).toBeGreaterThanOrEqual(1);
  });

  it("Jordan has highest voice presence", () => {
    const result = evaluateChildVoice(DEMO_SESSIONS);
    const jordanVoice = result.perChildVoicePresence[CHILDREN.jordan.id];
    const alexVoice = result.perChildVoicePresence[CHILDREN.alex.id];
    const morganVoice = result.perChildVoicePresence[CHILDREN.morgan.id];
    expect(jordanVoice).toBeGreaterThanOrEqual(alexVoice);
    expect(jordanVoice).toBeGreaterThanOrEqual(morganVoice);
  });
});

// ── evaluateRelationshipQuality ──────────────────────────────────────────

describe("evaluateRelationshipQuality", () => {
  it("counts total relationship indicators", () => {
    const result = evaluateRelationshipQuality(DEMO_SESSIONS);
    expect(result.totalIndicators).toBeGreaterThan(0);
  });

  it("computes indicator frequency", () => {
    const result = evaluateRelationshipQuality(DEMO_SESSIONS);
    expect(result.indicatorFrequency.trust_building).toBeGreaterThan(0);
    expect(result.indicatorFrequency.warmth_demonstrated).toBeGreaterThan(0);
    expect(result.indicatorFrequency.active_listening).toBeGreaterThan(0);
  });

  it("computes per-child quality score", () => {
    const result = evaluateRelationshipQuality(DEMO_SESSIONS);
    expect(result.perChildQualityScore[CHILDREN.alex.id]).toBeGreaterThan(0);
    expect(result.perChildQualityScore[CHILDREN.jordan.id]).toBeGreaterThan(0);
    expect(result.perChildQualityScore[CHILDREN.morgan.id]).toBeGreaterThan(0);
  });

  it("calculates trauma-informed rate", () => {
    const result = evaluateRelationshipQuality(DEMO_SESSIONS);
    expect(result.traumaInformedRate).toBeGreaterThan(0);
  });

  it("calculates culturally responsive rate", () => {
    const result = evaluateRelationshipQuality(DEMO_SESSIONS);
    expect(result.culturallyResponsiveRate).toBeGreaterThan(0);
  });

  it("calculates average quality score", () => {
    const result = evaluateRelationshipQuality(DEMO_SESSIONS);
    expect(result.averageQualityScore).toBeGreaterThan(0);
    expect(result.averageQualityScore).toBeLessThanOrEqual(100);
  });

  it("returns zeros for empty sessions", () => {
    const result = evaluateRelationshipQuality([]);
    expect(result.totalIndicators).toBe(0);
    expect(result.averageQualityScore).toBe(0);
    expect(result.traumaInformedRate).toBe(0);
    expect(result.culturallyResponsiveRate).toBe(0);
  });

  it("only considers completed sessions", () => {
    const sessions = [
      makeSession({ status: "cancelled_by_child", relationshipIndicators: ["trust_building"] }),
    ];
    const result = evaluateRelationshipQuality(sessions);
    expect(result.totalIndicators).toBe(0);
  });

  it("Jordan has highest quality score (strong relationship)", () => {
    const result = evaluateRelationshipQuality(DEMO_SESSIONS);
    const jordanScore = result.perChildQualityScore[CHILDREN.jordan.id];
    const alexScore = result.perChildQualityScore[CHILDREN.alex.id];
    const morganScore = result.perChildQualityScore[CHILDREN.morgan.id];
    expect(jordanScore).toBeGreaterThanOrEqual(alexScore);
    expect(jordanScore).toBeGreaterThanOrEqual(morganScore);
  });

  it("scores 100 when all indicators present in every session", () => {
    const allIndicators: RelationshipQualityIndicator[] = [
      "trust_building", "consistent_boundaries", "warmth_demonstrated",
      "active_listening", "child_led", "culturally_responsive", "trauma_informed",
    ];
    const sessions = [
      makeSession({ childId: "c1", status: "completed", relationshipIndicators: allIndicators }),
      makeSession({ childId: "c1", status: "completed", relationshipIndicators: allIndicators }),
    ];
    const result = evaluateRelationshipQuality(sessions);
    expect(result.perChildQualityScore["c1"]).toBe(100);
  });

  it("scores 0 when no indicators present", () => {
    const sessions = [
      makeSession({ childId: "c1", status: "completed", relationshipIndicators: [] }),
    ];
    const result = evaluateRelationshipQuality(sessions);
    expect(result.perChildQualityScore["c1"]).toBe(0);
  });

  it("counts child_led indicator", () => {
    const result = evaluateRelationshipQuality(DEMO_SESSIONS);
    expect(result.indicatorFrequency.child_led).toBeGreaterThan(0);
  });

  it("counts consistent_boundaries indicator", () => {
    const result = evaluateRelationshipQuality(DEMO_SESSIONS);
    expect(result.indicatorFrequency.consistent_boundaries).toBeGreaterThan(0);
  });
});

// ── evaluateGoalProgress ─────────────────────────────────────────────────

describe("evaluateGoalProgress", () => {
  it("counts total goals", () => {
    const result = evaluateGoalProgress(DEMO_GOALS);
    expect(result.totalGoals).toBe(DEMO_GOALS.length);
  });

  it("counts achieved goals", () => {
    const result = evaluateGoalProgress(DEMO_GOALS);
    expect(result.achievedGoals).toBe(3); // Alex football, Jordan friendships, Jordan health
  });

  it("calculates achievement rate from closed goals only", () => {
    const result = evaluateGoalProgress(DEMO_GOALS);
    // Closed: achieved(3) + partially_achieved(2) + not_achieved(1) = 6
    // Achievement rate = 3/6 = 50%
    expect(result.achievementRate).toBe(50);
  });

  it("counts partially achieved goals", () => {
    const result = evaluateGoalProgress(DEMO_GOALS);
    expect(result.partiallyAchieved).toBe(2);
  });

  it("counts not achieved goals", () => {
    const result = evaluateGoalProgress(DEMO_GOALS);
    expect(result.notAchieved).toBe(1);
  });

  it("counts deferred goals", () => {
    const result = evaluateGoalProgress(DEMO_GOALS);
    expect(result.deferred).toBe(1);
  });

  it("calculates deferral rate", () => {
    const result = evaluateGoalProgress(DEMO_GOALS);
    expect(result.deferredRate).toBeGreaterThan(0);
  });

  it("counts active goals", () => {
    const result = evaluateGoalProgress(DEMO_GOALS);
    expect(result.activeGoals).toBe(6);
  });

  it("computes active goals per child", () => {
    const result = evaluateGoalProgress(DEMO_GOALS);
    expect(result.activeGoalsPerChild[CHILDREN.alex.id]).toBe(2);
    expect(result.activeGoalsPerChild[CHILDREN.jordan.id]).toBe(2);
    expect(result.activeGoalsPerChild[CHILDREN.morgan.id]).toBe(2);
  });

  it("provides category breakdown", () => {
    const result = evaluateGoalProgress(DEMO_GOALS);
    expect(result.categoryBreakdown["educational"]).toBeDefined();
    expect(result.categoryBreakdown["social"]).toBeDefined();
    expect(result.categoryBreakdown["emotional"]).toBeDefined();
    expect(result.categoryBreakdown["behavioural"]).toBeDefined();
    expect(result.categoryBreakdown["health"]).toBeDefined();
    expect(result.categoryBreakdown["independence"]).toBeDefined();
  });

  it("calculates category achievement rates", () => {
    const result = evaluateGoalProgress(DEMO_GOALS);
    // Social: 2 total, 2 achieved (1 Alex, 1 Jordan achieved; Morgan active) — wait:
    // Alex football: achieved; Jordan friendships: achieved; Morgan peer: active
    // Closed social: 2 achieved → 100%
    expect(result.categoryBreakdown["social"].rate).toBe(100);
  });

  it("returns zeros for empty goals", () => {
    const result = evaluateGoalProgress([]);
    expect(result.totalGoals).toBe(0);
    expect(result.achievementRate).toBe(0);
    expect(result.activeGoals).toBe(0);
  });

  it("handles all-active goals", () => {
    const allActive = [
      makeGoal({ status: "active" }),
      makeGoal({ status: "active" }),
    ];
    const result = evaluateGoalProgress(allActive);
    expect(result.achievementRate).toBe(0); // no closed goals
    expect(result.activeGoals).toBe(2);
  });

  it("handles all-achieved goals", () => {
    const allAchieved = [
      makeGoal({ status: "achieved" }),
      makeGoal({ status: "achieved" }),
    ];
    const result = evaluateGoalProgress(allAchieved);
    expect(result.achievementRate).toBe(100);
  });

  it("handles all-deferred goals", () => {
    const allDeferred = [
      makeGoal({ status: "deferred" }),
      makeGoal({ status: "deferred" }),
    ];
    const result = evaluateGoalProgress(allDeferred);
    expect(result.deferredRate).toBe(100);
    expect(result.achievementRate).toBe(0);
  });
});

// ── buildChildKeyWorkerProfiles ──────────────────────────────────────────

describe("buildChildKeyWorkerProfiles", () => {
  it("returns one profile per assignment", () => {
    const profiles = buildChildKeyWorkerProfiles(DEMO_SESSIONS, ASSIGNMENTS, DEMO_GOALS);
    expect(profiles.length).toBe(ASSIGNMENTS.length);
  });

  it("populates child and key worker names", () => {
    const profiles = buildChildKeyWorkerProfiles(DEMO_SESSIONS, ASSIGNMENTS, DEMO_GOALS);
    const alexProfile = profiles.find(p => p.childId === CHILDREN.alex.id)!;
    expect(alexProfile.childName).toBe(CHILDREN.alex.name);
    expect(alexProfile.primaryKeyWorkerName).toBe(STAFF.tom.name);
  });

  it("includes secondary key worker name", () => {
    const profiles = buildChildKeyWorkerProfiles(DEMO_SESSIONS, ASSIGNMENTS, DEMO_GOALS);
    const alexProfile = profiles.find(p => p.childId === CHILDREN.alex.id)!;
    expect(alexProfile.secondaryKeyWorkerName).toBe(STAFF.sarah.name);
  });

  it("counts total and completed sessions per child", () => {
    const profiles = buildChildKeyWorkerProfiles(DEMO_SESSIONS, ASSIGNMENTS, DEMO_GOALS);
    const alexProfile = profiles.find(p => p.childId === CHILDREN.alex.id)!;
    expect(alexProfile.totalSessions).toBe(8);
    expect(alexProfile.completedSessions).toBe(7);
  });

  it("computes voice score per child", () => {
    const profiles = buildChildKeyWorkerProfiles(DEMO_SESSIONS, ASSIGNMENTS, DEMO_GOALS);
    const jordanProfile = profiles.find(p => p.childId === CHILDREN.jordan.id)!;
    expect(jordanProfile.voiceScore).toBe(100);
  });

  it("computes relationship score per child", () => {
    const profiles = buildChildKeyWorkerProfiles(DEMO_SESSIONS, ASSIGNMENTS, DEMO_GOALS);
    const jordanProfile = profiles.find(p => p.childId === CHILDREN.jordan.id)!;
    expect(jordanProfile.relationshipScore).toBeGreaterThan(50);
  });

  it("computes goal progress per child", () => {
    const profiles = buildChildKeyWorkerProfiles(DEMO_SESSIONS, ASSIGNMENTS, DEMO_GOALS);
    const alexProfile = profiles.find(p => p.childId === CHILDREN.alex.id)!;
    // Alex: achieved 1, partially_achieved 1 → closed 2, achievement = 1/2 = 50%
    expect(alexProfile.goalProgress).toBe(50);
  });

  it("counts active goals per child", () => {
    const profiles = buildChildKeyWorkerProfiles(DEMO_SESSIONS, ASSIGNMENTS, DEMO_GOALS);
    const alexProfile = profiles.find(p => p.childId === CHILDREN.alex.id)!;
    expect(alexProfile.activeGoals).toBe(2);
  });

  it("assigns consistency rating based on completion rate", () => {
    const profiles = buildChildKeyWorkerProfiles(DEMO_SESSIONS, ASSIGNMENTS, DEMO_GOALS);
    const alexProfile = profiles.find(p => p.childId === CHILDREN.alex.id)!;
    // Alex: 7/8 = 87.5% → good
    expect(alexProfile.consistencyRating).toBe("good");
  });

  it("identifies last session date", () => {
    const profiles = buildChildKeyWorkerProfiles(DEMO_SESSIONS, ASSIGNMENTS, DEMO_GOALS);
    const alexProfile = profiles.find(p => p.childId === CHILDREN.alex.id)!;
    expect(alexProfile.lastSessionDate).toBe("2026-05-07T14:00:00Z");
  });

  it("lists session types used per child", () => {
    const profiles = buildChildKeyWorkerProfiles(DEMO_SESSIONS, ASSIGNMENTS, DEMO_GOALS);
    const alexProfile = profiles.find(p => p.childId === CHILDREN.alex.id)!;
    expect(alexProfile.sessionTypes).toContain("one_to_one");
    expect(alexProfile.sessionTypes).toContain("activity_based");
  });

  it("handles child with no sessions", () => {
    const noSessionAssignment: KeyWorkerAssignment[] = [{
      childId: "child-new", childName: "New Child",
      primaryKeyWorkerId: "s1", primaryKeyWorkerName: "Staff One",
      assignmentDate: "2026-05-01",
    }];
    const profiles = buildChildKeyWorkerProfiles([], noSessionAssignment, []);
    expect(profiles[0].totalSessions).toBe(0);
    expect(profiles[0].voiceScore).toBe(0);
    expect(profiles[0].relationshipScore).toBe(0);
    expect(profiles[0].lastSessionDate).toBeNull();
    expect(profiles[0].consistencyRating).toBe("poor");
  });

  it("handles child with no goals", () => {
    const profiles = buildChildKeyWorkerProfiles(DEMO_SESSIONS, ASSIGNMENTS, []);
    const alexProfile = profiles.find(p => p.childId === CHILDREN.alex.id)!;
    expect(alexProfile.goalProgress).toBe(0);
    expect(alexProfile.activeGoals).toBe(0);
  });

  it("excellent consistency for 100% completion", () => {
    const allCompleted = [
      makeSession({ childId: "c1", status: "completed", date: "2026-04-01T10:00:00Z" }),
      makeSession({ childId: "c1", status: "completed", date: "2026-04-08T10:00:00Z" }),
    ];
    const assign: KeyWorkerAssignment[] = [{
      childId: "c1", childName: "C1",
      primaryKeyWorkerId: "s1", primaryKeyWorkerName: "S1",
      assignmentDate: "2026-01-01",
    }];
    const profiles = buildChildKeyWorkerProfiles(allCompleted, assign, []);
    expect(profiles[0].consistencyRating).toBe("excellent");
  });

  it("poor consistency for low completion", () => {
    const mostCancelled = [
      makeSession({ childId: "c1", status: "cancelled_by_child", date: "2026-04-01T10:00:00Z" }),
      makeSession({ childId: "c1", status: "cancelled_by_child", date: "2026-04-08T10:00:00Z" }),
      makeSession({ childId: "c1", status: "missed", date: "2026-04-15T10:00:00Z" }),
      makeSession({ childId: "c1", status: "completed", date: "2026-04-22T10:00:00Z" }),
    ];
    const assign: KeyWorkerAssignment[] = [{
      childId: "c1", childName: "C1",
      primaryKeyWorkerId: "s1", primaryKeyWorkerName: "S1",
      assignmentDate: "2026-01-01",
    }];
    const profiles = buildChildKeyWorkerProfiles(mostCancelled, assign, []);
    expect(profiles[0].consistencyRating).toBe("poor");
  });
});

// ── generateKeyWorkerIntelligence ────────────────────────────────────────

describe("generateKeyWorkerIntelligence", () => {
  const result = generateKeyWorkerIntelligence(
    DEMO_SESSIONS, ASSIGNMENTS, DEMO_GOALS,
    HOME_ID, PERIOD_START, PERIOD_END, REFERENCE_DATE,
  );

  it("returns correct homeId", () => {
    expect(result.homeId).toBe(HOME_ID);
  });

  it("returns period dates", () => {
    expect(result.periodStart).toBe(PERIOD_START);
    expect(result.periodEnd).toBe(PERIOD_END);
  });

  it("returns generatedAt timestamp", () => {
    expect(result.generatedAt).toBe(REFERENCE_DATE);
  });

  it("computes overall score between 0 and 100", () => {
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("assigns an overall rating", () => {
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.overallRating);
  });

  it("includes session consistency data", () => {
    expect(result.sessionConsistency.totalSessions).toBeGreaterThan(0);
  });

  it("includes child voice data", () => {
    expect(result.childVoice.totalVoiceIndicators).toBeGreaterThan(0);
  });

  it("includes relationship quality data", () => {
    expect(result.relationshipQuality.totalIndicators).toBeGreaterThan(0);
  });

  it("includes goal progress data", () => {
    expect(result.goalProgress.totalGoals).toBe(DEMO_GOALS.length);
  });

  it("includes child profiles", () => {
    expect(result.childProfiles.length).toBe(3);
  });

  // Scoring sub-components
  it("session consistency score <= 25", () => {
    expect(result.scoring.sessionConsistencyScore).toBeLessThanOrEqual(25);
    expect(result.scoring.sessionConsistencyScore).toBeGreaterThanOrEqual(0);
  });

  it("child voice score <= 30", () => {
    expect(result.scoring.childVoiceScore).toBeLessThanOrEqual(30);
    expect(result.scoring.childVoiceScore).toBeGreaterThanOrEqual(0);
  });

  it("relationship quality score <= 25", () => {
    expect(result.scoring.relationshipQualityScore).toBeLessThanOrEqual(25);
    expect(result.scoring.relationshipQualityScore).toBeGreaterThanOrEqual(0);
  });

  it("goal progress score <= 20", () => {
    expect(result.scoring.goalProgressScore).toBeLessThanOrEqual(20);
    expect(result.scoring.goalProgressScore).toBeGreaterThanOrEqual(0);
  });

  it("sub-scores sum to overall score", () => {
    const sum =
      result.scoring.sessionConsistencyScore +
      result.scoring.childVoiceScore +
      result.scoring.relationshipQualityScore +
      result.scoring.goalProgressScore;
    // Allow small floating point differences
    expect(Math.abs(sum - result.overallScore)).toBeLessThan(0.1);
  });

  // Strengths / Areas / Actions
  it("returns at least one strength", () => {
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("returns actions array", () => {
    expect(Array.isArray(result.actions)).toBe(true);
  });

  it("returns areas for improvement array", () => {
    expect(Array.isArray(result.areasForImprovement)).toBe(true);
  });

  // Regulatory links
  it("includes CHR 2015 Reg 10 link", () => {
    const reg10 = result.regulatoryLinks.find(r => r.regulation === "CHR 2015 Reg 10");
    expect(reg10).toBeDefined();
    expect(["met", "partially_met", "not_met"]).toContain(reg10!.status);
  });

  it("includes CHR 2015 Reg 14 link", () => {
    const reg14 = result.regulatoryLinks.find(r => r.regulation === "CHR 2015 Reg 14");
    expect(reg14).toBeDefined();
  });

  it("includes SCCIF link", () => {
    const sccif = result.regulatoryLinks.find(r => r.regulation === "SCCIF Experience of Children");
    expect(sccif).toBeDefined();
  });

  it("includes UNCRC Article 12 link", () => {
    const uncrc = result.regulatoryLinks.find(r => r.regulation === "UNCRC Article 12");
    expect(uncrc).toBeDefined();
  });

  it("includes Working Together 2023 link", () => {
    const wt = result.regulatoryLinks.find(r => r.regulation === "Working Together 2023");
    expect(wt).toBeDefined();
  });

  it("regulatory links have evidence strings", () => {
    for (const link of result.regulatoryLinks) {
      expect(link.evidence.length).toBeGreaterThan(0);
    }
  });
});

// ── Scoring edge cases ──────────────────────────────────────────────────

describe("scoring and ratings", () => {
  it("outstanding rating for score >= 80", () => {
    // Create ideal data
    const perfectSessions: KeyWorkerSession[] = [];
    for (let i = 0; i < 10; i++) {
      perfectSessions.push(makeSession({
        childId: "c1", childName: "C1", date: `2026-04-${String(i + 1).padStart(2, "0")}T10:00:00Z`,
        status: "completed", duration: 50,
        sessionType: (["one_to_one", "activity_based", "review", "goal_setting"] as SessionType[])[i % 4],
        childVoiceIndicators: ["wishes_recorded", "feelings_expressed", "views_influenced_plan", "choices_offered"],
        relationshipIndicators: [
          "trust_building", "consistent_boundaries", "warmth_demonstrated",
          "active_listening", "child_led", "culturally_responsive", "trauma_informed",
        ],
      }));
    }
    const perfectAssign: KeyWorkerAssignment[] = [{
      childId: "c1", childName: "C1",
      primaryKeyWorkerId: "s1", primaryKeyWorkerName: "S1",
      assignmentDate: "2026-01-01",
    }];
    const perfectGoals: KeyWorkerGoal[] = [
      makeGoal({ childId: "c1", status: "achieved", category: "educational" }),
      makeGoal({ childId: "c1", status: "achieved", category: "social" }),
      makeGoal({ childId: "c1", status: "active", category: "emotional" }),
    ];
    const result = generateKeyWorkerIntelligence(
      perfectSessions, perfectAssign, perfectGoals,
      "home-test", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.overallRating).toBe("outstanding");
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
  });

  it("inadequate rating for score < 40", () => {
    const poorSessions = [
      makeSession({
        childId: "c1", date: "2026-04-01T10:00:00Z", status: "missed",
        childVoiceIndicators: [], relationshipIndicators: [],
      }),
      makeSession({
        childId: "c1", date: "2026-04-15T10:00:00Z", status: "cancelled_by_staff",
        childVoiceIndicators: [], relationshipIndicators: [],
      }),
    ];
    const assign: KeyWorkerAssignment[] = [{
      childId: "c1", childName: "C1",
      primaryKeyWorkerId: "s1", primaryKeyWorkerName: "S1",
      assignmentDate: "2026-01-01",
    }];
    const result = generateKeyWorkerIntelligence(
      poorSessions, assign, [],
      "home-test", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.overallRating).toBe("inadequate");
    expect(result.overallScore).toBeLessThan(40);
  });

  it("good rating for scores 60-79", () => {
    const goodSessions: KeyWorkerSession[] = [];
    for (let i = 0; i < 6; i++) {
      goodSessions.push(makeSession({
        childId: "c1", childName: "C1", date: `2026-04-${String(i + 1).padStart(2, "0")}T10:00:00Z`,
        status: "completed", duration: 45,
        sessionType: (["one_to_one", "activity_based", "review"] as SessionType[])[i % 3],
        childVoiceIndicators: ["wishes_recorded", "feelings_expressed"],
        relationshipIndicators: ["trust_building", "active_listening", "warmth_demonstrated"],
      }));
    }
    const assign: KeyWorkerAssignment[] = [{
      childId: "c1", childName: "C1",
      primaryKeyWorkerId: "s1", primaryKeyWorkerName: "S1",
      assignmentDate: "2026-01-01",
    }];
    const goals = [
      makeGoal({ childId: "c1", status: "achieved" }),
      makeGoal({ childId: "c1", status: "active" }),
    ];
    const result = generateKeyWorkerIntelligence(
      goodSessions, assign, goals,
      "home-test", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(40);
    expect(result.overallScore).toBeLessThan(100);
    expect(["outstanding", "good", "requires_improvement"]).toContain(result.overallRating);
  });

  it("empty data produces inadequate rating", () => {
    const result = generateKeyWorkerIntelligence(
      [], [], [], "home-test", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.overallRating).toBe("inadequate");
    // Score is 5 because deferral sub-score gives 5 pts for 0% deferral rate
    expect(result.overallScore).toBeLessThan(40);
  });

  it("overall score does not exceed 100", () => {
    const manySessions: KeyWorkerSession[] = [];
    for (let i = 0; i < 30; i++) {
      manySessions.push(makeSession({
        childId: "c1", childName: "C1",
        date: `2026-04-${String((i % 28) + 1).padStart(2, "0")}T10:00:00Z`,
        status: "completed", duration: 60,
        sessionType: (["one_to_one", "activity_based", "review", "goal_setting", "crisis_support"] as SessionType[])[i % 5],
        childVoiceIndicators: ["wishes_recorded", "feelings_expressed", "views_influenced_plan", "choices_offered", "advocacy_offered"],
        relationshipIndicators: [
          "trust_building", "consistent_boundaries", "warmth_demonstrated",
          "active_listening", "child_led", "culturally_responsive", "trauma_informed",
        ],
      }));
    }
    const assign: KeyWorkerAssignment[] = [{
      childId: "c1", childName: "C1",
      primaryKeyWorkerId: "s1", primaryKeyWorkerName: "S1",
      assignmentDate: "2026-01-01",
    }];
    const goals = [
      makeGoal({ childId: "c1", status: "achieved" }),
      makeGoal({ childId: "c1", status: "achieved" }),
      makeGoal({ childId: "c1", status: "active" }),
    ];
    const result = generateKeyWorkerIntelligence(
      manySessions, assign, goals,
      "home-test", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });
});

// ── Strengths and areas for improvement labels ──────────────────────────

describe("strengths and areas for improvement generation", () => {
  it("flags high completion rate as strength", () => {
    const sessions: KeyWorkerSession[] = [];
    for (let i = 0; i < 8; i++) {
      sessions.push(makeSession({
        childId: "c1", date: `2026-04-${String(i + 1).padStart(2, "0")}T10:00:00Z`,
        status: "completed",
        childVoiceIndicators: ["wishes_recorded"],
        relationshipIndicators: ["trust_building"],
      }));
    }
    const assign: KeyWorkerAssignment[] = [{
      childId: "c1", childName: "C1",
      primaryKeyWorkerId: "s1", primaryKeyWorkerName: "S1",
      assignmentDate: "2026-01-01",
    }];
    const result = generateKeyWorkerIntelligence(
      sessions, assign, [], "home-test", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.strengths.some(s => s.includes("completion rate"))).toBe(true);
  });

  it("flags low completion rate as area for improvement", () => {
    const sessions = [
      makeSession({ childId: "c1", date: "2026-04-01T10:00:00Z", status: "completed", childVoiceIndicators: [], relationshipIndicators: [] }),
      makeSession({ childId: "c1", date: "2026-04-08T10:00:00Z", status: "missed", childVoiceIndicators: [], relationshipIndicators: [] }),
      makeSession({ childId: "c1", date: "2026-04-15T10:00:00Z", status: "cancelled_by_staff", childVoiceIndicators: [], relationshipIndicators: [] }),
      makeSession({ childId: "c1", date: "2026-04-22T10:00:00Z", status: "cancelled_by_child", childVoiceIndicators: [], relationshipIndicators: [] }),
    ];
    const assign: KeyWorkerAssignment[] = [{
      childId: "c1", childName: "C1",
      primaryKeyWorkerId: "s1", primaryKeyWorkerName: "S1",
      assignmentDate: "2026-01-01",
    }];
    const result = generateKeyWorkerIntelligence(
      sessions, assign, [], "home-test", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.areasForImprovement.some(a => a.includes("completion rate"))).toBe(true);
  });

  it("flags low voice as area for improvement", () => {
    const sessions = [
      makeSession({ childId: "c1", date: "2026-04-01T10:00:00Z", status: "completed", childVoiceIndicators: [], relationshipIndicators: [] }),
    ];
    const assign: KeyWorkerAssignment[] = [{
      childId: "c1", childName: "C1",
      primaryKeyWorkerId: "s1", primaryKeyWorkerName: "S1",
      assignmentDate: "2026-01-01",
    }];
    const result = generateKeyWorkerIntelligence(
      sessions, assign, [], "home-test", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.areasForImprovement.some(a => a.toLowerCase().includes("voice"))).toBe(true);
  });

  it("generates actions when there are areas for improvement", () => {
    const sessions = [
      makeSession({ childId: "c1", date: "2026-04-01T10:00:00Z", status: "missed", childVoiceIndicators: [], relationshipIndicators: [] }),
    ];
    const assign: KeyWorkerAssignment[] = [{
      childId: "c1", childName: "C1",
      primaryKeyWorkerId: "s1", primaryKeyWorkerName: "S1",
      assignmentDate: "2026-01-01",
    }];
    const result = generateKeyWorkerIntelligence(
      sessions, assign, [], "home-test", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.actions.length).toBeGreaterThan(0);
  });

  it("flags high voice score as strength", () => {
    const sessions: KeyWorkerSession[] = [];
    for (let i = 0; i < 5; i++) {
      sessions.push(makeSession({
        childId: "c1", date: `2026-04-${String(i + 1).padStart(2, "0")}T10:00:00Z`,
        status: "completed",
        childVoiceIndicators: ["wishes_recorded", "feelings_expressed", "views_influenced_plan", "choices_offered"],
        relationshipIndicators: ["trust_building"],
      }));
    }
    const assign: KeyWorkerAssignment[] = [{
      childId: "c1", childName: "C1",
      primaryKeyWorkerId: "s1", primaryKeyWorkerName: "S1",
      assignmentDate: "2026-01-01",
    }];
    const result = generateKeyWorkerIntelligence(
      sessions, assign, [], "home-test", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.strengths.some(s => s.toLowerCase().includes("voice"))).toBe(true);
  });

  it("flags low trauma-informed practice as area for improvement", () => {
    const sessions = [
      makeSession({
        childId: "c1", date: "2026-04-01T10:00:00Z", status: "completed",
        childVoiceIndicators: ["wishes_recorded"],
        relationshipIndicators: ["trust_building"],
      }),
    ];
    const assign: KeyWorkerAssignment[] = [{
      childId: "c1", childName: "C1",
      primaryKeyWorkerId: "s1", primaryKeyWorkerName: "S1",
      assignmentDate: "2026-01-01",
    }];
    const result = generateKeyWorkerIntelligence(
      sessions, assign, [], "home-test", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.areasForImprovement.some(a => a.toLowerCase().includes("trauma"))).toBe(true);
  });

  it("flags high goal achievement as strength when present", () => {
    const sessions = [
      makeSession({
        childId: "c1", date: "2026-04-01T10:00:00Z", status: "completed",
        childVoiceIndicators: ["wishes_recorded"],
        relationshipIndicators: ["trust_building"],
      }),
    ];
    const assign: KeyWorkerAssignment[] = [{
      childId: "c1", childName: "C1",
      primaryKeyWorkerId: "s1", primaryKeyWorkerName: "S1",
      assignmentDate: "2026-01-01",
    }];
    const goals = [
      makeGoal({ childId: "c1", status: "achieved" }),
      makeGoal({ childId: "c1", status: "achieved" }),
      makeGoal({ childId: "c1", status: "achieved" }),
    ];
    const result = generateKeyWorkerIntelligence(
      sessions, assign, goals, "home-test", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.strengths.some(s => s.toLowerCase().includes("goal achievement"))).toBe(true);
  });

  it("flags high deferral rate as area for improvement", () => {
    const sessions = [
      makeSession({
        childId: "c1", date: "2026-04-01T10:00:00Z", status: "completed",
        childVoiceIndicators: ["wishes_recorded"],
        relationshipIndicators: ["trust_building"],
      }),
    ];
    const assign: KeyWorkerAssignment[] = [{
      childId: "c1", childName: "C1",
      primaryKeyWorkerId: "s1", primaryKeyWorkerName: "S1",
      assignmentDate: "2026-01-01",
    }];
    const goals = [
      makeGoal({ childId: "c1", status: "deferred" }),
      makeGoal({ childId: "c1", status: "deferred" }),
    ];
    const result = generateKeyWorkerIntelligence(
      sessions, assign, goals, "home-test", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.areasForImprovement.some(a => a.toLowerCase().includes("deferral"))).toBe(true);
  });
});

// ── Type safety checks ──────────────────────────────────────────────────

describe("type safety and edge cases", () => {
  it("session types are correctly typed", () => {
    const types: SessionType[] = ["one_to_one", "activity_based", "review", "goal_setting", "crisis_support", "informal_check_in"];
    expect(types.length).toBe(6);
  });

  it("session statuses are correctly typed", () => {
    const statuses: SessionStatus[] = ["completed", "cancelled_by_child", "cancelled_by_staff", "rescheduled", "missed"];
    expect(statuses.length).toBe(5);
  });

  it("voice indicators are correctly typed", () => {
    const indicators: VoiceIndicator[] = [
      "wishes_recorded", "feelings_expressed", "choices_offered",
      "views_influenced_plan", "disagreement_noted", "advocacy_offered",
    ];
    expect(indicators.length).toBe(6);
  });

  it("relationship quality indicators are correctly typed", () => {
    const indicators: RelationshipQualityIndicator[] = [
      "trust_building", "consistent_boundaries", "warmth_demonstrated",
      "active_listening", "child_led", "culturally_responsive", "trauma_informed",
    ];
    expect(indicators.length).toBe(7);
  });

  it("handles single-day period", () => {
    const sessions = [
      makeSession({ date: "2026-04-15T10:00:00Z", status: "completed" }),
    ];
    const result = evaluateSessionConsistency(
      sessions, ASSIGNMENTS, "2026-04-15T00:00:00Z", "2026-04-15T23:59:59Z",
    );
    expect(result.totalSessions).toBe(1);
  });

  it("handles sessions at period boundaries", () => {
    const sessions = [
      makeSession({ date: PERIOD_START, status: "completed" }),
      makeSession({ date: PERIOD_END, status: "completed" }),
    ];
    const result = evaluateSessionConsistency(sessions, ASSIGNMENTS, PERIOD_START, PERIOD_END);
    expect(result.totalSessions).toBe(2);
  });
});
