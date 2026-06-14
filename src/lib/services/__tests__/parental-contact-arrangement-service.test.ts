import { describe, it, expect } from "vitest";
import { _testing, type ParentalContactArrangementRow } from "../parental-contact-arrangement-service";

const { computeParentalContactMetrics, computeParentalContactAlerts, generateParentalContactCaraInsights } = _testing;

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRow(overrides?: Partial<ParentalContactArrangementRow>): ParentalContactArrangementRow {
  return {
    id: overrides?.id ?? "a-1", home_id: overrides?.home_id ?? "home-1",
    child_name: overrides?.child_name ?? "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
    contact_date: overrides?.contact_date ?? now.toISOString().split("T")[0],
    contact_type: overrides?.contact_type ?? "face_to_face_supervised",
    contact_outcome: overrides?.contact_outcome ?? "positive",
    court_order_status: overrides?.court_order_status ?? "agreed_informally",
    child_experience: overrides?.child_experience ?? "happy_engaged",
    parent_carer_name: overrides?.parent_carer_name ?? "Parent A",
    duration_minutes: overrides?.duration_minutes ?? 60,
    supervised: overrides?.supervised ?? true,
    supervisor_name: "supervisor_name" in (overrides ?? {}) ? (overrides!.supervisor_name ?? null) : null,
    court_order_complied: overrides?.court_order_complied ?? true,
    child_views_before: overrides?.child_views_before ?? true,
    child_views_after: overrides?.child_views_after ?? true,
    social_worker_informed: overrides?.social_worker_informed ?? true,
    recorded_in_care_plan: overrides?.recorded_in_care_plan ?? true,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(), updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("parental-contact-arrangement-service", () => {
  describe("computeParentalContactMetrics", () => {
    it("returns zeros for empty", () => { const m = computeParentalContactMetrics([]); expect(m.total_contacts).toBe(0); expect(m.negative_count).toBe(0); expect(m.cancelled_count).toBe(0); expect(m.court_order_non_compliant_count).toBe(0); expect(m.refused_count).toBe(0); expect(m.child_views_before_rate).toBe(0); expect(m.child_views_after_rate).toBe(0); expect(m.social_worker_informed_rate).toBe(0); expect(m.recorded_in_care_plan_rate).toBe(0); expect(m.court_compliance_rate).toBe(0); expect(m.unique_children).toBe(0); });
    it("returns empty breakdowns for empty", () => { const m = computeParentalContactMetrics([]); expect(m.outcome_breakdown).toEqual({}); expect(m.experience_breakdown).toEqual({}); });
    it("total_contacts counts rows", () => { expect(computeParentalContactMetrics([makeRow(), makeRow(), makeRow()]).total_contacts).toBe(3); });
    it("counts negative outcomes", () => { expect(computeParentalContactMetrics([makeRow({ contact_outcome: "negative" })]).negative_count).toBe(1); });
    it("does not count positive as negative", () => { expect(computeParentalContactMetrics([makeRow({ contact_outcome: "positive" })]).negative_count).toBe(0); });
    it("counts cancelled_by_parent", () => { expect(computeParentalContactMetrics([makeRow({ contact_outcome: "cancelled_by_parent" })]).cancelled_count).toBe(1); });
    it("counts cancelled_by_child", () => { expect(computeParentalContactMetrics([makeRow({ contact_outcome: "cancelled_by_child" })]).cancelled_count).toBe(1); });
    it("cancelled_count combines both types", () => { const m = computeParentalContactMetrics([makeRow({ contact_outcome: "cancelled_by_parent" }), makeRow({ contact_outcome: "cancelled_by_child" })]); expect(m.cancelled_count).toBe(2); });
    it("counts court_order_non_compliant when court_ordered and not complied", () => { expect(computeParentalContactMetrics([makeRow({ court_order_status: "court_ordered", court_order_complied: false })]).court_order_non_compliant_count).toBe(1); });
    it("does not count court_order_non_compliant when complied", () => { expect(computeParentalContactMetrics([makeRow({ court_order_status: "court_ordered", court_order_complied: true })]).court_order_non_compliant_count).toBe(0); });
    it("does not count court_order_non_compliant for non-court-ordered", () => { expect(computeParentalContactMetrics([makeRow({ court_order_status: "agreed_informally", court_order_complied: false })]).court_order_non_compliant_count).toBe(0); });
    it("counts refused_contact", () => { expect(computeParentalContactMetrics([makeRow({ child_experience: "refused_contact" })]).refused_count).toBe(1); });
    it("does not count happy_engaged as refused", () => { expect(computeParentalContactMetrics([makeRow({ child_experience: "happy_engaged" })]).refused_count).toBe(0); });
    it("child_views_before_rate 100 with default", () => { expect(computeParentalContactMetrics([makeRow()]).child_views_before_rate).toBe(100); });
    it("child_views_before_rate 0 when false", () => { expect(computeParentalContactMetrics([makeRow({ child_views_before: false })]).child_views_before_rate).toBe(0); });
    it("child_views_after_rate 100 with default", () => { expect(computeParentalContactMetrics([makeRow()]).child_views_after_rate).toBe(100); });
    it("child_views_after_rate 0 when false", () => { expect(computeParentalContactMetrics([makeRow({ child_views_after: false })]).child_views_after_rate).toBe(0); });
    it("social_worker_informed_rate 100 with default", () => { expect(computeParentalContactMetrics([makeRow()]).social_worker_informed_rate).toBe(100); });
    it("recorded_in_care_plan_rate 100 with default", () => { expect(computeParentalContactMetrics([makeRow()]).recorded_in_care_plan_rate).toBe(100); });
    it("mixed boolean rate", () => { const m = computeParentalContactMetrics([makeRow({ child_views_before: true }), makeRow({ child_views_before: false }), makeRow({ child_views_before: true })]); expect(m.child_views_before_rate).toBe(66.7); });
    it("court_compliance_rate 100 when all court_ordered rows complied", () => { const m = computeParentalContactMetrics([makeRow({ court_order_status: "court_ordered", court_order_complied: true })]); expect(m.court_compliance_rate).toBe(100); });
    it("court_compliance_rate 0 when no court_ordered rows complied", () => { const m = computeParentalContactMetrics([makeRow({ court_order_status: "court_ordered", court_order_complied: false })]); expect(m.court_compliance_rate).toBe(0); });
    it("court_compliance_rate only considers court_ordered rows", () => { const m = computeParentalContactMetrics([makeRow({ court_order_status: "court_ordered", court_order_complied: true }), makeRow({ court_order_status: "agreed_informally", court_order_complied: false })]); expect(m.court_compliance_rate).toBe(100); });
    it("court_compliance_rate 0 when no court_ordered rows exist", () => { const m = computeParentalContactMetrics([makeRow({ court_order_status: "agreed_informally" })]); expect(m.court_compliance_rate).toBe(0); });
    it("court_compliance_rate mixed", () => { const m = computeParentalContactMetrics([makeRow({ court_order_status: "court_ordered", court_order_complied: true }), makeRow({ court_order_status: "court_ordered", court_order_complied: false }), makeRow({ court_order_status: "court_ordered", court_order_complied: true })]); expect(m.court_compliance_rate).toBe(66.7); });
    it("unique_children distinct", () => { const m = computeParentalContactMetrics([makeRow({ child_name: "A" }), makeRow({ child_name: "B" }), makeRow({ child_name: "A" })]); expect(m.unique_children).toBe(2); });
    it("unique_children single", () => { expect(computeParentalContactMetrics([makeRow()]).unique_children).toBe(1); });
    it("outcome_breakdown counts all 5 outcomes", () => { const outcomes = ["positive","mixed","negative","cancelled_by_parent","cancelled_by_child"] as const; const rows = outcomes.map(o => makeRow({ contact_outcome: o })); const m = computeParentalContactMetrics(rows); for (const o of outcomes) expect(m.outcome_breakdown[o]).toBe(1); });
    it("outcome_breakdown accumulates duplicates", () => { const m = computeParentalContactMetrics([makeRow({ contact_outcome: "positive" }), makeRow({ contact_outcome: "positive" })]); expect(m.outcome_breakdown["positive"]).toBe(2); });
    it("experience_breakdown counts all 10 experiences", () => { const experiences = ["happy_engaged","anxious_before","settled_during","upset_after","refused_contact","indifferent","excited","withdrawn","angry_aggressive","mixed_emotions"] as const; const rows = experiences.map(e => makeRow({ child_experience: e })); const m = computeParentalContactMetrics(rows); for (const e of experiences) expect(m.experience_breakdown[e]).toBe(1); });
    it("experience_breakdown accumulates duplicates", () => { const m = computeParentalContactMetrics([makeRow({ child_experience: "happy_engaged" }), makeRow({ child_experience: "happy_engaged" })]); expect(m.experience_breakdown["happy_engaged"]).toBe(2); });
  });

  describe("computeParentalContactAlerts", () => {
    it("returns empty for empty", () => { expect(computeParentalContactAlerts([])).toEqual([]); });
    it("returns empty for clean rows", () => { expect(computeParentalContactAlerts([makeRow()])).toEqual([]); });
    it("fires court_order_breach_negative", () => { const a = computeParentalContactAlerts([makeRow({ court_order_status: "court_ordered", court_order_complied: false, contact_outcome: "negative", child_name: "Jo", parent_carer_name: "Mum" })]); expect(a[0].type).toBe("court_order_breach_negative"); expect(a[0].severity).toBe("critical"); expect(a[0].message).toContain("Jo"); expect(a[0].message).toContain("Mum"); expect(a[0].record_id).toBe("a-1"); });
    it("court_order_breach_negative per-record", () => { const a = computeParentalContactAlerts([makeRow({ id: "a-1", court_order_status: "court_ordered", court_order_complied: false, contact_outcome: "negative" }), makeRow({ id: "a-2", court_order_status: "court_ordered", court_order_complied: false, contact_outcome: "negative" })]); expect(a.filter(x => x.type === "court_order_breach_negative")).toHaveLength(2); });
    it("no court_order_breach if complied", () => { expect(computeParentalContactAlerts([makeRow({ court_order_status: "court_ordered", court_order_complied: true, contact_outcome: "negative" })]).filter(x => x.type === "court_order_breach_negative")).toHaveLength(0); });
    it("no court_order_breach if not negative outcome", () => { expect(computeParentalContactAlerts([makeRow({ court_order_status: "court_ordered", court_order_complied: false, contact_outcome: "positive" })]).filter(x => x.type === "court_order_breach_negative")).toHaveLength(0); });
    it("no court_order_breach if not court_ordered", () => { expect(computeParentalContactAlerts([makeRow({ court_order_status: "agreed_informally", court_order_complied: false, contact_outcome: "negative" })]).filter(x => x.type === "court_order_breach_negative")).toHaveLength(0); });
    it("fires repeated_cancellations for same child with 2+", () => { const a = computeParentalContactAlerts([makeRow({ child_name: "Jo", contact_outcome: "cancelled_by_parent" }), makeRow({ child_name: "Jo", contact_outcome: "cancelled_by_child" })]); const f = a.find(x => x.type === "repeated_cancellations"); expect(f).toBeDefined(); expect(f!.severity).toBe("high"); expect(f!.message).toContain("2 cancelled"); expect(f!.message).toContain("Jo"); });
    it("repeated_cancellations not for 1 cancellation", () => { expect(computeParentalContactAlerts([makeRow({ child_name: "Jo", contact_outcome: "cancelled_by_parent" })]).find(x => x.type === "repeated_cancellations")).toBeUndefined(); });
    it("repeated_cancellations separate per child", () => { const a = computeParentalContactAlerts([makeRow({ child_name: "Jo", contact_outcome: "cancelled_by_parent" }), makeRow({ child_name: "Jo", contact_outcome: "cancelled_by_child" }), makeRow({ child_name: "Sam", contact_outcome: "cancelled_by_parent" })]); const f = a.filter(x => x.type === "repeated_cancellations"); expect(f).toHaveLength(1); expect(f[0].message).toContain("Jo"); });
    it("child_views_not_captured not for 1", () => { expect(computeParentalContactAlerts([makeRow({ child_views_before: false })]).find(x => x.type === "child_views_not_captured")).toBeUndefined(); });
    it("child_views_not_captured fires for 2 missing before", () => { const a = computeParentalContactAlerts([makeRow({ child_views_before: false }), makeRow({ child_views_before: false })]); const f = a.find(x => x.type === "child_views_not_captured"); expect(f).toBeDefined(); expect(f!.severity).toBe("high"); expect(f!.message).toContain("2 contacts"); });
    it("child_views_not_captured fires for 2 missing after", () => { const a = computeParentalContactAlerts([makeRow({ child_views_after: false }), makeRow({ child_views_after: false })]); const f = a.find(x => x.type === "child_views_not_captured"); expect(f).toBeDefined(); expect(f!.severity).toBe("high"); });
    it("child_views_not_captured counts mixed before/after missing", () => { const a = computeParentalContactAlerts([makeRow({ child_views_before: false, child_views_after: true }), makeRow({ child_views_before: true, child_views_after: false })]); const f = a.find(x => x.type === "child_views_not_captured"); expect(f).toBeDefined(); expect(f!.message).toContain("2 contacts"); });
    it("sw_not_informed_court_ordered fires singular", () => { const a = computeParentalContactAlerts([makeRow({ court_order_status: "court_ordered", social_worker_informed: false })]); const f = a.find(x => x.type === "sw_not_informed_court_ordered"); expect(f).toBeDefined(); expect(f!.severity).toBe("medium"); expect(f!.message).toContain("1 court-ordered contact has"); });
    it("sw_not_informed_court_ordered fires plural", () => { const a = computeParentalContactAlerts([makeRow({ court_order_status: "court_ordered", social_worker_informed: false }), makeRow({ court_order_status: "court_ordered", social_worker_informed: false })]); const f = a.find(x => x.type === "sw_not_informed_court_ordered"); expect(f!.message).toContain("2 court-ordered contacts have"); });
    it("sw_not_informed not for non-court-ordered", () => { expect(computeParentalContactAlerts([makeRow({ court_order_status: "agreed_informally", social_worker_informed: false })]).find(x => x.type === "sw_not_informed_court_ordered")).toBeUndefined(); });
    it("fires all applicable alerts", () => { const a = computeParentalContactAlerts([makeRow({ id: "a-1", court_order_status: "court_ordered", court_order_complied: false, contact_outcome: "negative", child_views_before: false, child_views_after: false, social_worker_informed: false, child_name: "Jo" }), makeRow({ id: "a-2", child_name: "Jo", contact_outcome: "cancelled_by_parent", child_views_before: false, court_order_status: "court_ordered", social_worker_informed: false }), makeRow({ id: "a-3", child_name: "Jo", contact_outcome: "cancelled_by_child", child_views_after: false })]); const types = a.map(x => x.type); expect(types).toContain("court_order_breach_negative"); expect(types).toContain("repeated_cancellations"); expect(types).toContain("child_views_not_captured"); expect(types).toContain("sw_not_informed_court_ordered"); });
  });

  describe("generateParentalContactCaraInsights", () => {
    it("returns 3 insights for empty data", () => { const m = computeParentalContactMetrics([]); const a = computeParentalContactAlerts([]); const insights = generateParentalContactCaraInsights(m, a); expect(insights).toHaveLength(3); });
    it("insight 1 starts with [pink]", () => { const m = computeParentalContactMetrics([]); const a = computeParentalContactAlerts([]); expect(generateParentalContactCaraInsights(m, a)[0]).toMatch(/^\[pink\]/); });
    it("insight 2 starts with [amber]", () => { const m = computeParentalContactMetrics([]); const a = computeParentalContactAlerts([]); expect(generateParentalContactCaraInsights(m, a)[1]).toMatch(/^\[amber\]/); });
    it("insight 3 starts with [reflect]", () => { const m = computeParentalContactMetrics([]); const a = computeParentalContactAlerts([]); expect(generateParentalContactCaraInsights(m, a)[2]).toMatch(/^\[reflect\]/); });
    it("insight 1 contains total contacts count", () => { const m = computeParentalContactMetrics([makeRow(), makeRow()]); const a = computeParentalContactAlerts([makeRow(), makeRow()]); expect(generateParentalContactCaraInsights(m, a)[0]).toContain("2 parental contact arrangements"); });
    it("insight 1 contains unique children count", () => { const m = computeParentalContactMetrics([makeRow({ child_name: "A" }), makeRow({ child_name: "B" })]); const a = computeParentalContactAlerts([]); expect(generateParentalContactCaraInsights(m, a)[0]).toContain("2 children"); });
    it("insight 1 uses singular child for 1", () => { const m = computeParentalContactMetrics([makeRow()]); const a = computeParentalContactAlerts([]); expect(generateParentalContactCaraInsights(m, a)[0]).toContain("1 child"); });
    it("insight 1 contains negative count and percentage", () => { const m = computeParentalContactMetrics([makeRow({ contact_outcome: "negative" })]); const a = computeParentalContactAlerts([]); expect(generateParentalContactCaraInsights(m, a)[0]).toContain("1 (100%)"); });
    it("insight 1 contains cancelled and refused counts", () => { const m = computeParentalContactMetrics([makeRow({ contact_outcome: "cancelled_by_parent" }), makeRow({ child_experience: "refused_contact" })]); const a = computeParentalContactAlerts([]); const i = generateParentalContactCaraInsights(m, a)[0]; expect(i).toContain("1 cancelled"); expect(i).toContain("1 refused"); });
    it("insight 1 contains court compliance rate", () => { const m = computeParentalContactMetrics([makeRow({ court_order_status: "court_ordered", court_order_complied: true })]); const a = computeParentalContactAlerts([]); expect(generateParentalContactCaraInsights(m, a)[0]).toContain("100%"); });
    it("insight 2 mentions critical and high alert counts", () => { const rows = [makeRow({ court_order_status: "court_ordered", court_order_complied: false, contact_outcome: "negative", child_views_before: false, child_views_after: false }), makeRow({ child_views_before: false })]; const m = computeParentalContactMetrics(rows); const a = computeParentalContactAlerts(rows); const i = generateParentalContactCaraInsights(m, a)[1]; expect(i).toContain("1 critical"); expect(i).toContain("1 high-priority"); });
    it("insight 2 shows no concerns when none", () => { const m = computeParentalContactMetrics([makeRow()]); const a = computeParentalContactAlerts([makeRow()]); expect(generateParentalContactCaraInsights(m, a)[1]).toContain("No critical or high-priority concerns"); });
    it("insight 2 contains child views rates", () => { const m = computeParentalContactMetrics([makeRow()]); const a = computeParentalContactAlerts([]); const i = generateParentalContactCaraInsights(m, a)[1]; expect(i).toContain("Child views before rate"); expect(i).toContain("Child views after rate"); });
    it("insight 3 contains reflective question", () => { const m = computeParentalContactMetrics([]); const a = computeParentalContactAlerts([]); const i = generateParentalContactCaraInsights(m, a)[2]; expect(i).toContain("contact arrangements"); expect(i).toContain("child"); });
  });
});
