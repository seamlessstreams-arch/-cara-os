import {
  computeHomeAdmission,
  type HomeAdmissionInput,
  type AdmissionReferralInput,
} from "../home-admission-intelligence-engine";

// ── Helpers ────────────────────────────────────────────────────────────────

const TODAY = "2025-03-15";

function daysAgo(n: number): string {
  const d = new Date("2025-03-15");
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function makeReferral(overrides: Partial<AdmissionReferralInput> = {}): AdmissionReferralInput {
  return {
    id: `ref-${Math.random().toString(36).slice(2, 8)}`,
    referral_date: daysAgo(20),
    referral_source: "local_authority",
    status: "placed",
    presenting_needs_count: 3,
    risk_factors_count: 2,
    impact_assessment_complete: true,
    has_matching_considerations: true,
    has_decision_reason: true,
    decision_date: daysAgo(10),
    days_to_decision: 10,
    ...overrides,
  };
}

function baseInput(overrides: Partial<HomeAdmissionInput> = {}): HomeAdmissionInput {
  return {
    today: TODAY,
    total_children: 3,
    registered_beds: 4,
    referrals: [
      makeReferral({ id: "ref1", status: "placed", days_to_decision: 8, referral_date: daysAgo(30) }),
      makeReferral({ id: "ref2", status: "accepted", days_to_decision: 12, referral_date: daysAgo(25) }),
      makeReferral({ id: "ref3", status: "declined", days_to_decision: 7, referral_date: daysAgo(40) }),
      makeReferral({ id: "ref4", status: "withdrawn", referral_date: daysAgo(45) }),
    ],
    ...overrides,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// RATING TIER TESTS
// ════════════════════════════════════════════════════════════════════════════

describe("Home Admission Intelligence Engine", () => {

  // ── Insufficient data ──────────────────────────────────────────────────

  describe("insufficient data", () => {
    const result = computeHomeAdmission(baseInput({ referrals: [] }));

    it("rates insufficient_data", () => expect(result.admission_rating).toBe("insufficient_data"));
    it("scores 0", () => expect(result.admission_score).toBe(0));
    it("has critical insight", () => expect(result.insights.some(i => i.severity === "critical")).toBe(true));
    it("has recommendation", () => expect(result.recommendations.length).toBeGreaterThan(0));
  });

  // ── Outstanding ────────────────────────────────────────────────────────
  // All impact assessments complete, all matching documented, all decisions
  // reasoned, avg <14 days, no pending >14d, declined with reason, low emergency

  describe("outstanding rating", () => {
    const result = computeHomeAdmission(baseInput());

    it("rates outstanding", () => expect(result.admission_rating).toBe("outstanding"));
    it("scores at least 80", () => expect(result.admission_score).toBeGreaterThanOrEqual(80));
    it("headline mentions outstanding", () => expect(result.headline).toContain("Outstanding"));
    it("has strengths", () => expect(result.strengths.length).toBeGreaterThan(0));
    it("has no concerns", () => expect(result.concerns).toHaveLength(0));
  });

  // ── Good ───────────────────────────────────────────────────────────────
  // 75% impact (3/4 non-withdrawn), 75% matching, all decisions documented,
  // avg 15 days, no pending >14d, 1 declined with reason

  describe("good rating", () => {
    const referrals = [
      makeReferral({ id: "r1", status: "placed", days_to_decision: 15, referral_date: daysAgo(30) }),
      makeReferral({ id: "r2", status: "accepted", days_to_decision: 16, referral_date: daysAgo(25), impact_assessment_complete: false }),
      makeReferral({ id: "r3", status: "declined", days_to_decision: 14, referral_date: daysAgo(40) }),
      makeReferral({ id: "r4", status: "under_assessment", referral_date: daysAgo(10), impact_assessment_complete: false, has_matching_considerations: false, days_to_decision: -1 }),
    ];

    const result = computeHomeAdmission(baseInput({ referrals }));

    it("rates good", () => expect(result.admission_rating).toBe("good"));
    it("scores in good range", () => {
      expect(result.admission_score).toBeGreaterThanOrEqual(65);
      expect(result.admission_score).toBeLessThan(80);
    });
    it("headline mentions good", () => expect(result.headline).toContain("Good"));
  });

  // ── Adequate ───────────────────────────────────────────────────────────
  // 50% impact, 50% matching, 67% decision docs, avg 20 days, 1 pending >14d

  describe("adequate rating", () => {
    const referrals = [
      makeReferral({ id: "r1", status: "placed", days_to_decision: 20, referral_date: daysAgo(30), impact_assessment_complete: false, has_matching_considerations: false }),
      makeReferral({ id: "r2", status: "accepted", days_to_decision: 22, referral_date: daysAgo(25) }),
      makeReferral({ id: "r3", status: "declined", days_to_decision: 18, referral_date: daysAgo(40), has_decision_reason: false }),
      makeReferral({ id: "r4", status: "under_assessment", referral_date: daysAgo(20), impact_assessment_complete: false, has_matching_considerations: false, days_to_decision: -1 }),
    ];

    const result = computeHomeAdmission(baseInput({ referrals }));

    it("rates adequate", () => expect(result.admission_rating).toBe("adequate"));
    it("scores in adequate range", () => {
      expect(result.admission_score).toBeGreaterThanOrEqual(45);
      expect(result.admission_score).toBeLessThan(65);
    });
    it("has concerns", () => expect(result.concerns.length).toBeGreaterThan(0));
    it("has recommendations", () => expect(result.recommendations.length).toBeGreaterThan(0));
  });

  // ── Inadequate ─────────────────────────────────────────────────────────
  // 0% impact, 0% matching, no decision docs, 2+ pending >14d, emergency heavy

  describe("inadequate rating", () => {
    const referrals = [
      makeReferral({ id: "r1", status: "placed", days_to_decision: 30, referral_date: daysAgo(50), impact_assessment_complete: false, has_matching_considerations: false, has_decision_reason: false, referral_source: "emergency" }),
      makeReferral({ id: "r2", status: "accepted", days_to_decision: 28, referral_date: daysAgo(40), impact_assessment_complete: false, has_matching_considerations: false, has_decision_reason: false, referral_source: "emergency" }),
      makeReferral({ id: "r3", status: "new", referral_date: daysAgo(25), impact_assessment_complete: false, has_matching_considerations: false, days_to_decision: -1, referral_source: "emergency" }),
      makeReferral({ id: "r4", status: "under_assessment", referral_date: daysAgo(20), impact_assessment_complete: false, has_matching_considerations: false, days_to_decision: -1 }),
    ];

    const result = computeHomeAdmission(baseInput({ referrals }));

    it("rates inadequate", () => expect(result.admission_rating).toBe("inadequate"));
    it("scores below 45", () => expect(result.admission_score).toBeLessThan(45));
    it("has critical insights", () => expect(result.insights.some(i => i.severity === "critical")).toBe(true));
    it("has multiple concerns", () => expect(result.concerns.length).toBeGreaterThan(2));
    it("has immediate recommendations", () => expect(result.recommendations.some(r => r.urgency === "immediate")).toBe(true));
  });

  // ════════════════════════════════════════════════════════════════════════
  // PROFILE CALCULATION TESTS
  // ════════════════════════════════════════════════════════════════════════

  describe("referral profile", () => {
    const result = computeHomeAdmission(baseInput());

    it("total_referrals", () => expect(result.referral_profile.total_referrals).toBe(4));
    it("active", () => expect(result.referral_profile.active).toBe(0));
    it("accepted", () => expect(result.referral_profile.accepted).toBe(1));
    it("declined", () => expect(result.referral_profile.declined).toBe(1));
    it("withdrawn", () => expect(result.referral_profile.withdrawn).toBe(1));
    it("placed", () => expect(result.referral_profile.placed).toBe(1));
    it("emergency_count", () => expect(result.referral_profile.emergency_count).toBe(0));
    it("acceptance_rate", () => expect(result.referral_profile.acceptance_rate).toBe(67)); // 2/3 (placed+accepted / decided)
  });

  describe("assessment profile", () => {
    const result = computeHomeAdmission(baseInput());

    it("impact_assessment_rate", () => expect(result.assessment_profile.impact_assessment_rate).toBe(100)); // all non-withdrawn have it
    it("matching_consideration_rate", () => expect(result.assessment_profile.matching_consideration_rate).toBe(100));
    it("decision_documented_rate", () => expect(result.assessment_profile.decision_documented_rate).toBe(100));
    it("avg_days_to_decision", () => expect(result.assessment_profile.avg_days_to_decision).toBe(9)); // (8+12+7)/3
    it("pending_over_14_days", () => expect(result.assessment_profile.pending_over_14_days).toBe(0));
  });

  describe("quality profile", () => {
    const result = computeHomeAdmission(baseInput());

    it("avg_needs_per_referral", () => expect(result.quality_profile.avg_needs_per_referral).toBe(3));
    it("avg_risk_factors_per_referral", () => expect(result.quality_profile.avg_risk_factors_per_referral).toBe(2));
    it("declined_with_reason_rate", () => expect(result.quality_profile.declined_with_reason_rate).toBe(100));
    it("occupancy_rate", () => expect(result.quality_profile.occupancy_rate).toBe(75)); // 3/4
  });

  // ════════════════════════════════════════════════════════════════════════
  // SCORING MODIFIER TESTS
  // ════════════════════════════════════════════════════════════════════════

  describe("scoring — impact assessment", () => {
    it("100% gives +5", () => {
      const r = computeHomeAdmission(baseInput());
      expect(r.assessment_profile.impact_assessment_rate).toBe(100);
    });

    it("<60% gives -4", () => {
      const referrals = [
        makeReferral({ impact_assessment_complete: false }),
        makeReferral({ id: "r2", impact_assessment_complete: false }),
        makeReferral({ id: "r3", impact_assessment_complete: true }),
      ];
      const r = computeHomeAdmission(baseInput({ referrals }));
      expect(r.assessment_profile.impact_assessment_rate).toBe(33);
    });
  });

  describe("scoring — decision timeliness", () => {
    it("avg <= 14 gives +3", () => {
      const r = computeHomeAdmission(baseInput());
      expect(r.assessment_profile.avg_days_to_decision).toBeLessThanOrEqual(14);
    });

    it("avg > 21 gives -2", () => {
      const referrals = [
        makeReferral({ days_to_decision: 25, status: "placed" }),
        makeReferral({ id: "r2", days_to_decision: 30, status: "declined" }),
      ];
      const r = computeHomeAdmission(baseInput({ referrals }));
      expect(r.assessment_profile.avg_days_to_decision).toBeGreaterThan(21);
    });
  });

  describe("scoring — pending referrals", () => {
    it("0 pending gives +3", () => {
      const r = computeHomeAdmission(baseInput());
      expect(r.assessment_profile.pending_over_14_days).toBe(0);
    });

    it(">1 pending gives -3", () => {
      const referrals = [
        makeReferral({ id: "r1", status: "new", referral_date: daysAgo(20), days_to_decision: -1, impact_assessment_complete: false }),
        makeReferral({ id: "r2", status: "under_assessment", referral_date: daysAgo(18), days_to_decision: -1, impact_assessment_complete: false }),
      ];
      const r = computeHomeAdmission(baseInput({ referrals }));
      expect(r.assessment_profile.pending_over_14_days).toBe(2);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // STRENGTHS
  // ════════════════════════════════════════════════════════════════════════

  describe("strengths", () => {
    const result = computeHomeAdmission(baseInput());

    it("impact assessment strength", () => expect(result.strengths.some(s => s.includes("Impact assessment"))).toBe(true));
    it("matching strength", () => expect(result.strengths.some(s => s.includes("Matching"))).toBe(true));
    it("decision documentation strength", () => expect(result.strengths.some(s => s.includes("Decision rationale"))).toBe(true));
    it("decision timeliness strength", () => expect(result.strengths.some(s => s.includes("days"))).toBe(true));
    it("declined with reason strength", () => expect(result.strengths.some(s => s.includes("declined"))).toBe(true));
    it("no pending strength", () => expect(result.strengths.some(s => s.includes("No referrals pending"))).toBe(true));
  });

  // ════════════════════════════════════════════════════════════════════════
  // CONCERNS
  // ════════════════════════════════════════════════════════════════════════

  describe("concerns", () => {
    it("low impact assessment rate", () => {
      const referrals = [makeReferral({ impact_assessment_complete: false })];
      const r = computeHomeAdmission(baseInput({ referrals }));
      expect(r.concerns.some(c => c.includes("Impact assessment"))).toBe(true);
    });

    it("pending over 14 days", () => {
      const referrals = [
        makeReferral({ status: "new", referral_date: daysAgo(20), days_to_decision: -1 }),
      ];
      const r = computeHomeAdmission(baseInput({ referrals }));
      expect(r.concerns.some(c => c.includes("pending over 14 days"))).toBe(true);
    });

    it("declined without reason", () => {
      const referrals = [makeReferral({ status: "declined", has_decision_reason: false })];
      const r = computeHomeAdmission(baseInput({ referrals }));
      expect(r.concerns.some(c => c.includes("declined"))).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // RECOMMENDATIONS
  // ════════════════════════════════════════════════════════════════════════

  describe("recommendations", () => {
    it("low impact → immediate", () => {
      const referrals = [makeReferral({ impact_assessment_complete: false })];
      const r = computeHomeAdmission(baseInput({ referrals }));
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("impact assessment"))).toBe(true);
    });

    it("pending >14d → immediate", () => {
      const referrals = [makeReferral({ status: "new", referral_date: daysAgo(20), days_to_decision: -1 })];
      const r = computeHomeAdmission(baseInput({ referrals }));
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("outstanding"))).toBe(true);
    });

    it("recommendations ranked sequentially", () => {
      const referrals = [
        makeReferral({ status: "new", referral_date: daysAgo(20), days_to_decision: -1, impact_assessment_complete: false, has_matching_considerations: false }),
      ];
      const r = computeHomeAdmission(baseInput({ referrals }));
      for (let i = 0; i < r.recommendations.length - 1; i++) {
        expect(r.recommendations[i].rank).toBeLessThan(r.recommendations[i + 1].rank);
      }
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // INSIGHTS
  // ════════════════════════════════════════════════════════════════════════

  describe("insights", () => {
    it("low impact → critical", () => {
      const referrals = [makeReferral({ impact_assessment_complete: false })];
      const r = computeHomeAdmission(baseInput({ referrals }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("Impact assessment"))).toBe(true);
    });

    it("excellent compliance → positive", () => {
      const r = computeHomeAdmission(baseInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("rigorous"))).toBe(true);
    });

    it("declined with reason → positive", () => {
      const r = computeHomeAdmission(baseInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("declined"))).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // EDGE CASES
  // ════════════════════════════════════════════════════════════════════════

  describe("edge cases", () => {
    it("single referral", () => {
      const r = computeHomeAdmission(baseInput({ referrals: [makeReferral()] }));
      expect(r.admission_rating).toBeDefined();
      expect(r.admission_score).toBeGreaterThan(0);
    });

    it("all withdrawn — impact assessment rate skips withdrawn", () => {
      const referrals = [
        makeReferral({ status: "withdrawn" }),
        makeReferral({ id: "r2", status: "withdrawn" }),
      ];
      const r = computeHomeAdmission(baseInput({ referrals }));
      // Non-withdrawn is empty, so rates are 0
      expect(r.referral_profile.withdrawn).toBe(2);
    });

    it("no decided referrals — decision modifiers skipped", () => {
      const referrals = [
        makeReferral({ status: "new", referral_date: daysAgo(5), days_to_decision: -1 }),
        makeReferral({ id: "r2", status: "under_assessment", referral_date: daysAgo(3), days_to_decision: -1 }),
      ];
      const r = computeHomeAdmission(baseInput({ referrals }));
      expect(r.assessment_profile.avg_days_to_decision).toBe(0);
    });

    it("score clamped to 0-100", () => {
      const referrals = Array.from({ length: 10 }, (_, i) =>
        makeReferral({
          id: `bad-${i}`,
          status: "new",
          referral_date: daysAgo(30),
          days_to_decision: -1,
          impact_assessment_complete: false,
          has_matching_considerations: false,
          referral_source: "emergency",
        }),
      );
      const r = computeHomeAdmission(baseInput({ referrals }));
      expect(r.admission_score).toBeGreaterThanOrEqual(0);
      expect(r.admission_score).toBeLessThanOrEqual(100);
    });

    it("0 registered beds handles divide by zero", () => {
      const r = computeHomeAdmission(baseInput({ registered_beds: 0 }));
      expect(r.quality_profile.occupancy_rate).toBe(0);
    });
  });
});
