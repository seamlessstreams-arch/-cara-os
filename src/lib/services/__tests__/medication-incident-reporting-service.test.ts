import { describe, it, expect } from "vitest";
import { _testing, type MedicationIncidentReportRow } from "../medication-incident-reporting-service";

const { computeMedicationIncidentMetrics, computeMedicationIncidentAlerts, generateMedicationIncidentCaraInsights } = _testing;

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRow(overrides?: Partial<MedicationIncidentReportRow>): MedicationIncidentReportRow {
  return {
    id: overrides?.id ?? "r-1", home_id: overrides?.home_id ?? "home-1",
    child_name: overrides?.child_name ?? "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
    incident_date: overrides?.incident_date ?? "2026-05-01",
    incident_type: overrides?.incident_type ?? "wrong_dose",
    incident_severity: overrides?.incident_severity ?? "no_harm",
    investigation_status: overrides?.investigation_status ?? "closed",
    contributing_factor: overrides?.contributing_factor ?? "human_error",
    staff_involved: overrides?.staff_involved ?? "Staff A",
    medication_name: overrides?.medication_name ?? "Paracetamol",
    gp_notified: overrides?.gp_notified ?? true,
    parent_notified: overrides?.parent_notified ?? true,
    social_worker_notified: overrides?.social_worker_notified ?? true,
    ofsted_notified: overrides?.ofsted_notified ?? true,
    root_cause_identified: overrides?.root_cause_identified ?? true,
    learning_shared: overrides?.learning_shared ?? true,
    duty_of_candour_applied: overrides?.duty_of_candour_applied ?? true,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(), updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("medication-incident-reporting-service", () => {
  // ═══════════════════════════════════════════════════════════════════════
  // computeMedicationIncidentMetrics
  // ═══════════════════════════════════════════════════════════════════════

  describe("computeMedicationIncidentMetrics", () => {
    it("returns zeros for empty", () => {
      const m = computeMedicationIncidentMetrics([]);
      expect(m.total_incidents).toBe(0);
      expect(m.serious_harm_count).toBe(0);
      expect(m.moderate_harm_count).toBe(0);
      expect(m.near_miss_count).toBe(0);
      expect(m.open_investigation_count).toBe(0);
      expect(m.gp_notified_rate).toBe(0);
      expect(m.parent_notified_rate).toBe(0);
      expect(m.social_worker_notified_rate).toBe(0);
      expect(m.root_cause_rate).toBe(0);
      expect(m.learning_shared_rate).toBe(0);
      expect(m.unique_children).toBe(0);
    });

    it("returns empty breakdowns for empty", () => {
      const m = computeMedicationIncidentMetrics([]);
      expect(m.type_breakdown).toEqual({});
      expect(m.severity_breakdown).toEqual({});
    });

    it("total_incidents counts rows", () => {
      expect(computeMedicationIncidentMetrics([makeRow(), makeRow(), makeRow()]).total_incidents).toBe(3);
    });

    it("counts serious_harm", () => {
      expect(computeMedicationIncidentMetrics([makeRow({ incident_severity: "serious_harm" })]).serious_harm_count).toBe(1);
    });

    it("counts death as serious_harm", () => {
      expect(computeMedicationIncidentMetrics([makeRow({ incident_severity: "death" })]).serious_harm_count).toBe(1);
    });

    it("does not count moderate_harm as serious_harm", () => {
      expect(computeMedicationIncidentMetrics([makeRow({ incident_severity: "moderate_harm" })]).serious_harm_count).toBe(0);
    });

    it("does not count no_harm as serious_harm", () => {
      expect(computeMedicationIncidentMetrics([makeRow({ incident_severity: "no_harm" })]).serious_harm_count).toBe(0);
    });

    it("counts moderate_harm", () => {
      expect(computeMedicationIncidentMetrics([makeRow({ incident_severity: "moderate_harm" })]).moderate_harm_count).toBe(1);
    });

    it("does not count minor_harm as moderate_harm", () => {
      expect(computeMedicationIncidentMetrics([makeRow({ incident_severity: "minor_harm" })]).moderate_harm_count).toBe(0);
    });

    it("counts near_miss by incident_type", () => {
      expect(computeMedicationIncidentMetrics([makeRow({ incident_type: "near_miss" })]).near_miss_count).toBe(1);
    });

    it("does not count wrong_dose as near_miss", () => {
      expect(computeMedicationIncidentMetrics([makeRow({ incident_type: "wrong_dose" })]).near_miss_count).toBe(0);
    });

    it("counts open investigations (reported)", () => {
      expect(computeMedicationIncidentMetrics([makeRow({ investigation_status: "reported" })]).open_investigation_count).toBe(1);
    });

    it("counts open investigations (under_investigation)", () => {
      expect(computeMedicationIncidentMetrics([makeRow({ investigation_status: "under_investigation" })]).open_investigation_count).toBe(1);
    });

    it("does not count root_cause_identified as open", () => {
      expect(computeMedicationIncidentMetrics([makeRow({ investigation_status: "root_cause_identified" })]).open_investigation_count).toBe(0);
    });

    it("does not count actions_implemented as open", () => {
      expect(computeMedicationIncidentMetrics([makeRow({ investigation_status: "actions_implemented" })]).open_investigation_count).toBe(0);
    });

    it("does not count closed as open", () => {
      expect(computeMedicationIncidentMetrics([makeRow({ investigation_status: "closed" })]).open_investigation_count).toBe(0);
    });

    it("gp_notified_rate 100 when all true", () => {
      expect(computeMedicationIncidentMetrics([makeRow({ gp_notified: true })]).gp_notified_rate).toBe(100);
    });

    it("gp_notified_rate 0 when all false", () => {
      expect(computeMedicationIncidentMetrics([makeRow({ gp_notified: false })]).gp_notified_rate).toBe(0);
    });

    it("gp_notified_rate 50 when half", () => {
      const m = computeMedicationIncidentMetrics([makeRow({ gp_notified: true }), makeRow({ gp_notified: false })]);
      expect(m.gp_notified_rate).toBe(50);
    });

    it("parent_notified_rate 100 when all true", () => {
      expect(computeMedicationIncidentMetrics([makeRow({ parent_notified: true })]).parent_notified_rate).toBe(100);
    });

    it("parent_notified_rate 0 when all false", () => {
      expect(computeMedicationIncidentMetrics([makeRow({ parent_notified: false })]).parent_notified_rate).toBe(0);
    });

    it("social_worker_notified_rate 100 when all true", () => {
      expect(computeMedicationIncidentMetrics([makeRow({ social_worker_notified: true })]).social_worker_notified_rate).toBe(100);
    });

    it("social_worker_notified_rate 0 when all false", () => {
      expect(computeMedicationIncidentMetrics([makeRow({ social_worker_notified: false })]).social_worker_notified_rate).toBe(0);
    });

    it("root_cause_rate 100 when all true", () => {
      expect(computeMedicationIncidentMetrics([makeRow({ root_cause_identified: true })]).root_cause_rate).toBe(100);
    });

    it("root_cause_rate 0 when all false", () => {
      expect(computeMedicationIncidentMetrics([makeRow({ root_cause_identified: false })]).root_cause_rate).toBe(0);
    });

    it("learning_shared_rate 100 when all true", () => {
      expect(computeMedicationIncidentMetrics([makeRow({ learning_shared: true })]).learning_shared_rate).toBe(100);
    });

    it("learning_shared_rate 0 when all false", () => {
      expect(computeMedicationIncidentMetrics([makeRow({ learning_shared: false })]).learning_shared_rate).toBe(0);
    });

    it("rate rounds to one decimal (66.7)", () => {
      const m = computeMedicationIncidentMetrics([makeRow({ gp_notified: true }), makeRow({ gp_notified: true }), makeRow({ gp_notified: false })]);
      expect(m.gp_notified_rate).toBe(66.7);
    });

    it("rate rounds to one decimal (33.3)", () => {
      const m = computeMedicationIncidentMetrics([makeRow({ parent_notified: true }), makeRow({ parent_notified: false }), makeRow({ parent_notified: false })]);
      expect(m.parent_notified_rate).toBe(33.3);
    });

    it("unique_children distinct", () => {
      const m = computeMedicationIncidentMetrics([makeRow({ child_name: "A" }), makeRow({ child_name: "B" }), makeRow({ child_name: "A" })]);
      expect(m.unique_children).toBe(2);
    });

    it("unique_children single", () => {
      expect(computeMedicationIncidentMetrics([makeRow()]).unique_children).toBe(1);
    });

    it("type_breakdown counts all 10 types", () => {
      const types = ["wrong_medication", "wrong_dose", "wrong_time", "missed_dose", "double_dose", "wrong_child", "wrong_route", "adverse_reaction", "near_miss", "storage_breach"] as const;
      const rows = types.map((t) => makeRow({ incident_type: t }));
      const m = computeMedicationIncidentMetrics(rows);
      for (const t of types) expect(m.type_breakdown[t]).toBe(1);
      expect(Object.keys(m.type_breakdown)).toHaveLength(10);
    });

    it("type_breakdown accumulates duplicates", () => {
      const m = computeMedicationIncidentMetrics([makeRow({ incident_type: "wrong_dose" }), makeRow({ incident_type: "wrong_dose" })]);
      expect(m.type_breakdown["wrong_dose"]).toBe(2);
    });

    it("severity_breakdown counts all 5 severities", () => {
      const sevs = ["no_harm", "minor_harm", "moderate_harm", "serious_harm", "death"] as const;
      const rows = sevs.map((s) => makeRow({ incident_severity: s }));
      const m = computeMedicationIncidentMetrics(rows);
      for (const s of sevs) expect(m.severity_breakdown[s]).toBe(1);
      expect(Object.keys(m.severity_breakdown)).toHaveLength(5);
    });

    it("severity_breakdown accumulates duplicates", () => {
      const m = computeMedicationIncidentMetrics([makeRow({ incident_severity: "no_harm" }), makeRow({ incident_severity: "no_harm" })]);
      expect(m.severity_breakdown["no_harm"]).toBe(2);
    });

    it("comprehensive scenario", () => {
      const rows = [
        makeRow({ id: "c1", incident_type: "wrong_dose", incident_severity: "serious_harm", investigation_status: "reported", gp_notified: true, parent_notified: true, social_worker_notified: true, root_cause_identified: true, learning_shared: true, child_name: "A" }),
        makeRow({ id: "c2", incident_type: "near_miss", incident_severity: "no_harm", investigation_status: "closed", gp_notified: false, parent_notified: false, social_worker_notified: false, root_cause_identified: false, learning_shared: false, child_name: "B" }),
        makeRow({ id: "c3", incident_type: "adverse_reaction", incident_severity: "moderate_harm", investigation_status: "under_investigation", gp_notified: true, parent_notified: true, social_worker_notified: false, root_cause_identified: false, learning_shared: false, child_name: "A" }),
        makeRow({ id: "c4", incident_type: "missed_dose", incident_severity: "death", investigation_status: "actions_implemented", gp_notified: false, parent_notified: false, social_worker_notified: false, root_cause_identified: true, learning_shared: true, child_name: "C" }),
      ];
      const m = computeMedicationIncidentMetrics(rows);
      expect(m.total_incidents).toBe(4);
      expect(m.serious_harm_count).toBe(2);
      expect(m.moderate_harm_count).toBe(1);
      expect(m.near_miss_count).toBe(1);
      expect(m.open_investigation_count).toBe(2);
      expect(m.gp_notified_rate).toBe(50);
      expect(m.parent_notified_rate).toBe(50);
      expect(m.social_worker_notified_rate).toBe(25);
      expect(m.root_cause_rate).toBe(50);
      expect(m.learning_shared_rate).toBe(50);
      expect(m.unique_children).toBe(3);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // computeMedicationIncidentAlerts
  // ═══════════════════════════════════════════════════════════════════════

  describe("computeMedicationIncidentAlerts", () => {
    it("returns empty for empty", () => {
      expect(computeMedicationIncidentAlerts([])).toEqual([]);
    });

    it("returns empty for clean rows", () => {
      expect(computeMedicationIncidentAlerts([makeRow()])).toEqual([]);
    });

    // -- serious_harm_ofsted_not_notified --
    it("fires serious_harm_ofsted_not_notified for serious_harm + ofsted not notified", () => {
      const a = computeMedicationIncidentAlerts([makeRow({ incident_severity: "serious_harm", ofsted_notified: false, child_name: "Jo", medication_name: "Ritalin", incident_type: "wrong_dose" })]);
      const f = a.find((x) => x.type === "serious_harm_ofsted_not_notified");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("critical");
      expect(f!.message).toContain("Jo");
      expect(f!.message).toContain("Ritalin");
      expect(f!.message).toContain("serious harm");
      expect(f!.record_id).toBe("r-1");
    });

    it("fires serious_harm_ofsted_not_notified for death + ofsted not notified", () => {
      const a = computeMedicationIncidentAlerts([makeRow({ incident_severity: "death", ofsted_notified: false })]);
      const f = a.find((x) => x.type === "serious_harm_ofsted_not_notified");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("critical");
    });

    it("no serious_harm_ofsted_not_notified if ofsted notified", () => {
      expect(computeMedicationIncidentAlerts([makeRow({ incident_severity: "serious_harm", ofsted_notified: true })]).find((x) => x.type === "serious_harm_ofsted_not_notified")).toBeUndefined();
    });

    it("no serious_harm_ofsted_not_notified for moderate_harm", () => {
      expect(computeMedicationIncidentAlerts([makeRow({ incident_severity: "moderate_harm", ofsted_notified: false })]).find((x) => x.type === "serious_harm_ofsted_not_notified")).toBeUndefined();
    });

    it("no serious_harm_ofsted_not_notified for no_harm", () => {
      expect(computeMedicationIncidentAlerts([makeRow({ incident_severity: "no_harm", ofsted_notified: false })]).find((x) => x.type === "serious_harm_ofsted_not_notified")).toBeUndefined();
    });

    // -- duty_of_candour_not_applied --
    it("fires duty_of_candour_not_applied for moderate_harm + no duty of candour", () => {
      const a = computeMedicationIncidentAlerts([makeRow({ incident_severity: "moderate_harm", duty_of_candour_applied: false, child_name: "Sam", medication_name: "Morphine" })]);
      const f = a.find((x) => x.type === "duty_of_candour_not_applied");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("Sam");
      expect(f!.message).toContain("Morphine");
      expect(f!.record_id).toBe("r-1");
    });

    it("fires duty_of_candour_not_applied for serious_harm + no duty of candour", () => {
      const a = computeMedicationIncidentAlerts([makeRow({ incident_severity: "serious_harm", duty_of_candour_applied: false })]);
      expect(a.find((x) => x.type === "duty_of_candour_not_applied")).toBeDefined();
    });

    it("fires duty_of_candour_not_applied for death + no duty of candour", () => {
      const a = computeMedicationIncidentAlerts([makeRow({ incident_severity: "death", duty_of_candour_applied: false })]);
      expect(a.find((x) => x.type === "duty_of_candour_not_applied")).toBeDefined();
    });

    it("no duty_of_candour_not_applied if duty of candour applied", () => {
      expect(computeMedicationIncidentAlerts([makeRow({ incident_severity: "moderate_harm", duty_of_candour_applied: true })]).find((x) => x.type === "duty_of_candour_not_applied")).toBeUndefined();
    });

    it("no duty_of_candour_not_applied for minor_harm", () => {
      expect(computeMedicationIncidentAlerts([makeRow({ incident_severity: "minor_harm", duty_of_candour_applied: false })]).find((x) => x.type === "duty_of_candour_not_applied")).toBeUndefined();
    });

    it("no duty_of_candour_not_applied for no_harm", () => {
      expect(computeMedicationIncidentAlerts([makeRow({ incident_severity: "no_harm", duty_of_candour_applied: false })]).find((x) => x.type === "duty_of_candour_not_applied")).toBeUndefined();
    });

    // -- multiple_incidents_same_child --
    it("fires multiple_incidents_same_child for 2 incidents same child", () => {
      const a = computeMedicationIncidentAlerts([makeRow({ child_name: "Jo" }), makeRow({ child_name: "Jo" })]);
      const f = a.find((x) => x.type === "multiple_incidents_same_child");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("Jo");
      expect(f!.message).toContain("2");
    });

    it("fires multiple_incidents_same_child for 3 incidents same child", () => {
      const a = computeMedicationIncidentAlerts([makeRow({ child_name: "Jo" }), makeRow({ child_name: "Jo" }), makeRow({ child_name: "Jo" })]);
      const f = a.find((x) => x.type === "multiple_incidents_same_child");
      expect(f!.message).toContain("3");
    });

    it("no multiple_incidents_same_child for 1 incident per child", () => {
      expect(computeMedicationIncidentAlerts([makeRow({ child_name: "A" }), makeRow({ child_name: "B" })]).find((x) => x.type === "multiple_incidents_same_child")).toBeUndefined();
    });

    it("multiple_incidents_same_child does not have record_id", () => {
      const a = computeMedicationIncidentAlerts([makeRow({ child_name: "Jo" }), makeRow({ child_name: "Jo" })]);
      const f = a.find((x) => x.type === "multiple_incidents_same_child");
      expect(f!.record_id).toBeUndefined();
    });

    // -- closed_without_root_cause --
    it("fires closed_without_root_cause for closed + no root cause", () => {
      const a = computeMedicationIncidentAlerts([makeRow({ investigation_status: "closed", root_cause_identified: false, child_name: "Lee", medication_name: "Ibuprofen" })]);
      const f = a.find((x) => x.type === "closed_without_root_cause");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("medium");
      expect(f!.message).toContain("Lee");
      expect(f!.message).toContain("Ibuprofen");
      expect(f!.record_id).toBe("r-1");
    });

    it("no closed_without_root_cause if root cause identified", () => {
      expect(computeMedicationIncidentAlerts([makeRow({ investigation_status: "closed", root_cause_identified: true })]).find((x) => x.type === "closed_without_root_cause")).toBeUndefined();
    });

    it("no closed_without_root_cause if not closed", () => {
      expect(computeMedicationIncidentAlerts([makeRow({ investigation_status: "reported", root_cause_identified: false })]).find((x) => x.type === "closed_without_root_cause")).toBeUndefined();
    });

    // -- combined alerts --
    it("fires all applicable alerts", () => {
      const a = computeMedicationIncidentAlerts([
        makeRow({ id: "x1", incident_severity: "serious_harm", ofsted_notified: false, duty_of_candour_applied: false, child_name: "Jo", investigation_status: "closed", root_cause_identified: false }),
        makeRow({ id: "x2", child_name: "Jo", incident_severity: "no_harm" }),
      ]);
      const types = a.map((x) => x.type);
      expect(types).toContain("serious_harm_ofsted_not_notified");
      expect(types).toContain("duty_of_candour_not_applied");
      expect(types).toContain("multiple_incidents_same_child");
      expect(types).toContain("closed_without_root_cause");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // generateMedicationIncidentCaraInsights
  // ═══════════════════════════════════════════════════════════════════════

  describe("generateMedicationIncidentCaraInsights", () => {
    it("returns 3 insights for empty data", () => {
      const m = computeMedicationIncidentMetrics([]);
      const a = computeMedicationIncidentAlerts([]);
      const insights = generateMedicationIncidentCaraInsights(m, a);
      expect(insights).toHaveLength(3);
    });

    it("insight 1 starts with [pink]", () => {
      const m = computeMedicationIncidentMetrics([]);
      const a = computeMedicationIncidentAlerts([]);
      expect(generateMedicationIncidentCaraInsights(m, a)[0]).toMatch(/^\[pink\]/);
    });

    it("insight 2 starts with [amber]", () => {
      const m = computeMedicationIncidentMetrics([]);
      const a = computeMedicationIncidentAlerts([]);
      expect(generateMedicationIncidentCaraInsights(m, a)[1]).toMatch(/^\[amber\]/);
    });

    it("insight 3 starts with [reflect]", () => {
      const m = computeMedicationIncidentMetrics([]);
      const a = computeMedicationIncidentAlerts([]);
      expect(generateMedicationIncidentCaraInsights(m, a)[2]).toMatch(/^\[reflect\]/);
    });

    it("insight 1 contains total incidents count", () => {
      const m = computeMedicationIncidentMetrics([makeRow(), makeRow()]);
      const a = computeMedicationIncidentAlerts([makeRow(), makeRow()]);
      expect(generateMedicationIncidentCaraInsights(m, a)[0]).toContain("2 medication incidents");
    });

    it("insight 1 contains unique children count", () => {
      const m = computeMedicationIncidentMetrics([makeRow({ child_name: "A" }), makeRow({ child_name: "B" })]);
      const a = computeMedicationIncidentAlerts([]);
      expect(generateMedicationIncidentCaraInsights(m, a)[0]).toContain("2 children");
    });

    it("insight 1 uses singular child for 1", () => {
      const m = computeMedicationIncidentMetrics([makeRow()]);
      const a = computeMedicationIncidentAlerts([]);
      expect(generateMedicationIncidentCaraInsights(m, a)[0]).toContain("1 child");
    });

    it("insight 1 contains near miss count", () => {
      const m = computeMedicationIncidentMetrics([makeRow({ incident_type: "near_miss" })]);
      const a = computeMedicationIncidentAlerts([]);
      expect(generateMedicationIncidentCaraInsights(m, a)[0]).toContain("Near misses: 1");
    });

    it("insight 1 contains open investigations count", () => {
      const m = computeMedicationIncidentMetrics([makeRow({ investigation_status: "reported" })]);
      const a = computeMedicationIncidentAlerts([]);
      expect(generateMedicationIncidentCaraInsights(m, a)[0]).toContain("Open investigations: 1");
    });

    it("insight 2 mentions critical and high alert counts when present", () => {
      const rows = [
        makeRow({ incident_severity: "serious_harm", ofsted_notified: false, duty_of_candour_applied: false, child_name: "Jo" }),
        makeRow({ child_name: "Jo" }),
      ];
      const m = computeMedicationIncidentMetrics(rows);
      const a = computeMedicationIncidentAlerts(rows);
      const i = generateMedicationIncidentCaraInsights(m, a)[1];
      expect(i).toContain("1 critical");
      expect(i).toContain("2 high-priority");
    });

    it("insight 2 shows no concerns when none", () => {
      const m = computeMedicationIncidentMetrics([makeRow()]);
      const a = computeMedicationIncidentAlerts([makeRow()]);
      expect(generateMedicationIncidentCaraInsights(m, a)[1]).toContain("No critical or high-priority concerns");
    });

    it("insight 2 contains GP notified rate", () => {
      const m = computeMedicationIncidentMetrics([makeRow()]);
      const a = computeMedicationIncidentAlerts([]);
      expect(generateMedicationIncidentCaraInsights(m, a)[1]).toContain("GP notified rate");
    });

    it("insight 2 contains parent notified rate", () => {
      const m = computeMedicationIncidentMetrics([makeRow()]);
      const a = computeMedicationIncidentAlerts([]);
      expect(generateMedicationIncidentCaraInsights(m, a)[1]).toContain("Parent notified rate");
    });

    it("insight 2 contains root cause rate", () => {
      const m = computeMedicationIncidentMetrics([makeRow()]);
      const a = computeMedicationIncidentAlerts([]);
      expect(generateMedicationIncidentCaraInsights(m, a)[1]).toContain("Root cause identified rate");
    });

    it("insight 3 contains reflective question about incidents", () => {
      const m = computeMedicationIncidentMetrics([]);
      const a = computeMedicationIncidentAlerts([]);
      const i = generateMedicationIncidentCaraInsights(m, a)[2];
      expect(i).toContain("incident");
      expect(i).toContain("root cause");
    });
  });
});
