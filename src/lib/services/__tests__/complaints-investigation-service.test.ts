// ══════════════════════════════════════════════════════════════════════════════
// CARA — COMPLAINTS INVESTIGATION SERVICE TESTS
// Pure-function unit tests for complaint metrics computation, alert
// identification, and constant validation.
// CHR 2015 Reg 38 (complaints — investigation and resolution),
// Reg 13 (leadership — learning from complaints),
// Children Act 1989 s26 (representations and complaints).
//
// Covers: complaints received, investigation stages, outcomes,
// timescales, learning, and complainant satisfaction.
//
// SCCIF: Leadership & Management — "Complaints are investigated
// thoroughly and used as opportunities for learning."
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi } from "vitest";
import crypto from "crypto";

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => false,
  createServerClient: () => null,
}));

import {
  _testing,
  COMPLAINT_SOURCES,
  COMPLAINT_CATEGORIES,
  INVESTIGATION_STAGES,
  COMPLAINT_OUTCOMES,
} from "../complaints-investigation-service";

import type { ComplaintInvestigation } from "../complaints-investigation-service";

const { computeComplaintMetrics, identifyComplaintAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Build a minimal ComplaintInvestigation with sensible defaults. */
function makeComplaint(
  overrides: Partial<ComplaintInvestigation> = {},
): ComplaintInvestigation {
  return {
    id: crypto.randomUUID(),
    home_id: "home-1",
    complaint_date: "2024-06-01",
    complaint_source: "parent_carer",
    complaint_category: "care_quality",
    investigation_stage: "resolved",
    complaint_outcome: "not_upheld",
    complainant_name: "Jane Doe",
    is_child_complaint: false,
    investigating_officer: "Officer Smith",
    acknowledged_within_24h: true,
    investigation_started_within_5_days: true,
    resolved_within_28_days:
      "resolved_within_28_days" in (overrides ?? {})
        ? (overrides!.resolved_within_28_days ?? null)
        : true,
    days_to_resolution:
      "days_to_resolution" in (overrides ?? {})
        ? (overrides!.days_to_resolution ?? null)
        : 14,
    learning_identified: false,
    learning_details:
      "learning_details" in (overrides ?? {})
        ? (overrides!.learning_details ?? null)
        : null,
    actions_taken: [],
    ofsted_notified: false,
    complainant_satisfaction:
      "complainant_satisfaction" in (overrides ?? {})
        ? (overrides!.complainant_satisfaction ?? null)
        : "satisfied",
    review_date:
      "review_date" in (overrides ?? {})
        ? (overrides!.review_date ?? null)
        : null,
    notes:
      "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: "2024-06-01T10:00:00.000Z",
    updated_at: "2024-06-01T10:00:00.000Z",
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

describe("COMPLAINT_SOURCES", () => {
  it("has exactly 9 entries", () => {
    expect(COMPLAINT_SOURCES).toHaveLength(9);
  });

  it("contains unique source values", () => {
    const values = COMPLAINT_SOURCES.map((s) => s.source);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = COMPLAINT_SOURCES.map((s) => s.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("each entry has a non-empty label", () => {
    for (const s of COMPLAINT_SOURCES) {
      expect(s.label.length).toBeGreaterThan(0);
    }
  });

  it("includes child", () => {
    expect(COMPLAINT_SOURCES.find((s) => s.source === "child")).toBeTruthy();
  });

  it("includes parent_carer", () => {
    expect(COMPLAINT_SOURCES.find((s) => s.source === "parent_carer")).toBeTruthy();
  });

  it("includes social_worker", () => {
    expect(COMPLAINT_SOURCES.find((s) => s.source === "social_worker")).toBeTruthy();
  });

  it("includes placing_authority", () => {
    expect(COMPLAINT_SOURCES.find((s) => s.source === "placing_authority")).toBeTruthy();
  });

  it("includes staff", () => {
    expect(COMPLAINT_SOURCES.find((s) => s.source === "staff")).toBeTruthy();
  });

  it("includes advocate", () => {
    expect(COMPLAINT_SOURCES.find((s) => s.source === "advocate")).toBeTruthy();
  });

  it("includes irp", () => {
    expect(COMPLAINT_SOURCES.find((s) => s.source === "irp")).toBeTruthy();
  });

  it("includes anonymous", () => {
    expect(COMPLAINT_SOURCES.find((s) => s.source === "anonymous")).toBeTruthy();
  });

  it("includes other", () => {
    expect(COMPLAINT_SOURCES.find((s) => s.source === "other")).toBeTruthy();
  });
});

describe("COMPLAINT_CATEGORIES", () => {
  it("has exactly 11 entries", () => {
    expect(COMPLAINT_CATEGORIES).toHaveLength(11);
  });

  it("contains unique category values", () => {
    const values = COMPLAINT_CATEGORIES.map((c) => c.category);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = COMPLAINT_CATEGORIES.map((c) => c.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("each entry has a non-empty label", () => {
    for (const c of COMPLAINT_CATEGORIES) {
      expect(c.label.length).toBeGreaterThan(0);
    }
  });

  it("includes care_quality", () => {
    expect(COMPLAINT_CATEGORIES.find((c) => c.category === "care_quality")).toBeTruthy();
  });

  it("includes staff_conduct", () => {
    expect(COMPLAINT_CATEGORIES.find((c) => c.category === "staff_conduct")).toBeTruthy();
  });

  it("includes safeguarding", () => {
    expect(COMPLAINT_CATEGORIES.find((c) => c.category === "safeguarding")).toBeTruthy();
  });

  it("includes medication", () => {
    expect(COMPLAINT_CATEGORIES.find((c) => c.category === "medication")).toBeTruthy();
  });

  it("includes food_nutrition", () => {
    expect(COMPLAINT_CATEGORIES.find((c) => c.category === "food_nutrition")).toBeTruthy();
  });

  it("includes activities", () => {
    expect(COMPLAINT_CATEGORIES.find((c) => c.category === "activities")).toBeTruthy();
  });

  it("includes contact_arrangements", () => {
    expect(COMPLAINT_CATEGORIES.find((c) => c.category === "contact_arrangements")).toBeTruthy();
  });

  it("includes environment", () => {
    expect(COMPLAINT_CATEGORIES.find((c) => c.category === "environment")).toBeTruthy();
  });

  it("includes communication", () => {
    expect(COMPLAINT_CATEGORIES.find((c) => c.category === "communication")).toBeTruthy();
  });

  it("includes discrimination", () => {
    expect(COMPLAINT_CATEGORIES.find((c) => c.category === "discrimination")).toBeTruthy();
  });

  it("includes other", () => {
    expect(COMPLAINT_CATEGORIES.find((c) => c.category === "other")).toBeTruthy();
  });
});

describe("INVESTIGATION_STAGES", () => {
  it("has exactly 7 entries", () => {
    expect(INVESTIGATION_STAGES).toHaveLength(7);
  });

  it("contains unique stage values", () => {
    const values = INVESTIGATION_STAGES.map((s) => s.stage);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = INVESTIGATION_STAGES.map((s) => s.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("each entry has a non-empty label", () => {
    for (const s of INVESTIGATION_STAGES) {
      expect(s.label.length).toBeGreaterThan(0);
    }
  });

  it("includes received", () => {
    expect(INVESTIGATION_STAGES.find((s) => s.stage === "received")).toBeTruthy();
  });

  it("includes acknowledged", () => {
    expect(INVESTIGATION_STAGES.find((s) => s.stage === "acknowledged")).toBeTruthy();
  });

  it("includes investigating", () => {
    expect(INVESTIGATION_STAGES.find((s) => s.stage === "investigating")).toBeTruthy();
  });

  it("includes outcome_reached", () => {
    expect(INVESTIGATION_STAGES.find((s) => s.stage === "outcome_reached")).toBeTruthy();
  });

  it("includes resolved", () => {
    expect(INVESTIGATION_STAGES.find((s) => s.stage === "resolved")).toBeTruthy();
  });

  it("includes escalated", () => {
    expect(INVESTIGATION_STAGES.find((s) => s.stage === "escalated")).toBeTruthy();
  });

  it("includes withdrawn", () => {
    expect(INVESTIGATION_STAGES.find((s) => s.stage === "withdrawn")).toBeTruthy();
  });
});

describe("COMPLAINT_OUTCOMES", () => {
  it("has exactly 6 entries", () => {
    expect(COMPLAINT_OUTCOMES).toHaveLength(6);
  });

  it("contains unique outcome values", () => {
    const values = COMPLAINT_OUTCOMES.map((o) => o.outcome);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = COMPLAINT_OUTCOMES.map((o) => o.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("each entry has a non-empty label", () => {
    for (const o of COMPLAINT_OUTCOMES) {
      expect(o.label.length).toBeGreaterThan(0);
    }
  });

  it("includes upheld", () => {
    expect(COMPLAINT_OUTCOMES.find((o) => o.outcome === "upheld")).toBeTruthy();
  });

  it("includes partially_upheld", () => {
    expect(COMPLAINT_OUTCOMES.find((o) => o.outcome === "partially_upheld")).toBeTruthy();
  });

  it("includes not_upheld", () => {
    expect(COMPLAINT_OUTCOMES.find((o) => o.outcome === "not_upheld")).toBeTruthy();
  });

  it("includes withdrawn", () => {
    expect(COMPLAINT_OUTCOMES.find((o) => o.outcome === "withdrawn")).toBeTruthy();
  });

  it("includes pending", () => {
    expect(COMPLAINT_OUTCOMES.find((o) => o.outcome === "pending")).toBeTruthy();
  });

  it("includes inconclusive", () => {
    expect(COMPLAINT_OUTCOMES.find((o) => o.outcome === "inconclusive")).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. computeComplaintMetrics
// ═══════════════════════════════════════════════════════════════════════════

describe("computeComplaintMetrics", () => {
  // ── Empty array ──────────────────────────────────────────────────────
  describe("empty complaints", () => {
    it("returns zero total_complaints", () => {
      expect(computeComplaintMetrics([]).total_complaints).toBe(0);
    });

    it("returns zero child_complaints", () => {
      expect(computeComplaintMetrics([]).child_complaints).toBe(0);
    });

    it("returns zero open_complaints", () => {
      expect(computeComplaintMetrics([]).open_complaints).toBe(0);
    });

    it("returns zero resolved_complaints", () => {
      expect(computeComplaintMetrics([]).resolved_complaints).toBe(0);
    });

    it("returns zero escalated_complaints", () => {
      expect(computeComplaintMetrics([]).escalated_complaints).toBe(0);
    });

    it("returns zero upheld_count", () => {
      expect(computeComplaintMetrics([]).upheld_count).toBe(0);
    });

    it("returns zero partially_upheld_count", () => {
      expect(computeComplaintMetrics([]).partially_upheld_count).toBe(0);
    });

    it("returns zero not_upheld_count", () => {
      expect(computeComplaintMetrics([]).not_upheld_count).toBe(0);
    });

    it("returns zero acknowledged_rate", () => {
      expect(computeComplaintMetrics([]).acknowledged_rate).toBeNull(); // fab-0.;
    });

    it("returns zero investigation_started_rate", () => {
      expect(computeComplaintMetrics([]).investigation_started_rate).toBeNull(); // fab-0.;
    });

    it("returns zero resolved_within_28_days_rate", () => {
      expect(computeComplaintMetrics([]).resolved_within_28_days_rate).toBeNull(); // fab-0.;
    });

    it("returns zero average_days_to_resolution", () => {
      expect(computeComplaintMetrics([]).average_days_to_resolution).toBeNull(); // fab-0.;
    });

    it("returns zero learning_identified_rate", () => {
      expect(computeComplaintMetrics([]).learning_identified_rate).toBeNull(); // fab-0.;
    });

    it("returns zero ofsted_notified_count", () => {
      expect(computeComplaintMetrics([]).ofsted_notified_count).toBe(0);
    });

    it("returns zero satisfaction_rate", () => {
      expect(computeComplaintMetrics([]).satisfaction_rate).toBeNull(); // fab-0.;
    });

    it("returns empty by_source", () => {
      expect(computeComplaintMetrics([]).by_source).toEqual({});
    });

    it("returns empty by_category", () => {
      expect(computeComplaintMetrics([]).by_category).toEqual({});
    });

    it("returns empty by_stage", () => {
      expect(computeComplaintMetrics([]).by_stage).toEqual({});
    });

    it("returns empty by_outcome", () => {
      expect(computeComplaintMetrics([]).by_outcome).toEqual({});
    });
  });

  // ── Single record ──────────────────────────────────────────────────
  describe("single complaint", () => {
    const single = [makeComplaint()];

    it("total_complaints is 1", () => {
      expect(computeComplaintMetrics(single).total_complaints).toBe(1);
    });

    it("child_complaints is 0 for non-child complaint", () => {
      expect(computeComplaintMetrics(single).child_complaints).toBe(0);
    });

    it("child_complaints is 1 when is_child_complaint is true", () => {
      const c = [makeComplaint({ is_child_complaint: true })];
      expect(computeComplaintMetrics(c).child_complaints).toBe(1);
    });

    it("open_complaints is 0 for resolved complaint", () => {
      expect(computeComplaintMetrics(single).open_complaints).toBe(0);
    });

    it("resolved_complaints is 1 for resolved complaint", () => {
      expect(computeComplaintMetrics(single).resolved_complaints).toBe(1);
    });

    it("escalated_complaints is 0 for resolved complaint", () => {
      expect(computeComplaintMetrics(single).escalated_complaints).toBe(0);
    });

    it("upheld_count is 0 for not_upheld complaint", () => {
      expect(computeComplaintMetrics(single).upheld_count).toBe(0);
    });

    it("not_upheld_count is 1 for not_upheld complaint", () => {
      expect(computeComplaintMetrics(single).not_upheld_count).toBe(1);
    });

    it("acknowledged_rate is 100 when acknowledged_within_24h is true", () => {
      expect(computeComplaintMetrics(single).acknowledged_rate).toBe(100);
    });

    it("investigation_started_rate is 100 when investigation_started_within_5_days is true", () => {
      expect(computeComplaintMetrics(single).investigation_started_rate).toBe(100);
    });

    it("resolved_within_28_days_rate is 100 when resolved_within_28_days is true", () => {
      expect(computeComplaintMetrics(single).resolved_within_28_days_rate).toBe(100);
    });

    it("average_days_to_resolution is 14 for default record", () => {
      expect(computeComplaintMetrics(single).average_days_to_resolution).toBe(14);
    });

    it("learning_identified_rate is 0 when learning_identified is false", () => {
      expect(computeComplaintMetrics(single).learning_identified_rate).toBe(0);
    });

    it("ofsted_notified_count is 0 when ofsted_notified is false", () => {
      expect(computeComplaintMetrics(single).ofsted_notified_count).toBe(0);
    });

    it("satisfaction_rate is 100 when complainant_satisfaction is satisfied", () => {
      expect(computeComplaintMetrics(single).satisfaction_rate).toBe(100);
    });

    it("by_source groups single record correctly", () => {
      expect(computeComplaintMetrics(single).by_source).toEqual({ parent_carer: 1 });
    });

    it("by_category groups single record correctly", () => {
      expect(computeComplaintMetrics(single).by_category).toEqual({ care_quality: 1 });
    });

    it("by_stage groups single record correctly", () => {
      expect(computeComplaintMetrics(single).by_stage).toEqual({ resolved: 1 });
    });

    it("by_outcome groups single record correctly", () => {
      expect(computeComplaintMetrics(single).by_outcome).toEqual({ not_upheld: 1 });
    });
  });

  // ── Multiple records ─────────────────────────────────────────────────
  describe("multiple complaints", () => {
    const records = [
      makeComplaint({
        id: "c-1",
        complaint_source: "child",
        complaint_category: "care_quality",
        investigation_stage: "resolved",
        complaint_outcome: "upheld",
        is_child_complaint: true,
        acknowledged_within_24h: true,
        investigation_started_within_5_days: true,
        resolved_within_28_days: true,
        days_to_resolution: 10,
        learning_identified: true,
        ofsted_notified: true,
        complainant_satisfaction: "satisfied",
      }),
      makeComplaint({
        id: "c-2",
        complaint_source: "parent_carer",
        complaint_category: "staff_conduct",
        investigation_stage: "investigating",
        complaint_outcome: "pending",
        is_child_complaint: false,
        acknowledged_within_24h: false,
        investigation_started_within_5_days: false,
        resolved_within_28_days: null,
        days_to_resolution: null,
        learning_identified: false,
        ofsted_notified: false,
        complainant_satisfaction: "dissatisfied",
      }),
      makeComplaint({
        id: "c-3",
        complaint_source: "social_worker",
        complaint_category: "safeguarding",
        investigation_stage: "escalated",
        complaint_outcome: "partially_upheld",
        is_child_complaint: true,
        acknowledged_within_24h: true,
        investigation_started_within_5_days: true,
        resolved_within_28_days: false,
        days_to_resolution: 35,
        learning_identified: true,
        ofsted_notified: true,
        complainant_satisfaction: "partially_satisfied",
      }),
      makeComplaint({
        id: "c-4",
        complaint_source: "staff",
        complaint_category: "medication",
        investigation_stage: "withdrawn",
        complaint_outcome: "withdrawn",
        is_child_complaint: false,
        acknowledged_within_24h: true,
        investigation_started_within_5_days: true,
        resolved_within_28_days: null,
        days_to_resolution: null,
        learning_identified: false,
        ofsted_notified: false,
        complainant_satisfaction: null,
      }),
      makeComplaint({
        id: "c-5",
        complaint_source: "child",
        complaint_category: "food_nutrition",
        investigation_stage: "resolved",
        complaint_outcome: "not_upheld",
        is_child_complaint: true,
        acknowledged_within_24h: true,
        investigation_started_within_5_days: true,
        resolved_within_28_days: true,
        days_to_resolution: 20,
        learning_identified: false,
        ofsted_notified: false,
        complainant_satisfaction: "not_recorded",
      }),
    ];

    it("total_complaints is 5", () => {
      expect(computeComplaintMetrics(records).total_complaints).toBe(5);
    });

    it("child_complaints is 3", () => {
      expect(computeComplaintMetrics(records).child_complaints).toBe(3);
    });

    it("open_complaints is 2 (investigating + escalated)", () => {
      expect(computeComplaintMetrics(records).open_complaints).toBe(2);
    });

    it("resolved_complaints is 2", () => {
      expect(computeComplaintMetrics(records).resolved_complaints).toBe(2);
    });

    it("escalated_complaints is 1", () => {
      expect(computeComplaintMetrics(records).escalated_complaints).toBe(1);
    });

    it("upheld_count is 1", () => {
      expect(computeComplaintMetrics(records).upheld_count).toBe(1);
    });

    it("partially_upheld_count is 1", () => {
      expect(computeComplaintMetrics(records).partially_upheld_count).toBe(1);
    });

    it("not_upheld_count is 1", () => {
      expect(computeComplaintMetrics(records).not_upheld_count).toBe(1);
    });

    it("acknowledged_rate is 80 (4 of 5)", () => {
      expect(computeComplaintMetrics(records).acknowledged_rate).toBe(80);
    });

    it("investigation_started_rate is 80 (4 of 5)", () => {
      expect(computeComplaintMetrics(records).investigation_started_rate).toBe(80);
    });

    it("resolved_within_28_days_rate is 66.7 (2 of 3 non-null)", () => {
      expect(computeComplaintMetrics(records).resolved_within_28_days_rate).toBe(66.7);
    });

    it("average_days_to_resolution is 21.7 ((10+35+20)/3)", () => {
      expect(computeComplaintMetrics(records).average_days_to_resolution).toBe(21.7);
    });

    it("learning_identified_rate is 40 (2 of 5)", () => {
      expect(computeComplaintMetrics(records).learning_identified_rate).toBe(40);
    });

    it("ofsted_notified_count is 2", () => {
      expect(computeComplaintMetrics(records).ofsted_notified_count).toBe(2);
    });

    it("satisfaction_rate is 33.3 (1 satisfied of 3 valid)", () => {
      // valid = satisfied, dissatisfied, partially_satisfied (excludes null and not_recorded)
      expect(computeComplaintMetrics(records).satisfaction_rate).toBe(33.3);
    });

    it("by_source groups correctly", () => {
      expect(computeComplaintMetrics(records).by_source).toEqual({
        child: 2,
        parent_carer: 1,
        social_worker: 1,
        staff: 1,
      });
    });

    it("by_category groups correctly", () => {
      expect(computeComplaintMetrics(records).by_category).toEqual({
        care_quality: 1,
        staff_conduct: 1,
        safeguarding: 1,
        medication: 1,
        food_nutrition: 1,
      });
    });

    it("by_stage groups correctly", () => {
      expect(computeComplaintMetrics(records).by_stage).toEqual({
        resolved: 2,
        investigating: 1,
        escalated: 1,
        withdrawn: 1,
      });
    });

    it("by_outcome groups correctly", () => {
      expect(computeComplaintMetrics(records).by_outcome).toEqual({
        upheld: 1,
        partially_upheld: 1,
        not_upheld: 1,
        pending: 1,
        withdrawn: 1,
      });
    });
  });

  // ── open_complaints logic ─────────────────────────────────────────────
  describe("open_complaints logic", () => {
    it("counts received as open", () => {
      const c = [makeComplaint({ investigation_stage: "received" })];
      expect(computeComplaintMetrics(c).open_complaints).toBe(1);
    });

    it("counts acknowledged as open", () => {
      const c = [makeComplaint({ investigation_stage: "acknowledged" })];
      expect(computeComplaintMetrics(c).open_complaints).toBe(1);
    });

    it("counts investigating as open", () => {
      const c = [makeComplaint({ investigation_stage: "investigating" })];
      expect(computeComplaintMetrics(c).open_complaints).toBe(1);
    });

    it("counts outcome_reached as open", () => {
      const c = [makeComplaint({ investigation_stage: "outcome_reached" })];
      expect(computeComplaintMetrics(c).open_complaints).toBe(1);
    });

    it("counts escalated as open", () => {
      const c = [makeComplaint({ investigation_stage: "escalated" })];
      expect(computeComplaintMetrics(c).open_complaints).toBe(1);
    });

    it("does NOT count resolved as open", () => {
      const c = [makeComplaint({ investigation_stage: "resolved" })];
      expect(computeComplaintMetrics(c).open_complaints).toBe(0);
    });

    it("does NOT count withdrawn as open", () => {
      const c = [makeComplaint({ investigation_stage: "withdrawn" })];
      expect(computeComplaintMetrics(c).open_complaints).toBe(0);
    });

    it("counts multiple open stages correctly", () => {
      const c = [
        makeComplaint({ id: "1", investigation_stage: "received" }),
        makeComplaint({ id: "2", investigation_stage: "investigating" }),
        makeComplaint({ id: "3", investigation_stage: "resolved" }),
        makeComplaint({ id: "4", investigation_stage: "withdrawn" }),
        makeComplaint({ id: "5", investigation_stage: "escalated" }),
      ];
      expect(computeComplaintMetrics(c).open_complaints).toBe(3);
    });
  });

  // ── resolved_within_28_days_rate ──────────────────────────────────────
  describe("resolved_within_28_days_rate", () => {
    it("is 0 when all resolved_within_28_days are null", () => {
      const c = [
        makeComplaint({ id: "1", resolved_within_28_days: null }),
        makeComplaint({ id: "2", resolved_within_28_days: null }),
      ];
      expect(computeComplaintMetrics(c).resolved_within_28_days_rate).toBeNull(); // fab-0.;
    });

    it("is 100 when all non-null are true", () => {
      const c = [
        makeComplaint({ id: "1", resolved_within_28_days: true }),
        makeComplaint({ id: "2", resolved_within_28_days: true }),
        makeComplaint({ id: "3", resolved_within_28_days: null }),
      ];
      expect(computeComplaintMetrics(c).resolved_within_28_days_rate).toBe(100);
    });

    it("is 0 when all non-null are false", () => {
      const c = [
        makeComplaint({ id: "1", resolved_within_28_days: false }),
        makeComplaint({ id: "2", resolved_within_28_days: false }),
      ];
      expect(computeComplaintMetrics(c).resolved_within_28_days_rate).toBe(0);
    });

    it("is 50 for 1 true 1 false", () => {
      const c = [
        makeComplaint({ id: "1", resolved_within_28_days: true }),
        makeComplaint({ id: "2", resolved_within_28_days: false }),
      ];
      expect(computeComplaintMetrics(c).resolved_within_28_days_rate).toBe(50);
    });

    it("excludes null from denominator", () => {
      const c = [
        makeComplaint({ id: "1", resolved_within_28_days: true }),
        makeComplaint({ id: "2", resolved_within_28_days: null }),
        makeComplaint({ id: "3", resolved_within_28_days: null }),
      ];
      // 1 true of 1 non-null = 100
      expect(computeComplaintMetrics(c).resolved_within_28_days_rate).toBe(100);
    });

    it("rounds correctly for 1 of 3 (33.3)", () => {
      const c = [
        makeComplaint({ id: "1", resolved_within_28_days: true }),
        makeComplaint({ id: "2", resolved_within_28_days: false }),
        makeComplaint({ id: "3", resolved_within_28_days: false }),
      ];
      expect(computeComplaintMetrics(c).resolved_within_28_days_rate).toBe(33.3);
    });

    it("rounds correctly for 2 of 3 (66.7)", () => {
      const c = [
        makeComplaint({ id: "1", resolved_within_28_days: true }),
        makeComplaint({ id: "2", resolved_within_28_days: true }),
        makeComplaint({ id: "3", resolved_within_28_days: false }),
      ];
      expect(computeComplaintMetrics(c).resolved_within_28_days_rate).toBe(66.7);
    });
  });

  // ── average_days_to_resolution ────────────────────────────────────────
  describe("average_days_to_resolution", () => {
    it("is 0 when all days_to_resolution are null", () => {
      const c = [
        makeComplaint({ id: "1", days_to_resolution: null }),
        makeComplaint({ id: "2", days_to_resolution: null }),
      ];
      expect(computeComplaintMetrics(c).average_days_to_resolution).toBeNull(); // fab-0.;
    });

    it("returns the single value when only one record has days", () => {
      const c = [makeComplaint({ days_to_resolution: 21 })];
      expect(computeComplaintMetrics(c).average_days_to_resolution).toBe(21);
    });

    it("averages multiple values correctly", () => {
      const c = [
        makeComplaint({ id: "1", days_to_resolution: 10 }),
        makeComplaint({ id: "2", days_to_resolution: 20 }),
      ];
      expect(computeComplaintMetrics(c).average_days_to_resolution).toBe(15);
    });

    it("excludes null from average", () => {
      const c = [
        makeComplaint({ id: "1", days_to_resolution: 10 }),
        makeComplaint({ id: "2", days_to_resolution: null }),
        makeComplaint({ id: "3", days_to_resolution: 20 }),
      ];
      // (10 + 20) / 2 = 15
      expect(computeComplaintMetrics(c).average_days_to_resolution).toBe(15);
    });

    it("rounds to one decimal place", () => {
      const c = [
        makeComplaint({ id: "1", days_to_resolution: 10 }),
        makeComplaint({ id: "2", days_to_resolution: 20 }),
        makeComplaint({ id: "3", days_to_resolution: 30 }),
      ];
      // (10 + 20 + 30) / 3 = 20
      expect(computeComplaintMetrics(c).average_days_to_resolution).toBe(20);
    });

    it("rounds correctly for non-round average (7 + 8 = 15 / 2 = 7.5)", () => {
      const c = [
        makeComplaint({ id: "1", days_to_resolution: 7 }),
        makeComplaint({ id: "2", days_to_resolution: 8 }),
      ];
      expect(computeComplaintMetrics(c).average_days_to_resolution).toBe(7.5);
    });

    it("rounds correctly for repeating decimal (10+20+30)/3 from different values", () => {
      const c = [
        makeComplaint({ id: "1", days_to_resolution: 5 }),
        makeComplaint({ id: "2", days_to_resolution: 10 }),
        makeComplaint({ id: "3", days_to_resolution: 17 }),
      ];
      // (5 + 10 + 17) / 3 = 10.666... -> 10.7
      expect(computeComplaintMetrics(c).average_days_to_resolution).toBe(10.7);
    });
  });

  // ── satisfaction_rate ────────────────────────────────────────────────
  describe("satisfaction_rate", () => {
    it("is 0 when all complainant_satisfaction are null", () => {
      const c = [
        makeComplaint({ id: "1", complainant_satisfaction: null }),
        makeComplaint({ id: "2", complainant_satisfaction: null }),
      ];
      expect(computeComplaintMetrics(c).satisfaction_rate).toBeNull(); // fab-0.;
    });

    it("is 0 when all complainant_satisfaction are not_recorded", () => {
      const c = [
        makeComplaint({ id: "1", complainant_satisfaction: "not_recorded" }),
        makeComplaint({ id: "2", complainant_satisfaction: "not_recorded" }),
      ];
      expect(computeComplaintMetrics(c).satisfaction_rate).toBeNull(); // fab-0.;
    });

    it("is 0 when mix of null and not_recorded only", () => {
      const c = [
        makeComplaint({ id: "1", complainant_satisfaction: null }),
        makeComplaint({ id: "2", complainant_satisfaction: "not_recorded" }),
      ];
      expect(computeComplaintMetrics(c).satisfaction_rate).toBeNull(); // fab-0.;
    });

    it("is 100 when all valid are satisfied", () => {
      const c = [
        makeComplaint({ id: "1", complainant_satisfaction: "satisfied" }),
        makeComplaint({ id: "2", complainant_satisfaction: "satisfied" }),
      ];
      expect(computeComplaintMetrics(c).satisfaction_rate).toBe(100);
    });

    it("is 0 when all valid are dissatisfied", () => {
      const c = [
        makeComplaint({ id: "1", complainant_satisfaction: "dissatisfied" }),
        makeComplaint({ id: "2", complainant_satisfaction: "dissatisfied" }),
      ];
      expect(computeComplaintMetrics(c).satisfaction_rate).toBe(0);
    });

    it("is 0 when all valid are partially_satisfied", () => {
      const c = [
        makeComplaint({ id: "1", complainant_satisfaction: "partially_satisfied" }),
      ];
      expect(computeComplaintMetrics(c).satisfaction_rate).toBe(0);
    });

    it("counts only satisfied, not partially_satisfied", () => {
      const c = [
        makeComplaint({ id: "1", complainant_satisfaction: "satisfied" }),
        makeComplaint({ id: "2", complainant_satisfaction: "partially_satisfied" }),
      ];
      // 1 satisfied of 2 valid = 50
      expect(computeComplaintMetrics(c).satisfaction_rate).toBe(50);
    });

    it("excludes null from denominator", () => {
      const c = [
        makeComplaint({ id: "1", complainant_satisfaction: "satisfied" }),
        makeComplaint({ id: "2", complainant_satisfaction: null }),
      ];
      // 1 satisfied of 1 valid = 100
      expect(computeComplaintMetrics(c).satisfaction_rate).toBe(100);
    });

    it("excludes not_recorded from denominator", () => {
      const c = [
        makeComplaint({ id: "1", complainant_satisfaction: "satisfied" }),
        makeComplaint({ id: "2", complainant_satisfaction: "not_recorded" }),
      ];
      // 1 satisfied of 1 valid = 100
      expect(computeComplaintMetrics(c).satisfaction_rate).toBe(100);
    });

    it("rounds correctly for 1 of 3 (33.3)", () => {
      const c = [
        makeComplaint({ id: "1", complainant_satisfaction: "satisfied" }),
        makeComplaint({ id: "2", complainant_satisfaction: "dissatisfied" }),
        makeComplaint({ id: "3", complainant_satisfaction: "partially_satisfied" }),
      ];
      expect(computeComplaintMetrics(c).satisfaction_rate).toBe(33.3);
    });

    it("rounds correctly for 2 of 3 (66.7)", () => {
      const c = [
        makeComplaint({ id: "1", complainant_satisfaction: "satisfied" }),
        makeComplaint({ id: "2", complainant_satisfaction: "satisfied" }),
        makeComplaint({ id: "3", complainant_satisfaction: "dissatisfied" }),
      ];
      expect(computeComplaintMetrics(c).satisfaction_rate).toBe(66.7);
    });
  });

  // ── acknowledged_rate ────────────────────────────────────────────────
  describe("acknowledged_rate", () => {
    it("is 100 when all acknowledged within 24h", () => {
      const c = [
        makeComplaint({ id: "1", acknowledged_within_24h: true }),
        makeComplaint({ id: "2", acknowledged_within_24h: true }),
      ];
      expect(computeComplaintMetrics(c).acknowledged_rate).toBe(100);
    });

    it("is 0 when none acknowledged within 24h", () => {
      const c = [
        makeComplaint({ id: "1", acknowledged_within_24h: false }),
        makeComplaint({ id: "2", acknowledged_within_24h: false }),
      ];
      expect(computeComplaintMetrics(c).acknowledged_rate).toBe(0);
    });

    it("is 50 for 1 of 2", () => {
      const c = [
        makeComplaint({ id: "1", acknowledged_within_24h: true }),
        makeComplaint({ id: "2", acknowledged_within_24h: false }),
      ];
      expect(computeComplaintMetrics(c).acknowledged_rate).toBe(50);
    });

    it("rounds correctly for 1 of 3 (33.3)", () => {
      const c = [
        makeComplaint({ id: "1", acknowledged_within_24h: true }),
        makeComplaint({ id: "2", acknowledged_within_24h: false }),
        makeComplaint({ id: "3", acknowledged_within_24h: false }),
      ];
      expect(computeComplaintMetrics(c).acknowledged_rate).toBe(33.3);
    });

    it("rounds correctly for 2 of 3 (66.7)", () => {
      const c = [
        makeComplaint({ id: "1", acknowledged_within_24h: true }),
        makeComplaint({ id: "2", acknowledged_within_24h: true }),
        makeComplaint({ id: "3", acknowledged_within_24h: false }),
      ];
      expect(computeComplaintMetrics(c).acknowledged_rate).toBe(66.7);
    });
  });

  // ── investigation_started_rate ────────────────────────────────────────
  describe("investigation_started_rate", () => {
    it("is 100 when all started within 5 days", () => {
      const c = [
        makeComplaint({ id: "1", investigation_started_within_5_days: true }),
        makeComplaint({ id: "2", investigation_started_within_5_days: true }),
      ];
      expect(computeComplaintMetrics(c).investigation_started_rate).toBe(100);
    });

    it("is 0 when none started within 5 days", () => {
      const c = [
        makeComplaint({ id: "1", investigation_started_within_5_days: false }),
        makeComplaint({ id: "2", investigation_started_within_5_days: false }),
      ];
      expect(computeComplaintMetrics(c).investigation_started_rate).toBe(0);
    });

    it("rounds correctly for 1 of 3 (33.3)", () => {
      const c = [
        makeComplaint({ id: "1", investigation_started_within_5_days: true }),
        makeComplaint({ id: "2", investigation_started_within_5_days: false }),
        makeComplaint({ id: "3", investigation_started_within_5_days: false }),
      ];
      expect(computeComplaintMetrics(c).investigation_started_rate).toBe(33.3);
    });
  });

  // ── learning_identified_rate ──────────────────────────────────────────
  describe("learning_identified_rate", () => {
    it("is 100 when all have learning identified", () => {
      const c = [
        makeComplaint({ id: "1", learning_identified: true }),
        makeComplaint({ id: "2", learning_identified: true }),
      ];
      expect(computeComplaintMetrics(c).learning_identified_rate).toBe(100);
    });

    it("is 0 when none have learning identified", () => {
      const c = [
        makeComplaint({ id: "1", learning_identified: false }),
        makeComplaint({ id: "2", learning_identified: false }),
      ];
      expect(computeComplaintMetrics(c).learning_identified_rate).toBe(0);
    });

    it("rounds correctly for 1 of 3 (33.3)", () => {
      const c = [
        makeComplaint({ id: "1", learning_identified: true }),
        makeComplaint({ id: "2", learning_identified: false }),
        makeComplaint({ id: "3", learning_identified: false }),
      ];
      expect(computeComplaintMetrics(c).learning_identified_rate).toBe(33.3);
    });
  });

  // ── Outcome counts ────────────────────────────────────────────────────
  describe("outcome counts", () => {
    it("counts only upheld outcomes", () => {
      const c = [
        makeComplaint({ id: "1", complaint_outcome: "upheld" }),
        makeComplaint({ id: "2", complaint_outcome: "upheld" }),
        makeComplaint({ id: "3", complaint_outcome: "not_upheld" }),
      ];
      expect(computeComplaintMetrics(c).upheld_count).toBe(2);
    });

    it("counts only partially_upheld outcomes", () => {
      const c = [
        makeComplaint({ id: "1", complaint_outcome: "partially_upheld" }),
        makeComplaint({ id: "2", complaint_outcome: "partially_upheld" }),
        makeComplaint({ id: "3", complaint_outcome: "upheld" }),
      ];
      expect(computeComplaintMetrics(c).partially_upheld_count).toBe(2);
    });

    it("counts only not_upheld outcomes", () => {
      const c = [
        makeComplaint({ id: "1", complaint_outcome: "not_upheld" }),
        makeComplaint({ id: "2", complaint_outcome: "not_upheld" }),
        makeComplaint({ id: "3", complaint_outcome: "upheld" }),
      ];
      expect(computeComplaintMetrics(c).not_upheld_count).toBe(2);
    });

    it("returns zero for absent outcome types", () => {
      const c = [
        makeComplaint({ id: "1", complaint_outcome: "pending" }),
        makeComplaint({ id: "2", complaint_outcome: "withdrawn" }),
      ];
      const m = computeComplaintMetrics(c);
      expect(m.upheld_count).toBe(0);
      expect(m.partially_upheld_count).toBe(0);
      expect(m.not_upheld_count).toBe(0);
    });
  });

  // ── ofsted_notified_count ─────────────────────────────────────────────
  describe("ofsted_notified_count", () => {
    it("counts all ofsted_notified true records", () => {
      const c = [
        makeComplaint({ id: "1", ofsted_notified: true }),
        makeComplaint({ id: "2", ofsted_notified: true }),
        makeComplaint({ id: "3", ofsted_notified: false }),
      ];
      expect(computeComplaintMetrics(c).ofsted_notified_count).toBe(2);
    });

    it("is 0 when none notified", () => {
      const c = [
        makeComplaint({ id: "1", ofsted_notified: false }),
        makeComplaint({ id: "2", ofsted_notified: false }),
      ];
      expect(computeComplaintMetrics(c).ofsted_notified_count).toBe(0);
    });
  });

  // ── by_ breakdown maps ────────────────────────────────────────────────
  describe("by_ breakdown maps", () => {
    it("by_source handles all sources present", () => {
      const c = [
        makeComplaint({ id: "1", complaint_source: "child" }),
        makeComplaint({ id: "2", complaint_source: "child" }),
        makeComplaint({ id: "3", complaint_source: "parent_carer" }),
        makeComplaint({ id: "4", complaint_source: "anonymous" }),
      ];
      expect(computeComplaintMetrics(c).by_source).toEqual({
        child: 2,
        parent_carer: 1,
        anonymous: 1,
      });
    });

    it("by_category handles multiple categories", () => {
      const c = [
        makeComplaint({ id: "1", complaint_category: "safeguarding" }),
        makeComplaint({ id: "2", complaint_category: "safeguarding" }),
        makeComplaint({ id: "3", complaint_category: "medication" }),
      ];
      expect(computeComplaintMetrics(c).by_category).toEqual({
        safeguarding: 2,
        medication: 1,
      });
    });

    it("by_stage handles multiple stages", () => {
      const c = [
        makeComplaint({ id: "1", investigation_stage: "received" }),
        makeComplaint({ id: "2", investigation_stage: "received" }),
        makeComplaint({ id: "3", investigation_stage: "resolved" }),
        makeComplaint({ id: "4", investigation_stage: "escalated" }),
      ];
      expect(computeComplaintMetrics(c).by_stage).toEqual({
        received: 2,
        resolved: 1,
        escalated: 1,
      });
    });

    it("by_outcome handles all outcomes present", () => {
      const c = [
        makeComplaint({ id: "1", complaint_outcome: "upheld" }),
        makeComplaint({ id: "2", complaint_outcome: "partially_upheld" }),
        makeComplaint({ id: "3", complaint_outcome: "not_upheld" }),
        makeComplaint({ id: "4", complaint_outcome: "withdrawn" }),
        makeComplaint({ id: "5", complaint_outcome: "pending" }),
        makeComplaint({ id: "6", complaint_outcome: "inconclusive" }),
      ];
      expect(computeComplaintMetrics(c).by_outcome).toEqual({
        upheld: 1,
        partially_upheld: 1,
        not_upheld: 1,
        withdrawn: 1,
        pending: 1,
        inconclusive: 1,
      });
    });
  });

  // ── Rate rounding consistency ──────────────────────────────────────────
  describe("rate rounding consistency", () => {
    it("all rates use Math.round(value * 1000) / 10 formula", () => {
      const c = [
        makeComplaint({
          id: "1",
          acknowledged_within_24h: true,
          investigation_started_within_5_days: true,
          resolved_within_28_days: true,
          learning_identified: true,
          complainant_satisfaction: "satisfied",
        }),
        makeComplaint({
          id: "2",
          acknowledged_within_24h: true,
          investigation_started_within_5_days: true,
          resolved_within_28_days: true,
          learning_identified: true,
          complainant_satisfaction: "satisfied",
        }),
        makeComplaint({
          id: "3",
          acknowledged_within_24h: false,
          investigation_started_within_5_days: false,
          resolved_within_28_days: false,
          learning_identified: false,
          complainant_satisfaction: "dissatisfied",
        }),
      ];
      const m = computeComplaintMetrics(c);
      // 2/3 = 66.7
      expect(m.acknowledged_rate).toBe(66.7);
      expect(m.investigation_started_rate).toBe(66.7);
      expect(m.resolved_within_28_days_rate).toBe(66.7);
      expect(m.learning_identified_rate).toBe(66.7);
      expect(m.satisfaction_rate).toBe(66.7);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. identifyComplaintAlerts
// ═══════════════════════════════════════════════════════════════════════════

describe("identifyComplaintAlerts", () => {
  // ── No alerts ──────────────────────────────────────────────────────
  describe("no alerts scenario", () => {
    it("returns empty array for empty complaints", () => {
      expect(identifyComplaintAlerts([])).toEqual([]);
    });

    it("returns empty array when everything is well-managed", () => {
      const c = [
        makeComplaint({
          id: "c-1",
          complaint_category: "care_quality",
          investigation_stage: "resolved",
          complaint_outcome: "not_upheld",
          acknowledged_within_24h: true,
          learning_identified: true,
          complainant_satisfaction: "satisfied",
        }),
      ];
      expect(identifyComplaintAlerts(c)).toEqual([]);
    });

    it("returns empty for resolved safeguarding complaint", () => {
      const c = [
        makeComplaint({
          id: "c-1",
          complaint_category: "safeguarding",
          investigation_stage: "resolved",
          acknowledged_within_24h: true,
          complainant_satisfaction: "satisfied",
        }),
      ];
      expect(identifyComplaintAlerts(c)).toEqual([]);
    });

    it("returns empty for withdrawn safeguarding complaint", () => {
      const c = [
        makeComplaint({
          id: "c-1",
          complaint_category: "safeguarding",
          investigation_stage: "withdrawn",
          acknowledged_within_24h: true,
          complainant_satisfaction: "satisfied",
        }),
      ];
      expect(identifyComplaintAlerts(c)).toEqual([]);
    });
  });

  // ── safeguarding_complaint alert (critical) ────────────────────────
  describe("safeguarding_complaint alert", () => {
    it("fires for safeguarding category with stage=received", () => {
      const c = [
        makeComplaint({
          id: "c-1",
          complaint_category: "safeguarding",
          investigation_stage: "received",
          acknowledged_within_24h: true,
          complainant_satisfaction: "satisfied",
        }),
      ];
      const alerts = identifyComplaintAlerts(c);
      const sg = alerts.find((a) => a.type === "safeguarding_complaint");
      expect(sg).toBeTruthy();
    });

    it("fires for safeguarding category with stage=acknowledged", () => {
      const c = [
        makeComplaint({
          id: "c-1",
          complaint_category: "safeguarding",
          investigation_stage: "acknowledged",
          acknowledged_within_24h: true,
          complainant_satisfaction: "satisfied",
        }),
      ];
      const alerts = identifyComplaintAlerts(c);
      expect(alerts.find((a) => a.type === "safeguarding_complaint")).toBeTruthy();
    });

    it("fires for safeguarding category with stage=investigating", () => {
      const c = [
        makeComplaint({
          id: "c-1",
          complaint_category: "safeguarding",
          investigation_stage: "investigating",
          acknowledged_within_24h: true,
          complainant_satisfaction: "satisfied",
        }),
      ];
      const alerts = identifyComplaintAlerts(c);
      expect(alerts.find((a) => a.type === "safeguarding_complaint")).toBeTruthy();
    });

    it("fires for safeguarding category with stage=outcome_reached", () => {
      const c = [
        makeComplaint({
          id: "c-1",
          complaint_category: "safeguarding",
          investigation_stage: "outcome_reached",
          acknowledged_within_24h: true,
          complainant_satisfaction: "satisfied",
        }),
      ];
      const alerts = identifyComplaintAlerts(c);
      expect(alerts.find((a) => a.type === "safeguarding_complaint")).toBeTruthy();
    });

    it("fires for safeguarding category with stage=escalated", () => {
      const c = [
        makeComplaint({
          id: "c-1",
          complaint_category: "safeguarding",
          investigation_stage: "escalated",
          acknowledged_within_24h: true,
          complainant_satisfaction: "satisfied",
        }),
      ];
      const alerts = identifyComplaintAlerts(c);
      expect(alerts.find((a) => a.type === "safeguarding_complaint")).toBeTruthy();
    });

    it("has critical severity", () => {
      const c = [
        makeComplaint({
          id: "c-1",
          complaint_category: "safeguarding",
          investigation_stage: "investigating",
          acknowledged_within_24h: true,
          complainant_satisfaction: "satisfied",
        }),
      ];
      const alerts = identifyComplaintAlerts(c);
      const sg = alerts.find((a) => a.type === "safeguarding_complaint")!;
      expect(sg.severity).toBe("critical");
    });

    it("uses the record id as alert id", () => {
      const c = [
        makeComplaint({
          id: "c-42",
          complaint_category: "safeguarding",
          investigation_stage: "investigating",
          acknowledged_within_24h: true,
          complainant_satisfaction: "satisfied",
        }),
      ];
      const alerts = identifyComplaintAlerts(c);
      const sg = alerts.find((a) => a.type === "safeguarding_complaint")!;
      expect(sg.id).toBe("c-42");
    });

    it("message contains complaint_source with underscores replaced by spaces", () => {
      const c = [
        makeComplaint({
          id: "c-1",
          complaint_category: "safeguarding",
          investigation_stage: "investigating",
          complaint_source: "parent_carer",
          acknowledged_within_24h: true,
          complainant_satisfaction: "satisfied",
        }),
      ];
      const alerts = identifyComplaintAlerts(c);
      const sg = alerts.find((a) => a.type === "safeguarding_complaint")!;
      expect(sg.message).toContain("parent carer");
    });

    it("message contains complaint_date", () => {
      const c = [
        makeComplaint({
          id: "c-1",
          complaint_category: "safeguarding",
          investigation_stage: "investigating",
          complaint_date: "2024-07-15",
          acknowledged_within_24h: true,
          complainant_satisfaction: "satisfied",
        }),
      ];
      const alerts = identifyComplaintAlerts(c);
      const sg = alerts.find((a) => a.type === "safeguarding_complaint")!;
      expect(sg.message).toContain("2024-07-15");
    });

    it("does NOT fire for safeguarding with stage=resolved", () => {
      const c = [
        makeComplaint({
          id: "c-1",
          complaint_category: "safeguarding",
          investigation_stage: "resolved",
          acknowledged_within_24h: true,
          complainant_satisfaction: "satisfied",
        }),
      ];
      const alerts = identifyComplaintAlerts(c);
      expect(alerts.find((a) => a.type === "safeguarding_complaint")).toBeUndefined();
    });

    it("does NOT fire for safeguarding with stage=withdrawn", () => {
      const c = [
        makeComplaint({
          id: "c-1",
          complaint_category: "safeguarding",
          investigation_stage: "withdrawn",
          acknowledged_within_24h: true,
          complainant_satisfaction: "satisfied",
        }),
      ];
      const alerts = identifyComplaintAlerts(c);
      expect(alerts.find((a) => a.type === "safeguarding_complaint")).toBeUndefined();
    });

    it("does NOT fire for non-safeguarding category even if open", () => {
      const c = [
        makeComplaint({
          id: "c-1",
          complaint_category: "care_quality",
          investigation_stage: "investigating",
          acknowledged_within_24h: true,
          complainant_satisfaction: "satisfied",
        }),
      ];
      const alerts = identifyComplaintAlerts(c);
      expect(alerts.find((a) => a.type === "safeguarding_complaint")).toBeUndefined();
    });

    it("fires per record for multiple active safeguarding complaints", () => {
      const c = [
        makeComplaint({
          id: "c-1",
          complaint_category: "safeguarding",
          investigation_stage: "received",
          acknowledged_within_24h: true,
          complainant_satisfaction: "satisfied",
        }),
        makeComplaint({
          id: "c-2",
          complaint_category: "safeguarding",
          investigation_stage: "investigating",
          acknowledged_within_24h: true,
          complainant_satisfaction: "satisfied",
        }),
      ];
      const alerts = identifyComplaintAlerts(c);
      const sg = alerts.filter((a) => a.type === "safeguarding_complaint");
      expect(sg).toHaveLength(2);
    });

    it("fires only for qualifying safeguarding records among mixed set", () => {
      const c = [
        makeComplaint({
          id: "c-1",
          complaint_category: "safeguarding",
          investigation_stage: "investigating",
          acknowledged_within_24h: true,
          complainant_satisfaction: "satisfied",
        }),
        makeComplaint({
          id: "c-2",
          complaint_category: "safeguarding",
          investigation_stage: "resolved",
          acknowledged_within_24h: true,
          complainant_satisfaction: "satisfied",
        }),
        makeComplaint({
          id: "c-3",
          complaint_category: "care_quality",
          investigation_stage: "investigating",
          acknowledged_within_24h: true,
          complainant_satisfaction: "satisfied",
        }),
      ];
      const alerts = identifyComplaintAlerts(c);
      const sg = alerts.filter((a) => a.type === "safeguarding_complaint");
      expect(sg).toHaveLength(1);
      expect(sg[0].id).toBe("c-1");
    });
  });

  // ── late_acknowledgement alert (high) ─────────────────────────────
  describe("late_acknowledgement alert", () => {
    it("fires when 1 complaint not acknowledged within 24h (non-withdrawn)", () => {
      const c = [
        makeComplaint({
          id: "c-1",
          acknowledged_within_24h: false,
          investigation_stage: "investigating",
          complainant_satisfaction: "satisfied",
        }),
      ];
      const alerts = identifyComplaintAlerts(c);
      const la = alerts.find((a) => a.type === "late_acknowledgement");
      expect(la).toBeTruthy();
    });

    it("has high severity", () => {
      const c = [
        makeComplaint({
          id: "c-1",
          acknowledged_within_24h: false,
          investigation_stage: "investigating",
          complainant_satisfaction: "satisfied",
        }),
      ];
      const alerts = identifyComplaintAlerts(c);
      const la = alerts.find((a) => a.type === "late_acknowledgement")!;
      expect(la.severity).toBe("high");
    });

    it("has id late_acknowledgement", () => {
      const c = [
        makeComplaint({
          id: "c-1",
          acknowledged_within_24h: false,
          investigation_stage: "investigating",
          complainant_satisfaction: "satisfied",
        }),
      ];
      const alerts = identifyComplaintAlerts(c);
      const la = alerts.find((a) => a.type === "late_acknowledgement")!;
      expect(la.id).toBe("late_acknowledgement");
    });

    it("message uses singular for exactly 1", () => {
      const c = [
        makeComplaint({
          id: "c-1",
          acknowledged_within_24h: false,
          investigation_stage: "resolved",
          complainant_satisfaction: "satisfied",
        }),
      ];
      const alerts = identifyComplaintAlerts(c);
      const la = alerts.find((a) => a.type === "late_acknowledgement")!;
      expect(la.message).toContain("complaint was");
    });

    it("message uses plural for 2", () => {
      const c = [
        makeComplaint({ id: "c-1", acknowledged_within_24h: false, investigation_stage: "resolved", complainant_satisfaction: "satisfied" }),
        makeComplaint({ id: "c-2", acknowledged_within_24h: false, investigation_stage: "investigating", complainant_satisfaction: "satisfied" }),
      ];
      const alerts = identifyComplaintAlerts(c);
      const la = alerts.find((a) => a.type === "late_acknowledgement")!;
      expect(la.message).toContain("complaints were");
    });

    it("message contains count", () => {
      const c = [
        makeComplaint({ id: "c-1", acknowledged_within_24h: false, investigation_stage: "resolved", complainant_satisfaction: "satisfied" }),
        makeComplaint({ id: "c-2", acknowledged_within_24h: false, investigation_stage: "investigating", complainant_satisfaction: "satisfied" }),
        makeComplaint({ id: "c-3", acknowledged_within_24h: false, investigation_stage: "received", complainant_satisfaction: "satisfied" }),
      ];
      const alerts = identifyComplaintAlerts(c);
      const la = alerts.find((a) => a.type === "late_acknowledgement")!;
      expect(la.message).toContain("3");
    });

    it("excludes withdrawn from count", () => {
      const c = [
        makeComplaint({ id: "c-1", acknowledged_within_24h: false, investigation_stage: "withdrawn", complainant_satisfaction: "satisfied" }),
      ];
      const alerts = identifyComplaintAlerts(c);
      expect(alerts.find((a) => a.type === "late_acknowledgement")).toBeUndefined();
    });

    it("does NOT fire when all acknowledged within 24h", () => {
      const c = [
        makeComplaint({ id: "c-1", acknowledged_within_24h: true, investigation_stage: "investigating", complainant_satisfaction: "satisfied" }),
        makeComplaint({ id: "c-2", acknowledged_within_24h: true, investigation_stage: "resolved", complainant_satisfaction: "satisfied" }),
      ];
      const alerts = identifyComplaintAlerts(c);
      expect(alerts.find((a) => a.type === "late_acknowledgement")).toBeUndefined();
    });

    it("counts correctly in mixed set", () => {
      const c = [
        makeComplaint({ id: "c-1", acknowledged_within_24h: false, investigation_stage: "investigating", complainant_satisfaction: "satisfied" }),
        makeComplaint({ id: "c-2", acknowledged_within_24h: true, investigation_stage: "investigating", complainant_satisfaction: "satisfied" }),
        makeComplaint({ id: "c-3", acknowledged_within_24h: false, investigation_stage: "withdrawn", complainant_satisfaction: "satisfied" }),
        makeComplaint({ id: "c-4", acknowledged_within_24h: false, investigation_stage: "resolved", complainant_satisfaction: "satisfied" }),
      ];
      const alerts = identifyComplaintAlerts(c);
      const la = alerts.find((a) => a.type === "late_acknowledgement")!;
      // c-1 and c-4 count (c-3 excluded because withdrawn)
      expect(la.message).toContain("2");
      expect(la.message).toContain("complaints were");
    });
  });

  // ── escalated alert (high) ────────────────────────────────────────
  describe("escalated alert", () => {
    it("fires when 1 complaint is escalated", () => {
      const c = [
        makeComplaint({
          id: "c-1",
          investigation_stage: "escalated",
          acknowledged_within_24h: true,
          complainant_satisfaction: "satisfied",
        }),
      ];
      const alerts = identifyComplaintAlerts(c);
      const esc = alerts.find((a) => a.type === "escalated");
      expect(esc).toBeTruthy();
    });

    it("has high severity", () => {
      const c = [
        makeComplaint({
          id: "c-1",
          investigation_stage: "escalated",
          acknowledged_within_24h: true,
          complainant_satisfaction: "satisfied",
        }),
      ];
      const alerts = identifyComplaintAlerts(c);
      const esc = alerts.find((a) => a.type === "escalated")!;
      expect(esc.severity).toBe("high");
    });

    it("has id escalated", () => {
      const c = [
        makeComplaint({
          id: "c-1",
          investigation_stage: "escalated",
          acknowledged_within_24h: true,
          complainant_satisfaction: "satisfied",
        }),
      ];
      const alerts = identifyComplaintAlerts(c);
      const esc = alerts.find((a) => a.type === "escalated")!;
      expect(esc.id).toBe("escalated");
    });

    it("message uses singular for exactly 1", () => {
      const c = [
        makeComplaint({
          id: "c-1",
          investigation_stage: "escalated",
          acknowledged_within_24h: true,
          complainant_satisfaction: "satisfied",
        }),
      ];
      const alerts = identifyComplaintAlerts(c);
      const esc = alerts.find((a) => a.type === "escalated")!;
      expect(esc.message).toContain("complaint has");
    });

    it("message uses plural for 2", () => {
      const c = [
        makeComplaint({ id: "c-1", investigation_stage: "escalated", acknowledged_within_24h: true, complainant_satisfaction: "satisfied" }),
        makeComplaint({ id: "c-2", investigation_stage: "escalated", acknowledged_within_24h: true, complainant_satisfaction: "satisfied" }),
      ];
      const alerts = identifyComplaintAlerts(c);
      const esc = alerts.find((a) => a.type === "escalated")!;
      expect(esc.message).toContain("complaints have");
    });

    it("message contains count", () => {
      const c = [
        makeComplaint({ id: "c-1", investigation_stage: "escalated", acknowledged_within_24h: true, complainant_satisfaction: "satisfied" }),
        makeComplaint({ id: "c-2", investigation_stage: "escalated", acknowledged_within_24h: true, complainant_satisfaction: "satisfied" }),
        makeComplaint({ id: "c-3", investigation_stage: "escalated", acknowledged_within_24h: true, complainant_satisfaction: "satisfied" }),
      ];
      const alerts = identifyComplaintAlerts(c);
      const esc = alerts.find((a) => a.type === "escalated")!;
      expect(esc.message).toContain("3");
    });

    it("does NOT fire when no complaints escalated", () => {
      const c = [
        makeComplaint({ id: "c-1", investigation_stage: "resolved", acknowledged_within_24h: true, complainant_satisfaction: "satisfied" }),
        makeComplaint({ id: "c-2", investigation_stage: "investigating", acknowledged_within_24h: true, complainant_satisfaction: "satisfied" }),
      ];
      const alerts = identifyComplaintAlerts(c);
      expect(alerts.find((a) => a.type === "escalated")).toBeUndefined();
    });

    it("counts only escalated stage", () => {
      const c = [
        makeComplaint({ id: "c-1", investigation_stage: "escalated", acknowledged_within_24h: true, complainant_satisfaction: "satisfied" }),
        makeComplaint({ id: "c-2", investigation_stage: "resolved", acknowledged_within_24h: true, complainant_satisfaction: "satisfied" }),
        makeComplaint({ id: "c-3", investigation_stage: "investigating", acknowledged_within_24h: true, complainant_satisfaction: "satisfied" }),
      ];
      const alerts = identifyComplaintAlerts(c);
      const esc = alerts.find((a) => a.type === "escalated")!;
      expect(esc.message).toContain("1");
      expect(esc.message).toContain("complaint has");
    });
  });

  // ── no_learning alert (medium) ────────────────────────────────────
  describe("no_learning alert", () => {
    it("fires when upheld complaint has no learning identified", () => {
      const c = [
        makeComplaint({
          id: "c-1",
          complaint_outcome: "upheld",
          learning_identified: false,
          acknowledged_within_24h: true,
          complainant_satisfaction: "satisfied",
        }),
      ];
      const alerts = identifyComplaintAlerts(c);
      const nl = alerts.find((a) => a.type === "no_learning");
      expect(nl).toBeTruthy();
    });

    it("fires when partially_upheld complaint has no learning identified", () => {
      const c = [
        makeComplaint({
          id: "c-1",
          complaint_outcome: "partially_upheld",
          learning_identified: false,
          acknowledged_within_24h: true,
          complainant_satisfaction: "satisfied",
        }),
      ];
      const alerts = identifyComplaintAlerts(c);
      expect(alerts.find((a) => a.type === "no_learning")).toBeTruthy();
    });

    it("has medium severity", () => {
      const c = [
        makeComplaint({
          id: "c-1",
          complaint_outcome: "upheld",
          learning_identified: false,
          acknowledged_within_24h: true,
          complainant_satisfaction: "satisfied",
        }),
      ];
      const alerts = identifyComplaintAlerts(c);
      const nl = alerts.find((a) => a.type === "no_learning")!;
      expect(nl.severity).toBe("medium");
    });

    it("has id no_learning", () => {
      const c = [
        makeComplaint({
          id: "c-1",
          complaint_outcome: "upheld",
          learning_identified: false,
          acknowledged_within_24h: true,
          complainant_satisfaction: "satisfied",
        }),
      ];
      const alerts = identifyComplaintAlerts(c);
      const nl = alerts.find((a) => a.type === "no_learning")!;
      expect(nl.id).toBe("no_learning");
    });

    it("message uses singular for exactly 1", () => {
      const c = [
        makeComplaint({
          id: "c-1",
          complaint_outcome: "upheld",
          learning_identified: false,
          acknowledged_within_24h: true,
          complainant_satisfaction: "satisfied",
        }),
      ];
      const alerts = identifyComplaintAlerts(c);
      const nl = alerts.find((a) => a.type === "no_learning")!;
      expect(nl.message).toContain("complaint has");
    });

    it("message uses plural for 2", () => {
      const c = [
        makeComplaint({ id: "c-1", complaint_outcome: "upheld", learning_identified: false, acknowledged_within_24h: true, complainant_satisfaction: "satisfied" }),
        makeComplaint({ id: "c-2", complaint_outcome: "partially_upheld", learning_identified: false, acknowledged_within_24h: true, complainant_satisfaction: "satisfied" }),
      ];
      const alerts = identifyComplaintAlerts(c);
      const nl = alerts.find((a) => a.type === "no_learning")!;
      expect(nl.message).toContain("complaints have");
    });

    it("message contains count", () => {
      const c = [
        makeComplaint({ id: "c-1", complaint_outcome: "upheld", learning_identified: false, acknowledged_within_24h: true, complainant_satisfaction: "satisfied" }),
        makeComplaint({ id: "c-2", complaint_outcome: "upheld", learning_identified: false, acknowledged_within_24h: true, complainant_satisfaction: "satisfied" }),
        makeComplaint({ id: "c-3", complaint_outcome: "partially_upheld", learning_identified: false, acknowledged_within_24h: true, complainant_satisfaction: "satisfied" }),
      ];
      const alerts = identifyComplaintAlerts(c);
      const nl = alerts.find((a) => a.type === "no_learning")!;
      expect(nl.message).toContain("3");
    });

    it("does NOT fire when upheld has learning identified", () => {
      const c = [
        makeComplaint({
          id: "c-1",
          complaint_outcome: "upheld",
          learning_identified: true,
          acknowledged_within_24h: true,
          complainant_satisfaction: "satisfied",
        }),
      ];
      const alerts = identifyComplaintAlerts(c);
      expect(alerts.find((a) => a.type === "no_learning")).toBeUndefined();
    });

    it("does NOT fire when partially_upheld has learning identified", () => {
      const c = [
        makeComplaint({
          id: "c-1",
          complaint_outcome: "partially_upheld",
          learning_identified: true,
          acknowledged_within_24h: true,
          complainant_satisfaction: "satisfied",
        }),
      ];
      const alerts = identifyComplaintAlerts(c);
      expect(alerts.find((a) => a.type === "no_learning")).toBeUndefined();
    });

    it("does NOT fire for not_upheld without learning", () => {
      const c = [
        makeComplaint({
          id: "c-1",
          complaint_outcome: "not_upheld",
          learning_identified: false,
          acknowledged_within_24h: true,
          complainant_satisfaction: "satisfied",
        }),
      ];
      const alerts = identifyComplaintAlerts(c);
      expect(alerts.find((a) => a.type === "no_learning")).toBeUndefined();
    });

    it("does NOT fire for pending without learning", () => {
      const c = [
        makeComplaint({
          id: "c-1",
          complaint_outcome: "pending",
          learning_identified: false,
          acknowledged_within_24h: true,
          complainant_satisfaction: "satisfied",
        }),
      ];
      const alerts = identifyComplaintAlerts(c);
      expect(alerts.find((a) => a.type === "no_learning")).toBeUndefined();
    });

    it("does NOT fire for withdrawn without learning", () => {
      const c = [
        makeComplaint({
          id: "c-1",
          complaint_outcome: "withdrawn",
          learning_identified: false,
          acknowledged_within_24h: true,
          complainant_satisfaction: "satisfied",
        }),
      ];
      const alerts = identifyComplaintAlerts(c);
      expect(alerts.find((a) => a.type === "no_learning")).toBeUndefined();
    });

    it("does NOT fire for inconclusive without learning", () => {
      const c = [
        makeComplaint({
          id: "c-1",
          complaint_outcome: "inconclusive",
          learning_identified: false,
          acknowledged_within_24h: true,
          complainant_satisfaction: "satisfied",
        }),
      ];
      const alerts = identifyComplaintAlerts(c);
      expect(alerts.find((a) => a.type === "no_learning")).toBeUndefined();
    });

    it("counts only qualifying records in mixed set", () => {
      const c = [
        makeComplaint({ id: "c-1", complaint_outcome: "upheld", learning_identified: false, acknowledged_within_24h: true, complainant_satisfaction: "satisfied" }),
        makeComplaint({ id: "c-2", complaint_outcome: "upheld", learning_identified: true, acknowledged_within_24h: true, complainant_satisfaction: "satisfied" }),
        makeComplaint({ id: "c-3", complaint_outcome: "not_upheld", learning_identified: false, acknowledged_within_24h: true, complainant_satisfaction: "satisfied" }),
        makeComplaint({ id: "c-4", complaint_outcome: "partially_upheld", learning_identified: false, acknowledged_within_24h: true, complainant_satisfaction: "satisfied" }),
      ];
      const alerts = identifyComplaintAlerts(c);
      const nl = alerts.find((a) => a.type === "no_learning")!;
      // c-1 (upheld no learning) + c-4 (partially_upheld no learning) = 2
      expect(nl.message).toContain("2");
    });
  });

  // ── dissatisfied alert (medium) ───────────────────────────────────
  describe("dissatisfied alert", () => {
    it("fires when 1 complainant is dissatisfied", () => {
      const c = [
        makeComplaint({
          id: "c-1",
          complainant_satisfaction: "dissatisfied",
          acknowledged_within_24h: true,
        }),
      ];
      const alerts = identifyComplaintAlerts(c);
      const dis = alerts.find((a) => a.type === "dissatisfied");
      expect(dis).toBeTruthy();
    });

    it("has medium severity", () => {
      const c = [
        makeComplaint({
          id: "c-1",
          complainant_satisfaction: "dissatisfied",
          acknowledged_within_24h: true,
        }),
      ];
      const alerts = identifyComplaintAlerts(c);
      const dis = alerts.find((a) => a.type === "dissatisfied")!;
      expect(dis.severity).toBe("medium");
    });

    it("has id dissatisfied", () => {
      const c = [
        makeComplaint({
          id: "c-1",
          complainant_satisfaction: "dissatisfied",
          acknowledged_within_24h: true,
        }),
      ];
      const alerts = identifyComplaintAlerts(c);
      const dis = alerts.find((a) => a.type === "dissatisfied")!;
      expect(dis.id).toBe("dissatisfied");
    });

    it("message uses singular for exactly 1", () => {
      const c = [
        makeComplaint({
          id: "c-1",
          complainant_satisfaction: "dissatisfied",
          acknowledged_within_24h: true,
        }),
      ];
      const alerts = identifyComplaintAlerts(c);
      const dis = alerts.find((a) => a.type === "dissatisfied")!;
      expect(dis.message).toContain("complainant is");
    });

    it("message uses plural for 2", () => {
      const c = [
        makeComplaint({ id: "c-1", complainant_satisfaction: "dissatisfied", acknowledged_within_24h: true }),
        makeComplaint({ id: "c-2", complainant_satisfaction: "dissatisfied", acknowledged_within_24h: true }),
      ];
      const alerts = identifyComplaintAlerts(c);
      const dis = alerts.find((a) => a.type === "dissatisfied")!;
      expect(dis.message).toContain("complainants are");
    });

    it("message contains count", () => {
      const c = [
        makeComplaint({ id: "c-1", complainant_satisfaction: "dissatisfied", acknowledged_within_24h: true }),
        makeComplaint({ id: "c-2", complainant_satisfaction: "dissatisfied", acknowledged_within_24h: true }),
        makeComplaint({ id: "c-3", complainant_satisfaction: "dissatisfied", acknowledged_within_24h: true }),
      ];
      const alerts = identifyComplaintAlerts(c);
      const dis = alerts.find((a) => a.type === "dissatisfied")!;
      expect(dis.message).toContain("3");
    });

    it("does NOT fire when no dissatisfied complainants", () => {
      const c = [
        makeComplaint({ id: "c-1", complainant_satisfaction: "satisfied", acknowledged_within_24h: true }),
        makeComplaint({ id: "c-2", complainant_satisfaction: "partially_satisfied", acknowledged_within_24h: true }),
      ];
      const alerts = identifyComplaintAlerts(c);
      expect(alerts.find((a) => a.type === "dissatisfied")).toBeUndefined();
    });

    it("does NOT fire for partially_satisfied", () => {
      const c = [
        makeComplaint({ id: "c-1", complainant_satisfaction: "partially_satisfied", acknowledged_within_24h: true }),
      ];
      const alerts = identifyComplaintAlerts(c);
      expect(alerts.find((a) => a.type === "dissatisfied")).toBeUndefined();
    });

    it("does NOT fire for not_recorded", () => {
      const c = [
        makeComplaint({ id: "c-1", complainant_satisfaction: "not_recorded", acknowledged_within_24h: true }),
      ];
      const alerts = identifyComplaintAlerts(c);
      expect(alerts.find((a) => a.type === "dissatisfied")).toBeUndefined();
    });

    it("does NOT fire for null satisfaction", () => {
      const c = [
        makeComplaint({ id: "c-1", complainant_satisfaction: null, acknowledged_within_24h: true }),
      ];
      const alerts = identifyComplaintAlerts(c);
      expect(alerts.find((a) => a.type === "dissatisfied")).toBeUndefined();
    });

    it("counts only dissatisfied in mixed satisfaction set", () => {
      const c = [
        makeComplaint({ id: "c-1", complainant_satisfaction: "dissatisfied", acknowledged_within_24h: true }),
        makeComplaint({ id: "c-2", complainant_satisfaction: "satisfied", acknowledged_within_24h: true }),
        makeComplaint({ id: "c-3", complainant_satisfaction: "partially_satisfied", acknowledged_within_24h: true }),
        makeComplaint({ id: "c-4", complainant_satisfaction: "dissatisfied", acknowledged_within_24h: true }),
        makeComplaint({ id: "c-5", complainant_satisfaction: null, acknowledged_within_24h: true }),
        makeComplaint({ id: "c-6", complainant_satisfaction: "not_recorded", acknowledged_within_24h: true }),
      ];
      const alerts = identifyComplaintAlerts(c);
      const dis = alerts.find((a) => a.type === "dissatisfied")!;
      expect(dis.message).toContain("2");
      expect(dis.message).toContain("complainants are");
    });
  });

  // ── Combined alert scenarios ───────────────────────────────────────
  describe("combined alert scenarios", () => {
    it("can fire all five alert types simultaneously", () => {
      const c = [
        // safeguarding_complaint: safeguarding + open
        makeComplaint({
          id: "c-1",
          complaint_category: "safeguarding",
          investigation_stage: "investigating",
          acknowledged_within_24h: false,
          complaint_outcome: "upheld",
          learning_identified: false,
          complainant_satisfaction: "dissatisfied",
        }),
        // escalated
        makeComplaint({
          id: "c-2",
          complaint_category: "care_quality",
          investigation_stage: "escalated",
          acknowledged_within_24h: true,
          complaint_outcome: "partially_upheld",
          learning_identified: false,
          complainant_satisfaction: "satisfied",
        }),
      ];
      const alerts = identifyComplaintAlerts(c);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("safeguarding_complaint");
      expect(types).toContain("late_acknowledgement");
      expect(types).toContain("escalated");
      expect(types).toContain("no_learning");
      expect(types).toContain("dissatisfied");
    });

    it("returns no alerts for a clean set of complaints", () => {
      const c = [
        makeComplaint({
          id: "c-1",
          complaint_category: "care_quality",
          investigation_stage: "resolved",
          acknowledged_within_24h: true,
          complaint_outcome: "upheld",
          learning_identified: true,
          complainant_satisfaction: "satisfied",
        }),
        makeComplaint({
          id: "c-2",
          complaint_category: "food_nutrition",
          investigation_stage: "resolved",
          acknowledged_within_24h: true,
          complaint_outcome: "not_upheld",
          learning_identified: true,
          complainant_satisfaction: "satisfied",
        }),
      ];
      const alerts = identifyComplaintAlerts(c);
      expect(alerts).toEqual([]);
    });

    it("alert order: safeguarding_complaint before late_acknowledgement before escalated before no_learning before dissatisfied", () => {
      const c = [
        makeComplaint({
          id: "c-1",
          complaint_category: "safeguarding",
          investigation_stage: "escalated",
          acknowledged_within_24h: false,
          complaint_outcome: "upheld",
          learning_identified: false,
          complainant_satisfaction: "dissatisfied",
        }),
      ];
      const alerts = identifyComplaintAlerts(c);
      const types = alerts.map((a) => a.type);

      const sgIdx = types.indexOf("safeguarding_complaint");
      const laIdx = types.indexOf("late_acknowledgement");
      const escIdx = types.indexOf("escalated");
      const nlIdx = types.indexOf("no_learning");
      const disIdx = types.indexOf("dissatisfied");

      expect(sgIdx).toBeLessThan(laIdx);
      expect(laIdx).toBeLessThan(escIdx);
      expect(escIdx).toBeLessThan(nlIdx);
      expect(nlIdx).toBeLessThan(disIdx);
    });

    it("generates multiple safeguarding alerts for different records", () => {
      const c = [
        makeComplaint({
          id: "c-1",
          complaint_category: "safeguarding",
          complaint_source: "child",
          investigation_stage: "received",
          acknowledged_within_24h: true,
          complainant_satisfaction: "satisfied",
        }),
        makeComplaint({
          id: "c-2",
          complaint_category: "safeguarding",
          complaint_source: "social_worker",
          investigation_stage: "investigating",
          acknowledged_within_24h: true,
          complainant_satisfaction: "satisfied",
        }),
      ];
      const alerts = identifyComplaintAlerts(c);
      const sg = alerts.filter((a) => a.type === "safeguarding_complaint");
      expect(sg).toHaveLength(2);
      expect(sg[0].message).toContain("child");
      expect(sg[1].message).toContain("social worker");
    });
  });
});
