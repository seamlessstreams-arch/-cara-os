import { describe, it, expect } from "vitest";
import { _testing, type StaffSupportPlanRecord } from "../staff-support-plan-service";
import { todayStr } from "@/lib/utils";

const { computeSupportPlanMetrics, identifySupportPlanAlerts } = _testing;

const now = new Date(todayStr());

function makeRecord(overrides?: Partial<StaffSupportPlanRecord>): StaffSupportPlanRecord {
  return {
    id: "a-1", home_id: "home-1",
    concern_area: "wellbeing",
    plan_status: "active",
    approval_status: "approved",
    supervision_frequency: "fortnightly",
    session_date: todayStr(),
    staff_name: "Staff A",
    created_by: "Manager A",
    what_is_working_well: "Test working well",
    what_we_are_worried_about: "Test worried about",
    what_needs_to_improve: "Test improve",
    staff_id: "staff_id" in (overrides ?? {}) ? (overrides!.staff_id ?? null) : null,
    support_being_offered: "support_being_offered" in (overrides ?? {}) ? (overrides!.support_being_offered ?? null) : null,
    wellbeing_considerations: "wellbeing_considerations" in (overrides ?? {}) ? (overrides!.wellbeing_considerations ?? null) : null,
    reasonable_adjustments: "reasonable_adjustments" in (overrides ?? {}) ? (overrides!.reasonable_adjustments ?? null) : null,
    mentor_buddy: "mentor_buddy" in (overrides ?? {}) ? (overrides!.mentor_buddy ?? null) : null,
    timescale: "timescale" in (overrides ?? {}) ? (overrides!.timescale ?? null) : null,
    staff_response: "staff_response" in (overrides ?? {}) ? (overrides!.staff_response ?? null) : null,
    approved_by: "approved_by" in (overrides ?? {}) ? (overrides!.approved_by ?? null) : null,
    approved_at: "approved_at" in (overrides ?? {}) ? (overrides!.approved_at ?? null) : null,
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    what_working_well_recorded: true,
    concerns_documented: true,
    improvements_identified: true,
    support_offered: true,
    wellbeing_considered: true,
    adjustments_offered: true,
    mentor_assigned: true,
    staff_consulted: true,
    staff_agreed: true,
    review_date_set: true,
    approved_by_senior: true,
    recorded_promptly: true,
    issues_found: [], actions_taken: [],
    created_at: now.toISOString(), updated_at: now.toISOString(),
      // Overrides win last: an explicit null stays null — the old
    // `overrides?.x ?? default` fabricated answers inside the factory.
    ...overrides,
  };
}

describe("staff-support-plan-service", () => {
  describe("computeSupportPlanMetrics", () => {
    it("returns zeros for empty", () => { 
      const m = computeSupportPlanMetrics([]);
      expect(m.total_plans).toBe(0);;
      expect(m.active_count).toBe(0);
      expect(m.escalated_count).toBe(0);
      expect(m.pending_approval_count).toBe(0);
      expect(m.completed_count).toBe(0);
      expect(m.working_well_rate).toBeNull();;
      expect(m.unique_staff).toBe(0);
    });
    it("returns empty breakdowns", () => { 
      const m = computeSupportPlanMetrics([]);
      expect(m.by_concern_area).toEqual({});
      expect(m.by_plan_status).toEqual({});
      expect(m.by_approval_status).toEqual({});
      expect(m.by_supervision_frequency).toEqual({});
    });
    it("total_plans counts records", () => { expect(computeSupportPlanMetrics([makeRecord(), makeRecord({ id: "a-2" })]).total_plans).toBe(2); });
    it("counts active", () => { expect(computeSupportPlanMetrics([makeRecord({ plan_status: "active" })]).active_count).toBe(1); });
    it("counts escalated", () => { expect(computeSupportPlanMetrics([makeRecord({ plan_status: "escalated" })]).escalated_count).toBe(1); });
    it("does not count active as escalated", () => { expect(computeSupportPlanMetrics([makeRecord({ plan_status: "active" })]).escalated_count).toBe(0); });
    it("counts pending_approval", () => { expect(computeSupportPlanMetrics([makeRecord({ approval_status: "pending" })]).pending_approval_count).toBe(1); });
    it("counts completed", () => { expect(computeSupportPlanMetrics([makeRecord({ plan_status: "completed" })]).completed_count).toBe(1); });
    it("returns 100% boolean rates with defaults", () => { 
      const m = computeSupportPlanMetrics([makeRecord()]);
      expect(m.working_well_rate).toBe(100);
      expect(m.concerns_documented_rate).toBe(100);
      expect(m.improvements_rate).toBe(100);
      expect(m.support_offered_rate).toBe(100);
      expect(m.wellbeing_rate).toBe(100);
      expect(m.adjustments_rate).toBe(100);
      expect(m.mentor_rate).toBe(100);
      expect(m.staff_consulted_rate).toBe(100);
      expect(m.staff_agreed_rate).toBe(100);
      expect(m.review_date_rate).toBe(100);
      expect(m.approved_rate).toBe(100);
      expect(m.recorded_promptly_rate).toBe(100);
    });
    it("working_well_rate 0 when false", () => { expect(computeSupportPlanMetrics([makeRecord({ what_working_well_recorded: false })]).working_well_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeSupportPlanMetrics([makeRecord({ wellbeing_considered: true }), makeRecord({ wellbeing_considered: true }), makeRecord({ wellbeing_considered: false })]); expect(m.wellbeing_rate).toBe(66.7); });
    it("unique_staff distinct", () => { expect(computeSupportPlanMetrics([makeRecord({ staff_name: "A" }), makeRecord({ staff_name: "B" }), makeRecord({ staff_name: "A" })]).unique_staff).toBe(2); });
    it("counts all 10 concern areas", () => { const areas = ["wellbeing", "workload", "confidence", "competence", "attendance", "relationships", "boundaries", "communication", "record_keeping", "professional_conduct"] as const; const m = computeSupportPlanMetrics(areas.map((a) => makeRecord({ concern_area: a }))); for (const a of areas) expect(m.by_concern_area[a]).toBe(1); });
    it("counts all 5 plan statuses", () => { const statuses = ["draft", "active", "under_review", "completed", "escalated"] as const; const m = computeSupportPlanMetrics(statuses.map((s) => makeRecord({ plan_status: s }))); for (const s of statuses) expect(m.by_plan_status[s]).toBe(1); });
    it("counts all 5 approval statuses", () => { const approvals = ["pending", "approved", "returned", "withdrawn", "not_required"] as const; const m = computeSupportPlanMetrics(approvals.map((a) => makeRecord({ approval_status: a }))); for (const a of approvals) expect(m.by_approval_status[a]).toBe(1); });
    it("counts all 5 supervision frequencies", () => { const freqs = ["weekly", "fortnightly", "monthly", "six_weekly", "as_needed"] as const; const m = computeSupportPlanMetrics(freqs.map((f) => makeRecord({ supervision_frequency: f }))); for (const f of freqs) expect(m.by_supervision_frequency[f]).toBe(1); });
  });

  describe("identifySupportPlanAlerts", () => {
    it("returns empty for clean", () => { expect(identifySupportPlanAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifySupportPlanAlerts([])).toEqual([]); });
    it("fires escalated_unapproved for escalated + pending", () => { 
      const a = identifySupportPlanAlerts([makeRecord({ plan_status: "escalated", approval_status: "pending", staff_name: "Jo" })]);
      const f = a.find((x) => x.type === "escalated_unapproved");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("critical");
      expect(f!.message).toContain("Jo");
    });
    it("escalated_unapproved per-record", () => { const a = identifySupportPlanAlerts([makeRecord({ id: "x1", plan_status: "escalated", approval_status: "pending" }), makeRecord({ id: "x2", plan_status: "escalated", approval_status: "pending" })]); expect(a.filter((x) => x.type === "escalated_unapproved")).toHaveLength(2); });
    it("no critical when approved", () => { const a = identifySupportPlanAlerts([makeRecord({ plan_status: "escalated", approval_status: "approved" })]); expect(a.find((x) => x.type === "escalated_unapproved")).toBeUndefined(); });
    it("no critical for active", () => { const a = identifySupportPlanAlerts([makeRecord({ plan_status: "active", approval_status: "pending" })]); expect(a.find((x) => x.type === "escalated_unapproved")).toBeUndefined(); });
    it("fires no_staff_consulted singular", () => { 
      const a = identifySupportPlanAlerts([makeRecord({ staff_consulted: false })]);
      const f = a.find((x) => x.type === "no_staff_consulted");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 plan has");
    });
    it("no_staff_consulted plural", () => { const a = identifySupportPlanAlerts([makeRecord({ staff_consulted: false }), makeRecord({ staff_consulted: false })]); const f = a.find((x) => x.type === "no_staff_consulted"); expect(f!.message).toContain("2 plans have"); });
    it("fires no_wellbeing_considered singular", () => { 
      const a = identifySupportPlanAlerts([makeRecord({ wellbeing_considered: false })]);
      const f = a.find((x) => x.type === "no_wellbeing_considered");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 plan has");
    });
    it("no_mentor_assigned not for 1", () => { const a = identifySupportPlanAlerts([makeRecord({ mentor_assigned: false })]); expect(a.find((x) => x.type === "no_mentor_assigned")).toBeUndefined(); });
    it("no_mentor_assigned fires for 2", () => { const a = identifySupportPlanAlerts([makeRecord({ mentor_assigned: false }), makeRecord({ mentor_assigned: false })]); const f = a.find((x) => x.type === "no_mentor_assigned"); expect(f).toBeDefined(); expect(f!.severity).toBe("medium"); });
    it("no_adjustments_offered not for 1", () => { const a = identifySupportPlanAlerts([makeRecord({ adjustments_offered: false })]); expect(a.find((x) => x.type === "no_adjustments_offered")).toBeUndefined(); });
    it("no_adjustments_offered fires for 2", () => { const a = identifySupportPlanAlerts([makeRecord({ adjustments_offered: false }), makeRecord({ adjustments_offered: false })]); const f = a.find((x) => x.type === "no_adjustments_offered"); expect(f).toBeDefined(); expect(f!.severity).toBe("medium"); });
    it("fires all applicable", () => { 
      const shared = { staff_consulted: false, wellbeing_considered: false, mentor_assigned: false, adjustments_offered: false } as const;
      const a = identifySupportPlanAlerts([makeRecord({ id: "z1", plan_status: "escalated", approval_status: "pending", ...shared }), makeRecord({ id: "z2", ...shared })]);
      const types = a.map((x) => x.type);
      expect(types).toContain("escalated_unapproved");
      expect(types).toContain("no_staff_consulted");
      expect(types).toContain("no_wellbeing_considered");
      expect(types).toContain("no_mentor_assigned");
      expect(types).toContain("no_adjustments_offered");
    });
  });
});
