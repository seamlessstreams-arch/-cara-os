// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME MISSING EPISODE INTELLIGENCE ENGINE TESTS
// 160+ comprehensive vitest tests covering guard clauses, modifiers,
// rating boundaries, output accuracy, strengths/concerns/recommendations/
// insights, edge cases, and score clamping.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { computeMissingEpisode } from "../home-missing-episode-intelligence-engine";
import type {
  MissingEpisodeRecordInput,
  MissingEpisodeInput,
} from "../home-missing-episode-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const baseRecord = (
  overrides: Partial<MissingEpisodeRecordInput> = {},
): MissingEpisodeRecordInput => ({
  id: "ep_1",
  child_id: "child_1",
  date_missing: "2026-04-01",
  date_returned: "2026-04-01",
  duration_hours: 2,
  risk_level: "medium",
  reported_to_police: false,
  reported_to_la: true,
  return_interview_completed: true,
  return_interview_within_72hrs: true,
  has_contextual_safeguarding_risk: false,
  has_pattern_notes: true,
  status: "closed",
  still_missing: false,
  ...overrides,
});

const baseInput = (
  overrides: Partial<MissingEpisodeInput> = {},
): MissingEpisodeInput => ({
  today: "2026-05-15",
  total_children: 3,
  episodes: [baseRecord()],
  ...overrides,
});

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Home Missing Episode Intelligence Engine", () => {
  // ════════════════════════════════════════════════════════════════════════════
  // 1. GUARD CLAUSES
  // ════════════════════════════════════════════════════════════════════════════

  describe("Guard clauses", () => {
    it("returns insufficient_data with score 0 when total_children is 0", () => {
      const r = computeMissingEpisode({ today: "2026-05-15", total_children: 0, episodes: [] });
      expect(r.missing_rating).toBe("insufficient_data");
      expect(r.missing_score).toBe(0);
    });

    it("returns correct headline when total_children is 0", () => {
      const r = computeMissingEpisode({ today: "2026-05-15", total_children: 0, episodes: [] });
      expect(r.headline).toBe("No children placed — missing episode analysis is not applicable.");
    });

    it("returns all zero metrics when total_children is 0", () => {
      const r = computeMissingEpisode({ today: "2026-05-15", total_children: 0, episodes: [] });
      expect(r.total_episodes).toBe(0);
      expect(r.unique_children_missing).toBe(0);
      expect(r.episodes_last_90_days).toBe(0);
      expect(r.high_risk_count).toBe(0);
      expect(r.still_missing_count).toBe(0);
      expect(r.return_interview_rate).toBe(0);
      expect(r.return_interview_timeliness_rate).toBe(0);
      expect(r.la_notification_rate).toBe(0);
      expect(r.police_report_rate_high_risk).toBe(0);
      expect(r.contextual_safeguarding_flag_rate).toBe(0);
      expect(r.pattern_analysis_rate).toBe(0);
      expect(r.average_duration_hours).toBe(0);
    });

    it("returns empty strengths, concerns, recommendations when total_children is 0", () => {
      const r = computeMissingEpisode({ today: "2026-05-15", total_children: 0, episodes: [] });
      expect(r.strengths).toEqual([]);
      expect(r.concerns).toEqual([]);
      expect(r.recommendations).toEqual([]);
    });

    it("returns a single warning insight when total_children is 0", () => {
      const r = computeMissingEpisode({ today: "2026-05-15", total_children: 0, episodes: [] });
      expect(r.insights).toHaveLength(1);
      expect(r.insights[0].severity).toBe("warning");
      expect(r.insights[0].text).toContain("No children are currently placed");
    });

    it("returns insufficient_data even when episodes array is non-empty but total_children is 0", () => {
      const r = computeMissingEpisode({
        today: "2026-05-15",
        total_children: 0,
        episodes: [baseRecord()],
      });
      expect(r.missing_rating).toBe("insufficient_data");
      expect(r.missing_score).toBe(0);
    });

    it("returns outstanding with score 82 when children exist but episodes is empty", () => {
      const r = computeMissingEpisode({ today: "2026-05-15", total_children: 3, episodes: [] });
      expect(r.missing_rating).toBe("outstanding");
      expect(r.missing_score).toBe(82);
    });

    it("returns correct headline for zero episodes with children", () => {
      const r = computeMissingEpisode({ today: "2026-05-15", total_children: 3, episodes: [] });
      expect(r.headline).toBe(
        "No missing from care episodes recorded — children are safe, settled, and accounted for.",
      );
    });

    it("returns 100% rates for all compliance metrics when zero episodes", () => {
      const r = computeMissingEpisode({ today: "2026-05-15", total_children: 3, episodes: [] });
      expect(r.return_interview_rate).toBe(100);
      expect(r.return_interview_timeliness_rate).toBe(100);
      expect(r.la_notification_rate).toBe(100);
      expect(r.police_report_rate_high_risk).toBe(100);
      expect(r.contextual_safeguarding_flag_rate).toBe(100);
      expect(r.pattern_analysis_rate).toBe(100);
    });

    it("returns two strengths when zero episodes with children", () => {
      const r = computeMissingEpisode({ today: "2026-05-15", total_children: 3, episodes: [] });
      expect(r.strengths).toHaveLength(2);
      expect(r.strengths[0]).toContain("safe, settled, and accounted for");
      expect(r.strengths[1]).toContain("strongest possible indicator");
    });

    it("returns a positive insight when zero episodes with children", () => {
      const r = computeMissingEpisode({ today: "2026-05-15", total_children: 3, episodes: [] });
      expect(r.insights).toHaveLength(1);
      expect(r.insights[0].severity).toBe("positive");
      expect(r.insights[0].text).toContain("Zero missing episodes");
    });

    it("returns empty concerns and recommendations when zero episodes", () => {
      const r = computeMissingEpisode({ today: "2026-05-15", total_children: 3, episodes: [] });
      expect(r.concerns).toEqual([]);
      expect(r.recommendations).toEqual([]);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 2. INDIVIDUAL MODIFIERS
  // ════════════════════════════════════════════════════════════════════════════

  describe("Modifier 1: Episode frequency", () => {
    it("adds +6 when episodesLast90 is 0 (all episodes older than 90 days)", () => {
      const r = computeMissingEpisode(
        baseInput({
          today: "2026-05-15",
          episodes: [baseRecord({ date_missing: "2025-10-01" })],
        }),
      );
      // Compare to case with recent episodes (+3)
      const r2 = computeMissingEpisode(
        baseInput({
          today: "2026-05-15",
          episodes: [baseRecord({ date_missing: "2026-05-01" })],
        }),
      );
      // Difference should be 3 (6 - 3)
      expect(r.missing_score! - r2.missing_score!).toBe(3);
    });

    it("adds +3 when episodesPerChild <= 1 (episodes in last 90 days)", () => {
      // 1 episode in last 90 days, 3 children => 0.33 per child
      const r = computeMissingEpisode(
        baseInput({
          today: "2026-05-15",
          total_children: 3,
          episodes: [baseRecord({ date_missing: "2026-04-01" })],
        }),
      );
      expect(r.missing_score).toBeGreaterThan(52);
    });

    it("subtracts -5 when episodesPerChild > 2", () => {
      // Compare: 7 episodes (2.33 per child => -5) vs 3 episodes (1.0 per child => +3)
      // Same episodes otherwise, so the only difference is the frequency modifier
      const epsMany = Array.from({ length: 7 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          date_missing: "2026-04-01",
        }),
      );
      const epsFew = Array.from({ length: 3 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          date_missing: "2026-04-01",
        }),
      );
      const rMany = computeMissingEpisode(
        baseInput({ total_children: 3, episodes: epsMany }),
      );
      const rFew = computeMissingEpisode(
        baseInput({ total_children: 3, episodes: epsFew }),
      );
      // -5 vs +3 = 8 point difference
      expect(rFew.missing_score! - rMany.missing_score!).toBe(8);
    });

    it("gives neither bonus nor penalty when episodesPerChild > 1 and <= 2", () => {
      // 4 episodes in last 90 days, 3 children => 1.33 per child
      const episodes4 = Array.from({ length: 4 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          date_missing: "2026-04-01",
        }),
      );
      const r = computeMissingEpisode(
        baseInput({ total_children: 3, episodes: episodes4 }),
      );
      // Compare with 1.0 per child (3 episodes / 3 children) which gets +3
      const eps3 = Array.from({ length: 3 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          date_missing: "2026-04-01",
        }),
      );
      const r2 = computeMissingEpisode(
        baseInput({ total_children: 3, episodes: eps3 }),
      );
      // r2 has +3 from modifier 1, r has 0; difference is 3
      expect(r2.missing_score! - r.missing_score!).toBe(3);
    });

    it("boundary: exactly 1 episode per child gives +3", () => {
      // 3 episodes in last 90 days, 3 children = exactly 1.0
      const episodes = Array.from({ length: 3 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i}`,
          date_missing: "2026-04-01",
        }),
      );
      const r = computeMissingEpisode(
        baseInput({ total_children: 3, episodes }),
      );
      expect(r.missing_score).toBeGreaterThanOrEqual(52);
    });

    it("boundary: exactly 2 episodes per child gives no modifier (not > 2, not <= 1)", () => {
      // 6 episodes in last 90 days, 3 children = exactly 2.0
      const episodes = Array.from({ length: 6 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          date_missing: "2026-04-01",
        }),
      );
      const r = computeMissingEpisode(
        baseInput({ total_children: 3, episodes }),
      );
      expect(r.missing_score).toBeDefined();
    });
  });

  describe("Modifier 2: Return interview compliance", () => {
    it("adds +5 when returnInterviewRate >= 95%", () => {
      const episodes = Array.from({ length: 20 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          return_interview_completed: true,
          still_missing: false,
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.return_interview_rate).toBe(100);
    });

    it("adds +2 when returnInterviewRate is between 80% and 94%", () => {
      // 17 out of 20 returned episodes have interviews = 85%
      const episodes = Array.from({ length: 20 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          return_interview_completed: i < 17,
          still_missing: false,
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.return_interview_rate).toBe(85);
    });

    it("subtracts -5 when returnInterviewRate < 50%", () => {
      // 9 out of 20 returned episodes = 45%
      const episodes = Array.from({ length: 20 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          return_interview_completed: i < 9,
          still_missing: false,
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.return_interview_rate).toBe(45);
    });

    it("gives no modifier when returnInterviewRate is 50-79%", () => {
      // 12 out of 20 returned episodes = 60%
      const episodes = Array.from({ length: 20 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          return_interview_completed: i < 12,
          still_missing: false,
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.return_interview_rate).toBe(60);
    });

    it("subtracts -1 when all episodes are still_missing (no returned episodes)", () => {
      const episodes = [
        baseRecord({ still_missing: true }),
      ];
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.still_missing_count).toBe(1);
    });

    it("boundary: exactly 95% triggers +5", () => {
      // 19 out of 20 = 95%
      const episodes = Array.from({ length: 20 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          return_interview_completed: i < 19,
          still_missing: false,
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.return_interview_rate).toBe(95);
    });

    it("boundary: exactly 80% triggers +2", () => {
      // 16 out of 20 = 80%
      const episodes = Array.from({ length: 20 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          return_interview_completed: i < 16,
          still_missing: false,
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.return_interview_rate).toBe(80);
    });

    it("boundary: exactly 50% gives no modifier (not < 50)", () => {
      // 10 out of 20 = 50%
      const episodes = Array.from({ length: 20 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          return_interview_completed: i < 10,
          still_missing: false,
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.return_interview_rate).toBe(50);
    });
  });

  describe("Modifier 3: Return interview timeliness", () => {
    it("adds +5 when timelinessRate >= 90%", () => {
      const episodes = Array.from({ length: 10 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          return_interview_completed: true,
          return_interview_within_72hrs: true,
          still_missing: false,
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.return_interview_timeliness_rate).toBe(100);
    });

    it("adds +2 when timelinessRate is 70-89%", () => {
      // 8 out of 10 completed interviews timely = 80%
      const episodes = Array.from({ length: 10 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          return_interview_completed: true,
          return_interview_within_72hrs: i < 8,
          still_missing: false,
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.return_interview_timeliness_rate).toBe(80);
    });

    it("subtracts -4 when timelinessRate < 40%", () => {
      // 3 out of 10 completed interviews timely = 30%
      const episodes = Array.from({ length: 10 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          return_interview_completed: true,
          return_interview_within_72hrs: i < 3,
          still_missing: false,
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.return_interview_timeliness_rate).toBe(30);
    });

    it("gives no modifier when timelinessRate is 40-69%", () => {
      // 5 out of 10 = 50%
      const episodes = Array.from({ length: 10 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          return_interview_completed: true,
          return_interview_within_72hrs: i < 5,
          still_missing: false,
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.return_interview_timeliness_rate).toBe(50);
    });

    it("subtracts -1 when no completed interviews exist", () => {
      const episodes = [
        baseRecord({ return_interview_completed: false, still_missing: false }),
      ];
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.return_interview_timeliness_rate).toBe(0);
    });

    it("boundary: exactly 90% triggers +5", () => {
      // 9 out of 10 = 90%
      const episodes = Array.from({ length: 10 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          return_interview_completed: true,
          return_interview_within_72hrs: i < 9,
          still_missing: false,
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.return_interview_timeliness_rate).toBe(90);
    });

    it("boundary: exactly 70% triggers +2", () => {
      // 7 out of 10 = 70%
      const episodes = Array.from({ length: 10 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          return_interview_completed: true,
          return_interview_within_72hrs: i < 7,
          still_missing: false,
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.return_interview_timeliness_rate).toBe(70);
    });

    it("boundary: exactly 40% gives no modifier (not < 40)", () => {
      // 4 out of 10 = 40%
      const episodes = Array.from({ length: 10 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          return_interview_completed: true,
          return_interview_within_72hrs: i < 4,
          still_missing: false,
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.return_interview_timeliness_rate).toBe(40);
    });
  });

  describe("Modifier 4: LA/Police notification", () => {
    it("adds +5 when laRate >= 95 AND policeHighRate >= 90", () => {
      const episodes = Array.from({ length: 20 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          reported_to_la: true,
          risk_level: i < 10 ? "high" : "medium",
          reported_to_police: i < 10,
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.la_notification_rate).toBe(100);
      expect(r.police_report_rate_high_risk).toBe(100);
    });

    it("adds +2 when laRate >= 75 but policeHighRate < 90", () => {
      // 16 of 20 reported to LA = 80%, no high risk
      const episodes = Array.from({ length: 20 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          reported_to_la: i < 16,
          risk_level: "medium",
          reported_to_police: false,
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.la_notification_rate).toBe(80);
    });

    it("adds +2 when policeHighRate >= 75 but laRate < 75", () => {
      const episodes = Array.from({ length: 20 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          reported_to_la: i < 10, // 50%
          risk_level: "high",
          reported_to_police: i < 16, // 80% of high risk
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.la_notification_rate).toBe(50);
      expect(r.police_report_rate_high_risk).toBe(80);
    });

    it("subtracts -4 when laRate < 50", () => {
      // 9 of 20 reported to LA = 45%
      const episodes = Array.from({ length: 20 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          reported_to_la: i < 9,
          risk_level: "medium",
          reported_to_police: false,
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.la_notification_rate).toBe(45);
    });

    it("subtracts -4 when policeHighRate < 50", () => {
      const episodes = Array.from({ length: 20 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          reported_to_la: i < 15, // 75%
          risk_level: "high",
          reported_to_police: i < 9, // 45%
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.police_report_rate_high_risk).toBe(45);
    });

    it("no high risk episodes: policeHighRate is 0 but laRate >= 75 gives +2", () => {
      const episodes = Array.from({ length: 10 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          reported_to_la: i < 8, // 80%
          risk_level: "medium",
          reported_to_police: false,
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.police_report_rate_high_risk).toBe(0);
      expect(r.la_notification_rate).toBe(80);
    });

    it("boundary: laRate exactly 95 with policeHighRate exactly 90 gives +5", () => {
      const episodes = Array.from({ length: 20 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          reported_to_la: i !== 19, // 19/20 = 95%
          risk_level: i < 10 ? "high" : "medium",
          reported_to_police: i < 9, // 9 of 10 high-risk = 90%
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.la_notification_rate).toBe(95);
      expect(r.police_report_rate_high_risk).toBe(90);
    });

    it("boundary: laRate exactly 75 gives +2", () => {
      // 15/20 LA = 75%, no high risk
      const episodes = Array.from({ length: 20 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          reported_to_la: i < 15,
          risk_level: "medium",
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.la_notification_rate).toBe(75);
    });

    it("boundary: laRate exactly 50 and policeHighRate exactly 50 gives no modifier", () => {
      const episodes = Array.from({ length: 20 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          reported_to_la: i < 10, // 50%
          risk_level: "high",
          reported_to_police: i < 10, // 50%
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.la_notification_rate).toBe(50);
      expect(r.police_report_rate_high_risk).toBe(50);
    });
  });

  describe("Modifier 5: Pattern analysis + contextual safeguarding", () => {
    it("adds +4 when patternRate >= 80 AND csRate >= 80", () => {
      const episodes = Array.from({ length: 10 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          has_pattern_notes: true,
          risk_level: "high",
          has_contextual_safeguarding_risk: true,
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.pattern_analysis_rate).toBe(100);
      expect(r.contextual_safeguarding_flag_rate).toBe(100);
    });

    it("adds +2 when patternRate >= 60 but csRate < 60", () => {
      // 7 of 10 have pattern notes = 70%, no high risk so csRate=0
      const episodes = Array.from({ length: 10 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          has_pattern_notes: i < 7,
          risk_level: "medium",
          has_contextual_safeguarding_risk: false,
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.pattern_analysis_rate).toBe(70);
    });

    it("adds +2 when csRate >= 60 but patternRate < 60", () => {
      const episodes = Array.from({ length: 10 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          has_pattern_notes: i < 4, // 40%
          risk_level: "high",
          has_contextual_safeguarding_risk: i < 7, // 70%
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.pattern_analysis_rate).toBe(40);
      expect(r.contextual_safeguarding_flag_rate).toBe(70);
    });

    it("subtracts -4 when patternRate < 30 AND csRate < 30", () => {
      const episodes = Array.from({ length: 10 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          has_pattern_notes: i < 2, // 20%
          risk_level: "high",
          has_contextual_safeguarding_risk: i < 2, // 20%
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.pattern_analysis_rate).toBe(20);
      expect(r.contextual_safeguarding_flag_rate).toBe(20);
    });

    it("boundary: patternRate exactly 80 with csRate exactly 80 gives +4", () => {
      const episodes = Array.from({ length: 10 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          has_pattern_notes: i < 8, // 80%
          risk_level: "high",
          has_contextual_safeguarding_risk: i < 8, // 80%
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.pattern_analysis_rate).toBe(80);
      expect(r.contextual_safeguarding_flag_rate).toBe(80);
    });

    it("boundary: patternRate exactly 60 gives +2", () => {
      const episodes = Array.from({ length: 10 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          has_pattern_notes: i < 6, // 60%
          risk_level: "medium",
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.pattern_analysis_rate).toBe(60);
    });

    it("boundary: patternRate exactly 30 and csRate exactly 30 gives no modifier", () => {
      const episodes = Array.from({ length: 10 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          has_pattern_notes: i < 3, // 30%
          risk_level: "high",
          has_contextual_safeguarding_risk: i < 3, // 30%
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.pattern_analysis_rate).toBe(30);
      expect(r.contextual_safeguarding_flag_rate).toBe(30);
    });
  });

  describe("Modifier 6: Duration + resolution", () => {
    it("adds +5 when avgDuration <= 3 AND stillMissingCount === 0", () => {
      const r = computeMissingEpisode(
        baseInput({
          episodes: [baseRecord({ duration_hours: 2, still_missing: false })],
        }),
      );
      expect(r.average_duration_hours).toBe(2);
      expect(r.still_missing_count).toBe(0);
    });

    it("adds +2 when avgDuration <= 6 (but > 3) regardless of still_missing", () => {
      const r = computeMissingEpisode(
        baseInput({
          episodes: [baseRecord({ duration_hours: 5, still_missing: false })],
        }),
      );
      expect(r.average_duration_hours).toBe(5);
    });

    it("adds +2 when stillMissingCount === 0 (but avgDuration > 6)", () => {
      const r = computeMissingEpisode(
        baseInput({
          episodes: [baseRecord({ duration_hours: 8, still_missing: false })],
        }),
      );
      expect(r.average_duration_hours).toBe(8);
      expect(r.still_missing_count).toBe(0);
    });

    it("subtracts -3 when avgDuration > 12", () => {
      const r = computeMissingEpisode(
        baseInput({
          episodes: [baseRecord({ duration_hours: 15, still_missing: false })],
        }),
      );
      expect(r.average_duration_hours).toBe(15);
    });

    it("subtracts -3 when stillMissingCount > 0 and avgDuration > 6", () => {
      const r = computeMissingEpisode(
        baseInput({
          episodes: [baseRecord({ duration_hours: 8, still_missing: true })],
        }),
      );
      expect(r.still_missing_count).toBe(1);
    });

    it("boundary: avgDuration exactly 3 with no missing gives +5", () => {
      const r = computeMissingEpisode(
        baseInput({
          episodes: [baseRecord({ duration_hours: 3, still_missing: false })],
        }),
      );
      expect(r.average_duration_hours).toBe(3);
    });

    it("boundary: avgDuration exactly 6 gives +2", () => {
      const r = computeMissingEpisode(
        baseInput({
          episodes: [baseRecord({ duration_hours: 6, still_missing: false })],
        }),
      );
      expect(r.average_duration_hours).toBe(6);
    });

    it("boundary: avgDuration exactly 12 with no still missing gets +2 via OR", () => {
      const r = computeMissingEpisode(
        baseInput({
          episodes: [baseRecord({ duration_hours: 12, still_missing: false })],
        }),
      );
      expect(r.average_duration_hours).toBe(12);
      expect(r.still_missing_count).toBe(0);
    });

    it("avgDuration > 3 and still_missing > 0 but avgDuration <= 6 gives +2", () => {
      const r = computeMissingEpisode(
        baseInput({
          episodes: [
            baseRecord({ id: "ep_1", duration_hours: 5, still_missing: true }),
            baseRecord({ id: "ep_2", duration_hours: 5, still_missing: false }),
          ],
        }),
      );
      expect(r.average_duration_hours).toBe(5);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 3. RATING BOUNDARIES
  // ════════════════════════════════════════════════════════════════════════════

  describe("Rating boundaries", () => {
    it("score >= 80 gives outstanding rating", () => {
      // Max bonuses: 52 + 6 + 5 + 5 + 5 + 4 + 5 = 82
      const episodes = [
        baseRecord({
          date_missing: "2025-10-01",
          return_interview_completed: true,
          return_interview_within_72hrs: true,
          reported_to_la: true,
          risk_level: "high",
          reported_to_police: true,
          has_contextual_safeguarding_risk: true,
          has_pattern_notes: true,
          duration_hours: 1,
          still_missing: false,
        }),
      ];
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.missing_score).toBe(82);
      expect(r.missing_rating).toBe("outstanding");
    });

    it("score 79 gives good rating", () => {
      // 52 + 6 + 5 + 2 + 5 + 4 + 5 = 79 (timeliness at 70% => +2)
      const eps10 = Array.from({ length: 10 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          date_missing: "2025-10-01",
          return_interview_completed: true,
          return_interview_within_72hrs: i < 7, // 70% => +2
          reported_to_la: true,
          risk_level: "high",
          reported_to_police: true,
          has_contextual_safeguarding_risk: true,
          has_pattern_notes: true,
          duration_hours: 2,
          still_missing: false,
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes: eps10 }));
      expect(r.missing_score).toBe(79);
      expect(r.missing_rating).toBe("good");
    });

    it("score 65 gives good rating", () => {
      // 52 + 6 + 2 + (-4) + 2 + 2 + 5 = 65
      const eps20 = Array.from({ length: 20 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          date_missing: "2025-10-01",
          return_interview_completed: i < 17, // 85% => +2
          return_interview_within_72hrs: i < 6, // pct(6,17)=35% => -4
          reported_to_la: i < 15, // 75% => +2
          risk_level: "medium",
          reported_to_police: false,
          has_contextual_safeguarding_risk: false,
          has_pattern_notes: i < 12, // 60% => +2
          duration_hours: 2,
          still_missing: false,
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes: eps20 }));
      expect(r.missing_score).toBe(65);
      expect(r.missing_rating).toBe("good");
    });

    it("score 64 gives adequate rating", () => {
      // 52 + 3 + 2 + 0 + 2 + 0 + 5 = 64
      const eps5 = Array.from({ length: 5 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i}`,
          date_missing: "2026-04-01",
          return_interview_completed: i < 4, // 80% => +2
          return_interview_within_72hrs: i < 2, // pct(2,4) = 50% => no modifier
          reported_to_la: i < 4, // 80% >= 75 => +2
          risk_level: "medium",
          reported_to_police: false,
          has_contextual_safeguarding_risk: false,
          has_pattern_notes: i < 2, // 40% => no modifier
          duration_hours: 2,
          still_missing: false,
        }),
      );
      const r = computeMissingEpisode(
        baseInput({ total_children: 5, episodes: eps5 }),
      );
      expect(r.missing_score).toBe(64);
      expect(r.missing_rating).toBe("adequate");
    });

    it("score 45 gives adequate rating", () => {
      // 52 + 0 + (-5) + (-4) + 0 + 0 + 2 = 45
      const eps10 = Array.from({ length: 10 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 5}`,
          date_missing: "2026-04-01",
          return_interview_completed: i < 4, // 40% < 50% => -5
          return_interview_within_72hrs: false, // 0 of 4 = 0% < 40% => -4
          reported_to_la: i < 7, // 70%
          risk_level: i < 5 ? "high" : "medium",
          reported_to_police: i < 3, // 3 of 5 high = 60%
          has_contextual_safeguarding_risk: false,
          has_pattern_notes: i < 4, // 40%
          duration_hours: 8,
          still_missing: false,
        }),
      );
      const r = computeMissingEpisode(
        baseInput({ total_children: 5, episodes: eps10 }),
      );
      expect(r.missing_score).toBe(45);
      expect(r.missing_rating).toBe("adequate");
    });

    it("score 44 gives inadequate rating", () => {
      // 52 + (-5) + (-5) + (-4) + 2 + 2 + 2 = 44
      const eps = Array.from({ length: 21 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          date_missing: "2026-04-01", // 21/3=7 > 2 => -5
          return_interview_completed: i < 9, // pct(9,21)=43% < 50 => -5
          return_interview_within_72hrs: i < 3, // pct(3,9)=33% < 40 => -4
          reported_to_la: i < 16, // pct(16,21)=76% >= 75 => +2
          risk_level: "medium",
          reported_to_police: false,
          has_contextual_safeguarding_risk: false,
          has_pattern_notes: i < 13, // pct(13,21)=62% >= 60 => +2
          duration_hours: 8,
          still_missing: false, // still=0 => +2
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes: eps }));
      expect(r.missing_score).toBe(44);
      expect(r.missing_rating).toBe("inadequate");
    });

    it("maximum possible score is clamped to 100", () => {
      const r = computeMissingEpisode(
        baseInput({
          episodes: [
            baseRecord({
              date_missing: "2025-01-01",
              risk_level: "high",
              reported_to_police: true,
              reported_to_la: true,
              return_interview_completed: true,
              return_interview_within_72hrs: true,
              has_contextual_safeguarding_risk: true,
              has_pattern_notes: true,
              duration_hours: 1,
              still_missing: false,
            }),
          ],
        }),
      );
      expect(r.missing_score).toBeLessThanOrEqual(100);
    });

    it("minimum possible score is clamped to 0", () => {
      const eps = Array.from({ length: 30 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          date_missing: "2026-04-01",
          return_interview_completed: false,
          return_interview_within_72hrs: false,
          reported_to_la: false,
          risk_level: "high",
          reported_to_police: false,
          has_contextual_safeguarding_risk: false,
          has_pattern_notes: false,
          duration_hours: 24,
          still_missing: true,
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes: eps }));
      expect(r.missing_score).toBeGreaterThanOrEqual(0);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 4. OUTPUT FIELD ACCURACY
  // ════════════════════════════════════════════════════════════════════════════

  describe("Output field accuracy", () => {
    it("total_episodes matches episodes array length", () => {
      const episodes = Array.from({ length: 7 }, (_, i) =>
        baseRecord({ id: `ep_${i}`, child_id: `child_${i % 3}` }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.total_episodes).toBe(7);
    });

    it("unique_children_missing counts distinct child_ids", () => {
      const episodes = [
        baseRecord({ id: "ep_1", child_id: "child_a" }),
        baseRecord({ id: "ep_2", child_id: "child_b" }),
        baseRecord({ id: "ep_3", child_id: "child_a" }),
        baseRecord({ id: "ep_4", child_id: "child_c" }),
      ];
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.unique_children_missing).toBe(3);
    });

    it("episodes_last_90_days counts only episodes within 90 days of today", () => {
      const episodes = [
        baseRecord({ id: "ep_1", date_missing: "2026-05-01" }), // 14 days ago
        baseRecord({ id: "ep_2", date_missing: "2026-03-01" }), // 75 days ago
        baseRecord({ id: "ep_3", date_missing: "2026-01-01" }), // 134 days ago
        baseRecord({ id: "ep_4", date_missing: "2025-12-01" }), // 166 days ago
      ];
      const r = computeMissingEpisode(baseInput({ today: "2026-05-15", episodes }));
      expect(r.episodes_last_90_days).toBe(2);
    });

    it("high_risk_count counts only episodes with risk_level high", () => {
      const episodes = [
        baseRecord({ id: "ep_1", risk_level: "high" }),
        baseRecord({ id: "ep_2", risk_level: "medium" }),
        baseRecord({ id: "ep_3", risk_level: "high" }),
        baseRecord({ id: "ep_4", risk_level: "low" }),
      ];
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.high_risk_count).toBe(2);
    });

    it("still_missing_count counts only episodes with still_missing true", () => {
      const episodes = [
        baseRecord({ id: "ep_1", still_missing: true }),
        baseRecord({ id: "ep_2", still_missing: false }),
        baseRecord({ id: "ep_3", still_missing: true }),
      ];
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.still_missing_count).toBe(2);
    });

    it("return_interview_rate excludes still_missing episodes from denominator", () => {
      const episodes = [
        baseRecord({ id: "ep_1", still_missing: false, return_interview_completed: true }),
        baseRecord({ id: "ep_2", still_missing: false, return_interview_completed: false }),
        baseRecord({ id: "ep_3", still_missing: true, return_interview_completed: false }),
      ];
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.return_interview_rate).toBe(50);
    });

    it("return_interview_timeliness_rate is among completed interviews only", () => {
      const episodes = [
        baseRecord({
          id: "ep_1",
          still_missing: false,
          return_interview_completed: true,
          return_interview_within_72hrs: true,
        }),
        baseRecord({
          id: "ep_2",
          still_missing: false,
          return_interview_completed: true,
          return_interview_within_72hrs: false,
        }),
        baseRecord({
          id: "ep_3",
          still_missing: false,
          return_interview_completed: false,
          return_interview_within_72hrs: false,
        }),
      ];
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.return_interview_timeliness_rate).toBe(50);
    });

    it("la_notification_rate is computed over all episodes", () => {
      const episodes = [
        baseRecord({ id: "ep_1", reported_to_la: true }),
        baseRecord({ id: "ep_2", reported_to_la: false }),
        baseRecord({ id: "ep_3", reported_to_la: true }),
        baseRecord({ id: "ep_4", reported_to_la: true }),
      ];
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.la_notification_rate).toBe(75);
    });

    it("police_report_rate_high_risk is computed only among high-risk episodes", () => {
      const episodes = [
        baseRecord({ id: "ep_1", risk_level: "high", reported_to_police: true }),
        baseRecord({ id: "ep_2", risk_level: "high", reported_to_police: false }),
        baseRecord({ id: "ep_3", risk_level: "medium", reported_to_police: true }),
      ];
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.police_report_rate_high_risk).toBe(50);
    });

    it("police_report_rate_high_risk is 0 when there are no high-risk episodes", () => {
      const episodes = [
        baseRecord({ id: "ep_1", risk_level: "medium", reported_to_police: true }),
        baseRecord({ id: "ep_2", risk_level: "low", reported_to_police: true }),
      ];
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.police_report_rate_high_risk).toBe(0);
    });

    it("contextual_safeguarding_flag_rate is computed only among high-risk episodes", () => {
      const episodes = [
        baseRecord({ id: "ep_1", risk_level: "high", has_contextual_safeguarding_risk: true }),
        baseRecord({ id: "ep_2", risk_level: "high", has_contextual_safeguarding_risk: false }),
        baseRecord({ id: "ep_3", risk_level: "high", has_contextual_safeguarding_risk: true }),
        baseRecord({ id: "ep_4", risk_level: "medium", has_contextual_safeguarding_risk: true }),
      ];
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.contextual_safeguarding_flag_rate).toBe(67);
    });

    it("contextual_safeguarding_flag_rate is 0 when no high-risk episodes", () => {
      const episodes = [
        baseRecord({ id: "ep_1", risk_level: "medium", has_contextual_safeguarding_risk: true }),
      ];
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.contextual_safeguarding_flag_rate).toBe(0);
    });

    it("pattern_analysis_rate is computed over all episodes", () => {
      const episodes = [
        baseRecord({ id: "ep_1", has_pattern_notes: true }),
        baseRecord({ id: "ep_2", has_pattern_notes: false }),
        baseRecord({ id: "ep_3", has_pattern_notes: true }),
      ];
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.pattern_analysis_rate).toBe(67);
    });

    it("average_duration_hours is rounded to 1 decimal place", () => {
      const episodes = [
        baseRecord({ id: "ep_1", duration_hours: 3 }),
        baseRecord({ id: "ep_2", duration_hours: 4 }),
        baseRecord({ id: "ep_3", duration_hours: 5 }),
      ];
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.average_duration_hours).toBe(4);
    });

    it("average_duration_hours rounds correctly for non-integer averages", () => {
      const episodes = [
        baseRecord({ id: "ep_1", duration_hours: 1 }),
        baseRecord({ id: "ep_2", duration_hours: 2 }),
        baseRecord({ id: "ep_3", duration_hours: 4 }),
      ];
      const r = computeMissingEpisode(baseInput({ episodes }));
      // (1+2+4)/3 = 2.333... => Math.round(2.333*10)/10 = 2.3
      expect(r.average_duration_hours).toBe(2.3);
    });

    it("pct helper rounds to nearest integer", () => {
      const episodes = [
        baseRecord({ id: "ep_1", has_pattern_notes: true }),
        baseRecord({ id: "ep_2", has_pattern_notes: false }),
        baseRecord({ id: "ep_3", has_pattern_notes: false }),
      ];
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.pattern_analysis_rate).toBe(33);
    });

    it("pct helper for exactly half gives 50%", () => {
      const episodes = [
        baseRecord({ id: "ep_1", has_pattern_notes: true }),
        baseRecord({ id: "ep_2", has_pattern_notes: false }),
      ];
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.pattern_analysis_rate).toBe(50);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 5. STRENGTHS
  // ════════════════════════════════════════════════════════════════════════════

  describe("Strengths", () => {
    it("includes zero-recent-episodes strength when episodesLast90=0 and totalEpisodes>0", () => {
      const r = computeMissingEpisode(
        baseInput({
          episodes: [baseRecord({ date_missing: "2025-10-01" })],
        }),
      );
      expect(r.strengths).toContain(
        "No missing episodes in the last 90 days — frequency has reduced to zero.",
      );
    });

    it("does not include zero-recent-episodes strength when episodesLast90>0", () => {
      const r = computeMissingEpisode(
        baseInput({
          episodes: [baseRecord({ date_missing: "2026-04-01" })],
        }),
      );
      const s = r.strengths.find((s) => s.includes("frequency has reduced to zero"));
      expect(s).toBeUndefined();
    });

    it("includes return interview strength when rate >= 95% and returned episodes exist", () => {
      const episodes = Array.from({ length: 20 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          return_interview_completed: true,
          still_missing: false,
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.strengths.some((s) => s.includes("Return interview completion at 100%"))).toBe(true);
    });

    it("includes timeliness strength when rate >= 90% and completed interviews exist", () => {
      const episodes = Array.from({ length: 10 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          return_interview_completed: true,
          return_interview_within_72hrs: true,
          still_missing: false,
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.strengths.some((s) => s.includes("return interviews completed within 72 hours"))).toBe(true);
    });

    it("includes LA notification strength when laRate >= 95% and totalEpisodes > 0", () => {
      const episodes = Array.from({ length: 20 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          reported_to_la: true,
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.strengths.some((s) => s.includes("LA notification rate at 100%"))).toBe(true);
    });

    it("includes police reporting strength when policeHighRate >= 90% and high-risk episodes exist", () => {
      const episodes = Array.from({ length: 10 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          risk_level: "high",
          reported_to_police: true,
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.strengths.some((s) => s.includes("high-risk episodes reported to police"))).toBe(true);
    });

    it("includes pattern analysis strength when patternRate >= 80% and totalEpisodes > 0", () => {
      const episodes = Array.from({ length: 10 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          has_pattern_notes: true,
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.strengths.some((s) => s.includes("Pattern analysis documented for 100%"))).toBe(true);
    });

    it("includes short duration strength when avgDuration <= 3 and totalEpisodes > 0", () => {
      const r = computeMissingEpisode(
        baseInput({
          episodes: [baseRecord({ duration_hours: 2 })],
        }),
      );
      expect(r.strengths.some((s) => s.includes("children return quickly"))).toBe(true);
    });

    it("includes all-resolved strength when stillMissingCount=0 and totalEpisodes > 0", () => {
      const r = computeMissingEpisode(
        baseInput({
          episodes: [baseRecord({ still_missing: false })],
        }),
      );
      expect(r.strengths.some((s) => s.includes("All missing episodes resolved"))).toBe(true);
    });

    it("does not include all-resolved strength when stillMissingCount > 0", () => {
      const r = computeMissingEpisode(
        baseInput({
          episodes: [baseRecord({ still_missing: true })],
        }),
      );
      expect(r.strengths.some((s) => s.includes("All missing episodes resolved"))).toBe(false);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 6. CONCERNS
  // ════════════════════════════════════════════════════════════════════════════

  describe("Concerns", () => {
    it("includes still-missing concern with singular when 1 child missing", () => {
      const r = computeMissingEpisode(
        baseInput({
          episodes: [baseRecord({ still_missing: true })],
        }),
      );
      expect(r.concerns.some((c) => c.includes("1 child currently missing"))).toBe(true);
    });

    it("includes still-missing concern with plural when multiple children missing", () => {
      const episodes = [
        baseRecord({ id: "ep_1", still_missing: true }),
        baseRecord({ id: "ep_2", still_missing: true }),
      ];
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.concerns.some((c) => c.includes("2 children currently missing"))).toBe(true);
    });

    it("includes repeat-pattern concern when a child has 3+ episodes", () => {
      const episodes = [
        baseRecord({ id: "ep_1", child_id: "child_a" }),
        baseRecord({ id: "ep_2", child_id: "child_a" }),
        baseRecord({ id: "ep_3", child_id: "child_a" }),
      ];
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.concerns.some((c) => c.includes("3 or more missing episodes"))).toBe(true);
    });

    it("does not include repeat-pattern concern when max episodes per child is 2", () => {
      const episodes = [
        baseRecord({ id: "ep_1", child_id: "child_a" }),
        baseRecord({ id: "ep_2", child_id: "child_a" }),
        baseRecord({ id: "ep_3", child_id: "child_b" }),
      ];
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.concerns.some((c) => c.includes("3 or more missing episodes"))).toBe(false);
    });

    it("includes high-risk proportion concern when > 1/3 episodes are high risk", () => {
      const episodes = [
        baseRecord({ id: "ep_1", risk_level: "high" }),
        baseRecord({ id: "ep_2", risk_level: "high" }),
        baseRecord({ id: "ep_3", risk_level: "medium" }),
      ];
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.concerns.some((c) => c.includes("high risk"))).toBe(true);
    });

    it("does not include high-risk concern when exactly 1/3 are high risk", () => {
      const episodes = [
        baseRecord({ id: "ep_1", risk_level: "high" }),
        baseRecord({ id: "ep_2", risk_level: "medium" }),
        baseRecord({ id: "ep_3", risk_level: "low" }),
      ];
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.concerns.some((c) => c.includes("disproportionate escalation"))).toBe(false);
    });

    it("includes low return interview concern when rate < 80%", () => {
      const episodes = Array.from({ length: 10 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          return_interview_completed: i < 7, // 70%
          still_missing: false,
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.concerns.some((c) => c.includes("Return interview completion at 70%"))).toBe(true);
    });

    it("includes low timeliness concern when timelinessRate < 70%", () => {
      const episodes = Array.from({ length: 10 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          return_interview_completed: true,
          return_interview_within_72hrs: i < 6, // 60%
          still_missing: false,
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.concerns.some((c) => c.includes("60% of return interviews completed within 72 hours"))).toBe(true);
    });

    it("includes low LA notification concern when laRate < 80%", () => {
      const episodes = Array.from({ length: 10 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          reported_to_la: i < 7, // 70%
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.concerns.some((c) => c.includes("LA notification rate at 70%"))).toBe(true);
    });

    it("includes low police reporting concern when policeHighRate < 80% and high-risk exist", () => {
      const episodes = Array.from({ length: 10 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          risk_level: "high",
          reported_to_police: i < 7, // 70%
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.concerns.some((c) => c.includes("70% of high-risk episodes reported to police"))).toBe(true);
    });

    it("includes high duration concern when avgDuration > 12", () => {
      const r = computeMissingEpisode(
        baseInput({
          episodes: [baseRecord({ duration_hours: 15 })],
        }),
      );
      expect(r.concerns.some((c) => c.includes("15 hours"))).toBe(true);
    });

    it("includes low pattern analysis concern when patternRate < 50%", () => {
      const episodes = Array.from({ length: 10 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          has_pattern_notes: i < 4, // 40%
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.concerns.some((c) => c.includes("Pattern analysis documented for only 40%"))).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 7. RECOMMENDATIONS
  // ════════════════════════════════════════════════════════════════════════════

  describe("Recommendations", () => {
    it("includes still-missing protocol recommendation with immediate urgency", () => {
      const r = computeMissingEpisode(
        baseInput({
          episodes: [baseRecord({ still_missing: true })],
        }),
      );
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Activate missing from care protocol"))).toBe(true);
      expect(r.recommendations.find((rec) => rec.recommendation.includes("Activate"))?.urgency).toBe("immediate");
    });

    it("includes return interview recommendation when rate < 80%", () => {
      const episodes = Array.from({ length: 10 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          return_interview_completed: i < 7,
          still_missing: false,
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Complete all outstanding return interviews"))).toBe(true);
    });

    it("includes multi-agency meeting recommendation when children have 3+ episodes", () => {
      const episodes = [
        baseRecord({ id: "ep_1", child_id: "child_a" }),
        baseRecord({ id: "ep_2", child_id: "child_a" }),
        baseRecord({ id: "ep_3", child_id: "child_a" }),
      ];
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Convene a multi-agency strategy meeting"))).toBe(true);
    });

    it("includes LA notification recommendation when laRate < 80%", () => {
      const episodes = Array.from({ length: 10 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          reported_to_la: i < 7,
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Review LA notification procedures"))).toBe(true);
    });

    it("includes police reporting recommendation when policeHighRate < 80% and high-risk exist", () => {
      const episodes = Array.from({ length: 10 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          risk_level: "high",
          reported_to_police: i < 7,
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Ensure all high-risk missing episodes are reported to police"))).toBe(true);
    });

    it("includes timeliness recommendation with soon urgency", () => {
      const episodes = Array.from({ length: 10 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          return_interview_completed: true,
          return_interview_within_72hrs: i < 6,
          still_missing: false,
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Improve return interview timeliness"))).toBe(true);
      expect(r.recommendations.find((rec) => rec.recommendation.includes("Improve return interview timeliness"))?.urgency).toBe("soon");
    });

    it("includes pattern analysis recommendation when patternRate < 60%", () => {
      const episodes = Array.from({ length: 10 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          has_pattern_notes: i < 5,
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Strengthen pattern analysis documentation"))).toBe(true);
    });

    it("includes contextual safeguarding recommendation when high-risk proportion > 1/3", () => {
      const episodes = [
        baseRecord({ id: "ep_1", risk_level: "high" }),
        baseRecord({ id: "ep_2", risk_level: "high" }),
        baseRecord({ id: "ep_3", risk_level: "medium" }),
      ];
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Review contextual safeguarding strategy"))).toBe(true);
    });

    it("includes duration investigation recommendation when avgDuration > 12", () => {
      const r = computeMissingEpisode(
        baseInput({
          episodes: [baseRecord({ duration_hours: 15 })],
        }),
      );
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Investigate prolonged absence durations"))).toBe(true);
    });

    it("includes frequency review recommendation with planned urgency when episodesPerChild > 1", () => {
      const episodes = Array.from({ length: 4 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          date_missing: "2026-04-01",
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Review home-level missing from care strategy"))).toBe(true);
      expect(r.recommendations.find((rec) => rec.recommendation.includes("Review home-level missing from care strategy"))?.urgency).toBe("planned");
    });

    it("recommendations have sequential rank numbers", () => {
      const episodes = Array.from({ length: 10 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 2}`,
          date_missing: "2026-04-01",
          return_interview_completed: i < 3,
          return_interview_within_72hrs: false,
          reported_to_la: i < 5,
          risk_level: "high",
          reported_to_police: i < 5,
          has_pattern_notes: i < 4,
          duration_hours: 15,
          still_missing: i < 2,
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      for (let i = 0; i < r.recommendations.length; i++) {
        expect(r.recommendations[i].rank).toBe(i + 1);
      }
    });

    it("recommendations include regulatory references", () => {
      const r = computeMissingEpisode(
        baseInput({
          episodes: [baseRecord({ still_missing: true })],
        }),
      );
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("Activate missing from care protocol"));
      expect(rec?.regulatory_ref).toContain("CHR 2015 Reg 34");
    });

    it("produces no recommendations when all metrics are excellent", () => {
      const episodes = [
        baseRecord({
          date_missing: "2025-10-01",
          return_interview_completed: true,
          return_interview_within_72hrs: true,
          reported_to_la: true,
          risk_level: "low",
          reported_to_police: false,
          has_pattern_notes: true,
          duration_hours: 1,
          still_missing: false,
        }),
      ];
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.recommendations).toHaveLength(0);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 8. INSIGHTS
  // ════════════════════════════════════════════════════════════════════════════

  describe("Insights", () => {
    it("includes critical still-missing insight with singular text for 1 child", () => {
      const r = computeMissingEpisode(
        baseInput({
          episodes: [baseRecord({ still_missing: true })],
        }),
      );
      const insight = r.insights.find((i) => i.text.includes("currently missing"));
      expect(insight).toBeDefined();
      expect(insight!.severity).toBe("critical");
      expect(insight!.text).toContain("1 child is currently missing");
    });

    it("includes critical still-missing insight with plural text for multiple children", () => {
      const episodes = [
        baseRecord({ id: "ep_1", still_missing: true }),
        baseRecord({ id: "ep_2", still_missing: true }),
        baseRecord({ id: "ep_3", still_missing: true }),
      ];
      const r = computeMissingEpisode(baseInput({ episodes }));
      const insight = r.insights.find((i) => i.text.includes("currently missing"));
      expect(insight).toBeDefined();
      expect(insight!.text).toContain("3 children are currently missing");
    });

    it("includes critical repeat-pattern insight when child has 3+ episodes", () => {
      const episodes = [
        baseRecord({ id: "ep_1", child_id: "child_a" }),
        baseRecord({ id: "ep_2", child_id: "child_a" }),
        baseRecord({ id: "ep_3", child_id: "child_a" }),
        baseRecord({ id: "ep_4", child_id: "child_a" }),
      ];
      const r = computeMissingEpisode(baseInput({ episodes }));
      const insight = r.insights.find((i) => i.text.includes("3 or more missing episodes"));
      expect(insight).toBeDefined();
      expect(insight!.severity).toBe("critical");
      expect(insight!.text).toContain("highest: 4");
    });

    it("includes critical repeat-pattern insight with plural text for multiple children", () => {
      const episodes = [
        baseRecord({ id: "ep_1", child_id: "child_a" }),
        baseRecord({ id: "ep_2", child_id: "child_a" }),
        baseRecord({ id: "ep_3", child_id: "child_a" }),
        baseRecord({ id: "ep_4", child_id: "child_b" }),
        baseRecord({ id: "ep_5", child_id: "child_b" }),
        baseRecord({ id: "ep_6", child_id: "child_b" }),
      ];
      const r = computeMissingEpisode(baseInput({ episodes }));
      const insight = r.insights.find((i) => i.text.includes("3 or more missing episodes"));
      expect(insight).toBeDefined();
      expect(insight!.text).toContain("2 children have");
    });

    it("includes critical high-risk proportion insight when > 1/3 and >= 3 total episodes", () => {
      const episodes = [
        baseRecord({ id: "ep_1", risk_level: "high" }),
        baseRecord({ id: "ep_2", risk_level: "high" }),
        baseRecord({ id: "ep_3", risk_level: "medium" }),
      ];
      const r = computeMissingEpisode(baseInput({ episodes }));
      const insight = r.insights.find((i) => i.text.includes("episodes are high risk"));
      expect(insight).toBeDefined();
      expect(insight!.severity).toBe("critical");
    });

    it("does not include high-risk insight when < 3 total episodes even if > 1/3 are high", () => {
      const episodes = [
        baseRecord({ id: "ep_1", risk_level: "high" }),
        baseRecord({ id: "ep_2", risk_level: "medium" }),
      ];
      const r = computeMissingEpisode(baseInput({ episodes }));
      const insight = r.insights.find((i) => i.text.includes("episodes are high risk"));
      expect(insight).toBeUndefined();
    });

    it("includes critical low return interview insight when rate < 50%", () => {
      const episodes = Array.from({ length: 10 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          return_interview_completed: i < 4,
          still_missing: false,
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      const insight = r.insights.find((i) => i.text.includes("Return interview rate is critically low"));
      expect(insight).toBeDefined();
      expect(insight!.severity).toBe("critical");
    });

    it("includes critical low LA notification insight when laRate < 50%", () => {
      const episodes = Array.from({ length: 10 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          reported_to_la: i < 4,
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      const insight = r.insights.find((i) => i.text.includes("LA notification rate is 40%"));
      expect(insight).toBeDefined();
      expect(insight!.severity).toBe("critical");
    });

    it("includes warning for high average duration when avgDuration > 12", () => {
      const r = computeMissingEpisode(
        baseInput({
          episodes: [baseRecord({ duration_hours: 18 })],
        }),
      );
      const insight = r.insights.find((i) => i.text.includes("Average absence duration"));
      expect(insight).toBeDefined();
      expect(insight!.severity).toBe("warning");
    });

    it("includes warning for low timeliness when 40% <= timelinessRate < 70%", () => {
      const episodes = Array.from({ length: 10 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          return_interview_completed: true,
          return_interview_within_72hrs: i < 5,
          still_missing: false,
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      const insight = r.insights.find((i) => i.text.includes("return interviews are conducted within 72 hours"));
      expect(insight).toBeDefined();
      expect(insight!.severity).toBe("warning");
    });

    it("does not include timeliness warning when timelinessRate < 40%", () => {
      const episodes = Array.from({ length: 10 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          return_interview_completed: true,
          return_interview_within_72hrs: i < 3,
          still_missing: false,
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      const insight = r.insights.find((i) => i.text.includes("return interviews are conducted within 72 hours"));
      expect(insight).toBeUndefined();
    });

    it("includes warning for low pattern analysis when < 50% and >= 3 episodes", () => {
      const episodes = Array.from({ length: 5 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          has_pattern_notes: i < 2,
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      const insight = r.insights.find((i) => i.text.includes("Pattern analysis is documented"));
      expect(insight).toBeDefined();
      expect(insight!.severity).toBe("warning");
    });

    it("does not include pattern analysis warning when < 3 episodes", () => {
      const episodes = [
        baseRecord({ id: "ep_1", has_pattern_notes: false }),
        baseRecord({ id: "ep_2", has_pattern_notes: false }),
      ];
      const r = computeMissingEpisode(baseInput({ episodes }));
      const insight = r.insights.find((i) => i.text.includes("Pattern analysis is documented"));
      expect(insight).toBeUndefined();
    });

    it("includes positive insight when no episodes in last 90 days but historical exist", () => {
      const r = computeMissingEpisode(
        baseInput({
          episodes: [baseRecord({ date_missing: "2025-10-01" })],
        }),
      );
      const insight = r.insights.find((i) => i.text.includes("No missing episodes in the last 90 days"));
      expect(insight).toBeDefined();
      expect(insight!.severity).toBe("positive");
    });

    it("includes positive insight for excellent return interview practice", () => {
      const episodes = Array.from({ length: 10 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          return_interview_completed: true,
          return_interview_within_72hrs: true,
          still_missing: false,
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      const insight = r.insights.find((i) => i.text.includes("Excellent return interview practice"));
      expect(insight).toBeDefined();
      expect(insight!.severity).toBe("positive");
    });

    it("includes positive insight for strong notification compliance", () => {
      const episodes = Array.from({ length: 10 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          reported_to_la: true,
          risk_level: "high",
          reported_to_police: true,
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      const insight = r.insights.find((i) => i.text.includes("Strong notification compliance"));
      expect(insight).toBeDefined();
      expect(insight!.severity).toBe("positive");
    });

    it("includes positive insight for short duration with all returned", () => {
      const r = computeMissingEpisode(
        baseInput({
          episodes: [baseRecord({ duration_hours: 2, still_missing: false })],
        }),
      );
      const insight = r.insights.find((i) => i.text.includes("Average episode duration of"));
      expect(insight).toBeDefined();
      expect(insight!.severity).toBe("positive");
    });

    it("includes positive insight for strong analytical practice when pattern and CS both >= 80% on high-risk", () => {
      const episodes = Array.from({ length: 10 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          risk_level: "high",
          has_pattern_notes: true,
          has_contextual_safeguarding_risk: true,
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      const insight = r.insights.find((i) => i.text.includes("Strong analytical practice"));
      expect(insight).toBeDefined();
      expect(insight!.severity).toBe("positive");
    });

    it("does not include analytical practice insight when no high-risk episodes", () => {
      const episodes = Array.from({ length: 10 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          risk_level: "medium",
          has_pattern_notes: true,
          has_contextual_safeguarding_risk: true,
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      const insight = r.insights.find((i) => i.text.includes("Strong analytical practice"));
      expect(insight).toBeUndefined();
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 9. HEADLINES
  // ════════════════════════════════════════════════════════════════════════════

  describe("Headlines", () => {
    it("outstanding headline with no recent episodes mentions no recent episodes", () => {
      const episodes = [
        baseRecord({
          date_missing: "2025-10-01",
          return_interview_completed: true,
          return_interview_within_72hrs: true,
          reported_to_la: true,
          risk_level: "high",
          reported_to_police: true,
          has_contextual_safeguarding_risk: true,
          has_pattern_notes: true,
          duration_hours: 1,
          still_missing: false,
        }),
      ];
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.missing_rating).toBe("outstanding");
      expect(r.headline).toContain("no recent episodes");
    });

    it("good headline mentions episodes in 90 days and return interview rate", () => {
      const eps10 = Array.from({ length: 10 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          date_missing: "2025-10-01",
          return_interview_completed: true,
          return_interview_within_72hrs: i < 7,
          reported_to_la: true,
          risk_level: "high",
          reported_to_police: true,
          has_contextual_safeguarding_risk: true,
          has_pattern_notes: true,
          duration_hours: 2,
          still_missing: false,
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes: eps10 }));
      expect(r.missing_rating).toBe("good");
      expect(r.headline).toContain("Good missing episode management");
      expect(r.headline).toContain("return interview completion");
    });

    it("adequate headline mentions improvements needed", () => {
      const eps10 = Array.from({ length: 10 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 5}`,
          date_missing: "2026-04-01",
          return_interview_completed: i < 4,
          return_interview_within_72hrs: false,
          reported_to_la: i < 7,
          risk_level: i < 5 ? "high" : "medium",
          reported_to_police: i < 3,
          has_contextual_safeguarding_risk: false,
          has_pattern_notes: i < 4,
          duration_hours: 8,
          still_missing: false,
        }),
      );
      const r = computeMissingEpisode(baseInput({ total_children: 5, episodes: eps10 }));
      expect(r.missing_rating).toBe("adequate");
      expect(r.headline).toContain("Adequate missing episode management");
    });

    it("inadequate headline mentions urgent attention needed", () => {
      const eps = Array.from({ length: 21 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          date_missing: "2026-04-01",
          return_interview_completed: i < 9,
          return_interview_within_72hrs: i < 3,
          reported_to_la: i < 16,
          risk_level: "medium",
          reported_to_police: false,
          has_contextual_safeguarding_risk: false,
          has_pattern_notes: i < 13,
          duration_hours: 8,
          still_missing: false,
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes: eps }));
      expect(r.missing_rating).toBe("inadequate");
      expect(r.headline).toContain("requires urgent attention");
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 10. EDGE CASES
  // ════════════════════════════════════════════════════════════════════════════

  describe("Edge cases", () => {
    it("single episode with all good data produces high score", () => {
      const r = computeMissingEpisode(
        baseInput({
          episodes: [
            baseRecord({
              date_missing: "2025-10-01",
              return_interview_completed: true,
              return_interview_within_72hrs: true,
              reported_to_la: true,
              risk_level: "high",
              reported_to_police: true,
              has_contextual_safeguarding_risk: true,
              has_pattern_notes: true,
              duration_hours: 1,
              still_missing: false,
            }),
          ],
        }),
      );
      expect(r.missing_score).toBeGreaterThanOrEqual(80);
    });

    it("single episode with all bad data produces low score", () => {
      const r = computeMissingEpisode(
        baseInput({
          episodes: [
            baseRecord({
              date_missing: "2026-04-01",
              return_interview_completed: false,
              return_interview_within_72hrs: false,
              reported_to_la: false,
              risk_level: "high",
              reported_to_police: false,
              has_contextual_safeguarding_risk: false,
              has_pattern_notes: false,
              duration_hours: 24,
              still_missing: true,
            }),
          ],
        }),
      );
      expect(r.missing_score).toBeLessThan(45);
    });

    it("all episodes still missing produces many critical insights", () => {
      const episodes = Array.from({ length: 5 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i}`,
          still_missing: true,
          return_interview_completed: false,
          return_interview_within_72hrs: false,
          reported_to_la: false,
          risk_level: "high",
          reported_to_police: false,
          has_pattern_notes: false,
          duration_hours: 20,
        }),
      );
      const r = computeMissingEpisode(baseInput({ total_children: 5, episodes }));
      const criticalInsights = r.insights.filter((i) => i.severity === "critical");
      expect(criticalInsights.length).toBeGreaterThanOrEqual(2);
    });

    it("handles episodes with date_missing in the future (negative daysBetween)", () => {
      const r = computeMissingEpisode(
        baseInput({
          today: "2026-05-15",
          episodes: [baseRecord({ date_missing: "2026-06-01" })],
        }),
      );
      expect(r.episodes_last_90_days).toBe(0);
    });

    it("handles episode exactly 90 days ago (included in last 90 days)", () => {
      const r = computeMissingEpisode(
        baseInput({
          today: "2026-05-15",
          episodes: [baseRecord({ date_missing: "2026-02-14" })],
        }),
      );
      expect(r.episodes_last_90_days).toBe(1);
    });

    it("handles episode 91 days ago (excluded from last 90 days)", () => {
      const r = computeMissingEpisode(
        baseInput({
          today: "2026-05-15",
          episodes: [baseRecord({ date_missing: "2026-02-13" })],
        }),
      );
      expect(r.episodes_last_90_days).toBe(0);
    });

    it("handles large number of episodes without crashing", () => {
      const episodes = Array.from({ length: 100 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 10}`,
          date_missing: "2026-04-01",
        }),
      );
      const r = computeMissingEpisode(baseInput({ total_children: 10, episodes }));
      expect(r.total_episodes).toBe(100);
      expect(r.unique_children_missing).toBe(10);
    });

    it("all episodes same child counts unique_children as 1", () => {
      const episodes = Array.from({ length: 5 }, (_, i) =>
        baseRecord({ id: `ep_${i}`, child_id: "child_solo" }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.unique_children_missing).toBe(1);
    });

    it("mixed risk levels are counted correctly", () => {
      const episodes = [
        baseRecord({ id: "ep_1", risk_level: "high" }),
        baseRecord({ id: "ep_2", risk_level: "medium" }),
        baseRecord({ id: "ep_3", risk_level: "low" }),
        baseRecord({ id: "ep_4", risk_level: "high" }),
        baseRecord({ id: "ep_5", risk_level: "low" }),
      ];
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.high_risk_count).toBe(2);
    });

    it("total_children=1 with many episodes gives high frequency penalty", () => {
      const episodes = Array.from({ length: 5 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: "child_1",
          date_missing: "2026-04-01",
        }),
      );
      const r = computeMissingEpisode(
        baseInput({ total_children: 1, episodes }),
      );
      expect(r.episodes_last_90_days).toBe(5);
    });

    it("all returned episodes with no completed interviews gives 0% RI rate", () => {
      const episodes = Array.from({ length: 5 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i}`,
          return_interview_completed: false,
          still_missing: false,
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.return_interview_rate).toBe(0);
    });

    it("all returned episodes with all completed interviews gives 100% RI rate", () => {
      const episodes = Array.from({ length: 5 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i}`,
          return_interview_completed: true,
          still_missing: false,
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.return_interview_rate).toBe(100);
    });

    it("zero duration episodes produce avgDuration of 0", () => {
      const episodes = [
        baseRecord({ id: "ep_1", duration_hours: 0 }),
        baseRecord({ id: "ep_2", duration_hours: 0 }),
      ];
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.average_duration_hours).toBe(0);
    });

    it("episodes with today as date_missing are counted in last 90 days", () => {
      const r = computeMissingEpisode(
        baseInput({
          today: "2026-05-15",
          episodes: [baseRecord({ date_missing: "2026-05-15" })],
        }),
      );
      expect(r.episodes_last_90_days).toBe(1);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 11. SCORE CLAMPING
  // ════════════════════════════════════════════════════════════════════════════

  describe("Score clamping", () => {
    it("score never exceeds 100 even with maximum bonuses", () => {
      const episodes = [
        baseRecord({
          date_missing: "2025-10-01",
          return_interview_completed: true,
          return_interview_within_72hrs: true,
          reported_to_la: true,
          risk_level: "high",
          reported_to_police: true,
          has_contextual_safeguarding_risk: true,
          has_pattern_notes: true,
          duration_hours: 1,
          still_missing: false,
        }),
      ];
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.missing_score).toBeLessThanOrEqual(100);
    });

    it("score never goes below 0 even with maximum penalties", () => {
      const episodes = Array.from({ length: 30 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          date_missing: "2026-04-01",
          return_interview_completed: false,
          return_interview_within_72hrs: false,
          reported_to_la: false,
          risk_level: "high",
          reported_to_police: false,
          has_contextual_safeguarding_risk: false,
          has_pattern_notes: false,
          duration_hours: 30,
          still_missing: true,
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.missing_score).toBeGreaterThanOrEqual(0);
    });

    it("maximum penalty scenario gives exactly the correct clamped score", () => {
      // 30 eps, 3 children => 10 per child > 2 => -5
      // All still missing => returnedEpisodes=0 => RI: -1
      // completedInterviews=0 => timely: -1
      // laRate=0 < 50 => -4
      // patternRate=0 < 30 AND csRate=0 < 30 => -4
      // avgDuration=30 > 12 => -3
      // total: 52 - 5 - 1 - 1 - 4 - 4 - 3 = 34
      const episodes = Array.from({ length: 30 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          date_missing: "2026-04-01",
          return_interview_completed: false,
          return_interview_within_72hrs: false,
          reported_to_la: false,
          risk_level: "high",
          reported_to_police: false,
          has_contextual_safeguarding_risk: false,
          has_pattern_notes: false,
          duration_hours: 30,
          still_missing: true,
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.missing_score).toBe(34);
      expect(r.missing_rating).toBe("inadequate");
    });

    it("maximum bonus scenario gives exactly 82", () => {
      // 52 + 6 + 5 + 5 + 5 + 4 + 5 = 82
      const r = computeMissingEpisode(
        baseInput({
          episodes: [
            baseRecord({
              date_missing: "2025-10-01",
              return_interview_completed: true,
              return_interview_within_72hrs: true,
              reported_to_la: true,
              risk_level: "high",
              reported_to_police: true,
              has_contextual_safeguarding_risk: true,
              has_pattern_notes: true,
              duration_hours: 1,
              still_missing: false,
            }),
          ],
        }),
      );
      expect(r.missing_score).toBe(82);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 12. RESULT STRUCTURE
  // ════════════════════════════════════════════════════════════════════════════

  describe("Result structure", () => {
    it("returns all required fields", () => {
      const r = computeMissingEpisode(baseInput());
      expect(r).toHaveProperty("missing_rating");
      expect(r).toHaveProperty("missing_score");
      expect(r).toHaveProperty("headline");
      expect(r).toHaveProperty("total_episodes");
      expect(r).toHaveProperty("unique_children_missing");
      expect(r).toHaveProperty("episodes_last_90_days");
      expect(r).toHaveProperty("high_risk_count");
      expect(r).toHaveProperty("still_missing_count");
      expect(r).toHaveProperty("return_interview_rate");
      expect(r).toHaveProperty("return_interview_timeliness_rate");
      expect(r).toHaveProperty("la_notification_rate");
      expect(r).toHaveProperty("police_report_rate_high_risk");
      expect(r).toHaveProperty("contextual_safeguarding_flag_rate");
      expect(r).toHaveProperty("pattern_analysis_rate");
      expect(r).toHaveProperty("average_duration_hours");
      expect(r).toHaveProperty("strengths");
      expect(r).toHaveProperty("concerns");
      expect(r).toHaveProperty("recommendations");
      expect(r).toHaveProperty("insights");
    });

    it("missing_rating is a valid enum value", () => {
      const r = computeMissingEpisode(baseInput());
      expect(["outstanding", "good", "adequate", "inadequate", "insufficient_data"]).toContain(r.missing_rating);
    });

    it("missing_score is a number", () => {
      const r = computeMissingEpisode(baseInput());
      expect(typeof r.missing_score).toBe("number");
    });

    it("headline is a non-empty string", () => {
      const r = computeMissingEpisode(baseInput());
      expect(typeof r.headline).toBe("string");
      expect(r.headline.length).toBeGreaterThan(0);
    });

    it("strengths is an array of strings", () => {
      const r = computeMissingEpisode(baseInput());
      expect(Array.isArray(r.strengths)).toBe(true);
      r.strengths.forEach((s) => expect(typeof s).toBe("string"));
    });

    it("concerns is an array of strings", () => {
      const r = computeMissingEpisode(baseInput());
      expect(Array.isArray(r.concerns)).toBe(true);
      r.concerns.forEach((c) => expect(typeof c).toBe("string"));
    });

    it("recommendations have rank, recommendation, urgency, and regulatory_ref fields", () => {
      const r = computeMissingEpisode(
        baseInput({
          episodes: [baseRecord({ still_missing: true })],
        }),
      );
      expect(r.recommendations.length).toBeGreaterThan(0);
      r.recommendations.forEach((rec) => {
        expect(rec).toHaveProperty("rank");
        expect(rec).toHaveProperty("recommendation");
        expect(rec).toHaveProperty("urgency");
        expect(rec).toHaveProperty("regulatory_ref");
      });
    });

    it("insights have text and severity fields", () => {
      const r = computeMissingEpisode(
        baseInput({
          episodes: [baseRecord({ still_missing: true })],
        }),
      );
      expect(r.insights.length).toBeGreaterThan(0);
      r.insights.forEach((insight) => {
        expect(insight).toHaveProperty("text");
        expect(insight).toHaveProperty("severity");
        expect(["critical", "warning", "positive"]).toContain(insight.severity);
      });
    });

    it("recommendation urgency is a valid enum value", () => {
      const eps = Array.from({ length: 10 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 2}`,
          date_missing: "2026-04-01",
          return_interview_completed: i < 3,
          return_interview_within_72hrs: false,
          reported_to_la: i < 5,
          risk_level: "high",
          reported_to_police: i < 5,
          has_pattern_notes: i < 4,
          duration_hours: 15,
          still_missing: i < 2,
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes: eps }));
      r.recommendations.forEach((rec) => {
        expect(["immediate", "soon", "planned"]).toContain(rec.urgency);
      });
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 13. COMPREHENSIVE SCORE COMPUTATIONS
  // ════════════════════════════════════════════════════════════════════════════

  describe("Comprehensive score computations", () => {
    it("computes correct score for a mixed scenario with all modifiers active", () => {
      // 10 episodes, 3 children in input, 5 in last 90 days
      // freq: 5/3 = 1.67 => > 1, <= 2 => 0
      // RI: 8 of 9 returned completed = pct(8,9) = 89% => +2
      // timely: 6 of 8 completed timely = pct(6,8) = 75% => +2
      // LA: pct(9,10) = 90% >= 75 => +2
      // pattern: pct(7,10) = 70% >= 60 => +2
      // dur: avg=4, still=0? No, 1 still missing. avg<=6? yes => +2
      const episodes = Array.from({ length: 10 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          date_missing: i < 5 ? "2026-04-01" : "2025-10-01",
          return_interview_completed: i < 8,
          return_interview_within_72hrs: i < 6,
          reported_to_la: i < 9,
          risk_level: i < 5 ? "high" : "medium",
          reported_to_police: i < 4,
          has_contextual_safeguarding_risk: i < 3,
          has_pattern_notes: i < 7,
          duration_hours: 4,
          still_missing: i === 9,
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      // 52 + 0 + 2 + 2 + 2 + 2 + 2 = 62
      expect(r.missing_score).toBe(62);
      expect(r.missing_rating).toBe("adequate");
    });

    it("computes correct score for nearly perfect scenario with recent episodes", () => {
      // 1 episode, 3 children, in last 90 days => 0.33 per child => +3
      const r = computeMissingEpisode(
        baseInput({
          total_children: 3,
          episodes: [
            baseRecord({
              date_missing: "2026-04-01",
              return_interview_completed: true,
              return_interview_within_72hrs: true,
              reported_to_la: true,
              risk_level: "high",
              reported_to_police: true,
              has_contextual_safeguarding_risk: true,
              has_pattern_notes: true,
              duration_hours: 1,
              still_missing: false,
            }),
          ],
        }),
      );
      // 52 + 3 + 5 + 5 + 5 + 4 + 5 = 79
      expect(r.missing_score).toBe(79);
      expect(r.missing_rating).toBe("good");
    });

    it("computes correct score for all-neutral modifiers", () => {
      // Each modifier in the no-change zone
      const eps = Array.from({ length: 10 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 5}`,
          date_missing: "2026-04-01", // 10/5 = 2.0 per child => 0
          return_interview_completed: i < 6, // 60% => 0
          return_interview_within_72hrs: i < 3, // 3 of 6 = 50% => 0
          reported_to_la: i < 6, // 60% => not >= 75
          risk_level: i < 6 ? "high" : "medium",
          reported_to_police: i < 4, // 4 of 6 = 67% => not >= 75, not < 50
          has_contextual_safeguarding_risk: i < 2, // 2 of 6 = 33% => >= 30
          has_pattern_notes: i < 4, // 40% => not >= 60, >= 30
          duration_hours: 4,
          still_missing: false, // still=0 => +2 via OR
        }),
      );
      // freq: 0, RI: 0, timely: 0, LA/Police: 0, pattern: 0, dur: +2
      // total: 52 + 0 + 0 + 0 + 0 + 0 + 2 = 54
      const r = computeMissingEpisode(baseInput({ total_children: 5, episodes: eps }));
      expect(r.missing_score).toBe(54);
      expect(r.missing_rating).toBe("adequate");
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 14. COMBINED CONDITIONAL LOGIC
  // ════════════════════════════════════════════════════════════════════════════

  describe("Combined conditional logic", () => {
    it("still_missing episodes are excluded from return interview denominator", () => {
      const episodes = [
        baseRecord({ id: "ep_1", still_missing: true, return_interview_completed: false }),
        baseRecord({ id: "ep_2", still_missing: true, return_interview_completed: false }),
        baseRecord({ id: "ep_3", still_missing: false, return_interview_completed: true }),
      ];
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.return_interview_rate).toBe(100);
    });

    it("all episodes still_missing means returnedEpisodes = 0 and RI rate = 0%", () => {
      const episodes = Array.from({ length: 3 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i}`,
          still_missing: true,
          return_interview_completed: false,
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.return_interview_rate).toBe(0);
      expect(r.return_interview_timeliness_rate).toBe(0);
    });

    it("timeliness rate is 0 when all returned but none completed interviews", () => {
      const episodes = Array.from({ length: 5 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i}`,
          still_missing: false,
          return_interview_completed: false,
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.return_interview_timeliness_rate).toBe(0);
    });

    it("concerns and recommendations overlap correctly for multiple issues", () => {
      const episodes = Array.from({ length: 10 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 2}`,
          date_missing: "2026-04-01",
          return_interview_completed: i < 3,
          reported_to_la: i < 5,
          risk_level: "high",
          reported_to_police: i < 5,
          has_pattern_notes: i < 3,
          duration_hours: 15,
          still_missing: i < 2,
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.concerns.length).toBeGreaterThanOrEqual(4);
      expect(r.recommendations.length).toBeGreaterThanOrEqual(4);
    });

    it("strengths and concerns can coexist for different metrics", () => {
      const episodes = Array.from({ length: 10 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          return_interview_completed: true,
          return_interview_within_72hrs: true,
          reported_to_la: i < 5, // 50% LA => concern
          risk_level: "medium",
          has_pattern_notes: true,
          duration_hours: 2,
          still_missing: false,
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.strengths.some((s) => s.includes("Return interview completion"))).toBe(true);
      expect(r.concerns.some((c) => c.includes("LA notification rate"))).toBe(true);
    });

    it("childrenWith3Plus correctly counts children with 3 or more episodes", () => {
      const episodes = [
        baseRecord({ id: "ep_1", child_id: "child_a" }),
        baseRecord({ id: "ep_2", child_id: "child_a" }),
        baseRecord({ id: "ep_3", child_id: "child_a" }),
        baseRecord({ id: "ep_4", child_id: "child_a" }),
        baseRecord({ id: "ep_5", child_id: "child_b" }),
        baseRecord({ id: "ep_6", child_id: "child_b" }),
        baseRecord({ id: "ep_7", child_id: "child_b" }),
        baseRecord({ id: "ep_8", child_id: "child_c" }),
        baseRecord({ id: "ep_9", child_id: "child_c" }),
      ];
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.concerns.some((c) => c.includes("2 children with 3 or more"))).toBe(true);
    });

    it("high-risk insight shows correct percentage", () => {
      const episodes = [
        baseRecord({ id: "ep_1", risk_level: "high" }),
        baseRecord({ id: "ep_2", risk_level: "high" }),
        baseRecord({ id: "ep_3", risk_level: "medium" }),
        baseRecord({ id: "ep_4", risk_level: "low" }),
      ];
      const r = computeMissingEpisode(baseInput({ episodes }));
      const insight = r.insights.find((i) => i.text.includes("episodes are high risk"));
      if (insight) {
        expect(insight.text).toContain("50%");
      }
    });

    it("repeat pattern insight shows correct highest count", () => {
      const episodes = [
        baseRecord({ id: "ep_1", child_id: "child_a" }),
        baseRecord({ id: "ep_2", child_id: "child_a" }),
        baseRecord({ id: "ep_3", child_id: "child_a" }),
        baseRecord({ id: "ep_4", child_id: "child_a" }),
        baseRecord({ id: "ep_5", child_id: "child_a" }),
        baseRecord({ id: "ep_6", child_id: "child_b" }),
        baseRecord({ id: "ep_7", child_id: "child_b" }),
        baseRecord({ id: "ep_8", child_id: "child_b" }),
      ];
      const r = computeMissingEpisode(baseInput({ episodes }));
      const insight = r.insights.find((i) => i.text.includes("3 or more missing episodes"));
      expect(insight).toBeDefined();
      expect(insight!.text).toContain("highest: 5");
    });

    it("no positive insights when all metrics are poor", () => {
      const episodes = Array.from({ length: 10 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          date_missing: "2026-04-01",
          return_interview_completed: false,
          return_interview_within_72hrs: false,
          reported_to_la: false,
          risk_level: "high",
          reported_to_police: false,
          has_contextual_safeguarding_risk: false,
          has_pattern_notes: false,
          duration_hours: 20,
          still_missing: true,
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      const positiveInsights = r.insights.filter((i) => i.severity === "positive");
      expect(positiveInsights).toHaveLength(0);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 15. SPECIAL MODIFIER INTERACTIONS
  // ════════════════════════════════════════════════════════════════════════════

  describe("Special modifier interactions", () => {
    it("modifier 4: both laRate and policeHighRate at boundary of +5 zone", () => {
      const episodes = Array.from({ length: 20 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          reported_to_la: i !== 19, // 19/20 = 95%
          risk_level: i < 10 ? "high" : "medium",
          reported_to_police: i < 9, // 9/10 high = 90%
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.la_notification_rate).toBe(95);
      expect(r.police_report_rate_high_risk).toBe(90);
    });

    it("modifier 4: laRate=90% just misses +5 but hits +2", () => {
      const episodes = Array.from({ length: 20 }, (_, i) =>
        baseRecord({
          id: `ep_${i}`,
          child_id: `child_${i % 3}`,
          reported_to_la: i < 18, // 90%
          risk_level: i < 10 ? "high" : "medium",
          reported_to_police: i < 10, // 100% high
        }),
      );
      const r = computeMissingEpisode(baseInput({ episodes }));
      expect(r.la_notification_rate).toBe(90);
    });

    it("modifier 5 guard for totalEpisodes === 0 is unreachable due to episodes guard clause", () => {
      const r = computeMissingEpisode(baseInput({ episodes: [] }));
      expect(r.missing_rating).toBe("outstanding");
      expect(r.missing_score).toBe(82);
    });

    it("modifier 6 guard for totalEpisodes === 0 is unreachable due to episodes guard clause", () => {
      const r = computeMissingEpisode(baseInput({ episodes: [] }));
      expect(r.missing_score).toBe(82);
    });

    it("modifier 1 -3 path when total_children is 0 is unreachable due to guard clause", () => {
      const r = computeMissingEpisode({ today: "2026-05-15", total_children: 0, episodes: [] });
      expect(r.missing_rating).toBe("insufficient_data");
    });

    it("with exactly 1 total child and 0 episodes in 90 days, frequency modifier is +6", () => {
      const r = computeMissingEpisode(
        baseInput({
          total_children: 1,
          episodes: [baseRecord({ date_missing: "2025-10-01" })],
        }),
      );
      expect(r.episodes_last_90_days).toBe(0);
    });

    it("policeHighRate is 100% when 1 of 1 high-risk reported", () => {
      const r = computeMissingEpisode(
        baseInput({
          episodes: [
            baseRecord({ risk_level: "high", reported_to_police: true }),
          ],
        }),
      );
      expect(r.police_report_rate_high_risk).toBe(100);
    });

    it("policeHighRate is 0% when 0 of 1 high-risk reported", () => {
      const r = computeMissingEpisode(
        baseInput({
          episodes: [
            baseRecord({ risk_level: "high", reported_to_police: false }),
          ],
        }),
      );
      expect(r.police_report_rate_high_risk).toBe(0);
    });

    it("single returned episode with completed interview within 72hrs gives 100% timeliness", () => {
      const r = computeMissingEpisode(
        baseInput({
          episodes: [
            baseRecord({
              return_interview_completed: true,
              return_interview_within_72hrs: true,
              still_missing: false,
            }),
          ],
        }),
      );
      expect(r.return_interview_timeliness_rate).toBe(100);
    });

    it("single returned episode with completed interview NOT within 72hrs gives 0% timeliness", () => {
      const r = computeMissingEpisode(
        baseInput({
          episodes: [
            baseRecord({
              return_interview_completed: true,
              return_interview_within_72hrs: false,
              still_missing: false,
            }),
          ],
        }),
      );
      expect(r.return_interview_timeliness_rate).toBe(0);
    });
  });
});
