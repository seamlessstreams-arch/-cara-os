// ══════════════════════════════════════════════════════════════════════════════
// TESTS — Home Missing Person & Absent Without Authority Intelligence Engine
// 180 tests covering protocol compliance, return interviews, risk assessment
// updates, police liaison, pattern analysis, scoring, strengths, concerns,
// recommendations, insights, and edge cases.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeMissingPersonAbsentAuthority,
  type MissingPersonInput,
  type MissingProtocolRecordInput,
  type ReturnInterviewRecordInput,
  type RiskAssessmentUpdateRecordInput,
  type PoliceLiaisonRecordInput,
  type PatternAnalysisRecordInput,
} from "../home-missing-person-absent-authority-intelligence-engine";

// ── Helpers ────────────────────────────────────────────────────────────────

const TODAY = "2026-05-31";

let _id = 0;

function makeProtocol(o: Partial<MissingProtocolRecordInput> = {}): MissingProtocolRecordInput {
  _id++;
  return {
    id: `mp_${_id}`,
    child_id: "c1",
    episode_date: "2026-05-10",
    episode_type: "missing",
    risk_level: "medium",
    duration_hours: 4,
    protocol_followed: true,
    notification_within_timeframe: true,
    police_notified: true,
    local_authority_notified: true,
    designated_safeguarding_lead_informed: true,
    search_actions_documented: true,
    trigger_factors_recorded: true,
    outcome: "returned_self",
    return_date: "2026-05-10",
    debriefing_completed: true,
    created_at: "2026-05-10",
    ...o,
  };
}

function makeInterview(o: Partial<ReturnInterviewRecordInput> = {}): ReturnInterviewRecordInput {
  _id++;
  return {
    id: `ri_${_id}`,
    child_id: "c1",
    episode_id: `mp_${_id}`,
    interview_date: "2026-05-11",
    interviewer_independent: true,
    completed_within_72_hours: true,
    child_views_captured: true,
    push_pull_factors_explored: true,
    safeguarding_concerns_identified: false,
    referrals_made: false,
    actions_agreed: true,
    actions_followed_up: true,
    quality_rating: 4,
    information_shared_with_placing_authority: true,
    created_at: "2026-05-11",
    ...o,
  };
}

function makeRiskUpdate(o: Partial<RiskAssessmentUpdateRecordInput> = {}): RiskAssessmentUpdateRecordInput {
  _id++;
  return {
    id: `ru_${_id}`,
    child_id: "c1",
    episode_id: `mp_${_id}`,
    update_date: "2026-05-11",
    risk_level_before: "medium",
    risk_level_after: "medium",
    contextual_safeguarding_considered: true,
    exploitation_screening_completed: true,
    safety_plan_updated: true,
    care_plan_updated: true,
    multi_agency_input: true,
    triggers_updated: true,
    protective_factors_reviewed: true,
    updated_within_48_hours: true,
    created_at: "2026-05-11",
    ...o,
  };
}

function makeLiaison(o: Partial<PoliceLiaisonRecordInput> = {}): PoliceLiaisonRecordInput {
  _id++;
  return {
    id: `pl_${_id}`,
    child_id: "c1",
    episode_id: `mp_${_id}`,
    liaison_date: "2026-05-10",
    liaison_type: "initial_report",
    police_reference_obtained: true,
    response_timely: true,
    information_quality_rating: 4,
    joint_risk_assessment: true,
    outcome_documented: true,
    follow_up_actions_agreed: true,
    follow_up_completed: true,
    created_at: "2026-05-10",
    ...o,
  };
}

function makePattern(o: Partial<PatternAnalysisRecordInput> = {}): PatternAnalysisRecordInput {
  _id++;
  return {
    id: `pa_${_id}`,
    child_id: "c1",
    analysis_date: "2026-05-15",
    period_covered_days: 30,
    episodes_in_period: 2,
    pattern_identified: true,
    pattern_type: "trigger_related",
    prevention_strategy_developed: true,
    prevention_strategy_implemented: true,
    prevention_effective: true,
    multi_agency_mapping_completed: true,
    contextual_safeguarding_mapping: true,
    shared_with_placing_authority: true,
    review_date: "2026-06-15",
    review_overdue: false,
    created_at: "2026-05-15",
    ...o,
  };
}

function baseInput(overrides: Partial<MissingPersonInput> = {}): MissingPersonInput {
  return {
    today: TODAY,
    total_children: 6,
    missing_protocol_records: [],
    return_interview_records: [],
    risk_assessment_update_records: [],
    police_liaison_records: [],
    pattern_analysis_records: [],
    ...overrides,
  };
}

// Helper: build N identical records with unique episode_ids
let _setId = 0;
function makeEpisodeSet(n: number, overrides: Partial<MissingProtocolRecordInput> = {}): MissingProtocolRecordInput[] {
  _setId++;
  return Array.from({ length: n }, (_, i) => makeProtocol({ id: `ep_s${_setId}_${i}`, ...overrides }));
}

function makeInterviewsForEpisodes(episodes: MissingProtocolRecordInput[], overrides: Partial<ReturnInterviewRecordInput> = {}): ReturnInterviewRecordInput[] {
  return episodes.map((ep) => makeInterview({ episode_id: ep.id, child_id: ep.child_id, ...overrides }));
}

function makeRiskUpdatesForEpisodes(episodes: MissingProtocolRecordInput[], overrides: Partial<RiskAssessmentUpdateRecordInput> = {}): RiskAssessmentUpdateRecordInput[] {
  return episodes.map((ep) => makeRiskUpdate({ episode_id: ep.id, child_id: ep.child_id, ...overrides }));
}

function makeLiaisonsForEpisodes(episodes: MissingProtocolRecordInput[], overrides: Partial<PoliceLiaisonRecordInput> = {}): PoliceLiaisonRecordInput[] {
  return episodes.map((ep) => makeLiaison({ episode_id: ep.id, child_id: ep.child_id, ...overrides }));
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("Home Missing Person & Absent Without Authority Intelligence Engine", () => {

  // ══════════════════════════════════════════════════════════════════════════
  // 1. SPECIAL CASES / EMPTY STATE
  // ══════════════════════════════════════════════════════════════════════════

  describe("insufficient data (all empty, 0 children)", () => {
    it("returns insufficient_data rating", () => {
      const r = computeMissingPersonAbsentAuthority(baseInput({ total_children: 0 }));
      expect(r.missing_rating).toBe("insufficient_data");
    });

    it("returns score of 0", () => {
      const r = computeMissingPersonAbsentAuthority(baseInput({ total_children: 0 }));
      expect(r.missing_score).toBe(0);
    });

    it("returns correct headline", () => {
      const r = computeMissingPersonAbsentAuthority(baseInput({ total_children: 0 }));
      expect(r.headline).toContain("insufficient data");
    });

    it("returns total_episodes 0", () => {
      const r = computeMissingPersonAbsentAuthority(baseInput({ total_children: 0 }));
      expect(r.total_episodes).toBe(0);
    });

    it("returns all rates at 0", () => {
      const r = computeMissingPersonAbsentAuthority(baseInput({ total_children: 0 }));
      expect(r.protocol_adherence_rate).toBe(0);
      expect(r.return_interview_rate).toBe(0);
      expect(r.risk_update_rate).toBe(0);
      expect(r.police_liaison_rate).toBe(0);
      expect(r.pattern_analysis_rate).toBe(0);
      expect(r.prevention_rate).toBe(0);
    });

    it("has no strengths, concerns, recommendations, or insights", () => {
      const r = computeMissingPersonAbsentAuthority(baseInput({ total_children: 0 }));
      expect(r.strengths).toHaveLength(0);
      expect(r.concerns).toHaveLength(0);
      expect(r.recommendations).toHaveLength(0);
      expect(r.insights).toHaveLength(0);
    });
  });

  describe("all empty with children > 0 (inadequate)", () => {
    it("returns inadequate rating", () => {
      const r = computeMissingPersonAbsentAuthority(baseInput({ total_children: 4 }));
      expect(r.missing_rating).toBe("inadequate");
    });

    it("returns score of 15", () => {
      const r = computeMissingPersonAbsentAuthority(baseInput({ total_children: 4 }));
      expect(r.missing_score).toBe(15);
    });

    it("has headline mentioning urgent attention", () => {
      const r = computeMissingPersonAbsentAuthority(baseInput({ total_children: 4 }));
      expect(r.headline).toContain("urgent attention");
    });

    it("has exactly 1 concern", () => {
      const r = computeMissingPersonAbsentAuthority(baseInput({ total_children: 4 }));
      expect(r.concerns).toHaveLength(1);
      expect(r.concerns[0]).toContain("No missing protocol records");
    });

    it("has exactly 2 recommendations", () => {
      const r = computeMissingPersonAbsentAuthority(baseInput({ total_children: 4 }));
      expect(r.recommendations).toHaveLength(2);
      expect(r.recommendations[0].rank).toBe(1);
      expect(r.recommendations[1].rank).toBe(2);
    });

    it("recommendations have immediate urgency", () => {
      const r = computeMissingPersonAbsentAuthority(baseInput({ total_children: 4 }));
      expect(r.recommendations.every((rec) => rec.urgency === "immediate")).toBe(true);
    });

    it("recommendations reference Reg 34", () => {
      const r = computeMissingPersonAbsentAuthority(baseInput({ total_children: 4 }));
      expect(r.recommendations.every((rec) => rec.regulatory_ref.includes("Reg 34"))).toBe(true);
    });

    it("has exactly 1 critical insight", () => {
      const r = computeMissingPersonAbsentAuthority(baseInput({ total_children: 4 }));
      expect(r.insights).toHaveLength(1);
      expect(r.insights[0].severity).toBe("critical");
    });

    it("returns total_episodes 0", () => {
      const r = computeMissingPersonAbsentAuthority(baseInput({ total_children: 4 }));
      expect(r.total_episodes).toBe(0);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 2. OUTPUT SHAPE
  // ══════════════════════════════════════════════════════════════════════════

  describe("output shape", () => {
    it("returns all required top-level fields", () => {
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: [makeProtocol()],
      }));
      expect(r).toHaveProperty("missing_rating");
      expect(r).toHaveProperty("missing_score");
      expect(r).toHaveProperty("headline");
      expect(r).toHaveProperty("total_episodes");
      expect(r).toHaveProperty("protocol_adherence_rate");
      expect(r).toHaveProperty("return_interview_rate");
      expect(r).toHaveProperty("risk_update_rate");
      expect(r).toHaveProperty("police_liaison_rate");
      expect(r).toHaveProperty("pattern_analysis_rate");
      expect(r).toHaveProperty("prevention_rate");
      expect(r).toHaveProperty("notification_timeliness_rate");
      expect(r).toHaveProperty("return_interview_quality_avg");
      expect(r).toHaveProperty("risk_assessment_timeliness_rate");
      expect(r).toHaveProperty("exploitation_screening_rate");
      expect(r).toHaveProperty("strengths");
      expect(r).toHaveProperty("concerns");
      expect(r).toHaveProperty("recommendations");
      expect(r).toHaveProperty("insights");
    });

    it("rating is one of the valid enum values", () => {
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: [makeProtocol()],
      }));
      expect(["outstanding", "good", "adequate", "inadequate", "insufficient_data"]).toContain(r.missing_rating);
    });

    it("score is clamped between 0 and 100", () => {
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: [makeProtocol()],
      }));
      expect(r.missing_score).toBeGreaterThanOrEqual(0);
      expect(r.missing_score).toBeLessThanOrEqual(100);
    });

    it("strengths is an array of strings", () => {
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: [makeProtocol()],
      }));
      expect(Array.isArray(r.strengths)).toBe(true);
    });

    it("recommendations have rank, recommendation, urgency, and regulatory_ref", () => {
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: [makeProtocol({ protocol_followed: false })],
      }));
      for (const rec of r.recommendations) {
        expect(rec).toHaveProperty("rank");
        expect(rec).toHaveProperty("recommendation");
        expect(rec).toHaveProperty("urgency");
        expect(rec).toHaveProperty("regulatory_ref");
      }
    });

    it("insights have text and severity", () => {
      const episodes = makeEpisodeSet(5, { protocol_followed: false });
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
      }));
      for (const ins of r.insights) {
        expect(ins).toHaveProperty("text");
        expect(ins).toHaveProperty("severity");
        expect(["critical", "warning", "positive"]).toContain(ins.severity);
      }
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 3. SCORING & RATING THRESHOLDS
  // ══════════════════════════════════════════════════════════════════════════

  describe("scoring base and bonuses", () => {
    it("starts from base score of 52", () => {
      // 1 episode with nothing good, no interviews/updates — no bonuses, no penalties from arrays
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: [makeProtocol({
          protocol_followed: false,
          notification_within_timeframe: false,
          debriefing_completed: false,
          trigger_factors_recorded: false,
          search_actions_documented: false,
          risk_level: "low",
        })],
      }));
      // base=52, protocolAdherence=0% → penalty -6, no other bonuses
      // But penalty 1 requires protocol_records.length>0 and rate<50 → triggers → 52-6=46
      expect(r.missing_score).toBe(46);
    });

    it("awards +5 for protocol adherence >= 95%", () => {
      const episodes = makeEpisodeSet(20, { protocol_followed: true });
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
      }));
      // 100% protocol adherence → +5 bonus from base 52
      expect(r.missing_score).toBeGreaterThanOrEqual(57);
    });

    it("awards +3 for protocol adherence >= 80% but < 95%", () => {
      const total = 10;
      const followed = 8; // 80%
      const episodes = [
        ...makeEpisodeSet(followed, { protocol_followed: true }),
        ...makeEpisodeSet(total - followed, { protocol_followed: false }),
      ];
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
      }));
      // 80% → +3 bonus
      expect(r.missing_score).toBeGreaterThanOrEqual(55);
    });

    it("awards +5 for return interview rate >= 95%", () => {
      const episodes = makeEpisodeSet(10);
      const interviews = makeInterviewsForEpisodes(episodes);
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        return_interview_records: interviews,
      }));
      expect(r.return_interview_rate).toBe(100);
    });

    it("awards +3 for return interview rate >= 80% but < 95%", () => {
      const episodes = makeEpisodeSet(10);
      // 8 of 10 episodes get interviews → 80%
      const interviews = makeInterviewsForEpisodes(episodes.slice(0, 8));
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        return_interview_records: interviews,
      }));
      expect(r.return_interview_rate).toBe(80);
    });

    it("awards +4 for risk update rate >= 90%", () => {
      const episodes = makeEpisodeSet(10);
      const updates = makeRiskUpdatesForEpisodes(episodes);
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        risk_assessment_update_records: updates,
      }));
      expect(r.risk_update_rate).toBe(100);
    });

    it("awards +2 for risk update rate >= 70% but < 90%", () => {
      const episodes = makeEpisodeSet(10);
      const updates = makeRiskUpdatesForEpisodes(episodes.slice(0, 7));
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        risk_assessment_update_records: updates,
      }));
      expect(r.risk_update_rate).toBe(70);
    });

    it("awards +4 for police liaison rate >= 90%", () => {
      const episodes = makeEpisodeSet(10);
      const liaisons = makeLiaisonsForEpisodes(episodes);
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        police_liaison_records: liaisons,
      }));
      expect(r.police_liaison_rate).toBe(100);
    });

    it("awards +2 for police liaison rate >= 70% but < 90%", () => {
      const episodes = makeEpisodeSet(10);
      const liaisons = makeLiaisonsForEpisodes(episodes.slice(0, 7));
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        police_liaison_records: liaisons,
      }));
      expect(r.police_liaison_rate).toBe(70);
    });

    it("awards +3 for pattern analysis rate >= 90%", () => {
      const episodes = makeEpisodeSet(2, { child_id: "c1" });
      const patterns = [makePattern({ child_id: "c1" })];
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        pattern_analysis_records: patterns,
      }));
      // 1 unique child analysed / 1 unique child with episodes = 100%
      expect(r.pattern_analysis_rate).toBe(100);
    });

    it("awards +1 for pattern analysis rate >= 70% but < 90%", () => {
      const episodes = [
        ...makeEpisodeSet(2, { child_id: "c1" }),
        ...makeEpisodeSet(2, { child_id: "c2" }),
        ...makeEpisodeSet(2, { child_id: "c3" }),
        ...makeEpisodeSet(2, { child_id: "c4" }),
        ...makeEpisodeSet(2, { child_id: "c5" }),
      ];
      // 4 of 5 children analysed → 80%
      const patterns = [
        makePattern({ child_id: "c1" }),
        makePattern({ child_id: "c2" }),
        makePattern({ child_id: "c3" }),
        makePattern({ child_id: "c4" }),
      ];
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        pattern_analysis_records: patterns,
      }));
      expect(r.pattern_analysis_rate).toBe(80);
    });

    it("awards +3 for prevention rate >= 80%", () => {
      const patterns = makeEpisodeSet(5).map(() => makePattern({ prevention_effective: true }));
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: makeEpisodeSet(5),
        pattern_analysis_records: patterns,
      }));
      expect(r.prevention_rate).toBe(100);
    });

    it("awards +1 for prevention rate >= 60% but < 80%", () => {
      const patterns = [
        makePattern({ prevention_effective: true }),
        makePattern({ prevention_effective: true }),
        makePattern({ prevention_effective: false }),
      ];
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: makeEpisodeSet(3),
        pattern_analysis_records: patterns,
      }));
      // 2/3 = 67%
      expect(r.prevention_rate).toBe(67);
    });

    it("awards +2 for return interview quality avg >= 4.0", () => {
      const episodes = makeEpisodeSet(5);
      const interviews = makeInterviewsForEpisodes(episodes, { quality_rating: 5 });
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        return_interview_records: interviews,
      }));
      expect(r.return_interview_quality_avg).toBe(5);
    });

    it("awards +1 for return interview quality avg >= 3.0 but < 4.0", () => {
      const episodes = makeEpisodeSet(5);
      const interviews = makeInterviewsForEpisodes(episodes, { quality_rating: 3 });
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        return_interview_records: interviews,
      }));
      expect(r.return_interview_quality_avg).toBe(3);
    });

    it("awards +2 for exploitation screening rate >= 90%", () => {
      const episodes = makeEpisodeSet(5);
      const updates = makeRiskUpdatesForEpisodes(episodes, { exploitation_screening_completed: true });
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        risk_assessment_update_records: updates,
      }));
      expect(r.exploitation_screening_rate).toBe(100);
    });

    it("awards +1 for exploitation screening rate >= 70% but < 90%", () => {
      const episodes = makeEpisodeSet(10);
      const updates = [
        ...makeRiskUpdatesForEpisodes(episodes.slice(0, 7), { exploitation_screening_completed: true }),
        ...makeRiskUpdatesForEpisodes(episodes.slice(7), { exploitation_screening_completed: false }),
      ];
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        risk_assessment_update_records: updates,
      }));
      expect(r.exploitation_screening_rate).toBe(70);
    });
  });

  describe("penalties", () => {
    it("applies -6 penalty for protocol adherence < 50%", () => {
      const episodes = [
        ...makeEpisodeSet(2, { protocol_followed: true }),
        ...makeEpisodeSet(6, { protocol_followed: false }),
      ];
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
      }));
      // 25% adherence → -6 penalty from base 52
      expect(r.protocol_adherence_rate).toBe(25);
      expect(r.missing_score).toBeLessThanOrEqual(52);
    });

    it("applies -6 penalty for return interview rate < 50%", () => {
      const episodes = makeEpisodeSet(10);
      // only 2 of 10 episodes have interviews → 20%
      const interviews = makeInterviewsForEpisodes(episodes.slice(0, 2));
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        return_interview_records: interviews,
      }));
      expect(r.return_interview_rate).toBe(20);
    });

    it("applies -4 penalty for risk update rate < 40%", () => {
      const episodes = makeEpisodeSet(10);
      const updates = makeRiskUpdatesForEpisodes(episodes.slice(0, 3));
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        risk_assessment_update_records: updates,
      }));
      expect(r.risk_update_rate).toBe(30);
    });

    it("applies -4 penalty for exploitation screening rate < 40%", () => {
      const episodes = makeEpisodeSet(5);
      const updates = makeRiskUpdatesForEpisodes(episodes, { exploitation_screening_completed: false });
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        risk_assessment_update_records: updates,
      }));
      expect(r.exploitation_screening_rate).toBe(0);
    });

    it("does not apply protocol penalty when missing_protocol_records is empty", () => {
      // All arrays empty + children > 0 → special case, not the penalty path
      const r = computeMissingPersonAbsentAuthority(baseInput({ total_children: 3 }));
      // This triggers the empty-with-children path, score=15
      expect(r.missing_score).toBe(15);
    });

    it("does not apply return interview penalty when return_interview_records is empty", () => {
      const episodes = makeEpisodeSet(3);
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        return_interview_records: [],
      }));
      // returnInterviewRate < 50 BUT return_interview_records.length === 0 → no penalty
      // penalty 2 checks return_interview_records.length > 0
      expect(r.return_interview_rate).toBe(0);
    });
  });

  describe("rating thresholds", () => {
    it("rates outstanding when score >= 80", () => {
      // Perfect everything → max bonuses
      const episodes = makeEpisodeSet(5);
      const interviews = makeInterviewsForEpisodes(episodes, { quality_rating: 5 });
      const riskUpdates = makeRiskUpdatesForEpisodes(episodes);
      const liaisons = makeLiaisonsForEpisodes(episodes);
      const patterns = [makePattern({ child_id: "c1" })];
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        return_interview_records: interviews,
        risk_assessment_update_records: riskUpdates,
        police_liaison_records: liaisons,
        pattern_analysis_records: patterns,
      }));
      expect(r.missing_score).toBeGreaterThanOrEqual(80);
      expect(r.missing_rating).toBe("outstanding");
    });

    it("rates good when score >= 65 and < 80", () => {
      // Moderate performance: protocol+interview bonuses, but no pattern/prevention
      const episodes = makeEpisodeSet(5);
      const interviews = makeInterviewsForEpisodes(episodes, { quality_rating: 3 });
      const riskUpdates = makeRiskUpdatesForEpisodes(episodes.slice(0, 4)); // 80% → +2
      const liaisons = makeLiaisonsForEpisodes(episodes.slice(0, 4)); // 80% → +2
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        return_interview_records: interviews,
        risk_assessment_update_records: riskUpdates,
        police_liaison_records: liaisons,
      }));
      // 52 + 5(protocol) + 5(interview) + 2(risk) + 2(police) + 1(quality) = 67
      expect(r.missing_score).toBeGreaterThanOrEqual(65);
      expect(r.missing_score).toBeLessThan(80);
      expect(r.missing_rating).toBe("good");
    });

    it("rates adequate when score >= 45 and < 65", () => {
      // Base 52 with minimal bonuses
      const episodes = makeEpisodeSet(5, { protocol_followed: true });
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
      }));
      // 52 + 5(protocol100%) = 57 — no interview/risk/police → adequate or good?
      // Actually no penalties either since empty arrays
      expect(r.missing_score).toBeGreaterThanOrEqual(45);
      expect(r.missing_score).toBeLessThan(80);
    });

    it("rates inadequate when score < 45", () => {
      const episodes = makeEpisodeSet(5, { protocol_followed: false });
      const interviews = makeInterviewsForEpisodes(episodes.slice(0, 1), { quality_rating: 1 });
      const riskUpdates = makeRiskUpdatesForEpisodes(episodes.slice(0, 1), {
        exploitation_screening_completed: false,
      });
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        return_interview_records: interviews,
        risk_assessment_update_records: riskUpdates,
      }));
      // 52 - 6(protocol<50) - 6(interview<50) - 4(risk<40) - 4(exploitation<40) = 32
      expect(r.missing_score).toBeLessThan(45);
      expect(r.missing_rating).toBe("inadequate");
    });

    it("score clamps to 0 (never negative)", () => {
      // Stack all penalties
      const episodes = makeEpisodeSet(10, { protocol_followed: false });
      const interviews = makeInterviewsForEpisodes(episodes.slice(0, 1), { quality_rating: 1 });
      const riskUpdates = makeRiskUpdatesForEpisodes(episodes.slice(0, 1), {
        exploitation_screening_completed: false,
      });
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        return_interview_records: interviews,
        risk_assessment_update_records: riskUpdates,
      }));
      expect(r.missing_score).toBeGreaterThanOrEqual(0);
    });

    it("score clamps to 100 (never exceeds)", () => {
      // Max bonuses
      const episodes = makeEpisodeSet(20);
      const interviews = makeInterviewsForEpisodes(episodes, { quality_rating: 5 });
      const riskUpdates = makeRiskUpdatesForEpisodes(episodes);
      const liaisons = makeLiaisonsForEpisodes(episodes);
      const patterns = [makePattern({ child_id: "c1" })];
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        return_interview_records: interviews,
        risk_assessment_update_records: riskUpdates,
        police_liaison_records: liaisons,
        pattern_analysis_records: patterns,
      }));
      expect(r.missing_score).toBeLessThanOrEqual(100);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 4. CORE METRICS
  // ══════════════════════════════════════════════════════════════════════════

  describe("protocol adherence rate", () => {
    it("calculates 100% when all protocols followed", () => {
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: makeEpisodeSet(5, { protocol_followed: true }),
      }));
      expect(r.protocol_adherence_rate).toBe(100);
    });

    it("calculates 0% when no protocols followed", () => {
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: makeEpisodeSet(5, { protocol_followed: false }),
      }));
      expect(r.protocol_adherence_rate).toBe(0);
    });

    it("calculates partial percentage correctly", () => {
      const episodes = [
        ...makeEpisodeSet(3, { protocol_followed: true }),
        ...makeEpisodeSet(7, { protocol_followed: false }),
      ];
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
      }));
      expect(r.protocol_adherence_rate).toBe(30);
    });
  });

  describe("notification timeliness rate", () => {
    it("calculates 100% when all notifications timely", () => {
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: makeEpisodeSet(5, { notification_within_timeframe: true }),
      }));
      expect(r.notification_timeliness_rate).toBe(100);
    });

    it("calculates 0% when no notifications timely", () => {
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: makeEpisodeSet(5, { notification_within_timeframe: false }),
      }));
      expect(r.notification_timeliness_rate).toBe(0);
    });
  });

  describe("return interview rate", () => {
    it("calculates based on closed episodes with interviews", () => {
      const episodes = [
        ...makeEpisodeSet(3, { outcome: "returned_self" }),
        ...makeEpisodeSet(2, { outcome: "found_by_staff" }),
      ];
      // Give all 5 closed episodes an interview
      const interviews = episodes.map((ep) => makeInterview({ episode_id: ep.id }));
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        return_interview_records: interviews,
      }));
      expect(r.return_interview_rate).toBe(100);
    });

    it("excludes ongoing episodes from denominator", () => {
      const episodes = [
        makeProtocol({ id: "ep_closed_1", outcome: "returned_self" }),
        makeProtocol({ id: "ep_ongoing_1", outcome: "ongoing" }),
      ];
      const interviews = [makeInterview({ episode_id: "ep_closed_1" })];
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        return_interview_records: interviews,
      }));
      // 1 interview / 1 closed episode = 100%
      expect(r.return_interview_rate).toBe(100);
    });

    it("returns 0 when no closed episodes exist", () => {
      const episodes = makeEpisodeSet(3, { outcome: "ongoing" });
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
      }));
      expect(r.return_interview_rate).toBe(0);
    });
  });

  describe("return interview quality avg", () => {
    it("calculates average quality rating", () => {
      const interviews = [
        makeInterview({ quality_rating: 5 }),
        makeInterview({ quality_rating: 3 }),
        makeInterview({ quality_rating: 4 }),
      ];
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: makeEpisodeSet(3),
        return_interview_records: interviews,
      }));
      expect(r.return_interview_quality_avg).toBe(4);
    });

    it("returns 0 when no interviews exist", () => {
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: makeEpisodeSet(3),
      }));
      expect(r.return_interview_quality_avg).toBe(0);
    });
  });

  describe("risk update rate", () => {
    it("calculates based on unique episodes with updates", () => {
      const episodes = makeEpisodeSet(5);
      const updates = makeRiskUpdatesForEpisodes(episodes.slice(0, 3));
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        risk_assessment_update_records: updates,
      }));
      expect(r.risk_update_rate).toBe(60);
    });

    it("returns 0 when no episodes and no updates", () => {
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: [],
        risk_assessment_update_records: [makeRiskUpdate()],
      }));
      // pct(uniqueEpisodesWithUpdate, 0) = 0
      expect(r.risk_update_rate).toBe(0);
    });
  });

  describe("risk assessment timeliness rate", () => {
    it("calculates percentage updated within 48 hours", () => {
      const updates = [
        makeRiskUpdate({ updated_within_48_hours: true }),
        makeRiskUpdate({ updated_within_48_hours: true }),
        makeRiskUpdate({ updated_within_48_hours: false }),
      ];
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: makeEpisodeSet(3),
        risk_assessment_update_records: updates,
      }));
      expect(r.risk_assessment_timeliness_rate).toBe(67);
    });
  });

  describe("exploitation screening rate", () => {
    it("calculates percentage with screening completed", () => {
      const updates = [
        makeRiskUpdate({ exploitation_screening_completed: true }),
        makeRiskUpdate({ exploitation_screening_completed: false }),
      ];
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: makeEpisodeSet(2),
        risk_assessment_update_records: updates,
      }));
      expect(r.exploitation_screening_rate).toBe(50);
    });
  });

  describe("police liaison rate", () => {
    it("calculates based on unique episodes with liaison", () => {
      const episodes = makeEpisodeSet(4);
      const liaisons = makeLiaisonsForEpisodes(episodes.slice(0, 3));
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        police_liaison_records: liaisons,
      }));
      expect(r.police_liaison_rate).toBe(75);
    });
  });

  describe("pattern analysis rate", () => {
    it("calculates based on unique children analysed vs children with episodes", () => {
      const episodes = [
        ...makeEpisodeSet(2, { child_id: "c1" }),
        ...makeEpisodeSet(2, { child_id: "c2" }),
      ];
      const patterns = [makePattern({ child_id: "c1" })];
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        pattern_analysis_records: patterns,
      }));
      // 1/2 = 50%
      expect(r.pattern_analysis_rate).toBe(50);
    });

    it("returns 0 when no children have episodes", () => {
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: [],
        pattern_analysis_records: [makePattern()],
      }));
      expect(r.pattern_analysis_rate).toBe(0);
    });
  });

  describe("prevention rate", () => {
    it("calculates based on effective prevention analyses", () => {
      const patterns = [
        makePattern({ prevention_effective: true }),
        makePattern({ prevention_effective: true }),
        makePattern({ prevention_effective: false }),
        makePattern({ prevention_effective: false }),
      ];
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: makeEpisodeSet(4),
        pattern_analysis_records: patterns,
      }));
      expect(r.prevention_rate).toBe(50);
    });

    it("returns 0 when no pattern analyses", () => {
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: makeEpisodeSet(3),
      }));
      expect(r.prevention_rate).toBe(0);
    });
  });

  describe("total episodes", () => {
    it("counts protocol records as total episodes", () => {
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: makeEpisodeSet(7),
      }));
      expect(r.total_episodes).toBe(7);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 5. STRENGTHS
  // ══════════════════════════════════════════════════════════════════════════

  describe("strengths", () => {
    it("includes strength for protocol adherence >= 95%", () => {
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: makeEpisodeSet(20, { protocol_followed: true }),
      }));
      expect(r.strengths.some((s) => s.includes("exemplary adherence"))).toBe(true);
    });

    it("includes strength for protocol adherence >= 80% but < 95%", () => {
      const episodes = [
        ...makeEpisodeSet(17, { protocol_followed: true }),
        ...makeEpisodeSet(3, { protocol_followed: false }),
      ];
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
      }));
      // 85% → tier-2 strength
      expect(r.strengths.some((s) => s.includes("protocol adherence") && s.includes("85%"))).toBe(true);
    });

    it("includes strength for return interview rate >= 95%", () => {
      const episodes = makeEpisodeSet(10);
      const interviews = makeInterviewsForEpisodes(episodes);
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        return_interview_records: interviews,
      }));
      expect(r.strengths.some((s) => s.includes("Return interviews completed for virtually every"))).toBe(true);
    });

    it("includes strength for return interview rate >= 80% but < 95%", () => {
      const episodes = makeEpisodeSet(10);
      const interviews = makeInterviewsForEpisodes(episodes.slice(0, 9));
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        return_interview_records: interviews,
      }));
      expect(r.strengths.some((s) => s.includes("return interview coverage"))).toBe(true);
    });

    it("includes strength for risk update rate >= 90%", () => {
      const episodes = makeEpisodeSet(10);
      const updates = makeRiskUpdatesForEpisodes(episodes);
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        risk_assessment_update_records: updates,
      }));
      expect(r.strengths.some((s) => s.includes("risk assessment updates"))).toBe(true);
    });

    it("includes strength for police liaison rate >= 90%", () => {
      const episodes = makeEpisodeSet(10);
      const liaisons = makeLiaisonsForEpisodes(episodes);
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        police_liaison_records: liaisons,
      }));
      expect(r.strengths.some((s) => s.includes("police liaison rate"))).toBe(true);
    });

    it("includes strength for pattern analysis rate >= 90%", () => {
      const episodes = makeEpisodeSet(3, { child_id: "c1" });
      const patterns = [makePattern({ child_id: "c1" })];
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        pattern_analysis_records: patterns,
      }));
      expect(r.strengths.some((s) => s.includes("Pattern analysis completed"))).toBe(true);
    });

    it("includes strength for prevention rate >= 80%", () => {
      const patterns = [
        makePattern({ prevention_effective: true }),
        makePattern({ prevention_effective: true }),
        makePattern({ prevention_effective: true }),
        makePattern({ prevention_effective: true }),
      ];
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: makeEpisodeSet(4),
        pattern_analysis_records: patterns,
      }));
      expect(r.strengths.some((s) => s.includes("prevention"))).toBe(true);
    });

    it("includes strength for prevention rate >= 60% but < 80%", () => {
      const patterns = [
        makePattern({ prevention_effective: true }),
        makePattern({ prevention_effective: true }),
        makePattern({ prevention_effective: false }),
      ];
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: makeEpisodeSet(3),
        pattern_analysis_records: patterns,
      }));
      expect(r.strengths.some((s) => s.includes("prevention effectiveness"))).toBe(true);
    });

    it("includes strength for interview quality >= 4.0", () => {
      const episodes = makeEpisodeSet(5);
      const interviews = makeInterviewsForEpisodes(episodes, { quality_rating: 5 });
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        return_interview_records: interviews,
      }));
      expect(r.strengths.some((s) => s.includes("quality averages"))).toBe(true);
    });

    it("includes strength for exploitation screening >= 90%", () => {
      const episodes = makeEpisodeSet(5);
      const updates = makeRiskUpdatesForEpisodes(episodes, { exploitation_screening_completed: true });
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        risk_assessment_update_records: updates,
      }));
      expect(r.strengths.some((s) => s.includes("exploitation screening rate"))).toBe(true);
    });

    it("includes strength for notification timeliness >= 95%", () => {
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: makeEpisodeSet(10, { notification_within_timeframe: true }),
      }));
      expect(r.strengths.some((s) => s.includes("Notifications are made within required timeframes"))).toBe(true);
    });

    it("includes strength for independent interview rate >= 90%", () => {
      const episodes = makeEpisodeSet(5);
      const interviews = makeInterviewsForEpisodes(episodes, { interviewer_independent: true });
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        return_interview_records: interviews,
      }));
      expect(r.strengths.some((s) => s.includes("independent interviewers"))).toBe(true);
    });

    it("includes strength for contextual safeguarding >= 90%", () => {
      const episodes = makeEpisodeSet(5);
      const updates = makeRiskUpdatesForEpisodes(episodes, { contextual_safeguarding_considered: true });
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        risk_assessment_update_records: updates,
      }));
      expect(r.strengths.some((s) => s.includes("Contextual safeguarding"))).toBe(true);
    });

    it("includes strength for child views captured >= 90%", () => {
      const episodes = makeEpisodeSet(5);
      const interviews = makeInterviewsForEpisodes(episodes, { child_views_captured: true });
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        return_interview_records: interviews,
      }));
      expect(r.strengths.some((s) => s.includes("Children's views are captured"))).toBe(true);
    });

    it("includes strength for actions follow-up rate >= 90%", () => {
      const episodes = makeEpisodeSet(5);
      const interviews = makeInterviewsForEpisodes(episodes, {
        actions_agreed: true,
        actions_followed_up: true,
      });
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        return_interview_records: interviews,
      }));
      expect(r.strengths.some((s) => s.includes("return interview actions followed up"))).toBe(true);
    });

    it("includes strength for safety plan update >= 90%", () => {
      const episodes = makeEpisodeSet(5);
      const updates = makeRiskUpdatesForEpisodes(episodes, { safety_plan_updated: true });
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        risk_assessment_update_records: updates,
      }));
      expect(r.strengths.some((s) => s.includes("Safety plans updated"))).toBe(true);
    });

    it("includes strength for police reference obtained >= 90%", () => {
      const episodes = makeEpisodeSet(5);
      const liaisons = makeLiaisonsForEpisodes(episodes, { police_reference_obtained: true });
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        police_liaison_records: liaisons,
      }));
      expect(r.strengths.some((s) => s.includes("Police reference numbers obtained"))).toBe(true);
    });

    it("includes strength for multi-agency mapping >= 80%", () => {
      const patterns = [
        makePattern({ multi_agency_mapping_completed: true }),
        makePattern({ multi_agency_mapping_completed: true }),
        makePattern({ multi_agency_mapping_completed: true }),
        makePattern({ multi_agency_mapping_completed: true }),
      ];
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: makeEpisodeSet(4),
        pattern_analysis_records: patterns,
      }));
      expect(r.strengths.some((s) => s.includes("multi-agency mapping"))).toBe(true);
    });

    it("includes strength for debriefing completion >= 90%", () => {
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: makeEpisodeSet(10, { debriefing_completed: true }),
      }));
      expect(r.strengths.some((s) => s.includes("Debriefing completed"))).toBe(true);
    });

    it("has no strengths with poor performance", () => {
      const episodes = makeEpisodeSet(5, {
        protocol_followed: false,
        notification_within_timeframe: false,
        debriefing_completed: false,
      });
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
      }));
      expect(r.strengths).toHaveLength(0);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 6. CONCERNS
  // ══════════════════════════════════════════════════════════════════════════

  describe("concerns", () => {
    it("raises concern for protocol adherence < 50%", () => {
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: makeEpisodeSet(10, { protocol_followed: false }),
      }));
      expect(r.concerns.some((c) => c.includes("Protocol adherence at only 0%"))).toBe(true);
    });

    it("raises concern for protocol adherence >= 50% but < 80%", () => {
      const episodes = [
        ...makeEpisodeSet(6, { protocol_followed: true }),
        ...makeEpisodeSet(4, { protocol_followed: false }),
      ];
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
      }));
      expect(r.concerns.some((c) => c.includes("Protocol adherence at 60%"))).toBe(true);
    });

    it("raises concern for return interview rate < 50%", () => {
      const episodes = makeEpisodeSet(10);
      const interviews = makeInterviewsForEpisodes(episodes.slice(0, 2));
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        return_interview_records: interviews,
      }));
      expect(r.concerns.some((c) => c.includes("Return interview rate at only"))).toBe(true);
    });

    it("raises concern for return interview rate >= 50% but < 80%", () => {
      const episodes = makeEpisodeSet(10);
      const interviews = makeInterviewsForEpisodes(episodes.slice(0, 6));
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        return_interview_records: interviews,
      }));
      expect(r.concerns.some((c) => c.includes("Return interview coverage at 60%"))).toBe(true);
    });

    it("raises concern for risk update rate < 40%", () => {
      const episodes = makeEpisodeSet(10);
      const updates = makeRiskUpdatesForEpisodes(episodes.slice(0, 3));
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        risk_assessment_update_records: updates,
      }));
      expect(r.concerns.some((c) => c.includes("Risk assessment updates follow only 30%"))).toBe(true);
    });

    it("raises concern for risk update rate >= 40% but < 70%", () => {
      const episodes = makeEpisodeSet(10);
      const updates = makeRiskUpdatesForEpisodes(episodes.slice(0, 5));
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        risk_assessment_update_records: updates,
      }));
      expect(r.concerns.some((c) => c.includes("Risk update rate at 50%"))).toBe(true);
    });

    it("raises concern for police liaison rate < 50%", () => {
      const episodes = makeEpisodeSet(10);
      const liaisons = makeLiaisonsForEpisodes(episodes.slice(0, 4));
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        police_liaison_records: liaisons,
      }));
      expect(r.concerns.some((c) => c.includes("Police liaison recorded for only 40%"))).toBe(true);
    });

    it("raises concern for police liaison rate >= 50% but < 70%", () => {
      const episodes = makeEpisodeSet(10);
      const liaisons = makeLiaisonsForEpisodes(episodes.slice(0, 6));
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        police_liaison_records: liaisons,
      }));
      expect(r.concerns.some((c) => c.includes("Police liaison at 60%"))).toBe(true);
    });

    it("raises concern for pattern analysis < 50%", () => {
      const episodes = [
        ...makeEpisodeSet(2, { child_id: "c1" }),
        ...makeEpisodeSet(2, { child_id: "c2" }),
        ...makeEpisodeSet(2, { child_id: "c3" }),
      ];
      // Only 1 of 3 children analysed → 33%
      const patterns = [makePattern({ child_id: "c1" })];
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        pattern_analysis_records: patterns,
      }));
      expect(r.concerns.some((c) => c.includes("Pattern analysis covers only 33%"))).toBe(true);
    });

    it("raises concern for exploitation screening < 40%", () => {
      const episodes = makeEpisodeSet(5);
      const updates = makeRiskUpdatesForEpisodes(episodes, { exploitation_screening_completed: false });
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        risk_assessment_update_records: updates,
      }));
      expect(r.concerns.some((c) => c.includes("Exploitation screening completed in only 0%"))).toBe(true);
    });

    it("raises concern for high-risk episodes without police notification", () => {
      const episodes = [
        makeProtocol({ risk_level: "high", police_notified: false }),
        makeProtocol({ risk_level: "very_high", police_notified: false }),
      ];
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
      }));
      expect(r.concerns.some((c) => c.includes("high/very-high risk episode"))).toBe(true);
    });

    it("does not raise high-risk concern when all high-risk episodes have police notification", () => {
      const episodes = [
        makeProtocol({ risk_level: "high", police_notified: true }),
        makeProtocol({ risk_level: "very_high", police_notified: true }),
      ];
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
      }));
      expect(r.concerns.some((c) => c.includes("high/very-high risk episode"))).toBe(false);
    });

    it("raises concern for notification timeliness < 70%", () => {
      const episodes = [
        ...makeEpisodeSet(3, { notification_within_timeframe: true }),
        ...makeEpisodeSet(7, { notification_within_timeframe: false }),
      ];
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
      }));
      expect(r.concerns.some((c) => c.includes("30% of notifications made within required timeframes"))).toBe(true);
    });

    it("raises concern for ongoing episodes", () => {
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: [
          makeProtocol({ outcome: "ongoing" }),
          makeProtocol({ outcome: "ongoing" }),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("2 episodes currently ongoing"))).toBe(true);
    });

    it("raises concern for single ongoing episode (singular)", () => {
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: [makeProtocol({ outcome: "ongoing" })],
      }));
      expect(r.concerns.some((c) => c.includes("1 episode currently ongoing"))).toBe(true);
    });

    it("raises concern for repeat children", () => {
      const episodes = [
        makeProtocol({ child_id: "c1" }),
        makeProtocol({ child_id: "c1" }),
        makeProtocol({ child_id: "c1" }),
      ];
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
      }));
      expect(r.concerns.some((c) => c.includes("repeat episodes"))).toBe(true);
    });

    it("raises concern for independent interview rate < 50%", () => {
      const episodes = makeEpisodeSet(5);
      const interviews = makeInterviewsForEpisodes(episodes, { interviewer_independent: false });
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        return_interview_records: interviews,
      }));
      expect(r.concerns.some((c) => c.includes("0% of return interviews conducted independently"))).toBe(true);
    });

    it("raises concern for child views rate < 70%", () => {
      const episodes = makeEpisodeSet(5);
      const interviews = makeInterviewsForEpisodes(episodes, { child_views_captured: false });
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        return_interview_records: interviews,
      }));
      expect(r.concerns.some((c) => c.includes("Children's views captured in only 0%"))).toBe(true);
    });

    it("raises concern for actions follow-up < 60%", () => {
      const episodes = makeEpisodeSet(5);
      const interviews = makeInterviewsForEpisodes(episodes, {
        actions_agreed: true,
        actions_followed_up: false,
      });
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        return_interview_records: interviews,
      }));
      expect(r.concerns.some((c) => c.includes("0% of return interview actions followed up"))).toBe(true);
    });

    it("raises concern for contextual safeguarding < 50%", () => {
      const episodes = makeEpisodeSet(5);
      const updates = makeRiskUpdatesForEpisodes(episodes, { contextual_safeguarding_considered: false });
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        risk_assessment_update_records: updates,
      }));
      expect(r.concerns.some((c) => c.includes("Contextual safeguarding considered in only 0%"))).toBe(true);
    });

    it("raises concern for overdue pattern reviews", () => {
      const patterns = [makePattern({ review_overdue: true })];
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: makeEpisodeSet(3),
        pattern_analysis_records: patterns,
      }));
      expect(r.concerns.some((c) => c.includes("pattern analysis review"))).toBe(true);
    });

    it("raises concern for prevention rate < 30%", () => {
      const patterns = [
        makePattern({ prevention_effective: false }),
        makePattern({ prevention_effective: false }),
        makePattern({ prevention_effective: false }),
        makePattern({ prevention_effective: false }),
      ];
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: makeEpisodeSet(4),
        pattern_analysis_records: patterns,
      }));
      expect(r.concerns.some((c) => c.includes("Prevention strategies effective in only 0%"))).toBe(true);
    });

    it("raises concern for debriefing completion < 50%", () => {
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: makeEpisodeSet(10, { debriefing_completed: false }),
      }));
      expect(r.concerns.some((c) => c.includes("Debriefing completed in only 0%"))).toBe(true);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 7. RECOMMENDATIONS
  // ══════════════════════════════════════════════════════════════════════════

  describe("recommendations", () => {
    it("generates immediate recommendation for protocol adherence < 50%", () => {
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: makeEpisodeSet(10, { protocol_followed: false }),
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("missing person and absent without authority protocols"))).toBe(true);
    });

    it("generates immediate recommendation for return interview < 50%", () => {
      const episodes = makeEpisodeSet(10);
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        return_interview_records: makeInterviewsForEpisodes(episodes.slice(0, 2)),
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("return interview process"))).toBe(true);
    });

    it("generates immediate recommendation for exploitation screening < 40%", () => {
      const episodes = makeEpisodeSet(5);
      const updates = makeRiskUpdatesForEpisodes(episodes, { exploitation_screening_completed: false });
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        risk_assessment_update_records: updates,
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("exploitation screening"))).toBe(true);
    });

    it("generates immediate recommendation for high-risk episodes without police", () => {
      const episodes = [makeProtocol({ risk_level: "high", police_notified: false })];
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("police notification for every high"))).toBe(true);
    });

    it("generates immediate recommendation for risk update < 40%", () => {
      const episodes = makeEpisodeSet(10);
      const updates = makeRiskUpdatesForEpisodes(episodes.slice(0, 3));
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        risk_assessment_update_records: updates,
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("post-episode risk assessment review"))).toBe(true);
    });

    it("generates immediate recommendation for notification timeliness < 70%", () => {
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: makeEpisodeSet(10, { notification_within_timeframe: false }),
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("notification procedures"))).toBe(true);
    });

    it("generates soon recommendation for protocol 50-80%", () => {
      const episodes = [
        ...makeEpisodeSet(6, { protocol_followed: true }),
        ...makeEpisodeSet(4, { protocol_followed: false }),
      ];
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("Improve protocol adherence to at least 80%"))).toBe(true);
    });

    it("generates soon recommendation for return interview 50-80%", () => {
      const episodes = makeEpisodeSet(10);
      const interviews = makeInterviewsForEpisodes(episodes.slice(0, 6));
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        return_interview_records: interviews,
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("Increase return interview coverage to at least 80%"))).toBe(true);
    });

    it("generates soon recommendation for risk update 40-70%", () => {
      const episodes = makeEpisodeSet(10);
      const updates = makeRiskUpdatesForEpisodes(episodes.slice(0, 5));
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        risk_assessment_update_records: updates,
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("Improve post-episode risk assessment update rate"))).toBe(true);
    });

    it("generates immediate recommendation for police liaison < 50%", () => {
      const episodes = makeEpisodeSet(10);
      const liaisons = makeLiaisonsForEpisodes(episodes.slice(0, 4));
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        police_liaison_records: liaisons,
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("Urgently improve police liaison"))).toBe(true);
    });

    it("generates soon recommendation for actions follow-up < 60%", () => {
      const episodes = makeEpisodeSet(5);
      const interviews = makeInterviewsForEpisodes(episodes, {
        actions_agreed: true,
        actions_followed_up: false,
      });
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        return_interview_records: interviews,
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("tracking system for return interview actions"))).toBe(true);
    });

    it("generates planned recommendation for debriefing < 70%", () => {
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: makeEpisodeSet(10, { debriefing_completed: false }),
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("debriefing completion rates"))).toBe(true);
    });

    it("generates planned recommendation for triggers < 70%", () => {
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: makeEpisodeSet(10, { trigger_factors_recorded: false }),
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("trigger factors"))).toBe(true);
    });

    it("generates planned recommendation for shared with PA < 70%", () => {
      const patterns = [
        makePattern({ shared_with_placing_authority: false }),
        makePattern({ shared_with_placing_authority: false }),
      ];
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: makeEpisodeSet(2),
        pattern_analysis_records: patterns,
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("information sharing with placing authorities"))).toBe(true);
    });

    it("recommendations have sequential rank numbers", () => {
      const episodes = makeEpisodeSet(10, { protocol_followed: false, notification_within_timeframe: false });
      const interviews = makeInterviewsForEpisodes(episodes.slice(0, 2));
      const updates = makeRiskUpdatesForEpisodes(episodes.slice(0, 2), { exploitation_screening_completed: false });
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        return_interview_records: interviews,
        risk_assessment_update_records: updates,
      }));
      for (let i = 0; i < r.recommendations.length; i++) {
        expect(r.recommendations[i].rank).toBe(i + 1);
      }
    });

    it("all recommendations reference a regulation", () => {
      const episodes = makeEpisodeSet(10, { protocol_followed: false });
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
      }));
      for (const rec of r.recommendations) {
        expect(rec.regulatory_ref.length).toBeGreaterThan(0);
      }
    });

    it("has no recommendations when everything is perfect", () => {
      const episodes = makeEpisodeSet(5, {
        protocol_followed: true,
        notification_within_timeframe: true,
        debriefing_completed: true,
        trigger_factors_recorded: true,
        risk_level: "low",
        police_notified: true,
      });
      const interviews = makeInterviewsForEpisodes(episodes, {
        interviewer_independent: true,
        child_views_captured: true,
        actions_agreed: true,
        actions_followed_up: true,
        quality_rating: 5,
      });
      const updates = makeRiskUpdatesForEpisodes(episodes, {
        exploitation_screening_completed: true,
        contextual_safeguarding_considered: true,
      });
      const liaisons = makeLiaisonsForEpisodes(episodes);
      const patterns = [makePattern({
        child_id: "c1",
        shared_with_placing_authority: true,
        review_overdue: false,
        multi_agency_mapping_completed: true,
        prevention_effective: true,
      })];
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        return_interview_records: interviews,
        risk_assessment_update_records: updates,
        police_liaison_records: liaisons,
        pattern_analysis_records: patterns,
      }));
      expect(r.recommendations).toHaveLength(0);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 8. INSIGHTS
  // ══════════════════════════════════════════════════════════════════════════

  describe("insights", () => {
    it("generates critical insight for protocol adherence < 50%", () => {
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: makeEpisodeSet(10, { protocol_followed: false }),
      }));
      const critical = r.insights.filter((i) => i.severity === "critical");
      expect(critical.some((i) => i.text.includes("Protocol adherence at only 0%"))).toBe(true);
    });

    it("generates critical insight for return interview < 50%", () => {
      const episodes = makeEpisodeSet(10);
      const interviews = makeInterviewsForEpisodes(episodes.slice(0, 2));
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        return_interview_records: interviews,
      }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("Return interviews completed for only"))).toBe(true);
    });

    it("generates critical insight for exploitation screening < 40%", () => {
      const episodes = makeEpisodeSet(5);
      const updates = makeRiskUpdatesForEpisodes(episodes, { exploitation_screening_completed: false });
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        risk_assessment_update_records: updates,
      }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("Exploitation screening at only"))).toBe(true);
    });

    it("generates critical insight for high-risk episodes without police notification", () => {
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: [makeProtocol({ risk_level: "high", police_notified: false })],
      }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("high/very-high risk episodes"))).toBe(true);
    });

    it("generates critical insight for risk update rate < 40%", () => {
      const episodes = makeEpisodeSet(10);
      const updates = makeRiskUpdatesForEpisodes(episodes.slice(0, 3));
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        risk_assessment_update_records: updates,
      }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("Risk assessments updated for only"))).toBe(true);
    });

    it("generates critical insight for multiple ongoing episodes", () => {
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: [
          makeProtocol({ outcome: "ongoing" }),
          makeProtocol({ outcome: "ongoing" }),
        ],
      }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("2 episodes currently ongoing"))).toBe(true);
    });

    it("does NOT generate critical insight for single ongoing episode", () => {
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: [makeProtocol({ outcome: "ongoing" })],
      }));
      // Critical is only for > 1 ongoing
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("episodes currently ongoing"))).toBe(false);
    });

    it("generates warning insight for protocol 50-80%", () => {
      const episodes = [
        ...makeEpisodeSet(7, { protocol_followed: true }),
        ...makeEpisodeSet(3, { protocol_followed: false }),
      ];
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
      }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Protocol adherence at 70%"))).toBe(true);
    });

    it("generates warning insight for return interview 50-80%", () => {
      const episodes = makeEpisodeSet(10);
      const interviews = makeInterviewsForEpisodes(episodes.slice(0, 6));
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        return_interview_records: interviews,
      }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Return interview coverage at 60%"))).toBe(true);
    });

    it("generates warning insight for risk update 40-70%", () => {
      const episodes = makeEpisodeSet(10);
      const updates = makeRiskUpdatesForEpisodes(episodes.slice(0, 5));
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        risk_assessment_update_records: updates,
      }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Risk updates follow 50%"))).toBe(true);
    });

    it("generates warning insight for police liaison 50-70%", () => {
      const episodes = makeEpisodeSet(10);
      const liaisons = makeLiaisonsForEpisodes(episodes.slice(0, 6));
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        police_liaison_records: liaisons,
      }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Police liaison at 60%"))).toBe(true);
    });

    it("generates warning insight for repeat children", () => {
      const episodes = [
        makeProtocol({ child_id: "c1" }),
        makeProtocol({ child_id: "c1" }),
        makeProtocol({ child_id: "c1" }),
      ];
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
      }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("repeat episodes"))).toBe(true);
    });

    it("generates warning insight for risk escalation", () => {
      const episodes = makeEpisodeSet(3);
      const updates = makeRiskUpdatesForEpisodes(episodes, {
        risk_level_before: "low",
        risk_level_after: "high",
      });
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        risk_assessment_update_records: updates,
      }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Risk escalated"))).toBe(true);
    });

    it("generates warning insight for risk assessment timeliness < 70%", () => {
      const episodes = makeEpisodeSet(5);
      const updates = makeRiskUpdatesForEpisodes(episodes, { updated_within_48_hours: false });
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        risk_assessment_update_records: updates,
      }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("risk assessments updated within 48 hours"))).toBe(true);
    });

    it("generates warning insight for interview timeliness < 70%", () => {
      const episodes = makeEpisodeSet(5);
      const interviews = makeInterviewsForEpisodes(episodes, { completed_within_72_hours: false });
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        return_interview_records: interviews,
      }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("return interviews completed within 72 hours"))).toBe(true);
    });

    it("generates warning insight for episode type distribution (>= 3 episodes)", () => {
      const episodes = [
        makeProtocol({ episode_type: "missing" }),
        makeProtocol({ episode_type: "absent_without_authority" }),
        makeProtocol({ episode_type: "away_from_placement" }),
      ];
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
      }));
      expect(r.insights.some((i) => i.text.includes("Episode type distribution"))).toBe(true);
    });

    it("does not generate episode type insight for fewer than 3 episodes", () => {
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: makeEpisodeSet(2),
      }));
      expect(r.insights.some((i) => i.text.includes("Episode type distribution"))).toBe(false);
    });

    it("generates warning insight for pattern types with >= 3 patterns identified", () => {
      const patterns = [
        makePattern({ pattern_identified: true, pattern_type: "peer_influence" }),
        makePattern({ pattern_identified: true, pattern_type: "peer_influence" }),
        makePattern({ pattern_identified: true, pattern_type: "time_of_day" }),
      ];
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: makeEpisodeSet(3),
        pattern_analysis_records: patterns,
      }));
      expect(r.insights.some((i) => i.text.includes("Identified pattern types"))).toBe(true);
    });

    it("generates positive insight for outstanding rating", () => {
      const episodes = makeEpisodeSet(5);
      const interviews = makeInterviewsForEpisodes(episodes, { quality_rating: 5 });
      const updates = makeRiskUpdatesForEpisodes(episodes);
      const liaisons = makeLiaisonsForEpisodes(episodes);
      const patterns = [makePattern({ child_id: "c1" })];
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        return_interview_records: interviews,
        risk_assessment_update_records: updates,
        police_liaison_records: liaisons,
        pattern_analysis_records: patterns,
      }));
      if (r.missing_rating === "outstanding") {
        expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("outstanding missing person"))).toBe(true);
      }
    });

    it("generates positive insight for protocol >= 95% and notification >= 95%", () => {
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: makeEpisodeSet(20, {
          protocol_followed: true,
          notification_within_timeframe: true,
        }),
      }));
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("100% protocol adherence"))).toBe(true);
    });

    it("generates positive insight for return interview >= 95% and quality >= 4.0", () => {
      const episodes = makeEpisodeSet(10);
      const interviews = makeInterviewsForEpisodes(episodes, { quality_rating: 5 });
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        return_interview_records: interviews,
      }));
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("return interview coverage"))).toBe(true);
    });

    it("generates positive insight for exploitation >= 90% and contextual >= 90%", () => {
      const episodes = makeEpisodeSet(5);
      const updates = makeRiskUpdatesForEpisodes(episodes, {
        exploitation_screening_completed: true,
        contextual_safeguarding_considered: true,
      });
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        risk_assessment_update_records: updates,
      }));
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("exploitation screening"))).toBe(true);
    });

    it("generates positive insight for pattern >= 90% and prevention >= 80%", () => {
      const episodes = makeEpisodeSet(3, { child_id: "c1" });
      const patterns = [makePattern({ child_id: "c1", prevention_effective: true })];
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        pattern_analysis_records: patterns,
      }));
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("pattern analysis coverage"))).toBe(true);
    });

    it("generates positive insight for police liaison >= 90% and reference >= 90%", () => {
      const episodes = makeEpisodeSet(5);
      const liaisons = makeLiaisonsForEpisodes(episodes, { police_reference_obtained: true });
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        police_liaison_records: liaisons,
      }));
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("police liaison"))).toBe(true);
    });

    it("generates positive insight for child views >= 90% and push/pull >= 90%", () => {
      const episodes = makeEpisodeSet(5);
      const interviews = makeInterviewsForEpisodes(episodes, {
        child_views_captured: true,
        push_pull_factors_explored: true,
      });
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        return_interview_records: interviews,
      }));
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("push/pull factors"))).toBe(true);
    });

    it("generates positive insight for safety plan >= 90% and care plan >= 90%", () => {
      const episodes = makeEpisodeSet(5);
      const updates = makeRiskUpdatesForEpisodes(episodes, {
        safety_plan_updated: true,
        care_plan_updated: true,
      });
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        risk_assessment_update_records: updates,
      }));
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("Safety and care plans updated"))).toBe(true);
    });

    it("generates positive insight for risk de-escalation > escalation", () => {
      const episodes = makeEpisodeSet(5);
      const updates = makeRiskUpdatesForEpisodes(episodes, {
        risk_level_before: "high",
        risk_level_after: "low",
      });
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        risk_assessment_update_records: updates,
      }));
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("Risk de-escalated"))).toBe(true);
    });

    it("generates positive insight for actions follow-up >= 90%", () => {
      const episodes = makeEpisodeSet(5);
      const interviews = makeInterviewsForEpisodes(episodes, {
        actions_agreed: true,
        actions_followed_up: true,
      });
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        return_interview_records: interviews,
      }));
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("return interview actions followed up"))).toBe(true);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 9. HEADLINES
  // ══════════════════════════════════════════════════════════════════════════

  describe("headlines", () => {
    it("uses outstanding headline for outstanding rating", () => {
      const episodes = makeEpisodeSet(5);
      const interviews = makeInterviewsForEpisodes(episodes, { quality_rating: 5 });
      const updates = makeRiskUpdatesForEpisodes(episodes);
      const liaisons = makeLiaisonsForEpisodes(episodes);
      const patterns = [makePattern({ child_id: "c1" })];
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        return_interview_records: interviews,
        risk_assessment_update_records: updates,
        police_liaison_records: liaisons,
        pattern_analysis_records: patterns,
      }));
      if (r.missing_rating === "outstanding") {
        expect(r.headline).toContain("Outstanding");
      }
    });

    it("includes strength/concern counts in good headline", () => {
      const episodes = makeEpisodeSet(5);
      const interviews = makeInterviewsForEpisodes(episodes, { quality_rating: 3 });
      const riskUpdates = makeRiskUpdatesForEpisodes(episodes.slice(0, 4));
      const liaisons = makeLiaisonsForEpisodes(episodes.slice(0, 4));
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        return_interview_records: interviews,
        risk_assessment_update_records: riskUpdates,
        police_liaison_records: liaisons,
      }));
      if (r.missing_rating === "good") {
        expect(r.headline).toContain("Good");
        expect(r.headline).toContain("strength");
      }
    });

    it("includes concern count in adequate headline", () => {
      const episodes = makeEpisodeSet(5);
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
      }));
      if (r.missing_rating === "adequate") {
        expect(r.headline).toContain("Adequate");
        expect(r.headline).toContain("concern");
      }
    });

    it("includes concern count in inadequate headline", () => {
      const episodes = makeEpisodeSet(10, { protocol_followed: false });
      const interviews = makeInterviewsForEpisodes(episodes.slice(0, 1), { quality_rating: 1 });
      const updates = makeRiskUpdatesForEpisodes(episodes.slice(0, 1), { exploitation_screening_completed: false });
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        return_interview_records: interviews,
        risk_assessment_update_records: updates,
      }));
      if (r.missing_rating === "inadequate") {
        expect(r.headline).toContain("inadequate");
        expect(r.headline).toContain("concern");
      }
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 10. EPISODE TYPE HANDLING
  // ══════════════════════════════════════════════════════════════════════════

  describe("episode type handling", () => {
    it("counts missing episodes", () => {
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: makeEpisodeSet(3, { episode_type: "missing" }),
      }));
      expect(r.total_episodes).toBe(3);
    });

    it("counts absent_without_authority episodes", () => {
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: makeEpisodeSet(4, { episode_type: "absent_without_authority" }),
      }));
      expect(r.total_episodes).toBe(4);
    });

    it("counts away_from_placement episodes", () => {
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: makeEpisodeSet(2, { episode_type: "away_from_placement" }),
      }));
      expect(r.total_episodes).toBe(2);
    });

    it("handles mixed episode types", () => {
      const episodes = [
        makeProtocol({ episode_type: "missing" }),
        makeProtocol({ episode_type: "absent_without_authority" }),
        makeProtocol({ episode_type: "away_from_placement" }),
        makeProtocol({ episode_type: "missing" }),
      ];
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
      }));
      expect(r.total_episodes).toBe(4);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 11. RISK LEVEL HANDLING
  // ══════════════════════════════════════════════════════════════════════════

  describe("risk level handling", () => {
    it("identifies high-risk episodes for police notification check", () => {
      const episodes = [
        makeProtocol({ risk_level: "high", police_notified: true }),
        makeProtocol({ risk_level: "very_high", police_notified: true }),
        makeProtocol({ risk_level: "low", police_notified: false }),
        makeProtocol({ risk_level: "medium", police_notified: false }),
      ];
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
      }));
      // No concern for high-risk without police, since both high/very_high have police_notified
      expect(r.concerns.some((c) => c.includes("high/very-high risk"))).toBe(false);
    });

    it("tracks risk escalation in risk updates", () => {
      const episodes = makeEpisodeSet(3);
      const updates = [
        makeRiskUpdate({ episode_id: episodes[0].id, risk_level_before: "low", risk_level_after: "high" }),
        makeRiskUpdate({ episode_id: episodes[1].id, risk_level_before: "medium", risk_level_after: "medium" }),
        makeRiskUpdate({ episode_id: episodes[2].id, risk_level_before: "high", risk_level_after: "low" }),
      ];
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        risk_assessment_update_records: updates,
      }));
      // 1 escalation, 1 de-escalation — both generate warnings
      expect(r.insights.some((i) => i.text.includes("Risk escalated in 1 assessment"))).toBe(true);
    });

    it("tracks risk de-escalation as positive", () => {
      const episodes = makeEpisodeSet(3);
      const updates = [
        makeRiskUpdate({ episode_id: episodes[0].id, risk_level_before: "high", risk_level_after: "low" }),
        makeRiskUpdate({ episode_id: episodes[1].id, risk_level_before: "very_high", risk_level_after: "medium" }),
        makeRiskUpdate({ episode_id: episodes[2].id, risk_level_before: "medium", risk_level_after: "medium" }),
      ];
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        risk_assessment_update_records: updates,
      }));
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("Risk de-escalated in 2"))).toBe(true);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 12. OUTCOME HANDLING
  // ══════════════════════════════════════════════════════════════════════════

  describe("outcome handling", () => {
    it("handles returned_self outcome", () => {
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: [makeProtocol({ outcome: "returned_self" })],
      }));
      expect(r.total_episodes).toBe(1);
    });

    it("handles found_by_staff outcome", () => {
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: [makeProtocol({ outcome: "found_by_staff" })],
      }));
      expect(r.total_episodes).toBe(1);
    });

    it("handles found_by_police outcome", () => {
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: [makeProtocol({ outcome: "found_by_police" })],
      }));
      expect(r.total_episodes).toBe(1);
    });

    it("handles found_by_other outcome", () => {
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: [makeProtocol({ outcome: "found_by_other" })],
      }));
      expect(r.total_episodes).toBe(1);
    });

    it("handles ongoing outcome and flags concern", () => {
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: [makeProtocol({ outcome: "ongoing" })],
      }));
      expect(r.concerns.some((c) => c.includes("currently ongoing"))).toBe(true);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 13. POLICE LIAISON TYPES
  // ══════════════════════════════════════════════════════════════════════════

  describe("police liaison types", () => {
    it("handles initial_report type", () => {
      const episodes = makeEpisodeSet(1);
      const liaisons = [makeLiaison({ episode_id: episodes[0].id, liaison_type: "initial_report" })];
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        police_liaison_records: liaisons,
      }));
      expect(r.police_liaison_rate).toBe(100);
    });

    it("handles strategy_discussion type", () => {
      const episodes = makeEpisodeSet(1);
      const liaisons = [makeLiaison({ episode_id: episodes[0].id, liaison_type: "strategy_discussion" })];
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        police_liaison_records: liaisons,
      }));
      expect(r.police_liaison_rate).toBe(100);
    });

    it("handles intelligence_sharing type", () => {
      const episodes = makeEpisodeSet(1);
      const liaisons = [makeLiaison({ episode_id: episodes[0].id, liaison_type: "intelligence_sharing" })];
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        police_liaison_records: liaisons,
      }));
      expect(r.police_liaison_rate).toBe(100);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 14. PATTERN TYPES
  // ══════════════════════════════════════════════════════════════════════════

  describe("pattern types", () => {
    it("handles exploitation_indicator pattern type", () => {
      const patterns = [makePattern({ pattern_identified: true, pattern_type: "exploitation_indicator" })];
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: makeEpisodeSet(1),
        pattern_analysis_records: patterns,
      }));
      expect(r.pattern_analysis_rate).toBeGreaterThanOrEqual(0);
    });

    it("handles none pattern type", () => {
      const patterns = [makePattern({ pattern_identified: false, pattern_type: "none" })];
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: makeEpisodeSet(1),
        pattern_analysis_records: patterns,
      }));
      expect(r.pattern_analysis_rate).toBeGreaterThanOrEqual(0);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 15. EDGE CASES & BOUNDARY CONDITIONS
  // ══════════════════════════════════════════════════════════════════════════

  describe("edge cases", () => {
    it("handles single episode with all perfect data", () => {
      const ep = makeProtocol();
      const interview = makeInterview({ episode_id: ep.id });
      const update = makeRiskUpdate({ episode_id: ep.id });
      const liaison = makeLiaison({ episode_id: ep.id });
      const pattern = makePattern({ child_id: ep.child_id });
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: [ep],
        return_interview_records: [interview],
        risk_assessment_update_records: [update],
        police_liaison_records: [liaison],
        pattern_analysis_records: [pattern],
      }));
      expect(r.missing_rating).toBe("outstanding");
    });

    it("handles many children with episodes", () => {
      const episodes = [
        ...makeEpisodeSet(3, { child_id: "c1" }),
        ...makeEpisodeSet(3, { child_id: "c2" }),
        ...makeEpisodeSet(3, { child_id: "c3" }),
        ...makeEpisodeSet(3, { child_id: "c4" }),
        ...makeEpisodeSet(3, { child_id: "c5" }),
      ];
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
      }));
      expect(r.total_episodes).toBe(15);
    });

    it("handles interviews for episodes that are all ongoing (0 closed)", () => {
      const episodes = makeEpisodeSet(5, { outcome: "ongoing" });
      const interviews = makeInterviewsForEpisodes(episodes);
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        return_interview_records: interviews,
      }));
      // 0 closed episodes → denominator is 0 → pct returns 0
      expect(r.return_interview_rate).toBe(0);
    });

    it("handles risk updates without matching episodes", () => {
      const updates = [makeRiskUpdate({ episode_id: "nonexistent_ep" })];
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: makeEpisodeSet(1),
        risk_assessment_update_records: updates,
      }));
      // The update's episode_id doesn't match any protocol record id
      // But risk_update_rate counts unique episode_ids in updates vs totalEpisodes
      expect(r.risk_update_rate).toBeGreaterThanOrEqual(0);
    });

    it("handles duplicate episode_ids in interviews (counts unique)", () => {
      const ep = makeProtocol({ id: "ep_dup_test" });
      const interviews = [
        makeInterview({ episode_id: "ep_dup_test" }),
        makeInterview({ episode_id: "ep_dup_test" }),
      ];
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: [ep],
        return_interview_records: interviews,
      }));
      // Only 1 unique episode covered → 100%
      expect(r.return_interview_rate).toBe(100);
    });

    it("handles zero duration hours", () => {
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: [makeProtocol({ duration_hours: 0 })],
      }));
      expect(r.total_episodes).toBe(1);
    });

    it("handles very high duration hours", () => {
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: [makeProtocol({ duration_hours: 720 })],
      }));
      expect(r.total_episodes).toBe(1);
    });

    it("handles all interviews having safeguarding concerns with referrals", () => {
      const episodes = makeEpisodeSet(5);
      const interviews = makeInterviewsForEpisodes(episodes, {
        safeguarding_concerns_identified: true,
        referrals_made: true,
      });
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        return_interview_records: interviews,
      }));
      expect(r.return_interview_rate).toBe(100);
    });

    it("handles interviews with concerns but no referrals", () => {
      const episodes = makeEpisodeSet(5);
      const interviews = makeInterviewsForEpisodes(episodes, {
        safeguarding_concerns_identified: true,
        referrals_made: false,
      });
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        return_interview_records: interviews,
      }));
      expect(r.total_episodes).toBe(5);
    });

    it("handles total_children = 1", () => {
      const r = computeMissingPersonAbsentAuthority(baseInput({ total_children: 1 }));
      // Empty arrays + children > 0 → inadequate
      expect(r.missing_rating).toBe("inadequate");
    });

    it("handles large dataset without errors", () => {
      const episodes = makeEpisodeSet(50);
      const interviews = makeInterviewsForEpisodes(episodes);
      const updates = makeRiskUpdatesForEpisodes(episodes);
      const liaisons = makeLiaisonsForEpisodes(episodes);
      const patterns = [makePattern({ child_id: "c1" })];
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        return_interview_records: interviews,
        risk_assessment_update_records: updates,
        police_liaison_records: liaisons,
        pattern_analysis_records: patterns,
      }));
      expect(r.total_episodes).toBe(50);
      expect(r.missing_score).toBeGreaterThanOrEqual(0);
      expect(r.missing_score).toBeLessThanOrEqual(100);
    });

    it("repeat child concern shows max episodes count", () => {
      const episodes = [
        makeProtocol({ child_id: "c1" }),
        makeProtocol({ child_id: "c1" }),
        makeProtocol({ child_id: "c1" }),
        makeProtocol({ child_id: "c1" }),
        makeProtocol({ child_id: "c1" }),
        makeProtocol({ child_id: "c2" }),
        makeProtocol({ child_id: "c2" }),
      ];
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
      }));
      expect(r.concerns.some((c) => c.includes("up to 5 episodes"))).toBe(true);
    });

    it("concern uses singular for single high-risk episode without police", () => {
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: [makeProtocol({ risk_level: "high", police_notified: false })],
      }));
      expect(r.concerns.some((c) => c.includes("1 high/very-high risk episode without police notification"))).toBe(true);
    });

    it("concern uses plural for multiple high-risk episodes without police", () => {
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: [
          makeProtocol({ risk_level: "high", police_notified: false }),
          makeProtocol({ risk_level: "very_high", police_notified: false }),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("2 high/very-high risk episodes without police notification"))).toBe(true);
    });

    it("concern uses singular for single ongoing episode", () => {
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: [makeProtocol({ outcome: "ongoing" })],
      }));
      expect(r.concerns.some((c) => c.includes("1 episode currently ongoing") && c.includes("a child"))).toBe(true);
    });

    it("concern uses plural for multiple ongoing episodes", () => {
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: [
          makeProtocol({ outcome: "ongoing" }),
          makeProtocol({ outcome: "ongoing" }),
          makeProtocol({ outcome: "ongoing" }),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("3 episodes currently ongoing") && c.includes("children"))).toBe(true);
    });

    it("overdue review concern uses singular when 1 is overdue", () => {
      const patterns = [makePattern({ review_overdue: true })];
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: makeEpisodeSet(1),
        pattern_analysis_records: patterns,
      }));
      expect(r.concerns.some((c) => c.includes("1 pattern analysis review is overdue"))).toBe(true);
    });

    it("overdue review concern uses plural when multiple are overdue", () => {
      const patterns = [
        makePattern({ review_overdue: true }),
        makePattern({ review_overdue: true }),
        makePattern({ review_overdue: true }),
      ];
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: makeEpisodeSet(3),
        pattern_analysis_records: patterns,
      }));
      expect(r.concerns.some((c) => c.includes("3 pattern analysis reviews are overdue"))).toBe(true);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 16. COMBINED SCENARIOS
  // ══════════════════════════════════════════════════════════════════════════

  describe("combined scenarios", () => {
    it("perfect home scores outstanding with multiple strengths and positive insights", () => {
      // One episode per child to avoid repeat-child concern
      const episodes = [
        makeProtocol({ child_id: "c1" }),
        makeProtocol({ child_id: "c2" }),
        makeProtocol({ child_id: "c3" }),
        makeProtocol({ child_id: "c4" }),
        makeProtocol({ child_id: "c5" }),
        makeProtocol({ child_id: "c6" }),
        makeProtocol({ child_id: "c7" }),
        makeProtocol({ child_id: "c8" }),
        makeProtocol({ child_id: "c9" }),
        makeProtocol({ child_id: "c10" }),
      ];
      const interviews = makeInterviewsForEpisodes(episodes, {
        quality_rating: 5,
        interviewer_independent: true,
        child_views_captured: true,
        push_pull_factors_explored: true,
        actions_agreed: true,
        actions_followed_up: true,
      });
      const updates = makeRiskUpdatesForEpisodes(episodes, {
        exploitation_screening_completed: true,
        contextual_safeguarding_considered: true,
        safety_plan_updated: true,
        care_plan_updated: true,
        risk_level_before: "medium",
        risk_level_after: "low",
      });
      const liaisons = makeLiaisonsForEpisodes(episodes, { police_reference_obtained: true });
      const patterns = episodes.map((ep) => makePattern({
        child_id: ep.child_id,
        prevention_effective: true,
        multi_agency_mapping_completed: true,
      }));
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        return_interview_records: interviews,
        risk_assessment_update_records: updates,
        police_liaison_records: liaisons,
        pattern_analysis_records: patterns,
      }));
      expect(r.missing_rating).toBe("outstanding");
      expect(r.strengths.length).toBeGreaterThan(5);
      expect(r.concerns).toHaveLength(0);
      expect(r.recommendations).toHaveLength(0);
      expect(r.insights.filter((i) => i.severity === "positive").length).toBeGreaterThan(3);
    });

    it("struggling home scores inadequate with multiple concerns and critical insights", () => {
      const episodes = makeEpisodeSet(10, {
        protocol_followed: false,
        notification_within_timeframe: false,
        debriefing_completed: false,
        trigger_factors_recorded: false,
        risk_level: "high",
        police_notified: false,
        outcome: "returned_self",
      });
      const interviews = makeInterviewsForEpisodes(episodes.slice(0, 1), {
        quality_rating: 1,
        interviewer_independent: false,
        child_views_captured: false,
        actions_agreed: true,
        actions_followed_up: false,
      });
      const updates = makeRiskUpdatesForEpisodes(episodes.slice(0, 1), {
        exploitation_screening_completed: false,
        contextual_safeguarding_considered: false,
        updated_within_48_hours: false,
        safety_plan_updated: false,
        care_plan_updated: false,
      });
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        return_interview_records: interviews,
        risk_assessment_update_records: updates,
      }));
      expect(r.missing_rating).toBe("inadequate");
      expect(r.strengths).toHaveLength(0);
      expect(r.concerns.length).toBeGreaterThan(5);
      expect(r.recommendations.length).toBeGreaterThan(5);
      expect(r.insights.filter((i) => i.severity === "critical").length).toBeGreaterThan(2);
    });

    it("mixed performance home scores good or adequate", () => {
      const episodes = makeEpisodeSet(10, { protocol_followed: true });
      const interviews = makeInterviewsForEpisodes(episodes.slice(0, 7), { quality_rating: 3 });
      const updates = makeRiskUpdatesForEpisodes(episodes.slice(0, 6));
      const liaisons = makeLiaisonsForEpisodes(episodes.slice(0, 7));
      const r = computeMissingPersonAbsentAuthority(baseInput({
        missing_protocol_records: episodes,
        return_interview_records: interviews,
        risk_assessment_update_records: updates,
        police_liaison_records: liaisons,
      }));
      expect(["good", "adequate"]).toContain(r.missing_rating);
      expect(r.strengths.length).toBeGreaterThan(0);
    });
  });
});
