import { describe, it, expect } from "vitest";
import {
  computeChildVoiceParticipation,
  type ChildVoiceParticipationInput,
  type LacReviewInput,
  type AdvocacyInput,
  type KeyWorkSessionInput,
  type FeedbackEntryInput,
  type ChildInfo,
} from "../child-voice-participation-engine";

// ── Helpers ────────────────────────────────────────────────────────────────

const TODAY = "2026-05-26";

const CHILDREN: ChildInfo[] = [
  { id: "yp_1", name: "Alex" },
  { id: "yp_2", name: "Jordan" },
  { id: "yp_3", name: "Casey" },
];

function makeReview(overrides: Partial<LacReviewInput> = {}): LacReviewInput {
  return {
    id: "lac_1",
    child_id: "yp_1",
    date: "2026-05-10",
    child_participation: "attended",
    child_views_recorded: true,
    iro_name: "Sarah Mitchell",
    ...overrides,
  };
}

function makeAdvocacy(overrides: Partial<AdvocacyInput> = {}): AdvocacyInput {
  return {
    id: "adv_1",
    child_id: "yp_1",
    status: "active",
    provider: "NYAS",
    referral_date: "2026-04-01",
    visits_count: 3,
    issues_raised: ["placement stability"],
    private_sessions: 2,
    ...overrides,
  };
}

function makeKeyWork(overrides: Partial<KeyWorkSessionInput> = {}): KeyWorkSessionInput {
  return {
    id: "kw_1",
    child_id: "yp_1",
    date: "2026-05-20",
    child_engaged: true,
    child_views_captured: true,
    themes: ["feelings", "school"],
    ...overrides,
  };
}

function makeFeedback(overrides: Partial<FeedbackEntryInput> = {}): FeedbackEntryInput {
  return {
    id: "fb_1",
    child_id: "yp_1",
    date: "2026-05-15",
    type: "suggestion",
    status: "resolved",
    response_given: true,
    response_within_target: true,
    ...overrides,
  };
}

function baseInput(overrides: Partial<ChildVoiceParticipationInput> = {}): ChildVoiceParticipationInput {
  return {
    today: TODAY,
    children: CHILDREN,
    lac_reviews: [],
    advocacy_records: [],
    key_work_sessions: [],
    feedback_entries: [],
    ...overrides,
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("computeChildVoiceParticipation", () => {
  it("returns all required top-level fields", () => {
    const result = computeChildVoiceParticipation(baseInput());
    expect(result).toHaveProperty("generated_at", TODAY);
    expect(result).toHaveProperty("voice_health");
    expect(result).toHaveProperty("voice_score");
    expect(result).toHaveProperty("headline");
    expect(result).toHaveProperty("review_participation");
    expect(result).toHaveProperty("advocacy_overview");
    expect(result).toHaveProperty("key_work_engagement");
    expect(result).toHaveProperty("feedback_analysis");
    expect(result).toHaveProperty("child_profiles");
    expect(result).toHaveProperty("strengths");
    expect(result).toHaveProperty("concerns");
    expect(result).toHaveProperty("recommendations");
    expect(result).toHaveProperty("insights");
  });

  it("handles empty input", () => {
    const result = computeChildVoiceParticipation(baseInput());
    expect(result.voice_score).toBeGreaterThanOrEqual(0);
    expect(result.review_participation.total_reviews_90d).toBe(0);
    expect(result.child_profiles).toHaveLength(3);
  });

  // ── Review Participation ──────────────────────────────────────────────

  it("computes 100% participation rate", () => {
    const reviews = [
      makeReview({ id: "r1", child_id: "yp_1", child_participation: "attended" }),
      makeReview({ id: "r2", child_id: "yp_2", child_participation: "represented" }),
      makeReview({ id: "r3", child_id: "yp_3", child_participation: "written_views" }),
    ];
    const result = computeChildVoiceParticipation(baseInput({ lac_reviews: reviews }));
    expect(result.review_participation.participation_rate).toBe(100);
    expect(result.review_participation.attended_count).toBe(1);
    expect(result.review_participation.represented_count).toBe(1);
    expect(result.review_participation.written_views_count).toBe(1);
    expect(result.strengths.some((s) => s.includes("100% LAC review participation"))).toBe(true);
  });

  it("flags low participation", () => {
    const reviews = [
      makeReview({ id: "r1", child_participation: "attended" }),
      makeReview({ id: "r2", child_id: "yp_2", child_participation: "did_not_participate", child_views_recorded: false }),
      makeReview({ id: "r3", child_id: "yp_3", child_participation: "did_not_participate", child_views_recorded: false }),
    ];
    const result = computeChildVoiceParticipation(baseInput({ lac_reviews: reviews }));
    expect(result.review_participation.participation_rate).toBeLessThan(50);
    expect(result.review_participation.did_not_participate_count).toBe(2);
    expect(result.concerns.some((c) => c.includes("did not participate"))).toBe(true);
    expect(result.recommendations.some((r) => r.domain === "reviews")).toBe(true);
  });

  it("tracks views recorded rate", () => {
    const reviews = [
      makeReview({ id: "r1", child_views_recorded: true }),
      makeReview({ id: "r2", child_id: "yp_2", child_views_recorded: false }),
    ];
    const result = computeChildVoiceParticipation(baseInput({ lac_reviews: reviews }));
    expect(result.review_participation.views_recorded_rate).toBe(50);
    expect(result.concerns.some((c) => c.includes("views recorded"))).toBe(true);
  });

  // ── Advocacy Overview ─────────────────────────────────────────────────

  it("counts advocacy access correctly", () => {
    const advocacy = [
      makeAdvocacy({ id: "a1", child_id: "yp_1", status: "active" }),
      makeAdvocacy({ id: "a2", child_id: "yp_2", status: "completed" }),
    ];
    const result = computeChildVoiceParticipation(baseInput({ advocacy_records: advocacy }));
    expect(result.advocacy_overview.children_with_advocacy).toBe(2);
    expect(result.advocacy_overview.active_referrals).toBe(1);
    expect(result.advocacy_overview.completed_referrals).toBe(1);
  });

  it("flags no advocacy access", () => {
    const result = computeChildVoiceParticipation(baseInput());
    expect(result.advocacy_overview.children_with_advocacy).toBe(0);
    expect(result.concerns.some((c) => c.includes("advocacy access"))).toBe(true);
    expect(result.recommendations.some((r) => r.domain === "advocacy")).toBe(true);
  });

  it("counts private sessions", () => {
    const advocacy = [
      makeAdvocacy({ id: "a1", private_sessions: 3 }),
      makeAdvocacy({ id: "a2", child_id: "yp_2", private_sessions: 1 }),
    ];
    const result = computeChildVoiceParticipation(baseInput({ advocacy_records: advocacy }));
    expect(result.advocacy_overview.private_sessions_count).toBe(4);
    expect(result.strengths.some((s) => s.includes("private advocacy sessions"))).toBe(true);
  });

  it("identifies top advocacy issues", () => {
    const advocacy = [
      makeAdvocacy({ id: "a1", issues_raised: ["education plan", "placement"] }),
      makeAdvocacy({ id: "a2", child_id: "yp_2", issues_raised: ["education plan", "contact"] }),
    ];
    const result = computeChildVoiceParticipation(baseInput({ advocacy_records: advocacy }));
    expect(result.advocacy_overview.top_issues[0]?.issue).toBe("education plan");
  });

  // ── Key Work Engagement ───────────────────────────────────────────────

  it("computes key work engagement rate", () => {
    const sessions = [
      makeKeyWork({ id: "k1", child_engaged: true }),
      makeKeyWork({ id: "k2", child_id: "yp_2", child_engaged: true }),
      makeKeyWork({ id: "k3", child_id: "yp_3", child_engaged: false, child_views_captured: false }),
    ];
    const result = computeChildVoiceParticipation(baseInput({ key_work_sessions: sessions }));
    expect(result.key_work_engagement.total_sessions_30d).toBe(3);
    expect(result.key_work_engagement.engagement_rate).toBe(67);
  });

  it("computes views capture rate", () => {
    const sessions = [
      makeKeyWork({ id: "k1", child_views_captured: true }),
      makeKeyWork({ id: "k2", child_views_captured: true }),
      makeKeyWork({ id: "k3", child_views_captured: false }),
    ];
    const result = computeChildVoiceParticipation(baseInput({ key_work_sessions: sessions }));
    expect(result.key_work_engagement.views_capture_rate).toBe(67);
  });

  it("identifies key work themes", () => {
    const sessions = [
      makeKeyWork({ id: "k1", themes: ["feelings", "school"] }),
      makeKeyWork({ id: "k2", themes: ["feelings", "family"] }),
      makeKeyWork({ id: "k3", themes: ["school"] }),
    ];
    const result = computeChildVoiceParticipation(baseInput({ key_work_sessions: sessions }));
    expect(result.key_work_engagement.top_themes[0]?.theme).toBe("feelings");
  });

  // ── Feedback Analysis ─────────────────────────────────────────────────

  it("categorises feedback types", () => {
    const feedback = [
      makeFeedback({ id: "f1", type: "complaint" }),
      makeFeedback({ id: "f2", type: "compliment" }),
      makeFeedback({ id: "f3", type: "suggestion" }),
      makeFeedback({ id: "f4", type: "complaint" }),
    ];
    const result = computeChildVoiceParticipation(baseInput({ feedback_entries: feedback }));
    expect(result.feedback_analysis.complaints).toBe(2);
    expect(result.feedback_analysis.compliments).toBe(1);
    expect(result.feedback_analysis.suggestions).toBe(1);
  });

  it("flags open feedback", () => {
    const feedback = [
      makeFeedback({ id: "f1", status: "open", response_given: false }),
      makeFeedback({ id: "f2", status: "open", response_given: false }),
    ];
    const result = computeChildVoiceParticipation(baseInput({ feedback_entries: feedback }));
    expect(result.feedback_analysis.open_count).toBe(2);
    expect(result.concerns.some((c) => c.includes("unresolved"))).toBe(true);
    expect(result.recommendations.some((r) => r.domain === "feedback")).toBe(true);
  });

  it("gives strength for 100% response rate", () => {
    const feedback = [
      makeFeedback({ id: "f1", response_given: true }),
      makeFeedback({ id: "f2", response_given: true }),
    ];
    const result = computeChildVoiceParticipation(baseInput({ feedback_entries: feedback }));
    expect(result.feedback_analysis.response_rate).toBe(100);
    expect(result.strengths.some((s) => s.includes("feedback responded to"))).toBe(true);
  });

  it("gives strength for complaints with full response", () => {
    const feedback = [
      makeFeedback({ id: "f1", type: "complaint", response_given: true, status: "resolved" }),
    ];
    const result = computeChildVoiceParticipation(baseInput({ feedback_entries: feedback }));
    expect(result.insights.some((i) => i.severity === "positive" && i.text.includes("complaint"))).toBe(true);
  });

  // ── Per-Child Voice Profiles ──────────────────────────────────────────

  it("produces per-child voice profiles", () => {
    const result = computeChildVoiceParticipation(baseInput({
      lac_reviews: [makeReview({ child_id: "yp_1" })],
      key_work_sessions: [makeKeyWork({ child_id: "yp_1" })],
      advocacy_records: [makeAdvocacy({ child_id: "yp_1" })],
    }));
    expect(result.child_profiles).toHaveLength(3);
    const alex = result.child_profiles.find((p) => p.child_id === "yp_1");
    expect(alex?.review_participated).toBe(true);
    expect(alex?.has_advocacy).toBe(true);
    expect(alex?.voice_score).toBeGreaterThan(0);
  });

  it("sorts profiles by voice score (lowest first)", () => {
    const result = computeChildVoiceParticipation(baseInput({
      lac_reviews: [makeReview({ child_id: "yp_1" })],
      key_work_sessions: [
        makeKeyWork({ id: "k1", child_id: "yp_1" }),
        makeKeyWork({ id: "k2", child_id: "yp_1" }),
      ],
      advocacy_records: [makeAdvocacy({ child_id: "yp_1" })],
    }));
    for (let i = 1; i < result.child_profiles.length; i++) {
      expect(result.child_profiles[i].voice_score).toBeGreaterThanOrEqual(result.child_profiles[i - 1].voice_score);
    }
  });

  it("flags silent children", () => {
    const result = computeChildVoiceParticipation(baseInput({
      lac_reviews: [
        makeReview({ id: "r1", child_id: "yp_1" }),
        makeReview({ id: "r2", child_id: "yp_2", child_participation: "did_not_participate", child_views_recorded: false }),
      ],
    }));
    const jordan = result.child_profiles.find((p) => p.child_id === "yp_2");
    expect(jordan?.flags.some((f) => f.includes("voice not heard"))).toBe(true);
  });

  // ── Voice Score & Health ──────────────────────────────────────────────

  it("rates outstanding for comprehensive voice practice", () => {
    const reviews = CHILDREN.map((c, i) =>
      makeReview({ id: `r${i}`, child_id: c.id, child_participation: "attended" }),
    );
    const advocacy = CHILDREN.map((c, i) =>
      makeAdvocacy({ id: `a${i}`, child_id: c.id, status: "active", private_sessions: 2 }),
    );
    const kwSessions = CHILDREN.flatMap((c, ci) =>
      Array.from({ length: 3 }, (_, i) =>
        makeKeyWork({ id: `k${ci}_${i}`, child_id: c.id, date: `2026-05-${String(10 + i).padStart(2, "0")}` }),
      ),
    );
    const feedback = CHILDREN.map((c, i) =>
      makeFeedback({ id: `f${i}`, child_id: c.id, type: i === 0 ? "complaint" : "suggestion" }),
    );
    const result = computeChildVoiceParticipation(baseInput({
      lac_reviews: reviews,
      advocacy_records: advocacy,
      key_work_sessions: kwSessions,
      feedback_entries: feedback,
    }));
    expect(result.voice_health).toBe("outstanding");
    expect(result.voice_score).toBeGreaterThanOrEqual(80);
    expect(result.insights.some((i) => i.severity === "positive")).toBe(true);
  });

  it("rates inadequate for poor voice practice", () => {
    const reviews = [
      makeReview({ id: "r1", child_id: "yp_1", child_participation: "did_not_participate", child_views_recorded: false }),
      makeReview({ id: "r2", child_id: "yp_2", child_participation: "did_not_participate", child_views_recorded: false }),
    ];
    const result = computeChildVoiceParticipation(baseInput({ lac_reviews: reviews }));
    expect(result.voice_health).toBe("inadequate");
    expect(result.voice_score).toBeLessThan(45);
    expect(result.insights.some((i) => i.severity === "critical")).toBe(true);
  });

  it("clamps score between 0 and 100", () => {
    const result = computeChildVoiceParticipation(baseInput());
    expect(result.voice_score).toBeGreaterThanOrEqual(0);
    expect(result.voice_score).toBeLessThanOrEqual(100);
  });

  // ── Headline ──────────────────────────────────────────────────────────

  it("includes key metrics in headline", () => {
    const result = computeChildVoiceParticipation(baseInput({
      lac_reviews: [makeReview()],
      advocacy_records: [makeAdvocacy()],
      key_work_sessions: [makeKeyWork()],
    }));
    expect(result.headline).toContain("100% LAC review participation");
    expect(result.headline).toContain("1 child with advocacy");
    expect(result.headline).toContain("1 key work session");
  });

  // ── ARIA Insights ─────────────────────────────────────────────────────

  it("generates critical insight for multiple silent children", () => {
    const result = computeChildVoiceParticipation(baseInput());
    // All 3 children silent
    expect(result.insights.some((i) => i.severity === "critical" && i.text.includes("minimal voice engagement"))).toBe(true);
  });

  it("generates warning for no participation + no advocacy", () => {
    const reviews = [
      makeReview({ id: "r1", child_id: "yp_1", child_participation: "did_not_participate", child_views_recorded: false }),
      makeReview({ id: "r2", child_id: "yp_2", child_participation: "did_not_participate", child_views_recorded: false }),
    ];
    const result = computeChildVoiceParticipation(baseInput({ lac_reviews: reviews }));
    expect(result.insights.some((i) => i.severity === "warning" && i.text.includes("advocacy"))).toBe(true);
  });

  it("generates positive insight for outstanding + dual-track participation", () => {
    const reviews = CHILDREN.map((c, i) =>
      makeReview({ id: `r${i}`, child_id: c.id }),
    );
    const kwSessions = CHILDREN.flatMap((c, ci) =>
      Array.from({ length: 3 }, (_, i) =>
        makeKeyWork({ id: `k${ci}_${i}`, child_id: c.id, date: `2026-05-${String(10 + i).padStart(2, "0")}` }),
      ),
    );
    const advocacy = [makeAdvocacy({ child_id: "yp_1", private_sessions: 3 })];
    const feedback = [makeFeedback({ child_id: "yp_1" }), makeFeedback({ id: "f2", child_id: "yp_2" })];
    const result = computeChildVoiceParticipation(baseInput({
      lac_reviews: reviews,
      key_work_sessions: kwSessions,
      advocacy_records: advocacy,
      feedback_entries: feedback,
    }));
    expect(result.insights.some((i) => i.severity === "positive" && i.text.includes("dual-track"))).toBe(true);
  });

  // ── Recommendation ordering ───────────────────────────────────────────

  it("orders recommendations by urgency", () => {
    const reviews = [
      makeReview({ id: "r1", child_participation: "did_not_participate", child_views_recorded: false }),
    ];
    const result = computeChildVoiceParticipation(baseInput({ lac_reviews: reviews }));
    const urgencies = result.recommendations.map((r) => r.urgency);
    const order = { immediate: 0, soon: 1, planned: 2 };
    for (let i = 1; i < urgencies.length; i++) {
      expect(order[urgencies[i]]).toBeGreaterThanOrEqual(order[urgencies[i - 1]]);
    }
  });
});
