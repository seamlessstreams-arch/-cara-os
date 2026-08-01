// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF EXIT INTERVIEWS SERVICE TESTS
// Pure-function unit tests for exit interview metrics computation,
// alert identification, constant validation, and CRUD fallback behaviour
// (Supabase disabled). CHR 2015 Reg 33 (employment and fitness of staff),
// Reg 13 (leadership and management),
// Reg 32 (fitness of workers — ongoing suitability).
//
// Covers: exit interview records, reasons for leaving, satisfaction ratings,
// safeguarding debrief, handover completion, and retention insights.
//
// SCCIF: Leadership — "The home learns from staff departures."
// "Exit interviews inform workforce planning and improvement."
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => false,
  createServerClient: () => null,
}));

import {
  _testing,
  LEAVING_REASONS,
  SATISFACTION_RATINGS,
  HANDOVER_STATUSES,
  REHIRE_RECOMMENDATIONS,
  listRecords,
  createRecord,
  updateRecord,
} from "../staff-exit-interviews-service";

import type {
  StaffExitRecord,
  LeavingReason,
  SatisfactionRating,
  HandoverStatus,
  RehireRecommendation,
} from "../staff-exit-interviews-service";

const { computeExitInterviewMetrics, identifyExitInterviewAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

function makeRecord(
  overrides?: Partial<StaffExitRecord>,
): StaffExitRecord {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : crypto.randomUUID(),
    home_id: "home_id" in (overrides ?? {}) ? overrides!.home_id! : "home-1",
    staff_name: "staff_name" in (overrides ?? {}) ? overrides!.staff_name! : "Test Staff",
    role: "role" in (overrides ?? {}) ? overrides!.role! : "Support Worker",
    leaving_date: "leaving_date" in (overrides ?? {}) ? overrides!.leaving_date! : "2026-05-01",
    interview_date: "interview_date" in (overrides ?? {}) ? overrides!.interview_date! : "2026-04-28",
    leaving_reason: "leaving_reason" in (overrides ?? {}) ? overrides!.leaving_reason! : "career_progression",
    satisfaction_rating: "satisfaction_rating" in (overrides ?? {}) ? overrides!.satisfaction_rating! : "satisfied",
    handover_status: "handover_status" in (overrides ?? {}) ? overrides!.handover_status! : "completed",
    rehire_recommendation: "rehire_recommendation" in (overrides ?? {}) ? overrides!.rehire_recommendation! : "yes",
    length_of_service_months: "length_of_service_months" in (overrides ?? {}) ? overrides!.length_of_service_months! : 12,
    would_recommend_employer: "would_recommend_employer" in (overrides ?? {}) ? overrides!.would_recommend_employer! : true,
    felt_supported: "felt_supported" in (overrides ?? {}) ? overrides!.felt_supported! : true,
    adequate_training: "adequate_training" in (overrides ?? {}) ? overrides!.adequate_training! : true,
    safeguarding_debrief_completed: "safeguarding_debrief_completed" in (overrides ?? {}) ? overrides!.safeguarding_debrief_completed! : true,
    keys_returned: "keys_returned" in (overrides ?? {}) ? overrides!.keys_returned! : true,
    access_revoked: "access_revoked" in (overrides ?? {}) ? overrides!.access_revoked! : true,
    dbs_notification_sent: "dbs_notification_sent" in (overrides ?? {}) ? overrides!.dbs_notification_sent! : true,
    children_informed: "children_informed" in (overrides ?? {}) ? overrides!.children_informed! : true,
    children_supported_through_transition: "children_supported_through_transition" in (overrides ?? {}) ? overrides!.children_supported_through_transition! : true,
    feedback_themes: "feedback_themes" in (overrides ?? {}) ? overrides!.feedback_themes! : [],
    improvements_suggested: "improvements_suggested" in (overrides ?? {}) ? overrides!.improvements_suggested! : [],
    interviewed_by: "interviewed_by" in (overrides ?? {}) ? overrides!.interviewed_by! : "Manager A",
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: "created_at" in (overrides ?? {}) ? overrides!.created_at! : "2026-05-01T10:00:00Z",
    updated_at: "updated_at" in (overrides ?? {}) ? overrides!.updated_at! : "2026-05-01T10:00:00Z",
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

describe("LEAVING_REASONS", () => {
  it("has exactly 11 entries", () => {
    expect(LEAVING_REASONS).toHaveLength(11);
  });

  it("every entry has a non-empty reason string", () => {
    for (const r of LEAVING_REASONS) {
      expect(typeof r.reason).toBe("string");
      expect(r.reason.length).toBeGreaterThan(0);
    }
  });

  it("every entry has a non-empty label string", () => {
    for (const r of LEAVING_REASONS) {
      expect(typeof r.label).toBe("string");
      expect(r.label.length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate reasons", () => {
    const reasons = LEAVING_REASONS.map((r) => r.reason);
    expect(new Set(reasons).size).toBe(reasons.length);
  });

  it("has no duplicate labels", () => {
    const labels = LEAVING_REASONS.map((r) => r.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes all expected reasons", () => {
    const reasons = LEAVING_REASONS.map((r) => r.reason);
    const expected: LeavingReason[] = [
      "career_progression", "relocation", "personal_reasons", "workload",
      "management_issues", "pay_conditions", "burnout", "end_of_contract",
      "retirement", "dismissal", "other",
    ];
    for (const e of expected) {
      expect(reasons).toContain(e);
    }
  });

  it("labels are title-cased human-readable strings", () => {
    for (const r of LEAVING_REASONS) {
      expect(r.label[0]).toBe(r.label[0].toUpperCase());
    }
  });

  it("includes career_progression", () => {
    expect(LEAVING_REASONS.map((r) => r.reason)).toContain("career_progression");
  });

  it("includes burnout", () => {
    expect(LEAVING_REASONS.map((r) => r.reason)).toContain("burnout");
  });
});

describe("SATISFACTION_RATINGS", () => {
  it("has exactly 5 entries", () => {
    expect(SATISFACTION_RATINGS).toHaveLength(5);
  });

  it("every entry has a non-empty rating string", () => {
    for (const s of SATISFACTION_RATINGS) {
      expect(typeof s.rating).toBe("string");
      expect(s.rating.length).toBeGreaterThan(0);
    }
  });

  it("every entry has a non-empty label string", () => {
    for (const s of SATISFACTION_RATINGS) {
      expect(typeof s.label).toBe("string");
      expect(s.label.length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate ratings", () => {
    const ratings = SATISFACTION_RATINGS.map((s) => s.rating);
    expect(new Set(ratings).size).toBe(ratings.length);
  });

  it("has no duplicate labels", () => {
    const labels = SATISFACTION_RATINGS.map((s) => s.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes all expected ratings", () => {
    const ratings = SATISFACTION_RATINGS.map((s) => s.rating);
    const expected: SatisfactionRating[] = [
      "very_satisfied", "satisfied", "neutral", "dissatisfied", "very_dissatisfied",
    ];
    for (const e of expected) {
      expect(ratings).toContain(e);
    }
  });

  it("labels are title-cased human-readable strings", () => {
    for (const s of SATISFACTION_RATINGS) {
      expect(s.label[0]).toBe(s.label[0].toUpperCase());
    }
  });

  it("includes very_satisfied", () => {
    expect(SATISFACTION_RATINGS.map((s) => s.rating)).toContain("very_satisfied");
  });

  it("includes very_dissatisfied", () => {
    expect(SATISFACTION_RATINGS.map((s) => s.rating)).toContain("very_dissatisfied");
  });
});

describe("HANDOVER_STATUSES", () => {
  it("has exactly 4 entries", () => {
    expect(HANDOVER_STATUSES).toHaveLength(4);
  });

  it("every entry has a non-empty status string", () => {
    for (const h of HANDOVER_STATUSES) {
      expect(typeof h.status).toBe("string");
      expect(h.status.length).toBeGreaterThan(0);
    }
  });

  it("every entry has a non-empty label string", () => {
    for (const h of HANDOVER_STATUSES) {
      expect(typeof h.label).toBe("string");
      expect(h.label.length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate statuses", () => {
    const statuses = HANDOVER_STATUSES.map((h) => h.status);
    expect(new Set(statuses).size).toBe(statuses.length);
  });

  it("has no duplicate labels", () => {
    const labels = HANDOVER_STATUSES.map((h) => h.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes all expected statuses", () => {
    const statuses = HANDOVER_STATUSES.map((h) => h.status);
    const expected: HandoverStatus[] = [
      "completed", "partial", "not_started", "not_required",
    ];
    for (const e of expected) {
      expect(statuses).toContain(e);
    }
  });

  it("labels are title-cased human-readable strings", () => {
    for (const h of HANDOVER_STATUSES) {
      expect(h.label[0]).toBe(h.label[0].toUpperCase());
    }
  });

  it("includes completed", () => {
    expect(HANDOVER_STATUSES.map((h) => h.status)).toContain("completed");
  });

  it("includes not_started", () => {
    expect(HANDOVER_STATUSES.map((h) => h.status)).toContain("not_started");
  });
});

describe("REHIRE_RECOMMENDATIONS", () => {
  it("has exactly 4 entries", () => {
    expect(REHIRE_RECOMMENDATIONS).toHaveLength(4);
  });

  it("every entry has a non-empty recommendation string", () => {
    for (const r of REHIRE_RECOMMENDATIONS) {
      expect(typeof r.recommendation).toBe("string");
      expect(r.recommendation.length).toBeGreaterThan(0);
    }
  });

  it("every entry has a non-empty label string", () => {
    for (const r of REHIRE_RECOMMENDATIONS) {
      expect(typeof r.label).toBe("string");
      expect(r.label.length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate recommendations", () => {
    const recs = REHIRE_RECOMMENDATIONS.map((r) => r.recommendation);
    expect(new Set(recs).size).toBe(recs.length);
  });

  it("has no duplicate labels", () => {
    const labels = REHIRE_RECOMMENDATIONS.map((r) => r.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes all expected recommendations", () => {
    const recs = REHIRE_RECOMMENDATIONS.map((r) => r.recommendation);
    const expected: RehireRecommendation[] = [
      "yes", "yes_with_conditions", "no", "not_assessed",
    ];
    for (const e of expected) {
      expect(recs).toContain(e);
    }
  });

  it("labels are title-cased human-readable strings", () => {
    for (const r of REHIRE_RECOMMENDATIONS) {
      expect(r.label[0]).toBe(r.label[0].toUpperCase());
    }
  });

  it("includes yes", () => {
    expect(REHIRE_RECOMMENDATIONS.map((r) => r.recommendation)).toContain("yes");
  });

  it("includes no", () => {
    expect(REHIRE_RECOMMENDATIONS.map((r) => r.recommendation)).toContain("no");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. computeExitInterviewMetrics
// ═══════════════════════════════════════════════════════════════════════════

describe("computeExitInterviewMetrics", () => {

  // ── Empty records ─────────────────────────────────────────────────────

  describe("empty records", () => {
    it("returns total_exits 0 for empty array", () => {
      expect(computeExitInterviewMetrics([]).total_exits).toBe(0);
    });

    it("returns career_progression_count 0 for empty array", () => {
      expect(computeExitInterviewMetrics([]).career_progression_count).toBe(0);
    });

    it("returns burnout_count 0 for empty array", () => {
      expect(computeExitInterviewMetrics([]).burnout_count).toBe(0);
    });

    it("returns management_issues_count 0 for empty array", () => {
      expect(computeExitInterviewMetrics([]).management_issues_count).toBe(0);
    });

    it("returns dismissal_count 0 for empty array", () => {
      expect(computeExitInterviewMetrics([]).dismissal_count).toBe(0);
    });

    it("returns very_satisfied_rate 0 for empty array", () => {
      expect(computeExitInterviewMetrics([]).very_satisfied_rate).toBeNull();;
    });

    it("returns dissatisfied_count 0 for empty array", () => {
      expect(computeExitInterviewMetrics([]).dissatisfied_count).toBe(0);
    });

    it("returns very_dissatisfied_count 0 for empty array", () => {
      expect(computeExitInterviewMetrics([]).very_dissatisfied_count).toBe(0);
    });

    it("returns handover_completed_rate 0 for empty array", () => {
      expect(computeExitInterviewMetrics([]).handover_completed_rate).toBeNull();;
    });

    it("returns handover_not_started_count 0 for empty array", () => {
      expect(computeExitInterviewMetrics([]).handover_not_started_count).toBe(0);
    });

    it("returns would_recommend_rate 0 for empty array", () => {
      expect(computeExitInterviewMetrics([]).would_recommend_rate).toBeNull();;
    });

    it("returns felt_supported_rate 0 for empty array", () => {
      expect(computeExitInterviewMetrics([]).felt_supported_rate).toBeNull();;
    });

    it("returns adequate_training_rate 0 for empty array", () => {
      expect(computeExitInterviewMetrics([]).adequate_training_rate).toBeNull();;
    });

    it("returns safeguarding_debrief_rate 0 for empty array", () => {
      expect(computeExitInterviewMetrics([]).safeguarding_debrief_rate).toBeNull();;
    });

    it("returns keys_returned_rate 0 for empty array", () => {
      expect(computeExitInterviewMetrics([]).keys_returned_rate).toBeNull();;
    });

    it("returns access_revoked_rate 0 for empty array", () => {
      expect(computeExitInterviewMetrics([]).access_revoked_rate).toBeNull();;
    });

    it("returns dbs_notification_rate 0 for empty array", () => {
      expect(computeExitInterviewMetrics([]).dbs_notification_rate).toBeNull();;
    });

    it("returns children_informed_rate 0 for empty array", () => {
      expect(computeExitInterviewMetrics([]).children_informed_rate).toBeNull();;
    });

    it("returns children_supported_rate 0 for empty array", () => {
      expect(computeExitInterviewMetrics([]).children_supported_rate).toBeNull();;
    });

    it("returns average_service_months 0 for empty array", () => {
      expect(computeExitInterviewMetrics([]).average_service_months).toBeNull();;
    });

    it("returns rehire_yes_rate 0 for empty array", () => {
      expect(computeExitInterviewMetrics([]).rehire_yes_rate).toBeNull();;
    });

    it("returns rehire_no_count 0 for empty array", () => {
      expect(computeExitInterviewMetrics([]).rehire_no_count).toBe(0);
    });

    it("returns empty by_leaving_reason for empty array", () => {
      expect(computeExitInterviewMetrics([]).by_leaving_reason).toEqual({});
    });

    it("returns empty by_satisfaction_rating for empty array", () => {
      expect(computeExitInterviewMetrics([]).by_satisfaction_rating).toEqual({});
    });

    it("returns empty by_handover_status for empty array", () => {
      expect(computeExitInterviewMetrics([]).by_handover_status).toEqual({});
    });

    it("returns empty by_rehire_recommendation for empty array", () => {
      expect(computeExitInterviewMetrics([]).by_rehire_recommendation).toEqual({});
    });
  });

  // ── Single default record ─────────────────────────────────────────────

  describe("single default record", () => {
    const m = computeExitInterviewMetrics([makeRecord()]);

    it("returns total_exits 1", () => {
      expect(m.total_exits).toBe(1);
    });

    it("returns career_progression_count 1 (default reason)", () => {
      expect(m.career_progression_count).toBe(1);
    });

    it("returns burnout_count 0", () => {
      expect(m.burnout_count).toBe(0);
    });

    it("returns management_issues_count 0", () => {
      expect(m.management_issues_count).toBe(0);
    });

    it("returns dismissal_count 0", () => {
      expect(m.dismissal_count).toBe(0);
    });

    it("returns very_satisfied_rate 0 (default is satisfied, not very_satisfied)", () => {
      expect(m.very_satisfied_rate).toBe(0);
    });

    it("returns dissatisfied_count 0", () => {
      expect(m.dissatisfied_count).toBe(0);
    });

    it("returns very_dissatisfied_count 0", () => {
      expect(m.very_dissatisfied_count).toBe(0);
    });

    it("returns handover_completed_rate 100 (default handover is completed)", () => {
      expect(m.handover_completed_rate).toBe(100);
    });

    it("returns handover_not_started_count 0", () => {
      expect(m.handover_not_started_count).toBe(0);
    });

    it("returns would_recommend_rate 100 (default true)", () => {
      expect(m.would_recommend_rate).toBe(100);
    });

    it("returns felt_supported_rate 100 (default true)", () => {
      expect(m.felt_supported_rate).toBe(100);
    });

    it("returns adequate_training_rate 100 (default true)", () => {
      expect(m.adequate_training_rate).toBe(100);
    });

    it("returns safeguarding_debrief_rate 100 (default true)", () => {
      expect(m.safeguarding_debrief_rate).toBe(100);
    });

    it("returns keys_returned_rate 100 (default true)", () => {
      expect(m.keys_returned_rate).toBe(100);
    });

    it("returns access_revoked_rate 100 (default true)", () => {
      expect(m.access_revoked_rate).toBe(100);
    });

    it("returns dbs_notification_rate 100 (default true)", () => {
      expect(m.dbs_notification_rate).toBe(100);
    });

    it("returns children_informed_rate 100 (default true)", () => {
      expect(m.children_informed_rate).toBe(100);
    });

    it("returns children_supported_rate 100 (default true)", () => {
      expect(m.children_supported_rate).toBe(100);
    });

    it("returns average_service_months 12 (default)", () => {
      expect(m.average_service_months).toBe(12);
    });

    it("returns rehire_yes_rate 100 (default yes)", () => {
      expect(m.rehire_yes_rate).toBe(100);
    });

    it("returns rehire_no_count 0", () => {
      expect(m.rehire_no_count).toBe(0);
    });
  });

  // ── Leaving reason counts ─────────────────────────────────────────────

  describe("career_progression_count", () => {
    it("counts only career_progression records", () => {
      const recs = [
        makeRecord({ leaving_reason: "career_progression" }),
        makeRecord({ leaving_reason: "burnout" }),
        makeRecord({ leaving_reason: "career_progression" }),
      ];
      expect(computeExitInterviewMetrics(recs).career_progression_count).toBe(2);
    });

    it("returns 0 when no career_progression records", () => {
      const recs = [makeRecord({ leaving_reason: "relocation" })];
      expect(computeExitInterviewMetrics(recs).career_progression_count).toBe(0);
    });
  });

  describe("burnout_count", () => {
    it("counts only burnout records", () => {
      const recs = [
        makeRecord({ leaving_reason: "burnout" }),
        makeRecord({ leaving_reason: "burnout" }),
        makeRecord({ leaving_reason: "relocation" }),
      ];
      expect(computeExitInterviewMetrics(recs).burnout_count).toBe(2);
    });

    it("returns 0 when no burnout records", () => {
      const recs = [makeRecord({ leaving_reason: "career_progression" })];
      expect(computeExitInterviewMetrics(recs).burnout_count).toBe(0);
    });
  });

  describe("management_issues_count", () => {
    it("counts only management_issues records", () => {
      const recs = [
        makeRecord({ leaving_reason: "management_issues" }),
        makeRecord({ leaving_reason: "career_progression" }),
      ];
      expect(computeExitInterviewMetrics(recs).management_issues_count).toBe(1);
    });

    it("returns 0 when no management_issues records", () => {
      const recs = [makeRecord({ leaving_reason: "relocation" })];
      expect(computeExitInterviewMetrics(recs).management_issues_count).toBe(0);
    });
  });

  describe("dismissal_count", () => {
    it("counts only dismissal records", () => {
      const recs = [
        makeRecord({ leaving_reason: "dismissal" }),
        makeRecord({ leaving_reason: "dismissal" }),
        makeRecord({ leaving_reason: "dismissal" }),
      ];
      expect(computeExitInterviewMetrics(recs).dismissal_count).toBe(3);
    });

    it("returns 0 when no dismissal records", () => {
      const recs = [makeRecord({ leaving_reason: "retirement" })];
      expect(computeExitInterviewMetrics(recs).dismissal_count).toBe(0);
    });
  });

  // ── Satisfaction metrics ──────────────────────────────────────────────

  describe("very_satisfied_rate", () => {
    it("returns 100 when all records are very_satisfied", () => {
      const recs = [
        makeRecord({ satisfaction_rating: "very_satisfied" }),
        makeRecord({ satisfaction_rating: "very_satisfied" }),
      ];
      expect(computeExitInterviewMetrics(recs).very_satisfied_rate).toBe(100);
    });

    it("returns 50 when half are very_satisfied", () => {
      const recs = [
        makeRecord({ satisfaction_rating: "very_satisfied" }),
        makeRecord({ satisfaction_rating: "satisfied" }),
      ];
      expect(computeExitInterviewMetrics(recs).very_satisfied_rate).toBe(50);
    });

    it("uses Math.round(value * 1000) / 10 rounding", () => {
      const recs = [
        makeRecord({ satisfaction_rating: "very_satisfied" }),
        makeRecord({ satisfaction_rating: "satisfied" }),
        makeRecord({ satisfaction_rating: "neutral" }),
      ];
      // 1/3 = 0.333... => Math.round(0.333... * 1000) / 10 = Math.round(333.3) / 10 = 333 / 10 = 33.3
      expect(computeExitInterviewMetrics(recs).very_satisfied_rate).toBe(33.3);
    });

    it("returns 0 when no records are very_satisfied", () => {
      const recs = [makeRecord({ satisfaction_rating: "neutral" })];
      expect(computeExitInterviewMetrics(recs).very_satisfied_rate).toBe(0);
    });
  });

  describe("dissatisfied_count", () => {
    it("counts only dissatisfied records", () => {
      const recs = [
        makeRecord({ satisfaction_rating: "dissatisfied" }),
        makeRecord({ satisfaction_rating: "very_dissatisfied" }),
        makeRecord({ satisfaction_rating: "dissatisfied" }),
      ];
      expect(computeExitInterviewMetrics(recs).dissatisfied_count).toBe(2);
    });
  });

  describe("very_dissatisfied_count", () => {
    it("counts only very_dissatisfied records", () => {
      const recs = [
        makeRecord({ satisfaction_rating: "very_dissatisfied" }),
        makeRecord({ satisfaction_rating: "dissatisfied" }),
      ];
      expect(computeExitInterviewMetrics(recs).very_dissatisfied_count).toBe(1);
    });
  });

  // ── Handover metrics ──────────────────────────────────────────────────

  describe("handover_completed_rate", () => {
    it("returns 100 when all handovers completed", () => {
      const recs = [
        makeRecord({ handover_status: "completed" }),
        makeRecord({ handover_status: "completed" }),
      ];
      expect(computeExitInterviewMetrics(recs).handover_completed_rate).toBe(100);
    });

    it("returns 50 when half completed", () => {
      const recs = [
        makeRecord({ handover_status: "completed" }),
        makeRecord({ handover_status: "not_started" }),
      ];
      expect(computeExitInterviewMetrics(recs).handover_completed_rate).toBe(50);
    });

    it("returns 0 when none completed", () => {
      const recs = [
        makeRecord({ handover_status: "partial" }),
        makeRecord({ handover_status: "not_started" }),
      ];
      expect(computeExitInterviewMetrics(recs).handover_completed_rate).toBe(0);
    });

    it("uses boolRate rounding for non-integer percentages", () => {
      const recs = [
        makeRecord({ handover_status: "completed" }),
        makeRecord({ handover_status: "completed" }),
        makeRecord({ handover_status: "partial" }),
      ];
      // 2/3 = 0.666... => Math.round(666.6) / 10 = 667 / 10 = 66.7
      expect(computeExitInterviewMetrics(recs).handover_completed_rate).toBe(66.7);
    });
  });

  describe("handover_not_started_count", () => {
    it("counts not_started handovers", () => {
      const recs = [
        makeRecord({ handover_status: "not_started" }),
        makeRecord({ handover_status: "not_started" }),
        makeRecord({ handover_status: "completed" }),
      ];
      expect(computeExitInterviewMetrics(recs).handover_not_started_count).toBe(2);
    });

    it("returns 0 when no not_started", () => {
      const recs = [makeRecord({ handover_status: "completed" })];
      expect(computeExitInterviewMetrics(recs).handover_not_started_count).toBe(0);
    });
  });

  // ── Boolean rate fields ───────────────────────────────────────────────

  describe("would_recommend_rate", () => {
    it("returns 100 when all true", () => {
      const recs = [makeRecord({ would_recommend_employer: true }), makeRecord({ would_recommend_employer: true })];
      expect(computeExitInterviewMetrics(recs).would_recommend_rate).toBe(100);
    });

    it("returns 0 when all false", () => {
      const recs = [makeRecord({ would_recommend_employer: false }), makeRecord({ would_recommend_employer: false })];
      expect(computeExitInterviewMetrics(recs).would_recommend_rate).toBe(0);
    });

    it("returns 50 when half true", () => {
      const recs = [makeRecord({ would_recommend_employer: true }), makeRecord({ would_recommend_employer: false })];
      expect(computeExitInterviewMetrics(recs).would_recommend_rate).toBe(50);
    });
  });

  describe("felt_supported_rate", () => {
    it("returns 100 when all true", () => {
      const recs = [makeRecord({ felt_supported: true }), makeRecord({ felt_supported: true })];
      expect(computeExitInterviewMetrics(recs).felt_supported_rate).toBe(100);
    });

    it("returns 0 when all false", () => {
      const recs = [makeRecord({ felt_supported: false })];
      expect(computeExitInterviewMetrics(recs).felt_supported_rate).toBe(0);
    });

    it("uses boolRate rounding for thirds", () => {
      const recs = [
        makeRecord({ felt_supported: true }),
        makeRecord({ felt_supported: false }),
        makeRecord({ felt_supported: false }),
      ];
      // 1/3 => 33.3
      expect(computeExitInterviewMetrics(recs).felt_supported_rate).toBe(33.3);
    });
  });

  describe("adequate_training_rate", () => {
    it("returns 100 when all true", () => {
      const recs = [makeRecord({ adequate_training: true })];
      expect(computeExitInterviewMetrics(recs).adequate_training_rate).toBe(100);
    });

    it("returns 0 when all false", () => {
      const recs = [makeRecord({ adequate_training: false })];
      expect(computeExitInterviewMetrics(recs).adequate_training_rate).toBe(0);
    });
  });

  describe("safeguarding_debrief_rate", () => {
    it("returns 100 when all debriefed", () => {
      const recs = [makeRecord({ safeguarding_debrief_completed: true })];
      expect(computeExitInterviewMetrics(recs).safeguarding_debrief_rate).toBe(100);
    });

    it("returns 0 when none debriefed", () => {
      const recs = [makeRecord({ safeguarding_debrief_completed: false })];
      expect(computeExitInterviewMetrics(recs).safeguarding_debrief_rate).toBe(0);
    });

    it("returns 50 when half debriefed", () => {
      const recs = [
        makeRecord({ safeguarding_debrief_completed: true }),
        makeRecord({ safeguarding_debrief_completed: false }),
      ];
      expect(computeExitInterviewMetrics(recs).safeguarding_debrief_rate).toBe(50);
    });
  });

  describe("keys_returned_rate", () => {
    it("returns 100 when all keys returned", () => {
      const recs = [makeRecord({ keys_returned: true }), makeRecord({ keys_returned: true })];
      expect(computeExitInterviewMetrics(recs).keys_returned_rate).toBe(100);
    });

    it("returns 0 when no keys returned", () => {
      const recs = [makeRecord({ keys_returned: false })];
      expect(computeExitInterviewMetrics(recs).keys_returned_rate).toBe(0);
    });
  });

  describe("access_revoked_rate", () => {
    it("returns 100 when all access revoked", () => {
      const recs = [makeRecord({ access_revoked: true })];
      expect(computeExitInterviewMetrics(recs).access_revoked_rate).toBe(100);
    });

    it("returns 0 when no access revoked", () => {
      const recs = [makeRecord({ access_revoked: false })];
      expect(computeExitInterviewMetrics(recs).access_revoked_rate).toBe(0);
    });
  });

  describe("dbs_notification_rate", () => {
    it("returns 100 when all DBS notifications sent", () => {
      const recs = [makeRecord({ dbs_notification_sent: true })];
      expect(computeExitInterviewMetrics(recs).dbs_notification_rate).toBe(100);
    });

    it("returns 0 when no DBS notifications sent", () => {
      const recs = [makeRecord({ dbs_notification_sent: false })];
      expect(computeExitInterviewMetrics(recs).dbs_notification_rate).toBe(0);
    });
  });

  describe("children_informed_rate", () => {
    it("returns 100 when all children informed", () => {
      const recs = [makeRecord({ children_informed: true })];
      expect(computeExitInterviewMetrics(recs).children_informed_rate).toBe(100);
    });

    it("returns 0 when no children informed", () => {
      const recs = [makeRecord({ children_informed: false })];
      expect(computeExitInterviewMetrics(recs).children_informed_rate).toBe(0);
    });
  });

  describe("children_supported_rate", () => {
    it("returns 100 when all children supported through transition", () => {
      const recs = [makeRecord({ children_supported_through_transition: true })];
      expect(computeExitInterviewMetrics(recs).children_supported_rate).toBe(100);
    });

    it("returns 0 when no children supported", () => {
      const recs = [makeRecord({ children_supported_through_transition: false })];
      expect(computeExitInterviewMetrics(recs).children_supported_rate).toBe(0);
    });

    it("uses boolRate rounding for 2/3", () => {
      const recs = [
        makeRecord({ children_supported_through_transition: true }),
        makeRecord({ children_supported_through_transition: true }),
        makeRecord({ children_supported_through_transition: false }),
      ];
      // 2/3 => 66.7
      expect(computeExitInterviewMetrics(recs).children_supported_rate).toBe(66.7);
    });
  });

  // ── Average service months ────────────────────────────────────────────

  describe("average_service_months", () => {
    it("returns exact integer for uniform values", () => {
      const recs = [
        makeRecord({ length_of_service_months: 24 }),
        makeRecord({ length_of_service_months: 24 }),
      ];
      expect(computeExitInterviewMetrics(recs).average_service_months).toBe(24);
    });

    it("returns correct average for mixed values", () => {
      const recs = [
        makeRecord({ length_of_service_months: 6 }),
        makeRecord({ length_of_service_months: 18 }),
      ];
      expect(computeExitInterviewMetrics(recs).average_service_months).toBe(12);
    });

    it("uses Math.round(avg * 10) / 10 rounding", () => {
      const recs = [
        makeRecord({ length_of_service_months: 10 }),
        makeRecord({ length_of_service_months: 20 }),
        makeRecord({ length_of_service_months: 30 }),
      ];
      // (10+20+30)/3 = 20 => exactly 20.0
      expect(computeExitInterviewMetrics(recs).average_service_months).toBe(20);
    });

    it("rounds to one decimal place", () => {
      const recs = [
        makeRecord({ length_of_service_months: 7 }),
        makeRecord({ length_of_service_months: 8 }),
        makeRecord({ length_of_service_months: 9 }),
      ];
      // (7+8+9)/3 = 8.0
      expect(computeExitInterviewMetrics(recs).average_service_months).toBe(8);
    });

    it("handles fractional averages", () => {
      const recs = [
        makeRecord({ length_of_service_months: 1 }),
        makeRecord({ length_of_service_months: 2 }),
        makeRecord({ length_of_service_months: 3 }),
        makeRecord({ length_of_service_months: 4 }),
        makeRecord({ length_of_service_months: 5 }),
        makeRecord({ length_of_service_months: 6 }),
      ];
      // (1+2+3+4+5+6)/6 = 3.5
      expect(computeExitInterviewMetrics(recs).average_service_months).toBe(3.5);
    });

    it("returns single record value for one record", () => {
      const recs = [makeRecord({ length_of_service_months: 36 })];
      expect(computeExitInterviewMetrics(recs).average_service_months).toBe(36);
    });
  });

  // ── Rehire metrics ────────────────────────────────────────────────────

  describe("rehire_yes_rate", () => {
    it("returns 100 when all are yes", () => {
      const recs = [
        makeRecord({ rehire_recommendation: "yes" }),
        makeRecord({ rehire_recommendation: "yes" }),
      ];
      expect(computeExitInterviewMetrics(recs).rehire_yes_rate).toBe(100);
    });

    it("returns 0 when none are yes", () => {
      const recs = [
        makeRecord({ rehire_recommendation: "no" }),
        makeRecord({ rehire_recommendation: "not_assessed" }),
      ];
      expect(computeExitInterviewMetrics(recs).rehire_yes_rate).toBe(0);
    });

    it("uses boolRate rounding pattern", () => {
      const recs = [
        makeRecord({ rehire_recommendation: "yes" }),
        makeRecord({ rehire_recommendation: "no" }),
        makeRecord({ rehire_recommendation: "no" }),
      ];
      // 1/3 => Math.round(333.3) / 10 = 33.3
      expect(computeExitInterviewMetrics(recs).rehire_yes_rate).toBe(33.3);
    });

    it("does not count yes_with_conditions as yes", () => {
      const recs = [
        makeRecord({ rehire_recommendation: "yes_with_conditions" }),
      ];
      expect(computeExitInterviewMetrics(recs).rehire_yes_rate).toBe(0);
    });
  });

  describe("rehire_no_count", () => {
    it("counts no recommendations", () => {
      const recs = [
        makeRecord({ rehire_recommendation: "no" }),
        makeRecord({ rehire_recommendation: "no" }),
        makeRecord({ rehire_recommendation: "yes" }),
      ];
      expect(computeExitInterviewMetrics(recs).rehire_no_count).toBe(2);
    });

    it("returns 0 when no 'no' recommendations", () => {
      const recs = [makeRecord({ rehire_recommendation: "yes" })];
      expect(computeExitInterviewMetrics(recs).rehire_no_count).toBe(0);
    });
  });

  // ── Breakdowns ────────────────────────────────────────────────────────

  describe("by_leaving_reason", () => {
    it("counts each leaving reason", () => {
      const recs = [
        makeRecord({ leaving_reason: "burnout" }),
        makeRecord({ leaving_reason: "burnout" }),
        makeRecord({ leaving_reason: "relocation" }),
      ];
      const m = computeExitInterviewMetrics(recs);
      expect(m.by_leaving_reason).toEqual({ burnout: 2, relocation: 1 });
    });

    it("includes only reasons present in records", () => {
      const recs = [makeRecord({ leaving_reason: "retirement" })];
      const m = computeExitInterviewMetrics(recs);
      expect(Object.keys(m.by_leaving_reason)).toEqual(["retirement"]);
    });

    it("handles all 11 reasons", () => {
      const reasons: LeavingReason[] = [
        "career_progression", "relocation", "personal_reasons", "workload",
        "management_issues", "pay_conditions", "burnout", "end_of_contract",
        "retirement", "dismissal", "other",
      ];
      const recs = reasons.map((r) => makeRecord({ leaving_reason: r }));
      const m = computeExitInterviewMetrics(recs);
      expect(Object.keys(m.by_leaving_reason).length).toBe(11);
      for (const reason of reasons) {
        expect(m.by_leaving_reason[reason]).toBe(1);
      }
    });
  });

  describe("by_satisfaction_rating", () => {
    it("counts each satisfaction rating", () => {
      const recs = [
        makeRecord({ satisfaction_rating: "satisfied" }),
        makeRecord({ satisfaction_rating: "satisfied" }),
        makeRecord({ satisfaction_rating: "neutral" }),
      ];
      const m = computeExitInterviewMetrics(recs);
      expect(m.by_satisfaction_rating).toEqual({ satisfied: 2, neutral: 1 });
    });

    it("handles all 5 ratings", () => {
      const ratings: SatisfactionRating[] = [
        "very_satisfied", "satisfied", "neutral", "dissatisfied", "very_dissatisfied",
      ];
      const recs = ratings.map((r) => makeRecord({ satisfaction_rating: r }));
      const m = computeExitInterviewMetrics(recs);
      expect(Object.keys(m.by_satisfaction_rating).length).toBe(5);
    });
  });

  describe("by_handover_status", () => {
    it("counts each handover status", () => {
      const recs = [
        makeRecord({ handover_status: "completed" }),
        makeRecord({ handover_status: "partial" }),
        makeRecord({ handover_status: "not_started" }),
        makeRecord({ handover_status: "not_required" }),
      ];
      const m = computeExitInterviewMetrics(recs);
      expect(m.by_handover_status).toEqual({
        completed: 1, partial: 1, not_started: 1, not_required: 1,
      });
    });

    it("handles all 4 statuses", () => {
      const statuses: HandoverStatus[] = ["completed", "partial", "not_started", "not_required"];
      const recs = statuses.map((s) => makeRecord({ handover_status: s }));
      const m = computeExitInterviewMetrics(recs);
      expect(Object.keys(m.by_handover_status).length).toBe(4);
    });
  });

  describe("by_rehire_recommendation", () => {
    it("counts each rehire recommendation", () => {
      const recs = [
        makeRecord({ rehire_recommendation: "yes" }),
        makeRecord({ rehire_recommendation: "yes" }),
        makeRecord({ rehire_recommendation: "no" }),
        makeRecord({ rehire_recommendation: "not_assessed" }),
      ];
      const m = computeExitInterviewMetrics(recs);
      expect(m.by_rehire_recommendation).toEqual({ yes: 2, no: 1, not_assessed: 1 });
    });

    it("handles all 4 recommendations", () => {
      const recs: RehireRecommendation[] = ["yes", "yes_with_conditions", "no", "not_assessed"];
      const records = recs.map((r) => makeRecord({ rehire_recommendation: r }));
      const m = computeExitInterviewMetrics(records);
      expect(Object.keys(m.by_rehire_recommendation).length).toBe(4);
    });
  });

  // ── Multiple records / mixed datasets ─────────────────────────────────

  describe("multiple records", () => {
    it("computes correct metrics for a mixed dataset", () => {
      const recs = [
        makeRecord({
          leaving_reason: "career_progression",
          satisfaction_rating: "very_satisfied",
          handover_status: "completed",
          rehire_recommendation: "yes",
          length_of_service_months: 24,
          would_recommend_employer: true,
          felt_supported: true,
          adequate_training: true,
          safeguarding_debrief_completed: true,
          keys_returned: true,
          access_revoked: true,
          dbs_notification_sent: true,
          children_informed: true,
          children_supported_through_transition: true,
        }),
        makeRecord({
          leaving_reason: "burnout",
          satisfaction_rating: "dissatisfied",
          handover_status: "not_started",
          rehire_recommendation: "no",
          length_of_service_months: 6,
          would_recommend_employer: false,
          felt_supported: false,
          adequate_training: false,
          safeguarding_debrief_completed: false,
          keys_returned: false,
          access_revoked: false,
          dbs_notification_sent: false,
          children_informed: false,
          children_supported_through_transition: false,
        }),
      ];

      const m = computeExitInterviewMetrics(recs);
      expect(m.total_exits).toBe(2);
      expect(m.career_progression_count).toBe(1);
      expect(m.burnout_count).toBe(1);
      expect(m.very_satisfied_rate).toBe(50);
      expect(m.dissatisfied_count).toBe(1);
      expect(m.handover_completed_rate).toBe(50);
      expect(m.handover_not_started_count).toBe(1);
      expect(m.would_recommend_rate).toBe(50);
      expect(m.felt_supported_rate).toBe(50);
      expect(m.adequate_training_rate).toBe(50);
      expect(m.safeguarding_debrief_rate).toBe(50);
      expect(m.keys_returned_rate).toBe(50);
      expect(m.access_revoked_rate).toBe(50);
      expect(m.dbs_notification_rate).toBe(50);
      expect(m.children_informed_rate).toBe(50);
      expect(m.children_supported_rate).toBe(50);
      expect(m.average_service_months).toBe(15);
      expect(m.rehire_yes_rate).toBe(50);
      expect(m.rehire_no_count).toBe(1);
    });

    it("handles a large dataset correctly", () => {
      const recs: StaffExitRecord[] = [];
      for (let i = 0; i < 100; i++) {
        recs.push(makeRecord({
          leaving_reason: i % 2 === 0 ? "career_progression" : "burnout",
          length_of_service_months: i + 1,
          would_recommend_employer: i % 3 !== 0,
          safeguarding_debrief_completed: true,
        }));
      }
      const m = computeExitInterviewMetrics(recs);
      expect(m.total_exits).toBe(100);
      expect(m.career_progression_count).toBe(50);
      expect(m.burnout_count).toBe(50);
      // avg = (1+2+...+100)/100 = 50.5
      expect(m.average_service_months).toBe(50.5);
    });
  });

  // ── Return shape ──────────────────────────────────────────────────────

  describe("return shape", () => {
    it("returns exactly 26 keys", () => {
      const m = computeExitInterviewMetrics([makeRecord()]);
      expect(Object.keys(m).length).toBe(26);
    });

    it("all rate fields are numbers", () => {
      const m = computeExitInterviewMetrics([makeRecord()]);
      const rateFields = [
        "very_satisfied_rate", "handover_completed_rate", "would_recommend_rate",
        "felt_supported_rate", "adequate_training_rate", "safeguarding_debrief_rate",
        "keys_returned_rate", "access_revoked_rate", "dbs_notification_rate",
        "children_informed_rate", "children_supported_rate", "rehire_yes_rate",
      ] as const;
      for (const f of rateFields) {
        expect(typeof m[f]).toBe("number");
      }
    });

    it("all count fields are numbers", () => {
      const m = computeExitInterviewMetrics([makeRecord()]);
      const countFields = [
        "total_exits", "career_progression_count", "burnout_count",
        "management_issues_count", "dismissal_count", "dissatisfied_count",
        "very_dissatisfied_count", "handover_not_started_count", "rehire_no_count",
      ] as const;
      for (const f of countFields) {
        expect(typeof m[f]).toBe("number");
      }
    });

    it("all breakdown fields are objects", () => {
      const m = computeExitInterviewMetrics([makeRecord()]);
      expect(typeof m.by_leaving_reason).toBe("object");
      expect(typeof m.by_satisfaction_rating).toBe("object");
      expect(typeof m.by_handover_status).toBe("object");
      expect(typeof m.by_rehire_recommendation).toBe("object");
    });

    it("average_service_months is a number", () => {
      const m = computeExitInterviewMetrics([makeRecord()]);
      expect(typeof m.average_service_months).toBe("number");
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. identifyExitInterviewAlerts
// ═══════════════════════════════════════════════════════════════════════════

describe("identifyExitInterviewAlerts", () => {

  // ── No alerts ─────────────────────────────────────────────────────────

  describe("no alerts", () => {
    it("returns empty array when all records are compliant", () => {
      const recs = [makeRecord()];
      expect(identifyExitInterviewAlerts(recs)).toEqual([]);
    });

    it("returns empty array for empty records", () => {
      expect(identifyExitInterviewAlerts([])).toEqual([]);
    });

    it("returns empty array when multiple compliant records", () => {
      const recs = [makeRecord(), makeRecord(), makeRecord()];
      expect(identifyExitInterviewAlerts(recs)).toEqual([]);
    });
  });

  // ── no_safeguarding_debrief (critical, per-record) ────────────────────

  describe("no_safeguarding_debrief alert", () => {
    it("fires for a record without safeguarding debrief", () => {
      const recs = [makeRecord({ safeguarding_debrief_completed: false, staff_name: "Alice", leaving_date: "2026-06-01" })];
      const alerts = identifyExitInterviewAlerts(recs);
      const match = alerts.find((a) => a.type === "no_safeguarding_debrief");
      expect(match).toBeDefined();
    });

    it("has severity critical", () => {
      const recs = [makeRecord({ safeguarding_debrief_completed: false, staff_name: "Alice", leaving_date: "2026-06-01" })];
      const alerts = identifyExitInterviewAlerts(recs);
      const match = alerts.find((a) => a.type === "no_safeguarding_debrief");
      expect(match!.severity).toBe("critical");
    });

    it("message includes staff_name", () => {
      const recs = [makeRecord({ safeguarding_debrief_completed: false, staff_name: "Bob Smith", leaving_date: "2026-06-01" })];
      const alerts = identifyExitInterviewAlerts(recs);
      const match = alerts.find((a) => a.type === "no_safeguarding_debrief");
      expect(match!.message).toContain("Bob Smith");
    });

    it("message includes leaving_date", () => {
      const recs = [makeRecord({ safeguarding_debrief_completed: false, staff_name: "Alice", leaving_date: "2026-07-15" })];
      const alerts = identifyExitInterviewAlerts(recs);
      const match = alerts.find((a) => a.type === "no_safeguarding_debrief");
      expect(match!.message).toContain("2026-07-15");
    });

    it("alert id is the record id", () => {
      const recs = [makeRecord({ id: "rec-abc", safeguarding_debrief_completed: false, staff_name: "Alice", leaving_date: "2026-06-01" })];
      const alerts = identifyExitInterviewAlerts(recs);
      const match = alerts.find((a) => a.type === "no_safeguarding_debrief");
      expect(match!.id).toBe("rec-abc");
    });

    it("fires once per non-debriefed record", () => {
      const recs = [
        makeRecord({ id: "r1", safeguarding_debrief_completed: false, staff_name: "Alice", leaving_date: "2026-06-01" }),
        makeRecord({ id: "r2", safeguarding_debrief_completed: false, staff_name: "Bob", leaving_date: "2026-06-02" }),
        makeRecord({ id: "r3", safeguarding_debrief_completed: true }),
      ];
      const alerts = identifyExitInterviewAlerts(recs);
      const matching = alerts.filter((a) => a.type === "no_safeguarding_debrief");
      expect(matching).toHaveLength(2);
    });

    it("does not fire when safeguarding debrief is completed", () => {
      const recs = [makeRecord({ safeguarding_debrief_completed: true })];
      const alerts = identifyExitInterviewAlerts(recs);
      const match = alerts.find((a) => a.type === "no_safeguarding_debrief");
      expect(match).toBeUndefined();
    });

    it("message contains 'complete before departure'", () => {
      const recs = [makeRecord({ safeguarding_debrief_completed: false, staff_name: "Alice", leaving_date: "2026-06-01" })];
      const alerts = identifyExitInterviewAlerts(recs);
      const match = alerts.find((a) => a.type === "no_safeguarding_debrief");
      expect(match!.message).toContain("complete before departure");
    });
  });

  // ── access_not_revoked (high, aggregate) ──────────────────────────────

  describe("access_not_revoked alert", () => {
    it("fires when 1 record has access not revoked", () => {
      const recs = [makeRecord({ access_revoked: false })];
      const alerts = identifyExitInterviewAlerts(recs);
      const match = alerts.find((a) => a.type === "access_not_revoked");
      expect(match).toBeDefined();
    });

    it("has severity high", () => {
      const recs = [makeRecord({ access_revoked: false })];
      const alerts = identifyExitInterviewAlerts(recs);
      const match = alerts.find((a) => a.type === "access_not_revoked");
      expect(match!.severity).toBe("high");
    });

    it("uses singular form for 1 staff member", () => {
      const recs = [makeRecord({ access_revoked: false })];
      const alerts = identifyExitInterviewAlerts(recs);
      const match = alerts.find((a) => a.type === "access_not_revoked");
      expect(match!.message).toContain("staff member has");
    });

    it("uses plural form for 2+ staff members", () => {
      const recs = [
        makeRecord({ access_revoked: false }),
        makeRecord({ access_revoked: false }),
      ];
      const alerts = identifyExitInterviewAlerts(recs);
      const match = alerts.find((a) => a.type === "access_not_revoked");
      expect(match!.message).toContain("staff members have");
    });

    it("includes count in message for singular", () => {
      const recs = [makeRecord({ access_revoked: false })];
      const alerts = identifyExitInterviewAlerts(recs);
      const match = alerts.find((a) => a.type === "access_not_revoked");
      expect(match!.message).toContain("1 departing staff member has");
    });

    it("includes count in message for plural", () => {
      const recs = [
        makeRecord({ access_revoked: false }),
        makeRecord({ access_revoked: false }),
        makeRecord({ access_revoked: false }),
      ];
      const alerts = identifyExitInterviewAlerts(recs);
      const match = alerts.find((a) => a.type === "access_not_revoked");
      expect(match!.message).toContain("3 departing staff members have");
    });

    it("alert id is 'access_not_revoked'", () => {
      const recs = [makeRecord({ access_revoked: false })];
      const alerts = identifyExitInterviewAlerts(recs);
      const match = alerts.find((a) => a.type === "access_not_revoked");
      expect(match!.id).toBe("access_not_revoked");
    });

    it("does not fire when all access is revoked", () => {
      const recs = [makeRecord({ access_revoked: true }), makeRecord({ access_revoked: true })];
      const alerts = identifyExitInterviewAlerts(recs);
      const match = alerts.find((a) => a.type === "access_not_revoked");
      expect(match).toBeUndefined();
    });

    it("message contains 'action immediately'", () => {
      const recs = [makeRecord({ access_revoked: false })];
      const alerts = identifyExitInterviewAlerts(recs);
      const match = alerts.find((a) => a.type === "access_not_revoked");
      expect(match!.message).toContain("action immediately");
    });
  });

  // ── keys_not_returned (high, aggregate) ───────────────────────────────

  describe("keys_not_returned alert", () => {
    it("fires when 1 record has keys not returned", () => {
      const recs = [makeRecord({ keys_returned: false })];
      const alerts = identifyExitInterviewAlerts(recs);
      const match = alerts.find((a) => a.type === "keys_not_returned");
      expect(match).toBeDefined();
    });

    it("has severity high", () => {
      const recs = [makeRecord({ keys_returned: false })];
      const alerts = identifyExitInterviewAlerts(recs);
      const match = alerts.find((a) => a.type === "keys_not_returned");
      expect(match!.severity).toBe("high");
    });

    it("uses singular form for 1 staff member", () => {
      const recs = [makeRecord({ keys_returned: false })];
      const alerts = identifyExitInterviewAlerts(recs);
      const match = alerts.find((a) => a.type === "keys_not_returned");
      expect(match!.message).toContain("staff member has");
    });

    it("uses plural form for 2+ staff members", () => {
      const recs = [
        makeRecord({ keys_returned: false }),
        makeRecord({ keys_returned: false }),
      ];
      const alerts = identifyExitInterviewAlerts(recs);
      const match = alerts.find((a) => a.type === "keys_not_returned");
      expect(match!.message).toContain("staff members have");
    });

    it("includes count in message for plural", () => {
      const recs = [
        makeRecord({ keys_returned: false }),
        makeRecord({ keys_returned: false }),
        makeRecord({ keys_returned: false }),
        makeRecord({ keys_returned: false }),
      ];
      const alerts = identifyExitInterviewAlerts(recs);
      const match = alerts.find((a) => a.type === "keys_not_returned");
      expect(match!.message).toContain("4 departing staff members have");
    });

    it("alert id is 'keys_not_returned'", () => {
      const recs = [makeRecord({ keys_returned: false })];
      const alerts = identifyExitInterviewAlerts(recs);
      const match = alerts.find((a) => a.type === "keys_not_returned");
      expect(match!.id).toBe("keys_not_returned");
    });

    it("does not fire when all keys returned", () => {
      const recs = [makeRecord({ keys_returned: true })];
      const alerts = identifyExitInterviewAlerts(recs);
      const match = alerts.find((a) => a.type === "keys_not_returned");
      expect(match).toBeUndefined();
    });

    it("message contains 'retrieve immediately'", () => {
      const recs = [makeRecord({ keys_returned: false })];
      const alerts = identifyExitInterviewAlerts(recs);
      const match = alerts.find((a) => a.type === "keys_not_returned");
      expect(match!.message).toContain("retrieve immediately");
    });
  });

  // ── handover_not_started (high, aggregate) ────────────────────────────

  describe("handover_not_started alert", () => {
    it("fires when 1 handover has not started", () => {
      const recs = [makeRecord({ handover_status: "not_started" })];
      const alerts = identifyExitInterviewAlerts(recs);
      const match = alerts.find((a) => a.type === "handover_not_started");
      expect(match).toBeDefined();
    });

    it("has severity high", () => {
      const recs = [makeRecord({ handover_status: "not_started" })];
      const alerts = identifyExitInterviewAlerts(recs);
      const match = alerts.find((a) => a.type === "handover_not_started");
      expect(match!.severity).toBe("high");
    });

    it("uses singular 'handover has' for 1 record", () => {
      const recs = [makeRecord({ handover_status: "not_started" })];
      const alerts = identifyExitInterviewAlerts(recs);
      const match = alerts.find((a) => a.type === "handover_not_started");
      expect(match!.message).toContain("handover has");
    });

    it("uses plural 'handovers have' for 2+ records", () => {
      const recs = [
        makeRecord({ handover_status: "not_started" }),
        makeRecord({ handover_status: "not_started" }),
      ];
      const alerts = identifyExitInterviewAlerts(recs);
      const match = alerts.find((a) => a.type === "handover_not_started");
      expect(match!.message).toContain("handovers have");
    });

    it("includes count in message", () => {
      const recs = [
        makeRecord({ handover_status: "not_started" }),
        makeRecord({ handover_status: "not_started" }),
        makeRecord({ handover_status: "not_started" }),
      ];
      const alerts = identifyExitInterviewAlerts(recs);
      const match = alerts.find((a) => a.type === "handover_not_started");
      expect(match!.message).toContain("3 handovers have");
    });

    it("alert id is 'handover_not_started'", () => {
      const recs = [makeRecord({ handover_status: "not_started" })];
      const alerts = identifyExitInterviewAlerts(recs);
      const match = alerts.find((a) => a.type === "handover_not_started");
      expect(match!.id).toBe("handover_not_started");
    });

    it("does not fire for partial handovers", () => {
      const recs = [makeRecord({ handover_status: "partial" })];
      const alerts = identifyExitInterviewAlerts(recs);
      const match = alerts.find((a) => a.type === "handover_not_started");
      expect(match).toBeUndefined();
    });

    it("does not fire for completed handovers", () => {
      const recs = [makeRecord({ handover_status: "completed" })];
      const alerts = identifyExitInterviewAlerts(recs);
      const match = alerts.find((a) => a.type === "handover_not_started");
      expect(match).toBeUndefined();
    });

    it("does not fire for not_required handovers", () => {
      const recs = [makeRecord({ handover_status: "not_required" })];
      const alerts = identifyExitInterviewAlerts(recs);
      const match = alerts.find((a) => a.type === "handover_not_started");
      expect(match).toBeUndefined();
    });

    it("message contains 'begin knowledge transfer'", () => {
      const recs = [makeRecord({ handover_status: "not_started" })];
      const alerts = identifyExitInterviewAlerts(recs);
      const match = alerts.find((a) => a.type === "handover_not_started");
      expect(match!.message).toContain("begin knowledge transfer");
    });
  });

  // ── children_not_informed (medium, aggregate) ─────────────────────────

  describe("children_not_informed alert", () => {
    it("fires when 1 record has children not informed", () => {
      const recs = [makeRecord({ children_informed: false })];
      const alerts = identifyExitInterviewAlerts(recs);
      const match = alerts.find((a) => a.type === "children_not_informed");
      expect(match).toBeDefined();
    });

    it("has severity medium", () => {
      const recs = [makeRecord({ children_informed: false })];
      const alerts = identifyExitInterviewAlerts(recs);
      const match = alerts.find((a) => a.type === "children_not_informed");
      expect(match!.severity).toBe("medium");
    });

    it("uses singular 'departure — children have' for 1 record", () => {
      const recs = [makeRecord({ children_informed: false })];
      const alerts = identifyExitInterviewAlerts(recs);
      const match = alerts.find((a) => a.type === "children_not_informed");
      expect(match!.message).toContain("departure — children have");
    });

    it("uses plural 'departures — children have' for 2+ records", () => {
      const recs = [
        makeRecord({ children_informed: false }),
        makeRecord({ children_informed: false }),
      ];
      const alerts = identifyExitInterviewAlerts(recs);
      const match = alerts.find((a) => a.type === "children_not_informed");
      expect(match!.message).toContain("departures — children have");
    });

    it("includes count in message", () => {
      const recs = [
        makeRecord({ children_informed: false }),
        makeRecord({ children_informed: false }),
        makeRecord({ children_informed: false }),
      ];
      const alerts = identifyExitInterviewAlerts(recs);
      const match = alerts.find((a) => a.type === "children_not_informed");
      expect(match!.message).toContain("3 departures");
    });

    it("alert id is 'children_not_informed'", () => {
      const recs = [makeRecord({ children_informed: false })];
      const alerts = identifyExitInterviewAlerts(recs);
      const match = alerts.find((a) => a.type === "children_not_informed");
      expect(match!.id).toBe("children_not_informed");
    });

    it("does not fire when all children informed", () => {
      const recs = [makeRecord({ children_informed: true })];
      const alerts = identifyExitInterviewAlerts(recs);
      const match = alerts.find((a) => a.type === "children_not_informed");
      expect(match).toBeUndefined();
    });

    it("message contains 'communicate sensitively'", () => {
      const recs = [makeRecord({ children_informed: false })];
      const alerts = identifyExitInterviewAlerts(recs);
      const match = alerts.find((a) => a.type === "children_not_informed");
      expect(match!.message).toContain("communicate sensitively");
    });
  });

  // ── Multiple alert types ──────────────────────────────────────────────

  describe("multiple alert types", () => {
    it("fires all alert types when all conditions are met", () => {
      const recs = [
        makeRecord({
          id: "r1",
          safeguarding_debrief_completed: false,
          staff_name: "Alice",
          leaving_date: "2026-06-01",
          access_revoked: false,
          keys_returned: false,
          handover_status: "not_started",
          children_informed: false,
        }),
      ];
      const alerts = identifyExitInterviewAlerts(recs);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("no_safeguarding_debrief");
      expect(types).toContain("access_not_revoked");
      expect(types).toContain("keys_not_returned");
      expect(types).toContain("handover_not_started");
      expect(types).toContain("children_not_informed");
    });

    it("returns correct total count when all alert types fire from 1 record", () => {
      const recs = [
        makeRecord({
          id: "r1",
          safeguarding_debrief_completed: false,
          staff_name: "Alice",
          leaving_date: "2026-06-01",
          access_revoked: false,
          keys_returned: false,
          handover_status: "not_started",
          children_informed: false,
        }),
      ];
      const alerts = identifyExitInterviewAlerts(recs);
      // 1 per-record (safeguarding) + 4 aggregate = 5
      expect(alerts.length).toBe(5);
    });

    it("returns correct count with 2 non-debriefed records and all aggregate issues", () => {
      const recs = [
        makeRecord({
          id: "r1",
          safeguarding_debrief_completed: false,
          staff_name: "Alice",
          leaving_date: "2026-06-01",
          access_revoked: false,
          keys_returned: false,
          handover_status: "not_started",
          children_informed: false,
        }),
        makeRecord({
          id: "r2",
          safeguarding_debrief_completed: false,
          staff_name: "Bob",
          leaving_date: "2026-06-15",
          access_revoked: false,
          keys_returned: false,
          handover_status: "not_started",
          children_informed: false,
        }),
      ];
      const alerts = identifyExitInterviewAlerts(recs);
      // 2 per-record (safeguarding) + 4 aggregate = 6
      expect(alerts.length).toBe(6);
    });

    it("mixes per-record and aggregate alerts correctly", () => {
      const recs = [
        makeRecord({
          id: "r1",
          safeguarding_debrief_completed: false,
          staff_name: "Alice",
          leaving_date: "2026-06-01",
          access_revoked: true,
          keys_returned: true,
          handover_status: "completed",
          children_informed: true,
        }),
        makeRecord({
          id: "r2",
          safeguarding_debrief_completed: true,
          access_revoked: false,
          keys_returned: true,
          handover_status: "completed",
          children_informed: true,
        }),
      ];
      const alerts = identifyExitInterviewAlerts(recs);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("no_safeguarding_debrief");
      expect(types).toContain("access_not_revoked");
      expect(types).not.toContain("keys_not_returned");
      expect(types).not.toContain("handover_not_started");
      expect(types).not.toContain("children_not_informed");
    });
  });

  // ── Alert structure ───────────────────────────────────────────────────

  describe("alert structure", () => {
    it("every alert has type, severity, message, and id fields", () => {
      const recs = [
        makeRecord({
          id: "r1",
          safeguarding_debrief_completed: false,
          staff_name: "Alice",
          leaving_date: "2026-06-01",
          access_revoked: false,
          keys_returned: false,
          handover_status: "not_started",
          children_informed: false,
        }),
      ];
      const alerts = identifyExitInterviewAlerts(recs);
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

    it("severity is always one of critical, high, or medium", () => {
      const recs = [
        makeRecord({
          id: "r1",
          safeguarding_debrief_completed: false,
          staff_name: "Alice",
          leaving_date: "2026-06-01",
          access_revoked: false,
          keys_returned: false,
          handover_status: "not_started",
          children_informed: false,
        }),
      ];
      const alerts = identifyExitInterviewAlerts(recs);
      for (const alert of alerts) {
        expect(["critical", "high", "medium"]).toContain(alert.severity);
      }
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. CRUD FALLBACK (Supabase disabled)
// ═══════════════════════════════════════════════════════════════════════════

describe("CRUD fallback (Supabase disabled)", () => {
  it("listRecords returns ok with empty array", async () => {
    const result = await listRecords("home-1");
    expect(result).toEqual({ ok: true, data: [] });
  });

  it("listRecords returns ok with empty array when filters provided", async () => {
    const result = await listRecords("home-1", { leavingReason: "burnout" });
    expect(result).toEqual({ ok: true, data: [] });
  });

  it("createRecord returns error when Supabase not configured", async () => {
    const result = await createRecord({
      homeId: "home-1",
      staffName: "Test",
      role: "Support Worker",
      leavingDate: "2026-06-01",
      interviewDate: "2026-05-28",
      leavingReason: "career_progression",
      satisfactionRating: "satisfied",
      handoverStatus: "completed",
      rehireRecommendation: "yes",
      lengthOfServiceMonths: 12,
      wouldRecommendEmployer: true,
      feltSupported: true,
      adequateTraining: true,
      safeguardingDebriefCompleted: true,
      keysReturned: true,
      accessRevoked: true,
      dbsNotificationSent: true,
      childrenInformed: true,
      childrenSupportedThroughTransition: true,
      feedbackThemes: [],
      improvementsSuggested: [],
      interviewedBy: "Manager",
    });
    expect(result.ok).toBe(false);
  });

  it("updateRecord returns error when Supabase not configured", async () => {
    const result = await updateRecord("some-id", { staff_name: "Updated" });
    expect(result.ok).toBe(false);
  });
});
