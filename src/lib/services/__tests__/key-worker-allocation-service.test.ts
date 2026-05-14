import { describe, it, expect } from "vitest";
import { _testing, type KeyWorkerAllocationRecord } from "../key-worker-allocation-service";

const { computeKeyWorkerAllocationMetrics, identifyKeyWorkerAllocationAlerts } = _testing;

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRecord(overrides?: Partial<KeyWorkerAllocationRecord>): KeyWorkerAllocationRecord {
  return {
    id: overrides?.id ?? "a-1", home_id: overrides?.home_id ?? "home-1",
    allocation_status: overrides?.allocation_status ?? "active",
    relationship_quality: overrides?.relationship_quality ?? "good",
    workload_level: overrides?.workload_level ?? "balanced",
    continuity_rating: overrides?.continuity_rating ?? "stable",
    review_date: overrides?.review_date ?? now.toISOString().split("T")[0],
    child_name: overrides?.child_name ?? "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
    key_worker_name: overrides?.key_worker_name ?? "Staff A",
    reviewed_by: overrides?.reviewed_by ?? "Manager A",
    child_views_sought: overrides?.child_views_sought ?? true,
    child_choice_considered: overrides?.child_choice_considered ?? true,
    regular_sessions_held: overrides?.regular_sessions_held ?? true,
    care_plan_involvement: overrides?.care_plan_involvement ?? true,
    advocacy_role_fulfilled: overrides?.advocacy_role_fulfilled ?? true,
    training_appropriate: overrides?.training_appropriate ?? true,
    supervision_discussed: overrides?.supervision_discussed ?? true,
    handover_plan_exists: overrides?.handover_plan_exists ?? true,
    backup_worker_identified: overrides?.backup_worker_identified ?? true,
    social_worker_informed: overrides?.social_worker_informed ?? true,
    relationship_supported: overrides?.relationship_supported ?? true,
    recorded_promptly: overrides?.recorded_promptly ?? true,
    issues_found: overrides?.issues_found ?? [], actions_taken: overrides?.actions_taken ?? [],
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(), updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("key-worker-allocation-service", () => {
  describe("computeKeyWorkerAllocationMetrics", () => {
    it("returns zeros for empty", () => { const m = computeKeyWorkerAllocationMetrics([]); expect(m.total_allocations).toBe(0); expect(m.unallocated_count).toBe(0); expect(m.broken_down_count).toBe(0); expect(m.overloaded_count).toBe(0); expect(m.no_continuity_count).toBe(0); expect(m.child_views_rate).toBe(0); expect(m.unique_children).toBe(0); });
    it("returns empty breakdowns", () => { const m = computeKeyWorkerAllocationMetrics([]); expect(m.by_allocation_status).toEqual({}); expect(m.by_relationship_quality).toEqual({}); expect(m.by_workload_level).toEqual({}); expect(m.by_continuity_rating).toEqual({}); });
    it("total_allocations counts records", () => { expect(computeKeyWorkerAllocationMetrics([makeRecord(), makeRecord()]).total_allocations).toBe(2); });
    it("counts unallocated", () => { expect(computeKeyWorkerAllocationMetrics([makeRecord({ allocation_status: "unallocated" })]).unallocated_count).toBe(1); });
    it("counts broken_down", () => { expect(computeKeyWorkerAllocationMetrics([makeRecord({ relationship_quality: "broken_down" })]).broken_down_count).toBe(1); });
    it("does not count strained as broken_down", () => { expect(computeKeyWorkerAllocationMetrics([makeRecord({ relationship_quality: "strained" })]).broken_down_count).toBe(0); });
    it("counts overloaded", () => { expect(computeKeyWorkerAllocationMetrics([makeRecord({ workload_level: "overloaded" })]).overloaded_count).toBe(1); });
    it("counts no_continuity", () => { expect(computeKeyWorkerAllocationMetrics([makeRecord({ continuity_rating: "no_continuity" })]).no_continuity_count).toBe(1); });
    it("returns 100% boolean rates with defaults", () => { const m = computeKeyWorkerAllocationMetrics([makeRecord()]); expect(m.child_views_rate).toBe(100); expect(m.child_choice_rate).toBe(100); expect(m.regular_sessions_rate).toBe(100); expect(m.care_plan_rate).toBe(100); expect(m.advocacy_rate).toBe(100); expect(m.training_rate).toBe(100); expect(m.supervision_rate).toBe(100); expect(m.handover_rate).toBe(100); expect(m.backup_worker_rate).toBe(100); expect(m.social_worker_rate).toBe(100); expect(m.relationship_supported_rate).toBe(100); expect(m.recorded_promptly_rate).toBe(100); });
    it("child_views_rate 0 when false", () => { expect(computeKeyWorkerAllocationMetrics([makeRecord({ child_views_sought: false })]).child_views_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeKeyWorkerAllocationMetrics([makeRecord({ regular_sessions_held: true }), makeRecord({ regular_sessions_held: false }), makeRecord({ regular_sessions_held: true })]); expect(m.regular_sessions_rate).toBe(66.7); });
    it("unique_children distinct", () => { const m = computeKeyWorkerAllocationMetrics([makeRecord({ child_name: "A" }), makeRecord({ child_name: "B" }), makeRecord({ child_name: "A" })]); expect(m.unique_children).toBe(2); });
    it("counts all 10 allocation statuses", () => { const statuses = ["active","temporary_cover","pending_allocation","recently_changed","under_review","on_leave_cover","supervision_only","dual_key_worker","unallocated","other"] as const; const records = statuses.map(s => makeRecord({ allocation_status: s })); const m = computeKeyWorkerAllocationMetrics(records); for (const s of statuses) expect(m.by_allocation_status[s]).toBe(1); });
    it("counts all 5 relationship qualities", () => { const qualities = ["excellent","good","developing","strained","broken_down"] as const; const records = qualities.map(q => makeRecord({ relationship_quality: q })); const m = computeKeyWorkerAllocationMetrics(records); for (const q of qualities) expect(m.by_relationship_quality[q]).toBe(1); });
    it("counts all 5 workload levels", () => { const levels = ["under_capacity","balanced","manageable","heavy","overloaded"] as const; const records = levels.map(l => makeRecord({ workload_level: l })); const m = computeKeyWorkerAllocationMetrics(records); for (const l of levels) expect(m.by_workload_level[l]).toBe(1); });
    it("counts all 5 continuity ratings", () => { const ratings = ["very_stable","stable","some_changes","frequent_changes","no_continuity"] as const; const records = ratings.map(r => makeRecord({ continuity_rating: r })); const m = computeKeyWorkerAllocationMetrics(records); for (const r of ratings) expect(m.by_continuity_rating[r]).toBe(1); });
  });

  describe("identifyKeyWorkerAllocationAlerts", () => {
    it("returns empty for clean", () => { expect(identifyKeyWorkerAllocationAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyKeyWorkerAllocationAlerts([])).toEqual([]); });
    it("fires unallocated_broken_down", () => { const a = identifyKeyWorkerAllocationAlerts([makeRecord({ allocation_status: "unallocated", relationship_quality: "broken_down", child_name: "Jo" })]); expect(a[0].type).toBe("unallocated_broken_down"); expect(a[0].severity).toBe("critical"); expect(a[0].message).toContain("Jo"); });
    it("unallocated_broken_down per-record", () => { const a = identifyKeyWorkerAllocationAlerts([makeRecord({ id: "a-1", allocation_status: "unallocated", relationship_quality: "broken_down" }), makeRecord({ id: "a-2", allocation_status: "unallocated", relationship_quality: "broken_down" })]); expect(a.filter(x => x.type === "unallocated_broken_down")).toHaveLength(2); });
    it("unallocated with good relationship no critical alert", () => { expect(identifyKeyWorkerAllocationAlerts([makeRecord({ allocation_status: "unallocated", relationship_quality: "good" })]).find(x => x.type === "unallocated_broken_down")).toBeUndefined(); });
    it("active with broken_down no critical alert", () => { expect(identifyKeyWorkerAllocationAlerts([makeRecord({ allocation_status: "active", relationship_quality: "broken_down" })]).find(x => x.type === "unallocated_broken_down")).toBeUndefined(); });
    it("fires children_unallocated singular", () => { const a = identifyKeyWorkerAllocationAlerts([makeRecord({ allocation_status: "unallocated" })]); const f = a.find(x => x.type === "children_unallocated"); expect(f).toBeDefined(); expect(f!.severity).toBe("high"); expect(f!.message).toContain("1 child is"); });
    it("children_unallocated plural", () => { const a = identifyKeyWorkerAllocationAlerts([makeRecord({ allocation_status: "unallocated" }), makeRecord({ allocation_status: "unallocated" })]); const f = a.find(x => x.type === "children_unallocated"); expect(f!.message).toContain("2 children are"); });
    it("fires no_regular_sessions singular", () => { const a = identifyKeyWorkerAllocationAlerts([makeRecord({ regular_sessions_held: false })]); const f = a.find(x => x.type === "no_regular_sessions"); expect(f).toBeDefined(); expect(f!.severity).toBe("high"); expect(f!.message).toContain("1 allocation has"); });
    it("no_regular_sessions plural", () => { const a = identifyKeyWorkerAllocationAlerts([makeRecord({ regular_sessions_held: false }), makeRecord({ regular_sessions_held: false })]); const f = a.find(x => x.type === "no_regular_sessions"); expect(f!.message).toContain("2 allocations have"); });
    it("no_backup_worker not for 1", () => { expect(identifyKeyWorkerAllocationAlerts([makeRecord({ backup_worker_identified: false })]).find(x => x.type === "no_backup_worker")).toBeUndefined(); });
    it("no_backup_worker fires for 2", () => { const a = identifyKeyWorkerAllocationAlerts([makeRecord({ backup_worker_identified: false }), makeRecord({ backup_worker_identified: false })]); expect(a.find(x => x.type === "no_backup_worker")).toBeDefined(); expect(a.find(x => x.type === "no_backup_worker")!.severity).toBe("medium"); });
    it("no_handover_plan not for 1", () => { expect(identifyKeyWorkerAllocationAlerts([makeRecord({ handover_plan_exists: false })]).find(x => x.type === "no_handover_plan")).toBeUndefined(); });
    it("no_handover_plan fires for 2", () => { const a = identifyKeyWorkerAllocationAlerts([makeRecord({ handover_plan_exists: false }), makeRecord({ handover_plan_exists: false })]); expect(a.find(x => x.type === "no_handover_plan")).toBeDefined(); expect(a.find(x => x.type === "no_handover_plan")!.severity).toBe("medium"); });
    it("fires all applicable", () => { const a = identifyKeyWorkerAllocationAlerts([makeRecord({ allocation_status: "unallocated", relationship_quality: "broken_down", regular_sessions_held: false, backup_worker_identified: false, handover_plan_exists: false }), makeRecord({ allocation_status: "unallocated", regular_sessions_held: false, backup_worker_identified: false, handover_plan_exists: false })]); const types = a.map(x => x.type); expect(types).toContain("unallocated_broken_down"); expect(types).toContain("children_unallocated"); expect(types).toContain("no_regular_sessions"); expect(types).toContain("no_backup_worker"); expect(types).toContain("no_handover_plan"); });
  });
});
