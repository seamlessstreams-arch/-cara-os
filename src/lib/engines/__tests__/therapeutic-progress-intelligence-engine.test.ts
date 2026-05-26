import { describe, it, expect } from "vitest";
import {
  computeTherapeuticProgress,
  type TherapeuticProgressInput,
  type TherapySessionInput,
  type KeyworkSessionInput,
  type BehaviourEntryInput,
  type OutcomeTargetInput,
  type OutcomeReviewInput,
  type CamhsReferralInput,
  type MentalHealthCheckInInput,
  type ChildIncidentInput,
  type RestraintRecordInput,
} from "../therapeutic-progress-intelligence-engine";

// ── Helpers ────────────────────────────────────────────────────────────────

function makeTherapySession(overrides: Partial<TherapySessionInput> = {}): TherapySessionInput {
  return {
    id: "ts1",
    session_date: "2026-05-20",
    modality: "cbt",
    therapist_name: "Dr Williams",
    attended: true,
    child_presentation: "calm",
    pre_session_mood: 4,
    post_session_mood: 6,
    escalation_flags: [],
    general_theme: "emotional regulation",
    ...overrides,
  };
}

function makeKeywork(overrides: Partial<KeyworkSessionInput> = {}): KeyworkSessionInput {
  return {
    id: "kw1",
    date: "2026-05-18",
    type: "one_to_one",
    duration: 45,
    mood_before: 4,
    mood_after: 5,
    topics: ["feelings", "friendships"],
    child_voice: "Feeling okay today",
    actions_agreed: ["try breathing exercise"],
    follow_up_completed: true,
    ...overrides,
  };
}

function makeOutcomeTarget(overrides: Partial<OutcomeTargetInput> = {}): OutcomeTargetInput {
  return {
    id: "ot1",
    domain: "emotional_wellbeing",
    target: "Develop coping strategies for anxiety",
    status: "active",
    direction: "improving",
    baseline_score: 3,
    current_score: 6,
    created_at: "2026-01-15",
    ...overrides,
  };
}

function baseInput(overrides: Partial<TherapeuticProgressInput> = {}): TherapeuticProgressInput {
  return {
    today: "2026-05-26",
    child_id: "child_1",
    child_name: "Alex",
    placement_start_date: "2025-09-01",
    therapy_sessions: [
      makeTherapySession({ id: "ts1", session_date: "2026-05-20" }),
      makeTherapySession({ id: "ts2", session_date: "2026-05-13" }),
      makeTherapySession({ id: "ts3", session_date: "2026-05-06" }),
      makeTherapySession({ id: "ts4", session_date: "2026-04-29", pre_session_mood: 3, post_session_mood: 5 }),
    ],
    keywork_sessions: [
      makeKeywork({ id: "kw1", date: "2026-05-22" }),
      makeKeywork({ id: "kw2", date: "2026-05-15", type: "therapeutic", mood_before: 3, mood_after: 5 }),
      makeKeywork({ id: "kw3", date: "2026-05-08" }),
    ],
    behaviour_entries: [
      { date: "2026-05-20", type: "verbal", severity: "low", trigger: "transition", de_escalation_used: true, response_effective: true },
      { date: "2026-05-10", type: "verbal", severity: "medium", trigger: "peer conflict", de_escalation_used: true, response_effective: true },
    ],
    outcome_targets: [
      makeOutcomeTarget({ id: "ot1", direction: "improving" }),
      makeOutcomeTarget({ id: "ot2", domain: "education", target: "Attend school 80%", direction: "stable", baseline_score: 5, current_score: 6 }),
    ],
    outcome_reviews: [],
    camhs_referrals: [],
    mental_health_check_ins: [
      { date: "2026-05-20", overall_mood: 6, anxiety_level: 3, sleep_quality: 7, self_harm_risk: "none", stressors: [] },
    ],
    incidents: [],
    restraint_records: [],
    ...overrides,
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("Therapeutic Progress Intelligence Engine", () => {
  it("produces result with all required fields", () => {
    const result = computeTherapeuticProgress(baseInput());
    expect(result.generated_at).toBe("2026-05-26");
    expect(result.child_id).toBe("child_1");
    expect(result.child_name).toBe("Alex");
    expect(result.placement_duration_days).toBeGreaterThan(200);
    expect(result.overall_trajectory).toBeDefined();
    expect(result.overall_progress_score).toBeGreaterThanOrEqual(0);
    expect(result.overall_progress_score).toBeLessThanOrEqual(100);
    expect(result.headline).toContain("Alex");
    expect(result.therapy_engagement).toBeDefined();
    expect(result.mood_trajectory).toBeDefined();
    expect(result.behaviour_trajectory).toBeDefined();
    expect(result.keywork_effectiveness).toBeDefined();
    expect(result.outcome_progress).toBeDefined();
    expect(result.camhs_status).toBeDefined();
    expect(result.concern_level).toBeDefined();
  });

  it("computes positive trajectory for well-progressing child", () => {
    const result = computeTherapeuticProgress(baseInput());
    expect(["improving", "stable"]).toContain(result.overall_trajectory);
    expect(result.overall_progress_score).toBeGreaterThanOrEqual(55);
    expect(result.concern_level).toBe("none");
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("computes therapy engagement correctly", () => {
    const result = computeTherapeuticProgress(baseInput());
    expect(result.therapy_engagement.total_sessions).toBe(4);
    expect(result.therapy_engagement.attended).toBe(4);
    expect(result.therapy_engagement.attendance_rate).toBe(100);
    expect(["excellent", "good"]).toContain(result.therapy_engagement.engagement_level);
    expect(result.therapy_engagement.average_mood_improvement).toBeGreaterThan(0);
    expect(result.therapy_engagement.modalities_used).toContain("cbt");
  });

  it("flags poor therapy attendance", () => {
    const result = computeTherapeuticProgress(baseInput({
      therapy_sessions: [
        makeTherapySession({ id: "ts1", attended: false, reason_if_missed: "refused" }),
        makeTherapySession({ id: "ts2", session_date: "2026-05-13", attended: false }),
        makeTherapySession({ id: "ts3", session_date: "2026-05-06", attended: true }),
        makeTherapySession({ id: "ts4", session_date: "2026-04-29", attended: false }),
      ],
    }));
    expect(result.therapy_engagement.attendance_rate).toBe(25);
    expect(["poor", "inconsistent"]).toContain(result.therapy_engagement.engagement_level);
    const concern = result.concerns.find((c) => c.toLowerCase().includes("attendance"));
    expect(concern).toBeDefined();
  });

  it("computes behaviour trajectory — improving", () => {
    const result = computeTherapeuticProgress(baseInput({
      behaviour_entries: [
        { date: "2026-05-20", type: "verbal", severity: "low", trigger: "transition", de_escalation_used: true, response_effective: true },
      ],
      incidents: [
        { date: "2026-05-20", type: "verbal", severity: "low" },
        { date: "2026-04-20", type: "verbal", severity: "medium" },
        { date: "2026-04-15", type: "physical", severity: "high" },
        { date: "2026-04-10", type: "verbal", severity: "medium" },
      ],
      restraint_records: [
        { date: "2026-04-15", duration_minutes: 5, type: "physical" },
      ],
    }));
    expect(result.behaviour_trajectory.incidents_last_30d).toBe(1);
    expect(result.behaviour_trajectory.incidents_previous_30d).toBe(3);
    expect(result.behaviour_trajectory.direction).toBe("improving");
    expect(result.behaviour_trajectory.restraints_last_30d).toBe(0);
    expect(result.behaviour_trajectory.restraints_previous_30d).toBe(1);
  });

  it("detects declining behaviour with escalating restraints", () => {
    const result = computeTherapeuticProgress(baseInput({
      behaviour_entries: [],
      incidents: [
        { date: "2026-05-24", type: "physical", severity: "high" },
        { date: "2026-05-22", type: "physical", severity: "high" },
        { date: "2026-05-20", type: "verbal", severity: "medium" },
        { date: "2026-05-18", type: "physical", severity: "critical" },
        { date: "2026-04-20", type: "verbal", severity: "low" },
      ],
      restraint_records: [
        { date: "2026-05-24", duration_minutes: 8, type: "physical" },
        { date: "2026-05-22", duration_minutes: 5, type: "physical" },
        { date: "2026-05-18", duration_minutes: 12, type: "physical" },
      ],
    }));
    expect(result.behaviour_trajectory.direction).toBe("declining");
    expect(result.behaviour_trajectory.restraints_last_30d).toBe(3);
    const concern = result.concerns.find((c) => c.includes("restraint"));
    expect(concern).toBeDefined();
  });

  it("computes keywork effectiveness metrics", () => {
    const result = computeTherapeuticProgress(baseInput());
    expect(result.keywork_effectiveness.total_sessions).toBe(3);
    expect(result.keywork_effectiveness.sessions_last_30d).toBe(3);
    expect(result.keywork_effectiveness.average_mood_lift).toBeGreaterThan(0);
    expect(result.keywork_effectiveness.action_completion_rate).toBeGreaterThan(0);
  });

  it("computes outcome progress summary", () => {
    const result = computeTherapeuticProgress(baseInput());
    expect(result.outcome_progress.total_targets).toBe(2);
    expect(result.outcome_progress.improving).toBe(1);
    expect(result.outcome_progress.stable).toBe(1);
    expect(result.outcome_progress.declining).toBe(0);
  });

  it("flags critical concern with self-harm risk and declining mood", () => {
    const result = computeTherapeuticProgress(baseInput({
      therapy_sessions: [
        makeTherapySession({ attended: true, pre_session_mood: 2, post_session_mood: 2, escalation_flags: ["self_harm", "suicidal_ideation"] }),
        makeTherapySession({ id: "ts2", session_date: "2026-05-13", attended: true, pre_session_mood: 3, post_session_mood: 2, escalation_flags: ["self_harm"] }),
      ],
      mental_health_check_ins: [
        { date: "2026-05-20", overall_mood: 2, anxiety_level: 8, sleep_quality: 3, self_harm_risk: "high", stressors: ["bullying", "family"] },
        { date: "2026-05-10", overall_mood: 3, anxiety_level: 7, sleep_quality: 4, self_harm_risk: "active", stressors: ["family"] },
      ],
      keywork_sessions: [
        makeKeywork({ mood_before: 2, mood_after: 2 }),
      ],
      incidents: [
        { date: "2026-05-22", type: "self_harm", severity: "critical" },
        { date: "2026-05-18", type: "self_harm", severity: "high" },
        { date: "2026-05-15", type: "self_harm", severity: "high" },
      ],
    }));
    expect(["critical", "significant"]).toContain(result.concern_level);
    const selfHarmConcern = result.concerns.find((c) => c.toLowerCase().includes("self-harm"));
    expect(selfHarmConcern).toBeDefined();
    const criticalInsight = result.insights.find((i) => i.severity === "critical");
    expect(criticalInsight).toBeDefined();
  });

  it("detects CAMHS waiting and flags appropriately", () => {
    const result = computeTherapeuticProgress(baseInput({
      camhs_referrals: [
        {
          id: "camhs_1",
          referral_date: "2026-02-01",
          referral_status: "waiting",
          current_therapeutic_approach: "CBT",
          sessions_held: 0,
          sessions_scheduled: 0,
          engagement_level: "none",
          waiting_time_weeks: 16,
        },
      ],
    }));
    expect(result.camhs_status.waiting).toBe(true);
    expect(result.camhs_status.waiting_weeks).toBe(16);
    const concern = result.concerns.find((c) => c.toLowerCase().includes("camhs"));
    expect(concern).toBeDefined();
    const rec = result.recommendations.find((r) => r.domain === "camhs");
    expect(rec).toBeDefined();
  });

  it("generates positive insights for strong progress", () => {
    const result = computeTherapeuticProgress(baseInput({
      outcome_targets: [
        makeOutcomeTarget({ id: "ot1", direction: "improving", status: "achieved" }),
        makeOutcomeTarget({ id: "ot2", direction: "improving" }),
      ],
    }));
    const positive = result.insights.filter((i) => i.severity === "positive");
    expect(positive.length).toBeGreaterThan(0);
  });

  it("computes mood trajectory from multiple data sources", () => {
    const result = computeTherapeuticProgress(baseInput({
      therapy_sessions: [
        makeTherapySession({ session_date: "2026-05-20", post_session_mood: 7 }),
        makeTherapySession({ id: "ts2", session_date: "2026-05-13", post_session_mood: 6 }),
      ],
      keywork_sessions: [
        makeKeywork({ date: "2026-05-22", mood_after: 6 }),
        makeKeywork({ id: "kw2", date: "2026-05-15", mood_after: 5 }),
      ],
      mental_health_check_ins: [
        { date: "2026-05-20", overall_mood: 6, anxiety_level: 3, sleep_quality: 7, self_harm_risk: "none", stressors: [] },
        { date: "2026-04-20", overall_mood: 4, anxiety_level: 5, sleep_quality: 5, self_harm_risk: "none", stressors: ["school"] },
      ],
    }));
    expect(result.mood_trajectory.data_points).toBeGreaterThanOrEqual(4);
    expect(result.mood_trajectory.direction).toBe("improving");
  });

  it("handles child with no therapy or data gracefully", () => {
    const result = computeTherapeuticProgress({
      today: "2026-05-26",
      child_id: "child_2",
      child_name: "Jordan",
      placement_start_date: "2026-04-01",
      therapy_sessions: [],
      keywork_sessions: [],
      behaviour_entries: [],
      outcome_targets: [],
      outcome_reviews: [],
      camhs_referrals: [],
      mental_health_check_ins: [],
      incidents: [],
      restraint_records: [],
    });
    expect(result.overall_trajectory).toBe("insufficient_data");
    expect(result.therapy_engagement.total_sessions).toBe(0);
    expect(result.mood_trajectory.direction).toBe("insufficient_data");
    expect(result.headline).toContain("Jordan");
    expect(result.headline).toContain("insufficient");
  });

  it("builds recommendations from concerns", () => {
    const result = computeTherapeuticProgress(baseInput({
      therapy_sessions: [
        makeTherapySession({ attended: false }),
        makeTherapySession({ id: "ts2", session_date: "2026-05-13", attended: false }),
        makeTherapySession({ id: "ts3", session_date: "2026-05-06", attended: true }),
        makeTherapySession({ id: "ts4", session_date: "2026-04-29", attended: false }),
      ],
      keywork_sessions: [
        makeKeywork({ date: "2026-05-22", actions_agreed: ["do homework"], follow_up_completed: false }),
        makeKeywork({ id: "kw2", date: "2026-05-15", actions_agreed: ["phone mum"], follow_up_completed: false }),
        makeKeywork({ id: "kw3", date: "2026-05-08", actions_agreed: ["tidy room"], follow_up_completed: false }),
        makeKeywork({ id: "kw4", date: "2026-05-01", actions_agreed: ["try yoga"], follow_up_completed: false }),
      ],
      behaviour_entries: [],
      incidents: [
        { date: "2026-05-24", type: "physical", severity: "high" },
        { date: "2026-05-22", type: "verbal", severity: "medium" },
        { date: "2026-05-20", type: "physical", severity: "high" },
      ],
      restraint_records: [
        { date: "2026-05-24", duration_minutes: 8, type: "physical" },
        { date: "2026-05-20", duration_minutes: 5, type: "physical" },
      ],
    }));
    expect(result.recommendations.length).toBeGreaterThan(0);
    const therapyRec = result.recommendations.find((r) => r.domain === "therapy");
    expect(therapyRec).toBeDefined();
    const keyworkRec = result.recommendations.find((r) => r.domain === "keywork");
    expect(keyworkRec).toBeDefined();
  });

  it("detects de-escalation success rate", () => {
    const result = computeTherapeuticProgress(baseInput({
      behaviour_entries: [
        { date: "2026-05-20", type: "verbal", severity: "low", trigger: "transition", de_escalation_used: true, response_effective: true },
        { date: "2026-05-18", type: "verbal", severity: "medium", trigger: "peer", de_escalation_used: true, response_effective: true },
        { date: "2026-05-15", type: "physical", severity: "high", trigger: "frustration", de_escalation_used: true, response_effective: false },
        { date: "2026-05-10", type: "verbal", severity: "low", de_escalation_used: true, response_effective: true },
      ],
    }));
    expect(result.behaviour_trajectory.de_escalation_success_rate).toBe(75);
  });

  it("computes therapeutic keywork session percentage", () => {
    const result = computeTherapeuticProgress(baseInput({
      keywork_sessions: [
        makeKeywork({ id: "kw1", type: "therapeutic" }),
        makeKeywork({ id: "kw2", date: "2026-05-15", type: "wellbeing_check" }),
        makeKeywork({ id: "kw3", date: "2026-05-08", type: "one_to_one" }),
        makeKeywork({ id: "kw4", date: "2026-05-01", type: "therapeutic" }),
      ],
    }));
    expect(result.keywork_effectiveness.therapeutic_session_pct).toBe(75);
  });

  it("includes common behaviour triggers", () => {
    const result = computeTherapeuticProgress(baseInput({
      behaviour_entries: [
        { date: "2026-05-20", type: "verbal", severity: "low", trigger: "transition", de_escalation_used: true, response_effective: true },
        { date: "2026-05-18", type: "verbal", severity: "medium", trigger: "transition", de_escalation_used: true, response_effective: true },
        { date: "2026-05-15", type: "physical", severity: "high", trigger: "peer conflict", de_escalation_used: true, response_effective: false },
      ],
    }));
    expect(result.behaviour_trajectory.common_triggers).toContain("transition");
  });

  it("recommends multi-disciplinary review for critical concern", () => {
    const result = computeTherapeuticProgress(baseInput({
      therapy_sessions: [
        makeTherapySession({ attended: true, escalation_flags: ["self_harm", "suicidal_ideation", "psychosis", "crisis"] }),
      ],
      mental_health_check_ins: [
        { date: "2026-05-20", overall_mood: 1, anxiety_level: 9, sleep_quality: 2, self_harm_risk: "high", stressors: ["family", "bullying"] },
      ],
      incidents: [
        { date: "2026-05-24", type: "self_harm", severity: "critical" },
        { date: "2026-05-22", type: "self_harm", severity: "high" },
        { date: "2026-05-20", type: "emotional", severity: "high" },
      ],
      restraint_records: [
        { date: "2026-05-24", duration_minutes: 10, type: "physical" },
        { date: "2026-05-22", duration_minutes: 8, type: "physical" },
        { date: "2026-05-20", duration_minutes: 5, type: "physical" },
      ],
      behaviour_entries: [
        { date: "2026-05-24", type: "physical", severity: "critical", de_escalation_used: true, response_effective: false },
        { date: "2026-05-22", type: "physical", severity: "high", de_escalation_used: true, response_effective: false },
      ],
      keywork_sessions: [makeKeywork({ mood_before: 1, mood_after: 2 })],
    }));
    expect(["critical", "significant"]).toContain(result.concern_level);
    const mdrRec = result.recommendations.find((r) => r.recommendation.includes("multi-disciplinary"));
    expect(mdrRec).toBeDefined();
    expect(mdrRec!.urgency).toBe("immediate");
    expect(mdrRec!.regulatory_ref).toBe("Reg 9");
  });

  it("recommends therapy assessment when concerns present but no therapy", () => {
    const result = computeTherapeuticProgress(baseInput({
      therapy_sessions: [],
      camhs_referrals: [],
      incidents: [
        { date: "2026-05-24", type: "verbal", severity: "medium" },
        { date: "2026-05-22", type: "verbal", severity: "medium" },
      ],
      behaviour_entries: [
        { date: "2026-05-20", type: "verbal", severity: "medium", de_escalation_used: true, response_effective: false },
      ],
      mental_health_check_ins: [
        { date: "2026-05-20", overall_mood: 4, anxiety_level: 6, sleep_quality: 5, self_harm_risk: "none", stressors: ["school"] },
      ],
    }));
    const therapyRec = result.recommendations.find((r) => r.recommendation.includes("therapeutic assessment"));
    expect(therapyRec).toBeDefined();
  });

  it("includes high mood variability warning in insights", () => {
    const result = computeTherapeuticProgress(baseInput({
      therapy_sessions: [
        makeTherapySession({ id: "ts1", session_date: "2026-05-20", post_session_mood: 9 }),
        makeTherapySession({ id: "ts2", session_date: "2026-05-13", post_session_mood: 2 }),
        makeTherapySession({ id: "ts3", session_date: "2026-05-06", post_session_mood: 8 }),
        makeTherapySession({ id: "ts4", session_date: "2026-04-29", post_session_mood: 1 }),
      ],
      keywork_sessions: [
        makeKeywork({ date: "2026-05-22", mood_after: 8 }),
        makeKeywork({ id: "kw2", date: "2026-05-15", mood_after: 2 }),
      ],
      mental_health_check_ins: [
        { date: "2026-05-20", overall_mood: 9, anxiety_level: 2, sleep_quality: 8, self_harm_risk: "none", stressors: [] },
        { date: "2026-04-20", overall_mood: 1, anxiety_level: 9, sleep_quality: 2, self_harm_risk: "none", stressors: ["everything"] },
      ],
    }));
    const varianceInsight = result.insights.find((i) => i.text.includes("variability"));
    expect(varianceInsight).toBeDefined();
    expect(varianceInsight!.severity).toBe("warning");
  });
});
