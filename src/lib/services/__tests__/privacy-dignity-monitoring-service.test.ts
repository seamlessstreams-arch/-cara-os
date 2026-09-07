import { describe, it, expect } from "vitest";
import { _testing, type PrivacyDignityMonitoringRecord } from "../privacy-dignity-monitoring-service";
import { todayStr } from "@/lib/utils";

const { computePrivacyDignityMetrics, identifyPrivacyDignityAlerts } = _testing;

const now = new Date(todayStr());

function makeRecord(overrides?: Partial<PrivacyDignityMonitoringRecord>): PrivacyDignityMonitoringRecord {
  return {
    id: "a-1", home_id: "home-1",
    privacy_area: "bedroom_privacy",
    dignity_rating: "good",
    intrusion_type: "none",
    response_quality: "good",
    monitoring_date: todayStr(),
    child_name: "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
    monitored_by: "Staff A",
    child_views_sought: true,
    knock_before_entry: true,
    personal_space_respected: true,
    confidentiality_maintained: true,
    complaints_process_explained: true,
    staff_awareness_adequate: true,
    care_plan_reflects: true,
    social_worker_informed: true,
    intimate_care_policy_followed: true,
    cctv_compliant: true,
    dignity_in_language: true,
    recorded_promptly: true,
    issues_found: [], actions_taken: [],
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: now.toISOString(), updated_at: now.toISOString(),
      // Overrides win last: an explicit null stays null — the old
    // `overrides?.x ?? default` fabricated answers inside the factory.
    ...overrides,
  };
}

describe("privacy-dignity-monitoring-service", () => {
  describe("computePrivacyDignityMetrics", () => {
    it("returns zeros for empty", () => { 
      const m = computePrivacyDignityMetrics([]);
      expect(m.total_checks).toBe(0);;
      expect(m.poor_dignity_count).toBe(0);
      expect(m.unacceptable_count).toBe(0);
      expect(m.intrusion_count).toBe(0);
      expect(m.no_response_count).toBe(0);
      expect(m.child_views_rate).toBeNull();;
      expect(m.unique_children).toBe(0);
    });
    it("returns empty breakdowns", () => { 
      const m = computePrivacyDignityMetrics([]);
      expect(m.by_privacy_area).toEqual({});
      expect(m.by_dignity_rating).toEqual({});
      expect(m.by_intrusion_type).toEqual({});
      expect(m.by_response_quality).toEqual({});
    });
    it("total_checks counts records", () => { expect(computePrivacyDignityMetrics([makeRecord(), makeRecord()]).total_checks).toBe(2); });
    it("counts poor_dignity", () => { expect(computePrivacyDignityMetrics([makeRecord({ dignity_rating: "poor" })]).poor_dignity_count).toBe(1); });
    it("counts unacceptable", () => { expect(computePrivacyDignityMetrics([makeRecord({ dignity_rating: "unacceptable" })]).unacceptable_count).toBe(1); });
    it("does not count adequate as poor", () => { expect(computePrivacyDignityMetrics([makeRecord({ dignity_rating: "adequate" })]).poor_dignity_count).toBe(0); });
    it("counts intrusions (not none)", () => { expect(computePrivacyDignityMetrics([makeRecord({ intrusion_type: "room_entry_without_knock" })]).intrusion_count).toBe(1); });
    it("no intrusion when none", () => { expect(computePrivacyDignityMetrics([makeRecord({ intrusion_type: "none" })]).intrusion_count).toBe(0); });
    it("counts no_response", () => { expect(computePrivacyDignityMetrics([makeRecord({ response_quality: "no_response" })]).no_response_count).toBe(1); });
    it("returns 100% boolean rates with defaults", () => { 
      const m = computePrivacyDignityMetrics([makeRecord()]);
      expect(m.child_views_rate).toBe(100);
      expect(m.knock_rate).toBe(100);
      expect(m.personal_space_rate).toBe(100);
      expect(m.confidentiality_rate).toBe(100);
      expect(m.complaints_process_rate).toBe(100);
      expect(m.staff_awareness_rate).toBe(100);
      expect(m.care_plan_rate).toBe(100);
      expect(m.social_worker_rate).toBe(100);
      expect(m.intimate_care_rate).toBe(100);
      expect(m.cctv_rate).toBe(100);
      expect(m.dignity_language_rate).toBe(100);
      expect(m.recorded_promptly_rate).toBe(100);
    });
    it("knock_rate 0 when false", () => { expect(computePrivacyDignityMetrics([makeRecord({ knock_before_entry: false })]).knock_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computePrivacyDignityMetrics([makeRecord({ confidentiality_maintained: true }), makeRecord({ confidentiality_maintained: false }), makeRecord({ confidentiality_maintained: true })]); expect(m.confidentiality_rate).toBe(66.7); });
    it("unique_children distinct", () => { const m = computePrivacyDignityMetrics([makeRecord({ child_name: "A" }), makeRecord({ child_name: "B" }), makeRecord({ child_name: "A" })]); expect(m.unique_children).toBe(2); });
    it("counts all 10 privacy areas", () => { const areas = ["bedroom_privacy","bathroom_privacy","personal_belongings","correspondence","phone_calls","online_communications","health_information","personal_records","intimate_care","other"] as const; const records = areas.map(a => makeRecord({ privacy_area: a })); const m = computePrivacyDignityMetrics(records); for (const a of areas) expect(m.by_privacy_area[a]).toBe(1); });
    it("counts all 5 dignity ratings", () => { const ratings = ["exemplary","good","adequate","poor","unacceptable"] as const; const records = ratings.map(r => makeRecord({ dignity_rating: r })); const m = computePrivacyDignityMetrics(records); for (const r of ratings) expect(m.by_dignity_rating[r]).toBe(1); });
    it("counts all 10 intrusion types", () => { const types = ["none","room_entry_without_knock","belongings_searched","mail_opened","phone_monitored","conversation_overheard","personal_info_shared","intimate_care_issue","cctv_concern","other"] as const; const records = types.map(t => makeRecord({ intrusion_type: t })); const m = computePrivacyDignityMetrics(records); for (const t of types) expect(m.by_intrusion_type[t]).toBe(1); });
    it("counts all 5 response qualities", () => { const qualities = ["excellent","good","adequate","poor","no_response"] as const; const records = qualities.map(q => makeRecord({ response_quality: q })); const m = computePrivacyDignityMetrics(records); for (const q of qualities) expect(m.by_response_quality[q]).toBe(1); });
  });

  describe("identifyPrivacyDignityAlerts", () => {
    it("returns empty for clean", () => { expect(identifyPrivacyDignityAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyPrivacyDignityAlerts([])).toEqual([]); });
    it("fires unacceptable_with_intrusion", () => { 
      const a = identifyPrivacyDignityAlerts([makeRecord({ dignity_rating: "unacceptable", intrusion_type: "room_entry_without_knock", child_name: "Jo" })]);
      expect(a[0].type).toBe("unacceptable_with_intrusion");
      expect(a[0].severity).toBe("critical");
      expect(a[0].message).toContain("Jo");
    });
    it("unacceptable_with_intrusion per-record", () => { const a = identifyPrivacyDignityAlerts([makeRecord({ id: "a-1", dignity_rating: "unacceptable", intrusion_type: "belongings_searched" }), makeRecord({ id: "a-2", dignity_rating: "unacceptable", intrusion_type: "mail_opened" })]); expect(a.filter(x => x.type === "unacceptable_with_intrusion")).toHaveLength(2); });
    it("unacceptable with no intrusion no critical", () => { expect(identifyPrivacyDignityAlerts([makeRecord({ dignity_rating: "unacceptable", intrusion_type: "none" })]).find(x => x.type === "unacceptable_with_intrusion")).toBeUndefined(); });
    it("good with intrusion no critical", () => { expect(identifyPrivacyDignityAlerts([makeRecord({ dignity_rating: "good", intrusion_type: "room_entry_without_knock" })]).find(x => x.type === "unacceptable_with_intrusion")).toBeUndefined(); });
    it("fires confidentiality_breach singular", () => { 
      const a = identifyPrivacyDignityAlerts([makeRecord({ confidentiality_maintained: false })]);
      const f = a.find(x => x.type === "confidentiality_breach");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 check shows");
    });
    it("confidentiality_breach plural", () => { const a = identifyPrivacyDignityAlerts([makeRecord({ confidentiality_maintained: false }), makeRecord({ confidentiality_maintained: false })]); const f = a.find(x => x.type === "confidentiality_breach"); expect(f!.message).toContain("2 checks show"); });
    it("fires no_knock_before_entry singular", () => { 
      const a = identifyPrivacyDignityAlerts([makeRecord({ knock_before_entry: false })]);
      const f = a.find(x => x.type === "no_knock_before_entry");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 check shows");
    });
    it("staff_awareness_lacking not for 1", () => { expect(identifyPrivacyDignityAlerts([makeRecord({ staff_awareness_adequate: false })]).find(x => x.type === "staff_awareness_lacking")).toBeUndefined(); });
    it("staff_awareness_lacking fires for 2", () => { const a = identifyPrivacyDignityAlerts([makeRecord({ staff_awareness_adequate: false }), makeRecord({ staff_awareness_adequate: false })]); expect(a.find(x => x.type === "staff_awareness_lacking")).toBeDefined(); expect(a.find(x => x.type === "staff_awareness_lacking")!.severity).toBe("medium"); });
    it("intimate_care_policy_breach not for 1", () => { expect(identifyPrivacyDignityAlerts([makeRecord({ intimate_care_policy_followed: false })]).find(x => x.type === "intimate_care_policy_breach")).toBeUndefined(); });
    it("intimate_care_policy_breach fires for 2", () => { const a = identifyPrivacyDignityAlerts([makeRecord({ intimate_care_policy_followed: false }), makeRecord({ intimate_care_policy_followed: false })]); expect(a.find(x => x.type === "intimate_care_policy_breach")).toBeDefined(); expect(a.find(x => x.type === "intimate_care_policy_breach")!.severity).toBe("medium"); });
    it("fires all applicable", () => { 
      const a = identifyPrivacyDignityAlerts([makeRecord({ dignity_rating: "unacceptable", intrusion_type: "room_entry_without_knock", confidentiality_maintained: false, knock_before_entry: false, staff_awareness_adequate: false, intimate_care_policy_followed: false }), makeRecord({ confidentiality_maintained: false, knock_before_entry: false, staff_awareness_adequate: false, intimate_care_policy_followed: false })]);
      const types = a.map(x => x.type);
      expect(types).toContain("unacceptable_with_intrusion");
      expect(types).toContain("confidentiality_breach");
      expect(types).toContain("no_knock_before_entry");
      expect(types).toContain("staff_awareness_lacking");
      expect(types).toContain("intimate_care_policy_breach");
    });
  });
});
