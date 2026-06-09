// ==============================================================================
// CORNERSTONE -- WHISTLEBLOWING INTELLIGENCE ENGINE TESTS
// Comprehensive test suite for whistleblowing disclosure analysis.
// Covers Reg 41 whistleblowing and Public Interest Disclosure Act 1998 (PIDA).
// ==============================================================================

import { describe, it, expect } from "vitest";
import {
  computeWhistleblowingIntelligence,
  type WhistleblowingInput,
  type StaffRef,
} from "../whistleblowing-intelligence-engine";

const TODAY = "2026-05-25";

// -- Factories ----------------------------------------------------------------

const STAFF: StaffRef[] = [
  { id: "staff_darren", name: "Darren" },
  { id: "staff_anna", name: "Anna" },
  { id: "staff_ryan", name: "Ryan" },
  { id: "staff_jpeters", name: "J. Peters" },
];

let _id = 0;
function makeReport(overrides: Partial<WhistleblowingInput> = {}): WhistleblowingInput {
  _id++;
  return {
    id: `wb_test_${_id}`,
    reference: `WB-TEST-${_id}`,
    date_raised: "2026-04-20",
    anonymous: false,
    category: "safeguarding",
    severity: "medium",
    status: "resolved",
    assigned_to: "staff_darren",
    external_referral: null,
    outcome: "substantiated",
    lessons_learned: "Lesson recorded for this case",
    protection_measures: ["Whistleblower anonymity maintained"],
    date_closed: "2026-05-05",
    ...overrides,
  };
}

function run(reports: WhistleblowingInput[], opts?: { staff?: StaffRef[] }) {
  return computeWhistleblowingIntelligence({
    reports,
    staff: opts?.staff ?? STAFF,
    today: TODAY,
  });
}

// -- Chamberlain House Dataset --------------------------------------------------------

function oakHouseReports(): WhistleblowingInput[] {
  return [
    makeReport({
      id: "wb_001",
      reference: "WB-001",
      date_raised: "2026-03-26",
      anonymous: false,
      category: "safeguarding",
      severity: "high",
      status: "resolved",
      assigned_to: "staff_darren",
      external_referral: "LADO",
      outcome: "substantiated",
      lessons_learned: "Safeguarding training refreshed for all staff",
      protection_measures: ["Whistleblower reassigned shifts", "Regular welfare checks"],
      date_closed: "2026-04-13",
    }),
    makeReport({
      id: "wb_002",
      reference: "WB-002",
      date_raised: "2026-05-10",
      anonymous: false,
      category: "malpractice",
      severity: "medium",
      status: "investigating",
      assigned_to: "staff_jpeters",
      external_referral: null,
      outcome: "",
      lessons_learned: "",
      protection_measures: ["Confidentiality agreement signed"],
      date_closed: null,
    }),
    makeReport({
      id: "wb_003",
      reference: "WB-003",
      date_raised: "2026-02-24",
      anonymous: false,
      category: "health_safety",
      severity: "low",
      status: "resolved",
      assigned_to: "staff_anna",
      external_referral: null,
      outcome: "substantiated",
      lessons_learned: "H&S audit schedule increased to monthly",
      protection_measures: ["Shift pattern adjusted"],
      date_closed: "2026-03-11",
    }),
    makeReport({
      id: "wb_004",
      reference: "WB-004",
      date_raised: "2026-04-10",
      anonymous: true,
      category: "policy_breach",
      severity: "medium",
      status: "closed_no_action",
      assigned_to: "staff_ryan",
      external_referral: null,
      outcome: "unsubstantiated",
      lessons_learned: "No evidence to support claim",
      protection_measures: [],
      date_closed: "2026-04-17",
    }),
  ];
}

// -- Tests --------------------------------------------------------------------

describe("Whistleblowing Intelligence Engine", () => {

  describe("empty state", () => {
    it("returns safe defaults when no reports provided", () => {
      const result = run([]);
      expect(result.overview.total_reports).toBe(0);
      expect(result.overview.open_reports).toBe(0);
      expect(result.overview.resolved_reports).toBe(0);
      expect(result.overview.avg_resolution_days).toBe(0);
      expect(result.overview.external_referral_count).toBe(0);
      expect(result.overview.anonymous_count).toBe(0);
      expect(result.overview.protection_measures_rate).toBe(0);
      expect(result.overview.lessons_recorded_rate).toBe(0);
      expect(result.category_breakdown).toHaveLength(0);
      expect(result.open_cases).toHaveLength(0);
      expect(result.alerts).toHaveLength(0);
      expect(result.insights).toHaveLength(0);
    });
  });

  describe("overview metrics", () => {
    it("counts total reports", () => {
      const result = run(oakHouseReports());
      expect(result.overview.total_reports).toBe(4);
    });

    it("counts open reports (received + investigating + escalated)", () => {
      const result = run(oakHouseReports());
      // wb_002 is investigating
      expect(result.overview.open_reports).toBe(1);
    });

    it("counts resolved reports (resolved + closed_no_action)", () => {
      const result = run(oakHouseReports());
      // wb_001 resolved, wb_003 resolved, wb_004 closed_no_action
      expect(result.overview.resolved_reports).toBe(3);
    });

    it("calculates average resolution days for closed cases", () => {
      const result = run(oakHouseReports());
      // wb_001: 2026-03-26 to 2026-04-13 = 18 days
      // wb_003: 2026-02-24 to 2026-03-11 = 15 days
      // wb_004: 2026-04-10 to 2026-04-17 = 7 days
      // avg = (18 + 15 + 7) / 3 = 13.33 -> 13
      expect(result.overview.avg_resolution_days).toBe(13);
    });

    it("counts external referrals", () => {
      const result = run(oakHouseReports());
      // wb_001 has LADO referral
      expect(result.overview.external_referral_count).toBe(1);
    });

    it("counts anonymous reports", () => {
      const result = run(oakHouseReports());
      // wb_004 is anonymous
      expect(result.overview.anonymous_count).toBe(1);
    });

    it("calculates protection measures rate", () => {
      const result = run(oakHouseReports());
      // wb_001: yes, wb_002: yes, wb_003: yes, wb_004: no = 3/4 = 75%
      expect(result.overview.protection_measures_rate).toBe(75);
    });

    it("calculates lessons recorded rate", () => {
      const result = run(oakHouseReports());
      // wb_001: yes, wb_002: no (empty), wb_003: yes, wb_004: yes = 3/4 = 75%
      expect(result.overview.lessons_recorded_rate).toBe(75);
    });

    it("handles 0 avg resolution days when no cases have date_closed", () => {
      const reports = [
        makeReport({ status: "investigating", date_closed: null }),
      ];
      const result = run(reports);
      expect(result.overview.avg_resolution_days).toBe(0);
    });

    it("excludes empty-string external referrals from count", () => {
      const reports = [
        makeReport({ external_referral: "" }),
        makeReport({ external_referral: "   " }),
        makeReport({ external_referral: "LADO" }),
      ];
      const result = run(reports);
      expect(result.overview.external_referral_count).toBe(1);
    });
  });

  describe("category breakdown", () => {
    it("groups reports by category with counts", () => {
      const result = run(oakHouseReports());
      expect(result.category_breakdown.length).toBeGreaterThan(0);
      const safeguarding = result.category_breakdown.find((c) => c.category === "safeguarding");
      expect(safeguarding).toBeDefined();
      expect(safeguarding!.count).toBe(1);
    });

    it("tracks open count per category", () => {
      const result = run(oakHouseReports());
      const malpractice = result.category_breakdown.find((c) => c.category === "malpractice");
      expect(malpractice).toBeDefined();
      expect(malpractice!.open_count).toBe(1);
    });

    it("sorts by count descending", () => {
      const reports = [
        makeReport({ category: "bullying" }),
        makeReport({ category: "safeguarding" }),
        makeReport({ category: "safeguarding" }),
        makeReport({ category: "safeguarding" }),
      ];
      const result = run(reports);
      expect(result.category_breakdown[0].category).toBe("safeguarding");
      expect(result.category_breakdown[1].category).toBe("bullying");
    });

    it("applies correct category labels", () => {
      const reports = [
        makeReport({ category: "health_safety" }),
        makeReport({ category: "data_breach" }),
        makeReport({ category: "policy_breach" }),
      ];
      const result = run(reports);
      const hs = result.category_breakdown.find((c) => c.category === "health_safety");
      expect(hs!.category_label).toBe("Health & Safety");
      const db = result.category_breakdown.find((c) => c.category === "data_breach");
      expect(db!.category_label).toBe("Data Breach");
      const pb = result.category_breakdown.find((c) => c.category === "policy_breach");
      expect(pb!.category_label).toBe("Policy Breach");
    });

    it("falls back to title-case for unknown categories", () => {
      const reports = [makeReport({ category: "custom_concern" })];
      const result = run(reports);
      expect(result.category_breakdown[0].category_label).toBe("Custom Concern");
    });

    it("includes all unique categories from Chamberlain House data", () => {
      const result = run(oakHouseReports());
      const categories = result.category_breakdown.map((c) => c.category);
      expect(categories).toContain("safeguarding");
      expect(categories).toContain("malpractice");
      expect(categories).toContain("health_safety");
      expect(categories).toContain("policy_breach");
    });
  });

  describe("open cases", () => {
    it("lists only open cases (received, investigating, escalated)", () => {
      const result = run(oakHouseReports());
      expect(result.open_cases).toHaveLength(1);
      expect(result.open_cases[0].case_id).toBe("wb_002");
    });

    it("calculates days_open correctly", () => {
      const result = run(oakHouseReports());
      // wb_002: 2026-05-10 to 2026-05-25 = 15 days
      expect(result.open_cases[0].days_open).toBe(15);
    });

    it("sorts by days_open descending", () => {
      const reports = [
        makeReport({ id: "a", reference: "WB-A", status: "received", date_raised: "2026-05-20" }),
        makeReport({ id: "b", reference: "WB-B", status: "investigating", date_raised: "2026-05-01" }),
        makeReport({ id: "c", reference: "WB-C", status: "escalated", date_raised: "2026-05-15" }),
      ];
      const result = run(reports);
      expect(result.open_cases[0].case_id).toBe("b"); // 24 days
      expect(result.open_cases[1].case_id).toBe("c"); // 10 days
      expect(result.open_cases[2].case_id).toBe("a"); // 5 days
    });

    it("includes category label, severity, status, and assigned_to", () => {
      const result = run(oakHouseReports());
      const wb002 = result.open_cases[0];
      expect(wb002.category_label).toBe("Malpractice");
      expect(wb002.severity).toBe("medium");
      expect(wb002.status).toBe("investigating");
      expect(wb002.assigned_to).toBe("staff_jpeters");
    });

    it("includes all three open statuses", () => {
      const reports = [
        makeReport({ id: "r", reference: "WB-R", status: "received", date_raised: "2026-05-20" }),
        makeReport({ id: "i", reference: "WB-I", status: "investigating", date_raised: "2026-05-20" }),
        makeReport({ id: "e", reference: "WB-E", status: "escalated", date_raised: "2026-05-20" }),
        makeReport({ id: "x", reference: "WB-X", status: "resolved", date_raised: "2026-05-20" }),
        makeReport({ id: "c", reference: "WB-C", status: "closed_no_action", date_raised: "2026-05-20" }),
      ];
      const result = run(reports);
      expect(result.open_cases).toHaveLength(3);
      const ids = result.open_cases.map((c) => c.case_id);
      expect(ids).toContain("r");
      expect(ids).toContain("i");
      expect(ids).toContain("e");
    });
  });

  describe("alerts", () => {
    it("generates critical alert for open case with critical severity", () => {
      const reports = [
        makeReport({
          reference: "WB-CRIT",
          status: "investigating",
          severity: "critical",
          date_raised: "2026-05-20",
        }),
      ];
      const result = run(reports);
      const critical = result.alerts.filter((a) => a.severity === "critical");
      expect(critical).toHaveLength(1);
      expect(critical[0].message).toContain("WB-CRIT");
      expect(critical[0].message).toContain("5 days");
    });

    it("generates high alert for open case > 30 days", () => {
      const reports = [
        makeReport({
          reference: "WB-OLD",
          status: "received",
          date_raised: "2026-04-10",
        }),
      ];
      const result = run(reports);
      const high = result.alerts.filter((a) => a.severity === "high");
      expect(high.some((a) => a.message.includes("WB-OLD") && a.message.includes("45 days") && a.message.includes("exceeds investigation timeline"))).toBe(true);
    });

    it("generates high alert for high-severity case with no external referral", () => {
      const reports = [
        makeReport({
          reference: "WB-NOREF",
          severity: "high",
          external_referral: null,
        }),
      ];
      const result = run(reports);
      const high = result.alerts.filter((a) => a.severity === "high");
      expect(high.some((a) => a.message.includes("WB-NOREF") && a.message.includes("no external referral"))).toBe(true);
    });

    it("generates high alert for critical-severity case with no external referral", () => {
      const reports = [
        makeReport({
          reference: "WB-CRITNOREF",
          severity: "critical",
          status: "resolved",
          external_referral: null,
        }),
      ];
      const result = run(reports);
      const high = result.alerts.filter((a) => a.severity === "high");
      expect(high.some((a) => a.message.includes("WB-CRITNOREF") && a.message.includes("Ofsted/LADO"))).toBe(true);
    });

    it("generates medium alert for protection measures rate < 80%", () => {
      const reports = [
        makeReport({ protection_measures: ["Measure 1"] }),
        makeReport({ protection_measures: ["Measure 2"] }),
        makeReport({ protection_measures: [] }),
        makeReport({ protection_measures: [] }),
      ];
      const result = run(reports);
      const medium = result.alerts.filter((a) => a.severity === "medium");
      expect(medium.some((a) => a.message.includes("Protection measures") && a.message.includes("50%"))).toBe(true);
    });

    it("generates medium alert for investigating case > 14 days", () => {
      const reports = [
        makeReport({
          reference: "WB-LONG",
          status: "investigating",
          date_raised: "2026-05-01",
        }),
      ];
      const result = run(reports);
      const medium = result.alerts.filter((a) => a.severity === "medium");
      expect(medium.some((a) => a.message.includes("WB-LONG") && a.message.includes("24 days") && a.message.includes("update stakeholders"))).toBe(true);
    });

    it("does not generate medium investigation alert for received or escalated status", () => {
      const reports = [
        makeReport({
          reference: "WB-REC",
          status: "received",
          date_raised: "2026-05-01",
        }),
        makeReport({
          reference: "WB-ESC",
          status: "escalated",
          date_raised: "2026-05-01",
        }),
      ];
      const result = run(reports);
      const medium = result.alerts.filter((a) => a.severity === "medium" && a.message.includes("update stakeholders"));
      expect(medium).toHaveLength(0);
    });

    it("generates low alert for resolved case without lessons learned", () => {
      const reports = [
        makeReport({
          reference: "WB-NOLESSONS",
          status: "resolved",
          lessons_learned: "",
        }),
      ];
      const result = run(reports);
      const low = result.alerts.filter((a) => a.severity === "low");
      expect(low.some((a) => a.message.includes("WB-NOLESSONS") && a.message.includes("no lessons learned"))).toBe(true);
    });

    it("sorts alerts by severity (critical first, low last)", () => {
      const reports = [
        makeReport({ reference: "WB-C", status: "investigating", severity: "critical", date_raised: "2026-05-20" }),
        makeReport({ reference: "WB-L", status: "resolved", lessons_learned: "" }),
        makeReport({ reference: "WB-H", status: "received", date_raised: "2026-04-01" }),
      ];
      const result = run(reports);
      if (result.alerts.length >= 2) {
        const severities = result.alerts.map((a) => a.severity);
        const order = { critical: 0, high: 1, medium: 2, low: 3 };
        for (let i = 1; i < severities.length; i++) {
          expect(order[severities[i]]).toBeGreaterThanOrEqual(order[severities[i - 1]]);
        }
      }
    });

    it("does not generate high alert for open case <= 30 days", () => {
      const reports = [
        makeReport({
          reference: "WB-OK",
          status: "investigating",
          severity: "medium",
          date_raised: "2026-05-10",
        }),
      ];
      const result = run(reports);
      const high = result.alerts.filter((a) => a.severity === "high" && a.message.includes("exceeds investigation timeline"));
      expect(high).toHaveLength(0);
    });

    it("does not generate high alert for high-severity case with external referral", () => {
      const reports = [
        makeReport({
          reference: "WB-REF",
          severity: "high",
          external_referral: "LADO",
        }),
      ];
      const result = run(reports);
      const noRefAlerts = result.alerts.filter((a) => a.message.includes("no external referral") && a.message.includes("WB-REF"));
      expect(noRefAlerts).toHaveLength(0);
    });
  });

  describe("insights", () => {
    it("generates critical insight for critical severity open case", () => {
      const reports = [
        makeReport({
          reference: "WB-CRIT",
          status: "escalated",
          severity: "critical",
          date_raised: "2026-05-15",
        }),
      ];
      const result = run(reports);
      const critical = result.insights.filter((i) => i.severity === "critical");
      expect(critical.some((i) => i.text.includes("WB-CRIT") && i.text.includes("immediate management attention"))).toBe(true);
    });

    it("generates warning insight for long investigation (> 30 days)", () => {
      const reports = [
        makeReport({
          reference: "WB-LONG",
          status: "investigating",
          date_raised: "2026-04-10",
        }),
      ];
      const result = run(reports);
      const warnings = result.insights.filter((i) => i.severity === "warning");
      expect(warnings.some((i) => i.text.includes("WB-LONG") && i.text.includes("whistleblower confidence"))).toBe(true);
    });

    it("generates warning insight for serious cases without external referral", () => {
      const reports = [
        makeReport({ severity: "high", external_referral: null }),
        makeReport({ severity: "critical", external_referral: null }),
      ];
      const result = run(reports);
      const warnings = result.insights.filter((i) => i.severity === "warning");
      expect(warnings.some((i) => i.text.includes("2 high/critical cases") && i.text.includes("external referral"))).toBe(true);
    });

    it("generates warning insight for low protection rate", () => {
      const reports = [
        makeReport({ protection_measures: ["Measure"] }),
        makeReport({ protection_measures: [] }),
        makeReport({ protection_measures: [] }),
      ];
      const result = run(reports);
      const warnings = result.insights.filter((i) => i.severity === "warning");
      expect(warnings.some((i) => i.text.includes("PIDA") && i.text.includes("33%"))).toBe(true);
    });

    it("generates positive insight when all cases resolved", () => {
      const reports = [
        makeReport({ status: "resolved" }),
        makeReport({ status: "closed_no_action" }),
      ];
      const result = run(reports);
      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.some((i) => i.text.includes("All whistleblowing disclosures have been resolved"))).toBe(true);
    });

    it("generates positive insight when all resolved have lessons learned", () => {
      const reports = [
        makeReport({ status: "resolved", lessons_learned: "Lesson 1" }),
        makeReport({ status: "closed_no_action", lessons_learned: "Lesson 2" }),
      ];
      const result = run(reports);
      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.some((i) => i.text.includes("lessons learned recorded"))).toBe(true);
    });

    it("generates positive insight for strong protection measures rate (>= 80%)", () => {
      const reports = [
        makeReport({ protection_measures: ["M1"] }),
        makeReport({ protection_measures: ["M2"] }),
        makeReport({ protection_measures: ["M3"] }),
        makeReport({ protection_measures: ["M4"] }),
        makeReport({ protection_measures: [] }),
      ];
      const result = run(reports);
      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.some((i) => i.text.includes("80%") && i.text.includes("PIDA compliance"))).toBe(true);
    });

    it("generates positive insight for 100% protection (no detriment)", () => {
      const reports = [
        makeReport({ protection_measures: ["M1"] }),
        makeReport({ protection_measures: ["M2"] }),
      ];
      const result = run(reports);
      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.some((i) => i.text.includes("no detriment culture"))).toBe(true);
    });

    it("generates positive insight for timely resolution (<= 30 days)", () => {
      const reports = [
        makeReport({ status: "resolved", date_raised: "2026-05-01", date_closed: "2026-05-15" }),
        makeReport({ status: "closed_no_action", date_raised: "2026-04-30", date_closed: "2026-05-10" }),
      ];
      const result = run(reports);
      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.some((i) => i.text.includes("within 30 days"))).toBe(true);
    });

    it("does not generate positive resolved insight when open cases exist", () => {
      const reports = [
        makeReport({ status: "resolved" }),
        makeReport({ status: "investigating" }),
      ];
      const result = run(reports);
      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.some((i) => i.text.includes("All whistleblowing disclosures have been resolved"))).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("handles single report", () => {
      const reports = [makeReport()];
      const result = run(reports);
      expect(result.overview.total_reports).toBe(1);
      expect(result.category_breakdown).toHaveLength(1);
    });

    it("handles all open reports", () => {
      const reports = [
        makeReport({ status: "received", date_raised: "2026-05-20" }),
        makeReport({ status: "investigating", date_raised: "2026-05-18" }),
        makeReport({ status: "escalated", date_raised: "2026-05-15" }),
      ];
      const result = run(reports);
      expect(result.overview.open_reports).toBe(3);
      expect(result.overview.resolved_reports).toBe(0);
      expect(result.overview.avg_resolution_days).toBe(0);
      expect(result.open_cases).toHaveLength(3);
    });

    it("handles all anonymous reports", () => {
      const reports = [
        makeReport({ anonymous: true }),
        makeReport({ anonymous: true }),
      ];
      const result = run(reports);
      expect(result.overview.anonymous_count).toBe(2);
    });

    it("handles 0% protection measures rate", () => {
      const reports = [
        makeReport({ protection_measures: [] }),
        makeReport({ protection_measures: [] }),
      ];
      const result = run(reports);
      expect(result.overview.protection_measures_rate).toBe(0);
    });
  });

  describe("Chamberlain House integration", () => {
    it("produces correct overview for full Chamberlain House dataset", () => {
      const result = run(oakHouseReports());
      expect(result.overview.total_reports).toBe(4);
      expect(result.overview.open_reports).toBe(1);
      expect(result.overview.resolved_reports).toBe(3);
      expect(result.overview.external_referral_count).toBe(1);
      expect(result.overview.anonymous_count).toBe(1);
    });

    it("produces 4 unique categories in breakdown", () => {
      const result = run(oakHouseReports());
      expect(result.category_breakdown).toHaveLength(4);
    });

    it("tracks open count correctly in category breakdown", () => {
      const result = run(oakHouseReports());
      const malpractice = result.category_breakdown.find((c) => c.category === "malpractice");
      expect(malpractice!.open_count).toBe(1);
      const safeguarding = result.category_breakdown.find((c) => c.category === "safeguarding");
      expect(safeguarding!.open_count).toBe(0);
    });

    it("lists one open case (wb_002)", () => {
      const result = run(oakHouseReports());
      expect(result.open_cases).toHaveLength(1);
      expect(result.open_cases[0].reference).toBe("WB-002");
      expect(result.open_cases[0].days_open).toBe(15);
    });

    it("generates alerts for Chamberlain House data", () => {
      const result = run(oakHouseReports());
      // wb_002 is investigating 15 days -> medium alert (> 14 days)
      // protection_measures_rate = 75% < 80% -> medium alert
      // wb_004 resolved no lessons -> nope, it has "No evidence to support claim"
      // wb_002 has no lessons -> no alert, only resolved cases checked
      // wb_003 has no external referral but severity low -> no alert
      const medium = result.alerts.filter((a) => a.severity === "medium");
      expect(medium.some((a) => a.message.includes("WB-002") && a.message.includes("update stakeholders"))).toBe(true);
      expect(medium.some((a) => a.message.includes("Protection measures") && a.message.includes("75%"))).toBe(true);
    });

    it("generates insights for Chamberlain House data", () => {
      const result = run(oakHouseReports());
      expect(result.insights.length).toBeGreaterThan(0);
      // Should have warning for protection < 80% and warning for high-severity without referral (wb_001 has LADO but severity high)
      // wb_001 has external_referral LADO, so no warning for that one
    });
  });
});
