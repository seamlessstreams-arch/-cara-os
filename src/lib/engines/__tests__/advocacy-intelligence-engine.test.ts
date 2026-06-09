// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ADVOCACY & CHILDREN'S RIGHTS INTELLIGENCE ENGINE TESTS
// Comprehensive test suite for advocacy referral analysis.
// Covers Reg 7 children's wishes, Reg 14 needs assessment, Reg 45 quality
// of care review, and Children Act 1989 s26 advocacy for LAC.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeAdvocacyIntelligence,
  type AdvocacyInput,
  type ChildRef,
  type StaffRef,
} from "../advocacy-intelligence-engine";

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
function makeReferral(overrides: Partial<AdvocacyInput> = {}): AdvocacyInput {
  _id++;
  return {
    id: `adv_test_${_id}`,
    child_id: "yp_alex",
    advocacy_type: "independent",
    status: "active",
    provider: "NYAS",
    advocate_name: "Sarah Williams",
    referral_date: "2026-05-01",
    start_date: "2026-05-05",
    reason: "LAC review support",
    issues_raised: ["participation"],
    visit_count: 2,
    last_visit_date: "2026-05-15",
    child_view: "Helpful",
    review_date: "2026-06-25",
    ...overrides,
  };
}

function run(referrals: AdvocacyInput[], opts?: { children?: ChildRef[]; staff?: StaffRef[] }) {
  return computeAdvocacyIntelligence({
    referrals,
    children: opts?.children ?? CHILDREN,
    staff: opts?.staff ?? STAFF,
    today: TODAY,
  });
}

// ── Chamberlain House Dataset ───────────────────────────────────────────────────────

function oakHouseReferrals(): AdvocacyInput[] {
  return [
    makeReferral({
      id: "adv_001",
      child_id: "yp_alex",
      advocacy_type: "independent",
      status: "active",
      provider: "NYAS",
      advocate_name: "Sarah Williams",
      referral_date: "2026-04-25",   // -30d
      start_date: "2026-04-30",      // -25d (5 days to start)
      reason: "LAC review support",
      issues_raised: ["participation", "care_plan"],
      visit_count: 2,
      last_visit_date: "2026-05-15", // -10d
      child_view: "Really helpful to have someone listen",
      review_date: "2026-06-25",
    }),
    makeReferral({
      id: "adv_002",
      child_id: "yp_jordan",
      advocacy_type: "issue_based",
      status: "completed",
      provider: "Coram Voice",
      advocate_name: "Mark Taylor",
      referral_date: "2026-02-24",   // -90d
      start_date: "2026-03-01",      // -85d (5 days to start)
      reason: "School exclusion support",
      issues_raised: ["education", "exclusion"],
      visit_count: 3,
      last_visit_date: "2026-04-15", // -40d
      child_view: "Glad someone helped with school",
      review_date: "2026-05-20",     // past today — overdue
    }),
    makeReferral({
      id: "adv_003",
      child_id: "yp_jordan",
      advocacy_type: "complaints",
      status: "active",
      provider: "NYAS",
      advocate_name: "Sarah Williams",
      referral_date: "2026-05-17",   // -8d
      start_date: "2026-05-20",      // -5d (3 days to start)
      reason: "Complaint about activities",
      issues_raised: ["activities", "voice"],
      visit_count: 1,
      last_visit_date: "2026-05-20", // -5d
      child_view: "Wants more say in activities",
      review_date: "2026-06-17",
    }),
    makeReferral({
      id: "adv_004",
      child_id: "yp_casey",
      advocacy_type: "independent",
      status: "pending_referral",
      provider: "Barnardo's",
      advocate_name: "",
      referral_date: "2026-05-13",   // -12d
      start_date: null,
      reason: "Transition planning",
      issues_raised: ["transition"],
      visit_count: 0,
      last_visit_date: null,
      child_view: "Wants help with move-on plan",
      review_date: "2026-06-13",
    }),
    makeReferral({
      id: "adv_005",
      child_id: "yp_alex",
      advocacy_type: "legal",
      status: "completed",
      provider: "Bindmans Solicitors",
      advocate_name: "James Chen",
      referral_date: "2025-11-26",   // -180d
      start_date: "2025-12-01",      // -175d (5 days to start)
      reason: "Care order review",
      issues_raised: ["legal_rights", "care_order"],
      visit_count: 4,
      last_visit_date: "2026-03-01",
      child_view: "Understood my rights better",
      review_date: "2026-03-01",     // past today — overdue
    }),
  ];
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Advocacy Intelligence Engine", () => {

  describe("empty state", () => {
    it("returns safe defaults when no referrals provided", () => {
      const result = run([]);
      expect(result.overview.total_referrals).toBe(0);
      expect(result.overview.active_referrals).toBe(0);
      expect(result.overview.completed_referrals).toBe(0);
      expect(result.overview.pending_referrals).toBe(0);
      expect(result.overview.children_with_active_advocate).toBe(0);
      expect(result.overview.avg_days_to_start).toBe(0);
      expect(result.overview.total_visits).toBe(0);
      expect(result.referral_breakdown).toHaveLength(0);
    });

    it("counts all children as without referral when no referrals exist", () => {
      const result = run([]);
      expect(result.overview.children_without_any_referral).toBe(3);
    });

    it("generates child profiles for all children even with no referrals", () => {
      const result = run([]);
      expect(result.child_advocacy_profiles).toHaveLength(3);
      for (const profile of result.child_advocacy_profiles) {
        expect(profile.total_referrals).toBe(0);
        expect(profile.has_advocate).toBe(false);
        expect(profile.days_since_last_visit).toBeNull();
      }
    });

    it("generates high alerts for every child with no referral history", () => {
      const result = run([]);
      const highAlerts = result.alerts.filter((a) => a.severity === "high");
      expect(highAlerts).toHaveLength(3);
      expect(highAlerts.some((a) => a.message.includes("Alex"))).toBe(true);
      expect(highAlerts.some((a) => a.message.includes("Jordan"))).toBe(true);
      expect(highAlerts.some((a) => a.message.includes("Casey"))).toBe(true);
    });

    it("generates critical insights for every child with no advocacy access", () => {
      const result = run([]);
      const critical = result.insights.filter((i) => i.severity === "critical");
      expect(critical).toHaveLength(3);
      expect(critical.every((i) => i.text.includes("Children Act 1989 s26"))).toBe(true);
    });

    it("returns empty results with no children and no referrals", () => {
      const result = run([], { children: [] });
      expect(result.overview.children_without_any_referral).toBe(0);
      expect(result.child_advocacy_profiles).toHaveLength(0);
      expect(result.alerts).toHaveLength(0);
      expect(result.insights).toHaveLength(0);
    });
  });

  describe("overview metrics", () => {
    it("counts total referrals", () => {
      const result = run(oakHouseReferrals());
      expect(result.overview.total_referrals).toBe(5);
    });

    it("counts active referrals", () => {
      const result = run(oakHouseReferrals());
      expect(result.overview.active_referrals).toBe(2);
    });

    it("counts completed referrals", () => {
      const result = run(oakHouseReferrals());
      expect(result.overview.completed_referrals).toBe(2);
    });

    it("counts pending referrals", () => {
      const result = run(oakHouseReferrals());
      expect(result.overview.pending_referrals).toBe(1);
    });

    it("counts children with active advocate", () => {
      const result = run(oakHouseReferrals());
      // Alex (adv_001) and Jordan (adv_003) have active referrals
      expect(result.overview.children_with_active_advocate).toBe(2);
    });

    it("counts children without any referral", () => {
      const result = run(oakHouseReferrals());
      // Casey has a pending_referral so they DO appear in referrals
      expect(result.overview.children_without_any_referral).toBe(0);
    });

    it("calculates average days to start from referrals with start_date", () => {
      const result = run(oakHouseReferrals());
      // adv_001: 5d, adv_002: 5d, adv_003: 3d, adv_005: 5d (adv_004 has no start_date)
      // (5 + 5 + 3 + 5) / 4 = 4.5 -> 5 (rounded)
      expect(result.overview.avg_days_to_start).toBe(5);
    });

    it("calculates total visits across all referrals", () => {
      const result = run(oakHouseReferrals());
      // 2 + 3 + 1 + 0 + 4 = 10
      expect(result.overview.total_visits).toBe(10);
    });

    it("handles all active referrals", () => {
      const referrals = [
        makeReferral({ status: "active", child_id: "yp_alex" }),
        makeReferral({ status: "active", child_id: "yp_jordan" }),
      ];
      const result = run(referrals);
      expect(result.overview.active_referrals).toBe(2);
      expect(result.overview.completed_referrals).toBe(0);
      expect(result.overview.pending_referrals).toBe(0);
    });

    it("handles avg_days_to_start of 0 when no referrals have start_date", () => {
      const referrals = [
        makeReferral({ start_date: null, status: "pending_referral", referral_date: "2026-05-01" }),
      ];
      const result = run(referrals);
      expect(result.overview.avg_days_to_start).toBe(0);
    });
  });

  describe("referral type breakdown", () => {
    it("groups referrals by type with counts", () => {
      const result = run(oakHouseReferrals());
      expect(result.referral_breakdown.length).toBeGreaterThan(0);
      const independent = result.referral_breakdown.find((b) => b.type === "independent");
      expect(independent).toBeDefined();
      expect(independent!.count).toBe(2); // adv_001 + adv_004
    });

    it("counts active referrals per type", () => {
      const result = run(oakHouseReferrals());
      const independent = result.referral_breakdown.find((b) => b.type === "independent");
      expect(independent!.active_count).toBe(1); // only adv_001 is active
    });

    it("applies correct type labels", () => {
      const result = run(oakHouseReferrals());
      const independent = result.referral_breakdown.find((b) => b.type === "independent");
      expect(independent!.type_label).toBe("Independent");
      const issueBased = result.referral_breakdown.find((b) => b.type === "issue_based");
      expect(issueBased!.type_label).toBe("Issue-Based");
      const complaints = result.referral_breakdown.find((b) => b.type === "complaints");
      expect(complaints!.type_label).toBe("Complaints");
      const legal = result.referral_breakdown.find((b) => b.type === "legal");
      expect(legal!.type_label).toBe("Legal");
    });

    it("sorts by count descending", () => {
      const result = run(oakHouseReferrals());
      // independent: 2, rest: 1 each
      expect(result.referral_breakdown[0].type).toBe("independent");
    });

    it("handles unknown type with auto-label", () => {
      const referrals = [makeReferral({ advocacy_type: "self_advocacy" })];
      const result = run(referrals);
      const selfAdv = result.referral_breakdown.find((b) => b.type === "self_advocacy");
      expect(selfAdv!.type_label).toBe("Self Advocacy");
    });

    it("includes all Chamberlain House types", () => {
      const result = run(oakHouseReferrals());
      const types = result.referral_breakdown.map((b) => b.type);
      expect(types).toContain("independent");
      expect(types).toContain("issue_based");
      expect(types).toContain("complaints");
      expect(types).toContain("legal");
    });
  });

  describe("child advocacy profiles", () => {
    it("generates a profile for every child", () => {
      const result = run(oakHouseReferrals());
      expect(result.child_advocacy_profiles).toHaveLength(3);
    });

    it("aggregates total referrals per child", () => {
      const result = run(oakHouseReferrals());
      const alex = result.child_advocacy_profiles.find((p) => p.child_id === "yp_alex");
      expect(alex!.total_referrals).toBe(2); // adv_001 + adv_005
      const jordan = result.child_advocacy_profiles.find((p) => p.child_id === "yp_jordan");
      expect(jordan!.total_referrals).toBe(2); // adv_002 + adv_003
    });

    it("counts active referrals per child", () => {
      const result = run(oakHouseReferrals());
      const alex = result.child_advocacy_profiles.find((p) => p.child_id === "yp_alex");
      expect(alex!.active_referrals).toBe(1);
      const casey = result.child_advocacy_profiles.find((p) => p.child_id === "yp_casey");
      expect(casey!.active_referrals).toBe(0);
    });

    it("sets has_advocate to true only for children with active referrals", () => {
      const result = run(oakHouseReferrals());
      const alex = result.child_advocacy_profiles.find((p) => p.child_id === "yp_alex");
      expect(alex!.has_advocate).toBe(true);
      const casey = result.child_advocacy_profiles.find((p) => p.child_id === "yp_casey");
      expect(casey!.has_advocate).toBe(false); // pending only
    });

    it("collects unique issues raised across all referrals for a child", () => {
      const result = run(oakHouseReferrals());
      const alex = result.child_advocacy_profiles.find((p) => p.child_id === "yp_alex");
      // adv_001: participation, care_plan; adv_005: legal_rights, care_order
      expect(alex!.issues_raised).toContain("participation");
      expect(alex!.issues_raised).toContain("care_plan");
      expect(alex!.issues_raised).toContain("legal_rights");
      expect(alex!.issues_raised).toContain("care_order");
    });

    it("calculates days_since_last_visit from most recent visit", () => {
      const result = run(oakHouseReferrals());
      const alex = result.child_advocacy_profiles.find((p) => p.child_id === "yp_alex");
      // Alex's most recent visit: 2026-05-15, today: 2026-05-25 = 10 days
      expect(alex!.days_since_last_visit).toBe(10);
    });

    it("returns null days_since_last_visit for child with no visits", () => {
      const referrals = [
        makeReferral({ child_id: "yp_casey", last_visit_date: null, visit_count: 0, status: "pending_referral" }),
      ];
      const result = run(referrals);
      const casey = result.child_advocacy_profiles.find((p) => p.child_id === "yp_casey");
      expect(casey!.days_since_last_visit).toBeNull();
    });

    it("includes child name in profile", () => {
      const result = run(oakHouseReferrals());
      const alex = result.child_advocacy_profiles.find((p) => p.child_id === "yp_alex");
      expect(alex!.child_name).toBe("Alex");
    });
  });

  describe("alerts", () => {
    it("generates high alert for child with no referral history", () => {
      const referrals = [
        makeReferral({ child_id: "yp_alex" }),
        // Jordan and Casey have no referrals
      ];
      const result = run(referrals);
      const highAlerts = result.alerts.filter((a) => a.severity === "high");
      expect(highAlerts.some((a) => a.message.includes("Jordan") && a.message.includes("never had an advocacy referral"))).toBe(true);
      expect(highAlerts.some((a) => a.message.includes("Casey") && a.message.includes("never had an advocacy referral"))).toBe(true);
    });

    it("generates high alert for active referral with no visit in 30+ days", () => {
      const referrals = [
        makeReferral({
          child_id: "yp_alex",
          status: "active",
          last_visit_date: "2026-04-20", // 35 days ago
        }),
      ];
      const result = run(referrals);
      const highAlerts = result.alerts.filter((a) => a.severity === "high");
      expect(highAlerts.some((a) => a.message.includes("Alex") && a.message.includes("35 days"))).toBe(true);
    });

    it("does not generate stale visit alert for completed referral", () => {
      const referrals = [
        makeReferral({
          child_id: "yp_alex",
          status: "completed",
          last_visit_date: "2026-04-01", // 54 days ago but completed
        }),
      ];
      const result = run(referrals);
      const staleVisitAlerts = result.alerts.filter(
        (a) => a.severity === "high" && a.message.includes("No advocate visit")
      );
      expect(staleVisitAlerts).toHaveLength(0);
    });

    it("generates medium alert for pending referral older than 10 days", () => {
      const result = run(oakHouseReferrals());
      // adv_004: pending_referral, referral_date 2026-05-13 = 12 days
      const mediumAlerts = result.alerts.filter((a) => a.severity === "medium");
      expect(mediumAlerts.some((a) => a.message.includes("Casey") && a.message.includes("12 days"))).toBe(true);
    });

    it("does not generate medium alert for pending referral under 10 days", () => {
      const referrals = [
        makeReferral({
          child_id: "yp_casey",
          status: "pending_referral",
          referral_date: "2026-05-20", // 5 days ago
          start_date: null,
        }),
      ];
      const result = run(referrals);
      const pendingAlerts = result.alerts.filter(
        (a) => a.severity === "medium" && a.message.includes("pending")
      );
      expect(pendingAlerts).toHaveLength(0);
    });

    it("generates low alert for overdue review date", () => {
      const result = run(oakHouseReferrals());
      // adv_002 review_date: 2026-05-20, adv_005 review_date: 2026-03-01 — both past today
      const lowAlerts = result.alerts.filter((a) => a.severity === "low");
      expect(lowAlerts.some((a) => a.message.includes("overdue") && a.message.includes("Jordan"))).toBe(true);
      expect(lowAlerts.some((a) => a.message.includes("overdue") && a.message.includes("Alex"))).toBe(true);
    });

    it("does not generate low alert for future review date", () => {
      const referrals = [
        makeReferral({ review_date: "2026-06-30" }),
      ];
      const result = run(referrals);
      const lowAlerts = result.alerts.filter((a) => a.severity === "low");
      expect(lowAlerts).toHaveLength(0);
    });

    it("sorts alerts by severity (high first, low last)", () => {
      const result = run(oakHouseReferrals());
      if (result.alerts.length >= 2) {
        const severities = result.alerts.map((a) => a.severity);
        const order = { critical: 0, high: 1, medium: 2, low: 3 };
        for (let i = 1; i < severities.length; i++) {
          expect(order[severities[i]]).toBeGreaterThanOrEqual(order[severities[i - 1]]);
        }
      }
    });
  });

  describe("insights", () => {
    it("generates critical insight for child with no advocacy access", () => {
      const referrals = [makeReferral({ child_id: "yp_alex" })];
      const result = run(referrals);
      const critical = result.insights.filter((i) => i.severity === "critical");
      expect(critical.some((i) => i.text.includes("Jordan") && i.text.includes("Children Act 1989 s26"))).toBe(true);
    });

    it("generates warning insight for stale advocate visits", () => {
      const referrals = [
        makeReferral({
          child_id: "yp_alex",
          status: "active",
          last_visit_date: "2026-04-20", // 35 days ago
        }),
      ];
      const result = run(referrals);
      const warnings = result.insights.filter((i) => i.severity === "warning");
      expect(warnings.some((i) => i.text.includes("Alex") && i.text.includes("35 days") && i.text.includes("lapsing"))).toBe(true);
    });

    it("generates warning insight for pending referral over 10 days", () => {
      const result = run(oakHouseReferrals());
      const warnings = result.insights.filter((i) => i.severity === "warning");
      expect(warnings.some((i) => i.text.includes("Casey") && i.text.includes("pending") && i.text.includes("12 days"))).toBe(true);
    });

    it("generates warning insight for overdue review", () => {
      const result = run(oakHouseReferrals());
      const warnings = result.insights.filter((i) => i.severity === "warning");
      expect(warnings.some((i) => i.text.includes("overdue") && i.text.includes("Reg 45"))).toBe(true);
    });

    it("generates positive insight when all children have referral history", () => {
      const referrals = [
        makeReferral({ child_id: "yp_alex" }),
        makeReferral({ child_id: "yp_jordan" }),
        makeReferral({ child_id: "yp_casey" }),
      ];
      const result = run(referrals);
      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.some((i) => i.text.includes("All children have advocacy referral history"))).toBe(true);
    });

    it("generates positive insight when every child has active advocate", () => {
      const referrals = [
        makeReferral({ child_id: "yp_alex", status: "active" }),
        makeReferral({ child_id: "yp_jordan", status: "active" }),
        makeReferral({ child_id: "yp_casey", status: "active" }),
      ];
      const result = run(referrals);
      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.some((i) => i.text.includes("Every child has an active advocate"))).toBe(true);
    });

    it("generates positive insight when all active referrals have recent visits", () => {
      const referrals = [
        makeReferral({ child_id: "yp_alex", status: "active", last_visit_date: "2026-05-20" }),
        makeReferral({ child_id: "yp_jordan", status: "active", last_visit_date: "2026-05-22" }),
      ];
      const result = run(referrals);
      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.some((i) => i.text.includes("recent visits") && i.text.includes("actively engaged"))).toBe(true);
    });

    it("does not generate recent visits positive insight when visits are stale", () => {
      const referrals = [
        makeReferral({ child_id: "yp_alex", status: "active", last_visit_date: "2026-04-01" }),
      ];
      const result = run(referrals);
      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.some((i) => i.text.includes("recent visits"))).toBe(false);
    });

    it("generates positive insight for completed referrals", () => {
      const referrals = [
        makeReferral({ child_id: "yp_alex", status: "completed" }),
        makeReferral({ child_id: "yp_jordan", status: "completed" }),
      ];
      const result = run(referrals);
      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.some((i) => i.text.includes("2 advocacy referrals completed"))).toBe(true);
    });

    it("uses singular text for single completed referral", () => {
      const referrals = [
        makeReferral({ child_id: "yp_alex", status: "completed" }),
      ];
      const result = run(referrals);
      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.some((i) => i.text.includes("1 advocacy referral completed"))).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("handles single referral", () => {
      const referrals = [makeReferral()];
      const result = run(referrals);
      expect(result.overview.total_referrals).toBe(1);
      expect(result.referral_breakdown).toHaveLength(1);
      expect(result.child_advocacy_profiles).toHaveLength(3);
    });

    it("handles all declined_by_yp status", () => {
      const referrals = [
        makeReferral({ child_id: "yp_alex", status: "declined_by_yp" }),
        makeReferral({ child_id: "yp_jordan", status: "declined_by_yp" }),
      ];
      const result = run(referrals);
      expect(result.overview.active_referrals).toBe(0);
      expect(result.overview.completed_referrals).toBe(0);
      expect(result.overview.pending_referrals).toBe(0);
      // They still have referral history
      expect(result.overview.children_without_any_referral).toBe(1); // Casey has none
    });

    it("handles child not in children list but in referrals", () => {
      const referrals = [
        makeReferral({ child_id: "yp_unknown" }),
      ];
      const result = run(referrals);
      // Unknown child not in profiles since profiles are based on children list
      expect(result.child_advocacy_profiles).toHaveLength(3);
      // But they count in overview
      expect(result.overview.total_referrals).toBe(1);
    });

    it("handles referrals with zero visit count", () => {
      const referrals = [
        makeReferral({ visit_count: 0, last_visit_date: null }),
      ];
      const result = run(referrals);
      expect(result.overview.total_visits).toBe(0);
    });

    it("handles many referrals for one child", () => {
      const referrals = [
        makeReferral({ child_id: "yp_alex", advocacy_type: "independent", status: "active" }),
        makeReferral({ child_id: "yp_alex", advocacy_type: "legal", status: "completed" }),
        makeReferral({ child_id: "yp_alex", advocacy_type: "complaints", status: "active" }),
        makeReferral({ child_id: "yp_alex", advocacy_type: "peer", status: "completed" }),
      ];
      const result = run(referrals);
      const alex = result.child_advocacy_profiles.find((p) => p.child_id === "yp_alex");
      expect(alex!.total_referrals).toBe(4);
      expect(alex!.active_referrals).toBe(2);
      expect(alex!.has_advocate).toBe(true);
    });
  });

  describe("Chamberlain House integration", () => {
    it("produces correct overview for full Chamberlain House dataset", () => {
      const result = run(oakHouseReferrals());
      expect(result.overview.total_referrals).toBe(5);
      expect(result.overview.active_referrals).toBe(2);
      expect(result.overview.completed_referrals).toBe(2);
      expect(result.overview.pending_referrals).toBe(1);
      expect(result.overview.children_with_active_advocate).toBe(2);
      expect(result.overview.children_without_any_referral).toBe(0);
      expect(result.overview.total_visits).toBe(10);
    });

    it("produces 4 referral types in breakdown", () => {
      const result = run(oakHouseReferrals());
      expect(result.referral_breakdown).toHaveLength(4);
    });

    it("produces profiles for all 3 children", () => {
      const result = run(oakHouseReferrals());
      expect(result.child_advocacy_profiles).toHaveLength(3);
    });

    it("generates medium alert for Casey pending referral", () => {
      const result = run(oakHouseReferrals());
      const medium = result.alerts.filter((a) => a.severity === "medium");
      expect(medium).toHaveLength(1);
      expect(medium[0].message).toContain("Casey");
      expect(medium[0].message).toContain("12 days");
    });

    it("generates low alerts for overdue reviews", () => {
      const result = run(oakHouseReferrals());
      const low = result.alerts.filter((a) => a.severity === "low");
      expect(low).toHaveLength(2); // adv_002 and adv_005
    });

    it("generates no critical or high alerts for well-covered dataset", () => {
      const result = run(oakHouseReferrals());
      // All children have referral history, no stale active visits
      const criticalOrHigh = result.alerts.filter(
        (a) => a.severity === "critical" || a.severity === "high"
      );
      expect(criticalOrHigh).toHaveLength(0);
    });

    it("generates positive insight for completed referrals", () => {
      const result = run(oakHouseReferrals());
      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.some((i) => i.text.includes("2 advocacy referrals completed"))).toBe(true);
    });

    it("generates positive insight for all children having referral history", () => {
      const result = run(oakHouseReferrals());
      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.some((i) => i.text.includes("All children have advocacy referral history"))).toBe(true);
    });

    it("generates warning insights for overdue reviews", () => {
      const result = run(oakHouseReferrals());
      const warnings = result.insights.filter((i) => i.severity === "warning");
      expect(warnings.some((i) => i.text.includes("overdue") && i.text.includes("Reg 45"))).toBe(true);
    });

    it("generates positive recent visits insight for active referrals", () => {
      const result = run(oakHouseReferrals());
      const positive = result.insights.filter((i) => i.severity === "positive");
      // adv_001 last_visit 10d ago, adv_003 last_visit 5d ago — both within 30d
      expect(positive.some((i) => i.text.includes("recent visits"))).toBe(true);
    });
  });
});
