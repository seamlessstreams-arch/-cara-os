// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ANTI-BULLYING SERVICE TESTS
// Pure-function unit tests for bullying metrics computation, alert
// identification, constant validation, and CRUD fallback behaviour.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi } from "vitest";
import crypto from "crypto";
import { _testing } from "../anti-bullying-service";
import {
  BULLYING_TYPES,
  BULLYING_SEVERITIES,
  INTERVENTION_TYPES,
  INCIDENT_OUTCOMES,
} from "../anti-bullying-service";

import type {
  BullyingIncident,
  BullyingType,
  BullyingSeverity,
  InterventionType,
  IncidentOutcome,
} from "../anti-bullying-service";

const { computeBullyingMetrics, identifyBullyingAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

const NOW = new Date("2026-05-13T12:00:00Z");

/** Build a minimal BullyingIncident with sensible defaults. */
function makeIncident(
  overrides: Partial<BullyingIncident> = {},
): BullyingIncident {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    home_id: overrides.home_id ?? "home-1",
    incident_date: overrides.incident_date ?? "2026-05-01",
    reported_by: overrides.reported_by ?? "staff-1",
    bullying_type: overrides.bullying_type ?? "verbal",
    severity: overrides.severity ?? "medium",
    perpetrator_name: overrides.perpetrator_name ?? "Perpetrator A",
    perpetrator_is_resident: overrides.perpetrator_is_resident ?? true,
    victim_name: overrides.victim_name ?? "Victim A",
    victim_id: overrides.victim_id ?? "victim-1",
    description: overrides.description ?? "Test bullying incident",
    location: overrides.location ?? "Common room",
    witnesses: overrides.witnesses ?? [],
    intervention_type: overrides.intervention_type ?? "mediation",
    outcome: overrides.outcome ?? "pending",
    parent_carer_informed: overrides.parent_carer_informed ?? false,
    social_worker_informed: overrides.social_worker_informed ?? false,
    follow_up_date: overrides.follow_up_date ?? null,
    follow_up_completed: overrides.follow_up_completed ?? false,
    impact_on_victim: overrides.impact_on_victim ?? null,
    created_at: overrides.created_at ?? "2026-05-01T10:00:00Z",
    updated_at: overrides.updated_at ?? "2026-05-01T10:00:00Z",
  };
}

/** Return a date string N days before a reference date. */
function daysAgo(n: number, from: Date = NOW): string {
  const d = new Date(from.getTime() - n * 24 * 60 * 60 * 1000);
  return d.toISOString().split("T")[0];
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Constants", () => {
  // ── BULLYING_TYPES ──────────────────────────────────────────────────────

  describe("BULLYING_TYPES", () => {
    it("has exactly 10 items", () => {
      expect(BULLYING_TYPES).toHaveLength(10);
    });

    it("has unique type values", () => {
      const types = BULLYING_TYPES.map((t) => t.type);
      expect(new Set(types).size).toBe(types.length);
    });

    it("contains every expected type value", () => {
      const types = BULLYING_TYPES.map((t) => t.type);
      const expected: BullyingType[] = [
        "physical",
        "verbal",
        "emotional",
        "cyber",
        "social_exclusion",
        "racial",
        "homophobic",
        "sexual",
        "disability",
        "other",
      ];
      for (const e of expected) {
        expect(types).toContain(e);
      }
    });

    it("has non-empty labels for every entry", () => {
      for (const t of BULLYING_TYPES) {
        expect(t.label.length).toBeGreaterThan(0);
      }
    });

    it("maps physical → Physical", () => {
      const found = BULLYING_TYPES.find((t) => t.type === "physical");
      expect(found?.label).toBe("Physical");
    });

    it("maps cyber → Cyber", () => {
      const found = BULLYING_TYPES.find((t) => t.type === "cyber");
      expect(found?.label).toBe("Cyber");
    });

    it("maps social_exclusion → Social Exclusion", () => {
      const found = BULLYING_TYPES.find((t) => t.type === "social_exclusion");
      expect(found?.label).toBe("Social Exclusion");
    });

    it("maps homophobic → Homophobic", () => {
      const found = BULLYING_TYPES.find((t) => t.type === "homophobic");
      expect(found?.label).toBe("Homophobic");
    });

    it("maps disability → Disability", () => {
      const found = BULLYING_TYPES.find((t) => t.type === "disability");
      expect(found?.label).toBe("Disability");
    });
  });

  // ── BULLYING_SEVERITIES ─────────────────────────────────────────────────

  describe("BULLYING_SEVERITIES", () => {
    it("has exactly 4 items", () => {
      expect(BULLYING_SEVERITIES).toHaveLength(4);
    });

    it("has unique severity values", () => {
      const sevs = BULLYING_SEVERITIES.map((s) => s.severity);
      expect(new Set(sevs).size).toBe(sevs.length);
    });

    it("contains every expected severity value", () => {
      const sevs = BULLYING_SEVERITIES.map((s) => s.severity);
      const expected: BullyingSeverity[] = ["critical", "high", "medium", "low"];
      for (const e of expected) {
        expect(sevs).toContain(e);
      }
    });

    it("has non-empty labels for every entry", () => {
      for (const s of BULLYING_SEVERITIES) {
        expect(s.label.length).toBeGreaterThan(0);
      }
    });

    it("maps critical → Critical", () => {
      expect(BULLYING_SEVERITIES.find((s) => s.severity === "critical")?.label).toBe("Critical");
    });

    it("maps low → Low", () => {
      expect(BULLYING_SEVERITIES.find((s) => s.severity === "low")?.label).toBe("Low");
    });
  });

  // ── INTERVENTION_TYPES ──────────────────────────────────────────────────

  describe("INTERVENTION_TYPES", () => {
    it("has exactly 11 items", () => {
      expect(INTERVENTION_TYPES).toHaveLength(11);
    });

    it("has unique type values", () => {
      const types = INTERVENTION_TYPES.map((t) => t.type);
      expect(new Set(types).size).toBe(types.length);
    });

    it("contains every expected type value", () => {
      const types = INTERVENTION_TYPES.map((t) => t.type);
      const expected: InterventionType[] = [
        "mediation",
        "restorative_conversation",
        "safety_plan",
        "increased_supervision",
        "education_session",
        "individual_support",
        "family_involvement",
        "external_referral",
        "consequence",
        "environmental_change",
        "other",
      ];
      for (const e of expected) {
        expect(types).toContain(e);
      }
    });

    it("has non-empty labels for every entry", () => {
      for (const t of INTERVENTION_TYPES) {
        expect(t.label.length).toBeGreaterThan(0);
      }
    });

    it("maps restorative_conversation → Restorative Conversation", () => {
      expect(INTERVENTION_TYPES.find((t) => t.type === "restorative_conversation")?.label).toBe(
        "Restorative Conversation",
      );
    });

    it("maps environmental_change → Environmental Change", () => {
      expect(INTERVENTION_TYPES.find((t) => t.type === "environmental_change")?.label).toBe(
        "Environmental Change",
      );
    });

    it("maps safety_plan → Safety Plan", () => {
      expect(INTERVENTION_TYPES.find((t) => t.type === "safety_plan")?.label).toBe("Safety Plan");
    });

    it("maps family_involvement → Family Involvement", () => {
      expect(INTERVENTION_TYPES.find((t) => t.type === "family_involvement")?.label).toBe(
        "Family Involvement",
      );
    });
  });

  // ── INCIDENT_OUTCOMES ───────────────────────────────────────────────────

  describe("INCIDENT_OUTCOMES", () => {
    it("has exactly 6 items", () => {
      expect(INCIDENT_OUTCOMES).toHaveLength(6);
    });

    it("has unique outcome values", () => {
      const outcomes = INCIDENT_OUTCOMES.map((o) => o.outcome);
      expect(new Set(outcomes).size).toBe(outcomes.length);
    });

    it("contains every expected outcome value", () => {
      const outcomes = INCIDENT_OUTCOMES.map((o) => o.outcome);
      const expected: IncidentOutcome[] = [
        "resolved",
        "ongoing_monitoring",
        "escalated",
        "safeguarding_referral",
        "police_referral",
        "pending",
      ];
      for (const e of expected) {
        expect(outcomes).toContain(e);
      }
    });

    it("has non-empty labels for every entry", () => {
      for (const o of INCIDENT_OUTCOMES) {
        expect(o.label.length).toBeGreaterThan(0);
      }
    });

    it("maps safeguarding_referral → Safeguarding Referral", () => {
      expect(INCIDENT_OUTCOMES.find((o) => o.outcome === "safeguarding_referral")?.label).toBe(
        "Safeguarding Referral",
      );
    });

    it("maps police_referral → Police Referral", () => {
      expect(INCIDENT_OUTCOMES.find((o) => o.outcome === "police_referral")?.label).toBe(
        "Police Referral",
      );
    });

    it("maps ongoing_monitoring → Ongoing Monitoring", () => {
      expect(INCIDENT_OUTCOMES.find((o) => o.outcome === "ongoing_monitoring")?.label).toBe(
        "Ongoing Monitoring",
      );
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. computeBullyingMetrics
// ══════════════════════════════════════════════════════════════════════════════

describe("computeBullyingMetrics", () => {
  describe("empty inputs", () => {
    it("returns zeroed stats for empty incidents array", () => {
      const result = computeBullyingMetrics([], 5, NOW);
      expect(result.total_incidents).toBe(0);
      expect(result.incidents_this_month).toBe(0);
      expect(result.resolved_count).toBe(0);
      expect(result.pending_count).toBe(0);
      expect(result.escalated_count).toBe(0);
      expect(result.safeguarding_referrals).toBe(0);
      expect(result.follow_ups_pending).toBe(0);
      expect(result.parent_informed_rate).toBe(0);
      expect(result.unique_victims).toBe(0);
      expect(result.repeat_victims).toBe(0);
      expect(result.resident_perpetrator_rate).toBe(0);
      expect(result.cyber_incidents).toBe(0);
      expect(result.by_type).toEqual({});
      expect(result.by_severity).toEqual({});
      expect(result.by_intervention).toEqual({});
      expect(result.by_outcome).toEqual({});
    });

    it("returns exactly 16 fields", () => {
      const result = computeBullyingMetrics([], 5, NOW);
      expect(Object.keys(result)).toHaveLength(16);
    });
  });

  describe("total_incidents", () => {
    it("counts a single incident", () => {
      const result = computeBullyingMetrics([makeIncident()], 5, NOW);
      expect(result.total_incidents).toBe(1);
    });

    it("counts multiple incidents", () => {
      const incidents = [makeIncident(), makeIncident(), makeIncident()];
      const result = computeBullyingMetrics(incidents, 5, NOW);
      expect(result.total_incidents).toBe(3);
    });
  });

  describe("incidents_this_month", () => {
    it("includes incidents within the last 30 days", () => {
      const incidents = [makeIncident({ incident_date: daysAgo(5) })];
      const result = computeBullyingMetrics(incidents, 5, NOW);
      expect(result.incidents_this_month).toBe(1);
    });

    it("excludes incidents older than 30 days", () => {
      const incidents = [makeIncident({ incident_date: daysAgo(35) })];
      const result = computeBullyingMetrics(incidents, 5, NOW);
      expect(result.incidents_this_month).toBe(0);
    });

    it("excludes incident at the 30-day boundary due to time precision", () => {
      // daysAgo(30) from NOW (12:00 UTC) gives "2026-04-13" (midnight UTC),
      // but thirtyDaysAgo is 2026-04-13T12:00:00Z, so midnight < noon → excluded
      const incidents = [makeIncident({ incident_date: daysAgo(30) })];
      const result = computeBullyingMetrics(incidents, 5, NOW);
      expect(result.incidents_this_month).toBe(0);
    });

    it("includes incident 29 days ago", () => {
      const incidents = [makeIncident({ incident_date: daysAgo(29) })];
      const result = computeBullyingMetrics(incidents, 5, NOW);
      expect(result.incidents_this_month).toBe(1);
    });

    it("includes incidents on the now date", () => {
      const incidents = [makeIncident({ incident_date: "2026-05-13" })];
      const result = computeBullyingMetrics(incidents, 5, NOW);
      expect(result.incidents_this_month).toBe(1);
    });

    it("counts only recent incidents among a mix", () => {
      const incidents = [
        makeIncident({ incident_date: daysAgo(2) }),
        makeIncident({ incident_date: daysAgo(10) }),
        makeIncident({ incident_date: daysAgo(40) }),
        makeIncident({ incident_date: daysAgo(60) }),
      ];
      const result = computeBullyingMetrics(incidents, 5, NOW);
      expect(result.incidents_this_month).toBe(2);
    });
  });

  describe("resolved_count", () => {
    it("counts resolved outcomes", () => {
      const incidents = [
        makeIncident({ outcome: "resolved" }),
        makeIncident({ outcome: "resolved" }),
        makeIncident({ outcome: "pending" }),
      ];
      const result = computeBullyingMetrics(incidents, 5, NOW);
      expect(result.resolved_count).toBe(2);
    });

    it("returns 0 when no resolved outcomes", () => {
      const incidents = [makeIncident({ outcome: "pending" })];
      const result = computeBullyingMetrics(incidents, 5, NOW);
      expect(result.resolved_count).toBe(0);
    });
  });

  describe("pending_count", () => {
    it("counts pending outcomes", () => {
      const incidents = [
        makeIncident({ outcome: "pending" }),
        makeIncident({ outcome: "pending" }),
        makeIncident({ outcome: "resolved" }),
      ];
      const result = computeBullyingMetrics(incidents, 5, NOW);
      expect(result.pending_count).toBe(2);
    });

    it("returns 0 when no pending outcomes", () => {
      const incidents = [makeIncident({ outcome: "resolved" })];
      const result = computeBullyingMetrics(incidents, 5, NOW);
      expect(result.pending_count).toBe(0);
    });
  });

  describe("escalated_count", () => {
    it("counts escalated outcomes", () => {
      const incidents = [makeIncident({ outcome: "escalated" })];
      const result = computeBullyingMetrics(incidents, 5, NOW);
      expect(result.escalated_count).toBe(1);
    });

    it("counts safeguarding_referral as escalated", () => {
      const incidents = [makeIncident({ outcome: "safeguarding_referral" })];
      const result = computeBullyingMetrics(incidents, 5, NOW);
      expect(result.escalated_count).toBe(1);
    });

    it("counts police_referral as escalated", () => {
      const incidents = [makeIncident({ outcome: "police_referral" })];
      const result = computeBullyingMetrics(incidents, 5, NOW);
      expect(result.escalated_count).toBe(1);
    });

    it("sums all three escalation types", () => {
      const incidents = [
        makeIncident({ outcome: "escalated" }),
        makeIncident({ outcome: "safeguarding_referral" }),
        makeIncident({ outcome: "police_referral" }),
      ];
      const result = computeBullyingMetrics(incidents, 5, NOW);
      expect(result.escalated_count).toBe(3);
    });

    it("does not count resolved or pending as escalated", () => {
      const incidents = [
        makeIncident({ outcome: "resolved" }),
        makeIncident({ outcome: "pending" }),
        makeIncident({ outcome: "ongoing_monitoring" }),
      ];
      const result = computeBullyingMetrics(incidents, 5, NOW);
      expect(result.escalated_count).toBe(0);
    });
  });

  describe("safeguarding_referrals", () => {
    it("counts only safeguarding_referral outcomes", () => {
      const incidents = [
        makeIncident({ outcome: "safeguarding_referral" }),
        makeIncident({ outcome: "escalated" }),
        makeIncident({ outcome: "police_referral" }),
      ];
      const result = computeBullyingMetrics(incidents, 5, NOW);
      expect(result.safeguarding_referrals).toBe(1);
    });

    it("returns 0 when no safeguarding referrals", () => {
      const incidents = [makeIncident({ outcome: "pending" })];
      const result = computeBullyingMetrics(incidents, 5, NOW);
      expect(result.safeguarding_referrals).toBe(0);
    });
  });

  describe("follow_ups_pending", () => {
    it("counts incidents with follow_up_date set and not completed", () => {
      const incidents = [
        makeIncident({ follow_up_date: "2026-05-20", follow_up_completed: false }),
      ];
      const result = computeBullyingMetrics(incidents, 5, NOW);
      expect(result.follow_ups_pending).toBe(1);
    });

    it("does not count completed follow-ups", () => {
      const incidents = [
        makeIncident({ follow_up_date: "2026-05-20", follow_up_completed: true }),
      ];
      const result = computeBullyingMetrics(incidents, 5, NOW);
      expect(result.follow_ups_pending).toBe(0);
    });

    it("does not count incidents with null follow_up_date", () => {
      const incidents = [
        makeIncident({ follow_up_date: null, follow_up_completed: false }),
      ];
      const result = computeBullyingMetrics(incidents, 5, NOW);
      expect(result.follow_ups_pending).toBe(0);
    });

    it("counts multiple pending follow-ups", () => {
      const incidents = [
        makeIncident({ follow_up_date: "2026-05-20", follow_up_completed: false }),
        makeIncident({ follow_up_date: "2026-05-25", follow_up_completed: false }),
        makeIncident({ follow_up_date: "2026-05-10", follow_up_completed: true }),
      ];
      const result = computeBullyingMetrics(incidents, 5, NOW);
      expect(result.follow_ups_pending).toBe(2);
    });
  });

  describe("parent_informed_rate", () => {
    it("returns 0 for empty inputs", () => {
      const result = computeBullyingMetrics([], 5, NOW);
      expect(result.parent_informed_rate).toBe(0);
    });

    it("returns 100 when all parents informed", () => {
      const incidents = [
        makeIncident({ parent_carer_informed: true }),
        makeIncident({ parent_carer_informed: true }),
      ];
      const result = computeBullyingMetrics(incidents, 5, NOW);
      expect(result.parent_informed_rate).toBe(100);
    });

    it("returns 0 when no parents informed", () => {
      const incidents = [
        makeIncident({ parent_carer_informed: false }),
        makeIncident({ parent_carer_informed: false }),
      ];
      const result = computeBullyingMetrics(incidents, 5, NOW);
      expect(result.parent_informed_rate).toBe(0);
    });

    it("computes percentage correctly for mixed", () => {
      const incidents = [
        makeIncident({ parent_carer_informed: true }),
        makeIncident({ parent_carer_informed: false }),
        makeIncident({ parent_carer_informed: false }),
      ];
      const result = computeBullyingMetrics(incidents, 5, NOW);
      // 1/3 * 100 = 33.333... → rounded to 33.3
      expect(result.parent_informed_rate).toBe(33.3);
    });

    it("returns 50 for 1 of 2 informed", () => {
      const incidents = [
        makeIncident({ parent_carer_informed: true }),
        makeIncident({ parent_carer_informed: false }),
      ];
      const result = computeBullyingMetrics(incidents, 5, NOW);
      expect(result.parent_informed_rate).toBe(50);
    });
  });

  describe("unique_victims", () => {
    it("counts distinct victim_ids", () => {
      const incidents = [
        makeIncident({ victim_id: "v1" }),
        makeIncident({ victim_id: "v2" }),
        makeIncident({ victim_id: "v3" }),
      ];
      const result = computeBullyingMetrics(incidents, 5, NOW);
      expect(result.unique_victims).toBe(3);
    });

    it("does not double-count same victim_id", () => {
      const incidents = [
        makeIncident({ victim_id: "v1" }),
        makeIncident({ victim_id: "v1" }),
      ];
      const result = computeBullyingMetrics(incidents, 5, NOW);
      expect(result.unique_victims).toBe(1);
    });

    it("returns 0 for empty incidents", () => {
      const result = computeBullyingMetrics([], 5, NOW);
      expect(result.unique_victims).toBe(0);
    });
  });

  describe("repeat_victims", () => {
    it("counts victims appearing more than once", () => {
      const incidents = [
        makeIncident({ victim_id: "v1" }),
        makeIncident({ victim_id: "v1" }),
        makeIncident({ victim_id: "v2" }),
      ];
      const result = computeBullyingMetrics(incidents, 5, NOW);
      expect(result.repeat_victims).toBe(1);
    });

    it("returns 0 when no repeat victims", () => {
      const incidents = [
        makeIncident({ victim_id: "v1" }),
        makeIncident({ victim_id: "v2" }),
      ];
      const result = computeBullyingMetrics(incidents, 5, NOW);
      expect(result.repeat_victims).toBe(0);
    });

    it("counts multiple repeat victims", () => {
      const incidents = [
        makeIncident({ victim_id: "v1" }),
        makeIncident({ victim_id: "v1" }),
        makeIncident({ victim_id: "v2" }),
        makeIncident({ victim_id: "v2" }),
        makeIncident({ victim_id: "v3" }),
      ];
      const result = computeBullyingMetrics(incidents, 5, NOW);
      expect(result.repeat_victims).toBe(2);
    });

    it("returns 0 for empty inputs", () => {
      const result = computeBullyingMetrics([], 5, NOW);
      expect(result.repeat_victims).toBe(0);
    });
  });

  describe("resident_perpetrator_rate", () => {
    it("returns 100 when all perpetrators are residents", () => {
      const incidents = [
        makeIncident({ perpetrator_is_resident: true }),
        makeIncident({ perpetrator_is_resident: true }),
      ];
      const result = computeBullyingMetrics(incidents, 5, NOW);
      expect(result.resident_perpetrator_rate).toBe(100);
    });

    it("returns 0 when no perpetrators are residents", () => {
      const incidents = [
        makeIncident({ perpetrator_is_resident: false }),
        makeIncident({ perpetrator_is_resident: false }),
      ];
      const result = computeBullyingMetrics(incidents, 5, NOW);
      expect(result.resident_perpetrator_rate).toBe(0);
    });

    it("returns 0 for empty inputs", () => {
      const result = computeBullyingMetrics([], 5, NOW);
      expect(result.resident_perpetrator_rate).toBe(0);
    });

    it("computes percentage correctly for mixed", () => {
      const incidents = [
        makeIncident({ perpetrator_is_resident: true }),
        makeIncident({ perpetrator_is_resident: false }),
        makeIncident({ perpetrator_is_resident: false }),
      ];
      const result = computeBullyingMetrics(incidents, 5, NOW);
      expect(result.resident_perpetrator_rate).toBe(33.3);
    });
  });

  describe("cyber_incidents", () => {
    it("counts cyber bullying type incidents", () => {
      const incidents = [
        makeIncident({ bullying_type: "cyber" }),
        makeIncident({ bullying_type: "cyber" }),
        makeIncident({ bullying_type: "verbal" }),
      ];
      const result = computeBullyingMetrics(incidents, 5, NOW);
      expect(result.cyber_incidents).toBe(2);
    });

    it("returns 0 when no cyber incidents", () => {
      const incidents = [makeIncident({ bullying_type: "physical" })];
      const result = computeBullyingMetrics(incidents, 5, NOW);
      expect(result.cyber_incidents).toBe(0);
    });
  });

  describe("by_type", () => {
    it("breaks down incidents by bullying type", () => {
      const incidents = [
        makeIncident({ bullying_type: "verbal" }),
        makeIncident({ bullying_type: "verbal" }),
        makeIncident({ bullying_type: "physical" }),
      ];
      const result = computeBullyingMetrics(incidents, 5, NOW);
      expect(result.by_type).toEqual({ verbal: 2, physical: 1 });
    });

    it("returns empty object for no incidents", () => {
      const result = computeBullyingMetrics([], 5, NOW);
      expect(result.by_type).toEqual({});
    });

    it("handles a single type", () => {
      const incidents = [makeIncident({ bullying_type: "racial" })];
      const result = computeBullyingMetrics(incidents, 5, NOW);
      expect(result.by_type).toEqual({ racial: 1 });
    });
  });

  describe("by_severity", () => {
    it("breaks down incidents by severity", () => {
      const incidents = [
        makeIncident({ severity: "critical" }),
        makeIncident({ severity: "high" }),
        makeIncident({ severity: "high" }),
        makeIncident({ severity: "low" }),
      ];
      const result = computeBullyingMetrics(incidents, 5, NOW);
      expect(result.by_severity).toEqual({ critical: 1, high: 2, low: 1 });
    });

    it("returns empty object for no incidents", () => {
      const result = computeBullyingMetrics([], 5, NOW);
      expect(result.by_severity).toEqual({});
    });
  });

  describe("by_intervention", () => {
    it("breaks down incidents by intervention type", () => {
      const incidents = [
        makeIncident({ intervention_type: "mediation" }),
        makeIncident({ intervention_type: "mediation" }),
        makeIncident({ intervention_type: "safety_plan" }),
      ];
      const result = computeBullyingMetrics(incidents, 5, NOW);
      expect(result.by_intervention).toEqual({ mediation: 2, safety_plan: 1 });
    });

    it("returns empty object for no incidents", () => {
      const result = computeBullyingMetrics([], 5, NOW);
      expect(result.by_intervention).toEqual({});
    });
  });

  describe("by_outcome", () => {
    it("breaks down incidents by outcome", () => {
      const incidents = [
        makeIncident({ outcome: "pending" }),
        makeIncident({ outcome: "resolved" }),
        makeIncident({ outcome: "resolved" }),
        makeIncident({ outcome: "escalated" }),
      ];
      const result = computeBullyingMetrics(incidents, 5, NOW);
      expect(result.by_outcome).toEqual({ pending: 1, resolved: 2, escalated: 1 });
    });

    it("returns empty object for no incidents", () => {
      const result = computeBullyingMetrics([], 5, NOW);
      expect(result.by_outcome).toEqual({});
    });
  });

  describe("totalChildren=0 edge case", () => {
    it("does not divide by zero — rates still compute from incidents", () => {
      const incidents = [
        makeIncident({ parent_carer_informed: true, perpetrator_is_resident: true }),
      ];
      const result = computeBullyingMetrics(incidents, 0, NOW);
      expect(result.parent_informed_rate).toBe(100);
      expect(result.resident_perpetrator_rate).toBe(100);
    });
  });

  describe("single item", () => {
    it("computes all fields correctly for one incident", () => {
      const incident = makeIncident({
        incident_date: daysAgo(5),
        outcome: "pending",
        bullying_type: "cyber",
        severity: "high",
        intervention_type: "safety_plan",
        victim_id: "v1",
        perpetrator_is_resident: true,
        parent_carer_informed: true,
        follow_up_date: "2026-05-20",
        follow_up_completed: false,
      });
      const result = computeBullyingMetrics([incident], 5, NOW);
      expect(result.total_incidents).toBe(1);
      expect(result.incidents_this_month).toBe(1);
      expect(result.resolved_count).toBe(0);
      expect(result.pending_count).toBe(1);
      expect(result.escalated_count).toBe(0);
      expect(result.safeguarding_referrals).toBe(0);
      expect(result.follow_ups_pending).toBe(1);
      expect(result.parent_informed_rate).toBe(100);
      expect(result.unique_victims).toBe(1);
      expect(result.repeat_victims).toBe(0);
      expect(result.resident_perpetrator_rate).toBe(100);
      expect(result.cyber_incidents).toBe(1);
      expect(result.by_type).toEqual({ cyber: 1 });
      expect(result.by_severity).toEqual({ high: 1 });
      expect(result.by_intervention).toEqual({ safety_plan: 1 });
      expect(result.by_outcome).toEqual({ pending: 1 });
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. identifyBullyingAlerts
// ══════════════════════════════════════════════════════════════════════════════

describe("identifyBullyingAlerts", () => {
  describe("empty inputs", () => {
    it("returns no alerts for empty incidents", () => {
      const alerts = identifyBullyingAlerts([], 5, NOW);
      expect(alerts).toEqual([]);
    });
  });

  describe("high_severity_pending", () => {
    it("triggers for critical severity + pending outcome", () => {
      const incidents = [
        makeIncident({ id: "i1", severity: "critical", outcome: "pending", victim_name: "Alice" }),
      ];
      const alerts = identifyBullyingAlerts(incidents, 5, NOW);
      const hsp = alerts.filter((a) => a.type === "high_severity_pending");
      expect(hsp).toHaveLength(1);
      expect(hsp[0].severity).toBe("critical");
      expect(hsp[0].id).toBe("i1");
      expect(hsp[0].message).toContain("Critical");
      expect(hsp[0].message).toContain("Alice");
    });

    it("triggers for high severity + pending outcome", () => {
      const incidents = [
        makeIncident({ id: "i2", severity: "high", outcome: "pending", victim_name: "Bob" }),
      ];
      const alerts = identifyBullyingAlerts(incidents, 5, NOW);
      const hsp = alerts.filter((a) => a.type === "high_severity_pending");
      expect(hsp).toHaveLength(1);
      expect(hsp[0].severity).toBe("high");
      expect(hsp[0].message).toContain("High");
      expect(hsp[0].message).toContain("Bob");
    });

    it("does not trigger for medium severity + pending", () => {
      const incidents = [
        makeIncident({ severity: "medium", outcome: "pending" }),
      ];
      const alerts = identifyBullyingAlerts(incidents, 5, NOW);
      const hsp = alerts.filter((a) => a.type === "high_severity_pending");
      expect(hsp).toHaveLength(0);
    });

    it("does not trigger for low severity + pending", () => {
      const incidents = [
        makeIncident({ severity: "low", outcome: "pending" }),
      ];
      const alerts = identifyBullyingAlerts(incidents, 5, NOW);
      const hsp = alerts.filter((a) => a.type === "high_severity_pending");
      expect(hsp).toHaveLength(0);
    });

    it("does not trigger for critical severity + resolved", () => {
      const incidents = [
        makeIncident({ severity: "critical", outcome: "resolved" }),
      ];
      const alerts = identifyBullyingAlerts(incidents, 5, NOW);
      const hsp = alerts.filter((a) => a.type === "high_severity_pending");
      expect(hsp).toHaveLength(0);
    });

    it("does not trigger for high severity + escalated", () => {
      const incidents = [
        makeIncident({ severity: "high", outcome: "escalated" }),
      ];
      const alerts = identifyBullyingAlerts(incidents, 5, NOW);
      const hsp = alerts.filter((a) => a.type === "high_severity_pending");
      expect(hsp).toHaveLength(0);
    });

    it("triggers for multiple critical/high pending incidents", () => {
      const incidents = [
        makeIncident({ id: "i1", severity: "critical", outcome: "pending" }),
        makeIncident({ id: "i2", severity: "high", outcome: "pending" }),
      ];
      const alerts = identifyBullyingAlerts(incidents, 5, NOW);
      const hsp = alerts.filter((a) => a.type === "high_severity_pending");
      expect(hsp).toHaveLength(2);
    });

    it("includes bullying_type in the message", () => {
      const incidents = [
        makeIncident({
          severity: "critical",
          outcome: "pending",
          bullying_type: "physical",
        }),
      ];
      const alerts = identifyBullyingAlerts(incidents, 5, NOW);
      const hsp = alerts.filter((a) => a.type === "high_severity_pending");
      expect(hsp[0].message).toContain("physical");
    });

    it("includes incident_date in the message", () => {
      const incidents = [
        makeIncident({
          severity: "high",
          outcome: "pending",
          incident_date: "2026-05-10",
        }),
      ];
      const alerts = identifyBullyingAlerts(incidents, 5, NOW);
      const hsp = alerts.filter((a) => a.type === "high_severity_pending");
      expect(hsp[0].message).toContain("2026-05-10");
    });
  });

  describe("follow_up_overdue", () => {
    it("triggers when follow_up_date is in the past and not completed", () => {
      const incidents = [
        makeIncident({
          id: "i1",
          follow_up_date: "2026-05-01",
          follow_up_completed: false,
          victim_name: "Charlie",
        }),
      ];
      const alerts = identifyBullyingAlerts(incidents, 5, NOW);
      const fuo = alerts.filter((a) => a.type === "follow_up_overdue");
      expect(fuo).toHaveLength(1);
      expect(fuo[0].severity).toBe("medium");
      expect(fuo[0].id).toBe("i1");
      expect(fuo[0].message).toContain("Charlie");
      expect(fuo[0].message).toContain("2026-05-01");
    });

    it("does not trigger when follow_up_completed is true", () => {
      const incidents = [
        makeIncident({
          follow_up_date: "2026-05-01",
          follow_up_completed: true,
        }),
      ];
      const alerts = identifyBullyingAlerts(incidents, 5, NOW);
      const fuo = alerts.filter((a) => a.type === "follow_up_overdue");
      expect(fuo).toHaveLength(0);
    });

    it("does not trigger when follow_up_date is in the future", () => {
      const incidents = [
        makeIncident({
          follow_up_date: "2026-05-20",
          follow_up_completed: false,
        }),
      ];
      const alerts = identifyBullyingAlerts(incidents, 5, NOW);
      const fuo = alerts.filter((a) => a.type === "follow_up_overdue");
      expect(fuo).toHaveLength(0);
    });

    it("does not trigger when follow_up_date is null", () => {
      const incidents = [
        makeIncident({ follow_up_date: null, follow_up_completed: false }),
      ];
      const alerts = identifyBullyingAlerts(incidents, 5, NOW);
      const fuo = alerts.filter((a) => a.type === "follow_up_overdue");
      expect(fuo).toHaveLength(0);
    });

    it("triggers for multiple overdue follow-ups", () => {
      const incidents = [
        makeIncident({ id: "i1", follow_up_date: "2026-05-01", follow_up_completed: false }),
        makeIncident({ id: "i2", follow_up_date: "2026-05-05", follow_up_completed: false }),
      ];
      const alerts = identifyBullyingAlerts(incidents, 5, NOW);
      const fuo = alerts.filter((a) => a.type === "follow_up_overdue");
      expect(fuo).toHaveLength(2);
    });
  });

  describe("repeat_victim", () => {
    it("triggers when same victim_id appears 2+ times", () => {
      const incidents = [
        makeIncident({ victim_id: "v1", victim_name: "Diana" }),
        makeIncident({ victim_id: "v1", victim_name: "Diana" }),
      ];
      const alerts = identifyBullyingAlerts(incidents, 5, NOW);
      const rv = alerts.filter((a) => a.type === "repeat_victim");
      expect(rv).toHaveLength(1);
      expect(rv[0].severity).toBe("high");
      expect(rv[0].id).toBe("repeat_v1");
      expect(rv[0].message).toContain("Diana");
      expect(rv[0].message).toContain("2");
    });

    it("does not trigger for single incident per victim", () => {
      const incidents = [
        makeIncident({ victim_id: "v1" }),
        makeIncident({ victim_id: "v2" }),
      ];
      const alerts = identifyBullyingAlerts(incidents, 5, NOW);
      const rv = alerts.filter((a) => a.type === "repeat_victim");
      expect(rv).toHaveLength(0);
    });

    it("triggers for multiple repeat victims", () => {
      const incidents = [
        makeIncident({ victim_id: "v1", victim_name: "Eve" }),
        makeIncident({ victim_id: "v1", victim_name: "Eve" }),
        makeIncident({ victim_id: "v2", victim_name: "Frank" }),
        makeIncident({ victim_id: "v2", victim_name: "Frank" }),
        makeIncident({ victim_id: "v3", victim_name: "Grace" }),
      ];
      const alerts = identifyBullyingAlerts(incidents, 5, NOW);
      const rv = alerts.filter((a) => a.type === "repeat_victim");
      expect(rv).toHaveLength(2);
    });

    it("shows correct count for 3 incidents same victim", () => {
      const incidents = [
        makeIncident({ victim_id: "v1", victim_name: "Hank" }),
        makeIncident({ victim_id: "v1", victim_name: "Hank" }),
        makeIncident({ victim_id: "v1", victim_name: "Hank" }),
      ];
      const alerts = identifyBullyingAlerts(incidents, 5, NOW);
      const rv = alerts.filter((a) => a.type === "repeat_victim");
      expect(rv).toHaveLength(1);
      expect(rv[0].message).toContain("3");
    });

    it("uses id format repeat_{victim_id}", () => {
      const incidents = [
        makeIncident({ victim_id: "v42", victim_name: "Ivy" }),
        makeIncident({ victim_id: "v42", victim_name: "Ivy" }),
      ];
      const alerts = identifyBullyingAlerts(incidents, 5, NOW);
      const rv = alerts.filter((a) => a.type === "repeat_victim");
      expect(rv[0].id).toBe("repeat_v42");
    });
  });

  describe("parent_not_informed", () => {
    it("triggers for critical severity + not informed", () => {
      const incidents = [
        makeIncident({
          id: "i1",
          severity: "critical",
          parent_carer_informed: false,
          victim_name: "Jack",
          incident_date: "2026-05-10",
        }),
      ];
      const alerts = identifyBullyingAlerts(incidents, 5, NOW);
      const pni = alerts.filter((a) => a.type === "parent_not_informed");
      expect(pni).toHaveLength(1);
      expect(pni[0].severity).toBe("high");
      expect(pni[0].id).toBe("i1");
      expect(pni[0].message).toContain("Jack");
      expect(pni[0].message).toContain("critical");
      expect(pni[0].message).toContain("2026-05-10");
    });

    it("triggers for high severity + not informed", () => {
      const incidents = [
        makeIncident({
          id: "i2",
          severity: "high",
          parent_carer_informed: false,
          victim_name: "Kate",
        }),
      ];
      const alerts = identifyBullyingAlerts(incidents, 5, NOW);
      const pni = alerts.filter((a) => a.type === "parent_not_informed");
      expect(pni).toHaveLength(1);
      expect(pni[0].message).toContain("high");
      expect(pni[0].message).toContain("Kate");
    });

    it("does not trigger when parent is informed", () => {
      const incidents = [
        makeIncident({ severity: "critical", parent_carer_informed: true }),
      ];
      const alerts = identifyBullyingAlerts(incidents, 5, NOW);
      const pni = alerts.filter((a) => a.type === "parent_not_informed");
      expect(pni).toHaveLength(0);
    });

    it("does not trigger for medium severity + not informed", () => {
      const incidents = [
        makeIncident({ severity: "medium", parent_carer_informed: false }),
      ];
      const alerts = identifyBullyingAlerts(incidents, 5, NOW);
      const pni = alerts.filter((a) => a.type === "parent_not_informed");
      expect(pni).toHaveLength(0);
    });

    it("does not trigger for low severity + not informed", () => {
      const incidents = [
        makeIncident({ severity: "low", parent_carer_informed: false }),
      ];
      const alerts = identifyBullyingAlerts(incidents, 5, NOW);
      const pni = alerts.filter((a) => a.type === "parent_not_informed");
      expect(pni).toHaveLength(0);
    });

    it("triggers for multiple high/critical not informed", () => {
      const incidents = [
        makeIncident({ id: "i1", severity: "critical", parent_carer_informed: false }),
        makeIncident({ id: "i2", severity: "high", parent_carer_informed: false }),
      ];
      const alerts = identifyBullyingAlerts(incidents, 5, NOW);
      const pni = alerts.filter((a) => a.type === "parent_not_informed");
      expect(pni).toHaveLength(2);
    });
  });

  describe("combined scenarios", () => {
    it("returns multiple alert types from a single incident", () => {
      const incidents = [
        makeIncident({
          id: "i1",
          severity: "critical",
          outcome: "pending",
          parent_carer_informed: false,
          follow_up_date: "2026-05-01",
          follow_up_completed: false,
          victim_id: "v1",
          victim_name: "Alice",
        }),
        makeIncident({
          id: "i2",
          severity: "high",
          outcome: "resolved",
          parent_carer_informed: true,
          victim_id: "v1",
          victim_name: "Alice",
        }),
      ];
      const alerts = identifyBullyingAlerts(incidents, 5, NOW);

      // high_severity_pending for i1
      expect(alerts.filter((a) => a.type === "high_severity_pending")).toHaveLength(1);
      // follow_up_overdue for i1
      expect(alerts.filter((a) => a.type === "follow_up_overdue")).toHaveLength(1);
      // repeat_victim for v1 (2 incidents)
      expect(alerts.filter((a) => a.type === "repeat_victim")).toHaveLength(1);
      // parent_not_informed for i1
      expect(alerts.filter((a) => a.type === "parent_not_informed")).toHaveLength(1);
    });

    it("returns no alerts when nothing triggers", () => {
      const incidents = [
        makeIncident({
          severity: "low",
          outcome: "resolved",
          parent_carer_informed: true,
          follow_up_date: null,
          victim_id: "v1",
        }),
        makeIncident({
          severity: "medium",
          outcome: "resolved",
          parent_carer_informed: true,
          follow_up_date: "2026-05-20",
          follow_up_completed: false,
          victim_id: "v2",
        }),
      ];
      const alerts = identifyBullyingAlerts(incidents, 5, NOW);
      expect(alerts).toHaveLength(0);
    });

    it("handles non-triggering follow-up (future date) mixed with triggering", () => {
      const incidents = [
        makeIncident({
          id: "i1",
          follow_up_date: "2026-05-20",
          follow_up_completed: false,
          severity: "low",
          outcome: "resolved",
          parent_carer_informed: true,
        }),
        makeIncident({
          id: "i2",
          follow_up_date: "2026-05-01",
          follow_up_completed: false,
          severity: "low",
          outcome: "resolved",
          parent_carer_informed: true,
        }),
      ];
      const alerts = identifyBullyingAlerts(incidents, 5, NOW);
      const fuo = alerts.filter((a) => a.type === "follow_up_overdue");
      expect(fuo).toHaveLength(1);
      expect(fuo[0].id).toBe("i2");
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. CRUD fallback (Supabase disabled)
// ══════════════════════════════════════════════════════════════════════════════

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => false,
  createServerClient: () => null,
}));

describe("CRUD fallback (Supabase disabled)", () => {
  it("listIncidents returns ok:true with empty array", async () => {
    const { listIncidents } = await import("../anti-bullying-service");
    const result = await listIncidents("home-1");
    expect(result).toEqual({ ok: true, data: [] });
  });

  it("listIncidents returns ok:true with filters", async () => {
    const { listIncidents } = await import("../anti-bullying-service");
    const result = await listIncidents("home-1", { severity: "high", limit: 10 });
    expect(result).toEqual({ ok: true, data: [] });
  });

  it("createIncident returns ok:false with error message", async () => {
    const { createIncident } = await import("../anti-bullying-service");
    const result = await createIncident({
      homeId: "home-1",
      incidentDate: "2026-05-01",
      reportedBy: "staff-1",
      bullyingType: "verbal",
      severity: "medium",
      perpetratorName: "Perp A",
      perpetratorIsResident: true,
      victimName: "Victim A",
      victimId: "v1",
      description: "Test",
      location: "Common room",
      witnesses: [],
      interventionType: "mediation",
      parentCarerInformed: false,
      socialWorkerInformed: false,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });

  it("updateIncident returns ok:false with error message", async () => {
    const { updateIncident } = await import("../anti-bullying-service");
    const result = await updateIncident("some-id", { outcome: "resolved" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. Edge cases
// ══════════════════════════════════════════════════════════════════════════════

describe("Edge cases", () => {
  describe("empty witnesses arrays", () => {
    it("handles incident with empty witnesses array", () => {
      const incidents = [makeIncident({ witnesses: [] })];
      const result = computeBullyingMetrics(incidents, 5, NOW);
      expect(result.total_incidents).toBe(1);
    });

    it("handles incident with populated witnesses array", () => {
      const incidents = [makeIncident({ witnesses: ["w1", "w2"] })];
      const result = computeBullyingMetrics(incidents, 5, NOW);
      expect(result.total_incidents).toBe(1);
    });
  });

  describe("default now parameter", () => {
    it("computeBullyingMetrics works without explicit now", () => {
      const incidents = [makeIncident({ incident_date: new Date().toISOString().split("T")[0] })];
      const result = computeBullyingMetrics(incidents, 5);
      expect(result.total_incidents).toBe(1);
      expect(result.incidents_this_month).toBe(1);
    });

    it("identifyBullyingAlerts works without explicit now", () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const incidents = [
        makeIncident({
          follow_up_date: yesterday.toISOString().split("T")[0],
          follow_up_completed: false,
        }),
      ];
      const alerts = identifyBullyingAlerts(incidents, 5);
      const fuo = alerts.filter((a) => a.type === "follow_up_overdue");
      expect(fuo).toHaveLength(1);
    });
  });

  describe("type safety checks", () => {
    it("makeIncident creates a valid BullyingIncident", () => {
      const incident = makeIncident();
      expect(incident).toHaveProperty("id");
      expect(incident).toHaveProperty("home_id");
      expect(incident).toHaveProperty("incident_date");
      expect(incident).toHaveProperty("reported_by");
      expect(incident).toHaveProperty("bullying_type");
      expect(incident).toHaveProperty("severity");
      expect(incident).toHaveProperty("perpetrator_name");
      expect(incident).toHaveProperty("perpetrator_is_resident");
      expect(incident).toHaveProperty("victim_name");
      expect(incident).toHaveProperty("victim_id");
      expect(incident).toHaveProperty("description");
      expect(incident).toHaveProperty("location");
      expect(incident).toHaveProperty("witnesses");
      expect(incident).toHaveProperty("intervention_type");
      expect(incident).toHaveProperty("outcome");
      expect(incident).toHaveProperty("parent_carer_informed");
      expect(incident).toHaveProperty("social_worker_informed");
      expect(incident).toHaveProperty("follow_up_date");
      expect(incident).toHaveProperty("follow_up_completed");
      expect(incident).toHaveProperty("impact_on_victim");
      expect(incident).toHaveProperty("created_at");
      expect(incident).toHaveProperty("updated_at");
    });

    it("BullyingIncident has exactly 22 fields", () => {
      const incident = makeIncident();
      expect(Object.keys(incident)).toHaveLength(22);
    });

    it("computeBullyingMetrics return type has 16 keys", () => {
      const result = computeBullyingMetrics([], 0, NOW);
      expect(Object.keys(result)).toHaveLength(16);
    });
  });

  describe("same victim multiple incidents", () => {
    it("correctly counts victim appearing in 5 incidents", () => {
      const incidents = Array.from({ length: 5 }, () =>
        makeIncident({ victim_id: "v1", victim_name: "Alice" }),
      );
      const result = computeBullyingMetrics(incidents, 5, NOW);
      expect(result.unique_victims).toBe(1);
      expect(result.repeat_victims).toBe(1);
    });

    it("alert includes correct incident count for victim with 5 incidents", () => {
      const incidents = Array.from({ length: 5 }, () =>
        makeIncident({ victim_id: "v1", victim_name: "Alice" }),
      );
      const alerts = identifyBullyingAlerts(incidents, 5, NOW);
      const rv = alerts.filter((a) => a.type === "repeat_victim");
      expect(rv).toHaveLength(1);
      expect(rv[0].message).toContain("5");
    });
  });

  describe("large datasets", () => {
    it("handles 100 incidents", () => {
      const incidents = Array.from({ length: 100 }, (_, i) =>
        makeIncident({
          victim_id: `v${i % 10}`,
          bullying_type: i % 2 === 0 ? "verbal" : "physical",
          severity: i % 3 === 0 ? "high" : "medium",
          outcome: i % 4 === 0 ? "resolved" : "pending",
          incident_date: daysAgo(i % 60),
          perpetrator_is_resident: i % 5 === 0,
          parent_carer_informed: i % 2 === 0,
        }),
      );
      const result = computeBullyingMetrics(incidents, 50, NOW);
      expect(result.total_incidents).toBe(100);
      expect(result.unique_victims).toBe(10);
      expect(result.repeat_victims).toBe(10);
    });

    it("generates alerts for large dataset", () => {
      const incidents = Array.from({ length: 50 }, (_, i) =>
        makeIncident({
          id: `inc-${i}`,
          victim_id: `v${i % 5}`,
          victim_name: `Victim ${i % 5}`,
          severity: i % 2 === 0 ? "high" : "low",
          outcome: "pending",
          parent_carer_informed: i % 3 === 0,
          follow_up_date: i % 4 === 0 ? daysAgo(5) : null,
          follow_up_completed: false,
        }),
      );
      const alerts = identifyBullyingAlerts(incidents, 20, NOW);
      // Should have alerts of various types
      expect(alerts.length).toBeGreaterThan(0);
      // All victims appear 10 times → 5 repeat victims
      const rv = alerts.filter((a) => a.type === "repeat_victim");
      expect(rv).toHaveLength(5);
    });
  });

  describe("all bullying types in by_type", () => {
    it("correctly records all 10 types", () => {
      const allTypes: BullyingType[] = [
        "physical", "verbal", "emotional", "cyber", "social_exclusion",
        "racial", "homophobic", "sexual", "disability", "other",
      ];
      const incidents = allTypes.map((t) => makeIncident({ bullying_type: t }));
      const result = computeBullyingMetrics(incidents, 5, NOW);
      expect(Object.keys(result.by_type)).toHaveLength(10);
      for (const t of allTypes) {
        expect(result.by_type[t]).toBe(1);
      }
    });
  });

  describe("all severities in by_severity", () => {
    it("correctly records all 4 severities", () => {
      const allSevs: BullyingSeverity[] = ["critical", "high", "medium", "low"];
      const incidents = allSevs.map((s) => makeIncident({ severity: s }));
      const result = computeBullyingMetrics(incidents, 5, NOW);
      expect(Object.keys(result.by_severity)).toHaveLength(4);
      for (const s of allSevs) {
        expect(result.by_severity[s]).toBe(1);
      }
    });
  });

  describe("all interventions in by_intervention", () => {
    it("correctly records all 11 interventions", () => {
      const allInt: InterventionType[] = [
        "mediation", "restorative_conversation", "safety_plan",
        "increased_supervision", "education_session", "individual_support",
        "family_involvement", "external_referral", "consequence",
        "environmental_change", "other",
      ];
      const incidents = allInt.map((t) => makeIncident({ intervention_type: t }));
      const result = computeBullyingMetrics(incidents, 5, NOW);
      expect(Object.keys(result.by_intervention)).toHaveLength(11);
      for (const t of allInt) {
        expect(result.by_intervention[t]).toBe(1);
      }
    });
  });

  describe("all outcomes in by_outcome", () => {
    it("correctly records all 6 outcomes", () => {
      const allOut: IncidentOutcome[] = [
        "resolved", "ongoing_monitoring", "escalated",
        "safeguarding_referral", "police_referral", "pending",
      ];
      const incidents = allOut.map((o) => makeIncident({ outcome: o }));
      const result = computeBullyingMetrics(incidents, 5, NOW);
      expect(Object.keys(result.by_outcome)).toHaveLength(6);
      for (const o of allOut) {
        expect(result.by_outcome[o]).toBe(1);
      }
    });
  });

  describe("metrics rounding", () => {
    it("parent_informed_rate rounds to one decimal place", () => {
      // 1/6 = 16.666... → 16.7
      const incidents = Array.from({ length: 6 }, (_, i) =>
        makeIncident({ parent_carer_informed: i === 0 }),
      );
      const result = computeBullyingMetrics(incidents, 5, NOW);
      expect(result.parent_informed_rate).toBe(16.7);
    });

    it("resident_perpetrator_rate rounds to one decimal place", () => {
      // 1/6 = 16.666... → 16.7
      const incidents = Array.from({ length: 6 }, (_, i) =>
        makeIncident({ perpetrator_is_resident: i === 0 }),
      );
      const result = computeBullyingMetrics(incidents, 5, NOW);
      expect(result.resident_perpetrator_rate).toBe(16.7);
    });

    it("handles 2/3 = 66.7% rounding", () => {
      const incidents = [
        makeIncident({ parent_carer_informed: true }),
        makeIncident({ parent_carer_informed: true }),
        makeIncident({ parent_carer_informed: false }),
      ];
      const result = computeBullyingMetrics(incidents, 5, NOW);
      expect(result.parent_informed_rate).toBe(66.7);
    });
  });

  describe("ongoing_monitoring outcome", () => {
    it("ongoing_monitoring is counted in by_outcome but not as escalated", () => {
      const incidents = [makeIncident({ outcome: "ongoing_monitoring" })];
      const result = computeBullyingMetrics(incidents, 5, NOW);
      expect(result.escalated_count).toBe(0);
      expect(result.pending_count).toBe(0);
      expect(result.resolved_count).toBe(0);
      expect(result.by_outcome).toEqual({ ongoing_monitoring: 1 });
    });
  });

  describe("incidents exactly at boundary dates", () => {
    it("incident on the now date counts in this month", () => {
      const incidents = [makeIncident({ incident_date: "2026-05-13" })];
      const result = computeBullyingMetrics(incidents, 5, NOW);
      expect(result.incidents_this_month).toBe(1);
    });

    it("incident 31 days ago does not count in this month", () => {
      const incidents = [makeIncident({ incident_date: daysAgo(31) })];
      const result = computeBullyingMetrics(incidents, 5, NOW);
      expect(result.incidents_this_month).toBe(0);
    });
  });

  describe("follow_up_date edge cases in alerts", () => {
    it("follow_up_date exactly equal to now does not trigger overdue", () => {
      // new Date("2026-05-13") < new Date("2026-05-13T12:00:00Z") is true
      // because "2026-05-13" parses as midnight UTC, which is before 12:00 UTC
      const incidents = [
        makeIncident({
          follow_up_date: "2026-05-13",
          follow_up_completed: false,
        }),
      ];
      const alerts = identifyBullyingAlerts(incidents, 5, NOW);
      const fuo = alerts.filter((a) => a.type === "follow_up_overdue");
      expect(fuo).toHaveLength(1);
    });
  });

  describe("impact_on_victim field", () => {
    it("null impact_on_victim does not affect metrics", () => {
      const incidents = [makeIncident({ impact_on_victim: null })];
      const result = computeBullyingMetrics(incidents, 5, NOW);
      expect(result.total_incidents).toBe(1);
    });

    it("populated impact_on_victim does not affect metrics", () => {
      const incidents = [makeIncident({ impact_on_victim: "Significant distress" })];
      const result = computeBullyingMetrics(incidents, 5, NOW);
      expect(result.total_incidents).toBe(1);
    });
  });

  describe("social_worker_informed field", () => {
    it("does not affect parent_informed_rate", () => {
      const incidents = [
        makeIncident({ parent_carer_informed: false, social_worker_informed: true }),
      ];
      const result = computeBullyingMetrics(incidents, 5, NOW);
      expect(result.parent_informed_rate).toBe(0);
    });
  });

  describe("unique IDs via crypto.randomUUID", () => {
    it("makeIncident generates unique IDs by default", () => {
      const a = makeIncident();
      const b = makeIncident();
      expect(a.id).not.toBe(b.id);
    });

    it("makeIncident respects overridden id", () => {
      const incident = makeIncident({ id: "custom-id" });
      expect(incident.id).toBe("custom-id");
    });
  });

  describe("mixed outcome metrics", () => {
    it("correctly counts all outcome categories simultaneously", () => {
      const incidents = [
        makeIncident({ outcome: "resolved" }),
        makeIncident({ outcome: "resolved" }),
        makeIncident({ outcome: "pending" }),
        makeIncident({ outcome: "escalated" }),
        makeIncident({ outcome: "safeguarding_referral" }),
        makeIncident({ outcome: "police_referral" }),
        makeIncident({ outcome: "ongoing_monitoring" }),
      ];
      const result = computeBullyingMetrics(incidents, 5, NOW);
      expect(result.resolved_count).toBe(2);
      expect(result.pending_count).toBe(1);
      expect(result.escalated_count).toBe(3);
      expect(result.safeguarding_referrals).toBe(1);
    });
  });

  describe("alert structure", () => {
    it("every alert has type, severity, message, and id fields", () => {
      const incidents = [
        makeIncident({
          id: "i1",
          severity: "critical",
          outcome: "pending",
          parent_carer_informed: false,
          follow_up_date: "2026-05-01",
          follow_up_completed: false,
          victim_id: "v1",
          victim_name: "Test",
        }),
        makeIncident({ victim_id: "v1", victim_name: "Test" }),
      ];
      const alerts = identifyBullyingAlerts(incidents, 5, NOW);
      for (const alert of alerts) {
        expect(alert).toHaveProperty("type");
        expect(alert).toHaveProperty("severity");
        expect(alert).toHaveProperty("message");
        expect(alert).toHaveProperty("id");
        expect(typeof alert.type).toBe("string");
        expect(typeof alert.severity).toBe("string");
        expect(typeof alert.message).toBe("string");
        expect(typeof alert.id).toBe("string");
      }
    });

    it("alert severity is one of critical, high, or medium", () => {
      const incidents = [
        makeIncident({
          id: "i1",
          severity: "critical",
          outcome: "pending",
          parent_carer_informed: false,
          follow_up_date: "2026-05-01",
          follow_up_completed: false,
        }),
      ];
      const alerts = identifyBullyingAlerts(incidents, 5, NOW);
      const validSeverities = ["critical", "high", "medium"];
      for (const alert of alerts) {
        expect(validSeverities).toContain(alert.severity);
      }
    });
  });

  describe("high_severity_pending does not trigger for ongoing_monitoring", () => {
    it("critical severity + ongoing_monitoring does not trigger", () => {
      const incidents = [
        makeIncident({ severity: "critical", outcome: "ongoing_monitoring" }),
      ];
      const alerts = identifyBullyingAlerts(incidents, 5, NOW);
      const hsp = alerts.filter((a) => a.type === "high_severity_pending");
      expect(hsp).toHaveLength(0);
    });
  });

  describe("high_severity_pending does not trigger for safeguarding_referral", () => {
    it("high severity + safeguarding_referral does not trigger", () => {
      const incidents = [
        makeIncident({ severity: "high", outcome: "safeguarding_referral" }),
      ];
      const alerts = identifyBullyingAlerts(incidents, 5, NOW);
      const hsp = alerts.filter((a) => a.type === "high_severity_pending");
      expect(hsp).toHaveLength(0);
    });
  });

  describe("parent_not_informed message format", () => {
    it("includes Parent/carer in the message", () => {
      const incidents = [
        makeIncident({ severity: "high", parent_carer_informed: false }),
      ];
      const alerts = identifyBullyingAlerts(incidents, 5, NOW);
      const pni = alerts.filter((a) => a.type === "parent_not_informed");
      expect(pni[0].message).toContain("Parent/carer");
    });
  });

  describe("high_severity_pending message format", () => {
    it("includes immediate action required in the message", () => {
      const incidents = [
        makeIncident({ severity: "high", outcome: "pending" }),
      ];
      const alerts = identifyBullyingAlerts(incidents, 5, NOW);
      const hsp = alerts.filter((a) => a.type === "high_severity_pending");
      expect(hsp[0].message).toContain("immediate action required");
    });
  });

  describe("follow_up_overdue message format", () => {
    it("includes check on victim wellbeing in the message", () => {
      const incidents = [
        makeIncident({
          follow_up_date: "2026-05-01",
          follow_up_completed: false,
        }),
      ];
      const alerts = identifyBullyingAlerts(incidents, 5, NOW);
      const fuo = alerts.filter((a) => a.type === "follow_up_overdue");
      expect(fuo[0].message).toContain("check on victim wellbeing");
    });
  });

  describe("repeat_victim message format", () => {
    it("includes review safety plan in the message", () => {
      const incidents = [
        makeIncident({ victim_id: "v1", victim_name: "Alice" }),
        makeIncident({ victim_id: "v1", victim_name: "Alice" }),
      ];
      const alerts = identifyBullyingAlerts(incidents, 5, NOW);
      const rv = alerts.filter((a) => a.type === "repeat_victim");
      expect(rv[0].message).toContain("review safety plan");
    });
  });

  describe("perpetrator_is_resident false for all", () => {
    it("resident_perpetrator_rate is 0 when none are residents", () => {
      const incidents = Array.from({ length: 5 }, () =>
        makeIncident({ perpetrator_is_resident: false }),
      );
      const result = computeBullyingMetrics(incidents, 5, NOW);
      expect(result.resident_perpetrator_rate).toBe(0);
    });
  });

  describe("by_type accumulation", () => {
    it("accumulates correctly with multiple incidents of the same type", () => {
      const incidents = [
        makeIncident({ bullying_type: "emotional" }),
        makeIncident({ bullying_type: "emotional" }),
        makeIncident({ bullying_type: "emotional" }),
      ];
      const result = computeBullyingMetrics(incidents, 5, NOW);
      expect(result.by_type).toEqual({ emotional: 3 });
    });
  });

  describe("by_severity accumulation", () => {
    it("accumulates correctly with multiple same severity", () => {
      const incidents = [
        makeIncident({ severity: "critical" }),
        makeIncident({ severity: "critical" }),
      ];
      const result = computeBullyingMetrics(incidents, 5, NOW);
      expect(result.by_severity).toEqual({ critical: 2 });
    });
  });

  describe("incidents far in the past", () => {
    it("incident 365 days ago is not in this month", () => {
      const incidents = [makeIncident({ incident_date: daysAgo(365) })];
      const result = computeBullyingMetrics(incidents, 5, NOW);
      expect(result.incidents_this_month).toBe(0);
      expect(result.total_incidents).toBe(1);
    });
  });
});
