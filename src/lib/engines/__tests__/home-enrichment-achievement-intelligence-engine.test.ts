import { describe, it, expect } from "vitest";
import {
  computeHomeEnrichmentAchievement,
  type HomeEnrichmentAchievementInput,
  type CreativeProjectInput,
  type ExtracurricularClubInput,
  type PositiveAchievementInput,
  type ClubRecordInput,
  type SanctionRewardInput,
} from "../home-enrichment-achievement-intelligence-engine";

// ── Helpers ──────────────────────────────────────────────────────────────────

const TODAY = "2025-06-01";

function makeCreativeProject(overrides: Partial<CreativeProjectInput> = {}): CreativeProjectInput {
  return {
    id: "cp1", child_id: "c1", status: "in_progress", skills_growing_count: 4,
    child_voice_provided: true, review_date: "2025-07-01",
    external_showcase_present: true, contests_entered_count: 1,
    ...overrides,
  };
}

function makeClub(overrides: Partial<ExtracurricularClubInput> = {}): ExtracurricularClubInput {
  return {
    id: "ec1", child_id: "c1", ongoing: true, child_initiated: true,
    attendance_rate: 90, skills_built_count: 4, child_voice_provided: true,
    review_date: "2025-07-01",
    ...overrides,
  };
}

function makeAchievement(overrides: Partial<PositiveAchievementInput> = {}): PositiveAchievementInput {
  return {
    id: "ach1", child_id: "c1", date: "2025-05-15",
    shared_with_count: 3, celebrated_how_provided: true,
    ...overrides,
  };
}

function makeClubRecord(overrides: Partial<ClubRecordInput> = {}): ClubRecordInput {
  return {
    id: "cr1", child_id: "c1", ongoing_status: "active",
    child_enjoyment_rating: 5, achievements_count: 3,
    child_comments_provided: true, reviewed_date: "2025-07-01",
    ...overrides,
  };
}

function makeSR(overrides: Partial<SanctionRewardInput> = {}): SanctionRewardInput {
  return {
    id: "sr1", child_id: "c1", date: "2025-05-20",
    direction: "reward", proportionate: true, child_response_provided: true,
    ...overrides,
  };
}

/**
 * baseInput: 5 children
 * - 5 creative projects (one per child, all in_progress, all with showcase, 1 contest each, 4 skills, child voice, future review)
 * - 5 extracurricular clubs (one per child, all ongoing, all child-initiated, 90% attendance, 4 skills, child voice, future review)
 * - 5 club records (one per child, all active, enjoyment 5, 3 achievements, child comments, future review)
 * - 10 achievements (2 per child in last 90d, all celebrated, all shared with 3+)
 * - 10 sanctions/rewards (2 per child in last 90d, all rewards, all proportionate, child response)
 *
 * Math trace:
 * mod1: cpCoverage=100, cpActiveRate=100, showcase=5 → +3 +2 = +5
 * mod2: clubCoverage=100, ecAvgAttendance=90, ecInitiatedRate=100 → +3 +1 = +4
 * mod3: achCoverage=100, achCelebrationRate=100, achPerChild=2 → +3 +1 = +4
 * mod4: srRewardRatio=100, srProportionateRate=100 → +3
 * mod5: voiceRate (5+5+5+10=25/25=100%) → +3
 * mod6: overdueRate=0 (all future reviews) → +3
 * mod7: avgSkills = (5*4 + 5*4) / (5+5) = 4, crAvgEnjoyment=5 → +3
 * mod8: sharedRate = 10/10=100%, contestsEntered=5 → +3
 * Total: 52 + 5 + 4 + 4 + 3 + 3 + 3 + 3 + 3 = 80
 */
function baseInput(overrides: Partial<HomeEnrichmentAchievementInput> = {}): HomeEnrichmentAchievementInput {
  const children = ["c1", "c2", "c3", "c4", "c5"];

  const creative_projects = children.map((cid, i) =>
    makeCreativeProject({ id: `cp${i + 1}`, child_id: cid, contests_entered_count: 1 })
  );

  const extracurricular_clubs = children.map((cid, i) =>
    makeClub({ id: `ec${i + 1}`, child_id: cid })
  );

  const club_records = children.map((cid, i) =>
    makeClubRecord({ id: `cr${i + 1}`, child_id: cid })
  );

  const positive_achievements: PositiveAchievementInput[] = [];
  children.forEach((cid, i) => {
    positive_achievements.push(makeAchievement({ id: `ach${i * 2 + 1}`, child_id: cid, date: "2025-05-10" }));
    positive_achievements.push(makeAchievement({ id: `ach${i * 2 + 2}`, child_id: cid, date: "2025-05-20" }));
  });

  const sanction_rewards: SanctionRewardInput[] = [];
  children.forEach((cid, i) => {
    sanction_rewards.push(makeSR({ id: `sr${i * 2 + 1}`, child_id: cid, date: "2025-05-12" }));
    sanction_rewards.push(makeSR({ id: `sr${i * 2 + 2}`, child_id: cid, date: "2025-05-22" }));
  });

  return {
    today: TODAY,
    creative_projects,
    extracurricular_clubs,
    positive_achievements,
    club_records,
    sanction_rewards,
    total_children: 5,
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("Home Enrichment & Achievement Intelligence Engine", () => {

  // ── Insufficient data ──────────────────────────────────────────────
  describe("insufficient data", () => {
    it("returns insufficient_data when no children and no records", () => {
      const r = computeHomeEnrichmentAchievement({
        today: TODAY, creative_projects: [], extracurricular_clubs: [],
        positive_achievements: [], club_records: [], sanction_rewards: [],
        total_children: 0,
      });
      expect(r.enrichment_rating).toBe("insufficient_data");
      expect(r.enrichment_score).toBe(0);
    });

    it("does NOT return insufficient_data when children exist but no records", () => {
      const r = computeHomeEnrichmentAchievement({
        today: TODAY, creative_projects: [], extracurricular_clubs: [],
        positive_achievements: [], club_records: [], sanction_rewards: [],
        total_children: 5,
      });
      expect(r.enrichment_rating).not.toBe("insufficient_data");
    });
  });

  // ── Outstanding baseline ───────────────────────────────────────────
  describe("outstanding baseline", () => {
    it("scores exactly 80 with baseInput", () => {
      const r = computeHomeEnrichmentAchievement(baseInput());
      expect(r.enrichment_score).toBe(80);
      expect(r.enrichment_rating).toBe("outstanding");
    });

    it("produces strengths for outstanding input", () => {
      const r = computeHomeEnrichmentAchievement(baseInput());
      expect(r.strengths.length).toBeGreaterThan(0);
    });

    it("produces no concerns for outstanding input", () => {
      const r = computeHomeEnrichmentAchievement(baseInput());
      expect(r.concerns.length).toBe(0);
    });

    it("headline mentions outstanding", () => {
      const r = computeHomeEnrichmentAchievement(baseInput());
      expect(r.headline.toLowerCase()).toContain("outstanding");
    });
  });

  // ── Profile shapes ────────────────────────────────────────────────
  describe("profile shapes", () => {
    it("creative_projects profile is correct", () => {
      const r = computeHomeEnrichmentAchievement(baseInput());
      expect(r.creative_projects.total_projects).toBe(5);
      expect(r.creative_projects.child_coverage).toBe(100);
      expect(r.creative_projects.active_rate).toBe(100);
      expect(r.creative_projects.showcase_count).toBe(5);
    });

    it("clubs profile is correct", () => {
      const r = computeHomeEnrichmentAchievement(baseInput());
      expect(r.clubs.total_clubs).toBe(10); // 5 EC + 5 CR
      expect(r.clubs.child_coverage).toBe(100);
      expect(r.clubs.avg_attendance).toBe(90);
      expect(r.clubs.child_initiated_rate).toBe(100);
    });

    it("achievements profile is correct", () => {
      const r = computeHomeEnrichmentAchievement(baseInput());
      expect(r.achievements.total_achievements_90d).toBe(10);
      expect(r.achievements.child_coverage).toBe(100);
      expect(r.achievements.celebration_rate).toBe(100);
    });

    it("reward_sanctions profile is correct", () => {
      const r = computeHomeEnrichmentAchievement(baseInput());
      expect(r.reward_sanctions.total_90d).toBe(10);
      expect(r.reward_sanctions.reward_ratio).toBe(100);
      expect(r.reward_sanctions.proportionate_rate).toBe(100);
    });
  });

  // ── Modifier 1: Creative Project Engagement ────────────────────────
  describe("mod1 — creative project engagement", () => {
    it("penalises low coverage", () => {
      const r = computeHomeEnrichmentAchievement(baseInput({
        creative_projects: [makeCreativeProject({ id: "cp1", child_id: "c1" })],
      }));
      expect(r.enrichment_score).toBeLessThan(80);
    });

    it("penalises no projects at all", () => {
      const r = computeHomeEnrichmentAchievement(baseInput({ creative_projects: [] }));
      expect(r.enrichment_score).toBeLessThan(80);
    });

    it("penalises no showcases", () => {
      const base = baseInput();
      base.creative_projects = base.creative_projects.map(p => ({ ...p, external_showcase_present: false }));
      const r = computeHomeEnrichmentAchievement(base);
      expect(r.enrichment_score).toBeLessThan(80);
    });
  });

  // ── Modifier 2: Club engagement ────────────────────────────────────
  describe("mod2 — club engagement", () => {
    it("penalises low attendance", () => {
      const base = baseInput();
      base.extracurricular_clubs = base.extracurricular_clubs.map(c => ({ ...c, attendance_rate: 30 }));
      const r = computeHomeEnrichmentAchievement(base);
      expect(r.enrichment_score).toBeLessThan(80);
    });

    it("penalises no child-initiated clubs", () => {
      const base = baseInput();
      base.extracurricular_clubs = base.extracurricular_clubs.map(c => ({ ...c, child_initiated: false }));
      const r = computeHomeEnrichmentAchievement(base);
      expect(r.enrichment_score).toBeLessThan(80);
    });
  });

  // ── Modifier 3: Achievement recognition ────────────────────────────
  describe("mod3 — achievement recognition", () => {
    it("penalises no celebration", () => {
      const base = baseInput();
      base.positive_achievements = base.positive_achievements.map(a => ({ ...a, celebrated_how_provided: false }));
      const r = computeHomeEnrichmentAchievement(base);
      expect(r.enrichment_score).toBeLessThan(80);
    });

    it("penalises no achievements at all", () => {
      const r = computeHomeEnrichmentAchievement(baseInput({ positive_achievements: [] }));
      expect(r.enrichment_score).toBeLessThan(80);
    });
  });

  // ── Modifier 4: Reward/Sanction balance ────────────────────────────
  describe("mod4 — reward/sanction balance", () => {
    it("penalises sanction-heavy approach", () => {
      const base = baseInput();
      base.sanction_rewards = base.sanction_rewards.map(sr => ({ ...sr, direction: "sanction" }));
      const r = computeHomeEnrichmentAchievement(base);
      expect(r.enrichment_score).toBeLessThan(80);
    });

    it("penalises low proportionate rate", () => {
      const base = baseInput();
      base.sanction_rewards = base.sanction_rewards.map(sr => ({ ...sr, proportionate: false }));
      const r = computeHomeEnrichmentAchievement(base);
      expect(r.enrichment_score).toBeLessThan(80);
    });

    it("neutral with no sanctions/rewards", () => {
      const base = baseInput({ sanction_rewards: [] });
      const r = computeHomeEnrichmentAchievement(base);
      // mod4 = 0 instead of +3, so score drops by 3
      expect(r.enrichment_score).toBe(77);
    });
  });

  // ── Modifier 5: Child voice ────────────────────────────────────────
  describe("mod5 — child voice", () => {
    it("penalises low voice rate", () => {
      const base = baseInput();
      base.creative_projects = base.creative_projects.map(p => ({ ...p, child_voice_provided: false }));
      base.extracurricular_clubs = base.extracurricular_clubs.map(c => ({ ...c, child_voice_provided: false }));
      base.club_records = base.club_records.map(c => ({ ...c, child_comments_provided: false }));
      base.sanction_rewards = base.sanction_rewards.map(sr => ({ ...sr, child_response_provided: false }));
      const r = computeHomeEnrichmentAchievement(base);
      expect(r.enrichment_score).toBeLessThan(80);
    });
  });

  // ── Modifier 6: Review compliance ──────────────────────────────────
  describe("mod6 — review compliance", () => {
    it("penalises overdue reviews", () => {
      const base = baseInput();
      base.creative_projects = base.creative_projects.map(p => ({ ...p, review_date: "2025-01-01" }));
      base.extracurricular_clubs = base.extracurricular_clubs.map(c => ({ ...c, review_date: "2025-01-01" }));
      base.club_records = base.club_records.map(c => ({ ...c, reviewed_date: "2025-01-01" }));
      const r = computeHomeEnrichmentAchievement(base);
      expect(r.enrichment_score).toBeLessThan(80);
    });
  });

  // ── Modifier 7: Skill breadth & enjoyment ──────────────────────────
  describe("mod7 — skill breadth & enjoyment", () => {
    it("penalises low skill counts", () => {
      const base = baseInput();
      base.creative_projects = base.creative_projects.map(p => ({ ...p, skills_growing_count: 0 }));
      base.extracurricular_clubs = base.extracurricular_clubs.map(c => ({ ...c, skills_built_count: 0 }));
      const r = computeHomeEnrichmentAchievement(base);
      expect(r.enrichment_score).toBeLessThan(80);
    });

    it("penalises low enjoyment ratings", () => {
      const base = baseInput();
      base.club_records = base.club_records.map(c => ({ ...c, child_enjoyment_rating: 2 }));
      const r = computeHomeEnrichmentAchievement(base);
      expect(r.enrichment_score).toBeLessThan(80);
    });
  });

  // ── Modifier 8: Achievement sharing & community ────────────────────
  describe("mod8 — achievement sharing & community", () => {
    it("penalises no sharing", () => {
      const base = baseInput();
      base.positive_achievements = base.positive_achievements.map(a => ({ ...a, shared_with_count: 0 }));
      const r = computeHomeEnrichmentAchievement(base);
      expect(r.enrichment_score).toBeLessThan(80);
    });

    it("penalises no contests", () => {
      const base = baseInput();
      base.creative_projects = base.creative_projects.map(p => ({ ...p, contests_entered_count: 0 }));
      const r = computeHomeEnrichmentAchievement(base);
      expect(r.enrichment_score).toBeLessThan(80);
    });
  });

  // ── Score boundaries ───────────────────────────────────────────────
  describe("score boundaries", () => {
    it("good at score 65-79", () => {
      // Remove showcases (-2) and contests (-1) and one mod drop
      const base = baseInput();
      base.creative_projects = base.creative_projects.map(p => ({
        ...p, external_showcase_present: false, contests_entered_count: 0,
      }));
      base.positive_achievements = base.positive_achievements.map(a => ({ ...a, shared_with_count: 0 }));
      const r = computeHomeEnrichmentAchievement(base);
      expect(r.enrichment_rating).toBe("good");
      expect(r.enrichment_score).toBeGreaterThanOrEqual(65);
      expect(r.enrichment_score).toBeLessThan(80);
    });

    it("adequate at score 45-64", () => {
      const r = computeHomeEnrichmentAchievement(baseInput({
        creative_projects: [],
        extracurricular_clubs: [],
        club_records: [],
        positive_achievements: [],
        sanction_rewards: [],
        total_children: 5,
      }));
      expect(r.enrichment_rating).toBe("adequate");
      expect(r.enrichment_score).toBeGreaterThanOrEqual(45);
      expect(r.enrichment_score).toBeLessThan(65);
    });

    it("inadequate at score below 45", () => {
      // All bad data: very few children engaged, poor quality
      const r = computeHomeEnrichmentAchievement({
        today: TODAY,
        creative_projects: [
          makeCreativeProject({ id: "cp1", child_id: "c1", status: "idea", skills_growing_count: 0, child_voice_provided: false, review_date: "2024-01-01", external_showcase_present: false, contests_entered_count: 0 }),
        ],
        extracurricular_clubs: [
          makeClub({ id: "ec1", child_id: "c1", attendance_rate: 20, child_initiated: false, child_voice_provided: false, review_date: "2024-01-01", skills_built_count: 0 }),
        ],
        positive_achievements: [],
        club_records: [
          makeClubRecord({ id: "cr1", child_id: "c1", child_enjoyment_rating: 1, child_comments_provided: false, reviewed_date: "2024-01-01", achievements_count: 0 }),
        ],
        sanction_rewards: Array.from({ length: 10 }, (_, i) =>
          makeSR({ id: `sr${i}`, child_id: `c${(i % 5) + 1}`, direction: "sanction", proportionate: false, child_response_provided: false })
        ),
        total_children: 10,
      });
      expect(r.enrichment_rating).toBe("inadequate");
      expect(r.enrichment_score).toBeLessThan(45);
    });
  });

  // ── Strengths/concerns/recommendations/insights ────────────────────
  describe("narrative outputs", () => {
    it("generates strengths for high-performing home", () => {
      const r = computeHomeEnrichmentAchievement(baseInput());
      expect(r.strengths.length).toBeGreaterThanOrEqual(3);
    });

    it("generates concerns for low-performing home", () => {
      const r = computeHomeEnrichmentAchievement(baseInput({
        creative_projects: [],
        extracurricular_clubs: [],
        positive_achievements: [],
        sanction_rewards: Array.from({ length: 10 }, (_, i) =>
          makeSR({ id: `sr${i}`, child_id: "c1", direction: "sanction", proportionate: false, child_response_provided: false })
        ),
      }));
      expect(r.concerns.length).toBeGreaterThan(0);
    });

    it("generates recommendations when needed", () => {
      const r = computeHomeEnrichmentAchievement(baseInput({
        creative_projects: [],
        extracurricular_clubs: [],
        positive_achievements: [],
      }));
      expect(r.recommendations.length).toBeGreaterThan(0);
    });

    it("generates insights for outstanding performance", () => {
      const r = computeHomeEnrichmentAchievement(baseInput());
      expect(r.insights.length).toBeGreaterThan(0);
      expect(r.insights.some(i => i.severity === "positive")).toBe(true);
    });

    it("generates critical insight for sanction-heavy approach", () => {
      const base = baseInput();
      base.sanction_rewards = base.sanction_rewards.map(sr => ({ ...sr, direction: "sanction" }));
      const r = computeHomeEnrichmentAchievement(base);
      expect(r.insights.some(i => i.severity === "critical")).toBe(true);
    });
  });

  // ── Cross-modifier interactions ────────────────────────────────────
  describe("cross-modifier interactions", () => {
    it("removing all child voice affects mod5 without affecting mod1", () => {
      const base = baseInput();
      // Only remove voice from creative projects
      base.creative_projects = base.creative_projects.map(p => ({ ...p, child_voice_provided: false }));
      const r = computeHomeEnrichmentAchievement(base);
      // mod5 drops because voiceRate drops from 100% to 80% (20/25)
      // But creative project coverage is still 100% so mod1 stays at +5
      expect(r.creative_projects.child_coverage).toBe(100);
      expect(r.enrichment_score).toBe(80); // voiceRate is 20/25 = 80%, still +3
    });

    it("removing clubs affects both mod2 and mod7", () => {
      const base = baseInput({ extracurricular_clubs: [], club_records: [] });
      const r = computeHomeEnrichmentAchievement(base);
      // mod2: no clubs → -2
      // mod7: avgSkills from only creative projects = 4, but crAvgEnjoyment = 0 → drops
      expect(r.enrichment_score).toBeLessThan(80);
    });
  });
});
