import { describe, it, expect } from "vitest";
import { _testing, type ShiftHandoverQualityRecord } from "../shift-handover-quality-service";
import { todayStr } from "@/lib/utils";

const { computeShiftHandoverQualityMetrics, identifyShiftHandoverQualityAlerts } = _testing;

const now = new Date(todayStr());

function makeRecord(overrides?: Partial<ShiftHandoverQualityRecord>): ShiftHandoverQualityRecord {
  return {
    id: overrides?.id ?? "a-1", home_id: overrides?.home_id ?? "home-1",
    handover_type: overrides?.handover_type ?? "day_to_night",
    quality_rating: overrides?.quality_rating ?? "good",
    completion_status: overrides?.completion_status ?? "fully_complete",
    handover_format: overrides?.handover_format ?? "verbal_and_written",
    handover_date: overrides?.handover_date ?? todayStr(),
    outgoing_staff: overrides?.outgoing_staff ?? "Staff A",
    incoming_staff: overrides?.incoming_staff ?? "Staff B",
    medication_info_shared: overrides?.medication_info_shared ?? true,
    safeguarding_updates: overrides?.safeguarding_updates ?? true,
    incident_continuity: overrides?.incident_continuity ?? true,
    care_plan_updates: overrides?.care_plan_updates ?? true,
    risk_info_shared: overrides?.risk_info_shared ?? true,
    appointments_communicated: overrides?.appointments_communicated ?? true,
    behaviour_updates: overrides?.behaviour_updates ?? true,
    emotional_wellbeing_noted: overrides?.emotional_wellbeing_noted ?? true,
    food_dietary_noted: overrides?.food_dietary_noted ?? true,
    contact_updates: overrides?.contact_updates ?? true,
    key_tasks_identified: overrides?.key_tasks_identified ?? true,
    read_and_signed: overrides?.read_and_signed ?? true,
    issues_found: overrides?.issues_found ?? [], actions_taken: overrides?.actions_taken ?? [],
    audited_by: overrides?.audited_by ?? "Manager A",
    next_audit_date: "next_audit_date" in (overrides ?? {}) ? (overrides!.next_audit_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(), updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("shift-handover-quality-service", () => {
  describe("computeShiftHandoverQualityMetrics", () => {
    it("returns zeros for empty", () => { 
      const m = computeShiftHandoverQualityMetrics([]);
      expect(m.total_audits).toBe(0);;
      expect(m.excellent_count).toBe(0);
      expect(m.good_count).toBe(0);
      expect(m.poor_count).toBe(0);
      expect(m.inadequate_count).toBe(0);
      expect(m.fully_complete_count).toBe(0);
      expect(m.incomplete_count).toBe(0);
      expect(m.medication_info_rate).toBeNull();;
    });
    it("returns empty breakdowns", () => { 
      const m = computeShiftHandoverQualityMetrics([]);
      expect(m.by_handover_type).toEqual({});
      expect(m.by_quality_rating).toEqual({});
      expect(m.by_completion_status).toEqual({});
      expect(m.by_handover_format).toEqual({});
    });
    it("counts excellent", () => { expect(computeShiftHandoverQualityMetrics([makeRecord({ quality_rating: "excellent" })]).excellent_count).toBe(1); });
    it("counts good", () => { expect(computeShiftHandoverQualityMetrics([makeRecord()]).good_count).toBe(1); });
    it("counts poor", () => { expect(computeShiftHandoverQualityMetrics([makeRecord({ quality_rating: "poor" })]).poor_count).toBe(1); });
    it("counts inadequate", () => { expect(computeShiftHandoverQualityMetrics([makeRecord({ quality_rating: "inadequate" })]).inadequate_count).toBe(1); });
    it("counts fully_complete", () => { expect(computeShiftHandoverQualityMetrics([makeRecord()]).fully_complete_count).toBe(1); });
    it("counts incomplete includes not_done", () => { const m = computeShiftHandoverQualityMetrics([makeRecord({ completion_status: "incomplete" }), makeRecord({ completion_status: "not_done" })]); expect(m.incomplete_count).toBe(2); });
    it("returns 100% boolean rates with defaults", () => { 
      const m = computeShiftHandoverQualityMetrics([makeRecord()]);
      expect(m.medication_info_rate).toBe(100);
      expect(m.safeguarding_updates_rate).toBe(100);
      expect(m.incident_continuity_rate).toBe(100);
      expect(m.care_plan_updates_rate).toBe(100);
      expect(m.risk_info_rate).toBe(100);
      expect(m.appointments_rate).toBe(100);
      expect(m.behaviour_updates_rate).toBe(100);
      expect(m.emotional_wellbeing_rate).toBe(100);
      expect(m.food_dietary_rate).toBe(100);
      expect(m.contact_updates_rate).toBe(100);
      expect(m.key_tasks_rate).toBe(100);
      expect(m.read_and_signed_rate).toBe(100);
    });
    it("medication_info_rate 0 when false", () => { expect(computeShiftHandoverQualityMetrics([makeRecord({ medication_info_shared: false })]).medication_info_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeShiftHandoverQualityMetrics([makeRecord({ medication_info_shared: true }), makeRecord({ medication_info_shared: false }), makeRecord({ medication_info_shared: true })]); expect(m.medication_info_rate).toBe(66.7); });
    it("counts all 10 handover types", () => { const types = ["day_to_night","night_to_day","day_to_day","weekend_handover","emergency_handover","staff_changeover","management_handover","agency_staff_handover","annual_leave_return","other"] as const; const records = types.map(t => makeRecord({ handover_type: t })); const m = computeShiftHandoverQualityMetrics(records); for (const t of types) expect(m.by_handover_type[t]).toBe(1); });
    it("counts all 5 ratings", () => { const ratings = ["excellent","good","adequate","poor","inadequate"] as const; const records = ratings.map(r => makeRecord({ quality_rating: r })); const m = computeShiftHandoverQualityMetrics(records); for (const r of ratings) expect(m.by_quality_rating[r]).toBe(1); });
    it("counts all 5 statuses", () => { const statuses = ["fully_complete","mostly_complete","partially_complete","incomplete","not_done"] as const; const records = statuses.map(s => makeRecord({ completion_status: s })); const m = computeShiftHandoverQualityMetrics(records); for (const s of statuses) expect(m.by_completion_status[s]).toBe(1); });
    it("counts all 5 formats", () => { const formats = ["face_to_face","written_only","verbal_and_written","digital_system","telephone"] as const; const records = formats.map(f => makeRecord({ handover_format: f })); const m = computeShiftHandoverQualityMetrics(records); for (const f of formats) expect(m.by_handover_format[f]).toBe(1); });
  });

  describe("identifyShiftHandoverQualityAlerts", () => {
    it("returns empty for clean", () => { expect(identifyShiftHandoverQualityAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyShiftHandoverQualityAlerts([])).toEqual([]); });
    it("fires inadequate_safeguarding_gap", () => { 
      const a = identifyShiftHandoverQualityAlerts([makeRecord({ quality_rating: "inadequate", safeguarding_updates: false, handover_date: "2026-05-14", outgoing_staff: "Jo", incoming_staff: "Sam" })]);
      expect(a[0].type).toBe("inadequate_safeguarding_gap");
      expect(a[0].severity).toBe("critical");
      expect(a[0].message).toContain("Jo");
      expect(a[0].message).toContain("Sam");
    });
    it("inadequate_safeguarding_gap per-record", () => { const a = identifyShiftHandoverQualityAlerts([makeRecord({ id: "a-1", quality_rating: "inadequate", safeguarding_updates: false }), makeRecord({ id: "a-2", quality_rating: "inadequate", safeguarding_updates: false })]); expect(a.filter(x => x.type === "inadequate_safeguarding_gap")).toHaveLength(2); });
    it("no inadequate alert if safeguarding shared", () => { expect(identifyShiftHandoverQualityAlerts([makeRecord({ quality_rating: "inadequate", safeguarding_updates: true })]).filter(x => x.type === "inadequate_safeguarding_gap")).toHaveLength(0); });
    it("fires medication_not_shared singular", () => { 
      const a = identifyShiftHandoverQualityAlerts([makeRecord({ medication_info_shared: false })]);
      const f = a.find(x => x.type === "medication_not_shared");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 handover has");
    });
    it("medication_not_shared plural", () => { const a = identifyShiftHandoverQualityAlerts([makeRecord({ medication_info_shared: false }), makeRecord({ medication_info_shared: false })]); const f = a.find(x => x.type === "medication_not_shared"); expect(f!.message).toContain("2 handovers have"); });
    it("fires risk_not_shared singular", () => { const a = identifyShiftHandoverQualityAlerts([makeRecord({ risk_info_shared: false })]); expect(a.find(x => x.type === "risk_not_shared")).toBeDefined(); });
    it("not_read_signed not for 1", () => { expect(identifyShiftHandoverQualityAlerts([makeRecord({ read_and_signed: false })]).find(x => x.type === "not_read_signed")).toBeUndefined(); });
    it("not_read_signed fires for 2", () => { const a = identifyShiftHandoverQualityAlerts([makeRecord({ read_and_signed: false }), makeRecord({ read_and_signed: false })]); expect(a.find(x => x.type === "not_read_signed")).toBeDefined(); });
    it("care_plan_not_shared not for 2", () => { expect(identifyShiftHandoverQualityAlerts([makeRecord({ care_plan_updates: false }), makeRecord({ care_plan_updates: false })]).find(x => x.type === "care_plan_not_shared")).toBeUndefined(); });
    it("care_plan_not_shared fires for 3", () => { const a = identifyShiftHandoverQualityAlerts([makeRecord({ care_plan_updates: false }), makeRecord({ care_plan_updates: false }), makeRecord({ care_plan_updates: false })]); expect(a.find(x => x.type === "care_plan_not_shared")).toBeDefined(); });
    it("fires all applicable", () => { 
      const a = identifyShiftHandoverQualityAlerts([makeRecord({ quality_rating: "inadequate", safeguarding_updates: false, medication_info_shared: false, risk_info_shared: false, read_and_signed: false, care_plan_updates: false }), makeRecord({ read_and_signed: false, care_plan_updates: false }), makeRecord({ care_plan_updates: false })]);
      const types = a.map(x => x.type);
      expect(types).toContain("inadequate_safeguarding_gap");
      expect(types).toContain("medication_not_shared");
      expect(types).toContain("risk_not_shared");
      expect(types).toContain("not_read_signed");
      expect(types).toContain("care_plan_not_shared");
    });
  });
});
