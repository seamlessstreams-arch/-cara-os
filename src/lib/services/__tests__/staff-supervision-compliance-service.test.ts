import { describe, it, expect } from "vitest";
import { _testing, type StaffSupervisionComplianceRecord } from "../staff-supervision-compliance-service";

const { computeStaffSupervisionComplianceMetrics, identifyStaffSupervisionComplianceAlerts } = _testing;

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRecord(overrides?: Partial<StaffSupervisionComplianceRecord>): StaffSupervisionComplianceRecord {
  return {
    id: overrides?.id ?? "a-1", home_id: overrides?.home_id ?? "home-1",
    supervision_type: overrides?.supervision_type ?? "formal_one_to_one",
    frequency_compliance: overrides?.frequency_compliance ?? "on_schedule",
    quality_rating: overrides?.quality_rating ?? "good",
    action_completion: overrides?.action_completion ?? "all_complete",
    supervision_date: overrides?.supervision_date ?? now.toISOString().split("T")[0],
    staff_name: overrides?.staff_name ?? "Staff A",
    supervisor_name: overrides?.supervisor_name ?? "Manager A",
    agenda_prepared: overrides?.agenda_prepared ?? true,
    safeguarding_discussed: overrides?.safeguarding_discussed ?? true,
    wellbeing_discussed: overrides?.wellbeing_discussed ?? true,
    training_needs_reviewed: overrides?.training_needs_reviewed ?? true,
    actions_agreed: overrides?.actions_agreed ?? true,
    previous_actions_reviewed: overrides?.previous_actions_reviewed ?? true,
    professional_development_planned: overrides?.professional_development_planned ?? true,
    concerns_raised: overrides?.concerns_raised ?? false,
    confidentiality_maintained: overrides?.confidentiality_maintained ?? true,
    notes_shared: overrides?.notes_shared ?? true,
    manager_oversight: overrides?.manager_oversight ?? true,
    recorded_promptly: overrides?.recorded_promptly ?? true,
    supervision_duration_minutes: overrides?.supervision_duration_minutes ?? 60,
    issues_found: overrides?.issues_found ?? [], actions_taken: overrides?.actions_taken ?? [],
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(), updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("staff-supervision-compliance-service", () => {
  describe("computeStaffSupervisionComplianceMetrics", () => {
    it("returns zeros for empty", () => { const m = computeStaffSupervisionComplianceMetrics([]); expect(m.total_supervisions).toBe(0); expect(m.overdue_count).toBe(0); expect(m.missed_count).toBe(0); expect(m.poor_quality_count).toBe(0); expect(m.not_started_count).toBe(0); expect(m.agenda_prepared_rate).toBe(0); expect(m.average_duration).toBe(0); expect(m.unique_staff).toBe(0); });
    it("returns empty breakdowns", () => { const m = computeStaffSupervisionComplianceMetrics([]); expect(m.by_supervision_type).toEqual({}); expect(m.by_frequency_compliance).toEqual({}); expect(m.by_quality_rating).toEqual({}); expect(m.by_action_completion).toEqual({}); });
    it("total_supervisions counts records", () => { expect(computeStaffSupervisionComplianceMetrics([makeRecord(), makeRecord()]).total_supervisions).toBe(2); });
    it("counts overdue", () => { expect(computeStaffSupervisionComplianceMetrics([makeRecord({ frequency_compliance: "significantly_overdue" })]).overdue_count).toBe(1); });
    it("does not count slightly_overdue as overdue", () => { expect(computeStaffSupervisionComplianceMetrics([makeRecord({ frequency_compliance: "slightly_overdue" })]).overdue_count).toBe(0); });
    it("counts missed", () => { expect(computeStaffSupervisionComplianceMetrics([makeRecord({ frequency_compliance: "missed" })]).missed_count).toBe(1); });
    it("counts poor_quality", () => { expect(computeStaffSupervisionComplianceMetrics([makeRecord({ quality_rating: "poor" })]).poor_quality_count).toBe(1); });
    it("counts not_started", () => { expect(computeStaffSupervisionComplianceMetrics([makeRecord({ action_completion: "not_started" })]).not_started_count).toBe(1); });
    it("returns 100% boolean rates with defaults", () => { const m = computeStaffSupervisionComplianceMetrics([makeRecord()]); expect(m.agenda_prepared_rate).toBe(100); expect(m.safeguarding_discussed_rate).toBe(100); expect(m.wellbeing_discussed_rate).toBe(100); expect(m.training_needs_rate).toBe(100); expect(m.actions_agreed_rate).toBe(100); expect(m.previous_actions_rate).toBe(100); expect(m.professional_development_rate).toBe(100); expect(m.confidentiality_rate).toBe(100); expect(m.notes_shared_rate).toBe(100); expect(m.manager_oversight_rate).toBe(100); expect(m.recorded_promptly_rate).toBe(100); });
    it("agenda_prepared_rate 0 when false", () => { expect(computeStaffSupervisionComplianceMetrics([makeRecord({ agenda_prepared: false })]).agenda_prepared_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeStaffSupervisionComplianceMetrics([makeRecord({ safeguarding_discussed: true }), makeRecord({ safeguarding_discussed: false }), makeRecord({ safeguarding_discussed: true })]); expect(m.safeguarding_discussed_rate).toBe(66.7); });
    it("average_duration correct", () => { const m = computeStaffSupervisionComplianceMetrics([makeRecord({ supervision_duration_minutes: 30 }), makeRecord({ supervision_duration_minutes: 90 })]); expect(m.average_duration).toBe(60); });
    it("unique_staff distinct", () => { const m = computeStaffSupervisionComplianceMetrics([makeRecord({ staff_name: "A" }), makeRecord({ staff_name: "B" }), makeRecord({ staff_name: "A" })]); expect(m.unique_staff).toBe(2); });
    it("counts all 10 supervision types", () => { const types = ["formal_one_to_one","group_supervision","ad_hoc","reflective_practice","clinical_supervision","management_supervision","peer_supervision","external_supervision","probationary_review","other"] as const; const records = types.map(t => makeRecord({ supervision_type: t })); const m = computeStaffSupervisionComplianceMetrics(records); for (const t of types) expect(m.by_supervision_type[t]).toBe(1); });
    it("counts all 5 frequency compliances", () => { const compliances = ["on_schedule","slightly_overdue","significantly_overdue","missed","ahead_of_schedule"] as const; const records = compliances.map(c => makeRecord({ frequency_compliance: c })); const m = computeStaffSupervisionComplianceMetrics(records); for (const c of compliances) expect(m.by_frequency_compliance[c]).toBe(1); });
    it("counts all 5 quality ratings", () => { const ratings = ["excellent","good","satisfactory","poor","not_assessed"] as const; const records = ratings.map(r => makeRecord({ quality_rating: r })); const m = computeStaffSupervisionComplianceMetrics(records); for (const r of ratings) expect(m.by_quality_rating[r]).toBe(1); });
    it("counts all 5 action completions", () => { const completions = ["all_complete","mostly_complete","partially_complete","not_started","not_applicable"] as const; const records = completions.map(c => makeRecord({ action_completion: c })); const m = computeStaffSupervisionComplianceMetrics(records); for (const c of completions) expect(m.by_action_completion[c]).toBe(1); });
  });

  describe("identifyStaffSupervisionComplianceAlerts", () => {
    it("returns empty for clean", () => { expect(identifyStaffSupervisionComplianceAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyStaffSupervisionComplianceAlerts([])).toEqual([]); });
    it("fires missed_with_concerns", () => { const a = identifyStaffSupervisionComplianceAlerts([makeRecord({ frequency_compliance: "missed", concerns_raised: true, staff_name: "Jo" })]); expect(a[0].type).toBe("missed_with_concerns"); expect(a[0].severity).toBe("critical"); expect(a[0].message).toContain("Jo"); });
    it("missed without concerns no critical alert", () => { expect(identifyStaffSupervisionComplianceAlerts([makeRecord({ frequency_compliance: "missed", concerns_raised: false })]).find(x => x.type === "missed_with_concerns")).toBeUndefined(); });
    it("fires supervision_overdue for significantly_overdue", () => { const a = identifyStaffSupervisionComplianceAlerts([makeRecord({ frequency_compliance: "significantly_overdue" })]); const f = a.find(x => x.type === "supervision_overdue"); expect(f).toBeDefined(); expect(f!.severity).toBe("high"); });
    it("fires supervision_overdue for missed", () => { const a = identifyStaffSupervisionComplianceAlerts([makeRecord({ frequency_compliance: "missed" })]); expect(a.find(x => x.type === "supervision_overdue")).toBeDefined(); });
    it("supervision_overdue plural", () => { const a = identifyStaffSupervisionComplianceAlerts([makeRecord({ frequency_compliance: "significantly_overdue" }), makeRecord({ frequency_compliance: "missed" })]); const f = a.find(x => x.type === "supervision_overdue"); expect(f!.message).toContain("2 supervisions are"); });
    it("fires safeguarding_not_discussed singular", () => { const a = identifyStaffSupervisionComplianceAlerts([makeRecord({ safeguarding_discussed: false })]); const f = a.find(x => x.type === "safeguarding_not_discussed"); expect(f).toBeDefined(); expect(f!.severity).toBe("high"); expect(f!.message).toContain("1 supervision has"); });
    it("safeguarding_not_discussed plural", () => { const a = identifyStaffSupervisionComplianceAlerts([makeRecord({ safeguarding_discussed: false }), makeRecord({ safeguarding_discussed: false })]); const f = a.find(x => x.type === "safeguarding_not_discussed"); expect(f!.message).toContain("2 supervisions have"); });
    it("actions_not_reviewed not for 1", () => { expect(identifyStaffSupervisionComplianceAlerts([makeRecord({ previous_actions_reviewed: false })]).find(x => x.type === "actions_not_reviewed")).toBeUndefined(); });
    it("actions_not_reviewed fires for 2", () => { const a = identifyStaffSupervisionComplianceAlerts([makeRecord({ previous_actions_reviewed: false }), makeRecord({ previous_actions_reviewed: false })]); expect(a.find(x => x.type === "actions_not_reviewed")).toBeDefined(); expect(a.find(x => x.type === "actions_not_reviewed")!.severity).toBe("medium"); });
    it("training_not_reviewed not for 1", () => { expect(identifyStaffSupervisionComplianceAlerts([makeRecord({ training_needs_reviewed: false })]).find(x => x.type === "training_not_reviewed")).toBeUndefined(); });
    it("training_not_reviewed fires for 2", () => { const a = identifyStaffSupervisionComplianceAlerts([makeRecord({ training_needs_reviewed: false }), makeRecord({ training_needs_reviewed: false })]); expect(a.find(x => x.type === "training_not_reviewed")).toBeDefined(); expect(a.find(x => x.type === "training_not_reviewed")!.severity).toBe("medium"); });
    it("fires all applicable", () => { const a = identifyStaffSupervisionComplianceAlerts([makeRecord({ frequency_compliance: "missed", concerns_raised: true, safeguarding_discussed: false, previous_actions_reviewed: false, training_needs_reviewed: false }), makeRecord({ frequency_compliance: "significantly_overdue", safeguarding_discussed: false, previous_actions_reviewed: false, training_needs_reviewed: false })]); const types = a.map(x => x.type); expect(types).toContain("missed_with_concerns"); expect(types).toContain("supervision_overdue"); expect(types).toContain("safeguarding_not_discussed"); expect(types).toContain("actions_not_reviewed"); expect(types).toContain("training_not_reviewed"); });
  });
});
