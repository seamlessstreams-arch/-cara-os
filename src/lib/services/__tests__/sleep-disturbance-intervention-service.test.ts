import { describe, it, expect } from "vitest";
import {
  _testing,
  DISTURBANCE_TYPES,
  INTERVENTION_TYPES,
  SEVERITY_LEVELS,
  OUTCOME_STATUSES,
  type SleepDisturbanceInterventionRow,
} from "../sleep-disturbance-intervention-service";

const {
  computeSleepDisturbanceMetrics,
  computeSleepDisturbanceAlerts,
  generateSleepDisturbanceCaraInsights,
} = _testing;

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRow(
  overrides?: Partial<SleepDisturbanceInterventionRow>,
): SleepDisturbanceInterventionRow {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : crypto.randomUUID(),
    home_id: overrides?.home_id ?? "home-1",
    child_name: overrides?.child_name ?? "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
    incident_date: overrides?.incident_date ?? now.toISOString().split("T")[0],
    disturbance_type: overrides?.disturbance_type ?? "nightmares",
    intervention_type: overrides?.intervention_type ?? "reassurance",
    severity_level: overrides?.severity_level ?? "mild",
    outcome_status: overrides?.outcome_status ?? "resolved_same_night",
    child_settled_within_hour: overrides?.child_settled_within_hour ?? true,
    sleep_plan_in_place: overrides?.sleep_plan_in_place ?? true,
    clinical_referral_made: overrides?.clinical_referral_made ?? true,
    trauma_link_identified: overrides?.trauma_link_identified ?? false,
    parent_carer_informed: overrides?.parent_carer_informed ?? true,
    pattern_identified: overrides?.pattern_identified ?? false,
    environment_adapted: overrides?.environment_adapted ?? true,
    staff_debriefed: overrides?.staff_debriefed ?? true,
    staff_on_duty: "staff_on_duty" in (overrides ?? {}) ? (overrides!.staff_on_duty ?? null) : null,
    duration_minutes: "duration_minutes" in (overrides ?? {}) ? (overrides!.duration_minutes ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(),
    updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("sleep-disturbance-intervention-service", () => {
  // ── Enum validation ──────────────────────────────────────────────────

  describe("Enum validation", () => {
    it("DISTURBANCE_TYPES has 10 values", () => {
      expect(DISTURBANCE_TYPES).toHaveLength(10);
    });
    it("DISTURBANCE_TYPES contains nightmares", () => {
      expect(DISTURBANCE_TYPES).toContain("nightmares");
    });
    it("DISTURBANCE_TYPES contains night_terrors", () => {
      expect(DISTURBANCE_TYPES).toContain("night_terrors");
    });
    it("DISTURBANCE_TYPES contains sleep_walking", () => {
      expect(DISTURBANCE_TYPES).toContain("sleep_walking");
    });
    it("DISTURBANCE_TYPES contains insomnia", () => {
      expect(DISTURBANCE_TYPES).toContain("insomnia");
    });
    it("DISTURBANCE_TYPES contains hypervigilance", () => {
      expect(DISTURBANCE_TYPES).toContain("hypervigilance");
    });
    it("DISTURBANCE_TYPES contains bedtime_resistance", () => {
      expect(DISTURBANCE_TYPES).toContain("bedtime_resistance");
    });
    it("DISTURBANCE_TYPES contains early_waking", () => {
      expect(DISTURBANCE_TYPES).toContain("early_waking");
    });
    it("DISTURBANCE_TYPES contains restless_sleep", () => {
      expect(DISTURBANCE_TYPES).toContain("restless_sleep");
    });
    it("DISTURBANCE_TYPES contains trauma_flashback", () => {
      expect(DISTURBANCE_TYPES).toContain("trauma_flashback");
    });
    it("DISTURBANCE_TYPES contains anxiety_related", () => {
      expect(DISTURBANCE_TYPES).toContain("anxiety_related");
    });

    it("INTERVENTION_TYPES has 10 values", () => {
      expect(INTERVENTION_TYPES).toHaveLength(10);
    });
    it("INTERVENTION_TYPES contains reassurance", () => {
      expect(INTERVENTION_TYPES).toContain("reassurance");
    });
    it("INTERVENTION_TYPES contains sleep_hygiene_plan", () => {
      expect(INTERVENTION_TYPES).toContain("sleep_hygiene_plan");
    });
    it("INTERVENTION_TYPES contains therapeutic_support", () => {
      expect(INTERVENTION_TYPES).toContain("therapeutic_support");
    });
    it("INTERVENTION_TYPES contains medication_review", () => {
      expect(INTERVENTION_TYPES).toContain("medication_review");
    });
    it("INTERVENTION_TYPES contains clinical_referral", () => {
      expect(INTERVENTION_TYPES).toContain("clinical_referral");
    });
    it("INTERVENTION_TYPES contains environmental_adjustment", () => {
      expect(INTERVENTION_TYPES).toContain("environmental_adjustment");
    });
    it("INTERVENTION_TYPES contains routine_modification", () => {
      expect(INTERVENTION_TYPES).toContain("routine_modification");
    });
    it("INTERVENTION_TYPES contains sensory_support", () => {
      expect(INTERVENTION_TYPES).toContain("sensory_support");
    });
    it("INTERVENTION_TYPES contains relaxation_techniques", () => {
      expect(INTERVENTION_TYPES).toContain("relaxation_techniques");
    });
    it("INTERVENTION_TYPES contains trauma_processing", () => {
      expect(INTERVENTION_TYPES).toContain("trauma_processing");
    });

    it("SEVERITY_LEVELS has 4 values", () => {
      expect(SEVERITY_LEVELS).toHaveLength(4);
    });
    it("SEVERITY_LEVELS contains mild", () => {
      expect(SEVERITY_LEVELS).toContain("mild");
    });
    it("SEVERITY_LEVELS contains moderate", () => {
      expect(SEVERITY_LEVELS).toContain("moderate");
    });
    it("SEVERITY_LEVELS contains severe", () => {
      expect(SEVERITY_LEVELS).toContain("severe");
    });
    it("SEVERITY_LEVELS contains crisis", () => {
      expect(SEVERITY_LEVELS).toContain("crisis");
    });

    it("OUTCOME_STATUSES has 6 values", () => {
      expect(OUTCOME_STATUSES).toHaveLength(6);
    });
    it("OUTCOME_STATUSES contains resolved_same_night", () => {
      expect(OUTCOME_STATUSES).toContain("resolved_same_night");
    });
    it("OUTCOME_STATUSES contains improved", () => {
      expect(OUTCOME_STATUSES).toContain("improved");
    });
    it("OUTCOME_STATUSES contains ongoing", () => {
      expect(OUTCOME_STATUSES).toContain("ongoing");
    });
    it("OUTCOME_STATUSES contains escalated", () => {
      expect(OUTCOME_STATUSES).toContain("escalated");
    });
    it("OUTCOME_STATUSES contains referral_made", () => {
      expect(OUTCOME_STATUSES).toContain("referral_made");
    });
    it("OUTCOME_STATUSES contains no_change", () => {
      expect(OUTCOME_STATUSES).toContain("no_change");
    });
  });

  // ── computeSleepDisturbanceMetrics ────────────────────────────────────

  describe("computeSleepDisturbanceMetrics", () => {
    describe("empty array", () => {
      it("returns zero total_incidents", () => {
        expect(computeSleepDisturbanceMetrics([]).total_incidents).toBe(0);
      });
      it("returns zero severe_count", () => {
        expect(computeSleepDisturbanceMetrics([]).severe_count).toBe(0);
      });
      it("returns zero crisis_count", () => {
        expect(computeSleepDisturbanceMetrics([]).crisis_count).toBe(0);
      });
      it("returns zero trauma_linked_count", () => {
        expect(computeSleepDisturbanceMetrics([]).trauma_linked_count).toBe(0);
      });
      it("returns zero ongoing_count", () => {
        expect(computeSleepDisturbanceMetrics([]).ongoing_count).toBe(0);
      });
      it("returns zero settled_within_hour_rate", () => {
        expect(computeSleepDisturbanceMetrics([]).settled_within_hour_rate).toBe(0);
      });
      it("returns zero sleep_plan_rate", () => {
        expect(computeSleepDisturbanceMetrics([]).sleep_plan_rate).toBe(0);
      });
      it("returns zero clinical_referral_rate", () => {
        expect(computeSleepDisturbanceMetrics([]).clinical_referral_rate).toBe(0);
      });
      it("returns zero pattern_identified_rate", () => {
        expect(computeSleepDisturbanceMetrics([]).pattern_identified_rate).toBe(0);
      });
      it("returns zero environment_adapted_rate", () => {
        expect(computeSleepDisturbanceMetrics([]).environment_adapted_rate).toBe(0);
      });
      it("returns zero staff_debriefed_rate", () => {
        expect(computeSleepDisturbanceMetrics([]).staff_debriefed_rate).toBe(0);
      });
      it("returns zero parent_informed_rate", () => {
        expect(computeSleepDisturbanceMetrics([]).parent_informed_rate).toBe(0);
      });
      it("returns zero trauma_link_rate", () => {
        expect(computeSleepDisturbanceMetrics([]).trauma_link_rate).toBe(0);
      });
      it("returns zero unique_children", () => {
        expect(computeSleepDisturbanceMetrics([]).unique_children).toBe(0);
      });
      it("returns empty disturbance_type_breakdown", () => {
        expect(computeSleepDisturbanceMetrics([]).disturbance_type_breakdown).toEqual({});
      });
      it("returns empty severity_breakdown", () => {
        expect(computeSleepDisturbanceMetrics([]).severity_breakdown).toEqual({});
      });
    });

    describe("single record counts", () => {
      it("counts total_incidents", () => {
        expect(computeSleepDisturbanceMetrics([makeRow()]).total_incidents).toBe(1);
      });
      it("counts severe_count", () => {
        expect(computeSleepDisturbanceMetrics([makeRow({ severity_level: "severe" })]).severe_count).toBe(1);
      });
      it("does not count mild as severe", () => {
        expect(computeSleepDisturbanceMetrics([makeRow({ severity_level: "mild" })]).severe_count).toBe(0);
      });
      it("counts crisis_count", () => {
        expect(computeSleepDisturbanceMetrics([makeRow({ severity_level: "crisis" })]).crisis_count).toBe(1);
      });
      it("does not count moderate as crisis", () => {
        expect(computeSleepDisturbanceMetrics([makeRow({ severity_level: "moderate" })]).crisis_count).toBe(0);
      });
      it("counts trauma_linked_count", () => {
        expect(computeSleepDisturbanceMetrics([makeRow({ trauma_link_identified: true })]).trauma_linked_count).toBe(1);
      });
      it("does not count non-trauma as trauma_linked", () => {
        expect(computeSleepDisturbanceMetrics([makeRow({ trauma_link_identified: false })]).trauma_linked_count).toBe(0);
      });
      it("counts ongoing_count", () => {
        expect(computeSleepDisturbanceMetrics([makeRow({ outcome_status: "ongoing" })]).ongoing_count).toBe(1);
      });
      it("does not count resolved as ongoing", () => {
        expect(computeSleepDisturbanceMetrics([makeRow({ outcome_status: "resolved_same_night" })]).ongoing_count).toBe(0);
      });
    });

    describe("boolean rates", () => {
      it("100% settled_within_hour_rate with defaults", () => {
        expect(computeSleepDisturbanceMetrics([makeRow()]).settled_within_hour_rate).toBe(100);
      });
      it("0% settled_within_hour_rate when false", () => {
        expect(computeSleepDisturbanceMetrics([makeRow({ child_settled_within_hour: false })]).settled_within_hour_rate).toBe(0);
      });
      it("100% sleep_plan_rate with defaults", () => {
        expect(computeSleepDisturbanceMetrics([makeRow()]).sleep_plan_rate).toBe(100);
      });
      it("0% sleep_plan_rate when false", () => {
        expect(computeSleepDisturbanceMetrics([makeRow({ sleep_plan_in_place: false })]).sleep_plan_rate).toBe(0);
      });
      it("100% clinical_referral_rate with defaults", () => {
        expect(computeSleepDisturbanceMetrics([makeRow()]).clinical_referral_rate).toBe(100);
      });
      it("0% clinical_referral_rate when false", () => {
        expect(computeSleepDisturbanceMetrics([makeRow({ clinical_referral_made: false })]).clinical_referral_rate).toBe(0);
      });
      it("100% parent_informed_rate with defaults", () => {
        expect(computeSleepDisturbanceMetrics([makeRow()]).parent_informed_rate).toBe(100);
      });
      it("0% parent_informed_rate when false", () => {
        expect(computeSleepDisturbanceMetrics([makeRow({ parent_carer_informed: false })]).parent_informed_rate).toBe(0);
      });
      it("100% staff_debriefed_rate with defaults", () => {
        expect(computeSleepDisturbanceMetrics([makeRow()]).staff_debriefed_rate).toBe(100);
      });
      it("0% staff_debriefed_rate when false", () => {
        expect(computeSleepDisturbanceMetrics([makeRow({ staff_debriefed: false })]).staff_debriefed_rate).toBe(0);
      });
      it("100% environment_adapted_rate with defaults", () => {
        expect(computeSleepDisturbanceMetrics([makeRow()]).environment_adapted_rate).toBe(100);
      });
      it("0% environment_adapted_rate when false", () => {
        expect(computeSleepDisturbanceMetrics([makeRow({ environment_adapted: false })]).environment_adapted_rate).toBe(0);
      });
      it("0% pattern_identified_rate with defaults (false)", () => {
        expect(computeSleepDisturbanceMetrics([makeRow()]).pattern_identified_rate).toBe(0);
      });
      it("100% pattern_identified_rate when true", () => {
        expect(computeSleepDisturbanceMetrics([makeRow({ pattern_identified: true })]).pattern_identified_rate).toBe(100);
      });
      it("0% trauma_link_rate with defaults (false)", () => {
        expect(computeSleepDisturbanceMetrics([makeRow()]).trauma_link_rate).toBe(0);
      });
      it("100% trauma_link_rate when true", () => {
        expect(computeSleepDisturbanceMetrics([makeRow({ trauma_link_identified: true })]).trauma_link_rate).toBe(100);
      });
      it("mixed boolean rate computes correctly (66.7%)", () => {
        const m = computeSleepDisturbanceMetrics([
          makeRow({ child_settled_within_hour: true }),
          makeRow({ child_settled_within_hour: false }),
          makeRow({ child_settled_within_hour: true }),
        ]);
        expect(m.settled_within_hour_rate).toBe(66.7);
      });
      it("mixed boolean rate 1/3 = 33.3%", () => {
        const m = computeSleepDisturbanceMetrics([
          makeRow({ sleep_plan_in_place: true }),
          makeRow({ sleep_plan_in_place: false }),
          makeRow({ sleep_plan_in_place: false }),
        ]);
        expect(m.sleep_plan_rate).toBe(33.3);
      });
    });

    describe("unique_children", () => {
      it("counts 1 for single record", () => {
        expect(computeSleepDisturbanceMetrics([makeRow()]).unique_children).toBe(1);
      });
      it("counts distinct names", () => {
        const m = computeSleepDisturbanceMetrics([
          makeRow({ child_name: "Alice" }),
          makeRow({ child_name: "Bob" }),
          makeRow({ child_name: "Alice" }),
        ]);
        expect(m.unique_children).toBe(2);
      });
      it("counts 3 for three different children", () => {
        const m = computeSleepDisturbanceMetrics([
          makeRow({ child_name: "A" }),
          makeRow({ child_name: "B" }),
          makeRow({ child_name: "C" }),
        ]);
        expect(m.unique_children).toBe(3);
      });
    });

    describe("disturbance_type_breakdown", () => {
      it("counts all 10 disturbance types", () => {
        const records = DISTURBANCE_TYPES.map((dt) => makeRow({ disturbance_type: dt }));
        const m = computeSleepDisturbanceMetrics(records);
        for (const dt of DISTURBANCE_TYPES) {
          expect(m.disturbance_type_breakdown[dt]).toBe(1);
        }
      });
      it("counts duplicates correctly", () => {
        const m = computeSleepDisturbanceMetrics([
          makeRow({ disturbance_type: "nightmares" }),
          makeRow({ disturbance_type: "nightmares" }),
          makeRow({ disturbance_type: "insomnia" }),
        ]);
        expect(m.disturbance_type_breakdown["nightmares"]).toBe(2);
        expect(m.disturbance_type_breakdown["insomnia"]).toBe(1);
      });
    });

    describe("severity_breakdown", () => {
      it("counts all 4 severity levels", () => {
        const records = SEVERITY_LEVELS.map((sl) => makeRow({ severity_level: sl }));
        const m = computeSleepDisturbanceMetrics(records);
        for (const sl of SEVERITY_LEVELS) {
          expect(m.severity_breakdown[sl]).toBe(1);
        }
      });
      it("counts duplicates correctly", () => {
        const m = computeSleepDisturbanceMetrics([
          makeRow({ severity_level: "mild" }),
          makeRow({ severity_level: "mild" }),
          makeRow({ severity_level: "crisis" }),
        ]);
        expect(m.severity_breakdown["mild"]).toBe(2);
        expect(m.severity_breakdown["crisis"]).toBe(1);
      });
    });
  });

  // ── computeSleepDisturbanceAlerts ─────────────────────────────────────

  describe("computeSleepDisturbanceAlerts", () => {
    it("returns empty for empty array", () => {
      expect(computeSleepDisturbanceAlerts([])).toEqual([]);
    });
    it("returns empty for clean record", () => {
      expect(computeSleepDisturbanceAlerts([makeRow()])).toEqual([]);
    });

    // crisis_no_clinical_referral
    it("fires crisis_no_clinical_referral", () => {
      const a = computeSleepDisturbanceAlerts([
        makeRow({ severity_level: "crisis", clinical_referral_made: false, child_name: "Jo" }),
      ]);
      const f = a.find((x) => x.type === "crisis_no_clinical_referral");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("critical");
      expect(f!.message).toContain("Jo");
      expect(f!.record_id).toBeDefined();
    });
    it("no crisis alert when clinical referral made", () => {
      const a = computeSleepDisturbanceAlerts([
        makeRow({ severity_level: "crisis", clinical_referral_made: true }),
      ]);
      expect(a.filter((x) => x.type === "crisis_no_clinical_referral")).toHaveLength(0);
    });
    it("no crisis alert for severe without referral", () => {
      const a = computeSleepDisturbanceAlerts([
        makeRow({ severity_level: "severe", clinical_referral_made: false }),
      ]);
      expect(a.filter((x) => x.type === "crisis_no_clinical_referral")).toHaveLength(0);
    });
    it("crisis alert per-record", () => {
      const a = computeSleepDisturbanceAlerts([
        makeRow({ id: "a-1", severity_level: "crisis", clinical_referral_made: false }),
        makeRow({ id: "a-2", severity_level: "crisis", clinical_referral_made: false }),
      ]);
      expect(a.filter((x) => x.type === "crisis_no_clinical_referral")).toHaveLength(2);
    });

    // severe_no_sleep_plan
    it("fires severe_no_sleep_plan", () => {
      const a = computeSleepDisturbanceAlerts([
        makeRow({ severity_level: "severe", sleep_plan_in_place: false, child_name: "Sam" }),
      ]);
      const f = a.find((x) => x.type === "severe_no_sleep_plan");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("Sam");
      expect(f!.record_id).toBeDefined();
    });
    it("no severe_no_sleep_plan when plan in place", () => {
      const a = computeSleepDisturbanceAlerts([
        makeRow({ severity_level: "severe", sleep_plan_in_place: true }),
      ]);
      expect(a.filter((x) => x.type === "severe_no_sleep_plan")).toHaveLength(0);
    });
    it("no severe_no_sleep_plan for mild", () => {
      const a = computeSleepDisturbanceAlerts([
        makeRow({ severity_level: "mild", sleep_plan_in_place: false }),
      ]);
      expect(a.filter((x) => x.type === "severe_no_sleep_plan")).toHaveLength(0);
    });
    it("severe_no_sleep_plan per-record", () => {
      const a = computeSleepDisturbanceAlerts([
        makeRow({ id: "b-1", severity_level: "severe", sleep_plan_in_place: false }),
        makeRow({ id: "b-2", severity_level: "severe", sleep_plan_in_place: false }),
      ]);
      expect(a.filter((x) => x.type === "severe_no_sleep_plan")).toHaveLength(2);
    });

    // trauma_link_no_therapeutic_support
    it("fires trauma_link_no_therapeutic_support", () => {
      const a = computeSleepDisturbanceAlerts([
        makeRow({ trauma_link_identified: true, intervention_type: "reassurance", child_name: "Lee" }),
      ]);
      const f = a.find((x) => x.type === "trauma_link_no_therapeutic_support");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("Lee");
      expect(f!.record_id).toBeDefined();
    });
    it("no trauma alert when therapeutic_support used", () => {
      const a = computeSleepDisturbanceAlerts([
        makeRow({ trauma_link_identified: true, intervention_type: "therapeutic_support" }),
      ]);
      expect(a.filter((x) => x.type === "trauma_link_no_therapeutic_support")).toHaveLength(0);
    });
    it("no trauma alert when no trauma link", () => {
      const a = computeSleepDisturbanceAlerts([
        makeRow({ trauma_link_identified: false, intervention_type: "reassurance" }),
      ]);
      expect(a.filter((x) => x.type === "trauma_link_no_therapeutic_support")).toHaveLength(0);
    });
    it("trauma alert per-record", () => {
      const a = computeSleepDisturbanceAlerts([
        makeRow({ id: "c-1", trauma_link_identified: true, intervention_type: "reassurance" }),
        makeRow({ id: "c-2", trauma_link_identified: true, intervention_type: "clinical_referral" }),
      ]);
      expect(a.filter((x) => x.type === "trauma_link_no_therapeutic_support")).toHaveLength(2);
    });

    // pattern_no_environment_adaptation
    it("fires pattern_no_environment_adaptation", () => {
      const a = computeSleepDisturbanceAlerts([
        makeRow({ pattern_identified: true, environment_adapted: false, child_name: "Pat" }),
      ]);
      const f = a.find((x) => x.type === "pattern_no_environment_adaptation");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("medium");
      expect(f!.message).toContain("Pat");
      expect(f!.record_id).toBeDefined();
    });
    it("no pattern alert when environment adapted", () => {
      const a = computeSleepDisturbanceAlerts([
        makeRow({ pattern_identified: true, environment_adapted: true }),
      ]);
      expect(a.filter((x) => x.type === "pattern_no_environment_adaptation")).toHaveLength(0);
    });
    it("no pattern alert when no pattern identified", () => {
      const a = computeSleepDisturbanceAlerts([
        makeRow({ pattern_identified: false, environment_adapted: false }),
      ]);
      expect(a.filter((x) => x.type === "pattern_no_environment_adaptation")).toHaveLength(0);
    });
    it("pattern alert per-record", () => {
      const a = computeSleepDisturbanceAlerts([
        makeRow({ id: "d-1", pattern_identified: true, environment_adapted: false }),
        makeRow({ id: "d-2", pattern_identified: true, environment_adapted: false }),
      ]);
      expect(a.filter((x) => x.type === "pattern_no_environment_adaptation")).toHaveLength(2);
    });

    // repeat_incidents
    it("fires repeat_incidents for 3+ same child", () => {
      const a = computeSleepDisturbanceAlerts([
        makeRow({ child_name: "Kai" }),
        makeRow({ child_name: "Kai" }),
        makeRow({ child_name: "Kai" }),
      ]);
      const f = a.find((x) => x.type === "repeat_incidents");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("medium");
      expect(f!.message).toContain("Kai");
      expect(f!.message).toContain("3");
    });
    it("no repeat_incidents for 2 same child", () => {
      const a = computeSleepDisturbanceAlerts([
        makeRow({ child_name: "Kai" }),
        makeRow({ child_name: "Kai" }),
      ]);
      expect(a.filter((x) => x.type === "repeat_incidents")).toHaveLength(0);
    });
    it("repeat_incidents per-child", () => {
      const a = computeSleepDisturbanceAlerts([
        makeRow({ child_name: "A" }),
        makeRow({ child_name: "A" }),
        makeRow({ child_name: "A" }),
        makeRow({ child_name: "B" }),
        makeRow({ child_name: "B" }),
        makeRow({ child_name: "B" }),
      ]);
      expect(a.filter((x) => x.type === "repeat_incidents")).toHaveLength(2);
    });
    it("repeat_incidents does not have record_id", () => {
      const a = computeSleepDisturbanceAlerts([
        makeRow({ child_name: "C" }),
        makeRow({ child_name: "C" }),
        makeRow({ child_name: "C" }),
      ]);
      const f = a.find((x) => x.type === "repeat_incidents");
      expect(f!.record_id).toBeUndefined();
    });
    it("repeat_incidents shows correct count for 5 incidents", () => {
      const a = computeSleepDisturbanceAlerts([
        makeRow({ child_name: "D" }),
        makeRow({ child_name: "D" }),
        makeRow({ child_name: "D" }),
        makeRow({ child_name: "D" }),
        makeRow({ child_name: "D" }),
      ]);
      const f = a.find((x) => x.type === "repeat_incidents");
      expect(f!.message).toContain("5");
    });

    // Combined alerts
    it("fires all applicable alert types together", () => {
      const a = computeSleepDisturbanceAlerts([
        makeRow({
          child_name: "Multi",
          severity_level: "crisis",
          clinical_referral_made: false,
          sleep_plan_in_place: false,
          trauma_link_identified: true,
          intervention_type: "reassurance",
          pattern_identified: true,
          environment_adapted: false,
        }),
        makeRow({ child_name: "Multi" }),
        makeRow({ child_name: "Multi" }),
      ]);
      const types = a.map((x) => x.type);
      expect(types).toContain("crisis_no_clinical_referral");
      expect(types).toContain("trauma_link_no_therapeutic_support");
      expect(types).toContain("pattern_no_environment_adaptation");
      expect(types).toContain("repeat_incidents");
    });
    it("severity ordering: critical alerts first", () => {
      const a = computeSleepDisturbanceAlerts([
        makeRow({ severity_level: "crisis", clinical_referral_made: false }),
      ]);
      expect(a[0].severity).toBe("critical");
    });
  });

  // ── generateSleepDisturbanceCaraInsights ──────────────────────────────

  describe("generateSleepDisturbanceCaraInsights", () => {
    it("returns exactly 3 insights for empty data", () => {
      const insights = generateSleepDisturbanceCaraInsights([]);
      expect(insights).toHaveLength(3);
    });
    it("returns exactly 3 insights for populated data", () => {
      const insights = generateSleepDisturbanceCaraInsights([makeRow(), makeRow()]);
      expect(insights).toHaveLength(3);
    });
    it("insight 1 starts with [indigo]", () => {
      expect(generateSleepDisturbanceCaraInsights([])[0]).toMatch(/^\[indigo\]/);
    });
    it("insight 2 starts with [amber]", () => {
      expect(generateSleepDisturbanceCaraInsights([])[1]).toMatch(/^\[amber\]/);
    });
    it("insight 3 starts with [reflect]", () => {
      expect(generateSleepDisturbanceCaraInsights([])[2]).toMatch(/^\[reflect\]/);
    });
    it("insight 1 contains total incidents count", () => {
      const insights = generateSleepDisturbanceCaraInsights([makeRow(), makeRow()]);
      expect(insights[0]).toContain("2 sleep disturbance incidents");
    });
    it("insight 1 contains unique children count", () => {
      const insights = generateSleepDisturbanceCaraInsights([
        makeRow({ child_name: "A" }),
        makeRow({ child_name: "B" }),
      ]);
      expect(insights[0]).toContain("2 children");
    });
    it("insight 1 uses singular child for 1", () => {
      const insights = generateSleepDisturbanceCaraInsights([makeRow()]);
      expect(insights[0]).toContain("1 child");
    });
    it("insight 1 contains severe count", () => {
      const insights = generateSleepDisturbanceCaraInsights([
        makeRow({ severity_level: "severe" }),
      ]);
      expect(insights[0]).toContain("1 severe");
    });
    it("insight 1 contains crisis count", () => {
      const insights = generateSleepDisturbanceCaraInsights([
        makeRow({ severity_level: "crisis" }),
      ]);
      expect(insights[0]).toContain("1 crisis");
    });
    it("insight 1 contains trauma-linked count", () => {
      const insights = generateSleepDisturbanceCaraInsights([
        makeRow({ trauma_link_identified: true }),
      ]);
      expect(insights[0]).toContain("1 trauma-linked");
    });
    it("insight 1 contains settled within hour rate", () => {
      const insights = generateSleepDisturbanceCaraInsights([makeRow()]);
      expect(insights[0]).toContain("100%");
    });

    // Insight 2 with alerts
    it("insight 2 mentions critical and high counts when present", () => {
      const insights = generateSleepDisturbanceCaraInsights([
        makeRow({ severity_level: "crisis", clinical_referral_made: false }),
      ]);
      expect(insights[1]).toContain("1 critical");
    });
    it("insight 2 says no alerts when clean", () => {
      const insights = generateSleepDisturbanceCaraInsights([makeRow()]);
      expect(insights[1]).toContain("No critical or high-priority alerts");
    });
    it("insight 2 includes sleep plan rate", () => {
      const insights = generateSleepDisturbanceCaraInsights([makeRow()]);
      expect(insights[1]).toContain("Sleep plan rate");
    });
    it("insight 2 includes clinical referral rate", () => {
      const insights = generateSleepDisturbanceCaraInsights([makeRow()]);
      expect(insights[1]).toContain("Clinical referral rate");
    });

    // Insight 3 branches
    it("insight 3 mentions trauma when trauma_linked > 0", () => {
      const insights = generateSleepDisturbanceCaraInsights([
        makeRow({ trauma_link_identified: true }),
      ]);
      expect(insights[2]).toContain("trauma link");
    });
    it("insight 3 mentions ongoing when ongoing > 0 and no trauma", () => {
      const insights = generateSleepDisturbanceCaraInsights([
        makeRow({ outcome_status: "ongoing", trauma_link_identified: false }),
      ]);
      expect(insights[2]).toContain("ongoing");
    });
    it("insight 3 uses singular for 1 trauma-linked incident", () => {
      const insights = generateSleepDisturbanceCaraInsights([
        makeRow({ trauma_link_identified: true }),
      ]);
      expect(insights[2]).toContain("1 incident has");
    });
    it("insight 3 uses plural for 2 trauma-linked incidents", () => {
      const insights = generateSleepDisturbanceCaraInsights([
        makeRow({ trauma_link_identified: true }),
        makeRow({ trauma_link_identified: true }),
      ]);
      expect(insights[2]).toContain("2 incidents have");
    });
    it("insight 3 uses singular for 1 ongoing incident", () => {
      const insights = generateSleepDisturbanceCaraInsights([
        makeRow({ outcome_status: "ongoing", trauma_link_identified: false }),
      ]);
      expect(insights[2]).toContain("1 incident remains");
    });
    it("insight 3 uses plural for 2 ongoing incidents", () => {
      const insights = generateSleepDisturbanceCaraInsights([
        makeRow({ outcome_status: "ongoing", trauma_link_identified: false }),
        makeRow({ outcome_status: "ongoing", trauma_link_identified: false }),
      ]);
      expect(insights[2]).toContain("2 incidents remain");
    });
    it("insight 3 gives positive message when no trauma or ongoing", () => {
      const insights = generateSleepDisturbanceCaraInsights([makeRow()]);
      expect(insights[2]).toContain("No trauma-linked or ongoing");
    });
    it("all insights are non-empty strings", () => {
      const insights = generateSleepDisturbanceCaraInsights([makeRow()]);
      for (const insight of insights) {
        expect(typeof insight).toBe("string");
        expect(insight.length).toBeGreaterThan(0);
      }
    });
  });
});
