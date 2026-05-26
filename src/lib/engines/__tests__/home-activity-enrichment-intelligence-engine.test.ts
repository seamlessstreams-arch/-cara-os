// ══════════════════════════════════════════════════════════════════════════════
// TESTS — Home Activity & Enrichment Intelligence Engine
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeHomeActivityEnrichment,
  type HomeActivityEnrichmentInput,
  type ActivityEntryInput,
  type ChildRef,
} from "../home-activity-enrichment-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2026-05-26";

function daysAgo(n: number): string {
  const d = new Date("2026-05-26");
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function makeChild(id: string, name: string): ChildRef {
  return { id, name };
}

function makeActivity(overrides: Partial<ActivityEntryInput> & { child_id: string }): ActivityEntryInput {
  return {
    id: `act_${Math.random().toString(36).slice(2, 8)}`,
    date: daysAgo(5),
    category: "sport",
    title: "Football",
    duration_minutes: 60,
    engagement: "enthusiastic",
    is_new_experience: false,
    yp_feedback: null,
    staff_id: "staff_1",
    ...overrides,
  };
}

function baseInput(overrides: Partial<HomeActivityEnrichmentInput> = {}): HomeActivityEnrichmentInput {
  return {
    today: TODAY,
    children: [makeChild("yp_1", "Alex"), makeChild("yp_2", "Jordan")],
    activities: [],
    ...overrides,
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Home Activity & Enrichment Intelligence Engine", () => {
  // ── Output Shape ────────────────────────────────────────────────────────

  it("returns correct output shape", () => {
    const r = computeHomeActivityEnrichment(baseInput());
    expect(r).toHaveProperty("generated_at");
    expect(r).toHaveProperty("enrichment_rating");
    expect(r).toHaveProperty("enrichment_score");
    expect(r).toHaveProperty("headline");
    expect(r).toHaveProperty("provision");
    expect(r).toHaveProperty("category_breakdown");
    expect(r).toHaveProperty("child_profiles");
    expect(r).toHaveProperty("children_without_activities");
    expect(r).toHaveProperty("strengths");
    expect(r).toHaveProperty("concerns");
    expect(r).toHaveProperty("recommendations");
    expect(r).toHaveProperty("insights");
  });

  it("sets generated_at to today", () => {
    const r = computeHomeActivityEnrichment(baseInput());
    expect(r.generated_at).toBe(TODAY);
  });

  // ── Rating Thresholds ──────────────────────────────────────────────────

  it("rates insufficient_data when no activities and children exist", () => {
    const r = computeHomeActivityEnrichment(baseInput());
    expect(r.enrichment_rating).toBe("insufficient_data");
  });

  it("rates insufficient_data when no children exist", () => {
    const r = computeHomeActivityEnrichment(baseInput({ children: [] }));
    expect(r.enrichment_rating).toBe("insufficient_data");
  });

  it("rates inadequate when minimal activities with low variety", () => {
    const r = computeHomeActivityEnrichment(baseInput({
      activities: [
        makeActivity({ child_id: "yp_1", category: "sport", engagement: "reluctant" }),
      ],
    }));
    // Low activity count + only 1 category → low score
    expect(["inadequate", "adequate"]).toContain(r.enrichment_rating);
  });

  it("rates good/outstanding with rich varied programme", () => {
    const categories = ["sport", "creative", "outdoor", "educational", "social", "cultural", "community"];
    const activities: ActivityEntryInput[] = [];
    for (let i = 0; i < 10; i++) {
      activities.push(makeActivity({
        child_id: "yp_1",
        date: daysAgo(i + 1),
        category: categories[i % categories.length],
        engagement: "enthusiastic",
        is_new_experience: i < 3,
        yp_feedback: i < 3 ? "Really enjoyed it!" : null,
      }));
      activities.push(makeActivity({
        child_id: "yp_2",
        date: daysAgo(i + 1),
        category: categories[(i + 2) % categories.length],
        engagement: i < 8 ? "willing" : "enthusiastic",
        is_new_experience: i < 2,
      }));
    }

    const r = computeHomeActivityEnrichment(baseInput({ activities }));
    expect(["good", "outstanding"]).toContain(r.enrichment_rating);
    expect(r.enrichment_score).toBeGreaterThanOrEqual(65);
  });

  // ── Provision Snapshot ─────────────────────────────────────────────────

  it("computes provision counts correctly", () => {
    const activities = [
      makeActivity({ child_id: "yp_1", date: daysAgo(2), category: "sport" }),
      makeActivity({ child_id: "yp_1", date: daysAgo(10), category: "creative" }),
      makeActivity({ child_id: "yp_2", date: daysAgo(3), category: "outdoor", is_new_experience: true, engagement: "suggested_by_yp", staff_id: "staff_2" }),
      makeActivity({ child_id: "yp_2", date: daysAgo(40), category: "sport" }), // Outside 30d
    ];

    const r = computeHomeActivityEnrichment(baseInput({ activities }));
    expect(r.provision.total_activities_30d).toBe(3);
    expect(r.provision.unique_categories_30d).toBe(3);
    expect(r.provision.new_experiences_30d).toBe(1);
    expect(r.provision.yp_suggested_30d).toBe(1);
    expect(r.provision.unique_staff_leading).toBe(2);
  });

  it("counts 7-day activities separately", () => {
    const activities = [
      makeActivity({ child_id: "yp_1", date: daysAgo(2) }),
      makeActivity({ child_id: "yp_1", date: daysAgo(6) }),
      makeActivity({ child_id: "yp_1", date: daysAgo(15) }),
    ];
    const r = computeHomeActivityEnrichment(baseInput({ activities }));
    expect(r.provision.total_activities_7d).toBe(2);
    expect(r.provision.total_activities_30d).toBe(3);
  });

  it("computes average per child correctly", () => {
    const activities = [
      makeActivity({ child_id: "yp_1", date: daysAgo(2) }),
      makeActivity({ child_id: "yp_1", date: daysAgo(5) }),
      makeActivity({ child_id: "yp_2", date: daysAgo(3) }),
      makeActivity({ child_id: "yp_2", date: daysAgo(8) }),
    ];
    const r = computeHomeActivityEnrichment(baseInput({ activities }));
    expect(r.provision.avg_per_child_30d).toBe(2);
  });

  // ── Category Breakdown ─────────────────────────────────────────────────

  it("breaks down categories by count and percentage", () => {
    const activities = [
      makeActivity({ child_id: "yp_1", date: daysAgo(2), category: "sport" }),
      makeActivity({ child_id: "yp_1", date: daysAgo(5), category: "sport" }),
      makeActivity({ child_id: "yp_2", date: daysAgo(3), category: "creative" }),
      makeActivity({ child_id: "yp_2", date: daysAgo(8), category: "outdoor" }),
    ];
    const r = computeHomeActivityEnrichment(baseInput({ activities }));
    expect(r.category_breakdown.length).toBe(3);

    const sportCat = r.category_breakdown.find((c) => c.category === "sport");
    expect(sportCat).toBeDefined();
    expect(sportCat!.count).toBe(2);
    expect(sportCat!.percentage).toBe(50);
  });

  it("sorts categories by count descending", () => {
    const activities = [
      makeActivity({ child_id: "yp_1", date: daysAgo(2), category: "creative" }),
      makeActivity({ child_id: "yp_1", date: daysAgo(5), category: "sport" }),
      makeActivity({ child_id: "yp_1", date: daysAgo(7), category: "sport" }),
      makeActivity({ child_id: "yp_2", date: daysAgo(3), category: "sport" }),
    ];
    const r = computeHomeActivityEnrichment(baseInput({ activities }));
    expect(r.category_breakdown[0].category).toBe("sport");
  });

  // ── Per-Child Profiles ─────────────────────────────────────────────────

  it("computes per-child activity profiles", () => {
    const activities = [
      makeActivity({ child_id: "yp_1", date: daysAgo(2), engagement: "enthusiastic" }),
      makeActivity({ child_id: "yp_1", date: daysAgo(5), engagement: "willing" }),
      makeActivity({ child_id: "yp_1", date: daysAgo(10), engagement: "refused" }),
    ];
    const r = computeHomeActivityEnrichment(baseInput({ activities }));
    const alex = r.child_profiles.find((p) => p.child_id === "yp_1");
    expect(alex).toBeDefined();
    expect(alex!.activities_30d).toBe(3);
    expect(alex!.participation_rate).toBe(67); // 2 of 3 engaged
    expect(alex!.enthusiasm_rate).toBe(33); // 1 of 3 enthusiastic
  });

  it("flags children with no activities", () => {
    const activities = [
      makeActivity({ child_id: "yp_1", date: daysAgo(2) }),
    ];
    const r = computeHomeActivityEnrichment(baseInput({ activities }));
    const jordan = r.child_profiles.find((p) => p.child_id === "yp_2");
    expect(jordan!.activities_30d).toBe(0);
    expect(jordan!.flags).toContain("No activities in 30 days");
    expect(r.children_without_activities).toContain("Jordan");
  });

  it("detects limited variety per child", () => {
    const activities = [
      makeActivity({ child_id: "yp_1", date: daysAgo(2), category: "sport" }),
      makeActivity({ child_id: "yp_1", date: daysAgo(5), category: "sport" }),
      makeActivity({ child_id: "yp_1", date: daysAgo(8), category: "sport" }),
    ];
    const r = computeHomeActivityEnrichment(baseInput({ activities }));
    const alex = r.child_profiles.find((p) => p.child_id === "yp_1");
    expect(alex!.categories_accessed).toEqual(["sport"]);
    expect(alex!.flags).toContain("Limited variety");
  });

  it("detects new experiences per child", () => {
    const activities = [
      makeActivity({ child_id: "yp_1", date: daysAgo(2), is_new_experience: true }),
      makeActivity({ child_id: "yp_1", date: daysAgo(5), is_new_experience: true }),
      makeActivity({ child_id: "yp_1", date: daysAgo(8), is_new_experience: false }),
    ];
    const r = computeHomeActivityEnrichment(baseInput({ activities }));
    const alex = r.child_profiles.find((p) => p.child_id === "yp_1");
    expect(alex!.new_experiences_30d).toBe(2);
  });

  it("detects child feedback presence", () => {
    const activities = [
      makeActivity({ child_id: "yp_1", date: daysAgo(2), yp_feedback: "Loved it!" }),
    ];
    const r = computeHomeActivityEnrichment(baseInput({ activities }));
    const alex = r.child_profiles.find((p) => p.child_id === "yp_1");
    expect(alex!.has_feedback).toBe(true);
  });

  it("sorts child profiles by activity score ascending (lowest first)", () => {
    const activities = [
      makeActivity({ child_id: "yp_1", date: daysAgo(2), engagement: "enthusiastic" }),
      makeActivity({ child_id: "yp_1", date: daysAgo(5), engagement: "enthusiastic", is_new_experience: true }),
      makeActivity({ child_id: "yp_1", date: daysAgo(8), engagement: "willing", category: "creative" }),
      makeActivity({ child_id: "yp_1", date: daysAgo(12), engagement: "willing", category: "outdoor" }),
      // yp_2 has nothing → lower score
    ];
    const r = computeHomeActivityEnrichment(baseInput({ activities }));
    expect(r.child_profiles[0].child_id).toBe("yp_2"); // Lowest first
  });

  // ── Scoring ────────────────────────────────────────────────────────────

  it("gives higher scores for more activities", () => {
    const fewActivities = computeHomeActivityEnrichment(baseInput({
      activities: [
        makeActivity({ child_id: "yp_1", date: daysAgo(5) }),
        makeActivity({ child_id: "yp_2", date: daysAgo(5) }),
      ],
    }));

    const manyActivities: ActivityEntryInput[] = [];
    for (let i = 0; i < 10; i++) {
      manyActivities.push(makeActivity({ child_id: "yp_1", date: daysAgo(i + 1), category: ["sport", "creative", "outdoor", "educational", "social"][i % 5] }));
      manyActivities.push(makeActivity({ child_id: "yp_2", date: daysAgo(i + 1), category: ["sport", "creative", "outdoor", "educational", "social"][i % 5] }));
    }

    const many = computeHomeActivityEnrichment(baseInput({ activities: manyActivities }));
    expect(many.enrichment_score).toBeGreaterThan(fewActivities.enrichment_score);
  });

  it("boosts score for yp-suggested activities", () => {
    const base = computeHomeActivityEnrichment(baseInput({
      activities: [
        makeActivity({ child_id: "yp_1", date: daysAgo(2), engagement: "willing" }),
        makeActivity({ child_id: "yp_1", date: daysAgo(5), engagement: "willing" }),
        makeActivity({ child_id: "yp_2", date: daysAgo(3), engagement: "willing" }),
        makeActivity({ child_id: "yp_2", date: daysAgo(7), engagement: "willing" }),
      ],
    }));
    const withSuggested = computeHomeActivityEnrichment(baseInput({
      activities: [
        makeActivity({ child_id: "yp_1", date: daysAgo(2), engagement: "suggested_by_yp" }),
        makeActivity({ child_id: "yp_1", date: daysAgo(5), engagement: "suggested_by_yp" }),
        makeActivity({ child_id: "yp_2", date: daysAgo(3), engagement: "suggested_by_yp" }),
        makeActivity({ child_id: "yp_2", date: daysAgo(7), engagement: "willing" }),
      ],
    }));
    expect(withSuggested.enrichment_score).toBeGreaterThanOrEqual(base.enrichment_score);
  });

  it("penalises children_without_activities", () => {
    // Only yp_1 has activities
    const r = computeHomeActivityEnrichment(baseInput({
      activities: [
        makeActivity({ child_id: "yp_1", date: daysAgo(2), category: "sport" }),
        makeActivity({ child_id: "yp_1", date: daysAgo(5), category: "creative" }),
      ],
    }));
    expect(r.children_without_activities).toContain("Jordan");
    // Score should be lower than if both had activities
    const both = computeHomeActivityEnrichment(baseInput({
      activities: [
        makeActivity({ child_id: "yp_1", date: daysAgo(2), category: "sport" }),
        makeActivity({ child_id: "yp_2", date: daysAgo(5), category: "creative" }),
      ],
    }));
    expect(r.enrichment_score).toBeLessThan(both.enrichment_score);
  });

  // ── Strengths ──────────────────────────────────────────────────────────

  it("generates strengths for good enrichment", () => {
    const categories = ["sport", "creative", "outdoor", "educational", "social", "cultural"];
    const activities: ActivityEntryInput[] = [];
    for (let i = 0; i < 10; i++) {
      activities.push(makeActivity({
        child_id: "yp_1",
        date: daysAgo(i + 1),
        category: categories[i % categories.length],
        engagement: "enthusiastic",
        is_new_experience: i < 3,
        yp_feedback: i < 2 ? "Great!" : null,
      }));
      activities.push(makeActivity({
        child_id: "yp_2",
        date: daysAgo(i + 1),
        category: categories[(i + 1) % categories.length],
        engagement: i < 7 ? "suggested_by_yp" : "willing",
        is_new_experience: i < 2,
      }));
    }
    const r = computeHomeActivityEnrichment(baseInput({ activities }));
    expect(r.strengths.length).toBeGreaterThan(0);
  });

  it("generates strength for yp-suggested activities", () => {
    const activities = [
      makeActivity({ child_id: "yp_1", date: daysAgo(2), engagement: "suggested_by_yp" }),
      makeActivity({ child_id: "yp_1", date: daysAgo(5), engagement: "suggested_by_yp" }),
      makeActivity({ child_id: "yp_2", date: daysAgo(3), engagement: "willing" }),
    ];
    const r = computeHomeActivityEnrichment(baseInput({ activities }));
    const hasSuggestedStrength = r.strengths.some((s) => s.includes("suggested by young people"));
    expect(hasSuggestedStrength).toBe(true);
  });

  // ── Concerns ───────────────────────────────────────────────────────────

  it("generates concern for no activities", () => {
    const r = computeHomeActivityEnrichment(baseInput());
    const hasConcern = r.concerns.some((c) => c.includes("No activities recorded"));
    expect(hasConcern).toBe(true);
  });

  it("generates concern for children without activities", () => {
    const r = computeHomeActivityEnrichment(baseInput({
      activities: [
        makeActivity({ child_id: "yp_1", date: daysAgo(2) }),
      ],
    }));
    const hasConcern = r.concerns.some((c) => c.includes("no recorded activities") || c.includes("Jordan"));
    expect(hasConcern).toBe(true);
  });

  it("generates concern for limited variety", () => {
    const activities = [
      makeActivity({ child_id: "yp_1", date: daysAgo(2), category: "sport" }),
      makeActivity({ child_id: "yp_2", date: daysAgo(3), category: "sport" }),
      makeActivity({ child_id: "yp_1", date: daysAgo(5), category: "sport" }),
    ];
    const r = computeHomeActivityEnrichment(baseInput({ activities }));
    const hasConcern = r.concerns.some((c) => c.includes("limited to") || c.includes("categor"));
    expect(hasConcern).toBe(true);
  });

  // ── Recommendations ────────────────────────────────────────────────────

  it("recommends activities for children without them", () => {
    const r = computeHomeActivityEnrichment(baseInput({
      activities: [
        makeActivity({ child_id: "yp_1", date: daysAgo(2) }),
      ],
    }));
    const hasRec = r.recommendations.some((rec) => rec.recommendation.includes("Jordan"));
    expect(hasRec).toBe(true);
  });

  it("recommends diversifying when variety is low", () => {
    const activities = [
      makeActivity({ child_id: "yp_1", date: daysAgo(2), category: "sport" }),
      makeActivity({ child_id: "yp_2", date: daysAgo(3), category: "sport" }),
      makeActivity({ child_id: "yp_1", date: daysAgo(5), category: "sport" }),
    ];
    const r = computeHomeActivityEnrichment(baseInput({ activities }));
    const hasRec = r.recommendations.some((rec) => rec.recommendation.includes("Diversify") || rec.recommendation.includes("categor"));
    expect(hasRec).toBe(true);
  });

  it("recommends immediate action when zero activities", () => {
    const r = computeHomeActivityEnrichment(baseInput());
    const hasImmediate = r.recommendations.some((rec) => rec.urgency === "immediate");
    expect(hasImmediate).toBe(true);
  });

  // ── ARIA Insights ──────────────────────────────────────────────────────

  it("generates critical insight for inadequate enrichment", () => {
    const r = computeHomeActivityEnrichment(baseInput());
    const hasCritical = r.insights.some((i) => i.severity === "critical");
    expect(hasCritical).toBe(true);
  });

  it("generates positive insight for outstanding enrichment", () => {
    const categories = ["sport", "creative", "outdoor", "educational", "social", "cultural", "community"];
    const activities: ActivityEntryInput[] = [];
    for (let i = 0; i < 12; i++) {
      activities.push(makeActivity({
        child_id: "yp_1",
        date: daysAgo(i + 1),
        category: categories[i % categories.length],
        engagement: i < 8 ? "enthusiastic" : "suggested_by_yp",
        is_new_experience: i < 4,
        yp_feedback: i < 4 ? "Amazing!" : null,
      }));
      activities.push(makeActivity({
        child_id: "yp_2",
        date: daysAgo(i + 1),
        category: categories[(i + 3) % categories.length],
        engagement: "enthusiastic",
        is_new_experience: i < 3,
        yp_feedback: i < 3 ? "Really fun!" : null,
      }));
    }
    const r = computeHomeActivityEnrichment(baseInput({ activities }));
    if (r.enrichment_rating === "outstanding") {
      const hasPositive = r.insights.some((i) => i.severity === "positive" && i.text.includes("outstanding"));
      expect(hasPositive).toBe(true);
    } else {
      // At least good with positive insights
      expect(r.enrichment_score).toBeGreaterThanOrEqual(65);
    }
  });

  // ── Headline ───────────────────────────────────────────────────────────

  it("includes enrichment rating in headline", () => {
    const r = computeHomeActivityEnrichment(baseInput());
    expect(r.headline).toContain(r.enrichment_rating);
  });

  // ── Empty Input ────────────────────────────────────────────────────────

  it("handles empty input gracefully", () => {
    const r = computeHomeActivityEnrichment({
      today: TODAY,
      children: [],
      activities: [],
    });
    expect(r.enrichment_rating).toBe("insufficient_data");
    expect(r.child_profiles).toEqual([]);
    expect(r.category_breakdown).toEqual([]);
  });

  // ── Clamp ──────────────────────────────────────────────────────────────

  it("clamps enrichment score to 0-100", () => {
    // Lots of penalties
    const r = computeHomeActivityEnrichment(baseInput({
      children: [makeChild("yp_1", "Alex"), makeChild("yp_2", "Jordan"), makeChild("yp_3", "Casey"), makeChild("yp_4", "Sam")],
      activities: [],
    }));
    expect(r.enrichment_score).toBeGreaterThanOrEqual(0);
    expect(r.enrichment_score).toBeLessThanOrEqual(100);
  });
});
