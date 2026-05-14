import { describe, it, expect } from "vitest";
import { _testing, type StaffLoneWorkingRecord } from "../staff-lone-working-service";

const { computeStaffLoneWorkingMetrics, identifyStaffLoneWorkingAlerts } = _testing;

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRecord(overrides?: Partial<StaffLoneWorkingRecord>): StaffLoneWorkingRecord {
  return {
    id: overrides?.id ?? "a-1", home_id: overrides?.home_id ?? "home-1",
    lone_working_scenario: overrides?.lone_working_scenario ?? "night_shift_solo",
    risk_level: overrides?.risk_level ?? "medium",
    check_in_frequency: overrides?.check_in_frequency ?? "hourly",
    authorisation_level: overrides?.authorisation_level ?? "manager_approved",
    assessment_date: overrides?.assessment_date ?? now.toISOString().split("T")[0],
    staff_name: overrides?.staff_name ?? "Staff A",
    risk_assessed: overrides?.risk_assessed ?? true,
    manager_authorised: overrides?.manager_authorised ?? true,
    communication_plan: overrides?.communication_plan ?? true,
    emergency_contacts_available: overrides?.emergency_contacts_available ?? true,
    phone_charged: overrides?.phone_charged ?? true,
    check_in_protocol_agreed: overrides?.check_in_protocol_agreed ?? true,
    buddy_system_available: overrides?.buddy_system_available ?? true,
    panic_alarm_available: overrides?.panic_alarm_available ?? true,
    first_aid_trained: overrides?.first_aid_trained ?? true,
    medication_trained: overrides?.medication_trained ?? true,
    safeguarding_trained: overrides?.safeguarding_trained ?? true,
    lone_working_policy_read: overrides?.lone_working_policy_read ?? true,
    issues_found: overrides?.issues_found ?? [], actions_taken: overrides?.actions_taken ?? [],
    assessed_by: overrides?.assessed_by ?? "Manager A",
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(), updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("staff-lone-working-service", () => {
  describe("computeStaffLoneWorkingMetrics", () => {
    it("returns zeros for empty", () => { const m = computeStaffLoneWorkingMetrics([]); expect(m.total_assessments).toBe(0); expect(m.very_high_count).toBe(0); expect(m.high_count).toBe(0); expect(m.emergency_only_count).toBe(0); expect(m.not_authorised_count).toBe(0); expect(m.risk_assessed_rate).toBe(0); expect(m.unique_staff).toBe(0); });
    it("returns empty breakdowns", () => { const m = computeStaffLoneWorkingMetrics([]); expect(m.by_scenario).toEqual({}); expect(m.by_risk_level).toEqual({}); expect(m.by_check_in_frequency).toEqual({}); expect(m.by_authorisation_level).toEqual({}); });
    it("counts very_high", () => { expect(computeStaffLoneWorkingMetrics([makeRecord({ risk_level: "very_high" })]).very_high_count).toBe(1); });
    it("counts high", () => { expect(computeStaffLoneWorkingMetrics([makeRecord({ risk_level: "high" })]).high_count).toBe(1); });
    it("counts emergency_only", () => { expect(computeStaffLoneWorkingMetrics([makeRecord({ authorisation_level: "emergency_only" })]).emergency_only_count).toBe(1); });
    it("counts not_authorised when false", () => { expect(computeStaffLoneWorkingMetrics([makeRecord({ manager_authorised: false })]).not_authorised_count).toBe(1); });
    it("not_authorised 0 when true", () => { expect(computeStaffLoneWorkingMetrics([makeRecord()]).not_authorised_count).toBe(0); });
    it("returns 100% boolean rates with defaults", () => { const m = computeStaffLoneWorkingMetrics([makeRecord()]); expect(m.risk_assessed_rate).toBe(100); expect(m.manager_authorised_rate).toBe(100); expect(m.communication_plan_rate).toBe(100); expect(m.emergency_contacts_rate).toBe(100); expect(m.phone_charged_rate).toBe(100); expect(m.check_in_protocol_rate).toBe(100); expect(m.buddy_system_rate).toBe(100); expect(m.panic_alarm_rate).toBe(100); expect(m.first_aid_trained_rate).toBe(100); expect(m.medication_trained_rate).toBe(100); expect(m.safeguarding_trained_rate).toBe(100); expect(m.policy_read_rate).toBe(100); });
    it("risk_assessed_rate 0 when false", () => { expect(computeStaffLoneWorkingMetrics([makeRecord({ risk_assessed: false })]).risk_assessed_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeStaffLoneWorkingMetrics([makeRecord({ risk_assessed: true }), makeRecord({ risk_assessed: false }), makeRecord({ risk_assessed: true })]); expect(m.risk_assessed_rate).toBe(66.7); });
    it("unique_staff distinct", () => { const m = computeStaffLoneWorkingMetrics([makeRecord({ staff_name: "A" }), makeRecord({ staff_name: "B" }), makeRecord({ staff_name: "A" })]); expect(m.unique_staff).toBe(2); });
    it("counts all 10 scenarios", () => { const scenarios = ["night_shift_solo","community_activity","school_run","medical_appointment","emergency_cover","sleep_in","home_maintenance","office_admin","transport","other"] as const; const records = scenarios.map(s => makeRecord({ lone_working_scenario: s })); const m = computeStaffLoneWorkingMetrics(records); for (const s of scenarios) expect(m.by_scenario[s]).toBe(1); });
    it("counts all 5 risk levels", () => { const levels = ["very_high","high","medium","low","minimal"] as const; const records = levels.map(l => makeRecord({ risk_level: l })); const m = computeStaffLoneWorkingMetrics(records); for (const l of levels) expect(m.by_risk_level[l]).toBe(1); });
    it("counts all 5 check-in frequencies", () => { const freqs = ["every_30_minutes","hourly","every_2_hours","every_4_hours","start_and_end"] as const; const records = freqs.map(f => makeRecord({ check_in_frequency: f })); const m = computeStaffLoneWorkingMetrics(records); for (const f of freqs) expect(m.by_check_in_frequency[f]).toBe(1); });
    it("counts all 5 authorisation levels", () => { const levels = ["manager_approved","senior_approved","ri_approved","emergency_only","standing_arrangement"] as const; const records = levels.map(l => makeRecord({ authorisation_level: l })); const m = computeStaffLoneWorkingMetrics(records); for (const l of levels) expect(m.by_authorisation_level[l]).toBe(1); });
    it("total_assessments counts all", () => { expect(computeStaffLoneWorkingMetrics([makeRecord(), makeRecord(), makeRecord()]).total_assessments).toBe(3); });
    it("multiple risk levels counted correctly", () => { const m = computeStaffLoneWorkingMetrics([makeRecord({ risk_level: "very_high" }), makeRecord({ risk_level: "very_high" }), makeRecord({ risk_level: "high" })]); expect(m.very_high_count).toBe(2); expect(m.high_count).toBe(1); });
  });

  describe("identifyStaffLoneWorkingAlerts", () => {
    it("returns empty for clean", () => { expect(identifyStaffLoneWorkingAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyStaffLoneWorkingAlerts([])).toEqual([]); });
    it("fires very_high_not_authorised", () => { const a = identifyStaffLoneWorkingAlerts([makeRecord({ risk_level: "very_high", manager_authorised: false, staff_name: "Jo", lone_working_scenario: "emergency_cover" })]); expect(a[0].type).toBe("very_high_not_authorised"); expect(a[0].severity).toBe("critical"); expect(a[0].message).toContain("Jo"); expect(a[0].message).toContain("emergency cover"); });
    it("very_high_not_authorised per-record", () => { const a = identifyStaffLoneWorkingAlerts([makeRecord({ id: "a-1", risk_level: "very_high", manager_authorised: false }), makeRecord({ id: "a-2", risk_level: "very_high", manager_authorised: false })]); expect(a.filter(x => x.type === "very_high_not_authorised")).toHaveLength(2); });
    it("no alert if very_high with authorisation", () => { expect(identifyStaffLoneWorkingAlerts([makeRecord({ risk_level: "very_high", manager_authorised: true })]).filter(x => x.type === "very_high_not_authorised")).toHaveLength(0); });
    it("fires not_risk_assessed singular", () => { const a = identifyStaffLoneWorkingAlerts([makeRecord({ risk_assessed: false })]); const f = a.find(x => x.type === "not_risk_assessed"); expect(f).toBeDefined(); expect(f!.severity).toBe("high"); expect(f!.message).toContain("1 lone working arrangement has"); });
    it("not_risk_assessed plural", () => { const a = identifyStaffLoneWorkingAlerts([makeRecord({ risk_assessed: false }), makeRecord({ risk_assessed: false })]); const f = a.find(x => x.type === "not_risk_assessed"); expect(f!.message).toContain("2 lone working arrangements have"); });
    it("fires no_communication_plan singular", () => { const a = identifyStaffLoneWorkingAlerts([makeRecord({ communication_plan: false })]); const f = a.find(x => x.type === "no_communication_plan"); expect(f).toBeDefined(); expect(f!.severity).toBe("high"); expect(f!.message).toContain("1 lone working arrangement has"); });
    it("no_communication_plan plural", () => { const a = identifyStaffLoneWorkingAlerts([makeRecord({ communication_plan: false }), makeRecord({ communication_plan: false })]); const f = a.find(x => x.type === "no_communication_plan"); expect(f!.message).toContain("2 lone working arrangements have"); });
    it("no_check_in_protocol not for 1", () => { expect(identifyStaffLoneWorkingAlerts([makeRecord({ check_in_protocol_agreed: false })]).find(x => x.type === "no_check_in_protocol")).toBeUndefined(); });
    it("no_check_in_protocol fires for 2", () => { const a = identifyStaffLoneWorkingAlerts([makeRecord({ check_in_protocol_agreed: false }), makeRecord({ check_in_protocol_agreed: false })]); expect(a.find(x => x.type === "no_check_in_protocol")).toBeDefined(); });
    it("policy_not_read not for 1", () => { expect(identifyStaffLoneWorkingAlerts([makeRecord({ lone_working_policy_read: false })]).find(x => x.type === "policy_not_read")).toBeUndefined(); });
    it("policy_not_read fires for 2", () => { const a = identifyStaffLoneWorkingAlerts([makeRecord({ lone_working_policy_read: false }), makeRecord({ lone_working_policy_read: false })]); expect(a.find(x => x.type === "policy_not_read")).toBeDefined(); });
    it("fires all applicable", () => { const a = identifyStaffLoneWorkingAlerts([makeRecord({ risk_level: "very_high", manager_authorised: false, risk_assessed: false, communication_plan: false, check_in_protocol_agreed: false, lone_working_policy_read: false }), makeRecord({ check_in_protocol_agreed: false, lone_working_policy_read: false })]); const types = a.map(x => x.type); expect(types).toContain("very_high_not_authorised"); expect(types).toContain("not_risk_assessed"); expect(types).toContain("no_communication_plan"); expect(types).toContain("no_check_in_protocol"); expect(types).toContain("policy_not_read"); });
  });
});
