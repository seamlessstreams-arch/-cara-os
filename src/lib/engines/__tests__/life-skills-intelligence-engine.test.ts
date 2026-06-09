// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — LIFE SKILLS & INDEPENDENCE INTELLIGENCE ENGINE TESTS
// Comprehensive test suite for independence readiness analysis.
// Reg 8, Reg 9, Reg 14, SCCIF.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeLifeSkillsIntelligence,
  type IndependencePathwayInput,
  type ChildRef,
  type StaffRef,
} from "../life-skills-intelligence-engine";

const TODAY = "2026-05-25";

// ── Factories ───────────────────────────────────────────────────────────────

const CHILDREN: ChildRef[] = [
  { id: "yp_alex", name: "Alex" },
  { id: "yp_jordan", name: "Jordan" },
  { id: "yp_casey", name: "Casey" },
];

const STAFF: StaffRef[] = [
  { id: "staff_anna", name: "Anna" },
  { id: "staff_chervelle", name: "Chervelle" },
];

const DEFAULT_DOMAINS = [
  { name: "Personal Care", score: 7, max_score: 10 },
  { name: "Cooking & Nutrition", score: 5, max_score: 10 },
  { name: "Money Management", score: 3, max_score: 10 },
  { name: "Home Management", score: 4, max_score: 10 },
  { name: "Social Networks", score: 6, max_score: 10 },
  { name: "Education & Employment", score: 5, max_score: 10 },
  { name: "Emotional Wellbeing", score: 6, max_score: 10 },
  { name: "Practical Skills", score: 5, max_score: 10 },
];

let _id = 0;
function makePathway(overrides: Partial<IndependencePathwayInput> = {}): IndependencePathwayInput {
  _id++;
  return {
    id: `ip_test_${_id}`,
    child_id: "yp_alex",
    assessed_by: "staff_anna",
    assessment_date: "2026-05-10",
    review_date: "2026-08-10",
    overall_readiness: 55,
    domains: DEFAULT_DOMAINS,
    status: "on_track",
    pathway_plan_linked: true,
    ...overrides,
  };
}

function run(pathways: IndependencePathwayInput[], opts?: { children?: ChildRef[]; staff?: StaffRef[] }) {
  return computeLifeSkillsIntelligence({
    pathways,
    children: opts?.children ?? CHILDREN,
    staff: opts?.staff ?? STAFF,
    today: TODAY,
  });
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Life Skills Intelligence Engine", () => {

  describe("empty state", () => {
    it("returns safe defaults when no pathways provided", () => {
      const result = run([]);
      expect(result.overview.total_children).toBe(3);
      expect(result.overview.children_assessed).toBe(0);
      expect(result.overview.avg_readiness).toBe(0);
      expect(result.domain_averages).toHaveLength(0);
      expect(result.child_profiles).toHaveLength(0);
      expect(result.alerts).toHaveLength(0);
      expect(result.insights).toHaveLength(0);
    });
  });

  describe("overview calculations", () => {
    it("counts total children from children list", () => {
      const result = run([makePathway()]);
      expect(result.overview.total_children).toBe(3);
    });

    it("counts children assessed (unique)", () => {
      const result = run([
        makePathway({ child_id: "yp_alex" }),
        makePathway({ child_id: "yp_jordan" }),
      ]);
      expect(result.overview.children_assessed).toBe(2);
    });

    it("takes most recent assessment per child", () => {
      const result = run([
        makePathway({ child_id: "yp_alex", assessment_date: "2026-04-01", overall_readiness: 40 }),
        makePathway({ child_id: "yp_alex", assessment_date: "2026-05-10", overall_readiness: 60 }),
      ]);
      expect(result.overview.children_assessed).toBe(1);
      expect(result.child_profiles[0].readiness).toBe(60);
    });

    it("calculates average readiness", () => {
      const result = run([
        makePathway({ child_id: "yp_alex", overall_readiness: 60 }),
        makePathway({ child_id: "yp_jordan", overall_readiness: 40 }),
      ]);
      expect(result.overview.avg_readiness).toBe(50);
    });

    it("counts pathway plans active", () => {
      const result = run([
        makePathway({ child_id: "yp_alex", pathway_plan_linked: true }),
        makePathway({ child_id: "yp_jordan", pathway_plan_linked: false }),
      ]);
      expect(result.overview.pathway_plans_active).toBe(1);
    });

    it("counts children on track and attention needed", () => {
      const result = run([
        makePathway({ child_id: "yp_alex", status: "on_track" }),
        makePathway({ child_id: "yp_jordan", status: "attention_needed" }),
        makePathway({ child_id: "yp_casey", status: "on_track" }),
      ]);
      expect(result.overview.children_on_track).toBe(2);
      expect(result.overview.children_attention_needed).toBe(1);
    });

    it("counts unique domains", () => {
      const result = run([makePathway()]);
      expect(result.overview.domains_count).toBe(8);
    });
  });

  describe("domain averages", () => {
    it("calculates average percentage per domain across children", () => {
      const result = run([
        makePathway({
          child_id: "yp_alex",
          domains: [{ name: "Personal Care", score: 8, max_score: 10 }],
        }),
        makePathway({
          child_id: "yp_jordan",
          domains: [{ name: "Personal Care", score: 6, max_score: 10 }],
        }),
      ]);
      const pc = result.domain_averages.find((d) => d.domain === "Personal Care")!;
      expect(pc.avg_pct).toBe(70);
      expect(pc.children_assessed).toBe(2);
    });

    it("sorts domains by average descending", () => {
      const result = run([
        makePathway({
          domains: [
            { name: "Cooking", score: 3, max_score: 10 },
            { name: "Personal Care", score: 8, max_score: 10 },
          ],
        }),
      ]);
      expect(result.domain_averages[0].domain).toBe("Personal Care");
      expect(result.domain_averages[1].domain).toBe("Cooking");
    });
  });

  describe("child profiles", () => {
    it("creates per-child profiles with readiness and status", () => {
      const result = run([
        makePathway({ child_id: "yp_alex", overall_readiness: 68, status: "on_track" }),
      ]);
      expect(result.child_profiles).toHaveLength(1);
      const alex = result.child_profiles[0];
      expect(alex.child_name).toBe("Alex");
      expect(alex.readiness).toBe(68);
      expect(alex.status_label).toBe("On Track");
    });

    it("sorts profiles by readiness descending", () => {
      const result = run([
        makePathway({ child_id: "yp_alex", overall_readiness: 50 }),
        makePathway({ child_id: "yp_jordan", overall_readiness: 70 }),
      ]);
      expect(result.child_profiles[0].child_id).toBe("yp_jordan");
    });

    it("identifies strongest and weakest domains", () => {
      const result = run([
        makePathway({
          domains: [
            { name: "Personal Care", score: 9, max_score: 10 },
            { name: "Money Management", score: 2, max_score: 10 },
            { name: "Cooking", score: 5, max_score: 10 },
          ],
        }),
      ]);
      expect(result.child_profiles[0].strongest_domain).toBe("Personal Care");
      expect(result.child_profiles[0].weakest_domain).toBe("Money Management");
    });

    it("calculates days since assessment", () => {
      const result = run([
        makePathway({ assessment_date: "2026-05-10" }),
      ]);
      expect(result.child_profiles[0].days_since_assessment).toBe(15);
    });

    it("calculates review due in days", () => {
      const result = run([
        makePathway({ review_date: "2026-08-10" }),
      ]);
      expect(result.child_profiles[0].review_due_in_days).toBe(77);
    });
  });

  describe("risk flags", () => {
    it("flags low_readiness for <40%", () => {
      const result = run([
        makePathway({ overall_readiness: 35 }),
      ]);
      expect(result.child_profiles[0].risk_flags).toContain("low_readiness");
    });

    it("does not flag low_readiness for >=40%", () => {
      const result = run([
        makePathway({ overall_readiness: 40 }),
      ]);
      expect(result.child_profiles[0].risk_flags).not.toContain("low_readiness");
    });

    it("flags attention_needed status", () => {
      const result = run([
        makePathway({ status: "attention_needed" }),
      ]);
      expect(result.child_profiles[0].risk_flags).toContain("attention_needed");
    });

    it("flags no_pathway_plan", () => {
      const result = run([
        makePathway({ pathway_plan_linked: false }),
      ]);
      expect(result.child_profiles[0].risk_flags).toContain("no_pathway_plan");
    });

    it("flags assessment_overdue for >90 days", () => {
      const result = run([
        makePathway({ assessment_date: "2026-02-01" }),
      ]);
      expect(result.child_profiles[0].risk_flags).toContain("assessment_overdue");
    });

    it("flags review_overdue for past review date", () => {
      const result = run([
        makePathway({ review_date: "2026-05-01" }),
      ]);
      expect(result.child_profiles[0].risk_flags).toContain("review_overdue");
    });

    it("flags multiple_weak_domains for >=2 domains below 30%", () => {
      const result = run([
        makePathway({
          domains: [
            { name: "A", score: 2, max_score: 10 },
            { name: "B", score: 2, max_score: 10 },
            { name: "C", score: 8, max_score: 10 },
          ],
        }),
      ]);
      expect(result.child_profiles[0].risk_flags).toContain("multiple_weak_domains");
    });
  });

  describe("alerts", () => {
    it("generates high alert for unassessed children", () => {
      const result = run([
        makePathway({ child_id: "yp_alex" }),
      ]);
      const high = result.alerts.filter((a) => a.severity === "high");
      expect(high).toHaveLength(1);
      expect(high[0].type).toBe("no_assessment");
      expect(high[0].message).toContain("Jordan");
      expect(high[0].message).toContain("Casey");
    });

    it("generates medium alert for attention_needed status", () => {
      const result = run([
        makePathway({ child_id: "yp_alex", status: "attention_needed", overall_readiness: 35 }),
        makePathway({ child_id: "yp_jordan" }),
        makePathway({ child_id: "yp_casey" }),
      ]);
      const medium = result.alerts.filter((a) => a.type === "attention_needed");
      expect(medium).toHaveLength(1);
      expect(medium[0].message).toContain("Alex");
    });

    it("generates medium alert for weak domains (<40% avg)", () => {
      const result = run([
        makePathway({
          child_id: "yp_alex",
          domains: [{ name: "Money Management", score: 3, max_score: 10 }],
        }),
        makePathway({
          child_id: "yp_jordan",
          domains: [{ name: "Money Management", score: 3, max_score: 10 }],
        }),
        makePathway({
          child_id: "yp_casey",
          domains: [{ name: "Money Management", score: 4, max_score: 10 }],
        }),
      ]);
      const weakDomain = result.alerts.filter((a) => a.type === "weak_domains");
      expect(weakDomain.some((a) => a.message.includes("Money Management"))).toBe(true);
    });

    it("generates low alert for children without pathway plan", () => {
      const result = run([
        makePathway({ child_id: "yp_alex", pathway_plan_linked: false }),
        makePathway({ child_id: "yp_jordan", pathway_plan_linked: true }),
        makePathway({ child_id: "yp_casey", pathway_plan_linked: true }),
      ]);
      const low = result.alerts.filter((a) => a.type === "no_pathway_plan");
      expect(low).toHaveLength(1);
      expect(low[0].message).toContain("Alex");
    });
  });

  describe("ARIA insights", () => {
    it("generates warning for unassessed children", () => {
      const result = run([makePathway({ child_id: "yp_alex" })]);
      const warnings = result.insights.filter((i) => i.severity === "warning");
      expect(warnings.some((w) => w.text.includes("without independence pathway assessment"))).toBe(true);
    });

    it("generates warning for low readiness (<40%)", () => {
      const result = run([
        makePathway({ child_id: "yp_alex", overall_readiness: 30 }),
        makePathway({ child_id: "yp_jordan" }),
        makePathway({ child_id: "yp_casey" }),
      ]);
      const warnings = result.insights.filter((i) => i.severity === "warning");
      expect(warnings.some((w) => w.text.includes("Alex") && w.text.includes("30%"))).toBe(true);
    });

    it("generates warning for weak home-wide domains", () => {
      const result = run([
        makePathway({
          child_id: "yp_alex",
          domains: [{ name: "Money", score: 2, max_score: 10 }],
        }),
        makePathway({
          child_id: "yp_jordan",
          domains: [{ name: "Money", score: 3, max_score: 10 }],
        }),
        makePathway({
          child_id: "yp_casey",
          domains: [{ name: "Money", score: 3, max_score: 10 }],
        }),
      ]);
      const warnings = result.insights.filter((i) => i.severity === "warning");
      expect(warnings.some((w) => w.text.includes("Money"))).toBe(true);
    });

    it("generates positive insight for high average readiness (>=60%)", () => {
      const result = run([
        makePathway({ child_id: "yp_alex", overall_readiness: 70 }),
        makePathway({ child_id: "yp_jordan", overall_readiness: 60 }),
        makePathway({ child_id: "yp_casey", overall_readiness: 65 }),
      ]);
      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.some((p) => p.text.includes("65%") && p.text.includes("3 children"))).toBe(true);
    });

    it("generates positive insight when all children assessed", () => {
      const result = run([
        makePathway({ child_id: "yp_alex" }),
        makePathway({ child_id: "yp_jordan" }),
        makePathway({ child_id: "yp_casey" }),
      ]);
      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.some((p) => p.text.includes("All 3 children") && p.text.includes("Reg 14"))).toBe(true);
    });

    it("generates positive insight when all have pathway plans", () => {
      const result = run([
        makePathway({ child_id: "yp_alex", pathway_plan_linked: true }),
        makePathway({ child_id: "yp_jordan", pathway_plan_linked: true }),
        makePathway({ child_id: "yp_casey", pathway_plan_linked: true }),
      ]);
      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.some((p) => p.text.includes("linked pathway plans"))).toBe(true);
    });

    it("generates positive insight for strong domains (>=70%)", () => {
      const result = run([
        makePathway({
          child_id: "yp_alex",
          domains: [{ name: "Personal Care", score: 8, max_score: 10 }],
        }),
        makePathway({
          child_id: "yp_jordan",
          domains: [{ name: "Personal Care", score: 7, max_score: 10 }],
        }),
        makePathway({
          child_id: "yp_casey",
          domains: [{ name: "Personal Care", score: 8, max_score: 10 }],
        }),
      ]);
      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.some((p) => p.text.includes("Personal Care"))).toBe(true);
    });

    it("generates positive insight when all children on track", () => {
      const result = run([
        makePathway({ child_id: "yp_alex", status: "on_track" }),
        makePathway({ child_id: "yp_jordan", status: "on_track" }),
        makePathway({ child_id: "yp_casey", status: "on_track" }),
      ]);
      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.some((p) => p.text.includes("on track") && p.text.includes("Reg 8"))).toBe(true);
    });
  });

  describe("Chamberlain House integration", () => {
    function oakHousePathways(): IndependencePathwayInput[] {
      return [
        {
          id: "ip_001", child_id: "yp_alex", assessed_by: "staff_anna",
          assessment_date: "2026-05-10", review_date: "2026-08-10",
          overall_readiness: 68, status: "on_track", pathway_plan_linked: true,
          domains: [
            { name: "Personal Care", score: 8, max_score: 10 },
            { name: "Cooking & Nutrition", score: 6, max_score: 10 },
            { name: "Money Management", score: 4, max_score: 10 },
            { name: "Home Management", score: 5, max_score: 10 },
            { name: "Social Networks", score: 7, max_score: 10 },
            { name: "Education & Employment", score: 6, max_score: 10 },
            { name: "Emotional Wellbeing", score: 7, max_score: 10 },
            { name: "Practical Skills", score: 7, max_score: 10 },
          ],
        },
        {
          id: "ip_002", child_id: "yp_jordan", assessed_by: "staff_chervelle",
          assessment_date: "2026-05-05", review_date: "2026-08-05",
          overall_readiness: 45, status: "attention_needed", pathway_plan_linked: false,
          domains: [
            { name: "Personal Care", score: 6, max_score: 10 },
            { name: "Cooking & Nutrition", score: 3, max_score: 10 },
            { name: "Money Management", score: 2, max_score: 10 },
            { name: "Home Management", score: 3, max_score: 10 },
            { name: "Social Networks", score: 5, max_score: 10 },
            { name: "Education & Employment", score: 4, max_score: 10 },
            { name: "Emotional Wellbeing", score: 5, max_score: 10 },
            { name: "Practical Skills", score: 4, max_score: 10 },
          ],
        },
        {
          id: "ip_003", child_id: "yp_casey", assessed_by: "staff_anna",
          assessment_date: "2026-05-15", review_date: "2026-08-15",
          overall_readiness: 52, status: "on_track", pathway_plan_linked: false,
          domains: [
            { name: "Personal Care", score: 7, max_score: 10 },
            { name: "Cooking & Nutrition", score: 5, max_score: 10 },
            { name: "Money Management", score: 4, max_score: 10 },
            { name: "Home Management", score: 4, max_score: 10 },
            { name: "Social Networks", score: 6, max_score: 10 },
            { name: "Education & Employment", score: 5, max_score: 10 },
            { name: "Emotional Wellbeing", score: 6, max_score: 10 },
            { name: "Practical Skills", score: 5, max_score: 10 },
          ],
        },
      ];
    }

    it("calculates correct overview for Chamberlain House data", () => {
      const result = run(oakHousePathways());
      expect(result.overview.total_children).toBe(3);
      expect(result.overview.children_assessed).toBe(3);
      expect(result.overview.avg_readiness).toBe(55);
      expect(result.overview.pathway_plans_active).toBe(1);
      expect(result.overview.children_on_track).toBe(2);
      expect(result.overview.children_attention_needed).toBe(1);
    });

    it("identifies 8 skill domains", () => {
      const result = run(oakHousePathways());
      expect(result.overview.domains_count).toBe(8);
      expect(result.domain_averages).toHaveLength(8);
    });

    it("Personal Care is the strongest domain", () => {
      const result = run(oakHousePathways());
      expect(result.domain_averages[0].domain).toBe("Personal Care");
      expect(result.domain_averages[0].avg_pct).toBe(70);
    });

    it("Money Management is the weakest domain", () => {
      const result = run(oakHousePathways());
      const last = result.domain_averages[result.domain_averages.length - 1];
      expect(last.domain).toBe("Money Management");
      expect(last.avg_pct).toBe(33);
    });

    it("Alex has the highest readiness (68%)", () => {
      const result = run(oakHousePathways());
      expect(result.child_profiles[0].child_id).toBe("yp_alex");
      expect(result.child_profiles[0].readiness).toBe(68);
      expect(result.child_profiles[0].strongest_domain).toBe("Personal Care");
    });

    it("Jordan flagged as attention needed with risk flags", () => {
      const result = run(oakHousePathways());
      const jordan = result.child_profiles.find((p) => p.child_id === "yp_jordan")!;
      expect(jordan.status).toBe("attention_needed");
      expect(jordan.risk_flags).toContain("attention_needed");
      expect(jordan.risk_flags).toContain("no_pathway_plan");
    });

    it("generates medium alert for Jordan attention needed", () => {
      const result = run(oakHousePathways());
      const medium = result.alerts.filter((a) => a.type === "attention_needed");
      expect(medium.some((a) => a.message.includes("Jordan"))).toBe(true);
    });

    it("generates medium alert for weak Money Management domain", () => {
      const result = run(oakHousePathways());
      const weak = result.alerts.filter((a) => a.type === "weak_domains");
      expect(weak.some((a) => a.message.includes("Money Management"))).toBe(true);
    });

    it("generates positive insight for all children assessed", () => {
      const result = run(oakHousePathways());
      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.some((p) => p.text.includes("All 3 children") && p.text.includes("Reg 14"))).toBe(true);
    });

    it("generates positive insight for strong Personal Care domain", () => {
      const result = run(oakHousePathways());
      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.some((p) => p.text.includes("Personal Care"))).toBe(true);
    });
  });
});
