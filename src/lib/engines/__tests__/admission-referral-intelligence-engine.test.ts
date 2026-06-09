// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ADMISSION & REFERRAL INTELLIGENCE ENGINE — TEST SUITE
// Reg 11/12/14 — referral pipeline, impact assessments, matching decisions,
// occupancy management, and ARIA admission intelligence.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeAdmissionReferralIntelligence,
  daysBetween,
  daysUntil,
  average,
  type ReferralInput,
  type ReferralSource,
  type ReferralStatus,
} from "../admission-referral-intelligence-engine";

// ── Constants ─────────────────────────────────────────────────────────────────

const TODAY = "2026-05-25";

// ── Factory Functions ─────────────────────────────────────────────────────────

function makeReferral(overrides: Partial<ReferralInput> = {}): ReferralInput {
  return {
    id: "ref_001",
    child_name: "Child A",
    age: 14,
    gender: "male",
    referral_date: "2026-05-20",
    referral_source: "local_authority",
    local_authority: "Derby City Council",
    status: "under_assessment",
    presenting_needs: ["Emotional difficulties", "School exclusion"],
    risk_factors: ["Self-harm history"],
    impact_assessment_complete: false,
    decision_date: null,
    decision_reason: null,
    estimated_placement_date: null,
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════

describe("Admission Referral Engine — Helpers", () => {
  describe("daysBetween", () => {
    it("returns 0 for same date", () => {
      expect(daysBetween("2026-05-01", "2026-05-01")).toBe(0);
    });

    it("returns correct days between dates", () => {
      expect(daysBetween("2026-05-01", "2026-05-10")).toBe(9);
    });

    it("returns absolute value regardless of order", () => {
      expect(daysBetween("2026-05-10", "2026-05-01")).toBe(9);
    });
  });

  describe("daysUntil", () => {
    it("returns positive for future dates", () => {
      expect(daysUntil("2026-05-25", "2026-06-01")).toBe(7);
    });

    it("returns negative for past dates", () => {
      expect(daysUntil("2026-05-25", "2026-05-20")).toBe(-5);
    });
  });

  describe("average", () => {
    it("returns 0 for empty array", () => {
      expect(average([])).toBe(0);
    });

    it("computes correct average", () => {
      expect(average([10, 20, 30])).toBe(20);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// EMPTY STATE
// ══════════════════════════════════════════════════════════════════════════════

describe("Admission Referral Engine — Empty State", () => {
  it("handles no referrals", () => {
    const result = computeAdmissionReferralIntelligence({
      referrals: [],
      current_occupancy: 3,
      max_occupancy: 5,
      today: TODAY,
    });

    expect(result.overview.total_referrals).toBe(0);
    expect(result.overview.active_referrals).toBe(0);
    expect(result.overview.impact_assessment_completion_rate).toBe(100);
    expect(result.overview.occupancy_rate).toBe(60);
    expect(result.overview.available_beds).toBe(2);
    expect(result.referral_profiles).toHaveLength(0);
    expect(result.alerts).toHaveLength(0);
    expect(result.insights).toHaveLength(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// PIPELINE OVERVIEW
// ══════════════════════════════════════════════════════════════════════════════

describe("Admission Referral Engine — Overview", () => {
  it("counts referrals by status", () => {
    const result = computeAdmissionReferralIntelligence({
      referrals: [
        makeReferral({ id: "r1", status: "new" }),
        makeReferral({ id: "r2", status: "under_assessment" }),
        makeReferral({ id: "r3", status: "impact_assessment", impact_assessment_complete: true }),
        makeReferral({ id: "r4", status: "declined", decision_date: "2026-05-22", impact_assessment_complete: true }),
        makeReferral({ id: "r5", status: "withdrawn" }),
      ],
      current_occupancy: 3,
      max_occupancy: 5,
      today: TODAY,
    });

    expect(result.overview.total_referrals).toBe(5);
    expect(result.overview.active_referrals).toBe(3); // new, under_assessment, impact_assessment
    expect(result.overview.new_count).toBe(1);
    expect(result.overview.under_assessment_count).toBe(1);
    expect(result.overview.impact_assessment_count).toBe(1);
    expect(result.overview.declined_count).toBe(1);
    expect(result.overview.withdrawn_count).toBe(1);
  });

  it("computes impact assessment completion rate", () => {
    const result = computeAdmissionReferralIntelligence({
      referrals: [
        makeReferral({ id: "r1", status: "new", impact_assessment_complete: false }), // excluded (still new)
        makeReferral({ id: "r2", status: "under_assessment", impact_assessment_complete: false }),
        makeReferral({ id: "r3", status: "impact_assessment", impact_assessment_complete: true }),
        makeReferral({ id: "r4", status: "declined", decision_date: "2026-05-22", impact_assessment_complete: true }),
      ],
      current_occupancy: 3,
      max_occupancy: 5,
      today: TODAY,
    });

    // 3 past new stage, 2 with IA complete = 67%
    expect(result.overview.impact_assessment_completion_rate).toBe(67);
  });

  it("computes average days to decision", () => {
    const result = computeAdmissionReferralIntelligence({
      referrals: [
        makeReferral({ id: "r1", status: "accepted", referral_date: "2026-05-10", decision_date: "2026-05-20", impact_assessment_complete: true }), // 10 days
        makeReferral({ id: "r2", status: "declined", referral_date: "2026-05-01", decision_date: "2026-05-21", impact_assessment_complete: true }), // 20 days
      ],
      current_occupancy: 3,
      max_occupancy: 5,
      today: TODAY,
    });

    // Average: (10 + 20) / 2 = 15
    expect(result.overview.avg_days_to_decision).toBe(15);
  });

  it("computes occupancy correctly", () => {
    const result = computeAdmissionReferralIntelligence({
      referrals: [],
      current_occupancy: 4,
      max_occupancy: 5,
      today: TODAY,
    });

    expect(result.overview.occupancy_rate).toBe(80);
    expect(result.overview.available_beds).toBe(1);
  });

  it("handles full occupancy", () => {
    const result = computeAdmissionReferralIntelligence({
      referrals: [],
      current_occupancy: 5,
      max_occupancy: 5,
      today: TODAY,
    });

    expect(result.overview.occupancy_rate).toBe(100);
    expect(result.overview.available_beds).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// REFERRAL PROFILES
// ══════════════════════════════════════════════════════════════════════════════

describe("Admission Referral Engine — Referral Profiles", () => {
  it("creates profiles with days open calculation", () => {
    const result = computeAdmissionReferralIntelligence({
      referrals: [
        makeReferral({ id: "r1", child_name: "Child A", referral_date: "2026-05-20" }),
      ],
      current_occupancy: 3,
      max_occupancy: 5,
      today: TODAY,
    });

    expect(result.referral_profiles).toHaveLength(1);
    expect(result.referral_profiles[0].days_open).toBe(5);
    expect(result.referral_profiles[0].child_name).toBe("Child A");
  });

  it("classifies emergency referrals as critical urgency", () => {
    const result = computeAdmissionReferralIntelligence({
      referrals: [
        makeReferral({ id: "r1", referral_source: "emergency" }),
      ],
      current_occupancy: 3,
      max_occupancy: 5,
      today: TODAY,
    });

    expect(result.referral_profiles[0].urgency).toBe("critical");
  });

  it("classifies referrals open > 14 days as high urgency", () => {
    const result = computeAdmissionReferralIntelligence({
      referrals: [
        makeReferral({ id: "r1", referral_date: "2026-05-01", status: "under_assessment" }), // 24 days
      ],
      current_occupancy: 3,
      max_occupancy: 5,
      today: TODAY,
    });

    expect(result.referral_profiles[0].urgency).toBe("high");
  });

  it("classifies referrals with 3+ risk factors as high urgency", () => {
    const result = computeAdmissionReferralIntelligence({
      referrals: [
        makeReferral({
          id: "r1",
          referral_date: "2026-05-23", // only 2 days, not > 14
          risk_factors: ["Self-harm", "Absconding", "Aggression"],
        }),
      ],
      current_occupancy: 3,
      max_occupancy: 5,
      today: TODAY,
    });

    expect(result.referral_profiles[0].urgency).toBe("high");
  });

  it("classifies standard referrals", () => {
    const result = computeAdmissionReferralIntelligence({
      referrals: [
        makeReferral({ id: "r1", referral_date: "2026-05-22", risk_factors: ["Single risk"] }),
      ],
      current_occupancy: 3,
      max_occupancy: 5,
      today: TODAY,
    });

    expect(result.referral_profiles[0].urgency).toBe("standard");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// SOURCE ANALYSIS
// ══════════════════════════════════════════════════════════════════════════════

describe("Admission Referral Engine — Source Analysis", () => {
  it("groups referrals by source", () => {
    const result = computeAdmissionReferralIntelligence({
      referrals: [
        makeReferral({ id: "r1", referral_source: "local_authority" }),
        makeReferral({ id: "r2", referral_source: "local_authority" }),
        makeReferral({ id: "r3", referral_source: "emergency" }),
        makeReferral({ id: "r4", referral_source: "agency" }),
      ],
      current_occupancy: 3,
      max_occupancy: 5,
      today: TODAY,
    });

    expect(result.source_analysis).toHaveLength(3);
    const la = result.source_analysis.find((s) => s.source === "local_authority")!;
    expect(la.count).toBe(2);
  });

  it("tracks accepted/declined per source", () => {
    const result = computeAdmissionReferralIntelligence({
      referrals: [
        makeReferral({ id: "r1", referral_source: "local_authority", status: "accepted", decision_date: "2026-05-22", impact_assessment_complete: true }),
        makeReferral({ id: "r2", referral_source: "local_authority", status: "declined", decision_date: "2026-05-23", impact_assessment_complete: true }),
        makeReferral({ id: "r3", referral_source: "local_authority", status: "under_assessment" }),
      ],
      current_occupancy: 3,
      max_occupancy: 5,
      today: TODAY,
    });

    const la = result.source_analysis.find((s) => s.source === "local_authority")!;
    expect(la.accepted).toBe(1);
    expect(la.declined).toBe(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// DECISION ANALYSIS
// ══════════════════════════════════════════════════════════════════════════════

describe("Admission Referral Engine — Decision Analysis", () => {
  it("computes acceptance and decline rates", () => {
    const result = computeAdmissionReferralIntelligence({
      referrals: [
        makeReferral({ id: "r1", status: "accepted", decision_date: "2026-05-20", impact_assessment_complete: true }),
        makeReferral({ id: "r2", status: "declined", decision_date: "2026-05-21", impact_assessment_complete: true }),
        makeReferral({ id: "r3", status: "declined", decision_date: "2026-05-22", impact_assessment_complete: true }),
        makeReferral({ id: "r4", status: "withdrawn" }),
      ],
      current_occupancy: 3,
      max_occupancy: 5,
      today: TODAY,
    });

    expect(result.decision_analysis.total_decisions).toBe(4);
    expect(result.decision_analysis.acceptance_rate).toBe(25); // 1/4
    expect(result.decision_analysis.decline_rate).toBe(50); // 2/4
    expect(result.decision_analysis.withdrawal_rate).toBe(25); // 1/4
  });

  it("identifies decisions without impact assessment", () => {
    const result = computeAdmissionReferralIntelligence({
      referrals: [
        makeReferral({ id: "r1", status: "accepted", decision_date: "2026-05-20", impact_assessment_complete: false }),
        makeReferral({ id: "r2", status: "declined", decision_date: "2026-05-21", impact_assessment_complete: true }),
      ],
      current_occupancy: 3,
      max_occupancy: 5,
      today: TODAY,
    });

    expect(result.decision_analysis.decisions_without_impact_assessment).toBe(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// ALERTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Admission Referral Engine — Alerts", () => {
  it("generates critical alert for emergency referral without IA", () => {
    const result = computeAdmissionReferralIntelligence({
      referrals: [
        makeReferral({
          id: "r1",
          child_name: "Child E",
          age: 13,
          referral_source: "emergency",
          status: "under_assessment",
          impact_assessment_complete: false,
        }),
      ],
      current_occupancy: 3,
      max_occupancy: 5,
      today: TODAY,
    });

    const critical = result.alerts.filter((a) => a.severity === "critical");
    expect(critical.some((a) => a.message.includes("Child E") && a.message.includes("Emergency referral"))).toBe(true);
  });

  it("generates critical alert for full capacity with accepted referrals", () => {
    const result = computeAdmissionReferralIntelligence({
      referrals: [
        makeReferral({ id: "r1", status: "accepted", decision_date: "2026-05-20", impact_assessment_complete: true }),
      ],
      current_occupancy: 5,
      max_occupancy: 5,
      today: TODAY,
    });

    const critical = result.alerts.filter((a) => a.severity === "critical");
    expect(critical.some((a) => a.message.includes("full capacity"))).toBe(true);
  });

  it("generates high alert for referrals open > 14 days", () => {
    const result = computeAdmissionReferralIntelligence({
      referrals: [
        makeReferral({ id: "r1", referral_date: "2026-05-01", status: "under_assessment" }), // 24 days
      ],
      current_occupancy: 3,
      max_occupancy: 5,
      today: TODAY,
    });

    const high = result.alerts.filter((a) => a.severity === "high");
    expect(high.some((a) => a.message.includes("14 days"))).toBe(true);
  });

  it("generates medium alert for decisions without IA", () => {
    const result = computeAdmissionReferralIntelligence({
      referrals: [
        makeReferral({ id: "r1", status: "accepted", decision_date: "2026-05-22", impact_assessment_complete: false }),
      ],
      current_occupancy: 3,
      max_occupancy: 5,
      today: TODAY,
    });

    const medium = result.alerts.filter((a) => a.severity === "medium");
    expect(medium.some((a) => a.message.includes("impact assessment"))).toBe(true);
  });

  it("generates low alert for new referrals awaiting review", () => {
    const result = computeAdmissionReferralIntelligence({
      referrals: [
        makeReferral({ id: "r1", status: "new" }),
      ],
      current_occupancy: 3,
      max_occupancy: 5,
      today: TODAY,
    });

    const low = result.alerts.filter((a) => a.severity === "low");
    expect(low.some((a) => a.message.includes("new referral"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// ARIA INSIGHTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Admission Referral Engine — ARIA Insights", () => {
  it("generates critical insight for full capacity with active pipeline", () => {
    const result = computeAdmissionReferralIntelligence({
      referrals: [
        makeReferral({ id: "r1", status: "under_assessment" }),
      ],
      current_occupancy: 5,
      max_occupancy: 5,
      today: TODAY,
    });

    const critical = result.insights.filter((i) => i.severity === "critical");
    expect(critical.some((i) => i.text.includes("full capacity"))).toBe(true);
  });

  it("generates warning for low IA rate", () => {
    const result = computeAdmissionReferralIntelligence({
      referrals: [
        makeReferral({ id: "r1", status: "under_assessment", impact_assessment_complete: false }),
        makeReferral({ id: "r2", status: "impact_assessment", impact_assessment_complete: true }),
        makeReferral({ id: "r3", status: "declined", decision_date: "2026-05-22", impact_assessment_complete: false }),
      ],
      current_occupancy: 3,
      max_occupancy: 5,
      today: TODAY,
    });

    const warnings = result.insights.filter((i) => i.severity === "warning");
    expect(warnings.some((w) => w.text.includes("impact assessment"))).toBe(true);
  });

  it("generates warning for slow decisions", () => {
    const result = computeAdmissionReferralIntelligence({
      referrals: [
        makeReferral({ id: "r1", status: "accepted", referral_date: "2026-04-20", decision_date: "2026-05-10", impact_assessment_complete: true }), // 20 days
        makeReferral({ id: "r2", status: "declined", referral_date: "2026-04-15", decision_date: "2026-05-10", impact_assessment_complete: true }), // 25 days
      ],
      current_occupancy: 3,
      max_occupancy: 5,
      today: TODAY,
    });

    // avg = 22.5 > 14
    const warnings = result.insights.filter((i) => i.severity === "warning");
    expect(warnings.some((w) => w.text.includes("days"))).toBe(true);
  });

  it("generates positive insight for 100% IA rate", () => {
    const result = computeAdmissionReferralIntelligence({
      referrals: [
        makeReferral({ id: "r1", status: "accepted", decision_date: "2026-05-20", impact_assessment_complete: true }),
        makeReferral({ id: "r2", status: "declined", decision_date: "2026-05-21", impact_assessment_complete: true }),
      ],
      current_occupancy: 3,
      max_occupancy: 5,
      today: TODAY,
    });

    const positive = result.insights.filter((i) => i.severity === "positive");
    expect(positive.some((p) => p.text.includes("100%") && p.text.includes("impact assessment"))).toBe(true);
  });

  it("generates positive insight for timely decisions", () => {
    const result = computeAdmissionReferralIntelligence({
      referrals: [
        makeReferral({ id: "r1", status: "accepted", referral_date: "2026-05-15", decision_date: "2026-05-22", impact_assessment_complete: true }), // 7 days
        makeReferral({ id: "r2", status: "declined", referral_date: "2026-05-12", decision_date: "2026-05-22", impact_assessment_complete: true }), // 10 days
      ],
      current_occupancy: 3,
      max_occupancy: 5,
      today: TODAY,
    });

    // avg = 8.5 <= 14
    const positive = result.insights.filter((i) => i.severity === "positive");
    expect(positive.some((p) => p.text.includes("14-day best practice"))).toBe(true);
  });

  it("generates positive insight for available beds", () => {
    const result = computeAdmissionReferralIntelligence({
      referrals: [
        makeReferral({ id: "r1", status: "under_assessment" }),
      ],
      current_occupancy: 3,
      max_occupancy: 5,
      today: TODAY,
    });

    const positive = result.insights.filter((i) => i.severity === "positive");
    expect(positive.some((p) => p.text.includes("bed") && p.text.includes("available"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// FULL OAK HOUSE INTEGRATION
// ══════════════════════════════════════════════════════════════════════════════

describe("Admission Referral Engine — Chamberlain House Integration", () => {
  it("produces comprehensive output for realistic Chamberlain House data", () => {
    const referrals: ReferralInput[] = [
      {
        id: "ref_001",
        child_name: "Child A",
        age: 14,
        gender: "male",
        referral_date: "2026-05-22",
        referral_source: "local_authority",
        local_authority: "Nottinghamshire County Council",
        status: "under_assessment",
        presenting_needs: ["Emotional and behavioural difficulties", "School exclusion", "Previous placement breakdown", "Attachment difficulties"],
        risk_factors: ["Self-harm history", "Absconding from previous placement", "Peer-on-peer aggression"],
        impact_assessment_complete: false,
        decision_date: null,
        decision_reason: null,
        estimated_placement_date: null,
      },
      {
        id: "ref_002",
        child_name: "Child B",
        age: 16,
        gender: "female",
        referral_date: "2026-05-11",
        referral_source: "local_authority",
        local_authority: "Derby City Council",
        status: "impact_assessment",
        presenting_needs: ["Learning difficulties", "Low self-esteem", "Family breakdown", "Mild anxiety"],
        risk_factors: ["Vulnerability to exploitation", "Previous missing episodes"],
        impact_assessment_complete: true,
        decision_date: null,
        decision_reason: null,
        estimated_placement_date: "2026-06-08",
      },
      {
        id: "ref_003",
        child_name: "Child C",
        age: 13,
        gender: "male",
        referral_date: "2026-04-25",
        referral_source: "emergency",
        local_authority: "Derbyshire County Council",
        status: "declined",
        presenting_needs: ["Sexual harmful behaviour", "Fire-setting", "Severe trauma history"],
        risk_factors: ["Sexual harmful behaviour towards peers", "History of fire-setting", "Severe emotional dysregulation"],
        impact_assessment_complete: true,
        decision_date: "2026-04-30",
        decision_reason: "Declined — presenting needs exceed our Statement of Purpose",
        estimated_placement_date: null,
      },
      {
        id: "ref_004",
        child_name: "Child D",
        age: 15,
        gender: "non_binary",
        referral_date: "2026-04-10",
        referral_source: "agency",
        local_authority: "Leicester City Council",
        status: "withdrawn",
        presenting_needs: ["Gender identity support needed", "Bullying at school", "Mild ADHD", "Attachment needs"],
        risk_factors: ["Self-harm (historical, resolved)", "Low-level substance experimentation"],
        impact_assessment_complete: false,
        decision_date: null,
        decision_reason: null,
        estimated_placement_date: null,
      },
    ];

    const result = computeAdmissionReferralIntelligence({
      referrals,
      current_occupancy: 3,
      max_occupancy: 5,
      today: TODAY,
    });

    // Overview
    expect(result.overview.total_referrals).toBe(4);
    expect(result.overview.active_referrals).toBe(2); // under_assessment, impact_assessment
    expect(result.overview.declined_count).toBe(1);
    expect(result.overview.withdrawn_count).toBe(1);
    expect(result.overview.occupancy_rate).toBe(60);
    expect(result.overview.available_beds).toBe(2);

    // Referral profiles
    expect(result.referral_profiles).toHaveLength(4);
    const childA = result.referral_profiles.find((p) => p.id === "ref_001")!;
    expect(childA.urgency).toBe("high"); // 3 risk factors
    expect(childA.presenting_needs_count).toBe(4);

    const childC = result.referral_profiles.find((p) => p.id === "ref_003")!;
    expect(childC.urgency).toBe("critical"); // emergency source

    // Source analysis
    expect(result.source_analysis.length).toBeGreaterThanOrEqual(3);
    const laSource = result.source_analysis.find((s) => s.source === "local_authority")!;
    expect(laSource.count).toBe(2);

    // Decision analysis
    expect(result.decision_analysis.total_decisions).toBe(2); // declined + withdrawn
    expect(result.decision_analysis.decline_rate).toBe(50);

    // Should have alerts (high-risk referral, etc.)
    expect(result.alerts.length).toBeGreaterThan(0);

    // Should have positive insight (beds available with active pipeline)
    const positive = result.insights.filter((i) => i.severity === "positive");
    expect(positive.length).toBeGreaterThanOrEqual(1);
  });
});

describe("Admission Referral Engine — 'placed' status (regression)", () => {
  it("counts a 'placed' referral as accepted + decided (not dropped)", () => {
    const result = computeAdmissionReferralIntelligence({
      referrals: [
        makeReferral({ id: "p1", status: "placed", referral_date: "2026-05-10", decision_date: "2026-05-20", impact_assessment_complete: true }), // 10 days
        makeReferral({ id: "d1", status: "declined", referral_date: "2026-05-01", decision_date: "2026-05-21", impact_assessment_complete: true }), // 20 days
      ],
      current_occupancy: 3,
      max_occupancy: 3,
      today: TODAY,
    });
    // 'placed' is a successful terminal status — it must count as accepted and decided.
    expect(result.overview.accepted_count).toBe(1);
    expect(result.decision_analysis.acceptance_rate).toBe(50); // 1 placed of 2 decided
    expect(result.overview.avg_days_to_decision).toBe(15); // placed included in decision timing (10+20)/2
  });
});
