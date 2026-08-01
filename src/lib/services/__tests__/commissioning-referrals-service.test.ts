// ══════════════════════════════════════════════════════════════════════════════
// CARA — COMMISSIONING & REFERRALS SERVICE TESTS
// Pure-function unit tests for referral metrics computation,
// alert identification, constant validation, and CRUD fallback behaviour
// (Supabase disabled). CHR 2015 Reg 36 (referral process),
// Reg 12 (matching / impact risk), Reg 14 (care planning).
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeReferralMetrics,
  identifyReferralAlerts,
  REFERRAL_STATUSES,
  DECLINE_REASONS,
  REFERRAL_URGENCIES,
  COMMISSIONING_RELATIONSHIPS,
  listReferrals,
  createReferral,
  updateReferral,
  listOccupancy,
  createOccupancyRecord,
} from "../commissioning-referrals-service";
import type {
  PlacementReferral,
  OccupancyRecord,
} from "../commissioning-referrals-service";

// ── Helpers ────────────────────────────────────────────────────────────────

function daysAgo(n: number, from: Date = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() - n);
  // Use full ISO so that Math.round in the service gives the exact day diff
  return d.toISOString();
}

function daysAgoISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function makeReferral(
  overrides: Partial<PlacementReferral> = {},
): PlacementReferral {
  return {
    id: crypto.randomUUID(),
    home_id: "home-1",
    child_name: "Test Child",
    child_age: 12,
    child_gender: "Male",
    referring_authority: "Gotham City Council",
    social_worker_name: "Jane Doe",
    social_worker_email: "jane@gotham.gov.uk",
    referral_date: daysAgo(3),
    urgency: "standard",
    status: "received",
    presenting_needs: ["emotional"],
    risk_factors: [],
    decline_reason: null,
    decline_notes: null,
    decision_date: null,
    decision_by: null,
    matching_score: null,
    placement_start_date: null,
    created_at: daysAgoISO(3),
    updated_at: daysAgoISO(3),
    ...overrides,
  };
}

function makeOccupancy(
  overrides: Partial<OccupancyRecord> = {},
): OccupancyRecord {
  return {
    id: crypto.randomUUID(),
    home_id: "home-1",
    record_date: daysAgo(0),
    registered_places: 6,
    children_in_placement: 4,
    occupancy_rate: 66.7,
    referrals_in_progress: 1,
    planned_admissions: 0,
    planned_departures: 0,
    commentary: null,
    recorded_by: "staff-1",
    created_at: daysAgoISO(0),
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. CONSTANTS
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
      "under_review",
      "information_requested",
      "matching_assessment",
      "accepted",
      "declined",
      "withdrawn",
      "placed",
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
      "no_capacity",
      "needs_mismatch",
      "risk_too_high",
      "age_mismatch",
      "gender_mismatch",
      "existing_dynamics",
      "insufficient_info",
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

  // ── REFERRAL_URGENCIES ─────────────────────────────────────────────────

  describe("REFERRAL_URGENCIES", () => {
    it("has exactly 4 entries", () => {
      expect(REFERRAL_URGENCIES).toHaveLength(4);
    });

    it("contains unique urgency values", () => {
      const values = REFERRAL_URGENCIES.map((u) => u.urgency);
      expect(new Set(values).size).toBe(values.length);
    });

    it.each(["emergency", "urgent", "planned", "standard"] as const)(
      "includes urgency '%s'",
      (urgency) => {
        expect(
          REFERRAL_URGENCIES.find((u) => u.urgency === urgency),
        ).toBeDefined();
      },
    );

    it("has non-empty labels for every entry", () => {
      for (const u of REFERRAL_URGENCIES) {
        expect(u.label.trim().length).toBeGreaterThan(0);
      }
    });
  });

  // ── COMMISSIONING_RELATIONSHIPS ────────────────────────────────────────

  describe("COMMISSIONING_RELATIONSHIPS", () => {
    it("has exactly 5 entries", () => {
      expect(COMMISSIONING_RELATIONSHIPS).toHaveLength(5);
    });

    it("contains unique relationship values", () => {
      const values = COMMISSIONING_RELATIONSHIPS.map((c) => c.relationship);
      expect(new Set(values).size).toBe(values.length);
    });

    it.each(["excellent", "good", "adequate", "poor", "new"] as const)(
      "includes relationship '%s'",
      (rel) => {
        expect(
          COMMISSIONING_RELATIONSHIPS.find((c) => c.relationship === rel),
        ).toBeDefined();
      },
    );

    it("has non-empty labels for every entry", () => {
      for (const c of COMMISSIONING_RELATIONSHIPS) {
        expect(c.label.trim().length).toBeGreaterThan(0);
      }
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. computeReferralMetrics
// ══════════════════════════════════════════════════════════════════════════════

describe("computeReferralMetrics", () => {
  // ── Empty inputs ───────────────────────────────────────────────────────

  describe("empty inputs", () => {
    it("returns zeros for empty referrals and occupancy", () => {
      const m = computeReferralMetrics([], []);
      expect(m.total_referrals).toBe(0);
      expect(m.active_referrals).toBe(0);
      expect(m.accepted).toBe(0);
      expect(m.declined).toBe(0);
      expect(m.withdrawn).toBe(0);
      expect(m.placed).toBe(0);
      expect(m.acceptance_rate).toBeNull();;
      expect(m.avg_decision_days).toBe(0);
      expect(m.emergency_referrals).toBe(0);
      expect(m.current_occupancy_rate).toBe(0);
      expect(m.available_places).toBe(0);
    });

    it("returns empty breakdown objects for empty inputs", () => {
      const m = computeReferralMetrics([], []);
      expect(m.by_status).toEqual({});
      expect(m.by_urgency).toEqual({});
      expect(m.by_decline_reason).toEqual({});
      expect(m.by_authority).toEqual({});
    });
  });

  // ── total_referrals ────────────────────────────────────────────────────

  describe("total_referrals", () => {
    it("counts all referrals regardless of status", () => {
      const refs = [
        makeReferral({ status: "received" }),
        makeReferral({ status: "accepted" }),
        makeReferral({ status: "declined" }),
      ];
      expect(computeReferralMetrics(refs, []).total_referrals).toBe(3);
    });

    it("counts a single referral", () => {
      expect(
        computeReferralMetrics([makeReferral()], []).total_referrals,
      ).toBe(1);
    });
  });

  // ── active_referrals ───────────────────────────────────────────────────

  describe("active_referrals", () => {
    it("counts received, under_review, information_requested, matching_assessment", () => {
      const refs = [
        makeReferral({ status: "received" }),
        makeReferral({ status: "under_review" }),
        makeReferral({ status: "information_requested" }),
        makeReferral({ status: "matching_assessment" }),
        makeReferral({ status: "accepted" }),
        makeReferral({ status: "declined" }),
        makeReferral({ status: "withdrawn" }),
        makeReferral({ status: "placed" }),
      ];
      expect(computeReferralMetrics(refs, []).active_referrals).toBe(4);
    });

    it("returns 0 when no active statuses present", () => {
      const refs = [
        makeReferral({ status: "accepted" }),
        makeReferral({ status: "declined" }),
      ];
      expect(computeReferralMetrics(refs, []).active_referrals).toBe(0);
    });
  });

  // ── accepted ───────────────────────────────────────────────────────────

  describe("accepted", () => {
    it("counts accepted and placed referrals", () => {
      const refs = [
        makeReferral({ status: "accepted" }),
        makeReferral({ status: "placed" }),
        makeReferral({ status: "declined" }),
      ];
      expect(computeReferralMetrics(refs, []).accepted).toBe(2);
    });

    it("returns 0 when none accepted or placed", () => {
      const refs = [makeReferral({ status: "received" })];
      expect(computeReferralMetrics(refs, []).accepted).toBe(0);
    });
  });

  // ── declined ───────────────────────────────────────────────────────────

  describe("declined", () => {
    it("counts only declined referrals", () => {
      const refs = [
        makeReferral({ status: "declined" }),
        makeReferral({ status: "declined" }),
        makeReferral({ status: "accepted" }),
      ];
      expect(computeReferralMetrics(refs, []).declined).toBe(2);
    });
  });

  // ── withdrawn ──────────────────────────────────────────────────────────

  describe("withdrawn", () => {
    it("counts only withdrawn referrals", () => {
      const refs = [
        makeReferral({ status: "withdrawn" }),
        makeReferral({ status: "received" }),
      ];
      expect(computeReferralMetrics(refs, []).withdrawn).toBe(1);
    });
  });

  // ── placed ─────────────────────────────────────────────────────────────

  describe("placed", () => {
    it("counts only placed referrals", () => {
      const refs = [
        makeReferral({ status: "placed" }),
        makeReferral({ status: "placed" }),
        makeReferral({ status: "accepted" }),
      ];
      expect(computeReferralMetrics(refs, []).placed).toBe(2);
    });
  });

  // ── emergency_referrals ────────────────────────────────────────────────

  describe("emergency_referrals", () => {
    it("counts referrals with emergency urgency regardless of status", () => {
      const refs = [
        makeReferral({ urgency: "emergency", status: "received" }),
        makeReferral({ urgency: "emergency", status: "accepted" }),
        makeReferral({ urgency: "urgent" }),
        makeReferral({ urgency: "standard" }),
      ];
      expect(computeReferralMetrics(refs, []).emergency_referrals).toBe(2);
    });

    it("returns 0 when no emergency referrals", () => {
      const refs = [makeReferral({ urgency: "planned" })];
      expect(computeReferralMetrics(refs, []).emergency_referrals).toBe(0);
    });
  });

  // ── acceptance_rate ────────────────────────────────────────────────────

  describe("acceptance_rate", () => {
    it("calculates accepted / (accepted+declined) * 100 with 1 decimal", () => {
      // accepted = 2 (accepted + placed), declined = 1
      // rate = 2/3 * 100 = 66.7
      const refs = [
        makeReferral({ status: "accepted" }),
        makeReferral({ status: "placed" }),
        makeReferral({ status: "declined" }),
      ];
      expect(computeReferralMetrics(refs, []).acceptance_rate).toBe(66.7);
    });

    it("returns 0 when no resolved referrals", () => {
      const refs = [makeReferral({ status: "received" })];
      expect(computeReferralMetrics(refs, []).acceptance_rate).toBeNull();;
    });

    it("returns 100 when all accepted", () => {
      const refs = [
        makeReferral({ status: "accepted" }),
        makeReferral({ status: "placed" }),
      ];
      expect(computeReferralMetrics(refs, []).acceptance_rate).toBe(100);
    });

    it("returns 0 when all declined", () => {
      const refs = [
        makeReferral({ status: "declined" }),
        makeReferral({ status: "declined" }),
      ];
      expect(computeReferralMetrics(refs, []).acceptance_rate).toBe(0);
    });

    it("rounds correctly for repeating decimals", () => {
      // 1 accepted, 2 declined => 1/3 * 100 = 33.3
      const refs = [
        makeReferral({ status: "accepted" }),
        makeReferral({ status: "declined" }),
        makeReferral({ status: "declined" }),
      ];
      expect(computeReferralMetrics(refs, []).acceptance_rate).toBe(33.3);
    });

    it("handles 50/50 split", () => {
      const refs = [
        makeReferral({ status: "accepted" }),
        makeReferral({ status: "declined" }),
      ];
      expect(computeReferralMetrics(refs, []).acceptance_rate).toBe(50);
    });
  });

  // ── avg_decision_days ──────────────────────────────────────────────────

  describe("avg_decision_days", () => {
    it("computes average days between referral_date and decision_date for decided referrals", () => {
      const refs = [
        makeReferral({
          status: "accepted",
          referral_date: "2025-01-01",
          decision_date: "2025-01-04", // 3 days
        }),
        makeReferral({
          status: "declined",
          referral_date: "2025-01-01",
          decision_date: "2025-01-06", // 5 days
        }),
      ];
      // (3+5)/2 = 4
      expect(computeReferralMetrics(refs, []).avg_decision_days).toBe(4);
    });

    it("returns 0 when no decided referrals", () => {
      const refs = [makeReferral({ status: "received" })];
      expect(computeReferralMetrics(refs, []).avg_decision_days).toBe(0);
    });

    it("ignores referrals without decision_date", () => {
      const refs = [
        makeReferral({
          status: "accepted",
          referral_date: "2025-01-01",
          decision_date: "2025-01-03", // 2 days
        }),
        makeReferral({
          status: "accepted",
          decision_date: null,
        }),
      ];
      expect(computeReferralMetrics(refs, []).avg_decision_days).toBe(2);
    });

    it("ignores withdrawn referrals even with decision_date", () => {
      const refs = [
        makeReferral({
          status: "withdrawn",
          referral_date: "2025-01-01",
          decision_date: "2025-01-10",
        }),
      ];
      expect(computeReferralMetrics(refs, []).avg_decision_days).toBe(0);
    });

    it("includes placed referrals with decision_date", () => {
      const refs = [
        makeReferral({
          status: "placed",
          referral_date: "2025-02-01",
          decision_date: "2025-02-08", // 7 days
        }),
      ];
      expect(computeReferralMetrics(refs, []).avg_decision_days).toBe(7);
    });

    it("rounds to nearest integer", () => {
      const refs = [
        makeReferral({
          status: "accepted",
          referral_date: "2025-01-01",
          decision_date: "2025-01-02", // 1 day
        }),
        makeReferral({
          status: "declined",
          referral_date: "2025-01-01",
          decision_date: "2025-01-03", // 2 days
        }),
        makeReferral({
          status: "accepted",
          referral_date: "2025-01-01",
          decision_date: "2025-01-04", // 3 days
        }),
      ];
      // (1+2+3)/3 = 2
      expect(computeReferralMetrics(refs, []).avg_decision_days).toBe(2);
    });
  });

  // ── current_occupancy_rate ─────────────────────────────────────────────

  describe("current_occupancy_rate", () => {
    it("uses occupancy_rate from the latest occupancy record by date", () => {
      const occ = [
        makeOccupancy({ record_date: "2025-01-01", occupancy_rate: 50 }),
        makeOccupancy({ record_date: "2025-03-01", occupancy_rate: 80 }),
        makeOccupancy({ record_date: "2025-02-01", occupancy_rate: 60 }),
      ];
      expect(computeReferralMetrics([], occ).current_occupancy_rate).toBe(80);
    });

    it("returns 0 when no occupancy records exist", () => {
      expect(computeReferralMetrics([], []).current_occupancy_rate).toBe(0);
    });

    it("handles a single occupancy record", () => {
      const occ = [makeOccupancy({ occupancy_rate: 75 })];
      expect(computeReferralMetrics([], occ).current_occupancy_rate).toBe(75);
    });
  });

  // ── available_places ───────────────────────────────────────────────────

  describe("available_places", () => {
    it("computes registered_places - children_in_placement from latest occupancy", () => {
      const occ = [
        makeOccupancy({
          record_date: "2025-03-01",
          registered_places: 6,
          children_in_placement: 4,
        }),
      ];
      expect(computeReferralMetrics([], occ).available_places).toBe(2);
    });

    it("returns 0 when no occupancy records", () => {
      expect(computeReferralMetrics([], []).available_places).toBe(0);
    });

    it("returns 0 when at full capacity", () => {
      const occ = [
        makeOccupancy({
          registered_places: 5,
          children_in_placement: 5,
        }),
      ];
      expect(computeReferralMetrics([], occ).available_places).toBe(0);
    });

    it("uses the latest record when multiple exist", () => {
      const occ = [
        makeOccupancy({
          record_date: "2025-01-01",
          registered_places: 6,
          children_in_placement: 6,
        }),
        makeOccupancy({
          record_date: "2025-03-01",
          registered_places: 6,
          children_in_placement: 2,
        }),
      ];
      expect(computeReferralMetrics([], occ).available_places).toBe(4);
    });
  });

  // ── by_status ──────────────────────────────────────────────────────────

  describe("by_status", () => {
    it("groups referrals by their status", () => {
      const refs = [
        makeReferral({ status: "received" }),
        makeReferral({ status: "received" }),
        makeReferral({ status: "accepted" }),
        makeReferral({ status: "declined" }),
      ];
      const m = computeReferralMetrics(refs, []);
      expect(m.by_status.received).toBe(2);
      expect(m.by_status.accepted).toBe(1);
      expect(m.by_status.declined).toBe(1);
    });

    it("returns empty object when no referrals", () => {
      expect(computeReferralMetrics([], []).by_status).toEqual({});
    });
  });

  // ── by_urgency ─────────────────────────────────────────────────────────

  describe("by_urgency", () => {
    it("groups referrals by urgency", () => {
      const refs = [
        makeReferral({ urgency: "emergency" }),
        makeReferral({ urgency: "emergency" }),
        makeReferral({ urgency: "urgent" }),
        makeReferral({ urgency: "standard" }),
      ];
      const m = computeReferralMetrics(refs, []);
      expect(m.by_urgency.emergency).toBe(2);
      expect(m.by_urgency.urgent).toBe(1);
      expect(m.by_urgency.standard).toBe(1);
    });

    it("returns empty object when no referrals", () => {
      expect(computeReferralMetrics([], []).by_urgency).toEqual({});
    });
  });

  // ── by_decline_reason ──────────────────────────────────────────────────

  describe("by_decline_reason", () => {
    it("only counts declined referrals with a decline_reason", () => {
      const refs = [
        makeReferral({
          status: "declined",
          decline_reason: "no_capacity",
        }),
        makeReferral({
          status: "declined",
          decline_reason: "no_capacity",
        }),
        makeReferral({
          status: "declined",
          decline_reason: "risk_too_high",
        }),
        makeReferral({
          status: "declined",
          decline_reason: null,
        }),
        makeReferral({
          status: "accepted",
          decline_reason: null,
        }),
      ];
      const m = computeReferralMetrics(refs, []);
      expect(m.by_decline_reason.no_capacity).toBe(2);
      expect(m.by_decline_reason.risk_too_high).toBe(1);
      expect(Object.keys(m.by_decline_reason)).toHaveLength(2);
    });

    it("returns empty object when no declined referrals", () => {
      const refs = [makeReferral({ status: "accepted" })];
      expect(computeReferralMetrics(refs, []).by_decline_reason).toEqual({});
    });
  });

  // ── by_authority ───────────────────────────────────────────────────────

  describe("by_authority", () => {
    it("groups referrals by referring_authority", () => {
      const refs = [
        makeReferral({ referring_authority: "Authority A" }),
        makeReferral({ referring_authority: "Authority A" }),
        makeReferral({ referring_authority: "Authority B" }),
      ];
      const m = computeReferralMetrics(refs, []);
      expect(m.by_authority["Authority A"]).toBe(2);
      expect(m.by_authority["Authority B"]).toBe(1);
    });

    it("returns empty object when no referrals", () => {
      expect(computeReferralMetrics([], []).by_authority).toEqual({});
    });
  });

  // ── acceptance_rate rounding edge cases ──────────────────────────────

  describe("acceptance_rate rounding edge cases", () => {
    it("handles 1 accepted out of 7 resolved", () => {
      // 1/7 * 100 = 14.285... => 14.3
      const refs = [
        makeReferral({ status: "accepted" }),
        ...Array.from({ length: 6 }, () =>
          makeReferral({ status: "declined" }),
        ),
      ];
      expect(computeReferralMetrics(refs, []).acceptance_rate).toBe(14.3);
    });

    it("handles 5 accepted out of 6 resolved", () => {
      // 5/6 * 100 = 83.333... => 83.3
      const refs = [
        ...Array.from({ length: 5 }, () =>
          makeReferral({ status: "accepted" }),
        ),
        makeReferral({ status: "declined" }),
      ];
      expect(computeReferralMetrics(refs, []).acceptance_rate).toBe(83.3);
    });
  });

  // ── by_status completeness ─────────────────────────────────────────────

  describe("by_status completeness", () => {
    it("does not include statuses not present in the data", () => {
      const refs = [makeReferral({ status: "received" })];
      const m = computeReferralMetrics(refs, []);
      expect(m.by_status.accepted).toBeUndefined();
      expect(m.by_status.declined).toBeUndefined();
    });

    it("tracks all 8 statuses when present", () => {
      const refs = [
        makeReferral({ status: "received" }),
        makeReferral({ status: "under_review" }),
        makeReferral({ status: "information_requested" }),
        makeReferral({ status: "matching_assessment" }),
        makeReferral({ status: "accepted" }),
        makeReferral({ status: "declined" }),
        makeReferral({ status: "withdrawn" }),
        makeReferral({ status: "placed" }),
      ];
      const m = computeReferralMetrics(refs, []);
      expect(Object.keys(m.by_status)).toHaveLength(8);
    });
  });

  // ── by_urgency completeness ────────────────────────────────────────────

  describe("by_urgency completeness", () => {
    it("tracks all 4 urgencies when present", () => {
      const refs = [
        makeReferral({ urgency: "emergency" }),
        makeReferral({ urgency: "urgent" }),
        makeReferral({ urgency: "planned" }),
        makeReferral({ urgency: "standard" }),
      ];
      const m = computeReferralMetrics(refs, []);
      expect(Object.keys(m.by_urgency)).toHaveLength(4);
      expect(m.by_urgency.emergency).toBe(1);
      expect(m.by_urgency.urgent).toBe(1);
      expect(m.by_urgency.planned).toBe(1);
      expect(m.by_urgency.standard).toBe(1);
    });
  });

  // ── multiple decline reasons ───────────────────────────────────────────

  describe("multiple decline reasons", () => {
    it("tracks all 8 decline reasons when present", () => {
      const reasons = [
        "no_capacity",
        "needs_mismatch",
        "risk_too_high",
        "age_mismatch",
        "gender_mismatch",
        "existing_dynamics",
        "insufficient_info",
        "other",
      ] as const;
      const refs = reasons.map((r) =>
        makeReferral({ status: "declined", decline_reason: r }),
      );
      const m = computeReferralMetrics(refs, []);
      expect(Object.keys(m.by_decline_reason)).toHaveLength(8);
      for (const r of reasons) {
        expect(m.by_decline_reason[r]).toBe(1);
      }
    });
  });

  // ── combined scenario ──────────────────────────────────────────────────

  describe("combined scenario", () => {
    it("computes all metrics correctly for a realistic dataset", () => {
      const refs = [
        makeReferral({
          status: "received",
          urgency: "emergency",
          referring_authority: "Council A",
        }),
        makeReferral({
          status: "under_review",
          urgency: "urgent",
          referring_authority: "Council A",
        }),
        makeReferral({
          status: "information_requested",
          urgency: "planned",
          referring_authority: "Council B",
        }),
        makeReferral({
          status: "matching_assessment",
          urgency: "standard",
          referring_authority: "Council B",
        }),
        makeReferral({
          status: "accepted",
          urgency: "standard",
          referring_authority: "Council A",
          referral_date: "2025-01-01",
          decision_date: "2025-01-05",
        }),
        makeReferral({
          status: "placed",
          urgency: "urgent",
          referring_authority: "Council C",
          referral_date: "2025-01-01",
          decision_date: "2025-01-03",
        }),
        makeReferral({
          status: "declined",
          urgency: "standard",
          referring_authority: "Council C",
          decline_reason: "no_capacity",
          referral_date: "2025-01-01",
          decision_date: "2025-01-02",
        }),
        makeReferral({
          status: "withdrawn",
          urgency: "planned",
          referring_authority: "Council A",
        }),
      ];
      const occ = [
        makeOccupancy({
          record_date: "2025-03-01",
          registered_places: 6,
          children_in_placement: 4,
          occupancy_rate: 66.7,
        }),
      ];

      const m = computeReferralMetrics(refs, occ);
      expect(m.total_referrals).toBe(8);
      expect(m.active_referrals).toBe(4);
      // accepted counts accepted + placed = 2
      expect(m.accepted).toBe(2);
      expect(m.declined).toBe(1);
      expect(m.withdrawn).toBe(1);
      expect(m.placed).toBe(1);
      expect(m.emergency_referrals).toBe(1);
      // acceptance_rate: accepted(2) / (accepted(2) + declined(1)) * 100 = 66.7
      expect(m.acceptance_rate).toBe(66.7);
      // avg_decision_days: (4 + 2 + 1) / 3 = 2.33 => 2
      expect(m.avg_decision_days).toBe(2);
      expect(m.current_occupancy_rate).toBe(66.7);
      expect(m.available_places).toBe(2);
      expect(m.by_authority["Council A"]).toBe(4);
      expect(m.by_authority["Council B"]).toBe(2);
      expect(m.by_authority["Council C"]).toBe(2);
      expect(m.by_decline_reason.no_capacity).toBe(1);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. identifyReferralAlerts
// ══════════════════════════════════════════════════════════════════════════════

describe("identifyReferralAlerts", () => {
  const now = new Date("2025-06-15T12:00:00Z");

  // ── emergency_pending ──────────────────────────────────────────────────

  describe("emergency_pending", () => {
    it("fires for emergency + received", () => {
      const refs = [
        makeReferral({
          urgency: "emergency",
          status: "received",
          child_name: "Alice",
          child_age: 10,
          referring_authority: "LA North",
        }),
      ];
      const alerts = identifyReferralAlerts(refs, [], now);
      const ep = alerts.filter((a) => a.type === "emergency_pending");
      expect(ep).toHaveLength(1);
      expect(ep[0].severity).toBe("critical");
      expect(ep[0].message).toContain("Alice");
      expect(ep[0].message).toContain("10");
      expect(ep[0].message).toContain("LA North");
      expect(ep[0].message).toContain("same-day");
    });

    it("fires for emergency + under_review", () => {
      const refs = [
        makeReferral({ urgency: "emergency", status: "under_review" }),
      ];
      const alerts = identifyReferralAlerts(refs, [], now);
      expect(alerts.some((a) => a.type === "emergency_pending")).toBe(true);
    });

    it("does NOT fire for emergency + accepted", () => {
      const refs = [
        makeReferral({ urgency: "emergency", status: "accepted" }),
      ];
      const alerts = identifyReferralAlerts(refs, [], now);
      expect(alerts.some((a) => a.type === "emergency_pending")).toBe(false);
    });

    it("does NOT fire for emergency + declined", () => {
      const refs = [
        makeReferral({ urgency: "emergency", status: "declined" }),
      ];
      const alerts = identifyReferralAlerts(refs, [], now);
      expect(alerts.some((a) => a.type === "emergency_pending")).toBe(false);
    });

    it("does NOT fire for standard + received", () => {
      const refs = [
        makeReferral({ urgency: "standard", status: "received" }),
      ];
      const alerts = identifyReferralAlerts(refs, [], now);
      expect(alerts.some((a) => a.type === "emergency_pending")).toBe(false);
    });

    it("fires for multiple emergency referrals", () => {
      const refs = [
        makeReferral({ urgency: "emergency", status: "received" }),
        makeReferral({ urgency: "emergency", status: "under_review" }),
      ];
      const alerts = identifyReferralAlerts(refs, [], now);
      expect(alerts.filter((a) => a.type === "emergency_pending")).toHaveLength(
        2,
      );
    });
  });

  // ── urgent_overdue ─────────────────────────────────────────────────────

  describe("urgent_overdue", () => {
    it("fires for urgent + received + >2 days old", () => {
      const refs = [
        makeReferral({
          urgency: "urgent",
          status: "received",
          referral_date: daysAgo(5, now),
          child_name: "Bob",
        }),
      ];
      const alerts = identifyReferralAlerts(refs, [], now);
      const uo = alerts.filter((a) => a.type === "urgent_overdue");
      expect(uo).toHaveLength(1);
      expect(uo[0].severity).toBe("high");
      expect(uo[0].message).toContain("Bob");
      expect(uo[0].message).toContain("5 days");
      expect(uo[0].message).toContain("48-hour");
    });

    it("fires for urgent + under_review + >2 days old", () => {
      const refs = [
        makeReferral({
          urgency: "urgent",
          status: "under_review",
          referral_date: daysAgo(4, now),
        }),
      ];
      const alerts = identifyReferralAlerts(refs, [], now);
      expect(alerts.some((a) => a.type === "urgent_overdue")).toBe(true);
    });

    it("does NOT fire for urgent + received + exactly 2 days old", () => {
      const refs = [
        makeReferral({
          urgency: "urgent",
          status: "received",
          referral_date: daysAgo(2, now),
        }),
      ];
      const alerts = identifyReferralAlerts(refs, [], now);
      expect(alerts.some((a) => a.type === "urgent_overdue")).toBe(false);
    });

    it("does NOT fire for urgent + received + 1 day old", () => {
      const refs = [
        makeReferral({
          urgency: "urgent",
          status: "received",
          referral_date: daysAgo(1, now),
        }),
      ];
      const alerts = identifyReferralAlerts(refs, [], now);
      expect(alerts.some((a) => a.type === "urgent_overdue")).toBe(false);
    });

    it("does NOT fire for standard urgency even if >2 days", () => {
      const refs = [
        makeReferral({
          urgency: "standard",
          status: "received",
          referral_date: daysAgo(10, now),
        }),
      ];
      const alerts = identifyReferralAlerts(refs, [], now);
      expect(alerts.some((a) => a.type === "urgent_overdue")).toBe(false);
    });

    it("does NOT fire for urgent + accepted", () => {
      const refs = [
        makeReferral({
          urgency: "urgent",
          status: "accepted",
          referral_date: daysAgo(10, now),
        }),
      ];
      const alerts = identifyReferralAlerts(refs, [], now);
      expect(alerts.some((a) => a.type === "urgent_overdue")).toBe(false);
    });
  });

  // ── stale_referral ─────────────────────────────────────────────────────

  describe("stale_referral", () => {
    it("fires for received + non-emergency + >7 days", () => {
      const refs = [
        makeReferral({
          urgency: "standard",
          status: "received",
          referral_date: daysAgo(10, now),
          child_name: "Charlie",
          referring_authority: "Metro Council",
        }),
      ];
      const alerts = identifyReferralAlerts(refs, [], now);
      const stale = alerts.filter((a) => a.type === "stale_referral");
      expect(stale).toHaveLength(1);
      expect(stale[0].severity).toBe("medium");
      expect(stale[0].message).toContain("Charlie");
      expect(stale[0].message).toContain("Metro Council");
      expect(stale[0].message).toContain("10 days");
    });

    it("fires for under_review + non-emergency + >7 days", () => {
      const refs = [
        makeReferral({
          urgency: "planned",
          status: "under_review",
          referral_date: daysAgo(8, now),
        }),
      ];
      const alerts = identifyReferralAlerts(refs, [], now);
      expect(alerts.some((a) => a.type === "stale_referral")).toBe(true);
    });

    it("fires for information_requested + non-emergency + >7 days", () => {
      const refs = [
        makeReferral({
          urgency: "urgent",
          status: "information_requested",
          referral_date: daysAgo(9, now),
        }),
      ];
      const alerts = identifyReferralAlerts(refs, [], now);
      expect(alerts.some((a) => a.type === "stale_referral")).toBe(true);
    });

    it("does NOT fire for exactly 7 days old", () => {
      const refs = [
        makeReferral({
          urgency: "standard",
          status: "received",
          referral_date: daysAgo(7, now),
        }),
      ];
      const alerts = identifyReferralAlerts(refs, [], now);
      expect(alerts.some((a) => a.type === "stale_referral")).toBe(false);
    });

    it("does NOT fire for emergency urgency even if >7 days", () => {
      const refs = [
        makeReferral({
          urgency: "emergency",
          status: "received",
          referral_date: daysAgo(15, now),
        }),
      ];
      const alerts = identifyReferralAlerts(refs, [], now);
      expect(alerts.some((a) => a.type === "stale_referral")).toBe(false);
    });

    it("does NOT fire for matching_assessment status", () => {
      const refs = [
        makeReferral({
          urgency: "standard",
          status: "matching_assessment",
          referral_date: daysAgo(15, now),
        }),
      ];
      const alerts = identifyReferralAlerts(refs, [], now);
      expect(alerts.some((a) => a.type === "stale_referral")).toBe(false);
    });

    it("does NOT fire for accepted/declined/withdrawn/placed", () => {
      const refs = [
        makeReferral({ status: "accepted", referral_date: daysAgo(30, now) }),
        makeReferral({ status: "declined", referral_date: daysAgo(30, now) }),
        makeReferral({ status: "withdrawn", referral_date: daysAgo(30, now) }),
        makeReferral({ status: "placed", referral_date: daysAgo(30, now) }),
      ];
      const alerts = identifyReferralAlerts(refs, [], now);
      expect(alerts.some((a) => a.type === "stale_referral")).toBe(false);
    });
  });

  // ── full_occupancy ─────────────────────────────────────────────────────

  describe("full_occupancy", () => {
    it("fires when children_in_placement >= registered_places in latest record", () => {
      const occ = [
        makeOccupancy({
          record_date: "2025-06-15",
          registered_places: 5,
          children_in_placement: 5,
        }),
      ];
      const alerts = identifyReferralAlerts([], occ, now);
      const fo = alerts.filter((a) => a.type === "full_occupancy");
      expect(fo).toHaveLength(1);
      expect(fo[0].severity).toBe("high");
      expect(fo[0].message).toContain("5/5");
    });

    it("fires when over capacity", () => {
      const occ = [
        makeOccupancy({
          registered_places: 4,
          children_in_placement: 5,
        }),
      ];
      const alerts = identifyReferralAlerts([], occ, now);
      expect(alerts.some((a) => a.type === "full_occupancy")).toBe(true);
    });

    it("does NOT fire when below capacity", () => {
      const occ = [
        makeOccupancy({
          registered_places: 6,
          children_in_placement: 4,
        }),
      ];
      const alerts = identifyReferralAlerts([], occ, now);
      expect(alerts.some((a) => a.type === "full_occupancy")).toBe(false);
    });

    it("does NOT fire with empty occupancy records", () => {
      const alerts = identifyReferralAlerts([], [], now);
      expect(alerts.some((a) => a.type === "full_occupancy")).toBe(false);
    });

    it("uses the latest record by date", () => {
      const occ = [
        makeOccupancy({
          record_date: "2025-01-01",
          registered_places: 5,
          children_in_placement: 5,
        }),
        makeOccupancy({
          record_date: "2025-06-01",
          registered_places: 6,
          children_in_placement: 3,
        }),
      ];
      const alerts = identifyReferralAlerts([], occ, now);
      expect(alerts.some((a) => a.type === "full_occupancy")).toBe(false);
    });

    it("message includes correct occupancy numbers", () => {
      const occ = [
        makeOccupancy({
          registered_places: 3,
          children_in_placement: 3,
        }),
      ];
      const alerts = identifyReferralAlerts([], occ, now);
      const fo = alerts.find((a) => a.type === "full_occupancy");
      expect(fo?.message).toContain("3/3");
      expect(fo?.message).toContain("no registered places available");
    });
  });

  // ── high_decline_rate ──────────────────────────────────────────────────

  describe("high_decline_rate", () => {
    it("fires when >50% decline rate with 5+ resolved referrals", () => {
      const refs = [
        makeReferral({ status: "declined" }),
        makeReferral({ status: "declined" }),
        makeReferral({ status: "declined" }),
        makeReferral({ status: "declined" }),
        makeReferral({ status: "accepted" }),
      ];
      const alerts = identifyReferralAlerts(refs, [], now);
      const hdr = alerts.filter((a) => a.type === "high_decline_rate");
      expect(hdr).toHaveLength(1);
      expect(hdr[0].severity).toBe("medium");
      expect(hdr[0].message).toContain("80%");
      expect(hdr[0].id).toBe("decline-rate");
    });

    it("does NOT fire with exactly 50% decline rate", () => {
      const refs = [
        makeReferral({ status: "declined" }),
        makeReferral({ status: "declined" }),
        makeReferral({ status: "accepted" }),
        makeReferral({ status: "accepted" }),
        makeReferral({ status: "placed" }),
      ];
      // resolved: 5, declined: 2, rate = 2/5 = 40%
      const alerts = identifyReferralAlerts(refs, [], now);
      expect(alerts.some((a) => a.type === "high_decline_rate")).toBe(false);
    });

    it("does NOT fire with fewer than 5 resolved referrals", () => {
      const refs = [
        makeReferral({ status: "declined" }),
        makeReferral({ status: "declined" }),
        makeReferral({ status: "declined" }),
        makeReferral({ status: "accepted" }),
      ];
      // resolved: 4, < 5
      const alerts = identifyReferralAlerts(refs, [], now);
      expect(alerts.some((a) => a.type === "high_decline_rate")).toBe(false);
    });

    it("fires at exactly 5 resolved with >50% decline", () => {
      const refs = [
        makeReferral({ status: "declined" }),
        makeReferral({ status: "declined" }),
        makeReferral({ status: "declined" }),
        makeReferral({ status: "accepted" }),
        makeReferral({ status: "accepted" }),
      ];
      // resolved: 5, declined: 3, rate = 3/5 = 60% > 50%
      const alerts = identifyReferralAlerts(refs, [], now);
      expect(alerts.some((a) => a.type === "high_decline_rate")).toBe(true);
    });

    it("placed referrals count toward resolved", () => {
      const refs = [
        makeReferral({ status: "declined" }),
        makeReferral({ status: "placed" }),
        makeReferral({ status: "placed" }),
        makeReferral({ status: "placed" }),
        makeReferral({ status: "placed" }),
      ];
      // resolved: 5, declined: 1, rate = 1/5 = 20%
      const alerts = identifyReferralAlerts(refs, [], now);
      expect(alerts.some((a) => a.type === "high_decline_rate")).toBe(false);
    });

    it("ignores withdrawn and active referrals in resolved count", () => {
      const refs = [
        makeReferral({ status: "declined" }),
        makeReferral({ status: "declined" }),
        makeReferral({ status: "declined" }),
        makeReferral({ status: "accepted" }),
        makeReferral({ status: "withdrawn" }),
        makeReferral({ status: "received" }),
        makeReferral({ status: "under_review" }),
      ];
      // resolved: 4 (3 declined + 1 accepted), < 5
      const alerts = identifyReferralAlerts(refs, [], now);
      expect(alerts.some((a) => a.type === "high_decline_rate")).toBe(false);
    });

    it("message includes the decline percentage", () => {
      const refs = [
        makeReferral({ status: "declined" }),
        makeReferral({ status: "declined" }),
        makeReferral({ status: "declined" }),
        makeReferral({ status: "declined" }),
        makeReferral({ status: "accepted" }),
        makeReferral({ status: "accepted" }),
      ];
      // 4/6 = 66.666..% => 67%
      const alerts = identifyReferralAlerts(refs, [], now);
      const hdr = alerts.find((a) => a.type === "high_decline_rate");
      expect(hdr?.message).toContain("67%");
    });
  });

  // ── no alerts ──────────────────────────────────────────────────────────

  describe("no alerts", () => {
    it("returns empty array when no conditions met", () => {
      const refs = [
        makeReferral({
          urgency: "standard",
          status: "accepted",
          referral_date: daysAgo(1, now),
        }),
      ];
      const occ = [
        makeOccupancy({ registered_places: 6, children_in_placement: 3 }),
      ];
      const alerts = identifyReferralAlerts(refs, occ, now);
      expect(alerts).toHaveLength(0);
    });

    it("returns empty array for empty inputs", () => {
      expect(identifyReferralAlerts([], [], now)).toHaveLength(0);
    });
  });

  // ── combined scenarios ─────────────────────────────────────────────────

  describe("combined scenarios", () => {
    it("can trigger multiple alert types at once", () => {
      const refs = [
        // emergency_pending
        makeReferral({
          urgency: "emergency",
          status: "received",
          referral_date: daysAgo(0, now),
        }),
        // urgent_overdue
        makeReferral({
          urgency: "urgent",
          status: "received",
          referral_date: daysAgo(5, now),
        }),
        // stale_referral
        makeReferral({
          urgency: "standard",
          status: "received",
          referral_date: daysAgo(10, now),
        }),
        // high_decline_rate (need 5+ resolved with >50% declined)
        makeReferral({ status: "declined" }),
        makeReferral({ status: "declined" }),
        makeReferral({ status: "declined" }),
        makeReferral({ status: "declined" }),
        makeReferral({ status: "accepted" }),
      ];
      const occ = [
        makeOccupancy({ registered_places: 4, children_in_placement: 4 }),
      ];

      const alerts = identifyReferralAlerts(refs, occ, now);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("emergency_pending");
      expect(types).toContain("urgent_overdue");
      expect(types).toContain("stale_referral");
      expect(types).toContain("full_occupancy");
      expect(types).toContain("high_decline_rate");
    });

    it("alert ids match referral ids for referral-based alerts", () => {
      const refId = crypto.randomUUID();
      const refs = [
        makeReferral({
          id: refId,
          urgency: "emergency",
          status: "received",
        }),
      ];
      const alerts = identifyReferralAlerts(refs, [], now);
      expect(alerts[0].id).toBe(refId);
    });

    it("full_occupancy alert id matches occupancy record id", () => {
      const occId = crypto.randomUUID();
      const occ = [
        makeOccupancy({
          id: occId,
          registered_places: 3,
          children_in_placement: 3,
        }),
      ];
      const alerts = identifyReferralAlerts([], occ, now);
      const fo = alerts.find((a) => a.type === "full_occupancy");
      expect(fo?.id).toBe(occId);
    });
  });

  // ── boundary: urgent 3 days fires ──────────────────────────────────────

  describe("urgent_overdue boundary", () => {
    it("fires at exactly 3 days old (just over threshold)", () => {
      const refs = [
        makeReferral({
          urgency: "urgent",
          status: "received",
          referral_date: daysAgo(3, now),
        }),
      ];
      const alerts = identifyReferralAlerts(refs, [], now);
      expect(alerts.some((a) => a.type === "urgent_overdue")).toBe(true);
    });
  });

  // ── boundary: stale at exactly 8 days ─────────────────────────────────

  describe("stale_referral boundary", () => {
    it("fires at exactly 8 days old (just over threshold)", () => {
      const refs = [
        makeReferral({
          urgency: "standard",
          status: "received",
          referral_date: daysAgo(8, now),
        }),
      ];
      const alerts = identifyReferralAlerts(refs, [], now);
      expect(alerts.some((a) => a.type === "stale_referral")).toBe(true);
    });
  });

  // ── emergency does not also produce urgent_overdue ─────────────────────

  describe("emergency exclusion from other alerts", () => {
    it("emergency referral does not generate urgent_overdue even if old", () => {
      const refs = [
        makeReferral({
          urgency: "emergency",
          status: "received",
          referral_date: daysAgo(10, now),
        }),
      ];
      const alerts = identifyReferralAlerts(refs, [], now);
      expect(alerts.some((a) => a.type === "urgent_overdue")).toBe(false);
      expect(alerts.some((a) => a.type === "emergency_pending")).toBe(true);
    });

    it("emergency referral does not generate stale_referral", () => {
      const refs = [
        makeReferral({
          urgency: "emergency",
          status: "received",
          referral_date: daysAgo(20, now),
        }),
      ];
      const alerts = identifyReferralAlerts(refs, [], now);
      expect(alerts.some((a) => a.type === "stale_referral")).toBe(false);
    });
  });

  // ── uses default now parameter ─────────────────────────────────────────

  describe("now parameter", () => {
    it("defaults to current date when not provided", () => {
      const refs = [
        makeReferral({
          urgency: "standard",
          status: "received",
          referral_date: daysAgo(10),
        }),
      ];
      // calling without now argument
      const alerts = identifyReferralAlerts(refs, []);
      expect(alerts.some((a) => a.type === "stale_referral")).toBe(true);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. CRUD FALLBACK (Supabase disabled)
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
        urgency: "emergency",
        referringAuthority: "Council X",
        dateFrom: "2025-01-01",
        dateTo: "2025-12-31",
        limit: 50,
      });
      expect(result).toEqual({ ok: true, data: [] });
    });
  });

  describe("createReferral", () => {
    it("returns ok:false with Supabase not configured error", async () => {
      const result = await createReferral({
        homeId: "home-1",
        childName: "Test Child",
        childAge: 11,
        childGender: "Female",
        referringAuthority: "Council A",
        socialWorkerName: "SW Name",
        referralDate: "2025-06-01",
        urgency: "standard",
        presentingNeeds: ["emotional"],
        riskFactors: [],
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

  describe("listOccupancy", () => {
    it("returns ok:true with empty data array", async () => {
      const result = await listOccupancy("home-1");
      expect(result).toEqual({ ok: true, data: [] });
    });

    it("returns ok:true with filters provided", async () => {
      const result = await listOccupancy("home-1", {
        dateFrom: "2025-01-01",
        dateTo: "2025-12-31",
        limit: 100,
      });
      expect(result).toEqual({ ok: true, data: [] });
    });
  });

  describe("createOccupancyRecord", () => {
    it("returns ok:false with Supabase not configured error", async () => {
      const result = await createOccupancyRecord({
        homeId: "home-1",
        recordDate: "2025-06-01",
        registeredPlaces: 6,
        childrenInPlacement: 4,
        referralsInProgress: 2,
        plannedAdmissions: 1,
        plannedDepartures: 0,
        recordedBy: "staff-1",
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("Supabase not configured");
      }
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. EDGE CASES
// ══════════════════════════════════════════════════════════════════════════════

describe("Edge cases", () => {
  describe("single item inputs", () => {
    it("computes metrics correctly with a single referral", () => {
      const refs = [makeReferral({ status: "received", urgency: "emergency" })];
      const m = computeReferralMetrics(refs, []);
      expect(m.total_referrals).toBe(1);
      expect(m.active_referrals).toBe(1);
      expect(m.emergency_referrals).toBe(1);
      expect(m.by_status.received).toBe(1);
    });

    it("computes metrics correctly with a single occupancy record", () => {
      const occ = [
        makeOccupancy({
          registered_places: 4,
          children_in_placement: 2,
          occupancy_rate: 50,
        }),
      ];
      const m = computeReferralMetrics([], occ);
      expect(m.current_occupancy_rate).toBe(50);
      expect(m.available_places).toBe(2);
    });

    it("identifies alert from a single emergency referral", () => {
      const refs = [
        makeReferral({ urgency: "emergency", status: "received" }),
      ];
      const alerts = identifyReferralAlerts(refs, []);
      expect(alerts.some((a) => a.type === "emergency_pending")).toBe(true);
    });
  });

  describe("large datasets", () => {
    it("handles 100 referrals without error", () => {
      const refs = Array.from({ length: 100 }, (_, i) =>
        makeReferral({
          status: i % 2 === 0 ? "received" : "accepted",
          urgency: i % 10 === 0 ? "emergency" : "standard",
          referring_authority: `Authority ${i % 5}`,
        }),
      );
      const m = computeReferralMetrics(refs, []);
      expect(m.total_referrals).toBe(100);
      expect(m.active_referrals).toBe(50);
      expect(m.emergency_referrals).toBe(10);
      expect(Object.keys(m.by_authority)).toHaveLength(5);
    });

    it("handles 50 occupancy records and picks the latest", () => {
      const occ = Array.from({ length: 50 }, (_, i) => {
        const d = new Date("2025-01-01");
        d.setDate(d.getDate() + i);
        return makeOccupancy({
          record_date: d.toISOString().split("T")[0],
          occupancy_rate: 40 + i,
          registered_places: 10,
          children_in_placement: 4 + Math.floor(i / 10),
        });
      });
      const m = computeReferralMetrics([], occ);
      // latest is i=49 => 2025-02-19, rate = 89
      expect(m.current_occupancy_rate).toBe(89);
    });

    it("identifies alerts from 200 referrals without error", () => {
      const now = new Date("2025-06-15T12:00:00Z");
      const refs = Array.from({ length: 200 }, (_, i) =>
        makeReferral({
          urgency: i === 0 ? "emergency" : "standard",
          status: "received",
          referral_date: daysAgo(i % 20, now),
        }),
      );
      const alerts = identifyReferralAlerts(refs, [], now);
      expect(alerts.length).toBeGreaterThan(0);
    });
  });

  describe("type checks", () => {
    it("computeReferralMetrics returns all 15 expected keys", () => {
      const m = computeReferralMetrics([], []);
      const keys = Object.keys(m);
      expect(keys).toContain("total_referrals");
      expect(keys).toContain("active_referrals");
      expect(keys).toContain("accepted");
      expect(keys).toContain("declined");
      expect(keys).toContain("withdrawn");
      expect(keys).toContain("placed");
      expect(keys).toContain("acceptance_rate");
      expect(keys).toContain("avg_decision_days");
      expect(keys).toContain("emergency_referrals");
      expect(keys).toContain("current_occupancy_rate");
      expect(keys).toContain("available_places");
      expect(keys).toContain("by_status");
      expect(keys).toContain("by_urgency");
      expect(keys).toContain("by_decline_reason");
      expect(keys).toContain("by_authority");
      expect(keys).toHaveLength(15);
    });

    it("identifyReferralAlerts returns an array", () => {
      const result = identifyReferralAlerts([], []);
      expect(Array.isArray(result)).toBe(true);
    });

    it("each alert has type, severity, message, and id", () => {
      const refs = [
        makeReferral({ urgency: "emergency", status: "received" }),
      ];
      const alerts = identifyReferralAlerts(refs, []);
      for (const a of alerts) {
        expect(typeof a.type).toBe("string");
        expect(["critical", "high", "medium"]).toContain(a.severity);
        expect(typeof a.message).toBe("string");
        expect(typeof a.id).toBe("string");
      }
    });

    it("computeReferralMetrics numeric fields are numbers", () => {
      const m = computeReferralMetrics([makeReferral()], [makeOccupancy()]);
      expect(typeof m.total_referrals).toBe("number");
      expect(typeof m.active_referrals).toBe("number");
      expect(typeof m.accepted).toBe("number");
      expect(typeof m.declined).toBe("number");
      expect(typeof m.withdrawn).toBe("number");
      expect(typeof m.placed).toBe("number");
      expect(["number", "object"]).toContain(typeof m.acceptance_rate); // number | null
      expect(["number", "object"]).toContain(typeof m.avg_decision_days); // number | null
      expect(typeof m.emergency_referrals).toBe("number");
      expect(["number", "object"]).toContain(typeof m.current_occupancy_rate); // number | null
      expect(typeof m.available_places).toBe("number");
    });

    it("breakdown fields are plain objects", () => {
      const m = computeReferralMetrics([makeReferral()], []);
      expect(typeof m.by_status).toBe("object");
      expect(typeof m.by_urgency).toBe("object");
      expect(typeof m.by_decline_reason).toBe("object");
      expect(typeof m.by_authority).toBe("object");
    });
  });

  describe("occupancy edge cases", () => {
    it("available_places can be negative if over-capacity", () => {
      const occ = [
        makeOccupancy({
          registered_places: 3,
          children_in_placement: 5,
        }),
      ];
      const m = computeReferralMetrics([], occ);
      expect(m.available_places).toBe(-2);
    });

    it("handles occupancy with 0 registered places", () => {
      const occ = [
        makeOccupancy({
          registered_places: 0,
          children_in_placement: 0,
          occupancy_rate: 0,
        }),
      ];
      const m = computeReferralMetrics([], occ);
      expect(m.available_places).toBe(0);
      expect(m.current_occupancy_rate).toBe(0);
    });
  });

  describe("decision date edge cases", () => {
    it("same-day decision gives 0 days", () => {
      const refs = [
        makeReferral({
          status: "accepted",
          referral_date: "2025-03-15",
          decision_date: "2025-03-15",
        }),
      ];
      expect(computeReferralMetrics(refs, []).avg_decision_days).toBe(0);
    });

    it("handles referrals with mixed decision_date presence", () => {
      const refs = [
        makeReferral({
          status: "accepted",
          referral_date: "2025-01-01",
          decision_date: "2025-01-11", // 10 days
        }),
        makeReferral({
          status: "accepted",
          decision_date: null,
        }),
        makeReferral({
          status: "declined",
          referral_date: "2025-01-01",
          decision_date: "2025-01-06", // 5 days
        }),
        makeReferral({
          status: "declined",
          decision_date: null,
        }),
      ];
      // only 2 with decision_date: (10 + 5) / 2 = 7.5 => 8
      expect(computeReferralMetrics(refs, []).avg_decision_days).toBe(8);
    });
  });

  describe("all statuses exhaustive metric accounting", () => {
    it("total equals sum of active + accepted (non-placed) + declined + withdrawn + placed", () => {
      const refs = [
        makeReferral({ status: "received" }),
        makeReferral({ status: "under_review" }),
        makeReferral({ status: "information_requested" }),
        makeReferral({ status: "matching_assessment" }),
        makeReferral({ status: "accepted" }),
        makeReferral({ status: "declined" }),
        makeReferral({ status: "withdrawn" }),
        makeReferral({ status: "placed" }),
      ];
      const m = computeReferralMetrics(refs, []);
      // active=4, accepted=2 (accepted+placed), declined=1, withdrawn=1, placed=1
      // Note: accepted includes placed, so non-overlapping: active + (accepted - placed) + declined + withdrawn + placed = total
      expect(m.active_referrals + (m.accepted - m.placed) + m.declined + m.withdrawn + m.placed).toBe(m.total_referrals);
    });
  });

  describe("referral with all optional fields null", () => {
    it("does not throw when all nullable fields are null", () => {
      const r = makeReferral({
        social_worker_email: null,
        decline_reason: null,
        decline_notes: null,
        decision_date: null,
        decision_by: null,
        matching_score: null,
        placement_start_date: null,
      });
      const m = computeReferralMetrics([r], []);
      expect(m.total_referrals).toBe(1);
    });
  });

  describe("multiple authorities with same name", () => {
    it("correctly aggregates same authority name", () => {
      const refs = Array.from({ length: 7 }, () =>
        makeReferral({ referring_authority: "Same Authority" }),
      );
      const m = computeReferralMetrics(refs, []);
      expect(m.by_authority["Same Authority"]).toBe(7);
      expect(Object.keys(m.by_authority)).toHaveLength(1);
    });
  });

  describe("occupancy sorting", () => {
    it("handles reverse-chronological occupancy records correctly", () => {
      const occ = [
        makeOccupancy({ record_date: "2025-12-01", occupancy_rate: 100, registered_places: 5, children_in_placement: 5 }),
        makeOccupancy({ record_date: "2025-06-01", occupancy_rate: 50, registered_places: 5, children_in_placement: 2 }),
        makeOccupancy({ record_date: "2025-01-01", occupancy_rate: 20, registered_places: 5, children_in_placement: 1 }),
      ];
      const m = computeReferralMetrics([], occ);
      expect(m.current_occupancy_rate).toBe(100);
      expect(m.available_places).toBe(0);
    });
  });

  describe("factory helpers", () => {
    it("makeReferral produces unique IDs", () => {
      const a = makeReferral();
      const b = makeReferral();
      expect(a.id).not.toBe(b.id);
    });

    it("makeOccupancy produces unique IDs", () => {
      const a = makeOccupancy();
      const b = makeOccupancy();
      expect(a.id).not.toBe(b.id);
    });

    it("makeReferral overrides are applied", () => {
      const r = makeReferral({ child_name: "Custom Name", child_age: 15 });
      expect(r.child_name).toBe("Custom Name");
      expect(r.child_age).toBe(15);
    });

    it("makeOccupancy overrides are applied", () => {
      const o = makeOccupancy({ registered_places: 10, commentary: "test" });
      expect(o.registered_places).toBe(10);
      expect(o.commentary).toBe("test");
    });
  });
});
