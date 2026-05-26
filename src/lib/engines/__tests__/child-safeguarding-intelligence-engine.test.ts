import { describe, it, expect } from "vitest";
import {
  computeChildSafeguarding,
  type ChildSafeguardingInput,
  type RiskAssessmentInput,
  type IncidentInput,
  type MissingEpisodeInput,
  type RestraintInput,
  type ContextualMarkerInput,
} from "../child-safeguarding-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2026-05-26";

function daysAgo(n: number): string {
  const d = new Date("2026-05-26");
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function daysFromNow(n: number): string {
  const d = new Date("2026-05-26");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function makeRiskAssessment(overrides: Partial<RiskAssessmentInput> = {}): RiskAssessmentInput {
  return {
    id: "ra_1",
    domain: "aggression",
    current_level: "medium",
    previous_level: "high",
    trend: "decreasing",
    status: "current",
    assessed_date: daysAgo(14),
    review_date: daysFromNow(16),
    triggers: ["Tiredness"],
    indicators: ["Raised voice"],
    mitigations: [{ strategy: "De-escalation", effectiveness: "effective" }],
    child_views: "I know I get angry sometimes.",
    linked_incidents: [],
    ...overrides,
  };
}

function makeIncident(overrides: Partial<IncidentInput> = {}): IncidentInput {
  return {
    id: "inc_1",
    date: daysAgo(10),
    type: "behaviour",
    severity: "medium",
    involved_child: true,
    ...overrides,
  };
}

function makeMissing(overrides: Partial<MissingEpisodeInput> = {}): MissingEpisodeInput {
  return {
    id: "miss_1",
    date: daysAgo(20),
    duration_hours: 2,
    risk_level: "medium",
    returned: true,
    return_interview_completed: true,
    contextual_safeguarding_risk: false,
    pattern_notes: null,
    ...overrides,
  };
}

function makeRestraint(overrides: Partial<RestraintInput> = {}): RestraintInput {
  return {
    id: "rest_1",
    date: daysAgo(15),
    duration_minutes: 5,
    reason: "Risk of harm to others",
    de_escalation_attempts: ["Verbal de-escalation", "Offered quiet room"],
    injuries_count: 0,
    child_debriefed: true,
    staff_debriefed: true,
    review_status: "reviewed",
    ...overrides,
  };
}

function makeContextual(overrides: Partial<ContextualMarkerInput> = {}): ContextualMarkerInput {
  return {
    id: "ctx_1",
    domain: "exploitation",
    risk_level: "medium",
    date_identified: daysAgo(30),
    status: "active",
    ...overrides,
  };
}

function baseInput(overrides: Partial<ChildSafeguardingInput> = {}): ChildSafeguardingInput {
  return {
    today: TODAY,
    child_id: "yp_test",
    child_name: "Test Child",
    child_age: 15,
    risk_assessments: [makeRiskAssessment()],
    incidents: [],
    missing_episodes: [],
    restraints: [],
    contextual_markers: [],
    ...overrides,
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("computeChildSafeguarding", () => {
  // ── Output Shape ──────────────────────────────────────────────────────
  it("returns all required top-level fields", () => {
    const r = computeChildSafeguarding(baseInput());
    expect(r).toHaveProperty("generated_at", TODAY);
    expect(r).toHaveProperty("child_id", "yp_test");
    expect(r).toHaveProperty("child_name", "Test Child");
    expect(r).toHaveProperty("safeguarding_status");
    expect(r).toHaveProperty("safeguarding_score");
    expect(r).toHaveProperty("headline");
    expect(r).toHaveProperty("risk_domains");
    expect(r).toHaveProperty("incident_profile");
    expect(r).toHaveProperty("missing_profile");
    expect(r).toHaveProperty("restraint_profile");
    expect(r).toHaveProperty("contextual_risks_active");
    expect(r).toHaveProperty("child_voice");
    expect(r).toHaveProperty("strengths");
    expect(r).toHaveProperty("concerns");
    expect(r).toHaveProperty("recommendations");
    expect(r).toHaveProperty("insights");
  });

  // ── Empty Input ───────────────────────────────────────────────────────
  it("returns insufficient_data when no risk data provided", () => {
    const r = computeChildSafeguarding(baseInput({
      risk_assessments: [],
      incidents: [],
      missing_episodes: [],
      restraints: [],
      contextual_markers: [],
    }));
    expect(r.safeguarding_status).toBe("insufficient_data");
  });

  // ── Risk Domain Profiles ──────────────────────────────────────────────
  it("builds risk domain profiles from current assessments", () => {
    const r = computeChildSafeguarding(baseInput({
      risk_assessments: [
        makeRiskAssessment({ id: "ra_1", domain: "aggression", current_level: "high" }),
        makeRiskAssessment({ id: "ra_2", domain: "self_harm", current_level: "medium" }),
        makeRiskAssessment({ id: "ra_3", domain: "absconding", current_level: "low", status: "superseded" }),
      ],
    }));
    // Only current/under_review — superseded excluded
    expect(r.risk_domains.length).toBe(2);
    // Sorted by severity descending
    expect(r.risk_domains[0].domain).toBe("aggression");
    expect(r.risk_domains[0].current_level).toBe("high");
  });

  it("marks overdue risk assessments correctly", () => {
    const r = computeChildSafeguarding(baseInput({
      risk_assessments: [
        makeRiskAssessment({ review_date: daysAgo(5) }), // overdue
      ],
    }));
    expect(r.risk_domains[0].is_overdue).toBe(true);
    expect(r.risk_domains[0].days_until_review).toBeLessThan(0);
  });

  it("marks upcoming reviews as not overdue", () => {
    const r = computeChildSafeguarding(baseInput({
      risk_assessments: [
        makeRiskAssessment({ review_date: daysFromNow(10) }),
      ],
    }));
    expect(r.risk_domains[0].is_overdue).toBe(false);
    expect(r.risk_domains[0].days_until_review).toBe(10);
  });

  it("counts effective mitigations per domain", () => {
    const r = computeChildSafeguarding(baseInput({
      risk_assessments: [
        makeRiskAssessment({
          mitigations: [
            { strategy: "A", effectiveness: "effective" },
            { strategy: "B", effectiveness: "not_effective" },
            { strategy: "C", effectiveness: "partially_effective" },
          ],
        }),
      ],
    }));
    expect(r.risk_domains[0].effective_mitigations).toBe(1);
    expect(r.risk_domains[0].total_mitigations).toBe(3);
  });

  // ── Incident Profile ──────────────────────────────────────────────────
  it("calculates incident profile within 90 days", () => {
    const r = computeChildSafeguarding(baseInput({
      incidents: [
        makeIncident({ id: "i1", date: daysAgo(5), severity: "low" }),
        makeIncident({ id: "i2", date: daysAgo(30), severity: "high" }),
        makeIncident({ id: "i3", date: daysAgo(60), severity: "critical" }),
        makeIncident({ id: "i4", date: daysAgo(120), severity: "low" }), // outside 90d
      ],
    }));
    expect(r.incident_profile.total_90d).toBe(3);
    expect(r.incident_profile.high_severity_count).toBe(2); // high + critical
    expect(r.incident_profile.critical_count).toBe(1);
  });

  it("determines incident trend from 45d halves", () => {
    // Only recent incidents, none in older period → increasing
    const r = computeChildSafeguarding(baseInput({
      incidents: [
        makeIncident({ id: "i1", date: daysAgo(5) }),
        makeIncident({ id: "i2", date: daysAgo(10) }),
        makeIncident({ id: "i3", date: daysAgo(30) }),
      ],
    }));
    expect(r.incident_profile.trend).toBe("increasing");
  });

  it("returns decreasing trend when incidents reduce", () => {
    const r = computeChildSafeguarding(baseInput({
      incidents: [
        makeIncident({ id: "i1", date: daysAgo(60) }),
        makeIncident({ id: "i2", date: daysAgo(70) }),
        makeIncident({ id: "i3", date: daysAgo(80) }),
      ],
    }));
    expect(r.incident_profile.trend).toBe("decreasing");
  });

  it("provides types breakdown", () => {
    const r = computeChildSafeguarding(baseInput({
      incidents: [
        makeIncident({ id: "i1", type: "behaviour" }),
        makeIncident({ id: "i2", type: "behaviour" }),
        makeIncident({ id: "i3", type: "safeguarding" }),
      ],
    }));
    expect(r.incident_profile.types_breakdown[0].type).toBe("behaviour");
    expect(r.incident_profile.types_breakdown[0].count).toBe(2);
  });

  // ── Missing Profile ───────────────────────────────────────────────────
  it("calculates missing profile correctly", () => {
    const r = computeChildSafeguarding(baseInput({
      missing_episodes: [
        makeMissing({ id: "m1", duration_hours: 3, risk_level: "high" }),
        makeMissing({ id: "m2", duration_hours: 1.5, risk_level: "low", return_interview_completed: false }),
      ],
    }));
    expect(r.missing_profile.total_90d).toBe(2);
    expect(r.missing_profile.total_hours_missing).toBe(4.5);
    expect(r.missing_profile.high_risk_count).toBe(1);
    expect(r.missing_profile.return_interview_rate).toBe(50);
  });

  it("detects contextual safeguarding risk in missing episodes", () => {
    const r = computeChildSafeguarding(baseInput({
      missing_episodes: [
        makeMissing({ contextual_safeguarding_risk: true }),
        makeMissing({ id: "m2", contextual_safeguarding_risk: true }),
      ],
    }));
    expect(r.missing_profile.contextual_risk_count).toBe(2);
  });

  it("detects repeat pattern from pattern notes", () => {
    const r = computeChildSafeguarding(baseInput({
      missing_episodes: [
        makeMissing({ pattern_notes: "Usually after contact with mum" }),
      ],
    }));
    expect(r.missing_profile.repeat_pattern).toBe(true);
  });

  // ── Restraint Profile ─────────────────────────────────────────────────
  it("calculates restraint profile correctly", () => {
    const r = computeChildSafeguarding(baseInput({
      restraints: [
        makeRestraint({ id: "r1", duration_minutes: 5, injuries_count: 0, child_debriefed: true }),
        makeRestraint({ id: "r2", duration_minutes: 8, injuries_count: 1, child_debriefed: false, review_status: "pending" }),
      ],
    }));
    expect(r.restraint_profile.total_90d).toBe(2);
    expect(r.restraint_profile.total_duration_minutes).toBe(13);
    expect(r.restraint_profile.injuries_count).toBe(1);
    expect(r.restraint_profile.debrief_rate).toBe(50);
    expect(r.restraint_profile.review_rate).toBe(50);
  });

  // ── Contextual Risks ──────────────────────────────────────────────────
  it("counts active contextual risks", () => {
    const r = computeChildSafeguarding(baseInput({
      contextual_markers: [
        makeContextual({ id: "c1", status: "active" }),
        makeContextual({ id: "c2", status: "monitoring" }),
        makeContextual({ id: "c3", status: "resolved" }),
      ],
    }));
    expect(r.contextual_risks_active).toBe(2);
  });

  // ── Child Voice ───────────────────────────────────────────────────────
  it("extracts child voice from most recent assessment", () => {
    const r = computeChildSafeguarding(baseInput({
      risk_assessments: [
        makeRiskAssessment({ id: "ra_1", assessed_date: daysAgo(30), child_views: "Older view" }),
        makeRiskAssessment({ id: "ra_2", assessed_date: daysAgo(5), child_views: "Most recent view" }),
      ],
    }));
    expect(r.child_voice).toBe("Most recent view");
  });

  // ── Scoring ───────────────────────────────────────────────────────────
  it("gives higher score with decreasing risks and no incidents", () => {
    const safe = computeChildSafeguarding(baseInput({
      risk_assessments: [
        makeRiskAssessment({ current_level: "low", trend: "decreasing" }),
      ],
    }));
    const risky = computeChildSafeguarding(baseInput({
      risk_assessments: [
        makeRiskAssessment({ current_level: "very_high", trend: "increasing" }),
      ],
      incidents: [
        makeIncident({ severity: "critical" }),
        makeIncident({ id: "i2", severity: "high" }),
      ],
    }));
    expect(safe.safeguarding_score).toBeGreaterThan(risky.safeguarding_score);
  });

  it("penalises very high risk domains heavily", () => {
    const veryHigh = computeChildSafeguarding(baseInput({
      risk_assessments: [
        makeRiskAssessment({ current_level: "very_high", trend: "stable", previous_level: "very_high" }),
      ],
    }));
    const low = computeChildSafeguarding(baseInput({
      risk_assessments: [
        makeRiskAssessment({ current_level: "low", trend: "stable", previous_level: "low" }),
      ],
    }));
    expect(low.safeguarding_score).toBeGreaterThan(veryHigh.safeguarding_score);
    expect(low.safeguarding_score - veryHigh.safeguarding_score).toBeGreaterThanOrEqual(8);
  });

  it("penalises overdue risk reviews", () => {
    const overdue = computeChildSafeguarding(baseInput({
      risk_assessments: [
        makeRiskAssessment({ review_date: daysAgo(10) }),
      ],
    }));
    const current = computeChildSafeguarding(baseInput({
      risk_assessments: [
        makeRiskAssessment({ review_date: daysFromNow(20) }),
      ],
    }));
    expect(current.safeguarding_score).toBeGreaterThan(overdue.safeguarding_score);
  });

  it("penalises critical incidents", () => {
    const withCritical = computeChildSafeguarding(baseInput({
      incidents: [makeIncident({ severity: "critical" })],
    }));
    const withNone = computeChildSafeguarding(baseInput());
    expect(withNone.safeguarding_score).toBeGreaterThan(withCritical.safeguarding_score);
  });

  it("penalises injuries during restraint", () => {
    const withInjury = computeChildSafeguarding(baseInput({
      restraints: [makeRestraint({ injuries_count: 2 })],
    }));
    const withoutInjury = computeChildSafeguarding(baseInput({
      restraints: [makeRestraint({ injuries_count: 0 })],
    }));
    expect(withoutInjury.safeguarding_score).toBeGreaterThan(withInjury.safeguarding_score);
  });

  it("rewards return interview completion", () => {
    const fullRI = computeChildSafeguarding(baseInput({
      missing_episodes: [makeMissing({ return_interview_completed: true })],
    }));
    const noRI = computeChildSafeguarding(baseInput({
      missing_episodes: [makeMissing({ return_interview_completed: false })],
    }));
    expect(fullRI.safeguarding_score).toBeGreaterThan(noRI.safeguarding_score);
  });

  it("penalises active contextual safeguarding risks", () => {
    const withCtx = computeChildSafeguarding(baseInput({
      contextual_markers: [makeContextual(), makeContextual({ id: "c2" })],
    }));
    const withoutCtx = computeChildSafeguarding(baseInput());
    expect(withoutCtx.safeguarding_score).toBeGreaterThan(withCtx.safeguarding_score);
  });

  it("clamps score between 0 and 100", () => {
    // Very bad situation
    const worst = computeChildSafeguarding(baseInput({
      risk_assessments: [
        makeRiskAssessment({ id: "ra_1", current_level: "very_high", trend: "increasing", review_date: daysAgo(10), mitigations: [{ strategy: "A", effectiveness: "not_effective" }] }),
        makeRiskAssessment({ id: "ra_2", domain: "exploitation", current_level: "very_high", trend: "increasing", review_date: daysAgo(5), mitigations: [{ strategy: "B", effectiveness: "not_effective" }] }),
      ],
      incidents: Array.from({ length: 10 }, (_, i) => makeIncident({ id: `i${i}`, severity: "critical", date: daysAgo(i + 1) })),
      missing_episodes: Array.from({ length: 5 }, (_, i) => makeMissing({ id: `m${i}`, risk_level: "high", contextual_safeguarding_risk: true, return_interview_completed: false })),
      restraints: Array.from({ length: 5 }, (_, i) => makeRestraint({ id: `r${i}`, injuries_count: 1, child_debriefed: false })),
      contextual_markers: [makeContextual(), makeContextual({ id: "c2" })],
    }));
    expect(worst.safeguarding_score).toBeGreaterThanOrEqual(0);
    expect(worst.safeguarding_score).toBeLessThanOrEqual(100);
  });

  // ── Status Thresholds ─────────────────────────────────────────────────
  it("assigns safe_and_well for high score", () => {
    const r = computeChildSafeguarding(baseInput({
      risk_assessments: [
        makeRiskAssessment({ current_level: "low", trend: "decreasing" }),
      ],
    }));
    // Score >= 75 with decreasing risk and no incidents → safe_and_well
    expect(r.safeguarding_status).toBe("safe_and_well");
  });

  it("assigns critical for very low score", () => {
    const r = computeChildSafeguarding(baseInput({
      risk_assessments: [
        makeRiskAssessment({ current_level: "very_high", trend: "increasing", review_date: daysAgo(10), mitigations: [{ strategy: "A", effectiveness: "not_effective" }] }),
        makeRiskAssessment({ id: "ra_2", domain: "exploitation", current_level: "very_high", trend: "increasing", review_date: daysAgo(5), mitigations: [] }),
      ],
      incidents: [
        makeIncident({ severity: "critical" }),
        makeIncident({ id: "i2", severity: "critical" }),
      ],
      missing_episodes: [
        makeMissing({ risk_level: "critical", contextual_safeguarding_risk: true, return_interview_completed: false }),
      ],
      contextual_markers: [makeContextual()],
    }));
    expect(["critical", "serious_concern"]).toContain(r.safeguarding_status);
    expect(r.safeguarding_score).toBeLessThan(45);
  });

  // ── Headline ──────────────────────────────────────────────────────────
  it("includes child name and status in headline", () => {
    const r = computeChildSafeguarding(baseInput());
    expect(r.headline).toContain("Test Child");
    expect(r.headline).toContain(r.safeguarding_status.replace(/_/g, " "));
  });

  it("mentions highest risk domain in headline", () => {
    const r = computeChildSafeguarding(baseInput({
      risk_assessments: [
        makeRiskAssessment({ domain: "self_harm", current_level: "high" }),
      ],
    }));
    expect(r.headline).toContain("self harm");
  });

  // ── Strengths ─────────────────────────────────────────────────────────
  it("notes decreasing risk domains as strength", () => {
    const r = computeChildSafeguarding(baseInput({
      risk_assessments: [
        makeRiskAssessment({ trend: "decreasing" }),
      ],
    }));
    expect(r.strengths.some((s) => s.includes("decreasing"))).toBe(true);
  });

  it("notes zero incidents as strength", () => {
    const r = computeChildSafeguarding(baseInput());
    expect(r.strengths.some((s) => s.includes("No incidents"))).toBe(true);
  });

  it("notes zero restraints as strength", () => {
    const r = computeChildSafeguarding(baseInput());
    expect(r.strengths.some((s) => s.includes("No restraints"))).toBe(true);
  });

  it("notes child voice in all assessments as strength", () => {
    const r = computeChildSafeguarding(baseInput({
      risk_assessments: [
        makeRiskAssessment({ id: "ra_1", child_views: "View 1" }),
        makeRiskAssessment({ id: "ra_2", domain: "self_harm", child_views: "View 2" }),
      ],
    }));
    expect(r.strengths.some((s) => s.includes("voice") || s.includes("views"))).toBe(true);
  });

  // ── Concerns ──────────────────────────────────────────────────────────
  it("flags very high risk domains", () => {
    const r = computeChildSafeguarding(baseInput({
      risk_assessments: [
        makeRiskAssessment({ current_level: "very_high" }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("Very high risk"))).toBe(true);
  });

  it("flags increasing risk trends", () => {
    const r = computeChildSafeguarding(baseInput({
      risk_assessments: [
        makeRiskAssessment({ trend: "increasing" }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("increasing"))).toBe(true);
  });

  it("flags overdue reviews", () => {
    const r = computeChildSafeguarding(baseInput({
      risk_assessments: [
        makeRiskAssessment({ review_date: daysAgo(10) }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("Overdue") || c.includes("overdue"))).toBe(true);
  });

  it("flags critical incidents", () => {
    const r = computeChildSafeguarding(baseInput({
      incidents: [makeIncident({ severity: "critical" })],
    }));
    expect(r.concerns.some((c) => c.includes("critical incident"))).toBe(true);
  });

  it("flags incomplete return interviews", () => {
    const r = computeChildSafeguarding(baseInput({
      missing_episodes: [
        makeMissing({ return_interview_completed: false }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("Return interview") || c.includes("return interview"))).toBe(true);
  });

  it("flags injuries during restraint", () => {
    const r = computeChildSafeguarding(baseInput({
      restraints: [makeRestraint({ injuries_count: 2 })],
    }));
    expect(r.concerns.some((c) => c.includes("injur"))).toBe(true);
  });

  it("flags contextual safeguarding risks in missing episodes", () => {
    const r = computeChildSafeguarding(baseInput({
      missing_episodes: [
        makeMissing({ contextual_safeguarding_risk: true }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("contextual safeguarding"))).toBe(true);
  });

  it("flags ineffective mitigations", () => {
    const r = computeChildSafeguarding(baseInput({
      risk_assessments: [
        makeRiskAssessment({
          mitigations: [{ strategy: "A", effectiveness: "not_effective" }],
        }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("not effective"))).toBe(true);
  });

  // ── Recommendations ───────────────────────────────────────────────────
  it("recommends multi-agency meeting for very high risk", () => {
    const r = computeChildSafeguarding(baseInput({
      risk_assessments: [
        makeRiskAssessment({ current_level: "very_high" }),
      ],
    }));
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("multi-agency"))).toBe(true);
  });

  it("recommends overdue review completion", () => {
    const r = computeChildSafeguarding(baseInput({
      risk_assessments: [
        makeRiskAssessment({ review_date: daysAgo(10) }),
      ],
    }));
    expect(r.recommendations.some((rec) => rec.recommendation.includes("overdue"))).toBe(true);
  });

  it("recommends return interview improvements", () => {
    const r = computeChildSafeguarding(baseInput({
      missing_episodes: [
        makeMissing({ return_interview_completed: false }),
      ],
    }));
    expect(r.recommendations.some((rec) => rec.recommendation.includes("return interview") || rec.recommendation.includes("Return interview"))).toBe(true);
  });

  it("orders recommendations by rank", () => {
    const r = computeChildSafeguarding(baseInput({
      risk_assessments: [
        makeRiskAssessment({ current_level: "very_high", review_date: daysAgo(10), mitigations: [{ strategy: "A", effectiveness: "not_effective" }] }),
      ],
      missing_episodes: [makeMissing({ return_interview_completed: false })],
    }));
    for (let i = 1; i < r.recommendations.length; i++) {
      expect(r.recommendations[i].rank).toBeGreaterThan(r.recommendations[i - 1].rank);
    }
  });

  // ── ARIA Insights ─────────────────────────────────────────────────────
  it("generates critical insight for critical status", () => {
    const r = computeChildSafeguarding(baseInput({
      risk_assessments: [
        makeRiskAssessment({ current_level: "very_high", trend: "increasing", review_date: daysAgo(10), mitigations: [{ strategy: "A", effectiveness: "not_effective" }] }),
        makeRiskAssessment({ id: "ra_2", domain: "exploitation", current_level: "very_high", trend: "increasing", review_date: daysAgo(5), mitigations: [] }),
      ],
      incidents: [makeIncident({ severity: "critical" }), makeIncident({ id: "i2", severity: "critical" })],
      contextual_markers: [makeContextual()],
    }));
    expect(r.insights.some((i) => i.severity === "critical")).toBe(true);
  });

  it("generates positive insight for safe status", () => {
    const r = computeChildSafeguarding(baseInput({
      risk_assessments: [
        makeRiskAssessment({ current_level: "low", trend: "decreasing" }),
      ],
    }));
    expect(r.insights.some((i) => i.severity === "positive")).toBe(true);
  });

  it("generates positive insight when settled with no restraints/missing", () => {
    const r = computeChildSafeguarding(baseInput({
      risk_assessments: [makeRiskAssessment({ current_level: "low" })],
      incidents: [makeIncident({ severity: "low" })], // 1 minor incident
    }));
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("No restraints"))).toBe(true);
  });
});
