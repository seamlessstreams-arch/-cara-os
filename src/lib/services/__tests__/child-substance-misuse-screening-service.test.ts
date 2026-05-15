// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CHILD SUBSTANCE MISUSE SCREENING SERVICE TESTS
// Pure-function unit tests for substance misuse screening metrics computation,
// alert identification, and ARIA insight generation.
// CHR 2015 Reg 10 (health and wellbeing),
// CHR 2015 Reg 12 (protection of children),
// CHR 2015 Reg 34 (placement plans — risk assessment).
//
// SCCIF: Helped & Protected — "Children at risk of substance misuse
// are identified early and supported through effective intervention."
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  SUBSTANCE_TYPES,
  SCREENING_OUTCOMES,
  INTERVENTION_TYPES,
  _testing,
} from "../child-substance-misuse-screening-service";

import type {
  ChildSubstanceMisuseScreeningRow,
} from "../child-substance-misuse-screening-service";

const { computeMetrics, computeAlerts, computeAriaInsights } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRow(
  overrides?: Partial<ChildSubstanceMisuseScreeningRow>,
): ChildSubstanceMisuseScreeningRow {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : crypto.randomUUID(),
    home_id: overrides?.home_id ?? crypto.randomUUID(),
    child_name: overrides?.child_name ?? "Child A",
    screening_date: overrides?.screening_date ?? now.toISOString().split("T")[0],
    substance_type: overrides?.substance_type ?? "Cannabis",
    screening_outcome: overrides?.screening_outcome ?? "No Concern",
    intervention_type:
      "intervention_type" in (overrides ?? {})
        ? (overrides!.intervention_type ?? null)
        : null,
    referral_made: overrides?.referral_made ?? false,
    referral_agency:
      "referral_agency" in (overrides ?? {})
        ? (overrides!.referral_agency ?? null)
        : null,
    risk_assessment_completed: overrides?.risk_assessment_completed ?? true,
    safety_plan_in_place: overrides?.safety_plan_in_place ?? false,
    parental_notification: overrides?.parental_notification ?? true,
    social_worker_notified: overrides?.social_worker_notified ?? true,
    follow_up_date:
      "follow_up_date" in (overrides ?? {})
        ? (overrides!.follow_up_date ?? null)
        : null,
    assessor_name: overrides?.assessor_name ?? "D. Laville",
    notes:
      "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(),
    updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("child-substance-misuse-screening-service", () => {
  // ═══════════════════════════════════════════════════════════════════════
  // 1. CONSTANT VALIDATION
  // ═══════════════════════════════════════════════════════════════════════

  describe("SUBSTANCE_TYPES", () => {
    it("has exactly 7 values", () => {
      expect(SUBSTANCE_TYPES).toHaveLength(7);
    });
    it("contains Alcohol", () => {
      expect(SUBSTANCE_TYPES).toContain("Alcohol");
    });
    it("contains Cannabis", () => {
      expect(SUBSTANCE_TYPES).toContain("Cannabis");
    });
    it("contains Tobacco", () => {
      expect(SUBSTANCE_TYPES).toContain("Tobacco");
    });
    it("contains Solvents", () => {
      expect(SUBSTANCE_TYPES).toContain("Solvents");
    });
    it("contains NPS", () => {
      expect(SUBSTANCE_TYPES).toContain("NPS");
    });
    it("contains Prescription", () => {
      expect(SUBSTANCE_TYPES).toContain("Prescription");
    });
    it("contains Other", () => {
      expect(SUBSTANCE_TYPES).toContain("Other");
    });
  });

  describe("SCREENING_OUTCOMES", () => {
    it("has exactly 5 values", () => {
      expect(SCREENING_OUTCOMES).toHaveLength(5);
    });
    it("contains No Concern", () => {
      expect(SCREENING_OUTCOMES).toContain("No Concern");
    });
    it("contains Low Risk", () => {
      expect(SCREENING_OUTCOMES).toContain("Low Risk");
    });
    it("contains Moderate Risk", () => {
      expect(SCREENING_OUTCOMES).toContain("Moderate Risk");
    });
    it("contains High Risk", () => {
      expect(SCREENING_OUTCOMES).toContain("High Risk");
    });
    it("contains Immediate Intervention", () => {
      expect(SCREENING_OUTCOMES).toContain("Immediate Intervention");
    });
  });

  describe("INTERVENTION_TYPES", () => {
    it("has exactly 6 values", () => {
      expect(INTERVENTION_TYPES).toHaveLength(6);
    });
    it("contains Education", () => {
      expect(INTERVENTION_TYPES).toContain("Education");
    });
    it("contains Counselling", () => {
      expect(INTERVENTION_TYPES).toContain("Counselling");
    });
    it("contains CAMHS Referral", () => {
      expect(INTERVENTION_TYPES).toContain("CAMHS Referral");
    });
    it("contains Specialist Service", () => {
      expect(INTERVENTION_TYPES).toContain("Specialist Service");
    });
    it("contains Multi-Agency", () => {
      expect(INTERVENTION_TYPES).toContain("Multi-Agency");
    });
    it("contains None Required", () => {
      expect(INTERVENTION_TYPES).toContain("None Required");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // 2. makeRow factory
  // ═══════════════════════════════════════════════════════════════════════

  describe("makeRow factory", () => {
    it("produces a valid default row", () => {
      const r = makeRow();
      expect(r.id).toBeDefined();
      expect(r.child_name).toBe("Child A");
      expect(r.substance_type).toBe("Cannabis");
    });
    it("overrides child_name", () => {
      expect(makeRow({ child_name: "Zara" }).child_name).toBe("Zara");
    });
    it("defaults screening_outcome to No Concern", () => {
      expect(makeRow().screening_outcome).toBe("No Concern");
    });
    it("defaults intervention_type to null", () => {
      expect(makeRow().intervention_type).toBeNull();
    });
    it("allows setting intervention_type to a value", () => {
      expect(makeRow({ intervention_type: "Counselling" }).intervention_type).toBe("Counselling");
    });
    it("allows setting intervention_type to null explicitly", () => {
      expect(makeRow({ intervention_type: null }).intervention_type).toBeNull();
    });
    it("defaults notes to null", () => {
      expect(makeRow().notes).toBeNull();
    });
    it("allows overriding notes", () => {
      expect(makeRow({ notes: "test" }).notes).toBe("test");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // 3. computeMetrics
  // ═══════════════════════════════════════════════════════════════════════

  describe("computeMetrics", () => {
    // ── Empty array ────────────────────────────────────────────────────
    describe("empty records", () => {
      it("returns zero total_screenings", () => {
        expect(computeMetrics([]).total_screenings).toBe(0);
      });
      it("returns zero high_risk_count", () => {
        expect(computeMetrics([]).high_risk_count).toBe(0);
      });
      it("returns zero immediate_intervention_count", () => {
        expect(computeMetrics([]).immediate_intervention_count).toBe(0);
      });
      it("returns zero no_concern_count", () => {
        expect(computeMetrics([]).no_concern_count).toBe(0);
      });
      it("returns zero referral_rate", () => {
        expect(computeMetrics([]).referral_rate).toBe(0);
      });
      it("returns zero risk_assessment_rate", () => {
        expect(computeMetrics([]).risk_assessment_rate).toBe(0);
      });
      it("returns zero safety_plan_rate", () => {
        expect(computeMetrics([]).safety_plan_rate).toBe(0);
      });
      it("returns zero parental_notification_rate", () => {
        expect(computeMetrics([]).parental_notification_rate).toBe(0);
      });
      it("returns zero social_worker_rate", () => {
        expect(computeMetrics([]).social_worker_rate).toBe(0);
      });
      it("returns zero follow_up_rate", () => {
        expect(computeMetrics([]).follow_up_rate).toBe(0);
      });
      it("returns zero unique_children", () => {
        expect(computeMetrics([]).unique_children).toBe(0);
      });
      it("returns zero unique_assessors", () => {
        expect(computeMetrics([]).unique_assessors).toBe(0);
      });
      it("returns empty substance_type_breakdown", () => {
        expect(computeMetrics([]).substance_type_breakdown).toEqual({});
      });
      it("returns empty screening_outcome_breakdown", () => {
        expect(computeMetrics([]).screening_outcome_breakdown).toEqual({});
      });
      it("returns empty intervention_type_breakdown", () => {
        expect(computeMetrics([]).intervention_type_breakdown).toEqual({});
      });
    });

    // ── Single record ──────────────────────────────────────────────────
    describe("single record", () => {
      const single = [makeRow()];

      it("total_screenings is 1", () => {
        expect(computeMetrics(single).total_screenings).toBe(1);
      });
      it("high_risk_count is 0 for No Concern", () => {
        expect(computeMetrics(single).high_risk_count).toBe(0);
      });
      it("immediate_intervention_count is 0 for No Concern", () => {
        expect(computeMetrics(single).immediate_intervention_count).toBe(0);
      });
      it("no_concern_count is 1 for No Concern", () => {
        expect(computeMetrics(single).no_concern_count).toBe(1);
      });
      it("referral_rate is 0 when referral_made is false", () => {
        expect(computeMetrics(single).referral_rate).toBe(0);
      });
      it("risk_assessment_rate is 100 when completed", () => {
        expect(computeMetrics(single).risk_assessment_rate).toBe(100);
      });
      it("safety_plan_rate is 0 when not in place", () => {
        expect(computeMetrics(single).safety_plan_rate).toBe(0);
      });
      it("parental_notification_rate is 100 when notified", () => {
        expect(computeMetrics(single).parental_notification_rate).toBe(100);
      });
      it("social_worker_rate is 100 when notified", () => {
        expect(computeMetrics(single).social_worker_rate).toBe(100);
      });
      it("follow_up_rate is 0 when follow_up_date is null", () => {
        expect(computeMetrics(single).follow_up_rate).toBe(0);
      });
      it("unique_children is 1", () => {
        expect(computeMetrics(single).unique_children).toBe(1);
      });
      it("unique_assessors is 1", () => {
        expect(computeMetrics(single).unique_assessors).toBe(1);
      });
      it("substance_type_breakdown groups single record correctly", () => {
        expect(computeMetrics(single).substance_type_breakdown).toEqual({ Cannabis: 1 });
      });
      it("screening_outcome_breakdown groups single record correctly", () => {
        expect(computeMetrics(single).screening_outcome_breakdown).toEqual({ "No Concern": 1 });
      });
      it("intervention_type_breakdown is empty when null", () => {
        expect(computeMetrics(single).intervention_type_breakdown).toEqual({});
      });
    });

    // ── Multiple records ─────────────────────────────────────────────────
    describe("multiple records", () => {
      const records = [
        makeRow({
          id: "s-1",
          child_name: "Alice",
          substance_type: "Alcohol",
          screening_outcome: "No Concern",
          referral_made: false,
          risk_assessment_completed: true,
          safety_plan_in_place: false,
          parental_notification: true,
          social_worker_notified: true,
          follow_up_date: null,
          assessor_name: "D. Laville",
          intervention_type: null,
        }),
        makeRow({
          id: "s-2",
          child_name: "Bob",
          substance_type: "Cannabis",
          screening_outcome: "High Risk",
          referral_made: true,
          risk_assessment_completed: true,
          safety_plan_in_place: true,
          parental_notification: true,
          social_worker_notified: true,
          follow_up_date: "2025-06-01",
          assessor_name: "D. Laville",
          intervention_type: "Counselling",
        }),
        makeRow({
          id: "s-3",
          child_name: "Carol",
          substance_type: "Solvents",
          screening_outcome: "Immediate Intervention",
          referral_made: true,
          risk_assessment_completed: true,
          safety_plan_in_place: true,
          parental_notification: false,
          social_worker_notified: true,
          follow_up_date: "2025-06-15",
          assessor_name: "M. Smith",
          intervention_type: "CAMHS Referral",
        }),
        makeRow({
          id: "s-4",
          child_name: "Dave",
          substance_type: "Tobacco",
          screening_outcome: "Low Risk",
          referral_made: false,
          risk_assessment_completed: false,
          safety_plan_in_place: false,
          parental_notification: true,
          social_worker_notified: false,
          follow_up_date: null,
          assessor_name: "M. Smith",
          intervention_type: "Education",
        }),
        makeRow({
          id: "s-5",
          child_name: "Eve",
          substance_type: "NPS",
          screening_outcome: "Moderate Risk",
          referral_made: false,
          risk_assessment_completed: true,
          safety_plan_in_place: false,
          parental_notification: true,
          social_worker_notified: true,
          follow_up_date: "2025-07-01",
          assessor_name: "D. Laville",
          intervention_type: "Specialist Service",
        }),
      ];

      it("total_screenings is 5", () => {
        expect(computeMetrics(records).total_screenings).toBe(5);
      });
      it("high_risk_count is 1", () => {
        expect(computeMetrics(records).high_risk_count).toBe(1);
      });
      it("immediate_intervention_count is 1", () => {
        expect(computeMetrics(records).immediate_intervention_count).toBe(1);
      });
      it("no_concern_count is 1", () => {
        expect(computeMetrics(records).no_concern_count).toBe(1);
      });
      it("referral_rate is 40 (2 of 5)", () => {
        expect(computeMetrics(records).referral_rate).toBe(40);
      });
      it("risk_assessment_rate is 80 (4 of 5)", () => {
        expect(computeMetrics(records).risk_assessment_rate).toBe(80);
      });
      it("safety_plan_rate is 40 (2 of 5)", () => {
        expect(computeMetrics(records).safety_plan_rate).toBe(40);
      });
      it("parental_notification_rate is 80 (4 of 5)", () => {
        expect(computeMetrics(records).parental_notification_rate).toBe(80);
      });
      it("social_worker_rate is 80 (4 of 5)", () => {
        expect(computeMetrics(records).social_worker_rate).toBe(80);
      });
      it("follow_up_rate is 60 (3 of 5)", () => {
        expect(computeMetrics(records).follow_up_rate).toBe(60);
      });
      it("unique_children is 5", () => {
        expect(computeMetrics(records).unique_children).toBe(5);
      });
      it("unique_assessors is 2", () => {
        expect(computeMetrics(records).unique_assessors).toBe(2);
      });
      it("substance_type_breakdown groups correctly", () => {
        expect(computeMetrics(records).substance_type_breakdown).toEqual({
          Alcohol: 1,
          Cannabis: 1,
          Solvents: 1,
          Tobacco: 1,
          NPS: 1,
        });
      });
      it("screening_outcome_breakdown groups correctly", () => {
        expect(computeMetrics(records).screening_outcome_breakdown).toEqual({
          "No Concern": 1,
          "High Risk": 1,
          "Immediate Intervention": 1,
          "Low Risk": 1,
          "Moderate Risk": 1,
        });
      });
      it("intervention_type_breakdown groups correctly", () => {
        expect(computeMetrics(records).intervention_type_breakdown).toEqual({
          Counselling: 1,
          "CAMHS Referral": 1,
          Education: 1,
          "Specialist Service": 1,
        });
      });
    });

    // ── All substance types ──────────────────────────────────────────────
    describe("all substance types", () => {
      const allTypes = SUBSTANCE_TYPES.map((t, i) =>
        makeRow({ id: `st-${i}`, substance_type: t }),
      );

      it("substance_type_breakdown has all 7 types", () => {
        const m = computeMetrics(allTypes);
        expect(Object.keys(m.substance_type_breakdown)).toHaveLength(7);
      });
      it("each substance type has count 1", () => {
        const m = computeMetrics(allTypes);
        for (const t of SUBSTANCE_TYPES) {
          expect(m.substance_type_breakdown[t]).toBe(1);
        }
      });
    });

    // ── All screening outcomes ───────────────────────────────────────────
    describe("all screening outcomes", () => {
      const allOutcomes = SCREENING_OUTCOMES.map((o, i) =>
        makeRow({ id: `so-${i}`, screening_outcome: o }),
      );

      it("screening_outcome_breakdown has all 5 outcomes", () => {
        const m = computeMetrics(allOutcomes);
        expect(Object.keys(m.screening_outcome_breakdown)).toHaveLength(5);
      });
      it("each outcome has count 1", () => {
        const m = computeMetrics(allOutcomes);
        for (const o of SCREENING_OUTCOMES) {
          expect(m.screening_outcome_breakdown[o]).toBe(1);
        }
      });
      it("high_risk_count is 1", () => {
        expect(computeMetrics(allOutcomes).high_risk_count).toBe(1);
      });
      it("immediate_intervention_count is 1", () => {
        expect(computeMetrics(allOutcomes).immediate_intervention_count).toBe(1);
      });
      it("no_concern_count is 1", () => {
        expect(computeMetrics(allOutcomes).no_concern_count).toBe(1);
      });
    });

    // ── Percentage calculations ──────────────────────────────────────────
    describe("percentage calculations", () => {
      it("referral_rate is 100 when all true", () => {
        const rows = [
          makeRow({ id: "1", referral_made: true }),
          makeRow({ id: "2", referral_made: true }),
        ];
        expect(computeMetrics(rows).referral_rate).toBe(100);
      });
      it("referral_rate is 0 when all false", () => {
        const rows = [
          makeRow({ id: "1", referral_made: false }),
          makeRow({ id: "2", referral_made: false }),
        ];
        expect(computeMetrics(rows).referral_rate).toBe(0);
      });
      it("referral_rate is 50 for 1 of 2", () => {
        const rows = [
          makeRow({ id: "1", referral_made: true }),
          makeRow({ id: "2", referral_made: false }),
        ];
        expect(computeMetrics(rows).referral_rate).toBe(50);
      });
      it("referral_rate rounds correctly for 1 of 3 (33.3)", () => {
        const rows = [
          makeRow({ id: "1", referral_made: true }),
          makeRow({ id: "2", referral_made: false }),
          makeRow({ id: "3", referral_made: false }),
        ];
        expect(computeMetrics(rows).referral_rate).toBe(33.3);
      });
      it("referral_rate rounds correctly for 2 of 3 (66.7)", () => {
        const rows = [
          makeRow({ id: "1", referral_made: true }),
          makeRow({ id: "2", referral_made: true }),
          makeRow({ id: "3", referral_made: false }),
        ];
        expect(computeMetrics(rows).referral_rate).toBe(66.7);
      });
      it("risk_assessment_rate is 100 when all true", () => {
        const rows = [
          makeRow({ id: "1", risk_assessment_completed: true }),
          makeRow({ id: "2", risk_assessment_completed: true }),
        ];
        expect(computeMetrics(rows).risk_assessment_rate).toBe(100);
      });
      it("risk_assessment_rate is 0 when all false", () => {
        const rows = [
          makeRow({ id: "1", risk_assessment_completed: false }),
          makeRow({ id: "2", risk_assessment_completed: false }),
        ];
        expect(computeMetrics(rows).risk_assessment_rate).toBe(0);
      });
      it("safety_plan_rate is 100 when all true", () => {
        const rows = [
          makeRow({ id: "1", safety_plan_in_place: true }),
          makeRow({ id: "2", safety_plan_in_place: true }),
        ];
        expect(computeMetrics(rows).safety_plan_rate).toBe(100);
      });
      it("safety_plan_rate is 0 when all false", () => {
        const rows = [
          makeRow({ id: "1", safety_plan_in_place: false }),
          makeRow({ id: "2", safety_plan_in_place: false }),
        ];
        expect(computeMetrics(rows).safety_plan_rate).toBe(0);
      });
      it("parental_notification_rate rounds correctly for 1 of 3 (33.3)", () => {
        const rows = [
          makeRow({ id: "1", parental_notification: true }),
          makeRow({ id: "2", parental_notification: false }),
          makeRow({ id: "3", parental_notification: false }),
        ];
        expect(computeMetrics(rows).parental_notification_rate).toBe(33.3);
      });
      it("social_worker_rate rounds correctly for 2 of 3 (66.7)", () => {
        const rows = [
          makeRow({ id: "1", social_worker_notified: true }),
          makeRow({ id: "2", social_worker_notified: true }),
          makeRow({ id: "3", social_worker_notified: false }),
        ];
        expect(computeMetrics(rows).social_worker_rate).toBe(66.7);
      });
      it("follow_up_rate is 100 when all have dates", () => {
        const rows = [
          makeRow({ id: "1", follow_up_date: "2025-07-01" }),
          makeRow({ id: "2", follow_up_date: "2025-07-15" }),
        ];
        expect(computeMetrics(rows).follow_up_rate).toBe(100);
      });
      it("follow_up_rate is 0 when none have dates", () => {
        const rows = [
          makeRow({ id: "1", follow_up_date: null }),
          makeRow({ id: "2", follow_up_date: null }),
        ];
        expect(computeMetrics(rows).follow_up_rate).toBe(0);
      });
      it("follow_up_rate rounds correctly for 1 of 3 (33.3)", () => {
        const rows = [
          makeRow({ id: "1", follow_up_date: "2025-07-01" }),
          makeRow({ id: "2", follow_up_date: null }),
          makeRow({ id: "3", follow_up_date: null }),
        ];
        expect(computeMetrics(rows).follow_up_rate).toBe(33.3);
      });
    });

    // ── Unique counts ────────────────────────────────────────────────────
    describe("unique counts", () => {
      it("unique_children deduplicates same child_name", () => {
        const rows = [
          makeRow({ id: "1", child_name: "Alice" }),
          makeRow({ id: "2", child_name: "Alice" }),
          makeRow({ id: "3", child_name: "Bob" }),
        ];
        expect(computeMetrics(rows).unique_children).toBe(2);
      });
      it("unique_assessors deduplicates same assessor_name", () => {
        const rows = [
          makeRow({ id: "1", assessor_name: "D. Laville" }),
          makeRow({ id: "2", assessor_name: "D. Laville" }),
          makeRow({ id: "3", assessor_name: "M. Smith" }),
        ];
        expect(computeMetrics(rows).unique_assessors).toBe(2);
      });
      it("unique_children counts all distinct names", () => {
        const rows = [
          makeRow({ id: "1", child_name: "A" }),
          makeRow({ id: "2", child_name: "B" }),
          makeRow({ id: "3", child_name: "C" }),
          makeRow({ id: "4", child_name: "D" }),
        ];
        expect(computeMetrics(rows).unique_children).toBe(4);
      });
      it("unique_assessors counts all distinct names", () => {
        const rows = [
          makeRow({ id: "1", assessor_name: "X" }),
          makeRow({ id: "2", assessor_name: "Y" }),
          makeRow({ id: "3", assessor_name: "Z" }),
        ];
        expect(computeMetrics(rows).unique_assessors).toBe(3);
      });
    });

    // ── Breakdown maps ───────────────────────────────────────────────────
    describe("breakdown maps", () => {
      it("substance_type_breakdown handles duplicates", () => {
        const rows = [
          makeRow({ id: "1", substance_type: "Cannabis" }),
          makeRow({ id: "2", substance_type: "Cannabis" }),
          makeRow({ id: "3", substance_type: "Alcohol" }),
        ];
        expect(computeMetrics(rows).substance_type_breakdown).toEqual({
          Cannabis: 2,
          Alcohol: 1,
        });
      });
      it("screening_outcome_breakdown handles duplicates", () => {
        const rows = [
          makeRow({ id: "1", screening_outcome: "High Risk" }),
          makeRow({ id: "2", screening_outcome: "High Risk" }),
          makeRow({ id: "3", screening_outcome: "Low Risk" }),
        ];
        expect(computeMetrics(rows).screening_outcome_breakdown).toEqual({
          "High Risk": 2,
          "Low Risk": 1,
        });
      });
      it("intervention_type_breakdown excludes null values", () => {
        const rows = [
          makeRow({ id: "1", intervention_type: "Education" }),
          makeRow({ id: "2", intervention_type: null }),
          makeRow({ id: "3", intervention_type: "Counselling" }),
        ];
        expect(computeMetrics(rows).intervention_type_breakdown).toEqual({
          Education: 1,
          Counselling: 1,
        });
      });
      it("intervention_type_breakdown handles all types", () => {
        const rows = INTERVENTION_TYPES.map((t, i) =>
          makeRow({ id: `it-${i}`, intervention_type: t }),
        );
        const m = computeMetrics(rows);
        expect(Object.keys(m.intervention_type_breakdown)).toHaveLength(6);
        for (const t of INTERVENTION_TYPES) {
          expect(m.intervention_type_breakdown[t]).toBe(1);
        }
      });
    });

    // ── Edge cases ───────────────────────────────────────────────────────
    describe("edge cases", () => {
      it("counts multiple High Risk rows", () => {
        const rows = [
          makeRow({ id: "1", screening_outcome: "High Risk" }),
          makeRow({ id: "2", screening_outcome: "High Risk" }),
          makeRow({ id: "3", screening_outcome: "High Risk" }),
        ];
        expect(computeMetrics(rows).high_risk_count).toBe(3);
      });
      it("counts multiple Immediate Intervention rows", () => {
        const rows = [
          makeRow({ id: "1", screening_outcome: "Immediate Intervention" }),
          makeRow({ id: "2", screening_outcome: "Immediate Intervention" }),
        ];
        expect(computeMetrics(rows).immediate_intervention_count).toBe(2);
      });
      it("counts multiple No Concern rows", () => {
        const rows = [
          makeRow({ id: "1", screening_outcome: "No Concern" }),
          makeRow({ id: "2", screening_outcome: "No Concern" }),
          makeRow({ id: "3", screening_outcome: "No Concern" }),
          makeRow({ id: "4", screening_outcome: "No Concern" }),
        ];
        expect(computeMetrics(rows).no_concern_count).toBe(4);
      });
      it("all boolean rates are 100 when all true", () => {
        const rows = [
          makeRow({
            id: "1",
            referral_made: true,
            risk_assessment_completed: true,
            safety_plan_in_place: true,
            parental_notification: true,
            social_worker_notified: true,
            follow_up_date: "2025-08-01",
          }),
        ];
        const m = computeMetrics(rows);
        expect(m.referral_rate).toBe(100);
        expect(m.risk_assessment_rate).toBe(100);
        expect(m.safety_plan_rate).toBe(100);
        expect(m.parental_notification_rate).toBe(100);
        expect(m.social_worker_rate).toBe(100);
        expect(m.follow_up_rate).toBe(100);
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // 4. computeAlerts
  // ═══════════════════════════════════════════════════════════════════════

  describe("computeAlerts", () => {
    // ── No alerts ────────────────────────────────────────────────────────
    describe("no alerts scenario", () => {
      it("returns empty array for empty rows", () => {
        expect(computeAlerts([])).toEqual([]);
      });
      it("returns empty array when all conditions are safe", () => {
        const rows = [
          makeRow({
            id: "s-1",
            screening_outcome: "No Concern",
            safety_plan_in_place: true,
            referral_made: true,
            risk_assessment_completed: true,
            social_worker_notified: true,
          }),
        ];
        expect(computeAlerts(rows)).toEqual([]);
      });
      it("returns empty for No Concern with risk assessment done", () => {
        const rows = [
          makeRow({
            id: "s-1",
            screening_outcome: "No Concern",
            risk_assessment_completed: true,
            social_worker_notified: true,
          }),
        ];
        expect(computeAlerts(rows)).toEqual([]);
      });
    });

    // ── Critical: Immediate Intervention without safety plan ────────────
    describe("immediate_intervention_no_safety_plan alert", () => {
      it("fires when Immediate Intervention without safety_plan", () => {
        const rows = [
          makeRow({
            id: "s-1",
            screening_outcome: "Immediate Intervention",
            safety_plan_in_place: false,
            risk_assessment_completed: true,
            social_worker_notified: true,
          }),
        ];
        const alerts = computeAlerts(rows);
        const found = alerts.find((a) => a.type === "immediate_intervention_no_safety_plan");
        expect(found).toBeTruthy();
      });
      it("has critical severity", () => {
        const rows = [
          makeRow({
            id: "s-1",
            screening_outcome: "Immediate Intervention",
            safety_plan_in_place: false,
            risk_assessment_completed: true,
            social_worker_notified: true,
          }),
        ];
        const alert = computeAlerts(rows).find((a) => a.type === "immediate_intervention_no_safety_plan")!;
        expect(alert.severity).toBe("critical");
      });
      it("uses record id as record_id", () => {
        const rows = [
          makeRow({
            id: "s-42",
            screening_outcome: "Immediate Intervention",
            safety_plan_in_place: false,
            risk_assessment_completed: true,
            social_worker_notified: true,
          }),
        ];
        const alert = computeAlerts(rows).find((a) => a.type === "immediate_intervention_no_safety_plan")!;
        expect(alert.record_id).toBe("s-42");
      });
      it("message contains child_name", () => {
        const rows = [
          makeRow({
            id: "s-1",
            child_name: "Bobby Brown",
            screening_outcome: "Immediate Intervention",
            safety_plan_in_place: false,
            risk_assessment_completed: true,
            social_worker_notified: true,
          }),
        ];
        const alert = computeAlerts(rows).find((a) => a.type === "immediate_intervention_no_safety_plan")!;
        expect(alert.message).toContain("Bobby Brown");
      });
      it("message contains substance_type", () => {
        const rows = [
          makeRow({
            id: "s-1",
            substance_type: "Solvents",
            screening_outcome: "Immediate Intervention",
            safety_plan_in_place: false,
            risk_assessment_completed: true,
            social_worker_notified: true,
          }),
        ];
        const alert = computeAlerts(rows).find((a) => a.type === "immediate_intervention_no_safety_plan")!;
        expect(alert.message).toContain("Solvents");
      });
      it("does NOT fire when safety_plan_in_place is true", () => {
        const rows = [
          makeRow({
            id: "s-1",
            screening_outcome: "Immediate Intervention",
            safety_plan_in_place: true,
            risk_assessment_completed: true,
            social_worker_notified: true,
          }),
        ];
        const alerts = computeAlerts(rows);
        expect(alerts.find((a) => a.type === "immediate_intervention_no_safety_plan")).toBeUndefined();
      });
      it("does NOT fire for High Risk without safety plan", () => {
        const rows = [
          makeRow({
            id: "s-1",
            screening_outcome: "High Risk",
            safety_plan_in_place: false,
            referral_made: true,
            risk_assessment_completed: true,
            social_worker_notified: true,
          }),
        ];
        const alerts = computeAlerts(rows);
        expect(alerts.find((a) => a.type === "immediate_intervention_no_safety_plan")).toBeUndefined();
      });
      it("fires per record for multiple without safety plan", () => {
        const rows = [
          makeRow({ id: "s-1", screening_outcome: "Immediate Intervention", safety_plan_in_place: false, risk_assessment_completed: true, social_worker_notified: true }),
          makeRow({ id: "s-2", screening_outcome: "Immediate Intervention", safety_plan_in_place: false, risk_assessment_completed: true, social_worker_notified: true }),
        ];
        const alerts = computeAlerts(rows).filter((a) => a.type === "immediate_intervention_no_safety_plan");
        expect(alerts).toHaveLength(2);
      });
    });

    // ── High: High Risk without referral ─────────────────────────────────
    describe("high_risk_no_referral alert", () => {
      it("fires when High Risk without referral_made", () => {
        const rows = [
          makeRow({
            id: "s-1",
            screening_outcome: "High Risk",
            referral_made: false,
            risk_assessment_completed: true,
            social_worker_notified: true,
          }),
        ];
        const found = computeAlerts(rows).find((a) => a.type === "high_risk_no_referral");
        expect(found).toBeTruthy();
      });
      it("has high severity", () => {
        const rows = [
          makeRow({
            id: "s-1",
            screening_outcome: "High Risk",
            referral_made: false,
            risk_assessment_completed: true,
            social_worker_notified: true,
          }),
        ];
        const alert = computeAlerts(rows).find((a) => a.type === "high_risk_no_referral")!;
        expect(alert.severity).toBe("high");
      });
      it("uses record id as record_id", () => {
        const rows = [
          makeRow({
            id: "s-99",
            screening_outcome: "High Risk",
            referral_made: false,
            risk_assessment_completed: true,
            social_worker_notified: true,
          }),
        ];
        const alert = computeAlerts(rows).find((a) => a.type === "high_risk_no_referral")!;
        expect(alert.record_id).toBe("s-99");
      });
      it("message contains child_name", () => {
        const rows = [
          makeRow({
            id: "s-1",
            child_name: "Emma White",
            screening_outcome: "High Risk",
            referral_made: false,
            risk_assessment_completed: true,
            social_worker_notified: true,
          }),
        ];
        const alert = computeAlerts(rows).find((a) => a.type === "high_risk_no_referral")!;
        expect(alert.message).toContain("Emma White");
      });
      it("message contains substance_type", () => {
        const rows = [
          makeRow({
            id: "s-1",
            substance_type: "Alcohol",
            screening_outcome: "High Risk",
            referral_made: false,
            risk_assessment_completed: true,
            social_worker_notified: true,
          }),
        ];
        const alert = computeAlerts(rows).find((a) => a.type === "high_risk_no_referral")!;
        expect(alert.message).toContain("Alcohol");
      });
      it("does NOT fire when referral_made is true", () => {
        const rows = [
          makeRow({
            id: "s-1",
            screening_outcome: "High Risk",
            referral_made: true,
            risk_assessment_completed: true,
            social_worker_notified: true,
          }),
        ];
        expect(computeAlerts(rows).find((a) => a.type === "high_risk_no_referral")).toBeUndefined();
      });
      it("does NOT fire for Moderate Risk without referral", () => {
        const rows = [
          makeRow({
            id: "s-1",
            screening_outcome: "Moderate Risk",
            referral_made: false,
            risk_assessment_completed: true,
            social_worker_notified: true,
          }),
        ];
        expect(computeAlerts(rows).find((a) => a.type === "high_risk_no_referral")).toBeUndefined();
      });
      it("does NOT fire for No Concern without referral", () => {
        const rows = [
          makeRow({
            id: "s-1",
            screening_outcome: "No Concern",
            referral_made: false,
            risk_assessment_completed: true,
          }),
        ];
        expect(computeAlerts(rows).find((a) => a.type === "high_risk_no_referral")).toBeUndefined();
      });
      it("fires per record for multiple High Risk without referral", () => {
        const rows = [
          makeRow({ id: "s-1", screening_outcome: "High Risk", referral_made: false, risk_assessment_completed: true, social_worker_notified: true }),
          makeRow({ id: "s-2", screening_outcome: "High Risk", referral_made: false, risk_assessment_completed: true, social_worker_notified: true }),
          makeRow({ id: "s-3", screening_outcome: "High Risk", referral_made: true, risk_assessment_completed: true, social_worker_notified: true }),
        ];
        const alerts = computeAlerts(rows).filter((a) => a.type === "high_risk_no_referral");
        expect(alerts).toHaveLength(2);
      });
    });

    // ── Medium: no risk assessment ───────────────────────────────────────
    describe("no_risk_assessment alert", () => {
      it("fires when risk_assessment_completed is false", () => {
        const rows = [
          makeRow({
            id: "s-1",
            screening_outcome: "No Concern",
            risk_assessment_completed: false,
          }),
        ];
        const found = computeAlerts(rows).find((a) => a.type === "no_risk_assessment");
        expect(found).toBeTruthy();
      });
      it("has medium severity", () => {
        const rows = [
          makeRow({
            id: "s-1",
            screening_outcome: "No Concern",
            risk_assessment_completed: false,
          }),
        ];
        const alert = computeAlerts(rows).find((a) => a.type === "no_risk_assessment")!;
        expect(alert.severity).toBe("medium");
      });
      it("uses record id as record_id", () => {
        const rows = [
          makeRow({
            id: "s-77",
            screening_outcome: "No Concern",
            risk_assessment_completed: false,
          }),
        ];
        const alert = computeAlerts(rows).find((a) => a.type === "no_risk_assessment")!;
        expect(alert.record_id).toBe("s-77");
      });
      it("message contains child_name", () => {
        const rows = [
          makeRow({
            id: "s-1",
            child_name: "Tommy Green",
            screening_outcome: "No Concern",
            risk_assessment_completed: false,
          }),
        ];
        const alert = computeAlerts(rows).find((a) => a.type === "no_risk_assessment")!;
        expect(alert.message).toContain("Tommy Green");
      });
      it("message contains substance_type", () => {
        const rows = [
          makeRow({
            id: "s-1",
            substance_type: "NPS",
            screening_outcome: "No Concern",
            risk_assessment_completed: false,
          }),
        ];
        const alert = computeAlerts(rows).find((a) => a.type === "no_risk_assessment")!;
        expect(alert.message).toContain("NPS");
      });
      it("does NOT fire when risk_assessment_completed is true", () => {
        const rows = [
          makeRow({
            id: "s-1",
            risk_assessment_completed: true,
          }),
        ];
        expect(computeAlerts(rows).find((a) => a.type === "no_risk_assessment")).toBeUndefined();
      });
      it("fires for every row missing risk assessment", () => {
        const rows = [
          makeRow({ id: "s-1", screening_outcome: "No Concern", risk_assessment_completed: false }),
          makeRow({ id: "s-2", screening_outcome: "Low Risk", risk_assessment_completed: false, social_worker_notified: true }),
          makeRow({ id: "s-3", risk_assessment_completed: true }),
        ];
        const alerts = computeAlerts(rows).filter((a) => a.type === "no_risk_assessment");
        expect(alerts).toHaveLength(2);
      });
    });

    // ── Medium: social worker not notified ───────────────────────────────
    describe("social_worker_not_notified alert", () => {
      it("fires when outcome is not No Concern and social_worker_notified is false", () => {
        const rows = [
          makeRow({
            id: "s-1",
            screening_outcome: "Low Risk",
            social_worker_notified: false,
            risk_assessment_completed: true,
          }),
        ];
        const found = computeAlerts(rows).find((a) => a.type === "social_worker_not_notified");
        expect(found).toBeTruthy();
      });
      it("has medium severity", () => {
        const rows = [
          makeRow({
            id: "s-1",
            screening_outcome: "Moderate Risk",
            social_worker_notified: false,
            risk_assessment_completed: true,
          }),
        ];
        const alert = computeAlerts(rows).find((a) => a.type === "social_worker_not_notified")!;
        expect(alert.severity).toBe("medium");
      });
      it("uses record id as record_id", () => {
        const rows = [
          makeRow({
            id: "s-55",
            screening_outcome: "High Risk",
            social_worker_notified: false,
            referral_made: true,
            risk_assessment_completed: true,
          }),
        ];
        const alert = computeAlerts(rows).find((a) => a.type === "social_worker_not_notified")!;
        expect(alert.record_id).toBe("s-55");
      });
      it("message contains child_name", () => {
        const rows = [
          makeRow({
            id: "s-1",
            child_name: "Sarah Jones",
            screening_outcome: "High Risk",
            social_worker_notified: false,
            referral_made: true,
            risk_assessment_completed: true,
          }),
        ];
        const alert = computeAlerts(rows).find((a) => a.type === "social_worker_not_notified")!;
        expect(alert.message).toContain("Sarah Jones");
      });
      it("message contains screening_outcome", () => {
        const rows = [
          makeRow({
            id: "s-1",
            screening_outcome: "Moderate Risk",
            social_worker_notified: false,
            risk_assessment_completed: true,
          }),
        ];
        const alert = computeAlerts(rows).find((a) => a.type === "social_worker_not_notified")!;
        expect(alert.message).toContain("Moderate Risk");
      });
      it("does NOT fire for No Concern even if social_worker_notified false", () => {
        const rows = [
          makeRow({
            id: "s-1",
            screening_outcome: "No Concern",
            social_worker_notified: false,
            risk_assessment_completed: true,
          }),
        ];
        expect(computeAlerts(rows).find((a) => a.type === "social_worker_not_notified")).toBeUndefined();
      });
      it("does NOT fire when social_worker_notified is true", () => {
        const rows = [
          makeRow({
            id: "s-1",
            screening_outcome: "High Risk",
            social_worker_notified: true,
            referral_made: true,
            risk_assessment_completed: true,
          }),
        ];
        expect(computeAlerts(rows).find((a) => a.type === "social_worker_not_notified")).toBeUndefined();
      });
      it("fires for all non-No Concern outcomes", () => {
        const rows = [
          makeRow({ id: "s-1", screening_outcome: "Low Risk", social_worker_notified: false, risk_assessment_completed: true }),
          makeRow({ id: "s-2", screening_outcome: "Moderate Risk", social_worker_notified: false, risk_assessment_completed: true }),
          makeRow({ id: "s-3", screening_outcome: "High Risk", social_worker_notified: false, referral_made: true, risk_assessment_completed: true }),
          makeRow({ id: "s-4", screening_outcome: "Immediate Intervention", social_worker_notified: false, safety_plan_in_place: true, risk_assessment_completed: true }),
        ];
        const alerts = computeAlerts(rows).filter((a) => a.type === "social_worker_not_notified");
        expect(alerts).toHaveLength(4);
      });
    });

    // ── Multiple alert types simultaneously ──────────────────────────────
    describe("combined alert scenarios", () => {
      it("can fire all four alert types simultaneously", () => {
        const rows = [
          makeRow({
            id: "s-1",
            screening_outcome: "Immediate Intervention",
            safety_plan_in_place: false,
            referral_made: false,
            risk_assessment_completed: false,
            social_worker_notified: false,
          }),
        ];
        const alerts = computeAlerts(rows);
        const types = alerts.map((a) => a.type);
        expect(types).toContain("immediate_intervention_no_safety_plan");
        expect(types).toContain("no_risk_assessment");
        expect(types).toContain("social_worker_not_notified");
      });
      it("fires high_risk_no_referral alongside medium alerts", () => {
        const rows = [
          makeRow({
            id: "s-1",
            screening_outcome: "High Risk",
            referral_made: false,
            risk_assessment_completed: false,
            social_worker_notified: false,
          }),
        ];
        const alerts = computeAlerts(rows);
        const types = alerts.map((a) => a.type);
        expect(types).toContain("high_risk_no_referral");
        expect(types).toContain("no_risk_assessment");
        expect(types).toContain("social_worker_not_notified");
      });
      it("returns alerts in correct order: critical, high, medium (risk), medium (sw)", () => {
        const rows = [
          makeRow({
            id: "s-1",
            screening_outcome: "Immediate Intervention",
            safety_plan_in_place: false,
            risk_assessment_completed: false,
            social_worker_notified: false,
          }),
          makeRow({
            id: "s-2",
            screening_outcome: "High Risk",
            referral_made: false,
            risk_assessment_completed: false,
            social_worker_notified: false,
          }),
        ];
        const alerts = computeAlerts(rows);
        const types = alerts.map((a) => a.type);
        const critIdx = types.indexOf("immediate_intervention_no_safety_plan");
        const highIdx = types.indexOf("high_risk_no_referral");
        const medRiskIdx = types.indexOf("no_risk_assessment");
        const medSwIdx = types.indexOf("social_worker_not_notified");
        expect(critIdx).toBeLessThan(highIdx);
        expect(highIdx).toBeLessThan(medRiskIdx);
        expect(medRiskIdx).toBeLessThan(medSwIdx);
      });
      it("returns no alerts for well-managed records", () => {
        const rows = [
          makeRow({
            id: "s-1",
            screening_outcome: "No Concern",
            risk_assessment_completed: true,
            social_worker_notified: true,
          }),
          makeRow({
            id: "s-2",
            screening_outcome: "Low Risk",
            risk_assessment_completed: true,
            social_worker_notified: true,
          }),
        ];
        expect(computeAlerts(rows)).toEqual([]);
      });
      it("generates multiple alerts of same type for different records", () => {
        const rows = [
          makeRow({ id: "s-1", child_name: "Alice", screening_outcome: "Immediate Intervention", safety_plan_in_place: false, risk_assessment_completed: true, social_worker_notified: true }),
          makeRow({ id: "s-2", child_name: "Bob", screening_outcome: "Immediate Intervention", safety_plan_in_place: false, risk_assessment_completed: true, social_worker_notified: true }),
        ];
        const alerts = computeAlerts(rows).filter((a) => a.type === "immediate_intervention_no_safety_plan");
        expect(alerts).toHaveLength(2);
        expect(alerts[0].message).toContain("Alice");
        expect(alerts[1].message).toContain("Bob");
      });
    });

    // ── Alert message content ────────────────────────────────────────────
    describe("alert message content", () => {
      it("critical alert mentions safety plan", () => {
        const rows = [
          makeRow({ id: "s-1", screening_outcome: "Immediate Intervention", safety_plan_in_place: false, risk_assessment_completed: true, social_worker_notified: true }),
        ];
        const alert = computeAlerts(rows).find((a) => a.type === "immediate_intervention_no_safety_plan")!;
        expect(alert.message).toContain("safety plan");
      });
      it("high alert mentions referral", () => {
        const rows = [
          makeRow({ id: "s-1", screening_outcome: "High Risk", referral_made: false, risk_assessment_completed: true, social_worker_notified: true }),
        ];
        const alert = computeAlerts(rows).find((a) => a.type === "high_risk_no_referral")!;
        expect(alert.message).toContain("referral");
      });
      it("no_risk_assessment alert mentions risk assessment", () => {
        const rows = [
          makeRow({ id: "s-1", screening_outcome: "No Concern", risk_assessment_completed: false }),
        ];
        const alert = computeAlerts(rows).find((a) => a.type === "no_risk_assessment")!;
        expect(alert.message).toContain("risk assessment");
      });
      it("social_worker alert mentions social worker", () => {
        const rows = [
          makeRow({ id: "s-1", screening_outcome: "Low Risk", social_worker_notified: false, risk_assessment_completed: true }),
        ];
        const alert = computeAlerts(rows).find((a) => a.type === "social_worker_not_notified")!;
        expect(alert.message).toContain("social worker");
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // 5. computeAriaInsights
  // ═══════════════════════════════════════════════════════════════════════

  describe("computeAriaInsights", () => {
    it("returns 3 insights for empty data", () => {
      const metrics = computeMetrics([]);
      const insights = computeAriaInsights(metrics);
      expect(insights).toHaveLength(3);
    });
    it("returns 3 insights for populated data", () => {
      const rows = [makeRow(), makeRow()];
      const metrics = computeMetrics(rows);
      const insights = computeAriaInsights(metrics);
      expect(insights).toHaveLength(3);
    });
    it("insight 1 starts with [red]", () => {
      const metrics = computeMetrics([]);
      expect(computeAriaInsights(metrics)[0]).toMatch(/^\[red\]/);
    });
    it("insight 2 starts with [amber]", () => {
      const metrics = computeMetrics([]);
      expect(computeAriaInsights(metrics)[1]).toMatch(/^\[amber\]/);
    });
    it("insight 3 starts with [reflect]", () => {
      const metrics = computeMetrics([]);
      expect(computeAriaInsights(metrics)[2]).toMatch(/^\[reflect\]/);
    });
    it("insight 1 contains total screenings count", () => {
      const rows = [makeRow({ id: "1" }), makeRow({ id: "2" })];
      const metrics = computeMetrics(rows);
      const insights = computeAriaInsights(metrics);
      expect(insights[0]).toContain("2 substance misuse screenings");
    });
    it("insight 1 contains unique children count", () => {
      const rows = [makeRow({ id: "1", child_name: "A" }), makeRow({ id: "2", child_name: "B" })];
      const metrics = computeMetrics(rows);
      const insights = computeAriaInsights(metrics);
      expect(insights[0]).toContain("2 children");
    });
    it("insight 1 uses singular child for 1", () => {
      const rows = [makeRow()];
      const metrics = computeMetrics(rows);
      const insights = computeAriaInsights(metrics);
      expect(insights[0]).toContain("1 child");
    });
    it("insight 1 contains high risk count", () => {
      const rows = [makeRow({ id: "1", screening_outcome: "High Risk", referral_made: true, social_worker_notified: true })];
      const metrics = computeMetrics(rows);
      const insights = computeAriaInsights(metrics);
      expect(insights[0]).toContain("1 high risk");
    });
    it("insight 1 contains immediate intervention count", () => {
      const rows = [makeRow({ id: "1", screening_outcome: "Immediate Intervention", safety_plan_in_place: true, social_worker_notified: true })];
      const metrics = computeMetrics(rows);
      const insights = computeAriaInsights(metrics);
      expect(insights[0]).toContain("1 immediate intervention");
    });
    it("insight 1 contains no concern count", () => {
      const rows = [makeRow()];
      const metrics = computeMetrics(rows);
      const insights = computeAriaInsights(metrics);
      expect(insights[0]).toContain("1 no concern");
    });
    it("insight 1 contains referral rate", () => {
      const rows = [makeRow()];
      const metrics = computeMetrics(rows);
      const insights = computeAriaInsights(metrics);
      expect(insights[0]).toContain("Referral rate");
    });
    it("insight 1 contains risk assessment rate", () => {
      const rows = [makeRow()];
      const metrics = computeMetrics(rows);
      const insights = computeAriaInsights(metrics);
      expect(insights[0]).toContain("Risk assessment rate");
    });
    it("insight 2 mentions critical and high alerts when present", () => {
      const rows = [
        makeRow({ id: "1", screening_outcome: "Immediate Intervention", safety_plan_in_place: false, risk_assessment_completed: true, social_worker_notified: true }),
      ];
      const metrics = computeMetrics(rows);
      const alerts = computeAlerts(rows);
      const insights = computeAriaInsights(metrics, alerts);
      expect(insights[1]).toContain("critical");
      expect(insights[1]).toContain("high-priority");
    });
    it("insight 2 shows no concerns when none", () => {
      const rows = [makeRow()];
      const metrics = computeMetrics(rows);
      const insights = computeAriaInsights(metrics, []);
      expect(insights[1]).toContain("No critical or high-priority alerts");
    });
    it("insight 2 contains safety plan rate", () => {
      const rows = [makeRow()];
      const metrics = computeMetrics(rows);
      const insights = computeAriaInsights(metrics);
      expect(insights[1]).toContain("Safety plan rate");
    });
    it("insight 2 contains parental notification rate", () => {
      const rows = [makeRow()];
      const metrics = computeMetrics(rows);
      const insights = computeAriaInsights(metrics);
      expect(insights[1]).toContain("Parental notification rate");
    });
    it("insight 2 contains social worker notification rate", () => {
      const rows = [makeRow()];
      const metrics = computeMetrics(rows);
      const insights = computeAriaInsights(metrics);
      expect(insights[1]).toContain("Social worker notification rate");
    });
    it("insight 3 contains reflective question about substance misuse", () => {
      const metrics = computeMetrics([]);
      const insights = computeAriaInsights(metrics);
      expect(insights[2]).toContain("substance misuse");
    });
    it("insight 3 mentions tailored support", () => {
      const metrics = computeMetrics([]);
      const insights = computeAriaInsights(metrics);
      expect(insights[2]).toContain("tailored support");
    });
    it("insight 3 mentions root causes", () => {
      const metrics = computeMetrics([]);
      const insights = computeAriaInsights(metrics);
      expect(insights[2]).toContain("root causes");
    });
    it("all insights are strings", () => {
      const metrics = computeMetrics([makeRow()]);
      const insights = computeAriaInsights(metrics);
      for (const i of insights) expect(typeof i).toBe("string");
    });
    it("empty array still produces meaningful content", () => {
      const metrics = computeMetrics([]);
      const insights = computeAriaInsights(metrics);
      expect(insights[0]).toContain("0 substance misuse screenings");
      expect(insights[0]).toContain("0 children");
    });
    it("insight 1 for zero screenings shows 0 high risk and 0 immediate intervention", () => {
      const metrics = computeMetrics([]);
      const insights = computeAriaInsights(metrics);
      expect(insights[0]).toContain("0 high risk");
      expect(insights[0]).toContain("0 immediate intervention");
    });
    it("insight 2 with only medium alerts shows no critical or high", () => {
      const rows = [makeRow({ id: "1", screening_outcome: "No Concern", risk_assessment_completed: false })];
      const metrics = computeMetrics(rows);
      const alerts = computeAlerts(rows);
      const insights = computeAriaInsights(metrics, alerts);
      expect(insights[1]).toContain("No critical or high-priority alerts");
    });
    it("insight 3 mentions early warning signs", () => {
      const metrics = computeMetrics([]);
      const insights = computeAriaInsights(metrics);
      expect(insights[2]).toContain("early warning signs");
    });
  });
});
