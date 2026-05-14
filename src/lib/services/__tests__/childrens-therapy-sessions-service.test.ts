import { describe, it, expect } from "vitest";
import { _testing, type ChildrensTherapySessionRecord } from "../childrens-therapy-sessions-service";

const { computeChildrensTherapyMetrics, identifyChildrensTherapyAlerts } = _testing;

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRecord(overrides?: Partial<ChildrensTherapySessionRecord>): ChildrensTherapySessionRecord {
  return {
    id: overrides?.id ?? "a-1", home_id: overrides?.home_id ?? "home-1",
    therapy_type: overrides?.therapy_type ?? "camhs",
    session_outcome: overrides?.session_outcome ?? "positive_progress",
    child_engagement: overrides?.child_engagement ?? "fully_engaged",
    therapy_frequency: overrides?.therapy_frequency ?? "weekly",
    session_date: overrides?.session_date ?? now.toISOString().split("T")[0],
    child_name: overrides?.child_name ?? "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
    therapist_name: overrides?.therapist_name ?? "Dr Smith",
    child_prepared: overrides?.child_prepared ?? true,
    transport_arranged: overrides?.transport_arranged ?? true,
    consent_current: overrides?.consent_current ?? true,
    feedback_obtained: overrides?.feedback_obtained ?? true,
    care_plan_updated: overrides?.care_plan_updated ?? true,
    social_worker_informed: overrides?.social_worker_informed ?? true,
    progress_documented: overrides?.progress_documented ?? true,
    goals_reviewed: overrides?.goals_reviewed ?? true,
    staff_briefed: overrides?.staff_briefed ?? true,
    follow_up_actions: overrides?.follow_up_actions ?? true,
    child_debriefed: overrides?.child_debriefed ?? true,
    multi_agency_liaison: overrides?.multi_agency_liaison ?? true,
    issues_found: overrides?.issues_found ?? [], actions_taken: overrides?.actions_taken ?? [],
    session_duration_minutes: overrides?.session_duration_minutes ?? 45,
    next_session_date: "next_session_date" in (overrides ?? {}) ? (overrides!.next_session_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(), updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("childrens-therapy-sessions-service", () => {
  describe("computeChildrensTherapyMetrics", () => {
    it("returns zeros for empty", () => { const m = computeChildrensTherapyMetrics([]); expect(m.total_sessions).toBe(0); expect(m.positive_progress_count).toBe(0); expect(m.declined_count).toBe(0); expect(m.cancelled_count).toBe(0); expect(m.refused_count).toBe(0); expect(m.child_prepared_rate).toBe(0); expect(m.average_duration).toBe(0); expect(m.unique_children).toBe(0); });
    it("returns empty breakdowns", () => { const m = computeChildrensTherapyMetrics([]); expect(m.by_therapy_type).toEqual({}); expect(m.by_session_outcome).toEqual({}); expect(m.by_child_engagement).toEqual({}); expect(m.by_therapy_frequency).toEqual({}); });
    it("counts positive_progress", () => { expect(computeChildrensTherapyMetrics([makeRecord()]).positive_progress_count).toBe(1); });
    it("counts declined", () => { expect(computeChildrensTherapyMetrics([makeRecord({ session_outcome: "session_declined" })]).declined_count).toBe(1); });
    it("counts cancelled", () => { expect(computeChildrensTherapyMetrics([makeRecord({ session_outcome: "session_cancelled" })]).cancelled_count).toBe(1); });
    it("counts refused from child_engagement", () => { expect(computeChildrensTherapyMetrics([makeRecord({ child_engagement: "refused" })]).refused_count).toBe(1); });
    it("refused_count 0 when not refused", () => { expect(computeChildrensTherapyMetrics([makeRecord()]).refused_count).toBe(0); });
    it("returns 100% boolean rates with defaults", () => { const m = computeChildrensTherapyMetrics([makeRecord()]); expect(m.child_prepared_rate).toBe(100); expect(m.transport_arranged_rate).toBe(100); expect(m.consent_current_rate).toBe(100); expect(m.feedback_obtained_rate).toBe(100); expect(m.care_plan_updated_rate).toBe(100); expect(m.social_worker_informed_rate).toBe(100); expect(m.progress_documented_rate).toBe(100); expect(m.goals_reviewed_rate).toBe(100); expect(m.staff_briefed_rate).toBe(100); expect(m.follow_up_actions_rate).toBe(100); expect(m.child_debriefed_rate).toBe(100); expect(m.multi_agency_rate).toBe(100); });
    it("child_prepared_rate 0 when false", () => { expect(computeChildrensTherapyMetrics([makeRecord({ child_prepared: false })]).child_prepared_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeChildrensTherapyMetrics([makeRecord({ child_prepared: true }), makeRecord({ child_prepared: false }), makeRecord({ child_prepared: true })]); expect(m.child_prepared_rate).toBe(66.7); });
    it("average_duration single", () => { expect(computeChildrensTherapyMetrics([makeRecord({ session_duration_minutes: 60 })]).average_duration).toBe(60); });
    it("average_duration multi", () => { expect(computeChildrensTherapyMetrics([makeRecord({ session_duration_minutes: 30 }), makeRecord({ session_duration_minutes: 60 })]).average_duration).toBe(45); });
    it("unique_children distinct", () => { const m = computeChildrensTherapyMetrics([makeRecord({ child_name: "A" }), makeRecord({ child_name: "B" }), makeRecord({ child_name: "A" })]); expect(m.unique_children).toBe(2); });
    it("counts all 10 therapy types", () => { const types = ["camhs","play_therapy","art_therapy","cbt","dbt","emdr","family_therapy","music_therapy","drama_therapy","other"] as const; const records = types.map(t => makeRecord({ therapy_type: t })); const m = computeChildrensTherapyMetrics(records); for (const t of types) expect(m.by_therapy_type[t]).toBe(1); });
    it("counts all 5 session outcomes", () => { const outcomes = ["positive_progress","some_engagement","no_engagement","session_declined","session_cancelled"] as const; const records = outcomes.map(o => makeRecord({ session_outcome: o })); const m = computeChildrensTherapyMetrics(records); for (const o of outcomes) expect(m.by_session_outcome[o]).toBe(1); });
    it("counts all 5 child engagements", () => { const engagements = ["fully_engaged","partially_engaged","reluctant","refused","not_assessed"] as const; const records = engagements.map(e => makeRecord({ child_engagement: e })); const m = computeChildrensTherapyMetrics(records); for (const e of engagements) expect(m.by_child_engagement[e]).toBe(1); });
    it("counts all 5 therapy frequencies", () => { const freqs = ["twice_weekly","weekly","fortnightly","monthly","as_needed"] as const; const records = freqs.map(f => makeRecord({ therapy_frequency: f })); const m = computeChildrensTherapyMetrics(records); for (const f of freqs) expect(m.by_therapy_frequency[f]).toBe(1); });
    it("total_sessions counts all", () => { expect(computeChildrensTherapyMetrics([makeRecord(), makeRecord(), makeRecord()]).total_sessions).toBe(3); });
    it("multiple outcomes counted correctly", () => { const m = computeChildrensTherapyMetrics([makeRecord({ session_outcome: "positive_progress" }), makeRecord({ session_outcome: "positive_progress" }), makeRecord({ session_outcome: "session_declined" })]); expect(m.positive_progress_count).toBe(2); expect(m.declined_count).toBe(1); });
  });

  describe("identifyChildrensTherapyAlerts", () => {
    it("returns empty for clean", () => { expect(identifyChildrensTherapyAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyChildrensTherapyAlerts([])).toEqual([]); });
    it("fires refused_no_consent", () => { const a = identifyChildrensTherapyAlerts([makeRecord({ child_engagement: "refused", consent_current: false, child_name: "Jo", therapy_type: "art_therapy", session_date: "2026-05-14" })]); expect(a[0].type).toBe("refused_no_consent"); expect(a[0].severity).toBe("critical"); expect(a[0].message).toContain("Jo"); expect(a[0].message).toContain("art therapy"); });
    it("refused_no_consent per-record", () => { const a = identifyChildrensTherapyAlerts([makeRecord({ id: "a-1", child_engagement: "refused", consent_current: false }), makeRecord({ id: "a-2", child_engagement: "refused", consent_current: false })]); expect(a.filter(x => x.type === "refused_no_consent")).toHaveLength(2); });
    it("no alert if refused with consent", () => { expect(identifyChildrensTherapyAlerts([makeRecord({ child_engagement: "refused", consent_current: true })]).filter(x => x.type === "refused_no_consent")).toHaveLength(0); });
    it("fires progress_not_documented singular", () => { const a = identifyChildrensTherapyAlerts([makeRecord({ progress_documented: false })]); const f = a.find(x => x.type === "progress_not_documented"); expect(f).toBeDefined(); expect(f!.severity).toBe("high"); expect(f!.message).toContain("1 therapy session has"); });
    it("progress_not_documented plural", () => { const a = identifyChildrensTherapyAlerts([makeRecord({ progress_documented: false }), makeRecord({ progress_documented: false })]); const f = a.find(x => x.type === "progress_not_documented"); expect(f!.message).toContain("2 therapy sessions have"); });
    it("fires child_not_debriefed singular", () => { const a = identifyChildrensTherapyAlerts([makeRecord({ child_debriefed: false })]); const f = a.find(x => x.type === "child_not_debriefed"); expect(f).toBeDefined(); expect(f!.severity).toBe("high"); expect(f!.message).toContain("1 session has"); });
    it("child_not_debriefed plural", () => { const a = identifyChildrensTherapyAlerts([makeRecord({ child_debriefed: false }), makeRecord({ child_debriefed: false })]); const f = a.find(x => x.type === "child_not_debriefed"); expect(f!.message).toContain("2 sessions have"); });
    it("care_plan_not_updated not for 1", () => { expect(identifyChildrensTherapyAlerts([makeRecord({ care_plan_updated: false })]).find(x => x.type === "care_plan_not_updated")).toBeUndefined(); });
    it("care_plan_not_updated fires for 2", () => { const a = identifyChildrensTherapyAlerts([makeRecord({ care_plan_updated: false }), makeRecord({ care_plan_updated: false })]); expect(a.find(x => x.type === "care_plan_not_updated")).toBeDefined(); });
    it("goals_not_reviewed not for 2", () => { expect(identifyChildrensTherapyAlerts([makeRecord({ goals_reviewed: false }), makeRecord({ goals_reviewed: false })]).find(x => x.type === "goals_not_reviewed")).toBeUndefined(); });
    it("goals_not_reviewed fires for 3", () => { const a = identifyChildrensTherapyAlerts([makeRecord({ goals_reviewed: false }), makeRecord({ goals_reviewed: false }), makeRecord({ goals_reviewed: false })]); expect(a.find(x => x.type === "goals_not_reviewed")).toBeDefined(); });
    it("fires all applicable", () => { const a = identifyChildrensTherapyAlerts([makeRecord({ child_engagement: "refused", consent_current: false, progress_documented: false, child_debriefed: false, care_plan_updated: false, goals_reviewed: false }), makeRecord({ care_plan_updated: false, goals_reviewed: false }), makeRecord({ goals_reviewed: false })]); const types = a.map(x => x.type); expect(types).toContain("refused_no_consent"); expect(types).toContain("progress_not_documented"); expect(types).toContain("child_not_debriefed"); expect(types).toContain("care_plan_not_updated"); expect(types).toContain("goals_not_reviewed"); });
  });
});
