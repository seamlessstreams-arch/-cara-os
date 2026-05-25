// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — POLICIES REGISTER INTELLIGENCE ENGINE TESTS
// Comprehensive test suite for policy register coverage analysis.
// Covers Reg 38 policy review compliance, Reg 13 management oversight,
// CHR 2015 documented policy requirements, and ARIA intelligence.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computePoliciesIntelligence,
  type PolicyInput,
  type StaffRef,
} from "../policies-intelligence-engine";

const TODAY = "2026-05-25";

// ── Factories ───────────────────────────────────────────────────────────────

const STAFF: StaffRef[] = [
  { id: "staff_darren", name: "Darren" },
  { id: "staff_ryan", name: "Ryan" },
];

let _id = 0;
function makePolicy(overrides: Partial<PolicyInput> = {}): PolicyInput {
  _id++;
  return {
    id: `pol_test_${_id}`,
    title: `Test Policy ${_id}`,
    category: "safeguarding",
    status: "current",
    owner_id: "staff_darren",
    next_review_date: "2026-07-24", // +60 days from TODAY
    last_reviewed: "2026-03-25",
    acknowledgement_count: 8,
    total_staff_required: 8,
    statutory_basis: "Reg 38",
    ...overrides,
  };
}

function run(policies: PolicyInput[], opts?: { staff?: StaffRef[] }) {
  return computePoliciesIntelligence({
    policies,
    staff: opts?.staff ?? STAFF,
    today: TODAY,
  });
}

// ── Oak House Dataset ───────────────────────────────────────────────────────

function oakHousePolicies(): PolicyInput[] {
  return [
    makePolicy({
      id: "pol_001",
      title: "Safeguarding Policy",
      category: "safeguarding",
      status: "current",
      next_review_date: "2026-07-09", // +45d
      acknowledgement_count: 8,
      total_staff_required: 8,
    }),
    makePolicy({
      id: "pol_002",
      title: "Care Practice Policy",
      category: "care_practice",
      status: "current",
      next_review_date: "2026-06-24", // +30d
      acknowledgement_count: 7,
      total_staff_required: 8,
    }),
    makePolicy({
      id: "pol_003",
      title: "Health & Safety Policy",
      category: "health_safety",
      status: "overdue",
      next_review_date: "2026-05-11", // -14d
      acknowledgement_count: 8,
      total_staff_required: 8,
    }),
    makePolicy({
      id: "pol_004",
      title: "Workforce Policy",
      category: "workforce",
      status: "current",
      next_review_date: "2026-08-23", // +90d
      acknowledgement_count: 8,
      total_staff_required: 8,
    }),
    makePolicy({
      id: "pol_005",
      title: "Behaviour Support Policy",
      category: "behaviour",
      status: "current",
      next_review_date: "2026-07-24", // +60d
      acknowledgement_count: 6,
      total_staff_required: 8,
    }),
    makePolicy({
      id: "pol_006",
      title: "Complaints Policy",
      category: "complaints",
      status: "overdue",
      next_review_date: "2026-05-18", // -7d
      acknowledgement_count: 8,
      total_staff_required: 8,
    }),
    makePolicy({
      id: "pol_007",
      title: "Data Protection Policy",
      category: "data_protection",
      status: "current",
      next_review_date: "2026-09-22", // +120d
      acknowledgement_count: 8,
      total_staff_required: 8,
    }),
    makePolicy({
      id: "pol_008",
      title: "Admissions Policy",
      category: "admissions",
      status: "current",
      next_review_date: "2026-06-09", // +15d (within 30d)
      acknowledgement_count: 8,
      total_staff_required: 8,
    }),
    makePolicy({
      id: "pol_009",
      title: "Missing Persons Policy",
      category: "missing_persons",
      status: "current",
      next_review_date: "2026-06-14", // +20d (within 30d)
      acknowledgement_count: 8,
      total_staff_required: 8,
    }),
    makePolicy({
      id: "pol_010",
      title: "Medication Policy",
      category: "medication",
      status: "current",
      next_review_date: "2026-07-14", // +50d
      acknowledgement_count: 8,
      total_staff_required: 8,
    }),
    makePolicy({
      id: "pol_011",
      title: "Fire Safety Policy",
      category: "fire_safety",
      status: "current",
      next_review_date: "2026-08-13", // +80d
      acknowledgement_count: 8,
      total_staff_required: 8,
    }),
    makePolicy({
      id: "pol_012",
      title: "Whistleblowing Policy",
      category: "whistleblowing",
      status: "current",
      next_review_date: "2026-09-02", // +100d
      acknowledgement_count: 8,
      total_staff_required: 8,
    }),
  ];
}

// ══════════════════════════════════════════════════════════════════════════════
// TESTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Policies Intelligence Engine", () => {
  // ── Overview ────────────────────────────────────────────────────────────

  describe("overview", () => {
    it("calculates total_policies correctly", () => {
      const result = run(oakHousePolicies());
      expect(result.overview.total_policies).toBe(12);
    });

    it("calculates active_policies (current + due_review)", () => {
      const result = run(oakHousePolicies());
      // 10 current policies (pol_003 and pol_006 are overdue)
      expect(result.overview.active_policies).toBe(10);
    });

    it("calculates overdue_reviews correctly", () => {
      const result = run(oakHousePolicies());
      expect(result.overview.overdue_reviews).toBe(2);
    });

    it("calculates due_within_30_days correctly", () => {
      const result = run(oakHousePolicies());
      // pol_002 (+30d boundary), pol_008 (+15d), pol_009 (+20d)
      expect(result.overview.due_within_30_days).toBe(3);
    });

    it("excludes overdue policies from due_within_30_days", () => {
      const policies = [
        makePolicy({ status: "overdue", next_review_date: "2026-05-20" }),
        makePolicy({ status: "current", next_review_date: "2026-06-10" }),
      ];
      const result = run(policies);
      expect(result.overview.due_within_30_days).toBe(1);
    });

    it("excludes archived policies from due_within_30_days", () => {
      const policies = [
        makePolicy({ status: "archived", next_review_date: "2026-06-01" }),
        makePolicy({ status: "current", next_review_date: "2026-06-10" }),
      ];
      const result = run(policies);
      expect(result.overview.due_within_30_days).toBe(1);
    });

    it("excludes draft policies from due_within_30_days", () => {
      const policies = [
        makePolicy({ status: "draft", next_review_date: "2026-06-01" }),
        makePolicy({ status: "current", next_review_date: "2026-06-10" }),
      ];
      const result = run(policies);
      expect(result.overview.due_within_30_days).toBe(1);
    });

    it("calculates acknowledgement_rate across active policies", () => {
      const result = run(oakHousePolicies());
      // Total ack: 8+7+8+8+6+8+8+8+8+8+8+8 = 93
      // Total required: 8*12 = 96
      // Rate: 93/96 * 100 = 96.875 → rounds to 96.9
      expect(result.overview.acknowledgement_rate).toBe(96.9);
    });

    it("excludes archived and draft from acknowledgement_rate", () => {
      const policies = [
        makePolicy({ status: "current", acknowledgement_count: 5, total_staff_required: 10 }),
        makePolicy({ status: "archived", acknowledgement_count: 0, total_staff_required: 10 }),
        makePolicy({ status: "draft", acknowledgement_count: 0, total_staff_required: 10 }),
      ];
      const result = run(policies);
      expect(result.overview.acknowledgement_rate).toBe(50);
    });

    it("handles zero total_staff_required gracefully", () => {
      const policies = [
        makePolicy({ acknowledgement_count: 0, total_staff_required: 0 }),
      ];
      const result = run(policies);
      expect(result.overview.acknowledgement_rate).toBe(0);
    });

    it("calculates draft_count", () => {
      const policies = [
        makePolicy({ status: "draft" }),
        makePolicy({ status: "draft" }),
        makePolicy({ status: "current" }),
      ];
      const result = run(policies);
      expect(result.overview.draft_count).toBe(2);
    });

    it("calculates categories_covered from active policies only", () => {
      const result = run(oakHousePolicies());
      // 10 active policies across categories (health_safety and complaints are overdue so not counted)
      // Active categories: safeguarding, care_practice, workforce, behaviour, data_protection, admissions, missing_persons, medication, fire_safety, whistleblowing
      expect(result.overview.categories_covered).toBe(10);
    });

    it("sets total_categories_required to 13", () => {
      const result = run(oakHousePolicies());
      expect(result.overview.total_categories_required).toBe(13);
    });

    it("includes due_review status in active_policies", () => {
      const policies = [
        makePolicy({ status: "current" }),
        makePolicy({ status: "due_review" }),
        makePolicy({ status: "overdue" }),
      ];
      const result = run(policies);
      expect(result.overview.active_policies).toBe(2);
    });

    it("includes due_review policies in category coverage", () => {
      const policies = [
        makePolicy({ status: "due_review", category: "lone_working" }),
      ];
      const result = run(policies);
      expect(result.overview.categories_covered).toBe(1);
    });
  });

  // ── Category Breakdown ──────────────────────────────────────────────────

  describe("category_breakdown", () => {
    it("returns all 13 categories", () => {
      const result = run(oakHousePolicies());
      expect(result.category_breakdown).toHaveLength(13);
    });

    it("calculates correct count per category", () => {
      const result = run(oakHousePolicies());
      const safeguarding = result.category_breakdown.find((c) => c.category === "safeguarding");
      expect(safeguarding?.count).toBe(1);
    });

    it("calculates overdue_count per category", () => {
      const result = run(oakHousePolicies());
      const healthSafety = result.category_breakdown.find((c) => c.category === "health_safety");
      expect(healthSafety?.overdue_count).toBe(1);
    });

    it("marks has_coverage true when active policy exists", () => {
      const result = run(oakHousePolicies());
      const safeguarding = result.category_breakdown.find((c) => c.category === "safeguarding");
      expect(safeguarding?.has_coverage).toBe(true);
    });

    it("marks has_coverage false when only overdue/draft/archived policies", () => {
      const policies = [
        makePolicy({ category: "safeguarding", status: "overdue" }),
      ];
      const result = run(policies);
      const safeguarding = result.category_breakdown.find((c) => c.category === "safeguarding");
      expect(safeguarding?.has_coverage).toBe(false);
    });

    it("marks lone_working as no coverage in Oak House dataset", () => {
      const result = run(oakHousePolicies());
      const loneWorking = result.category_breakdown.find((c) => c.category === "lone_working");
      expect(loneWorking?.has_coverage).toBe(false);
      expect(loneWorking?.count).toBe(0);
    });

    it("uses correct category labels", () => {
      const result = run(oakHousePolicies());
      const behaviour = result.category_breakdown.find((c) => c.category === "behaviour");
      expect(behaviour?.category_label).toBe("Behaviour Support");
      const healthSafety = result.category_breakdown.find((c) => c.category === "health_safety");
      expect(healthSafety?.category_label).toBe("Health & Safety");
    });

    it("shows correct label for data_protection", () => {
      const result = run(oakHousePolicies());
      const dp = result.category_breakdown.find((c) => c.category === "data_protection");
      expect(dp?.category_label).toBe("Data Protection");
    });

    it("shows count 0 for uncovered category", () => {
      const result = run(oakHousePolicies());
      const loneWorking = result.category_breakdown.find((c) => c.category === "lone_working");
      expect(loneWorking?.count).toBe(0);
      expect(loneWorking?.overdue_count).toBe(0);
    });
  });

  // ── Overdue Policies ────────────────────────────────────────────────────

  describe("overdue_policies", () => {
    it("lists overdue policies sorted by days_overdue desc", () => {
      const result = run(oakHousePolicies());
      expect(result.overdue_policies).toHaveLength(2);
      expect(result.overdue_policies[0].policy_id).toBe("pol_003");
      expect(result.overdue_policies[1].policy_id).toBe("pol_006");
    });

    it("calculates days_overdue correctly", () => {
      const result = run(oakHousePolicies());
      // pol_003: next_review 2026-05-11, today 2026-05-25 → 14 days
      expect(result.overdue_policies[0].days_overdue).toBe(14);
      // pol_006: next_review 2026-05-18, today 2026-05-25 → 7 days
      expect(result.overdue_policies[1].days_overdue).toBe(7);
    });

    it("resolves owner_name from staff list", () => {
      const result = run(oakHousePolicies());
      expect(result.overdue_policies[0].owner_name).toBe("Darren");
    });

    it("shows 'Unknown' when owner not in staff list", () => {
      const policies = [
        makePolicy({ status: "overdue", owner_id: "staff_unknown", next_review_date: "2026-05-20" }),
      ];
      const result = run(policies);
      expect(result.overdue_policies[0].owner_name).toBe("Unknown");
    });

    it("includes title and category", () => {
      const result = run(oakHousePolicies());
      expect(result.overdue_policies[0].title).toBe("Health & Safety Policy");
      expect(result.overdue_policies[0].category).toBe("health_safety");
    });

    it("returns empty array when no overdue policies", () => {
      const policies = [makePolicy({ status: "current" })];
      const result = run(policies);
      expect(result.overdue_policies).toHaveLength(0);
    });
  });

  // ── Alerts ──────────────────────────────────────────────────────────────

  describe("alerts", () => {
    it("generates critical alert for missing required category", () => {
      const result = run(oakHousePolicies());
      const criticals = result.alerts.filter((a) => a.severity === "critical");
      // Missing: lone_working, health_safety (overdue, not active), complaints (overdue, not active)
      // Actually: lone_working has 0 policies, health_safety overdue = not active, complaints overdue = not active
      expect(criticals.length).toBeGreaterThanOrEqual(1);
      expect(criticals.some((a) => a.message.includes("Lone Working"))).toBe(true);
    });

    it("generates critical alert for health_safety with no active policy", () => {
      const result = run(oakHousePolicies());
      const criticals = result.alerts.filter((a) => a.severity === "critical");
      expect(criticals.some((a) => a.message.includes("Health & Safety"))).toBe(true);
    });

    it("generates critical alert for complaints with no active policy", () => {
      const result = run(oakHousePolicies());
      const criticals = result.alerts.filter((a) => a.severity === "critical");
      expect(criticals.some((a) => a.message.includes("Complaints"))).toBe(true);
    });

    it("generates medium alert for overdue policy <= 30 days", () => {
      const result = run(oakHousePolicies());
      const mediums = result.alerts.filter((a) => a.severity === "medium");
      expect(mediums.some((a) => a.message.includes("Health & Safety Policy"))).toBe(true);
    });

    it("generates high alert for overdue > 30 days", () => {
      const policies = [
        makePolicy({
          title: "Old Policy",
          status: "overdue",
          next_review_date: "2026-04-20", // 35 days overdue
        }),
      ];
      const result = run(policies);
      const highs = result.alerts.filter((a) => a.severity === "high");
      expect(highs.some((a) => a.message.includes("Old Policy"))).toBe(true);
      expect(highs.some((a) => a.message.includes("35 days overdue"))).toBe(true);
    });

    it("generates medium alert for low acknowledgement rate", () => {
      const policies = [
        makePolicy({ acknowledgement_count: 4, total_staff_required: 8, status: "current" }),
        makePolicy({ acknowledgement_count: 3, total_staff_required: 8, status: "current" }),
      ];
      const result = run(policies);
      const mediums = result.alerts.filter((a) => a.severity === "medium");
      expect(mediums.some((a) => a.message.includes("acknowledgement rate"))).toBe(true);
    });

    it("does not generate acknowledgement alert when rate >= 90%", () => {
      const policies = [
        makePolicy({ acknowledgement_count: 8, total_staff_required: 8 }),
      ];
      const result = run(policies);
      const mediums = result.alerts.filter((a) => a.severity === "medium");
      expect(mediums.some((a) => a.message.includes("acknowledgement rate"))).toBe(false);
    });

    it("generates low alert when due_within_30_days > 2", () => {
      const policies = [
        makePolicy({ next_review_date: "2026-06-01", status: "current" }),
        makePolicy({ next_review_date: "2026-06-10", status: "current", category: "workforce" }),
        makePolicy({ next_review_date: "2026-06-20", status: "current", category: "behaviour" }),
      ];
      const result = run(policies);
      const lows = result.alerts.filter((a) => a.severity === "low");
      expect(lows.some((a) => a.message.includes("3 policy reviews due within 30 days"))).toBe(true);
    });

    it("generates low alert when Oak House has 3 due within 30 days", () => {
      const result = run(oakHousePolicies());
      const lows = result.alerts.filter((a) => a.severity === "low");
      // pol_002 (+30d boundary), pol_008 (+15d), pol_009 (+20d) = 3, which is > 2
      expect(lows.some((a) => a.message.includes("3 policy reviews due within 30 days"))).toBe(true);
    });

    it("alert message includes days overdue for overdue policy", () => {
      const result = run(oakHousePolicies());
      const mediums = result.alerts.filter((a) => a.severity === "medium");
      expect(mediums.some((a) => a.message.includes("14 days overdue"))).toBe(true);
    });
  });

  // ── Insights ────────────────────────────────────────────────────────────

  describe("insights", () => {
    it("generates critical insight for missing categories", () => {
      const result = run(oakHousePolicies());
      const criticals = result.insights.filter((i) => i.severity === "critical");
      expect(criticals.length).toBeGreaterThanOrEqual(1);
      expect(criticals[0].text).toContain("required policy area");
    });

    it("generates warning insight for overdue reviews", () => {
      const result = run(oakHousePolicies());
      const warnings = result.insights.filter((i) => i.severity === "warning");
      expect(warnings.some((i) => i.text.includes("overdue"))).toBe(true);
    });

    it("generates warning insight for low acknowledgement", () => {
      const policies = [
        makePolicy({ acknowledgement_count: 4, total_staff_required: 8, status: "current" }),
      ];
      const result = run(policies);
      const warnings = result.insights.filter((i) => i.severity === "warning");
      expect(warnings.some((i) => i.text.includes("acknowledgement rate"))).toBe(true);
    });

    it("generates positive insight when all categories covered", () => {
      const allCategories = [
        "safeguarding", "care_practice", "health_safety", "workforce",
        "behaviour", "complaints", "data_protection", "admissions",
        "missing_persons", "medication", "fire_safety", "lone_working", "whistleblowing",
      ];
      const policies = allCategories.map((cat) =>
        makePolicy({ category: cat, status: "current" }),
      );
      const result = run(policies);
      const positives = result.insights.filter((i) => i.severity === "positive");
      expect(positives.some((i) => i.text.includes("All 13 required policy areas"))).toBe(true);
    });

    it("generates positive insight for high acknowledgement >= 95%", () => {
      const policies = [
        makePolicy({ acknowledgement_count: 8, total_staff_required: 8, status: "current" }),
      ];
      const result = run(policies);
      const positives = result.insights.filter((i) => i.severity === "positive");
      expect(positives.some((i) => i.text.includes("acknowledgement rate"))).toBe(true);
    });

    it("generates positive insight when no overdue reviews", () => {
      const policies = [
        makePolicy({ status: "current" }),
      ];
      const result = run(policies);
      const positives = result.insights.filter((i) => i.severity === "positive");
      expect(positives.some((i) => i.text.includes("No overdue policy reviews"))).toBe(true);
    });

    it("generates positive insight when all policies current", () => {
      const policies = [
        makePolicy({ status: "current" }),
        makePolicy({ status: "current", category: "workforce" }),
      ];
      const result = run(policies);
      const positives = result.insights.filter((i) => i.severity === "positive");
      expect(positives.some((i) => i.text.includes("All active policies have current status"))).toBe(true);
    });

    it("does not generate 'all current' insight when some are due_review", () => {
      const policies = [
        makePolicy({ status: "current" }),
        makePolicy({ status: "due_review", category: "workforce" }),
      ];
      const result = run(policies);
      const positives = result.insights.filter((i) => i.severity === "positive");
      expect(positives.some((i) => i.text.includes("All active policies have current status"))).toBe(false);
    });

    it("singular wording for 1 missing category", () => {
      // Cover 12 categories, missing lone_working
      const cats = [
        "safeguarding", "care_practice", "health_safety", "workforce",
        "behaviour", "complaints", "data_protection", "admissions",
        "missing_persons", "medication", "fire_safety", "whistleblowing",
      ];
      const policies = cats.map((cat) => makePolicy({ category: cat, status: "current" }));
      const result = run(policies);
      const criticals = result.insights.filter((i) => i.severity === "critical");
      expect(criticals[0].text).toContain("Required policy area missing: Lone Working");
    });

    it("plural wording for multiple missing categories", () => {
      const policies = [makePolicy({ category: "safeguarding", status: "current" })];
      const result = run(policies);
      const criticals = result.insights.filter((i) => i.severity === "critical");
      expect(criticals[0].text).toMatch(/\d+ required policy areas missing/);
    });

    it("singular wording for 1 overdue review", () => {
      const policies = [
        makePolicy({ status: "overdue", next_review_date: "2026-05-20" }),
      ];
      const result = run(policies);
      const warnings = result.insights.filter((i) => i.severity === "warning");
      expect(warnings.some((i) => i.text.includes("1 policy review is overdue"))).toBe(true);
    });

    it("plural wording for multiple overdue reviews", () => {
      const result = run(oakHousePolicies());
      const warnings = result.insights.filter((i) => i.severity === "warning");
      expect(warnings.some((i) => i.text.includes("2 policy reviews are overdue"))).toBe(true);
    });
  });

  // ── Empty State ─────────────────────────────────────────────────────────

  describe("empty state", () => {
    it("handles zero policies", () => {
      const result = run([]);
      expect(result.overview.total_policies).toBe(0);
      expect(result.overview.active_policies).toBe(0);
      expect(result.overview.overdue_reviews).toBe(0);
      expect(result.overview.due_within_30_days).toBe(0);
      expect(result.overview.acknowledgement_rate).toBe(0);
      expect(result.overview.draft_count).toBe(0);
      expect(result.overview.categories_covered).toBe(0);
      expect(result.overview.total_categories_required).toBe(13);
    });

    it("returns empty overdue_policies for zero policies", () => {
      const result = run([]);
      expect(result.overdue_policies).toHaveLength(0);
    });

    it("returns 13 category breakdowns even with zero policies", () => {
      const result = run([]);
      expect(result.category_breakdown).toHaveLength(13);
      expect(result.category_breakdown.every((c) => c.count === 0)).toBe(true);
      expect(result.category_breakdown.every((c) => !c.has_coverage)).toBe(true);
    });

    it("generates critical alerts for all missing categories when empty", () => {
      const result = run([]);
      const criticals = result.alerts.filter((a) => a.severity === "critical");
      expect(criticals).toHaveLength(13);
    });

    it("does not generate positive insights when empty", () => {
      const result = run([]);
      const positives = result.insights.filter((i) => i.severity === "positive");
      expect(positives).toHaveLength(0);
    });

    it("does not generate acknowledgement alert when no policies", () => {
      const result = run([]);
      const mediums = result.alerts.filter((a) => a.severity === "medium");
      expect(mediums.some((a) => a.message.includes("acknowledgement"))).toBe(false);
    });
  });

  // ── Edge Cases ──────────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("policy exactly on today boundary is within 30 days", () => {
      const policies = [
        makePolicy({ status: "current", next_review_date: "2026-05-25" }),
      ];
      const result = run(policies);
      expect(result.overview.due_within_30_days).toBe(1);
    });

    it("policy exactly on 30-day boundary is included", () => {
      const policies = [
        makePolicy({ status: "current", next_review_date: "2026-06-24" }),
      ];
      const result = run(policies);
      expect(result.overview.due_within_30_days).toBe(1);
    });

    it("policy at 31 days is excluded from due_within_30_days", () => {
      const policies = [
        makePolicy({ status: "current", next_review_date: "2026-06-25" }),
      ];
      const result = run(policies);
      expect(result.overview.due_within_30_days).toBe(0);
    });

    it("handles multiple policies in same category", () => {
      const policies = [
        makePolicy({ category: "safeguarding", status: "current" }),
        makePolicy({ category: "safeguarding", status: "current" }),
        makePolicy({ category: "safeguarding", status: "overdue", next_review_date: "2026-05-10" }),
      ];
      const result = run(policies);
      const safeguarding = result.category_breakdown.find((c) => c.category === "safeguarding");
      expect(safeguarding?.count).toBe(3);
      expect(safeguarding?.overdue_count).toBe(1);
      expect(safeguarding?.has_coverage).toBe(true);
    });

    it("archived policies do not count toward category coverage", () => {
      const policies = [
        makePolicy({ category: "safeguarding", status: "archived" }),
      ];
      const result = run(policies);
      const safeguarding = result.category_breakdown.find((c) => c.category === "safeguarding");
      expect(safeguarding?.has_coverage).toBe(false);
    });

    it("draft policies do not count toward category coverage", () => {
      const policies = [
        makePolicy({ category: "safeguarding", status: "draft" }),
      ];
      const result = run(policies);
      const safeguarding = result.category_breakdown.find((c) => c.category === "safeguarding");
      expect(safeguarding?.has_coverage).toBe(false);
    });

    it("uses today override correctly", () => {
      const policies = [
        makePolicy({ status: "current", next_review_date: "2026-06-10" }),
      ];
      // With today as 2026-06-05, 5 days until review (within 30 days)
      const result = computePoliciesIntelligence({
        policies,
        staff: STAFF,
        today: "2026-06-05",
      });
      expect(result.overview.due_within_30_days).toBe(1);
    });

    it("100% acknowledgement rate", () => {
      const policies = [
        makePolicy({ acknowledgement_count: 8, total_staff_required: 8, status: "current" }),
      ];
      const result = run(policies);
      expect(result.overview.acknowledgement_rate).toBe(100);
    });

    it("0% acknowledgement rate", () => {
      const policies = [
        makePolicy({ acknowledgement_count: 0, total_staff_required: 8, status: "current" }),
      ];
      const result = run(policies);
      expect(result.overview.acknowledgement_rate).toBe(0);
    });

    it("overdue policy with 0 days overdue (next_review_date equals today)", () => {
      const policies = [
        makePolicy({ status: "overdue", next_review_date: "2026-05-25" }),
      ];
      const result = run(policies);
      expect(result.overdue_policies[0].days_overdue).toBe(0);
    });

    it("handles empty staff list gracefully", () => {
      const policies = [
        makePolicy({ status: "overdue", next_review_date: "2026-05-20" }),
      ];
      const result = run(policies, { staff: [] });
      expect(result.overdue_policies[0].owner_name).toBe("Unknown");
    });
  });
});
