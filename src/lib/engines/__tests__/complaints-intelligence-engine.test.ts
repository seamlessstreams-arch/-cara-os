// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — COMPLAINTS & NOTIFICATIONS INTELLIGENCE ENGINE TESTS
// Comprehensive test suite for complaints handling analysis.
// Covers Reg 39 complaints procedure and Reg 40 notification compliance.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeComplaintsIntelligence,
  type ComplaintInput,
  type ChildRef,
  type StaffRef,
} from "../complaints-intelligence-engine";

const TODAY = "2026-05-25";

// ── Factories ───────────────────────────────────────────────────────────────

const CHILDREN: ChildRef[] = [
  { id: "yp_alex", name: "Alex" },
  { id: "yp_jordan", name: "Jordan" },
  { id: "yp_casey", name: "Casey" },
];

const STAFF: StaffRef[] = [
  { id: "staff_ryan", name: "Ryan" },
  { id: "staff_edward", name: "Edward" },
  { id: "staff_anna", name: "Anna" },
  { id: "staff_darren", name: "Darren" },
  { id: "staff_chervelle", name: "Chervelle" },
];

let _id = 0;
function makeComplaint(overrides: Partial<ComplaintInput> = {}): ComplaintInput {
  _id++;
  return {
    id: `cmp_test_${_id}`,
    complaint_date: "2026-05-10",
    complainant: "Test Complainant",
    source: "child",
    theme: "care_quality",
    outcome: "upheld",
    investigated_by: "staff_darren",
    date_resolved: "2026-05-17",
    response_time_days: 7,
    child_id: "yp_alex",
    summary: "Test complaint summary",
    lessons_learned: "Lessons recorded for this complaint",
    practice_changes: ["Adjusted procedure"],
    complainant_satisfied: true,
    escalated: false,
    ofsted_notified: false,
    ...overrides,
  };
}

function run(complaints: ComplaintInput[], opts?: { children?: ChildRef[]; staff?: StaffRef[] }) {
  return computeComplaintsIntelligence({
    complaints,
    children: opts?.children ?? CHILDREN,
    staff: opts?.staff ?? STAFF,
    today: TODAY,
  });
}

// ── Chamberlain House Dataset ───────────────────────────────────────────────────────

function oakHouseComplaints(): ComplaintInput[] {
  return [
    makeComplaint({
      id: "cmp_001",
      complaint_date: "2026-05-05",
      complainant: "Alex",
      source: "child",
      theme: "care_quality",
      outcome: "upheld",
      response_time_days: 5,
      date_resolved: "2026-05-10",
      child_id: "yp_alex",
      summary: "Felt unheard during key-work session",
      lessons_learned: "Ensure active listening techniques used consistently",
      practice_changes: ["Active listening training booked"],
      complainant_satisfied: true,
      escalated: false,
      ofsted_notified: false,
    }),
    makeComplaint({
      id: "cmp_002",
      complaint_date: "2026-05-06",
      complainant: "Mrs Thompson",
      source: "parent_carer",
      theme: "staff_conduct",
      outcome: "partially_upheld",
      response_time_days: 12,
      date_resolved: "2026-05-18",
      child_id: "yp_alex",
      summary: "Staff member was dismissive during contact call",
      lessons_learned: "Reviewed contact call protocol with team",
      practice_changes: ["Updated contact call guidance"],
      complainant_satisfied: true,
      escalated: false,
      ofsted_notified: false,
    }),
    makeComplaint({
      id: "cmp_003",
      complaint_date: "2026-05-07",
      complainant: "Sarah Jones (SW)",
      source: "social_worker",
      theme: "communication",
      outcome: "not_upheld",
      response_time_days: 8,
      date_resolved: "2026-05-15",
      child_id: "yp_jordan",
      summary: "Placement plan not shared in timely manner",
      lessons_learned: "Reviewed document sharing timelines",
      practice_changes: [],
      complainant_satisfied: false,
      escalated: false,
      ofsted_notified: false,
    }),
    makeComplaint({
      id: "cmp_004",
      complaint_date: "2026-05-05",
      complainant: "Jordan",
      source: "child",
      theme: "food",
      outcome: "ongoing",
      response_time_days: 0,
      date_resolved: null,
      child_id: "yp_jordan",
      summary: "Food options are repetitive and boring",
      lessons_learned: "",
      practice_changes: [],
      complainant_satisfied: null,
      escalated: false,
      ofsted_notified: false,
    }),
    makeComplaint({
      id: "cmp_005",
      complaint_date: "2026-05-17",
      complainant: "Edward (Staff)",
      source: "staff",
      theme: "environment",
      outcome: "upheld",
      response_time_days: 3,
      date_resolved: "2026-05-20",
      child_id: null,
      summary: "Garden equipment not maintained safely",
      lessons_learned: "Maintenance schedule reviewed and updated",
      practice_changes: ["Weekly garden equipment check added"],
      complainant_satisfied: true,
      escalated: false,
      ofsted_notified: false,
    }),
    makeComplaint({
      id: "cmp_006",
      complaint_date: "2026-05-12",
      complainant: "Anonymous",
      source: "anonymous",
      theme: "privacy",
      outcome: "withdrawn",
      response_time_days: 0,
      date_resolved: null,
      child_id: null,
      summary: "Concern about bedroom door locks",
      lessons_learned: "",
      practice_changes: [],
      complainant_satisfied: null,
      escalated: false,
      ofsted_notified: false,
    }),
    makeComplaint({
      id: "cmp_007",
      complaint_date: "2026-05-20",
      complainant: "Casey",
      source: "child",
      theme: "activities",
      outcome: "ongoing",
      response_time_days: 0,
      date_resolved: null,
      child_id: "yp_casey",
      summary: "Not enough weekend activities available",
      lessons_learned: "",
      practice_changes: [],
      complainant_satisfied: null,
      escalated: false,
      ofsted_notified: false,
    }),
    makeComplaint({
      id: "cmp_008",
      complaint_date: "2026-05-07",
      complainant: "Dr Patel",
      source: "professional",
      theme: "medication",
      outcome: "upheld",
      response_time_days: 15,
      date_resolved: "2026-05-22",
      child_id: "yp_casey",
      summary: "Medication administration timing inconsistent",
      lessons_learned: "MAR chart review completed, timings clarified",
      practice_changes: ["MAR timing alerts added", "Staff med training refresher"],
      complainant_satisfied: false,
      escalated: true,
      ofsted_notified: true,
    }),
  ];
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Complaints Intelligence Engine", () => {

  describe("empty state", () => {
    it("returns safe defaults when no complaints provided", () => {
      const result = run([]);
      expect(result.overview.total_complaints).toBe(0);
      expect(result.overview.open_count).toBe(0);
      expect(result.overview.resolved_count).toBe(0);
      expect(result.overview.upheld_rate).toBe(0);
      expect(result.overview.avg_response_days).toBe(0);
      expect(result.overview.satisfaction_rate).toBe(0);
      expect(result.overview.escalated_count).toBe(0);
      expect(result.overview.ofsted_notified_count).toBe(0);
      expect(result.overview.child_complaints).toBe(0);
      expect(result.overview.lessons_recorded_rate).toBe(0);
      expect(result.open_complaints).toHaveLength(0);
      expect(result.theme_breakdown).toHaveLength(0);
      expect(result.source_breakdown).toHaveLength(0);
      expect(result.alerts).toHaveLength(0);
      expect(result.insights).toHaveLength(0);
    });
  });

  describe("overview metrics", () => {
    it("counts total complaints", () => {
      const result = run(oakHouseComplaints());
      expect(result.overview.total_complaints).toBe(8);
    });

    it("counts open complaints (outcome === ongoing)", () => {
      const result = run(oakHouseComplaints());
      expect(result.overview.open_count).toBe(2);
    });

    it("counts resolved complaints (not ongoing, not withdrawn)", () => {
      const result = run(oakHouseComplaints());
      expect(result.overview.resolved_count).toBe(5);
    });

    it("calculates upheld rate from resolved complaints", () => {
      const result = run(oakHouseComplaints());
      // upheld: cmp_001, cmp_005, cmp_008 = 3; partially_upheld: cmp_002 = 1; total upheld-ish = 4; resolved = 5
      expect(result.overview.upheld_rate).toBe(80);
    });

    it("calculates average response days for resolved complaints", () => {
      const result = run(oakHouseComplaints());
      // resolved with time > 0: 5, 12, 8, 3, 15 = 43 / 5 = 8.6 -> 9
      expect(result.overview.avg_response_days).toBe(9);
    });

    it("calculates satisfaction rate excluding null values", () => {
      const result = run(oakHouseComplaints());
      // satisfied: cmp_001, cmp_002, cmp_005 = 3; not satisfied: cmp_003, cmp_008 = 2; total = 5
      expect(result.overview.satisfaction_rate).toBe(60);
    });

    it("counts escalated complaints", () => {
      const result = run(oakHouseComplaints());
      expect(result.overview.escalated_count).toBe(1);
    });

    it("counts Ofsted notified complaints", () => {
      const result = run(oakHouseComplaints());
      expect(result.overview.ofsted_notified_count).toBe(1);
    });

    it("counts child complaints (source === child)", () => {
      const result = run(oakHouseComplaints());
      expect(result.overview.child_complaints).toBe(3);
    });

    it("calculates lessons recorded rate", () => {
      const result = run(oakHouseComplaints());
      // lessons recorded: cmp_001, cmp_002, cmp_003, cmp_005, cmp_008 = 5 of 8 = 63%
      expect(result.overview.lessons_recorded_rate).toBe(63);
    });

    it("handles 100% upheld rate", () => {
      const complaints = [
        makeComplaint({ outcome: "upheld" }),
        makeComplaint({ outcome: "partially_upheld" }),
      ];
      const result = run(complaints);
      expect(result.overview.upheld_rate).toBe(100);
    });

    it("handles 0% upheld rate", () => {
      const complaints = [
        makeComplaint({ outcome: "not_upheld" }),
        makeComplaint({ outcome: "inconclusive" }),
      ];
      const result = run(complaints);
      expect(result.overview.upheld_rate).toBe(0);
    });
  });

  describe("open complaints", () => {
    it("lists ongoing complaints only", () => {
      const result = run(oakHouseComplaints());
      expect(result.open_complaints).toHaveLength(2);
      expect(result.open_complaints.every((c) => c.complaint_id === "cmp_004" || c.complaint_id === "cmp_007")).toBe(true);
    });

    it("sorts by days_open descending", () => {
      const result = run(oakHouseComplaints());
      expect(result.open_complaints[0].complaint_id).toBe("cmp_004");
      expect(result.open_complaints[1].complaint_id).toBe("cmp_007");
    });

    it("calculates days_open correctly", () => {
      const result = run(oakHouseComplaints());
      // cmp_004: 2026-05-05 to 2026-05-25 = 20 days
      expect(result.open_complaints[0].days_open).toBe(20);
      // cmp_007: 2026-05-20 to 2026-05-25 = 5 days
      expect(result.open_complaints[1].days_open).toBe(5);
    });

    it("includes complainant, source, theme, and summary", () => {
      const result = run(oakHouseComplaints());
      const first = result.open_complaints[0];
      expect(first.complainant).toBe("Jordan");
      expect(first.source).toBe("child");
      expect(first.theme).toBe("food");
      expect(first.summary).toBe("Food options are repetitive and boring");
    });
  });

  describe("theme breakdown", () => {
    it("groups complaints by theme with counts", () => {
      const result = run(oakHouseComplaints());
      expect(result.theme_breakdown.length).toBeGreaterThan(0);
      const careQuality = result.theme_breakdown.find((t) => t.theme === "care_quality");
      expect(careQuality).toBeDefined();
      expect(careQuality!.count).toBe(1);
    });

    it("calculates percentages correctly", () => {
      const complaints = [
        makeComplaint({ theme: "food" }),
        makeComplaint({ theme: "food" }),
        makeComplaint({ theme: "food" }),
        makeComplaint({ theme: "environment" }),
      ];
      const result = run(complaints);
      const food = result.theme_breakdown.find((t) => t.theme === "food");
      expect(food!.percentage).toBe(75);
      const env = result.theme_breakdown.find((t) => t.theme === "environment");
      expect(env!.percentage).toBe(25);
    });

    it("sorts by count descending", () => {
      const complaints = [
        makeComplaint({ theme: "environment" }),
        makeComplaint({ theme: "food" }),
        makeComplaint({ theme: "food" }),
        makeComplaint({ theme: "food" }),
      ];
      const result = run(complaints);
      expect(result.theme_breakdown[0].theme).toBe("food");
      expect(result.theme_breakdown[1].theme).toBe("environment");
    });

    it("applies correct theme labels", () => {
      const complaints = [
        makeComplaint({ theme: "care_quality" }),
        makeComplaint({ theme: "staff_conduct" }),
        makeComplaint({ theme: "parent_carer" }),
      ];
      const result = run(complaints);
      const cq = result.theme_breakdown.find((t) => t.theme === "care_quality");
      expect(cq!.theme_label).toBe("Care Quality");
      const sc = result.theme_breakdown.find((t) => t.theme === "staff_conduct");
      expect(sc!.theme_label).toBe("Staff Conduct");
    });

    it("includes all unique themes from Chamberlain House data", () => {
      const result = run(oakHouseComplaints());
      const themes = result.theme_breakdown.map((t) => t.theme);
      expect(themes).toContain("care_quality");
      expect(themes).toContain("staff_conduct");
      expect(themes).toContain("communication");
      expect(themes).toContain("food");
      expect(themes).toContain("environment");
      expect(themes).toContain("privacy");
      expect(themes).toContain("activities");
      expect(themes).toContain("medication");
    });
  });

  describe("source breakdown", () => {
    it("groups complaints by source with counts", () => {
      const result = run(oakHouseComplaints());
      const child = result.source_breakdown.find((s) => s.source === "child");
      expect(child).toBeDefined();
      expect(child!.count).toBe(3);
    });

    it("calculates percentages correctly", () => {
      const complaints = [
        makeComplaint({ source: "child" }),
        makeComplaint({ source: "child" }),
        makeComplaint({ source: "parent_carer" }),
        makeComplaint({ source: "staff" }),
      ];
      const result = run(complaints);
      const child = result.source_breakdown.find((s) => s.source === "child");
      expect(child!.percentage).toBe(50);
    });

    it("sorts by count descending", () => {
      const complaints = [
        makeComplaint({ source: "child" }),
        makeComplaint({ source: "child" }),
        makeComplaint({ source: "child" }),
        makeComplaint({ source: "staff" }),
      ];
      const result = run(complaints);
      expect(result.source_breakdown[0].source).toBe("child");
    });

    it("applies correct source labels", () => {
      const complaints = [
        makeComplaint({ source: "child" }),
        makeComplaint({ source: "parent_carer" }),
        makeComplaint({ source: "social_worker" }),
      ];
      const result = run(complaints);
      const child = result.source_breakdown.find((s) => s.source === "child");
      expect(child!.source_label).toBe("Young Person");
      const parent = result.source_breakdown.find((s) => s.source === "parent_carer");
      expect(parent!.source_label).toBe("Parent / Carer");
      const sw = result.source_breakdown.find((s) => s.source === "social_worker");
      expect(sw!.source_label).toBe("Social Worker");
    });

    it("includes all unique sources from Chamberlain House data", () => {
      const result = run(oakHouseComplaints());
      const sources = result.source_breakdown.map((s) => s.source);
      expect(sources).toContain("child");
      expect(sources).toContain("parent_carer");
      expect(sources).toContain("social_worker");
      expect(sources).toContain("staff");
      expect(sources).toContain("anonymous");
      expect(sources).toContain("professional");
    });
  });

  describe("alerts", () => {
    it("generates critical alert for complaint open > 28 calendar days", () => {
      const complaints = [
        makeComplaint({
          outcome: "ongoing",
          complaint_date: "2026-04-20",
          complainant: "Jordan",
        }),
      ];
      const result = run(complaints);
      const critical = result.alerts.filter((a) => a.severity === "critical");
      expect(critical).toHaveLength(1);
      expect(critical[0].message).toContain("Jordan");
      expect(critical[0].message).toContain("35 days");
      expect(critical[0].message).toContain("exceeds 20 working day response deadline");
    });

    it("generates high alert for upheld complaint without lessons learned", () => {
      const complaints = [
        makeComplaint({
          outcome: "upheld",
          theme: "staff_conduct",
          lessons_learned: "",
        }),
      ];
      const result = run(complaints);
      const high = result.alerts.filter((a) => a.severity === "high");
      expect(high.some((a) => a.message.includes("Staff Conduct") && a.message.includes("no lessons learned"))).toBe(true);
    });

    it("generates high alert for escalated ongoing complaint", () => {
      const complaints = [
        makeComplaint({
          outcome: "ongoing",
          escalated: true,
          complainant: "Mrs Smith",
          complaint_date: "2026-05-10",
        }),
      ];
      const result = run(complaints);
      const high = result.alerts.filter((a) => a.severity === "high");
      expect(high.some((a) => a.message.includes("Escalated") && a.message.includes("Mrs Smith"))).toBe(true);
    });

    it("generates medium alert for child complaint resolved without practice changes", () => {
      const complaints = [
        makeComplaint({
          source: "child",
          outcome: "upheld",
          theme: "food",
          practice_changes: [],
        }),
      ];
      const result = run(complaints);
      const medium = result.alerts.filter((a) => a.severity === "medium");
      expect(medium.some((a) => a.message.includes("Child complaint") && a.message.includes("Food"))).toBe(true);
    });

    it("generates medium alert for satisfaction rate below 60%", () => {
      const complaints = [
        makeComplaint({ complainant_satisfied: true }),
        makeComplaint({ complainant_satisfied: false }),
        makeComplaint({ complainant_satisfied: false }),
        makeComplaint({ complainant_satisfied: false }),
      ];
      const result = run(complaints);
      const medium = result.alerts.filter((a) => a.severity === "medium");
      expect(medium.some((a) => a.message.includes("satisfaction rate") && a.message.includes("25%"))).toBe(true);
    });

    it("generates low alert for escalated complaint not notified to Ofsted", () => {
      const complaints = [
        makeComplaint({
          escalated: true,
          ofsted_notified: false,
          complainant: "Dr Patel",
        }),
      ];
      const result = run(complaints);
      const low = result.alerts.filter((a) => a.severity === "low");
      expect(low.some((a) => a.message.includes("Dr Patel") && a.message.includes("not notified to Ofsted"))).toBe(true);
    });

    it("sorts alerts by severity (critical first, low last)", () => {
      const complaints = [
        makeComplaint({ outcome: "ongoing", complaint_date: "2026-04-01", complainant: "A" }),
        makeComplaint({ escalated: true, ofsted_notified: false, complainant: "B" }),
        makeComplaint({ outcome: "upheld", lessons_learned: "", complainant: "C" }),
      ];
      const result = run(complaints);
      if (result.alerts.length >= 2) {
        const severities = result.alerts.map((a) => a.severity);
        const order = { critical: 0, high: 1, medium: 2, low: 3 };
        for (let i = 1; i < severities.length; i++) {
          expect(order[severities[i]]).toBeGreaterThanOrEqual(order[severities[i - 1]]);
        }
      }
    });

    it("does not generate critical alert for complaint open < 28 days", () => {
      const complaints = [
        makeComplaint({
          outcome: "ongoing",
          complaint_date: "2026-05-10",
          complainant: "Alex",
        }),
      ];
      const result = run(complaints);
      const critical = result.alerts.filter((a) => a.severity === "critical");
      expect(critical).toHaveLength(0);
    });
  });

  describe("insights", () => {
    it("generates critical insight for overdue complaint", () => {
      const complaints = [
        makeComplaint({
          outcome: "ongoing",
          complaint_date: "2026-04-15",
          complainant: "Jordan",
        }),
      ];
      const result = run(complaints);
      const critical = result.insights.filter((i) => i.severity === "critical");
      expect(critical.some((i) => i.text.includes("statutory response deadline"))).toBe(true);
    });

    it("generates warning insight for high upheld rate", () => {
      const complaints = [
        makeComplaint({ outcome: "upheld" }),
        makeComplaint({ outcome: "upheld" }),
        makeComplaint({ outcome: "not_upheld" }),
      ];
      const result = run(complaints);
      const warnings = result.insights.filter((i) => i.severity === "warning");
      expect(warnings.some((i) => i.text.includes("upheld rate") && i.text.includes("67%"))).toBe(true);
    });

    it("generates warning insight for low satisfaction", () => {
      const complaints = [
        makeComplaint({ complainant_satisfied: true }),
        makeComplaint({ complainant_satisfied: false }),
        makeComplaint({ complainant_satisfied: false }),
        makeComplaint({ complainant_satisfied: false }),
      ];
      const result = run(complaints);
      const warnings = result.insights.filter((i) => i.severity === "warning");
      expect(warnings.some((i) => i.text.includes("satisfaction") && i.text.includes("25%"))).toBe(true);
    });

    it("generates warning insight for repeat theme (3+ same theme)", () => {
      const complaints = [
        makeComplaint({ theme: "food" }),
        makeComplaint({ theme: "food" }),
        makeComplaint({ theme: "food" }),
      ];
      const result = run(complaints);
      const warnings = result.insights.filter((i) => i.severity === "warning");
      expect(warnings.some((i) => i.text.includes("Repeat theme") && i.text.includes("Food"))).toBe(true);
    });

    it("generates positive insight when all resolved within deadline", () => {
      const complaints = [
        makeComplaint({ outcome: "upheld", response_time_days: 5 }),
        makeComplaint({ outcome: "not_upheld", response_time_days: 10 }),
        makeComplaint({ outcome: "partially_upheld", response_time_days: 20 }),
      ];
      const result = run(complaints);
      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.some((i) => i.text.includes("20 working day deadline"))).toBe(true);
    });

    it("generates positive insight for high satisfaction (>= 75%)", () => {
      const complaints = [
        makeComplaint({ complainant_satisfied: true }),
        makeComplaint({ complainant_satisfied: true }),
        makeComplaint({ complainant_satisfied: true }),
        makeComplaint({ complainant_satisfied: false }),
      ];
      const result = run(complaints);
      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.some((i) => i.text.includes("satisfaction") && i.text.includes("75%"))).toBe(true);
    });

    it("generates positive insight when all have lessons learned", () => {
      const complaints = [
        makeComplaint({ lessons_learned: "Lesson 1" }),
        makeComplaint({ lessons_learned: "Lesson 2" }),
      ];
      const result = run(complaints);
      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.some((i) => i.text.includes("lessons learned recorded"))).toBe(true);
    });

    it("generates positive insight when all child complaints have practice changes", () => {
      const complaints = [
        makeComplaint({ source: "child", outcome: "upheld", practice_changes: ["Change 1"] }),
        makeComplaint({ source: "child", outcome: "not_upheld", practice_changes: ["Change 2"] }),
        makeComplaint({ source: "staff", outcome: "upheld", practice_changes: [] }),
      ];
      const result = run(complaints);
      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.some((i) => i.text.includes("children's voices"))).toBe(true);
    });

    it("does not generate positive deadline insight when a complaint exceeds deadline", () => {
      const complaints = [
        makeComplaint({ outcome: "upheld", response_time_days: 5 }),
        makeComplaint({ outcome: "not_upheld", response_time_days: 35 }),
      ];
      const result = run(complaints);
      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.some((i) => i.text.includes("20 working day deadline"))).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("handles all complaints ongoing", () => {
      const complaints = [
        makeComplaint({ outcome: "ongoing", complaint_date: "2026-05-20" }),
        makeComplaint({ outcome: "ongoing", complaint_date: "2026-05-22" }),
      ];
      const result = run(complaints);
      expect(result.overview.open_count).toBe(2);
      expect(result.overview.resolved_count).toBe(0);
      expect(result.overview.upheld_rate).toBe(0);
      expect(result.overview.avg_response_days).toBe(0);
      expect(result.open_complaints).toHaveLength(2);
    });

    it("handles all complaints resolved", () => {
      const complaints = [
        makeComplaint({ outcome: "upheld", response_time_days: 5 }),
        makeComplaint({ outcome: "not_upheld", response_time_days: 10 }),
      ];
      const result = run(complaints);
      expect(result.overview.open_count).toBe(0);
      expect(result.overview.resolved_count).toBe(2);
      expect(result.open_complaints).toHaveLength(0);
    });

    it("handles no satisfaction data (all null)", () => {
      const complaints = [
        makeComplaint({ complainant_satisfied: null }),
        makeComplaint({ complainant_satisfied: null }),
      ];
      const result = run(complaints);
      expect(result.overview.satisfaction_rate).toBe(0);
    });

    it("handles single complaint", () => {
      const complaints = [makeComplaint()];
      const result = run(complaints);
      expect(result.overview.total_complaints).toBe(1);
      expect(result.overview.resolved_count).toBe(1);
      expect(result.theme_breakdown).toHaveLength(1);
      expect(result.source_breakdown).toHaveLength(1);
    });

    it("handles all withdrawn complaints", () => {
      const complaints = [
        makeComplaint({ outcome: "withdrawn" }),
        makeComplaint({ outcome: "withdrawn" }),
      ];
      const result = run(complaints);
      expect(result.overview.open_count).toBe(0);
      expect(result.overview.resolved_count).toBe(0);
      expect(result.overview.upheld_rate).toBe(0);
    });

    it("handles mixed outcomes correctly", () => {
      const complaints = [
        makeComplaint({ outcome: "upheld" }),
        makeComplaint({ outcome: "partially_upheld" }),
        makeComplaint({ outcome: "not_upheld" }),
        makeComplaint({ outcome: "inconclusive" }),
        makeComplaint({ outcome: "withdrawn" }),
        makeComplaint({ outcome: "ongoing", complaint_date: "2026-05-20" }),
      ];
      const result = run(complaints);
      expect(result.overview.total_complaints).toBe(6);
      expect(result.overview.open_count).toBe(1);
      expect(result.overview.resolved_count).toBe(4);
      expect(result.overview.upheld_rate).toBe(50);
    });
  });

  describe("Chamberlain House integration", () => {
    it("produces correct overview for full Chamberlain House dataset", () => {
      const result = run(oakHouseComplaints());
      expect(result.overview.total_complaints).toBe(8);
      expect(result.overview.open_count).toBe(2);
      expect(result.overview.resolved_count).toBe(5);
      expect(result.overview.escalated_count).toBe(1);
      expect(result.overview.ofsted_notified_count).toBe(1);
      expect(result.overview.child_complaints).toBe(3);
    });

    it("produces 8 unique themes in breakdown", () => {
      const result = run(oakHouseComplaints());
      expect(result.theme_breakdown).toHaveLength(8);
    });

    it("produces 6 unique sources in breakdown", () => {
      const result = run(oakHouseComplaints());
      expect(result.source_breakdown).toHaveLength(6);
    });

    it("generates no alerts when dataset is well-managed", () => {
      const result = run(oakHouseComplaints());
      // No open complaint > 28 days (cmp_004 is 20 days)
      // No upheld without lessons (all upheld have lessons)
      // No escalated ongoing (cmp_008 is escalated but resolved)
      // Satisfaction is exactly 60% (not below 60%)
      // cmp_008 is escalated + ofsted_notified (no low alert)
      expect(result.alerts).toHaveLength(0);
    });

    it("generates alerts when Chamberlain House data has overdue complaint", () => {
      const data = oakHouseComplaints();
      // Make cmp_004 overdue by backdating it
      data[3] = { ...data[3], complaint_date: "2026-04-15" };
      const result = run(data);
      expect(result.alerts.length).toBeGreaterThan(0);
      const critical = result.alerts.filter((a) => a.severity === "critical");
      expect(critical).toHaveLength(1);
      expect(critical[0].message).toContain("Jordan");
    });

    it("generates insights for dataset", () => {
      const result = run(oakHouseComplaints());
      expect(result.insights.length).toBeGreaterThan(0);
    });
  });
});
