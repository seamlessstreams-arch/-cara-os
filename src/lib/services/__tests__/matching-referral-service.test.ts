// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — MATCHING & REFERRAL SERVICE TESTS
// Pure-function unit tests for referral metrics computation,
// alert identification, constant validation, and CRUD fallback behaviour
// (Supabase disabled). CHR 2015 Reg 8 (placement plans — matching),
// Reg 9 (quality of care — matching), Reg 14 (healthcare — matching).
// SCCIF: Overall Experiences — "Children are carefully matched to the home."
// "Impact on existing children is considered."
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeAll } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => false,
  createServerClient: () => null,
}));

import {
  _testing,
  REFERRAL_STATUSES,
  DECLINE_REASONS,
  MATCHING_CRITERIA,
  IMPACT_LEVELS,
} from "../matching-referral-service";

import type {
  Referral,
  ReferralStatus,
  DeclineReason,
  MatchingCriteria as MatchingCriteriaType,
  ImpactLevel,
} from "../matching-referral-service";

import {
  listReferrals,
  createReferral,
  updateReferral,
} from "../matching-referral-service";

const { computeReferralMetrics, identifyReferralAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

const now = new Date(new Date().toISOString().split("T")[0]);

/** Build a minimal Referral with sensible defaults. */
function makeReferral(overrides: Partial<Referral> = {}): Referral {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    home_id: overrides.home_id ?? "home-1",
    child_name: overrides.child_name ?? "Test Child",
    child_age: overrides.child_age ?? 12,
    placing_authority: overrides.placing_authority ?? "Gotham City Council",
    social_worker_name: overrides.social_worker_name ?? "Jane Doe",
    referral_date: overrides.referral_date ?? "2026-05-01",
    status: overrides.status ?? "received",
    decline_reason: overrides.decline_reason ?? null,
    matching_criteria_met: overrides.matching_criteria_met ?? ["age_range", "gender"],
    matching_criteria_concerns: overrides.matching_criteria_concerns ?? [],
    impact_on_existing: overrides.impact_on_existing ?? "neutral",
    impact_assessment_completed: overrides.impact_assessment_completed ?? true,
    existing_children_consulted: overrides.existing_children_consulted ?? true,
    staff_views_sought: overrides.staff_views_sought ?? true,
    trial_visit_completed: overrides.trial_visit_completed ?? false,
    decision_date: overrides.decision_date ?? null,
    decision_by: overrides.decision_by ?? null,
    admission_date: overrides.admission_date ?? null,
    notes: overrides.notes ?? null,
    created_at: overrides.created_at ?? "2026-05-01T00:00:00Z",
    updated_at: overrides.updated_at ?? "2026-05-01T00:00:00Z",
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. computeReferralMetrics
// ══════════════════════════════════════════════════════════════════════════════

describe("computeReferralMetrics", () => {
  // ── Empty inputs ────────────────────────────────────────────────────────

  describe("empty inputs", () => {
    it("returns zeros for all counts when given empty array", () => {
      const m = computeReferralMetrics([]);
      expect(m.total_referrals).toBe(0);
      expect(m.received_count).toBe(0);
      expect(m.under_assessment_count).toBe(0);
      expect(m.accepted_count).toBe(0);
      expect(m.declined_count).toBe(0);
      expect(m.withdrawn_count).toBe(0);
      expect(m.admitted_count).toBe(0);
    });

    it("returns 0 acceptance_rate for empty array", () => {
      expect(computeReferralMetrics([]).acceptance_rate).toBe(0);
    });

    it("returns 0 impact_assessment_rate for empty array", () => {
      expect(computeReferralMetrics([]).impact_assessment_rate).toBe(0);
    });

    it("returns 0 existing_children_consulted_rate for empty array", () => {
      expect(computeReferralMetrics([]).existing_children_consulted_rate).toBe(0);
    });

    it("returns 0 staff_views_sought_rate for empty array", () => {
      expect(computeReferralMetrics([]).staff_views_sought_rate).toBe(0);
    });

    it("returns 0 trial_visits_completed for empty array", () => {
      expect(computeReferralMetrics([]).trial_visits_completed).toBe(0);
    });

    it("returns 0 matching_concerns_count for empty array", () => {
      expect(computeReferralMetrics([]).matching_concerns_count).toBe(0);
    });

    it("returns empty by_status for empty array", () => {
      expect(computeReferralMetrics([]).by_status).toEqual({});
    });

    it("returns empty by_decline_reason for empty array", () => {
      expect(computeReferralMetrics([]).by_decline_reason).toEqual({});
    });

    it("returns empty by_impact_level for empty array", () => {
      expect(computeReferralMetrics([]).by_impact_level).toEqual({});
    });

    it("returns empty by_placing_authority for empty array", () => {
      expect(computeReferralMetrics([]).by_placing_authority).toEqual({});
    });
  });

  // ── Single referral ─────────────────────────────────────────────────────

  describe("single referral", () => {
    it("counts a single received referral", () => {
      const m = computeReferralMetrics([makeReferral({ status: "received" })]);
      expect(m.total_referrals).toBe(1);
      expect(m.received_count).toBe(1);
    });

    it("counts a single accepted referral in accepted_count", () => {
      const m = computeReferralMetrics([makeReferral({ status: "accepted" })]);
      expect(m.accepted_count).toBe(1);
    });

    it("counts a single admitted referral in both accepted_count and admitted_count", () => {
      const m = computeReferralMetrics([makeReferral({ status: "admitted" })]);
      expect(m.accepted_count).toBe(1);
      expect(m.admitted_count).toBe(1);
    });

    it("counts a single declined referral", () => {
      const m = computeReferralMetrics([makeReferral({ status: "declined" })]);
      expect(m.declined_count).toBe(1);
    });

    it("counts a single withdrawn referral", () => {
      const m = computeReferralMetrics([makeReferral({ status: "withdrawn" })]);
      expect(m.withdrawn_count).toBe(1);
    });

    it("counts a single under_assessment referral", () => {
      const m = computeReferralMetrics([makeReferral({ status: "under_assessment" })]);
      expect(m.under_assessment_count).toBe(1);
    });
  });

  // ── Multiple referrals ──────────────────────────────────────────────────

  describe("multiple referrals", () => {
    it("counts total_referrals across all statuses", () => {
      const refs = [
        makeReferral({ status: "received" }),
        makeReferral({ status: "accepted" }),
        makeReferral({ status: "declined" }),
        makeReferral({ status: "admitted" }),
        makeReferral({ status: "withdrawn" }),
      ];
      expect(computeReferralMetrics(refs).total_referrals).toBe(5);
    });

    it("counts received and under_assessment separately", () => {
      const refs = [
        makeReferral({ status: "received" }),
        makeReferral({ status: "received" }),
        makeReferral({ status: "under_assessment" }),
      ];
      const m = computeReferralMetrics(refs);
      expect(m.received_count).toBe(2);
      expect(m.under_assessment_count).toBe(1);
    });

    it("counts accepted including admitted in accepted_count", () => {
      const refs = [
        makeReferral({ status: "accepted" }),
        makeReferral({ status: "admitted" }),
        makeReferral({ status: "admitted" }),
      ];
      const m = computeReferralMetrics(refs);
      expect(m.accepted_count).toBe(3);
      expect(m.admitted_count).toBe(2);
    });
  });

  // ── All statuses ────────────────────────────────────────────────────────

  describe("all statuses", () => {
    it("handles received status", () => {
      const m = computeReferralMetrics([makeReferral({ status: "received" })]);
      expect(m.by_status.received).toBe(1);
    });

    it("handles under_assessment status", () => {
      const m = computeReferralMetrics([makeReferral({ status: "under_assessment" })]);
      expect(m.by_status.under_assessment).toBe(1);
    });

    it("handles matching_in_progress status", () => {
      const m = computeReferralMetrics([makeReferral({ status: "matching_in_progress" })]);
      expect(m.by_status.matching_in_progress).toBe(1);
    });

    it("handles accepted status", () => {
      const m = computeReferralMetrics([makeReferral({ status: "accepted" })]);
      expect(m.by_status.accepted).toBe(1);
    });

    it("handles declined status", () => {
      const m = computeReferralMetrics([makeReferral({ status: "declined" })]);
      expect(m.by_status.declined).toBe(1);
    });

    it("handles withdrawn status", () => {
      const m = computeReferralMetrics([makeReferral({ status: "withdrawn" })]);
      expect(m.by_status.withdrawn).toBe(1);
    });

    it("handles on_hold status", () => {
      const m = computeReferralMetrics([makeReferral({ status: "on_hold" })]);
      expect(m.by_status.on_hold).toBe(1);
    });

    it("handles admitted status", () => {
      const m = computeReferralMetrics([makeReferral({ status: "admitted" })]);
      expect(m.by_status.admitted).toBe(1);
    });

    it("tracks all 8 statuses in by_status when all present", () => {
      const statuses: ReferralStatus[] = [
        "received", "under_assessment", "matching_in_progress",
        "accepted", "declined", "withdrawn", "on_hold", "admitted",
      ];
      const refs = statuses.map((s) => makeReferral({ status: s }));
      const m = computeReferralMetrics(refs);
      expect(Object.keys(m.by_status)).toHaveLength(8);
    });
  });

  // ── acceptance_rate ─────────────────────────────────────────────────────

  describe("acceptance_rate", () => {
    it("returns 0 when no decided referrals (no accepted and no declined)", () => {
      const refs = [
        makeReferral({ status: "received" }),
        makeReferral({ status: "withdrawn" }),
      ];
      expect(computeReferralMetrics(refs).acceptance_rate).toBe(0);
    });

    it("returns 100 when all decided referrals are accepted", () => {
      const refs = [
        makeReferral({ status: "accepted" }),
        makeReferral({ status: "admitted" }),
      ];
      expect(computeReferralMetrics(refs).acceptance_rate).toBe(100);
    });

    it("returns 0 when all decided referrals are declined", () => {
      const refs = [
        makeReferral({ status: "declined" }),
        makeReferral({ status: "declined" }),
      ];
      expect(computeReferralMetrics(refs).acceptance_rate).toBe(0);
    });

    it("computes accepted/(accepted+declined)*100 correctly for 2/3", () => {
      // accepted_count includes admitted: accepted + admitted = 2
      // declined: 1
      // rate = 2/3 * 100 = 66.7
      const refs = [
        makeReferral({ status: "accepted" }),
        makeReferral({ status: "admitted" }),
        makeReferral({ status: "declined" }),
      ];
      expect(computeReferralMetrics(refs).acceptance_rate).toBe(66.7);
    });

    it("computes 50/50 split correctly", () => {
      const refs = [
        makeReferral({ status: "accepted" }),
        makeReferral({ status: "declined" }),
      ];
      expect(computeReferralMetrics(refs).acceptance_rate).toBe(50);
    });

    it("handles 1/3 split with correct rounding", () => {
      // 1 accepted, 2 declined => 1/3 * 100 = 33.3
      const refs = [
        makeReferral({ status: "accepted" }),
        makeReferral({ status: "declined" }),
        makeReferral({ status: "declined" }),
      ];
      expect(computeReferralMetrics(refs).acceptance_rate).toBe(33.3);
    });

    it("admitted counts as accepted in acceptance_rate denominator", () => {
      // admitted = 1 (counted in accepted=1), declined = 1
      // rate = 1/2 * 100 = 50
      const refs = [
        makeReferral({ status: "admitted" }),
        makeReferral({ status: "declined" }),
      ];
      expect(computeReferralMetrics(refs).acceptance_rate).toBe(50);
    });

    it("ignores received/under_assessment/withdrawn/on_hold in rate calc", () => {
      const refs = [
        makeReferral({ status: "accepted" }),
        makeReferral({ status: "declined" }),
        makeReferral({ status: "received" }),
        makeReferral({ status: "under_assessment" }),
        makeReferral({ status: "withdrawn" }),
        makeReferral({ status: "on_hold" }),
        makeReferral({ status: "matching_in_progress" }),
      ];
      // decided: 1 accepted + 1 declined = 2, rate = 50
      expect(computeReferralMetrics(refs).acceptance_rate).toBe(50);
    });

    it("rounds 1/7 correctly to 14.3", () => {
      const refs = [
        makeReferral({ status: "accepted" }),
        ...Array.from({ length: 6 }, () => makeReferral({ status: "declined" })),
      ];
      expect(computeReferralMetrics(refs).acceptance_rate).toBe(14.3);
    });

    it("rounds 5/6 correctly to 83.3", () => {
      const refs = [
        ...Array.from({ length: 5 }, () => makeReferral({ status: "accepted" })),
        makeReferral({ status: "declined" }),
      ];
      expect(computeReferralMetrics(refs).acceptance_rate).toBe(83.3);
    });
  });

  // ── impact_assessment_rate ──────────────────────────────────────────────

  describe("impact_assessment_rate", () => {
    it("returns 100 when all have impact assessments completed", () => {
      const refs = [
        makeReferral({ impact_assessment_completed: true }),
        makeReferral({ impact_assessment_completed: true }),
      ];
      expect(computeReferralMetrics(refs).impact_assessment_rate).toBe(100);
    });

    it("returns 0 when none have impact assessments completed", () => {
      const refs = [
        makeReferral({ impact_assessment_completed: false }),
        makeReferral({ impact_assessment_completed: false }),
      ];
      expect(computeReferralMetrics(refs).impact_assessment_rate).toBe(0);
    });

    it("computes 50% correctly", () => {
      const refs = [
        makeReferral({ impact_assessment_completed: true }),
        makeReferral({ impact_assessment_completed: false }),
      ];
      expect(computeReferralMetrics(refs).impact_assessment_rate).toBe(50);
    });

    it("computes 1/3 with correct rounding", () => {
      const refs = [
        makeReferral({ impact_assessment_completed: true }),
        makeReferral({ impact_assessment_completed: false }),
        makeReferral({ impact_assessment_completed: false }),
      ];
      expect(computeReferralMetrics(refs).impact_assessment_rate).toBe(33.3);
    });

    it("tracks impact_assessments_completed as raw count", () => {
      const refs = [
        makeReferral({ impact_assessment_completed: true }),
        makeReferral({ impact_assessment_completed: true }),
        makeReferral({ impact_assessment_completed: false }),
      ];
      expect(computeReferralMetrics(refs).impact_assessments_completed).toBe(2);
    });
  });

  // ── existing_children_consulted_rate ─────────────────────────────────────

  describe("existing_children_consulted_rate", () => {
    it("returns 100 when all children consulted", () => {
      const refs = [
        makeReferral({ existing_children_consulted: true }),
        makeReferral({ existing_children_consulted: true }),
      ];
      expect(computeReferralMetrics(refs).existing_children_consulted_rate).toBe(100);
    });

    it("returns 0 when no children consulted", () => {
      const refs = [
        makeReferral({ existing_children_consulted: false }),
        makeReferral({ existing_children_consulted: false }),
      ];
      expect(computeReferralMetrics(refs).existing_children_consulted_rate).toBe(0);
    });

    it("computes correctly for mixed values", () => {
      const refs = [
        makeReferral({ existing_children_consulted: true }),
        makeReferral({ existing_children_consulted: false }),
        makeReferral({ existing_children_consulted: true }),
      ];
      expect(computeReferralMetrics(refs).existing_children_consulted_rate).toBe(66.7);
    });
  });

  // ── staff_views_sought_rate ─────────────────────────────────────────────

  describe("staff_views_sought_rate", () => {
    it("returns 100 when all staff views sought", () => {
      const refs = [
        makeReferral({ staff_views_sought: true }),
        makeReferral({ staff_views_sought: true }),
      ];
      expect(computeReferralMetrics(refs).staff_views_sought_rate).toBe(100);
    });

    it("returns 0 when no staff views sought", () => {
      const refs = [
        makeReferral({ staff_views_sought: false }),
        makeReferral({ staff_views_sought: false }),
      ];
      expect(computeReferralMetrics(refs).staff_views_sought_rate).toBe(0);
    });

    it("computes correctly for mixed values", () => {
      const refs = [
        makeReferral({ staff_views_sought: true }),
        makeReferral({ staff_views_sought: false }),
      ];
      expect(computeReferralMetrics(refs).staff_views_sought_rate).toBe(50);
    });
  });

  // ── trial_visits_completed ──────────────────────────────────────────────

  describe("trial_visits_completed", () => {
    it("counts completed trial visits", () => {
      const refs = [
        makeReferral({ trial_visit_completed: true }),
        makeReferral({ trial_visit_completed: true }),
        makeReferral({ trial_visit_completed: false }),
      ];
      expect(computeReferralMetrics(refs).trial_visits_completed).toBe(2);
    });

    it("returns 0 when no trial visits completed", () => {
      const refs = [
        makeReferral({ trial_visit_completed: false }),
        makeReferral({ trial_visit_completed: false }),
      ];
      expect(computeReferralMetrics(refs).trial_visits_completed).toBe(0);
    });
  });

  // ── matching_concerns_count ─────────────────────────────────────────────

  describe("matching_concerns_count", () => {
    it("counts referrals with matching concerns", () => {
      const refs = [
        makeReferral({ matching_criteria_concerns: ["risk_compatibility"] }),
        makeReferral({ matching_criteria_concerns: ["peer_dynamics", "age_range"] }),
        makeReferral({ matching_criteria_concerns: [] }),
      ];
      expect(computeReferralMetrics(refs).matching_concerns_count).toBe(2);
    });

    it("returns 0 when no referrals have concerns", () => {
      const refs = [
        makeReferral({ matching_criteria_concerns: [] }),
        makeReferral({ matching_criteria_concerns: [] }),
      ];
      expect(computeReferralMetrics(refs).matching_concerns_count).toBe(0);
    });

    it("counts each referral only once regardless of number of concerns", () => {
      const refs = [
        makeReferral({
          matching_criteria_concerns: [
            "risk_compatibility", "peer_dynamics", "age_range",
            "emotional_needs", "behavioural_needs",
          ],
        }),
      ];
      expect(computeReferralMetrics(refs).matching_concerns_count).toBe(1);
    });
  });

  // ── by_status ───────────────────────────────────────────────────────────

  describe("by_status", () => {
    it("groups referrals by their status", () => {
      const refs = [
        makeReferral({ status: "received" }),
        makeReferral({ status: "received" }),
        makeReferral({ status: "accepted" }),
        makeReferral({ status: "declined" }),
      ];
      const m = computeReferralMetrics(refs);
      expect(m.by_status.received).toBe(2);
      expect(m.by_status.accepted).toBe(1);
      expect(m.by_status.declined).toBe(1);
    });

    it("does not include statuses not present in data", () => {
      const refs = [makeReferral({ status: "received" })];
      const m = computeReferralMetrics(refs);
      expect(m.by_status.accepted).toBeUndefined();
      expect(m.by_status.declined).toBeUndefined();
    });
  });

  // ── by_decline_reason ───────────────────────────────────────────────────

  describe("by_decline_reason", () => {
    it("groups declined referrals by decline_reason", () => {
      const refs = [
        makeReferral({ decline_reason: "no_vacancy" }),
        makeReferral({ decline_reason: "no_vacancy" }),
        makeReferral({ decline_reason: "matching_concerns" }),
      ];
      const m = computeReferralMetrics(refs);
      expect(m.by_decline_reason.no_vacancy).toBe(2);
      expect(m.by_decline_reason.matching_concerns).toBe(1);
    });

    it("ignores referrals with null decline_reason", () => {
      const refs = [
        makeReferral({ decline_reason: "no_vacancy" }),
        makeReferral({ decline_reason: null }),
      ];
      const m = computeReferralMetrics(refs);
      expect(Object.keys(m.by_decline_reason)).toHaveLength(1);
    });

    it("tracks all 8 decline reasons when present", () => {
      const reasons: DeclineReason[] = [
        "no_vacancy", "matching_concerns", "impact_on_current",
        "needs_beyond_capability", "age_inappropriate", "safeguarding_risk",
        "location_unsuitable", "other",
      ];
      const refs = reasons.map((r) => makeReferral({ decline_reason: r }));
      const m = computeReferralMetrics(refs);
      expect(Object.keys(m.by_decline_reason)).toHaveLength(8);
      for (const r of reasons) {
        expect(m.by_decline_reason[r]).toBe(1);
      }
    });
  });

  // ── by_impact_level ─────────────────────────────────────────────────────

  describe("by_impact_level", () => {
    it("groups referrals by impact_on_existing", () => {
      const refs = [
        makeReferral({ impact_on_existing: "positive" }),
        makeReferral({ impact_on_existing: "neutral" }),
        makeReferral({ impact_on_existing: "neutral" }),
        makeReferral({ impact_on_existing: "significant_concern" }),
      ];
      const m = computeReferralMetrics(refs);
      expect(m.by_impact_level.positive).toBe(1);
      expect(m.by_impact_level.neutral).toBe(2);
      expect(m.by_impact_level.significant_concern).toBe(1);
    });

    it("tracks all 5 impact levels when present", () => {
      const levels: ImpactLevel[] = [
        "positive", "neutral", "minor_concern", "significant_concern", "not_assessed",
      ];
      const refs = levels.map((l) => makeReferral({ impact_on_existing: l }));
      const m = computeReferralMetrics(refs);
      expect(Object.keys(m.by_impact_level)).toHaveLength(5);
    });
  });

  // ── by_placing_authority ────────────────────────────────────────────────

  describe("by_placing_authority", () => {
    it("groups referrals by placing_authority", () => {
      const refs = [
        makeReferral({ placing_authority: "Council A" }),
        makeReferral({ placing_authority: "Council A" }),
        makeReferral({ placing_authority: "Council B" }),
      ];
      const m = computeReferralMetrics(refs);
      expect(m.by_placing_authority["Council A"]).toBe(2);
      expect(m.by_placing_authority["Council B"]).toBe(1);
    });

    it("returns empty when no referrals", () => {
      expect(computeReferralMetrics([]).by_placing_authority).toEqual({});
    });

    it("handles a single authority with many referrals", () => {
      const refs = Array.from({ length: 7 }, () =>
        makeReferral({ placing_authority: "Same Authority" }),
      );
      const m = computeReferralMetrics(refs);
      expect(m.by_placing_authority["Same Authority"]).toBe(7);
      expect(Object.keys(m.by_placing_authority)).toHaveLength(1);
    });
  });

  // ── Combined scenario ──────────────────────────────────────────────────

  describe("combined scenario", () => {
    it("computes all metrics correctly for a realistic dataset", () => {
      const refs = [
        makeReferral({
          status: "received",
          impact_assessment_completed: false,
          existing_children_consulted: false,
          staff_views_sought: false,
          trial_visit_completed: false,
          matching_criteria_concerns: ["risk_compatibility"],
          placing_authority: "Council A",
        }),
        makeReferral({
          status: "under_assessment",
          impact_assessment_completed: true,
          existing_children_consulted: true,
          staff_views_sought: true,
          trial_visit_completed: false,
          matching_criteria_concerns: [],
          placing_authority: "Council A",
        }),
        makeReferral({
          status: "accepted",
          impact_assessment_completed: true,
          existing_children_consulted: true,
          staff_views_sought: true,
          trial_visit_completed: true,
          matching_criteria_concerns: [],
          placing_authority: "Council B",
        }),
        makeReferral({
          status: "admitted",
          impact_assessment_completed: true,
          existing_children_consulted: true,
          staff_views_sought: true,
          trial_visit_completed: true,
          matching_criteria_concerns: [],
          placing_authority: "Council B",
        }),
        makeReferral({
          status: "declined",
          decline_reason: "no_vacancy",
          impact_assessment_completed: true,
          existing_children_consulted: false,
          staff_views_sought: false,
          trial_visit_completed: false,
          matching_criteria_concerns: ["peer_dynamics"],
          placing_authority: "Council C",
        }),
        makeReferral({
          status: "withdrawn",
          impact_assessment_completed: false,
          existing_children_consulted: false,
          staff_views_sought: false,
          trial_visit_completed: false,
          matching_criteria_concerns: [],
          placing_authority: "Council C",
        }),
      ];

      const m = computeReferralMetrics(refs);
      expect(m.total_referrals).toBe(6);
      expect(m.received_count).toBe(1);
      expect(m.under_assessment_count).toBe(1);
      // accepted_count includes accepted + admitted
      expect(m.accepted_count).toBe(2);
      expect(m.declined_count).toBe(1);
      expect(m.withdrawn_count).toBe(1);
      expect(m.admitted_count).toBe(1);
      // acceptance_rate: accepted(2) / (accepted(2) + declined(1)) = 66.7
      expect(m.acceptance_rate).toBe(66.7);
      // impact: 4 out of 6 completed
      expect(m.impact_assessments_completed).toBe(4);
      expect(m.impact_assessment_rate).toBe(66.7);
      // consulted: 3 out of 6
      expect(m.existing_children_consulted_rate).toBe(50);
      // staff views: 3 out of 6
      expect(m.staff_views_sought_rate).toBe(50);
      // trial visits: 2
      expect(m.trial_visits_completed).toBe(2);
      // matching concerns: 2 referrals have non-empty concerns
      expect(m.matching_concerns_count).toBe(2);
      // authorities
      expect(m.by_placing_authority["Council A"]).toBe(2);
      expect(m.by_placing_authority["Council B"]).toBe(2);
      expect(m.by_placing_authority["Council C"]).toBe(2);
      // decline reasons
      expect(m.by_decline_reason.no_vacancy).toBe(1);
    });
  });

  // ── Return type structure ──────────────────────────────────────────────

  describe("return type structure", () => {
    it("returns all 18 expected keys", () => {
      const m = computeReferralMetrics([]);
      const keys = Object.keys(m);
      expect(keys).toContain("total_referrals");
      expect(keys).toContain("received_count");
      expect(keys).toContain("under_assessment_count");
      expect(keys).toContain("accepted_count");
      expect(keys).toContain("declined_count");
      expect(keys).toContain("withdrawn_count");
      expect(keys).toContain("admitted_count");
      expect(keys).toContain("acceptance_rate");
      expect(keys).toContain("impact_assessments_completed");
      expect(keys).toContain("impact_assessment_rate");
      expect(keys).toContain("existing_children_consulted_rate");
      expect(keys).toContain("staff_views_sought_rate");
      expect(keys).toContain("trial_visits_completed");
      expect(keys).toContain("matching_concerns_count");
      expect(keys).toContain("by_status");
      expect(keys).toContain("by_decline_reason");
      expect(keys).toContain("by_impact_level");
      expect(keys).toContain("by_placing_authority");
      expect(keys).toHaveLength(18);
    });

    it("numeric fields are numbers", () => {
      const m = computeReferralMetrics([makeReferral()]);
      expect(typeof m.total_referrals).toBe("number");
      expect(typeof m.received_count).toBe("number");
      expect(typeof m.under_assessment_count).toBe("number");
      expect(typeof m.accepted_count).toBe("number");
      expect(typeof m.declined_count).toBe("number");
      expect(typeof m.withdrawn_count).toBe("number");
      expect(typeof m.admitted_count).toBe("number");
      expect(typeof m.acceptance_rate).toBe("number");
      expect(typeof m.impact_assessments_completed).toBe("number");
      expect(typeof m.impact_assessment_rate).toBe("number");
      expect(typeof m.existing_children_consulted_rate).toBe("number");
      expect(typeof m.staff_views_sought_rate).toBe("number");
      expect(typeof m.trial_visits_completed).toBe("number");
      expect(typeof m.matching_concerns_count).toBe("number");
    });

    it("breakdown fields are plain objects", () => {
      const m = computeReferralMetrics([makeReferral()]);
      expect(typeof m.by_status).toBe("object");
      expect(typeof m.by_decline_reason).toBe("object");
      expect(typeof m.by_impact_level).toBe("object");
      expect(typeof m.by_placing_authority).toBe("object");
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. identifyReferralAlerts
// ══════════════════════════════════════════════════════════════════════════════

describe("identifyReferralAlerts", () => {
  // ── no_impact_assessment (critical) ─────────────────────────────────────

  describe("no_impact_assessment", () => {
    it("fires for accepted referral without impact assessment", () => {
      const refs = [
        makeReferral({
          status: "accepted",
          impact_assessment_completed: false,
          child_name: "Alice",
        }),
      ];
      const alerts = identifyReferralAlerts(refs);
      const nia = alerts.filter((a) => a.type === "no_impact_assessment");
      expect(nia).toHaveLength(1);
      expect(nia[0].severity).toBe("critical");
      expect(nia[0].message).toContain("Alice");
    });

    it("fires for admitted referral without impact assessment", () => {
      const refs = [
        makeReferral({
          status: "admitted",
          impact_assessment_completed: false,
          child_name: "Bob",
        }),
      ];
      const alerts = identifyReferralAlerts(refs);
      const nia = alerts.filter((a) => a.type === "no_impact_assessment");
      expect(nia).toHaveLength(1);
      expect(nia[0].severity).toBe("critical");
      expect(nia[0].message).toContain("Bob");
    });

    it("does NOT fire for accepted with impact assessment completed", () => {
      const refs = [
        makeReferral({ status: "accepted", impact_assessment_completed: true }),
      ];
      const alerts = identifyReferralAlerts(refs);
      expect(alerts.some((a) => a.type === "no_impact_assessment")).toBe(false);
    });

    it("does NOT fire for admitted with impact assessment completed", () => {
      const refs = [
        makeReferral({ status: "admitted", impact_assessment_completed: true }),
      ];
      const alerts = identifyReferralAlerts(refs);
      expect(alerts.some((a) => a.type === "no_impact_assessment")).toBe(false);
    });

    it("does NOT fire for received without impact assessment", () => {
      const refs = [
        makeReferral({ status: "received", impact_assessment_completed: false }),
      ];
      const alerts = identifyReferralAlerts(refs);
      expect(alerts.some((a) => a.type === "no_impact_assessment")).toBe(false);
    });

    it("does NOT fire for declined without impact assessment", () => {
      const refs = [
        makeReferral({ status: "declined", impact_assessment_completed: false }),
      ];
      const alerts = identifyReferralAlerts(refs);
      expect(alerts.some((a) => a.type === "no_impact_assessment")).toBe(false);
    });

    it("does NOT fire for withdrawn without impact assessment", () => {
      const refs = [
        makeReferral({ status: "withdrawn", impact_assessment_completed: false }),
      ];
      const alerts = identifyReferralAlerts(refs);
      expect(alerts.some((a) => a.type === "no_impact_assessment")).toBe(false);
    });

    it("fires for multiple accepted/admitted without impact assessment", () => {
      const refs = [
        makeReferral({ status: "accepted", impact_assessment_completed: false }),
        makeReferral({ status: "admitted", impact_assessment_completed: false }),
      ];
      const alerts = identifyReferralAlerts(refs);
      expect(alerts.filter((a) => a.type === "no_impact_assessment")).toHaveLength(2);
    });

    it("alert id matches referral id", () => {
      const refId = crypto.randomUUID();
      const refs = [
        makeReferral({ id: refId, status: "accepted", impact_assessment_completed: false }),
      ];
      const alerts = identifyReferralAlerts(refs);
      const nia = alerts.find((a) => a.type === "no_impact_assessment");
      expect(nia?.id).toBe(refId);
    });
  });

  // ── significant_concern_accepted (high) ─────────────────────────────────

  describe("significant_concern_accepted", () => {
    it("fires for accepted with significant_concern impact", () => {
      const refs = [
        makeReferral({
          status: "accepted",
          impact_on_existing: "significant_concern",
          child_name: "Charlie",
        }),
      ];
      const alerts = identifyReferralAlerts(refs);
      const sca = alerts.filter((a) => a.type === "significant_concern_accepted");
      expect(sca).toHaveLength(1);
      expect(sca[0].severity).toBe("high");
      expect(sca[0].message).toContain("Charlie");
    });

    it("fires for admitted with significant_concern impact", () => {
      const refs = [
        makeReferral({
          status: "admitted",
          impact_on_existing: "significant_concern",
          child_name: "Dana",
        }),
      ];
      const alerts = identifyReferralAlerts(refs);
      const sca = alerts.filter((a) => a.type === "significant_concern_accepted");
      expect(sca).toHaveLength(1);
      expect(sca[0].message).toContain("Dana");
    });

    it("does NOT fire for accepted with neutral impact", () => {
      const refs = [
        makeReferral({ status: "accepted", impact_on_existing: "neutral" }),
      ];
      const alerts = identifyReferralAlerts(refs);
      expect(alerts.some((a) => a.type === "significant_concern_accepted")).toBe(false);
    });

    it("does NOT fire for accepted with minor_concern impact", () => {
      const refs = [
        makeReferral({ status: "accepted", impact_on_existing: "minor_concern" }),
      ];
      const alerts = identifyReferralAlerts(refs);
      expect(alerts.some((a) => a.type === "significant_concern_accepted")).toBe(false);
    });

    it("does NOT fire for accepted with positive impact", () => {
      const refs = [
        makeReferral({ status: "accepted", impact_on_existing: "positive" }),
      ];
      const alerts = identifyReferralAlerts(refs);
      expect(alerts.some((a) => a.type === "significant_concern_accepted")).toBe(false);
    });

    it("does NOT fire for declined with significant_concern impact", () => {
      const refs = [
        makeReferral({ status: "declined", impact_on_existing: "significant_concern" }),
      ];
      const alerts = identifyReferralAlerts(refs);
      expect(alerts.some((a) => a.type === "significant_concern_accepted")).toBe(false);
    });

    it("does NOT fire for received with significant_concern impact", () => {
      const refs = [
        makeReferral({ status: "received", impact_on_existing: "significant_concern" }),
      ];
      const alerts = identifyReferralAlerts(refs);
      expect(alerts.some((a) => a.type === "significant_concern_accepted")).toBe(false);
    });
  });

  // ── referral_pending (medium) ───────────────────────────────────────────

  describe("referral_pending", () => {
    it("fires for referral with received status", () => {
      const refs = [
        makeReferral({
          status: "received",
          child_name: "Eve",
          child_age: 14,
          placing_authority: "Metro Council",
          referral_date: "2026-05-01",
        }),
      ];
      const alerts = identifyReferralAlerts(refs);
      const rp = alerts.filter((a) => a.type === "referral_pending");
      expect(rp).toHaveLength(1);
      expect(rp[0].severity).toBe("medium");
      expect(rp[0].message).toContain("Eve");
      expect(rp[0].message).toContain("14");
      expect(rp[0].message).toContain("Metro Council");
    });

    it("does NOT fire for under_assessment status", () => {
      const refs = [makeReferral({ status: "under_assessment" })];
      const alerts = identifyReferralAlerts(refs);
      expect(alerts.some((a) => a.type === "referral_pending")).toBe(false);
    });

    it("does NOT fire for matching_in_progress status", () => {
      const refs = [makeReferral({ status: "matching_in_progress" })];
      const alerts = identifyReferralAlerts(refs);
      expect(alerts.some((a) => a.type === "referral_pending")).toBe(false);
    });

    it("does NOT fire for accepted status", () => {
      const refs = [makeReferral({ status: "accepted" })];
      const alerts = identifyReferralAlerts(refs);
      expect(alerts.some((a) => a.type === "referral_pending")).toBe(false);
    });

    it("does NOT fire for declined status", () => {
      const refs = [makeReferral({ status: "declined" })];
      const alerts = identifyReferralAlerts(refs);
      expect(alerts.some((a) => a.type === "referral_pending")).toBe(false);
    });

    it("fires for multiple received referrals", () => {
      const refs = [
        makeReferral({ status: "received" }),
        makeReferral({ status: "received" }),
        makeReferral({ status: "received" }),
      ];
      const alerts = identifyReferralAlerts(refs);
      expect(alerts.filter((a) => a.type === "referral_pending")).toHaveLength(3);
    });

    it("alert id matches referral id", () => {
      const refId = crypto.randomUUID();
      const refs = [makeReferral({ id: refId, status: "received" })];
      const alerts = identifyReferralAlerts(refs);
      const rp = alerts.find((a) => a.type === "referral_pending");
      expect(rp?.id).toBe(refId);
    });

    it("message includes referral_date", () => {
      const refs = [
        makeReferral({ status: "received", referral_date: "2026-04-15" }),
      ];
      const alerts = identifyReferralAlerts(refs);
      const rp = alerts.find((a) => a.type === "referral_pending");
      expect(rp?.message).toContain("2026-04-15");
    });
  });

  // ── matching_concerns (high) ────────────────────────────────────────────

  describe("matching_concerns", () => {
    it("fires for non-declined referral with matching concerns", () => {
      const refs = [
        makeReferral({
          status: "accepted",
          matching_criteria_concerns: ["risk_compatibility"],
          child_name: "Frank",
        }),
      ];
      const alerts = identifyReferralAlerts(refs);
      const mc = alerts.filter((a) => a.type === "matching_concerns");
      expect(mc).toHaveLength(1);
      expect(mc[0].severity).toBe("high");
      expect(mc[0].message).toContain("Frank");
      expect(mc[0].message).toContain("1");
    });

    it("does NOT fire for declined referral with matching concerns", () => {
      const refs = [
        makeReferral({
          status: "declined",
          matching_criteria_concerns: ["risk_compatibility"],
        }),
      ];
      const alerts = identifyReferralAlerts(refs);
      expect(alerts.some((a) => a.type === "matching_concerns")).toBe(false);
    });

    it("does NOT fire for referral with no matching concerns", () => {
      const refs = [
        makeReferral({ status: "accepted", matching_criteria_concerns: [] }),
      ];
      const alerts = identifyReferralAlerts(refs);
      expect(alerts.some((a) => a.type === "matching_concerns")).toBe(false);
    });

    it("fires for received status with concerns", () => {
      const refs = [
        makeReferral({
          status: "received",
          matching_criteria_concerns: ["peer_dynamics"],
        }),
      ];
      const alerts = identifyReferralAlerts(refs);
      expect(alerts.some((a) => a.type === "matching_concerns")).toBe(true);
    });

    it("fires for under_assessment with concerns", () => {
      const refs = [
        makeReferral({
          status: "under_assessment",
          matching_criteria_concerns: ["emotional_needs"],
        }),
      ];
      const alerts = identifyReferralAlerts(refs);
      expect(alerts.some((a) => a.type === "matching_concerns")).toBe(true);
    });

    it("fires for on_hold with concerns", () => {
      const refs = [
        makeReferral({
          status: "on_hold",
          matching_criteria_concerns: ["behavioural_needs"],
        }),
      ];
      const alerts = identifyReferralAlerts(refs);
      expect(alerts.some((a) => a.type === "matching_concerns")).toBe(true);
    });

    it("fires for admitted with concerns", () => {
      const refs = [
        makeReferral({
          status: "admitted",
          matching_criteria_concerns: ["health_needs"],
        }),
      ];
      const alerts = identifyReferralAlerts(refs);
      expect(alerts.some((a) => a.type === "matching_concerns")).toBe(true);
    });

    it("message uses singular 'concern' for one concern", () => {
      const refs = [
        makeReferral({
          status: "accepted",
          matching_criteria_concerns: ["risk_compatibility"],
        }),
      ];
      const alerts = identifyReferralAlerts(refs);
      const mc = alerts.find((a) => a.type === "matching_concerns");
      expect(mc?.message).toContain("concern");
      expect(mc?.message).not.toContain("concerns");
    });

    it("message uses plural 'concerns' for multiple concerns", () => {
      const refs = [
        makeReferral({
          status: "accepted",
          matching_criteria_concerns: ["risk_compatibility", "peer_dynamics"],
        }),
      ];
      const alerts = identifyReferralAlerts(refs);
      const mc = alerts.find((a) => a.type === "matching_concerns");
      expect(mc?.message).toContain("concerns");
    });

    it("message formats concern names replacing underscores with spaces", () => {
      const refs = [
        makeReferral({
          status: "accepted",
          matching_criteria_concerns: ["risk_compatibility"],
        }),
      ];
      const alerts = identifyReferralAlerts(refs);
      const mc = alerts.find((a) => a.type === "matching_concerns");
      expect(mc?.message).toContain("risk compatibility");
    });

    it("message lists multiple concerns comma-separated", () => {
      const refs = [
        makeReferral({
          status: "accepted",
          matching_criteria_concerns: ["risk_compatibility", "peer_dynamics", "age_range"],
        }),
      ];
      const alerts = identifyReferralAlerts(refs);
      const mc = alerts.find((a) => a.type === "matching_concerns");
      expect(mc?.message).toContain("risk compatibility");
      expect(mc?.message).toContain("peer dynamics");
      expect(mc?.message).toContain("age range");
    });
  });

  // ── children_not_consulted (medium) ─────────────────────────────────────

  describe("children_not_consulted", () => {
    it("fires for accepted without existing children consulted", () => {
      const refs = [
        makeReferral({
          status: "accepted",
          existing_children_consulted: false,
          child_name: "Grace",
        }),
      ];
      const alerts = identifyReferralAlerts(refs);
      const cnc = alerts.filter((a) => a.type === "children_not_consulted");
      expect(cnc).toHaveLength(1);
      expect(cnc[0].severity).toBe("medium");
      expect(cnc[0].message).toContain("Grace");
    });

    it("fires for admitted without existing children consulted", () => {
      const refs = [
        makeReferral({
          status: "admitted",
          existing_children_consulted: false,
          child_name: "Henry",
        }),
      ];
      const alerts = identifyReferralAlerts(refs);
      const cnc = alerts.filter((a) => a.type === "children_not_consulted");
      expect(cnc).toHaveLength(1);
      expect(cnc[0].message).toContain("Henry");
    });

    it("does NOT fire for accepted with children consulted", () => {
      const refs = [
        makeReferral({ status: "accepted", existing_children_consulted: true }),
      ];
      const alerts = identifyReferralAlerts(refs);
      expect(alerts.some((a) => a.type === "children_not_consulted")).toBe(false);
    });

    it("does NOT fire for admitted with children consulted", () => {
      const refs = [
        makeReferral({ status: "admitted", existing_children_consulted: true }),
      ];
      const alerts = identifyReferralAlerts(refs);
      expect(alerts.some((a) => a.type === "children_not_consulted")).toBe(false);
    });

    it("does NOT fire for received without children consulted", () => {
      const refs = [
        makeReferral({ status: "received", existing_children_consulted: false }),
      ];
      const alerts = identifyReferralAlerts(refs);
      expect(alerts.some((a) => a.type === "children_not_consulted")).toBe(false);
    });

    it("does NOT fire for declined without children consulted", () => {
      const refs = [
        makeReferral({ status: "declined", existing_children_consulted: false }),
      ];
      const alerts = identifyReferralAlerts(refs);
      expect(alerts.some((a) => a.type === "children_not_consulted")).toBe(false);
    });

    it("fires for multiple accepted/admitted without consultation", () => {
      const refs = [
        makeReferral({ status: "accepted", existing_children_consulted: false }),
        makeReferral({ status: "admitted", existing_children_consulted: false }),
      ];
      const alerts = identifyReferralAlerts(refs);
      expect(alerts.filter((a) => a.type === "children_not_consulted")).toHaveLength(2);
    });
  });

  // ── no alerts ───────────────────────────────────────────────────────────

  describe("no alerts when clean", () => {
    it("returns empty array for empty input", () => {
      expect(identifyReferralAlerts([])).toHaveLength(0);
    });

    it("returns empty array when all conditions are clean", () => {
      const refs = [
        makeReferral({
          status: "accepted",
          impact_assessment_completed: true,
          impact_on_existing: "positive",
          existing_children_consulted: true,
          matching_criteria_concerns: [],
        }),
      ];
      const alerts = identifyReferralAlerts(refs);
      expect(alerts).toHaveLength(0);
    });

    it("returns empty for declined referral with all flags false", () => {
      const refs = [
        makeReferral({
          status: "declined",
          impact_assessment_completed: false,
          existing_children_consulted: false,
          impact_on_existing: "significant_concern",
          matching_criteria_concerns: [],
        }),
      ];
      const alerts = identifyReferralAlerts(refs);
      // declined => no no_impact_assessment, no significant_concern_accepted,
      // no children_not_consulted; no matching_concerns (empty array)
      expect(alerts).toHaveLength(0);
    });

    it("returns empty for under_assessment with completed assessment and no concerns", () => {
      const refs = [
        makeReferral({
          status: "under_assessment",
          impact_assessment_completed: true,
          existing_children_consulted: true,
          matching_criteria_concerns: [],
        }),
      ];
      const alerts = identifyReferralAlerts(refs);
      expect(alerts).toHaveLength(0);
    });

    it("returns empty for withdrawn referral", () => {
      const refs = [
        makeReferral({
          status: "withdrawn",
          impact_assessment_completed: false,
          existing_children_consulted: false,
          matching_criteria_concerns: [],
        }),
      ];
      const alerts = identifyReferralAlerts(refs);
      expect(alerts).toHaveLength(0);
    });
  });

  // ── Combined alert scenarios ────────────────────────────────────────────

  describe("combined alert scenarios", () => {
    it("a single accepted referral can trigger multiple alerts simultaneously", () => {
      const refs = [
        makeReferral({
          status: "accepted",
          impact_assessment_completed: false,
          impact_on_existing: "significant_concern",
          existing_children_consulted: false,
          matching_criteria_concerns: ["risk_compatibility"],
          child_name: "Multi-Alert Child",
        }),
      ];
      const alerts = identifyReferralAlerts(refs);
      const types = alerts.map((a) => a.type);
      // Should fire: no_impact_assessment, significant_concern_accepted,
      // matching_concerns, children_not_consulted
      expect(types).toContain("no_impact_assessment");
      expect(types).toContain("significant_concern_accepted");
      expect(types).toContain("matching_concerns");
      expect(types).toContain("children_not_consulted");
      expect(alerts).toHaveLength(4);
    });

    it("received referral only triggers referral_pending and matching_concerns if applicable", () => {
      const refs = [
        makeReferral({
          status: "received",
          impact_assessment_completed: false,
          impact_on_existing: "significant_concern",
          existing_children_consulted: false,
          matching_criteria_concerns: ["peer_dynamics"],
        }),
      ];
      const alerts = identifyReferralAlerts(refs);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("referral_pending");
      expect(types).toContain("matching_concerns");
      // Should NOT have no_impact_assessment or children_not_consulted (not accepted/admitted)
      expect(types).not.toContain("no_impact_assessment");
      expect(types).not.toContain("children_not_consulted");
      expect(types).not.toContain("significant_concern_accepted");
    });

    it("multiple different referrals generate independent alerts", () => {
      const refs = [
        makeReferral({
          status: "received",
          matching_criteria_concerns: [],
        }),
        makeReferral({
          status: "admitted",
          impact_assessment_completed: false,
          existing_children_consulted: false,
          impact_on_existing: "significant_concern",
          matching_criteria_concerns: ["age_range", "gender"],
        }),
      ];
      const alerts = identifyReferralAlerts(refs);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("referral_pending");
      expect(types).toContain("no_impact_assessment");
      expect(types).toContain("significant_concern_accepted");
      expect(types).toContain("matching_concerns");
      expect(types).toContain("children_not_consulted");
    });
  });

  // ── Alert structure ─────────────────────────────────────────────────────

  describe("alert structure", () => {
    it("returns an array", () => {
      expect(Array.isArray(identifyReferralAlerts([]))).toBe(true);
    });

    it("each alert has type, severity, message, and id", () => {
      const refs = [
        makeReferral({
          status: "accepted",
          impact_assessment_completed: false,
        }),
      ];
      const alerts = identifyReferralAlerts(refs);
      for (const a of alerts) {
        expect(typeof a.type).toBe("string");
        expect(["critical", "high", "medium"]).toContain(a.severity);
        expect(typeof a.message).toBe("string");
        expect(typeof a.id).toBe("string");
      }
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. Constants
// ══════════════════════════════════════════════════════════════════════════════

describe("Constants", () => {
  // ── REFERRAL_STATUSES ──────────────────────────────────────────────────

  describe("REFERRAL_STATUSES", () => {
    it("has exactly 8 entries", () => {
      expect(REFERRAL_STATUSES).toHaveLength(8);
    });

    it("contains unique status values", () => {
      const values = REFERRAL_STATUSES.map((s) => s.status);
      expect(new Set(values).size).toBe(values.length);
    });

    it.each([
      "received",
      "under_assessment",
      "matching_in_progress",
      "accepted",
      "declined",
      "withdrawn",
      "on_hold",
      "admitted",
    ] as const)("includes status '%s'", (status) => {
      expect(REFERRAL_STATUSES.find((s) => s.status === status)).toBeDefined();
    });

    it("has non-empty labels for every entry", () => {
      for (const s of REFERRAL_STATUSES) {
        expect(s.label.trim().length).toBeGreaterThan(0);
      }
    });
  });

  // ── DECLINE_REASONS ────────────────────────────────────────────────────

  describe("DECLINE_REASONS", () => {
    it("has exactly 8 entries", () => {
      expect(DECLINE_REASONS).toHaveLength(8);
    });

    it("contains unique reason values", () => {
      const values = DECLINE_REASONS.map((d) => d.reason);
      expect(new Set(values).size).toBe(values.length);
    });

    it.each([
      "no_vacancy",
      "matching_concerns",
      "impact_on_current",
      "needs_beyond_capability",
      "age_inappropriate",
      "safeguarding_risk",
      "location_unsuitable",
      "other",
    ] as const)("includes reason '%s'", (reason) => {
      expect(DECLINE_REASONS.find((d) => d.reason === reason)).toBeDefined();
    });

    it("has non-empty labels for every entry", () => {
      for (const d of DECLINE_REASONS) {
        expect(d.label.trim().length).toBeGreaterThan(0);
      }
    });
  });

  // ── MATCHING_CRITERIA ──────────────────────────────────────────────────

  describe("MATCHING_CRITERIA", () => {
    it("has exactly 14 entries", () => {
      expect(MATCHING_CRITERIA).toHaveLength(14);
    });

    it("contains unique criteria values", () => {
      const values = MATCHING_CRITERIA.map((c) => c.criteria);
      expect(new Set(values).size).toBe(values.length);
    });

    it.each([
      "age_range",
      "gender",
      "emotional_needs",
      "behavioural_needs",
      "educational_needs",
      "health_needs",
      "cultural_background",
      "language",
      "religion",
      "peer_dynamics",
      "risk_compatibility",
      "family_contact_needs",
      "therapeutic_needs",
      "location_proximity",
    ] as const)("includes criteria '%s'", (criteria) => {
      expect(MATCHING_CRITERIA.find((c) => c.criteria === criteria)).toBeDefined();
    });

    it("has non-empty labels for every entry", () => {
      for (const c of MATCHING_CRITERIA) {
        expect(c.label.trim().length).toBeGreaterThan(0);
      }
    });
  });

  // ── IMPACT_LEVELS ──────────────────────────────────────────────────────

  describe("IMPACT_LEVELS", () => {
    it("has exactly 5 entries", () => {
      expect(IMPACT_LEVELS).toHaveLength(5);
    });

    it("contains unique level values", () => {
      const values = IMPACT_LEVELS.map((l) => l.level);
      expect(new Set(values).size).toBe(values.length);
    });

    it.each([
      "positive",
      "neutral",
      "minor_concern",
      "significant_concern",
      "not_assessed",
    ] as const)("includes level '%s'", (level) => {
      expect(IMPACT_LEVELS.find((l) => l.level === level)).toBeDefined();
    });

    it("has non-empty labels for every entry", () => {
      for (const l of IMPACT_LEVELS) {
        expect(l.label.trim().length).toBeGreaterThan(0);
      }
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. CRUD fallbacks (Supabase disabled)
// ══════════════════════════════════════════════════════════════════════════════

describe("CRUD fallback (Supabase disabled)", () => {
  describe("listReferrals", () => {
    it("returns ok:true with empty data array", async () => {
      const result = await listReferrals("home-1");
      expect(result).toEqual({ ok: true, data: [] });
    });

    it("returns ok:true with filters provided", async () => {
      const result = await listReferrals("home-1", {
        status: "received",
        placingAuthority: "Council X",
        dateFrom: "2026-01-01",
        dateTo: "2026-12-31",
        limit: 50,
      });
      expect(result).toEqual({ ok: true, data: [] });
    });

    it("returns ok:true regardless of homeId", async () => {
      const result = await listReferrals("any-home-id");
      expect(result).toEqual({ ok: true, data: [] });
    });
  });

  describe("createReferral", () => {
    it("returns ok:false with Supabase not configured error", async () => {
      const result = await createReferral({
        homeId: "home-1",
        childName: "Test Child",
        childAge: 11,
        placingAuthority: "Council A",
        socialWorkerName: "SW Name",
        referralDate: "2026-06-01",
        status: "received",
        matchingCriteriaMet: ["age_range"],
        matchingCriteriaConcerns: [],
        impactOnExisting: "neutral",
        impactAssessmentCompleted: false,
        existingChildrenConsulted: false,
        staffViewsSought: false,
        trialVisitCompleted: false,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("Supabase not configured");
      }
    });
  });

  describe("updateReferral", () => {
    it("returns ok:false with Supabase not configured error", async () => {
      const result = await updateReferral("ref-1", { status: "accepted" });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("Supabase not configured");
      }
    });
  });
});
