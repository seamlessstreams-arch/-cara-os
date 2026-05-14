import { describe, it, expect } from "vitest";
import { _testing, type CleaningScheduleRecord } from "../cleaning-schedule-service";

const { computeCleaningMetrics, identifyCleaningAlerts } = _testing;

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRecord(overrides?: Partial<CleaningScheduleRecord>): CleaningScheduleRecord {
  return {
    id: overrides?.id ?? "c-1",
    home_id: overrides?.home_id ?? "home-1",
    cleaning_type: overrides?.cleaning_type ?? "daily_routine",
    cleaning_standard: overrides?.cleaning_standard ?? "good",
    area_cleaned: overrides?.area_cleaned ?? "kitchen",
    hygiene_risk: overrides?.hygiene_risk ?? "none",
    cleaning_date: overrides?.cleaning_date ?? now.toISOString().split("T")[0],
    area_name: overrides?.area_name ?? "Kitchen A",
    cleaning_products_safe: overrides?.cleaning_products_safe ?? true,
    products_stored_safely: overrides?.products_stored_safely ?? true,
    coshh_compliant: overrides?.coshh_compliant ?? true,
    children_involved: overrides?.children_involved ?? false,
    gloves_worn: overrides?.gloves_worn ?? true,
    ventilation_adequate: overrides?.ventilation_adequate ?? true,
    surfaces_sanitised: overrides?.surfaces_sanitised ?? true,
    waste_disposed_correctly: overrides?.waste_disposed_correctly ?? true,
    sharps_disposed_safely: overrides?.sharps_disposed_safely ?? true,
    hand_washing_available: overrides?.hand_washing_available ?? true,
    issues_found: overrides?.issues_found ?? [],
    actions_taken: overrides?.actions_taken ?? [],
    cleaned_by: overrides?.cleaned_by ?? "Staff A",
    inspected_by: "inspected_by" in (overrides ?? {}) ? (overrides!.inspected_by ?? null) : null,
    next_clean_date: "next_clean_date" in (overrides ?? {}) ? (overrides!.next_clean_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(),
    updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("cleaning-schedule-service", () => {
  // ── computeCleaningMetrics ──────────────────────────────────────────

  describe("computeCleaningMetrics", () => {
    describe("empty records", () => {
      it("returns zeros for all fields", () => {
        const m = computeCleaningMetrics([]);
        expect(m.total_cleans).toBe(0);
        expect(m.excellent_count).toBe(0);
        expect(m.good_count).toBe(0);
        expect(m.below_standard_count).toBe(0);
        expect(m.unacceptable_count).toBe(0);
        expect(m.acceptable_rate).toBe(0);
        expect(m.daily_routine_count).toBe(0);
        expect(m.deep_clean_count).toBe(0);
        expect(m.coshh_compliant_rate).toBe(0);
        expect(m.products_safe_rate).toBe(0);
        expect(m.surfaces_sanitised_rate).toBe(0);
        expect(m.waste_disposed_rate).toBe(0);
        expect(m.hand_washing_rate).toBe(0);
        expect(m.ventilation_rate).toBe(0);
        expect(m.high_risk_count).toBe(0);
        expect(m.children_involved_count).toBe(0);
      });

      it("returns empty breakdowns", () => {
        const m = computeCleaningMetrics([]);
        expect(m.by_cleaning_type).toEqual({});
        expect(m.by_cleaning_standard).toEqual({});
        expect(m.by_area_cleaned).toEqual({});
        expect(m.by_hygiene_risk).toEqual({});
      });
    });

    describe("single record defaults", () => {
      it("returns correct counts", () => {
        const m = computeCleaningMetrics([makeRecord()]);
        expect(m.total_cleans).toBe(1);
        expect(m.good_count).toBe(1);
        expect(m.excellent_count).toBe(0);
        expect(m.below_standard_count).toBe(0);
        expect(m.unacceptable_count).toBe(0);
        expect(m.daily_routine_count).toBe(1);
        expect(m.deep_clean_count).toBe(0);
        expect(m.high_risk_count).toBe(0);
        expect(m.children_involved_count).toBe(0);
      });

      it("returns 100% acceptable rate for good standard", () => {
        const m = computeCleaningMetrics([makeRecord()]);
        expect(m.acceptable_rate).toBe(100);
      });

      it("returns 100% for all boolean rates with defaults", () => {
        const m = computeCleaningMetrics([makeRecord()]);
        expect(m.coshh_compliant_rate).toBe(100);
        expect(m.products_safe_rate).toBe(100);
        expect(m.surfaces_sanitised_rate).toBe(100);
        expect(m.waste_disposed_rate).toBe(100);
        expect(m.hand_washing_rate).toBe(100);
        expect(m.ventilation_rate).toBe(100);
      });
    });

    describe("cleaning standard counting", () => {
      it("counts excellent", () => {
        const m = computeCleaningMetrics([makeRecord({ cleaning_standard: "excellent" })]);
        expect(m.excellent_count).toBe(1);
      });

      it("counts good", () => {
        const m = computeCleaningMetrics([makeRecord({ cleaning_standard: "good" })]);
        expect(m.good_count).toBe(1);
      });

      it("counts below_standard", () => {
        const m = computeCleaningMetrics([makeRecord({ cleaning_standard: "below_standard" })]);
        expect(m.below_standard_count).toBe(1);
      });

      it("counts unacceptable", () => {
        const m = computeCleaningMetrics([makeRecord({ cleaning_standard: "unacceptable" })]);
        expect(m.unacceptable_count).toBe(1);
      });

      it("counts acceptable", () => {
        const m = computeCleaningMetrics([makeRecord({ cleaning_standard: "acceptable" })]);
        expect(m.acceptable_rate).toBe(100);
      });
    });

    describe("acceptable_rate", () => {
      it("includes excellent, good, acceptable", () => {
        const records = [
          makeRecord({ cleaning_standard: "excellent" }),
          makeRecord({ cleaning_standard: "good" }),
          makeRecord({ cleaning_standard: "acceptable" }),
          makeRecord({ cleaning_standard: "below_standard" }),
        ];
        const m = computeCleaningMetrics(records);
        expect(m.acceptable_rate).toBe(75);
      });

      it("returns 0 when all below standard or unacceptable", () => {
        const records = [
          makeRecord({ cleaning_standard: "below_standard" }),
          makeRecord({ cleaning_standard: "unacceptable" }),
        ];
        const m = computeCleaningMetrics(records);
        expect(m.acceptable_rate).toBe(0);
      });

      it("rounds to 1 decimal", () => {
        const records = [
          makeRecord({ cleaning_standard: "excellent" }),
          makeRecord({ cleaning_standard: "below_standard" }),
          makeRecord({ cleaning_standard: "below_standard" }),
        ];
        const m = computeCleaningMetrics(records);
        expect(m.acceptable_rate).toBe(33.3);
      });
    });

    describe("cleaning type counting", () => {
      it("counts daily_routine", () => {
        const m = computeCleaningMetrics([makeRecord({ cleaning_type: "daily_routine" })]);
        expect(m.daily_routine_count).toBe(1);
      });

      it("counts weekly_deep_clean as deep clean", () => {
        const m = computeCleaningMetrics([makeRecord({ cleaning_type: "weekly_deep_clean" })]);
        expect(m.deep_clean_count).toBe(1);
      });

      it("counts monthly_deep_clean as deep clean", () => {
        const m = computeCleaningMetrics([makeRecord({ cleaning_type: "monthly_deep_clean" })]);
        expect(m.deep_clean_count).toBe(1);
      });

      it("counts both deep clean types together", () => {
        const records = [
          makeRecord({ cleaning_type: "weekly_deep_clean" }),
          makeRecord({ cleaning_type: "monthly_deep_clean" }),
        ];
        const m = computeCleaningMetrics(records);
        expect(m.deep_clean_count).toBe(2);
      });

      it("does not count kitchen_clean as deep clean", () => {
        const m = computeCleaningMetrics([makeRecord({ cleaning_type: "kitchen_clean" })]);
        expect(m.deep_clean_count).toBe(0);
      });
    });

    describe("hygiene risk counting", () => {
      it("counts high risk", () => {
        const m = computeCleaningMetrics([makeRecord({ hygiene_risk: "high" })]);
        expect(m.high_risk_count).toBe(1);
      });

      it("counts critical risk", () => {
        const m = computeCleaningMetrics([makeRecord({ hygiene_risk: "critical" })]);
        expect(m.high_risk_count).toBe(1);
      });

      it("counts both high and critical", () => {
        const records = [
          makeRecord({ hygiene_risk: "high" }),
          makeRecord({ hygiene_risk: "critical" }),
        ];
        const m = computeCleaningMetrics(records);
        expect(m.high_risk_count).toBe(2);
      });

      it("does not count medium risk", () => {
        const m = computeCleaningMetrics([makeRecord({ hygiene_risk: "medium" })]);
        expect(m.high_risk_count).toBe(0);
      });

      it("does not count low risk", () => {
        const m = computeCleaningMetrics([makeRecord({ hygiene_risk: "low" })]);
        expect(m.high_risk_count).toBe(0);
      });

      it("does not count none risk", () => {
        const m = computeCleaningMetrics([makeRecord({ hygiene_risk: "none" })]);
        expect(m.high_risk_count).toBe(0);
      });
    });

    describe("children_involved_count", () => {
      it("counts when true", () => {
        const m = computeCleaningMetrics([makeRecord({ children_involved: true })]);
        expect(m.children_involved_count).toBe(1);
      });

      it("does not count when false", () => {
        const m = computeCleaningMetrics([makeRecord({ children_involved: false })]);
        expect(m.children_involved_count).toBe(0);
      });
    });

    describe("boolean rates", () => {
      it("coshh_compliant_rate 0 when false", () => {
        const m = computeCleaningMetrics([makeRecord({ coshh_compliant: false })]);
        expect(m.coshh_compliant_rate).toBe(0);
      });

      it("products_safe_rate 0 when false", () => {
        const m = computeCleaningMetrics([makeRecord({ cleaning_products_safe: false })]);
        expect(m.products_safe_rate).toBe(0);
      });

      it("surfaces_sanitised_rate 0 when false", () => {
        const m = computeCleaningMetrics([makeRecord({ surfaces_sanitised: false })]);
        expect(m.surfaces_sanitised_rate).toBe(0);
      });

      it("waste_disposed_rate 0 when false", () => {
        const m = computeCleaningMetrics([makeRecord({ waste_disposed_correctly: false })]);
        expect(m.waste_disposed_rate).toBe(0);
      });

      it("hand_washing_rate 0 when false", () => {
        const m = computeCleaningMetrics([makeRecord({ hand_washing_available: false })]);
        expect(m.hand_washing_rate).toBe(0);
      });

      it("ventilation_rate 0 when false", () => {
        const m = computeCleaningMetrics([makeRecord({ ventilation_adequate: false })]);
        expect(m.ventilation_rate).toBe(0);
      });

      it("calculates mixed boolean rates correctly", () => {
        const records = [
          makeRecord({ coshh_compliant: true }),
          makeRecord({ coshh_compliant: false }),
          makeRecord({ coshh_compliant: true }),
        ];
        const m = computeCleaningMetrics(records);
        expect(m.coshh_compliant_rate).toBe(66.7);
      });
    });

    describe("by_cleaning_type breakdown", () => {
      it("counts all 10 cleaning types", () => {
        const types = [
          "daily_routine", "weekly_deep_clean", "monthly_deep_clean", "quarterly_audit",
          "kitchen_clean", "bathroom_clean", "bedroom_clean", "communal_area",
          "infection_clean", "other",
        ] as const;
        const records = types.map((t) => makeRecord({ cleaning_type: t }));
        const m = computeCleaningMetrics(records);
        for (const t of types) expect(m.by_cleaning_type[t]).toBe(1);
      });
    });

    describe("by_cleaning_standard breakdown", () => {
      it("counts all 5 standards", () => {
        const standards = ["excellent", "good", "acceptable", "below_standard", "unacceptable"] as const;
        const records = standards.map((s) => makeRecord({ cleaning_standard: s }));
        const m = computeCleaningMetrics(records);
        for (const s of standards) expect(m.by_cleaning_standard[s]).toBe(1);
      });
    });

    describe("by_area_cleaned breakdown", () => {
      it("counts all 10 areas", () => {
        const areas = [
          "kitchen", "bathroom", "bedroom", "lounge", "dining_room",
          "hallway", "office", "laundry_room", "garden", "other",
        ] as const;
        const records = areas.map((a) => makeRecord({ area_cleaned: a }));
        const m = computeCleaningMetrics(records);
        for (const a of areas) expect(m.by_area_cleaned[a]).toBe(1);
      });
    });

    describe("by_hygiene_risk breakdown", () => {
      it("counts all 5 risk levels", () => {
        const risks = ["none", "low", "medium", "high", "critical"] as const;
        const records = risks.map((r) => makeRecord({ hygiene_risk: r }));
        const m = computeCleaningMetrics(records);
        for (const r of risks) expect(m.by_hygiene_risk[r]).toBe(1);
      });
    });
  });

  // ── identifyCleaningAlerts ──────────────────────────────────────────

  describe("identifyCleaningAlerts", () => {
    describe("no alerts", () => {
      it("returns empty for clean records", () => {
        const alerts = identifyCleaningAlerts([makeRecord()]);
        expect(alerts).toEqual([]);
      });

      it("returns empty for empty records", () => {
        const alerts = identifyCleaningAlerts([]);
        expect(alerts).toEqual([]);
      });
    });

    describe("critical_hygiene alert", () => {
      it("fires for critical hygiene risk", () => {
        const alerts = identifyCleaningAlerts([
          makeRecord({ hygiene_risk: "critical", area_name: "Kitchen B", cleaning_date: "2026-05-14" }),
        ]);
        expect(alerts).toHaveLength(1);
        expect(alerts[0].type).toBe("critical_hygiene");
        expect(alerts[0].severity).toBe("critical");
        expect(alerts[0].message).toContain("Kitchen B");
        expect(alerts[0].message).toContain("2026-05-14");
        expect(alerts[0].message).toContain("immediate deep clean required");
      });

      it("fires per-record for multiple critical risks", () => {
        const alerts = identifyCleaningAlerts([
          makeRecord({ id: "c-1", hygiene_risk: "critical", area_name: "Kitchen" }),
          makeRecord({ id: "c-2", hygiene_risk: "critical", area_name: "Bathroom" }),
        ]);
        const critical = alerts.filter((a) => a.type === "critical_hygiene");
        expect(critical).toHaveLength(2);
        expect(critical[0].id).toBe("c-1");
        expect(critical[1].id).toBe("c-2");
      });

      it("does not fire for high risk", () => {
        const alerts = identifyCleaningAlerts([makeRecord({ hygiene_risk: "high" })]);
        const critical = alerts.filter((a) => a.type === "critical_hygiene");
        expect(critical).toHaveLength(0);
      });
    });

    describe("unacceptable_standard alert", () => {
      it("fires for 1 unacceptable", () => {
        const alerts = identifyCleaningAlerts([makeRecord({ cleaning_standard: "unacceptable" })]);
        const a = alerts.find((x) => x.type === "unacceptable_standard");
        expect(a).toBeDefined();
        expect(a!.severity).toBe("high");
        expect(a!.message).toContain("1 area has");
      });

      it("uses plural for 2+", () => {
        const alerts = identifyCleaningAlerts([
          makeRecord({ cleaning_standard: "unacceptable" }),
          makeRecord({ cleaning_standard: "unacceptable" }),
        ]);
        const a = alerts.find((x) => x.type === "unacceptable_standard");
        expect(a!.message).toContain("2 areas have");
      });

      it("does not fire for below_standard", () => {
        const alerts = identifyCleaningAlerts([makeRecord({ cleaning_standard: "below_standard" })]);
        const a = alerts.find((x) => x.type === "unacceptable_standard");
        expect(a).toBeUndefined();
      });
    });

    describe("coshh_non_compliant alert", () => {
      it("does not fire for 1 non-compliant", () => {
        const alerts = identifyCleaningAlerts([makeRecord({ coshh_compliant: false })]);
        const a = alerts.find((x) => x.type === "coshh_non_compliant");
        expect(a).toBeUndefined();
      });

      it("fires for 2 non-compliant", () => {
        const alerts = identifyCleaningAlerts([
          makeRecord({ coshh_compliant: false }),
          makeRecord({ coshh_compliant: false }),
        ]);
        const a = alerts.find((x) => x.type === "coshh_non_compliant");
        expect(a).toBeDefined();
        expect(a!.severity).toBe("high");
        expect(a!.message).toContain("2 cleans not COSHH compliant");
      });

      it("fires for 3 non-compliant", () => {
        const alerts = identifyCleaningAlerts([
          makeRecord({ coshh_compliant: false }),
          makeRecord({ coshh_compliant: false }),
          makeRecord({ coshh_compliant: false }),
        ]);
        const a = alerts.find((x) => x.type === "coshh_non_compliant");
        expect(a!.message).toContain("3 cleans");
      });
    });

    describe("unsafe_storage alert", () => {
      it("does not fire for 1 unsafe", () => {
        const alerts = identifyCleaningAlerts([makeRecord({ products_stored_safely: false })]);
        const a = alerts.find((x) => x.type === "unsafe_storage");
        expect(a).toBeUndefined();
      });

      it("fires for 2 unsafe", () => {
        const alerts = identifyCleaningAlerts([
          makeRecord({ products_stored_safely: false }),
          makeRecord({ products_stored_safely: false }),
        ]);
        const a = alerts.find((x) => x.type === "unsafe_storage");
        expect(a).toBeDefined();
        expect(a!.severity).toBe("medium");
        expect(a!.message).toContain("2 instances");
      });
    });

    describe("surfaces_not_sanitised alert", () => {
      it("does not fire for 2 not sanitised", () => {
        const alerts = identifyCleaningAlerts([
          makeRecord({ surfaces_sanitised: false }),
          makeRecord({ surfaces_sanitised: false }),
        ]);
        const a = alerts.find((x) => x.type === "surfaces_not_sanitised");
        expect(a).toBeUndefined();
      });

      it("fires for 3 not sanitised", () => {
        const alerts = identifyCleaningAlerts([
          makeRecord({ surfaces_sanitised: false }),
          makeRecord({ surfaces_sanitised: false }),
          makeRecord({ surfaces_sanitised: false }),
        ]);
        const a = alerts.find((x) => x.type === "surfaces_not_sanitised");
        expect(a).toBeDefined();
        expect(a!.severity).toBe("medium");
        expect(a!.message).toContain("3 cleans without surfaces sanitised");
      });
    });

    describe("multiple alerts", () => {
      it("fires all applicable alerts at once", () => {
        const alerts = identifyCleaningAlerts([
          makeRecord({ hygiene_risk: "critical", area_name: "Kitchen", coshh_compliant: false, products_stored_safely: false, surfaces_sanitised: false }),
          makeRecord({ cleaning_standard: "unacceptable", coshh_compliant: false, products_stored_safely: false, surfaces_sanitised: false }),
          makeRecord({ surfaces_sanitised: false }),
        ]);
        const types = alerts.map((a) => a.type);
        expect(types).toContain("critical_hygiene");
        expect(types).toContain("unacceptable_standard");
        expect(types).toContain("coshh_non_compliant");
        expect(types).toContain("unsafe_storage");
        expect(types).toContain("surfaces_not_sanitised");
      });
    });
  });
});
