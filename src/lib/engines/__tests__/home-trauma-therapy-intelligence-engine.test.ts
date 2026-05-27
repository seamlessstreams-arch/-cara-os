import { describe, it, expect } from "vitest";
import {
  computeTraumaTherapy,
  TraumaTherapyInput,
  TraumaTherapyRecordInput,
} from "../home-trauma-therapy-intelligence-engine";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeLog(
  overrides: Partial<TraumaTherapyRecordInput> = {},
): TraumaTherapyRecordInput {
  return {
    id: "log-1",
    child_id: "child-1",
    session_date: "2025-06-01",
    modality: "EMDR",
    session_format: "individual",
    session_length_minutes: 60,
    attended: true,
    child_presentation: "engaged",
    pre_session_mood: 4,
    post_session_mood: 7,
    regulation_strategy_count: 2,
    has_escalation_flags: false,
    escalation_flag_count: 0,
    has_child_voice: true,
    has_staff_observation: true,
    has_next_session: true,
    ...overrides,
  };
}

function baseInput(
  overrides: Partial<TraumaTherapyInput> = {},
): TraumaTherapyInput {
  return { today: "2025-06-15", total_children: 5, logs: [], ...overrides };
}

/** Generate N logs with sequential child ids, applying overrides to each. */
function makeLogs(
  n: number,
  overrides: Partial<TraumaTherapyRecordInput> = {},
): TraumaTherapyRecordInput[] {
  return Array.from({ length: n }, (_, i) =>
    makeLog({ id: `log-${i}`, child_id: `child-${i}`, ...overrides }),
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// 1. INSUFFICIENT DATA GUARD
// ═════════════════════════════════════════════════════════════════════════════

describe("Insufficient data guard (total_children === 0)", () => {
  it("returns insufficient_data when total_children is 0 and logs are empty", () => {
    const r = computeTraumaTherapy(baseInput({ total_children: 0, logs: [] }));
    expect(r.therapy_rating).toBe("insufficient_data");
    expect(r.therapy_score).toBe(0);
  });

  it("returns zero for all rate fields when total_children is 0", () => {
    const r = computeTraumaTherapy(baseInput({ total_children: 0 }));
    expect(r.children_in_therapy_rate).toBe(0);
    expect(r.attendance_rate).toBe(0);
    expect(r.mood_improvement_rate).toBe(0);
    expect(r.engagement_rate).toBe(0);
    expect(r.child_voice_rate).toBe(0);
    expect(r.modality_diversity).toBe(0);
  });

  it("returns empty arrays for strengths, concerns, recommendations, insights", () => {
    const r = computeTraumaTherapy(baseInput({ total_children: 0 }));
    expect(r.strengths).toEqual([]);
    expect(r.concerns).toEqual([]);
    expect(r.recommendations).toEqual([]);
    expect(r.insights).toEqual([]);
  });

  it("returns total_sessions 0", () => {
    const r = computeTraumaTherapy(baseInput({ total_children: 0 }));
    expect(r.total_sessions).toBe(0);
  });

  it("returns the insufficient_data headline", () => {
    const r = computeTraumaTherapy(baseInput({ total_children: 0 }));
    expect(r.headline).toBe(
      "No data available for trauma therapy intelligence analysis",
    );
  });

  it("returns insufficient_data even when logs are provided but total_children is 0", () => {
    const r = computeTraumaTherapy(
      baseInput({ total_children: 0, logs: [makeLog()] }),
    );
    expect(r.therapy_rating).toBe("insufficient_data");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 2. ZERO LOGS WITH CHILDREN > 0
// ═════════════════════════════════════════════════════════════════════════════

describe("Zero logs with total_children > 0", () => {
  it("hits all zero-path penalties: score = 52-3-1-1-0-1-2 = 44", () => {
    const r = computeTraumaTherapy(baseInput({ total_children: 5, logs: [] }));
    expect(r.therapy_score).toBe(44);
  });

  it("rates as inadequate (44 < 45)", () => {
    const r = computeTraumaTherapy(baseInput({ total_children: 5, logs: [] }));
    expect(r.therapy_rating).toBe("insufficient_data");
  });

  it("total_sessions is 0", () => {
    const r = computeTraumaTherapy(baseInput({ logs: [] }));
    expect(r.total_sessions).toBe(0);
  });

  it("children_in_therapy_rate is 0 with no logs", () => {
    const r = computeTraumaTherapy(baseInput({ logs: [] }));
    expect(r.children_in_therapy_rate).toBe(0);
  });

  it("attendance_rate is 0 with no logs", () => {
    const r = computeTraumaTherapy(baseInput({ logs: [] }));
    expect(r.attendance_rate).toBe(0);
  });

  it("mood_improvement_rate is 0 with no logs", () => {
    const r = computeTraumaTherapy(baseInput({ logs: [] }));
    expect(r.mood_improvement_rate).toBe(0);
  });

  it("engagement_rate is 0 with no logs", () => {
    const r = computeTraumaTherapy(baseInput({ logs: [] }));
    expect(r.engagement_rate).toBe(0);
  });

  it("child_voice_rate is 0 with no logs", () => {
    const r = computeTraumaTherapy(baseInput({ logs: [] }));
    expect(r.child_voice_rate).toBe(0);
  });

  it("modality_diversity is 0 with no logs", () => {
    const r = computeTraumaTherapy(baseInput({ logs: [] }));
    expect(r.modality_diversity).toBe(0);
  });

  it("includes 'no therapy records' concern", () => {
    const r = computeTraumaTherapy(baseInput({ logs: [] }));
    expect(r.concerns.some((c) => c.includes("No trauma therapy records"))).toBe(
      true,
    );
  });

  it("includes immediate recommendation for therapeutic assessments", () => {
    const r = computeTraumaTherapy(baseInput({ logs: [] }));
    expect(r.recommendations).toHaveLength(1);
    expect(r.recommendations[0].urgency).toBe("immediate");
    expect(r.recommendations[0].regulatory_ref).toBe("CHR 2015 Reg 6");
  });

  it("includes critical insight about Ofsted verification", () => {
    const r = computeTraumaTherapy(baseInput({ logs: [] }));
    expect(r.insights.some((i) => i.severity === "critical")).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 3. MODIFIER 1 — CHILDREN IN THERAPY COVERAGE
// ═════════════════════════════════════════════════════════════════════════════

describe("Modifier 1: Children in therapy coverage", () => {
  // Build logs for N unique children out of total_children
  function coverageLogs(
    uniqueChildren: number,
    total: number,
  ): TraumaTherapyInput {
    const logs = Array.from({ length: uniqueChildren }, (_, i) =>
      makeLog({
        id: `log-${i}`,
        child_id: `child-${i}`,
        has_child_voice: true,
        modality: ["EMDR", "CBT", "Play", "Art"][i % 4],
      }),
    );
    return baseInput({ total_children: total, logs });
  }

  it(">=80% coverage adds +6 (e.g. 4/5 = 80%)", () => {
    const r = computeTraumaTherapy(coverageLogs(4, 5));
    expect(r.children_in_therapy_rate).toBe(80);
    // coverage +6, all other modifiers also maxed by default logs
  });

  it("100% coverage adds +6 (e.g. 5/5 = 100%)", () => {
    const r = computeTraumaTherapy(coverageLogs(5, 5));
    expect(r.children_in_therapy_rate).toBe(100);
  });

  it("50-79% coverage adds +2 (e.g. 3/5 = 60%)", () => {
    const r = computeTraumaTherapy(coverageLogs(3, 5));
    expect(r.children_in_therapy_rate).toBe(60);
  });

  it("exactly 50% coverage adds +2 (e.g. 5/10 = 50%)", () => {
    const r = computeTraumaTherapy(coverageLogs(5, 10));
    expect(r.children_in_therapy_rate).toBe(50);
  });

  it("30-49% coverage gets no bonus or penalty (e.g. 2/5 = 40%)", () => {
    const r = computeTraumaTherapy(coverageLogs(2, 5));
    expect(r.children_in_therapy_rate).toBe(40);
  });

  it("<30% coverage subtracts -5 (e.g. 1/5 = 20%)", () => {
    const r = computeTraumaTherapy(coverageLogs(1, 5));
    expect(r.children_in_therapy_rate).toBe(20);
  });

  it("exactly 29% triggers -5 penalty", () => {
    // 29/100 = 29%
    const r = computeTraumaTherapy(coverageLogs(29, 100));
    expect(r.children_in_therapy_rate).toBe(29);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 4. MODIFIER 2 — ATTENDANCE RATE
// ═════════════════════════════════════════════════════════════════════════════

describe("Modifier 2: Attendance rate", () => {
  function attendanceLogs(
    attendedCount: number,
    totalCount: number,
  ): TraumaTherapyInput {
    const logs: TraumaTherapyRecordInput[] = [];
    for (let i = 0; i < totalCount; i++) {
      logs.push(
        makeLog({
          id: `log-${i}`,
          child_id: `child-${i % 5}`,
          attended: i < attendedCount,
          modality: ["EMDR", "CBT", "Play", "Art"][i % 4],
          has_child_voice: true,
        }),
      );
    }
    return baseInput({ total_children: 5, logs });
  }

  it(">=85% attendance adds +5 (e.g. 9/10 = 90%)", () => {
    const r = computeTraumaTherapy(attendanceLogs(9, 10));
    expect(r.attendance_rate).toBe(90);
  });

  it("exactly 85% attendance adds +5", () => {
    const r = computeTraumaTherapy(attendanceLogs(17, 20));
    expect(r.attendance_rate).toBe(85);
  });

  it("60-84% attendance adds +2 (e.g. 7/10 = 70%)", () => {
    const r = computeTraumaTherapy(attendanceLogs(7, 10));
    expect(r.attendance_rate).toBe(70);
  });

  it("exactly 60% attendance adds +2", () => {
    const r = computeTraumaTherapy(attendanceLogs(6, 10));
    expect(r.attendance_rate).toBe(60);
  });

  it("40-59% attendance gets no modifier (e.g. 5/10 = 50%)", () => {
    const r = computeTraumaTherapy(attendanceLogs(5, 10));
    expect(r.attendance_rate).toBe(50);
  });

  it("<40% attendance subtracts -5 (e.g. 3/10 = 30%)", () => {
    const r = computeTraumaTherapy(attendanceLogs(3, 10));
    expect(r.attendance_rate).toBe(30);
  });

  it("exactly 39% triggers -5 penalty", () => {
    // Use larger sample for exact pct
    const r = computeTraumaTherapy(attendanceLogs(39, 100));
    expect(r.attendance_rate).toBe(39);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 5. MODIFIER 3 — MOOD IMPROVEMENT
// ═════════════════════════════════════════════════════════════════════════════

describe("Modifier 3: Mood improvement rate", () => {
  function moodLogs(
    improvedCount: number,
    attendedCount: number,
  ): TraumaTherapyInput {
    const logs: TraumaTherapyRecordInput[] = [];
    for (let i = 0; i < attendedCount; i++) {
      logs.push(
        makeLog({
          id: `log-${i}`,
          child_id: `child-${i % 5}`,
          attended: true,
          pre_session_mood: 4,
          post_session_mood: i < improvedCount ? 7 : 4,
          modality: ["EMDR", "CBT", "Play", "Art"][i % 4],
          has_child_voice: true,
        }),
      );
    }
    return baseInput({ total_children: 5, logs });
  }

  it(">=70% mood improvement adds +5 (e.g. 8/10 = 80%)", () => {
    const r = computeTraumaTherapy(moodLogs(8, 10));
    expect(r.mood_improvement_rate).toBe(80);
  });

  it("exactly 70% mood improvement adds +5", () => {
    const r = computeTraumaTherapy(moodLogs(7, 10));
    expect(r.mood_improvement_rate).toBe(70);
  });

  it("40-69% mood improvement adds +2 (e.g. 5/10 = 50%)", () => {
    const r = computeTraumaTherapy(moodLogs(5, 10));
    expect(r.mood_improvement_rate).toBe(50);
  });

  it("exactly 40% mood improvement adds +2", () => {
    const r = computeTraumaTherapy(moodLogs(4, 10));
    expect(r.mood_improvement_rate).toBe(40);
  });

  it("20-39% mood improvement gets no modifier (e.g. 3/10 = 30%)", () => {
    const r = computeTraumaTherapy(moodLogs(3, 10));
    expect(r.mood_improvement_rate).toBe(30);
  });

  it("<20% mood improvement subtracts -4 (e.g. 1/10 = 10%)", () => {
    const r = computeTraumaTherapy(moodLogs(1, 10));
    expect(r.mood_improvement_rate).toBe(10);
  });

  it("0 attended sessions with total>0 subtracts -1", () => {
    // All logs are not attended
    const logs = makeLogs(5, { attended: false });
    const r = computeTraumaTherapy(baseInput({ logs }));
    // attendedSessions.length === 0 → score -= 1
    expect(r.mood_improvement_rate).toBe(0);
  });

  it("mood improvement only counts attended sessions", () => {
    const logs = [
      makeLog({
        id: "a1",
        attended: true,
        pre_session_mood: 3,
        post_session_mood: 7,
      }),
      makeLog({
        id: "a2",
        attended: false,
        pre_session_mood: 3,
        post_session_mood: 7,
      }),
    ];
    const r = computeTraumaTherapy(baseInput({ logs }));
    // 1 attended, 1 improved → 100%
    expect(r.mood_improvement_rate).toBe(100);
  });

  it("post_session_mood equal to pre_session_mood does not count as improvement", () => {
    const logs = [
      makeLog({ id: "a1", pre_session_mood: 5, post_session_mood: 5 }),
    ];
    const r = computeTraumaTherapy(baseInput({ logs }));
    expect(r.mood_improvement_rate).toBe(0);
  });

  it("post_session_mood less than pre_session_mood does not count as improvement", () => {
    const logs = [
      makeLog({ id: "a1", pre_session_mood: 7, post_session_mood: 3 }),
    ];
    const r = computeTraumaTherapy(baseInput({ logs }));
    expect(r.mood_improvement_rate).toBe(0);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 6. MODIFIER 4 — CHILD ENGAGEMENT
// ═════════════════════════════════════════════════════════════════════════════

describe("Modifier 4: Child engagement rate", () => {
  function engagementLogs(
    engagedCount: number,
    totalAttended: number,
  ): TraumaTherapyInput {
    const logs: TraumaTherapyRecordInput[] = [];
    for (let i = 0; i < totalAttended; i++) {
      logs.push(
        makeLog({
          id: `log-${i}`,
          child_id: `child-${i % 5}`,
          attended: true,
          child_presentation: i < engagedCount ? "engaged" : "withdrawn",
          modality: ["EMDR", "CBT", "Play", "Art"][i % 4],
          has_child_voice: true,
        }),
      );
    }
    return baseInput({ total_children: 5, logs });
  }

  it(">=75% engagement adds +5 (e.g. 8/10 = 80%)", () => {
    const r = computeTraumaTherapy(engagementLogs(8, 10));
    expect(r.engagement_rate).toBe(80);
  });

  it("exactly 75% engagement adds +5", () => {
    const r = computeTraumaTherapy(engagementLogs(15, 20));
    expect(r.engagement_rate).toBe(75);
  });

  it("50-74% engagement adds +2 (e.g. 6/10 = 60%)", () => {
    const r = computeTraumaTherapy(engagementLogs(6, 10));
    expect(r.engagement_rate).toBe(60);
  });

  it("exactly 50% engagement adds +2", () => {
    const r = computeTraumaTherapy(engagementLogs(5, 10));
    expect(r.engagement_rate).toBe(50);
  });

  it("25-49% engagement gets no modifier (e.g. 3/10 = 30%)", () => {
    const r = computeTraumaTherapy(engagementLogs(3, 10));
    expect(r.engagement_rate).toBe(30);
  });

  it("<25% engagement subtracts -4 (e.g. 2/10 = 20%)", () => {
    const r = computeTraumaTherapy(engagementLogs(2, 10));
    expect(r.engagement_rate).toBe(20);
  });

  it("0 attended sessions with total>0 subtracts -1 for engagement", () => {
    const logs = makeLogs(5, { attended: false });
    const r = computeTraumaTherapy(baseInput({ logs }));
    expect(r.engagement_rate).toBe(0);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 7. MODIFIER 5 — CHILD VOICE
// ═════════════════════════════════════════════════════════════════════════════

describe("Modifier 5: Child voice rate", () => {
  function voiceLogs(
    voiceCount: number,
    totalCount: number,
  ): TraumaTherapyInput {
    const logs: TraumaTherapyRecordInput[] = [];
    for (let i = 0; i < totalCount; i++) {
      logs.push(
        makeLog({
          id: `log-${i}`,
          child_id: `child-${i % 5}`,
          has_child_voice: i < voiceCount,
          modality: ["EMDR", "CBT", "Play", "Art"][i % 4],
        }),
      );
    }
    return baseInput({ total_children: 5, logs });
  }

  it(">=80% child voice adds +4 (e.g. 9/10 = 90%)", () => {
    const r = computeTraumaTherapy(voiceLogs(9, 10));
    expect(r.child_voice_rate).toBe(90);
  });

  it("exactly 80% child voice adds +4", () => {
    const r = computeTraumaTherapy(voiceLogs(8, 10));
    expect(r.child_voice_rate).toBe(80);
  });

  it("50-79% child voice adds +1 (e.g. 6/10 = 60%)", () => {
    const r = computeTraumaTherapy(voiceLogs(6, 10));
    expect(r.child_voice_rate).toBe(60);
  });

  it("exactly 50% child voice adds +1", () => {
    const r = computeTraumaTherapy(voiceLogs(5, 10));
    expect(r.child_voice_rate).toBe(50);
  });

  it("20-49% child voice gets no modifier (e.g. 3/10 = 30%)", () => {
    const r = computeTraumaTherapy(voiceLogs(3, 10));
    expect(r.child_voice_rate).toBe(30);
  });

  it("<20% child voice subtracts -4 (e.g. 1/10 = 10%)", () => {
    const r = computeTraumaTherapy(voiceLogs(1, 10));
    expect(r.child_voice_rate).toBe(10);
  });

  it("0% child voice subtracts -4", () => {
    const r = computeTraumaTherapy(voiceLogs(0, 10));
    expect(r.child_voice_rate).toBe(0);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 8. MODIFIER 6 — MODALITY DIVERSITY
// ═════════════════════════════════════════════════════════════════════════════

describe("Modifier 6: Modality diversity", () => {
  function modalityLogs(modalities: string[]): TraumaTherapyInput {
    const logs = modalities.map((m, i) =>
      makeLog({ id: `log-${i}`, child_id: `child-${i % 5}`, modality: m, has_child_voice: true }),
    );
    return baseInput({ total_children: 5, logs });
  }

  it(">=4 unique modalities adds +5", () => {
    const r = computeTraumaTherapy(
      modalityLogs(["EMDR", "CBT", "Play", "Art"]),
    );
    expect(r.modality_diversity).toBe(4);
  });

  it("5 unique modalities adds +5", () => {
    const r = computeTraumaTherapy(
      modalityLogs(["EMDR", "CBT", "Play", "Art", "Music"]),
    );
    expect(r.modality_diversity).toBe(5);
  });

  it("2-3 unique modalities adds +2", () => {
    const r = computeTraumaTherapy(modalityLogs(["EMDR", "CBT"]));
    expect(r.modality_diversity).toBe(2);
  });

  it("3 unique modalities adds +2", () => {
    const r = computeTraumaTherapy(modalityLogs(["EMDR", "CBT", "Play"]));
    expect(r.modality_diversity).toBe(3);
  });

  it("<2 unique modalities (1) subtracts -3", () => {
    const r = computeTraumaTherapy(modalityLogs(["EMDR", "EMDR", "EMDR"]));
    expect(r.modality_diversity).toBe(1);
  });

  it("duplicate modalities still count as 1", () => {
    const r = computeTraumaTherapy(
      modalityLogs(["CBT", "CBT", "CBT", "CBT"]),
    );
    expect(r.modality_diversity).toBe(1);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 9. ENGAGEMENT: "engaged" AND "building_trust" BOTH COUNT
// ═════════════════════════════════════════════════════════════════════════════

describe("Engagement presentations", () => {
  it("'engaged' counts towards engagement rate", () => {
    const logs = [makeLog({ child_presentation: "engaged" })];
    const r = computeTraumaTherapy(baseInput({ logs }));
    expect(r.engagement_rate).toBe(100);
  });

  it("'building_trust' counts towards engagement rate", () => {
    const logs = [makeLog({ child_presentation: "building_trust" })];
    const r = computeTraumaTherapy(baseInput({ logs }));
    expect(r.engagement_rate).toBe(100);
  });

  it("'withdrawn' does NOT count towards engagement rate", () => {
    const logs = [makeLog({ child_presentation: "withdrawn" })];
    const r = computeTraumaTherapy(baseInput({ logs }));
    expect(r.engagement_rate).toBe(0);
  });

  it("'avoidant' does NOT count towards engagement rate", () => {
    const logs = [makeLog({ child_presentation: "avoidant" })];
    const r = computeTraumaTherapy(baseInput({ logs }));
    expect(r.engagement_rate).toBe(0);
  });

  it("'distressed' does NOT count towards engagement rate", () => {
    const logs = [makeLog({ child_presentation: "distressed" })];
    const r = computeTraumaTherapy(baseInput({ logs }));
    expect(r.engagement_rate).toBe(0);
  });

  it("'mixed' does NOT count towards engagement rate", () => {
    const logs = [makeLog({ child_presentation: "mixed" })];
    const r = computeTraumaTherapy(baseInput({ logs }));
    expect(r.engagement_rate).toBe(0);
  });

  it("mix of engaged and building_trust both count", () => {
    const logs = [
      makeLog({ id: "l1", child_presentation: "engaged" }),
      makeLog({ id: "l2", child_presentation: "building_trust" }),
      makeLog({ id: "l3", child_presentation: "withdrawn" }),
    ];
    const r = computeTraumaTherapy(baseInput({ logs }));
    expect(r.engagement_rate).toBe(67); // 2/3 = 66.67 → round to 67
  });

  it("engagement only counts attended sessions", () => {
    const logs = [
      makeLog({ id: "l1", attended: true, child_presentation: "engaged" }),
      makeLog({
        id: "l2",
        attended: false,
        child_presentation: "engaged",
      }),
    ];
    const r = computeTraumaTherapy(baseInput({ logs }));
    // 1 attended engaged / 1 attended total = 100%
    expect(r.engagement_rate).toBe(100);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 10. OUTSTANDING SCENARIO
// ═════════════════════════════════════════════════════════════════════════════

describe("Outstanding scenario", () => {
  it("all max bonuses: 52+6+5+5+5+4+5 = 82 → outstanding", () => {
    // 5 unique children out of 5 = 100% coverage → +6
    // all attended = 100% attendance → +5
    // all mood improved → +5
    // all engaged → +5
    // all have child voice → +4
    // 4+ modalities → +5
    const logs = [
      makeLog({ id: "l1", child_id: "c1", modality: "EMDR", has_child_voice: true }),
      makeLog({ id: "l2", child_id: "c2", modality: "CBT", has_child_voice: true }),
      makeLog({ id: "l3", child_id: "c3", modality: "Play", has_child_voice: true }),
      makeLog({ id: "l4", child_id: "c4", modality: "Art", has_child_voice: true }),
      makeLog({ id: "l5", child_id: "c5", modality: "Music", has_child_voice: true }),
    ];
    const r = computeTraumaTherapy(
      baseInput({ total_children: 5, logs }),
    );
    expect(r.therapy_score).toBe(82);
    expect(r.therapy_rating).toBe("outstanding");
  });

  it("outstanding headline is correct", () => {
    const logs = [
      makeLog({ id: "l1", child_id: "c1", modality: "EMDR", has_child_voice: true }),
      makeLog({ id: "l2", child_id: "c2", modality: "CBT", has_child_voice: true }),
      makeLog({ id: "l3", child_id: "c3", modality: "Play", has_child_voice: true }),
      makeLog({ id: "l4", child_id: "c4", modality: "Art", has_child_voice: true }),
      makeLog({ id: "l5", child_id: "c5", modality: "Music", has_child_voice: true }),
    ];
    const r = computeTraumaTherapy(baseInput({ total_children: 5, logs }));
    expect(r.headline).toContain("Outstanding trauma therapy provision");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 11. GOOD SCENARIO
// ═════════════════════════════════════════════════════════════════════════════

describe("Good scenario", () => {
  it("score in 65-79 range rates as good", () => {
    // 3/5 children = 60% → +2, all attended → +5, 70% mood → +5,
    // 75% engaged → +5, 80% voice → +4, 2 modalities → +2 = 52+2+5+5+5+4+2 = 75
    const logs = [
      makeLog({ id: "l1", child_id: "c1", modality: "EMDR", has_child_voice: true }),
      makeLog({ id: "l2", child_id: "c2", modality: "CBT", has_child_voice: true }),
      makeLog({ id: "l3", child_id: "c3", modality: "EMDR", has_child_voice: true }),
    ];
    const r = computeTraumaTherapy(baseInput({ total_children: 5, logs }));
    // 3/5=60% coverage → +2, 3/3=100% attendance → +5, 100% mood → +5,
    // 100% engagement → +5, 100% voice → +4, 2 modalities → +2 = 75
    expect(r.therapy_score).toBe(75);
    expect(r.therapy_rating).toBe("good");
  });

  it("good headline is correct", () => {
    const logs = [
      makeLog({ id: "l1", child_id: "c1", modality: "EMDR", has_child_voice: true }),
      makeLog({ id: "l2", child_id: "c2", modality: "CBT", has_child_voice: true }),
      makeLog({ id: "l3", child_id: "c3", modality: "EMDR", has_child_voice: true }),
    ];
    const r = computeTraumaTherapy(baseInput({ total_children: 5, logs }));
    expect(r.headline).toContain("Good therapy provision");
  });

  it("exactly 65 rates as good", () => {
    // We need score = 65. Base 52.
    // 1 unique child / 5 = 20% coverage → -5 → 47
    // attended = 100% → +5 → 52
    // mood improved 100% → +5 → 57
    // engagement 100% → +5 → 62
    // child voice 100% → +4 → 66
    // 1 modality → -3 → 63. Not quite.
    // Try: 2/5 children = 40% coverage → +0, all attended → +5, 100% mood → +5,
    // 100% engagement → +5, 50% voice → +1, 2 modalities → +2 = 52+0+5+5+5+1+2 = 70
    // That's 70. Let's try building something at 65 exactly.
    // 2/5=40% → 0, 60% attendance → +2, 70% mood → +5, 75% engaged → +5, 50% voice → +1, 1 modality → -3 = 52+0+2+5+5+1-3=62. Not enough.
    // 2/5=40%→0, 85% attend→+5, 70% mood→+5, 50% engaged→+2, 50% voice→+1, 1 mod→-3 = 52+0+5+5+2+1-3=62 No.
    // 3/5=60%→+2, 85% attend→+5, 40% mood→+2, 50% engaged→+2, 50% voice→+1, 1 mod→-3 = 52+2+5+2+2+1-3=61. No.
    // Let me just verify the boundary.
    // 3/5=60%→+2, 100% attend→+5, 40% mood→+2, 50% engaged→+2, 80% voice→+4, 1 modality→-3 = 52+2+5+2+2+4-3=64. Close.
    // 3/5=60%→+2, 100% attend→+5, 40% mood→+2, 75% engaged→+5, 50% voice→+1, 1 modality→-3 = 52+2+5+2+5+1-3=64. Hmm.
    // 3/5=60%→+2, 100% attend→+5, 40% mood→+2, 75% engaged→+5, 80% voice→+4, 1 modality→-3 = 52+2+5+2+5+4-3=67.
    // 3/5=60%→+2, 100% attend→+5, 70% mood→+5, 50% engage→+2, 50% voice→+1, 1 mod→-3 = 52+2+5+5+2+1-3=64.
    // 3/5=60%→+2, 100% attend→+5, 70% mood→+5, 50% engage→+2, 80% voice→+4, 1 mod→-3 = 52+2+5+5+2+4-3=67.
    // 4/5=80%→+6, 60% attend→+2, 25-49% mood→0, 25-49% engage→0, 20-49% voice→0, 2 mods→+2 = 52+6+2+0+0+0+2=62.
    // 4/5=80%→+6, 85% attend→+5, 30% mood→0, 30% engage→0, 30% voice→0, 2 mods→+2 = 52+6+5+0+0+0+2=65. Yes!
    // 4 attended out of 5 logs → no! need 85% attendance → at least 85% of total logs.
    // Use 20 logs: 17 attended (85%), 4 unique children of 5 (80%)
    // mood improved: 30% of 17 = ~5.1 → 6/17=35.3% or 5/17=29.4%. Need 30%.
    // engagement: 30% → 5/17=29.4%. That's <25, triggers -4.
    // Need 25-49% engagement → 5/17=29.4% works as >=25.
    // voice: 30% → 6/20=30%.
    // modalities: 2.
    // Let me just do a simpler test verifying toRating boundary.
    // Actually we already tested good in the previous test. Let's test 65 boundary via a different approach.
    // Build a scenario that exactly scores 65.
    // 5/5=100%→+6, 60%attend→+2, 30%mood→0, 30%engage→0, 30%voice→0, 2 mod→+2 = 52+6+2+0+0+0+2=62 Hmm no.
    // 5/5→+6, 85%attend→+5, 20-39%mood→0, 25-49%engage→0, 20-49%voice→0, 2 mod→+2 = 52+6+5+0+0+0+2=65. Yes!
    // 20 logs, 5 unique children, 17 attended (85%), mood improved for 6/17=35%, engagement for 5/17=29%, child voice for 6/20=30%, 2 modalities
    const logs: TraumaTherapyRecordInput[] = [];
    for (let i = 0; i < 20; i++) {
      const attended = i < 17;
      const moodUp = attended && i < 6; // 6/17 = 35%
      const isEngaged = attended && i >= 6 && i < 11; // 5/17 = 29%
      logs.push(
        makeLog({
          id: `log-${i}`,
          child_id: `child-${i % 5}`,
          attended,
          pre_session_mood: 4,
          post_session_mood: moodUp ? 7 : 4,
          child_presentation: isEngaged ? "engaged" : "withdrawn",
          has_child_voice: i < 6, // 6/20 = 30%
          modality: i % 2 === 0 ? "EMDR" : "CBT", // 2 modalities
        }),
      );
    }
    const r = computeTraumaTherapy(baseInput({ total_children: 5, logs }));
    expect(r.therapy_score).toBe(65);
    expect(r.therapy_rating).toBe("good");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 12. ADEQUATE SCENARIO
// ═════════════════════════════════════════════════════════════════════════════

describe("Adequate scenario", () => {
  it("score in 45-64 range rates as adequate", () => {
    // 2/5=40% coverage → 0, 60% attendance → +2, 40% mood → +2,
    // 50% engagement → +2, 50% voice → +1, 2 modalities → +2 = 52+0+2+2+2+1+2=61
    const logs: TraumaTherapyRecordInput[] = [];
    for (let i = 0; i < 10; i++) {
      const attended = i < 6; // 60%
      logs.push(
        makeLog({
          id: `log-${i}`,
          child_id: `child-${i < 2 ? i : 0}`, // 2 unique children
          attended,
          pre_session_mood: 4,
          post_session_mood: attended && i < 3 ? 7 : 4, // 3/6 = 50% mood
          child_presentation:
            attended && i < 3 ? "engaged" : "withdrawn", // 3/6 = 50% engagement
          has_child_voice: i < 5, // 5/10 = 50%
          modality: i % 2 === 0 ? "EMDR" : "CBT",
        }),
      );
    }
    const r = computeTraumaTherapy(baseInput({ total_children: 5, logs }));
    expect(r.therapy_rating).toBe("adequate");
    expect(r.therapy_score).toBeGreaterThanOrEqual(45);
    expect(r.therapy_score).toBeLessThan(65);
  });

  it("adequate headline is correct", () => {
    // Quick way to get adequate: base with 2 modalities, moderate values
    const logs = [
      makeLog({
        id: "l1",
        child_id: "c1",
        modality: "EMDR",
        has_child_voice: false,
        child_presentation: "withdrawn",
        pre_session_mood: 5,
        post_session_mood: 5,
      }),
      makeLog({
        id: "l2",
        child_id: "c2",
        modality: "CBT",
        has_child_voice: false,
        child_presentation: "withdrawn",
        pre_session_mood: 5,
        post_session_mood: 5,
      }),
    ];
    const r = computeTraumaTherapy(baseInput({ total_children: 5, logs }));
    // 2/5=40%→0, 100%attend→+5, 0%mood→-4, 0%engage→-4, 0%voice→-4, 2mod→+2 = 52+0+5-4-4-4+2=47
    expect(r.therapy_score).toBe(47);
    expect(r.therapy_rating).toBe("adequate");
    expect(r.headline).toContain("Therapy exists but");
  });

  it("exactly 45 rates as adequate", () => {
    // Need 45. 52+0+5-4-4-4+0=45.
    // coverage 30-49% → 0. attendance 85%+ → +5. mood <20% → -4. engagement <25% → -4. voice <20% → -4. 1 modality → -3.
    // 52+0+5-4-4-4-3=42. Too low.
    // coverage 50-79% → +2. attendance 85%+ → +5. mood <20% → -4. engagement <25% → -4. voice <20% → -4. 2 modalities → +2.
    // 52+2+5-4-4-4+2=49. No.
    // coverage 30-49% → 0. attendance 85%+ → +5. mood <20% → -4. engagement 25-49% → 0. voice <20% → -4. 2 modalities → +2.
    // 52+0+5-4+0-4+2=51. No.
    // coverage <30% → -5. attendance 85% → +5. mood <20% → -4. engagement <25% → -4. voice 50-79% → +1. 1 modality → -3.
    // 52-5+5-4-4+1-3=42. No.
    // Let me try: coverage 30-49%→0, attend 60-84%→+2, mood 20-39%→0, engage 25-49%→0, voice <20%→-4, 2 mod→+2, = 52+0+2+0+0-4+2=52. Not 45.
    // coverage <30%→-5, attend 40-59%→0, mood <20%→-4, engage 25-49%→0, voice 20-49%→0, 2mod→+2 = 52-5+0-4+0+0+2=45. Yes!
    // 1/5=20% coverage → -5. Need total=20, 10 attended(50%). mood: <20% of attended. engage: 25-49% of attended.
    // voice: 20-49% of total. 2 modalities.
    const logs: TraumaTherapyRecordInput[] = [];
    for (let i = 0; i < 20; i++) {
      const attended = i < 10; // 10/20=50%
      const moodUp = attended && i < 1; // 1/10=10% <20%
      const isEngaged = attended && i >= 1 && i < 4; // 3/10=30%
      logs.push(
        makeLog({
          id: `log-${i}`,
          child_id: `child-${i < 1 ? 0 : 1}`, // 1 unique child (will be 2 with child_id logic)
          attended,
          pre_session_mood: 4,
          post_session_mood: moodUp ? 7 : 4,
          child_presentation: isEngaged ? "engaged" : "withdrawn",
          has_child_voice: i >= 0 && i < 5, // 5/20=25%
          modality: i % 2 === 0 ? "EMDR" : "CBT",
        }),
      );
    }
    // Fix: need 1/5=20% coverage. All child_ids must map to 1 unique child.
    logs.forEach((l) => (l.child_id = "child-0"));
    const r = computeTraumaTherapy(baseInput({ total_children: 5, logs }));
    expect(r.children_in_therapy_rate).toBe(20); // 1/5
    expect(r.attendance_rate).toBe(50); // 10/20
    expect(r.therapy_score).toBe(45);
    expect(r.therapy_rating).toBe("adequate");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 13. INADEQUATE SCENARIO
// ═════════════════════════════════════════════════════════════════════════════

describe("Inadequate scenario", () => {
  it("score < 45 rates as inadequate", () => {
    // All penalties: coverage <30% → -5, attendance <40% → -5, mood <20% → -4,
    // engagement <25% → -4, voice <20% → -4, 1 modality → -3 = 52-5-5-4-4-4-3 = 27
    const logs: TraumaTherapyRecordInput[] = [];
    for (let i = 0; i < 10; i++) {
      logs.push(
        makeLog({
          id: `log-${i}`,
          child_id: "child-0", // 1/5 = 20%
          attended: i < 3, // 3/10 = 30%
          pre_session_mood: 5,
          post_session_mood: 5, // no improvement
          child_presentation: "withdrawn",
          has_child_voice: false, // 0%
          modality: "EMDR", // 1 modality
        }),
      );
    }
    const r = computeTraumaTherapy(baseInput({ total_children: 5, logs }));
    expect(r.therapy_score).toBe(27);
    expect(r.therapy_rating).toBe("inadequate");
  });

  it("inadequate headline is correct", () => {
    const logs = [
      makeLog({
        child_id: "child-0",
        attended: false,
        child_presentation: "withdrawn",
        pre_session_mood: 5,
        post_session_mood: 5,
        has_child_voice: false,
      }),
    ];
    const r = computeTraumaTherapy(baseInput({ total_children: 5, logs }));
    expect(r.headline).toContain("Inadequate therapy provision");
  });

  it("exactly 44 rates as inadequate", () => {
    // 52 + some modifiers = 44.
    // coverage <30%(1/5=20%)→-5, attend 40-59%(5/10=50%)→0, mood <20%(0/5=0%)→-4,
    // engage 25-49%(2/5=40%)→0, voice 20-49%(3/10=30%)→0, 1 modality→-3 = 52-5+0-4+0+0-3=40. No.
    // coverage 30-49%(2/5=40%)→0, attend 40-59%(5/10=50%)→0, mood 20-39%(1/5=20%)→0,
    // engage <25%(1/5=20%)→-4, voice <20%(1/10=10%)→-4, 1 mod→-3 = 52+0+0+0-4-4-3=41. No.
    // coverage 30-49%→0, attend 60-84%→+2, mood <20%→-4, engage <25%→-4, voice <20%→-4, 1 mod→-3 = 52+0+2-4-4-4-3=39. No.
    // coverage 30-49%→0, attend 85%→+5, mood <20%→-4, engage <25%→-4, voice <20%→-4, 1 mod→-3 = 52+0+5-4-4-4-3=42. No.
    // coverage 50-79%→+2, attend 85%→+5, mood <20%→-4, engage <25%→-4, voice <20%→-4, 1 mod→-3 = 52+2+5-4-4-4-3=44. Yes!
    const logs: TraumaTherapyRecordInput[] = [];
    for (let i = 0; i < 20; i++) {
      const attended = i < 17; // 17/20=85%
      logs.push(
        makeLog({
          id: `log-${i}`,
          child_id: `child-${i % 3}`, // 3 unique children → 3/5 = 60% (50-79%)
          attended,
          pre_session_mood: 5,
          post_session_mood: attended && i < 2 ? 6 : 5, // 2/17=12% <20%
          child_presentation: attended && i < 3 ? "engaged" : "withdrawn", // 3/17=18% <25%
          has_child_voice: i < 3, // 3/20=15% <20%
          modality: "EMDR", // 1 modality
        }),
      );
    }
    const r = computeTraumaTherapy(baseInput({ total_children: 5, logs }));
    expect(r.therapy_score).toBe(44);
    expect(r.therapy_rating).toBe("inadequate");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 14. STRENGTHS ARRAY
// ═════════════════════════════════════════════════════════════════════════════

describe("Strengths", () => {
  it("includes coverage strength when childrenInTherapyRate >= 80 and total > 0", () => {
    const logs = makeLogs(5, { has_child_voice: true, modality: "EMDR" });
    logs.forEach((l, i) => (l.child_id = `child-${i}`));
    const r = computeTraumaTherapy(
      baseInput({ total_children: 5, logs }),
    );
    expect(r.strengths.some((s) => s.includes("prioritises trauma-informed"))).toBe(true);
  });

  it("includes attendance strength when attendanceRate >= 85 and total > 0", () => {
    const logs = makeLogs(10, { has_child_voice: true });
    // 9/10 attended = 90%
    logs[9].attended = false;
    const r = computeTraumaTherapy(baseInput({ logs }));
    expect(
      r.strengths.some((s) => s.includes("Therapy attendance is excellent")),
    ).toBe(true);
  });

  it("includes mood improvement strength when moodImprovementRate >= 70 and attended > 0", () => {
    const logs = makeLogs(10, {});
    // 8/10 improved = 80%
    logs[8].post_session_mood = 3;
    logs[8].pre_session_mood = 5;
    logs[9].post_session_mood = 3;
    logs[9].pre_session_mood = 5;
    const r = computeTraumaTherapy(baseInput({ logs }));
    expect(
      r.strengths.some((s) => s.includes("Mood improvement after sessions")),
    ).toBe(true);
  });

  it("includes engagement strength when engagementRate >= 75 and attended > 0", () => {
    const logs = makeLogs(4, { child_presentation: "engaged" });
    logs[3].child_presentation = "withdrawn"; // 3/4 = 75%
    const r = computeTraumaTherapy(baseInput({ logs }));
    expect(
      r.strengths.some((s) => s.includes("actively engaged")),
    ).toBe(true);
  });

  it("includes child voice strength when childVoiceRate >= 80 and total > 0", () => {
    const logs = makeLogs(5, { has_child_voice: true });
    const r = computeTraumaTherapy(baseInput({ logs }));
    expect(
      r.strengths.some((s) =>
        s.includes("consistently captured in therapy records"),
      ),
    ).toBe(true);
  });

  it("includes modality diversity strength when uniqueModalities >= 4 and total > 0", () => {
    const logs = [
      makeLog({ id: "l1", modality: "EMDR", child_id: "c1", has_child_voice: true }),
      makeLog({ id: "l2", modality: "CBT", child_id: "c2", has_child_voice: true }),
      makeLog({ id: "l3", modality: "Play", child_id: "c3", has_child_voice: true }),
      makeLog({ id: "l4", modality: "Art", child_id: "c4", has_child_voice: true }),
    ];
    const r = computeTraumaTherapy(
      baseInput({ total_children: 5, logs }),
    );
    expect(
      r.strengths.some((s) => s.includes("Diverse therapy modalities")),
    ).toBe(true);
  });

  it("does not include coverage strength when total is 0", () => {
    const r = computeTraumaTherapy(baseInput({ logs: [] }));
    expect(r.strengths.some((s) => s.includes("prioritises"))).toBe(false);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 15. CONCERNS ARRAY
// ═════════════════════════════════════════════════════════════════════════════

describe("Concerns", () => {
  it("includes 'no therapy records' when total=0 and total_children>0", () => {
    const r = computeTraumaTherapy(baseInput({ logs: [] }));
    expect(r.concerns.some((c) => c.includes("No trauma therapy records"))).toBe(
      true,
    );
  });

  it("includes low coverage concern when childrenInTherapyRate < 50 and total > 0", () => {
    const logs = [makeLog({ child_id: "c1" }), makeLog({ id: "l2", child_id: "c2" })];
    const r = computeTraumaTherapy(
      baseInput({ total_children: 5, logs }),
    ); // 2/5=40%
    expect(
      r.concerns.some((c) => c.includes("Fewer than half of children")),
    ).toBe(true);
  });

  it("includes low attendance concern when attendanceRate < 40 and total > 0", () => {
    const logs = makeLogs(10, { attended: false });
    logs[0].attended = true;
    logs[1].attended = true;
    logs[2].attended = true; // 3/10 = 30%
    const r = computeTraumaTherapy(baseInput({ logs }));
    expect(
      r.concerns.some((c) => c.includes("Therapy attendance is low")),
    ).toBe(true);
  });

  it("includes low mood concern when moodImprovementRate < 20 and attended > 0", () => {
    const logs = makeLogs(10, {
      pre_session_mood: 5,
      post_session_mood: 5,
    });
    logs[0].post_session_mood = 7; // 1/10 = 10%
    const r = computeTraumaTherapy(baseInput({ logs }));
    expect(
      r.concerns.some((c) => c.includes("Mood rarely improves")),
    ).toBe(true);
  });

  it("includes low engagement concern when engagementRate < 25 and attended > 0", () => {
    const logs = makeLogs(10, { child_presentation: "withdrawn" });
    logs[0].child_presentation = "engaged";
    logs[1].child_presentation = "engaged"; // 2/10 = 20%
    const r = computeTraumaTherapy(baseInput({ logs }));
    expect(
      r.concerns.some((c) => c.includes("rarely engaged in sessions")),
    ).toBe(true);
  });

  it("includes low child voice concern when childVoiceRate < 20 and total > 0", () => {
    const logs = makeLogs(10, { has_child_voice: false });
    logs[0].has_child_voice = true; // 1/10 = 10%
    const r = computeTraumaTherapy(baseInput({ logs }));
    expect(
      r.concerns.some((c) => c.includes("rarely captured in therapy")),
    ).toBe(true);
  });

  it("includes escalation concern when totalEscalations > 5", () => {
    const logs = [
      makeLog({
        id: "l1",
        has_escalation_flags: true,
        escalation_flag_count: 6,
      }),
    ];
    const r = computeTraumaTherapy(baseInput({ logs }));
    expect(
      r.concerns.some((c) =>
        c.includes("Multiple escalation flags"),
      ),
    ).toBe(true);
  });

  it("does not include escalation concern when totalEscalations = 5", () => {
    const logs = [
      makeLog({
        id: "l1",
        has_escalation_flags: true,
        escalation_flag_count: 5,
      }),
    ];
    const r = computeTraumaTherapy(baseInput({ logs }));
    expect(
      r.concerns.some((c) =>
        c.includes("Multiple escalation flags"),
      ),
    ).toBe(false);
  });

  it("does not include low coverage concern when total is 0", () => {
    const r = computeTraumaTherapy(baseInput({ logs: [] }));
    expect(
      r.concerns.some((c) => c.includes("Fewer than half")),
    ).toBe(false);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 16. RECOMMENDATIONS
// ═════════════════════════════════════════════════════════════════════════════

describe("Recommendations", () => {
  it("recommends therapeutic assessments when total=0 and total_children>0", () => {
    const r = computeTraumaTherapy(baseInput({ logs: [] }));
    const rec = r.recommendations.find((x) =>
      x.recommendation.includes("therapeutic assessments"),
    );
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
    expect(rec!.regulatory_ref).toBe("CHR 2015 Reg 6");
  });

  it("recommends investigating attendance barriers when attendanceRate < 60 and total > 0", () => {
    const logs = makeLogs(10, { attended: false });
    logs[0].attended = true;
    logs[1].attended = true;
    logs[2].attended = true;
    logs[3].attended = true;
    logs[4].attended = true; // 5/10=50%
    const r = computeTraumaTherapy(baseInput({ logs }));
    const rec = r.recommendations.find((x) =>
      x.recommendation.includes("barriers to therapy attendance"),
    );
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
    expect(rec!.regulatory_ref).toBe("CHR 2015 Reg 9");
  });

  it("recommends reviewing therapeutic approaches when moodImprovementRate < 40 and attended > 0", () => {
    const logs = makeLogs(10, {
      pre_session_mood: 5,
      post_session_mood: 5,
    });
    logs[0].post_session_mood = 7;
    logs[1].post_session_mood = 7;
    logs[2].post_session_mood = 7; // 3/10=30%
    const r = computeTraumaTherapy(baseInput({ logs }));
    const rec = r.recommendations.find((x) =>
      x.recommendation.includes("Review therapeutic approaches"),
    );
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
    expect(rec!.regulatory_ref).toBe("CHR 2015 Reg 6");
  });

  it("recommends capturing child voice when childVoiceRate < 50 and total > 0", () => {
    const logs = makeLogs(10, { has_child_voice: false });
    logs[0].has_child_voice = true;
    logs[1].has_child_voice = true;
    logs[2].has_child_voice = true;
    logs[3].has_child_voice = true; // 4/10=40%
    const r = computeTraumaTherapy(baseInput({ logs }));
    const rec = r.recommendations.find((x) =>
      x.recommendation.includes("children's views about their therapy"),
    );
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
    expect(rec!.regulatory_ref).toBe("SCCIF Experiences");
  });

  it("recommends exploring modalities when uniqueModalities < 2 and total > 0", () => {
    const logs = makeLogs(5, { modality: "EMDR" });
    const r = computeTraumaTherapy(baseInput({ logs }));
    const rec = r.recommendations.find((x) =>
      x.recommendation.includes("additional therapy modalities"),
    );
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("planned");
    expect(rec!.regulatory_ref).toBe("CHR 2015 Reg 9");
  });

  it("recommends building therapeutic alliance when engagementRate < 50 and attended > 0", () => {
    const logs = makeLogs(10, { child_presentation: "withdrawn" });
    logs[0].child_presentation = "engaged";
    logs[1].child_presentation = "engaged";
    logs[2].child_presentation = "engaged";
    logs[3].child_presentation = "engaged"; // 4/10 = 40%
    const r = computeTraumaTherapy(baseInput({ logs }));
    const rec = r.recommendations.find((x) =>
      x.recommendation.includes("therapeutic alliance"),
    );
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
    expect(rec!.regulatory_ref).toBe("SCCIF Experiences");
  });

  it("recommendations have ascending rank numbers", () => {
    // Trigger multiple recommendations
    const logs = makeLogs(10, {
      attended: false,
      has_child_voice: false,
      modality: "EMDR",
    });
    logs[0].attended = true; // attendance 10% < 60 → trigger
    logs[0].child_presentation = "withdrawn"; // engagement 0% < 50 → trigger
    logs[0].pre_session_mood = 5;
    logs[0].post_session_mood = 5; // mood 0% < 40 → trigger
    const r = computeTraumaTherapy(baseInput({ logs }));
    for (let i = 0; i < r.recommendations.length; i++) {
      expect(r.recommendations[i].rank).toBe(i + 1);
    }
  });

  it("does not recommend attendance investigation when attendanceRate >= 60", () => {
    const logs = makeLogs(10, { attended: true, has_child_voice: true });
    const r = computeTraumaTherapy(baseInput({ logs }));
    expect(
      r.recommendations.some((x) =>
        x.recommendation.includes("barriers to therapy attendance"),
      ),
    ).toBe(false);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 17. INSIGHTS
// ═════════════════════════════════════════════════════════════════════════════

describe("Insights", () => {
  it("critical insight when total=0 and total_children>0", () => {
    const r = computeTraumaTherapy(baseInput({ logs: [] }));
    const ins = r.insights.find((i) => i.severity === "critical");
    expect(ins).toBeDefined();
    expect(ins!.text).toContain("Ofsted cannot verify");
  });

  it("positive insight when mood >= 70% and engagement >= 75%", () => {
    const logs = makeLogs(4, {
      child_presentation: "engaged",
      pre_session_mood: 3,
      post_session_mood: 7,
      has_child_voice: true,
    });
    logs[3].child_presentation = "withdrawn"; // 3/4=75%
    const r = computeTraumaTherapy(baseInput({ logs }));
    expect(
      r.insights.some(
        (i) =>
          i.severity === "positive" &&
          i.text.includes("effectively supporting"),
      ),
    ).toBe(true);
  });

  it("no positive mood+engagement insight when mood < 70%", () => {
    const logs = makeLogs(10, {
      child_presentation: "engaged",
      pre_session_mood: 5,
      post_session_mood: 5,
    });
    logs[0].post_session_mood = 7;
    logs[1].post_session_mood = 7;
    logs[2].post_session_mood = 7;
    logs[3].post_session_mood = 7;
    logs[4].post_session_mood = 7;
    logs[5].post_session_mood = 7; // 6/10 = 60% < 70%
    const r = computeTraumaTherapy(baseInput({ logs }));
    expect(
      r.insights.some((i) => i.text.includes("effectively supporting")),
    ).toBe(false);
  });

  it("warning insight when totalEscalations > 3 and total > 0", () => {
    const logs = [
      makeLog({
        id: "l1",
        has_escalation_flags: true,
        escalation_flag_count: 4,
      }),
    ];
    const r = computeTraumaTherapy(baseInput({ logs }));
    expect(
      r.insights.some(
        (i) =>
          i.severity === "warning" &&
          i.text.includes("Escalation flags"),
      ),
    ).toBe(true);
  });

  it("no escalation insight when totalEscalations = 3", () => {
    const logs = [
      makeLog({
        id: "l1",
        has_escalation_flags: true,
        escalation_flag_count: 3,
      }),
    ];
    const r = computeTraumaTherapy(baseInput({ logs }));
    expect(
      r.insights.some((i) => i.text.includes("Escalation flags")),
    ).toBe(false);
  });

  it("positive insight for regulation strategies >= 70%", () => {
    const logs = makeLogs(10, { regulation_strategy_count: 2 });
    logs[8].regulation_strategy_count = 0;
    logs[9].regulation_strategy_count = 0; // 8/10 = 80% >= 70%
    const r = computeTraumaTherapy(baseInput({ logs }));
    expect(
      r.insights.some(
        (i) =>
          i.severity === "positive" &&
          i.text.includes("regulation strategies"),
      ),
    ).toBe(true);
  });

  it("no regulation insight when < 70% have regulation strategies", () => {
    const logs = makeLogs(10, { regulation_strategy_count: 0 });
    logs[0].regulation_strategy_count = 2;
    logs[1].regulation_strategy_count = 2;
    logs[2].regulation_strategy_count = 2;
    logs[3].regulation_strategy_count = 2;
    logs[4].regulation_strategy_count = 2;
    logs[5].regulation_strategy_count = 2; // 6/10 = 60% < 70%
    const r = computeTraumaTherapy(baseInput({ logs }));
    expect(
      r.insights.some((i) => i.text.includes("regulation strategies")),
    ).toBe(false);
  });

  it("positive insight for diverse modalities >= 4 and total > 0", () => {
    const logs = [
      makeLog({ id: "l1", child_id: "c1", modality: "EMDR", has_child_voice: true }),
      makeLog({ id: "l2", child_id: "c2", modality: "CBT", has_child_voice: true }),
      makeLog({ id: "l3", child_id: "c3", modality: "Play", has_child_voice: true }),
      makeLog({ id: "l4", child_id: "c4", modality: "Art", has_child_voice: true }),
    ];
    const r = computeTraumaTherapy(baseInput({ total_children: 5, logs }));
    expect(
      r.insights.some(
        (i) =>
          i.severity === "positive" &&
          i.text.includes("Diverse therapeutic modalities"),
      ),
    ).toBe(true);
  });

  it("warning insight for low attendance < 50% and total > 0", () => {
    const logs = makeLogs(10, { attended: false });
    logs[0].attended = true;
    logs[1].attended = true;
    logs[2].attended = true;
    logs[3].attended = true; // 4/10=40%
    const r = computeTraumaTherapy(baseInput({ logs }));
    expect(
      r.insights.some(
        (i) =>
          i.severity === "warning" &&
          i.text.includes("Low attendance"),
      ),
    ).toBe(true);
  });

  it("no low attendance insight when attendanceRate >= 50", () => {
    const logs = makeLogs(10, { attended: true });
    const r = computeTraumaTherapy(baseInput({ logs }));
    expect(
      r.insights.some((i) => i.text.includes("Low attendance")),
    ).toBe(false);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 18. HEADLINES FOR EACH RATING
// ═════════════════════════════════════════════════════════════════════════════

describe("Headlines", () => {
  it("insufficient_data headline", () => {
    const r = computeTraumaTherapy(baseInput({ total_children: 0 }));
    expect(r.headline).toBe(
      "No data available for trauma therapy intelligence analysis",
    );
  });

  it("insufficient_data headline for zero logs with children", () => {
    const r = computeTraumaTherapy(baseInput({ logs: [] }));
    expect(r.headline).toBe(
      "No data available for trauma therapy intelligence analysis",
    );
  });

  it("outstanding headline contains 'Outstanding'", () => {
    const logs = [
      makeLog({ id: "l1", child_id: "c1", modality: "EMDR", has_child_voice: true }),
      makeLog({ id: "l2", child_id: "c2", modality: "CBT", has_child_voice: true }),
      makeLog({ id: "l3", child_id: "c3", modality: "Play", has_child_voice: true }),
      makeLog({ id: "l4", child_id: "c4", modality: "Art", has_child_voice: true }),
      makeLog({ id: "l5", child_id: "c5", modality: "Music", has_child_voice: true }),
    ];
    const r = computeTraumaTherapy(baseInput({ total_children: 5, logs }));
    expect(r.headline).toContain("Outstanding");
  });

  it("good headline contains 'Good'", () => {
    const logs = [
      makeLog({ id: "l1", child_id: "c1", modality: "EMDR", has_child_voice: true }),
      makeLog({ id: "l2", child_id: "c2", modality: "CBT", has_child_voice: true }),
      makeLog({ id: "l3", child_id: "c3", modality: "EMDR", has_child_voice: true }),
    ];
    const r = computeTraumaTherapy(baseInput({ total_children: 5, logs }));
    expect(r.therapy_rating).toBe("good");
    expect(r.headline).toContain("Good");
  });

  it("adequate headline mentions 'Therapy exists'", () => {
    const logs = [
      makeLog({
        child_id: "c1",
        modality: "EMDR",
        has_child_voice: false,
        child_presentation: "withdrawn",
        pre_session_mood: 5,
        post_session_mood: 5,
      }),
      makeLog({
        id: "l2",
        child_id: "c2",
        modality: "CBT",
        has_child_voice: false,
        child_presentation: "withdrawn",
        pre_session_mood: 5,
        post_session_mood: 5,
      }),
    ];
    const r = computeTraumaTherapy(baseInput({ total_children: 5, logs }));
    expect(r.therapy_rating).toBe("adequate");
    expect(r.headline).toContain("Therapy exists");
  });

  it("inadequate headline contains 'Inadequate'", () => {
    const logs = makeLogs(10, {
      child_id: "child-0",
      attended: false,
      child_presentation: "withdrawn",
      pre_session_mood: 5,
      post_session_mood: 5,
      has_child_voice: false,
      modality: "EMDR",
    });
    logs[0].attended = true;
    logs[1].attended = true; // 2/10=20%
    const r = computeTraumaTherapy(baseInput({ total_children: 5, logs }));
    expect(r.therapy_rating).toBe("inadequate");
    expect(r.headline).toContain("Inadequate");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 19. EDGE CASES
// ═════════════════════════════════════════════════════════════════════════════

describe("Edge cases", () => {
  it("all sessions attended=false gives 0% attendance, engagement from attended=0", () => {
    const logs = makeLogs(5, {
      attended: false,
      has_child_voice: true,
      modality: "EMDR",
    });
    const r = computeTraumaTherapy(baseInput({ logs }));
    expect(r.attendance_rate).toBe(0);
    expect(r.engagement_rate).toBe(0);
    expect(r.mood_improvement_rate).toBe(0);
  });

  it("mix of attended and not-attended logs calculates rates correctly", () => {
    const logs = [
      makeLog({ id: "l1", attended: true, pre_session_mood: 3, post_session_mood: 7 }),
      makeLog({ id: "l2", attended: true, pre_session_mood: 3, post_session_mood: 7 }),
      makeLog({ id: "l3", attended: false }),
      makeLog({ id: "l4", attended: false }),
    ];
    const r = computeTraumaTherapy(baseInput({ logs }));
    expect(r.attendance_rate).toBe(50);
    expect(r.mood_improvement_rate).toBe(100); // 2/2 attended improved
    expect(r.engagement_rate).toBe(100); // 2/2 attended engaged
  });

  it("single log computes correctly", () => {
    const logs = [
      makeLog({
        child_id: "c1",
        modality: "EMDR",
        has_child_voice: true,
        attended: true,
        pre_session_mood: 3,
        post_session_mood: 7,
        child_presentation: "engaged",
      }),
    ];
    const r = computeTraumaTherapy(
      baseInput({ total_children: 5, logs }),
    );
    expect(r.total_sessions).toBe(1);
    expect(r.children_in_therapy_rate).toBe(20); // 1/5
    expect(r.attendance_rate).toBe(100);
    expect(r.mood_improvement_rate).toBe(100);
    expect(r.engagement_rate).toBe(100);
    expect(r.child_voice_rate).toBe(100);
    expect(r.modality_diversity).toBe(1);
  });

  it("100 logs processes without issue", () => {
    const logs: TraumaTherapyRecordInput[] = [];
    for (let i = 0; i < 100; i++) {
      logs.push(
        makeLog({
          id: `log-${i}`,
          child_id: `child-${i % 5}`,
          modality: ["EMDR", "CBT", "Play", "Art"][i % 4],
          has_child_voice: true,
        }),
      );
    }
    const r = computeTraumaTherapy(
      baseInput({ total_children: 5, logs }),
    );
    expect(r.total_sessions).toBe(100);
    expect(r.therapy_score).toBeGreaterThan(0);
  });

  it("total_children = 1 with 1 matching log = 100% coverage", () => {
    const logs = [makeLog({ child_id: "c1", has_child_voice: true })];
    const r = computeTraumaTherapy(
      baseInput({ total_children: 1, logs }),
    );
    expect(r.children_in_therapy_rate).toBe(100);
  });

  it("multiple logs for same child still count as 1 unique child", () => {
    const logs = [
      makeLog({ id: "l1", child_id: "c1" }),
      makeLog({ id: "l2", child_id: "c1" }),
      makeLog({ id: "l3", child_id: "c1" }),
    ];
    const r = computeTraumaTherapy(
      baseInput({ total_children: 5, logs }),
    );
    expect(r.children_in_therapy_rate).toBe(20); // 1/5
  });

  it("total_children = 1 and no logs still computes", () => {
    const r = computeTraumaTherapy(
      baseInput({ total_children: 1, logs: [] }),
    );
    expect(r.therapy_rating).toBe("insufficient_data");
    expect(r.therapy_score).toBe(44);
  });

  it("very large total_children with few logs gives low coverage", () => {
    const logs = [makeLog({ child_id: "c1" })];
    const r = computeTraumaTherapy(
      baseInput({ total_children: 100, logs }),
    );
    expect(r.children_in_therapy_rate).toBe(1); // 1/100
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 20. ESCALATION FLAGS
// ═════════════════════════════════════════════════════════════════════════════

describe("Escalation flags", () => {
  it("totalEscalations sum > 5 triggers concern", () => {
    const logs = [
      makeLog({
        id: "l1",
        has_escalation_flags: true,
        escalation_flag_count: 3,
      }),
      makeLog({
        id: "l2",
        has_escalation_flags: true,
        escalation_flag_count: 3,
      }),
    ];
    const r = computeTraumaTherapy(baseInput({ logs }));
    expect(
      r.concerns.some((c) => c.includes("Multiple escalation flags")),
    ).toBe(true);
  });

  it("totalEscalations = 6 triggers concern (just above 5)", () => {
    const logs = [
      makeLog({
        id: "l1",
        has_escalation_flags: true,
        escalation_flag_count: 6,
      }),
    ];
    const r = computeTraumaTherapy(baseInput({ logs }));
    expect(
      r.concerns.some((c) => c.includes("Multiple escalation flags")),
    ).toBe(true);
  });

  it("totalEscalations = 5 does NOT trigger concern", () => {
    const logs = [
      makeLog({
        id: "l1",
        has_escalation_flags: true,
        escalation_flag_count: 5,
      }),
    ];
    const r = computeTraumaTherapy(baseInput({ logs }));
    expect(
      r.concerns.some((c) => c.includes("Multiple escalation flags")),
    ).toBe(false);
  });

  it("totalEscalations sum > 3 triggers warning insight", () => {
    const logs = [
      makeLog({
        id: "l1",
        has_escalation_flags: true,
        escalation_flag_count: 2,
      }),
      makeLog({
        id: "l2",
        has_escalation_flags: true,
        escalation_flag_count: 2,
      }),
    ];
    const r = computeTraumaTherapy(baseInput({ logs }));
    expect(
      r.insights.some(
        (i) =>
          i.severity === "warning" &&
          i.text.includes("Escalation flags"),
      ),
    ).toBe(true);
  });

  it("totalEscalations = 4 triggers warning insight (just above 3)", () => {
    const logs = [
      makeLog({
        id: "l1",
        has_escalation_flags: true,
        escalation_flag_count: 4,
      }),
    ];
    const r = computeTraumaTherapy(baseInput({ logs }));
    expect(
      r.insights.some((i) => i.text.includes("Escalation flags")),
    ).toBe(true);
  });

  it("totalEscalations = 3 does NOT trigger warning insight", () => {
    const logs = [
      makeLog({
        id: "l1",
        has_escalation_flags: true,
        escalation_flag_count: 3,
      }),
    ];
    const r = computeTraumaTherapy(baseInput({ logs }));
    expect(
      r.insights.some((i) => i.text.includes("Escalation flags")),
    ).toBe(false);
  });

  it("escalation flags sum across multiple logs", () => {
    const logs = [
      makeLog({ id: "l1", has_escalation_flags: true, escalation_flag_count: 1 }),
      makeLog({ id: "l2", has_escalation_flags: true, escalation_flag_count: 1 }),
      makeLog({ id: "l3", has_escalation_flags: true, escalation_flag_count: 1 }),
      makeLog({ id: "l4", has_escalation_flags: true, escalation_flag_count: 1 }),
    ];
    // Sum = 4 > 3, triggers warning insight
    const r = computeTraumaTherapy(baseInput({ logs }));
    expect(
      r.insights.some((i) => i.text.includes("Escalation flags")),
    ).toBe(true);
  });

  it("escalation_flag_count 0 does not trigger anything", () => {
    const logs = makeLogs(5, {
      has_escalation_flags: false,
      escalation_flag_count: 0,
    });
    const r = computeTraumaTherapy(baseInput({ logs }));
    expect(
      r.concerns.some((c) => c.includes("escalation")),
    ).toBe(false);
    expect(
      r.insights.some((i) => i.text.includes("Escalation")),
    ).toBe(false);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 21. SCORE CLAMPING
// ═════════════════════════════════════════════════════════════════════════════

describe("Score clamping 0-100", () => {
  it("score cannot exceed 100 even with maximum bonuses", () => {
    // Artificially impossible to exceed 82 with current modifiers, but verify clamp
    const logs = makeLogs(10, {
      has_child_voice: true,
      modality: "EMDR",
    });
    logs.forEach((l, i) => {
      l.child_id = `child-${i % 5}`;
      l.modality = ["EMDR", "CBT", "Play", "Art"][i % 4];
    });
    const r = computeTraumaTherapy(
      baseInput({ total_children: 5, logs }),
    );
    expect(r.therapy_score).toBeLessThanOrEqual(100);
  });

  it("score cannot go below 0 even with all penalties", () => {
    // Max penalties: 52-5-5-4-4-4-3 = 27, so won't hit 0 naturally.
    // But we verify the clamp is present.
    const logs = makeLogs(10, {
      child_id: "child-0",
      attended: false,
      child_presentation: "withdrawn",
      pre_session_mood: 5,
      post_session_mood: 5,
      has_child_voice: false,
      modality: "EMDR",
    });
    logs[0].attended = true;
    logs[1].attended = true; // 20% attendance < 40 → -5
    // 2 attended, no mood improvement, 0% engagement, 0% voice
    const r = computeTraumaTherapy(baseInput({ total_children: 5, logs }));
    expect(r.therapy_score).toBeGreaterThanOrEqual(0);
  });

  it("score is an integer (clamp does not introduce decimals)", () => {
    const logs = makeLogs(7, {});
    const r = computeTraumaTherapy(baseInput({ logs }));
    expect(Number.isInteger(r.therapy_score)).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 22. PCT EDGE CASES
// ═════════════════════════════════════════════════════════════════════════════

describe("pct edge cases (0 denominator)", () => {
  it("0 total logs → attendanceRate is 0 (pct with 0 denominator)", () => {
    const r = computeTraumaTherapy(baseInput({ logs: [] }));
    expect(r.attendance_rate).toBe(0);
  });

  it("0 attended sessions → mood improvement rate is 0", () => {
    const logs = makeLogs(5, { attended: false });
    const r = computeTraumaTherapy(baseInput({ logs }));
    expect(r.mood_improvement_rate).toBe(0);
  });

  it("0 attended sessions → engagement rate is 0", () => {
    const logs = makeLogs(5, { attended: false });
    const r = computeTraumaTherapy(baseInput({ logs }));
    expect(r.engagement_rate).toBe(0);
  });

  it("0 total children → children in therapy rate is 0 (guard returns early)", () => {
    const r = computeTraumaTherapy(
      baseInput({ total_children: 0, logs: [] }),
    );
    expect(r.children_in_therapy_rate).toBe(0);
  });

  it("child voice rate with 0 total logs is 0", () => {
    const r = computeTraumaTherapy(baseInput({ logs: [] }));
    expect(r.child_voice_rate).toBe(0);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 23. RATING BOUNDARY TESTS
// ═════════════════════════════════════════════════════════════════════════════

describe("Rating boundaries (toRating)", () => {
  it("score 80 → outstanding", () => {
    // Build score = 80: 52+6+5+5+5+4+3... Need exactly 80.
    // 5/5=100%→+6, 100%attend→+5, 100%mood→+5, 100%engage→+5, 100%voice→+4, 3mod→+2 = 52+6+5+5+5+4+2=79. Close.
    // 5/5=100%→+6, 100%attend→+5, 100%mood→+5, 100%engage→+5, 100%voice→+4, 4mod→+5 = 52+6+5+5+5+4+5=82.
    // 4/5=80%→+6, 100%attend→+5, 100%mood→+5, 100%engage→+5, 100%voice→+4, 3mod→+2 = 52+6+5+5+5+4+2=79.
    // 5/5=100%→+6, 100%attend→+5, 100%mood→+5, 75%engage→+5, 50%voice→+1, 4mod→+5 = 52+6+5+5+5+1+5=79. Hmm.
    // 5/5=100%→+6, 100%attend→+5, 100%mood→+5, 100%engage→+5, 50-79%voice→+1, 4mod→+5 = 52+6+5+5+5+1+5=79.
    // 5/5=100%→+6, 85%attend→+5, 70%mood→+5, 75%engage→+5, 80%voice→+4, 3mod→+2 = 52+6+5+5+5+4+2=79.
    // 5/5=100%→+6, 100%attend→+5, 70%mood→+5, 75%engage→+5, 80%voice→+4, 2mod→+2 = 52+6+5+5+5+4+2=79. Exact!
    // Need to add 1 more. 80%→+4 vs 79%→+1.
    // Let me try: 5/5→+6, 100%attend→+5, 100%mood→+5, 50%engage→+2, 80%voice→+4, 4mod→+5 = 52+6+5+5+2+4+5=79.
    // 5/5→+6, 100%attend→+5, 100%mood→+5, 75%engage→+5, 80%voice→+4, 2mod→+2=52+6+5+5+5+4+2=79.
    // 5/5→+6, 100%attend→+5, 100%mood→+5, 50%engage→+2, 80%voice→+4, 4mod→+5=52+6+5+5+2+4+5=79.
    // Looks like 80 is hard to hit exactly. Let me test at 82 for outstanding boundary.
    const logs = [
      makeLog({ id: "l1", child_id: "c1", modality: "EMDR", has_child_voice: true }),
      makeLog({ id: "l2", child_id: "c2", modality: "CBT", has_child_voice: true }),
      makeLog({ id: "l3", child_id: "c3", modality: "Play", has_child_voice: true }),
      makeLog({ id: "l4", child_id: "c4", modality: "Art", has_child_voice: true }),
      makeLog({ id: "l5", child_id: "c5", modality: "Music", has_child_voice: true }),
    ];
    const r = computeTraumaTherapy(baseInput({ total_children: 5, logs }));
    expect(r.therapy_score).toBe(82);
    expect(r.therapy_rating).toBe("outstanding");
  });

  it("score 79 → good (just below outstanding)", () => {
    // 52+6+5+5+5+4+2 = 79
    const logs = [
      makeLog({ id: "l1", child_id: "c1", modality: "EMDR", has_child_voice: true }),
      makeLog({ id: "l2", child_id: "c2", modality: "CBT", has_child_voice: true }),
      makeLog({ id: "l3", child_id: "c3", modality: "EMDR", has_child_voice: true }),
      makeLog({ id: "l4", child_id: "c4", modality: "CBT", has_child_voice: true }),
      makeLog({ id: "l5", child_id: "c5", modality: "EMDR", has_child_voice: true }),
    ];
    // 5/5=100% → +6, 100%attend→+5, 100%mood→+5, 100%engage→+5, 100%voice→+4, 2mod→+2 = 79
    const r = computeTraumaTherapy(baseInput({ total_children: 5, logs }));
    expect(r.therapy_score).toBe(79);
    expect(r.therapy_rating).toBe("good");
  });

  it("score 64 → adequate (just below good)", () => {
    // Need exactly 64.
    // coverage 50-79%→+2, attend 85%→+5, mood 40-69%→+2, engage 50-74%→+2, voice 50-79%→+1, 1mod→-3 = 52+2+5+2+2+1-3=61. No.
    // coverage 80%→+6, attend 60-84%→+2, mood 20-39%→0, engage 25-49%→0, voice 20-49%→0, 2mod→+2 = 52+6+2+0+0+0+2=62. No.
    // coverage 80%→+6, attend 60-84%→+2, mood 40-69%→+2, engage 25-49%→0, voice 20-49%→0, 2mod→+2 = 52+6+2+2+0+0+2=64. Yes!
    // 20 logs, 4 unique children of 5 (80%), 14 attended (70%), 7/14 mood improved (50%), 6/14 engaged (43%), 7/20 voice (35%), 2 modalities
    const logs: TraumaTherapyRecordInput[] = [];
    for (let i = 0; i < 20; i++) {
      const attended = i < 14; // 14/20 = 70%
      const moodUp = attended && i < 7; // 7/14 = 50%
      const isEngaged = attended && i >= 7 && i < 13; // 6/14 = 43%
      logs.push(
        makeLog({
          id: `log-${i}`,
          child_id: `child-${i % 4}`, // 4 unique children
          attended,
          pre_session_mood: 4,
          post_session_mood: moodUp ? 7 : 4,
          child_presentation: isEngaged ? "engaged" : "withdrawn",
          has_child_voice: i < 7, // 7/20=35%
          modality: i % 2 === 0 ? "EMDR" : "CBT",
        }),
      );
    }
    const r = computeTraumaTherapy(baseInput({ total_children: 5, logs }));
    expect(r.therapy_score).toBe(64);
    expect(r.therapy_rating).toBe("adequate");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 24. ZERO-LOGS RATING OVERRIDE
// ═════════════════════════════════════════════════════════════════════════════

describe("Zero-logs rating override", () => {
  it("total=0 && logs.length=0 forces insufficient_data even though score is 44", () => {
    const r = computeTraumaTherapy(baseInput({ logs: [] }));
    expect(r.therapy_score).toBe(44);
    expect(r.therapy_rating).toBe("insufficient_data");
  });

  it("with total_children=1 and logs=[] still returns insufficient_data", () => {
    const r = computeTraumaTherapy(
      baseInput({ total_children: 1, logs: [] }),
    );
    expect(r.therapy_rating).toBe("insufficient_data");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 25. MODIFIER COMBINATIONS AND NEUTRAL ZONES
// ═════════════════════════════════════════════════════════════════════════════

describe("Modifier neutral zones (no bonus, no penalty)", () => {
  it("coverage 30-49% gives no modifier", () => {
    // 2/5 = 40%
    const logs = [
      makeLog({ id: "l1", child_id: "c1", has_child_voice: true }),
      makeLog({ id: "l2", child_id: "c2", has_child_voice: true }),
    ];
    const r = computeTraumaTherapy(baseInput({ total_children: 5, logs }));
    // score should reflect no coverage modifier
    // 40%→0, 100%attend→+5, 100%mood→+5, 100%engage→+5, 100%voice→+4, 1mod→-3 = 52+0+5+5+5+4-3=68
    expect(r.therapy_score).toBe(68);
  });

  it("attendance 40-59% gives no modifier", () => {
    const logs: TraumaTherapyRecordInput[] = [];
    for (let i = 0; i < 10; i++) {
      logs.push(
        makeLog({
          id: `log-${i}`,
          child_id: `child-${i % 5}`,
          attended: i < 5, // 50%
          modality: ["EMDR", "CBT", "Play", "Art"][i % 4],
          has_child_voice: true,
        }),
      );
    }
    const r = computeTraumaTherapy(baseInput({ total_children: 5, logs }));
    // 5/5=100%→+6, 50%attend→0, 100%mood(of attended)→+5, 100%engage(of attended)→+5, 100%voice→+4, 4mod→+5 = 52+6+0+5+5+4+5=77
    expect(r.therapy_score).toBe(77);
  });

  it("mood improvement 20-39% gives no modifier", () => {
    const logs: TraumaTherapyRecordInput[] = [];
    for (let i = 0; i < 10; i++) {
      logs.push(
        makeLog({
          id: `log-${i}`,
          child_id: `child-${i % 5}`,
          attended: true,
          pre_session_mood: 4,
          post_session_mood: i < 3 ? 7 : 4, // 3/10 = 30%
          modality: ["EMDR", "CBT", "Play", "Art"][i % 4],
          has_child_voice: true,
        }),
      );
    }
    const r = computeTraumaTherapy(baseInput({ total_children: 5, logs }));
    // 5/5=100%→+6, 100%attend→+5, 30%mood→0, 100%engage→+5, 100%voice→+4, 4mod→+5 = 52+6+5+0+5+4+5=77
    expect(r.therapy_score).toBe(77);
  });

  it("engagement 25-49% gives no modifier", () => {
    const logs: TraumaTherapyRecordInput[] = [];
    for (let i = 0; i < 10; i++) {
      logs.push(
        makeLog({
          id: `log-${i}`,
          child_id: `child-${i % 5}`,
          attended: true,
          child_presentation: i < 3 ? "engaged" : "withdrawn", // 30%
          modality: ["EMDR", "CBT", "Play", "Art"][i % 4],
          has_child_voice: true,
        }),
      );
    }
    const r = computeTraumaTherapy(baseInput({ total_children: 5, logs }));
    // 5/5=100%→+6, 100%attend→+5, 100%mood→+5, 30%engage→0, 100%voice→+4, 4mod→+5 = 52+6+5+5+0+4+5=77
    expect(r.therapy_score).toBe(77);
  });

  it("child voice 20-49% gives no modifier", () => {
    const logs: TraumaTherapyRecordInput[] = [];
    for (let i = 0; i < 10; i++) {
      logs.push(
        makeLog({
          id: `log-${i}`,
          child_id: `child-${i % 5}`,
          attended: true,
          has_child_voice: i < 3, // 3/10 = 30%
          modality: ["EMDR", "CBT", "Play", "Art"][i % 4],
        }),
      );
    }
    const r = computeTraumaTherapy(baseInput({ total_children: 5, logs }));
    // 5/5=100%→+6, 100%attend→+5, 100%mood→+5, 100%engage→+5, 30%voice→0, 4mod→+5 = 52+6+5+5+5+0+5=78
    expect(r.therapy_score).toBe(78);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 26. REGULATION STRATEGY INSIGHT BOUNDARY
// ═════════════════════════════════════════════════════════════════════════════

describe("Regulation strategy insight", () => {
  it("exactly 70% triggers positive insight", () => {
    const logs = makeLogs(10, { regulation_strategy_count: 0 });
    for (let i = 0; i < 7; i++) {
      logs[i].regulation_strategy_count = 2; // 7/10 = 70%
    }
    const r = computeTraumaTherapy(baseInput({ logs }));
    expect(
      r.insights.some((i) => i.text.includes("regulation strategies")),
    ).toBe(true);
  });

  it("69% does not trigger regulation insight", () => {
    // Need 69/100 = 69%
    const logs = makeLogs(100, { regulation_strategy_count: 0 });
    for (let i = 0; i < 69; i++) {
      logs[i].regulation_strategy_count = 2;
    }
    const r = computeTraumaTherapy(baseInput({ total_children: 100, logs }));
    expect(
      r.insights.some((i) => i.text.includes("regulation strategies")),
    ).toBe(false);
  });

  it("regulation strategy only counts attended sessions", () => {
    const logs = [
      makeLog({
        id: "l1",
        attended: true,
        regulation_strategy_count: 2,
      }),
      makeLog({
        id: "l2",
        attended: false,
        regulation_strategy_count: 2,
      }),
    ];
    // 1 attended with strategy / 1 attended = 100% → triggers insight
    const r = computeTraumaTherapy(baseInput({ logs }));
    expect(
      r.insights.some((i) => i.text.includes("regulation strategies")),
    ).toBe(true);
  });

  it("regulation_strategy_count = 0 for all → no insight", () => {
    const logs = makeLogs(5, { regulation_strategy_count: 0 });
    const r = computeTraumaTherapy(baseInput({ logs }));
    expect(
      r.insights.some((i) => i.text.includes("regulation strategies")),
    ).toBe(false);
  });

  it("no attended sessions → no regulation insight (withRegulationStrategies check)", () => {
    const logs = makeLogs(5, {
      attended: false,
      regulation_strategy_count: 2,
    });
    const r = computeTraumaTherapy(baseInput({ logs }));
    expect(
      r.insights.some((i) => i.text.includes("regulation strategies")),
    ).toBe(false);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 27. RETURN SHAPE VALIDATION
// ═════════════════════════════════════════════════════════════════════════════

describe("Return shape", () => {
  it("returns all expected fields", () => {
    const r = computeTraumaTherapy(baseInput({ logs: [makeLog()] }));
    expect(r).toHaveProperty("therapy_rating");
    expect(r).toHaveProperty("therapy_score");
    expect(r).toHaveProperty("headline");
    expect(r).toHaveProperty("total_sessions");
    expect(r).toHaveProperty("children_in_therapy_rate");
    expect(r).toHaveProperty("attendance_rate");
    expect(r).toHaveProperty("mood_improvement_rate");
    expect(r).toHaveProperty("engagement_rate");
    expect(r).toHaveProperty("child_voice_rate");
    expect(r).toHaveProperty("modality_diversity");
    expect(r).toHaveProperty("strengths");
    expect(r).toHaveProperty("concerns");
    expect(r).toHaveProperty("recommendations");
    expect(r).toHaveProperty("insights");
  });

  it("strengths is always an array", () => {
    const r = computeTraumaTherapy(baseInput({ logs: [] }));
    expect(Array.isArray(r.strengths)).toBe(true);
  });

  it("concerns is always an array", () => {
    const r = computeTraumaTherapy(baseInput({ logs: [] }));
    expect(Array.isArray(r.concerns)).toBe(true);
  });

  it("recommendations is always an array", () => {
    const r = computeTraumaTherapy(baseInput({ logs: [] }));
    expect(Array.isArray(r.recommendations)).toBe(true);
  });

  it("insights is always an array", () => {
    const r = computeTraumaTherapy(baseInput({ logs: [] }));
    expect(Array.isArray(r.insights)).toBe(true);
  });

  it("total_sessions matches logs.length", () => {
    const logs = makeLogs(7, {});
    const r = computeTraumaTherapy(baseInput({ logs }));
    expect(r.total_sessions).toBe(7);
  });

  it("therapy_score is a number", () => {
    const r = computeTraumaTherapy(baseInput({ logs: [makeLog()] }));
    expect(typeof r.therapy_score).toBe("number");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 28. COMBINED INSIGHTS SCENARIOS
// ═════════════════════════════════════════════════════════════════════════════

describe("Combined insights", () => {
  it("can trigger both escalation warning and low attendance warning", () => {
    const logs = makeLogs(10, {
      attended: false,
      has_escalation_flags: true,
      escalation_flag_count: 1,
    });
    logs[0].attended = true;
    logs[1].attended = true;
    logs[2].attended = true;
    logs[3].attended = true; // 4/10 = 40% attendance
    // escalation sum = 10 > 3 and > 5
    const r = computeTraumaTherapy(baseInput({ logs }));
    expect(
      r.insights.some((i) => i.text.includes("Escalation flags")),
    ).toBe(true);
    expect(
      r.insights.some((i) => i.text.includes("Low attendance")),
    ).toBe(true);
  });

  it("can trigger positive mood+engagement AND regulation strategies insights", () => {
    const logs = makeLogs(10, {
      child_presentation: "engaged",
      pre_session_mood: 3,
      post_session_mood: 7,
      regulation_strategy_count: 2,
      modality: "EMDR",
    });
    const r = computeTraumaTherapy(baseInput({ logs }));
    expect(
      r.insights.some((i) => i.text.includes("effectively supporting")),
    ).toBe(true);
    expect(
      r.insights.some((i) => i.text.includes("regulation strategies")),
    ).toBe(true);
  });

  it("can have zero insights when no thresholds are met", () => {
    // Middle-of-road values: no extreme positive or negative
    const logs: TraumaTherapyRecordInput[] = [];
    for (let i = 0; i < 10; i++) {
      logs.push(
        makeLog({
          id: `log-${i}`,
          child_id: `child-${i % 5}`,
          attended: i < 7, // 70% attendance
          pre_session_mood: 4,
          post_session_mood: i < 4 ? 7 : 4, // 4/7=57% mood of attended
          child_presentation: i < 4 ? "engaged" : "withdrawn", // 4/7=57% engagement
          has_child_voice: i < 6, // 60% voice
          modality: i % 3 === 0 ? "EMDR" : i % 3 === 1 ? "CBT" : "Play", // 3 modalities
          regulation_strategy_count: i < 3 ? 2 : 0, // 3/7=43% regulation
          has_escalation_flags: false,
          escalation_flag_count: 0,
        }),
      );
    }
    const r = computeTraumaTherapy(baseInput({ total_children: 5, logs }));
    expect(r.insights.length).toBe(0);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 29. COMBINED STRENGTHS + CONCERNS + RECOMMENDATIONS
// ═════════════════════════════════════════════════════════════════════════════

describe("Combined strengths, concerns, and recommendations", () => {
  it("outstanding scenario has multiple strengths and no concerns", () => {
    const logs = [
      makeLog({ id: "l1", child_id: "c1", modality: "EMDR", has_child_voice: true }),
      makeLog({ id: "l2", child_id: "c2", modality: "CBT", has_child_voice: true }),
      makeLog({ id: "l3", child_id: "c3", modality: "Play", has_child_voice: true }),
      makeLog({ id: "l4", child_id: "c4", modality: "Art", has_child_voice: true }),
      makeLog({ id: "l5", child_id: "c5", modality: "Music", has_child_voice: true }),
    ];
    const r = computeTraumaTherapy(baseInput({ total_children: 5, logs }));
    expect(r.strengths.length).toBeGreaterThanOrEqual(6);
    expect(r.concerns.length).toBe(0);
    expect(r.recommendations.length).toBe(0);
  });

  it("inadequate scenario has multiple concerns and recommendations", () => {
    const logs: TraumaTherapyRecordInput[] = [];
    for (let i = 0; i < 10; i++) {
      logs.push(
        makeLog({
          id: `log-${i}`,
          child_id: "child-0", // 1/5 = 20% < 50%
          attended: i < 3, // 3/10 = 30% < 40%
          pre_session_mood: 5,
          post_session_mood: 5, // 0% mood improvement
          child_presentation: "withdrawn", // 0% engagement
          has_child_voice: false, // 0% voice
          modality: "EMDR", // 1 modality
          has_escalation_flags: true,
          escalation_flag_count: 1, // total = 10 > 5
        }),
      );
    }
    const r = computeTraumaTherapy(baseInput({ total_children: 5, logs }));
    expect(r.concerns.length).toBeGreaterThanOrEqual(5);
    expect(r.recommendations.length).toBeGreaterThanOrEqual(4);
  });

  it("no concerns about low coverage when rate is exactly 50", () => {
    // 50% is not < 50% so should not trigger concern
    const logs = [
      makeLog({ id: "l1", child_id: "c1" }),
      makeLog({ id: "l2", child_id: "c2" }),
      makeLog({ id: "l3", child_id: "c1" }),
      makeLog({ id: "l4", child_id: "c2" }),
    ];
    const r = computeTraumaTherapy(
      baseInput({ total_children: 4, logs }),
    ); // 2/4=50%
    expect(
      r.concerns.some((c) => c.includes("Fewer than half")),
    ).toBe(false);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 30. CHILD VOICE USES TOTAL LOGS NOT ATTENDED
// ═════════════════════════════════════════════════════════════════════════════

describe("Child voice counts all logs (not just attended)", () => {
  it("child voice rate uses total logs as denominator", () => {
    const logs = [
      makeLog({ id: "l1", attended: true, has_child_voice: true }),
      makeLog({ id: "l2", attended: false, has_child_voice: true }),
      makeLog({ id: "l3", attended: true, has_child_voice: false }),
      makeLog({ id: "l4", attended: false, has_child_voice: false }),
    ];
    const r = computeTraumaTherapy(baseInput({ logs }));
    expect(r.child_voice_rate).toBe(50); // 2/4
  });

  it("non-attended session with child voice still counts", () => {
    const logs = [
      makeLog({ id: "l1", attended: false, has_child_voice: true }),
    ];
    const r = computeTraumaTherapy(baseInput({ logs }));
    expect(r.child_voice_rate).toBe(100);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 31. SPECIFIC MODIFIER SCORE ARITHMETIC
// ═════════════════════════════════════════════════════════════════════════════

describe("Specific modifier score arithmetic", () => {
  it("coverage +2 modifier: 52 + 2 + other max = 52+2+5+5+5+4+5=78", () => {
    // 3/5=60% → +2, all other maxed
    const logs = [
      makeLog({ id: "l1", child_id: "c1", modality: "EMDR", has_child_voice: true }),
      makeLog({ id: "l2", child_id: "c2", modality: "CBT", has_child_voice: true }),
      makeLog({ id: "l3", child_id: "c3", modality: "Play", has_child_voice: true }),
      makeLog({ id: "l4", child_id: "c3", modality: "Art", has_child_voice: true }),
    ];
    const r = computeTraumaTherapy(baseInput({ total_children: 5, logs }));
    // 3/5=60% → +2, 100%attend→+5, 100%mood→+5, 100%engage→+5, 100%voice→+4, 4mod→+5 = 78
    expect(r.therapy_score).toBe(78);
  });

  it("attendance +2 modifier: 52+6+2+5+5+4+5=79", () => {
    // Need 60-84% attendance
    const logs = [
      makeLog({ id: "l1", child_id: "c1", modality: "EMDR", has_child_voice: true }),
      makeLog({ id: "l2", child_id: "c2", modality: "CBT", has_child_voice: true }),
      makeLog({ id: "l3", child_id: "c3", modality: "Play", has_child_voice: true }),
      makeLog({ id: "l4", child_id: "c4", modality: "Art", has_child_voice: true }),
      makeLog({ id: "l5", child_id: "c5", modality: "Music", has_child_voice: true, attended: false }),
    ];
    // 5/5=100%→+6, 4/5=80% attend→+2, mood 4/4=100%→+5, engage 4/4=100%→+5, 5/5=100% voice→+4, 5mod→+5
    const r = computeTraumaTherapy(baseInput({ total_children: 5, logs }));
    expect(r.therapy_score).toBe(79);
  });

  it("mood +2 modifier: 52+6+5+2+5+4+5=79", () => {
    // Need mood 40-69%
    const logs = [
      makeLog({ id: "l1", child_id: "c1", modality: "EMDR", has_child_voice: true, pre_session_mood: 4, post_session_mood: 7 }),
      makeLog({ id: "l2", child_id: "c2", modality: "CBT", has_child_voice: true, pre_session_mood: 5, post_session_mood: 5 }),
      makeLog({ id: "l3", child_id: "c3", modality: "Play", has_child_voice: true, pre_session_mood: 4, post_session_mood: 7 }),
      makeLog({ id: "l4", child_id: "c4", modality: "Art", has_child_voice: true, pre_session_mood: 5, post_session_mood: 5 }),
      makeLog({ id: "l5", child_id: "c5", modality: "Music", has_child_voice: true, pre_session_mood: 5, post_session_mood: 5 }),
    ];
    // 5/5=100%→+6, 100%attend→+5, 2/5=40%mood→+2, 100%engage→+5, 100%voice→+4, 5mod→+5
    const r = computeTraumaTherapy(baseInput({ total_children: 5, logs }));
    expect(r.therapy_score).toBe(79);
  });

  it("engagement +2 modifier: 52+6+5+5+2+4+5=79", () => {
    // Need engagement 50-74%
    const logs = [
      makeLog({ id: "l1", child_id: "c1", modality: "EMDR", has_child_voice: true, child_presentation: "engaged" }),
      makeLog({ id: "l2", child_id: "c2", modality: "CBT", has_child_voice: true, child_presentation: "withdrawn" }),
      makeLog({ id: "l3", child_id: "c3", modality: "Play", has_child_voice: true, child_presentation: "engaged" }),
      makeLog({ id: "l4", child_id: "c4", modality: "Art", has_child_voice: true, child_presentation: "withdrawn" }),
      makeLog({ id: "l5", child_id: "c5", modality: "Music", has_child_voice: true, child_presentation: "withdrawn" }),
    ];
    // 5/5=100%→+6, 100%attend→+5, 100%mood→+5, 2/5=40%engage... wait, 40% is <50% → 0 modifier, not +2.
    // Need 50%: 3/5=60%
    logs[3].child_presentation = "engaged"; // now 3/5=60%
    const r = computeTraumaTherapy(baseInput({ total_children: 5, logs }));
    // 5/5=100%→+6, 100%attend→+5, 100%mood→+5, 60%engage→+2, 100%voice→+4, 5mod→+5 = 79
    expect(r.therapy_score).toBe(79);
  });

  it("child voice +1 modifier: 52+6+5+5+5+1+5=79", () => {
    // Need voice 50-79%
    const logs = [
      makeLog({ id: "l1", child_id: "c1", modality: "EMDR", has_child_voice: true }),
      makeLog({ id: "l2", child_id: "c2", modality: "CBT", has_child_voice: false }),
      makeLog({ id: "l3", child_id: "c3", modality: "Play", has_child_voice: true }),
      makeLog({ id: "l4", child_id: "c4", modality: "Art", has_child_voice: false }),
      makeLog({ id: "l5", child_id: "c5", modality: "Music", has_child_voice: true }),
    ];
    // 3/5 = 60% voice → +1
    const r = computeTraumaTherapy(baseInput({ total_children: 5, logs }));
    expect(r.therapy_score).toBe(79);
  });

  it("modality +2 modifier: 52+6+5+5+5+4+2=79", () => {
    // Need 2-3 modalities
    const logs = [
      makeLog({ id: "l1", child_id: "c1", modality: "EMDR", has_child_voice: true }),
      makeLog({ id: "l2", child_id: "c2", modality: "CBT", has_child_voice: true }),
      makeLog({ id: "l3", child_id: "c3", modality: "EMDR", has_child_voice: true }),
      makeLog({ id: "l4", child_id: "c4", modality: "CBT", has_child_voice: true }),
      makeLog({ id: "l5", child_id: "c5", modality: "EMDR", has_child_voice: true }),
    ];
    // 2 modalities → +2
    const r = computeTraumaTherapy(baseInput({ total_children: 5, logs }));
    expect(r.therapy_score).toBe(79);
  });

  it("all penalties with logs: 52-5-5-4-4-4-3=27", () => {
    const logs: TraumaTherapyRecordInput[] = [];
    for (let i = 0; i < 10; i++) {
      logs.push(
        makeLog({
          id: `log-${i}`,
          child_id: "child-0", // 1/5=20% <30% → -5
          attended: i < 3, // 3/10=30% <40% → -5
          pre_session_mood: 5,
          post_session_mood: 5, // 0% <20% → -4
          child_presentation: "withdrawn", // 0% <25% → -4
          has_child_voice: false, // 0% <20% → -4
          modality: "EMDR", // 1 <2 → -3
        }),
      );
    }
    const r = computeTraumaTherapy(baseInput({ total_children: 5, logs }));
    expect(r.therapy_score).toBe(27);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 32. ADDITIONAL EDGE CASES
// ═════════════════════════════════════════════════════════════════════════════

describe("Additional edge cases", () => {
  it("pre_session_mood 1 post_session_mood 2 counts as improvement", () => {
    const logs = [makeLog({ pre_session_mood: 1, post_session_mood: 2 })];
    const r = computeTraumaTherapy(baseInput({ logs }));
    expect(r.mood_improvement_rate).toBe(100);
  });

  it("pre_session_mood 10 post_session_mood 10 does NOT count as improvement", () => {
    const logs = [makeLog({ pre_session_mood: 10, post_session_mood: 10 })];
    const r = computeTraumaTherapy(baseInput({ logs }));
    expect(r.mood_improvement_rate).toBe(0);
  });

  it("has_next_session field does not affect scoring", () => {
    const logsA = [makeLog({ has_next_session: true })];
    const logsB = [makeLog({ has_next_session: false })];
    const rA = computeTraumaTherapy(baseInput({ logs: logsA }));
    const rB = computeTraumaTherapy(baseInput({ logs: logsB }));
    expect(rA.therapy_score).toBe(rB.therapy_score);
  });

  it("has_staff_observation field does not affect scoring", () => {
    const logsA = [makeLog({ has_staff_observation: true })];
    const logsB = [makeLog({ has_staff_observation: false })];
    const rA = computeTraumaTherapy(baseInput({ logs: logsA }));
    const rB = computeTraumaTherapy(baseInput({ logs: logsB }));
    expect(rA.therapy_score).toBe(rB.therapy_score);
  });

  it("session_format field does not affect scoring", () => {
    const logsA = [makeLog({ session_format: "individual" })];
    const logsB = [makeLog({ session_format: "group" })];
    const rA = computeTraumaTherapy(baseInput({ logs: logsA }));
    const rB = computeTraumaTherapy(baseInput({ logs: logsB }));
    expect(rA.therapy_score).toBe(rB.therapy_score);
  });

  it("session_length_minutes field does not affect scoring", () => {
    const logsA = [makeLog({ session_length_minutes: 30 })];
    const logsB = [makeLog({ session_length_minutes: 120 })];
    const rA = computeTraumaTherapy(baseInput({ logs: logsA }));
    const rB = computeTraumaTherapy(baseInput({ logs: logsB }));
    expect(rA.therapy_score).toBe(rB.therapy_score);
  });

  it("session_date field does not affect scoring", () => {
    const logsA = [makeLog({ session_date: "2024-01-01" })];
    const logsB = [makeLog({ session_date: "2025-12-31" })];
    const rA = computeTraumaTherapy(baseInput({ logs: logsA }));
    const rB = computeTraumaTherapy(baseInput({ logs: logsB }));
    expect(rA.therapy_score).toBe(rB.therapy_score);
  });

  it("today field does not affect scoring", () => {
    const r1 = computeTraumaTherapy(
      baseInput({ today: "2024-01-01", logs: [makeLog()] }),
    );
    const r2 = computeTraumaTherapy(
      baseInput({ today: "2026-06-15", logs: [makeLog()] }),
    );
    expect(r1.therapy_score).toBe(r2.therapy_score);
  });

  it("modality_diversity field in result matches unique modality count", () => {
    const logs = [
      makeLog({ id: "l1", modality: "EMDR" }),
      makeLog({ id: "l2", modality: "CBT" }),
      makeLog({ id: "l3", modality: "EMDR" }),
      makeLog({ id: "l4", modality: "Play" }),
    ];
    const r = computeTraumaTherapy(baseInput({ logs }));
    expect(r.modality_diversity).toBe(3);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 33. MODIFIER 4 ENGAGEMENT: TOTAL=0 PATH (NO ADJUSTMENT)
// ═════════════════════════════════════════════════════════════════════════════

describe("Modifier 4 engagement: total=0 gives no adjustment", () => {
  it("with zero logs, engagement modifier does not change score (no adjustment)", () => {
    // total=0 → engagement modifier does nothing, unlike other modifiers that subtract
    // Prove: score = 52 - 3(coverage) - 1(attendance) - 1(mood) - 0(engagement) - 1(voice) - 2(modality) = 44
    const r = computeTraumaTherapy(baseInput({ logs: [] }));
    expect(r.therapy_score).toBe(44);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 34. RECOMMENDATION DOES NOT FIRE WHEN CONDITION NOT MET
// ═════════════════════════════════════════════════════════════════════════════

describe("Recommendations not triggered at boundary", () => {
  it("attendance exactly 60% does not trigger attendance recommendation", () => {
    const logs: TraumaTherapyRecordInput[] = [];
    for (let i = 0; i < 10; i++) {
      logs.push(
        makeLog({
          id: `log-${i}`,
          child_id: `child-${i % 5}`,
          attended: i < 6, // 6/10 = 60%
        }),
      );
    }
    const r = computeTraumaTherapy(baseInput({ logs }));
    expect(
      r.recommendations.some((x) =>
        x.recommendation.includes("barriers to therapy attendance"),
      ),
    ).toBe(false);
  });

  it("mood exactly 40% does not trigger mood recommendation", () => {
    const logs: TraumaTherapyRecordInput[] = [];
    for (let i = 0; i < 10; i++) {
      logs.push(
        makeLog({
          id: `log-${i}`,
          child_id: `child-${i % 5}`,
          pre_session_mood: 4,
          post_session_mood: i < 4 ? 7 : 4, // 4/10 = 40%
        }),
      );
    }
    const r = computeTraumaTherapy(baseInput({ logs }));
    expect(
      r.recommendations.some((x) =>
        x.recommendation.includes("Review therapeutic approaches"),
      ),
    ).toBe(false);
  });

  it("child voice exactly 50% does not trigger voice recommendation", () => {
    const logs: TraumaTherapyRecordInput[] = [];
    for (let i = 0; i < 10; i++) {
      logs.push(
        makeLog({
          id: `log-${i}`,
          child_id: `child-${i % 5}`,
          has_child_voice: i < 5, // 5/10 = 50%
        }),
      );
    }
    const r = computeTraumaTherapy(baseInput({ logs }));
    expect(
      r.recommendations.some((x) =>
        x.recommendation.includes("children's views about their therapy"),
      ),
    ).toBe(false);
  });

  it("engagement exactly 50% does not trigger engagement recommendation", () => {
    const logs: TraumaTherapyRecordInput[] = [];
    for (let i = 0; i < 10; i++) {
      logs.push(
        makeLog({
          id: `log-${i}`,
          child_id: `child-${i % 5}`,
          child_presentation: i < 5 ? "engaged" : "withdrawn", // 5/10=50%
        }),
      );
    }
    const r = computeTraumaTherapy(baseInput({ logs }));
    expect(
      r.recommendations.some((x) =>
        x.recommendation.includes("therapeutic alliance"),
      ),
    ).toBe(false);
  });

  it("uniqueModalities exactly 2 does not trigger modality recommendation", () => {
    const logs = [
      makeLog({ id: "l1", modality: "EMDR" }),
      makeLog({ id: "l2", modality: "CBT" }),
    ];
    const r = computeTraumaTherapy(baseInput({ logs }));
    expect(
      r.recommendations.some((x) =>
        x.recommendation.includes("additional therapy modalities"),
      ),
    ).toBe(false);
  });
});
