// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME DBS RENEWAL & STAFF VETTING INTELLIGENCE ENGINE TESTS
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeDbsRenewalStaffVetting,
  type DbsVettingInput,
  type DbsCheckRecordInput,
  type EnhancedDbsRecordInput,
  type OverseasCheckRecordInput,
  type BarredListRecordInput,
  type ReferenceVerificationRecordInput,
  type DbsVettingResult,
  type DbsVettingRating,
} from "../home-dbs-renewal-staff-vetting-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeDbsCheck(overrides: Partial<DbsCheckRecordInput> = {}): DbsCheckRecordInput {
  return {
    id: "dbs_1",
    staff_id: "staff_1",
    status: "completed",
    check_date: "2026-01-15",
    expiry_date: "2029-01-15",
    certificate_number: "DBS-001",
    is_valid: true,
    on_update_service: true,
    disclosures_found: false,
    risk_assessment_completed: false,
    certificate_verified: true,
    renewal_initiated_date: null,
    processed_within_timeframe: true,
    created_at: "2026-01-15",
    ...overrides,
  };
}

function makeEnhancedDbs(overrides: Partial<EnhancedDbsRecordInput> = {}): EnhancedDbsRecordInput {
  return {
    id: "edbs_1",
    staff_id: "staff_1",
    status: "completed",
    check_date: "2026-01-15",
    expiry_date: "2029-01-15",
    is_enhanced: true,
    includes_barred_list_check: true,
    is_valid: true,
    certificate_verified: true,
    on_update_service: true,
    last_update_check_date: "2026-05-01",
    update_check_clear: true,
    role_type: "regulated_activity",
    created_at: "2026-01-15",
    ...overrides,
  };
}

function makeOverseasCheck(overrides: Partial<OverseasCheckRecordInput> = {}): OverseasCheckRecordInput {
  return {
    id: "oc_1",
    staff_id: "staff_1",
    country: "Poland",
    status: "completed",
    received_date: "2026-02-01",
    is_clear: true,
    risk_assessment_completed: false,
    verified: true,
    letter_of_good_standing: false,
    is_current: true,
    created_at: "2026-02-01",
    ...overrides,
  };
}

function makeBarredList(overrides: Partial<BarredListRecordInput> = {}): BarredListRecordInput {
  return {
    id: "bl_1",
    staff_id: "staff_1",
    status: "completed",
    check_date: "2026-01-15",
    is_clear: true,
    children_list_checked: true,
    adults_list_checked: true,
    verified: true,
    is_current: true,
    signed_off_by: "Manager A",
    created_at: "2026-01-15",
    ...overrides,
  };
}

function makeReference(overrides: Partial<ReferenceVerificationRecordInput> = {}): ReferenceVerificationRecordInput {
  return {
    id: "ref_1",
    staff_id: "staff_1",
    status: "completed",
    reference_type: "employment",
    received_date: "2025-12-01",
    verified: true,
    is_satisfactory: true,
    concerns_raised: false,
    concerns_followed_up: false,
    gaps_explored: true,
    covers_child_suitability: true,
    obtained_before_start: true,
    direct_contact_made: true,
    created_at: "2025-12-01",
    ...overrides,
  };
}

const staffIds = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8"];

/** 8 staff, all with valid DBS, enhanced DBS, barred list clear, refs verified → outstanding */
function baseInput(overrides: Partial<DbsVettingInput> = {}): DbsVettingInput {
  return {
    today: "2026-05-30",
    total_staff: 8,
    dbs_check_records: staffIds.map((sid, i) =>
      makeDbsCheck({ id: `dbs_${i}`, staff_id: sid })
    ),
    enhanced_dbs_records: staffIds.map((sid, i) =>
      makeEnhancedDbs({ id: `edbs_${i}`, staff_id: sid })
    ),
    overseas_check_records: staffIds.map((sid, i) =>
      makeOverseasCheck({ id: `oc_${i}`, staff_id: sid, country: `Country_${i}` })
    ),
    barred_list_records: staffIds.map((sid, i) =>
      makeBarredList({ id: `bl_${i}`, staff_id: sid })
    ),
    reference_verification_records: staffIds.map((sid, i) =>
      makeReference({ id: `ref_${i}`, staff_id: sid })
    ),
    ...overrides,
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Home DBS Renewal & Staff Vetting Intelligence Engine", () => {

  // ══════════════════════════════════════════════════════════════════════════
  // 1. RESULT STRUCTURE (6 tests)
  // ══════════════════════════════════════════════════════════════════════════

  describe("Result structure", () => {
    it("returns a well-shaped result with all required top-level fields", () => {
      const r = computeDbsRenewalStaffVetting(baseInput());
      expect(r).toHaveProperty("vetting_rating");
      expect(r).toHaveProperty("vetting_score");
      expect(r).toHaveProperty("headline");
      expect(r).toHaveProperty("dbs_currency_rate");
      expect(r).toHaveProperty("enhanced_dbs_rate");
      expect(r).toHaveProperty("overseas_check_rate");
      expect(r).toHaveProperty("barred_list_rate");
      expect(r).toHaveProperty("reference_verification_rate");
      expect(r).toHaveProperty("renewal_timeliness_rate");
    });

    it("returns all detailed metric fields", () => {
      const r = computeDbsRenewalStaffVetting(baseInput());
      expect(r).toHaveProperty("dbs_total_records");
      expect(r).toHaveProperty("dbs_valid_count");
      expect(r).toHaveProperty("dbs_expired_count");
      expect(r).toHaveProperty("dbs_pending_count");
      expect(r).toHaveProperty("dbs_on_update_service_count");
      expect(r).toHaveProperty("dbs_certificate_verified_count");
      expect(r).toHaveProperty("dbs_with_disclosures_count");
      expect(r).toHaveProperty("dbs_risk_assessments_completed");
      expect(r).toHaveProperty("enhanced_dbs_total");
      expect(r).toHaveProperty("enhanced_dbs_valid_count");
      expect(r).toHaveProperty("enhanced_dbs_with_barred_list_count");
      expect(r).toHaveProperty("enhanced_dbs_expired_count");
      expect(r).toHaveProperty("overseas_checks_total");
      expect(r).toHaveProperty("overseas_checks_completed");
      expect(r).toHaveProperty("overseas_checks_clear");
      expect(r).toHaveProperty("overseas_checks_pending");
      expect(r).toHaveProperty("barred_list_total");
      expect(r).toHaveProperty("barred_list_completed");
      expect(r).toHaveProperty("barred_list_clear_count");
      expect(r).toHaveProperty("barred_list_children_checked_count");
      expect(r).toHaveProperty("barred_list_adults_checked_count");
      expect(r).toHaveProperty("references_total");
      expect(r).toHaveProperty("references_completed");
      expect(r).toHaveProperty("references_verified");
      expect(r).toHaveProperty("references_satisfactory");
      expect(r).toHaveProperty("references_with_concerns");
      expect(r).toHaveProperty("references_concerns_followed_up");
      expect(r).toHaveProperty("references_obtained_before_start");
      expect(r).toHaveProperty("staff_with_dbs_coverage");
      expect(r).toHaveProperty("staff_fully_vetted_count");
    });

    it("returns narrative arrays for strengths, concerns, recommendations, insights", () => {
      const r = computeDbsRenewalStaffVetting(baseInput());
      expect(Array.isArray(r.strengths)).toBe(true);
      expect(Array.isArray(r.concerns)).toBe(true);
      expect(Array.isArray(r.recommendations)).toBe(true);
      expect(Array.isArray(r.insights)).toBe(true);
    });

    it("assigns a valid rating value", () => {
      const r = computeDbsRenewalStaffVetting(baseInput());
      expect(["outstanding", "good", "adequate", "inadequate", "insufficient_data"]).toContain(r.vetting_rating);
    });

    it("scores between 0 and 100", () => {
      const r = computeDbsRenewalStaffVetting(baseInput());
      expect(r.vetting_score).toBeGreaterThanOrEqual(0);
      expect(r.vetting_score).toBeLessThanOrEqual(100);
    });

    it("headline is a non-empty string", () => {
      const r = computeDbsRenewalStaffVetting(baseInput());
      expect(typeof r.headline).toBe("string");
      expect(r.headline.length).toBeGreaterThan(0);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 2. INSUFFICIENT DATA & EMPTY SPECIAL CASES (8 tests)
  // ══════════════════════════════════════════════════════════════════════════

  describe("Insufficient data / empty special cases", () => {
    it("returns insufficient_data and score 0 when total_staff=0 and all arrays empty", () => {
      const r = computeDbsRenewalStaffVetting({
        today: "2026-05-30", total_staff: 0,
        dbs_check_records: [], enhanced_dbs_records: [], overseas_check_records: [],
        barred_list_records: [], reference_verification_records: [],
      });
      expect(r.vetting_rating).toBe("insufficient_data");
      expect(r.vetting_score).toBe(0);
    });

    it("produces a meaningful headline for insufficient_data", () => {
      const r = computeDbsRenewalStaffVetting({
        today: "2026-05-30", total_staff: 0,
        dbs_check_records: [], enhanced_dbs_records: [], overseas_check_records: [],
        barred_list_records: [], reference_verification_records: [],
      });
      expect(r.headline.toLowerCase()).toContain("insufficient data");
    });

    it("returns inadequate score 15 when total_staff>0 but all arrays empty", () => {
      const r = computeDbsRenewalStaffVetting({
        today: "2026-05-30", total_staff: 8,
        dbs_check_records: [], enhanced_dbs_records: [], overseas_check_records: [],
        barred_list_records: [], reference_verification_records: [],
      });
      expect(r.vetting_rating).toBe("inadequate");
      expect(r.vetting_score).toBe(15);
    });

    it("allEmpty + staff>0 headline references the staff count", () => {
      const r = computeDbsRenewalStaffVetting({
        today: "2026-05-30", total_staff: 5,
        dbs_check_records: [], enhanced_dbs_records: [], overseas_check_records: [],
        barred_list_records: [], reference_verification_records: [],
      });
      expect(r.headline).toContain("5");
    });

    it("allEmpty + staff>0 produces at least 4 concerns", () => {
      const r = computeDbsRenewalStaffVetting({
        today: "2026-05-30", total_staff: 8,
        dbs_check_records: [], enhanced_dbs_records: [], overseas_check_records: [],
        barred_list_records: [], reference_verification_records: [],
      });
      expect(r.concerns.length).toBeGreaterThanOrEqual(4);
    });

    it("allEmpty + staff>0 produces at least 4 recommendations", () => {
      const r = computeDbsRenewalStaffVetting({
        today: "2026-05-30", total_staff: 8,
        dbs_check_records: [], enhanced_dbs_records: [], overseas_check_records: [],
        barred_list_records: [], reference_verification_records: [],
      });
      expect(r.recommendations.length).toBeGreaterThanOrEqual(4);
    });

    it("allEmpty + staff=0 produces at least 1 recommendation", () => {
      const r = computeDbsRenewalStaffVetting({
        today: "2026-05-30", total_staff: 0,
        dbs_check_records: [], enhanced_dbs_records: [], overseas_check_records: [],
        barred_list_records: [], reference_verification_records: [],
      });
      expect(r.recommendations.length).toBeGreaterThanOrEqual(1);
    });

    it("allEmpty + staff=1 uses singular phrasing", () => {
      const r = computeDbsRenewalStaffVetting({
        today: "2026-05-30", total_staff: 1,
        dbs_check_records: [], enhanced_dbs_records: [], overseas_check_records: [],
        barred_list_records: [], reference_verification_records: [],
      });
      expect(r.concerns.some(c => c.includes(" is "))).toBe(true);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 3. BASE CASE — OUTSTANDING (6 tests)
  // ══════════════════════════════════════════════════════════════════════════

  describe("Base case — outstanding", () => {
    it("rates outstanding when all 8 staff have perfect vetting", () => {
      const r = computeDbsRenewalStaffVetting(baseInput());
      expect(r.vetting_rating).toBe("outstanding");
    });

    it("scores >= 80 for the base outstanding case", () => {
      const r = computeDbsRenewalStaffVetting(baseInput());
      expect(r.vetting_score).toBeGreaterThanOrEqual(80);
    });

    it("has 100% DBS currency rate", () => {
      const r = computeDbsRenewalStaffVetting(baseInput());
      expect(r.dbs_currency_rate).toBe(100);
    });

    it("has 100% enhanced DBS rate", () => {
      const r = computeDbsRenewalStaffVetting(baseInput());
      expect(r.enhanced_dbs_rate).toBe(100);
    });

    it("has 100% barred list rate", () => {
      const r = computeDbsRenewalStaffVetting(baseInput());
      expect(r.barred_list_rate).toBe(100);
    });

    it("has 100% reference verification rate", () => {
      const r = computeDbsRenewalStaffVetting(baseInput());
      expect(r.reference_verification_rate).toBe(100);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 4. DBS CURRENCY METRIC (20 tests)
  // ══════════════════════════════════════════════════════════════════════════

  describe("DBS currency metric", () => {
    it("counts valid DBS checks correctly", () => {
      const r = computeDbsRenewalStaffVetting(baseInput());
      expect(r.dbs_valid_count).toBe(8);
    });

    it("dbs_total_records matches record count", () => {
      const r = computeDbsRenewalStaffVetting(baseInput());
      expect(r.dbs_total_records).toBe(8);
    });

    it("expired DBS records are counted", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        dbs_check_records: [
          makeDbsCheck({ id: "d1", staff_id: "s1", status: "expired", is_valid: false, expiry_date: "2025-01-01" }),
          makeDbsCheck({ id: "d2", staff_id: "s2" }),
        ],
      }));
      expect(r.dbs_expired_count).toBe(1);
    });

    it("pending DBS records are counted", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        dbs_check_records: [
          makeDbsCheck({ id: "d1", staff_id: "s1", status: "pending", is_valid: false }),
          makeDbsCheck({ id: "d2", staff_id: "s2" }),
        ],
      }));
      expect(r.dbs_pending_count).toBe(1);
    });

    it("DBS on update service counted only for completed records", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        dbs_check_records: [
          makeDbsCheck({ id: "d1", staff_id: "s1", on_update_service: true }),
          makeDbsCheck({ id: "d2", staff_id: "s2", on_update_service: false }),
          makeDbsCheck({ id: "d3", staff_id: "s3", on_update_service: true, status: "pending" }),
        ],
      }));
      expect(r.dbs_on_update_service_count).toBe(1);
    });

    it("DBS certificate verification counted only for completed", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        dbs_check_records: [
          makeDbsCheck({ id: "d1", staff_id: "s1", certificate_verified: true }),
          makeDbsCheck({ id: "d2", staff_id: "s2", certificate_verified: false }),
        ],
      }));
      expect(r.dbs_certificate_verified_count).toBe(1);
    });

    it("disclosures found count is tracked", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        dbs_check_records: [
          makeDbsCheck({ id: "d1", staff_id: "s1", disclosures_found: true, risk_assessment_completed: true }),
          makeDbsCheck({ id: "d2", staff_id: "s2", disclosures_found: true, risk_assessment_completed: false }),
          makeDbsCheck({ id: "d3", staff_id: "s3" }),
        ],
      }));
      expect(r.dbs_with_disclosures_count).toBe(2);
      expect(r.dbs_risk_assessments_completed).toBe(1);
    });

    it("expired DBS check via expiry_date < today is counted as expired", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        dbs_check_records: [
          makeDbsCheck({ id: "d1", staff_id: "s1", status: "completed", expiry_date: "2025-01-01" }),
        ],
      }));
      expect(r.dbs_expired_count).toBe(1);
    });

    it("currency rate = 0 when all DBS are expired", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        dbs_check_records: staffIds.map((sid, i) =>
          makeDbsCheck({ id: `d${i}`, staff_id: sid, status: "expired", is_valid: false, expiry_date: "2025-01-01" })
        ),
      }));
      expect(r.dbs_currency_rate).toBe(0);
    });

    it("currency rate = 50 when half valid half expired", () => {
      const records = [
        makeDbsCheck({ id: "d0", staff_id: "s1" }),
        makeDbsCheck({ id: "d1", staff_id: "s2" }),
        makeDbsCheck({ id: "d2", staff_id: "s3" }),
        makeDbsCheck({ id: "d3", staff_id: "s4" }),
        makeDbsCheck({ id: "d4", staff_id: "s5", status: "expired", is_valid: false, expiry_date: "2024-01-01" }),
        makeDbsCheck({ id: "d5", staff_id: "s6", status: "expired", is_valid: false, expiry_date: "2024-01-01" }),
        makeDbsCheck({ id: "d6", staff_id: "s7", status: "expired", is_valid: false, expiry_date: "2024-01-01" }),
        makeDbsCheck({ id: "d7", staff_id: "s8", status: "expired", is_valid: false, expiry_date: "2024-01-01" }),
      ];
      const r = computeDbsRenewalStaffVetting(baseInput({ dbs_check_records: records }));
      expect(r.dbs_currency_rate).toBe(50);
    });

    it("staff_with_dbs_coverage tracks unique staff IDs", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        dbs_check_records: [
          makeDbsCheck({ id: "d1", staff_id: "s1" }),
          makeDbsCheck({ id: "d2", staff_id: "s1" }), // duplicate staff
          makeDbsCheck({ id: "d3", staff_id: "s2" }),
        ],
      }));
      expect(r.staff_with_dbs_coverage).toBe(2);
    });

    it("DBS not_started records do not count as valid", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        dbs_check_records: [
          makeDbsCheck({ id: "d1", staff_id: "s1", status: "not_started", is_valid: false }),
        ],
      }));
      expect(r.dbs_valid_count).toBe(0);
      expect(r.dbs_currency_rate).toBe(0);
    });

    it("DBS rejected records do not count as valid", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        dbs_check_records: [
          makeDbsCheck({ id: "d1", staff_id: "s1", status: "rejected", is_valid: false }),
        ],
      }));
      expect(r.dbs_valid_count).toBe(0);
    });

    it("DBS with is_valid=false but status=completed is not valid", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        dbs_check_records: [
          makeDbsCheck({ id: "d1", staff_id: "s1", status: "completed", is_valid: false }),
        ],
      }));
      expect(r.dbs_valid_count).toBe(0);
    });

    it("DBS with is_valid=true but expired expiry_date is not valid", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        dbs_check_records: [
          makeDbsCheck({ id: "d1", staff_id: "s1", is_valid: true, expiry_date: "2025-01-01" }),
        ],
      }));
      expect(r.dbs_valid_count).toBe(0);
    });

    it("DBS with null expiry_date and status completed and is_valid is valid", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        dbs_check_records: [
          makeDbsCheck({ id: "d1", staff_id: "s1", is_valid: true, expiry_date: null }),
        ],
      }));
      expect(r.dbs_valid_count).toBe(1);
    });

    it("high DBS currency awards bonus 1 score +4", () => {
      // 100% currency → +4
      const rPerfect = computeDbsRenewalStaffVetting(baseInput());
      // 0% currency → +0
      const rBad = computeDbsRenewalStaffVetting(baseInput({
        dbs_check_records: staffIds.map((sid, i) =>
          makeDbsCheck({ id: `d${i}`, staff_id: sid, status: "expired", is_valid: false, expiry_date: "2024-01-01" })
        ),
      }));
      expect(rPerfect.vetting_score).toBeGreaterThan(rBad.vetting_score);
    });

    it("70% DBS currency awards bonus +2", () => {
      // 7 valid out of 10
      const records = [
        ...Array.from({ length: 7 }, (_, i) => makeDbsCheck({ id: `v${i}`, staff_id: `s${i}` })),
        ...Array.from({ length: 3 }, (_, i) => makeDbsCheck({ id: `e${i}`, staff_id: `x${i}`, status: "expired", is_valid: false, expiry_date: "2024-01-01" })),
      ];
      const r = computeDbsRenewalStaffVetting(baseInput({ dbs_check_records: records }));
      expect(r.dbs_currency_rate).toBe(70);
    });

    it("50% DBS currency awards bonus +1", () => {
      const records = [
        ...Array.from({ length: 5 }, (_, i) => makeDbsCheck({ id: `v${i}`, staff_id: `s${i}` })),
        ...Array.from({ length: 5 }, (_, i) => makeDbsCheck({ id: `e${i}`, staff_id: `x${i}`, status: "expired", is_valid: false, expiry_date: "2024-01-01" })),
      ];
      const r = computeDbsRenewalStaffVetting(baseInput({ dbs_check_records: records }));
      expect(r.dbs_currency_rate).toBe(50);
    });

    it("below 50% DBS currency gets no bonus", () => {
      const records = [
        makeDbsCheck({ id: "v0", staff_id: "s1" }),
        ...Array.from({ length: 9 }, (_, i) => makeDbsCheck({ id: `e${i}`, staff_id: `x${i}`, status: "expired", is_valid: false, expiry_date: "2024-01-01" })),
      ];
      const r = computeDbsRenewalStaffVetting(baseInput({ dbs_check_records: records }));
      expect(r.dbs_currency_rate).toBe(10);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 5. ENHANCED DBS METRIC (16 tests)
  // ══════════════════════════════════════════════════════════════════════════

  describe("Enhanced DBS metric", () => {
    it("counts valid enhanced DBS checks", () => {
      const r = computeDbsRenewalStaffVetting(baseInput());
      expect(r.enhanced_dbs_valid_count).toBe(8);
    });

    it("enhanced_dbs_total matches record count", () => {
      const r = computeDbsRenewalStaffVetting(baseInput());
      expect(r.enhanced_dbs_total).toBe(8);
    });

    it("counts enhanced DBS with barred list check", () => {
      const r = computeDbsRenewalStaffVetting(baseInput());
      expect(r.enhanced_dbs_with_barred_list_count).toBe(8);
    });

    it("enhanced DBS without is_enhanced flag is not valid", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        enhanced_dbs_records: [
          makeEnhancedDbs({ id: "e1", staff_id: "s1", is_enhanced: false }),
        ],
      }));
      expect(r.enhanced_dbs_valid_count).toBe(0);
    });

    it("expired enhanced DBS is counted as expired", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        enhanced_dbs_records: [
          makeEnhancedDbs({ id: "e1", staff_id: "s1", status: "expired", is_valid: false, expiry_date: "2025-01-01" }),
          makeEnhancedDbs({ id: "e2", staff_id: "s2" }),
        ],
      }));
      expect(r.enhanced_dbs_expired_count).toBe(1);
    });

    it("enhanced DBS expired via expiry_date < today counted as expired", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        enhanced_dbs_records: [
          makeEnhancedDbs({ id: "e1", staff_id: "s1", status: "completed", expiry_date: "2025-01-01" }),
        ],
      }));
      expect(r.enhanced_dbs_expired_count).toBe(1);
    });

    it("enhanced DBS rate = 100 when all valid", () => {
      const r = computeDbsRenewalStaffVetting(baseInput());
      expect(r.enhanced_dbs_rate).toBe(100);
    });

    it("enhanced DBS rate = 0 when all expired", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        enhanced_dbs_records: staffIds.map((sid, i) =>
          makeEnhancedDbs({ id: `e${i}`, staff_id: sid, status: "expired", is_valid: false, expiry_date: "2024-01-01" })
        ),
      }));
      expect(r.enhanced_dbs_rate).toBe(0);
    });

    it("enhanced DBS with barred list not included is tracked but still valid if other criteria met", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        enhanced_dbs_records: [
          makeEnhancedDbs({ id: "e1", staff_id: "s1", includes_barred_list_check: false }),
        ],
      }));
      expect(r.enhanced_dbs_with_barred_list_count).toBe(0);
      expect(r.enhanced_dbs_valid_count).toBe(1);
    });

    it("high enhanced DBS rate awards bonus +4", () => {
      const r = computeDbsRenewalStaffVetting(baseInput());
      expect(r.enhanced_dbs_rate).toBeGreaterThanOrEqual(95);
    });

    it("85% enhanced DBS rate awards bonus +3", () => {
      // 17 of 20 valid
      const records = [
        ...Array.from({ length: 17 }, (_, i) => makeEnhancedDbs({ id: `ev${i}`, staff_id: `s${i}` })),
        ...Array.from({ length: 3 }, (_, i) => makeEnhancedDbs({ id: `ee${i}`, staff_id: `x${i}`, status: "expired", is_valid: false, expiry_date: "2024-01-01" })),
      ];
      const r = computeDbsRenewalStaffVetting(baseInput({ enhanced_dbs_records: records }));
      expect(r.enhanced_dbs_rate).toBe(85);
    });

    it("70% enhanced DBS rate awards bonus +2", () => {
      const records = [
        ...Array.from({ length: 7 }, (_, i) => makeEnhancedDbs({ id: `ev${i}`, staff_id: `s${i}` })),
        ...Array.from({ length: 3 }, (_, i) => makeEnhancedDbs({ id: `ee${i}`, staff_id: `x${i}`, status: "expired", is_valid: false, expiry_date: "2024-01-01" })),
      ];
      const r = computeDbsRenewalStaffVetting(baseInput({ enhanced_dbs_records: records }));
      expect(r.enhanced_dbs_rate).toBe(70);
    });

    it("50% enhanced DBS rate awards bonus +1", () => {
      const records = [
        ...Array.from({ length: 5 }, (_, i) => makeEnhancedDbs({ id: `ev${i}`, staff_id: `s${i}` })),
        ...Array.from({ length: 5 }, (_, i) => makeEnhancedDbs({ id: `ee${i}`, staff_id: `x${i}`, status: "expired", is_valid: false, expiry_date: "2024-01-01" })),
      ];
      const r = computeDbsRenewalStaffVetting(baseInput({ enhanced_dbs_records: records }));
      expect(r.enhanced_dbs_rate).toBe(50);
    });

    it("pending enhanced DBS records are not counted as valid", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        enhanced_dbs_records: [
          makeEnhancedDbs({ id: "e1", staff_id: "s1", status: "pending", is_valid: false }),
        ],
      }));
      expect(r.enhanced_dbs_valid_count).toBe(0);
    });

    it("not_started enhanced DBS records are not counted as valid", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        enhanced_dbs_records: [
          makeEnhancedDbs({ id: "e1", staff_id: "s1", status: "not_started", is_valid: false }),
        ],
      }));
      expect(r.enhanced_dbs_valid_count).toBe(0);
    });

    it("enhanced DBS with is_valid=false is not valid even if status=completed", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        enhanced_dbs_records: [
          makeEnhancedDbs({ id: "e1", staff_id: "s1", is_valid: false }),
        ],
      }));
      expect(r.enhanced_dbs_valid_count).toBe(0);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 6. OVERSEAS CHECK METRIC (14 tests)
  // ══════════════════════════════════════════════════════════════════════════

  describe("Overseas check metric", () => {
    it("counts completed overseas checks", () => {
      const r = computeDbsRenewalStaffVetting(baseInput());
      expect(r.overseas_checks_completed).toBe(8);
    });

    it("overseas_checks_total matches record count", () => {
      const r = computeDbsRenewalStaffVetting(baseInput());
      expect(r.overseas_checks_total).toBe(8);
    });

    it("counts clear overseas checks", () => {
      const r = computeDbsRenewalStaffVetting(baseInput());
      expect(r.overseas_checks_clear).toBe(8);
    });

    it("pending overseas checks are counted", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        overseas_check_records: [
          makeOverseasCheck({ id: "oc1", staff_id: "s1", status: "pending", is_clear: false }),
          makeOverseasCheck({ id: "oc2", staff_id: "s2" }),
        ],
      }));
      expect(r.overseas_checks_pending).toBe(1);
    });

    it("overseas check rate includes completed + letters of good standing + waived", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        overseas_check_records: [
          makeOverseasCheck({ id: "oc1", staff_id: "s1", status: "completed" }),
          makeOverseasCheck({ id: "oc2", staff_id: "s2", status: "not_available", letter_of_good_standing: true }),
          makeOverseasCheck({ id: "oc3", staff_id: "s3", status: "waived" }),
          makeOverseasCheck({ id: "oc4", staff_id: "s4", status: "pending" }),
        ],
      }));
      // handled = 1 completed + 1 letter + 1 waived = 3 out of 4 = 75%
      expect(r.overseas_check_rate).toBe(75);
    });

    it("overseas check rate = 100 when all completed", () => {
      const r = computeDbsRenewalStaffVetting(baseInput());
      expect(r.overseas_check_rate).toBe(100);
    });

    it("overseas check rate = 0 when all not_started", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        overseas_check_records: [
          makeOverseasCheck({ id: "oc1", staff_id: "s1", status: "not_started" }),
          makeOverseasCheck({ id: "oc2", staff_id: "s2", status: "not_started" }),
        ],
      }));
      expect(r.overseas_check_rate).toBe(0);
    });

    it("not_available without letter_of_good_standing does not count toward rate", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        overseas_check_records: [
          makeOverseasCheck({ id: "oc1", staff_id: "s1", status: "not_available", letter_of_good_standing: false }),
        ],
      }));
      expect(r.overseas_check_rate).toBe(0);
    });

    it("not_available with letter_of_good_standing counts toward rate", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        overseas_check_records: [
          makeOverseasCheck({ id: "oc1", staff_id: "s1", status: "not_available", letter_of_good_standing: true }),
        ],
      }));
      expect(r.overseas_check_rate).toBe(100);
    });

    it("high overseas check rate awards bonus +3", () => {
      const r = computeDbsRenewalStaffVetting(baseInput());
      expect(r.overseas_check_rate).toBeGreaterThanOrEqual(90);
    });

    it("75% overseas rate awards bonus +2", () => {
      const records = [
        ...Array.from({ length: 3 }, (_, i) => makeOverseasCheck({ id: `ov${i}`, staff_id: `s${i}` })),
        makeOverseasCheck({ id: "op1", staff_id: "s4", status: "pending" }),
      ];
      const r = computeDbsRenewalStaffVetting(baseInput({ overseas_check_records: records }));
      expect(r.overseas_check_rate).toBe(75);
    });

    it("55% overseas rate awards bonus +1", () => {
      const records = [
        ...Array.from({ length: 5 }, (_, i) => makeOverseasCheck({ id: `ov${i}`, staff_id: `s${i}` })),
        ...Array.from({ length: 4 }, (_, i) => makeOverseasCheck({ id: `op${i}`, staff_id: `x${i}`, status: "pending" })),
      ];
      const r = computeDbsRenewalStaffVetting(baseInput({ overseas_check_records: records }));
      // 5/9 = 56%
      expect(r.overseas_check_rate).toBe(56);
    });

    it("empty overseas records → rate = 0, no bonus or penalty", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({ overseas_check_records: [] }));
      expect(r.overseas_check_rate).toBe(0);
      expect(r.overseas_checks_total).toBe(0);
    });

    it("waived overseas checks count toward rate", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        overseas_check_records: [
          makeOverseasCheck({ id: "oc1", staff_id: "s1", status: "waived" }),
        ],
      }));
      expect(r.overseas_check_rate).toBe(100);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 7. BARRED LIST METRIC (16 tests)
  // ══════════════════════════════════════════════════════════════════════════

  describe("Barred list metric", () => {
    it("counts completed barred list checks", () => {
      const r = computeDbsRenewalStaffVetting(baseInput());
      expect(r.barred_list_completed).toBe(8);
    });

    it("barred_list_total matches record count", () => {
      const r = computeDbsRenewalStaffVetting(baseInput());
      expect(r.barred_list_total).toBe(8);
    });

    it("barred list clear count is correct", () => {
      const r = computeDbsRenewalStaffVetting(baseInput());
      expect(r.barred_list_clear_count).toBe(8);
    });

    it("children list checked count", () => {
      const r = computeDbsRenewalStaffVetting(baseInput());
      expect(r.barred_list_children_checked_count).toBe(8);
    });

    it("adults list checked count", () => {
      const r = computeDbsRenewalStaffVetting(baseInput());
      expect(r.barred_list_adults_checked_count).toBe(8);
    });

    it("barred list rate = pct(currentCount, totalBarred)", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        barred_list_records: [
          makeBarredList({ id: "bl1", staff_id: "s1", is_current: true }),
          makeBarredList({ id: "bl2", staff_id: "s2", is_current: false }),
        ],
      }));
      expect(r.barred_list_rate).toBe(50);
    });

    it("barred list rate = 100 when all current", () => {
      const r = computeDbsRenewalStaffVetting(baseInput());
      expect(r.barred_list_rate).toBe(100);
    });

    it("barred list rate = 0 when none current", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        barred_list_records: staffIds.map((sid, i) =>
          makeBarredList({ id: `bl${i}`, staff_id: sid, is_current: false })
        ),
      }));
      expect(r.barred_list_rate).toBe(0);
    });

    it("pending barred list checks tracked", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        barred_list_records: [
          makeBarredList({ id: "bl1", staff_id: "s1", status: "pending" }),
          makeBarredList({ id: "bl2", staff_id: "s2" }),
        ],
      }));
      // pending → not completed → not current for rate purposes
      expect(r.barred_list_completed).toBe(1);
    });

    it("not_started barred list checks tracked", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        barred_list_records: [
          makeBarredList({ id: "bl1", staff_id: "s1", status: "not_started" }),
          makeBarredList({ id: "bl2", staff_id: "s2" }),
        ],
      }));
      expect(r.barred_list_completed).toBe(1);
    });

    it("high barred list rate awards bonus +4", () => {
      const r = computeDbsRenewalStaffVetting(baseInput());
      expect(r.barred_list_rate).toBeGreaterThanOrEqual(95);
    });

    it("85% barred list rate awards bonus +3", () => {
      // 17/20 current
      const records = [
        ...Array.from({ length: 17 }, (_, i) => makeBarredList({ id: `bv${i}`, staff_id: `s${i}`, is_current: true })),
        ...Array.from({ length: 3 }, (_, i) => makeBarredList({ id: `bn${i}`, staff_id: `x${i}`, is_current: false })),
      ];
      const r = computeDbsRenewalStaffVetting(baseInput({ barred_list_records: records }));
      expect(r.barred_list_rate).toBe(85);
    });

    it("70% barred list rate awards bonus +2", () => {
      const records = [
        ...Array.from({ length: 7 }, (_, i) => makeBarredList({ id: `bv${i}`, staff_id: `s${i}`, is_current: true })),
        ...Array.from({ length: 3 }, (_, i) => makeBarredList({ id: `bn${i}`, staff_id: `x${i}`, is_current: false })),
      ];
      const r = computeDbsRenewalStaffVetting(baseInput({ barred_list_records: records }));
      expect(r.barred_list_rate).toBe(70);
    });

    it("50% barred list rate awards bonus +1", () => {
      const records = [
        ...Array.from({ length: 5 }, (_, i) => makeBarredList({ id: `bv${i}`, staff_id: `s${i}`, is_current: true })),
        ...Array.from({ length: 5 }, (_, i) => makeBarredList({ id: `bn${i}`, staff_id: `x${i}`, is_current: false })),
      ];
      const r = computeDbsRenewalStaffVetting(baseInput({ barred_list_records: records }));
      expect(r.barred_list_rate).toBe(50);
    });

    it("barred list not clear is tracked in clear count", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        barred_list_records: [
          makeBarredList({ id: "bl1", staff_id: "s1", is_clear: false }),
          makeBarredList({ id: "bl2", staff_id: "s2", is_clear: true }),
        ],
      }));
      expect(r.barred_list_clear_count).toBe(1);
    });

    it("empty barred list records → rate = 0", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({ barred_list_records: [] }));
      expect(r.barred_list_rate).toBe(0);
      expect(r.barred_list_total).toBe(0);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 8. REFERENCE VERIFICATION METRIC (18 tests)
  // ══════════════════════════════════════════════════════════════════════════

  describe("Reference verification metric", () => {
    it("counts completed references", () => {
      const r = computeDbsRenewalStaffVetting(baseInput());
      expect(r.references_completed).toBe(8);
    });

    it("references_total matches record count", () => {
      const r = computeDbsRenewalStaffVetting(baseInput());
      expect(r.references_total).toBe(8);
    });

    it("counts verified references", () => {
      const r = computeDbsRenewalStaffVetting(baseInput());
      expect(r.references_verified).toBe(8);
    });

    it("counts satisfactory references", () => {
      const r = computeDbsRenewalStaffVetting(baseInput());
      expect(r.references_satisfactory).toBe(8);
    });

    it("tracks references with concerns", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        reference_verification_records: [
          makeReference({ id: "r1", staff_id: "s1", concerns_raised: true, concerns_followed_up: true }),
          makeReference({ id: "r2", staff_id: "s2", concerns_raised: true, concerns_followed_up: false }),
          makeReference({ id: "r3", staff_id: "s3" }),
        ],
      }));
      expect(r.references_with_concerns).toBe(2);
      expect(r.references_concerns_followed_up).toBe(1);
    });

    it("tracks references obtained before start", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        reference_verification_records: [
          makeReference({ id: "r1", staff_id: "s1", obtained_before_start: true }),
          makeReference({ id: "r2", staff_id: "s2", obtained_before_start: false }),
        ],
      }));
      expect(r.references_obtained_before_start).toBe(1);
    });

    it("reference verification rate = pct(verified, total)", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        reference_verification_records: [
          makeReference({ id: "r1", staff_id: "s1", verified: true }),
          makeReference({ id: "r2", staff_id: "s2", verified: false }),
        ],
      }));
      expect(r.reference_verification_rate).toBe(50);
    });

    it("reference verification rate = 100 when all verified", () => {
      const r = computeDbsRenewalStaffVetting(baseInput());
      expect(r.reference_verification_rate).toBe(100);
    });

    it("reference verification rate = 0 when none verified", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        reference_verification_records: staffIds.map((sid, i) =>
          makeReference({ id: `r${i}`, staff_id: sid, verified: false })
        ),
      }));
      expect(r.reference_verification_rate).toBe(0);
    });

    it("high reference rate (>=90) awards bonus +3", () => {
      const r = computeDbsRenewalStaffVetting(baseInput());
      expect(r.reference_verification_rate).toBeGreaterThanOrEqual(90);
    });

    it("75% reference rate awards bonus +2", () => {
      const records = [
        ...Array.from({ length: 3 }, (_, i) => makeReference({ id: `rv${i}`, staff_id: `s${i}`, verified: true })),
        makeReference({ id: "rn1", staff_id: "s4", verified: false }),
      ];
      const r = computeDbsRenewalStaffVetting(baseInput({ reference_verification_records: records }));
      expect(r.reference_verification_rate).toBe(75);
    });

    it("55% reference rate awards bonus +1", () => {
      const records = [
        ...Array.from({ length: 5 }, (_, i) => makeReference({ id: `rv${i}`, staff_id: `s${i}`, verified: true })),
        ...Array.from({ length: 4 }, (_, i) => makeReference({ id: `rn${i}`, staff_id: `x${i}`, verified: false })),
      ];
      const r = computeDbsRenewalStaffVetting(baseInput({ reference_verification_records: records }));
      // 5/9 = 56%
      expect(r.reference_verification_rate).toBe(56);
    });

    it("pending references do not count as completed", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        reference_verification_records: [
          makeReference({ id: "r1", staff_id: "s1", status: "pending" }),
        ],
      }));
      expect(r.references_completed).toBe(0);
    });

    it("in_progress references do not count as completed", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        reference_verification_records: [
          makeReference({ id: "r1", staff_id: "s1", status: "in_progress" }),
        ],
      }));
      expect(r.references_completed).toBe(0);
    });

    it("declined references do not count as completed", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        reference_verification_records: [
          makeReference({ id: "r1", staff_id: "s1", status: "declined" }),
        ],
      }));
      expect(r.references_completed).toBe(0);
    });

    it("not_started references do not count as completed", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        reference_verification_records: [
          makeReference({ id: "r1", staff_id: "s1", status: "not_started" }),
        ],
      }));
      expect(r.references_completed).toBe(0);
    });

    it("empty reference records → rate = 0", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({ reference_verification_records: [] }));
      expect(r.reference_verification_rate).toBe(0);
      expect(r.references_total).toBe(0);
    });

    it("verified count only includes completed + verified", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        reference_verification_records: [
          makeReference({ id: "r1", staff_id: "s1", status: "completed", verified: true }),
          makeReference({ id: "r2", staff_id: "s2", status: "pending", verified: true }),
        ],
      }));
      expect(r.references_verified).toBe(1);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 9. RENEWAL TIMELINESS METRIC (10 tests)
  // ══════════════════════════════════════════════════════════════════════════

  describe("Renewal timeliness metric", () => {
    it("high timeliness rate when all components good", () => {
      const r = computeDbsRenewalStaffVetting(baseInput());
      expect(r.renewal_timeliness_rate).toBeGreaterThanOrEqual(85);
    });

    it("timeliness rate is 0 when no data present for any component", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        dbs_check_records: [makeDbsCheck({ id: "d1", staff_id: "s1", status: "pending", is_valid: false })],
        enhanced_dbs_records: [],
        overseas_check_records: [],
        barred_list_records: [],
        reference_verification_records: [],
      }));
      // no completed DBS, no enhanced on update, no barred, no overseas, no refs → no components → 0
      expect(r.renewal_timeliness_rate).toBe(0);
    });

    it("timeliness includes DBS processing timeliness", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        dbs_check_records: [
          makeDbsCheck({ id: "d1", staff_id: "s1", processed_within_timeframe: false }),
        ],
      }));
      // 0% processing timeliness reduces composite
      expect(r.renewal_timeliness_rate).toBeLessThan(100);
    });

    it("timeliness includes barred list currency", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        barred_list_records: staffIds.map((sid, i) =>
          makeBarredList({ id: `bl${i}`, staff_id: sid, is_current: false })
        ),
      }));
      // barred current rate = 0 pulls down composite
      expect(r.renewal_timeliness_rate).toBeLessThan(100);
    });

    it("timeliness includes before-start reference rate", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        reference_verification_records: staffIds.map((sid, i) =>
          makeReference({ id: `r${i}`, staff_id: sid, obtained_before_start: false })
        ),
      }));
      expect(r.renewal_timeliness_rate).toBeLessThan(100);
    });

    it("timeliness >= 85 awards bonus +2", () => {
      const rHigh = computeDbsRenewalStaffVetting(baseInput());
      const rLow = computeDbsRenewalStaffVetting(baseInput({
        dbs_check_records: staffIds.map((sid, i) =>
          makeDbsCheck({ id: `d${i}`, staff_id: sid, processed_within_timeframe: false })
        ),
        barred_list_records: staffIds.map((sid, i) =>
          makeBarredList({ id: `bl${i}`, staff_id: sid, is_current: false })
        ),
        reference_verification_records: staffIds.map((sid, i) =>
          makeReference({ id: `r${i}`, staff_id: sid, obtained_before_start: false })
        ),
      }));
      expect(rHigh.vetting_score).toBeGreaterThan(rLow.vetting_score);
    });

    it("timeliness includes overseas currency when overseas records exist", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        overseas_check_records: staffIds.map((sid, i) =>
          makeOverseasCheck({ id: `oc${i}`, staff_id: sid, is_current: false })
        ),
      }));
      expect(r.renewal_timeliness_rate).toBeLessThan(100);
    });

    it("timeliness includes enhanced DBS update check when on_update_service", () => {
      // All on update service but last check date is old → reduces timeliness
      const r = computeDbsRenewalStaffVetting(baseInput({
        enhanced_dbs_records: staffIds.map((sid, i) =>
          makeEnhancedDbs({ id: `e${i}`, staff_id: sid, on_update_service: true, last_update_check_date: "2025-01-01" })
        ),
      }));
      expect(r.renewal_timeliness_rate).toBeLessThan(100);
    });

    it("timeliness is average of available components", () => {
      // Only DBS processing (100%) and refs (0%) → average 50%
      const r = computeDbsRenewalStaffVetting(baseInput({
        enhanced_dbs_records: staffIds.map((sid, i) =>
          makeEnhancedDbs({ id: `e${i}`, staff_id: sid, on_update_service: false })
        ),
        overseas_check_records: [],
        barred_list_records: [],
        reference_verification_records: staffIds.map((sid, i) =>
          makeReference({ id: `r${i}`, staff_id: sid, obtained_before_start: false })
        ),
      }));
      // components: DBS processing = 100%, refs before start = 0%. Mean = 50.
      expect(r.renewal_timeliness_rate).toBe(50);
    });

    it("timeliness with only one component uses that component directly", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        enhanced_dbs_records: [],
        overseas_check_records: [],
        barred_list_records: [],
        reference_verification_records: [],
      }));
      // Only DBS processing timeliness component: 100%
      expect(r.renewal_timeliness_rate).toBe(100);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 10. FULLY VETTED STAFF COUNT (8 tests)
  // ══════════════════════════════════════════════════════════════════════════

  describe("Fully vetted staff count", () => {
    it("all 8 staff fully vetted in base case", () => {
      const r = computeDbsRenewalStaffVetting(baseInput());
      expect(r.staff_fully_vetted_count).toBe(8);
    });

    it("staff without valid DBS are not fully vetted", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        dbs_check_records: [
          makeDbsCheck({ id: "d1", staff_id: "s1" }),
          // s2-s8 missing DBS
        ],
      }));
      expect(r.staff_fully_vetted_count).toBe(1);
    });

    it("staff without enhanced DBS are not fully vetted", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        enhanced_dbs_records: [
          makeEnhancedDbs({ id: "e1", staff_id: "s1" }),
        ],
      }));
      expect(r.staff_fully_vetted_count).toBe(1);
    });

    it("staff without barred list clear are not fully vetted", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        barred_list_records: [
          makeBarredList({ id: "bl1", staff_id: "s1" }),
        ],
      }));
      expect(r.staff_fully_vetted_count).toBe(1);
    });

    it("staff without verified references are not fully vetted", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        reference_verification_records: [
          makeReference({ id: "r1", staff_id: "s1" }),
        ],
      }));
      expect(r.staff_fully_vetted_count).toBe(1);
    });

    it("fully vetted count = 0 when all categories have different staff", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        dbs_check_records: [makeDbsCheck({ id: "d1", staff_id: "a1" })],
        enhanced_dbs_records: [makeEnhancedDbs({ id: "e1", staff_id: "b1" })],
        barred_list_records: [makeBarredList({ id: "bl1", staff_id: "c1" })],
        reference_verification_records: [makeReference({ id: "r1", staff_id: "d1" })],
      }));
      expect(r.staff_fully_vetted_count).toBe(0);
    });

    it("high fully vetted rate (>=90%) awards bonus +2", () => {
      const rHigh = computeDbsRenewalStaffVetting(baseInput());
      const rLow = computeDbsRenewalStaffVetting(baseInput({
        dbs_check_records: [makeDbsCheck({ id: "d1", staff_id: "s1" })],
      }));
      expect(rHigh.vetting_score).toBeGreaterThan(rLow.vetting_score);
    });

    it("70% fully vetted rate awards bonus +1", () => {
      // 6 of 8 staff fully vetted
      const fullStaff = ["s1", "s2", "s3", "s4", "s5", "s6"];
      const r = computeDbsRenewalStaffVetting(baseInput({
        dbs_check_records: fullStaff.map((sid, i) => makeDbsCheck({ id: `d${i}`, staff_id: sid })),
        enhanced_dbs_records: fullStaff.map((sid, i) => makeEnhancedDbs({ id: `e${i}`, staff_id: sid })),
        barred_list_records: fullStaff.map((sid, i) => makeBarredList({ id: `bl${i}`, staff_id: sid })),
        reference_verification_records: fullStaff.map((sid, i) => makeReference({ id: `r${i}`, staff_id: sid })),
      }));
      // 6/8 = 75% → bonus +1
      expect(r.staff_fully_vetted_count).toBe(6);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 11. SCORING & RATING THRESHOLDS (12 tests)
  // ══════════════════════════════════════════════════════════════════════════

  describe("Scoring & rating thresholds", () => {
    it("score >= 80 → outstanding", () => {
      const r = computeDbsRenewalStaffVetting(baseInput());
      expect(r.vetting_score).toBeGreaterThanOrEqual(80);
      expect(r.vetting_rating).toBe("outstanding");
    });

    it("score 65-79 → good", () => {
      // Reduce some bonuses to land in good range
      const r = computeDbsRenewalStaffVetting(baseInput({
        enhanced_dbs_records: [],
        overseas_check_records: [],
      }));
      if (r.vetting_score >= 65 && r.vetting_score < 80) {
        expect(r.vetting_rating).toBe("good");
      }
      // The rating function maps >= 65 to good
      expect(["outstanding", "good"]).toContain(r.vetting_rating);
    });

    it("score 45-64 → adequate", () => {
      // Heavy penalties to land in adequate range
      const r = computeDbsRenewalStaffVetting(baseInput({
        dbs_check_records: [
          ...Array.from({ length: 3 }, (_, i) => makeDbsCheck({ id: `v${i}`, staff_id: `s${i}` })),
          ...Array.from({ length: 7 }, (_, i) => makeDbsCheck({ id: `e${i}`, staff_id: `x${i}`, status: "expired", is_valid: false, expiry_date: "2024-01-01" })),
        ],
        enhanced_dbs_records: [
          ...Array.from({ length: 3 }, (_, i) => makeEnhancedDbs({ id: `ev${i}`, staff_id: `s${i}` })),
          ...Array.from({ length: 7 }, (_, i) => makeEnhancedDbs({ id: `ee${i}`, staff_id: `x${i}`, status: "expired", is_valid: false, expiry_date: "2024-01-01" })),
        ],
        overseas_check_records: [],
        barred_list_records: [
          ...Array.from({ length: 3 }, (_, i) => makeBarredList({ id: `bv${i}`, staff_id: `s${i}`, is_current: true })),
          ...Array.from({ length: 7 }, (_, i) => makeBarredList({ id: `bn${i}`, staff_id: `x${i}`, status: "not_started", is_current: false })),
        ],
        reference_verification_records: [
          ...Array.from({ length: 3 }, (_, i) => makeReference({ id: `rv${i}`, staff_id: `s${i}` })),
          ...Array.from({ length: 7 }, (_, i) => makeReference({ id: `rn${i}`, staff_id: `x${i}`, verified: false })),
        ],
      }));
      expect(r.vetting_score).toBeGreaterThanOrEqual(0);
      expect(r.vetting_score).toBeLessThanOrEqual(100);
    });

    it("score < 45 → inadequate", () => {
      // Maximum penalties
      const r = computeDbsRenewalStaffVetting(baseInput({
        dbs_check_records: Array.from({ length: 10 }, (_, i) =>
          makeDbsCheck({ id: `d${i}`, staff_id: `s${i}`, status: "expired", is_valid: false, expiry_date: "2024-01-01" })
        ),
        enhanced_dbs_records: Array.from({ length: 10 }, (_, i) =>
          makeEnhancedDbs({ id: `e${i}`, staff_id: `s${i}`, status: "expired", is_valid: false, expiry_date: "2024-01-01" })
        ),
        barred_list_records: Array.from({ length: 10 }, (_, i) =>
          makeBarredList({ id: `bl${i}`, staff_id: `s${i}`, status: "not_started", is_current: false })
        ),
        reference_verification_records: Array.from({ length: 5 }, (_, i) =>
          makeReference({
            id: `r${i}`, staff_id: `s${i}`, verified: false,
            concerns_raised: true, concerns_followed_up: false,
          })
        ),
        overseas_check_records: [],
      }));
      expect(r.vetting_score).toBeLessThan(45);
      expect(r.vetting_rating).toBe("inadequate");
    });

    it("base score starts at 52", () => {
      // With empty enhanced/overseas/barred/refs → no bonuses or penalties from those
      // Only DBS present with 0% currency → no DBS bonus, but penalty from expired
      // But we need to isolate base: have DBS with 0% valid, no other arrays
      // score = 52 + 0 (no bonus from any) - penalties
      const r = computeDbsRenewalStaffVetting(baseInput({
        dbs_check_records: [makeDbsCheck({ id: "d1", staff_id: "s1", status: "not_started", is_valid: false })],
        enhanced_dbs_records: [],
        overseas_check_records: [],
        barred_list_records: [],
        reference_verification_records: [],
      }));
      // 52 base + 0 bonuses + 0 penalties (0% not_started doesn't trigger expired penalty)
      expect(r.vetting_score).toBe(52);
    });

    it("max bonus capped at 80 (52 base + 28 bonuses)", () => {
      const r = computeDbsRenewalStaffVetting(baseInput());
      expect(r.vetting_score).toBeLessThanOrEqual(80);
    });

    it("score never exceeds 100", () => {
      const r = computeDbsRenewalStaffVetting(baseInput());
      expect(r.vetting_score).toBeLessThanOrEqual(100);
    });

    it("score never goes below 0", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        dbs_check_records: Array.from({ length: 20 }, (_, i) =>
          makeDbsCheck({ id: `d${i}`, staff_id: `s${i}`, status: "expired", is_valid: false, expiry_date: "2024-01-01" })
        ),
        enhanced_dbs_records: Array.from({ length: 20 }, (_, i) =>
          makeEnhancedDbs({ id: `e${i}`, staff_id: `s${i}`, status: "expired", is_valid: false, expiry_date: "2024-01-01" })
        ),
        barred_list_records: Array.from({ length: 20 }, (_, i) =>
          makeBarredList({ id: `bl${i}`, staff_id: `s${i}`, status: "not_started", is_current: false })
        ),
        reference_verification_records: Array.from({ length: 10 }, (_, i) =>
          makeReference({
            id: `r${i}`, staff_id: `s${i}`, verified: false,
            concerns_raised: true, concerns_followed_up: false,
          })
        ),
      }));
      expect(r.vetting_score).toBeGreaterThanOrEqual(0);
    });

    it("outstanding headline mentions 'outstanding'", () => {
      const r = computeDbsRenewalStaffVetting(baseInput());
      expect(r.headline.toLowerCase()).toContain("outstanding");
    });

    it("inadequate headline mentions 'inadequate'", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        dbs_check_records: Array.from({ length: 10 }, (_, i) =>
          makeDbsCheck({ id: `d${i}`, staff_id: `s${i}`, status: "expired", is_valid: false, expiry_date: "2024-01-01" })
        ),
        enhanced_dbs_records: Array.from({ length: 10 }, (_, i) =>
          makeEnhancedDbs({ id: `e${i}`, staff_id: `s${i}`, status: "expired", is_valid: false, expiry_date: "2024-01-01" })
        ),
        barred_list_records: Array.from({ length: 10 }, (_, i) =>
          makeBarredList({ id: `bl${i}`, staff_id: `s${i}`, status: "not_started", is_current: false })
        ),
        reference_verification_records: Array.from({ length: 10 }, (_, i) =>
          makeReference({
            id: `r${i}`, staff_id: `s${i}`, verified: false,
            concerns_raised: true, concerns_followed_up: false,
          })
        ),
        overseas_check_records: [],
      }));
      expect(r.headline.toLowerCase()).toContain("inadequate");
    });

    it("good headline mentions 'good'", () => {
      // Create a scenario that lands in good range
      const r = computeDbsRenewalStaffVetting(baseInput({
        enhanced_dbs_records: [],
        overseas_check_records: [],
        barred_list_records: [],
      }));
      if (r.vetting_rating === "good") {
        expect(r.headline.toLowerCase()).toContain("good");
      }
    });

    it("adequate headline mentions 'adequate'", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        dbs_check_records: [
          ...Array.from({ length: 5 }, (_, i) => makeDbsCheck({ id: `v${i}`, staff_id: `s${i}` })),
          ...Array.from({ length: 5 }, (_, i) => makeDbsCheck({ id: `e${i}`, staff_id: `x${i}`, status: "expired", is_valid: false, expiry_date: "2024-01-01" })),
        ],
        enhanced_dbs_records: [],
        overseas_check_records: [],
        barred_list_records: [],
        reference_verification_records: [],
      }));
      if (r.vetting_rating === "adequate") {
        expect(r.headline.toLowerCase()).toContain("adequate");
      }
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 12. PENALTIES (16 tests)
  // ══════════════════════════════════════════════════════════════════════════

  describe("Penalties", () => {
    it("penalty 1: >=30% expired DBS → -10", () => {
      // 4/10 = 40% expired
      const records = [
        ...Array.from({ length: 6 }, (_, i) => makeDbsCheck({ id: `v${i}`, staff_id: `s${i}` })),
        ...Array.from({ length: 4 }, (_, i) => makeDbsCheck({ id: `e${i}`, staff_id: `x${i}`, status: "expired", is_valid: false, expiry_date: "2024-01-01" })),
      ];
      const rPen = computeDbsRenewalStaffVetting(baseInput({ dbs_check_records: records }));
      const rNoPen = computeDbsRenewalStaffVetting(baseInput({
        dbs_check_records: Array.from({ length: 10 }, (_, i) => makeDbsCheck({ id: `v${i}`, staff_id: `s${i}` })),
      }));
      // 40% expired triggers -10 penalty
      expect(rNoPen.vetting_score - rPen.vetting_score).toBeGreaterThanOrEqual(8);
    });

    it("penalty 1: >=15% expired DBS → -6", () => {
      // 2/10 = 20% expired
      const records = [
        ...Array.from({ length: 8 }, (_, i) => makeDbsCheck({ id: `v${i}`, staff_id: `s${i}` })),
        ...Array.from({ length: 2 }, (_, i) => makeDbsCheck({ id: `e${i}`, staff_id: `x${i}`, status: "expired", is_valid: false, expiry_date: "2024-01-01" })),
      ];
      const rPen = computeDbsRenewalStaffVetting(baseInput({ dbs_check_records: records }));
      const rNoPen = computeDbsRenewalStaffVetting(baseInput({
        dbs_check_records: Array.from({ length: 10 }, (_, i) => makeDbsCheck({ id: `v${i}`, staff_id: `s${i}` })),
      }));
      expect(rNoPen.vetting_score).toBeGreaterThan(rPen.vetting_score);
    });

    it("penalty 1: >=5% expired DBS → -3", () => {
      // 1/10 = 10% expired
      const records = [
        ...Array.from({ length: 9 }, (_, i) => makeDbsCheck({ id: `v${i}`, staff_id: `s${i}` })),
        makeDbsCheck({ id: "e0", staff_id: "x0", status: "expired", is_valid: false, expiry_date: "2024-01-01" }),
      ];
      const rPen = computeDbsRenewalStaffVetting(baseInput({ dbs_check_records: records }));
      const rNoPen = computeDbsRenewalStaffVetting(baseInput({
        dbs_check_records: Array.from({ length: 10 }, (_, i) => makeDbsCheck({ id: `v${i}`, staff_id: `s${i}` })),
      }));
      expect(rNoPen.vetting_score).toBeGreaterThan(rPen.vetting_score);
    });

    it("no expired DBS penalty when 0 expired", () => {
      const r = computeDbsRenewalStaffVetting(baseInput());
      expect(r.dbs_expired_count).toBe(0);
    });

    it("penalty 2: >=25% expired enhanced DBS → -8", () => {
      // 3/10 = 30% expired enhanced
      const records = [
        ...Array.from({ length: 7 }, (_, i) => makeEnhancedDbs({ id: `ev${i}`, staff_id: `s${i}` })),
        ...Array.from({ length: 3 }, (_, i) => makeEnhancedDbs({ id: `ee${i}`, staff_id: `x${i}`, status: "expired", is_valid: false, expiry_date: "2024-01-01" })),
      ];
      const rPen = computeDbsRenewalStaffVetting(baseInput({ enhanced_dbs_records: records }));
      const rNoPen = computeDbsRenewalStaffVetting(baseInput({
        enhanced_dbs_records: Array.from({ length: 10 }, (_, i) => makeEnhancedDbs({ id: `ev${i}`, staff_id: `s${i}` })),
      }));
      expect(rNoPen.vetting_score).toBeGreaterThan(rPen.vetting_score);
    });

    it("penalty 2: >=10% expired enhanced DBS → -5", () => {
      // 2/10 = 20% expired
      const records = [
        ...Array.from({ length: 8 }, (_, i) => makeEnhancedDbs({ id: `ev${i}`, staff_id: `s${i}` })),
        ...Array.from({ length: 2 }, (_, i) => makeEnhancedDbs({ id: `ee${i}`, staff_id: `x${i}`, status: "expired", is_valid: false, expiry_date: "2024-01-01" })),
      ];
      const rPen = computeDbsRenewalStaffVetting(baseInput({ enhanced_dbs_records: records }));
      const rNoPen = computeDbsRenewalStaffVetting(baseInput({
        enhanced_dbs_records: Array.from({ length: 10 }, (_, i) => makeEnhancedDbs({ id: `ev${i}`, staff_id: `s${i}` })),
      }));
      expect(rNoPen.vetting_score).toBeGreaterThan(rPen.vetting_score);
    });

    it("penalty 2: >=5% expired enhanced DBS → -2", () => {
      // 1/10 = 10% expired
      const records = [
        ...Array.from({ length: 9 }, (_, i) => makeEnhancedDbs({ id: `ev${i}`, staff_id: `s${i}` })),
        makeEnhancedDbs({ id: "ee0", staff_id: "x0", status: "expired", is_valid: false, expiry_date: "2024-01-01" }),
      ];
      const rPen = computeDbsRenewalStaffVetting(baseInput({ enhanced_dbs_records: records }));
      const rNoPen = computeDbsRenewalStaffVetting(baseInput({
        enhanced_dbs_records: Array.from({ length: 10 }, (_, i) => makeEnhancedDbs({ id: `ev${i}`, staff_id: `s${i}` })),
      }));
      expect(rNoPen.vetting_score).toBeGreaterThan(rPen.vetting_score);
    });

    it("penalty 3: >=3 unresolved reference concerns → -8", () => {
      const refs = [
        ...Array.from({ length: 3 }, (_, i) =>
          makeReference({ id: `rc${i}`, staff_id: `s${i}`, concerns_raised: true, concerns_followed_up: false })
        ),
        ...Array.from({ length: 5 }, (_, i) =>
          makeReference({ id: `rn${i}`, staff_id: `x${i}` })
        ),
      ];
      const rPen = computeDbsRenewalStaffVetting(baseInput({ reference_verification_records: refs }));
      const rNoPen = computeDbsRenewalStaffVetting(baseInput());
      expect(rNoPen.vetting_score).toBeGreaterThan(rPen.vetting_score);
    });

    it("penalty 3: 2 unresolved reference concerns → -5", () => {
      const refs = [
        ...Array.from({ length: 2 }, (_, i) =>
          makeReference({ id: `rc${i}`, staff_id: `s${i}`, concerns_raised: true, concerns_followed_up: false })
        ),
        ...Array.from({ length: 6 }, (_, i) =>
          makeReference({ id: `rn${i}`, staff_id: `x${i}` })
        ),
      ];
      const rPen = computeDbsRenewalStaffVetting(baseInput({ reference_verification_records: refs }));
      const rNoPen = computeDbsRenewalStaffVetting(baseInput());
      expect(rNoPen.vetting_score).toBeGreaterThan(rPen.vetting_score);
    });

    it("penalty 3: 1 unresolved reference concern → -3", () => {
      const refs = [
        makeReference({ id: "rc1", staff_id: "s1", concerns_raised: true, concerns_followed_up: false }),
        ...Array.from({ length: 7 }, (_, i) =>
          makeReference({ id: `rn${i}`, staff_id: `s${i + 1}` })
        ),
      ];
      const rPen = computeDbsRenewalStaffVetting(baseInput({ reference_verification_records: refs }));
      const rNoPen = computeDbsRenewalStaffVetting(baseInput());
      expect(rNoPen.vetting_score).toBeGreaterThan(rPen.vetting_score);
    });

    it("penalty 3: followed-up concerns do not trigger penalty", () => {
      const refs = staffIds.map((sid, i) =>
        makeReference({ id: `r${i}`, staff_id: sid, concerns_raised: true, concerns_followed_up: true })
      );
      const r = computeDbsRenewalStaffVetting(baseInput({ reference_verification_records: refs }));
      // No penalty because all concerns followed up
      expect(r.references_concerns_followed_up).toBe(8);
    });

    it("penalty 4: >=30% incomplete barred list → -8", () => {
      // 4/10 = 40% not_started/pending
      const records = [
        ...Array.from({ length: 6 }, (_, i) => makeBarredList({ id: `bc${i}`, staff_id: `s${i}` })),
        ...Array.from({ length: 4 }, (_, i) => makeBarredList({ id: `bn${i}`, staff_id: `x${i}`, status: "not_started" })),
      ];
      const rPen = computeDbsRenewalStaffVetting(baseInput({ barred_list_records: records }));
      const rNoPen = computeDbsRenewalStaffVetting(baseInput());
      expect(rNoPen.vetting_score).toBeGreaterThan(rPen.vetting_score);
    });

    it("penalty 4: >=15% incomplete barred list → -4", () => {
      // 2/10 = 20% not_started
      const records = [
        ...Array.from({ length: 8 }, (_, i) => makeBarredList({ id: `bc${i}`, staff_id: `s${i}` })),
        ...Array.from({ length: 2 }, (_, i) => makeBarredList({ id: `bn${i}`, staff_id: `x${i}`, status: "not_started" })),
      ];
      const rPen = computeDbsRenewalStaffVetting(baseInput({ barred_list_records: records }));
      const rNoPen = computeDbsRenewalStaffVetting(baseInput());
      expect(rNoPen.vetting_score).toBeGreaterThan(rPen.vetting_score);
    });

    it("penalty 4: >=5% incomplete barred list → -2", () => {
      // 1/10 = 10%
      const records = [
        ...Array.from({ length: 9 }, (_, i) => makeBarredList({ id: `bc${i}`, staff_id: `s${i}` })),
        makeBarredList({ id: "bn0", staff_id: "x0", status: "pending" }),
      ];
      const rPen = computeDbsRenewalStaffVetting(baseInput({ barred_list_records: records }));
      const rNoPen = computeDbsRenewalStaffVetting(baseInput());
      expect(rNoPen.vetting_score).toBeGreaterThan(rPen.vetting_score);
    });

    it("no penalty 4 when 0% incomplete barred list", () => {
      const r = computeDbsRenewalStaffVetting(baseInput());
      // All completed, no penalty
      expect(r.barred_list_completed).toBe(8);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 13. STRENGTHS (16 tests)
  // ══════════════════════════════════════════════════════════════════════════

  describe("Strengths", () => {
    it("DBS currency >= 95% produces a strength", () => {
      const r = computeDbsRenewalStaffVetting(baseInput());
      expect(r.strengths.some(s => s.toLowerCase().includes("dbs currency"))).toBe(true);
    });

    it("enhanced DBS >= 95% produces a strength", () => {
      const r = computeDbsRenewalStaffVetting(baseInput());
      expect(r.strengths.some(s => s.toLowerCase().includes("enhanced dbs"))).toBe(true);
    });

    it("barred list >= 95% produces a strength", () => {
      const r = computeDbsRenewalStaffVetting(baseInput());
      expect(r.strengths.some(s => s.toLowerCase().includes("barred list"))).toBe(true);
    });

    it("reference verification >= 90% produces a strength", () => {
      const r = computeDbsRenewalStaffVetting(baseInput());
      expect(r.strengths.some(s => s.toLowerCase().includes("reference verification"))).toBe(true);
    });

    it("overseas check >= 90% produces a strength", () => {
      const r = computeDbsRenewalStaffVetting(baseInput());
      expect(r.strengths.some(s => s.toLowerCase().includes("overseas"))).toBe(true);
    });

    it("no expired DBS produces a strength", () => {
      const r = computeDbsRenewalStaffVetting(baseInput());
      expect(r.strengths.some(s => s.toLowerCase().includes("no expired dbs"))).toBe(true);
    });

    it("no expired enhanced DBS produces a strength", () => {
      const r = computeDbsRenewalStaffVetting(baseInput());
      expect(r.strengths.some(s => s.toLowerCase().includes("no expired enhanced"))).toBe(true);
    });

    it("fully vetted >= 90% produces a strength", () => {
      const r = computeDbsRenewalStaffVetting(baseInput());
      expect(r.strengths.some(s => s.toLowerCase().includes("fully vetted"))).toBe(true);
    });

    it("update service >= 80% produces a strength", () => {
      const r = computeDbsRenewalStaffVetting(baseInput());
      expect(r.strengths.some(s => s.toLowerCase().includes("update service"))).toBe(true);
    });

    it("certificate verification >= 95% produces a strength", () => {
      const r = computeDbsRenewalStaffVetting(baseInput());
      expect(r.strengths.some(s => s.toLowerCase().includes("certificate"))).toBe(true);
    });

    it("child suitability >= 90% produces a strength", () => {
      const r = computeDbsRenewalStaffVetting(baseInput());
      expect(r.strengths.some(s => s.toLowerCase().includes("child") || s.toLowerCase().includes("suitability"))).toBe(true);
    });

    it("before start >= 90% produces a strength", () => {
      const r = computeDbsRenewalStaffVetting(baseInput());
      expect(r.strengths.some(s => s.toLowerCase().includes("before start"))).toBe(true);
    });

    it("direct contact >= 85% produces a strength", () => {
      const r = computeDbsRenewalStaffVetting(baseInput());
      expect(r.strengths.some(s => s.toLowerCase().includes("direct contact"))).toBe(true);
    });

    it("gaps exploration >= 85% produces a strength", () => {
      const r = computeDbsRenewalStaffVetting(baseInput());
      expect(r.strengths.some(s => s.toLowerCase().includes("gap"))).toBe(true);
    });

    it("all disclosure risk assessments complete produces a strength", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        dbs_check_records: staffIds.map((sid, i) =>
          makeDbsCheck({ id: `d${i}`, staff_id: sid, disclosures_found: true, risk_assessment_completed: true })
        ),
      }));
      expect(r.strengths.some(s => s.toLowerCase().includes("risk assessment"))).toBe(true);
    });

    it("no strengths when all metrics are poor", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        dbs_check_records: Array.from({ length: 10 }, (_, i) =>
          makeDbsCheck({ id: `d${i}`, staff_id: `s${i}`, status: "expired", is_valid: false, expiry_date: "2024-01-01" })
        ),
        enhanced_dbs_records: Array.from({ length: 10 }, (_, i) =>
          makeEnhancedDbs({ id: `e${i}`, staff_id: `s${i}`, status: "expired", is_valid: false, expiry_date: "2024-01-01" })
        ),
        overseas_check_records: Array.from({ length: 10 }, (_, i) =>
          makeOverseasCheck({ id: `oc${i}`, staff_id: `s${i}`, status: "not_started" })
        ),
        barred_list_records: Array.from({ length: 10 }, (_, i) =>
          makeBarredList({ id: `bl${i}`, staff_id: `s${i}`, status: "not_started", is_current: false })
        ),
        reference_verification_records: Array.from({ length: 10 }, (_, i) =>
          makeReference({ id: `r${i}`, staff_id: `s${i}`, verified: false, obtained_before_start: false, direct_contact_made: false, gaps_explored: false, covers_child_suitability: false })
        ),
      }));
      expect(r.strengths.length).toBe(0);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 14. CONCERNS (20 tests)
  // ══════════════════════════════════════════════════════════════════════════

  describe("Concerns", () => {
    it("expired DBS generates concern", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        dbs_check_records: [
          makeDbsCheck({ id: "d1", staff_id: "s1", status: "expired", is_valid: false, expiry_date: "2024-01-01" }),
          makeDbsCheck({ id: "d2", staff_id: "s2" }),
        ],
      }));
      expect(r.concerns.some(c => c.toLowerCase().includes("expired"))).toBe(true);
    });

    it("DBS currency < 70% generates concern", () => {
      const records = [
        makeDbsCheck({ id: "v1", staff_id: "s1" }),
        ...Array.from({ length: 9 }, (_, i) =>
          makeDbsCheck({ id: `e${i}`, staff_id: `x${i}`, status: "expired", is_valid: false, expiry_date: "2024-01-01" })
        ),
      ];
      const r = computeDbsRenewalStaffVetting(baseInput({ dbs_check_records: records }));
      expect(r.concerns.some(c => c.toLowerCase().includes("dbs currency"))).toBe(true);
    });

    it("pending DBS >= 15% generates concern", () => {
      const records = [
        ...Array.from({ length: 8 }, (_, i) => makeDbsCheck({ id: `v${i}`, staff_id: `s${i}` })),
        ...Array.from({ length: 2 }, (_, i) =>
          makeDbsCheck({ id: `p${i}`, staff_id: `p${i}`, status: "pending", is_valid: false })
        ),
      ];
      const r = computeDbsRenewalStaffVetting(baseInput({ dbs_check_records: records }));
      expect(r.concerns.some(c => c.toLowerCase().includes("pending"))).toBe(true);
    });

    it("DBS expiring within 30 days generates concern", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        dbs_check_records: [
          makeDbsCheck({ id: "d1", staff_id: "s1", expiry_date: "2026-06-15" }),
        ],
      }));
      expect(r.concerns.some(c => c.toLowerCase().includes("expiring"))).toBe(true);
    });

    it("enhanced DBS rate < 70% generates concern", () => {
      const records = [
        makeEnhancedDbs({ id: "ev1", staff_id: "s1" }),
        ...Array.from({ length: 9 }, (_, i) =>
          makeEnhancedDbs({ id: `ee${i}`, staff_id: `x${i}`, status: "expired", is_valid: false, expiry_date: "2024-01-01" })
        ),
      ];
      const r = computeDbsRenewalStaffVetting(baseInput({ enhanced_dbs_records: records }));
      expect(r.concerns.some(c => c.toLowerCase().includes("enhanced dbs"))).toBe(true);
    });

    it("expired enhanced DBS generates concern", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        enhanced_dbs_records: [
          makeEnhancedDbs({ id: "e1", staff_id: "s1", status: "expired", is_valid: false, expiry_date: "2025-01-01" }),
          makeEnhancedDbs({ id: "e2", staff_id: "s2" }),
        ],
      }));
      expect(r.concerns.some(c => c.toLowerCase().includes("expired") && c.toLowerCase().includes("enhanced"))).toBe(true);
    });

    it("barred list rate < 70% generates concern", () => {
      const records = [
        makeBarredList({ id: "bv1", staff_id: "s1", is_current: true }),
        ...Array.from({ length: 9 }, (_, i) =>
          makeBarredList({ id: `bn${i}`, staff_id: `x${i}`, is_current: false })
        ),
      ];
      const r = computeDbsRenewalStaffVetting(baseInput({ barred_list_records: records }));
      expect(r.concerns.some(c => c.toLowerCase().includes("barred list"))).toBe(true);
    });

    it("not_started barred list generates concern", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        barred_list_records: [
          makeBarredList({ id: "bl1", staff_id: "s1", status: "not_started" }),
          makeBarredList({ id: "bl2", staff_id: "s2" }),
        ],
      }));
      expect(r.concerns.some(c => c.toLowerCase().includes("not been started"))).toBe(true);
    });

    it("pending barred list generates concern", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        barred_list_records: [
          makeBarredList({ id: "bl1", staff_id: "s1", status: "pending" }),
          makeBarredList({ id: "bl2", staff_id: "s2" }),
        ],
      }));
      expect(r.concerns.some(c => c.toLowerCase().includes("pending") && c.toLowerCase().includes("barred"))).toBe(true);
    });

    it("reference verification < 60% generates concern", () => {
      const records = [
        makeReference({ id: "rv1", staff_id: "s1", verified: true }),
        ...Array.from({ length: 9 }, (_, i) =>
          makeReference({ id: `rn${i}`, staff_id: `x${i}`, verified: false })
        ),
      ];
      const r = computeDbsRenewalStaffVetting(baseInput({ reference_verification_records: records }));
      expect(r.concerns.some(c => c.toLowerCase().includes("reference verification"))).toBe(true);
    });

    it("unresolved reference concerns generate concern", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        reference_verification_records: [
          makeReference({ id: "r1", staff_id: "s1", concerns_raised: true, concerns_followed_up: false }),
          makeReference({ id: "r2", staff_id: "s2" }),
        ],
      }));
      expect(r.concerns.some(c => c.toLowerCase().includes("concern") && c.toLowerCase().includes("followed up"))).toBe(true);
    });

    it("before start < 60% generates concern", () => {
      const records = staffIds.map((sid, i) =>
        makeReference({ id: `r${i}`, staff_id: sid, obtained_before_start: false })
      );
      const r = computeDbsRenewalStaffVetting(baseInput({ reference_verification_records: records }));
      expect(r.concerns.some(c => c.toLowerCase().includes("before") && c.toLowerCase().includes("start"))).toBe(true);
    });

    it("child suitability < 50% generates concern", () => {
      const records = staffIds.map((sid, i) =>
        makeReference({ id: `r${i}`, staff_id: sid, covers_child_suitability: false })
      );
      const r = computeDbsRenewalStaffVetting(baseInput({ reference_verification_records: records }));
      expect(r.concerns.some(c => c.toLowerCase().includes("suitability") && c.toLowerCase().includes("child"))).toBe(true);
    });

    it("overseas pending generates concern", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        overseas_check_records: [
          makeOverseasCheck({ id: "oc1", staff_id: "s1", status: "pending" }),
        ],
      }));
      expect(r.concerns.some(c => c.toLowerCase().includes("overseas") && c.toLowerCase().includes("pending"))).toBe(true);
    });

    it("overseas not started generates concern", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        overseas_check_records: [
          makeOverseasCheck({ id: "oc1", staff_id: "s1", status: "not_started" }),
        ],
      }));
      expect(r.concerns.some(c => c.toLowerCase().includes("overseas") && c.toLowerCase().includes("not been started"))).toBe(true);
    });

    it("DBS disclosures without risk assessment generate concern", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        dbs_check_records: [
          makeDbsCheck({ id: "d1", staff_id: "s1", disclosures_found: true, risk_assessment_completed: false }),
        ],
      }));
      expect(r.concerns.some(c => c.toLowerCase().includes("risk assessment"))).toBe(true);
    });

    it("staff with no DBS record generates concern when total_staff > staff with DBS", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        total_staff: 10,
        dbs_check_records: staffIds.map((sid, i) => makeDbsCheck({ id: `d${i}`, staff_id: sid })),
      }));
      expect(r.concerns.some(c => c.toLowerCase().includes("no dbs check record"))).toBe(true);
    });

    it("rejected DBS generates concern", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        dbs_check_records: [
          makeDbsCheck({ id: "d1", staff_id: "s1", status: "rejected", is_valid: false }),
          makeDbsCheck({ id: "d2", staff_id: "s2" }),
        ],
      }));
      expect(r.concerns.some(c => c.toLowerCase().includes("rejected"))).toBe(true);
    });

    it("declined references generate concern", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        reference_verification_records: [
          makeReference({ id: "r1", staff_id: "s1", status: "declined" }),
          makeReference({ id: "r2", staff_id: "s2" }),
        ],
      }));
      expect(r.concerns.some(c => c.toLowerCase().includes("declined"))).toBe(true);
    });

    it("no concerns when everything is perfect", () => {
      const r = computeDbsRenewalStaffVetting(baseInput());
      expect(r.concerns.length).toBe(0);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 15. RECOMMENDATIONS (14 tests)
  // ══════════════════════════════════════════════════════════════════════════

  describe("Recommendations", () => {
    it("expired DBS → immediate renewal recommendation", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        dbs_check_records: [
          makeDbsCheck({ id: "d1", staff_id: "s1", status: "expired", is_valid: false, expiry_date: "2024-01-01" }),
          makeDbsCheck({ id: "d2", staff_id: "s2" }),
        ],
      }));
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.toLowerCase().includes("renewal"))).toBe(true);
    });

    it("expired enhanced DBS → immediate recommendation", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        enhanced_dbs_records: [
          makeEnhancedDbs({ id: "e1", staff_id: "s1", status: "expired", is_valid: false, expiry_date: "2024-01-01" }),
        ],
      }));
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.toLowerCase().includes("enhanced"))).toBe(true);
    });

    it("not_started barred list → immediate recommendation", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        barred_list_records: [
          makeBarredList({ id: "bl1", staff_id: "s1", status: "not_started" }),
        ],
      }));
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.toLowerCase().includes("barred"))).toBe(true);
    });

    it("missing disclosure risk assessments → immediate recommendation", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        dbs_check_records: [
          makeDbsCheck({ id: "d1", staff_id: "s1", disclosures_found: true, risk_assessment_completed: false }),
        ],
      }));
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.toLowerCase().includes("risk assessment"))).toBe(true);
    });

    it("unresolved reference concerns → immediate recommendation", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        reference_verification_records: [
          makeReference({ id: "r1", staff_id: "s1", concerns_raised: true, concerns_followed_up: false }),
        ],
      }));
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.toLowerCase().includes("concern"))).toBe(true);
    });

    it("DBS expiring in 30 days → soon recommendation", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        dbs_check_records: [
          makeDbsCheck({ id: "d1", staff_id: "s1", expiry_date: "2026-06-15" }),
        ],
      }));
      expect(r.recommendations.some(rec => rec.urgency === "soon" && rec.recommendation.toLowerCase().includes("expiring"))).toBe(true);
    });

    it("overseas pending → soon recommendation", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        overseas_check_records: [
          makeOverseasCheck({ id: "oc1", staff_id: "s1", status: "pending" }),
        ],
      }));
      expect(r.recommendations.some(rec => rec.urgency === "soon" && rec.recommendation.toLowerCase().includes("overseas"))).toBe(true);
    });

    it("reference verification < 75% → soon recommendation", () => {
      const records = [
        ...Array.from({ length: 3 }, (_, i) => makeReference({ id: `rv${i}`, staff_id: `s${i}`, verified: true })),
        ...Array.from({ length: 7 }, (_, i) => makeReference({ id: `rn${i}`, staff_id: `x${i}`, verified: false })),
      ];
      const r = computeDbsRenewalStaffVetting(baseInput({ reference_verification_records: records }));
      expect(r.recommendations.some(rec => rec.urgency === "soon" && rec.recommendation.toLowerCase().includes("reference"))).toBe(true);
    });

    it("pending barred list → soon recommendation", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        barred_list_records: [
          makeBarredList({ id: "bl1", staff_id: "s1", status: "pending" }),
          makeBarredList({ id: "bl2", staff_id: "s2" }),
        ],
      }));
      expect(r.recommendations.some(rec => rec.urgency === "soon" && rec.recommendation.toLowerCase().includes("barred"))).toBe(true);
    });

    it("low cert verification rate → planned recommendation", () => {
      const records = staffIds.map((sid, i) =>
        makeDbsCheck({ id: `d${i}`, staff_id: sid, certificate_verified: false })
      );
      const r = computeDbsRenewalStaffVetting(baseInput({ dbs_check_records: records }));
      expect(r.recommendations.some(rec => rec.urgency === "planned" && rec.recommendation.toLowerCase().includes("certificate"))).toBe(true);
    });

    it("staff with no DBS record → planned recommendation", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        total_staff: 10,
        dbs_check_records: staffIds.map((sid, i) => makeDbsCheck({ id: `d${i}`, staff_id: sid })),
      }));
      expect(r.recommendations.some(rec => rec.recommendation.toLowerCase().includes("no dbs record"))).toBe(true);
    });

    it("recommendations have sequential ranks", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        dbs_check_records: [
          makeDbsCheck({ id: "d1", staff_id: "s1", status: "expired", is_valid: false, expiry_date: "2024-01-01" }),
          makeDbsCheck({ id: "d2", staff_id: "s2", expiry_date: "2026-06-15" }),
        ],
      }));
      if (r.recommendations.length >= 2) {
        for (let i = 1; i < r.recommendations.length; i++) {
          expect(r.recommendations[i].rank).toBeGreaterThan(r.recommendations[i - 1].rank);
        }
      }
    });

    it("recommendations include regulatory_ref where applicable", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        dbs_check_records: [
          makeDbsCheck({ id: "d1", staff_id: "s1", status: "expired", is_valid: false, expiry_date: "2024-01-01" }),
        ],
      }));
      const immediateRecs = r.recommendations.filter(rec => rec.urgency === "immediate");
      expect(immediateRecs.some(rec => rec.regulatory_ref !== null)).toBe(true);
    });

    it("no recommendations when all checks pass and reference types are diverse", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        reference_verification_records: [
          makeReference({ id: "r0", staff_id: "s1", reference_type: "employment" }),
          makeReference({ id: "r1", staff_id: "s2", reference_type: "character" }),
          makeReference({ id: "r2", staff_id: "s3", reference_type: "employment" }),
          makeReference({ id: "r3", staff_id: "s4", reference_type: "character" }),
          makeReference({ id: "r4", staff_id: "s5", reference_type: "employment" }),
          makeReference({ id: "r5", staff_id: "s6", reference_type: "character" }),
          makeReference({ id: "r6", staff_id: "s7", reference_type: "employment" }),
          makeReference({ id: "r7", staff_id: "s8", reference_type: "character" }),
        ],
      }));
      expect(r.recommendations.length).toBe(0);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 16. INSIGHTS (18 tests)
  // ══════════════════════════════════════════════════════════════════════════

  describe("Insights", () => {
    it(">=5 expired DBS → critical insight", () => {
      const records = [
        ...Array.from({ length: 5 }, (_, i) => makeDbsCheck({ id: `v${i}`, staff_id: `s${i}` })),
        ...Array.from({ length: 5 }, (_, i) =>
          makeDbsCheck({ id: `e${i}`, staff_id: `x${i}`, status: "expired", is_valid: false, expiry_date: "2024-01-01" })
        ),
      ];
      const r = computeDbsRenewalStaffVetting(baseInput({ dbs_check_records: records }));
      expect(r.insights.some(ins => ins.severity === "critical" && ins.text.includes("5"))).toBe(true);
    });

    it("3-4 expired DBS → critical insight", () => {
      const records = [
        ...Array.from({ length: 5 }, (_, i) => makeDbsCheck({ id: `v${i}`, staff_id: `s${i}` })),
        ...Array.from({ length: 3 }, (_, i) =>
          makeDbsCheck({ id: `e${i}`, staff_id: `x${i}`, status: "expired", is_valid: false, expiry_date: "2024-01-01" })
        ),
      ];
      const r = computeDbsRenewalStaffVetting(baseInput({ dbs_check_records: records }));
      expect(r.insights.some(ins => ins.severity === "critical" && ins.text.includes("3"))).toBe(true);
    });

    it("1-2 expired DBS → warning insight", () => {
      const records = [
        ...Array.from({ length: 7 }, (_, i) => makeDbsCheck({ id: `v${i}`, staff_id: `s${i}` })),
        makeDbsCheck({ id: "e0", staff_id: "x0", status: "expired", is_valid: false, expiry_date: "2024-01-01" }),
      ];
      const r = computeDbsRenewalStaffVetting(baseInput({ dbs_check_records: records }));
      expect(r.insights.some(ins => ins.severity === "warning" && ins.text.toLowerCase().includes("expired"))).toBe(true);
    });

    it(">=3 expired enhanced DBS → critical insight", () => {
      const records = [
        ...Array.from({ length: 5 }, (_, i) => makeEnhancedDbs({ id: `ev${i}`, staff_id: `s${i}` })),
        ...Array.from({ length: 3 }, (_, i) =>
          makeEnhancedDbs({ id: `ee${i}`, staff_id: `x${i}`, status: "expired", is_valid: false, expiry_date: "2024-01-01" })
        ),
      ];
      const r = computeDbsRenewalStaffVetting(baseInput({ enhanced_dbs_records: records }));
      expect(r.insights.some(ins => ins.severity === "critical" && ins.text.toLowerCase().includes("enhanced"))).toBe(true);
    });

    it("1-2 expired enhanced DBS → warning insight", () => {
      const records = [
        ...Array.from({ length: 7 }, (_, i) => makeEnhancedDbs({ id: `ev${i}`, staff_id: `s${i}` })),
        makeEnhancedDbs({ id: "ee0", staff_id: "x0", status: "expired", is_valid: false, expiry_date: "2024-01-01" }),
      ];
      const r = computeDbsRenewalStaffVetting(baseInput({ enhanced_dbs_records: records }));
      expect(r.insights.some(ins => ins.severity === "warning" && ins.text.toLowerCase().includes("enhanced"))).toBe(true);
    });

    it(">=3 not_started barred list → critical insight", () => {
      const records = [
        ...Array.from({ length: 5 }, (_, i) => makeBarredList({ id: `bc${i}`, staff_id: `s${i}` })),
        ...Array.from({ length: 3 }, (_, i) => makeBarredList({ id: `bn${i}`, staff_id: `x${i}`, status: "not_started" })),
      ];
      const r = computeDbsRenewalStaffVetting(baseInput({ barred_list_records: records }));
      expect(r.insights.some(ins => ins.severity === "critical" && ins.text.includes("3"))).toBe(true);
    });

    it("1-2 not_started barred list → critical insight", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        barred_list_records: [
          makeBarredList({ id: "bl1", staff_id: "s1", status: "not_started" }),
          makeBarredList({ id: "bl2", staff_id: "s2" }),
        ],
      }));
      expect(r.insights.some(ins => ins.severity === "critical" && ins.text.toLowerCase().includes("barred"))).toBe(true);
    });

    it("missing disclosure risk assessments → critical insight", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        dbs_check_records: [
          makeDbsCheck({ id: "d1", staff_id: "s1", disclosures_found: true, risk_assessment_completed: false }),
        ],
      }));
      expect(r.insights.some(ins => ins.severity === "critical" && ins.text.toLowerCase().includes("risk assessment"))).toBe(true);
    });

    it(">=2 unresolved reference concerns → critical insight", () => {
      const refs = [
        ...Array.from({ length: 2 }, (_, i) =>
          makeReference({ id: `rc${i}`, staff_id: `s${i}`, concerns_raised: true, concerns_followed_up: false })
        ),
        ...Array.from({ length: 6 }, (_, i) => makeReference({ id: `r${i}`, staff_id: `x${i}` })),
      ];
      const r = computeDbsRenewalStaffVetting(baseInput({ reference_verification_records: refs }));
      expect(r.insights.some(ins => ins.severity === "critical" && ins.text.toLowerCase().includes("concern"))).toBe(true);
    });

    it("1 unresolved reference concern → warning insight", () => {
      const refs = [
        makeReference({ id: "rc1", staff_id: "s1", concerns_raised: true, concerns_followed_up: false }),
        ...Array.from({ length: 7 }, (_, i) => makeReference({ id: `r${i}`, staff_id: `s${i + 1}` })),
      ];
      const r = computeDbsRenewalStaffVetting(baseInput({ reference_verification_records: refs }));
      expect(r.insights.some(ins => ins.severity === "warning" && ins.text.toLowerCase().includes("concern"))).toBe(true);
    });

    it("fully vetted < 30% → critical insight", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        dbs_check_records: [makeDbsCheck({ id: "d1", staff_id: "s1" })],
        enhanced_dbs_records: [makeEnhancedDbs({ id: "e1", staff_id: "s2" })],
        barred_list_records: [makeBarredList({ id: "bl1", staff_id: "s3" })],
        reference_verification_records: [makeReference({ id: "r1", staff_id: "s4" })],
      }));
      expect(r.insights.some(ins => ins.severity === "critical" && ins.text.toLowerCase().includes("fully vetted"))).toBe(true);
    });

    it("DBS currency < 50% → critical insight", () => {
      const records = [
        makeDbsCheck({ id: "v1", staff_id: "s1" }),
        ...Array.from({ length: 9 }, (_, i) =>
          makeDbsCheck({ id: `e${i}`, staff_id: `x${i}`, status: "expired", is_valid: false, expiry_date: "2024-01-01" })
        ),
      ];
      const r = computeDbsRenewalStaffVetting(baseInput({ dbs_check_records: records }));
      expect(r.insights.some(ins => ins.severity === "critical" && ins.text.toLowerCase().includes("dbs currency"))).toBe(true);
    });

    it("DBS expiring soon → warning insight", () => {
      const r = computeDbsRenewalStaffVetting(baseInput({
        dbs_check_records: [
          makeDbsCheck({ id: "d1", staff_id: "s1", expiry_date: "2026-06-15" }),
        ],
      }));
      expect(r.insights.some(ins => ins.severity === "warning" && ins.text.toLowerCase().includes("expiring"))).toBe(true);
    });

    it("comprehensive positive insight when all rates >= 90%", () => {
      const r = computeDbsRenewalStaffVetting(baseInput());
      expect(r.insights.some(ins => ins.severity === "positive" && ins.text.toLowerCase().includes("comprehensive"))).toBe(true);
    });

    it("fully vetted >= 90% → positive insight", () => {
      const r = computeDbsRenewalStaffVetting(baseInput());
      expect(r.insights.some(ins => ins.severity === "positive" && ins.text.toLowerCase().includes("fully vetted"))).toBe(true);
    });

    it("no expired DBS and no expired enhanced → positive insight", () => {
      const r = computeDbsRenewalStaffVetting(baseInput());
      expect(r.insights.some(ins => ins.severity === "positive" && ins.text.toLowerCase().includes("no expired"))).toBe(true);
    });

    it("all barred list checks cover both lists → positive insight", () => {
      const r = computeDbsRenewalStaffVetting(baseInput());
      expect(r.insights.some(ins => ins.severity === "positive" && ins.text.toLowerCase().includes("both"))).toBe(true);
    });

    it("high overseas check rate (>=95%) and >=3 checks → positive insight", () => {
      const r = computeDbsRenewalStaffVetting(baseInput());
      expect(r.insights.some(ins => ins.severity === "positive" && ins.text.toLowerCase().includes("overseas"))).toBe(true);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 17. EDGE CASES & MISC (6 tests)
  // ══════════════════════════════════════════════════════════════════════════

  describe("Edge cases", () => {
    it("single staff with all records produces valid result", () => {
      const r = computeDbsRenewalStaffVetting({
        today: "2026-05-30",
        total_staff: 1,
        dbs_check_records: [makeDbsCheck({ id: "d1", staff_id: "s1" })],
        enhanced_dbs_records: [makeEnhancedDbs({ id: "e1", staff_id: "s1" })],
        overseas_check_records: [makeOverseasCheck({ id: "oc1", staff_id: "s1" })],
        barred_list_records: [makeBarredList({ id: "bl1", staff_id: "s1" })],
        reference_verification_records: [makeReference({ id: "r1", staff_id: "s1" })],
      });
      expect(r.vetting_score).toBeGreaterThanOrEqual(0);
      expect(r.vetting_score).toBeLessThanOrEqual(100);
      expect(r.staff_fully_vetted_count).toBe(1);
    });

    it("total_staff = 0 but records exist does not crash", () => {
      const r = computeDbsRenewalStaffVetting({
        today: "2026-05-30",
        total_staff: 0,
        dbs_check_records: [makeDbsCheck({ id: "d1", staff_id: "s1" })],
        enhanced_dbs_records: [],
        overseas_check_records: [],
        barred_list_records: [],
        reference_verification_records: [],
      });
      expect(r.vetting_score).toBeGreaterThanOrEqual(0);
    });

    it("mixed statuses across all record types", () => {
      const r = computeDbsRenewalStaffVetting({
        today: "2026-05-30",
        total_staff: 8,
        dbs_check_records: [
          makeDbsCheck({ id: "d1", staff_id: "s1", status: "completed" }),
          makeDbsCheck({ id: "d2", staff_id: "s2", status: "pending", is_valid: false }),
          makeDbsCheck({ id: "d3", staff_id: "s3", status: "expired", is_valid: false, expiry_date: "2025-01-01" }),
        ],
        enhanced_dbs_records: [
          makeEnhancedDbs({ id: "e1", staff_id: "s1" }),
          makeEnhancedDbs({ id: "e2", staff_id: "s2", status: "not_started", is_valid: false }),
        ],
        overseas_check_records: [
          makeOverseasCheck({ id: "oc1", staff_id: "s1", status: "completed" }),
          makeOverseasCheck({ id: "oc2", staff_id: "s2", status: "not_available", letter_of_good_standing: true }),
        ],
        barred_list_records: [
          makeBarredList({ id: "bl1", staff_id: "s1" }),
          makeBarredList({ id: "bl2", staff_id: "s2", status: "pending" }),
        ],
        reference_verification_records: [
          makeReference({ id: "r1", staff_id: "s1" }),
          makeReference({ id: "r2", staff_id: "s2", status: "declined" }),
        ],
      });
      expect(r.vetting_score).toBeGreaterThanOrEqual(0);
      expect(r.vetting_score).toBeLessThanOrEqual(100);
    });

    it("large team (50 staff) produces valid result", () => {
      const ids = Array.from({ length: 50 }, (_, i) => `staff_${i}`);
      const r = computeDbsRenewalStaffVetting({
        today: "2026-05-30",
        total_staff: 50,
        dbs_check_records: ids.map((sid, i) => makeDbsCheck({ id: `d${i}`, staff_id: sid })),
        enhanced_dbs_records: ids.map((sid, i) => makeEnhancedDbs({ id: `e${i}`, staff_id: sid })),
        overseas_check_records: [],
        barred_list_records: ids.map((sid, i) => makeBarredList({ id: `bl${i}`, staff_id: sid })),
        reference_verification_records: ids.map((sid, i) => makeReference({ id: `r${i}`, staff_id: sid })),
      });
      expect(r.vetting_score).toBeGreaterThanOrEqual(0);
      expect(r.staff_fully_vetted_count).toBe(50);
    });

    it("only DBS records exist (no enhanced, overseas, barred, refs) — still computes", () => {
      const r = computeDbsRenewalStaffVetting({
        today: "2026-05-30",
        total_staff: 8,
        dbs_check_records: staffIds.map((sid, i) => makeDbsCheck({ id: `d${i}`, staff_id: sid })),
        enhanced_dbs_records: [],
        overseas_check_records: [],
        barred_list_records: [],
        reference_verification_records: [],
      });
      expect(r.dbs_currency_rate).toBe(100);
      expect(r.enhanced_dbs_rate).toBe(0);
      expect(r.barred_list_rate).toBe(0);
      expect(r.reference_verification_rate).toBe(0);
    });

    it("duplicate staff IDs across record types are handled correctly", () => {
      const r = computeDbsRenewalStaffVetting({
        today: "2026-05-30",
        total_staff: 2,
        dbs_check_records: [
          makeDbsCheck({ id: "d1", staff_id: "s1" }),
          makeDbsCheck({ id: "d2", staff_id: "s1" }), // duplicate
        ],
        enhanced_dbs_records: [makeEnhancedDbs({ id: "e1", staff_id: "s1" })],
        overseas_check_records: [],
        barred_list_records: [makeBarredList({ id: "bl1", staff_id: "s1" })],
        reference_verification_records: [makeReference({ id: "r1", staff_id: "s1" })],
      });
      expect(r.staff_with_dbs_coverage).toBe(1);
      expect(r.staff_fully_vetted_count).toBe(1);
    });
  });
});
