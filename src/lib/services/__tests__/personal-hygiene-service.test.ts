import { describe, it, expect } from "vitest";
import { _testing, type PersonalHygieneRecord } from "../personal-hygiene-service";

const { computePersonalHygieneMetrics, identifyPersonalHygieneAlerts } = _testing;

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRecord(overrides?: Partial<PersonalHygieneRecord>): PersonalHygieneRecord {
  return {
    id: overrides?.id ?? "h-1",
    home_id: overrides?.home_id ?? "home-1",
    hygiene_area: overrides?.hygiene_area ?? "bathing_showering",
    support_level: overrides?.support_level ?? "independent",
    progress_rating: overrides?.progress_rating ?? "good",
    sensitivity_level: overrides?.sensitivity_level ?? "standard",
    assessment_date: overrides?.assessment_date ?? now.toISOString().split("T")[0],
    child_name: overrides?.child_name ?? "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : "child-1",
    child_consulted: overrides?.child_consulted ?? true,
    child_comfortable: overrides?.child_comfortable ?? true,
    dignity_maintained: overrides?.dignity_maintained ?? true,
    age_appropriate: overrides?.age_appropriate ?? true,
    culturally_sensitive: overrides?.culturally_sensitive ?? true,
    products_available: overrides?.products_available ?? true,
    products_preferred: overrides?.products_preferred ?? true,
    independence_encouraged: overrides?.independence_encouraged ?? true,
    routine_established: overrides?.routine_established ?? true,
    care_plan_updated: overrides?.care_plan_updated ?? true,
    training_provided: overrides?.training_provided ?? true,
    issues_found: overrides?.issues_found ?? [],
    actions_taken: overrides?.actions_taken ?? [],
    assessed_by: overrides?.assessed_by ?? "Staff A",
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(),
    updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("personal-hygiene-service", () => {
  // ── computePersonalHygieneMetrics ───────────────────────────────────

  describe("computePersonalHygieneMetrics", () => {
    describe("empty records", () => {
      it("returns zeros for all fields", () => {
        const m = computePersonalHygieneMetrics([]);
        expect(m.total_assessments).toBe(0);
        expect(m.independent_count).toBe(0);
        expect(m.full_support_count).toBe(0);
        expect(m.independence_rate).toBe(0);
        expect(m.excellent_progress_count).toBe(0);
        expect(m.needs_improvement_count).toBe(0);
        expect(m.child_consulted_rate).toBe(0);
        expect(m.child_comfortable_rate).toBe(0);
        expect(m.dignity_maintained_rate).toBe(0);
        expect(m.age_appropriate_rate).toBe(0);
        expect(m.culturally_sensitive_rate).toBe(0);
        expect(m.products_available_rate).toBe(0);
        expect(m.independence_encouraged_rate).toBe(0);
        expect(m.routine_established_rate).toBe(0);
        expect(m.care_plan_updated_rate).toBe(0);
        expect(m.unique_children).toBe(0);
      });

      it("returns empty breakdowns", () => {
        const m = computePersonalHygieneMetrics([]);
        expect(m.by_hygiene_area).toEqual({});
        expect(m.by_support_level).toEqual({});
        expect(m.by_progress_rating).toEqual({});
        expect(m.by_sensitivity_level).toEqual({});
      });
    });

    describe("single record defaults", () => {
      it("returns correct counts", () => {
        const m = computePersonalHygieneMetrics([makeRecord()]);
        expect(m.total_assessments).toBe(1);
        expect(m.independent_count).toBe(1);
        expect(m.full_support_count).toBe(0);
        expect(m.excellent_progress_count).toBe(0);
        expect(m.needs_improvement_count).toBe(0);
        expect(m.unique_children).toBe(1);
      });

      it("returns 100% independence rate", () => {
        const m = computePersonalHygieneMetrics([makeRecord()]);
        expect(m.independence_rate).toBe(100);
      });

      it("returns 100% for all boolean rates with defaults", () => {
        const m = computePersonalHygieneMetrics([makeRecord()]);
        expect(m.child_consulted_rate).toBe(100);
        expect(m.child_comfortable_rate).toBe(100);
        expect(m.dignity_maintained_rate).toBe(100);
        expect(m.age_appropriate_rate).toBe(100);
        expect(m.culturally_sensitive_rate).toBe(100);
        expect(m.products_available_rate).toBe(100);
        expect(m.independence_encouraged_rate).toBe(100);
        expect(m.routine_established_rate).toBe(100);
        expect(m.care_plan_updated_rate).toBe(100);
      });
    });

    describe("support level counting", () => {
      it("counts independent", () => {
        const m = computePersonalHygieneMetrics([makeRecord({ support_level: "independent" })]);
        expect(m.independent_count).toBe(1);
      });

      it("counts full_support", () => {
        const m = computePersonalHygieneMetrics([makeRecord({ support_level: "full_support" })]);
        expect(m.full_support_count).toBe(1);
      });

      it("does not count minimal_prompting as independent", () => {
        const m = computePersonalHygieneMetrics([makeRecord({ support_level: "minimal_prompting" })]);
        expect(m.independent_count).toBe(0);
      });

      it("does not count verbal_guidance as full_support", () => {
        const m = computePersonalHygieneMetrics([makeRecord({ support_level: "verbal_guidance" })]);
        expect(m.full_support_count).toBe(0);
      });
    });

    describe("independence_rate", () => {
      it("calculates correctly with mixed levels", () => {
        const records = [
          makeRecord({ support_level: "independent" }),
          makeRecord({ support_level: "minimal_prompting" }),
          makeRecord({ support_level: "independent" }),
        ];
        const m = computePersonalHygieneMetrics(records);
        expect(m.independence_rate).toBe(66.7);
      });

      it("returns 0 when no independent records", () => {
        const m = computePersonalHygieneMetrics([makeRecord({ support_level: "full_support" })]);
        expect(m.independence_rate).toBe(0);
      });
    });

    describe("progress rating counting", () => {
      it("counts excellent", () => {
        const m = computePersonalHygieneMetrics([makeRecord({ progress_rating: "excellent" })]);
        expect(m.excellent_progress_count).toBe(1);
      });

      it("counts needs_improvement", () => {
        const m = computePersonalHygieneMetrics([makeRecord({ progress_rating: "needs_improvement" })]);
        expect(m.needs_improvement_count).toBe(1);
      });

      it("does not count good as excellent", () => {
        const m = computePersonalHygieneMetrics([makeRecord({ progress_rating: "good" })]);
        expect(m.excellent_progress_count).toBe(0);
      });
    });

    describe("unique_children", () => {
      it("counts distinct child names", () => {
        const records = [
          makeRecord({ child_name: "Child A" }),
          makeRecord({ child_name: "Child B" }),
          makeRecord({ child_name: "Child A" }),
        ];
        const m = computePersonalHygieneMetrics(records);
        expect(m.unique_children).toBe(2);
      });

      it("counts 1 for single child", () => {
        const m = computePersonalHygieneMetrics([makeRecord()]);
        expect(m.unique_children).toBe(1);
      });
    });

    describe("boolean rates", () => {
      it("child_consulted_rate 0 when false", () => {
        const m = computePersonalHygieneMetrics([makeRecord({ child_consulted: false })]);
        expect(m.child_consulted_rate).toBe(0);
      });

      it("child_comfortable_rate 0 when false", () => {
        const m = computePersonalHygieneMetrics([makeRecord({ child_comfortable: false })]);
        expect(m.child_comfortable_rate).toBe(0);
      });

      it("dignity_maintained_rate 0 when false", () => {
        const m = computePersonalHygieneMetrics([makeRecord({ dignity_maintained: false })]);
        expect(m.dignity_maintained_rate).toBe(0);
      });

      it("age_appropriate_rate 0 when false", () => {
        const m = computePersonalHygieneMetrics([makeRecord({ age_appropriate: false })]);
        expect(m.age_appropriate_rate).toBe(0);
      });

      it("culturally_sensitive_rate 0 when false", () => {
        const m = computePersonalHygieneMetrics([makeRecord({ culturally_sensitive: false })]);
        expect(m.culturally_sensitive_rate).toBe(0);
      });

      it("products_available_rate 0 when false", () => {
        const m = computePersonalHygieneMetrics([makeRecord({ products_available: false })]);
        expect(m.products_available_rate).toBe(0);
      });

      it("independence_encouraged_rate 0 when false", () => {
        const m = computePersonalHygieneMetrics([makeRecord({ independence_encouraged: false })]);
        expect(m.independence_encouraged_rate).toBe(0);
      });

      it("routine_established_rate 0 when false", () => {
        const m = computePersonalHygieneMetrics([makeRecord({ routine_established: false })]);
        expect(m.routine_established_rate).toBe(0);
      });

      it("care_plan_updated_rate 0 when false", () => {
        const m = computePersonalHygieneMetrics([makeRecord({ care_plan_updated: false })]);
        expect(m.care_plan_updated_rate).toBe(0);
      });

      it("calculates mixed boolean rates correctly", () => {
        const records = [
          makeRecord({ dignity_maintained: true }),
          makeRecord({ dignity_maintained: false }),
          makeRecord({ dignity_maintained: true }),
        ];
        const m = computePersonalHygieneMetrics(records);
        expect(m.dignity_maintained_rate).toBe(66.7);
      });
    });

    describe("by_hygiene_area breakdown", () => {
      it("counts all 10 hygiene areas", () => {
        const areas = [
          "bathing_showering", "dental_care", "hair_care", "skin_care", "nail_care",
          "menstrual_hygiene", "clothing_appropriateness", "hand_washing", "general_grooming", "other",
        ] as const;
        const records = areas.map((a) => makeRecord({ hygiene_area: a }));
        const m = computePersonalHygieneMetrics(records);
        for (const a of areas) expect(m.by_hygiene_area[a]).toBe(1);
      });
    });

    describe("by_support_level breakdown", () => {
      it("counts all 5 support levels", () => {
        const levels = [
          "independent", "minimal_prompting", "verbal_guidance", "physical_assistance", "full_support",
        ] as const;
        const records = levels.map((l) => makeRecord({ support_level: l }));
        const m = computePersonalHygieneMetrics(records);
        for (const l of levels) expect(m.by_support_level[l]).toBe(1);
      });
    });

    describe("by_progress_rating breakdown", () => {
      it("counts all 5 progress ratings", () => {
        const ratings = ["excellent", "good", "developing", "needs_improvement", "not_assessed"] as const;
        const records = ratings.map((r) => makeRecord({ progress_rating: r }));
        const m = computePersonalHygieneMetrics(records);
        for (const r of ratings) expect(m.by_progress_rating[r]).toBe(1);
      });
    });

    describe("by_sensitivity_level breakdown", () => {
      it("counts all 5 sensitivity levels", () => {
        const levels = [
          "standard", "cultural_consideration", "trauma_informed", "disability_related", "age_specific",
        ] as const;
        const records = levels.map((l) => makeRecord({ sensitivity_level: l }));
        const m = computePersonalHygieneMetrics(records);
        for (const l of levels) expect(m.by_sensitivity_level[l]).toBe(1);
      });
    });
  });

  // ── identifyPersonalHygieneAlerts ───────────────────────────────────

  describe("identifyPersonalHygieneAlerts", () => {
    describe("no alerts", () => {
      it("returns empty for clean records", () => {
        const alerts = identifyPersonalHygieneAlerts([makeRecord()]);
        expect(alerts).toEqual([]);
      });

      it("returns empty for empty records", () => {
        const alerts = identifyPersonalHygieneAlerts([]);
        expect(alerts).toEqual([]);
      });
    });

    describe("dignity_not_maintained alert", () => {
      it("fires for dignity not maintained", () => {
        const alerts = identifyPersonalHygieneAlerts([
          makeRecord({ dignity_maintained: false, child_name: "Child X", hygiene_area: "bathing_showering", assessment_date: "2026-05-14" }),
        ]);
        expect(alerts).toHaveLength(1);
        expect(alerts[0].type).toBe("dignity_not_maintained");
        expect(alerts[0].severity).toBe("critical");
        expect(alerts[0].message).toContain("Child X");
        expect(alerts[0].message).toContain("bathing showering");
        expect(alerts[0].message).toContain("2026-05-14");
        expect(alerts[0].message).toContain("review practice immediately");
      });

      it("fires per-record for multiple dignity issues", () => {
        const alerts = identifyPersonalHygieneAlerts([
          makeRecord({ id: "h-1", dignity_maintained: false, child_name: "Child A" }),
          makeRecord({ id: "h-2", dignity_maintained: false, child_name: "Child B" }),
        ]);
        const dignity = alerts.filter((a) => a.type === "dignity_not_maintained");
        expect(dignity).toHaveLength(2);
        expect(dignity[0].id).toBe("h-1");
        expect(dignity[1].id).toBe("h-2");
      });

      it("replaces underscores in hygiene area", () => {
        const alerts = identifyPersonalHygieneAlerts([
          makeRecord({ dignity_maintained: false, hygiene_area: "menstrual_hygiene" }),
        ]);
        expect(alerts[0].message).toContain("menstrual hygiene");
      });

      it("does not fire when dignity maintained", () => {
        const alerts = identifyPersonalHygieneAlerts([makeRecord({ dignity_maintained: true })]);
        const dignity = alerts.filter((a) => a.type === "dignity_not_maintained");
        expect(dignity).toHaveLength(0);
      });
    });

    describe("child_not_comfortable alert", () => {
      it("fires for 1 not comfortable", () => {
        const alerts = identifyPersonalHygieneAlerts([
          makeRecord({ child_comfortable: false }),
        ]);
        const a = alerts.find((x) => x.type === "child_not_comfortable");
        expect(a).toBeDefined();
        expect(a!.severity).toBe("high");
        expect(a!.message).toContain("1 assessment shows");
      });

      it("uses plural for 2+", () => {
        const alerts = identifyPersonalHygieneAlerts([
          makeRecord({ child_comfortable: false }),
          makeRecord({ child_comfortable: false }),
        ]);
        const a = alerts.find((x) => x.type === "child_not_comfortable");
        expect(a!.message).toContain("2 assessments show");
      });

      it("does not fire when child comfortable", () => {
        const alerts = identifyPersonalHygieneAlerts([makeRecord({ child_comfortable: true })]);
        const a = alerts.find((x) => x.type === "child_not_comfortable");
        expect(a).toBeUndefined();
      });
    });

    describe("products_unavailable alert", () => {
      it("does not fire for 1 without products", () => {
        const alerts = identifyPersonalHygieneAlerts([makeRecord({ products_available: false })]);
        const a = alerts.find((x) => x.type === "products_unavailable");
        expect(a).toBeUndefined();
      });

      it("fires for 2 without products", () => {
        const alerts = identifyPersonalHygieneAlerts([
          makeRecord({ products_available: false }),
          makeRecord({ products_available: false }),
        ]);
        const a = alerts.find((x) => x.type === "products_unavailable");
        expect(a).toBeDefined();
        expect(a!.severity).toBe("high");
        expect(a!.message).toContain("2 assessments without adequate products");
      });
    });

    describe("not_culturally_sensitive alert", () => {
      it("does not fire for 1 not sensitive", () => {
        const alerts = identifyPersonalHygieneAlerts([makeRecord({ culturally_sensitive: false })]);
        const a = alerts.find((x) => x.type === "not_culturally_sensitive");
        expect(a).toBeUndefined();
      });

      it("fires for 2 not sensitive", () => {
        const alerts = identifyPersonalHygieneAlerts([
          makeRecord({ culturally_sensitive: false }),
          makeRecord({ culturally_sensitive: false }),
        ]);
        const a = alerts.find((x) => x.type === "not_culturally_sensitive");
        expect(a).toBeDefined();
        expect(a!.severity).toBe("medium");
        expect(a!.message).toContain("2 assessments not culturally sensitive");
      });
    });

    describe("care_plan_not_updated alert", () => {
      it("does not fire for 2 not updated", () => {
        const alerts = identifyPersonalHygieneAlerts([
          makeRecord({ care_plan_updated: false }),
          makeRecord({ care_plan_updated: false }),
        ]);
        const a = alerts.find((x) => x.type === "care_plan_not_updated");
        expect(a).toBeUndefined();
      });

      it("fires for 3 not updated", () => {
        const alerts = identifyPersonalHygieneAlerts([
          makeRecord({ care_plan_updated: false }),
          makeRecord({ care_plan_updated: false }),
          makeRecord({ care_plan_updated: false }),
        ]);
        const a = alerts.find((x) => x.type === "care_plan_not_updated");
        expect(a).toBeDefined();
        expect(a!.severity).toBe("medium");
        expect(a!.message).toContain("3 assessments without care plan updates");
      });
    });

    describe("multiple alerts", () => {
      it("fires all applicable alerts at once", () => {
        const alerts = identifyPersonalHygieneAlerts([
          makeRecord({ dignity_maintained: false, child_comfortable: false, products_available: false, culturally_sensitive: false, care_plan_updated: false }),
          makeRecord({ child_comfortable: false, products_available: false, culturally_sensitive: false, care_plan_updated: false }),
          makeRecord({ care_plan_updated: false }),
        ]);
        const types = alerts.map((a) => a.type);
        expect(types).toContain("dignity_not_maintained");
        expect(types).toContain("child_not_comfortable");
        expect(types).toContain("products_unavailable");
        expect(types).toContain("not_culturally_sensitive");
        expect(types).toContain("care_plan_not_updated");
      });
    });
  });
});
