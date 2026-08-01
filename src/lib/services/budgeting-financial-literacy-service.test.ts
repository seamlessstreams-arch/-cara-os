import { describe, it, expect } from "vitest";
import {
  computeMetrics,
  computeAlerts,
  validateBudgetingFinancialLiteracy,
  type BudgetingFinancialLiteracyRow,
} from "./budgeting-financial-literacy-service";

function makeRow(overrides: Partial<BudgetingFinancialLiteracyRow> = {}): BudgetingFinancialLiteracyRow {
  return {
    id: "row-1",
    home_id: "home-1",
    child_name: "Child A",
    session_date: "2026-05-01",
    facilitator_name: "Staff A",
    skill_area: "Budgeting Basics",
    delivery_method: "1-to-1 Session",
    competency_level: "Developing",
    young_person_engaged: true,
    practical_component: true,
    real_money_used: false,
    bank_account_opened: false,
    savings_started: false,
    budget_created: false,
    pathway_plan_linked: true,
    social_worker_informed: true,
    next_session_date: null,
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

describe("computeMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeMetrics([]);
    expect(m.total_sessions).toBe(0);
    expect(m.unique_children).toBe(0);
    expect(m.engagement_rate).toBeNull();;
    expect(m.skills_covered_count).toBe(0);
  });

  it("computes counts and rates for populated data", () => {
    const rows = [
      makeRow({ id: "1", child_name: "Alice", young_person_engaged: true, practical_component: true, pathway_plan_linked: true }),
      makeRow({ id: "2", child_name: "Alice", skill_area: "Savings Planning", young_person_engaged: false, practical_component: false, pathway_plan_linked: false }),
      makeRow({ id: "3", child_name: "Bob", skill_area: "Debt Awareness" }),
    ];
    const m = computeMetrics(rows);
    expect(m.total_sessions).toBe(3);
    expect(m.unique_children).toBe(2);
    expect(m.skills_covered_count).toBe(3); // Budgeting Basics, Savings Planning, Debt Awareness
    expect(m.engagement_rate).toBeCloseTo(66.7, 0);
    expect(m.practical_rate).toBeCloseTo(66.7, 0);
  });

  it("computes competent_or_confident_rate", () => {
    const rows = [
      makeRow({ id: "1", competency_level: "Competent" }),
      makeRow({ id: "2", competency_level: "Confident" }),
      makeRow({ id: "3", competency_level: "Emerging" }),
      makeRow({ id: "4", competency_level: "Not Yet Started" }),
    ];
    const m = computeMetrics(rows);
    expect(m.competent_or_confident_rate).toBe(50);
    expect(m.not_yet_started_count).toBe(1);
  });

  it("computes children milestones (bank accounts, savings, budgets)", () => {
    const rows = [
      makeRow({ id: "1", child_name: "Alice", bank_account_opened: true }),
      makeRow({ id: "2", child_name: "Alice", savings_started: true }),
      makeRow({ id: "3", child_name: "Bob", budget_created: true }),
    ];
    const m = computeMetrics(rows);
    expect(m.children_with_bank_accounts).toBe(1);
    expect(m.children_with_savings).toBe(1);
    expect(m.children_with_budgets).toBe(1);
  });

  it("computes skill_coverage_per_child and average_sessions_per_child", () => {
    const rows = [
      makeRow({ id: "1", child_name: "Alice", skill_area: "Budgeting Basics" }),
      makeRow({ id: "2", child_name: "Alice", skill_area: "Savings Planning" }),
      makeRow({ id: "3", child_name: "Alice", skill_area: "Budgeting Basics" }), // duplicate
    ];
    const m = computeMetrics(rows);
    expect(m.skill_coverage_per_child["Alice"]).toBe(2);
    expect(m.average_sessions_per_child).toBe(3);
  });
});

describe("computeAlerts", () => {
  it("returns no alerts for empty data", () => {
    expect(computeAlerts([])).toEqual([]);
  });

  it("fires no_pathway_link alert for child with no pathway plan linkage", () => {
    const rows = [makeRow({ child_name: "Alice", pathway_plan_linked: false })];
    const alerts = computeAlerts(rows);
    expect(alerts.find((a) => a.type === "no_pathway_link")).toBeDefined();
    expect(alerts.find((a) => a.type === "no_pathway_link")!.severity).toBe("high");
  });

  it("fires narrow_skill_coverage for child with 3+ sessions but only 1 skill area", () => {
    const rows = [
      makeRow({ id: "1", child_name: "Alice", skill_area: "Budgeting Basics", pathway_plan_linked: true }),
      makeRow({ id: "2", child_name: "Alice", skill_area: "Budgeting Basics", pathway_plan_linked: true }),
      makeRow({ id: "3", child_name: "Alice", skill_area: "Budgeting Basics", pathway_plan_linked: true }),
    ];
    const alerts = computeAlerts(rows);
    expect(alerts.find((a) => a.type === "narrow_skill_coverage")).toBeDefined();
  });

  it("fires low_engagement for child with < 50% engagement across 3+ sessions", () => {
    const rows = [
      makeRow({ id: "1", child_name: "Alice", young_person_engaged: false, pathway_plan_linked: true }),
      makeRow({ id: "2", child_name: "Alice", young_person_engaged: false, pathway_plan_linked: true, skill_area: "Savings Planning" }),
      makeRow({ id: "3", child_name: "Alice", young_person_engaged: true, pathway_plan_linked: true, skill_area: "Debt Awareness" }),
    ];
    const alerts = computeAlerts(rows);
    expect(alerts.find((a) => a.type === "low_engagement")).toBeDefined();
  });

  it("fires overdue_session for past next_session_date", () => {
    const rows = [makeRow({ id: "r1", next_session_date: "2020-01-01", pathway_plan_linked: true })];
    const alerts = computeAlerts(rows);
    expect(alerts.find((a) => a.type === "overdue_session")).toBeDefined();
  });

  it("fires stalled_progress for 4+ sessions all at Emerging or below", () => {
    const rows = [
      makeRow({ id: "1", child_name: "Alice", competency_level: "Emerging", pathway_plan_linked: true, skill_area: "Budgeting Basics" }),
      makeRow({ id: "2", child_name: "Alice", competency_level: "Not Yet Started", pathway_plan_linked: true, skill_area: "Savings Planning" }),
      makeRow({ id: "3", child_name: "Alice", competency_level: "Emerging", pathway_plan_linked: true, skill_area: "Debt Awareness" }),
      makeRow({ id: "4", child_name: "Alice", competency_level: "Emerging", pathway_plan_linked: true, skill_area: "Tax Basics" }),
    ];
    const alerts = computeAlerts(rows);
    expect(alerts.find((a) => a.type === "stalled_progress")).toBeDefined();
  });
});

describe("validateBudgetingFinancialLiteracy", () => {
  it("passes for valid input", () => {
    const result = validateBudgetingFinancialLiteracy({
      childName: "Alice",
      sessionDate: "2026-05-01",
      facilitatorName: "Staff A",
      skillArea: "Budgeting Basics",
      deliveryMethod: "1-to-1 Session",
      competencyLevel: "Developing",
    });
    expect(result.valid).toBe(true);
  });

  it("fails for missing required fields", () => {
    const result = validateBudgetingFinancialLiteracy({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(4);
  });

  it("fails when real money used without practical component", () => {
    const result = validateBudgetingFinancialLiteracy({
      childName: "Alice",
      sessionDate: "2026-05-01",
      facilitatorName: "Staff A",
      skillArea: "Budgeting Basics",
      deliveryMethod: "1-to-1 Session",
      competencyLevel: "Developing",
      realMoneyUsed: true,
      practicalComponent: false,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Practical component"))).toBe(true);
  });

  it("fails when Confident competency without practical component", () => {
    const result = validateBudgetingFinancialLiteracy({
      childName: "Alice",
      sessionDate: "2026-05-01",
      facilitatorName: "Staff A",
      skillArea: "Budgeting Basics",
      deliveryMethod: "1-to-1 Session",
      competencyLevel: "Confident",
      practicalComponent: false,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Confident"))).toBe(true);
  });
});
