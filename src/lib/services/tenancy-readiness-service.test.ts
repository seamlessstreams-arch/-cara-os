import { describe, it, expect } from "vitest";
import {
  computeMetrics,
  computeAlerts,
  validateTenancyReadiness,
  SKILL_AREAS,
  type TenancyReadinessRow,
} from "./tenancy-readiness-service";

// ── Factory ──────────────────────────────────────────────────────────────

function makeRow(overrides: Partial<TenancyReadinessRow> = {}): TenancyReadinessRow {
  return {
    id: "tr1",
    home_id: "h1",
    young_person_name: "Alex",
    session_date: "2025-04-01",
    facilitator_name: "Staff A",
    skill_area: "Understanding Tenancy Agreements",
    delivery_method: "1-to-1 Session",
    competency_level: "Developing",
    young_person_engaged: true,
    practical_component: false,
    housing_application_started: false,
    housing_register_joined: false,
    deposit_scheme_aware: false,
    guarantee_scheme_explored: false,
    pathway_plan_linked: true,
    personal_adviser_involved: false,
    social_worker_informed: false,
    next_session_date: null,
    notes: null,
    created_at: "2025-04-01",
    updated_at: "2025-04-01",
    ...overrides,
  };
}

// ── computeMetrics ───────────────────────────────────────────────────────

describe("computeMetrics", () => {
  it("returns zeroes for empty rows", () => {
    const m = computeMetrics([]);
    expect(m.total_sessions).toBe(0);
    expect(m.unique_young_people).toBe(0);
    expect(m.engagement_rate).toBeNull();;
    expect(m.practical_rate).toBeNull();;
    expect(m.housing_application_rate).toBeNull();;
    expect(m.competent_confident_rate).toBeNull();;
    expect(m.skill_coverage).toBe(0);
    expect(m.overdue_session_count).toBe(0);
    expect(m.average_sessions_per_person).toBeNull();;
  });

  it("counts total sessions and unique young people", () => {
    const rows = [
      makeRow({ young_person_name: "Alex" }),
      makeRow({ young_person_name: "Alex", id: "tr2" }),
      makeRow({ young_person_name: "Jordan", id: "tr3" }),
    ];
    const m = computeMetrics(rows);
    expect(m.total_sessions).toBe(3);
    expect(m.unique_young_people).toBe(2);
  });

  it("calculates engagement rate correctly", () => {
    const rows = [
      makeRow({ young_person_engaged: true }),
      makeRow({ young_person_engaged: false, id: "tr2" }),
    ];
    const m = computeMetrics(rows);
    expect(m.engagement_rate).toBe(50);
  });

  it("calculates competent_confident_rate for Competent and Confident levels", () => {
    const rows = [
      makeRow({ competency_level: "Competent" }),
      makeRow({ competency_level: "Confident", id: "tr2" }),
      makeRow({ competency_level: "Developing", id: "tr3" }),
    ];
    const m = computeMetrics(rows);
    // 2/3 = 66.7%
    expect(m.competent_confident_rate).toBe(66.7);
  });

  it("calculates skill coverage as percentage of 14 areas", () => {
    const rows = [
      makeRow({ skill_area: "Understanding Tenancy Agreements" }),
      makeRow({ skill_area: "Paying Rent & Bills", id: "tr2" }),
    ];
    const m = computeMetrics(rows);
    // 2/14 = 14.3%
    expect(m.skill_coverage).toBe(14.3);
  });

  it("counts overdue sessions based on next_session_date in the past", () => {
    const rows = [
      makeRow({ next_session_date: "2020-01-01" }),
      makeRow({ next_session_date: "2099-12-31", id: "tr2" }),
      makeRow({ next_session_date: null, id: "tr3" }),
    ];
    const m = computeMetrics(rows);
    expect(m.overdue_session_count).toBe(1);
  });

  it("calculates average sessions per person", () => {
    const rows = [
      makeRow({ young_person_name: "Alex" }),
      makeRow({ young_person_name: "Alex", id: "tr2" }),
    ];
    const m = computeMetrics(rows);
    expect(m.average_sessions_per_person).toBe(2);
  });
});

// ── computeAlerts ────────────────────────────────────────────────────────

describe("computeAlerts", () => {
  it("returns empty array for no rows", () => {
    expect(computeAlerts([])).toEqual([]);
  });

  it("triggers critical alert when 5+ sessions without housing application", () => {
    const rows = Array.from({ length: 5 }, (_, i) =>
      makeRow({
        id: `tr${i}`,
        young_person_name: "Alex",
        housing_application_started: false,
        pathway_plan_linked: true,
        personal_adviser_involved: true,
        young_person_engaged: true,
        deposit_scheme_aware: true,
        skill_area: SKILL_AREAS[i % SKILL_AREAS.length],
      }),
    );
    const alerts = computeAlerts(rows);
    expect(alerts.some((a) => a.type === "many_sessions_no_application" && a.severity === "critical")).toBe(true);
  });

  it("triggers critical alert when 3+ sessions without pathway plan link", () => {
    const rows = Array.from({ length: 3 }, (_, i) =>
      makeRow({
        id: `tr${i}`,
        young_person_name: "Jordan",
        pathway_plan_linked: false,
        young_person_engaged: true,
        personal_adviser_involved: true,
        deposit_scheme_aware: true,
        skill_area: SKILL_AREAS[i % SKILL_AREAS.length],
      }),
    );
    const alerts = computeAlerts(rows);
    expect(alerts.some((a) => a.type === "no_pathway_link" && a.severity === "critical")).toBe(true);
  });

  it("triggers high alert for low engagement (< 50%) across 3+ sessions", () => {
    const rows = [
      makeRow({ young_person_name: "Sam", young_person_engaged: false, id: "tr1", personal_adviser_involved: true, deposit_scheme_aware: true }),
      makeRow({ young_person_name: "Sam", young_person_engaged: false, id: "tr2", personal_adviser_involved: true, deposit_scheme_aware: true }),
      makeRow({ young_person_name: "Sam", young_person_engaged: false, id: "tr3", personal_adviser_involved: true, deposit_scheme_aware: true }),
    ];
    const alerts = computeAlerts(rows);
    expect(alerts.some((a) => a.type === "low_engagement" && a.severity === "high")).toBe(true);
  });

  it("triggers high alert for application without housing register", () => {
    const rows = [
      makeRow({ housing_application_started: true, housing_register_joined: false }),
    ];
    const alerts = computeAlerts(rows);
    expect(alerts.some((a) => a.type === "application_no_register")).toBe(true);
  });

  it("triggers medium alert for overdue session", () => {
    const rows = [
      makeRow({ next_session_date: "2020-01-01" }),
    ];
    const alerts = computeAlerts(rows);
    expect(alerts.some((a) => a.type === "overdue_session" && a.severity === "medium")).toBe(true);
  });
});

// ── validateTenancyReadiness ─────────────────────────────────────────────

describe("validateTenancyReadiness", () => {
  it("returns valid for correct input", () => {
    const result = validateTenancyReadiness({
      youngPersonName: "Alex",
      sessionDate: "2025-04-01",
      facilitatorName: "Staff A",
      skillArea: "Understanding Tenancy Agreements",
      deliveryMethod: "1-to-1 Session",
      competencyLevel: "Developing",
      youngPersonEngaged: true,
      practicalComponent: false,
      housingApplicationStarted: false,
      housingRegisterJoined: false,
      pathwayPlanLinked: true,
      personalAdviserInvolved: false,
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("requires young person name", () => {
    const result = validateTenancyReadiness({
      youngPersonName: "",
      sessionDate: "2025-04-01",
      facilitatorName: "Staff",
      skillArea: "Understanding Tenancy Agreements",
      deliveryMethod: "1-to-1 Session",
      competencyLevel: "Developing",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Young person name"))).toBe(true);
  });

  it("rejects future session date", () => {
    const result = validateTenancyReadiness({
      youngPersonName: "Alex",
      sessionDate: "2099-01-01",
      facilitatorName: "Staff",
      skillArea: "Understanding Tenancy Agreements",
      deliveryMethod: "1-to-1 Session",
      competencyLevel: "Developing",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("future"))).toBe(true);
  });

  it("rejects Competent level when not engaged", () => {
    const result = validateTenancyReadiness({
      youngPersonName: "Alex",
      sessionDate: "2025-04-01",
      facilitatorName: "Staff",
      skillArea: "Understanding Tenancy Agreements",
      deliveryMethod: "1-to-1 Session",
      competencyLevel: "Competent",
      youngPersonEngaged: false,
      practicalComponent: false,
      housingApplicationStarted: false,
      housingRegisterJoined: false,
      pathwayPlanLinked: true,
      personalAdviserInvolved: false,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Competent or Confident"))).toBe(true);
  });

  it("rejects Real-World Practice without practical component", () => {
    const result = validateTenancyReadiness({
      youngPersonName: "Alex",
      sessionDate: "2025-04-01",
      facilitatorName: "Staff",
      skillArea: "Understanding Tenancy Agreements",
      deliveryMethod: "Real-World Practice",
      competencyLevel: "Developing",
      practicalComponent: false,
      housingApplicationStarted: false,
      housingRegisterJoined: false,
      pathwayPlanLinked: true,
      personalAdviserInvolved: false,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Practical component must be marked"))).toBe(true);
  });

  it("rejects housing application without housing register", () => {
    const result = validateTenancyReadiness({
      youngPersonName: "Alex",
      sessionDate: "2025-04-01",
      facilitatorName: "Staff",
      skillArea: "Understanding Tenancy Agreements",
      deliveryMethod: "1-to-1 Session",
      competencyLevel: "Developing",
      housingApplicationStarted: true,
      housingRegisterJoined: false,
      pathwayPlanLinked: true,
      personalAdviserInvolved: true,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("housing register"))).toBe(true);
  });
});
