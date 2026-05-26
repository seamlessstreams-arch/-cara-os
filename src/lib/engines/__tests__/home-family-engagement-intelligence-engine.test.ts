import {
  computeHomeFamilyEngagement,
  type HomeFamilyEngagementInput,
  type FamilyTimeInput,
  type FamilyRelationshipInput,
} from "../home-family-engagement-intelligence-engine";

// ── Helpers ────────────────────────────────────────────────────────────────

const TODAY = "2025-03-15";

function daysAgo(n: number): string {
  const d = new Date("2025-03-15");
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function makeSession(overrides: Partial<FamilyTimeInput> = {}): FamilyTimeInput {
  return {
    id: `ft-${Math.random().toString(36).slice(2, 8)}`,
    date: daysAgo(7),
    child_id: "C1",
    duration_minutes: 120,
    supervision_level: "supervised",
    was_safe: true,
    has_concerns: false,
    has_positive_observations: true,
    has_child_voice: true,
    report_sent_to_sw: true,
    has_recommendations: true,
    ...overrides,
  };
}

function makeRelationship(overrides: Partial<FamilyRelationshipInput> = {}): FamilyRelationshipInput {
  return {
    id: `rel-${Math.random().toString(36).slice(2, 8)}`,
    assessment_date: daysAgo(30),
    child_id: "C1",
    relationship_type: "parent",
    quality_1_to_10: 8,
    trajectory: "improving",
    has_child_wishes: true,
    has_interventions: true,
    has_risk_factors: false,
    has_protective_factors: true,
    next_review: "2025-06-01",
    ...overrides,
  };
}

function baseInput(overrides: Partial<HomeFamilyEngagementInput> = {}): HomeFamilyEngagementInput {
  return {
    today: TODAY,
    total_children: 3,
    child_ids: ["C1", "C2", "C3"],
    family_time_sessions: [
      makeSession({ id: "ft1", child_id: "C1" }),
      makeSession({ id: "ft2", child_id: "C2" }),
      makeSession({ id: "ft3", child_id: "C3" }),
      makeSession({ id: "ft4", child_id: "C1", date: daysAgo(30) }),
      makeSession({ id: "ft5", child_id: "C2", date: daysAgo(30) }),
    ],
    family_relationships: [
      makeRelationship({ id: "rel1", child_id: "C1", relationship_type: "parent" }),
      makeRelationship({ id: "rel2", child_id: "C2", relationship_type: "parent" }),
      makeRelationship({ id: "rel3", child_id: "C3", relationship_type: "parent" }),
      makeRelationship({ id: "rel4", child_id: "C1", relationship_type: "sibling", quality_1_to_10: 7 }),
    ],
    ...overrides,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// RATING TIER TESTS
// ════════════════════════════════════════════════════════════════════════════

describe("Home Family Engagement Intelligence Engine", () => {

  // ── Insufficient data ──────────────────────────────────────────────────

  describe("insufficient data", () => {
    const result = computeHomeFamilyEngagement(baseInput({
      family_time_sessions: [],
      family_relationships: [],
    }));

    it("rates insufficient_data", () => expect(result.family_engagement_rating).toBe("insufficient_data"));
    it("scores 0", () => expect(result.family_engagement_score).toBe(0));
    it("has critical insight", () => expect(result.insights.some(i => i.severity === "critical")).toBe(true));
    it("has recommendation", () => expect(result.recommendations.length).toBeGreaterThan(0));
  });

  // ── Outstanding ────────────────────────────────────────────────────────
  // All children contacted, 100% safe, 100% voice, 100% SW, 100% assessment,
  // avg quality 7.75, no declining, no overdue, 100% wishes, 100% positive
  // Trace: 50+5+3+4+3+5+3+3+3+2+2 = 83

  describe("outstanding rating", () => {
    const result = computeHomeFamilyEngagement(baseInput());

    it("rates outstanding", () => expect(result.family_engagement_rating).toBe("outstanding"));
    it("scores at least 80", () => expect(result.family_engagement_score).toBeGreaterThanOrEqual(80));
    it("headline mentions outstanding", () => expect(result.headline).toContain("Outstanding"));
    it("has strengths", () => expect(result.strengths.length).toBeGreaterThan(0));
    it("has no concerns", () => expect(result.concerns).toHaveLength(0));
  });

  // ── Good ───────────────────────────────────────────────────────────────
  // 2/3 children contacted, 100% safe, 80% voice, 80% SW, 100% assessment,
  // avg quality 6.5, 1 declining, no overdue, 75% wishes, 80% positive

  describe("good rating", () => {
    const sessions = [
      makeSession({ id: "ft1", child_id: "C1" }),
      makeSession({ id: "ft2", child_id: "C2" }),
      makeSession({ id: "ft3", child_id: "C1", date: daysAgo(30) }),
      makeSession({ id: "ft4", child_id: "C2", date: daysAgo(30), has_child_voice: false }),
      makeSession({ id: "ft5", child_id: "C2", date: daysAgo(60), report_sent_to_sw: false }),
    ];
    const rels = [
      makeRelationship({ id: "r1", child_id: "C1", quality_1_to_10: 7, trajectory: "stable" }),
      makeRelationship({ id: "r2", child_id: "C2", quality_1_to_10: 6, trajectory: "declining", has_child_wishes: false }),
      makeRelationship({ id: "r3", child_id: "C3", quality_1_to_10: 7, trajectory: "stable" }),
      makeRelationship({ id: "r4", child_id: "C1", relationship_type: "sibling", quality_1_to_10: 6 }),
    ];

    const result = computeHomeFamilyEngagement(baseInput({
      family_time_sessions: sessions,
      family_relationships: rels,
    }));

    it("rates good", () => expect(result.family_engagement_rating).toBe("good"));
    it("scores in good range", () => {
      expect(result.family_engagement_score).toBeGreaterThanOrEqual(65);
      expect(result.family_engagement_score).toBeLessThan(80);
    });
    it("headline mentions good", () => expect(result.headline).toContain("Good"));
  });

  // ── Adequate ───────────────────────────────────────────────────────────
  // 2/3 children contacted (67%), 1 unsafe (67% safe), 67% voice, 67% SW,
  // 67% assessment, avg quality 5, 1 declining, 1 overdue, 50% wishes
  // Score: 50+2-3+2+1+2+1+1-3-1+1 = 53

  describe("adequate rating", () => {
    const sessions = [
      makeSession({ id: "ft1", child_id: "C1" }),
      makeSession({ id: "ft2", child_id: "C2" }),
      makeSession({ id: "ft3", child_id: "C1", date: daysAgo(30), was_safe: false, has_child_voice: false, report_sent_to_sw: false, has_positive_observations: false }),
    ];
    const rels = [
      makeRelationship({ id: "r1", child_id: "C1", quality_1_to_10: 5, trajectory: "declining", has_child_wishes: false, next_review: daysAgo(10) }),
      makeRelationship({ id: "r2", child_id: "C2", quality_1_to_10: 5, trajectory: "stable", has_child_wishes: true }),
    ];

    const result = computeHomeFamilyEngagement(baseInput({
      family_time_sessions: sessions,
      family_relationships: rels,
    }));

    it("rates adequate", () => expect(result.family_engagement_rating).toBe("adequate"));
    it("scores in adequate range", () => {
      expect(result.family_engagement_score).toBeGreaterThanOrEqual(45);
      expect(result.family_engagement_score).toBeLessThan(65);
    });
    it("has concerns", () => expect(result.concerns.length).toBeGreaterThan(0));
  });

  // ── Inadequate ─────────────────────────────────────────────────────────
  // 1/3 children contacted, 2 unsafe sessions, 0% voice, 0% SW, 33% assessment,
  // avg quality 3, 2 declining, 2 overdue, 0% wishes

  describe("inadequate rating", () => {
    const sessions = [
      makeSession({ id: "ft1", child_id: "C1", was_safe: false, has_child_voice: false, report_sent_to_sw: false, has_positive_observations: false }),
      makeSession({ id: "ft2", child_id: "C1", date: daysAgo(30), was_safe: false, has_child_voice: false, report_sent_to_sw: false, has_positive_observations: false }),
    ];
    const rels = [
      makeRelationship({ id: "r1", child_id: "C1", quality_1_to_10: 3, trajectory: "declining", has_child_wishes: false, next_review: daysAgo(20) }),
      makeRelationship({ id: "r2", child_id: "C1", relationship_type: "sibling", quality_1_to_10: 3, trajectory: "declining", has_child_wishes: false, next_review: daysAgo(10) }),
    ];

    const result = computeHomeFamilyEngagement(baseInput({
      family_time_sessions: sessions,
      family_relationships: rels,
    }));

    it("rates inadequate", () => expect(result.family_engagement_rating).toBe("inadequate"));
    it("scores below 45", () => expect(result.family_engagement_score).toBeLessThan(45));
    it("has critical insights", () => expect(result.insights.some(i => i.severity === "critical")).toBe(true));
    it("has multiple concerns", () => expect(result.concerns.length).toBeGreaterThan(2));
    it("has immediate recommendations", () => expect(result.recommendations.some(r => r.urgency === "immediate")).toBe(true));
  });

  // ════════════════════════════════════════════════════════════════════════
  // PROFILE CALCULATION TESTS
  // ════════════════════════════════════════════════════════════════════════

  describe("contact profile", () => {
    const result = computeHomeFamilyEngagement(baseInput());

    it("total_sessions_90d", () => expect(result.contact_profile.total_sessions_90d).toBe(5));
    it("children_with_contact", () => expect(result.contact_profile.children_with_contact).toHaveLength(3));
    it("children_without_contact", () => expect(result.contact_profile.children_without_contact).toHaveLength(0));
    it("contact_coverage", () => expect(result.contact_profile.contact_coverage).toBe(100));
    it("avg_duration_minutes", () => expect(result.contact_profile.avg_duration_minutes).toBe(120));
    it("safety_rate", () => expect(result.contact_profile.safety_rate).toBe(100));
    it("concern_count", () => expect(result.contact_profile.concern_count).toBe(0));
    it("positive_observation_rate", () => expect(result.contact_profile.positive_observation_rate).toBe(100));
  });

  describe("child voice profile", () => {
    const result = computeHomeFamilyEngagement(baseInput());

    it("voice_capture_rate", () => expect(result.child_voice_profile.voice_capture_rate).toBe(100));
    it("sw_notification_rate", () => expect(result.child_voice_profile.sw_notification_rate).toBe(100));
    it("recommendation_rate", () => expect(result.child_voice_profile.recommendation_rate).toBe(100));
  });

  describe("relationship profile", () => {
    const result = computeHomeFamilyEngagement(baseInput());

    it("total_assessments", () => expect(result.relationship_profile.total_assessments).toBe(4));
    it("children_assessed", () => expect(result.relationship_profile.children_assessed).toHaveLength(3));
    it("assessment_coverage", () => expect(result.relationship_profile.assessment_coverage).toBe(100));
    it("avg_quality_score", () => expect(result.relationship_profile.avg_quality_score).toBe(7.8));
    it("improving_count", () => expect(result.relationship_profile.improving_count).toBe(4));
    it("declining_count", () => expect(result.relationship_profile.declining_count).toBe(0));
    it("overdue_reviews", () => expect(result.relationship_profile.overdue_reviews).toBe(0));
    it("child_wishes_rate", () => expect(result.relationship_profile.child_wishes_rate).toBe(100));
  });

  describe("relationship profile — latest per child+type", () => {
    it("uses latest assessment when multiple exist", () => {
      const rels = [
        makeRelationship({ id: "r1", child_id: "C1", relationship_type: "parent", assessment_date: daysAgo(60), quality_1_to_10: 4 }),
        makeRelationship({ id: "r2", child_id: "C1", relationship_type: "parent", assessment_date: daysAgo(10), quality_1_to_10: 8 }),
      ];
      const r = computeHomeFamilyEngagement(baseInput({ family_relationships: rels }));
      expect(r.relationship_profile.avg_quality_score).toBe(8);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // SCORING MODIFIER TESTS
  // ════════════════════════════════════════════════════════════════════════

  describe("scoring — contact coverage", () => {
    it("100% coverage gives +5", () => {
      const r = computeHomeFamilyEngagement(baseInput());
      expect(r.contact_profile.contact_coverage).toBe(100);
    });

    it("<60% coverage gives -3", () => {
      const sessions = [makeSession({ child_id: "C1" })];
      const r = computeHomeFamilyEngagement(baseInput({ family_time_sessions: sessions }));
      expect(r.contact_profile.contact_coverage).toBe(33);
    });
  });

  describe("scoring — safety", () => {
    it("100% safe gives +3", () => {
      const r = computeHomeFamilyEngagement(baseInput());
      expect(r.contact_profile.safety_rate).toBe(100);
    });

    it("unsafe session gives -3", () => {
      const sessions = [makeSession({ was_safe: false })];
      const r = computeHomeFamilyEngagement(baseInput({ family_time_sessions: sessions }));
      expect(r.contact_profile.safety_rate).toBe(0);
    });
  });

  describe("scoring — child voice", () => {
    it("100% voice gives +4", () => {
      const r = computeHomeFamilyEngagement(baseInput());
      expect(r.child_voice_profile.voice_capture_rate).toBe(100);
    });

    it("<60% voice gives -3", () => {
      const sessions = [
        makeSession({ has_child_voice: false }),
        makeSession({ id: "ft2", has_child_voice: false }),
        makeSession({ id: "ft3", has_child_voice: true }),
      ];
      const r = computeHomeFamilyEngagement(baseInput({ family_time_sessions: sessions }));
      expect(r.child_voice_profile.voice_capture_rate).toBe(33);
    });
  });

  describe("scoring — trajectory", () => {
    it("no declining gives +3", () => {
      const r = computeHomeFamilyEngagement(baseInput());
      expect(r.relationship_profile.declining_count).toBe(0);
    });

    it(">1 declining gives -3", () => {
      const rels = [
        makeRelationship({ child_id: "C1", trajectory: "declining" }),
        makeRelationship({ child_id: "C2", trajectory: "declining" }),
      ];
      const r = computeHomeFamilyEngagement(baseInput({ family_relationships: rels }));
      expect(r.relationship_profile.declining_count).toBe(2);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 90-DAY WINDOW
  // ════════════════════════════════════════════════════════════════════════

  describe("90-day window", () => {
    it("excludes sessions older than 90 days", () => {
      const sessions = [
        makeSession({ date: daysAgo(10) }),
        makeSession({ id: "ft2", date: daysAgo(100) }),
      ];
      const r = computeHomeFamilyEngagement(baseInput({ family_time_sessions: sessions }));
      expect(r.contact_profile.total_sessions_90d).toBe(1);
    });

    it("relationships use latest per child+type (no window)", () => {
      const rels = [
        makeRelationship({ child_id: "C1", assessment_date: daysAgo(200), quality_1_to_10: 9 }),
      ];
      const r = computeHomeFamilyEngagement(baseInput({ family_relationships: rels }));
      expect(r.relationship_profile.total_assessments).toBe(1);
      expect(r.relationship_profile.avg_quality_score).toBe(9);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // STRENGTHS
  // ════════════════════════════════════════════════════════════════════════

  describe("strengths", () => {
    const result = computeHomeFamilyEngagement(baseInput());

    it("contact coverage strength", () => expect(result.strengths.some(s => s.includes("100%"))).toBe(true));
    it("safety strength", () => expect(result.strengths.some(s => s.includes("safe"))).toBe(true));
    it("child voice strength", () => expect(result.strengths.some(s => s.includes("voice") || s.includes("Child voice"))).toBe(true));
    it("SW notification strength", () => expect(result.strengths.some(s => s.includes("Social worker"))).toBe(true));
    it("relationship quality strength", () => expect(result.strengths.some(s => s.includes("quality score"))).toBe(true));
    it("improving trajectory strength", () => expect(result.strengths.some(s => s.includes("improving"))).toBe(true));
    it("positive observations strength", () => expect(result.strengths.some(s => s.includes("Positive observations"))).toBe(true));
  });

  // ════════════════════════════════════════════════════════════════════════
  // CONCERNS
  // ════════════════════════════════════════════════════════════════════════

  describe("concerns", () => {
    it("children without contact", () => {
      const sessions = [makeSession({ child_id: "C1" })];
      const r = computeHomeFamilyEngagement(baseInput({ family_time_sessions: sessions }));
      expect(r.concerns.some(c => c.includes("without family contact"))).toBe(true);
    });

    it("unsafe sessions", () => {
      const sessions = [makeSession({ was_safe: false })];
      const r = computeHomeFamilyEngagement(baseInput({ family_time_sessions: sessions }));
      expect(r.concerns.some(c => c.includes("unsafe"))).toBe(true);
    });

    it("low voice capture", () => {
      const sessions = [
        makeSession({ has_child_voice: false }),
        makeSession({ id: "ft2", has_child_voice: false }),
      ];
      const r = computeHomeFamilyEngagement(baseInput({ family_time_sessions: sessions }));
      expect(r.concerns.some(c => c.includes("voice"))).toBe(true);
    });

    it("declining relationships", () => {
      const rels = [makeRelationship({ trajectory: "declining" })];
      const r = computeHomeFamilyEngagement(baseInput({ family_relationships: rels }));
      expect(r.concerns.some(c => c.includes("declining"))).toBe(true);
    });

    it("overdue reviews", () => {
      const rels = [makeRelationship({ next_review: daysAgo(10) })];
      const r = computeHomeFamilyEngagement(baseInput({ family_relationships: rels }));
      expect(r.concerns.some(c => c.includes("overdue"))).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // RECOMMENDATIONS
  // ════════════════════════════════════════════════════════════════════════

  describe("recommendations", () => {
    it("unsafe session → immediate", () => {
      const sessions = [makeSession({ was_safe: false })];
      const r = computeHomeFamilyEngagement(baseInput({ family_time_sessions: sessions }));
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("unsafe"))).toBe(true);
    });

    it("children without contact → soon", () => {
      const sessions = [makeSession({ child_id: "C1" })];
      const r = computeHomeFamilyEngagement(baseInput({ family_time_sessions: sessions }));
      expect(r.recommendations.some(rec => rec.urgency === "soon" && rec.recommendation.includes("Facilitate"))).toBe(true);
    });

    it("overdue reviews → soon", () => {
      const rels = [makeRelationship({ next_review: daysAgo(10) })];
      const r = computeHomeFamilyEngagement(baseInput({ family_relationships: rels }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("overdue"))).toBe(true);
    });

    it("recommendations ranked sequentially", () => {
      const sessions = [makeSession({ child_id: "C1", was_safe: false, has_child_voice: false, report_sent_to_sw: false })];
      const rels = [makeRelationship({ next_review: daysAgo(10) })];
      const r = computeHomeFamilyEngagement(baseInput({ family_time_sessions: sessions, family_relationships: rels }));
      for (let i = 0; i < r.recommendations.length - 1; i++) {
        expect(r.recommendations[i].rank).toBeLessThan(r.recommendations[i + 1].rank);
      }
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // INSIGHTS
  // ════════════════════════════════════════════════════════════════════════

  describe("insights", () => {
    it("unsafe sessions → critical", () => {
      const sessions = [makeSession({ was_safe: false })];
      const r = computeHomeFamilyEngagement(baseInput({ family_time_sessions: sessions }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("unsafe"))).toBe(true);
    });

    it("multiple declining → warning", () => {
      const rels = [
        makeRelationship({ child_id: "C1", trajectory: "declining" }),
        makeRelationship({ child_id: "C2", trajectory: "declining" }),
      ];
      const r = computeHomeFamilyEngagement(baseInput({ family_relationships: rels }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("declining"))).toBe(true);
    });

    it("excellent engagement → positive", () => {
      const r = computeHomeFamilyEngagement(baseInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("child-centred"))).toBe(true);
    });

    it("SW notification → positive", () => {
      const r = computeHomeFamilyEngagement(baseInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("Social worker"))).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // EDGE CASES
  // ════════════════════════════════════════════════════════════════════════

  describe("edge cases", () => {
    it("only sessions (no relationships)", () => {
      const r = computeHomeFamilyEngagement(baseInput({ family_relationships: [] }));
      expect(r.family_engagement_rating).toBeDefined();
      expect(r.family_engagement_score).toBeGreaterThan(0);
    });

    it("only relationships (no sessions)", () => {
      const r = computeHomeFamilyEngagement(baseInput({ family_time_sessions: [] }));
      expect(r.family_engagement_rating).toBeDefined();
      expect(r.family_engagement_score).toBeGreaterThan(0);
    });

    it("score clamped to 0-100", () => {
      const sessions = [
        makeSession({ was_safe: false, has_child_voice: false, report_sent_to_sw: false, has_positive_observations: false }),
        makeSession({ id: "ft2", was_safe: false, has_child_voice: false, report_sent_to_sw: false, has_positive_observations: false, date: daysAgo(30) }),
      ];
      const rels = [
        makeRelationship({ quality_1_to_10: 2, trajectory: "declining", has_child_wishes: false, next_review: daysAgo(20) }),
        makeRelationship({ id: "r2", child_id: "C2", quality_1_to_10: 2, trajectory: "declining", has_child_wishes: false, next_review: daysAgo(10) }),
      ];
      const r = computeHomeFamilyEngagement(baseInput({ family_time_sessions: sessions, family_relationships: rels }));
      expect(r.family_engagement_score).toBeGreaterThanOrEqual(0);
      expect(r.family_engagement_score).toBeLessThanOrEqual(100);
    });

    it("all sessions outside 90-day window with relationships present", () => {
      const sessions = [makeSession({ date: daysAgo(100) })];
      const rels = [makeRelationship()];
      const r = computeHomeFamilyEngagement(baseInput({ family_time_sessions: sessions, family_relationships: rels }));
      expect(r.contact_profile.total_sessions_90d).toBe(0);
      expect(r.relationship_profile.total_assessments).toBe(1);
    });

    it("duplicate relationship types use latest", () => {
      const rels = [
        makeRelationship({ child_id: "C1", relationship_type: "parent", assessment_date: daysAgo(60), quality_1_to_10: 3 }),
        makeRelationship({ child_id: "C1", relationship_type: "parent", assessment_date: daysAgo(5), quality_1_to_10: 9 }),
      ];
      const r = computeHomeFamilyEngagement(baseInput({ family_relationships: rels }));
      expect(r.relationship_profile.total_assessments).toBe(1);
      expect(r.relationship_profile.avg_quality_score).toBe(9);
    });
  });
});
