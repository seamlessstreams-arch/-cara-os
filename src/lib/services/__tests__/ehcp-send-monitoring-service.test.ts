import { describe, it, expect } from "vitest";
import { _testing, type EhcpSendMonitoringRecord } from "../ehcp-send-monitoring-service";
import { todayStr } from "@/lib/utils";

const { computeEhcpSendMetrics, identifyEhcpSendAlerts } = _testing;

const now = new Date(todayStr());

function makeRecord(overrides?: Partial<EhcpSendMonitoringRecord>): EhcpSendMonitoringRecord {
  return {
    id: "a-1", home_id: "home-1",
    send_category: "autism_spectrum",
    ehcp_status: "plan_issued",
    provision_delivery: "fully_delivered",
    outcome_progress: "on_track",
    session_date: todayStr(),
    child_name: "Child A",
    recorded_by: "Staff A",
    primary_need_description: "Test need",
    provision_summary: "Test provision",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
    specialist_provision: "specialist_provision" in (overrides ?? {}) ? (overrides!.specialist_provision ?? null) : null,
    therapy_provision: "therapy_provision" in (overrides ?? {}) ? (overrides!.therapy_provision ?? null) : null,
    annual_review_date: "annual_review_date" in (overrides ?? {}) ? (overrides!.annual_review_date ?? null) : null,
    last_review_outcome: "last_review_outcome" in (overrides ?? {}) ? (overrides!.last_review_outcome ?? null) : null,
    outcomes_detail: "outcomes_detail" in (overrides ?? {}) ? (overrides!.outcomes_detail ?? null) : null,
    parent_carer_views: "parent_carer_views" in (overrides ?? {}) ? (overrides!.parent_carer_views ?? null) : null,
    child_views: "child_views" in (overrides ?? {}) ? (overrides!.child_views ?? null) : null,
    professional_advice: "professional_advice" in (overrides ?? {}) ? (overrides!.professional_advice ?? null) : null,
    local_authority_contact: "local_authority_contact" in (overrides ?? {}) ? (overrides!.local_authority_contact ?? null) : null,
    approved_by: "approved_by" in (overrides ?? {}) ? (overrides!.approved_by ?? null) : null,
    approved_at: "approved_at" in (overrides ?? {}) ? (overrides!.approved_at ?? null) : null,
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    ehcp_in_place: true,
    annual_review_completed: true,
    provision_monitored: true,
    outcomes_tracked: true,
    child_views_captured: true,
    parent_views_captured: true,
    professional_advice_sought: true,
    local_authority_engaged: true,
    school_liaison_active: true,
    transport_arranged: true,
    transition_planned: true,
    recorded_promptly: true,
    issues_found: [], actions_taken: [],
    created_at: now.toISOString(), updated_at: now.toISOString(),
      // Overrides win last: an explicit null stays null — the old
    // `overrides?.x ?? default` fabricated answers inside the factory.
    ...overrides,
  };
}

describe("ehcp-send-monitoring-service", () => {
  describe("computeEhcpSendMetrics", () => {
    it("returns zeros for empty", () => { 
      const m = computeEhcpSendMetrics([]);
      expect(m.total_records).toBe(0);;
      expect(m.not_delivered_count).toBe(0);
      expect(m.below_expected_count).toBe(0);
      expect(m.review_due_count).toBe(0);
      expect(m.no_ehcp_count).toBe(0);
      expect(m.ehcp_in_place_rate).toBeNull();;
      expect(m.unique_children).toBe(0);
    });
    it("returns empty breakdowns", () => { 
      const m = computeEhcpSendMetrics([]);
      expect(m.by_send_category).toEqual({});
      expect(m.by_ehcp_status).toEqual({});
      expect(m.by_provision_delivery).toEqual({});
      expect(m.by_outcome_progress).toEqual({});
    });
    it("counts total", () => { const m = computeEhcpSendMetrics([makeRecord(), makeRecord({ id: "a-2" })]); expect(m.total_records).toBe(2); });
    it("counts not_delivered", () => { const m = computeEhcpSendMetrics([makeRecord({ provision_delivery: "not_delivered" })]); expect(m.not_delivered_count).toBe(1); });
    it("counts below_expected for below_expected", () => { const m = computeEhcpSendMetrics([makeRecord({ outcome_progress: "below_expected" })]); expect(m.below_expected_count).toBe(1); });
    it("counts below_expected for significantly_below", () => { const m = computeEhcpSendMetrics([makeRecord({ outcome_progress: "significantly_below" })]); expect(m.below_expected_count).toBe(1); });
    it("does not count on_track as below_expected", () => { const m = computeEhcpSendMetrics([makeRecord({ outcome_progress: "on_track" })]); expect(m.below_expected_count).toBe(0); });
    it("counts review_due", () => { const m = computeEhcpSendMetrics([makeRecord({ ehcp_status: "annual_review_due" })]); expect(m.review_due_count).toBe(1); });
    it("counts no_ehcp", () => { const m = computeEhcpSendMetrics([makeRecord({ ehcp_in_place: false })]); expect(m.no_ehcp_count).toBe(1); });
    it("returns 100% boolean rates with defaults", () => { 
      const m = computeEhcpSendMetrics([makeRecord()]);
      expect(m.ehcp_in_place_rate).toBe(100);
      expect(m.annual_review_rate).toBe(100);
      expect(m.provision_monitored_rate).toBe(100);
      expect(m.outcomes_tracked_rate).toBe(100);
      expect(m.child_views_rate).toBe(100);
      expect(m.parent_views_rate).toBe(100);
      expect(m.professional_advice_rate).toBe(100);
      expect(m.la_engaged_rate).toBe(100);
      expect(m.school_liaison_rate).toBe(100);
      expect(m.transport_rate).toBe(100);
      expect(m.transition_planned_rate).toBe(100);
      expect(m.recorded_promptly_rate).toBe(100);
    });
    it("returns 0% rate when false", () => { expect(computeEhcpSendMetrics([makeRecord({ ehcp_in_place: false })]).ehcp_in_place_rate).toBe(0); });
    it("mixed boolean rate 66.7", () => { const m = computeEhcpSendMetrics([makeRecord({ ehcp_in_place: true }), makeRecord({ ehcp_in_place: false }), makeRecord({ ehcp_in_place: true })]); expect(m.ehcp_in_place_rate).toBe(66.7); });
    it("unique_children distinct", () => { const m = computeEhcpSendMetrics([makeRecord({ child_name: "A" }), makeRecord({ child_name: "B" }), makeRecord({ child_name: "A" })]); expect(m.unique_children).toBe(2); });
    it("counts all 10 send_categories", () => { const cats = ["cognition_learning","communication_interaction","social_emotional_mental_health","sensory_physical","autism_spectrum","specific_learning_difficulty","moderate_learning_difficulty","severe_learning_difficulty","speech_language","other"] as const; const records = cats.map(c => makeRecord({ send_category: c })); const m = computeEhcpSendMetrics(records); for (const c of cats) expect(m.by_send_category[c]).toBe(1); });
    it("counts all 10 ehcp_statuses", () => { const statuses = ["assessment_requested","assessment_in_progress","plan_issued","annual_review_due","annual_review_completed","plan_amended","plan_ceased","tribunal_pending","mediation","other"] as const; const records = statuses.map(s => makeRecord({ ehcp_status: s })); const m = computeEhcpSendMetrics(records); for (const s of statuses) expect(m.by_ehcp_status[s]).toBe(1); });
    it("counts all 5 provision_deliveries", () => { const dels = ["fully_delivered","mostly_delivered","partially_delivered","not_delivered","under_review"] as const; const records = dels.map(d => makeRecord({ provision_delivery: d })); const m = computeEhcpSendMetrics(records); for (const d of dels) expect(m.by_provision_delivery[d]).toBe(1); });
    it("counts all 5 outcome_progresses", () => { const progs = ["exceeding","on_track","below_expected","significantly_below","not_assessed"] as const; const records = progs.map(p => makeRecord({ outcome_progress: p })); const m = computeEhcpSendMetrics(records); for (const p of progs) expect(m.by_outcome_progress[p]).toBe(1); });
  });

  describe("identifyEhcpSendAlerts", () => {
    it("returns empty for clean", () => { expect(identifyEhcpSendAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyEhcpSendAlerts([])).toEqual([]); });
    it("fires not_delivered_below_expected critical", () => { 
      const a = identifyEhcpSendAlerts([makeRecord({ provision_delivery: "not_delivered", outcome_progress: "below_expected", child_name: "X" })]);
      expect(a[0].type).toBe("not_delivered_below_expected");
      expect(a[0].severity).toBe("critical");
      expect(a[0].message).toContain("X");
    });
    it("fires for not_delivered + significantly_below", () => { const a = identifyEhcpSendAlerts([makeRecord({ provision_delivery: "not_delivered", outcome_progress: "significantly_below" })]); expect(a.find(x => x.type === "not_delivered_below_expected")).toBeDefined(); });
    it("no critical when partially_delivered + below_expected", () => { const a = identifyEhcpSendAlerts([makeRecord({ provision_delivery: "partially_delivered", outcome_progress: "below_expected" })]); expect(a.find(x => x.type === "not_delivered_below_expected")).toBeUndefined(); });
    it("no critical when not_delivered + on_track", () => { const a = identifyEhcpSendAlerts([makeRecord({ provision_delivery: "not_delivered", outcome_progress: "on_track" })]); expect(a.find(x => x.type === "not_delivered_below_expected")).toBeUndefined(); });
    it("not_delivered_below_expected per-record", () => { const a = identifyEhcpSendAlerts([makeRecord({ id: "a-1", provision_delivery: "not_delivered", outcome_progress: "below_expected" }), makeRecord({ id: "a-2", provision_delivery: "not_delivered", outcome_progress: "significantly_below" })]); expect(a.filter(x => x.type === "not_delivered_below_expected")).toHaveLength(2); });
    it("fires no_ehcp_in_place high", () => { const a = identifyEhcpSendAlerts([makeRecord({ ehcp_in_place: false })]); const f = a.find(x => x.type === "no_ehcp_in_place"); expect(f).toBeDefined(); expect(f!.severity).toBe("high"); });
    it("fires child_views_not_captured high", () => { const a = identifyEhcpSendAlerts([makeRecord({ child_views_captured: false })]); const f = a.find(x => x.type === "child_views_not_captured"); expect(f).toBeDefined(); expect(f!.severity).toBe("high"); });
    it("annual_review_overdue not for 1", () => { expect(identifyEhcpSendAlerts([makeRecord({ annual_review_completed: false })]).find(x => x.type === "annual_review_overdue")).toBeUndefined(); });
    it("annual_review_overdue fires for 2", () => { const a = identifyEhcpSendAlerts([makeRecord({ annual_review_completed: false }), makeRecord({ annual_review_completed: false })]); expect(a.find(x => x.type === "annual_review_overdue")).toBeDefined(); expect(a.find(x => x.type === "annual_review_overdue")!.severity).toBe("medium"); });
    it("no_transition_planned not for 1", () => { expect(identifyEhcpSendAlerts([makeRecord({ transition_planned: false })]).find(x => x.type === "no_transition_planned")).toBeUndefined(); });
    it("no_transition_planned fires for 2", () => { const a = identifyEhcpSendAlerts([makeRecord({ transition_planned: false }), makeRecord({ transition_planned: false })]); expect(a.find(x => x.type === "no_transition_planned")).toBeDefined(); expect(a.find(x => x.type === "no_transition_planned")!.severity).toBe("medium"); });
    it("fires all applicable", () => { 
      const a = identifyEhcpSendAlerts([makeRecord({ provision_delivery: "not_delivered", outcome_progress: "below_expected", ehcp_in_place: false, child_views_captured: false, annual_review_completed: false, transition_planned: false }), makeRecord({ annual_review_completed: false, transition_planned: false })]);
      const types = a.map(x => x.type);
      expect(types).toContain("not_delivered_below_expected");
      expect(types).toContain("no_ehcp_in_place");
      expect(types).toContain("child_views_not_captured");
      expect(types).toContain("annual_review_overdue");
      expect(types).toContain("no_transition_planned");
    });
  });
});
