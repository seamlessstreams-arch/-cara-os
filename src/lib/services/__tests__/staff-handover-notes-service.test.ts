import { describe, it, expect } from "vitest";
import { _testing, type StaffHandoverNotesRecord } from "../staff-handover-notes-service";
import { todayStr } from "@/lib/utils";

const { computeStaffHandoverNotesMetrics, identifyStaffHandoverNotesAlerts } = _testing;

const now = new Date(todayStr());

function makeRecord(overrides?: Partial<StaffHandoverNotesRecord>): StaffHandoverNotesRecord {
  return {
    id: overrides?.id ?? "a-1", home_id: overrides?.home_id ?? "home-1",
    note_category: overrides?.note_category ?? "child_update",
    note_priority: overrides?.note_priority ?? "medium",
    note_status: overrides?.note_status ?? "acknowledged",
    shift_type: overrides?.shift_type ?? "day_to_night",
    handover_date: overrides?.handover_date ?? todayStr(),
    outgoing_staff: overrides?.outgoing_staff ?? "Staff A",
    incoming_staff: overrides?.incoming_staff ?? "Staff B",
    child_specific: overrides?.child_specific ?? true,
    medication_related: overrides?.medication_related ?? true,
    safeguarding_related: overrides?.safeguarding_related ?? true,
    task_completed: overrides?.task_completed ?? true,
    follow_up_required: overrides?.follow_up_required ?? false,
    follow_up_completed: overrides?.follow_up_completed ?? false,
    acknowledged_by_incoming: overrides?.acknowledged_by_incoming ?? true,
    manager_informed: overrides?.manager_informed ?? true,
    time_sensitive: overrides?.time_sensitive ?? true,
    verbal_handover_given: overrides?.verbal_handover_given ?? true,
    written_record_complete: overrides?.written_record_complete ?? true,
    risk_related: overrides?.risk_related ?? true,
    social_worker_update: overrides?.social_worker_update ?? true,
    issues_found: overrides?.issues_found ?? [], actions_taken: overrides?.actions_taken ?? [],
    child_name: "child_name" in (overrides ?? {}) ? (overrides!.child_name ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(), updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("staff-handover-notes-service", () => {
  describe("computeStaffHandoverNotesMetrics", () => {
    it("returns zeros for empty", () => { 
      const m = computeStaffHandoverNotesMetrics([]);
      expect(m.total_notes).toBe(0);
      expect(m.critical_count).toBe(0);
      expect(m.high_count).toBe(0);
      expect(m.escalated_count).toBe(0);
      expect(m.pending_count).toBe(0);
      expect(m.child_specific_rate).toBeNull();
      expect(m.follow_up_required_count).toBe(0);
      expect(m.follow_up_completed_rate).toBeNull();
    });
    it("returns empty breakdowns", () => { 
      const m = computeStaffHandoverNotesMetrics([]);
      expect(m.by_note_category).toEqual({});
      expect(m.by_note_priority).toEqual({});
      expect(m.by_note_status).toEqual({});
      expect(m.by_shift_type).toEqual({});
    });
    it("counts critical", () => { expect(computeStaffHandoverNotesMetrics([makeRecord({ note_priority: "critical" })]).critical_count).toBe(1); });
    it("counts high", () => { expect(computeStaffHandoverNotesMetrics([makeRecord({ note_priority: "high" })]).high_count).toBe(1); });
    it("counts escalated", () => { expect(computeStaffHandoverNotesMetrics([makeRecord({ note_status: "escalated" })]).escalated_count).toBe(1); });
    it("counts pending", () => { expect(computeStaffHandoverNotesMetrics([makeRecord({ note_status: "pending" })]).pending_count).toBe(1); });
    it("returns 100% boolean rates with defaults", () => { 
      const m = computeStaffHandoverNotesMetrics([makeRecord()]);
      expect(m.child_specific_rate).toBe(100);
      expect(m.medication_related_rate).toBe(100);
      expect(m.safeguarding_related_rate).toBe(100);
      expect(m.task_completed_rate).toBe(100);
      expect(m.acknowledged_rate).toBe(100);
      expect(m.manager_informed_rate).toBe(100);
      expect(m.time_sensitive_rate).toBe(100);
      expect(m.verbal_handover_rate).toBe(100);
      expect(m.written_record_rate).toBe(100);
      expect(m.risk_related_rate).toBe(100);
      expect(m.social_worker_update_rate).toBe(100);
    });
    it("child_specific_rate 0 when false", () => { expect(computeStaffHandoverNotesMetrics([makeRecord({ child_specific: false })]).child_specific_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeStaffHandoverNotesMetrics([makeRecord({ child_specific: true }), makeRecord({ child_specific: false }), makeRecord({ child_specific: true })]); expect(m.child_specific_rate).toBe(66.7); });
    it("follow_up_required_count", () => { expect(computeStaffHandoverNotesMetrics([makeRecord({ follow_up_required: true }), makeRecord({ follow_up_required: false })]).follow_up_required_count).toBe(1); });
    it("follow_up_completed_rate only from required", () => { const m = computeStaffHandoverNotesMetrics([makeRecord({ follow_up_required: true, follow_up_completed: true }), makeRecord({ follow_up_required: true, follow_up_completed: false }), makeRecord({ follow_up_required: false, follow_up_completed: false })]); expect(m.follow_up_completed_rate).toBe(50); });
    it("follow_up_completed_rate 0 when none required", () => { expect(computeStaffHandoverNotesMetrics([makeRecord({ follow_up_required: false })]).follow_up_completed_rate).toBeNull();; });
    it("counts all 10 categories", () => { const cats = ["child_update","medication_reminder","task_handover","safeguarding_update","emotional_update","appointment_reminder","behaviour_update","contact_update","maintenance_request","other"] as const; const records = cats.map(c => makeRecord({ note_category: c })); const m = computeStaffHandoverNotesMetrics(records); for (const c of cats) expect(m.by_note_category[c]).toBe(1); });
    it("counts all 5 priorities", () => { const priorities = ["critical","high","medium","low","information_only"] as const; const records = priorities.map(p => makeRecord({ note_priority: p })); const m = computeStaffHandoverNotesMetrics(records); for (const p of priorities) expect(m.by_note_priority[p]).toBe(1); });
    it("counts all 5 statuses", () => { const statuses = ["pending","acknowledged","actioned","escalated","closed"] as const; const records = statuses.map(s => makeRecord({ note_status: s })); const m = computeStaffHandoverNotesMetrics(records); for (const s of statuses) expect(m.by_note_status[s]).toBe(1); });
    it("counts all 10 shift types", () => { const types = ["day_to_night","night_to_day","day_to_day","weekend_handover","emergency_handover","management_handover","agency_staff","annual_leave_return","training_return","other"] as const; const records = types.map(t => makeRecord({ shift_type: t })); const m = computeStaffHandoverNotesMetrics(records); for (const t of types) expect(m.by_shift_type[t]).toBe(1); });
  });

  describe("identifyStaffHandoverNotesAlerts", () => {
    it("returns empty for clean", () => { expect(identifyStaffHandoverNotesAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyStaffHandoverNotesAlerts([])).toEqual([]); });
    it("fires critical_safeguarding_pending", () => { 
      const a = identifyStaffHandoverNotesAlerts([makeRecord({ note_priority: "critical", safeguarding_related: true, note_status: "pending", outgoing_staff: "Jo", handover_date: "2026-05-14" })]);
      expect(a[0].type).toBe("critical_safeguarding_pending");
      expect(a[0].severity).toBe("critical");
      expect(a[0].message).toContain("Jo");
    });
    it("critical_safeguarding_pending per-record", () => { const a = identifyStaffHandoverNotesAlerts([makeRecord({ id: "a-1", note_priority: "critical", safeguarding_related: true, note_status: "pending" }), makeRecord({ id: "a-2", note_priority: "critical", safeguarding_related: true, note_status: "pending" })]); expect(a.filter(x => x.type === "critical_safeguarding_pending")).toHaveLength(2); });
    it("no critical alert if not safeguarding", () => { expect(identifyStaffHandoverNotesAlerts([makeRecord({ note_priority: "critical", safeguarding_related: false, note_status: "pending" })]).filter(x => x.type === "critical_safeguarding_pending")).toHaveLength(0); });
    it("no critical alert if not pending", () => { expect(identifyStaffHandoverNotesAlerts([makeRecord({ note_priority: "critical", safeguarding_related: true, note_status: "acknowledged" })]).filter(x => x.type === "critical_safeguarding_pending")).toHaveLength(0); });
    it("fires not_acknowledged singular", () => { 
      const a = identifyStaffHandoverNotesAlerts([makeRecord({ acknowledged_by_incoming: false })]);
      const f = a.find(x => x.type === "not_acknowledged");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 note has");
    });
    it("not_acknowledged plural", () => { const a = identifyStaffHandoverNotesAlerts([makeRecord({ acknowledged_by_incoming: false }), makeRecord({ acknowledged_by_incoming: false })]); const f = a.find(x => x.type === "not_acknowledged"); expect(f!.message).toContain("2 notes have"); });
    it("fires follow_up_overdue singular", () => { 
      const a = identifyStaffHandoverNotesAlerts([makeRecord({ follow_up_required: true, follow_up_completed: false })]);
      const f = a.find(x => x.type === "follow_up_overdue");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 note has");
    });
    it("follow_up_overdue not when completed", () => { expect(identifyStaffHandoverNotesAlerts([makeRecord({ follow_up_required: true, follow_up_completed: true })]).find(x => x.type === "follow_up_overdue")).toBeUndefined(); });
    it("no_written_record not for 1", () => { expect(identifyStaffHandoverNotesAlerts([makeRecord({ written_record_complete: false })]).find(x => x.type === "no_written_record")).toBeUndefined(); });
    it("no_written_record fires for 2", () => { const a = identifyStaffHandoverNotesAlerts([makeRecord({ written_record_complete: false }), makeRecord({ written_record_complete: false })]); expect(a.find(x => x.type === "no_written_record")).toBeDefined(); });
    it("no_verbal_handover not for 2", () => { expect(identifyStaffHandoverNotesAlerts([makeRecord({ verbal_handover_given: false }), makeRecord({ verbal_handover_given: false })]).find(x => x.type === "no_verbal_handover")).toBeUndefined(); });
    it("no_verbal_handover fires for 3", () => { const a = identifyStaffHandoverNotesAlerts([makeRecord({ verbal_handover_given: false }), makeRecord({ verbal_handover_given: false }), makeRecord({ verbal_handover_given: false })]); expect(a.find(x => x.type === "no_verbal_handover")).toBeDefined(); });
    it("fires all applicable", () => { 
      const a = identifyStaffHandoverNotesAlerts([makeRecord({ note_priority: "critical", safeguarding_related: true, note_status: "pending", acknowledged_by_incoming: false, follow_up_required: true, follow_up_completed: false, written_record_complete: false, verbal_handover_given: false }), makeRecord({ written_record_complete: false, verbal_handover_given: false }), makeRecord({ verbal_handover_given: false })]);
      const types = a.map(x => x.type);
      expect(types).toContain("critical_safeguarding_pending");
      expect(types).toContain("not_acknowledged");
      expect(types).toContain("follow_up_overdue");
      expect(types).toContain("no_written_record");
      expect(types).toContain("no_verbal_handover");
    });
  });
});
