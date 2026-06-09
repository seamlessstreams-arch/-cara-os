// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — VISITORS INTELLIGENCE ENGINE TESTS
// Comprehensive test suite for visitor management analysis.
// Reg 12, Reg 22, Reg 44, SCCIF.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeVisitorsIntelligence,
  type VisitorInput,
  type ChildRef,
  type StaffRef,
} from "../visitors-intelligence-engine";

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
function makeVisitor(overrides: Partial<VisitorInput> = {}): VisitorInput {
  _id++;
  return {
    id: `vis_test_${_id}`,
    date: "2026-05-20",
    visitor_name: `Visitor ${_id}`,
    organisation: "Test Org",
    category: "professional",
    purpose: "Statutory visit",
    dbs_checked: true,
    id_verified: true,
    sign_in_time: "10:00",
    sign_out_time: "11:00",
    status: "signed_out",
    host_staff_id: "staff_darren",
    children_seen: ["yp_alex"],
    ...overrides,
  };
}

function run(visitors: VisitorInput[], opts?: { children?: ChildRef[]; staff?: StaffRef[] }) {
  return computeVisitorsIntelligence({
    visitors,
    children: opts?.children ?? CHILDREN,
    staff: opts?.staff ?? STAFF,
    today: TODAY,
  });
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Visitors Intelligence Engine", () => {

  describe("empty state", () => {
    it("returns safe defaults when no visitors provided", () => {
      const result = run([]);
      expect(result.overview.total_visits).toBe(0);
      expect(result.overview.dbs_compliance_rate).toBe(100);
      expect(result.overview.id_compliance_rate).toBe(100);
      expect(result.category_breakdown).toHaveLength(0);
      expect(result.child_profiles).toHaveLength(0);
      expect(result.recent_visitors).toHaveLength(0);
      expect(result.alerts).toHaveLength(0);
      expect(result.insights).toHaveLength(0);
    });
  });

  describe("overview calculations", () => {
    it("counts total visits", () => {
      const result = run([makeVisitor(), makeVisitor(), makeVisitor()]);
      expect(result.overview.total_visits).toBe(3);
    });

    it("counts visits in last 30 days", () => {
      const result = run([
        makeVisitor({ date: "2026-05-20" }),
        makeVisitor({ date: "2026-05-01" }),
        makeVisitor({ date: "2026-04-20" }),
      ]);
      expect(result.overview.visits_last_30_days).toBe(2);
    });

    it("counts currently signed in", () => {
      const result = run([
        makeVisitor({ status: "signed_in", sign_out_time: null, date: TODAY }),
        makeVisitor({ status: "signed_out" }),
      ]);
      expect(result.overview.currently_signed_in).toBe(1);
    });

    it("counts unique visitors by name", () => {
      const result = run([
        makeVisitor({ visitor_name: "Alice" }),
        makeVisitor({ visitor_name: "Alice" }),
        makeVisitor({ visitor_name: "Bob" }),
      ]);
      expect(result.overview.unique_visitors).toBe(2);
    });

    it("calculates DBS compliance for professional/inspector/volunteer only", () => {
      const result = run([
        makeVisitor({ category: "professional", dbs_checked: true }),
        makeVisitor({ category: "inspector", dbs_checked: false }),
        makeVisitor({ category: "family", dbs_checked: false }),
        makeVisitor({ category: "tradesperson", dbs_checked: false }),
      ]);
      expect(result.overview.dbs_compliance_rate).toBe(50);
    });

    it("calculates ID compliance across all visitors", () => {
      const result = run([
        makeVisitor({ id_verified: true }),
        makeVisitor({ id_verified: true }),
        makeVisitor({ id_verified: false }),
      ]);
      expect(result.overview.id_compliance_rate).toBe(67);
    });

    it("counts children with visits", () => {
      const result = run([
        makeVisitor({ children_seen: ["yp_alex"] }),
        makeVisitor({ children_seen: ["yp_alex", "yp_casey"] }),
      ]);
      expect(result.overview.children_with_visits).toBe(2);
    });

    it("counts professional and family visits separately", () => {
      const result = run([
        makeVisitor({ category: "professional" }),
        makeVisitor({ category: "inspector" }),
        makeVisitor({ category: "family" }),
        makeVisitor({ category: "family" }),
        makeVisitor({ category: "tradesperson" }),
      ]);
      expect(result.overview.professional_visits).toBe(2);
      expect(result.overview.family_visits).toBe(2);
    });
  });

  describe("category breakdown", () => {
    it("groups visitors by category with counts and percentages", () => {
      const result = run([
        makeVisitor({ category: "professional" }),
        makeVisitor({ category: "professional" }),
        makeVisitor({ category: "family" }),
        makeVisitor({ category: "tradesperson" }),
      ]);
      expect(result.category_breakdown).toHaveLength(3);
      expect(result.category_breakdown[0].category).toBe("professional");
      expect(result.category_breakdown[0].count).toBe(2);
      expect(result.category_breakdown[0].pct).toBe(50);
    });

    it("sorts by count descending", () => {
      const result = run([
        makeVisitor({ category: "family" }),
        makeVisitor({ category: "professional" }),
        makeVisitor({ category: "professional" }),
        makeVisitor({ category: "professional" }),
      ]);
      expect(result.category_breakdown[0].category).toBe("professional");
    });

    it("provides human-readable labels", () => {
      const result = run([makeVisitor({ category: "tradesperson" })]);
      expect(result.category_breakdown[0].category_label).toBe("Tradesperson");
    });
  });

  describe("child profiles", () => {
    it("creates per-child profiles with visit counts", () => {
      const result = run([
        makeVisitor({ children_seen: ["yp_alex"] }),
        makeVisitor({ children_seen: ["yp_alex", "yp_jordan"] }),
        makeVisitor({ children_seen: ["yp_casey"], category: "family" }),
      ]);
      expect(result.child_profiles).toHaveLength(3);
      const alex = result.child_profiles.find((p) => p.child_id === "yp_alex")!;
      expect(alex.total_visits).toBe(2);
      expect(alex.child_name).toBe("Alex");
    });

    it("sorts profiles by total_visits descending", () => {
      const result = run([
        makeVisitor({ children_seen: ["yp_alex"] }),
        makeVisitor({ children_seen: ["yp_alex"] }),
        makeVisitor({ children_seen: ["yp_casey"] }),
      ]);
      expect(result.child_profiles[0].child_id).toBe("yp_alex");
    });

    it("tracks professional and family visits separately per child", () => {
      const result = run([
        makeVisitor({ children_seen: ["yp_alex"], category: "professional" }),
        makeVisitor({ children_seen: ["yp_alex"], category: "family" }),
        makeVisitor({ children_seen: ["yp_alex"], category: "inspector" }),
      ]);
      const alex = result.child_profiles[0];
      expect(alex.professional_visits).toBe(2);
      expect(alex.family_visits).toBe(1);
    });

    it("calculates days since last visit", () => {
      const result = run([
        makeVisitor({ children_seen: ["yp_alex"], date: "2026-05-20" }),
        makeVisitor({ children_seen: ["yp_alex"], date: "2026-05-15" }),
      ]);
      expect(result.child_profiles[0].last_visit_date).toBe("2026-05-20");
      expect(result.child_profiles[0].days_since_last_visit).toBe(5);
    });

    it("tracks unique visitor names per child", () => {
      const result = run([
        makeVisitor({ children_seen: ["yp_alex"], visitor_name: "Alice" }),
        makeVisitor({ children_seen: ["yp_alex"], visitor_name: "Alice" }),
        makeVisitor({ children_seen: ["yp_alex"], visitor_name: "Bob" }),
      ]);
      expect(result.child_profiles[0].visitor_names).toContain("Alice");
      expect(result.child_profiles[0].visitor_names).toContain("Bob");
      expect(result.child_profiles[0].visitor_names).toHaveLength(2);
    });
  });

  describe("recent visitors", () => {
    it("returns visitors sorted by date descending", () => {
      const result = run([
        makeVisitor({ date: "2026-05-10" }),
        makeVisitor({ date: "2026-05-20" }),
        makeVisitor({ date: "2026-05-15" }),
      ]);
      expect(result.recent_visitors[0].date).toBe("2026-05-20");
      expect(result.recent_visitors[1].date).toBe("2026-05-15");
    });

    it("limits to 6 recent visitors", () => {
      const visitors = Array.from({ length: 10 }, (_, i) =>
        makeVisitor({ date: `2026-05-${String(10 + i).padStart(2, "0")}` })
      );
      const result = run(visitors);
      expect(result.recent_visitors).toHaveLength(6);
    });

    it("includes child names and category labels", () => {
      const result = run([
        makeVisitor({ children_seen: ["yp_alex", "yp_jordan"], category: "family" }),
      ]);
      expect(result.recent_visitors[0].children_seen_names).toContain("Alex");
      expect(result.recent_visitors[0].children_seen_names).toContain("Jordan");
      expect(result.recent_visitors[0].category_label).toBe("Family");
    });
  });

  describe("alerts", () => {
    it("generates critical alert for visitors signed in from previous day", () => {
      const result = run([
        makeVisitor({ status: "signed_in", sign_out_time: null, date: "2026-05-23" }),
      ]);
      const critical = result.alerts.filter((a) => a.severity === "critical");
      expect(critical).toHaveLength(1);
      expect(critical[0].type).toBe("unsigned_out");
    });

    it("does not generate critical alert for visitors signed in today", () => {
      const result = run([
        makeVisitor({ status: "signed_in", sign_out_time: null, date: TODAY }),
      ]);
      const critical = result.alerts.filter((a) => a.type === "unsigned_out");
      expect(critical).toHaveLength(0);
    });

    it("generates high alert for DBS gaps on professional visitors", () => {
      const result = run([
        makeVisitor({ category: "professional", dbs_checked: false }),
      ]);
      const high = result.alerts.filter((a) => a.severity === "high");
      expect(high).toHaveLength(1);
      expect(high[0].type).toBe("dbs_gap");
    });

    it("does not generate DBS alert for family visitors without DBS", () => {
      const result = run([
        makeVisitor({ category: "family", dbs_checked: false }),
      ]);
      const dbs = result.alerts.filter((a) => a.type === "dbs_gap");
      expect(dbs).toHaveLength(0);
    });

    it("generates medium alert for children with no visits", () => {
      const result = run([
        makeVisitor({ children_seen: ["yp_alex"] }),
      ]);
      const medium = result.alerts.filter((a) => a.severity === "medium");
      const noVisit = medium.filter((a) => a.type === "no_visits");
      expect(noVisit.length).toBeGreaterThanOrEqual(1);
      expect(noVisit.some((a) => a.message.includes("Jordan") || a.message.includes("Casey"))).toBe(true);
    });

    it("generates medium alert for infrequent visits (>21 days)", () => {
      const result = run([
        makeVisitor({ children_seen: ["yp_alex"], date: "2026-04-25" }),
        makeVisitor({ children_seen: ["yp_jordan"], date: "2026-05-20" }),
        makeVisitor({ children_seen: ["yp_casey"], date: "2026-05-20" }),
      ]);
      const infreq = result.alerts.filter((a) => a.type === "infrequent_visits");
      expect(infreq).toHaveLength(1);
      expect(infreq[0].message).toContain("Alex");
    });

    it("generates low alert for ID not verified", () => {
      const result = run([
        makeVisitor({ id_verified: false }),
      ]);
      const low = result.alerts.filter((a) => a.severity === "low");
      expect(low.some((a) => a.type === "id_gap")).toBe(true);
    });
  });

  describe("ARIA insights", () => {
    it("generates critical insight for DBS gaps", () => {
      const result = run([
        makeVisitor({ category: "professional", dbs_checked: false }),
      ]);
      const critical = result.insights.filter((i) => i.severity === "critical");
      expect(critical).toHaveLength(1);
      expect(critical[0].text).toContain("DBS verification");
    });

    it("generates warning for children without family contact", () => {
      const result = run([
        makeVisitor({ children_seen: ["yp_alex"], category: "professional" }),
      ]);
      const warnings = result.insights.filter((i) => i.severity === "warning");
      expect(warnings.some((w) => w.text.includes("family visitor contact"))).toBe(true);
    });

    it("generates warning for unsigned-out visitors from previous days", () => {
      const result = run([
        makeVisitor({ status: "signed_in", date: "2026-05-23" }),
      ]);
      const warnings = result.insights.filter((i) => i.severity === "warning");
      expect(warnings.some((w) => w.text.includes("signed in"))).toBe(true);
    });

    it("generates positive insight for 100% DBS compliance", () => {
      const result = run([
        makeVisitor({ category: "professional", dbs_checked: true }),
        makeVisitor({ category: "inspector", dbs_checked: true }),
      ]);
      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.some((p) => p.text.includes("100% DBS compliance"))).toBe(true);
    });

    it("generates positive insight when all children have visits", () => {
      const result = run([
        makeVisitor({ children_seen: ["yp_alex"] }),
        makeVisitor({ children_seen: ["yp_jordan"] }),
        makeVisitor({ children_seen: ["yp_casey"] }),
      ]);
      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.some((p) => p.text.includes("All 3 children"))).toBe(true);
    });

    it("generates positive insight for 100% ID verification", () => {
      const result = run([
        makeVisitor({ id_verified: true }),
        makeVisitor({ id_verified: true }),
      ]);
      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.some((p) => p.text.includes("100% ID verification"))).toBe(true);
    });

    it("generates positive insight for balanced visitor types", () => {
      const result = run([
        makeVisitor({ category: "professional" }),
        makeVisitor({ category: "family" }),
      ]);
      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.some((p) => p.text.includes("Balanced visitor profile"))).toBe(true);
    });

    it("generates positive insight for multiple hosting staff", () => {
      const result = run([
        makeVisitor({ host_staff_id: "staff_ryan" }),
        makeVisitor({ host_staff_id: "staff_edward" }),
        makeVisitor({ host_staff_id: "staff_anna" }),
      ]);
      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.some((p) => p.text.includes("3 different staff members"))).toBe(true);
    });
  });

  describe("Chamberlain House integration", () => {
    function oakHouseVisitors(): VisitorInput[] {
      return [
        {
          id: "vis_001", date: "2026-05-24", visitor_name: "Sarah Mitchell",
          organisation: "Placing Authority", category: "professional",
          purpose: "LAC review preparation", dbs_checked: true, id_verified: true,
          sign_in_time: "10:00", sign_out_time: "11:30", status: "signed_out",
          host_staff_id: "staff_darren", children_seen: ["yp_alex"],
        },
        {
          id: "vis_002", date: "2026-05-22", visitor_name: "Dr James Patel",
          organisation: "CAMHS", category: "professional",
          purpose: "Therapeutic session with Casey", dbs_checked: true, id_verified: true,
          sign_in_time: "14:00", sign_out_time: "15:00", status: "signed_out",
          host_staff_id: "staff_anna", children_seen: ["yp_casey"],
        },
        {
          id: "vis_003", date: "2026-05-20", visitor_name: "Karen Thompson",
          organisation: null, category: "family",
          purpose: "Contact visit — Jordan's mother", dbs_checked: false, id_verified: true,
          sign_in_time: "13:00", sign_out_time: "15:30", status: "signed_out",
          host_staff_id: "staff_chervelle", children_seen: ["yp_jordan"],
        },
        {
          id: "vis_004", date: "2026-05-18", visitor_name: "Mike Roberts",
          organisation: "Roberts Plumbing Ltd", category: "tradesperson",
          purpose: "Emergency boiler repair", dbs_checked: false, id_verified: true,
          sign_in_time: "09:00", sign_out_time: "12:00", status: "signed_out",
          host_staff_id: "staff_edward", children_seen: [],
        },
        {
          id: "vis_005", date: "2026-05-15", visitor_name: "Helen Clarke",
          organisation: "Ofsted", category: "inspector",
          purpose: "Unannounced monitoring visit", dbs_checked: true, id_verified: true,
          sign_in_time: "08:30", sign_out_time: "16:00", status: "signed_out",
          host_staff_id: "staff_darren", children_seen: ["yp_alex", "yp_jordan", "yp_casey"],
        },
        {
          id: "vis_006", date: "2026-05-11", visitor_name: "Janet Lewis",
          organisation: "Reg 44 Independent Person", category: "professional",
          purpose: "Reg 44 monthly monitoring visit", dbs_checked: true, id_verified: true,
          sign_in_time: "10:00", sign_out_time: "14:00", status: "signed_out",
          host_staff_id: "staff_darren", children_seen: ["yp_alex", "yp_jordan", "yp_casey"],
        },
        {
          id: "vis_007", date: "2026-05-07", visitor_name: "David Brown",
          organisation: null, category: "family",
          purpose: "Contact visit — Alex's uncle", dbs_checked: true, id_verified: true,
          sign_in_time: "11:00", sign_out_time: "13:00", status: "signed_out",
          host_staff_id: "staff_ryan", children_seen: ["yp_alex"],
        },
        {
          id: "vis_008", date: "2026-05-25", visitor_name: "Lisa Green",
          organisation: "YOT", category: "professional",
          purpose: "YOT review meeting — Alex", dbs_checked: true, id_verified: true,
          sign_in_time: "14:00", sign_out_time: null, status: "signed_in",
          host_staff_id: "staff_chervelle", children_seen: ["yp_alex"],
        },
        {
          id: "vis_009", date: "2026-05-23", visitor_name: "Tom Wilson",
          organisation: "Oak Academy", category: "professional",
          purpose: "PEP meeting — Jordan", dbs_checked: true, id_verified: true,
          sign_in_time: "09:30", sign_out_time: "10:45", status: "signed_out",
          host_staff_id: "staff_anna", children_seen: ["yp_jordan"],
        },
        {
          id: "vis_010", date: "2026-05-03", visitor_name: "Claire Adams",
          organisation: "Placing Authority", category: "professional",
          purpose: "Supervision of contact — Casey", dbs_checked: true, id_verified: true,
          sign_in_time: "10:00", sign_out_time: "11:30", status: "signed_out",
          host_staff_id: "staff_edward", children_seen: ["yp_casey"],
        },
      ];
    }

    it("calculates correct overview for Chamberlain House data", () => {
      const result = run(oakHouseVisitors());
      expect(result.overview.total_visits).toBe(10);
      expect(result.overview.visits_last_30_days).toBe(10);
      expect(result.overview.currently_signed_in).toBe(1);
      expect(result.overview.unique_visitors).toBe(10);
    });

    it("calculates DBS compliance correctly (tradesperson excluded)", () => {
      const result = run(oakHouseVisitors());
      expect(result.overview.dbs_compliance_rate).toBe(100);
    });

    it("counts all 3 children as having visits", () => {
      const result = run(oakHouseVisitors());
      expect(result.overview.children_with_visits).toBe(3);
    });

    it("Alex has the most visits (5)", () => {
      const result = run(oakHouseVisitors());
      const alex = result.child_profiles.find((p) => p.child_id === "yp_alex")!;
      expect(alex.total_visits).toBe(5);
    });

    it("Jordan has 4 visits (contact, PEP, inspector, Reg44)", () => {
      const result = run(oakHouseVisitors());
      const jordan = result.child_profiles.find((p) => p.child_id === "yp_jordan")!;
      expect(jordan.total_visits).toBe(4);
    });

    it("Casey has 4 visits (CAMHS, inspector, Reg44, placing SW)", () => {
      const result = run(oakHouseVisitors());
      const casey = result.child_profiles.find((p) => p.child_id === "yp_casey")!;
      expect(casey.total_visits).toBe(4);
    });

    it("identifies 4 visitor categories", () => {
      const result = run(oakHouseVisitors());
      expect(result.category_breakdown).toHaveLength(4);
      expect(result.category_breakdown[0].category).toBe("professional");
    });

    it("does not generate critical alerts (no unsigned-out from previous days)", () => {
      const result = run(oakHouseVisitors());
      const critical = result.alerts.filter((a) => a.severity === "critical");
      expect(critical).toHaveLength(0);
    });

    it("generates positive insight for all children having visits", () => {
      const result = run(oakHouseVisitors());
      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.some((p) => p.text.includes("All 3 children"))).toBe(true);
    });

    it("generates positive insight for balanced visitor types", () => {
      const result = run(oakHouseVisitors());
      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.some((p) => p.text.includes("Balanced visitor profile"))).toBe(true);
    });

    it("generates positive insight for multiple hosting staff", () => {
      const result = run(oakHouseVisitors());
      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.some((p) => p.text.includes("staff members hosting"))).toBe(true);
    });

    it("returns 6 recent visitors sorted correctly", () => {
      const result = run(oakHouseVisitors());
      expect(result.recent_visitors).toHaveLength(6);
      expect(result.recent_visitors[0].date).toBe("2026-05-25");
      expect(result.recent_visitors[0].visitor_name).toBe("Lisa Green");
    });
  });
});
