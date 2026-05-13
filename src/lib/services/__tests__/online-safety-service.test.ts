// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ONLINE SAFETY SERVICE TESTS
// Pure-function unit tests for online safety metrics computation,
// alert identification, constant validation, and CRUD fallback behaviour
// (Supabase disabled). CHR 2015 Reg 12 (safeguarding — online risks),
// Reg 5 (quality of care — digital wellbeing), KCSIE, SCCIF Safety.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => false,
  createServerClient: () => null,
}));

import {
  _testing,
  ONLINE_RISK_CATEGORIES,
  INCIDENT_SEVERITIES,
  DEVICE_AGREEMENT_STATUSES,
  SAFETY_CHECK_RESULTS,
  listIncidents,
  createIncident,
  updateIncident,
  listAgreements,
  createAgreement,
  updateAgreement,
} from "../online-safety-service";

import type {
  OnlineSafetyIncident,
  DeviceAgreement,
  OnlineRiskCategory,
  IncidentSeverity,
  DeviceAgreementStatus,
  SafetyCheckResult,
} from "../online-safety-service";

const { computeOnlineSafetyMetrics, identifyOnlineSafetyAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

const NOW = new Date("2026-05-13");

function makeIncident(
  overrides: Partial<OnlineSafetyIncident> = {},
): OnlineSafetyIncident {
  return {
    id: crypto.randomUUID(),
    home_id: "home-1",
    child_name: "Alex",
    child_id: "child-1",
    incident_date: "2026-05-10",
    risk_category: "cyberbullying",
    severity: "medium",
    description: "Incident description",
    platform_involved: null,
    device_type: null,
    action_taken: "Spoke with child",
    parent_carer_informed: true,
    social_worker_informed: false,
    police_involved: false,
    safeguarding_referral: false,
    outcome: null,
    staff_recording: "staff-1",
    created_at: "2026-05-10T00:00:00.000Z",
    updated_at: "2026-05-10T00:00:00.000Z",
    ...overrides,
  };
}

function makeAgreement(
  overrides: Partial<DeviceAgreement> = {},
): DeviceAgreement {
  return {
    id: crypto.randomUUID(),
    home_id: "home-1",
    child_name: "Alex",
    child_id: "child-1",
    device_types: ["tablet", "phone"],
    agreement_date: "2026-04-01",
    review_date: "2026-06-01",
    status: "active",
    filtering_enabled: true,
    monitoring_enabled: true,
    agreed_usage_hours: 3,
    restrictions: ["no_social_media"],
    last_safety_check: null,
    last_check_result: "compliant",
    created_at: "2026-04-01T00:00:00.000Z",
    updated_at: "2026-04-01T00:00:00.000Z",
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

describe("Constants", () => {
  // ── ONLINE_RISK_CATEGORIES ───────────────────────────────────────────
  describe("ONLINE_RISK_CATEGORIES", () => {
    it("contains exactly 13 items", () => {
      expect(ONLINE_RISK_CATEGORIES).toHaveLength(13);
    });

    it("has unique category values", () => {
      const cats = ONLINE_RISK_CATEGORIES.map((c) => c.category);
      expect(new Set(cats).size).toBe(cats.length);
    });

    it("has non-empty labels for every entry", () => {
      for (const c of ONLINE_RISK_CATEGORIES) {
        expect(c.label.trim().length).toBeGreaterThan(0);
      }
    });

    it.each([
      ["cyberbullying", "Cyberbullying"],
      ["inappropriate_content", "Inappropriate Content"],
      ["grooming", "Grooming"],
      ["sexting", "Sexting"],
      ["radicalisation", "Radicalisation"],
      ["excessive_screen_time", "Excessive Screen Time"],
      ["online_gambling", "Online Gambling"],
      ["identity_theft", "Identity Theft"],
      ["social_media_misuse", "Social Media Misuse"],
      ["data_sharing", "Data Sharing"],
      ["online_exploitation", "Online Exploitation"],
      ["self_harm_content", "Self-Harm Content"],
      ["other", "Other"],
    ])("maps %s to %s", (category, label) => {
      const found = ONLINE_RISK_CATEGORIES.find((c) => c.category === category);
      expect(found).toBeDefined();
      expect(found!.label).toBe(label);
    });
  });

  // ── INCIDENT_SEVERITIES ─────────────────────────────────────────────
  describe("INCIDENT_SEVERITIES", () => {
    it("contains exactly 4 items", () => {
      expect(INCIDENT_SEVERITIES).toHaveLength(4);
    });

    it("has unique severity values", () => {
      const sevs = INCIDENT_SEVERITIES.map((s) => s.severity);
      expect(new Set(sevs).size).toBe(sevs.length);
    });

    it("has non-empty labels for every entry", () => {
      for (const s of INCIDENT_SEVERITIES) {
        expect(s.label.trim().length).toBeGreaterThan(0);
      }
    });

    it.each([
      ["critical", "Critical"],
      ["high", "High"],
      ["medium", "Medium"],
      ["low", "Low"],
    ])("maps %s to %s", (severity, label) => {
      const found = INCIDENT_SEVERITIES.find((s) => s.severity === severity);
      expect(found).toBeDefined();
      expect(found!.label).toBe(label);
    });
  });

  // ── DEVICE_AGREEMENT_STATUSES ───────────────────────────────────────
  describe("DEVICE_AGREEMENT_STATUSES", () => {
    it("contains exactly 5 items", () => {
      expect(DEVICE_AGREEMENT_STATUSES).toHaveLength(5);
    });

    it("has unique status values", () => {
      const stats = DEVICE_AGREEMENT_STATUSES.map((s) => s.status);
      expect(new Set(stats).size).toBe(stats.length);
    });

    it("has non-empty labels for every entry", () => {
      for (const s of DEVICE_AGREEMENT_STATUSES) {
        expect(s.label.trim().length).toBeGreaterThan(0);
      }
    });

    it.each([
      ["active", "Active"],
      ["suspended", "Suspended"],
      ["revoked", "Revoked"],
      ["pending_review", "Pending Review"],
      ["not_in_place", "Not in Place"],
    ])("maps %s to %s", (status, label) => {
      const found = DEVICE_AGREEMENT_STATUSES.find((s) => s.status === status);
      expect(found).toBeDefined();
      expect(found!.label).toBe(label);
    });
  });

  // ── SAFETY_CHECK_RESULTS ────────────────────────────────────────────
  describe("SAFETY_CHECK_RESULTS", () => {
    it("contains exactly 4 items", () => {
      expect(SAFETY_CHECK_RESULTS).toHaveLength(4);
    });

    it("has unique result values", () => {
      const results = SAFETY_CHECK_RESULTS.map((r) => r.result);
      expect(new Set(results).size).toBe(results.length);
    });

    it("has non-empty labels for every entry", () => {
      for (const r of SAFETY_CHECK_RESULTS) {
        expect(r.label.trim().length).toBeGreaterThan(0);
      }
    });

    it.each([
      ["compliant", "Compliant"],
      ["issues_found", "Issues Found"],
      ["action_required", "Action Required"],
      ["not_checked", "Not Checked"],
    ])("maps %s to %s", (result, label) => {
      const found = SAFETY_CHECK_RESULTS.find((r) => r.result === result);
      expect(found).toBeDefined();
      expect(found!.label).toBe(label);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. computeOnlineSafetyMetrics
// ═══════════════════════════════════════════════════════════════════════════

describe("computeOnlineSafetyMetrics", () => {
  describe("empty inputs", () => {
    it("returns all zeros / empty maps when both arrays are empty", () => {
      const result = computeOnlineSafetyMetrics([], [], 0, NOW);
      expect(result.total_incidents).toBe(0);
      expect(result.incidents_this_month).toBe(0);
      expect(result.critical_incidents).toBe(0);
      expect(result.safeguarding_referrals).toBe(0);
      expect(result.police_involved_count).toBe(0);
      expect(result.total_agreements).toBe(0);
      expect(result.active_agreements).toBe(0);
      expect(result.agreement_coverage).toBe(0);
      expect(result.filtering_enabled_rate).toBe(0);
      expect(result.monitoring_enabled_rate).toBe(0);
      expect(result.checks_overdue).toBe(0);
      expect(result.issues_found).toBe(0);
      expect(result.by_risk_category).toEqual({});
      expect(result.by_severity).toEqual({});
      expect(result.by_agreement_status).toEqual({});
      expect(result.by_check_result).toEqual({});
    });

    it("returns 16 fields in total", () => {
      const result = computeOnlineSafetyMetrics([], [], 0, NOW);
      expect(Object.keys(result)).toHaveLength(16);
    });
  });

  describe("total_incidents", () => {
    it("counts all incidents regardless of date", () => {
      const incidents = [
        makeIncident({ incident_date: "2025-01-01" }),
        makeIncident({ incident_date: "2026-05-12" }),
        makeIncident({ incident_date: "2024-06-15" }),
      ];
      const result = computeOnlineSafetyMetrics(incidents, [], 0, NOW);
      expect(result.total_incidents).toBe(3);
    });

    it("returns 0 when no incidents", () => {
      const result = computeOnlineSafetyMetrics([], [], 0, NOW);
      expect(result.total_incidents).toBe(0);
    });
  });

  describe("incidents_this_month", () => {
    it("counts incidents within the last 30 days", () => {
      const incidents = [
        makeIncident({ incident_date: "2026-05-10" }), // 3 days ago — in range
        makeIncident({ incident_date: "2026-04-20" }), // 23 days ago — in range
        makeIncident({ incident_date: "2026-04-13" }), // 30 days ago — in range (boundary)
      ];
      const result = computeOnlineSafetyMetrics(incidents, [], 0, NOW);
      expect(result.incidents_this_month).toBe(3);
    });

    it("excludes incidents older than 30 days", () => {
      const incidents = [
        makeIncident({ incident_date: "2026-05-10" }), // in range
        makeIncident({ incident_date: "2026-04-01" }), // 42 days ago — out of range
        makeIncident({ incident_date: "2025-01-01" }), // way out of range
      ];
      const result = computeOnlineSafetyMetrics(incidents, [], 0, NOW);
      expect(result.incidents_this_month).toBe(1);
    });

    it("excludes incidents in the future", () => {
      const incidents = [
        makeIncident({ incident_date: "2026-05-15" }), // future
      ];
      const result = computeOnlineSafetyMetrics(incidents, [], 0, NOW);
      expect(result.incidents_this_month).toBe(0);
    });

    it("includes incident exactly on the boundary date", () => {
      // NOW is 2026-05-13; 30 days ago is 2026-04-13
      const incidents = [
        makeIncident({ incident_date: "2026-04-13" }),
      ];
      const result = computeOnlineSafetyMetrics(incidents, [], 0, NOW);
      expect(result.incidents_this_month).toBe(1);
    });

    it("includes incident exactly on today", () => {
      const incidents = [
        makeIncident({ incident_date: "2026-05-13" }),
      ];
      const result = computeOnlineSafetyMetrics(incidents, [], 0, NOW);
      expect(result.incidents_this_month).toBe(1);
    });
  });

  describe("critical_incidents", () => {
    it("counts only critical severity incidents", () => {
      const incidents = [
        makeIncident({ severity: "critical" }),
        makeIncident({ severity: "critical" }),
        makeIncident({ severity: "high" }),
        makeIncident({ severity: "low" }),
      ];
      const result = computeOnlineSafetyMetrics(incidents, [], 0, NOW);
      expect(result.critical_incidents).toBe(2);
    });

    it("returns 0 when no critical incidents exist", () => {
      const incidents = [
        makeIncident({ severity: "medium" }),
        makeIncident({ severity: "low" }),
      ];
      const result = computeOnlineSafetyMetrics(incidents, [], 0, NOW);
      expect(result.critical_incidents).toBe(0);
    });
  });

  describe("safeguarding_referrals", () => {
    it("counts incidents where safeguarding_referral is true", () => {
      const incidents = [
        makeIncident({ safeguarding_referral: true }),
        makeIncident({ safeguarding_referral: false }),
        makeIncident({ safeguarding_referral: true }),
      ];
      const result = computeOnlineSafetyMetrics(incidents, [], 0, NOW);
      expect(result.safeguarding_referrals).toBe(2);
    });

    it("returns 0 when no referrals made", () => {
      const incidents = [makeIncident({ safeguarding_referral: false })];
      const result = computeOnlineSafetyMetrics(incidents, [], 0, NOW);
      expect(result.safeguarding_referrals).toBe(0);
    });
  });

  describe("police_involved_count", () => {
    it("counts incidents where police_involved is true", () => {
      const incidents = [
        makeIncident({ police_involved: true }),
        makeIncident({ police_involved: true }),
        makeIncident({ police_involved: false }),
      ];
      const result = computeOnlineSafetyMetrics(incidents, [], 0, NOW);
      expect(result.police_involved_count).toBe(2);
    });

    it("returns 0 when no police involvement", () => {
      const incidents = [makeIncident({ police_involved: false })];
      const result = computeOnlineSafetyMetrics(incidents, [], 0, NOW);
      expect(result.police_involved_count).toBe(0);
    });
  });

  describe("total_agreements", () => {
    it("counts all agreements", () => {
      const agreements = [
        makeAgreement({ status: "active" }),
        makeAgreement({ status: "suspended" }),
        makeAgreement({ status: "revoked" }),
      ];
      const result = computeOnlineSafetyMetrics([], agreements, 3, NOW);
      expect(result.total_agreements).toBe(3);
    });

    it("returns 0 when no agreements", () => {
      const result = computeOnlineSafetyMetrics([], [], 0, NOW);
      expect(result.total_agreements).toBe(0);
    });
  });

  describe("active_agreements", () => {
    it("counts only active agreements", () => {
      const agreements = [
        makeAgreement({ status: "active" }),
        makeAgreement({ status: "active" }),
        makeAgreement({ status: "suspended" }),
        makeAgreement({ status: "pending_review" }),
      ];
      const result = computeOnlineSafetyMetrics([], agreements, 4, NOW);
      expect(result.active_agreements).toBe(2);
    });

    it("returns 0 when no active agreements exist", () => {
      const agreements = [
        makeAgreement({ status: "revoked" }),
        makeAgreement({ status: "not_in_place" }),
      ];
      const result = computeOnlineSafetyMetrics([], agreements, 2, NOW);
      expect(result.active_agreements).toBe(0);
    });
  });

  describe("agreement_coverage", () => {
    it("computes coverage as percentage of unique children with active agreements", () => {
      const agreements = [
        makeAgreement({ status: "active", child_id: "c1" }),
        makeAgreement({ status: "active", child_id: "c2" }),
      ];
      const result = computeOnlineSafetyMetrics([], agreements, 4, NOW);
      expect(result.agreement_coverage).toBe(50.0);
    });

    it("deduplicates children by child_id", () => {
      const agreements = [
        makeAgreement({ status: "active", child_id: "c1" }),
        makeAgreement({ status: "active", child_id: "c1" }), // same child
        makeAgreement({ status: "active", child_id: "c2" }),
      ];
      const result = computeOnlineSafetyMetrics([], agreements, 4, NOW);
      expect(result.agreement_coverage).toBe(50.0);
    });

    it("returns 0 when totalChildren is 0", () => {
      const agreements = [makeAgreement({ status: "active" })];
      const result = computeOnlineSafetyMetrics([], agreements, 0, NOW);
      expect(result.agreement_coverage).toBe(0);
    });

    it("returns 100 when all children have active agreements", () => {
      const agreements = [
        makeAgreement({ status: "active", child_id: "c1" }),
        makeAgreement({ status: "active", child_id: "c2" }),
      ];
      const result = computeOnlineSafetyMetrics([], agreements, 2, NOW);
      expect(result.agreement_coverage).toBe(100.0);
    });

    it("excludes non-active agreements from coverage", () => {
      const agreements = [
        makeAgreement({ status: "suspended", child_id: "c1" }),
        makeAgreement({ status: "active", child_id: "c2" }),
      ];
      const result = computeOnlineSafetyMetrics([], agreements, 2, NOW);
      expect(result.agreement_coverage).toBe(50.0);
    });

    it("rounds to one decimal place", () => {
      const agreements = [
        makeAgreement({ status: "active", child_id: "c1" }),
      ];
      // 1/3 = 33.333...% => rounded to 33.3
      const result = computeOnlineSafetyMetrics([], agreements, 3, NOW);
      expect(result.agreement_coverage).toBe(33.3);
    });
  });

  describe("filtering_enabled_rate", () => {
    it("computes rate among active agreements only", () => {
      const agreements = [
        makeAgreement({ status: "active", filtering_enabled: true }),
        makeAgreement({ status: "active", filtering_enabled: false }),
      ];
      const result = computeOnlineSafetyMetrics([], agreements, 2, NOW);
      expect(result.filtering_enabled_rate).toBe(50.0);
    });

    it("ignores non-active agreements", () => {
      const agreements = [
        makeAgreement({ status: "active", filtering_enabled: true }),
        makeAgreement({ status: "suspended", filtering_enabled: true }),
      ];
      const result = computeOnlineSafetyMetrics([], agreements, 2, NOW);
      expect(result.filtering_enabled_rate).toBe(100.0);
    });

    it("returns 0 when no active agreements exist", () => {
      const agreements = [
        makeAgreement({ status: "revoked", filtering_enabled: true }),
      ];
      const result = computeOnlineSafetyMetrics([], agreements, 1, NOW);
      expect(result.filtering_enabled_rate).toBe(0);
    });

    it("returns 100 when all active agreements have filtering enabled", () => {
      const agreements = [
        makeAgreement({ status: "active", filtering_enabled: true }),
        makeAgreement({ status: "active", filtering_enabled: true }),
        makeAgreement({ status: "active", filtering_enabled: true }),
      ];
      const result = computeOnlineSafetyMetrics([], agreements, 3, NOW);
      expect(result.filtering_enabled_rate).toBe(100.0);
    });
  });

  describe("monitoring_enabled_rate", () => {
    it("computes rate among active agreements only", () => {
      const agreements = [
        makeAgreement({ status: "active", monitoring_enabled: true }),
        makeAgreement({ status: "active", monitoring_enabled: false }),
        makeAgreement({ status: "active", monitoring_enabled: true }),
      ];
      const result = computeOnlineSafetyMetrics([], agreements, 3, NOW);
      expect(result.monitoring_enabled_rate).toBe(66.7);
    });

    it("ignores non-active agreements", () => {
      const agreements = [
        makeAgreement({ status: "active", monitoring_enabled: true }),
        makeAgreement({ status: "suspended", monitoring_enabled: false }),
      ];
      const result = computeOnlineSafetyMetrics([], agreements, 2, NOW);
      expect(result.monitoring_enabled_rate).toBe(100.0);
    });

    it("returns 0 when no active agreements exist", () => {
      const agreements = [
        makeAgreement({ status: "not_in_place", monitoring_enabled: true }),
      ];
      const result = computeOnlineSafetyMetrics([], agreements, 1, NOW);
      expect(result.monitoring_enabled_rate).toBe(0);
    });
  });

  describe("checks_overdue", () => {
    it("counts active agreements with review_date in the past", () => {
      const agreements = [
        makeAgreement({ status: "active", review_date: "2026-05-01" }), // past
        makeAgreement({ status: "active", review_date: "2026-05-12" }), // past
        makeAgreement({ status: "active", review_date: "2026-06-01" }), // future
      ];
      const result = computeOnlineSafetyMetrics([], agreements, 3, NOW);
      expect(result.checks_overdue).toBe(2);
    });

    it("ignores non-active agreements with past review dates", () => {
      const agreements = [
        makeAgreement({ status: "suspended", review_date: "2026-01-01" }),
        makeAgreement({ status: "revoked", review_date: "2025-12-01" }),
      ];
      const result = computeOnlineSafetyMetrics([], agreements, 2, NOW);
      expect(result.checks_overdue).toBe(0);
    });

    it("does not count review_date equal to now (not strictly past)", () => {
      // NOW is 2026-05-13T00:00:00.000Z
      // new Date("2026-05-13") is also midnight — not < now
      const agreements = [
        makeAgreement({ status: "active", review_date: "2026-05-13" }),
      ];
      const result = computeOnlineSafetyMetrics([], agreements, 1, NOW);
      expect(result.checks_overdue).toBe(0);
    });
  });

  describe("issues_found", () => {
    it("counts agreements with issues_found or action_required result", () => {
      const agreements = [
        makeAgreement({ last_check_result: "issues_found" }),
        makeAgreement({ last_check_result: "action_required" }),
        makeAgreement({ last_check_result: "compliant" }),
        makeAgreement({ last_check_result: "not_checked" }),
      ];
      const result = computeOnlineSafetyMetrics([], agreements, 4, NOW);
      expect(result.issues_found).toBe(2);
    });

    it("includes all statuses, not just active", () => {
      const agreements = [
        makeAgreement({ status: "suspended", last_check_result: "issues_found" }),
        makeAgreement({ status: "revoked", last_check_result: "action_required" }),
      ];
      const result = computeOnlineSafetyMetrics([], agreements, 2, NOW);
      expect(result.issues_found).toBe(2);
    });

    it("returns 0 when all checks are compliant", () => {
      const agreements = [
        makeAgreement({ last_check_result: "compliant" }),
        makeAgreement({ last_check_result: "compliant" }),
      ];
      const result = computeOnlineSafetyMetrics([], agreements, 2, NOW);
      expect(result.issues_found).toBe(0);
    });
  });

  describe("by_risk_category", () => {
    it("groups incidents by risk_category", () => {
      const incidents = [
        makeIncident({ risk_category: "cyberbullying" }),
        makeIncident({ risk_category: "cyberbullying" }),
        makeIncident({ risk_category: "grooming" }),
        makeIncident({ risk_category: "sexting" }),
      ];
      const result = computeOnlineSafetyMetrics(incidents, [], 0, NOW);
      expect(result.by_risk_category).toEqual({
        cyberbullying: 2,
        grooming: 1,
        sexting: 1,
      });
    });

    it("returns empty object for no incidents", () => {
      const result = computeOnlineSafetyMetrics([], [], 0, NOW);
      expect(result.by_risk_category).toEqual({});
    });

    it("handles all 13 categories", () => {
      const categories: OnlineRiskCategory[] = [
        "cyberbullying", "inappropriate_content", "grooming", "sexting",
        "radicalisation", "excessive_screen_time", "online_gambling",
        "identity_theft", "social_media_misuse", "data_sharing",
        "online_exploitation", "self_harm_content", "other",
      ];
      const incidents = categories.map((c) => makeIncident({ risk_category: c }));
      const result = computeOnlineSafetyMetrics(incidents, [], 0, NOW);
      expect(Object.keys(result.by_risk_category)).toHaveLength(13);
      for (const cat of categories) {
        expect(result.by_risk_category[cat]).toBe(1);
      }
    });
  });

  describe("by_severity", () => {
    it("groups incidents by severity", () => {
      const incidents = [
        makeIncident({ severity: "critical" }),
        makeIncident({ severity: "high" }),
        makeIncident({ severity: "high" }),
        makeIncident({ severity: "low" }),
      ];
      const result = computeOnlineSafetyMetrics(incidents, [], 0, NOW);
      expect(result.by_severity).toEqual({
        critical: 1,
        high: 2,
        low: 1,
      });
    });

    it("returns empty object for no incidents", () => {
      const result = computeOnlineSafetyMetrics([], [], 0, NOW);
      expect(result.by_severity).toEqual({});
    });
  });

  describe("by_agreement_status", () => {
    it("groups agreements by status", () => {
      const agreements = [
        makeAgreement({ status: "active" }),
        makeAgreement({ status: "active" }),
        makeAgreement({ status: "suspended" }),
        makeAgreement({ status: "revoked" }),
      ];
      const result = computeOnlineSafetyMetrics([], agreements, 4, NOW);
      expect(result.by_agreement_status).toEqual({
        active: 2,
        suspended: 1,
        revoked: 1,
      });
    });

    it("returns empty object for no agreements", () => {
      const result = computeOnlineSafetyMetrics([], [], 0, NOW);
      expect(result.by_agreement_status).toEqual({});
    });

    it("handles all 5 statuses", () => {
      const statuses: DeviceAgreementStatus[] = [
        "active", "suspended", "revoked", "pending_review", "not_in_place",
      ];
      const agreements = statuses.map((s) => makeAgreement({ status: s }));
      const result = computeOnlineSafetyMetrics([], agreements, 5, NOW);
      expect(Object.keys(result.by_agreement_status)).toHaveLength(5);
      for (const status of statuses) {
        expect(result.by_agreement_status[status]).toBe(1);
      }
    });
  });

  describe("by_check_result", () => {
    it("groups agreements by last_check_result", () => {
      const agreements = [
        makeAgreement({ last_check_result: "compliant" }),
        makeAgreement({ last_check_result: "compliant" }),
        makeAgreement({ last_check_result: "action_required" }),
      ];
      const result = computeOnlineSafetyMetrics([], agreements, 3, NOW);
      expect(result.by_check_result).toEqual({
        compliant: 2,
        action_required: 1,
      });
    });

    it("returns empty object for no agreements", () => {
      const result = computeOnlineSafetyMetrics([], [], 0, NOW);
      expect(result.by_check_result).toEqual({});
    });

    it("handles all 4 check results", () => {
      const results: SafetyCheckResult[] = [
        "compliant", "issues_found", "action_required", "not_checked",
      ];
      const agreements = results.map((r) => makeAgreement({ last_check_result: r }));
      const result = computeOnlineSafetyMetrics([], agreements, 4, NOW);
      expect(Object.keys(result.by_check_result)).toHaveLength(4);
      for (const r of results) {
        expect(result.by_check_result[r]).toBe(1);
      }
    });
  });

  describe("single item edge cases", () => {
    it("correctly computes metrics for a single incident", () => {
      const incidents = [
        makeIncident({
          severity: "critical",
          safeguarding_referral: true,
          police_involved: true,
          incident_date: "2026-05-10",
          risk_category: "grooming",
        }),
      ];
      const result = computeOnlineSafetyMetrics(incidents, [], 0, NOW);
      expect(result.total_incidents).toBe(1);
      expect(result.incidents_this_month).toBe(1);
      expect(result.critical_incidents).toBe(1);
      expect(result.safeguarding_referrals).toBe(1);
      expect(result.police_involved_count).toBe(1);
    });

    it("correctly computes metrics for a single agreement", () => {
      const agreements = [
        makeAgreement({
          status: "active",
          filtering_enabled: true,
          monitoring_enabled: false,
          review_date: "2026-04-01", // past
          last_check_result: "issues_found",
          child_id: "c1",
        }),
      ];
      const result = computeOnlineSafetyMetrics([], agreements, 1, NOW);
      expect(result.total_agreements).toBe(1);
      expect(result.active_agreements).toBe(1);
      expect(result.agreement_coverage).toBe(100.0);
      expect(result.filtering_enabled_rate).toBe(100.0);
      expect(result.monitoring_enabled_rate).toBe(0);
      expect(result.checks_overdue).toBe(1);
      expect(result.issues_found).toBe(1);
    });
  });

  describe("large dataset", () => {
    it("handles 100 incidents correctly", () => {
      const incidents = Array.from({ length: 100 }, (_, i) =>
        makeIncident({
          severity: i < 25 ? "critical" : i < 50 ? "high" : i < 75 ? "medium" : "low",
          incident_date: "2026-05-10",
        }),
      );
      const result = computeOnlineSafetyMetrics(incidents, [], 0, NOW);
      expect(result.total_incidents).toBe(100);
      expect(result.critical_incidents).toBe(25);
      expect(result.by_severity).toEqual({
        critical: 25,
        high: 25,
        medium: 25,
        low: 25,
      });
    });

    it("handles 50 agreements correctly", () => {
      const agreements = Array.from({ length: 50 }, (_, i) =>
        makeAgreement({
          child_id: `child-${i}`,
          status: "active",
          filtering_enabled: i < 40,
          monitoring_enabled: i < 30,
        }),
      );
      const result = computeOnlineSafetyMetrics([], agreements, 50, NOW);
      expect(result.total_agreements).toBe(50);
      expect(result.active_agreements).toBe(50);
      expect(result.agreement_coverage).toBe(100.0);
      expect(result.filtering_enabled_rate).toBe(80.0);
      expect(result.monitoring_enabled_rate).toBe(60.0);
    });
  });

  describe("totalChildren = 0", () => {
    it("returns agreement_coverage 0 even with active agreements", () => {
      const agreements = [makeAgreement({ status: "active" })];
      const result = computeOnlineSafetyMetrics([], agreements, 0, NOW);
      expect(result.agreement_coverage).toBe(0);
    });
  });

  describe("default now parameter", () => {
    it("uses current date when now is not provided", () => {
      const incidents = [
        makeIncident({ incident_date: new Date().toISOString().split("T")[0] }),
      ];
      const result = computeOnlineSafetyMetrics(incidents, [], 0);
      expect(result.incidents_this_month).toBe(1);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. identifyOnlineSafetyAlerts
// ═══════════════════════════════════════════════════════════════════════════

describe("identifyOnlineSafetyAlerts", () => {
  describe("empty inputs", () => {
    it("returns no alerts for empty arrays and zero children", () => {
      const alerts = identifyOnlineSafetyAlerts([], [], 0, NOW);
      expect(alerts).toEqual([]);
    });

    it("returns no alerts for empty arrays with children", () => {
      // 0 children with agreement < totalChildren would trigger no_agreement
      // but with 0 incidents and 0 agreements it still might trigger
      const alerts = identifyOnlineSafetyAlerts([], [], 3, NOW);
      // Should produce a no_agreement alert because 3 > 0
      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe("no_agreement");
    });
  });

  describe("safeguarding_not_referred", () => {
    it("alerts for critical grooming incident without referral", () => {
      const incidents = [
        makeIncident({
          severity: "critical",
          risk_category: "grooming",
          safeguarding_referral: false,
          child_name: "Alex",
          incident_date: "2026-05-10",
        }),
      ];
      const alerts = identifyOnlineSafetyAlerts(incidents, [], 0, NOW);
      const a = alerts.find((x) => x.type === "safeguarding_not_referred");
      expect(a).toBeDefined();
      expect(a!.severity).toBe("critical");
      expect(a!.message).toContain("Grooming");
      expect(a!.message).toContain("Alex");
      expect(a!.message).toContain("safeguarding referral not made");
    });

    it("alerts for high online_exploitation incident without referral", () => {
      const incidents = [
        makeIncident({
          severity: "high",
          risk_category: "online_exploitation",
          safeguarding_referral: false,
          child_name: "Sam",
        }),
      ];
      const alerts = identifyOnlineSafetyAlerts(incidents, [], 0, NOW);
      const a = alerts.find((x) => x.type === "safeguarding_not_referred");
      expect(a).toBeDefined();
      expect(a!.message).toContain("Online exploitation");
      expect(a!.message).toContain("Sam");
    });

    it("alerts for critical sexting incident without referral", () => {
      const incidents = [
        makeIncident({
          severity: "critical",
          risk_category: "sexting",
          safeguarding_referral: false,
          child_name: "Jordan",
        }),
      ];
      const alerts = identifyOnlineSafetyAlerts(incidents, [], 0, NOW);
      const a = alerts.find((x) => x.type === "safeguarding_not_referred");
      expect(a).toBeDefined();
      expect(a!.message).toContain("Sexting");
      expect(a!.message).toContain("Jordan");
    });

    it("does NOT alert when safeguarding referral is made", () => {
      const incidents = [
        makeIncident({
          severity: "critical",
          risk_category: "grooming",
          safeguarding_referral: true,
        }),
      ];
      const alerts = identifyOnlineSafetyAlerts(incidents, [], 0, NOW);
      expect(alerts.find((x) => x.type === "safeguarding_not_referred")).toBeUndefined();
    });

    it("does NOT alert for medium severity grooming", () => {
      const incidents = [
        makeIncident({
          severity: "medium",
          risk_category: "grooming",
          safeguarding_referral: false,
        }),
      ];
      const alerts = identifyOnlineSafetyAlerts(incidents, [], 0, NOW);
      expect(alerts.find((x) => x.type === "safeguarding_not_referred")).toBeUndefined();
    });

    it("does NOT alert for low severity exploitation", () => {
      const incidents = [
        makeIncident({
          severity: "low",
          risk_category: "online_exploitation",
          safeguarding_referral: false,
        }),
      ];
      const alerts = identifyOnlineSafetyAlerts(incidents, [], 0, NOW);
      expect(alerts.find((x) => x.type === "safeguarding_not_referred")).toBeUndefined();
    });

    it("does NOT alert for high severity cyberbullying (wrong category)", () => {
      const incidents = [
        makeIncident({
          severity: "high",
          risk_category: "cyberbullying",
          safeguarding_referral: false,
        }),
      ];
      const alerts = identifyOnlineSafetyAlerts(incidents, [], 0, NOW);
      expect(alerts.find((x) => x.type === "safeguarding_not_referred")).toBeUndefined();
    });

    it("uses the incident id as the alert id", () => {
      const incidents = [
        makeIncident({
          id: "inc-99",
          severity: "critical",
          risk_category: "grooming",
          safeguarding_referral: false,
        }),
      ];
      const alerts = identifyOnlineSafetyAlerts(incidents, [], 0, NOW);
      const a = alerts.find((x) => x.type === "safeguarding_not_referred");
      expect(a!.id).toBe("inc-99");
    });

    it("generates multiple alerts for multiple qualifying incidents", () => {
      const incidents = [
        makeIncident({
          severity: "critical",
          risk_category: "grooming",
          safeguarding_referral: false,
        }),
        makeIncident({
          severity: "high",
          risk_category: "sexting",
          safeguarding_referral: false,
        }),
      ];
      const alerts = identifyOnlineSafetyAlerts(incidents, [], 0, NOW);
      const safeguardingAlerts = alerts.filter((x) => x.type === "safeguarding_not_referred");
      expect(safeguardingAlerts).toHaveLength(2);
    });
  });

  describe("no_agreement", () => {
    it("alerts when totalChildren exceeds children with active/pending agreements", () => {
      const agreements = [
        makeAgreement({ status: "active", child_id: "c1" }),
      ];
      const alerts = identifyOnlineSafetyAlerts([], agreements, 3, NOW);
      const a = alerts.find((x) => x.type === "no_agreement");
      expect(a).toBeDefined();
      expect(a!.severity).toBe("high");
      expect(a!.message).toContain("2");
      expect(a!.id).toBe("agreement_gap");
    });

    it("uses singular form for 1 child without agreement", () => {
      const agreements = [
        makeAgreement({ status: "active", child_id: "c1" }),
      ];
      const alerts = identifyOnlineSafetyAlerts([], agreements, 2, NOW);
      const a = alerts.find((x) => x.type === "no_agreement");
      expect(a).toBeDefined();
      expect(a!.message).toContain("child does");
    });

    it("uses plural form for multiple children without agreement", () => {
      const alerts = identifyOnlineSafetyAlerts([], [], 3, NOW);
      const a = alerts.find((x) => x.type === "no_agreement");
      expect(a).toBeDefined();
      expect(a!.message).toContain("children do");
    });

    it("considers pending_review agreements as covered", () => {
      const agreements = [
        makeAgreement({ status: "pending_review", child_id: "c1" }),
        makeAgreement({ status: "active", child_id: "c2" }),
      ];
      const alerts = identifyOnlineSafetyAlerts([], agreements, 2, NOW);
      expect(alerts.find((x) => x.type === "no_agreement")).toBeUndefined();
    });

    it("does NOT alert when all children have agreements", () => {
      const agreements = [
        makeAgreement({ status: "active", child_id: "c1" }),
        makeAgreement({ status: "active", child_id: "c2" }),
      ];
      const alerts = identifyOnlineSafetyAlerts([], agreements, 2, NOW);
      expect(alerts.find((x) => x.type === "no_agreement")).toBeUndefined();
    });

    it("does NOT alert when totalChildren is 0", () => {
      const alerts = identifyOnlineSafetyAlerts([], [], 0, NOW);
      expect(alerts.find((x) => x.type === "no_agreement")).toBeUndefined();
    });

    it("does NOT count suspended agreements towards coverage", () => {
      const agreements = [
        makeAgreement({ status: "suspended", child_id: "c1" }),
      ];
      const alerts = identifyOnlineSafetyAlerts([], agreements, 1, NOW);
      const a = alerts.find((x) => x.type === "no_agreement");
      expect(a).toBeDefined();
    });

    it("deduplicates children with multiple active agreements", () => {
      const agreements = [
        makeAgreement({ status: "active", child_id: "c1" }),
        makeAgreement({ status: "active", child_id: "c1" }),
      ];
      const alerts = identifyOnlineSafetyAlerts([], agreements, 1, NOW);
      expect(alerts.find((x) => x.type === "no_agreement")).toBeUndefined();
    });
  });

  describe("review_overdue", () => {
    it("alerts for active agreements with past review_date", () => {
      const agreements = [
        makeAgreement({
          id: "agr-1",
          status: "active",
          review_date: "2026-05-01",
          child_name: "Alex",
        }),
      ];
      const alerts = identifyOnlineSafetyAlerts([], agreements, 1, NOW);
      const a = alerts.find((x) => x.type === "review_overdue");
      expect(a).toBeDefined();
      expect(a!.severity).toBe("medium");
      expect(a!.message).toContain("Alex");
      expect(a!.message).toContain("2026-05-01");
      expect(a!.id).toBe("agr-1");
    });

    it("does NOT alert for active agreements with future review_date", () => {
      const agreements = [
        makeAgreement({ status: "active", review_date: "2026-06-01" }),
      ];
      const alerts = identifyOnlineSafetyAlerts([], agreements, 1, NOW);
      expect(alerts.find((x) => x.type === "review_overdue")).toBeUndefined();
    });

    it("does NOT alert for non-active agreements with past review_date", () => {
      const agreements = [
        makeAgreement({ status: "suspended", review_date: "2026-01-01" }),
      ];
      const alerts = identifyOnlineSafetyAlerts([], agreements, 1, NOW);
      expect(alerts.find((x) => x.type === "review_overdue")).toBeUndefined();
    });

    it("generates separate alerts for each overdue agreement", () => {
      const agreements = [
        makeAgreement({ status: "active", review_date: "2026-04-01", child_name: "Alex" }),
        makeAgreement({ status: "active", review_date: "2026-03-15", child_name: "Sam" }),
      ];
      const alerts = identifyOnlineSafetyAlerts([], agreements, 2, NOW);
      const overdue = alerts.filter((x) => x.type === "review_overdue");
      expect(overdue).toHaveLength(2);
    });
  });

  describe("safety_controls_missing", () => {
    it("alerts when filtering is not enabled on active agreement", () => {
      const agreements = [
        makeAgreement({
          id: "agr-2",
          status: "active",
          filtering_enabled: false,
          monitoring_enabled: true,
          child_name: "Sam",
        }),
      ];
      const alerts = identifyOnlineSafetyAlerts([], agreements, 1, NOW);
      const a = alerts.find((x) => x.type === "safety_controls_missing");
      expect(a).toBeDefined();
      expect(a!.severity).toBe("high");
      expect(a!.message).toContain("Filtering");
      expect(a!.message).not.toContain("and monitoring");
      expect(a!.message).toContain("Sam");
    });

    it("alerts when monitoring is not enabled on active agreement", () => {
      const agreements = [
        makeAgreement({
          status: "active",
          filtering_enabled: true,
          monitoring_enabled: false,
          child_name: "Jordan",
        }),
      ];
      const alerts = identifyOnlineSafetyAlerts([], agreements, 1, NOW);
      const a = alerts.find((x) => x.type === "safety_controls_missing");
      expect(a).toBeDefined();
      expect(a!.message).toContain("Monitoring");
    });

    it("alerts when both filtering and monitoring are not enabled", () => {
      const agreements = [
        makeAgreement({
          status: "active",
          filtering_enabled: false,
          monitoring_enabled: false,
          child_name: "Morgan",
        }),
      ];
      const alerts = identifyOnlineSafetyAlerts([], agreements, 1, NOW);
      const a = alerts.find((x) => x.type === "safety_controls_missing");
      expect(a).toBeDefined();
      expect(a!.message).toContain("Filtering and monitoring");
    });

    it("does NOT alert when both controls are enabled", () => {
      const agreements = [
        makeAgreement({
          status: "active",
          filtering_enabled: true,
          monitoring_enabled: true,
        }),
      ];
      const alerts = identifyOnlineSafetyAlerts([], agreements, 1, NOW);
      expect(alerts.find((x) => x.type === "safety_controls_missing")).toBeUndefined();
    });

    it("does NOT alert for non-active agreements", () => {
      const agreements = [
        makeAgreement({
          status: "suspended",
          filtering_enabled: false,
          monitoring_enabled: false,
        }),
      ];
      const alerts = identifyOnlineSafetyAlerts([], agreements, 1, NOW);
      expect(alerts.find((x) => x.type === "safety_controls_missing")).toBeUndefined();
    });
  });

  describe("check_action_required", () => {
    it("alerts for agreements with action_required check result", () => {
      const agreements = [
        makeAgreement({
          id: "agr-3",
          last_check_result: "action_required",
          child_name: "Casey",
        }),
      ];
      const alerts = identifyOnlineSafetyAlerts([], agreements, 1, NOW);
      const a = alerts.find((x) => x.type === "check_action_required");
      expect(a).toBeDefined();
      expect(a!.severity).toBe("high");
      expect(a!.message).toContain("Casey");
      expect(a!.message).toContain("issues requiring action");
      expect(a!.id).toBe("agr-3");
    });

    it("does NOT alert for issues_found result", () => {
      const agreements = [
        makeAgreement({ last_check_result: "issues_found" }),
      ];
      const alerts = identifyOnlineSafetyAlerts([], agreements, 1, NOW);
      expect(alerts.find((x) => x.type === "check_action_required")).toBeUndefined();
    });

    it("does NOT alert for compliant result", () => {
      const agreements = [
        makeAgreement({ last_check_result: "compliant" }),
      ];
      const alerts = identifyOnlineSafetyAlerts([], agreements, 1, NOW);
      expect(alerts.find((x) => x.type === "check_action_required")).toBeUndefined();
    });

    it("does NOT alert for not_checked result", () => {
      const agreements = [
        makeAgreement({ last_check_result: "not_checked" }),
      ];
      const alerts = identifyOnlineSafetyAlerts([], agreements, 1, NOW);
      expect(alerts.find((x) => x.type === "check_action_required")).toBeUndefined();
    });

    it("alerts regardless of agreement status", () => {
      const agreements = [
        makeAgreement({ status: "suspended", last_check_result: "action_required" }),
      ];
      const alerts = identifyOnlineSafetyAlerts([], agreements, 1, NOW);
      expect(alerts.find((x) => x.type === "check_action_required")).toBeDefined();
    });
  });

  describe("combined scenarios", () => {
    it("returns multiple alert types at once", () => {
      const incidents = [
        makeIncident({
          severity: "critical",
          risk_category: "grooming",
          safeguarding_referral: false,
        }),
      ];
      const agreements = [
        makeAgreement({
          status: "active",
          review_date: "2026-04-01",
          filtering_enabled: false,
          monitoring_enabled: false,
          last_check_result: "action_required",
          child_id: "c1",
        }),
      ];
      const alerts = identifyOnlineSafetyAlerts(incidents, agreements, 3, NOW);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("safeguarding_not_referred");
      expect(types).toContain("no_agreement");
      expect(types).toContain("review_overdue");
      expect(types).toContain("safety_controls_missing");
      expect(types).toContain("check_action_required");
    });

    it("returns no alerts when everything is in order", () => {
      const incidents = [
        makeIncident({
          severity: "low",
          risk_category: "cyberbullying",
          safeguarding_referral: false,
        }),
      ];
      const agreements = [
        makeAgreement({
          status: "active",
          review_date: "2026-06-01",
          filtering_enabled: true,
          monitoring_enabled: true,
          last_check_result: "compliant",
          child_id: "c1",
        }),
        makeAgreement({
          status: "active",
          review_date: "2026-07-01",
          filtering_enabled: true,
          monitoring_enabled: true,
          last_check_result: "compliant",
          child_id: "c2",
        }),
      ];
      const alerts = identifyOnlineSafetyAlerts(incidents, agreements, 2, NOW);
      expect(alerts).toHaveLength(0);
    });
  });

  describe("non-triggering conditions", () => {
    it("no safeguarding alert for critical cyberbullying without referral", () => {
      const incidents = [
        makeIncident({
          severity: "critical",
          risk_category: "cyberbullying",
          safeguarding_referral: false,
        }),
      ];
      const alerts = identifyOnlineSafetyAlerts(incidents, [], 0, NOW);
      expect(alerts.find((x) => x.type === "safeguarding_not_referred")).toBeUndefined();
    });

    it("no review_overdue alert for revoked agreement with past date", () => {
      const agreements = [
        makeAgreement({ status: "revoked", review_date: "2025-01-01" }),
      ];
      const alerts = identifyOnlineSafetyAlerts([], agreements, 1, NOW);
      expect(alerts.find((x) => x.type === "review_overdue")).toBeUndefined();
    });

    it("no safety_controls_missing for pending_review agreement", () => {
      const agreements = [
        makeAgreement({
          status: "pending_review",
          filtering_enabled: false,
          monitoring_enabled: false,
        }),
      ];
      const alerts = identifyOnlineSafetyAlerts([], agreements, 1, NOW);
      expect(alerts.find((x) => x.type === "safety_controls_missing")).toBeUndefined();
    });
  });

  describe("default now parameter", () => {
    it("uses current date when now is not provided", () => {
      const agreements = [
        makeAgreement({
          status: "active",
          review_date: "2020-01-01", // definitely past
          child_id: "c1",
        }),
      ];
      const alerts = identifyOnlineSafetyAlerts([], agreements, 1);
      expect(alerts.find((x) => x.type === "review_overdue")).toBeDefined();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. CRUD FALLBACK (Supabase disabled)
// ═══════════════════════════════════════════════════════════════════════════

describe("CRUD fallback (Supabase disabled)", () => {
  describe("listIncidents", () => {
    it("returns ok with empty data array", async () => {
      const result = await listIncidents("home-1");
      expect(result).toEqual({ ok: true, data: [] });
    });

    it("returns ok with empty data when filters are provided", async () => {
      const result = await listIncidents("home-1", {
        childId: "c1",
        riskCategory: "grooming",
        severity: "critical",
        dateFrom: "2026-01-01",
        dateTo: "2026-12-31",
        limit: 10,
      });
      expect(result).toEqual({ ok: true, data: [] });
    });

    it("result has ok set to true", async () => {
      const result = await listIncidents("home-1");
      expect(result.ok).toBe(true);
    });

    it("result data is an array", async () => {
      const result = await listIncidents("home-1");
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe("createIncident", () => {
    it("returns error when Supabase is not configured", async () => {
      const result = await createIncident({
        homeId: "home-1",
        childName: "Alex",
        childId: "c1",
        incidentDate: "2026-05-10",
        riskCategory: "cyberbullying",
        severity: "medium",
        description: "Test",
        actionTaken: "Spoke with child",
        parentCarerInformed: true,
        socialWorkerInformed: false,
        policeInvolved: false,
        safeguardingReferral: false,
        staffRecording: "staff-1",
      });
      expect(result.ok).toBe(false);
      expect(result.error).toBe("Supabase not configured");
    });
  });

  describe("updateIncident", () => {
    it("returns error when Supabase is not configured", async () => {
      const result = await updateIncident("inc-1", { severity: "high" });
      expect(result.ok).toBe(false);
      expect(result.error).toBe("Supabase not configured");
    });
  });

  describe("listAgreements", () => {
    it("returns ok with empty data array", async () => {
      const result = await listAgreements("home-1");
      expect(result).toEqual({ ok: true, data: [] });
    });

    it("returns ok with empty data when filters are provided", async () => {
      const result = await listAgreements("home-1", {
        childId: "c1",
        status: "active",
        limit: 10,
      });
      expect(result).toEqual({ ok: true, data: [] });
    });

    it("result has ok set to true", async () => {
      const result = await listAgreements("home-1");
      expect(result.ok).toBe(true);
    });

    it("result data is an array", async () => {
      const result = await listAgreements("home-1");
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe("createAgreement", () => {
    it("returns error when Supabase is not configured", async () => {
      const result = await createAgreement({
        homeId: "home-1",
        childName: "Alex",
        childId: "c1",
        deviceTypes: ["tablet"],
        agreementDate: "2026-05-01",
        reviewDate: "2026-08-01",
        filteringEnabled: true,
        monitoringEnabled: true,
        agreedUsageHours: 3,
        restrictions: [],
      });
      expect(result.ok).toBe(false);
      expect(result.error).toBe("Supabase not configured");
    });
  });

  describe("updateAgreement", () => {
    it("returns error when Supabase is not configured", async () => {
      const result = await updateAgreement("agr-1", { status: "suspended" });
      expect(result.ok).toBe(false);
      expect(result.error).toBe("Supabase not configured");
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. EDGE CASES
// ═══════════════════════════════════════════════════════════════════════════

describe("Edge cases", () => {
  describe("empty device_types and restrictions arrays", () => {
    it("agreement with empty device_types is handled correctly", () => {
      const agreements = [makeAgreement({ device_types: [] })];
      const result = computeOnlineSafetyMetrics([], agreements, 1, NOW);
      expect(result.total_agreements).toBe(1);
    });

    it("agreement with empty restrictions is handled correctly", () => {
      const agreements = [makeAgreement({ restrictions: [] })];
      const result = computeOnlineSafetyMetrics([], agreements, 1, NOW);
      expect(result.total_agreements).toBe(1);
    });
  });

  describe("type safety", () => {
    it("by_risk_category keys are valid OnlineRiskCategory values", () => {
      const validCategories: OnlineRiskCategory[] = [
        "cyberbullying", "inappropriate_content", "grooming", "sexting",
        "radicalisation", "excessive_screen_time", "online_gambling",
        "identity_theft", "social_media_misuse", "data_sharing",
        "online_exploitation", "self_harm_content", "other",
      ];
      const incidents = [
        makeIncident({ risk_category: "grooming" }),
        makeIncident({ risk_category: "cyberbullying" }),
      ];
      const result = computeOnlineSafetyMetrics(incidents, [], 0, NOW);
      for (const key of Object.keys(result.by_risk_category)) {
        expect(validCategories).toContain(key);
      }
    });

    it("by_severity keys are valid IncidentSeverity values", () => {
      const validSeverities: IncidentSeverity[] = ["critical", "high", "medium", "low"];
      const incidents = [
        makeIncident({ severity: "critical" }),
        makeIncident({ severity: "low" }),
      ];
      const result = computeOnlineSafetyMetrics(incidents, [], 0, NOW);
      for (const key of Object.keys(result.by_severity)) {
        expect(validSeverities).toContain(key);
      }
    });

    it("by_agreement_status keys are valid DeviceAgreementStatus values", () => {
      const validStatuses: DeviceAgreementStatus[] = [
        "active", "suspended", "revoked", "pending_review", "not_in_place",
      ];
      const agreements = [
        makeAgreement({ status: "active" }),
        makeAgreement({ status: "suspended" }),
      ];
      const result = computeOnlineSafetyMetrics([], agreements, 2, NOW);
      for (const key of Object.keys(result.by_agreement_status)) {
        expect(validStatuses).toContain(key);
      }
    });

    it("by_check_result keys are valid SafetyCheckResult values", () => {
      const validResults: SafetyCheckResult[] = [
        "compliant", "issues_found", "action_required", "not_checked",
      ];
      const agreements = [
        makeAgreement({ last_check_result: "compliant" }),
        makeAgreement({ last_check_result: "issues_found" }),
      ];
      const result = computeOnlineSafetyMetrics([], agreements, 2, NOW);
      for (const key of Object.keys(result.by_check_result)) {
        expect(validResults).toContain(key);
      }
    });

    it("alert severity is always critical, high, or medium", () => {
      const incidents = [
        makeIncident({
          severity: "critical",
          risk_category: "grooming",
          safeguarding_referral: false,
        }),
      ];
      const agreements = [
        makeAgreement({
          status: "active",
          review_date: "2026-04-01",
          filtering_enabled: false,
          monitoring_enabled: false,
          last_check_result: "action_required",
          child_id: "c1",
        }),
      ];
      const alerts = identifyOnlineSafetyAlerts(incidents, agreements, 3, NOW);
      const validSeverities = ["critical", "high", "medium"];
      for (const alert of alerts) {
        expect(validSeverities).toContain(alert.severity);
      }
    });
  });

  describe("single incident variations", () => {
    it("incident with all flags true", () => {
      const incidents = [
        makeIncident({
          safeguarding_referral: true,
          police_involved: true,
          parent_carer_informed: true,
          social_worker_informed: true,
          severity: "critical",
          incident_date: "2026-05-10",
        }),
      ];
      const result = computeOnlineSafetyMetrics(incidents, [], 0, NOW);
      expect(result.total_incidents).toBe(1);
      expect(result.incidents_this_month).toBe(1);
      expect(result.critical_incidents).toBe(1);
      expect(result.safeguarding_referrals).toBe(1);
      expect(result.police_involved_count).toBe(1);
    });

    it("incident with all flags false", () => {
      const incidents = [
        makeIncident({
          safeguarding_referral: false,
          police_involved: false,
          parent_carer_informed: false,
          social_worker_informed: false,
          severity: "low",
          incident_date: "2026-05-10",
        }),
      ];
      const result = computeOnlineSafetyMetrics(incidents, [], 0, NOW);
      expect(result.total_incidents).toBe(1);
      expect(result.incidents_this_month).toBe(1);
      expect(result.critical_incidents).toBe(0);
      expect(result.safeguarding_referrals).toBe(0);
      expect(result.police_involved_count).toBe(0);
    });
  });

  describe("large dataset alerts", () => {
    it("handles 20 overdue agreements generating 20 alerts", () => {
      const agreements = Array.from({ length: 20 }, (_, i) =>
        makeAgreement({
          status: "active",
          review_date: "2026-01-01",
          child_id: `child-${i}`,
          child_name: `Child ${i}`,
          filtering_enabled: true,
          monitoring_enabled: true,
          last_check_result: "compliant",
        }),
      );
      const alerts = identifyOnlineSafetyAlerts([], agreements, 20, NOW);
      const overdue = alerts.filter((a) => a.type === "review_overdue");
      expect(overdue).toHaveLength(20);
    });
  });

  describe("mixed metrics computation", () => {
    it("computes all fields correctly with both incidents and agreements", () => {
      const incidents = [
        makeIncident({
          severity: "critical",
          risk_category: "grooming",
          safeguarding_referral: true,
          police_involved: true,
          incident_date: "2026-05-10",
        }),
        makeIncident({
          severity: "high",
          risk_category: "cyberbullying",
          safeguarding_referral: false,
          police_involved: false,
          incident_date: "2026-05-08",
        }),
        makeIncident({
          severity: "low",
          risk_category: "excessive_screen_time",
          safeguarding_referral: false,
          police_involved: false,
          incident_date: "2025-01-01", // old
        }),
      ];
      const agreements = [
        makeAgreement({
          status: "active",
          child_id: "c1",
          filtering_enabled: true,
          monitoring_enabled: true,
          review_date: "2026-06-01",
          last_check_result: "compliant",
        }),
        makeAgreement({
          status: "active",
          child_id: "c2",
          filtering_enabled: false,
          monitoring_enabled: true,
          review_date: "2026-04-01", // overdue
          last_check_result: "action_required",
        }),
        makeAgreement({
          status: "suspended",
          child_id: "c3",
          filtering_enabled: true,
          monitoring_enabled: true,
          review_date: "2026-03-01",
          last_check_result: "issues_found",
        }),
      ];
      const result = computeOnlineSafetyMetrics(incidents, agreements, 4, NOW);

      expect(result.total_incidents).toBe(3);
      expect(result.incidents_this_month).toBe(2);
      expect(result.critical_incidents).toBe(1);
      expect(result.safeguarding_referrals).toBe(1);
      expect(result.police_involved_count).toBe(1);
      expect(result.total_agreements).toBe(3);
      expect(result.active_agreements).toBe(2);
      expect(result.agreement_coverage).toBe(50.0);
      expect(result.filtering_enabled_rate).toBe(50.0);
      expect(result.monitoring_enabled_rate).toBe(100.0);
      expect(result.checks_overdue).toBe(1);
      expect(result.issues_found).toBe(2); // action_required + issues_found
      expect(result.by_risk_category).toEqual({
        grooming: 1,
        cyberbullying: 1,
        excessive_screen_time: 1,
      });
      expect(result.by_severity).toEqual({
        critical: 1,
        high: 1,
        low: 1,
      });
      expect(result.by_agreement_status).toEqual({
        active: 2,
        suspended: 1,
      });
      expect(result.by_check_result).toEqual({
        compliant: 1,
        action_required: 1,
        issues_found: 1,
      });
    });
  });

  describe("factory helpers produce valid data", () => {
    it("makeIncident produces an object with all required fields", () => {
      const inc = makeIncident();
      const requiredKeys: (keyof OnlineSafetyIncident)[] = [
        "id", "home_id", "child_name", "child_id", "incident_date",
        "risk_category", "severity", "description", "platform_involved",
        "device_type", "action_taken", "parent_carer_informed",
        "social_worker_informed", "police_involved", "safeguarding_referral",
        "outcome", "staff_recording", "created_at", "updated_at",
      ];
      for (const key of requiredKeys) {
        expect(inc).toHaveProperty(key);
      }
    });

    it("makeAgreement produces an object with all required fields", () => {
      const agr = makeAgreement();
      const requiredKeys: (keyof DeviceAgreement)[] = [
        "id", "home_id", "child_name", "child_id", "device_types",
        "agreement_date", "review_date", "status", "filtering_enabled",
        "monitoring_enabled", "agreed_usage_hours", "restrictions",
        "last_safety_check", "last_check_result", "created_at", "updated_at",
      ];
      for (const key of requiredKeys) {
        expect(agr).toHaveProperty(key);
      }
    });

    it("makeIncident generates unique ids", () => {
      const a = makeIncident();
      const b = makeIncident();
      expect(a.id).not.toBe(b.id);
    });

    it("makeAgreement generates unique ids", () => {
      const a = makeAgreement();
      const b = makeAgreement();
      expect(a.id).not.toBe(b.id);
    });
  });
});
