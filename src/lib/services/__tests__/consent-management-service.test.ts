// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CONSENT MANAGEMENT SERVICE TESTS
// Pure-function tests for consent metrics computation, alert identification,
// constant validation, and CRUD fallback under CHR 2015 Reg 7/8/14/32.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeAll } from "vitest";
import {
  _testing,
  CONSENT_CATEGORIES,
  CONSENT_STATUSES,
  CONSENT_GIVEN_BY,
} from "../consent-management-service";
import type {
  ConsentRecord,
  ConsentCategory,
  ConsentStatus,
  ConsentGivenBy,
} from "../consent-management-service";

const { computeConsentMetrics, identifyConsentAlerts } = _testing;

// ── Mock Supabase ────────────────────────────────────────────────────────

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => false,
  createServerClient: () => null,
}));

// ── Helpers ──────────────────────────────────────────────────────────────

function makeRecord(overrides: Partial<ConsentRecord> = {}): ConsentRecord {
  return {
    id: crypto.randomUUID(),
    home_id: "home-1",
    child_name: "Alex Smith",
    child_id: "child-1",
    category: "medical_treatment" as ConsentCategory,
    status: "granted" as ConsentStatus,
    given_by: "parent_mother" as ConsentGivenBy,
    given_by_name: "Sarah Smith",
    consent_date: "2026-01-15",
    expiry_date: null,
    conditions: null,
    evidence_on_file: true,
    reviewed_date: null,
    notes: null,
    created_at: "2026-01-15T00:00:00Z",
    updated_at: "2026-01-15T00:00:00Z",
    ...overrides,
  };
}

const now = new Date(new Date().toISOString().split("T")[0]);

function futureDate(days: number): string {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function pastDate(days: number): string {
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

// ── CONSENT_CATEGORIES ──────────────────────────────────────────────────

describe("CONSENT_CATEGORIES", () => {
  it("has exactly 15 entries", () => {
    expect(CONSENT_CATEGORIES).toHaveLength(15);
  });

  it("has unique category values", () => {
    const cats = CONSENT_CATEGORIES.map((c) => c.category);
    expect(new Set(cats).size).toBe(cats.length);
  });

  it("every entry has a non-empty label", () => {
    for (const entry of CONSENT_CATEGORIES) {
      expect(entry.label.length).toBeGreaterThan(0);
    }
  });

  it("every entry has a non-empty category", () => {
    for (const entry of CONSENT_CATEGORIES) {
      expect(entry.category.length).toBeGreaterThan(0);
    }
  });

  it("contains medical_treatment", () => {
    const cats = CONSENT_CATEGORIES.map((c) => c.category);
    expect(cats).toContain("medical_treatment");
  });

  it("contains dental_treatment", () => {
    const cats = CONSENT_CATEGORIES.map((c) => c.category);
    expect(cats).toContain("dental_treatment");
  });

  it("contains immunisation", () => {
    const cats = CONSENT_CATEGORIES.map((c) => c.category);
    expect(cats).toContain("immunisation");
  });

  it("contains emergency_medical", () => {
    const cats = CONSENT_CATEGORIES.map((c) => c.category);
    expect(cats).toContain("emergency_medical");
  });

  it("contains photographs", () => {
    const cats = CONSENT_CATEGORIES.map((c) => c.category);
    expect(cats).toContain("photographs");
  });

  it("contains social_media", () => {
    const cats = CONSENT_CATEGORIES.map((c) => c.category);
    expect(cats).toContain("social_media");
  });

  it("contains outings_trips", () => {
    const cats = CONSENT_CATEGORIES.map((c) => c.category);
    expect(cats).toContain("outings_trips");
  });

  it("contains overnight_stays", () => {
    const cats = CONSENT_CATEGORIES.map((c) => c.category);
    expect(cats).toContain("overnight_stays");
  });

  it("contains information_sharing", () => {
    const cats = CONSENT_CATEGORIES.map((c) => c.category);
    expect(cats).toContain("information_sharing");
  });

  it("contains education_records", () => {
    const cats = CONSENT_CATEGORIES.map((c) => c.category);
    expect(cats).toContain("education_records");
  });

  it("contains therapy_counselling", () => {
    const cats = CONSENT_CATEGORIES.map((c) => c.category);
    expect(cats).toContain("therapy_counselling");
  });

  it("contains religious_activities", () => {
    const cats = CONSENT_CATEGORIES.map((c) => c.category);
    expect(cats).toContain("religious_activities");
  });

  it("contains contact_arrangements", () => {
    const cats = CONSENT_CATEGORIES.map((c) => c.category);
    expect(cats).toContain("contact_arrangements");
  });

  it("contains research_participation", () => {
    const cats = CONSENT_CATEGORIES.map((c) => c.category);
    expect(cats).toContain("research_participation");
  });

  it("contains other", () => {
    const cats = CONSENT_CATEGORIES.map((c) => c.category);
    expect(cats).toContain("other");
  });
});

// ── CONSENT_STATUSES ────────────────────────────────────────────────────

describe("CONSENT_STATUSES", () => {
  it("has exactly 6 entries", () => {
    expect(CONSENT_STATUSES).toHaveLength(6);
  });

  it("has unique status values", () => {
    const statuses = CONSENT_STATUSES.map((s) => s.status);
    expect(new Set(statuses).size).toBe(statuses.length);
  });

  it("every entry has a non-empty label", () => {
    for (const entry of CONSENT_STATUSES) {
      expect(entry.label.length).toBeGreaterThan(0);
    }
  });

  it("every entry has a non-empty status", () => {
    for (const entry of CONSENT_STATUSES) {
      expect(entry.status.length).toBeGreaterThan(0);
    }
  });

  it("contains granted", () => {
    expect(CONSENT_STATUSES.map((s) => s.status)).toContain("granted");
  });

  it("contains refused", () => {
    expect(CONSENT_STATUSES.map((s) => s.status)).toContain("refused");
  });

  it("contains withdrawn", () => {
    expect(CONSENT_STATUSES.map((s) => s.status)).toContain("withdrawn");
  });

  it("contains expired", () => {
    expect(CONSENT_STATUSES.map((s) => s.status)).toContain("expired");
  });

  it("contains pending", () => {
    expect(CONSENT_STATUSES.map((s) => s.status)).toContain("pending");
  });

  it("contains not_applicable", () => {
    expect(CONSENT_STATUSES.map((s) => s.status)).toContain("not_applicable");
  });
});

// ── CONSENT_GIVEN_BY ────────────────────────────────────────────────────

describe("CONSENT_GIVEN_BY", () => {
  it("has exactly 8 entries", () => {
    expect(CONSENT_GIVEN_BY).toHaveLength(8);
  });

  it("has unique givenBy values", () => {
    const given = CONSENT_GIVEN_BY.map((g) => g.givenBy);
    expect(new Set(given).size).toBe(given.length);
  });

  it("every entry has a non-empty label", () => {
    for (const entry of CONSENT_GIVEN_BY) {
      expect(entry.label.length).toBeGreaterThan(0);
    }
  });

  it("every entry has a non-empty givenBy", () => {
    for (const entry of CONSENT_GIVEN_BY) {
      expect(entry.givenBy.length).toBeGreaterThan(0);
    }
  });

  it("contains parent_mother", () => {
    expect(CONSENT_GIVEN_BY.map((g) => g.givenBy)).toContain("parent_mother");
  });

  it("contains parent_father", () => {
    expect(CONSENT_GIVEN_BY.map((g) => g.givenBy)).toContain("parent_father");
  });

  it("contains local_authority", () => {
    expect(CONSENT_GIVEN_BY.map((g) => g.givenBy)).toContain("local_authority");
  });

  it("contains young_person", () => {
    expect(CONSENT_GIVEN_BY.map((g) => g.givenBy)).toContain("young_person");
  });

  it("contains guardian", () => {
    expect(CONSENT_GIVEN_BY.map((g) => g.givenBy)).toContain("guardian");
  });

  it("contains court_order", () => {
    expect(CONSENT_GIVEN_BY.map((g) => g.givenBy)).toContain("court_order");
  });

  it("contains social_worker", () => {
    expect(CONSENT_GIVEN_BY.map((g) => g.givenBy)).toContain("social_worker");
  });

  it("contains other", () => {
    expect(CONSENT_GIVEN_BY.map((g) => g.givenBy)).toContain("other");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. computeConsentMetrics
// ═══════════════════════════════════════════════════════════════════════════

describe("computeConsentMetrics", () => {
  // ── Empty array ───────────────────────────────────────────────────────

  it("returns zero totals for empty array", () => {
    const m = computeConsentMetrics([], 0, now);
    expect(m.total_records).toBe(0);
  });

  it("returns zero granted_count for empty array", () => {
    const m = computeConsentMetrics([], 0, now);
    expect(m.granted_count).toBe(0);
  });

  it("returns zero refused_count for empty array", () => {
    const m = computeConsentMetrics([], 0, now);
    expect(m.refused_count).toBe(0);
  });

  it("returns zero pending_count for empty array", () => {
    const m = computeConsentMetrics([], 0, now);
    expect(m.pending_count).toBe(0);
  });

  it("returns zero expired_count for empty array", () => {
    const m = computeConsentMetrics([], 0, now);
    expect(m.expired_count).toBe(0);
  });

  it("returns zero withdrawn_count for empty array", () => {
    const m = computeConsentMetrics([], 0, now);
    expect(m.withdrawn_count).toBe(0);
  });

  it("returns zero consent_coverage for empty array", () => {
    const m = computeConsentMetrics([], 0, now);
    expect(m.consent_coverage).toBe(0);
  });

  it("returns zero evidence_on_file_rate for empty array", () => {
    const m = computeConsentMetrics([], 0, now);
    expect(m.evidence_on_file_rate).toBe(0);
  });

  it("returns zero expiring_soon for empty array", () => {
    const m = computeConsentMetrics([], 0, now);
    expect(m.expiring_soon).toBe(0);
  });

  it("returns zero medical_consent_rate for empty array", () => {
    const m = computeConsentMetrics([], 0, now);
    expect(m.medical_consent_rate).toBe(0);
  });

  it("returns zero emergency_consent_rate for empty array", () => {
    const m = computeConsentMetrics([], 0, now);
    expect(m.emergency_consent_rate).toBe(0);
  });

  it("returns zero photo_consent_granted for empty array", () => {
    const m = computeConsentMetrics([], 0, now);
    expect(m.photo_consent_granted).toBe(0);
  });

  it("returns empty by_category for empty array", () => {
    const m = computeConsentMetrics([], 0, now);
    expect(Object.keys(m.by_category)).toHaveLength(0);
  });

  it("returns empty by_status for empty array", () => {
    const m = computeConsentMetrics([], 0, now);
    expect(Object.keys(m.by_status)).toHaveLength(0);
  });

  it("returns empty by_given_by for empty array", () => {
    const m = computeConsentMetrics([], 0, now);
    expect(Object.keys(m.by_given_by)).toHaveLength(0);
  });

  // ── Single record ─────────────────────────────────────────────────────

  it("counts a single granted record", () => {
    const records = [makeRecord({ status: "granted" })];
    const m = computeConsentMetrics(records, 1, now);
    expect(m.total_records).toBe(1);
    expect(m.granted_count).toBe(1);
  });

  it("counts a single refused record", () => {
    const records = [makeRecord({ status: "refused" })];
    const m = computeConsentMetrics(records, 1, now);
    expect(m.refused_count).toBe(1);
    expect(m.granted_count).toBe(0);
  });

  it("counts a single pending record", () => {
    const records = [makeRecord({ status: "pending" })];
    const m = computeConsentMetrics(records, 1, now);
    expect(m.pending_count).toBe(1);
  });

  it("counts a single expired record", () => {
    const records = [makeRecord({ status: "expired" })];
    const m = computeConsentMetrics(records, 1, now);
    expect(m.expired_count).toBe(1);
  });

  it("counts a single withdrawn record", () => {
    const records = [makeRecord({ status: "withdrawn" })];
    const m = computeConsentMetrics(records, 1, now);
    expect(m.withdrawn_count).toBe(1);
  });

  it("counts a single not_applicable record as zero for granted/refused/pending/expired/withdrawn", () => {
    const records = [makeRecord({ status: "not_applicable" })];
    const m = computeConsentMetrics(records, 1, now);
    expect(m.granted_count).toBe(0);
    expect(m.refused_count).toBe(0);
    expect(m.pending_count).toBe(0);
    expect(m.expired_count).toBe(0);
    expect(m.withdrawn_count).toBe(0);
  });

  // ── Multiple records with mixed statuses ──────────────────────────────

  it("counts multiple statuses correctly", () => {
    const records = [
      makeRecord({ status: "granted" }),
      makeRecord({ status: "granted" }),
      makeRecord({ status: "refused" }),
      makeRecord({ status: "pending" }),
      makeRecord({ status: "expired" }),
      makeRecord({ status: "withdrawn" }),
    ];
    const m = computeConsentMetrics(records, 4, now);
    expect(m.total_records).toBe(6);
    expect(m.granted_count).toBe(2);
    expect(m.refused_count).toBe(1);
    expect(m.pending_count).toBe(1);
    expect(m.expired_count).toBe(1);
    expect(m.withdrawn_count).toBe(1);
  });

  // ── Coverage calculations ─────────────────────────────────────────────

  it("calculates 100% coverage when all children have granted consent", () => {
    const records = [
      makeRecord({ status: "granted", child_id: "c1" }),
      makeRecord({ status: "granted", child_id: "c2" }),
    ];
    const m = computeConsentMetrics(records, 2, now);
    expect(m.consent_coverage).toBe(100);
  });

  it("calculates 50% coverage when half of children have granted consent", () => {
    const records = [
      makeRecord({ status: "granted", child_id: "c1" }),
      makeRecord({ status: "refused", child_id: "c2" }),
    ];
    const m = computeConsentMetrics(records, 2, now);
    expect(m.consent_coverage).toBe(50);
  });

  it("calculates 0% coverage when no children have granted consent", () => {
    const records = [
      makeRecord({ status: "refused", child_id: "c1" }),
      makeRecord({ status: "pending", child_id: "c2" }),
    ];
    const m = computeConsentMetrics(records, 2, now);
    expect(m.consent_coverage).toBe(0);
  });

  it("handles zero totalChildren for coverage", () => {
    const m = computeConsentMetrics([], 0, now);
    expect(m.consent_coverage).toBe(0);
  });

  it("does not double-count same child for coverage", () => {
    const records = [
      makeRecord({ status: "granted", child_id: "c1", category: "medical_treatment" }),
      makeRecord({ status: "granted", child_id: "c1", category: "photographs" }),
    ];
    const m = computeConsentMetrics(records, 2, now);
    expect(m.children_with_consent).toBe(1);
    expect(m.consent_coverage).toBe(50);
  });

  it("calculates fractional coverage correctly (1 of 3 = 33.3%)", () => {
    const records = [makeRecord({ status: "granted", child_id: "c1" })];
    const m = computeConsentMetrics(records, 3, now);
    expect(m.consent_coverage).toBe(33.3);
  });

  // ── Evidence on file rate ─────────────────────────────────────────────

  it("calculates 100% evidence_on_file_rate when all have evidence", () => {
    const records = [
      makeRecord({ evidence_on_file: true }),
      makeRecord({ evidence_on_file: true }),
    ];
    const m = computeConsentMetrics(records, 2, now);
    expect(m.evidence_on_file_rate).toBe(100);
  });

  it("calculates 50% evidence_on_file_rate when half have evidence", () => {
    const records = [
      makeRecord({ evidence_on_file: true }),
      makeRecord({ evidence_on_file: false }),
    ];
    const m = computeConsentMetrics(records, 2, now);
    expect(m.evidence_on_file_rate).toBe(50);
  });

  it("calculates 0% evidence_on_file_rate when none have evidence", () => {
    const records = [
      makeRecord({ evidence_on_file: false }),
      makeRecord({ evidence_on_file: false }),
    ];
    const m = computeConsentMetrics(records, 2, now);
    expect(m.evidence_on_file_rate).toBe(0);
  });

  it("returns 0% evidence_on_file_rate for empty array", () => {
    const m = computeConsentMetrics([], 0, now);
    expect(m.evidence_on_file_rate).toBe(0);
  });

  // ── Expiring soon (within 30 days) ────────────────────────────────────

  it("detects a consent expiring within 30 days", () => {
    const records = [
      makeRecord({
        status: "granted",
        expiry_date: futureDate(15),
      }),
    ];
    const m = computeConsentMetrics(records, 1, now);
    expect(m.expiring_soon).toBe(1);
  });

  it("does not count consent expiring in 31 days as expiring soon", () => {
    const records = [
      makeRecord({
        status: "granted",
        expiry_date: futureDate(31),
      }),
    ];
    const m = computeConsentMetrics(records, 1, now);
    expect(m.expiring_soon).toBe(0);
  });

  it("does not count already expired consent as expiring soon", () => {
    const records = [
      makeRecord({
        status: "granted",
        expiry_date: pastDate(1),
      }),
    ];
    const m = computeConsentMetrics(records, 1, now);
    expect(m.expiring_soon).toBe(0);
  });

  it("does not count refused consent as expiring soon even with near expiry", () => {
    const records = [
      makeRecord({
        status: "refused",
        expiry_date: futureDate(5),
      }),
    ];
    const m = computeConsentMetrics(records, 1, now);
    expect(m.expiring_soon).toBe(0);
  });

  it("does not count consent with null expiry_date as expiring soon", () => {
    const records = [
      makeRecord({
        status: "granted",
        expiry_date: null,
      }),
    ];
    const m = computeConsentMetrics(records, 1, now);
    expect(m.expiring_soon).toBe(0);
  });

  it("counts consent expiring on exactly day 30 as expiring soon", () => {
    const records = [
      makeRecord({
        status: "granted",
        expiry_date: futureDate(30),
      }),
    ];
    const m = computeConsentMetrics(records, 1, now);
    expect(m.expiring_soon).toBe(1);
  });

  it("counts consent expiring today as expiring soon", () => {
    const records = [
      makeRecord({
        status: "granted",
        expiry_date: futureDate(0),
      }),
    ];
    const m = computeConsentMetrics(records, 1, now);
    expect(m.expiring_soon).toBe(1);
  });

  it("counts multiple expiring soon records", () => {
    const records = [
      makeRecord({ status: "granted", expiry_date: futureDate(5) }),
      makeRecord({ status: "granted", expiry_date: futureDate(10) }),
      makeRecord({ status: "granted", expiry_date: futureDate(29) }),
      makeRecord({ status: "granted", expiry_date: futureDate(40) }),
    ];
    const m = computeConsentMetrics(records, 2, now);
    expect(m.expiring_soon).toBe(3);
  });

  // ── Medical consent rate ──────────────────────────────────────────────

  it("calculates 100% medical consent rate when all children have medical consent", () => {
    const records = [
      makeRecord({ category: "medical_treatment", status: "granted", child_id: "c1" }),
      makeRecord({ category: "medical_treatment", status: "granted", child_id: "c2" }),
    ];
    const m = computeConsentMetrics(records, 2, now);
    expect(m.medical_consent_rate).toBe(100);
  });

  it("calculates 50% medical consent rate when half have medical consent", () => {
    const records = [
      makeRecord({ category: "medical_treatment", status: "granted", child_id: "c1" }),
    ];
    const m = computeConsentMetrics(records, 2, now);
    expect(m.medical_consent_rate).toBe(50);
  });

  it("calculates 0% medical consent rate when none have medical consent", () => {
    const records = [
      makeRecord({ category: "photographs", status: "granted", child_id: "c1" }),
    ];
    const m = computeConsentMetrics(records, 2, now);
    expect(m.medical_consent_rate).toBe(0);
  });

  it("does not count refused medical_treatment for medical rate", () => {
    const records = [
      makeRecord({ category: "medical_treatment", status: "refused", child_id: "c1" }),
    ];
    const m = computeConsentMetrics(records, 1, now);
    expect(m.medical_consent_rate).toBe(0);
  });

  it("does not double-count same child for medical rate", () => {
    const records = [
      makeRecord({ category: "medical_treatment", status: "granted", child_id: "c1" }),
      makeRecord({ category: "medical_treatment", status: "granted", child_id: "c1" }),
    ];
    const m = computeConsentMetrics(records, 2, now);
    expect(m.medical_consent_rate).toBe(50);
  });

  it("handles zero totalChildren for medical rate", () => {
    const m = computeConsentMetrics([], 0, now);
    expect(m.medical_consent_rate).toBe(0);
  });

  // ── Emergency consent rate ────────────────────────────────────────────

  it("calculates 100% emergency consent rate when all children covered", () => {
    const records = [
      makeRecord({ category: "emergency_medical", status: "granted", child_id: "c1" }),
      makeRecord({ category: "emergency_medical", status: "granted", child_id: "c2" }),
    ];
    const m = computeConsentMetrics(records, 2, now);
    expect(m.emergency_consent_rate).toBe(100);
  });

  it("calculates 0% emergency consent rate when no children have emergency consent", () => {
    const records = [
      makeRecord({ category: "medical_treatment", status: "granted", child_id: "c1" }),
    ];
    const m = computeConsentMetrics(records, 2, now);
    expect(m.emergency_consent_rate).toBe(0);
  });

  it("does not count pending emergency consent for rate", () => {
    const records = [
      makeRecord({ category: "emergency_medical", status: "pending", child_id: "c1" }),
    ];
    const m = computeConsentMetrics(records, 1, now);
    expect(m.emergency_consent_rate).toBe(0);
  });

  it("handles zero totalChildren for emergency rate", () => {
    const m = computeConsentMetrics([], 0, now);
    expect(m.emergency_consent_rate).toBe(0);
  });

  // ── Photo consent count ───────────────────────────────────────────────

  it("counts granted photograph consents", () => {
    const records = [
      makeRecord({ category: "photographs", status: "granted" }),
      makeRecord({ category: "photographs", status: "granted" }),
    ];
    const m = computeConsentMetrics(records, 2, now);
    expect(m.photo_consent_granted).toBe(2);
  });

  it("does not count refused photograph consent", () => {
    const records = [
      makeRecord({ category: "photographs", status: "refused" }),
    ];
    const m = computeConsentMetrics(records, 1, now);
    expect(m.photo_consent_granted).toBe(0);
  });

  it("does not count non-photograph granted consent as photo consent", () => {
    const records = [
      makeRecord({ category: "medical_treatment", status: "granted" }),
    ];
    const m = computeConsentMetrics(records, 1, now);
    expect(m.photo_consent_granted).toBe(0);
  });

  it("returns zero photo_consent_granted for empty array", () => {
    const m = computeConsentMetrics([], 0, now);
    expect(m.photo_consent_granted).toBe(0);
  });

  // ── by_category breakdown ─────────────────────────────────────────────

  it("groups records by category", () => {
    const records = [
      makeRecord({ category: "medical_treatment" }),
      makeRecord({ category: "medical_treatment" }),
      makeRecord({ category: "photographs" }),
    ];
    const m = computeConsentMetrics(records, 2, now);
    expect(m.by_category["medical_treatment"]).toBe(2);
    expect(m.by_category["photographs"]).toBe(1);
  });

  it("does not include categories with zero records in by_category", () => {
    const records = [makeRecord({ category: "medical_treatment" })];
    const m = computeConsentMetrics(records, 1, now);
    expect(m.by_category["photographs"]).toBeUndefined();
  });

  it("counts all categories present across records", () => {
    const records = [
      makeRecord({ category: "medical_treatment" }),
      makeRecord({ category: "dental_treatment" }),
      makeRecord({ category: "immunisation" }),
      makeRecord({ category: "emergency_medical" }),
      makeRecord({ category: "photographs" }),
    ];
    const m = computeConsentMetrics(records, 3, now);
    expect(Object.keys(m.by_category)).toHaveLength(5);
  });

  // ── by_status breakdown ───────────────────────────────────────────────

  it("groups records by status", () => {
    const records = [
      makeRecord({ status: "granted" }),
      makeRecord({ status: "granted" }),
      makeRecord({ status: "refused" }),
      makeRecord({ status: "pending" }),
    ];
    const m = computeConsentMetrics(records, 2, now);
    expect(m.by_status["granted"]).toBe(2);
    expect(m.by_status["refused"]).toBe(1);
    expect(m.by_status["pending"]).toBe(1);
  });

  it("does not include statuses with zero records in by_status", () => {
    const records = [makeRecord({ status: "granted" })];
    const m = computeConsentMetrics(records, 1, now);
    expect(m.by_status["refused"]).toBeUndefined();
  });

  it("counts all statuses present across records", () => {
    const records = [
      makeRecord({ status: "granted" }),
      makeRecord({ status: "refused" }),
      makeRecord({ status: "pending" }),
      makeRecord({ status: "expired" }),
      makeRecord({ status: "withdrawn" }),
      makeRecord({ status: "not_applicable" }),
    ];
    const m = computeConsentMetrics(records, 3, now);
    expect(Object.keys(m.by_status)).toHaveLength(6);
  });

  // ── by_given_by breakdown ─────────────────────────────────────────────

  it("groups records by given_by", () => {
    const records = [
      makeRecord({ given_by: "parent_mother" }),
      makeRecord({ given_by: "parent_mother" }),
      makeRecord({ given_by: "local_authority" }),
    ];
    const m = computeConsentMetrics(records, 2, now);
    expect(m.by_given_by["parent_mother"]).toBe(2);
    expect(m.by_given_by["local_authority"]).toBe(1);
  });

  it("does not include given_by values with zero records", () => {
    const records = [makeRecord({ given_by: "parent_mother" })];
    const m = computeConsentMetrics(records, 1, now);
    expect(m.by_given_by["court_order"]).toBeUndefined();
  });

  it("counts all given_by values present across records", () => {
    const records = [
      makeRecord({ given_by: "parent_mother" }),
      makeRecord({ given_by: "parent_father" }),
      makeRecord({ given_by: "local_authority" }),
      makeRecord({ given_by: "young_person" }),
    ];
    const m = computeConsentMetrics(records, 3, now);
    expect(Object.keys(m.by_given_by)).toHaveLength(4);
  });

  // ── Expired-by-date detection ─────────────────────────────────────────

  it("detects granted consent with past expiry_date as expired", () => {
    const records = [
      makeRecord({
        status: "granted",
        expiry_date: pastDate(10),
      }),
    ];
    const m = computeConsentMetrics(records, 1, now);
    expect(m.expired_count).toBe(1);
  });

  it("does not count granted consent with future expiry as expired", () => {
    const records = [
      makeRecord({
        status: "granted",
        expiry_date: futureDate(30),
      }),
    ];
    const m = computeConsentMetrics(records, 1, now);
    expect(m.expired_count).toBe(0);
  });

  it("does not count refused consent with past expiry as additionally expired", () => {
    const records = [
      makeRecord({
        status: "refused",
        expiry_date: pastDate(10),
      }),
    ];
    const m = computeConsentMetrics(records, 1, now);
    expect(m.expired_count).toBe(0);
  });

  it("sums explicitly expired and expired-by-date records", () => {
    const records = [
      makeRecord({ status: "expired" }),
      makeRecord({ status: "granted", expiry_date: pastDate(5) }),
    ];
    const m = computeConsentMetrics(records, 2, now);
    expect(m.expired_count).toBe(2);
  });

  it("does not count granted consent with null expiry as expired-by-date", () => {
    const records = [
      makeRecord({ status: "granted", expiry_date: null }),
    ];
    const m = computeConsentMetrics(records, 1, now);
    expect(m.expired_count).toBe(0);
  });

  // ── Children with consent ─────────────────────────────────────────────

  it("counts unique children with granted consent", () => {
    const records = [
      makeRecord({ status: "granted", child_id: "c1" }),
      makeRecord({ status: "granted", child_id: "c2" }),
      makeRecord({ status: "granted", child_id: "c1" }),
    ];
    const m = computeConsentMetrics(records, 3, now);
    expect(m.children_with_consent).toBe(2);
  });

  it("does not count children with only refused consent", () => {
    const records = [
      makeRecord({ status: "refused", child_id: "c1" }),
    ];
    const m = computeConsentMetrics(records, 1, now);
    expect(m.children_with_consent).toBe(0);
  });

  it("returns zero children_with_consent for empty array", () => {
    const m = computeConsentMetrics([], 0, now);
    expect(m.children_with_consent).toBe(0);
  });

  // ── Large realistic dataset ───────────────────────────────────────────

  it("handles a large mixed dataset correctly", () => {
    const records: ConsentRecord[] = [];
    // 3 children, each with multiple consent types
    for (const childId of ["c1", "c2", "c3"]) {
      records.push(
        makeRecord({ child_id: childId, category: "medical_treatment", status: "granted", evidence_on_file: true }),
        makeRecord({ child_id: childId, category: "emergency_medical", status: "granted", evidence_on_file: true }),
        makeRecord({ child_id: childId, category: "photographs", status: "granted", evidence_on_file: false }),
      );
    }
    // Add some pending/refused
    records.push(
      makeRecord({ child_id: "c1", category: "social_media", status: "pending", evidence_on_file: false }),
      makeRecord({ child_id: "c2", category: "outings_trips", status: "refused", evidence_on_file: true }),
    );

    const m = computeConsentMetrics(records, 3, now);
    expect(m.total_records).toBe(11);
    expect(m.granted_count).toBe(9);
    expect(m.pending_count).toBe(1);
    expect(m.refused_count).toBe(1);
    expect(m.children_with_consent).toBe(3);
    expect(m.consent_coverage).toBe(100);
    expect(m.medical_consent_rate).toBe(100);
    expect(m.emergency_consent_rate).toBe(100);
    expect(m.photo_consent_granted).toBe(3);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. identifyConsentAlerts
// ═══════════════════════════════════════════════════════════════════════════

describe("identifyConsentAlerts", () => {
  // ── No alerts when everything clean ───────────────────────────────────

  it("returns no alerts for empty records and zero children", () => {
    const alerts = identifyConsentAlerts([], 0, now);
    expect(alerts).toHaveLength(0);
  });

  it("returns no alerts when all children have emergency consent and everything is clean", () => {
    const records = [
      makeRecord({
        child_id: "c1",
        category: "emergency_medical",
        status: "granted",
        evidence_on_file: true,
        expiry_date: futureDate(60),
      }),
      makeRecord({
        child_id: "c2",
        category: "emergency_medical",
        status: "granted",
        evidence_on_file: true,
        expiry_date: futureDate(90),
      }),
    ];
    const alerts = identifyConsentAlerts(records, 2, now);
    expect(alerts).toHaveLength(0);
  });

  // ── No emergency consent (critical) ───────────────────────────────────

  it("raises critical alert when no children have emergency consent", () => {
    const alerts = identifyConsentAlerts([], 2, now);
    const emergencyAlerts = alerts.filter((a) => a.type === "no_emergency_consent");
    expect(emergencyAlerts).toHaveLength(1);
    expect(emergencyAlerts[0].severity).toBe("critical");
  });

  it("raises critical alert when some children lack emergency consent", () => {
    const records = [
      makeRecord({ child_id: "c1", category: "emergency_medical", status: "granted" }),
    ];
    const alerts = identifyConsentAlerts(records, 3, now);
    const emergencyAlerts = alerts.filter((a) => a.type === "no_emergency_consent");
    expect(emergencyAlerts).toHaveLength(1);
    expect(emergencyAlerts[0].severity).toBe("critical");
  });

  it("includes correct gap count in emergency alert message for 1 child", () => {
    const alerts = identifyConsentAlerts([], 1, now);
    const alert = alerts.find((a) => a.type === "no_emergency_consent");
    expect(alert?.message).toContain("1 child does");
  });

  it("includes correct gap count in emergency alert message for multiple children", () => {
    const alerts = identifyConsentAlerts([], 3, now);
    const alert = alerts.find((a) => a.type === "no_emergency_consent");
    expect(alert?.message).toContain("3 children do");
  });

  it("does not raise emergency alert when all children have emergency consent", () => {
    const records = [
      makeRecord({ child_id: "c1", category: "emergency_medical", status: "granted", evidence_on_file: true }),
      makeRecord({ child_id: "c2", category: "emergency_medical", status: "granted", evidence_on_file: true }),
    ];
    const alerts = identifyConsentAlerts(records, 2, now);
    const emergencyAlerts = alerts.filter((a) => a.type === "no_emergency_consent");
    expect(emergencyAlerts).toHaveLength(0);
  });

  it("does not count refused emergency consent as coverage", () => {
    const records = [
      makeRecord({ child_id: "c1", category: "emergency_medical", status: "refused" }),
    ];
    const alerts = identifyConsentAlerts(records, 1, now);
    const emergencyAlerts = alerts.filter((a) => a.type === "no_emergency_consent");
    expect(emergencyAlerts).toHaveLength(1);
  });

  it("emergency alert has id 'emergency_gap'", () => {
    const alerts = identifyConsentAlerts([], 1, now);
    const alert = alerts.find((a) => a.type === "no_emergency_consent");
    expect(alert?.id).toBe("emergency_gap");
  });

  // ── Consent expiring within 14 days (medium) ─────────────────────────

  it("raises medium alert for consent expiring within 14 days", () => {
    const record = makeRecord({
      status: "granted",
      expiry_date: futureDate(7),
      category: "outings_trips",
      child_name: "Jamie",
      evidence_on_file: true,
    });
    const alerts = identifyConsentAlerts([record], 0, now);
    const expiringAlerts = alerts.filter((a) => a.type === "consent_expiring");
    expect(expiringAlerts).toHaveLength(1);
    expect(expiringAlerts[0].severity).toBe("medium");
  });

  it("does not raise expiring alert for consent expiring in 15 days", () => {
    const record = makeRecord({
      status: "granted",
      expiry_date: futureDate(15),
      evidence_on_file: true,
    });
    const alerts = identifyConsentAlerts([record], 0, now);
    const expiringAlerts = alerts.filter((a) => a.type === "consent_expiring");
    expect(expiringAlerts).toHaveLength(0);
  });

  it("raises expiring alert for consent expiring on exactly day 14", () => {
    const record = makeRecord({
      status: "granted",
      expiry_date: futureDate(14),
      evidence_on_file: true,
    });
    const alerts = identifyConsentAlerts([record], 0, now);
    const expiringAlerts = alerts.filter((a) => a.type === "consent_expiring");
    expect(expiringAlerts).toHaveLength(1);
  });

  it("raises expiring alert for consent expiring today", () => {
    const record = makeRecord({
      status: "granted",
      expiry_date: futureDate(0),
      evidence_on_file: true,
    });
    const alerts = identifyConsentAlerts([record], 0, now);
    const expiringAlerts = alerts.filter((a) => a.type === "consent_expiring");
    expect(expiringAlerts).toHaveLength(1);
  });

  it("does not raise expiring alert for refused consent near expiry", () => {
    const record = makeRecord({
      status: "refused",
      expiry_date: futureDate(5),
      evidence_on_file: true,
    });
    const alerts = identifyConsentAlerts([record], 0, now);
    const expiringAlerts = alerts.filter((a) => a.type === "consent_expiring");
    expect(expiringAlerts).toHaveLength(0);
  });

  it("expiring alert message includes child name", () => {
    const record = makeRecord({
      status: "granted",
      expiry_date: futureDate(7),
      child_name: "Taylor",
      category: "photographs",
      evidence_on_file: true,
    });
    const alerts = identifyConsentAlerts([record], 0, now);
    const alert = alerts.find((a) => a.type === "consent_expiring");
    expect(alert?.message).toContain("Taylor");
  });

  it("expiring alert message includes category with underscores replaced", () => {
    const record = makeRecord({
      status: "granted",
      expiry_date: futureDate(7),
      category: "outings_trips",
      evidence_on_file: true,
    });
    const alerts = identifyConsentAlerts([record], 0, now);
    const alert = alerts.find((a) => a.type === "consent_expiring");
    expect(alert?.message).toContain("outings trips");
  });

  it("expiring alert uses the record id", () => {
    const record = makeRecord({
      id: "rec-123",
      status: "granted",
      expiry_date: futureDate(7),
      evidence_on_file: true,
    });
    const alerts = identifyConsentAlerts([record], 0, now);
    const alert = alerts.find((a) => a.type === "consent_expiring");
    expect(alert?.id).toBe("rec-123");
  });

  it("raises multiple expiring alerts for multiple records", () => {
    const records = [
      makeRecord({ status: "granted", expiry_date: futureDate(5), id: "r1", evidence_on_file: true }),
      makeRecord({ status: "granted", expiry_date: futureDate(10), id: "r2", evidence_on_file: true }),
      makeRecord({ status: "granted", expiry_date: futureDate(20), id: "r3", evidence_on_file: true }),
    ];
    const alerts = identifyConsentAlerts(records, 0, now);
    const expiringAlerts = alerts.filter((a) => a.type === "consent_expiring");
    expect(expiringAlerts).toHaveLength(2);
  });

  // ── Consent expired but still granted (high) ─────────────────────────

  it("raises high alert for granted consent that has expired by date", () => {
    const record = makeRecord({
      status: "granted",
      expiry_date: pastDate(10),
      evidence_on_file: true,
    });
    const alerts = identifyConsentAlerts([record], 0, now);
    const expiredAlerts = alerts.filter((a) => a.type === "consent_expired");
    expect(expiredAlerts).toHaveLength(1);
    expect(expiredAlerts[0].severity).toBe("high");
  });

  it("does not raise expired alert for granted consent with future expiry", () => {
    const record = makeRecord({
      status: "granted",
      expiry_date: futureDate(30),
      evidence_on_file: true,
    });
    const alerts = identifyConsentAlerts([record], 0, now);
    const expiredAlerts = alerts.filter((a) => a.type === "consent_expired");
    expect(expiredAlerts).toHaveLength(0);
  });

  it("does not raise expired alert for status=expired (already correctly marked)", () => {
    const record = makeRecord({
      status: "expired",
      expiry_date: pastDate(10),
      evidence_on_file: true,
    });
    const alerts = identifyConsentAlerts([record], 0, now);
    const expiredAlerts = alerts.filter((a) => a.type === "consent_expired");
    expect(expiredAlerts).toHaveLength(0);
  });

  it("expired alert message includes 'do not proceed without renewed consent'", () => {
    const record = makeRecord({
      status: "granted",
      expiry_date: pastDate(5),
      evidence_on_file: true,
    });
    const alerts = identifyConsentAlerts([record], 0, now);
    const alert = alerts.find((a) => a.type === "consent_expired");
    expect(alert?.message).toContain("do not proceed without renewed consent");
  });

  it("expired alert message includes child name", () => {
    const record = makeRecord({
      status: "granted",
      expiry_date: pastDate(3),
      child_name: "Sam",
      evidence_on_file: true,
    });
    const alerts = identifyConsentAlerts([record], 0, now);
    const alert = alerts.find((a) => a.type === "consent_expired");
    expect(alert?.message).toContain("Sam");
  });

  it("expired alert uses the record id", () => {
    const record = makeRecord({
      id: "rec-expired-1",
      status: "granted",
      expiry_date: pastDate(5),
      evidence_on_file: true,
    });
    const alerts = identifyConsentAlerts([record], 0, now);
    const alert = alerts.find((a) => a.type === "consent_expired");
    expect(alert?.id).toBe("rec-expired-1");
  });

  // ── Pending consents (high for medical, medium for others) ────────────

  it("raises high alert for pending medical_treatment consent", () => {
    const record = makeRecord({
      status: "pending",
      category: "medical_treatment",
      evidence_on_file: true,
    });
    const alerts = identifyConsentAlerts([record], 0, now);
    const pendingAlerts = alerts.filter((a) => a.type === "consent_pending");
    expect(pendingAlerts).toHaveLength(1);
    expect(pendingAlerts[0].severity).toBe("high");
  });

  it("raises high alert for pending emergency_medical consent", () => {
    const record = makeRecord({
      status: "pending",
      category: "emergency_medical",
      evidence_on_file: true,
    });
    const alerts = identifyConsentAlerts([record], 0, now);
    const pendingAlerts = alerts.filter((a) => a.type === "consent_pending");
    expect(pendingAlerts).toHaveLength(1);
    expect(pendingAlerts[0].severity).toBe("high");
  });

  it("raises medium alert for pending photographs consent", () => {
    const record = makeRecord({
      status: "pending",
      category: "photographs",
      evidence_on_file: true,
    });
    const alerts = identifyConsentAlerts([record], 0, now);
    const pendingAlerts = alerts.filter((a) => a.type === "consent_pending");
    expect(pendingAlerts).toHaveLength(1);
    expect(pendingAlerts[0].severity).toBe("medium");
  });

  it("raises medium alert for pending outings_trips consent", () => {
    const record = makeRecord({
      status: "pending",
      category: "outings_trips",
      evidence_on_file: true,
    });
    const alerts = identifyConsentAlerts([record], 0, now);
    const pendingAlerts = alerts.filter((a) => a.type === "consent_pending");
    expect(pendingAlerts).toHaveLength(1);
    expect(pendingAlerts[0].severity).toBe("medium");
  });

  it("raises medium alert for pending information_sharing consent", () => {
    const record = makeRecord({
      status: "pending",
      category: "information_sharing",
      evidence_on_file: true,
    });
    const alerts = identifyConsentAlerts([record], 0, now);
    const pendingAlerts = alerts.filter((a) => a.type === "consent_pending");
    expect(pendingAlerts).toHaveLength(1);
    expect(pendingAlerts[0].severity).toBe("medium");
  });

  it("pending alert message includes 'chase with' and given_by_name", () => {
    const record = makeRecord({
      status: "pending",
      category: "dental_treatment",
      given_by_name: "Mrs. Jones",
      evidence_on_file: true,
    });
    const alerts = identifyConsentAlerts([record], 0, now);
    const alert = alerts.find((a) => a.type === "consent_pending");
    expect(alert?.message).toContain("chase with Mrs. Jones");
  });

  it("pending alert message includes child name", () => {
    const record = makeRecord({
      status: "pending",
      category: "dental_treatment",
      child_name: "Riley",
      evidence_on_file: true,
    });
    const alerts = identifyConsentAlerts([record], 0, now);
    const alert = alerts.find((a) => a.type === "consent_pending");
    expect(alert?.message).toContain("Riley");
  });

  it("pending alert uses the record id", () => {
    const record = makeRecord({
      id: "rec-pending-1",
      status: "pending",
      category: "dental_treatment",
      evidence_on_file: true,
    });
    const alerts = identifyConsentAlerts([record], 0, now);
    const alert = alerts.find((a) => a.type === "consent_pending");
    expect(alert?.id).toBe("rec-pending-1");
  });

  it("does not raise pending alert for granted consent", () => {
    const record = makeRecord({
      status: "granted",
      evidence_on_file: true,
    });
    const alerts = identifyConsentAlerts([record], 0, now);
    const pendingAlerts = alerts.filter((a) => a.type === "consent_pending");
    expect(pendingAlerts).toHaveLength(0);
  });

  it("raises multiple pending alerts for multiple pending records", () => {
    const records = [
      makeRecord({ status: "pending", category: "medical_treatment", id: "p1", evidence_on_file: true }),
      makeRecord({ status: "pending", category: "photographs", id: "p2", evidence_on_file: true }),
      makeRecord({ status: "pending", category: "outings_trips", id: "p3", evidence_on_file: true }),
    ];
    const alerts = identifyConsentAlerts(records, 0, now);
    const pendingAlerts = alerts.filter((a) => a.type === "consent_pending");
    expect(pendingAlerts).toHaveLength(3);
  });

  // ── No evidence on file (medium) ──────────────────────────────────────

  it("raises medium alert for granted consent without evidence on file", () => {
    const record = makeRecord({
      status: "granted",
      evidence_on_file: false,
      category: "emergency_medical",
      child_id: "c1",
    });
    // Need to provide emergency coverage so we isolate the evidence alert
    const alerts = identifyConsentAlerts([record], 1, now);
    const evidenceAlerts = alerts.filter((a) => a.type === "no_evidence");
    expect(evidenceAlerts).toHaveLength(1);
    expect(evidenceAlerts[0].severity).toBe("medium");
  });

  it("does not raise evidence alert for refused consent without evidence", () => {
    const record = makeRecord({
      status: "refused",
      evidence_on_file: false,
    });
    const alerts = identifyConsentAlerts([record], 0, now);
    const evidenceAlerts = alerts.filter((a) => a.type === "no_evidence");
    expect(evidenceAlerts).toHaveLength(0);
  });

  it("does not raise evidence alert for pending consent without evidence", () => {
    const record = makeRecord({
      status: "pending",
      evidence_on_file: false,
    });
    const alerts = identifyConsentAlerts([record], 0, now);
    const evidenceAlerts = alerts.filter((a) => a.type === "no_evidence");
    expect(evidenceAlerts).toHaveLength(0);
  });

  it("does not raise evidence alert for granted consent with evidence", () => {
    const record = makeRecord({
      status: "granted",
      evidence_on_file: true,
    });
    const alerts = identifyConsentAlerts([record], 0, now);
    const evidenceAlerts = alerts.filter((a) => a.type === "no_evidence");
    expect(evidenceAlerts).toHaveLength(0);
  });

  it("evidence alert message includes 'obtain signed form'", () => {
    const record = makeRecord({
      status: "granted",
      evidence_on_file: false,
      category: "emergency_medical",
      child_id: "c1",
    });
    const alerts = identifyConsentAlerts([record], 1, now);
    const alert = alerts.find((a) => a.type === "no_evidence");
    expect(alert?.message).toContain("obtain signed form");
  });

  it("evidence alert message includes child name", () => {
    const record = makeRecord({
      status: "granted",
      evidence_on_file: false,
      child_name: "Jordan",
      category: "emergency_medical",
      child_id: "c1",
    });
    const alerts = identifyConsentAlerts([record], 1, now);
    const alert = alerts.find((a) => a.type === "no_evidence");
    expect(alert?.message).toContain("Jordan");
  });

  it("evidence alert uses the record id", () => {
    const record = makeRecord({
      id: "rec-noevidence-1",
      status: "granted",
      evidence_on_file: false,
      category: "emergency_medical",
      child_id: "c1",
    });
    const alerts = identifyConsentAlerts([record], 1, now);
    const alert = alerts.find((a) => a.type === "no_evidence");
    expect(alert?.id).toBe("rec-noevidence-1");
  });

  it("raises multiple evidence alerts for multiple records without evidence", () => {
    const records = [
      makeRecord({ status: "granted", evidence_on_file: false, id: "r1", category: "emergency_medical", child_id: "c1" }),
      makeRecord({ status: "granted", evidence_on_file: false, id: "r2", category: "emergency_medical", child_id: "c2" }),
      makeRecord({ status: "granted", evidence_on_file: true, id: "r3", category: "emergency_medical", child_id: "c3" }),
    ];
    const alerts = identifyConsentAlerts(records, 3, now);
    const evidenceAlerts = alerts.filter((a) => a.type === "no_evidence");
    expect(evidenceAlerts).toHaveLength(2);
  });

  // ── Combined alert scenarios ──────────────────────────────────────────

  it("raises multiple alert types simultaneously", () => {
    const records = [
      // expired but still granted -> consent_expired
      makeRecord({
        id: "r1",
        status: "granted",
        expiry_date: pastDate(5),
        evidence_on_file: true,
        category: "medical_treatment",
        child_id: "c1",
      }),
      // expiring within 14 days -> consent_expiring
      makeRecord({
        id: "r2",
        status: "granted",
        expiry_date: futureDate(7),
        evidence_on_file: true,
        category: "photographs",
        child_id: "c1",
      }),
      // pending -> consent_pending
      makeRecord({
        id: "r3",
        status: "pending",
        evidence_on_file: true,
        category: "outings_trips",
        child_id: "c2",
      }),
      // no evidence -> no_evidence
      makeRecord({
        id: "r4",
        status: "granted",
        evidence_on_file: false,
        category: "social_media",
        child_id: "c1",
      }),
    ];
    // totalChildren = 3, no emergency coverage -> also emergency alert
    const alerts = identifyConsentAlerts(records, 3, now);
    const types = new Set(alerts.map((a) => a.type));
    expect(types.has("no_emergency_consent")).toBe(true);
    expect(types.has("consent_expired")).toBe(true);
    expect(types.has("consent_expiring")).toBe(true);
    expect(types.has("consent_pending")).toBe(true);
    expect(types.has("no_evidence")).toBe(true);
  });

  it("does not raise expired alert for withdrawn consent with past expiry", () => {
    const record = makeRecord({
      status: "withdrawn",
      expiry_date: pastDate(10),
      evidence_on_file: true,
    });
    const alerts = identifyConsentAlerts([record], 0, now);
    const expiredAlerts = alerts.filter((a) => a.type === "consent_expired");
    expect(expiredAlerts).toHaveLength(0);
  });

  it("does not raise any alerts for not_applicable status records", () => {
    const record = makeRecord({
      status: "not_applicable",
      evidence_on_file: true,
    });
    const alerts = identifyConsentAlerts([record], 0, now);
    const recordAlerts = alerts.filter((a) => a.id === record.id);
    expect(recordAlerts).toHaveLength(0);
  });

  it("correctly replaces underscores in category name for alert messages", () => {
    const record = makeRecord({
      status: "pending",
      category: "therapy_counselling",
      evidence_on_file: true,
    });
    const alerts = identifyConsentAlerts([record], 0, now);
    const alert = alerts.find((a) => a.type === "consent_pending");
    expect(alert?.message).toContain("therapy counselling");
    expect(alert?.message).not.toContain("therapy_counselling");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. CRUD FALLBACKS (Supabase disabled)
// ═══════════════════════════════════════════════════════════════════════════

describe("CRUD fallbacks when Supabase is disabled", () => {
  let listRecords: typeof import("../consent-management-service").listRecords;
  let createRecord: typeof import("../consent-management-service").createRecord;
  let updateRecord: typeof import("../consent-management-service").updateRecord;

  beforeAll(async () => {
    const mod = await import("../consent-management-service");
    listRecords = mod.listRecords;
    createRecord = mod.createRecord;
    updateRecord = mod.updateRecord;
  });

  it("listRecords returns ok true with empty data", async () => {
    const result = await listRecords("home-1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listRecords returns ok true with filters", async () => {
    const result = await listRecords("home-1", {
      childId: "c1",
      category: "medical_treatment",
      status: "granted",
      limit: 10,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("createRecord returns error when Supabase not configured", async () => {
    const result = await createRecord({
      homeId: "home-1",
      childName: "Test Child",
      childId: "child-1",
      category: "medical_treatment",
      status: "granted",
      givenBy: "parent_mother",
      givenByName: "Test Parent",
      consentDate: "2026-01-15",
      evidenceOnFile: true,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });

  it("createRecord returns error with optional fields provided", async () => {
    const result = await createRecord({
      homeId: "home-1",
      childName: "Test Child",
      childId: "child-1",
      category: "photographs",
      status: "pending",
      givenBy: "local_authority",
      givenByName: "LA Rep",
      consentDate: "2026-03-01",
      expiryDate: "2027-03-01",
      conditions: "Only indoor photos",
      evidenceOnFile: false,
      notes: "Awaiting signed form",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });

  it("updateRecord returns error when Supabase not configured", async () => {
    const result = await updateRecord("rec-1", { status: "withdrawn" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });

  it("updateRecord returns error with multiple update fields", async () => {
    const result = await updateRecord("rec-1", {
      status: "expired",
      notes: "Consent expired, needs renewal",
      reviewed_date: "2026-05-01",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });
});
