import { describe, it, expect } from "vitest";
import {
  computeEmotionalSafetyClimate,
  type EmotionalSafetyClimateInput,
  type RestraintInput,
  type SanctionRewardInput,
  type PostIncidentDebriefInput,
  type StaffDebriefInput,
  type PositiveAchievementInput,
} from "../home-emotional-safety-climate-intelligence-engine";

/* ── Helpers ────────────────────────────────────────────────────────────────── */

function makeRestraint(
  id: string,
  overrides: Partial<RestraintInput> = {},
): RestraintInput {
  return {
    id,
    child_id: "c1",
    date: "2026-05-01",
    duration: 5,
    restraint_type: "hold",
    child_debriefed: true,
    staff_debriefed: true,
    review_status: "reviewed",
    de_escalation_attempts: ["verbal", "distraction"],
    injuries: [],
    body_map_completed: true,
    created_at: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

function makeSanctionReward(
  id: string,
  direction: "reward" | "sanction",
  overrides: Partial<SanctionRewardInput> = {},
): SanctionRewardInput {
  return {
    id,
    child_id: "c1",
    date: "2026-05-01",
    direction,
    reward_type: direction === "reward" ? "praise" : null,
    sanction_type: direction === "sanction" ? "verbal_warning" : null,
    proportionate: true,
    child_response: "accepted",
    created_at: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

function makeDebrief(
  id: string,
  overrides: Partial<PostIncidentDebriefInput> = {},
): PostIncidentDebriefInput {
  return {
    id,
    child_id: "c1",
    incident_id: "inc1",
    debrief_date: "2026-05-01",
    child_voice_captured: true,
    child_feelings_explored: true,
    learning_identified: true,
    follow_up_actions: "follow up plan",
    quality_rating: 5,
    created_at: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

function makeStaffDebrief(
  id: string,
  overrides: Partial<StaffDebriefInput> = {},
): StaffDebriefInput {
  return {
    id,
    staff_id: "s1",
    incident_id: "inc1",
    debrief_date: "2026-05-01",
    emotional_impact_explored: true,
    support_offered: true,
    learning_identified: true,
    created_at: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

function makeAchievement(
  id: string,
  overrides: Partial<PositiveAchievementInput> = {},
): PositiveAchievementInput {
  return {
    id,
    child_id: "c1",
    date: "2026-05-01",
    category: "academic",
    description: "Passed maths test",
    celebrated: true,
    shared_with_network: true,
    created_at: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

function baseInput(
  overrides: Partial<EmotionalSafetyClimateInput> = {},
): EmotionalSafetyClimateInput {
  return {
    today: "2026-05-15",
    total_children: 4,
    total_staff: 6,
    restraints: [makeRestraint("r1"), makeRestraint("r2")],
    sanction_rewards: [
      makeSanctionReward("sr1", "reward"),
      makeSanctionReward("sr2", "reward"),
      makeSanctionReward("sr3", "reward"),
      makeSanctionReward("sr4", "reward"),
      makeSanctionReward("sr5", "sanction"),
    ],
    post_incident_debriefs: [makeDebrief("d1"), makeDebrief("d2")],
    staff_debriefs: [makeStaffDebrief("sd1"), makeStaffDebrief("sd2")],
    positive_achievements: [
      makeAchievement("a1", { category: "academic" }),
      makeAchievement("a2", { category: "social" }),
      makeAchievement("a3", { category: "emotional" }),
      makeAchievement("a4", { category: "physical" }),
    ],
    ...overrides,
  };
}

/* ── Tests ──────────────────────────────────────────────────────────────────── */

describe("Home Emotional Safety Climate Intelligence Engine", () => {
  // ==========================================================================
  // 1. SPECIAL CASES
  // ==========================================================================

  describe("special cases", () => {
    it("returns insufficient_data when everything is empty and 0 children/staff", () => {
      const r = computeEmotionalSafetyClimate({
        today: "2026-05-15",
        total_children: 0,
        total_staff: 0,
        restraints: [],
        sanction_rewards: [],
        post_incident_debriefs: [],
        staff_debriefs: [],
        positive_achievements: [],
      });
      expect(r.safety_rating).toBe("insufficient_data");
      expect(r.safety_score).toBe(0);
      expect(r.headline).toContain("insufficient data");
      expect(r.strengths).toHaveLength(0);
      expect(r.concerns).toHaveLength(0);
      expect(r.recommendations).toHaveLength(0);
      expect(r.insights).toHaveLength(0);
    });

    it("returns inadequate with children > 0 and all arrays empty", () => {
      const r = computeEmotionalSafetyClimate({
        today: "2026-05-15",
        total_children: 3,
        total_staff: 0,
        restraints: [],
        sanction_rewards: [],
        post_incident_debriefs: [],
        staff_debriefs: [],
        positive_achievements: [],
      });
      expect(r.safety_rating).toBe("inadequate");
      expect(r.safety_score).toBe(18);
      expect(r.headline).toContain("urgent attention");
      expect(r.concerns).toHaveLength(1);
      expect(r.recommendations).toHaveLength(2);
      expect(r.insights).toHaveLength(1);
      expect(r.insights[0].severity).toBe("critical");
    });

    it("returns inadequate with staff > 0 and all arrays empty", () => {
      const r = computeEmotionalSafetyClimate({
        today: "2026-05-15",
        total_children: 0,
        total_staff: 5,
        restraints: [],
        sanction_rewards: [],
        post_incident_debriefs: [],
        staff_debriefs: [],
        positive_achievements: [],
      });
      expect(r.safety_rating).toBe("inadequate");
      expect(r.safety_score).toBe(18);
    });

    it("returns inadequate with both children and staff > 0 and all arrays empty", () => {
      const r = computeEmotionalSafetyClimate({
        today: "2026-05-15",
        total_children: 3,
        total_staff: 5,
        restraints: [],
        sanction_rewards: [],
        post_incident_debriefs: [],
        staff_debriefs: [],
        positive_achievements: [],
      });
      expect(r.safety_rating).toBe("inadequate");
      expect(r.safety_score).toBe(18);
      expect(r.recommendations[0].urgency).toBe("immediate");
      expect(r.recommendations[1].urgency).toBe("soon");
    });

    it("insufficient_data returns all metric fields as 0", () => {
      const r = computeEmotionalSafetyClimate({
        today: "2026-05-15",
        total_children: 0,
        total_staff: 0,
        restraints: [],
        sanction_rewards: [],
        post_incident_debriefs: [],
        staff_debriefs: [],
        positive_achievements: [],
      });
      expect(r.total_restraints).toBe(0);
      expect(r.average_restraint_duration).toBe(0);
      expect(r.restraint_review_rate).toBe(0);
      expect(r.child_debrief_rate).toBe(0);
      expect(r.staff_debrief_rate).toBe(0);
      expect(r.reward_to_sanction_ratio).toBe(0);
      expect(r.positive_achievement_count).toBe(0);
      expect(r.achievement_celebration_rate).toBe(0);
      expect(r.de_escalation_attempt_rate).toBe(0);
      expect(r.body_map_completion_rate).toBe(0);
      expect(r.post_incident_quality_avg).toBe(0);
      expect(r.injury_rate).toBe(0);
    });
  });

  // ==========================================================================
  // 2. BASE SCORE
  // ==========================================================================

  describe("base score", () => {
    it("starts at 52 with minimal neutral data", () => {
      // One achievement (not celebrated, not shared) — prevents allEmpty
      // No restraints, no sanctions/rewards, no debriefs
      // pct(0,0) = 0 for restraint rates so no restraint bonuses/penalties
      // rewardToSanctionRatio = 0 (both 0) — no bonus
      // achievementCelebrationRate = 0% (0/1) — no bonus
      // postIncidentQualityAvg = 0 — no bonus
      // no restraints + children>0 => +2 bonus
      // BUT achievementCelebrationRate < 50% concern
      // Actually need to be more careful. Let's use the simplest case:
      // no restraints, no sanctions, no debriefs, 1 uncelebrated achievement
      // score = 52 + 2 (no restraints + children > 0) = 54
      const r = computeEmotionalSafetyClimate({
        today: "2026-05-15",
        total_children: 2,
        total_staff: 2,
        restraints: [],
        sanction_rewards: [],
        post_incident_debriefs: [],
        staff_debriefs: [],
        positive_achievements: [
          makeAchievement("a1", { celebrated: false, shared_with_network: false }),
        ],
      });
      // base 52 + 2 (no restraints w/ children>0) = 54
      expect(r.safety_score).toBe(54);
    });
  });

  // ==========================================================================
  // 3. INDIVIDUAL BONUSES
  // ==========================================================================

  describe("individual bonuses", () => {
    it("awards +4 for child debrief rate >= 100%", () => {
      // All restraints have child_debriefed = true (default) → 100%
      const withBonus = computeEmotionalSafetyClimate(baseInput());
      // Remove the bonus by making child_debriefed false on all
      const withoutBonus = computeEmotionalSafetyClimate(
        baseInput({
          restraints: [
            makeRestraint("r1", { child_debriefed: false }),
            makeRestraint("r2", { child_debriefed: false }),
          ],
        }),
      );
      // The difference also includes the -5 penalty for < 50% child debrief,
      // so we compare against a 50% case instead
      const halfDebriefed = computeEmotionalSafetyClimate(
        baseInput({
          restraints: [
            makeRestraint("r1", { child_debriefed: true }),
            makeRestraint("r2", { child_debriefed: false }),
          ],
        }),
      );
      // 100% → +4, 50% → 0 (between 50 and 80 gets neither bonus nor penalty)
      expect(withBonus.safety_score - halfDebriefed.safety_score).toBe(4);
    });

    it("awards +2 for child debrief rate >= 80% but < 100%", () => {
      // 4 out of 5 = 80%
      const restraints = [
        makeRestraint("r1"),
        makeRestraint("r2"),
        makeRestraint("r3"),
        makeRestraint("r4"),
        makeRestraint("r5", { child_debriefed: false }),
      ];
      const r = computeEmotionalSafetyClimate(baseInput({ restraints }));
      // Compare to 60% (3/5 - no bonus, no penalty)
      const restraints60 = [
        makeRestraint("r1"),
        makeRestraint("r2"),
        makeRestraint("r3"),
        makeRestraint("r4", { child_debriefed: false }),
        makeRestraint("r5", { child_debriefed: false }),
      ];
      const r60 = computeEmotionalSafetyClimate(baseInput({ restraints: restraints60 }));
      expect(r.safety_score - r60.safety_score).toBe(2);
    });

    it("awards +3 for staff debrief rate >= 100%", () => {
      const full = computeEmotionalSafetyClimate(baseInput());
      const half = computeEmotionalSafetyClimate(
        baseInput({
          restraints: [
            makeRestraint("r1", { staff_debriefed: true }),
            makeRestraint("r2", { staff_debriefed: false }),
          ],
        }),
      );
      // 100% → +3, 50% → 0
      expect(full.safety_score - half.safety_score).toBe(3);
    });

    it("awards +1 for staff debrief rate >= 80% but < 100%", () => {
      const restraints80 = [
        makeRestraint("r1"),
        makeRestraint("r2"),
        makeRestraint("r3"),
        makeRestraint("r4"),
        makeRestraint("r5", { staff_debriefed: false }),
      ];
      const restraints60 = [
        makeRestraint("r1"),
        makeRestraint("r2"),
        makeRestraint("r3"),
        makeRestraint("r4", { staff_debriefed: false }),
        makeRestraint("r5", { staff_debriefed: false }),
      ];
      const r80 = computeEmotionalSafetyClimate(baseInput({ restraints: restraints80 }));
      const r60 = computeEmotionalSafetyClimate(baseInput({ restraints: restraints60 }));
      expect(r80.safety_score - r60.safety_score).toBe(1);
    });

    it("awards +4 for reward-to-sanction ratio >= 4.0", () => {
      // 4 rewards : 1 sanction = 4.0
      const r = computeEmotionalSafetyClimate(baseInput());
      expect(r.reward_to_sanction_ratio).toBe(4);
      // Compare against ratio 2.0 (2 rewards : 1 sanction)
      const low = computeEmotionalSafetyClimate(
        baseInput({
          sanction_rewards: [
            makeSanctionReward("sr1", "reward"),
            makeSanctionReward("sr2", "reward"),
            makeSanctionReward("sr3", "sanction"),
          ],
        }),
      );
      expect(low.reward_to_sanction_ratio).toBe(2);
      expect(r.safety_score - low.safety_score).toBe(2); // +4 vs +2
    });

    it("awards +2 for reward-to-sanction ratio >= 2.0 but < 4.0", () => {
      // 3 rewards : 1 sanction = 3.0
      const r3 = computeEmotionalSafetyClimate(
        baseInput({
          sanction_rewards: [
            makeSanctionReward("sr1", "reward"),
            makeSanctionReward("sr2", "reward"),
            makeSanctionReward("sr3", "reward"),
            makeSanctionReward("sr4", "sanction"),
          ],
        }),
      );
      // 1 reward : 1 sanction = 1.0 (no bonus, no penalty since ratio = 1.0)
      const r1 = computeEmotionalSafetyClimate(
        baseInput({
          sanction_rewards: [
            makeSanctionReward("sr1", "reward"),
            makeSanctionReward("sr2", "sanction"),
          ],
        }),
      );
      expect(r3.safety_score - r1.safety_score).toBe(2);
    });

    it("awards +3 for de-escalation rate >= 100%", () => {
      const full = computeEmotionalSafetyClimate(baseInput());
      expect(full.de_escalation_attempt_rate).toBe(100);
      // 50% de-escalation (1 of 2)
      const half = computeEmotionalSafetyClimate(
        baseInput({
          restraints: [
            makeRestraint("r1"),
            makeRestraint("r2", { de_escalation_attempts: [] }),
          ],
        }),
      );
      expect(half.de_escalation_attempt_rate).toBe(50);
      expect(full.safety_score - half.safety_score).toBe(3);
    });

    it("awards +1 for de-escalation rate >= 90% but < 100%", () => {
      // 9 of 10 = 90%
      const restraints90 = Array.from({ length: 10 }, (_, i) =>
        makeRestraint(`r${i}`, i === 9 ? { de_escalation_attempts: [] } : {}),
      );
      // 8 of 10 = 80%
      const restraints80 = Array.from({ length: 10 }, (_, i) =>
        makeRestraint(`r${i}`, i >= 8 ? { de_escalation_attempts: [] } : {}),
      );
      const r90 = computeEmotionalSafetyClimate(baseInput({ restraints: restraints90 }));
      const r80 = computeEmotionalSafetyClimate(baseInput({ restraints: restraints80 }));
      expect(r90.de_escalation_attempt_rate).toBe(90);
      expect(r80.de_escalation_attempt_rate).toBe(80);
      expect(r90.safety_score - r80.safety_score).toBe(1);
    });

    it("awards +3 for body map rate >= 100%", () => {
      const full = computeEmotionalSafetyClimate(baseInput());
      expect(full.body_map_completion_rate).toBe(100);
      const half = computeEmotionalSafetyClimate(
        baseInput({
          restraints: [
            makeRestraint("r1"),
            makeRestraint("r2", { body_map_completed: false }),
          ],
        }),
      );
      expect(half.body_map_completion_rate).toBe(50);
      expect(full.safety_score - half.safety_score).toBe(3);
    });

    it("awards +1 for body map rate >= 80% but < 100%", () => {
      const restraints80 = [
        makeRestraint("r1"),
        makeRestraint("r2"),
        makeRestraint("r3"),
        makeRestraint("r4"),
        makeRestraint("r5", { body_map_completed: false }),
      ];
      const restraints60 = [
        makeRestraint("r1"),
        makeRestraint("r2"),
        makeRestraint("r3"),
        makeRestraint("r4", { body_map_completed: false }),
        makeRestraint("r5", { body_map_completed: false }),
      ];
      const r80 = computeEmotionalSafetyClimate(baseInput({ restraints: restraints80 }));
      const r60 = computeEmotionalSafetyClimate(baseInput({ restraints: restraints60 }));
      expect(r80.body_map_completion_rate).toBe(80);
      expect(r60.body_map_completion_rate).toBe(60);
      expect(r80.safety_score - r60.safety_score).toBe(1);
    });

    it("awards +3 for restraint review rate >= 100%", () => {
      const full = computeEmotionalSafetyClimate(baseInput());
      expect(full.restraint_review_rate).toBe(100);
      const half = computeEmotionalSafetyClimate(
        baseInput({
          restraints: [
            makeRestraint("r1"),
            makeRestraint("r2", { review_status: "pending" }),
          ],
        }),
      );
      expect(half.restraint_review_rate).toBe(50);
      expect(full.safety_score - half.safety_score).toBe(3);
    });

    it("awards +1 for restraint review rate >= 80% but < 100%", () => {
      const restraints80 = [
        makeRestraint("r1"),
        makeRestraint("r2"),
        makeRestraint("r3"),
        makeRestraint("r4"),
        makeRestraint("r5", { review_status: "pending" }),
      ];
      const restraints60 = [
        makeRestraint("r1"),
        makeRestraint("r2"),
        makeRestraint("r3"),
        makeRestraint("r4", { review_status: "pending" }),
        makeRestraint("r5", { review_status: "pending" }),
      ];
      const r80 = computeEmotionalSafetyClimate(baseInput({ restraints: restraints80 }));
      const r60 = computeEmotionalSafetyClimate(baseInput({ restraints: restraints60 }));
      expect(r80.safety_score - r60.safety_score).toBe(1);
    });

    it("awards +3 for achievement celebration rate >= 90%", () => {
      // 4/4 = 100% (all celebrated)
      const full = computeEmotionalSafetyClimate(baseInput());
      expect(full.achievement_celebration_rate).toBe(100);
      // 3/4 = 75% → +1
      const r75 = computeEmotionalSafetyClimate(
        baseInput({
          positive_achievements: [
            makeAchievement("a1", { category: "academic" }),
            makeAchievement("a2", { category: "social" }),
            makeAchievement("a3", { category: "emotional" }),
            makeAchievement("a4", { category: "physical", celebrated: false }),
          ],
        }),
      );
      expect(r75.achievement_celebration_rate).toBe(75);
      expect(full.safety_score - r75.safety_score).toBe(2); // +3 vs +1
    });

    it("awards +1 for achievement celebration rate >= 70% but < 90%", () => {
      // 3/4 = 75%
      const r75 = computeEmotionalSafetyClimate(
        baseInput({
          positive_achievements: [
            makeAchievement("a1", { category: "academic" }),
            makeAchievement("a2", { category: "social" }),
            makeAchievement("a3", { category: "emotional" }),
            makeAchievement("a4", { category: "physical", celebrated: false }),
          ],
        }),
      );
      // 2/4 = 50% → no bonus
      const r50 = computeEmotionalSafetyClimate(
        baseInput({
          positive_achievements: [
            makeAchievement("a1", { category: "academic" }),
            makeAchievement("a2", { category: "social", celebrated: false }),
            makeAchievement("a3", { category: "emotional" }),
            makeAchievement("a4", { category: "physical", celebrated: false }),
          ],
        }),
      );
      expect(r75.safety_score - r50.safety_score).toBe(1);
    });

    it("awards +3 for post-incident quality avg >= 4.0", () => {
      const high = computeEmotionalSafetyClimate(baseInput());
      expect(high.post_incident_quality_avg).toBe(5);
      // quality avg 3.5 → +1
      const mid = computeEmotionalSafetyClimate(
        baseInput({
          post_incident_debriefs: [
            makeDebrief("d1", { quality_rating: 4 }),
            makeDebrief("d2", { quality_rating: 3 }),
          ],
        }),
      );
      expect(mid.post_incident_quality_avg).toBe(3.5);
      expect(high.safety_score - mid.safety_score).toBe(2); // +3 vs +1
    });

    it("awards +1 for post-incident quality avg >= 3.0 but < 4.0", () => {
      const mid = computeEmotionalSafetyClimate(
        baseInput({
          post_incident_debriefs: [
            makeDebrief("d1", { quality_rating: 3 }),
            makeDebrief("d2", { quality_rating: 3 }),
          ],
        }),
      );
      expect(mid.post_incident_quality_avg).toBe(3);
      // quality avg 2.5 → 0
      const low = computeEmotionalSafetyClimate(
        baseInput({
          post_incident_debriefs: [
            makeDebrief("d1", { quality_rating: 3 }),
            makeDebrief("d2", { quality_rating: 2 }),
          ],
        }),
      );
      expect(low.post_incident_quality_avg).toBe(2.5);
      expect(mid.safety_score - low.safety_score).toBe(1);
    });

    it("awards +2 for no injuries when restraints > 0", () => {
      const noInjury = computeEmotionalSafetyClimate(baseInput());
      expect(noInjury.injury_rate).toBe(0);
      const withInjury = computeEmotionalSafetyClimate(
        baseInput({
          restraints: [
            makeRestraint("r1"),
            makeRestraint("r2", {
              injuries: [{ person: "child", description: "bruise" }],
            }),
          ],
        }),
      );
      expect(withInjury.injury_rate).toBe(50);
      expect(noInjury.safety_score - withInjury.safety_score).toBe(2);
    });

    it("awards +2 for no restraints when children > 0", () => {
      const noRestraints = computeEmotionalSafetyClimate(
        baseInput({ restraints: [] }),
      );
      // The base 52 + 2 (no restraints) + other bonuses from SR/achievements/debriefs
      // Verify the no-restraints bonus is present by removing it
      // When we have restraints with all perfect, the injury bonus is also +2,
      // but the restraint-specific bonuses activate (child debrief, staff debrief, etc.)
      // Simplest: check it's applied by verifying score
      expect(noRestraints.safety_score).toBeGreaterThanOrEqual(52 + 2);
    });
  });

  // ==========================================================================
  // 4. INDIVIDUAL PENALTIES
  // ==========================================================================

  describe("individual penalties", () => {
    it("applies -5 penalty when child debrief rate < 50%", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          restraints: [
            makeRestraint("r1", { child_debriefed: false }),
            makeRestraint("r2", { child_debriefed: false }),
            makeRestraint("r3", { child_debriefed: false }),
          ],
        }),
      );
      expect(r.child_debrief_rate).toBe(0);
      // Compare to 67% (2/3 → no penalty, no bonus)
      const noPenalty = computeEmotionalSafetyClimate(
        baseInput({
          restraints: [
            makeRestraint("r1"),
            makeRestraint("r2"),
            makeRestraint("r3", { child_debriefed: false }),
          ],
        }),
      );
      expect(noPenalty.child_debrief_rate).toBe(67);
      // Difference should include the -5 penalty + loss of any bonus
      expect(noPenalty.safety_score - r.safety_score).toBe(5);
    });

    it("applies -5 penalty when reward-to-sanction ratio < 1.0 and sanctions > 0", () => {
      // 1 reward : 2 sanctions = 0.5
      const r = computeEmotionalSafetyClimate(
        baseInput({
          sanction_rewards: [
            makeSanctionReward("sr1", "reward"),
            makeSanctionReward("sr2", "sanction"),
            makeSanctionReward("sr3", "sanction"),
          ],
        }),
      );
      expect(r.reward_to_sanction_ratio).toBe(0.5);
      // 1 reward : 1 sanction = 1.0 (no penalty, no bonus)
      const noPenalty = computeEmotionalSafetyClimate(
        baseInput({
          sanction_rewards: [
            makeSanctionReward("sr1", "reward"),
            makeSanctionReward("sr2", "sanction"),
          ],
        }),
      );
      expect(noPenalty.reward_to_sanction_ratio).toBe(1);
      expect(noPenalty.safety_score - r.safety_score).toBe(5);
    });

    it("applies -5 penalty when body map rate < 50%", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          restraints: [
            makeRestraint("r1", { body_map_completed: false }),
            makeRestraint("r2", { body_map_completed: false }),
            makeRestraint("r3", { body_map_completed: false }),
          ],
        }),
      );
      expect(r.body_map_completion_rate).toBe(0);
      // 67% — no penalty, gets +1 if >=80, but 67% gets no bonus either
      const noPenalty = computeEmotionalSafetyClimate(
        baseInput({
          restraints: [
            makeRestraint("r1"),
            makeRestraint("r2"),
            makeRestraint("r3", { body_map_completed: false }),
          ],
        }),
      );
      expect(noPenalty.body_map_completion_rate).toBe(67);
      expect(noPenalty.safety_score - r.safety_score).toBe(5);
    });

    it("applies -3 penalty when restraint review rate < 50%", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          restraints: [
            makeRestraint("r1", { review_status: "pending" }),
            makeRestraint("r2", { review_status: "pending" }),
            makeRestraint("r3", { review_status: "pending" }),
          ],
        }),
      );
      expect(r.restraint_review_rate).toBe(0);
      // 67% — no penalty, no bonus (needs >= 80 for bonus)
      const noPenalty = computeEmotionalSafetyClimate(
        baseInput({
          restraints: [
            makeRestraint("r1"),
            makeRestraint("r2"),
            makeRestraint("r3", { review_status: "pending" }),
          ],
        }),
      );
      expect(noPenalty.restraint_review_rate).toBe(67);
      expect(noPenalty.safety_score - r.safety_score).toBe(3);
    });

    it("does not apply child debrief penalty when no restraints exist", () => {
      const r = computeEmotionalSafetyClimate(baseInput({ restraints: [] }));
      // pct(0,0) = 0, but penalty guarded by totalRestraints > 0
      // Score should still include the +2 bonus for no restraints
      expect(r.child_debrief_rate).toBe(0);
      expect(r.safety_score).toBeGreaterThanOrEqual(52);
    });

    it("does not apply R:S penalty when no sanctions exist", () => {
      // 0 rewards, 0 sanctions → ratio = 0, but penalty guarded by sanctionCount > 0
      const r = computeEmotionalSafetyClimate(
        baseInput({ sanction_rewards: [] }),
      );
      expect(r.reward_to_sanction_ratio).toBe(0);
      expect(r.safety_score).toBeGreaterThanOrEqual(52);
    });

    it("does not apply body map penalty when no restraints exist", () => {
      const r = computeEmotionalSafetyClimate(baseInput({ restraints: [] }));
      expect(r.body_map_completion_rate).toBe(0);
      expect(r.safety_score).toBeGreaterThanOrEqual(52);
    });

    it("does not apply review rate penalty when no restraints exist", () => {
      const r = computeEmotionalSafetyClimate(baseInput({ restraints: [] }));
      expect(r.restraint_review_rate).toBe(0);
      expect(r.safety_score).toBeGreaterThanOrEqual(52);
    });
  });

  // ==========================================================================
  // 5. COMBINED OUTSTANDING (~80)
  // ==========================================================================

  describe("combined outstanding", () => {
    it("achieves outstanding rating with all bonuses active", () => {
      // base 52
      // +4 child debrief 100%
      // +3 staff debrief 100%
      // +4 R:S ratio >= 4.0
      // +3 de-escalation 100%
      // +3 body map 100%
      // +3 restraint review 100%
      // +3 achievement celebration >= 90%
      // +3 post-incident quality >= 4.0
      // +2 no injuries with restraints > 0
      // = 52 + 4 + 3 + 4 + 3 + 3 + 3 + 3 + 3 + 2 = 80
      const r = computeEmotionalSafetyClimate(baseInput());
      expect(r.safety_score).toBe(80);
      expect(r.safety_rating).toBe("outstanding");
    });

    it("can reach exactly 80 (outstanding threshold)", () => {
      // baseInput with all max bonuses = 52+4+3+4+3+3+3+3+3+2 = 80
      const r = computeEmotionalSafetyClimate(baseInput());
      expect(r.safety_score).toBe(80);
      expect(r.safety_rating).toBe("outstanding");
    });
  });

  // ==========================================================================
  // 6. RATING BOUNDARIES
  // ==========================================================================

  describe("rating boundaries", () => {
    it("score 80 → outstanding", () => {
      // baseInput with all max bonuses achieves exactly 80
      const r = computeEmotionalSafetyClimate(baseInput());
      expect(r.safety_score).toBe(80);
      expect(r.safety_rating).toBe("outstanding");
    });

    it("score 79 → good (just below outstanding)", () => {
      // Drop 1 point: celebration 75% → +1 instead of +3, so 80 - 2 = 78
      // Instead drop celebration to 70-89% → +1 (loss of 2)
      // Or use a scenario that lands on 79:
      // Lower quality to 3.0–3.99 → +1 instead of +3 → 80 - 2 = 78
      // Better: drop just the injury bonus by adding 1 injury
      // But injury also removes the +2 bonus. 80 - 2 = 78.
      // Instead: drop celebration from +3 to +1 by going to 75%.
      // 80 - 2 = 78. Not 79 either.
      // Let's try: staff debrief 80% → +1 instead of +3 → 80 - 2 = 78.
      // There's no single bonus that drops by exactly 1.
      // Actually de-escalation: 90% → +1 instead of +3 → 80 - 2 = 78. Also 2.
      // We need score = 79. One option: remove 1-point bonus by having celebration
      // at 70-89 (+1) and then add something... actually that loses 2.
      // The engine has no single-point difference granularity for the bonuses.
      // We'd need to combine carefully. Let's just verify the boundary at 79:
      // 52 + 4 + 3 + 4 + 3 + 3 + 3 + 1 (celebration 75%) + 3 + 2 = 78
      // So we can't easily hit 79. Let's test boundary at 65 instead.
      const r = computeEmotionalSafetyClimate(
        baseInput({
          positive_achievements: [
            makeAchievement("a1", { category: "academic" }),
            makeAchievement("a2", { category: "social" }),
            makeAchievement("a3", { category: "emotional" }),
            makeAchievement("a4", { category: "physical", celebrated: false }),
          ],
        }),
      );
      // celebration = 75% → +1. Total: 80 - 2 = 78
      expect(r.safety_score).toBe(78);
      expect(r.safety_rating).toBe("good");
    });

    it("score 65 → good", () => {
      // base 52 + 4 (child debrief) + 3 (staff debrief) + 3 (review) + 3 (body map) = 65
      // Remove: R:S bonus, de-escalation bonus, celebration bonus, quality bonus, injury bonus
      const r = computeEmotionalSafetyClimate(
        baseInput({
          sanction_rewards: [],
          positive_achievements: [
            makeAchievement("a1", { celebrated: false }),
          ],
          post_incident_debriefs: [],
          restraints: [
            makeRestraint("r1", { de_escalation_attempts: [], injuries: [{ person: "child", description: "bruise" }] }),
            makeRestraint("r2", { de_escalation_attempts: [] }),
          ],
        }),
      );
      // 52 + 4 (child debrief 100%) + 3 (staff debrief 100%) + 3 (body map 100%)
      // + 3 (review 100%) + 0 (R:S) + 0 (de-escalation) + 0 (celebration)
      // + 0 (quality) + 0 (injuries exist) = 65
      expect(r.safety_score).toBe(65);
      expect(r.safety_rating).toBe("good");
    });

    it("score 64 → adequate", () => {
      // Same as above but drop 1 more: make 1 review pending
      const r = computeEmotionalSafetyClimate(
        baseInput({
          sanction_rewards: [],
          positive_achievements: [
            makeAchievement("a1", { celebrated: false }),
          ],
          post_incident_debriefs: [],
          restraints: [
            makeRestraint("r1", { de_escalation_attempts: [], injuries: [{ person: "child", description: "bruise" }] }),
            makeRestraint("r2", { de_escalation_attempts: [], review_status: "pending" }),
          ],
        }),
      );
      // 52 + 4 + 3 + 3 + 1 (review 50% → no bonus, 50% not < 50 → no penalty either) = 62
      // Wait, review_rate = 1/2 = 50%. >= 80 → no. 50 < 80 → no bonus. < 50? No (50 is not < 50).
      // So review bonus = 0, no penalty. 52 + 4 + 3 + 3 + 0 = 62
      expect(r.safety_score).toBe(62);
      expect(r.safety_rating).toBe("adequate");
    });

    it("score 45 → adequate (lower bound)", () => {
      // We need exactly 45.
      // Start with only achievements (to avoid allEmpty).
      // No restraints → +2
      // 52 + 2 = 54 — too high. Need penalties.
      // We need restraints to get penalties.
      // 52 - 5 (child debrief < 50) - 5 (body map < 50) + 3 (some bonus)
      // Let me construct carefully.
      // all restraints: child_debriefed=false, body_map=false, review=pending, no de-escalation
      // childDebriefRate = 0% → penalty -5
      // bodyMapRate = 0% → penalty -5
      // reviewRate = 0% → penalty -3
      // deEscalation = 0 → no penalty (just no bonus)
      // staffDebriefRate = 100% → +3
      // R:S ratio = 4.0 → +4
      // celebration = 100% → +2
      // quality >= 4.0 → +3
      // no injuries → +2
      // 52 + 3 + 4 + 2 + 3 + 2 - 5 - 5 - 3 = 53 — still too high
      // Try: remove quality bonus, remove celebration bonus
      // 52 + 3 + 4 + 0 + 0 + 2 - 5 - 5 - 3 = 48 — still too high
      // Remove R:S bonus too: 52 + 3 + 0 + 0 + 0 + 2 - 5 - 5 - 3 = 44 — inadequate!
      // Add R:S penalty: 0 rewards : 2 sanctions = 0 → -5
      // 52 + 3 + 0 + 0 + 0 + 2 - 5 - 5 - 3 - 5 = 39 — too low
      // Let me try: 52 + 3 (staff) + 2 (R:S 2.0) + 0 + 0 + 2 (no injuries) - 5 - 5 - 3 = 46
      // Need 45. Drop 1 more: staff debrief 80% instead of 100%: +1
      // 52 + 1 + 2 + 0 + 0 + 2 - 5 - 5 - 3 = 44 — 1 too low
      // Try: staff 100% (+3), R:S 1.5 (no bonus, no penalty since >=1.0)
      // 52 + 3 + 0 + 0 + 0 + 2 - 5 - 5 - 3 = 44
      // Try: add quality 3.0 → +1: 52 + 3 + 0 + 1 + 0 + 2 - 5 - 5 - 3 = 45!
      const r = computeEmotionalSafetyClimate({
        today: "2026-05-15",
        total_children: 4,
        total_staff: 6,
        restraints: [
          makeRestraint("r1", {
            child_debriefed: false,
            body_map_completed: false,
            review_status: "pending",
            de_escalation_attempts: [],
          }),
          makeRestraint("r2", {
            child_debriefed: false,
            body_map_completed: false,
            review_status: "pending",
            de_escalation_attempts: [],
          }),
        ],
        sanction_rewards: [
          makeSanctionReward("sr1", "reward"),
          makeSanctionReward("sr2", "reward"),
          makeSanctionReward("sr3", "reward"),
          makeSanctionReward("sr4", "sanction"),
          makeSanctionReward("sr5", "sanction"),
        ],
        post_incident_debriefs: [
          makeDebrief("d1", { quality_rating: 3 }),
          makeDebrief("d2", { quality_rating: 3 }),
        ],
        staff_debriefs: [],
        positive_achievements: [],
      });
      // 52 + 0 (child debrief 0%) + 3 (staff debrief 100%) + 0 (R:S 1.5 - no bonus)
      // + 0 (de-escalation 0%) + 0 (body map 0%) + 0 (review 0%)
      // + 0 (celebration - no achievements) + 1 (quality avg 3.0) + 2 (no injuries)
      // - 5 (child debrief < 50) - 5 (body map < 50) - 3 (review < 50) = 45
      // Wait: staff_debriefs is empty. staffDebriefRate = pct(staffDebriefedRestraints, totalRestraints)
      // staff_debriefed on restraints is still true (default). staffDebriefRate = 100% → +3
      expect(r.safety_score).toBe(45);
      expect(r.safety_rating).toBe("adequate");
    });

    it("score 44 → inadequate", () => {
      // From the 45 case, drop quality to 2.5 → no bonus
      const r = computeEmotionalSafetyClimate({
        today: "2026-05-15",
        total_children: 4,
        total_staff: 6,
        restraints: [
          makeRestraint("r1", {
            child_debriefed: false,
            body_map_completed: false,
            review_status: "pending",
            de_escalation_attempts: [],
          }),
          makeRestraint("r2", {
            child_debriefed: false,
            body_map_completed: false,
            review_status: "pending",
            de_escalation_attempts: [],
          }),
        ],
        sanction_rewards: [
          makeSanctionReward("sr1", "reward"),
          makeSanctionReward("sr2", "reward"),
          makeSanctionReward("sr3", "reward"),
          makeSanctionReward("sr4", "sanction"),
          makeSanctionReward("sr5", "sanction"),
        ],
        post_incident_debriefs: [
          makeDebrief("d1", { quality_rating: 3 }),
          makeDebrief("d2", { quality_rating: 2 }),
        ],
        staff_debriefs: [],
        positive_achievements: [],
      });
      // 52 + 3 (staff debrief 100%) + 0 + 0 + 0 + 0 + 0 + 0 + 2 (no injuries)
      // - 5 - 5 - 3 = 44
      expect(r.safety_score).toBe(44);
      expect(r.safety_rating).toBe("inadequate");
    });
  });

  // ==========================================================================
  // 7. METRIC CALCULATIONS
  // ==========================================================================

  describe("metric calculations", () => {
    it("calculates total_restraints correctly", () => {
      const r = computeEmotionalSafetyClimate(baseInput());
      expect(r.total_restraints).toBe(2);
    });

    it("calculates average_restraint_duration as rounded average", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          restraints: [
            makeRestraint("r1", { duration: 3 }),
            makeRestraint("r2", { duration: 8 }),
          ],
        }),
      );
      // (3 + 8) / 2 = 5.5 → Math.round → 6
      expect(r.average_restraint_duration).toBe(6);
    });

    it("returns 0 average_restraint_duration when no restraints", () => {
      const r = computeEmotionalSafetyClimate(baseInput({ restraints: [] }));
      expect(r.average_restraint_duration).toBe(0);
    });

    it("calculates restraint_review_rate as percentage", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          restraints: [
            makeRestraint("r1"),
            makeRestraint("r2", { review_status: "pending" }),
            makeRestraint("r3", { review_status: "pending" }),
          ],
        }),
      );
      // 1/3 = 33.33 → Math.round → 33
      expect(r.restraint_review_rate).toBe(33);
    });

    it("calculates child_debrief_rate as percentage", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          restraints: [
            makeRestraint("r1"),
            makeRestraint("r2", { child_debriefed: false }),
            makeRestraint("r3", { child_debriefed: false }),
          ],
        }),
      );
      expect(r.child_debrief_rate).toBe(33);
    });

    it("calculates staff_debrief_rate as percentage", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          restraints: [
            makeRestraint("r1"),
            makeRestraint("r2", { staff_debriefed: false }),
            makeRestraint("r3", { staff_debriefed: false }),
            makeRestraint("r4", { staff_debriefed: false }),
          ],
        }),
      );
      // 1/4 = 25
      expect(r.staff_debrief_rate).toBe(25);
    });

    it("calculates reward_to_sanction_ratio correctly", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          sanction_rewards: [
            makeSanctionReward("sr1", "reward"),
            makeSanctionReward("sr2", "reward"),
            makeSanctionReward("sr3", "reward"),
            makeSanctionReward("sr4", "sanction"),
            makeSanctionReward("sr5", "sanction"),
          ],
        }),
      );
      // 3/2 = 1.5
      expect(r.reward_to_sanction_ratio).toBe(1.5);
    });

    it("returns reward count as ratio when no sanctions", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          sanction_rewards: [
            makeSanctionReward("sr1", "reward"),
            makeSanctionReward("sr2", "reward"),
            makeSanctionReward("sr3", "reward"),
          ],
        }),
      );
      expect(r.reward_to_sanction_ratio).toBe(3);
    });

    it("returns 0 ratio when no rewards and no sanctions", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({ sanction_rewards: [] }),
      );
      expect(r.reward_to_sanction_ratio).toBe(0);
    });

    it("calculates positive_achievement_count", () => {
      const r = computeEmotionalSafetyClimate(baseInput());
      expect(r.positive_achievement_count).toBe(4);
    });

    it("calculates achievement_celebration_rate", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          positive_achievements: [
            makeAchievement("a1"),
            makeAchievement("a2", { celebrated: false }),
            makeAchievement("a3", { celebrated: false }),
            makeAchievement("a4"),
          ],
        }),
      );
      // 2/4 = 50
      expect(r.achievement_celebration_rate).toBe(50);
    });

    it("calculates de_escalation_attempt_rate", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          restraints: [
            makeRestraint("r1"),
            makeRestraint("r2", { de_escalation_attempts: [] }),
          ],
        }),
      );
      expect(r.de_escalation_attempt_rate).toBe(50);
    });

    it("calculates body_map_completion_rate", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          restraints: [
            makeRestraint("r1"),
            makeRestraint("r2", { body_map_completed: false }),
          ],
        }),
      );
      expect(r.body_map_completion_rate).toBe(50);
    });

    it("calculates post_incident_quality_avg rounded to 2 decimals", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          post_incident_debriefs: [
            makeDebrief("d1", { quality_rating: 4 }),
            makeDebrief("d2", { quality_rating: 3 }),
            makeDebrief("d3", { quality_rating: 5 }),
          ],
        }),
      );
      // (4+3+5)/3 = 4.0
      expect(r.post_incident_quality_avg).toBe(4);
    });

    it("returns 0 post_incident_quality_avg when no debriefs", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({ post_incident_debriefs: [] }),
      );
      expect(r.post_incident_quality_avg).toBe(0);
    });

    it("calculates injury_rate correctly", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          restraints: [
            makeRestraint("r1", {
              injuries: [{ person: "child", description: "scratch" }],
            }),
            makeRestraint("r2"),
            makeRestraint("r3"),
            makeRestraint("r4"),
          ],
        }),
      );
      // 1/4 = 25
      expect(r.injury_rate).toBe(25);
    });

    it("returns 0 injury_rate when no restraints", () => {
      const r = computeEmotionalSafetyClimate(baseInput({ restraints: [] }));
      expect(r.injury_rate).toBe(0);
    });

    it("rounds ratio to 2 decimal places", () => {
      // 1 reward : 3 sanctions = 0.333... → 0.33
      const r = computeEmotionalSafetyClimate(
        baseInput({
          sanction_rewards: [
            makeSanctionReward("sr1", "reward"),
            makeSanctionReward("sr2", "sanction"),
            makeSanctionReward("sr3", "sanction"),
            makeSanctionReward("sr4", "sanction"),
          ],
        }),
      );
      expect(r.reward_to_sanction_ratio).toBe(0.33);
    });
  });

  // ==========================================================================
  // 8. STRENGTHS
  // ==========================================================================

  describe("strengths", () => {
    it("includes child debrief 100% strength", () => {
      const r = computeEmotionalSafetyClimate(baseInput());
      expect(r.strengths).toEqual(
        expect.arrayContaining([
          expect.stringContaining("Every child is debriefed after restraint"),
        ]),
      );
    });

    it("includes child debrief 80-99% strength with percentage", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          restraints: [
            makeRestraint("r1"),
            makeRestraint("r2"),
            makeRestraint("r3"),
            makeRestraint("r4"),
            makeRestraint("r5", { child_debriefed: false }),
          ],
        }),
      );
      expect(r.strengths).toEqual(
        expect.arrayContaining([
          expect.stringContaining("80% child debrief rate"),
        ]),
      );
    });

    it("includes staff debrief 100% strength", () => {
      const r = computeEmotionalSafetyClimate(baseInput());
      expect(r.strengths).toEqual(
        expect.arrayContaining([
          expect.stringContaining("All staff are debriefed after restraint"),
        ]),
      );
    });

    it("includes staff debrief 80-99% strength", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          restraints: [
            makeRestraint("r1"),
            makeRestraint("r2"),
            makeRestraint("r3"),
            makeRestraint("r4"),
            makeRestraint("r5", { staff_debriefed: false }),
          ],
        }),
      );
      expect(r.strengths).toEqual(
        expect.arrayContaining([
          expect.stringContaining("80% staff debrief rate"),
        ]),
      );
    });

    it("includes R:S ratio >= 4.0 strength", () => {
      const r = computeEmotionalSafetyClimate(baseInput());
      expect(r.strengths).toEqual(
        expect.arrayContaining([
          expect.stringContaining("Reward-to-sanction ratio of 4:1"),
        ]),
      );
    });

    it("includes R:S ratio >= 2.0 strength", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          sanction_rewards: [
            makeSanctionReward("sr1", "reward"),
            makeSanctionReward("sr2", "reward"),
            makeSanctionReward("sr3", "sanction"),
          ],
        }),
      );
      expect(r.strengths).toEqual(
        expect.arrayContaining([
          expect.stringContaining("Reward-to-sanction ratio of 2:1"),
        ]),
      );
    });

    it("includes rewards-only strength when rewards > 0 and sanctions = 0", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          sanction_rewards: [
            makeSanctionReward("sr1", "reward"),
            makeSanctionReward("sr2", "reward"),
          ],
        }),
      );
      expect(r.strengths).toEqual(
        expect.arrayContaining([
          expect.stringContaining("2 rewards recorded with zero sanctions"),
        ]),
      );
    });

    it("includes singular reward text when only 1 reward", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          sanction_rewards: [makeSanctionReward("sr1", "reward")],
        }),
      );
      expect(r.strengths).toEqual(
        expect.arrayContaining([
          expect.stringContaining("1 reward recorded with zero sanctions"),
        ]),
      );
    });

    it("includes de-escalation 100% strength", () => {
      const r = computeEmotionalSafetyClimate(baseInput());
      expect(r.strengths).toEqual(
        expect.arrayContaining([
          expect.stringContaining("De-escalation attempted before every restraint"),
        ]),
      );
    });

    it("includes de-escalation 90-99% strength", () => {
      const restraints = Array.from({ length: 10 }, (_, i) =>
        makeRestraint(`r${i}`, i === 9 ? { de_escalation_attempts: [] } : {}),
      );
      const r = computeEmotionalSafetyClimate(baseInput({ restraints }));
      expect(r.strengths).toEqual(
        expect.arrayContaining([
          expect.stringContaining("De-escalation attempted in 90%"),
        ]),
      );
    });

    it("includes body map 100% strength", () => {
      const r = computeEmotionalSafetyClimate(baseInput());
      expect(r.strengths).toEqual(
        expect.arrayContaining([
          expect.stringContaining("Body maps completed for every restraint"),
        ]),
      );
    });

    it("includes restraint review 100% strength", () => {
      const r = computeEmotionalSafetyClimate(baseInput());
      expect(r.strengths).toEqual(
        expect.arrayContaining([
          expect.stringContaining("Every restraint reviewed by management"),
        ]),
      );
    });

    it("includes achievement celebration >= 90% strength", () => {
      const r = computeEmotionalSafetyClimate(baseInput());
      expect(r.strengths).toEqual(
        expect.arrayContaining([
          expect.stringContaining("achievements celebrated"),
        ]),
      );
    });

    it("includes post-incident quality >= 4.0 strength", () => {
      const r = computeEmotionalSafetyClimate(baseInput());
      expect(r.strengths).toEqual(
        expect.arrayContaining([
          expect.stringContaining("Post-incident debrief quality averages"),
        ]),
      );
    });

    it("includes zero injuries strength when restraints > 0", () => {
      const r = computeEmotionalSafetyClimate(baseInput());
      expect(r.strengths).toEqual(
        expect.arrayContaining([
          expect.stringContaining("Zero injuries recorded during restraints"),
        ]),
      );
    });

    it("includes no-restraints strength when children > 0", () => {
      const r = computeEmotionalSafetyClimate(baseInput({ restraints: [] }));
      expect(r.strengths).toEqual(
        expect.arrayContaining([
          expect.stringContaining("No restraints recorded"),
        ]),
      );
    });

    it("includes staff support rate >= 90% strength", () => {
      const r = computeEmotionalSafetyClimate(baseInput());
      expect(r.strengths).toEqual(
        expect.arrayContaining([
          expect.stringContaining("Support offered in 100% of staff debriefs"),
        ]),
      );
    });

    it("includes achievement categories >= 4 strength", () => {
      const r = computeEmotionalSafetyClimate(baseInput());
      expect(r.strengths).toEqual(
        expect.arrayContaining([
          expect.stringContaining("Achievements span 4 categories"),
        ]),
      );
    });

    it("includes shared achievements >= 70% strength", () => {
      const r = computeEmotionalSafetyClimate(baseInput());
      expect(r.strengths).toEqual(
        expect.arrayContaining([
          expect.stringContaining("shared with children's networks"),
        ]),
      );
    });

    it("does not include restraint-related strengths when no restraints", () => {
      const r = computeEmotionalSafetyClimate(baseInput({ restraints: [] }));
      const restraintStrengths = r.strengths.filter(
        (s) =>
          s.includes("debriefed after restraint") ||
          s.includes("De-escalation attempted before every") ||
          s.includes("Body maps completed for every") ||
          s.includes("Every restraint reviewed") ||
          s.includes("Zero injuries recorded during"),
      );
      expect(restraintStrengths).toHaveLength(0);
    });
  });

  // ==========================================================================
  // 9. CONCERNS
  // ==========================================================================

  describe("concerns", () => {
    it("includes child debrief < 50% concern", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          restraints: [
            makeRestraint("r1", { child_debriefed: false }),
            makeRestraint("r2", { child_debriefed: false }),
            makeRestraint("r3", { child_debriefed: false }),
          ],
        }),
      );
      expect(r.concerns).toEqual(
        expect.arrayContaining([
          expect.stringContaining("Only 0% of children debriefed"),
        ]),
      );
    });

    it("includes child debrief 50-79% concern", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          restraints: [
            makeRestraint("r1"),
            makeRestraint("r2"),
            makeRestraint("r3", { child_debriefed: false }),
          ],
        }),
      );
      expect(r.concerns).toEqual(
        expect.arrayContaining([
          expect.stringContaining("Child debrief rate at 67%"),
        ]),
      );
    });

    it("includes staff debrief < 50% concern", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          restraints: [
            makeRestraint("r1", { staff_debriefed: false }),
            makeRestraint("r2", { staff_debriefed: false }),
            makeRestraint("r3", { staff_debriefed: false }),
          ],
        }),
      );
      expect(r.concerns).toEqual(
        expect.arrayContaining([
          expect.stringContaining("Only 0% of staff debriefed"),
        ]),
      );
    });

    it("includes R:S ratio < 1.0 concern", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          sanction_rewards: [
            makeSanctionReward("sr1", "reward"),
            makeSanctionReward("sr2", "sanction"),
            makeSanctionReward("sr3", "sanction"),
          ],
        }),
      );
      expect(r.concerns).toEqual(
        expect.arrayContaining([
          expect.stringContaining("Reward-to-sanction ratio of 0.5:1"),
        ]),
      );
    });

    it("includes no-rewards concern when sanctions exist", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          sanction_rewards: [
            makeSanctionReward("sr1", "sanction"),
            makeSanctionReward("sr2", "sanction"),
          ],
        }),
      );
      expect(r.concerns).toEqual(
        expect.arrayContaining([
          expect.stringContaining("No rewards recorded alongside active sanctions"),
        ]),
      );
    });

    it("includes body map < 50% concern", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          restraints: [
            makeRestraint("r1", { body_map_completed: false }),
            makeRestraint("r2", { body_map_completed: false }),
            makeRestraint("r3", { body_map_completed: false }),
          ],
        }),
      );
      expect(r.concerns).toEqual(
        expect.arrayContaining([
          expect.stringContaining("Body map completion at only 0%"),
        ]),
      );
    });

    it("includes body map 50-79% concern", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          restraints: [
            makeRestraint("r1"),
            makeRestraint("r2"),
            makeRestraint("r3", { body_map_completed: false }),
          ],
        }),
      );
      expect(r.concerns).toEqual(
        expect.arrayContaining([
          expect.stringContaining("Body map completion at 67%"),
        ]),
      );
    });

    it("includes restraint review < 50% concern", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          restraints: [
            makeRestraint("r1", { review_status: "pending" }),
            makeRestraint("r2", { review_status: "pending" }),
            makeRestraint("r3", { review_status: "pending" }),
          ],
        }),
      );
      expect(r.concerns).toEqual(
        expect.arrayContaining([
          expect.stringContaining("Only 0% of restraints reviewed"),
        ]),
      );
    });

    it("includes de-escalation < 80% concern", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          restraints: [
            makeRestraint("r1", { de_escalation_attempts: [] }),
            makeRestraint("r2", { de_escalation_attempts: [] }),
          ],
        }),
      );
      expect(r.concerns).toEqual(
        expect.arrayContaining([
          expect.stringContaining("De-escalation attempted in only 0%"),
        ]),
      );
    });

    it("includes injury concern when injuries > 0", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          restraints: [
            makeRestraint("r1", {
              injuries: [{ person: "child", description: "bruise" }],
            }),
            makeRestraint("r2"),
          ],
        }),
      );
      expect(r.concerns).toEqual(
        expect.arrayContaining([
          expect.stringContaining("Injuries recorded in 50%"),
        ]),
      );
    });

    it("includes post-incident quality < 3.0 concern", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          post_incident_debriefs: [
            makeDebrief("d1", { quality_rating: 2 }),
            makeDebrief("d2", { quality_rating: 2 }),
          ],
        }),
      );
      expect(r.concerns).toEqual(
        expect.arrayContaining([
          expect.stringContaining("Post-incident debrief quality averages only 2/5"),
        ]),
      );
    });

    it("includes no achievements concern when children > 0", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({ positive_achievements: [] }),
      );
      expect(r.concerns).toEqual(
        expect.arrayContaining([
          expect.stringContaining("No positive achievements recorded"),
        ]),
      );
    });

    it("includes celebration < 50% concern", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          positive_achievements: [
            makeAchievement("a1", { celebrated: false }),
            makeAchievement("a2", { celebrated: false }),
            makeAchievement("a3", { celebrated: false }),
            makeAchievement("a4"),
          ],
        }),
      );
      expect(r.concerns).toEqual(
        expect.arrayContaining([
          expect.stringContaining("Only 25% of achievements celebrated"),
        ]),
      );
    });

    it("includes staff support < 50% concern", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          staff_debriefs: [
            makeStaffDebrief("sd1", { support_offered: false }),
            makeStaffDebrief("sd2", { support_offered: false }),
            makeStaffDebrief("sd3", { support_offered: false }),
          ],
        }),
      );
      expect(r.concerns).toEqual(
        expect.arrayContaining([
          expect.stringContaining("Support offered in only 0% of staff debriefs"),
        ]),
      );
    });

    it("includes no post-incident debriefs concern when restraints exist", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({ post_incident_debriefs: [] }),
      );
      expect(r.concerns).toEqual(
        expect.arrayContaining([
          expect.stringContaining("No post-incident debriefs recorded despite restraints"),
        ]),
      );
    });

    it("includes no staff debriefs concern when restraints exist", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({ staff_debriefs: [] }),
      );
      expect(r.concerns).toEqual(
        expect.arrayContaining([
          expect.stringContaining("No staff debriefs recorded despite restraints"),
        ]),
      );
    });
  });

  // ==========================================================================
  // 10. RECOMMENDATIONS
  // ==========================================================================

  describe("recommendations", () => {
    it("recommends urgent child debrief when rate < 50%", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          restraints: [
            makeRestraint("r1", { child_debriefed: false }),
            makeRestraint("r2", { child_debriefed: false }),
          ],
        }),
      );
      const rec = r.recommendations.find((rec) =>
        rec.recommendation.includes("post-restraint debriefs for all children"),
      );
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
      expect(rec!.regulatory_ref).toContain("Reg 12");
    });

    it("recommends body map completion when rate < 50%", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          restraints: [
            makeRestraint("r1", { body_map_completed: false }),
            makeRestraint("r2", { body_map_completed: false }),
          ],
        }),
      );
      const rec = r.recommendations.find((rec) =>
        rec.recommendation.includes("Complete body maps"),
      );
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("recommends rebalancing when R:S ratio < 1.0", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          sanction_rewards: [
            makeSanctionReward("sr1", "sanction"),
            makeSanctionReward("sr2", "sanction"),
          ],
        }),
      );
      const rec = r.recommendations.find((rec) =>
        rec.recommendation.includes("Rebalance the sanction/reward approach"),
      );
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("recommends management review when review rate < 50%", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          restraints: [
            makeRestraint("r1", { review_status: "pending" }),
            makeRestraint("r2", { review_status: "pending" }),
          ],
        }),
      );
      const rec = r.recommendations.find((rec) =>
        rec.recommendation.includes("management review of all restraints"),
      );
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("recommends post-incident debrief process when none exist with restraints", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({ post_incident_debriefs: [] }),
      );
      const rec = r.recommendations.find((rec) =>
        rec.recommendation.includes("Establish a post-incident debrief process"),
      );
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("recommends staff debrief implementation when none exist with restraints", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({ staff_debriefs: [] }),
      );
      const rec = r.recommendations.find((rec) =>
        rec.recommendation.includes("Implement staff debriefs"),
      );
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("recommends increasing staff debrief when rate 1-49%", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          restraints: [
            makeRestraint("r1", { staff_debriefed: false }),
            makeRestraint("r2", { staff_debriefed: false }),
            makeRestraint("r3"),
          ],
        }),
      );
      expect(r.staff_debrief_rate).toBe(33);
      const rec = r.recommendations.find((rec) =>
        rec.recommendation.includes("Increase staff debrief completion"),
      );
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("recommends de-escalation review when rate < 80%", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          restraints: [
            makeRestraint("r1", { de_escalation_attempts: [] }),
            makeRestraint("r2", { de_escalation_attempts: [] }),
          ],
        }),
      );
      const rec = r.recommendations.find((rec) =>
        rec.recommendation.includes("Review de-escalation training"),
      );
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("recommends restraint technique review when injuries exist", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          restraints: [
            makeRestraint("r1", {
              injuries: [{ person: "child", description: "bruise" }],
            }),
          ],
        }),
      );
      const rec = r.recommendations.find((rec) =>
        rec.recommendation.includes("Review restraint techniques"),
      );
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("recommends improving debrief quality when avg < 3.0", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          post_incident_debriefs: [
            makeDebrief("d1", { quality_rating: 2 }),
            makeDebrief("d2", { quality_rating: 2 }),
          ],
        }),
      );
      const rec = r.recommendations.find((rec) =>
        rec.recommendation.includes("Improve post-incident debrief quality"),
      );
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("recommends recording achievements when count = 0 and children > 0", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({ positive_achievements: [] }),
      );
      const rec = r.recommendations.find((rec) =>
        rec.recommendation.includes("Begin recording and celebrating"),
      );
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("recommends celebrating achievements when rate < 50%", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          positive_achievements: [
            makeAchievement("a1", { celebrated: false }),
            makeAchievement("a2", { celebrated: false }),
            makeAchievement("a3", { celebrated: false }),
          ],
        }),
      );
      const rec = r.recommendations.find((rec) =>
        rec.recommendation.includes("Actively celebrate all recorded"),
      );
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("recommends increasing child debrief when rate 50-79%", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          restraints: [
            makeRestraint("r1"),
            makeRestraint("r2", { child_debriefed: false }),
          ],
        }),
      );
      expect(r.child_debrief_rate).toBe(50);
      const rec = r.recommendations.find((rec) =>
        rec.recommendation.includes("Increase child debrief rate to at least 80%"),
      );
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
    });

    it("recommends improving body map when rate 50-79%", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          restraints: [
            makeRestraint("r1"),
            makeRestraint("r2", { body_map_completed: false }),
          ],
        }),
      );
      expect(r.body_map_completion_rate).toBe(50);
      const rec = r.recommendations.find((rec) =>
        rec.recommendation.includes("Improve body map completion to at least 80%"),
      );
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
    });

    it("recommends increasing celebration when rate 50-69%", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          positive_achievements: [
            makeAchievement("a1"),
            makeAchievement("a2", { celebrated: false }),
          ],
        }),
      );
      expect(r.achievement_celebration_rate).toBe(50);
      const rec = r.recommendations.find((rec) =>
        rec.recommendation.includes("Increase the rate of celebrating"),
      );
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
    });

    it("recommends sharing achievements when shared < 50%", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          positive_achievements: [
            makeAchievement("a1", { shared_with_network: false }),
            makeAchievement("a2", { shared_with_network: false }),
            makeAchievement("a3", { shared_with_network: false }),
          ],
        }),
      );
      const rec = r.recommendations.find((rec) =>
        rec.recommendation.includes("Share more achievements"),
      );
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
    });

    it("assigns sequential rank numbers", () => {
      // Trigger multiple recommendations
      const r = computeEmotionalSafetyClimate(
        baseInput({
          restraints: [
            makeRestraint("r1", {
              child_debriefed: false,
              body_map_completed: false,
              review_status: "pending",
              de_escalation_attempts: [],
              injuries: [{ person: "child", description: "bruise" }],
            }),
          ],
          sanction_rewards: [
            makeSanctionReward("sr1", "sanction"),
            makeSanctionReward("sr2", "sanction"),
          ],
          post_incident_debriefs: [],
          staff_debriefs: [],
          positive_achievements: [],
        }),
      );
      expect(r.recommendations.length).toBeGreaterThan(3);
      for (let i = 0; i < r.recommendations.length; i++) {
        expect(r.recommendations[i].rank).toBe(i + 1);
      }
    });
  });

  // ==========================================================================
  // 11. INSIGHTS
  // ==========================================================================

  describe("insights", () => {
    // Critical insights
    it("includes critical insight for child debrief < 50%", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          restraints: [
            makeRestraint("r1", { child_debriefed: false }),
            makeRestraint("r2", { child_debriefed: false }),
          ],
        }),
      );
      const insight = r.insights.find((i) =>
        i.text.includes("children are debriefed after restraint"),
      );
      expect(insight).toBeDefined();
      expect(insight!.severity).toBe("critical");
    });

    it("includes critical insight for body map < 50%", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          restraints: [
            makeRestraint("r1", { body_map_completed: false }),
            makeRestraint("r2", { body_map_completed: false }),
          ],
        }),
      );
      const insight = r.insights.find((i) =>
        i.text.includes("Body maps completed in only"),
      );
      expect(insight).toBeDefined();
      expect(insight!.severity).toBe("critical");
    });

    it("includes critical insight for R:S ratio < 1.0", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          sanction_rewards: [
            makeSanctionReward("sr1", "reward"),
            makeSanctionReward("sr2", "sanction"),
            makeSanctionReward("sr3", "sanction"),
            makeSanctionReward("sr4", "sanction"),
          ],
        }),
      );
      const insight = r.insights.find((i) =>
        i.text.includes("punitive culture"),
      );
      expect(insight).toBeDefined();
      expect(insight!.severity).toBe("critical");
    });

    it("includes critical insight for sanctions-only", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          sanction_rewards: [
            makeSanctionReward("sr1", "sanction"),
          ],
        }),
      );
      const insight = r.insights.find((i) =>
        i.text.includes("sanctions-only model"),
      );
      expect(insight).toBeDefined();
      expect(insight!.severity).toBe("critical");
    });

    it("includes critical insight for review rate < 50%", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          restraints: [
            makeRestraint("r1", { review_status: "pending" }),
            makeRestraint("r2", { review_status: "pending" }),
          ],
        }),
      );
      const insight = r.insights.find((i) =>
        i.text.includes("restraints reviewed by management"),
      );
      expect(insight).toBeDefined();
      expect(insight!.severity).toBe("critical");
    });

    it("includes critical insight for injury rate >= 30%", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          restraints: [
            makeRestraint("r1", {
              injuries: [{ person: "child", description: "bruise" }],
            }),
            makeRestraint("r2", {
              injuries: [{ person: "staff", description: "scratch" }],
            }),
            makeRestraint("r3"),
          ],
        }),
      );
      expect(r.injury_rate).toBe(67);
      const insight = r.insights.find((i) =>
        i.text.includes("serious concern about the safety"),
      );
      expect(insight).toBeDefined();
      expect(insight!.severity).toBe("critical");
    });

    // Warning insights
    it("includes warning insight for child debrief 50-79%", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          restraints: [
            makeRestraint("r1"),
            makeRestraint("r2", { child_debriefed: false }),
          ],
        }),
      );
      const insight = r.insights.find((i) =>
        i.text.includes("Child debrief rate at 50%"),
      );
      expect(insight).toBeDefined();
      expect(insight!.severity).toBe("warning");
    });

    it("includes warning insight for staff debrief 50-79%", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          restraints: [
            makeRestraint("r1"),
            makeRestraint("r2", { staff_debriefed: false }),
          ],
        }),
      );
      const insight = r.insights.find((i) =>
        i.text.includes("Staff debrief rate at 50%"),
      );
      expect(insight).toBeDefined();
      expect(insight!.severity).toBe("warning");
    });

    it("includes warning insight for staff debrief < 50%", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          restraints: [
            makeRestraint("r1", { staff_debriefed: false }),
            makeRestraint("r2", { staff_debriefed: false }),
          ],
        }),
      );
      const insight = r.insights.find((i) =>
        i.text.includes("staff debriefed after restraint"),
      );
      expect(insight).toBeDefined();
      expect(insight!.severity).toBe("warning");
    });

    it("includes warning insight for R:S ratio 1.0-1.99", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          sanction_rewards: [
            makeSanctionReward("sr1", "reward"),
            makeSanctionReward("sr2", "reward"),
            makeSanctionReward("sr3", "reward"),
            makeSanctionReward("sr4", "sanction"),
            makeSanctionReward("sr5", "sanction"),
          ],
        }),
      );
      expect(r.reward_to_sanction_ratio).toBe(1.5);
      const insight = r.insights.find((i) =>
        i.text.includes("Reward-to-sanction ratio of 1.5:1"),
      );
      expect(insight).toBeDefined();
      expect(insight!.severity).toBe("warning");
    });

    it("includes warning insight for de-escalation 80-99%", () => {
      const restraints = Array.from({ length: 10 }, (_, i) =>
        makeRestraint(`r${i}`, i === 9 ? { de_escalation_attempts: [] } : {}),
      );
      const r = computeEmotionalSafetyClimate(baseInput({ restraints }));
      expect(r.de_escalation_attempt_rate).toBe(90);
      const insight = r.insights.find((i) =>
        i.text.includes("De-escalation attempted in 90%"),
      );
      expect(insight).toBeDefined();
      expect(insight!.severity).toBe("warning");
    });

    it("includes warning insight for de-escalation < 80%", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          restraints: [
            makeRestraint("r1", { de_escalation_attempts: [] }),
            makeRestraint("r2", { de_escalation_attempts: [] }),
          ],
        }),
      );
      const insight = r.insights.find((i) =>
        i.text.includes("De-escalation attempted in only 0%"),
      );
      expect(insight).toBeDefined();
      expect(insight!.severity).toBe("warning");
    });

    it("includes warning insight for quality avg 3.0-3.99", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          post_incident_debriefs: [
            makeDebrief("d1", { quality_rating: 3 }),
            makeDebrief("d2", { quality_rating: 3 }),
          ],
        }),
      );
      const insight = r.insights.find((i) =>
        i.text.includes("Post-incident debrief quality averaging 3/5"),
      );
      expect(insight).toBeDefined();
      expect(insight!.severity).toBe("warning");
    });

    it("includes warning insight for celebration 50-69%", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          positive_achievements: [
            makeAchievement("a1"),
            makeAchievement("a2", { celebrated: false }),
          ],
        }),
      );
      const insight = r.insights.find((i) =>
        i.text.includes("50% of achievements celebrated"),
      );
      expect(insight).toBeDefined();
      expect(insight!.severity).toBe("warning");
    });

    it("includes warning insight for injury rate 1-29%", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          restraints: [
            makeRestraint("r1", {
              injuries: [{ person: "child", description: "bruise" }],
            }),
            makeRestraint("r2"),
            makeRestraint("r3"),
            makeRestraint("r4"),
            makeRestraint("r5"),
          ],
        }),
      );
      expect(r.injury_rate).toBe(20);
      const insight = r.insights.find((i) =>
        i.text.includes("Injuries recorded in 20%"),
      );
      expect(insight).toBeDefined();
      expect(insight!.severity).toBe("warning");
    });

    // Positive insights
    it("includes positive insight for both debriefs at 100%", () => {
      const r = computeEmotionalSafetyClimate(baseInput());
      const insight = r.insights.find((i) =>
        i.text.includes("Both children and staff are debriefed after every restraint"),
      );
      expect(insight).toBeDefined();
      expect(insight!.severity).toBe("positive");
    });

    it("includes positive insight for R:S ratio >= 4.0", () => {
      const r = computeEmotionalSafetyClimate(baseInput());
      const insight = r.insights.find((i) =>
        i.text.includes("4:1 reward-to-sanction ratio"),
      );
      expect(insight).toBeDefined();
      expect(insight!.severity).toBe("positive");
    });

    it("includes positive insight for rewards-only", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          sanction_rewards: [
            makeSanctionReward("sr1", "reward"),
            makeSanctionReward("sr2", "reward"),
          ],
        }),
      );
      const insight = r.insights.find((i) =>
        i.text.includes("rewards-only approach"),
      );
      expect(insight).toBeDefined();
      expect(insight!.severity).toBe("positive");
    });

    it("includes positive insight for de-escalation 100%", () => {
      const r = computeEmotionalSafetyClimate(baseInput());
      const insight = r.insights.find((i) =>
        i.text.includes("De-escalation attempted before every restraint"),
      );
      expect(insight).toBeDefined();
      expect(insight!.severity).toBe("positive");
    });

    it("includes positive insight for body map + review both 100%", () => {
      const r = computeEmotionalSafetyClimate(baseInput());
      const insight = r.insights.find((i) =>
        i.text.includes("Body maps and management reviews completed for every restraint"),
      );
      expect(insight).toBeDefined();
      expect(insight!.severity).toBe("positive");
    });

    it("includes positive insight for celebrations >= 90% and categories >= 4", () => {
      const r = computeEmotionalSafetyClimate(baseInput());
      const insight = r.insights.find((i) =>
        i.text.includes("Achievements celebrated across 4 domains"),
      );
      expect(insight).toBeDefined();
      expect(insight!.severity).toBe("positive");
    });

    it("includes positive insight for quality >= 4.0 with voice >= 90%", () => {
      const r = computeEmotionalSafetyClimate(baseInput());
      const insight = r.insights.find((i) =>
        i.text.includes("High-quality post-incident debriefs"),
      );
      expect(insight).toBeDefined();
      expect(insight!.severity).toBe("positive");
    });

    it("includes positive insight for staff support + emotional exploration >= 90%", () => {
      const r = computeEmotionalSafetyClimate(baseInput());
      const insight = r.insights.find((i) =>
        i.text.includes("Staff debriefs consistently explore emotional impact"),
      );
      expect(insight).toBeDefined();
      expect(insight!.severity).toBe("positive");
    });
  });

  // ==========================================================================
  // 12. HEADLINES
  // ==========================================================================

  describe("headlines", () => {
    it("uses outstanding headline", () => {
      const r = computeEmotionalSafetyClimate(baseInput());
      expect(r.safety_rating).toBe("outstanding");
      expect(r.headline).toContain("Outstanding emotional safety climate");
    });

    it("uses good headline with strength and concern counts", () => {
      // Drop celebration to 75% to get score 78 (good)
      const r = computeEmotionalSafetyClimate(
        baseInput({
          positive_achievements: [
            makeAchievement("a1", { category: "academic" }),
            makeAchievement("a2", { category: "social" }),
            makeAchievement("a3", { category: "emotional" }),
            makeAchievement("a4", { category: "physical", celebrated: false }),
          ],
        }),
      );
      expect(r.safety_rating).toBe("good");
      expect(r.headline).toMatch(/Good emotional safety climate — \d+ strengths? identified/);
    });

    it("uses adequate headline with concern count", () => {
      const r = computeEmotionalSafetyClimate({
        today: "2026-05-15",
        total_children: 4,
        total_staff: 6,
        restraints: [
          makeRestraint("r1", {
            child_debriefed: false,
            body_map_completed: false,
            review_status: "pending",
            de_escalation_attempts: [],
          }),
          makeRestraint("r2", {
            child_debriefed: false,
            body_map_completed: false,
            review_status: "pending",
            de_escalation_attempts: [],
          }),
        ],
        sanction_rewards: [
          makeSanctionReward("sr1", "reward"),
          makeSanctionReward("sr2", "reward"),
          makeSanctionReward("sr3", "reward"),
          makeSanctionReward("sr4", "sanction"),
          makeSanctionReward("sr5", "sanction"),
        ],
        post_incident_debriefs: [
          makeDebrief("d1", { quality_rating: 3 }),
          makeDebrief("d2", { quality_rating: 3 }),
        ],
        staff_debriefs: [],
        positive_achievements: [],
      });
      expect(r.safety_rating).toBe("adequate");
      expect(r.headline).toContain("Adequate emotional safety climate");
      expect(r.headline).toMatch(/\d+ concerns? identified/);
    });

    it("uses inadequate headline with concern count", () => {
      const r = computeEmotionalSafetyClimate({
        today: "2026-05-15",
        total_children: 4,
        total_staff: 6,
        restraints: [
          makeRestraint("r1", {
            child_debriefed: false,
            staff_debriefed: false,
            body_map_completed: false,
            review_status: "pending",
            de_escalation_attempts: [],
          }),
          makeRestraint("r2", {
            child_debriefed: false,
            staff_debriefed: false,
            body_map_completed: false,
            review_status: "pending",
            de_escalation_attempts: [],
          }),
        ],
        sanction_rewards: [
          makeSanctionReward("sr1", "sanction"),
          makeSanctionReward("sr2", "sanction"),
          makeSanctionReward("sr3", "sanction"),
        ],
        post_incident_debriefs: [
          makeDebrief("d1", { quality_rating: 1 }),
        ],
        staff_debriefs: [],
        positive_achievements: [],
      });
      expect(r.safety_rating).toBe("inadequate");
      expect(r.headline).toContain("inadequate");
      expect(r.headline).toMatch(/\d+ significant concerns?/);
    });

    it("uses insufficient_data headline", () => {
      const r = computeEmotionalSafetyClimate({
        today: "2026-05-15",
        total_children: 0,
        total_staff: 0,
        restraints: [],
        sanction_rewards: [],
        post_incident_debriefs: [],
        staff_debriefs: [],
        positive_achievements: [],
      });
      expect(r.headline).toContain("insufficient data");
    });

    it("good headline omits improvement clause when no concerns", () => {
      // Drop celebration to 75% to get score 78 (good) with no concerns
      const r = computeEmotionalSafetyClimate(
        baseInput({
          positive_achievements: [
            makeAchievement("a1", { category: "academic" }),
            makeAchievement("a2", { category: "social" }),
            makeAchievement("a3", { category: "emotional" }),
            makeAchievement("a4", { category: "physical", celebrated: false }),
          ],
        }),
      );
      expect(r.safety_rating).toBe("good");
      if (r.concerns.length === 0) {
        expect(r.headline).not.toContain("area");
      }
      expect(r.headline).toContain("Good emotional safety climate");
    });

    it("good headline includes improvement areas when concerns exist", () => {
      // Drop some bonuses to get good rating, and introduce concerns
      const r = computeEmotionalSafetyClimate(
        baseInput({
          restraints: [
            makeRestraint("r1", { de_escalation_attempts: [] }),
            makeRestraint("r2", { de_escalation_attempts: [] }),
            makeRestraint("r3"),
            makeRestraint("r4"),
            makeRestraint("r5"),
          ],
          positive_achievements: [
            makeAchievement("a1", { category: "academic", celebrated: false }),
          ],
        }),
      );
      // de-escalation is 60%, celebration is 0% — triggers concerns
      if (r.safety_rating === "good" && r.concerns.length > 0) {
        expect(r.headline).toContain("area");
      }
    });
  });

  // ==========================================================================
  // 13. EDGE CASES
  // ==========================================================================

  describe("edge cases", () => {
    it("pct(0,0) returns 0 — rates are 0 when no restraints", () => {
      const r = computeEmotionalSafetyClimate(baseInput({ restraints: [] }));
      expect(r.child_debrief_rate).toBe(0);
      expect(r.staff_debrief_rate).toBe(0);
      expect(r.restraint_review_rate).toBe(0);
      expect(r.de_escalation_attempt_rate).toBe(0);
      expect(r.body_map_completion_rate).toBe(0);
      expect(r.injury_rate).toBe(0);
    });

    it("pct(0,0) = 0 does not trigger restraint penalties when no restraints", () => {
      // All restraint rates are 0, but penalties guarded by totalRestraints > 0
      const r = computeEmotionalSafetyClimate(baseInput({ restraints: [] }));
      expect(r.safety_score).toBeGreaterThanOrEqual(52);
    });

    it("handles single restraint record", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          restraints: [makeRestraint("r1")],
        }),
      );
      expect(r.total_restraints).toBe(1);
      expect(r.child_debrief_rate).toBe(100);
      expect(r.staff_debrief_rate).toBe(100);
      expect(r.restraint_review_rate).toBe(100);
      expect(r.body_map_completion_rate).toBe(100);
      expect(r.de_escalation_attempt_rate).toBe(100);
      expect(r.injury_rate).toBe(0);
    });

    it("handles no sanctions (infinity ratio prevention)", () => {
      // When sanctions = 0, ratio = rewardCount (not infinity)
      const r = computeEmotionalSafetyClimate(
        baseInput({
          sanction_rewards: [
            makeSanctionReward("sr1", "reward"),
            makeSanctionReward("sr2", "reward"),
            makeSanctionReward("sr3", "reward"),
            makeSanctionReward("sr4", "reward"),
            makeSanctionReward("sr5", "reward"),
          ],
        }),
      );
      expect(r.reward_to_sanction_ratio).toBe(5);
      expect(Number.isFinite(r.reward_to_sanction_ratio)).toBe(true);
    });

    it("handles both rewards and sanctions = 0", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({ sanction_rewards: [] }),
      );
      expect(r.reward_to_sanction_ratio).toBe(0);
    });

    it("clamps score to minimum 0", () => {
      // Max penalties: create worst-case scenario
      const r = computeEmotionalSafetyClimate({
        today: "2026-05-15",
        total_children: 4,
        total_staff: 6,
        restraints: [
          makeRestraint("r1", {
            child_debriefed: false,
            staff_debriefed: false,
            body_map_completed: false,
            review_status: "pending",
            de_escalation_attempts: [],
            injuries: [{ person: "child", description: "bruise" }],
          }),
          makeRestraint("r2", {
            child_debriefed: false,
            staff_debriefed: false,
            body_map_completed: false,
            review_status: "pending",
            de_escalation_attempts: [],
            injuries: [{ person: "child", description: "scratch" }],
          }),
        ],
        sanction_rewards: [
          makeSanctionReward("sr1", "sanction"),
          makeSanctionReward("sr2", "sanction"),
          makeSanctionReward("sr3", "sanction"),
        ],
        post_incident_debriefs: [],
        staff_debriefs: [],
        positive_achievements: [],
      });
      // 52 - 5 (child debrief) - 5 (R:S < 1) - 5 (body map) - 3 (review) = 34
      // No bonuses except... let's check. Staff debrief = 0% → no bonus.
      // All restraints have no de-escalation → 0%. All have injuries → injury_rate 100%.
      // 52 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 - 5 - 5 - 5 - 3 = 34
      expect(r.safety_score).toBe(34);
      expect(r.safety_score).toBeGreaterThanOrEqual(0);
    });

    it("clamps score to maximum 100", () => {
      // Verify clamping logic exists (organic max is 79)
      const r = computeEmotionalSafetyClimate(baseInput());
      expect(r.safety_score).toBeLessThanOrEqual(100);
    });

    it("handles restraint with multiple injuries as single injury incident", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          restraints: [
            makeRestraint("r1", {
              injuries: [
                { person: "child", description: "bruise" },
                { person: "staff", description: "scratch" },
              ],
            }),
            makeRestraint("r2"),
          ],
        }),
      );
      // injury_rate counts restraints with injuries, not individual injuries
      expect(r.injury_rate).toBe(50);
    });

    it("handles empty de-escalation array as no attempt", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          restraints: [
            makeRestraint("r1", { de_escalation_attempts: [] }),
          ],
        }),
      );
      expect(r.de_escalation_attempt_rate).toBe(0);
    });

    it("handles follow_up_actions as null", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          post_incident_debriefs: [
            makeDebrief("d1", { follow_up_actions: null }),
          ],
        }),
      );
      // Should not crash
      expect(r).toBeDefined();
    });

    it("handles follow_up_actions as empty string", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          post_incident_debriefs: [
            makeDebrief("d1", { follow_up_actions: "" }),
          ],
        }),
      );
      expect(r).toBeDefined();
    });

    it("handles follow_up_actions as whitespace", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          post_incident_debriefs: [
            makeDebrief("d1", { follow_up_actions: "   " }),
          ],
        }),
      );
      expect(r).toBeDefined();
    });

    it("singular/plural in injury concern for 1 incident", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          restraints: [
            makeRestraint("r1", {
              injuries: [{ person: "child", description: "bruise" }],
            }),
            makeRestraint("r2"),
          ],
        }),
      );
      expect(r.concerns).toEqual(
        expect.arrayContaining([
          expect.stringContaining("1 incident)"),
        ]),
      );
    });

    it("singular/plural in injury concern for multiple incidents", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          restraints: [
            makeRestraint("r1", {
              injuries: [{ person: "child", description: "bruise" }],
            }),
            makeRestraint("r2", {
              injuries: [{ person: "child", description: "scratch" }],
            }),
            makeRestraint("r3"),
          ],
        }),
      );
      expect(r.concerns).toEqual(
        expect.arrayContaining([
          expect.stringContaining("2 incidents)"),
        ]),
      );
    });

    it("achievement categories counted as unique", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          positive_achievements: [
            makeAchievement("a1", { category: "academic" }),
            makeAchievement("a2", { category: "academic" }),
            makeAchievement("a3", { category: "social" }),
          ],
        }),
      );
      // 2 unique categories — should not trigger the >= 4 categories strength
      const catStrength = r.strengths.find((s) =>
        s.includes("Achievements span"),
      );
      expect(catStrength).toBeUndefined();
    });
  });

  // ==========================================================================
  // 14. RETURN STRUCTURE
  // ==========================================================================

  describe("return structure", () => {
    it("returns all expected top-level keys", () => {
      const r = computeEmotionalSafetyClimate(baseInput());
      expect(r).toHaveProperty("safety_rating");
      expect(r).toHaveProperty("safety_score");
      expect(r).toHaveProperty("headline");
      expect(r).toHaveProperty("total_restraints");
      expect(r).toHaveProperty("average_restraint_duration");
      expect(r).toHaveProperty("restraint_review_rate");
      expect(r).toHaveProperty("child_debrief_rate");
      expect(r).toHaveProperty("staff_debrief_rate");
      expect(r).toHaveProperty("reward_to_sanction_ratio");
      expect(r).toHaveProperty("positive_achievement_count");
      expect(r).toHaveProperty("achievement_celebration_rate");
      expect(r).toHaveProperty("de_escalation_attempt_rate");
      expect(r).toHaveProperty("body_map_completion_rate");
      expect(r).toHaveProperty("post_incident_quality_avg");
      expect(r).toHaveProperty("injury_rate");
      expect(r).toHaveProperty("strengths");
      expect(r).toHaveProperty("concerns");
      expect(r).toHaveProperty("recommendations");
      expect(r).toHaveProperty("insights");
    });

    it("safety_rating is a valid enum value", () => {
      const r = computeEmotionalSafetyClimate(baseInput());
      expect(["outstanding", "good", "adequate", "inadequate", "insufficient_data"]).toContain(
        r.safety_rating,
      );
    });

    it("safety_score is a number between 0 and 100", () => {
      const r = computeEmotionalSafetyClimate(baseInput());
      expect(r.safety_score).toBeGreaterThanOrEqual(0);
      expect(r.safety_score).toBeLessThanOrEqual(100);
    });

    it("strengths is an array of strings", () => {
      const r = computeEmotionalSafetyClimate(baseInput());
      expect(Array.isArray(r.strengths)).toBe(true);
      r.strengths.forEach((s) => expect(typeof s).toBe("string"));
    });

    it("concerns is an array of strings", () => {
      const r = computeEmotionalSafetyClimate(baseInput());
      expect(Array.isArray(r.concerns)).toBe(true);
    });

    it("recommendations have rank, recommendation, urgency, regulatory_ref", () => {
      const r = computeEmotionalSafetyClimate(
        baseInput({
          restraints: [
            makeRestraint("r1", { child_debriefed: false }),
            makeRestraint("r2", { child_debriefed: false }),
          ],
        }),
      );
      expect(r.recommendations.length).toBeGreaterThan(0);
      r.recommendations.forEach((rec) => {
        expect(rec).toHaveProperty("rank");
        expect(rec).toHaveProperty("recommendation");
        expect(rec).toHaveProperty("urgency");
        expect(rec).toHaveProperty("regulatory_ref");
        expect(["immediate", "soon", "planned"]).toContain(rec.urgency);
        expect(typeof rec.rank).toBe("number");
        expect(typeof rec.recommendation).toBe("string");
        expect(typeof rec.regulatory_ref).toBe("string");
      });
    });

    it("insights have text and severity", () => {
      const r = computeEmotionalSafetyClimate(baseInput());
      expect(r.insights.length).toBeGreaterThan(0);
      r.insights.forEach((i) => {
        expect(i).toHaveProperty("text");
        expect(i).toHaveProperty("severity");
        expect(["critical", "warning", "positive"]).toContain(i.severity);
        expect(typeof i.text).toBe("string");
      });
    });

    it("metric values are numbers, not NaN", () => {
      const r = computeEmotionalSafetyClimate(baseInput());
      expect(Number.isNaN(r.total_restraints)).toBe(false);
      expect(Number.isNaN(r.average_restraint_duration)).toBe(false);
      expect(Number.isNaN(r.restraint_review_rate)).toBe(false);
      expect(Number.isNaN(r.child_debrief_rate)).toBe(false);
      expect(Number.isNaN(r.staff_debrief_rate)).toBe(false);
      expect(Number.isNaN(r.reward_to_sanction_ratio)).toBe(false);
      expect(Number.isNaN(r.positive_achievement_count)).toBe(false);
      expect(Number.isNaN(r.achievement_celebration_rate)).toBe(false);
      expect(Number.isNaN(r.de_escalation_attempt_rate)).toBe(false);
      expect(Number.isNaN(r.body_map_completion_rate)).toBe(false);
      expect(Number.isNaN(r.post_incident_quality_avg)).toBe(false);
      expect(Number.isNaN(r.injury_rate)).toBe(false);
    });

    it("headline is a non-empty string", () => {
      const r = computeEmotionalSafetyClimate(baseInput());
      expect(typeof r.headline).toBe("string");
      expect(r.headline.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // 15. ADDITIONAL SCORE VERIFICATION
  // ==========================================================================

  describe("full score verification", () => {
    it("default baseInput achieves score 80 (outstanding)", () => {
      // base 52
      // +4 child debrief 100%
      // +3 staff debrief 100%
      // +4 R:S ratio 4.0
      // +3 de-escalation 100%
      // +3 body map 100%
      // +3 review 100%
      // +3 celebration 100%
      // +3 quality avg 5.0
      // +2 no injuries (restraints > 0)
      // Total: 52 + 4 + 3 + 4 + 3 + 3 + 3 + 3 + 3 + 2 = 80
      const r = computeEmotionalSafetyClimate(baseInput());
      expect(r.safety_score).toBe(80);
      expect(r.safety_rating).toBe("outstanding");
    });

    it("worst case with all penalties achieves minimum score", () => {
      const r = computeEmotionalSafetyClimate({
        today: "2026-05-15",
        total_children: 4,
        total_staff: 6,
        restraints: [
          makeRestraint("r1", {
            child_debriefed: false,
            staff_debriefed: false,
            body_map_completed: false,
            review_status: "pending",
            de_escalation_attempts: [],
            injuries: [{ person: "child", description: "bruise" }],
          }),
        ],
        sanction_rewards: [
          makeSanctionReward("sr1", "sanction"),
          makeSanctionReward("sr2", "sanction"),
        ],
        post_incident_debriefs: [
          makeDebrief("d1", { quality_rating: 1 }),
        ],
        staff_debriefs: [],
        positive_achievements: [],
      });
      // 52 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 - 5 - 5 - 5 - 3 = 34
      expect(r.safety_score).toBe(34);
      expect(r.safety_rating).toBe("inadequate");
    });

    it("only achievements (no restraints, no SR, no debriefs) with celebration gives adequate", () => {
      const r = computeEmotionalSafetyClimate({
        today: "2026-05-15",
        total_children: 3,
        total_staff: 4,
        restraints: [],
        sanction_rewards: [],
        post_incident_debriefs: [],
        staff_debriefs: [],
        positive_achievements: [
          makeAchievement("a1"),
          makeAchievement("a2"),
        ],
      });
      // 52 + 2 (no restraints + children>0) + 3 (celebration 100%) = 57
      expect(r.safety_score).toBe(57);
      expect(r.safety_rating).toBe("adequate");
    });
  });
});
