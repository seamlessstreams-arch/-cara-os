// ══════════════════════════════════════════════════════════════════════════════
// CARA — ALLEGATION MANAGEMENT SERVICE TESTS
// Pure-function unit tests for allegation metrics computation, alert
// identification, and constant validation.
// CHR 2015 Reg 12 (protection — abuse by staff),
// Reg 33 (employment — fitness of workers),
// Working Together to Safeguard Children 2023 (LADO procedures).
//
// Covers: allegation receipt, LADO referral, investigation,
// disciplinary link, DBS referral, and outcome tracking.
//
// SCCIF: Helped & Protected — "Allegations are managed swiftly
// and in line with safeguarding procedures."
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi } from "vitest";
import crypto from "crypto";

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => false,
  createServerClient: () => null,
}));

import {
  _testing,
  ALLEGATION_TYPES,
  ALLEGATION_SOURCES,
  INVESTIGATION_STAGES,
  ALLEGATION_OUTCOMES,
} from "../allegation-management-service";

import type { AllegationRecord } from "../allegation-management-service";

const { computeAllegationMetrics, identifyAllegationAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Build a minimal AllegationRecord with sensible defaults. */
function makeRecord(
  overrides: Partial<AllegationRecord> = {},
): AllegationRecord {
  return {
    id: crypto.randomUUID(),
    home_id: "home-1",
    allegation_date: "2024-06-01",
    allegation_type: "physical_abuse",
    allegation_source: "parent_carer",
    investigation_stage: "closed",
    allegation_outcome: "unsubstantiated",
    subject_name: "John Smith",
    subject_role: "Support Worker",
    child_involved:
      "child_involved" in (overrides ?? {})
        ? (overrides!.child_involved ?? null)
        : null,
    lado_referral_made: true,
    lado_referral_date:
      "lado_referral_date" in (overrides ?? {})
        ? (overrides!.lado_referral_date ?? null)
        : null,
    lado_response_within_1_day:
      "lado_response_within_1_day" in (overrides ?? {})
        ? (overrides!.lado_response_within_1_day ?? null)
        : null,
    police_informed: false,
    ofsted_notified: true,
    dbs_referral_made: false,
    subject_suspended: false,
    risk_assessment_completed: true,
    child_safe_and_supported: true,
    support_for_subject: false,
    investigation_officer: "Officer Adams",
    days_to_resolution:
      "days_to_resolution" in (overrides ?? {})
        ? (overrides!.days_to_resolution ?? null)
        : 14,
    learning_identified: false,
    learning_details:
      "learning_details" in (overrides ?? {})
        ? (overrides!.learning_details ?? null)
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

describe("ALLEGATION_TYPES", () => {
  it("has exactly 9 entries", () => {
    expect(ALLEGATION_TYPES).toHaveLength(9);
  });

  it("contains unique type values", () => {
    const values = ALLEGATION_TYPES.map((t) => t.type);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = ALLEGATION_TYPES.map((t) => t.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("each entry has a non-empty label", () => {
    for (const t of ALLEGATION_TYPES) {
      expect(t.label.length).toBeGreaterThan(0);
    }
  });

  it("includes physical_abuse", () => {
    expect(ALLEGATION_TYPES.find((t) => t.type === "physical_abuse")).toBeTruthy();
  });

  it("includes emotional_abuse", () => {
    expect(ALLEGATION_TYPES.find((t) => t.type === "emotional_abuse")).toBeTruthy();
  });

  it("includes sexual_abuse", () => {
    expect(ALLEGATION_TYPES.find((t) => t.type === "sexual_abuse")).toBeTruthy();
  });

  it("includes neglect", () => {
    expect(ALLEGATION_TYPES.find((t) => t.type === "neglect")).toBeTruthy();
  });

  it("includes inappropriate_behaviour", () => {
    expect(ALLEGATION_TYPES.find((t) => t.type === "inappropriate_behaviour")).toBeTruthy();
  });

  it("includes inappropriate_relationship", () => {
    expect(ALLEGATION_TYPES.find((t) => t.type === "inappropriate_relationship")).toBeTruthy();
  });

  it("includes failure_to_safeguard", () => {
    expect(ALLEGATION_TYPES.find((t) => t.type === "failure_to_safeguard")).toBeTruthy();
  });

  it("includes misuse_of_authority", () => {
    expect(ALLEGATION_TYPES.find((t) => t.type === "misuse_of_authority")).toBeTruthy();
  });

  it("includes other", () => {
    expect(ALLEGATION_TYPES.find((t) => t.type === "other")).toBeTruthy();
  });
});

describe("ALLEGATION_SOURCES", () => {
  it("has exactly 8 entries", () => {
    expect(ALLEGATION_SOURCES).toHaveLength(8);
  });

  it("contains unique source values", () => {
    const values = ALLEGATION_SOURCES.map((s) => s.source);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = ALLEGATION_SOURCES.map((s) => s.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("each entry has a non-empty label", () => {
    for (const s of ALLEGATION_SOURCES) {
      expect(s.label.length).toBeGreaterThan(0);
    }
  });

  it("includes child", () => {
    expect(ALLEGATION_SOURCES.find((s) => s.source === "child")).toBeTruthy();
  });

  it("includes parent_carer", () => {
    expect(ALLEGATION_SOURCES.find((s) => s.source === "parent_carer")).toBeTruthy();
  });

  it("includes staff_member", () => {
    expect(ALLEGATION_SOURCES.find((s) => s.source === "staff_member")).toBeTruthy();
  });

  it("includes social_worker", () => {
    expect(ALLEGATION_SOURCES.find((s) => s.source === "social_worker")).toBeTruthy();
  });

  it("includes anonymous", () => {
    expect(ALLEGATION_SOURCES.find((s) => s.source === "anonymous")).toBeTruthy();
  });

  it("includes police", () => {
    expect(ALLEGATION_SOURCES.find((s) => s.source === "police")).toBeTruthy();
  });

  it("includes external_professional", () => {
    expect(ALLEGATION_SOURCES.find((s) => s.source === "external_professional")).toBeTruthy();
  });

  it("includes other", () => {
    expect(ALLEGATION_SOURCES.find((s) => s.source === "other")).toBeTruthy();
  });
});

describe("INVESTIGATION_STAGES", () => {
  it("has exactly 8 entries", () => {
    expect(INVESTIGATION_STAGES).toHaveLength(8);
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

  it("includes lado_referral_made", () => {
    expect(INVESTIGATION_STAGES.find((s) => s.stage === "lado_referral_made")).toBeTruthy();
  });

  it("includes lado_strategy_meeting", () => {
    expect(INVESTIGATION_STAGES.find((s) => s.stage === "lado_strategy_meeting")).toBeTruthy();
  });

  it("includes investigation_ongoing", () => {
    expect(INVESTIGATION_STAGES.find((s) => s.stage === "investigation_ongoing")).toBeTruthy();
  });

  it("includes disciplinary_hearing", () => {
    expect(INVESTIGATION_STAGES.find((s) => s.stage === "disciplinary_hearing")).toBeTruthy();
  });

  it("includes outcome_reached", () => {
    expect(INVESTIGATION_STAGES.find((s) => s.stage === "outcome_reached")).toBeTruthy();
  });

  it("includes closed", () => {
    expect(INVESTIGATION_STAGES.find((s) => s.stage === "closed")).toBeTruthy();
  });

  it("includes withdrawn", () => {
    expect(INVESTIGATION_STAGES.find((s) => s.stage === "withdrawn")).toBeTruthy();
  });
});

describe("ALLEGATION_OUTCOMES", () => {
  it("has exactly 6 entries", () => {
    expect(ALLEGATION_OUTCOMES).toHaveLength(6);
  });

  it("contains unique outcome values", () => {
    const values = ALLEGATION_OUTCOMES.map((o) => o.outcome);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = ALLEGATION_OUTCOMES.map((o) => o.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("each entry has a non-empty label", () => {
    for (const o of ALLEGATION_OUTCOMES) {
      expect(o.label.length).toBeGreaterThan(0);
    }
  });

  it("includes substantiated", () => {
    expect(ALLEGATION_OUTCOMES.find((o) => o.outcome === "substantiated")).toBeTruthy();
  });

  it("includes unsubstantiated", () => {
    expect(ALLEGATION_OUTCOMES.find((o) => o.outcome === "unsubstantiated")).toBeTruthy();
  });

  it("includes unfounded", () => {
    expect(ALLEGATION_OUTCOMES.find((o) => o.outcome === "unfounded")).toBeTruthy();
  });

  it("includes malicious", () => {
    expect(ALLEGATION_OUTCOMES.find((o) => o.outcome === "malicious")).toBeTruthy();
  });

  it("includes false", () => {
    expect(ALLEGATION_OUTCOMES.find((o) => o.outcome === "false")).toBeTruthy();
  });

  it("includes pending", () => {
    expect(ALLEGATION_OUTCOMES.find((o) => o.outcome === "pending")).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. computeAllegationMetrics
// ═══════════════════════════════════════════════════════════════════════════

describe("computeAllegationMetrics", () => {
  // ── Empty array ──────────────────────────────────────────────────────
  describe("empty records", () => {
    it("returns zero total_allegations", () => {
      expect(computeAllegationMetrics([]).total_allegations).toBe(0);
    });

    it("returns zero open_allegations", () => {
      expect(computeAllegationMetrics([]).open_allegations).toBe(0);
    });

    it("returns zero substantiated_count", () => {
      expect(computeAllegationMetrics([]).substantiated_count).toBe(0);
    });

    it("returns zero unsubstantiated_count", () => {
      expect(computeAllegationMetrics([]).unsubstantiated_count).toBe(0);
    });

    it("returns zero lado_referral_rate", () => {
      expect(computeAllegationMetrics([]).lado_referral_rate).toBeNull();;
    });

    it("returns zero lado_response_within_1_day_rate", () => {
      expect(computeAllegationMetrics([]).lado_response_within_1_day_rate).toBeNull();;
    });

    it("returns zero police_informed_rate", () => {
      expect(computeAllegationMetrics([]).police_informed_rate).toBeNull();;
    });

    it("returns zero ofsted_notified_rate", () => {
      expect(computeAllegationMetrics([]).ofsted_notified_rate).toBeNull();;
    });

    it("returns zero dbs_referral_count", () => {
      expect(computeAllegationMetrics([]).dbs_referral_count).toBe(0);
    });

    it("returns zero suspension_count", () => {
      expect(computeAllegationMetrics([]).suspension_count).toBe(0);
    });

    it("returns zero risk_assessment_rate", () => {
      expect(computeAllegationMetrics([]).risk_assessment_rate).toBeNull();;
    });

    it("returns zero child_safe_rate", () => {
      expect(computeAllegationMetrics([]).child_safe_rate).toBeNull();;
    });

    it("returns zero subject_support_rate", () => {
      expect(computeAllegationMetrics([]).subject_support_rate).toBeNull();;
    });

    it("returns zero learning_identified_rate", () => {
      expect(computeAllegationMetrics([]).learning_identified_rate).toBeNull();;
    });

    it("returns zero average_days_to_resolution", () => {
      expect(computeAllegationMetrics([]).average_days_to_resolution).toBeNull();;
    });

    it("returns empty by_allegation_type", () => {
      expect(computeAllegationMetrics([]).by_allegation_type).toEqual({});
    });

    it("returns empty by_allegation_source", () => {
      expect(computeAllegationMetrics([]).by_allegation_source).toEqual({});
    });

    it("returns empty by_investigation_stage", () => {
      expect(computeAllegationMetrics([]).by_investigation_stage).toEqual({});
    });

    it("returns empty by_allegation_outcome", () => {
      expect(computeAllegationMetrics([]).by_allegation_outcome).toEqual({});
    });
  });

  // ── Single record ──────────────────────────────────────────────────
  describe("single record", () => {
    const single = [makeRecord()];

    it("total_allegations is 1", () => {
      expect(computeAllegationMetrics(single).total_allegations).toBe(1);
    });

    it("open_allegations is 0 for closed record", () => {
      expect(computeAllegationMetrics(single).open_allegations).toBe(0);
    });

    it("open_allegations is 1 for received record", () => {
      const r = [makeRecord({ investigation_stage: "received" })];
      expect(computeAllegationMetrics(r).open_allegations).toBe(1);
    });

    it("substantiated_count is 0 for unsubstantiated record", () => {
      expect(computeAllegationMetrics(single).substantiated_count).toBe(0);
    });

    it("substantiated_count is 1 when outcome is substantiated", () => {
      const r = [makeRecord({ allegation_outcome: "substantiated" })];
      expect(computeAllegationMetrics(r).substantiated_count).toBe(1);
    });

    it("unsubstantiated_count is 1 for default record", () => {
      expect(computeAllegationMetrics(single).unsubstantiated_count).toBe(1);
    });

    it("lado_referral_rate is 100 when lado_referral_made is true", () => {
      expect(computeAllegationMetrics(single).lado_referral_rate).toBe(100);
    });

    it("lado_referral_rate is 0 when lado_referral_made is false", () => {
      const r = [makeRecord({ lado_referral_made: false })];
      expect(computeAllegationMetrics(r).lado_referral_rate).toBe(0);
    });

    it("lado_response_within_1_day_rate is 0 when lado_response_within_1_day is null", () => {
      expect(computeAllegationMetrics(single).lado_response_within_1_day_rate).toBeNull();;
    });

    it("lado_response_within_1_day_rate is 100 when true", () => {
      const r = [makeRecord({ lado_response_within_1_day: true })];
      expect(computeAllegationMetrics(r).lado_response_within_1_day_rate).toBe(100);
    });

    it("police_informed_rate is 0 when police_informed is false", () => {
      expect(computeAllegationMetrics(single).police_informed_rate).toBe(0);
    });

    it("police_informed_rate is 100 when police_informed is true", () => {
      const r = [makeRecord({ police_informed: true })];
      expect(computeAllegationMetrics(r).police_informed_rate).toBe(100);
    });

    it("ofsted_notified_rate is 100 when ofsted_notified is true", () => {
      expect(computeAllegationMetrics(single).ofsted_notified_rate).toBe(100);
    });

    it("dbs_referral_count is 0 when dbs_referral_made is false", () => {
      expect(computeAllegationMetrics(single).dbs_referral_count).toBe(0);
    });

    it("dbs_referral_count is 1 when dbs_referral_made is true", () => {
      const r = [makeRecord({ dbs_referral_made: true })];
      expect(computeAllegationMetrics(r).dbs_referral_count).toBe(1);
    });

    it("suspension_count is 0 when subject_suspended is false", () => {
      expect(computeAllegationMetrics(single).suspension_count).toBe(0);
    });

    it("suspension_count is 1 when subject_suspended is true", () => {
      const r = [makeRecord({ subject_suspended: true })];
      expect(computeAllegationMetrics(r).suspension_count).toBe(1);
    });

    it("risk_assessment_rate is 100 when risk_assessment_completed is true", () => {
      expect(computeAllegationMetrics(single).risk_assessment_rate).toBe(100);
    });

    it("child_safe_rate is 100 when child_safe_and_supported is true", () => {
      expect(computeAllegationMetrics(single).child_safe_rate).toBe(100);
    });

    it("subject_support_rate is 0 when support_for_subject is false", () => {
      expect(computeAllegationMetrics(single).subject_support_rate).toBe(0);
    });

    it("subject_support_rate is 100 when support_for_subject is true", () => {
      const r = [makeRecord({ support_for_subject: true })];
      expect(computeAllegationMetrics(r).subject_support_rate).toBe(100);
    });

    it("learning_identified_rate is 0 when learning_identified is false", () => {
      expect(computeAllegationMetrics(single).learning_identified_rate).toBe(0);
    });

    it("learning_identified_rate is 100 when learning_identified is true", () => {
      const r = [makeRecord({ learning_identified: true })];
      expect(computeAllegationMetrics(r).learning_identified_rate).toBe(100);
    });

    it("average_days_to_resolution is 14 for default record", () => {
      expect(computeAllegationMetrics(single).average_days_to_resolution).toBe(14);
    });

    it("by_allegation_type groups single record correctly", () => {
      expect(computeAllegationMetrics(single).by_allegation_type).toEqual({ physical_abuse: 1 });
    });

    it("by_allegation_source groups single record correctly", () => {
      expect(computeAllegationMetrics(single).by_allegation_source).toEqual({ parent_carer: 1 });
    });

    it("by_investigation_stage groups single record correctly", () => {
      expect(computeAllegationMetrics(single).by_investigation_stage).toEqual({ closed: 1 });
    });

    it("by_allegation_outcome groups single record correctly", () => {
      expect(computeAllegationMetrics(single).by_allegation_outcome).toEqual({ unsubstantiated: 1 });
    });
  });

  // ── Multiple records ─────────────────────────────────────────────────
  describe("multiple records", () => {
    const records = [
      makeRecord({
        id: "a-1",
        allegation_type: "sexual_abuse",
        allegation_source: "child",
        investigation_stage: "investigation_ongoing",
        allegation_outcome: "pending",
        lado_referral_made: true,
        lado_response_within_1_day: true,
        police_informed: true,
        ofsted_notified: true,
        dbs_referral_made: false,
        subject_suspended: true,
        risk_assessment_completed: true,
        child_safe_and_supported: true,
        support_for_subject: true,
        learning_identified: false,
        days_to_resolution: null,
      }),
      makeRecord({
        id: "a-2",
        allegation_type: "physical_abuse",
        allegation_source: "parent_carer",
        investigation_stage: "closed",
        allegation_outcome: "substantiated",
        lado_referral_made: true,
        lado_response_within_1_day: false,
        police_informed: true,
        ofsted_notified: true,
        dbs_referral_made: true,
        subject_suspended: true,
        risk_assessment_completed: true,
        child_safe_and_supported: true,
        support_for_subject: false,
        learning_identified: true,
        days_to_resolution: 30,
      }),
      makeRecord({
        id: "a-3",
        allegation_type: "neglect",
        allegation_source: "social_worker",
        investigation_stage: "withdrawn",
        allegation_outcome: "unsubstantiated",
        lado_referral_made: false,
        lado_response_within_1_day: null,
        police_informed: false,
        ofsted_notified: false,
        dbs_referral_made: false,
        subject_suspended: false,
        risk_assessment_completed: false,
        child_safe_and_supported: false,
        support_for_subject: false,
        learning_identified: false,
        days_to_resolution: null,
      }),
      makeRecord({
        id: "a-4",
        allegation_type: "emotional_abuse",
        allegation_source: "staff_member",
        investigation_stage: "received",
        allegation_outcome: "pending",
        lado_referral_made: true,
        lado_response_within_1_day: true,
        police_informed: false,
        ofsted_notified: false,
        dbs_referral_made: false,
        subject_suspended: false,
        risk_assessment_completed: false,
        child_safe_and_supported: false,
        support_for_subject: true,
        learning_identified: false,
        days_to_resolution: null,
      }),
      makeRecord({
        id: "a-5",
        allegation_type: "physical_abuse",
        allegation_source: "child",
        investigation_stage: "closed",
        allegation_outcome: "unfounded",
        lado_referral_made: true,
        lado_response_within_1_day: true,
        police_informed: false,
        ofsted_notified: true,
        dbs_referral_made: false,
        subject_suspended: false,
        risk_assessment_completed: true,
        child_safe_and_supported: true,
        support_for_subject: false,
        learning_identified: true,
        days_to_resolution: 10,
      }),
    ];

    it("total_allegations is 5", () => {
      expect(computeAllegationMetrics(records).total_allegations).toBe(5);
    });

    it("open_allegations is 2 (investigation_ongoing + received)", () => {
      expect(computeAllegationMetrics(records).open_allegations).toBe(2);
    });

    it("substantiated_count is 1", () => {
      expect(computeAllegationMetrics(records).substantiated_count).toBe(1);
    });

    it("unsubstantiated_count is 1", () => {
      expect(computeAllegationMetrics(records).unsubstantiated_count).toBe(1);
    });

    it("lado_referral_rate is 80 (4 of 5)", () => {
      expect(computeAllegationMetrics(records).lado_referral_rate).toBe(80);
    });

    it("lado_response_within_1_day_rate is 75 (3 true of 4 non-null)", () => {
      // non-null: true, false, true, true = 4; true = 3; 3/4 = 75
      expect(computeAllegationMetrics(records).lado_response_within_1_day_rate).toBe(75);
    });

    it("police_informed_rate is 40 (2 of 5)", () => {
      expect(computeAllegationMetrics(records).police_informed_rate).toBe(40);
    });

    it("ofsted_notified_rate is 60 (3 of 5)", () => {
      expect(computeAllegationMetrics(records).ofsted_notified_rate).toBe(60);
    });

    it("dbs_referral_count is 1", () => {
      expect(computeAllegationMetrics(records).dbs_referral_count).toBe(1);
    });

    it("suspension_count is 2", () => {
      expect(computeAllegationMetrics(records).suspension_count).toBe(2);
    });

    it("risk_assessment_rate is 60 (3 of 5)", () => {
      expect(computeAllegationMetrics(records).risk_assessment_rate).toBe(60);
    });

    it("child_safe_rate is 60 (3 of 5)", () => {
      expect(computeAllegationMetrics(records).child_safe_rate).toBe(60);
    });

    it("subject_support_rate is 40 (2 of 5)", () => {
      expect(computeAllegationMetrics(records).subject_support_rate).toBe(40);
    });

    it("learning_identified_rate is 40 (2 of 5)", () => {
      expect(computeAllegationMetrics(records).learning_identified_rate).toBe(40);
    });

    it("average_days_to_resolution is 20 ((30+10)/2)", () => {
      expect(computeAllegationMetrics(records).average_days_to_resolution).toBe(20);
    });

    it("by_allegation_type groups correctly", () => {
      expect(computeAllegationMetrics(records).by_allegation_type).toEqual({
        sexual_abuse: 1,
        physical_abuse: 2,
        neglect: 1,
        emotional_abuse: 1,
      });
    });

    it("by_allegation_source groups correctly", () => {
      expect(computeAllegationMetrics(records).by_allegation_source).toEqual({
        child: 2,
        parent_carer: 1,
        social_worker: 1,
        staff_member: 1,
      });
    });

    it("by_investigation_stage groups correctly", () => {
      expect(computeAllegationMetrics(records).by_investigation_stage).toEqual({
        investigation_ongoing: 1,
        closed: 2,
        withdrawn: 1,
        received: 1,
      });
    });

    it("by_allegation_outcome groups correctly", () => {
      expect(computeAllegationMetrics(records).by_allegation_outcome).toEqual({
        pending: 2,
        substantiated: 1,
        unsubstantiated: 1,
        unfounded: 1,
      });
    });
  });

  // ── open_allegations logic ─────────────────────────────────────────────
  describe("open_allegations logic", () => {
    it("counts received as open", () => {
      const r = [makeRecord({ investigation_stage: "received" })];
      expect(computeAllegationMetrics(r).open_allegations).toBe(1);
    });

    it("counts lado_referral_made as open", () => {
      const r = [makeRecord({ investigation_stage: "lado_referral_made" })];
      expect(computeAllegationMetrics(r).open_allegations).toBe(1);
    });

    it("counts lado_strategy_meeting as open", () => {
      const r = [makeRecord({ investigation_stage: "lado_strategy_meeting" })];
      expect(computeAllegationMetrics(r).open_allegations).toBe(1);
    });

    it("counts investigation_ongoing as open", () => {
      const r = [makeRecord({ investigation_stage: "investigation_ongoing" })];
      expect(computeAllegationMetrics(r).open_allegations).toBe(1);
    });

    it("counts disciplinary_hearing as open", () => {
      const r = [makeRecord({ investigation_stage: "disciplinary_hearing" })];
      expect(computeAllegationMetrics(r).open_allegations).toBe(1);
    });

    it("counts outcome_reached as open", () => {
      const r = [makeRecord({ investigation_stage: "outcome_reached" })];
      expect(computeAllegationMetrics(r).open_allegations).toBe(1);
    });

    it("does NOT count closed as open", () => {
      const r = [makeRecord({ investigation_stage: "closed" })];
      expect(computeAllegationMetrics(r).open_allegations).toBe(0);
    });

    it("does NOT count withdrawn as open", () => {
      const r = [makeRecord({ investigation_stage: "withdrawn" })];
      expect(computeAllegationMetrics(r).open_allegations).toBe(0);
    });

    it("counts multiple open stages correctly", () => {
      const r = [
        makeRecord({ id: "1", investigation_stage: "received" }),
        makeRecord({ id: "2", investigation_stage: "investigation_ongoing" }),
        makeRecord({ id: "3", investigation_stage: "closed" }),
        makeRecord({ id: "4", investigation_stage: "withdrawn" }),
        makeRecord({ id: "5", investigation_stage: "disciplinary_hearing" }),
      ];
      expect(computeAllegationMetrics(r).open_allegations).toBe(3);
    });
  });

  // ── lado_response_within_1_day_rate ──────────────────────────────────
  describe("lado_response_within_1_day_rate", () => {
    it("is 0 when all lado_response_within_1_day are null", () => {
      const r = [
        makeRecord({ id: "1", lado_response_within_1_day: null }),
        makeRecord({ id: "2", lado_response_within_1_day: null }),
      ];
      expect(computeAllegationMetrics(r).lado_response_within_1_day_rate).toBeNull();;
    });

    it("is 100 when all non-null are true", () => {
      const r = [
        makeRecord({ id: "1", lado_response_within_1_day: true }),
        makeRecord({ id: "2", lado_response_within_1_day: true }),
        makeRecord({ id: "3", lado_response_within_1_day: null }),
      ];
      expect(computeAllegationMetrics(r).lado_response_within_1_day_rate).toBe(100);
    });

    it("is 0 when all non-null are false", () => {
      const r = [
        makeRecord({ id: "1", lado_response_within_1_day: false }),
        makeRecord({ id: "2", lado_response_within_1_day: false }),
      ];
      expect(computeAllegationMetrics(r).lado_response_within_1_day_rate).toBe(0);
    });

    it("is 50 for 1 true 1 false", () => {
      const r = [
        makeRecord({ id: "1", lado_response_within_1_day: true }),
        makeRecord({ id: "2", lado_response_within_1_day: false }),
      ];
      expect(computeAllegationMetrics(r).lado_response_within_1_day_rate).toBe(50);
    });

    it("excludes null from denominator", () => {
      const r = [
        makeRecord({ id: "1", lado_response_within_1_day: true }),
        makeRecord({ id: "2", lado_response_within_1_day: null }),
        makeRecord({ id: "3", lado_response_within_1_day: null }),
      ];
      expect(computeAllegationMetrics(r).lado_response_within_1_day_rate).toBe(100);
    });

    it("rounds correctly for 1 of 3 (33.3)", () => {
      const r = [
        makeRecord({ id: "1", lado_response_within_1_day: true }),
        makeRecord({ id: "2", lado_response_within_1_day: false }),
        makeRecord({ id: "3", lado_response_within_1_day: false }),
      ];
      expect(computeAllegationMetrics(r).lado_response_within_1_day_rate).toBe(33.3);
    });

    it("rounds correctly for 2 of 3 (66.7)", () => {
      const r = [
        makeRecord({ id: "1", lado_response_within_1_day: true }),
        makeRecord({ id: "2", lado_response_within_1_day: true }),
        makeRecord({ id: "3", lado_response_within_1_day: false }),
      ];
      expect(computeAllegationMetrics(r).lado_response_within_1_day_rate).toBe(66.7);
    });
  });

  // ── average_days_to_resolution ────────────────────────────────────────
  describe("average_days_to_resolution", () => {
    it("is 0 when all days_to_resolution are null", () => {
      const r = [
        makeRecord({ id: "1", days_to_resolution: null }),
        makeRecord({ id: "2", days_to_resolution: null }),
      ];
      expect(computeAllegationMetrics(r).average_days_to_resolution).toBeNull();;
    });

    it("returns the single value when only one record has days", () => {
      const r = [makeRecord({ days_to_resolution: 21 })];
      expect(computeAllegationMetrics(r).average_days_to_resolution).toBe(21);
    });

    it("averages multiple values correctly", () => {
      const r = [
        makeRecord({ id: "1", days_to_resolution: 10 }),
        makeRecord({ id: "2", days_to_resolution: 20 }),
      ];
      expect(computeAllegationMetrics(r).average_days_to_resolution).toBe(15);
    });

    it("excludes null from average", () => {
      const r = [
        makeRecord({ id: "1", days_to_resolution: 10 }),
        makeRecord({ id: "2", days_to_resolution: null }),
        makeRecord({ id: "3", days_to_resolution: 20 }),
      ];
      expect(computeAllegationMetrics(r).average_days_to_resolution).toBe(15);
    });

    it("rounds to one decimal place", () => {
      const r = [
        makeRecord({ id: "1", days_to_resolution: 10 }),
        makeRecord({ id: "2", days_to_resolution: 20 }),
        makeRecord({ id: "3", days_to_resolution: 30 }),
      ];
      expect(computeAllegationMetrics(r).average_days_to_resolution).toBe(20);
    });

    it("rounds correctly for non-round average (7.5)", () => {
      const r = [
        makeRecord({ id: "1", days_to_resolution: 7 }),
        makeRecord({ id: "2", days_to_resolution: 8 }),
      ];
      expect(computeAllegationMetrics(r).average_days_to_resolution).toBe(7.5);
    });

    it("rounds correctly for repeating decimal (10.7)", () => {
      const r = [
        makeRecord({ id: "1", days_to_resolution: 5 }),
        makeRecord({ id: "2", days_to_resolution: 10 }),
        makeRecord({ id: "3", days_to_resolution: 17 }),
      ];
      // (5 + 10 + 17) / 3 = 10.666... -> 10.7
      expect(computeAllegationMetrics(r).average_days_to_resolution).toBe(10.7);
    });
  });

  // ── lado_referral_rate ────────────────────────────────────────────────
  describe("lado_referral_rate", () => {
    it("is 100 when all have lado referral", () => {
      const r = [
        makeRecord({ id: "1", lado_referral_made: true }),
        makeRecord({ id: "2", lado_referral_made: true }),
      ];
      expect(computeAllegationMetrics(r).lado_referral_rate).toBe(100);
    });

    it("is 0 when none have lado referral", () => {
      const r = [
        makeRecord({ id: "1", lado_referral_made: false }),
        makeRecord({ id: "2", lado_referral_made: false }),
      ];
      expect(computeAllegationMetrics(r).lado_referral_rate).toBe(0);
    });

    it("rounds correctly for 1 of 3 (33.3)", () => {
      const r = [
        makeRecord({ id: "1", lado_referral_made: true }),
        makeRecord({ id: "2", lado_referral_made: false }),
        makeRecord({ id: "3", lado_referral_made: false }),
      ];
      expect(computeAllegationMetrics(r).lado_referral_rate).toBe(33.3);
    });

    it("rounds correctly for 2 of 3 (66.7)", () => {
      const r = [
        makeRecord({ id: "1", lado_referral_made: true }),
        makeRecord({ id: "2", lado_referral_made: true }),
        makeRecord({ id: "3", lado_referral_made: false }),
      ];
      expect(computeAllegationMetrics(r).lado_referral_rate).toBe(66.7);
    });
  });

  // ── police_informed_rate ──────────────────────────────────────────────
  describe("police_informed_rate", () => {
    it("is 100 when all police informed", () => {
      const r = [
        makeRecord({ id: "1", police_informed: true }),
        makeRecord({ id: "2", police_informed: true }),
      ];
      expect(computeAllegationMetrics(r).police_informed_rate).toBe(100);
    });

    it("is 0 when none police informed", () => {
      const r = [
        makeRecord({ id: "1", police_informed: false }),
        makeRecord({ id: "2", police_informed: false }),
      ];
      expect(computeAllegationMetrics(r).police_informed_rate).toBe(0);
    });

    it("rounds correctly for 1 of 3 (33.3)", () => {
      const r = [
        makeRecord({ id: "1", police_informed: true }),
        makeRecord({ id: "2", police_informed: false }),
        makeRecord({ id: "3", police_informed: false }),
      ];
      expect(computeAllegationMetrics(r).police_informed_rate).toBe(33.3);
    });
  });

  // ── risk_assessment_rate ──────────────────────────────────────────────
  describe("risk_assessment_rate", () => {
    it("is 100 when all have risk assessment", () => {
      const r = [
        makeRecord({ id: "1", risk_assessment_completed: true }),
        makeRecord({ id: "2", risk_assessment_completed: true }),
      ];
      expect(computeAllegationMetrics(r).risk_assessment_rate).toBe(100);
    });

    it("is 0 when none have risk assessment", () => {
      const r = [
        makeRecord({ id: "1", risk_assessment_completed: false }),
        makeRecord({ id: "2", risk_assessment_completed: false }),
      ];
      expect(computeAllegationMetrics(r).risk_assessment_rate).toBe(0);
    });

    it("rounds correctly for 1 of 3 (33.3)", () => {
      const r = [
        makeRecord({ id: "1", risk_assessment_completed: true }),
        makeRecord({ id: "2", risk_assessment_completed: false }),
        makeRecord({ id: "3", risk_assessment_completed: false }),
      ];
      expect(computeAllegationMetrics(r).risk_assessment_rate).toBe(33.3);
    });
  });

  // ── learning_identified_rate ──────────────────────────────────────────
  describe("learning_identified_rate", () => {
    it("is 100 when all have learning identified", () => {
      const r = [
        makeRecord({ id: "1", learning_identified: true }),
        makeRecord({ id: "2", learning_identified: true }),
      ];
      expect(computeAllegationMetrics(r).learning_identified_rate).toBe(100);
    });

    it("is 0 when none have learning identified", () => {
      const r = [
        makeRecord({ id: "1", learning_identified: false }),
        makeRecord({ id: "2", learning_identified: false }),
      ];
      expect(computeAllegationMetrics(r).learning_identified_rate).toBe(0);
    });

    it("rounds correctly for 1 of 3 (33.3)", () => {
      const r = [
        makeRecord({ id: "1", learning_identified: true }),
        makeRecord({ id: "2", learning_identified: false }),
        makeRecord({ id: "3", learning_identified: false }),
      ];
      expect(computeAllegationMetrics(r).learning_identified_rate).toBe(33.3);
    });
  });

  // ── Outcome counts ────────────────────────────────────────────────────
  describe("outcome counts", () => {
    it("counts only substantiated outcomes", () => {
      const r = [
        makeRecord({ id: "1", allegation_outcome: "substantiated" }),
        makeRecord({ id: "2", allegation_outcome: "substantiated" }),
        makeRecord({ id: "3", allegation_outcome: "unsubstantiated" }),
      ];
      expect(computeAllegationMetrics(r).substantiated_count).toBe(2);
    });

    it("counts only unsubstantiated outcomes", () => {
      const r = [
        makeRecord({ id: "1", allegation_outcome: "unsubstantiated" }),
        makeRecord({ id: "2", allegation_outcome: "unsubstantiated" }),
        makeRecord({ id: "3", allegation_outcome: "substantiated" }),
      ];
      expect(computeAllegationMetrics(r).unsubstantiated_count).toBe(2);
    });

    it("returns zero for absent outcome types", () => {
      const r = [
        makeRecord({ id: "1", allegation_outcome: "pending" }),
        makeRecord({ id: "2", allegation_outcome: "unfounded" }),
      ];
      const m = computeAllegationMetrics(r);
      expect(m.substantiated_count).toBe(0);
      expect(m.unsubstantiated_count).toBe(0);
    });
  });

  // ── by_ breakdown maps ────────────────────────────────────────────────
  describe("by_ breakdown maps", () => {
    it("by_allegation_type handles all types present", () => {
      const r = [
        makeRecord({ id: "1", allegation_type: "sexual_abuse" }),
        makeRecord({ id: "2", allegation_type: "sexual_abuse" }),
        makeRecord({ id: "3", allegation_type: "neglect" }),
        makeRecord({ id: "4", allegation_type: "other" }),
      ];
      expect(computeAllegationMetrics(r).by_allegation_type).toEqual({
        sexual_abuse: 2,
        neglect: 1,
        other: 1,
      });
    });

    it("by_allegation_source handles multiple sources", () => {
      const r = [
        makeRecord({ id: "1", allegation_source: "child" }),
        makeRecord({ id: "2", allegation_source: "child" }),
        makeRecord({ id: "3", allegation_source: "police" }),
      ];
      expect(computeAllegationMetrics(r).by_allegation_source).toEqual({
        child: 2,
        police: 1,
      });
    });

    it("by_investigation_stage handles multiple stages", () => {
      const r = [
        makeRecord({ id: "1", investigation_stage: "received" }),
        makeRecord({ id: "2", investigation_stage: "received" }),
        makeRecord({ id: "3", investigation_stage: "closed" }),
        makeRecord({ id: "4", investigation_stage: "withdrawn" }),
      ];
      expect(computeAllegationMetrics(r).by_investigation_stage).toEqual({
        received: 2,
        closed: 1,
        withdrawn: 1,
      });
    });

    it("by_allegation_outcome handles all outcomes present", () => {
      const r = [
        makeRecord({ id: "1", allegation_outcome: "substantiated" }),
        makeRecord({ id: "2", allegation_outcome: "unsubstantiated" }),
        makeRecord({ id: "3", allegation_outcome: "unfounded" }),
        makeRecord({ id: "4", allegation_outcome: "malicious" }),
        makeRecord({ id: "5", allegation_outcome: "false" }),
        makeRecord({ id: "6", allegation_outcome: "pending" }),
      ];
      expect(computeAllegationMetrics(r).by_allegation_outcome).toEqual({
        substantiated: 1,
        unsubstantiated: 1,
        unfounded: 1,
        malicious: 1,
        false: 1,
        pending: 1,
      });
    });
  });

  // ── Rate rounding consistency ──────────────────────────────────────────
  describe("rate rounding consistency", () => {
    it("all rates use Math.round(value * 1000) / 10 formula", () => {
      const r = [
        makeRecord({
          id: "1",
          lado_referral_made: true,
          lado_response_within_1_day: true,
          police_informed: true,
          ofsted_notified: true,
          risk_assessment_completed: true,
          child_safe_and_supported: true,
          support_for_subject: true,
          learning_identified: true,
        }),
        makeRecord({
          id: "2",
          lado_referral_made: true,
          lado_response_within_1_day: true,
          police_informed: true,
          ofsted_notified: true,
          risk_assessment_completed: true,
          child_safe_and_supported: true,
          support_for_subject: true,
          learning_identified: true,
        }),
        makeRecord({
          id: "3",
          lado_referral_made: false,
          lado_response_within_1_day: false,
          police_informed: false,
          ofsted_notified: false,
          risk_assessment_completed: false,
          child_safe_and_supported: false,
          support_for_subject: false,
          learning_identified: false,
        }),
      ];
      const m = computeAllegationMetrics(r);
      // 2/3 = 66.7
      expect(m.lado_referral_rate).toBe(66.7);
      expect(m.lado_response_within_1_day_rate).toBe(66.7);
      expect(m.police_informed_rate).toBe(66.7);
      expect(m.ofsted_notified_rate).toBe(66.7);
      expect(m.risk_assessment_rate).toBe(66.7);
      expect(m.child_safe_rate).toBe(66.7);
      expect(m.subject_support_rate).toBe(66.7);
      expect(m.learning_identified_rate).toBe(66.7);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. identifyAllegationAlerts
// ═══════════════════════════════════════════════════════════════════════════

describe("identifyAllegationAlerts", () => {
  // ── No alerts ──────────────────────────────────────────────────────
  describe("no alerts scenario", () => {
    it("returns empty array for empty records", () => {
      expect(identifyAllegationAlerts([])).toEqual([]);
    });

    it("returns empty array when everything is well-managed", () => {
      const r = [
        makeRecord({
          id: "a-1",
          allegation_type: "physical_abuse",
          investigation_stage: "closed",
          lado_referral_made: true,
          child_safe_and_supported: true,
          risk_assessment_completed: true,
          ofsted_notified: true,
        }),
      ];
      expect(identifyAllegationAlerts(r)).toEqual([]);
    });

    it("returns empty for withdrawn record even with issues", () => {
      const r = [
        makeRecord({
          id: "a-1",
          allegation_type: "sexual_abuse",
          investigation_stage: "withdrawn",
          lado_referral_made: false,
          child_safe_and_supported: false,
          child_involved: "Child A",
          risk_assessment_completed: false,
          ofsted_notified: false,
        }),
      ];
      // withdrawn excludes: sexual_abuse alert, child_not_safe, no_risk_assessment, no_lado_referral, ofsted_not_notified
      // lado_referral_made=false + withdrawn -> no_lado_referral excluded (withdrawn)
      // ofsted_notified=false + withdrawn -> ofsted excluded (withdrawn)
      // risk_assessment=false + withdrawn -> no_risk excluded (withdrawn)
      // child_safe=false + child_involved + withdrawn -> child_not_safe excluded (withdrawn)
      // sexual_abuse + withdrawn -> excluded
      expect(identifyAllegationAlerts(r)).toEqual([]);
    });

    it("returns empty for closed record with no issues", () => {
      const r = [
        makeRecord({
          id: "a-1",
          allegation_type: "neglect",
          investigation_stage: "closed",
          lado_referral_made: true,
          risk_assessment_completed: true,
          ofsted_notified: true,
          child_safe_and_supported: true,
        }),
      ];
      expect(identifyAllegationAlerts(r)).toEqual([]);
    });
  });

  // ── sexual_abuse_allegation alert (critical) ────────────────────────
  describe("sexual_abuse_allegation alert", () => {
    it("fires for sexual_abuse type with stage=received", () => {
      const r = [
        makeRecord({
          id: "a-1",
          allegation_type: "sexual_abuse",
          investigation_stage: "received",
          lado_referral_made: true,
          ofsted_notified: true,
          risk_assessment_completed: true,
        }),
      ];
      const alerts = identifyAllegationAlerts(r);
      expect(alerts.find((a) => a.type === "sexual_abuse_allegation")).toBeTruthy();
    });

    it("fires for sexual_abuse type with stage=investigation_ongoing", () => {
      const r = [
        makeRecord({
          id: "a-1",
          allegation_type: "sexual_abuse",
          investigation_stage: "investigation_ongoing",
          lado_referral_made: true,
          ofsted_notified: true,
          risk_assessment_completed: true,
        }),
      ];
      expect(identifyAllegationAlerts(r).find((a) => a.type === "sexual_abuse_allegation")).toBeTruthy();
    });

    it("fires for sexual_abuse type with stage=lado_referral_made", () => {
      const r = [
        makeRecord({
          id: "a-1",
          allegation_type: "sexual_abuse",
          investigation_stage: "lado_referral_made",
          lado_referral_made: true,
          ofsted_notified: true,
          risk_assessment_completed: true,
        }),
      ];
      expect(identifyAllegationAlerts(r).find((a) => a.type === "sexual_abuse_allegation")).toBeTruthy();
    });

    it("fires for sexual_abuse type with stage=lado_strategy_meeting", () => {
      const r = [
        makeRecord({
          id: "a-1",
          allegation_type: "sexual_abuse",
          investigation_stage: "lado_strategy_meeting",
          lado_referral_made: true,
          ofsted_notified: true,
          risk_assessment_completed: true,
        }),
      ];
      expect(identifyAllegationAlerts(r).find((a) => a.type === "sexual_abuse_allegation")).toBeTruthy();
    });

    it("fires for sexual_abuse type with stage=disciplinary_hearing", () => {
      const r = [
        makeRecord({
          id: "a-1",
          allegation_type: "sexual_abuse",
          investigation_stage: "disciplinary_hearing",
          lado_referral_made: true,
          ofsted_notified: true,
          risk_assessment_completed: true,
        }),
      ];
      expect(identifyAllegationAlerts(r).find((a) => a.type === "sexual_abuse_allegation")).toBeTruthy();
    });

    it("fires for sexual_abuse type with stage=outcome_reached", () => {
      const r = [
        makeRecord({
          id: "a-1",
          allegation_type: "sexual_abuse",
          investigation_stage: "outcome_reached",
          lado_referral_made: true,
          ofsted_notified: true,
          risk_assessment_completed: true,
        }),
      ];
      expect(identifyAllegationAlerts(r).find((a) => a.type === "sexual_abuse_allegation")).toBeTruthy();
    });

    it("has critical severity", () => {
      const r = [
        makeRecord({
          id: "a-1",
          allegation_type: "sexual_abuse",
          investigation_stage: "received",
          lado_referral_made: true,
          ofsted_notified: true,
          risk_assessment_completed: true,
        }),
      ];
      const alert = identifyAllegationAlerts(r).find((a) => a.type === "sexual_abuse_allegation")!;
      expect(alert.severity).toBe("critical");
    });

    it("uses the record id as alert id", () => {
      const r = [
        makeRecord({
          id: "a-42",
          allegation_type: "sexual_abuse",
          investigation_stage: "received",
          lado_referral_made: true,
          ofsted_notified: true,
          risk_assessment_completed: true,
        }),
      ];
      const alert = identifyAllegationAlerts(r).find((a) => a.type === "sexual_abuse_allegation")!;
      expect(alert.id).toBe("a-42");
    });

    it("message contains subject_name", () => {
      const r = [
        makeRecord({
          id: "a-1",
          allegation_type: "sexual_abuse",
          investigation_stage: "received",
          subject_name: "Alice Brown",
          lado_referral_made: true,
          ofsted_notified: true,
          risk_assessment_completed: true,
        }),
      ];
      const alert = identifyAllegationAlerts(r).find((a) => a.type === "sexual_abuse_allegation")!;
      expect(alert.message).toContain("Alice Brown");
    });

    it("message contains subject_role", () => {
      const r = [
        makeRecord({
          id: "a-1",
          allegation_type: "sexual_abuse",
          investigation_stage: "received",
          subject_role: "Night Worker",
          lado_referral_made: true,
          ofsted_notified: true,
          risk_assessment_completed: true,
        }),
      ];
      const alert = identifyAllegationAlerts(r).find((a) => a.type === "sexual_abuse_allegation")!;
      expect(alert.message).toContain("Night Worker");
    });

    it("does NOT fire for sexual_abuse with stage=closed", () => {
      const r = [
        makeRecord({
          id: "a-1",
          allegation_type: "sexual_abuse",
          investigation_stage: "closed",
          lado_referral_made: true,
          ofsted_notified: true,
          risk_assessment_completed: true,
        }),
      ];
      expect(identifyAllegationAlerts(r).find((a) => a.type === "sexual_abuse_allegation")).toBeUndefined();
    });

    it("does NOT fire for sexual_abuse with stage=withdrawn", () => {
      const r = [
        makeRecord({
          id: "a-1",
          allegation_type: "sexual_abuse",
          investigation_stage: "withdrawn",
          lado_referral_made: true,
          ofsted_notified: true,
          risk_assessment_completed: true,
        }),
      ];
      expect(identifyAllegationAlerts(r).find((a) => a.type === "sexual_abuse_allegation")).toBeUndefined();
    });

    it("does NOT fire for non-sexual_abuse type even if open", () => {
      const r = [
        makeRecord({
          id: "a-1",
          allegation_type: "physical_abuse",
          investigation_stage: "received",
          lado_referral_made: true,
          ofsted_notified: true,
          risk_assessment_completed: true,
        }),
      ];
      expect(identifyAllegationAlerts(r).find((a) => a.type === "sexual_abuse_allegation")).toBeUndefined();
    });

    it("fires per record for multiple active sexual abuse allegations", () => {
      const r = [
        makeRecord({
          id: "a-1",
          allegation_type: "sexual_abuse",
          investigation_stage: "received",
          lado_referral_made: true,
          ofsted_notified: true,
          risk_assessment_completed: true,
        }),
        makeRecord({
          id: "a-2",
          allegation_type: "sexual_abuse",
          investigation_stage: "investigation_ongoing",
          lado_referral_made: true,
          ofsted_notified: true,
          risk_assessment_completed: true,
        }),
      ];
      const alerts = identifyAllegationAlerts(r).filter((a) => a.type === "sexual_abuse_allegation");
      expect(alerts).toHaveLength(2);
    });

    it("fires only for qualifying records among mixed set", () => {
      const r = [
        makeRecord({
          id: "a-1",
          allegation_type: "sexual_abuse",
          investigation_stage: "received",
          lado_referral_made: true,
          ofsted_notified: true,
          risk_assessment_completed: true,
        }),
        makeRecord({
          id: "a-2",
          allegation_type: "sexual_abuse",
          investigation_stage: "closed",
          lado_referral_made: true,
          ofsted_notified: true,
          risk_assessment_completed: true,
        }),
        makeRecord({
          id: "a-3",
          allegation_type: "physical_abuse",
          investigation_stage: "received",
          lado_referral_made: true,
          ofsted_notified: true,
          risk_assessment_completed: true,
        }),
      ];
      const alerts = identifyAllegationAlerts(r).filter((a) => a.type === "sexual_abuse_allegation");
      expect(alerts).toHaveLength(1);
      expect(alerts[0].id).toBe("a-1");
    });
  });

  // ── no_lado_referral alert (critical) ────────────────────────────────
  describe("no_lado_referral alert", () => {
    it("fires for lado_referral_made=false and stage=received", () => {
      const r = [
        makeRecord({
          id: "a-1",
          lado_referral_made: false,
          investigation_stage: "received",
          ofsted_notified: true,
          risk_assessment_completed: true,
        }),
      ];
      const alerts = identifyAllegationAlerts(r);
      expect(alerts.find((a) => a.type === "no_lado_referral")).toBeTruthy();
    });

    it("fires for lado_referral_made=false and stage=closed", () => {
      const r = [
        makeRecord({
          id: "a-1",
          lado_referral_made: false,
          investigation_stage: "closed",
          ofsted_notified: true,
          risk_assessment_completed: true,
        }),
      ];
      expect(identifyAllegationAlerts(r).find((a) => a.type === "no_lado_referral")).toBeTruthy();
    });

    it("has critical severity", () => {
      const r = [
        makeRecord({
          id: "a-1",
          lado_referral_made: false,
          investigation_stage: "received",
          ofsted_notified: true,
          risk_assessment_completed: true,
        }),
      ];
      const alert = identifyAllegationAlerts(r).find((a) => a.type === "no_lado_referral")!;
      expect(alert.severity).toBe("critical");
    });

    it("uses the record id as alert id", () => {
      const r = [
        makeRecord({
          id: "a-99",
          lado_referral_made: false,
          investigation_stage: "received",
          ofsted_notified: true,
          risk_assessment_completed: true,
        }),
      ];
      const alert = identifyAllegationAlerts(r).find((a) => a.type === "no_lado_referral")!;
      expect(alert.id).toBe("a-99");
    });

    it("message contains subject_name", () => {
      const r = [
        makeRecord({
          id: "a-1",
          lado_referral_made: false,
          investigation_stage: "received",
          subject_name: "Bob Jones",
          ofsted_notified: true,
          risk_assessment_completed: true,
        }),
      ];
      const alert = identifyAllegationAlerts(r).find((a) => a.type === "no_lado_referral")!;
      expect(alert.message).toContain("Bob Jones");
    });

    it("message contains allegation_date", () => {
      const r = [
        makeRecord({
          id: "a-1",
          lado_referral_made: false,
          investigation_stage: "received",
          allegation_date: "2024-09-15",
          ofsted_notified: true,
          risk_assessment_completed: true,
        }),
      ];
      const alert = identifyAllegationAlerts(r).find((a) => a.type === "no_lado_referral")!;
      expect(alert.message).toContain("2024-09-15");
    });

    it("does NOT fire when lado_referral_made is true", () => {
      const r = [
        makeRecord({
          id: "a-1",
          lado_referral_made: true,
          investigation_stage: "received",
          ofsted_notified: true,
          risk_assessment_completed: true,
        }),
      ];
      expect(identifyAllegationAlerts(r).find((a) => a.type === "no_lado_referral")).toBeUndefined();
    });

    it("does NOT fire for withdrawn stage", () => {
      const r = [
        makeRecord({
          id: "a-1",
          lado_referral_made: false,
          investigation_stage: "withdrawn",
          ofsted_notified: true,
          risk_assessment_completed: true,
        }),
      ];
      expect(identifyAllegationAlerts(r).find((a) => a.type === "no_lado_referral")).toBeUndefined();
    });

    it("fires per record for multiple without LADO referral", () => {
      const r = [
        makeRecord({
          id: "a-1",
          lado_referral_made: false,
          investigation_stage: "received",
          ofsted_notified: true,
          risk_assessment_completed: true,
        }),
        makeRecord({
          id: "a-2",
          lado_referral_made: false,
          investigation_stage: "investigation_ongoing",
          ofsted_notified: true,
          risk_assessment_completed: true,
        }),
      ];
      const alerts = identifyAllegationAlerts(r).filter((a) => a.type === "no_lado_referral");
      expect(alerts).toHaveLength(2);
    });
  });

  // ── child_not_safe alert (high) ──────────────────────────────────────
  describe("child_not_safe alert", () => {
    it("fires when child_safe_and_supported=false, child_involved is truthy, stage is open", () => {
      const r = [
        makeRecord({
          id: "a-1",
          child_safe_and_supported: false,
          child_involved: "Child A",
          investigation_stage: "received",
          lado_referral_made: true,
          ofsted_notified: true,
          risk_assessment_completed: true,
        }),
      ];
      const alerts = identifyAllegationAlerts(r);
      expect(alerts.find((a) => a.type === "child_not_safe")).toBeTruthy();
    });

    it("has high severity", () => {
      const r = [
        makeRecord({
          id: "a-1",
          child_safe_and_supported: false,
          child_involved: "Child A",
          investigation_stage: "received",
          lado_referral_made: true,
          ofsted_notified: true,
          risk_assessment_completed: true,
        }),
      ];
      const alert = identifyAllegationAlerts(r).find((a) => a.type === "child_not_safe")!;
      expect(alert.severity).toBe("high");
    });

    it("uses the record id as alert id", () => {
      const r = [
        makeRecord({
          id: "a-77",
          child_safe_and_supported: false,
          child_involved: "Child A",
          investigation_stage: "received",
          lado_referral_made: true,
          ofsted_notified: true,
          risk_assessment_completed: true,
        }),
      ];
      const alert = identifyAllegationAlerts(r).find((a) => a.type === "child_not_safe")!;
      expect(alert.id).toBe("a-77");
    });

    it("message contains subject_name", () => {
      const r = [
        makeRecord({
          id: "a-1",
          child_safe_and_supported: false,
          child_involved: "Child A",
          investigation_stage: "received",
          subject_name: "Carol White",
          lado_referral_made: true,
          ofsted_notified: true,
          risk_assessment_completed: true,
        }),
      ];
      const alert = identifyAllegationAlerts(r).find((a) => a.type === "child_not_safe")!;
      expect(alert.message).toContain("Carol White");
    });

    it("does NOT fire when child_safe_and_supported is true", () => {
      const r = [
        makeRecord({
          id: "a-1",
          child_safe_and_supported: true,
          child_involved: "Child A",
          investigation_stage: "received",
          lado_referral_made: true,
          ofsted_notified: true,
          risk_assessment_completed: true,
        }),
      ];
      expect(identifyAllegationAlerts(r).find((a) => a.type === "child_not_safe")).toBeUndefined();
    });

    it("does NOT fire when child_involved is null", () => {
      const r = [
        makeRecord({
          id: "a-1",
          child_safe_and_supported: false,
          child_involved: null,
          investigation_stage: "received",
          lado_referral_made: true,
          ofsted_notified: true,
          risk_assessment_completed: true,
        }),
      ];
      expect(identifyAllegationAlerts(r).find((a) => a.type === "child_not_safe")).toBeUndefined();
    });

    it("does NOT fire when child_involved is empty string", () => {
      const r = [
        makeRecord({
          id: "a-1",
          child_safe_and_supported: false,
          child_involved: "",
          investigation_stage: "received",
          lado_referral_made: true,
          ofsted_notified: true,
          risk_assessment_completed: true,
        }),
      ];
      expect(identifyAllegationAlerts(r).find((a) => a.type === "child_not_safe")).toBeUndefined();
    });

    it("does NOT fire when investigation_stage is closed", () => {
      const r = [
        makeRecord({
          id: "a-1",
          child_safe_and_supported: false,
          child_involved: "Child A",
          investigation_stage: "closed",
          lado_referral_made: true,
          ofsted_notified: true,
          risk_assessment_completed: true,
        }),
      ];
      expect(identifyAllegationAlerts(r).find((a) => a.type === "child_not_safe")).toBeUndefined();
    });

    it("does NOT fire when investigation_stage is withdrawn", () => {
      const r = [
        makeRecord({
          id: "a-1",
          child_safe_and_supported: false,
          child_involved: "Child A",
          investigation_stage: "withdrawn",
          lado_referral_made: true,
          ofsted_notified: true,
          risk_assessment_completed: true,
        }),
      ];
      expect(identifyAllegationAlerts(r).find((a) => a.type === "child_not_safe")).toBeUndefined();
    });

    it("fires per record for multiple unsafe children", () => {
      const r = [
        makeRecord({
          id: "a-1",
          child_safe_and_supported: false,
          child_involved: "Child A",
          investigation_stage: "received",
          lado_referral_made: true,
          ofsted_notified: true,
          risk_assessment_completed: true,
        }),
        makeRecord({
          id: "a-2",
          child_safe_and_supported: false,
          child_involved: "Child B",
          investigation_stage: "investigation_ongoing",
          lado_referral_made: true,
          ofsted_notified: true,
          risk_assessment_completed: true,
        }),
      ];
      const alerts = identifyAllegationAlerts(r).filter((a) => a.type === "child_not_safe");
      expect(alerts).toHaveLength(2);
    });
  });

  // ── no_risk_assessment alert (high) ──────────────────────────────────
  describe("no_risk_assessment alert", () => {
    it("fires when 1 record has no risk assessment and is open", () => {
      const r = [
        makeRecord({
          id: "a-1",
          risk_assessment_completed: false,
          investigation_stage: "received",
          lado_referral_made: true,
          ofsted_notified: true,
        }),
      ];
      const alerts = identifyAllegationAlerts(r);
      expect(alerts.find((a) => a.type === "no_risk_assessment")).toBeTruthy();
    });

    it("has high severity", () => {
      const r = [
        makeRecord({
          id: "a-1",
          risk_assessment_completed: false,
          investigation_stage: "received",
          lado_referral_made: true,
          ofsted_notified: true,
        }),
      ];
      const alert = identifyAllegationAlerts(r).find((a) => a.type === "no_risk_assessment")!;
      expect(alert.severity).toBe("high");
    });

    it("has id no_risk_assessment", () => {
      const r = [
        makeRecord({
          id: "a-1",
          risk_assessment_completed: false,
          investigation_stage: "received",
          lado_referral_made: true,
          ofsted_notified: true,
        }),
      ];
      const alert = identifyAllegationAlerts(r).find((a) => a.type === "no_risk_assessment")!;
      expect(alert.id).toBe("no_risk_assessment");
    });

    it("message uses singular for exactly 1", () => {
      const r = [
        makeRecord({
          id: "a-1",
          risk_assessment_completed: false,
          investigation_stage: "received",
          lado_referral_made: true,
          ofsted_notified: true,
        }),
      ];
      const alert = identifyAllegationAlerts(r).find((a) => a.type === "no_risk_assessment")!;
      expect(alert.message).toContain("1 allegation");
      expect(alert.message).not.toContain("allegations");
    });

    it("message uses plural for 2", () => {
      const r = [
        makeRecord({ id: "a-1", risk_assessment_completed: false, investigation_stage: "received", lado_referral_made: true, ofsted_notified: true }),
        makeRecord({ id: "a-2", risk_assessment_completed: false, investigation_stage: "investigation_ongoing", lado_referral_made: true, ofsted_notified: true }),
      ];
      const alert = identifyAllegationAlerts(r).find((a) => a.type === "no_risk_assessment")!;
      expect(alert.message).toContain("2 allegations");
    });

    it("message contains count for 3", () => {
      const r = [
        makeRecord({ id: "a-1", risk_assessment_completed: false, investigation_stage: "received", lado_referral_made: true, ofsted_notified: true }),
        makeRecord({ id: "a-2", risk_assessment_completed: false, investigation_stage: "investigation_ongoing", lado_referral_made: true, ofsted_notified: true }),
        makeRecord({ id: "a-3", risk_assessment_completed: false, investigation_stage: "lado_referral_made", lado_referral_made: true, ofsted_notified: true }),
      ];
      const alert = identifyAllegationAlerts(r).find((a) => a.type === "no_risk_assessment")!;
      expect(alert.message).toContain("3");
    });

    it("excludes closed from count", () => {
      const r = [
        makeRecord({
          id: "a-1",
          risk_assessment_completed: false,
          investigation_stage: "closed",
          lado_referral_made: true,
          ofsted_notified: true,
        }),
      ];
      expect(identifyAllegationAlerts(r).find((a) => a.type === "no_risk_assessment")).toBeUndefined();
    });

    it("excludes withdrawn from count", () => {
      const r = [
        makeRecord({
          id: "a-1",
          risk_assessment_completed: false,
          investigation_stage: "withdrawn",
          lado_referral_made: true,
          ofsted_notified: true,
        }),
      ];
      expect(identifyAllegationAlerts(r).find((a) => a.type === "no_risk_assessment")).toBeUndefined();
    });

    it("does NOT fire when all have risk assessment", () => {
      const r = [
        makeRecord({ id: "a-1", risk_assessment_completed: true, investigation_stage: "received", lado_referral_made: true, ofsted_notified: true }),
        makeRecord({ id: "a-2", risk_assessment_completed: true, investigation_stage: "investigation_ongoing", lado_referral_made: true, ofsted_notified: true }),
      ];
      expect(identifyAllegationAlerts(r).find((a) => a.type === "no_risk_assessment")).toBeUndefined();
    });

    it("counts correctly in mixed set", () => {
      const r = [
        makeRecord({ id: "a-1", risk_assessment_completed: false, investigation_stage: "received", lado_referral_made: true, ofsted_notified: true }),
        makeRecord({ id: "a-2", risk_assessment_completed: true, investigation_stage: "received", lado_referral_made: true, ofsted_notified: true }),
        makeRecord({ id: "a-3", risk_assessment_completed: false, investigation_stage: "closed", lado_referral_made: true, ofsted_notified: true }),
        makeRecord({ id: "a-4", risk_assessment_completed: false, investigation_stage: "investigation_ongoing", lado_referral_made: true, ofsted_notified: true }),
      ];
      const alert = identifyAllegationAlerts(r).find((a) => a.type === "no_risk_assessment")!;
      // a-1 and a-4 count (a-3 excluded because closed)
      expect(alert.message).toContain("2 allegations");
    });
  });

  // ── ofsted_not_notified alert (medium) ───────────────────────────────
  describe("ofsted_not_notified alert", () => {
    it("fires when 1 record has ofsted_notified=false and not withdrawn", () => {
      const r = [
        makeRecord({
          id: "a-1",
          ofsted_notified: false,
          investigation_stage: "received",
          lado_referral_made: true,
          risk_assessment_completed: true,
        }),
      ];
      const alerts = identifyAllegationAlerts(r);
      expect(alerts.find((a) => a.type === "ofsted_not_notified")).toBeTruthy();
    });

    it("fires for closed record with ofsted_notified=false", () => {
      const r = [
        makeRecord({
          id: "a-1",
          ofsted_notified: false,
          investigation_stage: "closed",
          lado_referral_made: true,
          risk_assessment_completed: true,
        }),
      ];
      expect(identifyAllegationAlerts(r).find((a) => a.type === "ofsted_not_notified")).toBeTruthy();
    });

    it("has medium severity", () => {
      const r = [
        makeRecord({
          id: "a-1",
          ofsted_notified: false,
          investigation_stage: "received",
          lado_referral_made: true,
          risk_assessment_completed: true,
        }),
      ];
      const alert = identifyAllegationAlerts(r).find((a) => a.type === "ofsted_not_notified")!;
      expect(alert.severity).toBe("medium");
    });

    it("has id ofsted_not_notified", () => {
      const r = [
        makeRecord({
          id: "a-1",
          ofsted_notified: false,
          investigation_stage: "received",
          lado_referral_made: true,
          risk_assessment_completed: true,
        }),
      ];
      const alert = identifyAllegationAlerts(r).find((a) => a.type === "ofsted_not_notified")!;
      expect(alert.id).toBe("ofsted_not_notified");
    });

    it("message uses singular for exactly 1", () => {
      const r = [
        makeRecord({
          id: "a-1",
          ofsted_notified: false,
          investigation_stage: "received",
          lado_referral_made: true,
          risk_assessment_completed: true,
        }),
      ];
      const alert = identifyAllegationAlerts(r).find((a) => a.type === "ofsted_not_notified")!;
      expect(alert.message).toContain("1 allegation");
      expect(alert.message).not.toContain("allegations");
    });

    it("message uses plural for 2", () => {
      const r = [
        makeRecord({ id: "a-1", ofsted_notified: false, investigation_stage: "received", lado_referral_made: true, risk_assessment_completed: true }),
        makeRecord({ id: "a-2", ofsted_notified: false, investigation_stage: "investigation_ongoing", lado_referral_made: true, risk_assessment_completed: true }),
      ];
      const alert = identifyAllegationAlerts(r).find((a) => a.type === "ofsted_not_notified")!;
      expect(alert.message).toContain("2 allegations");
    });

    it("message contains count for 3", () => {
      const r = [
        makeRecord({ id: "a-1", ofsted_notified: false, investigation_stage: "received", lado_referral_made: true, risk_assessment_completed: true }),
        makeRecord({ id: "a-2", ofsted_notified: false, investigation_stage: "closed", lado_referral_made: true, risk_assessment_completed: true }),
        makeRecord({ id: "a-3", ofsted_notified: false, investigation_stage: "investigation_ongoing", lado_referral_made: true, risk_assessment_completed: true }),
      ];
      const alert = identifyAllegationAlerts(r).find((a) => a.type === "ofsted_not_notified")!;
      expect(alert.message).toContain("3");
    });

    it("excludes withdrawn from count", () => {
      const r = [
        makeRecord({
          id: "a-1",
          ofsted_notified: false,
          investigation_stage: "withdrawn",
          lado_referral_made: true,
          risk_assessment_completed: true,
        }),
      ];
      expect(identifyAllegationAlerts(r).find((a) => a.type === "ofsted_not_notified")).toBeUndefined();
    });

    it("does NOT fire when all have ofsted notified", () => {
      const r = [
        makeRecord({ id: "a-1", ofsted_notified: true, investigation_stage: "received", lado_referral_made: true, risk_assessment_completed: true }),
        makeRecord({ id: "a-2", ofsted_notified: true, investigation_stage: "investigation_ongoing", lado_referral_made: true, risk_assessment_completed: true }),
      ];
      expect(identifyAllegationAlerts(r).find((a) => a.type === "ofsted_not_notified")).toBeUndefined();
    });

    it("counts correctly in mixed set", () => {
      const r = [
        makeRecord({ id: "a-1", ofsted_notified: false, investigation_stage: "received", lado_referral_made: true, risk_assessment_completed: true }),
        makeRecord({ id: "a-2", ofsted_notified: true, investigation_stage: "received", lado_referral_made: true, risk_assessment_completed: true }),
        makeRecord({ id: "a-3", ofsted_notified: false, investigation_stage: "withdrawn", lado_referral_made: true, risk_assessment_completed: true }),
        makeRecord({ id: "a-4", ofsted_notified: false, investigation_stage: "closed", lado_referral_made: true, risk_assessment_completed: true }),
      ];
      const alert = identifyAllegationAlerts(r).find((a) => a.type === "ofsted_not_notified")!;
      // a-1 and a-4 count (a-3 excluded because withdrawn)
      expect(alert.message).toContain("2 allegations");
    });
  });

  // ── Combined alert scenarios ───────────────────────────────────────
  describe("combined alert scenarios", () => {
    it("can fire all five alert types simultaneously", () => {
      const r = [
        makeRecord({
          id: "a-1",
          allegation_type: "sexual_abuse",
          investigation_stage: "received",
          lado_referral_made: false,
          child_safe_and_supported: false,
          child_involved: "Child X",
          risk_assessment_completed: false,
          ofsted_notified: false,
        }),
      ];
      const alerts = identifyAllegationAlerts(r);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("sexual_abuse_allegation");
      expect(types).toContain("no_lado_referral");
      expect(types).toContain("child_not_safe");
      expect(types).toContain("no_risk_assessment");
      expect(types).toContain("ofsted_not_notified");
    });

    it("returns no alerts for a clean set of records", () => {
      const r = [
        makeRecord({
          id: "a-1",
          allegation_type: "physical_abuse",
          investigation_stage: "closed",
          lado_referral_made: true,
          risk_assessment_completed: true,
          ofsted_notified: true,
          child_safe_and_supported: true,
        }),
        makeRecord({
          id: "a-2",
          allegation_type: "neglect",
          investigation_stage: "closed",
          lado_referral_made: true,
          risk_assessment_completed: true,
          ofsted_notified: true,
          child_safe_and_supported: true,
        }),
      ];
      expect(identifyAllegationAlerts(r)).toEqual([]);
    });

    it("alert order: sexual_abuse_allegation before no_lado_referral before child_not_safe before no_risk_assessment before ofsted_not_notified", () => {
      const r = [
        makeRecord({
          id: "a-1",
          allegation_type: "sexual_abuse",
          investigation_stage: "received",
          lado_referral_made: false,
          child_safe_and_supported: false,
          child_involved: "Child X",
          risk_assessment_completed: false,
          ofsted_notified: false,
        }),
      ];
      const alerts = identifyAllegationAlerts(r);
      const types = alerts.map((a) => a.type);

      const saIdx = types.indexOf("sexual_abuse_allegation");
      const nlrIdx = types.indexOf("no_lado_referral");
      const cnsIdx = types.indexOf("child_not_safe");
      const nraIdx = types.indexOf("no_risk_assessment");
      const onIdx = types.indexOf("ofsted_not_notified");

      expect(saIdx).toBeLessThan(nlrIdx);
      expect(nlrIdx).toBeLessThan(cnsIdx);
      expect(cnsIdx).toBeLessThan(nraIdx);
      expect(nraIdx).toBeLessThan(onIdx);
    });

    it("generates multiple per-record alerts for different records", () => {
      const r = [
        makeRecord({
          id: "a-1",
          allegation_type: "sexual_abuse",
          investigation_stage: "received",
          lado_referral_made: true,
          ofsted_notified: true,
          risk_assessment_completed: true,
        }),
        makeRecord({
          id: "a-2",
          allegation_type: "sexual_abuse",
          investigation_stage: "investigation_ongoing",
          lado_referral_made: true,
          ofsted_notified: true,
          risk_assessment_completed: true,
        }),
      ];
      const alerts = identifyAllegationAlerts(r);
      const sa = alerts.filter((a) => a.type === "sexual_abuse_allegation");
      expect(sa).toHaveLength(2);
    });
  });
});
