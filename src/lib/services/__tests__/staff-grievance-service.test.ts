// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF GRIEVANCE SERVICE TESTS
// Pure-function unit tests for grievance metrics computation, alert
// identification, and constant validation.
// CHR 2015 Reg 33 (employment — grievance procedures),
// Reg 13 (leadership — staff management),
// ACAS Code of Practice (disciplinary and grievance).
//
// Covers: grievance submission, investigation, hearings,
// outcomes, appeals, and resolution timescales.
//
// SCCIF: Leadership & Management — "Staff grievances are handled
// fairly and promptly." "Learning from grievances improves practice."
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi } from "vitest";
import crypto from "crypto";

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => false,
  createServerClient: () => null,
}));

import {
  _testing,
  GRIEVANCE_CATEGORIES,
  GRIEVANCE_STAGES,
  GRIEVANCE_OUTCOMES,
  RESOLUTION_METHODS,
} from "../staff-grievance-service";

import type { StaffGrievance } from "../staff-grievance-service";

const { computeGrievanceMetrics, identifyGrievanceAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Build a minimal StaffGrievance with sensible defaults. */
function makeGrievance(
  overrides: Partial<StaffGrievance> = {},
): StaffGrievance {
  return {
    id: crypto.randomUUID(),
    home_id: "home-1",
    staff_name: "Alice Smith",
    staff_id: "staff-1",
    grievance_date: "2024-06-01",
    grievance_category: "working_conditions",
    grievance_stage: "resolved",
    grievance_outcome: "not_upheld",
    resolution_method: "formal_outcome",
    acknowledged_within_5_days: true,
    hearing_within_28_days:
      "hearing_within_28_days" in (overrides ?? {})
        ? (overrides!.hearing_within_28_days ?? null)
        : true,
    days_to_resolution:
      "days_to_resolution" in (overrides ?? {})
        ? (overrides!.days_to_resolution ?? null)
        : 14,
    investigating_officer: "Officer Jones",
    union_representative_present: false,
    appeal_lodged: false,
    appeal_outcome:
      "appeal_outcome" in (overrides ?? {})
        ? (overrides!.appeal_outcome ?? null)
        : null,
    learning_identified: false,
    learning_details:
      "learning_details" in (overrides ?? {})
        ? (overrides!.learning_details ?? null)
        : null,
    impact_on_children_assessed: true,
    acas_code_followed: true,
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

describe("GRIEVANCE_CATEGORIES", () => {
  it("has exactly 10 entries", () => {
    expect(GRIEVANCE_CATEGORIES).toHaveLength(10);
  });

  it("contains unique category values", () => {
    const values = GRIEVANCE_CATEGORIES.map((c) => c.category);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = GRIEVANCE_CATEGORIES.map((c) => c.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("each entry has a non-empty label", () => {
    for (const c of GRIEVANCE_CATEGORIES) {
      expect(c.label.length).toBeGreaterThan(0);
    }
  });

  it("includes bullying_harassment", () => {
    expect(GRIEVANCE_CATEGORIES.find((c) => c.category === "bullying_harassment")).toBeTruthy();
  });

  it("includes discrimination", () => {
    expect(GRIEVANCE_CATEGORIES.find((c) => c.category === "discrimination")).toBeTruthy();
  });

  it("includes working_conditions", () => {
    expect(GRIEVANCE_CATEGORIES.find((c) => c.category === "working_conditions")).toBeTruthy();
  });

  it("includes pay_benefits", () => {
    expect(GRIEVANCE_CATEGORIES.find((c) => c.category === "pay_benefits")).toBeTruthy();
  });

  it("includes management_conduct", () => {
    expect(GRIEVANCE_CATEGORIES.find((c) => c.category === "management_conduct")).toBeTruthy();
  });

  it("includes workload", () => {
    expect(GRIEVANCE_CATEGORIES.find((c) => c.category === "workload")).toBeTruthy();
  });

  it("includes health_safety", () => {
    expect(GRIEVANCE_CATEGORIES.find((c) => c.category === "health_safety")).toBeTruthy();
  });

  it("includes unfair_treatment", () => {
    expect(GRIEVANCE_CATEGORIES.find((c) => c.category === "unfair_treatment")).toBeTruthy();
  });

  it("includes contractual", () => {
    expect(GRIEVANCE_CATEGORIES.find((c) => c.category === "contractual")).toBeTruthy();
  });

  it("includes other", () => {
    expect(GRIEVANCE_CATEGORIES.find((c) => c.category === "other")).toBeTruthy();
  });
});

describe("GRIEVANCE_STAGES", () => {
  it("has exactly 11 entries", () => {
    expect(GRIEVANCE_STAGES).toHaveLength(11);
  });

  it("contains unique stage values", () => {
    const values = GRIEVANCE_STAGES.map((s) => s.stage);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = GRIEVANCE_STAGES.map((s) => s.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("each entry has a non-empty label", () => {
    for (const s of GRIEVANCE_STAGES) {
      expect(s.label.length).toBeGreaterThan(0);
    }
  });

  it("includes informal_raised", () => {
    expect(GRIEVANCE_STAGES.find((s) => s.stage === "informal_raised")).toBeTruthy();
  });

  it("includes formal_submitted", () => {
    expect(GRIEVANCE_STAGES.find((s) => s.stage === "formal_submitted")).toBeTruthy();
  });

  it("includes acknowledged", () => {
    expect(GRIEVANCE_STAGES.find((s) => s.stage === "acknowledged")).toBeTruthy();
  });

  it("includes investigating", () => {
    expect(GRIEVANCE_STAGES.find((s) => s.stage === "investigating")).toBeTruthy();
  });

  it("includes hearing_scheduled", () => {
    expect(GRIEVANCE_STAGES.find((s) => s.stage === "hearing_scheduled")).toBeTruthy();
  });

  it("includes hearing_held", () => {
    expect(GRIEVANCE_STAGES.find((s) => s.stage === "hearing_held")).toBeTruthy();
  });

  it("includes outcome_issued", () => {
    expect(GRIEVANCE_STAGES.find((s) => s.stage === "outcome_issued")).toBeTruthy();
  });

  it("includes appeal_lodged", () => {
    expect(GRIEVANCE_STAGES.find((s) => s.stage === "appeal_lodged")).toBeTruthy();
  });

  it("includes appeal_heard", () => {
    expect(GRIEVANCE_STAGES.find((s) => s.stage === "appeal_heard")).toBeTruthy();
  });

  it("includes resolved", () => {
    expect(GRIEVANCE_STAGES.find((s) => s.stage === "resolved")).toBeTruthy();
  });

  it("includes withdrawn", () => {
    expect(GRIEVANCE_STAGES.find((s) => s.stage === "withdrawn")).toBeTruthy();
  });
});

describe("GRIEVANCE_OUTCOMES", () => {
  it("has exactly 6 entries", () => {
    expect(GRIEVANCE_OUTCOMES).toHaveLength(6);
  });

  it("contains unique outcome values", () => {
    const values = GRIEVANCE_OUTCOMES.map((o) => o.outcome);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = GRIEVANCE_OUTCOMES.map((o) => o.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("each entry has a non-empty label", () => {
    for (const o of GRIEVANCE_OUTCOMES) {
      expect(o.label.length).toBeGreaterThan(0);
    }
  });

  it("includes upheld", () => {
    expect(GRIEVANCE_OUTCOMES.find((o) => o.outcome === "upheld")).toBeTruthy();
  });

  it("includes partially_upheld", () => {
    expect(GRIEVANCE_OUTCOMES.find((o) => o.outcome === "partially_upheld")).toBeTruthy();
  });

  it("includes not_upheld", () => {
    expect(GRIEVANCE_OUTCOMES.find((o) => o.outcome === "not_upheld")).toBeTruthy();
  });

  it("includes withdrawn", () => {
    expect(GRIEVANCE_OUTCOMES.find((o) => o.outcome === "withdrawn")).toBeTruthy();
  });

  it("includes mediated", () => {
    expect(GRIEVANCE_OUTCOMES.find((o) => o.outcome === "mediated")).toBeTruthy();
  });

  it("includes pending", () => {
    expect(GRIEVANCE_OUTCOMES.find((o) => o.outcome === "pending")).toBeTruthy();
  });
});

describe("RESOLUTION_METHODS", () => {
  it("has exactly 6 entries", () => {
    expect(RESOLUTION_METHODS).toHaveLength(6);
  });

  it("contains unique method values", () => {
    const values = RESOLUTION_METHODS.map((m) => m.method);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = RESOLUTION_METHODS.map((m) => m.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("each entry has a non-empty label", () => {
    for (const m of RESOLUTION_METHODS) {
      expect(m.label.length).toBeGreaterThan(0);
    }
  });

  it("includes formal_outcome", () => {
    expect(RESOLUTION_METHODS.find((m) => m.method === "formal_outcome")).toBeTruthy();
  });

  it("includes mediation", () => {
    expect(RESOLUTION_METHODS.find((m) => m.method === "mediation")).toBeTruthy();
  });

  it("includes informal_resolution", () => {
    expect(RESOLUTION_METHODS.find((m) => m.method === "informal_resolution")).toBeTruthy();
  });

  it("includes withdrawn_by_staff", () => {
    expect(RESOLUTION_METHODS.find((m) => m.method === "withdrawn_by_staff")).toBeTruthy();
  });

  it("includes management_action", () => {
    expect(RESOLUTION_METHODS.find((m) => m.method === "management_action")).toBeTruthy();
  });

  it("includes other", () => {
    expect(RESOLUTION_METHODS.find((m) => m.method === "other")).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. computeGrievanceMetrics
// ═══════════════════════════════════════════════════════════════════════════

describe("computeGrievanceMetrics", () => {
  // ── Empty array ──────────────────────────────────────────────────────
  describe("empty grievances", () => {
    it("returns zero total_grievances", () => {
      expect(computeGrievanceMetrics([]).total_grievances).toBe(0);
    });

    it("returns zero open_grievances", () => {
      expect(computeGrievanceMetrics([]).open_grievances).toBe(0);
    });

    it("returns zero resolved_grievances", () => {
      expect(computeGrievanceMetrics([]).resolved_grievances).toBe(0);
    });

    it("returns zero upheld_count", () => {
      expect(computeGrievanceMetrics([]).upheld_count).toBe(0);
    });

    it("returns zero partially_upheld_count", () => {
      expect(computeGrievanceMetrics([]).partially_upheld_count).toBe(0);
    });

    it("returns zero not_upheld_count", () => {
      expect(computeGrievanceMetrics([]).not_upheld_count).toBe(0);
    });

    it("returns zero appeal_count", () => {
      expect(computeGrievanceMetrics([]).appeal_count).toBe(0);
    });

    it("returns zero acknowledged_rate", () => {
      expect(computeGrievanceMetrics([]).acknowledged_rate).toBeNull();;
    });

    it("returns zero hearing_within_28_days_rate", () => {
      expect(computeGrievanceMetrics([]).hearing_within_28_days_rate).toBeNull();;
    });

    it("returns zero average_days_to_resolution", () => {
      expect(computeGrievanceMetrics([]).average_days_to_resolution).toBeNull();;
    });

    it("returns zero acas_code_followed_rate", () => {
      expect(computeGrievanceMetrics([]).acas_code_followed_rate).toBeNull();;
    });

    it("returns zero learning_identified_rate", () => {
      expect(computeGrievanceMetrics([]).learning_identified_rate).toBeNull();;
    });

    it("returns zero impact_assessed_rate", () => {
      expect(computeGrievanceMetrics([]).impact_assessed_rate).toBeNull();;
    });

    it("returns zero union_representation_rate", () => {
      expect(computeGrievanceMetrics([]).union_representation_rate).toBeNull();;
    });

    it("returns empty by_category", () => {
      expect(computeGrievanceMetrics([]).by_category).toEqual({});
    });

    it("returns empty by_stage", () => {
      expect(computeGrievanceMetrics([]).by_stage).toEqual({});
    });

    it("returns empty by_outcome", () => {
      expect(computeGrievanceMetrics([]).by_outcome).toEqual({});
    });

    it("returns empty by_resolution_method", () => {
      expect(computeGrievanceMetrics([]).by_resolution_method).toEqual({});
    });
  });

  // ── Single record ──────────────────────────────────────────────────
  describe("single grievance", () => {
    const single = [makeGrievance()];

    it("total_grievances is 1", () => {
      expect(computeGrievanceMetrics(single).total_grievances).toBe(1);
    });

    it("open_grievances is 0 for resolved grievance", () => {
      expect(computeGrievanceMetrics(single).open_grievances).toBe(0);
    });

    it("resolved_grievances is 1 for resolved grievance", () => {
      expect(computeGrievanceMetrics(single).resolved_grievances).toBe(1);
    });

    it("upheld_count is 0 for not_upheld grievance", () => {
      expect(computeGrievanceMetrics(single).upheld_count).toBe(0);
    });

    it("not_upheld_count is 1 for not_upheld grievance", () => {
      expect(computeGrievanceMetrics(single).not_upheld_count).toBe(1);
    });

    it("appeal_count is 0 when appeal_lodged is false", () => {
      expect(computeGrievanceMetrics(single).appeal_count).toBe(0);
    });

    it("appeal_count is 1 when appeal_lodged is true", () => {
      const g = [makeGrievance({ appeal_lodged: true })];
      expect(computeGrievanceMetrics(g).appeal_count).toBe(1);
    });

    it("acknowledged_rate is 100 when acknowledged_within_5_days is true", () => {
      expect(computeGrievanceMetrics(single).acknowledged_rate).toBe(100);
    });

    it("hearing_within_28_days_rate is 100 when hearing_within_28_days is true", () => {
      expect(computeGrievanceMetrics(single).hearing_within_28_days_rate).toBe(100);
    });

    it("average_days_to_resolution is 14 for default record", () => {
      expect(computeGrievanceMetrics(single).average_days_to_resolution).toBe(14);
    });

    it("acas_code_followed_rate is 100 when acas_code_followed is true", () => {
      expect(computeGrievanceMetrics(single).acas_code_followed_rate).toBe(100);
    });

    it("learning_identified_rate is 0 when learning_identified is false", () => {
      expect(computeGrievanceMetrics(single).learning_identified_rate).toBe(0);
    });

    it("impact_assessed_rate is 100 when impact_on_children_assessed is true", () => {
      expect(computeGrievanceMetrics(single).impact_assessed_rate).toBe(100);
    });

    it("union_representation_rate is 0 when union_representative_present is false", () => {
      expect(computeGrievanceMetrics(single).union_representation_rate).toBe(0);
    });

    it("by_category groups single record correctly", () => {
      expect(computeGrievanceMetrics(single).by_category).toEqual({ working_conditions: 1 });
    });

    it("by_stage groups single record correctly", () => {
      expect(computeGrievanceMetrics(single).by_stage).toEqual({ resolved: 1 });
    });

    it("by_outcome groups single record correctly", () => {
      expect(computeGrievanceMetrics(single).by_outcome).toEqual({ not_upheld: 1 });
    });

    it("by_resolution_method groups single record correctly", () => {
      expect(computeGrievanceMetrics(single).by_resolution_method).toEqual({ formal_outcome: 1 });
    });
  });

  // ── Multiple records ─────────────────────────────────────────────────
  describe("multiple grievances", () => {
    const records = [
      makeGrievance({
        id: "g-1",
        grievance_category: "bullying_harassment",
        grievance_stage: "investigating",
        grievance_outcome: "upheld",
        resolution_method: "formal_outcome",
        acknowledged_within_5_days: true,
        hearing_within_28_days: true,
        days_to_resolution: 10,
        union_representative_present: true,
        appeal_lodged: true,
        learning_identified: true,
        impact_on_children_assessed: true,
        acas_code_followed: true,
      }),
      makeGrievance({
        id: "g-2",
        grievance_category: "discrimination",
        grievance_stage: "resolved",
        grievance_outcome: "partially_upheld",
        resolution_method: "mediation",
        acknowledged_within_5_days: false,
        hearing_within_28_days: false,
        days_to_resolution: 30,
        union_representative_present: false,
        appeal_lodged: false,
        learning_identified: false,
        impact_on_children_assessed: false,
        acas_code_followed: false,
      }),
      makeGrievance({
        id: "g-3",
        grievance_category: "pay_benefits",
        grievance_stage: "withdrawn",
        grievance_outcome: "withdrawn",
        resolution_method: "withdrawn_by_staff",
        acknowledged_within_5_days: true,
        hearing_within_28_days: null,
        days_to_resolution: null,
        union_representative_present: false,
        appeal_lodged: false,
        learning_identified: false,
        impact_on_children_assessed: false,
        acas_code_followed: true,
      }),
      makeGrievance({
        id: "g-4",
        grievance_category: "workload",
        grievance_stage: "hearing_held",
        grievance_outcome: "not_upheld",
        resolution_method: "management_action",
        acknowledged_within_5_days: true,
        hearing_within_28_days: true,
        days_to_resolution: 25,
        union_representative_present: true,
        appeal_lodged: true,
        learning_identified: true,
        impact_on_children_assessed: true,
        acas_code_followed: true,
      }),
      makeGrievance({
        id: "g-5",
        grievance_category: "working_conditions",
        grievance_stage: "resolved",
        grievance_outcome: "mediated",
        resolution_method: "informal_resolution",
        acknowledged_within_5_days: false,
        hearing_within_28_days: null,
        days_to_resolution: 7,
        union_representative_present: false,
        appeal_lodged: false,
        learning_identified: false,
        impact_on_children_assessed: true,
        acas_code_followed: false,
      }),
    ];

    it("total_grievances is 5", () => {
      expect(computeGrievanceMetrics(records).total_grievances).toBe(5);
    });

    it("open_grievances is 2 (investigating + hearing_held)", () => {
      expect(computeGrievanceMetrics(records).open_grievances).toBe(2);
    });

    it("resolved_grievances is 2", () => {
      expect(computeGrievanceMetrics(records).resolved_grievances).toBe(2);
    });

    it("upheld_count is 1", () => {
      expect(computeGrievanceMetrics(records).upheld_count).toBe(1);
    });

    it("partially_upheld_count is 1", () => {
      expect(computeGrievanceMetrics(records).partially_upheld_count).toBe(1);
    });

    it("not_upheld_count is 1", () => {
      expect(computeGrievanceMetrics(records).not_upheld_count).toBe(1);
    });

    it("appeal_count is 2", () => {
      expect(computeGrievanceMetrics(records).appeal_count).toBe(2);
    });

    it("acknowledged_rate is 60 (3 of 5)", () => {
      expect(computeGrievanceMetrics(records).acknowledged_rate).toBe(60);
    });

    it("hearing_within_28_days_rate is 66.7 (2 of 3 non-null)", () => {
      expect(computeGrievanceMetrics(records).hearing_within_28_days_rate).toBe(66.7);
    });

    it("average_days_to_resolution is 18 ((10+30+25+7)/4)", () => {
      expect(computeGrievanceMetrics(records).average_days_to_resolution).toBe(18);
    });

    it("acas_code_followed_rate is 60 (3 of 5)", () => {
      expect(computeGrievanceMetrics(records).acas_code_followed_rate).toBe(60);
    });

    it("learning_identified_rate is 40 (2 of 5)", () => {
      expect(computeGrievanceMetrics(records).learning_identified_rate).toBe(40);
    });

    it("impact_assessed_rate is 60 (3 of 5)", () => {
      expect(computeGrievanceMetrics(records).impact_assessed_rate).toBe(60);
    });

    it("union_representation_rate is 40 (2 of 5)", () => {
      expect(computeGrievanceMetrics(records).union_representation_rate).toBe(40);
    });

    it("by_category groups correctly", () => {
      expect(computeGrievanceMetrics(records).by_category).toEqual({
        bullying_harassment: 1,
        discrimination: 1,
        pay_benefits: 1,
        workload: 1,
        working_conditions: 1,
      });
    });

    it("by_stage groups correctly", () => {
      expect(computeGrievanceMetrics(records).by_stage).toEqual({
        investigating: 1,
        resolved: 2,
        withdrawn: 1,
        hearing_held: 1,
      });
    });

    it("by_outcome groups correctly", () => {
      expect(computeGrievanceMetrics(records).by_outcome).toEqual({
        upheld: 1,
        partially_upheld: 1,
        withdrawn: 1,
        not_upheld: 1,
        mediated: 1,
      });
    });

    it("by_resolution_method groups correctly", () => {
      expect(computeGrievanceMetrics(records).by_resolution_method).toEqual({
        formal_outcome: 1,
        mediation: 1,
        withdrawn_by_staff: 1,
        management_action: 1,
        informal_resolution: 1,
      });
    });
  });

  // ── open_grievances logic ─────────────────────────────────────────────
  describe("open_grievances logic", () => {
    it("counts informal_raised as open", () => {
      const g = [makeGrievance({ grievance_stage: "informal_raised" })];
      expect(computeGrievanceMetrics(g).open_grievances).toBe(1);
    });

    it("counts formal_submitted as open", () => {
      const g = [makeGrievance({ grievance_stage: "formal_submitted" })];
      expect(computeGrievanceMetrics(g).open_grievances).toBe(1);
    });

    it("counts acknowledged as open", () => {
      const g = [makeGrievance({ grievance_stage: "acknowledged" })];
      expect(computeGrievanceMetrics(g).open_grievances).toBe(1);
    });

    it("counts investigating as open", () => {
      const g = [makeGrievance({ grievance_stage: "investigating" })];
      expect(computeGrievanceMetrics(g).open_grievances).toBe(1);
    });

    it("counts hearing_scheduled as open", () => {
      const g = [makeGrievance({ grievance_stage: "hearing_scheduled" })];
      expect(computeGrievanceMetrics(g).open_grievances).toBe(1);
    });

    it("counts hearing_held as open", () => {
      const g = [makeGrievance({ grievance_stage: "hearing_held" })];
      expect(computeGrievanceMetrics(g).open_grievances).toBe(1);
    });

    it("counts outcome_issued as open", () => {
      const g = [makeGrievance({ grievance_stage: "outcome_issued" })];
      expect(computeGrievanceMetrics(g).open_grievances).toBe(1);
    });

    it("counts appeal_lodged as open", () => {
      const g = [makeGrievance({ grievance_stage: "appeal_lodged" })];
      expect(computeGrievanceMetrics(g).open_grievances).toBe(1);
    });

    it("counts appeal_heard as open", () => {
      const g = [makeGrievance({ grievance_stage: "appeal_heard" })];
      expect(computeGrievanceMetrics(g).open_grievances).toBe(1);
    });

    it("does NOT count resolved as open", () => {
      const g = [makeGrievance({ grievance_stage: "resolved" })];
      expect(computeGrievanceMetrics(g).open_grievances).toBe(0);
    });

    it("does NOT count withdrawn as open", () => {
      const g = [makeGrievance({ grievance_stage: "withdrawn" })];
      expect(computeGrievanceMetrics(g).open_grievances).toBe(0);
    });

    it("counts multiple open stages correctly", () => {
      const g = [
        makeGrievance({ id: "1", grievance_stage: "formal_submitted" }),
        makeGrievance({ id: "2", grievance_stage: "investigating" }),
        makeGrievance({ id: "3", grievance_stage: "resolved" }),
        makeGrievance({ id: "4", grievance_stage: "withdrawn" }),
        makeGrievance({ id: "5", grievance_stage: "appeal_lodged" }),
      ];
      expect(computeGrievanceMetrics(g).open_grievances).toBe(3);
    });
  });

  // ── hearing_within_28_days_rate ──────────────────────────────────────
  describe("hearing_within_28_days_rate", () => {
    it("is 0 when all hearing_within_28_days are null", () => {
      const g = [
        makeGrievance({ id: "1", hearing_within_28_days: null }),
        makeGrievance({ id: "2", hearing_within_28_days: null }),
      ];
      expect(computeGrievanceMetrics(g).hearing_within_28_days_rate).toBeNull();;
    });

    it("is 100 when all non-null are true", () => {
      const g = [
        makeGrievance({ id: "1", hearing_within_28_days: true }),
        makeGrievance({ id: "2", hearing_within_28_days: true }),
        makeGrievance({ id: "3", hearing_within_28_days: null }),
      ];
      expect(computeGrievanceMetrics(g).hearing_within_28_days_rate).toBe(100);
    });

    it("is 0 when all non-null are false", () => {
      const g = [
        makeGrievance({ id: "1", hearing_within_28_days: false }),
        makeGrievance({ id: "2", hearing_within_28_days: false }),
      ];
      expect(computeGrievanceMetrics(g).hearing_within_28_days_rate).toBe(0);
    });

    it("is 50 for 1 true 1 false", () => {
      const g = [
        makeGrievance({ id: "1", hearing_within_28_days: true }),
        makeGrievance({ id: "2", hearing_within_28_days: false }),
      ];
      expect(computeGrievanceMetrics(g).hearing_within_28_days_rate).toBe(50);
    });

    it("excludes null from denominator", () => {
      const g = [
        makeGrievance({ id: "1", hearing_within_28_days: true }),
        makeGrievance({ id: "2", hearing_within_28_days: null }),
        makeGrievance({ id: "3", hearing_within_28_days: null }),
      ];
      expect(computeGrievanceMetrics(g).hearing_within_28_days_rate).toBe(100);
    });

    it("rounds correctly for 1 of 3 (33.3)", () => {
      const g = [
        makeGrievance({ id: "1", hearing_within_28_days: true }),
        makeGrievance({ id: "2", hearing_within_28_days: false }),
        makeGrievance({ id: "3", hearing_within_28_days: false }),
      ];
      expect(computeGrievanceMetrics(g).hearing_within_28_days_rate).toBe(33.3);
    });

    it("rounds correctly for 2 of 3 (66.7)", () => {
      const g = [
        makeGrievance({ id: "1", hearing_within_28_days: true }),
        makeGrievance({ id: "2", hearing_within_28_days: true }),
        makeGrievance({ id: "3", hearing_within_28_days: false }),
      ];
      expect(computeGrievanceMetrics(g).hearing_within_28_days_rate).toBe(66.7);
    });
  });

  // ── average_days_to_resolution ────────────────────────────────────────
  describe("average_days_to_resolution", () => {
    it("is 0 when all days_to_resolution are null", () => {
      const g = [
        makeGrievance({ id: "1", days_to_resolution: null }),
        makeGrievance({ id: "2", days_to_resolution: null }),
      ];
      expect(computeGrievanceMetrics(g).average_days_to_resolution).toBeNull();;
    });

    it("returns the single value when only one record has days", () => {
      const g = [makeGrievance({ days_to_resolution: 21 })];
      expect(computeGrievanceMetrics(g).average_days_to_resolution).toBe(21);
    });

    it("averages multiple values correctly", () => {
      const g = [
        makeGrievance({ id: "1", days_to_resolution: 10 }),
        makeGrievance({ id: "2", days_to_resolution: 20 }),
      ];
      expect(computeGrievanceMetrics(g).average_days_to_resolution).toBe(15);
    });

    it("excludes null from average", () => {
      const g = [
        makeGrievance({ id: "1", days_to_resolution: 10 }),
        makeGrievance({ id: "2", days_to_resolution: null }),
        makeGrievance({ id: "3", days_to_resolution: 20 }),
      ];
      expect(computeGrievanceMetrics(g).average_days_to_resolution).toBe(15);
    });

    it("rounds to one decimal place", () => {
      const g = [
        makeGrievance({ id: "1", days_to_resolution: 10 }),
        makeGrievance({ id: "2", days_to_resolution: 20 }),
        makeGrievance({ id: "3", days_to_resolution: 30 }),
      ];
      expect(computeGrievanceMetrics(g).average_days_to_resolution).toBe(20);
    });

    it("rounds correctly for non-round average (7.5)", () => {
      const g = [
        makeGrievance({ id: "1", days_to_resolution: 7 }),
        makeGrievance({ id: "2", days_to_resolution: 8 }),
      ];
      expect(computeGrievanceMetrics(g).average_days_to_resolution).toBe(7.5);
    });

    it("rounds correctly for repeating decimal (10.7)", () => {
      const g = [
        makeGrievance({ id: "1", days_to_resolution: 5 }),
        makeGrievance({ id: "2", days_to_resolution: 10 }),
        makeGrievance({ id: "3", days_to_resolution: 17 }),
      ];
      // (5 + 10 + 17) / 3 = 10.666... -> 10.7
      expect(computeGrievanceMetrics(g).average_days_to_resolution).toBe(10.7);
    });
  });

  // ── acknowledged_rate ────────────────────────────────────────────────
  describe("acknowledged_rate", () => {
    it("is 100 when all acknowledged within 5 days", () => {
      const g = [
        makeGrievance({ id: "1", acknowledged_within_5_days: true }),
        makeGrievance({ id: "2", acknowledged_within_5_days: true }),
      ];
      expect(computeGrievanceMetrics(g).acknowledged_rate).toBe(100);
    });

    it("is 0 when none acknowledged within 5 days", () => {
      const g = [
        makeGrievance({ id: "1", acknowledged_within_5_days: false }),
        makeGrievance({ id: "2", acknowledged_within_5_days: false }),
      ];
      expect(computeGrievanceMetrics(g).acknowledged_rate).toBe(0);
    });

    it("is 50 for 1 of 2", () => {
      const g = [
        makeGrievance({ id: "1", acknowledged_within_5_days: true }),
        makeGrievance({ id: "2", acknowledged_within_5_days: false }),
      ];
      expect(computeGrievanceMetrics(g).acknowledged_rate).toBe(50);
    });

    it("rounds correctly for 1 of 3 (33.3)", () => {
      const g = [
        makeGrievance({ id: "1", acknowledged_within_5_days: true }),
        makeGrievance({ id: "2", acknowledged_within_5_days: false }),
        makeGrievance({ id: "3", acknowledged_within_5_days: false }),
      ];
      expect(computeGrievanceMetrics(g).acknowledged_rate).toBe(33.3);
    });

    it("rounds correctly for 2 of 3 (66.7)", () => {
      const g = [
        makeGrievance({ id: "1", acknowledged_within_5_days: true }),
        makeGrievance({ id: "2", acknowledged_within_5_days: true }),
        makeGrievance({ id: "3", acknowledged_within_5_days: false }),
      ];
      expect(computeGrievanceMetrics(g).acknowledged_rate).toBe(66.7);
    });
  });

  // ── acas_code_followed_rate ──────────────────────────────────────────
  describe("acas_code_followed_rate", () => {
    it("is 100 when all follow ACAS code", () => {
      const g = [
        makeGrievance({ id: "1", acas_code_followed: true }),
        makeGrievance({ id: "2", acas_code_followed: true }),
      ];
      expect(computeGrievanceMetrics(g).acas_code_followed_rate).toBe(100);
    });

    it("is 0 when none follow ACAS code", () => {
      const g = [
        makeGrievance({ id: "1", acas_code_followed: false }),
        makeGrievance({ id: "2", acas_code_followed: false }),
      ];
      expect(computeGrievanceMetrics(g).acas_code_followed_rate).toBe(0);
    });

    it("rounds correctly for 1 of 3 (33.3)", () => {
      const g = [
        makeGrievance({ id: "1", acas_code_followed: true }),
        makeGrievance({ id: "2", acas_code_followed: false }),
        makeGrievance({ id: "3", acas_code_followed: false }),
      ];
      expect(computeGrievanceMetrics(g).acas_code_followed_rate).toBe(33.3);
    });
  });

  // ── learning_identified_rate ──────────────────────────────────────────
  describe("learning_identified_rate", () => {
    it("is 100 when all have learning identified", () => {
      const g = [
        makeGrievance({ id: "1", learning_identified: true }),
        makeGrievance({ id: "2", learning_identified: true }),
      ];
      expect(computeGrievanceMetrics(g).learning_identified_rate).toBe(100);
    });

    it("is 0 when none have learning identified", () => {
      const g = [
        makeGrievance({ id: "1", learning_identified: false }),
        makeGrievance({ id: "2", learning_identified: false }),
      ];
      expect(computeGrievanceMetrics(g).learning_identified_rate).toBe(0);
    });

    it("rounds correctly for 1 of 3 (33.3)", () => {
      const g = [
        makeGrievance({ id: "1", learning_identified: true }),
        makeGrievance({ id: "2", learning_identified: false }),
        makeGrievance({ id: "3", learning_identified: false }),
      ];
      expect(computeGrievanceMetrics(g).learning_identified_rate).toBe(33.3);
    });
  });

  // ── impact_assessed_rate ──────────────────────────────────────────────
  describe("impact_assessed_rate", () => {
    it("is 100 when all have impact assessed", () => {
      const g = [
        makeGrievance({ id: "1", impact_on_children_assessed: true }),
        makeGrievance({ id: "2", impact_on_children_assessed: true }),
      ];
      expect(computeGrievanceMetrics(g).impact_assessed_rate).toBe(100);
    });

    it("is 0 when none have impact assessed", () => {
      const g = [
        makeGrievance({ id: "1", impact_on_children_assessed: false }),
        makeGrievance({ id: "2", impact_on_children_assessed: false }),
      ];
      expect(computeGrievanceMetrics(g).impact_assessed_rate).toBe(0);
    });

    it("rounds correctly for 2 of 3 (66.7)", () => {
      const g = [
        makeGrievance({ id: "1", impact_on_children_assessed: true }),
        makeGrievance({ id: "2", impact_on_children_assessed: true }),
        makeGrievance({ id: "3", impact_on_children_assessed: false }),
      ];
      expect(computeGrievanceMetrics(g).impact_assessed_rate).toBe(66.7);
    });
  });

  // ── union_representation_rate ─────────────────────────────────────────
  describe("union_representation_rate", () => {
    it("is 100 when all have union representation", () => {
      const g = [
        makeGrievance({ id: "1", union_representative_present: true }),
        makeGrievance({ id: "2", union_representative_present: true }),
      ];
      expect(computeGrievanceMetrics(g).union_representation_rate).toBe(100);
    });

    it("is 0 when none have union representation", () => {
      const g = [
        makeGrievance({ id: "1", union_representative_present: false }),
        makeGrievance({ id: "2", union_representative_present: false }),
      ];
      expect(computeGrievanceMetrics(g).union_representation_rate).toBe(0);
    });

    it("rounds correctly for 1 of 3 (33.3)", () => {
      const g = [
        makeGrievance({ id: "1", union_representative_present: true }),
        makeGrievance({ id: "2", union_representative_present: false }),
        makeGrievance({ id: "3", union_representative_present: false }),
      ];
      expect(computeGrievanceMetrics(g).union_representation_rate).toBe(33.3);
    });
  });

  // ── Outcome counts ────────────────────────────────────────────────────
  describe("outcome counts", () => {
    it("counts only upheld outcomes", () => {
      const g = [
        makeGrievance({ id: "1", grievance_outcome: "upheld" }),
        makeGrievance({ id: "2", grievance_outcome: "upheld" }),
        makeGrievance({ id: "3", grievance_outcome: "not_upheld" }),
      ];
      expect(computeGrievanceMetrics(g).upheld_count).toBe(2);
    });

    it("counts only partially_upheld outcomes", () => {
      const g = [
        makeGrievance({ id: "1", grievance_outcome: "partially_upheld" }),
        makeGrievance({ id: "2", grievance_outcome: "partially_upheld" }),
        makeGrievance({ id: "3", grievance_outcome: "upheld" }),
      ];
      expect(computeGrievanceMetrics(g).partially_upheld_count).toBe(2);
    });

    it("counts only not_upheld outcomes", () => {
      const g = [
        makeGrievance({ id: "1", grievance_outcome: "not_upheld" }),
        makeGrievance({ id: "2", grievance_outcome: "not_upheld" }),
        makeGrievance({ id: "3", grievance_outcome: "upheld" }),
      ];
      expect(computeGrievanceMetrics(g).not_upheld_count).toBe(2);
    });

    it("returns zero for absent outcome types", () => {
      const g = [
        makeGrievance({ id: "1", grievance_outcome: "pending" }),
        makeGrievance({ id: "2", grievance_outcome: "withdrawn" }),
      ];
      const m = computeGrievanceMetrics(g);
      expect(m.upheld_count).toBe(0);
      expect(m.partially_upheld_count).toBe(0);
      expect(m.not_upheld_count).toBe(0);
    });
  });

  // ── by_ breakdown maps ────────────────────────────────────────────────
  describe("by_ breakdown maps", () => {
    it("by_category handles multiple categories", () => {
      const g = [
        makeGrievance({ id: "1", grievance_category: "bullying_harassment" }),
        makeGrievance({ id: "2", grievance_category: "bullying_harassment" }),
        makeGrievance({ id: "3", grievance_category: "discrimination" }),
        makeGrievance({ id: "4", grievance_category: "pay_benefits" }),
      ];
      expect(computeGrievanceMetrics(g).by_category).toEqual({
        bullying_harassment: 2,
        discrimination: 1,
        pay_benefits: 1,
      });
    });

    it("by_stage handles multiple stages", () => {
      const g = [
        makeGrievance({ id: "1", grievance_stage: "investigating" }),
        makeGrievance({ id: "2", grievance_stage: "investigating" }),
        makeGrievance({ id: "3", grievance_stage: "resolved" }),
        makeGrievance({ id: "4", grievance_stage: "withdrawn" }),
      ];
      expect(computeGrievanceMetrics(g).by_stage).toEqual({
        investigating: 2,
        resolved: 1,
        withdrawn: 1,
      });
    });

    it("by_outcome handles all outcomes present", () => {
      const g = [
        makeGrievance({ id: "1", grievance_outcome: "upheld" }),
        makeGrievance({ id: "2", grievance_outcome: "partially_upheld" }),
        makeGrievance({ id: "3", grievance_outcome: "not_upheld" }),
        makeGrievance({ id: "4", grievance_outcome: "withdrawn" }),
        makeGrievance({ id: "5", grievance_outcome: "mediated" }),
        makeGrievance({ id: "6", grievance_outcome: "pending" }),
      ];
      expect(computeGrievanceMetrics(g).by_outcome).toEqual({
        upheld: 1,
        partially_upheld: 1,
        not_upheld: 1,
        withdrawn: 1,
        mediated: 1,
        pending: 1,
      });
    });

    it("by_resolution_method handles multiple methods", () => {
      const g = [
        makeGrievance({ id: "1", resolution_method: "formal_outcome" }),
        makeGrievance({ id: "2", resolution_method: "formal_outcome" }),
        makeGrievance({ id: "3", resolution_method: "mediation" }),
      ];
      expect(computeGrievanceMetrics(g).by_resolution_method).toEqual({
        formal_outcome: 2,
        mediation: 1,
      });
    });
  });

  // ── Rate rounding consistency ──────────────────────────────────────────
  describe("rate rounding consistency", () => {
    it("all rates use Math.round(value * 1000) / 10 formula", () => {
      const g = [
        makeGrievance({
          id: "1",
          acknowledged_within_5_days: true,
          hearing_within_28_days: true,
          acas_code_followed: true,
          learning_identified: true,
          impact_on_children_assessed: true,
          union_representative_present: true,
        }),
        makeGrievance({
          id: "2",
          acknowledged_within_5_days: true,
          hearing_within_28_days: true,
          acas_code_followed: true,
          learning_identified: true,
          impact_on_children_assessed: true,
          union_representative_present: true,
        }),
        makeGrievance({
          id: "3",
          acknowledged_within_5_days: false,
          hearing_within_28_days: false,
          acas_code_followed: false,
          learning_identified: false,
          impact_on_children_assessed: false,
          union_representative_present: false,
        }),
      ];
      const m = computeGrievanceMetrics(g);
      // 2/3 = 66.7
      expect(m.acknowledged_rate).toBe(66.7);
      expect(m.hearing_within_28_days_rate).toBe(66.7);
      expect(m.acas_code_followed_rate).toBe(66.7);
      expect(m.learning_identified_rate).toBe(66.7);
      expect(m.impact_assessed_rate).toBe(66.7);
      expect(m.union_representation_rate).toBe(66.7);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. identifyGrievanceAlerts
// ═══════════════════════════════════════════════════════════════════════════

describe("identifyGrievanceAlerts", () => {
  // ── No alerts ──────────────────────────────────────────────────────
  describe("no alerts scenario", () => {
    it("returns empty array for empty grievances", () => {
      expect(identifyGrievanceAlerts([])).toEqual([]);
    });

    it("returns empty array when everything is well-managed", () => {
      const g = [
        makeGrievance({
          id: "g-1",
          grievance_category: "working_conditions",
          grievance_stage: "resolved",
          acknowledged_within_5_days: true,
          acas_code_followed: true,
          impact_on_children_assessed: true,
        }),
      ];
      expect(identifyGrievanceAlerts(g)).toEqual([]);
    });

    it("returns empty for resolved bullying_harassment grievance", () => {
      const g = [
        makeGrievance({
          id: "g-1",
          grievance_category: "bullying_harassment",
          grievance_stage: "resolved",
          acknowledged_within_5_days: true,
          acas_code_followed: true,
          impact_on_children_assessed: true,
        }),
      ];
      expect(identifyGrievanceAlerts(g)).toEqual([]);
    });

    it("returns empty for withdrawn discrimination grievance", () => {
      const g = [
        makeGrievance({
          id: "g-1",
          grievance_category: "discrimination",
          grievance_stage: "withdrawn",
          acknowledged_within_5_days: true,
          acas_code_followed: true,
          impact_on_children_assessed: true,
        }),
      ];
      expect(identifyGrievanceAlerts(g)).toEqual([]);
    });
  });

  // ── serious_grievance alert (critical) ────────────────────────────
  describe("serious_grievance alert", () => {
    it("fires for bullying_harassment with stage=investigating", () => {
      const g = [
        makeGrievance({
          id: "g-1",
          grievance_category: "bullying_harassment",
          grievance_stage: "investigating",
          staff_name: "Bob",
          acknowledged_within_5_days: true,
          acas_code_followed: true,
          impact_on_children_assessed: true,
        }),
      ];
      const alerts = identifyGrievanceAlerts(g);
      const sg = alerts.find((a) => a.type === "serious_grievance");
      expect(sg).toBeTruthy();
    });

    it("fires for discrimination with stage=formal_submitted", () => {
      const g = [
        makeGrievance({
          id: "g-1",
          grievance_category: "discrimination",
          grievance_stage: "formal_submitted",
          staff_name: "Carol",
          acknowledged_within_5_days: true,
          acas_code_followed: true,
          impact_on_children_assessed: true,
        }),
      ];
      const alerts = identifyGrievanceAlerts(g);
      expect(alerts.find((a) => a.type === "serious_grievance")).toBeTruthy();
    });

    it("fires for bullying_harassment with stage=informal_raised", () => {
      const g = [
        makeGrievance({
          id: "g-1",
          grievance_category: "bullying_harassment",
          grievance_stage: "informal_raised",
          staff_name: "Dave",
          acknowledged_within_5_days: true,
          acas_code_followed: true,
          impact_on_children_assessed: true,
        }),
      ];
      const alerts = identifyGrievanceAlerts(g);
      expect(alerts.find((a) => a.type === "serious_grievance")).toBeTruthy();
    });

    it("fires for discrimination with stage=hearing_scheduled", () => {
      const g = [
        makeGrievance({
          id: "g-1",
          grievance_category: "discrimination",
          grievance_stage: "hearing_scheduled",
          staff_name: "Eve",
          acknowledged_within_5_days: true,
          acas_code_followed: true,
          impact_on_children_assessed: true,
        }),
      ];
      const alerts = identifyGrievanceAlerts(g);
      expect(alerts.find((a) => a.type === "serious_grievance")).toBeTruthy();
    });

    it("fires for bullying_harassment with stage=appeal_lodged", () => {
      const g = [
        makeGrievance({
          id: "g-1",
          grievance_category: "bullying_harassment",
          grievance_stage: "appeal_lodged",
          staff_name: "Frank",
          acknowledged_within_5_days: true,
          acas_code_followed: true,
          impact_on_children_assessed: true,
        }),
      ];
      const alerts = identifyGrievanceAlerts(g);
      expect(alerts.find((a) => a.type === "serious_grievance")).toBeTruthy();
    });

    it("has critical severity", () => {
      const g = [
        makeGrievance({
          id: "g-1",
          grievance_category: "bullying_harassment",
          grievance_stage: "investigating",
          staff_name: "Bob",
          acknowledged_within_5_days: true,
          acas_code_followed: true,
          impact_on_children_assessed: true,
        }),
      ];
      const alerts = identifyGrievanceAlerts(g);
      const sg = alerts.find((a) => a.type === "serious_grievance")!;
      expect(sg.severity).toBe("critical");
    });

    it("uses the record id as alert id", () => {
      const g = [
        makeGrievance({
          id: "g-42",
          grievance_category: "discrimination",
          grievance_stage: "investigating",
          staff_name: "Grace",
          acknowledged_within_5_days: true,
          acas_code_followed: true,
          impact_on_children_assessed: true,
        }),
      ];
      const alerts = identifyGrievanceAlerts(g);
      const sg = alerts.find((a) => a.type === "serious_grievance")!;
      expect(sg.id).toBe("g-42");
    });

    it("message contains category with underscores replaced by spaces", () => {
      const g = [
        makeGrievance({
          id: "g-1",
          grievance_category: "bullying_harassment",
          grievance_stage: "investigating",
          staff_name: "Bob",
          acknowledged_within_5_days: true,
          acas_code_followed: true,
          impact_on_children_assessed: true,
        }),
      ];
      const alerts = identifyGrievanceAlerts(g);
      const sg = alerts.find((a) => a.type === "serious_grievance")!;
      expect(sg.message).toContain("bullying harassment");
    });

    it("message contains staff_name", () => {
      const g = [
        makeGrievance({
          id: "g-1",
          grievance_category: "discrimination",
          grievance_stage: "investigating",
          staff_name: "Harriet Jones",
          acknowledged_within_5_days: true,
          acas_code_followed: true,
          impact_on_children_assessed: true,
        }),
      ];
      const alerts = identifyGrievanceAlerts(g);
      const sg = alerts.find((a) => a.type === "serious_grievance")!;
      expect(sg.message).toContain("Harriet Jones");
    });

    it("does NOT fire for bullying_harassment with stage=resolved", () => {
      const g = [
        makeGrievance({
          id: "g-1",
          grievance_category: "bullying_harassment",
          grievance_stage: "resolved",
          staff_name: "Bob",
          acknowledged_within_5_days: true,
          acas_code_followed: true,
          impact_on_children_assessed: true,
        }),
      ];
      const alerts = identifyGrievanceAlerts(g);
      expect(alerts.find((a) => a.type === "serious_grievance")).toBeUndefined();
    });

    it("does NOT fire for discrimination with stage=withdrawn", () => {
      const g = [
        makeGrievance({
          id: "g-1",
          grievance_category: "discrimination",
          grievance_stage: "withdrawn",
          staff_name: "Carol",
          acknowledged_within_5_days: true,
          acas_code_followed: true,
          impact_on_children_assessed: true,
        }),
      ];
      const alerts = identifyGrievanceAlerts(g);
      expect(alerts.find((a) => a.type === "serious_grievance")).toBeUndefined();
    });

    it("does NOT fire for non-serious category even if open", () => {
      const g = [
        makeGrievance({
          id: "g-1",
          grievance_category: "working_conditions",
          grievance_stage: "investigating",
          staff_name: "Bob",
          acknowledged_within_5_days: true,
          acas_code_followed: true,
          impact_on_children_assessed: true,
        }),
      ];
      const alerts = identifyGrievanceAlerts(g);
      expect(alerts.find((a) => a.type === "serious_grievance")).toBeUndefined();
    });

    it("does NOT fire for pay_benefits category even if open", () => {
      const g = [
        makeGrievance({
          id: "g-1",
          grievance_category: "pay_benefits",
          grievance_stage: "investigating",
          staff_name: "Bob",
          acknowledged_within_5_days: true,
          acas_code_followed: true,
          impact_on_children_assessed: true,
        }),
      ];
      const alerts = identifyGrievanceAlerts(g);
      expect(alerts.find((a) => a.type === "serious_grievance")).toBeUndefined();
    });

    it("fires per record for multiple active serious grievances", () => {
      const g = [
        makeGrievance({
          id: "g-1",
          grievance_category: "bullying_harassment",
          grievance_stage: "investigating",
          staff_name: "Alice",
          acknowledged_within_5_days: true,
          acas_code_followed: true,
          impact_on_children_assessed: true,
        }),
        makeGrievance({
          id: "g-2",
          grievance_category: "discrimination",
          grievance_stage: "hearing_held",
          staff_name: "Bob",
          acknowledged_within_5_days: true,
          acas_code_followed: true,
          impact_on_children_assessed: true,
        }),
      ];
      const alerts = identifyGrievanceAlerts(g);
      const sg = alerts.filter((a) => a.type === "serious_grievance");
      expect(sg).toHaveLength(2);
    });

    it("fires only for qualifying records among mixed set", () => {
      const g = [
        makeGrievance({
          id: "g-1",
          grievance_category: "bullying_harassment",
          grievance_stage: "investigating",
          staff_name: "Alice",
          acknowledged_within_5_days: true,
          acas_code_followed: true,
          impact_on_children_assessed: true,
        }),
        makeGrievance({
          id: "g-2",
          grievance_category: "bullying_harassment",
          grievance_stage: "resolved",
          staff_name: "Bob",
          acknowledged_within_5_days: true,
          acas_code_followed: true,
          impact_on_children_assessed: true,
        }),
        makeGrievance({
          id: "g-3",
          grievance_category: "working_conditions",
          grievance_stage: "investigating",
          staff_name: "Carol",
          acknowledged_within_5_days: true,
          acas_code_followed: true,
          impact_on_children_assessed: true,
        }),
      ];
      const alerts = identifyGrievanceAlerts(g);
      const sg = alerts.filter((a) => a.type === "serious_grievance");
      expect(sg).toHaveLength(1);
      expect(sg[0].id).toBe("g-1");
    });
  });

  // ── acas_not_followed alert (high) ─────────────────────────────────
  describe("acas_not_followed alert", () => {
    it("fires when 1 formal grievance does not follow ACAS code", () => {
      const g = [
        makeGrievance({
          id: "g-1",
          acas_code_followed: false,
          grievance_stage: "investigating",
          acknowledged_within_5_days: true,
          impact_on_children_assessed: true,
        }),
      ];
      const alerts = identifyGrievanceAlerts(g);
      const acas = alerts.find((a) => a.type === "acas_not_followed");
      expect(acas).toBeTruthy();
    });

    it("has high severity", () => {
      const g = [
        makeGrievance({
          id: "g-1",
          acas_code_followed: false,
          grievance_stage: "investigating",
          acknowledged_within_5_days: true,
          impact_on_children_assessed: true,
        }),
      ];
      const alerts = identifyGrievanceAlerts(g);
      const acas = alerts.find((a) => a.type === "acas_not_followed")!;
      expect(acas.severity).toBe("high");
    });

    it("has id acas_not_followed", () => {
      const g = [
        makeGrievance({
          id: "g-1",
          acas_code_followed: false,
          grievance_stage: "investigating",
          acknowledged_within_5_days: true,
          impact_on_children_assessed: true,
        }),
      ];
      const alerts = identifyGrievanceAlerts(g);
      const acas = alerts.find((a) => a.type === "acas_not_followed")!;
      expect(acas.id).toBe("acas_not_followed");
    });

    it("message uses singular for exactly 1", () => {
      const g = [
        makeGrievance({
          id: "g-1",
          acas_code_followed: false,
          grievance_stage: "investigating",
          acknowledged_within_5_days: true,
          impact_on_children_assessed: true,
        }),
      ];
      const alerts = identifyGrievanceAlerts(g);
      const acas = alerts.find((a) => a.type === "acas_not_followed")!;
      expect(acas.message).toContain("1 grievance");
      expect(acas.message).not.toContain("grievances");
    });

    it("message uses plural for 2", () => {
      const g = [
        makeGrievance({ id: "g-1", acas_code_followed: false, grievance_stage: "investigating", acknowledged_within_5_days: true, impact_on_children_assessed: true }),
        makeGrievance({ id: "g-2", acas_code_followed: false, grievance_stage: "hearing_held", acknowledged_within_5_days: true, impact_on_children_assessed: true }),
      ];
      const alerts = identifyGrievanceAlerts(g);
      const acas = alerts.find((a) => a.type === "acas_not_followed")!;
      expect(acas.message).toContain("grievances");
    });

    it("message contains count", () => {
      const g = [
        makeGrievance({ id: "g-1", acas_code_followed: false, grievance_stage: "investigating", acknowledged_within_5_days: true, impact_on_children_assessed: true }),
        makeGrievance({ id: "g-2", acas_code_followed: false, grievance_stage: "hearing_held", acknowledged_within_5_days: true, impact_on_children_assessed: true }),
        makeGrievance({ id: "g-3", acas_code_followed: false, grievance_stage: "formal_submitted", acknowledged_within_5_days: true, impact_on_children_assessed: true }),
      ];
      const alerts = identifyGrievanceAlerts(g);
      const acas = alerts.find((a) => a.type === "acas_not_followed")!;
      expect(acas.message).toContain("3");
    });

    it("excludes informal_raised from count", () => {
      const g = [
        makeGrievance({
          id: "g-1",
          acas_code_followed: false,
          grievance_stage: "informal_raised",
          acknowledged_within_5_days: true,
          impact_on_children_assessed: true,
        }),
      ];
      const alerts = identifyGrievanceAlerts(g);
      expect(alerts.find((a) => a.type === "acas_not_followed")).toBeUndefined();
    });

    it("excludes withdrawn from count", () => {
      const g = [
        makeGrievance({
          id: "g-1",
          acas_code_followed: false,
          grievance_stage: "withdrawn",
          acknowledged_within_5_days: true,
          impact_on_children_assessed: true,
        }),
      ];
      const alerts = identifyGrievanceAlerts(g);
      expect(alerts.find((a) => a.type === "acas_not_followed")).toBeUndefined();
    });

    it("does NOT fire when all follow ACAS code", () => {
      const g = [
        makeGrievance({ id: "g-1", acas_code_followed: true, grievance_stage: "investigating", acknowledged_within_5_days: true, impact_on_children_assessed: true }),
        makeGrievance({ id: "g-2", acas_code_followed: true, grievance_stage: "resolved", acknowledged_within_5_days: true, impact_on_children_assessed: true }),
      ];
      const alerts = identifyGrievanceAlerts(g);
      expect(alerts.find((a) => a.type === "acas_not_followed")).toBeUndefined();
    });

    it("counts correctly in mixed set", () => {
      const g = [
        makeGrievance({ id: "g-1", acas_code_followed: false, grievance_stage: "investigating", acknowledged_within_5_days: true, impact_on_children_assessed: true }),
        makeGrievance({ id: "g-2", acas_code_followed: true, grievance_stage: "investigating", acknowledged_within_5_days: true, impact_on_children_assessed: true }),
        makeGrievance({ id: "g-3", acas_code_followed: false, grievance_stage: "withdrawn", acknowledged_within_5_days: true, impact_on_children_assessed: true }),
        makeGrievance({ id: "g-4", acas_code_followed: false, grievance_stage: "informal_raised", acknowledged_within_5_days: true, impact_on_children_assessed: true }),
        makeGrievance({ id: "g-5", acas_code_followed: false, grievance_stage: "resolved", acknowledged_within_5_days: true, impact_on_children_assessed: true }),
      ];
      const alerts = identifyGrievanceAlerts(g);
      const acas = alerts.find((a) => a.type === "acas_not_followed")!;
      // g-1 and g-5 count (g-3 excluded=withdrawn, g-4 excluded=informal_raised)
      expect(acas.message).toContain("2");
    });
  });

  // ── late_acknowledgement alert (high) ─────────────────────────────
  describe("late_acknowledgement alert", () => {
    it("fires when 1 grievance not acknowledged within 5 days (non-withdrawn)", () => {
      const g = [
        makeGrievance({
          id: "g-1",
          acknowledged_within_5_days: false,
          grievance_stage: "investigating",
          acas_code_followed: true,
          impact_on_children_assessed: true,
        }),
      ];
      const alerts = identifyGrievanceAlerts(g);
      const la = alerts.find((a) => a.type === "late_acknowledgement");
      expect(la).toBeTruthy();
    });

    it("has high severity", () => {
      const g = [
        makeGrievance({
          id: "g-1",
          acknowledged_within_5_days: false,
          grievance_stage: "investigating",
          acas_code_followed: true,
          impact_on_children_assessed: true,
        }),
      ];
      const alerts = identifyGrievanceAlerts(g);
      const la = alerts.find((a) => a.type === "late_acknowledgement")!;
      expect(la.severity).toBe("high");
    });

    it("has id late_acknowledgement", () => {
      const g = [
        makeGrievance({
          id: "g-1",
          acknowledged_within_5_days: false,
          grievance_stage: "investigating",
          acas_code_followed: true,
          impact_on_children_assessed: true,
        }),
      ];
      const alerts = identifyGrievanceAlerts(g);
      const la = alerts.find((a) => a.type === "late_acknowledgement")!;
      expect(la.id).toBe("late_acknowledgement");
    });

    it("message uses singular for exactly 1", () => {
      const g = [
        makeGrievance({
          id: "g-1",
          acknowledged_within_5_days: false,
          grievance_stage: "resolved",
          acas_code_followed: true,
          impact_on_children_assessed: true,
        }),
      ];
      const alerts = identifyGrievanceAlerts(g);
      const la = alerts.find((a) => a.type === "late_acknowledgement")!;
      expect(la.message).toContain("grievance was");
    });

    it("message uses plural for 2", () => {
      const g = [
        makeGrievance({ id: "g-1", acknowledged_within_5_days: false, grievance_stage: "resolved", acas_code_followed: true, impact_on_children_assessed: true }),
        makeGrievance({ id: "g-2", acknowledged_within_5_days: false, grievance_stage: "investigating", acas_code_followed: true, impact_on_children_assessed: true }),
      ];
      const alerts = identifyGrievanceAlerts(g);
      const la = alerts.find((a) => a.type === "late_acknowledgement")!;
      expect(la.message).toContain("grievances were");
    });

    it("message contains count", () => {
      const g = [
        makeGrievance({ id: "g-1", acknowledged_within_5_days: false, grievance_stage: "resolved", acas_code_followed: true, impact_on_children_assessed: true }),
        makeGrievance({ id: "g-2", acknowledged_within_5_days: false, grievance_stage: "investigating", acas_code_followed: true, impact_on_children_assessed: true }),
        makeGrievance({ id: "g-3", acknowledged_within_5_days: false, grievance_stage: "hearing_held", acas_code_followed: true, impact_on_children_assessed: true }),
      ];
      const alerts = identifyGrievanceAlerts(g);
      const la = alerts.find((a) => a.type === "late_acknowledgement")!;
      expect(la.message).toContain("3");
    });

    it("excludes withdrawn from count", () => {
      const g = [
        makeGrievance({
          id: "g-1",
          acknowledged_within_5_days: false,
          grievance_stage: "withdrawn",
          acas_code_followed: true,
          impact_on_children_assessed: true,
        }),
      ];
      const alerts = identifyGrievanceAlerts(g);
      expect(alerts.find((a) => a.type === "late_acknowledgement")).toBeUndefined();
    });

    it("does NOT fire when all acknowledged within 5 days", () => {
      const g = [
        makeGrievance({ id: "g-1", acknowledged_within_5_days: true, grievance_stage: "investigating", acas_code_followed: true, impact_on_children_assessed: true }),
        makeGrievance({ id: "g-2", acknowledged_within_5_days: true, grievance_stage: "resolved", acas_code_followed: true, impact_on_children_assessed: true }),
      ];
      const alerts = identifyGrievanceAlerts(g);
      expect(alerts.find((a) => a.type === "late_acknowledgement")).toBeUndefined();
    });

    it("counts correctly in mixed set", () => {
      const g = [
        makeGrievance({ id: "g-1", acknowledged_within_5_days: false, grievance_stage: "investigating", acas_code_followed: true, impact_on_children_assessed: true }),
        makeGrievance({ id: "g-2", acknowledged_within_5_days: true, grievance_stage: "investigating", acas_code_followed: true, impact_on_children_assessed: true }),
        makeGrievance({ id: "g-3", acknowledged_within_5_days: false, grievance_stage: "withdrawn", acas_code_followed: true, impact_on_children_assessed: true }),
        makeGrievance({ id: "g-4", acknowledged_within_5_days: false, grievance_stage: "resolved", acas_code_followed: true, impact_on_children_assessed: true }),
      ];
      const alerts = identifyGrievanceAlerts(g);
      const la = alerts.find((a) => a.type === "late_acknowledgement")!;
      // g-1 and g-4 count (g-3 excluded because withdrawn)
      expect(la.message).toContain("2");
      expect(la.message).toContain("grievances were");
    });
  });

  // ── no_impact_assessment alert (medium) ───────────────────────────
  describe("no_impact_assessment alert", () => {
    it("fires when 2 formal grievances lack impact assessment", () => {
      const g = [
        makeGrievance({
          id: "g-1",
          impact_on_children_assessed: false,
          grievance_stage: "investigating",
          acknowledged_within_5_days: true,
          acas_code_followed: true,
        }),
        makeGrievance({
          id: "g-2",
          impact_on_children_assessed: false,
          grievance_stage: "hearing_held",
          acknowledged_within_5_days: true,
          acas_code_followed: true,
        }),
      ];
      const alerts = identifyGrievanceAlerts(g);
      const ni = alerts.find((a) => a.type === "no_impact_assessment");
      expect(ni).toBeTruthy();
    });

    it("has medium severity", () => {
      const g = [
        makeGrievance({ id: "g-1", impact_on_children_assessed: false, grievance_stage: "investigating", acknowledged_within_5_days: true, acas_code_followed: true }),
        makeGrievance({ id: "g-2", impact_on_children_assessed: false, grievance_stage: "hearing_held", acknowledged_within_5_days: true, acas_code_followed: true }),
      ];
      const alerts = identifyGrievanceAlerts(g);
      const ni = alerts.find((a) => a.type === "no_impact_assessment")!;
      expect(ni.severity).toBe("medium");
    });

    it("has id no_impact_assessment", () => {
      const g = [
        makeGrievance({ id: "g-1", impact_on_children_assessed: false, grievance_stage: "investigating", acknowledged_within_5_days: true, acas_code_followed: true }),
        makeGrievance({ id: "g-2", impact_on_children_assessed: false, grievance_stage: "hearing_held", acknowledged_within_5_days: true, acas_code_followed: true }),
      ];
      const alerts = identifyGrievanceAlerts(g);
      const ni = alerts.find((a) => a.type === "no_impact_assessment")!;
      expect(ni.id).toBe("no_impact_assessment");
    });

    it("message contains count", () => {
      const g = [
        makeGrievance({ id: "g-1", impact_on_children_assessed: false, grievance_stage: "investigating", acknowledged_within_5_days: true, acas_code_followed: true }),
        makeGrievance({ id: "g-2", impact_on_children_assessed: false, grievance_stage: "hearing_held", acknowledged_within_5_days: true, acas_code_followed: true }),
        makeGrievance({ id: "g-3", impact_on_children_assessed: false, grievance_stage: "resolved", acknowledged_within_5_days: true, acas_code_followed: true }),
      ];
      const alerts = identifyGrievanceAlerts(g);
      const ni = alerts.find((a) => a.type === "no_impact_assessment")!;
      expect(ni.message).toContain("3");
    });

    it("does NOT fire when only 1 grievance lacks impact assessment", () => {
      const g = [
        makeGrievance({
          id: "g-1",
          impact_on_children_assessed: false,
          grievance_stage: "investigating",
          acknowledged_within_5_days: true,
          acas_code_followed: true,
        }),
      ];
      const alerts = identifyGrievanceAlerts(g);
      expect(alerts.find((a) => a.type === "no_impact_assessment")).toBeUndefined();
    });

    it("excludes withdrawn from count", () => {
      const g = [
        makeGrievance({ id: "g-1", impact_on_children_assessed: false, grievance_stage: "withdrawn", acknowledged_within_5_days: true, acas_code_followed: true }),
        makeGrievance({ id: "g-2", impact_on_children_assessed: false, grievance_stage: "investigating", acknowledged_within_5_days: true, acas_code_followed: true }),
      ];
      const alerts = identifyGrievanceAlerts(g);
      // only g-2 counts, so below threshold of 2
      expect(alerts.find((a) => a.type === "no_impact_assessment")).toBeUndefined();
    });

    it("excludes informal_raised from count", () => {
      const g = [
        makeGrievance({ id: "g-1", impact_on_children_assessed: false, grievance_stage: "informal_raised", acknowledged_within_5_days: true, acas_code_followed: true }),
        makeGrievance({ id: "g-2", impact_on_children_assessed: false, grievance_stage: "investigating", acknowledged_within_5_days: true, acas_code_followed: true }),
      ];
      const alerts = identifyGrievanceAlerts(g);
      // only g-2 counts, so below threshold of 2
      expect(alerts.find((a) => a.type === "no_impact_assessment")).toBeUndefined();
    });

    it("does NOT fire when all have impact assessed", () => {
      const g = [
        makeGrievance({ id: "g-1", impact_on_children_assessed: true, grievance_stage: "investigating", acknowledged_within_5_days: true, acas_code_followed: true }),
        makeGrievance({ id: "g-2", impact_on_children_assessed: true, grievance_stage: "resolved", acknowledged_within_5_days: true, acas_code_followed: true }),
      ];
      const alerts = identifyGrievanceAlerts(g);
      expect(alerts.find((a) => a.type === "no_impact_assessment")).toBeUndefined();
    });

    it("counts correctly in mixed set", () => {
      const g = [
        makeGrievance({ id: "g-1", impact_on_children_assessed: false, grievance_stage: "investigating", acknowledged_within_5_days: true, acas_code_followed: true }),
        makeGrievance({ id: "g-2", impact_on_children_assessed: true, grievance_stage: "investigating", acknowledged_within_5_days: true, acas_code_followed: true }),
        makeGrievance({ id: "g-3", impact_on_children_assessed: false, grievance_stage: "withdrawn", acknowledged_within_5_days: true, acas_code_followed: true }),
        makeGrievance({ id: "g-4", impact_on_children_assessed: false, grievance_stage: "informal_raised", acknowledged_within_5_days: true, acas_code_followed: true }),
        makeGrievance({ id: "g-5", impact_on_children_assessed: false, grievance_stage: "resolved", acknowledged_within_5_days: true, acas_code_followed: true }),
      ];
      const alerts = identifyGrievanceAlerts(g);
      const ni = alerts.find((a) => a.type === "no_impact_assessment")!;
      // g-1 and g-5 count (g-3 withdrawn, g-4 informal_raised excluded)
      expect(ni.message).toContain("2");
    });
  });

  // ── pattern_grievance alert (medium) ──────────────────────────────
  describe("pattern_grievance alert", () => {
    it("fires when 3 grievances in same category (excluding withdrawn)", () => {
      const g = [
        makeGrievance({ id: "g-1", grievance_category: "working_conditions", grievance_stage: "resolved", acknowledged_within_5_days: true, acas_code_followed: true, impact_on_children_assessed: true }),
        makeGrievance({ id: "g-2", grievance_category: "working_conditions", grievance_stage: "investigating", acknowledged_within_5_days: true, acas_code_followed: true, impact_on_children_assessed: true }),
        makeGrievance({ id: "g-3", grievance_category: "working_conditions", grievance_stage: "hearing_held", acknowledged_within_5_days: true, acas_code_followed: true, impact_on_children_assessed: true }),
      ];
      const alerts = identifyGrievanceAlerts(g);
      const pg = alerts.find((a) => a.type === "pattern_grievance");
      expect(pg).toBeTruthy();
    });

    it("has medium severity", () => {
      const g = [
        makeGrievance({ id: "g-1", grievance_category: "workload", grievance_stage: "resolved", acknowledged_within_5_days: true, acas_code_followed: true, impact_on_children_assessed: true }),
        makeGrievance({ id: "g-2", grievance_category: "workload", grievance_stage: "resolved", acknowledged_within_5_days: true, acas_code_followed: true, impact_on_children_assessed: true }),
        makeGrievance({ id: "g-3", grievance_category: "workload", grievance_stage: "resolved", acknowledged_within_5_days: true, acas_code_followed: true, impact_on_children_assessed: true }),
      ];
      const alerts = identifyGrievanceAlerts(g);
      const pg = alerts.find((a) => a.type === "pattern_grievance")!;
      expect(pg.severity).toBe("medium");
    });

    it("has id pattern_{category}", () => {
      const g = [
        makeGrievance({ id: "g-1", grievance_category: "pay_benefits", grievance_stage: "resolved", acknowledged_within_5_days: true, acas_code_followed: true, impact_on_children_assessed: true }),
        makeGrievance({ id: "g-2", grievance_category: "pay_benefits", grievance_stage: "resolved", acknowledged_within_5_days: true, acas_code_followed: true, impact_on_children_assessed: true }),
        makeGrievance({ id: "g-3", grievance_category: "pay_benefits", grievance_stage: "resolved", acknowledged_within_5_days: true, acas_code_followed: true, impact_on_children_assessed: true }),
      ];
      const alerts = identifyGrievanceAlerts(g);
      const pg = alerts.find((a) => a.type === "pattern_grievance")!;
      expect(pg.id).toBe("pattern_pay_benefits");
    });

    it("message contains count", () => {
      const g = [
        makeGrievance({ id: "g-1", grievance_category: "workload", grievance_stage: "resolved", acknowledged_within_5_days: true, acas_code_followed: true, impact_on_children_assessed: true }),
        makeGrievance({ id: "g-2", grievance_category: "workload", grievance_stage: "resolved", acknowledged_within_5_days: true, acas_code_followed: true, impact_on_children_assessed: true }),
        makeGrievance({ id: "g-3", grievance_category: "workload", grievance_stage: "resolved", acknowledged_within_5_days: true, acas_code_followed: true, impact_on_children_assessed: true }),
        makeGrievance({ id: "g-4", grievance_category: "workload", grievance_stage: "investigating", acknowledged_within_5_days: true, acas_code_followed: true, impact_on_children_assessed: true }),
      ];
      const alerts = identifyGrievanceAlerts(g);
      const pg = alerts.find((a) => a.type === "pattern_grievance")!;
      expect(pg.message).toContain("4");
    });

    it("message contains category with underscores replaced by spaces", () => {
      const g = [
        makeGrievance({ id: "g-1", grievance_category: "management_conduct", grievance_stage: "resolved", acknowledged_within_5_days: true, acas_code_followed: true, impact_on_children_assessed: true }),
        makeGrievance({ id: "g-2", grievance_category: "management_conduct", grievance_stage: "resolved", acknowledged_within_5_days: true, acas_code_followed: true, impact_on_children_assessed: true }),
        makeGrievance({ id: "g-3", grievance_category: "management_conduct", grievance_stage: "resolved", acknowledged_within_5_days: true, acas_code_followed: true, impact_on_children_assessed: true }),
      ];
      const alerts = identifyGrievanceAlerts(g);
      const pg = alerts.find((a) => a.type === "pattern_grievance")!;
      expect(pg.message).toContain("management conduct");
    });

    it("does NOT fire when only 2 grievances in same category", () => {
      const g = [
        makeGrievance({ id: "g-1", grievance_category: "workload", grievance_stage: "resolved", acknowledged_within_5_days: true, acas_code_followed: true, impact_on_children_assessed: true }),
        makeGrievance({ id: "g-2", grievance_category: "workload", grievance_stage: "resolved", acknowledged_within_5_days: true, acas_code_followed: true, impact_on_children_assessed: true }),
      ];
      const alerts = identifyGrievanceAlerts(g);
      expect(alerts.find((a) => a.type === "pattern_grievance")).toBeUndefined();
    });

    it("excludes withdrawn from category count", () => {
      const g = [
        makeGrievance({ id: "g-1", grievance_category: "workload", grievance_stage: "resolved", acknowledged_within_5_days: true, acas_code_followed: true, impact_on_children_assessed: true }),
        makeGrievance({ id: "g-2", grievance_category: "workload", grievance_stage: "resolved", acknowledged_within_5_days: true, acas_code_followed: true, impact_on_children_assessed: true }),
        makeGrievance({ id: "g-3", grievance_category: "workload", grievance_stage: "withdrawn", acknowledged_within_5_days: true, acas_code_followed: true, impact_on_children_assessed: true }),
      ];
      const alerts = identifyGrievanceAlerts(g);
      // Only 2 non-withdrawn workload, below threshold
      expect(alerts.find((a) => a.type === "pattern_grievance")).toBeUndefined();
    });

    it("fires per category when multiple categories reach threshold", () => {
      const g = [
        makeGrievance({ id: "g-1", grievance_category: "workload", grievance_stage: "resolved", acknowledged_within_5_days: true, acas_code_followed: true, impact_on_children_assessed: true }),
        makeGrievance({ id: "g-2", grievance_category: "workload", grievance_stage: "resolved", acknowledged_within_5_days: true, acas_code_followed: true, impact_on_children_assessed: true }),
        makeGrievance({ id: "g-3", grievance_category: "workload", grievance_stage: "resolved", acknowledged_within_5_days: true, acas_code_followed: true, impact_on_children_assessed: true }),
        makeGrievance({ id: "g-4", grievance_category: "pay_benefits", grievance_stage: "resolved", acknowledged_within_5_days: true, acas_code_followed: true, impact_on_children_assessed: true }),
        makeGrievance({ id: "g-5", grievance_category: "pay_benefits", grievance_stage: "resolved", acknowledged_within_5_days: true, acas_code_followed: true, impact_on_children_assessed: true }),
        makeGrievance({ id: "g-6", grievance_category: "pay_benefits", grievance_stage: "resolved", acknowledged_within_5_days: true, acas_code_followed: true, impact_on_children_assessed: true }),
      ];
      const alerts = identifyGrievanceAlerts(g);
      const pg = alerts.filter((a) => a.type === "pattern_grievance");
      expect(pg).toHaveLength(2);
      const ids = pg.map((a) => a.id).sort();
      expect(ids).toEqual(["pattern_pay_benefits", "pattern_workload"]);
    });

    it("does NOT fire for categories below threshold even when others are above", () => {
      const g = [
        makeGrievance({ id: "g-1", grievance_category: "workload", grievance_stage: "resolved", acknowledged_within_5_days: true, acas_code_followed: true, impact_on_children_assessed: true }),
        makeGrievance({ id: "g-2", grievance_category: "workload", grievance_stage: "resolved", acknowledged_within_5_days: true, acas_code_followed: true, impact_on_children_assessed: true }),
        makeGrievance({ id: "g-3", grievance_category: "workload", grievance_stage: "resolved", acknowledged_within_5_days: true, acas_code_followed: true, impact_on_children_assessed: true }),
        makeGrievance({ id: "g-4", grievance_category: "pay_benefits", grievance_stage: "resolved", acknowledged_within_5_days: true, acas_code_followed: true, impact_on_children_assessed: true }),
      ];
      const alerts = identifyGrievanceAlerts(g);
      const pg = alerts.filter((a) => a.type === "pattern_grievance");
      expect(pg).toHaveLength(1);
      expect(pg[0].id).toBe("pattern_workload");
    });
  });

  // ── Combined alert scenarios ───────────────────────────────────────
  describe("combined alert scenarios", () => {
    it("can fire all five alert types simultaneously", () => {
      const g = [
        // serious_grievance: bullying_harassment + open
        // late_acknowledgement: not acknowledged
        // acas_not_followed: not following ACAS
        makeGrievance({
          id: "g-1",
          grievance_category: "bullying_harassment",
          grievance_stage: "investigating",
          staff_name: "Alice",
          acknowledged_within_5_days: false,
          acas_code_followed: false,
          impact_on_children_assessed: false,
        }),
        // no_impact_assessment: needs 2 non-withdrawn non-informal without impact
        makeGrievance({
          id: "g-2",
          grievance_category: "bullying_harassment",
          grievance_stage: "hearing_held",
          staff_name: "Bob",
          acknowledged_within_5_days: true,
          acas_code_followed: true,
          impact_on_children_assessed: false,
        }),
        // pattern_grievance: needs 3 in same category
        makeGrievance({
          id: "g-3",
          grievance_category: "bullying_harassment",
          grievance_stage: "formal_submitted",
          staff_name: "Carol",
          acknowledged_within_5_days: true,
          acas_code_followed: true,
          impact_on_children_assessed: true,
        }),
      ];
      const alerts = identifyGrievanceAlerts(g);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("serious_grievance");
      expect(types).toContain("acas_not_followed");
      expect(types).toContain("late_acknowledgement");
      expect(types).toContain("no_impact_assessment");
      expect(types).toContain("pattern_grievance");
    });

    it("returns no alerts for a clean set of grievances", () => {
      const g = [
        makeGrievance({
          id: "g-1",
          grievance_category: "working_conditions",
          grievance_stage: "resolved",
          acknowledged_within_5_days: true,
          acas_code_followed: true,
          impact_on_children_assessed: true,
        }),
        makeGrievance({
          id: "g-2",
          grievance_category: "pay_benefits",
          grievance_stage: "resolved",
          acknowledged_within_5_days: true,
          acas_code_followed: true,
          impact_on_children_assessed: true,
        }),
      ];
      const alerts = identifyGrievanceAlerts(g);
      expect(alerts).toEqual([]);
    });

    it("alert order: serious_grievance before acas_not_followed before late_acknowledgement before no_impact_assessment before pattern_grievance", () => {
      const g = [
        makeGrievance({
          id: "g-1",
          grievance_category: "bullying_harassment",
          grievance_stage: "investigating",
          staff_name: "Alice",
          acknowledged_within_5_days: false,
          acas_code_followed: false,
          impact_on_children_assessed: false,
        }),
        makeGrievance({
          id: "g-2",
          grievance_category: "bullying_harassment",
          grievance_stage: "hearing_held",
          staff_name: "Bob",
          acknowledged_within_5_days: false,
          acas_code_followed: false,
          impact_on_children_assessed: false,
        }),
        makeGrievance({
          id: "g-3",
          grievance_category: "bullying_harassment",
          grievance_stage: "formal_submitted",
          staff_name: "Carol",
          acknowledged_within_5_days: false,
          acas_code_followed: false,
          impact_on_children_assessed: false,
        }),
      ];
      const alerts = identifyGrievanceAlerts(g);
      const types = alerts.map((a) => a.type);

      const sgIdx = types.indexOf("serious_grievance");
      const acasIdx = types.indexOf("acas_not_followed");
      const laIdx = types.indexOf("late_acknowledgement");
      const niIdx = types.indexOf("no_impact_assessment");
      const pgIdx = types.indexOf("pattern_grievance");

      expect(sgIdx).toBeLessThan(acasIdx);
      expect(acasIdx).toBeLessThan(laIdx);
      expect(laIdx).toBeLessThan(niIdx);
      expect(niIdx).toBeLessThan(pgIdx);
    });

    it("generates multiple serious_grievance alerts for different records", () => {
      const g = [
        makeGrievance({
          id: "g-1",
          grievance_category: "bullying_harassment",
          grievance_stage: "investigating",
          staff_name: "Alice",
          acknowledged_within_5_days: true,
          acas_code_followed: true,
          impact_on_children_assessed: true,
        }),
        makeGrievance({
          id: "g-2",
          grievance_category: "discrimination",
          grievance_stage: "hearing_held",
          staff_name: "Bob",
          acknowledged_within_5_days: true,
          acas_code_followed: true,
          impact_on_children_assessed: true,
        }),
      ];
      const alerts = identifyGrievanceAlerts(g);
      const sg = alerts.filter((a) => a.type === "serious_grievance");
      expect(sg).toHaveLength(2);
      expect(sg[0].message).toContain("bullying harassment");
      expect(sg[0].message).toContain("Alice");
      expect(sg[1].message).toContain("discrimination");
      expect(sg[1].message).toContain("Bob");
    });
  });
});
