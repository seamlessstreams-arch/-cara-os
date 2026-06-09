// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — POSSESSIONS INTELLIGENCE ENGINE TESTS
// Comprehensive test suite for children's property and possessions analysis.
// Covers Reg 20 (safeguarding belongings), SCCIF property management,
// and Children Act 1989 s26 (right to personal property).
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computePossessionsIntelligence,
  type PossessionInput,
  type ChildRef,
  type StaffRef,
} from "../possessions-intelligence-engine";

const TODAY = "2026-05-25";

// ── Factories ───────────────────────────────────────────────────────────────

const CHILDREN: ChildRef[] = [
  { id: "yp_alex", name: "Alex" },
  { id: "yp_jordan", name: "Jordan" },
  { id: "yp_casey", name: "Casey" },
];

const STAFF: StaffRef[] = [
  { id: "staff_ryan", name: "Ryan" },
  { id: "staff_darren", name: "Darren" },
  { id: "staff_anna", name: "Anna" },
];

let _id = 0;
function makePossession(overrides: Partial<PossessionInput> = {}): PossessionInput {
  _id++;
  return {
    id: `pos_test_${_id}`,
    child_id: "yp_alex",
    item_name: "Test Item",
    category: "electronics",
    date_logged: "2026-05-01",
    value_estimate: 100,
    condition: "good",
    photo_logged: true,
    insured: true,
    notes: "",
    ...overrides,
  };
}

function run(possessions: PossessionInput[], opts?: { children?: ChildRef[]; staff?: StaffRef[] }) {
  return computePossessionsIntelligence({
    possessions,
    children: opts?.children ?? CHILDREN,
    staff: opts?.staff ?? STAFF,
    today: TODAY,
  });
}

// ── Chamberlain House Full Dataset ────────────────────────────────────────────────────

function oakHousePossessions(): PossessionInput[] {
  return [
    // Alex: 6 items, all photographed, 1 missing (headphones)
    makePossession({ id: "pos_alex_1", child_id: "yp_alex", item_name: "iPhone 15", category: "electronics", value_estimate: 800, condition: "excellent", photo_logged: true, insured: true }),
    makePossession({ id: "pos_alex_2", child_id: "yp_alex", item_name: "MacBook Air", category: "electronics", value_estimate: 1200, condition: "good", photo_logged: true, insured: true }),
    makePossession({ id: "pos_alex_3", child_id: "yp_alex", item_name: "AirPods Pro", category: "electronics", value_estimate: 250, condition: "missing", photo_logged: true, insured: true }),
    makePossession({ id: "pos_alex_4", child_id: "yp_alex", item_name: "Wallet", category: "other", value_estimate: 40, condition: "good", photo_logged: true, insured: false }),
    makePossession({ id: "pos_alex_5", child_id: "yp_alex", item_name: "Jacket", category: "clothing", value_estimate: 120, condition: "good", photo_logged: true, insured: false }),
    makePossession({ id: "pos_alex_6", child_id: "yp_alex", item_name: "Photo Album", category: "sentimental", value_estimate: 0, condition: "excellent", photo_logged: true, insured: false }),
    // Jordan: 5 items, 3 photographed, 1 missing (watch), 1 damaged (backpack=poor)
    makePossession({ id: "pos_jordan_1", child_id: "yp_jordan", item_name: "PlayStation 5", category: "electronics", value_estimate: 450, condition: "good", photo_logged: true, insured: true }),
    makePossession({ id: "pos_jordan_2", child_id: "yp_jordan", item_name: "Nike Trainers", category: "clothing", value_estimate: 130, condition: "good", photo_logged: false, insured: false }),
    makePossession({ id: "pos_jordan_3", child_id: "yp_jordan", item_name: "Backpack", category: "other", value_estimate: 60, condition: "poor", photo_logged: true, insured: false }),
    makePossession({ id: "pos_jordan_4", child_id: "yp_jordan", item_name: "Watch", category: "other", value_estimate: 200, condition: "missing", photo_logged: false, insured: false }),
    makePossession({ id: "pos_jordan_5", child_id: "yp_jordan", item_name: "Bike", category: "other", value_estimate: 350, condition: "good", photo_logged: true, insured: true }),
    // Casey: 4 items, all photographed, none missing
    makePossession({ id: "pos_casey_1", child_id: "yp_casey", item_name: "Art Supplies", category: "other", value_estimate: 80, condition: "good", photo_logged: true, insured: false }),
    makePossession({ id: "pos_casey_2", child_id: "yp_casey", item_name: "Journal", category: "sentimental", value_estimate: 15, condition: "excellent", photo_logged: true, insured: false }),
    makePossession({ id: "pos_casey_3", child_id: "yp_casey", item_name: "Necklace", category: "sentimental", value_estimate: 150, condition: "excellent", photo_logged: true, insured: true }),
    makePossession({ id: "pos_casey_4", child_id: "yp_casey", item_name: "Portable Speaker", category: "electronics", value_estimate: 60, condition: "good", photo_logged: true, insured: false }),
  ];
}

// ══════════════════════════════════════════════════════════════════════════════
// TESTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Possessions Intelligence Engine", () => {
  // ── Edge Cases ────────────────────────────────────────────────────────────
  describe("edge cases", () => {
    it("returns empty result when no possessions", () => {
      const result = run([]);
      expect(result.overview.total_items).toBe(0);
      expect(result.overview.photo_compliance_rate).toBe(0);
      expect(result.overview.insurance_rate).toBe(0);
      expect(result.overview.missing_items).toBe(0);
      expect(result.overview.total_value_estimate).toBe(0);
      expect(result.overview.avg_items_per_child).toBe(0);
      expect(result.child_inventories).toHaveLength(0);
      expect(result.category_breakdown).toHaveLength(0);
    });

    it("generates low alerts for all children when no possessions exist", () => {
      const result = run([]);
      expect(result.alerts).toHaveLength(3);
      expect(result.alerts.every((a) => a.severity === "low")).toBe(true);
      expect(result.alerts[0].message).toContain("no possessions logged");
    });

    it("handles empty children array with no possessions", () => {
      const result = run([], { children: [] });
      expect(result.alerts).toHaveLength(0);
      expect(result.insights).toHaveLength(0);
    });

    it("handles possessions with unknown child IDs gracefully", () => {
      const possessions = [makePossession({ child_id: "yp_unknown" })];
      const result = run(possessions, { children: [] });
      expect(result.child_inventories).toHaveLength(1);
      expect(result.child_inventories[0].child_name).toBe("yp_unknown");
    });

    it("handles single possession correctly", () => {
      const result = run([makePossession()]);
      expect(result.overview.total_items).toBe(1);
      expect(result.overview.avg_items_per_child).toBeCloseTo(1 / 3, 2);
    });

    it("defaults today to current date when not provided", () => {
      const result = computePossessionsIntelligence({
        possessions: [],
        children: CHILDREN,
        staff: STAFF,
      });
      expect(result.overview.total_items).toBe(0);
    });
  });

  // ── Overview ──────────────────────────────────────────────────────────────
  describe("overview", () => {
    it("counts total items correctly", () => {
      const possessions = [
        makePossession({ child_id: "yp_alex" }),
        makePossession({ child_id: "yp_alex" }),
        makePossession({ child_id: "yp_jordan" }),
      ];
      const result = run(possessions);
      expect(result.overview.total_items).toBe(3);
    });

    it("calculates photo compliance rate", () => {
      const possessions = [
        makePossession({ photo_logged: true }),
        makePossession({ photo_logged: true }),
        makePossession({ photo_logged: false }),
        makePossession({ photo_logged: false }),
      ];
      const result = run(possessions);
      expect(result.overview.items_with_photos).toBe(2);
      expect(result.overview.photo_compliance_rate).toBe(50);
    });

    it("calculates insurance rate", () => {
      const possessions = [
        makePossession({ insured: true }),
        makePossession({ insured: false }),
        makePossession({ insured: true }),
      ];
      const result = run(possessions);
      expect(result.overview.items_insured).toBe(2);
      expect(result.overview.insurance_rate).toBe(67);
    });

    it("counts missing items", () => {
      const possessions = [
        makePossession({ condition: "good" }),
        makePossession({ condition: "missing" }),
        makePossession({ condition: "missing" }),
      ];
      const result = run(possessions);
      expect(result.overview.missing_items).toBe(2);
    });

    it("counts damaged items (poor condition)", () => {
      const possessions = [
        makePossession({ condition: "good" }),
        makePossession({ condition: "poor" }),
        makePossession({ condition: "poor" }),
      ];
      const result = run(possessions);
      expect(result.overview.damaged_items).toBe(2);
    });

    it("sums total value estimate", () => {
      const possessions = [
        makePossession({ value_estimate: 100 }),
        makePossession({ value_estimate: 250 }),
        makePossession({ value_estimate: 50 }),
      ];
      const result = run(possessions);
      expect(result.overview.total_value_estimate).toBe(400);
    });

    it("calculates avg items per child", () => {
      const possessions = [
        makePossession({ child_id: "yp_alex" }),
        makePossession({ child_id: "yp_alex" }),
        makePossession({ child_id: "yp_jordan" }),
      ];
      const result = run(possessions);
      expect(result.overview.avg_items_per_child).toBe(1);
    });

    it("returns 100% photo compliance when all items have photos", () => {
      const possessions = [
        makePossession({ photo_logged: true }),
        makePossession({ photo_logged: true }),
      ];
      const result = run(possessions);
      expect(result.overview.photo_compliance_rate).toBe(100);
    });

    it("returns 0% insurance rate when no items are insured", () => {
      const possessions = [
        makePossession({ insured: false }),
        makePossession({ insured: false }),
      ];
      const result = run(possessions);
      expect(result.overview.insurance_rate).toBe(0);
    });
  });

  // ── Child Inventories ─────────────────────────────────────────────────────
  describe("child_inventories", () => {
    it("groups possessions by child", () => {
      const possessions = [
        makePossession({ child_id: "yp_alex" }),
        makePossession({ child_id: "yp_alex" }),
        makePossession({ child_id: "yp_jordan" }),
      ];
      const result = run(possessions);
      expect(result.child_inventories).toHaveLength(2);
    });

    it("resolves child name from children array", () => {
      const possessions = [makePossession({ child_id: "yp_alex" })];
      const result = run(possessions);
      const alex = result.child_inventories.find((c) => c.child_id === "yp_alex");
      expect(alex?.child_name).toBe("Alex");
    });

    it("calculates items_with_photos per child", () => {
      const possessions = [
        makePossession({ child_id: "yp_alex", photo_logged: true }),
        makePossession({ child_id: "yp_alex", photo_logged: false }),
        makePossession({ child_id: "yp_alex", photo_logged: true }),
      ];
      const result = run(possessions);
      const alex = result.child_inventories.find((c) => c.child_id === "yp_alex");
      expect(alex?.items_with_photos).toBe(2);
    });

    it("calculates missing_count per child", () => {
      const possessions = [
        makePossession({ child_id: "yp_jordan", condition: "missing" }),
        makePossession({ child_id: "yp_jordan", condition: "good" }),
        makePossession({ child_id: "yp_jordan", condition: "missing" }),
      ];
      const result = run(possessions);
      const jordan = result.child_inventories.find((c) => c.child_id === "yp_jordan");
      expect(jordan?.missing_count).toBe(2);
    });

    it("calculates total_value per child", () => {
      const possessions = [
        makePossession({ child_id: "yp_casey", value_estimate: 50 }),
        makePossession({ child_id: "yp_casey", value_estimate: 150 }),
      ];
      const result = run(possessions);
      const casey = result.child_inventories.find((c) => c.child_id === "yp_casey");
      expect(casey?.total_value).toBe(200);
    });

    it("extracts unique categories used per child", () => {
      const possessions = [
        makePossession({ child_id: "yp_alex", category: "electronics" }),
        makePossession({ child_id: "yp_alex", category: "clothing" }),
        makePossession({ child_id: "yp_alex", category: "electronics" }),
      ];
      const result = run(possessions);
      const alex = result.child_inventories.find((c) => c.child_id === "yp_alex");
      expect(alex?.categories_used).toEqual(["clothing", "electronics"]);
    });

    it("sorts child inventories alphabetically by name", () => {
      const possessions = [
        makePossession({ child_id: "yp_jordan" }),
        makePossession({ child_id: "yp_alex" }),
        makePossession({ child_id: "yp_casey" }),
      ];
      const result = run(possessions);
      expect(result.child_inventories[0].child_name).toBe("Alex");
      expect(result.child_inventories[1].child_name).toBe("Casey");
      expect(result.child_inventories[2].child_name).toBe("Jordan");
    });

    it("handles children with zero-value items", () => {
      const possessions = [
        makePossession({ child_id: "yp_alex", value_estimate: 0 }),
      ];
      const result = run(possessions);
      const alex = result.child_inventories.find((c) => c.child_id === "yp_alex");
      expect(alex?.total_value).toBe(0);
    });
  });

  // ── Category Breakdown ──────────────────────────────────────────────────
  describe("category_breakdown", () => {
    it("groups items by category", () => {
      const possessions = [
        makePossession({ category: "electronics" }),
        makePossession({ category: "electronics" }),
        makePossession({ category: "clothing" }),
      ];
      const result = run(possessions);
      expect(result.category_breakdown).toHaveLength(2);
    });

    it("provides correct category labels", () => {
      const possessions = [makePossession({ category: "electronics" })];
      const result = run(possessions);
      const electronics = result.category_breakdown.find((c) => c.category === "electronics");
      expect(electronics?.category_label).toBe("Electronics");
    });

    it("labels unknown categories with title case", () => {
      const possessions = [makePossession({ category: "sports_equipment" })];
      const result = run(possessions);
      const cat = result.category_breakdown.find((c) => c.category === "sports_equipment");
      expect(cat?.category_label).toBe("Sports Equipment");
    });

    it("counts items per category", () => {
      const possessions = [
        makePossession({ category: "sentimental" }),
        makePossession({ category: "sentimental" }),
        makePossession({ category: "sentimental" }),
      ];
      const result = run(possessions);
      const sent = result.category_breakdown.find((c) => c.category === "sentimental");
      expect(sent?.count).toBe(3);
    });

    it("counts missing items per category", () => {
      const possessions = [
        makePossession({ category: "electronics", condition: "missing" }),
        makePossession({ category: "electronics", condition: "good" }),
        makePossession({ category: "electronics", condition: "missing" }),
      ];
      const result = run(possessions);
      const elec = result.category_breakdown.find((c) => c.category === "electronics");
      expect(elec?.missing_count).toBe(2);
    });

    it("calculates average value per category", () => {
      const possessions = [
        makePossession({ category: "electronics", value_estimate: 100 }),
        makePossession({ category: "electronics", value_estimate: 200 }),
        makePossession({ category: "electronics", value_estimate: 300 }),
      ];
      const result = run(possessions);
      const elec = result.category_breakdown.find((c) => c.category === "electronics");
      expect(elec?.avg_value).toBe(200);
    });

    it("sorts categories by count descending", () => {
      const possessions = [
        makePossession({ category: "clothing" }),
        makePossession({ category: "electronics" }),
        makePossession({ category: "electronics" }),
        makePossession({ category: "electronics" }),
        makePossession({ category: "clothing" }),
      ];
      const result = run(possessions);
      expect(result.category_breakdown[0].category).toBe("electronics");
      expect(result.category_breakdown[1].category).toBe("clothing");
    });

    it("handles all known category labels", () => {
      const categories = ["electronics", "clothing", "sentimental", "documents", "money", "other"];
      const possessions = categories.map((cat) => makePossession({ category: cat }));
      const result = run(possessions);
      const labels = result.category_breakdown.map((c) => c.category_label);
      expect(labels).toContain("Electronics");
      expect(labels).toContain("Clothing");
      expect(labels).toContain("Sentimental");
      expect(labels).toContain("Documents");
      expect(labels).toContain("Money");
      expect(labels).toContain("Other");
    });
  });

  // ── Alerts ────────────────────────────────────────────────────────────────
  describe("alerts", () => {
    it("generates critical alert when child has > 2 missing items", () => {
      const possessions = [
        makePossession({ child_id: "yp_alex", condition: "missing" }),
        makePossession({ child_id: "yp_alex", condition: "missing" }),
        makePossession({ child_id: "yp_alex", condition: "missing" }),
      ];
      const result = run(possessions);
      const critical = result.alerts.filter((a) => a.severity === "critical");
      expect(critical).toHaveLength(1);
      expect(critical[0].message).toContain("Alex");
      expect(critical[0].message).toContain("3 missing items");
    });

    it("does NOT generate critical alert when child has exactly 2 missing items", () => {
      const possessions = [
        makePossession({ child_id: "yp_alex", condition: "missing" }),
        makePossession({ child_id: "yp_alex", condition: "missing" }),
        makePossession({ child_id: "yp_alex", condition: "good" }),
      ];
      const result = run(possessions);
      const critical = result.alerts.filter((a) => a.severity === "critical");
      expect(critical).toHaveLength(0);
    });

    it("generates high alert when missing items exist and photo compliance < 50%", () => {
      const possessions = [
        makePossession({ condition: "missing", photo_logged: false }),
        makePossession({ condition: "good", photo_logged: false }),
        makePossession({ condition: "good", photo_logged: false }),
      ];
      const result = run(possessions);
      const high = result.alerts.filter((a) => a.severity === "high");
      expect(high).toHaveLength(1);
      expect(high[0].message).toContain("missing item");
      expect(high[0].message).toContain("0%");
    });

    it("does NOT generate high alert if photo compliance >= 50%", () => {
      const possessions = [
        makePossession({ condition: "missing", photo_logged: true }),
        makePossession({ condition: "good", photo_logged: true }),
      ];
      const result = run(possessions);
      const high = result.alerts.filter((a) => a.severity === "high");
      expect(high).toHaveLength(0);
    });

    it("does NOT generate high alert if no missing items even with low photo compliance", () => {
      const possessions = [
        makePossession({ condition: "good", photo_logged: false }),
        makePossession({ condition: "good", photo_logged: false }),
      ];
      const result = run(possessions);
      const high = result.alerts.filter((a) => a.severity === "high");
      expect(high).toHaveLength(0);
    });

    it("generates medium alert when photo compliance < 80%", () => {
      const possessions = [
        makePossession({ photo_logged: true }),
        makePossession({ photo_logged: true }),
        makePossession({ photo_logged: true }),
        makePossession({ photo_logged: false }),
        makePossession({ photo_logged: false }),
      ];
      const result = run(possessions);
      const medium = result.alerts.filter((a) => a.severity === "medium" && a.message.includes("Photo compliance"));
      expect(medium).toHaveLength(1);
      expect(medium[0].message).toContain("60%");
    });

    it("does NOT generate photo compliance alert when rate is exactly 80%", () => {
      const possessions = [
        makePossession({ photo_logged: true }),
        makePossession({ photo_logged: true }),
        makePossession({ photo_logged: true }),
        makePossession({ photo_logged: true }),
        makePossession({ photo_logged: false }),
      ];
      const result = run(possessions);
      const medium = result.alerts.filter((a) => a.severity === "medium" && a.message.includes("Photo compliance"));
      expect(medium).toHaveLength(0);
    });

    it("generates medium alert when insurance rate < 50% for items valued over £50", () => {
      const possessions = [
        makePossession({ value_estimate: 100, insured: false }),
        makePossession({ value_estimate: 200, insured: false }),
        makePossession({ value_estimate: 80, insured: true }),
      ];
      const result = run(possessions);
      const medium = result.alerts.filter((a) => a.severity === "medium" && a.message.includes("insured"));
      expect(medium).toHaveLength(1);
      expect(medium[0].message).toContain("33%");
    });

    it("does NOT generate insurance alert when all high-value items are insured", () => {
      const possessions = [
        makePossession({ value_estimate: 100, insured: true }),
        makePossession({ value_estimate: 200, insured: true }),
      ];
      const result = run(possessions);
      const medium = result.alerts.filter((a) => a.severity === "medium" && a.message.includes("insured"));
      expect(medium).toHaveLength(0);
    });

    it("does NOT generate insurance alert when no items exceed £50", () => {
      const possessions = [
        makePossession({ value_estimate: 30, insured: false }),
        makePossession({ value_estimate: 50, insured: false }),
      ];
      const result = run(possessions);
      const medium = result.alerts.filter((a) => a.severity === "medium" && a.message.includes("insured"));
      expect(medium).toHaveLength(0);
    });

    it("generates low alert for children with no logged items", () => {
      const possessions = [
        makePossession({ child_id: "yp_alex" }),
      ];
      const result = run(possessions);
      const low = result.alerts.filter((a) => a.severity === "low");
      expect(low).toHaveLength(2); // Jordan and Casey
      expect(low.some((a) => a.message.includes("Jordan"))).toBe(true);
      expect(low.some((a) => a.message.includes("Casey"))).toBe(true);
    });

    it("does NOT generate low alert when all children have items", () => {
      const possessions = [
        makePossession({ child_id: "yp_alex" }),
        makePossession({ child_id: "yp_jordan" }),
        makePossession({ child_id: "yp_casey" }),
      ];
      const result = run(possessions);
      const low = result.alerts.filter((a) => a.severity === "low");
      expect(low).toHaveLength(0);
    });
  });

  // ── Insights ──────────────────────────────────────────────────────────────
  describe("insights", () => {
    it("generates critical insight when missing items exist", () => {
      const possessions = [
        makePossession({ child_id: "yp_alex", condition: "missing" }),
        makePossession({ child_id: "yp_jordan", condition: "missing" }),
      ];
      const result = run(possessions);
      const critical = result.insights.filter((i) => i.severity === "critical");
      expect(critical).toHaveLength(1);
      expect(critical[0].text).toContain("2 item(s) reported missing");
      expect(critical[0].text).toContain("2 child(ren)");
    });

    it("does NOT generate critical insight when no items are missing", () => {
      const possessions = [
        makePossession({ condition: "good" }),
        makePossession({ condition: "excellent" }),
      ];
      const result = run(possessions);
      const critical = result.insights.filter((i) => i.severity === "critical");
      expect(critical).toHaveLength(0);
    });

    it("generates warning insight for children below 80% photo compliance", () => {
      const possessions = [
        makePossession({ child_id: "yp_jordan", photo_logged: true }),
        makePossession({ child_id: "yp_jordan", photo_logged: false }),
        makePossession({ child_id: "yp_jordan", photo_logged: false }),
        makePossession({ child_id: "yp_alex", photo_logged: true }),
      ];
      const result = run(possessions);
      const warnings = result.insights.filter((i) => i.severity === "warning" && i.text.includes("Photo compliance"));
      expect(warnings).toHaveLength(1);
      expect(warnings[0].text).toContain("Jordan");
    });

    it("generates warning insight for uninsured high-value items", () => {
      const possessions = [
        makePossession({ value_estimate: 200, insured: false }),
        makePossession({ value_estimate: 100, insured: false }),
      ];
      const result = run(possessions);
      const warnings = result.insights.filter((i) => i.severity === "warning" && i.text.includes("uninsured"));
      expect(warnings).toHaveLength(1);
      expect(warnings[0].text).toContain("2 high-value item(s)");
      expect(warnings[0].text).toContain("£300");
    });

    it("does NOT generate uninsured warning when all high-value items are insured", () => {
      const possessions = [
        makePossession({ value_estimate: 200, insured: true }),
        makePossession({ value_estimate: 100, insured: true }),
      ];
      const result = run(possessions);
      const warnings = result.insights.filter((i) => i.severity === "warning" && i.text.includes("uninsured"));
      expect(warnings).toHaveLength(0);
    });

    it("generates positive insight for 100% photo compliance", () => {
      const possessions = [
        makePossession({ photo_logged: true }),
        makePossession({ photo_logged: true }),
        makePossession({ photo_logged: true }),
      ];
      const result = run(possessions);
      const positive = result.insights.filter((i) => i.severity === "positive" && i.text.includes("100% photo"));
      expect(positive).toHaveLength(1);
    });

    it("does NOT generate positive photo insight when compliance < 100%", () => {
      const possessions = [
        makePossession({ photo_logged: true }),
        makePossession({ photo_logged: false }),
      ];
      const result = run(possessions);
      const positive = result.insights.filter((i) => i.severity === "positive" && i.text.includes("100% photo"));
      expect(positive).toHaveLength(0);
    });

    it("generates positive insight when all children have ≥5 items", () => {
      const possessions = [
        ...Array.from({ length: 5 }, () => makePossession({ child_id: "yp_alex" })),
        ...Array.from({ length: 5 }, () => makePossession({ child_id: "yp_jordan" })),
        ...Array.from({ length: 5 }, () => makePossession({ child_id: "yp_casey" })),
      ];
      const result = run(possessions);
      const positive = result.insights.filter((i) => i.severity === "positive" && i.text.includes("comprehensive inventories"));
      expect(positive).toHaveLength(1);
    });

    it("does NOT generate comprehensive inventory insight when a child has < 5 items", () => {
      const possessions = [
        ...Array.from({ length: 5 }, () => makePossession({ child_id: "yp_alex" })),
        ...Array.from({ length: 4 }, () => makePossession({ child_id: "yp_jordan" })),
        ...Array.from({ length: 5 }, () => makePossession({ child_id: "yp_casey" })),
      ];
      const result = run(possessions);
      const positive = result.insights.filter((i) => i.severity === "positive" && i.text.includes("comprehensive inventories"));
      expect(positive).toHaveLength(0);
    });

    it("generates positive insight when no items are missing", () => {
      const possessions = [
        makePossession({ condition: "good" }),
        makePossession({ condition: "excellent" }),
      ];
      const result = run(possessions);
      const positive = result.insights.filter((i) => i.severity === "positive" && i.text.includes("No missing items"));
      expect(positive).toHaveLength(1);
    });

    it("does NOT generate no-missing-items insight when items are missing", () => {
      const possessions = [
        makePossession({ condition: "missing" }),
        makePossession({ condition: "good" }),
      ];
      const result = run(possessions);
      const positive = result.insights.filter((i) => i.severity === "positive" && i.text.includes("No missing items"));
      expect(positive).toHaveLength(0);
    });
  });

  // ── Chamberlain House Full Dataset ──────────────────────────────────────────────────
  describe("Chamberlain House full dataset", () => {
    it("calculates correct total items", () => {
      const result = run(oakHousePossessions());
      expect(result.overview.total_items).toBe(15);
    });

    it("calculates correct photo count (13/15 = 87%)", () => {
      const result = run(oakHousePossessions());
      expect(result.overview.items_with_photos).toBe(13);
      expect(result.overview.photo_compliance_rate).toBe(87);
    });

    it("calculates correct missing items count (2)", () => {
      const result = run(oakHousePossessions());
      expect(result.overview.missing_items).toBe(2);
    });

    it("calculates correct damaged items count (1)", () => {
      const result = run(oakHousePossessions());
      expect(result.overview.damaged_items).toBe(1);
    });

    it("calculates total value estimate", () => {
      const result = run(oakHousePossessions());
      // 800+1200+250+40+120+0 + 450+130+60+200+350 + 80+15+150+60 = 3905
      expect(result.overview.total_value_estimate).toBe(3905);
    });

    it("calculates avg items per child (15/3 = 5)", () => {
      const result = run(oakHousePossessions());
      expect(result.overview.avg_items_per_child).toBe(5);
    });

    it("returns 3 child inventory profiles", () => {
      const result = run(oakHousePossessions());
      expect(result.child_inventories).toHaveLength(3);
    });

    it("Alex has 6 items all photographed with 1 missing", () => {
      const result = run(oakHousePossessions());
      const alex = result.child_inventories.find((c) => c.child_id === "yp_alex");
      expect(alex?.total_items).toBe(6);
      expect(alex?.items_with_photos).toBe(6);
      expect(alex?.missing_count).toBe(1);
    });

    it("Jordan has 5 items with 3 photographed, 1 missing", () => {
      const result = run(oakHousePossessions());
      const jordan = result.child_inventories.find((c) => c.child_id === "yp_jordan");
      expect(jordan?.total_items).toBe(5);
      expect(jordan?.items_with_photos).toBe(3);
      expect(jordan?.missing_count).toBe(1);
    });

    it("Casey has 4 items all photographed, none missing", () => {
      const result = run(oakHousePossessions());
      const casey = result.child_inventories.find((c) => c.child_id === "yp_casey");
      expect(casey?.total_items).toBe(4);
      expect(casey?.items_with_photos).toBe(4);
      expect(casey?.missing_count).toBe(0);
    });

    it("generates no critical alerts (no child has > 2 missing)", () => {
      const result = run(oakHousePossessions());
      const critical = result.alerts.filter((a) => a.severity === "critical");
      expect(critical).toHaveLength(0);
    });

    it("generates critical insight for 2 missing items across 2 children", () => {
      const result = run(oakHousePossessions());
      const critical = result.insights.filter((i) => i.severity === "critical");
      expect(critical).toHaveLength(1);
      expect(critical[0].text).toContain("2 item(s) reported missing");
      expect(critical[0].text).toContain("2 child(ren)");
    });

    it("generates warning insight for Jordan below photo threshold", () => {
      const result = run(oakHousePossessions());
      const warnings = result.insights.filter((i) => i.severity === "warning" && i.text.includes("Photo compliance"));
      expect(warnings).toHaveLength(1);
      expect(warnings[0].text).toContain("Jordan");
    });

    it("generates warning for uninsured high-value items", () => {
      const result = run(oakHousePossessions());
      const warnings = result.insights.filter((i) => i.severity === "warning" && i.text.includes("uninsured"));
      expect(warnings).toHaveLength(1);
    });

    it("does NOT generate positive 100% photo compliance insight", () => {
      const result = run(oakHousePossessions());
      const positive = result.insights.filter((i) => i.severity === "positive" && i.text.includes("100% photo"));
      expect(positive).toHaveLength(0);
    });

    it("does NOT generate positive comprehensive inventories insight (Casey has 4)", () => {
      const result = run(oakHousePossessions());
      const positive = result.insights.filter((i) => i.severity === "positive" && i.text.includes("comprehensive inventories"));
      expect(positive).toHaveLength(0);
    });

    it("does NOT generate medium insurance alert (50% insured = threshold met)", () => {
      const result = run(oakHousePossessions());
      // 12 high-value items, 6 insured = 50% — threshold is < 50% so no alert
      const medium = result.alerts.filter((a) => a.severity === "medium" && a.message.includes("insured"));
      expect(medium).toHaveLength(0);
    });

    it("does NOT generate medium photo compliance alert (87% >= 80%)", () => {
      const result = run(oakHousePossessions());
      const medium = result.alerts.filter((a) => a.severity === "medium" && a.message.includes("Photo compliance"));
      expect(medium).toHaveLength(0);
    });

    it("has correct category breakdown count", () => {
      const result = run(oakHousePossessions());
      // electronics(5), clothing(2), other(5), sentimental(3)
      expect(result.category_breakdown).toHaveLength(4);
    });
  });
});
