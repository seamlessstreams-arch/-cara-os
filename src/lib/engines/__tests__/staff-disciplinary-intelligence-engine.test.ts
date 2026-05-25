// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — STAFF DISCIPLINARY INTELLIGENCE ENGINE TESTS
// Comprehensive test suite for staff disciplinary case analysis.
// Covers Reg 33 fitness of staff, Reg 34 employment of staff,
// Reg 21 supervision (Schedule 4), SCCIF Leadership & Management.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeStaffDisciplinaryIntelligence,
  type DisciplinaryInput,
  type StaffRef,
} from "../staff-disciplinary-intelligence-engine";

const TODAY = "2026-05-25";

// ── Factories ───────────────────────────────────────────────────────────────

const STAFF: StaffRef[] = [
  { id: "staff_darren", name: "Darren" },
  { id: "staff_ryan", name: "Ryan" },
  { id: "staff_anna", name: "Anna" },
  { id: "staff_chervelle", name: "Chervelle" },
  { id: "staff_edward", name: "Edward" },
  { id: "staff_lackson", name: "Lackson" },
  { id: "staff_agency_01", name: "Agency Worker 01" },
];

let _id = 0;
function makeDisciplinary(overrides: Partial<DisciplinaryInput> = {}): DisciplinaryInput {
  _id++;
  return {
    id: `disc_test_${_id}`,
    staff_id: "staff_edward",
    date_raised: "2026-05-01",
    category: "conduct",
    severity: "formal_stage_1",
    status: "open",
    investigating_officer: "staff_darren",
    outcome: "pending",
    date_concluded: null,
    days_to_resolution: null,
    lado_referral: false,
    suspension: false,
    support_offered: ["supervision meeting"],
    ...overrides,
  };
}

function run(cases: DisciplinaryInput[], opts?: { staff?: StaffRef[] }) {
  return computeStaffDisciplinaryIntelligence({
    cases,
    staff: opts?.staff ?? STAFF,
    today: TODAY,
  });
}

// ── Oak House Dataset ───────────────────────────────────────────────────────

function oakHouseCases(): DisciplinaryInput[] {
  return [
    // Case 1: staff_edward, conduct, formal_stage_1, concluded 45 days ago, verbal_warning, resolved in 12 days
    makeDisciplinary({
      id: "disc_oak_001",
      staff_id: "staff_edward",
      date_raised: "2026-03-29",
      category: "conduct",
      severity: "formal_stage_1",
      status: "concluded",
      investigating_officer: "staff_darren",
      outcome: "verbal_warning",
      date_concluded: "2026-04-10",
      days_to_resolution: 12,
      lado_referral: false,
      suspension: false,
      support_offered: ["supervision meeting"],
    }),
    // Case 2: staff_agency_01 (external), gross_misconduct, concluded 135 days ago, dismissal, LADO referral, suspension, resolved in 8 days
    makeDisciplinary({
      id: "disc_oak_002",
      staff_id: "staff_agency_01",
      date_raised: "2026-01-03",
      category: "gross_misconduct",
      severity: "gross_misconduct",
      status: "concluded",
      investigating_officer: "staff_darren",
      outcome: "dismissal",
      date_concluded: "2026-01-11",
      days_to_resolution: 8,
      lado_referral: true,
      suspension: true,
      support_offered: ["union representative", "welfare check"],
    }),
    // Case 3: staff_ryan, attendance, informal, concluded 30 days ago, management_advice, resolved in 5 days
    makeDisciplinary({
      id: "disc_oak_003",
      staff_id: "staff_ryan",
      date_raised: "2026-04-20",
      category: "attendance",
      severity: "informal",
      status: "concluded",
      investigating_officer: "staff_darren",
      outcome: "management_advice",
      date_concluded: "2026-04-25",
      days_to_resolution: 5,
      lado_referral: false,
      suspension: false,
      support_offered: [],
    }),
    // Case 4: staff_edward, breach_of_policy, formal_stage_1, open, investigating, 14 days open
    makeDisciplinary({
      id: "disc_oak_004",
      staff_id: "staff_edward",
      date_raised: "2026-05-11",
      category: "breach_of_policy",
      severity: "formal_stage_1",
      status: "investigation",
      investigating_officer: "staff_darren",
      outcome: "pending",
      date_concluded: null,
      days_to_resolution: null,
      lado_referral: false,
      suspension: false,
      support_offered: ["supervision meeting", "policy refresher training"],
    }),
    // Case 5: staff_lackson, capability, formal_stage_1, open, investigation, 8 days open
    makeDisciplinary({
      id: "disc_oak_005",
      staff_id: "staff_lackson",
      date_raised: "2026-05-17",
      category: "capability",
      severity: "formal_stage_1",
      status: "investigation",
      investigating_officer: "staff_darren",
      outcome: "pending",
      date_concluded: null,
      days_to_resolution: null,
      lado_referral: false,
      suspension: false,
      support_offered: ["additional training", "mentor assigned"],
    }),
  ];
}

// ══════════════════════════════════════════════════════════════════════════════
// TESTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Staff Disciplinary Intelligence Engine", () => {
  // ── Empty state ─────────────────────────────────────────────────────────

  describe("empty state", () => {
    it("returns zero overview for empty cases array", () => {
      const result = run([]);
      expect(result.overview.total_cases).toBe(0);
      expect(result.overview.open_cases).toBe(0);
      expect(result.overview.concluded_cases).toBe(0);
      expect(result.overview.avg_days_to_resolution).toBe(0);
      expect(result.overview.lado_referrals).toBe(0);
      expect(result.overview.suspensions_active).toBe(0);
      expect(result.overview.cases_last_90_days).toBe(0);
      expect(result.overview.support_offered_rate).toBe(0);
    });

    it("returns empty arrays for all list fields", () => {
      const result = run([]);
      expect(result.category_breakdown).toEqual([]);
      expect(result.open_cases).toEqual([]);
      expect(result.outcome_distribution).toEqual([]);
      expect(result.alerts).toEqual([]);
      expect(result.insights).toEqual([]);
    });
  });

  // ── Overview ────────────────────────────────────────────────────────────

  describe("overview", () => {
    it("counts total, open, and concluded cases correctly", () => {
      const cases = [
        makeDisciplinary({ status: "open" }),
        makeDisciplinary({ status: "investigation" }),
        makeDisciplinary({ status: "concluded", date_concluded: "2026-05-20", days_to_resolution: 10 }),
      ];
      const result = run(cases);
      expect(result.overview.total_cases).toBe(3);
      expect(result.overview.open_cases).toBe(2);
      expect(result.overview.concluded_cases).toBe(1);
    });

    it("calculates average days to resolution from concluded cases", () => {
      const cases = [
        makeDisciplinary({ status: "concluded", days_to_resolution: 10, date_concluded: "2026-05-10" }),
        makeDisciplinary({ status: "concluded", days_to_resolution: 20, date_concluded: "2026-05-15" }),
      ];
      const result = run(cases);
      expect(result.overview.avg_days_to_resolution).toBe(15);
    });

    it("excludes null days_to_resolution from average calculation", () => {
      const cases = [
        makeDisciplinary({ status: "concluded", days_to_resolution: 10, date_concluded: "2026-05-10" }),
        makeDisciplinary({ status: "concluded", days_to_resolution: null, date_concluded: "2026-05-15" }),
      ];
      const result = run(cases);
      expect(result.overview.avg_days_to_resolution).toBe(10);
    });

    it("counts total LADO referrals across all cases", () => {
      const cases = [
        makeDisciplinary({ lado_referral: true }),
        makeDisciplinary({ lado_referral: true, status: "concluded", date_concluded: "2026-05-20", days_to_resolution: 5 }),
        makeDisciplinary({ lado_referral: false }),
      ];
      const result = run(cases);
      expect(result.overview.lado_referrals).toBe(2);
    });

    it("counts only active (open) suspensions", () => {
      const cases = [
        makeDisciplinary({ suspension: true, status: "open" }),
        makeDisciplinary({ suspension: true, status: "concluded", date_concluded: "2026-05-20", days_to_resolution: 5 }),
      ];
      const result = run(cases);
      expect(result.overview.suspensions_active).toBe(1);
    });

    it("counts cases raised in the last 90 days", () => {
      const cases = [
        makeDisciplinary({ date_raised: "2026-05-01" }),
        makeDisciplinary({ date_raised: "2026-03-01" }),
        makeDisciplinary({ date_raised: "2026-01-01", status: "concluded", date_concluded: "2026-01-15", days_to_resolution: 14 }),
      ];
      const result = run(cases);
      expect(result.overview.cases_last_90_days).toBe(2);
    });

    it("calculates support offered rate for formal cases only", () => {
      const cases = [
        makeDisciplinary({ severity: "formal_stage_1", support_offered: ["supervision"] }),
        makeDisciplinary({ severity: "formal_stage_2", support_offered: [] }),
        makeDisciplinary({ severity: "informal", support_offered: [] }),
      ];
      const result = run(cases);
      // 1 of 2 formal cases has support = 50%
      expect(result.overview.support_offered_rate).toBe(50);
    });

    it("returns 0 support rate when no formal cases exist", () => {
      const cases = [
        makeDisciplinary({ severity: "informal", support_offered: [] }),
      ];
      const result = run(cases);
      expect(result.overview.support_offered_rate).toBe(0);
    });
  });

  // ── Category Breakdown ──────────────────────────────────────────────────

  describe("category_breakdown", () => {
    it("groups cases by category with correct counts", () => {
      const cases = [
        makeDisciplinary({ category: "conduct" }),
        makeDisciplinary({ category: "conduct" }),
        makeDisciplinary({ category: "attendance" }),
      ];
      const result = run(cases);
      expect(result.category_breakdown).toHaveLength(2);
      const conduct = result.category_breakdown.find((c) => c.category === "conduct");
      expect(conduct?.count).toBe(2);
    });

    it("counts open cases per category", () => {
      const cases = [
        makeDisciplinary({ category: "conduct", status: "open" }),
        makeDisciplinary({ category: "conduct", status: "concluded", date_concluded: "2026-05-20", days_to_resolution: 5 }),
        makeDisciplinary({ category: "attendance", status: "investigation" }),
      ];
      const result = run(cases);
      const conduct = result.category_breakdown.find((c) => c.category === "conduct");
      expect(conduct?.open_count).toBe(1);
      const attendance = result.category_breakdown.find((c) => c.category === "attendance");
      expect(attendance?.open_count).toBe(1);
    });

    it("provides correct category labels", () => {
      const cases = [
        makeDisciplinary({ category: "breach_of_policy" }),
        makeDisciplinary({ category: "gross_misconduct" }),
      ];
      const result = run(cases);
      const bp = result.category_breakdown.find((c) => c.category === "breach_of_policy");
      expect(bp?.category_label).toBe("Breach of Policy");
      const gm = result.category_breakdown.find((c) => c.category === "gross_misconduct");
      expect(gm?.category_label).toBe("Gross Misconduct");
    });

    it("sorts by count descending", () => {
      const cases = [
        makeDisciplinary({ category: "attendance" }),
        makeDisciplinary({ category: "conduct" }),
        makeDisciplinary({ category: "conduct" }),
        makeDisciplinary({ category: "conduct" }),
      ];
      const result = run(cases);
      expect(result.category_breakdown[0].category).toBe("conduct");
      expect(result.category_breakdown[0].count).toBe(3);
    });

    it("handles unknown category with title-case label", () => {
      const cases = [makeDisciplinary({ category: "unknown_category" })];
      const result = run(cases);
      expect(result.category_breakdown[0].category_label).toBe("Unknown Category");
    });
  });

  // ── Open Cases ──────────────────────────────────────────────────────────

  describe("open_cases", () => {
    it("includes only non-concluded cases", () => {
      const cases = [
        makeDisciplinary({ id: "open_1", status: "open" }),
        makeDisciplinary({ id: "open_2", status: "investigation" }),
        makeDisciplinary({ id: "closed", status: "concluded", date_concluded: "2026-05-20", days_to_resolution: 5 }),
      ];
      const result = run(cases);
      expect(result.open_cases).toHaveLength(2);
      expect(result.open_cases.map((c) => c.case_id)).toContain("open_1");
      expect(result.open_cases.map((c) => c.case_id)).toContain("open_2");
    });

    it("calculates days_open from date_raised to today", () => {
      const cases = [makeDisciplinary({ date_raised: "2026-05-15", status: "open" })];
      const result = run(cases);
      // 2026-05-15 to 2026-05-25 = 10 days
      expect(result.open_cases[0].days_open).toBe(10);
    });

    it("resolves staff name from staff ref", () => {
      const cases = [makeDisciplinary({ staff_id: "staff_lackson", status: "open" })];
      const result = run(cases);
      expect(result.open_cases[0].staff_name).toBe("Lackson");
    });

    it("falls back to staff_id when no matching staff ref", () => {
      const cases = [makeDisciplinary({ staff_id: "staff_unknown", status: "open" })];
      const result = run(cases);
      expect(result.open_cases[0].staff_name).toBe("staff_unknown");
    });

    it("includes lado_referral and suspension flags", () => {
      const cases = [makeDisciplinary({ status: "open", lado_referral: true, suspension: true })];
      const result = run(cases);
      expect(result.open_cases[0].lado_referral).toBe(true);
      expect(result.open_cases[0].suspension).toBe(true);
    });

    it("includes category_label in open case entries", () => {
      const cases = [makeDisciplinary({ category: "safeguarding", status: "open" })];
      const result = run(cases);
      expect(result.open_cases[0].category_label).toBe("Safeguarding");
    });
  });

  // ── Outcome Distribution ────────────────────────────────────────────────

  describe("outcome_distribution", () => {
    it("counts outcomes across all cases", () => {
      const cases = [
        makeDisciplinary({ outcome: "verbal_warning" }),
        makeDisciplinary({ outcome: "verbal_warning" }),
        makeDisciplinary({ outcome: "dismissal" }),
        makeDisciplinary({ outcome: "pending" }),
      ];
      const result = run(cases);
      const verbal = result.outcome_distribution.find((o) => o.outcome === "verbal_warning");
      expect(verbal?.count).toBe(2);
      const dismiss = result.outcome_distribution.find((o) => o.outcome === "dismissal");
      expect(dismiss?.count).toBe(1);
    });

    it("provides correct outcome labels", () => {
      const cases = [
        makeDisciplinary({ outcome: "management_advice" }),
        makeDisciplinary({ outcome: "final_warning" }),
      ];
      const result = run(cases);
      const ma = result.outcome_distribution.find((o) => o.outcome === "management_advice");
      expect(ma?.outcome_label).toBe("Management Advice");
      const fw = result.outcome_distribution.find((o) => o.outcome === "final_warning");
      expect(fw?.outcome_label).toBe("Final Warning");
    });

    it("sorts by count descending", () => {
      const cases = [
        makeDisciplinary({ outcome: "no_action" }),
        makeDisciplinary({ outcome: "verbal_warning" }),
        makeDisciplinary({ outcome: "verbal_warning" }),
        makeDisciplinary({ outcome: "verbal_warning" }),
      ];
      const result = run(cases);
      expect(result.outcome_distribution[0].outcome).toBe("verbal_warning");
      expect(result.outcome_distribution[0].count).toBe(3);
    });

    it("handles unknown outcome with title-case label", () => {
      const cases = [makeDisciplinary({ outcome: "custom_outcome" })];
      const result = run(cases);
      expect(result.outcome_distribution[0].outcome_label).toBe("Custom Outcome");
    });
  });

  // ── Alerts ──────────────────────────────────────────────────────────────

  describe("alerts", () => {
    it("generates critical alert for gross misconduct open > 5 days without LADO", () => {
      const cases = [
        makeDisciplinary({
          category: "gross_misconduct",
          severity: "gross_misconduct",
          status: "open",
          date_raised: "2026-05-10",
          lado_referral: false,
        }),
      ];
      const result = run(cases);
      const criticals = result.alerts.filter((a) => a.severity === "critical");
      expect(criticals.length).toBeGreaterThanOrEqual(1);
      expect(criticals.some((a) => a.message.includes("LADO consideration"))).toBe(true);
    });

    it("does NOT generate LADO alert when lado_referral is true", () => {
      const cases = [
        makeDisciplinary({
          category: "gross_misconduct",
          severity: "gross_misconduct",
          status: "open",
          date_raised: "2026-05-10",
          lado_referral: true,
        }),
      ];
      const result = run(cases);
      const ladoAlerts = result.alerts.filter((a) => a.message.includes("LADO consideration"));
      expect(ladoAlerts).toHaveLength(0);
    });

    it("does NOT generate LADO alert when gross misconduct open <= 5 days", () => {
      const cases = [
        makeDisciplinary({
          category: "gross_misconduct",
          severity: "gross_misconduct",
          status: "open",
          date_raised: "2026-05-21",
          lado_referral: false,
        }),
      ];
      const result = run(cases);
      const ladoAlerts = result.alerts.filter((a) => a.message.includes("LADO consideration"));
      expect(ladoAlerts).toHaveLength(0);
    });

    it("generates critical alert for suspended staff with investigation > 21 days", () => {
      const cases = [
        makeDisciplinary({
          status: "investigation",
          suspension: true,
          date_raised: "2026-04-20",
        }),
      ];
      const result = run(cases);
      const criticals = result.alerts.filter((a) => a.severity === "critical");
      expect(criticals.some((a) => a.message.includes("21 days"))).toBe(true);
    });

    it("does NOT generate suspension alert when investigation <= 21 days", () => {
      const cases = [
        makeDisciplinary({
          status: "investigation",
          suspension: true,
          date_raised: "2026-05-10",
        }),
      ];
      const result = run(cases);
      const suspAlerts = result.alerts.filter((a) => a.message.includes("21 days"));
      expect(suspAlerts).toHaveLength(0);
    });

    it("generates high alert for open case exceeding 28 days", () => {
      const cases = [
        makeDisciplinary({
          status: "open",
          date_raised: "2026-04-20",
        }),
      ];
      const result = run(cases);
      const highs = result.alerts.filter((a) => a.severity === "high");
      expect(highs.some((a) => a.message.includes("28 days"))).toBe(true);
    });

    it("does NOT generate 28-day alert for cases open <= 28 days", () => {
      const cases = [
        makeDisciplinary({
          status: "open",
          date_raised: "2026-05-01",
        }),
      ];
      const result = run(cases);
      const dayAlerts = result.alerts.filter((a) => a.message.includes("28 days"));
      expect(dayAlerts).toHaveLength(0);
    });

    it("generates high alert for 2+ cases against same staff in 12 months", () => {
      const cases = [
        makeDisciplinary({ staff_id: "staff_edward", date_raised: "2026-03-01", status: "concluded", date_concluded: "2026-03-10", days_to_resolution: 9 }),
        makeDisciplinary({ staff_id: "staff_edward", date_raised: "2026-05-01", status: "open" }),
      ];
      const result = run(cases);
      const highs = result.alerts.filter((a) => a.severity === "high");
      expect(highs.some((a) => a.message.includes("2 disciplinary cases against Edward"))).toBe(true);
    });

    it("does NOT generate repeat-offender alert for cases > 12 months apart", () => {
      const cases = [
        makeDisciplinary({ staff_id: "staff_edward", date_raised: "2024-12-01", status: "concluded", date_concluded: "2024-12-15", days_to_resolution: 14 }),
        makeDisciplinary({ staff_id: "staff_edward", date_raised: "2026-05-01", status: "open" }),
      ];
      const result = run(cases);
      const repeatAlerts = result.alerts.filter((a) => a.message.includes("disciplinary cases against Edward"));
      expect(repeatAlerts).toHaveLength(0);
    });

    it("generates medium alert for no support offered during formal proceedings", () => {
      const cases = [
        makeDisciplinary({
          severity: "formal_stage_1",
          status: "open",
          support_offered: [],
          staff_id: "staff_lackson",
        }),
      ];
      const result = run(cases);
      const mediums = result.alerts.filter((a) => a.severity === "medium");
      expect(mediums.some((a) => a.message.includes("No support offered"))).toBe(true);
    });

    it("does NOT generate support alert for informal cases", () => {
      const cases = [
        makeDisciplinary({
          severity: "informal",
          status: "open",
          support_offered: [],
        }),
      ];
      const result = run(cases);
      const supportAlerts = result.alerts.filter((a) => a.message.includes("No support offered"));
      expect(supportAlerts).toHaveLength(0);
    });

    it("generates low alert for informal cases without management advice outcome", () => {
      const cases = [
        makeDisciplinary({
          severity: "informal",
          status: "concluded",
          outcome: "no_action",
          date_concluded: "2026-05-20",
          days_to_resolution: 5,
        }),
      ];
      const result = run(cases);
      const lows = result.alerts.filter((a) => a.severity === "low");
      expect(lows.some((a) => a.message.includes("management advice"))).toBe(true);
    });

    it("does NOT generate low alert when informal case has management_advice outcome", () => {
      const cases = [
        makeDisciplinary({
          severity: "informal",
          status: "concluded",
          outcome: "management_advice",
          date_concluded: "2026-05-20",
          days_to_resolution: 5,
        }),
      ];
      const result = run(cases);
      const mgmtAlerts = result.alerts.filter((a) => a.message.includes("management advice"));
      expect(mgmtAlerts).toHaveLength(0);
    });
  });

  // ── Insights ────────────────────────────────────────────────────────────

  describe("insights", () => {
    it("generates critical insight for active suspensions with LADO involvement", () => {
      const cases = [
        makeDisciplinary({ status: "open", suspension: true, lado_referral: true }),
      ];
      const result = run(cases);
      const criticals = result.insights.filter((i) => i.severity === "critical");
      expect(criticals.some((i) => i.text.includes("LADO involvement"))).toBe(true);
    });

    it("does NOT generate LADO suspension insight when no active LADO suspensions", () => {
      const cases = [
        makeDisciplinary({ status: "open", suspension: true, lado_referral: false }),
      ];
      const result = run(cases);
      const ladoInsights = result.insights.filter((i) => i.text.includes("LADO involvement"));
      expect(ladoInsights).toHaveLength(0);
    });

    it("generates warning insight when avg resolution > 20 days", () => {
      const cases = [
        makeDisciplinary({ status: "concluded", days_to_resolution: 25, date_concluded: "2026-05-10" }),
        makeDisciplinary({ status: "concluded", days_to_resolution: 30, date_concluded: "2026-05-15" }),
      ];
      const result = run(cases);
      const warnings = result.insights.filter((i) => i.severity === "warning");
      expect(warnings.some((i) => i.text.includes("procedural efficiency concern"))).toBe(true);
    });

    it("does NOT generate resolution warning when avg <= 20 days", () => {
      const cases = [
        makeDisciplinary({ status: "concluded", days_to_resolution: 10, date_concluded: "2026-05-10" }),
        makeDisciplinary({ status: "concluded", days_to_resolution: 15, date_concluded: "2026-05-15" }),
      ];
      const result = run(cases);
      const efficiencyWarnings = result.insights.filter((i) => i.text.includes("procedural efficiency"));
      expect(efficiencyWarnings).toHaveLength(0);
    });

    it("generates warning insight for investigator with 2+ simultaneous open cases", () => {
      const cases = [
        makeDisciplinary({ status: "open", investigating_officer: "staff_darren" }),
        makeDisciplinary({ status: "open", investigating_officer: "staff_darren" }),
      ];
      const result = run(cases);
      const warnings = result.insights.filter((i) => i.severity === "warning");
      expect(warnings.some((i) => i.text.includes("capacity concern"))).toBe(true);
    });

    it("does NOT generate capacity warning for single open case per investigator", () => {
      const cases = [
        makeDisciplinary({ status: "open", investigating_officer: "staff_darren" }),
        makeDisciplinary({ status: "open", investigating_officer: "staff_anna" }),
      ];
      const result = run(cases);
      const capacityWarnings = result.insights.filter((i) => i.text.includes("capacity concern"));
      expect(capacityWarnings).toHaveLength(0);
    });

    it("generates positive insight when all formal cases have support documented", () => {
      const cases = [
        makeDisciplinary({ severity: "formal_stage_1", support_offered: ["supervision"] }),
        makeDisciplinary({ severity: "formal_stage_2", support_offered: ["training"] }),
      ];
      const result = run(cases);
      const positives = result.insights.filter((i) => i.severity === "positive");
      expect(positives.some((i) => i.text.includes("support measures documented"))).toBe(true);
    });

    it("does NOT generate support positive when some formal cases lack support", () => {
      const cases = [
        makeDisciplinary({ severity: "formal_stage_1", support_offered: ["supervision"] }),
        makeDisciplinary({ severity: "formal_stage_2", support_offered: [] }),
      ];
      const result = run(cases);
      const supportPositives = result.insights.filter((i) => i.text.includes("support measures documented"));
      expect(supportPositives).toHaveLength(0);
    });

    it("generates positive insight when avg resolution <= 14 days", () => {
      const cases = [
        makeDisciplinary({ status: "concluded", days_to_resolution: 10, date_concluded: "2026-05-10" }),
        makeDisciplinary({ status: "concluded", days_to_resolution: 12, date_concluded: "2026-05-15" }),
      ];
      const result = run(cases);
      const positives = result.insights.filter((i) => i.severity === "positive");
      expect(positives.some((i) => i.text.includes("efficient disciplinary process"))).toBe(true);
    });

    it("does NOT generate efficiency positive when avg > 14 days", () => {
      const cases = [
        makeDisciplinary({ status: "concluded", days_to_resolution: 20, date_concluded: "2026-05-10" }),
      ];
      const result = run(cases);
      const effPositives = result.insights.filter((i) => i.text.includes("efficient disciplinary process"));
      expect(effPositives).toHaveLength(0);
    });

    it("generates positive insight when no open cases and some exist", () => {
      const cases = [
        makeDisciplinary({ status: "concluded", days_to_resolution: 10, date_concluded: "2026-05-10" }),
      ];
      const result = run(cases);
      const positives = result.insights.filter((i) => i.severity === "positive");
      expect(positives.some((i) => i.text.includes("clean disciplinary record"))).toBe(true);
    });

    it("does NOT generate clean record insight when open cases exist", () => {
      const cases = [
        makeDisciplinary({ status: "open" }),
        makeDisciplinary({ status: "concluded", days_to_resolution: 10, date_concluded: "2026-05-10" }),
      ];
      const result = run(cases);
      const cleanInsights = result.insights.filter((i) => i.text.includes("clean disciplinary record"));
      expect(cleanInsights).toHaveLength(0);
    });

    it("generates positive insight when all concluded cases have documented outcomes", () => {
      const cases = [
        makeDisciplinary({ status: "concluded", outcome: "verbal_warning", date_concluded: "2026-05-10", days_to_resolution: 10 }),
        makeDisciplinary({ status: "concluded", outcome: "no_action", date_concluded: "2026-05-15", days_to_resolution: 5 }),
      ];
      const result = run(cases);
      const positives = result.insights.filter((i) => i.severity === "positive");
      expect(positives.some((i) => i.text.includes("documented outcomes"))).toBe(true);
    });

    it("does NOT generate documented outcomes insight when concluded case has pending outcome", () => {
      const cases = [
        makeDisciplinary({ status: "concluded", outcome: "pending", date_concluded: "2026-05-10", days_to_resolution: 10 }),
      ];
      const result = run(cases);
      const docInsights = result.insights.filter((i) => i.text.includes("documented outcomes"));
      expect(docInsights).toHaveLength(0);
    });
  });

  // ── Edge Cases ──────────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("treats hearing_scheduled status as open", () => {
      const cases = [makeDisciplinary({ status: "hearing_scheduled" })];
      const result = run(cases);
      expect(result.overview.open_cases).toBe(1);
      expect(result.open_cases).toHaveLength(1);
    });

    it("treats appeal status as open", () => {
      const cases = [makeDisciplinary({ status: "appeal" })];
      const result = run(cases);
      expect(result.overview.open_cases).toBe(1);
      expect(result.open_cases).toHaveLength(1);
    });

    it("handles severity-based gross misconduct LADO alert (severity field)", () => {
      const cases = [
        makeDisciplinary({
          category: "conduct",
          severity: "gross_misconduct",
          status: "open",
          date_raised: "2026-05-10",
          lado_referral: false,
        }),
      ];
      const result = run(cases);
      const ladoAlerts = result.alerts.filter((a) => a.message.includes("LADO consideration"));
      expect(ladoAlerts.length).toBeGreaterThanOrEqual(1);
    });

    it("uses today parameter correctly when provided", () => {
      const cases = [makeDisciplinary({ date_raised: "2026-05-20", status: "open" })];
      const result = computeStaffDisciplinaryIntelligence({
        cases,
        staff: STAFF,
        today: "2026-05-22",
      });
      expect(result.open_cases[0].days_open).toBe(2);
    });

    it("handles zero days_to_resolution in concluded case", () => {
      const cases = [
        makeDisciplinary({ status: "concluded", days_to_resolution: 0, date_concluded: "2026-05-01" }),
      ];
      const result = run(cases);
      // 0 is not > 0 so excluded from avg
      expect(result.overview.avg_days_to_resolution).toBe(0);
    });

    it("correctly identifies cases at boundary of 90-day window", () => {
      // 90 days before 2026-05-25 is 2026-02-24
      const cases = [
        makeDisciplinary({ date_raised: "2026-02-24", status: "concluded", date_concluded: "2026-03-01", days_to_resolution: 5 }),
        makeDisciplinary({ date_raised: "2026-02-23", status: "concluded", date_concluded: "2026-03-01", days_to_resolution: 6 }),
      ];
      const result = run(cases);
      expect(result.overview.cases_last_90_days).toBe(1);
    });
  });

  // ── Oak House Full Dataset ──────────────────────────────────────────────

  describe("Oak House full dataset", () => {
    it("produces correct overview totals", () => {
      const result = run(oakHouseCases());
      expect(result.overview.total_cases).toBe(5);
      expect(result.overview.open_cases).toBe(2);
      expect(result.overview.concluded_cases).toBe(3);
    });

    it("calculates correct average days to resolution", () => {
      const result = run(oakHouseCases());
      // (12 + 8 + 5) / 3 = 8.33 -> rounded to 8
      expect(result.overview.avg_days_to_resolution).toBe(8);
    });

    it("counts LADO referrals correctly", () => {
      const result = run(oakHouseCases());
      expect(result.overview.lado_referrals).toBe(1);
    });

    it("has zero active suspensions (only concluded suspension)", () => {
      const result = run(oakHouseCases());
      expect(result.overview.suspensions_active).toBe(0);
    });

    it("identifies correct number of cases in last 90 days", () => {
      const result = run(oakHouseCases());
      // Cases raised: 2026-03-29, 2026-01-03, 2026-04-20, 2026-05-11, 2026-05-17
      // 90 days before 2026-05-25 = 2026-02-24
      // In range: 2026-03-29, 2026-04-20, 2026-05-11, 2026-05-17 = 4
      expect(result.overview.cases_last_90_days).toBe(4);
    });

    it("has correct support offered rate", () => {
      const result = run(oakHouseCases());
      // Formal cases: disc_oak_001 (has support), disc_oak_002 (has support), disc_oak_004 (has support), disc_oak_005 (has support)
      // 4 of 4 = 100%
      expect(result.overview.support_offered_rate).toBe(100);
    });

    it("shows correct category breakdown", () => {
      const result = run(oakHouseCases());
      expect(result.category_breakdown.length).toBeGreaterThanOrEqual(4);
      const conduct = result.category_breakdown.find((c) => c.category === "conduct");
      expect(conduct?.count).toBe(1);
      const gm = result.category_breakdown.find((c) => c.category === "gross_misconduct");
      expect(gm?.count).toBe(1);
    });

    it("lists correct open cases", () => {
      const result = run(oakHouseCases());
      expect(result.open_cases).toHaveLength(2);
      const edCase = result.open_cases.find((c) => c.case_id === "disc_oak_004");
      expect(edCase?.staff_name).toBe("Edward");
      expect(edCase?.days_open).toBe(14);
      expect(edCase?.category_label).toBe("Breach of Policy");
      const lkCase = result.open_cases.find((c) => c.case_id === "disc_oak_005");
      expect(lkCase?.staff_name).toBe("Lackson");
      expect(lkCase?.days_open).toBe(8);
    });

    it("shows correct outcome distribution", () => {
      const result = run(oakHouseCases());
      const pending = result.outcome_distribution.find((o) => o.outcome === "pending");
      expect(pending?.count).toBe(2);
      const verbal = result.outcome_distribution.find((o) => o.outcome === "verbal_warning");
      expect(verbal?.count).toBe(1);
      const dismissal = result.outcome_distribution.find((o) => o.outcome === "dismissal");
      expect(dismissal?.count).toBe(1);
    });

    it("generates high alert for Edward having 2 cases in 12 months", () => {
      const result = run(oakHouseCases());
      const highs = result.alerts.filter((a) => a.severity === "high");
      expect(highs.some((a) => a.message.includes("Edward"))).toBe(true);
    });

    it("generates positive insight for efficient resolution time", () => {
      const result = run(oakHouseCases());
      const positives = result.insights.filter((i) => i.severity === "positive");
      // avg = 8 days, which is <= 14
      expect(positives.some((i) => i.text.includes("efficient disciplinary process"))).toBe(true);
    });

    it("generates positive insight for all support measures documented", () => {
      const result = run(oakHouseCases());
      const positives = result.insights.filter((i) => i.severity === "positive");
      expect(positives.some((i) => i.text.includes("support measures documented"))).toBe(true);
    });

    it("generates positive insight for all concluded cases having documented outcomes", () => {
      const result = run(oakHouseCases());
      const positives = result.insights.filter((i) => i.severity === "positive");
      expect(positives.some((i) => i.text.includes("documented outcomes"))).toBe(true);
    });

    it("generates warning insight for investigator capacity (Darren has 2 open cases)", () => {
      const result = run(oakHouseCases());
      const warnings = result.insights.filter((i) => i.severity === "warning");
      expect(warnings.some((i) => i.text.includes("capacity concern"))).toBe(true);
    });
  });
});
