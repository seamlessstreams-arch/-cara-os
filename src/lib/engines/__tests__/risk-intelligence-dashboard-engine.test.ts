import { describe, it, expect } from "vitest";
import {
  computeRiskIntelligenceDashboard,
  type RiskIntelligenceDashboardInput,
  type RiskAssessmentInput,
  type ExploitationScreeningInput,
  type MissingEpisodeInput,
  type IncidentInput,
  type RestraintInput,
  type SignificantEventInput,
  type ChildSummaryInput,
} from "../risk-intelligence-dashboard-engine";

// ── Helpers ────────────────────────────────────────────────────────────────

const CHILDREN: ChildSummaryInput[] = [
  { id: "yp_alex", name: "Alex" },
  { id: "yp_jordan", name: "Jordan" },
  { id: "yp_casey", name: "Casey" },
];

function makeAssessment(overrides: Partial<RiskAssessmentInput> = {}): RiskAssessmentInput {
  return {
    id: "ra_1",
    child_id: "yp_alex",
    child_name: "Alex",
    domain: "aggression",
    current_level: "high",
    previous_level: "very_high",
    trend: "decreasing",
    status: "current",
    assessed_date: "2026-05-10",
    review_date: "2026-06-10",
    has_child_views: true,
    has_contingency_plan: true,
    linked_incidents_count: 1,
    mitigations: [{ strategy: "De-escalation", effectiveness: "effective" }],
    ...overrides,
  };
}

function makeScreening(overrides: Partial<ExploitationScreeningInput> = {}): ExploitationScreeningInput {
  return {
    id: "es_1",
    child_id: "yp_alex",
    child_name: "Alex",
    date: "2026-05-10",
    exploitation_type: "cse",
    risk_level: "high",
    previous_risk_level: "medium",
    status: "referred",
    next_review_date: "2026-06-10",
    multi_agency_involved: ["Police", "MACE", "Social Worker"],
    nrm_referral: false,
    safety_plan_in_place: true,
    ...overrides,
  };
}

function makeMissing(overrides: Partial<MissingEpisodeInput> = {}): MissingEpisodeInput {
  return {
    id: "mfc_1",
    child_id: "yp_alex",
    child_name: "Alex",
    date: "2026-05-15",
    duration_hours: 2.5,
    risk_level: "high",
    return_interview_completed: true,
    contextual_safeguarding_risk: false,
    status: "closed",
    ...overrides,
  };
}

function makeIncident(overrides: Partial<IncidentInput> = {}): IncidentInput {
  return {
    id: "inc_1",
    child_id: "yp_alex",
    child_name: "Alex",
    date: "2026-05-15",
    type: "behaviour_incident",
    severity: "medium",
    status: "closed",
    requires_oversight: false,
    oversight_completed: false,
    ...overrides,
  };
}

function makeRestraint(overrides: Partial<RestraintInput> = {}): RestraintInput {
  return {
    id: "rst_1",
    child_id: "yp_alex",
    child_name: "Alex",
    date: "2026-05-15",
    duration_minutes: 3,
    reason: "imminent_harm_to_others",
    child_debriefed: true,
    staff_debriefed: true,
    review_status: "reviewed",
    injuries: 0,
    ...overrides,
  };
}

function baseInput(overrides: Partial<RiskIntelligenceDashboardInput> = {}): RiskIntelligenceDashboardInput {
  return {
    today: "2026-05-26",
    children: CHILDREN,
    risk_assessments: [
      makeAssessment({ id: "ra_1", child_id: "yp_alex", child_name: "Alex", domain: "aggression", current_level: "high", previous_level: "very_high", trend: "decreasing" }),
      makeAssessment({ id: "ra_2", child_id: "yp_jordan", child_name: "Jordan", domain: "absconding", current_level: "medium", previous_level: "high", trend: "decreasing" }),
      makeAssessment({ id: "ra_3", child_id: "yp_casey", child_name: "Casey", domain: "self_harm", current_level: "medium", previous_level: "medium", trend: "stable" }),
      makeAssessment({ id: "ra_4", child_id: "yp_alex", child_name: "Alex", domain: "exploitation", current_level: "low", previous_level: "medium", trend: "decreasing" }),
    ],
    exploitation_screenings: [
      makeScreening({ id: "es_1", child_id: "yp_alex", child_name: "Alex", exploitation_type: "cse", risk_level: "high", status: "referred" }),
      makeScreening({ id: "es_2", child_id: "yp_alex", child_name: "Alex", exploitation_type: "cce", risk_level: "medium", status: "monitoring" }),
      makeScreening({ id: "es_3", child_id: "yp_jordan", child_name: "Jordan", exploitation_type: "online_exploitation", risk_level: "medium", status: "monitoring" }),
    ],
    missing_episodes: [
      makeMissing({ id: "mfc_1", date: "2026-05-15", contextual_safeguarding_risk: true }),
      makeMissing({ id: "mfc_2", date: "2026-04-01", contextual_safeguarding_risk: true }),
      makeMissing({ id: "mfc_3", date: "2026-03-15", contextual_safeguarding_risk: false }),
    ],
    incidents: [
      makeIncident({ id: "inc_1", date: "2026-05-20", type: "behaviour_incident", severity: "medium" }),
      makeIncident({ id: "inc_2", date: "2026-05-10", type: "safeguarding_concern", severity: "high" }),
      makeIncident({ id: "inc_3", date: "2026-04-15", type: "physical_intervention", severity: "medium" }),
    ],
    restraints: [
      makeRestraint({ id: "rst_1", date: "2026-05-15", duration_minutes: 3 }),
      makeRestraint({ id: "rst_2", date: "2026-04-20", duration_minutes: 2, review_status: "pending" }),
      makeRestraint({ id: "rst_3", date: "2026-03-10", duration_minutes: 7, injuries: 1 }),
    ],
    significant_events: [],
    ...overrides,
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("Risk Intelligence Dashboard Engine", () => {
  it("produces result with all required fields", () => {
    const result = computeRiskIntelligenceDashboard(baseInput());
    expect(result.generated_at).toBe("2026-05-26");
    expect(result.landscape).toBeDefined();
    expect(result.incident_analysis).toBeDefined();
    expect(result.exploitation_overview).toBeDefined();
    expect(result.missing_overview).toBeDefined();
    expect(result.restraint_overview).toBeDefined();
    expect(result.child_profiles).toBeDefined();
    expect(result.risk_domains).toBeDefined();
    expect(result.strengths).toBeDefined();
    expect(result.concerns).toBeDefined();
    expect(result.recommendations).toBeDefined();
    expect(result.insights).toBeDefined();
  });

  it("computes home risk level and score", () => {
    const result = computeRiskIntelligenceDashboard(baseInput());
    expect(result.landscape.home_risk_score).toBeGreaterThanOrEqual(0);
    expect(result.landscape.home_risk_score).toBeLessThanOrEqual(100);
    expect(["critical", "elevated", "moderate", "managed", "low"]).toContain(result.landscape.home_risk_level);
  });

  it("counts active risk assessments correctly", () => {
    const result = computeRiskIntelligenceDashboard(baseInput());
    expect(result.landscape.total_active_risks).toBe(4);
    expect(result.landscape.high_risks).toBe(1);
    expect(result.landscape.very_high_risks).toBe(0);
    expect(result.landscape.total_children).toBe(3);
  });

  it("detects escalating risks", () => {
    const result = computeRiskIntelligenceDashboard(baseInput({
      risk_assessments: [
        makeAssessment({ id: "ra_1", trend: "increasing", current_level: "high" }),
        makeAssessment({ id: "ra_2", child_id: "yp_jordan", child_name: "Jordan", trend: "increasing", current_level: "medium" }),
      ],
    }));
    expect(result.landscape.escalating_risks).toBe(2);
    expect(result.concerns.some((c) => c.toLowerCase().includes("increasing"))).toBe(true);
  });

  it("detects overdue risk assessment reviews", () => {
    const result = computeRiskIntelligenceDashboard(baseInput({
      risk_assessments: [
        makeAssessment({ id: "ra_1", review_date: "2026-05-01" }),
        makeAssessment({ id: "ra_2", child_id: "yp_jordan", child_name: "Jordan", review_date: "2026-04-15" }),
      ],
    }));
    expect(result.landscape.overdue_reviews).toBe(2);
    expect(result.concerns.some((c) => c.toLowerCase().includes("overdue"))).toBe(true);
    expect(result.recommendations.some((r) => r.domain === "compliance")).toBe(true);
  });

  it("computes incident analysis with trend", () => {
    const result = computeRiskIntelligenceDashboard(baseInput());
    expect(result.incident_analysis.total_90d).toBe(3);
    expect(result.incident_analysis.total_30d).toBe(2);
    expect(result.incident_analysis.high_30d).toBe(1);
    expect(result.incident_analysis.safeguarding_30d).toBe(1);
    expect(["increasing", "stable", "decreasing"]).toContain(result.incident_analysis.trend);
  });

  it("detects increasing incident trend", () => {
    const result = computeRiskIntelligenceDashboard(baseInput({
      incidents: [
        // 5 incidents in last 30 days
        makeIncident({ id: "i1", date: "2026-05-25" }),
        makeIncident({ id: "i2", date: "2026-05-20" }),
        makeIncident({ id: "i3", date: "2026-05-15" }),
        makeIncident({ id: "i4", date: "2026-05-10" }),
        makeIncident({ id: "i5", date: "2026-05-01" }),
        // 1 incident in 30-60 days
        makeIncident({ id: "i6", date: "2026-04-10" }),
      ],
    }));
    expect(result.incident_analysis.trend).toBe("increasing");
    expect(result.insights.some((i) => i.text.toLowerCase().includes("incident frequency"))).toBe(true);
  });

  it("tracks open incidents and unreviewed oversight", () => {
    const result = computeRiskIntelligenceDashboard(baseInput({
      incidents: [
        makeIncident({ id: "i1", date: "2026-05-20", status: "open", requires_oversight: true, oversight_completed: false }),
        makeIncident({ id: "i2", date: "2026-05-15", status: "under_review", requires_oversight: true, oversight_completed: false }),
        makeIncident({ id: "i3", date: "2026-05-10", status: "closed", requires_oversight: true, oversight_completed: true }),
      ],
    }));
    expect(result.incident_analysis.open_incidents).toBe(2);
    expect(result.incident_analysis.unreviewed_oversight).toBe(2);
    expect(result.concerns.some((c) => c.toLowerCase().includes("oversight"))).toBe(true);
  });

  it("computes exploitation overview", () => {
    const result = computeRiskIntelligenceDashboard(baseInput());
    expect(result.exploitation_overview.active_screenings).toBe(3);
    expect(result.exploitation_overview.high_risk_children).toBe(1);
    expect(result.exploitation_overview.cse_count).toBe(1);
    expect(result.exploitation_overview.cce_count).toBe(1);
    expect(result.exploitation_overview.online_count).toBe(1);
    expect(result.exploitation_overview.multi_agency_engaged).toBe(true);
  });

  it("detects overdue exploitation screening reviews", () => {
    const result = computeRiskIntelligenceDashboard(baseInput({
      exploitation_screenings: [
        makeScreening({ id: "es_1", next_review_date: "2026-05-01", status: "monitoring" }),
        makeScreening({ id: "es_2", next_review_date: "2026-04-15", status: "referred" }),
      ],
    }));
    expect(result.exploitation_overview.overdue_reviews).toBe(2);
    expect(result.recommendations.some((r) => r.domain === "exploitation" && r.urgency === "urgent")).toBe(true);
  });

  it("computes missing overview correctly", () => {
    const result = computeRiskIntelligenceDashboard(baseInput());
    expect(result.missing_overview.total_90d).toBe(3);
    expect(result.missing_overview.total_30d).toBe(1);
    expect(result.missing_overview.cs_risk_episodes).toBe(2);
    expect(result.missing_overview.return_interview_rate).toBe(100);
    expect(result.missing_overview.repeat_missing).toBe(true);
  });

  it("detects incomplete return interviews", () => {
    const result = computeRiskIntelligenceDashboard(baseInput({
      missing_episodes: [
        makeMissing({ id: "m1", date: "2026-05-15", return_interview_completed: false }),
        makeMissing({ id: "m2", date: "2026-05-10", return_interview_completed: true }),
      ],
    }));
    expect(result.missing_overview.return_interview_rate).toBe(50);
    expect(result.concerns.some((c) => c.toLowerCase().includes("return interview"))).toBe(true);
  });

  it("computes restraint overview", () => {
    const result = computeRiskIntelligenceDashboard(baseInput());
    expect(result.restraint_overview.total_90d).toBe(3);
    expect(result.restraint_overview.total_30d).toBe(1);
    expect(result.restraint_overview.avg_duration_minutes).toBe(4);
    expect(result.restraint_overview.injuries_count).toBe(1);
    expect(result.restraint_overview.unreviewed_count).toBe(1);
  });

  it("flags restraint injuries in concerns", () => {
    const result = computeRiskIntelligenceDashboard(baseInput({
      restraints: [
        makeRestraint({ id: "r1", date: "2026-05-20", injuries: 1 }),
        makeRestraint({ id: "r2", date: "2026-05-10", injuries: 2 }),
      ],
    }));
    expect(result.restraint_overview.injuries_count).toBe(3);
    expect(result.concerns.some((c) => c.toLowerCase().includes("injur"))).toBe(true);
    expect(result.recommendations.some((r) => r.domain === "restraint" && r.urgency === "urgent")).toBe(true);
  });

  it("builds child risk profiles sorted by risk score", () => {
    const result = computeRiskIntelligenceDashboard(baseInput());
    expect(result.child_profiles.length).toBe(3);
    // Alex should be highest risk (high assessment, exploitation, missing, restraints)
    expect(result.child_profiles[0].child_name).toBe("Alex");
    expect(result.child_profiles[0].risk_score).toBeGreaterThan(result.child_profiles[1].risk_score);
    expect(["critical", "elevated", "moderate", "managed", "low"]).toContain(result.child_profiles[0].risk_level);
  });

  it("assigns exploitation risk to child profile", () => {
    const result = computeRiskIntelligenceDashboard(baseInput());
    const alex = result.child_profiles.find((p) => p.child_name === "Alex");
    expect(alex).toBeDefined();
    expect(alex!.exploitation_risk).toBe("high");
    expect(alex!.flags).toContain("exploitation_concern");
  });

  it("flags repeat missing children", () => {
    const result = computeRiskIntelligenceDashboard(baseInput());
    const alex = result.child_profiles.find((p) => p.child_name === "Alex");
    expect(alex).toBeDefined();
    expect(alex!.missing_episodes_90d).toBe(3);
    expect(alex!.flags).toContain("repeat_missing");
  });

  it("flags contextual safeguarding risk in child profiles", () => {
    const result = computeRiskIntelligenceDashboard(baseInput());
    const alex = result.child_profiles.find((p) => p.child_name === "Alex");
    expect(alex!.flags).toContain("cs_risk");
  });

  it("computes risk domains sorted by severity", () => {
    const result = computeRiskIntelligenceDashboard(baseInput());
    expect(result.risk_domains.length).toBeGreaterThan(0);
    // Aggression domain (high=4) should rank above absconding (medium=3)
    const aggrIdx = result.risk_domains.findIndex((d) => d.domain === "aggression");
    const absIdx = result.risk_domains.findIndex((d) => d.domain === "absconding");
    expect(aggrIdx).toBeLessThan(absIdx);
  });

  it("detects domain trend directions", () => {
    const result = computeRiskIntelligenceDashboard(baseInput());
    const aggression = result.risk_domains.find((d) => d.domain === "aggression");
    expect(aggression).toBeDefined();
    expect(aggression!.trend_direction).toBe("improving"); // decreasing trend
  });

  it("generates strengths for good risk management", () => {
    const result = computeRiskIntelligenceDashboard(baseInput());
    // All assessments have child views and contingency plans
    expect(result.strengths.some((s) => s.toLowerCase().includes("child's voice"))).toBe(true);
    expect(result.strengths.some((s) => s.toLowerCase().includes("contingency"))).toBe(true);
    // All return interviews completed
    expect(result.strengths.some((s) => s.toLowerCase().includes("return interview"))).toBe(true);
    // Multi-agency engaged
    expect(result.strengths.some((s) => s.toLowerCase().includes("multi-agency"))).toBe(true);
  });

  it("generates strengths for decreasing trends with no escalations", () => {
    const result = computeRiskIntelligenceDashboard(baseInput({
      risk_assessments: [
        makeAssessment({ id: "ra_1", trend: "decreasing" }),
        makeAssessment({ id: "ra_2", child_id: "yp_jordan", child_name: "Jordan", trend: "decreasing" }),
      ],
    }));
    expect(result.strengths.some((s) => s.toLowerCase().includes("decreasing"))).toBe(true);
  });

  it("generates critical insight for critical home risk level", () => {
    const result = computeRiskIntelligenceDashboard(baseInput({
      risk_assessments: [
        makeAssessment({ id: "ra_1", current_level: "very_high", trend: "increasing" }),
        makeAssessment({ id: "ra_2", child_id: "yp_jordan", child_name: "Jordan", current_level: "very_high", trend: "increasing" }),
      ],
      exploitation_screenings: [
        makeScreening({ id: "es_1", risk_level: "very_high" }),
      ],
      missing_episodes: [
        makeMissing({ id: "m1", date: "2026-05-20", contextual_safeguarding_risk: true }),
        makeMissing({ id: "m2", date: "2026-05-15", contextual_safeguarding_risk: true }),
      ],
      restraints: [
        makeRestraint({ id: "r1", date: "2026-05-25", injuries: 1 }),
        makeRestraint({ id: "r2", date: "2026-05-20", injuries: 1 }),
      ],
    }));
    expect(result.landscape.home_risk_level).toBe("critical");
    expect(result.insights.some((i) => i.severity === "critical")).toBe(true);
  });

  it("generates positive insights for managed/low home risk", () => {
    const result = computeRiskIntelligenceDashboard(baseInput({
      risk_assessments: [
        makeAssessment({ id: "ra_1", current_level: "low", trend: "decreasing" }),
      ],
      exploitation_screenings: [],
      missing_episodes: [],
      incidents: [],
      restraints: [],
    }));
    expect(["managed", "low"]).toContain(result.landscape.home_risk_level);
    expect(result.insights.some((i) => i.severity === "positive")).toBe(true);
  });

  it("handles empty input gracefully", () => {
    const result = computeRiskIntelligenceDashboard({
      today: "2026-05-26",
      children: CHILDREN,
      risk_assessments: [],
      exploitation_screenings: [],
      missing_episodes: [],
      incidents: [],
      restraints: [],
      significant_events: [],
    });
    expect(result.landscape.total_active_risks).toBe(0);
    expect(result.landscape.home_risk_score).toBeGreaterThanOrEqual(0);
    expect(result.child_profiles.length).toBe(3);
    expect(result.risk_domains.length).toBe(0);
    expect(result.incident_analysis.total_90d).toBe(0);
  });

  it("generates recommendations sorted by urgency", () => {
    const result = computeRiskIntelligenceDashboard(baseInput({
      risk_assessments: [
        makeAssessment({ id: "ra_1", current_level: "very_high", trend: "increasing", review_date: "2026-05-01", has_child_views: false }),
      ],
      exploitation_screenings: [
        makeScreening({ id: "es_1", risk_level: "high" }),
      ],
      missing_episodes: [
        makeMissing({ id: "m1", date: "2026-05-20", contextual_safeguarding_risk: true }),
      ],
    }));
    expect(result.recommendations.length).toBeGreaterThan(0);
    const immediate = result.recommendations.filter((r) => r.urgency === "immediate");
    expect(immediate.length).toBeGreaterThan(0);
    // Immediate recommendations should have regulatory references
    for (const r of immediate) {
      expect(r.regulatory_ref).toBeTruthy();
    }
  });

  it("generates exploitation + CS risk critical insight", () => {
    const result = computeRiskIntelligenceDashboard(baseInput({
      exploitation_screenings: [
        makeScreening({ id: "es_1", risk_level: "high" }),
      ],
      missing_episodes: [
        makeMissing({ id: "m1", date: "2026-05-20", contextual_safeguarding_risk: true }),
      ],
    }));
    expect(result.insights.some(
      (i) => i.severity === "critical" && i.text.toLowerCase().includes("exploitation"),
    )).toBe(true);
  });

  it("flags frequent restraint in child profile", () => {
    const result = computeRiskIntelligenceDashboard(baseInput({
      restraints: [
        makeRestraint({ id: "r1", date: "2026-05-25" }),
        makeRestraint({ id: "r2", date: "2026-05-20" }),
        makeRestraint({ id: "r3", date: "2026-05-15" }),
      ],
    }));
    const alex = result.child_profiles.find((p) => p.child_name === "Alex");
    expect(alex!.flags).toContain("frequent_restraint");
  });

  it("detects critical incident flag in child profile", () => {
    const result = computeRiskIntelligenceDashboard(baseInput({
      incidents: [
        makeIncident({ id: "i1", date: "2026-05-20", severity: "critical" }),
      ],
    }));
    const alex = result.child_profiles.find((p) => p.child_name === "Alex");
    expect(alex!.flags).toContain("critical_incident");
  });

  it("computes incident top types correctly", () => {
    const result = computeRiskIntelligenceDashboard(baseInput({
      incidents: [
        makeIncident({ id: "i1", date: "2026-05-20", type: "behaviour_incident" }),
        makeIncident({ id: "i2", date: "2026-05-15", type: "behaviour_incident" }),
        makeIncident({ id: "i3", date: "2026-05-10", type: "safeguarding_concern" }),
        makeIncident({ id: "i4", date: "2026-04-20", type: "behaviour_incident" }),
        makeIncident({ id: "i5", date: "2026-04-10", type: "self_harm" }),
      ],
    }));
    expect(result.incident_analysis.top_types[0].type).toBe("behaviour_incident");
    expect(result.incident_analysis.top_types[0].count).toBe(3);
  });

  it("generates unreviewed restraint recommendation", () => {
    const result = computeRiskIntelligenceDashboard(baseInput({
      restraints: [
        makeRestraint({ id: "r1", date: "2026-05-20", review_status: "pending" }),
        makeRestraint({ id: "r2", date: "2026-05-15", review_status: "pending" }),
      ],
    }));
    expect(result.restraint_overview.unreviewed_count).toBe(2);
    expect(result.recommendations.some(
      (r) => r.domain === "restraint" && r.recommendation.toLowerCase().includes("management review"),
    )).toBe(true);
  });

  it("calculates high restraint frequency concern", () => {
    const result = computeRiskIntelligenceDashboard(baseInput({
      restraints: [
        makeRestraint({ id: "r1", date: "2026-05-25" }),
        makeRestraint({ id: "r2", date: "2026-05-20" }),
        makeRestraint({ id: "r3", date: "2026-05-15" }),
        makeRestraint({ id: "r4", date: "2026-05-10" }),
      ],
    }));
    expect(result.concerns.some((c) => c.toLowerCase().includes("restraint") && c.includes("30 days"))).toBe(true);
  });

  it("generates child voice recommendation when missing", () => {
    const result = computeRiskIntelligenceDashboard(baseInput({
      risk_assessments: [
        makeAssessment({ id: "ra_1", has_child_views: false }),
        makeAssessment({ id: "ra_2", child_id: "yp_jordan", child_name: "Jordan", has_child_views: false }),
      ],
    }));
    expect(result.recommendations.some(
      (r) => r.domain === "voice" && r.regulatory_ref === "Reg 7",
    )).toBe(true);
  });

  it("detects restraint debrief rate shortfall", () => {
    const result = computeRiskIntelligenceDashboard(baseInput({
      restraints: [
        makeRestraint({ id: "r1", date: "2026-05-20", child_debriefed: false }),
        makeRestraint({ id: "r2", date: "2026-05-15", child_debriefed: true }),
      ],
    }));
    expect(result.restraint_overview.debrief_rate).toBe(50);
    expect(result.recommendations.some(
      (r) => r.domain === "restraint" && r.recommendation.toLowerCase().includes("debrief"),
    )).toBe(true);
  });

  it("generates positive insight for no recent restraints", () => {
    const result = computeRiskIntelligenceDashboard(baseInput({
      restraints: [
        makeRestraint({ id: "r1", date: "2026-04-01" }),
        makeRestraint({ id: "r2", date: "2026-03-15" }),
      ],
    }));
    expect(result.restraint_overview.total_30d).toBe(0);
    expect(result.insights.some(
      (i) => i.severity === "positive" && i.text.toLowerCase().includes("no restraint"),
    )).toBe(true);
  });

  it("handles children with no risk data gracefully", () => {
    const result = computeRiskIntelligenceDashboard({
      today: "2026-05-26",
      children: [{ id: "yp_new", name: "New Child" }],
      risk_assessments: [],
      exploitation_screenings: [],
      missing_episodes: [],
      incidents: [],
      restraints: [],
      significant_events: [],
    });
    expect(result.child_profiles.length).toBe(1);
    expect(result.child_profiles[0].risk_score).toBeLessThanOrEqual(20);
    expect(result.child_profiles[0].exploitation_risk).toBeNull();
    expect(result.child_profiles[0].flags.length).toBe(0);
  });

  it("computes average missing duration", () => {
    const result = computeRiskIntelligenceDashboard(baseInput({
      missing_episodes: [
        makeMissing({ id: "m1", date: "2026-05-20", duration_hours: 2.0 }),
        makeMissing({ id: "m2", date: "2026-05-10", duration_hours: 4.0 }),
        makeMissing({ id: "m3", date: "2026-04-15", duration_hours: 6.0 }),
      ],
    }));
    expect(result.missing_overview.avg_duration_hours).toBe(4);
  });

  it("detects very_high risk flag in child profile", () => {
    const result = computeRiskIntelligenceDashboard(baseInput({
      risk_assessments: [
        makeAssessment({ id: "ra_1", current_level: "very_high" }),
      ],
    }));
    const alex = result.child_profiles.find((p) => p.child_name === "Alex");
    expect(alex!.flags).toContain("very_high_risk");
    expect(alex!.highest_risk_level).toBe("very_high");
  });

  it("generates repeat missing concern", () => {
    const result = computeRiskIntelligenceDashboard(baseInput());
    // Alex has 3 missing episodes in 90d
    expect(result.missing_overview.repeat_missing).toBe(true);
    expect(result.concerns.some((c) => c.toLowerCase().includes("repeat missing"))).toBe(true);
  });
});
