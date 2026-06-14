// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILD BEREAVEMENT SUPPORT SERVICE TESTS
// Pure-function unit tests for bereavement support metrics computation,
// alert identification, and Cara insight generation.
// CHR 2015 Reg 7 (individual child — understanding each child's needs),
// CHR 2015 Reg 10 (health and wellbeing — emotional wellbeing),
// CHR 2015 Reg 12 (protection of children — safeguarding vulnerable children).
//
// SCCIF: Experiences — "Children feel cared for and listened to."
// "Staff understand and respond to children's emotional needs."
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  DECEASED_RELATIONSHIPS,
  GRIEF_STAGES,
  SUPPORT_TYPES,
  _testing,
} from "../child-bereavement-support-service";

import type {
  ChildBereavementSupportRow,
} from "../child-bereavement-support-service";

const { computeMetrics, computeAlerts, computeCaraInsights } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRow(
  overrides?: Partial<ChildBereavementSupportRow>,
): ChildBereavementSupportRow {
  return {
    id: overrides?.id ?? "r-1",
    home_id: overrides?.home_id ?? "home-1",
    child_name: overrides?.child_name ?? "Child A",
    bereavement_date: overrides?.bereavement_date ?? now.toISOString().split("T")[0],
    deceased_relationship: overrides?.deceased_relationship ?? "Parent",
    grief_stage: overrides?.grief_stage ?? "Not Assessed",
    support_type: overrides?.support_type ?? "Key Worker",
    specialist_referral_made: overrides?.specialist_referral_made ?? false,
    specialist_service:
      "specialist_service" in (overrides ?? {})
        ? (overrides!.specialist_service ?? null)
        : null,
    camhs_involvement: overrides?.camhs_involvement ?? false,
    school_notified: overrides?.school_notified ?? true,
    social_worker_notified: overrides?.social_worker_notified ?? true,
    memorial_activity_planned: overrides?.memorial_activity_planned ?? false,
    ongoing_support_needed: overrides?.ongoing_support_needed ?? true,
    review_date:
      "review_date" in (overrides ?? {})
        ? (overrides!.review_date ?? null)
        : "2025-07-01",
    key_worker_name: overrides?.key_worker_name ?? "D. Laville",
    notes:
      "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(),
    updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("child-bereavement-support-service", () => {
  // ═══════════════════════════════════════════════════════════════════════
  // 1. CONSTANT VALIDATION
  // ═══════════════════════════════════════════════════════════════════════

  describe("DECEASED_RELATIONSHIPS", () => {
    it("has exactly 7 values", () => {
      expect(DECEASED_RELATIONSHIPS).toHaveLength(7);
    });
    it("contains Parent", () => {
      expect(DECEASED_RELATIONSHIPS).toContain("Parent");
    });
    it("contains Sibling", () => {
      expect(DECEASED_RELATIONSHIPS).toContain("Sibling");
    });
    it("contains Grandparent", () => {
      expect(DECEASED_RELATIONSHIPS).toContain("Grandparent");
    });
    it("contains Friend", () => {
      expect(DECEASED_RELATIONSHIPS).toContain("Friend");
    });
    it("contains Carer", () => {
      expect(DECEASED_RELATIONSHIPS).toContain("Carer");
    });
    it("contains Pet", () => {
      expect(DECEASED_RELATIONSHIPS).toContain("Pet");
    });
    it("contains Other", () => {
      expect(DECEASED_RELATIONSHIPS).toContain("Other");
    });
  });

  describe("GRIEF_STAGES", () => {
    it("has exactly 6 values", () => {
      expect(GRIEF_STAGES).toHaveLength(6);
    });
    it("contains Denial", () => {
      expect(GRIEF_STAGES).toContain("Denial");
    });
    it("contains Anger", () => {
      expect(GRIEF_STAGES).toContain("Anger");
    });
    it("contains Bargaining", () => {
      expect(GRIEF_STAGES).toContain("Bargaining");
    });
    it("contains Depression", () => {
      expect(GRIEF_STAGES).toContain("Depression");
    });
    it("contains Acceptance", () => {
      expect(GRIEF_STAGES).toContain("Acceptance");
    });
    it("contains Not Assessed", () => {
      expect(GRIEF_STAGES).toContain("Not Assessed");
    });
  });

  describe("SUPPORT_TYPES", () => {
    it("has exactly 7 values", () => {
      expect(SUPPORT_TYPES).toHaveLength(7);
    });
    it("contains Key Worker", () => {
      expect(SUPPORT_TYPES).toContain("Key Worker");
    });
    it("contains Counselling", () => {
      expect(SUPPORT_TYPES).toContain("Counselling");
    });
    it("contains Specialist Therapy", () => {
      expect(SUPPORT_TYPES).toContain("Specialist Therapy");
    });
    it("contains Group Support", () => {
      expect(SUPPORT_TYPES).toContain("Group Support");
    });
    it("contains Creative Therapy", () => {
      expect(SUPPORT_TYPES).toContain("Creative Therapy");
    });
    it("contains Memory Work", () => {
      expect(SUPPORT_TYPES).toContain("Memory Work");
    });
    it("contains Referral Only", () => {
      expect(SUPPORT_TYPES).toContain("Referral Only");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // 2. makeRow factory
  // ═══════════════════════════════════════════════════════════════════════

  describe("makeRow factory", () => {
    it("produces a valid default row", () => {
      const r = makeRow();
      expect(r.id).toBe("r-1");
      expect(r.child_name).toBe("Child A");
      expect(r.deceased_relationship).toBe("Parent");
    });
    it("overrides child_name", () => {
      expect(makeRow({ child_name: "Zara" }).child_name).toBe("Zara");
    });
    it("defaults grief_stage to Not Assessed", () => {
      expect(makeRow().grief_stage).toBe("Not Assessed");
    });
    it("defaults support_type to Key Worker", () => {
      expect(makeRow().support_type).toBe("Key Worker");
    });
    it("defaults specialist_service to null", () => {
      expect(makeRow().specialist_service).toBeNull();
    });
    it("allows setting specialist_service to a value", () => {
      expect(makeRow({ specialist_service: "Winston's Wish" }).specialist_service).toBe("Winston's Wish");
    });
    it("allows setting specialist_service to null explicitly", () => {
      expect(makeRow({ specialist_service: null }).specialist_service).toBeNull();
    });
    it("defaults notes to null", () => {
      expect(makeRow().notes).toBeNull();
    });
    it("allows overriding notes", () => {
      expect(makeRow({ notes: "test note" }).notes).toBe("test note");
    });
    it("defaults review_date to 2025-07-01", () => {
      expect(makeRow().review_date).toBe("2025-07-01");
    });
    it("allows setting review_date to null explicitly", () => {
      expect(makeRow({ review_date: null }).review_date).toBeNull();
    });
    it("allows overriding review_date to a value", () => {
      expect(makeRow({ review_date: "2025-12-01" }).review_date).toBe("2025-12-01");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // 3. computeMetrics
  // ═══════════════════════════════════════════════════════════════════════

  describe("computeMetrics", () => {
    // ── Empty array ────────────────────────────────────────────────────
    describe("empty records", () => {
      it("returns zero total_records", () => {
        expect(computeMetrics([]).total_records).toBe(0);
      });
      it("returns zero ongoing_support_count", () => {
        expect(computeMetrics([]).ongoing_support_count).toBe(0);
      });
      it("returns zero specialist_referral_count", () => {
        expect(computeMetrics([]).specialist_referral_count).toBe(0);
      });
      it("returns zero camhs_involvement_count", () => {
        expect(computeMetrics([]).camhs_involvement_count).toBe(0);
      });
      it("returns zero school_notification_rate", () => {
        expect(computeMetrics([]).school_notification_rate).toBe(0);
      });
      it("returns zero social_worker_rate", () => {
        expect(computeMetrics([]).social_worker_rate).toBe(0);
      });
      it("returns zero memorial_activity_rate", () => {
        expect(computeMetrics([]).memorial_activity_rate).toBe(0);
      });
      it("returns zero review_scheduled_rate", () => {
        expect(computeMetrics([]).review_scheduled_rate).toBe(0);
      });
      it("returns zero unique_children", () => {
        expect(computeMetrics([]).unique_children).toBe(0);
      });
      it("returns zero unique_key_workers", () => {
        expect(computeMetrics([]).unique_key_workers).toBe(0);
      });
      it("returns empty deceased_relationship_breakdown", () => {
        expect(computeMetrics([]).deceased_relationship_breakdown).toEqual({});
      });
      it("returns empty grief_stage_breakdown", () => {
        expect(computeMetrics([]).grief_stage_breakdown).toEqual({});
      });
      it("returns empty support_type_breakdown", () => {
        expect(computeMetrics([]).support_type_breakdown).toEqual({});
      });
    });

    // ── Single record ──────────────────────────────────────────────────
    describe("single record", () => {
      const single = [makeRow()];

      it("total_records is 1", () => {
        expect(computeMetrics(single).total_records).toBe(1);
      });
      it("ongoing_support_count is 1 when ongoing_support_needed is true", () => {
        expect(computeMetrics(single).ongoing_support_count).toBe(1);
      });
      it("specialist_referral_count is 0 when false", () => {
        expect(computeMetrics(single).specialist_referral_count).toBe(0);
      });
      it("camhs_involvement_count is 0 when false", () => {
        expect(computeMetrics(single).camhs_involvement_count).toBe(0);
      });
      it("school_notification_rate is 100 when notified", () => {
        expect(computeMetrics(single).school_notification_rate).toBe(100);
      });
      it("social_worker_rate is 100 when notified", () => {
        expect(computeMetrics(single).social_worker_rate).toBe(100);
      });
      it("memorial_activity_rate is 0 when not planned", () => {
        expect(computeMetrics(single).memorial_activity_rate).toBe(0);
      });
      it("review_scheduled_rate is 100 when review_date present", () => {
        expect(computeMetrics(single).review_scheduled_rate).toBe(100);
      });
      it("unique_children is 1", () => {
        expect(computeMetrics(single).unique_children).toBe(1);
      });
      it("unique_key_workers is 1", () => {
        expect(computeMetrics(single).unique_key_workers).toBe(1);
      });
      it("deceased_relationship_breakdown groups single record correctly", () => {
        expect(computeMetrics(single).deceased_relationship_breakdown).toEqual({ Parent: 1 });
      });
      it("grief_stage_breakdown groups single record correctly", () => {
        expect(computeMetrics(single).grief_stage_breakdown).toEqual({ "Not Assessed": 1 });
      });
      it("support_type_breakdown groups single record correctly", () => {
        expect(computeMetrics(single).support_type_breakdown).toEqual({ "Key Worker": 1 });
      });
    });

    // ── Multiple records ─────────────────────────────────────────────────
    describe("multiple records", () => {
      const records = [
        makeRow({
          id: "r-1",
          child_name: "Alice",
          deceased_relationship: "Parent",
          grief_stage: "Denial",
          support_type: "Key Worker",
          specialist_referral_made: false,
          camhs_involvement: false,
          school_notified: true,
          social_worker_notified: true,
          memorial_activity_planned: false,
          ongoing_support_needed: true,
          review_date: "2025-07-01",
          key_worker_name: "D. Laville",
        }),
        makeRow({
          id: "r-2",
          child_name: "Bob",
          deceased_relationship: "Sibling",
          grief_stage: "Anger",
          support_type: "Counselling",
          specialist_referral_made: true,
          camhs_involvement: true,
          school_notified: true,
          social_worker_notified: true,
          memorial_activity_planned: true,
          ongoing_support_needed: true,
          review_date: "2025-08-01",
          key_worker_name: "D. Laville",
        }),
        makeRow({
          id: "r-3",
          child_name: "Carol",
          deceased_relationship: "Grandparent",
          grief_stage: "Depression",
          support_type: "Specialist Therapy",
          specialist_referral_made: true,
          camhs_involvement: true,
          school_notified: true,
          social_worker_notified: false,
          memorial_activity_planned: false,
          ongoing_support_needed: true,
          review_date: "2025-09-01",
          key_worker_name: "M. Smith",
        }),
        makeRow({
          id: "r-4",
          child_name: "Dave",
          deceased_relationship: "Friend",
          grief_stage: "Acceptance",
          support_type: "Group Support",
          specialist_referral_made: false,
          camhs_involvement: false,
          school_notified: false,
          social_worker_notified: true,
          memorial_activity_planned: true,
          ongoing_support_needed: false,
          review_date: null,
          key_worker_name: "M. Smith",
        }),
        makeRow({
          id: "r-5",
          child_name: "Eve",
          deceased_relationship: "Pet",
          grief_stage: "Bargaining",
          support_type: "Creative Therapy",
          specialist_referral_made: false,
          camhs_involvement: false,
          school_notified: true,
          social_worker_notified: true,
          memorial_activity_planned: false,
          ongoing_support_needed: true,
          review_date: null,
          key_worker_name: "D. Laville",
        }),
      ];

      it("total_records is 5", () => {
        expect(computeMetrics(records).total_records).toBe(5);
      });
      it("ongoing_support_count is 4", () => {
        expect(computeMetrics(records).ongoing_support_count).toBe(4);
      });
      it("specialist_referral_count is 2", () => {
        expect(computeMetrics(records).specialist_referral_count).toBe(2);
      });
      it("camhs_involvement_count is 2", () => {
        expect(computeMetrics(records).camhs_involvement_count).toBe(2);
      });
      it("school_notification_rate is 80 (4 of 5)", () => {
        expect(computeMetrics(records).school_notification_rate).toBe(80);
      });
      it("social_worker_rate is 80 (4 of 5)", () => {
        expect(computeMetrics(records).social_worker_rate).toBe(80);
      });
      it("memorial_activity_rate is 40 (2 of 5)", () => {
        expect(computeMetrics(records).memorial_activity_rate).toBe(40);
      });
      it("review_scheduled_rate is 60 (3 of 5)", () => {
        expect(computeMetrics(records).review_scheduled_rate).toBe(60);
      });
      it("unique_children is 5", () => {
        expect(computeMetrics(records).unique_children).toBe(5);
      });
      it("unique_key_workers is 2", () => {
        expect(computeMetrics(records).unique_key_workers).toBe(2);
      });
      it("deceased_relationship_breakdown groups correctly", () => {
        expect(computeMetrics(records).deceased_relationship_breakdown).toEqual({
          Parent: 1,
          Sibling: 1,
          Grandparent: 1,
          Friend: 1,
          Pet: 1,
        });
      });
      it("grief_stage_breakdown groups correctly", () => {
        expect(computeMetrics(records).grief_stage_breakdown).toEqual({
          Denial: 1,
          Anger: 1,
          Depression: 1,
          Acceptance: 1,
          Bargaining: 1,
        });
      });
      it("support_type_breakdown groups correctly", () => {
        expect(computeMetrics(records).support_type_breakdown).toEqual({
          "Key Worker": 1,
          Counselling: 1,
          "Specialist Therapy": 1,
          "Group Support": 1,
          "Creative Therapy": 1,
        });
      });
    });

    // ── All deceased relationships ──────────────────────────────────────
    describe("all deceased relationships", () => {
      const allRels = DECEASED_RELATIONSHIPS.map((r, i) =>
        makeRow({ id: `dr-${i}`, deceased_relationship: r }),
      );

      it("deceased_relationship_breakdown has all 7 types", () => {
        const m = computeMetrics(allRels);
        expect(Object.keys(m.deceased_relationship_breakdown)).toHaveLength(7);
      });
      it("each relationship has count 1", () => {
        const m = computeMetrics(allRels);
        for (const r of DECEASED_RELATIONSHIPS) {
          expect(m.deceased_relationship_breakdown[r]).toBe(1);
        }
      });
    });

    // ── All grief stages ─────────────────────────────────────────────────
    describe("all grief stages", () => {
      const allStages = GRIEF_STAGES.map((s, i) =>
        makeRow({ id: `gs-${i}`, grief_stage: s }),
      );

      it("grief_stage_breakdown has all 6 stages", () => {
        const m = computeMetrics(allStages);
        expect(Object.keys(m.grief_stage_breakdown)).toHaveLength(6);
      });
      it("each stage has count 1", () => {
        const m = computeMetrics(allStages);
        for (const s of GRIEF_STAGES) {
          expect(m.grief_stage_breakdown[s]).toBe(1);
        }
      });
    });

    // ── All support types ────────────────────────────────────────────────
    describe("all support types", () => {
      const allTypes = SUPPORT_TYPES.map((t, i) =>
        makeRow({ id: `st-${i}`, support_type: t }),
      );

      it("support_type_breakdown has all 7 types", () => {
        const m = computeMetrics(allTypes);
        expect(Object.keys(m.support_type_breakdown)).toHaveLength(7);
      });
      it("each support type has count 1", () => {
        const m = computeMetrics(allTypes);
        for (const t of SUPPORT_TYPES) {
          expect(m.support_type_breakdown[t]).toBe(1);
        }
      });
    });

    // ── Percentage calculations ──────────────────────────────────────────
    describe("percentage calculations", () => {
      it("school_notification_rate is 100 when all true", () => {
        const rows = [
          makeRow({ id: "1", school_notified: true }),
          makeRow({ id: "2", school_notified: true }),
        ];
        expect(computeMetrics(rows).school_notification_rate).toBe(100);
      });
      it("school_notification_rate is 0 when all false", () => {
        const rows = [
          makeRow({ id: "1", school_notified: false }),
          makeRow({ id: "2", school_notified: false }),
        ];
        expect(computeMetrics(rows).school_notification_rate).toBe(0);
      });
      it("school_notification_rate is 50 for 1 of 2", () => {
        const rows = [
          makeRow({ id: "1", school_notified: true }),
          makeRow({ id: "2", school_notified: false }),
        ];
        expect(computeMetrics(rows).school_notification_rate).toBe(50);
      });
      it("school_notification_rate rounds correctly for 1 of 3 (33.3)", () => {
        const rows = [
          makeRow({ id: "1", school_notified: true }),
          makeRow({ id: "2", school_notified: false }),
          makeRow({ id: "3", school_notified: false }),
        ];
        expect(computeMetrics(rows).school_notification_rate).toBe(33.3);
      });
      it("school_notification_rate rounds correctly for 2 of 3 (66.7)", () => {
        const rows = [
          makeRow({ id: "1", school_notified: true }),
          makeRow({ id: "2", school_notified: true }),
          makeRow({ id: "3", school_notified: false }),
        ];
        expect(computeMetrics(rows).school_notification_rate).toBe(66.7);
      });
      it("social_worker_rate is 100 when all true", () => {
        const rows = [
          makeRow({ id: "1", social_worker_notified: true }),
          makeRow({ id: "2", social_worker_notified: true }),
        ];
        expect(computeMetrics(rows).social_worker_rate).toBe(100);
      });
      it("social_worker_rate is 0 when all false", () => {
        const rows = [
          makeRow({ id: "1", social_worker_notified: false }),
          makeRow({ id: "2", social_worker_notified: false }),
        ];
        expect(computeMetrics(rows).social_worker_rate).toBe(0);
      });
      it("social_worker_rate rounds correctly for 1 of 3 (33.3)", () => {
        const rows = [
          makeRow({ id: "1", social_worker_notified: true }),
          makeRow({ id: "2", social_worker_notified: false }),
          makeRow({ id: "3", social_worker_notified: false }),
        ];
        expect(computeMetrics(rows).social_worker_rate).toBe(33.3);
      });
      it("social_worker_rate rounds correctly for 2 of 3 (66.7)", () => {
        const rows = [
          makeRow({ id: "1", social_worker_notified: true }),
          makeRow({ id: "2", social_worker_notified: true }),
          makeRow({ id: "3", social_worker_notified: false }),
        ];
        expect(computeMetrics(rows).social_worker_rate).toBe(66.7);
      });
      it("memorial_activity_rate is 100 when all true", () => {
        const rows = [
          makeRow({ id: "1", memorial_activity_planned: true }),
          makeRow({ id: "2", memorial_activity_planned: true }),
        ];
        expect(computeMetrics(rows).memorial_activity_rate).toBe(100);
      });
      it("memorial_activity_rate is 0 when all false", () => {
        const rows = [
          makeRow({ id: "1", memorial_activity_planned: false }),
          makeRow({ id: "2", memorial_activity_planned: false }),
        ];
        expect(computeMetrics(rows).memorial_activity_rate).toBe(0);
      });
      it("memorial_activity_rate rounds correctly for 1 of 3 (33.3)", () => {
        const rows = [
          makeRow({ id: "1", memorial_activity_planned: true }),
          makeRow({ id: "2", memorial_activity_planned: false }),
          makeRow({ id: "3", memorial_activity_planned: false }),
        ];
        expect(computeMetrics(rows).memorial_activity_rate).toBe(33.3);
      });
      it("review_scheduled_rate is 100 when all have dates", () => {
        const rows = [
          makeRow({ id: "1", review_date: "2025-07-01" }),
          makeRow({ id: "2", review_date: "2025-08-01" }),
        ];
        expect(computeMetrics(rows).review_scheduled_rate).toBe(100);
      });
      it("review_scheduled_rate is 0 when none have dates", () => {
        const rows = [
          makeRow({ id: "1", review_date: null }),
          makeRow({ id: "2", review_date: null }),
        ];
        expect(computeMetrics(rows).review_scheduled_rate).toBe(0);
      });
      it("review_scheduled_rate rounds correctly for 1 of 3 (33.3)", () => {
        const rows = [
          makeRow({ id: "1", review_date: "2025-07-01" }),
          makeRow({ id: "2", review_date: null }),
          makeRow({ id: "3", review_date: null }),
        ];
        expect(computeMetrics(rows).review_scheduled_rate).toBe(33.3);
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
      it("unique_key_workers deduplicates same key_worker_name", () => {
        const rows = [
          makeRow({ id: "1", key_worker_name: "D. Laville" }),
          makeRow({ id: "2", key_worker_name: "D. Laville" }),
          makeRow({ id: "3", key_worker_name: "M. Smith" }),
        ];
        expect(computeMetrics(rows).unique_key_workers).toBe(2);
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
      it("unique_key_workers counts all distinct names", () => {
        const rows = [
          makeRow({ id: "1", key_worker_name: "X" }),
          makeRow({ id: "2", key_worker_name: "Y" }),
          makeRow({ id: "3", key_worker_name: "Z" }),
        ];
        expect(computeMetrics(rows).unique_key_workers).toBe(3);
      });
    });

    // ── Breakdown maps ───────────────────────────────────────────────────
    describe("breakdown maps", () => {
      it("deceased_relationship_breakdown handles duplicates", () => {
        const rows = [
          makeRow({ id: "1", deceased_relationship: "Parent" }),
          makeRow({ id: "2", deceased_relationship: "Parent" }),
          makeRow({ id: "3", deceased_relationship: "Sibling" }),
        ];
        expect(computeMetrics(rows).deceased_relationship_breakdown).toEqual({
          Parent: 2,
          Sibling: 1,
        });
      });
      it("grief_stage_breakdown handles duplicates", () => {
        const rows = [
          makeRow({ id: "1", grief_stage: "Denial" }),
          makeRow({ id: "2", grief_stage: "Denial" }),
          makeRow({ id: "3", grief_stage: "Anger" }),
        ];
        expect(computeMetrics(rows).grief_stage_breakdown).toEqual({
          Denial: 2,
          Anger: 1,
        });
      });
      it("support_type_breakdown handles duplicates", () => {
        const rows = [
          makeRow({ id: "1", support_type: "Counselling" }),
          makeRow({ id: "2", support_type: "Counselling" }),
          makeRow({ id: "3", support_type: "Key Worker" }),
        ];
        expect(computeMetrics(rows).support_type_breakdown).toEqual({
          Counselling: 2,
          "Key Worker": 1,
        });
      });
      it("support_type_breakdown handles all types", () => {
        const rows = SUPPORT_TYPES.map((t, i) =>
          makeRow({ id: `st-${i}`, support_type: t }),
        );
        const m = computeMetrics(rows);
        expect(Object.keys(m.support_type_breakdown)).toHaveLength(7);
        for (const t of SUPPORT_TYPES) {
          expect(m.support_type_breakdown[t]).toBe(1);
        }
      });
    });

    // ── Edge cases ───────────────────────────────────────────────────────
    describe("edge cases", () => {
      it("counts multiple ongoing_support_needed", () => {
        const rows = [
          makeRow({ id: "1", ongoing_support_needed: true }),
          makeRow({ id: "2", ongoing_support_needed: true }),
          makeRow({ id: "3", ongoing_support_needed: false }),
        ];
        expect(computeMetrics(rows).ongoing_support_count).toBe(2);
      });
      it("counts multiple specialist_referral_made", () => {
        const rows = [
          makeRow({ id: "1", specialist_referral_made: true }),
          makeRow({ id: "2", specialist_referral_made: true }),
          makeRow({ id: "3", specialist_referral_made: false }),
        ];
        expect(computeMetrics(rows).specialist_referral_count).toBe(2);
      });
      it("counts multiple camhs_involvement", () => {
        const rows = [
          makeRow({ id: "1", camhs_involvement: true }),
          makeRow({ id: "2", camhs_involvement: true }),
          makeRow({ id: "3", camhs_involvement: false }),
        ];
        expect(computeMetrics(rows).camhs_involvement_count).toBe(2);
      });
      it("all boolean rates are 100 when all true", () => {
        const rows = [
          makeRow({
            id: "1",
            school_notified: true,
            social_worker_notified: true,
            memorial_activity_planned: true,
            review_date: "2025-08-01",
          }),
        ];
        const m = computeMetrics(rows);
        expect(m.school_notification_rate).toBe(100);
        expect(m.social_worker_rate).toBe(100);
        expect(m.memorial_activity_rate).toBe(100);
        expect(m.review_scheduled_rate).toBe(100);
      });
      it("all boolean rates are 0 when all false/null", () => {
        const rows = [
          makeRow({
            id: "1",
            school_notified: false,
            social_worker_notified: false,
            memorial_activity_planned: false,
            review_date: null,
          }),
        ];
        const m = computeMetrics(rows);
        expect(m.school_notification_rate).toBe(0);
        expect(m.social_worker_rate).toBe(0);
        expect(m.memorial_activity_rate).toBe(0);
        expect(m.review_scheduled_rate).toBe(0);
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
            id: "r-1",
            ongoing_support_needed: true,
            review_date: "2025-07-01",
            grief_stage: "Acceptance",
            specialist_referral_made: true,
            school_notified: true,
            social_worker_notified: true,
          }),
        ];
        expect(computeAlerts(rows)).toEqual([]);
      });
      it("returns empty for Depression with specialist referral", () => {
        const rows = [
          makeRow({
            id: "r-1",
            grief_stage: "Depression",
            specialist_referral_made: true,
            school_notified: true,
            social_worker_notified: true,
            review_date: "2025-07-01",
          }),
        ];
        expect(computeAlerts(rows)).toEqual([]);
      });
      it("returns empty for no ongoing support without review", () => {
        const rows = [
          makeRow({
            id: "r-1",
            ongoing_support_needed: false,
            review_date: null,
            school_notified: true,
            social_worker_notified: true,
          }),
        ];
        expect(computeAlerts(rows)).toEqual([]);
      });
    });

    // ── High: ongoing_support_needed without review_date ────────────────
    describe("ongoing_support_no_review alert", () => {
      it("fires when ongoing_support_needed without review_date", () => {
        const rows = [
          makeRow({
            id: "r-1",
            ongoing_support_needed: true,
            review_date: null,
            school_notified: true,
            social_worker_notified: true,
          }),
        ];
        const found = computeAlerts(rows).find((a) => a.type === "ongoing_support_no_review");
        expect(found).toBeTruthy();
      });
      it("has high severity", () => {
        const rows = [
          makeRow({
            id: "r-1",
            ongoing_support_needed: true,
            review_date: null,
            school_notified: true,
            social_worker_notified: true,
          }),
        ];
        const alert = computeAlerts(rows).find((a) => a.type === "ongoing_support_no_review")!;
        expect(alert.severity).toBe("high");
      });
      it("uses record id as record_id", () => {
        const rows = [
          makeRow({
            id: "r-42",
            ongoing_support_needed: true,
            review_date: null,
            school_notified: true,
            social_worker_notified: true,
          }),
        ];
        const alert = computeAlerts(rows).find((a) => a.type === "ongoing_support_no_review")!;
        expect(alert.record_id).toBe("r-42");
      });
      it("message contains child_name", () => {
        const rows = [
          makeRow({
            id: "r-1",
            child_name: "Bobby Brown",
            ongoing_support_needed: true,
            review_date: null,
            school_notified: true,
            social_worker_notified: true,
          }),
        ];
        const alert = computeAlerts(rows).find((a) => a.type === "ongoing_support_no_review")!;
        expect(alert.message).toContain("Bobby Brown");
      });
      it("message mentions review", () => {
        const rows = [
          makeRow({
            id: "r-1",
            ongoing_support_needed: true,
            review_date: null,
            school_notified: true,
            social_worker_notified: true,
          }),
        ];
        const alert = computeAlerts(rows).find((a) => a.type === "ongoing_support_no_review")!;
        expect(alert.message).toContain("review");
      });
      it("does NOT fire when review_date is set", () => {
        const rows = [
          makeRow({
            id: "r-1",
            ongoing_support_needed: true,
            review_date: "2025-07-01",
            school_notified: true,
            social_worker_notified: true,
          }),
        ];
        expect(computeAlerts(rows).find((a) => a.type === "ongoing_support_no_review")).toBeUndefined();
      });
      it("does NOT fire when ongoing_support_needed is false", () => {
        const rows = [
          makeRow({
            id: "r-1",
            ongoing_support_needed: false,
            review_date: null,
            school_notified: true,
            social_worker_notified: true,
          }),
        ];
        expect(computeAlerts(rows).find((a) => a.type === "ongoing_support_no_review")).toBeUndefined();
      });
      it("fires per record for multiple without review", () => {
        const rows = [
          makeRow({ id: "r-1", ongoing_support_needed: true, review_date: null, school_notified: true, social_worker_notified: true }),
          makeRow({ id: "r-2", ongoing_support_needed: true, review_date: null, school_notified: true, social_worker_notified: true }),
        ];
        const alerts = computeAlerts(rows).filter((a) => a.type === "ongoing_support_no_review");
        expect(alerts).toHaveLength(2);
      });
    });

    // ── High: Depression without specialist referral ─────────────────────
    describe("depression_no_referral alert", () => {
      it("fires when Depression without specialist_referral_made", () => {
        const rows = [
          makeRow({
            id: "r-1",
            grief_stage: "Depression",
            specialist_referral_made: false,
            school_notified: true,
            social_worker_notified: true,
            review_date: "2025-07-01",
          }),
        ];
        const found = computeAlerts(rows).find((a) => a.type === "depression_no_referral");
        expect(found).toBeTruthy();
      });
      it("has high severity", () => {
        const rows = [
          makeRow({
            id: "r-1",
            grief_stage: "Depression",
            specialist_referral_made: false,
            school_notified: true,
            social_worker_notified: true,
            review_date: "2025-07-01",
          }),
        ];
        const alert = computeAlerts(rows).find((a) => a.type === "depression_no_referral")!;
        expect(alert.severity).toBe("high");
      });
      it("uses record id as record_id", () => {
        const rows = [
          makeRow({
            id: "r-99",
            grief_stage: "Depression",
            specialist_referral_made: false,
            school_notified: true,
            social_worker_notified: true,
            review_date: "2025-07-01",
          }),
        ];
        const alert = computeAlerts(rows).find((a) => a.type === "depression_no_referral")!;
        expect(alert.record_id).toBe("r-99");
      });
      it("message contains child_name", () => {
        const rows = [
          makeRow({
            id: "r-1",
            child_name: "Emma White",
            grief_stage: "Depression",
            specialist_referral_made: false,
            school_notified: true,
            social_worker_notified: true,
            review_date: "2025-07-01",
          }),
        ];
        const alert = computeAlerts(rows).find((a) => a.type === "depression_no_referral")!;
        expect(alert.message).toContain("Emma White");
      });
      it("message mentions Depression", () => {
        const rows = [
          makeRow({
            id: "r-1",
            grief_stage: "Depression",
            specialist_referral_made: false,
            school_notified: true,
            social_worker_notified: true,
            review_date: "2025-07-01",
          }),
        ];
        const alert = computeAlerts(rows).find((a) => a.type === "depression_no_referral")!;
        expect(alert.message).toContain("Depression");
      });
      it("message mentions specialist", () => {
        const rows = [
          makeRow({
            id: "r-1",
            grief_stage: "Depression",
            specialist_referral_made: false,
            school_notified: true,
            social_worker_notified: true,
            review_date: "2025-07-01",
          }),
        ];
        const alert = computeAlerts(rows).find((a) => a.type === "depression_no_referral")!;
        expect(alert.message).toContain("specialist");
      });
      it("does NOT fire when specialist_referral_made is true", () => {
        const rows = [
          makeRow({
            id: "r-1",
            grief_stage: "Depression",
            specialist_referral_made: true,
            school_notified: true,
            social_worker_notified: true,
            review_date: "2025-07-01",
          }),
        ];
        expect(computeAlerts(rows).find((a) => a.type === "depression_no_referral")).toBeUndefined();
      });
      it("does NOT fire for Anger without referral", () => {
        const rows = [
          makeRow({
            id: "r-1",
            grief_stage: "Anger",
            specialist_referral_made: false,
            school_notified: true,
            social_worker_notified: true,
            review_date: "2025-07-01",
          }),
        ];
        expect(computeAlerts(rows).find((a) => a.type === "depression_no_referral")).toBeUndefined();
      });
      it("does NOT fire for Denial without referral", () => {
        const rows = [
          makeRow({
            id: "r-1",
            grief_stage: "Denial",
            specialist_referral_made: false,
            school_notified: true,
            social_worker_notified: true,
            review_date: "2025-07-01",
          }),
        ];
        expect(computeAlerts(rows).find((a) => a.type === "depression_no_referral")).toBeUndefined();
      });
      it("does NOT fire for Not Assessed without referral", () => {
        const rows = [
          makeRow({
            id: "r-1",
            grief_stage: "Not Assessed",
            specialist_referral_made: false,
            school_notified: true,
            social_worker_notified: true,
            review_date: "2025-07-01",
          }),
        ];
        expect(computeAlerts(rows).find((a) => a.type === "depression_no_referral")).toBeUndefined();
      });
      it("fires per record for multiple Depression without referral", () => {
        const rows = [
          makeRow({ id: "r-1", grief_stage: "Depression", specialist_referral_made: false, school_notified: true, social_worker_notified: true, review_date: "2025-07-01" }),
          makeRow({ id: "r-2", grief_stage: "Depression", specialist_referral_made: false, school_notified: true, social_worker_notified: true, review_date: "2025-07-01" }),
          makeRow({ id: "r-3", grief_stage: "Depression", specialist_referral_made: true, school_notified: true, social_worker_notified: true, review_date: "2025-07-01" }),
        ];
        const alerts = computeAlerts(rows).filter((a) => a.type === "depression_no_referral");
        expect(alerts).toHaveLength(2);
      });
    });

    // ── Medium: school not notified ──────────────────────────────────────
    describe("school_not_notified alert", () => {
      it("fires when school_notified is false", () => {
        const rows = [
          makeRow({
            id: "r-1",
            school_notified: false,
            social_worker_notified: true,
            review_date: "2025-07-01",
          }),
        ];
        const found = computeAlerts(rows).find((a) => a.type === "school_not_notified");
        expect(found).toBeTruthy();
      });
      it("has medium severity", () => {
        const rows = [
          makeRow({
            id: "r-1",
            school_notified: false,
            social_worker_notified: true,
            review_date: "2025-07-01",
          }),
        ];
        const alert = computeAlerts(rows).find((a) => a.type === "school_not_notified")!;
        expect(alert.severity).toBe("medium");
      });
      it("uses record id as record_id", () => {
        const rows = [
          makeRow({
            id: "r-77",
            school_notified: false,
            social_worker_notified: true,
            review_date: "2025-07-01",
          }),
        ];
        const alert = computeAlerts(rows).find((a) => a.type === "school_not_notified")!;
        expect(alert.record_id).toBe("r-77");
      });
      it("message contains child_name", () => {
        const rows = [
          makeRow({
            id: "r-1",
            child_name: "Tommy Green",
            school_notified: false,
            social_worker_notified: true,
            review_date: "2025-07-01",
          }),
        ];
        const alert = computeAlerts(rows).find((a) => a.type === "school_not_notified")!;
        expect(alert.message).toContain("Tommy Green");
      });
      it("message mentions school", () => {
        const rows = [
          makeRow({
            id: "r-1",
            school_notified: false,
            social_worker_notified: true,
            review_date: "2025-07-01",
          }),
        ];
        const alert = computeAlerts(rows).find((a) => a.type === "school_not_notified")!;
        expect(alert.message).toContain("School");
      });
      it("does NOT fire when school_notified is true", () => {
        const rows = [
          makeRow({
            id: "r-1",
            school_notified: true,
          }),
        ];
        expect(computeAlerts(rows).find((a) => a.type === "school_not_notified")).toBeUndefined();
      });
      it("fires for every row with school not notified", () => {
        const rows = [
          makeRow({ id: "r-1", school_notified: false, social_worker_notified: true, review_date: "2025-07-01" }),
          makeRow({ id: "r-2", school_notified: false, social_worker_notified: true, review_date: "2025-07-01" }),
          makeRow({ id: "r-3", school_notified: true }),
        ];
        const alerts = computeAlerts(rows).filter((a) => a.type === "school_not_notified");
        expect(alerts).toHaveLength(2);
      });
    });

    // ── Medium: social worker not notified ───────────────────────────────
    describe("social_worker_not_notified alert", () => {
      it("fires when social_worker_notified is false", () => {
        const rows = [
          makeRow({
            id: "r-1",
            social_worker_notified: false,
            school_notified: true,
            review_date: "2025-07-01",
          }),
        ];
        const found = computeAlerts(rows).find((a) => a.type === "social_worker_not_notified");
        expect(found).toBeTruthy();
      });
      it("has medium severity", () => {
        const rows = [
          makeRow({
            id: "r-1",
            social_worker_notified: false,
            school_notified: true,
            review_date: "2025-07-01",
          }),
        ];
        const alert = computeAlerts(rows).find((a) => a.type === "social_worker_not_notified")!;
        expect(alert.severity).toBe("medium");
      });
      it("uses record id as record_id", () => {
        const rows = [
          makeRow({
            id: "r-55",
            social_worker_notified: false,
            school_notified: true,
            review_date: "2025-07-01",
          }),
        ];
        const alert = computeAlerts(rows).find((a) => a.type === "social_worker_not_notified")!;
        expect(alert.record_id).toBe("r-55");
      });
      it("message contains child_name", () => {
        const rows = [
          makeRow({
            id: "r-1",
            child_name: "Sarah Jones",
            social_worker_notified: false,
            school_notified: true,
            review_date: "2025-07-01",
          }),
        ];
        const alert = computeAlerts(rows).find((a) => a.type === "social_worker_not_notified")!;
        expect(alert.message).toContain("Sarah Jones");
      });
      it("message mentions social worker", () => {
        const rows = [
          makeRow({
            id: "r-1",
            social_worker_notified: false,
            school_notified: true,
            review_date: "2025-07-01",
          }),
        ];
        const alert = computeAlerts(rows).find((a) => a.type === "social_worker_not_notified")!;
        expect(alert.message).toContain("Social worker");
      });
      it("does NOT fire when social_worker_notified is true", () => {
        const rows = [
          makeRow({
            id: "r-1",
            social_worker_notified: true,
          }),
        ];
        expect(computeAlerts(rows).find((a) => a.type === "social_worker_not_notified")).toBeUndefined();
      });
      it("fires for every row with social worker not notified", () => {
        const rows = [
          makeRow({ id: "r-1", social_worker_notified: false, school_notified: true, review_date: "2025-07-01" }),
          makeRow({ id: "r-2", social_worker_notified: false, school_notified: true, review_date: "2025-07-01" }),
          makeRow({ id: "r-3", social_worker_notified: true }),
        ];
        const alerts = computeAlerts(rows).filter((a) => a.type === "social_worker_not_notified");
        expect(alerts).toHaveLength(2);
      });
    });

    // ── Multiple alert types simultaneously ──────────────────────────────
    describe("combined alert scenarios", () => {
      it("can fire all four alert types simultaneously", () => {
        const rows = [
          makeRow({
            id: "r-1",
            ongoing_support_needed: true,
            review_date: null,
            grief_stage: "Depression",
            specialist_referral_made: false,
            school_notified: false,
            social_worker_notified: false,
          }),
        ];
        const alerts = computeAlerts(rows);
        const types = alerts.map((a) => a.type);
        expect(types).toContain("ongoing_support_no_review");
        expect(types).toContain("depression_no_referral");
        expect(types).toContain("school_not_notified");
        expect(types).toContain("social_worker_not_notified");
      });
      it("fires both high alerts alongside medium alerts", () => {
        const rows = [
          makeRow({
            id: "r-1",
            ongoing_support_needed: true,
            review_date: null,
            grief_stage: "Depression",
            specialist_referral_made: false,
            school_notified: false,
            social_worker_notified: false,
          }),
        ];
        const alerts = computeAlerts(rows);
        const highAlerts = alerts.filter((a) => a.severity === "high");
        const mediumAlerts = alerts.filter((a) => a.severity === "medium");
        expect(highAlerts).toHaveLength(2);
        expect(mediumAlerts).toHaveLength(2);
      });
      it("returns alerts in correct order: high (ongoing), high (depression), medium (school), medium (sw)", () => {
        const rows = [
          makeRow({
            id: "r-1",
            ongoing_support_needed: true,
            review_date: null,
            grief_stage: "Depression",
            specialist_referral_made: false,
            school_notified: false,
            social_worker_notified: false,
          }),
        ];
        const alerts = computeAlerts(rows);
        const types = alerts.map((a) => a.type);
        const ongoingIdx = types.indexOf("ongoing_support_no_review");
        const depressionIdx = types.indexOf("depression_no_referral");
        const schoolIdx = types.indexOf("school_not_notified");
        const swIdx = types.indexOf("social_worker_not_notified");
        expect(ongoingIdx).toBeLessThan(depressionIdx);
        expect(depressionIdx).toBeLessThan(schoolIdx);
        expect(schoolIdx).toBeLessThan(swIdx);
      });
      it("returns no alerts for well-managed records", () => {
        const rows = [
          makeRow({
            id: "r-1",
            ongoing_support_needed: true,
            review_date: "2025-07-01",
            grief_stage: "Acceptance",
            specialist_referral_made: true,
            school_notified: true,
            social_worker_notified: true,
          }),
          makeRow({
            id: "r-2",
            ongoing_support_needed: false,
            review_date: null,
            grief_stage: "Denial",
            specialist_referral_made: false,
            school_notified: true,
            social_worker_notified: true,
          }),
        ];
        expect(computeAlerts(rows)).toEqual([]);
      });
      it("generates multiple alerts of same type for different records", () => {
        const rows = [
          makeRow({ id: "r-1", child_name: "Alice", ongoing_support_needed: true, review_date: null, school_notified: true, social_worker_notified: true }),
          makeRow({ id: "r-2", child_name: "Bob", ongoing_support_needed: true, review_date: null, school_notified: true, social_worker_notified: true }),
        ];
        const alerts = computeAlerts(rows).filter((a) => a.type === "ongoing_support_no_review");
        expect(alerts).toHaveLength(2);
        expect(alerts[0].message).toContain("Alice");
        expect(alerts[1].message).toContain("Bob");
      });
    });

    // ── Alert message content ────────────────────────────────────────────
    describe("alert message content", () => {
      it("ongoing_support alert mentions bereavement", () => {
        const rows = [
          makeRow({ id: "r-1", ongoing_support_needed: true, review_date: null, school_notified: true, social_worker_notified: true }),
        ];
        const alert = computeAlerts(rows).find((a) => a.type === "ongoing_support_no_review")!;
        expect(alert.message).toContain("bereavement");
      });
      it("depression alert mentions referral", () => {
        const rows = [
          makeRow({ id: "r-1", grief_stage: "Depression", specialist_referral_made: false, school_notified: true, social_worker_notified: true, review_date: "2025-07-01" }),
        ];
        const alert = computeAlerts(rows).find((a) => a.type === "depression_no_referral")!;
        expect(alert.message).toContain("referral");
      });
      it("school alert mentions educational setting", () => {
        const rows = [
          makeRow({ id: "r-1", school_notified: false, social_worker_notified: true, review_date: "2025-07-01" }),
        ];
        const alert = computeAlerts(rows).find((a) => a.type === "school_not_notified")!;
        expect(alert.message).toContain("educational");
      });
      it("social worker alert mentions multi-agency", () => {
        const rows = [
          makeRow({ id: "r-1", social_worker_notified: false, school_notified: true, review_date: "2025-07-01" }),
        ];
        const alert = computeAlerts(rows).find((a) => a.type === "social_worker_not_notified")!;
        expect(alert.message).toContain("multi-agency");
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // 5. computeCaraInsights
  // ═══════════════════════════════════════════════════════════════════════

  describe("computeCaraInsights", () => {
    it("returns 3 insights for empty data", () => {
      const metrics = computeMetrics([]);
      const insights = computeCaraInsights(metrics);
      expect(insights).toHaveLength(3);
    });
    it("returns 3 insights for populated data", () => {
      const rows = [makeRow(), makeRow({ id: "r-2" })];
      const metrics = computeMetrics(rows);
      const insights = computeCaraInsights(metrics);
      expect(insights).toHaveLength(3);
    });
    it("insight 1 starts with [red]", () => {
      const metrics = computeMetrics([]);
      expect(computeCaraInsights(metrics)[0]).toMatch(/^\[red\]/);
    });
    it("insight 2 starts with [amber]", () => {
      const metrics = computeMetrics([]);
      expect(computeCaraInsights(metrics)[1]).toMatch(/^\[amber\]/);
    });
    it("insight 3 starts with [reflect]", () => {
      const metrics = computeMetrics([]);
      expect(computeCaraInsights(metrics)[2]).toMatch(/^\[reflect\]/);
    });
    it("insight 1 contains total records count", () => {
      const rows = [makeRow({ id: "1" }), makeRow({ id: "2" })];
      const metrics = computeMetrics(rows);
      const insights = computeCaraInsights(metrics);
      expect(insights[0]).toContain("2 bereavement support records");
    });
    it("insight 1 uses singular record for 1", () => {
      const rows = [makeRow()];
      const metrics = computeMetrics(rows);
      const insights = computeCaraInsights(metrics);
      expect(insights[0]).toContain("1 bereavement support record ");
    });
    it("insight 1 contains unique children count", () => {
      const rows = [makeRow({ id: "1", child_name: "A" }), makeRow({ id: "2", child_name: "B" })];
      const metrics = computeMetrics(rows);
      const insights = computeCaraInsights(metrics);
      expect(insights[0]).toContain("2 children");
    });
    it("insight 1 uses singular child for 1", () => {
      const rows = [makeRow()];
      const metrics = computeMetrics(rows);
      const insights = computeCaraInsights(metrics);
      expect(insights[0]).toContain("1 child");
    });
    it("insight 1 contains ongoing support count", () => {
      const rows = [makeRow({ id: "1", ongoing_support_needed: true })];
      const metrics = computeMetrics(rows);
      const insights = computeCaraInsights(metrics);
      expect(insights[0]).toContain("1 ongoing support");
    });
    it("insight 1 contains specialist referrals count", () => {
      const rows = [makeRow({ id: "1", specialist_referral_made: true })];
      const metrics = computeMetrics(rows);
      const insights = computeCaraInsights(metrics);
      expect(insights[0]).toContain("1 specialist referrals");
    });
    it("insight 1 contains CAMHS involvement count", () => {
      const rows = [makeRow({ id: "1", camhs_involvement: true })];
      const metrics = computeMetrics(rows);
      const insights = computeCaraInsights(metrics);
      expect(insights[0]).toContain("1 CAMHS involvement");
    });
    it("insight 1 contains school notification rate", () => {
      const rows = [makeRow()];
      const metrics = computeMetrics(rows);
      const insights = computeCaraInsights(metrics);
      expect(insights[0]).toContain("School notification rate");
    });
    it("insight 1 contains social worker rate", () => {
      const rows = [makeRow()];
      const metrics = computeMetrics(rows);
      const insights = computeCaraInsights(metrics);
      expect(insights[0]).toContain("Social worker rate");
    });
    it("insight 2 mentions high-priority when present", () => {
      const rows = [
        makeRow({ id: "1", ongoing_support_needed: true, review_date: null, school_notified: true, social_worker_notified: true }),
      ];
      const metrics = computeMetrics(rows);
      const alerts = computeAlerts(rows);
      const insights = computeCaraInsights(metrics, alerts);
      expect(insights[1]).toContain("high-priority");
    });
    it("insight 2 shows no concerns when none", () => {
      const rows = [makeRow()];
      const metrics = computeMetrics(rows);
      const insights = computeCaraInsights(metrics, []);
      expect(insights[1]).toContain("No high-priority alerts");
    });
    it("insight 2 contains memorial activity rate", () => {
      const rows = [makeRow()];
      const metrics = computeMetrics(rows);
      const insights = computeCaraInsights(metrics);
      expect(insights[1]).toContain("Memorial activity rate");
    });
    it("insight 2 contains review scheduled rate", () => {
      const rows = [makeRow()];
      const metrics = computeMetrics(rows);
      const insights = computeCaraInsights(metrics);
      expect(insights[1]).toContain("Review scheduled rate");
    });
    it("insight 3 contains reflective question about bereavement", () => {
      const metrics = computeMetrics([]);
      const insights = computeCaraInsights(metrics);
      expect(insights[2]).toContain("bereavement");
    });
    it("insight 3 mentions sensitivity", () => {
      const metrics = computeMetrics([]);
      const insights = computeCaraInsights(metrics);
      expect(insights[2]).toContain("sensitivity");
    });
    it("insight 3 mentions grief journey", () => {
      const metrics = computeMetrics([]);
      const insights = computeCaraInsights(metrics);
      expect(insights[2]).toContain("grief journey");
    });
    it("insight 3 mentions emotions", () => {
      const metrics = computeMetrics([]);
      const insights = computeCaraInsights(metrics);
      expect(insights[2]).toContain("emotions");
    });
    it("all insights are strings", () => {
      const metrics = computeMetrics([makeRow()]);
      const insights = computeCaraInsights(metrics);
      for (const i of insights) expect(typeof i).toBe("string");
    });
    it("empty array still produces meaningful content", () => {
      const metrics = computeMetrics([]);
      const insights = computeCaraInsights(metrics);
      expect(insights[0]).toContain("0 bereavement support records");
      expect(insights[0]).toContain("0 children");
    });
    it("insight 1 for zero records shows 0 ongoing support", () => {
      const metrics = computeMetrics([]);
      const insights = computeCaraInsights(metrics);
      expect(insights[0]).toContain("0 ongoing support");
    });
    it("insight 1 for zero records shows 0 specialist referrals", () => {
      const metrics = computeMetrics([]);
      const insights = computeCaraInsights(metrics);
      expect(insights[0]).toContain("0 specialist referrals");
    });
    it("insight 1 for zero records shows 0 CAMHS involvement", () => {
      const metrics = computeMetrics([]);
      const insights = computeCaraInsights(metrics);
      expect(insights[0]).toContain("0 CAMHS involvement");
    });
    it("insight 2 with only medium alerts shows no high-priority", () => {
      const rows = [makeRow({ id: "1", school_notified: false, social_worker_notified: true, review_date: "2025-07-01" })];
      const metrics = computeMetrics(rows);
      const alerts = computeAlerts(rows);
      const insights = computeCaraInsights(metrics, alerts);
      expect(insights[1]).toContain("No high-priority alerts");
    });
    it("insight 2 counts high and medium alerts correctly", () => {
      const rows = [
        makeRow({ id: "1", ongoing_support_needed: true, review_date: null, school_notified: false, social_worker_notified: false }),
      ];
      const metrics = computeMetrics(rows);
      const alerts = computeAlerts(rows);
      const insights = computeCaraInsights(metrics, alerts);
      expect(insights[1]).toContain("1 high-priority");
      expect(insights[1]).toContain("2 medium-priority");
    });
    it("insight 3 mentions pace", () => {
      const metrics = computeMetrics([]);
      const insights = computeCaraInsights(metrics);
      expect(insights[2]).toContain("pace");
    });
  });
});
